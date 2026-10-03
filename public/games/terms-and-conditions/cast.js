// Terms and Conditions: the cast, drawn in code.
//
// Legal, the company's lawyer: a house cut-out cartoon (DESIGN.md, section 7).
// Round body in a pinstripe suit, a big round head with no neck, oval eyes,
// furious eyebrows, a frown and a second chin, mitten hands, a red tie, and
// the one thing that tells him apart: a barrister's wig, rolls and all.
//
// The mascots: each app is a rounded-square app icon come to life, in the
// game's peach, with a grin that never changes whatever it's saying. Beam
// holds a torch, Tilly is a kettle, Biscuit has ears and a tail, Penny has a
// bow tie and a pound coin. They're the exception to the furious faces.
//
// Outline first, flat fill, four inks, halftone dots for shade. Each figure is
// drawn in its own units (Legal's head is 64 across) from its feet, which sit
// at 0,0 with up negative; the caller says how many CSS pixels a unit is.
(function () {
  "use strict";

  var T = null;
  var DPR = 1;
  var tiles = {};

  function init(tokens, dpr) {
    T = tokens;
    DPR = dpr || 1;
  }

  // Halftone dots that stay the same size on screen whatever the scale. The
  // pattern is kept per canvas, so a frame doesn't make new ones.
  function dots(c, colour, k, size) {
    var n = Math.max(3, Math.round((size || 3.4) * DPR));
    var key = colour + n;
    var made = c.__tcDots || (c.__tcDots = {});
    var pkey = key + "|" + k.toFixed(4);
    if (made[pkey]) return made[pkey];
    if (!tiles[key]) {
      var t = document.createElement("canvas");
      t.width = t.height = n;
      var x = t.getContext("2d");
      x.fillStyle = colour;
      x.beginPath();
      x.arc(n / 2, n / 2, n * 0.27, 0, Math.PI * 2);
      x.fill();
      tiles[key] = t;
    }
    var pat = c.createPattern(tiles[key], "repeat");
    if (pat.setTransform && window.DOMMatrix) pat.setTransform(new DOMMatrix().scale(1 / k));
    if (Object.keys(made).length > 40) c.__tcDots = made = {};
    made[pkey] = pat;
    return pat;
  }

  function stroke(c, w, colour) {
    c.lineWidth = w;
    c.strokeStyle = colour || T.ink;
    c.lineJoin = "round";
    c.lineCap = "round";
    c.stroke();
  }
  function fill(c, colour) { c.fillStyle = colour; c.fill(); }
  function oval(c, x, y, rx, ry, rot) {
    c.beginPath();
    c.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2);
  }
  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  // A mitten: a round paw and a thumb, outlined
  function mitten(c, x, y, r, rot) {
    c.save();
    c.translate(x, y);
    c.rotate(rot || 0);
    oval(c, -r * 0.75, r * 0.15, r * 0.42, r * 0.36, -0.5);
    fill(c, T.paper);
    stroke(c, r * 0.32);
    oval(c, 0, 0, r, r * 0.88);
    fill(c, T.paper);
    stroke(c, r * 0.32);
    c.restore();
  }

  // A sleeve from a to b: a thick ink stroke with a paper edge, pinstriped
  function sleeve(c, ax, ay, bx, by, w) {
    c.beginPath();
    c.moveTo(ax, ay);
    c.lineTo(bx, by);
    c.lineCap = "round";
    stroke(c, w + 3, T.paper);
    stroke(c, w, T.ink);
    var dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;
    var nx = -dy / len, ny = dx / len;
    c.lineWidth = 0.9;
    c.strokeStyle = T.paper;
    c.lineCap = "butt";
    for (var i = -1; i <= 1; i += 2) {
      c.beginPath();
      c.moveTo(ax + nx * i * w * 0.22, ay + ny * i * w * 0.22);
      c.lineTo(bx + nx * i * w * 0.22, by + ny * i * w * 0.22);
      c.stroke();
    }
  }

  // ---------------------------------------------------------------------------
  // Legal
  //   o.face: "glare" | "shout" | "smug"
  //   o.look: { x, y } where the pupils point, -1 to 1
  //   o.fist: raise a fist (shouting), o.pen: holding the confiscated red pen
  //   o.reach: { x, y, t } reach an arm out to a point (in his units) with a pen
  //   o.anim: seconds, for the wobbles
  // ---------------------------------------------------------------------------
  function legal(c, x, y, s, o) {
    o = o || {};
    var k = s * DPR, anim = o.anim || 0;
    var look = o.look || { x: 0.6, y: 0.2 };
    c.save();
    c.translate(x, y);
    c.scale(s, s);

    // the suit: shoulders and a round body, pinstripes, a paper edge on the ink
    var body = new Path2D();
    body.moveTo(-50, 60);
    body.lineTo(-53, 4);
    body.bezierCurveTo(-56, -40, -34, -66, 0, -66);
    body.bezierCurveTo(34, -66, 56, -40, 53, 4);
    body.lineTo(50, 60);
    body.closePath();
    c.fillStyle = T.ink;
    c.fill(body);
    c.save();
    c.clip(body);
    c.strokeStyle = T.paper;
    c.lineWidth = 0.9;
    for (var px = -42; px <= 42; px += 8) {
      c.beginPath();
      c.moveTo(px, -70);
      c.lineTo(px + 2, 64);
      c.stroke();
    }
    c.restore();
    c.lineWidth = 2.6;
    c.strokeStyle = T.paper;
    c.lineJoin = "round";
    c.stroke(body);
    // arms resting at the sides
    [-1, 1].forEach(function (side) {
      c.beginPath();
      c.moveTo(side * 36, -52);
      c.quadraticCurveTo(side * 30, -14, side * 38, 30);
      stroke(c, 2.2, T.paper);
    });

    // shirt, lapels and the red tie
    c.beginPath();
    c.moveTo(-15, -64);
    c.lineTo(15, -64);
    c.lineTo(0, -30);
    c.closePath();
    fill(c, T.paper);
    stroke(c, 2);
    c.beginPath();
    c.moveTo(-4.5, -58);
    c.lineTo(4.5, -58);
    c.lineTo(6.5, -40);
    c.lineTo(0, -31);
    c.lineTo(-6.5, -40);
    c.closePath();
    fill(c, T.red);
    stroke(c, 1.8);
    c.beginPath();
    c.moveTo(-5, -64);
    c.lineTo(5, -64);
    c.lineTo(3.6, -57);
    c.lineTo(-3.6, -57);
    c.closePath();
    fill(c, T.red);
    stroke(c, 1.8);
    c.beginPath();
    c.moveTo(-15, -64);
    c.lineTo(-24, -22);
    c.moveTo(15, -64);
    c.lineTo(24, -22);
    stroke(c, 2, T.paper);

    // a raised fist, or the arm reaching across with a pen
    if (o.reach) {
      var r = o.reach, ex = r.x, ey = r.y;
      sleeve(c, 30, -40, ex - 6, ey + 8, 15);
      // the pen: ink, with a paper edge, tip at the point
      c.save();
      c.translate(ex, ey);
      c.rotate(-0.5 + Math.sin(anim * 30) * (r.scribble ? 0.12 : 0));
      roundRect(c, -2, -26, 5, 24, 2);
      fill(c, T.ink);
      stroke(c, 1.2, T.paper);
      c.beginPath();
      c.moveTo(-2, -2);
      c.lineTo(3, -2);
      c.lineTo(0.5, 3);
      c.closePath();
      fill(c, T.ink);
      stroke(c, 1, T.paper);
      c.restore();
      mitten(c, ex - 4, ey - 9, 9, 0.4);
    }

    // the head: round, white, sitting straight on the shoulders
    var hx = 0, hy = -96;
    oval(c, hx, hy, 32, 31);
    fill(c, T.paper);
    c.save();
    oval(c, hx, hy, 32, 31);
    c.clip();
    oval(c, hx + 14, hy + 8, 30, 33);
    c.fillStyle = dots(c, T.ink, k, 3.2);
    c.fill();
    oval(c, hx - 3, hy - 4, 29, 29);
    fill(c, T.paper);
    c.restore();
    oval(c, hx, hy, 32, 31);
    stroke(c, 3);

    // the face, turned towards whoever it's cross with
    var gx = look.x * 2.6, gy = look.y * 2.4;
    [-1, 1].forEach(function (side) {
      oval(c, hx + side * 11 + gx * 0.6, hy, 6.6, 8);
      fill(c, T.paper);
      stroke(c, 2.2);
      oval(c, hx + side * 11 + gx * 1.6, hy + 1 + gy, 2.7, 3);
      fill(c, T.ink);
      // eyebrows: down in the middle, always
      c.beginPath();
      c.moveTo(hx + side * 20 + gx * 0.5, hy - 15);
      c.lineTo(hx + side * 5 + gx * 0.5, hy - 9);
      stroke(c, 4.6);
    });
    var mx = hx + gx * 0.8;
    if (o.face === "shout") {
      var open = 5.5 + Math.abs(Math.sin(anim * 22)) * 2.4;
      oval(c, mx, hy + 17, 7.5, open);
      fill(c, T.ink);
      c.save();
      oval(c, mx, hy + 17, 7.5, open);
      c.clip();
      oval(c, mx, hy + 17 + open * 0.7, 5, 3);
      fill(c, T.red);
      c.restore();
    } else if (o.face === "smug") {
      c.beginPath();
      c.moveTo(mx - 9, hy + 16);
      c.quadraticCurveTo(mx + 1, hy + 20, mx + 10, hy + 12);
      stroke(c, 2.8);
    } else {
      c.beginPath();
      c.moveTo(mx - 9, hy + 19);
      c.quadraticCurveTo(mx, hy + 12, mx + 9, hy + 19);
      stroke(c, 2.8);
    }
    // the second chin
    c.beginPath();
    c.moveTo(hx - 13, hy + 26);
    c.quadraticCurveTo(hx, hy + 31, hx + 13, hy + 26);
    stroke(c, 2);

    // the wig: a cap of curls and three rolls down each side
    var cap = new Path2D();
    cap.moveTo(-35, -96);
    cap.bezierCurveTo(-38, -122, -20, -136, 0, -136);
    cap.bezierCurveTo(20, -136, 38, -122, 35, -96);
    // a curly fringe along the forehead
    cap.quadraticCurveTo(30, -106, 23, -106);
    cap.quadraticCurveTo(17, -114, 9, -110);
    cap.quadraticCurveTo(0, -116, -9, -110);
    cap.quadraticCurveTo(-17, -114, -23, -106);
    cap.quadraticCurveTo(-30, -106, -35, -96);
    cap.closePath();
    c.fillStyle = T.paper;
    c.fill(cap);
    c.save();
    c.clip(cap);
    c.fillStyle = dots(c, T.ink, k, 4.2);
    c.fillRect(-40, -140, 80, 50);
    c.restore();
    c.lineWidth = 2.6;
    c.strokeStyle = T.ink;
    c.stroke(cap);
    // rows of curls on the cap
    c.lineWidth = 1.6;
    [[-124, 22], [-117, 28]].forEach(function (row) {
      for (var cx = -row[1]; cx <= row[1] - 7; cx += 9) {
        c.beginPath();
        c.arc(cx + 4.5, row[0], 4.2, Math.PI * 0.1, Math.PI * 0.95);
        c.stroke();
      }
    });
    [-1, 1].forEach(function (side) {
      [-98, -86, -74].forEach(function (ry, i) {
        var rx = side * (37 + i * 0.6);
        oval(c, rx, ry, 9.5, 6.4);
        fill(c, T.paper);
        stroke(c, 2.3);
        c.beginPath();
        c.arc(rx - side * 1.5, ry, 3.2, side > 0 ? Math.PI * 0.6 : -Math.PI * 0.4, side > 0 ? Math.PI * 1.9 : Math.PI * 0.9);
        stroke(c, 1.5);
      });
    });

    if (o.fist || o.pen) {
      var shake = o.fist ? Math.sin(anim * 34) * 2.4 : 0;
      var fx = 46, fy = -106 + shake;
      sleeve(c, 32, -42, fx - 2, fy + 12, 15);
      if (o.pen) {
        // the confiscated pen, held up for everyone to see
        c.save();
        c.translate(fx, fy - 4);
        c.rotate(0.35);
        roundRect(c, -3, -34, 6, 30, 2.5);
        fill(c, T.red);
        stroke(c, 1.8);
        c.beginPath();
        c.moveTo(-3, -34);
        c.lineTo(3, -34);
        c.lineTo(0, -41);
        c.closePath();
        fill(c, T.ink);
        c.restore();
      }
      mitten(c, fx, fy, 10, -0.3);
    }
    c.restore();
  }

  // ---------------------------------------------------------------------------
  // The mascots. kind: "torch" | "kettle" | "dog" | "bank"
  //   o.anim: seconds; o.wave: 0 to 1, how hard it's waving; o.hop: 0 to 1
  //   o.look: { x, y } where the eyes point
  // ---------------------------------------------------------------------------
  function mascot(c, x, y, s, kind, o) {
    o = o || {};
    var k = s * DPR, anim = o.anim || 0, calm = !!o.calm;
    var look = o.look || { x: -0.5, y: 0.1 };
    var hop = o.hop || 0;
    var bob = calm ? 0 : Math.sin(anim * 3.2) * 1.4;
    c.save();
    c.translate(x, y);
    c.scale(s, s);

    // legs and shoes
    [-1, 1].forEach(function (side) {
      roundRect(c, side * 10 - 4, -26, 8, 20 - hop * 4, 3);
      fill(c, T.paper);
      stroke(c, 2.4);
      oval(c, side * 11.5, -5, 9, 5);
      fill(c, T.ink);
      stroke(c, 1.6, T.paper);
    });

    c.translate(0, bob - hop * 10);

    // things behind the body: Tilly's spout and handle, Biscuit's tail
    if (kind === "kettle") {
      c.beginPath();
      c.moveTo(-30, -62);
      c.lineTo(-52, -84);
      c.lineTo(-46, -88);
      c.lineTo(-28, -76);
      c.closePath();
      fill(c, T.accent);
      stroke(c, 3);
      c.beginPath();
      c.moveTo(30, -86);
      c.bezierCurveTo(56, -86, 56, -40, 30, -40);
      stroke(c, 10, T.ink);
      stroke(c, 4.4, T.accent);
    } else if (kind === "dog") {
      var wag = calm ? 0 : Math.sin(anim * 14) * 0.5;
      c.save();
      c.translate(30, -40);
      c.rotate(-0.6 + wag);
      c.beginPath();
      c.moveTo(0, 0);
      c.quadraticCurveTo(14, -6, 18, -22);
      stroke(c, 8, T.paper);
      stroke(c, 4.6, T.ink);
      c.restore();
    }

    // the body: an app icon, rounded square, peach
    var bx = -34, by = -98, bw = 68, bh = 74;
    roundRect(c, bx, by, bw, bh, 19);
    fill(c, T.accent);
    c.save();
    roundRect(c, bx, by, bw, bh, 19);
    c.clip();
    c.beginPath();
    c.rect(bx + bw - 14, by, 20, bh);
    c.rect(bx, by + bh - 9, bw, 12);
    c.fillStyle = dots(c, T.ink, k, 3.4);
    c.fill();
    c.restore();
    roundRect(c, bx, by, bw, bh, 19);
    stroke(c, 3.6);
    // an icon's shine
    c.beginPath();
    c.moveTo(bx + 9, by + 26);
    c.quadraticCurveTo(bx + 9, by + 9, bx + 26, by + 9);
    stroke(c, 3, T.paper);

    // the kettle's lid, the dog's ears
    if (kind === "kettle") {
      roundRect(c, -16, -104, 32, 8, 3);
      fill(c, T.accent);
      stroke(c, 2.8);
      oval(c, 0, -108, 5, 4);
      fill(c, T.ink);
    } else if (kind === "dog") {
      // floppy ears, hanging down outside the face
      [-1, 1].forEach(function (side) {
        var flap = calm ? 0 : Math.sin(anim * 3.2 + side) * 0.07;
        c.save();
        c.translate(side * 28, -95);
        c.rotate(side * flap);
        c.beginPath();
        c.moveTo(-side * 8, 0);
        c.quadraticCurveTo(side * 14, -4, side * 16, 22);
        c.quadraticCurveTo(side * 17, 40, side * 6, 40);
        c.quadraticCurveTo(-side * 2, 38, side * 2, 14);
        c.quadraticCurveTo(side * 1, 4, -side * 8, 0);
        c.closePath();
        fill(c, T.ink);
        stroke(c, 1.8, T.paper);
        c.restore();
      });
    }

    // eyes: big, glossy, fixed on you
    var gx = look.x * 2.2, gy = look.y * 2.2;
    [-1, 1].forEach(function (side) {
      oval(c, side * 12, -76, 7.6, 9.6);
      fill(c, T.paper);
      stroke(c, 2.4);
      oval(c, side * 12 + gx, -75 + gy, 4.4, 4.8);
      fill(c, T.ink);
      oval(c, side * 12 + gx - 1.6, -77 + gy, 1.5, 1.5);
      fill(c, T.paper);
    });
    // cheeks
    [-1, 1].forEach(function (side) {
      oval(c, side * 25, -60, 4.2, 2.6);
      fill(c, T.red);
    });
    // the grin. It never changes.
    var grin = new Path2D();
    grin.moveTo(-21, -61);
    grin.lineTo(21, -61);
    grin.quadraticCurveTo(21, -40, 0, -39);
    grin.quadraticCurveTo(-21, -40, -21, -61);
    grin.closePath();
    c.fillStyle = T.ink;
    c.fill(grin);
    c.save();
    c.clip(grin);
    c.fillStyle = T.paper;
    c.fillRect(-22, -62, 44, 8);
    c.strokeStyle = T.ink;
    c.lineWidth = 1.4;
    for (var tx = -14; tx <= 14; tx += 7) {
      c.beginPath();
      c.moveTo(tx, -62);
      c.lineTo(tx, -54);
      c.stroke();
    }
    oval(c, 0, kind === "dog" ? -41 : -40.5, 9, 4);
    fill(c, T.red);
    c.restore();
    c.lineWidth = 2.6;
    c.strokeStyle = T.ink;
    c.stroke(grin);
    if (kind === "dog") {
      // the tongue, out
      roundRect(c, -5, -44, 10, 13, 5);
      fill(c, T.red);
      stroke(c, 2);
      c.beginPath();
      c.moveTo(0, -42);
      c.lineTo(0, -35);
      stroke(c, 1.2);
    }
    if (kind === "dog") {
      // a collar with a tag
      c.beginPath();
      c.rect(bx + 2, -33, bw - 4, 5);
      fill(c, T.red);
      stroke(c, 1.8);
      oval(c, 0, -26, 4, 4);
      fill(c, T.paper);
      stroke(c, 1.6);
    }
    if (kind === "bank") {
      // a bow tie
      c.beginPath();
      c.moveTo(0, -31);
      c.lineTo(-11, -37);
      c.lineTo(-11, -25);
      c.closePath();
      c.moveTo(0, -31);
      c.lineTo(11, -37);
      c.lineTo(11, -25);
      c.closePath();
      fill(c, T.red);
      stroke(c, 1.8);
      oval(c, 0, -31, 3, 3);
      fill(c, T.red);
      stroke(c, 1.6);
    }

    // arms: one waving at you, one holding the app's thing
    var wave = o.wave == null ? 0.3 : o.wave;
    var swing = calm ? 0.4 : Math.sin(anim * 9) * 0.5 * wave + 0.5;
    var ang = -0.9 - swing * 0.9;
    var hx = 34 + Math.cos(ang) * 22, hy = -58 + Math.sin(ang) * 22;
    c.beginPath();
    c.moveTo(32, -58);
    c.quadraticCurveTo(40, -58, hx, hy);
    stroke(c, 6.6);
    stroke(c, 3, T.paper);
    var holdX = -48, holdY = -46;
    c.beginPath();
    c.moveTo(-32, -56);
    c.quadraticCurveTo(-42, -54, holdX, holdY);
    stroke(c, 6.6);
    stroke(c, 3, T.paper);

    if (kind === "torch") {
      // a torch, and its beam, which is mostly halftone
      c.save();
      c.translate(holdX, holdY);
      c.rotate(-0.9);
      c.beginPath();
      c.moveTo(-2, -16);
      c.lineTo(-30, -58);
      c.lineTo(24, -58);
      c.lineTo(8, -16);
      c.closePath();
      c.fillStyle = dots(c, T.paper, k, 3.2);
      c.fill();
      roundRect(c, -5, -12, 10, 22, 2);
      fill(c, T.paper);
      stroke(c, 2.2);
      c.beginPath();
      c.moveTo(-6, -12);
      c.lineTo(-8, -20);
      c.lineTo(14, -20);
      c.lineTo(9, -12);
      c.closePath();
      fill(c, T.paper);
      stroke(c, 2.2);
      oval(c, 0, -2, 2.2, 2.2);
      fill(c, T.red);
      c.restore();
    } else if (kind === "bank") {
      // a pound coin
      oval(c, holdX - 2, holdY - 10, 10, 10);
      fill(c, T.paper);
      stroke(c, 2.4);
      c.fillStyle = T.ink;
      c.font = "13px " + T.display;
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText("£", holdX - 2, holdY - 9.4);
    } else if (kind === "kettle" && !calm) {
      // steam, as puffs: white circles with a peach shadow
      for (var i = 0; i < 3; i++) {
        var t = (anim * 0.6 + i / 3) % 1;
        var sx = -50 - t * 10 + Math.sin(t * 6 + i) * 3, sy = -92 - t * 30, sr = 3 + t * 4;
        c.globalAlpha = 1 - t;
        oval(c, sx + 1.4, sy + 1.4, sr, sr);
        fill(c, T.accent);
        oval(c, sx, sy, sr, sr);
        fill(c, T.paper);
        c.globalAlpha = 1;
      }
    }
    mitten(c, holdX, holdY, 6.6, 0.4);
    mitten(c, hx, hy, 6.6, ang + 1.6);
    c.restore();
  }

  // The app icon in the app's own header: the mascot's face, small
  function icon(c, x, y, size) {
    var u = size / 40;
    c.save();
    c.translate(x, y);
    c.scale(u, u);
    roundRect(c, -20, -20, 40, 40, 10);
    fill(c, T.accent);
    stroke(c, 3);
    [-1, 1].forEach(function (side) {
      oval(c, side * 7.5, -5, 4.4, 5.4);
      fill(c, T.paper);
      stroke(c, 1.8);
      oval(c, side * 7.5 - 0.8, -4.6, 2.5, 2.7);
      fill(c, T.ink);
    });
    c.beginPath();
    c.moveTo(-11, 4);
    c.lineTo(11, 4);
    c.quadraticCurveTo(11, 14, 0, 14.5);
    c.quadraticCurveTo(-11, 14, -11, 4);
    c.closePath();
    fill(c, T.ink);
    c.fillStyle = T.paper;
    c.fillRect(-9.5, 4.6, 19, 3.4);
    c.restore();
  }

  window.TermsCast = { init: init, legal: legal, mascot: mascot, icon: icon, dots: dots, roundRect: roundRect };
})();
