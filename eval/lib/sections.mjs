// eval/lib/sections.mjs
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const signalsDir = (skillDir) => join(skillDir, 'reference', 'signals');
const monolithPath = (skillDir) => join(skillDir, 'reference', 'signals.md');

/** Per-section file (post-cut) if one exists for this letter, else null. */
function sectionFile(skillDir, letter) {
  const dir = signalsDir(skillDir);
  if (!existsSync(dir)) return null;
  const hit = readdirSync(dir).find((f) => f.startsWith(`${letter}-`) && f.endsWith('.md'));
  return hit ? join(dir, hit) : null;
}

/** Slice the monolith between `## <letter>.` and the next `## ` heading. */
function sliceFromMonolith(skillDir, letter) {
  const text = readFileSync(monolithPath(skillDir), 'utf8');
  const lines = text.split('\n');
  const start = lines.findIndex((l) => new RegExp(`^## ${letter}\\. `).test(l));
  if (start === -1) throw new Error(`signals.md has no section ${letter}`);
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^## /.test(lines[i])) { end = i; break; }
  }
  return lines.slice(start, end).join('\n').trim();
}

export function sectionText(skillDir, letter) {
  const file = sectionFile(skillDir, letter);
  return file ? readFileSync(file, 'utf8').trim() : sliceFromMonolith(skillDir, letter);
}

export function monolithText(skillDir) {
  const dir = signalsDir(skillDir);
  if (existsSync(dir)) {
    return readdirSync(dir).filter((f) => f.endsWith('.md')).sort()
      .map((f) => readFileSync(join(dir, f), 'utf8')).join('\n');
  }
  return readFileSync(monolithPath(skillDir), 'utf8');
}
