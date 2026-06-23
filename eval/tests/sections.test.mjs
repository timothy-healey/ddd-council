// eval/tests/sections.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sectionText, monolithText } from '../lib/sections.mjs';
import { loadManifest } from '../lib/manifest.mjs';

const { skillDir } = loadManifest();

test('section D is the tactical signals block', () => {
  const d = sectionText(skillDir, 'D');
  assert.match(d, /Tactical signals/);
  assert.match(d, /God aggregate/);
  assert.ok(!/Design-stage smells/.test(d), 'must not bleed into §E');
});

test('a section is smaller than the whole catalog', () => {
  assert.ok(sectionText(skillDir, 'F').length < monolithText(skillDir).length);
});
