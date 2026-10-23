/**
 * Lector NFC Web para VibeMatch.
 *
 * Utiliza la Web NFC API (NDEFReader) disponible en Chrome/Android y
 * navegadores modernos. Lee el número de serie (UID) de la tarjeta NFC
 * y lo devuelve como cadena hexadecimal para identificarla en el sistema.
 *
 * Nota: esta API requiere un contexto seguro (HTTPS o localhost).
 */

type NDEFReaderEvent = Event & {
  serialNumber?: Uint8Array;
  message?: { records: Array<{ data: Uint8Array }> };
};

type NDEFReaderInstance = {
  scan: () => Promise<void>;
  onreading: ((event: NDEFReaderEvent) => void) | null;
  onreadingerror: ((event: Event) => void) | null;
};

export type NfcResult =
  | { ok: true; cardId: string; source: "web-nfc" }
  | { ok: false; error: string };

/** Comprueba si el navegador soporta Web NFC API. */
export function nfcWebSupported(): boolean {
  return typeof window !== "undefined" && typeof (window as any).NDEFReader !== "undefined";
}

/**
 * Lee una tarjeta NFC mediante Web NFC API.
 *
 * @param timeoutMs Tiempo máximo de espera en milisegundos (default 10s).
 * @returns El ID de la tarjeta (UID en hex) o un error.
 */
export async function leerNFCWeb(
  timeoutMs = 10_000,
): Promise<NfcResult> {
  if (!nfcWebSupported()) {
    return {
      ok: false,
      error: "NFC no soportado en este navegador. Usa el código QR como respaldo.",
    };
  }

  return new Promise<NfcResult>((resolve) => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let resolved = false;

    const finalizar = (resultado: NfcResult) => {
      if (resolved) return;
      resolved = true;
      if (timer) clearTimeout(timer);
      resolve(resultado);
    };

    try {
      const NDEFReaderCtor = (window as any).NDEFReader;
      const reader = new NDEFReaderCtor() as NDEFReaderInstance;

      const onScan = (event: NDEFReaderEvent) => {
        const serial = event.serialNumber;
        if (serial && serial.length > 0) {
          const cardId = Array.from(serial as unknown as number[])
            .map((b: number) => b.toString(16).padStart(2, "0"))
            .join("")
            .toUpperCase();
          finalizar({ ok: true, cardId, source: "web-nfc" });
        } else {
          finalizar({
            ok: false,
            error: "No se pudo leer el identificador de la tarjeta NFC.",
          });
        }
      };

      const onError = (_error: Event) => {
        finalizar({
          ok: false,
          error: "Error al leer la tarjeta NFC. Intenta de nuevo o usa el código QR.",
        });
      };

      reader.onreadingerror = onError;
      reader.onreading = onScan;

      reader.scan().then(() => {
        // Escaneo iniciado correctamente; el resultado llegá por onreading/onreadingerror.
      }).catch((err: unknown) => {
        finalizar({
          ok: false,
          error: err instanceof Error ? err.message : "No se pudo iniciar el lector NFC.",
        });
      });

      timer = setTimeout(() => {
        finalizar({
          ok: false,
          error: "Tiempo de espera agotado. Acércate la tarjeta nuevamente o usa el código QR.",
        });
      }, timeoutMs);
    } catch (err: unknown) {
      finalizar({
        ok: false,
        error: err instanceof Error ? err.message : "Lector NFC no disponible.",
      });
    }
  });
}

/**
 * Convierte un token de URL en un identificador de tarjeta compatible.
 * Los tokens VibeMatch ya son strings alfanuméricos; esta función los
 * normaliza para usarlos como cardId cuando no hay NFC disponible.
 */
export function tokenACardId(token: string): string | null {
  const clean = token.trim();
  if (!/^[A-Za-z0-9_-]{24,128}$/.test(clean)) return null;
  return clean;
}