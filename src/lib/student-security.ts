import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
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
 * Clave opcional de la cuenta de estudiante.
 *
 * La tarjeta NFC/QR sigue siendo la llave principal. Esta clave añade una
 * segunda barrera cuando alguien conoce o encuentra el enlace de la tarjeta.
 * El hash scrypt vive separado de profiles.json para que nunca se envíe al
 * navegador junto con el perfil público.
 */

const STORE_PATH = path.join(DATA_DIR, "student-security.json");

type AlmacenClave = {
  cardId: string;
  passwordHash: string;
  updatedAt: string;
};

type SeguridadStore = {
  version: 1;
  students: AlmacenClave[];
};

export type EstadoSeguridad = {
  protegida: boolean;
  actualizadaEn: string | null;
};

function leerStore(): SeguridadStore {
  if (!existsSync(STORE_PATH)) return { version: 1, students: [] };

  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(STORE_PATH, "utf8").replace(/^\uFEFF/, ""));
  } catch (error) {
    throw new Error("No se pudo leer data/student-security.json.", { cause: error });
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    !Array.isArray((parsed as SeguridadStore).students)
  ) {
    throw new Error("data/student-security.json no tiene el formato esperado.");
  }

  return { version: 1, students: (parsed as SeguridadStore).students };
}

function escribirStore(store: SeguridadStore) {
  mkdirSync(DATA_DIR, { recursive: true });
  const temporal = `${STORE_PATH}.${process.pid}.tmp`;
  writeFileSync(temporal, `${JSON.stringify(store, null, 2)}\n`, "utf8");
  renameSync(temporal, STORE_PATH);
}

function hashClave(password: string, salt: Buffer): string {
  return scryptSync(password, salt, 64).toString("base64");
}

function hashearClave(password: string): string {
  const salt = randomBytes(16);
  return `${salt.toString("base64")}:${hashClave(password, salt)}`;
}

function compararSeguro(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

export function verificarClaveEstudiante(cardId: string, password: string): boolean {
  const registro = leerStore().students.find((item) => item.cardId === cardId);
  if (!registro) return true; // cuenta sin clave: la tarjeta es suficiente

  const [saltB64, hashB64] = registro.passwordHash.split(":");
  if (!saltB64 || !hashB64) return false;

  try {
    const salt = Buffer.from(saltB64, "base64");
    const esperado = Buffer.from(hashB64, "base64");
    const actual = Buffer.from(hashClave(password, salt), "base64");
    return compararSeguro(actual.toString("base64"), esperado.toString("base64"));
  } catch {
    return false;
  }
}

export function tieneClaveEstudiante(cardId: string): boolean {
  return leerStore().students.some((item) => item.cardId === cardId);
}

export function estadoSeguridad(cardId: string): EstadoSeguridad {
  const registro = leerStore().students.find((item) => item.cardId === cardId);
  return {
    protegida: Boolean(registro),
    actualizadaEn: registro?.updatedAt ?? null,
  };
}

export function establecerClaveEstudiante(cardId: string, password: string): EstadoSeguridad {
  const store = leerStore();
  const ahora = new Date().toISOString();
  const registro: AlmacenClave = {
    cardId,
    passwordHash: hashearClave(password),
    updatedAt: ahora,
  };

  store.students = [
    ...store.students.filter((item) => item.cardId !== cardId),
    registro,
  ];
  escribirStore(store);

  return { protegida: true, actualizadaEn: ahora };
}

export function quitarClaveEstudiante(cardId: string): EstadoSeguridad {
  const store = leerStore();
  store.students = store.students.filter((item) => item.cardId !== cardId);
  escribirStore(store);
  return { protegida: false, actualizadaEn: null };
}
