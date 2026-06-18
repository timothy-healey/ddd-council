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
    assert.ok(t.accessors.some((a) => a.context === 'fulfilment' && a.kind === 'write'));
    assert.ok(t.accessors.some((a) => a.context === 'ordering' && a.kind === 'read'));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
