/**
 * Versión nativa publicada de VibeMatch.
 *
 * La web se actualiza sola porque el APK carga la URL remota. Estos valores
 * solo cambian cuando se publica un binario nuevo. En producción se pueden
 * sobrescribir con VIBEMATCH_APP_VERSION / VIBEMATCH_APP_VERSION_CODE.
 */
export const APP_VERSION = process.env.VIBEMATCH_APP_VERSION?.trim() || "1.3.0";
export const APP_VERSION_CODE =
  Number(process.env.VIBEMATCH_APP_VERSION_CODE ?? "4") || 4;
export const APP_APK_PATH = `/descargas/VibeMatch-${APP_VERSION}.apk`;
export const APP_UPDATE_NOTES =
  process.env.VIBEMATCH_APP_NOTES?.trim() ||
  "Incluye huella nativa, descarga directa del APK y mejoras del panel docente.";
