<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Garantie extends Model
{
    use HasFactory;

    protected $fillable = [
        'contract_id',
        'nom',
        'description',
        'plafond_couverture',
        'franchise',
        'conditions',
        'exclusions',
        'obligatoire',
        'active'
    ];

    protected $casts = [
        'plafond_couverture' => 'decimal:2',
        'franchise' => 'decimal:2',
        'obligatoire' => 'boolean',
        'active' => 'boolean',
    ];

    /**
     * Une garantie appartient à un contrat
     */
    public function contract()
    {
        return $this->belongsTo(Contract::class);
    }

    /**
     * Vérifier si la garantie couvre un montant donné
     */
    public function couvre(float $montant): bool
    {
        if (!$this->active) {
            return false;
        }

        if ($this->plafond_couverture === null) {
            return true; // Pas de plafond
        }

        return $montant <= $this->plafond_couverture;
    }

    /**
     * Calculer le montant remboursable après franchise
     */
    public function calculerRemboursement(float $montantSinistre): float
    {
        if (!$this->active) {
            return 0;
        }

        $montantAppresFranchise = max(0, $montantSinistre - $this->franchise);

        if ($this->plafond_couverture !== null) {
            return min($montantAppresFranchise, $this->plafond_couverture);
        }

        return $montantAppresFranchise;
    }
}
