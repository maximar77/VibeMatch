import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { MuroPanel } from "@/components/muro-panel";
import { leerSesion } from "@/lib/cards";
import { esMuroId, infoMuro, listarPublicaciones } from "@/lib/muros";

export const metadata: Metadata = {
  title: "Muro · VibeMatch",
  robots: { index: false, follow: false },
};

function Cargando() {
  return (
    <AppShell active="muros">
      <main className="relative z-10 flex flex-1 items-center justify-center px-5">
        <div className="glass w-full max-w-md rounded-[2rem] p-8 text-center">
          <p className="text-sm text-zinc-400">Abriendo el muro…</p>
        </div>
      </main>
    </AppShell>
  );
}

export default function MuroPage({
  params,
}: {
  params: Promise<{ muro: string }>;
}) {
  return (
    <Suspense fallback={<Cargando />}>
      <ContenidoMuro params={params} />
    </Suspense>
  );
}

async function ContenidoMuro({ params }: { params: Promise<{ muro: string }> }) {
  const acceso = await leerSesion();
  if (!acceso || acceso.card.kind === "public") redirect("/");

  const { muro } = await params;
  if (!esMuroId(muro)) redirect("/app/muros");

  const info = infoMuro(muro);
  const publicaciones = listarPublicaciones(muro);

  return (
    <AppShell active="muros">
      <main className="relative z-10 mx-auto w-full max-w-4xl flex-1 px-5 py-8 sm:py-12">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/app/muros"
            className="text-xs font-medium text-zinc-400 transition hover:text-white"
          >
            ← Todos los muros
          </Link>
          <Link
            href="/app/chat"
            className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-white/5"
          >
            Ir a las canchitas
          </Link>
        </div>

        <div className="mb-6 flex items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-2xl">
            {info.emoji}
          </span>
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-brand-soft">
              Muro de la comunidad
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {info.nombre}
            </h1>
            <p className="mt-2 text-sm text-zinc-400">{info.descripcion}</p>
          </div>
        </div>

        <MuroPanel
          muro={muro}
          nombreMuro={info.nombre}
          emoji={info.emoji}
          publicacionesIniciales={publicaciones}
        />
      </main>
    </AppShell>
  );
}
