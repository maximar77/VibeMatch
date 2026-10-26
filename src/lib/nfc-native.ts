/**
 * Lector NFC nativo para la app Android de VibeMatch (Capacitor).
 *
 * Usa @capgo/capacitor-nfc. El plugin funciona en modo lectura continua:
 * `startScanning()` abre la sesión y cada tarjeta se recibe por el evento
 * `nfcEvent`. Aquí se espera la primera tarjeta, se extrae el token de la URL
 * NDEF (`/a/<token>`) o, como respaldo, el UID hexadecimal de la tarjeta.
 *
 * En el navegador no se importa el plugin: se devuelve `noPlugin` para que la
 * interfaz use la Web NFC API o el escáner QR.
 */

export type NfcNativeResult =
  | { ok: true; cardId: string; source: "capacitor-nfc" }
  | { ok: false; error: string; noPlugin?: boolean };

export type NfcNativeEstado = {
  /** Hay hardware NFC y la app corre dentro de Capacitor. */
  disponible: boolean;
  /** El adaptador NFC del teléfono está encendido. */
  habilitado: boolean;
  /** Mensaje para mostrar al usuario cuando algo falta. */
  mensaje?: string;
};

type NdefRecordLike = {
  tnf?: number;
  type?: number[];
  id?: number[];
  payload?: number[];
};

type NfcTagLike = {
  id?: number[];
  techTypes?: string[];
  type?: string | null;
  ndefMessage?: NdefRecordLike[] | null;
};

type NfcEventLike = {
  type?: string;
  tag?: NfcTagLike;
};

type ListenerHandle = { remove: () => Promise<void> | void };

type NfcPluginLike = {
  isSupported?: () => Promise<{ supported: boolean }>;
  getStatus: () => Promise<{ status: string }>;
  startScanning: (options?: Record<string, unknown>) => Promise<void>;
  stopScanning: () => Promise<void>;
  addListener: (
    eventName: string,
    listener: (event: NfcEventLike) => void,
  ) => Promise<ListenerHandle>;
};

/** Comprueba si estamos dentro de la app Capacitor nativa. */
export function esAppNativa(): boolean {
  return typeof window !== "undefined" && Boolean((window as any).Capacitor);
}

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{24,128}$/;

/**
 * Extrae el token de tarjeta desde una URL (`https://dominio/a/<token>`),
 * un esquema propio (`vibematch://a/<token>`) o un token directo.
 */
export function extraerTokenTarjeta(valor: string): string | null {
  const limpio = valor.trim();
  if (!limpio) return null;

  if (TOKEN_PATTERN.test(limpio)) return limpio;

  // URLs normales y esquemas propios.
  try {
    const url = new URL(limpio);
    const partes = url.pathname.split("/").filter(Boolean);
    const idx = partes.indexOf("a");
    const candidato =
      idx >= 0 && partes[idx + 1]
        ? partes[idx + 1]
        : partes[partes.length - 1];
    if (candidato) {
      const decodificado = decodeURIComponent(candidato);
      if (TOKEN_PATTERN.test(decodificado)) return decodificado;
    }
  } catch {
    // No es una URL: se intenta con la expresión regular de abajo.
  }

  const match = limpio.match(/\/a\/([A-Za-z0-9_-]{24,128})/);
  if (match?.[1]) return match[1];

  return null;
}

