# Optimizador de prompts

[![npm](https://img.shields.io/npm/v/@minus77/dsh-prompt-optimize?color=3a42d6)](https://www.npmjs.com/package/@minus77/dsh-prompt-optimize) [![license](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

[中文](./README.md) · [English](./README_en.md) · **Español** · [Français](./README_fr.md) · [Deutsch](./README_de.md) · [Русский](./README_ru.md) · [日本語](./README_ja.md)

Un plugin de DeepSeek Harness que convierte el borrador aproximado de tu compositor en un prompt que de verdad puedes usar. Revisas un diff línea a línea antes de que sustituya nada, puedes deshacer durante nueve segundos después, y guarda un historial local con comparación de versiones y una biblioteca de plantillas reutilizables.

Para saber qué plantilla elegir y para qué sirve cada una, consulta la [guía de plantillas](./docs/TEMPLATES.es.md).

![Panel del optimizador](./docs/screenshots/02-panel.png)

## Por qué

La mayoría de los prompts que “no funcionan” no son un problema del modelo, sino del borrador: el encargo está, pero faltan los materiales, el entregable y los límites. Este plugin cubre ese hueco **sin salir del compositor**, y deja que el diff y la ventana de deshacer decidan si puede tocar tus palabras.

- **Sin cambio de contexto**: un botón en la barra del compositor abre un panel justo encima.
- **Revisable**: un diff por líneas muestra qué cambia antes de que se escriba nada de vuelta.
- **Reversible**: nueve segundos de deshacer tras el reemplazo.
- **Iterable**: pide un cambio sobre el resultado; solo se mueve esa parte.
- **Local**: el historial se queda en esta máquina y es opcional.

## Funciones

| Capacidad | Detalle |
| --- | --- |
| Reescritura automática | Abrir el panel lanza una pasada automática; vuelve a lanzarla si cambia el borrador |
| Streaming | El texto llega de forma incremental, se puede detener y nunca bloquea el compositor |
| Diff por líneas | Filas `-` / `+` antes de reemplazar, con los tramos sin cambios plegados |
| Deshacer en 9 s | Barra de deshacer después de reemplazar, que caduca sola |
| Historial | Últimas 50 ejecuciones, agrupadas en cadenas de versiones; reproducir / comparar / borrar |
| Comparar | Dos columnas y un resumen local de la estructura a nivel de línea |
| Marcadores | Extrae hasta 5 fragmentos reutilizables como variables `{{snake_case}}` |
| Plantillas | 7 integradas, agrupadas como básicas / estructura / ejemplos / razonamiento / iteración |
| Fijar modelo | Sigue el modelo de la sesión o fija uno solo para este panel |
| Interfaz bilingüe (zh/en) | Sigue el idioma de la aplicación automáticamente |
| Privacidad | Historial desactivado por defecto; si se activa, se queda en `localStorage` |

## Instalación

Requiere DeepSeek Harness `>= 0.1.7-0` y Node.js `>= 18`.

### 1. Instalar desde npm (recomendado)

```bash
dsh plugin --profile web add @minus77/dsh-prompt-optimize
```

Eso descarga el paquete publicado ([npm](https://www.npmjs.com/package/@minus77/dsh-prompt-optimize) / [release](https://github.com/Minus77/dsh-prompt-optimize/releases)); después continúa con el paso 2.

<details>
<summary>Instalación sin conexión: desde el código fuente o el tarball de la release</summary>

```bash
git clone https://github.com/Minus77/dsh-prompt-optimize.git
cd dsh-prompt-optimize
npm pack          # produces minus77-dsh-prompt-optimize-0.1.0.tgz
dsh plugin --profile web add file:$PWD/minus77-dsh-prompt-optimize-0.1.0.tgz
```

</details>

### 2. Cárgalo en ese perfil

Edita `~/.dsh/profiles/<profile>/package.json` y añade el paquete a `dsh.profile.bundles`:

```json
{
  "dsh": {
    "profile": {
      "bundles": [
        "@deepseek-ai/dsh-base",
        "@deepseek-ai/dsh-web-app",
        "@minus77/dsh-prompt-optimize"
      ]
    }
  }
}
```

Reinicia ese perfil (`dsh --profile <profile>`); el botón “Prompt optimizer” aparece a la derecha del compositor.

> Si instalas con `install_bundle` de `plugin_manager` contra este repositorio, hace los dos pasos por ti: sin editar JSON.

### Desarrollo local

```bash
npm test                                   # 21 unit tests, no network
dsh plugin --profile dev add file:$PWD     # symlinked; restart to pick up edits
```

## Uso

### Abrir

Escribe un borrador y pulsa el botón a la derecha del compositor.

![Entrada](./docs/screenshots/01-entry.png)

El panel se abre encima del compositor y empieza a reescribir. La primera vez pregunta si quieres guardar el historial; la respuesta se recuerda.

### Revisar y reemplazar

Cuando termina el streaming, pulsa “Replace draft” para ver primero el diff:

![Revisión del diff](./docs/screenshots/04-diff.png)

Al confirmar, el borrador se sustituye y aparece una barra de deshacer durante nueve segundos:

![Deshacer](./docs/screenshots/05-undo.png)

### Marcadores

Pulsa el botón de llaves sobre el resultado. El modelo encuentra hasta cinco fragmentos reutilizables y los reescribe como `{{variables}}`:

![Marcadores](./docs/screenshots/03-variables.png)

El botón “Write back” lleva la versión parametrizada al compositor, así que reutilizar solo implica cambiar valores.

### Iterate

Cambia a “Iterate” y describe un solo cambio, por ejemplo “haz el tono más ligero y reduce la lista de pendientes a tres líneas”. Solo se mueven los pasajes relevantes:

![Iterar](./docs/screenshots/08-iterate.png)

### Historial y comparación

El botón del reloj abre el historial. Cada fila muestra la versión, la plantilla y la diferencia de caracteres, y se despliega para copiar, restaurar, comparar o borrar:

![Historial](./docs/screenshots/06-history.png)

![Comparación](./docs/screenshots/07-compare.png)

### Interfaz en chino

Con una configuración regional china, el mismo panel, las plantillas y los botones aparecen traducidos:

![Interfaz en chino](./docs/screenshots/02-panel.png)

## Plantillas

Siete plantillas integradas, agrupadas por intención. Las descripciones completas están en [docs/TEMPLATES.es.md](./docs/TEMPLATES.es.md).

| Plantilla | Modo | Grupo | Úsala para |
| --- | --- | --- | --- |
| Task brief | Prompt | Básica | La mayoría de borradores del tipo “ayúdame con X” |
| Delivery contract | Prompt | Estructura | Trabajo con criterios de aceptación explícitos |
| Worked examples | Prompt | Ejemplos | Estilo o formato fijado con muestras |
| Reasoning steps | Prompt | Razonamiento | Análisis de varios pasos con puntos de control |
| Role contract | System | Básica | Restricciones de rol que duran mucho tiempo |
| Agent persona | System | Básica | Voz y hábitos de criterio |
| Incremental edit | Iterate | Iteración | Cambios pequeños sobre una versión |

Las plantillas se pueden cambiar dentro del panel; el pie ofrece entonces “rerun with new template” en lugar de sobrescribir en silencio el resultado actual.

## Atajos

| Acción | Tecla |
| --- | --- |
| Ejecutar / volver a ejecutar | `⌘ Enter` (`Ctrl Enter` en Windows/Linux) |
| Cerrar | `Esc` (menú → revisión del diff → panel) |
| Detener | “Stop” en el panel |

## Privacidad

- El historial está desactivado por defecto; si lo activas, solo se escribe en el `localStorage` del navegador.
- El plugin envía al modelo actual el borrador en curso, la nota de iteración y el contenido de la plantilla; nunca tu historial.
- Desactivar el historial conserva las filas existentes; “Clear” las borra.
- Fijar un modelo solo afecta a las peticiones de este plugin, no al modelo por defecto de la sesión.

## Límites conocidos

- Solo texto: de momento no se aceptan imágenes adjuntas como entrada para reescribir.
- 60.000 caracteres por borrador; como máximo 5 variables extraídas.
- Las plantillas de system prompt existen en la API, pero el panel solo expone Prompt e Iterate.
- Se necesita un modelo por defecto; el panel lo indica con claridad en lugar de fallar en silencio.

## Desarrollo

```
src/spec.js          template metadata and queries
src/prompts.js       prompt construction per template
src/placeholders.js  variable parsing, anchoring and application
src/catalog.js       model and template catalog
src/index.js         host routes (models / optimize / variables)
src/web.js           client panel (React + theme tokens)
test/                node:test unit tests
```

- Pruebas: `npm test`
- ESM, sin paso de compilación y sin JSX en el cliente; todos los colores vienen de los tokens `--dsw-alias-*`.
- Rutas del host: `GET /prompt-optimize/models`, `POST /prompt-optimize/optimize` (NDJSON), `POST /prompt-optimize/variables`.

## Licencia

MIT. Las capturas se tomaron de una instancia real en ejecución en esta máquina.
