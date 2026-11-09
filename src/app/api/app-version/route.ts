import { NextResponse } from "next/server";
import {
  APP_APK_PATH,
  APP_UPDATE_NOTES,
  APP_VERSION,
  APP_VERSION_CODE,
} from "@/lib/app-version";

/**
 * Metadata pública de la versión nativa de VibeMatch.
 *
 * La app Android carga la web remota, así que las mejoras web llegan solas.
 * Este endpoint se usa únicamente para avisar cuando hay un APK nuevo que
 * cambia capacidades nativas (NFC, huella, cámara, enlaces profundos, etc.).
 */
export function GET(request: Request) {
  const configurada = process.env.VIBEMATCH_PUBLIC_URL?.trim();
  const origin =
    configurada && /^https:\/\//i.test(configurada)
      ? configurada.replace(/\/+$/, "")
      : new URL(request.url).origin;
  const apkConfigurada = process.env.VIBEMATCH_APP_APK_URL?.trim();

  // Solo aceptamos una URL absoluta HTTPS. Así un valor de desarrollo
  // (por ejemplo http://192.168.1.7:3000/...) nunca llega a los alumnos.
  const apkUrl =
    apkConfigurada && /^https:\/\//i.test(apkConfigurada)
      ? apkConfigurada
      : `${origin}${APP_APK_PATH}`;

  return NextResponse.json(
    {
      version: APP_VERSION,
      versionCode: APP_VERSION_CODE,
      apkUrl,
      notes: APP_UPDATE_NOTES,
    },
    { headers: { "cache-control": "no-store" } },
  );
}
