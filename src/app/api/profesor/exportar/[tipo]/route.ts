import { NextResponse } from "next/server";
import { leerProfesorSesion } from "@/lib/teachers";
import {
  hojaExcelAnotaciones,
  hojaExcelAsistencia,
  hojaExcelEventos,
  hojaExcelPermisos,
  hojaExcelRegistroDiario,
  listarAnotaciones,
  listarAsistencia,
  listarEventos,
  listarPermisos,
} from "@/lib/school";
import { fechaEnZona } from "@/lib/fecha";
import { generarXlsx, type HojaExcel } from "@/lib/xlsx";

/**
 * Exportación Excel del curso para el panel docente.
 *
 * GET /api/profesor/exportar/[tipo]?fecha=AAAA-MM-DD
 *
 * Tipos: asistencia, eventos, registro, permisos, anotaciones y todo.
 * El curso siempre sale de la sesión docente: manipular la URL no permite
 * descargar datos de otro curso.
 */

const TIPOS = [
  "asistencia",
  "eventos",
  "registro",
  "permisos",
  "anotaciones",
  "todo",
] as const;
type Tipo = (typeof TIPOS)[number];

const ETIQUETAS: Record<Tipo, string> = {
  asistencia: "asistencia",
  eventos: "salidas-retiros",
  registro: "registro-diario",
  permisos: "permisos-bano",
  anotaciones: "anotaciones",
  todo: "registro-completo",
};

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
  const curso = profesor.curso;
  const fecha = url.searchParams.get("fecha")?.trim() || undefined;

  const asistencia = listarAsistencia({ curso, fecha });
  const eventos = listarEventos({ curso, fecha });
  const permisos = listarPermisos({ curso, fecha });
  const anotaciones = listarAnotaciones({ curso }).filter(
    (item) => !fecha || item.fecha === fecha,
  );

  let hojas: HojaExcel[];
  switch (tipo as Tipo) {
    case "asistencia":
      hojas = [hojaExcelAsistencia(asistencia)];
      break;
    case "eventos":
      hojas = [hojaExcelEventos(eventos)];
      break;
    case "registro":
      hojas = [hojaExcelRegistroDiario(asistencia, eventos)];
      break;
    case "permisos":
      hojas = [hojaExcelPermisos(permisos)];
      break;
    case "anotaciones":
      hojas = [hojaExcelAnotaciones(anotaciones)];
      break;
    default:
      hojas = [
        hojaExcelAsistencia(asistencia),
        hojaExcelEventos(eventos),
        hojaExcelRegistroDiario(asistencia, eventos),
        hojaExcelPermisos(permisos),
        hojaExcelAnotaciones(anotaciones),
      ];
      break;
  }

  const archivo = generarXlsx(hojas);
  const nombre = `vibematch-${ETIQUETAS[tipo as Tipo]}-${slugCurso(
    curso,
  )}-${fechaEnZona()}.xlsx`;

  return new Response(new Uint8Array(archivo), {
    headers: {
      "content-type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": `attachment; filename="${nombre}"`,
      "content-length": String(archivo.length),
      "cache-control": "no-store",
    },
  });
}
