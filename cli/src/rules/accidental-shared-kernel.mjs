// §B accidental-shared-kernel: a DB table that >=2 contexts read/write but none
// owns — a shared kernel created by accident, invisible to the import graph.
// Track B's schema-aware rule; grounds the §B "Accidental shared kernel" prose signal.
import { finding } from '../finding.mjs';

export const id = 'accidental-shared-kernel';

// Render one context's read/write split for the message. reads/writes are kept
// separate per column on each accessor row, so a context that both reads and writes
// the table reports `reads/writes` — the direction survives the graph merge.
function describe(context, rows) {
  const writes = [...new Set(rows.flatMap((r) => r.writes))];
  const reads = [...new Set(rows.flatMap((r) => r.reads))];
  const cols = [...new Set([...writes, ...reads])].sort();
  const colStr = cols.length ? ` \`${cols.join('`/`')}\`` : '';
  const verb = reads.length && writes.length ? 'reads/writes' : writes.length ? 'writes' : 'reads';
  return `${context} ${verb}${colStr}`;
}

export function check(graph, config) {
  const findings = [];
  const tableConfig = config.tables ?? {};

  for (const [table, t] of graph.tables ?? new Map()) {
    // Declared-intentional kernel -> the council has ruled; suppress (the one gate).
    if (tableConfig[table]?.sharedKernel === true) continue;

    // Real accessors: drop null-context files (declaring the schema is not using it
    // across a context line). Fire predicate: >=2 distinct non-null contexts touch it.
    const accessors = t.accessors.filter((a) => a.context != null);
    const contexts = [...new Set(accessors.map((a) => a.context))].sort();
    if (contexts.length < 2) continue;

    const definedInContext = t.definedIn?.context ?? null;

    // Severity ladder (write-ness consumed via accessor.writes only — never re-derived):
    //   null owner   -> high if ANY accessor writes (every write is a non-owner write).
    //   derived owner-> high only if a NON-owner writes; owner-write stays medium.
    const raisingWrite =
      definedInContext === null
        ? accessors.some((a) => a.writes.length > 0)
        : accessors.some((a) => a.writes.length > 0 && a.context !== definedInContext);
    const severity = raisingWrite ? 'high' : 'medium';

    // Messaging owner: config override (messaging-only) > derived > none.
    const owner = tableConfig[table]?.owner ?? definedInContext;
    const ownership = owner ? `owned by \`${owner}\`` : 'but owned by none of them';

    const split = contexts
      .map((c) => describe(c, accessors.filter((a) => a.context === c)))
      .join('; ');
    // The per-context split already names every column each context touches. Only
    // call out a "sharing" clause for columns >=2 contexts touch — the genuine shared
    // surface — and drop it when the per-context columns already imply the full set
    // (the common single-shared-column case), so the column isn't printed twice.
    const cols = (a) => [...a.reads, ...a.writes];
    const touchCount = new Map();
    for (const c of contexts) {
      for (const col of new Set(accessors.filter((a) => a.context === c).flatMap(cols))) {
        touchCount.set(col, (touchCount.get(col) ?? 0) + 1);
      }
    }
    const sharedCols = [...touchCount].filter(([, n]) => n >= 2).map(([col]) => col).sort();
    const allCols = [...new Set(accessors.flatMap(cols))].sort();
    const redundant = sharedCols.length === allCols.length && sharedCols.every((c, i) => c === allCols[i]);
    const colPhrase = sharedCols.length && !redundant ? ` sharing \`${sharedCols.join('`/`')}\`` : '';

    // Citation: definition site when known, else the first accessor — line numbers
    // come from the graph (runtime-derived), never hard-coded.
    const file = t.definedIn?.file ?? accessors[0]?.file ?? `(table ${table})`;
    const line = t.definedIn?.line ?? accessors[0]?.line ?? 0;

    findings.push(finding({
      signalId: id,
      severity,
      file,
      line,
      message:
        `Table \`${table}\` is touched by ${contexts.length} contexts ` +
        `(${split})${colPhrase} — ${ownership}: accidental shared kernel.`,
      suggestedMove:
        `Give \`${table}\` a single owning context with a published interface ` +
        `(one context owns it; others ask it to advance state via that interface or a ` +
        `published integration event — not the table), or split the shared columns into ` +
        `the consuming context's own table. If the share is deliberate, declare it: ` +
        `tables.${table}.sharedKernel = true.`,
    }));
  }
  return findings;
}
