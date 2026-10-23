# Guion de presentación · VibeMatch

**Duración objetivo:** 8–10 minutos + preguntas.
**Formato:** 17 diapositivas. Las diapositivas 1–5 y 16 son de narrativa; 6–10 muestran producto (concepto de interfaz); 11–15 son la propuesta al colegio; 17 es anexo.

> Regla de oro: no leer la diapositiva. La diapositiva muestra; tú explicas el porqué.

---

## 1 · Portada — "Una tarjeta. Todo el colegio conectado."
**~40 s**

> "VibeMatch nació como una app para que los estudiantes se conecten por sus intereses. Hoy quiero mostrarles una segunda capa: la misma tarjeta que ya identifica al estudiante puede ordenar la asistencia, los permisos y las anotaciones del colegio."

Aclarar de inmediato: la tarjeta de la foto es un prototipo; la app web ya funciona. No leer el subtítulo.

## 2 · El día escolar, hoy
**~60 s**

Tres dolores concretos, no abstractos:

1. La lista corta la clase: 5–8 minutos por bloque, todos los días.
2. El permiso de baño se anota en cualquier parte: sin hora, sin regreso, sin cupo.
3. Las anotaciones viven en cuadernos distintos: nadie ve el patrón completo.

Cerrar con el marco legal: la **Ley 21.801** (vigente el año escolar 2026) prohíbe el celular personal durante la jornada. Eso descarta la solución típica "haz una app para el alumno" y abre la puerta a la tarjeta.

## 3 · La idea
**~45 s**

> "La tarjeta no compite con la app social: la potencia. El mismo gesto que abre un perfil puede abrir la lista del curso, un permiso al baño o una anotación."

Secuencia: **identidad → acción → dato**. Esa es toda la arquitectura. Una tarjeta, muchos usos, un solo registro.

## 4 · Cómo funciona
**~50 s**

Cuatro pasos, en menos de treinta segundos:

1. El estudiante acerca la tarjeta.
2. El lector valida el token (la tarjeta es una **llave**, no un archivador: no lleva datos personales).
3. El sistema registra quién, qué, dónde y cuándo.
4. El dato aparece en el panel del rol que corresponde.

Insistir: el colegio **no** necesita comprar un dispositivo por alumno. Kiosco, PC con lector, PWA o QR.

## 5 · Una plataforma, dos capas
**~50 s**

- **Capa social (ya existe):** acceso por tarjeta, onboarding, perfil, vibe check, zonas, PWA.
- **Capa colegio (lo que proponemos):** asistencia, permisos, anotaciones, panel.

Frase de cierre, clave para privacidad: *"Todos usan la misma tarjeta, pero cada rol ve solo lo suyo. Un estudiante no ve las anotaciones de otro, ni el panel de dirección."*

## 6 · Módulo aula — la lista se toma mientras entran
**~60 s**

Ejemplo narrado: el curso entra, cada tarjeta marca presencia, el profesor ve **28 de 30** y cierra la lista sin preguntar "¿quién falta?".

Honestidad: la pantalla es un **concepto de interfaz**. Hoy está implementado el acceso por tarjeta y el perfil; la asistencia es la siguiente capa. No prometer integración automática con SIGE: primero exportación, después integración.

## 7 · Módulo convivencia — permisos al baño
**~50 s**

El caso del baño parece menor, pero es donde más se pierde trazabilidad y donde ocurren accidentes. La tarjeta hace **dos marcas**: salida y regreso. Inspectoría ve el tiempo transcurrido, los cupos por turno y recibe alerta si alguien se pasa.

Encuadre: el objetivo **no es vigilar**, es saber dónde está un estudiante si hay una emergencia y ordenar la fila. Los datos son solo para personal autorizado.

## 8 · Módulo convivencia — ficha del estudiante
**~55 s**

Dos ideas: **registrar rápido** y **comunicar a tiempo**.

- El profesor elige positiva o negativa, la categoría y una frase.
- Se guarda quién y cuándo.
- El apoderado recibe el aviso el mismo día, no semanas después.
- Lo positivo pesa igual que lo negativo: no es un libro de castigos.

Cierre: la ficha es un historial para **acompañar**, no una etiqueta permanente.

## 9 · Panel del colegio
**~45 s**

Es el tablero de dirección e inspectoría, no de estudiantes. Muestra el pulso del día: asistencia, permisos activos, anotaciones y alertas.

