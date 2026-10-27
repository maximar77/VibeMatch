import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { leerProfesorSesion } from "@/lib/teachers";
import { obtenerAnotaciones } from "@/app/profesor-actions";
import { salirProfesorAction } from "@/app/profesor-actions";
import { ProfesorExportLinks } from "@/components/profesor-export-links";

export const instant = false;

export const metadata: Metadata = {
  title: "Anotaciones · VibeMatch Docente",
  robots: { index: false, follow: false },
};

export default async function AnotacionesPage({
  searchParams,
}: {
  searchParams?: Promise<{ tipo?: string }>;
}) {
  const profesor = await leerProfesorSesion();
  if (!profesor) redirect("/profesor/login");

  const params = searchParams ? await searchParams : {};
  const tipo =
    params.tipo === "positiva" || params.tipo === "negativa"
      ? params.tipo
      : undefined;
  const anotaciones = await obtenerAnotaciones({ tipo });

  const positivas = anotaciones.filter((item) => item.tipo === "positiva").length;
  const negativas = anotaciones.length - positivas;

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
            <Link
              href="/profesor/escanear"
              className="rounded-full bg-brand-strong px-4 py-2 text-xs font-semibold text-ink hover:bg-brand-strong/85"
            >
              Escanear
            </Link>
            <Link
              href="/profesor/asistencia"
              className="rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/5"
            >
              Asistencia
            </Link>
            <Link
              href="/profesor/banio"
              className="rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/5"
            >
              Baño
            </Link>
            <form action={salirProfesorAction}>
              <button
                type="submit"
                className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/5"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-brand-soft">
              Convivencia y seguimiento
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">
              Anotaciones — {profesor.curso}
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              {positivas} positiva{positivas === 1 ? "" : "s"} · {negativas}{" "}
              negativa{negativas === 1 ? "" : "s"}
            </p>
          </div>
          <ProfesorExportLinks curso={profesor.curso} />
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {[
            { href: "/profesor/anotaciones", label: "Todas" },
            { href: "/profesor/anotaciones?tipo=positiva", label: "Positivas" },
            { href: "/profesor/anotaciones?tipo=negativa", label: "Negativas" },
          ].map((filtro) => (
            <Link
              key={filtro.href}
              href={filtro.href}
              className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                (filtro.label === "Todas" && !tipo) ||
                (filtro.label === "Positivas" && tipo === "positiva") ||
                (filtro.label === "Negativas" && tipo === "negativa")
                  ? "border-brand-strong/50 bg-brand-strong/15 text-white"
                  : "border-white/10 text-zinc-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              {filtro.label}
            </Link>
          ))}
        </div>

        <div className="mt-6 grid gap-3">
          {anotaciones.length === 0 ? (
            <div className="glass rounded-[2rem] p-10 text-center">
              <p className="text-3xl">📝</p>
              <p className="mt-3 text-sm font-medium text-zinc-300">
                Todavía no hay anotaciones para este curso.
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Elige “Anotación positiva” o “negativa” en Escanear y toca la
                tarjeta del alumno.
              </p>
            </div>
          ) : (
            [...anotaciones]
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
              .map((anotacion) => (
                <article
                  key={anotacion.id}
                  className={`rounded-[1.5rem] border p-5 ${
                    anotacion.tipo === "positiva"
                      ? "border-emerald-400/20 bg-emerald-400/[0.04]"
                      : "border-rose-400/20 bg-rose-400/[0.04]"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {anotacion.nombre || anotacion.cardId}
                      </p>
                      <p className="mt-1 text-xs text-zinc-400">
                        N° {anotacion.numeroLista ?? "—"} · {anotacion.curso} ·{" "}
                        {anotacion.fecha} {anotacion.hora}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                          anotacion.tipo === "positiva"
                            ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
                            : "border-rose-400/25 bg-rose-400/10 text-rose-300"
                        }`}
                      >
                        {anotacion.tipo}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] text-zinc-400">
                        {anotacion.categoria}
                      </span>
                    </div>
                  </div>
                  <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-300">
                    {anotacion.comentario}
                  </p>
                </article>
              ))
          )}
        </div>
      </main>
    </div>
  );
}
