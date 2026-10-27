import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ChatPanel } from "@/components/chat-panel";
import { leerSesion } from "@/lib/cards";
import { leerPerfil } from "@/lib/profiles";
import { CANALES_CHAT, esCanalChat, listarMensajes } from "@/lib/chat";
import { etiquetaVibe } from "@/lib/profile-schema";

export const metadata: Metadata = {
  title: "Canchita de chat · VibeMatch",
  robots: { index: false, follow: false },
};

function Cargando() {
  return (
    <AppShell active="chat">
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
  params: Promise<{ canal: string }>;
}) {
  return (
    <Suspense fallback={<Cargando />}>
      <ContenidoChat params={params} />
    </Suspense>
  );
}

async function ContenidoChat({ params }: { params: Promise<{ canal: string }> }) {
  const acceso = await leerSesion();
  if (!acceso || acceso.card.kind === "public") {
    redirect("/");
  }

  const { canal } = await params;
  if (!esCanalChat(canal)) {
    redirect("/app/chat");
  }

  const canalInfo = CANALES_CHAT.find((item) => item.id === canal)!;
  const perfil = leerPerfil(acceso.card.id);
  const mensajes = listarMensajes(canal);

  return (
    <AppShell active="chat">
      <main className="relative z-10 mx-auto w-full max-w-4xl flex-1 px-5 py-8 sm:py-12">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/app/chat"
            className="text-xs font-medium text-zinc-400 transition hover:text-white"
          >
            ← Todas las canchitas
          </Link>
          <Link
            href="/app/muros"
            className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-white/5"
          >
            Ir a los muros
          </Link>
        </div>

        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
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
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {etiquetaVibe(perfil?.vibe ?? "conversar")}
            </span>
          </div>
        </div>

        <ChatPanel
          canal={canal}
          usuarioId={acceso.card.id}
          mensajesIniciales={mensajes}
        />
      </main>
    </AppShell>
  );
}
