// eval/lib/score.mjs
import { basename } from 'node:path';

export function score(findings, planted) {
  const fired = [...new Set(findings.map((f) => f.signalId))];
  const want = [...new Set(planted.map((p) => p.signalId))];
  const firedSet = new Set(fired);
  const wantSet = new Set(want);

  const matched = want.filter((id) => firedSet.has(id));
  const missed = want.filter((id) => !firedSet.has(id));
  const falsePositive = fired.filter((id) => !wantSet.has(id));

  const recall = want.length ? matched.length / want.length : null;
  const precision = fired.length ? matched.length / fired.length : null;

  const locHit = (id) => {
    const row = planted.find((p) => p.signalId === id);
    if (!row || !row.location) return false;
    return findings.some(
      (f) => f.signalId === id && f.file && row.location.includes(basename(f.file)));
  };
  const locMatched = want.filter(locHit);
  const locationRecall = want.length ? locMatched.length / want.length : null;

  return { recall, precision, matched, missed, falsePositive, locationRecall };
}
