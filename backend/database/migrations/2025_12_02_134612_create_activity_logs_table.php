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
    Schema::create('activity_logs', function (Blueprint $table) {
        $table->id();
        
        // Relation : qui a fait l'action ? (user_id)
       $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
        
        $table->string('action', 255); // VARCHAR(255)
        $table->text('description')->nullable(); // TEXT
        $table->string('ip_address', 45)->nullable(); // VARCHAR(45) pour IPv6
        
        // Ici, ton schéma demande juste created_at
        $table->timestamp('created_at')->useCurrent(); 
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
