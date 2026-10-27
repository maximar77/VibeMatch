import { NextResponse } from "next/server";
import { leerSesion } from "@/lib/cards";
import { leerPerfil } from "@/lib/profiles";
import {
  esCanalChat,
  guardarMensaje,
  listarMensajes,
} from "@/lib/chat";
import { validarMensaje, evaluarMensaje } from "@/lib/moderacion";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ canal: string }> }
) {
  const acceso = await leerSesion();
  if (!acceso || acceso.card.kind === "public") {
    return NextResponse.json({ error: "sin_sesion" }, { status: 401 });
  }

  const { canal } = await params;
  if (!esCanalChat(canal)) {
    return NextResponse.json({ error: "canal_invalido" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const vibeFilter = searchParams.get("vibe");

  let mensajes = listarMensajes(canal);

  // Filtrar por vibe si se especifica
  if (vibeFilter) {
    mensajes = mensajes.filter((m) => m.usuarioVibe === vibeFilter);
  }

  return NextResponse.json({ canal, mensajes }, { headers: { "cache-control": "no-store" } });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ canal: string }> }
) {
  const acceso = await leerSesion();
  if (!acceso || acceso.card.kind === "public") {
    return NextResponse.json({ error: "sin_sesion" }, { status: 401 });
  }

  const { canal } = await params;
  if (!esCanalChat(canal)) {
    return NextResponse.json({ error: "canal_invalido" }, { status: 404 });
  }

  let cuerpo: Record<string, unknown>;
  try {
    cuerpo = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "json_invalido" }, { status: 400 });
  }

  const texto = String(cuerpo.texto ?? "").trim();
  const validacion = validarMensaje(texto);
  if (!validacion.valido) {
    return NextResponse.json({ error: validacion.error }, { status: 400 });
  }

  const evaluacion = evaluarMensaje(texto);
  const perfil = leerPerfil(acceso.card.id);
  const vibe = perfil?.vibe ?? "conversar";

  const mensaje = guardarMensaje({
    canal,
    usuarioId: acceso.card.id,
    usuarioNombre:
      perfil?.displayName ??
      acceso.card.fullName ??
      acceso.card.holder ??
      "Alumno",
    usuarioVibe: vibe,
    texto: evaluacion.textoFiltrado,
    timestamp: new Date().toISOString(),
    editado: false,
    filtrado: !evaluacion.apto,
  });

  return NextResponse.json(
    { mensaje, filtrado: !evaluacion.apto, motivo: evaluacion.motivo, vibe },
    { headers: { "cache-control": "no-store" } },
  );
}