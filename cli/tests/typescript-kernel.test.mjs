import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { detect } from '../src/detect.mjs';

const FIXTURE = join(dirname(fileURLToPath(import.meta.url)), 'fixture-ts');

test('detect: fires accidental-shared-kernel on the orders table shared across TS contexts', () => {
  const ids = detect(FIXTURE).findings.map((f) => f.signalId);
  assert.ok(ids.includes('accidental-shared-kernel'), `expected accidental-shared-kernel, got ${ids.join(',')}`);
});
