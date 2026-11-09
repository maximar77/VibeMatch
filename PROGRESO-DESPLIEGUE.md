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
- [ ] Paquete web mínimo regenerado sin los APK antiguos.
- [ ] Paquete subido a AlwaysData.
- [ ] Respaldo de `~/www` en producción.
- [ ] Build 1.3.0 extraído en `~/www`.
- [ ] `.env.production` actualizado a 1.3.0/4 y código docente.
- [ ] Reinicio del sitio en AlwaysData (lo hace el usuario).
- [ ] Verificación en vivo.

## Datos clave

- APK: `public/descargas/VibeMatch-1.3.0.apk`
- SHA-256 APK:
  `796339b80beed8428f8abfb29b520f143109c79b67c5f2e539ceb339669f5218`
- Tamaño APK: 6.392.468 bytes.
- `versionCode 4`, `versionName 1.3.0`.
- Build web `BUILD_ID`: `MvQuxVnVq3W2qMFsQkZZY`.
- Certificado APK SHA-256:
  `a216e833951feff581a91b7592a55aa7d475d180034d12e60f1d46bb5a092faf`
- Producción sigue en 1.2.0 hasta el reinicio.
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

