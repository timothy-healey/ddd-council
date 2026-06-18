import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const plantedPath = join(repoRoot, 'examples', 'order-fulfilment', 'PLANTED.md');
const signalsPath = join(repoRoot, 'skills', 'ddd-council', 'reference', 'signals.md');

// The signal names PLANTED.md asserts (its column-2 "verbatim" values).
const PLANTED_SIGNALS = [
  'god aggregate',
  'leaked invariant',
  'anaemic domain model',
  'entity/value-object misclassification',
  'primitive obsession at the boundary',
  'missing domain events',
  'repository-per-entity',
  'domain logic in the application/service layer (persistence seam)',
  'accidental shared kernel',
];

test('drift guard: every PLANTED.md signal exists in signals.md', {
  skip: !existsSync(plantedPath) ? 'submodule not checked out' : false,
}, () => {
  const planted = readFileSync(plantedPath, 'utf8').toLowerCase();
  const signals = readFileSync(signalsPath, 'utf8').toLowerCase();

  // Each declared signal must actually appear in PLANTED.md (catches the answer key drifting)...
  for (const sig of PLANTED_SIGNALS) {
    assert.ok(planted.includes(sig.toLowerCase()),
      `PLANTED.md is missing declared signal: ${sig}`);
  }
  // ...and must still exist in the live council catalog (catches a rename/retire upstream).
  for (const sig of PLANTED_SIGNALS) {
    assert.ok(signals.includes(sig.toLowerCase()),
      `signals.md no longer contains: "${sig}" — PLANTED.md has drifted from the catalog`);
  }
});
