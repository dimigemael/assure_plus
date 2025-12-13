<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InsuranceProduct;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class InsuranceProductController extends Controller
{
    /**
     * Récupérer tous les produits d'assurance avec filtres
     */
    public function index(Request $request)
    {
        $query = InsuranceProduct::query();

        // Filtrer par type d'assurance
        if ($request->has('type_assurance')) {
            $query->ofType($request->type_assurance);
        }

        // Filtrer par statut
        if ($request->has('status')) {
            $query->where('status', $request->status);
        } else {
            // Par défaut, montrer seulement les produits actifs
            $query->active();
        }

        // Inclure le nombre de souscriptions
        $query->withCount('contracts');

        $products = $query->orderBy('created_at', 'desc')->get();

        return response()->json($products);
    }

    /**
     * Créer un nouveau produit d'assurance
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nom_produit' => 'required|string|max:150|unique:insurance_products',
            'type_assurance' => 'required|string|max:100',
            'description' => 'nullable|string',
            'montant_couverture_base' => 'required|numeric|min:0',
            'prime_base' => 'required|numeric|min:0',
            'franchise_base' => 'nullable|numeric|min:0',
            'frequence_paiement' => 'required|in:mensuelle,trimestrielle,semestrielle,annuelle',
            'garanties_incluses' => 'nullable|array',
            'garanties_incluses.*.nom' => 'required|string',
            'garanties_incluses.*.obligatoire' => 'nullable|boolean',
            'garanties_incluses.*.plafond_couverture' => 'nullable|numeric|min:0',
            'garanties_incluses.*.franchise' => 'nullable|numeric|min:0',
            'conditions_generales' => 'nullable|string',
            'exclusions' => 'nullable|string',
            'date_lancement' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $product = InsuranceProduct::create([
                'nom_produit' => $request->nom_produit,
                'type_assurance' => $request->type_assurance,
                'description' => $request->description,
                'montant_couverture_base' => $request->montant_couverture_base,
                'prime_base' => $request->prime_base,
                'franchise_base' => $request->franchise_base ?? 0,
                'frequence_paiement' => $request->frequence_paiement,
                'garanties_incluses' => $request->garanties_incluses,
                'conditions_generales' => $request->conditions_generales,
                'exclusions' => $request->exclusions,
                'status' => 'actif',
                'date_lancement' => $request->date_lancement ?? now(),
            ]);

            return response()->json([
                'message' => 'Produit d\'assurance créé avec succès',
                'product' => $product
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la création du produit',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir les produits disponibles pour souscription (pour les assurés)
     */
    public function available()
    {
        $products = InsuranceProduct::active()
            ->whereNull('date_retrait')
            ->orWhere('date_retrait', '>=', now())
            ->orderBy('type_assurance')
            ->orderBy('nom_produit')
            ->get();

        return response()->json($products);
    }
}
