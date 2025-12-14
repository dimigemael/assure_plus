<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ContractController;
use App\Http\Controllers\Api\ContractController as ApiContractController;
use App\Http\Controllers\Api\InsuranceProductController;
use App\Http\Controllers\Api\SubscriptionController;
use App\Http\Controllers\Api\IPFSController;
use App\Http\Controllers\Api\PremiumController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ActivityLogController;
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
        // Liste et création de contrats
        Route::get('contracts', [ApiContractController::class, 'index']); // Liste tous les contrats (avec filtres)
        Route::post('contracts', [ApiContractController::class, 'store']); // Créer un nouveau contrat
        Route::get('contracts/{id}', [ApiContractController::class, 'show']); // Détails d'un contrat
        Route::put('contracts/{id}', [ApiContractController::class, 'update']); // Modifier un contrat
        Route::delete('contracts/{id}', [ApiContractController::class, 'destroy']); // Supprimer un contrat (brouillon seulement)

        // Actions spéciales sur les contrats
        Route::post('contracts/{id}/activate', [ApiContractController::class, 'activate']); // Activer (déployer sur blockchain)
        Route::post('contracts/{id}/cancel', [ApiContractController::class, 'cancel']); // Résilier un contrat

        // Utilitaires
        Route::get('assures', [ApiContractController::class, 'getAssures']); // Liste des utilisateurs assurés

        // --- ROUTES PRODUITS D'ASSURANCE ---
        Route::get('products', [InsuranceProductController::class, 'index']); // Liste tous les produits
        Route::post('products', [InsuranceProductController::class, 'store']); // Créer un produit
        Route::get('products/available', [InsuranceProductController::class, 'available']); // Produits disponibles pour souscription
        Route::get('products/{id}', [InsuranceProductController::class, 'show']); // Détails d'un produit
        Route::put('products/{id}', [InsuranceProductController::class, 'update']); // Modifier un produit
        Route::post('products/{id}/archive', [InsuranceProductController::class, 'archive']); // Archiver un produit
        Route::delete('products/{id}', [InsuranceProductController::class, 'destroy']); // Supprimer un produit

        // --- ROUTES SOUSCRIPTIONS ---
        Route::post('subscriptions', [SubscriptionController::class, 'store']); // Créer une demande de souscription
        Route::get('subscriptions/my', [SubscriptionController::class, 'mySubscriptions']); // Mes souscriptions
        Route::get('subscriptions/pending', [SubscriptionController::class, 'pending']); // Souscriptions en attente (admin)
        Route::post('subscriptions/{id}/approve', [SubscriptionController::class, 'approve']); // Approuver une souscription (admin)
        Route::post('subscriptions/{id}/reject', [SubscriptionController::class, 'reject']); // Rejeter une souscription (admin)

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

        // --- ROUTES IPFS ---
        Route::prefix('ipfs')->group(function () {
            Route::post('upload', [IPFSController::class, 'upload']); // Upload fichier(s) vers IPFS
            Route::get('{hash}', [IPFSController::class, 'get']); // Récupérer un fichier IPFS
            Route::get('{hash}/url', [IPFSController::class, 'getUrl']); // Obtenir l'URL du gateway
            Route::post('pin', [IPFSController::class, 'pin']); // Pin un fichier
            Route::get('status', [IPFSController::class, 'status']); // Vérifier le statut d'IPFS
        });

        // --- ROUTES PRIMES (PREMIUMS) ---
        Route::prefix('premiums')->group(function () {
            Route::get('/', [PremiumController::class, 'index']); // Liste des paiements de primes
            Route::post('/', [PremiumController::class, 'store']); // Enregistrer un paiement
            Route::get('stats', [PremiumController::class, 'stats']); // Statistiques des primes
            Route::get('overdue', [PremiumController::class, 'checkOverdue']); // Vérifier les impayés
            Route::get('contract/{contractId}', [PremiumController::class, 'getContractHistory']); // Historique par contrat
            Route::get('{id}', [PremiumController::class, 'show']); // Détails d'un paiement
            Route::put('{id}', [PremiumController::class, 'update']); // Mettre à jour un paiement
        });

        // --- ROUTES NOTIFICATIONS ---
        Route::prefix('notifications')->group(function () {
            Route::get('/', [NotificationController::class, 'index']); // Liste des notifications
            Route::get('unread-count', [NotificationController::class, 'unreadCount']); // Compteur non lues
            Route::get('recent', [NotificationController::class, 'recent']); // Notifications récentes (24h)
            Route::post('mark-all-read', [NotificationController::class, 'markAllAsRead']); // Tout marquer comme lu
            Route::delete('read', [NotificationController::class, 'deleteRead']); // Supprimer les lues
            Route::get('{id}', [NotificationController::class, 'show']); // Détails d'une notification
            Route::post('{id}/read', [NotificationController::class, 'markAsRead']); // Marquer comme lue
            Route::post('{id}/unread', [NotificationController::class, 'markAsUnread']); // Marquer comme non lue
            Route::delete('{id}', [NotificationController::class, 'destroy']); // Supprimer une notification
        });

        // --- ROUTES ACTIVITY LOGS ---
        Route::prefix('activity-logs')->group(function () {
            Route::get('/', [ActivityLogController::class, 'index']); // Liste des logs
            Route::get('stats', [ActivityLogController::class, 'stats']); // Statistiques
            Route::get('recent', [ActivityLogController::class, 'recent']); // Logs récents (24h)
            Route::get('by-subject', [ActivityLogController::class, 'bySubject']); // Logs par entité
            Route::delete('cleanup', [ActivityLogController::class, 'cleanup']); // Nettoyage (admin)
            Route::get('{id}', [ActivityLogController::class, 'show']); // Détails d'un log
        });
    });
});

// Routes de test blockchain (publiques pour faciliter les tests)
Route::prefix('blockchain')->group(function () {
    Route::get('test', [BlockchainTestController::class, 'testConnection']);
    Route::get('contract-info', [BlockchainTestController::class, 'getContractInfo']);
});