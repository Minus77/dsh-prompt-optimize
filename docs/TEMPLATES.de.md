# Vorlagen

Das Plugin bringt sieben Vorlagen mit. Du wechselst sie oben rechts im Optimizer-Panel; der Wechsel ändert **die Art, wie der Entwurf umgeschrieben wird**, nie den Entwurf selbst.

Jede Vorlage deckt einen anderen Aspekt desselben Problems ab:

- **Basic** — einen Satz in eine vollständige Aufgabe verwandeln (Task brief, Role contract, Agent persona);
- **Structure** — Abnahmekriterien oder ein Zielschema nach vorn ziehen (Delivery contract, Structured extraction);
- **Examples** — Stil und Format mit Beispielen festnageln (Worked examples);
- **Reasoning** — Schritte mit Zwischenprüfungen, oder nur aus dem gegebenen Material antworten (Reasoning steps, Grounded Q&A);
- **Engineering** — Codereview, Umsetzung, SQL und Testdesign;
- **Text** — Übersetzung und Überarbeitung, bei denen zählt, wie weit der Eingriff gehen darf;
- **Iterate** — minimale Änderungen auf einer bestehenden Version (Incremental edit).

Der letzte Eintrag im Menü legt eine **eigene Vorlage** an: deine Umschreib-Anweisung, in diesem Browser gespeichert und als JSON übertragbar.

---

## Task brief

**Modus**: prompt · **Gruppe**: basic · **Standard**

Die Allzweck-Option. Am besten für Entwürfe, die ein Ziel nennen, aber kein Detail: „schreib mir mal was“, „schau dir das an“.

**Ausgabeform**: Ziel / bekannte Informationen / Lieferergebnis / Einschränkungen / Ausgabeformat. Lücken werden zu `待确认：…` („zu bestätigen“) statt zu erfundenen Fakten.

**Geeignet, wenn**

- der Entwurf nur ein Satz ist, du aber weißt, was du willst;
- eine mündliche Anfrage zu etwas werden soll, das eine andere Person ausführen kann;
- du einen versandfertigen Prompt willst, ohne Kontext von Hand zu ergänzen.

**Nicht geeignet, wenn**

- die Anforderung schon harte Abnahmekriterien hat (nimm Delivery contract);
- der Stil wichtiger ist als die Struktur und nur Beispiele ihn vermitteln können (nimm Worked examples).

**Beispiel**

> Entwurf: Schreib eine Ankündigung zum neuen Release, das am Freitag erscheint, für bestehende Nutzer

Daraus wird ungefähr:

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

**Modus**: prompt · **Gruppe**: structure

Stellt „was zählt als erledigt“ an den Anfang. Am besten für Arbeit, die mehrfach geprüft wird: Doku, Berichte, Code-Änderungen, Datenbereinigung.

**Ausgabeform**: Aufgabe / Eingabe / Ausgabe-Spezifikation / Abnahmekriterien (3–6 prüfbare Punkte) / Grenzen und Ausnahmen / Verbote.

**Geeignet, wenn**

- jemand anderes das Ergebnis prüft;
- frühere Versuche zurückkamen, weil der Maßstab nie aufgeschrieben war;
- das Modell fehlendes Material erfragen soll, statt zu raten.

**Nicht geeignet, wenn**

- die Aufgabe explorativ ist und der Maßstab noch nicht feststeht;
- eine Einzeiler-Anfrage reicht — ein Vertrag fügt nur Gewicht hinzu.

**Beispiel**

> Entwurf: Mach aus diesem Wochenbericht ein One-Pager für meine Führungskraft

Das Umschreiben ergänzt: welcher Bericht die Eingabe ist, die Felder und Reihenfolge des One-Pagers, Abnahmekriterien (Fazit zuerst, jede Aussage mit einer Zahl belegt, keine unerklärten Abkürzungen) und was zu tun ist, wenn es zu lang wird.

---

## Worked examples

**Modus**: prompt · **Gruppe**: examples

Für Fälle, in denen zwei Beispiele besser sind als ein Absatz voller Adjektive. Modelle imitieren Formate weit besser, als sie „make it professional“ interpretieren.

**Ausgabeform**: Aufgabe und Umfang → 2–3 Paare aus Eingabe und erwarteter Ausgabe → Regeln für Eingaben außerhalb der Beispiele → ein Hinweis, dass die Beispiele illustrativ sind.

**Geeignet, wenn**

