import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import {
  etiquetaAsistencia,
  etiquetaEventoSala,
  type Amigo,
  type Anotacion,
  type EventoSala,
  type PermisoBano,
  type RegistroAsistencia,
  type TipoEventoSala,
} from "@/lib/school-schema";
import { DATA_DIR } from "@/lib/data-dir";
import { buscarProfesor } from "@/lib/teachers";
import type { CeldaExcel, HojaExcel } from "@/lib/xlsx";

/**
 * Persistencia local de la gestión escolar VibeMatch.
 *
 * Guarda asistencia, permisos de baño y anotaciones en JSON dentro de data/,
 * con escritura atómica (archivo temporal + rename) para no corromper datos
 * si el proceso se interrumpe. Todos estos archivos están ignorados por Git
 * porque contienen datos de estudiantes.
 */

type Store<T> = { version: 1; items: T[] };

function rutaDe(nombre: string): string {
  return path.join(DATA_DIR, `${nombre}.json`);
}

function leerStore<T>(nombre: string): Store<T> {
  const ruta = rutaDe(nombre);
  if (!existsSync(ruta)) return { version: 1, items: [] };

  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(ruta, "utf8").replace(/^\uFEFF/, ""));
  } catch (error) {
    throw new Error(`No se pudo leer data/${nombre}.json.`, { cause: error });
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    !Array.isArray((parsed as Store<T>).items)
  ) {
    throw new Error(`data/${nombre}.json no tiene el formato esperado.`);
  }

  return { version: 1, items: (parsed as Store<T>).items };
}

function escribirStore<T>(nombre: string, store: Store<T>) {
  mkdirSync(DATA_DIR, { recursive: true });
  const ruta = rutaDe(nombre);
  const temporal = `${ruta}.${process.pid}.tmp`;
  writeFileSync(temporal, `${JSON.stringify(store, null, 2)}\n`, "utf8");
  renameSync(temporal, ruta);
}

// ------------------------------------------------------------ asistencia

export function listarAsistencia(filtro?: {
  curso?: string;
  fecha?: string;
  cardId?: string;
  teacherId?: string;
}): RegistroAsistencia[] {
  const { items } = leerStore<RegistroAsistencia>("asistencia");
  return items.filter((item) => {
    if (filtro?.curso && item.curso !== filtro.curso) return false;
    if (filtro?.fecha && item.fecha !== filtro.fecha) return false;
    if (filtro?.cardId && item.cardId !== filtro.cardId) return false;
    if (filtro?.teacherId && item.registradoPor !== filtro.teacherId) return false;
    return true;
  });
}

export function guardarAsistencia(
  registro: Omit<RegistroAsistencia, "id" | "createdAt">,
): RegistroAsistencia {
  const store = leerStore<RegistroAsistencia>("asistencia");

  // Un alumno tiene un solo estado por día: el último reemplaza al anterior.
  const existente = store.items.find(
    (item) =>
      item.cardId === registro.cardId && item.fecha === registro.fecha,
  );

  const guardado: RegistroAsistencia = {
    ...registro,
    id: existente?.id ?? `asis_${Date.now().toString(36)}`,
    createdAt: existente?.createdAt ?? new Date().toISOString(),
  };

  store.items = [
    ...store.items.filter((item) => item.id !== guardado.id),
    guardado,
  ];
  escribirStore("asistencia", store);
  return guardado;
}

// ------------------------------------------------------------ baño

export function listarPermisos(filtro?: {
  curso?: string;
  fecha?: string;
  cardId?: string;
  abiertos?: boolean;
}): PermisoBano[] {
  const { items } = leerStore<PermisoBano>("permisos");
  return items.filter((item) => {
    if (filtro?.curso && item.curso !== filtro.curso) return false;
    if (filtro?.fecha && item.fecha !== filtro.fecha) return false;
    if (filtro?.cardId && item.cardId !== filtro.cardId) return false;
    if (filtro?.abiertos && item.fin !== null) return false;
    return true;
  });
}

export function guardarPermiso(permiso: PermisoBano): PermisoBano {
  const store = leerStore<PermisoBano>("permisos");
  store.items = [...store.items.filter((item) => item.id !== permiso.id), permiso];
  escribirStore("permisos", store);
  return permiso;
}

// ------------------------------------------------------------ anotaciones

