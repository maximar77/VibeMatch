/**
 * Esquema compartido de cuentas de profesor VibeMatch.
 *
 * No importar nada de Node en este archivo: lo usan los formularios y el panel
 * que se ejecutan en el navegador.
 */

export const NIVELES = ["Básica", "Media"] as const;
export type Nivel = (typeof NIVELES)[number];

/** Años escolares por nivel. */
export const ANIOS: Record<Nivel, number[]> = {
  Básica: [1, 2, 3, 4, 5, 6, 7, 8],
  Media: [1, 2, 3, 4],
};

/** Letras de curso habituales en Chile. */
export const LETRAS = ["A", "B", "C", "D", "E", "F"] as const;
export type Letra = (typeof LETRAS)[number];

/** Código con el que se crea una cuenta de profesor (lo entrega la dirección). */
export const LARGO_CODIGO_PROFESOR = 6;

export type DatosProfesor = {
  id: string;
  /** Nombre visible del profesor. */
  nombre: string;
  nivel: Nivel;
  anio: number;
  letra: Letra;
  /** Curso compuesto, por ejemplo: "Media 1° C". */
  curso: string;
  createdAt: string;
  lastLoginAt: string | null;
};

export function esNivel(value: string): value is Nivel {
  return (NIVELES as readonly string[]).includes(value);
}

export function esAnio(nivel: Nivel, anio: number): boolean {
  return ANIOS[nivel].includes(anio);
}

export function esLetra(value: string): value is Letra {
  return (LETRAS as readonly string[]).includes(value);
}

/** Etiqueta estable del curso: "Media 1° C". */
export function etiquetaCurso(nivel: Nivel, anio: number, letra: string): string {
  return `${nivel} ${anio}° ${letra.toUpperCase()}`;
}

/**
 * Normaliza el código secreto de profesor antes de compararlo: sin espacios,
 * sin guiones y en mayúsculas.
 */
export function normalizarCodigo(value: string): string {
  return value.replace(/[\s-]/g, "").toUpperCase();
}

/** Formatea un código personal en grupos de 4 para que sea fácil de dictar. */
export function formatearCodigo(codigo: string): string {
  return codigo.replace(/(.{4})/g, "$1 ").trim();
}
