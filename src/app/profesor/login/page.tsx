import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { leerProfesorSesion } from "@/lib/teachers";
import { entrarProfesorAction } from "@/app/profesor-actions";

export const metadata: Metadata = {
  title: "Acceso Docente · VibeMatch",
  robots: { index: false, follow: false },
};

/** Si ya hay sesión activa, redirigir al panel de asistencia. */
export default async function ProfesorLoginPage() {
  const profesor = await leerProfesorSesion();
  if (profesor) {
    redirect("/profesor/asistencia");
  }
  return (
    <div className="bg-ink text-zinc-50 min-h-screen flex items-center justify-center">
      <div className="glass rounded-[2rem] border border-white/10 p-8 sm:p-12 max-w-md w-full mx-5"> 








      <div className="glass rounded-[2rem] border border-white/10 p-8 sm:p-12 max-w-md w-full mx-5">
          <div className="flex items-center gap-2 mb-6">
            <span className="h-10 w-auto" />
            <span className="text-xl font-bold tracking-[0.18em]">
              VIBE<span className="text-brand-strong">•</span>MATCH
            </span>
          </div>
          <h1 className="mb-2 text-2xl font-bold tracking-tight text-white">
            Acceso Docente
          </h1>
          <p className="mb-8 text-sm text-zinc-400">
            Ingresa tu código personal de 6 caracteres para acceder al panel
            docente.
          </p>
          <form action={entrarProfesorAction} className="space-y-4">
            <label className="flex flex-col gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                Código personal
              </span>
              <input
                name="codigo"
                type="text"
                required
                maxLength={6}
                minLength={6}
                pattern="[A-Z0-9]{6}"
                autoCapitalize="characters"
                placeholder="ABC123"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-brand-strong/60 focus:ring-2 focus:ring-brand-strong/20"
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-full bg-brand-strong px-6 py-3.5 text-sm font-semibold text-ink transition hover:bg-brand-strong/85"
            >
              Entrar al panel docente
            </button>
          </form>
          <p className="mt-6 text-center text-xs text-zinc-500">
            Código entregado por la dirección del establecimiento.
          </p>
        </div>
      </div>
    </div>
  );
}