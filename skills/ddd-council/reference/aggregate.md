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

Work from `reference/signals/D-tactical.md` **§D (tactical signals)** — the four root-level signals
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
