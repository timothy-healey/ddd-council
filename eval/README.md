# eval — token-efficiency harness

Two tools, one shared `lib/`.

- `npm run eval:surface` — deterministic static-surface analyzer (CI-safe, no API).
  Per-verb SKILL+reference+signals est-tokens, and the sectioned-vs-monolithic delta.
- `npm run eval:bench [-- --model M --runs N --timeout S]` — live recall/precision vs
  PLANTED.md via `claude -p … --findings-json`. Needs `claude` on PATH; costs tokens.
  Writes `eval/results/<iso>-<model>.json`. `--timeout S` caps each session (seconds,
  default 600); a session that exceeds it is recorded as a cell error rather than
  hanging the whole run.

## The cut → measure → keep/revert loop

1. `node eval/surface.mjs --json > eval/results/baseline.json`
2. `npm run eval:bench -- --runs 3`   # baseline recall/precision
3. Apply a cut.
4. Re-run both. **Surface drops AND median recall holds → keep; recall drops → revert.**
5. Commit the cut + the new baseline together.

The gate is **median signal-level recall**, never a token threshold (that chases LLM noise).

## Backlog (measure each through the loop above)
- lazy-load reference files; trim SKILL.md boilerplate; dedupe the shared-laws restatement.
