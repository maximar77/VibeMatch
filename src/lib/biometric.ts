import type { VibeMatchNativeBridge } from "@/lib/native-bridge";

/**
 * Huella del dispositivo dentro de la APK Android.
 *
 * El WebView no tiene WebAuthn fiable, así que la app nativa expone
 * getBiometricStatus/authenticateBiometric y devuelve el resultado llamando a
 * window.__vibematchBiometric(ok). La preferencia se guarda en localStorage de
 * este dispositivo; la sesión desbloqueada dura hasta cerrar la app.
 */

export const BIOMETRIC_STORAGE_KEY = "vibematch.biometric.enabled";
export const BIOMETRIC_SESSION_KEY = "vibematch.biometric.unlocked";

export type BiometricAvailability =
  | "available"
  | "none"
  | "unsupported"
  | "unavailable";

function bridge(): VibeMatchNativeBridge | null {
  if (typeof window === "undefined") return null;
  return window.VibeMatchNative ?? null;
}

export function biometricAvailability(): BiometricAvailability {
  const nativo = bridge();
  if (!nativo?.getBiometricStatus || !nativo.authenticateBiometric) {
    return "unsupported";
  }

  try {
    const estado = nativo.getBiometricStatus();
    if (
      estado === "available" ||
      estado === "none" ||
      estado === "unsupported" ||
      estado === "unavailable"
    ) {
      return estado;
    }
    return "unavailable";
  } catch {
    return "unavailable";
  }
}

export function biometricEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return Boolean(window.localStorage.getItem(BIOMETRIC_STORAGE_KEY));
  } catch {
    return false;
  }
}

export function setBiometricEnabled(cardId: string | null, activa: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (activa) {
      window.localStorage.setItem(BIOMETRIC_STORAGE_KEY, cardId ?? "1");
    } else {
      window.localStorage.removeItem(BIOMETRIC_STORAGE_KEY);
      window.sessionStorage.removeItem(BIOMETRIC_SESSION_KEY);
    }
  } catch {
    // El WebView puede bloquear localStorage; la huella simplemente no persiste.
  }
}

export function marcarSesionBiometricaDesbloqueada() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(BIOMETRIC_SESSION_KEY, "1");
  } catch {
    // Sin sessionStorage el bloqueo se pedirá en cada carga.
  }
}

export function sesionBiometricaDesbloqueada(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(BIOMETRIC_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function authenticateBiometric(): Promise<boolean> {
  return new Promise((resolve) => {
    const nativo = bridge();
    if (!nativo?.authenticateBiometric) {
      resolve(false);
      return;
    }

    let terminado = false;
    const finalizar = (ok: boolean) => {
      if (terminado) return;
      terminado = true;
      window.clearTimeout(temporizador);
      delete window.__vibematchBiometric;
      resolve(ok);
    };

    // Si el diálogo nativo nunca responde, no dejamos la app bloqueada.
    const temporizador = window.setTimeout(() => finalizar(false), 120_000);

    window.__vibematchBiometric = (ok: boolean) => finalizar(Boolean(ok));

    try {
      nativo.authenticateBiometric();
    } catch {
      finalizar(false);
    }
  });
}
