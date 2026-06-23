import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { detect } from '../src/detect.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const fixture = join(here, 'fixture-columns');
const result = detect(fixture);
const kernels = result.findings.filter((f) => f.signalId === 'accidental-shared-kernel');
const byTable = (t) => kernels.find((f) => f.message.match(/Table `(\w+)`/)?.[1] === t);

test('unowned + resolved-disjoint columns -> low, reframed as colocated concerns', () => {
  const f = byTable('ledger');
  assert.ok(f, 'ledger fires (two contexts touch it)');
  assert.equal(f.severity, 'low', 'disjoint columns on an unowned table downgrade to low');
  assert.match(f.message, /disjoint columns/);
  assert.match(f.message, /colocated concerns/);
  assert.doesNotMatch(f.message, /accidental shared kernel\./, 'not the high/medium framing');
});

test('evidence gate: an unresolved (bare) touch keeps UNKNOWN -> not downgraded', () => {
  const f = byTable('mixedcols');
  assert.ok(f, 'mixedcols fires');
  assert.notEqual(f.severity, 'low', 'cannot prove disjointness with a bare touch -> no downgrade');
  // a bare write touch on a null-owner table keeps the current null-owner ladder (a write => high)
  assert.equal(f.severity, 'high');
});

test('declared owner makes a disjoint table ineligible -> not downgraded', () => {
  const f = byTable('priced');
  assert.ok(f, 'priced fires');
  assert.notEqual(f.severity, 'low', 'declared owner blocks the disjoint downgrade');
});
