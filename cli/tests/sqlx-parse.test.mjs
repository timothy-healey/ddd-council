import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFile } from '../src/lang/rust.mjs';

const touches = (src) => parseFile(src).tableAccesses.filter((a) => a.isTouch);

test('sqlx::query! macro with raw string -> touch', () => {
  const src = 'fn f(p: &Pool) { sqlx::query!(r#"SELECT id FROM orders WHERE id = $1"#, 1).fetch_one(p); }';
  const t = touches(src);
  assert.equal(t.length, 1);
  assert.equal(t[0].table, 'orders');
  assert.equal(t[0].kind, 'read');
  assert.equal(t[0].column, null);
  assert.equal(t[0].isTouch, true);
});

test('bare query_as! with plain string -> write on UPDATE', () => {
  const src = 'fn f() { query_as!(Order, "UPDATE orders SET status = $1", s); }';
  const t = touches(src);
  assert.deepEqual(t.map((x) => [x.table, x.kind]), [['orders', 'write']]);
});

test('sqlx::query(...) function call form -> touch', () => {
  const src = 'fn f(p: &Pool) { sqlx::query("INSERT INTO shipments (id) VALUES ($1)").execute(p); }';
  const t = touches(src);
  assert.deepEqual(t.map((x) => [x.table, x.kind]), [['shipments', 'write']]);
});

test('query_as turbofish call form -> touch', () => {
  const src = 'fn f(p: &Pool) { query_as::<_, Order>("SELECT * FROM orders").fetch_all(p); }';
  const t = touches(src);
  assert.deepEqual(t.map((x) => [x.table, x.kind]), [['orders', 'read']]);
});

test('dynamic SQL (format!) -> no touch (tolerant skip)', () => {
  const src = 'fn f() { let q = format!("SELECT * FROM {}", t); sqlx::query(&q); }';
  assert.deepEqual(touches(src), []);
});

test('a Diesel file still yields its diesel touches (union intact)', () => {
  const src = 'use crate::schema::orders;\nfn f(c: &mut C){ orders::table.find(1).select(orders::id).first(c); }';
  const t = touches(src);
  assert.ok(t.some((x) => x.table === 'orders' && x.kind === 'read'));
});

test('non-parseable source -> empty, never throws', () => {
  assert.deepEqual(parseFile('fn (((').tableAccesses, []);
});
