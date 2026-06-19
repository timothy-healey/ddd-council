// §B god-module: one module imported widely across contexts — an undeclared
// shared kernel and a change-amplifier.
import { finding } from '../finding.mjs';

export const id = 'god-module';

export function check(graph, config) {
  const { godModuleFanIn, godModuleContexts } = config.thresholds;
  // Group cross-context refs by the target module (path minus the final item).
  const groups = new Map(); // moduleKey -> { files:Set, contexts:Set, line, sampleFile }
  for (const ref of graph.refs) {
    // Group by the neutral hub key the language resolver provides (Rust: `billing::api`;
    // TS: `billing/api`) — stable across importer location, no language-shape parsing here.
    const moduleKey = ref.moduleKey;
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
      findings.push(finding({
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
      }));
    }
  }
  return findings;
}
