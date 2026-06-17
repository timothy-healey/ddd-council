# ddd-council

**A Domain-Driven Design council for your AI harness.** Convene a simulated room — a principal architect, a senior engineer, the user, and *your* domain experts — to map, critique, vet, and remediate bounded contexts in real code.

One skill, many DDD verbs. Point it at a repo (or a module, a schema, a notes doc) and the room reasons about your domain *from the code that's actually there*, not from vibes.

> Architecture inspired by [Impeccable](https://github.com/pbakaus/impeccable) — one user-invocable skill with commands underneath, rather than a pile of standalone skills polluting your `/` menu.

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

The council works **refactor-first** — a shared law: when a fix can be made by reshaping existing code or by adding new code, it prefers the refactor and says why. Tactical verbs (`aggregate`, `entities`, `value-objects`, `events`, `repositories`, …) are on the roadmap.

### The detector (`cli/`)

The code-grounded half of the plugin. Where the council *reads* code and reasons,
`detect` *parses* it (Rust, via tree-sitter) and mechanically flags strategic
anti-patterns from the module graph — `leaky-boundary`, `circular-dependency`,
`god-module`, `cross-context-coupling` — each with an exact location. `critique`
runs it first and folds the findings in: the engine finds, the council interprets.
See [`cli/README.md`](cli/README.md).

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

`v0.1.0` — early. In: the strategic verbs, `vet` (pre-build review) and
`remediate` (refactor-first fixes), the refactor-first shared law, and the Rust
import-graph detector (with `init` generating its config). Next: schema-aware
detection (shared-kernel via shared tables), tactical verbs, and multi-language
grammars.

## License

[Apache-2.0](LICENSE)
