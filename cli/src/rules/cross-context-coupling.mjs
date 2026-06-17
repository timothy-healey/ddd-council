// §B chatty coupling: a single file talking to many contexts — the boundary is
// in the wrong place or missing a coarser contract.
import { finding } from '../finding.mjs';

export const id = 'cross-context-coupling';

export function check(graph, config) {
  const { chattyFanOut } = config.thresholds;
  const byFile = new Map(); // fromFile -> { contexts:Set, line }
  for (const ref of graph.refs) {
    if (!byFile.has(ref.fromFile)) byFile.set(ref.fromFile, { contexts: new Set(), line: ref.line });
    byFile.get(ref.fromFile).contexts.add(ref.toContext);
  }

  const findings = [];
  for (const [file, g] of byFile) {
    if (g.contexts.size >= chattyFanOut) {
      findings.push(finding({
        signalId: id,
        severity: 'medium',
        file,
        line: g.line,
        message:
          `${file} imports from ${g.contexts.size} contexts (${[...g.contexts].join(', ')}) — chatty coupling.`,
        suggestedMove:
          'Move the responsibility into one context, or publish a coarser operation so this ' +
          'file collaborates through one contract instead of many.',
      }));
    }
  }
  return findings;
}
