# Acceso por tarjeta y diseño para la Ley 21.801

> Estado: flujo web con tarjeta, onboarding de perfil y PWA instalable implementados (MVP).
> Documento de arquitectura y operación.
> Última actualización: 22 de octubre de 2026.

## 1. Marco legal que condiciona el producto

La **Ley N.° 21.801** modifica la Ley General de Educación para prohibir y regular
el uso de dispositivos móviles electrónicos de comunicación personal en
establecimientos de educación parvularia, básica y media.

Puntos relevantes para VibeMatch:

- Fue publicada el **11 de febrero de 2026** y rige desde el **inicio del año escolar 2026**.
- La prohibición cubre la **jornada escolar**, no solo la sala de clases. El Mineduc
  orienta a regular también recreos, almuerzo y actividades extracurriculares.
- La ley habla de **dispositivos personales** de los estudiantes. El Mineduc precisó
  que los **dispositivos institucionales destinados al uso pedagógico quedan fuera**
  del ámbito de esta regulación.
- Existen excepciones taxativas: necesidades educativas especiales, emergencia o
  catástrofe, monitoreo de salud, uso pedagógico en básica/media y seguridad personal
  o familiar. Varias requieren autorización del director.
- En **enseñanza media**, el reglamento interno puede autorizar espacios, horarios o
  actividades específicas.
- Los establecimientos deben actualizar sus reglamentos internos; el plazo informado
  por el Mineduc es el **30 de junio de 2026**.

Fuentes:

- Ley 21.801, Biblioteca del Congreso Nacional:
  <https://www.bcn.cl/leychile/navegar?idNorma=1221284>
- Orientaciones del Mineduc (febrero de 2026):
  <https://modoaula.mineduc.gob.cl/assets/pdf/Orientaciones_para_la_prohibicion_y_regulacion_de_dispositivos_moviles.pdf>
- Ayuda Mineduc — Modo Aula (preguntas frecuentes):
  <https://www.ayudamineduc.cl/ficha/modo-aula-regulacion-del-uso-de-dispositivos-moviles-en-establecimientos-educacionales>
- Circular N.° 181/2026 de la Superintendencia de Educación (instrucciones sobre el uso de dispositivos móviles).

> Este documento no es asesoría legal. Cada colegio debe validar su implementación
> con su reglamento interno y la Superintendencia de Educación.

## 2. Decisión de producto

**VibeMatch no depende del celular personal del estudiante.** La identidad física es
una tarjeta con un token único; los puntos de acceso son equipos del establecimiento.
El celular puede seguir existiendo como canal opcional fuera de la jornada o en
contextos autorizados, pero no es requisito para usar el producto en el colegio.

Consecuencias:

- No se diseña ninguna experiencia que obligue a "acercar el celular" a otra tarjeta.
- El QR se imprime en la tarjeta y se escanea desde un equipo institucional.
- La sesión se abre en el navegador del equipo y se cierra al terminar.
- Las tablets personales no se asumen; si se usan tablets institucionales, deben estar
  autorizadas por el reglamento y supervisadas.

## 3. Canales de acceso

### 3.1 Punto Vibe (kiosco)

Equipo dedicado en biblioteca, patio cubierto, inspectoría o hall:

- Tablet Android o mini PC con navegador en modo kiosco.
- Lector NFC USB (ACR122U, PN532) o NFC integrado en la tablet.
- Pantalla de bienvenida y un botón grande para iniciar.
- Al acercar la tarjeta se abre `/a/<token>`, se muestra la bienvenida y la persona
  pulsa **Entrar**.
- La primera vez que se usa una tarjeta guest se pide completar el perfil. El perfil
  queda guardado en el servidor y se reutiliza en las siguientes entradas.
- La sesión queda en el equipo por un máximo de 8 horas; el kiosco debe limpiar la
  sesión al reiniciar o al pasar un tiempo de inactividad.
- El kiosco no muestra tokens en pantalla. En un equipo compartido, la persona debe
  usar **Cerrar sesión** al terminar y no debe editar el perfil de otra persona.
- Pendiente de endurecimiento: modo kiosco con expiración corta, ocultamiento de datos
  sensibles y limpieza automática entre usuarios.

### 3.2 Laboratorio y computadores del colegio

- Navegador en los PCs del laboratorio, con lector NFC USB.
- La futura app de escritorio (`.exe`) reutiliza el mismo flujo y añade integración
  nativa con el lector.
- Sesión compartida: botón **Cerrar sesión** visible y advertencia de dispositivo
  compartido.
- El acceso puede funcionar en la intranet del colegio si el servidor se despliega
  localmente.

### 3.3 Tarjeta única + QR

- Tarjeta NFC NTAG213/215 con un registro NDEF de tipo URL:
  `https://<dominio>/a/<token>`.
