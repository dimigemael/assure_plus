<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Contract;
use App\Services\InsuranceBlockchainService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class ContractController extends Controller
{
    private InsuranceBlockchainService $blockchainService;

    public function __construct(InsuranceBlockchainService $blockchainService)
    {
        $this->blockchainService = $blockchainService;
    }

    /**
     * Liste des contrats de l'utilisateur connecté
     * GET /api/contracts
     */
    public function index()
    {
        // On récupère l'utilisateur connecté via le Token
        $user = Auth::user();
        
        // On récupère uniquement SES contrats
        $contracts = $user->contracts;

        return response()->json([
            'status' => 'success',
            'data' => $contracts
        ]);
    }

    /**
     * Créer un nouveau contrat (Souscription)
     * POST /api/contracts
     */
    public function store(Request $request)
    {
        // 1. Validation des données du formulaire
        $validator = Validator::make($request->all(), [
            'type_assurance' => 'required|string',
            'montant_couverture' => 'required|numeric',
            'prime_mensuelle' => 'required|numeric',
            'date_debut' => 'required|date',
            'date_fin' => 'required|date|after:date_debut',
            'ethereum_address' => 'nullable|string|regex:/^0x[a-fA-F0-9]{40}$/', // Adresse Ethereum optionnelle
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        // 2. Création du contrat relié à l'utilisateur connecté
        $contract = Contract::create([
            'user_id' => Auth::id(),
            'type_assurance' => $request->type_assurance,
            'montant_couverture' => $request->montant_couverture,
            'prime' => $request->prime_mensuelle,
            'date_debut' => $request->date_debut,
            'date_fin' => $request->date_fin,
            'status' => 'brouillon',
        ]);

        // 3. Intégration blockchain (si adresse Ethereum fournie)
        if ($request->has('ethereum_address')) {
            try {
                // Créer la police sur la blockchain
                $blockchainResult = $this->blockchainService->createPolicy(
                    $contract,
                    $request->ethereum_address
                );

                // Mettre à jour le contrat avec les infos blockchain
                $contract->update([
                    'blockchain_policy_id' => $blockchainResult['policyId'],
                    'transaction_hash' => $blockchainResult['txHash'],
                    'smart_contract_address' => $this->blockchainService->getContractAddress(),
                    'status' => 'actif', // Le contrat devient actif une fois sur la blockchain
                ]);

                return response()->json([
                    'message' => 'Contrat créé avec succès et enregistré sur la blockchain',
                    'contrat' => $contract,
                    'blockchain' => [
                        'policy_id' => $blockchainResult['policyId'],
                        'transaction_hash' => $blockchainResult['txHash'],
                        'contract_address' => $this->blockchainService->getContractAddress(),
                    ]
                ], 201);

            } catch (\Exception $e) {
                Log::error('Failed to create policy on blockchain', [
                    'contract_id' => $contract->id,
                    'error' => $e->getMessage()
                ]);

                return response()->json([
                    'message' => 'Contrat créé en base de données mais échec blockchain',
                    'contrat' => $contract,
                    'error' => $e->getMessage()
                ], 201);
            }
        }

        return response()->json([
            'message' => 'Contrat créé avec succès (Brouillon - pas encore sur blockchain)',
            'contrat' => $contract,
            'info' => 'Fournissez une adresse Ethereum pour enregistrer sur la blockchain'
        ], 201);
    }
}