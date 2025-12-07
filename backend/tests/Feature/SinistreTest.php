<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;
use App\Models\User;
use App\Models\Contract;
use Illuminate\Support\Facades\Hash;

class SinistreTest extends TestCase
{
    use RefreshDatabase;

    public function test_un_utilisateur_peut_declarer_un_sinistre_avec_fichier()
    {
        // On désactive la gestion auto des erreurs pour voir si ça plante
        $this->withoutExceptionHandling(); 

        // 1. SIMULATION IPFS
        Http::fake([
            'http://127.0.0.1:5001/*' => Http::response(['Hash' => 'QmFauxHashPourLeTest12345'], 200),
        ]);

        // 2. PRÉPARATION
        $user = User::factory()->create([
            'password' => Hash::make('password'),
        ]);
        
        $contract = Contract::create([
            'user_id' => $user->id,
            'type_assurance' => 'Auto',
            'montant_couverture' => 10000,
            'prime' => 500,
            'date_debut' => now(),
            'date_fin' => now()->addYear(),
        ]);

        // --- C'EST ICI QUE CA SE JOUE ---
        // On crée un fichier avec du VRAI texte dedans
        $file = UploadedFile::fake()->createWithContent('accident.pdf', 'Données brutes du fichier pour le test');
        // -------------------------------

        // 3. ACTION
        $response = $this->actingAs($user, 'api')->postJson('/api/claims', [
            'contract_id' => $contract->id,
            'description' => 'Test unitaire automatique',
            'montant_reclame' => 2500,
            'proof_file' => $file
        ]);

        // Petit debug au cas où (tu pourras l'enlever si c'est vert)
        if ($response->status() === 500) {
            dd($response->json());
        }

        // 4. VÉRIFICATION
        $response->assertStatus(201);
        
        $response->assertJsonPath('claim.ipfs_hash', 'QmFauxHashPourLeTest12345');
    }
}