# VibeMatch — Especificación funcional (v0)

Resumen operativo de los documentos originales, pensado como base para la plataforma.
Todo lo marcado como **abierto** requiere decisión del equipo.

## 1. Propuesta de valor

Facilitar conexiones auténticas y seguras entre estudiantes según afinidades reales
(intereses, proyectos, materias) y estado de ánimo, eliminando la barrera de la
interacción inicial mediante tecnología de proximidad.

## 2. Acceso y vinculación

| Método | Descripción |
| --- | --- |
| Tarjeta NFC | Se acerca a un Punto Vibe o a un lector del equipo institucional. No se usa el teléfono personal de otro compañero. |
| QR / ID único | Código impreso en la tarjeta y el empaque; se escanea desde un equipo del colegio. |
| Web App / PWA | URL única `/a/<token>`; funciona en el navegador institucional y puede instalarse como app en iPhone, Mac, Android o Windows. |
| Token público | `vibematch-acceso-publico-2026` abre solo la landing y los contactos para pedir el kit; no crea sesión ni perfil. |

Flujo UX: **aproximación en un punto institucional → canje de token → bienvenida →
onboarding de perfil (solo la primera vez) → dashboard y zonas de interés → instalación
opcional de la PWA**.

La autenticación valida el token único de la tarjeta contra un registro de hashes SHA-256.
Si es válido, se cambia por una cookie de sesión firmada con HMAC (8 horas) y se muestra la
bienvenida. El token no contiene nombre, curso ni RUT. El acceso está diseñado para no
depender de dispositivos personales durante la jornada escolar (Ley 21.801); ver
[`arquitectura/acceso-y-dispositivos.md`](arquitectura/acceso-y-dispositivos.md).

El registro distingue tarjetas `personal` y `public`. La portada `/` sin token muestra un
error de acceso: la landing pública solo se abre con el token genérico. Para el piloto se
generaron 100 tarjetas guest únicas (`VM-G0001`…`VM-G0100`), sin nombre, para que cada
persona complete su perfil al entrar.

## 3. Perfil de usuario

### 3.1 Onboarding y persistencia

El perfil se pide en el primer ingreso con una tarjeta personal y se guarda asociado al
`cardId` en `data/profiles.json` (ignorado por Git). En las siguientes entradas se carga
automáticamente. Se puede editar desde `/app/perfil`.

Campos implementados:

- Nombre preferido (2–32 caracteres, obligatorio).
- Pronombres (opcional: ella, él, elle o prefiero no decirlo).
- Curso (7° Básico a 4° Medio, u “Otro”/sin especificar).
- Intereses / zonas de interés (1 a 6, obligatorio).
- Vibe Check: disposición actual (ej. "Modo estudio", "Abierto/a a conversar",
  "Busco equipo", "Solo explorando").
- Descripción breve opcional (máx. 180 caracteres).
- Consentimiento obligatorio, con enlace a `/privacidad`.

Pendiente/abierto:

- Enlaces opcionales a redes sociales externas (aún no implementados).
- Anonimato optativo para consultas sensibles.
- Retención, exportación y eliminación de datos desde la propia cuenta.
- Versionado del consentimiento y autorización de apoderado para menores de 14 años.

### 3.2 Instalación y apps

- **PWA instalable:** la web puede añadirse a pantalla de inicio o Dock en iPhone, iPad,
  Mac, Android y Windows. La sección `/app/instalar` está protegida por sesión y perfil.
- **APK Android y EXE Windows:** siguen en preparación. La UI los muestra como
  “En preparación”; no hay descargas falsas.
- El perfil guardado en la web es la base para que las apps nativas lo carguen al iniciar
  sesión con la tarjeta.

## 4. Matching y comunidad

- **Canales generales:** por curso, nivel o institución.
- **Zonas de interés:**
  - Deportes: partidos y torneos.
  - Arte: portafolios, música y proyectos creativos.
  - Videojuegos: equipos para juegos cooperativos.
  - Estudio: repaso y tutorías entre pares.
- "Canchitas de chat": grupos temáticos presenciales según coincidencias.

## 5. Seguridad y moderación

- Moderación activa en tiempo real.
- Panel de administración para la dirección del establecimiento.
- Registro de actividad (logs) y trazabilidad.
- Alertas tempranas ante comportamientos inadecuados.
- Reglas de convivencia escolar explícitas.

## 6. Producto físico (Phygital Pack)

- Tarjeta NFC reprogramada (NTAG213) con isologotipo oficial.
- QR de respaldo impreso en tarjeta y empaque.
- Stickers "Vibe Check" reutilizables.
- Guía rápida de inicio en papel reciclado.
- Packaging de cartón kraft con cierre mecánico, sin plásticos ni cola sintética.
- Rotulado: "Contiene chip NFC de baja potencia", "No mojar", "Edad recomendada: +12 años",
  datos de la microempresa y canales de soporte (SERNAC, Minsal, SUBTEL).

## 7. Identidad visual

- **Logotipo:** `VIBE•MATCH`, tipografía geométrica y angular.
- **Isotipo:** squircle con trama diagonal, ondas NFC y globos de chat ("HOLA",
  "BIENVENIDO").
- **Imagotipo:** isotipo a la izquierda + logotipo a la derecha, altura del isotipo igual a
  la x-height del texto.
- **Isologotipo:** escudo circular con el texto integrado; uso en tarjetas, sellos y avatar.
- **Estética digital:** interfaces modernas tipo glassmorphism, gradientes y acentos
  tecnológicos.
- **Paleta:** derivada de las referencias visuales (`#6D7ED3` como tinta principal,
  documentada en `docs/marca/analisis-visual.md`). Pendiente confirmar contra un manual
  cerrado.
- **Tipografías oficiales:** **abierto** — falta la familia tipográfica de marca.

## 8. Validación (piloto)

- Grupo de control con estudiantes de distintas áreas sin vínculos previos.
- Entrega de prototipos de tarjetas NFC.
- Métricas: uso diario, encuestas SUS, densidad de conexiones.
- Iteración de UI a partir de los resultados.

## 9. Decisiones abiertas

1. Stack: **decidido** Next.js + React + TypeScript para la web; PWA instalable implementada;
   APK (Capacitor) y EXE (Tauri) quedan planificadas en [`plan-apps.md`](plan-apps.md).
2. Alcance del MVP: acceso por tarjeta, token público, onboarding de perfil, dashboard,
   edición de perfil y PWA instalable ya implementados; chat, matching y moderación siguen
   abiertos.
3. Modelo de datos y autenticación: `data/cards.json` con hashes, `data/profiles.json` con
   perfiles y cookie HMAC en el MVP; falta migrar a base de datos, definir retención y
   construir el panel de administración.
4. Infraestructura y privacidad de menores (Ley 21.719 de protección de datos en Chile).
5. Lectura NFC: se priorizan lectores institucionales (USB/tablet); Web NFC en navegador
   queda como opción secundaria.
6. Identidad gráfica definitiva: colores, tipografías y archivos vectoriales.
7. Definición del piloto: cursos, cantidad de tarjetas, puntos de acceso y responsables.
   Ya existen 100 tarjetas guest y un token público para solicitar el kit.
8. Distribución de las apps nativas: Play Store privada/MDM para Android y firma de código
   para Windows. La PWA no requiere tienda.
