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
        Schema::create('contracts', function (Blueprint $table) {
            $table->id();
            
            // Lien avec l'assuré (User)
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            
            $table->string('type_assurance', 100);
            $table->decimal('montant_couverture', 10, 2);
            $table->decimal('prime', 10, 2);
            $table->date('date_debut');
            $table->date('date_fin');
            
            // --- CORRECTION ICI ---
            // J'ai remplacé 'statut' par 'status' pour correspondre à ton fichier d'index
            // et éviter l'erreur "Key column 'status' doesn't exist"
            $table->enum('status', ['brouillon', 'actif', 'expire', 'resilie'])->default('brouillon');
            // ----------------------
            
            // Blockchain infos
            $table->string('smart_contract_address', 42)->nullable();
            $table->string('transaction_hash', 66)->nullable();
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contracts');
    }
};