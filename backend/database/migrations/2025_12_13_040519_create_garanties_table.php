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
        Schema::create('garanties', function (Blueprint $table) {
            $table->id();

            // Lien avec le contrat
            $table->foreignId('contract_id')->constrained('contracts')->onDelete('cascade');

            // Nom de la garantie (ex: "Vol", "Incendie", "Dégâts des eaux", "Responsabilité civile")
            $table->string('nom', 100);

            // Description détaillée
            $table->text('description')->nullable();

            // Plafond de couverture pour cette garantie spécifique
            $table->decimal('plafond_couverture', 10, 2)->nullable();

            // Franchise spécifique à cette garantie (peut être différente de la franchise globale)
            $table->decimal('franchise', 10, 2)->default(0);

            // Conditions particulières ou exclusions pour cette garantie
            $table->text('conditions')->nullable();
            $table->text('exclusions')->nullable();

            // Est-ce une garantie obligatoire ou optionnelle ?
            $table->boolean('obligatoire')->default(false);

            // La garantie est-elle active ?
            $table->boolean('active')->default(true);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('garanties');
    }
};
