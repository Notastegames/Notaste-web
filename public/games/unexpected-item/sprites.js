// Unexpected Item: everything that gets drawn, apart from the shop itself.
// The shopping (each item cached as a little bitmap), the loose fruit and its
// lookalikes, Bev the assistant, the queue on Christmas Eve, your hand, and
// the till's face, which is the most important face in the game.
//
// Outline first, flat fill, four inks only, halftone for shade (DESIGN.md,
// section 7). Coordinates are world units with the bottom centre at 0,0 and
// up negative. unexpected-item.js is the game.
(function () {
  "use strict";

  var T = null;          // colour tokens, set by init()
  var SCALE = 1;         // device pixels per world unit on the main canvas
  var cache = {};        // item bitmaps, per item and scale
  var tiles = {};        // halftone tiles
  var LW = 0.55;         // the outline on shopping: about 4% of its height

  function init(tokens, scale) {
    T = tokens;
    if (scale !== SCALE) cache = {};
    SCALE = scale;
  }
  function flush() { cache = {}; }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  // Halftone dots of one ink, `step` world units apart. `scale` is device
  // pixels per world unit for the context being drawn on.
  function dots(c, colour, step, scale) {
    var s = scale || SCALE;
    var n = Math.max(3, Math.round(step * s));
    var key = colour + "|" + n;
    var tile = tiles[key];
    if (!tile) {
      tile = document.createElement("canvas");
      tile.width = tile.height = n * 2;
      var x = tile.getContext("2d");
      x.fillStyle = colour;
      [[n / 2, n / 2], [n * 1.5, n * 1.5]].forEach(function (p) {
        x.beginPath();
        x.arc(p[0], p[1], n * 0.27, 0, Math.PI * 2);
        x.fill();
      });
      tiles[key] = tile;
    }
    var pat = c.createPattern(tile, "repeat");
    if (pat.setTransform && window.DOMMatrix) pat.setTransform(new DOMMatrix().scale(1 / s));
    return pat;
  }

  function ink(c, w, colour) {
    c.lineWidth = w;
    c.strokeStyle = colour || T.ink;
    c.lineJoin = "round";
    c.lineCap = "round";
  }
  function rr(x, y, w, h, r) {
    var p = new Path2D();
    if (p.roundRect) p.roundRect(x, y, w, h, r);
    else p.rect(x, y, w, h);
    return p;
  }
  function ell(x, y, rx, ry, rot) {
    var p = new Path2D();
    p.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2);
    return p;
  }
  // fill, then the ink outline on top
  function solid(c, path, fill, w) {
    c.fillStyle = fill;
    c.fill(path);
    ink(c, w == null ? LW : w, fill === T.ink ? T.paper : T.ink);
    c.stroke(path);
  }
  // halftone shade over part of a shape (area, clipped to the shape)
  function shade(c, path, area, step, colour) {
    c.save();
    c.clip(path);
    c.fillStyle = dots(c, colour || T.ink, step || 0.75);
    c.fill(area);
    c.restore();
  }
  function line(c, pts, w, colour) {
    c.beginPath();
    pts.forEach(function (p, i) { if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); });
    ink(c, w, colour);
    c.stroke();
  }

  // Text in the display font, at `size` world units. Drawn in device pixels
  // (small fonts under a big transform lose their spacing). opts: align,
  // base, colour, stroke (a width in world units), strokeColour, font.
  function text(c, str, x, y, size, opts) {
    opts = opts || {};
    var m = c.getTransform();
    var k = Math.hypot(m.a, m.b);
    var px = m.a * x + m.c * y + m.e, py = m.b * x + m.d * y + m.f;
    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.font = (size * k).toFixed(2) + "px " + (opts.font || T.display);
    c.textAlign = opts.align || "center";
    c.textBaseline = opts.base || "middle";
    var s = opts.upper === false ? str : str.toUpperCase();
    if (opts.stroke) {
      c.lineWidth = opts.stroke * k;
      c.lineJoin = "round";
      c.strokeStyle = opts.strokeColour || T.ink;
      c.strokeText(s, px, py);
    }
    c.fillStyle = opts.colour || T.ink;
    c.fillText(s, px, py);
    c.restore();
  }
  // how wide some display text is, in world units
  function measure(c, str, size) {
    var m = c.getTransform();
    var k = Math.hypot(m.a, m.b) || 1;
    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.font = (size * k).toFixed(2) + "px " + T.display;
    var w = c.measureText(str.toUpperCase()).width / k;
    c.restore();
    return w;
  }

  // A barcode: a paper patch with an ink edge and stripes. Seeded, so the
  // same item always has the same stripes.
  function barcode(c, cx, cy, w, h, seed) {
    c.fillStyle = T.paper;
    c.fillRect(cx - w / 2, cy - h / 2, w, h);
    ink(c, 0.28);
    c.strokeRect(cx - w / 2, cy - h / 2, w, h);
    c.fillStyle = T.ink;
    var x = cx - w / 2 + 0.38, end = cx + w / 2 - 0.38, r = seed;
    while (x < end) {
      var bw = [0.16, 0.3, 0.46, 0.22][r % 4];
      r = (r * 7 + 5) % 13;
      if (x + bw > end) break;
      c.fillRect(x, cy - h / 2 + 0.34, bw, h - 0.95);
      x += bw + [0.18, 0.3, 0.22][r % 3];
    }
  }

  // ---------------------------------------------------------------------------
  // The shopping. w and h in world units; bar is the barcode (x: its centre
  // as a share of the width from the left, y: its centre up from the bottom,
  // w: its width, which is how long it spends on the red line). Items lean
  // on the four inks; the names are what the till prints.
  // ---------------------------------------------------------------------------
  var ITEMS = {
    beans: { name: "Beans", w: 8, h: 9.6, bar: { x: 0.66, y: 4, w: 3.6 }, draw: function (c, w, h) {
      var body = rr(-w / 2, -h + 0.9, w, h - 0.9, 0.7);
      solid(c, body, T.paper);
      c.save(); c.clip(body);
      c.fillStyle = T.red; c.fillRect(-w / 2, -h + 2.3, w, h - 3.8);
      c.restore();
      shade(c, body, rr(w * 0.22, -h, w, h, 0));
      ink(c, LW); c.stroke(body);
      solid(c, ell(0, -h + 0.9, w / 2, 0.9), T.paper);
      solid(c, ell(-1.9, -h * 0.5, 1.5, 1.3), T.paper, 0.35);
      c.fillStyle = T.red;
      [[-2.4, -h * 0.5 - 0.2], [-1.5, -h * 0.5 + 0.35], [-1.6, -h * 0.5 - 0.6]].forEach(function (p) {
        c.beginPath(); c.ellipse(p[0], p[1], 0.42, 0.3, 0.4, 0, 7); c.fill();
      });
    } },
    milk: { name: "Milk", w: 8, h: 12, bar: { x: 0.62, y: 3.4, w: 3.6 }, draw: function (c, w, h) {
      var handle = new Path2D();
      handle.moveTo(-w / 2 + 0.6, -h + 5.2);
      handle.quadraticCurveTo(-w / 2 - 1.8, -h + 7, -w / 2 + 0.4, -h + 9);
      ink(c, 2.1); c.stroke(handle);
      ink(c, 0.9, T.paper); c.stroke(handle);
      var body = new Path2D();
      body.moveTo(-1.4, -h + 1.6);
      body.lineTo(1.4, -h + 1.6);
      body.quadraticCurveTo(w / 2, -h + 3.6, w / 2, -h + 6);
      body.lineTo(w / 2, -0.6);
      body.quadraticCurveTo(w / 2, 0, w / 2 - 0.6, 0);
      body.lineTo(-w / 2 + 0.6, 0);
      body.quadraticCurveTo(-w / 2, 0, -w / 2, -0.6);
      body.lineTo(-w / 2, -h + 6);
      body.quadraticCurveTo(-w / 2, -h + 3.6, -1.4, -h + 1.6);
      body.closePath();
      solid(c, body, T.paper);
      shade(c, body, rr(w * 0.2, -h, w, h, 0));
      ink(c, LW); c.stroke(body);
      solid(c, rr(-1.7, -h, 3.4, 1.8, 0.4), T.accent);
      c.fillStyle = T.accent;
      c.fillRect(-w / 2 + 0.3, -h + 7.2, w - 0.6, 1.1);
    } },
    bread: { name: "Bread", w: 14, h: 8, bar: { x: 0.24, y: 3, w: 3.8 }, draw: function (c, w, h) {
      var body = new Path2D();
      body.moveTo(-w / 2 + 1.6, 0);
      body.lineTo(w / 2 - 0.6, 0);
      body.quadraticCurveTo(w / 2 + 0.2, -h * 0.5, w / 2 - 1.4, -h + 0.8);
      body.quadraticCurveTo(0, -h - 1.2, -w / 2 + 2, -h + 0.6);
      body.quadraticCurveTo(-w / 2 + 0.6, -h * 0.5, -w / 2 + 1.6, 0);
      body.closePath();
      solid(c, body, T.paper);
      shade(c, body, ell(1, -1.2, w * 0.55, 3));
      ink(c, LW); c.stroke(body);
      [-2, 1.4, 4.6].forEach(function (x) { line(c, [[x - 1.2, -h + 1.2], [x + 0.8, -h + 2.8]], 0.4); });
      // the tie, and the end of the bag
      solid(c, rr(-w / 2 - 0.4, -h * 0.62, 2.4, 1.5, 0.4), T.red, 0.4);
      line(c, [[-w / 2 - 1.6, -h * 0.68], [-w / 2 - 0.4, -h * 0.55], [-w / 2 - 1.6, -h * 0.38]], 0.45);
    } },
    eggs: { name: "Eggs", w: 12, h: 6.6, bar: { x: 0.78, y: 2.2, w: 3.4 }, draw: function (c, w, h) {
      [-3.6, 0, 3.6].forEach(function (x) { solid(c, ell(x, -h + 2.2, 2, 1.9), T.paper, 0.45); });
      var body = rr(-w / 2, -h + 2.2, w, h - 2.2, 0.6);
      solid(c, body, T.paper);
      shade(c, body, rr(-w / 2, -2, w, 2, 0));
      ink(c, LW); c.stroke(body);
      solid(c, rr(-w / 2 + 0.9, -h + 3, 4.2, 2.1, 0.3), T.accent, 0.35);
    } },
    tea: { name: "Tea", w: 9, h: 10.5, bar: { x: 0.3, y: 2.3, w: 3.4 }, draw: function (c, w, h) {
      var body = rr(-w / 2, -h, w, h, 0.4);
      solid(c, body, T.red);
      solid(c, rr(-w / 2 + 1.2, -h + 1.4, w - 2.4, 4.6, 0.3), T.paper, 0.4);
      solid(c, rr(-1.6, -h + 2.4, 3, 2.6, 0.6), T.paper, 0.4);
      line(c, [[1.6, -h + 3], [2.3, -h + 3.6], [1.6, -h + 4.3]], 0.4);
      line(c, [[-0.6, -h + 2.1], [-0.2, -h + 1.6]], 0.3);
      ink(c, LW); c.stroke(body);
      line(c, [[-w / 2, -h + 0.9], [w / 2, -h + 0.9]], 0.35);
    } },
    jam: { name: "Jam", w: 7, h: 9, bar: { x: 0.5, y: 2.6, w: 3.4 }, draw: function (c, w, h) {
      var body = rr(-w / 2, -h + 2.4, w, h - 2.4, 1.4);
      solid(c, body, T.red);
      shade(c, body, rr(w * 0.15, -h, w, h, 0), 0.75, T.ink);
      ink(c, LW); c.stroke(body);
      var lid = rr(-w / 2 - 0.3, -h, w + 0.6, 2.6, 0.5);
      solid(c, lid, T.paper);
      c.save(); c.clip(lid);
      c.fillStyle = T.red;
      for (var x = -w / 2; x < w / 2 + 1; x += 1.6) { c.fillRect(x, -h, 0.8, 1.3); c.fillRect(x + 0.8, -h + 1.3, 0.8, 1.3); }
      c.restore();
      ink(c, LW); c.stroke(lid);
    } },
    loo: { name: "Loo roll", w: 12, h: 9.4, bar: { x: 0.72, y: 4.2, w: 3.4 }, draw: function (c, w, h) {
      [-3, 3].forEach(function (x) {
        var roll = rr(x - 3, -h + 1.2, 6, h - 1.2, 1.2);
        solid(c, roll, T.paper);
        shade(c, roll, rr(x + 1.2, -h, 2, h, 0));
        ink(c, LW); c.stroke(roll);
        solid(c, ell(x, -h + 1.2, 3, 1.1), T.paper, 0.45);
        solid(c, ell(x, -h + 1.2, 1, 0.45), T.ink, 0.2);
      });
      c.fillStyle = T.red;
      c.fillRect(-w / 2 + 0.2, -h * 0.58, w - 0.4, 2.6);
      ink(c, 0.4);
      c.strokeRect(-w / 2 + 0.2, -h * 0.58, w - 0.4, 2.6);
    } },
    cheese: { name: "Cheese", w: 10, h: 7, bar: { x: 0.34, y: 1.9, w: 3.4 }, draw: function (c, w, h) {
      var body = new Path2D();
      body.moveTo(-w / 2, 0); body.lineTo(w / 2, 0); body.lineTo(w / 2, -h + 2.4); body.lineTo(-w / 2, -h + 0.2); body.closePath();
      solid(c, body, T.paper);
      var top = new Path2D();
      top.moveTo(-w / 2, -h + 0.2); top.lineTo(w / 2, -h + 2.4); top.lineTo(w / 2 - 1.6, -h + 2.9); top.closePath();
      solid(c, top, T.paper, 0.4);
      c.save(); c.clip(body);
      [[1.6, -3.4, 1.1], [3.6, -1.6, 0.7], [-0.6, -4.8, 0.6]].forEach(function (o) {
        solid(c, ell(o[0], o[1], o[2], o[2] * 0.85), T.ink, 0.01);
      });
      c.restore();
      shade(c, body, rr(w * 0.2, -h, w, h, 0));
      ink(c, LW); c.stroke(body);
    } },
    cereal: { name: "Cereal", w: 9, h: 14, bar: { x: 0.7, y: 2.4, w: 3.4 }, draw: function (c, w, h) {
      var body = rr(-w / 2, -h, w, h, 0.4);
      solid(c, body, T.accent);
      shade(c, body, rr(w * 0.25, -h, w, h, 0));
      ink(c, LW); c.stroke(body);
      var bowl = new Path2D();
      bowl.moveTo(-3.2, -h * 0.62); bowl.lineTo(3.2, -h * 0.62); bowl.quadraticCurveTo(3, -h * 0.4, 0, -h * 0.4); bowl.quadraticCurveTo(-3, -h * 0.4, -3.2, -h * 0.62);
      solid(c, bowl, T.paper, 0.4);
      [[-1.8, -h * 0.66], [-0.2, -h * 0.68], [1.4, -h * 0.66], [0.6, -h * 0.72]].forEach(function (p) {
        solid(c, ell(p[0], p[1], 0.8, 0.55), T.red, 0.3);
      });
      solid(c, rr(-w / 2 + 1, -h + 1.2, w - 2, 2.4, 0.3), T.paper, 0.35);
    } },
    washing: { name: "Washing-up liquid", w: 6, h: 14, bar: { x: 0.5, y: 3, w: 3.4 }, draw: function (c, w, h) {
      solid(c, rr(-1, -h, 2, 2.6, 0.4), T.red, 0.4);
      var body = new Path2D();
      body.moveTo(-1.4, -h + 2.4);
      body.lineTo(1.4, -h + 2.4);
      body.quadraticCurveTo(w / 2, -h + 4, w / 2, -h + 6.4);
      body.lineTo(w / 2 - 0.5, 0);
      body.lineTo(-w / 2 + 0.5, 0);
      body.lineTo(-w / 2, -h + 6.4);
      body.quadraticCurveTo(-w / 2, -h + 4, -1.4, -h + 2.4);
      body.closePath();
      solid(c, body, T.accent);
      shade(c, body, rr(w * 0.18, -h, w, h, 0));
      ink(c, LW); c.stroke(body);
      [[-0.8, -h + 6.4, 0.7], [0.7, -h + 7.6, 0.5], [-0.3, -h + 8.6, 0.4]].forEach(function (b) {
        solid(c, ell(b[0], b[1], b[2], b[2]), T.paper, 0.25);
      });
    } },
    pasta: { name: "Pasta", w: 10, h: 9, bar: { x: 0.74, y: 2.5, w: 3.4 }, draw: function (c, w, h) {
      var body = new Path2D();
      body.moveTo(-w / 2 + 0.6, 0); body.lineTo(w / 2 - 0.6, 0); body.lineTo(w / 2, -h + 1.4);
      body.lineTo(w / 2 - 1, -h); body.lineTo(-w / 2 + 1, -h); body.lineTo(-w / 2, -h + 1.4); body.closePath();
      solid(c, body, T.paper);
      var win = rr(-w / 2 + 1.2, -h + 2.4, 4.6, 4.8, 0.8);
      solid(c, win, T.ink, 0.3);
      c.save(); c.clip(win);
      for (var i = 0; i < 4; i++) {
        var px = -w / 2 + 2.1 + (i % 2) * 2.3, py = -h + 3.6 + Math.floor(i / 2) * 2.4;
        c.beginPath(); c.arc(px, py, 0.8, 0, Math.PI * 1.6); ink(c, 0.45, T.paper); c.stroke();
      }
      c.restore();
      shade(c, body, rr(w * 0.25, -h, w, h, 0));
      ink(c, LW); c.stroke(body);
      line(c, [[-w / 2 + 0.6, -h + 1.2], [w / 2 - 0.6, -h + 1.2]], 0.3);
    } },
    crisps: { name: "Crisps", w: 10, h: 10, bar: { x: 0.3, y: 2.6, w: 3.4 }, draw: function (c, w, h) {
      var body = new Path2D();
      body.moveTo(-w / 2, -0.4);
      for (var i = 0; i <= 8; i++) body.lineTo(-w / 2 + i * w / 8, i % 2 ? 0 : -0.5);
      body.quadraticCurveTo(w / 2 + 0.8, -h / 2, w / 2, -h + 0.5);
      for (var j = 8; j >= 0; j--) body.lineTo(-w / 2 + j * w / 8, -h + (j % 2 ? 0 : 0.5));
      body.quadraticCurveTo(-w / 2 - 0.8, -h / 2, -w / 2, -0.4);
      body.closePath();
      solid(c, body, T.red);
      shade(c, body, rr(w * 0.2, -h, w, h, 0));
      ink(c, LW); c.stroke(body);
      solid(c, ell(1.2, -h * 0.56, 2.8, 2.2), T.paper, 0.4);
      solid(c, ell(1.2, -h * 0.56, 1.4, 1, 0.5), T.accent, 0.3);
    } },
    catfood: { name: "Cat food", w: 7, h: 5.6, bar: { x: 0.66, y: 2.6, w: 3.2 }, draw: function (c, w, h) {
      var body = rr(-w / 2, -h + 0.7, w, h - 0.7, 0.5);
      solid(c, body, T.accent);
      shade(c, body, rr(w * 0.2, -h, w, h, 0));
      ink(c, LW); c.stroke(body);
      solid(c, ell(0, -h + 0.7, w / 2, 0.7), T.paper, 0.4);
      var fish = new Path2D();
      fish.moveTo(-2.9, -2.6); fish.quadraticCurveTo(-1.8, -4, -0.6, -2.6); fish.quadraticCurveTo(-1.8, -1.3, -2.9, -2.6);
      fish.moveTo(-0.6, -2.6); fish.lineTo(0.2, -3.3); fish.lineTo(0.2, -1.9); fish.closePath();
      solid(c, fish, T.paper, 0.3);
    } },
    biscuits: { name: "Biscuits", w: 13, h: 5.4, bar: { x: 0.66, y: 2.7, w: 3.4 }, draw: function (c, w, h) {
      var body = rr(-w / 2, -h, w, h, h / 2);
      solid(c, body, T.paper);
      c.save(); c.clip(body);
      c.fillStyle = T.red; c.fillRect(-w / 2 + 2.2, -h, w - 4.4, h);
      c.restore();
      shade(c, body, rr(-w, -h * 0.4, w * 2, h, 0));
      ink(c, LW); c.stroke(body);
      [-w / 2 + 1.1, w / 2 - 1.1].forEach(function (x) { line(c, [[x, -h + 0.8], [x, -0.8]], 0.35); });
    } },
    rice: { name: "Rice", w: 11, h: 13, heavy: true, bar: { x: 0.3, y: 2.6, w: 3.6 }, draw: function (c, w, h) {
      var body = new Path2D();
      body.moveTo(-w / 2 + 0.4, 0); body.lineTo(w / 2 - 0.4, 0);
      body.quadraticCurveTo(w / 2 + 0.6, -h * 0.5, w / 2 - 0.8, -h + 1.6);
      body.lineTo(w / 2 - 1.6, -h); body.lineTo(-w / 2 + 1.6, -h); body.lineTo(-w / 2 + 0.8, -h + 1.6);
      body.quadraticCurveTo(-w / 2 - 0.6, -h * 0.5, -w / 2 + 0.4, 0);
      body.closePath();
      solid(c, body, T.paper);
      c.save(); c.clip(body); c.fillStyle = T.accent; c.fillRect(-w / 2, -h * 0.62, w, 3.2); c.restore();
      shade(c, body, ell(w * 0.42, -h * 0.5, w * 0.3, h * 0.6));
      ink(c, LW); c.stroke(body);
      line(c, [[-w / 2 + 1.4, -h + 1.4], [w / 2 - 1.4, -h + 1.4]], 0.4);
      [[-1, -h * 0.5 - 0.2], [0.6, -h * 0.5 + 0.3], [2, -h * 0.5 - 0.4]].forEach(function (p) {
        solid(c, ell(p[0], p[1], 0.5, 0.28, 0.6), T.paper, 0.2);
      });
    } },
    bleach: { name: "Bleach", w: 8, h: 13, heavy: true, bar: { x: 0.64, y: 3, w: 3.6 }, draw: function (c, w, h) {
      solid(c, rr(-3, -h, 2.6, 2.4, 0.3), T.red, 0.4);
      var body = new Path2D();
      body.moveTo(-3.4, -h + 2.2); body.lineTo(-0.2, -h + 2.2); body.lineTo(w / 2, -h + 4.6);
      body.lineTo(w / 2, -0.4); body.lineTo(-w / 2, -0.4); body.lineTo(-w / 2, -h + 4);
      body.closePath();
      solid(c, body, T.paper);
      shade(c, body, rr(w * 0.2, -h, w, h, 0));
      ink(c, LW); c.stroke(body);
      var hole = rr(0.6, -h + 4.2, 2.4, 2.6, 1);
      solid(c, hole, T.ink, 0.3);
      // a hazard diamond, of sorts
      var d = new Path2D();
      d.moveTo(-1.6, -h * 0.55 - 1.6); d.lineTo(0, -h * 0.55); d.lineTo(-1.6, -h * 0.55 + 1.6); d.lineTo(-3.2, -h * 0.55); d.closePath();
      solid(c, d, T.red, 0.35);
    } },
    wine: { name: "Cooking wine", w: 5, h: 15, age: true, bar: { x: 0.5, y: 3.4, w: 3.4 }, draw: function (c, w, h) {
      var body = new Path2D();
      body.moveTo(-0.9, -h); body.lineTo(0.9, -h); body.lineTo(0.9, -h + 4.4);
      body.quadraticCurveTo(w / 2, -h + 5.6, w / 2, -h + 7.6);
      body.lineTo(w / 2, -0.5); body.quadraticCurveTo(w / 2, 0, w / 2 - 0.5, 0);
      body.lineTo(-w / 2 + 0.5, 0); body.quadraticCurveTo(-w / 2, 0, -w / 2, -0.5);
      body.lineTo(-w / 2, -h + 7.6); body.quadraticCurveTo(-w / 2, -h + 5.6, -0.9, -h + 4.4);
      body.closePath();
      solid(c, body, T.ink);
      solid(c, rr(-1.1, -h - 0.2, 2.2, 3, 0.3), T.red, 0.35);
      solid(c, rr(-w / 2 + 0.3, -h + 8.2, w - 0.6, 5.4, 0.3), T.paper, 0.35);
      line(c, [[-w / 2 + 0.6, -h + 7.4], [-w / 2 + 0.6, -h + 5.4]], 0.5, T.paper);
    } },
    scissors: { name: "Scissors", w: 9, h: 12, age: true, bar: { x: 0.5, y: 2, w: 3.6 }, draw: function (c, w, h) {
      var card = rr(-w / 2, -h, w, h, 0.5);
      solid(c, card, T.paper);
      shade(c, card, rr(-w / 2, -3.4, w, 3.4, 0));
      ink(c, LW); c.stroke(card);
      solid(c, ell(0, -h + 1.1, 1.1, 0.6), T.ink, 0.2);
      // the scissors, behind a plastic bubble
      line(c, [[-0.4, -h + 2.8], [1.4, -4.6]], 0.9);
      line(c, [[0.4, -h + 2.8], [-1.4, -4.6]], 0.9);
      solid(c, ell(-1.8, -4, 1.3, 1.4), T.red, 0.4);
      solid(c, ell(1.8, -4, 1.3, 1.4), T.red, 0.4);
      solid(c, ell(-1.8, -4, 0.5, 0.6), T.paper, 0.2);
      solid(c, ell(1.8, -4, 0.5, 0.6), T.paper, 0.2);
      var bubble = rr(-w / 2 + 1, -h + 2, w - 2, h - 5.4, 1.6);
      ink(c, 0.4); c.stroke(bubble);
      line(c, [[-w / 2 + 2, -h + 3.2], [-w / 2 + 2, -h + 5.2]], 0.4);
    } },
    candle: { name: "Large candle", w: 9, h: 13, age: true, bar: { x: 0.62, y: 4.4, w: 3.6 }, draw: function (c, w, h) {
      line(c, [[0, -h + 2.4], [0.4, -h + 0.2]], 0.6);
      var body = rr(-w / 2, -h + 2.2, w, h - 2.2, 0.8);
      solid(c, body, T.paper);
      shade(c, body, rr(w * 0.18, -h, w, h, 0));
      ink(c, LW); c.stroke(body);
      solid(c, ell(0, -h + 2.2, w / 2, 0.8), T.paper, 0.4);
      // drips
      var drip = new Path2D();
      drip.moveTo(-3.6, -h + 2.6); drip.quadraticCurveTo(-3.3, -h + 4.6, -2.8, -h + 2.8); drip.closePath();
      solid(c, drip, T.paper, 0.3);
      c.fillStyle = T.accent;
      c.fillRect(-w / 2 + 0.3, -h * 0.5 - 1.2, w - 0.6, 3.6);
      ink(c, 0.35); c.strokeRect(-w / 2 + 0.3, -h * 0.5 - 1.2, w - 0.6, 3.6);
    } },
    turkey: { name: "Turkey", w: 16, h: 10, heavy: true, bar: { x: 0.74, y: 1.3, w: 3.8 }, draw: function (c, w, h) {
      [-1, 1].forEach(function (s) {
        var leg = new Path2D();
        leg.moveTo(s * 3.4, -5.6); leg.quadraticCurveTo(s * 7.6, -9.4, s * 6.8, -h + 0.2);
        ink(c, 2.6); c.stroke(leg);
        ink(c, 1.4, T.paper); c.stroke(leg);
        solid(c, ell(s * 6.9, -h + 0.4, 1, 0.9), T.paper, 0.35);
      });
      var body = new Path2D();
      body.moveTo(-w / 2 + 1.4, -2.4);
      body.bezierCurveTo(-w / 2, -9.4, w / 2, -9.4, w / 2 - 1.4, -2.4);
      body.closePath();
      solid(c, body, T.paper);
      shade(c, body, ell(3.6, -3.6, 5, 3));
      ink(c, LW); c.stroke(body);
      line(c, [[-2.6, -6.2], [-0.6, -7.4]], 0.4);
      var tray = rr(-w / 2, -2.6, w, 2.6, 0.5);
      solid(c, tray, T.accent);
      solid(c, rr(-w / 2 + 1, -2.2, 4, 1.8, 0.2), T.paper, 0.3);
    } },
    crackers: { name: "Crackers", w: 15, h: 6, age: true, bar: { x: 0.8, y: 2.8, w: 3.4 }, draw: function (c, w, h) {
      var body = rr(-w / 2, -h, w, h, 0.4);
      solid(c, body, T.red);
      shade(c, body, rr(-w / 2, -2, w, 2, 0));
      ink(c, LW); c.stroke(body);
      var cr = new Path2D();
      cr.moveTo(-5.6, -h + 1.6); cr.lineTo(-4, -h + 2.4); cr.lineTo(1, -h + 2.4); cr.lineTo(2.6, -h + 1.6);
      cr.lineTo(2.6, -1.6); cr.lineTo(1, -2.4); cr.lineTo(-4, -2.4); cr.lineTo(-5.6, -1.6); cr.closePath();
      solid(c, cr, T.paper, 0.4);
      c.fillStyle = T.accent; c.fillRect(-2.6, -h + 2.4, 1.6, 1.2);
      ink(c, 0.3); c.strokeRect(-2.6, -h + 2.4, 1.6, 1.2);
    } },
    pies: { name: "Mince pies", w: 10, h: 5, bar: { x: 0.74, y: 2.4, w: 3.2 }, draw: function (c, w, h) {
      var body = rr(-w / 2, -h, w, h, 0.4);
      solid(c, body, T.paper);
      var win = rr(-w / 2 + 0.8, -h + 0.9, 4.6, h - 1.8, 0.4);
      solid(c, win, T.ink, 0.3);
      [-w / 2 + 2, -w / 2 + 4.2].forEach(function (x) {
        solid(c, ell(x, -h / 2, 1, 0.9), T.paper, 0.25);
        solid(c, ell(x, -h / 2, 0.35, 0.35), T.red, 0.1);
      });
      shade(c, body, rr(w * 0.2, -h, w, h, 0));
      ink(c, LW); c.stroke(body);
    } },
    wrap: { name: "Wrapping paper", w: 22, h: 4.4, bar: { x: 0.12, y: 2.2, w: 3.4 }, draw: function (c, w, h) {
      var body = rr(-w / 2, -h, w, h, 0.6);
      solid(c, body, T.red);
      c.save(); c.clip(body);
      ink(c, 0.6, T.paper);
      for (var x = -w / 2 + 2; x < w / 2 + 2; x += 3.2) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x - 2, -h); c.stroke(); }
      c.restore();
      ink(c, LW); c.stroke(body);
      solid(c, ell(w / 2, -h / 2, 0.8, h / 2), T.red, 0.4);
      solid(c, ell(w / 2, -h / 2, 0.3, 0.7), T.ink, 0.1);
    } },
    choc: { name: "Chocolates", w: 10, h: 9, bar: { x: 0.28, y: 2.8, w: 3.4 }, draw: function (c, w, h) {
      var body = new Path2D();
      body.moveTo(-w / 2 + 0.6, 0); body.lineTo(w / 2 - 0.6, 0); body.lineTo(w / 2, -h + 2);
      body.lineTo(-w / 2, -h + 2); body.closePath();
      solid(c, body, T.accent);
      shade(c, body, rr(w * 0.2, -h, w, h, 0));
      ink(c, LW); c.stroke(body);
      solid(c, rr(-w / 2 - 0.3, -h, w + 0.6, 2.2, 0.6), T.paper);
      // a ribbon bow on the lid
      solid(c, ell(1.6, -h * 0.5, 1.4, 1.1), T.red, 0.35);
      solid(c, ell(3.6, -h * 0.5, 1.4, 1.1), T.red, 0.35);
      solid(c, ell(2.6, -h * 0.5, 0.6, 0.6), T.paper, 0.3);
    } },
    tape: { name: "Sticky tape", w: 7, h: 9, bar: { x: 0.5, y: 2, w: 3 }, draw: function (c, w, h) {
      // a roll on a card, small and easy to miss
      var card = rr(-w / 2, -h, w, h, 0.5);
      solid(c, card, T.red);
      solid(c, ell(0, -h + 1, 0.8, 0.45), T.ink, 0.2);
      var roll = ell(0, -h + 4.6, 2.6, 2.6);
      solid(c, roll, T.paper, 0.45);
      shade(c, roll, ell(1.2, -h + 5.6, 1.6, 1.6));
      ink(c, 0.45); c.stroke(roll);
      solid(c, ell(0, -h + 4.6, 1.1, 1.1), T.red, 0.35);
    } },
    baguette: { name: "Baguette", w: 20, h: 4.6, bar: { x: 0.82, y: 2.2, w: 3.4 }, draw: function (c, w, h) {
      var body = rr(-w / 2, -h, w, h, h / 2);
      solid(c, body, T.paper);
      shade(c, body, rr(-w, -h * 0.45, w * 2, h, 0));
      ink(c, LW); c.stroke(body);
      [-6, -2, 2].forEach(function (x) { line(c, [[x - 1.2, -h + 1.2], [x + 1.2, -h + 2.4]], 0.4); });
      var sleeve = rr(w / 2 - 7, -h - 0.3, 6.4, h + 0.6, 0.4);
      solid(c, sleeve, T.paper);
      c.fillStyle = T.red; c.fillRect(w / 2 - 6.6, -h + 0.2, 5.6, 0.7);
    } }
  };

  // Loose fruit and veg: no barcode. Each one belongs to a set of four
  // lookalikes, and the till asks which it is. Drawn in a box about 10 units
  // across, sitting on 0,0.
  var FRUIT = {
    lime: { name: "Lime", draw: function (c) { limeBody(c); } },
    lemon: { name: "Lemon", draw: function (c) {
      var p = new Path2D();
      p.moveTo(-5.4, -4); p.quadraticCurveTo(-4.6, -8.2, 0, -8.2); p.quadraticCurveTo(4.6, -8.2, 5.4, -4);
      p.quadraticCurveTo(4.6, 0.2, 0, 0.2); p.quadraticCurveTo(-4.6, 0.2, -5.4, -4); p.closePath();
      solid(c, p, T.paper, 0.6);
      shade(c, p, ell(2.6, -1.4, 4, 2.6));
      ink(c, 0.6); c.stroke(p);
      c.fillStyle = T.ink;
      [[-2, -5.6], [0.6, -6.4], [2.4, -4.6], [-0.6, -3.8]].forEach(function (d) { c.beginPath(); c.arc(d[0], d[1], 0.28, 0, 7); c.fill(); });
    } },
    limeLeaf: { name: "Lime, organic", draw: function (c) {
      limeBody(c);
      line(c, [[0.2, -8.2], [0.8, -9.6]], 0.6);
      var leaf = new Path2D();
      leaf.moveTo(0.8, -9.4); leaf.quadraticCurveTo(3.4, -12.4, 5.6, -10.6); leaf.quadraticCurveTo(3.6, -8.2, 0.8, -9.4); leaf.closePath();
      solid(c, leaf, T.accent, 0.5);
      line(c, [[1.4, -9.5], [4.6, -10.5]], 0.3, T.paper);
    } },
    limeSad: { name: "Lime, sad", draw: function (c) {
      limeBody(c, true);
      c.fillStyle = T.ink;
      [[-1.6, -4.8], [1.4, -4.8]].forEach(function (e) { c.beginPath(); c.ellipse(e[0], e[1], 0.55, 0.75, 0, 0, 7); c.fill(); });
      c.beginPath(); c.arc(-0.1, -1.7, 1.4, Math.PI * 1.15, Math.PI * 1.85); ink(c, 0.45); c.stroke();
      line(c, [[-2.6, -6.3], [-0.9, -5.9]], 0.4);
      line(c, [[2.4, -6.3], [0.7, -5.9]], 0.4);
    } },
    onion: { name: "Onion", draw: function (c) { onionBody(c, T.paper, false); } },
    redOnion: { name: "Red onion", draw: function (c) { onionBody(c, T.red, false); } },
    shallot: { name: "Shallot", draw: function (c) {
      var p = new Path2D();
      p.moveTo(0, -10); p.quadraticCurveTo(0.6, -7.6, 2.8, -5.6); p.quadraticCurveTo(4.4, -3.4, 2.4, -0.6);
      p.quadraticCurveTo(0, 0.6, -2.4, -0.6); p.quadraticCurveTo(-4.4, -3.4, -2.8, -5.6); p.quadraticCurveTo(-0.6, -7.6, 0, -10); p.closePath();
      solid(c, p, T.paper, 0.6);
      shade(c, p, ell(2, -2.6, 2.4, 3.4));
      ink(c, 0.6); c.stroke(p);
      line(c, [[0, -9], [0.8, -4.6], [0.4, -0.8]], 0.35);
      roots(c, 0, 0);
    } },
    garlic: { name: "Garlic", draw: function (c) {
      var p = new Path2D();
      p.moveTo(0, -9.6); p.quadraticCurveTo(0.6, -7.4, 3.2, -6.4); p.quadraticCurveTo(5.6, -5, 4.6, -1.8);
      p.quadraticCurveTo(3.6, 0.2, 0, 0); p.quadraticCurveTo(-3.6, 0.2, -4.6, -1.8);
      p.quadraticCurveTo(-5.6, -5, -3.2, -6.4); p.quadraticCurveTo(-0.6, -7.4, 0, -9.6); p.closePath();
      solid(c, p, T.paper, 0.6);
      shade(c, p, ell(3.4, -2.4, 2.4, 3));
      ink(c, 0.6); c.stroke(p);
      [-2.2, 0, 2.2].forEach(function (x) {
        c.beginPath(); c.moveTo(x * 0.3, -7.6); c.quadraticCurveTo(x * 1.3, -3.6, x, -0.4); ink(c, 0.4); c.stroke();
      });
      roots(c, 0, 0);
    } },
    apple: { name: "Apple", draw: function (c) { appleBody(c, T.red, false); } },
    greenApple: { name: "Green apple", draw: function (c) { appleBody(c, T.accent, false); } },
    bittenApple: { name: "Apple, bitten", draw: function (c) { appleBody(c, T.red, true); } },
    tomato: { name: "Tomato", draw: function (c) {
      var p = ell(0, -4.2, 5, 4.2);
      solid(c, p, T.red, 0.6);
      shade(c, p, ell(3, -1.6, 3.6, 2.6));
      ink(c, 0.6); c.stroke(p);
      var star = new Path2D();
      for (var i = 0; i < 10; i++) {
        var a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.9 : 2.8;
        var x = Math.cos(a) * r, y = -8 + Math.sin(a) * r * 0.55;
        if (i) star.lineTo(x, y); else star.moveTo(x, y);
      }
      star.closePath();
      solid(c, star, T.accent, 0.4);
      solid(c, ell(-2.2, -6, 0.9, 0.6, -0.5), T.paper, 0.01);
    } },
    potato: { name: "Potato", draw: function (c) {
      var p = new Path2D();
      p.moveTo(-5.2, -3); p.quadraticCurveTo(-5, -6.6, -1, -6.6); p.quadraticCurveTo(2, -7.2, 4.6, -5.6);
      p.quadraticCurveTo(6.2, -3.4, 4.4, -0.8); p.quadraticCurveTo(1, 0.6, -2.4, -0.2); p.quadraticCurveTo(-5.4, -0.8, -5.2, -3); p.closePath();
      solid(c, p, T.paper, 0.6);
      shade(c, p, ell(2.4, -1.4, 4, 2.4));
      ink(c, 0.6); c.stroke(p);
      [[-2.6, -4.6], [0.8, -3.2], [2.6, -5]].forEach(function (e) {
        c.beginPath(); c.arc(e[0], e[1], 0.55, Math.PI, Math.PI * 1.9); ink(c, 0.4); c.stroke();
      });
    } },
    sweetPotato: { name: "Sweet potato", draw: function (c) {
      var p = new Path2D();
      p.moveTo(-6, -2.6); p.quadraticCurveTo(-3, -6.4, 2, -5.8); p.quadraticCurveTo(5.4, -5, 6, -2.6);
      p.quadraticCurveTo(4.4, -0.2, 0, -0.4); p.quadraticCurveTo(-4.4, -0.6, -6, -2.6); p.closePath();
      solid(c, p, T.red, 0.6);
      shade(c, p, ell(2.4, -1, 4, 1.8));
      ink(c, 0.6); c.stroke(p);
      line(c, [[-2.4, -4.6], [-1.8, -3.4]], 0.35);
      line(c, [[1.4, -5], [2, -3.8]], 0.35);
      line(c, [[-6, -2.6], [-7.2, -2.2]], 0.45);
    } },
    newPotatoes: { name: "New potatoes", draw: function (c) {
      [[-2.8, -2.4, 2.4], [2.6, -2.2, 2.2], [0, -5.4, 2.3]].forEach(function (o) {
        var p = ell(o[0], o[1], o[2], o[2] * 0.9);
        solid(c, p, T.paper, 0.55);
        shade(c, p, ell(o[0] + 1.2, o[1] + 1, o[2] * 0.8, o[2] * 0.6));
        ink(c, 0.55); c.stroke(p);
      });
    } },
    stone: { name: "Stone", draw: function (c) {
      var p = ell(0, -3.4, 5, 3.4);
      solid(c, p, T.paper, 0.6);
      c.fillStyle = dots(c, T.ink, 0.6);
      c.fill(p);
      shade(c, p, ell(2.4, -1.2, 3.6, 2.2), 0.45);
      ink(c, 0.6); c.stroke(p);
      line(c, [[-1.6, -6.4], [-0.8, -4.8], [0.2, -4.4]], 0.4);
    } },
    banana: { name: "Banana", draw: function (c) { bananaBody(c, T.paper, 0, false); } },
    greenBanana: { name: "Banana, green", draw: function (c) { bananaBody(c, T.accent, 0, false); } },
    bananas: { name: "Bananas", draw: function (c) {
      // a bunch: three fanned out from one stalk
      [-0.42, 0, 0.42].forEach(function (a) {
        c.save();
        c.translate(-5.6, -8.4);
        c.rotate(a);
        c.scale(0.82, 0.82);
        c.translate(6.4, 8.8);
        bananaBody(c, T.paper, 0, false);
        c.restore();
      });
    } },
    plantain: { name: "Plantain", draw: function (c) { bananaBody(c, T.paper, 0, true); } },
    sprout: { name: "Sprout", draw: function (c) { sproutBody(c, 0, 0, 1); } },
    cabbage: { name: "Small cabbage", draw: function (c) {
      var p = new Path2D();
      for (var i = 0; i <= 12; i++) {
        var a = Math.PI + i * Math.PI / 12, r = i % 2 ? 6.2 : 5.4;
        var x = Math.cos(a) * r, y = -4.6 + Math.sin(a) * r * 0.8;
        if (i) p.lineTo(x, y); else p.moveTo(x, y);
      }
      p.quadraticCurveTo(5, 0.4, 0, 0.4); p.quadraticCurveTo(-5, 0.4, -6.2, -4.6);
      p.closePath();
      solid(c, p, T.accent, 0.6);
      shade(c, p, ell(3.4, -1.4, 3.6, 2.4));
      ink(c, 0.6); c.stroke(p);
      sproutBody(c, 0, -0.6, 0.72);
    } },
    sproutNervous: { name: "Sprout, nervous", draw: function (c) {
      sproutBody(c, 0, 0, 1, true);
      [[-1.5, -5], [1.5, -5]].forEach(function (e) {
        solid(c, ell(e[0], e[1], 0.95, 1.2), T.paper, 0.35);
        c.fillStyle = T.ink; c.beginPath(); c.arc(e[0] + 0.25, e[1] - 0.2, 0.42, 0, 7); c.fill();
      });
      line(c, [[-2.4, -6.9], [-0.8, -7.4]], 0.4);
      line(c, [[2.4, -6.9], [0.8, -7.4]], 0.4);
      solid(c, ell(0, -2.6, 0.7, 0.45), T.ink, 0.1);
      var drop = new Path2D();
      drop.moveTo(4.4, -8.4); drop.quadraticCurveTo(5.6, -6.4, 4.4, -6); drop.quadraticCurveTo(3.2, -6.4, 4.4, -8.4); drop.closePath();
      solid(c, drop, T.paper, 0.35);
    } },
    sprouts: { name: "Sprouts, three", draw: function (c) {
      sproutBody(c, -2.8, 0, 0.62);
      sproutBody(c, 2.8, 0, 0.62);
      sproutBody(c, 0, -3.8, 0.62);
    } }
  };

  function limeBody(c, plain) {
    var p = ell(0, -4.2, 4.4, 4.1);
    solid(c, p, T.accent, 0.6);
    shade(c, p, ell(2.6, -1.6, 3.4, 2.4));
    ink(c, 0.6); c.stroke(p);
    solid(c, ell(4.5, -4.2, 0.7, 0.5), T.accent, 0.4);
    if (!plain) {
      c.fillStyle = T.ink;
      [[-1.8, -6], [-0.4, -2.6], [1.6, -5.2]].forEach(function (d) { c.beginPath(); c.arc(d[0], d[1], 0.26, 0, 7); c.fill(); });
    }
    c.beginPath(); c.arc(-1.4, -5.6, 1.6, Math.PI * 1.05, Math.PI * 1.45); ink(c, 0.5, T.paper); c.stroke();
  }
  function roots(c, x, y) {
    [-0.8, 0, 0.8].forEach(function (d) { line(c, [[x + d * 0.6, y - 0.2], [x + d, y + 0.8]], 0.3); });
  }
  function onionBody(c, fill) {
    var p = new Path2D();
    p.moveTo(0, -10.4); p.quadraticCurveTo(0.4, -8, 3.4, -6.8); p.quadraticCurveTo(5.8, -5, 4.4, -1.8);
    p.quadraticCurveTo(3, 0.2, 0, 0); p.quadraticCurveTo(-3, 0.2, -4.4, -1.8);
    p.quadraticCurveTo(-5.8, -5, -3.4, -6.8); p.quadraticCurveTo(-0.4, -8, 0, -10.4); p.closePath();
    solid(c, p, fill, 0.6);
    shade(c, p, ell(3.2, -2.2, 2.6, 3.2));
    ink(c, 0.6); c.stroke(p);
    var lines = fill === T.ink ? T.paper : (fill === T.red ? T.paper : T.ink);
    [-2.4, 2.4].forEach(function (x) {
      c.beginPath(); c.moveTo(x * 0.2, -8.6); c.quadraticCurveTo(x * 1.5, -4.2, x * 0.7, -0.6); ink(c, 0.35, lines); c.stroke();
    });
    roots(c, 0, 0);
  }
  function appleBody(c, fill, bitten) {
    var p = new Path2D();
    p.moveTo(0, -7.6);
    p.bezierCurveTo(2.6, -9.6, 5.8, -7.6, 5, -3.8);
    p.bezierCurveTo(4.4, -0.6, 2, 0.2, 0, -0.4);
    p.bezierCurveTo(-2, 0.2, -4.4, -0.6, -5, -3.8);
    p.bezierCurveTo(-5.8, -7.6, -2.6, -9.6, 0, -7.6);
    p.closePath();
    // a bite out of the right-hand side, if someone's had a go at it
    var bites = bitten ? [[5.6, -6.2, 2.1], [4.9, -3.6, 2.2], [5.4, -1.1, 1.9]] : [];
    c.save();
    bites.forEach(function (b) {
      var keep = new Path2D();
      keep.rect(-20, -20, 40, 40);
      keep.arc(b[0], b[1], b[2], 0, Math.PI * 2);
      c.clip(keep, "evenodd");
    });
    solid(c, p, fill, 0.6);
    shade(c, p, ell(3, -1.6, 3.4, 2.4));
    ink(c, 0.6); c.stroke(p);
    c.restore();
    if (bitten) {
      // the flesh shows, scalloped by teeth
      c.save();
      c.clip(p);
      c.fillStyle = T.paper;
      bites.forEach(function (b) { c.beginPath(); c.arc(b[0], b[1], b[2], 0, Math.PI * 2); c.fill(); });
      ink(c, 0.55);
      bites.forEach(function (b) { c.beginPath(); c.arc(b[0], b[1], b[2], 0, Math.PI * 2); c.stroke(); });
      c.restore();
      c.fillStyle = T.ink;
      c.beginPath(); c.ellipse(2.1, -4.6, 0.32, 0.55, 0.3, 0, 7); c.fill();
      c.beginPath(); c.ellipse(2.4, -2.6, 0.3, 0.5, 0.3, 0, 7); c.fill();
    } else {
      solid(c, ell(-2.6, -5.8, 0.9, 0.6, -0.6), T.paper, 0.01);
    }
    line(c, [[0, -7.4], [0.6, -9.8]], 0.6);
    var leaf = new Path2D();
    leaf.moveTo(0.7, -9); leaf.quadraticCurveTo(2.6, -11, 4, -9.6); leaf.quadraticCurveTo(2.4, -8.4, 0.7, -9); leaf.closePath();
    solid(c, leaf, T.accent, 0.4);
  }
  // a banana: a fat crescent, stalk at the top left
  function bananaBody(c, fill, dx, spotty) {
    c.save();
    c.translate(dx, 0);
    var p = new Path2D();
    p.moveTo(-5.2, -8.2);
    p.quadraticCurveTo(-3.4, -3.6, 1.6, -3.7);
    p.quadraticCurveTo(4.6, -3.9, 6.4, -5.8);
    p.quadraticCurveTo(6, -0.4, 0.8, 0);
    p.quadraticCurveTo(-6.6, 0.2, -7.6, -7.6);
    p.closePath();
    solid(c, p, fill, 0.6);
    if (spotty) {
      c.save(); c.clip(p);
      c.fillStyle = dots(c, T.ink, 0.7);
      c.fill(p);
      c.restore();
      c.fillStyle = T.ink;
      [[-4.2, -3.8], [-0.6, -1.6], [2.8, -2.2]].forEach(function (d) { c.beginPath(); c.arc(d[0], d[1], 0.6, 0, 7); c.fill(); });
    } else {
      shade(c, p, ell(0, 0.6, 6.4, 1.8));
      c.beginPath(); c.moveTo(-5.6, -6.4); c.quadraticCurveTo(-3.6, -1.8, 1.8, -1.8); ink(c, 0.35); c.stroke();
    }
    ink(c, 0.6); c.stroke(p);
    solid(c, rr(-7.9, -9.6, 2.2, 2, 0.4), T.ink, 0.35);
    solid(c, ell(6.5, -5.7, 0.5, 0.5), T.ink, 0.2);
    c.restore();
  }
  function sproutBody(c, x, y, k, plain) {
    c.save();
    c.translate(x, y);
    c.scale(k, k);
    var p = ell(0, -4.4, 4.4, 4.4);
    solid(c, p, T.accent, 0.6 / Math.max(0.7, k));
    shade(c, p, ell(2.8, -1.6, 3, 2.4));
    ink(c, 0.6 / Math.max(0.7, k)); c.stroke(p);
    if (!plain) {
      [[-3.4, -6.4, -0.2, -1.2], [3.4, -6.4, 0.2, -1.2], [-2.2, -8, 1.4, -3.6]].forEach(function (l) {
        c.beginPath(); c.moveTo(l[0], l[1]); c.quadraticCurveTo((l[0] + l[2]) / 2 + (l[0] < 0 ? -0.6 : 0.6), (l[1] + l[3]) / 2, l[2], l[3]);
        ink(c, 0.4); c.stroke();
      });
    }
    solid(c, rr(-0.8, -0.6, 1.6, 1.2, 0.3), T.paper, 0.35);
    c.restore();
  }

  // ---------------------------------------------------------------------------
  // Cached bitmaps of the shopping, drawn once per size
  // ---------------------------------------------------------------------------
  var PAD = 2.2;
  var SEEDS = {};
  function seedOf(id) {
    if (SEEDS[id]) return SEEDS[id];
    var s = 3;
    for (var i = 0; i < id.length; i++) s = (s * 31 + id.charCodeAt(i)) % 97;
    return (SEEDS[id] = s + 1);
  }

  // id: an item, or "fruit:<kind>" for loose fruit
  // k: how big it'll be drawn, so the bitmap is sharp at that size
  function sprite(id, k) {
    var q = Math.max(0.5, Math.round((k || 1) * 4) / 4);
    var key = id + "@" + SCALE + "x" + q;
    if (cache[key]) return cache[key];
    var keep = SCALE;
    SCALE = SCALE * q;
    var fruit = id.indexOf("fruit:") === 0 ? FRUIT[id.slice(6)] : null;
    var def = fruit ? null : ITEMS[id];
    var w = fruit ? 13 : def.w, h = fruit ? 12.5 : def.h;
    var cv = document.createElement("canvas");
    cv.width = Math.ceil((w + PAD * 2) * SCALE);
    cv.height = Math.ceil((h + PAD * 2) * SCALE);
    var c = cv.getContext("2d");
    c.scale(SCALE, SCALE);
    c.translate(w / 2 + PAD, h + PAD);
    paint(c, id);
    SCALE = keep;
    return (cache[key] = { img: cv, w: w + PAD * 2, h: h + PAD * 2, ox: w / 2 + PAD, oy: h + PAD });
  }

  // an item, drawn straight onto a context with its bottom centre at 0,0
  // (the bitmaps above, and the cover art, are made with this)
  function paint(c, id) {
    if (id.indexOf("fruit:") === 0) {
      c.scale(0.8, 0.8);
      FRUIT[id.slice(6)].draw(c);
      return;
    }
    var def = ITEMS[id];
    def.draw(c, def.w, def.h);
    if (def.bar) barcode(c, -def.w / 2 + def.bar.x * def.w, -def.bar.y, def.bar.w, 3, seedOf(id));
  }

  // draw an item with its bottom centre at x, y (world units), at size k
  function drawItem(c, id, x, y, k, rot) {
    k = k || 1;
    var s = sprite(id, k);
    if (rot) {
      c.save();
      c.translate(x, y - s.oy * k * 0.4);
      c.rotate(rot);
      c.drawImage(s.img, -s.ox * k, -s.oy * k * 0.6, s.w * k, s.h * k);
      c.restore();
      return;
    }
    c.drawImage(s.img, x - s.ox * k, y - s.oy * k, s.w * k, s.h * k);
  }

  // a piece of fruit drawn straight onto a context: centre x, bottom y, at
  // `size` units of the context's own (for the look-up tiles, in CSS pixels)
  function drawFruit(c, kind, x, y, size, scale) {
    var keep = SCALE;
    SCALE = scale || SCALE;
    c.save();
    c.translate(x, y);
    c.scale(size / 13, size / 13);
    SCALE = SCALE * size / 13;
    FRUIT[kind].draw(c);
    c.restore();
    SCALE = keep;
  }

  // ---------------------------------------------------------------------------
  // People: house cut-out cartoons (DESIGN.md, section 7). A round body, a big
  // round head as wide as the shoulders and no neck, white skin, oval eyes
  // with small pupils, furious eyebrows, a frown and a second chin, mitten
  // hands. Drawn standing behind the counter, so only the top half shows.
  // ---------------------------------------------------------------------------

  // o: { look: -1..1 where the eyes point, shut, shout, brows (0 weary, 1 furious) }
  function face(c, hx, hy, r, o) {
    var lw = r * 0.12;
    var lx = (o.look || 0) * r * 0.08;
    [-1, 1].forEach(function (s) {
      var ex = hx + s * r * 0.38 + lx * 0.6, ey = hy - r * 0.02;
      if (o.shut) {
        c.beginPath();
        c.arc(ex, ey - r * 0.04, r * 0.18, Math.PI * 0.15, Math.PI * 0.85);
        ink(c, lw * 0.9);
        c.stroke();
      } else {
        solid(c, ell(ex, ey, r * 0.2, r * 0.26), T.paper, lw * 0.75);
        c.fillStyle = T.ink;
        c.beginPath();
        c.arc(ex + (o.look || 0) * r * 0.09, ey + r * 0.04, r * 0.085, 0, Math.PI * 2);
        c.fill();
        if (o.lids) {
          // heavy lids: she's seen it all
          c.save();
          c.clip(ell(ex, ey, r * 0.2, r * 0.26));
          c.fillStyle = T.paper;
          c.fillRect(ex - r * 0.3, ey - r * 0.4, r * 0.6, r * 0.32);
          c.restore();
          line(c, [[ex - r * 0.2, ey - r * 0.08], [ex + r * 0.2, ey - r * 0.08]], lw * 0.8);
        }
      }
      // eyebrows, down at the middle
      var tilt = (o.brows == null ? 1 : o.brows) * r * 0.12;
      line(c, [[hx + s * r * 0.14 + lx, ey - r * 0.36 + tilt], [hx + s * r * 0.6 + lx, ey - r * 0.46 - tilt * 0.4]], lw * 1.25);
    });
    var my = hy + r * 0.45;
    if (o.shout) {
      solid(c, ell(hx + lx, my, r * 0.2, r * 0.15), T.ink, 0.01);
      solid(c, ell(hx + lx, my + r * 0.06, r * 0.1, r * 0.05), T.red, 0.01);
    } else {
      c.beginPath();
      c.arc(hx + lx, my + r * 0.16, r * 0.22, Math.PI * 1.2, Math.PI * 1.8);
      ink(c, lw);
      c.stroke();
    }
    // the second chin
    c.beginPath();
    c.arc(hx + lx * 0.5, hy + r * 0.38, r * 0.48, Math.PI * 0.3, Math.PI * 0.7);
    ink(c, lw * 0.8);
    c.stroke();
  }

  function mitten(c, x, y, r, fill) {
    solid(c, ell(x, y, r, r * 0.9), fill || T.paper, r * 0.28);
    solid(c, ell(x - r * 0.75, y - r * 0.45, r * 0.38, r * 0.5, -0.5), fill || T.paper, r * 0.22);
  }

  // Bev: the one assistant. Green polo, a red lanyard with the card on it, a
  // headset, and a bun with a pencil through it (from behind, the bun is how
  // you know it's her). She walks slowly and never looks at what she approves.
  // o: { phase, walking, reach 0..1 (the card arm out to the right), look,
  //      shut, shout, mug, xmas, face (1 right, -1 left), badge (her name on it) }
  function bev(c, x, y, o) {
    var R = 8.2;
    var bob = o.walking ? Math.abs(Math.sin(o.phase)) * 0.9 : 0;
    var sway = o.walking ? Math.sin(o.phase) * 0.06 : 0;
    var lw = 0.95;
    c.save();
    c.translate(x, y - bob);
    c.rotate(sway);
    var hy = -25.5;
    // arms first, behind the body
    var swing = o.walking ? Math.sin(o.phase) * 1.4 : 0;
    if (!o.reach) mitten(c, 10.2, -7 + swing, 2.6);
    // the body: a green polo
    var body = ell(0, -9.5, 10.4, 10.6);
    solid(c, body, T.accent, lw);
    shade(c, body, ell(6.4, -5, 6, 9), 0.85);
    ink(c, lw);
    c.stroke(body);
    // collar
    var collar = new Path2D();
    collar.moveTo(-3.4, -19.2); collar.lineTo(0, -15.6); collar.lineTo(3.4, -19.2); collar.lineTo(1.6, -19.8); collar.lineTo(0, -17.8); collar.lineTo(-1.6, -19.8); collar.closePath();
    solid(c, collar, T.paper, 0.5);
    // the lanyard and the card
    var cardX = o.reach ? 10 + o.reach * 7 : 0.6, cardY = o.reach ? -15 - o.reach * 3 : -9;
    line(c, [[-2.4, -18.6], [cardX - 0.6, cardY - 1.6]], 0.9, T.red);
    line(c, [[2.4, -18.6], [cardX + 0.6, cardY - 1.6]], 0.9, T.red);
    // name badge: BEV
    solid(c, rr(-8.6, -13.9, 5.8, 3, 0.3), T.paper, 0.4);
    if (o.badge) text(c, "Bev", -5.7, -12.3, 2.4);
    if (o.reach) {
      // the card arm, out to the till, without looking
      var arm = new Path2D();
      arm.moveTo(6, -14);
      arm.quadraticCurveTo(10 + o.reach * 2, -18, cardX + 1.4, cardY + 0.4);
      ink(c, 4.6); c.stroke(arm);
      ink(c, 2.8, T.accent); c.stroke(arm);
      mitten(c, cardX + 1.8, cardY + 0.6, 2.4);
    }
    solid(c, rr(cardX - 1.4, cardY - 1.8, 2.8, 3.6, 0.3), T.paper, 0.45);
    c.fillStyle = T.accent;
    c.fillRect(cardX - 1.1, cardY - 0.6, 2.2, 0.8);
    // the mug, or the other arm
    if (o.mug) {
      solid(c, rr(-9.2, -11.4, 3.8, 4.2, 0.4), T.paper, 0.5);
      c.beginPath(); c.arc(-9.4, -9.3, 1.2, Math.PI * 0.5, Math.PI * 1.5); ink(c, 0.5); c.stroke();
      mitten(c, -6.6, -8.4, 2.4);
      if (o.steam) {
        line(c, [[-7.6, -12.4], [-7, -13.6], [-7.6, -14.8]], 0.45, T.paper);
      }
    } else {
      mitten(c, -10.2, -7 - swing, 2.6);
    }
    // the head
    var head = ell(0, hy, R, R * 0.98);
    // the bun, with a pencil through it
    if (!o.xmas) {
      line(c, [[-3.8, hy - 12.4], [3.6, hy - 8.6]], 1.6);
      line(c, [[-3.8, hy - 12.4], [3.6, hy - 8.6]], 0.8, T.red);
      solid(c, ell(0, hy - 9.6, 3.2, 2.9), T.ink, 0.6);
      line(c, [[-3.8, hy - 12.4], [-1.6, hy - 11.3]], 1.6);
      line(c, [[-3.8, hy - 12.4], [-1.8, hy - 11.4]], 0.8, T.paper);
    }
    solid(c, head, T.paper, lw);
    // hair: scraped back, a dark cap over the top
    c.save();
    c.clip(head);
    c.fillStyle = T.ink;
    c.beginPath();
    c.ellipse(0, hy - 6.4, R * 1.1, 4.6, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();
    ink(c, lw);
    c.stroke(head);
    line(c, [[-R * 0.92, hy - 2.6], [-R * 0.3, hy - 4.8], [R * 0.4, hy - 4.6], [R * 0.95, hy - 2.4]], 0.5, T.paper);
    // the headset: a band over the top, an ear cup and a little green microphone
    c.beginPath();
    c.arc(0, hy, R + 0.6, Math.PI * 1.08, Math.PI * 1.92);
    ink(c, 1.1);
    c.stroke();
    var side = o.face === -1 ? 1 : -1;
    solid(c, ell(side * (R + 0.2), hy + 0.4, 1.5, 2.2), T.ink, 0.5);
    c.beginPath();
    c.moveTo(side * (R + 0.2), hy + 2);
    c.quadraticCurveTo(side * R * 0.9, hy + 6.2, side * 2.6, hy + 5.6);
    ink(c, 0.6);
    c.stroke();
    solid(c, ell(side * 2.4, hy + 5.6, 0.8, 0.7), T.accent, 0.35);
    face(c, 0, hy + 0.6, R, { look: o.look, shut: o.shut, shout: o.shout, lids: !o.shout, brows: 0.8 });
    if (o.xmas) hat(c, 0, hy - R * 0.58, R, "santa");
    c.restore();
  }

  // a hat on top of a head of radius R, at x, y (the brim)
  function hat(c, x, y, R, kind) {
    if (kind === "santa") {
      var cone = new Path2D();
      cone.moveTo(x - R * 0.95, y);
      cone.quadraticCurveTo(x - R * 0.2, y - R * 1.5, x + R * 1.1, y - R * 0.9);
      cone.lineTo(x + R * 0.95, y);
      cone.closePath();
      solid(c, cone, T.red, R * 0.1);
      solid(c, ell(x + R * 1.15, y - R * 0.86, R * 0.28, R * 0.28), T.paper, R * 0.08);
      solid(c, rr(x - R * 1.05, y - R * 0.22, R * 2.1, R * 0.45, R * 0.2), T.paper, R * 0.09);
    } else if (kind === "bobble") {
      var dome = new Path2D();
      dome.arc(x, y, R * 0.98, Math.PI, 0);
      dome.closePath();
      solid(c, dome, T.accent, R * 0.1);
      c.save(); c.clip(dome);
      ink(c, R * 0.14, T.paper);
      [-0.5, 0, 0.5].forEach(function (d) { c.beginPath(); c.moveTo(x + d * R, y); c.lineTo(x + d * R * 0.6, y - R); c.stroke(); });
      c.restore();
      ink(c, R * 0.1); c.stroke(dome);
      solid(c, ell(x, y - R * 1.05, R * 0.32, R * 0.3), T.paper, R * 0.08);
      solid(c, rr(x - R * 1.02, y - R * 0.2, R * 2.04, R * 0.42, R * 0.18), T.accent, R * 0.09);
    } else if (kind === "flat") {
      var cap = new Path2D();
      cap.moveTo(x - R * 0.98, y);
      cap.quadraticCurveTo(x - R * 0.9, y - R * 0.75, x, y - R * 0.78);
      cap.quadraticCurveTo(x + R * 0.9, y - R * 0.75, x + R * 1.5, y - R * 0.08);
      cap.lineTo(x + R * 0.98, y);
      cap.closePath();
      solid(c, cap, T.ink, R * 0.08);
    }
  }

  // Someone in the queue on Christmas Eve. o: { coat, hat, look, shout, tache }
  function shopper(c, x, y, k, o) {
    var R = 7.6;
    c.save();
    c.translate(x, y);
    c.scale(k, k);
    var body = ell(0, -9, 9.8, 10);
    solid(c, body, o.coat, 0.95);
    if (o.coat !== T.ink) shade(c, body, ell(5.6, -5, 6, 9), 0.85);
    line(c, [[0, -18], [0, -1]], 0.5, o.coat === T.ink ? T.paper : T.ink);
    var hy = -24;
    var head = ell(0, hy, R, R * 0.98);
    solid(c, head, T.paper, 0.95);
    face(c, 0, hy + 0.6, R, { look: o.look, shout: o.shout, brows: 1 });
    if (o.tache) solid(c, rr(-2.6 + (o.look || 0) * 0.6, hy + 2, 5.2, 1.3, 0.6), T.ink, 0.01);
    if (o.hat) hat(c, 0, hy - R * 0.45, R, o.hat);
    c.restore();
  }

  // Your hand: a mitten in a red sleeve, coming in from the right.
  // x, y: where the palm is. reach: how far the arm comes in (cosmetic).
  function hand(c, x, y, from) {
    var arm = new Path2D();
    arm.moveTo(x + 2.6, y + 1.4);
    arm.bezierCurveTo(x + 8, y + 2.4, from.x - 6, from.y - 8, from.x, from.y);
    ink(c, 7.6); c.stroke(arm);
    ink(c, 6, T.red); c.stroke(arm);
    // the cuff
    solid(c, ell(x + 2.7, y + 1.3, 1.5, 3.2, -0.25), T.paper, 0.6);
    var palm = new Path2D();
    palm.moveTo(x - 4.2, y - 0.4);
    palm.quadraticCurveTo(x - 4.4, y + 2.2, x - 1.6, y + 2.4);
    palm.lineTo(x + 2.4, y + 2.2);
    palm.quadraticCurveTo(x + 3.6, y + 0.6, x + 2.2, y - 0.8);
    palm.closePath();
    solid(c, palm, T.paper, 0.7);
    solid(c, ell(x - 3.6, y - 1.4, 1, 1.6, 0.3), T.paper, 0.55);
  }

  window.UnexpectedSprites = {
    init: init,
    flush: flush,
    ITEMS: ITEMS,
    FRUIT: FRUIT,
    dots: dots,
    ink: ink,
    rr: rr,
    ell: ell,
    solid: solid,
    shade: shade,
    line: line,
    sprite: sprite,
    paint: paint,
    drawItem: drawItem,
    drawFruit: drawFruit,
    face: face,
    bev: bev,
    shopper: shopper,
    hand: hand,
    hat: hat,
    text: text,
    measure: measure
  };
})();
