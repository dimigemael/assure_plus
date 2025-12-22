<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contract;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ContractController extends Controller
{
    /**
     * Récupérer tous les contrats (avec filtres optionnels)
     */
    public function index(Request $request)
    {
        $query = Contract::with(['user', 'garanties', 'claims']);

        // Filtrer par utilisateur si spécifié
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Filtrer par statut si spécifié
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filtrer par type d'assurance
        if ($request->has('type_assurance')) {
            $query->where('type_assurance', $request->type_assurance);
        }

        $contracts = $query->orderBy('created_at', 'desc')->paginate(15);

        return response()->json($contracts);
    }

    /**
     * Créer un nouveau contrat
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'type_assurance' => 'required|string|max:100',
            'montant_couverture' => 'required|numeric|min:0',
            'prime' => 'required|numeric|min:0',
            'franchise' => 'nullable|numeric|min:0',
            'frequence_paiement' => 'required|in:mensuelle,trimestrielle,semestrielle,annuelle',
            'date_debut' => 'required|date',
            'date_fin' => 'required|date|after:date_debut',
            'date_souscription' => 'nullable|date',
            'wallet_paiement' => 'nullable|string|size:42',
            'beneficiaire_nom' => 'nullable|string|max:255',
            'beneficiaire_relation' => 'nullable|string|max:100',
            'bien_assure' => 'nullable|array',
            'garanties' => 'nullable|array',
            'garanties.*.nom' => 'required|string|max:100',
            'garanties.*.description' => 'nullable|string',
            'garanties.*.plafond_couverture' => 'nullable|numeric|min:0',
            'garanties.*.franchise' => 'nullable|numeric|min:0',
            'garanties.*.obligatoire' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Générer le numéro de police unique
            $numeroPolice = Contract::generateNumeroPolice();

            // Créer le contrat
            $contract = Contract::create([
                'user_id' => $request->user_id,
                'numero_police' => $numeroPolice,
                'wallet_paiement' => $request->wallet_paiement,
                'type_assurance' => $request->type_assurance,
                'bien_assure' => $request->bien_assure,
                'montant_couverture' => $request->montant_couverture,
                'prime' => $request->prime,
                'franchise' => $request->franchise ?? 0,
                'frequence_paiement' => $request->frequence_paiement,
                'date_debut' => $request->date_debut,
                'date_fin' => $request->date_fin,
                'date_souscription' => $request->date_souscription ?? now(),
                'prochaine_echeance' => $request->date_debut,
                'status' => 'brouillon',
                'beneficiaire_nom' => $request->beneficiaire_nom,
                'beneficiaire_relation' => $request->beneficiaire_relation,
            ]);

            // Créer les garanties si fournies
            if ($request->has('garanties') && is_array($request->garanties)) {
                foreach ($request->garanties as $garantieData) {
                    $contract->garanties()->create([
                        'nom' => $garantieData['nom'],
                        'description' => $garantieData['description'] ?? null,
                        'plafond_couverture' => $garantieData['plafond_couverture'] ?? null,
                        'franchise' => $garantieData['franchise'] ?? 0,
                        'obligatoire' => $garantieData['obligatoire'] ?? false,
                        'active' => true,
                    ]);
                }
            }

            // Recharger le contrat avec ses relations
            $contract->load(['user', 'garanties']);

            return response()->json([
                'message' => 'Contrat créé avec succès',
                'contract' => $contract
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la création du contrat',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Afficher un contrat spécifique
     */
    public function show($id)
    {
        $contract = Contract::with(['user', 'garanties', 'claims', 'premiums'])->find($id);

        if (!$contract) {
            return response()->json([
                'message' => 'Contrat non trouvé'
            ], 404);
        }

        return response()->json($contract);
    }

    /**
     * Mettre à jour un contrat
     */
    public function update(Request $request, $id)
    {
        $contract = Contract::find($id);

        if (!$contract) {
            return response()->json([
                'message' => 'Contrat non trouvé'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'type_assurance' => 'sometimes|string|max:100',
            'montant_couverture' => 'sometimes|numeric|min:0',
            'prime' => 'sometimes|numeric|min:0',
            'franchise' => 'nullable|numeric|min:0',
            'status' => 'sometimes|in:brouillon,actif,expire,resilie',
            'motif_resiliation' => 'nullable|string',
            'wallet_paiement' => 'nullable|string|size:42',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $contract->update($request->only([
                'type_assurance',
                'montant_couverture',
                'prime',
                'franchise',
                'status',
                'motif_resiliation',
                'wallet_paiement',
                'bien_assure',
                'beneficiaire_nom',
                'beneficiaire_relation',
            ]));

            $contract->load(['user', 'garanties']);

            return response()->json([
                'message' => 'Contrat mis à jour avec succès',
                'contract' => $contract
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la mise à jour',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Activer un contrat (déployer sur la blockchain)
     */
    public function activate($id)
    {
        $contract = Contract::find($id);

        if (!$contract) {
            return response()->json([
                'message' => 'Contrat non trouvé'
            ], 404);
        }

        if ($contract->status !== 'brouillon') {
            return response()->json([
                'message' => 'Seuls les contrats en brouillon peuvent être activés'
            ], 400);
        }

        try {
            // TODO: Déployer sur la blockchain et récupérer l'adresse du smart contract
            // Pour l'instant, on simule
            $contract->update([
                'status' => 'actif',
                // 'smart_contract_address' => $blockchainAddress,
                // 'transaction_hash' => $transactionHash,
            ]);

            return response()->json([
                'message' => 'Contrat activé avec succès',
                'contract' => $contract
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de l\'activation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Résilier un contrat
     */
    public function cancel(Request $request, $id)
    {
        $contract = Contract::find($id);

        if (!$contract) {
            return response()->json([
                'message' => 'Contrat non trouvé'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'motif_resiliation' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Le motif de résiliation est requis',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $contract->update([
                'status' => 'resilie',
                'motif_resiliation' => $request->motif_resiliation
            ]);

            return response()->json([
                'message' => 'Contrat résilié avec succès',
                'contract' => $contract
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la résiliation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Supprimer un contrat (soft delete ou hard delete)
     */
    public function destroy($id)
    {
        $contract = Contract::find($id);

        if (!$contract) {
            return response()->json([
                'message' => 'Contrat non trouvé'
            ], 404);
        }

        // On ne peut supprimer que les contrats en brouillon
        if ($contract->status !== 'brouillon') {
            return response()->json([
                'message' => 'Seuls les contrats en brouillon peuvent être supprimés'
            ], 400);
        }

        try {
            $contract->delete();

            return response()->json([
                'message' => 'Contrat supprimé avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la suppression',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupérer la liste des utilisateurs assurés (pour le formulaire)
     */
    public function getAssures()
    {
        $assures = User::where('role', 'assure')
            ->select('id', 'nom', 'prenom', 'email', 'wallet_address')
            ->orderBy('nom')
            ->get();

        return response()->json($assures);
    }

    /**
     * Récupérer les statistiques du dashboard admin
     */
    public function dashboardStats()
    {
        \Log::info('=== dashboardStats appelée ===');

        try {
            \Log::info('Début du calcul des statistiques');

            // Statistiques globales
            \Log::info('Calcul des contrats...');
            $totalContracts = Contract::count();
            $activeContracts = Contract::where('status', 'actif')->count();
            $pendingContracts = Contract::where('status', 'brouillon')->count();
            $cancelledContracts = Contract::where('status', 'resilie')->count();
            \Log::info('Contrats calculés', [
                'total' => $totalContracts,
                'actifs' => $activeContracts
            ]);

            // Statistiques utilisateurs
            \Log::info('Calcul des utilisateurs...');
            $totalUsers = User::where('role', 'assure')->count();
            $newUsersThisMonth = User::where('role', 'assure')
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->count();
            \Log::info('Utilisateurs calculés', ['total' => $totalUsers]);

            // Montants financiers
            \Log::info('Calcul des montants financiers...');
            $totalCoverage = Contract::where('status', 'actif')
                ->sum('montant_couverture');
            $totalPremiums = Contract::where('status', 'actif')
                ->sum('prime');
            $monthlyRevenue = \DB::table('premiums')
                ->whereMonth('date_paiement', now()->month)
                ->whereYear('date_paiement', now()->year)
                ->where('statut', 'paye')
                ->sum('montant');
            \Log::info('Montants calculés');

            // Statistiques sinistres
            \Log::info('Calcul des sinistres...');
            $totalClaims = \DB::table('claims')->count();
            $pendingClaims = \DB::table('claims')->where('status', 'en_attente')->count();
            $approvedClaims = \DB::table('claims')->where('status', 'approuvé')->count();
            $rejectedClaims = \DB::table('claims')->where('status', 'rejeté')->count();
            $totalClaimsAmount = \DB::table('claims')
                ->where('status', 'approuvé')
                ->sum('montant_reclame');
            \Log::info('Sinistres calculés', ['total' => $totalClaims]);

            // Contrats par type d'assurance
            \Log::info('Calcul des contrats par type...');
            $contractsByType = Contract::where('status', 'actif')
                ->select('type_assurance', \DB::raw('count(*) as total'))
                ->groupBy('type_assurance')
                ->get();
            \Log::info('Contrats par type calculés');

            // Activité récente (derniers contrats)
            \Log::info('Calcul de l\'activité récente...');
            $recentContracts = Contract::with(['user'])
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get(['id', 'numero_police', 'user_id', 'type_assurance', 'status', 'date_debut', 'created_at'])
                ->map(function ($contract) {
                    return [
                        'numero_police' => $contract->numero_police,
                        'type_assurance' => $contract->type_assurance,
                        'statut' => $contract->status,
                        'date_debut' => $contract->date_debut,
                        'user_name' => $contract->user ? ($contract->user->nom . ' ' . $contract->user->prenom) : 'N/A',
                    ];
                });
            \Log::info('Activité récente calculée');

            // Statistiques blockchain
            \Log::info('Calcul des statistiques blockchain...');
            $blockchainContracts = Contract::whereNotNull('blockchain_policy_id')->count();
            $blockchainPercentage = $activeContracts > 0
                ? round(($blockchainContracts / $activeContracts) * 100, 2)
                : 0;
            \Log::info('Statistiques blockchain calculées');

            // Nombre total de produits d'assurance
            \Log::info('Calcul des produits...');
            $totalProducts = \DB::table('insurance_products')->where('status', 'actif')->count();
            \Log::info('Produits calculés', ['total' => $totalProducts]);

            \Log::info('Préparation de la réponse JSON...');
            $response = [
                'summary' => [
                    'total_contracts' => $totalContracts,
                    'active_contracts' => $activeContracts,
                    'pending_contracts' => $pendingContracts,
                    'cancelled_contracts' => $cancelledContracts,
                    'total_users' => $totalUsers,
                    'total_products' => $totalProducts,
                    'new_users_this_month' => $newUsersThisMonth,
                ],
                'finances' => [
                    'total_coverage' => (float) $totalCoverage,
                    'total_premiums' => (float) $totalPremiums,
                    'monthly_revenue' => (float) $monthlyRevenue,
                ],
                'claims' => [
                    'total_claims' => $totalClaims,
                    'pending_claims' => $pendingClaims,
                    'approved_claims' => $approvedClaims,
                    'rejected_claims' => $rejectedClaims,
                    'total_amount' => (float) $totalClaimsAmount,
                ],
                'blockchain' => [
                    'contracts_on_blockchain' => $blockchainContracts,
                    'blockchain_percentage' => $blockchainPercentage,
                ],
                'contracts_by_type' => $contractsByType,
                'recent_activity' => $recentContracts,
            ];

            \Log::info('Réponse prête, envoi au client');
            return response()->json($response);

        } catch (\Exception $e) {
            \Log::error('=== ERREUR dashboardStats ===');
            \Log::error('Message: ' . $e->getMessage());
            \Log::error('File: ' . $e->getFile());
            \Log::error('Line: ' . $e->getLine());
            \Log::error('Trace: ' . $e->getTraceAsString());

            return response()->json([
                'message' => 'Erreur lors de la récupération des statistiques',
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ], 500);
        }
    }
}
