import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { leerProfesorSesion } from "@/lib/teachers";
import { ProfesorRegistroForm } from "@/components/profesor-registro-form";

export const instant = false;

export const metadata: Metadata = {
  title: "Registro Docente · VibeMatch",
  robots: { index: false, follow: false },
};

export default async function ProfesorRegistroPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const profesor = await leerProfesorSesion();
  if (profesor) {
    redirect("/profesor/asistencia");
  }

  const params = searchParams ? await searchParams : {};
  const error = params.error;

  const errorMensaje: Record<string, string> = {
    institucional_invalido: "Código institucional inválido.",
    datos_invalidos: "Revisa los datos ingresados.",
    registro_fallido: "No se pudo registrar. Intenta nuevamente.",
  };

  return (
    <div className="bg-ink text-zinc-50 min-h-screen flex items-center justify-center">
      <div className="glass rounded-[2rem] border border-white/10 p-8 sm:p-12 max-w-lg w-full mx-5">
        <div className="flex items-center gap-2 mb-6">
          <span className="h-10 w-auto" />
          <span className="text-xl font-bold tracking-[0.18em]">
            VIBE<span className="text-brand-strong">•</span>MATCH
          </span>
        </div>
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-white">
          Crear cuenta docente
        </h1>
        <p className="mb-6 text-sm text-zinc-400">
          Necesitas el código institucional entregado por la dirección.
        </p>
        {error && (
          <p className="mb-4 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-2 text-sm text-rose-200">
            {errorMensaje[error] ?? "Ocurrió un error."}
          </p>
        )}
        <ProfesorRegistroForm />
        <div className="mt-6 flex flex-col gap-2 text-center text-xs text-zinc-500">
          <Link href="/profesor/login" className="text-brand-soft hover:text-brand-strong transition">
            Ya tengo mi código personal
          </Link>
        </div>
      </div>
    </div>
  );
}
