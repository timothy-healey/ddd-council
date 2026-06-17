// §B god-module: one module imported widely across contexts — an undeclared
// shared kernel and a change-amplifier.
export const id = 'god-module';

export function check(graph, config) {
  const { godModuleFanIn, godModuleContexts } = config.thresholds;
  // Group cross-context refs by the target module (path minus the final item).
  const groups = new Map(); // moduleKey -> { files:Set, contexts:Set, line, sampleFile }
  for (const ref of graph.refs) {
    // Group by the target module — the context segment plus its first submodule —
    // so `use billing::api` and `use billing::api::Invoice` count toward the same
    // hub instead of splitting fan-in across `billing` and `billing::api`.
    const segs = ref.path.split('::');
    const moduleKey = segs.length > 1 ? segs.slice(0, 2).join('::') : segs[0];
    if (!groups.has(moduleKey)) {
      groups.set(moduleKey, { files: new Set(), contexts: new Set() });
    }
    const g = groups.get(moduleKey);
    g.files.add(ref.fromFile);
    if (ref.fromContext) g.contexts.add(ref.fromContext);
  }

  const findings = [];
  for (const [moduleKey, g] of groups) {
    if (g.files.size >= godModuleFanIn && g.contexts.size >= godModuleContexts) {
      findings.push({
        signalId: id,
        severity: 'medium',
        file: `(module ${moduleKey})`,
        line: 0,
        message:
          `\`${moduleKey}\` is imported by ${g.files.size} files across ` +
          `${g.contexts.size} contexts (${[...g.contexts].join(', ')}) — a hub.`,
        suggestedMove:
          'Split it: move each context\'s concepts back into that context; keep only ' +
          'truly generic code here, behind a stable published interface.',
      });
    }
  }
  return findings;
}
