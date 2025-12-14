<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Premium;
use App\Models\Contract;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class PremiumController extends Controller
{
    /**
     * Lister l'historique des paiements de primes
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Premium::with(['contract.user', 'contract.insuranceProduct']);

            // Filtrer par contrat si fourni
            if ($request->has('contract_id')) {
                $query->where('contract_id', $request->input('contract_id'));
            }

            // Filtrer par statut
            if ($request->has('statut')) {
                $query->where('statut', $request->input('statut'));
            }

            // Filtrer par utilisateur (pour les assurés)
            if ($request->has('user_id')) {
                $query->whereHas('contract', function ($q) use ($request) {
                    $q->where('user_id', $request->input('user_id'));
                });
            }

            // Trier par date de paiement (plus récent en premier)
            $query->orderBy('date_paiement', 'desc');

            // Pagination
            $perPage = $request->input('per_page', 15);
            $premiums = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $premiums,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des primes',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Enregistrer un paiement de prime
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        // Validation
        $validator = Validator::make($request->all(), [
            'contract_id' => 'required|exists:contracts,id',
            'montant' => 'required|numeric|min:0.01',
            'transaction_hash' => 'nullable|string|max:66',
            'block_number' => 'nullable|integer',
        ], [
            'contract_id.required' => 'L\'ID du contrat est requis',
            'contract_id.exists' => 'Le contrat n\'existe pas',
            'montant.required' => 'Le montant est requis',
            'montant.numeric' => 'Le montant doit être un nombre',
            'montant.min' => 'Le montant doit être supérieur à 0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation échouée',
                'errors' => $validator->errors(),
            ], 422);
        }

        DB::beginTransaction();

        try {
            $contract = Contract::findOrFail($request->input('contract_id'));

            // Vérifier que le contrat est actif
            if (!in_array($contract->status, ['actif', 'en_attente'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Le contrat n\'est pas actif',
                ], 400);
            }

            // Créer le paiement de prime
            $premium = Premium::create([
                'contract_id' => $request->input('contract_id'),
                'montant' => $request->input('montant'),
                'date_paiement' => now(),
                'transaction_hash' => $request->input('transaction_hash'),
                'block_number' => $request->input('block_number'),
                'statut' => $request->input('transaction_hash') ? 'payee' : 'en_attente',
            ]);

            // Mettre à jour le contrat si paiement confirmé
            if ($premium->statut === 'payee') {
                $contract->derniere_prime_payee_le = now();
                $contract->calculerProchaineEcheance();

                // Activer le contrat si c'est le premier paiement
                if ($contract->status === 'en_attente') {
                    $contract->status = 'actif';
                }

                $contract->save();
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Paiement de prime enregistré avec succès',
                'data' => $premium->load('contract'),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'enregistrement du paiement',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtenir les détails d'un paiement de prime
     *
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        try {
            $premium = Premium::with(['contract.user', 'contract.insuranceProduct'])
                ->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $premium,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Prime non trouvée',
                'error' => $e->getMessage(),
            ], 404);
        }
    }

    /**
     * Mettre à jour le statut d'un paiement de prime
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'statut' => 'required|in:payee,en_attente,echouee,en_attente_resiliation',
            'transaction_hash' => 'nullable|string|max:66',
            'block_number' => 'nullable|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation échouée',
                'errors' => $validator->errors(),
            ], 422);
        }

        DB::beginTransaction();

        try {
            $premium = Premium::with('contract')->findOrFail($id);

            $oldStatut = $premium->statut;

            // Mettre à jour la prime
            $premium->statut = $request->input('statut');

            if ($request->has('transaction_hash')) {
                $premium->transaction_hash = $request->input('transaction_hash');
            }

            if ($request->has('block_number')) {
                $premium->block_number = $request->input('block_number');
            }

            $premium->save();

            // Si le statut passe de "en_attente" à "payee", mettre à jour le contrat
            if ($oldStatut !== 'payee' && $premium->statut === 'payee') {
                $contract = $premium->contract;
                $contract->derniere_prime_payee_le = $premium->date_paiement;
                $contract->calculerProchaineEcheance();

                if ($contract->status === 'en_attente') {
                    $contract->status = 'actif';
                }

                $contract->save();
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Statut du paiement mis à jour',
                'data' => $premium->fresh('contract'),
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour du paiement',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtenir l'historique des primes pour un contrat spécifique
     *
     * @param int $contractId
     * @return JsonResponse
     */
    public function getContractHistory(int $contractId): JsonResponse
    {
        try {
            $contract = Contract::findOrFail($contractId);

            $premiums = Premium::where('contract_id', $contractId)
                ->orderBy('date_paiement', 'desc')
                ->get();

            // Calculer les statistiques
            $stats = [
                'total_paye' => $premiums->where('statut', 'payee')->sum('montant'),
                'total_en_attente' => $premiums->where('statut', 'en_attente')->sum('montant'),
                'nombre_paiements' => $premiums->where('statut', 'payee')->count(),
                'nombre_echecs' => $premiums->where('statut', 'echouee')->count(),
                'dernier_paiement' => $premiums->where('statut', 'payee')->first(),
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'contract' => $contract,
                    'premiums' => $premiums,
                    'stats' => $stats,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Contrat non trouvé',
                'error' => $e->getMessage(),
            ], 404);
        }
    }

    /**
     * Vérifier les primes impayées et les échéances
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function checkOverdue(Request $request): JsonResponse
    {
        try {
            // Contrats avec échéances dépassées
            $overdueContracts = Contract::where('status', 'actif')
                ->whereNotNull('prochaine_echeance')
                ->where('prochaine_echeance', '<', now())
                ->with(['user', 'insuranceProduct', 'premiums' => function ($q) {
                    $q->where('statut', 'en_attente')->latest();
                }])
                ->get();

            // Grouper par urgence
            $urgent = $overdueContracts->filter(function ($contract) {
                return $contract->prochaine_echeance->diffInDays(now()) > 30;
            });

            $warning = $overdueContracts->filter(function ($contract) {
                $days = $contract->prochaine_echeance->diffInDays(now());
                return $days >= 7 && $days <= 30;
            });

            $recent = $overdueContracts->filter(function ($contract) {
                return $contract->prochaine_echeance->diffInDays(now()) < 7;
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'total' => $overdueContracts->count(),
                    'urgent' => $urgent->values(),
                    'warning' => $warning->values(),
                    'recent' => $recent->values(),
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la vérification des impayés',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtenir les statistiques des primes
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function stats(Request $request): JsonResponse
    {
        try {
            $query = Premium::query();

            // Filtrer par période si fournie
            if ($request->has('start_date')) {
                $query->where('date_paiement', '>=', $request->input('start_date'));
            }

            if ($request->has('end_date')) {
                $query->where('date_paiement', '<=', $request->input('end_date'));
            }

            // Filtrer par utilisateur
            if ($request->has('user_id')) {
                $query->whereHas('contract', function ($q) use ($request) {
                    $q->where('user_id', $request->input('user_id'));
                });
            }

            $stats = [
                'total_collecte' => $query->clone()->where('statut', 'payee')->sum('montant'),
                'total_en_attente' => $query->clone()->where('statut', 'en_attente')->sum('montant'),
                'total_echouee' => $query->clone()->where('statut', 'echouee')->sum('montant'),
                'nombre_paiements_reussis' => $query->clone()->where('statut', 'payee')->count(),
                'nombre_paiements_en_attente' => $query->clone()->where('statut', 'en_attente')->count(),
                'nombre_paiements_echoues' => $query->clone()->where('statut', 'echouee')->count(),
                'montant_moyen' => $query->clone()->where('statut', 'payee')->avg('montant'),
            ];

            // Répartition par mois (3 derniers mois)
            $monthlyStats = Premium::selectRaw('
                    YEAR(date_paiement) as year,
                    MONTH(date_paiement) as month,
                    COUNT(*) as count,
                    SUM(CASE WHEN statut = "payee" THEN montant ELSE 0 END) as total
                ')
                ->where('date_paiement', '>=', now()->subMonths(3))
                ->groupBy('year', 'month')
                ->orderBy('year', 'desc')
                ->orderBy('month', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'global' => $stats,
                    'monthly' => $monthlyStats,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du calcul des statistiques',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
