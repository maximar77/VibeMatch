"use server";

import { revalidatePath } from "next/cache";
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
  guardarAmigo,
  actualizarArchivoAnotaciones,
  actualizarArchivoPermisos,
  actualizarArchivoAmigos,
  actualizarArchivoProfesor,
} from "@/lib/school";
import { buscarTarjetaPorToken, listarTarjetas } from "@/lib/cards";
import { leerPerfil } from "@/lib/profiles";
import {
  esEstadoAsistencia,
  type EstadoAsistencia,
  type CategoriaAnotacion,
  esCategoriaAnotacion,
} from "@/lib/school-schema";

export async function entrarProfesorAction(formData: FormData) {
  const codigo = String(formData.get("codigo") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const profesor = autenticarProfesor(codigo, password);
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

import { leerProfesorSesion } from "@/lib/teachers";

export type ResultadoAccionProfesor = {
  ok: boolean;
  mensaje: string;
  nombre?: string;
};

type EstudianteResuelto = {
  id: string;
  nombre: string;
  cursoTarjeta: string | null;
  numeroLista: number | null;
};

function resolverEstudiante(cardIdRaw: string): EstudianteResuelto | null {
  const cardId = cardIdRaw.trim();
  if (!cardId) return null;

  const tarjeta =
    buscarTarjetaPorToken(cardId) ??
    listarTarjetas().find((item) => item.id === cardId);
  if (!tarjeta) return null;

  const perfil = leerPerfil(tarjeta.id);
  return {
    id: tarjeta.id,
    nombre:
      tarjeta.fullName ??
      perfil?.displayName ??
      tarjeta.holder ??
      "Alumno",
    cursoTarjeta: tarjeta.course ?? tarjeta.level ?? null,
    numeroLista: tarjeta.listNumber ?? null,
  };
}

async function profesorActual() {
  const profesor = await leerProfesorSesion();
  if (!profesor) redirect("/profesor/login");
  return profesor;
}

/**
 * El número de lista viene de la tarjeta o lo escribe el docente en el momento
 * de confirmar. Devolvemos `null` y marcamos `invalido` si el valor ingresado
 * no es válido, para no guardar basura en los archivos del curso.
 */
function leerNumeroLista(formData: FormData): {
  valor: number | null;
  invalido: boolean;
} {
  const raw = String(formData.get("numeroLista") ?? "").trim();
  if (!raw) return { valor: null, invalido: false };
  const numero = Number(raw);
  if (!Number.isInteger(numero) || numero < 1 || numero > 999) {
    return { valor: null, invalido: true };
  }
  return { valor: numero, invalido: false };
}

function aMinutos(hora: string): number {
  const [hh, mm] = hora.split(":").map((valor) => Number(valor));
  return (hh || 0) * 60 + (mm || 0);
}

async function registrarAsistenciaInterno(
  formData: FormData,
): Promise<ResultadoAccionProfesor> {
  const profesor = await profesorActual();

  const cardId = String(formData.get("cardId") ?? "").trim();
  const estadoRaw = String(formData.get("estado") ?? "presente");
  const curso = String(formData.get("curso") ?? profesor.curso).trim();
  const fecha = String(formData.get("fecha") ?? "").trim();
  const hora = String(formData.get("hora") ?? "").trim();
  const metodoRaw = String(formData.get("metodo") ?? "nfc");

  if (!esEstadoAsistencia(estadoRaw)) {
    return { ok: false, mensaje: "El estado de asistencia no es válido." };
  }
  if (!cardId || !fecha || !hora) {
    return { ok: false, mensaje: "Falta la tarjeta, la fecha o la hora." };
  }

  const estudiante = resolverEstudiante(cardId);
  if (!estudiante) {
    return { ok: false, mensaje: "Esa tarjeta no existe o está revocada." };
  }
  const numeroLista = leerNumeroLista(formData);
  if (numeroLista.invalido) {
    return { ok: false, mensaje: "El número de lista debe estar entre 1 y 999." };
  }

  const cursoFinal = curso || profesor.curso || estudiante.cursoTarjeta || "Sin asignar";
  const metodo: "nfc" | "qr" | "manual" =
    metodoRaw === "qr" ? "qr" : metodoRaw === "manual" ? "manual" : "nfc";

  guardarAsistencia({
    cardId: estudiante.id,
    curso: cursoFinal,
    nombre: estudiante.nombre,
    numeroLista: numeroLista.valor ?? estudiante.numeroLista,
    fecha,
    hora,
    estado: estadoRaw as EstadoAsistencia,
    registradoPor: profesor.id,
    metodo,
  });

  return {
    ok: true,
    nombre: estudiante.nombre,
    mensaje: `${estudiante.nombre} quedó como ${estadoRaw} en ${cursoFinal} a las ${hora}.`,
  };
}

export async function registrarAsistenciaAction(formData: FormData): Promise<void> {
  const resultado = await registrarAsistenciaInterno(formData);
  if (resultado.ok) {
    revalidatePath("/profesor/asistencia");
    revalidatePath("/profesor/escanear");
  }
}

export async function registrarAsistenciaProfesorAction(
  formData: FormData,
): Promise<ResultadoAccionProfesor> {
  return registrarAsistenciaInterno(formData);
}

async function registrarPermisoInterno(
  formData: FormData,
): Promise<ResultadoAccionProfesor> {
  const profesor = await profesorActual();

  const cardId = String(formData.get("cardId") ?? "").trim();
  const accion = String(formData.get("accion") ?? "salida");
  const curso = String(formData.get("curso") ?? profesor.curso).trim();
  const fecha = String(formData.get("fecha") ?? "").trim();
  const hora = String(formData.get("hora") ?? "").trim();

  if (!cardId || !fecha || !hora) {
    return { ok: false, mensaje: "Falta la tarjeta, la fecha o la hora." };
  }

  const estudiante = resolverEstudiante(cardId);
  if (!estudiante) {
    return { ok: false, mensaje: "Esa tarjeta no existe o está revocada." };
  }
  const numeroLista = leerNumeroLista(formData);
  if (numeroLista.invalido) {
    return { ok: false, mensaje: "El número de lista debe estar entre 1 y 999." };
  }

  const permisosDelDia = listarPermisos({ cardId: estudiante.id, fecha });
  const abierto = permisosDelDia.find((permiso) => permiso.fin === null);

  if (accion === "salida") {
    if (abierto) {
      return {
        ok: false,
        mensaje: `${estudiante.nombre} ya tiene un permiso de baño abierto.`,
      };
    }

    const cursoFinal = curso || profesor.curso || estudiante.cursoTarjeta || "Sin asignar";
    guardarPermiso({
      id: `bano_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      cardId: estudiante.id,
      nombre: estudiante.nombre,
      numeroLista: numeroLista.valor ?? estudiante.numeroLista,
      curso: cursoFinal,
      fecha,
      inicio: hora,
      fin: null,
      duracionMin: null,
      excedeLimite: permisosDelDia.length >= 3,
      registradoPor: profesor.id,
      createdAt: new Date().toISOString(),
    });

    return {
      ok: true,
      nombre: estudiante.nombre,
      mensaje: `${estudiante.nombre} salió al baño a las ${hora}.`,
    };
  }

  if (accion === "regreso") {
    if (!abierto) {
      return {
        ok: false,
        mensaje: `${estudiante.nombre} no tiene un permiso de baño abierto.`,
      };
    }

    const duracion = Math.max(0, aMinutos(hora) - aMinutos(abierto.inicio));
    guardarPermiso({
      ...abierto,
      nombre: abierto.nombre || estudiante.nombre,
      numeroLista: numeroLista.valor ?? abierto.numeroLista ?? estudiante.numeroLista,
      fin: hora,
      duracionMin: duracion,
      excedeLimite: abierto.excedeLimite || duracion > 10,
    });

    return {
      ok: true,
      nombre: estudiante.nombre,
      mensaje: `${estudiante.nombre} regresó a las ${hora} (${duracion} min fuera).`,
    };
  }

  return { ok: false, mensaje: "La acción de baño no es válida." };
}

export async function registrarPermisoBanoAction(formData: FormData): Promise<void> {
  const resultado = await registrarPermisoInterno(formData);
  if (resultado.ok) {
    revalidatePath("/profesor/banio");
    revalidatePath("/profesor/escanear");
  }
}

export async function registrarPermisoBanoProfesorAction(
  formData: FormData,
): Promise<ResultadoAccionProfesor> {
  return registrarPermisoInterno(formData);
}

async function registrarAnotacionInterno(
  formData: FormData,
): Promise<ResultadoAccionProfesor> {
  const profesor = await profesorActual();

  const cardId = String(formData.get("cardId") ?? "").trim();
  const tipoRaw = String(formData.get("tipo") ?? "positiva");
  const categoriaRaw = String(formData.get("categoria") ?? "Otro");
  const comentario = String(formData.get("comentario") ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 300);
  const curso = String(formData.get("curso") ?? profesor.curso).trim();
  const fecha = String(formData.get("fecha") ?? "").trim();
  const hora = String(formData.get("hora") ?? "").trim();

  if (tipoRaw !== "positiva" && tipoRaw !== "negativa") {
    return { ok: false, mensaje: "El tipo de anotación no es válido." };
  }
  if (!esCategoriaAnotacion(categoriaRaw)) {
    return { ok: false, mensaje: "Elige una categoría válida." };
  }
  if (comentario.length < 3) {
    return { ok: false, mensaje: "Escribe un comentario de al menos 3 caracteres." };
  }
  if (!cardId || !fecha || !hora) {
    return { ok: false, mensaje: "Falta la tarjeta, la fecha o la hora." };
  }

  const estudiante = resolverEstudiante(cardId);
  if (!estudiante) {
    return { ok: false, mensaje: "Esa tarjeta no existe o está revocada." };
  }
  const numeroLista = leerNumeroLista(formData);
  if (numeroLista.invalido) {
    return { ok: false, mensaje: "El número de lista debe estar entre 1 y 999." };
  }

  const cursoFinal = curso || profesor.curso || estudiante.cursoTarjeta || "Sin asignar";
  guardarAnotacion({
    cardId: estudiante.id,
    nombre: estudiante.nombre,
    numeroLista: numeroLista.valor ?? estudiante.numeroLista,
    curso: cursoFinal,
    tipo: tipoRaw,
    categoria: categoriaRaw as CategoriaAnotacion,
    comentario,
    fecha,
    hora,
    registradoPor: profesor.id,
  });

  return {
    ok: true,
    nombre: estudiante.nombre,
    mensaje: `Anotación ${tipoRaw} guardada para ${estudiante.nombre} (${cursoFinal}).`,
  };
}

export async function registrarAnotacionAction(formData: FormData): Promise<void> {
  const resultado = await registrarAnotacionInterno(formData);
  if (resultado.ok) {
    revalidatePath("/profesor/anotaciones");
    revalidatePath("/profesor/escanear");
  }
}

export async function registrarAnotacionProfesorAction(
  formData: FormData,
): Promise<ResultadoAccionProfesor> {
  return registrarAnotacionInterno(formData);
}

export async function obtenerAsistencia(filtro: {
  curso?: string;
  fecha?: string;
}) {
  const profesor = await leerProfesorSesion();
  if (!profesor) {
    redirect("/profesor/login");
  }
  return listarAsistencia({ ...filtro, curso: profesor.curso });
}

export async function obtenerPermisos(filtro: {
  curso?: string;
  fecha?: string;
  abiertos?: boolean;
}) {
  const profesor = await leerProfesorSesion();
  if (!profesor) {
    redirect("/profesor/login");
  }
  return listarPermisos({ ...filtro, curso: profesor.curso });
}

export async function registrarAmigoAction(formData: FormData): Promise<void> {
  const profesor = await leerProfesorSesion();
  if (!profesor) redirect("/profesor/login");

  const ownerCardId = String(formData.get("ownerCardId") ?? "").trim();
  const friendCardIdRaw = String(formData.get("friendCardId") ?? "").trim();
  if (!ownerCardId || !friendCardIdRaw) return;

  const tarjetaPorToken = buscarTarjetaPorToken(friendCardIdRaw);
  const tarjeta = tarjetaPorToken ?? listarTarjetas().find((t) => t.id === friendCardIdRaw);
  if (!tarjeta) return;

  guardarAmigo({
    ownerCardId,
    friendCardId: tarjeta.id,
    nombre: tarjeta.fullName ?? tarjeta.holder ?? "Alumno",
    curso: tarjeta.course ?? tarjeta.level ?? null,
    numeroLista: tarjeta.listNumber ?? null,
  });
}

export async function exportarArchivosProfesorAction(): Promise<void> {
  const profesor = await leerProfesorSesion();
  if (!profesor) redirect("/profesor/login");
  actualizarArchivoProfesor(profesor.id);
  actualizarArchivoPermisos(profesor.id);
  actualizarArchivoAnotaciones(profesor.id);
  actualizarArchivoAmigos(profesor.id);
}

export async function resolverTarjetaAction(cardIdRaw: string): Promise<{
  id: string;
  nombre: string;
  curso: string;
  numeroLista: number | null;
} | null> {
  const profesor = await leerProfesorSesion();
  if (!profesor) return null;
  const tarjetaPorToken = buscarTarjetaPorToken(cardIdRaw);
  const tarjeta = tarjetaPorToken ?? listarTarjetas().find((t) => t.id === cardIdRaw);
  if (!tarjeta) return null;
  const perfil = leerPerfil(tarjeta.id);
  return {
    id: tarjeta.id,
    nombre: tarjeta.fullName ?? perfil?.displayName ?? tarjeta.holder ?? "Alumno",
    curso: tarjeta.course ?? tarjeta.level ?? profesor.curso,
    numeroLista: tarjeta.listNumber ?? null,
  };
}
export async function obtenerAnotaciones(filtro: {
  curso?: string;
  tipo?: "positiva" | "negativa";
}) {
  const profesor = await leerProfesorSesion();
  if (!profesor) {
    redirect("/profesor/login");
  }
  return listarAnotaciones({ ...filtro, curso: profesor.curso });
}

import {
  codigoInstitucionalValido,
  registrarProfesor,
} from "@/lib/teachers";
import { esNivel, esAnio, esLetra, type Nivel, type Letra } from "@/lib/teacher-schema";

export async function registrarProfesorAction(formData: FormData) {
  const codigoInstitucional = String(formData.get("codigoInstitucional") ?? "").trim();
  const nombre = String(formData.get("nombre") ?? "").trim();
  const nivelRaw = String(formData.get("nivel") ?? "");
  const anioRaw = String(formData.get("anio") ?? "");
  const letraRaw = String(formData.get("letra") ?? "");
  const password = String(formData.get("password") ?? "").trim();

  if (!codigoInstitucionalValido(codigoInstitucional)) {
    redirect("/profesor/registro?error=institucional_invalido");
  }

  if (!esNivel(nivelRaw)) {
    redirect("/profesor/registro?error=datos_invalidos");
  }

  const anio = Number(anioRaw);
  if (!esAnio(nivelRaw, anio)) {
    redirect("/profesor/registro?error=datos_invalidos");
  }

  if (!esLetra(letraRaw)) {
    redirect("/profesor/registro?error=datos_invalidos");
  }

  const resultado = registrarProfesor({
    nombre,
    nivel: nivelRaw as Nivel,
    anio,
    letra: letraRaw as Letra,
    password: password || null,
  });

  if (!resultado.ok) {
    redirect("/profesor/registro?error=registro_fallido");
  }

  const cookieStore = await cookies();
  cookieStore.set("vm_profe_registro", resultado.codigoPersonal, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
    secure:
      process.env.VIBEMATCH_COOKIE_SECURE === "1" ||
      (process.env.VIBEMATCH_COOKIE_SECURE !== "0" &&
        process.env.VIBEMATCH_PUBLIC_URL?.startsWith("https://") === true),
  });

  redirect("/profesor/registro/exito");
}