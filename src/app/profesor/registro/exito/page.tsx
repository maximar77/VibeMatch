import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { formatearCodigo } from "@/lib/teacher-schema";
import { LimpiarCodigoRegistro } from "@/components/limpiar-codigo-registro";

export const instant = false;

export const metadata: Metadata = {
  title: "Código personal generado · VibeMatch",
  robots: { index: false, follow: false },
};

export default async function ProfesorRegistroExitoPage() {
  const cookieStore = await cookies();
  const codigo = cookieStore.get("vm_profe_registro")?.value;

  if (!codigo) {
    redirect("/profesor/registro");
  }

  return (
    <div className="bg-ink text-zinc-50 min-h-screen flex items-center justify-center">
      <LimpiarCodigoRegistro />
      <div className="glass rounded-[2rem] border border-white/10 p-8 sm:p-12 max-w-md w-full mx-5 text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="h-10 w-auto" />
          <span className="text-xl font-bold tracking-[0.18em]">
            VIBE<span className="text-brand-strong">•</span>MATCH
          </span>
        </div>
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-white">
          Cuenta docente creada
        </h1>
        <p className="mb-6 text-sm text-zinc-400">
          Guarda este código personal. No se mostrará nuevamente.
        </p>
        <div className="mb-6 rounded-2xl border border-brand-strong/40 bg-brand-strong/10 px-6 py-4">
          <p className="font-mono text-2xl tracking-[0.4em] text-white">
            {formatearCodigo(codigo)}
          </p>
        </div>
        <p className="mb-8 text-xs text-zinc-500">
          Úsalo para iniciar sesión en el panel docente.
        </p>
        <Link
          href="/profesor/login"
          className="inline-flex rounded-full bg-brand-strong px-6 py-3.5 text-sm font-semibold text-ink transition hover:bg-brand-strong/85"
        >
          Ir a iniciar sesión
        </Link>
      </div>
    </div>
  );
}
