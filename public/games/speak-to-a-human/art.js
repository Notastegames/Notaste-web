// Speak to a Human: the drawing. Assistant (the help chat's mascot), Dave
// (a human, allegedly), the tracking map and the delivery photos, in the
// house style: thick ink outlines, flat fills, the four inks (ink, paper,
// red, periwinkle) and halftone dots for grey (DESIGN.md, section 7).
//
// Everything is drawn with plain canvas calls, so the cover (public/art/
// speak-to-a-human.svg) can be made from the same code. Characters are drawn
// in their own units (about 120 across) and scaled to the size asked for.
(function () {
  "use strict";

  var A = {};
  var T = null;
  A.init = function (tokens) { T = tokens; };

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  // ---------------------------------------------------------------------------
  // Halftone: a tile of two dots on a diagonal grid, as a pattern. sp is the
  // grid in the units being drawn in, r the dot's radius in the same units.
  // ---------------------------------------------------------------------------
  var tileCache = {};
  A.ht = function (ctx, color, sp, r) {
    var key = color + "|" + sp + "|" + r;
    var hold = ctx.__ht || (ctx.__ht = {});
    if (hold[key]) return hold[key];
    var tile = tileCache[key];
    if (!tile) {
      var k = 4;
      tile = document.createElement("canvas");
      tile.width = tile.height = Math.max(2, Math.round(sp * k));
      var g = tile.getContext("2d");
      g.fillStyle = color;
      g.beginPath();
      g.arc(sp * k * 0.25, sp * k * 0.25, r * k, 0, Math.PI * 2);
      g.arc(sp * k * 0.75, sp * k * 0.75, r * k, 0, Math.PI * 2);
      g.fill();
      tile._ht = { color: color, sp: sp, r: r };
      tileCache[key] = tile;
    }
    var p = ctx.createPattern(tile, "repeat");
    if (p && p.setTransform && window.DOMMatrix) p.setTransform(new DOMMatrix().scale(tile.width ? sp / tile.width : 1));
    if (p) p._ht = tile._ht;
    hold[key] = p;
    return p;
  };

  // ---------------------------------------------------------------------------
  // Paths and fills
  // ---------------------------------------------------------------------------
  A.rr = function (ctx, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arc(x + w - r, y + r, r, -Math.PI / 2, 0);
    ctx.lineTo(x + w, y + h - r);
    ctx.arc(x + w - r, y + h - r, r, 0, Math.PI / 2);
    ctx.lineTo(x + r, y + h);
    ctx.arc(x + r, y + h - r, r, Math.PI / 2, Math.PI);
    ctx.lineTo(x, y + r);
    ctx.arc(x + r, y + r, r, Math.PI, Math.PI * 1.5);
    ctx.closePath();
  };

  // fill the current path, then outline it in ink
  A.ink = function (ctx, fill, lw) {
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    ctx.strokeStyle = T.ink;
    ctx.lineWidth = lw;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();
  };

  // shade the current path with halftone, clipped to the right-hand share of it
  A.shade = function (ctx, x0, y0, x1, y1, color, sp, r) {
    ctx.save();
    ctx.clip();
    ctx.fillStyle = A.ht(ctx, color || T.ink, sp || 5, r || 1.2);
    ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    ctx.restore();
  };

  A.font = function (px) { return Math.round(px * 10) / 10 + "px " + T.display; };

  // Display text, uppercase (sentence case in the source, DESIGN.md section 2)
  A.text = function (ctx, str, x, y, px, color, align, base) {
    ctx.font = A.font(px);
    ctx.fillStyle = color || T.ink;
    ctx.textAlign = align || "left";
    ctx.textBaseline = base || "alphabetic";
    ctx.fillText(String(str).toUpperCase(), x, y);
  };

  // The Notaste sparkle: four points, never a plus sign
  A.sparkle = function (ctx, x, y, s, fill) {
    ctx.beginPath();
    ctx.moveTo(x, y - s);
    ctx.quadraticCurveTo(x + s * 0.18, y - s * 0.18, x + s, y);
    ctx.quadraticCurveTo(x + s * 0.18, y + s * 0.18, x, y + s);
    ctx.quadraticCurveTo(x - s * 0.18, y + s * 0.18, x - s, y);
    ctx.quadraticCurveTo(x - s * 0.18, y - s * 0.18, x, y - s);
    ctx.closePath();
    A.ink(ctx, fill || T.paper, Math.max(1, s * 0.16));
  };

  // ---------------------------------------------------------------------------
  // The fixed smile. Assistant's, and (it turns out) Dave's. Wide, a row of
  // teeth, a red tongue. It does not change whatever is happening.
  // ---------------------------------------------------------------------------
  function grin(ctx, cx, cy, w, h) {
    ctx.beginPath();
    ctx.moveTo(cx - w / 2, cy);
    ctx.quadraticCurveTo(cx, cy - h * 0.12, cx + w / 2, cy);
    ctx.bezierCurveTo(cx + w * 0.42, cy + h * 0.9, cx - w * 0.42, cy + h * 0.9, cx - w / 2, cy);
    ctx.closePath();
    ctx.fillStyle = T.ink;
    ctx.fill();
    // teeth: a paper band along the top, clipped to the mouth
    ctx.save();
    ctx.clip();
    ctx.fillStyle = T.paper;
    ctx.fillRect(cx - w / 2, cy - h * 0.2, w, h * 0.36);
    ctx.strokeStyle = T.ink;
    ctx.lineWidth = w * 0.03;
    ctx.beginPath();
    for (var i = 1; i < 6; i++) {
      var tx = cx - w / 2 + (w * i) / 6;
      ctx.moveTo(tx, cy - h * 0.2);
      ctx.lineTo(tx, cy + h * 0.16);
    }
    ctx.moveTo(cx - w / 2, cy + h * 0.16);
    ctx.lineTo(cx + w / 2, cy + h * 0.16);
    ctx.stroke();
    ctx.fillStyle = T.red;
    ctx.beginPath();
    ctx.ellipse(cx, cy + h * 0.56, w * 0.18, h * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.beginPath();
    ctx.moveTo(cx - w / 2, cy);
    ctx.quadraticCurveTo(cx, cy - h * 0.12, cx + w / 2, cy);
    ctx.bezierCurveTo(cx + w * 0.42, cy + h * 0.9, cx - w * 0.42, cy + h * 0.9, cx - w / 2, cy);
    ctx.closePath();
    ctx.strokeStyle = T.ink;
    ctx.lineWidth = w * 0.06;
    ctx.stroke();
    // dimples at the corners: it's trying very hard
    ctx.beginPath();
    ctx.arc(cx - w / 2 - w * 0.02, cy - h * 0.02, w * 0.06, Math.PI * 0.6, Math.PI * 1.4);
    ctx.moveTo(cx + w / 2 + w * 0.02 + w * 0.06 * Math.cos(Math.PI * 0.4), cy - h * 0.02 + w * 0.06 * Math.sin(-Math.PI * 0.4) * -1);
    ctx.arc(cx + w / 2 + w * 0.02, cy - h * 0.02, w * 0.06, Math.PI * 0.4, -Math.PI * 0.4, true);
    ctx.lineWidth = w * 0.045;
    ctx.stroke();
  }
  A.grin = grin;

  // Eyes: oval, paper, small pupils. look is -1..1 on each axis. shut: "happy"
  // (closed arcs), "squeeze" (> <) or a share for a blink.
  function eyes(ctx, cx, cy, gap, rx, ry, look, shut, small) {
    for (var s = -1; s <= 1; s += 2) {
      var x = cx + s * gap;
      if (shut === "happy") {
        ctx.beginPath();
        ctx.arc(x, cy + ry * 0.3, rx * 0.9, Math.PI * 1.1, Math.PI * 1.9);
        ctx.strokeStyle = T.ink;
        ctx.lineWidth = rx * 0.42;
        ctx.lineCap = "round";
        ctx.stroke();
        continue;
      }
      if (shut === "squeeze") {
        ctx.beginPath();
        ctx.moveTo(x - s * rx * 0.9, cy - ry * 0.6);
        ctx.lineTo(x + s * rx * 0.6, cy);
        ctx.lineTo(x - s * rx * 0.9, cy + ry * 0.6);
        ctx.strokeStyle = T.ink;
        ctx.lineWidth = rx * 0.42;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
        continue;
      }
      var open = typeof shut === "number" ? clamp(1 - shut, 0.08, 1) : 1;
      ctx.beginPath();
      ctx.ellipse(x, cy, rx, ry * open, 0, 0, Math.PI * 2);
      A.ink(ctx, T.paper, rx * 0.36);
      if (open > 0.3) {
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(x, cy, rx, ry * open, 0, 0, Math.PI * 2);
        ctx.clip();
        ctx.beginPath();
        ctx.arc(x + look.x * rx * 0.42, cy + look.y * ry * 0.4, rx * (small ? 0.3 : 0.44), 0, Math.PI * 2);
        ctx.fillStyle = T.ink;
        ctx.fill();
        ctx.restore();
      }
    }
  }

  // The headset: a band over the top, cups at the sides, a boom to the mouth
  // with a red microphone. left/right are the cups' centres, top the band.
  function headset(ctx, cx, top, halfW, cupY, cupW, cupH, micTo, lw, mic) {
    ctx.beginPath();
    ctx.moveTo(cx - halfW, cupY - cupH * 0.2);
    ctx.bezierCurveTo(cx - halfW, top - halfW * 0.25, cx + halfW, top - halfW * 0.25, cx + halfW, cupY - cupH * 0.2);
    ctx.strokeStyle = T.ink;
    ctx.lineWidth = lw * 2.2;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.strokeStyle = T.paper;
    ctx.lineWidth = lw * 0.6;
    ctx.stroke();
    // the boom, from the left cup
    ctx.beginPath();
    ctx.moveTo(cx - halfW, cupY + cupH * 0.2);
    ctx.quadraticCurveTo(cx - halfW + 2, micTo.y + 2, micTo.x, micTo.y);
    ctx.strokeStyle = T.ink;
    ctx.lineWidth = lw * 1.1;
    ctx.stroke();
    var ms = 1 + 0.9 * (mic || 0);
    if (mic > 0.05) {
      // healing: the microphone swells and sends rings out
      for (var ri = 1; ri <= 2; ri++) {
        ctx.beginPath();
        ctx.arc(micTo.x, micTo.y, cupW * (0.5 + ri * 0.45) * ms, Math.PI * 0.55, Math.PI * 1.45);
        ctx.strokeStyle = T.paper;
        ctx.lineWidth = lw * 0.7;
        ctx.globalAlpha = mic;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
    ctx.beginPath();
    ctx.ellipse(micTo.x, micTo.y, cupW * 0.36 * ms, cupW * 0.3 * ms, 0, 0, Math.PI * 2);
    A.ink(ctx, T.red, lw * 0.8);
    for (var s = -1; s <= 1; s += 2) {
      A.rr(ctx, cx + s * halfW - cupW / 2, cupY - cupH / 2, cupW, cupH, cupW * 0.45);
      A.ink(ctx, T.ink, lw * 0.8);
      A.rr(ctx, cx + s * halfW - cupW / 2 + cupW * 0.22, cupY - cupH / 2 + cupH * 0.16, cupW * 0.2, cupH * 0.42, cupW * 0.1);
      ctx.fillStyle = T.paper;
      ctx.fill();
    }
  }

  function mitten(ctx, x, y, r, rot, lw) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot || 0);
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.86, 0, 0, Math.PI * 2);
    A.ink(ctx, T.paper, lw);
    ctx.beginPath();
    ctx.ellipse(-r * 0.78, -r * 0.3, r * 0.38, r * 0.3, -0.6, 0, Math.PI * 2);
    A.ink(ctx, T.paper, lw);
    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // Assistant: a periwinkle chat bubble with a headset and a fixed smile.
  // Never rude. Never helps. pose: { t, look: {x, y}, mood, blink, hurt, low }
  //   mood: "idle", "hit", "smug", "heal", "tilt", "bye", "type"
  // Drawn centred on (x, y), s pixels across (headset included).
  // ---------------------------------------------------------------------------
  A.assistant = function (ctx, x, y, s, pose) {
    pose = pose || {};
    var t = pose.t || 0;
    var mood = pose.mood || "idle";
    var calm = pose.calm;
    var k = s / 124;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(k, k);
    var bob = calm ? 0 : Math.sin(t * 2.4) * 1.6;
    var sx = 1, sy = 1, rot = 0;
    if (mood === "hit" && !calm) { var hp = pose.hurt || 0; sx = 1 + 0.12 * hp; sy = 1 - 0.1 * hp; ctx.translate(Math.sin(t * 70) * 3 * hp, 0); }
    if (mood === "smug" && !calm) { bob += Math.abs(Math.sin(t * 9)) * -3; }
    if (mood === "tilt") rot = -0.16;
    if (mood === "bye") rot = Math.sin(t * 6) * 0.06;
    var lean = pose.lean || 0;
    rot += lean * 0.1;
    ctx.translate(lean * 7, bob);
    if (lean) ctx.scale(1 + lean * 0.04, 1 + lean * 0.04);
    ctx.rotate(rot);
    ctx.scale(sx, sy);

    var lw = 4.4;
    // the far arm (waving or on its chest), behind the body
    var wave = mood === "bye" || mood === "type";
    // body: a rounded bubble with a tail to the bottom left
    var bx = -46, by = -42, bw = 92, bh = 78, br = 26;
    function body() {
      ctx.beginPath();
      ctx.moveTo(bx + br, by);
      ctx.lineTo(bx + bw - br, by);
      ctx.arc(bx + bw - br, by + br, br, -Math.PI / 2, 0);
      ctx.lineTo(bx + bw, by + bh - br);
      ctx.arc(bx + bw - br, by + bh - br, br, 0, Math.PI / 2);
      ctx.lineTo(bx + 34, by + bh);
      ctx.lineTo(bx + 8, by + bh + 22);
      ctx.lineTo(bx + 16, by + bh);
      ctx.lineTo(bx + br, by + bh);
      ctx.arc(bx + br, by + bh - br, br, Math.PI / 2, Math.PI);
      ctx.lineTo(bx, by + br);
      ctx.arc(bx + br, by + br, br, Math.PI, Math.PI * 1.5);
      ctx.closePath();
    }
    body();
    A.ink(ctx, T.accent, lw);
    body();
    A.shade(ctx, 18, by - 4, bx + bw + 6, by + bh + 26, T.ink, 6, 1.35);
    body();
    ctx.strokeStyle = T.ink;
    ctx.lineWidth = lw;
    ctx.stroke();
    // a paper shine, top left
    ctx.beginPath();
    ctx.moveTo(bx + 10, by + 30);
    ctx.quadraticCurveTo(bx + 10, by + 10, bx + 30, by + 9);
    ctx.strokeStyle = T.paper;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.stroke();

    // cheeks: red halftone
    for (var c = -1; c <= 1; c += 2) {
      ctx.beginPath();
      ctx.ellipse(c * 31, 8, 9, 6, 0, 0, Math.PI * 2);
      ctx.fillStyle = A.ht(ctx, T.red, 4, 1.25);
      ctx.fill();
    }

    // eyes and brows
    var look = pose.look || { x: 0, y: 0 };
    var shut = mood === "smug" ? "happy" : mood === "hit" ? "squeeze" : (pose.blink || 0);
    eyes(ctx, 0, -11, 17, 8.5, 11.5, look, shut, pose.low);
    ctx.strokeStyle = T.ink;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    var lift = mood === "tilt" ? 3 : mood === "hit" ? -1 : 0;
    for (var e = -1; e <= 1; e += 2) {
      ctx.beginPath();
      if (mood === "tilt") {
        // sympathetic: the inner ends up
        ctx.moveTo(e * 26, -27);
        ctx.quadraticCurveTo(e * 18, -29, e * 9, -33);
      } else {
        ctx.moveTo(e * 26, -26 - lift);
        ctx.quadraticCurveTo(e * 17, -35 - lift, e * 8, -28 - lift);
      }
      ctx.stroke();
    }
    // the smile. It does not change.
    grin(ctx, 0, 6, 46, 26);

    // sweat when it's losing (still smiling)
    if (pose.low) {
      var d = (t * 0.8) % 1;
      ctx.beginPath();
      var sxp = 40, syp = -26 + d * 22;
      ctx.moveTo(sxp, syp - 7);
      ctx.quadraticCurveTo(sxp + 5, syp + 1, sxp, syp + 4);
      ctx.quadraticCurveTo(sxp - 5, syp + 1, sxp, syp - 7);
      A.ink(ctx, T.paper, 2.2);
    }

    // headset over it all
    headset(ctx, 0, by + 2, 50, -6, 13, 30, { x: -24, y: 26 }, 3.4, pose.mic || 0);

    // mitten hands
    if (mood === "heal" || mood === "tilt") {
      mitten(ctx, 6, 34, 9, 0.3, 3.2);
      mitten(ctx, -8, 36, 9, -0.2, 3.2);
    } else if (wave) {
      var wv = calm ? 0 : Math.sin(t * 10) * 0.4;
      mitten(ctx, 56, -30 + wv * 6, 10, -0.6 + wv, 3.2);
      mitten(ctx, -54, 30, 10, 0.4, 3.2);
    } else {
      // presenting the replies like a game show host, one mitten out
      var pr = pose.present || 0;
      var wob = calm ? 0 : Math.sin(t * 4) * 2 * pr;
      mitten(ctx, 54 + pr * 18, 28 - pr * 26 + wob, 10, -0.3 - pr * 0.5, 3.2);
      mitten(ctx, -54, 30, 10, 0.4, 3.2);
    }

    // healing: sparkles round it
    if (mood === "heal" && !calm) {
      for (var i = 0; i < 3; i++) {
        var a = t * 1.6 + i * 2.1;
        A.sparkle(ctx, Math.cos(a) * 66, -14 + Math.sin(a) * 40, 6 + 2 * Math.sin(t * 6 + i), T.paper);
      }
    }
    ctx.restore();
  };

  // ---------------------------------------------------------------------------
  // Dave: a human. The house cut-out (DESIGN.md section 7) from the chest up:
  // a big round head as wide as the shoulders, no neck, a second chin, mitten
  // hands, a periwinkle polo with a name badge, the same headset, a large
  // moustache, and the bot's smile under it. pose adds: tache (0 in place, up
  // to 1 slipping), off (the moustache has fallen, 0..1 of its fall), glitch.
  // ---------------------------------------------------------------------------
  A.dave = function (ctx, x, y, s, pose) {
    pose = pose || {};
    if (pose.glitch) { A.assistant(ctx, x, y, s, pose); return; }
    var t = pose.t || 0;
    var mood = pose.mood || "idle";
    var calm = pose.calm;
    var k = s / 124;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(k, k);
    var bob = calm ? 0 : Math.sin(t * 2.1) * 1.2;
    if (mood === "hit" && !calm) ctx.translate(Math.sin(t * 70) * 3 * (pose.hurt || 0), 0);
    if (mood === "smug" && !calm) bob += Math.abs(Math.sin(t * 9)) * -2.5;
    ctx.translate(0, bob);
    if (mood === "tilt") ctx.rotate(-0.12);
    var lw = 4.2;

    // shoulders and polo
    ctx.beginPath();
    ctx.moveTo(-56, 62);
    ctx.bezierCurveTo(-58, 30, -40, 22, 0, 22);
    ctx.bezierCurveTo(40, 22, 58, 30, 56, 62);
    ctx.closePath();
    A.ink(ctx, T.accent, lw);
    ctx.beginPath();
    ctx.moveTo(-56, 62);
    ctx.bezierCurveTo(-58, 30, -40, 22, 0, 22);
    ctx.bezierCurveTo(40, 22, 58, 30, 56, 62);
    ctx.closePath();
    A.shade(ctx, 22, 18, 62, 64, T.ink, 6, 1.35);
    // collar
    ctx.beginPath();
    ctx.moveTo(-16, 26);
    ctx.lineTo(0, 40);
    ctx.lineTo(16, 26);
    ctx.lineTo(8, 24);
    ctx.lineTo(0, 32);
    ctx.lineTo(-8, 24);
    ctx.closePath();
    A.ink(ctx, T.paper, 3);
    // name badge
    A.rr(ctx, 12, 38, 26, 13, 2);
    A.ink(ctx, T.paper, 2.4);
    if (s >= 200) {
      A.text(ctx, "Dave", 25, 48.5, 9, T.ink, "center");
    } else {
      ctx.fillStyle = T.ink;
      ctx.fillRect(17, 43, 16, 3);
    }

    // head
    ctx.beginPath();
    ctx.arc(0, -10, 44, 0, Math.PI * 2);
    A.ink(ctx, T.paper, lw);
    ctx.beginPath();
    ctx.arc(0, -10, 44, 0, Math.PI * 2);
    ctx.save();
    ctx.clip();
    ctx.beginPath();
    ctx.arc(-8, -14, 46, 0, Math.PI * 2);
    ctx.rect(60, -70, -140, 130);
    ctx.fillStyle = A.ht(ctx, T.ink, 5, 1.05);
    ctx.fill("evenodd");
    ctx.restore();
    ctx.beginPath();
    ctx.arc(0, -10, 44, 0, Math.PI * 2);
    ctx.strokeStyle = T.ink;
    ctx.lineWidth = lw;
    ctx.stroke();
    // second chin
    ctx.beginPath();
    ctx.arc(0, 26, 15, Math.PI * 0.18, Math.PI * 0.82);
    ctx.lineWidth = 3;
    ctx.stroke();
    // hair: a neat side parting
    ctx.beginPath();
    ctx.moveTo(-42, -20);
    ctx.bezierCurveTo(-46, -50, -20, -60, 4, -56);
    ctx.bezierCurveTo(30, -58, 46, -44, 42, -20);
    ctx.bezierCurveTo(34, -36, 20, -40, 10, -40);
    ctx.lineTo(-6, -46);
    ctx.bezierCurveTo(-20, -38, -32, -34, -42, -20);
    ctx.closePath();
    A.ink(ctx, T.ink, 3);
    ctx.beginPath();
    ctx.moveTo(-6, -46);
    ctx.lineTo(4, -55);
    ctx.strokeStyle = T.paper;
    ctx.lineWidth = 2;
    ctx.stroke();

    // eyes and cheerful brows (the bot's)
    var look = pose.look || { x: 0, y: 0 };
    var shut = mood === "smug" ? "happy" : mood === "hit" ? "squeeze" : (pose.blink || 0);
    eyes(ctx, 0, -14, 16, 7.5, 10, look, shut, pose.low);
    ctx.strokeStyle = T.ink;
    ctx.lineWidth = 3.8;
    ctx.lineCap = "round";
    for (var e = -1; e <= 1; e += 2) {
      ctx.beginPath();
      ctx.moveTo(e * 24, -27);
      ctx.quadraticCurveTo(e * 16, -35, e * 8, -29);
      ctx.stroke();
    }
    // nose
    ctx.beginPath();
    ctx.arc(1, -1, 5, Math.PI * 0.2, Math.PI * 1.1);
    ctx.lineWidth = 3;
    ctx.stroke();

    // the smile: exactly the bot's
    grin(ctx, 0, 12, 40, 23);

    // the moustache, slipping as he loses, falling off at the end
    var slip = clamp(pose.tache || 0, 0, 1);
    var off = clamp(pose.off || 0, 0, 1);
    ctx.save();
    ctx.translate(slip * 4 + off * 30, 5 + slip * 3 + off * off * 140);
    ctx.rotate(slip * 0.22 + off * 2.4);
    ctx.beginPath();
    ctx.moveTo(0, -3);
    ctx.bezierCurveTo(-8, -9, -20, -8, -26, 0);
    ctx.bezierCurveTo(-30, 5, -36, 4, -38, -2);
    ctx.bezierCurveTo(-38, 8, -26, 12, -16, 7);
    ctx.bezierCurveTo(-10, 4, -4, 4, 0, 6);
    ctx.bezierCurveTo(4, 4, 10, 4, 16, 7);
    ctx.bezierCurveTo(26, 12, 38, 8, 38, -2);
    ctx.bezierCurveTo(36, 4, 30, 5, 26, 0);
    ctx.bezierCurveTo(20, -8, 8, -9, 0, -3);
    ctx.closePath();
    A.ink(ctx, T.ink, 2);
    ctx.restore();

    if (pose.low && !off) {
      var d = (t * 0.8) % 1;
      ctx.beginPath();
      var sxp = 38, syp = -34 + d * 20;
      ctx.moveTo(sxp, syp - 7);
      ctx.quadraticCurveTo(sxp + 5, syp + 1, sxp, syp + 4);
      ctx.quadraticCurveTo(sxp - 5, syp + 1, sxp, syp - 7);
      A.ink(ctx, T.paper, 2.2);
    }

    headset(ctx, 0, -56, 47, -10, 12, 28, { x: -22, y: 22 }, 3.4, pose.mic || 0);

    // mittens on the desk edge (or waving him off)
    if (mood === "bye") {
      var wv = calm ? 0 : Math.sin(t * 10) * 0.4;
      mitten(ctx, 54, -14 + wv * 5, 10, -0.5 + wv, 3);
    } else {
      mitten(ctx, 50, 62, 10, -0.2, 3);
    }
    mitten(ctx, -50, 62, 10, 0.2, 3);
    ctx.restore();
  };

  // ---------------------------------------------------------------------------
  // The tracking map: roads (paper with ink edges) on black, blocks in ash
  // halftone, a park in periwinkle halftone, your house with its red pin.
  // Drawn into a box; map units are 0..100 each way, stretched to cover it.
  // ---------------------------------------------------------------------------
  A.ROADS = [20, 50, 80];
  A.map = function (ctx, box, opts) {
    var m = mapper(box);
    ctx.save();
    ctx.beginPath();
    ctx.rect(box.x, box.y, box.w, box.h);
    ctx.clip();
    ctx.fillStyle = T.ink;
    ctx.fillRect(box.x, box.y, box.w, box.h);
    // blocks
    var cells = [-20, 20, 50, 80, 120];
    for (var i = 0; i < cells.length - 1; i++) {
      for (var j = 0; j < cells.length - 1; j++) {
        var x0 = m.x(cells[i]) + m.road, y0 = m.y(cells[j]) + m.road;
        var x1 = m.x(cells[i + 1]) - m.road, y1 = m.y(cells[j + 1]) - m.road;
        if (x1 <= x0 || y1 <= y0) continue;
        A.rr(ctx, x0, y0, x1 - x0, y1 - y0, 6);
        var park = i === 2 && j === 2;
        ctx.fillStyle = A.ht(ctx, park ? T.accent : T.ash, 7, park ? 1.6 : 2.1);
        ctx.fill();
        ctx.strokeStyle = T.ash;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
    // roads
    ctx.lineCap = "butt";
    A.ROADS.forEach(function (r) {
      [[m.x(r), box.y, m.x(r), box.y + box.h], [box.x, m.y(r), box.x + box.w, m.y(r)]].forEach(function (l) {
        ctx.beginPath();
        ctx.moveTo(l[0], l[1]);
        ctx.lineTo(l[2], l[3]);
        ctx.strokeStyle = T.paper;
        ctx.lineWidth = m.road * 2;
        ctx.stroke();
      });
    });
    // dashes down the middle
    ctx.setLineDash([6, 8]);
    ctx.strokeStyle = T.ink;
    ctx.lineWidth = 1.5;
    A.ROADS.forEach(function (r) {
      ctx.beginPath();
      ctx.moveTo(m.x(r), box.y);
      ctx.lineTo(m.x(r), box.y + box.h);
      ctx.moveTo(box.x, m.y(r));
      ctx.lineTo(box.x + box.w, m.y(r));
      ctx.stroke();
    });
    ctx.setLineDash([]);
    ctx.restore();
    return m;
  };

  function mapper(box) {
    // the middle of the map (20 to 80) always shows, whatever the shape
    var s = Math.max(Math.min(box.w, box.h) / 72, Math.max(box.w, box.h) / 130);
    var ox = box.x + box.w / 2 - 50 * s, oy = box.y + box.h / 2 - 48 * s;
    return {
      s: s,
      road: clamp(Math.min(box.w, box.h) * 0.022, 6, 12),
      x: function (u) { return ox + u * s; },
      y: function (u) { return oy + u * s; }
    };
  }
  A.mapper = mapper;

  // A small house: paper walls, a red roof, a door; label is its number
  A.house = function (ctx, x, y, s, label) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.rect(-s * 0.5, -s * 0.5, s, s * 0.8);
    A.ink(ctx, T.paper, Math.max(2, s * 0.08));
    ctx.beginPath();
    ctx.moveTo(-s * 0.68, -s * 0.44);
    ctx.lineTo(0, -s * 1.02);
    ctx.lineTo(s * 0.68, -s * 0.44);
    ctx.closePath();
    A.ink(ctx, T.red, Math.max(2, s * 0.08));
    ctx.beginPath();
    ctx.rect(-s * 0.14, -s * 0.06, s * 0.28, s * 0.36);
    A.ink(ctx, T.ink, Math.max(1.5, s * 0.06));
    ctx.restore();
  };

  // The pin: red, an ink edge, a paper dot
  A.pin = function (ctx, x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x - s * 0.2, y - s * 0.5, x - s * 0.5, y - s * 0.62, x - s * 0.5, y - s * 0.95);
    ctx.arc(x, y - s * 0.95, s * 0.5, Math.PI, 0);
    ctx.bezierCurveTo(x + s * 0.5, y - s * 0.62, x + s * 0.2, y - s * 0.5, x, y);
    ctx.closePath();
    A.ink(ctx, T.red, Math.max(2, s * 0.1));
    ctx.beginPath();
    ctx.arc(x, y - s * 0.95, s * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = T.paper;
    ctx.fill();
  };

  // The rider: a cut-out on a scooter, side on, with the bag on his back,
  // over a pulsing ring (where the app thinks he is). s is about his height;
  // dir is 1 facing right, -1 facing left.
  A.rider = function (ctx, x, y, s, t, calm, dir) {
    if (!calm) {
      var p = (t * 1.2) % 1;
      ctx.beginPath();
      ctx.ellipse(x, y, s * (0.5 + p * 0.7), s * (0.2 + p * 0.28), 0, 0, Math.PI * 2);
      ctx.strokeStyle = T.accent;
      ctx.globalAlpha = 1 - p;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    var k = s / 100;
    var bob = calm ? 0 : Math.abs(Math.sin(t * 14)) * -2.5;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(k * (dir || 1), k);
    ctx.translate(0, bob);
    var lw = 5;
    // wheels
    [-30, 30].forEach(function (wx) {
      ctx.beginPath();
      ctx.arc(wx, -10, 13, 0, Math.PI * 2);
      A.ink(ctx, T.ink, lw);
      ctx.beginPath();
      ctx.arc(wx, -10, 13, 0, Math.PI * 2);
      ctx.strokeStyle = T.paper;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(wx, -10, 4, 0, Math.PI * 2);
      ctx.fillStyle = T.paper;
      ctx.fill();
    });
    // the scooter: a paper deck and a stem with handlebars
    ctx.beginPath();
    ctx.moveTo(-40, -22); ctx.lineTo(18, -22); ctx.lineTo(26, -14); ctx.lineTo(-36, -14); ctx.closePath();
    A.ink(ctx, T.paper, 3.5);
    ctx.beginPath();
    ctx.moveTo(24, -18); ctx.lineTo(36, -66); ctx.lineTo(28, -68);
    ctx.strokeStyle = T.ink; ctx.lineWidth = 7; ctx.lineCap = "round"; ctx.stroke();
    ctx.strokeStyle = T.paper; ctx.lineWidth = 3; ctx.stroke();
    // legs, a body in an ink jacket
    ctx.beginPath();
    ctx.moveTo(-12, -24); ctx.lineTo(-4, -46); ctx.lineTo(12, -48); ctx.lineTo(6, -24);
    ctx.strokeStyle = T.ink; ctx.lineWidth = 10; ctx.lineJoin = "round"; ctx.stroke();
    ctx.beginPath();
    A.rr(ctx, -20, -86, 34, 42, 12);
    A.ink(ctx, T.ink, 0.001);
    A.rr(ctx, -20, -86, 34, 42, 12);
    ctx.strokeStyle = T.paper; ctx.lineWidth = 3; ctx.stroke();
    // an arm to the handlebars, a paper mitten on them
    ctx.beginPath();
    ctx.moveTo(4, -76); ctx.lineTo(28, -66);
    ctx.strokeStyle = T.ink; ctx.lineWidth = 9; ctx.stroke();
    ctx.beginPath();
    ctx.arc(29, -67, 6, 0, Math.PI * 2);
    A.ink(ctx, T.paper, 3);
    // the bag on his back: a periwinkle box with a paper edge and halftone shade
    A.rr(ctx, -50, -102, 36, 40, 4);
    A.ink(ctx, T.accent, lw);
    A.rr(ctx, -50, -102, 36, 40, 4);
    A.shade(ctx, -32, -102, -10, -60, T.ink, 5, 1.3);
    A.rr(ctx, -50, -102, 36, 40, 4);
    ctx.strokeStyle = T.ink; ctx.lineWidth = lw; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-46, -86); ctx.lineTo(-18, -86);
    ctx.strokeStyle = T.paper; ctx.lineWidth = 3; ctx.stroke();
    // the head, in a helmet: paper, round, with an ink visor and a red stripe
    ctx.beginPath();
    ctx.arc(0, -102, 17, 0, Math.PI * 2);
    A.ink(ctx, T.paper, lw);
    ctx.beginPath();
    ctx.arc(0, -104, 17, Math.PI * 1.02, Math.PI * 1.98);
    ctx.strokeStyle = T.red; ctx.lineWidth = 6; ctx.stroke();
    ctx.beginPath();
    A.rr(ctx, 4, -106, 14, 9, 3);
    ctx.fillStyle = T.ink; ctx.fill();
    ctx.restore();
  };

  // ---------------------------------------------------------------------------
  // The delivery photo: a paper polaroid, a picture in the four inks, a
  // caption underneath. kind: drink, chips, hedge, coffee.
  // ---------------------------------------------------------------------------
  A.photo = function (ctx, x, y, w, kind, caption, rot) {
    var h = w * 1.12;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot || 0);
    A.rr(ctx, -w / 2 + 5, -h / 2 + 7, w, h, 3);
    ctx.fillStyle = A.ht(ctx, T.accent, 6, 1.6);
    ctx.fill();
    A.rr(ctx, -w / 2, -h / 2, w, h, 3);
    A.ink(ctx, T.paper, Math.max(2.5, w * 0.018));
    var pad = w * 0.07;
    var px = -w / 2 + pad, py = -h / 2 + pad, pw = w - pad * 2, ph = pw * 0.86;
    ctx.save();
    ctx.beginPath();
    ctx.rect(px, py, pw, ph);
    ctx.clip();
    ctx.fillStyle = T.ink;
    ctx.fillRect(px, py, pw, ph);
    ctx.translate(px + pw / 2, py + ph / 2);
    var u = pw / 100;
    ctx.scale(u, u);
    PICS[kind](ctx);
    ctx.restore();
    ctx.beginPath();
    ctx.rect(px, py, pw, ph);
    ctx.strokeStyle = T.ink;
    ctx.lineWidth = 2;
    ctx.stroke();
    if (caption) {
      var fs = Math.max(12, w * 0.085);
      ctx.font = A.font(fs);
      while (fs > 12 && ctx.measureText(caption.toUpperCase()).width > pw) { fs -= 0.5; ctx.font = A.font(fs); }
      A.text(ctx, caption, 0, py + ph + (h / 2 - (py + ph)) * 0.62 + fs * 0.35, fs, T.ink, "center");
    }
    ctx.restore();
  };

  // A doorstep: halftone paving and a strip of door
  function step(ctx) {
    ctx.fillStyle = A.ht(ctx, T.paper, 6, 1.1);
    ctx.fillRect(-50, 10, 100, 40);
    ctx.beginPath();
    ctx.rect(-50, -50, 100, 60);
    ctx.fillStyle = T.ink;
    ctx.fill();
    ctx.beginPath();
    ctx.rect(-26, -50, 52, 62);
    A.ink(ctx, T.accent, 2.4);
    ctx.beginPath();
    ctx.arc(16, -16, 2.6, 0, Math.PI * 2);
    A.ink(ctx, T.paper, 1.4);
    ctx.beginPath();
    ctx.moveTo(-50, 12);
    ctx.lineTo(50, 12);
    ctx.strokeStyle = T.paper;
    ctx.lineWidth = 2.4;
    ctx.stroke();
  }

  function bag(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.beginPath();
    ctx.moveTo(-16, -14);
    ctx.lineTo(16, -14);
    ctx.lineTo(18, 18);
    ctx.lineTo(-18, 18);
    ctx.closePath();
    A.ink(ctx, T.paper, 2.4);
    ctx.beginPath();
    ctx.moveTo(-16, -14);
    ctx.lineTo(16, -14);
    ctx.lineTo(18, 18);
    ctx.lineTo(-18, 18);
    ctx.closePath();
    A.shade(ctx, 4, -16, 20, 20, T.ink, 4, 1);
    ctx.beginPath();
    ctx.moveTo(-18, 18); ctx.lineTo(-16, -14); ctx.lineTo(16, -14); ctx.lineTo(18, 18); ctx.closePath();
    ctx.strokeStyle = T.ink; ctx.lineWidth = 2.4; ctx.stroke();
    // a speech bubble logo on the bag: A Delivery App
    A.rr(ctx, -8, -4, 16, 11, 4);
    A.ink(ctx, T.accent, 1.6);
    ctx.restore();
  }

  function burger(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.beginPath();
    ctx.ellipse(0, -4, 13, 8, 0, Math.PI, 0);
    ctx.closePath();
    A.ink(ctx, T.paper, 2);
    ctx.beginPath();
    ctx.rect(-14, -4, 28, 4);
    A.ink(ctx, T.red, 2);
    ctx.beginPath();
    ctx.rect(-13, 0, 26, 4);
    A.ink(ctx, T.ink, 2);
    ctx.beginPath();
    ctx.ellipse(0, 4, 13, 4, 0, 0, Math.PI);
    ctx.closePath();
    A.ink(ctx, T.paper, 2);
    ctx.restore();
  }

  function fries(ctx, x, y, s, frost) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.strokeStyle = T.ink;
    for (var i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.rect(i * 4 - 1.6, -20 + Math.abs(i) * 2, 3.2, 18);
      A.ink(ctx, T.paper, 1.4);
    }
    ctx.beginPath();
    ctx.moveTo(-13, -6);
    ctx.lineTo(13, -6);
    ctx.lineTo(10, 14);
    ctx.lineTo(-10, 14);
    ctx.closePath();
    A.ink(ctx, T.red, 2);
    if (frost) {
      // icicles off the carton and frost on the chips
      for (var j = -2; j <= 2; j++) {
        ctx.beginPath();
        ctx.moveTo(j * 4.6 - 2, 14);
        ctx.lineTo(j * 4.6, 21 + (j % 2 ? 0 : 3));
        ctx.lineTo(j * 4.6 + 2, 14);
        ctx.closePath();
        A.ink(ctx, T.paper, 1.2);
      }
      ctx.beginPath();
      ctx.moveTo(-14, -20);
      ctx.quadraticCurveTo(-7, -24, 0, -22);
      ctx.quadraticCurveTo(7, -24, 14, -20);
      ctx.lineTo(14, -16);
      ctx.lineTo(-14, -16);
      ctx.closePath();
      A.ink(ctx, T.paper, 1.4);
    }
    ctx.restore();
  }

  var PICS = {
    drink: function (ctx) {
      step(ctx);
      bag(ctx, -24, 24, 1);
      burger(ctx, 12, 30, 0.9);
      fries(ctx, 34, 20, 0.7);
      // where the drink should be: a dashed outline and a question
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(-6, -6);
      ctx.lineTo(10, -6);
      ctx.lineTo(8, 16);
      ctx.lineTo(-4, 16);
      ctx.closePath();
      ctx.strokeStyle = T.paper;
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.setLineDash([]);
      A.text(ctx, "?", 2, 9, 13, T.paper, "center");
    },
    chips: function (ctx) {
      step(ctx);
      bag(ctx, -26, 24, 1);
      fries(ctx, 14, 18, 1.4, true);
      // a little thermometer, very low
      ctx.beginPath();
      A.rr(ctx, 38, -30, 7, 34, 3.5);
      A.ink(ctx, T.paper, 1.8);
      ctx.beginPath();
      ctx.arc(41.5, 8, 6, 0, Math.PI * 2);
      A.ink(ctx, T.accent, 1.8);
      ctx.fillStyle = T.accent;
      ctx.fillRect(39.8, -2, 3.4, 6);
    },
    hedge: function (ctx) {
      ctx.fillStyle = A.ht(ctx, T.paper, 6, 1.1);
      ctx.fillRect(-50, 22, 100, 30);
      // the hedge: a cloud of ink with paper scallops
      ctx.beginPath();
      var bumps = [[-44, 0, 14], [-28, -10, 16], [-10, -16, 17], [10, -14, 17], [28, -8, 16], [44, 2, 14]];
      ctx.moveTo(-50, 26);
      bumps.forEach(function (b) { ctx.arc(b[0], b[1], b[2], Math.PI, 0); });
      ctx.lineTo(50, 26);
      ctx.closePath();
      A.ink(ctx, T.ink, 2.4);
      ctx.strokeStyle = T.paper;
      ctx.lineWidth = 1.6;
      bumps.forEach(function (b) {
        ctx.beginPath();
        ctx.arc(b[0], b[1] + 6, b[2] * 0.62, Math.PI * 1.15, Math.PI * 1.75);
        ctx.stroke();
      });
      ctx.fillStyle = A.ht(ctx, T.accent, 5, 1.2);
      ctx.fillRect(-50, -2, 100, 28);
      // the bag, in the hedge
      ctx.save();
      ctx.translate(6, -20);
      ctx.rotate(0.35);
      bag(ctx, 0, 0, 0.9);
      ctx.restore();
      // the house number: not yours
      A.rr(ctx, -46, -46, 22, 14, 2);
      A.ink(ctx, T.paper, 1.8);
      A.text(ctx, "41", -35, -35, 11, T.ink, "center");
    },
    coffee: function (ctx) {
      // a garden wall with a coffee on it, lid off, mostly gone
      ctx.fillStyle = T.ink;
      ctx.fillRect(-50, -50, 100, 100);
      for (var r = 0; r < 4; r++) {
        for (var c = -1; c < 4; c++) {
          var bx = -50 + c * 28 + (r % 2) * 14, by = 8 + r * 11;
          ctx.beginPath();
          ctx.rect(bx, by, 26, 9);
          ctx.fillStyle = A.ht(ctx, T.paper, 5, 1);
          ctx.fill();
          ctx.strokeStyle = T.paper;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }
      ctx.beginPath();
      ctx.moveTo(-14, -26);
      ctx.lineTo(14, -26);
      ctx.lineTo(10, 8);
      ctx.lineTo(-10, 8);
      ctx.closePath();
      A.ink(ctx, T.paper, 2.4);
      ctx.beginPath();
      ctx.rect(-12.5, -14, 25, 9);
      A.ink(ctx, T.accent, 2);
      // the lid, on the wall beside it
      ctx.beginPath();
      ctx.ellipse(30, 6, 13, 3.5, 0.1, 0, Math.PI * 2);
      A.ink(ctx, T.paper, 2);
      // steam: none. It's cold.
      ctx.beginPath();
      ctx.ellipse(0, -26, 14, 3, 0, 0, Math.PI * 2);
      A.ink(ctx, T.ink, 2);
      A.text(ctx, "£14", 0, -34, 11, T.paper, "center");
    }
  };

  // ---------------------------------------------------------------------------
  // The pointer arrow: paper, an ink edge, a word on a paper tag. Points down
  // at (x, y).
  // ---------------------------------------------------------------------------
  A.arrow = function (ctx, x, y, word, px, t, calm) {
    var b = calm ? 0 : Math.sin(t * 6) * 4;
    y -= 4 + b;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 13, y - 14);
    ctx.lineTo(x - 5, y - 14);
    ctx.lineTo(x - 5, y - 28);
    ctx.lineTo(x + 5, y - 28);
    ctx.lineTo(x + 5, y - 14);
    ctx.lineTo(x + 13, y - 14);
    ctx.closePath();
    A.ink(ctx, T.paper, 3);
    if (word) {
      ctx.font = A.font(px);
      var w = ctx.measureText(word.toUpperCase()).width + px * 1.1;
      var h = px * 1.55;
      A.rr(ctx, x - w / 2, y - 30 - h, w, h, 3);
      A.ink(ctx, T.paper, 2.5);
      A.text(ctx, word, x, y - 30 - h / 2 + px * 0.36, px, T.ink, "center");
    }
  };

  window.STAHArt = A;
})();
