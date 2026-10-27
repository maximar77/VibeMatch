"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import type { MensajeChat } from "@/lib/chat";
import { etiquetaVibe } from "@/lib/profile-schema";

function hora(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Santiago",
  });
}

function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("") || "VM";
}

type Props = {
  canal: string;
  usuarioId: string;
  mensajesIniciales: MensajeChat[];
};

export function ChatPanel({ canal, usuarioId, mensajesIniciales }: Props) {
  const [mensajes, setMensajes] = useState<MensajeChat[]>(mensajesIniciales);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const finRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const contenedor = finRef.current?.parentElement;
    if (contenedor) contenedor.scrollTop = contenedor.scrollHeight;
  }, [mensajes]);

  useEffect(() => {
    let activo = true;
    let temporizador: ReturnType<typeof setTimeout> | null = null;

    const cargar = async () => {
      try {
        const respuesta = await fetch(`/api/chat/${canal}`, {
          cache: "no-store",
        });
        if (respuesta.ok) {
          const data = (await respuesta.json()) as { mensajes: MensajeChat[] };
          if (activo) setMensajes(data.mensajes);
        }
      } catch {
        // El siguiente intento se encarga cuando vuelva la conexión.
      } finally {
        if (activo) temporizador = setTimeout(cargar, 5000);
      }
    };

    temporizador = setTimeout(cargar, 5000);
    return () => {
      activo = false;
      if (temporizador) clearTimeout(temporizador);
    };
  }, [canal]);

  const enviar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const limpio = texto.trim();
    if (!limpio || enviando) return;

    setEnviando(true);
    setError(null);
    setAviso(null);

    try {
      const respuesta = await fetch(`/api/chat/${canal}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ texto: limpio }),
      });
      const data = (await respuesta.json()) as {
        mensaje?: MensajeChat;
        filtrado?: boolean;
        motivo?: string;
        error?: string;
      };

      if (!respuesta.ok || !data.mensaje) {
        setError(data.error ?? "No se pudo enviar el mensaje.");
        return;
      }

      const nuevo = data.mensaje;
      setMensajes((actuales) => {
        if (actuales.some((mensaje) => mensaje.id === nuevo.id)) {
          return actuales;
        }
        return [...actuales, nuevo];
      });
      setTexto("");
      if (data.filtrado) {
        setAviso(data.motivo ?? "El mensaje fue moderado antes de publicarse.");
      }
    } catch {
      setError("Sin conexión. Tu mensaje no se envió.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="grid gap-4">
      <div className="glass flex h-[58vh] min-h-[24rem] flex-col overflow-hidden rounded-[2rem]">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <span className="flex items-center gap-2 text-xs text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {mensajes.length} mensaje{mensajes.length === 1 ? "" : "s"} en esta canchita
          </span>
          <span className="text-[10px] uppercase tracking-widest text-zinc-600">
            Se actualiza sola
          </span>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-5">
          {mensajes.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-xl">
                💬
              </div>
              <p className="mt-3 text-sm font-medium text-zinc-300">
                Todavía no hay mensajes.
              </p>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-zinc-500">
                Saluda, comparte un plan o pregunta quién se suma. Aquí empieza la
                conversación.
              </p>
            </div>
          )}

          {mensajes.map((mensaje) => {
            const propio = mensaje.usuarioId === usuarioId;
            return (
              <div
                key={mensaje.id}
                className={`flex gap-2.5 ${propio ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[10px] font-bold ${
                    propio
                      ? "bg-brand-strong text-ink"
                      : "border border-white/10 bg-white/[0.05] text-zinc-300"
                  }`}
                >
                  {iniciales(mensaje.usuarioNombre)}
                </div>
                <div className={`max-w-[78%] ${propio ? "text-right" : ""}`}>
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-left text-sm leading-relaxed ${
                      propio
                        ? "rounded-tr-sm bg-brand-strong/20 text-brand-50"
                        : "rounded-tl-sm border border-white/10 bg-white/[0.04] text-zinc-200"
                    }`}
                  >
                    <p>{mensaje.texto}</p>
                  </div>
                  <p className={`mt-1 text-[10px] text-zinc-600 ${propio ? "pr-1" : "pl-1"}`}>
                    {propio ? "Tú" : mensaje.usuarioNombre}
                    {" · "}
                    {hora(mensaje.timestamp)}
                    {mensaje.usuarioVibe ? ` · ${etiquetaVibe(mensaje.usuarioVibe)}` : ""}
                    {mensaje.filtrado ? " · moderado" : ""}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={finRef} />
        </div>
      </div>

      {error && (
        <p className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-2 text-sm text-rose-200">
          {error}
        </p>
      )}
      {aviso && (
        <p className="rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-sm text-amber-100">
          {aviso}
        </p>
      )}

      <form
        onSubmit={enviar}
        className="glass flex items-end gap-2 rounded-[2rem] p-3"
      >
        <label className="sr-only" htmlFor="mensaje-chat">
          Escribe un mensaje
        </label>
        <textarea
          id="mensaje-chat"
          value={texto}
          onChange={(event) => setTexto(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          maxLength={500}
          rows={1}
          placeholder="Escribe un mensaje…"
          className="max-h-32 min-h-[2.75rem] flex-1 resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-brand-strong/60 focus:ring-2 focus:ring-brand-strong/20"
        />
        <button
          type="submit"
          disabled={enviando || !texto.trim()}
          className="rounded-full bg-brand-strong px-5 py-3 text-sm font-semibold text-ink transition hover:bg-brand-strong/85 disabled:opacity-50"
        >
          {enviando ? "…" : "Enviar"}
        </button>
      </form>
      <p className="text-center text-[10px] leading-relaxed text-zinc-600">
        Respeta a tu comunidad. Los mensajes pasan por un filtro básico de convivencia.
      </p>
    </div>
  );
}
