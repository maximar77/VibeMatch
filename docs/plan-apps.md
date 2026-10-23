# Plan de apps: PWA, APK (Android) y EXE (Windows)

> Estado: web con tarjeta, onboarding y PWA instalable implementados. APK y EXE siguen en
> planificación; la UI muestra “En preparación”, sin descargas falsas.
> Última actualización: 22 de octubre de 2026.

## 1. Restricción que ordena el plan

Por la Ley 21.801, la app **no puede asumir que el estudiante usará su teléfono
personal durante la jornada escolar**. Por eso el orden de prioridad es:

1. **Web + tarjeta** en equipos institucionales (ya funciona).
2. **PWA instalable** para iPhone, Mac, Android y Windows (ya funciona; opcional).
3. **EXE** para computadores del colegio con lector NFC USB (prioridad escolar).
4. **APK** para tablets institucionales, docentes/administración y uso fuera de la
   jornada o en contextos autorizados por el reglamento.

La APK no es el canal principal dentro del colegio; el `.exe` y los Puntos Vibe sí. La
PWA cubre desde ya el caso “quiero VibeMatch como app” sin tienda ni descarga lateral.

## 2. Arquitectura compartida

```
Tarjeta NFC / QR
      │  https://dominio/a/<token>
      ▼
Web Next.js (UI + Server Actions + PWA + API)
      │  valida token → cookie de sesión
      ├── PWA instalable (misma UI, iPhone/Mac/Android/Windows)
      ▼
APK (Capacitor)        EXE (Tauri 2)
Android / tablet       Windows 10/11 + WebView2
```

La app nativa no debe reimplementar la lógica de negocio: envuelve la misma interfaz
web y usa una API estable para el canje de token, la sesión y el cierre.

### Web app instalable (ya implementada)

- Manifiesto en `src/app/manifest.ts` con `start_url: /app`, iconos 192/512 y maskable.
- Service worker en `public/sw.js` que cachea solo estáticos; nunca HTML privado.
- Página `/app/instalar` protegida por sesión y perfil, con instrucciones por plataforma.
- En iPhone/iPad: Safari → Compartir → Añadir a pantalla de inicio.
- En Mac: Safari → Archivo → Añadir al Dock, o instalar desde Chrome/Edge.
- En Android/Windows: instalación desde Chrome/Edge.
- Requiere HTTPS o `localhost`. No sustituye la integración NFC nativa del EXE/APK.

### API necesaria antes de las apps nativas

| Endpoint | Método | Uso |
|---|---|---|
| `/api/acceso/[token]` | `POST` | Canjear token por sesión; devuelve cookie `HttpOnly` o token de corta duración. |
| `/api/sesion` | `GET` | Datos mínimos de la tarjeta y del establecimiento. |
| `/api/perfil` | `GET` | Perfil asociado a la tarjeta/sesión, para cargarlo en la app. |
| `/api/perfil` | `PUT` | Crear o actualizar el perfil; valida consentimiento e intereses. |
| `/api/salir` | `POST` | Revocar la sesión del dispositivo. |
| `/api/tarjetas/[id]/revocar` | `POST` | Administración (requiere rol). |

Recomendación: mantener Server Actions para la web y exponer estos endpoints para las
apps. Para las apps nativas conviene un canje de token por credencial de dispositivo de
corta duración, no reutilizar la cookie del navegador. Todos con rate limiting, HTTPS,
validación de origen y logs sin tokens ni PII.

## 3. APK con Capacitor

**Por qué Capacitor:** reutiliza la UI web, permite empaquetar en Android y tiene
plugins de NFC y almacenamiento seguro. Evita mantener dos interfaces.

Alcance de la primera versión:

- Lanzar la web embebida apuntando al dominio oficial.
- Leer NFC (NDEF con URL `/a/<token>`) y abrir la bienvenida.
- Escanear QR con la cámara como respaldo.
- Guardar la sesión en almacenamiento seguro; botón de cierre.
- Deep link `https://dominio/a/<token>` y esquema `vibematch://a/<token>`.
- Modo tablet institucional: pantalla completa y bloqueo de navegación externa.

