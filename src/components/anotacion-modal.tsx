"use client";

import { useState } from "react";
import {
  CATEGORIAS_ANOTACION,
  type CategoriaAnotacion,
} from "@/lib/school-schema";

type Props = {
  cardId: string;
  curso?: string;
  open: boolean;
  onClose: () => void;
  onRegistrada?: () => void;
};

export function AnotacionModal({
  cardId,
  curso = "",
  open,
  onClose,
  onRegistrada,
}: Props) {
  const [tipo, setTipo] = useState<"positiva" | "negativa">("positiva");
  const [categoria, setCategoria] = useState<CategoriaAnotacion>("Otro");
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const alEnviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEnviando(true);

    const formData = new FormData();
    formData.append("cardId", cardId);
    formData.append("tipo", tipo);
    formData.append("categoria", categoria);
    formData.append("comentario", comentario);
    formData.append("curso", curso);
    formData.append("fecha", new Date().toISOString().slice(0, 10));
    formData.append("hora", new Date().toTimeString().slice(0, 5));
    formData.append("registradoPor", "profesor");

    try {
      const res = await fetch("/app/profesor-actions", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.ok) {
        setEnviando(false);
        onRegistrada?.();
        onClose();
      } else {
        setError(data.error || "Error al registrar la anotación.");
        setEnviando(false);
      }
    } catch {
      setError("Error de red al registrar la anotación.");
      setEnviando(false);
    }
  };

  const colorTipo =
    tipo === "positiva"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
      : "border-rose-400/20 bg-rose-400/10 text-rose-300";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass w-full max-w-md rounded-[2rem] p-6 mx-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">
            {tipo === "positiva" ? "Anotación positiva" : "Anotación negativa"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-zinc-400 hover:text-white hover:bg-white/5"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={alEnviar} className="space-y-4">
          <div className="flex gap-2">
            <label className="flex-1 cursor-pointer rounded-xl border p-3 text-center transition">
              <input
                type="radio"
                name="tipo"
                value="positiva"
                checked={tipo === "positiva"}
                onChange={() => setTipo("positiva")}
                className="sr-only"
              />
              <span
                className={`block text-xs font-semibold ${colorTipo}`}
              >
                + Positiva
              </span>
            </label>
            <label className="flex-1 cursor-pointer rounded-xl border p-3 text-center transition">
              <input
                type="radio"
                name="tipo"
                value="negativa"
                checked={tipo === "negativa"}
                onChange={() => setTipo("negativa")}
                className="sr-only"
              />
              <span
                className={`block text-xs font-semibold ${tipo === "negativa" ? colorTipo : "text-zinc-500"}`}
              >
                − Negativa
              </span>
            </label>
          </div>

          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500 block mb-1">
              Categoría
            </label>
            <select
              value={categoria}
              onChange={(e) =>
                setCategoria(e.target.value as CategoriaAnotacion)
              }
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-brand-strong/60"
            >
              {CATEGORIAS_ANOTACION.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500 block mb-1">
              Comentario
            </label>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              rows={3}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-brand-strong/60"
              placeholder="Describe la conducta observada..."
            />
          </div>

          {error && (
            <p className="text-xs text-rose-400/80">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-4 py-2 text-sm font-semibold text-zinc-300 hover:bg-white/5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="rounded-full bg-brand-strong px-6 py-2.5 text-sm font-semibold text-ink transition hover:bg-brand-strong/85 disabled:opacity-60"
            >
              {enviando ? "Guardando…" : "Registrar anotación"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}