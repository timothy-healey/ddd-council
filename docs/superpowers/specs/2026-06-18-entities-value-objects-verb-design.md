# Design — the `entities` / `value-objects` verb (Phase 1.2)

*Date: 2026-06-18 · Status: approved for planning · Scope: the ddd-council skill*

## Problem

`aggregate` (Phase 1.1) draws the consistency boundary and names what is held *inside
vs referenced by id* — but it deliberately stops short of classifying those insides. The
next vertebra sorts that composition along the one axis DDD cares about most inside an
aggregate: **identity vs value**. Is a type an **entity** (defined by identity and
lifecycle) or a **value object** (defined wholly by its attributes)? Getting this wrong
is where invariants lose their home and primitives stand in for real concepts. This verb
lands the two §D/§C signals the roadmap assigns it (*entity/value-object
misclassification*, *primitive obsession at the boundary*) and sharpens the language in
the code — the type names become the model.

## Decisions (locked during brainstorming)

| # | Decision |
|---|---|
| Verb shape | **One verb, two aliases.** `entities` and `value-objects` both route to a single playbook (`reference/entities-value-objects.md`) that does one classification pass and emits two lists. Entity-vs-value is a single axis; two playbooks would duplicate the logic and the misclassification finding. |
| Mode | **Both** (design ↔ critique), like `aggregate`. Defaults to critique on code; design mode proposes the classification from intent. |
| Target | **Mirror `aggregate`.** `entities <context>` classifies the types across all aggregates in the context; `entities <context>/<Root>` zooms to one aggregate's composition. |
| Aggregate input | **Prefer the artifact, else derive.** If `docs/aggregate-<context>-<date>.md` exists, its inside-vs-referenced composition list is the literal starting set of types to classify. If not, derive the composition from code. Not a hard prerequisite. |
| VO extraction | **Frame as consolidation.** A value-object extraction is a *refactor* when the primitive's rules already exist scattered across call sites — the new type consolidates duplicated validation, it isn't net-new behaviour. Flag it as a genuine *addition* only when no such rules exist yet anywhere. |
| Signals | Fills the §D *entity/value-object misclassification* stub; **cites** the existing §C *primitive obsession at the boundary* entry rather than duplicating it (the entry already says "bridges into tactical"). |
| Engine | Council-only. No engine work — the import graph can't see identity semantics. |

## 1. Identity & routing

- Verb: `entities` (alias `value-objects`). Mode: **both** on the design-vs-critique
  axis. Default lens: **tactical · workshop**.
- **Default behaviour is critique** — read the code, cite it. **Design mode** (propose
  the classification from intent, flagged as proposed not cited) kicks in when no code
  yet expresses the types, or via an explicit `--design` cue.
- Wiring: **two router rows** in [SKILL.md](../../../skills/ddd-council/SKILL.md)
  (`entities` and `value-objects`), both pointing at the one
  `reference/entities-value-objects.md`; one entry per alias in
  `skills/ddd-council/scripts/command-metadata.json` sharing a description; new
  `skills/ddd-council/reference/entities-value-objects.md`.
- Invocation: `entities <context>` or `entities <context>/<Root>` (likewise
  `value-objects …`).
- **No CLI/engine changes** — this is a council (prose) verb.

## 2. Input & scope

- Primary: `entities <context>` — classify the types across **all** aggregates in the
  context (tactical lens: narrow and deep).
- Zoom: `entities <context>/<Root>` — one aggregate's composition.
- **Prefer the `aggregate` artifact.** If `docs/aggregate-<context>-<date>.md` exists,
  its *inside-vs-referenced* composition list is the literal starting set of types to
  classify — the seam handoff `aggregate` was built to provide. If not present, derive
  the composition from code directly. **Not** a hard prerequisite — the verb runs
  without a prior `aggregate` run.
- **Prerequisite (shared law):** the context must be named and bounded. If the boundary
  is still fuzzy, drop back to `boundaries`/`map` first — *strategic before tactical*.

**Fallbacks** (same shape as the other verbs):
- No `DOMAIN.md` → offer `init` first.
- Target boundary unclear / context not in `DOMAIN.md` → redirect to `boundaries`.

## 3. The model output (the positive result)

`entities`/`value-objects` produces a positive model even when nothing is wrong: every
type in the aggregate's composition sorted into **two lists**, each entry **cited to
code** (critique mode) or **flagged as proposed** (design mode):

- **Entities** — identity + lifecycle; equality by id. *Cue:* the type has an id, is
  mutated in place, is compared/looked-up by id, persists across changes to its fields.
- **Value objects** — defined wholly by their attributes; equality by value; ideally
  immutable. *Cue:* no id, replaced wholesale rather than mutated, compared by fields.

Each entry carries the **classification rationale** — the code evidence that put it on
this side of the axis. A type whose evidence is genuinely mixed is the seed of a
misclassification finding (§4).

## 4. Signals + findings

This verb lands the two signals the §D roadmap line assigns it:

