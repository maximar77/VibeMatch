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
import {
  estadoSeguridad,
  establecerClaveEstudiante,
  quitarClaveEstudiante,
  tieneClaveEstudiante,
  verificarClaveEstudiante,
} from "@/lib/student-security";

function cookieOptions() {
  // Detrás de HTTPS (por ejemplo Cloudflare Tunnel) la cookie debe ir marcada
  // como Secure. VIBEMATCH_COOKIE_SECURE=1 fuerza esto; secure:false queda solo
  // para pruebas en http://localhost o en la red local.
  const secure =
    process.env.VIBEMATCH_COOKIE_SECURE === "1" ||
    (process.env.VIBEMATCH_COOKIE_SECURE !== "0" &&
      process.env.VIBEMATCH_PUBLIC_URL?.startsWith("https://") === true);

  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
    secure,
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

  const password = String(formData.get("password") ?? "");
  if (tieneClaveEstudiante(acceso.card.id) && !verificarClaveEstudiante(acceso.card.id, password)) {
    redirect(`/a/${encodeURIComponent(token)}?error=clave`);
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

export type SecurityFormState = {
  error?: string;
  ok?: boolean;
  mensaje?: string;
};

function validarClave(password: string): string | null {
  if (password.length < 6) return "La clave debe tener al menos 6 caracteres.";
  if (password.length > 64) return "La clave puede tener hasta 64 caracteres.";
  return null;
}

/**
 * Crea o cambia la clave opcional de la cuenta. Si ya existe una clave, se
 * exige la actual para evitar que una sesión abierta permita cambiarla.
 */
export async function guardarClaveAction(
  _previousState: SecurityFormState,
  formData: FormData,
): Promise<SecurityFormState> {
  const acceso = await leerSesion();
  if (!acceso || acceso.card.kind === "public") {
    return { error: "La sesión terminó. Vuelve a entrar con tu tarjeta." };
  }

  const actual = String(formData.get("actual") ?? "");
  const nueva = String(formData.get("nueva") ?? "");
  const confirmar = String(formData.get("confirmar") ?? "");
  const errorClave = validarClave(nueva);

  if (errorClave) return { error: errorClave };
  if (nueva !== confirmar) return { error: "Las claves no coinciden." };

  const estado = estadoSeguridad(acceso.card.id);
  if (estado.protegida && !verificarClaveEstudiante(acceso.card.id, actual)) {
    return { error: "La clave actual no es correcta." };
  }

  if (nueva.toLowerCase() === acceso.card.fullName?.toLowerCase()) {
    return { error: "No uses tu nombre como clave." };
  }

  establecerClaveEstudiante(acceso.card.id, nueva);
  revalidatePath("/app");
  revalidatePath("/app/seguridad");
  return {
    ok: true,
    mensaje: estado.protegida ? "Clave actualizada." : "Clave creada. Ahora tu cuenta tiene una capa extra de seguridad.",
  };
}

export async function quitarClaveAction(
  _previousState: SecurityFormState,
  formData: FormData,
): Promise<SecurityFormState> {
  const acceso = await leerSesion();
  if (!acceso || acceso.card.kind === "public") {
    return { error: "La sesión terminó. Vuelve a entrar con tu tarjeta." };
  }

  const actual = String(formData.get("actual") ?? "");
  const estado = estadoSeguridad(acceso.card.id);
  if (!estado.protegida) return { error: "Esta cuenta todavía no tiene clave." };
  if (!verificarClaveEstudiante(acceso.card.id, actual)) {
    return { error: "La clave actual no es correcta." };
  }

  quitarClaveEstudiante(acceso.card.id);
  revalidatePath("/app");
  revalidatePath("/app/seguridad");
  return { ok: true, mensaje: "Clave eliminada. La tarjeta vuelve a ser la única llave." };
}
