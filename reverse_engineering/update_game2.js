// Import libraries
var _, run, load, save, _parse, traverse, query, _getScopes, _purify, generate, _beautify;
_ = require("lodash");
run = require('child_process').execFileSync;
load = require("fs").readFileSync;
save = require("fs").writeFileSync;
_parse = require("esprima").parse;
traverse = require("estraverse").traverse;
query = require("esquery");
_getScopes = require("escope").analyze;
_purify = require('espurify');
generate = require("escodegen").generate;
_beautify = require('js-beautify').js_beautify;
var types = require("espurify/lib/ast-properties");

// =================================================================================
// =================================================================================
// =================================================================================

// Initialize variables
var js, ast, REPLACED = {};
var dsl_ast = parse(load("dsl.js"));
var override_ast = parse("(function override(){" + load("../override.js").toString() + "})()");

// Load the game code, beautify it and save it
js = load("game.raw.js").toString();

// Abort de-obfuscation if we detect the dev uploaded non-minified code
if (~js.indexOf("DOUBLE_BUFFER")) {
  console.log("Production JS is un-minified. Aborting.");
  return;
}

// De-minify the JS
ast = parse(js);
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
while(rewriteIdentifiersUsingDSL(ast, dsl_ast)); // Keep replacing until we can't replace no more
warnAboutReusedFunctionNames(ast);
appendToClosure(ast.body[0].expression.callee, override_ast);

// Beautify again and save
hoistVars(ast); // Re-hoist for the side-effect of sorting the variable names
js = generate(ast)
js = beautify(js)
save("game2.js", js)
_.sortBy(_.pairs(REPLACED), 0).forEach(function (i) {
  console.log(i[0]+": "+i[1].join(", "));
});

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

// An enhanced version of espurify that returns a purified AST with a reference to the original nodes
// All the ID nonsense is to avoid espurify attempting to clone circular references and exploding
function purify(ast) {
  var nodes = [];
  traverse(ast, { enter: function (node) {
    node._purify_id = nodes.length;
    nodes.push(node);
  }});

  var purified = _purify.customize({extra: ['_purify_id']})(ast);
  traverse(purified, { enter: function (node) {
    node.original = nodes[node._purify_id];
    delete node._purify_id;
  }});

  traverse(ast, { enter: function (node) { delete node._purify_id; }});
  return purified;
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

function rewriteIdentifiersUsingDSL(ast, dsl) {
  var scopes = getScopes(ast);
  var replacements = 0;
  var normalized = {"": normalize(ast)};
  for (var i = 0; i < dsl.body.length; i++) {
    var node = dsl.body[i];
    var keywords = [];
    traverse(node, { enter: function (n) {
      var comments = n.trailingComments || [];
      if (node.type === "FunctionDeclaration") {
        // Only allow leading comments in functions
        // since parsing can get strange across multiple lines
        comments = comments.concat(n.leadingComments || []);
      }
      comments.forEach(function (c) {
        var r = /@(\w+)/g;
        while (m = r.exec(c.value)) keywords.push(m[1]);
      });
    }});
    var key = keywords.join(",");
    normalized[key] = normalized[key] || normalize(ast, keywords);
    search(normalized[key], normalize(node, keywords), true).forEach(function (match) {
      traverse(match.original, { enter: function (o) {
        if (o.parent.type.slice(0, 8) === "Function" && o.type === "BlockStatement") this.skip();
        if (o.type !== "Identifier") return;
        var n = node;
        for (var i = 0, p = this.path(); i < p.length; i++) {
          n = n[p[i]];
        }

        if (o.name === n.name) return;
        var scope = scopes.lookup(o);
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

function appendToClosure(closure, ast) {
  ast.body.forEach(function (node) {
    node.parent = closure.body;
  });
  closure.body.body = closure.body.body.concat(ast.body);
}

function normalize(ast, keywords) {
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

function search(haystack, needle, loose) {
  var matches = [];
  traverse(haystack, { enter: function (node) {
    if (_.isEqual(node, needle, nodeEqual(loose))) {
      matches.push(node);
    }
  }});
  return matches;
}
function nodeEqual(loose) {
  return function(a, b) {
    if (!a || !b) return undefined;
    if (!a.type || !b.type || a.type !== b.type) return undefined;
    if (!types[a.type]) return undefined;
    var props = types[a.type];
    for (var i = 0; i < props.length; i++) {
      if (a.type.slice(0, 8) === "Function" && props[i] === "body" && loose) {
        if (!~generate(a.body).indexOf(generate(b.body).slice(2,-3).trim())) {
          return false;
        }
      } else if (!_.isEqual(a[props[i]], b[props[i]], nodeEqual(loose))) {
        return false;
      }
    }
    return true;
  }
}

function replace(scope, o, n) {
  REPLACED[n] ? REPLACED[n].push(o) : REPLACED[n] = [o];
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
