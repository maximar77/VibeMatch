# VibeMatch

Microempresa escolar de tecnología e interacción social. VibeMatch conecta a estudiantes
mediante una solución **phygital**: una tarjeta NFC (o QR de respaldo) abre un perfil con
intereses, pronombres y estado de ánimo, y desde ahí se accede a zonas de interés y chat
moderado dentro de la comunidad escolar.

- **Público objetivo:** estudiantes de 12 a 22 años de comunidades escolares y académicas.
- **Establecimiento piloto:** Colegio Superior del Maipo (Chile).
- **Responsable:** Maximo Orellana.

## Estructura del repositorio

```
VibeMatch/
├── docs/                  Documentos originales del proyecto (.docx)
│   └── README.md          Índice y resumen de cada documento
├── docs/producto.md       Especificación funcional extraída de los documentos
├── README.md
└── .gitignore
```

## Documentación

| Documento | Contenido |
| --- | --- |
| `docs/VibeMatch - Esquema de Proyecto de Diseño e Ideas.docx` | Idea, público, matching por NFC/QR, perfil, chat, moderación, piloto y factibilidad. |
| `docs/Manual de Identidad Corporativa - VibeMatch.docx` | Marca, valores, misión/visión, logotipo, isotipo, imagotipo, isologotipo y Phygital Pack. |
| `docs/Manual de Identidad Corporativa Completo - VibeMatch.docx` | Versión extendida del manual: equipo, identidad visual, producto y flujo UX. |
| `docs/Actividad de Packaging y Diseño - VibeMatch.docx` | Packaging, normativa chilena (SERNAC, Minsal, SUBTEL) y stand de ventas. |

Resumen navegable: [`docs/README.md`](docs/README.md) · Especificación: [`docs/producto.md`](docs/producto.md)

## Estado del proyecto

- [x] Repositorio Git inicializado y documentación base versionada.
- [ ] Definición del stack de la plataforma web/app.
- [ ] Prototipo de perfiles, matching y zonas de interés.
- [ ] Panel de moderación y logs.
- [ ] Integración NFC/QR.

## Flujo de trabajo

```bash
git status
git add .
git commit -m "descripción del cambio"
```

Las ramas principales son `main` (estable) y ramas cortas por funcionalidad
(`feat/...`, `fix/...`, `docs/...`).
