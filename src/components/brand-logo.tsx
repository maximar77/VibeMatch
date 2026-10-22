import Image from "next/image";
import Link from "next/link";

type BrandLogoProps = {
  href?: string;
};

export function BrandLogo({ href = "/" }: BrandLogoProps) {
  return (
    <Link href={href} className="flex items-center gap-2.5">
      {/* Isotipo real recortado de la hoja de identidad (fondo transparente). */}
      <Image
        src="/marca/isotipo.png"
        alt=""
        width={615}
        height={375}
        className="block h-9 w-auto"
        priority
      />
      <span className="text-lg font-bold tracking-[0.18em]">
        VIBE<span className="text-brand-strong">•</span>MATCH
      </span>
    </Link>
  );
}
