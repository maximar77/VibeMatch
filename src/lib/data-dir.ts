import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * Directorio de datos de ejecución.
 *
 * Por defecto es `./data`, junto al servidor. En AlwaysData los datos deben
 * vivir fuera de la carpeta de la aplicación para sobrevivir a cada despliegue:
 * se configura `VIBEMATCH_DATA_DIR=/home/<cuenta>/vibematch-data`.
 *
 * En plataformas sin disco persistente (por ejemplo Vercel) se puede apuntar a
 * `/tmp/vibematch-data`; la app funciona, pero los cambios se pierden al
 * reiniciar la instancia.
 */
const DEFAULT_DIR = path.join(process.cwd(), "data");
const configuredDir = process.env.VIBEMATCH_DATA_DIR?.trim();

export const DATA_DIR = configuredDir ? path.resolve(configuredDir) : DEFAULT_DIR;

function esDirectorioEfimero(dir: string): boolean {
  const temporales = new Set([
    path.resolve(os.tmpdir()),
    "/tmp",
    "/var/tmp",
    "/dev/shm",
  ]);

  for (const temporal of temporales) {
    if (dir === temporal || dir.startsWith(`${temporal}${path.sep}`)) {
      return true;
    }
  }
  return false;
}

/**
 * Indica si se espera que los datos sobrevivan a un reinicio.
 *
 * Se puede forzar con `VIBEMATCH_DATA_PERSISTENT=1` (AlwaysData, Oracle) o
 * `VIBEMATCH_DATA_PERSISTENT=0` (demos efímeras). Sin override se considera
 * persistente todo directorio que no esté bajo un directorio temporal.
 */
function detectarPersistencia(): boolean {
  const override = process.env.VIBEMATCH_DATA_PERSISTENT?.trim().toLowerCase();
  if (override === "1" || override === "true") return true;
  if (override === "0" || override === "false") return false;
  return !esDirectorioEfimero(DATA_DIR);
}

export const DATA_IS_PERSISTENT = detectarPersistencia();

try {
  mkdirSync(/* turbopackIgnore: true */ DATA_DIR, { recursive: true });
} catch {
  // El directorio semilla puede ser de solo lectura. Las lecturas funcionan;
  // las escrituras fallarán con un error explícito en el módulo que las haga.
}

/**
 * Copia los archivos semilla que necesita el primer arranque.
 *
 * AlwaysData entrega una carpeta persistente vacía la primera vez. Sin este
 * paso no habría tarjetas NFC/QR válidas ni cuentas docentes iniciales, aunque
 * el resto de la app sí podría crear sus propios archivos.
 */
function sembrarDatosIniciales(): void {
  const semillas = ["cards.json", "teachers.json"];
  for (const nombre of semillas) {
    const origen = path.join(DEFAULT_DIR, nombre);
    const destino = path.join(DATA_DIR, nombre);
    if (origen === destino || existsSync(/* turbopackIgnore: true */ destino) || !existsSync(origen)) {
      continue;
    }
    try {
      copyFileSync(/* turbopackIgnore: true */ origen, /* turbopackIgnore: true */ destino);
    } catch {
      // Sin semilla la app sigue funcionando; el módulo correspondiente
      // creará el archivo vacío cuando se realice la primera escritura.
    }
  }
}

sembrarDatosIniciales();
