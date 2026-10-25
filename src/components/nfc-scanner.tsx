"use client";

import { useCallback, useState, useEffect } from "react";
import { leerNFCNativo } from "@/lib/nfc-native";
import { nfcWebSupported } from "@/lib/nfc-web";

type Props = {
  autoRedirect?: boolean;
  onTarjetaLeida?: (cardId: string, acceso: any) => void;
  label?: string;
};

export function NFCScanner({
  autoRedirect = true,
  onTarjetaLeida,
  label = "Escanear tarjeta o código QR",
}: Props) {
  const [estado, setEstado] = useState<
    "idle" | "leyendo" | "exito" | "error" | "sin-nfc"
  >("idle");
  const [mensaje, setMensaje] = useState<string>("");
  const [soportado, setSoportado] = useState<boolean | null>(null);

  const intentarLectura = useCallback(async () => {
    setEstado("leyendo");
    setMensaje("Acérca la tarjeta NFC al lector…");

    const resultado = await leerNFCNativo();

    if (resultado.ok) {
      const { cardId } = resultado;
      setMensaje(`Tarjeta leída: ${cardId}`);

      // La validación de tarjetas es server-only (next/headers, node:fs).
      // Se valida en el servidor al abrir el enlace /a/[token].
      // Aquí solo notificamos el cardId leído por NFC.

      setEstado("exito");
      onTarjetaLeida?.(cardId, null);

      if (autoRedirect) {
        // Validar en el servidor abriendo el enlace de la tarjeta.
        window.location.href = `/a/${encodeURIComponent(cardId)}`;
      }
    } else {
      setEstado("error");
      setMensaje(resultado.error);
    }
  }, [autoRedirect, onTarjetaLeida]);

  useEffect(() => {
    setSoportado(nfcWebSupported());
  }, []);

  const lecturasDisponibles = soportado !== false;

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
            <div className="h-16 w-16 rounded-full border-4 border-white/10 border-t-white/30 animate-spin" />
          )}
        </div>

        {estado === "idle" && !soportado && (
          <div className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
            NFC no disponible en este dispositivo. Usa el código QR como respaldo.
          </div>
        )}

        {estado === "error" && mensaje && (
          <p className="mt-4 text-xs text-rose-400/80 text-center">{mensaje}</p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          onClick={() => {
            if (!lecturasDisponibles) return;
            intentarLectura();
          }}
          disabled={estado === "leyendo" || !lecturasDisponibles}
          className="w-full rounded-full bg-brand-strong px-6 py-3.5 text-sm font-semibold text-ink transition hover:bg-brand-strong/85 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {estado === "leyendo" ? "Leyendo…" : label}
        </button>

        <button
          onClick={() => {
            setEstado("idle");
            setMensaje("");
          }}
          className="w-full rounded-full border border-white/10 px-6 py-3.5 text-sm font-semibold text-zinc-300 transition hover:bg-white/5"
        >
          Cancelar
        </button>
      </div>

      {!soportado && (
        <div className="rounded-xl border border-amber-300/20 bg-amber-300/[0.06] p-4">
          <p className="text-sm font-semibold text-amber-200">
            Alternativa: código QR
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            Si tu celular no tiene lector NFC, escanea el código QR impreso en
            tu tarjeta VibeMatch o solicítalo en inspectoría.
          </p>
        </div>
      )}
    </section>
  );
}