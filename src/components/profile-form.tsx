"use client";

import Link from "next/link";
import { useActionState } from "react";
import { guardarPerfilAction } from "@/app/actions";
import {
  INTERESTS,
  LEVELS,
  PRONOUNS,
  VIBES,
  type Perfil,
  type ProfileFormState,
} from "@/lib/profile-schema";

const fieldClass =
  "mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-brand-strong/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-brand-strong/20";

const labelClass =
  "font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500";

type Props = {
  initial?: Perfil | null;
  fallbackName?: string | null;
  fallbackLevel?: string | null;
  submitLabel?: string;
};

export function ProfileForm({
  initial,
  fallbackName,
  fallbackLevel,
  submitLabel,
}: Props) {
  const [state, formAction, pending] = useActionState<ProfileFormState, FormData>(
    guardarPerfilAction,
    {},
  );

  return (
    <form action={formAction} className="mt-8 grid gap-6">
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
            autoComplete="nickname"
            placeholder="¿Cómo quieres que te llamen?"
            defaultValue={initial?.displayName ?? fallbackName ?? ""}
          />
        </label>

        <label>
          <span className={labelClass}>Pronombres</span>
          <select
            className={fieldClass}
            name="pronouns"
            defaultValue={initial?.pronouns ?? ""}
          >
            {PRONOUNS.map((pronoun) => (
              <option key={pronoun.value || "none"} value={pronoun.value} className="bg-surface">
                {pronoun.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className={labelClass}>Curso</span>
          <select
            className={fieldClass}
            name="level"
            defaultValue={initial?.level ?? fallbackLevel ?? ""}
          >
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
        <select
          className={fieldClass}
          name="vibe"
          defaultValue={initial?.vibe ?? "conversar"}
          required
        >
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
                defaultChecked={initial?.interests.includes(interest) ?? false}
                className="sr-only"
              />
              {interest}
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          Elige entre 1 y 6. Los demás solo verán lo que compartas aquí.
        </p>
      </fieldset>

      <label>
        <span className={labelClass}>Algo sobre ti (opcional)</span>
        <textarea
          className={`${fieldClass} min-h-24 resize-y`}
          name="bio"
          maxLength={180}
          placeholder="Un hobby, una serie, un proyecto o lo que quieras que sepan de ti."
          defaultValue={initial?.bio ?? ""}
        />
      </label>

      <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-300">
        <input
          type="checkbox"
          name="consent"
          required
          defaultChecked={Boolean(initial)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--brand-strong)]"
        />
        <span>
          Autorizo el uso de estos datos para crear mi perfil VibeMatch y acepto la{" "}
          <Link
            href="/privacidad"
            className="text-brand-soft underline decoration-brand-soft/30 underline-offset-2 hover:text-white"
          >
            política de privacidad
          </Link>
          . Si soy menor de 14 años, declaro contar con autorización de mi apoderado.
        </span>
      </label>

      {state.error ? (
        <p
          role="alert"
          className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200"
        >
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-brand-strong px-6 py-3.5 text-sm font-semibold text-ink transition hover:bg-brand-strong/85 disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? "Guardando perfil…" : (submitLabel ?? "Crear mi perfil")}
      </button>
    </form>
  );
}
