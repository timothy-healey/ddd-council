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

const CONFIG = {
  contexts: {
    ordering: { name: 'ordering', module: 'ordering', paths: ['src/ordering/**'], publicModules: ['api'] },
    billing: { name: 'billing', module: 'billing', paths: ['src/billing/**'], publicModules: ['api'] },
  },
  thresholds: {},
  tables: {},
};
function ctx(fromFile) {
  return { fromFile, fromContext: 'ordering', config: CONFIG, repoRoot: '/repo' };
}

test('resolveSpecifier: tsconfig alias substitutes the matched tail (pure)', () => {
  const out = ts.resolveSpecifier('@app/billing/internal/repo', 'src/ordering/service.ts', { baseUrl: '.', paths: { '@app/*': ['src/*'] } });
  assert.equal(out, 'src/billing/internal/repo');
});

test('resolveSpecifier: bare package -> null', () => {
  assert.equal(ts.resolveSpecifier('sequelize', 'src/ordering/service.ts', { baseUrl: '.', paths: {} }), null);
});

test('resolveImport: relative import reaching another context past its public surface is a leak', () => {
  const r = ts.resolveImport({ specifier: '../billing/internal/repo', line: 1 }, ctx('src/ordering/service.ts'));
  assert.equal(r.toContext, 'billing');
  assert.equal(r.restModule, 'internal');
  assert.equal(r.isLeak, true);
  assert.equal(r.moduleKey, 'billing/internal');
});

test('resolveImport: import through the public surface is not a leak', () => {
  const r = ts.resolveImport({ specifier: '../billing/api', line: 1 }, ctx('src/ordering/service.ts'));
  assert.equal(r.toContext, 'billing');
  assert.equal(r.isLeak, false);
  assert.equal(r.moduleKey, 'billing/api');
});

test('resolveImport: importing the context root barrel is not a leak', () => {
  const r = ts.resolveImport({ specifier: '../billing', line: 1 }, ctx('src/ordering/service.ts'));
  assert.equal(r.toContext, 'billing');
  assert.equal(r.restModule, null);
  assert.equal(r.isLeak, false);
  assert.equal(r.moduleKey, 'billing');
});

test('resolveImport: bare package specifier is external -> null', () => {
  assert.equal(ts.resolveImport({ specifier: 'sequelize', line: 1 }, ctx('src/ordering/service.ts')), null);
});

test('resolveImport: intra-context relative import -> null', () => {
  assert.equal(ts.resolveImport({ specifier: './repository', line: 1 }, ctx('src/ordering/service.ts')), null);
});

test('parseFile: sequelize.define yields a tableDef with table, binding, columns', () => {
  const src = `const Order = sequelize.define('Order', { id: {}, status: {} }, { tableName: 'orders' });\n`;
  const { tableDefs } = ts.parseFile(src);
  const def = tableDefs.find((d) => d.table === 'orders');
  assert.ok(def, 'orders table defined');
  assert.equal(def.binding, 'Order');
  assert.deepEqual(def.columns.sort(), ['id', 'status']);
});

test('parseFile: class + .init yields a tableDef bound to the class name', () => {
  const src = `class Shipment extends Model {}\nShipment.init({ id: {} }, { tableName: 'shipments' });\n`;
  const def = ts.parseFile(src).tableDefs.find((d) => d.table === 'shipments');
  assert.ok(def);
  assert.equal(def.binding, 'Shipment');
});

test('parseFile: classifies model accesses read vs write', () => {
  const src = `Order.update({ status: 'x' });\nOrder.findAll();\n`;
  const acc = ts.parseFile(src).tableAccesses;
  const w = acc.find((a) => a.binding === 'Order' && a.kind === 'write');
  const r = acc.find((a) => a.binding === 'Order' && a.kind === 'read');
  assert.ok(w && w.isTouch === true, 'update is a write touch');
  assert.ok(r, 'findAll is a read');
});
