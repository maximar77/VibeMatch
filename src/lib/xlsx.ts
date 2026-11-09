import { Buffer } from "node:buffer";
import { deflateRawSync } from "node:zlib";

/**
 * Generador mínimo de archivos .xlsx (Office Open XML).
 *
 * No usa dependencias externas: arma el ZIP y las hojas XML con node:zlib.
 * Está pensado para las exportaciones del panel docente, donde solo hacen
 * falta texto, números, encabezados, anchos de columna, fila congelada y
 * autofiltro. Los textos se guardan como inlineStr para no necesitar
 * sharedStrings.xml.
 */

export type CeldaExcel = string | number | boolean | null | undefined;

export type HojaExcel = {
  nombre: string;
  encabezados: string[];
  filas: CeldaExcel[][];
  /** Anchos en caracteres; si se omite se calculan según el contenido. */
  anchos?: number[];
};

const CRC_TABLE = (() => {
  const tabla = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    tabla[n] = c >>> 0;
  }
  return tabla;
})();

function crc32(datos: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < datos.length; i += 1) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ datos[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function fechaHoraDos(ahora: Date = new Date()): { hora: number; fecha: number } {
  const hora =
    ((ahora.getHours() & 0x1f) << 11) |
    ((ahora.getMinutes() & 0x3f) << 5) |
    ((ahora.getSeconds() & 0x3f) >> 1);
  const fecha =
    (((Math.max(1980, ahora.getFullYear()) - 1980) & 0x7f) << 9) |
    (((ahora.getMonth() + 1) & 0x0f) << 5) |
    (ahora.getDate() & 0x1f);
  return { hora, fecha };
}

function crearZip(archivos: { nombre: string; datos: Buffer }[]): Buffer {
  const partesLocales: Buffer[] = [];
  const partesCentrales: Buffer[] = [];
  const { hora, fecha } = fechaHoraDos();
  let desplazamiento = 0;

  for (const archivo of archivos) {
    const nombre = Buffer.from(archivo.nombre, "utf8");
    const comprimido = deflateRawSync(archivo.datos);
    const crc = crc32(archivo.datos);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6); // nombres en UTF-8
    local.writeUInt16LE(8, 8); // deflate
    local.writeUInt16LE(hora, 10);
    local.writeUInt16LE(fecha, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(comprimido.length, 18);
    local.writeUInt32LE(archivo.datos.length, 22);
    local.writeUInt16LE(nombre.length, 26);
    local.writeUInt16LE(0, 28);
    partesLocales.push(local, nombre, comprimido);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(hora, 12);
    central.writeUInt16LE(fecha, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(comprimido.length, 20);
    central.writeUInt32LE(archivo.datos.length, 24);
    central.writeUInt16LE(nombre.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(desplazamiento, 42);
    partesCentrales.push(central, nombre);

    desplazamiento += local.length + nombre.length + comprimido.length;
  }

  const directorioCentral = Buffer.concat(partesCentrales);
  const fin = Buffer.alloc(22);
  fin.writeUInt32LE(0x06054b50, 0);
  fin.writeUInt16LE(0, 4);
  fin.writeUInt16LE(0, 6);
  fin.writeUInt16LE(archivos.length, 8);
  fin.writeUInt16LE(archivos.length, 10);
  fin.writeUInt32LE(directorioCentral.length, 12);
  fin.writeUInt32LE(desplazamiento, 16);
  fin.writeUInt16LE(0, 20);

  return Buffer.concat([...partesLocales, directorioCentral, fin]);
}

function escaparXml(valor: string): string {
  return valor
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function letraColumna(indice: number): string {
  let numero = indice + 1;
  let letra = "";
  while (numero > 0) {
    const resto = (numero - 1) % 26;
    letra = String.fromCharCode(65 + resto) + letra;
    numero = Math.floor((numero - 1) / 26);
  }
  return letra;
}

function referencia(fila: number, columna: number): string {
  return `${letraColumna(columna)}${fila}`;
}

function celdaXml(
  valor: CeldaExcel,
  fila: number,
  columna: number,
  estilo?: number,
): string {
  const ref = referencia(fila, columna);
  const atributoEstilo = estilo ? ` s="${estilo}"` : "";

  if (valor === null || valor === undefined || valor === "") {
    return `<c r="${ref}"${atributoEstilo}/>`;
  }

  if (typeof valor === "number" && Number.isFinite(valor)) {
    return `<c r="${ref}"${atributoEstilo}><v>${valor}</v></c>`;
  }

  if (typeof valor === "boolean") {
    return `<c r="${ref}" t="b"${atributoEstilo}><v>${valor ? 1 : 0}</v></c>`;
  }

  return `<c r="${ref}" t="inlineStr"${atributoEstilo}><is><t xml:space="preserve">${escaparXml(
    String(valor),
  )}</t></is></c>`;
}

function limpiarNombreHoja(nombre: string, usados: Set<string>): string {
  const base =
    nombre
      .replace(/[\[\]:*?/\\]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 31) || "Hoja";
  let candidato = base;
  let sufijo = 2;
  while (usados.has(candidato.toLowerCase())) {
    const texto = ` (${sufijo})`;
    candidato = `${base.slice(0, 31 - texto.length)}${texto}`;
    sufijo += 1;
  }
  usados.add(candidato.toLowerCase());
  return candidato;
}

function anchoColumna(hoja: HojaExcel, columna: number): number {
  if (hoja.anchos?.[columna]) return hoja.anchos[columna];
  const largoEncabezado = hoja.encabezados[columna]?.length ?? 8;
  let largo = largoEncabezado;
  for (const fila of hoja.filas) {
    const valor = fila[columna];
    if (valor === null || valor === undefined) continue;
    largo = Math.max(largo, String(valor).length);
  }
  return Math.min(60, Math.max(10, largo + 3));
}

function hojaXml(hoja: HojaExcel): string {
  const totalColumnas = Math.max(
    hoja.encabezados.length,
    ...hoja.filas.map((fila) => fila.length),
    1,
  );
  const totalFilas = 1 + hoja.filas.length;
  const ultimaColumna = letraColumna(totalColumnas - 1);
  const referenciaRango = `A1:${ultimaColumna}${totalFilas}`;

  const columnas = Array.from(
    { length: totalColumnas },
    (_, indice) =>
      `<col min="${indice + 1}" max="${indice + 1}" width="${anchoColumna(
        hoja,
        indice,
      )}" customWidth="1"/>`,
  ).join("");

  const filaEncabezado = `<row r="1">${Array.from(
    { length: totalColumnas },
    (_, indice) =>
      celdaXml(hoja.encabezados[indice] ?? "", 1, indice, 1),
  ).join("")}</row>`;

  const filasCuerpo = hoja.filas
    .map(
      (fila, indiceFila) =>
        `<row r="${indiceFila + 2}">${Array.from(
          { length: totalColumnas },
          (_, indiceColumna) =>
            celdaXml(fila[indiceColumna], indiceFila + 2, indiceColumna),
        ).join("")}</row>`,
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<dimension ref="${referenciaRango}"/>
<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
<sheetFormatPr defaultRowHeight="15"/>
<cols>${columnas}</cols>
<sheetData>${filaEncabezado}${filasCuerpo}</sheetData>
<autoFilter ref="${referenciaRango}"/>
</worksheet>`;
}

const ESTILOS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="2">
<font><sz val="11"/><name val="Calibri"/><family val="2"/></font>
<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/><family val="2"/></font>
</fonts>
<fills count="3">
<fill><patternFill patternType="none"/></fill>
<fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF1F2937"/><bgColor indexed="64"/></patternFill></fill>
</fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="2">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

/**
 * Convierte una o más hojas en un archivo .xlsx válido.
 */
export function generarXlsx(hojas: HojaExcel[]): Buffer {
  if (hojas.length === 0) {
    throw new Error("El archivo Excel necesita al menos una hoja.");
  }

  const usados = new Set<string>();
  const hojasConNombre = hojas.map((hoja) => ({
    ...hoja,
    nombre: limpiarNombreHoja(hoja.nombre, usados),
  }));

  const hojasXml = hojasConNombre
    .map(
      (hoja, indice) =>
        `<sheet name="${escaparXml(hoja.nombre)}" sheetId="${
          indice + 1
        }" r:id="rId${indice + 1}"/>`,
    )
    .join("");

  const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets>${hojasXml}</sheets>
</workbook>`;

  const relacionesWorkbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${hojasConNombre
  .map(
    (_, indice) =>
      `<Relationship Id="rId${indice + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${
        indice + 1
      }.xml"/>`,
  )
  .join("")}
<Relationship Id="rId${
    hojasConNombre.length + 1
  }" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  const relacionesRaiz = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  const tiposContenido = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
${hojasConNombre
  .map(
    (_, indice) =>
      `<Override PartName="/xl/worksheets/sheet${
        indice + 1
      }.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
  )
  .join("")}
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

  const archivos = [
    { nombre: "[Content_Types].xml", datos: Buffer.from(tiposContenido, "utf8") },
    { nombre: "_rels/.rels", datos: Buffer.from(relacionesRaiz, "utf8") },
    { nombre: "xl/workbook.xml", datos: Buffer.from(workbook, "utf8") },
    {
      nombre: "xl/_rels/workbook.xml.rels",
      datos: Buffer.from(relacionesWorkbook, "utf8"),
    },
    { nombre: "xl/styles.xml", datos: Buffer.from(ESTILOS, "utf8") },
    ...hojasConNombre.map((hoja, indice) => ({
      nombre: `xl/worksheets/sheet${indice + 1}.xml`,
      datos: Buffer.from(hojaXml(hoja), "utf8"),
    })),
  ];

  return crearZip(archivos);
}
