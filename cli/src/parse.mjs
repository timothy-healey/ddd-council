// Rust parsing layer. Isolated behind this module so the grammar is swappable —
// drop in another tree-sitter grammar later and the rest of the engine is polyglot.
import Parser from 'tree-sitter';
import Rust from 'tree-sitter-rust';

const parser = new Parser();
parser.setLanguage(Rust);

// Flatten a path node (identifier | scoped_identifier | crate/self/super) to segments.
function flattenPath(node) {
  if (!node) return [];
  switch (node.type) {
    case 'identifier':
    case 'type_identifier':
    case 'crate':
    case 'self':
    case 'super':
    case 'metavariable':
    case 'primitive_type':
      return [node.text];
    case 'scoped_identifier': {
      const path = node.childForFieldName('path');
      const name = node.childForFieldName('name');
      return [...flattenPath(path), ...(name ? [name.text] : [])];
    }
    default:
      // Fallback: stitch identifier-ish descendants in order.
      return node.text.split('::').map((s) => s.trim()).filter(Boolean);
  }
}

// Expand a use-tree into an array of segment-arrays (one per imported path).
function expandUseTree(node, prefix = []) {
  if (!node) return [];
  switch (node.type) {
    case 'self':
      // `use foo::bar::{self}` refers to the module `foo::bar` itself, not a
      // member named "self" — drop it when it carries a prefix. A bare `self`
      // (no prefix) is a relative path and kept as-is.
      return prefix.length ? [[...prefix]] : [[...prefix, node.text]];
    case 'identifier':
    case 'crate':
    case 'super':
    case 'metavariable':
      return [[...prefix, node.text]];
    case 'scoped_identifier':
      return [[...prefix, ...flattenPath(node)]];
    case 'use_as_clause': {
      const path = node.childForFieldName('path');
      return [[...prefix, ...flattenPath(path)]];
    }
    case 'use_wildcard': {
      const path = node.namedChildren.find((c) => c.type !== 'use_list');
      return [[...prefix, ...flattenPath(path), '*']];
    }
    case 'use_list': {
      const out = [];
      for (const child of node.namedChildren) out.push(...expandUseTree(child, prefix));
      return out;
    }
    case 'scoped_use_list': {
      const path = node.childForFieldName('path');
      const list = node.childForFieldName('list');
      const newPrefix = [...prefix, ...flattenPath(path)];
      return expandUseTree(list, newPrefix);
    }
    default: {
      const out = [];
      for (const child of node.namedChildren) out.push(...expandUseTree(child, prefix));
      return out;
    }
  }
}

/**
 * Parse one Rust source file.
 * @returns {{ uses: Array<{ segments: string[], line: number }> }}
 */
export function parseRust(source) {
  const tree = parser.parse(source);
  const uses = [];
  (function walk(node) {
    if (node.type === 'use_declaration') {
      // Skip a leading `pub`/`pub(crate)` etc. — its visibility_modifier is the
      // first named child, but the use tree is what we want. Missing this drops
      // every `pub use` re-export, the main way contexts leak each other's internals.
      const arg = node.namedChildren.find((c) => c.type !== 'visibility_modifier');
      for (const segments of expandUseTree(arg)) {
        uses.push({ segments, line: node.startPosition.row + 1 });
      }
      return; // don't descend into the use itself
    }
    for (let i = 0; i < node.childCount; i++) walk(node.child(i));
  })(tree.rootNode);
  return { uses };
}
