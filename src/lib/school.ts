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
} from "@/lib/school-schema";

/**
 * Persistencia local de la gestión escolar VibeMatch.
 *
 * Guarda asistencia, permisos de baño y anotaciones en JSON dentro de data/,
 * con escritura atómica (archivo temporal + rename) para no corromper datos
 * si el proceso se interrumpe. Todos estos archivos están ignorados por Git
 * porque contienen datos de estudiantes.
 */

const DATA_DIR = path.join(process.cwd(), "data");

type Store<T> = { version: 1; items: T[] };

function rutaDe(nombre: string): string {
  return path.join(DATA_DIR, `${nombre}.json`);
}

function leerStore<T>(nombre: string): Store<T> {
  const ruta = rutaDe(nombre);
  if (!existsSync(ruta)) return { version: 1, items: [] };

  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(ruta, "utf8"));
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
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
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
export function actualizarArchivoProfesor(teacherId: string): {
  ruta: string;
  total: number;
} {
  const registros = listarAsistencia({ teacherId });
  const csv = generarCsvAsistencia(registros);
  return { ruta: guardarArchivoAsistencia(teacherId, csv), total: registros.length };
}
