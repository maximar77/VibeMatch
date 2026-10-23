"use client";

import { useCallback, useEffect, useState } from "react";
import { OfflineProfileForm } from "@/components/offline-profile-form";
import { ShareProfileButton } from "@/components/share-profile-button";
import { SyncStatus } from "@/components/sync-status";
import {
  leerPerfilLocal,
  sincronizar,
  traerPerfilRemoto,
  type PerfilLocal,
} from "@/lib/offline-profile";
import { etiquetaVibe, type Perfil } from "@/lib/profile-schema";

function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");
}

export function OfflineProfilePanel() {
  const [local, setLocal] = useState<PerfilLocal | null>(null);
  const [cargando, setCargando] = useState(true);

  const recargar = useCallback(async () => {
    setLocal(await leerPerfilLocal());
  }, []);

  useEffect(() => {
    let activo = true;

    const iniciar = async () => {
      // 1) Mostrar lo que ya hay en el dispositivo (rápido, sin red).
      const localInicial = await leerPerfilLocal();
      if (activo && localInicial) {
        setLocal(localInicial);
        setCargando(false);
      }

      // 2) Intentar mejorar con el servidor y enviar pendientes.
      await sincronizar();
      await traerPerfilRemoto();

      if (activo) {
        setLocal(await leerPerfilLocal());
        setCargando(false);
      }
    };

    void iniciar();
    return () => {
      activo = false;
    };
  }, []);

  if (cargando) {
    return (
      <div className="glass mt-8 rounded-[2rem] p-8 text-center">
        <div className="mx-auto h-10 w-10 animate-pulse rounded-full border border-brand-strong/40 bg-brand-strong/15" />
        <p className="mt-4 text-sm text-zinc-400">Buscando tu perfil guardado…</p>
      </div>
    );
  }

  if (!local) {
    return (
      <div className="glass mt-8 rounded-[2rem] p-8 text-center">
        <p className="text-sm text-zinc-300">
          Todavía no hay un perfil guardado en este dispositivo.
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          Entra con tu tarjeta y crea tu perfil; después podrás verlo aquí sin conexión.
        </p>
      </div>
    );
  }

  const perfil: Perfil = local.perfil;

  return (
    <div className="mt-8">
      <SyncStatus />

      <section className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-brand/20 via-surface to-surface p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-soft text-lg font-bold text-white">
            {iniciales(perfil.displayName)}
          </div>
          <div>
            <p className="text-xl font-semibold">{perfil.displayName}</p>
            <p className="text-xs text-zinc-400">
              {[perfil.pronouns, perfil.level].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-brand-soft/20 bg-brand-soft/10 p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-brand-soft/80">
            Vibe check
          </p>
          <p className="mt-1 text-sm font-medium text-brand-strong">
            {etiquetaVibe(perfil.vibe)}
          </p>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {perfil.interests.map((interes) => (
            <span
              key={interes}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300"
            >
              {interes}
            </span>
          ))}
        </div>

        {perfil.bio ? (
          <p className="mt-5 text-sm leading-relaxed text-zinc-400">“{perfil.bio}”</p>
        ) : null}

        <ShareProfileButton perfil={perfil} establecimiento="" />
      </section>

      <section className="glass mt-8 rounded-[2rem] p-6 sm:p-8">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-brand-soft">
          Editar sin conexión
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight">Cambia tu perfil.</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Guardamos tus cambios en el teléfono primero. Si no hay red, se envían
          automáticamente cuando vuelvas a estar en línea.
        </p>
        <OfflineProfileForm perfil={perfil} onGuardado={() => void recargar()} />
      </section>
    </div>
  );
}
