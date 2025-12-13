<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject; // <--- Ligne IMPORTANTE 1

// On ajoute "implements JWTSubject"
class User extends Authenticatable implements JWTSubject
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'nom',
        'prenom',
        'email',
        'password',
        'role',
        'wallet_address',
        'specialite',
        'statut',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    // --- AJOUTE CES 2 MÉTHODES OBLIGATOIRES POUR JWT ---

    /**
     * Obtenir l'identifiant qui sera stocké dans le token JWT.
     */
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    /**
     * Ajouter des informations personnalisées (claims) au token.
     */
    public function getJWTCustomClaims()
    {
        return [
            'role' => $this->role,  // On ajoute le rôle dans le token, pratique pour le Frontend !
        ];
    }
}