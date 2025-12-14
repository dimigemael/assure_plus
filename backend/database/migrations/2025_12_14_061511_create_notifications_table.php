<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();

            // Utilisateur destinataire
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');

            // Type de notification
            $table->enum('type', [
                'info',
                'success',
                'warning',
                'error',
                'contract_created',
                'contract_activated',
                'contract_cancelled',
                'premium_due',
                'premium_paid',
                'premium_overdue',
                'claim_declared',
                'claim_approved',
                'claim_rejected',
                'claim_paid',
                'subscription_approved',
                'subscription_rejected'
            ])->default('info');

            // Titre et message
            $table->string('title');
            $table->text('message');

            // Données additionnelles (JSON)
            $table->json('data')->nullable();

            // Statut de lecture
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();

            // Lien/Action
            $table->string('action_url')->nullable();
            $table->string('action_text')->nullable();

            $table->timestamps();

            // Index pour améliorer les performances
            $table->index(['user_id', 'is_read']);
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
