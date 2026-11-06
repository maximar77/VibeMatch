import { NextResponse } from "next/server";

/**
 * Endpoint GET para contenido de blog estático.
 *
 * Devuelve un mensaje placeholder con información básica del blog.
 * En un futuro esto podría conectarse a un CMS o archivos Markdown.
 */

export async function GET() {
  const contenidoBlog = `
    <div style="max-width: 600px; margin: 2rem auto; padding: 2rem; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h1 style="margin-top: 0;">Bienvenido al Blog VibeMatch</h1>
      <p style="color: #666; font-size: 1.1rem;">
        Este es un espacio para compartir historias, logros y experiencias
        de la comunidad VibeMatch. Aquí encontrarás artículos sobre:
      </p>
      <ul style="margin-bottom: 0;">
        <li>Proyectos estudiantiles</li>
        <li>Eventos escolares</li>
        <li>Consejos de estudio y convivencia</li>
        <li>Entrevistas a estudiantes y docentes</li>
      </ul>
      <p style="font-size: 0.8rem; color: #999; margin-top: 1rem;">
        © 2026 VibeMatch. Todos los derechos reservados.
      </p>
    </div>
  `;

  return NextResponse.json({
    ok: true,
    titulo: "VibeMatch Blog",
    descripcion: "Espacio de contenido comunitario",
    contenido: contenidoBlog,
  });
}