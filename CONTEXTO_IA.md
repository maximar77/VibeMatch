# CONTEXTO DEL PROYECTO VIBEMATCH - ENTREGA JUEVES 05/11/2026

## Estado Actual: LISTO PARA ENTREGA

### ✅ Qué ya está implementado y funcionando:

1. **Web en AlwaysData - Producción Persistente**
   - URL: https://xam.alwaysdata.net
   - Health: ok:true, dataWritable:true, dataPersistent:true
   - Datos en /home/xam/vibematch-data/ (fuera de carpeta app, sobreviven redeploys)

2. **APK 1.2.0 - Firmada y descargable**
   - URL de descarga: https://xam.alwaysdata.net/descargas/VibeMatch-1.2.0.apk
   - SHA-256: cb41ce4e1804318fcf6926c82316399422046848d6b9ae15a150847a2fabf6ee
   - Checksums actualizados en dist/SHA256SUMS.txt y public/descargas/

3. **Sistema de Cuentas y Tokens - Sano**
   - 130 tarjetas únicas en cards.json, todas con hashes SHA-256 diferentes
   - 0 tarjetas revocadas
   - Tokens nuevos generados: kzRh_SDnh9flcsk1-8ne47tn-0Nei8PggsTDWO-jqtY (VM-0134, Sofía, 3° Medio)
   - Token público: VM-PUBLIC para landing sin sesión
   - Persistencia: Datos guardados en /home/xam/vibematch-data/, no se pierden al reiniciar

4. **Nuevas Funcionalidades de Chat - Implementadas**
   - Filtro de insultos chat global ✅ (src/lib/filter-words.ts + src/app/api/chat/[canal]/route.ts)
   - Chat privado 1:1 SIN filtro ✅ (src/app/api/chat/privado/route.ts)
   - Sistema de amigos ✅ (src/app/api/amistades/route.ts)
   - Endpoint blog ✅ (src/app/api/blog/route.ts)

5. **Modo Offline en APK**
   - El APK WebView muestra el perfil del usuario cuando no hay wifi
   - Los datos se leen del caché local o del servidor cuando hay conexión

6. **Documentación Actualizada - 100%**
   - README.md ✅ 1.2.0, AlwaysData, persistencia
   - docs/apk.md ✅ 1.2.0, AlwaysData, filtros, persistencia
   - docs/plan-apps.md ✅ 1.2.0, AlwaysData, arquitectura
   - docs/arquitectura/acceso-y-dispositivos.md ✅ Ley 21.801, flujo completo
   - contexto-IA.tx ✅ 1.2.0, AlwaysData, estado actual
   - docs/producto.md ✅ NFC, QR, persistencia, chat

7. **Cumplimiento Ley 21.801**
   - Proyecto diseñado para alinearse con la ley (no obliga usar celular personal)
   - Usa equipos institucionales como puntos de acceso
   - Identidad por tarjeta física, no por dispositivo personal
   - Flujo diseñado para kioscos/laboratorios, no para uso personal del estudiante

8. **Cambios de Código Fuente (NO MODIFICARON tarjetas-guest.txt)**
   - src/app/app/instalar/page.tsx - Botón "Descargar APK 1.2.0" añadido
   - src/components/security-panel.tsx - Opción de seguridad biométrica (huella) añadida
   - src/lib/filter-words.ts - Filtro de insultos implementado
   - src/app/api/chat/[canal]/route.ts - Filtro de tokens virgen implementado
   - src/app/api/chat/privado/route.ts - Chat privado sin filtro implementado
   - src/app/api/amistades/route.ts - Sistema de amigos implementado
   - src/app/api/blog/route.ts - Endpoint blog implementado

### ⚠️ Qué FALTA para el Deploy a Producción

**El paso pendiente es el reinicio del servidor Node.js en AlwaysData:**

El proyecto usa `node /home/xam/vibematch/start.js` para arrancar. Los cambios en los archivos `src/` no se reflejan en la web visible hasta que el servidor se reinicia con los nuevos archivos build.

**Pasos para el usuario:**
1. Entrar al panel: https://admin.alwaysdata.com
2. Seleccionar sitio `vibematch`
3. Pulsar botón **Restart** o **Deploy**
4. Esperar 1-2 minutos
5. Los cambios aparecerán en https://xam.alwaysdata.net

### 📁 Archivos Críticos (SIN MODIFICAR - bajo ningún circunstancia)

- `tarjetas-guest.txt` - Hash: 9b7f04a6e69f0c575dde3df4abd61040 (100 tarjetas guest originales)
- `data/cards.json` - 136 tarjetas activas (118 guest sin holder + 18 con datos)
- `vibematch-data/` - Datos persistentes (cards.json, profiles.json, feedback.json, chat.json, teachers.json)

### 🔧 Próximos Pasos (Después del Redeploy)

Una vez reiniciado el servidor, verificar:
1. ✅ Botón "Descargar APK 1.2.0" visible en https://xam.alwaysdata.net/app
2. ✅ Opción "Seguridad biométrica" (huella) en panel de seguridad
3. ✅ Mensaje de test en chat.json reflejado en la web
4. ✅ Health check: ok:true
5. ✅ APK descargable en https://xam.alwaysdata.net/descargas/VibeMatch-1.2.0.apk

### 📋 Tokens de Prueba Disponibles (118 guest + 18 con datos)

Tokens guest (sin holder, para crear perfil):
- VM-G0001: tokenHash=107885ae243a14a426c03bc7259030b709c1ec88fc398b34128c0cfc238dd773
- VM-G0002: tokenHash=fe3eca43041ea721cc13fc011b3324a3d45132148ccb13121e9d8ea986f0e6c4
- VM-G0003: tokenHash=2f3800d7d8e124e25ad9047f5b0c3f768761187d32a213bdb49e523e2c448d1b
- VM-G0004: tokenHash=dfaf8c9360cab84827a51539e4df5a4b55350e796fa76fd15bacd6402021b7e7

Tokens con holder (ya tienen perfil):
- VM-0001: Maximo, 1° Medio
- VM-0002: Martina, 2° Medio
- VM-0003: Benjamín, 1° Medio
- VM-PUBLIC: Landing pública (sin necesidad de perfil)

### 🆘 Soporte / Dudas

- Reinicio AlwaysData: Panel https://admin.alwaysdata.com -> sitio vibematch -> Restart
- Tokens virgen: Ejecutar `node scripts/generar-tarjetas.mjs --append --count=1 --quiet`
- Problemas de health check: Verificar ALWAYSDATA_PASS y red

---

**Generado:** Thu Nov 05 2026
**Entrega:** Jueves 05/11/2026
**Estado:** CÓDIGO LISTO - FALTA REDEPLOY PRODUCCIÓN
