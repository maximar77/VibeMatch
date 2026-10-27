"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import type { PublicacionMuro } from "@/lib/muros";

function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("") || "VM";
}

function fecha(iso: string): string {
  return new Date(iso).toLocaleString("es-CL", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Santiago",
  });
}

async function comprimirFoto(archivo: File): Promise<string> {
  if (!archivo.type.startsWith("image/")) {
    throw new Error("El archivo no es una imagen.");
  }
  if (archivo.size > 12 * 1024 * 1024) {
    throw new Error("La imagen original supera los 12 MB.");
  }

  const bitmap = await createImageBitmap(archivo);
  const maximo = 1280;
  const escala = Math.min(1, maximo / Math.max(bitmap.width, bitmap.height));
  const ancho = Math.max(1, Math.round(bitmap.width * escala));
  const alto = Math.max(1, Math.round(bitmap.height * escala));

  const canvas = document.createElement("canvas");
  canvas.width = ancho;
  canvas.height = alto;
  const contexto = canvas.getContext("2d");
  if (!contexto) throw new Error("No se pudo preparar la imagen.");
  contexto.fillStyle = "#0b0b12";
  contexto.fillRect(0, 0, ancho, alto);
  contexto.drawImage(bitmap, 0, 0, ancho, alto);
  bitmap.close();

  return canvas.toDataURL("image/jpeg", 0.78);
}

type Props = {
  muro: string;
  nombreMuro: string;
  emoji: string;
  publicacionesIniciales: PublicacionMuro[];
};

export function MuroPanel({
  muro,
  nombreMuro,
  emoji,
  publicacionesIniciales,
}: Props) {
  const [publicaciones, setPublicaciones] = useState<PublicacionMuro[]>(
    publicacionesIniciales,
  );
  const [texto, setTexto] = useState("");
  const [imagen, setImagen] = useState<string | null>(null);
  const [procesandoFoto, setProcesandoFoto] = useState(false);
  const [publicando, setPublicando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const archivoRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let activo = true;
    let temporizador: ReturnType<typeof setTimeout> | null = null;

    const cargar = async () => {
      try {
        const respuesta = await fetch(`/api/muros/${muro}`, { cache: "no-store" });
        if (respuesta.ok) {
          const data = (await respuesta.json()) as {
            publicaciones: PublicacionMuro[];
          };
          if (activo) setPublicaciones(data.publicaciones);
        }
      } catch {
        // Se reintenta en el próximo ciclo.
      } finally {
        if (activo) temporizador = setTimeout(cargar, 8000);
      }
    };

    temporizador = setTimeout(cargar, 8000);
    return () => {
      activo = false;
      if (temporizador) clearTimeout(temporizador);
    };
  }, [muro]);

  const elegirFoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = event.target.files?.[0];
    if (!archivo) return;

    setError(null);
    setProcesandoFoto(true);
    try {
      setImagen(await comprimirFoto(archivo));
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : "No se pudo leer la foto.");
    } finally {
      setProcesandoFoto(false);
      if (archivoRef.current) archivoRef.current.value = "";
    }
  };

  const publicar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (publicando) return;
    if (!texto.trim() && !imagen) {
      setError("Escribe algo o adjunta una foto.");
      return;
    }

    setPublicando(true);
    setError(null);
    setAviso(null);

    try {
      const respuesta = await fetch(`/api/muros/${muro}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ texto: texto.trim(), imagen }),
      });
      const data = (await respuesta.json()) as {
        publicacion?: PublicacionMuro;
        filtrado?: boolean;
        motivo?: string;
        mensaje?: string;
      };

      if (!respuesta.ok || !data.publicacion) {
        setError(data.mensaje ?? "No se pudo publicar.");
        return;
      }

      const nueva = data.publicacion;
      setPublicaciones((actuales) => [
        nueva,
        ...actuales.filter((item) => item.id !== nueva.id),
      ]);
      setTexto("");
      setImagen(null);
      if (data.filtrado) {
        setAviso(data.motivo ?? "El texto fue moderado antes de publicarse.");
      }
    } catch {
      setError("Sin conexión. La publicación no se envió.");
    } finally {
      setPublicando(false);
    }
  };

  return (
    <div className="grid gap-6">
      <section className="glass rounded-[2rem] p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.06] text-xl">
            {emoji}
          </span>
          <div>
            <p className="text-sm font-semibold text-white">Publicar en {nombreMuro}</p>
            <p className="text-xs text-zinc-500">Texto corto, una foto o ambas cosas.</p>
          </div>
        </div>

        <form onSubmit={publicar} className="mt-4 space-y-3">
          <label className="block">
            <span className="sr-only">Texto de la publicación</span>
            <textarea
              value={texto}
              onChange={(event) => setTexto(event.target.value)}
              maxLength={300}
              rows={3}
              placeholder={`¿Qué quieres compartir en ${nombreMuro}?`}
              className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-brand-strong/60 focus:ring-2 focus:ring-brand-strong/20"
            />
          </label>

          {imagen && (
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagen}
                alt="Vista previa de la foto"
                className="max-h-72 w-full object-contain"
              />
              <button
                type="button"
                onClick={() => setImagen(null)}
                className="absolute right-2 top-2 rounded-full bg-black/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur"
              >
                Quitar foto
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <label className="cursor-pointer rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-zinc-300 transition hover:border-white/25 hover:bg-white/5">
                {procesandoFoto ? "Preparando…" : imagen ? "Cambiar foto" : "📷 Añadir foto"}
                <input
                  ref={archivoRef}
                  type="file"
                  accept="image/*"
                  onChange={elegirFoto}
                  disabled={procesandoFoto}
                  className="sr-only"
                />
              </label>
              <span className="text-[10px] text-zinc-600">{texto.length}/300</span>
            </div>
            <button
              type="submit"
              disabled={publicando || procesandoFoto || (!texto.trim() && !imagen)}
              className="rounded-full bg-brand-strong px-6 py-2.5 text-sm font-semibold text-ink transition hover:bg-brand-strong/85 disabled:opacity-50"
            >
              {publicando ? "Publicando…" : "Publicar"}
            </button>
          </div>

          {error && (
            <p className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-2 text-sm text-rose-200">
              {error}
            </p>
          )}
          {aviso && (
            <p className="rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-sm text-amber-100">
              {aviso}
            </p>
          )}
        </form>
      </section>

      <section className="space-y-4">
        {publicaciones.length === 0 && (
          <div className="glass rounded-[2rem] p-10 text-center">
            <p className="text-3xl">{emoji}</p>
            <p className="mt-3 text-sm font-medium text-zinc-300">
              Este muro está esperando su primera publicación.
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Comparte una idea, un logro o una foto del colegio.
            </p>
          </div>
        )}

        {publicaciones.map((publicacion) => (
          <article
            key={publicacion.id}
            className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03]"
          >
            <div className="flex items-center gap-3 px-5 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-soft text-xs font-bold text-white">
                {iniciales(publicacion.usuarioNombre)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {publicacion.usuarioNombre}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                  {fecha(publicacion.createdAt)}
                </p>
              </div>
            </div>

            {publicacion.texto && (
              <p className="whitespace-pre-wrap break-words px-5 pb-4 text-sm leading-relaxed text-zinc-200">
                {publicacion.texto}
              </p>
            )}

            {publicacion.imagen && (
              <div className="border-t border-white/5 bg-black/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={publicacion.imagen}
                  alt={`Foto publicada por ${publicacion.usuarioNombre}`}
                  loading="lazy"
                  className="max-h-[34rem] w-full object-contain"
                />
              </div>
            )}
          </article>
        ))}
      </section>
    </div>
  );
}
