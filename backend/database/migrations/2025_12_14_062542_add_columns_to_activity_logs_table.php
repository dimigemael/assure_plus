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
        Schema::table('activity_logs', function (Blueprint $table) {
            // Informations de la requête
            $table->string('method', 10)->nullable()->after('description'); // GET, POST, PUT, DELETE, PATCH
            $table->string('url', 500)->nullable()->after('method'); // URL de la requête
            $table->string('user_agent', 500)->nullable()->after('ip_address'); // Navigateur/App

            // Données additionnelles (JSON)
            $table->json('properties')->nullable()->after('user_agent'); // Données avant/après

            // Entité liée (optionnel)
            $table->string('subject_type')->nullable()->after('properties'); // Nom de la classe (Contract, Claim, etc.)
            $table->unsignedBigInteger('subject_id')->nullable()->after('subject_type'); // ID de l'entité

            // Index pour améliorer les performances
            $table->index(['user_id', 'created_at']);
            $table->index(['subject_type', 'subject_id']);
            $table->index('action');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('activity_logs', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'created_at']);
            $table->dropIndex(['subject_type', 'subject_id']);
            $table->dropIndex(['action']);

            $table->dropColumn([
                'method',
                'url',
                'user_agent',
                'properties',
                'subject_type',
                'subject_id',
            ]);
        });
    }
};
