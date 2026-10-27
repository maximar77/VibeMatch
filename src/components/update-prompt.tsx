"use client";

import { useEffect, useState } from "react";

type VersionInfo = {
  version: string;
  versionCode: number;
  apkUrl: string;
  notes?: string;
};

declare global {
  interface Window {
    VibeMatchNative?: {
      getVersion?: () => string;
      getVersionCode?: () => number;
      openUrl?: (url: string) => void;
    };
  }
}

function versionActual(): { version: string; codigo: number } | null {
  if (typeof window === "undefined") return null;

  const nativo = window.VibeMatchNative;
  if (nativo?.getVersion) {
    try {
      const version = nativo.getVersion();
      const codigo = nativo.getVersionCode?.() ?? 0;
      if (version) return { version, codigo };
    } catch {
      // Seguimos con el user agent.
    }
  }

  const match = window.navigator.userAgent.match(/VibeMatch\/(\d+\.\d+\.\d+)(?:\s*\((\d+)\))?/);
  if (!match) return null;
  return { version: match[1], codigo: Number(match[2] ?? 0) };
}

function comparar(a: string, b: string): number {
  const partesA = a.split(".").map((n) => Number(n) || 0);
  const partesB = b.split(".").map((n) => Number(n) || 0);
  for (let i = 0; i < Math.max(partesA.length, partesB.length); i += 1) {
    const diferencia = (partesA[i] ?? 0) - (partesB[i] ?? 0);
    if (diferencia !== 0) return diferencia;
  }
  return 0;
}

/**
 * Aviso de actualización para la app Android.
 *
 * La web se actualiza sola porque el APK carga la URL remota. Este aviso solo
 * aparece cuando cambia el binario nativo (por ejemplo, nuevas funciones de
 * NFC o cámara) y la versión instalada es menor que la publicada.
 */
export function UpdatePrompt() {
  const [nueva, setNueva] = useState<VersionInfo | null>(null);
  const [oculto, setOculto] = useState(false);

  useEffect(() => {
    const actual = versionActual();
    if (!actual) return;

    let activo = true;
    const revisar = async () => {
      try {
        const respuesta = await fetch("/api/app-version", { cache: "no-store" });
        if (!respuesta.ok) return;
        const data = (await respuesta.json()) as VersionInfo;
        if (!activo || !data?.version) return;

        const hayNueva =
          data.versionCode > actual.codigo ||
          (data.versionCode === actual.codigo && comparar(data.version, actual.version) > 0);
        if (!hayNueva) return;

        const descartada = sessionStorage.getItem(`vm_update_${data.version}`);
        if (!descartada) setNueva(data);
      } catch {
        // Sin conexión: se reintentará en la próxima carga.
      }
    };

    void revisar();
    return () => {
      activo = false;
    };
  }, []);

  if (!nueva || oculto) return null;

  const descargar = () => {
    if (window.VibeMatchNative?.openUrl) {
      window.VibeMatchNative.openUrl(nueva.apkUrl);
      return;
    }
    window.open(nueva.apkUrl, "_blank", "noopener,noreferrer");
  };

  const descartar = () => {
    sessionStorage.setItem(`vm_update_${nueva.version}`, "1");
    setOculto(true);
  };

  return (
    <div className="relative z-20 border-b border-brand-strong/20 bg-brand-strong/10">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3">
        <div className="text-sm text-brand-soft">
          <p className="font-semibold">
            Hay una actualización de la app: {nueva.version}
          </p>
          <p className="mt-0.5 text-xs text-brand-soft/65">
            {nueva.notes ?? "Tienes instalada una versión anterior de la app."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={descargar}
            className="rounded-full bg-brand-strong px-4 py-2 text-xs font-bold text-ink transition hover:bg-brand-strong/85"
          >
            Descargar APK
          </button>
          <button
            type="button"
            onClick={descartar}
            className="rounded-full border border-white/15 px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/5"
          >
            Después
          </button>
        </div>
      </div>
    </div>
  );
}
