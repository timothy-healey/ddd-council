import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { detect } from '../src/detect.mjs';

const FIXTURE = join(dirname(fileURLToPath(import.meta.url)), 'fixture-ts');
const ids = () => detect(FIXTURE).findings.map((f) => f.signalId);

for (const rule of ['leaky-boundary', 'circular-dependency', 'god-module', 'cross-context-coupling']) {
  test(`detect: fires ${rule} on the TS fixture`, () => {
    const got = ids();
    assert.ok(got.includes(rule), `expected ${rule}, got ${got.join(',')}`);
  });
}
