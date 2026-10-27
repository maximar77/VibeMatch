import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { DATA_DIR } from "@/lib/data-dir";

const STORE_PATH = path.join(DATA_DIR, "feedback.json");

export type Feedback = {
  id: string;
  tipo: "bug" | "sugerencia" | "otro";
  mensaje: string;
  email?: string | null;
  url?: string | null;
  userAgent?: string | null;
  plataforma?: string | null;
  cardId?: string | null;
  dispositivo?: string | null;
  modelo?: string | null;
  sistema?: string | null;
  versionApp?: string | null;
  createdAt: string;
};

type FeedbackStore = {
  version: 1;
  feedback: Feedback[];
};

function leerStore(): FeedbackStore {
  if (!existsSync(STORE_PATH)) {
    return { version: 1, feedback: [] };
  }
  try {
    const raw = readFileSync(STORE_PATH, "utf8").replace(/^\uFEFF/, "");
    const parsed = JSON.parse(raw) as FeedbackStore;
    if (Array.isArray(parsed.feedback)) {
      return { version: 1, feedback: parsed.feedback };
    }
  } catch {}
  return { version: 1, feedback: [] };
}

function escribirStore(store: FeedbackStore) {
  mkdirSync(DATA_DIR, { recursive: true });
  const temporal = `${STORE_PATH}.${process.pid}.tmp`;
  writeFileSync(temporal, `${JSON.stringify(store, null, 2)}\n`, "utf8");
  renameSync(temporal, STORE_PATH);
}

export function guardarFeedback(
  feedback: Omit<Feedback, "id" | "createdAt">,
): Feedback {
  const store = leerStore();
  const guardado: Feedback = {
    ...feedback,
    id: `fb_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
  store.feedback = [...store.feedback, guardado];
  if (store.feedback.length > 1000) {
    store.feedback = store.feedback.slice(-1000);
  }
  escribirStore(store);
  return guardado;
}

export function listarFeedback(): Feedback[] {
  return [...leerStore().feedback].reverse();
}
