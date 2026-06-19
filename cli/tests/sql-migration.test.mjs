import { test } from 'node:test';
import assert from 'node:assert/strict';
import sql, { parseCreateTables, parseFile } from '../src/lang/sql.mjs';

test('parses CREATE TABLE name + column names', () => {
  const defs = parseCreateTables('CREATE TABLE orders (\n id BIGINT PRIMARY KEY,\n status TEXT NOT NULL\n);');
  assert.equal(defs.length, 1);
  assert.equal(defs[0].table, 'orders');
  assert.deepEqual(defs[0].columns, ['id', 'status']);
});

test('handles IF NOT EXISTS, quoting, schema prefix', () => {
  const defs = parseCreateTables('CREATE TABLE IF NOT EXISTS "public"."shipments" ( id BIGINT );');
  assert.equal(defs[0].table, 'shipments');
});

test('skips constraint lines', () => {
  const defs = parseCreateTables(
    'CREATE TABLE t ( id BIGINT, cust_id BIGINT, PRIMARY KEY (id), FOREIGN KEY (cust_id) REFERENCES c(id), CONSTRAINT u UNIQUE (id) );');
  assert.deepEqual(defs[0].columns, ['id', 'cust_id']);
});

test('parseFile shape: schema source emits tableDefs only, with defKind migration', () => {
  const r = parseFile('CREATE TABLE orders ( id BIGINT );');
  assert.deepEqual(r.imports, []);
  assert.deepEqual(r.tableAccesses, []);
  assert.equal(r.tableDefs[0].defKind, 'migration');
});

test('schema source has no resolveImport (degenerate by design)', () => {
  assert.equal(typeof sql.resolveImport, 'undefined');
  assert.deepEqual(sql.extensions, ['.sql']);
});

test('malformed input -> empty, never throws', () => {
  assert.deepEqual(parseCreateTables('CREATE TABL'), []);
  assert.deepEqual(parseCreateTables(''), []);
});

test('columns after a nested-paren default are still captured', () => {
  const defs = parseCreateTables(
    "CREATE TABLE t ( id BIGINT DEFAULT nextval('t_id_seq'), name TEXT );");
  assert.deepEqual(defs[0].columns, ['id', 'name']);
});

test('inline CHECK(...) does not truncate the column list', () => {
  const defs = parseCreateTables(
    'CREATE TABLE t ( id BIGINT, price BIGINT CHECK (price > 0), label TEXT );');
  assert.deepEqual(defs[0].columns, ['id', 'price', 'label']);
});
