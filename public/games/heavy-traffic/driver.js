// Heavy Traffic: a tiny kart and the very large person on it, drawn from any
// angle, cut-out cartoon style: a round body, a big round head with no neck,
// a furious face and a hat or hairdo each. The model is a handful of shapes in the kart's own space (x forward,
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
    var bodyDepth = depthOf(shirtC);
    var backShowing = facing([-1, 0, 0]);

    var arms = [-1, 1].map(function (side) {
      return {
        side: side,
        depth: depthOf([3, side * 13.6, 22]),
        draw: function () {
          if (k.speech && k.speech.t > 0 && k.spin <= 0 && side === (k.shoutSide || 1)) return;   // it's up in the air
          var sway = jig.uy * 2.4;
          oval([3, side * 13.6 + sway, 22.4 + jig.uz], [7.4, 5, 4.9], T.paper);
          oval([9, side * 6, 17.6], [2.8, 2.6, 2.6], T.paper, { shade: false });   // mittens
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

    // ---------- the head ----------
    // Big, round and sitting straight on the shoulders: no neck to speak of.
    // It turns to glare at whoever it's shouting at (k.headTurn, radians from
    // straight ahead) and pulls a face: a glare, a shout, or dizzy in a spin.
    var hr = [8.4, 10.2, 8.8];
    var hC = [0.6, jig.uy * 3.4, 31.4 + jig.uz * 1.3];
    var turn = k.headTurn || 0, ct = Math.cos(turn), st = Math.sin(turn);
    var face = k.spin > 0 ? "dizzy" : k.speech && k.speech.t > 0 ? "shout" : "glare";
    var anim = k.anim || 0;
    function dir(theta, phi) {
      var x = Math.cos(phi) * Math.cos(theta), y = Math.cos(phi) * Math.sin(theta);
      return [x * ct - y * st, x * st + y * ct, Math.sin(phi)];
    }
    // a point on the head: theta around from the face, phi up from the eyes
    function onHead(theta, phi, out) {
      var x = Math.cos(phi) * Math.cos(theta) * hr[0] * out, y = Math.cos(phi) * Math.sin(theta) * hr[1] * out;
      return [hC[0] + x * ct - y * st, hC[1] + x * st + y * ct, hC[2] + Math.sin(phi) * hr[2] * out];
    }
    // a flat shape lying on the head's surface: an eye, a mouth
    function patch(theta, phi, w, h, fill, edge) {
      if (!facing(dir(theta, phi))) return;
      var a = theta + turn;
      var along = [-Math.sin(a) * w, Math.cos(a) * w, 0];
      var up = [-Math.sin(phi) * Math.cos(a) * h, -Math.sin(phi) * Math.sin(a) * h, Math.cos(phi) * h];
      disc(onHead(theta, phi, 1.02), along, up, fill, edge);
    }
    // a line drawn over the head, showing only the parts turned towards us
    function lineOn(points, width, colour, out) {
      var seg = [], all = [];
      points.forEach(function (tp) {
        if (facing(dir(tp[0], tp[1]))) seg.push(onHead(tp[0], tp[1], out || 1.02));
        else if (seg.length) { all.push(seg); seg = []; }
      });
      if (seg.length) all.push(seg);
      all.forEach(function (sg) { if (sg.length > 1) stroke3(sg, width, colour); });
    }
    function arc(t0, t1, p0, pMid, n) {
      var pts = [];
      for (var i = 0; i <= n; i++) {
        var f = i / n, t = t0 + (t1 - t0) * f;
        pts.push([t, p0 + (pMid - p0) * (1 - Math.pow(2 * f - 1, 2))]);
      }
      return pts;
    }
    var thick = Math.max(1.4, line * 1.4);

    // ears, then the head over them
    [-1, 1].forEach(function (side) { oval(onHead(side * 1.5, 0.02, 0.92), [1.6, 1.5, 2.6], T.paper, { shade: false }); });
    var hat = look.hat;
    if (hat === "cap") {
      // worn backwards, so you can read it from behind
      var bx = -Math.cos(turn), by = -Math.sin(turn);
      var brimC = [hC[0] + bx * (hr[0] + 1.6), hC[1] + by * (hr[0] + 1.6), hC[2] + 3.6];
      disc(brimC, [bx * 4.6, by * 4.6, 0], [-by * 6.4, bx * 6.4, 0], look.hatColour);
    }
    oval(hC, hr, T.paper, { shade: false });

    // the face
    if (facing(dir(0, 0.1))) {
      [-1, 1].forEach(function (side) {
        patch(side * 0.3, 0.16, 2.3, 2.8, T.paper, T.ink);
        if (face === "dizzy") {
          var e = 0.09;
          lineOn([[side * 0.3 - e, 0.16 + e], [side * 0.3 + e, 0.16 - e]], thick * 0.8, T.ink, 1.04);
          lineOn([[side * 0.3 - e, 0.16 - e], [side * 0.3 + e, 0.16 + e]], thick * 0.8, T.ink, 1.04);
        } else {
          patch(side * 0.24, 0.12, 0.8, 0.95, T.ink, T.ink);                 // squinting inwards
        }
        // eyebrows: down at the middle, furious at all times
        lineOn([[side * 0.08, 0.38], [side * 0.3, 0.46], [side * 0.52, 0.56]], thick * 1.3, T.ink);
      });
      if (face === "shout") {
        patch(0, -0.3, 2.5, 1.7 + Math.abs(Math.sin(anim * 24)) * 0.7, T.ink, T.ink);
        patch(0, -0.38, 1.3, 0.55, T.red, T.red);
      } else if (face === "dizzy") {
        lineOn([[-0.26, -0.3], [-0.13, -0.24], [0, -0.32], [0.13, -0.24], [0.26, -0.3]], thick * 0.9, T.ink);
      } else {
        lineOn(arc(-0.26, 0.26, -0.33, -0.25, 6), thick, T.ink);               // a frown
      }
      lineOn(arc(-0.42, 0.42, -0.6, -0.68, 8), thick * 0.8, T.ink);            // the second chin
      if (look.tache) patch(0, -0.14, 3.4, 1.1, T.ink, T.ink);
    }

    // hats and hair
    if (hat === "cap") {
      oval([hC[0] - 0.4, hC[1], hC[2] + 5.4], [hr[0] * 0.95, hr[1] * 0.93, 4.4], look.hatColour);
      oval([hC[0] - 0.4, hC[1], hC[2] + 9.6], [1, 1, 0.8], look.hatColour, { shade: false });
    } else if (hat === "flatcap") {
      var fx = Math.cos(turn), fy = Math.sin(turn);
      disc([hC[0] + fx * (hr[0] + 0.8), hC[1] + fy * (hr[0] + 0.8), hC[2] + 4.6], [fx * 3.4, fy * 3.4, 0], [-fy * 7, fx * 7, 0], look.hatColour);
      oval([hC[0] + 0.6, hC[1], hC[2] + 5.2], [hr[0] * 1.04, hr[1] * 1.0, 3.2], look.hatColour);
    } else if (hat === "perm") {
      // a perm, set weekly, never touched by rain
      var curls = [];
      [0.7, 1.3, 1.9, 2.5, Math.PI, -2.5, -1.9, -1.3, -0.7].forEach(function (t) { curls.push([t, 0.42]); });
      [0.4, 1.4, 2.4, -2.4, -1.4, -0.4].forEach(function (t) { curls.push([t, 0.85]); });
      curls.push([0, 1.4]);
      curls.map(function (tp) { return { p: onHead(tp[0], tp[1], 1.0), d: depthOf(onHead(tp[0], tp[1], 1.0)) }; })
        .sort(function (a, b) { return b.d - a.d; })
        .forEach(function (cu) { oval(cu.p, [3.4, 3.4, 3.2], look.hatColour, { shade: false }); });
    } else if (hat === "band") {
      // bald, with a sweatband and three loyal hairs
      var band = [];
      for (var t = -Math.PI; t <= Math.PI + 0.01; t += 0.2) band.push([t, 0.42]);
      lineOn(band, Math.max(2, s * 2.4), look.hatColour, 1.03);
      [-0.5, 0, 0.5].forEach(function (o) {
        lineOn([[-1.3, 0.95 + o * 0.1], [0, 1.1 + o * 0.12], [1.3, 0.95 + o * 0.1]], Math.max(1, line * 0.6), T.ink, 1.03);
      });
    }

    // from behind: the back of the neck, such as it is
    if (facing(dir(Math.PI, -0.5))) {
      lineOn(arc(Math.PI - 0.5, Math.PI + 0.5, -0.62, -0.55, 6), Math.max(1, line * 0.8), T.ink);
      lineOn(arc(Math.PI - 0.4, Math.PI + 0.4, -0.78, -0.72, 6), Math.max(1, line * 0.8), T.ink);
    }

    // a fist, raised at whoever they're shouting at
    if (face === "shout") {
      var side = k.shoutSide || 1;
      var shake = Math.sin(anim * 30) * 1.2;
      oval([1.5, side * 13.4, 33], [3.6, 3.4, 6.4], T.paper);
      oval([1.5 + shake * 0.3, side * 14, 41 + shake], [3.2, 3.2, 3.2], T.paper, { shade: false });
    }

    // seeing stars
    if (face === "dizzy") {
      for (var i = 0; i < 3; i++) {
        var ang = anim * 7 + i * 2.1;
        var sc = [hC[0] + Math.cos(ang) * 10, hC[1] + Math.sin(ang) * 10, hC[2] + 12];
        stroke3([[sc[0] - 1.6, sc[1], sc[2]], [sc[0] + 1.6, sc[1], sc[2]]], Math.max(1.2, line * 0.8), T.paper);
        stroke3([[sc[0], sc[1], sc[2] - 1.6], [sc[0], sc[1], sc[2] + 1.6]], Math.max(1.2, line * 0.8), T.paper);
      }
    }
    reset();
  };
})();
