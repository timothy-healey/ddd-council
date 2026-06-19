// eval/tests/signal-ids.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const signals = readFileSync(
  join(repoRoot, 'skills', 'ddd-council', 'reference', 'signals.md'), 'utf8');

const REQUIRED_IDS = [
  // §A
  'cohesion-cluster', 'language-shift', 'separate-persistence', 'independent-change-cadence',
  // §B (non-detector; detector ids already present)
  'missing-acl', 'distributed-monolith', 'language-less-context',
  // §C
  'one-concept-two-names', 'one-name-two-concepts', 'technical-name',
  'crud-masking-intent', 'primitive-obsession',
  // §D
  'anaemic-domain-model', 'god-aggregate', 'transaction-spanning-aggregates',
  'leaked-invariant', 'entity-value-object-misclassification',
  'repository-per-entity', 'domain-logic-in-service-layer', 'missing-domain-events',
  // §E
  'cross-boundary-dependency', 'unowned-shared-type', 'off-language-naming',
  'adds-where-refactor-fits', 'contradicts-domain', 'splits-cohesive-work',
];

test('every council signal across §A–§E carries a canonical signalId', () => {
  for (const id of REQUIRED_IDS) {
    assert.ok(signals.includes(`signalId: \`${id}\``),
      `signals.md is missing (signalId: \`${id}\`)`);
  }
});
