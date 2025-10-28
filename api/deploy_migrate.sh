#!/bin/bash
# 🚀 Script de migration automatique pour le déploiement Render
# Ce script est exécuté AVANT le démarrage de l'app

set -e  # Exit on error

echo "🗄️  Starting database migration..."

# Vérifier que la variable DATABASE_URL existe
if [ -z "$AVA_API_DATABASE_URL" ]; then
    echo "❌ ERROR: AVA_API_DATABASE_URL is not set!"
    exit 1
fi

echo "✅ Database URL configured"

echo "📦 Installing dependencies..."
pip install alembic psycopg2-binary

echo "🔄 Running Alembic migrations..."
# alembic.ini est dans le dossier parent (racine du projet)
cd ..

# Convertir asyncpg URL en psycopg2 URL pour les migrations
# postgresql+asyncpg://... → postgresql://...
export MIGRATION_URL=$(echo $AVA_API_DATABASE_URL | sed 's/\+asyncpg//')

echo "📡 Using sync connection for migrations..."
AVA_API_DATABASE_URL=$MIGRATION_URL alembic upgrade head

echo "✅ Database migration completed successfully!"
echo "🎉 Ready to start application!"
