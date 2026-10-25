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

function extraerTokenDesdeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname;
    const match = path.match(/\/a\/([A-Za-z0-9_-]{24,128})/);
    if (match?.[1]) return match[1];
  } catch {
    // ignore
  }
  const match = url.match(/\/a\/([A-Za-z0-9_-]{24,128})/);
  if (match?.[1]) return match[1];
  if (/^[A-Za-z0-9_-]{24,128}$/.test(url.trim())) return url.trim();
  return null;
}

function bytesAHex(bytes: unknown): string | null {
  if (!bytes) return null;
  if (typeof bytes === "string") {
    // Ya es hex o string
    if (/^[0-9A-Fa-f]+$/.test(bytes)) return bytes.toUpperCase();
    return null;
  }
  if (Array.isArray(bytes)) {
    return bytes
      .map((b: number) => Number(b).toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
  }
  if (bytes instanceof Uint8Array) {
    return Array.from(bytes)
      .map((b: number) => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
  }
  return null;
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

    // Intentar leer NDEF primero
    if (resultado?.message?.records) {
      const records = Array.isArray(resultado.message.records)
        ? resultado.message.records
        : [resultado.message.records];
      for (const record of records) {
        const payload = record?.payload || record?.data || record?.recordPayload;
        if (typeof payload === "string") {
          const token = extraerTokenDesdeUrl(payload);
          if (token) return { ok: true, cardId: token, source: "capacitor-nfc" };
        }
        if (payload && typeof payload === "object") {
          const text = new TextDecoder().decode(payload);
          const token = extraerTokenDesdeUrl(text);
          if (token) return { ok: true, cardId: token, source: "capacitor-nfc" };
        }
      }
    }

    // También revisar otros campos comunes
    const ndefUrl = resultado?.url || resultado?.ndef?.url || resultado?.message?.url;
    if (typeof ndefUrl === "string") {
      const token = extraerTokenDesdeUrl(ndefUrl);
      if (token) return { ok: true, cardId: token, source: "capacitor-nfc" };
    }

    const serial = resultado?.identifier || resultado?.id || resultado?.serialNumber;

    if (!serial || (Array.isArray(serial) && serial.length === 0)) {
      return {
        ok: false,
        error: "No se pudo leer el identificador de la tarjeta NFC.",
      };
    }

    const cardIdHex = bytesAHex(serial);
    const cardId =
      typeof serial === "string" && /^[0-9A-Fa-f]+$/.test(serial)
        ? serial.toUpperCase()
        : cardIdHex;

    if (!cardId) {
      return {
        ok: false,
        error: "No se pudo leer el identificador de la tarjeta NFC.",
      };
    }

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