/**
 * Generador de código QR para VibeMatch.
 *
 * Genera un código QR (SVG) que codifica el token de acceso de una tarjeta.
 * Implementación propia sin dependencias externas.
 */

type QRErrorCorrection = "L" | "M" | "Q" | "H";

/**
 * Codifica un string en un código QR SVG.
 *
 * @param texto Texto a codificar (token de acceso o URL completa).
 * @param tamaño Tamaño del SVG en píxelas (default 256).
 * @returns String SVG lista para insertar en el DOM.
 */
export function generarQR(texto: string, tamaño = 256): string {
  const modulos = codificarQR(texto);
  const n = modulos.length;
  const modulo = tamaño / n;
  const silencio = Math.floor(modulo * 4);

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${tamaño} ${tamaño}" width="${tamaño}" height="${tamaño}">`;
  svg += `<rect width="100%" height="100%" fill="#ffffff" />`;
  svg += `<path fill="#07070d" d="`;

  let primero = true;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (modulos[y][x]) {
        const px = x * modulo + silencio;
        const py = y * modulo + silencio;
        svg += primero
          ? `M${px} ${py}h${modulo}v${modulo}h${-modulo}z`
          : `M${px} ${py}h${modulo}v${modulo}h${-modulo}z`;
        primero = false;
      }
    }
  }

  svg += `" />`;
  svg += `</svg>`;
  return svg;
}


/** Alfabeto alfanumérico QR (modo alfanumérico). */
const ALFA_NUM =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";

const VERSIONES_QR = [
  { version: 1, modulos: 21, maxCharsAlphaNum: 25, totalCodewords: 26, ecCodewordsPerBlock: 7, numBlocks: 1 },
  { version: 2, modulos: 25, maxCharsAlphaNum: 41, totalCodewords: 44, ecCodewordsPerBlock: 10, numBlocks: 1 },
  { version: 3, modulos: 29, maxCharsAlphaNum: 70, totalCodewords: 70, ecCodewordsPerBlock: 15, numBlocks: 1 },
  { version: 4, modulos: 33, maxCharsAlphaNum: 100, totalCodewords: 86, ecCodewordsPerBlock: 20, numBlocks: 1 },
  { version: 5, modulos: 37, maxCharsAlphaNum: 134, totalCodewords: 106, ecCodewordsPerBlock: 26, numBlocks: 1 },
  { version: 6, modulos: 41, maxCharsAlphaNum: 172, totalCodewords: 122, ecCodewordsPerBlock: 36, numBlocks: 1 },
  { version: 7, modulos: 45, maxCharsAlphaNum: 196, totalCodewords: 140, ecCodewordsPerBlock: 42, numBlocks: 1 },
  { version: 8, modulos: 49, maxCharsAlphaNum: 242, totalCodewords: 158, ecCodewordsPerBlock: 48, numBlocks: 1 },
  { version: 9, modulos: 53, maxCharsAlphaNum: 292, totalCodewords: 178, ecCodewordsPerBlock: 56, numBlocks: 1 },
  { version: 10, modulos: 57, maxCharsAlphaNum: 346, totalCodewords: 200, ecCodewordsPerBlock: 68, numBlocks: 1 },
];

function seleccionarVersion(longitudChars: number) {
  for (const v of VERSIONES_QR) {
    if (longitudChars <= v.maxCharsAlphaNum) return v;
  }
  return null;
}

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
function inicializarTablasGF() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
}
inicializarTablasGF();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return EXP[LOG[a] + LOG[b]];
}

function gfPow(base: number, exp: number): number {
  if (exp === 0) return 1;
  return EXP[(LOG[base] * exp) % 255];
}

function generarPolinomioEC(grado: number): number[] {
  const g = [1];
  for (let i = 0; i < grado; i++) {
    const raiz = gfPow(2, i);
    const nuevo: number[] = new Array(g.length + 1).fill(0);
    for (let j = 0; j < g.length; j++) {
      nuevo[j] ^= g[j];
      nuevo[j + 1] ^= gfMul(g[j], raiz);
    }
    g.splice(0, g.length, ...nuevo);
  }
  return g;
}

function calcularEC(data: number[], ecBytes: number): number[] {
  const g = generarPolinomioEC(ecBytes);
  const msg = [...data, ...new Array(ecBytes).fill(0)];
  for (let i = 0; i < data.length; i++) {
    const coef = msg[i];
    if (coef !== 0) {
      for (let j = 1; j < g.length; j++) {
        msg[i + j] ^= gfMul(g[j], coef);
      }
    }
  }
  return msg.slice(data.length);
}

