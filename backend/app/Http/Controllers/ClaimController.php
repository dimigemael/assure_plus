<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreClaimRequest;
use App\Models\Claim;
use App\Models\Contract;
use App\Services\InsuranceBlockchainService;
use App\Services\IPFSService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ClaimController extends Controller
{
    private InsuranceBlockchainService $blockchainService;
    private IPFSService $ipfsService;

    public function __construct(
        InsuranceBlockchainService $blockchainService,
        IPFSService $ipfsService
    ) {
        $this->blockchainService = $blockchainService;
        $this->ipfsService = $ipfsService;
    }

    /**
     * Déclarer un sinistre avec upload de preuve sur IPFS. (POST /claims)
     */
    public function store(StoreClaimRequest $request)
    {
        // 1. Validation Automatique (via StoreClaimRequest)

        // 2. Récupérer l'utilisateur connecté via JWT
        $user = Auth::guard('api')->user();

        // 3. Vérifier que le contrat appartient bien à cet utilisateur
        $contract = Contract::where('id', $request->contract_id)
                            ->where('user_id', $user->id)
                            ->first();

        if (!$contract) {
            return response()->json(['error' => 'Ce contrat ne vous appartient pas ou n\'existe pas.'], 403);
        }

        // 4. Gestion de l'Upload vers IPFS via IPFSService
        $ipfsHash = null;
        $fileName = null;
        $gatewayUrl = null;

        if ($request->hasFile('proof_file')) {
            $file = $request->file('proof_file');
            $fileName = $file->getClientOriginalName();

            try {
                // Vérifier si IPFS est disponible
                if (!$this->ipfsService->isAvailable()) {
                    return response()->json([
                        'message' => 'IPFS n\'est pas disponible.',
                        'conseil' => 'Vérifiez que le daemon IPFS est démarré.'
                    ], 503);
                }

                // Upload via IPFSService
                $ipfsResult = $this->ipfsService->uploadFile($file);
                $ipfsHash = $ipfsResult['hash'];
                $gatewayUrl = $ipfsResult['gateway_url'];

                Log::info('Fichier uploadé vers IPFS', [
                    'hash' => $ipfsHash,
                    'filename' => $fileName,
                    'claim_user' => $user->id,
                ]);

            } catch (\Exception $e) {
                Log::error('Erreur upload IPFS dans ClaimController', [
                    'error' => $e->getMessage(),
                    'file' => $fileName,
                ]);

                return response()->json([
                    'message' => 'Impossible d\'uploader le fichier vers IPFS.',
                    'erreur_technique' => $e->getMessage()
                ], 500);
            }
        }

        // 5. Création du Sinistre en Base de Données
        $claim = Claim::create([
            'contract_id' => $contract->id,
            'user_id' => $user->id,
            'description' => $request->description,
            'montant_reclame' => $request->montant_reclame,
            'status' => 'en_attente',
            'proof_file' => $fileName,
            'ipfs_hash' => $ipfsHash
        ]);

        // 6. Intégration blockchain (si le contrat a un blockchain_policy_id)
        if ($contract->blockchain_policy_id && $ipfsHash && $request->has('ethereum_address')) {
            try {
                $blockchainResult = $this->blockchainService->declareClaim(
                    $claim,
                    $contract->blockchain_policy_id,
                    $ipfsHash,
                    $request->ethereum_address
                );

                $claim->update([
                    'blockchain_claim_id' => $blockchainResult['claimId'],
                    'transaction_hash' => $blockchainResult['txHash'],
                ]);

                return response()->json([
                    'message' => 'Sinistre déclaré avec succès sur blockchain et IPFS',
                    'claim' => $claim,
                    'blockchain' => [
                        'claim_id' => $blockchainResult['claimId'],
                        'transaction_hash' => $blockchainResult['txHash'],
                    ],
                    'ipfs' => [
                        'hash' => $ipfsHash,
                        'gateway_url' => $gatewayUrl,
                    ]
                ], 201);

            } catch (\Exception $e) {
                Log::error('Failed to declare claim on blockchain', [
                    'claim_id' => $claim->id,
                    'error' => $e->getMessage()
                ]);
            }
        }

        return response()->json([
            'message' => 'Sinistre déclaré avec succès (Preuve sécurisée sur IPFS)',
            'claim' => $claim,
            'ipfs' => $ipfsHash ? [
                'hash' => $ipfsHash,
                'gateway_url' => $gatewayUrl,
            ] : null,
            'info' => $contract->blockchain_policy_id
                ? 'Fournissez une adresse Ethereum pour enregistrer sur la blockchain'
                : 'Ce contrat n\'est pas encore sur la blockchain'
        ], 201);
    }

    /**
     * Affiche la liste des sinistres (GET /claims).
     */
    public function index()
    {
        $user = auth()->user();

        // 1. Déterminer les sinistres à afficher selon le rôle
        if ($user->role === 'admin' || $user->role === 'expert') {
            // ADMIN ou EXPERT voit TOUS les sinistres
            $claims = Claim::orderBy('created_at', 'desc')->get(); 
        } else {
            // Utilisateur CLÉ voit SEULEMENT ses propres sinistres
            $claims = Claim::where('user_id', $user->id)
                           ->orderBy('created_at', 'desc')
                           ->get();
        }

        // 2. Retourner la réponse JSON avec la liste des sinistres
        return response()->json($claims, 200);
    }
    
    /**
     * Affiche les détails d'un sinistre spécifique (GET /claims/{id}).
     */
     public function show(int $id)
    {
        // 1. Chercher le sinistre dans la base de données
        $claim = Claim::find($id); 

        // Gérer le cas où le sinistre n'existe pas
        if (!$claim) {
            return response()->json(['message' => 'Sinistre non trouvé.'], 404);
        }

        // 2. Vérification de l'autorisation (Accès basé sur le user_id ou le rôle)
        // L'utilisateur doit être le créateur du sinistre OU un administrateur/expert.
        $user = auth()->user();
        if ($user->role !== 'admin' && $user->role !== 'expert' && $user->id !== $claim->user_id) {
            return response()->json(['message' => 'Accès refusé. Vous n\'êtes pas le propriétaire ni un gestionnaire.'], 403);
        }

        // 3. Retourner la réponse JSON
        return response()->json($claim, 200);
    }
    
    /**
     * Traite un sinistre (met à jour son statut, expert, commentaires) (PATCH /claims/{id}).
     */
    public function update(Request $request, int $id)
    {
        $user = auth()->user();

        // ÉTAPE 1: VÉRIFICATION DES PERMISSIONS DE TRAITEMENT
        // Seuls les utilisateurs 'admin' ou 'expert' sont autorisés à utiliser la méthode UPDATE.
        if (!in_array($user->role, ['admin', 'expert'])) {
            return response()->json(['message' => 'Non autorisé. Seuls les administrateurs/experts peuvent modifier les sinistres.'], 403);
        }

        // ÉTAPE 2: TROUVER LA RESSOURCE
        // Utilisez findOrFail() si l'on veut qu'un 404 automatique soit généré en cas de non-existence
        $claim = Claim::find($id);

        if (!$claim) {
            return response()->json(['message' => 'Sinistre non trouvé.'], 404);
        }

        // ÉTAPE 3: VÉRIFICATION & PRÉPARATION DES DONNÉES
        // Utilisation de 'required' pour 'status' pour s'assurer que l'utilisateur envoie bien une action
        $validatedData = $request->validate([
            'status' => 'required|in:en_attente,approuvé,rejeté,payé', 
            'commentaire_expert' => 'sometimes|nullable|string',
            'montant_approuve' => 'sometimes|nullable|numeric' 
        ]);

        // Ajout/Mise à jour automatique de l'expert ID (celui qui effectue l'action)
        $validatedData['expert_id'] = $user->id;

        // ÉTAPE 4: MISE À JOUR (Utilisation de l'Update sécurisée par Mass Assignment - $fillable)
        $claim->update($validatedData);

        // ÉTAPE 5: Intégration blockchain (si le sinistre est sur la blockchain et qu'on l'approuve/rejette)
        if ($claim->blockchain_claim_id && in_array($validatedData['status'], ['approuvé', 'rejeté'])) {
            if ($request->has('ethereum_address')) {
                try {
                    $approved = ($validatedData['status'] === 'approuvé');

                    $blockchainResult = $this->blockchainService->validateClaim(
                        $claim->blockchain_claim_id,
                        $approved,
                        $request->ethereum_address
                    );

                    $claim->update([
                        'transaction_hash' => $blockchainResult['txHash'],
                    ]);

                    return response()->json([
                        'message' => 'Sinistre validé avec succès sur la blockchain',
                        'claim' => $claim,
                        'blockchain' => [
                            'transaction_hash' => $blockchainResult['txHash'],
                            'status' => $approved ? 'approuvé' : 'rejeté'
                        ]
                    ], 200);

                } catch (\Exception $e) {
                    Log::error('Failed to validate claim on blockchain', [
                        'claim_id' => $claim->id,
                        'error' => $e->getMessage()
                    ]);

                    return response()->json([
                        'message' => 'Sinistre mis à jour en BDD mais échec blockchain',
                        'claim' => $claim,
                        'error' => $e->getMessage()
                    ], 200);
                }
            }
        }

        // 6. Retourner le sinistre mis à jour
        return response()->json([
            'message' => 'Sinistre mis à jour avec succès.',
            'claim' => $claim
        ], 200);
    }


    /**
     * Supprime un sinistre de la base de données.
     * Restriction: Généralement réservé au rôle 'admin'.
     */
    public function destroy(int $id)
    {
        $user = auth()->user();

        // ÉTAPE 1: VÉRIFICATION DE LA PERMISSION
        // L'utilisateur DOIT être l'admin/expert, ou seulement l'admin, selon la politique de sécurité.
        // Option la plus SÛRE : Seul l'Admin peut supprimer.
        if ($user->role !== 'admin') { 
            return response()->json([
                'message' => 'Non autorisé. Seul l\'Administrateur peut supprimer un sinistre.',
                'user_role' => $user->role // Aide au débogage si un Expert reçoit l'erreur.
            ], 403); 
        }

        // ÉTAPE 2: TROUVER LA RESSOURCE
        $claim = Claim::find($id);

        if (!$claim) {
            // Un 404 est correct pour signaler que l'élément n'existe pas ou est déjà supprimé.
            return response()->json(['message' => 'Sinistre non trouvé ou déjà supprimé.'], 404);
        }

        // ÉTAPE 3: SUPPRESSION
        // Si la politique de l'application permet une suppression définitive (et pas une désactivation)
        $claim->delete(); 

        // ÉTAPE 4: Réponse
        return response()->json(['message' => 'Sinistre supprimé avec succès.'], 200);
    }

    
}