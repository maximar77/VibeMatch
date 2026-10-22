# VibeMatch

Microempresa escolar de tecnología e interacción social. VibeMatch conecta a estudiantes
mediante una solución **phygital**: una tarjeta NFC (o QR de respaldo) abre un perfil con
intereses, pronombres y estado de ánimo, y desde ahí se accede a zonas de interés y chat
moderado dentro de la comunidad escolar.

- **Público objetivo:** estudiantes de 12 a 22 años de comunidades escolares y académicas.
- **Establecimiento piloto:** Colegio Superior del Maipo (Chile).
- **Responsable:** Maximo Orellana.
- **Repositorio:** https://github.com/maximar77/VibeMatch (privado)

## Stack

- [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- React 19 + TypeScript
- Tailwind CSS 4
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

## Estructura del repositorio

```
VibeMatch/
├── src/app/               App Router: layout, página principal, estilos e icono
├── public/marca/          Recortes de logotipo, isotipo, imagotipo e isologotipo
├── docs/                  Documentación original y especificación funcional
│   └── marca/             Análisis visual y paleta derivada de las referencias
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

Resumen navegable: [`docs/README.md`](docs/README.md) · Especificación funcional: [`docs/producto.md`](docs/producto.md)

## Estado del proyecto

- [x] Repositorio Git + GitHub privado con documentación base.
- [x] Scaffold de Next.js, TypeScript y Tailwind CSS.
- [x] Landing page de presentación de la marca.
- [x] Identidad visual aplicada: logotipo, isotipo, imagotipo, isologotipo y favicon reales.
- [ ] Prototipo de perfiles, matching y zonas de interés.
- [ ] Panel de moderación y logs.
- [ ] Integración NFC/QR.

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