function textoABytesAlfanumerico(texto: string): number[] {
  const bytes: number[] = [];
  let i = 0;
  while (i < texto.length) {
    const c1 = ALFA_NUM.indexOf(texto[i]);
    if (c1 === -1) throw new Error(`Caracter no soportado: ${texto[i]}`);
    if (i + 1 < texto.length) {
      const c2 = ALFA_NUM.indexOf(texto[i + 1]);
      if (c2 === -1) throw new Error(`Caracter no soportado: ${texto[i + 1]}`);
      const valor = c1 * 45 + c2;
      bytes.push(Math.floor(valor / 256));
      bytes.push(valor % 256);
      i += 2;
    } else {
      bytes.push(c1);
      i += 1;
    }
  }
  return bytes;
}

function longitudCharsABits(valor: number, bitsCampo: number): number[] {
  const out: number[] = [];
  for (let i = bitsCampo - 1; i >= 0; i--) {
    out.push((valor >> i) & 1);
  }
  return out;
}

function byteABits(valor: number): number[] {
  const out: number[] = [];
  for (let i = 7; i >= 0; i--) out.push((valor >> i) & 1);
  return out;
}
/**
 * Genera un URL completo para el QR basado en el token y la URL pública.
 */
export function generarURLQR(token: string, baseURL?: string): string {
  const base =
    baseURL ??
    (typeof process !== "undefined" && process.env.VIBEMATCH_PUBLIC_URL)
      ? process.env.VIBEMATCH_PUBLIC_URL
      : typeof window !== "undefined"
        ? window.location.origin
        : "";
  return `${base}/a/${encodeURIComponent(token)}`;
}

function codificarQR(texto: string): boolean[][] {
  const versionInfo = seleccionarVersion(texto.length);
  if (!versionInfo) {
    return matrizPlaceholder(texto.length);
  }

  const { modulos, totalCodewords, ecCodewordsPerBlock } = versionInfo;

  const bytesDatos = textoABytesAlfanumerico(texto);
  const indicadorModo = [0b0010];
  const bitsLongitud = longitudCharsABits(texto.length, 9);

  const bits: number[] = [...indicadorModo, ...bitsLongitud];
  for (const b of bytesDatos) bits.push(...byteABits(b));

  while (bits.length % 8 !== 0) bits.push(0);
  while (bits.length / 8 < totalCodewords - ecCodewordsPerBlock) {
    bits.push(...byteABits(0b11101100));
    if (bits.length / 8 < totalCodewords - ecCodewordsPerBlock) {
      bits.push(...byteABits(0b00010001));
    }
  }

  const numDataCodewords = totalCodewords - ecCodewordsPerBlock;
  const dataCodewords: number[] = [];
  for (let i = 0; i < numDataCodewords * 8; i += 8) {
    let val = 0;
    for (let j = 0; j < 8; j++) val = (val << 1) | (bits[i + j] || 0);
    dataCodewords.push(val);
  }

  const ecCodewords = calcularEC(dataCodewords, ecCodewordsPerBlock);

  const codewordsFinales: number[] = [];
  for (let i = 0; i < dataCodewords.length; i++) codewordsFinales.push(dataCodewords[i]);
  for (let i = 0; i < ecCodewords.length; i++) codewordsFinales.push(ecCodewords[i]);

  const matriz: boolean[][] = Array.from({ length: modulos }, () =>
    Array.from({ length: modulos }, () => false),
  );

  colocarPatrones(matriz, modulos, versionInfo.version);
  colocarSincronia(matriz, modulos);
  llenarDatos(matriz, codewordsFinales, modulos);
  aplicarMascara(matriz, 1, modulos);

  return matriz;
}

