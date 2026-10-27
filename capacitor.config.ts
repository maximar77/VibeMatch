import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Configuración de la app Android de VibeMatch.
 *
 * La app carga la web desde el servidor remoto (server.url) para reutilizar
 * Next.js, las Server Actions y las cookies de sesión. El perfil se cachea en
 * el dispositivo (ver src/lib/offline-profile.ts) para funcionar sin conexión.
 *
 * La URL se fija al compilar:
 *   VIBEMATCH_APP_URL=https://tu-dominio.cl npx cap sync android
 *
 * En producción debe ser el dominio HTTPS de Oracle Cloud (Caddy). No uses una
 * URL de túnel temporal (trycloudflare, ngrok) para una APK distribuida.
 */
const servidorRemoto =
  process.env.VIBEMATCH_APP_URL ?? "https://vibematch-demo.vercel.app";

const config: CapacitorConfig = {
  appId: "cl.vibematch.app",
  appName: "VibeMatch",
  webDir: "public",
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: process.env.VIBEMATCH_DEBUG === "1",
  },
  server: {
    url: servidorRemoto,
    cleartext: servidorRemoto.startsWith("http://"),
    androidScheme: "https",
    allowNavigation: [
      // Demo pública mientras Oracle no está aprovisionado.
      "vibematch-demo.vercel.app",
      "vibe-match-zeta.vercel.app",
      // Dominio definitivo del colegio.
      "vibematch.cl",
      "www.vibematch.cl",
    ],
  },
  plugins: {
    SplashScreen: {
      backgroundColor: "#120a1f",
      showSpinner: false,
    },
  },
};

export default config;
