# Signals — what to look for

*The council's detection catalog. Shared across verbs. Every critique claim should
trace to a signal here, cited in code.*

This is the concrete answer to "what does the room actually look for?" It is also
the **rule spec for the `detect` engine** — each signal is written so it can be
checked mechanically. §B is mechanized today; §A and §C are council-only until
they are.

**Council ↔ Detector is a partnership.** The council authors this spec (upstream
of the engine here) *and* consumes the engine's findings (the engine is upstream
there) — so the two evolve together. Their contract surface is §B below plus the
`Finding` shape, defined canonically in `cli/src/finding.mjs`. Read by `critique`,
`boundaries`, and `language`; informs the repo scan in `map`.

Each entry: **what it looks like in code** (the cue) · **why it matters** ·
**confirm with the operator** (the judgment a machine can't make alone).

A signal is a *prompt to investigate*, not a verdict. Coupling can be deliberate;
a shared table can be a legitimate shared kernel. The room's job is to surface the
signal with evidence and let the operator rule on intent.

---

## A. Context-boundary signals (where are the lines?)

Positive cues that a bounded context exists — used by `map` and `critique` to
cluster modules into contexts.

- **Cohesion cluster** — a set of modules that import each other heavily but the
  rest of the repo lightly. *Cue:* dense internal edges, sparse external ones.
  *Why:* high-cohesion/low-coupling clusters are candidate contexts. *Confirm:*
  does this cluster correspond to a real area of the business?
- **Language shift** — the vocabulary changes between two areas (one says
  `Appointment`, another says `Booking` for the same thing; or the same word means
  different things). *Cue:* term boundaries in type/file names. *Why:* a language
  shift is the surest sign of a context boundary. *Confirm:* are these genuinely
  different concepts, or drift?
- **Separate persistence** — a module owns its own tables/store and others don't
  touch them directly. *Cue:* table ownership, schema namespacing. *Why:* data
  ownership tends to track context ownership. *Confirm:* intentional?
- **Independent change cadence** — areas that deploy / version / change on different
  rhythms. *Cue:* commit history clustering, separate release units. *Why:* what
  changes together belongs together. *Confirm:* with the operator's roadmap.

## B. Strategic anti-patterns (the boundary is wrong or leaking)

- **Accidental shared kernel** — two contexts read/write the *same* table or share
  a model class, without a declared shared-kernel agreement. *Cue:* two modules'
  queries/ORM target one table; a model imported across a context line. *Why:* the
  highest-coupling relationship, created by accident — a change in one silently
  breaks the other. *Confirm:* deliberate shared kernel, or should it split with an
  owner + a published interface?
- **Leaky boundary** — a module reaches into another context's *internals* rather
  than its public surface. *Cue:* deep imports (`billing/internal/...`), calling
  private/helper functions across the line, depending on another context's DB rows.
  *Why:* the boundary exists in name only; the foreign model has leaked in. *Confirm:*
  what's the intended public surface of the imported context?
- **Missing anti-corruption layer** — a context consumes an upstream/external model
  with no translation, letting foreign vocabulary spread inward. *Cue:* external
  DTOs / third-party types used directly in domain code; gateway responses passed
  around unwrapped. *Why:* the upstream's language corrupts the downstream's. *Confirm:*
  should this seam get an ACL to protect the local language?
- **Circular dependency between contexts** — A depends on B and B on A. *Cue:* an
  import cycle across context lines. *Why:* there's no clear upstream/downstream;
  they can't evolve or deploy independently. *Confirm:* which way *should* the
  dependency point?
- **Chatty coupling** — two contexts exchange many fine-grained calls to do one
  job. *Cue:* a single use-case making N cross-context calls; ping-pong between
  modules. *Why:* the boundary is in the wrong place or missing a coarser contract.
  *Confirm:* should responsibility move, or a coarser operation be published?
- **God module / hub** — one module almost everything imports. *Cue:* a `common`,
  `core`, `utils`, or `shared` module with very high fan-in spanning contexts. *Why:*
  it's an undeclared shared kernel and a change-amplifier. *Confirm:* what really
  belongs here (truly generic) vs what's a context's model hiding in `shared`?
- **Distributed monolith** — separate services/modules that can't change without
  changing each other in lockstep. *Cue:* cross-service shared schemas, synchronous
  call chains, coordinated deploys. *Why:* the cost of distribution with none of the
  independence. *Confirm:* where are the true seams?
- **Language-less context** — a module with no vocabulary of its own; pure CRUD over
  another context's concepts. *Cue:* names like `DataManager`, generic
  `create/update/delete` over foreign entities, no domain terms. *Why:* it may not be
  a real context — or it's a real one whose language was never found. *Confirm:*
  fold it in, or surface its missing language?

## C. Ubiquitous-language smells (the names lie)

- **One concept, two names** — the same thing called different things in different
  places. *Cue:* `User` / `Member` / `Account` used interchangeably. *Why:* readers
  can't trust names; merges hide bugs. *Confirm:* which name wins (operator/expert)?
- **One name, two concepts** — a single term carrying two meanings. *Cue:* `Order`
  meaning both the cart and the fulfilment record. *Why:* the model is conflating
  things; usually a hidden boundary. *Confirm:* split and rename both.
- **Technical name for a domain concept** — `Manager`, `Helper`, `Processor`,
  `Data`, `Info`, `Util` standing in for a real domain word. *Cue:* those suffixes on
  classes that hold domain logic. *Why:* the real concept is unnamed; the language
  isn't in the code. *Confirm:* what does the domain expert call this?
- **CRUD masking intent** — `updateStatus(x)` where the domain action is
  `cancel()` / `ship()` / `refund()`. *Cue:* generic setters/status flips in place of
  named domain operations. *Why:* the domain's real behaviour and its events are
  invisible. *Confirm:* what are the named operations and the events they emit?
- **Primitive obsession at the boundary** — domain concepts passed as bare
  strings/ints/maps. *Cue:* `string email`, `int money`, untyped dicts crossing
  context lines. *Why:* no place for the concept's rules to live; invariants scatter.
  *Confirm:* which primitives are really value objects? *(Bridges into tactical.)*

## E. Design-stage smells (reviewing a proposed change)

Used by `vet` to pressure-test a *plan or spec* before code exists. The cues are in
the proposal's prose, not in code — each smell names its code-stage sibling (§A–§C)
so the catalog is one vocabulary across stages. A finding cites the **plan section**
(and affected existing code where relevant).

- **Cross-boundary dependency by design** — the plan has one context reach past
  another's public surface, or places a concept in the wrong context. *Cue:* a task
  that imports/calls another context's internals, or adds a type to a context that
  doesn't own the concept. *Why:* bakes in a leaky boundary before it's written.
  *Confirm:* what is the intended public surface? (→ §B leaky-boundary)
- **Unowned shared type** — the plan introduces a type/module several contexts will
  depend on, without naming it as a kernel with an owner. *Cue:* a "shared"/"common"
  helper added for two-plus contexts; a DTO passed across a context line. *Why:* an
  accidental shared kernel / god module, designed in. *Confirm:* a deliberate
  published kernel with an owner, or split it? (→ §B accidental shared kernel / god module)
- **Off-language naming** — new names that don't match the ubiquitous language, or
  technical placeholders for domain concepts. *Cue:* `Manager`/`Helper`/`Processor`/
  `Data`/`Info`, or a term `DOMAIN.md` doesn't use. *Why:* the plan would put the
  wrong language in the code. *Confirm:* what does the domain expert call this? (→ §C)
- **Adds where a refactor fits** — the plan proposes new code where reshaping existing
  code would carry the model. *Cue:* a new module/abstraction beside code that already
  does the job; duplication of an existing concept. *Why:* violates the *Refactor
  before you add* law; grows surface area needlessly. *Confirm:* can the existing code
  be reshaped instead? *(No code-stage sibling — only visible at plan stage.)*
- **Contradicts `DOMAIN.md`/spec** — the design conflicts with the declared contexts,
  language, or its own spec. *Cue:* a task that renames a settled concept, merges
  contexts the map keeps apart, or diverges from the approved spec. *Why:* drift,
  designed in before a line is written. *Confirm:* which is right — the plan or the
  declared intent? *(No code-stage sibling — only visible at plan stage.)*
- **Splits what changes together / couples what shouldn't** — the plan separates
  things that must change in lockstep, or couples things that should stay apart.
  *Cue:* one feature spread across modules that always co-change; a synchronous chain
  across new seams. *Why:* a distributed monolith, by design. *Confirm:* where are the
  true seams? (→ §B distributed monolith)

---

## D. Tactical signals — *roadmap*

Added when the tactical verbs land (`aggregate`, `entities`, `value-objects`,
`events`, `repositories`). Will cover: anaemic domain model, god aggregate,
transaction spanning aggregates (and aggregate split across transactions),
entity/value-object misclassification, leaked invariant, repository-per-entity
(instead of per-aggregate root), domain logic in the application/service layer,
and missing domain events.

---

## Using this catalog

- **Cite or cut.** A signal reported without a code location is not a finding.
- **Severity, not absolutes.** Rank by blast radius (how much breaks if this is
  wrong), not by how many rules tripped.
- **Intent is the operator's call.** Signals surface candidates; the operator rules
  on whether coupling/sharing was deliberate.
- **Same shape as the engine.** The finding shape is defined canonically in
  `cli/src/finding.mjs` (the `Finding` typedef): `signalId · severity · file ·
  line · message · suggestedMove`. Council and engine both emit it — cite that
  file rather than restating the fields, so the shared kernel can't drift.
