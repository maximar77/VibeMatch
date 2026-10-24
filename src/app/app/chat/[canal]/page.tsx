import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { leerSesion } from "@/lib/cards";
import { leerPerfil } from "@/lib/profiles";
import { CANALES_CHAT, type CanalChat } from "@/lib/chat";

export const metadata: Metadata = {
  title: "Canchita de chat · VibeMatch",
  robots: { index: false, follow: false },
};

function Cargando() {
  return (
    <AppShell active="app">
      <main className="relative z-10 flex flex-1 items-center justify-center px-5">
        <div className="glass w-full max-w-md rounded-[2rem] p-8 text-center">
          <div className="mx-auto h-10 w-10 animate-pulse rounded-full border border-brand-strong/40 bg-brand-strong/15" />
          <p className="mt-4 text-sm text-zinc-400">Cargando canchita…</p>
        </div>
      </main>
    </AppShell>
  );
}

export default function ChatCanalPage({
  params,
}: {
  params: { canal: string };
}) {
  return (
    <Suspense fallback={<Cargando />}>
      <ContenidoChat params={params} />
    </Suspense>
  );
}

async function ContenidoChat({ params }: { params: { canal: string } }) {
  const acceso = await leerSesion();
  if (!acceso || acceso.card.kind === "public") {
    redirect("/");
  }

  const { canal } = await params;
  const canalInfo = CANALES_CHAT.find((c) => c.id === canal);
  if (!canalInfo) {
    redirect("/app");
  }

  const perfil = leerPerfil(acceso.card.id);

  return (
    <AppShell active="app">
      <main className="relative z-10 mx-auto w-full max-w-4xl flex-1 px-5 py-12">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-brand-soft">
              Canchita de chat
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">
              #{canalInfo.nombre}
            </h1>
            <p className="mt-2 text-sm text-zinc-400">{canalInfo.descripcion}</p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${
                perfil?.vibe === "busco-equipo"
                  ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                  : perfil?.vibe === "modo-estudio"
                  ? "border-amber-300/20 bg-amber-300/10 text-amber-300"
                  : "border-white/10 bg-white/[0.03] text-zinc-400"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full" />
              {etiquetaVibe(perfil?.vibe ?? "conversar")}
            </span>
          </div>
        </div>

        {/* Área de mensajes */}
        <div className="glass rounded-[2rem] p-4 h-[500px] overflow-y-auto flex flex-col-reverse gap-3">
          <div className="text-center text-xs text-zinc-500 mt-auto">
            No hay mensajes aún. Sé el primero en saludar.
          </div>
        </div>

        {/* Formulario de envío */}
        <form
          className="mt-6 glass rounded-[2rem] p-4 flex gap-3"
          action="#"
        >
          <input
            type="text"
            name="texto"
            placeholder="Escribe un mensaje…"
            className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-brand-strong/60"
          />
          <button
            type="submit"
            className="rounded-full bg-brand-strong px-6 py-3 text-sm font-semibold text-ink transition hover:bg-brand-strong/85"
          >
            Enviar
          </button>
        </form>
      </main>
    </AppShell>
  );
}

function etiquetaVibe(vibe: string): string {
  const etiquetas: Record<string, string> = {
    "busco-equipo": "Busco equipo",
    conversar: "Conversando",
    "modo-estudio": "Modo estudio",
    explorando: "Explorando",
  };
  return etiquetas[vibe] ?? vibe;
}