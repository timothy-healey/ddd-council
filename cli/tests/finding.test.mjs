import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { finding } from '../src/finding.mjs';
import { detect } from '../src/detect.mjs';

const CANONICAL_KEYS = ['signalId', 'severity', 'file', 'line', 'message', 'suggestedMove'];

test('finding(): returns exactly the canonical keys', () => {
  const f = finding({
    signalId: 'leaky-boundary',
    severity: 'high',
    file: 'a/b.rs',
    line: 12,
    message: 'msg',
    suggestedMove: 'move',
  });
  assert.deepEqual(Object.keys(f).sort(), [...CANONICAL_KEYS].sort());
});

test('finding(): line defaults to 0 when omitted (graph-level findings)', () => {
  const f = finding({ signalId: 'circular-dependency', severity: 'high', file: '(context graph)', message: 'm', suggestedMove: 's' });
  assert.equal(f.line, 0);
});

test('every emitted finding conforms to the canonical Finding shape', () => {
  const fixture = join(dirname(fileURLToPath(import.meta.url)), 'fixture');
  const { findings } = detect(fixture);
  assert.ok(findings.length > 0, 'fixture should produce findings');
  for (const f of findings) {
    assert.deepEqual(Object.keys(f).sort(), [...CANONICAL_KEYS].sort(), `finding ${f.signalId} has non-canonical keys`);
  }
});
