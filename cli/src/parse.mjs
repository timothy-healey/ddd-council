// Rust parsing layer. Isolated behind this module so the grammar is swappable —
// drop in another tree-sitter grammar later and the rest of the engine is polyglot.
import Parser from 'tree-sitter';
import Rust from 'tree-sitter-rust';

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

/**
 * Parse one Rust source file.
 * @returns {{ uses: Array<{ segments: string[], line: number }> }}
 */
export function parseRust(source) {
  const tree = parser.parse(source);
  const uses = [];
  (function walk(node) {
    if (node.type === 'use_declaration') {
      // Skip a leading `pub`/`pub(crate)` etc. — its visibility_modifier is the
      // first named child, but the use tree is what we want. Missing this drops
      // every `pub use` re-export, the main way contexts leak each other's internals.
      const arg = node.namedChildren.find((c) => c.type !== 'visibility_modifier');
      for (const segments of expandUseTree(arg)) {
        uses.push({ segments, line: node.startPosition.row + 1 });
      }
      return; // don't descend into the use itself
    }
    for (let i = 0; i < node.childCount; i++) walk(node.child(i));
  })(tree.rootNode);
  return { uses };
}

// --- Track B: diesel schema layer (additive, same grammar, same seam) -------
// Two TOLERANT helpers behind the existing tree-sitter-rust seam. Both degrade
// on an unfamiliar/malformed macro body — capture best-effort data, never throw.

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

/**
 * Discover diesel `table! { NAME (pk) { col -> Ty, ... } }` definitions.
 * The outer token_tree's children are `{ NAME (pk_tree) (body_tree) }`; the
 * column body is the LAST nested token_tree. A column is an identifier whose
 * following token is `->`. Tolerant: never throws.
 * @returns {Array<{ table: string, columns: string[], line: number }>}
 */
export function parseTableDefs(source) {
  const out = [];
  let tree;
  try {
    tree = parser.parse(source);
  } catch {
    return out; // unparseable source: degrade
  }
  (function walk(node) {
    if (node.type === 'macro_invocation' && isTableMacro(node)) {
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
      return; // don't descend into the macro body
    }
    for (let i = 0; i < node.childCount; i++) walk(node.child(i));
  })(tree.rootNode);
  return out;
}

// The ONE home of the write-verb vocabulary (spec invariant). The rule consumes
// `kind` only and never re-derives write-ness from the verb.
const WRITE_CALLS = new Set(['insert_into', 'update', 'delete']);
const WRITE_METHODS = new Set(['set']);

// Classify one scoped access by its nearest enclosing diesel call. A `.set(...)`
// method-call ancestor, or an `insert_into`/`update`/`delete` path-call ancestor,
// makes it a write; otherwise read (the safe default).
function accessKind(node) {
  for (let cur = node.parent; cur; cur = cur.parent) {
    if (cur.type === 'call_expression') {
      const fn = cur.childForFieldName('function');
      if (fn) {
        if (fn.type === 'field_expression') {
          const field = fn.childForFieldName('field');
          if (field && WRITE_METHODS.has(field.text)) return 'write';
        } else {
          const segs = flattenPath(fn);
          const last = segs[segs.length - 1];
          if (WRITE_CALLS.has(last)) return 'write';
        }
      }
    }
  }
  return 'read';
}

/**
 * Collect diesel table accesses. Two forms:
 *   (a) `use crate::schema::{a,b}` imports  -> seed the universe (viaScoped:false)
 *   (b) scoped expression paths `<t>::table` / `<t>::<col>` -> the precise touch
 *       (viaScoped:true), each classified read/write.
 * The CALLER filters `table` against the discovered table universe. Tolerant: never throws.
 * @returns {Array<{ table, column: string|null, kind: 'read'|'write', line: number, viaScoped: boolean }>}
 */
export function parseTableAccesses(source) {
  const out = [];
  // form (a): reuse parseRust's use-walk for `crate::schema::<t>` / `schema::<t>`.
  try {
    for (const u of parseRust(source).uses) {
      const s = u.segments;
      const i = s.indexOf('schema');
      if (i !== -1 && s[i + 1] && s[i + 1] !== '*') {
        out.push({ table: s[i + 1], column: null, kind: 'read', line: u.line, viaScoped: false });
      }
    }
  } catch { /* degrade */ }
  // form (b): scoped_identifier whose path is a single identifier (the table head).
  let tree;
  try {
    tree = parser.parse(source);
  } catch {
    return out;
  }
  (function walk(node) {
    if (node.type === 'scoped_identifier') {
      try {
        const path = node.childForFieldName('path');
        const name = node.childForFieldName('name');
        if (path && path.type === 'identifier' && name) {
          // `<t>::table` carries no real column; `<t>::<col>` does.
          const column = name.text === 'table' ? null : name.text;
          out.push({
            table: path.text,
            column,
            kind: accessKind(node),
            line: node.startPosition.row + 1,
            viaScoped: true,
          });
        }
      } catch { /* skip this path */ }
      return; // a scoped_identifier's segments are leaves; no nested table path
    }
    for (let i = 0; i < node.childCount; i++) walk(node.child(i));
  })(tree.rootNode);
  return out;
}
