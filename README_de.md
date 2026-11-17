# Prompt-Optimizer

[![npm](https://img.shields.io/npm/v/@minus77/dsh-prompt-optimize?color=3a42d6)](https://www.npmjs.com/package/@minus77/dsh-prompt-optimize) [![license](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

[中文](./README.md) · [English](./README_en.md) · [Español](./README_es.md) · [Français](./README_fr.md) · **Deutsch** · [Русский](./README_ru.md) · [日本語](./README_ja.md)

Ein Plugin für DeepSeek Harness, das den groben Entwurf in deinem Eingabefeld zu einem Prompt macht, mit dem du tatsächlich arbeiten kannst. Bevor etwas ersetzt wird, prüfst du einen zeilenweisen Diff; danach hast du neun Sekunden Zeit für ein Undo, und das Plugin führt eine lokale Historie mit Versionsvergleich und eine Bibliothek wiederverwendbarer Vorlagen.

Welche Vorlage du wählst und wofür jede gedacht ist: siehe [Vorlagenanleitung](./docs/TEMPLATES.de.md).

![Optimizer-Panel](./docs/screenshots/02-panel.png)

## Warum

Die meisten Prompts, die „nicht funktionieren“, sind kein Modellproblem, sondern ein Entwurfsproblem: Die Aufgabe ist da, aber Material, Lieferergebnis und Grenzen fehlen. Dieses Plugin schließt diese Lücke, **ohne dass du das Eingabefeld verlässt**, und überlässt es dem Diff und dem Undo-Fenster, ob es deine Formulierungen anfassen darf.

- **Kein Kontextwechsel**: Ein Button am Eingabefeld öffnet ein Panel darüber.
- **Prüfbar**: Ein Zeilen-Diff zeigt die Änderungen, bevor etwas zurückgeschrieben wird.
- **Umkehrbar**: Neun Sekunden Undo nach dem Ersetzen.
- **Iterierbar**: Fordere eine Änderung am Ergebnis an; nur dieser Teil bewegt sich.
- **Lokal**: Die Historie bleibt auf diesem Rechner und ist Opt-in.

## Funktionen

| Funktion | Details |
| --- | --- |
| Automatisches Umschreiben | Beim Öffnen des Panels läuft einmal automatisch ein Durchlauf; nach Änderungen am Entwurf erneut starten |
| Streaming | Der Text erscheint schrittweise, lässt sich stoppen und blockiert das Eingabefeld nie |
| Zeilen-Diff | `-` / `+`-Zeilen vor dem Ersetzen, unveränderte Abschnitte eingeklappt |
| 9-Sekunden-Undo | Undo-Leiste nach dem Ersetzen, verschwindet von selbst |
| Historie | Die letzten 50 Durchläufe, zu Versionsketten gruppiert, wiederherstellen / vergleichen / löschen |
| Vergleich | Zwei Spalten plus eine lokale Zusammenfassung der Struktur auf Zeilenebene |
| Platzhalter | Bis zu 5 wiederverwendbare Fragmente als `{{snake_case}}`-Variablen extrahieren |
| Vorlagen | 7 integrierte Vorlagen, gruppiert als Basic / Structure / Examples / Reasoning / Iterate |
| Modell festlegen | Dem Sitzungsmodell folgen oder eines nur für dieses Panel festlegen |
| Zweisprachige UI (zh/en) | Folgt automatisch der Sprache der App |
| Datenschutz | Historie standardmäßig aus; wenn aktiviert, bleibt sie in `localStorage` |

## Installation

Voraussetzungen: DeepSeek Harness `>= 0.1.7-0` und Node.js `>= 18`.

### 1. Aus npm installieren (empfohlen)

```bash
dsh plugin --profile web add @minus77/dsh-prompt-optimize
```

Damit wird das veröffentlichte Paket installiert ([npm](https://www.npmjs.com/package/@minus77/dsh-prompt-optimize) / [Release](https://github.com/Minus77/dsh-prompt-optimize/releases)); fahre danach mit Schritt 2 fort.

<details>
<summary>Offline-Installation: aus dem Quellcode oder dem Release-Tarball</summary>

```bash
git clone https://github.com/Minus77/dsh-prompt-optimize.git
cd dsh-prompt-optimize
npm pack          # produces minus77-dsh-prompt-optimize-0.1.0.tgz
dsh plugin --profile web add file:$PWD/minus77-dsh-prompt-optimize-0.1.0.tgz
```

</details>

### 2. Im Profil laden

Bearbeite `~/.dsh/profiles/<profile>/package.json` und hänge das Paket an `dsh.profile.bundles` an:

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

Starte das Profil neu (`dsh --profile <profile>`); rechts am Eingabefeld erscheint der Button „Prompt optimizer“.

> Wenn du mit `install_bundle` aus dem `plugin_manager` gegen dieses Repository installierst, erledigen sich beide Schritte von selbst — du musst kein JSON bearbeiten.

### Lokale Entwicklung

```bash
npm test                                   # 21 unit tests, no network
dsh plugin --profile dev add file:$PWD     # symlinked; restart to pick up edits
```

## Verwendung

### Öffnen

Schreibe einen Entwurf und klicke dann auf den Button rechts am Eingabefeld.

![Einstieg](./docs/screenshots/01-entry.png)

Das Panel öffnet sich über dem Eingabefeld und beginnt mit dem Umschreiben. Beim ersten Lauf wirst du gefragt, ob die Historie gespeichert werden soll; die Antwort wird gemerkt.

### Prüfen und ersetzen

Wenn der Stream endet, klicke auf „Replace draft“, um zuerst den Diff zu sehen:

![Diff-Prüfung](./docs/screenshots/04-diff.png)

Nach der Bestätigung wird der Entwurf ersetzt und neun Sekunden lang erscheint eine Undo-Leiste:

![Undo](./docs/screenshots/05-undo.png)

### Platzhalter

Klicke auf die geschweiften Klammern am Ergebnis. Das Modell findet bis zu fünf wiederverwendbare Fragmente und schreibt sie als `{{variables}}` um:

![Platzhalter](./docs/screenshots/03-variables.png)

„Write back“ schreibt die parametrisierte Version zurück ins Eingabefeld, sodass Wiederverwendung nur noch das Ändern von Werten bedeutet.

### Iterieren

Wechsle zu „Iterate“ und beschreibe eine Änderung, z. B. „mach den Ton lockerer und fasse die Liste der offenen Punkte in drei Zeilen zusammen“. Nur die betroffenen Passagen ändern sich:

![Iterieren](./docs/screenshots/08-iterate.png)

### Historie und Vergleich

Der Uhr-Button öffnet die Historie. Jede Zeile zeigt Version, Vorlage und Zeichen-Delta und lässt sich aufklappen, um zu kopieren, wiederherzustellen, zu vergleichen oder zu löschen:

![Historie](./docs/screenshots/06-history.png)

![Vergleich](./docs/screenshots/07-compare.png)

### Chinesische Oberfläche

Bei chinesischer Oberflächensprache sind dasselbe Panel, dieselben Vorlagen und dieselben Buttons lokalisiert:

![Chinesische Oberfläche](./docs/screenshots/02-panel.png)

## Vorlagen

Sieben integrierte Vorlagen, nach Zweck gruppiert. Die vollständigen Beschreibungen stehen in [docs/TEMPLATES.de.md](./docs/TEMPLATES.de.md).

| Vorlage | Modus | Gruppe | Geeignet für |
| --- | --- | --- | --- |
| Task brief | Prompt | Basic | Die meisten Entwürfe der Art „hilf mir, X zu machen“ |
| Delivery contract | Prompt | Structure | Arbeit mit expliziten Abnahmekriterien |
| Worked examples | Prompt | Examples | Stil oder Format, das durch Beispiele festgelegt wird |
| Reasoning steps | Prompt | Reasoning | Mehrstufige Analyse mit Zwischenprüfungen |
| Role contract | System | Basic | Langlebige Rollenvorgaben |
| Agent persona | System | Basic | Tonfall und Urteilsgewohnheiten |
| Incremental edit | Iterate | Iterate | Kleine Änderungen auf einer bestehenden Version |

Vorlagen lassen sich im Panel wechseln; die Fußzeile bietet dann „rerun with new template“ an, statt das aktuelle Ergebnis still zu überschreiben.

## Tastenkürzel

| Aktion | Taste |
| --- | --- |
| Ausführen / erneut ausführen | `⌘ Enter` (`Ctrl Enter` unter Windows/Linux) |
| Schließen | `Esc` (Menü → Diff-Prüfung → Panel) |
| Stoppen | „Stop“ im Panel |

## Datenschutz

- Die Historie ist standardmäßig aus; wenn sie aktiviert ist, wird sie ausschließlich im `localStorage` des Browsers gespeichert.
- Das Plugin sendet den aktuellen Entwurf, die Iterationsnotiz und den Vorlageninhalt an das aktuelle Modell — niemals deine Historie.
- Schaltest du die Historie aus, bleiben bestehende Einträge erhalten; „Clear“ löscht sie.
- Ein festgelegtes Modell betrifft nur die Anfragen dieses Plugins, nicht den Standard der Sitzung.

## Bekannte Grenzen

- Nur Text: Bildanhänge werden noch nicht als Eingabe für das Umschreiben akzeptiert.
- 60.000 Zeichen pro Entwurf; höchstens 5 extrahierte Variablen.
- Vorlagen für System-Prompts gibt es in der API, das Panel zeigt aber nur Prompt und Iterate.
- Ein Standardmodell ist erforderlich; das Panel meldet das klar, statt still zu scheitern.

## Entwicklung

```
src/spec.js          template metadata and queries
src/prompts.js       prompt construction per template
src/placeholders.js  variable parsing, anchoring and application
src/catalog.js       model and template catalog
src/index.js         host routes (models / optimize / variables)
src/web.js           client panel (React + theme tokens)
test/                node:test unit tests
```

- Tests: `npm test`
- ESM, kein Build-Schritt, kein JSX im Client; alle Farben stammen aus `--dsw-alias-*`-Tokens.
- Host-Routen: `GET /prompt-optimize/models`, `POST /prompt-optimize/optimize` (NDJSON), `POST /prompt-optimize/variables`.

## Lizenz

MIT. Die Screenshots stammen von einer echten, auf diesem Rechner laufenden Instanz.
