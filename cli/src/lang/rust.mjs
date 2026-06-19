// Rust parsing layer. Isolated behind this module so the grammar is swappable —
// drop in another tree-sitter grammar later and the rest of the engine is polyglot.
import Parser from 'tree-sitter';
import Rust from 'tree-sitter-rust';
import { contextForModule } from '../config.mjs';
import { walkTree } from './walk.mjs';

const parser = new Parser();
parser.setLanguage(Rust);

// Flatten a path node (identifier | scoped_identifier | crate/self/super) to segments.
function flattenPath(node) {
  if (!node) return [];
  switch (node.type) {
    case 'identifier':
    case 'type_identifier':
    case 'crate':
    case 'self':
    case 'super':
    case 'metavariable':
    case 'primitive_type':
      return [node.text];
    case 'scoped_identifier': {
      const path = node.childForFieldName('path');
      const name = node.childForFieldName('name');
      return [...flattenPath(path), ...(name ? [name.text] : [])];
    }
    default:
      // Fallback: stitch identifier-ish descendants in order.
      return node.text.split('::').map((s) => s.trim()).filter(Boolean);
  }
}

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

// --- Track B: diesel schema layer (additive, same grammar, same seam) -------
// TOLERANT collectors behind the existing tree-sitter-rust seam, all riding the
// one walkTree. Each degrades on an unfamiliar/malformed body — best-effort, never
// throws. parseFile parses ONCE and runs every collector over that single tree.

// Does this macro_invocation name diesel's `table!` macro? (`diesel::table!` or bare `table!`)
function isTableMacro(node) {
  const macro = node.childForFieldName('macro');
  if (!macro) return false;
  if (macro.type === 'identifier') return macro.text === 'table';
  const segs = flattenPath(macro);
  return segs.length > 0 && segs[segs.length - 1] === 'table';
}

// Flatten every leaf token (named or anonymous) under a node, in source order.
function flattenTokens(node) {
  const out = [];
  (function rec(n) {
    if (n.childCount === 0) { out.push(n); return; }
    for (let i = 0; i < n.childCount; i++) rec(n.child(i));
  })(node);
  return out;
}

