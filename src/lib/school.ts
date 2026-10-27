import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import type {
  Anotacion,
  PermisoBano,
  RegistroAsistencia,
  Amigo,
} from "@/lib/school-schema";
import { DATA_DIR } from "@/lib/data-dir";

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
