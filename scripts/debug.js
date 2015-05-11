// TODO: Find a better name for this file
import { execFileSync as run } from "child_process";
import { readFileSync as load } from "fs";
import { writeFileSync as save } from "fs";
import path from "path";
import { js_beautify as _beautify} from "js-beautify";
import { parse } from "esprima";
import { generate } from "escodegen";
import medic from "../lib/esmedic";

// Globals
var js, DIR = __dirname + path.sep + ".." + path.sep;

// Download & Save production js
js = run("curl", ["http://agar.io/main_out.js"], {stdio: ["pipe","pipe","ignore"]}).toString();
js = beautify(js);
save(DIR + "debug/game.raw.js", js);

/*

// Abort de-obfuscation if we detect the dev uploaded non-minified code
if (~js.indexOf("DOUBLE_BUFFER")) {
  console.log("Production JS is un-minified. Aborting.");
  return;
}

*/

// Reverse engineer it
var bandages = load(DIR + "src/bandages.js").toString();
js = medic(js, bandages);
save(DIR + "debug/game.clean.js", js);

// Add our overrides to it
var ast = parse(js);
var override = "(function override(){" + load(DIR + "src/override.js").toString() + "})()";
var body = ast.body[0].expression.callee.body;
body.body = body.body.concat(parse(override).body);
js = generate(ast)
js = beautify(js)
save(DIR + "debug/game.js", js);

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
