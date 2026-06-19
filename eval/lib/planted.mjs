// eval/lib/planted.mjs
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadManifest } from './manifest.mjs';
import { monolithText } from './sections.mjs';

const DETECTOR_IDS = new Set([
  'leaky-boundary', 'circular-dependency', 'god-module',
  'cross-context-coupling', 'accidental-shared-kernel',
]);

/**
 * Build the prose-name → signalId map by parsing the catalog itself — the one
 * home for that binding (plan-vet F2). Handles both forms:
 *   - **God aggregate** … *(signalId: `god-aggregate`)*
 *   - **Leaky boundary** … `signalId: leaky-boundary`
 */
export function nameToId(signalsMd) {
  const map = {};
  let current = null;
  for (const line of signalsMd.split('\n')) {
    const b = line.match(/^- \*\*(.+?)\*\*/);
    if (b) current = b[1].replace(/`/g, '').trim().toLowerCase();
    const s = line.match(/signalId:\s*`?([a-z][a-z0-9-]+)`?/);
    if (s && current) map[current] = s[1];
  }
  return map;
}

let _catalog = null;
const catalogMap = () => (_catalog ??= nameToId(monolithText(loadManifest().skillDir)));

const normalizeId = (cell) => {
  const k = cell.trim().toLowerCase();
  return catalogMap()[k] ?? cell.trim(); // TS PLANTED already uses kebab ids → pass through
};

/**
 * Map a council-emitted signal — which may be the canonical kebab id OR the prose
 * bold name (the council sometimes emits "god aggregate" instead of "god-aggregate")
 * — to its canonical signalId via the same authoritative catalog map. Identity for
 * an already-canonical id. Used by the bench so a correct detection isn't a false miss.
 */
export const canonicalId = (idOrName) => normalizeId(String(idOrName ?? ''));

/** Parse the markdown table rows out of a PLANTED.md. */
function tableRows(md) {
  return md.split('\n')
    .filter((l) => l.trim().startsWith('|') && !/^\|[\s|:-]+\|?$/.test(l.trim()))
    .map((l) => l.split('|').slice(1, -1).map((c) => c.trim()));
}

export function parsePlanted(repoDir) {
  const md = readFileSync(join(repoDir, 'PLANTED.md'), 'utf8');
  const rows = tableRows(md);
  const header = rows[0].map((h) => h.toLowerCase());
  const body = rows.slice(1).filter((r) => /^\d+$/.test(r[0])); // numbered rows only

  const sigCol = header.findIndex((h) => h.includes('signal'));
  const secCol = header.findIndex((h) => h === 'section');
  const verbCol = header.findIndex((h) => h.startsWith('verb'));
  const locCol = header.findIndex((h) => h.includes('location') || h.includes('where'));

  return body.map((r) => {
    const signalId = normalizeId(r[sigCol]);
    const verbCell = verbCol >= 0 ? r[verbCol] : '';
    const verb = verbCell
      ? verbCell.split(/[\/]/)[0].trim().toLowerCase()
      : (DETECTOR_IDS.has(signalId) ? 'detector' : '');
    return {
      signalId,
      section: secCol >= 0 ? r[secCol].replace(/^§/, '') : '',
      verb,
      location: locCol >= 0 ? r[locCol] : '',
    };
  });
}

export const plantedForVerb = (rows, verb) => rows.filter((r) => r.verb === verb);
