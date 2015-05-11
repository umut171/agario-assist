import _ from "lodash";
import query from "esquery";
import { generate } from "escodegen";
import { traverse } from "estraverse";
import { parse as _parse } from "esprima";
import { analyze as _getScopes } from "escope";
import { js_beautify as _beautify} from "js-beautify";
import normalize from "../lib/esnormalize";
import find from "../lib/esfind";

export default function medic(src, bandages) {
  var ast = parse(src);
  var bandage_ast = parse(bandages);
  var replaced = {};

  for (var i = 0; i < 3; i++) {
    // TODO: Handle nesting better (don't just loop 3 times and pray)
    ensureBlockStatementsEverywhere(ast);
    rewriteCompressedIfStatements(ast);
    ensureOneExpressionInIfAndFor(ast);
    splitSequences(ast);
    uncompressBooleans(ast);
  }
  hoistVars(ast); // Only do this once, it's more expensive and can't be nested

  // De-obfusicate the JS
  rewriteClosureArguments(ast);
  ensureFunctionNames(ast);
  // Keep replacing until we can't replace no more
  while (applyBandages(ast, bandage_ast, replaced));
  warnAboutReusedFunctionNames(ast);

  // Beautify again
  hoistVars(ast); // Re-hoist for the side-effect of sorting the variable names
  src = generate(ast)
  src = beautify(src)

  // Give out some good info
  _.sortBy(_.pairs(replaced), 0).forEach(function (i) {
    console.log(i[0]+": "+i[1].join(", "));
  });

  return src;
}

// =================================================================================
// =================================================================================
// =================================================================================

// An enhanced version of esprima.parse that adds metadata to each node
function parse(js) {
  var ast = _parse(js, {attachComment: true});
  traverse(ast, { enter: function (node, parent) { node.parent = parent; } });
  return ast;
}

// A wrapper for js_beautify that sets our desired options
function beautify(js) {
  return _beautify(js, {
    indent_size: 2,
    max_preserve_newlines: 2,
    jslint_happy: true,
    space_after_anon_function: true,
    end_with_newline: true,
    good_stuff: true
  });
}

// An enhanced version of escopes.analyze that utilizes our enhanced AST
// to allow looking up the scope of any arbitrary node
function getScopes(ast) {
  var scopes = _getScopes(ast);
  scopes.lookup = function (node) {
    var scope;
    while (!scope && node) {
      scope = this.acquire(node, true);
      node = node.parent;
    };
    return scope;
  };
  return scopes;
}

function replace(scope, o, n) {
  var variables = {};
  while (scope) {
    scope.variables.forEach(function (v) {
      variables[v.name] = variables[v.name] || v;
    });
    scope = scope.upper;
  }
  variables[o].name = n;
  variables[o].identifiers.forEach(function (i) { i.name = n; });
  variables[o].references.forEach(function (r) { r.identifier.name = n; });
}

// =================================================================================
// =================================================================================
// =================================================================================

// Finds conditionals & loops without braces and adds them
function ensureBlockStatementsEverywhere(ast) {
  // BEFORE: if (x) y();
  // AFTER:  if (x) { y(); }
  query(ast, 'IfStatement[consequent.type!="BlockStatement"]').forEach(setPropertyToBlock("consequent"));
  query(ast, 'IfStatement[alternate][alternate.type!="BlockStatement"]').forEach(setPropertyToBlock("alternate"));
  query(ast, 'WithStatement[body.type!="BlockStatement"]').forEach(setPropertyToBlock("body"));
  query(ast, 'ForStatement[body.type!="BlockStatement"]').forEach(setPropertyToBlock("body"));
  query(ast, 'ForInStatement[body.type!="BlockStatement"]').forEach(setPropertyToBlock("body"));
  query(ast, 'WhileStatement[body.type!="BlockStatement"]').forEach(setPropertyToBlock("body"));
  query(ast, 'DoWhileStatement[body.type!="BlockStatement"]').forEach(setPropertyToBlock("body"));
}
function setPropertyToBlock(prop) {
  return function (node) {
    node[prop] = {
      type: "BlockStatement",
      body: [node[prop]]
    };
    node[prop].parent = node;
    node[prop].body[0].parent = node[prop];
  };
}

