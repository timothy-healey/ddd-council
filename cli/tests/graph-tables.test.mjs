import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadConfig } from '../src/config.mjs';
import { buildGraph } from '../src/graph.mjs';

function tempRepo() {
  const dir = mkdtempSync(join(tmpdir(), 'ddd-graph-'));
  writeFileSync(join(dir, 'ddd-council.json'), JSON.stringify({
    contexts: {
      ordering:   { module: 'ordering',   paths: ['src/ordering/**'],   publicModules: ['api'] },
      fulfilment: { module: 'fulfilment', paths: ['src/fulfilment/**'], publicModules: ['api'] },
    },
  }));
  mkdirSync(join(dir, 'src/ordering'), { recursive: true });
  mkdirSync(join(dir, 'src/fulfilment'), { recursive: true });
  writeFileSync(join(dir, 'src/schema.rs'),
    `diesel::table! { orders (id) { id -> BigInt, shipment_status -> Text } }`);
  writeFileSync(join(dir, 'src/ordering/repository.rs'),
    `use crate::schema::orders;\nfn r(c:&mut C){ orders::table.find(1).select(orders::shipment_status).first(c) }`);
  writeFileSync(join(dir, 'src/fulfilment/repository.rs'),
    `use crate::schema::orders;\nfn w(c:&mut C){ diesel::update(orders::table.find(1)).set(orders::shipment_status.eq("S")).execute(c) }`);
  return dir;
}

test('buildGraph: keeps the existing fields (additive only)', () => {
  const dir = tempRepo();
  try {
    const g = buildGraph(dir, loadConfig(dir));
    assert.ok(Array.isArray(g.files));
    assert.ok(Array.isArray(g.refs));
    assert.ok(g.contextEdges instanceof Map);
    assert.ok(g.tables instanceof Map, 'new tables field is a Map');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('graph.tables: orders defined in shared infra -> null owner, two accessor contexts', () => {
  const dir = tempRepo();
  try {
    const g = buildGraph(dir, loadConfig(dir));
    const t = g.tables.get('orders');
    assert.ok(t, 'orders discovered');
    assert.equal(t.definedIn.context, null, 'schema.rs matches no glob => null owner');
    assert.match(t.definedIn.file, /schema\.rs$/);
    assert.ok(t.columns.includes('shipment_status'));
    const ctxs = new Set(t.accessors.map((a) => a.context));
    assert.deepEqual([...ctxs].sort(), ['fulfilment', 'ordering']);
    assert.ok(t.accessors.some((a) => a.context === 'fulfilment' && a.writes.includes('shipment_status')));
    assert.ok(t.accessors.some((a) => a.context === 'ordering' && a.reads.includes('shipment_status')));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('graph.tables: a file that both reads and writes the table keeps BOTH directions', () => {
  // The leaked-invariant regression: read+write in one file must not collapse to a
  // single `write` with mixed columns. reads/writes stay separate per column.
  const dir = mkdtempSync(join(tmpdir(), 'ddd-graph-rw-'));
  try {
    writeFileSync(join(dir, 'ddd-council.json'), JSON.stringify({
      contexts: { ops: { module: 'ops', paths: ['src/ops/**'], publicModules: ['api'] } },
    }));
    mkdirSync(join(dir, 'src/ops'), { recursive: true });
    writeFileSync(join(dir, 'src/schema.rs'),
      `diesel::table! { orders (id) { id -> BigInt, shipment_status -> Text } }`);
    // one file reads `id` (a select) AND writes `shipment_status` (a .set)
    writeFileSync(join(dir, 'src/ops/repo.rs'),
      `use crate::schema::orders;\nfn rw(c:&mut C){\n` +
      `  orders::table.find(1).select(orders::id).first(c);\n` +
      `  diesel::update(orders::table.find(1)).set(orders::shipment_status.eq("S")).execute(c);\n}`);
    const t = buildGraph(dir, loadConfig(dir)).tables.get('orders');
    const row = t.accessors.find((a) => a.context === 'ops');
    assert.ok(row, 'ops touches orders');
    assert.ok(row.reads.includes('id'), `read column survives, got reads=${row.reads}`);
    assert.ok(row.writes.includes('shipment_status'), `write column survives, got writes=${row.writes}`);
    assert.ok(!row.reads.includes('shipment_status'), 'a written column is not also recorded as a read');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
