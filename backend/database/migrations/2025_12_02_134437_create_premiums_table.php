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
    Schema::create('premiums', function (Blueprint $table) {
        $table->id(); // id INT PRIMARY KEY
        
        // Relation avec contrats (contract_id)
        $table->foreignId('contract_id')->constrained('contracts')->onDelete('cascade');
        
        $table->decimal('montant', 10, 2); // DECIMAL(10,2)
        $table->dateTime('date_paiement')->useCurrent(); // DATETIME DEFAULT CURRENT_TIMESTAMP
        
        // Blockchain Info
        $table->string('transaction_hash', 66)->nullable(); // VARCHAR(66)
        $table->integer('block_number')->nullable(); // INT
        
        // Statut (Enum)
        $table->enum('statut', ['payee', 'en_attente', 'echouee', 'en_attente_resiliation'])->default('en_attente');
        
        $table->timestamps(); // created_at et updated_at
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('premiums');
    }
};
