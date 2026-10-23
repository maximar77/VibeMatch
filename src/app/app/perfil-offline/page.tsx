import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { OfflineProfilePanel } from "@/components/offline-profile-panel";

export const metadata: Metadata = {
  title: "Mi perfil · VibeMatch",
  robots: { index: false, follow: false },
};

/**
 * Pantalla de perfil offline.
 *
 * Se renderiza sin datos del servidor: el componente cliente lee el perfil
 * guardado en el dispositivo y permite verlo, editarlo y compartirlo aunque
 * no haya conexión.
 */
export default function PerfilOfflinePage() {
  return (
    <AppShell active="perfil">
      <main className="relative z-10 mx-auto w-full max-w-3xl flex-1 px-5 py-12">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-brand-soft">
          Mi VibeMatch
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">
          Tu <span className="text-gradient">perfil</span> en el dispositivo.
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-400">
          Esta vista funciona con la copia local de tu perfil. Puedes revisarla,
          editarla y compartirla incluso sin conexión; los cambios se sincronizan
          cuando vuelvas a tener red.
        </p>

        <OfflineProfilePanel />
      </main>
    </AppShell>
  );
}
