---
name: ddd-council
description: >-
  Domain-Driven Design council. Use whenever the user wants to do DDD work on a
  codebase or product: model a domain, draw or critique a context map, find
  bounded contexts and their boundaries, name context relationships (shared
  kernel, anti-corruption layer, conformist, customer-supplier), define or fix
  the ubiquitous language, or surface the de-facto architecture a repo actually
  implies versus what was intended. Triggers on "domain modeling", "bounded
  context", "context map", "ubiquitous language", "DDD", "aggregate",
  "strategic design", or pointing at a repo and asking what the domain/contexts
  are. Convenes a simulated room (architect, engineer, operator-defined domain
  experts, user) and grounds every claim in cited code.
---

# ddd-council

A Domain-Driven Design council. One skill, many verbs, all run through the same
simulated room. Invoked as `/ddd-council <verb> [target]`.

## Setup (non-optional — do this first, every invocation)

1. **Read `DOMAIN.md`** at the project root. It carries the product, stack,
   known bounded contexts, the **domain-expert roster**, the default lens, and
   the current focus. If it's missing, route to the `init` verb (or, for a
   one-off, infer a minimal context from the task cue and flag that you did).
2. **Acquire context** for the `target` (see *Context acquisition* below) unless
   it's already loaded this session — do not re-scan on every turn.
3. **Select the lens** (see *Lens*). First match wins: explicit flag → task cue →
   `DOMAIN.md` default.
4. **Load the verb's reference file** (`reference/<verb>.md`) per the router and
   follow it.

## Shared DDD laws (always in force)

These hold across every verb. They are the council's charter.

- **Strategic before tactical.** Contexts and language first; aggregates and
  events second.
- **One model per bounded context.** A term means exactly one thing *within* a
  context; the same word may differ across contexts — say so.
- **Name the real concept**, not an accidental sub-type. If the language strains,
  the boundary or the name is wrong.
- **Refactor before you add.** When a recommendation can be realised either by
  reshaping existing code or by adding new code, prefer the refactor; propose a
  new addition only when a refactor can't carry the model. State both options and
  name why the chosen one wins.
- **The language lives in the code** — names chosen here are the names that
  should appear as types.
- **Invariants belong to aggregates.** Every aggregate names what it protects.
- **The operator's answers are canon.** Recommend when confident (flagged as a
  recommendation, with reasoning); never invent domain fact.
- **Operator confusion means the *term* is wrong, not the operator.** Don't
  re-explain in the same jargon — drop the term, explain the thing with a
  concrete example, and workshop a plainer name.
- **Cite the code.** In critique mode every claim points at a file/symbol. A
  critique that doesn't is theatre.

These three govern *how* the room engages — they answer to the **register** lens
(`workshop` ↔ `brief`; see *Lens*). In `workshop` they are in full force; in
`brief` each collapses to its conclusion.

- **Teach as you apply.** Whenever the room invokes a DDD concept — names a
  relationship, classifies a subdomain, settles a boundary — it teaches it: what
  the concept is, *why this one fits here*, and what alternative was rejected and
  why. In plain language, with an example drawn from *the operator's* domain, not
  generic jargon. A verdict the operator can't reconstruct hasn't taught anything.
- **Show the friction.** Surface at least one real disagreement per significant
  decision before converging — architect vs engineer on a seam, a domain expert
  pushing back on a boundary. The voices must actually diverge; pre-baked
  consensus hides the reasoning that makes the conclusion trustworthy. Converge
  visibly, naming what tipped it.
- **Think before you write.** Reasoning happens in the conversation. The artifact
  (`DOMAIN.md`, `docs/context-map.md`, …) is captured at the *end* of a session
  with the operator's buy-in — never rushed mid-deliberation. The thinking is the
  work; the document is its residue.

## The Room

The AI role-plays distinct voices. Keep them distinct — the friction is the value.

- **Principal architect** — strategic design. Where are the seams? What changes
  independently? Core vs supporting vs generic? Which context owns this fact?
  Guards dependency direction and the long view.
