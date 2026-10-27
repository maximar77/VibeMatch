# APK Android de VibeMatch 1.1.0

Aplicación Android firmada que envuelve la web de VibeMatch con Capacitor. Reutiliza la
misma sesión, Server Actions y perfil que la web, y añade lectura NFC nativa, escaneo QR
y deep links.

> Estado: **compilada y firmada**. Verificada con Gradle, `apksigner`, `jarsigner` y
> `aapt2`. No se pudo probar en un dispositivo físico durante esta compilación porque no
> había tablets conectadas; antes del piloto hay que validar NFC, cámara y deep links en el
> hardware real.
>
> La versión 1.1.0 incluye el puente de versión, el aviso de actualización nativa desde
> `/api/app-version`, el servidor de fábrica `https://vibematch-demo.vercel.app` y el App
> Link del alias de demo. La web se actualiza sola al desplegar; solo se necesita un APK
> nuevo cuando cambian capacidades nativas o permisos.

## Datos del artefacto

| Campo | Valor |
|---|---|
| Nombre | `VibeMatch-1.1.0.apk` |
| Paquete | `cl.vibematch.app` |
| Versión | `1.1.0` (`versionCode 2`) |
| `minSdk` | 24 (Android 7.0) |
| `targetSdk` / `compileSdk` | 36 (Android 16) |
| Tamaño | 6.264.788 bytes (~6,0 MB) |
| SHA-256 APK | `DBD7F0DF3B648C76D6B4812C609B773A67A5C9EE8E6E1A3C3D2056AB93916F8E` |
| AAB | `VibeMatch-1.1.0.aab` (6.106.932 bytes) |
| SHA-256 AAB | `0BD838F2146293BE067F57E67FA7CE6FB3A0CE782652E66BEF9F892E2C3E5597` |

El AAB es el formato recomendado para Play Store. Para instalación directa en tablets del
colegio se usa el APK. Descarga: [release v1.1.0](https://github.com/maximar77/VibeMatch/releases/tag/v1.1.0).
Los checksums también están en `dist/SHA256SUMS.txt`.

## Instalación

### Por cable (recomendado para pruebas)

```powershell
$env:ANDROID_HOME="$env:LOCALAPPDATA\Android\Sdk"
& "$env:ANDROID_HOME\platform-tools\adb.exe" install -r VibeMatch-1.1.0.apk
```

Si Android bloquea la instalación por proveniencia desconocida, habilita la instalación
desde el explorador de archivos o desde ADB en los ajustes del dispositivo.

### Directa

Copia el APK a la tablet y ábrelo. Acepta el aviso de “instalar apps desconocidas” solo
para el explorador de archivos. Para distribución escolar se recomienda MDM o Play Store
privada, no el envío por mensajería.

## Primer arranque: servidor

La app no está atada a un dominio fijo. Al primer arranque muestra un diálogo:

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

Usa siempre HTTPS en producción. La demo de Vercel guarda datos en `/tmp`, así que sirve
para probar la interfaz y el flujo, **no para datos reales**: las instancias no comparten
almacenamiento y los perfiles pueden desaparecer.

## NFC, QR y deep links

- **NFC:** lee etiquetas NDEF con una URL `https://dominio/a/<token>` o texto con el
  token. Si la etiqueta no trae NDEF, intenta el UID como respaldo. Requiere NFC activo.
- **QR:** usa la cámara y `BarcodeDetector`; si el WebView no lo soporta, cae a `jsqr`.
  También acepta el token escrito a mano.
- **Deep links HTTPS:** `https://vibematch.cl/a/<token>`,
  `https://vibematch-demo.vercel.app/a/<token>` y `https://vibe-match-zeta.vercel.app/a/<token>`
  (App Links verificados con `public/.well-known/assetlinks.json` en los hosts donde se
  publica ese archivo).
- **Esquema propio:** `vibematch://a/<token>` funciona aunque el dominio HTTPS no esté
  verificado.
- **Configuración:** `vibematch://config`.

Si el dominio final no es `vibematch.cl`, edita el host de los App Links en
`android/app/src/main/AndroidManifest.xml` y `allowNavigation` en `capacitor.config.ts`
antes de recompilar, o usa el esquema `vibematch://` y la configuración manual.

## Actualizaciones

La web remota se actualiza al instante con cada despliegue. Para cambios nativos, la app
consulta `/api/app-version` y muestra un aviso con la versión publicada y el enlace de
descarga. El APK nuevo se instala sobre el anterior si mantiene el mismo `applicationId`
y está firmado con el mismo keystore.

Variables de Vercel/Oracle para publicar una actualización:

| Variable | Ejemplo |
|---|---|
| `VIBEMATCH_APP_VERSION` | `1.1.0` |
| `VIBEMATCH_APP_VERSION_CODE` | `2` |
| `VIBEMATCH_APP_APK_URL` | `https://github.com/maximar77/VibeMatch/releases/download/v1.1.0/VibeMatch-1.1.0.apk` |
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
`C:\Users\idk\Documents\VibeMatch-keys\vibematch-release.jks` y sus credenciales en
`CREDENCIALES-KEYSTORE.txt`, junto a él, con permisos restringidos. Respalda ambos
archivos en un lugar seguro: sin el keystore no se pueden publicar actualizaciones de la
misma app en Play Store.

`android/keystore.properties` (también ignorado por Git) apunta al keystore y es leído por
`android/app/build.gradle`.

## Compilar y verificar

Requisitos: JDK 21, Android SDK con `platforms;android-36` y `build-tools;36.0.0`.
Java 27 no sirve para esta compilación: Gradle falla con `Unsupported class file major
version 71`. Usa JDK 21 para `cap sync` y Gradle.

```powershell
$env:JAVA_HOME="C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot"
$env:ANDROID_HOME="$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT=$env:ANDROID_HOME
$env:VIBEMATCH_APP_URL="https://vibematch-demo.vercel.app"   # opcional, URL de fábrica
npx cap sync android
cd android
.\gradlew.bat assembleRelease bundleRelease

# Verificación
$bt="$env:ANDROID_HOME\build-tools\36.0.0"
& "$bt\apksigner.bat" verify --print-certs .\app\build\outputs\apk\release\app-release.apk
& "$bt\aapt2.exe" dump badging .\app\build\outputs\apk\release\app-release.apk
```

Salidas:

- `android/app/build/outputs/apk/release/app-release.apk`
- `android/app/build/outputs/bundle/release/app-release.aab`

Cambiar de servidor no obliga a recompilar: se hace en el diálogo o en el atajo. Solo hay
que recompilar para cambiar la URL de fábrica, los hosts de App Links o el código.

## Límites conocidos

- La app depende de que el servidor HTTPS esté disponible; no incluye la web offline.
  El perfil se cachea en el dispositivo para consulta, pero las acciones requieren red.
- La demo de Vercel no tiene almacenamiento persistente y sus funciones serverless no
  comparten `/tmp`. Los perfiles, chats, muros y docentes pueden desaparecer o no verse
  entre rutas; usa Oracle para el piloto real.
- La sesión es la cookie del WebView. Para un piloto grande conviene evaluar una
  credencial de dispositivo de corta duración y revocación.
- La autenticación docente usa código institucional; no hay tokens docentes en los
  archivos de tarjetas actuales.
- Falta validar el lector NFC USB-C/OTG y el modelo exacto de tablet del piloto.
- La APK no está publicada en Play Store; se entrega como artefacto firmado en la
  release de GitHub.
