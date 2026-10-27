import { NextResponse } from "next/server";

/**
 * Metadata pública de la versión nativa de VibeMatch.
 *
 * La app Android carga la web remota, así que las mejoras web llegan solas.
 * Este endpoint se usa únicamente para avisar cuando hay un APK nuevo que
 * cambia capacidades nativas (NFC, cámara, enlaces profundos, etc.).
 */
export function GET() {
  const version = process.env.VIBEMATCH_APP_VERSION?.trim() || "1.1.0";
  const versionCode = Number(process.env.VIBEMATCH_APP_VERSION_CODE ?? "2") || 2;
  const apkUrl =
    process.env.VIBEMATCH_APP_APK_URL?.trim() ||
    process.env.VIBEMATCH_APK_URL?.trim() ||
    `https://github.com/maximar77/VibeMatch/releases/latest/download/VibeMatch-${version}.apk`;

  return NextResponse.json(
    {
      version,
      versionCode,
      apkUrl,
      notes:
        process.env.VIBEMATCH_APP_NOTES?.trim() ||
        "Incluye mejoras de estabilidad y acceso a las nuevas funciones de la comunidad.",
    },
    { headers: { "cache-control": "no-store" } },
  );
}
