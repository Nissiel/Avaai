#!/bin/bash
set -euo pipefail

# Load Homebrew environment so npm/node from /opt/homebrew/bin are available.
eval "$(/opt/homebrew/bin/brew shellenv)"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Starting websocket-server with npm run dev..."
npm run dev
