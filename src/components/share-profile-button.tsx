"use client";

import { useState } from "react";
import type { Perfil } from "@/lib/profile-schema";
import { etiquetaVibe } from "@/lib/profile-schema";
import { compartirPerfil } from "@/lib/share-native";

type Props = {
  perfil: Perfil;
  establecimiento: string;
};

export function ShareProfileButton({ perfil, establecimiento }: Props) {
  const [estado, setEstado] = useState<"idle" | "generando" | "listo" | "error">("idle");
  const [mensaje, setMensaje] = useState<string | null>(null);

  const texto = `Mi perfil VibeMatch: ${perfil.displayName} · ${etiquetaVibe(
    perfil.vibe,
  )}${perfil.bio ? ` · "${perfil.bio}"` : ""}`;

  const alCompartir = async () => {
    setEstado("generando");
    setMensaje(null);

    const resultado = await compartirPerfil(perfil, establecimiento, texto);

    if (resultado.tipo === "compartido") {
      setEstado("listo");
      setMensaje("Tarjeta compartida.");
    } else if (resultado.tipo === "descargado") {
      setEstado("listo");
      setMensaje(`Imagen guardada como ${resultado.archivo}.`);
    } else if (resultado.tipo === "cancelado") {
      setEstado("idle");
    } else {
      setEstado("error");
      setMensaje(resultado.mensaje);
    }
  };

  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={() => void alCompartir()}
        disabled={estado === "generando"}
        className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-white transition hover:border-white/35 hover:bg-white/10 disabled:cursor-wait disabled:opacity-60"
      >
        {estado === "generando" ? "Generando tarjeta…" : "Compartir mi perfil"}
      </button>

      {mensaje ? (
        <p
          className={`mt-2 text-xs ${estado === "error" ? "text-rose-300" : "text-zinc-400"}`}
          role="status"
        >
          {mensaje}
        </p>
      ) : null}
    </div>
  );
}
