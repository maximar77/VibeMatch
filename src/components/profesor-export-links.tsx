const enlaces = [
  { tipo: "asistencia", label: "Asistencia" },
  { tipo: "permisos", label: "Baño" },
  { tipo: "anotaciones", label: "Anotaciones" },
] as const;

/**
 * Descargas CSV por curso. Los archivos incluyen BOM UTF-8 y se abren
 * directamente en Excel, Google Sheets o LibreOffice.
 */
export function ProfesorExportLinks({
  curso,
  className = "",
}: {
  curso: string;
  className?: string;
}) {
  const query = encodeURIComponent(curso);
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
        Descargar CSV del curso
      </span>
      {enlaces.map((enlace) => (
        <a
          key={enlace.tipo}
          href={`/api/profesor/exportar/${enlace.tipo}?curso=${query}`}
          download
          className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold text-zinc-300 transition hover:border-brand-strong/40 hover:bg-brand-strong/10 hover:text-white"
        >
          {enlace.label} ↓
        </a>
      ))}
    </div>
  );
}
