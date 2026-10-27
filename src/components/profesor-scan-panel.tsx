"use client";

import { useState } from "react";
import { QRScanner } from "@/components/qr-scanner";
import {
  registrarAnotacionProfesorAction,
  registrarAsistenciaProfesorAction,
  registrarPermisoBanoProfesorAction,
  resolverTarjetaAction,
  type ResultadoAccionProfesor,
} from "@/app/profesor-actions";
import {
  CATEGORIAS_ANOTACION,
  type CategoriaAnotacion,
  type EstadoAsistencia,
} from "@/lib/school-schema";
import { fechaEnZona, horaEnZona } from "@/lib/fecha";

type TarjetaInfo = {
  id: string;
  nombre: string;
  curso: string;
  numeroLista: number | null;
};

type Accion =
  | "asistencia"
  | "bano-salida"
  | "bano-regreso"
  | "positiva"
  | "negativa";

const ACCIONES: {
  id: Accion;
  icono: string;
  titulo: string;
  descripcion: string;
}[] = [
  {
    id: "asistencia",
    icono: "✅",
    titulo: "Asistencia",
    descripcion: "Presente, atrasado o ausente.",
  },
  {
    id: "bano-salida",
    icono: "🚻",
    titulo: "Baño · salida",
    descripcion: "Abre un permiso y marca la hora.",
  },
  {
    id: "bano-regreso",
    icono: "↩️",
    titulo: "Baño · regreso",
    descripcion: "Cierra el permiso y calcula minutos.",
  },
  {
    id: "positiva",
    icono: "⭐",
    titulo: "Anotación positiva",
    descripcion: "Refuerzo de convivencia o académico.",
  },
  {
    id: "negativa",
    icono: "📝",
    titulo: "Anotación negativa",
    descripcion: "Registro para seguimiento y convivencia.",
  },
];

const ESTADOS: { id: EstadoAsistencia; label: string }[] = [
  { id: "presente", label: "Presente" },
  { id: "atrasado", label: "Atrasado" },
  { id: "ausente", label: "Ausente" },
];

function fechaLocal(): string {
  return fechaEnZona();
}

function horaLocal(): string {
  return horaEnZona();
}

function normalizarEntrada(raw: string): string {
  let valor = raw.trim();
  try {
    const url = new URL(valor);
    const partes = url.pathname.split("/").filter(Boolean);
    if (partes.length) valor = decodeURIComponent(partes[partes.length - 1]);
  } catch {
    // No es una URL: se usa el código tal cual.
  }
  return valor;
}

function etiquetaAccion(accion: Accion, estado: EstadoAsistencia): string {
  if (accion === "asistencia") return `Asistencia · ${estado}`;
  if (accion === "bano-salida") return "Permiso de baño · salida";
  if (accion === "bano-regreso") return "Permiso de baño · regreso";
  return accion === "positiva" ? "Anotación positiva" : "Anotación negativa";
}

