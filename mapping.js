(function (mapping) {
  var lookup = mapping[SIG];
  if (!lookup)
    return;
  for (var obfuscated in lookup) {
    if (!lookup.hasOwnProperty(obfuscated))
      continue;
    var actual = lookup[obfuscated];
    if (actual === 'window' || actual === 'jQuery') {
      var t = actual;
      actual = obfuscated;
      obfuscated = t;
    }
    (function (actual, obfuscated) {
      Object.defineProperty(window, actual, {
        get: function () {
          return window[obfuscated];
        },
        set: function (value) {
          return window[obfuscated] = value;
        }
      });
    }(actual, obfuscated));
  }
}({
  414128144: {
    'g': 'window',
    'v': 'jQuery',
    'ea': 'refreshRegionInfo',
    'S': '_canvas',
    'B': 'canvas',
    'd': 'ctx',
    'J': 'mouseX',
    'K': 'mouseY',
    'ga': 'onResize',
    'U': 'draw',
    'G': 'sendTargetUpdate',
    'va': 'think',
    'm': 'canvasWidth',
    'p': 'canvasHeight',
    'ba': 'blackTheme',
    's': 'zoom',
    'A': 'renderedScoreboard',
    'pa': 'Cell',
    'P': 'SizeCache',
    'fa': 'isMobile',
    'da': 'hardMode',
    'ua': 'init',
    'Aa': 'calculateZoom',
    'n': 'myCells'
  }
}));
