"use client";

import { useState } from "react";
import { registrarProfesorAction } from "@/app/profesor-actions";
import {
  ANIOS,
  LETRAS,
  NIVELES,
  type Nivel,
} from "@/lib/teacher-schema";

const fieldClass =
  "w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-brand-strong/60";

const labelClass =
  "font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500";

/**
 * Formulario de creación de cuentas docentes.
 *
 * El año se filtra según el nivel elegido: Básica muestra 1° a 8° y Media
 * muestra 1° a 4°, para que no se pueda crear un curso imposible.
 */
export function ProfesorRegistroForm() {
  const [nivel, setNivel] = useState<Nivel>("Media");
  const [anio, setAnio] = useState<number>(ANIOS.Media[0]);

  const cambiarNivel = (nuevo: Nivel) => {
    setNivel(nuevo);
    setAnio(ANIOS[nuevo][0]);
  };

  return (
    <form action={registrarProfesorAction} className="space-y-4">
      <label className="flex flex-col gap-2">
        <span className={labelClass}>Código institucional</span>
        <input
          name="codigoInstitucional"
          type="text"
          required
          autoCapitalize="characters"
          autoComplete="off"
          placeholder="VIBEMATCH-PROFE-..."
          className={fieldClass}
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className={labelClass}>Nombre completo</span>
        <input
          name="nombre"
          type="text"
          required
          minLength={3}
          maxLength={48}
          autoComplete="name"
          placeholder="Profesor/a Ejemplo"
          className={fieldClass}
        />
      </label>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-2">
          <span className={labelClass}>Nivel</span>
          <select
            name="nivel"
            required
            value={nivel}
            onChange={(event) => cambiarNivel(event.target.value as Nivel)}
            className={fieldClass}
          >
            {NIVELES.map((item) => (
              <option key={item} value={item} className="bg-surface">
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className={labelClass}>Año</span>
          <select
            name="anio"
            required
            value={anio}
            onChange={(event) => setAnio(Number(event.target.value))}
            className={fieldClass}
          >
            {ANIOS[nivel].map((item) => (
              <option key={item} value={item} className="bg-surface">
                {nivel} {item}°
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className={labelClass}>Letra</span>
          <select name="letra" required defaultValue="A" className={fieldClass}>
            {LETRAS.map((letra) => (
              <option key={letra} value={letra} className="bg-surface">
                {letra}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-2">
        <span className={labelClass}>
          Contraseña de la cuenta (opcional, mín. 6)
        </span>
        <input
          name="password"
          type="password"
          minLength={6}
          maxLength={64}
          autoComplete="new-password"
          placeholder="••••••"
          className={fieldClass}
        />
      </label>

      <button
        type="submit"
        className="w-full rounded-full bg-brand-strong px-6 py-3.5 text-sm font-semibold text-ink transition hover:bg-brand-strong/85"
      >
        Generar código personal
      </button>
    </form>
  );
}
