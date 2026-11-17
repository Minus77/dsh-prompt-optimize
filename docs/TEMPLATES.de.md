# Vorlagen

Das Plugin bringt sieben Vorlagen mit. Du wechselst sie oben rechts im Optimizer-Panel; der Wechsel ändert **die Art, wie der Entwurf umgeschrieben wird**, nie den Entwurf selbst.

Jede Vorlage deckt einen anderen Aspekt desselben Problems ab:

- **Basic** — einen Satz in eine vollständige Aufgabe verwandeln (Task brief, Role contract, Agent persona);
- **Structure** — Abnahmekriterien nach vorn ziehen (Delivery contract);
- **Examples** — Stil und Format mit Beispielen festnageln (Worked examples);
- **Reasoning** — schrittweise Ausführung mit Zwischenprüfungen erzwingen (Reasoning steps);
- **Iterate** — minimale Änderungen auf einer bestehenden Version (Incremental edit).

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
