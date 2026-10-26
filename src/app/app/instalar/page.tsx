import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { InstallPanel } from "@/components/install-panel";
import { leerSesion } from "@/lib/cards";
import { leerPerfil } from "@/lib/profiles";
import { detectPlatformFromUserAgent } from "@/lib/platform";

export const metadata: Metadata = {
  title: "Instalar VibeMatch",
  robots: { index: false, follow: false },
};

function Cargando() {
  return (
    <AppShell active="instalar">
      <main className="relative z-10 flex flex-1 items-center justify-center px-5">
        <div className="glass w-full max-w-md rounded-[2rem] p-8 text-center">
          <p className="text-sm text-zinc-400">Preparando la instalación…</p>
        </div>
      </main>
    </AppShell>
  );
}

export default function InstalarPage() {
  return (
    <Suspense fallback={<Cargando />}>
      <ContenidoInstalar />
    </Suspense>
  );
}

async function ContenidoInstalar() {
  const acceso = await leerSesion();

  if (!acceso || acceso.card.kind === "public") {
    redirect("/");
  }

  const perfil = leerPerfil(acceso.card.id);
  if (!perfil) {
    redirect("/app");
  }

  const userAgent = (await headers()).get("user-agent") ?? "";
  const platform = detectPlatformFromUserAgent(userAgent);

  return (
    <AppShell active="instalar">
      <main className="relative z-10 mx-auto w-full max-w-5xl flex-1 px-5 py-12">
        <Link
          href="/app"
          className="text-xs font-medium text-zinc-400 transition hover:text-white"
        >
          ← Volver a Mi VibeMatch
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-start">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-brand-soft">
              Instalación
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              Lleva VibeMatch <span className="text-gradient">contigo</span>.
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-zinc-400">
              Tu perfil ya está creado y tu tarjeta está verificada. Instala la web
              app para abrir VibeMatch como una aplicación, sin depender de la barra
              del navegador.
            </p>

            <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.03] p-6">
              <InstallPanel initialPlatform={platform} />
            </section>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-sm font-semibold text-white">Tu perfil viaja contigo</p>
                <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                  La app carga tu nombre, curso, vibe e intereses desde la misma
                  cuenta asociada a la tarjeta {acceso.card.id}.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-sm font-semibold text-white">Puedes desinstalarla</p>
                <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                  Si es un equipo compartido, elimina el icono al terminar. Tu perfil
                  no se borra: sigue guardado en tu cuenta.
                </p>
              </div>
            </div>
          </div>

          <aside className="grid content-start gap-6">
            <section className="rounded-[2rem] border border-brand-strong/20 bg-gradient-to-br from-brand/20 via-surface to-surface p-6">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-brand-soft">
                Apps nativas
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight">
                Android y Windows, con NFC.
              </h2>
              <div className="mt-5 grid gap-3">
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div>
                    <p className="text-sm font-medium text-white">Android · APK</p>
                    <p className="mt-1 text-xs text-zinc-400">
                      NFC y QR en tablets del colegio; requiere conexión al servidor
                    </p>
                  </div>
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-200">
                    Disponible
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div>
                    <p className="text-sm font-medium text-white">Windows · EXE</p>
                    <p className="mt-1 text-xs text-zinc-400">
                      Lector NFC y panel del profesor para escritorio
                    </p>
                  </div>
                  <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-200">
                    En preparación
                  </span>
                </div>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-zinc-400">
                La APK 1.0.0 añade lectura NFC y QR para tablets institucionales y se
                instala por MDM o por el equipo de VibeMatch; no hay un botón de descarga
                pública. El perfil se cachea en el dispositivo, pero las acciones
                escolares requieren conexión. El EXE de Windows sigue en preparación.
              </p>
            </section>

            <section className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-5">
              <p className="text-sm font-semibold text-amber-200">
                Equipos del colegio
              </p>
              <p className="mt-1 text-xs leading-relaxed text-amber-100/70">
                Si instalas la app en un equipo compartido, cierra sesión al terminar.
                La sesión expira automáticamente a las 8 horas.
              </p>
            </section>
          </aside>
        </div>
      </main>
    </AppShell>
  );
}
