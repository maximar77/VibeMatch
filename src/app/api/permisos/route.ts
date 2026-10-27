import { NextResponse } from "next/server";
import { buscarTarjetaPorToken, listarTarjetas } from "@/lib/cards";
import { leerPerfil } from "@/lib/profiles";
import { guardarPermiso, listarPermisos } from "@/lib/school";
import {
  LIMITE_BANO_MINUTOS,
  LIMITE_BANO_POR_DIA,
  nuevoId,
  type PermisoBano,
} from "@/lib/school-schema";
import { fechaEnZona, horaEnZona } from "@/lib/fecha";
import { leerProfesorSesion } from "@/lib/teachers";

/**
 * Permisos de baño para la app docente.
 *
 * GET  /api/permisos?fecha=AAAA-MM-DD&abiertos=1
 * POST /api/permisos  { cardId, accion: "salida" | "regreso", fecha?, hora? }
 *
 * Solo docentes autenticados. El curso y el autor se toman de la sesión para
 * evitar que un docente lea o escriba permisos de otro curso.
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

function aMinutos(hora: string): number {
  const [h, m] = hora.split(":").map((valor) => Number(valor));
  return (h || 0) * 60 + (m || 0);
}

export async function GET(request: Request) {
  const profesor = await leerProfesorSesion();
  if (!profesor) return sinSesionProfesor();

  const url = new URL(request.url);
  const fecha = url.searchParams.get("fecha") ?? fechaEnZona();
  const soloAbiertos = url.searchParams.get("abiertos") === "1";

  return NextResponse.json(
    {
      fecha,
      curso: profesor.curso,
      limiteMinutos: LIMITE_BANO_MINUTOS,
      limitePorDia: LIMITE_BANO_POR_DIA,
      permisos: listarPermisos({
        fecha,
        curso: profesor.curso,
        abiertos: soloAbiertos,
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
  const accion = String(cuerpo.accion ?? "salida");
  const fecha = String(cuerpo.fecha ?? fechaEnZona());
  const hora = String(cuerpo.hora ?? horaEnZona());

  if (!cardIdRaw) {
    return NextResponse.json(
      { error: "tarjeta_requerida", mensaje: "Falta la tarjeta del alumno." },
      { status: 400 },
    );
  }

  if (accion !== "salida" && accion !== "regreso") {
    return NextResponse.json(
      { error: "accion_invalida", mensaje: "La acción debe ser salida o regreso." },
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

  const activos = listarPermisos({
    cardId: tarjeta.id,
    fecha,
    abiertos: true,
  });
  const abierto = activos[0];

  if (accion === "salida") {
    if (abierto) {
      return NextResponse.json(
        {
          error: "permiso_ya_abierto",
          mensaje: "Ya hay un permiso de baño en curso para esta tarjeta.",
          permiso: abierto,
        },
        { status: 409 },
      );
    }

    const permisosDelDia = listarPermisos({ cardId: tarjeta.id, fecha });
    const permiso: PermisoBano = {
      id: nuevoId("bano"),
      cardId: tarjeta.id,
      nombre,
      numeroLista: tarjeta.listNumber ?? null,
      curso: profesor.curso,
      fecha,
      inicio: hora,
      fin: null,
      duracionMin: null,
      excedeLimite: permisosDelDia.length >= LIMITE_BANO_POR_DIA,
      registradoPor: profesor.id,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(
      { permiso: guardarPermiso(permiso) },
      { headers: { "cache-control": "no-store" } },
    );
  }

  if (!abierto) {
    return NextResponse.json(
      {
        error: "sin_permiso_abierto",
        mensaje: "No hay un permiso de baño en curso para esta tarjeta.",
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
