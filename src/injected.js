import RSVP from "rsvp";

// We'll need this later...
var workerURL = document.currentScript.getAttribute("data-worker-url");
var bandagesURL = document.currentScript.getAttribute("data-bandages-url");
var overrideURL = document.currentScript.getAttribute("data-override-url");

// Hijack window.onload, but save the original in case things go bad
var ORIGINAL_LOAD = window.onload;
var loaded = RSVP.defer();
document.onreadystatechange = function (e) {
  if (document.readyState !== "complete") return;
  // Apparently, there's a race condition if we try to set window.onload
  // in the root of the script, so instead we wait for readyState === complete
  // which guarentees that the original game code has already run
  window.onload = loaded.resolve;
};

// Load all the JS code and pass it to the worker for processing
RSVP.hash({
  worker: convertToBlobURL(workerURL),
  src: jQuery.get("main_out.js"),
  bandages: jQuery.get(bandagesURL),
  override: jQuery.get(overrideURL)
}).then(function (data) {
  var worker = new Worker(data.worker);
  delete data.worker;

  // Wait for our worker to tell us to inject the script, or call the original
  worker.onmessage = function (e) {
    loaded.promise.then(function () {
      var s = document.createElement("script");
      s.appendChild(document.createTextNode(e.data));
      document.body.appendChild(s);
    });
  };

  worker.postMessage(data);
}, function (e) {
  ORIGINAL_LOAD();
  throw e;
});

// Content Security Police prevents loading workers from extensions
// So we download it via AJAX, then convert to a blob URL
function convertToBlobURL(url) {
  return new RSVP.Promise(function (resolve, reject) {
    var URL = window.URL || window.webkitURL;
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.responseType = "blob";
    xhr.onload = function (e) {
      resolve(URL.createObjectURL(xhr.response));
    };
    xhr.onerror = reject;
    xhr.send();
  });
}
