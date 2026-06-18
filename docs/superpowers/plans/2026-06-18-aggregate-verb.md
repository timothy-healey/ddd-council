# Aggregate Verb Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an `aggregate` verb — the tactical keystone — that names a context's aggregate roots, the invariant each protects, the consistency boundary, and inside-vs-referenced composition, and lands the first four §D tactical signals.

**Architecture:** Pure council-side change — Markdown playbooks plus one JSON metadata entry. No CLI/engine code. Three files touched: `signals.md` (fill §D), `SKILL.md` + `command-metadata.json` (register the verb), and a new `reference/aggregate.md` (the playbook).

**Tech Stack:** Markdown reference files read by the AI harness; one JSON config consumed by the plugin. Verification is structural (JSON parse, presence grep, cross-file consistency) — this half of the repo has no test harness and we are not inventing one.

## Global Constraints

- All edited files live under `skills/ddd-council/`. Paths are relative to repo root `/Users/tim/brain/Efforts/ddd-council`.
- Match the existing prose voice of the reference files (terse, imperative, em-dash asides, backticked symbols, `*Cue:* / *Why:* / *Confirm:*` shape for signals).
- The artifact filename pattern is **`docs/aggregate-<context-slug>-<date>.md`** and the finding tag form is **`### F<n> [severity] <signalId> — <title>`**, status values exactly `open | resolved | deferred | escalated` — identical wording to `critique`/`remediate`.
- The finding shape is the `Finding` typedef in `cli/src/finding.mjs` — cite that file, don't restate fields.
- The tactical signals section is **`## D. Tactical signals (inside one aggregate)`**; later steps grep for `## D.` and for `§D`.
- `aggregate` mode is **both**, lens is **tactical**.
- Commit after each task. End commit messages with: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
- Branch: `main` (current). Do not open a PR or push unless asked.

---

### Task 1: Fill §D (tactical signals) in signals.md

**Files:**
- Modify: `skills/ddd-council/reference/signals.md` (the intro mechanization line; replace the §D roadmap stub)

**Interfaces:**
- Consumes: nothing.
- Produces: section `## D. Tactical signals (inside one aggregate)` with the four root-level signals (`anaemic domain model`, `god aggregate`, `transaction spanning aggregates`, `leaked invariant`), each in `*Cue:* / *Why:* / *Confirm:*` shape, plus a "still roadmap" note for the later-verb signals. `aggregate.md` (Task 3) cites it as "§D".

- [ ] **Step 1: Verify §D is still a stub and locate it**

Run: `grep -n "## D\. Tactical signals" skills/ddd-council/reference/signals.md; grep -n "Added when the tactical verbs land" skills/ddd-council/reference/signals.md`
Expected: the `## D.` heading is found (currently titled `— *roadmap*`); the "Added when the tactical verbs land" stub line is found.

- [ ] **Step 2: Update the intro mechanization line to include §D**

Find this line near the top of the file:

```markdown
checked mechanically. §B is mechanized today; §A and §C are council-only until
they are.
```

Replace it with:

```markdown
checked mechanically. §B is mechanized today; §A, §C, and §D are council-only
until they are.
```

- [ ] **Step 3: Replace the §D roadmap stub with the filled section**

Find this block (the entire current §D stub, between its surrounding `---` rules):

```markdown
## D. Tactical signals — *roadmap*

Added when the tactical verbs land (`aggregate`, `entities`, `value-objects`,
`events`, `repositories`). Will cover: anaemic domain model, god aggregate,
transaction spanning aggregates (and aggregate split across transactions),
entity/value-object misclassification, leaked invariant, repository-per-entity
(instead of per-aggregate root), domain logic in the application/service layer,
and missing domain events.
```

Replace it with:

