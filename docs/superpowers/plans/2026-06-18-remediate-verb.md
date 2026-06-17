# Remediate Verb Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `remediate` verb that works a critique's findings to fixes (refactor-first inline, additions escalated), plus a refactor-first shared law and a collision-proof critique artifact contract.

**Architecture:** Pure council-side change — Markdown playbooks plus one JSON metadata entry. No CLI/engine code changes; the detector's `Finding` shape is untouched. Four files: SKILL.md (law + router + mode), command-metadata.json (verb entry), critique.md (new artifact contract), and a new reference/remediate.md (the verb playbook).

**Tech Stack:** Markdown reference files read by the AI harness; one JSON config consumed by the plugin. Verification is structural (JSON parse, presence grep, cross-file consistency), not a unit-test suite — this half of the repo has no test harness and we are not inventing one.

## Global Constraints

- All edited files live under `skills/ddd-council/`. Paths are relative to repo root `/Users/tim/brain/Efforts/ddd-council`.
- Match the existing prose voice of the reference files (terse, imperative, em-dash asides, backticked symbols).
- The artifact filename pattern is **`docs/critique-<target-slug>-<date>.md`** and must read identically in both `critique.md` and `remediate.md`.
- Per-finding tag form is **`### F<n> [severity] <signalId> — <title>`**; status values are exactly `open | resolved | deferred | escalated`.
- Commit after each task. End commit messages with the Co-Authored-By trailer:
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
- Branch: `workshop-register` (current). Do not open a PR or merge unless asked.

---

### Task 1: Add the "Refactor before you add" shared law to SKILL.md

**Files:**
- Modify: `skills/ddd-council/SKILL.md` (the `## Shared DDD laws (always in force)` bullet list)

**Interfaces:**
- Consumes: nothing.
- Produces: a charter law that `remediate.md` (Task 4) and the verb playbooks cite. The exact bold lead-in is **`Refactor before you add.`** — later tasks grep for it.

- [ ] **Step 1: Verify the anchor exists and the law does not yet**

Run: `grep -n "Name the real concept" skills/ddd-council/SKILL.md && grep -c "Refactor before you add" skills/ddd-council/SKILL.md`
Expected: the "Name the real concept" line is found; the count for "Refactor before you add" is `0`.

- [ ] **Step 2: Insert the law after the "Name the real concept" bullet**

Find this bullet in the `## Shared DDD laws` list:

```markdown
- **Name the real concept**, not an accidental sub-type. If the language strains,
  the boundary or the name is wrong.
```

Insert immediately after it (new bullet, before `- **The language lives in the code**`):

```markdown
- **Refactor before you add.** When a recommendation can be realised either by
  reshaping existing code or by adding new code, prefer the refactor; propose a
  new addition only when a refactor can't carry the model. State both options and
  name why the chosen one wins.
```

- [ ] **Step 3: Verify the law is present exactly once**

Run: `grep -c "Refactor before you add" skills/ddd-council/SKILL.md`
Expected: `1`

- [ ] **Step 4: Commit**

```bash
git add skills/ddd-council/SKILL.md
git commit -m "Add 'refactor before you add' shared law to council charter

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Register the `remediate` verb (router row + metadata entry)

**Files:**
- Modify: `skills/ddd-council/SKILL.md` (the `## Commands (router)` table)
- Modify: `skills/ddd-council/scripts/command-metadata.json`

**Interfaces:**
- Consumes: nothing.
- Produces: the router row pointing at `reference/remediate.md` and the metadata entry with `mode: "remediate"`, `lens: "tactical"`. Task 4 creates the referenced file.

- [ ] **Step 1: Verify the verb is not yet registered**

Run: `grep -c "remediate" skills/ddd-council/SKILL.md skills/ddd-council/scripts/command-metadata.json`
Expected: `0` in both files.

- [ ] **Step 2: Add the router row to SKILL.md**

In the `## Commands (router)` table, find the `boundaries` row:

```markdown
| `boundaries` | `reference/boundaries.md` | both | Assess boundaries; name relationship patterns between contexts. |
```

Insert immediately after it:

```markdown
| `remediate` | `reference/remediate.md` | remediate | Work a critique's findings to fixes — refactor-first inline, escalate substantial additions to a plan. |
```

- [ ] **Step 3: Add the metadata entry**

In `skills/ddd-council/scripts/command-metadata.json`, the `boundaries` entry is currently the last in `commands`. Add a comma after its closing brace and append the `remediate` entry. The `commands` object's tail becomes:

```json
    "boundaries": {
      "description": "Assess bounded-context boundaries and name the relationship pattern across a seam: shared kernel, customer-supplier, conformist, anti-corruption layer, open-host, partnership, separate ways.",
      "argumentHint": "[contextA contextB]",
      "mode": "both",
      "lens": "strategic"
    },
    "remediate": {
      "description": "Work a critique's findings to fixes: refactor existing code first (inline, test-first), and escalate substantial new additions to a written plan. Reads docs/critique-<target-slug>-<date>.md and round-trips resolution status back into it.",
      "argumentHint": "[target] [F<n>]",
      "mode": "remediate",
      "lens": "tactical"
    }
  }
}
```

- [ ] **Step 4: Verify the JSON parses and the entry is present**

Run: `node -e "const c=require('./skills/ddd-council/scripts/command-metadata.json'); if(!c.commands.remediate) throw new Error('missing remediate'); console.log('ok:', c.commands.remediate.mode, c.commands.remediate.lens)"`
Expected: `ok: remediate tactical`

