import { parse } from "esprima";
import { generate } from "escodegen";
import medic from "../lib/esmedic";

self.onmessage = function (e) {
  var js = medic(e.data.src, e.data.bandages);
  var ast = parse(js);
  var override = "(function override(){" + e.data.override + "})()";
  var body = ast.body[0].expression.callee.body;
  body.body = body.body.concat(parse(override).body);
  js = generate(ast)
  self.postMessage(js + ";window.onload();");
};
