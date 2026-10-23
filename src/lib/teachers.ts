import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { io } from "next/cache";
import { cookies } from "next/headers";
import {
  etiquetaCurso,
  normalizarCodigo,
  type DatosProfesor,
  type Letra,
  type Nivel,
} from "@/lib/teacher-schema";

/**
 * Cuentas de profesor VibeMatch.
 *
 * Se crean únicamente con el código secreto del establecimiento
 * (VIBEMATCH_TEACHER_CODE). Al registrarse, la web genera un código personal
 * para ese profesor, que es lo que usa para entrar después. El código personal
 * nunca se guarda en claro: solo su hash.
 *
 * Los datos viven en data/teachers.json, ignorado por Git.
 */

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "teachers.json");
const configuredSecret = process.env.VIBEMATCH_SECRET;
const SESSION_SECRET = configuredSecret ?? "vibematch-demo-secret-cambiar-en-produccion";

export const TEACHER_COOKIE = "vm_profe";
export const TEACHER_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12; // 12 horas

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

type StoredTeacher = DatosProfesor & {
  codeHash: string;
};

type TeacherStore = {
  version: 1;
  teachers: StoredTeacher[];
};

export type Profesor = DatosProfesor;

function readStore(): TeacherStore {
  if (!existsSync(STORE_PATH)) return { version: 1, teachers: [] };

  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(STORE_PATH, "utf8"));
  } catch (error) {
    throw new Error("No se pudo leer data/teachers.json.", { cause: error });
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    !Array.isArray((parsed as TeacherStore).teachers)
  ) {
    throw new Error("data/teachers.json no tiene el formato esperado.");
  }

  return { version: 1, teachers: (parsed as TeacherStore).teachers };
}

function writeStore(store: TeacherStore) {
  mkdirSync(DATA_DIR, { recursive: true });
  const temporal = `${STORE_PATH}.${process.pid}.tmp`;
  writeFileSync(temporal, `${JSON.stringify(store, null, 2)}\n`, "utf8");
  renameSync(temporal, STORE_PATH);
}

function aProfesor(teacher: StoredTeacher): Profesor {
  return {
    id: teacher.id,
    nombre: teacher.nombre,
    nivel: teacher.nivel,
    anio: teacher.anio,
    letra: teacher.letra,
    curso: teacher.curso,
    createdAt: teacher.createdAt,
    lastLoginAt: teacher.lastLoginAt,
  };
}

function hashCodigo(codigo: string): string {
  return createHash("sha256")
    .update(`${SESSION_SECRET}:${normalizarCodigo(codigo)}`)
    .digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

function sign(value: string): string {
  return createHmac("sha256", SESSION_SECRET).update(value).digest("base64url");
}

/**
 * Código del establecimiento para crear cuentas de profesor.
 * En producción debe definirse en VIBEMATCH_TEACHER_CODE. En desarrollo se usa
 * un valor de demo para poder probar sin configurar nada.
 */
export function codigoInstitucional(): string | null {
  const configured = process.env.VIBEMATCH_TEACHER_CODE;
  if (configured && configured.trim().length >= 6) return configured;
  if (process.env.NODE_ENV !== "production") return "VIBEMATCH-PROFE-DEMO";
  return null;
}

export function codigoInstitucionalValido(codigo: string): boolean {
  const esperado = codigoInstitucional();
  if (!esperado) return false;
  const a = normalizarCodigo(codigo);
  const b = normalizarCodigo(esperado);
  if (a.length !== b.length) return false;
  return safeEqual(a, b);
}

function generarCodigoPersonal(): string {
  const bytes = randomBytes(12);
  let codigo = "";
  for (const byte of bytes) {
    codigo += CODE_ALPHABET[byte % CODE_ALPHABET.length];
  }
  return codigo;
}

export type ResultadoRegistro =
  | { ok: true; profesor: Profesor; codigoPersonal: string }
  | { ok: false; error: string };

export function registrarProfesor(datos: {
  nombre: string;
  nivel: Nivel;
  anio: number;
  letra: Letra;
}): ResultadoRegistro {
  const store = readStore();
  const curso = etiquetaCurso(datos.nivel, datos.anio, datos.letra);
  const nombre = datos.nombre.trim().replace(/\s+/g, " ").slice(0, 48);

  if (nombre.length < 3) {
    return { ok: false, error: "Escribe el nombre del profesor (mínimo 3 caracteres)." };
  }

  const now = new Date().toISOString();
  let codigoPersonal = generarCodigoPersonal();
  let codeHash = hashCodigo(codigoPersonal);

  while (store.teachers.some((teacher) => teacher.codeHash === codeHash)) {
    codigoPersonal = generarCodigoPersonal();
    codeHash = hashCodigo(codigoPersonal);
  }

  const stored: StoredTeacher = {
    id: `profe_${Date.now().toString(36)}${randomBytes(3).toString("hex")}`,
    nombre,
    nivel: datos.nivel,
    anio: datos.anio,
    letra: datos.letra,
    curso,
    codeHash,
    createdAt: now,
    lastLoginAt: null,
  };

  store.teachers = [...store.teachers, stored];
  writeStore(store);

  return { ok: true, profesor: aProfesor(stored), codigoPersonal };
}

/** Valida el código personal de un profesor y actualiza su último acceso. */
export function autenticarProfesor(codigo: string): Profesor | null {
  const codeHash = hashCodigo(codigo);
  const store = readStore();
  const index = store.teachers.findIndex((teacher) =>
    safeEqual(teacher.codeHash, codeHash),
  );
  if (index === -1) return null;

  const now = new Date().toISOString();
  store.teachers[index] = { ...store.teachers[index], lastLoginAt: now };
  writeStore(store);
  return aProfesor(store.teachers[index]);
}

export function buscarProfesor(id: string): Profesor | null {
  const teacher = readStore().teachers.find((item) => item.id === id);
  return teacher ? aProfesor(teacher) : null;
}

export function crearSesionProfesor(profesorId: string): string {
  const expiresAt = Date.now() + TEACHER_SESSION_MAX_AGE_SECONDS * 1000;
  const payload = `${profesorId}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

function leerProfesorIdDesdeValor(value: string): string | null {
  const parts = value.split(".");
  if (parts.length !== 3) return null;

  const [profesorId, expiresAtRaw, signature] = parts;
  const expiresAt = Number(expiresAtRaw);
  if (!profesorId || !Number.isFinite(expiresAt) || expiresAt < Date.now()) return null;

  const expected = sign(`${profesorId}.${expiresAtRaw}`);
  if (!safeEqual(signature, expected)) return null;
  return profesorId;
}

/**
 * Lee la sesión del profesor desde la cookie. Vuelve a comprobar que la cuenta
 * siga existiendo. `io()` evita que Cache Components congele la lectura.
 */
export async function leerProfesorSesion(): Promise<Profesor | null> {
  await io();

  const cookieStore = await cookies();
  const value = cookieStore.get(TEACHER_COOKIE)?.value;
  if (!value) return null;

  const profesorId = leerProfesorIdDesdeValor(value);
  if (!profesorId) return null;

  return buscarProfesor(profesorId);
}

export function opcionesCookieProfesor() {
  const secure =
    process.env.VIBEMATCH_COOKIE_SECURE === "1" ||
    (process.env.VIBEMATCH_COOKIE_SECURE !== "0" &&
      process.env.VIBEMATCH_PUBLIC_URL?.startsWith("https://") === true);

  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: TEACHER_SESSION_MAX_AGE_SECONDS,
    secure,
  };
}
