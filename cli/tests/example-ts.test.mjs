import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { detect } from '../src/detect.mjs';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const example = join(repoRoot, 'examples', 'order-ts');
const skip = !existsSync(join(example, 'ddd-council.json')) ? 'submodule not checked out' : false;

test('order-ts dogfood: all five planted detector rules fire', { skip }, () => {
  const ids = new Set(detect(example).findings.map((f) => f.signalId));
  for (const sig of [
    'leaky-boundary', 'circular-dependency', 'god-module',
    'cross-context-coupling', 'accidental-shared-kernel',
  ]) {
    assert.ok(ids.has(sig), `expected ${sig} to fire on order-ts; got ${[...ids].sort().join(', ')}`);
  }
});

test('order-ts dogfood: the orders kernel is high and names both contexts (non-owner write)', { skip }, () => {
  const k = detect(example).findings.find(
    (f) => f.signalId === 'accidental-shared-kernel' && f.message.includes('`orders`'));
  assert.ok(k, 'orders accidental-shared-kernel finding present');
  assert.equal(k.severity, 'high');           // fulfilment (non-owner) writes ordering's table
  assert.match(k.message, /ordering/);
  assert.match(k.message, /fulfilment/);
  // NOTE: the TS Sequelize collector records column:null for accesses, so the kernel message
  // names the contexts but NOT the column (unlike the Rust/diesel dogfood which cites a column).
  // Owner is deterministically `ordering` (sole model definer); assert it names ordering above.
});

test('order-ts dogfood: cross-context-coupling cites the billing chatty file', { skip }, () => {
  const f = detect(example).findings.find((x) => x.signalId === 'cross-context-coupling');
  assert.ok(f, 'cross-context-coupling finding present');
  assert.match(f.file, /billing\/service\.ts$/);
});
