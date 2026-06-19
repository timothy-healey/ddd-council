// Rust parsing layer. Isolated behind this module so the grammar is swappable —
// drop in another tree-sitter grammar later and the rest of the engine is polyglot.
import Parser from 'tree-sitter';
import Rust from 'tree-sitter-rust';
import { contextForModule } from '../config.mjs';
import { walkTree } from './walk.mjs';
import { flattenPath } from './rust/paths.mjs';
import { collectTableDefs, collectScopedTouches, importedTables } from './rust/diesel.mjs';

const parser = new Parser();
parser.setLanguage(Rust);

// Expand a use-tree into an array of segment-arrays (one per imported path).
function expandUseTree(node, prefix = []) {
  if (!node) return [];
  switch (node.type) {
    case 'self':
      // `use foo::bar::{self}` refers to the module `foo::bar` itself, not a
      // member named "self" — drop it when it carries a prefix. A bare `self`
      // (no prefix) is a relative path and kept as-is.
      return prefix.length ? [[...prefix]] : [[...prefix, node.text]];
    case 'identifier':
    case 'crate':
    case 'super':
    case 'metavariable':
      return [[...prefix, node.text]];
    case 'scoped_identifier':
      return [[...prefix, ...flattenPath(node)]];
    case 'use_as_clause': {
      const path = node.childForFieldName('path');
      return [[...prefix, ...flattenPath(path)]];
    }
    case 'use_wildcard': {
      const path = node.namedChildren.find((c) => c.type !== 'use_list');
      return [[...prefix, ...flattenPath(path), '*']];
    }
    case 'use_list': {
      const out = [];
      for (const child of node.namedChildren) out.push(...expandUseTree(child, prefix));
      return out;
    }
    case 'scoped_use_list': {
      const path = node.childForFieldName('path');
      const list = node.childForFieldName('list');
      const newPrefix = [...prefix, ...flattenPath(path)];
      return expandUseTree(list, newPrefix);
    }
    default: {
      const out = [];
      for (const child of node.namedChildren) out.push(...expandUseTree(child, prefix));
      return out;
    }
  }
}

// Collect the imported use-paths from an already-parsed tree.
function collectUses(tree) {
  const uses = [];
  walkTree(tree, (node) => {
    if (node.type !== 'use_declaration') return false;
    // Skip a leading `pub`/`pub(crate)` etc. — its visibility_modifier is the
    // first named child, but the use tree is what we want. Missing this drops
    // every `pub use` re-export, the main way contexts leak each other's internals.
    const arg = node.namedChildren.find((c) => c.type !== 'visibility_modifier');
    for (const segments of expandUseTree(arg)) {
      uses.push({ segments, line: node.startPosition.row + 1 });
    }
    return true; // don't descend into the use itself
  });
  return uses;
}

/**
 * Parse one Rust source file.
 * @returns {{ imports: Array<{ segments: string[], line: number }> }}
 */
export function parseRust(source) {
  return { imports: collectUses(parser.parse(source)) };
}

/**
 * Discover diesel `table!` definitions. Tolerant: never throws.
 * @returns {Array<{ table: string, columns: string[], line: number }>}
 */
export function parseTableDefs(source) {
  let tree;
  try { tree = parser.parse(source); } catch { return []; } // unparseable source: degrade
  return collectTableDefs(tree);
}

/**
 * Parse one Rust source file ONCE and run every collector over the single tree.
 * The grammar is tokenized exactly once per file (the hot path of the only stage
 * that reads every file). Tolerant: an unparseable source yields empty collections.
 * @returns {{ imports, tableDefs, tableAccesses }}
 */
export function parseFile(source) {
  let tree;
  try {
    tree = parser.parse(source);
  } catch {
    return { imports: [], tableDefs: [], tableAccesses: [] };
  }
  const uses = collectUses(tree);
  return {
    imports: uses,
    tableDefs: collectTableDefs(tree),
    // form (a) imports seed the universe; form (b) scoped paths are the precise touch.
    tableAccesses: [...importedTables(uses), ...collectScopedTouches(tree)],
  };
}

/**
 * Collect diesel table accesses. Two forms:
 *   (a) `use crate::schema::{a,b}` imports  -> seed the universe (isTouch:false)
 *   (b) scoped expression paths `<t>::table` / `<t>::<col>` -> the precise touch
 *       (isTouch:true), each classified read/write. Both the 2-segment
 *       (`orders::table`) and fully-qualified (`crate::schema::orders::table`) shapes.
 * The CALLER filters `table` against the discovered table universe. Tolerant: never throws.
 * @returns {Array<{ table, column: string|null, kind: 'read'|'write', line: number, isTouch: boolean }>}
 */
export function parseTableAccesses(source) {
  return parseFile(source).tableAccesses;
}

// Strip leading crate/self/super; return null if the path is intra-context relative.
function normalizeLeading(segments) {
  let segs = [...segments];
  if (segs[0] === 'crate') segs = segs.slice(1);
  if (segs[0] === 'self' || segs[0] === 'super') return null; // relative -> same context
  return segs;
}

export default {
  extensions: ['.rs'],
  parseFile,
  // record = { segments: string[], line }. Resolve a Rust use-path to a cross-context edge,
  // or null for std/external crate / intra-context.
  resolveImport({ segments }, { fromContext, config }) {
    const segs = normalizeLeading(segments);
    if (!segs || segs.length === 0) return null;
    const toContext = contextForModule(segs[0], config);
    if (!toContext || toContext === fromContext) return null;
    const rest = segs.slice(1);
    const restModule = rest.length >= 1 ? rest[0] : null;
    const throughPublic = restModule && config.contexts[toContext].publicModules.includes(restModule);
    // moduleKey: the neutral hub key god-module groups on. `segs[0]::restModule` reproduces
    // today's `ref.path.split('::').slice(0,2)` verbatim (e.g. `billing::api`), so the Rust
    // detect.test `/billing::api/` assertion is preserved.
    const moduleKey = restModule ? `${segs[0]}::${restModule}` : segs[0];
    return { toContext, restModule, isLeak: rest.length >= 1 && !throughPublic, displayPath: segs.join('::'), moduleKey };
  },
};
