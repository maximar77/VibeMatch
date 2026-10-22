# VibeMatch

Microempresa escolar de tecnología e interacción social. VibeMatch conecta a estudiantes
mediante una solución **phygital**: una tarjeta NFC (o QR de respaldo) abre un perfil con
intereses, pronombres y estado de ánimo, y desde ahí se accede a zonas de interés y chat
moderado dentro de la comunidad escolar.

El acceso está diseñado para la **Ley 21.801**: no depende del celular personal del
estudiante durante la jornada escolar. La tarjeta es la llave y los puntos de acceso son
equipos del establecimiento (Puntos Vibe, laboratorio y, más adelante, la app de escritorio).

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

### Acceso por tarjeta (demo local)

```bash
# Genera 3 tarjetas demo y escribe los tokens en data/tarjetas-demo.csv
node scripts/generar-tarjetas.mjs

# Servidor de producción en el puerto usado por los enlaces demo
npm run build
npx next start -p 3100
```

El generador imprime una URL `/a/<token>` por tarjeta. Esa URL es la que se graba en el
NFC y se imprime como QR. El registro `data/cards.json` guarda solo hashes SHA-256; el CSV
con los tokens en claro está ignorado por Git.

Variables relevantes:

| Variable | Uso |
| --- | --- |
| `VIBEMATCH_SECRET` | Secreto HMAC de la cookie de sesión. Obligatorio en producción. |
| `VIBEMATCH_COOKIE_SECURE=1` | Activa `Secure` cuando el sitio se sirve por HTTPS. |
| `BASE_URL` | Dominio impreso por el generador (por defecto `http://localhost:3100`). |
| `SCHOOL_NAME` | Nombre del establecimiento en las tarjetas generadas. |

Copia `.env.example` a `.env.local` y completa `VIBEMATCH_SECRET` antes de un despliegue real.

## Estructura del repositorio

```
VibeMatch/
├── src/app/               App Router: landing, /a/[token], /app, acciones y estilos
├── src/components/        Componentes compartidos (marca)
├── src/lib/cards.ts       Tokens, sesión HMAC y registro de tarjetas
├── public/marca/          Recortes de logotipo, isotipo, imagotipo e isologotipo
├── scripts/               Generador de tarjetas y tokens
├── data/cards.json        Registro de tarjetas (solo hashes) — no versionar tokens
├── docs/                  Documentación, especificación y arquitectura
│   ├── marca/             Análisis visual y paleta derivada de las referencias
│   └── arquitectura/      Acceso por tarjeta y diseño para la Ley 21.801
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
| `docs/arquitectura/acceso-y-dispositivos.md` | Ley 21.801, canales de acceso (Punto Vibe, laboratorio, tarjeta), flujo de token y seguridad. |
| `docs/plan-apps.md` | Plan de la APK (Capacitor) y del `.exe` (Tauri), API necesaria y fases. |

Resumen navegable: [`docs/README.md`](docs/README.md) · Especificación funcional: [`docs/producto.md`](docs/producto.md)

## Estado del proyecto

- [x] Repositorio Git + GitHub privado con documentación base.
- [x] Scaffold de Next.js, TypeScript y Tailwind CSS.
- [x] Landing page de presentación de la marca.
- [x] Identidad visual aplicada: logotipo, isotipo, imagotipo, isologotipo y favicon reales.
- [x] Acceso por tarjeta única: `/a/[token]`, bienvenida, cookie de sesión y `/app` protegido.
- [x] Generación de tarjetas con tokens únicos (solo hashes en el repositorio).
- [ ] Codificación física de tarjetas NFC y generación de QR imprimibles.
- [ ] Prototipo de perfiles, matching y zonas de interés.
- [ ] Panel de moderación, revocación y logs.
- [ ] API para APK/EXE, app Android y app de escritorio.

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
