import type { ReactNode } from "react";
import Image from "next/image";
import { BrandLogo } from "@/components/brand-logo";

const iconClass = "h-6 w-6";

const zones: { name: string; text: string; tone: string; icon: ReactNode }[] = [
  {
    name: "Deportes",
    text: "Arma partidos, torneos y equipos con gente de tu colegio.",
    tone: "from-orange-400/20 to-rose-500/10 text-orange-300",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3v18M3 12h18M5.5 5.5c3 3 10 3 13 0M5.5 18.5c3-3 10-3 13 0" />
      </svg>
    ),
  },
  {
    name: "Arte",
    text: "Comparte portafolios, música y proyectos creativos.",
    tone: "from-fuchsia-400/20 to-violet-500/10 text-fuchsia-300",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass}>
        <path d="M12 21a9 9 0 1 1 9-9c0 2.5-2 3.5-4 3.5h-1.5a2.5 2.5 0 0 0-2 4c.7.9.2 1.5-1.5 1.5Z" />
        <circle cx="8" cy="10" r="1" fill="currentColor" />
        <circle cx="12" cy="7.5" r="1" fill="currentColor" />
        <circle cx="15.5" cy="10" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    name: "Videojuegos",
    text: "Encuentra equipo para cooperativos y torneos internos.",
    tone: "from-cyan-400/20 to-blue-500/10 text-cyan-300",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass}>
        <path d="M7 8h10a4 4 0 0 1 3.8 5.2l-1 3.3a2.3 2.3 0 0 1-4.1.6L14 15h-4l-1.7 2.1a2.3 2.3 0 0 1-4.1-.6l-1-3.3A4 4 0 0 1 7 8Z" />
        <path d="M8 11v3M6.5 12.5h3M15.5 11.5h.01M17.5 13.5h.01" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: "Estudio",
    text: "Grupos de repaso y tutorías entre pares.",
    tone: "from-lime-300/20 to-emerald-500/10 text-lime-300",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass}>
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z" />
        <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20M8 7h8M8 10.5h5" strokeLinecap="round" />
      </svg>
    ),
  },
];

const steps = [
  { n: "01", title: "Acerca tu tarjeta", text: "En un Punto Vibe o en el lector del laboratorio. Sin instalar apps ni usar tu celular." },
  { n: "02", title: "Muestra tu vibe", text: "Tu perfil aparece al instante: nombre preferido, pronombres y estado de ánimo." },
  { n: "03", title: "Encuentra tu zona", text: "Coincide en intereses reales y únete a la canchita de chat de tu comunidad." },
];

