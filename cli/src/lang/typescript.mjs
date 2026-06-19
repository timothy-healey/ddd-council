// TypeScript parsing layer behind the language-module seam. Uses the tsx grammar (a
// superset that parses .ts and .tsx), so one parser serves both extensions. Tolerant:
// every collector degrades to empty on malformed source and never throws.
import Parser from 'tree-sitter';
import TypeScript from 'tree-sitter-typescript';
import { walkTree } from './walk.mjs';

const parser = new Parser();
parser.setLanguage(TypeScript.tsx);

// Strip the surrounding quotes from a `string` node's text.
function stringValue(node) {
  return node ? node.text.replace(/^['"`]|['"`]$/g, '') : null;
}

// Collect import + re-export specifiers. `import ... from 'x'` and `export ... from 'x'`
// both carry a `source` field; a local `export` (no source) is skipped.
function collectImports(tree) {
  const out = [];
  walkTree(tree, (node) => {
    if (node.type !== 'import_statement' && node.type !== 'export_statement') return false;
    const source = node.childForFieldName('source');
    if (source) {
      const specifier = stringValue(source);
      if (specifier) out.push({ specifier, line: node.startPosition.row + 1 });
    }
    return true; // don't descend into the statement
  });
  return out;
}

/**
 * Parse one TypeScript source file. Tolerant: unparseable source -> empty collections.
 * @returns {{ imports: Array<{specifier:string,line:number}>, tableDefs: Array, tableAccesses: Array }}
 */
export function parseFile(source) {
  let tree;
  try {
    tree = parser.parse(source);
  } catch {
    return { imports: [], tableDefs: [], tableAccesses: [] };
  }
  return { imports: collectImports(tree), tableDefs: [], tableAccesses: [] };
}

export default {
  extensions: ['.ts', '.tsx'],
  parseFile,
  // resolveImport added in Task 3 (registered then).
};
