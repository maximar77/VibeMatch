import { NextResponse } from "next/server";
import { leerSesion } from "@/lib/cards";
import { leerPerfil } from "@/lib/profiles";
import { listarMensajes, guardarMensaje } from "@/lib/chat";
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
  const mensajes = listarMensajes(canal);

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
    usuarioNombre: acceso.card.holder ?? "Alumno",
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