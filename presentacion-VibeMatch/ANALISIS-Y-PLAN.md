# VibeMatch — Análisis del proyecto y extensión NFC

> Documento de traspaso. Léelo antes de tocar el PPT o el código.
> Generado el 22-oct-2026 a partir del análisis de `Referencia VibeMatch/` y del código fuente.

---

## 1. Qué es VibeMatch (según los documentos de referencia)

**Microempresa escolar** de tecnología e integración social. Categoría PYME: microempresa (1–9 personas).
Establecimiento base: **Colegio Superior del Maipo**. Responsable: **Maximo Orellana**.

**Concepto:** solución **Phygital** = tarjeta física NFC + plataforma digital.
**Propuesta:** conectar estudiantes por afinidades reales (intereses, proyectos, estado de ánimo) sin caer en métricas de popularidad.

**Público:** secundaria y educación superior, 12–22 años.

**Valores declarados:**
- Conexión auténtica (no likes ni seguidores)
- Inclusión (pronombres y nombres preferidos)
- Seguridad escolar (moderación, logs, alertas)
- Diseño sostenible / economía circular (reutilizar tarjetas tipo "Bip!")

**Hardware:** chip **NTAG213**, compatible con ~90% de smartphones actuales.
**Material:** polímero reciclado, acabado mate. Packaging kraft sin plásticos.
**Normativa chilena citada:** SERNAC, MINSAL, SUBTEL (RFID de baja potencia).

**Identidad visual (4 variantes):**

| Variante | Composición | Uso |
|---|---|---|
| Logotipo | Texto `VIBE·MATCH` geométrico | pies, textos legales |
| Isotipo | Squircle + líneas 45° + ondas NFC + globos "HOLA/BIENVENIDO" | icono app, favicon |
| Imagotipo | Isotipo izq. + logotipo der. | cabeceras web, banners |
| Isologotipo | Escudo circular integrado | tarjeta NFC física, sellos |

**Paleta de marca (ya en el código):** `ink #07070D`, `brand #6D7ED3`, `brand-soft #9FB3E8`, `brand-strong #8FA7F8`, `teal #5EEAD4`.

---

## 2. Estado real del código (verificado)

### Lo que YA existe y funciona

- **Next.js 16.4.2** + React 19.3 + Tailwind 4. Rutas compiladas correctamente.
- **Acceso por tarjeta:** `/a/[token]` valida el token (hash en `data/cards.json`), muestra bienvenida y botón "Entrar".
- **Sesión por cookie:** `src/lib/cards.ts` (`crearSesion`, `leerSesion`, `SESSION_COOKIE`, expira a las 8 h).
- **Onboarding de perfil:** `/app` con formulario (`profile-form.tsx`) y acción de servidor (`actions.ts`).
- **Persistencia:** `data/profiles.json` (ignorado por Git) vía `src/lib/profiles.ts`.
- **PWA:** `manifest.webmanifest`, `sw.js` (cachea solo estáticos), registro en `pwa-register.tsx`.
- **Páginas:** `/` (acceso), `/a/[token]`, `/app`, `/app/perfil`, `/app/instalar`, `/privacidad`.
- **104 tarjetas** en `data/cards.json` (3 demo + 100 guest + 1 pública), solo hashes.

### Lo que agregué hoy (offline-first + APK)

