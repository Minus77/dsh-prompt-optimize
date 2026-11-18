# Plantillas

[中文](./TEMPLATES.md) · [English](./TEMPLATES.en.md) · **Español** · [Français](./TEMPLATES.fr.md) · [Deutsch](./TEMPLATES.de.md) · [Русский](./TEMPLATES.ru.md) · [日本語](./TEMPLATES.ja.md)

El plugin incluye quince plantillas. Se cambian desde la esquina superior derecha del panel del optimizador; cambiarlas modifica **cómo se reescribe el borrador**, nunca el borrador en sí.

Cada plantilla cubre una faceta distinta del mismo problema:

- **Básicas** — convierten una frase en una tarea completa (task brief, role contract, agent persona);
- **Estructura**: los criterios de aceptación o el esquema objetivo van delante (contrato de entrega, extracción estructurada);
- **Ejemplos** — fijan estilo y formato con muestras (worked examples);
- **Razonamiento**: pasos y comprobaciones intermedias, o responder solo con el material dado (pasos de razonamiento, preguntas con base);
- **Iteración** — ediciones mínimas sobre una versión existente (incremental edit).

La última opción del menú crea una **plantilla propia**: tu instrucción de reescritura, guardada en este navegador y transportable en JSON.

---

## Task brief

**Modo**: prompt · **Grupo**: básica · **Por defecto**

La opción generalista. Va bien con borradores que enuncian un objetivo pero no dan detalle: “escríbeme algo”, “échale un vistazo a esto”.

**Estructura de salida**: objetivo / información conocida / entregable / restricciones / formato de salida. Los huecos quedan como `待确认：…` (por confirmar) en lugar de datos inventados.

**Úsala cuando**

- el borrador es una sola frase pero tienes claro lo que quieres;
- una petición hablada tiene que convertirse en algo que otra persona pueda ejecutar;
- quieres un prompt enviable sin añadir contexto a mano.

**Evítala cuando**

- el requisito ya trae criterios de aceptación estrictos (usa delivery contract);
- el estilo pesa más que la estructura y solo los ejemplos pueden transmitirlo (usa worked examples).

**Ejemplo**

> Borrador: escribe una nota de lanzamiento de nuestra nueva versión, que sale el viernes, para los usuarios actuales

Se convierte más o menos en:

```
Goal: a launch announcement for existing users about the release shipping this Friday.
Known: ships Friday; readers already use the product, so no from-scratch intro.
Deliverable: publishable Chinese note, under 300 characters.
Constraints: no overclaiming, no promises about unreleased features, no pricing.
Format: headline + three paragraphs + one call to action.
To confirm: what is the headline feature of this release?
```

---

## Delivery contract

**Modo**: prompt · **Grupo**: estructura

Pone por delante “qué cuenta como terminado”. Va bien para trabajo que se va a revisar varias veces: documentación, informes, cambios de código, limpieza de datos.

**Estructura de salida**: tarea / entrada / especificación de salida / criterios de aceptación (3–6 puntos comprobables) / límites y excepciones / prohibiciones.

**Úsala cuando**

- otra persona va a comprobar el resultado;
- intentos anteriores rebotaron porque el criterio nunca se puso por escrito;
- quieres que el modelo pida el material que falta en lugar de adivinar.

**Evítala cuando**

- la tarea es exploratoria y el criterio aún no se conoce;
- bastaría con una petición de una línea: un contrato solo añade peso.

**Ejemplo**

> Borrador: convierte este informe semanal en un resumen de una página para mi jefe

La reescritura añade: qué informe es la entrada, los campos y el orden de la página única, los criterios de aceptación (conclusión primero, cada afirmación respaldada por un número, sin siglas sin explicar) y qué hacer si se alarga.

---

## Worked examples

**Modo**: prompt · **Grupo**: ejemplos

Para cuando dos ejemplos valen más que un párrafo de adjetivos. Los modelos imitan el formato mucho mejor de lo que interpretan “hazlo más profesional”.

**Estructura de salida**: tarea y alcance → 2–3 pares de entrada → salida esperada → reglas para entradas fuera de los ejemplos → una nota de que las muestras son ilustrativas.

**Úsala cuando**

- el formato es estricto: columnas de tabla, tono de voz, estilo de código;
- ya tienes dos o tres muestras del tipo “escríbelo así”;
- importa más la cobertura que repetir un solo caso.

**Evítala cuando**

- el borrador no da pie a ninguna muestra: los ejemplos inventados engañan;
- el trabajo es abierto y creativo.

---

## Reasoning steps

**Modo**: prompt · **Grupo**: razonamiento

Divide la tarea en pasos ejecutables e indica dónde hacer una comprobación propia y dónde retroceder.

**Estructura de salida**: objetivo reformulado → 3–7 pasos (entrada / acción / señal de terminado) → puntos de control → gestión de fallos → formato de entrega.

**Úsala cuando**

