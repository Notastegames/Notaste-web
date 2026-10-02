// Heavy Traffic: a tiny kart and the very large person on it, drawn from any
// angle. The model is a handful of shapes in the kart's own space (x forward,
// y to the right, z up): boxes for the car, discs for the wheels, ovals for
// the driver. Each is projected through the chase camera and drawn flat with
// a black outline and halftone shading, like the cover art.
//
// The joke is the fit: the driver is twice the width of the car, spills over
// both sides, wobbles on its own springs and squashes the suspension flat.
(function () {
  "use strict";

  var HT = window.HeavyTraffic = window.HeavyTraffic || {};

  // Halftone dot patterns, made once per colour
  var dotCache = {};
  function dots(c, colour, r, step) {
    var key = colour + r + step;
    if (dotCache[key]) return dotCache[key];
    var tile = document.createElement("canvas");
    tile.width = tile.height = step * 2;
    var t = tile.getContext("2d");
    t.fillStyle = colour;
    [[step / 2, step / 2], [step * 1.5, step * 1.5]].forEach(function (p) {
      t.beginPath();
      t.arc(p[0], p[1], r, 0, Math.PI * 2);
      t.fill();
    });
    dotCache[key] = c.createPattern(tile, "repeat");
    return dotCache[key];
  }

  // Where a kart sits on screen, and how big. Null when behind the camera.
  HT.placeOnScreen = function (view, x, y, z) {
    var dx = x - view.x, dy = y - view.y;
    var depth = dx * view.fx + dy * view.fy;
    if (depth < 10) return null;
    var lat = dx * -view.fy + dy * view.fx;
    var s = view.f / depth;
    return { x: view.cx + lat * s, y: view.horizon + (view.h - (z || 0)) * s, s: s, depth: depth, lat: lat };
  };

  // k: the kart (position, heading, lean and the rest of its state from race.js)
  // look: { car, shirt, shirtDots, pants }: colours for this driver
  // T: colour tokens. dpr: device pixel ratio of the canvas.
  HT.drawKart = function (c, k, view, look, T, dpr) {
    var at = HT.placeOnScreen(view, k.x, k.y, 0);
    if (!at) return;
    var s = at.s, depth = at.depth, lat = at.lat;
    var ca = Math.cos(k.a), sa = Math.sin(k.a);

    // How a step along the kart's own axes moves on screen (the projection's
    // slope at the kart, about chest height). Good enough at sprite size.
    var zc = 12 + k.z;
    var gx = [s * (-view.fy - lat / depth * view.fx), s * (view.fx - lat / depth * view.fy)];
    var gy = [-(view.h - zc) * s / depth * view.fx, -(view.h - zc) * s / depth * view.fy];
    var A0 = gx[0] * ca + gx[1] * sa, A1 = gx[0] * -sa + gx[1] * ca;
    var A3 = gy[0] * ca + gy[1] * sa, A4 = gy[0] * -sa + gy[1] * ca;
    var A5 = -s;
    var ox = at.x, oy = at.y - k.z * s;

    // two-wheeling rolls the whole thing about its long axis
    var roll = k.roll || 0, cr = Math.cos(roll), sr = Math.sin(roll);
    // for "can the camera see this side": the direction from the kart to the camera
    var toCam = [-(k.x - view.x), -(k.y - view.y), view.h - zc];

    function rolled(p) { return [p[0], p[1] * cr - p[2] * sr, p[1] * sr + p[2] * cr]; }
    function P(p) {
      var q = rolled(p);
      return [ox + A0 * q[0] + A1 * q[1], oy + A3 * q[0] + A4 * q[1] + A5 * q[2]];
    }
    function V(v) {
      var q = rolled(v);
      return [A0 * q[0] + A1 * q[1], A3 * q[0] + A4 * q[1] + A5 * q[2]];
    }
    function depthOf(p) {
      var q = rolled(p);
      return (q[0] * ca - q[1] * sa) * view.fx + (q[0] * sa + q[1] * ca) * view.fy;
    }
    function facing(n) {
      var q = rolled(n);
      var wx = q[0] * ca - q[1] * sa, wy = q[0] * sa + q[1] * ca;
      return wx * toCam[0] + wy * toCam[1] + q[2] * toCam[2] > 0;
    }

    var line = Math.max(1, Math.min(5, s * 0.75));
    function xf(a, b, cc, d, e, f) { c.setTransform(dpr * a, dpr * b, dpr * cc, dpr * d, dpr * e, dpr * f); }
    function reset() { c.setTransform(dpr, 0, 0, dpr, 0, 0); }
    function edgeFor(fill) { return fill === T.ink ? T.paper : T.ink; }
    function finish(fill, edge) {
      reset();
      c.fillStyle = fill;
      c.fill();
      c.lineWidth = line;
      c.strokeStyle = edge || edgeFor(fill);
      c.stroke();
    }

    // an oval: the projected outline of an ellipsoid with radii r
    function ovalPath(cen, r) {
      var bx = V([r[0], 0, 0]), by = V([0, r[1], 0]), bz = V([0, 0, r[2]]);
      var c00 = bx[0] * bx[0] + by[0] * by[0] + bz[0] * bz[0];
      var c01 = bx[0] * bx[1] + by[0] * by[1] + bz[0] * bz[1];
      var c11 = bx[1] * bx[1] + by[1] * by[1] + bz[1] * bz[1];
      var a = Math.sqrt(c00), b = c01 / a, d = Math.sqrt(Math.max(1e-4, c11 - b * b));
      var p = P(cen);
      return { a: a, b: b, d: d, x: p[0], y: p[1] };
    }
    function trace(o, grow, dx, dy) {
      xf(o.a * grow, o.b * grow, 0, o.d * grow, o.x + (dx || 0), o.y + (dy || 0));
      c.arc(0, 0, 1, 0, Math.PI * 2);
    }
    function oval(cen, r, fill, opts) {
      opts = opts || {};
      var o = ovalPath(cen, r);
      c.beginPath();
      trace(o, 1);
      reset();
      c.fillStyle = fill;
      c.fill();
      if (opts.dots) { c.fillStyle = dots(c, T.ink, 1.3, 4); c.fill(); }
      if (opts.shade !== false) {
        // halftone in the crescent away from the light (top left)
        c.save();
        c.beginPath();
        trace(o, 1);
        reset();
        c.clip();
        c.beginPath();
        trace(o, 1.02);
        trace(o, 0.98, -o.a * 0.2, -o.d * 0.22);
        reset();
        c.fillStyle = dots(c, fill === T.ink ? T.ash : T.ink, 1.2, 5);
        c.fill("evenodd");
        c.restore();
      }
      c.beginPath();
      trace(o, 1);
      reset();
      c.lineWidth = line;
      c.strokeStyle = opts.edge || edgeFor(fill);
      c.stroke();
    }
    function disc(cen, u, v, fill, edge) {
      var su = V(u), sv = V(v), p = P(cen);
      c.beginPath();
      xf(su[0], su[1], sv[0], sv[1], p[0], p[1]);
      c.arc(0, 0, 1, 0, Math.PI * 2);
      finish(fill, edge);
    }
    // a box, showing only the faces turned towards the camera
    function box(cen, half, fill) {
      var faces = [
        [[1, 0, 0], [[1, -1, -1], [1, 1, -1], [1, 1, 1], [1, -1, 1]]],
        [[-1, 0, 0], [[-1, -1, -1], [-1, 1, -1], [-1, 1, 1], [-1, -1, 1]]],
        [[0, 1, 0], [[-1, 1, -1], [1, 1, -1], [1, 1, 1], [-1, 1, 1]]],
        [[0, -1, 0], [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]]],
        [[0, 0, 1], [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]]]
      ];
      faces.forEach(function (f) {
        if (!facing(f[0])) return;
        c.beginPath();
        f[1].forEach(function (k3, i) {
          var p = P([cen[0] + k3[0] * half[0], cen[1] + k3[1] * half[1], cen[2] + k3[2] * half[2]]);
          if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]);
        });
        c.closePath();
        reset();
        c.fillStyle = fill;
        c.fill();
        if (f[0][2] === 0 && fill !== T.ink) {
          // sides in shade
          c.fillStyle = dots(c, T.ink, 1.2, 5);
          c.fill();
        }
        c.lineJoin = "round";
        c.lineWidth = line;
        c.strokeStyle = edgeFor(fill);
        c.stroke();
      });
    }
    function stroke3(points, width, colour) {
      c.beginPath();
      points.forEach(function (p, i) {
        var q = P(p);
        if (i) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]);
      });
      reset();
      c.lineCap = "round";
      c.lineJoin = "round";
      c.lineWidth = width;
      c.strokeStyle = colour;
      c.stroke();
    }

    var jig = k.jig || { uy: 0, uz: 0, ly: 0, lz: 0 };
    var sag = 1 + Math.max(0, -jig.lz) * 0.5;      // squashed further on the bumps
    var camber = 0.22 + Math.min(0.25, Math.abs(jig.lz) * 0.15);

    // the shadow, on the ground under the hop
    var alpha = c.globalAlpha;   // the caller may be fading this kart into the distance
    c.globalAlpha = alpha * 0.5 / (1 + k.z / 30);
    disc([-1, 0, -k.z], [16, 0, 0], [0, 19, 0], T.ink, T.ink);
    c.globalAlpha = alpha;

    // ---------- the car ----------
    var wheels = [[7.8, -6.6], [7.8, 6.6], [-7.8, -6.6], [-7.8, 6.6]];
    var car = [];
    wheels.forEach(function (w, i) {
      var side = w[1] > 0 ? 1 : -1;
      if (k.wheelOff > 0 && i < 2 && side === k.wheelSide) return;
      car.push({ depth: depthOf([w[0], w[1], 3]), draw: function () {
        var cen = [w[0], w[1] + side * 1.2, 3.1];
        var steer = i < 2 ? (k.steer || 0) * 0.45 : 0;
        var u = [3.3 * Math.cos(steer), 3.3 * Math.sin(steer), 0];
        var v = [0, side * Math.sin(camber) * 2.9, Math.cos(camber) * 2.8];   // splayed and flattened
        disc(cen, u, v, T.ink, T.paper);
        disc([cen[0], cen[1] + side * 0.2, cen[2]], [u[0] * 0.42, u[1] * 0.42, 0], [v[0] * 0.42, v[1] * 0.42, v[2] * 0.42], T.paper, T.ink);
      } });
    });
    var chassisZ = 3.5 - 0.9 * (sag - 1);
    car.push({ depth: depthOf([0, 0, 2]), draw: function () {
      box([0, 0, chassisZ], [10.6, 5.6, 2.4], look.car);
      if (facing([-1, 0, 0])) {
        // a number plate on the back: TNY, for tiny
        var plate = [[-10.7, -2.6, chassisZ - 1.1], [-10.7, 2.6, chassisZ - 1.1], [-10.7, 2.6, chassisZ + 0.9], [-10.7, -2.6, chassisZ + 0.9]];
        c.beginPath();
        plate.forEach(function (pt, i) { var q = P(pt); if (i) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); });
        c.closePath();
        finish(T.paper, T.ink);
        if (s > 2.2) {
          var mid = P([-10.75, 0, chassisZ - 0.1]);
          c.fillStyle = T.ink;
          c.font = (s * 1.7) + "px " + T.display;
          c.textAlign = "center";
          c.textBaseline = "middle";
          c.fillText("TNY", mid[0], mid[1]);
        }
      }
    } });
    car.push({ depth: depthOf([12, 0, 2]), draw: function () { box([12.2, 0, chassisZ - 0.5], [1.6, 4.4, 1.7], T.paper); } });
    car.sort(function (a, b) { return b.depth - a.depth; });
    car.forEach(function (p) { p.draw(); });

    // ---------- the driver ----------
    // trousers spilling over the seat, a strip of bare back where the shirt
    // has ridden up, the shirt, and a small head on top
    var pantsC = [-2.2, jig.ly * 2.2, 10.6 + jig.lz * 0.9];
    var pantsR = [9.6, 16 * (1 + jig.lz * 0.05), 5 * (1 - jig.lz * 0.05)];
    var bandC = [-2, jig.uy * 1.5 + jig.ly * 1, 15 + jig.uz * 0.5];
    var bandR = [9.8, 14.8, 2.6];
    var shirtC = [-1.2, jig.uy * 2.8, 23 + jig.uz * 1.1];
    var shirtR = [11, 14.4 * (1 + jig.uz * 0.04), 8.4 * (1 - jig.uz * 0.04)];
    var headC = [0.4, jig.uy * 3.6, 34.4 + jig.uz * 1.3];
    var bodyDepth = depthOf(shirtC);
    var backShowing = facing([-1, 0, 0]);

    var arms = [-1, 1].map(function (side) {
      return {
        side: side,
        depth: depthOf([3, side * 13.6, 22]),
        draw: function () {
          var sway = jig.uy * 2.4;
          oval([3, side * 13.6 + sway, 22.4 + jig.uz], [7.4, 5, 4.9], T.paper);
          oval([9, side * 6, 17.6], [2.5, 2.3, 2.3], T.paper, { shade: false });
        }
      };
    });
    arms.forEach(function (a) { if (a.depth > bodyDepth) a.draw(); });

    oval(pantsC, pantsR, look.pants);
    oval(bandC, bandR, T.paper, { shade: false });
    if (backShowing) {
      // the waistband has given up as well: a short dark line on the bare strip
      var cy = bandC[1];
      stroke3([[-11.6, cy, bandC[2] - 1.4], [-11.9, cy - 0.15, bandC[2] - 0.2], [-11.8, cy, bandC[2] + 1]], Math.max(1.4, line * 1.2), T.ink);
    }
    oval(shirtC, shirtR, look.shirt, { dots: look.shirtDots });
    arms.forEach(function (a) { if (a.depth <= bodyDepth) a.draw(); });

    if (backShowing) {
      // the back of the neck
      [[-4.2, 29.6], [-4.7, 28.4]].forEach(function (r) {
        stroke3([[r[0], headC[1] - 3, r[1]], [r[0] - 0.4, headC[1], r[1] - 0.4], [r[0], headC[1] + 3, r[1]]], Math.max(1, line * 0.7), T.ink);
      });
    }

    // helmet: white, a red stripe over the top, a black visor at the front
    oval(headC, [5.4, 5.4, 5.4], T.paper, { shade: true });
    var stripe = [], seg = [];
    for (var t = -0.2; t <= Math.PI + 0.2; t += 0.12) {
      var n = [Math.cos(t), 0, Math.sin(t)];
      var p = [headC[0] + n[0] * 5.3, headC[1], headC[2] + n[2] * 5.3];
      if (facing(n)) seg.push(p);
      else if (seg.length) { stripe.push(seg); seg = []; }
    }
    if (seg.length) stripe.push(seg);
    stripe.forEach(function (sg) { if (sg.length > 1) stroke3(sg, Math.max(1.5, s * 2.2), T.red); });
    if (facing([1, 0, 0.1])) {
      disc([headC[0] + 4.3, headC[1], headC[2] - 0.4], [0, 3.9, 0], [0, 0, 2.2], T.ink, T.ink);
    }
    reset();
  };
})();
