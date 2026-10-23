import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { NFCScanner } from "@/components/nfc-scanner";
import { leerSesion } from "@/lib/cards";
import { leerPerfil } from "@/lib/profiles";

export const metadata: Metadata = {
  title: "Escanear tarjeta · VibeMatch",
  robots: { index: false, follow: false },
};

function Cargando() {
  return (
    <AppShell active="app">
      <main className="relative z-10 mx-auto w-full max-w-5xl flex-1 px-5 py-12">
        <div className="glass mt-8 rounded-[2rem] p-8 text-center">
          <div className="mx-auto h-10 w-10 animate-pulse rounded-full border border-brand-strong/40 bg-brand-strong/15" />
          <p className="mt-4 text-sm text-zinc-400">Preparando lector NFC…</p>
        </div>
      </main>
    </AppShell>
  );
}

export default function EscanearPage() {
  return (
    <Suspense fallback={<Cargando />}>
      <ContenidoEscanear />
    </Suspense>
  );
}

async function ContenidoEscanear() {
  const acceso = await leerSesion();

  if (!acceso || acceso.card.kind === "public") {
    redirect("/");
  }

  const perfil = leerPerfil(acceso.card.id);

  return (
    <AppShell active="app">
      <main className="relative z-10 mx-auto w-full max-w-5xl flex-1 px-5 py-12">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-brand-soft">
              Lector NFC y QR
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight">
              Escanea tu <span className="text-gradient">tarjeta</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-400">
              Acércate la tarjeta NFC al lector para abrir tu perfil o el panel
              del docente. Si tu celular no tiene NFC, usa el código QR como
              respaldo.
            </p>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
            Tarjeta {acceso.card.id}
          </span>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1fr_1.2fr] lg:items-start">
          <div>
            <NFCScanner
              autoRedirect={false}
              label="Escanear tarjeta NFC"
              onTarjetaLeida={(cardId, accesoLeido) => {
                // El componente ya maneja la redirección si autoRedirect es true.
                // Aquí solo registramos el intento para posibles análisis futuros.
                console.log("[VibeMatch] Tarjeta escaneada:", cardId, accesoLeido?.card.kind);
              }}
            />
          </div>

          <aside className="grid content-start gap-6">
            <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-brand-soft">
                Cómo funciona
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight">
                Dos formas de acceder
              </h2>
              <ol className="mt-5 grid gap-4 text-sm text-zinc-300 list-decimal list-inside">
                <li>
                  <span className="font-semibold text-white">NFC:</span>
                  acerca la tarjeta al lector del dispositivo para abrir tu
                  perfil al instante.
                </li>
                <li>
                  <span className="font-semibold text-white">QR:</span>
                  escanea el código QR de tu tarjeta con la cámara para abrir
                  el enlace de acceso único.
                </li>
              </ol>
            </section>

            {perfil ? (
              <section className="rounded-[2rem] border border-emerald-400/20 bg-emerald-400/10 p-6">
                <p className="font-mono text-xs uppercase tracking-[0.25em] text-emerald-300">
                  Tu perfil
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight">
                  Ya tienes perfil creado
                </h2>
                <p className="mt-2 text-sm text-zinc-300">
                  Tu perfil está asociado a la tarjeta{" "}
                  <span className="font-mono">{acceso.card.id}</span>. Al escanear
                  la tarjeta se abrirá directamente tu vista de Mi VibeMatch.
                </p>
              </section>
            ) : (
              <section className="rounded-[2rem] border border-amber-300/20 bg-amber-300/[0.06] p-6">
                <p className="font-mono text-xs uppercase tracking-[0.25em] text-amber-300">
                  Perfil pendiente
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight">
                  Crea tu perfil
                </h2>
                <p className="mt-2 text-sm text-zinc-300">
                  Al escanear tu tarjeta por primera vez podrás crear tu perfil
                  con nombre, pronombres, curso y vibe.
                </p>
              </section>
            )}
          </aside>
        </section>
      </main>
    </AppShell>
  );
}