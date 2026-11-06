/**
 * Filtrado de palabras prohibidas para ambiente escolar.
 *
 * Reemplaza una lista predefinida de insultos/palabras ofensivas por "****"
 * usando una expresión regular case-insensitive. Si no hay palabras prohibidas,
 * devuelve el texto unchanged.
 */

export const PALABRAS_PROHIBIDAS = [
  "puta",
  "mierda",
  "imbecil",
  "tonto",
  "estupido",
  "idiota",
] as const;

export function filtrarInsultos(texto: string): string {
  let resultado = texto;

  for (const palabra of PALABRAS_PROHIBIDAS) {
    const regex = new RegExp(`\\b${palabra}\\b`, "gi");
    if (regex.test(resultado)) {
      resultado = resultado.replace(regex, "****");
    }
  }

  return resultado;
}