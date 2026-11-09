# Progreso del despliegue 1.3.0

> Registro vivo para retomar si se pierde la sesión.
> No contiene secretos. Las claves están en `TRASPASO-2026-11-07.md` y en el
> panel de AlwaysData.

## Estado actual

- [x] Código web y Android terminado.
- [x] Typecheck y build web locales correctos.
- [x] APK 1.3.0 compilada y firmada.
- [x] APK y código subidos a GitHub (`91b39bc`).
- [x] Estado inicial documentado (`ESTADO-2026-11-09.md`, `161e701`).
- [x] Paquete web mínimo regenerado sin los APK antiguos.
- [x] Paquete subido a AlwaysData.
- [x] Respaldo de `~/www` en producción.
- [x] Build 1.3.0 extraído en `~/www`.
- [x] `.env.production` actualizado a 1.3.0/4 y código docente.
- [ ] Reinicio final del sitio en AlwaysData (lo hace el usuario).
- [ ] Verificación final en vivo.

## Datos clave

- APK: `public/descargas/VibeMatch-1.3.0.apk`
- SHA-256 APK:
  `796339b80beed8428f8abfb29b520f143109c79b67c5f2e539ceb339669f5218`
- Tamaño APK: 6.392.468 bytes.
- `versionCode 4`, `versionName 1.3.0`.
- Build web `BUILD_ID`: `MvQuxVnVq3W2qMFsQkZZY`.
- Certificado APK SHA-256:
  `a216e833951feff581a91b7592a55aa7d475d180034d12e60f1d46bb5a092faf`
- Producción ya tiene la web 1.3.0 activa; solo el metadata
  `/api/app-version` sigue en 1.2.0 hasta el reinicio final.
- Datos vivos: `/home/xam/vibematch-data` (no tocar).
- `tarjetas-guest.txt` md5:
  `9b7f04a6e69f0c575dde3df4abd61040` (no tocar).

## Bitácora

### 2026-11-09 — Pausa y reanudación

- Se subió todo a GitHub.
- El `scp` anterior falló por cuota del home de AlwaysData.
- Se borraron tarballs viejos y `~/.npm` en el servidor.
- Quedaron ~180 MB libres.
- Se reanuda el despliegue sin tocar datos vivos.

### 2026-11-09 09:01 — Paquete mínimo

- Se regeneró el tarball sin `VibeMatch-1.2.0.apk` ni `VibeMatch-1.1.0.apk`
  para no sobrescribir el APK 1.2.0 correcto de producción.
- `SHA256SUMS.txt` ahora lista solo el APK 1.3.0.
- Nuevo paquete: `/tmp/opencode/vibematch-1.3.0-deploy.tar.gz`
  - Tamaño: 25 MB.
  - SHA-256: `67bc1a8cfac77bf669f3afb31dabe4b93c2006a051749efeef11006e6a83e317`.
- `BUILD_ID` empaquetado: `MvQuxVnVq3W2qMFsQkZZY`.

### 2026-11-09 13:02 — Subida y extracción

- El tarball se subió a `~/vibematch-1.3.0-deploy.tar.gz`; hash remoto
  verificado: `67bc1a8c...83e317`.
- Respaldo creado en `~/deploy-backups/2026-11-09-1303/`:
  - `.next/` anterior.
  - `public/` anterior (incluye el APK 1.2.0 correcto).
  - `server.js`, `start.js`, `next.config.ts`, `package.json`.
  - `.env.production` anterior.
- Se extrajo el build nuevo en `~/www`.
- `~/www/.next/BUILD_ID` = `MvQuxVnVq3W2qMFsQkZZY`.
- Se restauraron en `~/www/public/descargas/` los APK históricos:
  - `VibeMatch-1.1.0.apk` → `dbd7f0df...16f8e`.
  - `VibeMatch-1.2.0.apk` → `cb41ce4e...bf6ee` (el correcto de producción).
  - `VibeMatch-1.3.0.apk` → `796339b8...f5218`.
- `/descargas/SHA256SUMS.txt` en vivo lista solo el APK 1.3.0.

### 2026-11-09 13:05 — Web nueva activa, falta reinicio final

- El sitio se reinició a las 22:05:18 +0100.
- La web nueva ya está activa:
  - `/` muestra 2 botones `Descargar APK Android`.
  - `/api/health` incluye `teacherCodeConfigured: true`.
  - `/descargar` responde 307.
  - `/descargas/VibeMatch-1.3.0.apk` responde 200 y su SHA-256 es
    `796339b80beed8428f8abfb29b520f143109c79b67c5f2e539ceb339669f5218`.
- Pero `/api/app-version` sigue devolviendo `1.2.0` / `3` porque el proceso
  arrancó antes de actualizar `.env.production`.
- `.env.production` ya quedó actualizado:
  - `VIBEMATCH_APP_VERSION=1.3.0`
  - `VIBEMATCH_APP_VERSION_CODE=4`
  - `VIBEMATCH_APP_APK_URL=https://xam.alwaysdata.net/descargas/VibeMatch-1.3.0.apk`
  - `VIBEMATCH_PUBLIC_URL=https://xam.alwaysdata.net`
  - `VIBEMATCH_TEACHER_CODE` configurado.
- El arranque real es `node /home/xam/www/start.js`, con el entorno del panel
  de AlwaysData (que ya incluye secret, teacher code, cookie secure, school y
  public URL). Los valores de versión vienen de `.env.production`.
- **Pendiente inmediato:** que el usuario pulse **Restart** en AlwaysData
  Web > Sites para que el proceso cargue el nuevo `.env.production`.
- Después del reinicio, verificar:
  ```bash
  curl -s https://xam.alwaysdata.net/api/app-version
  # debe devolver version 1.3.0, versionCode 4 y apkUrl .../VibeMatch-1.3.0.apk
  curl -sI https://xam.alwaysdata.net/descargar
  # debe redirigir a .../VibeMatch-1.3.0.apk
  ```