function bytesAHex(bytes: number[] | Uint8Array | undefined | null): string | null {
  if (!bytes || bytes.length === 0) return null;
  return Array.from(bytes)
    .map((b) => Number(b).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

function bytesAText(bytes: number[] | Uint8Array | undefined | null): string {
  if (!bytes || bytes.length === 0) return "";
  try {
    return new TextDecoder("utf-8", { fatal: false }).decode(
      Uint8Array.from(bytes),
    );
  } catch {
    return "";
  }
}

const PREFIJOS_URL: Record<number, string> = {
  0x00: "",
  0x01: "http://www.",
  0x02: "https://www.",
  0x03: "http://",
  0x04: "https://",
  0x05: "tel:",
  0x06: "mailto:",
};

function decodificarRegistroNdef(registro: NdefRecordLike): string | null {
  const payload = Array.isArray(registro.payload) ? registro.payload : [];
  if (payload.length === 0) return null;

  const tipo = bytesAText(registro.type).trim();

  // Registro "well known" de tipo U (URI).
  if (tipo === "U") {
    const prefijo = PREFIJOS_URL[payload[0]] ?? "";
    return prefijo + bytesAText(payload.slice(1));
  }

  // Registro "well known" de tipo T (texto).
  if (tipo === "T") {
    const estado = payload[0];
    const utf16 = (estado & 0x80) !== 0;
    const largoIdioma = estado & 0x3f;
    const texto = payload.slice(1 + largoIdioma);
    if (utf16) {
      const pares: number[] = [];
      for (let i = 0; i + 1 < texto.length; i += 2) {
        pares.push((texto[i] << 8) | texto[i + 1]);
      }
      return String.fromCharCode(...pares);
    }
    return bytesAText(texto);
  }

  // TNF absoluto (0x03): el tipo contiene la URI completa.
  if (registro.tnf === 0x03 && tipo) return tipo;

  // Smart poster u otros: a veces el payload contiene la URL en texto plano.
  const texto = bytesAText(payload);
  if (texto.includes("/a/") || /^https?:\/\//i.test(texto)) return texto;

  return null;
}

function extraerTokenDeTag(tag: NfcTagLike | undefined): string | null {
  if (!tag) return null;

  const registros = Array.isArray(tag.ndefMessage) ? tag.ndefMessage : [];
  for (const registro of registros) {
    const texto = decodificarRegistroNdef(registro);
    if (!texto) continue;
    const token = extraerTokenTarjeta(texto);
    if (token) return token;
  }

  // Respaldo: UID de la tarjeta. Solo sirve si la tarjeta fue registrada
  // usando su UID como token; si no, el servidor la rechazará y la UI ofrece QR.
  return bytesAHex(tag.id);
}

async function cargarPlugin(): Promise<NfcPluginLike | null> {
  try {
    const modulo = await import("@capgo/capacitor-nfc");
    const plugin =
      (modulo as any).CapacitorNfc ?? (modulo as any).default ?? null;
    if (plugin && typeof plugin.startScanning === "function") return plugin;
    return null;
  } catch {
    return null;
  }
}

/**
 * Consulta el estado del NFC nativo para decidir qué mostrar en la interfaz.
 * No lanza: cualquier fallo se traduce en `disponible: false`.
 */
export async function estadoNFCNativo(): Promise<NfcNativeEstado> {
  if (!esAppNativa()) {
    return {
      disponible: false,
      habilitado: false,
    };
  }

  const plugin = await cargarPlugin();
  if (!plugin) {
    return {
      disponible: false,
      habilitado: false,
      mensaje:
        "El lector NFC no está incluido en esta compilación. Usa el código QR.",
    };
  }

  try {
    if (typeof plugin.isSupported === "function") {
      const soporte = await plugin.isSupported();
      if (!soporte.supported) {
        return {
          disponible: false,
          habilitado: false,
          mensaje: "Este dispositivo no tiene hardware NFC. Usa el código QR.",
        };
      }
    }

    const estado = await plugin.getStatus();
    const habilitado =
      estado.status === "NFC_OK" || estado.status === "NDEF_PUSH_DISABLED";

    return {
      disponible: true,
      habilitado,
      mensaje: habilitado
        ? undefined
        : "El NFC está desactivado. Actívalo en Ajustes y vuelve a intentar.",
    };
  } catch (error) {
    return {
      disponible: false,
      habilitado: false,
      mensaje:
        error instanceof Error
          ? error.message
          : "No se pudo consultar el estado del NFC.",
    };
  }
}

/**
 * Lee una tarjeta NFC mediante el plugin nativo de Capacitor.
 *
 * @param timeoutMs Tiempo máximo de espera antes de cerrar la sesión NFC.
 * @returns El token de la tarjeta o un error descriptivo.
 */
export async function leerNFCNativo(
  timeoutMs = 15_000,
): Promise<NfcNativeResult> {
  if (!esAppNativa()) {
    return {
      ok: false,
      error: "No estamos en la app nativa.",
      noPlugin: true,
    };
  }

  const plugin = await cargarPlugin();
  if (!plugin) {
    return {
      ok: false,
      error:
        "El plugin NFC no está instalado en esta compilación. Usa el código QR como respaldo.",
      noPlugin: true,
    };
  }

  let listener: ListenerHandle | null = null;

  try {
    if (typeof plugin.isSupported === "function") {
      const soporte = await plugin.isSupported();
      if (!soporte.supported) {
        return {
          ok: false,
          error: "Este dispositivo no tiene hardware NFC. Usa el código QR.",
        };
      }
    }

    const estado = await plugin.getStatus();
    if (estado.status === "NO_NFC") {
      return {
        ok: false,
        error: "Este dispositivo no tiene hardware NFC. Usa el código QR.",
      };
    }
    if (estado.status === "NFC_DISABLED") {
      return {
        ok: false,
        error:
          "El NFC está desactivado en el dispositivo. Actívalo en Ajustes y vuelve a intentar.",
      };
    }

    let finalizar: (valor: NfcNativeResult) => void = () => {};

    listener = await plugin.addListener("nfcEvent", (event) => {
      const token = extraerTokenDeTag(event?.tag);
      if (token) {
        finalizar({ ok: true, cardId: token, source: "capacitor-nfc" });
        return;
      }
      finalizar({
        ok: false,
        error:
          "La tarjeta no contiene una URL de VibeMatch ni un identificador legible.",
      });
    });

    const resultado = await new Promise<NfcNativeResult>((resolve) => {
      let terminado = false;
      let timer: ReturnType<typeof setTimeout> | null = null;

      finalizar = (valor: NfcNativeResult) => {
        if (terminado) return;
        terminado = true;
        if (timer) clearTimeout(timer);
        resolve(valor);
      };

      timer = setTimeout(() => {
        finalizar({
          ok: false,
          error:
            "Tiempo de espera agotado. Acerca la tarjeta al lector o usa el código QR.",
        });
      }, timeoutMs);

      plugin
        .startScanning({
          invalidateAfterFirstRead: true,
          alertMessage: "Acerca la tarjeta VibeMatch al teléfono",
        })
        .catch((error: unknown) => {
          finalizar({
            ok: false,
            error:
              error instanceof Error
                ? error.message
                : "No se pudo iniciar el lector NFC.",
          });
        });
    });

    return resultado;
  } catch (error: unknown) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? `Error NFC nativo: ${error.message}`
          : "Error NFC nativo.",
    };
  } finally {
    try {
      await plugin.stopScanning();
    } catch {
      // La sesión pudo cerrarse sola después de la primera lectura.
    }
    if (listener) {
      try {
        await listener.remove();
      } catch {
        // El listener pudo quedar inválido al cerrar la sesión.
      }
    }
  }
}
