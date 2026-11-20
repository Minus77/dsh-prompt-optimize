# Templates

[中文](./TEMPLATES.md) · **English** · [Español](./TEMPLATES.es.md) · [Français](./TEMPLATES.fr.md) · [Deutsch](./TEMPLATES.de.md) · [Русский](./TEMPLATES.ru.md) · [日本語](./TEMPLATES.ja.md) · [Português (BR)](./TEMPLATES.pt.md)

The plugin ships fifteen templates. You switch them from the top-right of the optimizer panel; switching changes **how the draft is rewritten**, never the draft itself.

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

## Code review

**Mode**: Prompt · **Group**: Engineering

Turns "have a look at this code" into a scoped, prioritized review: state what the change is for, rank the concerns, and fix the output format so you do not get a flat list of style opinions.

**Output**: scope / priorities / format (severity, location, issue, impact, fix) / out of scope / evidence.

**Good for**

- self-review before a commit, or asking for a PR review;
- changes that span several files and may break callers;
- feedback you can discuss, not "consider refactoring".

**Not for**: explaining what a piece of code does (task brief) or implementing the fix (implementation task).

**Example**

> Draft: have a look at this code, anything wrong?

Roughly becomes: scope = the three files in this PR, which adds idempotency to checkout; priorities = correctness > concurrency > performance > readability; each finding cites file:line; no rewriting whole files, no naming nitpicks, no guessing upstream callers.

---

## Implementation task

**Mode**: Prompt · **Group**: Engineering

Fills a coding request out into an engineering brief: goal and acceptance, technical constraints, interface contracts, edge cases and failure handling, delivery shape. It produces a **task description**, not the code.

**Output**: goal and acceptance / constraints / interfaces / edges and failures / delivery / open questions.

**Good for**

- handing a medium change to an agent or a teammate;
- a one-line request whose acceptance criteria you already know;
- shared modules where interfaces must be agreed first.

**Not for**: exploratory prototypes where the design emerges while coding.

**Example**

> Draft: make export async so it stops blocking the request

Roughly becomes: trigger endpoint, job status field, polling or callback, concurrency cap, retry and timeout, permission checks, how the UI shows progress, and which existing callers must change with it.

---

## SQL query

**Mode**: Prompt · **Group**: Engineering

Writes a data request as a query task with explicit definitions, fields and performance limits, and asks for the assumptions to be listed separately.

**Output**: tables and fields / definitions (time, dedupe, nulls, units) / result shape / performance limits / permissions / assumptions.

**Good for**

- reports, dashboards and ad-hoc analysis;
- metrics that are easy to define differently (active, retention, GMV);
- large scans where index and range should be stated up front.

**Not for**: explaining an existing query, or schema migrations.

**Example**

> Draft: new users per channel last week

Roughly becomes: definition of a new user (first signup or first order), channel field and dedupe key, timezone and the exact week bounds, whether test accounts count, ordering, and the allowed scan range and index.

---

## Test design

**Mode**: Prompt · **Group**: Engineering

Writes a test request as a case table covering happy path, boundaries, failures and permissions, with priorities and what should be automated first.

**Output**: target and risks / case table (id, preconditions, steps, expected) / coverage / priority / automation advice.

**Good for**

- filling in cases before a release;
- confirming no regression after a bug fix;
- giving someone unfamiliar with the feature an actionable checklist.

**Not for**: asking for automation scripts directly (only when the draft says so).

**Example**

> Draft: write test cases for login

Roughly becomes: password, SMS and third-party login each covered; lockout after N failures; empty, very long and special-character input; unverified email; visible differences per role; each case numbered and prioritized.

---

## Structured extraction

**Mode**: Prompt · **Group**: Structure

Turns "pull a few fields out of this" into a schema-driven extraction task with strict JSON output and explicit missing-value rules.

**Output**: input shape / schema (name, type, required, enum) / missing and conflict rules / JSON only / one example.

**Good for**

- turning contracts, emails, tickets or pages into structured data;
- batch runs whose output must load straight into a database;
- leaving blanks instead of guessing.

**Not for**: summarising or rewriting content; images that need OCR.

**Example**

> Draft: get company, contact and amount from these emails

Roughly becomes: company from body or signature, contact with or without title, currency and tax treatment of the amount, which amount wins when several appear, null when absent, JSON only.

---

## Translation

**Mode**: Prompt · **Group**: Writing

Writes a translation request as a localisation task with audience, glossary and format rules. The point is what must not move: brand names, field names, placeholders, Markdown structure.

**Output**: language and region / audience and tone / glossary / format / no additions or omissions.

**Good for**

- product copy, help pages and email;
- a specific market where rewriting beats literal translation;
- text containing `{{variables}}`, code blocks or links.

**Not for**: legal text that still needs a human reviewer.

**Example**

> Draft: translate this into Japanese for a customer

Roughly becomes: business Japanese for a Japanese enterprise customer; keep product names and `{{user_name}}`; keep Markdown headings and lists; no added or dropped information; output the translation only.

---

## Copy polish

**Mode**: Prompt · **Group**: Writing

Writes a polish request as a bounded revision task: how deep edits may go, what must be preserved, and no expansion. Keeps the model from adding claims, examples or length.

**Output**: register and reader / allowed edit depth / must keep / forbidden / full text plus up to three notes.

**Good for**

- drafts whose facts are fine but whose flow is not;
- keeping one voice across outbound copy;
- limiting the change to wording, not structure.

**Not for**: content that lacks the argument and needs a rewrite.

**Example**

> Draft: make this sound more formal

Roughly becomes: how formal (public notice vs internal email), whether paragraph order may change, which numbers and conclusions must stay verbatim, whether sentences may be merged, and a short list of main changes at the end.

---

## Grounded Q&A

**Mode**: Prompt · **Group**: Reasoning

Writes "answer from these materials" as a grounded task with citations and an explicit "not covered" verdict, and asks for conflicts to be listed with sources before any judgement.

**Output**: material scope / citation rules / not-covered statement / conflict handling / structure (answer, evidence, gaps).

**Good for**

- answering from docs, policies or contracts;
- answers that must be traceable to a source;
- material that may contradict itself.

**Not for**: questions with no material to ground on.

**Example**

> Draft: how is annual leave calculated, per the handbook

Roughly becomes: handbook only, cite clause numbers; say "not covered" for anything absent (e.g. proration on exit); when the handbook and a later notice disagree, quote both first, then judge.

---

## Custom templates

The last item in the template menu is "New custom template", with three fields:

| Field | Purpose |
| --- | --- |
| Name | Shown in the menu; up to 40 characters |
| Rewrite instruction | How the model should rewrite; up to 2000 characters |
| Applies to | One line on which drafts fit; optional |

Custom templates live in this browser's `localStorage` and disappear with site data. Use the JSON export and import in the editor to move them to another machine or share them.

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
