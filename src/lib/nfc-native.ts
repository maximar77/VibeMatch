/**
 * Lector NFC nativo para la app Android de VibeMatch (Capacitor).
 *
 * Este módulo carga el plugin NFC de Capacitor solo cuando se ejecuta dentro
 * de la app nativa. En el navegador devuelve un resultado de "no disponible"
 * para que se use la Web NFC API o el código QR como respaldo.
 *
 * El plugin @capgo/capacitor-nfc debe instalarse para funcionar en Android:
 *   npm install @capgo/capacitor-nfc
 *   npx cap sync
 */

import { leerNFCWeb } from "@/lib/nfc-web";

export type NfcNativeResult =
  | { ok: true; cardId: string; source: "capacitor-nfc" }
  | { ok: false; error: string; noPlugin?: boolean };

/** Comprueba si estamos dentro de la app Capacitor nativa. */
function esAppNativa(): boolean {
  return typeof window !== "undefined" && Boolean((window as any).Capacitor);
}

/**
 * Lee una tarjeta NFC mediante el plugin nativo de Capacitor.
 *
 * @returns El ID de la tarjeta o un error indicando si falta el plugin.
 */
export async function leerNFCNativo(): Promise<NfcNativeResult> {
  if (!esAppNativa()) {
    return {
      ok: false,
      error: "No estamos en la app nativa.",
      noPlugin: true,
    };
  }

  try {
    // Carga diferida del plugin para no romper el build en el navegador.
    const capacitorNfc = await import("@capgo/capacitor-nfc");
    const Nfc = (capacitorNfc.default ?? capacitorNfc.CapacitorNfc) as any;

    const estado = await Nfc.enabled();
    if (!estado.enabled) {
      return {
        ok: false,
        error: "El NFC está desactivado en el dispositivo. Actívalo y vuelve a intentar.",
      };
    }

    const resultado = await Nfc.readOnce();
    const serial = resultado.identifier;

    if (!serial || serial.length === 0) {
      return {
        ok: false,
        error: "No se pudo leer el identificador de la tarjeta NFC.",
      };
    }

    // identifier puede venir como string hex o como array de bytes según el plugin.
    const cardId =
      typeof serial === "string"
        ? serial.toUpperCase()
        : Array.from(serial as unknown as number[])
            .map((b: number) => b.toString(16).padStart(2, "0"))
            .join("")
            .toUpperCase();

    return { ok: true, cardId, source: "capacitor-nfc" };
  } catch (err: unknown) {
    const mensaje = err instanceof Error ? err.message : String(err);
    if (/no plugin|not available|undefined/i.test(mensaje)) {
      return {
        ok: false,
        error: "El plugin NFC no está instalado en esta compilación. Usa el código QR como respaldo.",
        noPlugin: true,
      };
    }
    return {
      ok: false,
      error: `Error NFC nativo: ${mensaje}`,
    };
  }
}

/**
 * Intenta leer NFC por cualquier medio disponible (nativo primero, luego web).
 * Usado por el componente de escaneo.
 */
export async function leerNFCMejorEsfuerzo(): Promise<
  | { ok: true; cardId: string; source: "capacitor-nfc" | "web-nfc" }
  | { ok: false; error: string }
> {
  // 1) Intentar nativo (Capacitor en Android).
  const nativo = await leerNFCNativo();
  if (nativo.ok) return nativo;
  if (!nativo.noPlugin) return nativo; // Error real, no fall back.

  // 2) Intentar Web NFC API.
  const web = await leerNFCWeb();
  if (web.ok) return web;

  // 3) Ambos fallaron.
  return {
    ok: false,
    error: web.error || "No se pudo leer la tarjeta por ningún medio disponible.",
  };
}