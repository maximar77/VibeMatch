import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { salirAction } from "@/app/actions";

type Props = {
  active?: "app" | "perfil" | "instalar";
};

const links = [
  { href: "/app", label: "Mi VibeMatch", key: "app" },
  { href: "/app/perfil", label: "Editar perfil", key: "perfil" },
  { href: "/app/instalar", label: "Instalar app", key: "instalar" },
] as const;

export function AppHeader({ active = "app" }: Props) {
  return (
    <header className="relative z-20 border-b border-white/5 bg-ink/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5">
        <BrandLogo href="/app" />
        <div className="flex items-center gap-2 sm:gap-3">
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <Link
                key={link.key}
                href={link.href}
                aria-current={active === link.key ? "page" : undefined}
                className={`rounded-full px-3 py-2 text-xs font-medium transition ${
                  active === link.key
                    ? "bg-white/10 text-white"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <span className="hidden items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-medium text-emerald-300 sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Sesión activa
          </span>
          <form action={salirAction}>
            <button
              type="submit"
              className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-zinc-300 transition hover:border-white/25 hover:bg-white/5 hover:text-white"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
