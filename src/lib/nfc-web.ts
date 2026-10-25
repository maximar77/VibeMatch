/**
 * Lector NFC Web para VibeMatch.
 *
 * Utiliza la Web NFC API (NDEFReader) disponible en Chrome/Android y
 * navegadores modernos. Prioriza leer el mensaje NDEF con la URL /a/<token>
 * de la tarjeta. Si no hay NDEF válido, intenta usar el UID como fallback.
 *
 * Nota: esta API requiere un contexto seguro (HTTPS o localhost).
 */

type NDEFRecord = {
  recordType?: string;
  data?: DataView | ArrayBuffer | Uint8Array;
};

type NDEFMessage = {
  records?: NDEFRecord[];
};

type NDEFReaderEvent = Event & {
  serialNumber?: Uint8Array;
  message?: NDEFMessage;
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

function toUint8Array(data: NDEFRecord["data"]): Uint8Array | null {
  if (!data) return null;
  if (data instanceof Uint8Array) return data;
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  if (data instanceof DataView) {
    const arr = new Uint8Array(data.byteLength);
    for (let i = 0; i < data.byteLength; i += 1) {
      arr[i] = data.getUint8(i);
    }
    return arr;
  }
  return null;
}

function decodeRecord(record: NDEFRecord): string | null {
  const bytes = toUint8Array(record.data);
  if (!bytes || bytes.length === 0) return null;

  const type = (record.recordType || "").toLowerCase();

  // URL record (well-known type "U")
  if (type === "url") {
    const prefixMap: Record<number, string> = {
      0x00: "",
      0x01: "http://www.",
      0x02: "https://www.",
      0x03: "http://",
      0x04: "https://",
      0x05: "tel:",
      0x06: "mailto:",
      0x07: "ftp://anonymous:anonymous@",
      0x08: "ftp://ftp.",
      0x09: "ftps://",
      0x0a: "sftp://",
      0x0b: "smb://",
      0x0c: "nfs://",
      0x0d: "ftp://",
      0x0e: "dav://",
      0x0f: "news:",
      0x10: "telnet://",
      0x11: "imap:",
      0x12: "rtsp://",
      0x13: "urn:",
      0x14: "pop:",
      0x15: "sip:",
      0x16: "sips:",
      0x17: "tftp:",
      0x18: "btspp://",
      0x19: "btl2cap://",
      0x1a: "btgoep://",
      0x1b: "tcpobex://",
      0x1c: "irdaobex://",
      0x1d: "file://",
      0x1e: "urn:epc:id:",
      0x1f: "urn:epc:tag:",
      0x20: "urn:epc:pat:",
      0x21: "urn:epc:raw:",
      0x22: "urn:epc:",
      0x23: "urn:nfc:",
    };
    const prefix = prefixMap[bytes[0]] ?? "";
    const rest = new TextDecoder().decode(bytes.slice(1));
    return prefix + rest;
  }

  // Absolute URL
  if (type === "absolute-url") {
    return new TextDecoder().decode(bytes);
  }

  // Text record
  if (type === "text") {
    if (bytes.length === 0) return null;
    const status = bytes[0];
    const isUtf16 = (status & 0x80) !== 0;
    const langCodeLength = status & 0x3f;
    const textBytes = bytes.slice(1 + langCodeLength);
    return new TextDecoder(isUtf16 ? "utf-16" : "utf-8").decode(textBytes);
  }

  // Smart poster or unknown - try to decode as text
  try {
    const text = new TextDecoder().decode(bytes);
    if (text.includes("http") || text.includes("/a/")) return text;
  } catch {
    // ignore
  }

  return null;
}

function extraerTokenDesdeUrl(url: string): string | null {
  try {
    // Intentar parsear como URL completa
    const parsed = new URL(url, typeof window !== "undefined" ? window.location.origin : "http://localhost");
    const path = parsed.pathname;
    // Buscar /a/<token>
    const match = path.match(/\/a\/([A-Za-z0-9_-]{24,128})/);
    if (match?.[1]) return match[1];
    // Si el path completo es el token
    const cleanPath = path.replace(/^\//, "");
    if (/^[A-Za-z0-9_-]{24,128}$/.test(cleanPath)) return cleanPath;
  } catch {
    // Intentar regex directo
    const match = url.match(/\/a\/([A-Za-z0-9_-]{24,128})/);
    if (match?.[1]) return match[1];
  }
  // Si es directamente un token
  if (/^[A-Za-z0-9_-]{24,128}$/.test(url.trim())) return url.trim();
  return null;
}

/**
 * Lee una tarjeta NFC mediante Web NFC API.
 *
 * @param timeoutMs Tiempo máximo de espera en milisegundos (default 10s).
 * @returns El token/cardId de la tarjeta o un error.
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
        // Primero intentar leer mensaje NDEF con URL/token
        const message = event.message;
        if (message?.records && message.records.length > 0) {
          for (const record of message.records) {
            const decoded = decodeRecord(record);
            if (decoded) {
              const token = extraerTokenDesdeUrl(decoded);
              if (token) {
                finalizar({ ok: true, cardId: token, source: "web-nfc" });
                return;
              }
            }
          }
        }

        // Fallback: usar UID serialNumber
        const serial = event.serialNumber;
        if (serial && serial.length > 0) {
          const cardId = Array.from(serial as unknown as number[])
            .map((b: number) => b.toString(16).padStart(2, "0"))
            .join("")
            .toUpperCase();
          finalizar({ ok: true, cardId, source: "web-nfc" });
          return;
        }

        finalizar({
          ok: false,
          error: "No se pudo leer el identificador de la tarjeta NFC.",
        });
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
        // Escaneo iniciado correctamente; el resultado llegará por onreading/onreadingerror.
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