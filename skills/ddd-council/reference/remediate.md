# Verb: remediate

*Mode: remediate (an action — it changes code) · Lens: tactical · Reads: a critique
artifact + the cited code.*

> **Register.** Surfaced per the active register (SKILL.md → *Lens*). In `workshop`
> (default) the room reasons each move aloud and teaches the refactor it makes; in
> `brief` it states the move, applies it, and writes status back.

**The fixing verb.** Where `critique` surfaces findings, `remediate` works them to
fixes — **refactor-first**, per the `Refactor before you add` shared law. It reads a
critique artifact, works each open finding in severity order, and round-trips the
result back into the artifact.

## Input & fallback

1. Resolve `docs/critique-<target-slug>-<date>.md` — the latest critique for the
   target. `remediate <target> F2` works a single finding by its tag.
2. **No artifact?** Pause and ask: *"No critique on record for `<target>`. Run
   `critique` first?"* On yes, run `critique` (which writes the artifact), then
   continue into remediation in the same session. Never remediate without a
   findings-of-record to work from.

## Refactor-first (the law, executed)

For each open finding the room classifies the closing move and **reshapes existing
code first** — rename, extract, move, merge/split, invert a dependency. A *new
addition* is proposed only when the room can show a refactor can't carry the model.

Show the friction (workshop): the engineer proposes the refactor, the architect
checks it doesn't worsen a boundary, the relevant domain expert checks the
ubiquitous language stays true. Converge visibly; name why the chosen move wins
over the alternative.

## Execution model

Work findings in **severity order**. Per finding, classify the move:

- **Refactor / doc-fix** → apply **inline**. For code, **test-first**: if the cited
  code has no covering test, add the failing test first (red), then refactor to
  green. Doc-only fixes skip tests. Run the suite; only then write status back.
- **Substantial new addition** → state why a refactor won't close it, and
  **escalate**: hand the finding to the `writing-plans` skill for a written plan.
  Mark it `escalated` with a link. Do **not** bolt a feature on inline.

**Rhythm** follows the *stakes-decide-rhythm* law (SKILL.md). Batch-approve the set
of moves; low-stakes refactors/doc-fixes then apply with light confirmation;
higher-blast-radius or irreversible moves drop to per-finding buy-in; escalated
additions always pause.

## Verification (non-negotiable)

- No finding is marked `resolved` without a **green test run cited** in the
  write-back — evidence before assertion.
- A refactor over untested code adds the test first; that red→green is the proof.
- Doc-only fixes record the change made, no test required.

## Round-trip — write status back into the artifact

Update the same `docs/critique-<target-slug>-<date>.md` in place. Each finding keeps its
stable heading tag and carries **exactly one status line** in the machine-readable grammar
the artifact contract defines (`reference/critique.md` → Output), so any caller — a human,
the roadmap harness, a future `audit` — can parse the outcome without re-reading the prose:

```text
**Status:** <open | resolved | deferred | escalated>[ (<move-kind>)] — <one-line note>
```

The first token is the canonical state. The four:

- `resolved` — move applied; cite the green test run / commit ref in the note.
- `escalated` — a refactor can't close it; it needs a written plan or a design decision.
  Link the plan if one was opened. **A caller must not re-attempt an `escalated` finding** —
  it is waiting on a decision, not a fix.
- `deferred` — the operator chose to skip it; note why. Like `escalated`, **not to be
  re-attempted** until the operator reopens it.
- `open` — not closed this pass: either untouched, or a refactor was tried and didn't
  close it. If a refactor *can't* close it, prefer `escalated` over leaving it `open` — an
  `open` finding is retried next pass, and a design tension reworded in place only resurfaces.

Re-running `remediate` picks up only `open` findings; `resolved | escalated | deferred` are
left as they are. The artifact stays the single snapshot of the target's state, and its
status lines are that snapshot's machine-readable record.

## Room framing

- **Engineer** leads — proposes the refactor, writes the test, makes the change.
- **Architect** guards the move: does it improve the seam, or just move the mess?
- **Domain expert(s)** check the language stays true to the context after the move.
- **Operator** is canon on intent and on whether to apply, escalate, or defer.

## Guardrails

- Refactor before you add — additions must justify why no refactor suffices.
- Evidence before "resolved" — cite the green run.
- Don't widen scope: remediate the finding, not the neighbourhood. New problems
  spotted mid-fix become new findings, not silent extra edits.
- The operator decides apply/escalate/defer; the room recommends, flagged.
