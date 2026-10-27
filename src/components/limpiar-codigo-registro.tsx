"use client";

import { useEffect } from "react";

/**
 * El código docente vive en una cookie httpOnly solo hasta que esta pantalla
 * se renderiza. Al montar, borramos la cookie con un route handler para que no
 * pueda volver a mostrarse al recargar o navegar hacia atrás.
 */
export function LimpiarCodigoRegistro() {
  useEffect(() => {
    void fetch("/profesor/registro/exito/limpiar", {
      method: "POST",
      cache: "no-store",
    }).catch(() => {
      // Si falla, la cookie caduca sola en 10 minutos.
    });
  }, []);

  return null;
}
