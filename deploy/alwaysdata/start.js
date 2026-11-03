#!/usr/bin/env node
"use strict";

/**
 * Arranque de VibeMatch en AlwaysData.
 *
 * AlwaysData inicia el proceso con `HOST`/`IP` y `PORT` en el entorno. El
 * servidor standalone de Next.js espera `HOSTNAME` y `PORT`, así que hacemos la
 * traducción aquí y fijamos el directorio de trabajo en la carpeta de la app.
 *
 * Ojo: en las sesiones SSH `HOSTNAME` suele valer `ssh2`, que resuelve a
 * 127.x.x.x; por eso priorizamos `HOST`/`IP` (la dirección real del sitio).
 */

const path = require("node:path");

process.chdir(__dirname);
process.env.NODE_ENV = process.env.NODE_ENV || "production";
process.env.HOSTNAME = process.env.HOST || process.env.IP || "::";
process.env.PORT = process.env.PORT || "3000";

require(path.join(__dirname, "server.js"));
