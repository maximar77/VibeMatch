import { NextResponse } from "next/server";
import { buscarTarjetaPorToken, listarTarjetas } from "@/lib/cards";
import { leerPerfil } from "@/lib/profiles";
import { guardarAnotacion, listarAnotaciones } from "@/lib/school";
import {
  esCategoriaAnotacion,
  type CategoriaAnotacion,
} from "@/lib/school-schema";
import { fechaEnZona, horaEnZona } from "@/lib/fecha";
import { leerProfesorSesion } from "@/lib/teachers";

/**
 * Anotaciones positivas y negativas para la app docente.
 *
 * GET  /api/anotaciones?cardId=VM-G0002&tipo=positiva
 * POST /api/anotaciones  { cardId, tipo, categoria, comentario, fecha?, hora? }
 *
 * Solo docentes autenticados. El curso y el autor se toman de la sesión.
 */

function sinSesionProfesor() {
  return NextResponse.json(
    {
      error: "sin_sesion_profesor",
      mensaje: "Inicia sesión en el panel docente para continuar.",
    },
    { status: 401 },
  );
}

export async function GET(request: Request) {
  const profesor = await leerProfesorSesion();
  if (!profesor) return sinSesionProfesor();

  const url = new URL(request.url);
  const cardId = url.searchParams.get("cardId") ?? undefined;
  const tipoParam = url.searchParams.get("tipo");
  const tipo =
    tipoParam === "positiva" || tipoParam === "negativa" ? tipoParam : undefined;

  return NextResponse.json(
    {
      curso: profesor.curso,
      anotaciones: listarAnotaciones({
        cardId,
        curso: profesor.curso,
        tipo,
      }),
    },
    { headers: { "cache-control": "no-store" } },
  );
}

export async function POST(request: Request) {
  const profesor = await leerProfesorSesion();
  if (!profesor) return sinSesionProfesor();

  let cuerpo: Record<string, unknown>;
  try {
    cuerpo = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "json_invalido", mensaje: "El cuerpo no es JSON válido." },
      { status: 400 },
    );
  }

  const cardIdRaw = String(cuerpo.cardId ?? "").trim();
  const tipoRaw = String(cuerpo.tipo ?? "");
  const categoriaRaw = String(cuerpo.categoria ?? "Otro");
  const comentario = String(cuerpo.comentario ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 300);
  const fecha = String(cuerpo.fecha ?? fechaEnZona());
  const hora = String(cuerpo.hora ?? horaEnZona());

  if (!cardIdRaw) {
    return NextResponse.json(
      { error: "tarjeta_requerida", mensaje: "Falta la tarjeta del alumno." },
      { status: 400 },
    );
  }

  if (tipoRaw !== "positiva" && tipoRaw !== "negativa") {
    return NextResponse.json(
      { error: "tipo_invalido", mensaje: "El tipo debe ser positiva o negativa." },
      { status: 400 },
    );
  }

  if (!esCategoriaAnotacion(categoriaRaw)) {
    return NextResponse.json(
      { error: "categoria_invalida", mensaje: "La categoría no es válida." },
      { status: 400 },
    );
  }

  if (comentario.length < 3) {
    return NextResponse.json(
      {
        error: "comentario_corto",
        mensaje: "Escribe un comentario de al menos 3 caracteres.",
      },
      { status: 400 },
    );
  }

  const tarjeta =
    buscarTarjetaPorToken(cardIdRaw) ??
    listarTarjetas().find((item) => item.id === cardIdRaw) ??
    null;

  if (!tarjeta) {
    return NextResponse.json(
      { error: "tarjeta_invalida", mensaje: "Esa tarjeta no existe o está revocada." },
      { status: 404 },
    );
  }

  const perfil = leerPerfil(tarjeta.id);
  const anotacion = guardarAnotacion({
    cardId: tarjeta.id,
    nombre:
      perfil?.displayName ??
      tarjeta.fullName ??
      tarjeta.holder ??
      "Alumno",
    numeroLista: tarjeta.listNumber ?? null,
    curso: profesor.curso,
    tipo: tipoRaw,
    categoria: categoriaRaw as CategoriaAnotacion,
    comentario,
    fecha,
    hora,
    registradoPor: profesor.id,
  });

  return NextResponse.json(
    { anotacion },
    { headers: { "cache-control": "no-store" } },
  );
}
