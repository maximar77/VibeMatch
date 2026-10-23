import type { Metadata } from "next";
import { AccessDenied } from "@/components/access-denied";

export const metadata: Metadata = {
  title: "Acceso requerido · VibeMatch",
  description: "Acceso privado por tarjeta única VibeMatch.",
  robots: { index: false, follow: false },
};

export default function Home() {
  return (
    <AccessDenied
      title="Necesitas una tarjeta para entrar."
      message="Esta web abre solo con el enlace único de una tarjeta VibeMatch o con el token de acceso que te entregaron. No es un sitio público."
      detail="Si escaneaste un código QR y llegaste aquí, revisa que el enlace esté completo. También puedes pedir ayuda al equipo de convivencia de tu colegio."
    />
  );
}
