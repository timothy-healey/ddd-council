# ddd-council detect

The deterministic, code-grounded half of [ddd-council](../). Where the council
*reads* code and reasons, `detect` *parses* it and mechanically flags strategic
DDD anti-patterns from the module/`use` graph. Same finding shape either way, so
the council can fold engine output straight into a critique.

**Multi-language**, via tree-sitter, behind a swappable language-module seam
(`src/lang/`): **Rust** (`tree-sitter-rust`) and **TypeScript**
(`tree-sitter-typescript`) today; a new language is a module that conforms to the
same `{ parseFile, resolveImport }` contract. Rust resolves imports by module name;
TypeScript resolves by path (relative + tsconfig `paths` aliases).

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

- **module** — *Rust only:* the path segment other code writes after `crate::` / the
  crate name. TypeScript ignores it (it resolves imports by file path).
- **paths** — globs (repo-relative) of files in this context. For TypeScript these also
  resolve imports: a specifier is mapped to a file, then matched against these globs.
- **publicModules** — *cross-language:* the context's public surface — Rust submodules,
  or TS public subdirs / `api` barrels. Importing through these is fine, importing past
  anything else is a leak.

A TypeScript repo may also have a `tsconfig.json`; `detect` reads its `compilerOptions.paths`
to resolve `@alias/*` imports.

`/ddd-council init` writes a starter `ddd-council.json` for Rust repos, deriving the
contexts from the same scan it uses for `DOMAIN.md`; TS configs are hand-written for now.
Tune `publicModules`/`thresholds` by hand from there.

## Rules (from `../skills/ddd-council/reference/signals.md` §B)

Import-graph rules (from the module / `use` / `import` graph):

| Signal | What fires it |
|---|---|
| `leaky-boundary` | an import reaching past a context's public surface into its internals |
| `circular-dependency` | a cycle in the context dependency graph (Tarjan SCC) |
| `god-module` | a module imported by ≥N files across ≥M contexts |
| `cross-context-coupling` | a single file importing from ≥N distinct contexts (chatty) |

Schema-aware rule (from the persistence layer):

| Signal | What fires it |
|---|---|
| `accidental-shared-kernel` | a DB table ≥2 contexts read/write that none owns — read from diesel `table!`/query-builder (Rust) and Sequelize models (TypeScript). Write-aware severity: `high` when a non-owner writes it. |

Other-language ORMs (sqlx inline SQL, `.sql` migrations, Prisma/TypeORM) are follow-ups
behind the same parser contract.

## Tests

```bash
npm test   # node --test; Rust + TypeScript fixtures (one of each violation),
           # plus skip-guarded golden runs over the pinned example repos
```

## Limitations

- Rust and TypeScript only; Rust relative `self::`/`super::` and TS intra-package
  relative imports are treated as intra-context.
- Schema-aware detection reads diesel (Rust) and Sequelize (TypeScript) models; other
  ORMs and raw SQL/migrations are not parsed yet.
- A god module hiding in an *undeclared* crate/package isn't caught — declare it as a
  context to surface it.
- Signals are prompts to investigate, not verdicts: intent (was this coupling
  deliberate?) is the operator's call.
