# ddd-council

**A Domain-Driven Design council for your AI harness.** Convene a simulated room — a principal architect, a senior engineer, the user, and *your* domain experts — to map, critique, and ground bounded contexts in real code.

One skill, many DDD verbs. Point it at a repo (or a module, a schema, a notes doc) and the room reasons about your domain *from the code that's actually there*, not from vibes.

> Architecture inspired by [Impeccable](https://github.com/pbakaus/impeccable) — one user-invocable skill with commands underneath, rather than a pile of standalone skills polluting your `/` menu.

---

## What it does

`ddd-council` runs every command through **the same simulated room**, framed for the job at hand. The verbs cover the Domain-Driven Design spine, built up from strategic to tactical.

```
/ddd-council <verb> [target]
```

### v1 — strategic verbs

| Verb | What it does |
|---|---|
| `init` | Interview you and write `DOMAIN.md` — the product, the stack, known bounded contexts, your **domain experts**, the default lens. Read first by every other verb. |
| `map` | Generate a context map from intent: contexts, subdomains, and the relationships between them. |
| `critique` | **The headline.** Read the repo and surface the *de-facto* context map your code actually implies — versus what you intended. Flags the drift, cites the code. |
| `language` | Extract or refine the ubiquitous language for a context; flag where the code's names diverge. |
| `boundaries` | Assess bounded-context boundaries and name the relationship patterns: shared kernel, customer–supplier, conformist, anti-corruption layer, open-host, partnership, separate ways. |

Tactical verbs (`aggregate`, `entities`, `value-objects`, `events`, `repositories`, …) are on the roadmap.

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

`v0.1.0` — early. Strategic verbs and the Rust import-graph detector are in;
schema-aware detection (shared-kernel), tactical verbs, and multi-language
grammars come next.

## License

[Apache-2.0](LICENSE)
