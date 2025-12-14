<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contract;
use App\Models\InsuranceProduct;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class SubscriptionController extends Controller
{
    /**
     * Créer une nouvelle demande de souscription
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'insurance_product_id' => 'required|exists:insurance_products,id',
            'date_debut' => 'required|date|after_or_equal:today',
            'date_fin' => 'required|date|after:date_debut',
            'bien_assure' => 'nullable|array',
            'beneficiaire_nom' => 'nullable|string|max:100',
            'beneficiaire_relation' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Récupérer le produit d'assurance
            $product = InsuranceProduct::findOrFail($request->insurance_product_id);

            // Vérifier que le produit est disponible
            if (!$product->isAvailable()) {
                return response()->json([
                    'message' => 'Ce produit n\'est plus disponible'
                ], 400);
            }

            // Créer le contrat (souscription en attente)
            $contract = Contract::create([
                'user_id' => auth()->id(),
                'insurance_product_id' => $product->id,
                'numero_police' => $this->generateNumeroPolice(),
                'type_assurance' => $product->type_assurance,
                'montant_couverture' => $product->montant_couverture_base,
                'prime' => $product->prime_base,
                'franchise' => $product->franchise_base,
                'frequence_paiement' => $product->frequence_paiement,
                'date_debut' => $request->date_debut,
                'date_fin' => $request->date_fin,
                'bien_assure' => $request->bien_assure,
                'beneficiaire_nom' => $request->beneficiaire_nom,
                'beneficiaire_relation' => $request->beneficiaire_relation,
                'status' => 'brouillon', // En attente de validation admin
            ]);

            return response()->json([
                'message' => 'Demande de souscription envoyée avec succès',
                'contract' => $contract
            ], 201);

        } catch (\Exception $e) {
            \Log::error('Erreur création souscription: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur lors de la souscription',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupérer les souscriptions de l'utilisateur connecté
     */
    public function mySubscriptions()
    {
        $contracts = Contract::where('user_id', auth()->id())
            ->with('insuranceProduct')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($contracts);
    }

    /**
     * Récupérer toutes les souscriptions en attente (admin)
     */
    public function pending()
    {
        $contracts = Contract::where('status', 'brouillon')
            ->with(['user', 'insuranceProduct'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($contracts);
    }

    /**
     * Approuver une souscription (admin)
     */
    public function approve($id)
    {
        try {
            $contract = Contract::findOrFail($id);

            if ($contract->status !== 'brouillon') {
                return response()->json([
                    'message' => 'Cette souscription ne peut pas être approuvée'
                ], 400);
            }

            $contract->update([
                'status' => 'actif',
            ]);

            // Incrémenter le compteur de souscriptions du produit
            if ($contract->insuranceProduct) {
                $contract->insuranceProduct->incrementSouscriptions();
            }

            return response()->json([
                'message' => 'Souscription approuvée avec succès',
                'contract' => $contract
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de l\'approbation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Rejeter une souscription (admin)
     */
    public function reject(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'reason' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $contract = Contract::findOrFail($id);

            if ($contract->status !== 'brouillon') {
                return response()->json([
                    'message' => 'Cette souscription ne peut pas être rejetée'
                ], 400);
            }

            $contract->update([
                'status' => 'resilie',
            ]);

            return response()->json([
                'message' => 'Souscription rejetée',
                'contract' => $contract
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors du rejet',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Générer un numéro de police unique
     */
    private function generateNumeroPolice()
    {
        do {
            $numero = 'POL-' . strtoupper(Str::random(8));
        } while (Contract::where('numero_police', $numero)->exists());

        return $numero;
    }
}
