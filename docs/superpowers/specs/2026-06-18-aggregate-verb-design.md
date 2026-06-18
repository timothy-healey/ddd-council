# Design — the `aggregate` verb (tactical keystone)

*Date: 2026-06-18 · Status: approved for planning · Scope: the ddd-council skill*

## Problem

The council has a complete strategic spine (`init`, `map`, `critique`, `language`,
`boundaries`) plus the review/fix verbs (`vet`, `remediate`), but **nothing tactical**.
The charter already declares *Invariants belong to aggregates — every aggregate names
what it protects*, yet no verb exercises that law. `aggregate` is the keystone of the
tactical track: it identifies aggregate roots and the invariant each protects, and it
lands the first **§D tactical signals**. The rest of the tactical track (`entities` /
`value-objects`, `repositories`, `events`) all depend on the model `aggregate`
produces — so it ships first.

## Decisions (locked during brainstorming)

| # | Decision |
|---|---|
| Mode | **Both** (design ↔ critique), like `language`/`boundaries`. Defaults to critique on code; design mode proposes the model from intent. |
| Target | `aggregate <context>` (all roots in a context); `aggregate <context>/<Root>` zooms to one. |
| Artifact | **Model + findings.** A positive per-root model *and* a §D findings list that round-trips through `remediate`. |
| Invariant shape | **Statement + enforcement sites + gaps** — the gap *is* the leaked-invariant finding. |
| Seam | `aggregate` names *inside vs referenced-by-id*; it does **not** classify entity vs value object — that's the next verb. |
| Engine | Council-only. §D authored in mechanizable style, but no engine work (the import graph can't see invariants/transactions). |

## 1. Identity & routing

- Verb: `aggregate`. Mode: **both** on the design-vs-critique axis. Default lens:
  **tactical · workshop**.
- **Default behaviour is critique** — read the code, cite it. **Design mode** (propose
  the model from intent, flagged as proposed not cited) kicks in when no code yet
  expresses the aggregate, or via an explicit `--design` cue.
- Wiring: router row in [SKILL.md](../../../skills/ddd-council/SKILL.md); entry in
  `skills/ddd-council/scripts/command-metadata.json`; new
  `skills/ddd-council/reference/aggregate.md`.
- Invocation: `aggregate <context>` or `aggregate <context>/<Root>`.
- **No CLI/engine changes** — `aggregate` is a council (prose) verb.

## 2. Input & scope

- Primary: `aggregate <context>` — read that one context deeply (tactical lens:
  narrow and deep) and find **all** aggregate roots within it.
- Zoom: `aggregate <context>/<Root>` — one named aggregate.
- **Prerequisite (already written in `tactical.md`):** the context must be named and
  bounded. If the boundary is still fuzzy, drop back to `boundaries`/`map` first —
  *strategic before tactical* is a shared law.

**Fallbacks** (same shape as the other verbs):
- No `DOMAIN.md` → offer `init` first.
- Target boundary unclear / context not in `DOMAIN.md` → redirect to `boundaries`.

## 3. The model output (the positive result)

`aggregate` produces a positive model even when nothing is wrong. One block per
aggregate root, **cited to code** (critique mode) or **flagged as proposed** (design
mode):

- **Root** — the entity that is the entry point to the consistency boundary
  (`file:symbol`).
- **Invariant(s) it protects** — each rendered as:
  1. a **plain-language statement** (the rule in domain terms),
  2. its **enforcement sites** — a `file:line` list of every place the code upholds it,
  3. any **gap** — a mutation path that changes state without re-checking the rule.
  The gap is where the model meets the findings (→ *leaked invariant*, §4).
- **Consistency / transaction boundary** — what mutates atomically together.
- **Inside vs referenced-by-id** — which objects are loaded/saved as part of the root,
  vs held by id only. (This is the composition list the next verb classifies; see the
  Seam below.)

## 4. §D signals + findings

`aggregate` lands exactly the **four root-level §D signals** and fills their entries in
`signals.md` (currently a stub):

- **Anaemic domain model** — the aggregate is getters/setters with behaviour in
  services. *Cue:* a data class plus a `*Service` that holds its logic.
- **God aggregate** — one root owns too much; the consistency boundary is too wide.
  *Cue:* a root with many unrelated children / a sprawling transaction.
- **Transaction spanning aggregates** — one transaction mutates two roots (and the
  sibling: one aggregate split across two transactions). *Cue:* a transaction scope
  crossing two roots' state.
- **Leaked invariant** — a rule the aggregate should own, enforced (or not) outside it.
  *Cue:* the **gap** found while collecting an invariant's enforcement sites.

The remaining §D stubs (*entity/value-object misclassification*, *repository-per-entity*,
*domain-logic-in-service-layer*, *missing domain events*) **stay stubbed** — they
belong to `entities`/`value-objects`, `repositories`, and `events`.

Findings use the exact `### F<n> [severity] <signalId> — <title>` + `status` shape from
`critique`, sharing the `Finding` typedef in `cli/src/finding.mjs`. They **round-trip
through `remediate`** unchanged (`open | resolved | deferred | escalated`).

§D is authored in the mechanizable style (per the signals.md convention) but is
**council-only** for now: the engine reads the import graph and cannot see invariants or
transaction scopes. No engine work in this spec.

## 5. How it runs

1. **Acquire** the context deeply (tactical breadth): domain types, where behaviour
   lives, what the code enforces and where, persistence/transaction scopes, intra-context
   events.
2. **Identify the roots** — recommend from the code with reasoning; pause for the
   operator on a genuine fork ("is this one aggregate or two?"). Operator is canon.
3. **For each root** — state the invariant(s), collect enforcement sites, mark gaps;
   record the consistency boundary and inside-vs-referenced composition.
4. **Flag §D** — each finding traces to a §D signal id, a severity (blast radius), and a
   code citation.
5. **Pause** for the operator on each "is this deliberate / is this really one
   aggregate?" — intent is canon.

In **design mode**, steps 2–4 propose the model from intent (flagged), rather than
deriving and citing it.

## 6. Room framing

- **Engineer leads** — tactical: what's the aggregate, what invariant does it protect,
  how does it persist, what's the awkward edge case? Calls out over-abstraction.
- **Architect** guards the boundary — is this one consistency boundary or two; does the
  transaction scope match the aggregate.
- **Domain expert(s)** confirm the invariant is a real domain rule, not an artefact of
  the code.
- **Operator** is canon — on the roots, the invariants, and whether to apply/defer.

## Components & boundaries

| Unit | Purpose | Depends on |
|---|---|---|
| `reference/aggregate.md` | The verb playbook the room follows | SKILL.md laws, §D, the artifact contract |
| `signals.md` §D | Fill the four root-level signals (anaemic model, god aggregate, transaction spanning aggregates, leaked invariant) | §A/§C (style), `cli/src/finding.mjs` (shape) |
| SKILL.md edits | Router row + `aggregate` mode/lens | — |
| `command-metadata.json` | `aggregate` description / hint / mode / lens | — |
| `tactical.md` | Already states the prerequisite + what the lens reads — no change expected; confirm during build | — |

## The seam to `entities` / `value-objects`

`aggregate` draws the boundary and names *what's inside vs referenced by id* — the
composition list. It does **not** classify those insides as entities vs value objects;
that is the next verb (Phase 1.2, `entities` & `value-objects`), which classifies the
types *within* an aggregate. `aggregate` draws the boundary; the next verb sorts what's
inside it. Confirmed during brainstorming.

## Out of scope (YAGNI)

- The other tactical verbs (`entities`/`value-objects`, `repositories`, `events`) — each
  is its own spec.
- Entity-vs-value-object classification — the next verb owns it.
- Any engine/§D mechanization — council-only for now.
- The non-root §D signals — they stay stubbed until their owning verbs land.

## Open questions

None blocking. The `aggregate` mode label in `command-metadata.json` is provisional but
low-stakes (mirrors the `vet` precedent).
