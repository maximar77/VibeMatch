/**
 * Genera tarjetas VibeMatch con tokens únicos.
 *
 * Uso:
 *   node scripts/generar-tarjetas.mjs
 *   node scripts/generar-tarjetas.mjs --count=5
 *   node scripts/generar-tarjetas.mjs --append --count=2
 *   node scripts/generar-tarjetas.mjs --append --guest --count=100 --quiet
 *   node scripts/generar-tarjetas.mjs --append --public --quiet
 *   node scripts/generar-tarjetas.mjs --force --count=3
 *   node scripts/generar-tarjetas.mjs --base=https://vibematch.cl
 *
 * El registro data/cards.json guarda SOLO hashes SHA-256. Los tokens en claro
 * se escriben una vez en data/tarjetas-demo.csv (ignorado por Git) para poder
 * imprimir los QR. No subas ese CSV al repositorio.
 *
 * --guest genera tarjetas personales sin nombre (para que la persona complete
 * su perfil al entrar). --public crea/actualiza el token genérico que abre la
 * landing pública con los contactos para pedir el kit.
 */

import { createHash, randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, value = "1"] = arg.replace(/^--/, "").split("=");
    return [key, value];
  }),
);

const force = args.has("force");
const append = args.has("append");
const guest = args.has("guest");
const publicMode = args.has("public");
const count = Math.max(1, Number(args.get("count") ?? (publicMode ? 1 : 3)));
const quiet = args.has("quiet") || count > 10;
const baseUrl = (
  args.get("base") ??
  process.env.BASE_URL ??
  "http://localhost:3100"
).replace(/\/$/, "");
const school = process.env.SCHOOL_NAME ?? "Colegio Superior del Maipo";
const publicToken =
  args.get("public-token") ?? "vibematch-acceso-publico-2026";

const dataDir = path.join(process.cwd(), "data");
const storePath = path.join(dataDir, "cards.json");
const linksPath = path.join(dataDir, "tarjetas-demo.csv");

const demoPeople = [
  ["Maximo", "1° Medio"],
  ["Martina", "2° Medio"],
  ["Benjamín", "1° Medio"],
  ["Sofía", "3° Medio"],
  ["Tomás", "2° Medio"],
];

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

mkdirSync(dataDir, { recursive: true });

if (existsSync(storePath) && !force && !append) {
  console.error(
    "Ya existe data/cards.json. Para no invalidar tarjetas impresas usa --append, o --force para regenerar todo.",
  );
  process.exit(1);
}

let existing = [];
if (append && !force && existsSync(storePath)) {
  existing = JSON.parse(readFileSync(storePath, "utf8")).cards ?? [];
}

const cards = [...existing];
const generated = [];
const usedHashes = new Set(existing.map((card) => card.tokenHash).filter(Boolean));

if (publicMode) {
  if (!/^[A-Za-z0-9_-]{24,128}$/.test(publicToken)) {
    console.error(
      "El token público debe tener entre 24 y 128 caracteres A-Z, a-z, 0-9, _ o -.",
    );
    process.exit(1);
  }

  const alreadyExists = cards.some(
    (card) => card.id === "VM-PUBLIC" || card.kind === "public",
  );

  if (alreadyExists) {
    console.log("El token público ya existe en data/cards.json; no se duplicó.");
  } else {
    const tokenHash = hashToken(publicToken);
    const card = {
      id: "VM-PUBLIC",
      tokenHash,
      holder: "Acceso público",
      level: null,
      kind: "public",
      status: "active",
      createdAt: new Date().toISOString(),
    };
    cards.push(card);
    generated.push({
      ...card,
      token: publicToken,
      url: `${baseUrl}/a/${publicToken}`,
    });
  }
} else {
  const prefix = guest ? "VM-G" : "VM-";
  const startIndex = existing.filter((card) => card.id.startsWith(prefix)).length;

  for (let i = 0; i < count; i += 1) {
    const n = startIndex + i + 1;
    const id = `${prefix}${String(n).padStart(4, "0")}`;
    let token = "";
    let tokenHash = "";

    do {
      token = randomBytes(32).toString("base64url");
      tokenHash = hashToken(token);
    } while (usedHashes.has(tokenHash));

    usedHashes.add(tokenHash);

    const [holder, level] = guest
      ? [null, null]
      : (demoPeople[(n - 1) % demoPeople.length] ?? [
          `Estudiante ${n}`,
          "Sin curso",
        ]);

    const card = {
      id,
      tokenHash,
      holder,
      level,
      kind: "personal",
      status: "active",
      createdAt: new Date().toISOString(),
    };

    cards.push(card);
    generated.push({ ...card, token, url: `${baseUrl}/a/${token}` });
  }
}

if (generated.length > 0) {
  const store = {
    version: 1,
    school,
    updatedAt: new Date().toISOString(),
    cards,
  };

  writeFileSync(storePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");

  const csvHeader = "id,holder,level,token,url,estado";
  const csvRows = generated.map((card) =>
    [card.id, card.holder, card.level, card.token, card.url, card.status]
      .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
      .join(","),
  );
  const csv = `\uFEFF${[csvHeader, ...csvRows].join("\r\n")}\r\n`;

  if (append && existsSync(linksPath)) {
    const previous = readFileSync(linksPath, "utf8").replace(/^\uFEFF/, "").trimEnd();
    writeFileSync(
      linksPath,
      `\uFEFF${previous}\r\n${csvRows.join("\r\n")}\r\n`,
      "utf8",
    );
  } else {
    writeFileSync(linksPath, csv, "utf8");
  }
}

const kindLabel = publicMode
  ? "token público"
  : guest
    ? "tarjeta(s) guest"
    : "tarjeta(s)";

console.log(`\n${generated.length} ${kindLabel} generada(s) para ${school}\n`);

if (publicMode && generated[0]) {
  console.log(`Token público: ${publicToken}`);
  console.log(`URL: ${generated[0].url}\n`);
} else if (!quiet) {
  for (const card of generated) {
    console.log(`${card.id}  ${card.holder ?? "Sin nombre"} (${card.level ?? "Sin curso"})`);
    console.log(`  ${card.url}\n`);
  }
} else {
  console.log("Tokens generados en el CSV (no se imprimen en pantalla).\n");
}

console.log(`Registro con hashes: ${storePath}`);
console.log(`Tokens en claro (NO subir a Git): ${linksPath}`);
