#!/bin/sh
# Hook git post-checkout — vérifie l'état des migrations Flyway après un changement de branche
# Installé via : pnpm run install:hooks

PREV_HEAD=$1
NEW_HEAD=$2
BRANCH_SWITCH=$3  # 1 = checkout de branche, 0 = checkout de fichier

# Ne s'exécuter que sur les changements de branche (pas les checkouts de fichiers)
if [ "$BRANCH_SWITCH" != "1" ]; then
  exit 0
fi

BRANCH=$(git rev-parse --abbrev-ref HEAD)
ROOT_DIR=$(git rev-parse --show-toplevel)

echo ""
echo "🔀  Branche : $BRANCH"

# Vérifier si .env.local ou .env existe (nécessaire pour Flyway)
if [ ! -f "$ROOT_DIR/.env.local" ] && [ ! -f "$ROOT_DIR/.env" ]; then
  echo "⚠️   Pas de .env.local — impossible de vérifier les migrations"
  echo "    Crée .env.local depuis .env.example avant de lancer l'app"
  echo ""
  exit 0
fi

# Vérifier l'état des migrations
FLYWAY_OUTPUT=$("$ROOT_DIR/scripts/flyway-run.sh" info 2>&1)
FLYWAY_EXIT=$?

if [ $FLYWAY_EXIT -ne 0 ]; then
  echo "⚠️   Flyway inaccessible (base éteinte ?)"
  echo "    Lance 'docker compose up -d' puis 'pnpm db:info' pour vérifier"
  echo ""
  exit 0
fi

PENDING=$(echo "$FLYWAY_OUTPUT" | grep -c "Pending" 2>/dev/null || echo "0")
FAILED=$(echo "$FLYWAY_OUTPUT" | grep -c "Failed" 2>/dev/null || echo "0")

if [ "$FAILED" -gt 0 ]; then
  echo "❌  Migration(s) en échec détectée(s) !"
  echo "    Lance : pnpm db:info pour le détail"
  echo ""
elif [ "$PENDING" -gt 0 ]; then
  echo "⚠️   $PENDING migration(s) en attente sur cette branche"
  echo "    Lance : pnpm db:migrate  → appliquer les migrations"
  echo "    Ou    : pnpm db:info     → voir le détail"
  echo ""
else
  echo "✅  Base de données à jour"
  echo ""
fi
