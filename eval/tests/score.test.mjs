// eval/tests/score.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { score } from '../lib/score.mjs';

const F = (signalId, file = 'x.rs') => ({ signalId, severity: 'high', file, line: 1, message: '', suggestedMove: '' });

test('perfect recall and precision', () => {
  const s = score([F('god-aggregate'), F('leaked-invariant')],
    [{ signalId: 'god-aggregate' }, { signalId: 'leaked-invariant' }]);
  assert.equal(s.recall, 1);
  assert.equal(s.precision, 1);
  assert.deepEqual(s.missed, []);
});

test('a miss lowers recall', () => {
  const s = score([F('god-aggregate')],
    [{ signalId: 'god-aggregate' }, { signalId: 'leaked-invariant' }]);
  assert.equal(s.recall, 0.5);
  assert.deepEqual(s.missed, ['leaked-invariant']);
});

test('a false positive lowers precision but not recall', () => {
  const s = score([F('god-aggregate'), F('made-up')],
    [{ signalId: 'god-aggregate' }]);
  assert.equal(s.recall, 1);
  assert.equal(s.precision, 0.5);
  assert.deepEqual(s.falsePositive, ['made-up']);
});

test('locationRecall needs the cited file to match', () => {
  const planted = [{ signalId: 'god-aggregate', location: 'src/ordering/order.rs — Order holds…' }];
  assert.equal(score([F('god-aggregate', 'src/ordering/order.rs')], planted).locationRecall, 1);
  assert.equal(score([F('god-aggregate', 'src/other.rs')], planted).locationRecall, 0);
});
