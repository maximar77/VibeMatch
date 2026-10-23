import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ProfileForm } from "@/components/profile-form";
import { iniciales, leerSesion } from "@/lib/cards";
import { leerPerfil } from "@/lib/profiles";
import { etiquetaVibe } from "@/lib/profile-schema";

export const metadata: Metadata = {
  title: "Mi VibeMatch",
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
          <span className="font-mono text-sm tracking-[0.2em] text-zinc-400">VIBEMATCH</span>
        </div>
      </header>
      <main className="relative z-10 flex flex-1 items-center justify-center px-5">
        <div className="glass w-full max-w-md rounded-[2rem] p-8 text-center">
          <div className="mx-auto h-10 w-10 animate-pulse rounded-full border border-brand-strong/40 bg-brand-strong/15" />
          <p className="mt-5 text-sm text-zinc-400">Cargando tu perfil…</p>
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

  if (!acceso || acceso.card.kind === "public") {
    redirect("/");
  }

  const { card, school } = acceso;
  const perfil = leerPerfil(card.id);

  if (!perfil) {
    return (
      <AppShell active="app">
        <main className="relative z-10 mx-auto w-full max-w-5xl flex-1 px-5 py-12">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-strong/25 bg-brand-strong/10 px-3 py-1 text-xs font-medium text-brand-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-strong" />
              Último paso · perfil pendiente
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
              Tarjeta {card.id}
            </span>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-brand-soft">
                Bienvenido/a a VibeMatch
              </p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
                Crea tu <span className="text-gradient">perfil</span>.
              </h1>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-zinc-400">
                Tu tarjeta ya está verificada. Cuéntanos cómo quieres aparecer y qué
                te mueve. Guardaremos estos datos para que puedas cargarlos después
                en la app de Android, Windows o en la web instalada.
              </p>

              <dl className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <dt className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                    Establecimiento
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-white">{school}</dd>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <dt className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                    Curso de la tarjeta
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-white">
                    {card.level ?? "Sin asignar"}
                  </dd>
                </div>
              </dl>

              <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-5">
                <p className="text-sm font-semibold text-amber-200">
                  Tu privacidad primero
                </p>
                <p className="mt-1 text-xs leading-relaxed text-amber-100/70">
                  Solo pedimos lo necesario para tu perfil. Puedes editar o revisar
                  estos datos después desde “Mi VibeMatch”. Si usas un equipo
                  compartido, cierra sesión al terminar.
                </p>
              </div>
            </div>

            <section className="glass rounded-[2rem] p-6 sm:p-8">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-brand-soft">
                Tu identidad en VibeMatch
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight">
                ¿Cómo quieres que te vean?
              </h2>
              <p className="mt-2 text-sm text-zinc-400">
                Los campos con * son obligatorios. Podrás cambiarlos más adelante.
              </p>
              <ProfileForm
                fallbackName={card.holder}
                fallbackLevel={card.level}
                submitLabel="Guardar y entrar"
              />
            </section>
          </div>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell active="app">
      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-5 py-12">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-brand-soft">
              Perfil guardado
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              Hola, <span className="text-gradient">{perfil.displayName}</span>.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-400">
              Este es tu espacio en VibeMatch. Tu tarjeta te da acceso y tu perfil
              viaja con tu cuenta para que la app lo cargue en cualquier dispositivo.
            </p>
          </div>
          <Link
            href="/app/perfil"
            className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white transition hover:border-white/35 hover:bg-white/5"
          >
            Editar perfil
          </Link>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <section className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-brand/20 via-surface to-surface p-6">
            <div className="flex items-center gap-4">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-soft text-lg font-bold text-white">
                {iniciales(perfil.displayName)}
                <span className="absolute inset-0 animate-ring rounded-2xl border border-white/40" />
              </div>
              <div>
                <p className="text-xl font-semibold">{perfil.displayName}</p>
                <p className="text-xs text-zinc-400">
                  {[perfil.pronouns, perfil.level, school].filter(Boolean).join(" · ")}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-brand-soft/20 bg-brand-soft/10 p-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-brand-soft/80">
                Vibe check
              </p>
              <p className="mt-1 text-sm font-medium text-brand-strong">
                {etiquetaVibe(perfil.vibe)}
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                Actualízalo cuando quieras desde tu perfil.
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {perfil.interests.map((interested) => (
                <span
                  key={interested}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300"
                >
                  {interested}
                </span>
              ))}
            </div>

            {perfil.bio ? (
              <p className="mt-5 text-sm leading-relaxed text-zinc-400">“{perfil.bio}”</p>
            ) : null}

            <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-zinc-500">
              <span>Tarjeta {card.id}</span>
              <span className="flex items-center gap-1.5 text-zinc-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Verificada
              </span>
            </div>
          </section>

          <div className="grid content-start gap-6">
            <section className="relative overflow-hidden rounded-[2rem] border border-brand-strong/25 bg-gradient-to-br from-brand/30 via-surface to-brand-soft/20 p-6">
              <div className="pointer-events-none absolute inset-0 grid-bg" aria-hidden="true" />
              <div className="relative">
                <p className="font-mono text-xs uppercase tracking-[0.25em] text-brand-soft">
                  App VibeMatch
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight">
                  Lleva tu perfil contigo.
                </h2>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-300">
                  Instala la web app en iPhone, Mac, Android o Windows. Tu perfil y
                  tu tarjeta ya están listos; las versiones APK y EXE están en
                  preparación.
                </p>
                <Link
                  href="/app/instalar"
                  className="mt-5 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-zinc-200"
                >
                  Ver instalación
                </Link>
              </div>
            </section>

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
    </AppShell>
  );
}
