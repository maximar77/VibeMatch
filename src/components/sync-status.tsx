"use client";

import { useCallback, useEffect, useState } from "react";
import {
  estadoSync,
  hayRed,
  sincronizar,
  traerPerfilRemoto,
  type EstadoSync,
} from "@/lib/offline-profile";

/**
 * Barra de estado de conexión y sincronización.
 *
 * Muestra si el perfil está sincronizado, si hay cambios pendientes y ofrece
 * reintentar manualmente. Al volver la conexión reintenta sola.
 */
export function SyncStatus() {
  const [enLinea, setEnLinea] = useState(() => hayRed());
  const [estado, setEstado] = useState<EstadoSync>("sin_perfil");
  const [sincronizando, setSincronizando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const refrescarEstado = useCallback(async () => {
    setEstado(await estadoSync());
  }, []);

  const intentarSync = useCallback(async () => {
    if (!hayRed()) return;
    setSincronizando(true);
    const resultado = await sincronizar();
    if (resultado.ok) {
      setEstado(await estadoSync());
      setAviso(null);
    } else if (resultado.motivo === "sin_sesion") {
      setAviso("Tu sesión expiró. Vuelve a entrar con tu tarjeta.");
    }
    setSincronizando(false);
  }, []);

  useEffect(() => {
    // Lectura inicial asíncrona (evita setState sincrónico dentro del efecto).
    void (async () => {
      await refrescarEstado();
    })();

    const alConectar = () => {
      setEnLinea(true);
      void intentarSync();
    };
    const alDesconectar = () => setEnLinea(false);

    window.addEventListener("online", alConectar);
    window.addEventListener("offline", alDesconectar);

    // Refresco del perfil remoto cuando hay red y sesión.
    const intervalo = window.setInterval(() => {
      if (hayRed()) void traerPerfilRemoto().then(() => refrescarEstado());
    }, 60_000);

    return () => {
      window.removeEventListener("online", alConectar);
      window.removeEventListener("offline", alDesconectar);
      window.clearInterval(intervalo);
    };
  }, [intentarSync, refrescarEstado]);

  const pendiente = estado === "pendiente";

  if (enLinea && !pendiente && !aviso) {
    return (
      <div className="mb-6 flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.07] px-4 py-2.5 text-xs text-emerald-200">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        Perfil sincronizado con VibeMatch
      </div>
    );
  }

  return (
    <div
      className={`mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-xs ${
        pendiente
          ? "border-amber-300/25 bg-amber-300/[0.08] text-amber-100"
          : "border-sky-400/25 bg-sky-400/[0.08] text-sky-100"
      }`}
    >
      <span className="flex items-center gap-2">
        <span
          className={`h-1.5 w-1.5 rounded-full ${pendiente ? "bg-amber-300" : "bg-sky-400"}`}
        />
        {aviso
          ? aviso
          : pendiente
            ? "Cambios guardados en tu teléfono. Se enviarán al recuperar conexión."
            : "Sin conexión. Puedes ver, editar y compartir tu perfil."}
      </span>

      {pendiente && enLinea ? (
        <button
          type="button"
          onClick={() => void intentarSync()}
          disabled={sincronizando}
          className="rounded-full border border-white/20 px-3 py-1 font-semibold text-white transition hover:bg-white/10 disabled:cursor-wait disabled:opacity-50"
        >
          {sincronizando ? "Sincronizando…" : "Sincronizar ahora"}
        </button>
      ) : null}
    </div>
  );
}
