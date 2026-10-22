# Acceso por tarjeta y diseño para la Ley 21.801

> Estado: flujo web implementado (MVP). Documento de arquitectura y operación.
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
- La sesión queda en el equipo por un máximo de 8 horas; el kiosco debe limpiar la
  sesión al reiniciar o al pasar un tiempo de inactividad.
- No se piden datos personales en el kiosco ni se muestran tokens en pantalla.

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

## 4. Flujo implementado en la web

1. La tarjeta abre `GET /a/<token>`.
2. El servidor valida el token contra `data/cards.json` (solo hashes).
3. Si es válido, muestra una **bienvenida personalizada**: nombre, curso,
   establecimiento y número de tarjeta.
4. Al pulsar **Entrar**, una Server Action vuelve a validar el token, crea una cookie
   de sesión firmada con HMAC-SHA256 y redirige a `/app`.
5. `/app` verifica la cookie y la vigencia de la tarjeta. Si no hay sesión, redirige a
   la portada.
6. **Cerrar sesión** borra la cookie. La sesión expira a las 8 horas.

Propiedades:

- Cookie `vm_session`: `HttpOnly`, `SameSite=Lax`, `Path=/`, `Max-Age=8h`. En HTTPS se
  activa `Secure` con `VIBEMATCH_COOKIE_SECURE=1`.
- El token desaparece de la barra de direcciones después del canje por cookie.
- `robots: noindex` en `/a/*` y `/app`.
- Comparaciones de hashes y firmas con `timingSafeEqual`.
- El registro se lee en cada solicitud, de modo que revocar una tarjeta surte efecto
  de inmediato.

### Registro local (MVP)

`data/cards.json`:

```json
{
  "version": 1,
  "school": "Colegio Superior del Maipo",
  "updatedAt": "2026-10-22T00:00:00.000Z",
  "cards": [
    {
      "id": "VM-0001",
      "tokenHash": "<sha256>",
      "holder": "Maximo",
      "level": "1° Medio",
      "status": "active",
      "createdAt": "2026-10-22T00:00:00.000Z"
    }
  ]
}
```

Generación:

```bash
node scripts/generar-tarjetas.mjs --count=3
node scripts/generar-tarjetas.mjs --append --count=2
node scripts/generar-tarjetas.mjs --force --count=3
```

Los tokens en claro se escriben en `data/tarjetas-demo.csv`, que está en `.gitignore`.
**No subir ese archivo al repositorio.** El registro con hashes sí puede versionarse.

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
- **Datos personales**: el token no lleva PII. El nombre/curso viven en el registro y
  solo se muestran tras validar la tarjeta. Falta definir consentimiento y retención.
- **Producción**: HTTPS obligatorio, secreto fuerte, backups del registro, logs sin
  tokens y base de datos transaccional cuando haya más de un proceso/servidor.

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
- API estable para las apps APK y EXE (ver `docs/plan-apps.md`).
