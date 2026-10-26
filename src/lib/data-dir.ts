import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";

/**
 * Directorio de datos de ejecución.
 *
 * En producción (Oracle/Docker) es `./data`, respaldado por el volumen
 * `vibematch_data`. En plataformas sin disco persistente se puede apuntar a
 * otro directorio con `VIBEMATCH_DATA_DIR` (por ejemplo `/tmp/vibematch-data`
 * en Vercel). En ese caso los cambios no sobreviven a la instancia, pero la
 * demo puede leer las tarjetas semilla y crear datos durante su vida útil.
 */
const SEED_DIR = path.join(process.cwd(), "data");
const configuredDir = process.env.VIBEMATCH_DATA_DIR?.trim();

export const DATA_DIR = configuredDir ? path.resolve(configuredDir) : SEED_DIR;
export const DATA_IS_PERSISTENT = DATA_DIR === SEED_DIR;

try {
  mkdirSync(DATA_DIR, { recursive: true });
} catch {
  // El directorio semilla puede ser de solo lectura. Las lecturas funcionan;
  // las escrituras fallarán con un error explícito en el módulo que las haga.
}

// Copia las tarjetas semilla (solo hashes) al directorio temporal la primera
// vez, para que los enlaces NFC/QR sigan funcionando en la demo.
if (!DATA_IS_PERSISTENT) {
  const seedCards = path.join(SEED_DIR, "cards.json");
  const targetCards = path.join(DATA_DIR, "cards.json");
  if (!existsSync(targetCards) && existsSync(seedCards)) {
    try {
      copyFileSync(seedCards, targetCards);
    } catch {
      // Sin tarjetas semilla la app sigue funcionando, pero no validará enlaces.
    }
  }
}
