# Plantillas

[中文](./TEMPLATES.md) · [English](./TEMPLATES.en.md) · **Español** · [Français](./TEMPLATES.fr.md) · [Deutsch](./TEMPLATES.de.md) · [Русский](./TEMPLATES.ru.md) · [日本語](./TEMPLATES.ja.md)

El plugin incluye siete plantillas. Se cambian desde la esquina superior derecha del panel del optimizador; cambiarlas modifica **cómo se reescribe el borrador**, nunca el borrador en sí.

Cada plantilla cubre una faceta distinta del mismo problema:

- **Básicas** — convierten una frase en una tarea completa (task brief, role contract, agent persona);
- **Estructura** — suben los criterios de aceptación al principio (delivery contract);
- **Ejemplos** — fijan estilo y formato con muestras (worked examples);
- **Razonamiento** — fuerzan una ejecución por pasos con puntos de control (reasoning steps);
- **Iteración** — ediciones mínimas sobre una versión existente (incremental edit).

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

## Cómo elegir

| Tu situación | Plantilla |
| --- | --- |
| Una frase que debe convertirse en una tarea completa | Task brief |
| Otra persona va a aceptar el resultado | Delivery contract |
| Tienes muestras y temes que el formato se desvíe | Worked examples |
| Trabajo de varios pasos que tiende a dispersarse | Reasoning steps |
| Casi contento, quieres un cambio pequeño | Incremental edit |

Más plantillas no es mejor: el mismo borrador con plantillas distintas produce estructuras visiblemente distintas. Elige una por defecto y cambia solo cuando cambie el trabajo.
