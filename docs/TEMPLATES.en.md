# Templates

[中文](./TEMPLATES.md) · **English** · [Español](./TEMPLATES.es.md) · [Français](./TEMPLATES.fr.md) · [Deutsch](./TEMPLATES.de.md) · [Русский](./TEMPLATES.ru.md) · [日本語](./TEMPLATES.ja.md)

The plugin ships seven templates. You switch them from the top-right of the optimizer panel; switching changes **how the draft is rewritten**, never the draft itself.

Each template covers a different facet of the same problem:

- **Basic** — turn one sentence into a complete task (task brief, role contract, agent persona);
- **Structure** — move acceptance criteria up front (delivery contract);
- **Examples** — pin style and format with samples (worked examples);
- **Reasoning** — force stepwise execution with checkpoints (reasoning steps);
- **Iterate** — minimal edits on top of an existing version (incremental edit).

---

## Task brief

**Mode**: prompt · **Group**: basic · **Default**

The general-purpose option. Best for drafts that state a goal but no detail: "write me something", "take a look at this".

**Output shape**: goal / known information / deliverable / constraints / output format. Gaps become `待确认：…` (to confirm) rather than invented facts.

**Use when**

- the draft is one sentence but you know what you want;
- a verbal request must become something another person could execute;
- you want a sendable prompt without adding context by hand.

**Avoid when**

- the requirement already has hard acceptance criteria (use delivery contract);
- style matters more than structure and only examples can convey it (use worked examples).

**Example**

> Draft: write a launch note for our new release, shipping Friday, for existing users

Becomes roughly:

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

**Mode**: prompt · **Group**: structure

Puts "what counts as done" first. Best for work that will be reviewed repeatedly: docs, reports, code changes, data cleanup.

**Output shape**: task / input / output spec / acceptance criteria (3–6 checkable items) / boundaries and exceptions / prohibitions.

**Use when**

- someone else will check the result;
- previous attempts bounced because the standard was never written down;
- the model should ask for missing material instead of guessing.

**Avoid when**

- the task is exploratory and the standard is not known yet;
- a one-line request would do — a contract only adds weight.

**Example**

> Draft: turn this weekly report into a one-pager for my manager

The rewrite adds: which report is the input, the fields and order of the one-pager, acceptance criteria (conclusion first, every claim backed by a number, no unexplained acronyms), and what to do when it runs long.

---

## Worked examples

**Mode**: prompt · **Group**: examples

For when two examples beat a paragraph of adjectives. Models imitate format far better than they interpret "make it professional".

**Output shape**: task and scope → 2–3 input → expected-output pairs → rules for inputs outside the examples → a note that samples are illustrative.

**Use when**

- format is strict: table columns, tone of voice, code style;
- you already have two or three "write it like this" samples;
- coverage matters more than repeating one case.

**Avoid when**

- the draft has nothing to base samples on — invented examples mislead;
- the work is open-ended and creative.

---

## Reasoning steps

**Mode**: prompt · **Group**: reasoning

Splits the task into executable steps, and says where to self-check and where to fall back.

**Output shape**: restated goal → 3–7 steps (input / action / done signal) → checkpoints → failure handling → delivery format.

**Use when**

- multi-step analysis, debugging, or option comparison;
- intermediate results need a human check;
- past runs went all the way down the wrong path.

**Avoid when**

- the task is a single step;
- the work needs free-form creativity.

---

## Role contract

**Mode**: system prompt · **Group**: basic

Turns one line of role description into a system prompt an agent can follow for a long time. The panel does not expose system mode yet; use `POST /prompt-optimize/optimize` with `optimizationMode: "system"`.

**Output shape**: identity / responsibilities / workflow / boundaries / output agreement.

**Use when**

- the same role is reused across sessions;
- the role needs judgment criteria, not just a title.

**Avoid when**

- you need a one-off task prompt.

---

## Agent persona

**Mode**: system prompt · **Group**: basic

Writes a file that reads like a person: how they talk, how they decide, what they volunteer, what they never do, plus one sample reply.

**Use when**

- the assistant needs a stable voice and character;
- you want a persona, not a job description.

**Avoid when**

- compliance wording must stay strict; persona text gets in the way.

---

## Incremental edit

**Mode**: iterate · **Group**: iterate

Applies one change note to the previous result with minimal movement: only the mentioned parts change, everything else is preserved verbatim.

**Output shape**: the full prompt (not a diff). When the note conflicts with the text, the note wins.

**Use when**

- the result is broadly right and you want tone, length or one passage adjusted;
- a vague note like "make it more formal" needs to land somewhere concrete.

**Avoid when**

- the direction is wrong — a fresh run is faster than sentence-level surgery.

**Example**

> Note: lighter tone, and collapse the long "to confirm" list into three lines

Only the tone-related phrasing and that list change; headings, punctuation and the rest stay identical.

---

## Choosing

| Your situation | Template |
| --- | --- |
| One sentence, needs to become a full task | Task brief |
| Someone else will accept the result | Delivery contract |
| You have samples and fear format drift | Worked examples |
| Multi-step work that tends to wander | Reasoning steps |
| Mostly happy, want a small edit | Incremental edit |

More templates is not better: the same draft under different templates produces visibly different structures. Pick one default, switch only when the job changes.

Back to the [main README](./../README_en.md).
