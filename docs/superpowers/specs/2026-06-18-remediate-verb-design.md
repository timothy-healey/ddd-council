# Design — the `remediate` verb (+ a refactor-first shared law)

*Date: 2026-06-18 · Status: approved for planning · Scope: the ddd-council skill*

## Problem

The council *surfaces* findings (`critique`, `boundaries`) with a `suggestedMove`,
then stops. The actual fixing is done by hand outside the skill. We want the
skillset to carry findings through to remediation — and, per the operator, to
**weigh refactoring existing code alongside adding new code** rather than defaulting
to additions.

Two pieces:
1. A new **`remediate`** verb that reads a critique artifact and works each finding
   to a fix.
2. A new **shared DDD law** so *every* verb's recommended move leans refactor-first.

## Decisions (locked during brainstorming)

| # | Decision |
|---|---|
| Shape | A new verb `remediate` (not an extension of `critique`). |
| Input | Reads a prior critique artifact; offers to run `critique` first if none exists; can target a single finding. |
| Refactor stance | **Refactor-first bias** — reshape existing code to close a finding; add new only when a refactor genuinely can't. |
| Artifact | `docs/critique-<target-slug>-<date>.md` + frontmatter `id:` + per-finding `F<n>` tags; `remediate` round-trips status back into it. |
| Execution | **Refactor-first inline, additions escalate**: refactors/doc-fixes applied inline under TDD; substantial new additions escalate to a written plan. |
| Charter | Refactor-first is a **shared law** across all verbs, not scoped to `remediate`. |

## 1. Identity & routing

- Verb: `remediate`. Mode: **`remediate`** (an *action* mode — it changes code;
  every other verb only reads code or writes analysis).
- Default lens: **tactical · critique · workshop** (narrow, deep, collaborative).
- Wiring: row in [SKILL.md](../../../skills/ddd-council/SKILL.md) router; entry in
  [command-metadata.json](../../../skills/ddd-council/scripts/command-metadata.json);
  new `skills/ddd-council/reference/remediate.md`.
- Invocation: `remediate [target]` resolves the critique artifact for that target;
  `remediate <target> F2` works a single finding.

## 2. Input & fallback chain

1. Resolve `docs/critique-<target-slug>-<date>.md` (latest for the target).
2. If none exists → ask: *"No critique on record for `<target>`. Run `critique`
   first?"* On yes, run `critique`, then continue into remediation in the same
   session.
3. A single-finding target (`remediate <target> F2`) runs a narrow pass.

## 3. Artifact contract (shared with `critique`)

This changes `critique`'s output so both verbs share one contract — and fixes the
date-only collision (two runs / different targets stomped one file).

- **Filename:** `docs/critique-<target-slug>-<date>.md`. Slug from the scoped
  target (`critique-cli-2026-06-18.md`, `critique-root-2026-06-18.md`). Same
  target+date overwrites — the file is the *current* snapshot of that target, not a
  ledger.
- **Frontmatter:** a stable `id:` for the artifact.
- **Per finding:** a stable tag `F1`, `F2`, … alongside the existing
  `signalId@location`. Heading form: `### F<n> [severity] <signalId> — <title>`.
- **Round-trip:** `remediate` writes back into the same file, per finding:
  `status: open | resolved | deferred | escalated`, the **move taken**, and a
  **commit ref**. Re-running `remediate` picks up only `open` findings.

`critique.md`'s output section is updated to emit this shape; `signals.md`'s
finding-shape note is unaffected (the engine's `Finding` is the *machine* finding;
this is the *artifact* finding that wraps it with `F<n>` + status).

## 4. Refactor-first behaviour

For each open finding the room classifies the closing move and **reshapes existing
code first** — rename, extract, move, merge/split, invert a dependency. A *new
addition* is proposed only when the room can show a refactor cannot close it.

The reasoning is shown (workshop register): engineer proposes the refactor,
architect checks it doesn't worsen a boundary, the relevant domain expert checks
the ubiquitous language stays true. Friction visible, convergence named.

### 4a. The shared law (charter)

Add one law to SKILL.md → *Shared DDD laws*:

> **Refactor before you add.** When a recommendation can be realised either by
> reshaping existing code or by adding new code, prefer the refactor; propose a new
> addition only when a refactor can't carry the model. State both options and why
> the chosen one wins.

This makes `map`, `critique`, `boundaries`, and `language` surface refactor options
in their suggested moves too; `remediate` is where the law is *executed*.

## 5. Execution model

Findings worked in **severity order**. Per finding:

- **Refactor / doc-fix** → applied **inline, test-first** (red → green), verified by
  running the suite, status written back to the artifact.
- **Substantial new addition** → the room states why a refactor won't do and
  **escalates** the finding to a written plan via the `writing-plans` skill (status
  `escalated`, linked). It is *not* bolted on inline.

Rhythm follows the existing **stakes-decide-rhythm** law: batch-approve the set of
moves, then low-stakes refactors/doc-fixes apply with light confirmation; higher-
blast-radius or irreversible moves drop to per-finding buy-in; escalated additions
always pause.

This mirrors the split run by hand this session: the `Finding`-kernel refactor was
applied inline; the `init`-emits-config feature was escalated as a real feature.

## 6. Verification (non-negotiable)

- No finding is marked `resolved` without a **green test run cited** in the
  write-back — evidence before assertion.
- If a finding's code has no covering test, the inline refactor **adds one first**
  (that's the red step), then refactors under green.
- Doc-only fixes are exempt from tests but still write back the change made.

## Components & boundaries

| Unit | Purpose | Depends on |
|---|---|---|
| `reference/remediate.md` | The verb playbook the room follows | SKILL.md laws, the artifact contract |
| SKILL.md edits | Router row + the refactor-first shared law + `remediate` mode | — |
| `command-metadata.json` | `remediate` description / argument hint / mode / lens | — |
| `critique.md` edits | Emit the new artifact contract (filename, `id`, `F<n>`, status fields) | shared artifact contract |

No CLI/engine changes — `remediate` is a council (prose) verb. The detector's
`Finding` shape is untouched.

## Out of scope (YAGNI)

- History/ledger of critiques over time (snapshot per target is enough).
- Auto-applying escalated additions (they go through `writing-plans` deliberately).
- A machine `remediate` engine — remediation is judgement-led, council-driven.
- Multi-target batch remediation in one run.

## Open questions

None blocking. Naming of the `remediate` mode label in `command-metadata.json`
(`"remediate"`) is provisional but low-stakes.