function Check() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="h-4 w-4">
      <path d="m5 12 4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Home() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-ink/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
          <BrandLogo href="#inicio" />
          <nav className="hidden items-center gap-6 text-sm text-zinc-400 lg:flex">
            <a className="transition hover:text-white" href="#como-funciona">Cómo funciona</a>
            <a className="transition hover:text-white" href="#sin-celular">Sin celular</a>
            <a className="transition hover:text-white" href="#identidad">Identidad</a>
            <a className="transition hover:text-white" href="#zonas">Zonas</a>
            <a className="transition hover:text-white" href="#pack">El pack</a>
            <a className="transition hover:text-white" href="#seguridad">Seguridad</a>
          </nav>
          <a
            href="#pack"
            className="rounded-full bg-brand-strong px-4 py-2 text-sm font-semibold text-ink transition hover:bg-brand-strong/85"
          >
            Quiero mi pack
          </a>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section id="inicio" className="relative">
          <div className="pointer-events-none absolute inset-0 grid-bg" aria-hidden="true" />
          <div
            className="pointer-events-none absolute -top-40 left-1/2 h-[34rem] w-[54rem] -translate-x-1/2 rounded-full bg-brand/20 blur-[120px]"
            aria-hidden="true"
          />
          <div className="relative mx-auto grid w-full max-w-6xl gap-14 px-5 pb-24 pt-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:pt-28">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-300">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-strong" />
                Proyecto escolar · Colegio Superior del Maipo
              </span>
              <h1 className="mt-6 text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
                Conecta por lo que <span className="text-gradient">te mueve</span>.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-400">
                VibeMatch une lo físico y lo digital: acerca tu tarjeta, muestra tu vibe y
                encuentra a quienes comparten tus intereses. Sin métricas vacías, sin
                presión social.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href="#como-funciona"
                  className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink transition hover:bg-zinc-200"
                >
                  Ver cómo funciona
                </a>
                <a
                  href="#zonas"
                  className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/35 hover:bg-white/5"
                >
                  Explorar zonas
                </a>
              </div>
              <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-white/10 pt-6">
                {[
                  ["4", "zonas de interés"],
                  ["+12", "años recomendados"],
                  ["100%", "pack reciclable"],
                ].map(([value, label]) => (
                  <div key={label}>
                    <dt className="text-2xl font-bold text-white">{value}</dt>
                    <dd className="mt-1 text-xs leading-snug text-zinc-500">{label}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Tarjeta / perfil */}
            <div className="relative mx-auto w-full max-w-sm">
              <div
                className="absolute inset-0 -z-10 rounded-[2.5rem] bg-gradient-to-br from-brand/40 via-brand-soft/20 to-brand-strong/20 blur-2xl"
                aria-hidden="true"
              />
              <div className="animate-float relative rounded-[2rem] p-[1px]">
                <div className="glass rounded-[2rem] p-6">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-400">
                      Vibe Card
                    </span>
                    <div className="flex items-center gap-1 text-brand-strong">
                      <span className="h-4 w-4 rounded-full border border-brand-strong/60" />
                      <span className="h-4 w-4 rounded-full border border-brand-strong/40" />
                      <span className="h-4 w-4 rounded-full border border-brand-strong/20" />
                    </div>
                  </div>

                  <div className="mt-8 flex items-center gap-4">
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-soft font-bold text-white">
                      MO
                      <span className="absolute inset-0 rounded-2xl border border-white/40 animate-ring" />
                    </div>
                    <div>
                      <p className="text-xl font-semibold">Maximo</p>
                      <p className="text-xs text-zinc-400">él · 1° Medio · Nuevo en la comunidad</p>
                    </div>
                  </div>

                  <div className="mt-6 rounded-2xl border border-brand-soft/20 bg-brand-soft/10 p-3">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-brand-soft/80">Vibe check</p>
                    <p className="mt-1 text-sm font-medium text-brand-strong">Buscando equipo de estudio</p>
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
                    <span>ID · VM-0427</span>
                    <span className="flex items-center gap-1.5 text-zinc-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Perfil verificado
                    </span>
                  </div>
                </div>
              </div>
              <p className="mt-5 text-center text-xs text-zinc-500">
                Acércala a un Punto Vibe o escanea el QR de respaldo. Sin celular.
              </p>
            </div>
          </div>
        </section>

        {/* Cómo funciona */}
        <section id="como-funciona" className="border-y border-white/5 bg-white/[0.02]">
          <div className="mx-auto w-full max-w-6xl px-5 py-20">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-brand-soft">Cómo funciona</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
              Tres pasos entre el patio y tu comunidad.
            </h2>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {steps.map((step) => (
                <div
                  key={step.n}
                  className="group rounded-3xl border border-white/10 bg-surface/60 p-7 transition hover:border-white/20 hover:bg-surface"
                >
                  <span className="font-mono text-sm text-brand">{step.n}</span>
                  <h3 className="mt-5 text-xl font-semibold">{step.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-400">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Sin celular / Ley 21.801 */}
        <section id="sin-celular" className="relative overflow-hidden border-b border-white/5 bg-surface">
          <div
            className="pointer-events-none absolute -left-24 top-10 h-80 w-80 rounded-full bg-brand/15 blur-[100px]"
            aria-hidden="true"
          />
          <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-5 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-brand-soft">
                Ley 21.801 · sin celulares en la jornada
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                La comunidad no depende de un celular.
              </h2>
              <p className="mt-5 max-w-xl text-zinc-400">
                La ley prohíbe el uso de dispositivos personales durante la jornada
                escolar. VibeMatch se diseñó al revés: la llave es una tarjeta única y los
                puntos de acceso son del establecimiento.
              </p>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-500">
                La excepción de uso pedagógico y los espacios autorizados en enseñanza
                media dependen del reglamento interno de cada colegio. Nada de esto exige
                que un estudiante use su teléfono.
              </p>
              <a
                href="#pack"
                className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-white/35 hover:bg-white/5"
              >
                Ver el pack
                <span aria-hidden="true">→</span>
              </a>
            </div>

            <div className="grid gap-4">
              {[
                [
                  "Puntos Vibe",
                  "Tablets o minipCs en biblioteca, patio cubierto o inspectoría. Modo kiosco, lector NFC y sesión que expira sola.",
                ],
                [
                  "Laboratorio y PCs",
                  "Acceso desde los computadores del colegio con lector NFC USB. El mismo flujo funcionará en la app de escritorio.",
                ],
                [
                  "Tarjeta única + QR",
                  "Cada tarjeta tiene un token irrepetible. El QR impreso abre la misma bienvenida en equipos sin lector NFC.",
                ],
              ].map(([title, text], index) => (
                <article
                  key={title}
                  className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-strong/15 font-mono text-xs text-brand-strong">
                    0{index + 1}
                  </span>
                  <div>
                    <h3 className="font-medium text-white">{title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-400">{text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Identidad */}
        <section id="identidad" className="border-y border-white/5 bg-white/[0.02]">
          <div className="mx-auto w-full max-w-6xl px-5 py-20">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.3em] text-brand-soft">
                  Identidad visual
                </p>
                <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
                  La marca, en sus cuatro formas.
                </h2>
                <p className="mt-5 max-w-xl text-zinc-400">
                  VibeMatch se aplica como logotipo, isotipo, imagotipo e isologotipo. Cada variante tiene un uso
                  distinto según el manual de identidad corporativa.
                </p>
              </div>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  name: "Logotipo",
                  img: "/marca/logotipo.png",
                  alt: "Logotipo VIBE•MATCH en trazo geométrico",
                  w: 624,
                  h: 174,
                  text: "VIBE•MATCH",
                  use: "Cabecera, firma de marca y piezas principales.",
                },
                {
                  name: "Isotipo",
                  img: "/marca/isotipo.png",
                  alt: "Isotipo VibeMatch: símbolo con ondas NFC y globos de chat",
                  w: 615,
                  h: 375,
                  text: "Símbolo de líneas dinámicas.",
                  use: "Avatar, favicon, interfaz y sellos pequeños.",
                },
                {
                  name: "Imagotipo",
                  img: "/marca/imagotipo.png",
                  alt: "Imagotipo VibeMatch: isotipo junto al logotipo",
                  w: 675,
                  h: 303,
                  text: "Isotipo + logotipo lado a lado.",
                  use: "Comunicación impresa y merchandising.",
                },
                {
                  name: "Isologotipo",
                  img: "/marca/isologotipo.png",
                  alt: "Isologotipo VibeMatch: escudo circular con la marca integrada",
                  w: 351,
                  h: 372,
                  text: "Escudo con marca integrada.",
                  use: "Tarjeta NFC, sello y avatar de marca.",
                },
              ].map((variant) => (
                <article key={variant.name} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex h-28 items-center justify-center rounded-2xl bg-[#F6F6F2] p-4">
                    <Image
                      src={variant.img}
                      alt={variant.alt}
                      width={variant.w}
                      height={variant.h}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-white">{variant.name}</h3>
                  <p className="mt-1 text-sm text-zinc-400">{variant.text}</p>
                  <p className="mt-2 text-xs text-zinc-500">{variant.use}</p>
                </article>
              ))}
            </div>

            <div className="mt-12 rounded-3xl border border-white/10 bg-white/[0.03] p-6 lg:p-10">
              <Image
                src="/marca/buena-idea.png"
                alt="Hoja de identidad de VibeMatch con las cuatro variantes: logotipo, isotipo, imagotipo e isologotipo"
                width={512}
                height={410}
                className="mx-auto h-48 w-auto object-contain rounded-xl"
                sizes="(max-width: 640px) 90vw, 512px"
              />
              <p className="mt-4 text-xs text-center text-zinc-500">
                Hoja completa de identidad (render digital). Las cuatro variantes conviven en una sola composición;
                se muestra completa para evitar recortes arbitrarios del símbolo.
              </p>
            </div>
          </div>
        </section>

        {/* Zonas */}
        <section id="zonas" className="mx-auto w-full max-w-6xl px-5 py-20">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-brand-soft">Zonas de interés</p>
              <h2 className="mt-3 max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">
                Canchitas para lo que realmente te importa.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-zinc-400">
              Cada zona reúne a estudiantes de tu institución con afinidades concretas. Tú
              eliges dónde participar y cuándo.
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {zones.map((zone) => (
              <article
                key={zone.name}
                className={`rounded-3xl border border-white/10 bg-gradient-to-br ${zone.tone} p-7 transition hover:border-white/25`}
              >
                <div className="flex items-center gap-3">
                  {zone.icon}
                  <h3 className="text-xl font-semibold text-white">{zone.name}</h3>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-zinc-300/80">{zone.text}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Seguridad */}
        <section id="seguridad" className="relative overflow-hidden border-y border-white/5 bg-surface">
          <div
            className="pointer-events-none absolute -right-32 top-0 h-96 w-96 rounded-full bg-brand-soft/10 blur-[100px]"
            aria-hidden="true"
          />
          <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-5 py-20 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-brand-soft">Seguridad escolar</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Un espacio seguro también es un espacio libre.
              </h2>
              <p className="mt-5 max-w-xl text-zinc-400">
                La convivencia se cuida con diseño, no solo con reglas. Moderación activa,
                trazabilidad y control sobre lo que muestras.
              </p>
            </div>
            <ul className="grid gap-4">
              {[
                ["Moderación activa", "Equipos de convivencia con panel de administración y alertas tempranas."],
                ["Anonimato optativo", "Puedes participar sin mostrar tu identidad en consultas sensibles."],
                ["Logs y trazabilidad", "Registro de actividad para prevenir y acompañar situaciones de riesgo."],
                ["Privacidad primero", "Tus datos y enlaces externos son opcionales y están bajo tu control."],
              ].map(([title, text]) => (
                <li key={title} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-strong/15 text-brand-strong">
                    <Check />
                  </span>
                  <div>
                    <p className="font-medium text-white">{title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-400">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Pack */}
        <section id="pack" className="mx-auto w-full max-w-6xl px-5 py-20">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-brand-soft">Phygital Pack</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Un pack que se siente y se conecta.
              </h2>
              <p className="mt-5 max-w-lg text-zinc-400">
                Tarjeta NFC reutilizada, stickers de estado de ánimo y una guía rápida. Todo en
                cartón kraft reciclado, sin plásticos de un solo uso.
              </p>
              <a
                href="mailto:hola@vibematch.cl"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand-strong px-6 py-3 text-sm font-semibold text-ink transition hover:bg-brand-strong/85"
              >
                Pedir información
                <span aria-hidden="true">→</span>
              </a>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ["Tarjeta NFC", "Chip NTAG213 reprogramado y personalizado con el isologotipo."],
                ["QR de respaldo", "Acceso impreso para equipos sin NFC; abre la bienvenida de tu tarjeta única."],
                ["Stickers Vibe Check", "Personaliza tu estado: estudio, conversar o buscar equipo."],
                ["Packaging circular", "Kraft reciclado, cierre mecánico y rotulado normativo."],
              ].map(([title, text]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                  <p className="font-medium text-white">{title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto w-full max-w-6xl px-5 pb-20">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-brand/30 via-surface to-brand-soft/20 p-10 text-center sm:p-16">
            <div className="pointer-events-none absolute inset-0 grid-bg" aria-hidden="true" />
            <div className="relative">
              <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
                Tu próxima conexión puede empezar con un acercamiento.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-zinc-300">
                VibeMatch está en fase piloto en el Colegio Superior del Maipo. Pronto abriremos
                el beta test para la comunidad.
              </p>
              <a
                href="mailto:hola@vibematch.cl"
                className="mt-8 inline-block rounded-full bg-white px-7 py-3 text-sm font-semibold text-ink transition hover:bg-zinc-200"
              >
                Sumarme al beta
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-xs text-zinc-500 sm:flex-row">
          <div className="flex items-center gap-2">
            <Image
              src="/marca/isotipo.png"
              alt=""
              width={615}
              height={375}
              className="block h-7 w-auto"
            />
            <span className="font-mono tracking-widest">VIBEMATCH</span>
          </div>
          <p>Proyecto escolar · Colegio Superior del Maipo · Chile</p>
          <p>© 2026 VibeMatch</p>
        </div>
      </footer>
    </div>
  );
}
