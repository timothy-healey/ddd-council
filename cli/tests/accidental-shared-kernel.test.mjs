import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { detect } from '../src/detect.mjs';
import { loadConfig } from '../src/config.mjs';
import { buildGraph } from '../src/graph.mjs';
import * as rule from '../src/rules/accidental-shared-kernel.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const fixture = join(here, 'fixture-schema');
const result = detect(fixture);
const kernels = result.findings.filter((f) => f.signalId === 'accidental-shared-kernel');
// Anchor on the parsed table token (the same `Table \`<name>\`` shape the messages
// open with) so a table name that is a substring of another can't false-match.
const byTable = (t) => kernels.find((f) => f.message.match(/Table `(\w+)`/)?.[1] === t);

test('exports id = accidental-shared-kernel', () => {
  assert.equal(rule.id, 'accidental-shared-kernel');
});

test('fires exactly one finding per shared table (orders, widgets, bins) — not solo', () => {
  const tables = kernels.map((f) => f.message.match(/Table `(\w+)`/)?.[1]).sort();
  assert.deepEqual(tables, ['bins', 'orders', 'widgets']);
});

test('null-owner + a write -> high (orders, the canonical case)', () => {
  const f = byTable('orders');
  assert.ok(f, 'orders fires');
  assert.equal(f.severity, 'high');
  assert.match(f.message, /ordering/);
  assert.match(f.message, /fulfilment/);
  assert.match(f.message, /shipment_status/);
});

test('non-null owner, only owner writes -> medium (widgets)', () => {
  const f = byTable('widgets');
  assert.ok(f, 'widgets fires (shared read by ordering)');
  assert.equal(f.severity, 'medium', 'owner-write does NOT raise severity');
});

test('non-null owner, non-owner writes -> high (bins)', () => {
  const f = byTable('bins');
  assert.ok(f, 'bins fires');
  assert.equal(f.severity, 'high', 'a non-owner (ordering) write raises severity');
});

test('single shared column is named once, not echoed by a redundant "sharing" clause', () => {
  const f = byTable('orders');
  // The per-context split already names shipment_status for each context; the union
  // "sharing ..." clause would just repeat it, so it is dropped in this case.
  const occurrences = (f.message.match(/shipment_status/g) || []).length;
  assert.equal(occurrences, 2, 'named once per context, not a third time in a sharing clause');
  assert.ok(!/sharing/.test(f.message), 'no redundant sharing clause when columns coincide');
});

test('single-context table does not fire (solo, negative control)', () => {
  assert.ok(!byTable('solo'), 'solo touched by one context only => no finding');
});

test('sharedKernel:true suppresses a would-be finding (rule unit)', () => {
  const config = loadConfig(fixture);
  const graph = buildGraph(fixture, config);
  const suppressed = rule.check(graph, { ...config, tables: { orders: { sharedKernel: true } } });
  assert.ok(!suppressed.some((f) => f.message.includes('`orders`')), 'orders suppressed');
  assert.ok(suppressed.some((f) => f.message.includes('`bins`')), 'others still fire');
});

test('citation line/file come from the parsed graph, not a literal', () => {
  const config = loadConfig(fixture);
  const graph = buildGraph(fixture, config);
  const orders = graph.tables.get('orders');
  const f = byTable('orders');
  assert.equal(f.line, orders.definedIn.line, 'cited line is the runtime-derived def line');
  assert.equal(f.file, orders.definedIn.file);
});

test('negative control: the import-graph fixture (no table!) yields zero findings', () => {
  const r = detect(join(here, 'fixture'));
  assert.equal(r.findings.filter((f) => f.signalId === 'accidental-shared-kernel').length, 0);
});
