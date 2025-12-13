<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InsuranceProduct extends Model
{
    use HasFactory;

    protected $fillable = [
        'nom_produit',
        'type_assurance',
        'description',
        'montant_couverture_base',
        'prime_base',
        'franchise_base',
        'frequence_paiement',
        'garanties_incluses',
        'conditions_generales',
        'exclusions',
        'status',
        'date_lancement',
        'date_retrait',
        'nombre_souscriptions',
    ];

    protected $casts = [
        'garanties_incluses' => 'array',
        'montant_couverture_base' => 'decimal:2',
        'prime_base' => 'decimal:2',
        'franchise_base' => 'decimal:2',
        'date_lancement' => 'date',
        'date_retrait' => 'date',
        'nombre_souscriptions' => 'integer',
    ];

    /**
     * Un produit peut avoir plusieurs souscriptions (contrats)
     */
    public function contracts()
    {
        return $this->hasMany(Contract::class, 'insurance_product_id');
    }

    /**
     * Vérifier si le produit est disponible
     */
    public function isAvailable(): bool
    {
        return $this->status === 'actif' &&
               (!$this->date_retrait || $this->date_retrait >= now());
    }

    /**
     * Incrémenter le compteur de souscriptions
     */
    public function incrementSouscriptions(): void
    {
        $this->increment('nombre_souscriptions');
    }

    /**
     * Obtenir les garanties sous forme de tableau formaté
     */
    public function getFormattedGaranties(): array
    {
        if (!$this->garanties_incluses) {
            return [];
        }

        return collect($this->garanties_incluses)->map(function ($garantie) {
            return [
                'nom' => $garantie['nom'] ?? '',
                'obligatoire' => $garantie['obligatoire'] ?? false,
                'plafond_couverture' => $garantie['plafond_couverture'] ?? null,
                'franchise' => $garantie['franchise'] ?? 0,
            ];
        })->toArray();
    }

    /**
     * Scope pour filtrer les produits actifs
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'actif');
    }

    /**
     * Scope pour filtrer par type d'assurance
     */
    public function scopeOfType($query, $type)
    {
        return $query->where('type_assurance', $type);
    }
}