```markdown
## D. Tactical signals (inside one aggregate)

The inside-a-context catalog, surfaced by the tactical verbs. The four root-level
signals below land with `aggregate`; the rest stay *roadmap* until their owning verb
ships. Like §A/§C, these are council-only — the engine reads the import graph and
can't see invariants or transaction scopes.

- **Anaemic domain model** — the aggregate is a bag of getters/setters and the
  behaviour that should protect its invariant lives in a service. *Cue:* a data class
  with a public setter for every field, paired with a `*Service`/`*Manager` that
  mutates it. *Why:* the invariant has no home; any caller can put the aggregate in an
  illegal state. *Confirm:* should the behaviour move onto the root, or is the model
  deliberately a DTO at this layer?
- **God aggregate** — one root pulls in too much; the consistency boundary is far wider
  than the invariant needs. *Cue:* a root holding many unrelated child collections; a
  single load/save dragging in a large object graph; one transaction touching much of
  the schema. *Why:* contention and coupling — the whole graph locks and changes
  together for a rule that governs a fraction of it. *Confirm:* which children share the
  *true* invariant; what can be referenced by id instead of held inside?
- **Transaction spanning aggregates** — one transaction mutates two roots, or one
  aggregate's invariant is split across two transactions. *Cue:* a transaction scope (or
  unit of work) writing two roots' tables; a save of root A inside a loop over root B.
  *Why:* the aggregate is the unit of consistency — a transaction wider than one root
  couples their lifecycles; one narrower leaves an invariant half-enforced. *Confirm:*
  should the boundary move, or should the cross-root change become an event /
  eventual-consistency step?
- **Leaked invariant** — a rule the aggregate exists to protect is enforced (or left
  unenforced) outside it. *Cue:* the **gap** found while collecting an invariant's
  enforcement sites — a mutation path that changes state without re-checking the rule (a
  public setter, a raw SQL update, a service that bypasses the root). *Why:* the
  aggregate can't guarantee the invariant it's named for; the rule will eventually be
  violated on the unguarded path. *Confirm:* is the missing guard an oversight, or does
  the rule actually live in another context?

*Still roadmap (land with later verbs):* entity/value-object misclassification and
primitive obsession at the boundary (`entities`/`value-objects`), repository-per-entity
instead of per-aggregate-root and domain logic in the application/service layer
(`repositories`), and missing domain events (`events`).
```

- [ ] **Step 4: Verify §D is filled with the four signals**

Run: `grep -c "## D\. Tactical signals (inside one aggregate)" skills/ddd-council/reference/signals.md; grep -c "Anaemic domain model\|God aggregate\|Transaction spanning aggregates\|Leaked invariant" skills/ddd-council/reference/signals.md`
Expected: heading count `1`; the four-signal grep returns `4`.

- [ ] **Step 5: Verify the stub is gone and the roadmap note remains**

Run: `grep -c "Tactical signals — \*roadmap\*" skills/ddd-council/reference/signals.md; grep -c "Still roadmap (land with later verbs)" skills/ddd-council/reference/signals.md`
Expected: old stub heading `0`; roadmap note `1`.

- [ ] **Step 6: Commit**

```bash
git add skills/ddd-council/reference/signals.md
git commit -m "signals: fill section D root-level tactical signals for aggregate

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Register the `aggregate` verb (router row + metadata entry)

**Files:**
- Modify: `skills/ddd-council/SKILL.md` (the `## Commands (router)` table)
- Modify: `skills/ddd-council/scripts/command-metadata.json`

**Interfaces:**
- Consumes: nothing.
- Produces: the router row pointing at `reference/aggregate.md` and the metadata entry with `mode: "both"`, `lens: "tactical"`. Task 3 creates the referenced file.

- [ ] **Step 1: Verify the verb is not yet registered**

Run: `grep -c "reference/aggregate.md" skills/ddd-council/SKILL.md; grep -c "\"aggregate\"" skills/ddd-council/scripts/command-metadata.json`
Expected: `0` in both.

- [ ] **Step 2: Add the router row to SKILL.md**

In the `## Commands (router)` table, find the `vet` row (currently last):

```markdown
| `vet` | `reference/vet.md` | vet | Review a proposed change (plan/spec) for DDD design soundness before it's built; cite §E smells, amend the plan. |
```

Insert immediately after it:

```markdown
| `aggregate` | `reference/aggregate.md` | both | Name a context's aggregate roots, the invariant each protects, the consistency boundary, and inside-vs-referenced; cite §D smells; round-trips via `remediate`. |
```

- [ ] **Step 3: Add the metadata entry**

In `skills/ddd-council/scripts/command-metadata.json`, the `vet` entry is currently last in `commands`. Add a comma after its closing brace and append the `aggregate` entry. The tail becomes:

```json
    "vet": {
      "description": "Review a proposed change (plan or spec) for DDD design soundness before it is built: boundary fit, ubiquitous language, refactor-before-add, and contradictions with DOMAIN.md/spec. Reads the doc + DOMAIN.md + affected code; findings amend the plan, not the code.",
      "argumentHint": "[plan-or-spec.md]",
      "mode": "vet",
      "lens": "strategic"
    },
    "aggregate": {
      "description": "Name a bounded context's aggregate roots, the invariant each protects, the consistency boundary, and what is held inside vs referenced by id. Critique mode cites code; design mode proposes from intent. Lands the four root-level section-D tactical signals; writes docs/aggregate-<context-slug>-<date>.md (model + findings) that round-trips via remediate.",
      "argumentHint": "[context] or [context/Root]",
      "mode": "both",
      "lens": "tactical"
    }
  }
}
```

