## B. Strategic anti-patterns (the boundary is wrong or leaking)

- **Accidental shared kernel** — two contexts read/write the *same* table or share
  a model class, without a declared shared-kernel agreement. *Cue:* two modules'
  queries/ORM target one table; a model imported across a context line. *Why:* the
  highest-coupling relationship, created by accident — a change in one silently
  breaks the other. *Confirm:* deliberate shared kernel, or should it split with an
  owner + a published interface? *Engine:* the `detect` engine emits this as
  `signalId: accidental-shared-kernel` — a diesel table ≥2 contexts touch that none
  owns, severity high when a non-owner writes it (declare a deliberate kernel with
  `tables.<table>.sharedKernel = true`).
  *Column-level:* when the engine can resolve which columns each context touches, an **unowned**
  table whose contexts touch **disjoint** columns is emitted at **low** severity and reframed as
  *colocated concerns — split the table* (shared schema, not shared data); overlapping columns,
  unresolved columns, and ownership violations keep high/medium.
  *Declared kernels are honoured (council-side).* The two declarations differ in how the engine
  treats them, so the council's move differs:
  - **`sharedKernel: true` → the engine suppresses; the council *names* it.** The table is an
    intentional **Shared Kernel**, not drift. The engine raises no finding, so the council draws the
    relationship the engine left implicit: a named Shared Kernel edge between the sharing contexts on
    the de-facto map. Do not raise `accidental-shared-kernel` for it.
  - **Declared `owner: X` → the engine still fires; the council *reframes* it.** `owner` is
    messaging-only (never suppresses), so the engine still emits the finding. The council reframes it
    as **Customer-Supplier** (X supplies/upstream): a non-owner write is a customer-supplier
    violation (a downstream writing upstream's schema), not an accidental kernel.
  - Only a *declared* kernel/owner is honoured. A *derived* owner (the engine's `definedInContext`,
    undeclared) stays an `accidental-shared-kernel` finding — declared = canon = honour; derived =
    surface for the operator to declare.
  This honouring binds **any verb** reasoning about a shared kernel: `critique` applies it directly;
  `model` (§G3) and `audit` inherit it because the upstream `critique`/`map` artifacts already named
  the declared relationship (neither reads the config).
- **Leaky boundary** — a module reaches into another context's *internals* rather
  than its public surface. *Cue:* deep imports (`billing/internal/...`), calling
  private/helper functions across the line, depending on another context's DB rows.
  *Why:* the boundary exists in name only; the foreign model has leaked in. *Confirm:*
  what's the intended public surface of the imported context? *Engine:* emitted as
  `signalId: leaky-boundary` — an import that crosses a context line into an `internal`
  path rather than the context's `api` surface.
- **Missing anti-corruption layer** — a context consumes an upstream/external model
  with no translation, letting foreign vocabulary spread inward. *Cue:* external
  DTOs / third-party types used directly in domain code; gateway responses passed
  around unwrapped. *Why:* the upstream's language corrupts the downstream's. *Confirm:*
  should this seam get an ACL to protect the local language? *(signalId: `missing-acl`)*
- **Circular dependency between contexts** — A depends on B and B on A. *Cue:* an
  import cycle across context lines. *Why:* there's no clear upstream/downstream;
  they can't evolve or deploy independently. *Confirm:* which way *should* the
  dependency point? *Engine:* emitted as `signalId: circular-dependency` — a cycle
  detected in the cross-context import graph.
- **Chatty coupling** — two contexts exchange many fine-grained calls to do one
  job. *Cue:* a single use-case making N cross-context calls; ping-pong between
  modules. *Why:* the boundary is in the wrong place or missing a coarser contract.
  *Confirm:* should responsibility move, or a coarser operation be published? *Engine:*
  emitted as `signalId: cross-context-coupling` — a single file importing from
  ≥N distinct contexts (threshold: `chattyFanOut` in `ddd-council.json`).
- **God module / hub** — one module almost everything imports. *Cue:* a `common`,
  `core`, `utils`, or `shared` module with very high fan-in spanning contexts. *Why:*
  it's an undeclared shared kernel and a change-amplifier. *Confirm:* what really
  belongs here (truly generic) vs what's a context's model hiding in `shared`? *Engine:*
  emitted as `signalId: god-module` — a module imported by ≥N files across ≥M distinct
  contexts (thresholds: `godModuleFanIn` / `godModuleContexts` in `ddd-council.json`).
- **Distributed monolith** — separate services/modules that can't change without
  changing each other in lockstep. *Cue:* cross-service shared schemas, synchronous
  call chains, coordinated deploys. *Why:* the cost of distribution with none of the
  independence. *Confirm:* where are the true seams? *(signalId: `distributed-monolith`)*
- **Language-less context** — a module with no vocabulary of its own; pure CRUD over
  another context's concepts. *Cue:* names like `DataManager`, generic
  `create/update/delete` over foreign entities, no domain terms. *Why:* it may not be
  a real context — or it's a real one whose language was never found. *Confirm:*
  fold it in, or surface its missing language? *(signalId: `language-less-context`)*
