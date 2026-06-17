// §B leaky-boundary: a module reaches into another context's internals rather
// than its public surface.
export const id = 'leaky-boundary';

export function check(graph, config) {
  const findings = [];
  for (const ref of graph.refs) {
    if (!ref.isLeak) continue;
    const target = config.contexts[ref.toContext];
    findings.push({
      signalId: id,
      severity: 'high',
      file: ref.fromFile,
      line: ref.line,
      message:
        `${ref.fromContext ?? '(unassigned)'} reaches into ${ref.toContext}'s internals ` +
        `via \`${ref.path}\` (through private module \`${ref.restModule}\`).`,
      suggestedMove:
        `Import through ${ref.toContext}'s public surface (${target.publicModules
          .map((m) => `\`${m}\``)
          .join(', ')}), or promote what you need into it.`,
    });
  }
  return findings;
}
