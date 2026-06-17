# Design — the `vet` verb (DDD review of a proposed change)

*Date: 2026-06-18 · Status: approved for planning · Scope: the ddd-council skill*

## Problem

The council can `critique` *existing code* but has no way to pressure-test a
*proposed change* before it's built. Pointing `critique` at a plan is a category
error: `critique`'s defining invariant is "cite a file/symbol for every claim", and
a plan has no code to cite, no de-facto map to derive, and the code-shaped signals
(§A/§B/§C) don't apply. A plan review is a distinct activity — evaluating *intent*
(design) rather than *evidence* (code) — so it gets its own verb: **`vet`**.

`vet` checks **DDD design soundness only**. General plan quality (decomposition,
testability, sequencing) is already self-reviewed by `brainstorming` / `writing-plans`
and is explicitly out of scope.

## Decisions (locked during brainstorming)

| # | Decision |
|---|---|
| Remit | DDD design soundness only — not general plan quality. |
| Signals | New `§E — Design-stage smells` in signals.md, cross-referenced to §A/§B/§C. |
| Loop | Findings bounce back to the **plan** (amend / redesign), not into `remediate`. |
| Name | `vet` (evaluation of intent before approval). |

## 1. Identity & routing

- Verb: `vet`. Mode: **`vet`** (an evaluation of intent — distinct from `critique`'s
  evidence mode and `remediate`'s action mode).
- Default lens: **strategic · workshop** (boundaries, language, contexts are
  strategic; the room teaches as it goes).
- Wiring: router row in [SKILL.md](../../../skills/ddd-council/SKILL.md); entry in
  [command-metadata.json](../../../skills/ddd-council/scripts/command-metadata.json);
  new `skills/ddd-council/reference/vet.md`.
- Invocation: `vet <plan-or-spec.md>`.

## 2. Input of record

`vet` reads three things together:

1. **The target doc** — the plan or spec under review.
2. **`DOMAIN.md`** — declared contexts, ubiquitous language, experts; the plan must
   not contradict it.
3. **The affected existing code** the plan names — *required*. Judging "adds where a
   refactor would do" and "fits the boundary" is impossible without seeing what's
   already there.

**Fallbacks:**
- Target is a code dir, not a doc → redirect to `critique`.
- No `DOMAIN.md` → offer `init` first (same shape as the other verbs).

## 3. Signals — new `§E` in signals.md

A design-tense section. Each smell names its code-stage sibling so the catalog stays
coherent:

- **Cross-boundary dependency by design** — the plan has a context reach past
  another's public surface. (→ §B leaky-boundary)
- **Unowned shared type** — introduces a type/module several contexts will depend on,
  unnamed as a kernel. (→ §B accidental shared kernel / god-module)
- **Off-language naming** — new names that don't match the ubiquitous language, or
  `Manager`/`Helper`/`Processor` for a domain concept. (→ §C)
- **Adds where a refactor fits** — proposes new code where reshaping existing carries
  the model. (→ the *Refactor before you add* law) *New at plan stage.*
- **Contradicts `DOMAIN.md`/spec** — the design conflicts with declared intent or its
  own spec. *New at plan stage.*
- **Splits what changes together / couples what shouldn't** — distributed-monolith by
  design. (→ §B distributed monolith)

`vet` cites `§E` the way `critique` cites §A/§B/§C. A finding traces to a signal id
and a **plan section** (plus affected code where relevant).

## 4. Output & loop

- Artifact: `docs/vet-<target-slug>-<date>.md`. Same contract as `critique`:
  frontmatter `id`; findings as `### F<n> [severity] <signalId> — <title>` with a
  `status` field.
- Each finding cites the plan section it concerns (and affected code where relevant),
  why it matters, and the suggested amendment.
- **Remedy = amend the plan.** `status` round-trips as revisions land
  (`open | resolved | deferred`). A deep finding can bounce to `brainstorming` for
  redesign.
- **No path into `remediate`.** `vet` is a gate *before* build; `remediate` is a fix
  *after* `critique`. The one rare case ("existing code Z must be refactored first")
  is handled by the room *saying so* — the operator invokes `remediate` separately.

## 5. Room framing

- **Architect** leads — is the design sound, do the seams hold, is a concept in the
  right context?
- **Engineer** checks it against the real code — is the refactor-vs-add call right, is
  it buildable?
- **Domain expert(s)** guard the ubiquitous language and the boundaries.
- **Operator** is canon on intent; the room recommends amendments, flagged.

## 6. Discovery-cost note

One line added to [critique.md](../../../skills/ddd-council/reference/critique.md): if
`critique`'s target is a plan/spec doc rather than code, redirect to `vet`. (Users
instinctively type `critique <plan.md>`.)

## Components & boundaries

| Unit | Purpose | Depends on |
|---|---|---|
| `reference/vet.md` | The verb playbook the room follows | SKILL.md laws, `§E`, the artifact contract |
| `signals.md` `§E` | Design-stage smell catalog | §A/§B/§C (cross-refs) |
| SKILL.md edits | Router row + `vet` mode | — |
| `command-metadata.json` | `vet` description / hint / mode / lens | — |
| `critique.md` edit | One-line redirect for plan/spec targets | — |

No CLI/engine changes — `vet` is a council (prose) verb. The detector is untouched.

## Out of scope (YAGNI)

- General plan-quality review (decomposition/testability/sequencing) — upstream skills
  own it.
- A `vet → remediate` path — findings amend the plan, not code.
- A machine engine for `§E` — design smells are judgement-led.
- Vetting non-DDD artifacts.

## Open questions

None blocking. The `vet` mode label in `command-metadata.json` is provisional but
low-stakes.
