# APK Android de VibeMatch 1.2.0

Aplicación Android firmada que envuelve la web de VibeMatch con Capacitor. Reutiliza la
misma sesión, Server Actions y perfil que la web, y añade lectura NFC nativa, escaneo QR
y deep links.

> Estado: **compilada y firmada**. Verificada con Gradle, `apksigner`, `jarsigner` y
> `aapt2`. No se pudo probar en un dispositivo físico durante esta compilación porque no
> había tablets conectadas; antes del piloto hay que validar NFC, cámara y deep links en el
> hardware real.
>
> La versión 1.2.0 incluye el puente de versión, el aviso de actualización nativa desde
> `/api/app-version`, el servidor de fábrica `https://xam.alwaysdata.net` y el App Link del
> dominio de producción. La web se actualiza sola al desplegar; solo se necesita un APK
> nuevo cuando cambian capacidades nativas o permisos.

## Datos del artefacto

| Campo | Valor |
|---|---|
| Nombre | `VibeMatch-1.2.0.apk` |
| Paquete | `cl.vibematch.app` |
| Versión | `1.2.0` (`versionCode 3`) |
| `minSdk` | 24 (Android 7.0) |
| `targetSdk` / `compileSdk` | 36 (Android 16) |
| Tamaño | 12.199.493 bytes (~11,6 MB) |
| SHA-256 APK | `CB41CE4E1804318FCF6926C82316399422046848D6B9AE15A150847A2FABF6EE` |
| AAB | `VibeMatch-1.2.0.aab` (12.041.877 bytes) |
| SHA-256 AAB | `87172B1003F2C393E043D8A16DD67A741AE6B567D0601DD689026CA86C38AEDD` |

El AAB es el formato recomendado para Play Store. Para instalación directa en tablets del
colegio se usa el APK. Descarga pública:
<https://xam.alwaysdata.net/descargas/VibeMatch-1.2.0.apk>. El repositorio es privado, así
que los adjuntos de la release de GitHub requieren sesión; el espejo público en
`public/descargas/` es el que consume la app. Los checksums también están en
`dist/SHA256SUMS.txt` y en
<https://xam.alwaysdata.net/descargas/SHA256SUMS.txt>.

## Instalación

### Por cable (recomendado para pruebas)

```bash
adb install -r VibeMatch-1.2.0.apk
```

Si Android bloquea la instalación por proveniencia desconocida, habilita la instalación
desde el explorador de archivos o desde ADB en los ajustes del dispositivo.

### Directa

Copia el APK a la tablet y ábrelo. Acepta el aviso de “instalar apps desconocidas” solo
para el explorador de archivos. Para distribución escolar se recomienda MDM o Play Store
privada, no el envío por mensajería.

## Primer arranque: servidor

La app viene configurada de fábrica con `https://xam.alwaysdata.net`. En el primer
arranque ya no muestra un diálogo obligatorio; si hace falta cambiar de servidor:

- **Guardar**: usa la URL HTTPS escrita (por ejemplo `https://vibematch.cl`).
- **Usar demostración**: apunta a `https://vibematch-demo.vercel.app`.

La URL queda en `SharedPreferences` y se aplica antes de crear el WebView. Se puede
cambiar después:

- Mantén pulsado el icono de VibeMatch → **Configurar servidor** (atajo de Android).
- Abre `vibematch://config` desde un enlace o ADB:

```bash
adb shell am start -a android.intent.action.VIEW -d "vibematch://config" cl.vibematch.app
```

- Borra los datos de la app (Ajustes → Apps → VibeMatch → Almacenamiento → Borrar datos)
  para volver al diálogo inicial.

Usa siempre HTTPS en producción. AlwaysData guarda los datos en
`/home/xam/vibematch-data`, así que el piloto sí persiste entre despliegues. La demo de
Vercel guarda datos en `/tmp` y sirve solo para probar la interfaz.

## NFC, QR y deep links

- **NFC:** lee etiquetas NDEF con una URL `https://dominio/a/<token>` o texto con el
  token. Si la etiqueta no trae NDEF, intenta el UID como respaldo. Requiere NFC activo.
- **QR:** usa la cámara y `BarcodeDetector`; si el WebView no lo soporta, cae a `jsqr`.
  También acepta el token escrito a mano.
- **Deep links HTTPS:** `https://xam.alwaysdata.net/a/<token>` (App Link verificado con
  `public/.well-known/assetlinks.json`). También se aceptan los hosts de respaldo
  `vibematch.cl` y `vibematch-demo.vercel.app` cuando publican ese archivo.
- **Esquema propio:** `vibematch://a/<token>` funciona aunque el dominio HTTPS no esté
  verificado.
