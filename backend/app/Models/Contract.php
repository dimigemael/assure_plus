<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Contract extends Model
{
    use HasFactory;

    // Champs qu'on autorise à modifier
    protected $fillable = [
        'user_id',
        'insurance_product_id',
        'numero_police',
        'wallet_paiement',
        'type_assurance',
        'bien_assure',
        'montant_couverture',
        'prime',
        'franchise',
        'frequence_paiement',
        'derniere_prime_payee_le',
        'prochaine_echeance',
        'date_debut',
        'date_fin',
        'date_souscription',
        'status',
        'nombre_sinistres',
        'motif_resiliation',
        'beneficiaire_nom',
        'beneficiaire_relation',
        'smart_contract_address',
        'transaction_hash',
        'blockchain_policy_id',
        'conditions_generales_hash',
        'documents_supplementaires'
    ];

    // Conversion automatique des types
    protected $casts = [
        'bien_assure' => 'array', // JSON vers array PHP
        'montant_couverture' => 'decimal:2',
        'prime' => 'decimal:2',
        'franchise' => 'decimal:2',
        'date_debut' => 'date',
        'date_fin' => 'date',
        'date_souscription' => 'date',
        'prochaine_echeance' => 'datetime',
        'derniere_prime_payee_le' => 'datetime',
        'nombre_sinistres' => 'integer',
    ];

    // RELATION : Un contrat appartient à un utilisateur
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // RELATION : Un contrat est basé sur un produit d'assurance
    public function insuranceProduct()
    {
        return $this->belongsTo(InsuranceProduct::class, 'insurance_product_id');
    }

    // RELATION : Un contrat a plusieurs sinistres
    public function claims()
    {
        return $this->hasMany(Claim::class);
    }

    // RELATION : Un contrat a plusieurs paiements de primes
    public function premiums()
    {
        return $this->hasMany(Premium::class);
    }

    // RELATION : Un contrat peut avoir plusieurs garanties
    public function garanties()
    {
        return $this->hasMany(Garantie::class);
    }

    /**
     * Générer un numéro de police unique
     */
    public static function generateNumeroPolice(): string
    {
        $year = date('Y');
        $random = strtoupper(substr(uniqid(), -6));
        return "POL-{$year}-{$random}";
    }

    /**
     * Vérifier si le contrat est actif
     */
    public function isActive(): bool
    {
        return $this->status === 'actif' &&
               $this->date_debut <= now() &&
               $this->date_fin >= now();
    }

    /**
     * Vérifier si le contrat est expiré
     */
    public function isExpired(): bool
    {
        return $this->date_fin < now();
    }

    /**
     * Calculer la prochaine échéance selon la fréquence
     */
    public function calculerProchaineEcheance(): void
    {
        if (!$this->derniere_prime_payee_le) {
            $this->prochaine_echeance = $this->date_debut;
            return;
        }

        switch ($this->frequence_paiement) {
            case 'mensuelle':
                $this->prochaine_echeance = $this->derniere_prime_payee_le->copy()->addMonth();
                break;
            case 'trimestrielle':
                $this->prochaine_echeance = $this->derniere_prime_payee_le->copy()->addMonths(3);
                break;
            case 'semestrielle':
                $this->prochaine_echeance = $this->derniere_prime_payee_le->copy()->addMonths(6);
                break;
            case 'annuelle':
                $this->prochaine_echeance = $this->derniere_prime_payee_le->copy()->addYear();
                break;
        }
    }

    /**
     * Incrémenter le compteur de sinistres
     */
    public function incrementerSinistres(): void
    {
        $this->increment('nombre_sinistres');
    }

    /**
     * Vérifier si le contrat a des impayés
     */
    public function hasImpayes(): bool
    {
        return $this->prochaine_echeance &&
               $this->prochaine_echeance < now() &&
               $this->status === 'actif';
    }
}