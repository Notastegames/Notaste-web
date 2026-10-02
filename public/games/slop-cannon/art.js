// Slop Cannon: the drawings. The Gaffer, the Moderator, the people who post,
// the cannon, the vat, the posts in the feed and the slop itself, all drawn in
// code: outline first, flat fill, four inks, halftone for shade (DESIGN.md,
// section 7). Everything is in world units (100 across the screen's short
// side), with characters standing on 0,0 and up being negative.
(function () {
  "use strict";

  var T = null;          // colour tokens, set by init()
  var SCALE = 1;         // device pixels per world unit
  var tiles = {};        // halftone tiles, one per colour

  function init(tokens, scale) {
    T = tokens;
    if (scale !== SCALE) tiles = {};
    SCALE = scale;
  }

  // Halftone dots in one ink, about one world unit apart, for shading.
  // The pattern is made in device pixels, so undo the drawing scale.
  function dots(c, colour, size) {
    var key = colour + (size || 1);
    var tile = tiles[key];
    if (!tile) {
      tile = document.createElement("canvas");
      var n = Math.max(3, Math.round((size || 1) * SCALE));
      tile.width = tile.height = n * 2;
      var x = tile.getContext("2d");
      x.fillStyle = colour;
      [[n / 2, n / 2], [n * 1.5, n * 1.5]].forEach(function (p) {
        x.beginPath();
        x.arc(p[0], p[1], Math.max(0.6, n * 0.2), 0, Math.PI * 2);
        x.fill();
      });
      tiles[key] = tile;
    }
    var pat = c.createPattern(tile, "repeat");
    if (pat.setTransform && window.DOMMatrix) {
      var m = c.getTransform ? c.getTransform() : null;
      var s = m ? Math.hypot(m.a, m.b) : SCALE;
      pat.setTransform(new DOMMatrix().scale(1 / (s || 1)));
    }
    return pat;
  }
  function shade(c) { return dots(c, T.ink); }

  function ink(c, w, colour) {
    c.lineWidth = w;
    c.strokeStyle = colour || T.ink;
    c.lineJoin = "round";
    c.lineCap = "round";
  }
  function oval(c, x, y, rx, ry, fill, w, edge, rot) {
    c.beginPath();
    c.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot || 0, 0, Math.PI * 2);
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (w) { ink(c, w, edge); c.stroke(); }
  }
  function rrect(c, x, y, w, h, r) {
    c.beginPath();
    if (c.roundRect) c.roundRect(x, y, w, h, r);
    else c.rect(x, y, w, h);
  }
  // shade the part of a shape away from the light (top left)
  function crescent(c, path, cx, cy, rx, ry) {
    c.save();
    c.clip(path);
    c.fillStyle = shade(c);
    c.beginPath();
    c.ellipse(cx, cy, rx * 1.1, ry * 1.1, 0, 0, Math.PI * 2);
    c.ellipse(cx - rx * 0.24, cy - ry * 0.26, rx, ry, 0, 0, Math.PI * 2);
    c.fill("evenodd");
    c.restore();
  }

  // Text in the display face, always capitals, shrunk to fit if it must be.
  // A world unit is only a few pixels, and canvas text set that small comes
  // out badly spaced, so it's set ten times bigger and scaled down.
  var F = 10;
  function text(c, words, x, y, size, maxW, opts) {
    opts = opts || {};
    var s = size;
    var str = String(words).toUpperCase();
    c.font = (s * F) + "px " + T.display;
    if (maxW) {
      while (c.measureText(str).width / F > maxW && s > size * 0.68) { s *= 0.94; c.font = (s * F) + "px " + T.display; }
      while (c.measureText(str).width / F > maxW && str.length > 4) str = str.slice(0, -2).replace(/\s+$/, "") + "…";
    }
    c.save();
    c.translate(x, y);
    c.scale(1 / F, 1 / F);
    c.textAlign = opts.align || "left";
    c.textBaseline = opts.base || "middle";
    if (opts.edge) {
      c.lineWidth = (opts.edgeW || s * 0.24) * F;
      c.strokeStyle = opts.edge;
      c.lineJoin = "round";
      c.strokeText(str, 0, 0);
    }
    c.fillStyle = opts.fill || T.ink;
    c.fillText(str, 0, 0);
    c.restore();
    return s;
  }
  function measure(c, words, size) {
    c.font = (size * F) + "px " + T.display;
    return c.measureText(String(words).toUpperCase()).width / F;
  }

  // ---------------------------------------------------------------------------
  // Heads. The house cut-out (DESIGN.md, section 7): white, round, as wide as
  // the shoulders with no neck, oval eyes with small pupils, furious eyebrows,
  // a frown and a second chin. Each wears one thing that tells them apart.
  // o: { mood: cross | shout | calm | tired, gaze: -1 to 1, look, lw }
  // ---------------------------------------------------------------------------
  function head(c, x, y, r, o) {
    o = o || {};
    var lw = o.lw || Math.max(0.3, r * 0.13);
    var g = (o.gaze || 0) * r * 0.2;
    var mood = o.mood || "cross";
    var look = o.look;

    if (look === "perm") {
      [[-0.8, -0.55], [-0.45, -0.88], [0, -1.02], [0.45, -0.88], [0.8, -0.55], [-0.98, -0.12], [0.98, -0.12]].forEach(function (p) {
        oval(c, x + p[0] * r, y + p[1] * r, r * 0.34, r * 0.34, T.red, lw * 0.8);
      });
    }
    if (look === "bun") oval(c, x, y - r * 1.05, r * 0.36, r * 0.32, T.ink, lw * 0.8, T.paper);

    var face = new Path2D();
    face.ellipse(x, y, r, r, 0, 0, Math.PI * 2);
    c.fillStyle = T.paper;
    c.fill(face);
    crescent(c, face, x, y, r, r);
    ink(c, lw);
    c.stroke(face);

    if (look === "fringe" || look === "bun") {
      c.save();
      c.clip(face);
      c.beginPath();
      c.moveTo(x - r * 1.1, y - r * 0.38);
      c.quadraticCurveTo(x - r * 0.4, y - r * 0.62, x + g * 0.5, y - r * 0.5);
      c.quadraticCurveTo(x + r * 0.5, y - r * 0.62, x + r * 1.1, y - r * 0.32);
      c.lineTo(x + r * 1.1, y - r * 1.2);
      c.lineTo(x - r * 1.1, y - r * 1.2);
      c.closePath();
      c.fillStyle = T.ink;
      c.fill();
      c.restore();
      ink(c, lw * 0.7, T.paper);
      c.beginPath();
      c.moveTo(x - r * 0.95, y - r * 0.4);
      c.quadraticCurveTo(x - r * 0.4, y - r * 0.62, x + g * 0.5, y - r * 0.5);
      c.quadraticCurveTo(x + r * 0.5, y - r * 0.62, x + r * 0.95, y - r * 0.36);
      c.stroke();
    }

    // eyes, looking where they're told
    var ex = r * 0.34, ey = y - r * 0.08;
    [-1, 1].forEach(function (s) {
      oval(c, x + s * ex + g, ey, r * 0.2, r * 0.25, T.paper, lw * 0.75);
      var px = x + s * ex + g + (o.gaze || 0) * r * 0.08 - s * r * 0.03;
      oval(c, px, ey + (mood === "tired" ? r * 0.06 : r * 0.03), r * 0.085, r * 0.085, T.ink);
    });
    if (mood === "tired") {
      // bags under the eyes
      ink(c, lw * 0.6);
      [-1, 1].forEach(function (s) {
        c.beginPath();
        c.arc(x + s * ex + g, ey + r * 0.2, r * 0.16, 0.3, Math.PI - 0.3);
        c.stroke();
      });
    }
    if (look === "specs") {
      ink(c, lw * 0.8);
      [-1, 1].forEach(function (s) { c.beginPath(); c.ellipse(x + s * ex + g, ey, r * 0.29, r * 0.31, 0, 0, Math.PI * 2); c.stroke(); });
      c.beginPath(); c.moveTo(x - ex + g + r * 0.29, ey); c.lineTo(x + ex + g - r * 0.29, ey); c.stroke();
    }

    // eyebrows
    ink(c, lw * 1.35);
    c.beginPath();
    [-1, 1].forEach(function (s) {
      var ox = x + g + s * r * 0.6, ix = x + g + s * r * 0.1;
      if (mood === "calm") { c.moveTo(ox, y - r * 0.43); c.lineTo(ix, y - r * 0.47); }
      else if (mood === "tired") { c.moveTo(ox, y - r * 0.32); c.lineTo(ix, y - r * 0.47); }
      else { c.moveTo(ox, y - r * 0.56); c.lineTo(ix, y - r * 0.3); }
    });
    c.stroke();

    // mouth
    var mx = x + g * 1.1, my = y + r * 0.44;
    if (mood === "shout") {
      oval(c, mx, my, r * 0.25, r * 0.21, T.ink);
      oval(c, mx, my + r * 0.1, r * 0.13, r * 0.07, T.red);
    } else if (mood === "calm") {
      ink(c, lw * 0.9);
      c.beginPath(); c.moveTo(mx - r * 0.17, my); c.quadraticCurveTo(mx, my + r * 0.06, mx + r * 0.17, my); c.stroke();
    } else {
      ink(c, lw * 0.95);
      c.beginPath(); c.moveTo(mx - r * 0.24, my + r * 0.07); c.quadraticCurveTo(mx, my - r * 0.11, mx + r * 0.24, my + r * 0.07); c.stroke();
    }
    if (look === "tache") {
      c.beginPath();
      c.moveTo(mx - r * 0.34, my - r * 0.02);
      c.quadraticCurveTo(mx, my - r * 0.3, mx + r * 0.34, my - r * 0.02);
      c.quadraticCurveTo(mx, my - r * 0.12, mx - r * 0.34, my - r * 0.02);
      c.fillStyle = T.ink;
      c.fill();
    }
    // the second chin
    ink(c, lw * 0.7);
    c.beginPath();
    c.moveTo(mx - r * 0.3, y + r * 0.74);
    c.quadraticCurveTo(mx, y + r * 0.86, mx + r * 0.3, y + r * 0.74);
    c.stroke();

    // hats, on top
    if (look === "bald") {
      ink(c, lw * 0.6);
      [-0.22, 0, 0.22].forEach(function (k) {
        c.beginPath();
        c.moveTo(x + k * r, y - r * 0.98);
        c.quadraticCurveTo(x + k * r + r * 0.12, y - r * 1.3, x + k * r + r * 0.3, y - r * 1.22);
        c.stroke();
      });
    } else if (look === "cap") {
      c.beginPath();
      c.moveTo(x - r * 0.98, y - r * 0.32);
      c.quadraticCurveTo(x - r, y - r * 1.12, x, y - r * 1.12);
      c.quadraticCurveTo(x + r, y - r * 1.12, x + r * 0.98, y - r * 0.32);
      c.closePath();
      c.fillStyle = T.accent; c.fill(); ink(c, lw); c.stroke();
      var dir = (o.gaze || 0) >= 0 ? 1 : -1;
      oval(c, x + dir * r * 0.75, y - r * 0.36, r * 0.62, r * 0.17, T.accent, lw);
    } else if (look === "beanie") {
      c.beginPath();
      c.moveTo(x - r * 0.98, y - r * 0.34);
      c.quadraticCurveTo(x - r * 0.95, y - r * 1.2, x, y - r * 1.2);
      c.quadraticCurveTo(x + r * 0.95, y - r * 1.2, x + r * 0.98, y - r * 0.34);
      c.closePath();
      c.fillStyle = T.red; c.fill(); ink(c, lw); c.stroke();
      rrect(c, x - r * 1.02, y - r * 0.5, r * 2.04, r * 0.26, r * 0.1);
      c.fillStyle = T.red; c.fill(); ink(c, lw * 0.8); c.stroke();
      oval(c, x, y - r * 1.26, r * 0.22, r * 0.22, T.paper, lw * 0.8);
    } else if (look === "visor") {
      // the Gaffer's eyeshade: a band round the head and a brim out front
      ink(c, r * 0.24, T.ink);
      c.beginPath(); c.moveTo(x - r * 0.98, y - r * 0.6); c.quadraticCurveTo(x, y - r * 0.82, x + r * 0.98, y - r * 0.6); c.stroke();
      ink(c, r * 0.14, T.accent);
      c.stroke();
      var bx = x + g * 1.6;
      c.beginPath();
      c.moveTo(bx - r * 0.75, y - r * 0.66);
      c.quadraticCurveTo(bx, y - r * 0.92, bx + r * 0.75, y - r * 0.66);
      c.quadraticCurveTo(bx + r * 0.2 + g, y - r * 0.28, bx - r * 0.1 + g * 0.5, y - r * 0.36);
      c.quadraticCurveTo(bx - r * 0.55, y - r * 0.4, bx - r * 0.75, y - r * 0.66);
      c.closePath();
      c.fillStyle = T.accent; c.fill(); ink(c, lw); c.stroke();
    }
  }

  // ---------------------------------------------------------------------------
  // The Gaffer: runs the content farm, stands behind the cannon, shouts.
  // Slime-green eyeshade, a shirt, a red tie, a clipboard. About 30 units tall.
  // o: { shout, slopped, gaze }
  // ---------------------------------------------------------------------------
  function gaffer(c, o) {
    o = o || {};
    var lw = 0.75;
    // shoes and legs
    rrect(c, -4.2, -7.5, 3.4, 7, 1);
    c.fillStyle = T.ink; c.fill(); ink(c, lw * 0.8, T.paper); c.stroke();
    rrect(c, 0.8, -7.5, 3.4, 7, 1);
    c.fill(); c.stroke();
    oval(c, -3.2, -0.9, 3, 1.3, T.ink, lw * 0.8, T.paper);
    oval(c, 3.6, -0.9, 3, 1.3, T.ink, lw * 0.8, T.paper);

    // the back arm
    oval(c, -7.2, -13, 2.4, 4.2, T.paper, lw, null, 0.25);

    // body: shirt, trousers pulled up high, a red tie
    var body = new Path2D();
    body.ellipse(0, -13.5, 8, 8.4, 0, 0, Math.PI * 2);
    c.fillStyle = T.paper;
    c.fill(body);
    c.save();
    c.clip(body);
    c.fillStyle = T.ink;
    c.fillRect(-9, -9.6, 18, 6);
    ink(c, 0.7, T.paper);
    c.beginPath(); c.moveTo(-9, -9.6); c.lineTo(9, -9.6); c.stroke();
    c.restore();
    crescent(c, body, 0, -13.5, 8, 8.4);
    // tie
    c.beginPath();
    c.moveTo(-1.1, -21); c.lineTo(1.1, -21); c.lineTo(0.7, -19.6);
    c.lineTo(1.7, -11.2); c.lineTo(0, -9.8); c.lineTo(-1.7, -11.2); c.lineTo(-0.7, -19.6);
    c.closePath();
    c.fillStyle = T.red; c.fill(); ink(c, lw * 0.7); c.stroke();
    ink(c, lw);
    c.stroke(body);

    // the clipboard, held in front
    c.save();
    c.translate(-4.4, -12.4);
    c.rotate(-0.18);
    rrect(c, -2.8, -3.6, 5.6, 7.2, 0.5);
    c.fillStyle = T.paper; c.fill(); ink(c, lw * 0.8); c.stroke();
    c.fillStyle = T.ink;
    c.fillRect(-1.2, -4.2, 2.4, 1.2);
    ink(c, 0.35);
    c.beginPath();
    for (var i = 0; i < 3; i++) { c.moveTo(-1.8, -1.6 + i * 1.6); c.lineTo(1.8 - (i % 2), -1.6 + i * 1.6); }
    c.stroke();
    c.restore();
    oval(c, -2.4, -11.6, 1.9, 1.7, T.paper, lw * 0.8);

    // the front arm: down by his side, or a fist in the air
    if (o.shout) {
      c.beginPath();
      c.moveTo(6, -17.5);
      c.quadraticCurveTo(9.6, -21, 9.4, -28);
      ink(c, 4.6); c.stroke();
      ink(c, 3, T.paper); c.stroke();
      oval(c, 9.4, -29.2, 2.3, 2.2, T.paper, lw);
    } else {
      oval(c, 7.4, -13, 2.4, 4.4, T.paper, lw, null, -0.25);
      oval(c, 8.4, -8.8, 1.9, 1.8, T.paper, lw * 0.9);
    }

    // the head: big, round, straight on the shoulders
    head(c, 0, -27, 7.2, { mood: o.shout ? "shout" : "cross", gaze: o.gaze != null ? o.gaze : 0.7, look: "visor", lw: lw });

    if (o.slopped) {
      // got some back off a fact check
      c.beginPath();
      c.moveTo(-6.6, -31);
      c.quadraticCurveTo(-5, -36.4, 0, -35.6);
      c.quadraticCurveTo(5.6, -36.6, 6.8, -31.2);
      c.quadraticCurveTo(6.2, -27, 5.2, -29.4);
      c.quadraticCurveTo(4.2, -26, 3.2, -30.2);
      c.quadraticCurveTo(0, -29, -2.4, -30.4);
      c.quadraticCurveTo(-3.6, -25.6, -4.6, -30.2);
      c.quadraticCurveTo(-6, -28.4, -6.6, -31);
      c.closePath();
      c.fillStyle = T.accent; c.fill(); ink(c, lw); c.stroke();
      oval(c, -2, -33.4, 0.9, 0.5, T.paper);
    }
  }

  // ---------------------------------------------------------------------------
  // The Moderator: one of him, in a window cleaner's cradle on the side of
  // the phone, with a lanyard and a very small net on a long pole. The origin
  // is the floor of the cradle. The net's hoop is at NET (from the origin).
  // o: { swing (0-1), full (slop in the net) }
  // ---------------------------------------------------------------------------
  var NET = { x: -16.5, y: -12.5, r: 2.5 };
  function moderator(c, o) {
    o = o || {};
    var lw = 0.6;
    // ropes up to the cradle's frame
    ink(c, 0.5, T.paper);
    // body, mostly behind the cradle board
    var body = new Path2D();
    body.ellipse(0, -8.6, 4.9, 5.2, 0, 0, Math.PI * 2);
    c.fillStyle = T.paper; c.fill(body);
    crescent(c, body, 0, -8.6, 4.9, 5.2);
    ink(c, lw); c.stroke(body);
    // lanyard and pass
    ink(c, 0.55, T.red);
    c.beginPath(); c.moveTo(-1.8, -13.2); c.lineTo(0, -9.2); c.lineTo(1.8, -13.2); c.stroke();
    rrect(c, -1.4, -9.6, 2.8, 3.2, 0.3);
    c.fillStyle = T.paper; c.fill(); ink(c, 0.35); c.stroke();
    c.fillStyle = T.red; c.fillRect(-0.9, -8.9, 1.8, 0.7);
    // the pole and the very small net
    var sw = (o.swing || 0) * 0.5;
    c.save();
    c.translate(-3.6, -9.5);
    c.rotate(-sw);
    var nx = NET.x + 3.6, ny = NET.y + 9.5;
    ink(c, 1.3, T.ink);
    c.beginPath(); c.moveTo(0, 0); c.lineTo(nx + NET.r, ny); c.stroke();
    ink(c, 0.6, T.paper);
    c.stroke();
    // the bag
    c.beginPath();
    c.moveTo(nx - NET.r, ny);
    c.quadraticCurveTo(nx - NET.r * 0.6, ny + NET.r * 2.2, nx + NET.r * 0.2, ny + NET.r * 1.9);
    c.quadraticCurveTo(nx + NET.r, ny + NET.r * 1.2, nx + NET.r, ny);
    c.closePath();
    c.fillStyle = o.full ? T.accent : T.paper;
    c.fill();
    if (!o.full) {
      c.save(); c.clip();
      ink(c, 0.22);
      c.beginPath();
      for (var k = -3; k <= 3; k++) { c.moveTo(nx + k * 0.9 - 2, ny); c.lineTo(nx + k * 0.9 + 2, ny + 5); c.moveTo(nx + k * 0.9 + 2, ny); c.lineTo(nx + k * 0.9 - 2, ny + 5); }
      c.stroke();
      c.restore();
    }
    ink(c, 0.45); c.stroke();
    // the hoop
    oval(c, nx, ny, NET.r, NET.r * 0.42, null, 0.9, T.ink);
    oval(c, nx, ny, NET.r, NET.r * 0.42, null, 0.45, T.paper);
    c.restore();
    // the arm holding it
    oval(c, -4.6, -9.4, 1.9, 1.6, T.paper, lw * 0.8);
    // head: tired and furious, watching what's coming
    head(c, 0, -17.2, 4.7, { mood: "tired", gaze: -0.75, lw: lw });
    // the cradle: a board across the front and a rail
    rrect(c, -6.4, -5.4, 12.8, 6.6, 0.6);
    c.fillStyle = T.paper; c.fill(); ink(c, lw); c.stroke();
    c.save();
    c.clip();
    c.fillStyle = shade(c);
    c.fillRect(1.6, -6, 6, 8);
    c.restore();
    ink(c, 0.5);
    c.beginPath(); c.moveTo(-6.4, -2.2); c.lineTo(6.4, -2.2); c.stroke();
    text(c, "Mod", 0, -3.7, 2.1, 11, { align: "center", fill: T.ink });
  }

  // ---------------------------------------------------------------------------
  // The slop: four things it carries, each drawn round 0,0 with radius s
  // ---------------------------------------------------------------------------
  var ITEMS = ["hand", "dog", "bread", "smiley"];
  function item(c, kind, x, y, s, rot) {
    var lw = Math.max(0.3, s * 0.11);
    c.save();
    c.translate(x, y);
    if (rot) c.rotate(rot);
    if (kind === "hand") {
      // a hand with too many fingers
      var n = 8;
      for (var i = 0; i < n; i++) {
        var a = -Math.PI * 0.92 + (i / (n - 1)) * Math.PI * 0.84;
        var len = s * (0.95 + (i % 2) * 0.12);
        c.beginPath();
        c.moveTo(0, s * 0.15);
        c.lineTo(Math.cos(a) * len, s * 0.15 + Math.sin(a) * len);
        ink(c, s * 0.3); c.stroke();
        ink(c, s * 0.3 - lw * 2, T.paper); c.stroke();
      }
      oval(c, 0, s * 0.3, s * 0.52, s * 0.5, T.paper, lw);
      ink(c, lw * 0.6);
      c.beginPath(); c.moveTo(-s * 0.2, s * 0.35); c.quadraticCurveTo(0, s * 0.5, s * 0.22, s * 0.3); c.stroke();
    } else if (kind === "dog") {
      // a dog, melting
      c.beginPath();
      c.moveTo(-s * 0.62, 0);
      c.quadraticCurveTo(-s * 0.62, -s * 0.7, 0, -s * 0.7);
      c.quadraticCurveTo(s * 0.62, -s * 0.7, s * 0.62, 0);
      c.lineTo(s * 0.62, s * 0.4);
      c.quadraticCurveTo(s * 0.5, s * 1.05, s * 0.36, s * 0.42);
      c.quadraticCurveTo(s * 0.2, s * 0.62, s * 0.06, s * 0.45);
      c.quadraticCurveTo(-s * 0.06, s * 1.2, -s * 0.2, s * 0.44);
      c.quadraticCurveTo(-s * 0.4, s * 0.62, -s * 0.5, s * 0.4);
      c.closePath();
      c.fillStyle = T.paper; c.fill(); ink(c, lw); c.stroke();
      oval(c, -s * 0.62, -s * 0.1, s * 0.22, s * 0.48, T.ink, lw * 0.7, T.paper, 0.3);
      oval(c, s * 0.62, -s * 0.1, s * 0.22, s * 0.48, T.ink, lw * 0.7, T.paper, -0.3);
      oval(c, -s * 0.22, -s * 0.24, s * 0.12, s * 0.16, T.ink);
      oval(c, s * 0.24, -s * 0.18, s * 0.1, s * 0.13, T.ink);
      oval(c, 0, s * 0.06, s * 0.16, s * 0.11, T.ink);
    } else if (kind === "bread") {
      // a soldier carved from bread
      rrect(c, -s * 0.48, -s * 0.38, s * 0.96, s * 1.2, s * 0.32);
      c.fillStyle = T.paper; c.fill();
      c.save(); c.clip(); c.fillStyle = shade(c); c.fillRect(s * 0.14, -s * 0.5, s * 0.5, s * 1.4); c.restore();
      ink(c, lw); c.stroke();
      // helmet
      c.beginPath();
      c.moveTo(-s * 0.6, -s * 0.36);
      c.quadraticCurveTo(-s * 0.56, -s * 0.98, 0, -s * 0.98);
      c.quadraticCurveTo(s * 0.56, -s * 0.98, s * 0.6, -s * 0.36);
      c.closePath();
      c.fillStyle = T.ink; c.fill(); ink(c, lw * 0.8, T.paper); c.stroke();
      oval(c, -s * 0.17, -s * 0.12, s * 0.07, s * 0.09, T.ink);
      oval(c, s * 0.17, -s * 0.12, s * 0.07, s * 0.09, T.ink);
      ink(c, lw * 0.7);
      c.beginPath(); c.moveTo(-s * 0.14, s * 0.12); c.lineTo(s * 0.14, s * 0.12); c.stroke();
      // a crumb salute
      oval(c, s * 0.62, -s * 0.48, s * 0.15, s * 0.15, T.paper, lw * 0.7);
      c.beginPath(); c.moveTo(s * 0.46, s * 0.04); c.lineTo(s * 0.6, -s * 0.36); ink(c, lw * 2.2); c.stroke(); ink(c, lw, T.paper); c.stroke();
    } else {
      // a smiley, melting
      c.beginPath();
      c.moveTo(-s * 0.7, 0);
      c.arc(0, 0, s * 0.7, Math.PI, 0);
      c.lineTo(s * 0.7, s * 0.1);
      c.quadraticCurveTo(s * 0.62, s * 0.9, s * 0.46, s * 0.48);
      c.quadraticCurveTo(s * 0.2, s * 0.7, 0, s * 0.62);
      c.quadraticCurveTo(-s * 0.2, s * 1.25, -s * 0.36, s * 0.55);
      c.quadraticCurveTo(-s * 0.6, s * 0.5, -s * 0.7, s * 0.1);
      c.closePath();
      c.fillStyle = T.paper; c.fill(); ink(c, lw); c.stroke();
      oval(c, -s * 0.24, -s * 0.2, s * 0.09, s * 0.15, T.ink);
      oval(c, s * 0.24, -s * 0.2, s * 0.09, s * 0.15, T.ink);
      ink(c, lw * 0.9);
      c.beginPath(); c.arc(0, -s * 0.02, s * 0.34, 0.35, Math.PI - 0.35); c.stroke();
    }
    c.restore();
  }

  // A blob of slop: wobbling green goo, an ink edge, a shine, and the thing
  // it's carrying poking out of the top. wob: 0 to 1 round the wobble.
  function blob(c, x, y, r, kind, wob, spin) {
    var lw = Math.max(0.35, r * 0.18);
    c.save();
    c.translate(x, y);
    c.beginPath();
    var n = 7;
    for (var i = 0; i <= n; i++) {
      var a = (i / n) * Math.PI * 2;
      var rr = r * (1 + 0.12 * Math.sin(a * 3 + wob * Math.PI * 2));
      var px = Math.cos(a) * rr, py = Math.sin(a) * rr;
      if (!i) c.moveTo(px, py); else c.lineTo(px, py);
    }
    c.closePath();
    c.fillStyle = T.accent;
    c.fill();
    c.save(); c.clip(); c.fillStyle = shade(c);
    c.beginPath(); c.arc(r * 0.35, r * 0.4, r * 0.9, 0, Math.PI * 2); c.fill(); c.restore();
    ink(c, lw);
    c.stroke();
    oval(c, -r * 0.35, -r * 0.4, r * 0.22, r * 0.14, T.paper, 0, null, -0.5);
    c.restore();
    if (kind) item(c, kind, x + r * 0.15, y - r * 0.55, r * 0.95, spin || 0);
  }

  // ---------------------------------------------------------------------------
  // What people post: an ordinary picture each, drawn in a box
  // ---------------------------------------------------------------------------
  var KINDS = ["dinner", "cat", "shed", "cake", "carrot", "sunset", "dog", "glove", "beach"];
  function picture(c, kind, x, y, w, h) {
    c.save();
    c.beginPath();
    c.rect(x, y, w, h);
    c.clip();
    c.fillStyle = T.paper;
    c.fillRect(x, y, w, h);
    var cx = x + w / 2, cy = y + h / 2, s = h * 0.46, lw = Math.max(0.3, h * 0.045);
    if (kind === "dinner") {
      c.fillStyle = shade(c);
      c.fillRect(x, y, w, h);
      oval(c, cx, cy + s * 0.1, s * 1.5, s * 0.82, T.paper, lw);
      oval(c, cx, cy + s * 0.1, s * 1.08, s * 0.56, null, lw * 0.6);
      oval(c, cx - s * 0.42, cy + s * 0.05, s * 0.45, s * 0.28, T.paper, lw * 0.8);
      c.save(); c.translate(cx + s * 0.3, cy - s * 0.05); c.rotate(-0.3);
      rrect(c, -s * 0.6, -s * 0.13, s * 1.2, s * 0.26, s * 0.13); c.fillStyle = T.red; c.fill(); ink(c, lw * 0.8); c.stroke();
      rrect(c, -s * 0.55, s * 0.18, s * 1.1, s * 0.26, s * 0.13); c.fill(); c.stroke();
      c.restore();
      [[-0.1, 0.35], [0.1, 0.42], [0.3, 0.38], [0.5, 0.3], [0.2, 0.25]].forEach(function (p) {
        oval(c, cx + p[0] * s, cy + p[1] * s, s * 0.09, s * 0.09, T.accent, lw * 0.5);
      });
    } else if (kind === "cat") {
      // a blurry cat: it moved
      c.save();
      c.globalAlpha = 0.55;
      c.translate(s * 0.25, 0);
      catShape(c, cx, cy, s, lw, shade(c));
      c.restore();
      catShape(c, cx, cy, s, lw, T.ink);
      oval(c, cx - s * 0.18, cy - s * 0.42, s * 0.09, s * 0.12, T.paper);
      oval(c, cx + s * 0.12, cy - s * 0.42, s * 0.09, s * 0.12, T.paper);
      ink(c, lw * 0.6);
      c.beginPath();
      for (var m = 0; m < 3; m++) { c.moveTo(cx + s * 0.9, cy - s * 0.3 + m * s * 0.3); c.lineTo(cx + s * 1.4, cy - s * 0.3 + m * s * 0.3); }
      c.stroke();
    } else if (kind === "shed") {
      ground(c, x, y, w, h, lw);
      c.beginPath();
      c.moveTo(cx - s * 0.9, cy + s * 0.75); c.lineTo(cx - s * 0.9, cy - s * 0.2); c.lineTo(cx + s * 0.9, cy - s * 0.2); c.lineTo(cx + s * 0.9, cy + s * 0.75);
      c.closePath();
      c.fillStyle = T.paper; c.fill();
      c.save(); c.clip(); ink(c, lw * 0.4);
      for (var p = -0.9; p < 0.95; p += 0.3) { c.beginPath(); c.moveTo(cx + p * s, cy - s * 0.2); c.lineTo(cx + p * s, cy + s * 0.8); c.stroke(); }
      c.restore();
      ink(c, lw); c.stroke();
      c.beginPath(); c.moveTo(cx - s * 1.1, cy - s * 0.1); c.lineTo(cx, cy - s * 0.85); c.lineTo(cx + s * 1.1, cy - s * 0.1); c.closePath();
      c.fillStyle = T.ink; c.fill(); ink(c, lw * 0.7, T.paper); c.stroke();
      rrect(c, cx - s * 0.25, cy + s * 0.05, s * 0.5, s * 0.7, s * 0.04); c.fillStyle = T.red; c.fill(); ink(c, lw * 0.8); c.stroke();
    } else if (kind === "cake") {
      rrect(c, cx - s * 0.95, cy - s * 0.05, s * 1.9, s * 0.8, s * 0.1); c.fillStyle = T.paper; c.fill(); ink(c, lw); c.stroke();
      rrect(c, cx - s * 0.65, cy - s * 0.55, s * 1.3, s * 0.52, s * 0.1); c.fill(); c.stroke();
      ink(c, lw * 0.9, T.red);
      c.beginPath();
      c.moveTo(cx - s * 0.95, cy + s * 0.12);
      for (var d = 0; d <= 6; d++) c.quadraticCurveTo(cx - s * 0.95 + (d + 0.5) * s * 0.32, cy + s * (d % 2 ? 0.08 : 0.3), cx - s * 0.95 + (d + 1) * s * 0.32, cy + s * 0.12);
      c.stroke();
      [-0.35, 0, 0.35].forEach(function (k) {
        rrect(c, cx + k * s - s * 0.06, cy - s * 0.9, s * 0.12, s * 0.36, s * 0.04); c.fillStyle = T.red; c.fill(); ink(c, lw * 0.6); c.stroke();
        oval(c, cx + k * s, cy - s * 0.98, s * 0.07, s * 0.11, T.accent, lw * 0.5);
      });
      text(c, "90", cx, cy + s * 0.42, s * 0.42, null, { align: "center", fill: T.ink });
    } else if (kind === "carrot") {
      ground(c, x, y, w, h, lw);
      c.save(); c.translate(cx, cy); c.rotate(-0.5);
      c.beginPath(); c.moveTo(-s * 1.1, 0); c.quadraticCurveTo(-s * 0.2, -s * 0.36, s * 0.7, -s * 0.28); c.quadraticCurveTo(s * 0.86, 0, s * 0.7, s * 0.28); c.quadraticCurveTo(-s * 0.2, s * 0.36, -s * 1.1, 0); c.closePath();
      c.fillStyle = T.red; c.fill(); ink(c, lw); c.stroke();
      ink(c, lw * 0.5);
      c.beginPath(); c.moveTo(-s * 0.3, -s * 0.1); c.lineTo(-s * 0.1, -s * 0.06); c.moveTo(s * 0.2, s * 0.12); c.lineTo(s * 0.4, s * 0.1); c.stroke();
      [-0.35, 0, 0.35].forEach(function (k) { oval(c, s * 1.05, k * s * 0.6, s * 0.38, s * 0.12, T.accent, lw * 0.6, null, k); });
      c.restore();
    } else if (kind === "sunset") {
      c.fillStyle = shade(c);
      c.fillRect(x, y, w, h * 0.68);
      c.beginPath(); c.arc(cx + s * 0.4, y + h * 0.68, s * 0.7, Math.PI, 0); c.closePath(); c.fillStyle = T.paper; c.fill(); ink(c, lw); c.stroke();
      ink(c, lw * 0.6);
      c.beginPath(); c.moveTo(x, y + h * 0.68); c.lineTo(x + w, y + h * 0.68); c.stroke();
      // the car park: a lamp post and the back of a car
      ink(c, lw * 1.1);
      c.beginPath(); c.moveTo(cx - s * 1.2, y + h * 0.95); c.lineTo(cx - s * 1.2, cy - s * 0.7); c.quadraticCurveTo(cx - s * 1.2, cy - s * 0.85, cx - s * 0.9, cy - s * 0.8); c.stroke();
      rrect(c, cx - s * 0.5, y + h * 0.72, s * 1.1, s * 0.4, s * 0.12); c.fillStyle = T.red; c.fill(); ink(c, lw * 0.8); c.stroke();
    } else if (kind === "dog") {
      ground(c, x, y, w, h, lw);
      oval(c, cx + s * 0.2, cy + s * 0.25, s * 0.75, s * 0.5, T.paper, lw);
      oval(c, cx + s * 0.45, cy + s * 0.2, s * 0.25, s * 0.2, T.ink);
      oval(c, cx - s * 0.5, cy - s * 0.3, s * 0.5, s * 0.46, T.paper, lw);
      oval(c, cx - s * 0.82, cy - s * 0.25, s * 0.16, s * 0.34, T.ink, lw * 0.6, T.paper, 0.4);
      oval(c, cx - s * 0.62, cy - s * 0.38, s * 0.07, s * 0.09, T.ink);
      oval(c, cx - s * 0.32, cy - s * 0.38, s * 0.07, s * 0.09, T.ink);
      oval(c, cx - s * 0.46, cy - s * 0.18, s * 0.1, s * 0.07, T.ink);
      oval(c, cx - s * 0.42, cy - s * 0.02, s * 0.08, s * 0.12, T.red, lw * 0.4);
      ink(c, lw); c.beginPath(); c.moveTo(cx + s * 0.92, cy + s * 0.2); c.quadraticCurveTo(cx + s * 1.3, cy - s * 0.1, cx + s * 1.2, cy - s * 0.4); c.stroke();
    } else if (kind === "glove") {
      // found a glove, put it on the railings
      ink(c, lw);
      c.beginPath(); c.moveTo(x, cy + s * 0.2); c.lineTo(x + w, cy + s * 0.2); c.stroke();
      for (var r = x + s * 0.4; r < x + w; r += s * 0.7) { c.beginPath(); c.moveTo(r, cy - s * 0.6); c.lineTo(r, y + h); c.stroke(); }
      c.save(); c.translate(cx, cy - s * 0.1); c.rotate(0.2);
      c.beginPath();
      c.moveTo(-s * 0.35, s * 0.55); c.lineTo(-s * 0.4, -s * 0.2); c.quadraticCurveTo(-s * 0.4, -s * 0.7, 0, -s * 0.72); c.quadraticCurveTo(s * 0.4, -s * 0.7, s * 0.4, -s * 0.2); c.lineTo(s * 0.35, s * 0.55); c.closePath();
      c.fillStyle = T.red; c.fill(); ink(c, lw); c.stroke();
      oval(c, -s * 0.52, -s * 0.12, s * 0.16, s * 0.28, T.red, lw * 0.8, null, -0.4);
      rrect(c, -s * 0.4, s * 0.42, s * 0.8, s * 0.24, s * 0.06); c.fillStyle = T.paper; c.fill(); ink(c, lw * 0.8); c.stroke();
      c.restore();
    } else {
      // a beach: a deckchair, the sea, the sun
      c.fillStyle = shade(c);
      c.fillRect(x, y + h * 0.42, w, h * 0.2);
      ink(c, lw * 0.7);
      c.beginPath();
      for (var wv = x; wv < x + w; wv += s * 0.5) { c.moveTo(wv, y + h * 0.42); c.quadraticCurveTo(wv + s * 0.12, y + h * 0.36, wv + s * 0.25, y + h * 0.42); }
      c.stroke();
      oval(c, x + w - s * 0.6, y + s * 0.45, s * 0.3, s * 0.3, T.paper, lw * 0.8);
      c.save(); c.translate(cx, cy + s * 0.2); c.rotate(-0.35);
      rrect(c, -s * 0.35, -s * 0.8, s * 0.7, s * 1.2, s * 0.08);
      c.fillStyle = T.paper; c.fill();
      c.save(); c.clip(); c.fillStyle = T.red;
      for (var st = -0.35; st < 0.35; st += 0.28) c.fillRect(st * s, -s * 0.8, s * 0.14, s * 1.2);
      c.restore();
      ink(c, lw); c.stroke();
      c.restore();
      ink(c, lw);
      c.beginPath(); c.moveTo(cx - s * 0.6, cy + s * 0.95); c.lineTo(cx + s * 0.2, cy + s * 0.25); c.moveTo(cx + s * 0.4, cy + s * 0.95); c.lineTo(cx - s * 0.1, cy + s * 0.4); c.stroke();
    }
    c.restore();
  }
  function catShape(c, cx, cy, s, lw, fill) {
    c.beginPath();
    c.moveTo(cx - s * 0.5, cy + s * 0.85);
    c.quadraticCurveTo(cx - s * 0.65, cy - s * 0.1, cx - s * 0.32, cy - s * 0.2);
    c.lineTo(cx - s * 0.42, cy - s * 0.8);
    c.lineTo(cx - s * 0.12, cy - s * 0.58);
    c.lineTo(cx + s * 0.1, cy - s * 0.58);
    c.lineTo(cx + s * 0.36, cy - s * 0.8);
    c.lineTo(cx + s * 0.3, cy - s * 0.2);
    c.quadraticCurveTo(cx + s * 0.62, cy, cx + s * 0.5, cy + s * 0.85);
    c.closePath();
    c.fillStyle = fill; c.fill();
    ink(c, lw * 0.8, T.paper);
    if (fill === T.ink) c.stroke();
  }
  function ground(c, x, y, w, h, lw) {
    c.fillStyle = shade(c);
    c.fillRect(x, y + h * 0.78, w, h * 0.22);
    ink(c, lw * 0.6);
    c.beginPath(); c.moveTo(x, y + h * 0.78); c.lineTo(x + w, y + h * 0.78); c.stroke();
  }

  // ---------------------------------------------------------------------------
  // A post in the feed. p: { type: real | slop | fact, kind, item, name, look,
  // caption, trending, slopped }. The card's top left is 0,0; w by h.
  // Likes are drawn live by the game, top right, so they can count up.
  // ---------------------------------------------------------------------------
  function card(c, p, w, h) {
    if (p.type === "fact") { factCard(c, w, h); return; }
    var pad = 1.4, ar = 2.5;
    var sloppy = p.type === "slop" || p.slopped;
    rrect(c, 0, 0, w, h, 1.6);
    c.fillStyle = T.paper;
    c.fill();
    if (sloppy) {
      // slop gets a slime border, so the feed turns green as it goes
      ink(c, 1.1, T.accent);
      rrect(c, 0.55, 0.55, w - 1.1, h - 1.1, 1.2);
      c.stroke();
    }
    // the poster
    var ax = pad + ar, ay = pad + ar;
    if (p.type === "slop") {
      oval(c, ax, ay, ar, ar, T.accent, 0.4);
      item(c, "smiley", ax, ay + 0.2, ar * 0.72);
    } else {
      head(c, ax, ay, ar, { mood: p.slopped ? "cross" : "calm", gaze: p.slopped ? -0.8 : 0, look: p.look, lw: 0.34 });
    }
    var nameW = w - (ax + ar + 1.2) - 9;
    text(c, p.name, ax + ar + 1.2, ay + 0.15, 2.9, nameW, { fill: T.ink });

    // the picture
    var px = pad, py = pad + ar * 2 + 0.9, pw = w - pad * 2, ph = h - py - 4.6;
    if (p.type === "slop") {
      c.save();
      c.beginPath(); c.rect(px, py, pw, ph); c.clip();
      c.fillStyle = T.accent; c.fillRect(px, py, pw, ph);
      c.fillStyle = shade(c); c.fillRect(px, py, pw, ph);
      c.restore();
      item(c, p.item, px + pw / 2, py + ph / 2 + ph * 0.06, ph * 0.42);
    } else {
      picture(c, p.kind, px, py, pw, ph);
      if (p.slopped) splat(c, px, py, pw, ph, p.slopped);
    }
    ink(c, 0.35);
    c.strokeRect(px, py, pw, ph);
    if (p.trending && !p.slopped) {
      // a red tag across the picture's corner
      c.save();
      c.translate(px + pw - 0.6, py + 0.6);
      rrect(c, -12.6, 0, 12.6, 3.8, 0.5);
      c.fillStyle = T.red; c.fill(); ink(c, 0.35); c.stroke();
      text(c, "Trending", -6.3, 2, 2.7, 11.5, { align: "center", fill: T.paper });
      c.restore();
    }
    // the caption
    text(c, p.slopped ? p.slopCaption : p.caption, pad, h - 2.4, 2.75, w - pad * 2, { fill: T.ink });
    rrect(c, 0, 0, w, h, 1.6);
    ink(c, 0.45);
    c.stroke();
  }

  // The goo over a slopped picture, dripping down, with the thing in it
  function splat(c, x, y, w, h, kind) {
    var cx = x + w / 2, cy = y + h * 0.48, rx = Math.min(w * 0.4, h * 1.1), ry = h * 0.46;
    c.beginPath();
    var n = 11;
    for (var i = 0; i <= n; i++) {
      var a = (i / n) * Math.PI * 2;
      var k = 1 + 0.16 * Math.sin(a * 4 + 1) + 0.08 * Math.cos(a * 7);
      var px = cx + Math.cos(a) * rx * k, py = cy + Math.sin(a) * ry * k;
      if (!i) c.moveTo(px, py); else c.lineTo(px, py);
    }
    c.closePath();
    // drips running off the bottom
    [-0.5, -0.1, 0.35].forEach(function (d, j) {
      var dx = cx + d * rx, len = h * (0.38 + j * 0.12);
      c.moveTo(dx - 1, cy + ry * 0.6);
      c.lineTo(dx - 0.9, cy + ry * 0.6 + len);
      c.arc(dx, cy + ry * 0.6 + len, 0.95, Math.PI, 0, true);
      c.lineTo(dx + 1, cy + ry * 0.6);
    });
    c.fillStyle = T.accent;
    c.fill("nonzero");
    c.save(); c.clip("nonzero"); c.fillStyle = shade(c);
    c.beginPath(); c.ellipse(cx + rx * 0.5, cy + ry * 0.5, rx * 0.8, ry * 0.9, 0, 0, Math.PI * 2); c.fill(); c.restore();
    ink(c, 0.45);
    c.stroke();
    item(c, typeof kind === "string" ? kind : "hand", cx, cy + h * 0.04, h * 0.4, -0.12);
  }

  // A fact check: it bounces slop straight back. Context added. Read by nobody.
  function factCard(c, w, h) {
    rrect(c, 0, 0, w, h, 1.6);
    c.fillStyle = T.paper; c.fill();
    ink(c, 0.45); c.stroke();
    var pad = 1.6;
    // a magnifying glass
    oval(c, pad + 2, pad + 2.2, 1.6, 1.6, null, 0.55);
    ink(c, 0.7); c.beginPath(); c.moveTo(pad + 3.1, pad + 3.3); c.lineTo(pad + 4.5, pad + 4.7); c.stroke();
    text(c, "Fact check", pad + 6, pad + 2.4, 2.9, w - pad * 2 - 6, { fill: T.ink });
    // the stamp
    c.save();
    c.translate(w / 2, h * 0.47);
    c.rotate(-0.06);
    var sw = Math.min(w - 6, 30), sh = 6.8;
    c.strokeStyle = T.red;
    c.lineWidth = 0.55;
    c.strokeRect(-sw / 2, -sh / 2, sw, sh);
    c.strokeRect(-sw / 2 + 0.9, -sh / 2 + 0.9, sw - 1.8, sh - 1.8);
    text(c, "Context added", 0, 0.25, 3.6, sw - 3, { align: "center", fill: T.red });
    c.restore();
    // the context, which nobody reads
    c.fillStyle = shade(c);
    for (var i = 0; i < 2; i++) c.fillRect(pad, h * 0.66 + i * 2.1, (w - pad * 2) * (i ? 0.62 : 0.94), 1.2);
    text(c, "Read by 0 people", pad, h - 2.2, 2.4, w - pad * 2, { fill: T.ink });
  }

  // A heart, for likes
  function heart(c, x, y, s, fill) {
    c.beginPath();
    c.moveTo(x, y + s * 0.85);
    c.bezierCurveTo(x - s * 1.3, y - s * 0.05, x - s * 0.6, y - s * 0.95, x, y - s * 0.3);
    c.bezierCurveTo(x + s * 0.6, y - s * 0.95, x + s * 1.3, y - s * 0.05, x, y + s * 0.85);
    c.closePath();
    c.fillStyle = fill || T.red;
    c.fill();
    ink(c, Math.max(0.25, s * 0.22));
    c.stroke();
  }

  // ---------------------------------------------------------------------------
  // The cannon: a barrel on a carriage with one big wheel showing.
  // x, y: the pivot. angle: radians up from flat. o: { recoil, swell, load, jam }
  // ---------------------------------------------------------------------------
  var BARREL = 15;    // pivot to muzzle
  function cannon(c, x, y, angle, o) {
    o = o || {};
    var lw = 0.75;
    // the carriage: a trail down to the floor behind
    c.beginPath();
    c.moveTo(x + 3, y - 1);
    c.lineTo(x - 2.5, y - 2.4);
    c.lineTo(x - 10.5, y + 6.4);
    c.lineTo(x - 6.5, y + 6.6);
    c.lineTo(x + 4, y + 3.6);
    c.closePath();
    c.fillStyle = T.ink; c.fill(); ink(c, lw, T.paper); c.stroke();

    // the barrel
    c.save();
    c.translate(x, y);
    c.rotate(-angle);
    c.translate(-(o.recoil || 0), 0);
    var sw = 1 + (o.swell || 0) * 0.16;
    c.scale(1, sw);
    var b = new Path2D();
    b.moveTo(-3, -3.4);
    b.lineTo(BARREL - 2, -2.8);
    b.lineTo(BARREL - 2, -3.7);
    b.lineTo(BARREL, -3.7);
    b.lineTo(BARREL, 3.7);
    b.lineTo(BARREL - 2, 3.7);
    b.lineTo(BARREL - 2, 2.8);
    b.lineTo(-3, 3.4);
    b.arc(-3, 0, 3.4, Math.PI / 2, Math.PI * 1.5);
    b.closePath();
    c.fillStyle = T.ink;
    c.fill(b);
    // a shine along the top, in paper halftone
    c.save(); c.clip(b);
    c.fillStyle = dots(c, T.paper);
    c.fillRect(-6, -3.8, BARREL + 8, 2.2);
    c.fillStyle = T.red;
    c.fillRect(3.4, -4, 1.8, 8);
    c.restore();
    ink(c, lw, T.paper);
    c.stroke(b);
    // the mouth: slop waiting, if it's loaded
    oval(c, BARREL + 0.2, 0, 0.9, 3.2, o.load ? T.accent : T.ink, lw * 0.8, o.load ? T.ink : T.paper);
    c.restore();

    // the wheel
    var wx = x - 0.5, wy = y + 1.8, wr = 5;
    oval(c, wx, wy, wr, wr, T.ink, lw, T.paper);
    oval(c, wx, wy, wr - 0.8, wr - 0.8, null, 1.1, T.paper);
    ink(c, 0.55, T.paper);
    c.beginPath();
    for (var s = 0; s < 8; s++) {
      var a = s * Math.PI / 4 + 0.2;
      c.moveTo(wx + Math.cos(a) * 1.2, wy + Math.sin(a) * 1.2);
      c.lineTo(wx + Math.cos(a) * (wr - 1), wy + Math.sin(a) * (wr - 1));
    }
    c.stroke();
    oval(c, wx, wy, 1.4, 1.4, T.red, 0.5, T.paper);

    if (o.jam) {
      // a fact check came back: the cannon's wearing it
      c.save();
      c.translate(x, y);
      c.rotate(-angle);
      c.beginPath();
      c.moveTo(0, -4.4);
      c.quadraticCurveTo(6, -6.4, 12, -4.2);
      c.quadraticCurveTo(13, 0, 11, 4.6);
      c.quadraticCurveTo(10.4, 7.4, 9.6, 4.6);
      c.quadraticCurveTo(5, 5.4, 3, 4.4);
      c.quadraticCurveTo(2.2, 7.8, 1.4, 4.4);
      c.quadraticCurveTo(-1.4, 0, 0, -4.4);
      c.closePath();
      c.fillStyle = T.accent; c.fill(); ink(c, lw); c.stroke();
      c.restore();
    }
  }

  // The vat the slop comes out of
  function vat(c, x, y, w, h) {
    var lw = 0.8;
    // legs
    ink(c, 1.4, T.paper);
    c.beginPath(); c.moveTo(x + w * 0.2, y + h); c.lineTo(x + w * 0.2, y + h - 4); c.moveTo(x + w * 0.8, y + h); c.lineTo(x + w * 0.8, y + h - 4); c.stroke();
    var body = new Path2D();
    body.moveTo(x, y + 2);
    body.lineTo(x, y + h - 6);
    body.ellipse(x + w / 2, y + h - 6, w / 2, 2.4, 0, Math.PI, 0, true);
    body.lineTo(x + w, y + 2);
    body.closePath();
    c.fillStyle = T.ink;
    c.fill(body);
    c.save(); c.clip(body);
    c.fillStyle = dots(c, T.paper);
    c.fillRect(x, y, w * 0.18, h);
    c.restore();
    ink(c, lw, T.paper);
    c.stroke(body);
    // bands
    ink(c, 0.6, T.paper);
    [0.3, 0.75].forEach(function (k) {
      c.beginPath(); c.ellipse(x + w / 2, y + 2 + (h - 8) * k, w / 2, 1.6, 0, 0, Math.PI); c.stroke();
    });
    // the label
    c.save();
    c.translate(x + w / 2, y + 10.5);
    c.rotate(-0.05);
    rrect(c, -w * 0.36, -3.4, w * 0.72, 6.8, 0.6);
    c.fillStyle = T.paper; c.fill(); ink(c, 0.5); c.stroke();
    text(c, "Slop", 0, 0.35, 5, w * 0.62, { align: "center", fill: T.red });
    c.restore();
    // the top, overflowing
    oval(c, x + w / 2, y + 2, w / 2, 2.4, T.accent, lw);
    c.beginPath();
    c.moveTo(x - 0.6, y + 2);
    c.quadraticCurveTo(x - 1.4, y + 6, x - 0.2, y + 9);
    c.quadraticCurveTo(x + 1, y + 10.4, x + 1.4, y + 4.2);
    c.quadraticCurveTo(x + w * 0.4, y + 5.4, x + w * 0.62, y + 4.2);
    c.quadraticCurveTo(x + w * 0.72, y + 8.6, x + w * 0.8, y + 4);
    c.quadraticCurveTo(x + w + 0.8, y + 3.6, x + w + 0.6, y + 2);
    c.closePath();
    c.fillStyle = T.accent; c.fill(); ink(c, lw * 0.8); c.stroke();
  }

  // A bobbing arrow pointing down, with a word over it (DESIGN.md, section 10)
  function arrow(c, x, y, word, size) {
    var k = (size || 1);
    c.save();
    c.translate(x, y);
    c.scale(k, k);
    c.lineJoin = "round";
    c.beginPath();
    c.moveTo(-1.6, -6.6); c.lineTo(1.6, -6.6); c.lineTo(1.6, -3); c.lineTo(3.8, -3); c.lineTo(0, 1.2); c.lineTo(-3.8, -3); c.lineTo(-1.6, -3);
    c.closePath();
    c.fillStyle = T.paper; c.fill();
    ink(c, 0.7); c.stroke();
    text(c, word, 0, -9.4, 3.6, null, { align: "center", fill: T.paper, edge: T.ink, edgeW: 1 });
    c.restore();
  }

  window.SlopArt = {
    init: init, dots: dots, shade: shade, ink: ink, oval: oval, rrect: rrect, text: text, measure: measure,
    head: head, gaffer: gaffer, moderator: moderator, NET: NET,
    item: item, blob: blob, ITEMS: ITEMS, KINDS: KINDS, picture: picture,
    card: card, heart: heart, cannon: cannon, BARREL: BARREL, vat: vat, arrow: arrow
  };
})();
