import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { io } from "next/cache";
import { cookies } from "next/headers";

/**
 * Acceso por tarjeta única.
 *
 * El token del QR/NFC nunca se guarda en texto plano: el registro local solo
 * contiene su SHA-256. Al validarlo se cambia por una cookie de sesión firmada
 * (HMAC) para que el token desaparezca de la barra de direcciones.
 */

const STORE_PATH = path.join(process.cwd(), "data", "cards.json");
const configuredSecret = process.env.VIBEMATCH_SECRET;
const SESSION_SECRET = configuredSecret ?? "vibematch-demo-secret-cambiar-en-produccion";
let warnedAboutSecret = false;

export const SESSION_COOKIE = "vm_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8; // 8 horas: una jornada escolar

// Base64url con 32 bytes de entropía = 43 caracteres.
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{24,128}$/;

type StoredCard = {
  id: string;
  tokenHash: string;
  /** Nombre de presentación histórico (se mantiene por compatibilidad). */
  holder?: string | null;
  /** Curso histórico (se mantiene por compatibilidad). */
  level?: string | null;
  /** Nombre completo del estudiante, tal como aparece en la lista del curso. */
  fullName?: string | null;
  /** Curso del estudiante, por ejemplo: "Media 1° C". */
  course?: string | null;
  /** Número de lista dentro del curso. */
  listNumber?: number | null;
  kind?: "personal" | "public";
  status?: "active" | "revoked";
  createdAt?: string;
};

type CardStore = {
  school?: string;
  cards?: StoredCard[];
  updatedAt?: string;
};

export type Tarjeta = {
  id: string;
  holder: string | null;
  level: string | null;
  fullName: string | null;
  course: string | null;
  listNumber: number | null;
  kind: "personal" | "public";
  status: "active" | "revoked";
  createdAt: string | null;
};

