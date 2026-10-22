/**
 * Genera tarjetas VibeMatch con tokens únicos.
 *
 * Uso:
 *   node scripts/generar-tarjetas.mjs
 *   node scripts/generar-tarjetas.mjs --count=5
 *   node scripts/generar-tarjetas.mjs --append --count=2
 *   node scripts/generar-tarjetas.mjs --force --count=3
 *   node scripts/generar-tarjetas.mjs --base=https://vibematch.cl
 *
 * El registro data/cards.json guarda SOLO hashes SHA-256. Los tokens en claro
 * se escriben una vez en data/tarjetas-demo.csv (ignorado por Git) para poder
 * imprimir los QR. No subas ese CSV al repositorio.
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
const count = Math.max(1, Number(args.get("count") ?? 3));
const baseUrl = (args.get("base") ?? process.env.BASE_URL ?? "http://localhost:3100").replace(/\/$/, "");
const school = process.env.SCHOOL_NAME ?? "Colegio Superior del Maipo";

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

const startIndex = existing.length;
const cards = [...existing];
const generated = [];

for (let i = 0; i < count; i += 1) {
  const n = startIndex + i + 1;
  const id = `VM-${String(n).padStart(4, "0")}`;
  const token = randomBytes(32).toString("base64url");
  const [holder, level] = demoPeople[(n - 1) % demoPeople.length] ?? [
    `Estudiante ${n}`,
    "Sin curso",
  ];

  const card = {
    id,
    tokenHash: createHash("sha256").update(token).digest("hex"),
    holder,
    level,
    status: "active",
    createdAt: new Date().toISOString(),
  };

  cards.push(card);
  generated.push({ ...card, token, url: `${baseUrl}/a/${token}` });
}

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
    .map((value) => `"${String(value).replaceAll('"', '""')}"`)
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

console.log(`\n${generated.length} tarjeta(s) generada(s) para ${school}\n`);
for (const card of generated) {
  console.log(`${card.id}  ${card.holder} (${card.level})`);
  console.log(`  ${card.url}\n`);
}
console.log(`Registro con hashes: ${storePath}`);
console.log(`Tokens en claro (NO subir a Git): ${linksPath}`);
