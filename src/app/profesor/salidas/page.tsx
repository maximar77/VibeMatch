import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { leerProfesorSesion } from "@/lib/teachers";
import {
  obtenerEventos,
  registrarEventoSalaAction,
  salirProfesorAction,
} from "@/app/profesor-actions";
import { ProfesorExportLinks } from "@/components/profesor-export-links";
import { etiquetaEventoSala } from "@/lib/school-schema";
import { fechaEnZona, horaEnZona } from "@/lib/fecha";

export const instant = false;

export const metadata: Metadata = {
  title: "Salidas y retiros · VibeMatch Docente",
  robots: { index: false, follow: false },
};

const ESTILO_EVENTO: Record<string, string> = {
  salida: "border-amber-300/25 bg-amber-300/10 text-amber-200",
  entrada: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
  retiro: "border-rose-400/25 bg-rose-400/10 text-rose-200",
};

export default async function SalidasPage() {
  const profesor = await leerProfesorSesion();
  if (!profesor) {
    redirect("/profesor/login");
  }

  const hoy = fechaEnZona();
  const eventos = await obtenerEventos({ fecha: hoy });

  const ultimoPorTarjeta = new Map<string, (typeof eventos)[number]>();
  for (const evento of eventos) {
    ultimoPorTarjeta.set(evento.cardId, evento);
  }

  const fueraDeSala = [...ultimoPorTarjeta.values()]
    .filter((evento) => evento.tipo === "salida")
    .sort((a, b) => a.hora.localeCompare(b.hora));
  const retirados = [...ultimoPorTarjeta.values()].filter(
    (evento) => evento.tipo === "retiro",
  );
  const historial = [...eventos].reverse();

  return (
    <div className="min-h-screen bg-ink text-zinc-50">
      <header className="sticky top-0 z-20 border-b border-white/5 bg-ink/70 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3">
          <span className="text-xl font-bold tracking-[0.18em]">
            VIBE<span className="text-brand-strong">•</span>MATCH
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-zinc-400">
              {profesor.nombre} · {profesor.curso}
            </span>
            <Link
              href="/profesor/escanear"
              className="rounded-full bg-brand-strong px-4 py-2 text-xs font-semibold text-ink hover:bg-brand-strong/85"
            >
              Escanear
            </Link>
            <Link
              href="/profesor/asistencia"
              className="rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/5"
            >
              Asistencia
            </Link>
            <Link
              href="/profesor/banio"
              className="rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/5"
            >
              Baño
            </Link>
            <Link
              href="/profesor/anotaciones"
              className="rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/5"
            >
              Anotaciones
            </Link>
            <form action={salirProfesorAction}>
              <button
                type="submit"
                className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/5"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5 py-12">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-brand-soft">
              Salidas, regresos y retiros
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">
              Movimientos de sala — {hoy}
            </h1>
          </div>
          <ProfesorExportLinks curso={profesor.curso} />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="glass rounded-[1.6rem] p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
              Fuera de la sala
            </p>
            <p className="mt-2 text-3xl font-bold text-amber-200">
              {fueraDeSala.length}
            </p>
          </div>
          <div className="glass rounded-[1.6rem] p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
              Retirados hoy
            </p>
            <p className="mt-2 text-3xl font-bold text-rose-200">
              {retirados.length}
            </p>
          </div>
          <div className="glass rounded-[1.6rem] p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
              Movimientos registrados
            </p>
            <p className="mt-2 text-3xl font-bold text-white">{eventos.length}</p>
          </div>
        </div>

        <section className="glass mt-6 rounded-[2rem] p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-brand-soft">
                Alumnos fuera de la sala
              </p>
              <p className="mt-1 text-sm text-zinc-400">
                Marca el regreso sin volver a escanear la tarjeta.
              </p>
            </div>
            <Link
              href="/profesor/escanear"
              className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-white/5"
            >
              Registrar con tarjeta NFC
            </Link>
          </div>

          {fueraDeSala.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-zinc-400">
              Todos los alumnos están en la sala.
            </p>
          ) : (
            <div className="grid gap-3">
              {fueraDeSala.map((evento) => (
                <div
                  key={evento.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {evento.nombre}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      N° {evento.numeroLista ?? "—"} · Salió a las {evento.hora}
                      {evento.detalle ? ` · ${evento.detalle}` : ""}
                    </p>
                  </div>
                  <form action={registrarEventoSalaAction}>
                    <input name="cardId" type="hidden" defaultValue={evento.cardId} />
                    <input name="tipo" type="hidden" defaultValue="entrada" />
                    <input name="fecha" type="hidden" defaultValue={hoy} />
                    <input
                      name="hora"
                      type="hidden"
                      defaultValue={horaEnZona()}
                    />
                    <input
                      name="numeroLista"
                      type="hidden"
                      defaultValue={evento.numeroLista ?? ""}
                    />
                    <button
                      type="submit"
                      className="rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold text-ink transition hover:bg-emerald-400/90"
                    >
                      Marcar regreso
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.03] p-6">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-brand-soft">
            Historial del día
          </p>

          {historial.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-zinc-400">
              Todavía no hay salidas, regresos ni retiros registrados hoy.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                    <th className="px-3 py-2 font-medium">Hora</th>
                    <th className="px-3 py-2 font-medium">N° lista</th>
                    <th className="px-3 py-2 font-medium">Nombre completo</th>
                    <th className="px-3 py-2 font-medium">Curso</th>
                    <th className="px-3 py-2 font-medium">Evento</th>
                    <th className="px-3 py-2 font-medium">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map((evento) => (
                    <tr
                      key={evento.id}
                      className="border-b border-white/5 text-zinc-300 last:border-0"
                    >
                      <td className="whitespace-nowrap px-3 py-3 font-mono text-xs text-zinc-400">
                        {evento.hora}
                      </td>
                      <td className="px-3 py-3 font-semibold text-white">
                        {evento.numeroLista ?? "—"}
                      </td>
                      <td className="px-3 py-3 text-white">{evento.nombre}</td>
                      <td className="px-3 py-3 text-zinc-400">{evento.curso}</td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                            ESTILO_EVENTO[evento.tipo] ??
                            "border-white/10 bg-white/5 text-zinc-300"
                          }`}
                        >
                          {etiquetaEventoSala(evento.tipo)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-zinc-400">
                        {evento.detalle || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
