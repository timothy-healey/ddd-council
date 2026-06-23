# Verb: audit

*Mode: critique (a findings sweep — there is no design audit) · Lens: strategic ·
Runs: the detector (`ddd-council-detect --json`) + harvests the council artifacts
(`docs/<verb>-<…>.md`) under scope; with `--fill`, orchestrates the missing council verbs
(critique + `brief`), bounded by scope. Reads `DOMAIN.md` for context/scope.*

> **Register.** Surfaced per the active register (SKILL.md → *Lens*). In `workshop` (default) the
> room reads the prioritised roll-up aloud as the system's health and names which clusters are
> load-bearing; in `brief` it writes the report and states the top clusters + coverage. Genuine
> operator forks (only under `--fill`) are logged, not asked, then surfaced for the operator to
> resolve in one batch.

## Purpose

Produce one whole-repo **findings health report**: run the mechanical detector, harvest the council
verbs' findings, de-dup + prioritise them into clusters, and list coverage gaps. `--fill` closes
gaps by orchestrating the missing verbs — never fabricating operator answers. The synthesis-of-findings
counterpart to `model` (synthesis-of-the-model).

> **Term — *cluster*.** A **cluster** is the set of findings, from any source, that share a
> normalised location and context-set — presented as one entry carrying every contributing
> `signalId`, the max severity, and each source's `suggestedMove`. The de-dup unit.

## Distinct from `model`

`model` is the descriptive whole-system *picture* + §G seam findings. `audit` is the de-duped,
prioritised *findings health report* across every source (the engine + every council artifact,
including `model`'s §G). `model` is one of `audit`'s harvest sources.

> **Conformist couplings.** `audit` is a downstream **conformist** of two evolving contracts and
> reads both **tolerantly**: (a) each council verb's **artifact format** — it keys off the shared
> `### F<n>` / `**Status:**` grammar and `cli/src/finding.mjs` (the published kernel) and degrades a
> slice it can't parse to a coverage gap; (b) the detector's **`--json` envelope**
> (`{ findings, contexts, fileCount }`) — it prefers the `ddd-council-detect` bin entry (the
> `cli/bin/ddd-council-detect.mjs` path is a named fallback) and **treats engine exit 2 as an error
> surfaced in the report, never as "no findings"** (exit 0 = clean, 1 = findings present).

## Room framing

- **Architect** leads — reads the prioritised roll-up as the system's strategic health; judges which
  clusters are load-bearing and whether the worst findings concentrate in the core.
- **Engineer** sanity-checks clusters — are two sources really the *same* issue (correct merge) or
  coincidentally co-located (split them)?
- **Domain expert(s)** weigh the operator questions surfaced under `--fill`.
- **Operator** is canon on the open questions and on what counts as core for prioritisation.

## How it runs

1. **Scope.** `audit [scope]` — whole repo by default, or a context/subset; establish it from the
   argument + `DOMAIN.md`.
2. **Run the engine.** Shell out to the detector (`ddd-council-detect <path> --json`, falling back to
   `node cli/bin/ddd-council-detect.mjs <path> --json`) and parse the `{ findings, contexts,
   fileCount }` envelope. These are the §A/§B mechanical findings (always run — cheap, deterministic).
   **Exit codes:** 0 = clean, 1 = findings present, **2 = engine error — surface it in the report,
   never treat it as "no findings"** (a false all-clear).
3. **Harvest the council artifacts.** For each verb/context in scope, read the latest
   `docs/<verb>-<…>.md` and collect its `### F<n>` findings (signalId, severity, location, status,
   suggestedMove). Skip findings already `resolved`/`deferred` unless `--all`. An artifact you can't
   parse becomes a coverage gap (read tolerantly).
4. **Coverage map.** Record, per (verb, context) in scope: engine-run ✓ / artifact-harvested ✓ (with
   date) / **gap ✗** (no artifact). A gap names the verb to run (e.g. `run aggregate Ordering`).
5. **`--fill` (opt-in).** For each gap in scope, orchestrate the missing council verb in critique +
   `brief` register, **in dependency order**: `critique`/`language`/`boundaries` and the tactical
   spine first, then `distill`, then `model` last — the synthesis verbs consume the others, so a
   synthesis verb is filled only after its inputs exist this run (else it synthesises nothing or
   re-derives from code). A canon domain fork → log to "Open questions for the operator" and continue
   on evidence; **never fabricate** an answer. Fold the produced findings into the harvest set.
6. **De-dup into clusters.** Group findings by a normalised join key: `(file path with the line
   number dropped, owning context-set)`, resolving a symbol/table to its file. A `model` §G finding
   joins on the **code location it cites in critique mode**; when it carries only an artifact
   reference, it clusters on **context-set alone** (coarser, still useful). A finding with no
   resolvable location clusters by context-set only. One cluster per group.
7. **Prioritise.** Order clusters severity high→low; when a `docs/distill-*.md` exists, weight a
   cluster up when its context is a *core* subdomain (falls back to plain severity when none).
8. **Write the report** (below) and present the health summary.

## Output — `docs/audit-<date>.md`

Append, never overwrite. Includes:

- **Health summary:** counts by severity, cluster count, coverage (verbs harvested / gaps), and the
  top clusters by priority.
- **Prioritised clusters:** each as `### F<n> [maxSeverity] <cluster-title> — <location> · <context-set>`
  listing every contributing `signalId` (with its source: engine / `<verb>` artifact) and each
  source's `suggestedMove`; carries a roll-up `**Status:**` (`open | resolved | deferred | escalated`)
  — open if any member is open. Cites the owning artifact(s) so `remediate` runs against them.
  Findings use the `Finding` shape (`cli/src/finding.mjs`); the `F<n>` is the cluster number.
- **Coverage map:** a table — verb × context → harvested (date) / engine / gap (verb to run).
- **Open questions for the operator:** only populated by `--fill`; the canon forks the orchestrated
  verbs hit, each naming the verb and what it needs.

## Guardrails

- **No new signals** — `audit` aggregates the existing §A–§G catalog; it never coins a `signalId`.
- **No `remediate` round-trip** — `audit` doesn't own findings; each cluster cites its owning
  artifact and remediation runs against *that* via the owning verb's `remediate` path.
- **Never fabricate operator answers** under `--fill` — record the fork and continue on evidence.
- **Engine exit 2 is an error, not "no findings"** — surface it; a crashed detector must not read as
  a clean repo.
- **Default runs zero council verbs** — orchestration is opt-in (`--fill`) and bounded by scope;
  re-running a verb whose artifact is current just burns tokens (harvest it instead).
- Strategic synthesis — roll findings up and cluster them; don't re-adjudicate an individual
  finding's correctness (that belongs to the owning verb).
