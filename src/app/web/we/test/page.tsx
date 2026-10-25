import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { leerSesion } from "@/lib/cards";
import { redirect } from "next/navigation";

export const instant = false;

export const metadata: Metadata = {
  title: "Test / Sandbox · VibeMatch",
  robots: { index: false, follow: false },
};

export default async function TestSandboxPage() {
  const acceso = await leerSesion();
  if (!acceso || acceso.card.kind === "public") {
    redirect("/");
  }

  return (
    <AppShell active="app">
      <main className="relative z-10 mx-auto w-full max-w-4xl flex-1 px-5 py-12">
        <div className="mb-8">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-brand-soft">
            Sandbox
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
            /web/we/test
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Ruta de pruebas para validar asistencia, NFC, permisos y anotaciones.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="glass rounded-[2rem] p-6">
            <h2 className="text-lg font-semibold text-white">Asistencia</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Endpoint: POST /api/asistencia
            </p>
            <p className="mt-1 text-xs text-zinc-500">Requiere sesión estudiante</p>
          </div>
          <div className="glass rounded-[2rem] p-6">
            <h2 className="text-lg font-semibold text-white">Permisos baño</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Endpoint: POST /api/permisos
            </p>
            <p className="mt-1 text-xs text-zinc-500">Requiere sesión estudiante</p>
          </div>
          <div className="glass rounded-[2rem] p-6">
            <h2 className="text-lg font-semibold text-white">Anotaciones</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Endpoint: POST /api/anotaciones
            </p>
            <p className="mt-1 text-xs text-zinc-500">Requiere sesión estudiante</p>
          </div>
          <div className="glass rounded-[2rem] p-6">
            <h2 className="text-lg font-semibold text-white">Panel docente</h2>
            <p className="mt-2 text-sm text-zinc-400">
              /profesor/login · /profesor/asistencia · /profesor/banio
            </p>
            <p className="mt-1 text-xs text-zinc-500">Requiere sesión docente</p>
          </div>
        </div>
        <div className="mt-6 glass rounded-[2rem] p-6">
          <p className="text-sm text-zinc-400">
            Sesión actual: <span className="text-white">{acceso.card.id}</span> · {acceso.card.holder ?? "Sin nombre"}
          </p>
        </div>
      </main>
    </AppShell>
  );
}
