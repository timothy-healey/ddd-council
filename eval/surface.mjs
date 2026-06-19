// eval/surface.mjs
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadManifest, REPO_ROOT } from './lib/manifest.mjs';
import { sectionText, monolithText } from './lib/sections.mjs';

export const estTokens = (str) => Math.ceil(str.length / 4);

export function surface(root = REPO_ROOT) {
  const { skillDir, verbs } = loadManifest(root);
  const skill = readFileSync(join(skillDir, 'SKILL.md'), 'utf8');
  const skillTok = estTokens(skill);
  const monolithTok = estTokens(monolithText(skillDir));

  const perVerb = [];
  let sectioned = 0;
  let monolithic = 0;
  for (const v of Object.values(verbs)) {
    if (!v.reference) continue;
    const refTok = estTokens(readFileSync(join(skillDir, v.reference), 'utf8'));
    const sigTok = v.signals.reduce((n, s) => n + estTokens(sectionText(skillDir, s)), 0);
    const total = skillTok + refTok + sigTok;
    perVerb.push({
      verb: v.verb,
      files: { skill: skillTok, reference: refTok, signals: sigTok },
      sections: v.signals,
      estTokens: total,
    });
    sectioned += total;
    // monolithic: a verb that cites ANY signal loads the whole catalog
    monolithic += skillTok + refTok + (v.signals.length ? monolithTok : 0);
  }
  const deltaPct = monolithic ? Math.round((1 - sectioned / monolithic) * 1000) / 10 : 0;
  return { perVerb, totals: { sectioned, monolithic, deltaPct } };
}

function main() {
  const json = process.argv.includes('--json');
  const out = surface();
  if (json) { process.stdout.write(JSON.stringify(out, null, 2) + '\n'); return; }
  const pad = (s, n) => String(s).padEnd(n);
  process.stdout.write(`${pad('verb', 16)}${pad('SKILL', 8)}${pad('ref', 8)}${pad('signals', 10)}total (est. tok)\n`);
  for (const r of out.perVerb) {
    process.stdout.write(
      `${pad(r.verb, 16)}${pad(r.files.skill, 8)}${pad(r.files.reference, 8)}` +
      `${pad(`${r.sections.join('')||'—'} ${r.files.signals}`, 10)}${r.estTokens}\n`);
  }
  const { sectioned, monolithic, deltaPct } = out.totals;
  process.stdout.write(`\nTOTAL sectioned:  ${sectioned}\nTOTAL monolithic: ${monolithic}  (sectioning saves ${deltaPct}%)\n`);
  process.stdout.write(`(token counts are chars/4 estimates — a stable relative measure, not billing)\n`);
}

import { fileURLToPath } from 'node:url';
if (process.argv[1] === fileURLToPath(import.meta.url)) main();
