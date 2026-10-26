# VibeMatch en Oracle Cloud (Docker + Caddy)

Despliegue de producción para el sitio completo de VibeMatch: Next.js, Server
Actions, cookies de sesión, panel docente, API y persistencia en disco.

```
Internet (HTTPS 443)
        │
        ▼
   Caddy (Let's Encrypt)
        │  reverse_proxy
        ▼
   web (Next.js standalone, Node 22)
        │
        ▼
   volumen Docker vibematch_data → /app/data
```

## 1. Requisitos en Oracle

- Cuenta de Oracle Cloud con **Always Free** disponible.
- Una VCN con subnet pública (por ejemplo `vibematch-vcn` / `10.0.1.0/24`).
- Security List o NSG con entrada:
  - `22/tcp` solo desde tu IP (SSH).
  - `80/tcp` y `443/tcp` desde `0.0.0.0/0`.
  - `443/udp` desde `0.0.0.0/0` (HTTP/3; opcional pero recomendado).
- Salida a Internet para descargar imágenes, certificados y actualizaciones.
- Un dominio o subdominio apuntando a la IP pública. Sin dominio no hay HTTPS
  automático. Para pruebas sirve un subdominio DuckDNS.

### Forma de instancia recomendada

| Opción | Forma | Notas |
|---|---|---|
| Preferida | `VM.Standard.A1.Flex` (ARM), 2 OCPU / 12 GB | Always Free; requiere imagen aarch64 (Ubuntu 24.04 ARM). |
| Alternativa | `VM.Standard.E2.1.Micro` (AMD), 1 GB RAM | Always Free; añade swap antes de compilar. |
| Alternativa | `VM.Standard.A1.Flex` 1 OCPU / 6 GB | Suficiente para el piloto. |

Si aparece **Out of capacity**, prueba otra Availability Domain (AD-2/AD-3) o
la forma AMD. No cambies la subnet: reutiliza la existente.

## 2. Crear la instancia (consola)

1. **Networking → Virtual Cloud Networks**: crea o reutiliza la VCN con
   *Internet Connectivity*. Anota la subnet pública.
2. **Compute → Instances → Create instance**:
   - Nombre: `vibematch-web`.
   - Imagen: Ubuntu 24.04 (aarch64 si usas A1; x86_64 si usas E2).
   - Shape: ver tabla anterior.
   - Subnet: la pública.
   - **Assign a public IPv4 address**: sí.
   - SSH keys: sube `ssh-key-2026-10-26.key.pub` o pega su contenido.
   - Boot volume: 50–100 GB (Always Free incluye 200 GB).
3. Crea la instancia y anota la **Public IP**.
4. En la Security List de la subnet, abre `22`, `80`, `443/tcp` y `443/udp`.
5. En DNS, crea un registro `A`:
   - `vibematch.cl` → IP pública.
   - `www` → IP pública (opcional).
   - Si no tienes dominio: crea `vibematch.duckdns.org` y apunta la IP.

> La IP efímera puede cambiar si reinicias la instancia. Para producción,
> reserva una **Reserved Public IP** y asígnala a la instancia.

## 3. Primer acceso y firewall del sistema

```bash
ssh -i ~/Downloads/ssh-key-2026-10-26.key ubuntu@IP_PUBLICA
sudo apt update && sudo apt upgrade -y
```

Si usas `E2.1.Micro` (1 GB), crea swap antes de compilar:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## 4. Subir el código

El repositorio es privado. En la instancia puedes clonar con un token de GitHub
o copiar el proyecto desde tu equipo.

```bash
# Opción A: clonar con token (no lo dejes en el historial del shell)
git clone https://TOKEN@github.com/maximar77/VibeMatch.git
cd VibeMatch

# Opción B: desde tu equipo
# scp -i llave -r C:\Users\idk\Documents\VibeMatch ubuntu@IP:/home/ubuntu/
```

## 5. Configurar variables de entorno

```bash
cd ~/VibeMatch
cp deploy/oracle/.env.example deploy/oracle/.env
nano deploy/oracle/.env
```

Completa obligatoriamente:

- `VIBEMATCH_DOMAIN`: dominio real sin `https://` (ej. `vibematch.cl`).
- `ACME_EMAIL`: correo para Let's Encrypt.
- `VIBEMATCH_SECRET`: genera uno con
  `openssl rand -base64 43 | tr -d '\n'`.
- `VIBEMATCH_TEACHER_CODE`: código institucional para registrar docentes.
- `VIBEMATCH_PUBLIC_URL`: `https://` + dominio.
- `VIBEMATCH_COOKIE_SECURE=1`.

`deploy/oracle/.env` está ignorado por Git. No subas secretos.

No definas `VIBEMATCH_DATA_DIR` en Oracle: la app debe usar `/app/data`, que es el
volumen persistente. Ese ajuste es solo para demos sin disco (por ejemplo Vercel).

## 6. Instalar Docker, firewall y arrancar

```bash
sudo bash deploy/oracle/install.sh
```

El script:

1. Instala Docker Engine y el plugin Compose.
2. Activa `ufw` con `22`, `80`, `443/tcp` y `443/udp`.
3. Genera `deploy/oracle/.env` si no existe.
4. Compila la imagen y levanta `web` + `caddy`.
5. Muestra el estado y la URL de healthcheck.

Verifica:

```bash
docker compose -f deploy/oracle/compose.yaml ps
curl -fsS https://TU_DOMINIO/api/health
```

Debe responder `{"ok":true,...}`. Si Caddy aún no obtiene el certificado,
revisa que el DNS ya apunte a la IP y que `80/443` estén abiertos.

