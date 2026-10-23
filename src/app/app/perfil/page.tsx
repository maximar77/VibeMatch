import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { CacheProfile } from "@/components/cache-profile";
import { ProfileForm } from "@/components/profile-form";
import { SyncStatus } from "@/components/sync-status";
import { leerSesion } from "@/lib/cards";
import { leerPerfil } from "@/lib/profiles";

export const metadata: Metadata = {
  title: "Editar perfil · VibeMatch",
  robots: { index: false, follow: false },
};

function Cargando() {
  return (
    <AppShell active="perfil">
      <main className="relative z-10 flex flex-1 items-center justify-center px-5">
        <div className="glass w-full max-w-md rounded-[2rem] p-8 text-center">
          <p className="text-sm text-zinc-400">Cargando tu perfil…</p>
        </div>
      </main>
    </AppShell>
  );
}

export default function EditarPerfilPage() {
  return (
    <Suspense fallback={<Cargando />}>
      <ContenidoPerfil />
    </Suspense>
  );
}

async function ContenidoPerfil() {
  const acceso = await leerSesion();

  if (!acceso || acceso.card.kind === "public") {
    redirect("/");
  }

  const perfil = leerPerfil(acceso.card.id);
  if (!perfil) {
    redirect("/app");
  }

  return (
    <AppShell active="perfil">
      <CacheProfile perfil={perfil} />
      <main className="relative z-10 mx-auto w-full max-w-3xl flex-1 px-5 py-12">
        <SyncStatus />
        <Link
          href="/app"
          className="text-xs font-medium text-zinc-400 transition hover:text-white"
        >
          ← Volver a Mi VibeMatch
        </Link>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-brand-soft">
              Tu identidad en VibeMatch
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight">
              Editar <span className="text-gradient">perfil</span>.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-400">
              Estos datos se guardan con tu tarjeta {acceso.card.id} y se cargarán
              cuando entres a la app desde otro dispositivo.
            </p>
          </div>
        </div>

        <section className="glass mt-8 rounded-[2rem] p-6 sm:p-8">
          <ProfileForm
            initial={perfil}
            fallbackLevel={acceso.card.level}
            submitLabel="Guardar cambios"
          />
        </section>
      </main>
    </AppShell>
  );
}
