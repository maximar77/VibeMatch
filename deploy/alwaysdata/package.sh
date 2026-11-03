#!/usr/bin/env bash
# Construye el paquete autónomo que se sube a AlwaysData.
#
# Uso:
#   ./deploy/alwaysdata/package.sh
#   VIBEMATCH_RELEASE_VERSION=1.2.0 ./deploy/alwaysdata/package.sh
#
# Resultado:
#   dist/alwaysdata/vibematch/            (contenido listo para subir)
#   dist/alwaysdata/VibeMatch-<ver>.tar.gz
#   dist/alwaysdata/SHA256SUMS.txt

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

VERSION="${VIBEMATCH_RELEASE_VERSION:-}"
if [[ -z "$VERSION" ]]; then
  VERSION="$(sed -n 's/.*versionName "\([^"]*\)".*/\1/p' android/app/build.gradle | head -1)"
fi
VERSION="${VERSION:-1.2.0}"

OUT="$ROOT/dist/alwaysdata"
APP="$OUT/vibematch"
TARBALL="$OUT/VibeMatch-$VERSION.tar.gz"

echo "==> VibeMatch $VERSION · build de producción"

# El build no debe leer .env.local: contiene la IP de la red local y secretos de
# desarrollo. AlwaysData entrega las variables reales en tiempo de ejecución.
ENV_LOCAL_BACKUP=""
if [[ -f "$ROOT/.env.local" ]]; then
  ENV_LOCAL_BACKUP="$ROOT/.env.local.package-backup"
  mv "$ROOT/.env.local" "$ENV_LOCAL_BACKUP"
  trap 'if [[ -n "$ENV_LOCAL_BACKUP" && -f "$ENV_LOCAL_BACKUP" ]]; then mv -f "$ENV_LOCAL_BACKUP" "$ROOT/.env.local"; fi' EXIT
fi

if [[ -z "${VIBEMATCH_PUBLIC_URL:-}" ]]; then
  echo "AVISO: VIBEMATCH_PUBLIC_URL no está definida durante el build."
  echo "       Pásala para que los enlaces generados usen el dominio real, por ejemplo:"
  echo "       VIBEMATCH_PUBLIC_URL=https://TU_DOMINIO ./deploy/alwaysdata/package.sh"
fi

npm run build

echo "==> Copiando salida standalone"
rm -rf "$APP"
mkdir -p "$APP"

# Copiamos solo lo que el servidor standalone necesita. Turbopack puede trazar
# el proyecto completo cuando hay rutas de datos dinámicas; este whitelist evita
# subir documentación, imágenes y archivos de referencia.
for item in .next node_modules package.json server.js; do
  if [[ -e ".next/standalone/$item" ]]; then
    cp -a ".next/standalone/$item" "$APP/"
  fi
done

mkdir -p "$APP/.next"
rm -rf "$APP/.next/static"
cp -a .next/static "$APP/.next/static"

rm -rf "$APP/public"
cp -a public "$APP/public"

# Semillas para el primer arranque. En producción los datos reales viven en
# VIBEMATCH_DATA_DIR (fuera de esta carpeta), así que un despliegue nunca los
# sobrescribe.
mkdir -p "$APP/data"
cp -f data/cards.json data/teachers.json "$APP/data/" 2>/dev/null || true

cp -f deploy/alwaysdata/start.js "$APP/start.js"
cp -f deploy/alwaysdata/env.example "$APP/env.example"
chmod +x "$APP/start.js"

# No incluir secretos locales ni cachés de desarrollo.
rm -f "$APP/.env" "$APP/.env.local" "$APP/.env.production" 2>/dev/null || true

echo "==> Empaquetando"
rm -f "$TARBALL"
tar -czf "$TARBALL" -C "$OUT" vibematch

(
  cd "$OUT"
  sha256sum "VibeMatch-$VERSION.tar.gz" > SHA256SUMS.txt
)

echo
echo "Paquete listo:"
echo "  $APP"
echo "  $TARBALL"
echo "  $(cat "$OUT/SHA256SUMS.txt")"
echo
echo "Sube el contenido de vibematch/ a ~/vibematch en AlwaysData."
echo "Guía completa: deploy/alwaysdata/README.md"
