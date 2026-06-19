// eval/lib/manifest.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = resolve(HERE, '..', '..');

/** Read the Council's verb manifest, enriched with reference + signals. */
export function loadManifest(root = REPO_ROOT) {
  const skillDir = join(root, 'skills', 'ddd-council');
  const meta = JSON.parse(
    readFileSync(join(skillDir, 'scripts', 'command-metadata.json'), 'utf8'));
  const verbs = {};
  for (const [verb, e] of Object.entries(meta.commands)) {
    verbs[verb] = {
      verb,
      mode: e.mode,
      lens: e.lens,
      reference: e.reference ?? null,
      signals: e.signals ?? [],
    };
  }
  return { skillDir, verbs };
}
