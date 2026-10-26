#!/usr/bin/env bash
# Instalación de VibeMatch en Oracle Cloud (Ubuntu 22.04/24.04).
# Uso:
#   sudo bash deploy/oracle/install.sh
#   sudo VIBEMATCH_DOMAIN=vibematch.cl ACME_EMAIL=admin@vibematch.cl bash deploy/oracle/install.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"
COMPOSE=(docker compose -f "$SCRIPT_DIR/compose.yaml" --env-file "$ENV_FILE")

if [ "$(id -u)" -ne 0 ]; then
  echo "Ejecuta este script con sudo: sudo bash $0" >&2
  exit 1
fi

if ! command -v apt-get >/dev/null 2>&1; then
  echo "Este script asume Ubuntu/Debian con apt-get." >&2
  exit 1
fi

echo "==> Instalando dependencias base"
apt-get update -y
apt-get install -y ca-certificates curl gnupg git ufw openssl

echo "==> Instalando Docker Engine"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable --now docker

if ! docker compose version >/dev/null 2>&1; then
  apt-get install -y docker-compose-plugin
fi

echo "==> Configurando firewall (ufw)"
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp
ufw --force enable

echo "==> Configurando variables de entorno"
if [ ! -f "$ENV_FILE" ]; then
  cp "$SCRIPT_DIR/.env.example" "$ENV_FILE"

  DOMAIN="${VIBEMATCH_DOMAIN:-}"
  EMAIL="${ACME_EMAIL:-}"
  if [ -z "$DOMAIN" ]; then
    read -rp "Dominio sin https:// (ej: vibematch.cl o vibematch.duckdns.org): " DOMAIN
  fi
  if [ -z "$EMAIL" ]; then
    read -rp "Correo para Let's Encrypt: " EMAIL
  fi
  if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo "Dominio y correo son obligatorios." >&2
    exit 1
  fi

  SECRET="$(openssl rand -hex 32)"
  TEACHER_CODE="${VIBEMATCH_TEACHER_CODE:-VM-DOCENTE-$(openssl rand -hex 4)}"

  sed -i "s|^VIBEMATCH_DOMAIN=.*|VIBEMATCH_DOMAIN=$DOMAIN|" "$ENV_FILE"
  sed -i "s|^ACME_EMAIL=.*|ACME_EMAIL=$EMAIL|" "$ENV_FILE"
  sed -i "s|^VIBEMATCH_PUBLIC_URL=.*|VIBEMATCH_PUBLIC_URL=https://$DOMAIN|" "$ENV_FILE"
  sed -i "s|^BASE_URL=.*|BASE_URL=https://$DOMAIN|" "$ENV_FILE"
  sed -i "s|^VIBEMATCH_SECRET=.*|VIBEMATCH_SECRET=$SECRET|" "$ENV_FILE"
  sed -i "s|^VIBEMATCH_TEACHER_CODE=.*|VIBEMATCH_TEACHER_CODE=$TEACHER_CODE|" "$ENV_FILE"
  chmod 600 "$ENV_FILE"

  echo "   Archivo creado: $ENV_FILE"
  echo "   Código docente inicial: $TEACHER_CODE"
  echo "   Guárdalo; puedes cambiarlo luego en $ENV_FILE"
else
  echo "   Reutilizando $ENV_FILE"
fi

if grep -q '^VIBEMATCH_SECRET=$' "$ENV_FILE"; then
  echo "ERROR: VIBEMATCH_SECRET está vacío en $ENV_FILE" >&2
  exit 1
fi

echo "==> Compilando y levantando VibeMatch"
cd "$REPO_DIR"
"${COMPOSE[@]}" build --pull
"${COMPOSE[@]}" up -d --remove-orphans

echo "==> Esperando healthcheck"
for i in $(seq 1 30); do
  if "${COMPOSE[@]}" exec -T web wget -qO- http://127.0.0.1:3000/api/health >/dev/null 2>&1; then
    break
  fi
  sleep 5
  if [ "$i" -eq 30 ]; then
    echo "El contenedor no respondió. Revisa: ${COMPOSE[*]} logs web" >&2
    "${COMPOSE[@]}" ps
    exit 1
  fi
done

DOMAIN="$(grep '^VIBEMATCH_DOMAIN=' "$ENV_FILE" | cut -d= -f2-)"
echo
echo "=============================================="
echo " VibeMatch desplegado"
echo " URL:      https://$DOMAIN"
echo " Health:   https://$DOMAIN/api/health"
echo " Estado:   ${COMPOSE[*]} ps"
echo " Logs:     ${COMPOSE[*]} logs -f caddy web"
echo " Backup:   sudo bash deploy/oracle/backup.sh"
echo "=============================================="
