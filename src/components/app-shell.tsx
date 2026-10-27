import type { ReactNode } from "react";
import { AppHeader } from "@/components/app-header";
import { UpdatePrompt } from "@/components/update-prompt";
import { FeedbackWidget } from "@/components/feedback-widget";

type Props = {
  active?: "app" | "perfil" | "chat" | "muros" | "seguridad";
  children: ReactNode;
};

export function AppShell({ active, children }: Props) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-bg" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[30rem] w-[48rem] -translate-x-1/2 rounded-full bg-brand/15 blur-[120px]"
        aria-hidden="true"
      />
      <AppHeader active={active} />
      <UpdatePrompt />
      <FeedbackWidget />
      {children}
      <footer className="relative z-10 border-t border-white/5">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-5 py-6 text-xs text-zinc-600 sm:flex-row">
          <p>VibeMatch · acceso por tarjeta única</p>
          <p>Perfil y preferencias bajo tu control</p>
        </div>
      </footer>
    </div>
  );
}
