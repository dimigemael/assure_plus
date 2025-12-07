<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ContractController;
use App\Http\Controllers\ClaimController;
use App\Http\Controllers\BlockchainTestController;

// Groupe de routes gérées par AuthController
Route::controller(AuthController::class)->group(function () {
    
    // --- Routes Publiques ---
    Route::post('register', 'register');
    Route::post('login', 'login');

    // --- ZONE SÉCURISÉE (Token Obligatoire) ---
    Route::middleware('auth:api')->group(function () {
        
        // Routes Auth sécurisées
        Route::post('logout', 'logout');
        Route::get('user', 'me');
        Route::post('refresh', 'refresh');

        // --- ROUTES CONTRATS ---
        Route::get('contracts', [ContractController::class, 'index']); // Voir mes contrats
        Route::post('contracts', [ContractController::class, 'store']); // Créer un contrat

        // --- ROUTES SINISTRES (CLAIMS) ---
        // Ajout des routes manquantes ici !

        // 1. VOIR la liste des Sinistres (pour les Admins/Experts)
        Route::get('claims', [ClaimController::class, 'index']); // Affiche tous les sinistres ou ceux de l'utilisateur

        // 2. VOIR UN Sinistre spécifique (celle qui causait le 404 Not Found)
        Route::get('claims/{id}', [ClaimController::class, 'show']); // Affiche le sinistre par son ID

        // 3. TRAITER / MODIFIER le Sinistre (Changer le statut en "approuvé", etc.)
        Route::patch('claims/{id}', [ClaimController::class, 'update']); // Mettre à jour un champ spécifique
        // Optionnel : Route::put('claims/{id}', [ClaimController::class, 'update']); // Mettre à jour toutes les données

        // 4. Déclarer/Soumettre un nouveau Sinistre (celui qui fonctionnait)
        Route::post('claims', [ClaimController::class, 'store'])
             ->middleware('throttle:10,1');   
        Route::delete('claims/{id}', [ClaimController::class, 'destroy']);
    });
});

// Routes de test blockchain (publiques pour faciliter les tests)
Route::prefix('blockchain')->group(function () {
    Route::get('test', [BlockchainTestController::class, 'testConnection']);
    Route::get('contract-info', [BlockchainTestController::class, 'getContractInfo']);
});