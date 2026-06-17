# Lens: strategic

*Loaded when the active lens is strategic. Shapes how much the room reads and at what depth.*

Strategic design is about the **shape of the whole system** — where the seams are, which contexts exist, who owns which facts, and how the contexts relate. The verbs that run under this lens: `map`, `critique`, `boundaries`, and `language` at the cross-context level.

## Source breadth

**Wide and shallow.** Read across the whole repo / system, but don't go deep into any one file:

- Directory and module structure — the top-level decomposition is the first hypothesis about contexts.
- The import / dependency graph between modules — who depends on whom, and in which direction.
- Cross-module data sharing — shared database tables, shared models, shared types.
- Integration surfaces — APIs, message/event topics, RPC clients, the seams where one context talks to another.
- Naming at the boundaries — where the same word means different things in different modules (a context boundary in disguise).

## What the room is looking for

- **Contexts** — clusters that change together and share a language.
- **Subdomain classification** — core (the reason the product wins), supporting, generic.
- **Relationships** — and their direction; the upstream/downstream power dynamic.
- **Seams under strain** — a module everything imports, a model shared across boundaries, a word that won't hold one meaning.

## Hand-off to tactical

When the room wants to go deep on one context's internals (aggregates, invariants, events), switch to the tactical lens scoped to that context. Strategic establishes *where the lines are*; tactical works *inside one line*.
