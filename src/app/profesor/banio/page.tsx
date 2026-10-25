import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { leerProfesorSesion } from "@/lib/teachers";
import { obtenerPermisos, registrarPermisoBanoAction } from "@/app/profesor-actions";
import { salirProfesorAction } from "@/app/profesor-actions";

export const instant = false;

export const metadata: Metadata = {
  title: "Permisos de baño · VibeMatch Docente",
  robots: { index: false, follow: false },
};

export default async function BanioPage() {
  const profesor = await leerProfesorSesion();
  if (!profesor) {
    redirect("/profesor/login");
  }

  const hoy = new Date().toISOString().slice(0, 10);
  const abiertos = await obtenerPermisos({ fecha: hoy, abiertos: true });

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
              Permisos de baño
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">
              Salidas y retornos — {hoy}
            </h1>
          </div>
        </div>

        <div className="glass rounded-[2rem] p-6">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-brand-soft mb-2">
            Alumnos fuera del aula
          </p>
          {abiertos.length === 0 ? (
            <p className="text-sm text-zinc-400">Ningún alumno fuera del aula.</p>
          ) : (
            <div className="grid gap-3">
              {abiertos.map((p) => {
                const inicioMin = p.inicio.split(":").map(Number);
                const inicioMs =
                  (inicioMin[0] || 0) * 60 * 60 * 1000 +
                  (inicioMin[1] || 0) * 60 * 1000;
                const ahoraMs = Date.now() % (24 * 60 * 60 * 1000);
                const transcurridoMs = Math.max(0, ahoraMs - inicioMs);
                const transcurridoMin = Math.floor(transcurridoMs / 60000);
                const excede = transcurridoMin > 10;

                return (
                  <div
                    key={p.id}
                    className={`rounded-xl border p-4 flex items-center justify-between gap-4 ${
                      excede
                        ? "border-rose-400/20 bg-rose-400/5"
                        : "border-white/10 bg-white/[0.03]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="h-2 w-2 rounded-full bg-rose-400 animate-pulse" />
                      <div>
                        <p className="text-sm font-medium text-white">{p.cardId}</p>
                        <p className="text-xs text-zinc-400">
                          Salida: {p.inicio} · {transcurridoMin} min
                        </p>
                      </div>
                    </div>
                    <form
                      action={registrarPermisoBanoAction}
                      className="flex items-center gap-2"
                    >
                      <input name="cardId" type="hidden" defaultValue={p.cardId} />
                      <input name="accion" type="hidden" defaultValue="regreso" />
                      <input name="fecha" type="hidden" defaultValue={p.fecha} />
                      <input
                        name="hora"
                        type="hidden"
                        defaultValue={new Date().toTimeString().slice(0, 5)}
                      />
                      <input name="registradoPor" type="hidden" defaultValue={profesor.id} />
                      <button
                        type="submit"
                        className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                          excede
                            ? "bg-rose-400 text-ink hover:bg-rose-400/90"
                            : "bg-emerald-400 text-ink hover:bg-emerald-400/90"
                        }`}
                      >
                        {excede ? "Retrasado · Marcar regreso" : "Marcar regreso"}
                      </button>
                    </form>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.03] p-6">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-brand-soft mb-2">
            Registrar nueva salida
          </p>
          <form
            action={registrarPermisoBanoAction}
            className="grid gap-3 sm:grid-cols-4"
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
                Curso
              </span>
              <input
                name="curso"
                type="text"
                defaultValue={profesor.curso}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-brand-strong/60"
              />
            </label>
            <label>
              <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 block">
                Acción
              </span>
              <select name="accion" className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-brand-strong/60">
                <option value="salida">Salida</option>
                <option value="regreso">Regreso</option>
              </select>
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