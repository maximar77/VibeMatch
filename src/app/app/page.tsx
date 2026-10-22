import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { iniciales, leerSesion } from "@/lib/cards";
import { salirAction } from "@/app/actions";

export const metadata: Metadata = {
  title: "Mi VibeMatch · Sesión por tarjeta",
  robots: { index: false, follow: false },
};

const zonas = [
  {
    name: "Deportes",
    text: "Equipos, torneos y partidos después de clases.",
    accent: "from-orange-400/20 to-rose-500/10 text-orange-300",
  },
  {
    name: "Arte",
    text: "Portafolios, música y proyectos creativos.",
    accent: "from-fuchsia-400/20 to-violet-500/10 text-fuchsia-300",
  },
  {
    name: "Videojuegos",
    text: "Cooperativos, torneos internos y comunidades.",
    accent: "from-cyan-400/20 to-blue-500/10 text-cyan-300",
  },
  {
    name: "Estudio",
    text: "Grupos de repaso y tutorías entre pares.",
    accent: "from-lime-300/20 to-emerald-500/10 text-lime-300",
  },
];

function Cargando() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-bg" aria-hidden="true" />
      <header className="relative z-10 border-b border-white/5">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center px-5">
          <BrandLogo href="/app" />
        </div>
      </header>
      <main className="relative z-10 flex flex-1 items-center justify-center px-5">
        <div className="glass w-full max-w-md rounded-[2rem] p-8 text-center">
          <div className="mx-auto h-10 w-10 animate-pulse rounded-full border border-brand-strong/40 bg-brand-strong/15" />
          <p className="mt-5 text-sm text-zinc-400">Validando tu tarjeta…</p>
        </div>
      </main>
    </div>
  );
}

export default function AppPage() {
  return (
    <Suspense fallback={<Cargando />}>
      <ContenidoApp />
    </Suspense>
  );
}

async function ContenidoApp() {
  const acceso = await leerSesion();

  if (!acceso) {
    redirect("/");
  }

  const { card, school } = acceso;
  const nombre = card.holder ?? "Invitado/a";

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-bg" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[30rem] w-[48rem] -translate-x-1/2 rounded-full bg-brand/15 blur-[120px]"
        aria-hidden="true"
      />

      <header className="relative z-20 border-b border-white/5 bg-ink/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5">
          <BrandLogo href="/app" />
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-medium text-emerald-300 sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Sesión por tarjeta
            </span>
            <form action={salirAction}>
              <button
                type="submit"
                className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-zinc-300 transition hover:border-white/25 hover:bg-white/5 hover:text-white"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-5 py-12">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-brand-soft">
              Acceso verificado
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              Hola, <span className="text-gradient">{nombre}</span>.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-400">
              Ya estás dentro de VibeMatch. Esta sesión viene de tu tarjeta única, no de
              tu teléfono: puedes usar el Punto Vibe o un equipo del colegio.
            </p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
            {card.id}
          </span>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          {/* Tarjeta de perfil */}
          <section className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-brand/20 via-surface to-surface p-6">
            <div className="flex items-center gap-4">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-soft text-lg font-bold text-white">
                {iniciales(card.holder)}
                <span className="absolute inset-0 animate-ring rounded-2xl border border-white/40" />
              </div>
              <div>
                <p className="text-xl font-semibold">{nombre}</p>
                <p className="text-xs text-zinc-400">
                  {card.level ?? "Curso sin asignar"} · {school}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-brand-soft/20 bg-brand-soft/10 p-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-brand-soft/80">
                Vibe check
              </p>
              <p className="mt-1 text-sm font-medium text-brand-strong">
                Buscando equipo de estudio
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                Este estado se actualiza en los Puntos Vibe.
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {["Tecnología", "Básquet", "Música", "Valorant"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-zinc-500">
              <span>{card.createdAt ? "Tarjeta activa" : "Tarjeta de demostración"}</span>
              <span className="flex items-center gap-1.5 text-zinc-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Verificada
              </span>
            </div>
          </section>

          <div className="grid content-start gap-6">
            <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-brand-soft">
                Tu sesión
              </p>
              <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  ["Establecimiento", school],
                  ["Tarjeta", card.id],
                  ["Duración", "8 horas"],
                  ["Acceso", "QR / NFC institucional"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                    <dt className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                      {label}
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-white">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section id="zonas" className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-brand-soft">
                Zonas de interés
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight">
                Elige dónde participar.
              </h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {zonas.map((zona) => (
                  <div
                    key={zona.name}
                    className={`rounded-2xl border border-white/10 bg-gradient-to-br ${zona.accent} p-4`}
                  >
                    <p className="text-sm font-semibold text-white">{zona.name}</p>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-300/80">
                      {zona.text}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-5">
              <p className="text-sm font-semibold text-amber-200">
                Dispositivo compartido
              </p>
              <p className="mt-1 text-xs leading-relaxed text-amber-100/70">
                Si estás en un computador o tablet del colegio, cierra sesión al terminar
                para que la siguiente persona no herede tu tarjeta. La sesión expira sola
                a las 8 horas.
              </p>
            </section>
          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/5">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-5 py-6 text-xs text-zinc-600 sm:flex-row">
          <p>VibeMatch · acceso por tarjeta única</p>
          <p>Ley 21.801: sin celulares personales durante la jornada escolar</p>
        </div>
      </footer>
    </div>
  );
}
