import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Configuración de la app Android de VibeMatch.
 *
 * La app carga la web desde el servidor remoto (server.url) para reutilizar
 * Next.js, acciones de servidor y cookies de sesión. El perfil se cachea en el
 * dispositivo (ver src/lib/offline-profile.ts) para funcionar sin conexión.
 *
 * Cambiar VIBEMATCH_APP_URL permite apuntar a la red local o a otro dominio
 * sin tocar el código.
 */
const servidorRemoto =
  process.env.VIBEMATCH_APP_URL ?? "https://unlock-coal-gem-dozen.trycloudflare.com";

const config: CapacitorConfig = {
  appId: "cl.vibematch.app",
  appName: "VibeMatch",
  webDir: "public",
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  server: {
    url: servidorRemoto,
    cleartext: servidorRemoto.startsWith("http://"),
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      backgroundColor: "#120a1f",
      showSpinner: false,
    },
  },
};

export default config;
