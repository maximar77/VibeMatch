# Plan de apps: APK (Android) y EXE (Windows)

> Estado: planificación. El flujo web de acceso por tarjeta ya está implementado.
> Última actualización: 22 de octubre de 2026.

## 1. Restricción que ordena el plan

Por la Ley 21.801, la app **no puede asumir que el estudiante usará su teléfono
personal durante la jornada escolar**. Por eso el orden de prioridad es:

1. **Web + tarjeta** en equipos institucionales (ya funciona).
2. **EXE** para computadores del colegio con lector NFC USB (prioridad escolar).
3. **APK** para tablets institucionales, docentes/administración y uso fuera de la
   jornada o en contextos autorizados por el reglamento.

La APK no es el canal principal dentro del colegio; el `.exe` y los Puntos Vibe sí.

## 2. Arquitectura compartida

```
Tarjeta NFC / QR
      │  https://dominio/a/<token>
      ▼
Web Next.js (UI + Server Actions + API)
      │  valida token → cookie de sesión
      ▼
APK (Capacitor)        EXE (Tauri 2)
Android / tablet       Windows 10/11 + WebView2
```

La app nativa no debe reimplementar la lógica de negocio: envuelve la misma interfaz
web y usa una API estable para el canje de token, la sesión y el cierre.

### API necesaria antes de las apps

| Endpoint | Método | Uso |
|---|---|---|
| `/api/acceso/[token]` | `POST` | Canjear token por sesión; devuelve cookie `HttpOnly` o token de corta duración. |
| `/api/sesion` | `GET` | Datos mínimos de la tarjeta y del establecimiento. |
| `/api/salir` | `POST` | Revocar la sesión del dispositivo. |
| `/api/tarjetas/[id]/revocar` | `POST` | Administración (requiere rol). |

Recomendación: mantener Server Actions para la web y exponer estos endpoints para las
apps. Todos con rate limiting, HTTPS, validación de origen y logs sin tokens.

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
| 1 | Web + tarjeta + bienvenida | Token válido entra; token inválido no; sesión expira; build pasa. |
| 2 | Punto Vibe piloto | Tablet/PC + lector abre la bienvenida y cierra sesión sola. |
| 3 | API de apps | Canje de token y sesión funcionan fuera del navegador. |
| 4 | APK beta | NFC y QR abren la bienvenida en tablet institucional. |
| 5 | EXE beta | Lector USB abre la bienvenida en Windows y el modo kiosco resiste uso real. |
| 6 | Piloto y endurecimiento | Rate limiting, base de datos, panel de revocación y auditoría. |

Esfuerzo estimado: API + APK beta, 2–3 semanas; EXE beta con NFC, 2–3 semanas; piloto y
endurecimiento, 2–4 semanas. Son estimaciones, no compromisos de fecha.

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
