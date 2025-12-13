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
        Schema::table('contracts', function (Blueprint $table) {
            // Ajouter la référence au produit d'assurance (nullable pour compatibilité avec contrats existants)
            $table->foreignId('insurance_product_id')
                ->nullable()
                ->after('user_id')
                ->constrained('insurance_products')
                ->onDelete('restrict'); // On ne peut pas supprimer un produit qui a des contrats
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('contracts', function (Blueprint $table) {
            $table->dropForeign(['insurance_product_id']);
            $table->dropColumn('insurance_product_id');
        });
    }
};