- das Format streng ist: Tabellenspalten, Tonfall, Code-Stil;
- du schon zwei oder drei „schreib es so“-Beispiele hast;
- Abdeckung wichtiger ist als die Wiederholung eines Falls.

**Nicht geeignet, wenn**

- der Entwurf nichts hergibt, worauf sich Beispiele stützen könnten — erfundene Beispiele führen in die Irre;
- die Arbeit offen und kreativ ist.

---

## Reasoning steps

**Modus**: prompt · **Gruppe**: reasoning

Zerlegt die Aufgabe in ausführbare Schritte und sagt, wo eine Selbstprüfung nötig ist und wo auf einen Ausweichweg zurückgegriffen werden soll.

**Ausgabeform**: das Ziel erneut formuliert → 3–7 Schritte (Eingabe / Aktion / Fertig-Signal) → Checkpoints → Fehlerbehandlung → Lieferformat.

**Geeignet, wenn**

- mehrstufige Analyse, Debugging oder Optionsvergleich;
- Zwischenergebnisse eine menschliche Prüfung brauchen;
- frühere Läufe komplett den falschen Weg gegangen sind.

**Nicht geeignet, wenn**

- die Aufgabe aus einem einzigen Schritt besteht;
- die Arbeit freie Kreativität braucht.

---

## Role contract

**Modus**: system prompt · **Gruppe**: basic

Macht aus einer Zeile Rollenbeschreibung einen System-Prompt, dem ein Agent lange folgen kann. Das Panel bietet den System-Modus noch nicht an; nutze `POST /prompt-optimize/optimize` mit `optimizationMode: "system"`.

**Ausgabeform**: Identität / Aufgaben / Arbeitsablauf / Grenzen / Ausgabe-Vereinbarung.

**Geeignet, wenn**

- dieselbe Rolle über Sitzungen hinweg wiederverwendet wird;
- die Rolle Urteilskriterien braucht, nicht nur einen Titel.

**Nicht geeignet, wenn**

- du einen einmaligen Aufgaben-Prompt brauchst.

---

## Agent persona

**Modus**: system prompt · **Gruppe**: basic

Schreibt eine Datei, die wie ein Mensch klingt: wie die Person spricht, wie sie entscheidet, was sie von sich aus anbietet, was sie nie tut — plus eine Beispielantwort.

**Geeignet, wenn**

- der Assistent eine stabile Stimme und einen Charakter braucht;
- du eine Persona willst, keine Stellenbeschreibung.

**Nicht geeignet, wenn**

- Compliance-Formulierungen streng bleiben müssen; Persona-Text steht dem im Weg.

---

## Incremental edit

**Modus**: iterate · **Gruppe**: iterate

Wendet eine Änderungsnotiz möglichst schonend auf das vorherige Ergebnis an: Nur die genannten Teile ändern sich, alles andere bleibt wörtlich erhalten.

**Ausgabeform**: der vollständige Prompt (kein Diff). Wenn die Notiz dem Text widerspricht, gewinnt die Notiz.

**Geeignet, wenn**

- das Ergebnis im Großen und Ganzen stimmt und du Ton, Länge oder eine Passage anpassen willst;
- eine vage Notiz wie „mach es formeller“ irgendwo konkret landen muss.

**Nicht geeignet, wenn**

- die Richtung falsch ist — ein frischer Lauf ist schneller als Satz-für-Satz-Chirurgie.

**Beispiel**

> Notiz: lockerer Ton, und die lange ‚Zu bestätigen‘-Liste auf drei Zeilen zusammenfassen

Nur die Formulierungen zum Ton und diese Liste ändern sich; Überschriften, Interpunktion und der Rest bleiben identisch.

---

## Code review

**Modus**: Prompt · **Gruppe**: Engineering

Macht aus „schau mal auf diesen Code“ eine abgegrenzte, priorisierte Durchsicht: wofür die Änderung ist, was zuerst zählt und in welchem Format geantwortet wird.

**Ausgabe**: Umfang / Prioritäten / Format (Schwere, Stelle, Problem, Wirkung, Fix) / außerhalb / Belege.

**Geeignet**: Selbstprüfung vor dem Commit; Änderungen über mehrere Dateien, die Aufrufer brechen können.
**Nicht für**: erklären, was ein Code tut, oder den Fix umsetzen.

**Beispiel**

> Entwurf: schau mal, ist an dem Code was falsch?

