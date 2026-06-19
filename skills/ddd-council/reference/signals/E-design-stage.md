## E. Design-stage smells (reviewing a proposed change)

Used by `vet` to pressure-test a *plan or spec* before code exists. The cues are in
the proposal's prose, not in code — each smell names its code-stage sibling (§A–§C)
so the catalog is one vocabulary across stages. A finding cites the **plan section**
(and affected existing code where relevant).

- **Cross-boundary dependency by design** — the plan has one context reach past
  another's public surface, or places a concept in the wrong context. *Cue:* a task
  that imports/calls another context's internals, or adds a type to a context that
  doesn't own the concept. *Why:* bakes in a leaky boundary before it's written.
  *Confirm:* what is the intended public surface? (→ §B leaky-boundary) *(signalId: `cross-boundary-dependency`)*
- **Unowned shared type** — the plan introduces a type/module several contexts will
  depend on, without naming it as a kernel with an owner. *Cue:* a "shared"/"common"
  helper added for two-plus contexts; a DTO passed across a context line. *Why:* an
  accidental shared kernel / god module, designed in. *Confirm:* a deliberate
  published kernel with an owner, or split it? (→ §B accidental shared kernel / god module) *(signalId: `unowned-shared-type`)*
- **Off-language naming** — new names that don't match the ubiquitous language, or
  technical placeholders for domain concepts. *Cue:* `Manager`/`Helper`/`Processor`/
  `Data`/`Info`, or a term `DOMAIN.md` doesn't use. *Why:* the plan would put the
  wrong language in the code. *Confirm:* what does the domain expert call this? (→ §C) *(signalId: `off-language-naming`)*
- **Adds where a refactor fits** — the plan proposes new code where reshaping existing
  code would carry the model. *Cue:* a new module/abstraction beside code that already
  does the job; duplication of an existing concept. *Why:* violates the *Refactor
  before you add* law; grows surface area needlessly. *Confirm:* can the existing code
  be reshaped instead? *(No code-stage sibling — only visible at plan stage.)* *(signalId: `adds-where-refactor-fits`)*
- **Contradicts `DOMAIN.md`/spec** — the design conflicts with the declared contexts,
  language, or its own spec. *Cue:* a task that renames a settled concept, merges
  contexts the map keeps apart, or diverges from the approved spec. *Why:* drift,
  designed in before a line is written. *Confirm:* which is right — the plan or the
  declared intent? *(No code-stage sibling — only visible at plan stage.)* *(signalId: `contradicts-domain`)*
- **Splits what changes together / couples what shouldn't** — the plan separates
  things that must change in lockstep, or couples things that should stay apart.
  *Cue:* one feature spread across modules that always co-change; a synchronous chain
  across new seams. *Why:* a distributed monolith, by design. *Confirm:* where are the
  true seams? (→ §B distributed monolith) *(signalId: `splits-cohesive-work`)*
