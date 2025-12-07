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
        'type_assurance',
        'montant_couverture',
        'prime',
        'date_debut',
        'date_fin',
        'status',
        'smart_contract_address',
        'transaction_hash'
    ];

    // RELATION : Un contrat appartient à un utilisateur
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // RELATION : Un contrat a plusieurs sinistres
    public function claims()
    {
        return $this->hasMany(Claim::class);
    }
}