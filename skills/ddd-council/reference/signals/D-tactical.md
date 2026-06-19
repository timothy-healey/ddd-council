## D. Tactical signals (inside one aggregate)

The inside-a-context catalog, surfaced by the tactical verbs. The four root-level
signals land with `aggregate`; *entity/value-object misclassification* lands with
`entities`/`value-objects`; *repository-per-entity* and *domain logic in the
application/service layer* land with `repositories`; *missing domain events* lands with
`events`. The catalog is complete — every §D signal has an owning verb. Like §A/§C, these
are council-only — the engine reads the import graph and can't see invariants or
transaction scopes.

- **Anaemic domain model** — the aggregate is a bag of getters/setters and the
  behaviour that should protect its invariant lives in a service. *Cue:* a data class
  with a public setter for every field, paired with a `*Service`/`*Manager` that
  mutates it. *Why:* the invariant has no home; any caller can put the aggregate in an
  illegal state. *Confirm:* should the behaviour move onto the root, or is the model
  deliberately a DTO at this layer? *(signalId: `anaemic-domain-model`)*
- **God aggregate** — one root pulls in too much; the consistency boundary is far wider
  than the invariant needs. *Cue:* a root holding many unrelated child collections; a
  single load/save dragging in a large object graph; one transaction touching much of
  the schema. *Why:* contention and coupling — the whole graph locks and changes
  together for a rule that governs a fraction of it. *Confirm:* which children share the
  *true* invariant; what can be referenced by id instead of held inside? *(signalId: `god-aggregate`)*
- **Transaction spanning aggregates** — one transaction mutates two roots, or one
  aggregate's invariant is split across two transactions. *Cue:* a transaction scope (or
  unit of work) writing two roots' tables; a save of root A inside a loop over root B.
  *Why:* the aggregate is the unit of consistency — a transaction wider than one root
  couples their lifecycles; one narrower leaves an invariant half-enforced. *Confirm:*
  should the boundary move, or should the cross-root change become an event /
  eventual-consistency step? *(signalId: `transaction-spanning-aggregates`)*
- **Leaked invariant** — a rule the aggregate exists to protect is enforced (or left
  unenforced) outside it. *Cue:* the **gap** found while collecting an invariant's
  enforcement sites — a mutation path that changes state without re-checking the rule (a
  public setter, a raw SQL update, a service that bypasses the root). *Why:* the
  aggregate can't guarantee the invariant it's named for; the rule will eventually be
  violated on the unguarded path. *Confirm:* is the missing guard an oversight, or does
  the rule actually live in another context? *(signalId: `leaked-invariant`)*
- **Entity/value-object misclassification** — a type sits on the wrong side of the
  identity-vs-value axis: an entity with no meaningful identity (it's defined wholly by
  its attributes → really a value object), or a value object carrying an id and a mutable
  lifecycle it doesn't need. *Cue:* an id field never used for lookup or equality; a
  "value" type mutated in place across call sites; equality/`hashCode` over all fields on
  a type the system tracks individually. *Why:* equality and lifecycle semantics come out
  wrong — two equal values treated as distinct, or one tracked instance silently replaced
  — and invariants attach to the wrong unit. *Confirm:* does the business track this thing
  individually (entity), or care only about its value (value object)? *(signalId: `entity-value-object-misclassification`)*
- **Repository-per-entity** — a repository keyed to a *child* entity or value object
  instead of the aggregate root, or direct persistence of inside-composition that bypasses
  the root. *Cue:* a `*Repository` / `save(child)` for a type the aggregate's composition
  holds **inside** a root; an aggregate persisted as loose fragments rather than loaded and
  saved whole. *Why:* the root stops being the unit of consistency — children are mutated
  and persisted behind its back, so its invariant can't hold (ties to *leaked invariant*).
  *Confirm:* is this child really its own aggregate root, or should its access fold into
  the root's repository? *(signalId: `repository-per-entity`)*
- **Domain logic in the application/service layer (persistence seam)** — a domain decision
  encoded in application-service orchestration or query logic rather than on the domain
  model. *Cue:* a service that fetches a root, mutates it per a business rule, and saves,
  with the rule living in the service; a query embedding a domain decision (eligibility,
  status filtering, selection rules) that should be a named operation on the root.
  *Discriminator vs* **anaemic domain model:** if the smell is a data-class root (a public
  setter per field) paired with a `*Service`/`*Manager`, that is anaemic-model, not this;
  this signal needs a query- or orchestration-embedded rule. Where the same code trips
  both, cite anaemic-model. *Why:* the domain's behaviour and rules are invisible in the
  model and unprotected — any caller can skip them. *Confirm:* should the rule move onto the
  root / become a named operation, or is this legitimate application-level orchestration? *(signalId: `domain-logic-in-service-layer`)*
- **Missing domain events** — a domain-significant state transition that emits no event;
  the business moment is invisible, so nothing downstream can react to it. *Cue:* an
  aggregate state change (a status field set, a lifecycle step) with no event raised at the
  mutation site. *Discriminator vs* **§C CRUD masking intent:** §C fires when a named
  operation exists but is misnamed (the event is there, wearing a CRUD name like
  `updateStatus`); this §D signal fires when **no event is emitted at all**. Where one CRUD
  call is both, cite both. *Why:* the domain's real behaviour is silent — integrations, read
  models, and side effects can't hang off a moment that was never announced. *Confirm:* is
  this transition a business moment other parts of the system should know about, or an
  internal step with no observers? *(signalId: `missing-domain-events`)*
