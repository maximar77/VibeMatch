"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Perfil } from "@/lib/profile-schema";
import { guardarPerfilLocal, leerPerfilLocal } from "@/lib/offline-profile";

type Estado =
  | "buscando"
  | "sin_copia"
  | "restaurando"
  | "restaurado"
  | "error";

/**
 * Recupera el perfil que quedó guardado en el teléfono/navegador cuando el
 * servidor perdió los datos (por ejemplo, tras un redeploy de Vercel).
 *
 * La copia local es la fuente de verdad si el servidor responde que no hay
 * perfil para la misma tarjeta. Después de restaurar se refresca la página.
 */
export function RestoreLocalProfile({ cardId }: { cardId: string }) {
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>("buscando");
  const [nombre, setNombre] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;

    const restaurar = async () => {
      const local = await leerPerfilLocal();
      if (!activo) return;

      if (!local || local.perfil.cardId !== cardId) {
        setEstado("sin_copia");
        return;
      }

      setNombre(local.perfil.displayName);
      setEstado("restaurando");

      try {
        const respuesta = await fetch("/api/perfil", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            displayName: local.perfil.displayName,
            pronouns: local.perfil.pronouns,
            level: local.perfil.level,
            vibe: local.perfil.vibe,
            interests: local.perfil.interests,
            bio: local.perfil.bio,
          }),
        });

        if (!activo) return;
        if (!respuesta.ok) {
          setEstado("error");
          return;
        }

        const data = (await respuesta.json()) as { perfil?: Perfil };
        if (data.perfil) {
          await guardarPerfilLocal(data.perfil, false);
        }
        setEstado("restaurado");
        router.refresh();
      } catch {
        if (activo) setEstado("error");
      }
    };

    void restaurar();
    return () => {
      activo = false;
    };
  }, [cardId, router]);

  if (estado === "buscando" || estado === "sin_copia") {
    return (
      <div className="mt-6 rounded-2xl border border-sky-400/20 bg-sky-400/[0.06] p-4 text-sm text-sky-100/80">
        {estado === "buscando"
          ? "Revisando si hay una copia de tu perfil en este dispositivo…"
          : "No encontramos una copia local. Si ya tenías perfil, entra desde el mismo teléfono o navegador donde lo creaste."}
      </div>
    );
  }

  if (estado === "restaurando") {
    return (
      <div className="mt-6 flex items-center gap-3 rounded-2xl border border-brand-strong/25 bg-brand-strong/10 p-4 text-sm text-brand-soft">
        <span className="h-2 w-2 animate-pulse rounded-full bg-brand-strong" />
        Restaurando el perfil de {nombre ?? "tu cuenta"} desde este dispositivo…
      </div>
    );
  }

  if (estado === "restaurado") {
    return (
      <div className="mt-6 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-4 text-sm text-emerald-200">
        Perfil de {nombre ?? "tu cuenta"} recuperado. Actualizando la vista…
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl border border-amber-300/25 bg-amber-300/[0.08] p-4 text-sm text-amber-100/90">
      Encontramos una copia local, pero el servidor no la aceptó. Puedes volver a
      crear tu perfil; la copia seguirá en este dispositivo.
    </div>
  );
}
