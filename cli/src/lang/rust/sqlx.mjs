// SQLx ORM extractor. Behind the Rust language module: SQL lives in string literals
// inside sqlx::query!/query/query_as macros & calls, not in Rust paths. Two layers:
//   - classifySql(sql): pure verb+table extraction (table-level, no columns)
//   - collectSqlxAccesses(tree): find the query sites, pull the literal, classify
// Migration-side table discovery lives in lang/sql.mjs (the .sql schema source) —
// the two halves of SQLx support; the shared identifier helper is lang/sql-ident.mjs.
// Tolerant: unrecognized SQL yields [], never throws.
import { bareTableName } from '../sql-ident.mjs';

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