- El mismo token se imprime como QR en la tarjeta y en el sobre del pack.
- Token de 256 bits en Base64URL (43 caracteres). No contiene nombre, curso ni RUT.
- En el servidor solo se guarda el **SHA-256** del token. El token en claro se entrega
  una vez al imprimir la tarjeta.
- Si se pierde o filtra una tarjeta, se marca `revoked` en el registro y se emite una
  nueva. Las tarjetas no se reutilizan.

### 3.4 Tablets institucionales

Solo como complemento y si el reglamento interno lo permite. El flujo puede abrirse en
el navegador de la tablet; no se requiere instalar la APK para el uso escolar básico.

### 3.5 Web app instalable (PWA)

La web es instalable como app en iPhone, iPad, Mac, Android y Windows. No reemplaza a
las apps nativas, pero permite tener VibeMatch en pantalla de inicio o Dock sin tienda
de aplicaciones:

- `src/app/manifest.ts` define nombre, colores, `start_url: /app` e iconos.
- `public/sw.js` cachea solo recursos estáticos (`/_next/static/`, iconos y marca).
  **No cachea HTML privado ni respuestas de `/app`**, para no mezclar sesiones.
- `public/icons/` contiene iconos 192, 512, maskable y Apple Touch.
- La página `/app/instalar` solo se muestra con sesión y perfil completo.
- Requiere HTTPS o `localhost`. En iPhone/iPad se instala desde Safari → Compartir →
  Añadir a pantalla de inicio; en Mac, Safari puede añadirla al Dock.
- La instalación es opcional: el flujo escolar sigue funcionando en el navegador del
  equipo institucional sin instalar nada.

## 4. Flujo implementado en la web

### 4.1 Entrada según el tipo de token

1. La tarjeta personal abre `GET /a/<token>`.
2. El servidor valida el token contra `data/cards.json` (solo hashes) y distingue dos
   tipos de tarjeta:
   - `personal`: muestra la bienvenida de la tarjeta.
   - `public`: muestra la landing pública con los contactos para solicitar el kit.
     Este token **nunca** crea sesión ni pide perfil.
3. `/` sin token no muestra la landing: devuelve un error de acceso. La landing solo se
   alcanza con el token público.
4. Un token inválido, revocado o incompleto muestra una página de acceso no válido.

### 4.2 Primer ingreso y perfil

1. En la bienvenida personal, **Entrar** envía el token a una Server Action.
2. La acción vuelve a validar el token, crea una cookie de sesión HMAC-SHA256 y redirige
   a `/app`.
3. `/app` verifica la cookie y la vigencia de la tarjeta. Sin sesión redirige a `/`.
4. Si la tarjeta no tiene perfil, `/app` muestra el onboarding: nombre preferido,
   pronombres, curso, vibe, intereses, descripción opcional y consentimiento.
5. Al guardar, el perfil se persiste en `data/profiles.json`, asociado al `cardId`.
   `/app/perfil` permite editarlo; `/privacidad` explica el tratamiento de datos.
6. Con perfil, `/app` muestra el dashboard, las zonas de interés y el acceso a
   `/app/instalar`.
7. **Cerrar sesión** borra la cookie. La sesión expira a las 8 horas.

Propiedades:

- Cookie `vm_session`: `HttpOnly`, `SameSite=Lax`, `Path=/`, `Max-Age=8h`. En HTTPS se
  activa `Secure` con `VIBEMATCH_COOKIE_SECURE=1`.
- El token desaparece de la barra de direcciones después del canje por cookie.
- `robots: noindex` en `/a/*`, `/app` y `/privacidad`.
- Comparaciones de hashes y firmas con `timingSafeEqual`.
- El registro de tarjetas se lee en cada solicitud, de modo que revocar una tarjeta
  surte efecto de inmediato.
- La escritura de perfiles es atómica (archivo temporal + rename) y está centralizada
  en `src/lib/profiles.ts`.
- La sesión se valida contra la tarjeta en cada solicitud; si la tarjeta se revoca, la
  sesión deja de ser válida.

### 4.3 Tarjetas guest y token público

El generador crea tres tipos de registros:

- **Demo:** tarjetas con nombre y curso, útiles para pruebas.
- **Guest:** 100 tarjetas personales sin nombre (`VM-G0001`…`VM-G0100`). La persona
  completa su perfil en el primer ingreso. Los tokens son únicos.
- **Público:** una tarjeta `VM-PUBLIC` con `kind: "public"` y el token
  `vibematch-acceso-publico-2026`, que abre la landing y los contactos.

### Registro local (MVP)

`data/cards.json`:

