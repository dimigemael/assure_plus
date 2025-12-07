<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreClaimRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // <-- IMPORTANT : Mettre à true
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'contract_id' => 'required|exists:contracts,id',
            'description' => 'required|string|max:1000',
            'montant_reclame' => 'required|numeric|min:0',
            // On peut même personnaliser les règles pour le fichier
            'proof_file' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5000',
        ];
    }
    
    /**
     * (Optionnel) Messages d'erreurs personnalisés
     */
    public function messages(): array
    {
        return [
            'proof_file.required' => 'La preuve (fichier) est obligatoire.',
            'proof_file.max' => 'Le fichier est trop lourd (Max 5Mo).',
            'contract_id.exists' => 'Ce contrat n\'existe pas.'
        ];
    }
}