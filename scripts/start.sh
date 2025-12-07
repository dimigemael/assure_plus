#!/bin/bash

# ========================================
# Script de démarrage du projet Assurance Blockchain
# ========================================

set -e  # Arrêter en cas d'erreur

echo "🚀 Démarrage de l'environnement Docker Assurance Blockchain..."
echo ""

# Vérifier que Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Veuillez l'installer : https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé. Veuillez l'installer : https://docs.docker.com/compose/install/"
    exit 1
fi

# Copier le fichier .env.docker vers backend/.env si nécessaire
if [ ! -f backend/.env ]; then
    echo "📝 Création du fichier .env pour le backend..."
    cp .env.docker backend/.env
fi

# Construire et démarrer les services
echo "🔨 Construction des images Docker..."
docker-compose build

echo ""
echo "🎬 Démarrage des services..."
docker-compose up -d

echo ""
echo "⏳ Attente du démarrage des services (30 secondes)..."
sleep 30

# Vérifier l'état des services
echo ""
echo "📊 État des services :"
docker-compose ps

echo ""
echo "✅ Environnement démarré avec succès !"
echo ""
echo "📌 Accès aux services :"
echo "   - Backend Laravel API : http://localhost:8000"
echo "   - Ganache (Blockchain) : http://localhost:7545"
echo "   - IPFS API          : http://localhost:5001"
echo "   - IPFS Gateway      : http://localhost:8080"
echo "   - MySQL             : localhost:3306"
echo ""
echo "📖 Pour voir les logs :"
echo "   docker-compose logs -f [service_name]"
echo ""
echo "🛑 Pour arrêter :"
echo "   ./scripts/stop.sh"
echo ""