- **`src/app/api/perfil/route.ts`** — API JSON `GET`/`PUT` del perfil, reutiliza la cookie de sesión. Es lo que la APK usa para sincronizar.
- **`src/lib/offline-profile.ts`** — guarda el perfil en el dispositivo (Capacitor Preferences → localStorage), cola de cambios pendientes, sincronización.
- **`src/lib/share-card.ts`** — dibuja una tarjeta PNG del perfil en canvas (funciona sin conexión).
- **`src/lib/share-native.ts`** — comparte la imagen con el share sheet de Android (Capacitor Share/Filesystem) o Web Share.
- **`src/components/offline-profile-panel.tsx`** — pantalla de perfil offline (ver + editar + compartir).
- **`src/components/sync-status.tsx`** — barra de estado "sincronizado / pendiente / sin conexión".
- **`src/components/cache-profile.tsx`** — guarda copia local al ver el perfil online.
- **`/app/perfil-offline`** — ruta nueva con la vista offline.
- **Capacitor instalado:** `@capacitor/core`, `cli`, `android`, `preferences`, `share`, `filesystem`, `network`. Proyecto Android generado en `android/`. Config en `capacitor.config.ts` apuntando al túnel.

### Lo que FALTA / está incompleto

- **APK no compilada:** falta el Android SDK y un JDK 21 (el sistema tiene Java 27, demasiado nuevo para Gradle 8.14/AGP). El proyecto `android/` está generado y listo.
- **Nada de asistencia / baño / anotaciones:** es la funcionalidad nueva de abajo.
- **Documentos legales:** `/privacidad` solo cubre el perfil. No menciona asistencia, baño ni anotaciones.

---

## 3. LA FUNCIÓN NUEVA: gestión escolar con NFC

Esta es la funcionalidad que hay que agregar a la app móvil/Windows y a la web.

### 3.1 Pasar lista (asistencia)

- El profesor pasa el lector (o el celular) por las tarjetas, o el alumno toca un punto fijo al entrar.
- Registra **presente / atrasado / ausente** con hora exacta.
- Genera la lista del curso por día, automáticamente.
- Exportable (CSV) para el libro de clases.
- Ventaja: sin pasar lista a mano, sin errores de nombre, con hora verificable.

### 3.2 Permisos de baño

- El alumno toca su tarjeta en un punto NFC antes de salir y al volver.
- Registra **entrada/salida con duración**.
- Límite configurable por día; alerta si excede.
- El profesor ve en el panel quién está fuera y cuánto lleva.
- Ventaja: reemplaza el cuaderno de baño, con trazabilidad real.

### 3.3 Anotaciones (positivas y negativas)

- El profesor toca la tarjeta del alumno y anota en el momento: positiva o negativa, con categoría y comentario.
- Queda asociado a la tarjeta, con fecha, hora y quién lo registró.
- Historial por alumno (para entrevistas con apoderados).
- Ventaja: registro inmediato, sin papeleo, con evidencia.

### 3.4 Panel del establecimiento (dashboard)

- Asistencia del día, alumnos fuera del aula (baño), últimas anotaciones.
- Filtros por curso y por fecha.
- Roles: **profesor** (registra), **dirección/inspectoría** (ve todo), **alumno** (ve lo suyo).

### 3.5 Por qué NFC y no otra cosa

| Criterio | NFC | Código impreso | App con login |
|---|---|---|---|
| Velocidad al pasar lista | 1 s por alumno | lento | requiere teclear |
| Falsificación | difíicil (chip + hash) | fácil | clave compartible |
| Sin batería en la tarjeta | ✅ | ✅ | ❌ (celular) |
| Identidad verificada | ✅ | ❌ | parcial |
| Funciona sin internet | ✅ (registro local + sync) | ✅ | ❌ |

---

## 4. Lo que hay que actualizar en el código (tareas concretas)

### 4.1 Web (`src/`) — ✅ HECHO (ver sección 9)

1. **`/privacidad`** — ✅ agregadas secciones: funciones escolares, quién ve los registros, retención, base legal (Ley 19.628 y Ley 21.801).
2. **Nueva sección en `/app`** — ✅ tarjeta "Funciones escolares · NFC" con los 3 módulos.
3. **Modelo de datos** — ✅ `src/lib/school-schema.ts` con `RegistroAsistencia`, `PermisoBano`, `Anotacion`, `Rol`, límites y helpers.
4. **Persistencia** — ✅ `src/lib/school.ts` (patrón de `profiles.ts`, escritura atómica). Archivos `data/asistencia.json`, `data/permisos.json`, `data/anotaciones.json` → ✅ en `.gitignore`.
5. **API** — ✅ `src/app/api/asistencia/route.ts`, `.../permisos/route.ts`, `.../anotaciones/route.ts`.
6. **Panel profesor** — ⏳ PENDIENTE: ruta `/app/panel` con las 3 vistas (la API ya está lista).
7. **Roles** — ⏳ PENDIENTE: extender la sesión con `rol: "alumno"|"profesor"|"direccion"`.

