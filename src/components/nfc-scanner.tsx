"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  estadoNFCNativo,
  extraerTokenTarjeta,
  leerNFCNativo,
  type NfcNativeEstado,
} from "@/lib/nfc-native";
import { leerNFCWeb, nfcWebSupported } from "@/lib/nfc-web";
import { QRScanner } from "@/components/qr-scanner";

type Props = {
  autoRedirect?: boolean;
  onTarjetaLeida?: (cardId: string, acceso: any) => void;
  label?: string;
};

type Estado = "idle" | "leyendo" | "exito" | "error";

export function NFCScanner({
  autoRedirect = true,
  onTarjetaLeida,
  label = "Escanear tarjeta NFC",
}: Props) {
  const [estado, setEstado] = useState<Estado>("idle");
  const [mensaje, setMensaje] = useState<string>("");
  const [nativo, setNativo] = useState<NfcNativeEstado | null>(null);
  const [webNfc, setWebNfc] = useState(false);
  const [mostrarQr, setMostrarQr] = useState(false);
  const [manual, setManual] = useState("");
  const montado = useRef(true);

  useEffect(() => {
    montado.current = true;
    setWebNfc(nfcWebSupported());
    void estadoNFCNativo().then((info) => {
      if (montado.current) setNativo(info);
    });
    return () => {
      montado.current = false;
    };
  }, []);

  const procesarValor = useCallback(
    (raw: string, origen: "NFC" | "QR" | "manual") => {
      const token = extraerTokenTarjeta(raw);
      if (!token) {
        setEstado("error");
        setMensaje(
          origen === "QR"
            ? "El código QR no contiene un enlace de tarjeta VibeMatch válido."
            : "No se pudo reconocer el código de la tarjeta. Revisa el enlace o pide ayuda en inspectoría.",
        );
        return;
      }

      setEstado("exito");
      setMensaje(`Tarjeta leída: ${token}`);
      setMostrarQr(false);
      onTarjetaLeida?.(token, null);

      if (autoRedirect) {
        window.location.href = `/a/${encodeURIComponent(token)}`;
      }
    },
    [autoRedirect, onTarjetaLeida],
  );

  const intentarNFC = useCallback(async () => {
    setEstado("leyendo");
    setMensaje("Acerca la tarjeta NFC al lector…");

    // 1) App Android con plugin nativo.
    if (nativo?.disponible) {
      const resultado = await leerNFCNativo();
      if (resultado.ok) {
        procesarValor(resultado.cardId, "NFC");
      } else {
        setEstado("error");
        setMensaje(resultado.error);
      }
      return;
    }

    // 2) Navegador con Web NFC (Chrome/Android).
    if (webNfc) {
      const resultado = await leerNFCWeb();
      if (resultado.ok) {
        procesarValor(resultado.cardId, "NFC");
      } else {
        setEstado("error");
        setMensaje(resultado.error);
      }
      return;
    }

    setEstado("error");
    setMensaje(
      nativo?.mensaje ??
        "NFC no disponible en este dispositivo. Usa el código QR o el ingreso manual.",
    );
  }, [nativo, procesarValor, webNfc]);

  const nfcDisponible = Boolean(nativo?.disponible || webNfc);
  const avisoNativo = nativo?.mensaje;

  return (
    <section className="mt-8 grid gap-6">
      <div className="relative flex flex-col items-center justify-center rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 min-h-[300px]">
        <div className="text-center">
          {estado === "leyendo" ? (
            <div className="flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full border-4 border-brand-strong/30 border-t-brand-strong animate-spin" />
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-brand-soft">
                Leyendo tarjeta NFC…
              </p>
            </div>
          ) : estado === "exito" ? (
            <div className="flex flex-col items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-emerald-300">
                Tarjeta verificada
              </p>
            </div>
          ) : estado === "error" ? (
            <div className="flex flex-col items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-rose-300">
                Error de lectura
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="h-7 w-7 text-brand-soft"
                  aria-hidden="true"
                >
                  <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" />
                  <path d="M8 12h8M12 8v8" />
                </svg>
              </div>
              <p className="max-w-xs text-sm text-zinc-400">
                Apoya tu tarjeta VibeMatch en la parte trasera del teléfono o
                escanea el código QR impreso.
              </p>
            </div>
          )}
        </div>

        {estado === "exito" && mensaje && (
          <p className="mt-4 max-w-full break-all text-center font-mono text-[10px] text-emerald-300/80">
            {mensaje}
          </p>
        )}

        {estado === "error" && mensaje && (
          <p className="mt-4 text-center text-xs text-rose-400/80">{mensaje}</p>
        )}

        {(estado === "idle" || estado === "error") && avisoNativo && (
          <div className="mt-4 max-w-md rounded-xl border border-amber-300/20 bg-amber-300/[0.06] px-4 py-3 text-center text-xs text-amber-200">
            {avisoNativo}
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          onClick={() => {
            if (!nfcDisponible || estado === "leyendo") return;
            void intentarNFC();
          }}
          disabled={estado === "leyendo" || !nfcDisponible}
          className="w-full rounded-full bg-brand-strong px-6 py-3.5 text-sm font-semibold text-ink transition hover:bg-brand-strong/85 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {estado === "leyendo" ? "Leyendo…" : label}
        </button>

        <button
          onClick={() => {
            setEstado("idle");
            setMensaje("");
            setMostrarQr((valor) => !valor);
          }}
          className="w-full rounded-full border border-white/10 px-6 py-3.5 text-sm font-semibold text-zinc-300 transition hover:bg-white/5"
        >
          {mostrarQr ? "Ocultar cámara QR" : "Escanear código QR"}
        </button>
      </div>

      {mostrarQr && (
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.25em] text-brand-soft">
            Cámara · código QR de la tarjeta
          </p>
          <QRScanner
            label="Activar cámara"
            onDetect={(valor) => procesarValor(valor, "QR")}
          />
          <p className="mt-3 text-xs text-zinc-500">
            Si la cámara no está disponible, escribe el código de tu tarjeta
            abajo.
          </p>
        </div>
      )}

      <form
        className="grid gap-3 sm:grid-cols-[1fr_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          if (!manual.trim()) return;
          procesarValor(manual, "manual");
        }}
      >
        <label className="sr-only" htmlFor="vibematch-token-manual">
          Código de tarjeta
        </label>
        <input
          id="vibematch-token-manual"
          value={manual}
          onChange={(event) => setManual(event.target.value)}
          placeholder="O pega el enlace/código de tu tarjeta"
          autoComplete="off"
          spellCheck={false}
          className="w-full rounded-full border border-white/10 bg-white/[0.04] px-5 py-3.5 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-brand-strong/60"
        />
        <button
          type="submit"
          disabled={!manual.trim()}
          className="rounded-full border border-white/10 px-6 py-3.5 text-sm font-semibold text-zinc-200 transition hover:bg-white/5 disabled:opacity-40"
        >
          Abrir tarjeta
        </button>
      </form>
    </section>
  );
}
