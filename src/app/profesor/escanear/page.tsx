import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { leerProfesorSesion } from "@/lib/teachers";
import { salirProfesorAction, exportarArchivosProfesorAction } from "@/app/profesor-actions";
import { ProfesorScanPanel } from "@/components/profesor-scan-panel";

export const instant = false;

export const metadata: Metadata = {
  title: "Escanear alumno · VibeMatch Docente",
  robots: { index: false, follow: false },
};

export default async function EscanearPage() {
  const profesor = await leerProfesorSesion();
  if (!profesor) redirect("/profesor/login");

  return (
    <div className="min-h-screen bg-ink text-zinc-50">
      <header className="border-b border-white/5 bg-ink/70 backdrop-blur-xl sticky top-0 z-20">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
          <span className="text-xl font-bold tracking-[0.18em]">
            VIBE<span className="text-brand-strong">•</span>MATCH
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">
              {profesor.nombre} · {profesor.curso}
            </span>
            <form action={exportarArchivosProfesorAction}>
              <button type="submit" className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/5">
                Exportar Excel/CSV
              </button>
            </form>
            <form action={salirProfesorAction}>
              <button type="submit" className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/5">
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-5 py-12">
        <h1 className="mb-6 text-3xl font-bold tracking-tight text-white">Escanear alumno</h1>
        <ProfesorScanPanel />
      </main>
    </div>
  );
}