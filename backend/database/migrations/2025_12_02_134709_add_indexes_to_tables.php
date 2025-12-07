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
        // 1. Index sur les Contrats
        Schema::table('contracts', function (Blueprint $table) {
            // Utilise bien 'status' (Anglais)
            $table->index('status', 'idx_contracts_status');
            $table->index('user_id', 'idx_contracts_user');
        });

        // 2. Index sur les Sinistres (C'est ici que ça bloquait !)
        Schema::table('claims', function (Blueprint $table) {
            // CHANGE 'statut' PAR 'status' ICI AUSSI
            $table->index('status', 'idx_claims_status'); 
            
            $table->index('contract_id', 'idx_claims_contract');
        });

        // 3. Index sur les Primes (optionnel, selon ta table premiums)
        if (Schema::hasColumn('premiums', 'status')) {
             Schema::table('premiums', function (Blueprint $table) {
                $table->index('status', 'idx_premiums_status');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // On supprime les index en cas de rollback
        Schema::table('contracts', function (Blueprint $table) {
            $table->dropIndex('idx_contracts_status');
            $table->dropIndex('idx_contracts_user');
        });

        Schema::table('claims', function (Blueprint $table) {
            $table->dropIndex('idx_claims_status');
            $table->dropIndex('idx_claims_contract');
        });
        
        // ... pareil pour premiums si ajouté
    }
};