## 7. Datos y persistencia

- Los datos viven en el volumen `vibematch_data`, montado en `/app/data`.
- `data/cards.json` (solo hashes) se copia como semilla.
- `profiles.json`, asistencia, permisos, anotaciones y docentes se crean en el
  volumen y sobreviven a reinicios y actualizaciones.
- El contenedor corre como usuario `nextjs` (UID 1001). No cambies el volumen a
  otro usuario sin ajustar permisos.

Backup manual:

```bash
sudo bash deploy/oracle/backup.sh
# genera deploy/oracle/backups/vibematch-data-AAAAMMDD-HHMMSS.tar.gz
```

Restaurar (detén la app primero):

```bash
docker compose -f deploy/oracle/compose.yaml stop web
sudo bash deploy/oracle/restore.sh deploy/oracle/backups/ARCHIVO.tar.gz
docker compose -f deploy/oracle/compose.yaml start web
```

## 8. Actualizaciones

```bash
sudo bash deploy/oracle/update.sh
```

Hace `git pull --ff-only`, reconstruye la imagen, reinicia servicios y elimina
imágenes huérfanas. Programa un cron semanal para backups:

```bash
# crontab -e
0 3 * * * cd /home/ubuntu/VibeMatch && bash deploy/oracle/backup.sh >> /var/log/vibematch-backup.log 2>&1
```

## 9. APK apuntando a Oracle

La APK 1.0.0 trae `https://vibematch.cl` como URL de fábrica, pero **el dominio se puede
configurar en el dispositivo** sin recompilar: primer arranque, atajo “Configurar
servidor” o enlace `vibematch://config`. La URL elegida se guarda en
`SharedPreferences` y tiene prioridad sobre la de fábrica.

Para dejar otro dominio grabado de fábrica:

```powershell
# Windows PowerShell, en la raíz del proyecto
$env:JAVA_HOME="C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot"
$env:ANDROID_HOME="$env:LOCALAPPDATA\Android\Sdk"
$env:VIBEMATCH_APP_URL="https://TU_DOMINIO"
npx cap sync android
cd android
.\gradlew.bat assembleRelease bundleRelease
```

La URL de fábrica queda en `android/app/src/main/assets/capacitor.config.json`. No
distribuyas APKs apuntando a túneles temporales.

Si el dominio final no es `vibematch.cl`, además del diálogo de la app conviene editar
`android/app/src/main/AndroidManifest.xml` (host de los App Links) y
`capacitor.config.ts` (`allowNavigation`) antes de recompilar. El esquema
`vibematch://` sigue funcionando aunque el host HTTPS sea distinto.

## 10. App Links (deep links HTTPS)

El manifiesto Android declara `https://vibematch.cl/a/…`, el host de demo de Vercel y
`vibematch://a/…`. Para que Android verifique los enlaces HTTPS, publica
`https://TU_DOMINIO/.well-known/assetlinks.json` con la huella SHA-256 del keystore de
firma. El archivo ya está en `public/.well-known/assetlinks.json` con la huella del
keystore de release:

```
A2:16:E8:33:95:1F:EF:F5:81:A9:1B:75:92:A5:5A:A7:D4:75:D1:80:03:4D:12:E6:0F:1D:46:BB:5A:09:2F:AF
```

Si generas otro keystore, reemplaza la huella y vuelve a desplegar. Sin App Links, el
esquema `vibematch://`, la lectura NFC interna y la configuración manual siguen
funcionando.

## 11. Diagnóstico rápido

| Síntoma | Causa probable | Solución |
|---|---|---|
| `502 Bad Gateway` | El contenedor `web` no arrancó | `docker compose -f deploy/oracle/compose.yaml logs web` |
| Caddy no obtiene certificado | DNS no apunta a la IP o puerto 80 cerrado | `dig +short TU_DOMINIO`, revisa Security List y `ufw status` |
| `api/health` devuelve 503 | Falta `VIBEMATCH_SECRET` o `/app/data` no es escribible | Revisa `.env` y `docker compose exec web ls -ld /app/data` |
| `api/health` muestra `dataPersistent:false` | `VIBEMATCH_DATA_DIR` apunta fuera del volumen | Elimina esa variable en Oracle; debe usar `/app/data` |
| Puertos 80/443 siguen cerrados con `ufw` activo | Reglas de iptables de la imagen Ubuntu de Oracle | Revisa Security List y `sudo iptables -L INPUT -n`; añade reglas o usa la consola de Oracle |
| Se pierden perfiles al reiniciar | Volumen no montado | `docker compose config` debe mostrar `vibematch_data:/app/data` |
| Error de capacidad al crear A1 | Oracle sin cupo en esa AD | Prueba AD-2/AD-3 o `VM.Standard.E2.1.Micro` |
| La APK no lee NFC | NFC apagado o tarjeta sin NDEF | Activa NFC; usa QR o graba la URL `/a/<token>` en la tarjeta |

## 12. Checklist de producción

- [ ] DNS `A` apunta a la IP reservada.
- [ ] Security List y `ufw` permiten solo 22/80/443.
- [ ] `VIBEMATCH_SECRET` distinto del valor de demo.
- [ ] `VIBEMATCH_COOKIE_SECURE=1` y HTTPS válido.
- [ ] `/api/health` responde `ok: true`.
- [ ] Backup programado y restauración probada.
- [ ] APK firmada con la URL de Oracle y `assetlinks.json` publicado.
- [ ] APK probada en la tablet/lector del piloto (NFC + QR + deep link).
- [ ] Tarjetas NFC/QR impresas con `https://dominio/a/<token>`.
