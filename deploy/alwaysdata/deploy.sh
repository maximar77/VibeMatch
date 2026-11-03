#!/usr/bin/env bash
# Despliegue por SSH/rsync a AlwaysData.
#
# Requisitos:
#   - Cuenta de AlwaysData con acceso SSH habilitado.
#   - Clave pública cargada en AlwaysData → Remote access → SSH.
#   - Paquete generado con ./deploy/alwaysdata/package.sh
#
# Uso:
#   ALWAYSDATA_USER=mi_cuenta ./deploy/alwaysdata/deploy.sh
#
# Variables opcionales:
#   ALWAYSDATA_HOST   (por defecto ssh-<usuario>.alwaysdata.net)
#   ALWAYSDATA_DIR    (por defecto vibematch, relativo al home)
#   ALWAYSDATA_KEY    (ruta a la clave privada; por defecto la del agente SSH)

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

: "${ALWAYSDATA_USER:?Define ALWAYSDATA_USER con tu usuario de AlwaysData}"

HOST="${ALWAYSDATA_HOST:-ssh-${ALWAYSDATA_USER}.alwaysdata.net}"
REMOTE_DIR="${ALWAYSDATA_DIR:-vibematch}"
SSH_OPTS=(-o StrictHostKeyChecking=accept-new)
if [[ -n "${ALWAYSDATA_KEY:-}" ]]; then
  SSH_OPTS+=(-i "$ALWAYSDATA_KEY")
fi

VERSION="$(sed -n 's/.*versionName "\([^"]*\)".*/\1/p' android/app/build.gradle | head -1)"
VERSION="${VIBEMATCH_RELEASE_VERSION:-${VERSION:-1.2.0}}"
PACKAGE="$ROOT/dist/alwaysdata/vibematch"

if [[ ! -d "$PACKAGE" ]]; then
  echo "No existe $PACKAGE. Ejecutando package.sh..."
  "$ROOT/deploy/alwaysdata/package.sh"
fi

REMOTE="${ALWAYSDATA_USER}@${HOST}"

echo "==> Subiendo VibeMatch $VERSION a ${REMOTE}:~/${REMOTE_DIR}.new"
ssh "${SSH_OPTS[@]}" "$REMOTE" "rm -rf ~/${REMOTE_DIR}.new && mkdir -p ~/${REMOTE_DIR}.new"
rsync -az --delete -e "ssh ${SSH_OPTS[*]}" "$PACKAGE/" "${REMOTE}:~/${REMOTE_DIR}.new/"

echo "==> Activando la nueva versión"
ssh "${SSH_OPTS[@]}" "$REMOTE" "
  set -e
  mkdir -p ~/vibematch-data
  if [ -d ~/${REMOTE_DIR} ]; then rm -rf ~/${REMOTE_DIR}.old; mv ~/${REMOTE_DIR} ~/${REMOTE_DIR}.old; fi
  mv ~/${REMOTE_DIR}.new ~/${REMOTE_DIR}
  echo 'Contenido activo:'
  ls -la ~/${REMOTE_DIR} | head -20
"

cat <<EOF

Despliegue copiado. Falta reiniciar el proceso para que AlwaysData cargue la
nueva versión:

  1. Entra en AlwaysData → Web → Sites → tu sitio → Restart.
  2. Verifica: curl -fsS https://TU_DOMINIO/api/health

Los datos reales están en ~/vibematch-data y no se tocaron.
EOF
