import { NextResponse } from "next/server";
import { leerSesion } from "@/lib/cards";
import { guardarAnotacion, listarAnotaciones } from "@/lib/school";
import {
  esCategoriaAnotacion,
  type CategoriaAnotacion,
} from "@/lib/school-schema";

/**
 * Anotaciones positivas y negativas por tarjeta NFC.
 *
 * GET  /api/anotaciones?cardId=VM-G0002&tipo=positiva&curso=2Â° Medio
 * POST /api/anotaciones  { cardId, tipo, categoria, comentario, curso?, fecha?, hora? }
 *
 * El profesor toca la tarjeta del alumno y anota en el momento, sin papeleo.
 */

function sinSesion() {
  return NextResponse.json(
    { error: "sin_sesion", mensaje: "Abre VibeMatch con tu tarjeta para continuar." },
    { status: 401 },
  );
}

function fechaLocal(): string {
  const ahora = new Date();
  const offset = ahora.getTimezoneOffset();
  return new Date(ahora.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function horaLocal(): string {
  const ahora = new Date();
  return `${String(ahora.getHours()).padStart(2, "0")}:${String(
    ahora.getMinutes(),
  ).padStart(2, "0")}`;
}

export async function GET(request: Request) {
  const acceso = await leerSesion();
  if (!acceso || acceso.card.kind === "public") return sinSesion();

  const url = new URL(request.url);
  const cardId = url.searchParams.get("cardId") ?? undefined;
  const curso = url.searchParams.get("curso") ?? undefined;
  const tipoParam = url.searchParams.get("tipo");
  const tipo =
    tipoParam === "positiva" || tipoParam === "negativa" ? tipoParam : undefined;

  return NextResponse.json(
    { anotaciones: listarAnotaciones({ cardId, curso, tipo }) },
    { headers: { "cache-control": "no-store" } },
  );
}

export async function POST(request: Request) {
  const acceso = await leerSesion();
  if (!acceso || acceso.card.kind === "public") return sinSesion();

  let cuerpo: Record<string, unknown>;
  try {
    cuerpo = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "json_invalido", mensaje: "El cuerpo no es JSON vÃ¡lido." },
      { status: 400 },
    );
  }

  const cardId = String(cuerpo.cardId ?? acceso.card.id);
  const tipoRaw = String(cuerpo.tipo ?? "");
  const categoriaRaw = String(cuerpo.categoria ?? "Otro");
  const comentario = String(cuerpo.comentario ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 300);
  const curso = String(cuerpo.curso ?? acceso.card.level ?? "Sin asignar");
  const fecha = String(cuerpo.fecha ?? fechaLocal());
  const hora = String(cuerpo.hora ?? horaLocal());

  if (tipoRaw !== "positiva" && tipoRaw !== "negativa") {
    return NextResponse.json(
      { error: "tipo_invalido", mensaje: "El tipo debe ser positiva o negativa." },
      { status: 400 },
    );
  }

  if (!esCategoriaAnotacion(categoriaRaw)) {
    return NextResponse.json(
      { error: "categoria_invalida", mensaje: "La categorÃ­a no es vÃ¡lida." },
      { status: 400 },
    );
  }

  if (comentario.length < 3) {
    return NextResponse.json(
      { error: "comentario_corto", mensaje: "Escribe un comentario de al menos 3 caracteres." },
      { status: 400 },
    );
  }

  const { buscarTarjetaPorToken, listarTarjetas } = await import("@/lib/cards");
  const tarjetaPorToken = buscarTarjetaPorToken(cardId);
  const tarjeta = tarjetaPorToken ?? listarTarjetas().find((t) => t.id === cardId) ?? null;
  const tarjetaId = tarjeta?.id ?? acceso.card.id;

  const anotacion = guardarAnotacion({
    cardId: tarjetaId,
    curso,
    tipo: tipoRaw,
    categoria: categoriaRaw as CategoriaAnotacion,
    comentario,
    fecha,
    hora,
    registradoPor: acceso.card.id,
  });

  return NextResponse.json(
    { anotacion },
    { headers: { "cache-control": "no-store" } },
  );
}
