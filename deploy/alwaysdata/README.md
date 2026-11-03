# Despliegue de VibeMatch en AlwaysData

AlwaysData (servicio francés, `alwaysdata.com`) permite alojar un sitio Node.js con
**disco persistente en el home**, SSH y HTTPS. Es una alternativa válida a Oracle Cloud y
mucho más simple para la entrega del jueves.

Esta guía deja la web dinámica de VibeMatch (Next.js + Server Actions + archivos JSON)
funcionando con escritura real en disco. No usa Docker: AlwaysData Public Cloud no ofrece
Docker ni `sudo`.

## Cómo se guardan los datos

| Ruta | Contenido | Persistencia |
| --- | --- | --- |
| `~/vibematch/` | Código de la app (se reemplaza en cada despliegue) | No |
| `~/vibematch-data/` | `cards.json`, `profiles.json`, `chat.json`, `muros.json`, `teachers.json`, etc. | **Sí** |
| `~/vibematch-data/archivos-profesor/` | Archivos subidos por docentes | **Sí** |

La app lee `VIBEMATCH_DATA_DIR` y copia las semillas (`cards.json`, `teachers.json`) la
primera vez. Un despliegue nuevo **nunca** borra `~/vibematch-data`.

AlwaysData realiza backups diarios del home. Además puedes descargar un respaldo manual por
SSH:

```bash
ssh USUARIO@ssh-USUARIO.alwaysdata.net
tar -czf ~/backup-vibematch-$(date +%F).tar.gz -C ~ vibematch-data
```

## 1. Requisitos previos

- Cuenta de AlwaysData con un plan que incluya Node.js y SSH (el plan gratuito sirve para
  probar; para producción escolar usa un plan de pago).
- Dominio o subdominio incluido, por ejemplo `https://TU_CUENTA.alwaysdata.net`.
- Node.js 24 seleccionado en AlwaysData.
- Acceso SSH habilitado en **Remote access → SSH**.

Genera una clave dedicada si aún no tienes una:

```bash
ssh-keygen -t ed25519 -C "vibematch-alwaysdata" -f ~/.ssh/alwaysdata_vibematch
cat ~/.ssh/alwaysdata_vibematch.pub
```

Pega la clave pública en **AlwaysData → Remote access → SSH → Add a public key**. Prueba:

```bash
ssh -i ~/.ssh/alwaysdata_vibematch USUARIO@ssh-USUARIO.alwaysdata.net
```

## 2. Crear el sitio Node.js

En **Web → Sites → Add a site**:

| Campo | Valor |
| --- | --- |
| Type | **Node.js** |
| Addresses | tu dominio o `TU_CUENTA.alwaysdata.net` |
| Command | `node /home/USUARIO/vibematch/start.js` |
| Working directory | `/home/USUARIO/vibematch` |
| Node.js version | **24** |

AlwaysData entrega `HOST`/`IP` y `PORT` al proceso y enruta el dominio hacia él. `start.js`
traduce esas variables a `HOSTNAME`, fija el directorio correcto y arranca el servidor
standalone de Next.js.

> No uses `npm start` ni `next start` en AlwaysData: el paquete standalone ya contiene el
> servidor y sus dependencias, y `next start` no existe en producción.

### Límite de memoria (~256 MB)

El plan usado limita cada proceso a ~256 MB de RSS. `npm install` y `next build` superan
ese límite y el proceso muere con `SIGKILL` (`signal 9`). Por eso:

- El build se hace en tu equipo con `package.sh`.
- En el servidor **no** se ejecuta `npm install` ni `npm run build`.
- La app corre con `node start.js` (~100 MB).

Si el panel todavía conserva el comando por defecto
(`npm install && npm run build && npx next start -H :: -p $PORT`), cámbialo por
`node /home/USUARIO/vibematch/start.js`. Mientras no puedas cambiarlo, el despliegue usado
deja un envoltorio en `~/.local/bin/npm` que intercepta `npm install` y arranca la app con
`exec` (mismo PID), de modo que AlwaysData lo considere el proceso del sitio:

```bash
mkdir -p ~/.local/bin
cat > ~/.local/bin/npm <<'EOF'
#!/bin/sh
case "$1" in
  install|i|ci)
    exec /usr/bin/node /home/USUARIO/vibematch/start.js
    ;;
esac
exec /usr/bin/npm "$@"
EOF
chmod +x ~/.local/bin/npm
```

Ese envoltorio es un parche temporal: lo limpio es corregir el comando del sitio en el
panel y borrar `~/.local/bin/npm`.

## 3. Compilar el paquete

En tu máquina, desde la raíz del proyecto:

```bash
./deploy/alwaysdata/package.sh
```

El script ejecuta `npm run build`, copia `.next/static` y `public` dentro del standalone y
genera:

```
dist/alwaysdata/vibematch/            ← contenido de la app
dist/alwaysdata/VibeMatch-1.2.0.tar.gz
dist/alwaysdata/SHA256SUMS.txt
```

## 4. Subir la aplicación

### Opción A: script incluido (recomendado)

```bash
ALWAYSDATA_USER=USUARIO \
ALWAYSDATA_KEY=~/.ssh/alwaysdata_vibematch \
./deploy/alwaysdata/deploy.sh
```

El script sube a `~/vibematch.new`, conserva la versión anterior en `~/vibematch.old` y
activa la nueva. Los datos de `~/vibematch-data` no se tocan.

### Opción B: manual

```bash
rsync -az --delete dist/alwaysdata/vibematch/ \
  USUARIO@ssh-USUARIO.alwaysdata.net:~/vibematch/
```

O comprime el `.tar.gz`, súbelo por SFTP y extráelo por SSH:

```bash
ssh USUARIO@ssh-USUARIO.alwaysdata.net
mkdir -p ~/vibematch
tar -xzf ~/VibeMatch-1.2.0.tar.gz -C ~/vibematch --strip-components=1
mkdir -p ~/vibematch-data
```

## 5. Configurar variables de entorno

En **Web → Sites → tu sitio → Environment**, agrega como mínimo:

```dotenv
VIBEMATCH_SECRET=<cadena aleatoria de 32 bytes>
VIBEMATCH_PUBLIC_URL=https://TU_DOMINIO
VIBEMATCH_COOKIE_SECURE=1
VIBEMATCH_TEACHER_CODE=<código del colegio>
VIBEMATCH_DATA_DIR=/home/USUARIO/vibematch-data
VIBEMATCH_DATA_PERSISTENT=1
BASE_URL=https://TU_DOMINIO
SCHOOL_NAME=Colegio Superior del Maipo
VIBEMATCH_APP_VERSION=1.2.0
VIBEMATCH_APP_VERSION_CODE=3
VIBEMATCH_APP_APK_URL=https://TU_DOMINIO/descargas/VibeMatch-1.2.0.apk
```

Genera el secreto así:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

`VIBEMATCH_DATA_DIR` es la pieza clave: sin ella la app escribiría dentro de
`~/vibematch/data` y cada despliegue podría sobrescribir los datos.

## 6. Reiniciar y verificar

1. Pulsa **Restart** en el panel del sitio.
2. Abre `https://TU_DOMINIO/api/health`.

Respuesta esperada:

```json
{
  "ok": true,
  "service": "vibematch",
  "checks": {
    "dataWritable": true,
    "dataPersistent": true,
    "secretConfigured": true
  }
}
```

Si `ok` es `false`, revisa el log del sitio en AlwaysData y las variables de entorno.

Pruebas rápidas:

```bash
curl -fsS https://TU_DOMINIO/api/health
curl -fsS https://TU_DOMINIO/api/app-version
curl -I  https://TU_DOMINIO/descargas/VibeMatch-1.2.0.apk
```

## 7. Actualizar la web