- **Entity/value-object misclassification** (§D — fills the current stub). A type modeled
  as an **entity** that has no meaningful identity (its "id" is incidental; it's really
  defined by value → should be a value object), or a **value object** carrying identity /
  mutable lifecycle it doesn't need. *Cue:* an id field never used for lookup/equality; a
  "value" type mutated in place across call sites. *Why:* equality and lifecycle semantics
  end up wrong; invariants attach to the wrong unit. *Fix is a pure refactor* — reshape
  the type (drop the unused id, make it immutable, compare by value — or the reverse). No
  addition.
- **Primitive obsession at the boundary** (already a full **§C** entry; "bridges into
  tactical"). A domain concept passed as a bare `string`/`int`/map where a value object
  should carry its rules. The verb **cites the existing §C entry** — it does not add a §D
  duplicate. *Fix per the decision:* framed as **consolidation** — the extracted value
  object collapses validation already scattered across call sites, so it counts as a
  refactor under *refactor-before-you-add*; the finding's `suggestedMove` says so. Flag
  it as a genuine *addition* only when the rules don't exist anywhere yet.

The remaining §D stubs (*repository-per-entity*, *domain-logic-in-service-layer*,
*missing domain events*) **stay stubbed** — they belong to `repositories` and `events`.

Findings use the exact `### F<n> [severity] <signalId> — <title>` + `status` shape from
`critique`, sharing the `Finding` typedef in `cli/src/finding.mjs`. They **round-trip
through `remediate`** unchanged (`open | resolved | deferred | escalated`). §D is authored
in the mechanizable style (per the signals.md convention) but is **council-only** for now.

## 5. How it runs

1. **Acquire** the composition: read the `aggregate` artifact's inside-vs-referenced list
   if present; otherwise derive it from the context's code (tactical breadth — domain
   types, their fields, how they're compared, mutated, and persisted).
2. **Classify each type** — entity or value object — with the code evidence as rationale.
   The engineer proposes from the code; the domain expert checks the call matches how the
   business thinks of the thing (a "Money" the business never tracks individually is a
   value, whatever the schema says).
3. **Flag misclassification** — where the evidence contradicts the modeling (entity with
   no real identity, value object with needless identity/lifecycle); each finding traces
   to the §D signal id, a severity (blast radius), and a code citation.
4. **Flag primitive obsession** — bare primitives standing in for value objects at the
   boundary; cite the §C entry; frame the extraction as consolidation per the decision.
5. **Pause** for the operator on each genuine fork ("does the business track this one
   individually?") — intent is canon.

In **design mode**, steps 2–4 propose the classification from intent (flagged), rather
than deriving and citing it.

## 6. Room framing

- **Engineer leads** — for each type: identity or value? how is it compared, mutated,
  persisted? Calls out an id that earns nothing and a primitive that should be a type.
- **Architect** guards the altitude — this is the identity-vs-value axis only; persistence
  is `repositories`, events are `events`.
- **Domain expert(s)** confirm the classification matches how the business treats the
  thing — whether it tracks an instance individually (entity) or only cares about its
  value (value object).
- **Operator** is canon — on each classification fork and on apply/defer.

## Components & boundaries

| Unit | Purpose | Depends on |
|---|---|---|
| `reference/entities-value-objects.md` | The verb playbook the room follows | SKILL.md laws, §C/§D, the artifact contract, the `aggregate` seam |
| `signals.md` §D | Fill the *entity/value-object misclassification* signal (full entry, replacing the roadmap mention) | §C primitive-obsession entry (cited, not duplicated), `cli/src/finding.mjs` (shape) |
| SKILL.md edits | **Two** router rows (`entities`, `value-objects`) → one reference; mode/lens | — |
| `command-metadata.json` | One entry per alias (shared description) — description / hint / mode / lens | — |
| `tactical.md` | Already states the prerequisite + what the lens reads — confirm during build, no change expected | — |

## The seams

- **Back to `aggregate`.** `aggregate` draws the boundary and names what's inside vs
  referenced by id — the composition list. This verb sorts that list along the
  identity-vs-value axis. It consumes the `aggregate` artifact's composition when present.
- **Forward to `repositories` / `events`.** Those classify *other* facets of the same
  aggregate — persistence (one repository per root) and published domain events. This verb
  owns the identity-vs-value axis only; it assesses neither persistence nor events.

## Out of scope (YAGNI)

- Persistence / repository concerns and domain events — later verbs (`repositories`,
  `events`), each its own spec.
- A second playbook for `value-objects` — it's an alias of the one verb, not a separate
  implementation.
- A §D duplicate of primitive obsession — it stays a §C entry the verb cites.
- Any engine/§D mechanization — council-only (the import graph can't see identity
  semantics).
- The non-owned §D signals — they stay stubbed until their owning verbs land.

## Open questions

None blocking. The combined reference filename (`entities-value-objects.md`) and the
shared `command-metadata.json` description across the two aliases are provisional but
low-stakes (mirror the existing wiring precedent).
