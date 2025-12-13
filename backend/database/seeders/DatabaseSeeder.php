<?php

namespace Database\Seeders;

use App\Models\User; // <-- AJOUTER : Import du Modèle User
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash; // <-- AJOUTER : Pour hasher le mot de passe
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class DatabaseSeeder extends Seeder
{
    // Laissez le "use WithoutModelEvents;" pour la compatibilité, mais pas indispensable.

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // ⭐ Crée l'administrateur principal (seeder dédié)
        $this->call(AdminSeeder::class);

        // ⭐ Étape B : Crée l'utilisateur assuré/client qui a créé le sinistre (ID: 2)
        User::create([
            'nom' => 'Client',
            'prenom' => 'Test',
            'email' => 'client@test.com',       // Utilisateur qui a créé le Sinistre ID: 1
            'password' => Hash::make('password'),
            'role' => 'assure',
            'email_verified_at' => now(),
        ]);


        // User::factory(5)->create(['role' => 'expert']); // OPTIONNEL : pour les experts
        User::factory(5)->create(); // Crée d'autres clients avec la Factory corrigée.

    }
}
