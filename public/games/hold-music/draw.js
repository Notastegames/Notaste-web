// Hold Music: the drawing. You, the phone, the handset and its curly cord,
// the faces on the phone's screen, the wall clock and the mug.
//
// Outline first, flat fill, the four inks only (ink, paper, red and the
// game's magenta), halftone for shade, never a grey fill (DESIGN.md,
// section 7). Coordinates are world units; hold-music.js sets the scale.
(function () {
  "use strict";

  var T = null;          // colour tokens, set by init()
  var SCALE = 1;         // device pixels per world unit on the main canvas
  var tiles = {};

  function init(tokens, scale) { T = tokens; SCALE = scale; }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  // Halftone dots of one ink, `step` world units apart
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
  function solid(c, path, fill, w, edge) {
    c.fillStyle = fill;
    c.fill(path);
    ink(c, w == null ? 0.6 : w, edge || (fill === T.ink ? T.paper : T.ink));
    c.stroke(path);
  }
  function shade(c, path, area, step, colour) {
    c.save();
    c.clip(path);
    c.fillStyle = dots(c, colour || T.ink, step || 0.8);
    c.fill(area);
    c.restore();
  }
  function line(c, pts, w, colour) {
    c.beginPath();
    pts.forEach(function (p, i) { if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); });
    ink(c, w, colour);
    c.stroke();
  }
  // Display text at `size` world units, drawn in device pixels so small
  // sizes keep their spacing. opts: align, base, colour, stroke, strokeColour, upper
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

  // ---------------------------------------------------------------------------
  // Faces (DESIGN.md, section 7): oval eyes with small pupils, furious
  // eyebrows, a frown and a second chin.
  // o: { look (-1..1), up (-1..1, eyes up), shut, shout, brows (0 weary, 1 furious), lids }
  // ---------------------------------------------------------------------------
  function face(c, hx, hy, r, o) {
    var lw = r * 0.12;
    var lx = (o.look || 0) * r * 0.1, ly = (o.up || 0) * -r * 0.08;
    [-1, 1].forEach(function (s) {
      var ex = hx + s * r * 0.36 + lx * 0.6, ey = hy - r * 0.02 + ly * 0.5;
      if (o.shut) {
        c.beginPath();
        c.arc(ex, ey - r * 0.04, r * 0.17, Math.PI * 0.15, Math.PI * 0.85);
        ink(c, lw * 0.9);
        c.stroke();
      } else {
        solid(c, ell(ex, ey, r * 0.19, r * 0.25), T.paper, lw * 0.75);
        c.fillStyle = T.ink;
        c.beginPath();
        c.arc(ex + (o.look || 0) * r * 0.09, ey + r * 0.03 + (o.up || 0) * -r * 0.1, r * 0.08, 0, Math.PI * 2);
        c.fill();
        if (o.lids) {
          c.save();
          c.clip(ell(ex, ey, r * 0.19, r * 0.25));
          c.fillStyle = T.paper;
          c.fillRect(ex - r * 0.3, ey - r * 0.4, r * 0.6, r * 0.3);
          c.restore();
          line(c, [[ex - r * 0.19, ey - r * 0.1], [ex + r * 0.19, ey - r * 0.1]], lw * 0.8);
        }
      }
      var tilt = (o.brows == null ? 1 : o.brows) * r * 0.12;
      line(c, [[hx + s * r * 0.13 + lx, ey - r * 0.34 + tilt], [hx + s * r * 0.58 + lx, ey - r * 0.4 - tilt * 0.4]], lw * 1.3);
    });
    var my = hy + r * 0.45;
    if (o.shout) {
      solid(c, ell(hx + lx, my + r * 0.02, r * 0.26, r * 0.2 * o.shout + 0.01), T.ink, 0.01);
      if (o.shout > 0.5) solid(c, ell(hx + lx, my + r * 0.1, r * 0.13, r * 0.06), T.red, 0.01);
    } else {
      c.beginPath();
      c.arc(hx + lx, my + r * 0.16, r * 0.21, Math.PI * 1.2, Math.PI * 1.8);
      ink(c, lw);
      c.stroke();
    }
    c.beginPath();
    c.arc(hx + lx * 0.5, hy + r * 0.38, r * 0.48, Math.PI * 0.3, Math.PI * 0.7);
    ink(c, lw * 0.8);
    c.stroke();
  }

  function mitten(c, x, y, r, fill, flip) {
    var f = flip ? -1 : 1;
    solid(c, ell(x, y, r, r * 0.88), fill || T.paper, r * 0.26);
    solid(c, ell(x - f * r * 0.74, y - r * 0.42, r * 0.36, r * 0.5, -0.5 * f), fill || T.paper, r * 0.2);
  }

  // ---------------------------------------------------------------------------
  // You: the house cut-out, in a magenta bobble hat, sat behind the table,
  // the handset at the ear on the phone's side (flip puts it on the left).
  // x, y: the middle of the table's edge in front of you. R: the head's radius.
  // o: { look, up, shout, brows, lids, bob, bobble (the bobble's bounce, in
  //      R), sweat, sweatT, steam, steamT, puff (one ear, 0..1), flip,
  //      handset: "ear" (default), "table" (on speaker: it's on the table and
  //      both mittens are free), cut (0..1: just cut off, the hat jumps) }
  // Returns, in world units: where the cord leaves the handset (cord), the
  // handset's earpiece (ear), and where your free mittens rest on the table
  // (rest, and rest2 on speaker), all drawn by the caller after the table.
  // ---------------------------------------------------------------------------
  function you(c, x, y, R, o) {
    o = o || {};
    var f = o.flip ? -1 : 1;
    var lw = R * 0.11;
    var bob = o.bob || 0;
    var onEar = o.handset !== "table";
    c.save();
    c.translate(x, y);
    c.scale(f, 1);
    // the body (the caller may have drawn it already: it never moves)
    if (!o.noBody) jumper(c, R);
    var hy = -R * 2.05 + bob;
    // the head
    var head = ell(0, hy, R, R * 0.97);
    solid(c, head, T.paper, lw);
    c.save();
    c.clip(head);
    c.fillStyle = dots(c, T.ink, R * 0.075);
    c.beginPath();
    c.ellipse(-R * 0.98, hy + R * 0.2, R * 0.28, R * 0.9, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();
    ink(c, lw);
    c.stroke(head);
    // the face looks the same way whichever side the handset's on
    c.save();
    c.scale(f, 1);
    face(c, 0, hy + R * 0.14, R, { look: o.look, up: o.up, shout: o.shout, brows: o.brows, lids: o.lids });
    c.restore();
    // sweat, when patience is short
    if (o.sweat) {
      var sx = -R * 0.84, sy = hy - R * 0.2 + (o.sweatT || 0) * R * 0.45;
      var drop = new Path2D();
      drop.moveTo(sx, sy - R * 0.24);
      drop.quadraticCurveTo(sx + R * 0.15, sy, sx, sy + R * 0.09);
      drop.quadraticCurveTo(sx - R * 0.15, sy, sx, sy - R * 0.24);
      solid(c, drop, T.paper, lw * 0.5);
    }
    // the bobble hat, sat just above the eyebrows; it jumps when you're cut off
    var jump = (o.cut || 0) * R * 0.55;
    bobble(c, 0, hy - R * 0.6 - jump, R, (o.bobble || 0) * R, (o.cut || 0) * 0.25 * f);
    // steam from the ears: both when you're furious, one for a missed note
    if (o.steam || o.puff) {
      c.save();
      [-1, 1].forEach(function (s) {
        var amt = o.steam ? Math.min(1, o.steam) : s === 1 ? Math.min(1, o.puff) : 0;
        if (!amt) return;
        c.globalAlpha = amt;
        var ex = s * R * 1.08, ey = hy + R * 0.05;
        for (var i = 0; i < 3; i++) {
          var k = ((o.steamT || 0) * 1.6 + i / 3) % 1;
          var px = ex + s * (R * 0.12 + k * R * 0.32), py = ey - R * 0.25 - k * R * 0.75, pr = R * (0.08 + k * 0.09);
          c.fillStyle = T.accent;
          c.beginPath(); c.arc(px + R * 0.05, py + R * 0.05, pr, 0, 7); c.fill();
          c.fillStyle = T.paper;
          c.beginPath(); c.arc(px, py, pr, 0, 7); c.fill();
          ink(c, R * 0.035); c.beginPath(); c.arc(px, py, pr, 0, 7); c.stroke();
        }
      });
      c.restore();
    }
    var out;
    if (onEar) {
      // the handset at your ear, and the arm holding it
      var hx = R * 1.0, hsy = hy - R * 0.05;
      var arm = new Path2D();
      arm.moveTo(R * 0.9, -R * 0.7);
      arm.quadraticCurveTo(R * 1.95, -R * 0.75, R * 1.5, hsy + R * 0.82);
      ink(c, R * 0.46); c.stroke(arm);
      ink(c, R * 0.28, T.paper); c.stroke(arm);
      var cd = handset(c, hx, hsy, R);
      mitten(c, R * 1.46, hsy + R * 0.7, R * 0.32, T.paper, true);
      out = { cord: { x: x + f * cd.x, y: y + cd.y }, ear: { x: x + f * hx, y: y + hsy } };
    } else {
      // on speaker: both arms down to the table
      out = { cord: null, ear: null };
    }
    c.restore();
    out.rest = { x: x - f * R * 0.95, y: y - R * 0.12, r: R * 0.4 };
    if (!onEar) out.rest2 = { x: x + f * R * 0.95, y: y - R * 0.12, r: R * 0.4 };
    out.mouth = { x: x, y: y + hy + R * 0.6 };
    out.top = y + hy - R * 1.75 - jump;
    return out;
  }

  // Your body, a jumper: paper, halftone down its far side, a magenta
  // stripe. Drawn about (0, 0), the middle of the table's edge in front of you.
  function jumper(c, R) {
    var lw = R * 0.11;
    var body = ell(0, -R * 0.15, R * 1.32, R * 1.25);
    solid(c, body, T.paper, lw);
    shade(c, body, ell(-R * 0.95, R * 0.1, R * 0.8, R * 1.4), R * 0.09);
    c.save();
    c.clip(body);
    c.fillStyle = T.accent;
    c.fillRect(-R * 1.5, -R * 0.62, R * 3, R * 0.28);
    ink(c, lw * 0.6);
    c.strokeRect(-R * 1.5, -R * 0.62, R * 3, R * 0.28);
    c.restore();
    ink(c, lw);
    c.stroke(body);
  }
  // the same, at x, y, the handset's side flipped as you() flips it
  function youBody(c, x, y, R, flip) {
    c.save();
    c.translate(x, y);
    c.scale(flip ? -1 : 1, 1);
    jumper(c, R);
    c.restore();
  }

  // A bobble hat in the game's colour: stripes, a paper bobble, a turn-up.
  // bounce: how far the bobble is thrown up (world units); tilt: radians
  function bobble(c, x, y, R, bounce, tilt) {
    c.save();
    if (tilt) { c.translate(x, y); c.rotate(tilt); c.translate(-x, -y); }
    var dome = new Path2D();
    dome.moveTo(x - R * 1.02, y);
    dome.bezierCurveTo(x - R * 1.0, y - R * 1.15, x + R * 1.0, y - R * 1.15, x + R * 1.02, y);
    dome.closePath();
    solid(c, dome, T.accent, R * 0.1);
    c.save(); c.clip(dome);
    ink(c, R * 0.13, T.paper);
    [-0.55, 0, 0.55].forEach(function (d) { c.beginPath(); c.moveTo(x + d * R, y + 0.2); c.lineTo(x + d * R * 0.55, y - R); c.stroke(); });
    c.restore();
    ink(c, R * 0.1); c.stroke(dome);
    var by = y - R * 0.95 - (bounce || 0);
    // the bobble's stalk shows when it's thrown up
    if (bounce > R * 0.04) line(c, [[x + R * 0.06, y - R * 0.8], [x + R * 0.08, by + R * 0.1]], R * 0.12, T.ink);
    solid(c, ell(x + R * 0.08, by, R * 0.3, R * 0.27), T.paper, R * 0.08);
    var band = rr(x - R * 1.07, y - R * 0.16, R * 2.14, R * 0.4, R * 0.18);
    solid(c, band, T.accent, R * 0.09);
    shade(c, band, rr(x - R * 1.1, y - R * 0.2, R * 2.2, R * 0.5, 0), R * 0.06);
    ink(c, R * 0.09); c.stroke(band);
    c.restore();
  }

  // A handset held to the ear: the earpiece at (x, y), its handle bowing
  // out, the mouthpiece by the chin. k: the head's radius.
  // Returns where its cord starts.
  function handset(c, x, y, k) {
    var handle = new Path2D();
    handle.moveTo(x + k * 0.12, y - k * 0.05);
    handle.quadraticCurveTo(x + k * 0.78, y + k * 0.55, x + k * 0.08, y + k * 1.2);
    ink(c, k * 0.46); c.stroke(handle);
    ink(c, k * 0.27, T.paper); c.stroke(handle);
    var ear = ell(x - k * 0.02, y - k * 0.05, k * 0.2, k * 0.34, -0.25);
    solid(c, ear, T.paper, k * 0.09);
    shade(c, ear, rr(x + k * 0.02, y - k * 0.5, k, k, 0), k * 0.06);
    ink(c, k * 0.09); c.stroke(ear);
    var mouth = ell(x - k * 0.04, y + k * 1.22, k * 0.19, k * 0.3, 0.35);
    solid(c, mouth, T.paper, k * 0.09);
    shade(c, mouth, rr(x, y + k * 0.8, k, k, 0), k * 0.06);
    ink(c, k * 0.09); c.stroke(mouth);
    return { x: x + k * 0.02, y: y + k * 1.5 };
  }

  // The handset lying on the table (on speaker), or slammed down (hung up):
  // centred at (x, y), k: the head's radius, flip: which way it points.
  // Returns where its cord starts.
  function handsetFlat(c, x, y, k, flip, slam) {
    var f = flip ? -1 : 1;
    c.save();
    c.translate(x, y);
    c.scale(f, 1);
    c.rotate(slam ? -0.08 : 0.05);
    var handle = new Path2D();
    handle.moveTo(-k * 0.6, -k * 0.12);
    handle.quadraticCurveTo(0, -k * 0.55, k * 0.6, -k * 0.12);
    ink(c, k * 0.46); c.stroke(handle);
    ink(c, k * 0.27, T.paper); c.stroke(handle);
    [-1, 1].forEach(function (s) {
      var cup = ell(s * k * 0.68, 0, k * 0.32, k * 0.2, 0);
      solid(c, cup, T.paper, k * 0.09);
      shade(c, cup, rr(-k, 0, k * 2, k, 0), k * 0.06);
      ink(c, k * 0.09); c.stroke(cup);
    });
    if (slam) {
      // it's been put down hard
      ink(c, k * 0.08, T.paper);
      [[-1.25, -0.35, -1.6, -0.75], [1.25, -0.35, 1.6, -0.75], [0, -0.75, 0, -1.15], [-0.7, -0.62, -0.95, -1.0], [0.7, -0.62, 0.95, -1.0]].forEach(function (s) {
        c.beginPath(); c.moveTo(s[0] * k, s[1] * k); c.lineTo(s[2] * k, s[3] * k); c.stroke();
      });
    }
    c.restore();
    return { x: x + f * k * 0.95, y: y + k * 0.05 };
  }

  // The curly cord, from (x0, y0) to (x1, y1), sagging between
  function cord(c, x0, y0, x1, y1, w, sag) {
    var mx = (x0 + x1) / 2, my = Math.max(y0, y1) + (sag || 6);
    var pts = [];
    for (var i = 0; i <= 24; i++) {
      var t = i / 24;
      pts.push([(1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * mx + t * t * x1, (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * my + t * t * y1]);
    }
    cordAlong(c, pts, w);
  }

  // The curly cord along a path of points ([x, y], spaced evenly enough)
  function cordAlong(c, pts, w) {
    var len = 0, seg = [0];
    for (var i = 1; i < pts.length; i++) { len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(len); }
    var loops = Math.max(6, Math.round(len / (w * 2.4)));
    var r = w * 1.1, steps = loops * 10, j = 1;
    c.beginPath();
    for (var s = 0; s <= steps; s++) {
      var d = s / steps * len;
      while (j < pts.length - 1 && seg[j] < d) j++;
      var k = seg[j] > seg[j - 1] ? (d - seg[j - 1]) / (seg[j] - seg[j - 1]) : 0;
      var bx = pts[j - 1][0] + (pts[j][0] - pts[j - 1][0]) * k, by = pts[j - 1][1] + (pts[j][1] - pts[j - 1][1]) * k;
      var a = s / steps * loops * Math.PI * 2;
      var px = bx + Math.cos(a) * r * 0.6, py = by + Math.sin(a) * r;
      if (s) c.lineTo(px, py); else c.moveTo(px, py);
    }
    ink(c, w * 1.25);
    c.stroke();
    ink(c, w * 0.55, T.paper);
    c.stroke();
  }

  // A note of the tune, riding the cord: a head, a stem, a flag for a quaver
  // and an open head for a long one. r: the head's radius. kind: "quaver",
  // "crotchet" or "minim". Paper with an ink edge and a magenta shadow.
  function musicNote(c, x, y, r, kind, fill) {
    var head = ell(x, y, r * 1.18, r * 0.86, -0.38);
    var stemX = x + r * 0.98, stemTop = y - r * 3.1;
    // the shadow
    c.save();
    c.translate(r * 0.32, r * 0.32);
    c.fillStyle = T.accent;
    c.fill(head);
    ink(c, r * 0.42, T.accent);
    c.beginPath(); c.moveTo(stemX, y - r * 0.2); c.lineTo(stemX, stemTop); c.stroke();
    c.restore();
    // the stem, in ink with a paper edge so it reads on black
    ink(c, r * 0.62, T.paper);
    c.beginPath(); c.moveTo(stemX, y - r * 0.15); c.lineTo(stemX, stemTop); c.stroke();
    ink(c, r * 0.3, T.ink);
    c.beginPath(); c.moveTo(stemX, y - r * 0.15); c.lineTo(stemX, stemTop); c.stroke();
    if (kind === "quaver") {
      var flag = new Path2D();
      flag.moveTo(stemX, stemTop);
      flag.quadraticCurveTo(stemX + r * 1.5, stemTop + r * 0.9, stemX + r * 1.1, stemTop + r * 2.1);
      ink(c, r * 0.62, T.paper); c.stroke(flag);
      ink(c, r * 0.3, T.ink); c.stroke(flag);
    }
    solid(c, head, kind === "minim" ? T.ink : fill || T.paper, r * 0.32, kind === "minim" ? T.paper : T.ink);
    if (kind === "minim") {
      ink(c, r * 0.3, T.paper);
      c.beginPath(); c.ellipse(x, y, r * 0.55, r * 0.32, -0.38, 0, Math.PI * 2); c.stroke();
    }
  }

  // Short white strokes around a point: an impact, a hit (DESIGN.md 7, sparks)
  function burst(c, x, y, r0, r1, w, n, rot) {
    ink(c, w, T.paper);
    for (var i = 0; i < (n || 6); i++) {
      var a = i / (n || 6) * Math.PI * 2 + (rot || 0);
      c.beginPath(); c.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0); c.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1); c.stroke();
    }
  }

  // ---------------------------------------------------------------------------
  // The phone: a paper desk phone with a magenta screen. The handset is off
  // its cradle (you've got it), so the cradle's two prongs stand empty.
  // ---------------------------------------------------------------------------
  function phoneBody(c, p) {
    var body = rr(p.x, p.y, p.w, p.h, p.w * 0.07);
    solid(c, body, T.paper, 0.9);
    shade(c, body, rr(p.x + p.w * 0.84, p.y, p.w, p.h, 0), 0.9);
    shade(c, body, rr(p.x, p.y + p.h - 2.2, p.w, 3, 0), 0.9);
    ink(c, 0.9); c.stroke(body);
    // the cradle along the top, empty
    var cw = p.w * 0.78, cx = p.x + (p.w - cw) / 2, cy = p.y - 2.6;
    var cradle = rr(cx, cy, cw, 3.6, 1.6);
    solid(c, cradle, T.paper, 0.8);
    shade(c, cradle, rr(cx, cy + 1.8, cw, 3, 0), 0.7);
    ink(c, 0.8); c.stroke(cradle);
    [cx + cw * 0.12, cx + cw * 0.88].forEach(function (x) {
      solid(c, rr(x - 1.1, cy - 1.6, 2.2, 2.4, 0.6), T.ink, 0.4, T.ink);
    });
    // the speaker grille, under the cradle on the right
    c.fillStyle = T.ink;
    for (var i = 0; i < 4; i++) c.fillRect(p.x + p.w - 7.5 + i * 1.5, p.y + 1.3, 0.7, 1.6);
  }

  // ---------------------------------------------------------------------------
  // Faces on the phone's screen, in ink on magenta
  // ---------------------------------------------------------------------------
  // The Voice: the menu's own face. Cheerful, and nothing behind it.
  function voiceFace(c, x, y, s, mouth) {
    ink(c, s * 0.07);
    c.beginPath(); c.arc(x, y, s * 0.42, 0, Math.PI * 2); c.stroke();
    // happy shut eyes, raised brows
    [-1, 1].forEach(function (d) {
      c.beginPath();
      c.arc(x + d * s * 0.15, y - s * 0.04, s * 0.08, Math.PI * 1.1, Math.PI * 1.9);
      c.stroke();
      line(c, [[x + d * s * 0.08, y - s * 0.22], [x + d * s * 0.24, y - s * 0.25]], s * 0.06);
    });
    // a big fixed grin, wider when it talks
    c.beginPath();
    if (mouth > 0.2) {
      c.moveTo(x - s * 0.2, y + s * 0.1);
      c.quadraticCurveTo(x, y + s * (0.18 + mouth * 0.2), x + s * 0.2, y + s * 0.1);
      c.closePath();
      c.fillStyle = T.ink;
      c.fill();
    } else {
      c.arc(x, y + s * 0.04, s * 0.2, Math.PI * 0.18, Math.PI * 0.82);
      c.stroke();
    }
    // sound coming out of it
    ink(c, s * 0.05);
    for (var i = 1; i <= 2; i++) {
      c.beginPath();
      c.arc(x + s * 0.32, y, s * (0.18 + i * 0.12), -0.6, 0.6);
      c.stroke();
    }
  }

  // An agent, head and shoulders, in a headset. look: glasses, bun, perm, none
  function agentFace(c, x, y, s, look, mouth) {
    var lw = s * 0.06;
    ink(c, lw);
    // shoulders
    c.beginPath();
    c.moveTo(x - s * 0.46, y + s * 0.5);
    c.quadraticCurveTo(x - s * 0.44, y + s * 0.2, x, y + s * 0.2);
    c.quadraticCurveTo(x + s * 0.44, y + s * 0.2, x + s * 0.46, y + s * 0.5);
    c.stroke();
    var hy = y - s * 0.06, r = s * 0.25;
    if (look === "bun") { c.beginPath(); c.arc(x, hy - r * 1.15, r * 0.4, 0, Math.PI * 2); c.fillStyle = T.ink; c.fill(); }
    if (look === "perm") {
      c.fillStyle = T.ink;
      for (var i = 0; i < 9; i++) {
        var a = Math.PI * (1.05 + i * 0.11);
        c.beginPath(); c.arc(x + Math.cos(a) * r * 1.05, hy + Math.sin(a) * r * 1.05, r * 0.32, 0, Math.PI * 2); c.fill();
      }
    }
    c.beginPath(); c.arc(x, hy, r, 0, Math.PI * 2); c.stroke();
    if (look === "parting") {
      c.beginPath(); c.moveTo(x - r * 0.95, hy - r * 0.2); c.quadraticCurveTo(x - r * 0.5, hy - r * 1.2, x + r * 0.95, hy - r * 0.35); c.lineTo(x + r * 0.2, hy - r * 0.7); c.closePath();
      c.fillStyle = T.ink; c.fill();
    }
    // tired eyes, a polite flat mouth
    [-1, 1].forEach(function (d) {
      c.fillStyle = T.ink;
      c.beginPath(); c.arc(x + d * r * 0.38, hy + r * 0.05, r * 0.11, 0, Math.PI * 2); c.fill();
      line(c, [[x + d * r * 0.18, hy - r * 0.2], [x + d * r * 0.58, hy - r * 0.26]], lw * 0.9);
      if (look === "glasses") { ink(c, lw * 0.8); c.beginPath(); c.arc(x + d * r * 0.38, hy + r * 0.05, r * 0.26, 0, Math.PI * 2); c.stroke(); }
    });
    if (mouth > 0.2) { c.fillStyle = T.ink; c.beginPath(); c.ellipse(x, hy + r * 0.52, r * 0.2, r * 0.08 + mouth * r * 0.12, 0, 0, Math.PI * 2); c.fill(); }
    else line(c, [[x - r * 0.2, hy + r * 0.52], [x + r * 0.2, hy + r * 0.52]], lw);
    // the headset
    ink(c, lw * 1.2);
    c.beginPath(); c.arc(x, hy, r * 1.12, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
    c.fillStyle = T.ink;
    c.beginPath(); c.ellipse(x - r * 1.05, hy + r * 0.05, r * 0.18, r * 0.3, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.moveTo(x - r * 1.05, hy + r * 0.3); c.quadraticCurveTo(x - r * 0.9, hy + r * 0.85, x - r * 0.3, hy + r * 0.72); ink(c, lw); c.stroke();
  }

  // ---------------------------------------------------------------------------
  // The agent who picks up, as a house cut-out in a frame on the wall (the
  // other end of the line): a magenta office behind them, a headset, one
  // thing each (glasses, a bun, a perm, or a neat parting), weary brows, a
  // kind tired smile, a mug, and their own desk. x, y, w, h: the frame.
  // o: { look, mouth (0..1, talking), tilt, dead (0..1: the line's gone, static) }
  // ---------------------------------------------------------------------------
  function agentCutout(c, x, y, w, h, o) {
    o = o || {};
    var cx = x + w / 2;
    c.save();
    c.translate(cx, y + h / 2);
    c.rotate(o.tilt || 0);
    c.translate(-cx, -(y + h / 2));
    var frame = rr(x, y, w, h, Math.min(w, h) * 0.04);
    var inner = rr(x + w * 0.05, y + w * 0.05, w * 0.9, h - w * 0.1, Math.min(w, h) * 0.02);
    // the frame: paper, an ink edge, halftone down one side
    solid(c, frame, T.paper, Math.max(0.5, w * 0.022));
    shade(c, frame, rr(x + w * 0.8, y, w, h, 0), Math.max(0.6, w * 0.025));
    ink(c, Math.max(0.5, w * 0.022)); c.stroke(frame);
    c.save();
    c.clip(inner);
    // the office: magenta, with an ink halftone
    c.fillStyle = T.accent;
    c.fillRect(x, y, w, h);
    c.fillStyle = dots(c, T.ink, Math.max(0.7, w * 0.03));
    c.globalAlpha = 0.35;
    c.fillRect(x, y, w, h);
    c.globalAlpha = 1;
    var R = Math.min(w * 0.23, h * 0.2);
    var ax = cx, deskY = y + h - w * 0.05 - h * 0.16, hy = deskY - R * 2.3;
    if (!(o.dead >= 1)) {
      // their body: an ink cardigan over a paper shirt
      var body = ell(ax, deskY + R * 0.2, R * 1.45, R * 1.35);
      solid(c, body, T.ink, R * 0.1, T.paper);
      var shirt = new Path2D();
      shirt.moveTo(ax - R * 0.42, deskY - R * 1.08); shirt.lineTo(ax, deskY - R * 0.1); shirt.lineTo(ax + R * 0.42, deskY - R * 1.08); shirt.closePath();
      solid(c, shirt, T.paper, R * 0.08);
      // a lanyard and a pass
      line(c, [[ax - R * 0.32, deskY - R * 1.0], [ax - R * 0.05, deskY - R * 0.35]], R * 0.1, T.red);
      line(c, [[ax + R * 0.32, deskY - R * 1.0], [ax + R * 0.05, deskY - R * 0.35]], R * 0.1, T.red);
      solid(c, rr(ax - R * 0.22, deskY - R * 0.4, R * 0.44, R * 0.34, R * 0.05), T.paper, R * 0.06);
      // behind the head: a bun or a perm
      if (o.look === "bun") solid(c, ell(ax + R * 0.1, hy - R * 1.02, R * 0.42, R * 0.36), T.ink, R * 0.08, T.paper);
      if (o.look === "perm") {
        for (var i = 0; i < 11; i++) {
          var a = Math.PI * (0.95 + i * 0.11);
          solid(c, ell(ax + Math.cos(a) * R * 1.0, hy + Math.sin(a) * R * 1.0 + R * 0.1, R * 0.36, R * 0.36), T.ink, R * 0.06, T.paper);
        }
      }
      // the head
      var head = ell(ax, hy, R, R * 0.97);
      solid(c, head, T.paper, R * 0.11);
      c.save(); c.clip(head);
      c.fillStyle = dots(c, T.ink, R * 0.075);
      c.beginPath(); c.ellipse(ax + R * 0.98, hy + R * 0.2, R * 0.28, R * 0.9, 0, 0, Math.PI * 2); c.fill();
      if (o.look === "bun" || o.look === "none") {
        // hair scraped back, or a neat parting
        c.fillStyle = T.ink;
        c.beginPath(); c.ellipse(ax, hy - R * 0.78, R * 1.1, R * 0.5, 0, 0, Math.PI * 2); c.fill();
        if (o.look === "none") { ink(c, R * 0.08, T.paper); c.beginPath(); c.moveTo(ax - R * 0.35, hy - R * 0.95); c.lineTo(ax - R * 0.3, hy - R * 0.4); c.stroke(); }
      }
      c.restore();
      ink(c, R * 0.11); c.stroke(head);
      // the face: weary brows, heavy lids, a small kind smile
      [-1, 1].forEach(function (s) {
        var ex = ax + s * R * 0.36, ey = hy + R * 0.06;
        solid(c, ell(ex, ey, R * 0.18, R * 0.23), T.paper, R * 0.08);
        c.fillStyle = T.ink;
        c.beginPath(); c.arc(ex, ey + R * 0.04, R * 0.075, 0, Math.PI * 2); c.fill();
        c.save(); c.clip(ell(ex, ey, R * 0.18, R * 0.23));
        c.fillStyle = T.paper; c.fillRect(ex - R * 0.3, ey - R * 0.4, R * 0.6, R * 0.34);
        c.restore();
        line(c, [[ex - R * 0.18, ey - R * 0.06], [ex + R * 0.18, ey - R * 0.06]], R * 0.08);
        // brows up in the middle: sorry, and on your side
        line(c, [[ax + s * R * 0.14, ey - R * 0.38], [ax + s * R * 0.56, ey - R * 0.28]], R * 0.12);
        if (o.look === "glasses") {
          ink(c, R * 0.09);
          c.beginPath(); c.arc(ex, ey + R * 0.02, R * 0.28, 0, Math.PI * 2); c.stroke();
        }
      });
      if (o.look === "glasses") line(c, [[ax - R * 0.1, hy + R * 0.06], [ax + R * 0.1, hy + R * 0.06]], R * 0.09);
      var my = hy + R * 0.5;
      if ((o.mouth || 0) > 0.2) solid(c, ell(ax, my, R * 0.16, R * 0.06 + o.mouth * R * 0.1), T.ink, 0.01);
      else { c.beginPath(); c.arc(ax, my - R * 0.12, R * 0.16, Math.PI * 0.25, Math.PI * 0.75); ink(c, R * 0.09); c.stroke(); }
      c.beginPath(); c.arc(ax, hy + R * 0.38, R * 0.46, Math.PI * 0.32, Math.PI * 0.68); ink(c, R * 0.08); c.stroke();
      // the headset: a band, an ear cup, a microphone in the game's colour
      ink(c, R * 0.13);
      c.beginPath(); c.arc(ax, hy, R * 1.1, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
      solid(c, ell(ax - R * 1.02, hy + R * 0.05, R * 0.2, R * 0.3), T.ink, R * 0.06, T.paper);
      c.beginPath(); c.moveTo(ax - R * 1.0, hy + R * 0.3); c.quadraticCurveTo(ax - R * 0.85, hy + R * 0.8, ax - R * 0.32, hy + R * 0.62);
      ink(c, R * 0.09); c.stroke();
      solid(c, ell(ax - R * 0.3, hy + R * 0.62, R * 0.1, R * 0.09), T.accent, R * 0.05);
      // mittens on the desk
      mitten(c, ax - R * 1.0, deskY + R * 0.05, R * 0.34, T.paper, false);
      mitten(c, ax + R * 1.0, deskY + R * 0.05, R * 0.34, T.paper, true);
    }
    // their desk: paper, halftone along the front, a mug of tea
    var desk = rr(x - 1, deskY + R * 0.25, w + 2, h, 0);
    solid(c, desk, T.paper, R * 0.1);
    shade(c, desk, rr(x, deskY + R * 0.55, w, h, 0), R * 0.1);
    if (!(o.dead >= 1)) {
      var mx = ax + R * 1.65, myy = deskY + R * 0.25;
      solid(c, rr(mx - R * 0.26, myy - R * 0.62, R * 0.52, R * 0.62, R * 0.08), T.paper, R * 0.07);
      c.fillStyle = T.red; c.fillRect(mx - R * 0.26, myy - R * 0.42, R * 0.52, R * 0.13);
    }
    // the line's gone: static over everything
    if (o.dead > 0) {
      c.globalAlpha = Math.min(1, o.dead);
      c.fillStyle = T.ink;
      c.fillRect(x, y, w, h);
      c.fillStyle = dots(c, T.paper, Math.max(0.6, w * 0.022));
      c.fillRect(x, y, w, h);
      ink(c, Math.max(0.3, h * 0.012), T.paper);
      var seed = Math.floor((o.staticT || 0) * 20);
      for (var l = 0; l < 7; l++) {
        var ly = y + ((Math.sin(seed * 12.9898 + l * 78.233) * 43758.5453) % 1 + 1) % 1 * h;
        c.beginPath(); c.moveTo(x, ly); c.lineTo(x + w, ly); c.stroke();
      }
      c.globalAlpha = 1;
    }
    c.restore();
    ink(c, Math.max(0.5, w * 0.022)); c.stroke(inner);
    // a red drawing pin at the top
    solid(c, ell(cx, y + w * 0.025, w * 0.045, w * 0.045), T.red, Math.max(0.3, w * 0.012));
    c.restore();
    return { mouth: { x: cx, y: hy + R * 0.5 }, plate: { x: cx, y: y + h } };
  }

  // A wall clock. minutes: what it says
  function clock(c, x, y, r, minutes) {
    solid(c, ell(x, y, r, r), T.paper, r * 0.12);
    c.fillStyle = T.ink;
    for (var i = 0; i < 12; i++) {
      var a = i / 12 * Math.PI * 2;
      c.beginPath(); c.arc(x + Math.cos(a) * r * 0.78, y + Math.sin(a) * r * 0.78, r * (i % 3 ? 0.04 : 0.08), 0, 7); c.fill();
    }
    var ma = (minutes % 60) / 60 * Math.PI * 2 - Math.PI / 2;
    var ha = ((minutes / 60) % 12) / 12 * Math.PI * 2 - Math.PI / 2;
    line(c, [[x, y], [x + Math.cos(ha) * r * 0.45, y + Math.sin(ha) * r * 0.45]], r * 0.11);
    line(c, [[x, y], [x + Math.cos(ma) * r * 0.7, y + Math.sin(ma) * r * 0.7]], r * 0.07, T.red);
    c.fillStyle = T.ink;
    c.beginPath(); c.arc(x, y, r * 0.08, 0, 7); c.fill();
  }

  // A mug of tea. steam: 0..1, t: time for the steam's wiggle
  function mug(c, x, y, k, steam, t) {
    var body = rr(x - k * 2, y - k * 4.4, k * 4, k * 4.4, k * 0.5);
    c.beginPath(); c.arc(x + k * 2.1, y - k * 2.3, k * 1.15, -Math.PI * 0.5, Math.PI * 0.5); ink(c, k * 0.45); c.stroke();
    solid(c, body, T.paper, k * 0.3);
    shade(c, body, rr(x + k * 0.9, y - k * 5, k * 2, k * 6, 0), k * 0.35);
    ink(c, k * 0.3); c.stroke(body);
    c.fillStyle = T.red;
    c.fillRect(x - k * 2, y - k * 3, k * 4, k * 1);
    ink(c, k * 0.25); c.strokeRect(x - k * 2, y - k * 3, k * 4, k * 1);
    if (steam > 0) {
      c.save();
      c.globalAlpha = Math.min(1, steam);
      [-0.8, 0.8].forEach(function (d, i) {
        var w = Math.sin((t || 0) * 3 + i) * k * 0.4;
        line(c, [[x + d * k, y - k * 5], [x + d * k + w, y - k * 6.2], [x + d * k - w, y - k * 7.4]], k * 0.3, T.paper);
      });
      c.restore();
    }
  }

  // A padlock, for a locked keypad
  function padlock(c, x, y, s, colour) {
    ink(c, s * 0.16, colour || T.ink);
    c.beginPath(); c.arc(x, y - s * 0.25, s * 0.3, Math.PI, 0); c.stroke();
    c.fillStyle = colour || T.ink;
    c.fillRect(x - s * 0.45, y - s * 0.25, s * 0.9, s * 0.7);
  }

  // Phone signal: four bars, `n` of them lit
  function signal(c, x, y, s, n, lit, unlit) {
    for (var i = 0; i < 4; i++) {
      var h = s * (0.3 + i * 0.23), w = s * 0.18;
      var bx = x + i * s * 0.26, by = y - h;
      if (i < n) { c.fillStyle = lit; c.fillRect(bx, by, w, h); }
      else { ink(c, s * 0.05, unlit); c.strokeRect(bx, by, w, h); }
    }
  }

  window.HoldDraw = {
    init: init, dots: dots, ink: ink, rr: rr, ell: ell, solid: solid, shade: shade, line: line,
    text: text, measure: measure, face: face, mitten: mitten, you: you, youBody: youBody, bobble: bobble, handset: handset,
    handsetFlat: handsetFlat, cord: cord, cordAlong: cordAlong, musicNote: musicNote, burst: burst,
    phoneBody: phoneBody, voiceFace: voiceFace, agentFace: agentFace, agentCutout: agentCutout, clock: clock, mug: mug,
    padlock: padlock, signal: signal
  };
})();
