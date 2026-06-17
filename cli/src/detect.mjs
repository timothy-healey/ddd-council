import { loadConfig } from './config.mjs';
import { buildGraph } from './graph.mjs';
import { runRules } from './rules/index.mjs';

/**
 * Run the full detection over a repo.
 * @param {string} repoRoot
 * @returns {{ findings: object[], contexts: string[], fileCount: number }}
 */
export function detect(repoRoot) {
  const config = loadConfig(repoRoot);
  const graph = buildGraph(repoRoot, config);
  const findings = runRules(graph, config);
  return {
    findings,
    contexts: Object.keys(config.contexts),
    fileCount: graph.files.length,
  };
}
