"use client";

import { useEffect } from "react";
import type { Perfil } from "@/lib/profile-schema";
import { guardarPerfilLocal, leerPendiente } from "@/lib/offline-profile";

type Props = {
  perfil: Perfil;
};

/**
 * Guarda una copia local del perfil la primera vez que se ve online.
 *
 * Nunca pisa cambios locales pendientes: si hay una edición esperando
 * sincronización, el servidor no debe sobrescribirla.
 */
export function CacheProfile({ perfil }: Props) {
  useEffect(() => {
    const guardar = async () => {
      const pendiente = await leerPendiente();
      if (pendiente) return;
      await guardarPerfilLocal(perfil, false);
    };
    void guardar();
  }, [perfil]);

  return null;
}
