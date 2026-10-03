// Reply All: the office, drawn in code. The workers, their desks, the server,
// and everything that flies about between them.
//
// Every desk is drawn in its own local units: a box 100 wide and 76 tall,
// with the worker's head at (40, 29) and the top edge of the desk at y 58.
// reply-all.js scales that box to fit the grid. The parts that never change
// (a worker's body and hat, a desk with its monitor and mug) are cached as
// little bitmaps; faces, arms and hands are drawn live, because they move.
//
// The workers are the house cut-out cartoons (DESIGN.md, section 7): a round
// body, a big round head with no neck, white skin, oval eyes with small
// pupils, furious eyebrows, a frown, a second chin and mitten hands. Each one
// wears one thing that tells them apart. Outline first, flat fill, four inks:
// ink, paper, red and the sky accent. Grey is only ever halftone dots on white.
(function () {
  "use strict";

  var T = null;         // colour tokens
  var S = 1;            // device pixels per local unit
  var cache = {};
  var dotTile = null, pxTile = null, lightTile = null;
  var HX = 40, HY = 29, HR = 13.5;     // the head, as drawn
  var HS = 1.25, HDY = 1.5;            // ...then scaled up a quarter (and down a touch) so faces read on a phone
  var TAU = Math.PI * 2;
  var GAP = 0.32;                      // the space between words, in ems (see text())

  function init(tokens, scale) {
    T = tokens;
    if (Math.abs(scale - S) > 0.001) { cache = {}; dotTile = null; lightTile = null; }
    S = scale;
  }
  function flush() { cache = {}; dotTile = null; pxTile = null; lightTile = null; }

  function ink(name) { return T[name] || name; }
  function edgeFor(fill) { return fill === T.ink ? T.paper : T.ink; }

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
    c.ellipse(x, y, rx, ry, rot || 0, 0, TAU);
  }
  function rr(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }
  function fill(c, colour, w, edge) {
    c.fillStyle = colour;
    c.fill();
    if (w) { pen(c, w, edge || edgeFor(colour)); c.stroke(); }
  }
  function stroke(c, w, colour) { pen(c, w, colour); c.stroke(); }

  // Black halftone dots, sized in device pixels whatever the drawing scale
  function shade(c) {
    if (!dotTile) {
      var n = Math.max(3, Math.round(2.4 * S));
      dotTile = document.createElement("canvas");
      dotTile.width = dotTile.height = n;
      var x = dotTile.getContext("2d");
      x.fillStyle = T.ink;
      x.beginPath();
      x.arc(n / 2, n / 2, n * 0.25, 0, TAU);
      x.fill();
    }
    var pat = c.createPattern(dotTile, "repeat");
    if (pat.setTransform && window.DOMMatrix) pat.setTransform(new DOMMatrix().scale(1 / S));
    return pat;
  }
  // Sparser dots, for furniture: textured, not grey
  function shadeLight(c) {
    if (!lightTile) {
      var n = Math.max(4, Math.round(3.6 * S));
      lightTile = document.createElement("canvas");
      lightTile.width = lightTile.height = n;
      var x = lightTile.getContext("2d");
      x.fillStyle = T.ink;
      x.beginPath();
      x.arc(n / 2, n / 2, n * 0.19, 0, TAU);
      x.fill();
    }
    var pat = c.createPattern(lightTile, "repeat");
    if (pat.setTransform && window.DOMMatrix) pat.setTransform(new DOMMatrix().scale(1 / S));
    return pat;
  }

  // The same, for drawing in screen pixels (dpr: device pixels per CSS pixel)
  function shadePx(c, dpr) {
    if (!pxTile) {
      var n = Math.max(3, Math.round(3.2 * dpr));
      pxTile = document.createElement("canvas");
      pxTile.width = pxTile.height = n;
      var x = pxTile.getContext("2d");
      x.fillStyle = T.ink;
      x.beginPath();
      x.arc(n / 2, n / 2, n * 0.26, 0, TAU);
      x.fill();
    }
    var pat = c.createPattern(pxTile, "repeat");
    if (pat.setTransform && window.DOMMatrix) pat.setTransform(new DOMMatrix().scale(1 / dpr));
    return pat;
  }

  // Halftone in the crescent away from the light (top left), like the covers.
  // off: how far the light side shifts, as a share of the size (0.25 for a
  // body; a face gets a thin rim, so the expression stays clear)
  function crescent(c, x, y, rx, ry, off) {
    var ox = off == null ? 0.24 : off, oy = off == null ? 0.26 : off * 1.1;
    c.save();
    ell(c, x, y, rx, ry);
    c.clip();
    c.beginPath();
    c.moveTo(x + rx * 1.1, y);
    c.ellipse(x, y, rx * 1.1, ry * 1.1, 0, 0, TAU);
    c.moveTo(x - rx * ox + rx, y - ry * oy);
    c.ellipse(x - rx * ox, y - ry * oy, rx, ry, 0, 0, TAU);
    c.fillStyle = shade(c);
    c.fill("evenodd");
    c.restore();
  }

  // ---------------------------------------------------------------------------
  // The people. One thing each tells them apart (a hat, a hairdo, a tie).
  // shirt is the ink of their top; dots puts a halftone print on it.
  // ---------------------------------------------------------------------------
  var LOOKS = [
    { id: "cap", shirt: "paper", dots: true, hat: "cap", hatC: "red" },
    { id: "perm", shirt: "accent", hat: "perm", hatC: "red" },
    { id: "flatcap", shirt: "paper", hat: "flatcap", hatC: "paper", tache: true },
    { id: "band", shirt: "red", hat: "band", hatC: "accent" },
    { id: "headset", shirt: "paper", dots: true, hat: "headset", hatC: "ink" },
    { id: "glasses", shirt: "accent", hat: "parting", hatC: "ink", glasses: true },
    { id: "bun", shirt: "ink", hat: "bun", hatC: "ink" },
    { id: "quiff", shirt: "paper", hat: "quiff", hatC: "ink", collar: true },
    { id: "tie", shirt: "paper", hat: "short", hatC: "ink", tie: true, collar: true },
    { id: "party", shirt: "accent", hat: "party", hatC: "accent" },
    { id: "bobble", shirt: "red", hat: "bobble", hatC: "accent" },
    { id: "bowtie", shirt: "paper", dots: true, hat: "bald", bow: true },
    { id: "visor", shirt: "paper", hat: "visor", hatC: "accent", collar: true },
    { id: "lanyard", shirt: "ink", hat: "spiky", hatC: "ink", lanyard: true },
    { id: "pencil", shirt: "accent", hat: "messy", hatC: "ink", pencil: true },
    { id: "phones", shirt: "red", hat: "phones", hatC: "accent" }
  ];
  // The CEO's assistant: a cardigan, a neat bun with a pencil through it, a
  // headset, and the saddest face in the building
  var ASSISTANT = { id: "assistant", shirt: "accent", dots: true, hat: "neatbun", hatC: "ink", headset: true, pencil: false };

  function hairCap(c, colour, low) {
    // hair over the top of the head, clear of the eyebrows
    var a0 = Math.PI + 0.5, a1 = -0.5, R = HR + 0.6;
    var ey = HY + Math.sin(a1) * R, sx = HX + Math.cos(a0) * R;
    var mid = low ? HY - 9.5 : HY - 10.5;
    c.beginPath();
    c.arc(HX, HY, R, a0, a1);
    c.quadraticCurveTo(HX + 6, mid + 0.6, HX, mid);
    c.quadraticCurveTo(HX - 6, mid + 0.6, sx, ey);
    c.closePath();
    fill(c, colour, 1.4);
  }

  function drawHat(c, look) {
    var hc = ink(look.hatC || "ink");
    switch (look.hat) {
      case "cap": {
        // worn backwards: the dome, and the strap gap at the front
        c.beginPath();
        c.arc(HX, HY - 1, HR + 0.9, Math.PI + 0.35, -0.35);
        c.quadraticCurveTo(HX, HY - 10.5, HX - (HR + 0.9) * Math.cos(0.35), HY - 1 - (HR + 0.9) * Math.sin(0.35));
        c.closePath();
        fill(c, hc, 1.6);
        ell(c, HX, HY - 10.2, 3.2, 2.1);
        fill(c, T.paper, 1.2);
        ell(c, HX, HY - HR - 1.6, 1.6, 1.2);
        fill(c, hc, 1.1);
        break;
      }
      case "perm": {
        var curls = [];
        [-2.95, -2.6, -2.25, -1.9, -1.57, -1.24, -0.89, -0.54, -0.19].forEach(function (a) { curls.push([a, HR + 0.4, 3.9]); });
        [-2.3, -1.57, -0.84].forEach(function (a) { curls.push([a, HR - 4.6, 3.6]); });
        curls.forEach(function (q) {
          ell(c, HX + Math.cos(q[0]) * q[1], HY + Math.sin(q[0]) * q[1], q[2], q[2]);
          fill(c, hc, 1.3);
        });
        break;
      }
      case "flatcap": {
        c.beginPath();
        c.ellipse(HX, HY - 9.5, HR + 1.6, 8, 0, Math.PI, 0);
        c.closePath();
        fill(c, T.paper);
        c.fillStyle = shade(c);
        c.fill();
        stroke(c, 1.4);
        c.beginPath();
        c.ellipse(HX, HY - 9.4, HR - 0.5, 3, 0, 0, Math.PI);
        c.closePath();
        fill(c, T.paper, 1.4);
        break;
      }
      case "band": {
        // bald, a sweatband, three loyal hairs
        c.beginPath();
        c.moveTo(HX - HR + 1.2, HY - 9);
        c.quadraticCurveTo(HX, HY - 13, HX + HR - 1.2, HY - 9);
        c.lineTo(HX + HR - 0.5, HY - 5.2);
        c.quadraticCurveTo(HX, HY - 9.2, HX - HR + 0.5, HY - 5.2);
        c.closePath();
        fill(c, hc, 1.3);
        c.beginPath();
        [-2.4, 0, 2.4].forEach(function (o) {
          c.moveTo(HX + o, HY - HR + 0.4);
          c.quadraticCurveTo(HX + o + 1.6, HY - HR - 3.4, HX + o + 3, HY - HR - 2.2);
        });
        stroke(c, 1.1);
        break;
      }
      case "headset": {
        hairCap(c, T.ink);
        c.beginPath();
        c.arc(HX, HY, HR + 2, Math.PI + 0.2, -0.2);
        stroke(c, 3.4, T.ink);
        c.beginPath();
        c.arc(HX, HY, HR + 2, Math.PI + 0.2, -0.2);
        stroke(c, 1.2, T.paper);
        rr(c, HX - HR - 3.6, HY - 4.5, 5, 9.5, 2);
        fill(c, T.ink, 1.1);
        rr(c, HX + HR - 1.4, HY - 4.5, 5, 9.5, 2);
        fill(c, T.ink, 1.1);
        // the microphone, on its boom towards the mouth
        c.beginPath();
        c.moveTo(HX - HR - 1, HY + 3);
        c.quadraticCurveTo(HX - HR + 1, HY + 9.5, HX - 6.5, HY + 9.4);
        stroke(c, 3, T.ink);
        c.beginPath();
        c.moveTo(HX - HR - 1, HY + 3);
        c.quadraticCurveTo(HX - HR + 1, HY + 9.5, HX - 6.5, HY + 9.4);
        stroke(c, 1.3, T.accent);
        ell(c, HX - 6.2, HY + 9.4, 1.8, 1.6);
        fill(c, T.ink, 0.8, T.paper);
        break;
      }
      case "parting": {
        hairCap(c, T.ink, true);
        c.beginPath();
        c.moveTo(HX - 3.4, HY - HR - 0.4);
        c.lineTo(HX - 2.2, HY - 8.6);
        stroke(c, 1, T.paper);
        break;
      }
      case "bun":
      case "neatbun": {
        hairCap(c, T.ink);
        ell(c, HX, HY - HR - 3.6, 5.6, 4.8);
        fill(c, T.ink, 1.3);
        c.beginPath();
        c.moveTo(HX - 4, HY - HR - 3.8);
        c.quadraticCurveTo(HX, HY - HR - 1.6, HX + 4, HY - HR - 3.8);
        stroke(c, 0.9, T.paper);
        if (look.hat === "neatbun") {
          // a pencil through it, then the headset
          c.beginPath();
          c.moveTo(HX - 9, HY - HR - 7.5);
          c.lineTo(HX + 8.5, HY - HR - 1);
          stroke(c, 3.4, T.ink);
          c.beginPath();
          c.moveTo(HX - 8.6, HY - HR - 7.3);
          c.lineTo(HX + 8, HY - HR - 1.2);
          stroke(c, 1.8, T.red);
        }
        break;
      }
      case "quiff": {
        hairCap(c, T.ink);
        c.beginPath();
        c.moveTo(HX - 9, HY - 9.5);
        c.bezierCurveTo(HX - 10, HY - 22, HX + 6, HY - 25, HX + 11.5, HY - 17.5);
        c.quadraticCurveTo(HX + 4, HY - 18.5, HX + 4, HY - 9.5);
        c.closePath();
        fill(c, T.ink, 1.3);
        break;
      }
      case "short": {
        hairCap(c, T.ink);
        break;
      }
      case "party": {
        // it's their birthday. Nobody has noticed, because of the email.
        c.beginPath();
        c.moveTo(HX - 7.5, HY - HR + 2.4);
        c.lineTo(HX + 2.5, HY - HR - 13.5);
        c.lineTo(HX + 8.5, HY - HR + 2);
        c.closePath();
        fill(c, hc, 1.4);
        c.save();
        c.beginPath();
        c.moveTo(HX - 7.5, HY - HR + 2.4);
        c.lineTo(HX + 2.5, HY - HR - 13.5);
        c.lineTo(HX + 8.5, HY - HR + 2);
        c.closePath();
        c.clip();
        c.beginPath();
        c.moveTo(HX - 8, HY - HR - 2); c.lineTo(HX + 9, HY - HR - 6.5);
        c.moveTo(HX - 8, HY - HR - 8.5); c.lineTo(HX + 9, HY - HR - 13);
        stroke(c, 2.6, T.red);
        c.restore();
        c.beginPath();
        c.moveTo(HX - 7.5, HY - HR + 2.4);
        c.lineTo(HX + 2.5, HY - HR - 13.5);
        c.lineTo(HX + 8.5, HY - HR + 2);
        stroke(c, 1.4);
        ell(c, HX + 2.5, HY - HR - 14, 2.4, 2.4);
        fill(c, T.paper, 1.1);
        break;
      }
      case "bobble": {
        c.beginPath();
        c.arc(HX, HY, HR + 0.9, Math.PI + 0.45, -0.45);
        c.closePath();
        fill(c, hc, 1.4);
        c.save();
        c.beginPath();
        c.arc(HX, HY, HR + 0.9, Math.PI + 0.45, -0.45);
        c.closePath();
        c.clip();
        c.fillStyle = shade(c);
        c.fillRect(HX + 3, HY - HR - 2, 12, 12);
        c.restore();
        rr(c, HX - HR - 1.2, HY - 11, HR * 2 + 2.4, 4.6, 1.6);
        fill(c, hc, 1.3);
        ell(c, HX, HY - HR - 3.4, 4, 3.8);
        fill(c, T.red, 1.3);
        break;
      }
      case "bald": {
        c.beginPath();
        c.moveTo(HX - 1, HY - HR + 0.3);
        c.quadraticCurveTo(HX + 0.2, HY - HR - 3.6, HX + 2.6, HY - HR - 2.8);
        stroke(c, 1);
        break;
      }
      case "visor": {
        c.beginPath();
        c.moveTo(HX - 2, HY - HR + 0.2);
        c.quadraticCurveTo(HX - 1, HY - HR - 4.4, HX + 3, HY - HR - 3.4);
        c.moveTo(HX + 1, HY - HR + 0.4);
        c.quadraticCurveTo(HX + 3, HY - HR - 2.6, HX + 5.6, HY - HR - 1.4);
        stroke(c, 1.1);
        // an eyeshade, for accounts
        c.beginPath();
        c.moveTo(HX - HR - 1.5, HY - 6.2);
        c.quadraticCurveTo(HX, HY - 10.5, HX + HR + 1.5, HY - 6.2);
        c.lineTo(HX + HR + 3.8, HY - 1.4);
        c.quadraticCurveTo(HX, HY - 4.8, HX - HR - 3.8, HY - 1.4);
        c.closePath();
        fill(c, hc, 1.4);
        c.save();
        c.clip();
        c.fillStyle = shade(c);
        c.fillRect(HX - HR - 4, HY - 5, HR * 2 + 8, 4);
        c.restore();
        break;
      }
      case "spiky": {
        c.beginPath();
        var pts = 7;
        c.moveTo(HX - HR + 0.2, HY - 5);
        for (var i = 0; i <= pts; i++) {
          var a = Math.PI + 0.35 + (Math.PI - 0.7) * (i / pts);
          var tip = HR + 5.2, base = HR - 1.4;
          var am = a + (Math.PI - 0.7) / pts / 2;
          c.lineTo(HX + Math.cos(a) * base, HY + Math.sin(a) * base);
          if (i < pts) c.lineTo(HX + Math.cos(am) * tip, HY + Math.sin(am) * tip);
        }
        c.lineTo(HX + HR - 0.2, HY - 5);
        c.quadraticCurveTo(HX, HY - 9, HX - HR + 0.2, HY - 5);
        c.closePath();
        fill(c, T.ink, 1.3);
        break;
      }
      case "messy": {
        hairCap(c, T.ink);
        [[-9, -12, -13, -19], [-3, -14, -4, -21], [3, -14, 6, -21], [9, -11, 14, -16]].forEach(function (s) {
          c.beginPath();
          c.moveTo(HX + s[0] - 2.4, HY + s[1] + 2);
          c.lineTo(HX + s[2], HY + s[3]);
          c.lineTo(HX + s[0] + 2.4, HY + s[1] + 2);
          c.closePath();
          fill(c, T.ink, 1.1);
        });
        break;
      }
      case "phones": {
        hairCap(c, T.ink);
        c.beginPath();
        c.arc(HX, HY, HR + 2.4, Math.PI + 0.15, -0.15);
        stroke(c, 3.6, T.ink);
        c.beginPath();
        c.arc(HX, HY, HR + 2.4, Math.PI + 0.15, -0.15);
        stroke(c, 1.4, T.paper);
        [-1, 1].forEach(function (side) {
          ell(c, HX + side * (HR + 1.2), HY + 0.5, 4.6, 6);
          fill(c, hc, 1.4);
        });
        break;
      }
    }
    if (look.headset && look.hat === "neatbun") {
      c.beginPath();
      c.arc(HX, HY, HR + 1.8, Math.PI + 0.25, -0.6);
      stroke(c, 3, T.ink);
      rr(c, HX - HR - 3.4, HY - 4, 4.6, 8.5, 2);
      fill(c, T.ink, 1.1, T.paper);
      c.beginPath();
      c.moveTo(HX - HR - 1, HY + 3);
      c.quadraticCurveTo(HX - HR + 1, HY + 9.5, HX - 6.5, HY + 9.4);
      stroke(c, 1.4, T.paper);
      ell(c, HX - 6.2, HY + 9.4, 1.6, 1.4);
      fill(c, T.paper, 0.8);
    }
    if (look.pencil) {
      c.beginPath();
      c.moveTo(HX + HR - 3, HY - 4);
      c.lineTo(HX + HR + 6, HY - 10.5);
      stroke(c, 3.2, T.ink);
      c.beginPath();
      c.moveTo(HX + HR - 2.6, HY - 4.3);
      c.lineTo(HX + HR + 5.6, HY - 10.2);
      stroke(c, 1.6, T.red);
    }
  }

  // The chair, the body, the head and the hat. The face is drawn live.
  function drawBody(c, look) {
    var shirt = ink(look.shirt);
    // the chair back, peeking out behind
    rr(c, 16, 33, 48, 30, 8);
    fill(c, T.ink, 1.5, T.paper);
    // the body: round, mostly behind the desk
    ell(c, HX, 57, 21.5, 16);
    fill(c, shirt);
    if (look.dots) { c.fillStyle = shade(c); c.fill(); }
    if (shirt !== T.ink) crescent(c, HX, 57, 21.5, 16);
    ell(c, HX, 57, 21.5, 16);
    stroke(c, 1.7, edgeFor(shirt));
    if (look.collar) {
      c.beginPath();
      c.moveTo(HX - 6.5, 42.6); c.lineTo(HX - 1.5, 47.2); c.lineTo(HX, 44.2);
      c.moveTo(HX + 6.5, 42.6); c.lineTo(HX + 1.5, 47.2); c.lineTo(HX, 44.2);
      stroke(c, 1.2);
    }
    if (look.tie) {
      c.beginPath();
      c.moveTo(HX - 2, 44.5); c.lineTo(HX + 2, 44.5); c.lineTo(HX + 1.3, 47.2); c.lineTo(HX - 1.3, 47.2);
      c.closePath();
      fill(c, T.red, 1);
      c.beginPath();
      c.moveTo(HX - 1.3, 47.2); c.lineTo(HX + 1.3, 47.2); c.lineTo(HX + 3.2, 57); c.lineTo(HX, 60); c.lineTo(HX - 3.2, 57);
      c.closePath();
      fill(c, T.red, 1.1);
    }
    if (look.bow) {
      c.beginPath();
      c.moveTo(HX, 45.5); c.lineTo(HX - 6, 42.6); c.lineTo(HX - 6, 48.4); c.closePath();
      c.moveTo(HX, 45.5); c.lineTo(HX + 6, 42.6); c.lineTo(HX + 6, 48.4); c.closePath();
      fill(c, T.red, 1.1);
      ell(c, HX, 45.5, 1.6, 1.6);
      fill(c, T.red, 1);
    }
    if (look.lanyard) {
      c.beginPath();
      c.moveTo(HX - 7, 42.5); c.lineTo(HX, 52.5); c.lineTo(HX + 7, 42.5);
      stroke(c, 2.4, T.accent);
      rr(c, HX - 3.6, 51.5, 7.2, 7, 1);
      fill(c, T.paper, 1);
    }
    // ears, then the head over them: big and round, nearly as wide as the shoulders
    c.save();
    headSpace(c);
    ell(c, HX - HR + 0.2, HY + 1.5, 2.5, 3.4);
    fill(c, T.paper, 1.3);
    ell(c, HX + HR - 0.2, HY + 1.5, 2.5, 3.4);
    fill(c, T.paper, 1.3);
    ell(c, HX, HY, HR, HR);
    fill(c, T.paper);
    crescent(c, HX, HY, HR, HR, 0.09);
    ell(c, HX, HY, HR, HR);
    stroke(c, 1.6);
    drawHat(c, look);
    c.restore();
  }

  // The head and everything on it is drawn round (HX, HY) at HR, then scaled
  // up by HS about its centre, which sits HDY lower
  function headSpace(c) {
    c.translate(HX, HY + HDY);
    c.scale(HS, HS);
    c.translate(-HX, -HY);
  }
  // Where a point on the head ends up, in desk units
  function headPoint(x, y) { return { x: HX + (x - HX) * HS, y: HY + HDY + (y - HY) * HS }; }

  // An empty chair, for anyone out of the office
  function drawChair(c) {
    rr(c, 16, 33, 48, 30, 8);
    fill(c, T.ink, 1.5, T.paper);
    // a cardigan left over the back, so it looks like someone works here
    c.beginPath();
    c.moveTo(19, 37); c.quadraticCurveTo(40, 31, 61, 37);
    c.lineTo(58, 52); c.quadraticCurveTo(40, 47, 22, 52);
    c.closePath();
    fill(c, T.accent, 1.3);
    c.save();
    c.clip();
    c.fillStyle = shade(c);
    c.fillRect(44, 30, 20, 24);
    c.restore();
  }

  // ---------------------------------------------------------------------------
  // Desks: the top, the front, a keyboard, a monitor seen from behind, and one
  // thing on the left (a mug, a plant, a pile of paper or a photo)
  // ---------------------------------------------------------------------------
  function drawDesk(c, decor) {
    // the monitor, from behind
    rr(c, 66, 23, 29, 27, 3);
    fill(c, T.paper);
    c.save();
    c.clip();
    c.fillStyle = shade(c);
    c.fillRect(86, 20, 12, 34);
    c.fillStyle = shadeLight(c);
    c.fillRect(60, 20, 26, 34);
    c.restore();
    rr(c, 66, 23, 29, 27, 3);
    stroke(c, 1.6);
    c.beginPath();
    for (var v = 0; v < 4; v++) { c.moveTo(72 + v * 2.6, 28); c.lineTo(72 + v * 2.6, 33); }
    stroke(c, 1);
    rr(c, 78, 49, 5, 9, 1);
    fill(c, T.paper, 1.3);
    // the desk: a white top and a front in shade
    c.beginPath();
    c.rect(2.5, 62, 95, 14);
    fill(c, T.paper);
    c.fillStyle = shadeLight(c);
    c.fill();
    c.beginPath();
    c.rect(2.5, 62, 95, 14);
    stroke(c, 1.6);
    rr(c, 0.5, 57.5, 99, 5, 1.5);
    fill(c, T.paper, 1.6);
    ell(c, 80.5, 58.6, 7, 1.5);
    fill(c, T.paper, 1.1);
    // the keyboard
    rr(c, 27, 55.4, 26, 3.8, 1);
    fill(c, T.paper, 1.1);
    c.fillStyle = T.ink;
    for (var k = 0; k < 7; k++) c.fillRect(29.4 + k * 3.2, 56.6, 1.6, 0.9);
    // something of theirs
    if (decor === 0) {
      // a mug
      c.beginPath();
      c.arc(14, 52.5, 3, -1.2, 1.2);
      stroke(c, 1.6);
      rr(c, 5, 47.5, 9.5, 10.5, 1.6);
      fill(c, T.paper, 1.4);
      c.fillStyle = T.red;
      c.fillRect(5.7, 51, 8.1, 3);
      c.beginPath();
      c.moveTo(8, 45.5); c.quadraticCurveTo(10, 43.5, 8.5, 41.5);
      c.moveTo(11.5, 45.5); c.quadraticCurveTo(13.5, 43.5, 12, 41.5);
      stroke(c, 1, T.paper);
    } else if (decor === 1) {
      // a plant that has seen things
      [[-0.5, 6.5], [0.45, 6], [-0.05, 7.5]].forEach(function (l) {
        ell(c, 10 + Math.sin(l[0]) * 4.5, 44 - Math.cos(l[0]) * 2.5, 2.4, l[1], l[0]);
        fill(c, T.ink, 1.1, T.paper);
      });
      c.beginPath();
      c.moveTo(4.5, 49); c.lineTo(15.5, 49); c.lineTo(14, 58); c.lineTo(6, 58);
      c.closePath();
      fill(c, T.accent, 1.4);
    } else if (decor === 2) {
      // paperwork, unread
      [0, 1, 2].forEach(function (i) {
        rr(c, 4 + i * 0.8, 53 - i * 2.4, 13, 3, 0.6);
        fill(c, T.paper, 1.1);
      });
    } else {
      // a photo of someone who loves them
      rr(c, 5, 46, 10, 11.5, 1);
      fill(c, T.ink, 1.3, T.paper);
      rr(c, 6.6, 47.6, 6.8, 8.3, 0.6);
      fill(c, T.paper);
      ell(c, 10, 50.4, 1.8, 1.8);
      fill(c, T.ink);
      ell(c, 10, 55, 2.8, 1.8);
      fill(c, T.ink);
    }
  }

  // ---------------------------------------------------------------------------
  // Cached bitmaps: { img, x, y, w, h } in local units. Draw img at (x, y), w x h.
  // ---------------------------------------------------------------------------
  function sprite(key, box, draw) {
    var hit = cache[key];
    if (hit) return hit;
    var cv = document.createElement("canvas");
    cv.width = Math.max(1, Math.ceil(box[2] * S));
    cv.height = Math.max(1, Math.ceil(box[3] * S));
    var c = cv.getContext("2d");
    c.scale(S, S);
    c.translate(-box[0], -box[1]);
    draw(c);
    hit = cache[key] = { img: cv, x: box[0], y: box[1], w: box[2], h: box[3] };
    return hit;
  }
  function blit(c, sp) { c.drawImage(sp.img, sp.x, sp.y, sp.w, sp.h); }

  function body(look) {
    return sprite("body-" + look.id, [8, -16, 66, 82], function (c) { drawBody(c, look); });
  }
  function desk(decor) {
    return sprite("desk-" + decor, [-1, 20, 102, 57], function (c) { drawDesk(c, decor); });
  }
  function chair() {
    return sprite("chair", [12, 28, 56, 38], drawChair);
  }

  // ---------------------------------------------------------------------------
  // Live parts: the face, the arms and the mittens
  // ---------------------------------------------------------------------------
  // f: { mood, gx, gy, talk, look }
  //   mood: idle, type, shout, smug, sulk, cheer, sad, flinch
  //   gx, gy: where they're looking, -1 to 1
  function drawFace(c, look, f) {
    c.save();
    headSpace(c);
    drawFaceParts(c, look, f);
    c.restore();
  }
  function drawFaceParts(c, look, f) {
    var mood = f.mood;
    var gx = f.gx || 0, gy = f.gy || 0;
    // eyes
    [-1, 1].forEach(function (side) {
      var ex = HX + side * 5, ey = HY + 0.6;
      if (mood === "cheer") {
        // shut tight with joy: email is down
        c.beginPath();
        c.moveTo(ex - 3, ey + 1);
        c.quadraticCurveTo(ex, ey - 3, ex + 3, ey + 1);
        stroke(c, 1.6);
        return;
      }
      ell(c, ex, ey, 3.2, mood === "flinch" ? 4.4 : 3.9);
      fill(c, T.paper, 1.2);
      var px = ex + gx * 1.35, py = ey + gy * 1.6;
      ell(c, px, py, mood === "flinch" ? 0.9 : 1.3, mood === "flinch" ? 0.9 : 1.4);
      fill(c, T.ink);
    });
    if (look.glasses) {
      c.beginPath();
      rrPath(c, HX - 9.6, HY - 3.6, 8.6, 8.2, 2);
      rrPath(c, HX + 1, HY - 3.6, 8.6, 8.2, 2);
      c.moveTo(HX - 1, HY - 0.5); c.lineTo(HX + 1, HY - 0.5);
      stroke(c, 1.6);
    }
    // eyebrows: down at the middle, furious at all times. Except the
    // assistant, who is sad, and anyone whose email has just gone down.
    c.beginPath();
    if (mood === "sad") {
      c.moveTo(HX - 1.6, HY - 7.4); c.lineTo(HX - 8.4, HY - 4.6);
      c.moveTo(HX + 1.6, HY - 7.4); c.lineTo(HX + 8.4, HY - 4.6);
    } else if (mood === "cheer") {
      c.moveTo(HX - 1.8, HY - 7); c.quadraticCurveTo(HX - 5, HY - 10, HX - 8.6, HY - 7.4);
      c.moveTo(HX + 1.8, HY - 7); c.quadraticCurveTo(HX + 5, HY - 10, HX + 8.6, HY - 7.4);
    } else {
      var steep = mood === "type" || mood === "shout" ? 1.2 : mood === "flinch" ? -0.8 : 0;
      c.moveTo(HX - 1.4, HY - 4.4 + steep * 0.4); c.lineTo(HX - 8.6, HY - 7.4 - steep);
      c.moveTo(HX + 1.4, HY - 4.4 + steep * 0.4); c.lineTo(HX + 8.6, HY - 7.4 - steep);
    }
    stroke(c, 2.3);
    // the mouth
    var my = HY + 7.6;
    if (mood === "type") {
      // muttering as they type
      ell(c, HX, my, 2.4, 0.8 + (f.talk || 0) * 1.5);
      fill(c, T.ink);
    } else if (mood === "shout" || mood === "flinch") {
      ell(c, HX, my + 0.4, 3.8, mood === "flinch" ? 2.2 : 3);
      fill(c, T.ink);
      if (mood === "shout") { ell(c, HX, my + 2, 2, 0.9); fill(c, T.red); }
    } else if (mood === "smug") {
      c.beginPath();
      c.moveTo(HX - 3.8, my + 0.6);
      c.quadraticCurveTo(HX + 1, my + 1.4, HX + 4.2, my - 1.2);
      stroke(c, 1.5);
    } else if (mood === "sulk") {
      c.beginPath();
      c.moveTo(HX - 3.6, my + 0.6);
      c.lineTo(HX - 1.6, my - 0.2); c.lineTo(HX, my + 0.6); c.lineTo(HX + 1.6, my - 0.2); c.lineTo(HX + 3.6, my + 0.6);
      stroke(c, 1.4);
    } else if (mood === "cheer") {
      c.beginPath();
      c.moveTo(HX - 4.6, my - 1.2);
      c.quadraticCurveTo(HX, my + 7.6, HX + 4.6, my - 1.2);
      c.closePath();
      fill(c, T.ink);
      ell(c, HX, my + 2.2, 2, 1);
      fill(c, T.red);
    } else if (mood === "sad") {
      c.beginPath();
      c.moveTo(HX - 4, my + 1.8);
      c.quadraticCurveTo(HX, my - 2.2, HX + 4, my + 1.8);
      stroke(c, 1.5);
    } else {
      // a frown
      c.beginPath();
      c.moveTo(HX - 4.4, my + 1);
      c.quadraticCurveTo(HX, my - 1.8, HX + 4.4, my + 1);
      stroke(c, 1.5);
    }
    if (look.tache) {
      c.beginPath();
      c.moveTo(HX - 5.8, my - 0.6);
      c.quadraticCurveTo(HX - 3, my - 4, HX, my - 2.6);
      c.quadraticCurveTo(HX + 3, my - 4, HX + 5.8, my - 0.6);
      c.quadraticCurveTo(HX, my - 1.6, HX - 5.8, my - 0.6);
      fill(c, T.ink);
    }
    // the second chin
    c.beginPath();
    c.moveTo(HX - 6.2, HY + 11.4);
    c.quadraticCurveTo(HX, HY + 13.6, HX + 6.2, HY + 11.4);
    stroke(c, 1.2);
  }
  function rrPath(c, x, y, w, h, r) {
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  // Arms from the shoulders to the mittens. hands: [[lx, ly], [rx, ry]]
  function drawArms(c, look, hands, phone) {
    var sleeve = ink(look.shirt);
    var edge = edgeFor(sleeve);
    [-1, 1].forEach(function (side, i) {
      var sx = HX + side * 15.5, sy = 47.5;
      var h = hands[i];
      var mx = (sx + h[0]) / 2 + side * 2.4, my = (sy + h[1]) / 2;
      c.beginPath();
      c.moveTo(sx, sy);
      c.quadraticCurveTo(mx, my, h[0], h[1]);
      stroke(c, 8.8, edge);
      c.beginPath();
      c.moveTo(sx, sy);
      c.quadraticCurveTo(mx, my, h[0], h[1]);
      stroke(c, 6, sleeve);
    });
    if (phone) {
      rr(c, HX - 5, 43.5, 10, 13.5, 1.8);
      fill(c, T.ink, 1.2, T.paper);
      rr(c, HX - 3.4, 45.2, 6.8, 9.4, 0.8);
      fill(c, T.accent);
    }
    hands.forEach(function (h, i) {
      var side = i ? 1 : -1;
      ell(c, h[0], h[1], 3.9, 3.4);
      fill(c, T.paper, 1.3);
      ell(c, h[0] - side * 3.1, h[1] - 1.2, 1.5, 1.3);
      fill(c, T.paper, 1);
    });
  }

  // ---------------------------------------------------------------------------
  // Text. Notaste Display's space is narrow (0.2em), and at the small sizes a
  // phone gets, words run together ("NOTSURE THIS"). So display text on the
  // canvas is drawn a word at a time with a GAP between. size: the font size,
  // in whatever units the canvas is drawing in. how: "fill" (the default), or
  // "both" for an outline (strokeStyle) under the fill.
  // ---------------------------------------------------------------------------
  function textWidth(c, str, size) {
    var w = 0;
    String(str).split(" ").forEach(function (word, i) { w += c.measureText(word).width + (i ? size * GAP : 0); });
    return w;
  }
  function text(c, str, x, y, size, how) {
    var words = String(str).split(" ");
    var align = c.textAlign, w = textWidth(c, str, size);
    var at = align === "center" ? x - w / 2 : align === "right" || align === "end" ? x - w : x;
    c.textAlign = "left";
    if (how === "both") words.reduce(function (p, word) { c.strokeText(word, p, y); return p + c.measureText(word).width + size * GAP; }, at);
    words.reduce(function (p, word) { c.fillText(word, p, y); return p + c.measureText(word).width + size * GAP; }, at);
    c.textAlign = align;
  }

  // ---------------------------------------------------------------------------
  // Screen-pixel pieces: drawn with the canvas at CSS pixel scale
  // ---------------------------------------------------------------------------

  // A sealed envelope, centred on x, y, w wide. boss: a red border (high importance)
  function envelope(c, x, y, w, rot, boss) {
    var h = w * 0.66;
    c.save();
    c.translate(x, y);
    c.rotate(rot || 0);
    c.beginPath();
    c.rect(-w / 2, -h / 2, w, h);
    fill(c, T.paper, Math.max(1.4, w * 0.09), boss ? T.red : T.ink);
    c.beginPath();
    c.moveTo(-w / 2, -h / 2);
    c.lineTo(0, h * 0.12);
    c.lineTo(w / 2, -h / 2);
    stroke(c, Math.max(1.1, w * 0.07), boss ? T.red : T.ink);
    c.restore();
  }

  // White motion lines behind something moving from (x0, y0) towards (x1, y1)
  function motion(c, x0, y0, x1, y1, w) {
    var dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy) || 1;
    var ux = dx / d, uy = dy / d, nx = -uy, ny = ux;
    c.beginPath();
    [-1, 0, 1].forEach(function (o) {
      var bx = x1 - ux * w * 0.7 + nx * o * w * 0.28, by = y1 - uy * w * 0.7 + ny * o * w * 0.28;
      var len = w * (o ? 0.7 : 1.1);
      c.moveTo(bx, by);
      c.lineTo(bx - ux * len, by - uy * len);
    });
    stroke(c, Math.max(1.4, w * 0.1), T.paper);
  }

  // The pointing hand: the player's cursor. Fingertip at x, y, pointing down.
  function hand(c, x, y, size, press, tag) {
    var s = size / 40;
    c.save();
    c.translate(x, y);
    c.scale(s, s * (1 - press * 0.12));
    c.translate(0, -6);
    c.lineJoin = "round";
    c.lineCap = "round";
    pen(c, 2.6);
    rr(c, -9, -36, 18, 9, 2);
    fill(c, T.accent, 2.6);
    ell(c, 0, -18, 11.5, 10);
    fill(c, T.paper, 2.6);
    rr(c, -3.6, -16, 7.2, 22, 3.6);
    fill(c, T.paper, 2.6);
    c.beginPath();
    c.moveTo(-8, -15); c.lineTo(-8, -10);
    c.moveTo(-4.6, -13); c.lineTo(-4.6, -8);
    c.moveTo(7.4, -15); c.lineTo(7.4, -10);
    stroke(c, 1.6);
    if (tag) {
      c.font = "7px " + T.display;
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillStyle = T.ink;
      c.fillText(tag.toUpperCase(), 0, -31.2);
    }
    c.restore();
  }

  // Corner brackets round a box. colour: paper for the cursor, red for a target
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
    c.lineWidth = (width || 3) + 2.4;
    c.strokeStyle = T.ink;
    c.stroke();
    c.lineWidth = width || 3;
    c.strokeStyle = colour;
    c.stroke();
  }

  // A small rubber stamp: paper, a red double border, red capitals
  function stamp(c, x, y, label, size, tilt, alpha, grow) {
    c.save();
    c.globalAlpha *= alpha;
    c.translate(x, y);
    c.rotate(tilt);
    c.scale(grow, grow);
    c.font = size + "px " + T.display;
    var w = textWidth(c, label.toUpperCase(), size) + size * 1.1, h = size * 1.55;
    c.fillStyle = T.paper;
    c.fillRect(-w / 2, -h / 2, w, h);
    c.lineWidth = Math.max(1.5, size * 0.13);
    c.strokeStyle = T.red;
    c.strokeRect(-w / 2, -h / 2, w, h);
    c.lineWidth = Math.max(0.8, size * 0.06);
    c.strokeRect(-w / 2 + size * 0.22, -h / 2 + size * 0.22, w - size * 0.44, h - size * 0.44);
    c.fillStyle = T.red;
    c.textAlign = "center";
    c.textBaseline = "middle";
    text(c, label.toUpperCase(), 0, size * 0.06, size);
    c.restore();
  }

  // A speech bubble: paper, a thick ink outline, rounded corners, a tail to
  // the speaker, capitals. box: { x, y, w, h }, tail: the point it aims at.
  function bubble(c, box, tail, lines, size, alpha, boss) {
    var x = box.x, y = box.y, w = box.w, h = box.h;
    var r = Math.min(8, h / 2);
    c.save();
    c.globalAlpha *= alpha;
    c.beginPath();
    // the tail leaves from whichever side faces the speaker
    var below = tail.y > y + h, above = tail.y < y, left = !below && !above && tail.x < x;
    var tx = Math.max(x + 10, Math.min(x + w - 10, tail.x)), ty = Math.max(y + 8, Math.min(y + h - 8, tail.y));
    var tw = Math.min(6, w / 5);
    var gapY = below ? tail.y - (y + h) : above ? y - tail.y : 0;
    var gapX = left ? x - tail.x : tail.x - (x + w);
    var reach = Math.max(size * 0.6, Math.min(40, (below || above ? gapY : gapX) - 2));
    c.moveTo(x + r, y);
    if (above) { c.lineTo(tx - tw, y); c.lineTo(tx + (tail.x - tx) * 0.3, y - reach); c.lineTo(tx + tw, y); }
    c.arcTo(x + w, y, x + w, y + h, r);
    if (!below && !above && !left) { c.lineTo(x + w, ty - tw); c.lineTo(x + w + reach, ty + (tail.y - ty) * 0.3); c.lineTo(x + w, ty + tw); }
    c.arcTo(x + w, y + h, x, y + h, r);
    if (below) { c.lineTo(tx + tw, y + h); c.lineTo(tx + (tail.x - tx) * 0.3, y + h + reach); c.lineTo(tx - tw, y + h); }
    c.arcTo(x, y + h, x, y, r);
    if (left) { c.lineTo(x, ty + tw); c.lineTo(x - reach, ty + (tail.y - ty) * 0.3); c.lineTo(x, ty - tw); }
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
    c.fillStyle = T.paper;
    c.fill();
    c.lineWidth = 2.4;
    c.lineJoin = "round";
    c.strokeStyle = boss ? T.red : T.ink;
    c.stroke();
    c.font = size + "px " + T.display;
    c.fillStyle = T.ink;
    c.textAlign = "center";
    c.textBaseline = "top";
    var lh = size * 1.02;
    lines.forEach(function (l, i) { text(c, l, x + w / 2, y + (h - lines.length * lh) / 2 + i * lh + size * 0.06, size); });
    c.restore();
  }

  // A bobbing arrow pointing at something, with a word over it. dir "down"
  // (the default) points down at x, y; "left" points left at it, for a desk
  // with no room above it.
  function arrow(c, x, y, word, size, dir, maxRight) {
    var s = size / 22;
    c.save();
    c.translate(x, y);
    c.scale(s, s);
    c.save();
    if (dir === "left") c.rotate(Math.PI / 2);
    c.lineJoin = "round";
    c.beginPath();
    c.moveTo(-5, -22); c.lineTo(5, -22); c.lineTo(5, -12); c.lineTo(11, -12); c.lineTo(0, 0); c.lineTo(-11, -12); c.lineTo(-5, -12);
    c.closePath();
    fill(c, T.paper, 2);
    c.restore();
    var fs = Math.max(10, 12 / s);
    c.font = fs + "px " + T.display;
    c.textAlign = dir === "left" ? "left" : "center";
    c.textBaseline = "bottom";
    c.lineWidth = 3.4;
    c.strokeStyle = T.ink;
    c.fillStyle = T.paper;
    var tx = dir === "left" ? 4 : 0, ty = dir === "left" ? -13 : -25;
    if (maxRight) {
      // keep the word on the screen
      var tw = textWidth(c, word.toUpperCase(), fs);
      var over = x + (tx + (dir === "left" ? tw : tw / 2)) * s - maxRight;
      if (over > 0) tx -= over / s;
    }
    text(c, word.toUpperCase(), tx, ty, fs, "both");
    c.restore();
  }

  // Smoke: white circles with the accent offset behind (DESIGN.md, section 7)
  function puff(c, x, y, r, k, blobs) {
    var grow = 0.7 + k * 0.9, rise = k * r * 2.2;
    c.save();
    c.globalAlpha *= 1 - k * k;
    blobs.forEach(function (b) {
      c.fillStyle = T.accent;
      c.beginPath(); c.arc(x + b[0] * r * grow + r * 0.18, y + b[1] * r * grow - rise + r * 0.18, b[2] * r * grow, 0, TAU); c.fill();
    });
    blobs.forEach(function (b) {
      c.fillStyle = T.paper;
      c.beginPath(); c.arc(x + b[0] * r * grow, y + b[1] * r * grow - rise, b[2] * r * grow, 0, TAU); c.fill();
    });
    c.restore();
  }

  // Hazard tape across a row: Muted * Muted * Muted
  function tape(c, x0, x1, y, h, reveal, alpha, word) {
    c.save();
    c.globalAlpha *= alpha;
    c.translate((x0 + x1) / 2, y);
    c.rotate(-0.035);
    var w = (x1 - x0) * 1.06;
    c.beginPath();
    c.rect(-w / 2, -h / 2, w * reveal, h);
    c.clip();
    c.fillStyle = T.red;
    c.fillRect(-w / 2, -h / 2, w, h);
    c.fillStyle = T.ink;
    c.fillRect(-w / 2, -h / 2 - 1.5, w, 1.5);
    c.fillRect(-w / 2, h / 2, w, 1.5);
    var size = h * 0.62;
    c.font = size + "px " + T.display;
    c.textBaseline = "middle";
    c.textAlign = "left";
    var label = word.toUpperCase();
    var lw = c.measureText(label).width, star = c.measureText("*").width, gap = size * 0.45;
    var at = -w / 2 + size * 0.4;
    while (at < w / 2) {
      c.fillStyle = T.paper;
      c.fillText(label, at, size * 0.06);
      at += lw + gap;
      c.fillStyle = T.ink;
      c.fillText("*", at, size * 0.12);
      at += star + gap;
    }
    c.restore();
  }

  // ---------------------------------------------------------------------------
  // The server, in screen pixels: a black box with a face, a rack of lights
  // and a thermometer. It gets more upset as the load climbs, and swallows
  // every reply that gets out. s: { load (0..1), clock, melt (0..1), gulp (0..1) }
  // ---------------------------------------------------------------------------
  function serverFace(x, y, w, h) {
    var er = Math.max(5, Math.min(13, h * 0.16));
    return { x: x + w * 0.235, y: y + h * 0.5, er: er, mouth: { x: x + w * 0.235, y: y + h * 0.5 + er * 1.6 } };
  }
  function server(c, x, y, w, h, s) {
    var load = Math.max(0, Math.min(1, s.load)), melt = s.melt || 0, gulp = s.gulp || 0;
    var face = serverFace(-w / 2, -h, w, h);
    c.save();
    c.translate(x + w / 2, y + h);
    c.rotate(melt * -0.05);
    c.scale(1 + melt * 0.05 + gulp * 0.04, 1 - melt * 0.25 - gulp * 0.06);
    var bx = -w / 2, by = -h;
    rr(c, bx, by, w, h, 6);
    fill(c, T.ink, 2.4, T.paper);
    // the thermometer
    var tw = Math.max(8, w * 0.055), tx = bx + w - tw - 7, ty = by + 6, th = h - 12;
    rr(c, tx, ty, tw, th, tw / 2);
    fill(c, T.ink, 1.6, T.paper);
    var hot = load >= 0.7;
    c.fillStyle = hot && (s.clock * 6 % 1 < 0.5 || load >= 1) ? T.red : T.accent;
    var fh = (th - 4) * load;
    if (fh > 1) { rr(c, tx + 2, ty + th - 2 - fh, tw - 4, fh, (tw - 4) / 2); c.fill(); }
    // the name plate, then the rack, blinking faster as it fills up
    var rx0 = bx + w * 0.47, rx1 = tx - 6;
    var size = Math.max(9, Math.min(15, h * 0.2));
    c.font = size + "px " + T.display;
    rr(c, rx0, by + 6, rx1 - rx0, size * 1.35, 2);
    fill(c, T.paper);
    c.fillStyle = T.ink;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("SERVER", (rx0 + rx1) / 2, by + 6 + size * 0.72);
    var rackTop = by + 6 + size * 1.35 + 4, units = 2, uh = (by + h - 5 - rackTop) / units;
    for (var i = 0; i < units; i++) {
      var uy = rackTop + i * uh;
      rr(c, rx0, uy, rx1 - rx0, uh - 3, 2);
      stroke(c, 1.3, T.paper);
      var n = Math.max(2, Math.floor((rx1 - rx0 - 8) / 8));
      for (var l = 0; l < n; l++) {
        var on = melt < 0.4 && Math.sin(s.clock * (5 + load * 22) + l * 2.3 + i * 1.7) > -0.2 + load * 0.2;
        c.beginPath();
        c.arc(rx1 - 6 - l * 8, uy + (uh - 3) / 2, 2.1, 0, TAU);
        c.fillStyle = on ? (hot && l % 2 ? T.red : T.accent) : T.ink;
        c.fill();
        c.lineWidth = 1;
        c.strokeStyle = T.paper;
        c.stroke();
      }
    }
    // the face: bored, then cross, then worried, then panicking, then melted
    var mood = melt > 0 ? "melt" : gulp > 0.3 ? "gulp" : load >= 0.85 ? "panic" : load >= 0.6 ? "worried" : load >= 0.3 ? "cross" : "bored";
    var fx = face.x, fy = face.y, er = face.er;
    var jit = mood === "panic" ? Math.sin(s.clock * 40) * er * 0.12 : 0;
    var lw2 = Math.max(1.6, er * 0.32);
    [-1, 1].forEach(function (side) {
      var ex = fx + side * er * 1.45, ey = fy - er * 0.5;
      if (mood === "melt") {
        c.beginPath();
        c.moveTo(ex - er * 0.9, ey - er * 0.2);
        c.quadraticCurveTo(ex, ey + er * 1.4, ex + er * 0.9, ey - er * 0.2);
        stroke(c, lw2, T.paper);
        return;
      }
      var big = mood === "panic" || mood === "gulp" ? 1.25 : 1;
      ell(c, ex, ey, er * 0.85 * big, er * big);
      fill(c, T.paper, 1.2, T.ink);
      var pr = mood === "panic" ? er * 0.24 : er * 0.42;
      ell(c, ex + jit + (mood === "bored" ? er * 0.25 : 0), ey + (mood === "bored" ? er * 0.3 : 0), pr, pr);
      fill(c, T.ink);
      if (mood === "bored") {
        // heavy lids
        c.beginPath();
        c.ellipse(ex, ey, er * 0.9, er * 1.05, 0, Math.PI, 0);
        c.closePath();
        fill(c, T.ink);
        c.beginPath();
        c.moveTo(ex - er * 0.85, ey); c.lineTo(ex + er * 0.85, ey);
        stroke(c, lw2 * 0.8, T.paper);
      }
      // brows
      c.beginPath();
      var inner = ex - side * er * 0.7, outer = ex + side * er * 0.9, top = ey - er * 1.45 * big;
      if (mood === "cross") { c.moveTo(inner, top + er * 0.35); c.lineTo(outer, top - er * 0.15); }
      else if (mood === "worried" || mood === "panic" || mood === "gulp") { c.moveTo(inner, top - er * 0.35); c.lineTo(outer, top + er * 0.2); }
      else { c.moveTo(inner, top); c.lineTo(outer, top); }
      stroke(c, lw2, T.paper);
    });
    var mx = fx, my = fy + er * 1.6;
    c.beginPath();
    if (mood === "bored") {
      c.moveTo(mx - er * 0.9, my); c.lineTo(mx + er * 0.9, my);
      stroke(c, lw2, T.paper);
    } else if (mood === "cross") {
      c.moveTo(mx - er, my + er * 0.3); c.quadraticCurveTo(mx, my - er * 0.5, mx + er, my + er * 0.3);
      stroke(c, lw2, T.paper);
    } else if (mood === "worried") {
      c.moveTo(mx - er * 1.1, my);
      for (var q = 1; q <= 4; q++) c.lineTo(mx - er * 1.1 + q * er * 0.55, my + (q % 2 ? -er * 0.3 : 0));
      stroke(c, lw2, T.paper);
    } else {
      // open: panicking, swallowing, or melting
      var mh = mood === "melt" ? er * (0.8 + melt * 1.2) : mood === "gulp" ? er * 1.1 : er * 0.75;
      ell(c, mx, my + mh * 0.3, er * 0.9, mh);
      fill(c, T.ink, lw2 * 0.8, T.paper);
      if (mood !== "gulp") { ell(c, mx, my + mh * 0.85, er * 0.5, mh * 0.3); fill(c, T.red); }
    }
    // sweat
    if ((mood === "worried" || mood === "panic") && melt === 0) {
      [0, 1].forEach(function (n) {
        var k = (s.clock * (mood === "panic" ? 1.6 : 0.9) + n * 0.5) % 1;
        var sx = fx + (n ? 1 : -1) * er * (2.6 + k * 1.4), sy = fy - er * 1.6 + k * er * 2.2;
        c.beginPath();
        c.moveTo(sx, sy - er * 0.55);
        c.quadraticCurveTo(sx + er * 0.38, sy, sx, sy + er * 0.25);
        c.quadraticCurveTo(sx - er * 0.38, sy, sx, sy - er * 0.55);
        c.globalAlpha = 1 - k;
        fill(c, T.paper);
        c.globalAlpha = 1;
      });
    }
    if (melt > 0) {
      // drips
      c.beginPath();
      [0.12, 0.38, 0.6, 0.84].forEach(function (f, n) {
        var dx = bx + w * f, len = melt * (8 + n % 2 * 9);
        c.moveTo(dx - 3, 0);
        c.lineTo(dx - 2, len);
        c.arc(dx, len, 2.2, Math.PI, 0, true);
        c.lineTo(dx + 3, 0);
      });
      fill(c, T.ink, 2, T.paper);
    }
    c.restore();
  }

  // "Days since the last reply all": a paper sign. The number is always 0.
  function sign(c, x, y, w, h) {
    c.save();
    rr(c, x, y, w, h, 3);
    fill(c, T.paper, 2.2);
    var small = Math.max(9, Math.min(13, h * 0.2));
    c.font = small + "px " + T.display;
    c.fillStyle = T.ink;
    c.textAlign = "left";
    c.textBaseline = "top";
    text(c, "DAYS SINCE", x + 7, y + 6, small);
    text(c, "THE LAST", x + 7, y + 6 + small * 1.05, small);
    text(c, "REPLY ALL", x + 7, y + 6 + small * 2.1, small);
    var big = Math.min(h * 0.72, w * 0.36);
    c.font = big + "px " + T.display;
    c.textAlign = "right";
    c.textBaseline = "middle";
    c.fillStyle = T.red;
    c.fillText("0", x + w - 8, y + h / 2 + big * 0.06);
    c.restore();
  }

  // The Mute thread button, drawn for keyboards and mice (touch has the kit's pad)
  function muteButton(c, x, y, r, share, ready, key, pressed) {
    c.save();
    c.beginPath();
    c.arc(x, y, r, 0, TAU);
    c.fillStyle = T.ink;
    c.fill();
    // recharging: the accent fills it from the bottom (solid, no see-through grey)
    c.save();
    c.clip();
    c.fillStyle = T.accent;
    var fh = r * 2 * Math.max(0, Math.min(1, share));
    c.fillRect(x - r, y + r - fh, r * 2, fh);
    c.restore();
    c.beginPath();
    c.arc(x, y, r, 0, TAU);
    c.lineWidth = ready ? 3 : 2;
    c.strokeStyle = ready ? T.accent : T.paper;
    c.stroke();
    if (pressed) {
      c.beginPath();
      c.arc(x, y, r - 1, 0, TAU);
      c.fillStyle = T.paper;
      c.fill();
    }
    var size = Math.max(12, r * 0.44), small = Math.max(12, size * 0.8);
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.lineJoin = "round";
    c.lineWidth = 3;
    c.strokeStyle = T.ink;
    c.fillStyle = pressed ? T.ink : T.paper;
    c.font = size + "px " + T.display;
    if (!pressed) c.strokeText("MUTE", x, y - size * 0.36);
    c.fillText("MUTE", x, y - size * 0.36);
    c.font = small + "px " + T.display;
    if (!pressed) c.strokeText(key.toUpperCase(), x, y + size * 0.6);
    c.fillText(key.toUpperCase(), x, y + size * 0.6);
    c.restore();
  }

  window.ReplyAllArt = {
    LOOKS: LOOKS,
    ASSISTANT: ASSISTANT,
    init: init,
    flush: flush,
    body: body,
    desk: desk,
    chair: chair,
    cached: sprite,          // cached(key, [x, y, w, h], draw): any drawing, kept as a bitmap at this scale
    drawBody: drawBody,      // uncached, for the cover art
    drawDesk: drawDesk,
    drawChair: drawChair,
    blit: blit,
    face: drawFace,
    arms: drawArms,
    shade: shade,
    shadePx: shadePx,
    text: text,
    textWidth: textWidth,
    headPoint: headPoint,
    envelope: envelope,
    motion: motion,
    hand: hand,
    brackets: brackets,
    stamp: stamp,
    bubble: bubble,
    arrow: arrow,
    puff: puff,
    tape: tape,
    server: server,
    serverFace: serverFace,
    sign: sign,
    muteButton: muteButton,
    rr: rr,
    fill: fill,
    stroke: stroke
  };
})();
