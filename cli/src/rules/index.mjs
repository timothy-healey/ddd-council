import * as leakyBoundary from './leaky-boundary.mjs';
import * as circularDependency from './circular-dependency.mjs';
import * as godModule from './god-module.mjs';
import * as crossContextCoupling from './cross-context-coupling.mjs';

export const RULES = [leakyBoundary, circularDependency, godModule, crossContextCoupling];

const SEVERITY_RANK = { high: 0, medium: 1, low: 2 };

export function runRules(graph, config) {
  const findings = [];
  for (const rule of RULES) findings.push(...rule.check(graph, config));
  findings.sort(
    (a, b) =>
      (SEVERITY_RANK[a.severity] ?? 9) - (SEVERITY_RANK[b.severity] ?? 9) ||
      a.signalId.localeCompare(b.signalId) ||
      a.file.localeCompare(b.file)
  );
  return findings;
}
