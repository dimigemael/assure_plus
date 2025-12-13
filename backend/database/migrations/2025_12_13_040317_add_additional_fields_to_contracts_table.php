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
            // Numéro de police unique
            $table->string('numero_police', 50)->unique()->after('id');

            // Date de souscription (différente de date_debut)
            $table->date('date_souscription')->nullable()->after('date_fin');

            // Franchise (montant à la charge de l'assuré)
            $table->decimal('franchise', 10, 2)->default(0)->after('prime');

            // Fréquence de paiement (mensuelle, trimestrielle, annuelle)
            $table->enum('frequence_paiement', ['mensuelle', 'trimestrielle', 'semestrielle', 'annuelle'])
                  ->default('mensuelle')->after('prime');

            // Date du dernier paiement
            $table->timestamp('derniere_prime_payee_le')->nullable()->after('frequence_paiement');

            // Prochaine échéance de paiement
            $table->date('prochaine_echeance')->nullable()->after('derniere_prime_payee_le');

            // Compteur de sinistres
            $table->integer('nombre_sinistres')->default(0)->after('status');

            // Motif de résiliation (si status = resilie)
            $table->text('motif_resiliation')->nullable()->after('status');

            // Bénéficiaire (peut être différent de l'assuré)
            $table->string('beneficiaire_nom')->nullable()->after('user_id');
            $table->string('beneficiaire_relation')->nullable()->after('beneficiaire_nom');

            // Informations sur le bien assuré (JSON pour flexibilité)
            // Ex: {type: 'vehicule', marque: 'Toyota', immatriculation: 'AB-123-CD'}
            // Ex: {type: 'habitation', adresse: '123 rue...', surface: '100m2'}
            $table->json('bien_assure')->nullable()->after('type_assurance');

            // Documents et conditions (IPFS hash ou URL)
            $table->string('conditions_generales_hash')->nullable()->after('smart_contract_address');
            $table->string('documents_supplementaires')->nullable()->after('conditions_generales_hash');

            // Wallet de paiement de l'assuré (pour les paiements crypto)
            $table->string('wallet_paiement', 42)->nullable()->after('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('contracts', function (Blueprint $table) {
            $table->dropColumn([
                'numero_police',
                'date_souscription',
                'franchise',
                'frequence_paiement',
                'derniere_prime_payee_le',
                'prochaine_echeance',
                'nombre_sinistres',
                'motif_resiliation',
                'beneficiaire_nom',
                'beneficiaire_relation',
                'bien_assure',
                'conditions_generales_hash',
                'documents_supplementaires',
                'wallet_paiement'
            ]);
        });
    }
};