export function listarAnotaciones(filtro?: {
  curso?: string;
  cardId?: string;
  tipo?: "positiva" | "negativa";
}): Anotacion[] {
  const { items } = leerStore<Anotacion>("anotaciones");
  return items.filter((item) => {
    if (filtro?.curso && item.curso !== filtro.curso) return false;
    if (filtro?.cardId && item.cardId !== filtro.cardId) return false;
    if (filtro?.tipo && item.tipo !== filtro.tipo) return false;
    return true;
  });
}

export function guardarAnotacion(
  anotacion: Omit<Anotacion, "id" | "createdAt">,
): Anotacion {
  const store = leerStore<Anotacion>("anotaciones");
  const guardada: Anotacion = {
    ...anotacion,
    id: `anot_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
  };
  store.items = [...store.items, guardada];
  escribirStore("anotaciones", store);
  return guardada;
}

// ------------------------------------------------------------ eventos de sala

function ordenarEventos(eventos: EventoSala[]): EventoSala[] {
  return [...eventos].sort((a, b) => {
    const fecha = a.fecha.localeCompare(b.fecha);
    if (fecha !== 0) return fecha;
    const hora = a.hora.localeCompare(b.hora);
    if (hora !== 0) return hora;
    return a.createdAt.localeCompare(b.createdAt);
  });
}

export function listarEventos(filtro?: {
  curso?: string;
  fecha?: string;
  cardId?: string;
  tipo?: TipoEventoSala;
  teacherId?: string;
}): EventoSala[] {
  const { items } = leerStore<EventoSala>("eventos");
  return ordenarEventos(
    items.filter((item) => {
      if (filtro?.curso && item.curso !== filtro.curso) return false;
      if (filtro?.fecha && item.fecha !== filtro.fecha) return false;
      if (filtro?.cardId && item.cardId !== filtro.cardId) return false;
      if (filtro?.tipo && item.tipo !== filtro.tipo) return false;
      if (filtro?.teacherId && item.registradoPor !== filtro.teacherId) return false;
      return true;
    }),
  );
}

export function guardarEvento(
  evento: Omit<EventoSala, "id" | "createdAt">,
): EventoSala {
  const store = leerStore<EventoSala>("eventos");
  const guardado: EventoSala = {
    ...evento,
    id: `evt_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
  };
  store.items = [...store.items, guardado];
  escribirStore("eventos", store);
  return guardado;
}

/**
 * Devuelve la salida que sigue abierta para un alumno en una fecha, o null si
 * ya volvió, fue retirado o todavía no tiene movimientos.
 */
export function eventoSalaAbierto(
  cardId: string,
  fecha: string,
): EventoSala | null {
  const eventos = listarEventos({ cardId, fecha });
  const ultimo = eventos[eventos.length - 1] ?? null;
  return ultimo?.tipo === "salida" ? ultimo : null;
}

export type ResultadoCrearEvento =
  | { ok: true; evento: EventoSala }
  | { ok: false; error: string; mensaje: string };

/**
 * Valida la secuencia de movimientos y guarda el evento.
 *
 * Reglas:
 *  - salida: solo si el alumno no está ya fuera de la sala.
 *  - entrada: solo si tiene una salida abierta.
 *  - retiro: exige indicar quién retira; cierra cualquier salida abierta y no
 *    permite un segundo retiro el mismo día.
 *  - después de un retiro no se aceptan más movimientos ese día.
 */
export function crearEventoSala(datos: {
  cardId: string;
  nombre: string;
  numeroLista: number | null;
  curso: string;
  fecha: string;
  hora: string;
  tipo: TipoEventoSala;
  detalle: string;
  registradoPor: string;
}): ResultadoCrearEvento {
  const eventosDelDia = listarEventos({
    cardId: datos.cardId,
    fecha: datos.fecha,
  });
  const ultimo = eventosDelDia[eventosDelDia.length - 1] ?? null;
  const detalle = datos.detalle.trim().replace(/\s+/g, " ").slice(0, 200);

  if (ultimo?.tipo === "retiro") {
    return {
      ok: false,
      error: "alumno_retirado",
      mensaje: `${datos.nombre} ya fue retirado hoy; no se registran más movimientos.`,
    };
  }

  if (datos.tipo === "salida") {
    if (ultimo?.tipo === "salida") {
      return {
        ok: false,
        error: "salida_abierta",
        mensaje: `${datos.nombre} ya figura fuera de la sala desde las ${ultimo.hora}.`,
      };
    }
  } else if (datos.tipo === "entrada") {
    if (ultimo?.tipo !== "salida") {
      return {
        ok: false,
        error: "sin_salida_abierta",
        mensaje: `${datos.nombre} no tiene una salida abierta para registrar el regreso.`,
      };
    }
  } else if (datos.tipo === "retiro") {
    if (!detalle) {
      return {
        ok: false,
        error: "detalle_requerido",
        mensaje: "Escribe quién retira al alumno.",
      };
    }
  }

  const detalleFinal =
    detalle ||
    (datos.tipo === "salida"
      ? "Salida de sala"
      : datos.tipo === "entrada"
        ? "Regreso a sala"
        : "Retiro");

  const evento = guardarEvento({
    ...datos,
    detalle: detalleFinal,
  });

  return { ok: true, evento };
}

