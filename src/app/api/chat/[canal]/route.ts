import { NextResponse } from "next/server";
import { leerSesion } from "@/lib/cards";
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
  const mensaje = guardarMensaje({
    canal,
    usuarioId: acceso.card.id,
    usuarioName: acceso.card.holder ?? "Alumno",
    usuarioVibe: undefined, // Se completa desde el perfil si está disponible
    texto: evaluacion.textoFiltrado,
    timestamp: new Date().toISOString(),
    editado: false,
    filtrado: !evaluacion.apto,
  });

  return NextResponse.json(
    { mensaje, filtrado: !evaluacion.apto, motivo: evaluacion.motivo },
    { headers: { "cache-control": "no-store" } },
  );
}