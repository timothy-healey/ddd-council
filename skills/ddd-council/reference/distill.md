# Verb: distill

*Mode: both (design default; critique via `--critique` or task cue) · Lens: strategic ·
Reads: `DOMAIN.md` + the context map (`docs/context-map.md`) + the operator; in critique mode,
the repo as evidence.*

> **Register.** Surfaced per the active register (SKILL.md → *Lens*). In `workshop` (default) the
> room teaches the core/supporting/generic distinction as it lands it and shows the friction
> before converging; in `brief` it states the classification, the one-line reason per subdomain,
> the findings, and writes the artifact.

## Purpose

Separate the problem-space **subdomains**, classify each **core / supporting / generic**, map them
onto the solution-space **contexts**, and turn that classification into **strategic investment
guidance** — invest in the core, build supporting adequately, buy or use a library for the generic.
This is the classic DDD *distillation* move: find the part of the system that is your competitive
differentiator and protect the focus on it.

## Distinct from `map`

`map` draws the contexts and the named relationships between them, tagging each context's subdomain
type in one word. `distill` is the dedicated deep pass: it works the **problem space** (subdomains
need not be 1:1 with contexts), argues the classification with rationale, and produces the
investment call and the §F findings. **`distill` owns the core/supporting/generic classification**;
`map`'s tag is a summary that defers to the distill artifact when one exists.

## Core / supporting / generic — the distinction (teach it)

- **Core** — the subdomain that differentiates the business; the reason it wins. Invest your best
  effort here; build it bespoke.
- **Supporting** — necessary for the business to function but not a differentiator. Build it
  adequately; don't gold-plate it.
- **Generic** — a solved problem any business has (auth, notifications, payments rails). Buy it,
  use a library, or use a SaaS — don't hand-build it.

Teach this in the operator's own domain with a concrete example, and name the alternative you
rejected and why (per *Teach as you apply*).

## Room framing

- **Architect** leads — proposes the subdomain split and argues which is core; guards against
  calling everything core (then nothing is).
- **Engineer** grounds it in evidence — where the custom code and complexity actually pool (a
  generic subdomain bloated with bespoke code; a "core" that is thin and anaemic).
- **Domain expert(s)** judge what genuinely differentiates the business — defer to the operator.
- **Operator** is **canon** on the core/supporting/generic call; the room recommends, flagged.

## How it runs

1. **Name the subdomains** from `DOMAIN.md`, the context map, and the operator — problem-space
   partitions of the business, which may cut across or sit inside contexts.
2. **Classify each core / supporting / generic.** The operator is canon; offer a flagged
   recommendation with rationale and the rejected alternative. Pause (≤3 numbered questions) on any
   the room can't settle from evidence. Never invent the business's competitive core.
3. **Map subdomains → contexts.** In critique mode, read the repo and **cite §F mismatches** with a
   file/module location: `core-fragmented`, `mixed-subdomain-context`, `generic-over-built`,
   `under-invested-core`, `gold-plated-supporting` (see `reference/signals/F-distillation.md`).
4. **Investment guidance** — per classification, state where to spend, what to stop building, and
   what to buy. This is the payoff.
5. **Show the friction** before converging (architect vs engineer on whether a "core" claim is
   borne out by the code; the expert on what differentiates the business), and name what tipped it.

## Output — `docs/distill-<date>.md`

Append, never overwrite. Includes:

- A **subdomain table**: subdomain → type (core/supporting/generic) → one-line rationale → owning
  context(s).
- A **subdomain ↔ context map** (prose, or a small Mermaid) highlighting mismatches.
- **§F findings**, each as `### F<n> [severity] <signalId> — <title>` with a `**Status:**`
  (`open | resolved | deferred | escalated`) — the same machine-readable grammar `critique` uses;
  in critique mode each cites code/context. Findings use the `Finding` shape defined in
  `cli/src/finding.mjs`.
- An **investment guidance** block — invest / build-adequately / buy, per subdomain.

When `docs/context-map.md` exists, refresh its core/supporting/generic column to match — `distill`
is the authority; the map's tag is the one-word summary of this call.

## Guardrails

- Strategic before tactical — classify subdomains and investment here; don't drift into aggregates.
- **Not everything is core.** If the room calls more than a slice of the system core, push back —
  an undifferentiated "all core" classification has distilled nothing.
- The core/supporting/generic call is the **operator's** — recommend with reasoning, never assert
  domain truth.
- `distill` does **not** feed `remediate`. Its moves are strategic (extract a generic context,
  consolidate a fragmented core); they feed a `map` redraw or a fresh brainstorm/plan, not
  refactor-first inline fixes.
