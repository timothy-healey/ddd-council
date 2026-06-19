// eval/tests/manifest.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadManifest } from '../lib/manifest.mjs';

test('every verb resolves to an existing reference file', () => {
  const { skillDir, verbs } = loadManifest();
  for (const [verb, v] of Object.entries(verbs)) {
    assert.ok(v.reference, `${verb} has no reference field`);
    assert.ok(existsSync(join(skillDir, v.reference)),
      `${verb} → ${v.reference} does not exist`);
  }
});

test('signals fields are section letters A–G', () => {
  const { verbs } = loadManifest();
  for (const [verb, v] of Object.entries(verbs)) {
    assert.ok(Array.isArray(v.signals), `${verb}.signals not an array`);
    for (const s of v.signals) {
      assert.match(s, /^[A-G]$/, `${verb} cites bad section ${s}`);
    }
  }
});

test('critique cites A,B,C and aggregate cites D', () => {
  const { verbs } = loadManifest();
  assert.deepEqual([...verbs.critique.signals].sort(), ['A', 'B', 'C']);
  assert.deepEqual(verbs.aggregate.signals, ['D']);
});
