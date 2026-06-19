import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { detect } from '../src/detect.mjs';

const FIXTURE = join(dirname(fileURLToPath(import.meta.url)), 'fixture-ts');

test('detect: fires accidental-shared-kernel on the orders table shared across TS contexts', () => {
  const findings = detect(FIXTURE).findings;
  const ids = findings.map((f) => f.signalId);
  assert.ok(ids.includes('accidental-shared-kernel'), `expected accidental-shared-kernel, got ${ids.join(',')}`);

  const kernel = findings.find((f) => f.signalId === 'accidental-shared-kernel');
  assert.equal(kernel.severity, 'high', `expected high severity, got ${kernel.severity}`);
  assert.ok(kernel.message.includes('writes'), `expected message to contain 'writes', got: ${kernel.message}`);
  assert.ok(!kernel.message.match(/^(?!.*writes).*fulfilment.*reads/i), `writing context must not be reported as only reading`);
});
