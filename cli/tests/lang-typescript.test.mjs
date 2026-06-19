import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from '../src/lang/typescript.mjs';

test('parseFile: collects static import specifiers with line numbers', () => {
  const src = `import { Foo } from '../billing/api';\nimport Bar from './bar';\n`;
  const { imports } = ts.parseFile(src);
  const specs = imports.map((i) => i.specifier);
  assert.ok(specs.includes('../billing/api'));
  assert.ok(specs.includes('./bar'));
  const foo = imports.find((i) => i.specifier === '../billing/api');
  assert.equal(foo.line, 1);
});

test('parseFile: collects re-export specifiers (export ... from)', () => {
  const src = `export * from './internal/repo';\nexport { A } from './a';\n`;
  const specs = ts.parseFile(src).imports.map((i) => i.specifier);
  assert.ok(specs.includes('./internal/repo'));
  assert.ok(specs.includes('./a'));
});

test('parseFile: a local export (no source) is not an import', () => {
  const { imports } = ts.parseFile(`export const x = 1;\n`);
  assert.equal(imports.length, 0);
});

test('parseFile: malformed source degrades to empty, never throws', () => {
  const { imports, tableDefs, tableAccesses } = ts.parseFile('import { from from from');
  assert.deepEqual(imports, []);
  assert.deepEqual(tableDefs, []);
  assert.deepEqual(tableAccesses, []);
});
