#!/bin/bash
# 🧪 Setup PostgreSQL Test Database - DIVINE Script

set -e  # Exit on error

echo "🔧 Setting up AVA test database..."

# PostgreSQL path (Homebrew)
PSQL="/opt/homebrew/Cellar/postgresql@15/15.14/bin/psql"

# Check if psql exists
if [ ! -f "$PSQL" ]; then
    echo "❌ PostgreSQL not found at $PSQL"
    echo "   Install with: brew install postgresql@15"
    exit 1
fi

# Drop existing test database (if exists)
echo "🗑️  Dropping existing avaai_test database (if exists)..."
$PSQL postgres -c "DROP DATABASE IF EXISTS avaai_test;" 2>/dev/null || true

# Create test database
echo "✨ Creating avaai_test database..."
$PSQL postgres -c "CREATE DATABASE avaai_test;"

echo "✅ Test database ready!"
echo "   Run tests with: cd api && pytest"