> "La idea es pasar de enterarse a fin de mes a resolver hoy."

Reportes exportables para consejo de profesores o superintendencia. La vista por curso compara sin exponer nombres.

## 10 · Decisión de producto — por qué NFC y no celular
**~50 s**

No estamos en contra del celular: leemos la realidad legal y práctica del colegio.

| | NFC | Celular | Huella |
|---|---|---|---|
| Batería / notificaciones | no | sí | no |
| Dato biométrico | no | no | sí |
| Costo por alumno | bajo | alto | alto |

La comparación no es "NFC es mejor que una app" en abstracto: es mejor **para este contexto escolar**.

## 11 · Privacidad y seguridad
**~55 s**

Si alguien pregunta "¿esto no es vigilancia?", esta es la respuesta:

- Sin GPS, sin cámara, sin huella.
- La tarjeta solo prueba que la persona está frente al lector.
- Los datos personales están en el servidor, no en la tarjeta.
- Cada rol ve una parte (estudiante / profesor / inspectoría / dirección).
- El **colegio es el responsable** de los datos; VibeMatch es el **encargado del tratamiento**.
- Retención y consentimiento se definen con el colegio.

## 12 · Impacto esperado
**~40 s**

Decir explícitamente que las cifras son **estimaciones con supuestos** y que el piloto las va a medir. Lo seguro es el cambio cualitativo: la lista deja de cortar la clase, el permiso deja de ser un papel suelto, el apoderado recibe información el mismo día.

## 13 · Plan de implementación — piloto de 6 semanas
**~45 s**

No es "probemos todo el colegio". Es **un curso, seis semanas, métricas claras**:

1. Semana 1: conversación con dirección, inspectoría y profesor. No se instala nada.
2. Semana 2: asistencia.
3. Semana 3: baño y anotaciones.
4. Semanas 4–6: uso real y medición.
5. Cierre: reporte con tiempos, uso y satisfacción → escalar o corregir.

## 14 · Qué recibe el colegio
**~40 s**

El kit baja la barrera de entrada: tarjetas programadas, punto de acceso, panel y capacitación. Nada que diseñar.

Y el detalle que conecta con el ADN del proyecto: **economía circular**. Recuperamos tarjetas tipo Bip! en desuso, las sanitizamos y reprogramamos. Menos costo por estudiante y menos basura electrónica.

## 15 · Estado del proyecto
**~45 s**

Esta diapositiva da credibilidad: no es una idea en una servilleta. Ya existe la web con tarjeta, el onboarding, los perfiles y la PWA.

Si preguntan "¿esto ya funciona?": **la base sí**; la gestión escolar es exactamente el piloto que queremos hacer con el colegio.

## 16 · Cierre — "Que la tarjeta abra algo más que una puerta."
**~30 s**

> "Que abra la asistencia, el permiso, la anotación y la conversación. Todo con un gesto, sin celular personal."

Pedido concreto: **un piloto con un curso** y una reunión con dirección e inspectoría. Agradecer y dejar un silencio breve antes de las preguntas.

## 17 · Anexo — preguntas frecuentes
**Solo si hay preguntas.** Responder en una frase y ofrecer profundizar después.

- **¿Es vigilancia?** No: no hay GPS ni cámara; la tarjeta solo prueba presencia frente al lector.
- **¿Y si el alumno pierde la tarjeta?** Se bloquea y se reemite, igual que una tarjeta bancaria.
- **¿Reemplaza al libro de clases?** No: lo alimenta y exporta. La integración con SIGE es una fase posterior.
- **¿Cuánto cuesta?** El piloto se cotiza por cursos y cantidad de tarjetas; el modelo busca ser accesible reutilizando tarjetas.
- **¿Y los apoderados?** Reciben avisos el mismo día y pueden consultar el historial de su hijo.

---

## Anexo técnico para el presentador

- **Token:** identificador opaco; los datos viven en el servidor.
- **Canales:** kiosco, PC con lector USB, PWA en tablet, QR como respaldo.
- **Roles:** estudiante, profesor, inspectoría, dirección, apoderado.
- **Ley 21.801:** prohíbe el celular personal en la jornada → la tarjeta es la vía compatible.
- **Nunca prometer:** integración automática con SIGE, cifras de impacto no medidas, huella digital.
