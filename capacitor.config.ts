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
 * En producción es el dominio HTTPS de AlwaysData. No uses una URL de túnel temporal
 * (trycloudflare, ngrok) para una APK distribuida.
 */
const servidorRemoto =
  process.env.VIBEMATCH_APP_URL ?? "https://xam.alwaysdata.net";

const hostServidor = (() => {
  try {
    return new URL(servidorRemoto).host;
  } catch {
    return "";
  }
})();

const hostsPermitidos = Array.from(
  new Set(
    [
      hostServidor,
      "xam.alwaysdata.net",
      // Alias de demostración mientras se valida el dominio definitivo.
      "vibematch-demo.vercel.app",
      "vibe-match-zeta.vercel.app",
      // Dominio institucional de respaldo.
      "vibematch.cl",
      "www.vibematch.cl",
    ].filter(Boolean),
  ),
);

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
    allowNavigation: hostsPermitidos,
  },
  plugins: {
    SplashScreen: {
      backgroundColor: "#120a1f",
      showSpinner: false,
    },
  },
};

export default config;