- [ ] **Step 5: Verify the router row resolves**

Run: `grep -n "reference/remediate.md" skills/ddd-council/SKILL.md`
Expected: one match in the Commands table.

- [ ] **Step 6: Commit**

```bash
git add skills/ddd-council/SKILL.md skills/ddd-council/scripts/command-metadata.json
git commit -m "Register remediate verb in router and command metadata

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Update `critique.md` to the new artifact contract

**Files:**
- Modify: `skills/ddd-council/reference/critique.md` (the `## Output — ...` section)

**Interfaces:**
- Consumes: nothing.
- Produces: the artifact contract `remediate.md` (Task 4) reads — filename `docs/critique-<target-slug>-<date>.md`, frontmatter `id`, per-finding `F<n>` tags, and a `status` field starting `open`.

- [ ] **Step 1: Verify the old contract is present**

Run: `grep -n "Output — \`docs/critique-<date>.md\`" skills/ddd-council/reference/critique.md`
Expected: one match (the current heading).

- [ ] **Step 2: Replace the Output section**

Replace this block (heading through the closing paragraph):

```markdown
## Output — `docs/critique-<date>.md`

- A **Mermaid `flowchart`** of the *de-facto* map (annotate edges with the
  inferred relationship + the evidence location).
- A **drift table**: intended vs observed, per relationship.
- A **findings list**: each finding = `severity · what · cited location · why it
  matters · suggested move`.

The findings list uses the same `Finding` shape the `detect` engine emits
(`cli/src/finding.mjs`), so engine output drops straight in.
```

with:

```markdown
## Output — `docs/critique-<target-slug>-<date>.md`

Name the file for the scoped target (`critique-cli-2026-06-18.md`,
`critique-root-2026-06-18.md`) so runs against different targets — or the same
target on different days — don't collide. Same target + date overwrites: the file
is the current snapshot of that target, not a ledger. Frontmatter carries a stable
artifact `id`.

- A **Mermaid `flowchart`** of the *de-facto* map (annotate edges with the
  inferred relationship + the evidence location).
- A **drift table**: intended vs observed, per relationship.
- A **findings list**: each finding gets a stable tag in its heading —
  `### F<n> [severity] <signalId> — <title>` — and records `what · cited location ·
  why it matters · suggested move · status`. `status` starts `open`; `remediate`
  round-trips it to `resolved | deferred | escalated`.

The per-finding body uses the same `Finding` shape the `detect` engine emits
(`cli/src/finding.mjs`); the `F<n>` tag and `status` wrap it so `remediate` can
track and round-trip each finding.
```

- [ ] **Step 3: Verify the new contract reads correctly**

Run: `grep -n "critique-<target-slug>-<date>.md" skills/ddd-council/reference/critique.md && grep -c "F<n>" skills/ddd-council/reference/critique.md`
Expected: the new heading matches; `F<n>` count is `≥ 2`.

- [ ] **Step 4: Commit**

```bash
git add skills/ddd-council/reference/critique.md
git commit -m "critique: collision-proof artifact name + F<n>/status contract

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Write the `remediate` verb playbook

**Files:**
- Create: `skills/ddd-council/reference/remediate.md`

**Interfaces:**
- Consumes: the shared law `Refactor before you add.` (Task 1); the artifact contract from `critique.md` (Task 3) — filename `docs/critique-<target-slug>-<date>.md`, `F<n>` tags, `status`.
- Produces: the playbook the router (Task 2) points at. Terminal file; nothing depends on it.

- [ ] **Step 1: Verify the file does not exist**

Run: `test ! -e skills/ddd-council/reference/remediate.md && echo absent`
Expected: `absent`

- [ ] **Step 2: Create `skills/ddd-council/reference/remediate.md`**

Write this exact content:

````markdown
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

Update the same `docs/critique-<target-slug>-<date>.md` in place. For each finding,
set its `status` and record the move:

- `resolved` — move applied; note the move and the commit ref.
- `escalated` — handed to a plan; link the plan path.
- `deferred` — operator chose to skip; note why.
- `open` — untouched this pass.

Re-running `remediate` picks up only `open` findings. The artifact stays the single
snapshot of the target's state.

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
````

- [ ] **Step 3: Verify the playbook references the shared contract consistently**

Run: `grep -c "critique-<target-slug>-<date>.md" skills/ddd-council/reference/remediate.md && grep -c "Refactor before you add\|refactor-first\|Refactor-first" skills/ddd-council/reference/remediate.md`
Expected: filename count `≥ 2`; refactor-first reference count `≥ 1`.

- [ ] **Step 4: Verify the router target now resolves to a real file**

Run: `grep -q "reference/remediate.md" skills/ddd-council/SKILL.md && test -e skills/ddd-council/reference/remediate.md && echo wired`
Expected: `wired`

- [ ] **Step 5: Commit**

```bash
git add skills/ddd-council/reference/remediate.md
git commit -m "Add remediate verb playbook

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Verification (whole feature)

After all tasks:

- [ ] `node -e "require('./skills/ddd-council/scripts/command-metadata.json')"` — metadata still valid JSON.
- [ ] `grep -rn "reference/remediate.md" skills/ddd-council/SKILL.md` — router points at the playbook, which exists.
- [ ] Filename pattern `critique-<target-slug>-<date>.md` appears in both `critique.md` and `remediate.md` (shared contract).
- [ ] `grep -c "Refactor before you add" skills/ddd-council/SKILL.md` returns `1` (law present once).
- [ ] `cd cli && npm test` — confirms the untouched engine still passes (no regressions from the docs change).
