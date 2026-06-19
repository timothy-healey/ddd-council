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
- **Detector** — Node.js ESM (`.mjs`, Node ≥18). Multi-language behind a language-module
  seam (`cli/src/lang/`): Rust via `tree-sitter-rust`, TypeScript via `tree-sitter-typescript`.
  Builds an import/module graph, runs rule modules (`cli/src/`).

## Bounded contexts
_Inferred from repo structure — confirm/redraw with `critique` or `boundaries`._
- **Council / Deliberation** — the simulated room and its verb playbooks; turns
  intent + code into reasoned DDD findings. Language: *room, voice, lens,
  register, verb, operator, signal.*
- **Detection engine** — `parse → graph → rules`; mechanically flags strategic
  anti-patterns from the module graph. Language: *import, module, context
  membership, finding, SCC, fan-in/fan-out, threshold, binding.*
- **Context configuration** (candidate seam) — `ddd-council.json` ⇄ `DOMAIN.md`,
  and the shared **Finding** shape that both halves emit. Looks like the
  published language / shared kernel between Council and Detector; worth naming
  explicitly when `boundaries` runs. Track B adds the first named terms here:
  `owner` (config override, messaging-only) and `sharedKernel` (declared-kernel
  suppression, honoured Detector-side in v1; Council-side honouring is a named
  follow-up). `owner` and the engine-derived `definedInContext` are one concept —
  the table's owning context — in two provenances (carried inline here, not in the
  gitignored `docs/`).
  Track C publishes the **language-module interface** to this seam — the contract
  `{ extensions, parseFile → { imports, tableDefs, tableAccesses }, resolveImport → {…}|null }`
  (owner: Detection engine; a new language conforms to it). Seam term clarifications: `module`
  is **Rust-resolution only** (TS resolves imports by path via `contextForFile`); `publicModules`
  is **cross-language** (Rust submodules ↔ TS public subdirs/barrels); `tsconfig` (baseUrl/paths)
  is a **TS-only** resolution input; `isTouch` is the language-neutral access flag (a real table
  touch vs a universe-seeding import).
  Track C-SQLx adds two seam terms (owner: Detection engine). A **schema source**
  is a second participant kind alongside the language module: it provides
  `{ extensions, parseFile → { tableDefs } }` only — no imports, no `resolveImport`
  — to seed the table universe (`lang/sql.mjs`, `.sql` migrations, is the first).
  `defKind` (`'declaration' | 'migration'`) is the def-site provenance flag on
  `tableDefs`, sibling of `isTouch` on `tableAccesses`: an in-code `'declaration'`
  is a table's home and supersedes a `'migration'` def-site (graph.mjs), so a
  migration-only (SQLx) table gets a context-less owner — the same "owned by none"
  semantics Diesel gets from `schema.rs`.

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
The seam terms in use are carried inline above (Bounded contexts → Context
configuration): `owner`, `sharedKernel`, and the `owner`/`definedInContext` one-concept
ruling. A fuller glossary is the `language` verb's output of record at
`docs/ubiquitous-language.md` — kept local (`docs/` is gitignored), so it is absent
from a clean checkout; the canonical home for any term load-bearing on the seam is here.

- `distill` is the authority on the **subdomain** classification (core/supporting/generic); its
  output of record is `docs/distill-<date>.md`, and its findings use the §F distillation smells
  (`core-fragmented`, `mixed-subdomain-context`, `generic-over-built`, `under-invested-core`,
  `gold-plated-supporting`). `map`'s per-context tag defers to it.
- `model` synthesises the **whole-system model** across contexts from the per-verb artifacts (the
  *slices*); its output of record is `docs/model-<date>.md`, and its findings use the §G
  synthesis/coherence smells (`unacknowledged-term-collision`, `orphan-in-map`,
  `slice-contradiction`) — cross-artifact contradictions only. `model` owns the *seams between
  slices*, not any slice's interior; the findings roll-up is `audit`'s job.
- `audit` is the whole-repo **findings health report**; its output of record is
  `docs/audit-<date>.md`. It is the cross-half consumer of the **Council↔Detector seam** — it runs
  the detector (`ddd-council-detect --json`) and folds its `Finding[]` in alongside the harvested
  council-artifact findings, de-duped into *clusters* by location + context-set. Aggregates §A–§G
  (no new signals); the findings roll-up `model`'s §G feeds into.
