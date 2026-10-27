/**
 * Fechas y horas del establecimiento.
 *
 * Vercel y la mayoría de los servidores corren en UTC, mientras la escuela
 * trabaja en horario de Chile. Usar `toISOString()` directamente hacía que un
 * registro de las 21:00 quedara con la fecha del día siguiente. Centralizamos
 * la zona horaria para que asistencia, baño, anotaciones y CSV coincidan con
 * la fecha local del colegio.
 */
const ZONA_HORARIA =
  process.env.NEXT_PUBLIC_VIBEMATCH_TIMEZONE?.trim() || "America/Santiago";

function partes(ahora: Date): Record<string, string> {
  return Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: ZONA_HORARIA,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
      .formatToParts(ahora)
      .filter((parte) => parte.type !== "literal")
      .map((parte) => [parte.type, parte.value]),
  );
}

/** Fecha local del establecimiento en formato AAAA-MM-DD. */
export function fechaEnZona(ahora: Date = new Date()): string {
  const p = partes(ahora);
  return `${p.year}-${p.month}-${p.day}`;
}

/** Hora local del establecimiento en formato HH:MM (24 horas). */
export function horaEnZona(ahora: Date = new Date()): string {
  const p = partes(ahora);
  return `${p.hour === "24" ? "00" : p.hour}:${p.minute}`;
}
