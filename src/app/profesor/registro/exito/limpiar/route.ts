import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * Elimina el código docente de la cookie después de que la pantalla de éxito
 * lo mostró. Es un route handler para no forzar un re-render del Server
 * Component (que ya no tendría código y volvería al formulario).
 */
export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("vm_profe_registro");
  return NextResponse.json({ ok: true }, { headers: { "cache-control": "no-store" } });
}
