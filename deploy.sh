#!/bin/bash

# Script de déploiement pour VPS avec Docker Compose
# Usage: ./deploy.sh

echo "🚀 Début du déploiement..."

# 1. Pull les dernières modifications
echo "📥 Récupération des dernières modifications..."
git pull origin main

# 2. Arrêter les conteneurs existants
echo "⏸️  Arrêt des conteneurs existants..."
docker compose down

# 3. Rebuild et démarrage des conteneurs
echo "🔨 Build et démarrage des conteneurs..."
docker compose up -d --build

# 4. Attendre que la base de données soit prête
echo "⏳ Attente de la base de données..."
sleep 10

# 5. Migration de la base de données
echo "🗄️  Migration de la base de données..."
docker compose exec -T app npm run db:push

# 6. Nettoyage des anciennes images
echo "🧹 Nettoyage des anciennes images..."
docker image prune -f

echo "✅ Déploiement terminé!"
echo "📊 Status des conteneurs:"
docker compose ps
