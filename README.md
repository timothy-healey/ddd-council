# ddd-council

**A Domain-Driven Design council for your AI harness.** Convene a simulated room — a principal architect, a senior engineer, the user, and *your* domain experts — to map, critique, vet, and remediate bounded contexts in real code.

One skill, many DDD verbs. Point it at a repo (or a module, a schema, a notes doc) and the room reasons about your domain *from the code that's actually there*, not from vibes.

> One user-invocable skill with commands underneath, rather than a pile of standalone skills cluttering your `/` menu.

---

## What it does

`ddd-council` runs every command through **the same simulated room**, framed for the job at hand. The verbs cover the Domain-Driven Design spine, built up from strategic to tactical.

```
/ddd-council <verb> [target]
```

### The verbs

**Strategic — model the domain:**

| Verb | What it does |
|---|---|
| `init` | Interview you and write `DOMAIN.md` — the product, the stack, known bounded contexts, your **domain experts**, the default lens. Read first by every other verb. For code repos it also writes the `ddd-council.json` the detector needs. |
| `map` | Generate a context map from intent: contexts, subdomains, and the relationships between them. |
| `language` | Extract or refine the ubiquitous language for a context; flag where the code's names diverge. |
| `boundaries` | Assess bounded-context boundaries and name the relationship patterns: shared kernel, customer–supplier, conformist, anti-corruption layer, open-host, partnership, separate ways. |

**Review & remediate — evaluate, then fix:**

| Verb | What it does |
|---|---|
| `critique` | **The headline.** Review *existing code*: surface the *de-facto* context map your code implies versus what you intended, flag the drift, cite the code. |
| `vet` | Review a *proposed change* — a plan or spec — **before** it's built: boundary fit, ubiquitous language, refactor-before-add, contradictions with declared intent. Cites design-stage smells; findings amend the plan. |
| `remediate` | Work a critique's findings to fixes — **refactor-first**, applied inline under TDD; substantial new additions escalate to a written plan. Round-trips resolution status back into the critique artifact. |

**Tactical — model inside an aggregate:**

| Verb | What it does |
|---|---|
| `aggregate` | Name a context's aggregate roots, the **invariant** each protects (statement → enforcement sites → gaps), the consistency boundary, and what's inside vs referenced by id. |
| `entities` / `value-objects` | Classify an aggregate's composition along the identity-vs-value axis; flag entity/value misclassification and primitive obsession at the boundary. |
| `repositories` | Assess persistence — one repository **per aggregate root**, dealing in whole aggregates; flag repository-per-entity and domain logic leaking into the service layer. |
| `events` | Assess the domain events an aggregate **publishes** — the named business moment per state transition; flag missing domain events and CRUD masking intent. |

Each tactical verb produces a *model + findings* artifact that round-trips through `remediate`. The council works **refactor-first** — a shared law: when a fix can be made by reshaping existing code or by adding new code, it prefers the refactor and says why.

**Meta — synthesise across the spine:**

| Verb | What it does |
|---|---|
| `distill` | Classify the problem-space subdomains **core / supporting / generic** and map them onto your contexts; flag mismatches (a core subdomain spread thin, a generic one over-built) and recommend where to invest. The single owner of subdomain classification; strategic, no `remediate` round-trip. |
| `model` | Synthesise the **whole-system model** across contexts by weaving the per-verb artifacts (the map, the distillation, the aggregate/repository/event models) into one coherent picture; flag cross-artifact **coherence smells** on the seams — an unacknowledged term collision, a map reference with no model behind it, a slice that contradicts a named relationship. Descriptive synthesis plus those seam findings only. |
| `audit` | A whole-repo **findings health report**: run the detector, harvest every verb's existing findings, **de-dup them into clusters** (one entry per real issue, by location + contexts, carrying every signal that flagged it), prioritise — weighted toward the core — and list coverage gaps. `--fill` orchestrates the verbs that haven't run yet. Aggregates everything; adds no new signals. |

### The detector (`cli/`)

The code-grounded half of the plugin. Where the council *reads* code and reasons,
`detect` *parses* it — **Rust** (`tree-sitter-rust`) and **TypeScript**
(`tree-sitter-typescript`), behind a swappable language-module seam — and mechanically
flags strategic anti-patterns: from the import/module graph, `leaky-boundary`,
`circular-dependency`, `god-module`, `cross-context-coupling`; and from the persistence
layer (diesel + sqlx tables, Sequelize models, and `.sql` migrations),
`accidental-shared-kernel` — a DB table two contexts read/write that none owns. That rule
is **column-aware**: when it can resolve which columns each context touches, a table whose
contexts touch *disjoint* columns is downgraded to a low-severity "colocated concerns, split
it" rather than a high-coupling shared-data kernel. Each finding carries an exact location.
`critique` runs it first and folds the findings in: the engine finds, the council interprets.
See [`cli/README.md`](cli/README.md).

Two pinned example repos exercise the detector end-to-end, each with deliberately planted
patterns and a `PLANTED.md` answer key:
[`ddd-council-example-rust`](https://github.com/timothy-healey/ddd-council-example-rust)
(Rust/diesel) and
[`ddd-council-example-ts`](https://github.com/timothy-healey/ddd-council-example-ts)
(TypeScript/Sequelize).

---

## The Room

The value is the friction between distinct voices:

- **Principal architect** — seams, dependency direction, core vs supporting vs generic.
- **Senior engineer** — aggregates, invariants, persistence, the awkward transaction.
- **Domain expert(s)** — *you define who they are.* One or many, each speaking for a context with its own real-world vocabulary. They can disagree; that's how an overloaded term or a wrong boundary gets exposed.
- **User** — the job-to-be-done, narrated as concrete action.

**You are canon.** When the room hits a domain fact it can't settle, it pauses and asks you (with a flagged recommendation when it's confident), then resumes on your answer. It never invents domain truth.

---

## Install

```
/plugin marketplace add timothy-healey/ddd-council
/plugin install ddd-council
```

Then, in a project:

```
/ddd-council init
/ddd-council critique
```

---

## Status

`v0.1.0` — early, but the **full DDD verb spine is complete**. In: the strategic verbs;
`vet` (pre-build review) and `remediate` (refactor-first fixes); the **full tactical
spine** (`aggregate`, `entities`/`value-objects`, `repositories`, `events`); **all three
meta verbs** (`distill` subdomain classification, `model` whole-system synthesis, `audit`
findings health report); the refactor-first shared law; and a **multi-language detector** —
Rust and TypeScript — that flags both import-graph anti-patterns and the column-aware,
schema-aware `accidental-shared-kernel` (shared-table coupling, across diesel + sqlx +
Sequelize), with `init` generating its config and two planted example repos guarding it.

## License

[Apache-2.0](LICENSE)