// Find If statements disguised as comparisons or ternaries
function rewriteCompressedIfStatements(ast) {
  // BEFORE: x && y && (z(), zz = 1);
  // AFTER:  if(x && y) { z(); zz = 1; }
  query(ast, 'ExpressionStatement > LogicalExpression[right.type=/SequenceExpression|CallExpression|AssignmentExpression/]').forEach(function (node) {
    // NOTE: Logicals are parsed right to left
    // So node.left contains the entire conditional we care about
    // How convenient!
    node.parent.expression = {
      type: "IfStatement",
      // if the operator is `||` we need to negate the whole conditional
      test: node.operator === "&&" ? node.left : {
        type: "UnaryExpression",
        operator: "!",
        prefix: true,
        argument: node.left
      },
      consequent: {
        type: "BlockStatement",
        body: [{
          type: "ExpressionStatement",
          expression: node.right
        }]
      }
    };
    // Clean up .parent references
    node.left.parent = node.parent.expression.test;
    node.right.parent = node.parent.expression.consequent.body[0];
    node.parent.expression.parent = node.parent;
    node.parent.expression.test.parent = node.parent.expression;
    node.parent.expression.consequent.parent = node.parent.expression;
    node.parent.expression.consequent.body[0].parent = node.parent.expression.consequent;
  });

  // BEFORE: x ? y() : z();
  // AFTER: if (x) { y(); } else { z(); }
  query(ast, '*:matches(ExpressionStatement, SequenceExpression) > ConditionalExpression').forEach(function (node) {
    node.type = "IfStatement";
    node.consequent = {
      type: "BlockStatement",
      body: [{
        type: "ExpressionStatement",
        expression: node.consequent
      }]
    };
    node.alternate = node.alternate && {
      type: "BlockStatement",
      body: [{
        type: "ExpressionStatement",
        expression: node.alternate
      }]
    };
    // Clean up .parent references
    node.consequent.parent = node;
    node.consequent.body[0].parent = node.consequent;
    node.consequent.body[0].expression.parent = node.consequent.body[0];
    if (node.alternate) {
      node.alternate.parent = node;
      node.alternate.body[0].parent = node.alternate;
      node.alternate.body[0].expression.parent = node.alternate.body[0];
    }
  });
}

// Ensures If and For only have one expression to evaluate, making it easier to read
function ensureOneExpressionInIfAndFor(ast) {
  // BEFORE: if (a = r[e], a.shouldRender())
  // AFTER:  (a = r[e]) if (a.shouldRender())
  // NOTE: Yes, exporting a sequence is expected and fine. We'll clean it up later.
  query(ast, 'IfStatement[test.type=/VariableDeclaration|SequenceExpression/]').forEach(exportSequence("test"));

  // BEFORE: for (var x = 0, y = 0; y < 10; y++) { z(y); }
  // AFTER:  var x = 0, y; for (y = 0; y < 10; y++) { z(y); }
  query(ast, 'ForStatement[init.type=/VariableDeclaration|SequenceExpression/]').forEach(exportSequence("init"));
}
function exportSequence(prop) {
  return function (node) {
    var parentProp = node.parent.type === "SwitchCase" ? "consequent" : "body";
    var index = node.parent[parentProp].indexOf(node);

    if (node[prop].type === "VariableDeclaration") {
      var vars = node[prop].declarations;
      var main = vars[vars.length - 1];
      var assignment = {
        parent: node,
        type: "AssignmentExpression",
        operator: "=",
        left: main.id,
        right: main.init
      };
      main.init = null;
      node[prop].parent = node.parent;
      node.parent[parentProp].splice(index, 0, node[prop]);
      node[prop] = assignment;
    }

    if (node[prop].type === "SequenceExpression") {
      node.parent[parentProp].splice(index, 0, node[prop]);
      node[prop] = node[prop].expressions.pop();
      node.parent[parentProp][index].parent = node.parent;
    }
  }
}

// Extracts the expressions from sequences: (a = b, c = d, x && y())
function splitSequences(ast) {
  // BEFORE: (a = 1, b = 2)
  // AFTER:  a = 1; b = 2;
  query(ast, 'SequenceExpression').forEach(function (node) {
    var container = node.parent;
    var self = node;
    if (container.type === "ExpressionStatement") {
      self = container;
      container = container.parent;
    }
    var prop = node.parent.type === "SwitchCase" ? "consequent" : "body";
    if (!container[prop]) return;
    var index = container[prop].indexOf(self);
    var splitted = [];
    node.expressions.forEach(function (expression) {
      var statement = {
        type: "ExpressionStatement",
        expression: expression
      };
      statement.parent = container;
      expression.parent = statement;
      splitted.push(statement);
    });
    container[prop].splice.apply(container[prop], [index, 1].concat(splitted));
  });
}

// Does what it says...
function uncompressBooleans(ast) {
  // BEFORE: a = !0; b = !1;
  // AFTER:  a = true; b = false;
  query(ast, 'UnaryExpression[prefix][operator="!"][argument.type="Literal"]').forEach(function (node) {
    if (!node.prefix) console.log(node);
    node.type = "Literal";
    node.value = !node.argument.value;
  });
}

