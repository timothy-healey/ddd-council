// eval/bench.mjs
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REPO_ROOT } from './lib/manifest.mjs';
import { parsePlanted, plantedForVerb, canonicalId } from './lib/planted.mjs';
import { score } from './lib/score.mjs';

// (repo, verb, target) cells. Council-verb recall lives on the Rust example;
// the TS example's planted set is detector-only (covered by cli/ tests).
export const CELLS = [
  { repo: 'order-fulfilment', verb: 'aggregate', target: 'ordering' },
  { repo: 'order-fulfilment', verb: 'entities', target: 'ordering' },
  { repo: 'order-fulfilment', verb: 'repositories', target: 'ordering' },
  { repo: 'order-fulfilment', verb: 'events', target: 'fulfilment' },
];

/**
 * Guard against CELLS / PLANTED drift (plan-vet F3): every cell's verb must have
 * planted rows, and any planted council verb with no cell is a surfaced coverage gap.
 * Pure (takes the planted rows) so it is testable without the API.
 */
export function coverageGaps(cells, plantedRows) {
  const cellVerbs = new Set(cells.map((c) => c.verb));
  const plantedVerbs = new Set(plantedRows.map((r) => r.verb).filter((v) => v && v !== 'detector'));
  const cellsWithoutPlanted = [...cellVerbs].filter((v) => !plantedVerbs.has(v));
  const plantedWithoutCell = [...plantedVerbs].filter((v) => !cellVerbs.has(v));
  return { cellsWithoutPlanted, plantedWithoutCell };
}

export function parseFindings(stdout) {
  let text = stdout;
  try { text = JSON.parse(stdout).result ?? stdout; } catch { /* raw text */ }
  const blocks = [...text.matchAll(/```json\s*([\s\S]*?)```/g)];
  if (!blocks.length) throw new Error('no ```json findings block');
  return JSON.parse(blocks[blocks.length - 1][1].trim());
}

export function parseUsage(stdout) {
  const u = JSON.parse(stdout).usage ?? {};
  return {
    input: u.input_tokens ?? 0,
    output: u.output_tokens ?? 0,
    cache: u.cache_read_input_tokens ?? 0,
  };
}

export const median = (nums) => {
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

function runCell(cell, model, runs) {
  const repoDir = join(REPO_ROOT, 'examples', cell.repo);
  const planted = plantedForVerb(parsePlanted(repoDir), cell.verb);
  if (!planted.length) return { ...cell, status: 'skipped', reason: 'no planted rows' };

  const prompt = `/ddd-council ${cell.verb} ${cell.target} --brief --findings-json`;
  const trials = [];
  for (let i = 0; i < runs; i++) {
    try {
      const out = execFileSync('claude',
        ['-p', prompt, '--output-format', 'json', ...(model ? ['--model', model] : [])],
        { cwd: repoDir, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
      // Normalize council ids (prose name OR kebab) to canonical signalId before scoring,
      // so a correct detection emitted as "god aggregate" matches planted "god-aggregate".
      const findings = parseFindings(out).map((f) => ({ ...f, signalId: canonicalId(f.signalId) }));
      trials.push({ ...score(findings, planted), tokens: parseUsage(out) });
    } catch (err) {
      trials.push({ status: 'error', error: String(err.message || err).slice(0, 200) });
    }
  }
  const ok = trials.filter((t) => !t.status);
  if (!ok.length) return { ...cell, status: 'error', errors: trials.length };
  return {
    ...cell,
    runs: trials.length,
    errored: trials.length - ok.length,
    recall: { median: median(ok.map((t) => t.recall)), min: Math.min(...ok.map((t) => t.recall)), max: Math.max(...ok.map((t) => t.recall)) },
    precision: { median: median(ok.map((t) => t.precision)) },
    tokensOut: { median: median(ok.map((t) => t.tokens.output)), min: Math.min(...ok.map((t) => t.tokens.output)), max: Math.max(...ok.map((t) => t.tokens.output)) },
    tokensIn: { median: median(ok.map((t) => t.tokens.input)) },
    missed: [...new Set(ok.flatMap((t) => t.missed))], // union across trials, not just trial 0
    falsePositive: [...new Set(ok.flatMap((t) => t.falsePositive))],
    locationRecall: { median: median(ok.map((t) => t.locationRecall)) },
  };
}

function gitSha() {
  try { return execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: REPO_ROOT, encoding: 'utf8' }).trim(); }
  catch { return 'unknown'; }
}

function main() {
  const argv = process.argv.slice(2);
  const model = (argv[argv.indexOf('--model') + 1] && argv.includes('--model')) ? argv[argv.indexOf('--model') + 1] : '';
  const runsRaw = argv.includes('--runs') ? Number(argv[argv.indexOf('--runs') + 1]) : 3;
  const runs = Number.isFinite(runsRaw) && runsRaw > 0 ? runsRaw : 3; // guard --runs NaN/0

  // Surface CELLS/PLANTED drift before spending tokens (plan-vet F3).
  try {
    const planted = parsePlanted(join(REPO_ROOT, 'examples', 'order-fulfilment'));
    const { cellsWithoutPlanted, plantedWithoutCell } = coverageGaps(CELLS, planted);
    if (cellsWithoutPlanted.length) process.stdout.write(`WARN cells with no planted rows: ${cellsWithoutPlanted.join(', ')}\n`);
    if (plantedWithoutCell.length) process.stdout.write(`WARN planted verbs with no cell (coverage gap): ${plantedWithoutCell.join(', ')}\n`);
  } catch { /* submodule not checked out — runCell will report per-cell */ }

  const cells = CELLS.map((c) => runCell(c, model, runs));
  const record = { date: new Date().toISOString(), model: model || 'default', runs, sha: gitSha(), cells };

  const dir = join(REPO_ROOT, 'eval', 'results');
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${record.date.replace(/[:.]/g, '-')}-${record.model}.json`);
  writeFileSync(file, JSON.stringify(record, null, 2));

  for (const c of cells) {
    if (c.status) { process.stdout.write(`${c.verb}@${c.repo}: ${c.status}${c.reason ? ` (${c.reason})` : ''}\n`); continue; }
    process.stdout.write(`${c.verb}@${c.repo}: recall ${c.recall.median} [${c.recall.min}-${c.recall.max}] · precision ${c.precision.median} · out-tok ${c.tokensOut.median}${c.errored ? ` · ${c.errored} errored` : ''}${c.missed.length ? ` · missed ${c.missed.join(',')}` : ''} · locRecall ${c.locationRecall.median}\n`);
  }
  process.stdout.write(`\nwrote ${file}\n`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
