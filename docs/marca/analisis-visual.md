# Análisis visual de marca — VibeMatch

> Fuente: carpetas de referencia del usuario en `Referencia VibeMatch/` (no se movieron ni borraron archivos originales).  
> Colores obtenidos por muestreo de píxeles con `System.Drawing` (PowerShell), no inventados.

---

## 1. Imágenes de referencia y variantes que muestran

### A) `Referencia VibeMatch/logos.png` (1402 × 1122, fondo blanco roto #F6F6F2)
Hoja de identidad de marca en 4 cuadrantes, trazo a mano en azul sobre papel. Es la referencia de mayor resolución.

| Cuadrante | Variante | Qué se muestra |
|-----------|----------|----------------|
| Superior izquierda | **Logotipo** | `VIBE•MATCH` en trazo a mano, angular, con acento tipo "x" sobre la "V" y punto separador entre VIBE y MATCH. Nota: "original sketch text / MÁXIMO @ MVT '74". |
| Superior derecha | **Isotipo** | Símbolo: trazo de líneas dinámicas/diagonales dentro de un squircle/cuadro, con flecha ondulada (onda NFC) y globos de chat ("HOLA", "BIENVENIDO"). Notas: "Trazo de líneas dinámicas / Interfaz", "Fondo ambiguo / combinante". |
| Inferior izquierda | **Imagotipo** | Isotipo a la izquierda + logotipo a la derecha, con flecha que indica "[SÍMBOLO] VIBE•MATCH". |
| Inferior derecha | **Isologotipo / Escudo** | `VIBE•MATCH` integrado dentro de un escudo circular con textura de fondo. Notas: "Marca integrada / Escudo", "[Fondo de textura] 'No es isotipo ni imagotipo, es INTEGRADO'", "VIBE MATCH - Brand Identity Development". |

### B) `Referencia VibeMatch/buena idea.jfif` (512 × 410, fondo #F6F6F2) → `public/marca/buena-idea.png`
Versión digital limpia (render) de la misma hoja de 4 cuadrantes, en azul sobre fondo gris muy claro. Es la representación más nítida y consistente de las cuatro variantes; ideal para mostrar la identidad completa en la web.

### C) `Referencia VibeMatch/logos primer boceto y mi favorito.jfif` (230 × 512, foto de teléfono) → `public/marca/boceto.png`
Foto con cámara móvil de un boceto a mano sobre papel, sostenido por una mano. Contiene las mismas ideas (logotipo + símbolo ondulado) pero con menor calidad, sombras y ángulo de foto. Se conserva como trazabilidad del proceso; no se usa como recurso gráfico principal en la web.

---

## 2. Tipografía e iconografía

- **Tipografía de marca:** el logotipo es un trazo manuscrito/angular geométrico (`VIBE•MATCH`), no una fuente de sistema estándar.
- **Tipografía de la web:** `Geist` (sans) + `Geist Mono` ya configuradas en `layout.tsx`. Geist es una sans geométrica neutra y legible; no reproduce el carácter manuscrito del logotipo, pero es la opción correcta para la interfaz (no hay archivos de fuente de marca disponibles y no se debe inventar una fuente propietaria). Recomendación: mantener Geist para UI; si se desea aproximar el título de marca en piezas grandes, usar una fuente de display gratuita de Google Fonts de estilo geométrico/ángulo solo en el logotipo tipográfico, nunca en texto de cuerpo.
- **Iconografía del isotipo:** squircle/cuadro con trama diagonal, flecha ondulada (alusión a NFC/proximidad) y globos de chat ("HOLA", "BIENVENIDO"). Coherente con el producto phygital (tarjeta NFC + chat de zonas).

---

## 3. Paleta de colores (códigos reales muestrados)

| Rol | Color HEX | Origen / notas |
|-----|-----------|----------------|
| **Primario (marca)** | `#6D7ED3` | Tinta azul, cuerpo del trazo, promedio de píxeles azules de `logos.png` (37.399 px). Valor representativo de la marca. |
| Fondo de las imágenes de referencia | `#F6F6F2` | Blanco roto / gris muy claro (promedio `logos.png` y `buena idea.jfif`). No es transparente. |
| Neutro oscuro (UI) | `#07070d` | `--ink`, ya en uso (fondo body, texto sobre acentos). |
| Neutro superficie | `#10101c` | `--surface`, ya en uso (tarjetas, superficies elevadas). |

