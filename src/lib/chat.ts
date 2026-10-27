/**
 * Almacenamiento de mensajes de las canchitas de chat VibeMatch.
 *
 * Los mensajes se guardan en data/chat.json con escritura atómica.
 * Cada mensaje está asociado a un canal temático y al usuario que lo envía.
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { DATA_DIR } from "@/lib/data-dir";

const STORE_PATH = path.join(DATA_DIR, "chat.json");

export type MensajeChat = {
  id: string;
  canal: string;
  usuarioId: string; // cardId del alumno
  usuarioNombre: string;
  usuarioVibe?: string; // "busco-equipo" | "conversar" | ...
  texto: string;
  timestamp: string;
  editado: boolean;
  filtrado: boolean;
};

type ChatStore = {
  version: 1;
  mensajes: MensajeChat[];
};

function readStore(): ChatStore {
  if (!existsSync(STORE_PATH)) {
    return { version: 1, mensajes: [] };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(STORE_PATH, "utf8").replace(/^\uFEFF/, ""));
  } catch (error) {
    throw new Error("No se pudo leer data/chat.json.", { cause: error });
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    !Array.isArray((parsed as ChatStore).mensajes)
  ) {
    throw new Error("data/chat.json no tiene el formato esperado.");
  }

  return { version: 1, mensajes: (parsed as ChatStore).mensajes };
}

function escribirStore(store: ChatStore) {
  mkdirSync(DATA_DIR, { recursive: true });
  const temporal = `${STORE_PATH}.${process.pid}.tmp`;
  writeFileSync(temporal, `${JSON.stringify(store, null, 2)}\n`, "utf8");
  renameSync(temporal, STORE_PATH);
}

/** Obtiene los mensajes de un canal, ordenados por timestamp (más recientes últimos). */
export function listarMensajes(canal: string, limite = 100): MensajeChat[] {
  const { mensajes } = readStore();
  return mensajes
    .filter((m) => m.canal === canal)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .slice(-limite);
}

/** Guarda un nuevo mensaje en el canal. */
export function guardarMensaje(mensaje: Omit<MensajeChat, "id">): MensajeChat {
  const store = readStore();
  const guardado: MensajeChat = {
    ...mensaje,
    id: `msg_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
  };
  store.mensajes = [...store.mensajes, guardado];

  // Límite defensivo para que el JSON no crezca sin control en la demo.
  if (store.mensajes.length > 2000) {
    store.mensajes = store.mensajes.slice(-2000);
  }

  escribirStore(store);
  return guardado;
}

/** Canales disponibles en VibeMatch. */
export const CANALES_CHAT = [
  { id: "deportes", nombre: "Deportes", descripcion: "Equipos, torneos y partidos" },
  { id: "arte", nombre: "Arte", descripcion: "Portafolios, música y proyectos creativos" },
  { id: "videojuegos", nombre: "Videojuegos", descripcion: "Cooperativos y torneos internos" },
  { id: "estudio", nombre: "Estudio", descripcion: "Grupos de repaso y tutorías" },
] as const;

export type CanalChat = (typeof CANALES_CHAT)[number]["id"];

export function esCanalChat(value: string): value is CanalChat {
  return CANALES_CHAT.some((canal) => canal.id === value);
}