import { NextResponse } from "next/server";
import { buscarTarjetaPorToken, listarTarjetas } from "@/lib/cards";
import { guardarAsistencia, listarAsistencia } from "@/lib/school";
import { esEstadoAsistencia, type EstadoAsistencia } from "@/lib/school-schema";
import { fechaEnZona, horaEnZona } from "@/lib/fecha";
import { leerProfesorSesion } from "@/lib/teachers";

/**
 * Asistencia del curso para la app docente.
 *
 * GET  /api/asistencia?fecha=AAAA-MM-DD
 * POST /api/asistencia  { cardId, estado, fecha?, hora? }
 *
 * Solo docentes autenticados. El curso y el autor se toman de la sesión para
 * que un docente no pueda leer ni escribir registros de otro curso.
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
  const fecha = url.searchParams.get("fecha") ?? fechaEnZona();

  return NextResponse.json(
    {
      fecha,
      curso: profesor.curso,
      registros: listarAsistencia({ fecha, curso: profesor.curso }),
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
  const estadoRaw = String(cuerpo.estado ?? "presente");
  const fecha = String(cuerpo.fecha ?? fechaEnZona());
  const hora = String(cuerpo.hora ?? horaEnZona());

  if (!cardIdRaw) {
    return NextResponse.json(
      { error: "tarjeta_requerida", mensaje: "Falta la tarjeta del alumno." },
      { status: 400 },
    );
  }

  if (!esEstadoAsistencia(estadoRaw)) {
    return NextResponse.json(
      {
        error: "estado_invalido",
        mensaje: "El estado debe ser presente, atrasado o ausente.",
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

  const registro = guardarAsistencia({
    cardId: tarjeta.id,
    curso: profesor.curso,
    nombre: tarjeta.fullName ?? tarjeta.holder ?? "Alumno",
    numeroLista: tarjeta.listNumber ?? null,
    fecha,
    hora,
    estado: estadoRaw as EstadoAsistencia,
    registradoPor: profesor.id,
    metodo: "nfc",
  });

  return NextResponse.json(
    { registro },
    { headers: { "cache-control": "no-store" } },
  );
}
