# Lens: tactical

*Loaded when the active lens is tactical. Shapes how much the room reads and at what depth.*

Tactical design is about the **inside of one bounded context** — its aggregates, the invariants they protect, the entities and value objects, the domain events, and how it all persists. The verbs that run under this lens: `aggregate`, `entities`, `value-objects`, `events`, `repositories`, and the like (roadmap).

## Source breadth

**Narrow and deep.** Read one module / context / aggregate thoroughly:

- The domain types in that context — their fields, methods, and relationships.
- Where behaviour lives — rich methods on the model, or anaemic data bags with logic in services?
- The invariants — what the code actually enforces, and where (constructor, setter, service, DB constraint).
- Persistence — how the aggregate maps to storage; whether the transactional boundary matches the aggregate boundary.
- Events emitted and consumed within the context.

## What the room is looking for

- **Aggregate roots** and the one invariant each exists to protect.
- **Entity vs value object** — identity-and-lifecycle vs defined-by-value — and any misclassification.
- **Anaemic models** — all getters/setters, behaviour elsewhere.
- **Leaked invariants** — a rule the aggregate should own but that's enforced (or not) outside it.
- **Transactional mismatch** — a single transaction spanning two aggregates, or one aggregate split across two.

## Prerequisite

Tactical work assumes the context is already named and bounded. If the boundary
is still fuzzy, drop back to the strategic lens (`map` / `boundaries`) first —
*strategic before tactical* is a shared law.