Pasos:

1. Cerrar la API de acceso y sesión.
2. Añadir `@capacitor/core`, `@capacitor/android`, plugin NFC y plugin de QR.
3. Configurar `server.url` solo en desarrollo; en producción empaquetar los assets o
   apuntar al dominio con HTTPS.
4. Probar en una tablet Android con NFC y en un lector USB-C.
5. Firmar el APK/AAB y definir distribución: Play Store privada, Managed Google Play
   o instalación por MDM del colegio.

Requisitos: JDK 21, Android Studio, SDK 35+, cuenta de firma y un dispositivo de
prueba con NFC.

Riesgos: WebView + NFC tienen permisos y ciclos de vida distintos; el lector NFC USB
en Android requiere OTG y un plugin específico. Validar hardware antes de prometer
soporte universal.

## 4. EXE con Tauri 2

**Por qué Tauri:** binario liviano (no arrastra Chromium), usa WebView2 de Windows y
permite integrar lectores NFC por PC/SC desde Rust. Mejor opción para laboratorios con
Windows.

Alcance de la primera versión:

- Ventana kiosco a pantalla completa hacia la web oficial.
- Integración con lector ACR122U/PN532 vía PC/SC.
- Lectura del UID o del NDEF y apertura de `/a/<token>`.
- Cierre de sesión automático por inactividad (configurable: 15/30/60 min).
- Bloqueo de atajos de teclado y de navegación fuera del dominio.
- Actualización firmada del ejecutable.

Pasos:

1. Cerrar la API de acceso y sesión.
2. Crear el proyecto Tauri 2 y configurar `WebView2`.
3. Implementar el plugin Rust de PC/SC y probar con ACR122U.
4. Añadir modo kiosco y temporizador de inactividad.
5. Firmar el instalador (NSIS/MSI) y documentar el despliegue en laboratorio.

Requisitos: Rust estable, Visual Studio Build Tools (C++), WebView2 Runtime y
certificado de firma de código (recomendado).

## 5. Fases

| Fase | Entregable | Criterio de aceptación |
|---|---|---|
| 1 | Web + tarjeta + onboarding + PWA | Token válido entra; token inválido no; perfil persiste; instalación protegida; build pasa. |
| 2 | Punto Vibe piloto | Tablet/PC + lector abre la bienvenida, crea perfil y cierra sesión sola. |
| 3 | API de apps y perfiles | Canje de token, sesión y lectura/escritura de perfil funcionan fuera del navegador. |
| 4 | APK beta | NFC y QR abren la bienvenida en tablet institucional y cargan el perfil. |
| 5 | EXE beta | Lector USB abre la bienvenida en Windows y el modo kiosco resiste uso real. |
| 6 | Piloto y endurecimiento | Rate limiting, base de datos, panel de revocación, retención y auditoría. |

Esfuerzo estimado: API + perfiles, 1–2 semanas; APK beta, 2–3 semanas; EXE beta con NFC,
2–3 semanas; piloto y endurecimiento, 2–4 semanas. Son estimaciones, no compromisos de
fecha.

## 6. Decisiones abiertas

- ¿El servidor será local en el colegio (intranet) o cloud con HTTPS público?
- ¿Se usará SQLite local o PostgreSQL administrado?
- ¿Qué modelo exacto de lector NFC y tablet se comprará para el piloto?
- ¿La APK se distribuirá por Play Store privada o por MDM?
- ¿Se requiere funcionamiento offline en el laboratorio?
- ¿Quién administra tarjetas y revocaciones: inspectoría, convivencia o informática?
- ¿Qué datos personales se muestran en la bienvenida y por cuánto tiempo se retienen?

## 7. Lo que no se hará

- No se pedirá a los estudiantes usar su teléfono personal durante la jornada.
- No se escribirán tokens en logs, analítica ni URLs de terceros.
- No se reutilizarán tarjetas revocadas.
- No se almacenarán tokens en claro en el repositorio.
- No se publicarán botones de descarga de APK/EXE hasta que existan binarios firmados y
  probados; la UI los muestra como “En preparación”.
