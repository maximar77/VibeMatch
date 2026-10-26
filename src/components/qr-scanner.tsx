"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

type Props = {
  onDetect: (value: string) => void;
  label?: string;
};

/**
 * Escáner de código QR usando la cámara del dispositivo.
 *
 * Usa BarcodeDetector cuando el navegador lo soporta y cae a jsQR (decodificación
 * local de fotogramas) en WebViews antiguos. El video nunca sale del dispositivo.
 */
export function QRScanner({ onDetect, label = "Escanear código QR" }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const ultimoIntentoRef = useRef(0);
  const activoRef = useRef(false);
  const [activo, setActivo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [soportado, setSoportado] = useState<boolean | null>(null);

  useEffect(() => {
    setSoportado(
      typeof window !== "undefined" &&
        typeof navigator?.mediaDevices?.getUserMedia === "function",
    );
  }, []);

  const detener = useCallback(() => {
    activoRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setActivo(false);
  }, []);

  const iniciar = useCallback(async () => {
    setError(null);
    setActivo(true);
    activoRef.current = true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;

      if (!videoRef.current) {
        detener();
        return;
      }

      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      const Detector = (window as any).BarcodeDetector;
      const detector =
        Detector && typeof Detector === "function"
          ? new Detector({ formats: ["qr_code"] })
          : null;

      // Lienzo fuera de pantalla para jsQR.
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });

      let avisadoSinDetector = false;

      const loop = async () => {
        if (!activoRef.current || !videoRef.current) return;

        const video = videoRef.current;
        const listo =
          video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0;

        if (listo && detector) {
          try {
            const codes = await detector.detect(video);
            if (codes && codes.length > 0 && codes[0].rawValue) {
              onDetect(String(codes[0].rawValue));
              detener();
              return;
            }
          } catch {
            // BarcodeDetector puede fallar con algunos frames; seguimos.
          }
        } else if (listo && ctx) {
          // Limita la decodificación a ~6 fps para no congelar el WebView.
          const ahora = performance.now();
          if (ahora - ultimoIntentoRef.current > 160) {
            ultimoIntentoRef.current = ahora;

            const escala = Math.min(1, 720 / Math.max(video.videoWidth, 1));
            canvas.width = Math.max(1, Math.round(video.videoWidth * escala));
            canvas.height = Math.max(1, Math.round(video.videoHeight * escala));
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            try {
              const imagen = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const codigo = jsQR(imagen.data, canvas.width, canvas.height, {
                inversionAttempts: "dontInvert",
              });
              if (codigo?.data) {
                onDetect(codigo.data);
                detener();
                return;
              }
            } catch {
              // Frame no decodificable; se reintenta en el siguiente ciclo.
            }
          }
        } else if (!listo && !detector && !avisadoSinDetector) {
          avisadoSinDetector = true;
        }

        rafRef.current = requestAnimationFrame(() => {
          void loop();
        });
      };

      rafRef.current = requestAnimationFrame(() => {
        void loop();
      });
    } catch (e) {
      const nombre = e instanceof DOMException ? e.name : "";
      setError(
        nombre === "NotAllowedError"
          ? "Permiso de cámara denegado. Actívalo en los ajustes del navegador o de la app."
          : "No se pudo acceder a la cámara. Verifica que esté disponible y sin uso por otra app.",
      );
      detener();
    }
  }, [detener, onDetect]);

  useEffect(() => {
    return () => detener();
  }, [detener]);

  return (
    <div className="grid gap-3">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black">
        <video
          ref={videoRef}
          className="aspect-square w-full object-cover"
          autoPlay
          playsInline
          muted
        />
        {!activo && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <p className="max-w-[15rem] text-center text-xs text-zinc-400">
              Apunta la cámara al QR impreso en la tarjeta VibeMatch.
            </p>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-rose-300">{error}</p>}
      {soportado === false && (
        <p className="text-xs text-amber-200">
          Este navegador no permite usar la cámara. Ingresa el código de la
          tarjeta manualmente.
        </p>
      )}
      <div className="flex gap-3">
        {!activo ? (
          <button
            type="button"
            onClick={() => void iniciar()}
            disabled={soportado === false}
            className="rounded-full bg-brand-strong px-6 py-3 text-sm font-semibold text-ink transition hover:bg-brand-strong/85 disabled:opacity-50"
          >
            {label}
          </button>
        ) : (
          <button
            type="button"
            onClick={detener}
            className="rounded-full border border-white/10 px-6 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-white/5"
          >
            Detener cámara
          </button>
        )}
      </div>
    </div>
  );
}
