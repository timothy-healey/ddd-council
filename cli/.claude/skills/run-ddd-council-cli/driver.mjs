#!/usr/bin/env node
// Smoke driver for the ddd-council-detect CLI.
//
// Drives the actual built CLI (not the unit tests) across every exit path the
// tool defines, and asserts both exit code and the salient output. This is the
// programmatic handle a future agent uses to confirm a change didn't break the
// CLI surface — exit-code contract, text rendering, --json shape, error path.
//
//   node .claude/skills/run-ddd-council-cli/driver.mjs
//
// Exits 0 if every check passes, 1 otherwise (prints a PASS/FAIL line each).

import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
// skill dir -> cli/ root is three levels up (.claude/skills/run-ddd-council-cli/).
const cliRoot = resolve(here, '../../../');
const BIN = join(cliRoot, 'bin', 'ddd-council-detect.mjs');
const FIXTURE = join(cliRoot, 'tests', 'fixture');

function run(args) {
  const r = spawnSync('node', [BIN, ...args], { encoding: 'utf8' });
  return { code: r.status, out: r.stdout ?? '', err: r.stderr ?? '' };
}

let failures = 0;
function check(name, cond, detail = '') {
  if (cond) {
    console.log(`PASS  ${name}`);
  } else {
    failures++;
    console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

// 1. Detect against the fixture: findings exist -> exit 1, text render.
{
  const { code, out } = run([FIXTURE]);
  check('fixture: exit code 1 (findings present)', code === 1, `got ${code}`);
  check('fixture: reports the leaky-boundary leak', /leaky-boundary/.test(out) && /billing::repo::PgRepo/.test(out));
  check('fixture: reports the billing<->scheduling cycle', /circular-dependency/.test(out) && /billing ↔ scheduling/.test(out));
  check('fixture: reports god-module and chatty coupling', /god-module/.test(out) && /cross-context-coupling/.test(out));
}

// 2. --json: machine-readable, 4 findings, still exit 1.
{
  const { code, out } = run([FIXTURE, '--json']);
  check('--json: exit code 1', code === 1, `got ${code}`);
  let parsed = null;
  try { parsed = JSON.parse(out); } catch { /* leave null */ }
  check('--json: emits valid JSON', parsed !== null);
  check('--json: has findings/contexts/fileCount', !!parsed && Array.isArray(parsed.findings) && Array.isArray(parsed.contexts) && typeof parsed.fileCount === 'number');
  check('--json: 4 findings on the fixture', !!parsed && parsed.findings.length === 4, parsed ? `got ${parsed.findings.length}` : 'no JSON');
}

// 3. --help: exit 0, usage text.
{
  const { code, out } = run(['--help']);
  check('--help: exit code 0', code === 0, `got ${code}`);
  check('--help: prints usage', /Usage:/.test(out) && /--json/.test(out));
}

// 4. Clean repo (no violations) -> exit 0.
{
  const dir = mkdtempSync(join(tmpdir(), 'ddd-clean-'));
  try {
    mkdirSync(join(dir, 'billing'), { recursive: true });
    writeFileSync(join(dir, 'billing', 'api.rs'), 'pub struct Invoice;\n');
    writeFileSync(
      join(dir, 'ddd-council.json'),
      JSON.stringify({ contexts: { billing: { module: 'billing', paths: ['billing/**'], publicModules: ['api'] } } })
    );
    const { code, out } = run([dir]);
    check('clean repo: exit code 0', code === 0, `got ${code}`);
    check('clean repo: reports no anti-patterns', /No strategic anti-patterns found/.test(out));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// 5. Missing ddd-council.json -> exit 2, error on stderr.
{
  const dir = mkdtempSync(join(tmpdir(), 'ddd-empty-'));
  try {
    const { code, err } = run([dir]);
    check('missing config: exit code 2', code === 2, `got ${code}`);
    check('missing config: error names ddd-council.json', /No ddd-council\.json found/.test(err));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