export type Acceso = {
  card: Tarjeta;
  school: string;
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function sign(value: string): string {
  if (!configuredSecret && !warnedAboutSecret) {
    warnedAboutSecret = true;
    console.warn(
      "[VibeMatch] VIBEMATCH_SECRET no está definido: se usa el secreto de demo. Configúralo antes de exponer el sitio.",
    );
  }
  return createHmac("sha256", SESSION_SECRET).update(value).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

function readStore(): Required<Pick<CardStore, "school" | "cards">> {
  try {
    const raw = readFileSync(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as CardStore;
    return {
      school: parsed.school ?? "Establecimiento educacional",
      cards: Array.isArray(parsed.cards) ? parsed.cards : [],
    };
  } catch {
    // Sin registro de tarjetas no hay accesos válidos. Se gestiona con el
    // script scripts/generar-tarjetas.mjs.
    return { school: "Establecimiento educacional", cards: [] };
  }
}

function toTarjeta(card: StoredCard): Tarjeta {
  const course = card.course ?? card.level ?? null;
  return {
    id: card.id,
    holder: card.holder ?? null,
    level: card.level ?? course,
    fullName: card.fullName ?? card.holder ?? null,
    course,
    listNumber:
      typeof card.listNumber === "number" && Number.isFinite(card.listNumber)
        ? card.listNumber
        : null,
    kind: card.kind ?? "personal",
    status: card.status ?? "active",
    createdAt: card.createdAt ?? null,
  };
}

function buscarPorHash(hash: string): StoredCard | null {
  for (const card of readStore().cards) {
    if (card.status === "revoked") continue;
    if (card.tokenHash && safeEqual(card.tokenHash, hash)) return card;
  }
  return null;
}

/**
 * Valida un token de tarjeta. Devuelve solo datos públicos: el hash nunca sale
 * de este módulo.
 */
export function validarToken(token: string): Acceso | null {
  const clean = token.trim();
  if (!TOKEN_PATTERN.test(clean)) return null;

  const store = readStore();
  const match = buscarPorHash(hashToken(clean));
  if (!match) return null;
  return { card: toTarjeta(match), school: store.school };
}

/**
 * Busca una tarjeta por su token (por ejemplo, el token leído del NFC).
 * Devuelve null si el token no existe o la tarjeta está revocada.
 */
export function buscarTarjetaPorToken(token: string): Tarjeta | null {
  const clean = token.trim();
  if (!TOKEN_PATTERN.test(clean)) return null;
  const match = buscarPorHash(hashToken(clean));
  return match ? toTarjeta(match) : null;
}

/** Lista todas las tarjetas activas del establecimiento. */
export function listarTarjetas(): Tarjeta[] {
  return readStore()
    .cards.filter((card) => card.status !== "revoked")
    .map(toTarjeta);
}

/** Lista las tarjetas de un curso, ordenadas por número de lista. */
export function listarAlumnosPorCurso(curso: string): Tarjeta[] {
  const objetivo = normalizarCurso(curso);
  return listarTarjetas()
    .filter(
      (card) =>
        card.kind === "personal" &&
        card.course !== null &&
        normalizarCurso(card.course) === objetivo,
    )
    .sort((a, b) => {
      const na = a.listNumber ?? Number.MAX_SAFE_INTEGER;
      const nb = b.listNumber ?? Number.MAX_SAFE_INTEGER;
      if (na !== nb) return na - nb;
      return (a.fullName ?? a.id).localeCompare(b.fullName ?? b.id, "es");
    });
}

/** Normaliza un curso para comparar: "Media 1° C" === "media 1 c". */
export function normalizarCurso(curso: string): string {
  return curso
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[°º]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Crea el valor de la cookie: id.tarjeta.vencimiento.firma
 * La firma impide inventar sesiones sin conocer el secreto del servidor.
 */
export function crearSesion(cardId: string): string {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = `${cardId}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

function leerSesionDesdeValor(value: string): string | null {
  const parts = value.split(".");
  if (parts.length !== 3) return null;

  const [cardId, expiresAtRaw, signature] = parts;
  const expiresAt = Number(expiresAtRaw);
  if (!cardId || !Number.isFinite(expiresAt) || expiresAt < Date.now()) return null;

  const expected = sign(`${cardId}.${expiresAtRaw}`);
  if (!safeEqual(signature, expected)) return null;
  return cardId;
}

/**
 * Lee la cookie de sesión y vuelve a comprobar que la tarjeta siga activa.
 * Se usa dentro de un <Suspense> para cumplir con Cache Components.
 */
export async function leerSesion(): Promise<Acceso | null> {
  // La validación compara la expiración contra la hora actual. `io()` saca
  // esa lectura del shell estático para que Cache Components no la congele.
  await io();

  const cookieStore = await cookies();
  const value = cookieStore.get(SESSION_COOKIE)?.value;
  if (!value) return null;

  const cardId = leerSesionDesdeValor(value);
  if (!cardId) return null;

  const store = readStore();
  const card = store.cards.find((item) => item.id === cardId);
  if (!card || card.status === "revoked") return null;

  return { card: toTarjeta(card), school: store.school };
}

export function iniciales(nombre: string | null): string {
  if (!nombre) return "VM";
  const parts = nombre.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join("") || "VM";
}

/**
 * Aplica datos de usuario (nombre/curso/número de lista) a una tarjeta existente
 * a partir de los parámetros de la URL. Permite que cualquier token guest se
 * convierta en la base de una cuenta cuando la URL trae esos datos, sin tener
 * que registrar la tarjeta por adelantado.
 *
 * Devuelve true si la tarjeta existía y se actualizó.
 */
export function aplicarDatosTarjeta(
  token: string,
  datos: { nombre?: string | null; curso?: string | null; nro?: number | null },
): boolean {
  const clean = token.trim();
  if (!TOKEN_PATTERN.test(clean)) return false;

  const targetHash = hashToken(clean);
  let parsed: CardStore;
  try {
    parsed = JSON.parse(readFileSync(STORE_PATH, "utf8")) as CardStore;
  } catch {
    return false;
  }
  if (!parsed || !Array.isArray(parsed.cards)) return false;

  const idx = parsed.cards.findIndex((card) => card.tokenHash === targetHash);
  if (idx === -1) return false;

  const card = parsed.cards[idx];
  if (datos.nombre && datos.nombre.trim()) {
    card.holder = datos.nombre.trim();
    card.fullName = datos.nombre.trim();
  }
  if (datos.curso && datos.curso.trim()) {
    card.level = datos.curso.trim();
    card.course = datos.curso.trim();
  }
  if (datos.nro !== null && datos.nro !== undefined && !Number.isNaN(datos.nro)) {
    card.listNumber = Number(datos.nro);
  }

  parsed.updatedAt = new Date().toISOString();

  try {
    mkdirSync(path.dirname(STORE_PATH), { recursive: true });
    const temporary = `${STORE_PATH}.${process.pid}.tmp`;
    writeFileSync(temporary, `${JSON.stringify(parsed, null, 2)}\n`, "utf8");
    renameSync(temporary, STORE_PATH);
  } catch {
    return false;
  }
  return true;
}
