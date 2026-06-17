// Builds the context-level dependency graph from parsed Rust files.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { parseRust } from './parse.mjs';
import { contextForFile, contextForModule } from './config.mjs';

const SKIP_DIRS = new Set(['target', 'node_modules', '.git']);

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
 *   contextEdges: Map<string, Set<string>>   // fromContext -> set of toContext
 * }}
 */
export function buildGraph(repoRoot, config) {
  const files = [];
  const refs = [];
  const contextEdges = new Map();

  for (const abs of listRustFiles(repoRoot)) {
    const rel = relative(repoRoot, abs).split(sep).join('/');
    const fromContext = contextForFile(rel, config);
    files.push({ file: rel, context: fromContext });

    const { uses } = parseRust(readFileSync(abs, 'utf8'));
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

  return { files, refs, contextEdges };
}
