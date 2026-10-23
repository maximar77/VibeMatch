/**
 * Esquema compartido entre servidor y cliente.
 *
 * No importar nada de Node en este archivo: lo usa el formulario de perfil que
 * se ejecuta en el navegador.
 */

export const INTERESTS = [
  "Deportes",
  "Arte",
  "Videojuegos",
  "Estudio",
  "Música",
  "Tecnología",
  "Ciencia",
  "Lectura",
] as const;

export const VIBES = [
  { value: "busco-equipo", label: "Busco equipo" },
  { value: "conversar", label: "Abierto/a a conversar" },
  { value: "modo-estudio", label: "Modo estudio" },
  { value: "explorando", label: "Solo explorando" },
] as const;

export const PRONOUNS = [
  { value: "", label: "Prefiero no decirlo" },
  { value: "ella", label: "Ella" },
  { value: "él", label: "Él" },
  { value: "elle", label: "Elle" },
] as const;

export const LEVELS = [
  "7° Básico",
  "8° Básico",
  "1° Medio",
  "2° Medio",
  "3° Medio",
  "4° Medio",
  "Otro",
] as const;

export type Interest = (typeof INTERESTS)[number];
export type Vibe = (typeof VIBES)[number]["value"];

export type Perfil = {
  cardId: string;
  displayName: string;
  pronouns: string;
  level: string;
  vibe: Vibe;
  interests: Interest[];
  bio: string;
  consentAt: string;
  createdAt: string;
  updatedAt: string;
};

export type ProfileFormState = {
  error?: string;
};

export function esInteres(value: string): value is Interest {
  return (INTERESTS as readonly string[]).includes(value);
}

export function esVibe(value: string): value is Vibe {
  return VIBES.some((item) => item.value === value);
}

export function etiquetaVibe(vibe: string): string {
  return VIBES.find((item) => item.value === vibe)?.label ?? vibe;
}
