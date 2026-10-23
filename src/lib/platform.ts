export type Platform = "ios" | "mac" | "android" | "windows" | "other";

/**
 * Detección compartida entre servidor y cliente.
 *
 * El servidor solo ve el User-Agent, así que en iPadOS con UA de escritorio
 * puede devolver "mac". El cliente lo corrige con maxTouchPoints.
 */
export function detectPlatformFromUserAgent(
  userAgent: string,
  navigatorPlatform = "",
  maxTouchPoints = 0,
): Platform {
  const isIOS =
    /iPad|iPhone|iPod/.test(userAgent) ||
    (navigatorPlatform === "MacIntel" && maxTouchPoints > 1);

  if (isIOS) return "ios";
  if (/Android/.test(userAgent)) return "android";
  if (/Macintosh|Mac OS X/.test(userAgent)) return "mac";
  if (/Windows/.test(userAgent)) return "windows";
  return "other";
}
