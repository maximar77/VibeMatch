import { NextResponse } from "next/server";
import { leerSesion, buscarTarjetaPorToken } from "@/lib/cards";
import { guardarAsistencia, listarAsistencia } from "@/lib/school";
import { esEstadoAsistencia, type EstadoAsistencia } from "@/lib/school-schema";

/**
 * Asistencia (pasar lista) por tarjeta NFC.
 *
 * GET  /api/asistencia?fecha=AAAA-MM-DD&curso=2Â° Medio
 * POST /api/asistencia  { cardId, curso, estado, fecha?, hora?, registradoPor? }
 *
 * El registro se identifica por la tarjeta leÃ­da: no se teclea ningÃºn nombre.
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
  const fecha = url.searchParams.get("fecha") ?? fechaLocal();
  const curso = url.searchParams.get("curso") ?? undefined;

  return NextResponse.json(
    { fecha, registros: listarAsistencia({ fecha, curso }) },
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
  const estadoRaw = String(cuerpo.estado ?? "presente");
  const curso = String(cuerpo.curso ?? acceso.card.level ?? "Sin asignar");
  const fecha = String(cuerpo.fecha ?? fechaLocal());
  const hora = String(cuerpo.hora ?? horaLocal());
  const registradoPor = String(cuerpo.registradoPor ?? acceso.card.id);

  if (!esEstadoAsistencia(estadoRaw)) {
    return NextResponse.json(
      { error: "estado_invalido", mensaje: "El estado debe ser presente, atrasado o ausente." },
      { status: 400 },
    );
  }

  // Obtener nombre y número de lista de la tarjeta si está disponible.
  const tarjetaPorToken = buscarTarjetaPorToken(cardId);
  const tarjeta = tarjetaPorToken ?? 
    (await import("@/lib/cards")).listarTarjetas().find((t) => t.id === cardId) ?? 
    null;
  
  const tarjetaId = tarjeta?.id ?? acceso.card.id;
  const nombre = tarjeta?.fullName ?? tarjeta?.holder ?? acceso.card.holder ?? "Sin nombre";
  const numeroLista = tarjeta?.listNumber ?? null;

  const registro = guardarAsistencia({
    cardId: tarjetaId,
    curso,
    nombre,
    numeroLista,
    fecha,
    hora,
    estado: estadoRaw as EstadoAsistencia,
    registradoPor,
    metodo: "nfc",
  });

  return NextResponse.json(
    { registro },
    { headers: { "cache-control": "no-store" } },
  );
}
