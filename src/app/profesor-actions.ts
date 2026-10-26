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
  guardarAmigo,
  actualizarArchivoPermisos,
  actualizarArchivoAmigos,
  actualizarArchivoProfesor,
} from "@/lib/school";
import { buscarTarjetaPorToken, listarTarjetas } from "@/lib/cards";
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

export async function registrarAsistenciaAction(formData: FormData): Promise<void> {
  const profesor = await leerProfesorSesion();
  if (!profesor) {
    redirect("/profesor/login");
  }

  const cardId = String(formData.get("cardId") ?? "").trim();
  const estadoRaw = String(formData.get("estado") ?? "presente");
  const curso = String(formData.get("curso") ?? profesor.curso).trim();
  const fecha = String(formData.get("fecha") ?? "");
  const hora = String(formData.get("hora") ?? "");

  if (!esEstadoAsistencia(estadoRaw) || !cardId || !fecha || !hora) {
    return;
  }

  let tarjetaId = cardId;
  let nombre = "";
  let numeroLista: number | null = null;

  // Si es un token, obtener la tarjeta real
  const tarjetaPorToken = buscarTarjetaPorToken(cardId);
  if (tarjetaPorToken) {
    tarjetaId = tarjetaPorToken.id;
    nombre = tarjetaPorToken.fullName ?? tarjetaPorToken.holder ?? "";
    numeroLista = tarjetaPorToken.listNumber ?? null;
  } else {
    // Buscar por ID de tarjeta
    const tarjeta = listarTarjetas().find((t) => t.id === cardId);
    if (tarjeta) {
      tarjetaId = tarjeta.id;
      nombre = tarjeta.fullName ?? tarjeta.holder ?? "";
      numeroLista = tarjeta.listNumber ?? null;
    }
  }

  guardarAsistencia({
    cardId: tarjetaId,
    curso: curso || profesor.curso,
    nombre,
    numeroLista,
    fecha,
    hora,
    estado: estadoRaw as EstadoAsistencia,
    registradoPor: profesor.id,
    metodo: "nfc",
  });
}

export async function registrarPermisoBanoAction(formData: FormData): Promise<void> {
  const profesor = await leerProfesorSesion();
  if (!profesor) {
    redirect("/profesor/login");
  }

  const cardId = String(formData.get("cardId") ?? "").trim();
  const accion = String(formData.get("accion") ?? "salida");
  const curso = String(formData.get("curso") ?? profesor.curso).trim();
  const fecha = String(formData.get("fecha") ?? "");
  const hora = String(formData.get("hora") ?? "");

  if (!cardId || !fecha || !hora) {
    return;
  }

  let tarjetaId = cardId;
  const tarjetaPorToken = buscarTarjetaPorToken(cardId);
  if (tarjetaPorToken) {
    tarjetaId = tarjetaPorToken.id;
  } else {
    const tarjeta = listarTarjetas().find((t) => t.id === cardId);
    if (tarjeta) {
      tarjetaId = tarjeta.id;
    }
  }

  const permisosDelDia = listarPermisos({ cardId: tarjetaId, fecha });
  const abiertos = permisosDelDia.find((p) => p.fin === null);

  if (accion === "salida") {
    if (abiertos) {
      return;
    }
    const LIMITE_BANO_POR_DIA = 3;
    const permiso = {
      id: `bano_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      cardId: tarjetaId,
      curso: curso || profesor.curso,
      fecha,
      inicio: hora,
      fin: null,
      duracionMin: null,
      excedeLimite: permisosDelDia.length >= LIMITE_BANO_POR_DIA,
      registradoPor: profesor.id,
      createdAt: new Date().toISOString(),
    };
    guardarPermiso(permiso as any);
    return;
  }

  if (accion === "regreso") {
    if (!abiertos) {
      return;
    }
    const LIMITE_BANO_MINUTOS = 10;
    const aMinutos = (h: string) => {
      const [hh, mm] = h.split(":").map((v) => Number(v));
      return hh * 60 + mm;
    };
    const duracion = Math.max(0, aMinutos(hora) - aMinutos(abiertos.inicio));
    const cerrado = {
      ...abiertos,
      fin: hora,
      duracionMin: duracion,
      excedeLimite: abiertos.excedeLimite || duracion > LIMITE_BANO_MINUTOS,
    };
    guardarPermiso(cerrado as any);
    return;
  }
}

export async function registrarAnotacionAction(formData: FormData): Promise<void> {
  const profesor = await leerProfesorSesion();
  if (!profesor) {
    redirect("/profesor/login");
  }

  const cardId = String(formData.get("cardId") ?? "").trim();
  const tipoRaw = String(formData.get("tipo") ?? "positiva");
  const categoriaRaw = String(formData.get("categoria") ?? "Otro");
  const comentario = String(formData.get("comentario") ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 300);
  const curso = String(formData.get("curso") ?? profesor.curso).trim();
  const fecha = String(formData.get("fecha") ?? "");
  const hora = String(formData.get("hora") ?? "");

  if (tipoRaw !== "positiva" && tipoRaw !== "negativa") {
    return;
  }

  if (!esCategoriaAnotacion(categoriaRaw)) {
    return;
  }

  if (comentario.length < 3) {
    return;
  }

  if (!cardId || !fecha || !hora) {
    return;
  }

  let tarjetaId = cardId;
  const tarjetaPorToken = buscarTarjetaPorToken(cardId);
  if (tarjetaPorToken) {
    tarjetaId = tarjetaPorToken.id;
  } else {
    const tarjeta = listarTarjetas().find((t) => t.id === cardId);
    if (tarjeta) {
      tarjetaId = tarjeta.id;
    }
  }

  guardarAnotacion({
    cardId: tarjetaId,
    curso: curso || profesor.curso,
    tipo: tipoRaw,
    categoria: categoriaRaw as CategoriaAnotacion,
    comentario,
    fecha,
    hora,
    registradoPor: profesor.id,
  });
}

export async function obtenerAsistencia(filtro: {
  curso?: string;
  fecha?: string;
}) {
  const profesor = await leerProfesorSesion();
  if (!profesor) {
    redirect("/profesor/login");
  }
  const cursoFiltro = filtro.curso ?? profesor.curso;
  return listarAsistencia({ ...filtro, curso: cursoFiltro });
}

export async function obtenerPermisos(filtro: {
  fecha?: string;
  abiertos?: boolean;
}) {
  const profesor = await leerProfesorSesion();
  if (!profesor) {
    redirect("/profesor/login");
  }
  return listarPermisos({ ...filtro });
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
  return {
    id: tarjeta.id,
    nombre: tarjeta.fullName ?? tarjeta.holder ?? "Alumno",
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
  const cursoFiltro = filtro.curso ?? profesor.curso;
  return listarAnotaciones({ ...filtro, curso: cursoFiltro });
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