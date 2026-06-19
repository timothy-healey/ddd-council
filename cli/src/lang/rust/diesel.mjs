// Diesel ORM extractor (Track B). Behind the Rust language module; reads the
// `table!` macro (table universe) and `schema::<t>::<col>` scoped paths (touches).
// Tolerant: every collector degrades on malformed input and never throws.
import { walkTree } from '../walk.mjs';
import { flattenPath, flattenTokens } from './paths.mjs';

// Does this macro_invocation name diesel's `table!` macro? (`diesel::table!` or bare `table!`)
function isTableMacro(node) {
  const macro = node.childForFieldName('macro');
  if (!macro) return false;
  if (macro.type === 'identifier') return macro.text === 'table';
  const segs = flattenPath(macro);
  return segs.length > 0 && segs[segs.length - 1] === 'table';
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

// Known ORM/framework crate names that should never be mistaken for a table name in a
// scoped path. `sqlx::query` must not emit a touch of table `sqlx`.
const KNOWN_CRATES = new Set(['sqlx']);

// Collect form-(b) scoped table touches from a tree, classified read/write.
function collectScopedTouches(tree) {
  const out = [];
  walkTree(tree, (node) => {
    if (node.type !== 'scoped_identifier') return false;
    try {
      const ref = scopedTableRef(node);
      if (ref && !CRUD_CALLS.has(ref.name) && !KNOWN_CRATES.has(ref.table)) {
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

export { collectTableDefs, collectScopedTouches, importedTables };
