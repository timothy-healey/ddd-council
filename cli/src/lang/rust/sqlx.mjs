// SQLx ORM extractor. Behind the Rust language module: SQL lives in string literals
// inside sqlx::query!/query/query_as macros & calls, not in Rust paths. Two layers:
//   - classifySql(sql): pure verb+table extraction (table-level, no columns)
//   - collectSqlxAccesses(tree): find the query sites, pull the literal, classify
// Migration-side table discovery lives in lang/sql.mjs (the .sql schema source) —
// the two halves of SQLx support; the shared identifier helper is lang/sql-ident.mjs.
// Tolerant: unrecognized SQL yields [], never throws.
import { bareTableName } from '../sql-ident.mjs';
import { walkTree } from '../walk.mjs';
import { flattenPath } from './paths.mjs';

// Collect tables following any of `keywords` in `sql` (case-insensitive), tagged `kind`.
function tablesAfter(sql, keywords, kind) {
  const out = [];
  const kw = keywords.join('|');
  const re = new RegExp(`\\b(?:${kw})\\s+((?:[\`"\\[][\\w]+[\`"\\]]|[\\w]+)(?:\\.(?:[\`"\\[][\\w]+[\`"\\]]|[\\w]+))*)`, 'gi');
  let m;
  while ((m = re.exec(sql)) !== null) {
    const table = bareTableName(m[1]);
    if (table && !out.some((e) => e.table === table)) out.push({ table, kind });
  }
  return out;
}

const QUERY_NAMES = new Set([
  'query', 'query_as', 'query_scalar', 'query_unchecked', 'query_as_unchecked',
]);

// Tail segment of a macro/function path: `sqlx::query` -> 'query', `query` -> 'query'.
// For generic_function (turbofish), reads the 'function' field child to avoid pulling
// the type_arguments segment as the name.
function callName(node) {
  if (!node) return null;
  if (node.type === 'identifier') return node.text;
  if (node.type === 'generic_function') {
    const fn_ = node.childForFieldName('function');
    return fn_ ? callName(fn_) : null;
  }
  if (node.type === 'scoped_identifier' || node.type === 'field_expression') {
    const segs = flattenPath(node);
    return segs.length ? segs[segs.length - 1] : null;
  }
  return null;
}

// Unwrap a Rust string/raw-string literal node to its inner text, or null.
function sqlLiteral(node) {
  if (!node) return null;
  if (node.type === 'raw_string_literal') {
    const m = node.text.match(/^r(#*)"([\s\S]*)"\1$/);
    return m ? m[2] : null;
  }
  if (node.type === 'string_literal') {
    const m = node.text.match(/^"([\s\S]*)"$/);
    return m ? m[1] : null;
  }
  return null;
}

// First descendant string/raw-string literal under a node (the SQL argument).
function firstStringLiteral(node) {
  let found = null;
  (function rec(n) {
    if (found || !n) return;
    if (n.type === 'string_literal' || n.type === 'raw_string_literal') { found = n; return; }
    for (let i = 0; i < n.childCount; i++) rec(n.child(i));
  })(node);
  return found;
}

export function collectSqlxAccesses(tree) {
  const out = [];
  walkTree(tree, (node) => {
    let name = null;
    let argHost = null;
    if (node.type === 'macro_invocation') {
      name = callName(node.childForFieldName('macro'));
      argHost = node.namedChildren.find((c) => c.type === 'token_tree');
    } else if (node.type === 'call_expression') {
      name = callName(node.childForFieldName('function'));
      argHost = node.childForFieldName('arguments');
    } else {
      return false;
    }
    if (!name || !QUERY_NAMES.has(name) || !argHost) return false;
    try {
      const lit = firstStringLiteral(argHost);
      const sql = sqlLiteral(lit);
      if (sql) {
        for (const { table, kind } of classifySql(sql)) {
          out.push({ table, column: null, kind, line: node.startPosition.row + 1, isTouch: true });
        }
      }
    } catch { /* tolerant: skip this query site */ }
    return false; // a query may nest inside another expression; keep scanning
  });
  return out;
}

export function classifySql(sql) {
  if (!sql) return [];
  // Strip line + block comments, collapse whitespace.
  const clean = sql
    .replace(/--[^\n]*/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!clean) return [];
  const verb = clean.match(/^(\w+)/)?.[1]?.toUpperCase();

  const merge = (...lists) => {
    const out = [];
    for (const e of lists.flat()) {
      const dup = out.find((o) => o.table === e.table);
      if (!dup) out.push(e);
      else if (dup.kind === 'read' && e.kind === 'write') dup.kind = 'write'; // write wins
    }
    return out;
  };

  switch (verb) {
    case 'SELECT':
    case 'WITH':
      return merge(tablesAfter(clean, ['FROM', 'JOIN'], 'read'));
    case 'INSERT':
      return merge(tablesAfter(clean, ['INTO'], 'write'), tablesAfter(clean, ['FROM', 'JOIN'], 'read'));
    case 'UPDATE':
      return merge(tablesAfter(clean, ['UPDATE'], 'write'), tablesAfter(clean, ['FROM', 'JOIN'], 'read'));
    case 'DELETE':
      return merge(tablesAfter(clean, ['FROM'], 'write'), tablesAfter(clean, ['USING', 'JOIN'], 'read'));
    default:
      return [];
  }
}
