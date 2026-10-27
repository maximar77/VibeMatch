import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { CacheProfile } from "@/components/cache-profile";
import { ProfileForm } from "@/components/profile-form";
import { RestoreLocalProfile } from "@/components/restore-local-profile";
import { ShareProfileButton } from "@/components/share-profile-button";
import { SyncStatus } from "@/components/sync-status";
import { iniciales, leerSesion } from "@/lib/cards";
import { leerPerfil } from "@/lib/profiles";
import { etiquetaVibe } from "@/lib/profile-schema";
import { CANALES_CHAT } from "@/lib/chat";
import { MUROS, contarTodas } from "@/lib/muros";
import { estadoSeguridad } from "@/lib/student-security";

export const metadata: Metadata = {
  title: "Mi VibeMatch",
  robots: { index: false, follow: false },
};

export const instant = false;

const iconosChat: Record<string, string> = {
  deportes: "⚽",
  arte: "🎨",
  videojuegos: "🎮",
  estudio: "📚",
};

const acciones = [
  {
    href: "/app/chat",
    icono: "💬",
    titulo: "Canchitas de chat",
    texto: "Conversa por intereses y arma equipo.",
  },
  {
    href: "/app/muros",
    icono: "📸",
    titulo: "Muros y fotos",
    texto: "Publica textos, proyectos y momentos.",
  },
  {
    href: "/app/seguridad",
    icono: "🔒",
    titulo: "Clave opcional",
    texto: "Añade una segunda llave a tu cuenta.",
  },
  {
    href: "/app/perfil-offline",
    icono: "📥",
    titulo: "Copia sin conexión",
    texto: "Guarda tu perfil en este dispositivo.",
  },
] as const;

function Cargando() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5">
      <div className="pointer-events-none absolute inset-0 grid-bg" aria-hidden="true" />
      <div className="glass relative z-10 w-full max-w-md rounded-[2rem] p-8 text-center">
        <div className="mx-auto h-10 w-10 animate-pulse rounded-full border border-brand-strong/40 bg-brand-strong/15" />
        <p className="mt-5 text-sm text-zinc-400">Cargando tu VibeMatch…</p>
      </div>
    </div>
  );
}

export default function AppPage({
  searchParams,
}: {
  searchParams: Promise<{ perfil?: string }>;
}) {
  return (
    <Suspense fallback={<Cargando />}>
      <ContenidoApp searchParams={searchParams} />
    </Suspense>
  );
}

