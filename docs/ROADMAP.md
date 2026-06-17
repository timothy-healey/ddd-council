# ddd-council — Roadmap

*Living doc. Sequencing principle: **complete the DDD spine first** — the tactical
verbs are the product's core promise; the engine tracks are enhancements that follow.*

## Shipped

- **Strategic verbs** — `init`, `map`, `critique`, `language`, `boundaries`.
- **Review & remediate** — `vet` (pre-build review of a plan/spec), `remediate`
  (refactor-first fixes that round-trip into the critique artifact).
- **Refactor-first shared law** — every verb prefers reshaping existing code over
  adding new.
- **Detector (Rust)** — `leaky-boundary`, `circular-dependency`, `god-module`,
  `cross-context-coupling` from the import graph; `init` generates its
  `ddd-council.json`.
- **Signals catalog** — §A context-boundary, §B strategic anti-patterns, §C language
  smells, §E design-stage smells (for `vet`). §D (tactical) is stubbed.

## Sequencing at a glance

```
Phase 1  Tactical spine (Track A)      aggregate → entities/value-objects → repositories → events
Phase 2  Engine grounding (Tracks B,C) schema-aware detection ; multi-language grammars
Phase 3  Meta verbs (Track D)          model ; distill ; audit
```

Phase 2 is independent of Phase 1 and may interleave; Phase 3 wants a rich spine to
work on, so it comes last.

---

## Phase 1 — Tactical spine (Track A · council / prose)

The next vertebrae after the strategic verbs. Each is its own spec → plan → build,
reusing the prose-verb pattern proven by `remediate` and `vet`. The **§D tactical
signals** in `signals.md` are built incrementally — each verb lands the signals it
needs.

Build in dependency / teaching order:

### 1. `aggregate` — the keystone
- **Scope:** identify aggregate roots and the **invariant each protects**; the
  consistency boundary; what's inside vs referenced by id. Lands the first §D signals:
  *anaemic domain model, god aggregate, transaction spanning aggregates, leaked
  invariant*.
- **Value:** the root concept everything tactical hangs off; "every aggregate names
  what it protects" is already a charter law with no verb to exercise it.
- **Depends on:** strategic verbs (contexts must exist first).
- **Size:** 1 spec. The §D signals are part of it.
- **Open questions:** how much to infer aggregate roots from code vs ask the operator;
  how `aggregate` cites an invariant that lives across several methods; tactical lens
  default (narrow/deep).

### 2. `entities` & `value-objects`
- **Scope:** classify the types an aggregate is composed of — identity (entity) vs
  value (value object); flag *primitive obsession at the boundary* (§C bridges here)
  and *entity/value misclassification* (§D).
- **Value:** the building blocks; sharpens the language in the code (types).
- **Depends on:** `aggregate` (you classify *within* an aggregate).
- **Size:** 1 spec (possibly two verbs, one spec — they're two sides of one question).
- **Open questions:** one verb or two; how to recommend a value-object extraction as a
  refactor (ties to the refactor-first law).

### 3. `repositories`
- **Scope:** assess persistence — one repository **per aggregate root**, not per
  entity; flag *repository-per-entity* and *domain logic leaking into the
  application/service layer* (§D).
- **Depends on:** `aggregate` (the root defines the repository).
- **Size:** 1 spec.
- **Open questions:** how much persistence/ORM detail to read; overlap with the
  detector's schema work (Track B) — coordinate the shared-table view.

### 4. `events`
- **Scope:** the domain events an aggregate **publishes**; flag *missing domain
  events* and *CRUD masking intent* (§C/§D — `updateStatus` where the domain says
  `ship()`/`cancel()`).
- **Depends on:** `aggregate`.
- **Size:** 1 spec.
- **Open questions:** events as integration contract across contexts (ties to
  `boundaries`); how to surface an event that *should* exist but doesn't.

---

## Phase 2 — Engine grounding (detector / JS + tree-sitter)

Independent of Phase 1; advances the "engine finds, council interprets" half.

### Track B — Schema-aware detection
- **Scope:** parse ORM models / migrations (sqlx, diesel) and flag the **accidental
  shared kernel via a shared table** — two contexts reading/writing one table. The one
  §B anti-pattern the engine can't yet see (it only reads the import graph).
- **Value:** closes a real blind spot; the highest-coupling relationship is the one
  created by accident through shared data.
- **Depends on:** the existing detector (`parse.mjs` grammar seam, `graph.mjs`,
  `config.mjs` context membership). Emits the same `Finding` shape.
- **Size:** 1 spec.
- **Open questions:** which ORMs/migration formats first; how to map a table to a
  context (extend `ddd-council.json`?); SQL parsing via a tree-sitter SQL grammar vs
  ORM-model parsing.

### Track C — Multi-language grammars
- **Scope:** generalise `parse.mjs` behind its grammar seam and add a second language
  (TypeScript or Python) so the detector isn't Rust-only.
- **Value:** breadth — most target repos aren't Rust.
- **Depends on:** the parse-layer isolation already designed for this.
- **Size:** 1 spec (per language after the first generalisation).
- **Open questions:** which language first; how import resolution differs (TS path
  aliases, Python packages) from Rust `use`; per-language public-surface convention.

---

## Phase 3 — Meta verbs (Track D · council / prose)

- **Scope:** `model` (synthesise the full model across contexts), `distill` (separate
  core / supporting / generic subdomains; focus effort on the core), `audit` (a
  full-repo sweep running the relevant verbs and rolling up findings).
- **Value:** synthesis over the now-rich spine; `distill` in particular is classic
  strategic DDD (core-domain focus).
- **Depends on:** a meaningful spine (Phases 1–2) to synthesise.
- **Size:** ~1 spec each; lower priority.
- **Open questions:** how `audit` composes the other verbs and de-dupes findings;
  whether `distill` needs operator input on what's core vs is inferable.

---

## Next action

Brainstorm **`aggregate`** (Phase 1.1) into a spec — the keystone that unlocks the
rest of the tactical track.

## Note

This roadmap is itself a planning artifact, not an implementable feature — it has no
implementation plan. Each track/verb gets its own brainstorm → spec → plan → build
cycle when its turn comes.
