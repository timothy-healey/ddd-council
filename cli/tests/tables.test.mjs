import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseTableDefs } from '../src/parse.mjs';

const SCHEMA = `//! diesel schema.
diesel::table! {
    orders (id) {
        id -> BigInt,
        total_cents -> BigInt,
        payment_state -> Text,
        shipment_status -> Text,
        customer_id -> BigInt,
    }
}

diesel::table! {
    line_items (id) {
        id -> BigInt,
        order_id -> BigInt,
        product -> Text,
        unit_price_cents -> BigInt,
        quantity -> Integer,
    }
}`;

test('parseTableDefs: finds both tables with their columns', () => {
  const defs = parseTableDefs(SCHEMA);
  const byName = Object.fromEntries(defs.map((d) => [d.table, d]));
  assert.deepEqual(Object.keys(byName).sort(), ['line_items', 'orders']);
  assert.ok(byName.orders.columns.includes('shipment_status'));
  assert.ok(byName.orders.columns.includes('total_cents'));
  assert.equal(byName.orders.columns.length, 5);
  assert.ok(byName.line_items.columns.includes('order_id'));
});

test('parseTableDefs: records the 1-based definition line of each table', () => {
  const defs = parseTableDefs(SCHEMA);
  const orders = defs.find((d) => d.table === 'orders');
  assert.ok(orders.line >= 1, `got line ${orders.line}`);
});

test('parseTableDefs: bare table! (no diesel:: path) is also discovered', () => {
  const defs = parseTableDefs('table! {\n  widgets (id) {\n    id -> BigInt,\n  }\n}');
  assert.equal(defs.length, 1);
  assert.equal(defs[0].table, 'widgets');
});

test('parseTableDefs: degrades (never throws) on a malformed table! body', () => {
  assert.doesNotThrow(() => parseTableDefs('diesel::table! { orders (id) { id -> '));
  assert.doesNotThrow(() => parseTableDefs('diesel::table! { }'));
  assert.doesNotThrow(() => parseTableDefs('garbage not even rust :::'));
  assert.ok(Array.isArray(parseTableDefs('fn x() {}')));
});

test('parseTableDefs: a non-table macro is ignored', () => {
  assert.deepEqual(parseTableDefs('println!("hello {}", x); vec![1,2,3];'), []);
});

import { parseTableAccesses } from '../src/parse.mjs';

const WRITE_SRC = `use diesel::prelude::*;
use crate::schema::orders;
impl ShipmentRepository {
    pub fn mark_shipped(conn: &mut C, order_id: i64) -> R {
        diesel::update(orders::table.find(order_id))
            .set(orders::shipment_status.eq("Shipped"))
            .execute(conn)
    }
}`;

const READ_SRC = `use crate::schema::{orders, line_items};
impl OrderRepository {
    pub fn shipment_status(conn: &mut C, order_id: i64) -> R {
        orders::table.find(order_id).select(orders::shipment_status).first(conn)
    }
}`;

const INSERT_SRC = `use crate::schema::line_items;
fn save(conn: &mut C) -> R {
    diesel::insert_into(line_items::table).values((line_items::product.eq("x"),)).execute(conn)
}`;

test('parseTableAccesses: classifies a diesel update/.set as a write', () => {
  const acc = parseTableAccesses(WRITE_SRC);
  const w = acc.find((a) => a.column === 'shipment_status');
  assert.ok(w, 'found shipment_status access');
  assert.equal(w.table, 'orders');
  assert.equal(w.kind, 'write');
  assert.equal(w.viaScoped, true);
  assert.ok(w.line >= 1, `cited at a real line, got ${w.line}`);
  // form (a) import is also seeded
  assert.ok(acc.some((a) => a.table === 'orders' && a.viaScoped === false));
});

test('parseTableAccesses: classifies a select/find/first as a read', () => {
  const acc = parseTableAccesses(READ_SRC);
  const r = acc.find((a) => a.column === 'shipment_status' && a.viaScoped);
  assert.ok(r, 'found read of shipment_status');
  assert.equal(r.kind, 'read');
});

test('parseTableAccesses: classifies insert_into as a write', () => {
  const acc = parseTableAccesses(INSERT_SRC);
  assert.ok(acc.some((a) => a.table === 'line_items' && a.kind === 'write' && a.viaScoped));
});

