#!/bin/sh
# Installe les hooks git du projet dans .git/hooks/
# Usage : pnpm run install:hooks

set -e
ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
HOOKS_DIR="$ROOT_DIR/.git/hooks"
SOURCE_DIR="$ROOT_DIR/scripts/hooks"

if [ ! -d "$ROOT_DIR/.git" ]; then
  echo "❌ Pas de dépôt git trouvé dans $ROOT_DIR"
  exit 1
fi

# post-checkout
cp "$SOURCE_DIR/post-checkout.sh" "$HOOKS_DIR/post-checkout"
chmod +x "$HOOKS_DIR/post-checkout"
echo "✅  Hook installé : post-checkout"

echo ""
echo "Hooks git Trackshield installés avec succès."
echo "Ils se déclenchent automatiquement à chaque 'git checkout'."
