#!/usr/bin/env bash
# Respaldo del volumen de datos de VibeMatch.
# Uso: sudo bash deploy/oracle/backup.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"
COMPOSE=(docker compose -f "$SCRIPT_DIR/compose.yaml" --env-file "$ENV_FILE")
BACKUP_DIR="$SCRIPT_DIR/backups"
KEEP_DAYS="${KEEP_DAYS:-30}"

if [ ! -f "$ENV_FILE" ]; then
  echo "Falta $ENV_FILE" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
ARCHIVO="$BACKUP_DIR/vibematch-data-$STAMP.tar.gz"

echo "==> Respaldando /app/data en $ARCHIVO"
"${COMPOSE[@]}" exec -T web tar czf - -C /app/data . > "$ARCHIVO"

if [ ! -s "$ARCHIVO" ]; then
  echo "ERROR: el respaldo quedó vacío." >&2
  rm -f "$ARCHIVO"
  exit 1
fi

tar tzf "$ARCHIVO" >/dev/null
echo "==> Respaldo OK ($(du -h "$ARCHIVO" | cut -f1))"

echo "==> Eliminando respaldos de más de $KEEP_DAYS días"
find "$BACKUP_DIR" -name 'vibematch-data-*.tar.gz' -mtime "+$KEEP_DAYS" -delete

echo "==> Respaldos disponibles:"
ls -lh "$BACKUP_DIR" | tail -n +2
