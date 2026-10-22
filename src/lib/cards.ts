import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
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
  holder?: string | null;
  level?: string | null;
  status?: "active" | "revoked";
  createdAt?: string;
};

type CardStore = {
  school?: string;
  cards?: StoredCard[];
};

export type Tarjeta = {
  id: string;
  holder: string | null;
  level: string | null;
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
  return {
    id: card.id,
    holder: card.holder ?? null,
    level: card.level ?? null,
    status: card.status ?? "active",
    createdAt: card.createdAt ?? null,
  };
}

/**
 * Valida un token de tarjeta. Devuelve solo datos públicos: el hash nunca sale
 * de este módulo.
 */
export function validarToken(token: string): Acceso | null {
  const clean = token.trim();
  if (!TOKEN_PATTERN.test(clean)) return null;

  const store = readStore();
  const hash = hashToken(clean);
  let match: StoredCard | null = null;

  for (const card of store.cards) {
    if (card.status === "revoked") continue;
    if (card.tokenHash && safeEqual(card.tokenHash, hash)) {
      match = card;
    }
  }

  if (!match) return null;
  return { card: toTarjeta(match), school: store.school };
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
