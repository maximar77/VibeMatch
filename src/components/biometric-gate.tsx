"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  authenticateBiometric,
  biometricAvailability,
  biometricEnabled,
  marcarSesionBiometricaDesbloqueada,
  sesionBiometricaDesbloqueada,
  setBiometricEnabled,
  type BiometricAvailability,
} from "@/lib/biometric";

/**
 * Bloqueo opcional de la app con huella.
 *
 * Solo se activa si el alumno lo habilitó desde /app/seguridad y está dentro
 * de la APK Android. En el navegador no se muestra nada.
 */
export function BiometricGate() {
  const [bloqueada, setBloqueada] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [error, setError] = useState(false);
  const [disponibilidad, setDisponibilidad] =
    useState<BiometricAvailability>("unsupported");
  const autoLanzado = useRef(false);

  useEffect(() => {
    if (!biometricEnabled() || sesionBiometricaDesbloqueada()) return;

    const estado = biometricAvailability();
    setDisponibilidad(estado);

    // Si la huella ya no está disponible, no dejamos la app inutilizable.
    if (estado === "unsupported" || estado === "unavailable") {
      setBiometricEnabled(null, false);
      return;
    }

    setBloqueada(true);
  }, []);

  const desbloquear = useCallback(async () => {
    setVerificando(true);
    setError(false);
    const ok = await authenticateBiometric();
    setVerificando(false);

    if (ok) {
      marcarSesionBiometricaDesbloqueada();
      setBloqueada(false);
      return;
    }

    setError(true);
  }, []);

  useEffect(() => {
    if (!bloqueada || autoLanzado.current) return;
    if (disponibilidad !== "available") return;

    autoLanzado.current = true;
    void desbloquear();
  }, [bloqueada, disponibilidad, desbloquear]);

  const entrarSinHuella = () => {
    setBiometricEnabled(null, false);
    setBloqueada(false);
  };

  if (!bloqueada) return null;

  const sinHuellaRegistrada = disponibilidad === "none";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/95 px-5 backdrop-blur-xl">
      <div className="glass w-full max-w-sm rounded-[2rem] p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-brand-strong/30 bg-brand-strong/10 text-3xl">
          🔒
        </div>
        <h2 className="mt-5 text-2xl font-bold tracking-tight">VibeMatch bloqueado</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          {sinHuellaRegistrada
            ? "Este dispositivo no tiene una huella registrada. Configúrala en Ajustes de Android o entra sin huella."
            : error
              ? "No se pudo confirmar tu huella. Puedes intentarlo otra vez."
              : "Confirma tu huella para abrir la app."}
        </p>

        {!sinHuellaRegistrada && (
          <button
            type="button"
            onClick={() => void desbloquear()}
            disabled={verificando}
            className="mt-6 w-full rounded-full bg-brand-strong px-6 py-3.5 text-sm font-semibold text-ink transition hover:bg-brand-strong/85 disabled:opacity-50"
          >
            {verificando ? "Esperando huella…" : error ? "Reintentar huella" : "Usar huella"}
          </button>
        )}

        <button
          type="button"
          onClick={entrarSinHuella}
          className="mt-3 text-xs font-medium text-zinc-500 transition hover:text-zinc-300"
        >
          Entrar sin huella en este dispositivo
        </button>
      </div>
    </div>
  );
}
