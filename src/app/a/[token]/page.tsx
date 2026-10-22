import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { validarToken } from "@/lib/cards";
import { entrarAction } from "@/app/actions";

export const metadata: Metadata = {
  title: "Acceso por tarjeta · VibeMatch",
  description: "Bienvenida para tarjetas NFC y códigos QR únicos de VibeMatch.",
  robots: { index: false, follow: false },
};

export default function AccesoPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-bg" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -top-32 left-1/2 h-[30rem] w-[46rem] -translate-x-1/2 rounded-full bg-brand/20 blur-[120px]"
        aria-hidden="true"
      />

      <header className="relative z-10 border-b border-white/5 bg-ink/60 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-5">
          <BrandLogo />
          <Link
            href="/"
            className="text-xs font-medium text-zinc-400 transition hover:text-white"
          >
            Ir al sitio público
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-5 py-14">
        <Suspense fallback={<CargandoAcceso />}>
          <AccesoContenido params={params} />
        </Suspense>
      </main>
    </div>
  );
}

function CargandoAcceso() {
  return (
    <div className="w-full max-w-xl">
      <div className="glass rounded-[2rem] p-8 sm:p-10">
        <div className="h-6 w-40 animate-pulse rounded-full bg-white/10" />
        <div className="mt-8 h-12 w-3/4 animate-pulse rounded-xl bg-white/10" />
        <div className="mt-4 h-4 w-full animate-pulse rounded bg-white/5" />
        <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-white/5" />
        <div className="mt-8 h-12 w-full animate-pulse rounded-full bg-white/10" />
      </div>
      <p className="mt-6 text-center text-xs text-zinc-600">Verificando tarjeta…</p>
    </div>
  );
}

async function AccesoContenido({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const acceso = validarToken(token);

  return (
    <div className="w-full max-w-xl">
      {acceso ? (
        <section className="glass rounded-[2rem] p-7 sm:p-9">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Acceso verificado
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
              Tarjeta {acceso.card.id}
            </span>
          </div>

          <p className="mt-8 font-mono text-xs uppercase tracking-[0.3em] text-brand-soft">
            Bienvenido/a a VibeMatch
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            {acceso.card.holder ? (
              <>
                Hola, <span className="text-gradient">{acceso.card.holder}</span>.
              </>
            ) : (
              <>
                Tu tarjeta está <span className="text-gradient">lista</span>.
              </>
            )}
          </h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-zinc-400">
            Esta tarjeta abrió un acceso único a la comunidad VibeMatch de tu
            establecimiento. No necesitas instalar nada ni usar tu celular.
          </p>

          <dl className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <dt className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                Establecimiento
              </dt>
              <dd className="mt-1 text-sm font-medium text-white">{acceso.school}</dd>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <dt className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                Curso
              </dt>
              <dd className="mt-1 text-sm font-medium text-white">
                {acceso.card.level ?? "Sin asignar"}
              </dd>
            </div>
          </dl>

          <form action={entrarAction} className="mt-8">
            <input type="hidden" name="token" value={token} />
            <button
              type="submit"
              className="w-full rounded-full bg-brand-strong px-6 py-3.5 text-sm font-semibold text-ink transition hover:bg-brand-strong/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-strong"
            >
              Entrar a VibeMatch
            </button>
          </form>

          <p className="mt-5 text-xs leading-relaxed text-zinc-500">
            Al entrar, este dispositivo recordará tu sesión por 8 horas. Si es un
            equipo compartido del colegio, cierra sesión al terminar. El enlace con
            token no se comparte.
          </p>
        </section>
      ) : (
        <section className="glass rounded-[2rem] p-7 sm:p-9">
          <span className="inline-flex items-center gap-2 rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-1 text-xs font-medium text-rose-300">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
            Acceso no disponible
          </span>
          <h1 className="mt-8 text-4xl font-bold tracking-tight">
            Este enlace no abre una tarjeta activa.
          </h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-zinc-400">
            El código puede estar incompleto, haber sido revocado o pertenecer a una
            tarjeta que ya fue reemplazada. Pide ayuda en inspectoría o al equipo de
            convivencia de tu colegio.
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/35 hover:bg-white/5"
          >
            Volver al sitio
          </Link>
        </section>
      )}

      <p className="mt-6 text-center text-xs text-zinc-600">
        Acceso por tarjeta única · Funciona en Puntos Vibe y equipos institucionales
      </p>
    </div>
  );
}