- análisis de varios pasos, depuración o comparación de opciones;
- los resultados intermedios necesitan una revisión humana;
- ejecuciones anteriores se fueron hasta el final por el camino equivocado.

**Evítala cuando**

- la tarea es un solo paso;
- el trabajo requiere creatividad libre.

---

## Role contract

**Modo**: system prompt · **Grupo**: básica

Convierte una línea de descripción de rol en un system prompt que un agente puede seguir durante mucho tiempo. El panel todavía no expone el modo system; usa `POST /prompt-optimize/optimize` con `optimizationMode: "system"`.

**Estructura de salida**: identidad / responsabilidades / flujo de trabajo / límites / acuerdo de salida.

**Úsala cuando**

- el mismo rol se reutiliza en varias sesiones;
- el rol necesita criterios de juicio, no solo un título.

**Evítala cuando**

- necesitas un prompt de tarea puntual.

---

## Agent persona

**Modo**: system prompt · **Grupo**: básica

Redacta un archivo que se lee como una persona: cómo habla, cómo decide, qué ofrece por iniciativa propia, qué no hace nunca, más una respuesta de ejemplo.

**Úsala cuando**

- el asistente necesita una voz y un carácter estables;
- quieres una persona, no una descripción de puesto.

**Evítala cuando**

- la redacción de cumplimiento debe mantenerse estricta; el texto de persona estorba.

---

## Incremental edit

**Modo**: iterate · **Grupo**: iteración

Aplica una nota de cambio al resultado anterior con el mínimo movimiento: solo cambian las partes mencionadas y todo lo demás se conserva tal cual.

**Estructura de salida**: el prompt completo (no un diff). Cuando la nota entra en conflicto con el texto, gana la nota.

**Úsala cuando**

- el resultado está bien en lo esencial y quieres ajustar el tono, la longitud o un pasaje;
- una nota vaga como “hazlo más formal” tiene que aterrizar en algo concreto.

**Evítala cuando**

- el rumbo es equivocado: una ejecución nueva es más rápida que operar frase por frase.

**Ejemplo**

> Nota: tono más ligero y reduce la larga lista de “por confirmar” a tres líneas

Solo cambian las frases relacionadas con el tono y esa lista; los títulos, la puntuación y el resto quedan idénticos.

---

## Code review

**Modo**: Prompt · **Grupo**: Ingeniería

Convierte "mira este código" en una revisión acotada y priorizada: para qué es el cambio, qué mirar primero y en qué formato devolverlo.

**Salida**: alcance / prioridades / formato (gravedad, ubicación, problema, impacto, arreglo) / fuera de alcance / evidencia.

**Bien para**: autorrevisión antes de un commit; cambios en varios archivos que pueden romper llamadas.
**No para**: explicar qué hace un código, o implementar el arreglo.

**Ejemplo**

> Borrador: mira este código, ¿hay algo mal?

Pasa a: alcance = los tres archivos del PR que añade idempotencia al checkout; prioridad = corrección > concurrencia > rendimiento > legibilidad; cada hallazgo cita archivo:línea; sin reescribir archivos ni opinar de nombres.

---

## Implementation task

**Modo**: Prompt · **Grupo**: Ingeniería

Completa una petición de código como encargo de ingeniería: objetivo y aceptación, restricciones técnicas, contratos de interfaz, casos límite y forma de entrega. Produce una **descripción de tarea**, no el código.

**Salida**: objetivo y aceptación / restricciones / interfaces / bordes y fallos / entrega / dudas.

**Bien para**: entregar un cambio mediano a un agente o colega; módulos compartidos donde la interfaz se acuerda antes.
**No para**: prototipos exploratorios donde el diseño nace al escribir.

**Ejemplo**

> Borrador: haz la exportación asíncrona para que no bloquee

Pasa a: endpoint de disparo, campo de estado, sondeo o callback, límite de concurrencia, reintentos y tiempo máximo, permisos, cómo se muestra el progreso y qué llamadas existentes hay que cambiar.

---

## SQL query

**Modo**: Prompt · **Grupo**: Ingeniería

Escribe una petición de datos como tarea SQL con definiciones, campos y límites de rendimiento explícitos, y pide listar los supuestos aparte.

**Salida**: tablas y campos / definiciones (tiempo, duplicados, nulos, unidades) / forma del resultado / rendimiento / permisos / supuestos.

**Bien para**: informes y análisis puntuales; métricas ambiguas (activo, retención, GMV).
**No para**: explicar una consulta existente o migrar esquemas.

**Ejemplo**

> Borrador: usuarios nuevos por canal la semana pasada

Pasa a: definición de usuario nuevo, campo de canal y clave de deduplicación, zona horaria y límites exactos de la semana, si cuentan cuentas de prueba, orden y rango de escaneo permitido.

---

## Test design

**Modo**: Prompt · **Grupo**: Ingeniería

Escribe una petición de pruebas como tabla de casos que cubre camino normal, límites, fallos y permisos, con prioridades y qué automatizar primero.

