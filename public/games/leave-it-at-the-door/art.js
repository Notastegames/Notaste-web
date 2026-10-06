// Leave It at the Door: the drawing. The town (baked once a stage), the
// rider and the bike, parked cars, pins, the people at the doors, the
// doorstep scenes and the small things (bubbles, the pointer arrow).
//
// Thick ink outlines, flat fills, the four inks only (ink, paper, red and
// the game's cyan), halftone for shade, never a grey fill (DESIGN.md,
// section 7). The town is drawn in world units; the phone and the doorstep
// in CSS pixels. Whatever the transform, text() works out the real size.
(function () {
  "use strict";

  var T = null;
  var tiles = {};
  var TW = window.LeaveTown;

  function init(tokens) { T = tokens; }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  function scaleOf(c) { var m = c.getTransform(); return Math.hypot(m.a, m.b) || 1; }

  // Halftone dots of one ink, `step` (in the current units) apart, kept at
  // whole device pixels so they don't shimmer
  function dots(c, colour, step, size) {
    var s = scaleOf(c);
    var n = Math.max(3, Math.round(step * s));
    var r = size == null ? 0.27 : size;
    var key = colour + "|" + n + "|" + r;
    var tile = tiles[key];
    if (!tile) {
      tile = document.createElement("canvas");
      tile.width = tile.height = n * 2;
      var x = tile.getContext("2d");
      x.fillStyle = colour;
      [[n / 2, n / 2], [n * 1.5, n * 1.5]].forEach(function (p) {
        x.beginPath();
        x.arc(p[0], p[1], Math.max(0.6, n * r), 0, Math.PI * 2);
        x.fill();
      });
      tile.__dot = { colour: colour, n: n, r: Math.max(0.6, n * r) };   // for tools that redraw the art as vectors
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
    if (p.roundRect) p.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2));
    else p.rect(x, y, w, h);
    return p;
  }
  function box(x, y, w, h) { var p = new Path2D(); p.rect(x, y, w, h); return p; }
  function ell(x, y, rx, ry, rot) {
    var p = new Path2D();
    p.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot || 0, 0, Math.PI * 2);
    return p;
  }
  function poly(pts) {
    var p = new Path2D();
    pts.forEach(function (q, i) { if (i) p.lineTo(q[0], q[1]); else p.moveTo(q[0], q[1]); });
    p.closePath();
    return p;
  }
  function solid(c, path, fill, w, edge) {
    c.fillStyle = fill;
    c.fill(path);
    if (w !== 0) {
      ink(c, w == null ? 0.3 : w, edge || T.ink);
      c.stroke(path);
    }
  }
  function shade(c, path, area, step, colour, size) {
    c.save();
    c.clip(path);
    c.fillStyle = dots(c, colour || T.ink, step || 0.8, size);
    c.fill(area || path);
    c.restore();
  }
  function line(c, pts, w, colour) {
    c.beginPath();
    pts.forEach(function (p, i) { if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); });
    ink(c, w, colour);
    c.stroke();
  }
  // Display text, `size` in the current units, never drawn under `min` CSS
  // pixels (pass the device pixel ratio in opts.dpr). opts: align, base,
  // colour, stroke, strokeColour, font, upper, min, dpr, max (width)
  function text(c, str, x, y, size, opts) {
    opts = opts || {};
    var m = c.getTransform();
    var k = Math.hypot(m.a, m.b);
    var px = m.a * x + m.c * y + m.e, py = m.b * x + m.d * y + m.f;
    var dpr = opts.dpr || 1;
    var fpx = Math.max(size * k, (opts.min || 0) * dpr);
    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    var wt = opts.weight ? opts.weight + " " : "";
    c.font = wt + fpx.toFixed(2) + "px " + (opts.font || T.display);
    c.textAlign = opts.align || "center";
    c.textBaseline = opts.base || "middle";
    var s = opts.upper === false ? str : String(str).toUpperCase();
    if (opts.max) {
      var w = c.measureText(s).width;
      if (w > opts.max * k) { fpx *= opts.max * k / w; c.font = wt + fpx.toFixed(2) + "px " + (opts.font || T.display); }
    }
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
  function measure(c, str, size, font, upper) {
    var k = scaleOf(c);
    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.font = (size * k).toFixed(2) + "px " + (font || T.display);
    var w = c.measureText(upper === false ? str : String(str).toUpperCase()).width / k;
    c.restore();
    return w;
  }
  // Break a line of words to fit a width, at a size. Returns the lines.
  function wrap(c, str, size, width, font, upper) {
    var words = String(str).split(" "), lines = [], cur = "";
    words.forEach(function (w) {
      var tryLine = cur ? cur + " " + w : w;
      if (cur && measure(c, tryLine, size, font, upper) > width) { lines.push(cur); cur = w; }
      else cur = tryLine;
    });
    if (cur) lines.push(cur);
    return lines;
  }

  // ---------------------------------------------------------------------------
  // Faces (DESIGN.md, section 7): oval eyes with small pupils, furious
  // eyebrows, a frown and a second chin.
  // o: { look (-1..1), up, shut, shout (0..1), brows (0 weary, 1 furious), smile }
  // ---------------------------------------------------------------------------
  function face(c, hx, hy, r, o) {
    o = o || {};
    var lw = r * 0.12;
    var lx = (o.look || 0) * r * 0.12, ly = (o.up || 0) * -r * 0.08;
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
      }
      var tilt = (o.brows == null ? 1 : o.brows) * r * 0.12;
      line(c, [[hx + s * r * 0.13 + lx, ey - r * 0.34 + tilt], [hx + s * r * 0.58 + lx, ey - r * 0.4 - tilt * 0.4]], lw * 1.3);
    });
    var my = hy + r * 0.45;
    if (o.shout) {
      solid(c, ell(hx + lx, my + r * 0.02, r * 0.26, r * 0.2 * o.shout + 0.01), T.ink, 0);
      if (o.shout > 0.5) solid(c, ell(hx + lx, my + r * 0.1, r * 0.13, r * 0.06), T.red, 0);
    } else if (o.smile) {
      c.beginPath();
      c.arc(hx + lx, my - r * 0.12, r * 0.2, Math.PI * 0.2, Math.PI * 0.8);
      ink(c, lw);
      c.stroke();
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

  function mitten(c, x, y, r, fill, flip, w) {
    var f = flip ? -1 : 1;
    solid(c, ell(x, y, r, r * 0.88), fill || T.paper, w == null ? r * 0.26 : w);
    solid(c, ell(x - f * r * 0.74, y - r * 0.42, r * 0.36, r * 0.5, -0.5 * f), fill || T.paper, w == null ? r * 0.2 : w * 0.8);
  }

  // A speech bubble: paper, an ink outline, display capitals, a tail to the
  // speaker at (tx, ty). Units: whatever the transform is. Returns its box.
  function bubble(c, x, y, lines, size, tx, ty, o) {
    o = o || {};
    var pad = size * 0.55, lh = size * 1.08;
    var w = 0;
    lines.forEach(function (l) { w = Math.max(w, measure(c, l, size)); });
    w += pad * 2;
    var h = lines.length * lh + pad * 1.3;
    var bx = x - w / 2, by = y - h / 2;
    var p = rr(bx, by, w, h, size * 0.5);
    var lw = o.lw || size * 0.16;
    if (tx != null) {
      var mx = Math.max(bx + size, Math.min(bx + w - size, tx));
      var down = ty > y;
      var ey = down ? by + h - lw : by + lw;
      var tail = poly([[mx - size * 0.45, ey], [tx, ty], [mx + size * 0.45, ey]]);
      solid(c, tail, o.fill || T.paper, lw);
    }
    solid(c, p, o.fill || T.paper, lw);
    if (tx != null) {
      var mx2 = Math.max(bx + size, Math.min(bx + w - size, tx));
      c.fillStyle = o.fill || T.paper;
      var yy = ty > y ? by + h - lw * 1.6 : by - lw * 0.4;
      c.fillRect(mx2 - size * 0.42, yy, size * 0.84, lw * 2);
    }
    if (o.rule) { c.fillStyle = o.rule; c.fillRect(bx + lw, by + lw, w - lw * 2, size * 0.18); }
    lines.forEach(function (l, i) {
      text(c, l, x, by + pad * 0.75 + lh * (i + 0.5) + size * 0.05, size, { colour: o.ink || T.ink });
    });
    return { x: bx, y: by, w: w, h: h };
  }

  // The pointer: a bobbing arrow pointing down at (x, y) with a word on it
  function arrow(c, x, y, word, t, size, reduce) {
    var bob = reduce ? 0 : Math.sin(t * 6) * size * 0.25;
    var ay = y - size * 0.4 + bob;
    var shaft = poly([[x, ay], [x - size * 0.75, ay - size * 0.9], [x - size * 0.3, ay - size * 0.9], [x - size * 0.3, ay - size * 1.6],
                      [x + size * 0.3, ay - size * 1.6], [x + size * 0.3, ay - size * 0.9], [x + size * 0.75, ay - size * 0.9]]);
    solid(c, shaft, T.paper, size * 0.14);
    var tw = measure(c, word, size * 0.8) + size * 0.9;
    var tag = rr(x - tw / 2, ay - size * 2.75, tw, size * 1.15, size * 0.25);
    solid(c, tag, T.accent, size * 0.14);
    text(c, word, x, ay - size * 2.17, size * 0.8, { colour: T.ink });
  }

  // Red corner brackets round a box (the thing that's live right now)
  function brackets(c, x, y, w, h, len, lw, colour) {
    ink(c, lw, colour || T.red);
    c.lineCap = "square";
    c.beginPath();
    [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]].forEach(function (k) {
      c.moveTo(k[0], k[1] + k[3] * len); c.lineTo(k[0], k[1]); c.lineTo(k[0] + k[2] * len, k[1]);
    });
    c.stroke();
    c.lineCap = "round";
  }

  // ---------------------------------------------------------------------------
  // The town, baked: everything that doesn't move. opts (the stage): rain,
  // oneway, precinct, bunting. World units.
  // ---------------------------------------------------------------------------
  function bakeTown(c, opts) {
    var nodes = TW.nodes, edges = TW.edges;
    c.fillStyle = T.ink;
    c.fillRect(-2, -2, TW.WW + 4, TW.WH + 4);

    // the blocks: a kerb line, gardens in sparse halftone
    TW.blocks.forEach(function (b) {
      var B = b.box;
      var p = rr(B.x0, B.y0, B.x1 - B.x0, B.y1 - B.y0, 0.9);
      if (b.kind === "park") {
        shade(c, p, null, 0.9, T.accent, 0.3);
      } else if (b.kind === "carpark") {
        shade(c, p, null, 1.1, T.paper, 0.12);
      } else {
        shade(c, p, null, 1.3, T.accent, 0.17);
      }
      ink(c, 0.32, T.paper);
      c.stroke(p);
    });

    // lanes: narrow, kerbed, cut through their blocks
    edges.forEach(function (e) {
      if (!e.lane) return;
      var A = nodes[e.a], B = nodes[e.b];
      var p = e.h ? box(A.x, A.y - TW.LW, B.x - A.x, TW.LW * 2) : box(A.x - TW.LW, A.y, TW.LW * 2, B.y - A.y);
      c.fillStyle = T.ink;
      c.fill(p);
      ink(c, 0.26, T.paper);
      if (e.h) { line(c, [[A.x + TW.RW, A.y - TW.LW], [B.x - TW.RW, A.y - TW.LW]], 0.26, T.paper); line(c, [[A.x + TW.RW, A.y + TW.LW], [B.x - TW.RW, A.y + TW.LW]], 0.26, T.paper); }
      else { line(c, [[A.x - TW.LW, A.y + TW.RW], [A.x - TW.LW, B.y - TW.RW]], 0.26, T.paper); line(c, [[A.x + TW.LW, A.y + TW.RW], [A.x + TW.LW, B.y - TW.RW]], 0.26, T.paper); }
      // cobbles
      shade(c, p, null, 0.7, T.paper, 0.1);
    });

    // the park
    TW.blocks.forEach(function (b) { if (b.kind === "park") park(c, b.box); });
    TW.blocks.forEach(function (b) { if (b.kind === "carpark") carpark(c, b.box); });

    // houses and flats
    TW.houses.forEach(function (hs) { house(c, hs); });
    TW.restaurants.forEach(function (rs) { if (!rs.dark) restaurant(c, rs); });
    // back gardens: whoever's out in them
    var gi = 0;
    TW.blocks.forEach(function (b) {
      var B = b.box;
      var shop = TW.restaurants.some(function (rs) { return rs.x + rs.w > B.x0 && rs.x < B.x1 && rs.y + rs.h > B.y0 && rs.y < B.y1; });
      if (b.kind === "houses" && !shop) garden(c, B, gi++);
    });

    // the precinct: paving, bollards and bunting
    edges.forEach(function (e) {
      if (!e.precinct) return;
      var A = nodes[e.a], B = nodes[e.b];
      var p = box(A.x + TW.RW, A.y - TW.RW + 0.2, B.x - A.x - TW.RW * 2, TW.RW * 2 - 0.4);
      shade(c, p, null, 0.8, T.paper, 0.2);
      [A.x + TW.RW + 0.9, B.x - TW.RW - 0.9].forEach(function (bx) {
        [-1.6, 0, 1.6].forEach(function (dy) { solid(c, ell(bx, A.y + dy, 0.42, 0.42), T.paper, 0.2); });
      });
    });

    // centre lines on the streets, stopping short of the junctions
    edges.forEach(function (e) {
      if (e.lane || e.precinct) return;
      var A = nodes[e.a];
      c.save();
      c.setLineDash([1.4, 1.6]);
      var a = TW.RW + 0.8, b = e.len - TW.RW - 0.8;
      if (e.h) line(c, [[A.x + a, A.y], [A.x + b, A.y]], 0.22, T.paper);
      else line(c, [[A.x, A.y + a], [A.x, A.y + b]], 0.22, T.paper);
      c.restore();
    });

    // the one-way system: arrows on the road and a small blue-less sign
    edges.forEach(function (e) {
      if (!e.oneway) return;
      var n = Math.max(1, Math.round((e.len - TW.RW * 2) / 8));
      for (var i = 0; i < n; i++) {
        var s = TW.RW + (e.len - TW.RW * 2) * (i + 0.5) / n;
        var p = TW.point(e, s);
        oneWayArrow(c, p.x, p.y, e.h ? (e.oneway > 0 ? 0 : Math.PI) : (e.oneway > 0 ? Math.PI / 2 : -Math.PI / 2));
      }
    });

    // puddles
    edges.forEach(function (e) {
      e.puddles.forEach(function (s, i) {
        var p = TW.point(e, s);
        puddle(c, p.x, p.y, e.h, i);
      });
    });

    if (opts && opts.bunting) bunting(c);
  }

  function oneWayArrow(c, x, y, rot) {
    c.save();
    c.translate(x, y);
    c.rotate(rot);
    var p = poly([[2.0, 0], [0.6, -1.25], [0.6, -0.5], [-1.8, -0.5], [-1.8, 0.5], [0.6, 0.5], [0.6, 1.25]]);
    solid(c, p, T.paper, 0.2);
    c.restore();
  }

  function puddle(c, x, y, h, i) {
    var rx = h ? 2.6 : 1.7, ry = h ? 1.7 : 2.6;
    var p = ell(x + (i % 2 ? 0.4 : -0.4), y, rx, ry, 0.2);
    c.fillStyle = T.ink;
    c.fill(p);
    shade(c, p, null, 0.55, T.paper, 0.22);
    ink(c, 0.28, T.paper);
    c.stroke(p);
    c.beginPath();
    c.ellipse(x - rx * 0.2, y - ry * 0.15, rx * 0.5, ry * 0.4, 0.2, Math.PI * 1.1, Math.PI * 1.6);
    ink(c, 0.26, T.paper);
    c.stroke();
  }

  function house(c, hs) {
    var x = hs.x, y = hs.y, w = hs.w, h = hs.h;
    var roof = rr(x, y, w, h, 0.4);
    solid(c, roof, T.paper, 0.32);
    var horiz = hs.side === "N" || hs.side === "S";
    if (hs.kind === "flat") {
      // a flat roof: an inner edge, vents, and halftone on the far half
      shade(c, roof, horiz ? box(x, y, w, h / 2) : box(x + w / 2, y, w / 2, h), 0.7, T.ink, 0.22);
      c.strokeStyle = T.ink;
      c.lineWidth = 0.2;
      c.strokeRect(x + 0.7, y + 0.7, w - 1.4, h - 1.4);
      solid(c, ell(x + w * 0.3, y + h * 0.35, 0.45, 0.45), T.paper, 0.2);
      solid(c, ell(x + w * 0.7, y + h * 0.65, 0.45, 0.45), T.paper, 0.2);
      // bins by the back door
      var bx = hs.back.x, by = hs.back.y;
      if (hs.block === "court") {
        [-2.2, 2.0].forEach(function (d) { bin(c, bx + d, by + TW.LW + 0.95); });
      } else {
        [-2.0, 2.0].forEach(function (d) { bin(c, bx + TW.LW + 0.95, by + d); });
      }
    } else {
      // a pitched roof: the ridge along the street, halftone on the back slope
      var v = (hs.no * 7 + Math.round(x)) % 4;
      if (v === 1) { solid(c, roof, T.red, 0.32); }
      if (horiz) {
        var back = hs.side === "N" ? box(x, y + h / 2, w, h / 2) : box(x, y, w, h / 2);
        shade(c, roof, back, 0.6, T.ink, 0.26);
        var fy = hs.side === "N" ? y + h * 0.15 : y + h * 0.6;
        if (v === 2) {
          solid(c, box(x + w * 0.2, fy, 1.0, 1.3), T.paper, 0.2);
          solid(c, ell(x + w * 0.62, fy + 0.7, 0.75, 0.75), T.paper, 0.2);
          line(c, [[x + w * 0.62, fy + 0.7], [x + w * 0.62 + 0.55, fy + 0.15]], 0.16);
        } else if (v === 3) {
          [0.22, 0.56].forEach(function (k) { solid(c, box(x + w * k, fy + 0.1, 1.5, 1.1), T.accent, 0.18); });
        } else if (v === 0) {
          var sp = box(x + w * 0.18, fy, w * 0.64, 1.3);
          solid(c, sp, T.ink, 0.18, T.paper);
          for (var k = 1; k < 4; k++) line(c, [[x + w * 0.18 + k * w * 0.16, fy], [x + w * 0.18 + k * w * 0.16, fy + 1.3]], 0.1, T.paper);
        }
        line(c, [[x + 0.4, y + h / 2], [x + w - 0.4, y + h / 2]], 0.26);
        solid(c, box(x + w * 0.68, y + (hs.side === "N" ? h * 0.6 : h * 0.18), 0.9, 1.1), T.paper, 0.2);
      } else {
        var back2 = hs.side === "W" ? box(x + w / 2, y, w / 2, h) : box(x, y, w / 2, h);
        shade(c, roof, back2, 0.6, T.ink, 0.26);
        var fx2 = hs.side === "W" ? x + w * 0.15 : x + w * 0.6;
        if (v === 2) { solid(c, box(fx2, y + h * 0.25, 1.3, 1.0), T.paper, 0.2); solid(c, ell(fx2 + 0.7, y + h * 0.62, 0.75, 0.75), T.paper, 0.2); }
        else if (v === 3) { [0.2, 0.55].forEach(function (k) { solid(c, box(fx2, y + h * k, 1.1, 1.5), T.accent, 0.18); }); }
        line(c, [[x + w / 2, y + 0.4], [x + w / 2, y + h - 0.4]], 0.26);
      }
    }
    // the front door, in cyan, with a path to the pavement
    var d = hs.front;
    door(c, d.x, d.y, hs.side, false);
  }
  // A back garden, in the middle of a block: a dog, a washing line, a
  // trampoline, someone in a deckchair. World units.
  function garden(c, B, i) {
    var cx = (B.x0 + B.x1) / 2, cy = (B.y0 + B.y1) / 2;
    var kind = i % 4;
    if (kind === 0 || kind === 2) {
      // a washing line, and a dog under it
      line(c, [[cx - 6, cy - 1.2], [cx + 6, cy - 1.2]], 0.14, T.paper);
      [[-4.6, T.red], [-2.4, T.paper], [0.2, T.accent], [2.6, T.paper]].forEach(function (q, k) {
        solid(c, k % 2 ? box(cx + q[0], cy - 1.2, 1.5, 1.7) : poly([[cx + q[0], cy - 1.2], [cx + q[0] + 1.6, cy - 1.2], [cx + q[0] + 1.4, cy + 0.5], [cx + q[0] + 0.2, cy + 0.5]]), q[1], 0.14);
      });
      dog(c, cx + (kind ? -3.2 : 3.6), cy + 1.5, kind ? -1 : 1);
    } else if (kind === 1) {
      // a trampoline and a child on it
      var tr = ell(cx - 2.5, cy + 0.2, 2.2, 1.7);
      solid(c, tr, T.ink, 0.3, T.paper);
      shade(c, tr, null, 0.45, T.paper, 0.18);
      kid(c, cx - 2.5, cy - 0.6, T.red, true);
      dog(c, cx + 3.2, cy + 1.2, -1);
    } else {
      // a deckchair and its owner, and a gnome
      var dc = rr(cx - 3.2, cy - 1.4, 2.4, 3.0, 0.3);
      solid(c, dc, T.paper, 0.2);
      c.save(); c.clip(dc); c.fillStyle = T.red;
      for (var k = 0; k < 3; k++) c.fillRect(cx - 3.2 + k * 0.85, cy - 1.4, 0.42, 3);
      c.restore(); ink(c, 0.2); c.stroke(dc);
      kid(c, cx - 2.0, cy - 0.5, T.accent, false);
      solid(c, poly([[cx + 3, cy - 0.6], [cx + 2.4, cy + 0.6], [cx + 3.6, cy + 0.6]]), T.red, 0.15);
      solid(c, ell(cx + 3, cy + 0.9, 0.5, 0.45), T.paper, 0.15);
    }
  }
  function dog(c, x, y, f) {
    solid(c, ell(x, y, 1.15, 0.6), T.paper, 0.2);
    [-0.7, -0.3, 0.4, 0.8].forEach(function (lx) { line(c, [[x + lx, y + 0.3], [x + lx, y + 1.0]], 0.22); });
    line(c, [[x - f * 1.05, y - 0.2], [x - f * 1.6, y - 0.9]], 0.2);
    solid(c, ell(x + f * 1.2, y - 0.55, 0.62, 0.55), T.paper, 0.2);
    solid(c, ell(x + f * 0.95, y - 1.0, 0.22, 0.4, f * 0.5), T.ink, 0);
    c.fillStyle = T.ink; c.beginPath(); c.arc(x + f * 1.75, y - 0.5, 0.15, 0, 7); c.fill();
  }
  function kid(c, x, y, top, up) {
    [-1, 1].forEach(function (sd) {
      var hand = up ? [x + sd * 1.1, y - 1.4] : [x + sd * 1.0, y + 0.9];
      line(c, [[x + sd * 0.4, y + 0.2], hand], 0.42, T.ink);
      line(c, [[x + sd * 0.4, y + 0.2], hand], 0.2, top);
    });
    solid(c, rr(x - 0.6, y - 0.1, 1.2, 1.5, 0.35), top, 0.16);
    solid(c, ell(x, y - 0.75, 0.62, 0.62), T.paper, 0.16);
    c.fillStyle = T.ink;
    c.beginPath(); c.arc(x - 0.2, y - 0.8, 0.09, 0, 7); c.arc(x + 0.2, y - 0.8, 0.09, 0, 7); c.fill();
  }
  function door(c, sx, sy, side, wide) {
    var hw = wide ? 1.4 : 0.85;
    var off = TW.RW + (side === "N" || side === "W" ? 0 : 0);
    var p;
    if (side === "N") p = box(sx - hw, sy + off, hw * 2, 0.75);
    if (side === "S") p = box(sx - hw, sy - off - 0.75, hw * 2, 0.75);
    if (side === "W") p = box(sx + off, sy - hw, 0.75, hw * 2);
    if (side === "E") p = box(sx - off - 0.75, sy - hw, 0.75, hw * 2);
    solid(c, p, T.accent, 0.2);
  }
  function bin(c, x, y) {
    solid(c, rr(x - 0.75, y - 0.75, 1.5, 1.5, 0.25), T.paper, 0.22);
    line(c, [[x - 0.75, y - 0.2], [x + 0.75, y - 0.2]], 0.18);
    shade(c, rr(x - 0.75, y - 0.2, 1.5, 0.95, 0.2), null, 0.45, T.ink, 0.25);
  }

  function restaurant(c, rs) {
    var x = rs.x, y = rs.y, w = rs.w, h = rs.h;
    var roof = rr(x, y, w, h, 0.5);
    solid(c, roof, T.paper, 0.34);
    shade(c, roof, rs.side === "N" ? box(x, y + h * 0.55, w, h * 0.45) : box(x, y, w, h * 0.45), 0.6, T.ink, 0.24);
    // the awning, striped red and paper, along the street side
    var ay = rs.side === "N" ? y - 0.1 : y + h - 1.9, ah = 2.0;
    var aw = rr(x + 0.4, ay, w - 0.8, ah, 0.3);
    solid(c, aw, T.paper, 0.26);
    c.save();
    c.clip(aw);
    c.fillStyle = T.red;
    for (var sx = x + 0.4; sx < x + w; sx += 1.6) c.fillRect(sx, ay, 0.8, ah);
    c.restore();
    ink(c, 0.26);
    c.stroke(aw);
    // the sign on the roof: what it sells
    var cx = x + w / 2, cy = rs.side === "N" ? y + h * 0.58 : y + h * 0.4;
    solid(c, ell(cx, cy, 2.3, 2.3), T.ink, 0.26, T.ink);
    icon(c, rs.icon, cx, cy, 1.5);
    door(c, rs.stop.x, rs.stop.y, rs.side, true);
  }

  // The food icons: drawn in paper and cyan on ink
  function icon(c, kind, x, y, r) {
    if (kind === "fish") {
      solid(c, ell(x - r * 0.15, y, r * 0.75, r * 0.45), T.paper, r * 0.12);
      solid(c, poly([[x + r * 0.5, y], [x + r * 1.0, y - r * 0.45], [x + r * 1.0, y + r * 0.45]]), T.paper, r * 0.12);
      c.fillStyle = T.ink; c.beginPath(); c.arc(x - r * 0.55, y - r * 0.08, r * 0.08, 0, 7); c.fill();
    } else if (kind === "bowl") {
      var b = new Path2D();
      b.moveTo(x - r * 0.9, y - r * 0.1); b.lineTo(x + r * 0.9, y - r * 0.1);
      b.quadraticCurveTo(x + r * 0.8, y + r * 0.8, x, y + r * 0.8);
      b.quadraticCurveTo(x - r * 0.8, y + r * 0.8, x - r * 0.9, y - r * 0.1);
      solid(c, b, T.accent, r * 0.12);
      line(c, [[x + r * 0.1, y - r * 0.1], [x + r * 0.7, y - r * 0.9]], r * 0.11, T.paper);
      line(c, [[x + r * 0.3, y - r * 0.1], [x + r * 0.95, y - r * 0.75]], r * 0.11, T.paper);
    } else if (kind === "kebab") {
      line(c, [[x, y - r * 0.95], [x, y + r * 0.95]], r * 0.12, T.paper);
      solid(c, rr(x - r * 0.55, y - r * 0.7, r * 1.1, r * 1.3, r * 0.4), T.paper, r * 0.12);
      shade(c, rr(x - r * 0.55, y - r * 0.7, r * 1.1, r * 1.3, r * 0.4), box(x, y - r, r, r * 2), r * 0.35, T.ink);
    } else if (kind === "burger") {
      solid(c, ell(x, y - r * 0.25, r * 0.85, r * 0.45), T.paper, r * 0.12);
      solid(c, rr(x - r * 0.9, y + r * 0.05, r * 1.8, r * 0.25, r * 0.1), T.accent, r * 0.1);
      solid(c, rr(x - r * 0.85, y + r * 0.32, r * 1.7, r * 0.35, r * 0.15), T.paper, r * 0.12);
    } else if (kind === "bag") {
      solid(c, rr(x - r * 0.75, y - r * 0.55, r * 1.5, r * 1.35, r * 0.15), T.paper, r * 0.13);
      c.beginPath();
      c.arc(x, y - r * 0.55, r * 0.38, Math.PI, 0);
      ink(c, r * 0.13);
      c.stroke();
    }
  }

  function park(c, B) {
    var w = B.x1 - B.x0, h = B.y1 - B.y0;
    // paths: across and down, paper lines
    c.save();
    c.setLineDash([0.9, 0.7]);
    line(c, [[B.x0, B.y0 + h * 0.62], [B.x0 + w * 0.42, B.y0 + h * 0.52], [B.x1, B.y0 + h * 0.3]], 0.3, T.paper);
    line(c, [[B.x0 + w * 0.42, B.y0 + h * 0.52], [B.x0 + w * 0.5, B.y1]], 0.3, T.paper);
    c.restore();
    // the pond
    var pond = ell(B.x0 + w * 0.68, B.y0 + h * 0.7, w * 0.2, h * 0.14, -0.15);
    c.fillStyle = T.ink; c.fill(pond);
    shade(c, pond, null, 0.6, T.paper, 0.18);
    ink(c, 0.3, T.paper); c.stroke(pond);
    // a duck
    solid(c, ell(B.x0 + w * 0.66, B.y0 + h * 0.69, 0.6, 0.4), T.paper, 0.18);
    solid(c, ell(B.x0 + w * 0.66 - 0.5, B.y0 + h * 0.69 - 0.35, 0.3, 0.3), T.paper, 0.15);
    // trees: paper puffs with a cyan shadow
    [[0.18, 0.2, 2.3], [0.42, 0.18, 1.8], [0.78, 0.22, 2.2], [0.18, 0.84, 2.0], [0.32, 0.7, 1.5], [0.86, 0.45, 1.6]].forEach(function (t) {
      tree(c, B.x0 + w * t[0], B.y0 + h * t[1], t[2]);
    });
    // a bench
    solid(c, rr(B.x0 + w * 0.5, B.y0 + h * 0.38, 2.6, 0.9, 0.2), T.paper, 0.2);
    line(c, [[B.x0 + w * 0.5, B.y0 + h * 0.38 + 0.45], [B.x0 + w * 0.5 + 2.6, B.y0 + h * 0.38 + 0.45]], 0.14);
  }
  function tree(c, x, y, r) {
    var off = r * 0.22;
    [[0, 0, 1], [-0.5, 0.3, 0.7], [0.5, 0.3, 0.7], [0, -0.45, 0.65]].forEach(function (q) {
      solid(c, ell(x + q[0] * r + off, y + q[1] * r + off, q[2] * r, q[2] * r), T.accent, 0);
    });
    [[0, 0, 1], [-0.5, 0.3, 0.7], [0.5, 0.3, 0.7], [0, -0.45, 0.65]].forEach(function (q) {
      solid(c, ell(x + q[0] * r, y + q[1] * r, q[2] * r, q[2] * r), T.paper, r * 0.12);
    });
    [[0, 0, 1], [-0.5, 0.3, 0.7], [0.5, 0.3, 0.7], [0, -0.45, 0.65]].forEach(function (q) {
      c.fillStyle = T.paper;
      c.beginPath(); c.ellipse(x + q[0] * r, y + q[1] * r, q[2] * r - r * 0.06, q[2] * r - r * 0.06, 0, 0, 7); c.fill();
    });
    shade(c, ell(x, y, r, r), box(x, y, r * 1.6, r * 1.6), r * 0.32, T.ink, 0.22);
  }

  // The car park: bays, three kitchens in shipping containers, and a sign
  // with twelve restaurants on it
  function carpark(c, B) {
    var w = B.x1 - B.x0, h = B.y1 - B.y0;
    // bay lines along the bottom
    for (var i = 0; i <= 6; i++) {
      var bx = B.x0 + 1 + i * (w - 2) / 6;
      line(c, [[bx, B.y1 - 0.6], [bx, B.y1 - 4.6]], 0.22, T.paper);
    }
    // the kitchen: one long container, three red roller shutters
    var kx = B.x0 + 1.2, ky = B.y0 + 3.4, kw = 10.6, kh = 6.4;
    var kp = box(kx, ky, kw, kh);
    solid(c, kp, T.paper, 0.3);
    c.save(); c.clip(kp);
    for (var s = 0; s < 3; s++) { c.fillStyle = T.ink; c.fillRect(kx, ky + 1.6 + s * 1.6, kw, 0.16); }
    c.restore();
    [0, 1, 2].forEach(function (k) {
      var sx0 = kx + 0.6 + k * 3.4;
      solid(c, box(sx0, ky - 0.01, 2.8, 1.3), T.red, 0.22);
      line(c, [[sx0, ky + 0.45], [sx0 + 2.8, ky + 0.45]], 0.12, T.paper);
      line(c, [[sx0, ky + 0.9], [sx0 + 2.8, ky + 0.9]], 0.12, T.paper);
    });
    solid(c, ell(kx + kw * 0.8, ky + kh * 0.72, 0.6, 0.6), T.ink, 0.2, T.paper);
    solid(c, ell(kx + kw * 0.35, ky + kh * 0.72, 0.6, 0.6), T.ink, 0.2, T.paper);
    // the sign: twelve restaurants on one post
    var sx = B.x1 - 2.6, sy = B.y0 + 1.4;
    line(c, [[sx, sy + 7.2], [sx, sy + 9.4]], 0.35, T.paper);
    var sign = rr(sx - 2.05, sy, 4.1, 7.2, 0.3);
    solid(c, sign, T.ink, 0.3, T.paper);
    for (var j = 0; j < 12; j++) {
      var col = j % 3, row = Math.floor(j / 3);
      var fill = [T.red, T.accent, T.paper][(j + row) % 3];
      solid(c, rr(sx - 1.7 + col * 1.2, sy + 0.45 + row * 1.68, 0.95, 1.35, 0.22), fill, 0.1, T.ink);
    }
    // other riders, waiting
    rider(c, B.x0 + 4.2, B.y1 - 1.2, "R", { k: 0.6, still: true });
    rider(c, B.x0 + 9.4, B.y1 - 1.2, "L", { k: 0.6, still: true });
  }

  function bunting(c) {
    // strings of red and cyan flags across the high street
    var y = TW.YS[2];
    [31, 44, 56, 68].forEach(function (x) {
      line(c, [[x - 0.2, y - TW.RW - 0.3], [x + 0.2, y + TW.RW + 0.3]], 0.12, T.paper);
      for (var i = 0; i < 4; i++) {
        var fy = y - TW.RW + 0.6 + i * 1.3;
        solid(c, poly([[x - 0.6, fy], [x + 0.6, fy], [x, fy + 0.95]]), i % 2 ? T.red : T.accent, 0.1);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Parked cars: their doors open into the road. state: parked, warn, open
  // ---------------------------------------------------------------------------
  function car(c, x, y, h, side, state, t, colourIdx) {
    // side: which kerb, +1 (south or east) or -1 (north or west)
    c.save();
    c.translate(x, y);
    if (!h) c.rotate(Math.PI / 2);
    var kerb = side * (TW.RW - 1.15);
    c.translate(0, kerb);
    var bw = 5.0, bh = 2.3;
    var body = rr(-bw / 2, -bh / 2, bw, bh, 0.7);
    var fill = colourIdx % 2 ? T.red : T.paper;
    solid(c, body, fill, 0.26);
    // windscreen and roof
    solid(c, rr(-0.7, -bh / 2 + 0.35, 2.4, bh - 0.7, 0.3), T.ink, 0.15, T.ink);
    shade(c, rr(-0.5, -bh / 2 + 0.45, 2.0, bh - 0.9, 0.3), null, 0.4, T.paper, 0.2);
    if (state === "warn" || state === "open") {
      // the light's on inside
      c.fillStyle = dots(c, T.accent, 0.35, 0.33);
      c.fill(rr(-0.7, -bh / 2 + 0.35, 2.4, bh - 0.7, 0.3));
    }
    // the driver's door, on the road side
    var a = state === "open" ? 1.05 : state === "warn" ? 0.18 + Math.sin(t * 18) * 0.06 : 0;
    var hy = -side * bh / 2;
    c.save();
    c.translate(0.9, hy);
    c.rotate(side * a);
    var d = rr(-2.0, -0.18, 2.0, 0.36, 0.12);
    solid(c, d, fill, 0.2);
    c.restore();
    if (state === "open") {
      // a mitten on the door's edge
      var ex = 0.9 - Math.cos(a) * 2.0, ey = hy - side * Math.sin(a) * 2.0;
      mitten(c, ex, ey, 0.45, T.paper, false, 0.12);
    }
    c.restore();
  }

  // ---------------------------------------------------------------------------
  // The rider: a cut-out cartoon on a bicycle, in a red helmet, carrying a
  // huge insulated cube in cyan. Stands on (x, y), the road under the bike.
  // facing: R, L, U, D. o: { k (size), pedal (phase), still, push, late,
  //   wobble, look, shout }
  // ---------------------------------------------------------------------------
  function rider(c, x, y, facing, o) {
    o = o || {};
    var k = o.k || 1;
    c.save();
    c.translate(x, y);
    if (o.wobble) c.rotate(o.wobble);
    c.scale(k, k);
    var ph = o.pedal || 0;
    var lw = 0.26;
    if (facing === "L" || facing === "R") {
      if (facing === "L") c.scale(-1, 1);
      // wheels
      [-2.05, 2.05].forEach(function (wx) {
        solid(c, ell(wx, -0.2, 1.15, 1.15), T.ink, 0.34, T.paper);
        if (!o.still) {
          var a = ph * 2 + wx;
          line(c, [[wx + Math.cos(a) * 0.9, -0.2 + Math.sin(a) * 0.9], [wx - Math.cos(a) * 0.9, -0.2 - Math.sin(a) * 0.9]], 0.12, T.paper);
        }
      });
      // frame
      line(c, [[-2.05, -0.2], [-0.35, -1.75], [1.55, -1.75], [2.05, -0.2]], 0.42, T.ink);
      line(c, [[-2.05, -0.2], [-0.35, -1.75], [1.55, -1.75], [2.05, -0.2]], 0.24, T.red);
      line(c, [[-0.35, -1.75], [0.05, -0.2], [-2.05, -0.2]], 0.42, T.ink);
      line(c, [[-0.35, -1.75], [0.05, -0.2], [-2.05, -0.2]], 0.24, T.red);
      line(c, [[1.55, -1.75], [1.75, -2.65]], 0.3, T.paper);
      // legs to the pedals
      var p1 = [0.05 + Math.cos(ph) * 0.65, -0.2 + Math.sin(ph) * 0.65];
      var p2 = [0.05 - Math.cos(ph) * 0.65, -0.2 - Math.sin(ph) * 0.65];
      if (o.push) { p1 = [0.4, 0.4]; p2 = [-0.5, 0.4]; }
      [p2, p1].forEach(function (p, i) {
        line(c, [[-0.4, -2.5], [0.55 + (i ? 0.2 : 0), -1.55 + (i ? 0.1 : 0)], p], 0.62, T.ink);
        line(c, [[-0.4, -2.5], [0.55 + (i ? 0.2 : 0), -1.55 + (i ? 0.1 : 0)], p], 0.3, T.paper);
      });
      // the cube, on the back
      var cube = rr(-3.75, -7.1, 3.5, 3.7, 0.35);
      solid(c, cube, T.accent, lw);
      shade(c, cube, box(-3.75, -5.0, 3.5, 1.6), 0.45, T.ink, 0.24);
      line(c, [[-3.75, -6.55], [-0.25, -6.55]], 0.16);
      logo(c, -2.0, -5.1, 0.85);
      // the body: a paper jacket, halftone down the back
      var body = ell(-0.15, -3.05, 1.35, 1.45, 0.25);
      solid(c, body, T.paper, lw);
      shade(c, body, box(-1.6, -4.6, 1.2, 3.2), 0.4, T.ink, 0.25);
      line(c, [[-0.9, -4.1], [-0.35, -2.4]], 0.18);   // the cube's strap
      // the arm to the handlebar
      line(c, [[0.4, -3.3], [1.75, -2.75]], 0.6, T.ink);
      line(c, [[0.4, -3.3], [1.75, -2.75]], 0.3, T.paper);
      mitten(c, 1.85, -2.72, 0.42, T.paper, false, 0.13);
      // the head, in profile-ish, and the helmet
      var hx = 0.45, hy = -5.0;
      solid(c, ell(hx, hy, 1.35, 1.3), T.paper, lw);
      sideFace(c, hx + 0.35, hy + 0.1, 1.3, o);
      helmet(c, hx, hy, 1.35, 0.25);
    } else if (facing === "D") {
      // coming towards you: the cube behind the head, the face, the front wheel
      var cube2 = rr(-2.3, -7.4, 4.6, 4.0, 0.4);
      solid(c, cube2, T.accent, lw);
      shade(c, cube2, box(0.9, -7.4, 1.4, 4.0), 0.45, T.ink, 0.24);
      line(c, [[-2.3, -6.8], [2.3, -6.8]], 0.16);
      solid(c, ell(0, -0.3, 0.42, 1.2), T.ink, 0.32, T.paper);
      var bod = ell(0, -2.75, 1.55, 1.4);
      solid(c, bod, T.paper, lw);
      shade(c, bod, box(0.6, -4.2, 1.2, 3), 0.4, T.ink, 0.25);
      line(c, [[-1.9, -1.8], [1.9, -1.8]], 0.3, T.paper);
      line(c, [[-1.9, -1.8], [1.9, -1.8]], 0.12, T.ink);
      var bob = o.still ? 0 : Math.sin(ph) * 0.18;
      mitten(c, -1.95, -1.85 + bob, 0.42, T.paper, false, 0.13);
      mitten(c, 1.95, -1.85 - bob, 0.42, T.paper, true, 0.13);
      solid(c, ell(0, -4.85, 1.45, 1.38), T.paper, lw);
      face(c, 0, -4.75, 1.2, { brows: o.late ? 1 : 0.6, look: o.look || 0, shout: o.shout || 0 });
      helmet(c, 0, -4.85, 1.45, 0);
      if (o.late) sweat(c, 1.45, -5.6, o.t || 0);
    } else {
      // going away: the cube is most of what you see
      solid(c, ell(0, -0.3, 0.42, 1.2), T.ink, 0.32, T.paper);
      line(c, [[-1.9, -1.9], [1.9, -1.9]], 0.3, T.paper);
      var bob2 = o.still ? 0 : Math.sin(ph) * 0.18;
      mitten(c, -1.95, -1.95 + bob2, 0.42, T.paper, false, 0.13);
      mitten(c, 1.95, -1.95 - bob2, 0.42, T.paper, true, 0.13);
      solid(c, ell(0, -2.4, 1.5, 1.2), T.paper, lw);
      helmet(c, 0, -6.6, 1.4, 0, true);
      var cube3 = rr(-2.35, -6.6, 4.7, 4.4, 0.4);
      solid(c, cube3, T.accent, lw);
      shade(c, cube3, box(0.9, -6.6, 1.45, 4.4), 0.45, T.ink, 0.24);
      line(c, [[-2.35, -6.0], [2.35, -6.0]], 0.16);
      logo(c, 0, -4.1, 1.05);
    }
    c.restore();
  }
  // The app's logo: a paper roundel with a little ink scooter-arrow
  function logo(c, x, y, r) {
    solid(c, ell(x, y, r, r), T.paper, r * 0.16);
    line(c, [[x - r * 0.5, y + r * 0.15], [x + r * 0.45, y + r * 0.15], [x + r * 0.1, y - r * 0.25]], r * 0.2, T.ink);
    line(c, [[x + r * 0.45, y + r * 0.15], [x + r * 0.1, y + r * 0.5]], r * 0.2, T.ink);
  }
  function helmet(c, x, y, r, tilt, back) {
    var p = new Path2D();
    p.ellipse(x, y - r * 0.05, r * 1.08, r * 1.0, tilt || 0, Math.PI * 1.02, Math.PI * 1.98);
    p.closePath();
    if (back) { p = ell(x, y, r * 1.05, r * 0.85); }
    solid(c, p, T.red, r * 0.18);
    // vents: paper stripes
    c.save();
    c.clip(p);
    [-0.45, 0, 0.45].forEach(function (d) { line(c, [[x + d * r, y - r * 0.95], [x + d * r * 1.2, y - r * 0.15]], r * 0.13, T.paper); });
    c.restore();
    ink(c, r * 0.18);
    c.stroke(p);
  }
  function sideFace(c, x, y, r, o) {
    solid(c, ell(x + r * 0.3, y, r * 0.17, r * 0.24), T.paper, r * 0.1);
    c.fillStyle = T.ink;
    c.beginPath(); c.arc(x + r * 0.36, y + r * 0.03, r * 0.08, 0, 7); c.fill();
    line(c, [[x + r * 0.05, y - r * 0.32 + (o.late ? r * 0.1 : 0)], [x + r * 0.52, y - r * 0.42]], r * 0.15);
    c.beginPath();
    c.arc(x + r * 0.42, y + r * 0.62, r * 0.18, Math.PI * 1.25, Math.PI * 1.75);
    ink(c, r * 0.11);
    c.stroke();
    c.beginPath();
    c.arc(x + r * 0.15, y + r * 0.4, r * 0.48, Math.PI * 0.2, Math.PI * 0.55);
    ink(c, r * 0.09);
    c.stroke();
    if (o.late) sweat(c, x + r * 0.95, y - r * 0.7, o.t || 0);
  }
  function sweat(c, x, y, t) {
    var dy = (t * 2.2) % 1;
    var p = new Path2D();
    var yy = y + dy * 0.9;
    p.moveTo(x, yy - 0.5);
    p.quadraticCurveTo(x + 0.35, yy, x, yy + 0.25);
    p.quadraticCurveTo(x - 0.35, yy, x, yy - 0.5);
    solid(c, p, T.paper, 0.12);
  }

  // ---------------------------------------------------------------------------
  // Pins over the stops. kind: pick (cyan), door (paper), late (red), here
  // (cyan, ringed). Returns the box, for taps.
  // ---------------------------------------------------------------------------
  function pin(c, x, y, label, kind, size, o) {
    o = o || {};
    var fill = kind === "late" ? T.red : kind === "door" ? T.paper : T.accent;
    var txt = kind === "late" ? T.paper : T.ink;
    var w = measure(c, label, size) + size * 0.9 + (o.icon ? size * 1.1 : 0);
    var h = size * 1.45;
    var by = y - h - size * 0.75;
    var bx = x - w / 2;
    var tail = poly([[x - size * 0.42, by + h - 0.1], [x, y], [x + size * 0.42, by + h - 0.1]]);
    var lw = Math.max(size * 0.13, 0.2);
    solid(c, tail, fill, lw);
    var p = rr(bx, by, w, h, size * 0.3);
    solid(c, p, fill, lw);
    c.fillStyle = fill;
    c.fillRect(x - size * 0.38, by + h - lw * 1.4, size * 0.76, lw * 1.8);
    if (o.icon) {
      icon(c, o.icon, bx + size * 0.85, by + h / 2, size * 0.42);
    }
    text(c, label, bx + w / 2 + (o.icon ? size * 0.55 : 0), by + h / 2 + size * 0.06, size, { colour: txt });
    if (o.ring) {
      var q = rr(bx - size * 0.3, by - size * 0.3, w + size * 0.6, h + size * 0.6, size * 0.5);
      ink(c, lw * 1.3, T.paper);
      c.setLineDash([size * 0.5, size * 0.35]);
      c.stroke(q);
      c.setLineDash([]);
    }
    if (o.progress != null) {
      // being prepared: a bar along the bottom of the pin
      var pw = (w - size * 0.5) * Math.max(0, Math.min(1, o.progress));
      c.fillStyle = T.ink;
      c.fillRect(bx + size * 0.25, by + h - size * 0.32, w - size * 0.5, size * 0.16);
      c.fillStyle = T.paper;
      c.fillRect(bx + size * 0.25, by + h - size * 0.32, pw, size * 0.16);
    }
    return { x: bx, y: by, w: w, h: h + size * 0.75 };
  }

  // ---------------------------------------------------------------------------
  // The people at the doors: house cut-outs, head and shoulders, one thing
  // each. look: curlers, baby, headset, cap, perm, bun, scarf, beanie, specs,
  // gown. Drawn in CSS pixels, R the head's radius.
  // ---------------------------------------------------------------------------
  var LOOKS = ["curlers", "baby", "headset", "cap", "perm", "bun", "beanie", "specs", "tache", "scarf"];
  function person(c, x, y, R, look, o) {
    o = o || {};
    var lw = R * 0.1;
    // shoulders
    var sh = ell(x, y + R * 1.55, R * 1.35, R * 0.9);
    var top = look === "scarf" ? T.red : look === "gown" || look === "curlers" ? T.accent : T.paper;
    solid(c, sh, top, lw);
    if (top === T.paper) shade(c, sh, box(x + R * 0.3, y, R * 1.2, R * 3), R * 0.16, T.ink);
    if (look === "scarf") {
      // a football scarf in cyan and paper stripes
      var sc = rr(x - R * 0.95, y + R * 0.75, R * 1.9, R * 0.45, R * 0.15);
      solid(c, sc, T.accent, lw * 0.8);
      c.save(); c.clip(sc); c.fillStyle = T.paper;
      for (var i = -3; i < 4; i++) c.fillRect(x + i * R * 0.42, y + R * 0.7, R * 0.2, R * 0.6);
      c.restore(); ink(c, lw * 0.8); c.stroke(sc);
    }
    if (look === "baby") {
      // a baby in a sling, asleep (until it isn't)
      solid(c, ell(x - R * 0.55, y + R * 1.35, R * 0.62, R * 0.55), T.accent, lw * 0.8);
      solid(c, ell(x - R * 0.55, y + R * 1.05, R * 0.42, R * 0.4), T.paper, lw * 0.8);
      if (o.awake) {
        solid(c, ell(x - R * 0.55, y + R * 1.18, R * 0.15, R * 0.12), T.ink, 0);
        line(c, [[x - R * 0.7, y + R * 0.98], [x - R * 0.62, y + R * 1.0]], lw * 0.7);
        line(c, [[x - R * 0.4, y + R * 0.98], [x - R * 0.48, y + R * 1.0]], lw * 0.7);
      } else {
        c.beginPath(); c.arc(x - R * 0.66, y + R * 1.02, R * 0.08, 0.2, Math.PI - 0.2); ink(c, lw * 0.6); c.stroke();
        c.beginPath(); c.arc(x - R * 0.44, y + R * 1.02, R * 0.08, 0.2, Math.PI - 0.2); c.stroke();
      }
    }
    // the head
    solid(c, ell(x, y, R, R * 0.97), T.paper, lw);
    shade(c, ell(x, y, R, R * 0.97), box(x + R * 0.55, y - R, R, R * 2), R * 0.15, T.ink);
    face(c, x, y + R * 0.05, R * 0.95, { look: o.look || 0, brows: o.brows == null ? 1 : o.brows, shout: o.shout || 0, smile: o.smile });
    if (o.shh) {
      // a finger to the lips: a mitten in front of the mouth
      mitten(c, x + R * 0.05, y + R * 0.62, R * 0.28, T.paper, false, lw * 0.7);
    }
    // one thing each
    if (look === "curlers") {
      [-0.6, -0.2, 0.2, 0.6].forEach(function (d) { solid(c, rr(x + d * R - R * 0.17, y - R * 1.05, R * 0.34, R * 0.5, R * 0.12), T.red, lw * 0.7); });
    } else if (look === "headset") {
      c.beginPath(); c.arc(x, y - R * 0.05, R * 1.08, Math.PI * 1.05, Math.PI * 1.95); ink(c, lw * 1.6); c.stroke();
      solid(c, rr(x - R * 1.22, y - R * 0.3, R * 0.35, R * 0.6, R * 0.1), T.ink, lw * 0.6, T.paper);
      solid(c, rr(x + R * 0.87, y - R * 0.3, R * 0.35, R * 0.6, R * 0.1), T.ink, lw * 0.6, T.paper);
      line(c, [[x - R * 1.05, y + R * 0.2], [x - R * 0.5, y + R * 0.6]], lw * 0.8);
      solid(c, ell(x - R * 0.45, y + R * 0.62, R * 0.12, R * 0.12), T.accent, lw * 0.6);
    } else if (look === "cap") {
      var cap = new Path2D();
      cap.ellipse(x, y - R * 0.35, R * 0.98, R * 0.7, 0, Math.PI, 0);
      cap.closePath();
      solid(c, cap, T.red, lw);
      solid(c, rr(x - R * 0.2, y - R * 0.42, R * 1.35, R * 0.22, R * 0.1), T.red, lw * 0.8);
    } else if (look === "perm") {
      [-0.75, -0.35, 0.05, 0.45, 0.8].forEach(function (d, i) { solid(c, ell(x + d * R, y - R * (0.85 - (i % 2) * 0.1), R * 0.32, R * 0.3), T.red, lw * 0.7); });
    } else if (look === "bun") {
      solid(c, ell(x, y - R * 1.15, R * 0.42, R * 0.36), T.ink, lw * 0.6, T.paper);
      var hair = new Path2D(); hair.ellipse(x, y - R * 0.3, R * 0.98, R * 0.72, 0, Math.PI, 0); hair.closePath();
      solid(c, hair, T.ink, lw * 0.6, T.paper);
    } else if (look === "beanie") {
      var bn = new Path2D(); bn.ellipse(x, y - R * 0.4, R * 0.98, R * 0.78, 0, Math.PI, 0); bn.closePath();
      solid(c, bn, T.accent, lw);
      solid(c, rr(x - R * 1.0, y - R * 0.5, R * 2.0, R * 0.32, R * 0.1), T.accent, lw * 0.8);
      solid(c, ell(x, y - R * 1.2, R * 0.2, R * 0.2), T.paper, lw * 0.6);
    } else if (look === "specs") {
      [-1, 1].forEach(function (s) { c.beginPath(); c.arc(x + s * R * 0.35, y + R * 0.02, R * 0.28, 0, 7); ink(c, lw * 0.9); c.stroke(); });
      line(c, [[x - R * 0.08, y], [x + R * 0.08, y]], lw * 0.8);
      var sp = new Path2D(); sp.ellipse(x, y - R * 0.55, R * 0.9, R * 0.42, 0, Math.PI, 0); sp.closePath();
      solid(c, sp, T.ink, lw * 0.6, T.paper);
    } else if (look === "tache") {
      solid(c, ell(x, y + R * 0.4, R * 0.42, R * 0.13), T.ink, 0);
      var fc = new Path2D(); fc.ellipse(x, y - R * 0.5, R * 1.05, R * 0.45, 0, Math.PI, 0); fc.closePath();
      solid(c, fc, T.paper, lw);
      shade(c, fc, null, R * 0.14, T.ink, 0.3);
      solid(c, rr(x - R * 1.1, y - R * 0.55, R * 2.2, R * 0.2, R * 0.08), T.paper, lw * 0.8);
    } else if (look === "scarf") {
      // and a bobble hat
      var bh = new Path2D(); bh.ellipse(x, y - R * 0.45, R * 0.95, R * 0.72, 0, Math.PI, 0); bh.closePath();
      solid(c, bh, T.paper, lw);
      c.save(); c.clip(bh); c.fillStyle = T.red; c.fillRect(x - R, y - R * 0.9, R * 2, R * 0.2); c.restore();
      ink(c, lw); c.stroke(bh);
      solid(c, ell(x, y - R * 1.2, R * 0.22, R * 0.22), T.red, lw * 0.6);
    }
  }

  // ---------------------------------------------------------------------------
  // The doorsteps, in CSS pixels, inside a box (x, y, w, h). task: { type,
  // options, at (the one showing), slide (0..1 between doors, photo), done,
  // wrong, door number }. Returns the box of each option, for the pointer.
  // ---------------------------------------------------------------------------
  function frontDoor(c, x, y, w, h, no, open, back) {
    // the frame, the door, the number, a letterbox and a step
    solid(c, box(x - w * 0.08, y - h * 0.05, w * 1.16, h * 1.05), T.paper, 2);
    shade(c, box(x - w * 0.08, y - h * 0.05, w * 1.16, h * 1.05), null, 5, T.ink, 0.2);
    if (open) {
      solid(c, box(x, y, w, h), T.ink, 2);
      var d = poly([[x, y], [x + w * 0.28, y + h * 0.04], [x + w * 0.28, y + h * 0.96], [x, y + h]]);
      solid(c, d, back ? T.paper : T.accent, 2);
    } else {
      var dp = box(x, y, w, h);
      solid(c, dp, back ? T.paper : T.accent, 2);
      line(c, [[x + w * 0.18, y + h * 0.12], [x + w * 0.82, y + h * 0.12], [x + w * 0.82, y + h * 0.45], [x + w * 0.18, y + h * 0.45], [x + w * 0.18, y + h * 0.12]], 1.5);
      solid(c, box(x + w * 0.28, y + h * 0.58, w * 0.44, h * 0.07), T.ink, 0);
      solid(c, ell(x + w * 0.83, y + h * 0.58, w * 0.05, w * 0.05), T.paper, 1.4);
      if (no != null) {
        solid(c, rr(x + w * 0.3, y + h * 0.2, w * 0.4, h * 0.17, 3), T.paper, 1.5);
        text(c, String(no), x + w / 2, y + h * 0.29, Math.min(h * 0.12, w * 0.2), { colour: T.ink });
      }
    }
    solid(c, box(x - w * 0.14, y + h, w * 1.28, h * 0.06), T.paper, 2);
  }

  function doorbell(c, x, y, s, lit) {
    solid(c, rr(x - s * 0.45, y - s * 0.7, s * 0.9, s * 1.4, s * 0.15), T.paper, 2);
    solid(c, ell(x, y, s * 0.26, s * 0.26), lit ? T.accent : T.ink, 2);
  }

  // A letterbox: a plate, a slot, a flap; on, it's open and shouting
  function letterbox(c, cx, cy, s, on) {
    var w = s * 0.95, h = s * 0.42;
    solid(c, rr(cx - w / 2, cy - h / 2, w, h, s * 0.08), T.paper, 2.2);
    solid(c, rr(cx - w * 0.38, cy - h * 0.16, w * 0.76, h * 0.32, s * 0.04), T.ink, 0);
    if (on) {
      solid(c, poly([[cx - w * 0.38, cy - h * 0.16], [cx + w * 0.38, cy - h * 0.16], [cx + w * 0.34, cy - h * 0.62], [cx - w * 0.34, cy - h * 0.62]]), T.paper, 2);
      [-1, 0, 1].forEach(function (k) { line(c, [[cx + k * w * 0.22, cy + h * 0.35], [cx + k * w * 0.36, cy + h * 0.85]], 2.2); });
    }
  }

  // ---------------------------------------------------------------------------
  // A resident at the door, full height: the head and look from person(),
  // a cardigan or a gown, tube arms with mittens, legs, slippers. Feet on
  // (x, y), h tall, CSS pixels. o: { pose: hips | wave | shout | baby,
  //   shout (0..1), awake (the baby), look (eyes), brows }
  // ---------------------------------------------------------------------------
  function resident(c, x, y, h, look, o) {
    o = o || {};
    var R = h * 0.125, lw = Math.max(2, R * 0.1);
    var hy = y - h + R * 1.05;
    var shY = hy + R * 1.45, hipY = shY + h * 0.36;
    var top = look === "scarf" || look === "baby" ? T.red : look === "gown" || look === "curlers" ? T.accent : T.paper;
    var pose = o.pose || "hips";
    var baby = look === "baby";
    if (pose === "baby") pose = "hips";
    function arm(pts, flip) {
      line(c, pts, R * 0.62, T.ink);
      line(c, pts, R * 0.62 - lw * 2, top);
      var p = pts[pts.length - 1];
      mitten(c, p[0], p[1], R * 0.36, T.paper, flip, lw);
    }
    // legs and slippers
    [-1, 1].forEach(function (s) {
      var lx = x + s * R * 0.5;
      line(c, [[lx, hipY - R * 0.2], [lx + s * R * 0.08, y - R * 0.35]], R * 0.55, T.ink);
      line(c, [[lx, hipY - R * 0.2], [lx + s * R * 0.08, y - R * 0.35]], R * 0.55 - lw * 2, T.paper);
      solid(c, ell(lx + s * R * 0.22, y - R * 0.2, R * 0.5, R * 0.26), T.red, lw);
    });
    // the body: a cardigan, or a gown with a belt
    var body = new Path2D();
    body.moveTo(x - R * 1.15, shY - R * 0.1);
    body.lineTo(x + R * 1.15, shY - R * 0.1);
    body.lineTo(x + R * 1.35, hipY + R * 0.3);
    body.lineTo(x - R * 1.35, hipY + R * 0.3);
    body.closePath();
    solid(c, body, top, lw);
    if (top === T.paper) shade(c, body, box(x + R * 0.4, shY - R, R * 1.5, h), R * 0.16, T.ink);
    line(c, [[x, shY + R * 0.3], [x, hipY + R * 0.25]], lw * 0.8);
    if (top === T.accent) line(c, [[x - R * 1.25, hipY - R * 0.5], [x + R * 1.25, hipY - R * 0.5]], lw * 2.2, T.paper);
    // the arm at the back first
    var L0 = [x - R * 1.0, shY + R * 0.2], R0 = [x + R * 1.0, shY + R * 0.2];
    if (baby) { /* the arm goes round the baby, below */ }
    else if (pose === "shout") arm([L0, [x - R * 1.9, shY - R * 0.4], [x - R * 1.6, hy - R * 1.0]], false);
    else arm([L0, [x - R * 2.0, shY + R * 1.3], [x - R * 1.25, hipY - R * 0.15]], false);
    // the head and the one thing each (the baby goes on the hip, not the sling)
    person(c, x, hy, R, look === "baby" ? "curlers" : look, { shout: o.shout || 0, brows: o.brows, look: o.look || 0, smile: o.smile });
    if (baby) {
      // on the hip: the body, the arm round it, then the head over the arm
      var bx = x - R * 1.5, by = hipY - R * 1.05;
      solid(c, ell(bx, by + R * 0.5, R * 0.75, R * 0.68), T.paper, lw);
      shade(c, ell(bx, by + R * 0.5, R * 0.75, R * 0.68), null, R * 0.18, T.ink);
      arm([L0, [x - R * 2.0, shY + R * 1.2], [x - R * 0.85, hipY + R * 0.05]], false);
      solid(c, ell(bx - R * 0.15, by - R * 0.45, R * 0.62, R * 0.58), T.paper, lw);
      if (o.awake) {
        solid(c, ell(bx - R * 0.15, by - R * 0.28, R * 0.22, R * 0.17), T.ink, 0);
        line(c, [[bx - R * 0.43, by - R * 0.62], [bx - R * 0.25, by - R * 0.54]], lw);
        line(c, [[bx + R * 0.13, by - R * 0.62], [bx - R * 0.05, by - R * 0.54]], lw);
      } else {
        c.beginPath(); c.arc(bx - R * 0.35, by - R * 0.52, R * 0.12, 0.2, Math.PI - 0.2); ink(c, lw * 0.8); c.stroke();
        c.beginPath(); c.arc(bx + R * 0.05, by - R * 0.52, R * 0.12, 0.2, Math.PI - 0.2); c.stroke();
      }
    }
    // the arm at the front
    if (pose === "wave") arm([R0, [x + R * 2.0, shY - R * 0.3], [x + R * 2.2, hy - R * 1.1]], true);
    else if (pose === "shout") arm([R0, [x + R * 1.5, shY + R * 0.3], [x + R * 0.85, hy + R * 0.6]], true);
    else arm([R0, [x + R * 2.0, shY + R * 1.3], [x + R * 1.25, hipY - R * 0.15]], true);
  }

  window.LeaveArt = {
    init: init, dots: dots, ink: ink, rr: rr, box: box, ell: ell, poly: poly, solid: solid, shade: shade, line: line,
    text: text, measure: measure, wrap: wrap, face: face, mitten: mitten, bubble: bubble, arrow: arrow, brackets: brackets,
    bakeTown: bakeTown, car: car, rider: rider, logo: logo, pin: pin, person: person, LOOKS: LOOKS, icon: icon,
    frontDoor: frontDoor, doorbell: doorbell, tree: tree, puddle: puddle, helmet: helmet,
    letterbox: letterbox, resident: resident
  };
})();
