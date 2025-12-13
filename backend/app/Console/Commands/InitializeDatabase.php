<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class InitializeDatabase extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'db:smart-init {--force : Force l\'initialisation même si déjà initialisé}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Initialise intelligemment la base de données (détecte le premier lancement)';

    /**
     * Fichier marqueur pour indiquer que l'initialisation a été faite
     */
    private $initMarkerPath;

    public function __construct()
    {
        parent::__construct();
        $this->initMarkerPath = storage_path('.db_initialized');
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔍 Vérification de l\'état de la base de données...');

        $isFirstLaunch = $this->isFirstLaunch();
        $force = $this->option('force');

        if ($force) {
            $this->warn('⚠️  Mode force activé - Réinitialisation complète...');
            $this->freshInstall();
            return Command::SUCCESS;
        }

        if ($isFirstLaunch) {
            $this->info('🆕 Premier lancement détecté!');
            $this->freshInstall();
        } else {
            $this->info('♻️  Base de données déjà initialisée');
            $this->incrementalUpdate();
        }

        return Command::SUCCESS;
    }

    /**
     * Vérifie si c'est le premier lancement
     */
    private function isFirstLaunch(): bool
    {
        // Vérifier le fichier marqueur
        if (file_exists($this->initMarkerPath)) {
            return false;
        }

        // Vérifier si la table users existe et contient des données
        try {
            if (Schema::hasTable('users') && User::count() > 0) {
                // La base existe mais le marqueur n'existe pas
                // Créer le marqueur pour la prochaine fois
                touch($this->initMarkerPath);
                return false;
            }
        } catch (\Exception $e) {
            // Erreur = probablement pas de base de données
            return true;
        }

        return true;
    }

    /**
     * Installation complète (premier lancement)
     */
    private function freshInstall(): void
    {
        $this->info('📦 Installation complète de la base de données...');

        // Migrations avec seeders
        $this->call('migrate:fresh', [
            '--seed' => true,
            '--force' => true,
        ]);

        // Créer le fichier marqueur
        touch($this->initMarkerPath);

        $this->info('✅ Base de données initialisée avec succès!');
        $this->displayCredentials();
    }

    /**
     * Mise à jour incrémentale (lancements suivants)
     */
    private function incrementalUpdate(): void
    {
        // Exécuter uniquement les nouvelles migrations
        $this->info('📦 Exécution des migrations...');
        $this->call('migrate', ['--force' => true]);

        // Vérifier si l'admin existe
        if (!User::where('role', 'admin')->exists()) {
            $this->warn('⚠️  Aucun administrateur trouvé!');
            $this->info('📦 Création du compte administrateur...');

            $this->call('db:seed', [
                '--class' => 'AdminSeeder',
                '--force' => true,
            ]);

            $this->displayCredentials();
        } else {
            $this->info('✅ Configuration à jour');
        }
    }

    /**
     * Affiche les identifiants admin
     */
    private function displayCredentials(): void
    {
        $this->newLine();
        $this->info('🔑 Identifiants administrateur:');
        $this->line('   Email: admin@assureplus.com');
        $this->line('   Mot de passe: Admin@2024!');
        $this->newLine();
        $this->warn('⚠️  N\'oubliez pas de changer le mot de passe en production!');
    }
}
