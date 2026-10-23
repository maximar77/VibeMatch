"use client";

import type { Perfil } from "@/lib/profile-schema";
import { generarTarjetaPerfil, nombreArchivoTarjeta } from "@/lib/share-card";

/**
 * Comparte la tarjeta del perfil.
 *
 * En la app Android (Capacitor) guarda el PNG en caché y abre la hoja de
 * compartir nativa. En el navegador usa Web Share API o descarga el archivo.
 * Funciona igual sin conexión porque la imagen se dibuja en el dispositivo.
 */

function blobADataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(String(lector.result));
    lector.onerror = () => reject(new Error("No se pudo leer la imagen."));
    lector.readAsDataURL(blob);
  });
}

export type ResultadoCompartir =
  | { tipo: "compartido" }
  | { tipo: "descargado"; archivo: string }
  | { tipo: "cancelado" }
  | { tipo: "error"; mensaje: string };

export async function compartirPerfil(
  perfil: Perfil,
  establecimiento: string,
  texto: string,
): Promise<ResultadoCompartir> {
  let blob: Blob;
  try {
    blob = await generarTarjetaPerfil(perfil, establecimiento);
  } catch {
    return { tipo: "error", mensaje: "No se pudo generar la imagen del perfil." };
  }

  const archivo = nombreArchivoTarjeta(perfil);

  // 1) App Android: archivo en caché + Share nativo.
  try {
    const { Filesystem, Directory } = await import("@capacitor/filesystem");
    const { Share } = await import("@capacitor/share");

    const dataUrl = await blobADataUrl(blob);
    const base64 = dataUrl.split(",")[1] ?? "";

    await Filesystem.writeFile({
      path: archivo,
      data: base64,
      directory: Directory.Cache,
    });

    const { uri } = await Filesystem.getUri({ path: archivo, directory: Directory.Cache });

    await Share.share({
      title: "Mi perfil VibeMatch",
      text: texto,
      files: [uri],
    });

    return { tipo: "compartido" };
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "";
    // El usuario canceló la hoja de compartir: no es un fallo.
    if (/cancel/i.test(mensaje)) return { tipo: "cancelado" };
    // Sin plugin nativo: seguimos con el navegador.
  }

  // 2) Navegador con Web Share API (incluye compartir archivos).
  const file = new File([blob], archivo, { type: "image/png" });
  const puedeCompartirArchivos =
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] });

  if (puedeCompartirArchivos && typeof navigator.share === "function") {
    try {
      await navigator.share({ files: [file], text: texto, title: "Mi perfil VibeMatch" });
      return { tipo: "compartido" };
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : "";
      if (/abort|cancel/i.test(mensaje)) return { tipo: "cancelado" };
    }
  }

  // 3) Último recurso: descargar la imagen.
  try {
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = archivo;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return { tipo: "descargado", archivo };
  } catch {
    return { tipo: "error", mensaje: "Tu dispositivo no permitió compartir la imagen." };
  }
}