export function ProfesorScanPanel({ cursoProfesor }: { cursoProfesor: string }) {
  const [accion, setAccion] = useState<Accion>("asistencia");
  const [estado, setEstado] = useState<EstadoAsistencia>("presente");
  const [categoria, setCategoria] = useState<CategoriaAnotacion>("Convivencia");
  const [comentario, setComentario] = useState("");
  const [curso, setCurso] = useState(cursoProfesor);
  const [numeroLista, setNumeroLista] = useState("");
  const [codigoManual, setCodigoManual] = useState("");
  const [tarjeta, setTarjeta] = useState<TarjetaInfo | null>(null);
  const [metodo, setMetodo] = useState<"qr" | "manual">("qr");
  const [resolviendo, setResolviendo] = useState(false);
  const [registrando, setRegistrando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoAccionProfesor | null>(null);

  const esAnotacion = accion === "positiva" || accion === "negativa";
  const comentarioValido = !esAnotacion || comentario.trim().length >= 3;

  const cambiarAccion = (nueva: Accion) => {
    setAccion(nueva);
    setResultado(null);
    setError(null);
  };

  const resolver = async (raw: string, origen: "qr" | "manual") => {
    const valor = normalizarEntrada(raw);
    if (!valor) return;

    setResolviendo(true);
    setError(null);
    setResultado(null);
    try {
      const encontrada = await resolverTarjetaAction(valor);
      if (!encontrada) {
        setTarjeta(null);
        setNumeroLista("");
        setError("No encontramos esa tarjeta. Revisa el código o vuelve a escanear.");
        return;
      }
      setTarjeta(encontrada);
      setNumeroLista(encontrada.numeroLista ? String(encontrada.numeroLista) : "");
      setMetodo(origen);
    } catch {
      setTarjeta(null);
      setError("No se pudo leer la tarjeta. Inténtalo otra vez.");
    } finally {
      setResolviendo(false);
    }
  };

  const registrar = async () => {
    if (!tarjeta || registrando) return;
    if (esAnotacion && !comentarioValido) {
      setError("Escribe un comentario de al menos 3 caracteres.");
      return;
    }

    const formData = new FormData();
    formData.set("cardId", tarjeta.id);
    formData.set("curso", curso.trim() || cursoProfesor);
    formData.set("numeroLista", numeroLista.trim());
    formData.set("fecha", fechaLocal());
    formData.set("hora", horaLocal());
    formData.set("metodo", metodo);

    if (accion === "asistencia") {
      formData.set("estado", estado);
    } else if (accion === "bano-salida" || accion === "bano-regreso") {
      formData.set("accion", accion === "bano-salida" ? "salida" : "regreso");
    } else {
      formData.set("tipo", accion);
      formData.set("categoria", categoria);
      formData.set("comentario", comentario);
    }

    setRegistrando(true);
    setError(null);
    setResultado(null);
    try {
      const respuesta =
        accion === "asistencia"
          ? await registrarAsistenciaProfesorAction(formData)
          : accion === "bano-salida" || accion === "bano-regreso"
          ? await registrarPermisoBanoProfesorAction(formData)
          : await registrarAnotacionProfesorAction(formData);

      setResultado(respuesta);
      if (!respuesta.ok) setError(respuesta.mensaje);
    } catch {
      setError("No se pudo guardar el registro. Revisa la conexión e inténtalo otra vez.");
    } finally {
      setRegistrando(false);
    }
  };

  const limpiarTarjeta = () => {
    setTarjeta(null);
    setCodigoManual("");
    setNumeroLista("");
    setResultado(null);
    setError(null);
    if (esAnotacion) setComentario("");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="grid gap-6">
        <section className="glass rounded-[2rem] p-6">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-brand-soft">
            Paso 1
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
            ¿Qué vas a registrar?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Elige la acción antes de escanear. Así la tarjeta se usa para
            confirmar al alumno y no para adivinar qué querías hacer.
          </p>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {ACCIONES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => cambiarAccion(item.id)}
                aria-pressed={accion === item.id}
                className={`rounded-2xl border p-4 text-left transition ${
                  accion === item.id
                    ? "border-brand-strong/60 bg-brand-strong/15 text-white"
                    : "border-white/10 bg-white/[0.025] text-zinc-300 hover:border-white/20 hover:bg-white/5"
                }`}
              >
                <span className="text-lg">{item.icono}</span>
                <span className="mt-2 block text-sm font-semibold">{item.titulo}</span>
                <span className="mt-0.5 block text-[11px] leading-relaxed text-zinc-500">
                  {item.descripcion}
                </span>
              </button>
            ))}
          </div>

          {accion === "asistencia" && (
            <div className="mt-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                Estado
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {ESTADOS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setEstado(item.id)}
                    aria-pressed={estado === item.id}
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                      estado === item.id
                        ? item.id === "presente"
                          ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-200"
                          : item.id === "atrasado"
                          ? "border-amber-300/40 bg-amber-300/15 text-amber-200"
                          : "border-rose-400/40 bg-rose-400/15 text-rose-200"
                        : "border-white/10 bg-white/[0.03] text-zinc-400 hover:bg-white/5"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {esAnotacion && (
            <div className="mt-5 grid gap-3">
              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                  Categoría
                </span>
                <select
                  value={categoria}
                  onChange={(event) =>
                    setCategoria(event.target.value as CategoriaAnotacion)
                  }
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-brand-strong/60"
                >
                  {CATEGORIAS_ANOTACION.map((item) => (
                    <option key={item} value={item} className="bg-surface">
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                  Comentario · mínimo 3 caracteres
                </span>
                <textarea
                  value={comentario}
                  onChange={(event) => setComentario(event.target.value)}
                  rows={3}
                  maxLength={300}
                  placeholder="Describe brevemente lo ocurrido…"
                  className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-brand-strong/60 focus:ring-2 focus:ring-brand-strong/20"
                />
                <span className="mt-1 block text-right text-[10px] text-zinc-600">
                  {comentario.length}/300
                </span>
              </label>
            </div>
          )}

          <label className="mt-5 block">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
              Curso para guardar el registro
            </span>
            <input
              value={curso}
              onChange={(event) => setCurso(event.target.value)}
              type="text"
              maxLength={40}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-brand-strong/60"
            />
          </label>
        </section>

        <section className="glass rounded-[2rem] p-6">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-brand-soft">
            Paso 2
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
            Escanea la tarjeta
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Cámara o código manual. Si el QR trae una URL, extraemos el token
            automáticamente.
          </p>

          <div className="mt-5">
            <QRScanner
              label="Abrir cámara y escanear"
              onDetect={(valor) => void resolver(valor, "qr")}
            />
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void resolver(codigoManual, "manual");
            }}
            className="mt-4 flex gap-2"
          >
            <input
              value={codigoManual}
              onChange={(event) => setCodigoManual(event.target.value)}
              placeholder="VM-0001 o token de la tarjeta"
              className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-brand-strong/60"
            />
            <button
              type="submit"
              disabled={resolviendo || !codigoManual.trim()}
              className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/5 disabled:opacity-50"
            >
              {resolviendo ? "Buscando…" : "Buscar"}
            </button>
          </form>

          {error && (
            <p className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </p>
          )}
        </section>
      </div>

      <aside className="grid content-start gap-6">
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-brand-soft">
            Paso 3
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
            Confirma el registro
          </h2>

          {!tarjeta ? (
            <div className="mt-5 rounded-2xl border border-dashed border-white/15 p-6 text-center">
              <p className="text-2xl">🪪</p>
              <p className="mt-2 text-sm font-medium text-zinc-300">
                Todavía no hay una tarjeta seleccionada.
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Escanea o busca el código para ver el nombre, el curso y el número
                de lista.
              </p>
            </div>
          ) : (
            <div className="mt-5">
              <div className="rounded-2xl border border-brand-strong/25 bg-brand-strong/10 p-4">
                <p className="text-2xl font-bold text-white">{tarjeta.nombre}</p>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <dt className="text-zinc-500">N° de lista</dt>
                    <dd className="mt-0.5 font-semibold text-zinc-200">
                      {numeroLista.trim() || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Curso de la tarjeta</dt>
                    <dd className="mt-0.5 font-semibold text-zinc-200">
                      {tarjeta.curso || "—"}
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-zinc-500">Tarjeta</dt>
                    <dd className="mt-0.5 font-mono text-zinc-300">{tarjeta.id}</dd>
                  </div>
                </dl>

                <label className="mt-3 block border-t border-white/10 pt-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                    N° de lista para este registro
                  </span>
                  <input
                    value={numeroLista}
                    onChange={(event) =>
                      setNumeroLista(event.target.value.replace(/\D/g, "").slice(0, 3))
                    }
                    type="text"
                    inputMode="numeric"
                    maxLength={3}
                    placeholder="Ej: 12"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-brand-strong/60"
                  />
                  <span className="mt-1 block text-[10px] text-zinc-500">
                    Puedes corregirlo antes de confirmar. Queda en el CSV del curso.
                  </span>
                </label>
              </div>

              <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm">
                <p className="text-zinc-500">Se guardará</p>
                <p className="mt-1 font-semibold text-white">
                  {etiquetaAccion(accion, estado)}
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  Curso: {curso.trim() || cursoProfesor} · Fecha: {fechaLocal()} ·
                  Hora: {horaLocal()}
                </p>
                {esAnotacion && (
                  <p className="mt-2 rounded-xl bg-black/20 px-3 py-2 text-xs text-zinc-300">
                    {categoria}: {comentario.trim() || "Sin comentario todavía"}
                  </p>
                )}
              </div>

              {resultado?.ok && (
                <p className="mt-3 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
                  {resultado.mensaje}
                </p>
              )}

              <div className="mt-4 grid gap-2">
                <button
                  type="button"
                  onClick={() => void registrar()}
                  disabled={registrando || !comentarioValido}
                  className="rounded-full bg-brand-strong px-6 py-3.5 text-sm font-semibold text-ink transition hover:bg-brand-strong/85 disabled:opacity-50"
                >
                  {registrando ? "Guardando…" : `Registrar ${etiquetaAccion(accion, estado)}`}
                </button>
                <button
                  type="button"
                  onClick={limpiarTarjeta}
                  className="rounded-full border border-white/10 px-6 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-white/5"
                >
                  Escanear otra tarjeta
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.02] p-6 text-sm leading-relaxed text-zinc-400">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-brand-soft">
            Qué queda en el archivo
          </p>
          <p className="mt-3">
            Cada registro guarda <strong className="text-zinc-200">nombre</strong>,{" "}
            <strong className="text-zinc-200">N° de lista</strong>,{" "}
            <strong className="text-zinc-200">curso</strong>,{" "}
            <strong className="text-zinc-200">fecha</strong> y{" "}
            <strong className="text-zinc-200">hora</strong>. Desde los botones de
            exportar puedes descargar el CSV de tu curso para abrirlo en Excel.
          </p>
        </section>
      </aside>
    </div>
  );
}
