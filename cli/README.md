# ddd-council detect

The deterministic, code-grounded half of [ddd-council](../). Where the council
*reads* code and reasons, `detect` *parses* it and mechanically flags strategic
DDD anti-patterns from the module/`use` graph. Same finding shape either way, so
the council can fold engine output straight into a critique.

**Targets Rust** (via tree-sitter). The parsing layer is isolated, so other
tree-sitter grammars can be dropped in later to go polyglot.

## Usage

```bash
# install (prebuilt native bindings, no compile step)
npm install

# run against a repo that has a ddd-council.json at its root
node bin/ddd-council-detect.mjs path/to/repo
node bin/ddd-council-detect.mjs path/to/repo --json   # machine-readable
```

Exit code is `1` when findings exist, `0` when clean — usable in CI.

## Config — `ddd-council.json`

`detect` needs to know which code belongs to which context to check
*cross-context* rules at all:

```json
{
  "contexts": {
    "billing":    { "module": "billing",    "paths": ["billing/**"],    "publicModules": ["api"] },
    "scheduling": { "module": "scheduling", "paths": ["scheduling/**"], "publicModules": ["api"] }
  },
  "thresholds": { "godModuleFanIn": 4, "godModuleContexts": 2, "chattyFanOut": 3 }
}
```

- **module** — the path segment other code writes after `crate::` / the crate name.
- **paths** — globs (repo-relative) of files in this context.
- **publicModules** — the context's public surface; importing through these is fine,
  importing past anything else is a leak.

`/ddd-council init` writes a starter `ddd-council.json` for detector-supported
code repos (Rust today), deriving the contexts from the same scan it uses for
`DOMAIN.md`. Tune `publicModules`/`thresholds` by hand from there.

## v1 rules (from `../skills/ddd-council/reference/signals.md` §B)

| Signal | What fires it |
|---|---|
| `leaky-boundary` | a `use` reaching past a context's public modules into its internals |
| `circular-dependency` | a cycle in the context dependency graph (Tarjan SCC) |
| `god-module` | a module imported by ≥N files across ≥M contexts |
| `cross-context-coupling` | a single file importing from ≥N distinct contexts (chatty) |

Schema-aware rules (accidental shared kernel via shared tables — parsing
sqlx/diesel/migrations) and the tactical rules are the next milestones.

## Tests

```bash
npm test   # node --test; fixture Rust workspace with one of each violation
```

## Limitations (v1)

- Rust only; relative `self::`/`super::` imports are treated as intra-context.
- A god module hiding in an *undeclared* crate isn't caught — declare it as a
  context to surface it.
- Signals are prompts to investigate, not verdicts: intent (was this coupling
  deliberate?) is the operator's call.
