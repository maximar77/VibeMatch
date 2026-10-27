"use client";

import { useActionState } from "react";
import {
  guardarClaveAction,
  quitarClaveAction,
  type SecurityFormState,
} from "@/app/actions";

const inputClass =
  "mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-brand-strong/60 focus:ring-2 focus:ring-brand-strong/20";

const labelClass =
  "font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500";

function Mensaje({ state }: { state: SecurityFormState }) {
  if (state.error) {
    return (
      <p className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-2 text-sm text-rose-200">
        {state.error}
      </p>
    );
  }

  if (state.ok && state.mensaje) {
    return (
      <p className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200">
        {state.mensaje}
      </p>
    );
  }

  return null;
}

type Props = {
  protegida: boolean;
  actualizadaEn: string | null;
  nombre: string;
};

export function SecurityPanel({ protegida, actualizadaEn, nombre }: Props) {
  const [guardarState, guardar, guardando] = useActionState<
    SecurityFormState,
    FormData
  >(guardarClaveAction, {});
  const [quitarState, quitar, quitando] = useActionState<
    SecurityFormState,
    FormData
  >(quitarClaveAction, {});

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="glass rounded-[2rem] p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-brand-soft">
              Seguridad de {nombre}
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">
              {protegida ? "Cambiar la clave" : "Poner una clave"}
            </h2>
          </div>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
              protegida
                ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
                : "border-amber-300/25 bg-amber-300/10 text-amber-200"
            }`}
          >
            {protegida ? "🔒 Protegida" : "Sin clave"}
          </span>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          Es opcional. La tarjeta sigue siendo tu llave principal; la clave evita
          que otra persona que encuentre el enlace de tu tarjeta pueda entrar.
        </p>

        {protegida && actualizadaEn && (
          <p className="mt-2 text-xs text-zinc-500">
            Última actualización:{" "}
            {new Date(actualizadaEn).toLocaleDateString("es-CL", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </p>
        )}

        <form action={guardar} className="mt-6 space-y-4">
          {protegida && (
            <label className="block">
              <span className={labelClass}>Clave actual</span>
              <input
                name="actual"
                type="password"
                required
                autoComplete="current-password"
                className={inputClass}
                placeholder="••••••"
              />
            </label>
          )}
          <label className="block">
            <span className={labelClass}>
              {protegida ? "Nueva clave" : "Clave"} (mín. 6 caracteres)
            </span>
            <input
              name="nueva"
              type="password"
              required
              minLength={6}
              maxLength={64}
              autoComplete="new-password"
              className={inputClass}
              placeholder="••••••"
            />
          </label>
          <label className="block">
            <span className={labelClass}>Repetir clave</span>
            <input
              name="confirmar"
              type="password"
              required
              minLength={6}
              maxLength={64}
              autoComplete="new-password"
              className={inputClass}
              placeholder="••••••"
            />
          </label>

          <Mensaje state={guardarState} />

          <button
            type="submit"
            disabled={guardando}
            className="w-full rounded-full bg-brand-strong px-6 py-3.5 text-sm font-semibold text-ink transition hover:bg-brand-strong/85 disabled:opacity-50"
          >
            {guardando ? "Guardando…" : protegida ? "Cambiar clave" : "Crear clave"}
          </button>
        </form>
      </section>

      <aside className="grid content-start gap-6">
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-brand-soft">
            Cómo funciona
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-zinc-400">
            <li>• Sin clave, entras solo con tu tarjeta NFC o QR.</li>
            <li>• Con clave, el enlace de la tarjeta pide la clave antes de abrir tu cuenta.</li>
            <li>• La clave se guarda cifrada con scrypt; nadie en VibeMatch puede leerla.</li>
            <li>• Si la olvidas, el equipo administrador del colegio puede quitarla desde el servidor; nadie puede leerla.</li>
          </ul>
        </section>

        {protegida && (
          <section className="rounded-[2rem] border border-rose-400/20 bg-rose-400/[0.04] p-6">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-rose-300">
              Quitar protección
            </p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              La tarjeta volverá a ser la única llave. Confirma con tu clave actual.
            </p>
            <form action={quitar} className="mt-4 space-y-3">
              <label className="block">
                <span className={labelClass}>Clave actual</span>
                <input
                  name="actual"
                  type="password"
                  required
                  autoComplete="current-password"
                  className={inputClass}
                  placeholder="••••••"
                />
              </label>
              <Mensaje state={quitarState} />
              <button
                type="submit"
                disabled={quitando}
                className="w-full rounded-full border border-rose-400/40 bg-rose-400/10 px-6 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-400/20 disabled:opacity-50"
              >
                {quitando ? "Quitando…" : "Quitar clave"}
              </button>
            </form>
          </section>
        )}
      </aside>
    </div>
  );
}