### 4.2 App móvil / Windows

- Los 3 módulos deben funcionar **offline** igual que el perfil: registro local + cola de sync.
- Reutilizar el patrón de `offline-profile.ts` (generalizar a `offline-queue.ts`).
- En la app Windows (Tauri) el lector NFC se maneja distinto; dejar la interfaz lista y el acceso NFC detrás de una abstracción (`src/lib/nfc.ts`).

### 4.3 APK (pendiente de compilar)

- Instalar Android SDK + JDK 21.
- `npx cap sync android` y compilar con Gradle.
- Ver `TAREA-APK.md` (si existe) para los pasos ya investigados.

---

## 5. Modelos de IA gratis en OpenCode (investigado 22-oct-2026)

| Modelo | ID | Notas |
|---|---|---|
| **DeepSeek V4.1 Flash Free** | `opencode/deepseek-v4.1-flash-free` | **Mejor opción.** Ranque #1 en uso de OpenCode (103T tokens/7d). Zero-retention, no entrena. Tiene gemelo de pago. |
| GLM-5.3-Flash Free | `opencode/glm-5.3-flash-free` | 2ª mejor. Coding fuerte (71.5). Zero-retention. |
| MiMo-V2.6-Flash Free | `opencode/mimo-v2.6-flash-free` | Contexto 1.1M. Ojo: sus datos **pueden usarse** para entrenar. |
| Nemotron 3 Ultra Free | `opencode/nemotron-3-ultra-free` | Solo prueba, NVIDIA loguea el uso. |
| Nemotron 3.5 Super VL Free | `opencode/nemotron-3.5-super-vl-free` | Visión + lenguaje. Útil para leer capturas. |
| Nemotron 3.5 Lightning Free | `opencode/nemotron-3.5-lightning-free` | Rápido pero débil en coding. |
| MiMo-V2.6-Flash Free | (ya listado) | |
| Beam Free | `opencode/beam-free` | No disponible en varias regiones. |
| Flint 40B Free | `opencode/flint-40b-free` | Familia no explicada en el catálogo. |
| Big Pickle | `opencode/big-pickle` | Modelo stealth; datos pueden usarse. Es el actual. |

**Recomendación para mañana:** usar **`opencode/deepseek-v4.1-flash-free`** para generar el PPT y el código. Es el más usado, mejor rankeado y con política de retención cero. Fallback: `glm-5.3-flash-free`.

Para fijarlo en el proyecto, crear `opencode.jsonc` en la raíz:
```jsonc
{ "$schema": "https://opencode.ai/config.json", "model": "opencode/deepseek-v4.1-flash-free" }
```

> ⚠️ Los modelos gratis son temporales. Verificar con `opencode models` antes de planificar.

---

## 6. Estado de la presentación (PPT)

**La otra IA ya generó el deck completo y cubre exactamente lo pedido.** No hay que rehacerlo.

- `presentacion-VibeMatch/build_deck.py` — 17 slides generadas con python-pptx.
- `presentacion-VibeMatch/VibeMatch-Presentacion.pptx` — el archivo final.
- `presentacion-VibeMatch/preview.html` — vista previa navegable.

**Slides ya incluidas (nombres de función en `build_deck.py`):**
portada, problema, statement, cómo funciona, módulos, **asistencia**, **baño**, **anotaciones**, **dashboard**, por qué NFC, privacidad, impacto, piloto, kit, estado, cierre, FAQ.

