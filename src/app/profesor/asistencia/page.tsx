import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { leerProfesorSesion } from "@/lib/teachers";
import { obtenerAsistencia, registrarAsistenciaAction } from "@/app/profesor-actions";
import { salirProfesorAction } from "@/app/profesor-actions";

export const instant = false;

export const metadata: Metadata = {
  title: "Asistencia en vivo · VibeMatch Docente",
  robots: { index: false, follow: false },
};

export default async function AsistenciaPage() {
  const profesor = await leerProfesorSesion();
  if (!profesor) {
    redirect("/profesor/login");
  }

  const hoy = new Date().toISOString().slice(0, 10);
  const registros = await obtenerAsistencia({ fecha: hoy });

  return (
    <div className="min-h-screen bg-ink text-zinc-50">
      <header className="border-b border-white/5 bg-ink/70 backdrop-blur-xl sticky top-0 z-20">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
          <span className="text-xl font-bold tracking-[0.18em]">
            VIBE<span className="text-brand-strong">•</span>MATCH
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">
              {profesor.nombre} · {profesor.curso}
            </span>
            <a href="/profesor/escanear" className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/5">
              Escanear alumno
            </a>
            <form action={salirProfesorAction}>
              <button type="submit" className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/5">
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-5 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-brand-soft">
              Asistencia
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">
              Pasar lista — {hoy}
            </h1>
          </div>
        </div>

        <div className="glass rounded-[2rem] p-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="pb-3 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                  N° Lista
                </th>
                <th className="pb-3 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                  Alumno
                </th>
                <th className="pb-3 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                  Estado
                </th>
                <th className="pb-3 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                  Hora
                </th>
              </tr>
            </thead>
            <tbody>
              {registros.map((r) => (
                <tr key={r.id} className="border-b border-white/5">
                  <td className="py-3 text-sm text-zinc-300">
                    {r.numeroLista ?? "—"}
                  </td>
                  <td className="py-3 text-sm font-medium text-white">{r.nombre}</td>
                  <td className="py-3 text-sm">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                        r.estado === "presente"
                          ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                          : r.estado === "atrasado"
                          ? "border-amber-300/20 bg-amber-300/10 text-amber-300"
                          : "border-rose-400/20 bg-rose-400/10 text-rose-300"
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" />
                      {r.estado.charAt(0).toUpperCase() + r.estado.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 text-sm font-mono text-zinc-400">{r.hora}</td>
                </tr>
              ))}
              {registros.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-zinc-500">
                    No hay registros de asistencia para hoy aún.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.03] p-6">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-brand-soft">
            Registro rápido por tarjeta NFC
          </p>
          <form
            action={registrarAsistenciaAction}
            className="mt-4 grid gap-3 sm:grid-cols-4"
          >
            <input
              name="fecha"
              type="hidden"
              defaultValue={hoy}
            />
            <input
              name="hora"
              type="hidden"
              defaultValue={new Date().toTimeString().slice(0, 5)}
            />
            <input
              name="registradoPor"
              type="hidden"
              defaultValue={profesor.id}
            />
            <label>
              <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 block">
                Tarjeta NFC / QR
              </span>
              <input
                name="cardId"
                type="text"
                required
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-brand-strong/60"
              />
            </label>
            <label>
              <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 block">
                Estado
              </span>
              <select name="estado" className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-brand-strong/60">
                <option value="presente">Presente</option>
                <option value="atrasado">Atrasado</option>
                <option value="ausente">Ausente</option>
              </select>
            </label>
            <label>
              <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 block">
                Curso
              </span>
              <input
                name="curso"
                type="text"
                defaultValue={profesor.curso}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-brand-strong/60"
              />
            </label>
            <button
              type="submit"
              className="rounded-full bg-brand-strong px-6 py-3.5 text-sm font-semibold text-ink transition hover:bg-brand-strong/85"
            >
              Registrar
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}