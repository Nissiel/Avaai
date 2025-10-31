#!/bin/bash

# 🔥 DIVINE QUICK START - Starts Backend + Frontend Together
# ============================================================

echo "🔥 DIVINE ASSISTANT - Starting Complete Stack"
echo "=============================================="

cd /Users/nissielberrebi/Desktop/Avaai

# Check if dev.sh exists
if [ ! -f "scripts/dev.sh" ]; then
    echo "❌ scripts/dev.sh not found!"
    exit 1
fi

# Make dev.sh executable
chmod +x scripts/dev.sh

# Run dev script
echo "🚀 Starting backend (port 8000) + frontend (port 3000)..."
./scripts/dev.sh
