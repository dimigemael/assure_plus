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
        Schema::create('users', function (Blueprint $table) {
            $table->id();

            // --- DEBUT DES MODIFICATIONS SELON TON PDF ---
            
            // On remplace 'name' par Nom et Prénom
            $table->string('nom', 100);
            $table->string('prenom', 100);

            // Email (taille 150 selon PDF)
            $table->string('email', 150)->unique();
            
            $table->string('password'); // Mot de passe haché

            // Le Rôle (Assuré par défaut)
            $table->enum('role', ['assure', 'expert', 'admin'])->default('assure');

            // Adresse Ethereum (optionnelle au début donc nullable)
            $table->string('wallet_address', 42)->nullable();

            // Statut du compte
            $table->enum('statut', ['actif', 'inactif'])->default('actif');

            // --- FIN DES MODIFICATIONS ---

            $table->timestamp('email_verified_at')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};