// ------------------------------------------------------------ archivo del profesor

const ARCHIVOS_DIR = path.join(DATA_DIR, "archivos-profesor");

function celdaCsv(value: unknown): string {
  let texto = String(value ?? "");

  // Evita que un nombre o comentario se evalúe como fórmula al abrir el CSV
  // en Excel. El texto sigue siendo legible, pero queda forzado a string.
  if (/^[=+\-@\t\r]/.test(texto)) texto = `'${texto}`;

  return `"${texto.replaceAll('"', '""')}"`;
}

/**
 * Convierte registros de asistencia en un CSV listo para Excel.
 * Usa BOM y CRLF para que Excel en Windows respete los acentos.
 */
export function generarCsvAsistencia(registros: RegistroAsistencia[]): string {
  const encabezado = [
    "Fecha",
    "Hora",
    "N° lista",
    "Nombre completo",
    "Curso",
    "Estado",
    "Método",
    "Tarjeta",
    "Registrado por",
  ];

  const filas = [...registros]
    .sort((a, b) => {
      const fecha = a.fecha.localeCompare(b.fecha);
      if (fecha !== 0) return fecha;
      const lista = (a.numeroLista ?? 0) - (b.numeroLista ?? 0);
      if (lista !== 0) return lista;
      return a.hora.localeCompare(b.hora);
    })
    .map((registro) =>
      [
        registro.fecha,
        registro.hora,
        registro.numeroLista ?? "",
        registro.nombre,
        registro.curso,
        registro.estado,
        registro.metodo,
        registro.cardId,
        registro.registradoPor,
      ]
        .map(celdaCsv)
        .join(","),
    );

  return `\uFEFF${[encabezado.map(celdaCsv).join(","), ...filas].join("\r\n")}\r\n`;
}

/**
 * Escribe el archivo de asistencia del profesor en data/archivos-profesor/.
 * Devuelve la ruta relativa para mostrarla en el panel.
 */
export function guardarArchivoAsistencia(teacherId: string, csv: string): string {
  mkdirSync(ARCHIVOS_DIR, { recursive: true });
  const nombre = `${teacherId}.csv`;
  const ruta = path.join(ARCHIVOS_DIR, nombre);
  writeFileSync(ruta, csv, "utf8");
  return path.posix.join("data/archivos-profesor", nombre);
}

/** Reconstruye y guarda el archivo del profesor a partir de sus registros. */
// ------------------------------------------------------------ amigos

export function listarAmigos(ownerCardId?: string): Amigo[] {
  const { items } = leerStore<Amigo>("amigos");
  return ownerCardId
    ? items.filter((a) => a.ownerCardId === ownerCardId)
    : items;
}

