import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { detect } from '../src/detect.mjs';

const fixture = join(dirname(fileURLToPath(import.meta.url)), 'fixture');
const result = detect(fixture);
const bySignal = (id) => result.findings.filter((f) => f.signalId === id);

test('discovers all three contexts', () => {
  assert.deepEqual(result.contexts.sort(), ['billing', 'notifications', 'scheduling']);
});

test('leaky-boundary: flags the import into billing internals, once', () => {
  const f = bySignal('leaky-boundary');
  assert.equal(f.length, 1, 'exactly one leak');
  assert.equal(f[0].file, 'scheduling/repo.rs');
  assert.match(f[0].message, /billing::repo::PgRepo/);
  assert.equal(f[0].severity, 'high');
});

test('leaky-boundary: does NOT flag public (api) cross-context imports', () => {
  const f = bySignal('leaky-boundary');
  assert.ok(!f.some((x) => x.message.includes('::api::')), 'public api imports are not leaks');
});

test('circular-dependency: flags the scheduling <-> billing cycle', () => {
  const f = bySignal('circular-dependency');
  assert.equal(f.length, 1);
  assert.ok(f[0].message.includes('scheduling') && f[0].message.includes('billing'));
});

test('god-module: flags billing::api as an over-imported hub', () => {
  const f = bySignal('god-module');
  assert.equal(f.length, 1);
  assert.match(f[0].message, /billing::api/);
});

test('cross-context-coupling: flags the chatty app service file', () => {
  const f = bySignal('cross-context-coupling');
  assert.equal(f.length, 1);
  assert.equal(f[0].file, 'app/service.rs');
});

test('findings are sorted high severity first', () => {
  const ranks = result.findings.map((f) => f.severity);
  const firstMedium = ranks.indexOf('medium');
  const lastHigh = ranks.lastIndexOf('high');
  if (firstMedium !== -1 && lastHigh !== -1) assert.ok(lastHigh < firstMedium);
});
