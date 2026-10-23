# Documentación de VibeMatch

Los archivos `.docx` son los originales entregados por el equipo. Se conservan tal cual para
no perder formato ni contenido; los resúmenes de esta carpeta sirven para trabajar rápido.

## Documentos originales

### 1. `VibeMatch - Esquema de Proyecto de Diseño e Ideas.docx`

Documento marco del proyecto.

- Definición de la idea, público objetivo y propuesta de valor.
- Métodos de vinculación: tarjeta NFC física y sistema de ID único / QR de respaldo.
- Configuración de perfil: nombres preferidos, pronombres, Vibe Check (estado de ánimo),
  enlaces opcionales a redes sociales.
- Chat: canales por curso/nivel/institución y zonas de interés (deportes, arte, estudio,
  videojuegos).
- Seguridad: anonimato controlado, panel de administración y logs.
- Piloto: grupo de control, estadísticas de uso, encuestas SUS y densidad de conexiones.
- Producto físico: tarjeta NFC, empaque, stand de ventas.
- Factibilidad: chips NTAG213, alianza tipo "Bip!", normativa SERNAC / Minsal / SUBTEL.

### 2. `Manual de Identidad Corporativa - VibeMatch.docx`

Manual base de marca.

- Ficha de la organización y público objetivo.
- Valores: conexión auténtica, inclusión y respeto, seguridad escolar, diseño sostenible.
- Misión y visión.
- Identidad visual: logotipo, isotipo, imagotipo, isologotipo y matriz de aplicación.
- Phygital Pack y experiencia de usuario en tres pasos (proximidad, autenticación,
  interacción).

### 3. `Manual de Identidad Corporativa Completo - VibeMatch.docx`

Versión extendida del manual.

- Ficha del equipo y roles: fundador, especialista hardware/NFC, diseñador UI/UX,
  encargado de seguridad.
- Índice general del manual.
- Atributos de marca y público objetivo ampliado.
- Identidad visual detallada y usos de cada variante.
- Componentes del Phygital Pack y cumplimiento normativo chileno.
- Flujo UX: aproximación → autenticación → despliegue de perfil → interacción por zonas.

### 4. `Actividad de Packaging y Diseño - VibeMatch.docx`

Trabajo de diseño industrial.

- Errores comunes al entender el diseño y su relación con la viabilidad técnica y UX.
- Funciones del packaging: protección, identidad, unboxing y rotulado.
- Reglas: funcionalidad, coherencia gráfica, sustentabilidad y claridad informativa.
- Boceto del empaque (cartón kraft, cierre autoarmable, sin plásticos).
- Contenido: tarjeta NFC, QR de respaldo, stickers Vibe Check, guía rápida.
- Rotulado legal para Chile y diseño del stand de ventas.

## Resumen funcional

Ver [`producto.md`](producto.md) para la especificación funcional que guiará la plataforma.

## Documentación técnica

- [`arquitectura/acceso-y-dispositivos.md`](arquitectura/acceso-y-dispositivos.md): Ley
  21.801, canales de acceso, tokens guest/público, flujo de onboarding, persistencia de
  perfiles, PWA y operación escolar.
- [`plan-apps.md`](plan-apps.md): PWA instalable ya implementada y plan de la APK
  (Capacitor) y del ejecutable de Windows (Tauri), API y fases.
- [`marca/analisis-visual.md`](marca/analisis-visual.md): paleta y recortes de marca
  derivados de las referencias originales.

## Estado actual de la web

- `/` sin token muestra un error de acceso; no es la landing pública.
- `/a/vibematch-acceso-publico-2026` abre la landing con los contactos para pedir el kit.
- `/a/<token-personal>` abre la bienvenida; al entrar se crea la sesión.
- El primer ingreso pide perfil; luego queda guardado para las siguientes entradas.
- `/app` muestra el dashboard, `/app/perfil` permite editar y `/app/instalar` explica cómo
  instalar la PWA. Las apps APK/EXE siguen en preparación.
- Existen 100 tarjetas guest únicas, 3 demos y 1 token público en `data/cards.json` (solo
  hashes). Los tokens en claro están en `data/tarjetas-demo.csv`, ignorado por Git.