export function guardarAmigo(
  amigo: Omit<Amigo, "id" | "createdAt">,
): Amigo {
  const store = leerStore<Amigo>("amigos");
  const existente = store.items.find(
    (a) => a.ownerCardId === amigo.ownerCardId && a.friendCardId === amigo.friendCardId,
  );
  if (existente) return existente;
  const guardado: Amigo = {
    ...amigo,
    id: `amigo_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
  };
  store.items = [...store.items, guardado];
  escribirStore("amigos", store);
  return guardado;
}

// ------------------------------------------------------------ csv permisos (baño)

export function generarCsvPermisos(permisos: PermisoBano[]): string {
  const encabezado = [
    "Fecha",
    "N° lista",
    "Nombre completo",
    "Tarjeta",
    "Curso",
    "Salida",
    "Regreso",
    "Duración (min)",
    "Excede límite",
    "Registrado por",
  ];
  const filas = [...permisos]
    .sort((a, b) => {
      const fecha = a.fecha.localeCompare(b.fecha);
      if (fecha !== 0) return fecha;
      const lista = (a.numeroLista ?? 0) - (b.numeroLista ?? 0);
      if (lista !== 0) return lista;
      return a.inicio.localeCompare(b.inicio);
    })
    .map((p) =>
      [
        p.fecha,
        p.numeroLista ?? "",
        p.nombre ?? "",
        p.cardId,
        p.curso,
        p.inicio,
        p.fin ?? "En curso",
        p.duracionMin ?? "",
        p.excedeLimite ? "Sí" : "No",
        p.registradoPor,
      ]
        .map(celdaCsv)
        .join(","),
    );
  return `\uFEFF${[encabezado.map(celdaCsv).join(","), ...filas].join("\r\n")}\r\n`;
}

// Resumen por alumno: cuántas veces pidió baño y en qué días.
export function generarCsvResumenBano(permisos: PermisoBano[]): string {
  const porAlumno = new Map<string, { veces: number; dias: Set<string>; totalMin: number }>();
  for (const p of permisos) {
    const acc = porAlumno.get(p.cardId) ?? { veces: 0, dias: new Set(), totalMin: 0 };
    acc.veces += 1;
    acc.dias.add(p.fecha);
    acc.totalMin += p.duracionMin ?? 0;
    porAlumno.set(p.cardId, acc);
  }
  const encabezado = ["Tarjeta", "Veces (permisos)", "Días distintos", "Total minutos fuera", "Detalle de días"];
  const filas = [...porAlumno.entries()]
    .sort((a, b) => b[1].veces - a[1].veces)
    .map(([cardId, acc]) =>
      [
        cardId,
        acc.veces,
        acc.dias.size,
        acc.totalMin,
        [...acc.dias].sort().join(" | "),
      ]
        .map(celdaCsv)
        .join(","),
    );
  return `\uFEFF${[encabezado.map(celdaCsv).join(","), ...filas].join("\r\n")}\r\n`;
}

// ------------------------------------------------------------ csv anotaciones

export function generarCsvAnotaciones(anotaciones: Anotacion[]): string {
  const encabezado = [
    "Fecha",
    "Hora",
    "N° lista",
    "Nombre completo",
    "Curso",
    "Tipo",
    "Categoría",
    "Comentario",
    "Tarjeta",
    "Registrado por",
  ];
  const filas = [...anotaciones]
    .sort((a, b) => {
      const fecha = a.fecha.localeCompare(b.fecha);
      if (fecha !== 0) return fecha;
      const lista = (a.numeroLista ?? 0) - (b.numeroLista ?? 0);
      if (lista !== 0) return lista;
      return a.hora.localeCompare(b.hora);
    })
    .map((a) =>
      [
        a.fecha,
        a.hora,
        a.numeroLista ?? "",
        a.nombre ?? "",
        a.curso,
        a.tipo,
        a.categoria,
        a.comentario,
        a.cardId,
        a.registradoPor,
      ]
        .map(celdaCsv)
        .join(","),
    );
  return `\uFEFF${[encabezado.map(celdaCsv).join(","), ...filas].join("\r\n")}\r\n`;
}

export function actualizarArchivoAnotaciones(teacherId: string): {
  ruta: string;
  total: number;
} {
  const anotaciones = listarAnotaciones({}).filter(
    (a) => a.registradoPor === teacherId,
  );
  const csv = generarCsvAnotaciones(anotaciones);
  mkdirSync(ARCHIVOS_DIR, { recursive: true });
  const nombre = `${teacherId}-anotaciones.csv`;
  const ruta = path.join(ARCHIVOS_DIR, nombre);
  writeFileSync(ruta, csv, "utf8");
  return {
    ruta: path.posix.join("data/archivos-profesor", nombre),
    total: anotaciones.length,
  };
}

export function actualizarArchivoPermisos(teacherId: string): { ruta: string; total: number } {
  const permisos = listarPermisos({}).filter((p) => p.registradoPor === teacherId);
  const resumen = generarCsvResumenBano(permisos).replace(/^\uFEFF/, "");
  const csv =
    generarCsvPermisos(permisos) +
    "\r\n--- RESUMEN POR ALUMNO ---\r\n" +
    resumen;
  const ARCHIVOS_DIR = path.join(DATA_DIR, "archivos-profesor");
  mkdirSync(ARCHIVOS_DIR, { recursive: true });
  const nombre = `${teacherId}-permisos.csv`;
  const ruta = path.join(ARCHIVOS_DIR, nombre);
  writeFileSync(ruta, csv, "utf8");
  return { ruta: path.posix.join("data/archivos-profesor", nombre), total: permisos.length };
}

export function actualizarArchivoAmigos(teacherId: string, ownerCardId?: string): { ruta: string; total: number } {
  const amigos = ownerCardId ? listarAmigos(ownerCardId) : listarAmigos();
  const encabezado = ["Tarjeta dueño", "Tarjeta amigo", "Nombre", "Curso", "N° lista", "Agregado"];
  const filas = amigos.map((a) =>
    [a.ownerCardId, a.friendCardId, a.nombre, a.curso ?? "", a.numeroLista ?? "", a.createdAt]
      .map(celdaCsv)
      .join(","),
  );
  const csv = `\uFEFF${[encabezado.map(celdaCsv).join(","), ...filas].join("\r\n")}\r\n`;
  const ARCHIVOS_DIR = path.join(DATA_DIR, "archivos-profesor");
  mkdirSync(ARCHIVOS_DIR, { recursive: true });
  const nombre = `${teacherId}-amigos.csv`;
  const ruta = path.join(ARCHIVOS_DIR, nombre);
  writeFileSync(ruta, csv, "utf8");
  return { ruta: path.posix.join("data/archivos-profesor", nombre), total: amigos.length };
}

export function actualizarArchivoProfesor(teacherId: string): {
  ruta: string;
  total: number;
} {
  const registros = listarAsistencia({ teacherId });
  const csv = generarCsvAsistencia(registros);
  return { ruta: guardarArchivoAsistencia(teacherId, csv), total: registros.length };
}

// ------------------------------------------------------------ hojas de Excel

function nombreDocente(teacherId: string): string {
  if (!teacherId) return "";
  return buscarProfesor(teacherId)?.nombre ?? teacherId;
}

function etiquetaMetodo(metodo: RegistroAsistencia["metodo"]): string {
  if (metodo === "qr") return "QR";
  if (metodo === "manual") return "Manual";
  return "NFC";
}

function compararFechaHoraLista(
  a: { fecha: string; hora: string; curso: string; numeroLista: number | null },
  b: { fecha: string; hora: string; curso: string; numeroLista: number | null },
): number {
  const fecha = a.fecha.localeCompare(b.fecha);
  if (fecha !== 0) return fecha;
  const hora = a.hora.localeCompare(b.hora);
  if (hora !== 0) return hora;
  const curso = a.curso.localeCompare(b.curso, "es");
  if (curso !== 0) return curso;
  return (a.numeroLista ?? 9999) - (b.numeroLista ?? 9999);
}

export function hojaExcelAsistencia(
  registros: RegistroAsistencia[],
): HojaExcel {
  const filas: CeldaExcel[][] = [...registros]
    .sort(compararFechaHoraLista)
    .map((registro) => [
      registro.fecha,
      registro.hora,
      registro.curso,
      registro.nombre,
      registro.numeroLista ?? null,
      etiquetaAsistencia(registro.estado),
      etiquetaMetodo(registro.metodo),
      nombreDocente(registro.registradoPor),
    ]);

  return {
    nombre: "Asistencia",
    encabezados: [
      "Fecha",
      "Hora",
      "Curso",
      "Nombre completo",
      "N° lista",
      "Estado",
      "Método",
      "Registrado por",
    ],
    filas,
    anchos: [12, 8, 18, 32, 9, 12, 10, 26],
  };
}

export function hojaExcelEventos(eventos: EventoSala[]): HojaExcel {
  const filas: CeldaExcel[][] = [...eventos]
    .sort(compararFechaHoraLista)
    .map((evento) => [
      evento.fecha,
      evento.hora,
      evento.curso,
      evento.nombre,
      evento.numeroLista ?? null,
      etiquetaEventoSala(evento.tipo),
      evento.detalle,
      nombreDocente(evento.registradoPor),
    ]);

  return {
    nombre: "Salidas y retiros",
    encabezados: [
      "Fecha",
      "Hora",
      "Curso",
      "Nombre completo",
      "N° lista",
      "Evento",
      "Detalle",
      "Registrado por",
    ],
    filas,
    anchos: [12, 8, 18, 32, 9, 18, 36, 26],
  };
}

export function hojaExcelRegistroDiario(
  registros: RegistroAsistencia[],
  eventos: EventoSala[],
): HojaExcel {
  type FilaDiaria = {
    fecha: string;
    hora: string;
    curso: string;
    nombre: string;
    numeroLista: number | null;
    tipo: string;
    detalle: string;
    registradoPor: string;
    orden: number;
  };

  const filasOrigen: FilaDiaria[] = [
    ...registros.map((registro) => ({
      fecha: registro.fecha,
      hora: registro.hora,
      curso: registro.curso,
      nombre: registro.nombre,
      numeroLista: registro.numeroLista ?? null,
      tipo: "Asistencia",
      detalle: `${etiquetaAsistencia(registro.estado)} · ${etiquetaMetodo(
        registro.metodo,
      )}`,
      registradoPor: registro.registradoPor,
      orden: 0,
    })),
    ...eventos.map((evento) => ({
      fecha: evento.fecha,
      hora: evento.hora,
      curso: evento.curso,
      nombre: evento.nombre,
      numeroLista: evento.numeroLista ?? null,
      tipo: etiquetaEventoSala(evento.tipo),
      detalle: evento.detalle,
      registradoPor: evento.registradoPor,
      orden: 1,
    })),
  ];

  const filas: CeldaExcel[][] = filasOrigen
    .sort((a, b) => {
      const comparacion = compararFechaHoraLista(a, b);
      if (comparacion !== 0) return comparacion;
      return a.orden - b.orden;
    })
    .map((fila) => [
      fila.fecha,
      fila.hora,
      fila.curso,
      fila.nombre,
      fila.numeroLista,
      fila.tipo,
      fila.detalle,
      nombreDocente(fila.registradoPor),
    ]);

  return {
    nombre: "Registro diario",
    encabezados: [
      "Fecha",
      "Hora",
      "Curso",
      "Nombre completo",
      "N° lista",
      "Tipo",
      "Detalle",
      "Registrado por",
    ],
    filas,
    anchos: [12, 8, 18, 32, 9, 18, 36, 26],
  };
}

export function hojaExcelPermisos(permisos: PermisoBano[]): HojaExcel {
  const filas: CeldaExcel[][] = [...permisos]
    .sort((a, b) => {
      const fecha = a.fecha.localeCompare(b.fecha);
      if (fecha !== 0) return fecha;
      const hora = a.inicio.localeCompare(b.inicio);
      if (hora !== 0) return hora;
      const curso = a.curso.localeCompare(b.curso, "es");
      if (curso !== 0) return curso;
      return (a.numeroLista ?? 9999) - (b.numeroLista ?? 9999);
    })
    .map((permiso) => [
      permiso.fecha,
      permiso.inicio,
      permiso.fin ?? "En curso",
      permiso.curso,
      permiso.nombre,
      permiso.numeroLista ?? null,
      permiso.duracionMin ?? null,
      permiso.excedeLimite ? "Sí" : "No",
      nombreDocente(permiso.registradoPor),
    ]);

  return {
    nombre: "Baño",
    encabezados: [
      "Fecha",
      "Hora salida",
      "Hora regreso",
      "Curso",
      "Nombre completo",
      "N° lista",
      "Duración (min)",
      "Excede límite",
      "Registrado por",
    ],
    filas,
    anchos: [12, 12, 12, 18, 32, 9, 14, 13, 26],
  };
}

export function hojaExcelAnotaciones(anotaciones: Anotacion[]): HojaExcel {
  const filas: CeldaExcel[][] = [...anotaciones]
    .sort(compararFechaHoraLista)
    .map((anotacion) => [
      anotacion.fecha,
      anotacion.hora,
      anotacion.curso,
      anotacion.nombre,
      anotacion.numeroLista ?? null,
      anotacion.tipo,
      anotacion.categoria,
      anotacion.comentario,
      nombreDocente(anotacion.registradoPor),
    ]);

  return {
    nombre: "Anotaciones",
    encabezados: [
      "Fecha",
      "Hora",
      "Curso",
      "Nombre completo",
      "N° lista",
      "Tipo",
      "Categoría",
      "Comentario",
      "Registrado por",
    ],
    filas,
    anchos: [12, 8, 18, 32, 9, 11, 16, 52, 26],
  };
}
