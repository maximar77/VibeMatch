const enlaces = [
  { tipo: "registro", label: "Registro diario" },
  { tipo: "asistencia", label: "Asistencia" },
  { tipo: "eventos", label: "Salidas y retiros" },
  { tipo: "permisos", label: "Baño" },
  { tipo: "anotaciones", label: "Anotaciones" },
  { tipo: "todo", label: "Libro completo" },
] as const;

/**
 * Descargas Excel (.xlsx) del curso.
 *
 * Cada archivo incluye fecha, hora exacta, curso, nombre completo y número de
 * lista. El curso se toma de la sesión docente en el servidor.
 */
export function ProfesorExportLinks({
  curso,
  className = "",
}: {
  curso: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
        Descargar Excel · {curso}
      </span>
      {enlaces.map((enlace) => (
        <a
          key={enlace.tipo}
          href={`/api/profesor/exportar/${enlace.tipo}`}
          download
          title={`Descargar ${enlace.label} en Excel`}
          className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold text-zinc-300 transition hover:border-brand-strong/40 hover:bg-brand-strong/10 hover:text-white"
        >
          {enlace.label} ↓
        </a>
      ))}
    </div>
  );
}
