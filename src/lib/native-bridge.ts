/**
 * Puente JavaScript expuesto por la app Android (MainActivity.NativeBridge).
 *
 * La web se ejecuta dentro de un WebView; estas funciones permiten leer la
 * versión instalada, abrir enlaces externos y usar la huella del dispositivo
 * sin depender de WebAuthn (que no está disponible en todos los WebView).
 */
export type VibeMatchNativeBridge = {
  getVersion?: () => string;
  getVersionCode?: () => number;
  openUrl?: (url: string) => void;
  getBiometricStatus?: () => string;
  authenticateBiometric?: () => void;
};

declare global {
  interface Window {
    VibeMatchNative?: VibeMatchNativeBridge;
    /** Callback temporal que la app nativa invoca al terminar la huella. */
    __vibematchBiometric?: (ok: boolean) => void;
  }
}
