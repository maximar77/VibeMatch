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
const servidorRemoto = process.env.VIBEMATCH_APP_URL ?? "https://vibematch.cl";

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
      "vibematch.cl",
      "www.vibematch.cl",
      // Host temporal de pruebas (Vercel). Quitar cuando Oracle esté activo.
      "vibe-match-zeta.vercel.app",
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
