#!/bin/sh
# Rollback manuel de la dernière migration Flyway
# Joue le script undo correspondant à la version actuelle de la base
# Usage : pnpm db:rollback

set -e
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
ROOT_DIR=$(cd "$SCRIPT_DIR/.." && pwd)

# Charger .env.local ou .env
if [ -f "$ROOT_DIR/.env.local" ]; then
  set -a && . "$ROOT_DIR/.env.local" && set +a
elif [ -f "$ROOT_DIR/.env" ]; then
  set -a && . "$ROOT_DIR/.env" && set +a
fi

if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL non défini. Créer .env.local depuis .env.example"
  exit 1
fi

# Lire la version courante depuis Flyway
CURRENT_VERSION=$("$SCRIPT_DIR/flyway-run.sh" info 2>/dev/null \
  | grep "Schema version" | awk '{print $NF}')

if [ -z "$CURRENT_VERSION" ] || [ "$CURRENT_VERSION" = "empty" ]; then
  echo "❌ Impossible de lire la version courante (base vide ou Flyway inaccessible)"
  exit 1
fi

UNDO_FILE="$ROOT_DIR/flyway/undo/U${CURRENT_VERSION}__*.sql"
UNDO_MATCH=$(ls $UNDO_FILE 2>/dev/null | head -1)

if [ -z "$UNDO_MATCH" ]; then
  echo "❌ Aucun script undo trouvé pour V${CURRENT_VERSION}"
  echo "   Cherché : flyway/undo/U${CURRENT_VERSION}__*.sql"
  exit 1
fi

echo "⏪  Rollback V${CURRENT_VERSION} → $(basename "$UNDO_MATCH")"
psql "$DATABASE_URL" -f "$UNDO_MATCH"

echo ""
echo "✅  Rollback appliqué. Lance 'pnpm db:repair' si Flyway signale une incohérence."