- **Senior engineer** — tactical, pragmatic. What's the aggregate, what invariant
  does it protect, how does it persist, what's the awkward edge case? Calls out
  over-abstraction.
- **Domain expert(s)** — *operator-defined; one or many* (see below). Speaks the
  field's real language, rules, and exceptions. Plays from general knowledge
  shaped by the operator's definition, but **never invents domain truth** —
  defers to the operator.
- **User** — the person solving a problem. Narrate concrete actions and the
  motive behind each ("I open the picker because I don't want to finish with
  nothing"), because a vivid action is what exposes a fuzzy boundary.

**The operator is the real domain authority.** When the room hits a domain fact
it can't settle, it **pauses** and asks the operator directly — numbered plainly
(1, 2, 3…), capped at ≈3 questions per pause. When the expert has a confident
view it offers a flagged recommendation with reasoning; when it doesn't, it asks
open. The operator's answer is canon; the room resumes on it. Never resolve a
domain question by silent assumption.

### Rhythm (workshop register)

The room works **adaptively** — it does not narrate everything turn-by-turn, nor
dump a finished document.

- **Default: deliberate-then-react.** The room thinks out loud through one chunk
  of the problem — a visible debate with teaching asides (per *Show the friction*
  and *Teach as you apply*) — presents where it landed, and lets the operator
  redirect before moving to the next chunk. Keep chunks small enough to steer.
- **At a genuine fork, drop to turn-by-turn.** A boundary the room can't settle
  from evidence, a power dynamic that could go either way, or a domain fact only
  the operator can supply — there the room stops, says *why* it's stopping, and
  takes one move at a time with the operator. The stakes decide the rhythm: the
  costlier or less reversible the call, the slower the room goes.
- In **`brief`** register, skip the visible deliberation: state the conclusion,
  the one-line reason, and the artifact. Still pause on genuine domain forks —
  those are canon questions, not deliberation theatre.

### Configurable domain experts

The domain expert is **not** a single fixed strawman. The operator defines who it
is — and may define several. Each bounded context tends to have its own domain
authority and its own ubiquitous language, so the expert voice varies by context.

- Defined in `DOMAIN.md` (the `## Domain experts` roster). If none are defined,
  `init` prompts for at least one; absent that, play a generic expert and flag it.
- Each expert carries: a **handle**, the **context/subdomain they speak for**,
  their **role/background**, and the **vocabulary and rules** they bring.
- **Multiple experts can be in the room and disagree.** A clinician and a billing
  specialist pulling on the same word is exactly how an overloaded term surfaces.
- **Context-aware casting**: when a scenario or verb touches a context, the
  expert(s) for *that* context speak; others stay quiet unless an integration
  crosses their boundary.

## Lens

Three axes, set during Setup, captured in `DOMAIN.md`, overridable per-invocation.
Resolution per axis is first-match-wins: explicit flag → task cue → `DOMAIN.md`
default.

- **strategic vs tactical** → source breadth. Strategic reads the whole repo /
  system landscape (wide, shallow). Tactical reads one module / aggregate (narrow,
  deep). See `reference/strategic.md` and `reference/tactical.md`.
- **design vs critique** → input of record. Design generates from *intent*
  (operator + notes). Critique evaluates from *evidence* (the code) and must cite
  it.
- **workshop vs brief** → register, i.e. *how the room engages*. `workshop`
  (the default) is a collaborative working session: the three engagement laws
  (*Teach as you apply*, *Show the friction*, *Think before you write*) are in
  force and the room runs the adaptive rhythm above. `brief` is straight to the
  point: conclusion, one-line reason, artifact — no visible deliberation, no
  teaching asides, document written immediately. Genuine domain-fact pauses still
  happen in both. Override per call with `--brief` / `--workshop`.

## Output modes

- **`--findings-json`** (machine-readable findings). After the verb's normal
  output, append exactly one fenced ` ```json ` block: an array of canonical
  **Finding** objects — `{ signalId, severity, file, line, message, suggestedMove }`
  — one per finding, with `signalId` taken **verbatim from `reference/signals.md`**
  and `severity` one of `high|medium|low`. This is the same shape the detector emits
  (`cli/src/finding.mjs`); it is the published surface the eval and `audit` consume.
  Emit the block even when there are no findings (`[]`). Compatible with every verb;
  combine with `--brief` for a lean run.

## Context acquisition

Before the room convenes, build the council's footing from two layers:

1. **Operator-defined** — `DOMAIN.md` (intent: product, contexts, experts,
   language).
2. **Repo-derived** — scan the `target` for what's *actually there*: directory /
   module structure, import / dependency graph, key types and their names,
   persistence / schema, public surfaces (APIs, events). Non-code sources
   (schemas, specs, notes) feed in the same way.

In **critique** mode, the gap between intent and reality *is* the finding. Scope
to the `target` and lens so a large repo doesn't drown the room; if a strategic
verb is run unscoped on a big repo, ask for a scope first. Cache the acquired
model for the session; re-scan only when the target/scope changes.

**What to look for:** `reference/signals.md` is the shared detection catalog —
the concrete code cues for context boundaries, strategic anti-patterns, and
language smells. `critique`, `boundaries`, and `language` draw on it; every
finding should trace to a signal and cite a location.

## Commands (router)

When a verb is invoked, load its reference file and follow it.

| Verb | Reference | Mode | Purpose |
|---|---|---|---|
| `init` | `reference/init.md` | — | Interview the operator; write `DOMAIN.md` (incl. the domain-expert roster). |
| `map` | `reference/map.md` | design | Generate a context map from intent: contexts, subdomains, relationships. |
| `critique` | `reference/critique.md` | critique | Surface the de-facto context map the repo implies vs intended; flag drift, cite code. |
| `language` | `reference/language.md` | both | Define/refine the ubiquitous language for a context; flag code divergence. |
| `boundaries` | `reference/boundaries.md` | both | Assess boundaries; name relationship patterns between contexts. |
| `remediate` | `reference/remediate.md` | remediate | Work a critique's findings to fixes — refactor-first inline, escalate substantial additions to a plan. |
| `vet` | `reference/vet.md` | vet | Review a proposed change (plan/spec) for DDD design soundness before it's built; cite §E smells, amend the plan. |
| `aggregate` | `reference/aggregate.md` | both | Name a context's aggregate roots, the invariant each protects, the consistency boundary, and inside-vs-referenced; cite §D smells; round-trips via `remediate`. |
| `entities` | `reference/entities-value-objects.md` | both | Classify an aggregate's composition as entities vs value objects (identity vs value); cite §D misclassification + §C primitive obsession; round-trips via `remediate`. |
| `value-objects` | `reference/entities-value-objects.md` | both | Alias of `entities` — the same playbook, entered from the value-object side. |
| `repositories` | `reference/repositories.md` | both | Assess a context's persistence: one repository per aggregate root dealing in whole aggregates; cite §D repository-per-entity + domain-logic-in-the-service-layer; round-trips via `remediate`. |
| `events` | `reference/events.md` | both | Assess the domain events an aggregate publishes (named business moments per state transition); cite §D missing-domain-events + §C CRUD-masking; round-trips via `remediate`. |
| `distill` | `reference/distill.md` | both | Classify problem-space subdomains core/supporting/generic and map them onto contexts; cite §F mismatches; recommend where to invest. Owns the subdomain classification; strategic, no `remediate` round-trip. |
| `model` | `reference/model.md` | both | Synthesise the full domain model across contexts from the per-verb artifacts; cite §G cross-artifact coherence smells on the seams. Descriptive synthesis + §G only (no findings roll-up — that's `audit`); strategic, no `remediate` round-trip. |
| `audit` | `reference/audit.md` | critique | Whole-repo findings health report: run the detector, harvest the council artifacts, de-dup into prioritised clusters, list coverage gaps; `--fill` orchestrates the missing verbs. Aggregates §A–§G; no new signals, no `remediate` round-trip. |

The tactical spine (`aggregate`, `entities`/`value-objects`, `repositories`, `events`) is
complete, and Track D's meta verbs (`distill`, `model`, `audit`) have all shipped — the DDD verb
spine is complete.
