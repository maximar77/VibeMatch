import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { DATA_DIR } from "@/lib/data-dir";

/**
 * Muros temáticos VibeMatch.
 *
 * Cada muro es un tablero de publicaciones con texto y una foto opcional.
 * Se guardan en data/muros.json con escritura atómica. Las imágenes viajan
 * como data URL JPEG comprimido en el cliente para que funcionen igual en la
 * web, la PWA y la app Android sin depender de un servicio externo.
 */

const STORE_PATH = path.join(DATA_DIR, "muros.json");

export const MUROS = [
  {
    id: "deportes",
    nombre: "Deportes",
    emoji: "⚽",
    descripcion: "Equipos, partidos, entrenamientos y torneos.",
    color: "from-orange-400/20 to-rose-500/10 text-orange-200",
  },
  {
    id: "arte",
    nombre: "Arte",
    emoji: "🎨",
    descripcion: "Dibujos, portafolios, música y proyectos creativos.",
    color: "from-fuchsia-400/20 to-violet-500/10 text-fuchsia-200",
  },
  {
    id: "videojuegos",
    nombre: "Videojuegos",
    emoji: "🎮",
    descripcion: "Cooperativos, torneos internos y comunidades.",
    color: "from-cyan-400/20 to-blue-500/10 text-cyan-200",
  },
  {
    id: "estudio",
    nombre: "Estudio",
    emoji: "📚",
    descripcion: "Apuntes, grupos de repaso y tutorías entre pares.",
    color: "from-lime-300/20 to-emerald-500/10 text-lime-200",
  },
  {
    id: "musica",
    nombre: "Música",
    emoji: "🎧",
    descripcion: "Playlists, bandas, recomendaciones y talentos.",
    color: "from-purple-400/20 to-pink-500/10 text-purple-200",
  },
  {
    id: "fotos",
    nombre: "Fotos",
    emoji: "📸",
    descripcion: "Momentos del colegio, panoramas y memoria visual.",
    color: "from-amber-300/20 to-orange-500/10 text-amber-200",
  },
] as const;

export type MuroId = (typeof MUROS)[number]["id"];

export type PublicacionMuro = {
  id: string;
  muro: MuroId;
  usuarioId: string;
  usuarioNombre: string;
  texto: string;
  imagen: string | null;
  createdAt: string;
};

type MurosStore = {
  version: 1;
  publicaciones: PublicacionMuro[];
};

export function esMuroId(value: string): value is MuroId {
  return MUROS.some((muro) => muro.id === value);
}

export function infoMuro(id: MuroId) {
  return MUROS.find((muro) => muro.id === id)!;
}

function leerStore(): MurosStore {
  if (!existsSync(STORE_PATH)) return { version: 1, publicaciones: [] };

  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(STORE_PATH, "utf8").replace(/^\uFEFF/, ""));
  } catch (error) {
    throw new Error("No se pudo leer data/muros.json.", { cause: error });
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    !Array.isArray((parsed as MurosStore).publicaciones)
  ) {
    throw new Error("data/muros.json no tiene el formato esperado.");
  }

  return { version: 1, publicaciones: (parsed as MurosStore).publicaciones };
}

function escribirStore(store: MurosStore) {
  mkdirSync(DATA_DIR, { recursive: true });
  const temporal = `${STORE_PATH}.${process.pid}.tmp`;
  writeFileSync(temporal, `${JSON.stringify(store, null, 2)}\n`, "utf8");
  renameSync(temporal, STORE_PATH);
}

export function listarPublicaciones(muro: MuroId, limite = 60): PublicacionMuro[] {
  return leerStore()
    .publicaciones.filter((publicacion) => publicacion.muro === muro)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limite);
}

export function contarPublicaciones(muro: MuroId): number {
  return leerStore().publicaciones.filter((publicacion) => publicacion.muro === muro)
    .length;
}

export function contarTodas(): Record<string, number> {
  const conteo: Record<string, number> = {};
  for (const muro of MUROS) conteo[muro.id] = 0;
  for (const publicacion of leerStore().publicaciones) {
    if (publicacion.muro in conteo) conteo[publicacion.muro] += 1;
  }
  return conteo;
}

export function guardarPublicacion(
  publicacion: Omit<PublicacionMuro, "id" | "createdAt">,
): PublicacionMuro {
  const store = leerStore();
  const guardada: PublicacionMuro = {
    ...publicacion,
    id: `muro_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
  };
  store.publicaciones = [...store.publicaciones, guardada];

  // Límite defensivo para que el JSON no crezca sin control en la demo.
  if (store.publicaciones.length > 1000) {
    store.publicaciones = store.publicaciones.slice(-1000);
  }

  escribirStore(store);
  return guardada;
}
