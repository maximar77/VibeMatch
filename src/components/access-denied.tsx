import { BrandLogo } from "@/components/brand-logo";

type Props = {
  badge?: string;
  title: string;
  message: string;
  detail?: string;
};

export function AccessDenied({
  badge = "Acceso restringido",
  title,
  message,
  detail,
}: Props) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-bg" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -top-32 left-1/2 h-[30rem] w-[46rem] -translate-x-1/2 rounded-full bg-brand/15 blur-[120px]"
        aria-hidden="true"
      />

      <header className="relative z-10 border-b border-white/5 bg-ink/60 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-5">
          <BrandLogo />
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
            Acceso privado
          </span>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-5 py-14">
        <section className="glass w-full max-w-xl rounded-[2rem] p-7 sm:p-9">
          <span className="inline-flex items-center gap-2 rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-1 text-xs font-medium text-rose-300">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
            {badge}
          </span>
          <h1 className="mt-8 text-4xl font-bold tracking-tight sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-zinc-400">
            {message}
          </p>
          {detail ? (
            <p className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs leading-relaxed text-zinc-500">
              {detail}
            </p>
          ) : null}
          <div className="mt-8 flex items-center gap-3 text-xs text-zinc-500">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <rect x="5" y="10" width="14" height="10" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
            </span>
            El acceso se entrega con una tarjeta VibeMatch y su código QR/NFC.
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/5">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-2 px-5 py-6 text-xs text-zinc-600 sm:flex-row">
          <p>VibeMatch · acceso por tarjeta única</p>
          <p>Colegio Superior del Maipo · Chile</p>
        </div>
      </footer>
    </div>
  );
}