async function ContenidoApp({
  searchParams,
}: {
  searchParams: Promise<{ perfil?: string }>;
}) {
  const acceso = await leerSesion();
  if (!acceso || acceso.card.kind === "public") redirect("/");

  const perfil = leerPerfil(acceso.card.id);
  const params = await searchParams;

  if (!perfil) {
    return (
      <AppShell active="app">
        <main className="relative z-10 mx-auto w-full max-w-3xl flex-1 px-5 py-12">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-brand-soft">
            Tarjeta {acceso.card.id} activa
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Crea tu <span className="text-gradient">VibeMatch</span>.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-400">
            Elige cómo quieres que te llamen, tu vibe y tus intereses. Podrás
            cambiar todo después desde tu perfil.
          </p>

          <RestoreLocalProfile cardId={acceso.card.id} />

          <section className="glass mt-8 rounded-[2rem] p-6 sm:p-8">
            <ProfileForm
              initial={null}
              fallbackName={acceso.card.fullName ?? acceso.card.holder}
              fallbackLevel={acceso.card.level}
              submitLabel="Crear mi perfil"
            />
          </section>
        </main>
      </AppShell>
    );
  }

  const seguridad = estadoSeguridad(acceso.card.id);
  const conteoMuros = contarTodas();
  const nombreVisible = perfil.displayName;

  return (
    <AppShell active="app">
      <CacheProfile perfil={perfil} />
      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-5 py-9 sm:py-12">
        <SyncStatus />

        {params.perfil === "guardado" && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
            <span>Perfil guardado. Ya apareces en tu comunidad.</span>
            <Link
              href="/app/seguridad"
              className="rounded-full bg-emerald-300 px-3 py-1.5 text-xs font-bold text-ink transition hover:bg-emerald-200"
            >
              Proteger con clave
            </Link>
          </div>
        )}

        <section className="relative mt-6 overflow-hidden rounded-[2.4rem] border border-white/10 bg-white/[0.035] p-6 sm:p-8">
          <div
            className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-brand/20 blur-[90px]"
            aria-hidden="true"
          />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.35rem] bg-gradient-to-br from-brand to-brand-soft text-xl font-bold text-white shadow-lg shadow-brand/20">
                {iniciales(nombreVisible)}
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-brand-soft">
                  Tu perfil
                </p>
                <h1 className="mt-1 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Hola, {nombreVisible}.
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-brand-strong/25 bg-brand-strong/10 px-3 py-1 text-xs font-semibold text-brand-soft">
                    {etiquetaVibe(perfil.vibe)}
                  </span>
                  {perfil.level && (
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-300">
                      {perfil.level}
                    </span>
                  )}
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-500">
                    {acceso.card.id}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/app/perfil"
                className="rounded-full bg-brand-strong px-4 py-2.5 text-xs font-semibold text-ink transition hover:bg-brand-strong/85"
              >
                Editar perfil
              </Link>
              <Link
                href="/app/seguridad"
                className="rounded-full border border-white/15 px-4 py-2.5 text-xs font-semibold text-white transition hover:border-white/35 hover:bg-white/5"
              >
                {seguridad.protegida ? "🔒 Clave activa" : "🔓 Poner clave"}
              </Link>
            </div>
          </div>

          {perfil.bio && (
            <p className="relative mt-6 max-w-3xl text-sm leading-relaxed text-zinc-300">
              “{perfil.bio}”
            </p>
          )}

          <div className="relative mt-5 flex flex-wrap gap-2">
            {perfil.interests.map((interes) => (
              <span
                key={interes}
                className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1 text-[11px] text-zinc-400"
              >
                {interes}
              </span>
            ))}
          </div>

          <ShareProfileButton perfil={perfil} establecimiento={acceso.school} />
        </section>

        <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {acciones.map((accion) => (
            <Link
              key={accion.href}
              href={accion.href}
              className="group rounded-[1.6rem] border border-white/10 bg-white/[0.025] p-5 transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.05]"
            >
              <span className="text-xl">{accion.icono}</span>
              <p className="mt-3 text-sm font-semibold text-white">{accion.titulo}</p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">{accion.texto}</p>
              <span className="mt-3 inline-block text-xs font-semibold text-brand-soft opacity-0 transition group-hover:opacity-100">
                Abrir →
              </span>
            </Link>
          ))}
        </section>

        {!seguridad.protegida && (
          <section className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-[1.6rem] border border-amber-300/20 bg-amber-300/[0.06] px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-amber-100">
                Tu cuenta todavía no tiene clave.
              </p>
              <p className="mt-1 text-xs leading-relaxed text-amber-100/60">
                Es opcional. Sirve para que el enlace de tu tarjeta no sea suficiente
                si alguien lo encuentra.
              </p>
            </div>
            <Link
              href="/app/seguridad"
              className="rounded-full bg-amber-300 px-4 py-2 text-xs font-bold text-ink transition hover:bg-amber-200"
            >
              Crear clave
            </Link>
          </section>
        )}

        <div className="mt-10 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-brand-soft">
              Comunidad
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
              Tus canchitas
            </h2>
          </div>
          <Link
            href="/app/chat"
            className="text-xs font-semibold text-zinc-400 transition hover:text-white"
          >
            Ver todas →
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CANALES_CHAT.map((canal) => (
            <Link
              key={canal.id}
              href={`/app/chat/${canal.id}`}
              className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 transition hover:border-brand-strong/30 hover:bg-brand-strong/[0.06]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-lg">{iconosChat[canal.id] ?? "💬"}</span>
                <span className="text-[10px] uppercase tracking-wider text-zinc-600">
                  Chat
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold text-white">#{canal.nombre}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
                {canal.descripcion}
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-brand-soft">
              Para mostrar
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
              Tus muros
            </h2>
          </div>
          <Link
            href="/app/muros"
            className="text-xs font-semibold text-zinc-400 transition hover:text-white"
          >
            Ver todos →
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MUROS.map((muro) => (
            <Link
              key={muro.id}
              href={`/app/muros/${muro.id}`}
              className={`rounded-[1.5rem] border border-white/10 bg-gradient-to-br p-5 transition hover:-translate-y-0.5 hover:border-white/20 ${muro.color}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xl">{muro.emoji}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/45">
                  {conteoMuros[muro.id] ?? 0} publicacion
                  {(conteoMuros[muro.id] ?? 0) === 1 ? "" : "es"}
                </span>
              </div>
              <p className="mt-3 text-base font-bold text-white">{muro.nombre}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-white/60">
                {muro.descripcion}
              </p>
            </Link>
          ))}
        </div>

        <section className="mt-5 rounded-[1.6rem] border border-white/10 bg-white/[0.025] px-5 py-4 text-xs leading-relaxed text-zinc-500">
          Tu perfil también queda guardado en este teléfono o navegador. Si el
          servidor de la demo se reinicia, al volver a entrar intentaremos
          restaurarlo automáticamente.
        </section>
      </main>
    </AppShell>
  );
}
