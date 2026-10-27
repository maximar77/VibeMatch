import { NextResponse } from "next/server";
import { leerProfesorSesion } from "@/lib/teachers";
import {
  generarCsvAnotaciones,
  generarCsvAsistencia,
  generarCsvPermisos,
  listarAnotaciones,
  listarAsistencia,
  listarPermisos,
} from "@/lib/school";
import { fechaEnZona } from "@/lib/fecha";

const TIPOS = ["asistencia", "permisos", "anotaciones"] as const;
type Tipo = (typeof TIPOS)[number];

function slugCurso(curso: string): string {
  return (
    curso
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "curso"
  );
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tipo: string }> },
) {
  const profesor = await leerProfesorSesion();
  if (!profesor) {
    return NextResponse.json({ error: "sin_sesion" }, { status: 401 });
  }

  const { tipo } = await params;
  if (!TIPOS.includes(tipo as Tipo)) {
    return NextResponse.json({ error: "tipo_invalido" }, { status: 404 });
  }

  const url = new URL(request.url);
  // El curso se toma de la sesión docente para no exponer datos de otros
  // cursos aunque se manipule la URL.
  const curso = profesor.curso;
  const fecha = url.searchParams.get("fecha")?.trim() || undefined;

  let csv: string;
  let etiqueta: string;

  if (tipo === "asistencia") {
    csv = generarCsvAsistencia(listarAsistencia({ curso, fecha }));
    etiqueta = "asistencia";
  } else if (tipo === "permisos") {
    csv = generarCsvPermisos(listarPermisos({ curso, fecha }));
    etiqueta = "permisos-bano";
  } else {
    csv = generarCsvAnotaciones(listarAnotaciones({ curso }));
    etiqueta = "anotaciones";
  }

  const fechaArchivo = fechaEnZona();
  const nombre = `vibematch-${etiqueta}-${slugCurso(curso)}-${fechaArchivo}.csv`;

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${nombre}"`,
      "cache-control": "no-store",
    },
  });
}
