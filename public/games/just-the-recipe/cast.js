// Just the Recipe: the cast, drawn in code.
//
// The hand (you), the site's chef mascot, the newsletter cat, the author's
// family in their photos, and the things the adverts are selling. All of it
// is the house cut-out style (DESIGN.md, section 7): ink outline first, flat
// fill, the four inks, halftone for shade. The people are round heads with no
// neck, oval eyes, furious eyebrows, a frown and a second chin, and one thing
// each that tells them apart: Nan's perm, Uncle Keith's flat cap and
// moustache, the chef's hat, the kids' backwards caps, the author's bun.
//
// Every function draws in page units (whatever the caller's transform is),
// with x, y at the middle of the head unless it says otherwise.
(function () {
  "use strict";

  var T = null;
  var MIN = 0.4;          // the thinnest a line may be, in units (about 1.2px)
  var PX = 1;             // device pixels per unit, for the halftone
  var pats = {};

  function init(tokens, unitPx) {
    T = tokens;
    if (unitPx !== PX) pats = {};
    PX = unitPx;
    MIN = 1.15 / Math.max(1, unitPx / Math.max(1, window.devicePixelRatio || 1));
  }

  // Halftone dots in one colour, sized in device pixels so they stay crisp.
  // The pattern is anchored to whatever the drawing is anchored to, so the
  // dots on the page scroll with the page.
  function dots(c, colour, big) {
    var key = colour + (big ? "b" : "s");
    var e = pats[key];
    if (!e) {
      var tile = document.createElement("canvas");
      var n = big ? 7 : 4;
      tile.width = tile.height = n * 2;
      var t = tile.getContext("2d");
      t.fillStyle = colour;
      [[n / 2, n / 2], [n * 1.5, n * 1.5]].forEach(function (p) {
        t.beginPath();
        t.arc(p[0], p[1], n * (big ? 0.27 : 0.24), 0, Math.PI * 2);
        t.fill();
      });
      e = pats[key] = { tile: tile, pat: null, sc: 0, c: null };
    }
    var sc = c.getTransform ? Math.hypot(c.getTransform().a, c.getTransform().b) : 1;
    if (!e.pat || e.sc !== sc || e.c !== c) {
      e.pat = c.createPattern(e.tile, "repeat");
      // undo the drawing scale, so the dots are the same size at any zoom
      if (e.pat.setTransform && window.DOMMatrix) e.pat.setTransform(new DOMMatrix([1 / sc, 0, 0, 1 / sc, 0, 0]));
      e.sc = sc;
      e.c = c;
    }
    return e.pat;
  }

  function lw(w) { return Math.max(MIN, w); }

  function ink(c, w, colour) {
    c.lineWidth = lw(w);
    c.strokeStyle = colour || T.ink;
    c.lineJoin = "round";
    c.lineCap = "round";
  }

  function blob(c, x, y, rx, ry, fill, w, rot) {
    c.beginPath();
    c.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2);
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (w) { ink(c, w); c.stroke(); }
  }

  function seg(c, pts, w, colour) {
    c.beginPath();
    pts.forEach(function (p, i) { if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); });
    ink(c, w, colour);
    c.stroke();
  }

  function rrect(c, x, y, w, h, r) {
    c.beginPath();
    if (c.roundRect) c.roundRect(x, y, w, h, r);
    else c.rect(x, y, w, h);
  }

  // Halftone in the crescent away from the light (top left), clipped to an oval
  function shadeOval(c, x, y, rx, ry, colour) {
    c.save();
    c.beginPath();
    c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    c.clip();
    c.beginPath();
    c.ellipse(x, y, rx * 1.05, ry * 1.05, 0, 0, Math.PI * 2);
    c.ellipse(x - rx * 0.22, y - ry * 0.24, rx * 1.02, ry * 1.02, 0, 0, Math.PI * 2);
    c.fillStyle = dots(c, colour || T.ink);
    c.fill("evenodd");
    c.restore();
  }

  // ---------------------------------------------------------------------------
  // A head. o: { look: [x, y] from -1 to 1, mood: "glare" | "shout",
  //              hat: "perm" | "toque" | "flatcap" | "cap" | "bun" | "bald",
  //              tache, capColour }
  // ---------------------------------------------------------------------------
  function head(c, x, y, r, o) {
    o = o || {};
    var w = r * 0.13;
    var lx = o.look ? o.look[0] : 0, ly = o.look ? o.look[1] : 0;
    if (o.hat === "bun") blob(c, x, y - r * 1.02, r * 0.38, r * 0.34, T.ink, w);
    if (o.hat === "perm") curls(c, x, y, r, w, true);
    // ears, then the head over them
    blob(c, x - r * 0.96, y + r * 0.06, r * 0.2, r * 0.28, T.paper, w);
    blob(c, x + r * 0.96, y + r * 0.06, r * 0.2, r * 0.28, T.paper, w);
    blob(c, x, y, r, r * 0.96, T.paper);
    shadeOval(c, x, y, r, r * 0.96);
    blob(c, x, y, r, r * 0.96, null, w);
    if (o.hat === "bun") {
      // hair: an ink cap over the top
      c.beginPath();
      c.ellipse(x, y - r * 0.05, r * 1.0, r * 0.98, 0, Math.PI * 1.08, Math.PI * 1.92);
      c.quadraticCurveTo(x + r * 0.2, y - r * 0.52, x - r * 0.93, y - r * 0.38);
      c.fillStyle = T.ink;
      c.fill();
    }
    // the second chin
    c.beginPath();
    c.ellipse(x, y + r * 0.42, r * 0.42, r * 0.36, 0, Math.PI * 0.18, Math.PI * 0.82);
    ink(c, w * 0.8);
    c.stroke();
    // eyes, looking where they're told
    [-1, 1].forEach(function (s) {
      var ex = x + s * r * 0.33, ey = y - r * 0.04;
      blob(c, ex, ey, r * 0.2, r * 0.25, T.paper, w * 0.75);
      blob(c, ex + lx * r * 0.08 - s * r * 0.03, ey + ly * r * 0.09 + r * 0.03, r * 0.085, r * 0.105, T.ink);
      // eyebrows: down at the middle, furious at all times
      seg(c, [[x + s * r * 0.1, y - r * 0.24], [x + s * r * 0.32, y - r * 0.36], [x + s * r * 0.56, y - r * 0.46]], w * 1.35);
    });
    if (o.tache) {
      c.beginPath();
      c.moveTo(x - r * 0.4, y + r * 0.36);
      c.quadraticCurveTo(x, y + r * 0.12, x + r * 0.4, y + r * 0.36);
      c.quadraticCurveTo(x, y + r * 0.28, x - r * 0.4, y + r * 0.36);
      c.fillStyle = T.ink;
      c.fill();
      ink(c, w * 0.8);
      c.stroke();
    }
    if (o.mood === "shout") {
      blob(c, x, y + r * 0.47, r * 0.2, r * 0.16, T.ink);
      blob(c, x, y + r * 0.54, r * 0.1, r * 0.06, T.red);
    } else {
      // a frown
      c.beginPath();
      c.moveTo(x - r * 0.22, y + r * 0.52);
      c.quadraticCurveTo(x, y + r * 0.36, x + r * 0.22, y + r * 0.52);
      ink(c, w * 0.9);
      c.stroke();
    }
    // hats and hair
    if (o.hat === "perm") curls(c, x, y, r, w, false);
    else if (o.hat === "toque") toque(c, x, y, r, w);
    else if (o.hat === "flatcap") {
      c.beginPath();
      c.ellipse(x, y - r * 0.6, r * 1.06, r * 0.48, 0, Math.PI, Math.PI * 2);
      c.quadraticCurveTo(x + r * 1.25, y - r * 0.45, x + r * 0.2, y - r * 0.42);
      c.closePath();
      c.fillStyle = T.accent;
      c.fill();
      c.fillStyle = dots(c, T.ink);
      c.fill();
      ink(c, w);
      c.stroke();
    } else if (o.hat === "cap") {
      var col = o.capColour || T.red;
      c.beginPath();
      c.ellipse(x, y - r * 0.5, r * 0.98, r * 0.62, 0, Math.PI, Math.PI * 2);
      c.closePath();
      c.fillStyle = col;
      c.fill();
      ink(c, w);
      c.stroke();
      // worn backwards: the strap's gap at the front
      rrect(c, x - r * 0.22, y - r * 0.62, r * 0.44, r * 0.14, r * 0.06);
      c.fillStyle = T.paper;
      c.fill();
      ink(c, w * 0.7);
      c.stroke();
      blob(c, x, y - r * 1.1, r * 0.1, r * 0.08, col, w * 0.7);
    } else if (o.hat === "bald") {
      [-0.25, 0, 0.25].forEach(function (k) {
        seg(c, [[x + k * r - r * 0.12, y - r * 0.9], [x + k * r, y - r * 1.25], [x + k * r + r * 0.14, y - r * 1.12]], w * 0.7);
      });
    }
  }

  // A perm: a ring of curls, set weekly, never touched by rain
  function curls(c, x, y, r, w, behind) {
    var list = behind ? [-0.15, 0.15, 0.5, 0.85, 1.15] : [0.62, 0.38, 0.12, -0.12, -0.38, -0.62, -0.86, 0.86];
    list.forEach(function (k) {
      var a = -Math.PI / 2 + k * (behind ? 2.6 : 1.55);
      var cx = x + Math.cos(a) * r * (behind ? 0.98 : 0.86);
      var cy = y + Math.sin(a) * r * (behind ? 0.98 : 0.86) - (behind ? 0 : r * 0.04);
      var cr = r * (behind ? 0.34 : 0.3);
      blob(c, cx, cy, cr, cr, T.paper);
      shadeOval(c, cx, cy, cr, cr);
      blob(c, cx, cy, cr, cr, null, w * 0.85);
    });
  }

  function toque(c, x, y, r, w) {
    // the band, then the puff on top of it
    var top = y - r * 0.72;
    c.beginPath();
    c.moveTo(x - r * 0.78, top + r * 0.18);
    c.lineTo(x - r * 0.72, top - r * 0.32);
    c.lineTo(x + r * 0.72, top - r * 0.32);
    c.lineTo(x + r * 0.78, top + r * 0.18);
    c.closePath();
    c.fillStyle = T.paper;
    c.fill();
    ink(c, w);
    c.stroke();
    [[-0.5, -0.72, 0.5], [0.5, -0.72, 0.5], [0, -1.05, 0.58]].forEach(function (p) {
      blob(c, x + p[0] * r, top + p[1] * r, p[2] * r, p[2] * r * 0.9, T.paper);
    });
    shadeOval(c, x + 0.5 * r, top - 0.72 * r, 0.5 * r, 0.45 * r);
    [[-0.5, -0.72, 0.5], [0.5, -0.72, 0.5], [0, -1.05, 0.58]].forEach(function (p) {
      c.beginPath();
      c.ellipse(x + p[0] * r, top + p[1] * r, p[2] * r, p[2] * r * 0.9, 0, Math.PI * 0.9, Math.PI * 2.1);
      ink(c, w);
      c.stroke();
    });
    seg(c, [[x - r * 0.72, top - r * 0.3], [x + r * 0.72, top - r * 0.3]], w);
  }

  // Round shoulders under a head, in a colour, with halftone
  function shoulders(c, x, y, r, fill) {
    c.beginPath();
    c.ellipse(x, y + r * 1.75, r * 1.45, r * 1.05, 0, Math.PI, Math.PI * 2);
    c.closePath();
    c.fillStyle = fill;
    c.fill();
    if (fill !== T.ink) {
      c.fillStyle = dots(c, T.ink);
      c.globalAlpha = 0.6;
      c.fill();
      c.globalAlpha = 1;
    }
    ink(c, r * 0.13, fill === T.ink ? T.paper : T.ink);
    c.stroke();
  }

  function mitten(c, x, y, r) {
    blob(c, x, y, r, r * 0.95, T.paper, r * 0.3);
    seg(c, [[x - r * 0.55, y - r * 0.15], [x - r * 0.15, y - r * 0.45]], r * 0.22);
  }

  // ---------------------------------------------------------------------------
  // The hand: you. A pointing hand, pointing down the page, with the cuff in
  // the game's colour. x, y is the tip of the finger; s is the size (the hand
  // is 22.6s from fingertip to cuff). o: { press 0..1, squash 0..1, tilt }
  // ---------------------------------------------------------------------------
  function hand(c, x, y, s, o) {
    o = o || {};
    var press = o.press || 0, squash = o.squash || 0;
    c.save();
    c.translate(x, y);
    c.rotate(o.tilt || 0);
    c.scale(s * (1 + squash * 0.08), s * (1 - squash * 0.06));
    c.translate(0, press * 1.4);
    var w = 1.0;
    c.lineJoin = "round";
    c.lineCap = "round";
    function paper(path) {
      c.fillStyle = T.paper;
      c.fill(path);
      ink(c, w);
      c.stroke(path);
    }
    // the finger, pointing down, coming out from under the fist
    var fl = 11 - squash * 1.6;
    var finger = new Path2D();
    finger.moveTo(-1.95, -fl - 2);
    finger.lineTo(-1.95, -1.9);
    finger.arc(0, -1.9, 1.95, Math.PI, 0, true);
    finger.lineTo(1.95, -fl - 2);
    finger.closePath();
    paper(finger);
    // a fingernail and a knuckle crease
    c.beginPath();
    c.arc(0, -2.2, 1.05, Math.PI * 0.15, Math.PI * 0.85);
    ink(c, 0.4);
    c.stroke();
    seg(c, [[-1.1, -6.4], [1.1, -6.4]], 0.4);
    // the fist: the back of the hand, the rest of it curled up
    var fist = new Path2D();
    if (fist.roundRect) fist.roundRect(-5.2, -18.4, 12.6, 11.4, 3.6);
    else fist.rect(-5.2, -18.4, 12.6, 11.4);
    c.fillStyle = T.paper;
    c.fill(fist);
    c.save();
    c.clip(fist);
    var sh = new Path2D();
    sh.ellipse(9.4, -9.5, 5.2, 9, 0, 0, Math.PI * 2);
    c.fillStyle = dots(c, T.ink);
    c.fill(sh);
    c.restore();
    ink(c, w);
    c.stroke(fist);
    // three curled fingers, knuckles to us, along the bottom
    [[3.0, -7.4], [5.15, -7.7], [6.95, -8.8]].forEach(function (k, i) {
      var b = new Path2D();
      b.ellipse(k[0], k[1], 1.3, 1.75, i * 0.25, 0, Math.PI * 2);
      paper(b);
    });
    seg(c, [[4.1, -9.4], [4.1, -11.4]], 0.4);
    seg(c, [[6.1, -9.9], [6.2, -11.6]], 0.4);
    // the thumb, folded across the front
    var thumb = new Path2D();
    thumb.ellipse(-2.3, -11.6, 3.4, 1.55, 0.75, 0, Math.PI * 2);
    paper(thumb);
    // the cuff, in the game's colour
    var cuff = new Path2D();
    if (cuff.roundRect) cuff.roundRect(-5.8, -22.6, 13.8, 4.8, 1);
    else cuff.rect(-5.8, -22.6, 13.8, 4.8);
    c.fillStyle = T.accent;
    c.fill(cuff);
    ink(c, w);
    c.stroke(cuff);
    blob(c, 4.8, -20.2, 0.7, 0.7, T.paper, 0.35);
    c.restore();
  }

  // ---------------------------------------------------------------------------
  // The chef: the site's mascot. A toque, a curly moustache and an opinion.
  // ---------------------------------------------------------------------------
  function chef(c, x, y, r, o) {
    o = o || {};
    shoulders(c, x, y, r, T.paper);
    // a neckerchief in the game's colour
    c.beginPath();
    c.moveTo(x - r * 0.5, y + r * 0.85);
    c.lineTo(x + r * 0.5, y + r * 0.85);
    c.lineTo(x, y + r * 1.45);
    c.closePath();
    c.fillStyle = T.accent;
    c.fill();
    ink(c, r * 0.12);
    c.stroke();
    head(c, x, y, r, { hat: "toque", look: o.look, mood: o.mood });
    // the moustache, curled at both ends
    [-1, 1].forEach(function (s) {
      c.beginPath();
      c.moveTo(x, y + r * 0.3);
      c.quadraticCurveTo(x + s * r * 0.35, y + r * 0.18, x + s * r * 0.55, y + r * 0.34);
      c.quadraticCurveTo(x + s * r * 0.7, y + r * 0.42, x + s * r * 0.62, y + r * 0.22);
      ink(c, r * 0.16);
      c.stroke();
    });
  }

  // ---------------------------------------------------------------------------
  // The newsletter cat. Pushy. Holding on to the top of its own pop-up.
  // ---------------------------------------------------------------------------
  function cat(c, x, y, r, o) {
    o = o || {};
    var w = r * 0.13;
    var lx = o.look ? o.look[0] : 0, ly = o.look ? o.look[1] : 0;
    // ears
    [-1, 1].forEach(function (s) {
      c.beginPath();
      c.moveTo(x + s * r * 0.2, y - r * 0.7);
      c.lineTo(x + s * r * 0.82, y - r * 1.35);
      c.lineTo(x + s * r * 0.98, y - r * 0.32);
      c.closePath();
      c.fillStyle = T.paper;
      c.fill();
      ink(c, w);
      c.stroke();
      c.beginPath();
      c.moveTo(x + s * r * 0.42, y - r * 0.72);
      c.lineTo(x + s * r * 0.78, y - r * 1.1);
      c.lineTo(x + s * r * 0.86, y - r * 0.55);
      c.closePath();
      c.fillStyle = T.accent;
      c.fill();
    });
    blob(c, x, y, r * 1.12, r * 0.92, T.paper);
    shadeOval(c, x, y, r * 1.12, r * 0.92);
    blob(c, x, y, r * 1.12, r * 0.92, null, w);
    // eyes and brows
    [-1, 1].forEach(function (s) {
      var ex = x + s * r * 0.4, ey = y - r * 0.08;
      blob(c, ex, ey, r * 0.2, r * 0.24, T.paper, w * 0.75);
      blob(c, ex + lx * r * 0.08, ey + ly * r * 0.08 + r * 0.03, r * 0.07, r * 0.13, T.ink);
      seg(c, [[x + s * r * 0.14, y - r * 0.28], [x + s * r * 0.4, y - r * 0.4], [x + s * r * 0.66, y - r * 0.48]], w * 1.3);
      // whiskers
      seg(c, [[x + s * r * 0.55, y + r * 0.22], [x + s * r * 1.45, y + r * 0.08]], w * 0.55);
      seg(c, [[x + s * r * 0.55, y + r * 0.34], [x + s * r * 1.45, y + r * 0.42]], w * 0.55);
    });
    // nose and mouth
    c.beginPath();
    c.moveTo(x - r * 0.1, y + r * 0.16);
    c.lineTo(x + r * 0.1, y + r * 0.16);
    c.lineTo(x, y + r * 0.28);
    c.closePath();
    c.fillStyle = T.ink;
    c.fill();
    if (o.mood === "shout") {
      blob(c, x, y + r * 0.5, r * 0.18, r * 0.15, T.ink);
      blob(c, x, y + r * 0.56, r * 0.09, r * 0.05, T.red);
    } else {
      seg(c, [[x - r * 0.24, y + r * 0.5], [x - r * 0.1, y + r * 0.38], [x, y + r * 0.3], [x + r * 0.1, y + r * 0.38], [x + r * 0.24, y + r * 0.5]], w * 0.85);
    }
    // the collar, with an envelope for a tag
    c.beginPath();
    c.ellipse(x, y + r * 0.78, r * 0.62, r * 0.18, 0, 0, Math.PI);
    ink(c, r * 0.22, T.ink);
    c.stroke();
    ink(c, r * 0.12, T.accent);
    c.stroke();
    rrect(c, x - r * 0.24, y + r * 0.88, r * 0.48, r * 0.34, r * 0.04);
    c.fillStyle = T.paper;
    c.fill();
    ink(c, w * 0.7);
    c.stroke();
    seg(c, [[x - r * 0.24, y + r * 0.88], [x, y + r * 1.06], [x + r * 0.24, y + r * 0.88]], w * 0.6);
    // paws, gripping whatever it's on
    if (o.paws) {
      mitten(c, x - r * 0.95, y + r * 0.95, r * 0.32);
      mitten(c, x + r * 0.95, y + r * 0.95, r * 0.32);
    }
  }

  // The dog, Biscuit. Floppy ears, a big snout, the family eyebrows.
  function dog(c, x, y, r) {
    var w = r * 0.13;
    blob(c, x, y - r * 0.1, r * 0.95, r * 0.85, T.paper);
    shadeOval(c, x, y - r * 0.1, r * 0.95, r * 0.85);
    blob(c, x, y - r * 0.1, r * 0.95, r * 0.85, null, w);
    [-1, 1].forEach(function (s) {
      // ears, hanging, in ink
      c.beginPath();
      c.moveTo(x + s * r * 0.55, y - r * 0.82);
      c.quadraticCurveTo(x + s * r * 1.45, y - r * 0.75, x + s * r * 1.25, y + r * 0.45);
      c.quadraticCurveTo(x + s * r * 1.05, y + r * 0.75, x + s * r * 0.82, y + r * 0.3);
      c.quadraticCurveTo(x + s * r * 0.75, y - r * 0.3, x + s * r * 0.55, y - r * 0.82);
      c.fillStyle = T.ink;
      c.fill();
      ink(c, w * 0.8, T.paper);
      c.stroke();
      var ex = x + s * r * 0.34, ey = y - r * 0.3;
      blob(c, ex, ey, r * 0.17, r * 0.21, T.paper, w * 0.7);
      blob(c, ex - s * r * 0.03, ey + r * 0.03, r * 0.08, r * 0.1, T.ink);
      seg(c, [[x + s * r * 0.1, y - r * 0.5], [x + s * r * 0.5, y - r * 0.66]], w * 1.3);
    });
    // the snout, and a frown under it
    blob(c, x, y + r * 0.32, r * 0.55, r * 0.42, T.paper, w);
    blob(c, x, y + r * 0.12, r * 0.22, r * 0.15, T.ink);
    seg(c, [[x, y + r * 0.26], [x, y + r * 0.42]], w * 0.8);
    c.beginPath();
    c.moveTo(x - r * 0.28, y + r * 0.58);
    c.quadraticCurveTo(x, y + r * 0.4, x + r * 0.28, y + r * 0.58);
    ink(c, w * 0.85);
    c.stroke();
    // a collar in the game's colour
    c.beginPath();
    c.ellipse(x, y + r * 0.72, r * 0.6, r * 0.2, 0, 0.1, Math.PI - 0.1);
    ink(c, r * 0.2, T.ink);
    c.stroke();
    ink(c, r * 0.1, T.accent);
    c.stroke();
  }

  // ---------------------------------------------------------------------------
  // Things: the dish at the top of each page, and what the adverts sell
  // ---------------------------------------------------------------------------
  function steam(c, x, y, h, w) {
    [-1, 0, 1].forEach(function (k) {
      c.beginPath();
      c.moveTo(x + k * h * 0.35, y);
      c.bezierCurveTo(x + k * h * 0.35 + h * 0.18, y - h * 0.3, x + k * h * 0.35 - h * 0.18, y - h * 0.6, x + k * h * 0.35, y - h);
      ink(c, w * 2.2, T.ink);
      c.stroke();
      ink(c, w, T.paper);
      c.stroke();
    });
  }

  // A bowl, a dish or a cake, about 2r across
  function dish(c, kind, x, y, r) {
    var w = r * 0.07;
    if (kind === "soup") {
      blob(c, x, y + r * 0.62, r * 0.7, r * 0.12, T.paper, w);
      c.beginPath();
      c.moveTo(x - r, y);
      c.quadraticCurveTo(x - r * 0.95, y + r * 0.62, x, y + r * 0.62);
      c.quadraticCurveTo(x + r * 0.95, y + r * 0.62, x + r, y);
      c.closePath();
      c.fillStyle = T.paper;
      c.fill();
      shadeClip(c, x + r * 0.2, y, r, r);
      ink(c, w);
      c.stroke();
      blob(c, x, y, r, r * 0.22, T.red, w);
      blob(c, x - r * 0.3, y - r * 0.02, r * 0.16, r * 0.05, T.paper);
      steam(c, x, y - r * 0.3, r * 0.8, w);
    } else if (kind === "lasagne") {
      // a slice on a plate: layers of pasta and sauce, cheese on top
      blob(c, x, y + r * 0.5, r * 1.1, r * 0.2, T.paper, w);
      var lx0 = x - r * 0.8, lx1 = x + r * 0.8, top = y - r * 0.5, bot = y + r * 0.45;
      var layers = 5, lh = (bot - top) / layers;
      for (var i = 0; i < layers; i++) {
        c.beginPath();
        c.moveTo(lx0, top + i * lh);
        for (var k = 0; k <= 8; k++) c.lineTo(lx0 + (lx1 - lx0) * k / 8, top + i * lh + (k % 2 ? r * 0.04 : -r * 0.03));
        c.lineTo(lx1, top + (i + 1) * lh);
        c.lineTo(lx0, top + (i + 1) * lh);
        c.closePath();
        c.fillStyle = i % 2 ? T.red : T.paper;
        c.fill();
        if (!(i % 2)) shadeClip(c, x + r * 0.5, y, r * 0.6, r);
        ink(c, w * 0.8);
        c.stroke();
      }
      // the cheese, melting down the side
      c.beginPath();
      c.moveTo(lx0 - r * 0.05, top + r * 0.02);
      c.lineTo(lx1 + r * 0.05, top + r * 0.02);
      c.lineTo(lx1 + r * 0.05, top + r * 0.18);
      c.quadraticCurveTo(lx1 - r * 0.1, top + r * 0.2, lx1 - r * 0.15, top + r * 0.36);
      c.quadraticCurveTo(lx1 - r * 0.25, top + r * 0.2, x, top + r * 0.18);
      c.quadraticCurveTo(lx0 + r * 0.3, top + r * 0.2, lx0 + r * 0.22, top + r * 0.42);
      c.quadraticCurveTo(lx0 + r * 0.1, top + r * 0.2, lx0 - r * 0.05, top + r * 0.18);
      c.closePath();
      c.fillStyle = T.accent;
      c.fill();
      ink(c, w);
      c.stroke();
      ink(c, w * 1.2);
      c.strokeRect(lx0, top, lx1 - lx0, bot - top);
      steam(c, x, y - r * 0.6, r * 0.6, w);
    } else if (kind === "sponge") {
      blob(c, x, y + r * 0.5, r * 1.05, r * 0.16, T.paper, w);
      rrect(c, x - r * 0.85, y - r * 0.35, r * 1.7, r * 0.82, r * 0.1);
      c.fillStyle = T.paper;
      c.fill();
      shadeClip(c, x + r * 0.3, y, r, r);
      ink(c, w);
      c.stroke();
      rrect(c, x - r * 0.85, y - r * 0.02, r * 1.7, r * 0.14, r * 0.04);
      c.fillStyle = T.red;
      c.fill();
      ink(c, w * 0.8);
      c.stroke();
      c.beginPath();
      c.ellipse(x, y - r * 0.35, r * 0.85, r * 0.16, 0, 0, Math.PI * 2);
      c.fillStyle = T.paper;
      c.fill();
      ink(c, w);
      c.stroke();
      [-0.5, -0.15, 0.2, 0.55].forEach(function (k) {
        seg(c, [[x + k * r, y - r * 0.4], [x + k * r + r * 0.08, y - r * 0.3]], w * 0.8);
      });
      blob(c, x, y - r * 0.52, r * 0.13, r * 0.13, T.red, w);
    } else if (kind === "oven") {
      rrect(c, x - r * 0.8, y - r * 0.8, r * 1.6, r * 1.6, r * 0.1);
      c.fillStyle = T.paper;
      c.fill();
      shadeClip(c, x + r * 0.3, y, r, r);
      ink(c, w * 1.4);
      c.stroke();
      rrect(c, x - r * 0.6, y - r * 0.3, r * 1.2, r * 0.9, r * 0.08);
      c.fillStyle = T.ink;
      c.fill();
      ink(c, w);
      c.stroke();
      blob(c, x, y + r * 0.2, r * 0.36, r * 0.12, T.red);
      [-0.45, -0.15, 0.15, 0.45].forEach(function (k) { blob(c, x + k * r, y - r * 0.58, r * 0.09, r * 0.09, T.paper, w); });
    } else if (kind === "cake") {
      dish(c, "sponge", x, y + r * 0.1, r * 0.95);
    }
  }

  // Halftone over the current shape's shaded side. The shape stays the
  // current path, so the caller can still outline it.
  function shadeClip(c, x, y, rx, ry) {
    c.save();
    c.clip();
    var p = new Path2D();
    p.ellipse(x + rx * 0.5, y + ry * 0.3, rx, ry, 0, 0, Math.PI * 2);
    c.fillStyle = dots(c, T.ink);
    c.fill(p);
    c.restore();
  }

  // What the adverts sell, about 2r tall
  function product(c, kind, x, y, r) {
    var w = r * 0.08;
    if (kind === "onion") {
      c.beginPath();
      c.moveTo(x, y - r);
      c.bezierCurveTo(x + r * 0.2, y - r * 0.6, x + r * 0.95, y - r * 0.3, x + r * 0.8, y + r * 0.35);
      c.bezierCurveTo(x + r * 0.6, y + r * 0.85, x - r * 0.6, y + r * 0.85, x - r * 0.8, y + r * 0.35);
      c.bezierCurveTo(x - r * 0.95, y - r * 0.3, x - r * 0.2, y - r * 0.6, x, y - r);
      c.closePath();
      c.fillStyle = T.paper;
      c.fill();
      shadeClip(c, x + r * 0.3, y + r * 0.1, r * 0.8, r * 0.8);
      ink(c, w);
      c.stroke();
      seg(c, [[x - r * 0.25, y - r * 0.5], [x - r * 0.45, y + r * 0.3]], w * 0.7);
      seg(c, [[x + r * 0.25, y - r * 0.5], [x + r * 0.45, y + r * 0.3]], w * 0.7);
      // crying, as advertised
      [-1, 1].forEach(function (s) {
        blob(c, x + s * r * 0.25, y + r * 0.05, r * 0.1, r * 0.12, T.ink);
        seg(c, [[x + s * r * 0.06, y - r * 0.18], [x + s * r * 0.38, y - r * 0.1]], w);
        blob(c, x + s * r * 0.34, y + r * 0.42, r * 0.08, r * 0.13, T.accent, w * 0.6);
      });
      seg(c, [[x - r * 0.15, y + r * 0.4], [x, y + r * 0.32], [x + r * 0.15, y + r * 0.4]], w * 0.8);
    } else if (kind === "pan") {
      rrect(c, x + r * 0.6, y - r * 0.18, r * 0.95, r * 0.24, r * 0.1);
      c.fillStyle = T.ink;
      c.fill();
      ink(c, w, T.paper);
      c.stroke();
      c.beginPath();
      c.moveTo(x - r * 0.95, y - r * 0.35);
      c.lineTo(x + r * 0.7, y - r * 0.35);
      c.lineTo(x + r * 0.6, y + r * 0.5);
      c.quadraticCurveTo(x - r * 0.1, y + r * 0.62, x - r * 0.85, y + r * 0.5);
      c.closePath();
      c.fillStyle = T.paper;
      c.fill();
      shadeClip(c, x + r * 0.2, y + r * 0.2, r * 0.8, r * 0.6);
      ink(c, w);
      c.stroke();
      blob(c, x - r * 0.12, y - r * 0.35, r * 0.82, r * 0.12, T.ink, w);
    } else if (kind === "fridge") {
      rrect(c, x - r * 0.55, y - r, r * 1.1, r * 2, r * 0.12);
      c.fillStyle = T.paper;
      c.fill();
      shadeClip(c, x + r * 0.2, y, r * 0.6, r);
      ink(c, w);
      c.stroke();
      seg(c, [[x - r * 0.55, y - r * 0.25], [x + r * 0.55, y - r * 0.25]], w);
      seg(c, [[x + r * 0.38, y - r * 0.75], [x + r * 0.38, y - r * 0.45]], w * 1.4);
      seg(c, [[x + r * 0.38, y - r * 0.05], [x + r * 0.38, y + r * 0.45]], w * 1.4);
      blob(c, x - r * 0.15, y + r * 0.3, r * 0.2, r * 0.2, T.red, w);
    } else if (kind === "kettle") {
      c.beginPath();
      c.moveTo(x - r * 0.65, y + r * 0.7);
      c.lineTo(x - r * 0.5, y - r * 0.35);
      c.quadraticCurveTo(x, y - r * 0.6, x + r * 0.5, y - r * 0.35);
      c.lineTo(x + r * 0.65, y + r * 0.7);
      c.closePath();
      c.fillStyle = T.paper;
      c.fill();
      shadeClip(c, x + r * 0.2, y + r * 0.2, r * 0.7, r * 0.8);
      ink(c, w);
      c.stroke();
      c.beginPath();
      c.moveTo(x - r * 0.55, y);
      c.lineTo(x - r * 1.0, y - r * 0.45);
      ink(c, w * 2.2);
      c.stroke();
      c.beginPath();
      c.arc(x + r * 0.62, y + r * 0.1, r * 0.35, -Math.PI * 0.5, Math.PI * 0.5);
      ink(c, w * 1.6);
      c.stroke();
      blob(c, x, y - r * 0.55, r * 0.14, r * 0.1, T.accent, w);
      steam(c, x - r * 1.05, y - r * 0.55, r * 0.45, w * 0.7);
    } else {
      // a spoon
      c.save();
      c.translate(x, y);
      c.rotate(-0.6);
      rrect(c, -r * 0.1, -r * 0.2, r * 0.2, r * 1.3, r * 0.1);
      c.fillStyle = T.paper;
      c.fill();
      ink(c, w);
      c.stroke();
      blob(c, 0, -r * 0.55, r * 0.34, r * 0.46, T.paper, w);
      shadeOval(c, 0, -r * 0.55, r * 0.34, r * 0.46);
      c.restore();
      // sparkles: it's a very good spoon
      [[0.7, -0.7], [-0.7, -0.2], [0.6, 0.5]].forEach(function (p) {
        seg(c, [[x + p[0] * r - r * 0.12, y + p[1] * r], [x + p[0] * r + r * 0.12, y + p[1] * r]], w, T.paper);
        seg(c, [[x + p[0] * r, y + p[1] * r - r * 0.12], [x + p[0] * r, y + p[1] * r + r * 0.12]], w, T.paper);
      });
    }
  }

  // ---------------------------------------------------------------------------
  // A family photo: who's in it, inside a box x, y, w, h (the picture part of
  // the frame). Returns where their head is, for speech bubbles.
  // ---------------------------------------------------------------------------
  function photo(c, who, x, y, w, h, look) {
    c.save();
    c.beginPath();
    c.rect(x, y, w, h);
    c.clip();
    // a backdrop: the kitchen, in the game's colour
    c.fillStyle = T.accent;
    c.fillRect(x, y, w, h);
    c.fillStyle = dots(c, T.ink, true);
    c.fillRect(x, y + h * 0.55, w, h * 0.45);
    var cx = x + w / 2, r = Math.min(w, h) * 0.24, cy = y + h * 0.5;
    var at = { x: cx, y: cy - r };
    var lk = look || [0, 0];
    if (who === "nan") {
      shoulders(c, cx, cy, r, T.red);
      head(c, cx, cy, r, { hat: "perm", look: lk });
      // a wooden spoon, held like a sceptre
      seg(c, [[cx + r * 1.3, cy + r * 2], [cx + r * 1.55, cy - r * 0.3]], r * 0.34);
      seg(c, [[cx + r * 1.3, cy + r * 2], [cx + r * 1.55, cy - r * 0.3]], r * 0.16, T.paper);
      blob(c, cx + r * 1.58, cy - r * 0.55, r * 0.22, r * 0.34, T.paper, r * 0.12);
      mitten(c, cx + r * 1.36, cy + r * 1.1, r * 0.3);
      at.y = cy - r * 1.3;
    } else if (who === "keith") {
      shoulders(c, cx, cy, r, T.ink);
      head(c, cx, cy, r, { hat: "flatcap", tache: true, look: lk });
      // arms folded: not a soup man
      rrect(c, cx - r * 1.1, cy + r * 1.35, r * 2.2, r * 0.5, r * 0.25);
      c.fillStyle = T.ink;
      c.fill();
      ink(c, r * 0.12, T.paper);
      c.stroke();
      mitten(c, cx - r * 0.75, cy + r * 1.55, r * 0.28);
      mitten(c, cx + r * 0.75, cy + r * 1.55, r * 0.28);
    } else if (who === "dog") {
      dog(c, cx, cy + r * 0.2, r * 1.15);
    } else if (who === "me") {
      shoulders(c, cx, cy, r, T.paper);
      head(c, cx, cy, r, { hat: "bun", look: lk });
      dish(c, "soup", cx + r * 1.2, cy + r * 1.35, r * 0.6);
      mitten(c, cx + r * 0.6, cy + r * 1.6, r * 0.28);
      at.y = cy - r * 1.3;
    } else if (who === "kids") {
      [-1, 1].forEach(function (s) {
        var kx = cx + s * r * 0.95, ky = cy + r * 0.35, kr = r * 0.72;
        shoulders(c, kx, ky, kr, s < 0 ? T.paper : T.ink);
        head(c, kx, ky, kr, { hat: "cap", capColour: s < 0 ? T.red : T.paper, look: [-s * 0.6, 0] });
      });
    } else if (who === "grandad") {
      shoulders(c, cx, cy, r, T.red);
      head(c, cx, cy, r, { hat: "bald", look: lk });
    } else if (who === "oven") {
      dish(c, "oven", cx, cy + r * 0.2, r * 1.5);
      at = null;
    } else if (who === "cake") {
      dish(c, "cake", cx, cy + r * 0.35, r * 1.5);
      at = null;
    }
    c.restore();
    return at;
  }

  window.RecipeCast = {
    init: init,
    dots: dots,
    ink: ink,
    blob: blob,
    seg: seg,
    rrect: rrect,
    head: head,
    hand: hand,
    chef: chef,
    cat: cat,
    dog: dog,
    dish: dish,
    product: product,
    photo: photo,
    shadeOval: shadeOval
  };
})();
