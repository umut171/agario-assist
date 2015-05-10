(function (window, jQuery) {
  var $, Ba, C, D, E, Ea, F, Fa, G, H, I, K, L, M, N, Q, R, S, T, V, W, _canvas, aa, blackTheme, ca, canvas, canvasHeight, canvasWidth, ctx, hardMode, isMobile, l, m, mouseX, mouseY, p, pa, qa, ra, renderedScoreboard, s, sa, t, u, v, w, x, y, zoom;

  function init() {
    var a, b, c;
    refreshRegionInfo();
    setInterval(refreshRegionInfo, 180000);
    canvas = _canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    canvas.onmousedown = function (e) {
      var b, c;
      if (isMobile) {
        b = e.clientX - (5 + canvasWidth / 5 / 2);
        c = e.clientY - (5 + canvasWidth / 5 / 2);
        if (Math.sqrt(b * b + c * c) <= canvasWidth / 5 / 2) {
          sendTargetUpdate();
          B(17);
          return;
        }
      }
      mouseX = e.clientX;
      mouseY = e.clientY;
      Y();
      sendTargetUpdate();
    };
    canvas.onmousemove = function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      Y();
    };
    canvas.onmouseup = function (e) {};
    a = false;
    b = false;
    c = false;
    window.onkeydown = function (e) {
      if (!(32 != e.keyCode || a)) {
        sendTargetUpdate();
        B(17);
        a = true;
      };
      if (!(81 != e.keyCode || b)) {
        B(18);
        b = true;
      };
      if (!(87 != e.keyCode || c)) {
        sendTargetUpdate();
        B(21);
        c = true;
      };
      if (27 == e.keyCode) {
        jQuery('#overlays').fadeIn(200);
      };
    };
    window.onkeyup = function (e) {
      if (32 == e.keyCode) {
        a = false;
      };
      if (87 == e.keyCode) {
        c = false;
      };
      if (81 == e.keyCode && b) {
        B(19);
        b = false;
      };
    };
    window.onblur = function (e) {
      B(19);
      c = b = a = false;
    };
    window.onresize = onResize;
    onResize();
    if (window.requestAnimationFrame) {
      window.requestAnimationFrame(ha);
    } else {
      setInterval(draw, 1000 / 60);
    };
    setInterval(sendTargetUpdate, 100);
    ia(jQuery('#region').val());
  }

  function think() {
    var a, b, c, d, e, f;
    if (0.5 > zoom) {
      K = null;
    } else {
      a = Number.POSITIVE_INFINITY;
      b = Number.POSITIVE_INFINITY;
      c = Number.NEGATIVE_INFINITY;
      e = Number.NEGATIVE_INFINITY;
      d = 0;
      for (f = 0; f < p.length; f++) {
        if (p[f].shouldRender()) {
          d = Math.max(p[f].size, d);
          a = Math.min(p[f].x, a);
          b = Math.min(p[f].y, b);
          c = Math.max(p[f].x, c);
          e = Math.max(p[f].y, e);
        };
      }
      K = QUAD.init({
        minX: a - (d + 100),
        minY: b - (d + 100),
        maxX: c + (d + 100),
        maxY: e + (d + 100)
      });
      for (f = 0; f < p.length; f++) {
        a = p[f];
        if (a.shouldRender()) {
          for (b = 0; b < a.points.length; ++b) {
            K.insert(a.points[b]);
          }
        }
      }
    }
  }

  function Y() {
    Q = (mouseX - canvasWidth / 2) / zoom + s;
    R = (mouseY - canvasHeight / 2) / zoom + t;
  }

  function refreshRegionInfo() {
    if (null == S) {
      S = {};
      jQuery('#region').children().each(function () {
        var a, b;
        a = jQuery(this);
        b = a.val();
        if (b) {
          S[b] = a.text();
        };
      });
    };
    jQuery.get('http://m.agar.io/info', function (a) {
      var b;
      for (b in a.regions) {
        jQuery('#region option[value="' + b + '"]').text(S[b] + ' (' + a.regions[b].numPlayers + ' players)');
      }
    }, 'json');
  }

  function ja() {
    jQuery('#adsBottom').hide();
    jQuery('#overlays').hide();
  }

  function ia(a) {
    if (a && a != $) {
      $ = a;
      ka();
    };
  }

  function la() {
    jQuery.ajax('http://m.agar.io/', {
      error: function () {
        setTimeout(la, 1000);
      },
      success: function (a) {
        a = a.split('\n');
        ma('ws://' + a[0]);
      },
      dataType: 'text',
      method: 'POST',
      cache: false,
      crossDomain: true,
      data: $ || '?'
    });
  }

  function ka() {
    jQuery('#connecting').show();
    la();
  }

  function ma(a) {
    if (l) {
      l.onopen = null;
      l.onmessage = null;
      l.onclose = null;
      l.close();
      l = null;
    };
    C = [];
    m = [];
    v = {};
    p = [];
    D = [];
    w = [];
    console.log('Connecting to ' + a);
    l = new WebSocket(a);
    l.binaryType = 'arraybuffer';
    l.onopen = va;
    l.onmessage = wa;
    l.onclose = xa;
    l.onerror = function (e) {
      console.log('socket error');
    };
  }

  function va(a) {
    var b;
    jQuery('#connecting').hide();
    console.log('socket open');
    a = new ArrayBuffer(5);
    b = new DataView(a);
    b.setUint8(0, 255);
    b.setUint32(1, 1, true);
    l.send(a);
    na();
  }

  function xa(a) {
    console.log('socket close');
    setTimeout(ka, 500);
  }

  function wa(a) {
    var c, d, e, f;

    function b() {
      var a, b;
      for (a = '';;) {
        b = e.getUint16(c, true);
        c += 2;
        if (0 == b) {
          break;
        }
        a += String.fromCharCode(b);
      }
      return a;
    }
    c = 1;
    e = new DataView(a.data);
    switch (e.getUint8(0)) {
    case 16:
      ya(e);
      break;
    case 17:
      x = e.getFloat64(1, true);
      y = e.getFloat64(9, true);
      L = e.getFloat64(17, true);
      break;
    case 20:
      m = [];
      C = [];
      break;
    case 32:
      C.push(e.getUint32(1, true));
      break;
    case 49:
      a = e.getUint32(c, true);
      c += 4;
      w = [];
      for (d = 0; d < a; ++d) {
        f = e.getUint32(c, true);
        c = c + 4;
        w.push({
          id: f,
          name: b()
        });
      }
      za();
      break;
    case 64:
      E = e.getFloat64(1, true);
      F = e.getFloat64(9, true);
      G = e.getFloat64(17, true);
      H = e.getFloat64(25, true);
      x = (G + E) / 2;
      y = (H + F) / 2;
      L = 1;
      if (0 == m.length) {
        s = x;
        t = y;
        zoom = L;
      };
    }
  }

  function ya(a) {
    var b, c, d, e, f, g, h, k, l, n;
    I = +new Date();
    b = Math.random();
    c = 1;
    aa = false;
    e = a.getUint16(c, true);
    c = c + 2;
    for (d = 0; d < e; ++d) {
      f = v[a.getUint32(c, true)];
      g = v[a.getUint32(c + 4, true)];
      c = c + 8;
      if (f && g) {
        g.destroy();
        g.ox = g.x;
        g.oy = g.y;
        g.oSize = g.size;
        g.nx = f.x;
        g.ny = f.y;
        g.nSize = g.size;
        g.updateTime = I;
      };
    }
    for (;;) {
      e = a.getUint32(c, true);
      c += 4;
      if (0 == e) {
        break;
      }
      d = a.getFloat64(c, true);
      c += 8;
      f = a.getFloat64(c, true);
      c += 8;
      g = a.getFloat64(c, true);
      c += 8;
      a.getUint8(c++);
      h = a.getUint8(c++);
      l = a.getUint8(c++);
      k = a.getUint8(c++);
      for (h = (h << 16 | l << 8 | k).toString(16); 6 > h.length;) {
        h = '0' + h;
      }
      h = '#' + h;
      k = a.getUint8(c++);
      l = !!(k & 1);
      if (k & 2) {
        c += 4;
      };
      if (k & 4) {
        c += 8;
      };
      if (k & 8) {
        c += 16;
      };
      for (k = '';;) {
        n = a.getUint16(c, true);
        c = c + 2;
        if (0 == n) {
          break;
        }
        k += String.fromCharCode(n);
      }
      n = null;
      if (v.hasOwnProperty(e)) {
        n = v[e];
        n.updatePos();
        n.ox = n.x;
        n.oy = n.y;
        n.oSize = n.size;
        n.color = h;
      } else {
        n = new Cell(e, d, f, g, h, l, k);
        n.pX = d;
        n.pY = f;
      };
      n.nx = d;
      n.ny = f;
      n.nSize = g;
      n.updateCode = b;
      n.updateTime = I;
      if (-1 != C.indexOf(e) && -1 == m.indexOf(n)) {
        document.getElementById('overlays').style.display = 'none';
        m.push(n);
        if (1 == m.length) {
          s = n.x;
          t = n.y;
        };
      };
    }
    a.getUint16(c, true);
    c += 2;
    f = a.getUint32(c, true);
    c += 4;
    for (d = 0; d < f; d++) {
      e = a.getUint32(c, true);
      c += 4;
      if (v[e]) {
        v[e].updateCode = b;
      };
    }
    for (d = 0; d < p.length; d++) {
      if (p[d].updateCode != b) {
        p[d--].destroy();
      };
    }
    if (aa && 0 == m.length) {
      jQuery('#overlays').fadeIn(3000);
    };
  }

  function sendTargetUpdate() {
    var a, b;
    if (null != l && l.readyState == l.OPEN) {
      a = mouseX - canvasWidth / 2;
      b = mouseY - canvasHeight / 2;
      if (!(64 > a * a + b * b || pa == Q && qa == R)) {
        pa = Q;
        qa = R;
        a = new ArrayBuffer(21);
        b = new DataView(a);
        b.setUint8(0, 16);
        b.setFloat64(1, Q, true);
        b.setFloat64(9, R, true);
        b.setUint32(17, 0, true);
        l.send(a);
      };
    }
  }

  function na() {
    var a, b, c;
    if (null != l && l.readyState == l.OPEN && null != M) {
      a = new ArrayBuffer(1 + 2 * M.length);
      b = new DataView(a);
      b.setUint8(0, 0);
      for (c = 0; c < M.length; ++c) {
        b.setUint16(1 + 2 * c, M.charCodeAt(c), true);
      }
      l.send(a);
    }
  }

  function B(a) {
    var b;
    if (null != l && l.readyState == l.OPEN) {
      b = new ArrayBuffer(1);
      new DataView(b).setUint8(0, a);
      l.send(b);
    }
  }

  function ha() {
    draw();
    window.requestAnimationFrame(ha);
  }

  function onResize() {
    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;
    _canvas.width = canvas.width = canvasWidth;
    _canvas.height = canvas.height = canvasHeight;
    draw();
  }

  function Aa() {
    var a, b;
    if (0 != m.length) {
      a = 0;
      for (b = 0; b < m.length; b++) {
        a += m[b].size;
      }
      a = Math.pow(Math.min(64 / a, 1), 0.4) * Math.max(canvasHeight / 1080, canvasWidth / 1920);
      zoom = (9 * zoom + a) / 10;
    }
  }

  function draw() {
    var a, b, c, e;
    a = +new Date();
    ++Ba;
    I = +new Date();
    if (0 < m.length) {
      Aa();
      b = 0;
      c = 0;
      for (e = 0; e < m.length; e++) {
        m[e].updatePos();
        b += m[e].x / m.length;
        c += m[e].y / m.length;
      }
      x = b;
      y = c;
      L = zoom;
      s = (s + b) / 2;
      t = (t + c) / 2;
    } else {
      if (x > G - (canvasWidth / 2 - 100) / zoom) {
        x = G - (canvasWidth / 2 - 100) / zoom;
      };
      if (y > H - (canvasHeight / 2 - 100) / zoom) {
        y = H - (canvasHeight / 2 - 100) / zoom;
      };
      if (x < E + (canvasWidth / 2 - 100) / zoom) {
        x = (E + canvasWidth / 2 - 100) / zoom;
      };
      if (y < F + (canvasHeight / 2 - 100) / zoom) {
        y = (F + canvasHeight / 2 - 100) / zoom;
      };
      s = (29 * s + x) / 30;
      t = (29 * t + y) / 30;
      zoom = (9 * zoom + L) / 10;
    }
    think();
    Y();
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.fillStyle = blackTheme ? '#111111' : '#F2FBFF';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.save();
    ctx.strokeStyle = blackTheme ? '#AAAAAA' : '#000000';
    ctx.globalAlpha = 0.2;
    ctx.scale(zoom, zoom);
    b = canvasWidth / zoom;
    c = canvasHeight / zoom;
    for (e = -0.5 + (-s + b / 2) % 50; e < b; e += 50) {
      ctx.beginPath();
      ctx.moveTo(e, 0);
      ctx.lineTo(e, c);
      ctx.stroke();
    }
    for (e = -0.5 + (-t + c / 2) % 50; e < c; e += 50) {
      ctx.beginPath();
      ctx.moveTo(0, e);
      ctx.lineTo(b, e);
      ctx.stroke();
    }
    ctx.restore();
    p.sort(function (a, b) {
      return a.size == b.size ? a.id - b.id : a.size - b.size;
    });
    ctx.save();
    ctx.translate(canvasWidth / 2, canvasHeight / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-s, -t);
    for (e = 0; e < D.length; e++) {
      D[e].draw();
    }
    for (e = 0; e < p.length; e++) {
      p[e].draw();
    }
    ctx.restore();
    if (renderedScoreboard && 0 != w.length) {
      ctx.drawImage(renderedScoreboard, canvasWidth - renderedScoreboard.width - 10, 10);
    };
    N = Math.max(N, Ca());
    if (0 != N) {
      if (null == T) {
        T = new SizeCache(24, '#FFFFFF');
      };
      T.setValue('Score: ' + ~~(N / 100));
      c = T.render();
      b = c.width;
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = '#000000';
      ctx.fillRect(10, canvasHeight - 10 - 24 - 10, b + 10, 34);
      ctx.globalAlpha = 1;
      ctx.drawImage(c, 15, canvasHeight - 10 - 24 - 5);
    };
    Da();
    a = +new Date() - a;
    if (a > 1000 / 60) {
      u -= 0.01;
    } else {
      if (a < 1000 / 65) {
        u += 0.01;
      };
    };
    if (0.4 > u) {
      u = 0.4;
    };
    if (1 < u) {
      u = 1;
    };
  }

  function Da() {
    var a;
    if (isMobile && ca.width) {
      a = canvasWidth / 5;
      ctx.drawImage(ca, 5, 5, a, a);
    }
  }

  function Ca() {
    var a, b;
    a = 0;
    for (b = 0; b < m.length; b++) {
      a += m[b].nSize * m[b].nSize;
    }
    return a;
  }

  function za() {
    var a, b, c;
    if (0 != w.length) {
      if (V) {
        renderedScoreboard = document.createElement('canvas');
        a = renderedScoreboard.getContext('2d');
        b = 60 + 24 * w.length;
        c = Math.min(200, 0.3 * canvasWidth) / 200;
        renderedScoreboard.width = 200 * c;
        renderedScoreboard.height = b * c;
        a.scale(c, c);
        a.globalAlpha = 0.4;
        a.fillStyle = '#000000';
        a.fillRect(0, 0, 200, b);
        a.globalAlpha = 1;
        a.fillStyle = '#FFFFFF';
        c = null;
        c = 'Leaderboard';
        a.font = '30px Ubuntu';
        a.fillText(c, 100 - a.measureText(c).width / 2, 40);
        a.font = '20px Ubuntu';
        for (b = 0; b < w.length; ++b) {
          c = w[b].name || 'An unnamed cell';
          if (!V) {
            c = 'An unnamed cell';
          };
          if (-1 != C.indexOf(w[b].id)) {
            if (m[0].name) {
              c = m[0].name;
            };
            a.fillStyle = '#FFAAAA';
          } else {
            a.fillStyle = '#FFFFFF';
          };
          c = b + 1 + '. ' + c;
          a.fillText(c, 100 - a.measureText(c).width / 2, 70 + 24 * b);
        }
      } else {
        renderedScoreboard = null;
      }
    }
  }

  function Cell(id, x, y, size, color, isVirus, name) {
    p.push(this);
    v[id] = this;
    this.id = id;
    this.ox = this.x = x;
    this.oy = this.y = y;
    this.oSize = this.size = size;
    this.color = color;
    this.isVirus = isVirus;
    this.points = [];
    this.pointsAcc = [];
    this.createPoints();
    this.setName(name);
  }

  function SizeCache(size, color, stroke, strokeColor) {
    if (size) {
      this._size = size;
    };
    if (color) {
      this._color = color;
    };
    this._stroke = !!stroke;
    if (strokeColor) {
      this._strokeColor = strokeColor;
    };
  }
  if ('agar.io' != window.location.hostname && 'localhost' != window.location.hostname && '10.10.2.13' != window.location.hostname) {
    window.location = 'http://agar.io/';
  } else {
    if (window.top != window) {
      window.top.location = 'http://agar.io/';
    } else {
      K = null;
      l = null;
      s = 0;
      t = 0;
      C = [];
      m = [];
      v = {};
      p = [];
      D = [];
      w = [];
      mouseX = 0;
      mouseY = 0;
      Q = -1;
      R = -1;
      Ba = 0;
      I = 0;
      M = null;
      E = 0;
      F = 0;
      G = 10000;
      H = 10000;
      zoom = 1;
      $ = null;
      ra = true;
      V = true;
      hardMode = false;
      aa = false;
      N = 0;
      blackTheme = false;
      sa = false;
      x = s = ~~((E + G) / 2);
      y = t = ~~((F + H) / 2);
      L = 1;
      isMobile = 'ontouchstart' in window && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      ca = new Image();
      ca.src = 'img/split.png';
      S = null;
      window.setNick = function (e) {
        ja();
        M = e;
        na();
        N = 0;
      };
      window.setRegion = ia;
      window.setSkins = function (e) {
        ra = e;
      };
      window.setNames = function (e) {
        V = e;
      };
      window.setDarkTheme = function (e) {
        blackTheme = e;
      };
      window.setColors = function (e) {
        hardMode = e;
      };
      window.setShowMass = function (e) {
        sa = e;
      };
      window.spectate = function (e) {
        B(1);
        ja();
      };
      window.connect = ma;
      pa = -1;
      qa = -1;
      renderedScoreboard = null;
      u = 1;
      T = null;
      W = {};
      Ea = 'poland;usa;china;russia;canada;australia;spain;brazil;germany;ukraine;france;sweden;hitler;north korea;south korea;japan;united kingdom;earth;greece;latvia;lithuania;estonia;finland;norway;cia;maldivas;austria;nigeria;reddit;yaranaika;confederate;9gag;indiana;4chan;italy;ussr;pewdiepie;bulgaria;tumblr;2ch.hk;hong kong;portugal;jamaica;german empire;mexico;sanik;switzerland;croatia;chile;indonesia;bangladesh;thailand;iran;iraq;peru;moon;botswana;bosnia;netherlands;european union;taiwan;pakistan;hungary;satanist;qing dynasty;nazi;matriarchy;patriarchy;feminism;ireland;texas;facepunch;prodota;cambodia;steam;piccolo;ea;india;kc;denmark;quebec;ayy lmao;sealand;bait;tsarist russia;origin;vinesauce;stalin;belgium;luxembourg;stussy;prussia;8ch;argentina;scotland;sir;romania;belarus;wojak;isis;doge;nasa;byzantium;imperial japan;kingdom of france;somalia;turkey;mars;pokerface'.split(';');
      Fa = ['m\'blob'];
      Cell.prototype = {
        id: 0,
        points: null,
        pointsAcc: null,
        name: null,
        nameCache: null,
        sizeCache: null,
        x: 0,
        y: 0,
        size: 0,
        ox: 0,
        oy: 0,
        oSize: 0,
        nx: 0,
        ny: 0,
        nSize: 0,
        updateTime: 0,
        updateCode: 0,
        drawTime: 0,
        destroyed: false,
        isVirus: false,
        destroy: function () {
          var a;
          for (a = 0; a < p.length; a++) {
            if (p[a] == this) {
              p.splice(a, 1);
              break;
            }
          }
          delete v[this.id];
          a = m.indexOf(this);
          if (-1 != a) {
            aa = true;
            m.splice(a, 1);
          };
          a = C.indexOf(this.id);
          if (-1 != a) {
            C.splice(a, 1);
          };
          this.destroyed = true;
          D.push(this);
        },
        getNameSize: function () {
          return Math.max(~~(0.3 * this.size), 24);
        },
        setName: function (a) {
          if (this.name = a) {
            if (null == this.nameCache) {
              this.nameCache = new SizeCache(this.getNameSize(), '#FFFFFF', true, '#000000');
            } else {
              this.nameCache.setSize(this.getNameSize());
            };
            this.nameCache.setValue(this.name);
          }
        },
        createPoints: function () {
          var a, b, c;
          for (a = this.getNumPoints(); this.points.length > a;) {
            b = ~~(Math.random() * this.points.length);
            this.points.splice(b, 1);
            this.pointsAcc.splice(b, 1);
          }
          if (0 == this.points.length && 0 < a) {
            this.points.push({
              c: this,
              v: this.size,
              x: this.x,
              y: this.y
            });
            this.pointsAcc.push(Math.random() - 0.5);
          };
          for (; this.points.length < a;) {
            b = ~~(Math.random() * this.points.length);
            c = this.points[b];
            this.points.splice(b, 0, {
              c: this,
              v: c.v,
              x: c.x,
              y: c.y
            });
            this.pointsAcc.splice(b, 0, this.pointsAcc[b]);
          }
        },
        getNumPoints: function () {
          var a;
          a = 10;
          if (20 > this.size) {
            a = 5;
          };
          if (this.isVirus) {
            a = 30;
          };
          return ~~Math.max(this.size * zoom * (this.isVirus ? Math.min(2 * u, 1) : u), a);
        },
        movePoints: function () {
          var a, b, c, d, e, f, g, h, k, l, m, n;
          this.createPoints();
          a = this.points;
          b = this.pointsAcc;
          c = b.concat();
          e = a.concat();
          d = e.length;
          for (f = 0; f < d; ++f) {
            g = c[(f - 1 + d) % d];
            h = c[(f + 1) % d];
            b[f] += Math.random() - 0.5;
            b[f] *= 0.7;
            if (10 < b[f]) {
              b[f] = 10;
            };
            if (-10 > b[f]) {
              b[f] = -10;
            };
            b[f] = (g + h + 8 * b[f]) / 10;
          }
          k = this;
          for (f = 0; f < d; ++f) {
            c = e[f].v;
            g = e[(f - 1 + d) % d].v;
            h = e[(f + 1) % d].v;
            if (15 < this.size && null != K) {
              l = false;
              n = a[f].x;
              m = a[f].y;
              K.retrieve2(n - 5, m - 5, 10, 10, function (a) {
                if (a.c != k && 25 > (n - a.x) * (n - a.x) + (m - a.y) * (m - a.y)) {
                  l = true;
                };
              });
              if (!l && (a[f].x < E || a[f].y < F || a[f].x > G || a[f].y > H)) {
                l = true;
              };
              if (l) {
                if (0 < b[f]) {
                  b[f] = 0;
                };
                b[f] -= 1;
              };
            }
            c += b[f];
            if (0 > c) {
              c = 0;
            };
            c = (12 * c + this.size) / 13;
            a[f].v = (g + h + 8 * c) / 10;
            g = 2 * Math.PI / d;
            h = this.points[f].v;
            if (this.isVirus && 0 == f % 2) {
              h += 5;
            };
            a[f].x = this.x + Math.cos(g * f) * h;
            a[f].y = this.y + Math.sin(g * f) * h;
          }
        },
        updatePos: function () {
          var a, b;
          a = (I - this.updateTime) / 120;
          a = 0 > a ? 0 : 1 < a ? 1 : a;
          a = a * a * (3 - 2 * a);
          this.getNameSize();
          if (this.destroyed && 1 <= a) {
            b = D.indexOf(this);
            if (-1 != b) {
              D.splice(b, 1);
            };
          }
          this.x = a * (this.nx - this.ox) + this.ox;
          this.y = a * (this.ny - this.oy) + this.oy;
          this.size = a * (this.nSize - this.oSize) + this.oSize;
          return a;
        },
        shouldRender: function () {
          return this.x + this.size + 40 < s - canvasWidth / 2 / zoom || this.y + this.size + 40 < t - canvasHeight / 2 / zoom || this.x - this.size - 40 > s + canvasWidth / 2 / zoom || this.y - this.size - 40 > t + canvasHeight / 2 / zoom ? false : true;
        },
        draw: function () {
          var a, b, c, e, f, h;
          if (this.shouldRender()) {
            a = !this.isVirus && 0.5 > zoom;
            ctx.save();
            this.drawTime = I;
            b = this.updatePos();
            if (this.destroyed) {
              ctx.globalAlpha *= 1 - b;
            };
            ctx.lineWidth = 10;
            ctx.lineCap = 'round';
            ctx.lineJoin = this.isVirus ? 'mitter' : 'round';
            if (hardMode) {
              ctx.fillStyle = '#FFFFFF';
              ctx.strokeStyle = '#AAAAAA';
            } else {
              ctx.fillStyle = this.color;
              ctx.strokeStyle = this.color;
            };
            if (a) {
              ctx.beginPath();
              ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI, false);
            } else {
              this.movePoints();
              ctx.beginPath();
              b = this.getNumPoints();
              ctx.moveTo(this.points[0].x, this.points[0].y);
              for (c = 1; c <= b; ++c) {
                e = c % b;
                ctx.lineTo(this.points[e].x, this.points[e].y);
              }
            }
            ctx.closePath();
            b = this.name.toLowerCase();
            if (ra) {
              if (-1 != Ea.indexOf(b)) {
                if (!W.hasOwnProperty(b)) {
                  W[b] = new Image();
                  W[b].src = 'skins/' + b + '.png';
                };
                c = W[b];
              } else {
                c = null;
              };
            } else {
              c = null;
            };
            b = c ? -1 != Fa.indexOf(b) : false;
            if (!a) {
              ctx.stroke();
            };
            ctx.fill();
            if (null != c && 0 < c.width && !b) {
              ctx.save();
              ctx.clip();
              ctx.drawImage(c, this.x - this.size, this.y - this.size, 2 * this.size, 2 * this.size);
              ctx.restore();
            };
            if ((hardMode || 15 < this.size) && !a) {
              ctx.strokeStyle = '#000000';
              ctx.globalAlpha *= 0.1;
              ctx.stroke();
            };
            ctx.globalAlpha = 1;
            if (null != c && 0 < c.width && b) {
              ctx.drawImage(c, this.x - 2 * this.size, this.y - 2 * this.size, 4 * this.size, 4 * this.size);
            };
            c = -1 != m.indexOf(this);
            a = ~~this.y;
            if ((V || c) && this.name && this.nameCache) {
              e = this.nameCache;
              e.setValue(this.name);
              e.setSize(this.getNameSize());
              b = Math.ceil(10 * zoom) / 10;
              e.setScale(b);
              e = e.render();
              h = ~~(e.width / b);
              f = ~~(e.height / b);
              ctx.drawImage(e, ~~this.x - ~~(h / 2), a - ~~(f / 2), h, f);
              a += e.height / 2 / b + 4;
            }
            if (sa && c) {
              if (null == this.sizeCache) {
                this.sizeCache = new SizeCache(this.getNameSize() / 2, '#FFFFFF', true, '#000000');
              };
              c = this.sizeCache;
              c.setSize(this.getNameSize() / 2);
              c.setValue(~~(this.size * this.size / 100));
              b = Math.ceil(10 * zoom) / 10;
              c.setScale(b);
              e = c.render();
              h = ~~(e.width / b);
              f = ~~(e.height / b);
              ctx.drawImage(e, ~~this.x - ~~(h / 2), a - ~~(f / 2), h, f);
            };
            ctx.restore();
          }
        }
      };
      SizeCache.prototype = {
        _value: '',
        _color: '#000000',
        _stroke: false,
        _strokeColor: '#000000',
        _size: 16,
        _canvas: null,
        _ctx: null,
        _dirty: false,
        _scale: 1,
        setSize: function (a) {
          if (this._size != a) {
            this._size = a;
            this._dirty = true;
          };
        },
        setScale: function (a) {
          if (this._scale != a) {
            this._scale = a;
            this._dirty = true;
          };
        },
        setColor: function (a) {
          if (this._color != a) {
            this._color = a;
            this._dirty = true;
          };
        },
        setStroke: function (a) {
          if (this._stroke != a) {
            this._stroke = a;
            this._dirty = true;
          };
        },
        setStrokeColor: function (a) {
          if (this._strokeColor != a) {
            this._strokeColor = a;
            this._dirty = true;
          };
        },
        setValue: function (a) {
          if (a != this._value) {
            this._value = a;
            this._dirty = true;
          };
        },
        render: function () {
          var a, b, c, d, f, g, h, k;
          if (null == this._canvas) {
            this._canvas = document.createElement('canvas');
            this._ctx = this._canvas.getContext('2d');
          };
          if (this._dirty) {
            this._dirty = false;
            a = this._canvas;
            b = this._ctx;
            c = this._value;
            d = this._scale;
            g = this._size;
            f = g + 'px Ubuntu';
            b.font = f;
            h = b.measureText(c).width;
            k = ~~(0.2 * g);
            a.width = (h + 6) * d;
            a.height = (g + k) * d;
            b.font = f;
            b.scale(d, d);
            b.globalAlpha = 1;
            b.lineWidth = 3;
            b.strokeStyle = this._strokeColor;
            b.fillStyle = this._color;
            if (this._stroke) {
              b.strokeText(c, 3, g - k / 2);
            };
            b.fillText(c, 3, g - k / 2);
          }
          return this._canvas;
        }
      };
      window.onload = init;
    }
  }
}(window, jQuery));
