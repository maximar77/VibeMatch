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
| Web App | URL única `/a/<token>`; no requiere instalar una app ni usar el celular personal. |

Flujo UX: **aproximación en un punto institucional → canje de token → bienvenida →
perfil y zonas de interés**.

La autenticación valida el token único de la tarjeta contra un registro de hashes SHA-256.
Si es válido, se cambia por una cookie de sesión firmada con HMAC (8 horas) y se muestra la
bienvenida. El token no contiene nombre, curso ni RUT. El acceso está diseñado para no
depender de dispositivos personales durante la jornada escolar (Ley 21.801); ver
[`arquitectura/acceso-y-dispositivos.md`](arquitectura/acceso-y-dispositivos.md).

## 3. Perfil de usuario

- Nombre preferido.
- Pronombres.
- Intereses / zonas de interés.
- Vibe Check: estado de ánimo o disposición del día (ej. "Modo estudio", "Disponible para
  conversar", "Busco equipo").
- Enlaces opcionales a redes sociales externas.
- Anonimato optativo para consultas sensibles o participación inicial.

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

1. Stack: **decidido** Next.js + React + TypeScript para la web; APK (Capacitor) y EXE
   (Tauri) quedan planificadas en [`plan-apps.md`](plan-apps.md).
2. Alcance del MVP: acceso por tarjeta, bienvenida y dashboard base ya implementados;
   chat, matching y moderación siguen abiertos.
3. Modelo de datos y autenticación: registro JSON con hashes y cookie HMAC en el MVP;
   falta migrar a base de datos y panel de administración.
4. Infraestructura y privacidad de menores (Ley 21.719 de protección de datos en Chile).
5. Lectura NFC: se priorizan lectores institucionales (USB/tablet); Web NFC en navegador
   queda como opción secundaria.
6. Identidad gráfica definitiva: colores, tipografías y archivos vectoriales.
7. Definición del piloto: cursos, cantidad de tarjetas, puntos de acceso y responsables.