function colocarPatrones(matriz: boolean[][], n: number, version: number) {
  const patronesPosicion = [
    { x: 0, y: 0 },
    { x: n - 7, y: 0 },
    { x: 0, y: n - 7 },
  ];
  for (const { x, y } of patronesPosicion) {
    for (let dy = 0; dy < 7; dy++) {
      for (let dx = 0; dx < 7; dx++) {
        if (
          (dx === 0 || dx === 6 || dy === 0 || dy === 6) ||
          (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4)
        ) {
          matriz[y + dy][x + dx] = true;
        }
      }
    }
  }

  for (const { x, y } of patronesPosicion) {
    for (let i = -1; i <= 7; i++) {
      if (x + i >= 0 && x + i < n) matriz[Math.max(0, y - 1)][x + i] = false;
      if (y + i >= 0 && y + i < n) matriz[y + i][Math.max(0, x - 1)] = false;
    }
  }

  const posicionesAlineacion: number[][] = [
    [],
    [6, 18],
    [6, 22],
    [6, 26],
    [6, 30],
    [6, 34],
    [6, 22, 38],
    [6, 24, 42],
    [6, 26, 46],
    [6, 28, 50],
  ];
  const alineaciones = posicionesAlineacion[version - 1] ?? [];
  for (const fila of alineaciones) {
    for (const col of alineaciones) {
      const esPosicion =
        (fila < 9 && col < 9) ||
        (fila < 9 && col > n - 10) ||
        (fila > n - 10 && col < 9);
      if (esPosicion) continue;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          if (Math.abs(dx) + Math.abs(dy) <= 2) {
            if (fila + dy >= 0 && fila + dy < n && col + dx >= 0 && col + dx < n) {
              matriz[fila + dy][col + dx] = true;
            }
          }
        }
      }
    }
  }

  const bitsFormato = [1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 1, 0, 0, 1, 0];
  const posFormato = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
    [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
  ];
  for (let i = 0; i < posFormato.length; i++) {
    const [fy, fx] = posFormato[i];
    matriz[fy][fx] = Boolean(bitsFormato[i]);
  }
  for (let i = 0; i < 7; i++) {
    matriz[n - 1 - i][8] = Boolean(bitsFormato[i]);
  }
  for (let i = 7; i < 15; i++) {
    matriz[8][n - 15 + i] = Boolean(bitsFormato[i]);
  }
}

function colocarSincronia(matriz: boolean[][], n: number) {
  for (let i = 8; i < n - 8; i++) {
    matriz[6][i] = i % 2 === 0;
    matriz[i][6] = i % 2 === 0;
  }
}

function llenarDatos(
  matriz: boolean[][],
  codewords: number[],
  n: number,
) {
  let bitIndex = 0;
  let totalBits = codewords.length * 8;
  let direccion = -1;
  let col = n - 1;
  let fila = n - 1;

  while (col > 0) {
    if (col === 6) col -= 1;
    for (let paso = 0; paso < 2; paso++) {
      const f = fila + paso * direccion;
      if (f >= 0 && f < n && !matriz[f][col]) {
        if (bitIndex < totalBits) {
          const byte = codewords[Math.floor(bitIndex / 8)];
          const bit = (byte >> (7 - (bitIndex % 8))) & 1;
          matriz[f][col] = bit === 1;
          bitIndex++;
        }
      }
      if (f === 0 || f === n - 1) direccion *= -1;
    }
    col -= 2;
    if (col < 0) break;
  }
}

function aplicarMascara(matriz: boolean[][], tipoMascara: number, n: number) {
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (!esModuloFijo(x, y, n)) {
        let condicion = false;
        if (tipoMascara === 1) condicion = (x + y) % 2 === 0;
        if (condicion) matriz[y][x] = !matriz[y][x];
      }
    }
  }
}

function esModuloFijo(x: number, y: number, n: number): boolean {
  if ((x < 7 && y < 7) || (x > n - 8 && y < 7) || (x < 7 && y > n - 8))
    return true;
  if (x === 6 || y === 6) return true;
  if ((x === 8 && y < 9) || (y === 8 && x < 9)) return true;
  if ((x === 8 && y >= n - 8) || (y === 8 && x >= n - 8)) return true;
  return false;
}

function matrizPlaceholder(longitud: number): boolean[][] {
  const n = 29;
  const matriz: boolean[][] = Array.from({ length: n }, () =>
    Array.from({ length: n }, () => false),
  );
  for (let dy = 0; dy < 7; dy++) {
    for (let dx = 0; dx < 7; dx++) {
      if (
        (dx === 0 || dx === 6 || dy === 0 || dy === 6) ||
        (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4)
      ) {
        matriz[dy][dx] = true;
        matriz[dy][n - 7 + dx] = true;
        matriz[n - 7 + dy][dx] = true;
      }
    }
  }
  return matriz;
}