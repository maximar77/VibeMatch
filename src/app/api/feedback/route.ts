import { NextResponse } from "next/server";
import { guardarFeedback } from "@/lib/feedback";

const MAX = 1000;

function texto(v: unknown, max: number): string {
  return String(v ?? "").trim().slice(0, max);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const mensaje = texto(body.mensaje, MAX);
    const tipo = texto(body.tipo, 16) as "bug" | "sugerencia" | "otro";
    if (!mensaje) {
      return NextResponse.json({ error: "Escribe un mensaje." }, { status: 400 });
    }

    guardarFeedback({
      tipo: tipo === "bug" || tipo === "sugerencia" ? tipo : "otro",
      mensaje,
      email: texto(body.email, 120) || null,
      url: texto(body.url, 512) || null,
      userAgent: texto(body.userAgent, 512) || null,
      plataforma: texto(body.plataforma, 64) || null,
      cardId: texto(body.cardId, 64) || null,
      dispositivo: texto(body.dispositivo, 128) || null,
      modelo: texto(body.modelo, 128) || null,
      sistema: texto(body.sistema, 128) || null,
      versionApp: texto(body.versionApp, 32) || null,
    });

    return NextResponse.json({ ok: true }, { headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "No se pudo enviar el feedback." }, { status: 400 });
  }
}
