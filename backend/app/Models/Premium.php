<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Premium extends Model
{
    use HasFactory;
    
    // On précise le nom de la table car Laravel cherche "premia" au pluriel par défaut (c'est du latin), 
    // mais nous on a créé "premiums".
    protected $table = 'premiums';

    protected $fillable = [
        'contract_id',
        'montant',
        'date_paiement',
        'transaction_hash',
        'block_number',
        'statut'
    ];

    // La prime est liée à un contrat
    public function contract()
    {
        return $this->belongsTo(Contract::class);
    }
}