// Thirty Days: everything drawn, in code. The food, the stickers, the clerks
// at their desks, the chute, the plate, the pipes, the hatch and the speaker.
//
// Everything is drawn in world units (thirty-days.js sets the transform: 100
// units across the screen's shorter side), with thick ink outlines, flat
// fills and the four inks from Notaste.tokens(): ink, paper, red and the
// mint accent. Grey is only ever halftone dots on white (DESIGN.md, section 7).
//
// The clerks are the house cut-out cartoons: a round body, a big round head
// with no neck, white skin, oval eyes with small pupils, furious eyebrows, a
// frown and a second chin. Each wears one thing that tells them apart: the
// Liver an eyeshade, the Pancreas a pair of glasses on a chain and a dotted
// cardigan, the Kidneys (twins) matching bowl cuts and bow ties, the Heart a
// flat cap, a moustache and a plunger.
(function () {
  "use strict";

  var T = null;          // colour tokens
  var S = 1;             // device pixels per world unit
  var TAU = Math.PI * 2;
  var GAP = 0.3;         // the space between words, in ems (see text())
  var dotTile = null, lightTile = null;
  var OUT = 0.72;        // the standard outline, in world units

  function init(tokens, scale) {
    T = tokens;
    if (Math.abs(scale - S) > 0.001) { dotTile = null; lightTile = null; }
    S = scale;
  }

  // ---------------------------------------------------------------------------
  // Small drawing helpers
  // ---------------------------------------------------------------------------
  function pen(c, w, colour) {
    c.lineWidth = w;
    c.strokeStyle = colour || T.ink;
    c.lineJoin = "round";
    c.lineCap = "round";
  }
  function ell(c, x, y, rx, ry, rot) {
    c.beginPath();
    c.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot || 0, 0, TAU);
  }
  function rrPath(c, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }
  function rr(c, x, y, w, h, r) { c.beginPath(); rrPath(c, x, y, w, h, r); }
  function edgeFor(fill) { return fill === T.ink ? T.paper : T.ink; }
  function fill(c, colour, w, edge) {
    c.fillStyle = colour;
    c.fill();
    if (w) { pen(c, w, edge || edgeFor(colour)); c.stroke(); }
  }
  function stroke(c, w, colour) { pen(c, w, colour); c.stroke(); }

  function tile(n, r) {
    var t = document.createElement("canvas");
    t.width = t.height = n;
    var x = t.getContext("2d");
    x.fillStyle = T.ink;
    x.beginPath();
    x.arc(n / 2, n / 2, n * r, 0, TAU);
    x.fill();
    return t;
  }
  // Black halftone dots, sized in device pixels whatever the drawing scale
  function shade(c) {
    if (!dotTile) dotTile = tile(Math.max(3, Math.round(S * 0.75)), 0.26);
    var pat = c.createPattern(dotTile, "repeat");
    if (pat.setTransform && window.DOMMatrix) pat.setTransform(new DOMMatrix().scale(1 / S));
    return pat;
  }
  function shadeLight(c) {
    if (!lightTile) lightTile = tile(Math.max(4, Math.round(S * 1.1)), 0.18);
    var pat = c.createPattern(lightTile, "repeat");
    if (pat.setTransform && window.DOMMatrix) pat.setTransform(new DOMMatrix().scale(1 / S));
    return pat;
  }
  // Dots over whatever path is current
  function dots(c, light) { c.fillStyle = light ? shadeLight(c) : shade(c); c.fill(); }

  // Halftone in the crescent away from the light (top left), like the covers
  function crescent(c, x, y, rx, ry, off) {
    var ox = off == null ? 0.24 : off, oy = off == null ? 0.26 : off * 1.1;
    c.save();
    ell(c, x, y, rx, ry);
    c.clip();
    c.beginPath();
    c.ellipse(x, y, rx * 1.1, ry * 1.1, 0, 0, TAU);
    c.moveTo(x - rx * ox + rx, y - ry * oy);
    c.ellipse(x - rx * ox, y - ry * oy, rx, ry, 0, 0, TAU);
    c.fillStyle = shade(c);
    c.fill("evenodd");
    c.restore();
  }

  // Words with a little extra space between them: the display font's own
  // space is narrow, and the house signs are spaced out
  function textWidth(c, str, size) {
    var w = 0;
    String(str).split(" ").forEach(function (word, i) { w += c.measureText(word).width + (i ? size * GAP : 0); });
    return w;
  }
  function font(c, size) { c.font = size + "px " + T.display; }
  function text(c, str, x, y, size, how) {
    var words = String(str).split(" ");
    var align = c.textAlign, w = textWidth(c, str, size);
    var at = align === "center" ? x - w / 2 : align === "right" || align === "end" ? x - w : x;
    c.textAlign = "left";
    if (how === "both") words.reduce(function (p, word) { c.strokeText(word, p, y); return p + c.measureText(word).width + size * GAP; }, at);
    words.reduce(function (p, word) { c.fillText(word, p, y); return p + c.measureText(word).width + size * GAP; }, at);
    c.textAlign = align;
  }
  // Paper capitals with an ink edge, for labels over the scene
  function label(c, str, x, y, size, align, colour) {
    font(c, size);
    c.textAlign = align || "center";
    c.textBaseline = "middle";
    c.lineWidth = size * 0.32;
    c.lineJoin = "round";
    c.strokeStyle = T.ink;
    c.fillStyle = colour || T.paper;
    text(c, String(str).toUpperCase(), x, y, size, "both");
  }

  // ---------------------------------------------------------------------------
  // Stickers: what an item mostly is. The words say it, not just the colour.
  //   grease: mint with ink capitals and a drip
  //   sugar:  paper with red capitals and a cube
  //   salt:   ink with paper capitals and a shaker
  // ---------------------------------------------------------------------------
  var KINDS = {
    grease: { word: "Grease" },
    sugar: { word: "Sugar" },
    salt: { word: "Salt" },
    leaf: { word: "Leaf?" }
  };
  function stickerColours(kind) {
    if (kind === "grease") return { bg: T.accent, fg: T.ink, edge: T.ink };
    if (kind === "sugar") return { bg: T.paper, fg: T.red, edge: T.red };
    if (kind === "salt") return { bg: T.ink, fg: T.paper, edge: T.paper };
    return { bg: T.paper, fg: T.ink, edge: T.ink };
  }
  function kindIcon(c, kind, x, y, s, colour) {
    c.fillStyle = colour;
    c.strokeStyle = colour;
    if (kind === "grease") {
      // a drip
      c.beginPath();
      c.moveTo(x, y - s * 0.55);
      c.quadraticCurveTo(x + s * 0.5, y + s * 0.05, x + s * 0.32, y + s * 0.3);
      c.arc(x, y + s * 0.2, s * 0.34, 0.3, Math.PI - 0.3);
      c.quadraticCurveTo(x - s * 0.5, y + s * 0.05, x, y - s * 0.55);
      c.fill();
    } else if (kind === "sugar") {
      // a cube
      c.beginPath();
      c.moveTo(x, y - s * 0.5); c.lineTo(x + s * 0.45, y - s * 0.25); c.lineTo(x + s * 0.45, y + s * 0.3);
      c.lineTo(x, y + s * 0.55); c.lineTo(x - s * 0.45, y + s * 0.3); c.lineTo(x - s * 0.45, y - s * 0.25);
      c.closePath();
      c.fill();
    } else if (kind === "salt") {
      // a shaker
      rr(c, x - s * 0.3, y - s * 0.15, s * 0.6, s * 0.7, s * 0.12);
      c.fill();
      c.beginPath();
      c.arc(x, y - s * 0.15, s * 0.3, Math.PI, 0);
      c.fill();
    } else {
      // a question mark, more or less
      font(c, s * 1.2);
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText("?", x, y + s * 0.05);
    }
  }
  // A sticker centred on x, y, size s (its height). Returns its width.
  // icon: just the icon, no word, for stickers too small to read (the chute)
  function sticker(c, kind, x, y, s, rot, alpha, icon) {
    var col = stickerColours(kind), word = KINDS[kind].word.toUpperCase();
    var fs = s * 0.7;
    font(c, fs);
    var w = icon ? s * 1.1 : textWidth(c, word, fs) + s * 1.45;
    c.save();
    if (alpha != null) c.globalAlpha *= alpha;
    c.translate(x, y);
    c.rotate(rot || 0);
    rr(c, -w / 2, -s / 2, w, s, s * 0.22);
    fill(c, col.bg, Math.max(0.35, s * 0.11), col.edge === T.paper ? T.paper : T.ink);
    if (kind === "sugar") { rr(c, -w / 2 + s * 0.13, -s / 2 + s * 0.13, w - s * 0.26, s - s * 0.26, s * 0.15); stroke(c, s * 0.06, T.red); }
    kindIcon(c, kind, icon ? 0 : -w / 2 + s * 0.55, 0, s * 0.62, col.fg);
    if (!icon) {
      c.fillStyle = col.fg;
      c.textAlign = "left";
      c.textBaseline = "middle";
      font(c, fs);
      text(c, word, -w / 2 + s * 1.0, s * 0.05, fs);
    }
    c.restore();
    return w;
  }

  // ---------------------------------------------------------------------------
  // The food. Each item is drawn about s tall, centred on x, y.
  // ---------------------------------------------------------------------------
  function bun(c, x, y, w, h, top) {
    c.beginPath();
    if (top) {
      c.moveTo(x - w / 2, y + h / 2);
      c.quadraticCurveTo(x - w / 2, y - h / 2, x, y - h / 2);
      c.quadraticCurveTo(x + w / 2, y - h / 2, x + w / 2, y + h / 2);
      c.closePath();
    } else {
      rrPath(c, x - w / 2, y - h / 2, w, h, h * 0.45);
    }
    fill(c, T.paper, OUT * 0.9);
    if (top) {
      c.save();
      c.clip();
      c.beginPath();
      c.ellipse(x + w * 0.2, y + h * 0.1, w * 0.45, h * 0.7, 0, 0, TAU);
      dots(c, true);
      c.restore();
      c.fillStyle = T.ink;
      [[-0.22, -0.05], [0.05, -0.22], [0.25, 0], [-0.02, 0.08]].forEach(function (p) {
        ell(c, x + p[0] * w, y + p[1] * h, w * 0.035, h * 0.06, 0.4);
        c.fill();
      });
    }
  }
  function patty(c, x, y, w, h) {
    rr(c, x - w / 2, y - h / 2, w, h, h * 0.45);
    fill(c, T.ink, OUT * 0.6, T.ink);
    // cheese, melting over the edge
    c.beginPath();
    c.moveTo(x - w * 0.46, y - h * 0.5);
    c.lineTo(x + w * 0.46, y - h * 0.5);
    c.lineTo(x + w * 0.3, y + h * 0.15);
    c.lineTo(x + w * 0.18, y - h * 0.15);
    c.lineTo(x - w * 0.1, y + h * 0.35);
    c.lineTo(x - w * 0.2, y - h * 0.2);
    c.closePath();
    fill(c, T.accent, OUT * 0.5, T.ink);
  }

  var FOOD = {
    burger: function (c, x, y, s) {
      var w = s * 1.05;
      bun(c, x, y + s * 0.3, w * 0.94, s * 0.2, false);
      patty(c, x, y + s * 0.08, w, s * 0.22);
      // ketchup
      c.beginPath();
      c.moveTo(x - w * 0.42, y - s * 0.04);
      c.quadraticCurveTo(x, y + s * 0.06, x + w * 0.42, y - s * 0.04);
      stroke(c, s * 0.07, T.red);
      bun(c, x, y - s * 0.2, w, s * 0.38, true);
    },
    quadruple: function (c, x, y, s) {
      var w = s * 0.95, h = s * 0.13;
      bun(c, x, y + s * 0.42, w * 0.94, s * 0.14, false);
      for (var i = 0; i < 4; i++) patty(c, x + (i % 2 ? 0.6 : -0.6) * s * 0.04, y + s * 0.27 - i * h * 1.08, w, h);
      bun(c, x, y - s * 0.34, w, s * 0.3, true);
      // a flag on a stick, because it's that sort of burger
      c.beginPath();
      c.moveTo(x + w * 0.1, y - s * 0.46); c.lineTo(x + w * 0.1, y - s * 0.68);
      stroke(c, s * 0.04);
      c.beginPath();
      c.moveTo(x + w * 0.1, y - s * 0.68); c.lineTo(x + w * 0.36, y - s * 0.62); c.lineTo(x + w * 0.1, y - s * 0.56);
      c.closePath();
      fill(c, T.red, s * 0.03);
    },
    hashbrown: function (c, x, y, s) {
      rr(c, x - s * 0.5, y - s * 0.3, s, s * 0.6, s * 0.28);
      fill(c, T.paper);
      c.save(); c.clip();
      rr(c, x - s * 0.5, y - s * 0.3, s, s * 0.6, s * 0.28);
      dots(c);
      c.restore();
      rr(c, x - s * 0.5, y - s * 0.3, s, s * 0.6, s * 0.28);
      stroke(c, OUT);
      c.beginPath();
      for (var i = 0; i < 5; i++) { c.moveTo(x - s * 0.32 + i * s * 0.15, y - s * 0.12); c.lineTo(x - s * 0.36 + i * s * 0.15, y + s * 0.1); }
      stroke(c, s * 0.04);
    },
    drumstick: function (c, x, y, s) {
      c.save();
      c.translate(x, y);
      c.rotate(-0.6);
      // the bone
      rr(c, s * 0.12, -s * 0.06, s * 0.4, s * 0.12, s * 0.06);
      fill(c, T.paper, OUT * 0.8);
      ell(c, s * 0.54, -s * 0.07, s * 0.08, s * 0.08); fill(c, T.paper, OUT * 0.7);
      ell(c, s * 0.54, s * 0.07, s * 0.08, s * 0.08); fill(c, T.paper, OUT * 0.7);
      // the crumb
      c.beginPath();
      c.moveTo(s * 0.18, -s * 0.12);
      c.bezierCurveTo(-s * 0.1, -s * 0.42, -s * 0.55, -s * 0.3, -s * 0.5, 0);
      c.bezierCurveTo(-s * 0.55, s * 0.3, -s * 0.1, s * 0.42, s * 0.18, s * 0.12);
      c.closePath();
      fill(c, T.paper);
      c.save(); c.clip(); c.translate(s * 0.08, s * 0.08); dots(c); c.restore();
      c.beginPath();
      c.moveTo(s * 0.18, -s * 0.12);
      c.bezierCurveTo(-s * 0.1, -s * 0.42, -s * 0.55, -s * 0.3, -s * 0.5, 0);
      c.bezierCurveTo(-s * 0.55, s * 0.3, -s * 0.1, s * 0.42, s * 0.18, s * 0.12);
      c.closePath();
      stroke(c, OUT);
      c.restore();
    },
    muffin: function (c, x, y, s) {
      // a breakfast muffin: two discs and an egg escaping
      bun(c, x, y + s * 0.18, s, s * 0.24, false);
      ell(c, x + s * 0.08, y, s * 0.52, s * 0.12);
      fill(c, T.paper, OUT * 0.8);
      ell(c, x + s * 0.22, y + s * 0.01, s * 0.12, s * 0.07);
      fill(c, T.accent, OUT * 0.5);
      rr(c, x - s * 0.48, y - s * 0.3, s * 0.96, s * 0.26, s * 0.12);
      fill(c, T.paper, OUT * 0.9);
      c.beginPath();
      rrPath(c, x - s * 0.48, y - s * 0.3, s * 0.96, s * 0.26, s * 0.12);
      c.save(); c.clip(); c.beginPath(); c.rect(x - s * 0.1, y - s * 0.3, s, s); dots(c, true); c.restore();
    },
    cola: function (c, x, y, s) {
      // a cup, a lid, a straw and a red sleeve
      c.beginPath();
      c.moveTo(x + s * 0.06, y - s * 0.38); c.lineTo(x + s * 0.2, y - s * 0.62);
      stroke(c, s * 0.12);
      c.beginPath();
      c.moveTo(x + s * 0.06, y - s * 0.38); c.lineTo(x + s * 0.2, y - s * 0.62);
      stroke(c, s * 0.06, T.paper);
      c.beginPath();
      c.moveTo(x - s * 0.3, y - s * 0.34); c.lineTo(x + s * 0.3, y - s * 0.34);
      c.lineTo(x + s * 0.23, y + s * 0.5); c.lineTo(x - s * 0.23, y + s * 0.5);
      c.closePath();
      fill(c, T.paper, OUT);
      c.beginPath();
      c.moveTo(x - s * 0.28, y - s * 0.1); c.lineTo(x + s * 0.28, y - s * 0.1);
      c.lineTo(x + s * 0.25, y + s * 0.22); c.lineTo(x - s * 0.25, y + s * 0.22);
      c.closePath();
      fill(c, T.red, OUT * 0.7);
      rr(c, x - s * 0.36, y - s * 0.44, s * 0.72, s * 0.12, s * 0.05);
      fill(c, T.paper, OUT * 0.8);
    },
    shake: function (c, x, y, s) {
      // a milkshake: a dome lid and mint stripes
      c.beginPath();
      c.moveTo(x - s * 0.28, y - s * 0.22); c.lineTo(x + s * 0.28, y - s * 0.22);
      c.lineTo(x + s * 0.21, y + s * 0.52); c.lineTo(x - s * 0.21, y + s * 0.52);
      c.closePath();
      fill(c, T.paper, OUT);
      c.save();
      c.clip();
      c.fillStyle = T.accent;
      for (var i = 0; i < 4; i++) c.fillRect(x - s * 0.4 + i * s * 0.22, y - s * 0.3, s * 0.09, s);
      c.restore();
      c.beginPath();
      c.moveTo(x - s * 0.28, y - s * 0.22); c.lineTo(x + s * 0.28, y - s * 0.22);
      c.lineTo(x + s * 0.21, y + s * 0.52); c.lineTo(x - s * 0.21, y + s * 0.52);
      c.closePath();
      stroke(c, OUT);
      c.beginPath();
      c.moveTo(x - s * 0.32, y - s * 0.22);
      c.quadraticCurveTo(x - s * 0.3, y - s * 0.56, x, y - s * 0.56);
      c.quadraticCurveTo(x + s * 0.3, y - s * 0.56, x + s * 0.32, y - s * 0.22);
      c.closePath();
      fill(c, T.paper, OUT * 0.8);
      c.beginPath();
      c.moveTo(x - s * 0.04, y - s * 0.54); c.lineTo(x - s * 0.14, y - s * 0.76);
      stroke(c, s * 0.1);
      c.beginPath();
      c.moveTo(x - s * 0.04, y - s * 0.54); c.lineTo(x - s * 0.14, y - s * 0.76);
      stroke(c, s * 0.05, T.red);
    },
    doughnut: function (c, x, y, s) {
      ell(c, x, y, s * 0.5, s * 0.42);
      fill(c, T.paper, OUT);
      // icing, in mint, with a wobbly edge
      c.beginPath();
      for (var i = 0; i <= 24; i++) {
        var a = (i / 24) * TAU, r = s * (0.4 + (i % 2 ? 0.035 : -0.01));
        var px = x + Math.cos(a) * r, py = y - s * 0.03 + Math.sin(a) * r * 0.82;
        if (i) c.lineTo(px, py); else c.moveTo(px, py);
      }
      c.closePath();
      fill(c, T.accent, OUT * 0.6);
      ell(c, x, y - s * 0.03, s * 0.14, s * 0.11);
      fill(c, T.ink);
      c.strokeStyle = T.red;
      c.lineWidth = s * 0.05;
      c.lineCap = "round";
      [[-0.26, -0.18, 0.5], [0.18, -0.24, -0.4], [0.28, 0.08, 0.9], [-0.22, 0.14, -0.9], [0.02, 0.24, 0.2], [-0.04, -0.3, 1.3]].forEach(function (p) {
        c.beginPath();
        c.moveTo(x + p[0] * s - Math.cos(p[2]) * s * 0.05, y + p[1] * s - Math.sin(p[2]) * s * 0.05);
        c.lineTo(x + p[0] * s + Math.cos(p[2]) * s * 0.05, y + p[1] * s + Math.sin(p[2]) * s * 0.05);
        c.stroke();
      });
    },
    pie: function (c, x, y, s) {
      // the hot pie, in its sleeve, with a warning nobody reads
      rr(c, x - s * 0.5, y - s * 0.24, s, s * 0.48, s * 0.06);
      fill(c, T.red, OUT);
      rr(c, x - s * 0.42, y - s * 0.32, s * 0.84, s * 0.2, s * 0.08);
      fill(c, T.paper, OUT * 0.8);
      c.save(); c.clip(); rr(c, x - s * 0.42, y - s * 0.32, s * 0.84, s * 0.2, s * 0.08); dots(c, true); c.restore();
      font(c, s * 0.26);
      c.fillStyle = T.paper;
      c.textAlign = "center";
      c.textBaseline = "middle";
      text(c, "HOT", x, y + s * 0.07, s * 0.26);
    },
    sundae: function (c, x, y, s) {
      c.beginPath();
      c.moveTo(x - s * 0.34, y + s * 0.02); c.lineTo(x + s * 0.34, y + s * 0.02);
      c.lineTo(x + s * 0.24, y + s * 0.5); c.lineTo(x - s * 0.24, y + s * 0.5);
      c.closePath();
      fill(c, T.paper, OUT);
      c.beginPath();
      c.moveTo(x - s * 0.38, y + s * 0.04);
      c.quadraticCurveTo(x - s * 0.4, y - s * 0.2, x - s * 0.12, y - s * 0.22);
      c.quadraticCurveTo(x - s * 0.2, y - s * 0.44, x + s * 0.02, y - s * 0.5);
      c.quadraticCurveTo(x + s * 0.24, y - s * 0.42, x + s * 0.14, y - s * 0.22);
      c.quadraticCurveTo(x + s * 0.4, y - s * 0.2, x + s * 0.38, y + s * 0.04);
      c.closePath();
      fill(c, T.paper, OUT);
      // sauce
      c.beginPath();
      c.moveTo(x - s * 0.3, y - s * 0.08);
      c.quadraticCurveTo(x - s * 0.2, y + s * 0.12, x - s * 0.1, y - s * 0.1);
      c.quadraticCurveTo(x + s * 0.05, y + s * 0.16, x + s * 0.18, y - s * 0.12);
      c.quadraticCurveTo(x + s * 0.28, y + s * 0.06, x + s * 0.32, y - s * 0.06);
      stroke(c, s * 0.07, T.red);
      ell(c, x + s * 0.02, y - s * 0.56, s * 0.07, s * 0.07);
      fill(c, T.red, OUT * 0.6);
    },
    fries: function (c, x, y, s) {
      // sticks first, then the red carton in front
      c.lineCap = "butt";
      [[-0.2, -0.44, -0.1], [-0.08, -0.56, 0.05], [0.06, -0.5, 0.12], [0.18, -0.4, 0.2], [-0.02, -0.38, -0.06], [0.12, -0.6, 0.02]].forEach(function (f) {
        c.save();
        c.translate(x + f[0] * s, y + f[1] * s);
        c.rotate(f[2]);
        rr(c, -s * 0.05, 0, s * 0.1, s * 0.5, s * 0.02);
        fill(c, T.paper, OUT * 0.6);
        c.restore();
      });
      c.beginPath();
      c.moveTo(x - s * 0.36, y - s * 0.2);
      c.quadraticCurveTo(x, y - s * 0.06, x + s * 0.36, y - s * 0.2);
      c.lineTo(x + s * 0.27, y + s * 0.5); c.lineTo(x - s * 0.27, y + s * 0.5);
      c.closePath();
      fill(c, T.red, OUT);
      ell(c, x, y + s * 0.18, s * 0.11, s * 0.11);
      stroke(c, s * 0.05, T.paper);
    },
    crisps: function (c, x, y, s) {
      // a bag, crimped top and bottom
      c.beginPath();
      c.moveTo(x - s * 0.34, y - s * 0.44);
      for (var i = 0; i <= 6; i++) c.lineTo(x - s * 0.34 + i * s * 0.113, y - s * 0.44 - (i % 2 ? s * 0.05 : 0));
      c.quadraticCurveTo(x + s * 0.44, y, x + s * 0.34, y + s * 0.44);
      for (var j = 0; j <= 6; j++) c.lineTo(x + s * 0.34 - j * s * 0.113, y + s * 0.44 + (j % 2 ? s * 0.05 : 0));
      c.quadraticCurveTo(x - s * 0.44, y, x - s * 0.34, y - s * 0.44);
      c.closePath();
      fill(c, T.paper, OUT);
      ell(c, x, y + s * 0.03, s * 0.2, s * 0.2);
      fill(c, T.accent, OUT * 0.7);
      ell(c, x, y + s * 0.03, s * 0.2, s * 0.2);
      c.save(); c.clip(); c.translate(s * 0.08, s * 0.08); dots(c); c.restore();
      font(c, s * 0.18);
      c.fillStyle = T.ink;
      c.textAlign = "center";
      c.textBaseline = "middle";
      text(c, "CRISPS", x, y - s * 0.28, s * 0.18);
    },
    pretzel: function (c, x, y, s) {
      c.beginPath();
      c.moveTo(x - s * 0.32, y + s * 0.3);
      c.bezierCurveTo(x - s * 0.6, y - s * 0.1, x - s * 0.3, y - s * 0.5, x, y - s * 0.1);
      c.bezierCurveTo(x + s * 0.3, y - s * 0.5, x + s * 0.6, y - s * 0.1, x + s * 0.32, y + s * 0.3);
      c.moveTo(x - s * 0.32, y + s * 0.3);
      c.quadraticCurveTo(x, y + s * 0.1, x + s * 0.32, y + s * 0.3);
      stroke(c, s * 0.2);
      c.beginPath();
      c.moveTo(x - s * 0.32, y + s * 0.3);
      c.bezierCurveTo(x - s * 0.6, y - s * 0.1, x - s * 0.3, y - s * 0.5, x, y - s * 0.1);
      c.bezierCurveTo(x + s * 0.3, y - s * 0.5, x + s * 0.6, y - s * 0.1, x + s * 0.32, y + s * 0.3);
      c.moveTo(x - s * 0.32, y + s * 0.3);
      c.quadraticCurveTo(x, y + s * 0.1, x + s * 0.32, y + s * 0.3);
      stroke(c, s * 0.11, T.paper);
      c.fillStyle = T.ink;
      [[-0.3, -0.04], [0.28, -0.12], [-0.08, -0.22], [0.18, 0.2], [-0.2, 0.22]].forEach(function (p) {
        c.fillRect(x + p[0] * s, y + p[1] * s, s * 0.05, s * 0.05);
      });
    },
    sachet: function (c, x, y, s) {
      // just the salt. A sachet of it.
      c.save();
      c.translate(x, y);
      c.rotate(-0.15);
      rr(c, -s * 0.36, -s * 0.24, s * 0.72, s * 0.48, s * 0.04);
      fill(c, T.paper, OUT);
      c.beginPath();
      for (var i = 0; i <= 8; i++) c.lineTo(-s * 0.36 + i * s * 0.09, -s * 0.24 + (i % 2 ? s * 0.04 : 0));
      stroke(c, s * 0.03);
      font(c, s * 0.24);
      c.fillStyle = T.ink;
      c.textAlign = "center";
      c.textBaseline = "middle";
      text(c, "SALT", 0, s * 0.04, s * 0.24);
      c.restore();
    },
    loaded: function (c, x, y, s) {
      // loaded fries: fries, but under a landslide of cheese
      FOOD.fries(c, x, y + s * 0.04, s * 0.95);
      c.beginPath();
      c.moveTo(x - s * 0.4, y - s * 0.26);
      c.quadraticCurveTo(x - s * 0.2, y - s * 0.52, x, y - s * 0.4);
      c.quadraticCurveTo(x + s * 0.2, y - s * 0.56, x + s * 0.4, y - s * 0.26);
      c.lineTo(x + s * 0.34, y - s * 0.06);
      c.lineTo(x + s * 0.24, y - s * 0.16);
      c.lineTo(x + s * 0.1, y + s * 0.06);
      c.lineTo(x - s * 0.05, y - s * 0.14);
      c.lineTo(x - s * 0.22, y + s * 0.02);
      c.lineTo(x - s * 0.34, y - s * 0.1);
      c.closePath();
      fill(c, T.accent, OUT * 0.7);
    },
    bucket: function (c, x, y, s) {
      // a bucket of something fried, and a straw in it
      c.beginPath();
      c.moveTo(x - s * 0.36, y - s * 0.24); c.lineTo(x + s * 0.36, y - s * 0.24);
      c.lineTo(x + s * 0.28, y + s * 0.5); c.lineTo(x - s * 0.28, y + s * 0.5);
      c.closePath();
      fill(c, T.paper, OUT);
      c.save(); c.clip();
      c.fillStyle = T.red;
      for (var i = 0; i < 4; i++) c.fillRect(x - s * 0.34 + i * s * 0.2, y - s * 0.3, s * 0.1, s);
      c.restore();
      c.beginPath();
      c.moveTo(x - s * 0.36, y - s * 0.24); c.lineTo(x + s * 0.36, y - s * 0.24);
      c.lineTo(x + s * 0.28, y + s * 0.5); c.lineTo(x - s * 0.28, y + s * 0.5);
      c.closePath();
      stroke(c, OUT);
      [[-0.2, -0.3], [0.04, -0.38], [0.24, -0.28]].forEach(function (p) {
        ell(c, x + p[0] * s, y + p[1] * s, s * 0.16, s * 0.12);
        fill(c, T.paper, OUT * 0.8);
        c.save(); c.clip(); c.translate(s * 0.05, s * 0.05); dots(c); c.restore();
      });
      c.beginPath();
      c.moveTo(x + s * 0.1, y - s * 0.36); c.lineTo(x + s * 0.26, y - s * 0.74);
      stroke(c, s * 0.1);
      c.beginPath();
      c.moveTo(x + s * 0.1, y - s * 0.36); c.lineTo(x + s * 0.26, y - s * 0.74);
      stroke(c, s * 0.05, T.accent);
    },
    lettuce: function (c, x, y, s) {
      // a single leaf. Nobody knows what it is.
      c.beginPath();
      c.moveTo(x - s * 0.04, y + s * 0.46);
      c.bezierCurveTo(x - s * 0.6, y + s * 0.2, x - s * 0.5, y - s * 0.4, x - s * 0.06, y - s * 0.46);
      c.quadraticCurveTo(x + s * 0.06, y - s * 0.38, x + s * 0.12, y - s * 0.48);
      c.bezierCurveTo(x + s * 0.56, y - s * 0.3, x + s * 0.5, y + s * 0.24, x - s * 0.04, y + s * 0.46);
      c.closePath();
      fill(c, T.accent, OUT);
      c.beginPath();
      c.moveTo(x - s * 0.04, y + s * 0.42); c.quadraticCurveTo(x + s * 0.02, y, x - s * 0.02, y - s * 0.38);
      c.moveTo(x, y + s * 0.1); c.lineTo(x - s * 0.22, y - s * 0.06);
      c.moveTo(x, y + s * 0.1); c.lineTo(x + s * 0.2, y - s * 0.08);
      c.moveTo(x - s * 0.01, y - s * 0.12); c.lineTo(x - s * 0.18, y - s * 0.28);
      c.moveTo(x - s * 0.01, y - s * 0.12); c.lineTo(x + s * 0.16, y - s * 0.28);
      stroke(c, s * 0.04);
    }
  };

  // An item: its food, then its sticker(s) on the lower right.
  // opts: { stickers: [kind...], hidden: true (stickers off), alpha, rot, squash }
  function item(c, it, x, y, s, opts) {
    opts = opts || {};
    c.save();
    if (opts.alpha != null) c.globalAlpha *= opts.alpha;
    c.translate(x, y);
    if (opts.rot) c.rotate(opts.rot);
    if (opts.squash) c.scale(1 + opts.squash, 1 - opts.squash);
    (FOOD[it.food] || FOOD.burger)(c, 0, 0, s);
    c.restore();
    if (opts.noSticker) return;
    var kinds = it.kinds.slice(it.step || 0);
    if (it.bare && !opts.showBare) return;
    var ss = opts.iconSticker || Math.max(opts.minSticker || 0, s * 0.3);
    kinds.forEach(function (k, i) {
      c.save();
      if (opts.alpha != null) c.globalAlpha *= opts.alpha;
      if (opts.iconSticker) sticker(c, k, x + s * 0.34 + i * ss * 1.1, y + s * 0.3, ss, -0.12 + i * 0.1, null, true);
      else sticker(c, k, x + s * 0.3 - i * s * 0.12, y + s * 0.42 + i * ss * 1.05, ss, -0.12 + i * 0.1);
      c.restore();
    });
  }

  // ---------------------------------------------------------------------------
  // The clerks
  // ---------------------------------------------------------------------------
  // look: { id, shirt, dots, hat, glasses, chain, tie, bow, tache, cardigan }
  // f: { mood, gx, gy, talk, stamp (0..1, the stamping arm), sweat, blink }
  function clerk(c, x, y, r, look, f) {
    f = f || {};
    var shirt = T[look.shirt] || look.shirt;
    // the body: round, mostly behind the desk
    ell(c, x, y + r * 1.75, r * 1.55, r * 1.15);
    fill(c, shirt);
    if (look.dots) { ell(c, x, y + r * 1.75, r * 1.55, r * 1.15); dots(c, true); }
    if (shirt !== T.ink) crescent(c, x, y + r * 1.75, r * 1.55, r * 1.15);
    ell(c, x, y + r * 1.75, r * 1.55, r * 1.15);
    stroke(c, OUT, edgeFor(shirt));
    if (look.cardigan) {
      c.beginPath();
      c.moveTo(x - r * 0.4, y + r * 0.85); c.lineTo(x - r * 0.12, y + r * 2.8);
      c.moveTo(x + r * 0.4, y + r * 0.85); c.lineTo(x + r * 0.12, y + r * 2.8);
      stroke(c, OUT * 0.8);
      ell(c, x - r * 0.2, y + r * 1.6, r * 0.08, r * 0.08); fill(c, T.ink);
      ell(c, x - r * 0.24, y + r * 2.1, r * 0.08, r * 0.08); fill(c, T.ink);
    }
    if (look.tie) {
      c.beginPath();
      c.moveTo(x - r * 0.14, y + r * 0.92); c.lineTo(x + r * 0.14, y + r * 0.92);
      c.lineTo(x + r * 0.24, y + r * 1.9); c.lineTo(x, y + r * 2.15); c.lineTo(x - r * 0.24, y + r * 1.9);
      c.closePath();
      fill(c, T.red, OUT * 0.7);
    }
    if (look.bow) {
      c.beginPath();
      c.moveTo(x, y + r * 1.02); c.lineTo(x - r * 0.4, y + r * 0.82); c.lineTo(x - r * 0.4, y + r * 1.22); c.closePath();
      c.moveTo(x, y + r * 1.02); c.lineTo(x + r * 0.4, y + r * 0.82); c.lineTo(x + r * 0.4, y + r * 1.22); c.closePath();
      fill(c, T.red, OUT * 0.6);
    }
    if (look.overalls) {
      rr(c, x - r * 0.8, y + r * 1.3, r * 1.6, r * 1.6, r * 0.2);
      fill(c, T.red, OUT * 0.8);
      c.beginPath();
      c.moveTo(x - r * 0.6, y + r * 1.32); c.lineTo(x - r * 0.75, y + r * 0.86);
      c.moveTo(x + r * 0.6, y + r * 1.32); c.lineTo(x + r * 0.75, y + r * 0.86);
      stroke(c, r * 0.22, T.red);
    }
    // ears, then the head, big and round with no neck
    var wob = f.wobble || 0;
    c.save();
    c.translate(x, y);
    c.rotate(wob);
    ell(c, -r * 0.98, r * 0.1, r * 0.2, r * 0.27); fill(c, T.paper, OUT * 0.8);
    ell(c, r * 0.98, r * 0.1, r * 0.2, r * 0.27); fill(c, T.paper, OUT * 0.8);
    ell(c, 0, 0, r, r);
    fill(c, T.paper);
    crescent(c, 0, 0, r, r, 0.09);
    ell(c, 0, 0, r, r);
    stroke(c, OUT);
    hat(c, r, look);
    face(c, r, look, f);
    c.restore();
  }

  function hat(c, r, look) {
    switch (look.hat) {
      case "visor": {
        // an eyeshade: a mint band and a brim out over the eyes
        c.beginPath();
        c.arc(0, 0, r * 1.02, Math.PI + 0.55, -0.55);
        c.lineTo(Math.cos(-0.55) * r * 0.86, Math.sin(-0.55) * r * 0.86);
        c.arc(0, 0, r * 0.86, -0.55, Math.PI + 0.55, true);
        c.closePath();
        fill(c, T.accent, OUT * 0.8);
        c.beginPath();
        c.moveTo(-r * 0.9, -r * 0.5);
        c.quadraticCurveTo(0, -r * 0.18, r * 0.9, -r * 0.5);
        c.quadraticCurveTo(0, -r * 0.02, -r * 0.9, -r * 0.5);
        fill(c, T.accent, OUT * 0.8);
        // a few hairs poking through the top
        c.beginPath();
        c.moveTo(-r * 0.2, -r * 0.98); c.lineTo(-r * 0.28, -r * 1.25);
        c.moveTo(0, -r); c.lineTo(r * 0.02, -r * 1.3);
        c.moveTo(r * 0.2, -r * 0.98); c.lineTo(r * 0.3, -r * 1.22);
        stroke(c, OUT * 0.8);
        break;
      }
      case "bob": {
        // a tidy grey bob, in halftone
        c.beginPath();
        c.arc(0, 0, r * 1.08, Math.PI * 0.92, Math.PI * 2.08);
        c.quadraticCurveTo(r * 0.6, -r * 0.62, 0, -r * 0.6);
        c.quadraticCurveTo(-r * 0.6, -r * 0.62, Math.cos(Math.PI * 0.92) * r * 1.08, Math.sin(Math.PI * 0.92) * r * 1.08);
        c.closePath();
        fill(c, T.paper);
        c.save(); c.clip(); c.beginPath(); c.rect(-r * 2, -r * 2, r * 4, r * 4); dots(c); c.restore();
        c.beginPath();
        c.arc(0, 0, r * 1.08, Math.PI * 0.92, Math.PI * 2.08);
        c.quadraticCurveTo(r * 0.6, -r * 0.62, 0, -r * 0.6);
        c.quadraticCurveTo(-r * 0.6, -r * 0.62, Math.cos(Math.PI * 0.92) * r * 1.08, Math.sin(Math.PI * 0.92) * r * 1.08);
        c.closePath();
        stroke(c, OUT);
        break;
      }
      case "bowl": {
        // matching bowl cuts, straight across
        c.beginPath();
        c.arc(0, 0, r * 1.06, Math.PI * 0.97, Math.PI * 2.03);
        c.lineTo(r * 1.0, -r * 0.42);
        c.lineTo(-r * 1.0, -r * 0.42);
        c.closePath();
        fill(c, T.ink, OUT * 0.6, T.ink);
        c.beginPath();
        c.moveTo(-r * 0.6, -r * 0.42); c.lineTo(-r * 0.6, -r * 0.62);
        c.moveTo(r * 0.1, -r * 0.42); c.lineTo(r * 0.1, -r * 0.66);
        stroke(c, OUT * 0.5, T.paper);
        break;
      }
      case "flatcap": {
        c.beginPath();
        c.moveTo(-r * 1.04, -r * 0.3);
        c.quadraticCurveTo(-r * 0.9, -r * 1.2, r * 0.2, -r * 1.12);
        c.quadraticCurveTo(r * 1.1, -r * 1.0, r * 1.38, -r * 0.42);
        c.quadraticCurveTo(r * 0.2, -r * 0.34, -r * 1.04, -r * 0.3);
        c.closePath();
        fill(c, T.paper, OUT);
        c.save(); c.clip(); c.beginPath(); c.rect(-r * 2, -r * 2, r * 4, r * 4); dots(c); c.restore();
        c.beginPath();
        c.moveTo(-r * 1.04, -r * 0.3);
        c.quadraticCurveTo(-r * 0.9, -r * 1.2, r * 0.2, -r * 1.12);
        c.quadraticCurveTo(r * 1.1, -r * 1.0, r * 1.38, -r * 0.42);
        c.quadraticCurveTo(r * 0.2, -r * 0.34, -r * 1.04, -r * 0.3);
        c.closePath();
        stroke(c, OUT);
        break;
      }
    }
  }

  function face(c, r, look, f) {
    var mood = f.mood || "idle";
    var gx = f.gx || 0, gy = f.gy || 0;
    var k = r / 13.5;   // the face was drawn for a head of 13.5
    c.save();
    c.scale(k, k);
    var HY = 0;
    [-1, 1].forEach(function (side) {
      var ex = side * 5, ey = HY + 0.6;
      if (mood === "busy" || f.blink) {
        // eyes down at the paperwork
        c.beginPath();
        c.moveTo(ex - 3, ey + 0.6);
        c.quadraticCurveTo(ex, ey + 2.4, ex + 3, ey + 0.6);
        stroke(c, 1.6);
        return;
      }
      ell(c, ex, ey, 3.2, mood === "shock" ? 4.6 : 3.9);
      fill(c, T.paper, 1.2);
      var px = ex + gx * 1.35, py = ey + gy * 1.6;
      ell(c, px, py, mood === "shock" ? 0.9 : 1.3, mood === "shock" ? 0.9 : 1.4);
      fill(c, T.ink);
    });
    if (look.glasses) {
      c.beginPath();
      rrPath(c, -9.6, -3.6, 8.6, 8.2, 2);
      rrPath(c, 1, -3.6, 8.6, 8.2, 2);
      c.moveTo(-1, -0.5); c.lineTo(1, -0.5);
      stroke(c, 1.6);
      if (look.chain) {
        c.beginPath();
        c.moveTo(-9.6, 1); c.quadraticCurveTo(-13, 10, -11, 15);
        c.moveTo(9.6, 1); c.quadraticCurveTo(13, 10, 11, 15);
        stroke(c, 0.7);
      }
    }
    // eyebrows: down at the middle, furious at all times
    c.beginPath();
    if (mood === "sad" || mood === "sweat") {
      c.moveTo(-1.6, -7.4); c.lineTo(-8.4, -4.6);
      c.moveTo(1.6, -7.4); c.lineTo(8.4, -4.6);
    } else {
      var steep = mood === "shout" ? 1.4 : mood === "shock" ? -1 : 0;
      c.moveTo(-1.4, -4.4 + steep * 0.4); c.lineTo(-8.6, -7.4 - steep);
      c.moveTo(1.4, -4.4 + steep * 0.4); c.lineTo(8.6, -7.4 - steep);
    }
    stroke(c, 2.3);
    var my = 7.6;
    if (mood === "shout" || mood === "shock") {
      ell(c, 0, my + 0.4, 3.8, mood === "shock" ? 2.4 : 2.6 + (f.talk || 0) * 1.2);
      fill(c, T.ink);
      if (mood === "shout") { ell(c, 0, my + 1.8, 2, 0.9); fill(c, T.red); }
    } else if (mood === "talk") {
      ell(c, 0, my, 2.6, 0.8 + (f.talk || 0) * 1.8);
      fill(c, T.ink);
    } else if (mood === "sad" || mood === "sweat") {
      c.beginPath();
      c.moveTo(-4, my + 1.8);
      c.quadraticCurveTo(0, my - 2.2, 4, my + 1.8);
      stroke(c, 1.5);
    } else if (mood === "smug") {
      c.beginPath();
      c.moveTo(-3.8, my + 0.6);
      c.quadraticCurveTo(1, my + 1.4, 4.2, my - 1.2);
      stroke(c, 1.5);
    } else {
      c.beginPath();
      c.moveTo(-4.4, my + 1);
      c.quadraticCurveTo(0, my - 1.8, 4.4, my + 1);
      stroke(c, 1.5);
    }
    if (look.tache) {
      c.beginPath();
      c.moveTo(-5.8, my - 0.6);
      c.quadraticCurveTo(-3, my - 4, 0, my - 2.6);
      c.quadraticCurveTo(3, my - 4, 5.8, my - 0.6);
      c.quadraticCurveTo(0, my - 1.6, -5.8, my - 0.6);
      fill(c, T.ink);
    }
    // the second chin
    c.beginPath();
    c.moveTo(-6.2, 11.4);
    c.quadraticCurveTo(0, 13.6, 6.2, 11.4);
    stroke(c, 1.2);
    // sweat: two white drops with an ink edge
    if (f.sweat) {
      [[11.5, -6, 1], [-12.5, -2, 0.8]].forEach(function (d, i) {
        if (i && f.sweat < 0.6) return;
        var dy = ((f.time || 0) * 9 + i * 5) % 8;
        c.beginPath();
        c.moveTo(d[0], d[1] + dy - 2.4 * d[2]);
        c.quadraticCurveTo(d[0] + 1.8 * d[2], d[1] + dy + 0.6, d[0], d[1] + dy + 1.6 * d[2]);
        c.quadraticCurveTo(d[0] - 1.8 * d[2], d[1] + dy + 0.6, d[0], d[1] + dy - 2.4 * d[2]);
        fill(c, T.paper, 0.9);
      });
    }
    c.restore();
  }

  // A mitten hand at x, y (radius r), with an outline
  function mitten(c, x, y, r) {
    ell(c, x, y, r, r * 0.86);
    fill(c, T.paper, OUT * 0.8);
    ell(c, x - r * 0.7, y - r * 0.2, r * 0.38, r * 0.3, -0.5);
    fill(c, T.paper, OUT * 0.6);
  }

  // A rubber stamp in a hand, coming down on the desk. k: 0 up, 1 down.
  function stamper(c, x, y, r, k) {
    var lift = (1 - k) * r * 1.4;
    rr(c, x - r * 0.42, y - r * 0.36 - lift, r * 0.84, r * 0.36, r * 0.06);
    fill(c, T.red, OUT * 0.7);
    rr(c, x - r * 0.12, y - r * 1.05 - lift, r * 0.24, r * 0.7, r * 0.1);
    fill(c, T.paper, OUT * 0.7);
    mitten(c, x, y - r * 1.2 - lift, r * 0.42);
  }

  // ---------------------------------------------------------------------------
  // Furniture
  // ---------------------------------------------------------------------------
  // A desk: top edge at y, w wide, h deep. Front panel in ink with a paper rim.
  function desk(c, x, y, w, h) {
    rr(c, x - w / 2, y, w, h, 0.8);
    fill(c, T.paper, OUT);
    c.save();
    rr(c, x - w / 2, y, w, h, 0.8);
    c.clip();
    c.beginPath();
    c.rect(x - w / 2, y + h * 0.22, w, h);
    dots(c, true);
    c.restore();
    rr(c, x - w / 2 - 0.8, y - 0.8, w + 1.6, 2, 0.6);
    fill(c, T.paper, OUT);
  }

  // A hanging sign: the department's name, and how to send things there
  function sign(c, x, y, name, key, size, lit, shut) {
    font(c, size);
    var ks = Math.max(size * 0.62, 3.8);
    font(c, ks);
    var kw = key ? textWidth(c, key.toUpperCase(), ks) : 0;
    font(c, size);
    var w = Math.max(textWidth(c, name.toUpperCase(), size), kw) + size * 1.4;
    var h = size * 1.45 + (key ? ks * 1.05 : 0);
    // the two strings it hangs from
    c.beginPath();
    c.moveTo(x - w * 0.3, y - h / 2); c.lineTo(x - w * 0.22, y - h / 2 - size * 0.9);
    c.moveTo(x + w * 0.3, y - h / 2); c.lineTo(x + w * 0.22, y - h / 2 - size * 0.9);
    stroke(c, size * 0.1, T.paper);
    rr(c, x - w / 2, y - h / 2, w, h, size * 0.2);
    fill(c, shut ? T.ink : lit ? T.accent : T.paper, size * 0.14, shut ? T.paper : T.ink);
    c.fillStyle = shut ? T.paper : T.ink;
    c.textAlign = "center";
    c.textBaseline = "middle";
    font(c, size);
    text(c, name.toUpperCase(), x, y - (key ? ks * 0.52 : 0) + size * 0.05, size);
    if (key) {
      font(c, ks);
      c.fillStyle = shut ? T.paper : T.ink;
      text(c, key.toUpperCase(), x, y + size * 0.5, ks);
    }
    return { x: x - w / 2, y: y - h / 2, w: w, h: h };
  }

  // An in-tray: a wire tray with n things in it, and pips for its capacity
  function tray(c, x, y, w, items, cap, flash) {
    var h = w * 0.3;
    // the stack
    var n = items.length;
    for (var i = 0; i < n; i++) {
      var it = items[i];
      var sx = x + ((i * 37) % 7 - 3) * w * 0.02;
      (FOOD[it.food] || FOOD.burger)(c, sx, y - h * 0.4 - i * w * 0.13, w * 0.5);
    }
    c.beginPath();
    c.moveTo(x - w / 2, y - h);
    c.lineTo(x - w / 2 + w * 0.06, y);
    c.lineTo(x + w / 2 - w * 0.06, y);
    c.lineTo(x + w / 2, y - h);
    stroke(c, OUT * 1.4, T.ink);
    c.beginPath();
    c.moveTo(x - w / 2, y - h);
    c.lineTo(x - w / 2 + w * 0.06, y);
    c.lineTo(x + w / 2 - w * 0.06, y);
    c.lineTo(x + w / 2, y - h);
    stroke(c, OUT * 0.6, flash ? T.red : T.paper);
    // capacity: a pip each, filled for each thing in the tray
    var pr = Math.min(w * 0.07, w * 0.9 / (cap * 2.4));
    for (var p = 0; p < cap; p++) {
      var px = x - (cap - 1) * pr * 1.3 + p * pr * 2.6;
      ell(c, px, y + pr * 2.2, pr, pr);
      var full = p < n;
      fill(c, full ? (n >= cap ? T.red : T.paper) : T.ink, OUT * 0.5, T.paper);
    }
  }

  // The plate in the middle, where each item sits to be sorted
  function plate(c, x, y, r, glow) {
    ell(c, x, y + r * 0.12, r * 1.05, r * 0.42);
    fill(c, T.ink);
    ell(c, x, y, r, r * 0.4);
    fill(c, T.paper, OUT);
    ell(c, x, y, r * 0.72, r * 0.27);
    stroke(c, OUT * 0.6);
    if (glow) {
      ell(c, x, y, r * 1.12, r * 0.5);
      stroke(c, OUT * 0.8, T.accent);
    }
  }

  // The chute: a tube from the intake at the top down to the plate
  function chute(c, x, y0, y1, w) {
    rr(c, x - w / 2, y0, w, y1 - y0, w * 0.1);
    fill(c, T.ink, OUT * 1.1, T.paper);
    c.save();
    rr(c, x - w / 2, y0, w, y1 - y0, w * 0.1);
    c.clip();
    // a glint down the glass
    c.beginPath();
    c.moveTo(x - w * 0.36, y0 + 1); c.lineTo(x - w * 0.36, y1 - 1);
    stroke(c, OUT * 0.7, T.paper);
    c.globalAlpha = 0.5;
    c.beginPath();
    c.moveTo(x - w * 0.26, y0 + 1); c.lineTo(x - w * 0.26, y1 - 1);
    stroke(c, OUT * 0.35, T.paper);
    c.restore();
    // the mouth of it, at the bottom
    rr(c, x - w * 0.62, y1 - 1.4, w * 1.24, 2.4, 0.8);
    fill(c, T.paper, OUT);
  }

  // The intake at the top: a drive-thru board over the chute. When the
  // speaker's talking, its words run along the board in mint; otherwise it
  // says what it is. t: a clock for the scrolling. open: the flap, 0..1.
  // still: reduced motion, so a long line shows a few words at a time
  // instead of scrolling
  function board(c, x, y, w, h, msg, t, open, still) {
    // the flap the food drops through, under the board
    rr(c, x - w * 0.22, y + h - 0.6 + open * 1.4, w * 0.44, 2.2, 0.6);
    fill(c, T.ink, OUT * 0.6, T.paper);
    rr(c, x - w / 2, y, w, h, h * 0.22);
    fill(c, T.paper, OUT);
    var sx = x - w / 2 + h * 0.18, sy = y + h * 0.18, sw = w - h * 0.36, sh = h * 0.64;
    rr(c, sx, sy, sw, sh, h * 0.1);
    fill(c, T.ink);
    c.save();
    rr(c, sx, sy, sw, sh, h * 0.1);
    c.clip();
    var size = sh * 0.7;
    font(c, size);
    c.textBaseline = "middle";
    var str = (msg || "Intake").toUpperCase();
    var tw = textWidth(c, str, size);
    c.fillStyle = msg ? T.accent : T.paper;
    c.textAlign = "left";
    if (tw <= sw - size * 0.6) {
      text(c, str, x - tw / 2, sy + sh / 2 + size * 0.06, size);
    } else if (still) {
      // split into pieces that fit, and show each in turn
      var words = str.split(" "), parts = [], cur = "";
      words.forEach(function (wd) {
        var next = cur ? cur + " " + wd : wd;
        if (cur && textWidth(c, next, size) > sw - size * 0.6) { parts.push(cur); cur = wd; } else cur = next;
      });
      if (cur) parts.push(cur);
      var part = parts[Math.floor(t * 0.8) % parts.length];
      text(c, part, x - textWidth(c, part, size) / 2, sy + sh / 2 + size * 0.06, size);
    } else {
      // too long for the board: it scrolls, the way they do
      var span = tw + sw * 0.6, off = (t * size * 4) % span;
      text(c, str, sx + sw - size * 0.3 - off + (off > tw + sw * 0.3 ? span : 0), sy + sh / 2 + size * 0.06, size);
      text(c, str, sx + sw - size * 0.3 - off + span, sy + sh / 2 + size * 0.06, size);
    }
    // LED dots over it
    c.globalAlpha = 0.35;
    c.beginPath();
    c.rect(sx, sy, sw, sh);
    c.fillStyle = shadeLight(c);
    c.fill();
    c.restore();
    // two bolts
    ell(c, x - w / 2 + h * 0.09, y + h / 2, h * 0.05, h * 0.05); fill(c, T.ink);
    ell(c, x + w / 2 - h * 0.09, y + h / 2, h * 0.05, h * 0.05); fill(c, T.ink);
  }

  // The pipes gauge: a glass tube with the clog in it, by the Heart.
  // k: how full (0..1). alarm: flashing.
  function gauge(c, x, y, w, h, k, alarm, time) {
    rr(c, x - w / 2 - 0.8, y - 0.8, w + 1.6, h + 1.6, w * 0.5);
    fill(c, T.ink, OUT, T.paper);
    var fh = Math.max(0, Math.min(1, k)) * (h - 1.2);
    c.save();
    rr(c, x - w / 2 + 0.6, y + 0.6, w - 1.2, h - 1.2, (w - 1.2) * 0.5);
    c.clip();
    if (fh > 0) {
      // the clog: red, with bubbles of grease rising in it
      var top = y + h - 0.6 - fh;
      c.beginPath();
      c.moveTo(x - w, y + h);
      c.lineTo(x - w, top + Math.sin(time * 3) * 0.4);
      c.quadraticCurveTo(x, top - 0.8 + Math.sin(time * 4) * 0.5, x + w, top + Math.cos(time * 3) * 0.4);
      c.lineTo(x + w, y + h);
      c.closePath();
      c.fillStyle = alarm && Math.floor(time * 4) % 2 ? T.paper : T.red;
      c.fill();
      c.save(); c.clip(); c.beginPath(); c.rect(x, top - 2, w, fh + 4); dots(c); c.restore();
      for (var i = 0; i < 3; i++) {
        var by = y + h - ((time * 4 + i * 7) % Math.max(1, fh));
        ell(c, x - w * 0.15 + i * w * 0.12, by, w * 0.08, w * 0.08);
        stroke(c, OUT * 0.4, T.paper);
      }
    }
    c.restore();
    // marks up the side
    c.beginPath();
    for (var m = 1; m < 4; m++) { c.moveTo(x + w / 2 - 0.2, y + h * m / 4); c.lineTo(x + w / 2 + 1.2, y + h * m / 4); }
    stroke(c, OUT * 0.5, T.paper);
  }

  // The hatch: a porthole in the floor marked Flush. ready: 0..1 recharge.
  function hatch(c, x, y, r, ready, spin, label) {
    ell(c, x, y, r * 1.18, r * 1.18);
    fill(c, T.paper, OUT);
    ell(c, x, y, r, r);
    fill(c, T.ink, OUT * 0.6);
    // the swirl inside
    c.save();
    c.translate(x, y);
    c.rotate(spin);
    c.beginPath();
    for (var a = 0; a < 3; a++) {
      c.moveTo(0, 0);
      c.quadraticCurveTo(Math.cos(a * 2.1) * r * 0.8, Math.sin(a * 2.1) * r * 0.8, Math.cos(a * 2.1 + 1.2) * r * 0.85, Math.sin(a * 2.1 + 1.2) * r * 0.85);
    }
    stroke(c, OUT * 0.7, ready >= 1 ? T.accent : T.paper);
    c.restore();
    // the recharge, as a mint arc round the rim
    if (ready < 1) {
      c.beginPath();
      c.arc(x, y, r * 1.18, -Math.PI / 2, -Math.PI / 2 + TAU * ready);
      stroke(c, OUT * 1.6, T.accent);
    } else {
      ell(c, x, y, r * 1.18, r * 1.18);
      stroke(c, OUT * 1.4, T.accent);
    }
    if (label) label_(c, label, x, y + r * 1.9, Math.max(3.8, r * 0.62));
  }
  function label_(c, str, x, y, size) { label(c, str, x, y, size); }

  // A plunger, held at x, y and pointing up and out
  function plunger(c, x, y, s, rot) {
    c.save();
    c.translate(x, y);
    c.rotate(rot || 0);
    c.beginPath();
    c.moveTo(0, 0); c.lineTo(0, -s);
    stroke(c, s * 0.16, T.ink);
    c.beginPath();
    c.moveTo(0, 0); c.lineTo(0, -s);
    stroke(c, s * 0.08, T.paper);
    c.beginPath();
    c.moveTo(-s * 0.3, -s);
    c.quadraticCurveTo(-s * 0.32, -s * 1.38, 0, -s * 1.38);
    c.quadraticCurveTo(s * 0.32, -s * 1.38, s * 0.3, -s);
    c.closePath();
    fill(c, T.red, OUT * 0.7);
    c.restore();
  }

  // ---------------------------------------------------------------------------
  // Overlays
  // ---------------------------------------------------------------------------
  // A speech bubble with a tail to (tx, ty). size: the capitals' height.
  function bubble(c, x, y, lines, size, tx, ty, alpha, maxX, minX) {
    font(c, size);
    var w = 0;
    lines.forEach(function (l) { w = Math.max(w, textWidth(c, l.toUpperCase(), size)); });
    w += size * 1.2;
    var lh = size * 1.08, h = lines.length * lh + size * 0.75;
    var bx = x - w / 2, by = y - h / 2;
    if (maxX != null && bx + w > maxX) bx = maxX - w;
    if (minX != null && bx < minX) bx = minX;
    var r = Math.min(size * 0.7, h / 2);
    c.save();
    c.globalAlpha *= alpha == null ? 1 : alpha;
    c.beginPath();
    rrPath(c, bx, by, w, h, r);
    c.fillStyle = T.paper;
    c.fill();
    pen(c, size * 0.2);
    c.stroke();
    // the tail: from the side facing the speaker, or the top or bottom
    var below = ty > by + h, above = ty < by;
    var leftT = !below && !above && tx < bx, rightT = !below && !above && tx > bx + w;
    if (leftT || rightT) {
      var ex = leftT ? bx : bx + w, cy0 = Math.max(by + r, Math.min(by + h - r, ty)), sw2 = size * 0.4;
      var tip = leftT ? Math.max(tx, ex - size * 1.4) : Math.min(tx, ex + size * 1.4);
      c.beginPath();
      c.moveTo(ex, cy0 - sw2);
      c.lineTo(tip, cy0 + (ty - cy0) * 0.5);
      c.lineTo(ex, cy0 + sw2);
      c.closePath();
      c.fillStyle = T.paper;
      c.fill();
      c.beginPath();
      c.moveTo(ex, cy0 - sw2);
      c.lineTo(tip, cy0 + (ty - cy0) * 0.5);
      c.lineTo(ex, cy0 + sw2);
      pen(c, size * 0.2);
      c.stroke();
      c.beginPath();
      c.moveTo(ex, cy0 - sw2 * 0.6); c.lineTo(ex, cy0 + sw2 * 0.6);
      pen(c, size * 0.3, T.paper);
      c.stroke();
    }
    var cx0 = Math.max(bx + r + size * 0.4, Math.min(bx + w - r - size * 0.4, tx));
    var tw = size * 0.45;
    if (below || above) {
      var ey = below ? by + h : by;
      c.beginPath();
      c.moveTo(cx0 - tw, ey);
      c.lineTo(cx0 + (tx - cx0) * 0.5, below ? Math.min(ty, ey + size * 1.4) : Math.max(ty, ey - size * 1.4));
      c.lineTo(cx0 + tw, ey);
      c.closePath();
      c.fillStyle = T.paper;
      c.fill();
      c.beginPath();
      c.moveTo(cx0 - tw, ey);
      c.lineTo(cx0 + (tx - cx0) * 0.5, below ? Math.min(ty, ey + size * 1.4) : Math.max(ty, ey - size * 1.4));
      c.lineTo(cx0 + tw, ey);
      pen(c, size * 0.2);
      c.stroke();
    }
    c.fillStyle = T.ink;
    c.textAlign = "center";
    c.textBaseline = "middle";
    font(c, size);
    lines.forEach(function (l, i) { text(c, l.toUpperCase(), bx + w / 2, by + size * 0.4 + lh * (i + 0.5) + size * 0.05, size); });
    c.restore();
    return { x: bx, y: by, w: w, h: h };
  }

  function bubbleWidth(c, lines, size) {
    font(c, size);
    var w = 0;
    lines.forEach(function (l) { w = Math.max(w, textWidth(c, l.toUpperCase(), size)); });
    return w + size * 1.2;
  }

  // A small rubber stamp: paper, a red double border, red capitals
  function stamp(c, x, y, word, size, tilt, alpha, grow) {
    c.save();
    c.globalAlpha *= alpha == null ? 1 : alpha;
    c.translate(x, y);
    c.rotate(tilt || 0);
    c.scale(grow || 1, grow || 1);
    font(c, size);
    var w = textWidth(c, word.toUpperCase(), size) + size * 1.1, h = size * 1.55;
    c.fillStyle = T.paper;
    c.fillRect(-w / 2, -h / 2, w, h);
    c.lineWidth = size * 0.13;
    c.strokeStyle = T.red;
    c.strokeRect(-w / 2, -h / 2, w, h);
    c.lineWidth = size * 0.06;
    c.strokeRect(-w / 2 + size * 0.22, -h / 2 + size * 0.22, w - size * 0.44, h - size * 0.44);
    c.fillStyle = T.red;
    c.textAlign = "center";
    c.textBaseline = "middle";
    text(c, word.toUpperCase(), 0, size * 0.06, size);
    c.restore();
  }

  // Corner brackets round a box
  function brackets(c, x, y, w, h, colour, len, width) {
    len = len || Math.min(w, h) * 0.22;
    c.beginPath();
    [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]].forEach(function (p) {
      c.moveTo(p[0] + p[2] * len, p[1]);
      c.lineTo(p[0], p[1]);
      c.lineTo(p[0], p[1] + p[3] * len);
    });
    c.lineCap = "square";
    c.lineJoin = "miter";
    c.lineWidth = (width || 0.8) + 0.7;
    c.strokeStyle = T.ink;
    c.stroke();
    c.lineWidth = width || 0.8;
    c.strokeStyle = colour;
    c.stroke();
  }

  // A bobbing arrow pointing down at x, y, with a word over it
  function arrow(c, x, y, word, size, dir) {
    c.save();
    c.translate(x, y);
    var s = size / 22;
    c.save();
    c.scale(s, s);
    if (dir === "left") c.rotate(Math.PI / 2);
    else if (dir === "right") c.rotate(-Math.PI / 2);
    else if (dir === "up") c.rotate(Math.PI);
    c.beginPath();
    c.moveTo(-5, -22); c.lineTo(5, -22); c.lineTo(5, -12); c.lineTo(11, -12); c.lineTo(0, 0); c.lineTo(-11, -12); c.lineTo(-5, -12);
    c.closePath();
    fill(c, T.paper, 2);
    c.restore();
    if (word) {
      var off = dir === "left" ? [size * 1.15, 0, "left"] : dir === "right" ? [-size * 1.15, 0, "right"] : dir === "up" ? [0, size * 1.45, "center"] : [0, -size * 1.45, "center"];
      label(c, word, off[0], off[1], Math.max(size * 0.5, 3.8), off[2]);
    }
    c.restore();
  }

  // Smoke: white circles with the accent offset behind (DESIGN.md, section 7)
  function puff(c, x, y, r, k) {
    var blobs = [[0, 0, 0.6], [-0.55, 0.2, 0.42], [0.55, 0.15, 0.45], [0.1, -0.45, 0.4]];
    var grow = 0.7 + k * 0.9, rise = k * r * 1.6;
    c.save();
    c.globalAlpha *= Math.max(0, 1 - k * k);
    blobs.forEach(function (b) {
      c.fillStyle = T.accent;
      c.beginPath(); c.arc(x + b[0] * r * grow + r * 0.16, y + b[1] * r * grow - rise + r * 0.16, b[2] * r * grow, 0, TAU); c.fill();
    });
    blobs.forEach(function (b) {
      c.fillStyle = T.paper;
      c.beginPath(); c.arc(x + b[0] * r * grow, y + b[1] * r * grow - rise, b[2] * r * grow, 0, TAU); c.fill();
    });
    c.restore();
  }

  // A splat of clog: an ink-edged red blob with drips
  function splat(c, x, y, r, k) {
    c.save();
    c.globalAlpha *= Math.max(0, 1 - k);
    c.beginPath();
    for (var i = 0; i <= 10; i++) {
      var a = (i / 10) * TAU, rr2 = r * (i % 2 ? 0.65 : 1) * (0.6 + k * 0.6);
      var px = x + Math.cos(a) * rr2, py = y + Math.sin(a) * rr2 * 0.7;
      if (i) c.lineTo(px, py); else c.moveTo(px, py);
    }
    c.closePath();
    fill(c, T.red, OUT * 0.8);
    c.restore();
  }

  // White motion lines behind something moving towards (x1, y1)
  function motion(c, x0, y0, x1, y1, w) {
    var dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy) || 1;
    var ux = dx / d, uy = dy / d, nx = -uy, ny = ux;
    c.beginPath();
    [-1, 0, 1].forEach(function (o) {
      var bx = x1 - ux * w * 0.7 + nx * o * w * 0.3, by = y1 - uy * w * 0.7 + ny * o * w * 0.3;
      var len = w * (o ? 0.6 : 1);
      c.moveTo(bx, by);
      c.lineTo(bx - ux * len, by - uy * len);
    });
    stroke(c, Math.max(0.4, w * 0.08), T.paper);
  }

  window.ThirtyDaysArt = {
    init: init,
    KINDS: KINDS,
    FOOD: FOOD,
    shade: shade, shadeLight: shadeLight, dots: dots,
    rr: rr, ell: ell, fill: fill, stroke: stroke, pen: pen,
    font: font, text: text, textWidth: textWidth, label: label,
    sticker: sticker, item: item, kindIcon: kindIcon,
    clerk: clerk, mitten: mitten, stamper: stamper,
    desk: desk, sign: sign, tray: tray, plate: plate, chute: chute, board: board,
    gauge: gauge, hatch: hatch, plunger: plunger,
    bubble: bubble, bubbleWidth: bubbleWidth, stamp: stamp, brackets: brackets, arrow: arrow, puff: puff, splat: splat, motion: motion
  };
})();
