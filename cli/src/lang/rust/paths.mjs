// Shared Rust AST helpers, used by rust.mjs (use-paths) and the ORM extractors
// (diesel.mjs, sqlx.mjs). Lives apart from both to avoid an import cycle.

// Flatten a path node (identifier | scoped_identifier | crate/self/super) to segments.
export function flattenPath(node) {
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

// Flatten every leaf token (named or anonymous) under a node, in source order.
export function flattenTokens(node) {
  const out = [];
  (function rec(n) {
    if (n.childCount === 0) { out.push(n); return; }
    for (let i = 0; i < n.childCount; i++) rec(n.child(i));
  })(node);
  return out;
}
