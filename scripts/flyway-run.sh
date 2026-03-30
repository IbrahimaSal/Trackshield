#!/bin/sh
# Wrapper Flyway — convertit DATABASE_URL (postgresql://) en JDBC pour Flyway CLI
# Usage : ./scripts/flyway-run.sh [commande flyway] ex: migrate, info, validate, undo

set -e
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
ROOT_DIR=$(cd "$SCRIPT_DIR/.." && pwd)

# Charger .env.local en priorité, sinon .env
if [ -f "$ROOT_DIR/.env.local" ]; then
  set -a && . "$ROOT_DIR/.env.local" && set +a
elif [ -f "$ROOT_DIR/.env" ]; then
  set -a && . "$ROOT_DIR/.env" && set +a
fi

if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL non défini. Créer .env.local depuis .env.example"
  exit 1
fi

# Convertir postgresql://user:pass@host:port/db → JDBC + extraire user/pass
# Supprimer le préfixe postgresql://
_URL_NO_PROTO="${DATABASE_URL#postgresql://}"
# user = tout avant le premier ':'
_DB_USER="${_URL_NO_PROTO%%:*}"
# rest = tout après le premier ':'
_REST="${_URL_NO_PROTO#*:}"
# pass = tout avant le premier '@'
_DB_PASS="${_REST%%@*}"
# host:port/db = tout après le '@'
_HOST_PORT_DB="${_REST#*@}"
# URL JDBC finale
_JDBC_URL="jdbc:postgresql://${_HOST_PORT_DB}"

flyway \
  -configFiles="$ROOT_DIR/flyway/flyway.toml" \
  -url="$_JDBC_URL" \
  -user="$_DB_USER" \
  -password="$_DB_PASS" \
  "$@"
