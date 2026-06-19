import { test } from 'node:test';
import assert from 'node:assert/strict';
// buildGraph walks the filesystem, so the precedence rule is unit-tested through the
// exported `preferDef` helper directly rather than via a synthetic on-disk fixture.
import { preferDef } from '../src/graph.mjs';

test('declaration supersedes a previously stored migration def', () => {
  const mig = { definedIn: { file: 'migrations/up.sql', context: null, line: 3 }, columns: ['id'], defKind: 'migration', accessors: [{ file: 'x' }] };
  const decl = { file: 'src/schema.rs', context: null, line: 9, columns: ['id', 'status'], defKind: 'declaration' };
  const merged = preferDef(mig, decl);
  assert.equal(merged.defKind, 'declaration');
  assert.equal(merged.definedIn.file, 'src/schema.rs');
  assert.deepEqual(merged.columns, ['id', 'status'], 'columns updated to declaration columns');
  assert.deepEqual(merged.accessors, [{ file: 'x' }], 'accessors preserved');
});

test('migration never supersedes a stored declaration', () => {
  const decl = { definedIn: { file: 'src/schema.rs', context: null, line: 9 }, columns: ['id', 'status'], defKind: 'declaration', accessors: [] };
  const mig = { file: 'migrations/up.sql', context: null, line: 3, columns: ['id'], defKind: 'migration' };
  const merged = preferDef(decl, mig);
  assert.equal(merged.defKind, 'declaration');
  assert.equal(merged.definedIn.file, 'src/schema.rs');
});

test('equal priority keeps the first (no replacement)', () => {
  const first = { definedIn: { file: 'a.rs', context: null, line: 1 }, columns: [], defKind: 'declaration', accessors: [] };
  const second = { file: 'b.rs', context: null, line: 2, columns: [], defKind: 'declaration' };
  assert.equal(preferDef(first, second).definedIn.file, 'a.rs');
});
