// Scrubbed: the drawings. Space Billionaire, his rocket, the barge, the chase
// boat, the sea, his launch party and Mars, all drawn in code: outline first,
// flat fill, the four inks, halftone for shade (DESIGN.md, section 7).
//
// Everything is in world units with up negative (the canvas's own way round),
// standing on 0,0. The camera's zoom (CSS pixels to a world unit) is passed in
// with setView, so lines and halftone never go thinner than a pixel or two
// however far out the camera is.
(function () {
  "use strict";

  var T = null;      // colour tokens
  var DPR = 1;       // device pixels per CSS pixel
  var Z = 1;         // CSS pixels per world unit, right now
  var tiles = {};

  function init(tokens) { T = tokens; }
  function setView(dpr, zoom) { DPR = dpr; Z = zoom; }
  // a line that's at least n CSS pixels wide, in world units
  function thick(w, n) { return Math.max(w, (n || 1.1) / Z); }

  // Halftone dots in one ink, about `size` world units apart, but never
  // closer than three device pixels. The pattern sits in whatever space it's
  // filled in, so a halftone on the rocket moves with the rocket.
  function dots(c, colour, size) {
    var dev = Math.max(3, Math.round((size || 0.5) * Z * DPR));
    var key = colour + "|" + dev;
    var tile = tiles[key];
    if (!tile) {
      tile = document.createElement("canvas");
      tile.width = tile.height = dev * 2;
      var x = tile.getContext("2d");
      x.fillStyle = colour;
      [[dev / 2, dev / 2], [dev * 1.5, dev * 1.5]].forEach(function (p) {
        x.beginPath();
        x.arc(p[0], p[1], Math.max(0.6, dev * 0.21), 0, Math.PI * 2);
        x.fill();
      });
      tiles[key] = tile;
    }
    var pat = c.createPattern(tile, "repeat");
    if (pat && pat.setTransform && window.DOMMatrix && c.getTransform) {
      var m = c.getTransform();
      var s = Math.hypot(m.a, m.b) || 1;
      pat.setTransform(new DOMMatrix().scale(1 / s));
    }
    return pat;
  }
  function shade(c, size) { return dots(c, T.ink, size); }

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
    if (c.roundRect) c.roundRect(x, y, w, h, Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2)));
    else c.rect(x, y, w, h);
  }
  // shade the part of a round shape away from the light (top left)
  function crescent(c, path, cx, cy, rx, ry, size) {
    c.save();
    c.clip(path);
    c.fillStyle = shade(c, size);
    c.beginPath();
    c.ellipse(cx, cy, rx * 1.1, ry * 1.1, 0, 0, Math.PI * 2);
    c.ellipse(cx - rx * 0.24, cy - ry * 0.26, rx, ry, 0, 0, Math.PI * 2);
    c.fill("evenodd");
    c.restore();
  }

  // The Notaste sparkle: four points, curved in (stars, glints, the flag)
  function sparkle(c, x, y, r, fill) {
    c.beginPath();
    c.moveTo(x, y - r);
    c.quadraticCurveTo(x + r * 0.12, y - r * 0.12, x + r, y);
    c.quadraticCurveTo(x + r * 0.12, y + r * 0.12, x, y + r);
    c.quadraticCurveTo(x - r * 0.12, y + r * 0.12, x - r, y);
    c.quadraticCurveTo(x - r * 0.12, y - r * 0.12, x, y - r);
    c.closePath();
    c.fillStyle = fill;
    c.fill();
  }

  // ---------------------------------------------------------------------------
  // Heads. The house cut-out (DESIGN.md, section 7): white, round, as wide as
  // the shoulders, oval eyes with small pupils, furious eyebrows, a frown and
  // a second chin. o: { mood: cross | shout | smug | grin | calm | worried,
  // gaze -1 to 1, look: shades | hat | perm | cap | bun | specs | tache, lw }
  // ---------------------------------------------------------------------------
  function head(c, x, y, r, o) {
    o = o || {};
    var lw = o.lw || Math.max(0.05, r * 0.13);
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
    crescent(c, face, x, y, r, r, r * 0.22);
    ink(c, lw);
    c.stroke(face);

    if (o.soot) {
      c.save();
      c.clip(face);
      c.fillStyle = shade(c, r * 0.2);
      c.beginPath(); c.ellipse(x - r * 0.3, y + r * 0.1, r * 0.7, r * 0.5, 0.3, 0, Math.PI * 2); c.fill();
      c.restore();
    }

    var ex = r * 0.34, ey = y - r * 0.08;
    if (look === "shades") {
      // his one thing: sunglasses, a black bar with a glint, as in Thonglets
      c.beginPath();
      c.moveTo(x - r * 0.86 + g, ey - r * 0.2);
      c.lineTo(x + r * 0.86 + g, ey - r * 0.2);
      c.quadraticCurveTo(x + r * 0.84 + g, ey + r * 0.24, x + r * 0.48 + g, ey + r * 0.24);
      c.quadraticCurveTo(x + r * 0.12 + g, ey + r * 0.24, x + g, ey + r * 0.02);
      c.quadraticCurveTo(x - r * 0.12 + g, ey + r * 0.24, x - r * 0.48 + g, ey + r * 0.24);
      c.quadraticCurveTo(x - r * 0.84 + g, ey + r * 0.24, x - r * 0.86 + g, ey - r * 0.2);
      c.closePath();
      c.fillStyle = T.ink;
      c.fill();
      ink(c, lw * 0.5, T.paper);
      c.beginPath();
      [-1, 1].forEach(function (s) {
        c.moveTo(x + s * r * 0.62 + g - r * 0.08, ey - r * 0.06);
        c.lineTo(x + s * r * 0.62 + g + r * 0.06, ey - r * 0.14);
      });
      c.stroke();
    } else {
      [-1, 1].forEach(function (s) {
        oval(c, x + s * ex + g, ey, r * 0.2, r * 0.25, T.paper, lw * 0.75);
        var px = x + s * ex + g + (o.gaze || 0) * r * 0.08 - s * r * 0.03;
        oval(c, px, ey + r * 0.03, r * 0.085, r * 0.085, T.ink);
      });
      if (look === "specs") {
        ink(c, lw * 0.8);
        [-1, 1].forEach(function (s) { c.beginPath(); c.ellipse(x + s * ex + g, ey, r * 0.29, r * 0.31, 0, 0, Math.PI * 2); c.stroke(); });
        c.beginPath(); c.moveTo(x - ex + g + r * 0.29, ey); c.lineTo(x + ex + g - r * 0.29, ey); c.stroke();
      }
    }

    // eyebrows
    ink(c, lw * 1.3);
    c.beginPath();
    var top = look === "shades" ? r * 0.12 : 0;
    [-1, 1].forEach(function (s) {
      var ox = x + g + s * r * 0.6, ix = x + g + s * r * 0.12;
      if (mood === "smug" || mood === "grin") {
        // one up, one level: pleased with himself
        var up = s === (o.gaze >= 0 ? 1 : -1) ? r * 0.16 : 0;
        c.moveTo(ox, y - r * 0.44 - top - up); c.quadraticCurveTo((ox + ix) / 2, y - r * 0.56 - top - up, ix, y - r * 0.46 - top - up * 0.6);
      } else if (mood === "worried") {
        c.moveTo(ox, y - r * 0.36 - top); c.lineTo(ix, y - r * 0.54 - top);
      } else if (mood === "calm") {
        c.moveTo(ox, y - r * 0.43 - top); c.lineTo(ix, y - r * 0.47 - top);
      } else {
        c.moveTo(ox, y - r * 0.58 - top); c.lineTo(ix, y - r * 0.3 - top * 0.4);
      }
    });
    c.stroke();

    // mouth
    var mx = x + g * 1.1, my = y + r * 0.44;
    if (mood === "shout") {
      oval(c, mx, my, r * 0.25, r * 0.21, T.ink);
      oval(c, mx, my + r * 0.1, r * 0.13, r * 0.07, T.red);
    } else if (mood === "grin") {
      c.beginPath();
      c.moveTo(mx - r * 0.32, my - r * 0.06);
      c.quadraticCurveTo(mx, my - r * 0.02, mx + r * 0.32, my - r * 0.06);
      c.quadraticCurveTo(mx, my + r * 0.36, mx - r * 0.32, my - r * 0.06);
      c.closePath();
      c.fillStyle = T.ink; c.fill();
      c.fillStyle = T.paper;
      c.fillRect(mx - r * 0.22, my - r * 0.04, r * 0.44, r * 0.08);
    } else if (mood === "smug") {
      ink(c, lw * 0.95);
      var side = o.gaze >= 0 ? 1 : -1;
      c.beginPath();
      c.moveTo(mx - side * r * 0.22, my + r * 0.04);
      c.quadraticCurveTo(mx + side * r * 0.06, my + r * 0.1, mx + side * r * 0.3, my - r * 0.1);
      c.stroke();
    } else if (mood === "worried") {
      ink(c, lw * 0.95);
      c.beginPath(); c.moveTo(mx - r * 0.16, my + r * 0.06); c.quadraticCurveTo(mx, my - r * 0.04, mx + r * 0.16, my + r * 0.06); c.stroke();
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

    if (look === "hat") {
      // a party hat: an accent cone with red dots and a paper bobble
      var hx = x + g * 0.4;
      c.beginPath();
      c.moveTo(hx - r * 0.55, y - r * 0.8);
      c.lineTo(hx + r * 0.1, y - r * 1.85);
      c.lineTo(hx + r * 0.62, y - r * 0.74);
      c.closePath();
      c.fillStyle = T.accent; c.fill(); ink(c, lw * 0.85); c.stroke();
      oval(c, hx - r * 0.05, y - r * 1.05, r * 0.08, r * 0.08, T.red);
      oval(c, hx + r * 0.2, y - r * 1.35, r * 0.07, r * 0.07, T.red);
      oval(c, hx + r * 0.1, y - r * 1.9, r * 0.14, r * 0.14, T.paper, lw * 0.6);
    } else if (look === "cap") {
      c.beginPath();
      c.moveTo(x - r * 0.98, y - r * 0.32);
      c.quadraticCurveTo(x - r, y - r * 1.12, x, y - r * 1.12);
      c.quadraticCurveTo(x + r, y - r * 1.12, x + r * 0.98, y - r * 0.32);
      c.closePath();
      c.fillStyle = T.red; c.fill(); ink(c, lw); c.stroke();
      var dir = (o.gaze || 0) >= 0 ? -1 : 1;    // backwards
      oval(c, x + dir * r * 0.75, y - r * 0.36, r * 0.62, r * 0.17, T.red, lw);
    }
  }

  // A mitten on the end of an arm: a thick ink line with a paper core
  function arm(c, x0, y0, x1, y1, lw, w, fill) {
    c.beginPath();
    c.moveTo(x0, y0);
    c.lineTo(x1, y1);
    ink(c, w + lw * 2);
    c.stroke();
    ink(c, w, fill || T.paper);
    c.stroke();
    oval(c, x1, y1, w * 0.62, w * 0.58, T.paper, lw);
  }

  // ---------------------------------------------------------------------------
  // Space Billionaire. The house cut-out in his sunglasses (his face is in the
  // porthole of his rocket in Thonglets), an accent flight jacket with a red
  // mission patch, and a phone on a selfie stick: he's live. About five units
  // tall, standing on 0,0, facing right unless o.face is -1.
  // o: { pose: film | cheer | shout | point, mood, face, gaze, soot, lw }
  // ---------------------------------------------------------------------------
  function billionaire(c, o) {
    o = o || {};
    var lw = thick(0.11, 1);
    var f = o.face || 1;
    var pose = o.pose || "film";
    c.save();
    c.scale(f, 1);
    // legs: black trousers with a paper edge, so they read on black
    rrect(c, -0.95, -1.5, 0.75, 1.45, 0.2);
    c.fillStyle = T.ink; c.fill(); ink(c, lw * 0.8, T.paper); c.stroke();
    rrect(c, 0.2, -1.5, 0.75, 1.45, 0.2);
    c.fill(); c.stroke();
    oval(c, -0.62, -0.16, 0.62, 0.26, T.ink, lw * 0.8, T.paper);
    oval(c, 0.72, -0.16, 0.62, 0.26, T.ink, lw * 0.8, T.paper);

    // the back arm
    if (pose !== "cheer") arm(c, -1.1, -2.9, -1.55, -1.75, lw, 0.62, T.accent);

    // body: the jacket, with a zip and a patch
    var body = new Path2D();
    body.ellipse(0, -2.55, 1.5, 1.45, 0, 0, Math.PI * 2);
    c.fillStyle = T.accent;
    c.fill(body);
    crescent(c, body, 0, -2.55, 1.5, 1.45, 0.22);
    ink(c, lw);
    c.stroke(body);
    ink(c, lw * 0.6);
    c.beginPath(); c.moveTo(0.25, -3.9); c.lineTo(0.3, -1.15); c.stroke();
    oval(c, 0.85, -2.85, 0.32, 0.32, T.red, lw * 0.6);
    sparkle(c, 0.85, -2.85, 0.2, T.paper);

    // the front arm and the selfie stick
    if (pose === "film") {
      arm(c, 1.05, -3.0, 1.75, -3.9, lw, 0.62, T.accent);
      ink(c, lw * 2.2); c.beginPath(); c.moveTo(1.75, -3.9); c.lineTo(2.9, -6.5); c.stroke();
      ink(c, lw * 0.9, T.paper); c.stroke();
      c.save(); c.translate(3.0, -6.8); c.rotate(-0.4);
      rrect(c, -0.42, -0.62, 0.84, 1.24, 0.16);
      c.fillStyle = T.ink; c.fill(); ink(c, lw * 0.8, T.paper); c.stroke();
      oval(c, 0, -0.32, 0.13, 0.13, T.red);
      c.restore();
    } else if (pose === "cheer") {
      arm(c, -1.0, -3.2, -1.9, -5.2, lw, 0.62, T.accent);
      arm(c, 1.0, -3.2, 1.9, -5.2, lw, 0.62, T.accent);
    } else if (pose === "point") {
      arm(c, 1.05, -3.0, 2.45, -3.7, lw, 0.62, T.accent);
    } else {
      // shout: the phone lowered, a fist up
      arm(c, 1.05, -3.0, 1.7, -4.9, lw, 0.62, T.accent);
    }

    head(c, 0, -4.8, 1.38, { mood: o.mood || "smug", gaze: (o.gaze != null ? o.gaze : 0.6), look: "shades", lw: lw, soot: o.soot });
    c.restore();
  }

  // A party guest: the cut-out from the waist up behind nothing, in a party
  // hat, holding a phone up to film. o: { look, mood, duck (0-1), lw, phone }
  function guest(c, o) {
    o = o || {};
    var lw = thick(0.1, 1);
    var d = o.duck || 0;
    c.save();
    c.translate(0, d * 1.2);
    rrect(c, -0.8, -1.4, 0.65, 1.4, 0.2);
    c.fillStyle = T.ink; c.fill(); ink(c, lw * 0.8, T.paper); c.stroke();
    rrect(c, 0.15, -1.4, 0.65, 1.4, 0.2);
    c.fill(); c.stroke();
    var body = new Path2D();
    body.ellipse(0, -2.4, 1.3, 1.3, 0, 0, Math.PI * 2);
    c.fillStyle = o.top || T.paper;
    c.fill(body);
    crescent(c, body, 0, -2.4, 1.3, 1.3, 0.22);
    ink(c, lw); c.stroke(body);
    if (d > 0.5) {
      // arms over the head
      arm(c, -0.9, -3.2, -0.3, -5.6, lw, 0.5);
      arm(c, 0.9, -3.2, 0.3, -5.6, lw, 0.5);
    } else if (o.phone) {
      arm(c, 0.8, -2.8, 1.5, -4.4, lw, 0.5);
      c.save(); c.translate(1.55, -5.0);
      rrect(c, -0.36, -0.55, 0.72, 1.1, 0.14);
      c.fillStyle = T.ink; c.fill(); ink(c, lw * 0.7, T.paper); c.stroke();
      c.fillStyle = T.paper; c.fillRect(-0.24, -0.42, 0.48, 0.72);
      c.restore();
    } else {
      arm(c, 0.95, -2.7, 1.4, -1.8, lw, 0.5);
    }
    head(c, 0, -4.4, 1.2, { mood: d > 0.5 ? "shout" : o.mood || "calm", gaze: o.gaze || 0, look: o.look, lw: lw });
    c.restore();
  }

  // ---------------------------------------------------------------------------
  // The rocket: the same one as in Thonglets. A white bullet, a red nose cone,
  // red fins, and an accent porthole with a cardboard cut-out of him in it,
  // with landing legs and an engine bell added for coming back down. Drawn
  // in Thonglets' own units (86 tall, feet at 0) and scaled by k.
  // o: { k, legs 0-1, flame 0-1, t, mods: { fins, tanks, engine, beta, legs, cheap }, wreck }
  // ---------------------------------------------------------------------------
  var LEG_X = 23, LEG_WIDE = 28;
  function rocket(c, o) {
    o = o || {};
    var k = o.k || 0.15;
    var m = o.mods || {};
    var lw = Math.max(2.2, 1.2 / (Z * k));
    c.save();
    c.scale(k, k);
    ink(c, lw);

    // flame first, so the bell sits over it
    if (o.flame > 0.02) flame(c, 0, -5, o.flame * (m.engine ? 1.25 : 1), o.t || 0, lw, m.engine ? 1.3 : 1);

    // legs: hinged low on the body, folded up the side until they deploy
    var spread = m.legs ? LEG_WIDE : LEG_X;
    var d = Math.max(0, Math.min(1, o.legs || 0));
    var squash = o.squash || 0;
    [-1, 1].forEach(function (s) {
      var hx = s * 9.4, hy = -30;
      var fx = s * (10.5 + (spread - 10.5) * d), fy = -9 + 9 * d + squash * 2;
      ink(c, lw * 3.2);
      c.beginPath(); c.moveTo(hx, hy); c.lineTo(fx, fy); c.stroke();
      ink(c, lw * 1.25, m.cheap ? T.accent : T.paper);
      c.stroke();
      // a strut from the bottom of the body to halfway down the leg
      if (d > 0.2) {
        ink(c, lw * 1.8);
        c.beginPath(); c.moveTo(s * 9.5, -13); c.lineTo((hx + fx) / 2, (hy + fy) / 2); c.stroke();
        ink(c, lw * 0.7, T.paper); c.stroke();
      }
      if (m.cheap && d > 0.5) {
        // held on with tape
        c.save(); c.translate((hx + fx) * 0.5, (hy + fy) * 0.5); c.rotate(Math.atan2(fy - hy, fx - hx));
        c.fillStyle = T.red; c.fillRect(-1.5, -2.4, 3, 4.8);
        c.restore();
      }
      oval(c, fx, fy - 0.6, 3.4 * (0.4 + 0.6 * d), 1.4, T.paper, lw * 0.8);
    });

    // fins
    c.fillStyle = T.red;
    [-1, 1].forEach(function (s) {
      c.beginPath(); c.moveTo(s * 9, -36); c.lineTo(s * 19, -15); c.lineTo(s * 9.5, -19); c.closePath();
      c.fill(); ink(c, lw); c.stroke();
    });

    // the engine bell
    c.beginPath();
    c.moveTo(-5, -12); c.lineTo(5, -12); c.lineTo(7.4, -4.5); c.lineTo(-7.4, -4.5); c.closePath();
    c.fillStyle = T.ink; c.fill();
    ink(c, lw * 0.75, T.paper); c.stroke();

    // body
    var body = new Path2D();
    body.moveTo(0, -86);
    body.bezierCurveTo(12, -72, 12, -38, 10, -12);
    body.lineTo(-10, -12);
    body.bezierCurveTo(-12, -38, -12, -72, 0, -86);
    body.closePath();
    c.fillStyle = T.paper;
    c.fill(body);
    // halftone down the right side, and a scorched lower half after re-entry
    c.save();
    c.clip(body);
    c.fillStyle = shade(c, 2.4);
    c.beginPath(); c.ellipse(13, -46, 9, 46, 0, 0, Math.PI * 2); c.fill();
    if (o.wreck) { c.beginPath(); c.rect(-14, -50, 28, 40); c.fill(); }
    // a band low on the body, a second for bigger tanks
    c.fillStyle = T.red;
    c.fillRect(-14, -27, 28, 4.5);
    if (m.tanks) c.fillRect(-14, -36, 28, 3);
    c.restore();
    ink(c, lw);
    c.stroke(body);

    // nose cone
    c.beginPath();
    c.moveTo(0, -86); c.bezierCurveTo(6, -79, 8, -72, 8.6, -68); c.lineTo(-8.6, -68); c.bezierCurveTo(-8, -72, -6, -79, 0, -86); c.closePath();
    c.fillStyle = T.red; c.fill(); c.stroke();

    // grid fins: two paper waffles sticking out below the nose
    if (m.fins) {
      [-1, 1].forEach(function (s) {
        rrect(c, s > 0 ? 9.5 : -16.5, -66, 7, 6, 0.8);
        c.fillStyle = T.paper; c.fill(); ink(c, lw * 0.8); c.stroke();
        ink(c, lw * 0.45);
        c.beginPath();
        for (var i = 1; i < 3; i++) {
          var gx = (s > 0 ? 9.5 : -16.5) + i * 7 / 3;
          c.moveTo(gx, -66); c.lineTo(gx, -60);
          c.moveTo(s > 0 ? 9.5 : -16.5, -66 + i * 2); c.lineTo(s > 0 ? 16.5 : -9.5, -66 + i * 2);
        }
        c.stroke();
      });
    }

    // the porthole, and the cardboard him
    oval(c, 0, -52, 6.6, 6.6, T.accent, lw);
    oval(c, 0, -50.6, 3.7, 3.7, T.paper);
    c.fillStyle = T.ink;
    c.fillRect(-3.4, -52.4, 6.8, 1.7);
    ink(c, lw * 0.4);
    c.beginPath(); c.moveTo(-0.8, -48.6); c.quadraticCurveTo(0.6, -48.1, 1.6, -49.2); c.stroke();
    // beta: a sticker on the side
    if (m.beta) {
      c.save(); c.translate(-4, -36); c.rotate(-0.2);
      rrect(c, -3.6, -2.2, 7.2, 4.4, 0.8);
      c.fillStyle = T.accent; c.fill(); ink(c, lw * 0.6); c.stroke();
      c.fillStyle = T.ink; c.fillRect(-2.2, -0.5, 4.4, 1);
      c.restore();
    }
    c.restore();
  }

  // An engine flame, pointing down from x,y: red outside, accent, then paper
  function flame(c, x, y, f, t, lw, wide) {
    var flick = 0.86 + 0.14 * Math.sin(t * 47) * Math.sin(t * 23 + 1);
    var L = (14 + 30 * f) * flick;
    var w = 6.6 * (wide || 1) * (0.75 + 0.25 * f);
    [[1, T.red], [0.7, T.accent], [0.4, T.paper]].forEach(function (layer, i) {
      var s = layer[0];
      c.beginPath();
      c.moveTo(x - w * s, y);
      c.bezierCurveTo(x - w * s * 1.1, y + L * s * 0.5, x - w * s * 0.25, y + L * s * 0.85, x, y + L * (s * 0.9 + 0.1));
      c.bezierCurveTo(x + w * s * 0.25, y + L * s * 0.85, x + w * s * 1.1, y + L * s * 0.5, x + w * s, y);
      c.closePath();
      c.fillStyle = layer[1];
      c.fill();
      if (i === 0) { ink(c, lw); c.stroke(); }
    });
  }

  // A tongue of fire, from its base at 0,0 up to h tall: the same three inks
  function fire(c, x, y, h, w, t, lw) {
    var sway = Math.sin(t * 9 + x) * w * 0.3;
    [[1, T.red], [0.68, T.accent], [0.36, T.paper]].forEach(function (layer, i) {
      var s = layer[0];
      c.beginPath();
      c.moveTo(x - w * s, y);
      c.bezierCurveTo(x - w * s * 1.15, y - h * s * 0.5, x + sway - w * s * 0.2, y - h * s * 0.75, x + sway * 1.4, y - h * s);
      c.bezierCurveTo(x + sway + w * s * 0.35, y - h * s * 0.7, x + w * s * 1.15, y - h * s * 0.45, x + w * s, y);
      c.closePath();
      c.fillStyle = layer[1];
      c.fill();
      if (i === 0) { ink(c, lw); c.stroke(); }
    });
  }

  // A burst: a spiky star for the moment it goes up
  function burst(c, x, y, r, spikes, t, lw) {
    [[1, T.red], [0.72, T.accent], [0.42, T.paper]].forEach(function (layer, i) {
      var s = layer[0];
      c.beginPath();
      for (var j = 0; j <= spikes * 2; j++) {
        var a = (j / (spikes * 2)) * Math.PI * 2 + t * 0.6;
        var rr = r * s * (j % 2 ? 0.58 : 1) * (1 + 0.12 * Math.sin(j * 2.7 + t * 30));
        var px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr * 0.86;
        if (j) c.lineTo(px, py); else c.moveTo(px, py);
      }
      c.closePath();
      c.fillStyle = layer[1];
      c.fill();
      if (i === 0) { ink(c, lw); c.stroke(); }
    });
  }

  // A puff of smoke: white circles with the accent offset behind (section 7)
  function puff(c, x, y, r, alpha, front, back) {
    c.globalAlpha = alpha;
    var off = r * 0.22;
    c.fillStyle = back || T.accent;
    c.beginPath();
    c.arc(x + off, y + off, r, 0, Math.PI * 2);
    c.arc(x - r * 0.75 + off, y + r * 0.3 + off, r * 0.7, 0, Math.PI * 2);
    c.arc(x + r * 0.8 + off, y + r * 0.25 + off, r * 0.62, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = front || T.paper;
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.arc(x - r * 0.75, y + r * 0.3, r * 0.7, 0, Math.PI * 2);
    c.arc(x + r * 0.8, y + r * 0.25, r * 0.62, 0, Math.PI * 2);
    c.fill();
    c.globalAlpha = 1;
  }

  // ---------------------------------------------------------------------------
  // The barge, side on and seen from a little above so the cross shows: a
  // grey deck (paper halftone on black), hazard stripes along the edge, a
  // black hull with a paper edge and its name on the side, a windsock. The
  // deck's surface is at 0. o: { w, name, wind, t, scorch: [x], cross }
  // ---------------------------------------------------------------------------
  var DECK_UP = 0.85, DECK_DOWN = 0.55, HULL = 3.4;
  function barge(c, o) {
    var w = o.w, h = w / 2;
    var lw = thick(0.14, 1.2);
    // the hull's front, down past the waterline
    c.beginPath();
    c.moveTo(-h, DECK_DOWN);
    c.lineTo(h, DECK_DOWN);
    c.lineTo(h - 0.6, HULL + 1.5);
    c.lineTo(-h + 0.6, HULL + 1.5);
    c.closePath();
    c.fillStyle = T.ink; c.fill();
    c.save(); c.clip();
    c.fillStyle = dots(c, T.paper, 0.7);
    c.fillRect(h - 3.5, DECK_DOWN, 4, HULL + 2);
    // hazard stripes along the top of the hull
    c.beginPath(); c.rect(-h, DECK_DOWN, w, 0.75); c.fillStyle = T.paper; c.fill();
    c.fillStyle = T.red;
    for (var x = -h - 1; x < h + 1; x += 1.6) {
      c.beginPath();
      c.moveTo(x, DECK_DOWN); c.lineTo(x + 0.8, DECK_DOWN); c.lineTo(x + 0.4, DECK_DOWN + 0.75); c.lineTo(x - 0.4, DECK_DOWN + 0.75);
      c.closePath(); c.fill();
    }
    c.restore();
    ink(c, lw, T.paper);
    c.beginPath();
    c.moveTo(-h, DECK_DOWN); c.lineTo(-h + 0.6, HULL + 1.5); c.moveTo(h, DECK_DOWN); c.lineTo(h - 0.6, HULL + 1.5);
    c.stroke();

    // the deck, from a little above
    c.beginPath();
    c.moveTo(-h + 0.5, -DECK_UP);
    c.lineTo(h - 0.5, -DECK_UP);
    c.lineTo(h, DECK_DOWN);
    c.lineTo(-h, DECK_DOWN);
    c.closePath();
    c.fillStyle = T.ink; c.fill();
    c.save(); c.clip();
    c.fillStyle = dots(c, T.paper, 0.55);
    c.fillRect(-h, -DECK_UP, w, DECK_UP + DECK_DOWN);
    // scorch marks where rockets came down hard
    (o.scorch || []).forEach(function (s) {
      c.fillStyle = T.ink;
      c.beginPath();
      for (var i = 0; i < 14; i++) {
        var a = i / 14 * Math.PI * 2, rr = (i % 2 ? 2.2 : 3.3) * s.r;
        var px = s.x + Math.cos(a) * rr, py = Math.sin(a) * rr * 0.28;
        if (i) c.lineTo(px, py); else c.moveTo(px, py);
      }
      c.closePath(); c.fill();
    });
    c.restore();
    ink(c, lw, T.paper);
    c.beginPath();
    c.moveTo(-h + 0.5, -DECK_UP); c.lineTo(h - 0.5, -DECK_UP); c.lineTo(h, DECK_DOWN); c.lineTo(-h, DECK_DOWN); c.closePath();
    c.stroke();

    // the cross: a paper ring with a red cross in it, flattened by the angle
    var cx = o.cross || 0, rx = Math.min(4, w * 0.17);
    oval(c, cx, -0.12, rx, 0.62, T.ink, lw, T.paper);
    ink(c, lw * 1.9, T.red);
    c.beginPath();
    c.moveTo(cx - rx * 0.55, -0.48); c.lineTo(cx + rx * 0.55, 0.24);
    c.moveTo(cx + rx * 0.55, -0.48); c.lineTo(cx - rx * 0.55, 0.24);
    c.stroke();

    // lights at the corners
    [-1, 1].forEach(function (s) {
      ink(c, lw * 0.7, T.paper);
      c.beginPath(); c.moveTo(s * (h - 0.9), -DECK_UP + 0.1); c.lineTo(s * (h - 0.9), -DECK_UP - 0.9); c.stroke();
      oval(c, s * (h - 0.9), -DECK_UP - 1.1, 0.32, 0.32, T.red, lw * 0.6);
    });

    windsock(c, -h + 1.8, -DECK_UP + 0.2, o.wind || 0, o.t || 0, lw);
  }

  // A windsock on a pole: red and paper rings, straighter in a stronger wind
  function windsock(c, x, y, wind, t, lw) {
    var top = y - 5.2;
    ink(c, lw * 1.6); c.beginPath(); c.moveTo(x, y); c.lineTo(x, top); c.stroke();
    ink(c, lw * 0.7, T.paper); c.stroke();
    var s = Math.max(0, Math.min(1, Math.abs(wind) / 9));
    var dir = wind >= 0 ? 1 : -1;
    var flap = Math.sin(t * (4 + s * 8)) * 0.06 * (0.3 + s);
    var ang = (1 - s) * 1.25 + flap;        // from hanging down (1.25 rad) to straight out
    c.save();
    c.translate(x, top + 0.2);
    c.scale(dir, 1);
    c.rotate(ang);
    var L = 3.4;
    for (var i = 0; i < 4; i++) {
      var a = i / 4, b = (i + 1) / 4;
      var r0 = 0.7 * (1 - a * 0.55), r1 = 0.7 * (1 - b * 0.55);
      c.beginPath();
      c.moveTo(a * L, -r0); c.lineTo(b * L, -r1); c.lineTo(b * L, r1); c.lineTo(a * L, r0); c.closePath();
      c.fillStyle = i % 2 ? T.paper : T.red;
      c.fill();
    }
    ink(c, lw * 0.8);
    c.beginPath(); c.moveTo(0, -0.7); c.lineTo(L, -0.7 * 0.45); c.lineTo(L, 0.7 * 0.45); c.lineTo(0, 0.7); c.closePath(); c.stroke();
    c.restore();
  }

  // The chase boat he films from: a small black boat with a paper edge, a red
  // stripe and a paper cabin. Waterline at 0; he stands on the stern deck.
  var BOAT_DECK = -1.1, BOAT_STAND = -2.8;
  function boat(c, o) {
    o = o || {};
    var lw = thick(0.13, 1.1);
    // hull: the bow points left, at the barge
    c.beginPath();
    c.moveTo(-5.6, BOAT_DECK - 0.4);
    c.lineTo(4.6, BOAT_DECK);
    c.lineTo(4.2, 1.4);
    c.quadraticCurveTo(-2.5, 1.6, -4.6, 0.6);
    c.closePath();
    c.fillStyle = T.ink; c.fill();
    ink(c, lw, T.paper); c.stroke();
    c.save(); c.clip();
    c.fillStyle = T.red; c.fillRect(-6, -0.25, 11, 0.45);
    c.restore();
    // the cabin, at the bow
    rrect(c, -3.6, BOAT_DECK - 2.6, 3.6, 2.4, 0.3);
    c.fillStyle = T.paper; c.fill(); ink(c, lw); c.stroke();
    c.fillStyle = T.ink;
    c.fillRect(-3.1, BOAT_DECK - 2.1, 1.1, 0.8);
    c.fillRect(-1.6, BOAT_DECK - 2.1, 1.1, 0.8);
    c.save();
    c.beginPath(); c.rect(-3.6, BOAT_DECK - 2.6, 3.6, 2.4); c.clip();
    c.fillStyle = shade(c, 0.4); c.fillRect(-1.2, BOAT_DECK - 2.6, 1.2, 2.4);
    c.restore();
    // an aerial with a red light
    ink(c, lw * 0.8, T.paper); c.beginPath(); c.moveTo(-1.2, BOAT_DECK - 2.6); c.lineTo(-1.2, BOAT_DECK - 4.4); c.stroke();
    oval(c, -1.2, BOAT_DECK - 4.5, 0.25, 0.25, T.red);
    // the stern deck he stands on
    c.fillStyle = dots(c, T.paper, 0.5);
    c.fillRect(0.2, BOAT_DECK - 0.55, 4.2, 0.5);
  }

  // ---------------------------------------------------------------------------
  // The launch party (stage 4): his lawn, a striped marquee, a pool, a cake
  // and his guests, filming. Lawn surface at 0, the landing zone between the
  // marquee and the pool. o: { t, lit (the marquee's on fire), cake }
  // ---------------------------------------------------------------------------
  var PARTY = { marquee: [-27, -14], cake: -11.5, pool: [12, 21], terrace: [22, 34], bunting: [-14, 22] };
  function lawn(c, x0, x1, deep) {
    var lw = thick(0.14, 1.2);
    c.fillStyle = T.ink;
    c.fillRect(x0, 0, x1 - x0, deep);
    // mown stripes: paper halftone, heavier and lighter
    for (var x = Math.floor(x0 / 6) * 6; x < x1; x += 6) {
      c.fillStyle = dots(c, T.paper, ((x / 6) % 2) ? 0.5 : 0.75);
      c.beginPath();
      c.moveTo(x, -0.7); c.lineTo(x + 6, -0.7); c.lineTo(x + 6.6, deep); c.lineTo(x + 0.6, deep); c.closePath();
      c.fill();
    }
    ink(c, lw, T.paper);
    c.beginPath(); c.moveTo(x0, -0.7); c.lineTo(x1, -0.7); c.stroke();
  }
  function party(c, o) {
    var lw = thick(0.14, 1.2), t = o.t || 0;
    // the cross, painted on the lawn
    oval(c, 0, -0.1, 3.4, 0.55, T.ink, lw, T.paper);
    ink(c, lw * 1.9, T.red);
    c.beginPath(); c.moveTo(-1.9, -0.42); c.lineTo(1.9, 0.22); c.moveTo(1.9, -0.42); c.lineTo(-1.9, 0.22); c.stroke();

    // the pool: sunk into the lawn, ink water with paper ripples, a diving board
    var p0 = PARTY.pool[0], p1 = PARTY.pool[1];
    c.beginPath(); c.moveTo(p0, -0.7); c.lineTo(p1, -0.7); c.lineTo(p1 + 0.4, 0.8); c.lineTo(p0 - 0.4, 0.8); c.closePath();
    c.fillStyle = T.ink; c.fill(); ink(c, lw, T.paper); c.stroke();
    ink(c, lw * 0.7, T.paper);
    c.beginPath();
    for (var i = 0; i < 3; i++) {
      var wx = p0 + 1.5 + i * 2.8 + Math.sin(t * 1.5 + i) * 0.4;
      c.moveTo(wx, 0.05); c.quadraticCurveTo(wx + 0.6, -0.25, wx + 1.2, 0.05);
    }
    c.stroke();
    rrect(c, p1 - 3.8, -1.5, 3.4, 0.45, 0.15); c.fillStyle = T.paper; c.fill(); ink(c, lw * 0.8); c.stroke();
    c.fillStyle = T.paper; c.fillRect(p1 - 0.9, -1.1, 0.5, 0.45);

    // bunting from the marquee to a pole by the pool
    var b0 = PARTY.bunting[0], b1 = PARTY.bunting[1], by = -11.5;
    ink(c, lw * 1.4, T.paper); c.beginPath(); c.moveTo(b1, 0); c.lineTo(b1, by - 0.4); c.stroke();
    ink(c, lw * 0.6, T.paper);
    c.beginPath(); c.moveTo(b0, by); c.quadraticCurveTo((b0 + b1) / 2, by + 3.2, b1, by); c.stroke();
    var n = 14;
    for (var j = 1; j < n; j++) {
      var u = j / n, x = b0 + (b1 - b0) * u, y = by + 6.4 * u * (1 - u) * 1;
      c.beginPath(); c.moveTo(x - 0.55, y); c.lineTo(x + 0.55, y); c.lineTo(x + Math.sin(t * 3 + j) * 0.12, y + 1.2); c.closePath();
      c.fillStyle = [T.red, T.paper, T.accent][j % 3]; c.fill(); ink(c, lw * 0.5); c.stroke();
    }

    // the marquee: red and paper stripes, a peaked roof and a scalloped edge
    var m0 = PARTY.marquee[0], m1 = PARTY.marquee[1], top = -8.5, peak = -12.2;
    c.beginPath(); c.rect(m0, top, m1 - m0, -top);
    c.fillStyle = T.paper; c.fill();
    c.save(); c.clip();
    c.fillStyle = T.red;
    for (var sx = m0; sx < m1; sx += 2.6) c.fillRect(sx, top, 1.3, -top);
    c.fillStyle = shade(c, 0.6); c.fillRect(m1 - 3, top, 3, -top);
    c.restore();
    // the doorway
    c.beginPath(); c.moveTo(m1 - 6, 0); c.lineTo(m1 - 4.6, top + 2.2); c.lineTo(m1 - 3.2, 0); c.closePath();
    c.fillStyle = T.ink; c.fill();
    ink(c, lw); c.beginPath(); c.rect(m0, top, m1 - m0, -top); c.stroke();
    c.beginPath(); c.moveTo(m0 - 0.6, top); c.lineTo((m0 + m1) / 2, peak); c.lineTo(m1 + 0.6, top); c.closePath();
    c.fillStyle = T.paper; c.fill();
    c.save(); c.clip();
    c.fillStyle = T.red;
    for (var rx = m0 - 1; rx < m1 + 1; rx += 2.6) {
      c.beginPath(); c.moveTo((m0 + m1) / 2, peak); c.lineTo(rx, top); c.lineTo(rx + 1.3, top); c.closePath(); c.fill();
    }
    c.restore();
    ink(c, lw); c.beginPath(); c.moveTo(m0 - 0.6, top); c.lineTo((m0 + m1) / 2, peak); c.lineTo(m1 + 0.6, top); c.closePath(); c.stroke();
    // scallops under the roof
    c.beginPath();
    for (var s = m0 - 0.6; s < m1 + 0.6; s += 1.6) c.arc(s + 0.8, top, 0.8, 0, Math.PI);
    c.fillStyle = T.paper; c.fill(); ink(c, lw * 0.7); c.stroke();
    ink(c, lw * 1.2, T.paper); c.beginPath(); c.moveTo((m0 + m1) / 2, peak); c.lineTo((m0 + m1) / 2, peak - 1.4); c.stroke();
    c.beginPath(); c.moveTo((m0 + m1) / 2, peak - 1.4); c.lineTo((m0 + m1) / 2 + 1.4, peak - 1.0); c.lineTo((m0 + m1) / 2, peak - 0.6); c.closePath();
    c.fillStyle = T.accent; c.fill(); ink(c, lw * 0.6); c.stroke();
    if (o.lit) {
      for (var f = 0; f < 5; f++) fire(c, m0 + 1.5 + f * 2.6, top + 0.5, 4 + Math.sin(t * 5 + f) * 0.8, 1.3, t + f, lw);
    }

    // the cake: three tiers on a table, a little rocket on top
    var cx = PARTY.cake;
    rrect(c, cx - 1.8, -2.4, 3.6, 0.5, 0.1); c.fillStyle = T.paper; c.fill(); ink(c, lw * 0.8); c.stroke();
    ink(c, lw * 1.2, T.paper); c.beginPath(); c.moveTo(cx - 1.4, -1.9); c.lineTo(cx - 1.4, 0); c.moveTo(cx + 1.4, -1.9); c.lineTo(cx + 1.4, 0); c.stroke();
    if (o.cake !== false) {
      [[1.4, 0.9], [1.0, 0.8], [0.65, 0.7]].forEach(function (tier, i) {
        var y0 = -2.4 - [0, 0.9, 1.7][i];
        rrect(c, cx - tier[0], y0 - tier[1], tier[0] * 2, tier[1], 0.15);
        c.fillStyle = i === 1 ? T.accent : T.paper; c.fill(); ink(c, lw * 0.8); c.stroke();
      });
      c.beginPath(); c.moveTo(cx, -6.4); c.lineTo(cx + 0.28, -5.1); c.lineTo(cx - 0.28, -5.1); c.closePath();
      c.fillStyle = T.red; c.fill(); ink(c, lw * 0.5); c.stroke();
    } else {
      c.fillStyle = T.accent;
      c.beginPath(); c.ellipse(cx, -2.5, 1.6, 0.4, 0, 0, Math.PI * 2); c.fill(); ink(c, lw * 0.6); c.stroke();
    }

    // the terrace the guests stand on, past the pool
    var t0 = PARTY.terrace[0], t1 = PARTY.terrace[1];
    c.beginPath(); c.rect(t0, -1.4, t1 - t0, 1.4);
    c.fillStyle = T.paper; c.fill(); ink(c, lw); c.stroke();
    c.save(); c.clip(); c.fillStyle = shade(c, 0.5); c.fillRect(t0, -0.7, t1 - t0, 0.7); c.restore();
  }

  // A balloon on a string
  function balloon(c, x, y, r, colour, t) {
    var lw = thick(0.1, 1);
    ink(c, lw * 0.6, T.paper);
    c.beginPath(); c.moveTo(x, y + r); c.quadraticCurveTo(x + Math.sin(t * 3) * 0.6, y + r + 1.4, x, y + r + 2.8); c.stroke();
    oval(c, x, y, r * 0.86, r, colour, lw);
    c.beginPath(); c.moveTo(x - 0.25, y + r + 0.3); c.lineTo(x + 0.25, y + r + 0.3); c.lineTo(x, y + r - 0.1); c.closePath();
    c.fillStyle = colour; c.fill(); ink(c, lw * 0.6); c.stroke();
    ink(c, lw * 0.7, T.paper);
    c.beginPath(); c.arc(x - r * 0.25, y - r * 0.3, r * 0.4, Math.PI * 1.1, Math.PI * 1.5); c.stroke();
  }

  // ---------------------------------------------------------------------------
  // Mars (stage 5): red ground with ink rocks and halftone craters, a flat pad
  // with a cross, his flag, a sign, and a dish that plays his messages from
  // Earth, fourteen minutes late. o: { t, ground: [{x, y}], pad: [x0, x1] }
  // ---------------------------------------------------------------------------
  function mars(c, o, x0, x1, deep) {
    var lw = thick(0.14, 1.2);
    var g = o.ground;
    c.beginPath();
    c.moveTo(x0, deep);
    g.forEach(function (p) { c.lineTo(p.x, -p.y); });
    c.lineTo(x1, deep);
    c.closePath();
    c.fillStyle = T.red; c.fill();
    c.save(); c.clip();
    c.fillStyle = shade(c, 0.7);
    c.fillRect(x0, 2.5, x1 - x0, deep);
    (o.craters || []).forEach(function (k) {
      c.beginPath(); c.ellipse(k.x, -k.y + 1.2, k.r, k.r * 0.28, 0, 0, Math.PI * 2);
      c.fillStyle = shade(c, 0.45); c.fill();
    });
    c.restore();
    ink(c, lw);
    c.beginPath();
    g.forEach(function (p, i) { if (i) c.lineTo(p.x, -p.y); else c.moveTo(p.x, -p.y); });
    c.stroke();
    (o.rocks || []).forEach(function (r) {
      c.beginPath();
      c.moveTo(r.x - r.s, -r.y + 0.2);
      c.quadraticCurveTo(r.x - r.s * 0.9, -r.y - r.s * 0.9, r.x, -r.y - r.s);
      c.quadraticCurveTo(r.x + r.s * 1.1, -r.y - r.s * 0.7, r.x + r.s, -r.y + 0.2);
      c.closePath();
      c.fillStyle = T.red; c.fill(); ink(c, lw * 0.8); c.stroke();
      c.save(); c.clip(); c.fillStyle = shade(c, 0.35); c.fillRect(r.x, -r.y - r.s, r.s, r.s * 1.3); c.restore();
    });
    // the pad and its cross
    var p0 = o.pad[0], p1 = o.pad[1], pc = (p0 + p1) / 2;
    c.beginPath(); c.moveTo(p0, -0.6); c.lineTo(p1, -0.6); c.lineTo(p1 + 0.5, 0.5); c.lineTo(p0 - 0.5, 0.5); c.closePath();
    c.fillStyle = T.ink; c.fill();
    c.save(); c.clip(); c.fillStyle = dots(c, T.paper, 0.55); c.fillRect(p0 - 1, -0.6, p1 - p0 + 2, 1.2); c.restore();
    ink(c, lw, T.paper); c.stroke();
    oval(c, pc, -0.05, 3.2, 0.48, T.ink, lw, T.paper);
    ink(c, lw * 1.9, T.red);
    c.beginPath(); c.moveTo(pc - 1.8, -0.35); c.lineTo(pc + 1.8, 0.22); c.moveTo(pc + 1.8, -0.35); c.lineTo(pc - 1.8, 0.22); c.stroke();
  }

  // His flag: a red flag on a pole, with a paper sparkle on it, stiff in no air
  function flag(c, x, y) {
    var lw = thick(0.12, 1.1);
    ink(c, lw * 1.6); c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 7); c.stroke();
    ink(c, lw * 0.7, T.paper); c.stroke();
    rrect(c, x, y - 7, 4, 2.6, 0.1); c.fillStyle = T.red; c.fill(); ink(c, lw * 0.8); c.stroke();
    sparkle(c, x + 2, y - 5.7, 0.9, T.paper);
  }

  // The dish his messages come through: paper, on three legs
  function dish(c, x, y, t) {
    var lw = thick(0.12, 1.1);
    ink(c, lw * 1.4); c.beginPath(); c.moveTo(x - 1.2, y); c.lineTo(x, y - 2.4); c.lineTo(x + 1.2, y); c.moveTo(x, y); c.lineTo(x, y - 2.4); c.stroke();
    ink(c, lw * 0.6, T.paper); c.stroke();
    c.save(); c.translate(x, y - 3.2); c.rotate(-0.6);
    c.beginPath(); c.ellipse(0, 0, 2.4, 1.0, 0, Math.PI, Math.PI * 2); c.closePath();
    c.fillStyle = T.paper; c.fill(); ink(c, lw); c.stroke();
    c.save(); c.clip(); c.fillStyle = shade(c, 0.35); c.fillRect(0.6, -1.2, 2, 1.2); c.restore();
    ink(c, lw * 0.8); c.beginPath(); c.moveTo(0, -0.1); c.lineTo(0, -1.6); c.stroke();
    oval(c, 0, -1.7, 0.25, 0.25, (Math.floor(t * 2) % 2) ? T.red : T.accent);
    c.restore();
  }

  // A sign on a post
  function sign(c, x, y, w) {
    var lw = thick(0.12, 1.1);
    ink(c, lw * 1.6); c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 3.2); c.stroke();
    ink(c, lw * 0.6, T.paper); c.stroke();
    rrect(c, x - w / 2, y - 4.6, w, 1.8, 0.15);
    c.fillStyle = T.paper; c.fill(); ink(c, lw); c.stroke();
    return { x: x, y: y - 3.7 };
  }

  // A bobbing arrow pointing down with a word over it (DESIGN.md, section 10),
  // in CSS pixels
  function arrow(c, x, y, word, size) {
    var k = size || 1;
    c.save();
    c.translate(x, y);
    c.lineJoin = "round";
    c.beginPath();
    c.moveTo(-5 * k, -22 * k); c.lineTo(5 * k, -22 * k); c.lineTo(5 * k, -10 * k); c.lineTo(12 * k, -10 * k);
    c.lineTo(0, 3 * k); c.lineTo(-12 * k, -10 * k); c.lineTo(-5 * k, -10 * k);
    c.closePath();
    c.fillStyle = T.paper; c.fill();
    c.lineWidth = 2.4; c.strokeStyle = T.ink; c.stroke();
    var fs = Math.max(13, 14 * k);
    c.font = fs + "px " + T.display;
    c.textAlign = "center";
    c.textBaseline = "alphabetic";
    c.lineWidth = 4; c.strokeStyle = T.ink;
    c.strokeText(word.toUpperCase(), 0, -27 * k);
    c.fillStyle = T.paper;
    c.fillText(word.toUpperCase(), 0, -27 * k);
    c.restore();
  }

  window.ScrubbedArt = {
    init: init, setView: setView, thick: thick, dots: dots, shade: shade, ink: ink, oval: oval, rrect: rrect, sparkle: sparkle,
    head: head, billionaire: billionaire, guest: guest, rocket: rocket, flame: flame, fire: fire, burst: burst, puff: puff,
    barge: barge, windsock: windsock, boat: boat, lawn: lawn, party: party, balloon: balloon, mars: mars, flag: flag, dish: dish,
    sign: sign, arrow: arrow,
    LEG_X: LEG_X, LEG_WIDE: LEG_WIDE, DECK_UP: DECK_UP, HULL: HULL, BOAT_DECK: BOAT_DECK, BOAT_STAND: BOAT_STAND, PARTY: PARTY
  };
})();
