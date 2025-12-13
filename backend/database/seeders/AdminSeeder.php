<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Crée le compte administrateur par défaut.
     * Ce seeder s'exécute au premier lancement de l'application.
     */
    public function run(): void
    {
        // Vérifie si un admin existe déjà pour éviter les doublons
        if (User::where('role', 'admin')->exists()) {
            $this->command->info('Un administrateur existe déjà.');
            return;
        }

        User::create([
            'nom' => 'Assure',
            'prenom' => 'Plus',
            'email' => 'admin@assureplus.com',
            'password' => Hash::make('Admin2025'),
            'role' => 'admin',
            'email_verified_at' => now(),
            'statut' => 'actif',
        ]);

        $this->command->info('Administrateur créé avec succès !');
        $this->command->info('Email: admin@assureplus.com');
        $this->command->info('Mot de passe: Admin2025');
    }
}