**Salida**: objeto y riesgos / tabla (id, precondiciones, pasos, esperado) / cobertura / prioridad / automatización.

**Bien para**: completar casos antes de publicar; confirmar que un arreglo no rompe nada.
**No para**: pedir scripts directamente, salvo que el borrador lo diga.

**Ejemplo**

> Borrador: escribe casos de prueba para el login

Pasa a: contraseña, SMS y terceros por separado; bloqueo tras N fallos; vacío, muy largo y caracteres especiales; correo sin verificar; diferencias por rol; cada caso numerado y priorizado.

---

## Structured extraction

**Modo**: Prompt · **Grupo**: Estructura

Convierte "saca unos campos de esto" en una extracción guiada por esquema, con JSON estricto y reglas explícitas para lo que falta.

**Salida**: forma de entrada / esquema (nombre, tipo, obligatorio, enum) / reglas de ausencia y conflicto / solo JSON / un ejemplo.

**Bien para**: contratos, correos, tickets o páginas convertidos en datos; lotes que deben entrar en una base de datos.
**No para**: resumir o reescribir contenido; imágenes que necesitan OCR.

**Ejemplo**

> Borrador: saca empresa, contacto e importe de estos correos

Pasa a: empresa del cuerpo o de la firma, contacto con o sin cargo, moneda e impuestos del importe, qué importe gana si hay varios, null si no aparece, solo JSON.

---

## Translation

**Modo**: Prompt · **Grupo**: Redacción

Escribe una petición de traducción como tarea de localización con audiencia, glosario y formato. Lo importante es lo que no se mueve: marcas, campos, marcadores y estructura Markdown.

**Salida**: idioma y región / audiencia y tono / glosario / formato / sin añadir ni quitar.

**Bien para**: textos de producto, ayuda y correo; un mercado concreto donde reescribir gana a traducir literal; textos con `{{variables}}` o bloques de código.
**No para**: textos legales que aún requieren revisión humana.

**Ejemplo**

> Borrador: traduce esto al japonés para un cliente

Pasa a: japonés de negocios para un cliente empresarial; conservar nombres de producto y `{{user_name}}`; conservar títulos y listas Markdown; no añadir ni quitar información; solo la traducción.

---

## Copy polish

**Modo**: Prompt · **Grupo**: Redacción

Escribe una petición de pulido como revisión acotada: hasta dónde puede llegar, qué debe conservarse y sin ampliar. Evita que el modelo añada argumentos, ejemplos o longitud.

**Salida**: registro y lector / profundidad permitida / qué conservar / prohibiciones / texto completo y hasta tres notas.

**Bien para**: borradores correctos pero mal escritos; mantener una sola voz; limitar el cambio a las palabras.
**No para**: contenido al que le falta el argumento.

**Ejemplo**

> Borrador: haz que suene más formal

Pasa a: cuánto de formal (aviso público o correo interno), si se puede reordenar párrafos, qué cifras y conclusiones se conservan literalmente, si se pueden unir frases, y una lista breve de cambios al final.

---

## Grounded Q&A

**Modo**: Prompt · **Grupo**: Razonamiento

Escribe "responde con estos materiales" como tarea con citas y declaración explícita de lo no cubierto; si hay conflicto, pide listar las fuentes antes de juzgar.

**Salida**: alcance del material / reglas de cita / declaración de no cubierto / conflictos / estructura (respuesta, evidencia, huecos).

**Bien para**: responder desde documentación, políticas o contratos; respuestas que deben ser trazables.
**No para**: preguntas sin material en que apoyarse.

**Ejemplo**

> Borrador: según el manual, ¿cómo se calculan las vacaciones?

Pasa a: solo el manual, citando número de cláusula; decir "no cubierto" para lo ausente (por ejemplo, prorrateo al salir); si el manual y un aviso posterior chocan, citar ambos primero y luego juzgar.

---

## Plantillas propias

La última opción del menú es "Nueva plantilla propia", con tres campos:

| Campo | Para qué |
| --- | --- |
| Nombre | Se muestra en el menú; hasta 40 caracteres |
| Instrucción de reescritura | Cómo debe reescribir; hasta 2000 caracteres |
| Aplica a | Una línea sobre qué borradores encajan; opcional |

Viven en el `localStorage` de este navegador y desaparecen con los datos del sitio. Usa la exportación e importación JSON del editor para llevarlas a otra máquina o compartirlas.

---

## Cómo elegir

| Tu situación | Plantilla |
| --- | --- |
| Una frase que debe convertirse en una tarea completa | Task brief |
| Otra persona va a aceptar el resultado | Delivery contract |
| Tienes muestras y temes que el formato se desvíe | Worked examples |
| Trabajo de varios pasos que tiende a dispersarse | Reasoning steps |
| Casi contento, quieres un cambio pequeño | Incremental edit |

Más plantillas no es mejor: el mismo borrador con plantillas distintas produce estructuras visiblemente distintas. Elige una por defecto y cambia solo cuando cambie el trabajo.

Volver al [README principal](./../README_es.md).
