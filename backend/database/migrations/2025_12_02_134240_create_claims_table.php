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
        Schema::create('claims', function (Blueprint $table) {
            $table->id();
            
            // Relations
            $table->foreignId('contract_id')->constrained('contracts')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            
            // Données de base
            $table->text('description');
            $table->decimal('montant_reclame', 10, 2);
            $table->dateTime('date_declaration')->useCurrent();
            
            // --- CHAMPS NÉCESSAIRES AJOUTÉS/OPTIMISÉS ---
            
            // Le type ENUM est la solution la plus propre et la plus performante pour 'status'.
            // J'ajoute "approuvé" et "rejeté" pour correspondre à nos tests.
            $table->enum('status', ['en_attente', 'approuvé', 'rejeté', 'valide', 'indemnise'])
                  ->default('en_attente');
            
            // L'ajout de la colonne pour la validation financière
            $table->decimal('montant_approuve', 10, 2)->nullable(); 
            
            // Fichier et IPFS
            $table->string('proof_file')->nullable();
            $table->string('ipfs_hash', 100)->nullable();
            
            // Partie Expert & Blockchain
            // Assurez-vous d'avoir une FK avec l'ID expert.
            $table->foreignId('expert_id')->nullable()->constrained('users')->onDelete('set null'); 
            $table->text('commentaire_expert')->nullable();
            $table->string('transaction_hash', 66)->nullable(); // Le Hash des transactions EVM a 66 chars
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('claims');
    }
};