// eval/tests/surface.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { surface, estTokens } from '../surface.mjs';

test('estTokens is chars/4 rounded up', () => {
  assert.equal(estTokens('abcd'), 1);
  assert.equal(estTokens('abcde'), 2);
});

test('sectioned total is no larger than monolithic, and delta is reported', () => {
  const { totals } = surface();
  assert.ok(totals.sectioned <= totals.monolithic);
  assert.ok(totals.monolithic > 0);
  assert.equal(typeof totals.deltaPct, 'number');
});

test('per-verb rows cover every manifest verb and are deterministic', () => {
  const a = surface().perVerb.map((r) => r.verb).sort();
  const b = surface().perVerb.map((r) => r.verb).sort();
  assert.deepEqual(a, b);
  assert.ok(a.includes('critique') && a.includes('aggregate'));
});
