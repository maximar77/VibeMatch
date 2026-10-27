import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { SecurityPanel } from "@/components/security-panel";
import { leerSesion } from "@/lib/cards";
import { leerPerfil } from "@/lib/profiles";
import { estadoSeguridad } from "@/lib/student-security";

export const metadata: Metadata = {
  title: "Seguridad de mi cuenta · VibeMatch",
  robots: { index: false, follow: false },
};

function Cargando() {
  return (
    <AppShell active="seguridad">
      <main className="relative z-10 flex flex-1 items-center justify-center px-5">
        <div className="glass w-full max-w-md rounded-[2rem] p-8 text-center">
          <p className="text-sm text-zinc-400">Revisando la seguridad de tu cuenta…</p>
        </div>
      </main>
    </AppShell>
  );
}

export default function SeguridadPage() {
  return (
    <Suspense fallback={<Cargando />}>
      <ContenidoSeguridad />
    </Suspense>
  );
}

async function ContenidoSeguridad() {
  const acceso = await leerSesion();
  if (!acceso || acceso.card.kind === "public") redirect("/");

  const perfil = leerPerfil(acceso.card.id);
  const estado = estadoSeguridad(acceso.card.id);

  return (
    <AppShell active="seguridad">
      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-5 py-12">
        <Link
          href="/app"
          className="text-xs font-medium text-zinc-400 transition hover:text-white"
        >
          ← Volver a Mi VibeMatch
        </Link>
        <p className="mt-7 font-mono text-xs uppercase tracking-[0.3em] text-brand-soft">
          Cuenta y privacidad
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          Tu clave, <span className="text-gradient">tu control</span>.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400">
          Añade una clave opcional para que el enlace de tu tarjeta no sea
          suficiente para entrar. Puedes cambiarla o quitarla cuando quieras.
        </p>

        <div className="mt-9">
          <SecurityPanel
            protegida={estado.protegida}
            actualizadaEn={estado.actualizadaEn}
            nombre={perfil?.displayName ?? "tu cuenta"}
          />
        </div>
      </main>
    </AppShell>
  );
}
