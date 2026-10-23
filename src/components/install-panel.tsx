"use client";

import { useEffect, useState } from "react";
import {
  detectPlatformFromUserAgent,
  type Platform,
} from "@/lib/platform";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type Props = {
  appName?: string;
  initialPlatform?: Platform;
};

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

export function InstallPanel({ appName = "VibeMatch", initialPlatform = "other" }: Props) {
  const [platform, setPlatform] = useState<Platform>(initialPlatform);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [standalone, setStandalone] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const nextPlatform = detectPlatformFromUserAgent(
      navigator.userAgent,
      navigator.platform,
      navigator.maxTouchPoints,
    );
    const nextStandalone = isStandalone();
    queueMicrotask(() => {
      setPlatform(nextPlatform);
      setStandalone(nextStandalone);
    });

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function instalar() {
    if (!deferred) return;

    await deferred.prompt();
    const choice = await deferred.userChoice;

    if (choice.outcome === "accepted") {
      setInstalled(true);
      setMessage("Instalación iniciada. Busca VibeMatch en tu pantalla de inicio.");
    } else {
      setMessage("Puedes instalarla más tarde desde el menú de tu navegador.");
    }
    setDeferred(null);
  }

  if (installed || standalone) {
    return (
      <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-5">
        <p className="text-sm font-semibold text-emerald-200">
          {appName} ya está instalada en este dispositivo.
        </p>
        <p className="mt-1 text-xs leading-relaxed text-emerald-100/75">
          Abre la app desde tu pantalla de inicio para usarla en modo pantalla
          completa, con tu sesión y tu perfil.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-zinc-300">
          {platform === "ios" && "iPhone / iPad · Safari"}
          {platform === "mac" && "Mac · Safari o Chrome"}
          {platform === "android" && "Android · Chrome"}
          {platform === "windows" && "Windows · Chrome o Edge"}
          {platform === "other" && "Tu navegador"}
        </span>
        <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-medium text-emerald-300">
          Web app instalable
        </span>
      </div>

      {deferred ? (
        <div>
          <button
            type="button"
            onClick={instalar}
            className="rounded-full bg-brand-strong px-6 py-3 text-sm font-semibold text-ink transition hover:bg-brand-strong/85"
          >
            Instalar {appName}
          </button>
          <p className="mt-2 text-xs text-zinc-500">
            Se abrirá el instalador de tu navegador. No necesitas descargar un APK.
          </p>
        </div>
      ) : null}

      {platform === "ios" ? (
        <ol className="grid gap-3 text-sm text-zinc-300">
          <li className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <span className="font-semibold text-white">1. Abre esta página en Safari.</span>{" "}
            En iPhone o iPad, la instalación se hace desde el menú Compartir.
          </li>
          <li className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <span className="font-semibold text-white">2. Toca Compartir.</span> Es el
            icono del cuadrado con la flecha hacia arriba.
          </li>
          <li className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <span className="font-semibold text-white">3. Elige “Añadir a pantalla de inicio”.</span>{" "}
            Confirma el nombre VibeMatch y toca Añadir.
          </li>
          <li className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <span className="font-semibold text-white">4. Abre VibeMatch desde el icono.</span>{" "}
            Tu perfil seguirá asociado a tu tarjeta.
          </li>
        </ol>
      ) : null}

      {platform === "mac" ? (
        <div className="grid gap-3 text-sm text-zinc-300">
          <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <span className="font-semibold text-white">En Safari:</span> abre el menú
            Archivo y elige “Añadir al Dock” (macOS Sonoma o posterior). En Chrome o
            Edge, usa el icono de instalar de la barra de direcciones.
          </p>
          <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <span className="font-semibold text-white">En Chrome o Edge:</span> si el
            botón “Instalar” no aparece, abre el menú del navegador y busca “Instalar
            VibeMatch” o “Instalar aplicación”.
          </p>
        </div>
      ) : null}

      {platform === "android" && !deferred ? (
        <div className="grid gap-3 text-sm text-zinc-300">
          <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <span className="font-semibold text-white">Abre esta página en Chrome.</span>{" "}
            Toca el menú de tres puntos y elige “Instalar aplicación” o “Añadir a
            pantalla de inicio”.
          </p>
        </div>
      ) : null}

      {platform === "windows" && !deferred ? (
        <div className="grid gap-3 text-sm text-zinc-300">
          <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <span className="font-semibold text-white">En Chrome o Edge:</span> usa el
            icono de instalar de la barra de direcciones o el menú “Aplicaciones” y
            elige “Instalar VibeMatch”.
          </p>
        </div>
      ) : null}

      {platform === "other" && !deferred ? (
        <div className="grid gap-3 text-sm text-zinc-300">
          <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <span className="font-semibold text-white">En tu navegador:</span> abre el
            menú y busca “Instalar aplicación”, “Añadir a pantalla de inicio” o “Add to
            Home Screen”. Si no aparece, prueba en Chrome, Edge o Safari.
          </p>
        </div>
      ) : null}

      {message ? (
        <p className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-xs text-amber-100/80">
          {message}
        </p>
      ) : null}
    </div>
  );
}
