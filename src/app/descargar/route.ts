import { NextResponse } from "next/server";
import { APP_APK_PATH } from "@/lib/app-version";

/**
 * Enlace corto y estable para compartir la descarga del APK:
 * https://<dominio>/descargar
 */
export function GET(request: Request) {
  const configurada = process.env.VIBEMATCH_PUBLIC_URL?.trim();
  const base =
    configurada && /^https:\/\//i.test(configurada)
      ? configurada.replace(/\/+$/, "")
      : request.url;

  return NextResponse.redirect(new URL(APP_APK_PATH, base));
}
