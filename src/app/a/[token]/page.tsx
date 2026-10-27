import type { Metadata } from "next";
import { Suspense } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { AccessDenied } from "@/components/access-denied";
import { LandingPage } from "@/components/landing-page";
import { validarToken, type Acceso, aplicarDatosTarjeta } from "@/lib/cards";
import { leerPerfil } from "@/lib/profiles";
import { tieneClaveEstudiante } from "@/lib/student-security";
import { entrarAction } from "@/app/actions";

export const metadata: Metadata = {
  title: "Acceso por tarjeta · VibeMatch",
  description: "Bienvenida para tarjetas NFC y códigos QR únicos de VibeMatch.",
  robots: { index: false, follow: false },
};

export default function AccesoPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{
    nombre?: string;
    curso?: string;
    nro?: string;
    error?: string;
  }>;
}) {
  return (
    <Suspense fallback={<CargandoAcceso />}>
      <AccesoContenido params={params} searchParams={searchParams} />
    </Suspense>
  );
}

function CargandoAcceso() {
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
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
            Acceso por tarjeta
          </span>
        </div>
      </header>
      <main className="relative z-10 flex flex-1 items-center justify-center px-5 py-14">
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
      </main>
    </div>
  );
}

async function AccesoContenido({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{
    nombre?: string;
    curso?: string;
    nro?: string;
    error?: string;
  }>;
}) {
  const { token } = await params;
  const sp = await searchParams;
  const acceso = validarToken(token);

  if (!acceso) {
    return (
      <AccessDenied
        badge="Enlace no válido"
        title="Este enlace no abre una tarjeta activa."
        message="El código puede estar incompleto, haber sido revocado o pertenecer a una tarjeta que ya fue reemplazada."
        detail="Pide ayuda en inspectoría o al equipo de convivencia de tu colegio. No compartas el enlace de tu tarjeta con otras personas."
      />
    );
  }

  // Nuevo método: si la URL trae datos de usuario, se aplican a la tarjeta como base.
  const nombreParam = sp?.nombre ? decodeURIComponent(sp.nombre) : null;
  const cursoParam = sp?.curso ? decodeURIComponent(sp.curso) : null;
  const nroParam = sp?.nro ? Number(sp.nro) : null;

  if (nombreParam || cursoParam || nroParam) {
    aplicarDatosTarjeta(token, {
      nombre: nombreParam,
      curso: cursoParam,
      nro: nroParam,
    });
    // Reflejar en la vista inmediatamente.
    if (nombreParam) {
      acceso.card.holder = nombreParam;
      acceso.card.fullName = nombreParam;
    }
    if (cursoParam) {
      acceso.card.level = cursoParam;
      acceso.card.course = cursoParam;
    }
    if (nroParam !== null && !Number.isNaN(nroParam)) {
      acceso.card.listNumber = nroParam;
    }
  }

  // El token genérico muestra la landing pública con los contactos para pedir
  // el kit. Nunca crea sesión ni pide perfil.
  if (acceso.card.kind === "public") {
    return <LandingPage />;
  }

  return <Bienvenida token={token} acceso={acceso} error={sp.error} />;
}

function Bienvenida({
  token,
  acceso,
  error,
}: {
  token: string;
  acceso: Acceso;
  error?: string;
}) {
  const { card, school } = acceso;
  const perfil = leerPerfil(card.id);
  const nombre = perfil?.displayName ?? card.holder;
  const protegida = tieneClaveEstudiante(card.id);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-bg" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -top-32 left-1/2 h-[30rem] w-[46rem] -translate-x-1/2 rounded-full bg-brand/20 blur-[120px]"
        aria-hidden="true"
      />

      <header className="relative z-10 border-b border-white/5 bg-ink/60 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-5">
          <BrandLogo href={`/a/${token}`} />
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Acceso verificado
          </span>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-5 py-14">
        <div className="w-full max-w-xl">
          <section className="glass rounded-[2rem] p-7 sm:p-9">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Tarjeta verificada
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
                {card.id}
              </span>
            </div>

            <p className="mt-8 font-mono text-xs uppercase tracking-[0.3em] text-brand-soft">
              Bienvenido/a a VibeMatch
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              {nombre ? (
                <>
                  Hola, <span className="text-gradient">{nombre}</span>.
                </>
              ) : (
                <>
                  Tu tarjeta está <span className="text-gradient">lista</span>.
                </>
              )}
            </h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-zinc-400">
              {perfil
                ? "Tu perfil ya está creado. Entra para revisar tu vibe, tus intereses, tus chats y los muros de tu comunidad."
                : "Esta tarjeta abrió un acceso único a la comunidad VibeMatch de tu establecimiento. Al entrar podrás crear tu perfil y, si quieres, protegerlo con una clave."}
            </p>

            {protegida && (
              <div className="mt-5 flex items-center gap-2 rounded-2xl border border-sky-400/25 bg-sky-400/10 px-4 py-3 text-xs text-sky-200">
                <span className="text-base" aria-hidden="true">🔒</span>
                <span>Esta cuenta tiene una clave adicional. Ingrésala para continuar.</span>
              </div>
            )}

            {error === "clave" && (
              <p className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-2 text-sm text-rose-200">
                La clave no es correcta. Inténtalo nuevamente.
              </p>
            )}

            <dl className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <dt className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                  Establecimiento
                </dt>
                <dd className="mt-1 text-sm font-medium text-white">{school}</dd>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <dt className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                  Curso
                </dt>
                <dd className="mt-1 text-sm font-medium text-white">
                  {perfil?.level || card.level || "Sin asignar"}
                </dd>
              </div>
            </dl>

            <form action={entrarAction} className="mt-8 space-y-3">
              <input type="hidden" name="token" value={token} />
              {protegida && (
                <label className="block">
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                    Clave de la cuenta
                  </span>
                  <input
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    maxLength={64}
                    placeholder="••••••"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-brand-strong/60 focus:ring-2 focus:ring-brand-strong/20"
                  />
                </label>
              )}
              <button
                type="submit"
                className="w-full rounded-full bg-brand-strong px-6 py-3.5 text-sm font-semibold text-ink transition hover:bg-brand-strong/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-strong"
              >
                {perfil ? "Entrar a mi VibeMatch" : "Entrar y crear mi perfil"}
              </button>
            </form>

            <p className="mt-5 text-xs leading-relaxed text-zinc-500">
              Al entrar, este dispositivo recordará tu sesión por 8 horas. Si es un
              equipo compartido del colegio, cierra sesión al terminar. El enlace con
              token es personal: no lo compartas.
            </p>
          </section>

          <p className="mt-6 text-center text-xs text-zinc-600">
            Acceso por tarjeta única · Funciona en Puntos Vibe y equipos institucionales
          </p>
        </div>
      </main>
    </div>
  );
}