Wird zu: Umfang = die drei Dateien des PR, der Idempotenz beim Checkout ergänzt; Prioritäten = Korrektheit > Nebenläufigkeit > Performance > Lesbarkeit; jeder Befund nennt Datei:Zeile; keine Komplettumschreibung, keine Namensdiskussion.

---

## Implementation task

**Modus**: Prompt · **Gruppe**: Engineering

Ergänzt eine Coding-Anfrage zu einem Engineering-Brief: Ziel und Abnahme, technische Vorgaben, Schnittstellen, Randfälle und Lieferform. Ergebnis ist eine **Aufgabenbeschreibung**, kein Code.

**Ausgabe**: Ziel und Abnahme / Vorgaben / Schnittstellen / Ränder und Fehler / Lieferung / offene Fragen.

**Geeignet**: mittlere Änderung an einen Agenten oder Kollegen geben; gemeinsame Module, deren Schnittstelle vorher feststeht.
**Nicht für**: explorative Prototypen, deren Entwurf beim Schreiben entsteht.

**Beispiel**

> Entwurf: mach den Export asynchron, damit die Anfrage nicht blockiert

Wird zu: auslösender Endpoint, Statusfeld, Polling oder Callback, Obergrenze für Nebenläufigkeit, Retry und Timeout, Rechteprüfung, Fortschrittsanzeige und welche bestehenden Aufrufer mitgehen müssen.

---

## SQL query

**Modus**: Prompt · **Gruppe**: Engineering

Schreibt eine Datenanfrage als SQL-Aufgabe mit klaren Definitionen, Feldern und Leistungsgrenzen und lässt die Annahmen separat auflisten.

**Ausgabe**: Tabellen und Felder / Definitionen (Zeit, Duplikate, NULL, Einheiten) / Ergebnisform / Leistung / Rechte / Annahmen.

**Geeignet**: Reports und Ad-hoc-Analysen; Kennzahlen mit Definitionsspielraum (aktiv, Retention, GMV).
**Nicht für**: eine bestehende Query erklären oder Schemamigrationen.

**Beispiel**

> Entwurf: neue Nutzer pro Kanal letzte Woche

Wird zu: Definition von „neu“, Kanalfeld und Dedupe-Schlüssel, Zeitzone und genaue Wochenränder, Testkonten ja/nein, Sortierung sowie erlaubter Scanbereich und Index.

---

## Test design

**Modus**: Prompt · **Gruppe**: Engineering

Schreibt eine Testanfrage als Falltabelle für Normalfall, Grenzen, Fehler und Rechte, mit Prioritäten und dem, was zuerst automatisiert werden sollte.

**Ausgabe**: Objekt und Risiken / Tabelle (ID, Vorbedingung, Schritte, Erwartung) / Abdeckung / Priorität / Automatisierung.

**Geeignet**: Fälle vor einem Release ergänzen; nach einem Bugfix Regressionen ausschließen.
**Nicht für**: direkt Skripte verlangen, außer der Entwurf sagt es.

**Beispiel**

> Entwurf: schreib Testfälle für den Login

Wird zu: Passwort, SMS und Drittanbieter getrennt; Sperre nach N Fehlversuchen; leer, sehr lang, Sonderzeichen; unbestätigte E-Mail; Unterschiede je Rolle; jeder Fall nummeriert und priorisiert.

---

## Structured extraction

**Modus**: Prompt · **Gruppe**: Struktur

Macht aus „hol ein paar Felder raus“ eine schema-geführte Extraktion mit striktem JSON und klaren Regeln für Fehlendes.

**Ausgabe**: Eingabeform / Schema (Name, Typ, Pflicht, Enum) / Regeln für Fehlen und Konflikt / nur JSON / ein Beispiel.

**Geeignet**: Verträge, Mails, Tickets oder Seiten in Daten verwandeln; Läufe, deren Ergebnis direkt in eine Datenbank soll.
**Nicht für**: zusammenfassen oder umschreiben; Bilder, die OCR brauchen.

**Beispiel**

> Entwurf: hol Firma, Kontakt und Betrag aus diesen Mails

Wird zu: Firma aus Text oder Signatur, Kontakt mit oder ohne Titel, Währung und Steuer des Betrags, welcher Betrag bei mehreren gilt, null wenn keiner, nur JSON.

---

## Translation

**Modus**: Prompt · **Gruppe**: Text

