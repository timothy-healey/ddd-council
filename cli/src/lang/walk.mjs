// The ONE traversal seam, grammar-agnostic. Pre-order depth-first over a parsed tree;
// `visit` returns true to prune (don't descend into the matched node's children).
export function walkTree(tree, visit) {
  (function rec(node) {
    if (visit(node)) return; // pruned
    for (let i = 0; i < node.childCount; i++) rec(node.child(i));
  })(tree.rootNode);
}
