---
name: run-ddd-council-cli
description: >-
  Build, run, smoke-test, and drive the ddd-council-detect CLI — the
  deterministic DDD anti-pattern detector for Rust. Use when asked to run,
  start, build, test, or smoke-test the detector/CLI, check its exit codes or
  --json output, or verify a change to the parser/graph/rules engine works.
---

# Run: ddd-council-detect CLI

`ddd-council-detect` is a Node ESM command-line tool: it parses a Rust
codebase with tree-sitter, builds a context-level `use` graph, and flags
strategic DDD anti-patterns (`leaky-boundary`, `circular-dependency`,
`god-module`, `cross-context-coupling`). It has no GUI — the surface is the
exit code, the text report, and `--json`.

**Drive it with the smoke driver** at
`.claude/skills/run-ddd-council-cli/driver.mjs`. It runs the real built CLI
across every exit path (findings → 1, `--json`, `--help` → 0, clean repo → 0,
missing config → 2) and asserts both code and output. That driver — not
`npm start` — is how you confirm a change is good.

All paths below are relative to the `cli/` directory (the unit root).

## Prerequisites

- Node ≥ 18 (verified on v24.16.0).
- No OS packages, no compiler: `tree-sitter` / `tree-sitter-rust` ship
  prebuilt bindings (`linux-x64`, `linux-arm64`, `darwin-*`, `win32-*`), so
  `npm install` is download-only and works headless on Linux.

## Build / setup

```bash
npm install
```

~3s; "added 4 packages … found 0 vulnerabilities". No build step after this.

## Run (agent path) — the driver

```bash
node .claude/skills/run-ddd-council-cli/driver.mjs
```

Prints a `PASS`/`FAIL` line per check and a final `ALL CHECKS PASSED`; exits
`0` when every check passes, `1` otherwise. This is the first thing to run
after any change to `src/` or `bin/`.

## Run (direct, against a real repo)

The CLI takes a path to a repo that has a `ddd-council.json` at its root.

```bash
# text report against the bundled fixture (a workspace with one of each violation)
node bin/ddd-council-detect.mjs tests/fixture        # -> exit 1 (4 findings)

# machine-readable, same finding shape the council folds in
node bin/ddd-council-detect.mjs tests/fixture --json  # -> exit 1

# usage
node bin/ddd-council-detect.mjs --help                # -> exit 0
```

Exit-code contract (relied on in CI and by the driver): `0` = clean, `1` =
findings, `2` = error (e.g. no `ddd-council.json` at the target).

## Direct invocation (internal code, no CLI shell)

Most changes here touch the parser/graph/rules internals. Call `detect()`
directly instead of going through the binary:

```bash
node -e "import('./src/detect.mjs').then(m => { const r = m.detect('tests/fixture'); console.log(r.contexts.join(','), r.fileCount, r.findings.map(f => f.signalId).join(',')); })"
# -> scheduling,billing,notifications 6 circular-dependency,leaky-boundary,cross-context-coupling,god-module
```

`detect(repoRoot)` returns `{ findings, contexts, fileCount }`.

## Test

```bash
npm test    # node --test; 7 tests over the fixture workspace
```

## Gotchas

- **`detect` throws (exit 2) without a `ddd-council.json`** at the target
  root — cross-context rules are undefined without a context map. The driver
  covers this with a temp empty dir; for a real run, point at a repo that has
  one (or generate via `/ddd-council init`).
- **Piping the CLI to `head` swallows the exit code.** `... --json | head`
  reports an empty/`SIGPIPE` status, not `1`. Redirect to a file and check
  `$?` if you need the real code (the driver uses `spawnSync` and reads
  `.status`, avoiding this).
- **`paths` globs are repo-relative and matched by a minimal matcher** (`*`,
  `**` only). A file outside every context's `paths` is "unassigned" (e.g.
  `app/service.rs` in the fixture) and still counts toward chatty-coupling.
- **Rust only, and `self::`/`super::` imports are treated as intra-context** —
  they never produce cross-context findings, by design (v1 limitation).

## Troubleshooting

- `Error: Cannot find package 'tree-sitter'` → you ran the CLI/driver from
  outside `cli/` or before `npm install`. `cd` into `cli/` and install.
- Driver prints `FAIL …` lines → a `src/`/`bin/` change altered the
  exit-code or output contract; the failing line names which (exit code,
  finding text, or JSON shape).