**Si hay que regenerar:** `py build_deck.py` (requiere `python-pptx`, `Pillow`, `lxml`).
**Para vista previa:** `py render_preview.py`.

---

## 9. Lo que se implementó el 22-oct (esta sesión)

### Módulos escolares NFC — FUNCIONANDO y probados

| Archivo | Qué hace |
|---|---|
| `src/lib/school-schema.ts` | Tipos `RegistroAsistencia`, `PermisoBano`, `Anotacion`, `Rol`. Límites: 10 min de baño, 3 permisos/día. |
| `src/lib/school.ts` | Persistencia JSON atómica en `data/`. |
| `src/app/api/asistencia/route.ts` | `GET` lista del día · `POST` marca presente/atrasado/ausente (1 por alumno/día). |
| `src/app/api/permisos/route.ts` | `GET` permisos · `POST` `accion: "salida"\|"regreso"`; calcula duración y alerta. |
| `src/app/api/anotaciones/route.ts` | `GET` por tarjeta/curso/tipo · `POST` positiva o negativa con categoría y comentario. |

**Pruebas reales (VM-G0004, sesión por cookie):**
- Asistencia: `POST` → 200, `GET` mostró el registro con hora exacta (21:31).
- Baño: `salida` → 200 (`fin: null`), `regreso` → 200 (`duracionMin: 0`).
- Anotaciones: positiva (`Participación`) y negativa (`Puntualidad`) → ambas 200 y listadas.

**Lección:** las categorías llevan tilde (`Participación`, no `Participacion`) — el esquema valida con `esCategoriaAnotacion`.

### Web actualizada

- `/privacidad` — 4 secciones nuevas: funciones escolares, quién ve los registros, retención, base legal (Ley 19.628 / 21.801).
- `/app` — bloque "Funciones escolares · NFC" con los 3 módulos.
- `/app/instalar` — APK marcada "En compilación" (ya no "En preparación"), texto sobre NFC y offline.

### Offline-first + APK (de antes en la sesión)

- API `/api/perfil`, `offline-profile.ts`, `share-card.ts`, `share-native.ts`, `offline-profile-panel.tsx`, `sync-status.tsx`, `cache-profile.tsx`, ruta `/app/perfil-offline`.
- Capacitor instalado y proyecto `android/` generado (falta SDK + JDK 21 para compilar).

### Verificación

- `npm run typecheck` ✅ · `npm run lint` ✅ · `npm run build` ✅ (17 rutas, 4 APIs dinámicas).
- Datos de prueba borrados; `data/*.json` de alumnos en `.gitignore`.

---

## 10. Pendientes técnicos inmediatos

- [ ] Compilar APK (SDK + JDK 21) — ver sección 4.3.
- [ ] Panel del profesor `/app/panel` (la API ya está lista).
- [ ] Roles en la sesión (`alumno` / `profesor` / `direccion`).
- [ ] Módulos escolares offline en la app (generalizar `offline-profile.ts` a una cola).
- [ ] Commitear los cambios (hoy quedaron sin commitear).
- [ ] Nada de PPT: la otra IA lo hace mañana.

---

## 8. Archivos clave de referencia

| Archivo | Qué contiene |
|---|---|
| `Referencia VibeMatch/Manual de Identidad Corporativa Completo - VibeMatch.docx` | Identidad, valores, misión/visión, logo, packaging |
| `Referencia VibeMatch/VibeMatch - Esquema de Proyecto de Diseño e Ideas.docx` | Idea, público, matching, seguridad, piloto, costos, normativa |
| `Referencia VibeMatch/Actividad de Packaging y Diseño - VibeMatch.docx` | Diseño de producto y packaging |
| `Referencia VibeMatch/web-fotos/` | 3 fotos para el deck |
| `data/tarjetas-guest.txt` | 100 tokens guest (ignorado por Git, NO publicar) |
