/**
 * Script para ejecutar VibeMatch en modo desarrollo accesible desde la red local.
 *
 * Inicia Next.js con --hostname 0.0.0.0 para que cualquier dispositivo en la
 * misma red Wi-Fi pueda acceder (útil para probar NFC/QR en celulares Android
 * sin necesidad de Cloudflare ni ngrok).
 *
 * Uso:
 *   node scripts/dev-public.js
 *
 * Luego accede desde otro dispositivo a: http://<IP-de-esta-computadora>:3000
 */

const { execSync } = require("child_process");
const os = require("os");

function obtenerIPLocal() {
  const interfaces = os.networkInterfaces();
  for (const nombre of Object.keys(interfaces)) {
    for (iface of interfaces[nombre] || []) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

const ip = obtenerIPLocal();
const puerto = process.env.PORT || "3000";

console.log("╔═══════════════════════════════════════════════════════════╗");
console.log("║  VibeMatch - Modo desarrollo público (red local)           ║");
console.log("╚═══════════════════════════════════════════════════════════╝");
console.log();
console.log(`  📡 Servidor iniciado en: http://0.0.0.0:${puerto}`);
console.log(`  🌐 Acceso local:         http://localhost:${puerto}`);
console.log(`  📱 Acceso desde red:     http://${ip}:${puerto}`);
console.log();
console.log("  ⚠️  Para NFC Web API, usa HTTPS. Desde celular, usa el código QR.");
console.log("  ⚠️  No uses Cloudflare ni ngrok. Esto expone la app solo en tu red local.");
console.log();
console.log("  Presiona Ctrl+C para detener.");
console.log();

execSync(
  `npx next dev --hostname 0.0.0.0 --port ${puerto}`,
  { stdio: "inherit", cwd: process.cwd() }
);