"use client";

import { useState } from "react";
import {
  INTERESTS,
  LEVELS,
  PRONOUNS,
  VIBES,
  type Interest,
  type Perfil,
  type Vibe,
} from "@/lib/profile-schema";
import { encolarCambios, guardarPerfilLocal, sincronizar } from "@/lib/offline-profile";

const fieldClass =
  "mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-brand-strong/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-brand-strong/20";

const labelClass = "font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500";

type Props = {
  perfil: Perfil;
  onGuardado?: (perfil: Perfil) => void;
};

/**
 * Edición del perfil que funciona sin conexión.
 *
 * Guarda primero en el dispositivo y, si hay red, intenta sincronizar de
 * inmediato. Si no, deja la cola pendiente para el próximo arranque online.
 */
export function OfflineProfileForm({ perfil, onGuardado }: Props) {
  const [pendiente, setPendiente] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const alEnviar = async (evento: React.FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setError(null);
    setMensaje(null);

    const datos = new FormData(evento.currentTarget);
    const displayName = String(datos.get("displayName") ?? "")
      .trim()
      .replace(/\s+/g, " ");
    const pronouns = String(datos.get("pronouns") ?? "");
    const level = String(datos.get("level") ?? "").trim();
    const vibeRaw = String(datos.get("vibe") ?? "");
    const bio = String(datos.get("bio") ?? "")
      .trim()
      .replace(/\s+/g, " ");
    const interests = Array.from(
      new Set(datos.getAll("interests").map((valor) => String(valor))),
    ) as Interest[];

    if (displayName.length < 2 || displayName.length > 32) {
      setError("Escribe un nombre preferido de entre 2 y 32 caracteres.");
      return;
    }
    if (interests.length < 1) {
      setError("Elige al menos un interés.");
      return;
    }
    if (interests.length > 6) {
      setError("Elige hasta 6 intereses.");
      return;
    }

    const cambios = {
      cardId: perfil.cardId,
      displayName,
      pronouns,
      level: level || perfil.level,
      vibe: vibeRaw as Vibe,
      interests,
      bio,
    };

    const ahora = new Date().toISOString();
    const actualizado: Perfil = { ...perfil, ...cambios, updatedAt: ahora };

    // 1) Guardar en el dispositivo de inmediato: nunca se pierde el cambio.
    await guardarPerfilLocal(actualizado, true);
    await encolarCambios(cambios);
    onGuardado?.(actualizado);
    setPendiente(true);

    // 2) Intentar enviarlo al servidor.
    const resultado = await sincronizar(cambios);
    if (resultado.ok) {
      setPendiente(false);
      setMensaje("Perfil guardado y sincronizado.");
      if (resultado.perfil) onGuardado?.(resultado.perfil);
    } else {
      setMensaje("Guardado en tu teléfono. Se sincronizará al recuperar conexión.");
    }
  };

  return (
    <form onSubmit={(evento) => void alEnviar(evento)} className="mt-8 grid gap-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className={labelClass}>Nombre preferido *</span>
          <input
            className={fieldClass}
            name="displayName"
            type="text"
            required
            minLength={2}
            maxLength={32}
            defaultValue={perfil.displayName}
          />
        </label>

        <label>
          <span className={labelClass}>Pronombres</span>
          <select className={fieldClass} name="pronouns" defaultValue={perfil.pronouns}>
            {PRONOUNS.map((pronoun) => (
              <option key={pronoun.value || "none"} value={pronoun.value} className="bg-surface">
                {pronoun.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className={labelClass}>Curso</span>
          <select className={fieldClass} name="level" defaultValue={perfil.level}>
            <option value="" className="bg-surface">
              Sin especificar
            </option>
            {LEVELS.map((level) => (
              <option key={level} value={level} className="bg-surface">
                {level}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label>
        <span className={labelClass}>Tu vibe ahora *</span>
        <select className={fieldClass} name="vibe" defaultValue={perfil.vibe} required>
          {VIBES.map((vibe) => (
            <option key={vibe.value} value={vibe.value} className="bg-surface">
              {vibe.label}
            </option>
          ))}
        </select>
      </label>

      <fieldset>
        <legend className={labelClass}>Intereses *</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {INTERESTS.map((interest) => (
            <label
              key={interest}
              className="cursor-pointer rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300 transition has-checked:border-brand-strong/60 has-checked:bg-brand-strong/15 has-checked:text-white"
            >
              <input
                type="checkbox"
                name="interests"
                value={interest}
                defaultChecked={perfil.interests.includes(interest)}
                className="sr-only"
              />
              {interest}
            </label>
          ))}
        </div>
      </fieldset>

      <label>
        <span className={labelClass}>Algo sobre ti (opcional)</span>
        <textarea
          className={`${fieldClass} min-h-24 resize-y`}
          name="bio"
          maxLength={180}
          defaultValue={perfil.bio}
        />
      </label>

      {error ? (
        <p
          role="alert"
          className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200"
        >
          {error}
        </p>
      ) : null}

      {mensaje ? (
        <p
          role="status"
          className={`rounded-2xl border px-4 py-3 text-sm ${
            pendiente
              ? "border-amber-300/20 bg-amber-300/[0.08] text-amber-100"
              : "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-100"
          }`}
        >
          {mensaje}
        </p>
      ) : null}

      <button
        type="submit"
        className="rounded-full bg-brand-strong px-6 py-3.5 text-sm font-semibold text-ink transition hover:bg-brand-strong/85"
      >
        Guardar cambios
      </button>
    </form>
  );
}
