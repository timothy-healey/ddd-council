// Builds the context-level dependency graph from parsed Rust files.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { parseFile } from './parse.mjs';
import { contextForFile, contextForModule } from './config.mjs';

// `.claude` is skipped alongside the build/VCS dirs: a target repo can hold nested
// worktrees under `.claude/worktrees/` (full working copies of itself). Descending
// into them re-discovers every table and re-reports every leak per worktree, and
// makes a table's owning context / cited def-site a function of readdir order. The
// scanner sees each source file exactly once.
const SKIP_DIRS = new Set(['target', 'node_modules', '.git', '.claude']);

function listRustFiles(root) {
  const out = [];
  (function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) walk(join(dir, entry.name));
      } else if (entry.name.endsWith('.rs')) {
        out.push(join(dir, entry.name));
      }
    }
  })(root);
  return out;
}

// Strip leading crate/self/super; return null if the path is intra-context relative.
function normalizeLeading(segments) {
  let segs = [...segments];
  if (segs[0] === 'crate') segs = segs.slice(1);
  if (segs[0] === 'self' || segs[0] === 'super') return null; // relative → same context
  return segs;
}

/**
 * @returns {{
 *   files: Array<{ file: string, context: string|null }>,
 *   refs: Array<{ fromFile, fromContext, toContext, restModule, isLeak, line, path }>,
 *   contextEdges: Map<string, Set<string>>,  // fromContext -> set of toContext
 *   tables: Map<string, {                    // Track B (additive): derived data-coupling
 *     definedIn: { file: string, context: string|null, line: number } | null,
 *     columns: string[],
 *     // One row per (table, file). reads/writes stay SEPARATE per column so the
 *     // read/write direction the parser classified survives the merge — a file that
 *     // both reads and writes the table keeps both, and which column was written is
 *     // not lost to a single mutable `kind`.
 *     accessors: Array<{ file: string, context: string|null, reads: string[], writes: string[], line: number }>
 *   }>
 * }}
 */
export function buildGraph(repoRoot, config) {
  const files = [];
  const refs = [];
  const contextEdges = new Map();
  const tables = new Map();        // tableName -> { definedIn, columns, accessors }
  const pendingAccesses = [];      // { table, column, kind, line, file, context } (form b only)

  for (const abs of listRustFiles(repoRoot)) {
    const rel = relative(repoRoot, abs).split(sep).join('/');
    const fromContext = contextForFile(rel, config);
    files.push({ file: rel, context: fromContext });

    // Parse the file ONCE; every collector rides that single tree.
    const { uses, tableDefs, tableAccesses } = parseFile(readFileSync(abs, 'utf8'));

    // --- Track B: table definitions (where each table lives => its owning context) ---
    // Keep the FIRST definition seen (matches the columns rule below): one table has
    // one def-site here, so the cited owner/line is stable regardless of scan order.
    for (const def of tableDefs) {
      if (tables.has(def.table)) continue;
      const definedIn = { file: rel, context: fromContext, line: def.line };
      tables.set(def.table, { definedIn, columns: def.columns, accessors: [] });
    }

    // --- Track B: table accesses (only form (b) scoped touches count) ---
    for (const a of tableAccesses) {
      if (!a.viaScoped) continue; // form (a) imports seed the universe, not a touch
      pendingAccesses.push({ ...a, file: rel, context: fromContext });
    }

    for (const u of uses) {
      const segs = normalizeLeading(u.segments);
      if (!segs || segs.length === 0) continue;
      const toContext = contextForModule(segs[0], config);
      if (!toContext) continue; // external crate / std
      if (toContext === fromContext) continue; // intra-context use

      const rest = segs.slice(1); // everything after the context's module segment
      const restModule = rest.length >= 1 ? rest[0] : null; // submodule/item reached through
      const targetCtx = config.contexts[toContext];
      const throughPublic = restModule && targetCtx.publicModules.includes(restModule);
      // A leak is any reach into the context past its declared public surface —
      // including importing a private submodule directly (`use billing::repo;`),
      // not only members nested below one (`use billing::repo::PgRepo;`). Importing
      // the context root itself (`use billing;`) carries no submodule and is fine.
      const isLeak = rest.length >= 1 && !throughPublic;

      refs.push({
        fromFile: rel,
        fromContext,
        toContext,
        restModule,
        isLeak,
        line: u.line,
        path: segs.join('::'),
      });

      if (fromContext) {
        if (!contextEdges.has(fromContext)) contextEdges.set(fromContext, new Set());
        contextEdges.get(fromContext).add(toContext);
      }
    }
  }

  // Attribute accesses to discovered tables only (form (b) is the precise touch;
  // an arbitrary `Foo::bar` whose `Foo` is no diesel table is never a touch).
  // Each access lands in its own direction bucket — `read` adds to `reads`, `write`
  // to `writes` — so a file that both reads and writes the table keeps both, and a
  // later write of one column never overwrites an earlier read of another.
  for (const acc of pendingAccesses) {
    const t = tables.get(acc.table);
    if (!t) continue; // not a discovered table — ignore
    let row = t.accessors.find((r) => r.file === acc.file);
    if (!row) {
      row = { file: acc.file, context: acc.context, reads: [], writes: [], line: acc.line };
      t.accessors.push(row);
    }
    const bucket = acc.kind === 'write' ? row.writes : row.reads;
    if (acc.column && !bucket.includes(acc.column)) bucket.push(acc.column);
    if (acc.line < row.line) row.line = acc.line;
  }

  return { files, refs, contextEdges, tables };
}
