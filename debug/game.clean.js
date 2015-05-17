(function root(window, jQuery) {
  var B, C, D, E, F, Fa, H, I, Ia, J, Ja, K, L, M, N, Q, R, S, T, U, V, W, X, Z, _canvas, bannedSkins, canvas, canvasHeight, canvasWidth, ctx, da, fa, ga, ha, isMobile, l, mouseX, mouseY, myCells, q, s, t, ta, u, ua, v, va, w, wa, x, xa, y, zoom;

  function init() {
    var a, b, c;
    refreshRegionInfo();
    setInterval(refreshRegionInfo, 180000);
    canvas = _canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    canvas.onmousedown = function onmousedown(e) {
      var b, c;
      if (isMobile) {
        b = e.clientX - (5 + canvasWidth / 5 / 2);
        c = e.clientY - (5 + canvasWidth / 5 / 2);
        if (Math.sqrt(b * b + c * c) <= canvasWidth / 5 / 2) {
          G();
          A(17);
          return;
        }
      }
      mouseX = e.clientX;
      mouseY = e.clientY;
      aa();
      G();
    };
    canvas.onmousemove = function onmousemove(e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      aa();
    };
    canvas.onmouseup = function onmouseup(a) {};
    a = false;
    b = false;
    c = false;
    window.onkeydown = function onkeydown(d) {
      if (!(32 != d.keyCode || a)) {
        G();
        A(17);
        a = true;
      };
      if (!(81 != d.keyCode || b)) {
        A(18);
        b = true;
      };
      if (!(87 != d.keyCode || c)) {
        G();
        A(21);
        c = true;
      };
      if (27 == d.keyCode) {
        jQuery('#overlays').fadeIn(200);
      };
    };
    window.onkeyup = function onkeyup(d) {
      if (32 == d.keyCode) {
        a = false;
      };
      if (87 == d.keyCode) {
        c = false;
      };
      if (81 == d.keyCode && b) {
        A(19);
        b = false;
      };
    };
    window.onblur = function onblur() {
      A(19);
      c = b = a = false;
    };
    window.onresize = onResize;
    onResize();
    if (window.requestAnimationFrame) {
      window.requestAnimationFrame(la);
    } else {
      setInterval(drawAll, 1000 / 60);
    };
    setInterval(G, 40);
    ma(jQuery('#region').val());
    jQuery('#overlays').show();
  }

  function think() {
    var a, b, c, d, e, k;
    if (0.5 > zoom) {
      H = null;
    } else {
      a = Number.POSITIVE_INFINITY;
      b = Number.POSITIVE_INFINITY;
      c = Number.NEGATIVE_INFINITY;
      d = Number.NEGATIVE_INFINITY;
      e = 0;
      for (k = 0; k < q.length; k++) {
        if (q[k].shouldRender()) {
          e = Math.max(q[k].size, e);
          a = Math.min(q[k].x, a);
          b = Math.min(q[k].y, b);
          c = Math.max(q[k].x, c);
          d = Math.max(q[k].y, d);
        };
      }
      H = QUAD.init({
        minX: a - (e + 100),
        minY: b - (e + 100),
        maxX: c + (e + 100),
        maxY: d + (e + 100)
      });
      for (k = 0; k < q.length; k++) {
        a = q[k];
        if (a.shouldRender()) {
          for (b = 0; b < a.points.length; ++b) {
            H.insert(a.points[b]);
          }
        }
      }
    }
  }

  function aa() {
    Q = (mouseX - canvasWidth / 2) / zoom + s;
    R = (mouseY - canvasHeight / 2) / zoom + t;
  }

  function refreshRegionInfo() {
    if (null == S) {
      S = {};
      jQuery('#region').children().each(function each() {
        var a, b;
        a = jQuery(this);
        b = a.val();
        if (b) {
          S[b] = a.text();
        };
      });
    };
    jQuery.get('http://m.agar.io/info', function get(a) {
      var b, c, d;
      b = {};
      for (c in a.regions) {
        d = c.split(':')[0];
        b[d] = b[d] || 0;
        b[d] += a.regions[c].numPlayers;
      }
      for (c in b) {
        jQuery('#region option[value="' + c + '"]').text(S[c] + ' (' + b[c] + ' players)');
      }
    }, 'json');
  }

  function na() {
    jQuery('#adsBottom').hide();
    jQuery('#overlays').hide();
  }

  function ma(a) {
    if (a && a != I) {
      I = a;
      ca();
    };
  }

  function oa() {
    console.log('Find ' + I + J);
    jQuery.ajax('http://m.agar.io/', {
      error: function error() {
        setTimeout(oa, 1000);
      },
      success: function success(a) {
        a = a.split('\n');
        pa('ws://' + a[0]);
      },
      dataType: 'text',
      method: 'POST',
      cache: false,
      crossDomain: true,
      data: I + J || '?'
    });
  }

  function ca() {
    if (I) {
      jQuery('#connecting').show();
      oa();
    };
  }

  function pa(a) {
    if (l) {
      l.onopen = null;
      l.onmessage = null;
      l.onclose = null;
      try {
        l.close();
      } catch (b) {}
      l = null;
    }
    B = [];
    myCells = [];
    w = {};
    q = [];
    C = [];
    y = [];
    x = u = null;
    D = 0;
    console.log('Connecting to ' + a);
    l = new WebSocket(a);
    l.binaryType = 'arraybuffer';
    l.onopen = Aa;
    l.onmessage = Ba;
    l.onclose = Ca;
    l.onerror = function onerror() {
      console.log('socket error');
    };
  }

  function Aa(a) {
    var b;
    jQuery('#connecting').hide();
    console.log('socket open');
    a = new ArrayBuffer(5);
    b = new DataView(a);
    b.setUint8(0, 254);
    b.setUint32(1, 1, true);
    l.send(a);
    a = new ArrayBuffer(5);
    b = new DataView(a);
    b.setUint8(0, 255);
    b.setUint32(1, 1, true);
    l.send(a);
    qa();
  }

  function Ca(a) {
    console.log('socket close');
    setTimeout(ca, 500);
  }

  function Ba(a) {
    var c, d, e, k;

    function b() {
      var a, b;
      for (a = '';;) {
        b = d.getUint16(c, true);
        c += 2;
        if (0 == b) {
          break;
        }
        a += String.fromCharCode(b);
      }
      return a;
    }
    c = 1;
    d = new DataView(a.data);
    switch (d.getUint8(0)) {
    case 16:
      Da(d);
      break;
    case 17:
      K = d.getFloat32(1, true);
      L = d.getFloat32(5, true);
      M = d.getFloat32(9, true);
      break;
    case 20:
      myCells = [];
      B = [];
      break;
    case 32:
      B.push(d.getUint32(1, true));
      break;
    case 49:
      if (null != u) {
        break;
      }
      a = d.getUint32(c, true);
      c += 4;
      y = [];
      for (e = 0; e < a; ++e) {
        k = d.getUint32(c, true);
        c = c + 4;
        y.push({
          id: k,
          name: b()
        });
      }
      ra();
      break;
    case 50:
      u = [];
      a = d.getUint32(c, true);
      c += 4;
      for (e = 0; e < a; ++e) {
        u.push(d.getFloat32(c, true));
        c += 4;
      }
      ra();
      break;
    case 64:
      T = d.getFloat64(1, true), U = d.getFloat64(9, true), V = d.getFloat64(17, true), W = d.getFloat64(25, true), K = (V + T) / 2, L = (W + U) / 2, M = 1, 0 == myCells.length && (s = K, t = L, zoom = M);
    }
  }

  function Da(a) {
    var b, c, d, e, f, h, k, l, m, n, p;
    E = +new Date();
    b = Math.random();
    c = 1;
    da = false;
    d = a.getUint16(c, true);
    c = c + 2;
    for (e = 0; e < d; ++e) {
      k = w[a.getUint32(c, true)];
      f = w[a.getUint32(c + 4, true)];
      c = c + 8;
      if (k && f) {
        f.destroy();
        f.ox = f.x;
        f.oy = f.y;
        f.oSize = f.size;
        f.nx = k.x;
        f.ny = k.y;
        f.nSize = f.size;
        f.updateTime = E;
      };
    }
    for (;;) {
      d = a.getUint32(c, true);
      c += 4;
      if (0 == d) {
        break;
      }
      e = a.getFloat32(c, true);
      c = c + 4;
      k = a.getFloat32(c, true);
      c = c + 4;
      f = a.getFloat32(c, true);
      c = c + 4;
      h = a.getUint8(c++);
      l = a.getUint8(c++);
      p = a.getUint8(c++);
      for (h = (h << 16 | l << 8 | p).toString(16); 6 > h.length;) {
        h = '0' + h;
      }
      h = '#' + h;
      m = a.getUint8(c++);
      l = !!(m & 1);
      p = !!(m & 16);
      if (m & 2) {
        c += 4;
      };
      if (m & 4) {
        c += 8;
      };
      if (m & 8) {
        c += 16;
      };
      for (m = '';;) {
        n = a.getUint16(c, true);
        c = c + 2;
        if (0 == n) {
          break;
        }
        m += String.fromCharCode(n);
      }
      n = null;
      if (w.hasOwnProperty(d)) {
        n = w[d];
        n.updatePos();
        n.ox = n.x;
        n.oy = n.y;
        n.oSize = n.size;
        n.color = h;
      } else {
        n = new Cell(d, e, k, f, h, m);
        n.pX = e;
        n.pY = k;
      };
      n.isVirus = l;
      n.isAgitated = p;
      n.nx = e;
      n.ny = k;
      n.nSize = f;
      n.updateCode = b;
      n.updateTime = E;
      if (-1 != B.indexOf(d) && -1 == myCells.indexOf(n)) {
        document.getElementById('overlays').style.display = 'none';
        myCells.push(n);
        if (1 == myCells.length) {
          s = n.x;
          t = n.y;
        };
      };
    }
    a.getUint16(c, true);
    c += 2;
    k = a.getUint32(c, true);
    c += 4;
    for (e = 0; e < k; e++) {
      d = a.getUint32(c, true);
      c += 4;
      if (w[d]) {
        w[d].updateCode = b;
      };
    }
    for (e = 0; e < q.length; e++) {
      if (q[e].updateCode != b) {
        q[e--].destroy();
      };
    }
    if (da && 0 == myCells.length) {
      jQuery('#overlays').fadeIn(3000);
    };
  }

  function G() {
    var a, b;
    if (ea()) {
      a = mouseX - canvasWidth / 2;
      b = mouseY - canvasHeight / 2;
      if (!(64 > a * a + b * b || ta == Q && ua == R)) {
        ta = Q;
        ua = R;
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

  function qa() {
    var a, b, c;
    if (ea() && null != N) {
      a = new ArrayBuffer(1 + 2 * N.length);
      b = new DataView(a);
      b.setUint8(0, 0);
      for (c = 0; c < N.length; ++c) {
        b.setUint16(1 + 2 * c, N.charCodeAt(c), true);
      }
      l.send(a);
    }
  }

  function ea() {
    return null != l && l.readyState == l.OPEN;
  }

  function A(a) {
    var b;
    if (ea()) {
      b = new ArrayBuffer(1);
      new DataView(b).setUint8(0, a);
      l.send(b);
    }
  }

  function la() {
    drawAll();
    window.requestAnimationFrame(la);
  }

  function onResize() {
    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;
    _canvas.width = canvas.width = canvasWidth;
    _canvas.height = canvas.height = canvasHeight;
    drawAll();
  }

  function calculateZoom() {
    var b, sizeFactor;
    if (0 != myCells.length) {
      sizeFactor = 0;
      for (b = 0; b < myCells.length; b++) {
        sizeFactor += myCells[b].size;
      }
      sizeFactor = Math.pow(Math.min(64 / sizeFactor, 1), 0.4) * Math.max(canvasHeight / 1080, canvasWidth / 1920);
      zoom = (9 * zoom + sizeFactor) / 10;
    }
  }

  function drawAll() {
    var a, b, c, d;
    a = +new Date();
    ++Fa;
    E = +new Date();
    if (0 < myCells.length) {
      calculateZoom();
      b = 0;
      c = 0;
      for (d = 0; d < myCells.length; d++) {
        myCells[d].updatePos();
        b += myCells[d].x / myCells.length;
        c += myCells[d].y / myCells.length;
      }
      K = b;
      L = c;
      M = zoom;
      s = (s + b) / 2;
      t = (t + c) / 2;
    } else {
      s = (29 * s + K) / 30;
      t = (29 * t + L) / 30;
      zoom = (9 * zoom + M) / 10;
    }
    think();
    aa();
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.fillStyle = fa ? '#111111' : '#F2FBFF';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.save();
    ctx.strokeStyle = fa ? '#AAAAAA' : '#000000';
    ctx.globalAlpha = 0.2;
    ctx.scale(zoom, zoom);
    b = canvasWidth / zoom;
    c = canvasHeight / zoom;
    for (d = -0.5 + (-s + b / 2) % 50; d < b; d += 50) {
      ctx.beginPath();
      ctx.moveTo(d, 0);
      ctx.lineTo(d, c);
      ctx.stroke();
    }
    for (d = -0.5 + (-t + c / 2) % 50; d < c; d += 50) {
      ctx.beginPath();
      ctx.moveTo(0, d);
      ctx.lineTo(b, d);
      ctx.stroke();
    }
    ctx.restore();
    q.sort(function sort(a, b) {
      return a.size == b.size ? a.id - b.id : a.size - b.size;
    });
    ctx.save();
    ctx.translate(canvasWidth / 2, canvasHeight / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-s, -t);
    for (d = 0; d < C.length; d++) {
      C[d].draw();
    }
    for (d = 0; d < q.length; d++) {
      q[d].draw();
    }
    ctx.restore();
    if (x) {
      ctx.drawImage(x, canvasWidth - x.width - 10, 10);
    };
    D = Math.max(D, Ga());
    if (0 != D) {
      if (null == X) {
        X = new SizeCache(24, '#FFFFFF');
      };
      X.setValue('Score: ' + ~~(D / 100));
      c = X.render();
      b = c.width;
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = '#000000';
      ctx.fillRect(10, canvasHeight - 10 - 24 - 10, b + 10, 34);
      ctx.globalAlpha = 1;
      ctx.drawImage(c, 15, canvasHeight - 10 - 24 - 5);
    };
    Ha();
    a = +new Date() - a;
    if (a > 1000 / 60) {
      v -= 0.01;
    } else {
      if (a < 1000 / 65) {
        v += 0.01;
      };
    };
    if (0.4 > v) {
      v = 0.4;
    };
    if (1 < v) {
      v = 1;
    };
  }

  function Ha() {
    var a;
    if (isMobile && ga.width) {
      a = canvasWidth / 5;
      ctx.drawImage(ga, 5, 5, a, a);
    }
  }

  function Ga() {
    var a, b;
    a = 0;
    for (b = 0; b < myCells.length; b++) {
      a += myCells[b].nSize * myCells[b].nSize;
    }
    return a;
  }

  function ra() {
    var a, b, c;
    x = null;
    if (null != u || 0 != y.length) {
      if (null != u || Z) {
        x = document.createElement('canvas');
        a = x.getContext('2d');
        b = 60;
        b = null == u ? b + 24 * y.length : b + 180;
        c = Math.min(200, 0.3 * canvasWidth) / 200;
        x.width = 200 * c;
        x.height = b * c;
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
        if (null == u) {
          a.font = '20px Ubuntu';
          for (b = 0; b < y.length; ++b) {
            c = y[b].name || 'An unnamed cell';
            if (!Z) {
              c = 'An unnamed cell';
            };
            if (-1 != B.indexOf(y[b].id)) {
              if (myCells[0].name) {
                c = myCells[0].name;
              };
              a.fillStyle = '#FFAAAA';
            } else {
              a.fillStyle = '#FFFFFF';
            };
            c = b + 1 + '. ' + c;
            a.fillText(c, 100 - a.measureText(c).width / 2, 70 + 24 * b);
          }
        } else {
          for (b = c = 0; b < u.length; ++b) {
            angEnd = c + u[b] * Math.PI * 2;
            a.fillStyle = Ia[b + 1];
            a.beginPath();
            a.moveTo(100, 140);
            a.arc(100, 140, 80, c, angEnd, false);
            a.fill();
            c = angEnd;
          }
        }
      }
    }
  }

  function Cell(id, x, y, size, color, name) {
    q.push(this);
    w[id] = this;
    this.id = id;
    this.ox = this.x = x;
    this.oy = this.y = y;
    this.oSize = this.size = size;
    this.color = color;
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
      H = null;
      l = null;
      s = 0;
      t = 0;
      B = [];
      myCells = [];
      w = {};
      q = [];
      C = [];
      y = [];
      mouseX = 0;
      mouseY = 0;
      Q = -1;
      R = -1;
      Fa = 0;
      E = 0;
      N = null;
      T = 0;
      U = 0;
      V = 10000;
      W = 10000;
      zoom = 1;
      I = null;
      va = true;
      Z = true;
      ha = false;
      da = false;
      D = 0;
      fa = false;
      wa = false;
      K = s = ~~((T + V) / 2);
      L = t = ~~((U + W) / 2);
      M = 1;
      J = '';
      u = null;
      Ia = [
        '#333333',
        '#FF3333',
        '#33FF33',
        '#3333FF'
      ];
      isMobile = 'ontouchstart' in window && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      ga = new Image();
      ga.src = 'img/split.png';
      xa = document.createElement('canvas');
      if ('undefined' == typeof console || 'undefined' == typeof DataView || 'undefined' == typeof WebSocket || null == xa || null == xa.getContext) {
        alert('You browser does not support this game, we recommend you to use Firefox to play this');
      } else {
        S = null;
        window.setNick = function setNick(a) {
          na();
          N = a;
          qa();
          D = 0;
        };
        window.setRegion = ma;
        window.setSkins = function setSkins(a) {
          va = a;
        };
        window.setNames = function setNames(a) {
          Z = a;
        };
        window.setDarkTheme = function setDarkTheme(a) {
          fa = a;
        };
        window.setColors = function setColors(a) {
          ha = a;
        };
        window.setShowMass = function setShowMass(a) {
          wa = a;
        };
        window.spectate = function spectate() {
          A(1);
          na();
        };
        window.setGameMode = function setGameMode(a) {
          if (a != J) {
            J = a;
            ca();
          };
        };
        window.connect = pa;
        ta = -1;
        ua = -1;
        x = null;
        v = 1;
        X = null;
        F = {};
        Ja = 'poland;usa;china;russia;canada;australia;spain;brazil;germany;ukraine;france;sweden;hitler;north korea;south korea;japan;united kingdom;earth;greece;latvia;lithuania;estonia;finland;norway;cia;maldivas;austria;nigeria;reddit;yaranaika;confederate;9gag;indiana;4chan;italy;ussr;bulgaria;tumblr;2ch.hk;hong kong;portugal;jamaica;german empire;mexico;sanik;switzerland;croatia;chile;indonesia;bangladesh;thailand;iran;iraq;peru;moon;botswana;bosnia;netherlands;european union;taiwan;pakistan;hungary;satanist;qing dynasty;nazi;matriarchy;patriarchy;feminism;ireland;texas;facepunch;prodota;cambodia;steam;piccolo;ea;india;kc;denmark;quebec;ayy lmao;sealand;bait;tsarist russia;origin;vinesauce;stalin;belgium;luxembourg;stussy;prussia;8ch;argentina;scotland;sir;romania;belarus;wojak;isis;doge;nasa;byzantium;imperial japan;french kingdom;somalia;turkey;mars;pokerface'.split(';');
        bannedSkins = ['m\'blob'];
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
          isAgitated: false,
          wasSimpleDrawing: true,
          destroy: function destroy() {
            var a;
            for (a = 0; a < q.length; a++) {
              if (q[a] == this) {
                q.splice(a, 1);
                break;
              }
            }
            delete w[this.id];
            a = myCells.indexOf(this);
            if (-1 != a) {
              da = true;
              myCells.splice(a, 1);
            };
            a = B.indexOf(this.id);
            if (-1 != a) {
              B.splice(a, 1);
            };
            this.destroyed = true;
            C.push(this);
          },
          getNameSize: function getNameSize() {
            return Math.max(~~(0.3 * this.size), 24);
          },
          setName: function setName(a) {
            if (this.name = a) {
              if (null == this.nameCache) {
                this.nameCache = new SizeCache(this.getNameSize(), '#FFFFFF', true, '#000000');
              } else {
                this.nameCache.setSize(this.getNameSize());
              };
              this.nameCache.setValue(this.name);
            }
          },
          createPoints: function createPoints() {
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
          getNumPoints: function getNumPoints() {
            var a;
            a = 10;
            if (20 > this.size) {
              a = 5;
            };
            if (this.isVirus) {
              a = 30;
            };
            return ~~Math.max(this.size * zoom * (this.isVirus ? Math.min(2 * v, 1) : v), a);
          },
          movePoints: function movePoints() {
            var a, b, c, d, e, f, g, h, l, m, p;
            this.createPoints();
            a = this.points;
            b = this.pointsAcc;
            c = a.length;
            for (d = 0; d < c; ++d) {
              e = b[(d - 1 + c) % c];
              f = b[(d + 1) % c];
              b[d] += (Math.random() - 0.5) * (this.isAgitated ? 3 : 1);
              b[d] *= 0.7;
              if (10 < b[d]) {
                b[d] = 10;
              };
              if (-10 > b[d]) {
                b[d] = -10;
              };
              b[d] = (e + f + 8 * b[d]) / 10;
            }
            h = this;
            for (d = 0; d < c; ++d) {
              g = a[d].v;
              e = a[(d - 1 + c) % c].v;
              f = a[(d + 1) % c].v;
              if (15 < this.size && null != H) {
                l = false;
                m = a[d].x;
                p = a[d].y;
                H.retrieve2(m - 5, p - 5, 10, 10, function retrieve2(a) {
                  if (a.c != h && 25 > (m - a.x) * (m - a.x) + (p - a.y) * (p - a.y)) {
                    l = true;
                  };
                });
                if (!l && (a[d].x < T || a[d].y < U || a[d].x > V || a[d].y > W)) {
                  l = true;
                };
                if (l) {
                  if (0 < b[d]) {
                    b[d] = 0;
                  };
                  b[d] -= 1;
                };
              }
              g += b[d];
              if (0 > g) {
                g = 0;
              };
              g = this.isAgitated ? (19 * g + this.size) / 20 : (12 * g + this.size) / 13;
              a[d].v = (e + f + 8 * g) / 10;
              e = 2 * Math.PI / c;
              f = this.points[d].v;
              if (this.isVirus && 0 == d % 2) {
                f += 5;
              };
              a[d].x = this.x + Math.cos(e * d) * f;
              a[d].y = this.y + Math.sin(e * d) * f;
            }
          },
          updatePos: function updatePos() {
            var a, b;
            a = (E - this.updateTime) / 120;
            a = 0 > a ? 0 : 1 < a ? 1 : a;
            a = a * a * (3 - 2 * a);
            this.getNameSize();
            if (this.destroyed && 1 <= a) {
              b = C.indexOf(this);
              if (-1 != b) {
                C.splice(b, 1);
              };
            }
            this.x = a * (this.nx - this.ox) + this.ox;
            this.y = a * (this.ny - this.oy) + this.oy;
            this.size = a * (this.nSize - this.oSize) + this.oSize;
            return a;
          },
          shouldRender: function shouldRender() {
            return this.x + this.size + 40 < s - canvasWidth / 2 / zoom || this.y + this.size + 40 < t - canvasHeight / 2 / zoom || this.x - this.size - 40 > s + canvasWidth / 2 / zoom || this.y - this.size - 40 > t + canvasHeight / 2 / zoom ? false : true;
          },
          draw: function draw() {
            var a, d, f, k, tmp2, tmp3;
            if (this.shouldRender()) {
              a = !this.isVirus && !this.isAgitated && 0.5 > zoom;
              if (this.wasSimpleDrawing && !a) {
                for (tmp2 = 0; tmp2 < this.points.length; tmp2++) {
                  this.points[tmp2].v = this.size;
                }
              }
              this.wasSimpleDrawing = a;
              ctx.save();
              this.drawTime = E;
              tmp2 = this.updatePos();
              if (this.destroyed) {
                ctx.globalAlpha *= 1 - tmp2;
              };
              ctx.lineWidth = 10;
              ctx.lineCap = 'round';
              ctx.lineJoin = this.isVirus ? 'mitter' : 'round';
              if (ha) {
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
                tmp3 = this.getNumPoints();
                ctx.moveTo(this.points[0].x, this.points[0].y);
                for (tmp2 = 1; tmp2 <= tmp3; ++tmp2) {
                  d = tmp2 % tmp3;
                  ctx.lineTo(this.points[d].x, this.points[d].y);
                }
              }
              ctx.closePath();
              tmp2 = this.name.toLowerCase();
              if (!this.isAgitated && va && '' == J) {
                if (-1 != Ja.indexOf(tmp2)) {
                  if (!F.hasOwnProperty(tmp2)) {
                    F[tmp2] = new Image();
                    F[tmp2].src = 'skins/' + tmp2 + '.png';
                  };
                  tmp3 = 0 != F[tmp2].width && F[tmp2].complete ? F[tmp2] : null;
                } else {
                  tmp3 = null;
                };
              } else {
                tmp3 = null;
              };
              tmp2 = tmp3 ? -1 != bannedSkins.indexOf(tmp2) : false;
              if (!a) {
                ctx.stroke();
              };
              ctx.fill();
              if (!(null == tmp3 || tmp2)) {
                ctx.save();
                ctx.clip();
                ctx.drawImage(tmp3, this.x - this.size, this.y - this.size, 2 * this.size, 2 * this.size);
                ctx.restore();
              };
              if ((ha || 15 < this.size) && !a) {
                ctx.strokeStyle = '#000000';
                ctx.globalAlpha *= 0.1;
                ctx.stroke();
              };
              ctx.globalAlpha = 1;
              if (null != tmp3 && tmp2) {
                ctx.drawImage(tmp3, this.x - 2 * this.size, this.y - 2 * this.size, 4 * this.size, 4 * this.size);
              };
              tmp3 = -1 != myCells.indexOf(this);
              a = ~~this.y;
              if ((Z || tmp3) && this.name && this.nameCache) {
                d = this.nameCache;
                d.setValue(this.name);
                d.setSize(this.getNameSize());
                tmp2 = Math.ceil(10 * zoom) / 10;
                d.setScale(tmp2);
                d = d.render();
                f = ~~(d.width / tmp2);
                k = ~~(d.height / tmp2);
                ctx.drawImage(d, ~~this.x - ~~(f / 2), a - ~~(k / 2), f, k);
                a += d.height / 2 / tmp2 + 4;
              }
              if (wa && (tmp3 || 0 == myCells.length && (!this.isVirus || this.isAgitated) && 20 < this.size)) {
                if (null == this.sizeCache) {
                  this.sizeCache = new SizeCache(this.getNameSize() / 2, '#FFFFFF', true, '#000000');
                };
                tmp3 = this.sizeCache;
                tmp3.setSize(this.getNameSize() / 2);
                tmp3.setValue(~~(this.size * this.size / 100));
                tmp2 = Math.ceil(10 * zoom) / 10;
                tmp3.setScale(tmp2);
                d = tmp3.render();
                f = ~~(d.width / tmp2);
                k = ~~(d.height / tmp2);
                ctx.drawImage(d, ~~this.x - ~~(f / 2), a - ~~(k / 2), f, k);
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
          setSize: function setSize(a) {
            if (this._size != a) {
              this._size = a;
              this._dirty = true;
            };
          },
          setScale: function setScale(a) {
            if (this._scale != a) {
              this._scale = a;
              this._dirty = true;
            };
          },
          setColor: function setColor(a) {
            if (this._color != a) {
              this._color = a;
              this._dirty = true;
            };
          },
          setStroke: function setStroke(a) {
            if (this._stroke != a) {
              this._stroke = a;
              this._dirty = true;
            };
          },
          setStrokeColor: function setStrokeColor(a) {
            if (this._strokeColor != a) {
              this._strokeColor = a;
              this._dirty = true;
            };
          },
          setValue: function setValue(a) {
            if (a != this._value) {
              this._value = a;
              this._dirty = true;
            };
          },
          render: function render() {
            var a, b, c, d, e, f, g, h;
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
              e = this._size;
              f = e + 'px Ubuntu';
              b.font = f;
              h = b.measureText(c).width;
              g = ~~(0.2 * e);
              a.width = (h + 6) * d;
              a.height = (e + g) * d;
              b.font = f;
              b.scale(d, d);
              b.globalAlpha = 1;
              b.lineWidth = 3;
              b.strokeStyle = this._strokeColor;
              b.fillStyle = this._color;
              if (this._stroke) {
                b.strokeText(c, 3, e - g / 2);
              };
              b.fillText(c, 3, e - g / 2);
            }
            return this._canvas;
          }
        };
        window.onload = init;
      }
    }
  }
}(window, jQuery));
