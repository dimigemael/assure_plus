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
        Schema::create('insurance_products', function (Blueprint $table) {
            $table->id();

            // Informations du produit
            $table->string('nom_produit', 150)->unique(); // Ex: "Auto Premium", "Habitation Confort"
            $table->string('type_assurance', 100); // Auto, Habitation, Santé, Vie, etc.
            $table->text('description')->nullable(); // Description détaillée du produit

            // Caractéristiques financières de base
            $table->decimal('montant_couverture_base', 10, 2); // Montant de couverture proposé
            $table->decimal('prime_base', 10, 2); // Prime de base
            $table->decimal('franchise_base', 10, 2)->default(0); // Franchise de base
            $table->enum('frequence_paiement', ['mensuelle', 'trimestrielle', 'semestrielle', 'annuelle'])->default('mensuelle');

            // Garanties et conditions
            $table->json('garanties_incluses')->nullable(); // Liste des garanties proposées
            $table->text('conditions_generales')->nullable(); // Conditions générales du produit
            $table->text('exclusions')->nullable(); // Exclusions

            // Disponibilité
            $table->enum('status', ['actif', 'inactif', 'archive'])->default('actif');
            $table->date('date_lancement')->nullable(); // Date de mise en vente du produit
            $table->date('date_retrait')->nullable(); // Date de retrait du marché

            // Métadonnées
            $table->integer('nombre_souscriptions')->default(0); // Compteur de souscriptions
            $table->timestamps();

            // Index pour recherche
            $table->index('type_assurance');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('insurance_products');
    }
};