**Tonos derivados para UI** (no muestrados directamente; claros aclarados del primario para uso en gradientes, glass, etiquetas y CTA):
- Secundario suave: `#9FB3E8` (tinta aclarada, etiquetas de sección, glows).
- Acento CTA: `#8FA7F8` (más brillante, botones y selección).

> Nota: `producto.md §7` indica que la paleta y tipografías oficiales están **abiertas** (falta detalle de códigos); estos valores se derivan exclusivamente de las imágenes de referencia.

### Rol asignado en la web
- `--brand` / `text-brand`, `bg-brand`, `from-brand`: primario `#6D7ED3` (títulos, números de paso, glows principales).
- `--brand-soft` / `text-brand-soft`, `via-brand-soft`: secundario suave (etiquetas de sección, stop intermedio de gradientes, borders sutiles).
- `--brand-strong` / `bg-brand-strong`, `text-brand-strong`: acento (CTAs "Quiero mi pack", "Pedir información", selección de texto, puntos de indicador).
- `--ink`, `--surface`: conservados (fondo, tarjetas, texto sobre acentos).

---

## 4. Fondo de las imágenes y cómo mostrarlas en web oscura

- Las tres referencias tienen **fondo blanco roto (#F6F6F2), no transparente**.
- En una web oscura (`--ink #07070d`), poner el logotipo directamente sobre el fondo oscuro causaría recorte visual o perdería el contexto del fondo de la hoja.
- **Tratamiento aplicado:** se recortaron las cuatro variantes desde el render limpio (`buena-idea.png`) y se convirtieron a PNG con **fondo transparente** para usarlas en la web oscura. La hoja completa se conserva como referencia en la sección de identidad.

### Assets generados

| Archivo | Origen | Uso |
|---------|--------|-----|
| `public/marca/logotipo.png` | recorte de `buena-idea.png` (624×174) | Firma de marca |
| `public/marca/isotipo.png` | recorte (615×375) | Header, footer e iconografía |
| `public/marca/imagotipo.png` | recorte (675×303) | Sección de identidad |
| `public/marca/isologotipo.png` | recorte (351×372) | Sección de identidad y sello |
| `src/app/icon.png` | isologotipo sobre fondo claro (256×256) | Favicon |

Los recortes se generaron por detección de tinta azul (coordenadas sobre la imagen de 512×410) y se escalaron ×3 con interpolación bicúbica. El color de tinta se normalizó a `#6D7ED3` con alfa progresivo para integrarse limpiamente sobre fondos oscuros.

---

## 5. Uso recomendado de cada variante (según manuales)

| Variante | Uso recomendado |
|----------|-----------------|
| Logotipo | Cabecera y pie de página (marca principal), con su fondo claro tratado. |
| Isotipo | Avatar, favicon, iconos de interfaz y sellos pequeños (si se obtiene recorte limpio). |
| Imagotipo | Piezas de comunicación donde símbolo y texto viajan juntos (impresión, merchandising). |
| Isologotipo / Escudo | Tarjeta NFC, sellos, avatar de marca y aplicaciones pequeñas; uso integrado. |

---

## 6. Notas de implementación y limitaciones

1. **No hay archivos vectoriales** (.svg/.ai) de marca; solo las imágenes de referencia rasterizadas. El isotipo SVG inventado se reemplazó por un recorte de la referencia real.
2. **Fondo:** los recortes tienen fondo transparente y tinta azul normalizada; en la sección de identidad se presentan sobre una placa clara `#F6F6F2` para mantener la fidelidad al manual.
3. **Favicon:** se generó `src/app/icon.png` (256×256) a partir del isologotipo sobre fondo claro. Next.js lo detecta automáticamente; el build expone la ruta `/icon.png`.
4. **Paleta "abierta":** los HEX se derivaron de las imágenes; no provienen de un manual de estilo cerrado (los `.docx` originales no se modifican ni se leen como fuente de color).
5. **No se agregaron dependencias** ni se ejecutó `npm install`. Se reutilizaron los tokens CSS existentes, renombrados de forma consistente.
6. **Accesibilidad:** alt descriptivos en `next/image`, contraste verificado del primario `#6D7ED3` sobre fondo oscuro (ratio suficiente para texto grande/decorativo), y `prefers-reduced-motion` respetado (animaciones existentes).
