import { NextResponse } from "next/server";
import { leerProfesorSesion } from "@/lib/teachers";

export async function GET() {
  const profesor = await leerProfesorSesion();
  if (!profesor) {
    return NextResponse.json({ autenticado: false }, { status: 401 });
  }
  return NextResponse.json({
    autenticado: true,
    profesor: {
      id: profesor.id,
      nombre: profesor.nombre,
      curso: profesor.curso,
    },
  });
}