import { NextResponse } from "next/server";
import { leerSesion } from "@/lib/cards";
import { leerPerfil } from "@/lib/profiles";
import {
  esMuroId,
  guardarPublicacion,
  listarPublicaciones,
} from "@/lib/muros";
import { evaluarMensaje } from "@/lib/moderacion";

const MAX_IMAGEN = 1_800_000; // data URL JPEG comprimido (~1,3 MB reales)

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ muro: string }> },
) {
  const acceso = await leerSesion();
  if (!acceso || acceso.card.kind === "public") {
    return NextResponse.json({ error: "sin_sesion" }, { status: 401 });
  }

  const { muro } = await params;
  if (!esMuroId(muro)) {
    return NextResponse.json({ error: "muro_invalido" }, { status: 404 });
  }

  return NextResponse.json(
    { muro, publicaciones: listarPublicaciones(muro) },
    { headers: { "cache-control": "no-store" } },
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ muro: string }> },
) {
  const acceso = await leerSesion();
  if (!acceso || acceso.card.kind === "public") {
    return NextResponse.json({ error: "sin_sesion" }, { status: 401 });
  }

  const { muro } = await params;
  if (!esMuroId(muro)) {
    return NextResponse.json({ error: "muro_invalido" }, { status: 404 });
  }

  let cuerpo: Record<string, unknown>;
  try {
    cuerpo = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "json_invalido" }, { status: 400 });
  }

  const textoOriginal = String(cuerpo.texto ?? "")
    .trim()
    .replace(/\s+/g, " ");
  const imagenRaw = typeof cuerpo.imagen === "string" ? cuerpo.imagen : "";

  if (textoOriginal.length > 300) {
    return NextResponse.json(
      { error: "texto_largo", mensaje: "El texto puede tener hasta 300 caracteres." },
      { status: 400 },
    );
  }

  let imagen: string | null = null;
  if (imagenRaw) {
    if (
      !/^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(imagenRaw)
    ) {
      return NextResponse.json(
        { error: "imagen_invalida", mensaje: "La foto no tiene un formato válido." },
        { status: 400 },
      );
    }
    if (imagenRaw.length > MAX_IMAGEN) {
      return NextResponse.json(
        { error: "imagen_grande", mensaje: "La foto es demasiado grande. Prueba con otra." },
        { status: 413 },
      );
    }
    imagen = imagenRaw;
  }

  if (!textoOriginal && !imagen) {
    return NextResponse.json(
      { error: "publicacion_vacia", mensaje: "Escribe algo o adjunta una foto." },
      { status: 400 },
    );
  }

  const evaluacion = textoOriginal
    ? evaluarMensaje(textoOriginal)
    : { textoFiltrado: "", apto: true, motivo: undefined };
  const texto = evaluacion.textoFiltrado.slice(0, 300);
  const perfil = leerPerfil(acceso.card.id);

  const publicacion = guardarPublicacion({
    muro,
    usuarioId: acceso.card.id,
    usuarioNombre:
      perfil?.displayName ??
      acceso.card.fullName ??
      acceso.card.holder ??
      "Alumno",
    texto,
    imagen,
  });

  return NextResponse.json(
    {
      publicacion,
      filtrado: !evaluacion.apto,
      motivo: evaluacion.motivo,
    },
    { headers: { "cache-control": "no-store" } },
  );
}
