"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  crearSesion,
  leerSesion,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  validarToken,
} from "@/lib/cards";
import { guardarPerfil as persistirPerfil } from "@/lib/profiles";
import {
  esInteres,
  esVibe,
  type Interest,
  type ProfileFormState,
  type Vibe,
} from "@/lib/profile-schema";

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
    // En producción con HTTPS: VIBEMATCH_COOKIE_SECURE=1
    secure: process.env.VIBEMATCH_COOKIE_SECURE === "1",
  };
}

export async function entrarAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const acceso = validarToken(token);

  if (!acceso) {
    redirect("/?acceso=invalido");
  }

  // El token genérico solo abre la landing pública; nunca crea una sesión.
  if (acceso.card.kind === "public") {
    redirect(`/a/${encodeURIComponent(token)}`);
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, crearSesion(acceso.card.id), cookieOptions());
  redirect("/app");
}

export async function guardarPerfilAction(
  _previousState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const acceso = await leerSesion();

  if (!acceso || acceso.card.kind === "public") {
    redirect("/");
  }

  const displayName = String(formData.get("displayName") ?? "")
    .trim()
    .replace(/\s+/g, " ");
  const pronouns = String(formData.get("pronouns") ?? "");
  const level = String(formData.get("level") ?? "").trim();
  const vibeRaw = String(formData.get("vibe") ?? "");
  const bio = String(formData.get("bio") ?? "").trim().replace(/\s+/g, " ");
  const consent = formData.get("consent");
  const interests = Array.from(
    new Set(formData.getAll("interests").map((value) => String(value)).filter(esInteres)),
  ) as Interest[];

  if (displayName.length < 2 || displayName.length > 32) {
    return { error: "Escribe un nombre preferido de entre 2 y 32 caracteres." };
  }

  if (pronouns.length > 24) {
    return { error: "El pronombre elegido no es válido." };
  }

  if (level.length > 32) {
    return { error: "El curso elegido no es válido." };
  }

  if (!esVibe(vibeRaw)) {
    return { error: "Elige cómo quieres empezar tu vibe." };
  }

  if (interests.length < 1) {
    return { error: "Elige al menos un interés para encontrar tu zona." };
  }

  if (interests.length > 6) {
    return { error: "Elige hasta 6 intereses para que tu perfil sea más claro." };
  }

  if (bio.length > 180) {
    return { error: "La descripción puede tener hasta 180 caracteres." };
  }

  if (consent !== "on") {
    return { error: "Necesitamos tu autorización para guardar el perfil." };
  }

  persistirPerfil({
    cardId: acceso.card.id,
    displayName,
    pronouns,
    level: level || acceso.card.level || "",
    vibe: vibeRaw as Vibe,
    interests,
    bio,
  });

  revalidatePath("/app");
  revalidatePath("/app/perfil");
  revalidatePath("/app/instalar");
  redirect("/app?perfil=guardado");
}

export async function salirAction() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/");
}
