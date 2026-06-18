# DOMAIN.md

## Product
A Domain-Driven Design council for AI harnesses: one user-invocable skill that
convenes a simulated room (architect, engineer, operator-defined domain experts,
user) to map, critique, and ground bounded contexts in real code — paired with a
deterministic detector that mechanically flags strategic anti-patterns. For
developers doing DDD strategic design.

## Stack
Two halves, two stacks:
- **Council** — Markdown skill + per-verb playbooks (`skills/ddd-council/SKILL.md`,
  `skills/ddd-council/reference/`), with thin bash/JSON glue (`scripts/`).
- **Detector** — Node.js ESM (`.mjs`, Node ≥18). Parses Rust via `tree-sitter` +
  `tree-sitter-rust`, builds a `use`/module graph, runs rule modules (`cli/src/`).

## Bounded contexts
_Inferred from repo structure — confirm/redraw with `critique` or `boundaries`._
- **Council / Deliberation** — the simulated room and its verb playbooks; turns
  intent + code into reasoned DDD findings. Language: *room, voice, lens,
  register, verb, operator, signal.*
- **Detection engine** — `parse → graph → rules`; mechanically flags strategic
  anti-patterns from the module graph. Language: *import, module, context
  membership, finding, SCC, fan-in/fan-out, threshold.*
- **Context configuration** (candidate seam) — `ddd-council.json` ⇄ `DOMAIN.md`,
  and the shared **Finding** shape that both halves emit. Looks like the
  published language / shared kernel between Council and Detector; worth naming
  explicitly when `boundaries` runs. Track B adds the first named terms here:
  `owner` (config override, messaging-only) and `sharedKernel` (declared-kernel
  suppression, honoured Detector-side in v1; Council-side honouring is a named
  follow-up). `owner` and the engine-derived `definedInContext` are one concept —
  the table's owning context — in two provenances. See `docs/ubiquitous-language.md`.

## Domain experts
_Seeded from general knowledge; refine the background/vocabulary as the operator
corrects. Operator (Tim) is the real authority on product intent._
- **DDD strategist** — speaks for *Council / Deliberation* · Evans/Vernon-style
  strategic-design authority.
  - vocabulary & rules: bounded context, ubiquitous language, context-map
    relationship patterns (shared kernel, customer–supplier, conformist, ACL,
    open-host, partnership, separate ways), subdomain classification
    (core/supporting/generic), strategic-before-tactical.
- **Static-analysis engineer** — speaks for *Detection engine* · compiler-frontend
  / tooling authority.
  - vocabulary & rules: tree-sitter grammar, import resolution, dependency graph,
    Tarjan SCC for cycles, fan-in/fan-out thresholds, false-positive rate, exit
    code as CI signal.
- **AI-harness / prompt designer** — speaks for *how the council runs inside a
  model*.
  - vocabulary & rules: skill routing, register/lens as prompt levers, what a
    "simulated room" can and can't reliably do, keeping voices distinct, pause
    discipline (never invent domain fact).

## Lens
default: strategic · critique · workshop

## Focus
—

## Ubiquitous language
See `docs/ubiquitous-language.md`.
