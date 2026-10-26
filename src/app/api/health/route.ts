import { accessSync, constants } from "node:fs";
import { connection, NextResponse } from "next/server";
import { DATA_DIR, DATA_IS_PERSISTENT } from "@/lib/data-dir";

/**
 * Healthcheck para Docker, Caddy y Oracle Cloud.
 *
 * Comprueba que el proceso responde, que el volumen de datos es escribible y
 * que el secreto de sesión está configurado. No expone rutas ni datos.
 */
export async function GET() {
  // Con Cache Components hay que marcar explícitamente que la respuesta se
  // genera en cada petición: el estado del volumen y del entorno puede cambiar.
  await connection();

  const secretConfigured = Boolean(process.env.VIBEMATCH_SECRET);

  let dataWritable = false;
  try {
    accessSync(DATA_DIR, constants.W_OK);
    dataWritable = true;
  } catch {
    dataWritable = false;
  }

  const ok = dataWritable && secretConfigured;

  return NextResponse.json(
    {
      ok,
      service: "vibematch",
      checks: {
        dataWritable,
        dataPersistent: DATA_IS_PERSISTENT,
        secretConfigured,
      },
      timestamp: new Date().toISOString(),
    },
    {
      status: ok ? 200 : 503,
      headers: { "cache-control": "no-store" },
    },
  );
}
