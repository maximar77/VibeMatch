# VibeMatch

Microempresa escolar de tecnología e interacción social. VibeMatch conecta a estudiantes
mediante una solución **phygital**: una tarjeta NFC (o QR de respaldo) abre un perfil con
intereses, pronombres y estado de ánimo, y desde ahí se accede a zonas de interés y chat
moderado dentro de la comunidad escolar.

El acceso está diseñado para la **Ley 21.801**: no depende del celular personal del
estudiante durante la jornada escolar. La tarjeta es la llave y los puntos de acceso son
equipos del establecimiento (Puntos Vibe, laboratorio y, más adelante, la app de escritorio).

- **Público objetivo:** estudiantes de 12 a 22 años de comunidades escolares y académicas.
- **Establecimiento piloto:** Colegio Superior del Maipo (Chile).
- **Responsable:** Maximo Orellana.
- **Repositorio:** https://github.com/maximar77/VibeMatch (privado)

## Stack

- [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- React 19 + TypeScript
- Tailwind CSS 4
- PWA instalable (manifest + service worker)
- Android nativo con [Capacitor 8](https://capacitorjs.com/) (APK 1.0.0 firmada)
- NFC (`@capgo/capacitor-nfc`) y QR (`jsqr` + `BarcodeDetector`)
- Producción con Docker + Caddy en Oracle Cloud
- ESLint

## Puesta en marcha

Requiere Node.js 20.9 o superior (probado con Node 24 LTS).

```bash
npm install
npm run dev
```

La app queda disponible en <http://localhost:3000>.

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm start` | Ejecutar el build |
| `npm run lint` | Análisis con ESLint |
| `npm run typecheck` | Verificación de tipos |

### Acceso por tarjeta (demo local)

```bash
# Genera 3 tarjetas demo y escribe los tokens en data/tarjetas-demo.csv
node scripts/generar-tarjetas.mjs

# Añade 100 tarjetas guest (sin nombre: la persona completa su perfil al entrar)
node scripts/generar-tarjetas.mjs --append --guest --count=100 --quiet

# Añade el token genérico que abre la landing pública
node scripts/generar-tarjetas.mjs --append --public --quiet

# Servidor de producción en el puerto usado por los enlaces demo
npm run build
npx next start -p 3100
```

Rutas principales:

- `/` sin token muestra un error de acceso. No es la landing pública.
- `/a/<token-personal>` abre la bienvenida de una tarjeta; al entrar pide crear el
  perfil y luego muestra el dashboard con el acceso a la instalación.
- `/a/vibematch-acceso-publico-2026` abre la landing pública con los contactos para
  solicitar el kit. Este token no crea sesión ni pide perfil.
- `/app` está protegido por la cookie de sesión; sin perfil redirige al onboarding.
- `/app/instalar` solo se abre con sesión y perfil completo.

El generador imprime una URL `/a/<token>` por tarjeta. Esa URL es la que se graba en el
NFC y se imprime como QR. El registro `data/cards.json` guarda solo hashes SHA-256; el CSV
con los tokens en claro está ignorado por Git. Los perfiles se guardan en
`data/profiles.json`, también ignorado por Git porque contienen datos personales.

La web app es instalable (PWA): manifiesto, service worker e iconos están en
`src/app/manifest.ts`, `public/sw.js` y `public/icons/`. La instalación requiere HTTPS o
`localhost`; en iPhone se hace con Safari → Compartir → Añadir a pantalla de inicio.

### App Android (APK)

La versión **1.0.0** está compilada y firmada. La app envuelve la misma web con Capacitor
para reutilizar la sesión, las Server Actions y el perfil, y añade lectura NFC nativa, QR
con cámara y deep links.

- Paquete `cl.vibematch.app`, `minSdk 24`, `targetSdk 36`.
- Servidor por defecto: `https://vibematch.cl`. En el primer arranque se puede cambiar
  por el dominio real o por la demo; también con el atajo **Configurar servidor** o
  `vibematch://config`.
- La URL se guarda en el dispositivo: **no hay que recompilar** para apuntar a otro
  dominio. Está pensada para desplegar Oracle sin volver a firmar.
- Artefactos `VibeMatch-1.0.0.apk` y `VibeMatch-1.0.0.aab` adjuntos en la
  [release de GitHub](https://github.com/maximar77/VibeMatch/releases/latest).
  Instrucciones, huella de firma y límites en [`docs/apk.md`](docs/apk.md).

```bash
# Compilar (Windows PowerShell)
$env:JAVA_HOME="C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot"
$env:ANDROID_HOME="$env:LOCALAPPDATA\Android\Sdk"
npx cap sync android
cd android
.\gradlew.bat assembleRelease bundleRelease
```

La firma se lee de `android/keystore.properties` (ignorado por Git). El keystore de
release debe respaldarse fuera del repositorio; sin él no se pueden publicar
actualizaciones de la misma app.

## Producción en Oracle Cloud

La guía completa está en [`deploy/oracle/README.md`](deploy/oracle/README.md): creación de
la instancia, Security List y `ufw`, DNS, Caddy con HTTPS automático, Docker Compose,
volumen persistente, backups, restauración, actualización y checklist.

```bash
# En la instancia, después de clonar y configurar deploy/oracle/.env
sudo bash deploy/oracle/install.sh

# Verificación
curl -fsS https://TU_DOMINIO/api/health
# {"ok":true,"service":"vibematch","checks":{...}}
```

El endpoint `/api/health` comprueba que el proceso responde, que el directorio de datos es
escribible y que `VIBEMATCH_SECRET` está configurado. En Oracle los datos persisten en el
volumen `vibematch_data`; en Vercel la demo usa `/tmp` y por eso no es persistente.

Variables relevantes:

| Variable | Uso |
| --- | --- |
| `VIBEMATCH_SECRET` | Secreto HMAC de la cookie de sesión. Obligatorio en producción. |
| `VIBEMATCH_COOKIE_SECURE=1` | Activa `Secure` cuando el sitio se sirve por HTTPS. |
| `BASE_URL` | Dominio impreso por el generador (por defecto `http://localhost:3100`). |
| `SCHOOL_NAME` | Nombre del establecimiento en las tarjetas generadas. |
| `VIBEMATCH_DATA_DIR` | Opcional. Directorio de datos alternativo (por ejemplo `/tmp/vibematch-data` en una demo sin disco persistente). En Oracle se omite para usar `./data`. |

Copia `.env.example` a `.env.local` y completa `VIBEMATCH_SECRET` antes de un despliegue real.

## Estructura del repositorio

```
VibeMatch/
├── src/app/               App Router: acceso, onboarding, dashboard, instalación y PWA
├── src/components/        Marca, formulario de perfil, instalación y shell de la app
├── src/lib/cards.ts       Tokens, sesión HMAC y registro de tarjetas
├── src/lib/profile-schema.ts  Campos y tipos compartidos del perfil
├── src/lib/profiles.ts    Persistencia local de perfiles (data/profiles.json)
├── src/app/manifest.ts    Manifiesto de la web app instalable
├── public/sw.js           Service worker (solo recursos estáticos)
├── public/icons/          Iconos 192/512, maskable y Apple Touch
├── public/marca/          Recortes de logotipo, isotipo, imagotipo e isologotipo
├── scripts/               Generador de tarjetas, guests y token público
├── deploy/oracle/         Docker Compose, Caddy, backups y guía de Oracle Cloud
├── android/               Proyecto Capacitor/Android y firma de la APK
├── public/.well-known/    assetlinks.json para App Links de Android
├── data/cards.json        Registro de tarjetas (solo hashes) — no versionar tokens
├── data/profiles.json     Perfiles locales — ignorado por Git (datos personales)
├── docs/                  Documentación, especificación y arquitectura
│   ├── marca/             Análisis visual y paleta derivada de las referencias
│   └── arquitectura/      Acceso por tarjeta y diseño para la Ley 21.801
├── Referencia VibeMatch/  Imágenes y documentos originales del equipo
├── AGENTS.md              Reglas de Next.js para asistentes de código
├── next.config.ts
└── package.json
```

## Documentación

| Documento | Contenido |
| --- | --- |
| `docs/VibeMatch - Esquema de Proyecto de Diseño e Ideas.docx` | Idea, público, matching por NFC/QR, perfil, chat, moderación, piloto y factibilidad. |
| `docs/Manual de Identidad Corporativa - VibeMatch.docx` | Marca, valores, misión/visión, logotipo, isotipo, imagotipo, isologotipo y Phygital Pack. |
| `docs/Manual de Identidad Corporativa Completo - VibeMatch.docx` | Versión extendida del manual: equipo, identidad visual, producto y flujo UX. |
| `docs/Actividad de Packaging y Diseño - VibeMatch.docx` | Packaging, normativa chilena (SERNAC, Minsal, SUBTEL) y stand de ventas. |
| `docs/arquitectura/acceso-y-dispositivos.md` | Ley 21.801, canales de acceso, tokens guest/público, onboarding, perfiles, PWA y seguridad. |
| `docs/plan-apps.md` | Web app instalable, estado de la APK (Capacitor), plan del `.exe` (Tauri), API necesaria y fases. |
| `docs/apk.md` | APK 1.0.0: instalación, configuración del servidor, firma, compilación y límites. |
| `deploy/oracle/README.md` | Despliegue completo en Oracle Cloud: red, DNS, HTTPS, Docker, persistencia, backups y actualizaciones. |

Resumen navegable: [`docs/README.md`](docs/README.md) · Especificación funcional: [`docs/producto.md`](docs/producto.md)

## Estado del proyecto

- [x] Repositorio Git + GitHub privado con documentación base.
- [x] Scaffold de Next.js, TypeScript y Tailwind CSS.
- [x] Landing page de presentación de la marca, accesible solo con token público.
- [x] Identidad visual aplicada: logotipo, isotipo, imagotipo, isologotipo y favicon reales.
- [x] Error de acceso en `/` para quien llega sin token.
- [x] Token público `vibematch-acceso-publico-2026` con landing y contactos para pedir el kit.
- [x] 100 tarjetas guest únicas, sin nombre, listas para completar perfil al entrar.
- [x] Acceso por tarjeta única: `/a/[token]`, bienvenida, cookie de sesión y `/app` protegido.
- [x] Onboarding de perfil en el primer ingreso, edición y persistencia en `data/profiles.json`.
- [x] Dashboard con perfil, zonas de interés, instalación y cierre de sesión.
- [x] Web app instalable (PWA): manifiesto, service worker, iconos y página de instalación protegida.
- [x] Generación de tarjetas con tokens únicos (solo hashes en el repositorio).
- [x] API de perfil para la app (`/api/perfil` GET/PUT) y healthcheck de producción.
- [x] Despliegue de producción preparado para Oracle Cloud (Docker, Caddy, volumen, backups).
- [x] Build y firma de la app Android 1.0.0 (APK + AAB) con NFC, QR y deep links.
- [ ] Codificación física de tarjetas NFC y generación de QR imprimibles.
- [ ] Matching, chat moderado y zonas de interés conectadas a datos reales.
- [ ] Panel de moderación, revocación y logs.
- [ ] Build y distribución del ejecutable de Windows (EXE); la UI lo muestra “en preparación”.

## Flujo de trabajo

```bash
git status
git add .
git commit -m "descripción del cambio"
git push
```

Las ramas principales son `main` (estable) y ramas cortas por funcionalidad
(`feat/...`, `fix/...`, `docs/...`).

### Notas de diseño

La paleta se derivó de las imágenes de referencia (`#6D7ED3` como tinta principal) y está
documentada en [`docs/marca/analisis-visual.md`](docs/marca/analisis-visual.md). Las cuatro
variantes de marca se recortaron a PNG con fondo transparente en `public/marca/`. Cuando el
equipo entregue los archivos vectoriales o los códigos oficiales, se reemplazan los recortes
sin tocar la estructura de la landing.