```bash
# 1. Compilar
./deploy/alwaysdata/package.sh

# 2. Subir
ALWAYSDATA_USER=USUARIO ALWAYSDATA_KEY=~/.ssh/alwaysdata_vibematch \
  ./deploy/alwaysdata/deploy.sh

# 3. Reiniciar el sitio en el panel de AlwaysData
```

> **Importante:** Next.js cachea la lista de archivos de `public/` al arrancar. Si agregas
> un archivo nuevo (por ejemplo un APK), seguirá dando 404 hasta que reinicies el sitio.
> Reemplazar un archivo existente sí funciona sin reinicio.

Los cambios de web llegan solos a la APK porque la app carga el sitio remoto. Solo hay que
publicar un APK nuevo cuando cambien capacidades nativas (NFC, cámara, deep links,
permisos o versión mínima).

## 8. APK y App Links

Para que los enlaces `https://TU_DOMINIO/a/<token>` abran la app:

1. Compila la APK con el dominio final:
   ```bash
   VIBEMATCH_APP_URL=https://TU_DOMINIO npx cap sync android
   cd android && ./gradlew assembleRelease bundleRelease
   ```
2. Verifica que `https://TU_DOMINIO/.well-known/assetlinks.json` responda con el
   fingerprint del keystore de release.
3. Instala el APK y prueba un enlace NFC/QR.

Si usas otro dominio, actualiza también `VIBEMATCH_PUBLIC_URL`, `BASE_URL` y
`VIBEMATCH_APP_APK_URL`.

## 9. Problemas frecuentes

| Síntoma | Causa probable | Solución |
| --- | --- | --- |
| 502 Bad Gateway | El proceso no arrancó o no escucha en `PORT` | Revisa el log; usa `start.js`; confirma Node 24 |
| `/api/health` da 503 con `dataWritable:false` | `VIBEMATCH_DATA_DIR` no existe o no tiene permisos | `mkdir -p ~/vibematch-data && chmod 700 ~/vibematch-data` |
| `dataPersistent:false` | El directorio está en `/tmp` | Mueve los datos al home y define `VIBEMATCH_DATA_PERSISTENT=1` |
| Las tarjetas no validan | Semillas no copiadas | Copia `data/cards.json` a `~/vibematch-data/cards.json` y reinicia |
| Las sesiones se cierran | `VIBEMATCH_SECRET` cambia entre reinicios | Fija un secreto estable en el panel |
| Los enlaces abren el navegador | Falta `assetlinks.json` o el fingerprint no coincide | Publica el archivo y reinstala la APK |
| El proceso muere con `signal 9` | `npm install`/`next build` superan los ~256 MB del plan | Compila en tu equipo y usa el paquete precompilado |
| 404 en un archivo nuevo de `public/` | Next cachea la lista de `public` al arrancar | Reinicia el sitio en el panel |
| El sitio queda 502 tras subir | El proceso no arrancó o `PORT`/`HOSTNAME` no coinciden | Revisa el log; usa `start.js`; confirma Node 24 |

## 10. Seguridad

- No subas `.env.local`, `vercel.env`, `android/keystore.properties` ni `data/` con datos
  reales al repositorio.
- Usa HTTPS (AlwaysData lo activa con Let's Encrypt desde el panel).
- Cambia `VIBEMATCH_TEACHER_CODE` antes de entregar el sitio al colegio.
- Mantén `VIBEMATCH_COOKIE_SECURE=1` en producción.
- Descarga un backup de `~/vibematch-data` antes de cada cambio grande.
- El plan gratuito puede suspender procesos inactivos; para el piloto usa un plan estable.

## 11. Por qué no Docker

AlwaysData Public Cloud no permite Docker ni `sudo`. El despliegue standalone de Next.js
encaja mejor: un proceso Node, un puerto y un directorio persistente. La carpeta
`deploy/oracle/` se conserva como alternativa si más adelante se aprovisiona una VM.
