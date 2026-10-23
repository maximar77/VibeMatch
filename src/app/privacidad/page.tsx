import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

export const metadata: Metadata = {
  title: "Privacidad · VibeMatch",
  description:
    "Cómo VibeMatch usa los datos del perfil creado con una tarjeta de acceso.",
  robots: { index: false, follow: false },
};

export default function PrivacidadPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-bg" aria-hidden="true" />
      <header className="relative z-10 border-b border-white/5 bg-ink/60 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between px-5">
          <BrandLogo href="/app" />
          <Link href="/app" className="text-xs text-zinc-400 transition hover:text-white">
            Volver a la app
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-3xl px-5 py-14">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-brand-soft">
          Privacidad y datos
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">
          Tu perfil, bajo tu control.
        </h1>
        <p className="mt-5 text-sm leading-relaxed text-zinc-400">
          VibeMatch es un proyecto escolar del Colegio Superior del Maipo. Esta
          política explica qué datos guardamos cuando creas tu perfil con una
          tarjeta de acceso.
        </p>

        <div className="mt-10 grid gap-5 text-sm leading-relaxed text-zinc-300">
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="font-semibold text-white">Qué datos guardamos</h2>
            <p className="mt-2 text-zinc-400">
              Nombre preferido, pronombres, curso, tu “vibe”, intereses y una
              descripción opcional. También guardamos la fecha de autorización y el
              identificador de la tarjeta que abrió tu perfil.
            </p>
          </section>
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="font-semibold text-white">Para qué los usamos</h2>
            <p className="mt-2 text-zinc-400">
              Solo para mostrarte tu perfil dentro de VibeMatch y cargarlo cuando
              entres desde la web instalada o, más adelante, desde la app de Android
              o Windows. No vendemos datos ni los usamos para publicidad.
            </p>
          </section>
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="font-semibold text-white">Dónde se guardan</h2>
            <p className="mt-2 text-zinc-400">
              En el servidor del proyecto, asociados a tu tarjeta. No guardamos el
              token de la tarjeta en texto plano. Puedes pedir la eliminación de tu
              perfil al equipo responsable.
            </p>
          </section>
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="font-semibold text-white">Funciones escolares con la tarjeta</h2>
            <p className="mt-2 text-zinc-400">
              Además del perfil, tu tarjeta permite al establecimiento{" "}
              <strong className="text-zinc-300">pasar lista</strong> (registrar
              presente, atrasado o ausente),{" "}
              <strong className="text-zinc-300">autorizar permisos de baño</strong>{" "}
              (hora de salida, regreso y duración) y registrar{" "}
              <strong className="text-zinc-300">anotaciones positivas y negativas</strong>{" "}
              en el momento, con fecha, hora y responsable.
            </p>
          </section>
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="font-semibold text-white">Quién ve estos registros</h2>
            <p className="mt-2 text-zinc-400">
              Los registros de asistencia, baño y anotaciones los ven el profesor
              correspondiente y la dirección o inspectoría del establecimiento.
              Tú puedes consultar los tuyos. No se comparten con otros estudiantes
              ni se usan para publicidad.
            </p>
          </section>
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="font-semibold text-white">Cuánto tiempo se guardan</h2>
            <p className="mt-2 text-zinc-400">
              Los registros se mantienen durante el año escolar en curso y se
              eliminan al cierre del período, salvo que la normativa del
              establecimiento exija conservarlos por más tiempo. Puedes solicitar
              la eliminación anticipada de tus datos al equipo responsable.
            </p>
          </section>
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="font-semibold text-white">Base legal</h2>
            <p className="mt-2 text-zinc-400">
              Tratamos estos datos conforme a la Ley 19.628 sobre protección de la
              vida privada y a la Ley 21.801 sobre convivencia, buen trato y
              bienestar de los miembros de la comunidad educativa. Para el
              tratamiento de datos de menores de 14 años se requiere la
              autorización de su apoderado.
            </p>
          </section>
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="font-semibold text-white">Tus derechos</h2>
            <p className="mt-2 text-zinc-400">
              Puedes revisar y editar tus datos desde “Mi VibeMatch” o solicitar su
              eliminación. Si eres menor de 14 años, necesitas autorización de tu
              apoderado para crear el perfil.
            </p>
          </section>
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="font-semibold text-white">Contacto</h2>
            <p className="mt-2 text-zinc-400">
              Para consultas sobre tus datos, escribe a{" "}
              <a
                href="mailto:maximar787@gmail.com"
                className="text-brand-soft underline decoration-brand-soft/30 underline-offset-2 hover:text-white"
              >
                maximar787@gmail.com
              </a>{" "}
              o al{" "}
              <a
                href="tel:+56986398368"
                className="text-brand-soft underline decoration-brand-soft/30 underline-offset-2 hover:text-white"
              >
                +56 9 8639 8368
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
