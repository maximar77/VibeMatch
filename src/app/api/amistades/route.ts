import { NextResponse } from "next/server";
import { leerSesion } from "@/lib/cards";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { DATA_DIR } from "@/lib/data-dir";

const AMIGADAS_PATH = path.join(DATA_DIR, "amistades.json");

type Amigo = {
  id: string;
  nombre: string;
};

type AmistadesStore = {
  version: 1;
  amigos: Amigo[];
};

function readAmistadesStore(): AmistadesStore {
  if (!existsSync(AMIGADAS_PATH)) {
    return { version: 1, amigos: [] };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(AMIGADAS_PATH, "utf8").replace(/^\uFEFF/, ""));
  } catch (error) {
    throw new Error("No se pudo leer data/amistades.json.", { cause: error });
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    !Array.isArray((parsed as AmistadesStore).amigos)
  ) {
    throw new Error("data/amistades.json no tiene el formato esperado.");
  }

  return { version: 1, amigos: (parsed as AmistadesStore).amigos };
}

function writeAmistadesStore(store: AmistadesStore) {
  mkdirSync(DATA_DIR, { recursive: true });
  const temporal = `${AMIGADAS_PATH}.${process.pid}.tmp`;
  writeFileSync(temporal, `${JSON.stringify(store, null, 2)}\n`, "utf8");
  renameSync(temporal, AMIGADAS_PATH);
}

// GET: listar amigos del usuario actual
export async function GET(
  request: Request,
  { params }: { params: Promise<{ canal: string }> }
) {
  const acceso = await leerSesion();
  if (!acceso || acceso.card.kind === "public") {
    return NextResponse.json({ error: "sin_sesion" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get("tipo");

  const store = readAmistadesStore();

  let amigos = store.amigos;

  // Filtrar por tipo si se especifica
  if (tipo === "amigo") {
    amigos = amigos.filter((a) => a.id !== undefined);
  }

  return NextResponse.json({ amigos }, { headers: { "cache-control": "no-store" } });
}

// POST: agregar un amigo
export async function POST(
  request: Request,
  { params }: { params: Promise<{ canal: string }> }
) {
  const acceso = await leerSesion();
  if (!acceso || acceso.card.kind === "public") {
    return NextResponse.json({ error: "sin_sesion" }, { status: 401 });
  }

  let cuerpo: Record<string, unknown>;
  try {
    cuerpo = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "json_invalido" }, { status: 400 });
  }

  const { idAmigo, nombre } = cuerpo as { idAmigo: string; nombre: string };

  if (!idAmigo || !nombre) {
    return NextResponse.json({ error: "faltan_campos" }, { status: 400 });
  }

  const store = readAmistadesStore();

  // Verificar que el amigo no exista ya
  const yaExiste = store.amigos.some((a) => a.id === idAmigo);
  if (yaExiste) {
    return NextResponse.json({ error: "amigo_yexistente" }, { status: 409 });
  }

  const nuevoAmigo: Amigo = {
    id: idAmigo,
    nombre,
  };

  store.amigos = [...store.amigos, nuevoAmigo];
  writeAmistadesStore(store);

  return NextResponse.json({ ok: true, amigo: nuevoAmigo });
}