#!/bin/bash

# Script d'initialisation de la base de données
# Détecte automatiquement si c'est le premier lancement

set -e

# Fichier marqueur pour indiquer que l'initialisation a été faite
INIT_MARKER="/var/www/storage/.db_initialized"

echo "🔍 Vérification de l'état de la base de données..."

# Fonction pour vérifier si la base de données contient des tables
check_database_initialized() {
    php artisan db:show --json 2>/dev/null | grep -q '"tables":' && return 0 || return 1
}

# Fonction pour vérifier si l'admin existe déjà
check_admin_exists() {
    php artisan tinker --execute="echo App\Models\User::where('role', 'admin')->exists() ? 'true' : 'false';" 2>/dev/null | grep -q "true" && return 0 || return 1
}

# Vérifier si c'est le premier lancement
if [ ! -f "$INIT_MARKER" ] || ! check_database_initialized; then
    echo "🆕 Premier lancement détecté - Initialisation complète de la base de données..."

    echo "📦 Exécution des migrations avec seeders..."
    php artisan migrate:fresh --seed --force

    # Créer le fichier marqueur
    touch "$INIT_MARKER"
    echo "✅ Base de données initialisée avec succès!"

else
    echo "♻️  Base de données déjà initialisée - Exécution des migrations seulement..."

    # Exécuter uniquement les nouvelles migrations
    php artisan migrate --force

    # Vérifier si l'admin existe, sinon le créer
    if ! check_admin_exists; then
        echo "⚠️  Aucun administrateur trouvé - Création du compte admin..."
        php artisan db:seed --class=AdminSeeder --force
    else
        echo "✅ Administrateur existant détecté"
    fi
fi

echo "🎉 Configuration de la base de données terminée!"
