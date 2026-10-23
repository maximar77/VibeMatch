"use client";

import type { Perfil } from "@/lib/profile-schema";
import { etiquetaVibe } from "@/lib/profile-schema";

const ANCHO = 1080;
const ALTO = 1350;

function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");
}

function envolverTexto(
  ctx: CanvasRenderingContext2D,
  texto: string,
  maxAncho: number,
): string[] {
  const palabras = texto.split(/\s+/);
  const lineas: string[] = [];
  let actual = "";

  for (const palabra of palabras) {
    const prueba = actual ? `${actual} ${palabra}` : palabra;
    if (ctx.measureText(prueba).width > maxAncho && actual) {
      lineas.push(actual);
      actual = palabra;
    } else {
      actual = prueba;
    }
  }

  if (actual) lineas.push(actual);
  return lineas;
}

function redondearRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Dibuja la tarjeta de perfil y devuelve un Blob PNG.
 * Todo ocurre en el dispositivo: funciona sin conexión.
 */
export async function generarTarjetaPerfil(
  perfil: Perfil,
  establecimiento: string,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = ANCHO;
  canvas.height = ALTO;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo preparar el lienzo para la tarjeta.");

  // Fondo con degradado de marca.
  const fondo = ctx.createLinearGradient(0, 0, ANCHO, ALTO);
  fondo.addColorStop(0, "#120a1f");
  fondo.addColorStop(0.55, "#1b1030");
  fondo.addColorStop(1, "#2a1450");
  ctx.fillStyle = fondo;
  ctx.fillRect(0, 0, ANCHO, ALTO);

  // Resplandores suaves.
  const brillo = ctx.createRadialGradient(ANCHO * 0.8, 120, 40, ANCHO * 0.8, 120, 620);
  brillo.addColorStop(0, "rgba(168,85,247,0.42)");
  brillo.addColorStop(1, "rgba(168,85,247,0)");
  ctx.fillStyle = brillo;
  ctx.fillRect(0, 0, ANCHO, ALTO);

  // Tarjeta central.
  const margen = 72;
  const cardX = margen;
  const cardY = 150;
  const cardW = ANCHO - margen * 2;
  const cardH = ALTO - 300;
  redondearRect(ctx, cardX, cardY, cardW, cardH, 56);
  ctx.fillStyle = "rgba(255,255,255,0.045)";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.stroke();

  // Isotipo textual.
  ctx.fillStyle = "rgba(233,213,255,0.75)";
  ctx.font = "600 30px 'Segoe UI', system-ui, sans-serif";
  ctx.letterSpacing = "8px";
  ctx.fillText("VIBEMATCH", cardX + 64, cardY + 92);
  ctx.letterSpacing = "0px";

  // Avatar con iniciales.
  const avatarX = cardX + 64;
  const avatarY = cardY + 140;
  const avatarSize = 168;
  const avatarGrad = ctx.createLinearGradient(avatarX, avatarY, avatarX + avatarSize, avatarY + avatarSize);
  avatarGrad.addColorStop(0, "#a855f7");
  avatarGrad.addColorStop(1, "#7c3aed");
  redondearRect(ctx, avatarX, avatarY, avatarSize, avatarSize, 44);
  ctx.fillStyle = avatarGrad;
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 68px 'Segoe UI', system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(iniciales(perfil.displayName), avatarX + avatarSize / 2, avatarY + avatarSize / 2 + 4);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  // Nombre.
  const textoX = avatarX + avatarSize + 48;
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 62px 'Segoe UI', system-ui, sans-serif";
  const nombreLineas = envolverTexto(ctx, perfil.displayName, cardW - avatarSize - 200).slice(0, 2);
  nombreLineas.forEach((linea, i) => {
    ctx.fillText(linea, textoX, avatarY + 66 + i * 68);
  });

  // Detalles bajo el nombre.
  const detalles = [perfil.pronouns, perfil.level, establecimiento].filter(Boolean).join(" · ");
  ctx.fillStyle = "rgba(212,212,216,0.85)";
  ctx.font = "400 30px 'Segoe UI', system-ui, sans-serif";
  const detalleLineas = envolverTexto(ctx, detalles, cardW - avatarSize - 200).slice(0, 2);
  detalleLineas.forEach((linea, i) => {
    ctx.fillText(linea, textoX, avatarY + 120 + nombreLineas.length * 68 + i * 40);
  });

  let cursorY = avatarY + avatarSize + 78;

  // Vibe.
  redondearRect(ctx, cardX + 64, cursorY, cardW - 128, 128, 32);
  ctx.fillStyle = "rgba(168,85,247,0.14)";
  ctx.fill();
  ctx.strokeStyle = "rgba(196,132,252,0.32)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "rgba(233,213,255,0.7)";
  ctx.font = "600 24px 'Segoe UI', system-ui, sans-serif";
  ctx.fillText("VIBE CHECK", cardX + 100, cursorY + 46);
  ctx.fillStyle = "#e9d5ff";
  ctx.font = "600 40px 'Segoe UI', system-ui, sans-serif";
  ctx.fillText(etiquetaVibe(perfil.vibe), cardX + 100, cursorY + 96);

  cursorY += 128 + 56;

  // Intereses como chips.
  ctx.fillStyle = "rgba(233,213,255,0.7)";
  ctx.font = "600 24px 'Segoe UI', system-ui, sans-serif";
  ctx.fillText("INTERESES", cardX + 64, cursorY);
  cursorY += 40;

  let chipX = cardX + 64;
  let chipY = cursorY;
  ctx.font = "500 30px 'Segoe UI', system-ui, sans-serif";
  for (const interes of perfil.interests) {
    const anchoTexto = ctx.measureText(interes).width;
    const chipW = anchoTexto + 52;
    if (chipX + chipW > cardX + cardW - 64) {
      chipX = cardX + 64;
      chipY += 62;
    }
    redondearRect(ctx, chipX, chipY, chipW, 48, 24);
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = "rgba(228,228,231,0.95)";
    ctx.fillText(interes, chipX + 26, chipY + 33);
    chipX += chipW + 14;
  }

  // Bio.
  if (perfil.bio) {
    const bioY = cardY + cardH - 220;
    ctx.fillStyle = "rgba(228,228,231,0.78)";
    ctx.font = "italic 400 30px 'Segoe UI', system-ui, sans-serif";
    const bioLineas = envolverTexto(ctx, `"${perfil.bio}"`, cardW - 200).slice(0, 4);
    bioLineas.forEach((linea, i) => {
      ctx.fillText(linea, cardX + 64, bioY + i * 44);
    });
  }

  // Pie con tarjeta y estado.
  ctx.fillStyle = "rgba(161,161,170,0.75)";
  ctx.font = "400 26px 'Segoe UI', system-ui, sans-serif";
  ctx.fillText(`Tarjeta ${perfil.cardId}`, cardX + 64, cardY + cardH - 76);
  ctx.fillStyle = "rgba(52,211,153,0.95)";
  ctx.beginPath();
  ctx.arc(cardX + cardW - 300, cardY + cardH - 86, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(212,212,216,0.9)";
  ctx.fillText("Verificada", cardX + cardW - 278, cardY + cardH - 76);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("No se pudo generar la imagen de la tarjeta."));
    }, "image/png");
  });
}

export function nombreArchivoTarjeta(perfil: Perfil): string {
  const base = perfil.displayName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `vibematch-${base || "perfil"}.png`;
}