// Collect diesel `table! { NAME (pk) { col -> Ty, ... } }` definitions from a tree.
function collectTableDefs(tree) {
  const out = [];
  walkTree(tree, (node) => {
    if (!(node.type === 'macro_invocation' && isTableMacro(node))) return false;
    try {
      const outer = node.namedChildren.find((c) => c.type === 'token_tree');
      if (outer) {
        // First identifier in the outer token tree is the table name.
        const nameNode = outer.namedChildren.find((c) => c.type === 'identifier');
        // The column body is the last nested token_tree (after the pk tree).
        const bodies = outer.namedChildren.filter((c) => c.type === 'token_tree');
        const body = bodies.length ? bodies[bodies.length - 1] : null;
        const columns = [];
        if (body) {
          const toks = flattenTokens(body);
          for (let i = 0; i < toks.length - 1; i++) {
            if (toks[i].type === 'identifier' && toks[i + 1].text === '->') {
              columns.push(toks[i].text);
            }
          }
        }
        if (nameNode) {
          out.push({ table: nameNode.text, columns, line: nameNode.startPosition.row + 1 });
        }
      }
    } catch {
      // best-effort: skip this malformed def, keep scanning
    }
    return true; // don't descend into the macro body
  });
  return out;
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

// The ONE home of the write-verb vocabulary (spec invariant). The rule consumes
// `kind` only and never re-derives write-ness from the verb. `WRITE_VERBS` is the
// closed set of diesel constructs whose *operands* are writes; `READ_VERBS` are the
// query constructs whose operands are reads. Anything else (e.g. the column
// comparison `.eq`) is a transparent wrapper the classifier walks straight through.
const WRITE_VERBS = new Set(['insert_into', 'update', 'delete', 'set', 'values']);
const READ_VERBS = new Set(['filter', 'find', 'select', 'load', 'first', 'get_result', 'order', 'limit']);

// The call verb a node descends into via that call's *arguments* (not its receiver).
// Returns the verb name (path tail or method name) iff `node` sits inside `call`'s
// argument list; null when `node` is the receiver/function part.
function governingVerb(call, node) {
  const args = call.childForFieldName('arguments');
  if (!args) return null;
  // Is `node` within the `arguments` subtree?
  for (let cur = node; cur; cur = cur.parent) {
    if (cur === args) {
      const fn = call.childForFieldName('function');
      if (!fn) return null;
      if (fn.type === 'field_expression') {
        const field = fn.childForFieldName('field');
        return field ? field.text : null;
      }
      const segs = flattenPath(fn);
      return segs.length ? segs[segs.length - 1] : null;
    }
    if (cur === call) return null; // reached the call without crossing into args
  }
  return null;
}

// Classify one scoped access read/write. Walk enclosing call_expressions; the FIRST
// one that governs this node as a write- or read-verb operand decides. This scopes
// write-ness to the `.set(...)`/`.values(...)` value, the insert/update/delete target
// — NOT the whole update() argument subtree — so a column read in a `.filter(...)`
// predicate nested in an update stays a read. Read is the safe default.
function accessKind(node) {
  for (let cur = node.parent; cur; cur = cur.parent) {
    if (cur.type !== 'call_expression') continue;
    const verb = governingVerb(cur, node);
    if (verb == null) continue; // node is the receiver, or a transparent wrapper boundary
    if (WRITE_VERBS.has(verb)) return 'write';
    if (READ_VERBS.has(verb)) return 'read';
    // neutral wrapper (e.g. `.eq`, an unknown method) — keep walking outward.
  }
  return 'read';
}

// Resolve a scoped_identifier expression-path to its (tableHead, name) leaves, or
// null if it isn't a `<...>::<table>::<name>` shape. Accepts BOTH the 2-segment
// form (`orders::table`, path is a bare identifier) and the fully-qualified form
// (`crate::schema::orders::table`, path is itself scoped) — the latter is idiomatic
// diesel used WITHOUT importing the table module. The CALLER filters the head
// against the discovered table universe, so over-broad heads are harmless.
function scopedTableRef(node) {
  const path = node.childForFieldName('path');
  const name = node.childForFieldName('name');
  if (!path || !name) return null;
  if (path.type === 'identifier') return { table: path.text, name: name.text };
  if (path.type === 'scoped_identifier') {
    // The table head is the LAST segment of the qualifying path
    // (`crate::schema::orders` -> `orders`), `name` is the column / `table` leaf.
    const tail = path.childForFieldName('name');
    if (tail && tail.type === 'identifier') return { table: tail.text, name: name.text };
  }
  return null;
}

// `<t>::update`/`<t>::delete`/`<t>::insert_into` is a CRUD *verb* call, not a table
// touch — `diesel::update` must not masquerade as a touch of a table named `diesel`.
const CRUD_CALLS = new Set(['insert_into', 'update', 'delete']);

// Collect form-(b) scoped table touches from a tree, classified read/write.
function collectScopedTouches(tree) {
  const out = [];
  walkTree(tree, (node) => {
    if (node.type !== 'scoped_identifier') return false;
    try {
      const ref = scopedTableRef(node);
      if (ref && !CRUD_CALLS.has(ref.name)) {
        // `<t>::table` carries no real column; `<t>::<col>` does.
        const column = ref.name === 'table' ? null : ref.name;
        out.push({
          table: ref.table,
          column,
          kind: accessKind(node),
          line: node.startPosition.row + 1,
          isTouch: true,
        });
      }
    } catch { /* skip this path */ }
    return true; // a scoped_identifier's segments are leaves; no nested table path
  });
  return out;
}

// form (a): `use crate::schema::<t>` / `schema::<t>` imports seed the table universe.
function importedTables(uses) {
  const out = [];
  for (const u of uses) {
    const s = u.segments;
    const i = s.indexOf('schema');
    if (i !== -1 && s[i + 1] && s[i + 1] !== '*') {
      out.push({ table: s[i + 1], column: null, kind: 'read', line: u.line, isTouch: false });
    }
  }
  return out;
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