test('parseTableAccesses: imported-but-unused table records no scoped touch (form b decides)', () => {
  const src = `use crate::schema::{orders, unused};
    fn q(c: &mut C) { orders::table.find(1).select(orders::id).load(c) }`;
  const acc = parseTableAccesses(src);
  const scopedTouches = new Set(acc.filter((a) => a.viaScoped).map((a) => a.table));
  assert.ok(scopedTouches.has('orders'), 'orders is actually queried');
  assert.ok(!scopedTouches.has('unused'), 'unused was imported but never queried');
  // the import is still seeded (viaScoped:false) for the universe
  assert.ok(acc.some((a) => a.table === 'unused' && a.viaScoped === false));
});

test('parseTableAccesses: degrades (never throws) on garbage', () => {
  assert.doesNotThrow(() => parseTableAccesses('diesel::update(orders::table'));
  assert.doesNotThrow(() => parseTableAccesses('fn ( {{{ orders:: '));
  assert.ok(Array.isArray(parseTableAccesses('let x = 1;')));
});

test('parseTableAccesses: a column read in a WHERE/filter predicate is a READ, not a write', () => {
  // The update() argument subtree contains a filter predicate; that predicate column
  // is read, not written. Only the .set() value (and the update target) are writes.
  const src = `diesel::update(orders::table.filter(orders::customer_id.eq(7)))
    .set(orders::shipment_status.eq("S")).execute(c);`;
  const acc = parseTableAccesses(src).filter((a) => a.viaScoped);
  const customer = acc.find((a) => a.column === 'customer_id');
  assert.ok(customer, 'customer_id access found');
  assert.equal(customer.kind, 'read', 'a filter-predicate column is a read');
  assert.equal(acc.find((a) => a.column === 'shipment_status').kind, 'write', '.set value is a write');
});

test('parseTableAccesses: fully-qualified crate::schema::orders::table is a touch (not dropped)', () => {
  const src = `fn q(c:&mut C){ crate::schema::orders::table.find(1)
    .select(crate::schema::orders::id).first(c) }`;
  const acc = parseTableAccesses(src).filter((a) => a.viaScoped);
  assert.ok(acc.some((a) => a.table === 'orders'), 'fully-qualified access resolves to orders');
  assert.ok(acc.some((a) => a.table === 'orders' && a.column === 'id'), 'qualified column captured');
});

test('parseTableAccesses: diesel::update is a CRUD verb, never a pseudo-table touch', () => {
  const acc = parseTableAccesses('diesel::update(orders::table.find(1)).set(orders::id.eq(1));');
  assert.ok(!acc.some((a) => a.table === 'diesel'), 'no `diesel` pseudo-table');
  assert.ok(!acc.some((a) => a.column === 'update'), 'the CRUD verb is not a column');
  assert.ok(acc.some((a) => a.table === 'orders' && a.viaScoped), 'the real table touch survives');
});

import { parseFile } from '../src/parse.mjs';

test('parseFile: one parse yields uses + tableDefs + tableAccesses over a single tree', () => {
  const r = parseFile('use crate::schema::orders;\n' +
    'diesel::table! { widgets (id) { id -> BigInt } }\n' +
    'fn q(c:&mut C){ orders::table.find(1).select(orders::id).first(c) }');
  assert.ok(r.uses.some((u) => u.segments.includes('orders')), 'uses collected');
  assert.ok(r.tableDefs.some((d) => d.table === 'widgets'), 'defs collected');
  assert.ok(r.tableAccesses.some((a) => a.table === 'orders' && a.viaScoped), 'accesses collected');
});

import { loadConfig } from '../src/config.mjs';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join as pjoin } from 'node:path';

function tmpRepo(json) {
  const dir = mkdtempSync(pjoin(tmpdir(), 'ddd-tables-'));
  writeFileSync(pjoin(dir, 'ddd-council.json'), JSON.stringify(json));
  return dir;
}

test('loadConfig: tables defaults to {} when absent', () => {
  const dir = tmpRepo({ contexts: { a: { paths: ['a/**'] } } });
  try {
    assert.deepEqual(loadConfig(dir).tables, {});
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('loadConfig: surfaces an optional tables block verbatim', () => {
  const dir = tmpRepo({
    contexts: { a: { paths: ['a/**'] } },
    tables: { orders: { owner: 'a' }, audit_log: { sharedKernel: true } },
  });
  try {
    const cfg = loadConfig(dir);
    assert.equal(cfg.tables.orders.owner, 'a');
    assert.equal(cfg.tables.audit_log.sharedKernel, true);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
