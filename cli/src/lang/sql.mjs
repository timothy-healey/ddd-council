// SQL migration parser — a *schema source* (not a language module): it seeds the
// table universe from `CREATE TABLE` and emits tableDefs ONLY (no imports, no
// resolveImport). See the participant-kind note in lang/index.mjs. The query-site
// half of SQLx support lives in lang/rust/sqlx.mjs. Tolerant: never throws.
import { bareTableName } from './sql-ident.mjs';

const CONSTRAINT_HEADS = new Set([
  'PRIMARY', 'FOREIGN', 'CONSTRAINT', 'UNIQUE', 'CHECK', 'KEY', 'INDEX', 'EXCLUDE',
]);

// Split a parenthesised body into top-level comma segments (depth-aware).
function topLevelSegments(body) {
  const segs = [];
  let depth = 0, cur = '';
  for (const ch of body) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) { segs.push(cur); cur = ''; }
    else cur += ch;
  }
  if (cur.trim()) segs.push(cur);
  return segs;
}

export function parseCreateTables(sql) {
  if (!sql) return [];
  const out = [];
  // Match `CREATE TABLE [IF NOT EXISTS] <name> ( <body> )` with a balanced-ish body.
  // Name: optional schema prefix with quoting variants: word, "word", `word`, "s"."t", s.t, etc.
  const re = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?((?:[`"\[]?[\w]+[`"\]]?\.)*[`"\[]?[\w]+[`"\]]?)\s*\(([\s\S]*?)\)\s*;/gi;
  let m;
  while ((m = re.exec(sql)) !== null) {
    try {
      const table = bareTableName(m[1]);
      const before = sql.slice(0, m.index);
      const line = before.split('\n').length;
      const columns = [];
      for (const seg of topLevelSegments(m[2])) {
        const t = seg.trim();
        if (!t) continue;
        const head = t.match(/^([`"\[]?[\w.]+[`"\]]?)/)?.[1];
        if (!head) continue;
        const word = bareTableName(head).toUpperCase();
        if (CONSTRAINT_HEADS.has(word)) continue;
        columns.push(bareTableName(head));
      }
      if (table) out.push({ table, columns, line });
    } catch { /* skip this malformed CREATE TABLE */ }
  }
  return out;
}

export function parseFile(source) {
  let defs;
  try { defs = parseCreateTables(source); } catch { defs = []; }
  return {
    imports: [],
    tableDefs: defs.map((d) => ({ ...d, defKind: 'migration' })),
    tableAccesses: [],
  };
}

// Schema source: tableDefs-only participant. NO resolveImport (see lang/index.mjs).
export default {
  extensions: ['.sql'],
  parseFile,
};
