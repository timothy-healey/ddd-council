import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { detect } from '../src/detect.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const result = detect(join(here, 'fixture-sqlx'));
const kernels = result.findings.filter((f) => f.signalId === 'accidental-shared-kernel');
const orders = kernels.find((f) => f.message.match(/Table `(\w+)`/)?.[1] === 'orders');

test('orders is flagged as an accidental shared kernel across the two contexts', () => {
  assert.ok(orders, 'orders fires');
  assert.match(orders.message, /ordering/);
  assert.match(orders.message, /fulfilment/);
});

test('null owner (migration def-site) + a non-owner write -> high', () => {
  assert.equal(orders.severity, 'high');
});

test('the cited def-site is the migration file', () => {
  assert.match(orders.file, /migrations\/0001_init\/up\.sql$/);
});
