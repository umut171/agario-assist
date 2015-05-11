import query from "esquery";
import { generate } from "escodegen";
import { traverse } from "estraverse";
import { customize as customPurify } from "espurify";

export default function normalize(ast, keywords) {
  var KEYWORDS = [
    "this",
    "window",
    "document",
    "Math",
    "setTimeout",
    "setInterval"
  ].concat(keywords || []);

  var normalized = purify(ast);
  traverse(normalized, { enter: function (node, parent) { node.parent = parent; } });

  query(normalized, 'Identifier').forEach(function (node) {
    // Don't normalize keywords
    if (~KEYWORDS.indexOf(node.name)) return;

    // Don't normalize properties
    if (node.parent.type === "MemberExpression" && node.parent.object !== node) return;

    node.name = "@";
  });

  traverse(normalized, { enter: function (node, parent) { delete node.parent; } });
  return normalized;
}

// An enhanced version of espurify that returns a purified AST with a reference to the original nodes
// All the ID nonsense is to avoid espurify attempting to clone circular references and exploding
function purify(ast) {
  var nodes = [];
  traverse(ast, { enter: function (node) {
    node._purify_id = nodes.length;
    nodes.push(node);
  }});

  var purified = customPurify({extra: ['_purify_id']})(ast);
  traverse(purified, { enter: function (node) {
    node.original = nodes[node._purify_id];
    delete node._purify_id;
  }});

  traverse(ast, { enter: function (node) { delete node._purify_id; }});
  return purified;
}
