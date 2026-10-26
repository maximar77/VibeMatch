#!/usr/bin/env bash
# Restaura un respaldo del volumen de datos de VibeMatch.
# Uso: sudo bash deploy/oracle/restore.sh deploy/oracle/backups/ARCHIVO.tar.gz
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"
COMPOSE=(docker compose -f "$SCRIPT_DIR/compose.yaml" --env-file "$ENV_FILE")
ARCHIVO="${1:-}"

if [ -z "$ARCHIVO" ] || [ ! -f "$ARCHIVO" ]; then
  echo "Uso: sudo bash $0 deploy/oracle/backups/ARCHIVO.tar.gz" >&2
  exit 1
fi

echo "==> Verificando archivo"
tar tzf "$ARCHIVO" >/dev/null

echo "==> Deteniendo la app"
"${COMPOSE[@]}" stop web

echo "==> Restaurando $ARCHIVO en /app/data"
cat "$ARCHIVO" | "${COMPOSE[@]}" run --rm --no-deps -T --entrypoint sh web -c 'tar xzf - -C /app/data'

echo "==> Iniciando la app"
"${COMPOSE[@]}" start web

echo "==> Restauración completada. Verifica /api/health y los datos."
