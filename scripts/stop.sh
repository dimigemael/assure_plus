#!/bin/bash

# ========================================
# Script d'arrêt du projet Assurance Blockchain
# ========================================

set -e

echo "🛑 Arrêt de l'environnement Docker Assurance Blockchain..."
echo ""

# Arrêter les services
docker-compose down

echo ""
echo "✅ Tous les services ont été arrêtés."
echo ""
echo "💡 Pour supprimer également les volumes (données) :"
echo "   docker-compose down -v"
echo ""
