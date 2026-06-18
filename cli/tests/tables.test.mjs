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
