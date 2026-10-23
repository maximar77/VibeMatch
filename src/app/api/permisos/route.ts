import { NextResponse } from "next/server";
import { leerSesion } from "@/lib/cards";
import { guardarPermiso, listarPermisos } from "@/lib/school";
import {
  LIMITE_BANO_MINUTOS,
  LIMITE_BANO_POR_DIA,
  nuevoId,
  type PermisoBano,
} from "@/lib/school-schema";

/**
 * Permisos de baÃ±o por tarjeta NFC.
 *
 * GET  /api/permisos?fecha=AAAA-MM-DD&abiertos=1
 * POST /api/permisos  { cardId, accion: "salida" | "regreso", curso?, fecha?, hora? }
 *
 * El primer POST abre el permiso (salida) y el segundo lo cierra (regreso),
 * calculando la duraciÃ³n y marcando alerta si supera el lÃ­mite.
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

function aMinutos(hora: string): number {
  const [h, m] = hora.split(":").map((valor) => Number(valor));
  return (h || 0) * 60 + (m || 0);
}

export async function GET(request: Request) {
  const acceso = await leerSesion();
  if (!acceso || acceso.card.kind === "public") return sinSesion();

  const url = new URL(request.url);
  const fecha = url.searchParams.get("fecha") ?? fechaLocal();
  const soloAbiertos = url.searchParams.get("abiertos") === "1";

  return NextResponse.json(
    {
      fecha,
      limiteMinutos: LIMITE_BANO_MINUTOS,
      limitePorDia: LIMITE_BANO_POR_DIA,
      permisos: listarPermisos({ fecha, abiertos: soloAbiertos }),
    },
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
  const accion = String(cuerpo.accion ?? "salida");
  const curso = String(cuerpo.curso ?? acceso.card.level ?? "Sin asignar");
  const fecha = String(cuerpo.fecha ?? fechaLocal());
  const hora = String(cuerpo.hora ?? horaLocal());
  const registradoPor = String(cuerpo.registradoPor ?? acceso.card.id);

  const activos = listarPermisos({ cardId, fecha, abiertos: true });
  const abierto = activos[0];

  if (accion === "salida") {
    if (abierto) {
      return NextResponse.json(
        {
          error: "permiso_ya_abierto",
          mensaje: "Ya hay un permiso de baÃ±o en curso para esta tarjeta.",
          permiso: abierto,
        },
        { status: 409 },
      );
    }

    const permisosDelDia = listarPermisos({ cardId, fecha });
    const permiso: PermisoBano = {
      id: nuevoId("bano"),
      cardId,
      curso,
      fecha,
      inicio: hora,
      fin: null,
      duracionMin: null,
      excedeLimite: permisosDelDia.length >= LIMITE_BANO_POR_DIA,
      registradoPor,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(
      { permiso: guardarPermiso(permiso) },
      { headers: { "cache-control": "no-store" } },
    );
  }

  // accion === "regreso"
  if (!abierto) {
    return NextResponse.json(
      {
        error: "sin_permiso_abierto",
        mensaje: "No hay un permiso de baÃ±o en curso para esta tarjeta.",
      },
      { status: 409 },
    );
  }

  const duracion = Math.max(0, aMinutos(hora) - aMinutos(abierto.inicio));
  const cerrado: PermisoBano = {
    ...abierto,
    fin: hora,
    duracionMin: duracion,
    excedeLimite: abierto.excedeLimite || duracion > LIMITE_BANO_MINUTOS,
  };

  return NextResponse.json(
    { permiso: guardarPermiso(cerrado) },
    { headers: { "cache-control": "no-store" } },
  );
}
