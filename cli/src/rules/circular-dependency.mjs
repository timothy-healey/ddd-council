// §B circular-dependency: contexts that depend on each other, directly or
// transitively — no clear upstream/downstream, can't evolve independently.
import { finding } from '../finding.mjs';

export const id = 'circular-dependency';

// Tarjan's strongly-connected components over the context graph.
function sccs(nodes, edges) {
  let index = 0;
  const stack = [];
  const onStack = new Set();
  const idx = new Map();
  const low = new Map();
  const out = [];

  function strongconnect(v) {
    idx.set(v, index);
    low.set(v, index);
    index++;
    stack.push(v);
    onStack.add(v);
    for (const w of edges.get(v) ?? []) {
      if (!idx.has(w)) {
        strongconnect(w);
        low.set(v, Math.min(low.get(v), low.get(w)));
      } else if (onStack.has(w)) {
        low.set(v, Math.min(low.get(v), idx.get(w)));
      }
    }
    if (low.get(v) === idx.get(v)) {
      const comp = [];
      let w;
      do {
        w = stack.pop();
        onStack.delete(w);
        comp.push(w);
      } while (w !== v);
      out.push(comp);
    }
  }

  for (const v of nodes) if (!idx.has(v)) strongconnect(v);
  return out;
}

export function check(graph, config) {
  const nodes = Object.keys(config.contexts);
  const comps = sccs(nodes, graph.contextEdges);
  const findings = [];
  for (const comp of comps) {
    const cyclic = comp.length > 1 || (graph.contextEdges.get(comp[0])?.has(comp[0]));
    if (!cyclic) continue;
    findings.push(finding({
      signalId: id,
      severity: 'high',
      file: '(context graph)',
      line: 0,
      message: `Contexts form a dependency cycle: ${comp.join(' ↔ ')}.`,
      suggestedMove:
        'Break the cycle: choose an upstream, invert the other dependency (e.g. via a ' +
        'domain event or a published interface), so the relationship has one direction.',
    }));
  }
  return findings;
}