- **Configuración:** `vibematch://config`.

El host de los App Links se inyecta al compilar desde `VIBEMATCH_APP_URL`
(`manifestPlaceholders.appLinkHost`) y `allowNavigation` se calcula en
`capacitor.config.ts`. Para otro dominio, recompila con esa variable o usa el esquema
`vibematch://` y la configuración manual.

## Actualizaciones

La web remota se actualiza al instante con cada despliegue. Para cambios nativos, la app
consulta `/api/app-version` y muestra un aviso con la versión publicada y el enlace de
descarga. El APK nuevo se instala sobre el anterior si mantiene el mismo `applicationId`
y está firmado con el mismo keystore.

Variables de producción para publicar una actualización:

| Variable | Ejemplo |
|---|---|
| `VIBEMATCH_APP_VERSION` | `1.2.0` |
| `VIBEMATCH_APP_VERSION_CODE` | `3` |
| `VIBEMATCH_APP_APK_URL` | `https://xam.alwaysdata.net/descargas/VibeMatch-1.2.0.apk` |
| `VIBEMATCH_APP_NOTES` | Texto breve de novedades |

El aviso compara `versionCode`; si el servidor informa un número mayor, ofrece abrir la
descarga. La descarga sigue siendo responsabilidad del colegio (release, MDM o Play
Store privada).

## Firma

| Campo | Valor |
|---|---|
| Alias | `vibematch` |
| DN | `CN=VibeMatch, OU=Tecnologia, O=VibeMatch, L=Santiago, ST=Region Metropolitana, C=CL` |
| SHA-256 | `A2:16:E8:33:95:1F:EF:F5:81:A9:1B:75:92:A5:5A:A7:D4:75:D1:80:03:4D:12:E6:0F:1D:46:BB:5A:09:2F:AF` |
| SHA-1 | `14:64:89:8A:30:A7:A0:1A:2E:26:E0:9C:A6:93:4C:A2:2A:8A:56:53` |

El keystore **no está en el repositorio**. Está en
`/home/xam/Documentos/VibeMatch-keys/vibematch-release.jks` y sus credenciales en
`CREDENCIALES-KEYSTORE.txt`, junto a él, con permisos restringidos. Respalda ambos
archivos en un lugar seguro: sin el keystore no se pueden publicar actualizaciones de la
misma app en Play Store.

`android/keystore.properties` (también ignorado por Git) apunta al keystore y es leído por
`android/app/build.gradle`.

## Compilar y verificar

Requisitos: JDK 21, Android SDK con `platforms;android-36` y `build-tools;36.0.0`.
Java 27 no sirve para esta compilación: Gradle falla con `Unsupported class file major
version 71`. Usa JDK 21 para `cap sync` y Gradle.

```bash
export JAVA_HOME="$HOME/.local/share/java/jdk-21.0.13+9"
export ANDROID_HOME="$HOME/Android/Sdk"
export VIBEMATCH_APP_URL="https://xam.alwaysdata.net"
npx cap sync android
cd android
./gradlew assembleRelease bundleRelease

# Verificación
bt="$ANDROID_HOME/build-tools/36.0.0"
"$bt/apksigner" verify --print-certs app/build/outputs/apk/release/app-release.apk
"$bt/aapt2" dump badging app/build/outputs/apk/release/app-release.apk
```

Salidas:

- `android/app/build/outputs/apk/release/app-release.apk`
- `android/app/build/outputs/bundle/release/app-release.aab`

Cambiar de servidor no obliga a recompilar: se hace en el diálogo o en el atajo. Solo hay
que recompilar para cambiar la URL de fábrica, los hosts de App Links o el código.

## Límites conocidos

- La app depende de que el servidor HTTPS esté disponible; no incluye la web offline.
  El perfil se cachea en el dispositivo para consulta, pero las acciones requieren red.
- AlwaysData tiene un límite de RAM de ~256 MB por proceso: el sitio corre con un build
  precompilado y `next start`, no compila en el servidor. Para cambios de código hay que
  subir un paquete nuevo (ver `deploy/alwaysdata/README.md`).
- La demo de Vercel no tiene almacenamiento persistente; úsala solo para probar interfaz.
- La sesión es la cookie del WebView. Para un piloto grande conviene evaluar una
  credencial de dispositivo de corta duración y revocación.
- La autenticación docente usa código institucional; no hay tokens docentes en los
  archivos de tarjetas actuales.
- Falta validar el lector NFC USB-C/OTG y el modelo exacto de tablet del piloto.
- La APK no está publicada en Play Store; se entrega como artefacto firmado en la
  release privada de GitHub y en el espejo público del sitio. Si el repositorio pasa a
  ser público, la URL de la release también funcionará sin autenticación.
