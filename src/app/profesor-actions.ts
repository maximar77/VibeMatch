"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  autenticarProfesor,
  crearSesionProfesor,
  TEACHER_COOKIE,
  opcionesCookieProfesor,
} from "@/lib/teachers";
import {
  guardarAsistencia,
  guardarPermiso,
  guardarAnotacion,
  listarAsistencia,
  listarPermisos,
  listarAnotaciones,
} from "@/lib/school";
import {
  esEstadoAsistencia,
  type EstadoAsistencia,
  type CategoriaAnotacion,
  esCategoriaAnotacion,
} from "@/lib/school-schema";

export async function entrarProfesorAction(formData: FormData) {
  const codigo = String(formData.get("codigo") ?? "").trim();

  const profesor = autenticarProfesor(codigo);
  if (!profesor) {
    redirect("/profesor/login?error=credenciales_invalidas");
  }

  const cookieStore = await cookies();
  cookieStore.set(TEACHER_COOKIE, crearSesionProfesor(profesor.id), {
    ...opcionesCookieProfesor(),
  });

  redirect("/profesor/asistencia");
}

export async function salirProfesorAction() {
  const cookieStore = await cookies();
  cookieStore.delete(TEACHER_COOKIE);
  redirect("/profesor/login");
}

export async function registrarAsistenciaAction(formData: FormData): Promise<void> {
  const cardId = String(formData.get("cardId") ?? "");
  const estadoRaw = String(formData.get("estado") ?? "presente");
  const curso = String(formData.get("curso") ?? "");
  const fecha = String(formData.get("fecha") ?? "");
  const hora = String(formData.get("hora") ?? "");

  if (!esEstadoAsistencia(estadoRaw)) {
    return;
  }

  guardarAsistencia({
    cardId,
    curso,
    nombre: "",
    numeroLista: null,
    fecha,
    hora,
    estado: estadoRaw as EstadoAsistencia,
    registradoPor: "profesor",
    metodo: "nfc",
  });
}

export async function registrarPermisoBanoAction(formData: FormData): Promise<void> {
  const cardId = String(formData.get("cardId") ?? "");
  const accion = String(formData.get("accion") ?? "salida");
  const curso = String(formData.get("curso") ?? "");
  const fecha = String(formData.get("fecha") ?? "");
  const hora = String(formData.get("hora") ?? "");

  guardarPermiso({
    id: `bano_${Date.now()}`,
    cardId,
    curso,
    fecha,
    inicio: accion === "salida" ? hora : "",
    fin: accion === "regreso" ? hora : null,
    duracionMin: null,
    excedeLimite: false,
    registradoPor: "profesor",
    createdAt: new Date().toISOString(),
  });
}

export async function registrarAnotacionAction(formData: FormData): Promise<void> {
  const cardId = String(formData.get("cardId") ?? "");
  const tipoRaw = String(formData.get("tipo") ?? "positiva");
  const categoriaRaw = String(formData.get("categoria") ?? "Otro");
  const comentario = String(formData.get("comentario") ?? "");
  const curso = String(formData.get("curso") ?? "");
  const fecha = String(formData.get("fecha") ?? "");
  const hora = String(formData.get("hora") ?? "");

  if (tipoRaw !== "positiva" && tipoRaw !== "negativa") {
    return;
  }

  if (!esCategoriaAnotacion(categoriaRaw)) {
    return;
  }

  guardarAnotacion({
    cardId,
    curso,
    tipo: tipoRaw,
    categoria: categoriaRaw as CategoriaAnotacion,
    comentario,
    fecha,
    hora,
    registradoPor: "profesor",
  });
}

export async function obtenerAsistencia(filtro: {
  curso?: string;
  fecha?: string;
}) {
  return listarAsistencia(filtro);
}

export async function obtenerPermisos(filtro: {
  fecha?: string;
  abiertos?: boolean;
}) {
  return listarPermisos(filtro);
}

export async function obtenerAnotaciones(filtro: {
  curso?: string;
  tipo?: "positiva" | "negativa";
}) {
  return listarAnotaciones(filtro);
}