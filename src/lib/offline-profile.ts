"use client";

/**
 * Almacenamiento offline del perfil VibeMatch.
 *
 * Guarda el perfil recibido del servidor en el dispositivo y mantiene una cola
 * de cambios pendientes cuando no hay conexión. Al recuperar la red, la cola se
 * envía al servidor mediante PUT /api/perfil.
 *
 * Usa Capacitor Preferences cuando está disponible (app Android) y cae a
 * localStorage en el navegador, para que la misma lógica sirva en la PWA.
 */

import type { Perfil } from "@/lib/profile-schema";

const CLAVE_PERFIL = "vibematch.perfil.v1";
const CLAVE_PENDIENTE = "vibematch.perfil.pendiente.v1";

export type EstadoSync = "sincronizado" | "pendiente" | "sin_perfil";

export type PerfilLocal = {
  perfil: Perfil;
  guardadoEn: string;
  pendiente: boolean;
};

type CambiosPendientes = Omit<Perfil, "createdAt" | "updatedAt" | "consentAt"> & {
  encoladoEn: string;
};

function tieneLocalStorage(): boolean {
  try {
    return typeof window !== "undefined" && Boolean(window.localStorage);
  } catch {
    return false;
  }
}

async function leerCrudo(clave: string): Promise<string | null> {
  try {
    const { Preferences } = await import("@capacitor/preferences");
    const { value } = await Preferences.get({ key: clave });
    if (value !== null) return value;
  } catch {
    // No estamos en la app nativa (o el plugin no está); seguimos al navegador.
  }

  if (tieneLocalStorage()) return window.localStorage.getItem(clave);
  return null;
}

async function escribirCrudo(clave: string, valor: string): Promise<void> {
  try {
    const { Preferences } = await import("@capacitor/preferences");
    await Preferences.set({ key: clave, value: valor });
    return;
  } catch {
    // Sin plugin nativo: usamos localStorage.
  }

  if (tieneLocalStorage()) window.localStorage.setItem(clave, valor);
}

async function borrarCrudo(clave: string): Promise<void> {
  try {
    const { Preferences } = await import("@capacitor/preferences");
    await Preferences.remove({ key: clave });
  } catch {
    // ignorado
  }

  if (tieneLocalStorage()) window.localStorage.removeItem(clave);
}

export async function leerPerfilLocal(): Promise<PerfilLocal | null> {
  const crudo = await leerCrudo(CLAVE_PERFIL);
  if (!crudo) return null;

  try {
    const parsed = JSON.parse(crudo) as PerfilLocal;
    if (!parsed?.perfil?.cardId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function guardarPerfilLocal(
  perfil: Perfil,
  pendiente: boolean,
): Promise<PerfilLocal> {
  const entrada: PerfilLocal = {
    perfil,
    guardadoEn: new Date().toISOString(),
    pendiente,
  };
  await escribirCrudo(CLAVE_PERFIL, JSON.stringify(entrada));
  return entrada;
}

export async function leerPendiente(): Promise<CambiosPendientes | null> {
  const crudo = await leerCrudo(CLAVE_PENDIENTE);
  if (!crudo) return null;
  try {
    return JSON.parse(crudo) as CambiosPendientes;
  } catch {
    return null;
  }
}

export async function encolarCambios(
  cambios: Omit<Perfil, "createdAt" | "updatedAt" | "consentAt">,
): Promise<void> {
  const entrada: CambiosPendientes = {
    ...cambios,
    encoladoEn: new Date().toISOString(),
  };
  await escribirCrudo(CLAVE_PENDIENTE, JSON.stringify(entrada));
}

export async function limpiarPendiente(): Promise<void> {
  await borrarCrudo(CLAVE_PENDIENTE);
}

export async function estadoSync(): Promise<EstadoSync> {
  const [local, pendiente] = await Promise.all([leerPerfilLocal(), leerPendiente()]);
  if (!local) return "sin_perfil";
  return pendiente ? "pendiente" : "sincronizado";
}

export function hayRed(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}

/**
 * Envía a la cola pendiente al servidor. Devuelve true si quedó sincronizado.
 * Si no hay red o el servidor responde 401, deja la cola intacta.
 */
export async function sincronizar(
  cambios?: Omit<Perfil, "createdAt" | "updatedAt" | "consentAt">,
): Promise<{ ok: boolean; perfil?: Perfil; motivo?: string }> {
  if (!hayRed()) return { ok: false, motivo: "sin_red" };

  const pendiente = cambios ?? (await leerPendiente());
  if (!pendiente) return { ok: true };

  const payload: Omit<Perfil, "createdAt" | "updatedAt" | "consentAt"> = {
    cardId: pendiente.cardId,
    displayName: pendiente.displayName,
    pronouns: pendiente.pronouns,
    level: pendiente.level,
    vibe: pendiente.vibe,
    interests: pendiente.interests,
    bio: pendiente.bio,
  };

  try {
    const respuesta = await fetch("/api/perfil", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (respuesta.status === 401) {
      return { ok: false, motivo: "sin_sesion" };
    }

    if (!respuesta.ok) {
      return { ok: false, motivo: `http_${respuesta.status}` };
    }

    const data = (await respuesta.json()) as {
      perfil: Perfil;
      sincronizadoEn: string;
    };

    await guardarPerfilLocal(data.perfil, false);
    await limpiarPendiente();
    return { ok: true, perfil: data.perfil };
  } catch {
    return { ok: false, motivo: "error_red" };
  }
}

/**
 * Trae el perfil del servidor y actualiza el almacén local.
 * Devuelve null si no hay sesión, red o perfil remoto.
 */
export async function traerPerfilRemoto(): Promise<{
  perfil: Perfil | null;
  sinSesion: boolean;
}> {
  if (!hayRed()) return { perfil: null, sinSesion: false };

  try {
    const respuesta = await fetch("/api/perfil", { cache: "no-store" });
    if (respuesta.status === 401) return { perfil: null, sinSesion: true };
    if (!respuesta.ok) return { perfil: null, sinSesion: false };

    const data = (await respuesta.json()) as { perfil: Perfil | null };

    if (data.perfil) {
      // Un cambio local pendiente no debe ser pisado por el servidor.
      const pendiente = await leerPendiente();
      if (!pendiente) await guardarPerfilLocal(data.perfil, false);
      return { perfil: data.perfil, sinSesion: false };
    }

    return { perfil: null, sinSesion: false };
  } catch {
    return { perfil: null, sinSesion: false };
  }
}
