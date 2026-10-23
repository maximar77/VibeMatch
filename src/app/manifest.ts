import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "VibeMatch — Conecta por lo que te mueve",
    short_name: "VibeMatch",
    description:
      "Tu perfil VibeMatch: tarjeta única, intereses y zonas para conectar con tu comunidad escolar.",
    lang: "es-CL",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    background_color: "#07070d",
    theme_color: "#07070d",
    categories: ["education", "social"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
