#!/bin/bash

# ========================================
# Script de réinitialisation complète
# ========================================

set -e

echo "⚠️  ATTENTION : Ce script va supprimer TOUTES les données (BDD, blockchain, IPFS)."
read -p "Êtes-vous sûr de vouloir continuer ? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Opération annulée."
    exit 1
fi

echo ""
echo "🗑️  Arrêt et suppression de tous les conteneurs..."
docker-compose down -v

echo ""
echo "🧹 Nettoyage des volumes Docker..."
docker volume prune -f

echo ""
echo "🔨 Reconstruction complète..."
./scripts/start.sh

echo ""
echo "✅ Environnement réinitialisé avec succès !"