```json
{
  "version": 1,
  "school": "Colegio Superior del Maipo",
  "updatedAt": "2026-10-22T00:00:00.000Z",
  "cards": [
    {
      "id": "VM-G0001",
      "tokenHash": "<sha256>",
      "holder": null,
      "level": null,
      "kind": "personal",
      "status": "active",
      "createdAt": "2026-10-22T00:00:00.000Z"
    },
    {
      "id": "VM-PUBLIC",
      "tokenHash": "<sha256>",
      "holder": "Acceso público",
      "level": null,
      "kind": "public",
      "status": "active",
      "createdAt": "2026-10-22T00:00:00.000Z"
    }
  ]
}
```

`data/profiles.json` (ignorado por Git):

```json
{
  "version": 1,
  "profiles": [
    {
      "cardId": "VM-G0001",
      "displayName": "Camila",
      "pronouns": "ella",
      "level": "1° Medio",
      "vibe": "busco-equipo",
      "interests": ["Arte", "Música", "Tecnología"],
      "bio": "Me gusta dibujar y armar playlists.",
      "consentAt": "2026-10-22T00:00:00.000Z",
      "createdAt": "2026-10-22T00:00:00.000Z",
      "updatedAt": "2026-10-22T00:00:00.000Z"
    }
  ]
}
```

Generación:

```bash
# 100 tarjetas guest sin nombre
node scripts/generar-tarjetas.mjs --append --guest --count=100 --quiet

# Token genérico de la landing pública
node scripts/generar-tarjetas.mjs --append --public --quiet

# Tarjetas demo o reinserción controlada
node scripts/generar-tarjetas.mjs --count=3
node scripts/generar-tarjetas.mjs --append --count=2
node scripts/generar-tarjetas.mjs --force --count=3
```

Los tokens en claro se escriben en `data/tarjetas-demo.csv`, que está en `.gitignore`.
**No subir ese archivo al repositorio.** El registro con hashes sí puede versionarse.
El token público es intencionalmente conocido y no da acceso a perfiles.

### Variables de entorno

| Variable | Uso |
|---|---|
| `VIBEMATCH_SECRET` | Secreto HMAC para firmar la cookie. Obligatorio en producción. |
| `VIBEMATCH_COOKIE_SECURE=1` | Activa `Secure` en la cookie cuando se sirve por HTTPS. |
| `BASE_URL` | Dominio usado por el generador para imprimir las URLs. |
| `SCHOOL_NAME` | Nombre del establecimiento al generar tarjetas. |

## 5. Seguridad y privacidad

Riesgos y mitigaciones:

- **Token en la URL**: puede quedar en historial, logs del servidor o capturas. Se
  mitiga canjeándolo por cookie y evitando registrarlo en analítica/logs. Aun así, un
  token filtrado permite entrar: trátese como una llave física.
- **Fuerza bruta**: el MVP no incluye rate limiting. Antes de exponerlo a internet hay
  que añadirlo en el proxy o en el servidor.
- **Reutilización en equipo compartido**: sesión de 8 horas, cierre visible y aviso de
  dispositivo compartido. Para kioscos, reducir a 15–30 minutos y limpiar al reiniciar.
- **Revocación**: borrar o marcar la tarjeta como `revoked`; las sesiones existentes
  dejan de ser válidas en la siguiente solicitud.
- **Datos personales**: el token no lleva PII. El perfil (nombre preferido, pronombres,
  curso, intereses y bio) se guarda en `data/profiles.json`, ignorado por Git, y solo se
  muestra tras validar la tarjeta. El onboarding exige consentimiento; falta definir
  retención, borrado, cifrado en reposo y migración a base de datos.
- **Producción**: HTTPS obligatorio, secreto fuerte, backups del registro y de los
  perfiles, permisos de archivo restringidos, logs sin tokens ni PII y base de datos
  transaccional cuando haya más de un proceso/servidor.

## 6. Operación escolar sugerida

1. Definir con el colegio los puntos de acceso y quién los supervisa.
2. Generar tarjetas por curso; imprimir QR y grabar el NDEF de NFC.
3. Entregar el pack junto con una explicación del uso y del reglamento interno.
4. Probar un Punto Vibe piloto durante una semana.
5. Definir protocolo de pérdida/robo: revocar, emitir reemplazo y registrar.
6. Capacitar a inspectoría/convivencia en el panel de administración (pendiente).
7. Revisar el reglamento interno: espacios, horarios y excepciones aplicables.

## 7. Pendientes técnicos

- Migrar de JSON a base de datos (SQLite o PostgreSQL) con transacciones.
- Panel de administración para alta, revocación y reimpresión de tarjetas.
- Rate limiting y auditoría de accesos.
- Sesión de kiosco con expiración corta y limpieza automática.
- Endurecer cookies y cabeceras de seguridad.
- API estable de perfiles y sesión para las apps APK y EXE (ver `docs/plan-apps.md`).
- Política de retención, exportación y eliminación de perfiles; versionar el consentimiento.
- Cifrado en reposo o base de datos administrada para los perfiles.
- Pruebas automatizadas del onboarding, edición de perfil y gating de la instalación.
