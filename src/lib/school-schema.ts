/**
 * Esquema compartido de gestión escolar VibeMatch.
 *
 * Cubre las tres funciones que habilita la tarjeta NFC:
 *   1. Pasar lista (asistencia)
 *   2. Permisos de baño
 *   3. Anotaciones positivas y negativas
 *
 * No importar nada de Node en este archivo: lo usan componentes cliente
 * (panel del profesor, app móvil y sincronización offline).
 */

export const ESTADOS_ASISTENCIA = ["presente", "atrasado", "ausente"] as const;
export type EstadoAsistencia = (typeof ESTADOS_ASISTENCIA)[number];

export const CATEGORIAS_ANOTACION = [
  "Convivencia",
  "Académico",
  "Participación",
  "Puntualidad",
  "Respeto",
  "Otro",
] as const;
export type CategoriaAnotacion = (typeof CATEGORIAS_ANOTACION)[number];

export const ROLES = ["alumno", "profesor", "direccion"] as const;
export type Rol = (typeof ROLES)[number];

export type RegistroAsistencia = {
  id: string;
  cardId: string;
  /** Curso del estudiante, por ejemplo "Media 1° C". */
  curso: string;
  /** Nombre completo del estudiante al momento del registro. */
  nombre: string;
  /** Número de lista dentro del curso (puede ser null en tarjetas antiguas). */
  numeroLista: number | null;
  /** Fecha en formato AAAA-MM-DD (hora local del establecimiento). */
  fecha: string;
  /** Hora de la marca en formato HH:MM. */
  hora: string;
  estado: EstadoAsistencia;
  /** Profesor que registró la asistencia (id de la cuenta). */
  registradoPor: string;
  /** Cómo se registró: lectura NFC/QR o selección manual en el panel. */
  metodo: "nfc" | "qr" | "manual";
  createdAt: string;
};

export type PermisoBano = {
  id: string;
  cardId: string;
  /** Nombre completo o nombre visible del estudiante. */
  nombre: string;
  /** Número de lista dentro del curso (puede ser null). */
  numeroLista: number | null;
  curso: string;
  fecha: string;
  /** Hora de salida en formato HH:MM. */
  inicio: string;
  /** Hora de regreso; null mientras el alumno está fuera. */
  fin: string | null;
  duracionMin: number | null;
  /** true si superó el límite configurado para el establecimiento. */
  excedeLimite: boolean;
  registradoPor: string;
  createdAt: string;
};

export type Anotacion = {
  id: string;
  cardId: string;
  /** Nombre completo o nombre visible del estudiante. */
  nombre: string;
  /** Número de lista dentro del curso (puede ser null). */
  numeroLista: number | null;
  curso: string;
  tipo: "positiva" | "negativa";
  categoria: CategoriaAnotacion;
  comentario: string;
  fecha: string;
  hora: string;
  registradoPor: string;
  createdAt: string;
};

/** Límite de minutos fuera del aula antes de marcar una alerta. */
export const LIMITE_BANO_MINUTOS = 10;

/** Máximo de permisos de baño por alumno en un día antes de alertar. */
export const LIMITE_BANO_POR_DIA = 3;

export function esEstadoAsistencia(value: string): value is EstadoAsistencia {
  return (ESTADOS_ASISTENCIA as readonly string[]).includes(value);
}

export function esCategoriaAnotacion(value: string): value is CategoriaAnotacion {
  return (CATEGORIAS_ANOTACION as readonly string[]).includes(value);
}

export function esRol(value: string): value is Rol {
  return (ROLES as readonly string[]).includes(value);
}

const ETIQUETAS_ASISTENCIA: Record<EstadoAsistencia, string> = {
  presente: "Presente",
  atrasado: "Atrasado",
  ausente: "Ausente",
};

export function etiquetaAsistencia(estado: EstadoAsistencia): string {
  return ETIQUETAS_ASISTENCIA[estado];
}

export type Amigo = {
  id: string;
  /** Tarjeta del alumno que agrega al amigo. */
  ownerCardId: string;
  /** Tarjeta del alumno amigo. */
  friendCardId: string;
  nombre: string;
  curso: string | null;
  numeroLista: number | null;
  createdAt: string;
};
export function nuevoId(prefijo: string): string {
  const azar = Math.random().toString(36).slice(2, 10);
  return `${prefijo}_${Date.now().toString(36)}${azar}`;
}
