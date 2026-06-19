// The language-module contract — the Detection engine's published kernel (see DOMAIN.md,
// Bounded contexts -> Context configuration). A language module is the DEFAULT export of
// cli/src/lang/<lang>.mjs and MUST provide:
//
//   extensions: string[]                          // file extensions it owns, incl. the dot
//   parseFile(source) -> {                         // parse ONE source file; tolerant, never throws
//     imports:       Array<language-shaped record>,// import / re-export records
//     tableDefs:     Array<{ table, binding?, columns, line }>,
//     tableAccesses: Array<{ ..., isTouch }>,       // isTouch:false = universe seed, true = real touch
//   }
//   resolveImport(record, ctx) -> {                // resolve ONE import record to a cross-context edge,
//     toContext, restModule, isLeak,                // or null for external / intra-context imports.
//     displayPath, moduleKey                        // displayPath = message text; moduleKey = neutral
//   } | null                                        //   hub key god-module groups on.
//                                                    // ctx = { fromFile, fromContext, config, repoRoot }
//
// A new language conforms to THIS contract; graph.mjs and rules/* never branch on language.
// Each language owns its own resolver config (TS loads tsconfig itself) — ctx stays neutral.
import { extname } from 'node:path';
import rust from './rust.mjs';
import typescript from './typescript.mjs';

const MODULES = [rust, typescript];
const BY_EXT = new Map();
for (const m of MODULES) for (const ext of m.extensions) BY_EXT.set(ext, m);

export function forFile(relPath) {
  return BY_EXT.get(extname(relPath)) ?? null;
}

export function extensions() {
  return [...BY_EXT.keys()];
}