- [ ] **Step 4: Verify the JSON parses and the entry is present**

Run: `node -e "const c=require('./skills/ddd-council/scripts/command-metadata.json'); if(!c.commands.aggregate) throw new Error('missing aggregate'); console.log('ok:', c.commands.aggregate.mode, c.commands.aggregate.lens)"`
Expected: `ok: both tactical`

- [ ] **Step 5: Verify the router row resolves**

Run: `grep -n "reference/aggregate.md" skills/ddd-council/SKILL.md`
Expected: one match in the Commands table.

- [ ] **Step 6: Commit**

```bash
git add skills/ddd-council/SKILL.md skills/ddd-council/scripts/command-metadata.json
git commit -m "Register aggregate verb in router and command metadata

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Write the `aggregate` verb playbook

**Files:**
- Create: `skills/ddd-council/reference/aggregate.md`

**Interfaces:**
- Consumes: §D in signals.md (Task 1); the router/metadata registration (Task 2); the `### F<n> [severity] <signalId> — <title>` + `status` artifact contract and the `Finding` shape in `cli/src/finding.mjs` (shared with `critique`).
- Produces: the playbook the router (Task 2) points at. Terminal file; nothing depends on it.

- [ ] **Step 1: Verify the file does not exist**

Run: `test ! -e skills/ddd-council/reference/aggregate.md && echo absent`
Expected: `absent`

- [ ] **Step 2: Create `skills/ddd-council/reference/aggregate.md`**

Write this exact content:

````markdown
# Verb: aggregate

*Mode: both (design ↔ critique) · Lens: tactical · Reads: one bounded context's code +
`DOMAIN.md`.*

> **Register.** Surfaced per the active register (SKILL.md → *Lens*). In `workshop`
> (default) the room reasons each root aloud and teaches the invariant it protects; in
> `brief` it states the model and writes the artifact.

**The tactical keystone.** The first verb inside a bounded context: it names the
**aggregate roots**, the **invariant each protects**, the **consistency boundary**, and
what is held **inside vs referenced by id**. It lands the first tactical findings (§D).
Everything tactical hangs off it — `entities`/`value-objects` classify what's inside an
aggregate, `repositories` is per root, `events` are what a root publishes.

## Mode — critique by default, design from intent

`aggregate` runs in **both** modes (SKILL.md → *Lens*, design-vs-critique axis):

- **Critique (default):** read the context's real code and name the aggregates it
  *actually* implements — every claim cites a `file:symbol`.
- **Design (`--design`, or when no code yet expresses the aggregate):** propose what the
  roots and invariants *should* be from operator intent. The proposed model is flagged
  as a recommendation, not cited.

## Input & scope

Tactical lens — **narrow and deep** (see `reference/tactical.md`). Read one context
thoroughly: its domain types, where behaviour lives, what the code enforces and where,
persistence/transaction scopes, and intra-context events.

- `aggregate <context>` — find **all** roots in the context.
- `aggregate <context>/<Root>` — zoom to one named aggregate.

**Prerequisite.** The context must be named and bounded. If the boundary is still fuzzy,
drop back to `boundaries`/`map` first — *strategic before tactical* is a shared law.

**Fallbacks:**
- No `DOMAIN.md` → offer `init` first.
- Target context isn't bounded / isn't in `DOMAIN.md` → redirect to `boundaries`.

## Signals

Work from `reference/signals.md` **§D (tactical signals)** — the four root-level signals
`aggregate` owns: *anaemic domain model, god aggregate, transaction spanning aggregates,
leaked invariant*. Each finding traces to a §D signal id and cites a code location. The
other §D signals belong to later verbs; don't raise them here.

## The model — the positive result

Even with zero findings, `aggregate` produces a model. **One block per aggregate root**,
cited to code (critique) or flagged as proposed (design):

- **Root** — the entity that is the entry point to the consistency boundary
  (`file:symbol`).
- **Invariant(s) it protects** — for each rule:
  1. a **plain-language statement** (the rule in domain terms),
  2. its **enforcement sites** — every `file:line` where the code upholds it,
  3. any **gap** — a mutation path that changes state without re-checking the rule. A
     gap is a *leaked invariant* finding (§D).
- **Consistency / transaction boundary** — what must mutate atomically together.
- **Inside vs referenced by id** — which objects load/save as part of the root, vs are
  held by id only. (This is the composition list the next verb classifies — see *Seam*.)

