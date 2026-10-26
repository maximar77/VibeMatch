#!/usr/bin/env bash
# Actualiza VibeMatch desde GitHub y reconstruye los contenedores.
# Uso: sudo bash deploy/oracle/update.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"
COMPOSE=(docker compose -f "$SCRIPT_DIR/compose.yaml" --env-file "$ENV_FILE")

if [ ! -f "$ENV_FILE" ]; then
  echo "Falta $ENV_FILE. Ejecuta primero install.sh" >&2
  exit 1
fi

echo "==> Actualizando código"
git -C "$REPO_DIR" pull --ff-only

echo "==> Reconstruyendo imagen"
cd "$REPO_DIR"
"${COMPOSE[@]}" build --pull

echo "==> Reiniciando servicios"
"${COMPOSE[@]}" up -d --remove-orphans

echo "==> Limpiando imágenes antiguas"
docker image prune -f

echo "==> Estado"
"${COMPOSE[@]}" ps
