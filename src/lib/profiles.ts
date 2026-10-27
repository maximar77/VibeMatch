import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { DATA_DIR } from "@/lib/data-dir";
import type { Perfil } from "@/lib/profile-schema";

/**
 * Perfiles locales de VibeMatch.
 *
 * En esta etapa el servidor guarda los perfiles en data/profiles.json (ignorado
 * por Git porque contiene datos personales). La tarjeta es la llave estable que
 * después podrán usar las apps Android/Windows y la API.
 */

const STORE_PATH = path.join(DATA_DIR, "profiles.json");

type ProfileStore = {
  version: 1;
  profiles: Perfil[];
};

function readStore(): ProfileStore {
  if (!existsSync(STORE_PATH)) {
    return { version: 1, profiles: [] };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(STORE_PATH, "utf8").replace(/^\uFEFF/, ""));
  } catch (error) {
    throw new Error("No se pudo leer data/profiles.json.", { cause: error });
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    !Array.isArray((parsed as ProfileStore).profiles)
  ) {
    throw new Error("data/profiles.json no tiene el formato esperado.");
  }

  return { version: 1, profiles: (parsed as ProfileStore).profiles };
}

function writeStore(store: ProfileStore) {
  mkdirSync(DATA_DIR, { recursive: true });
  const temporary = `${STORE_PATH}.${process.pid}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(store, null, 2)}\n`, "utf8");
  renameSync(temporary, STORE_PATH);
}

export function leerPerfil(cardId: string): Perfil | null {
  return readStore().profiles.find((profile) => profile.cardId === cardId) ?? null;
}

export function guardarPerfil(
  profile: Omit<Perfil, "createdAt" | "updatedAt" | "consentAt">,
): Perfil {
  const store = readStore();
  const now = new Date().toISOString();
  const existing = store.profiles.find((item) => item.cardId === profile.cardId);

  const saved: Perfil = {
    ...profile,
    createdAt: existing?.createdAt ?? now,
    consentAt: now,
    updatedAt: now,
  };

  store.profiles = [
    ...store.profiles.filter((item) => item.cardId !== profile.cardId),
    saved,
  ];
  writeStore(store);
  return saved;
}

export function existeAlmacenDePerfiles(): boolean {
  return existsSync(STORE_PATH);
}
