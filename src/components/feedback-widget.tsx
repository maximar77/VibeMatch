"use client";

import { useEffect, useRef, useState } from "react";

type Estado = "cerrado" | "abierto" | "enviando" | "ok" | "error";

function obtenerInfo() {
  if (typeof window === "undefined") return {};
  const ua = navigator.userAgent;
  const plataforma = navigator.platform || "";
  let modelo = "desconocido";
  let sistema = "desconocido";

  // Intentar extraer modelo Android
  const m = ua.match(/\(([^;]+);[^)]+\)/);
  if (m) {
    const inner = m[1];
    if (inner.includes("Android")) {
      // Buscar patrón tipo SM-XXXX, Pixel, etc
      const mm = inner.match(/([A-Za-z0-9]+\-[A-Za-z0-9]+|Pixel [0-9a-zA-Z]+|SM-[A-Za-z0-9]+|OnePlus [0-9a-zA-Z]+|M[0-9]{4}|RMX[0-9]+)/);
      if (mm) modelo = mm[1];
      const sm = inner.match(/Android ([0-9.]+)/);
      if (sm) sistema = `Android ${sm[1]}`;
    } else if (inner.includes("iPhone")) {
      modelo = "iPhone";
      const ism = ua.match(/OS ([0-9_]+)/);
      if (ism) sistema = `iOS ${ism[1].replace(/_/g, ".")}`;
    } else if (inner.includes("Mac")) {
      modelo = "Mac";
      sistema = plataforma;
    }
  }

  return {
    userAgent: ua,
    plataforma,
    modelo,
    sistema,
  };
}

export function FeedbackWidget({ cardId }: { cardId?: string | null }) {
  const [estado, setEstado] = useState<Estado>("cerrado");
  const [tipo, setTipo] = useState<"bug" | "sugerencia" | "otro">("bug");
  const [mensaje, setMensaje] = useState("");
  const [email, setEmail] = useState("");
  const [info, setInfo] = useState<ReturnType<typeof obtenerInfo>>({});
  const cerradoRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setInfo(obtenerInfo());
  }, []);

  const enviar = async () => {
    if (!mensaje.trim()) return;
    setEstado("enviando");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          tipo,
          mensaje: mensaje.trim(),
          email: email.trim() || null,
          url: window.location.href,
          cardId: cardId || null,
          ...info,
        }),
      });
      if (res.ok) {
        setEstado("ok");
        setMensaje("");
        setTimeout(() => setEstado("cerrado"), 2000);
      } else {
        setEstado("error");
      }
    } catch {
      setEstado("error");
    }
  };

  if (estado === "cerrado") {
    return (
      <button
        onClick={() => setEstado("abierto")}
        className="fixed bottom-4 right-4 z-50 rounded-full bg-brand-strong px-4 py-2.5 text-sm font-semibold text-ink shadow-lg shadow-brand/20 transition hover:bg-brand-strong/85"
      >
        Reportar error / feedback
      </button>
    );
  }

  return (
    <div
      ref={cerradoRef}
      className="fixed bottom-4 right-4 z-50 w-[min(90vw,320px)] rounded-[1.5rem] border border-white/10 bg-ink/95 p-4 shadow-2xl backdrop-blur-xl"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">Feedback / Reporte</p>
        <button
          onClick={() => setEstado("cerrado")}
          className="text-xs text-zinc-500 hover:text-white"
        >
          Cerrar
        </button>
      </div>
      {estado === "ok" && (
        <p className="mt-3 text-sm text-emerald-300">¡Gracias! Tu reporte se envió.</p>
      )}
      {estado !== "ok" && (
        <>
          <div className="mt-3 flex gap-1.5">
            {(["bug", "sugerencia", "otro"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTipo(t)}
                className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-wider ${
                  tipo === t
                    ? "bg-brand-strong text-ink"
                    : "border border-white/10 text-zinc-400"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <textarea
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            placeholder="Describe el error, pasos para reproducirlo..."
            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-zinc-600"
            rows={4}
            maxLength={1000}
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Correo (opcional)"
            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-zinc-600"
          />
          <div className="mt-2 text-[9px] text-zinc-600">
            Modelo: {info.modelo} · {info.sistema}
          </div>
          {estado === "error" && (
            <p className="mt-2 text-xs text-rose-300">Error al enviar. Intenta de nuevo.</p>
          )}
          <button
            onClick={enviar}
            disabled={estado === "enviando" || !mensaje.trim()}
            className="mt-3 w-full rounded-full bg-brand-strong py-2 text-sm font-semibold text-ink disabled:opacity-50"
          >
            {estado === "enviando" ? "Enviando..." : "Enviar reporte"}
          </button>
        </>
      )}
    </div>
  );
}
