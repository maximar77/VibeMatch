import { NextResponse } from "next/server";
import { leerSesion } from "@/lib/cards";
import { guardarMensaje } from "@/lib/chat";
import { leerPerfil } from "@/lib/profiles";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ canal: string }> }
) {
  const acceso = await leerSesion();
  if (!acceso || acceso.card.kind === "public") {
    return NextResponse.json({ error: "sin_sesion" }, { status: 401 });
  }

  const { canal } = await params;
  // Validar que el canal tiene el formato privado_idAmigo
  if (!canal.startsWith("privado_")) {
    return NextResponse.json({ error: "canal_invalido" }, { status: 404 });
  }

  let cuerpo: Record<string, unknown>;
  try {
    cuerpo = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "json_invalido" }, { status: 400 });
  }

  const { mensaje, para } = cuerpo;
  if (!mensaje || !para) {
    return NextResponse.json({ error: "faltan_campos" }, { status: 400 });
  }

  const canalId = `privado_${para}`;

  const perfil = leerPerfil(acceso.card.id);

  const mensajeGuardado = guardarMensaje({
    canal: canalId,
    usuarioId: acceso.card.id,
    usuarioNombre:
      perfil?.displayName ??
      acceso.card.fullName ??
      acceso.card.holder ??
      "Alumno",
    usuarioVibe: perfil?.vibe ?? "conversar",
    texto: String(mensaje),
    timestamp: new Date().toISOString(),
    editado: false,
    filtrado: false, // No aplicar filtro de insultos en chat privado
  });

  return NextResponse.json(
    { ok: true, mensajeGuardado },
    { headers: { "cache-control": "no-store" } }
  );
}