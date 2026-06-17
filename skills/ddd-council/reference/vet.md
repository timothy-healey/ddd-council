# Verb: vet

*Mode: vet (evaluates a proposed change) · Lens: strategic · Reads: a plan/spec doc +
`DOMAIN.md` + the affected code.*

> **Register.** Surfaced per the active register (SKILL.md → *Lens*). In `workshop`
> (default) the room reasons each concern aloud and teaches the smell it cites; in
> `brief` it lists findings and writes the artifact.

**The pre-build gate.** Where `critique` evaluates *existing code*, `vet`
pressure-tests a *proposed change* — a plan or spec — for **DDD design soundness**
before a line is written. General plan quality (decomposition, testability,
sequencing) is out of scope; upstream skills own it. `vet` checks only what the
council is for: boundaries, language, and the *Refactor before you add* law.

## Why a separate verb (not `critique`)

`critique`'s defining invariant is "cite a file/symbol for every claim". A plan has no
code to cite, no de-facto map, and the code-stage signals (§A–§C) don't literally
apply. Vetting a plan evaluates *intent*, not *evidence* — a different activity, so a
different verb. (Targeting code? Use `critique`.)

## Input of record

Read three things together:

1. **The target doc** — the plan or spec under review.
2. **`DOMAIN.md`** — the declared contexts, ubiquitous language, and experts the plan
   must not contradict.
3. **The affected existing code** the plan names — *required*. "Adds where a refactor
   fits" and "fits the boundary" can't be judged without seeing what's already there.

**Fallbacks:**
- Target is a code directory, not a doc → redirect to `critique`.
- No `DOMAIN.md` → offer `init` first.

## Signals

Work from `reference/signals.md` **§E (design-stage smells)** — the design-tense
catalog. Each finding traces to a §E signal id and cites the **plan section** (plus
affected code where relevant). §E cross-references the code-stage siblings (§A–§C), so
the language is one vocabulary across stages.

## How it runs

1. **Acquire** the doc + `DOMAIN.md` + the affected code.
2. **Read the plan as a proposed change** — what does it add, move, rename, couple?
3. **Apply §E** — flag each design smell with severity (blast radius) and a citation to
   the plan section.
4. **Show the friction** (workshop): architect on whether the seams hold, engineer on
   the refactor-vs-add call against the real code, domain expert(s) on language and
   boundaries. Converge; name the recommended amendment.
5. **Pause** for the operator on each "is this intended?" — intent is canon.

## Output & loop

Write `docs/vet-<target-slug>-<date>.md` — same contract as `critique`: frontmatter
`id`; findings as `### F<n> [severity] <signalId> — <title>` with `status`. Each
finding records what · cited plan section (+ code) · why it matters · suggested
amendment · status.

**The remedy is to amend the plan.** `status` round-trips as revisions land
(`open | resolved | deferred`); a deep finding bounces to the `brainstorming` skill for
redesign. `vet` does **not** feed `remediate` — it's a gate before build, not a code
fix. If a finding means "existing code must be refactored *first*", the room says so
and the operator runs `remediate` separately.

## Room framing

- **Architect** leads — is the design sound, do the seams hold, is each concept in the
  context that owns it?
- **Engineer** checks against the real code — is the refactor-vs-add call right, is it
  buildable?
- **Domain expert(s)** guard the ubiquitous language and the boundaries.
- **Operator** is canon on intent; the room recommends amendments, flagged.

## Guardrails

- DDD soundness only — don't re-review decomposition/testability; that's upstream.
- Cite the plan section for every finding; a concern with no citation is theatre.
- Refactor before you add — flag additions a refactor would obviate.
- The operator decides amend/defer/redesign; the room recommends, flagged.
