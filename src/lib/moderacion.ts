/**
 * Moderación de lenguaje para canchitas de chat VibeMatch.
 *
 * Filtra palabras inapropiadas y detecta contenido que deba ser revisado.
 * Diseñado para entornos escolares (Ley 21.801 de convivencia escolar).
 */

export const PALABRAS_PROHIBIDAS = [
  // Ejemplo: palabras ofensivas básicas (personalizable por el establecimiento)
  "estupido", "idiota", "tonto",
] as const;

/**
 * Evalúa si un texto contiene lenguaje inapropiado.
 * Devuelve un objeto con el resultado y, si aplica, el texto filtrado.
 */
export function evaluarMensaje(texto: string): {
  apto: boolean;
  textoFiltrado: string;
  motivo?: string;
} {
  let textoFiltrado = texto;
  let encontrado = false;

  for (const palabra of PALABRAS_PROHIBIDAS) {
    const regex = new RegExp(`\\b${palabra}\\b`, "gi");
    if (regex.test(textoFiltrado)) {
      encontrado = true;
      textoFiltrado = textoFiltrado.replace(regex, "***");
    }
  }

  return {
    apto: !encontrado,
    textoFiltrado,
    motivo: encontrado
      ? "El mensaje contiene lenguaje no adecuado para el entorno escolar y fue filtrado."
      : undefined,
  };
}

/**
 * Valida que un mensaje cumpla con las reglas del chat.
 */
export function validarMensaje(texto: string): {
  valido: boolean;
  error?: string;
} {
  const limpio = texto.trim();
  if (limpio.length === 0) {
    return { valido: false, error: "El mensaje no puede estar vacío." };
  }
  if (limpio.length > 500) {
    return { valido: false, error: "El mensaje es demasiado largo (máximo 500 caracteres)." };
  }
  return { valido: true };
}

/**
 * Tipos de acción de moderación.
 */
export type AccionModeracion =
  | "mensaje_enviado"
  | "mensaje_filtrado"
  | "usuario_reportado"
  | "usuario_silenciado";

export type EventoModeracion = {
  tipo: AccionModeracion;
  usuarioId: string;
  canal: string;
  timestamp: string;
  detalle?: string;
};