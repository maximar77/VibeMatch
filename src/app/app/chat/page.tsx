import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { leerSesion } from "@/lib/cards";
import { CANALES_CHAT, listarMensajes } from "@/lib/chat";

export const metadata: Metadata = {
  title: "Canchitas de chat · VibeMatch",
  robots: { index: false, follow: false },
};

const estilos = [
  "from-orange-400/20 to-rose-500/10 text-orange-200",
  "from-fuchsia-400/20 to-violet-500/10 text-fuchsia-200",
  "from-cyan-400/20 to-blue-500/10 text-cyan-200",
  "from-lime-300/20 to-emerald-500/10 text-lime-200",
];

function Cargando() {
  return (
    <AppShell active="chat">
      <main className="relative z-10 flex flex-1 items-center justify-center px-5">
        <div className="glass w-full max-w-md rounded-[2rem] p-8 text-center">
          <p className="text-sm text-zinc-400">Cargando canchitas…</p>
        </div>
      </main>
    </AppShell>
  );
}

export default function ChatListPage() {
  return (
    <Suspense fallback={<Cargando />}>
      <ContenidoChats />
    </Suspense>
  );
}

async function ContenidoChats() {
  const acceso = await leerSesion();
  if (!acceso || acceso.card.kind === "public") redirect("/");

  const canales = CANALES_CHAT.map((canal) => {
    const mensajes = listarMensajes(canal.id, 100);
    return {
      ...canal,
      total: mensajes.length,
      ultimo: mensajes[mensajes.length - 1] ?? null,
    };
  });

  return (
    <AppShell active="chat">
      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-5 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-brand-soft">
              Salas de chat
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              Tus <span className="text-gradient">canchitas</span>.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-400">
              Conversaciones por interés para armar equipo, compartir proyectos o
              estudiar en comunidad. Entra a la que te mueva.
            </p>
          </div>
          <Link
            href="/app/muros"
            className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white transition hover:border-white/35 hover:bg-white/5"
          >
            Ver muros y fotos →
          </Link>
        </div>

        <div className="mt-9 grid gap-4 sm:grid-cols-2">
          {canales.map((canal, index) => (
            <Link
              key={canal.id}
              href={`/app/chat/${canal.id}`}
              className={`group relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br p-6 transition hover:-translate-y-0.5 hover:border-white/20 ${estilos[index % estilos.length]}`}
            >
              <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" aria-hidden="true" />
              <div className="relative">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-2xl font-bold text-white">#{canal.nombre}</p>
                    <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/65">
                      {canal.descripcion}
                    </p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/60">
                    {canal.total} msg
                  </span>
                </div>
                <p className="mt-6 text-xs text-white/50">
                  {canal.ultimo
                    ? `Último: ${canal.ultimo.usuarioNombre} · ${new Date(
                        canal.ultimo.timestamp,
                      ).toLocaleDateString("es-CL", { timeZone: "America/Santiago" })}`
                    : "Todavía sin mensajes. Sé el primero."}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-white">
                  Entrar <span aria-hidden="true">→</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </AppShell>
  );
}
