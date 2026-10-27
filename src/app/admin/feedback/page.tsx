import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listarFeedback } from "@/lib/feedback";

const TOKEN_SECRETO = process.env.VIBEMATCH_ADMIN_TOKEN || "admin-vibematch-2026";

export const metadata: Metadata = {
  title: "Admin Feedback · VibeMatch",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  return <Contenido searchParams={searchParams} />;
}

async function Contenido({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const sp = await searchParams;
  if (sp.token !== TOKEN_SECRETO) {
    notFound();
  }
  const feedback = listarFeedback();
  return (
    <div className="min-h-screen bg-ink text-white p-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-bold">Feedback y errores beta</h1>
        <p className="mt-1 text-sm text-zinc-400">{feedback.length} registros</p>
        <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03]">
              <tr>
                <th className="p-3 text-left text-xs text-zinc-500">Fecha</th>
                <th className="p-3 text-left text-xs text-zinc-500">Tipo</th>
                <th className="p-3 text-left text-xs text-zinc-500">Mensaje</th>
                <th className="p-3 text-left text-xs text-zinc-500">Dispositivo/Modelo</th>
                <th className="p-3 text-left text-xs text-zinc-500">Sistema</th>
                <th className="p-3 text-left text-xs text-zinc-500">CardID</th>
                <th className="p-3 text-left text-xs text-zinc-500">URL</th>
              </tr>
            </thead>
            <tbody>
              {feedback.map((f) => (
                <tr key={f.id} className="border-t border-white/5">
                  <td className="p-3 text-xs text-zinc-500">
                    {new Date(f.createdAt).toLocaleString("es-CL")}
                  </td>
                  <td className="p-3">{f.tipo}</td>
                  <td className="p-3 max-w-md whitespace-pre-wrap text-zinc-300">{f.mensaje}</td>
                  <td className="p-3 text-xs text-zinc-400">
                    {f.modelo || "-"} {f.plataforma ? `(${f.plataforma})` : ""}
                  </td>
                  <td className="p-3 text-xs text-zinc-400">{f.sistema || "-"}</td>
                  <td className="p-3 text-xs font-mono text-zinc-500">{f.cardId || "-"}</td>
                  <td className="p-3 text-xs text-zinc-600 max-w-xs truncate">{f.url || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