Schreibt eine Übersetzungsanfrage als Lokalisierungsaufgabe mit Zielgruppe, Glossar und Format. Entscheidend ist, was nicht wandert: Marken, Feldnamen, Platzhalter, Markdown-Struktur.

**Ausgabe**: Sprache und Region / Zielgruppe und Ton / Glossar / Format / keine Zusätze oder Auslassungen.

**Geeignet**: Produkttexte, Hilfe und Mails; ein Markt, in dem Umschreiben besser ist als wörtlich; Texte mit `{{Variablen}}` oder Codeblöcken.
**Nicht für**: Rechtstexte, die weiterhin menschliche Prüfung brauchen.

**Beispiel**

> Entwurf: übersetz das ins Japanische für einen Kunden

Wird zu: Geschäftsjapanisch für einen japanischen Firmenkunden; Produktnamen und `{{user_name}}` behalten; Markdown-Überschriften und Listen behalten; nichts ergänzen oder weglassen; nur die Übersetzung.

---

## Copy polish

**Modus**: Prompt · **Gruppe**: Text

Schreibt eine Überarbeitungsanfrage als begrenzte Revision: wie tief der Eingriff gehen darf, was bleiben muss und kein Ausbauen. Verhindert zusätzliche Thesen, Beispiele oder Länge.

**Ausgabe**: Register und Leser / erlaubte Tiefe / muss bleiben / verboten / Volltext und bis zu drei Notizen.

**Geeignet**: Entwürfe mit korrekten Fakten, aber holprigem Text; eine Stimme über mehrere Texte halten.
**Nicht für**: Inhalte, denen das Argument fehlt.

**Beispiel**

> Entwurf: mach das formeller

Wird zu: wie formell (öffentliche Mitteilung oder interne Mail), ob Absätze umziehen dürfen, welche Zahlen und Schlüsse wörtlich bleiben, ob Sätze zusammengelegt werden dürfen, plus kurze Änderungsliste am Ende.

---

## Grounded Q&A

**Modus**: Prompt · **Gruppe**: Reasoning

Schreibt „antworte aus diesen Unterlagen“ als belegte Aufgabe mit Zitaten und klarer Aussage zu Nicht-Abgedecktem; bei Konflikten erst Quellen nennen, dann urteilen.

**Ausgabe**: Materialumfang / Zitierregeln / Nicht-abgedeckt-Aussage / Konflikte / Struktur (Antwort, Belege, Lücken).

**Geeignet**: Antworten aus Doku, Richtlinien oder Verträgen; Antworten, die auf eine Quelle zurückführbar sein müssen.
**Nicht für**: Fragen ohne Material, auf das man sich stützen kann.

**Beispiel**

> Entwurf: wie wird der Urlaub laut Handbuch berechnet?

Wird zu: nur das Handbuch, mit Klauselnummern; „nicht abgedeckt“ für Fehlendes (etwa Anteil bei Austritt); bei Widerspruch zwischen Handbuch und späterem Hinweis beide zuerst zitieren, dann urteilen.

---

## Eigene Vorlagen

Der letzte Menüeintrag ist „Neue eigene Vorlage“ mit drei Feldern:

| Feld | Zweck |
| --- | --- |
| Name | Erscheint im Menü; maximal 40 Zeichen |
| Umschreib-Anweisung | Wie umgeschrieben werden soll; maximal 2000 Zeichen |
| Geeignet für | Eine Zeile zu passenden Entwürfen; optional |

Sie liegen im `localStorage` dieses Browsers und verschwinden mit den Websitedaten. Für Umzug oder Weitergabe dienen JSON-Export und -Import im Editor.

---

## Auswahl

| Deine Situation | Vorlage |
| --- | --- |
| Ein Satz, der zu einer vollständigen Aufgabe werden soll | Task brief |
| Jemand anderes nimmt das Ergebnis ab | Delivery contract |
| Du hast Beispiele und fürchtest Format-Drift | Worked examples |
| Mehrstufige Arbeit, die gern abschweift | Reasoning steps |
| Weitgehend zufrieden, nur eine kleine Änderung | Incremental edit |

Mehr Vorlagen sind nicht besser: Derselbe Entwurf ergibt unter verschiedenen Vorlagen sichtbar unterschiedliche Strukturen. Wähle eine Standardvorlage und wechsle nur, wenn sich die Aufgabe ändert.

---

← Zurück zur [README](./../README_de.md).