## How it runs

1. **Acquire** the context deeply (tactical breadth, above).
2. **Identify the roots** — recommend from the code with reasoning; the engineer
   proposes, the architect tests the boundary, the domain expert checks the invariant is
   a real rule. Pause for the operator on a genuine fork ("one aggregate or two?").
3. **Build each root's block** — state the invariant, collect its enforcement sites, mark
   gaps; record the boundary and the inside-vs-referenced composition.
4. **Flag §D** — each finding with severity (blast radius) and a code citation.
5. **Pause** for the operator on each "is this deliberate / is this really one
   aggregate?" — intent is canon.

In **design mode**, steps 2–4 propose the model from intent (flagged) rather than
deriving and citing it.

## Output & loop

Write `docs/aggregate-<context-slug>-<date>.md` — same snapshot-not-ledger rule as
`critique` (same target + date overwrites). Frontmatter carries a stable artifact `id`.
The file has two parts:

- **Model** — the per-root blocks above.
- **Findings** — §D anti-patterns as `### F<n> [severity] <signalId> — <title>` with a
  `status` field, using the `Finding` shape in `cli/src/finding.mjs` — identical to
  `critique`. Findings **round-trip through `remediate`**
  (`open | resolved | deferred | escalated`).

## The seam to `entities` / `value-objects`

`aggregate` draws the boundary and names *what's inside vs referenced by id*. It does
**not** classify the insides as entities vs value objects — that's the next verb
(`entities`/`value-objects`, which classifies the types *within* an aggregate).
`aggregate` draws the boundary; the next verb sorts what's inside it.

## Room framing

- **Engineer leads** — what's the aggregate, what invariant does it protect, how does it
  persist, what's the awkward edge case? Calls out over-abstraction.
- **Architect** guards the boundary — one consistency boundary or two; does the
  transaction scope match the root.
- **Domain expert(s)** confirm the invariant is a real domain rule, not an artefact of
  the code.
- **Operator** is canon — on the roots, the invariants, and apply/defer.

## Guardrails

- Cite or cut — in critique mode every root and every finding points at code.
- Every aggregate names what it protects — a root with no stated invariant is a finding,
  not a blank.
- Refactor before you add — moving leaked behaviour onto the root beats adding a new
  guard elsewhere.
- Stay at the root altitude — entity/value-object classification is the next verb.
- The operator rules on intent; the room recommends, flagged.
````

- [ ] **Step 3: Verify the playbook cites §D and the shared contract**

Run: `grep -c "§D" skills/ddd-council/reference/aggregate.md; grep -c "aggregate-<context-slug>-<date>.md" skills/ddd-council/reference/aggregate.md; grep -c "cli/src/finding.mjs" skills/ddd-council/reference/aggregate.md`
Expected: §D count `≥ 1`; filename count `≥ 1`; finding-shape ref `≥ 1`.

- [ ] **Step 4: Verify the router target now resolves to a real file**

Run: `grep -q "reference/aggregate.md" skills/ddd-council/SKILL.md && test -e skills/ddd-council/reference/aggregate.md && echo wired`
Expected: `wired`

- [ ] **Step 5: Commit**

```bash
git add skills/ddd-council/reference/aggregate.md
git commit -m "Add aggregate verb playbook

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Verification (whole feature)

After all tasks:

- [ ] `node -e "const c=require('./skills/ddd-council/scripts/command-metadata.json'); if(c.commands.aggregate.mode!=='both'||c.commands.aggregate.lens!=='tactical') throw new Error('bad aggregate meta'); console.log('meta ok')"` — metadata valid JSON, `aggregate` is `both`/`tactical`.
- [ ] `grep -q "reference/aggregate.md" skills/ddd-council/SKILL.md && test -e skills/ddd-council/reference/aggregate.md && echo wired` — router points at the playbook, which exists.
- [ ] `grep -c "## D\. Tactical signals (inside one aggregate)" skills/ddd-council/reference/signals.md` returns `1` (§D filled once).
- [ ] `grep -c "Anaemic domain model\|God aggregate\|Transaction spanning aggregates\|Leaked invariant" skills/ddd-council/reference/signals.md` returns `4` (the four root signals present).
- [ ] `aggregate.md` cites §D, the artifact filename, and the `Finding` shape (`grep -c "§D\|aggregate-<context-slug>-<date>.md\|cli/src/finding.mjs" skills/ddd-council/reference/aggregate.md` ≥ 3).
- [ ] `cd cli && npm test` — confirms the untouched engine still passes (no regressions from the docs change).
