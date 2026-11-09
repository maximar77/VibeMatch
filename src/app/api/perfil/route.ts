import { NextResponse } from "next/server";
import {
  actualizarDatosTarjetaPorId,
  leerSesion,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/cards";
import { guardarPerfil, leerPerfil } from "@/lib/profiles";
import {
  esInteres,
  esVibe,
  normalizarNumeroLista,
  type Interest,
  type Perfil,
  type Vibe,
} from "@/lib/profile-schema";

/**
 * API JSON del perfil para la app Android (Capacitor) y futuros clientes.
 *
 * Usa la misma cookie de sesiÃ³n que la web: el WebView de la app la conserva,
 * por lo que la app puede leer y sincronizar el perfil sin otro login.
 *
 * GET  /api/perfil  -> perfil guardado + datos de la tarjeta
 * PUT  /api/perfil  -> guarda/actualiza el perfil (sincronizaciÃ³n offline)
 */

type PerfilPayload = {
  displayName?: unknown;
  pronouns?: unknown;
  level?: unknown;
  numeroLista?: unknown;
  vibe?: unknown;
  interests?: unknown;
  bio?: unknown;
  updatedAt?: unknown;
};

function normalizarTexto(value: unknown, max: number): string {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, max);
}

function respuestaSinSesion() {
  return NextResponse.json(
    { error: "sin_sesion", mensaje: "Abre VibeMatch con tu tarjeta para continuar." },
    { status: 401 },
  );
}

export async function GET() {
  const acceso = await leerSesion();

  if (!acceso || acceso.card.kind === "public") {
    return respuestaSinSesion();
  }

  const perfil = leerPerfil(acceso.card.id);

  return NextResponse.json(
    {
      card: {
        id: acceso.card.id,
        level: acceso.card.level ?? "",
        course: acceso.card.course ?? acceso.card.level ?? "",
        holder: acceso.card.holder ?? "",
        numeroLista: acceso.card.listNumber ?? perfil?.numeroLista ?? null,
      },
      school: acceso.school,
      perfil,
      sesionExpiraEnSegundos: SESSION_MAX_AGE_SECONDS,
    },
    { headers: { "cache-control": "no-store" } },
  );
}

export async function PUT(request: Request) {
  const acceso = await leerSesion();

  if (!acceso || acceso.card.kind === "public") {
    return respuestaSinSesion();
  }

  let payload: PerfilPayload;
  try {
    payload = (await request.json()) as PerfilPayload;
  } catch {
    return NextResponse.json(
      { error: "json_invalido", mensaje: "El cuerpo de la peticiÃ³n no es JSON vÃ¡lido." },
      { status: 400 },
    );
  }

  const displayName = normalizarTexto(payload.displayName, 32);
  const pronouns = normalizarTexto(payload.pronouns, 24);
  const level = normalizarTexto(payload.level, 32);
  const bio = normalizarTexto(payload.bio, 180);
  const vibeRaw = String(payload.vibe ?? "");
  const numeroListaRaw =
    payload.numeroLista === null || payload.numeroLista === undefined
      ? ""
      : String(payload.numeroLista).trim();
  const numeroLista = normalizarNumeroLista(numeroListaRaw);
  const interests = Array.from(
    new Set(
      (Array.isArray(payload.interests) ? payload.interests : [])
        .map((value) => String(value))
        .filter(esInteres),
    ),
  ) as Interest[];

  if (displayName.length < 2) {
    return NextResponse.json(
      { error: "nombre_invalido", mensaje: "El nombre debe tener al menos 2 caracteres." },
      { status: 400 },
    );
  }

  if (!esVibe(vibeRaw)) {
    return NextResponse.json(
      { error: "vibe_invalido", mensaje: "Elige una vibe vÃ¡lida." },
      { status: 400 },
    );
  }

  if (interests.length < 1 || interests.length > 6) {
    return NextResponse.json(
      { error: "intereses_invalidos", mensaje: "Elige entre 1 y 6 intereses." },
      { status: 400 },
    );
  }

  if (numeroListaRaw && numeroLista === null) {
    return NextResponse.json(
      {
        error: "numero_lista_invalido",
        mensaje: "El número de lista debe ser un entero entre 1 y 999.",
      },
      { status: 400 },
    );
  }

  const perfilAnterior = leerPerfil(acceso.card.id);
  const numeroListaFinal =
    numeroLista ?? perfilAnterior?.numeroLista ?? null;

  const guardado: Perfil = guardarPerfil({
    cardId: acceso.card.id,
    displayName,
    pronouns,
    level: level || acceso.card.level || "",
    numeroLista: numeroListaFinal,
    vibe: vibeRaw as Vibe,
    interests,
    bio,
  });

  if (numeroListaFinal !== null) {
    actualizarDatosTarjetaPorId(acceso.card.id, { nro: numeroListaFinal });
  }

  return NextResponse.json(
    { perfil: guardado, sincronizadoEn: new Date().toISOString() },
    { headers: { "cache-control": "no-store" } },
  );
}
