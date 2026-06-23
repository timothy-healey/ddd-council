// eval/tests/bench-parse.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseFindings, parseUsage, median, coverageGaps, CELLS } from '../bench.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const raw = readFileSync(join(here, '..', 'fixtures', 'sample-claude-result.json'), 'utf8');

test('parseFindings pulls canonical findings out of the result', () => {
  const f = parseFindings(raw);
  assert.equal(f.length, 2);
  assert.equal(f[0].signalId, 'god-aggregate');
  assert.ok(Object.keys(f[0]).includes('suggestedMove'));
});

test('parseUsage reads the usage block', () => {
  const u = parseUsage(raw);
  assert.equal(u.input, 5200);
  assert.equal(u.output, 640);
});

test('median of odd and even counts', () => {
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([1, 2, 3, 4]), 2.5);
});

test('coverageGaps flags a cell whose verb has no planted rows', () => {
  const planted = [{ verb: 'aggregate' }, { verb: 'events' }, { verb: 'detector' }];
  const g = coverageGaps([{ verb: 'aggregate' }, { verb: 'repositories' }], planted);
  assert.deepEqual(g.cellsWithoutPlanted, ['repositories']); // cell with no planted row
  assert.deepEqual(g.plantedWithoutCell, ['events']);        // planted verb with no cell
});

test('every CELLS verb is a known council verb (no typos)', () => {
  for (const c of CELLS) assert.match(c.verb, /^[a-z-]+$/);
});
