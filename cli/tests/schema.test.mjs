import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { detect } from '../src/detect.mjs';
import { loadConfig } from '../src/config.mjs';
import { buildGraph } from '../src/graph.mjs';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const example = join(repoRoot, 'examples', 'order-fulfilment');
const skip = !existsSync(join(example, 'src', 'schema.rs')) ? 'submodule not checked out' : false;

test('dogfood: orders fires accidental-shared-kernel, high, naming both contexts', { skip }, () => {
  const result = detect(example);
  const orders = result.findings.filter(
    (f) => f.signalId === 'accidental-shared-kernel' && f.message.includes('`orders`'));
  assert.equal(orders.length, 1, 'exactly one orders finding');
  assert.equal(orders[0].severity, 'high'); // fulfilment writes orders.shipment_status
  assert.match(orders[0].message, /ordering/);
  assert.match(orders[0].message, /fulfilment/);
  assert.match(orders[0].message, /shipment_status/);
});

test('dogfood: line_items (single context) fires nothing', { skip }, () => {
  const result = detect(example);
  const li = result.findings.filter(
    (f) => f.signalId === 'accidental-shared-kernel' && f.message.includes('`line_items`'));
  assert.equal(li.length, 0);
});

test('dogfood: cited line equals the parsed def line (no rot)', { skip }, () => {
  const config = loadConfig(example);
  const graph = buildGraph(example, config);
  const orders = graph.tables.get('orders');
  assert.ok(orders, 'parser found the orders table');
  const f = detect(example).findings.find(
    (x) => x.signalId === 'accidental-shared-kernel' && x.message.includes('`orders`'));
  assert.equal(f.line, orders.definedIn.line, 'cited line is the runtime-derived def line');
  assert.equal(f.file, orders.definedIn.file);
});
