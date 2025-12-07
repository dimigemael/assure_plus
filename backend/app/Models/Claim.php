<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Claim extends Model
{
    use HasFactory;

    protected $fillable = [
        'contract_id',
        'user_id',
        'description',
        'montant_reclame',
        
        // --- Champs pour le Fichier et IPFS ---
        'proof_file',   // Indispensable : stocke le nom du fichier
        'ipfs_hash',    // Indispensable : stocke le hash reçu du serveur IPFS
        
        // --- Champs de Statut ---
        'status',       // On utilise 'status' pour correspondre à ton Controller (en_attente, valide...)
        // 'statut',    // (Si tu as utilisé 'statut' en français dans ta migration, décommente cette ligne et commente 'status')

        // --- Champs Avancés (Pour la suite : Experts & Blockchain) ---
        'date_declaration',
        'expert_id',
        'commentaire_expert',
        'date_validation',
        
        'transaction_hash'
    ];

    // RELATION 1 : Le sinistre appartient à un contrat
    public function contract()
    {
        return $this->belongsTo(Contract::class);
    }

    // RELATION 2 : Le sinistre est déclaré par un utilisateur (Assuré)
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // RELATION 3 : Le sinistre peut être géré par un expert (qui est aussi un User)
    public function expert()
    {
        return $this->belongsTo(User::class, 'expert_id');
    }
}