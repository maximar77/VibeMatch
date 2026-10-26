"use client";

import { useState } from "react";
import { QRScanner } from "@/components/qr-scanner";
import {
  registrarAsistenciaAction,
  registrarPermisoBanoAction,
  registrarAnotacionAction,
  registrarAmigoAction,
  resolverTarjetaAction,
} from "@/app/profesor-actions";

type TarjetaInfo = { id: string; nombre: string; curso: string; numeroLista: number | null };

export function ProfesorScanPanel() {
  const [cardId, setCardId] = useState("");
  const [tarjeta, setTarjeta] = useState<TarjetaInfo | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const resolver = async (raw: string) => {
    let valor = raw.trim();
    // Si el QR contiene una URL completa, extraer el token final.
    try {
      const url = new URL(valor);
      const partes = url.pathname.split("/").filter(Boolean);
      if (partes.length) valor = decodeURIComponent(partes[partes.length - 1]);
    } catch {
      // no es URL: usar tal cual
    }
    setCargando(true);
    setMensaje(null);
    const info = await resolverTarjetaAction(valor);
    setCargando(false);
    if (!info) {
      setMensaje("Tarjeta no encontrada.");
      return;
    }
    setCardId(info.id);
    setTarjeta(info);
  };

  const hoy = new Date().toISOString().slice(0, 10);
  const hora = new Date().toTimeString().slice(0, 5);

  const marcarPresente = async () => {
    if (!tarjeta) return;
    const fd = new FormData();
    fd.set("cardId", tarjeta.id);
    fd.set("estado", "presente");
    fd.set("curso", tarjeta.curso);
    fd.set("fecha", hoy);
    fd.set("hora", hora);
    await registrarAsistenciaAction(fd);
    setMensaje(`${tarjeta.nombre} marcado presente.`);
  };

  const permisoBano = async (accion: "salida" | "regreso") => {
    if (!tarjeta) return;
    const fd = new FormData();
    fd.set("cardId", tarjeta.id);
    fd.set("accion", accion);
    fd.set("curso", tarjeta.curso);
    fd.set("fecha", hoy);
    fd.set("hora", hora);
    await registrarPermisoBanoAction(fd);
    setMensaje(`Permiso de baño (${accion}) registrado para ${tarjeta.nombre}.`);
  };

  const anotar = async (tipo: "positiva" | "negativa") => {
    if (!tarjeta) return;
    const comentario = window.prompt("Comentario (mín. 3 caracteres):");
    if (!comentario || comentario.trim().length < 3) return;
    const categoria = window.prompt("Categoría (Convivencia/Académico/Participación/Puntualidad/Respeto/Otro):") || "Otro";
    const fd = new FormData();
    fd.set("cardId", tarjeta.id);
    fd.set("tipo", tipo);
    fd.set("categoria", categoria);
    fd.set("comentario", comentario);
    fd.set("curso", tarjeta.curso);
    fd.set("fecha", hoy);
    fd.set("hora", hora);
    await registrarAnotacionAction(fd);
    setMensaje(`Anotación ${tipo} registrada para ${tarjeta.nombre}.`);
  };

  const agregarAmigo = async () => {
    if (!tarjeta) return;
    const owner = window.prompt("Tarjeta del alumno dueño (id o token):");
    if (!owner) return;
    const fd = new FormData();
    fd.set("ownerCardId", owner.trim());
    fd.set("friendCardId", tarjeta.id);
    await registrarAmigoAction(fd);
    setMensaje(`${tarjeta.nombre} agregado como amigo.`);
  };

  return (
    <div className="grid gap-6">
      <div className="glass rounded-[2rem] p-6">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-brand-soft mb-3">
          Escanear tarjeta del alumno
        </p>
        <QRScanner onDetect={(v) => resolver(v)} />
        <div className="mt-4 flex gap-3">
          <input
            value={cardId}
            onChange={(e) => setCardId(e.target.value)}
            placeholder="O ingresa el código/token manualmente"
            className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-brand-strong/60"
          />
          <button
            type="button"
            onClick={() => resolver(cardId)}
            disabled={cargando || !cardId.trim()}
            className="rounded-full bg-brand-strong px-6 py-3 text-sm font-semibold text-ink transition hover:bg-brand-strong/85 disabled:opacity-50"
          >
            {cargando ? "Buscando…" : "Buscar"}
          </button>
        </div>
      </div>

      {tarjeta && (
        <div className="glass rounded-[2rem] p-6">
          <div className="mb-4">
            <p className="text-lg font-semibold text-white">{tarjeta.nombre}</p>
            <p className="text-sm text-zinc-400">
              {tarjeta.curso} · N° lista {tarjeta.numeroLista ?? "—"}
            </p>
          </div>
          {mensaje && <p className="mb-4 text-sm text-emerald-300">{mensaje}</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            <button onClick={marcarPresente} className="rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-ink transition hover:bg-emerald-400/90">
              Marcar presente hoy
            </button>
            <button onClick={() => permisoBano("salida")} className="rounded-full bg-amber-300 px-6 py-3 text-sm font-semibold text-ink transition hover:bg-amber-300/90">
              Permiso baño: salida
            </button>
            <button onClick={() => permisoBano("regreso")} className="rounded-full bg-amber-300/80 px-6 py-3 text-sm font-semibold text-ink transition hover:bg-amber-300/70">
              Permiso baño: regreso
            </button>
            <button onClick={() => anotar("positiva")} className="rounded-full bg-brand-strong px-6 py-3 text-sm font-semibold text-ink transition hover:bg-brand-strong/85">
              Anotación positiva
            </button>
            <button onClick={() => anotar("negativa")} className="rounded-full border border-rose-400/40 bg-rose-400/10 px-6 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-400/20">
              Anotación negativa
            </button>
            <button onClick={agregarAmigo} className="rounded-full border border-white/10 px-6 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-white/5">
              Añadir a amigos
            </button>
          </div>
        </div>
      )}
    </div>
  );
}