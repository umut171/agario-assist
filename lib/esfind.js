import _ from "lodash";
import types from "espurify/lib/ast-properties";
import { traverse } from "estraverse";
import { generate } from "escodegen";

export default function find(haystack, needle) {
  var matches = [];
  traverse(haystack, { enter: function (node) {
    if (_.isEqual(node, needle, nodeEqual)) {
      matches.push(node);
    }
  }});
  return matches;
}

function nodeEqual(a, b) {
  if (!a || !b) return undefined;
  if (!a.type || !b.type || a.type !== b.type) return undefined;
  if (!types[a.type]) return undefined;
  var props = types[a.type];
  for (var i = 0; i < props.length; i++) {
    if (a.type.slice(0, 8) === "Function" && props[i] === "body") {
      if (!~generate(a.body).indexOf(generate(b.body).slice(2,-3).trim())) {
        return false;
      }
    } else if (!_.isEqual(a[props[i]], b[props[i]], nodeEqual)) {
      return false;
    }
  }
  return true;
}
