import { NextResponse } from "next/server";
import { buscarTarjetaPorToken, listarTarjetas } from "@/lib/cards";
import { leerPerfil } from "@/lib/profiles";
import { crearEventoSala, listarEventos } from "@/lib/school";
import { esTipoEventoSala } from "@/lib/school-schema";
import { fechaEnZona, horaEnZona } from "@/lib/fecha";
import { leerProfesorSesion } from "@/lib/teachers";

/**
 * Movimientos de sala para la app docente.
 *
 * GET  /api/eventos?fecha=AAAA-MM-DD
 * POST /api/eventos  { cardId, tipo: "salida" | "entrada" | "retiro", detalle?, fecha?, hora? }
 *
 * Solo docentes autenticados. El curso y el autor salen de la sesión para que
 * un docente no pueda leer ni escribir movimientos de otro curso.
 */

const FECHA_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const HORA_PATTERN = /^\d{2}:\d{2}$/;

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
  const fecha = url.searchParams.get("fecha")?.trim() || fechaEnZona();

  if (!FECHA_PATTERN.test(fecha)) {
    return NextResponse.json(
      { error: "fecha_invalida", mensaje: "La fecha debe tener formato AAAA-MM-DD." },
      { status: 400 },
    );
  }

  return NextResponse.json(
    {
      fecha,
      curso: profesor.curso,
      eventos: listarEventos({ fecha, curso: profesor.curso }),
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
  const tipoRaw = String(cuerpo.tipo ?? "").trim();
  const detalle = String(cuerpo.detalle ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 200);
  const fecha = String(cuerpo.fecha ?? "").trim() || fechaEnZona();
  const hora = String(cuerpo.hora ?? "").trim() || horaEnZona();

  if (!cardIdRaw) {
    return NextResponse.json(
      { error: "tarjeta_requerida", mensaje: "Falta la tarjeta del alumno." },
      { status: 400 },
    );
  }

  if (!esTipoEventoSala(tipoRaw)) {
    return NextResponse.json(
      {
        error: "tipo_invalido",
        mensaje: "El tipo debe ser salida, entrada o retiro.",
      },
      { status: 400 },
    );
  }

  if (!FECHA_PATTERN.test(fecha)) {
    return NextResponse.json(
      { error: "fecha_invalida", mensaje: "La fecha debe tener formato AAAA-MM-DD." },
      { status: 400 },
    );
  }

  if (!HORA_PATTERN.test(hora)) {
    return NextResponse.json(
      { error: "hora_invalida", mensaje: "La hora debe tener formato HH:MM." },
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
  const nombre =
    perfil?.displayName ??
    tarjeta.fullName ??
    tarjeta.holder ??
    "Alumno";

  const resultado = crearEventoSala({
    cardId: tarjeta.id,
    nombre,
    numeroLista: tarjeta.listNumber ?? perfil?.numeroLista ?? null,
    curso: profesor.curso,
    fecha,
    hora,
    tipo: tipoRaw,
    detalle,
    registradoPor: profesor.id,
  });

  if (!resultado.ok) {
    const estado =
      resultado.error === "detalle_requerido" ? 400 : 409;
    return NextResponse.json(
      { error: resultado.error, mensaje: resultado.mensaje },
      { status: estado },
    );
  }

  return NextResponse.json(
    { evento: resultado.evento },
    { headers: { "cache-control": "no-store" } },
  );
}
