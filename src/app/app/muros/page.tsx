import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { leerSesion } from "@/lib/cards";
import { MUROS, contarTodas, listarPublicaciones } from "@/lib/muros";

export const metadata: Metadata = {
  title: "Muros y fotos · VibeMatch",
  robots: { index: false, follow: false },
};

function Cargando() {
  return (
    <AppShell active="muros">
      <main className="relative z-10 flex flex-1 items-center justify-center px-5">
        <div className="glass w-full max-w-md rounded-[2rem] p-8 text-center">
          <p className="text-sm text-zinc-400">Cargando muros…</p>
        </div>
      </main>
    </AppShell>
  );
}

export default function MurosPage() {
  return (
    <Suspense fallback={<Cargando />}>
      <ContenidoMuros />
    </Suspense>
  );
}

async function ContenidoMuros() {
  const acceso = await leerSesion();
  if (!acceso || acceso.card.kind === "public") redirect("/");

  const conteo = contarTodas();

  return (
    <AppShell active="muros">
      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-5 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-brand-soft">
              Muros de la comunidad
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              Comparte tu <span className="text-gradient">vibe</span>.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-400">
              Textos, fotos y proyectos en tableros por tema. Cada muro es un lugar
              distinto para mostrar lo que te mueve.
            </p>
          </div>
          <Link
            href="/app/chat"
            className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white transition hover:border-white/35 hover:bg-white/5"
          >
            ← Volver a las canchitas
          </Link>
        </div>

        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MUROS.map((muro) => {
            const ultimas = listarPublicaciones(muro.id, 1);
            const ultima = ultimas[0] ?? null;
            return (
              <Link
                key={muro.id}
                href={`/app/muros/${muro.id}`}
                className={`group relative flex min-h-[13rem] flex-col justify-between overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br p-6 transition hover:-translate-y-0.5 hover:border-white/20 ${muro.color}`}
              >
                <div className="pointer-events-none absolute inset-0 grid-bg opacity-30" aria-hidden="true" />
                <div className="relative">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-3xl">{muro.emoji}</span>
                    <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/60">
                      {conteo[muro.id] ?? 0} publicacion
                      {(conteo[muro.id] ?? 0) === 1 ? "" : "es"}
                    </span>
                  </div>
                  <h2 className="mt-4 text-2xl font-bold text-white">{muro.nombre}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-white/65">
                    {muro.descripcion}
                  </p>
                </div>
                <div className="relative mt-6 flex items-center justify-between gap-3">
                  <p className="truncate text-[11px] text-white/45">
                    {ultima ? `Último: ${ultima.usuarioNombre}` : "Sé el primero en publicar"}
                  </p>
                  <span className="text-sm font-semibold text-white">Abrir →</span>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </AppShell>
  );
}
