"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  crearSesion,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  validarToken,
} from "@/lib/cards";

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
    // En producción con HTTPS: VIBEMATCH_COOKIE_SECURE=1
    secure: process.env.VIBEMATCH_COOKIE_SECURE === "1",
  };
}

export async function entrarAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const acceso = validarToken(token);

  if (!acceso) {
    redirect("/?acceso=invalido");
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, crearSesion(acceso.card.id), cookieOptions());
  redirect("/app");
}

export async function salirAction() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/");
}
