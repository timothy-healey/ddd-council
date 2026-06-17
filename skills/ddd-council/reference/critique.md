# Verb: critique

*Mode: critique · Lens: strategic · Reads: the repo (the `target`).*

> **Register.** Surfaced per the active register (SKILL.md → *Lens*). In `workshop`
> (default) the room reasons through each finding aloud and teaches the anti-pattern
> it cites; in `brief` it lists the findings and writes the artifact.

**The headline verb.** Surface the **de-facto context map the code actually
implies** — and compare it to the intended one in `DOMAIN.md` / `docs/context-map.md`.
The gap between intent and reality is the finding.

> **Targeting a plan or spec, not code?** That's `vet`, not `critique`. `critique`
> evaluates *evidence* (code it can cite); `vet` evaluates *intent* (a proposed
> change). Redirect plan/spec `.md` targets to `vet`.

## Why this is the killer feature

Real repos drift. Two contexts quietly share a database table → an *accidental
shared kernel*. A module reaches into another's internals → a *leaky boundary*. A
translation layer exists but was never named → an *anti-corruption layer* in all
but name. Humans inside the codebase can't see this; a council reading the whole
repo can. `critique` makes the implicit architecture explicit.

## Evidence rule (non-negotiable)

**Every claim cites a file/symbol.** "Scheduling and Billing share a kernel" is
inadmissible; "`scheduling/models.py:Appointment` and `billing/invoice.py:Invoice`
both read/write the `appointments` table (`billing/queries.py:42`)" is the finding.
A critique that doesn't point at code is theatre — drop it.

## Room framing

- **Architect** reads the dependency graph and proposes the de-facto contexts and
  their relationships from the evidence.
- **Engineer** confirms each claim against the actual code — imports, shared
  tables, transaction scopes — and kills unsupported assertions.
- **Domain expert(s)** judge whether a *de-facto* boundary makes domain sense or is
  an accident of implementation.
- **Operator** is pulled in when intent is ambiguous (was this coupling deliberate?).

## Run the detector first (when targeting Rust)

If a `ddd-council.json` exists at the repo root, run the deterministic engine and
fold its findings in before the room reasons. Invoke it through the bundled
launcher, which resolves the engine inside the plugin (it ships alongside this
skill, **not** in the target repo) and installs its deps on first use:

```bash
"$CLAUDE_PLUGIN_ROOT/skills/ddd-council/scripts/run-detect.sh" <repo> --json
```

If `$CLAUDE_PLUGIN_ROOT` is not set in your shell, use the absolute path to the
directory this skill loaded from (the `run-detect.sh` it points to is the same
script either way — it locates the engine relative to itself).

In practice you run the skill from the *target* repo, so a bare
`node cli/bin/...` would not resolve — always go through the launcher. If it
exits `3` (engine not found / deps unavailable) or no `ddd-council.json` exists,
skip the engine and have the room read the code itself; say so rather than
pretend the engine ran.

It returns `{ findings: [Finding] }` — the `Finding` shape defined canonically in
`cli/src/finding.mjs` — for the §B import-graph signals (leaky-boundary,
circular-dependency, god-module, cross-context-coupling), mechanically, with exact
locations. Treat each as a
**grounded candidate**: the room confirms it against the code, judges intent, and
the operator rules on whether it was deliberate. The engine finds; the council
interprets. For signals the engine doesn't yet cover (§A boundary cues, §C
language smells, schema-based shared kernel), the room reads the code itself.

## How it runs

1. **Acquire the repo context** (SKILL.md → Context acquisition): module structure,
   import graph, shared data, integration surfaces. Scope to the `target`. Seed it
   with the detector's findings if it ran.
2. **Derive the de-facto map** — cluster modules into contexts by cohesion and
   coupling; infer each relationship and its direction from the evidence.
3. **Diff against intent** — overlay the intended map (`DOMAIN.md` /
   `context-map.md`). Mark: matches, drift (intended X, code does Y), and
   surprises (relationships nobody declared).
4. **Flag anti-patterns** with severity and citation, working from the shared
   catalog in `reference/signals.md` (§A context-boundary signals, §B strategic
   anti-patterns, §C language smells). Each finding traces to a signal id and a
   code location.
5. **Pause** for the operator on each "is this deliberate?" question.

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

## Guardrails

- Cite or cut. No uncited claims.
- Distinguish *drift* (code disagrees with intent) from *undeclared intent* (intent
  was never written down) — the fix differs.
- Don't prescribe a full redesign; surface the gaps and the cheapest move that
  closes each. Recommendations are flagged, the operator decides.
