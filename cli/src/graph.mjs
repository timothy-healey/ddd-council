// Builds the context-level dependency graph from parsed source files.
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep, extname } from 'node:path';
import * as registry from './lang/index.mjs';
import { contextForFile } from './config.mjs';

// `.claude` is skipped alongside the build/VCS dirs: a target repo can hold nested
// worktrees under `.claude/worktrees/` (full working copies of itself). Descending
// into them re-discovers every table and re-reports every leak per worktree, and
// makes a table's owning context / cited def-site a function of readdir order. The
// scanner sees each source file exactly once.
const SKIP_DIRS = new Set(['target', 'node_modules', '.git', '.claude']);

function listSourceFiles(root) {
  const exts = registry.extensions();
  const out = [];
  (function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) walk(join(dir, entry.name));
      } else if (exts.includes(extname(entry.name))) {
        out.push(join(dir, entry.name));
      }
    }
  })(root);
  return out;
}

/**
 * @returns {{
 *   files: Array<{ file: string, context: string|null }>,
 *   refs: Array<{ fromFile, fromContext, toContext, restModule, isLeak, line, path, moduleKey }>,
 *   contextEdges: Map<string, Set<string>>,  // fromContext -> set of toContext
 *   tables: Map<string, {                    // Track B (additive): derived data-coupling
 *     definedIn: { file: string, context: string|null, line: number } | null,
 *     columns: string[],
 *     // One row per (table, file). reads/writes stay SEPARATE per column so the
 *     // read/write direction the parser classified survives the merge — a file that
 *     // both reads and writes the table keeps both, and which column was written is
 *     // not lost to a single mutable `kind`.
 *     // hasWrite/hasRead are set on EVERY touch regardless of column (TS has column:null),
 *     // so direction is always faithfully recorded even when column arrays are empty.
 *     accessors: Array<{ file: string, context: string|null, reads: string[], writes: string[], hasWrite: boolean, hasRead: boolean, line: number }>
 *   }>
 * }}
 */
export function buildGraph(repoRoot, config) {
  const files = [];
  const refs = [];
  const contextEdges = new Map();
  const tables = new Map();        // tableName -> { definedIn, columns, accessors }
  const bindingToTable = new Map(); // binding (or table name) -> canonical table name
  const pendingAccesses = [];      // { table, column, kind, line, file, context } (form b only)

  for (const abs of listSourceFiles(repoRoot)) {
    const rel = relative(repoRoot, abs).split(sep).join('/');
    const lang = registry.forFile(rel);
    if (!lang) continue;
    const fromContext = contextForFile(rel, config);
    files.push({ file: rel, context: fromContext });

    const { imports, tableDefs, tableAccesses } = lang.parseFile(readFileSync(abs, 'utf8'));

    // --- Track B: table definitions (where each table lives => its owning context) ---
    // Keep the FIRST definition seen (matches the columns rule below): one table has
    // one def-site here, so the cited owner/line is stable regardless of scan order.
    for (const def of tableDefs) {
      if (!tables.has(def.table)) {
        const definedIn = { file: rel, context: fromContext, line: def.line };
        tables.set(def.table, { definedIn, columns: def.columns, accessors: [] });
      }
      // Index is run-global: two files binding the same local name to different tables collide (last-writer-wins).
      bindingToTable.set(def.binding ?? def.table, def.table);
    }

    // --- Track B: table accesses (only form (b) scoped touches count) ---
    for (const a of tableAccesses) {
      if (!a.isTouch) continue; // form (a) imports seed the universe, not a touch
      pendingAccesses.push({ ...a, file: rel, context: fromContext });
    }

    for (const rec of imports) {
      const r = lang.resolveImport(rec, { fromFile: rel, fromContext, config, repoRoot });
      if (!r) continue;
      refs.push({
        fromFile: rel,
        fromContext,
        toContext: r.toContext,
        restModule: r.restModule,
        isLeak: r.isLeak,
        line: rec.line,
        path: r.displayPath,
        moduleKey: r.moduleKey,
      });
      if (fromContext) {
        if (!contextEdges.has(fromContext)) contextEdges.set(fromContext, new Set());
        contextEdges.get(fromContext).add(r.toContext);
      }
    }
  }

  // Attribute accesses to discovered tables only (form (b) is the precise touch;
  // an arbitrary `Foo::bar` whose `Foo` is no diesel table is never a touch).
  // Each access lands in its own direction bucket — `read` adds to `reads`, `write`
  // to `writes` — so a file that both reads and writes the table keeps both, and a
  // later write of one column never overwrites an earlier read of another.
  for (const acc of pendingAccesses) {
    const tableName = bindingToTable.get(acc.binding ?? acc.table) ?? acc.table;
    const t = tables.get(tableName);
    if (!t) continue; // not a discovered table — ignore
    let row = t.accessors.find((r) => r.file === acc.file);
    if (!row) {
      row = { file: acc.file, context: acc.context, reads: [], writes: [], hasWrite: false, hasRead: false, line: acc.line };
      t.accessors.push(row);
    }
    if (acc.kind === 'write') row.hasWrite = true; else row.hasRead = true;
    const bucket = acc.kind === 'write' ? row.writes : row.reads;
    if (acc.column && !bucket.includes(acc.column)) bucket.push(acc.column);
    if (acc.line < row.line) row.line = acc.line;
  }

  return { files, refs, contextEdges, tables };
}
