import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { DATA_DIR } from "@/lib/data-dir";

export type StoreConfig = {
  nombre: string;
  path: string;
};

function ruta(nombre: string) {
  return path.join(DATA_DIR, `${nombre}.json`);
}

export function leerJSON<T>(nombre: string, defecto: T): T {
  const p = ruta(nombre);
  if (!existsSync(p)) return defecto;
  try {
    const raw = readFileSync(p, "utf8").replace(/^\uFEFF/, "");
    return JSON.parse(raw) as T;
  } catch {
    return defecto;
  }
}

export function escribirJSON<T>(nombre: string, datos: T) {
  const p = ruta(nombre);
  const { renameSync } = require("node:fs");
  const tmp = `${p}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(tmp, JSON.stringify(datos, null, 2) + "\n", "utf8");
  renameSync(tmp, p);
}
