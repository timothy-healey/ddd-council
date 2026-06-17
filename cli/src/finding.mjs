// The Finding — the single contract shared across the Council↔Detector seam.
// Both halves are bound to this shape: the rules emit it, bin/ formats it, and
// `critique` folds it into the council's findings list. Defining it once here
// (rather than re-rolling the literal in every rule) is what keeps that shared
// kernel from drifting. signals.md and critique.md cite this file as canonical.

/**
 * @typedef {Object} Finding
 * @property {string} signalId            signal catalog id, e.g. 'leaky-boundary'
 * @property {'high'|'medium'|'low'} severity  blast radius, not rule count
 * @property {string} file                repo-relative path, or a '(…)' pseudo-location
 * @property {number} line                1-based line, or 0 for graph-level findings
 * @property {string} message             what was found, with the cited symbol/path
 * @property {string} suggestedMove       the cheapest move that closes it
 */

/**
 * Build a Finding. The one place the shape is defined.
 * @param {Finding} parts
 * @returns {Finding}
 */
export function finding({ signalId, severity, file, line = 0, message, suggestedMove }) {
  return { signalId, severity, file, line, message, suggestedMove };
}