// Moves variable declarations to the top of their scope
function hoistVars(ast) {
  var scopes = getScopes(ast);
  query(ast, 'VariableDeclaration[kind="var"]').forEach(function (node) {
    var scope = scopes.lookup(node);
    var body = scope.block.body.body;
    var splitted = [];

    if (!body.length || !body[0].isHoistedVars) {
      body.unshift({
        parent: scope.block,
        type: "VariableDeclaration",
        kind: "var",
        declarations: [],
        isHoistedVars: true // Cheat to ensure we parse all vars at least once
      });
    }

    // Don't mess with ourselves
    if (body[0] === node) {
      body[0].declarations = _.sortBy(_.unique(body[0].declarations, "id.name"), "id.name");
      return;
    }

    node.declarations.forEach(function (d) {
      body[0].declarations.push({
        parent: body[0],
        type: "VariableDeclarator",
        id: d.id,
        init: null
      });
      if (d.init) {
        var expression = {
          parent: node.parent,
          type: "ExpressionStatement",
          expression: null
        };
        expression.expression = {
          parent: expression,
          type: "AssignmentExpression",
          operator: "=",
          left: d.id,
          right: d.init,
        };
        splitted.push(expression);
      }
    });

    if (node.parent.type === "ForInStatement") {
      // Oh fuck it, when will this ever not work anyway?
      node.type = "Identifier";
      node.name = node.declarations[0].id.name;
    } else {
      var prop = node.parent.type === "SwitchCase" ? "consequent" : "body";
      var index = node.parent[prop].indexOf(node);
      node.parent[prop].splice.apply(node.parent[prop], [index, 1].concat(splitted));
    }
    body[0].declarations = _.sortBy(_.unique(body[0].declarations, "id.name"), "id.name");
  });
}

// =================================================================================
// =================================================================================
// =================================================================================

function rewriteClosureArguments(ast) {
  var scopes = getScopes(ast);
  query(ast, 'CallExpression[callee.type="FunctionExpression"]').forEach(function (node) {
    var scope = scopes.lookup(node.callee.body);
    for (var i = 0; i < node.arguments.length; i++) {
      replace(scope, node.callee.params[i].name, node.arguments[i].name);
    }
  });
}

function ensureFunctionNames(ast) {
  query(ast, 'FunctionExpression:not([id])').forEach(function (node) {
    var name, deriveFrom = node.parent;

    if (deriveFrom.type === "CallExpression") {
      deriveFrom = deriveFrom.callee;
    }
    if (deriveFrom.type === "AssignmentExpression") {
      deriveFrom = deriveFrom.left;
    }

    if (deriveFrom === node) {
      name = "root";
    } else if (deriveFrom.type === "Property") {
      name = deriveFrom.key.name;
    } else if (deriveFrom.type === "MemberExpression") {
      name = deriveFrom.property.name;
    }

    node.id = {
      parent: node,
      type: "Identifier",
      name: name
    };
  });
}

function applyBandages(ast, bandages, REPLACED) {
  var scopes = getScopes(ast);
  var replacements = 0;
  var normalized = {"": normalize(ast)};
  for (var i = 0; i < bandages.body.length; i++) {
    var node = bandages.body[i];
    var keywords = [];
    traverse(node, { enter: function (n) {
      var comments = n.trailingComments || [];
      if (node.type === "FunctionDeclaration") {
        // Only allow leading comments in functions
        // since parsing can get strange across multiple lines
        comments = comments.concat(n.leadingComments || []);
      }
      comments.forEach(function (c) {
        var m, r = /@(\w+)/g;
        while (m = r.exec(c.value)) keywords.push(m[1]);
      });
    }});
    var key = keywords.join(",");
    normalized[key] = normalized[key] || normalize(ast, keywords);
    find(normalized[key], normalize(node, keywords)).forEach(function (match) {
      traverse(match.original, { enter: function (o) {
        if (o.parent.type.slice(0, 8) === "Function" && o.type === "BlockStatement") this.skip();
        if (o.type !== "Identifier") return;
        var n = node;
        for (var i = 0, p = this.path(); i < p.length; i++) {
          n = n[p[i]];
        }

        if (o.name === n.name) return;
        var scope = scopes.lookup(o);
        REPLACED[n.name] ? REPLACED[n.name].push(o.name) : REPLACED[n.name] = [o.name];
        replace(scope, o.name, n.name);
        replacements++;
      }});
    });
  }
  return replacements;
}

function warnAboutReusedFunctionNames(ast) {
  var names = {};
  query(ast, 'FunctionExpression, FunctionDeclaration').forEach(function (node) {
    if (names[node.id.name]) console.log("!!!", node.id.name);
    names[node.id.name] = true;
  });
}
