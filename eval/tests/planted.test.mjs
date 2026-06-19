// eval/tests/planted.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parsePlanted, plantedForVerb, nameToId, canonicalId } from '../lib/planted.mjs';
import { REPO_ROOT, loadManifest } from '../lib/manifest.mjs';
import { monolithText } from '../lib/sections.mjs';

const rust = join(REPO_ROOT, 'examples', 'order-fulfilment');
const skip = !existsSync(join(rust, 'PLANTED.md')) ? 'submodule not checked out' : false;

test('canonicalId maps a council prose name to its kebab id, passes a kebab id through', () => {
  // the council sometimes emits the bold prose name instead of the marker id
  assert.equal(canonicalId('god aggregate'), 'god-aggregate');
  assert.equal(canonicalId('God Aggregate'), 'god-aggregate');
  assert.equal(canonicalId('god-aggregate'), 'god-aggregate'); // already canonical → identity
  assert.equal(canonicalId('leaked invariant'), 'leaked-invariant');
});

test('canonicalId resolves a kebab-cased prose name to its shorter canonical id', () => {
  // council kebab-cases the full bold name "Primitive obsession at the boundary";
  // the catalog id is the shorter `primitive-obsession`.
  assert.equal(canonicalId('primitive-obsession-at-the-boundary'), 'primitive-obsession');
});

test('canonicalId resolves a near-miss id (extra stopword) to canonical', () => {
  // council emits the shortened kebab with an extra "the"; catalog id has none.
  assert.equal(canonicalId('domain-logic-in-the-service-layer'), 'domain-logic-in-service-layer');
});

test('nameToId parses both signalId forms from a tiny catalog', () => {
  const md = [
    '- **God aggregate** — one root pulls in too much. *(signalId: `god-aggregate`)*',
    '- **Leaky boundary** — reaches in.',
    '  `signalId: leaky-boundary` — engine note',
  ].join('\n');
  const m = nameToId(md);
  assert.equal(m['god aggregate'], 'god-aggregate');
  assert.equal(m['leaky boundary'], 'leaky-boundary');
});

test('every Rust PLANTED prose name resolves to a catalog id (no orphan names)', { skip }, () => {
  const map = nameToId(monolithText(loadManifest().skillDir));
  for (const r of parsePlanted(rust)) {
    assert.match(r.signalId, /^[a-z][a-z0-9-]+$/, `unresolved planted name → ${r.signalId}`);
  }
  // the map must actually cover the planted prose, not silently pass through unknown text
  assert.ok(Object.values(map).includes('god-aggregate'));
});

test('rust PLANTED maps prose names to canonical ids', { skip }, () => {
  const rows = parsePlanted(rust);
  const ids = rows.map((r) => r.signalId);
  assert.ok(ids.includes('god-aggregate'));
  assert.ok(ids.includes('accidental-shared-kernel'));
  assert.equal(rows.length, 9);
});

test('plantedForVerb filters by owning verb', { skip }, () => {
  const agg = plantedForVerb(parsePlanted(rust), 'aggregate').map((r) => r.signalId);
  assert.ok(agg.includes('god-aggregate'));
  assert.ok(agg.includes('leaked-invariant'));
  assert.ok(!agg.includes('missing-domain-events')); // that's events' row
});
