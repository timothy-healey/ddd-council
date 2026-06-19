import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifySql } from '../src/lang/rust/sqlx.mjs';

test('SELECT ... FROM -> read on the from-table', () => {
  assert.deepEqual(classifySql('SELECT id, status FROM orders WHERE id = $1'),
    [{ table: 'orders', kind: 'read' }]);
});

test('INSERT INTO -> write on the target', () => {
  assert.deepEqual(classifySql('INSERT INTO orders (id) VALUES ($1)'),
    [{ table: 'orders', kind: 'write' }]);
});

test('UPDATE -> write on the target', () => {
  assert.deepEqual(classifySql('UPDATE orders SET status = $1 WHERE id = $2'),
    [{ table: 'orders', kind: 'write' }]);
});

test('DELETE FROM -> write on the target', () => {
  assert.deepEqual(classifySql('DELETE FROM orders WHERE id = $1'),
    [{ table: 'orders', kind: 'write' }]);
});

test('JOIN tables are reads alongside the FROM table', () => {
  const r = classifySql('SELECT * FROM orders o JOIN customers c ON c.id = o.cust_id');
  assert.deepEqual(r.sort((a, b) => a.table.localeCompare(b.table)),
    [{ table: 'customers', kind: 'read' }, { table: 'orders', kind: 'read' }]);
});

test('UPDATE ... FROM: target is write, joined table is read', () => {
  const r = classifySql('UPDATE orders SET status = $1 FROM customers WHERE customers.id = orders.cust_id');
  assert.deepEqual(r.sort((a, b) => a.table.localeCompare(b.table)),
    [{ table: 'customers', kind: 'read' }, { table: 'orders', kind: 'write' }]);
});

test('strips quoting and schema prefix', () => {
  assert.deepEqual(classifySql('SELECT * FROM "public"."orders"'),
    [{ table: 'orders', kind: 'read' }]);
  assert.deepEqual(classifySql('SELECT * FROM `orders`'),
    [{ table: 'orders', kind: 'read' }]);
});

test('ignores leading comments and whitespace', () => {
  assert.deepEqual(classifySql('-- fetch\n  SELECT * FROM orders'),
    [{ table: 'orders', kind: 'read' }]);
});

test('WITH (CTE) is treated as a read', () => {
  const r = classifySql('WITH recent AS (SELECT * FROM orders) SELECT * FROM recent');
  assert.ok(r.some((e) => e.table === 'orders' && e.kind === 'read'));
});

test('unrecognized / dynamic SQL -> empty', () => {
  assert.deepEqual(classifySql('VACUUM'), []);
  assert.deepEqual(classifySql(''), []);
});
