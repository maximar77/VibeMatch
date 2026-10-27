import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { leerProfesorSesion } from "@/lib/teachers";
import { salirProfesorAction } from "@/app/profesor-actions";
import { ProfesorExportLinks } from "@/components/profesor-export-links";
import { ProfesorScanPanel } from "@/components/profesor-scan-panel";

export const instant = false;

export const metadata: Metadata = {
  title: "Escanear alumno · VibeMatch Docente",
  robots: { index: false, follow: false },
};

const enlaces = [
  { href: "/profesor/asistencia", label: "Asistencia" },
  { href: "/profesor/banio", label: "Baño" },
  { href: "/profesor/anotaciones", label: "Anotaciones" },
];

export default async function EscanearPage() {
  const profesor = await leerProfesorSesion();
  if (!profesor) redirect("/profesor/login");

  return (
    <div className="min-h-screen bg-ink text-zinc-50">
      <header className="sticky top-0 z-20 border-b border-white/5 bg-ink/70 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3">
          <span className="text-xl font-bold tracking-[0.18em]">
            VIBE<span className="text-brand-strong">•</span>MATCH
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-zinc-400">
              {profesor.nombre} · {profesor.curso}
            </span>
            <nav className="flex items-center gap-1">
              {enlaces.map((enlace) => (
                <Link
                  key={enlace.href}
                  href={enlace.href}
                  className="rounded-full px-3 py-2 text-xs font-medium text-zinc-400 transition hover:bg-white/5 hover:text-white"
                >
                  {enlace.label}
                </Link>
              ))}
            </nav>
            <form action={salirProfesorAction}>
              <button
                type="submit"
                className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-white/5"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-5 py-12">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-brand-soft">
              Panel docente
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">
              Escanear alumno
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
              Elige primero la acción, luego escanea la tarjeta. Cada registro
              guarda nombre, número de lista, curso, fecha y hora.
            </p>
          </div>
        </div>
        <ProfesorExportLinks curso={profesor.curso} className="mb-7" />
        <ProfesorScanPanel cursoProfesor={profesor.curso} />
      </main>
    </div>
  );
}
