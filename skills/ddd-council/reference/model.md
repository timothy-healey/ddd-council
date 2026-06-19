# Verb: model

*Mode: both (critique default; design via `--design` or task cue) · Lens: strategic ·
Reads: the per-verb artifacts (`docs/context-map.md`, `docs/distill-<date>.md`, `docs/aggregate-*.md`,
the `repositories`/`events` findings) + `DOMAIN.md`; re-derives a slice from code only when its
artifact is missing. In critique mode, the repo grounds §G citations (supplies the location a §G
finding cites — not the detection; §G fires on contradictions between artifacts).*

> **Register.** Surfaced per the active register (SKILL.md → *Lens*). In `workshop` (default) the
> room reasons aloud about whether the slices compose into one coherent whole and teaches each §G
> smell as it lands it; in `brief` it emits the assembled model, the §G findings, and the coverage
> report, and writes the artifact.

## Purpose

Synthesise the full domain model **across all contexts** into one coherent whole-system picture by
weaving the artifacts the other verbs already wrote — the context map, the distillation, the
per-aggregate models, the repositories/events findings — and surface the **cross-artifact coherence
smells (§G)** on the seams between them. The synthesis pass over the spine: each verb owns its
slice; `model` owns the *whole* and the *seams between slices*.

> **Term — *slice*.** A **slice** is the portion of the whole-system model that one verb owns — its
> artifact / output of record (`map`'s context map, `distill`'s subdomain table, an `aggregate`
> model, …). `model` weaves the slices into the whole and watches the *seams* between them.

## Distinct from its siblings

- `map` draws contexts + relationships (one slice); `distill` classifies subdomains (one slice);
  the tactical verbs model one aggregate each. `model` **weaves all slices into one whole and owns
  the seams between them.**
- `audit` (the third meta verb) is the findings roll-up across every verb; `model` is **descriptive
  synthesis + §G coherence findings only** — it does not re-emit any slice's own findings.
- `model` is a downstream **conformist** of each verb's artifact format, and **reads tolerantly**:
  it keys off stable landmarks (the `### F<n>` / `**Status:**` finding grammar shared via
  `cli/src/finding.mjs`, and section headings) and **degrades to the coverage report** for a slice
  whose shape it can't read, rather than failing.

## Room framing

- **Architect** leads — holds the whole-system view; judges whether the slices compose into one
  coherent model and where the seams strain.
- **Engineer** grounds the seams — at each point two artifacts touch, is the claim borne out in
  the code? (the evidence behind a §G contradiction).
- **Domain expert(s)** judge term collisions — genuinely two concepts across contexts (acceptable;
  name the translation) or an accidental overload? Defer to the operator.
- **Operator** is canon on any domain fact the synthesis can't settle; the room recommends, flagged.

## How it runs

1. **Gather the slices.** Collect the present artifacts (`context-map.md`, `distill-<date>.md`,
   `aggregate-*.md`, the `repositories`/`events` findings); record which contexts/aggregates are
   present vs missing. Re-derive a slice from code only when its artifact is absent — and flag it
   *derived*, not read.
2. **Assemble the whole-system model.** Per context: subdomain type (from `distill`), a language
   summary (from `language`/`DOMAIN.md`), aggregate roots + the invariant each protects (from
   `aggregate`), key published events and persistence shape (from `events`/`repositories`); plus the
   cross-context relationships (from `map`). Cite each line's source slice.
3. **Coherence pass (§G).** Lay the slices side by side and cite cross-artifact contradictions —
   `unacknowledged-term-collision`, `orphan-in-map`, `slice-contradiction` (see
   `reference/signals/G-coherence.md`). Each finding names the two slices in conflict; in critique mode it
   also cites a code location. **§G never re-runs code detection the engine or `critique` owns** —
   it reads the disagreement between what two slices recorded.
4. **Coverage report.** List contexts/aggregates with no modelled slice and name the verb to run to
   fill each gap. A coverage note, not a finding — §G is for contradiction, not absence.
5. **Show the friction** before converging (architect on whether the picture hangs together;
   engineer on whether a slice's claim is borne out where two artifacts touch), and name what tipped
   a §G call. In `brief`, emit the assembled model, §G findings, and the coverage report straight.

## Output — `docs/model-<date>.md`

Append, never overwrite. Includes:

- **Whole-system model:** one section per context — subdomain type, language summary, aggregate
  roots + invariants, key events, persistence shape — each line citing its source slice (or flagged
  *derived* when no artifact existed).
- **Cross-context relationship map:** prose, or a small Mermaid, from `docs/context-map.md`.
- **§G coherence findings:** each `### F<n> [severity] <signalId> — <title>` (the `F` is the
  *finding* number; the §G `signalId` marks it a coherence smell) naming the two slices in conflict,
  the recommended owning-verb re-run, and a `**Status:**` (`open | resolved | deferred | escalated`)
  — the same machine-readable grammar `critique`/`distill` use. Findings use the `Finding` shape
  defined in `cli/src/finding.mjs`.
- **Coverage report:** which contexts/aggregates have no modelled slice, and the verb to run for each.

## Guardrails

- Synthesis-first — read the artifacts; re-derive from code only to fill a missing slice, and flag
  it when you do.
- **§G never re-runs code detection the Detection engine (`accidental-shared-kernel`) or `critique`
  owns.** It fires on contradictions *between artifacts*; a §G finding always names the two slices
  in conflict.
- **§G1 reports, it does not adjudicate** — it flags the unacknowledged term collision and defers
  the fix to `language` (unify the term) or `boundaries` (name the translation).
- `model` does **not** roll up the slice verbs' own findings (that is `audit`) and does **not** feed
  `remediate` — §G findings feed a re-run of the owning verb.
- Strategic synthesis — assemble the whole and watch the seams; don't re-open one aggregate's
  internals (that is the tactical verbs' job, already captured in their slices).
