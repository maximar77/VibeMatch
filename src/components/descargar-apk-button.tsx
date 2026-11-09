"use client";

import type { ReactNode } from "react";

type Props = {
  href: string;
  className?: string;
  children: ReactNode;
  title?: string;
};

/**
 * Enlace de descarga del APK.
 *
 * Dentro de la app Android abre el navegador del sistema mediante el puente
 * nativo; en un navegador normal sigue el enlace de descarga habitual.
 */
export function DescargarApkButton({ href, className, children, title }: Props) {
  const abrir = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const nativo = window.VibeMatchNative;
    if (!nativo?.openUrl) return;

    const destino = href.startsWith("http")
      ? href
      : new URL(href, window.location.origin).toString();

    event.preventDefault();
    nativo.openUrl(destino);
  };

  return (
    <a
      href={href}
      onClick={abrir}
      className={className}
      title={title}
      rel="noopener noreferrer"
    >
      {children}
    </a>
  );
}
