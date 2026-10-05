// On Mute: the call, drawn in code. The people in their tiles, the rooms
// behind them, your kitchen, the dishwasher, the cat, and the small pieces
// of interface drawn on the canvas (speech bubbles, stamps, the arrow).
//
// A tile is drawn in its own units: 100 of them from top to bottom, with x
// measured from the middle of the tile, so the person sits in the middle
// however wide the tile is. The room fills the tile's width; the person
// doesn't stretch. on-mute.js scales each tile into the grid.
//
// The people are the house cut-out cartoons (DESIGN.md, section 7): a round
// body, a big round head as wide as the shoulders and no neck, white skin,
// oval eyes with small pupils, furious eyebrows, a frown and a second chin.
// Each one has one thing that tells them apart (a headset, a perm, a bun,
// a camera pointing up their nose). Outline first, flat fills, four inks:
// ink, paper, red and the violet accent. Grey is only ever halftone on white.
(function () {
  "use strict";

  var T = null;          // colour tokens
  var TAU = Math.PI * 2;
  var GAP = 0.32;        // the space between words, in ems (see text())
  var cache = {};
  var tiles = {};
  var DPR = 1;

  function init(tokens, dpr) {
    if (dpr && dpr !== DPR) { cache = {}; tiles = {}; }
    T = tokens;
    DPR = dpr || DPR;
  }
  function flush() { cache = {}; tiles = {}; }
  function ink(name) { return T[name] || name; }
  function edgeFor(colour) { return colour === T.ink ? T.paper : T.ink; }

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
    c.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot || 0, 0, TAU);
  }
  function rr(c, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
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

  // The device pixels per unit at the current transform, so halftone dots
  // come out the same size on screen whatever the drawing's scale
  function unitPx(c) {
    var m = c.getTransform ? c.getTransform() : null;
    return m ? Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) || 1 : 1;
  }
  // Black (or another ink's) halftone dots. spacing in CSS pixels, r as a
  // share of the spacing. Each canvas keeps its own patterns, made once.
  var patterns = window.WeakMap ? new WeakMap() : null;
  function dots(c, colour, spacing, r) {
    var key = colour + spacing + "-" + r + "-" + DPR;
    var s = unitPx(c);
    var mine = patterns && patterns.get(c);
    if (!mine && patterns && !c.svgPattern && c instanceof CanvasRenderingContext2D) { mine = {}; patterns.set(c, mine); }
    var held = mine && mine[key];
    if (held) {
      if (held.s !== s && held.pat.setTransform && window.DOMMatrix) { held.pat.setTransform(new DOMMatrix().scale(1 / s)); held.s = s; }
      return held.pat;
    }
    var tile = tiles[key];
    if (!tile) {
      var n = Math.max(2, Math.round(spacing * DPR));
      tile = document.createElement("canvas");
      tile.width = tile.height = n * 2;
      var x = tile.getContext("2d");
      x.fillStyle = colour;
      [[n / 2, n / 2], [n * 1.5, n * 1.5]].forEach(function (p) {
        x.beginPath();
        x.arc(p[0], p[1], n * r, 0, TAU);
        x.fill();
      });
      tile.dotR = r;     // for anything that wants to redraw the dots (the cover's SVG)
      tiles[key] = tile;
    }
    var pat = c.createPattern(tile, "repeat");
    if (pat.setTransform && window.DOMMatrix) pat.setTransform(new DOMMatrix().scale(1 / s));
    if (mine) mine[key] = { pat: pat, s: s };
    return pat;
  }
  function shade(c) { return dots(c, T.ink, 3.4, 0.27); }
  function shadeLight(c) { return dots(c, T.ink, 4.6, 0.17); }

  // Halftone in the crescent away from the light (top left), like the covers
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
  // Text. Notaste Display's space is narrow, and at the sizes a phone gets,
  // words run together, so display text is drawn a word at a time.
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
  // The people. One thing each tells them apart.
  //   hair: what's on top. shirt: the ink of their top (dots: a halftone
  //   print). special: a tile that isn't just a head and shoulders.
  // ---------------------------------------------------------------------------
  var PEOPLE = {
    you:     { id: "you", name: "Sam (you)", hair: "bed", shirt: "paper", dots: true, collar: true, tie: true, room: "yours" },
    graham:  { id: "graham", name: "Graham (host)", hair: "parting", glasses: true, shirt: "accent", collar: true, room: "shelf" },
    priya:   { id: "priya", name: "Priya", hair: "long", headset: true, shirt: "red", room: "plant" },
    dave:    { id: "dave", name: "Dave", hair: "short", shirt: "paper", dots: true, room: "frame", special: "frozen" },
    gaz:     { id: "gaz", name: "Gaz", hair: "cap", shirt: "ink", room: "ceiling", special: "nose" },
    linda:   { id: "linda", name: "Linda", hair: "perm", shirt: "accent", room: "kitchen", sandwich: true },
    pam:     { id: "pam", name: "Pam", hair: "bun", shirt: "paper", dots: true, pencil: true, room: "blinds" },
    keith:   { id: "keith", name: "Keith (train)", hair: "flatcap", tache: true, shirt: "ink", room: "train", special: "train" },
    bernard: { id: "bernard", name: "Bernard", hair: "wisps", shirt: "paper", room: "blank", special: "forehead" },
    mo:      { id: "mo", name: "Mo (walking)", hair: "band", shirt: "red", room: "outdoors", special: "walk" },
    rupert:  { id: "rupert", name: "Rupert (Head of Vision)", hair: "quiff", shirt: "ink", polo: true, room: "vision" },
    notes:   { id: "notes", name: "Notetaker", special: "bot", room: "none" },
    phone:   { id: "phone", name: "Dialled in", special: "phone", room: "none" },
    tanya:   { id: "tanya", name: "Tanya", hair: "bobble", shirt: "accent", room: "blinds" },
    rob:     { id: "rob", name: "Rob", hair: "bald", bow: true, shirt: "paper", dots: true, room: "shelf" },
    femi:    { id: "femi", name: "Femi", hair: "phones", shirt: "red", room: "frame" },
    hannah:  { id: "hannah", name: "Hannah", hair: "party", shirt: "accent", room: "kitchen" },
    clive:   { id: "clive", name: "Clive", hair: "spiky", lanyard: true, shirt: "ink", room: "office" },
    joy:     { id: "joy", name: "Joy", hair: "fringe", glasses: true, shirt: "red", room: "plant" },
    marcus:  { id: "marcus", name: "Marcus", hair: "beanie", shirt: "paper", dots: true, room: "office" }
  };

  var HY = 52, HR = 24;   // the head: centred on x 0, at y 52, radius 24

  function hairCap(c, colour, low) {
    var a0 = Math.PI + 0.48, a1 = -0.48, R = HR + 1;
    var mid = low ? HY - 17 : HY - 19;
    c.beginPath();
    c.arc(0, HY, R, a0, a1);
    c.quadraticCurveTo(10, mid + 1, 0, mid);
    c.quadraticCurveTo(-10, mid + 1, Math.cos(a0) * R, HY + Math.sin(a0) * R);
    c.closePath();
    fill(c, colour, 2.2);
  }

  function drawHair(c, p) {
    switch (p.hair) {
      case "bed": {
        // bed hair: a cap of hair and three tufts that won't go down
        hairCap(c, T.ink);
        [[-8, -3.1, 1], [2, -1.7, 1.1], [11, -0.6, 0.9]].forEach(function (t) {
          c.save();
          c.translate(t[0], HY - HR + 2);
          c.rotate(t[1] + Math.PI / 2 + 0.2);
          c.beginPath();
          c.moveTo(-3.4, 0);
          c.quadraticCurveTo(0, -12 * t[2], 6 * t[2], -10 * t[2]);
          c.quadraticCurveTo(2, -4, 3.4, 0);
          c.closePath();
          fill(c, T.ink, 1.8, T.ink);
          c.restore();
        });
        break;
      }
      case "parting": {
        hairCap(c, T.ink, true);
        c.beginPath();
        c.moveTo(-7, HY - HR - 0.5);
        c.lineTo(-4.4, HY - 17.5);
        stroke(c, 1.8, T.paper);
        break;
      }
      case "long": {
        // long hair down both sides, behind the shoulders
        c.beginPath();
        c.moveTo(-HR - 2, HY + 4);
        c.quadraticCurveTo(-HR - 6, HY + 30, -HR + 2, HY + 34);
        c.lineTo(-HR + 6, HY - 2);
        c.closePath();
        fill(c, T.ink, 2);
        c.beginPath();
        c.moveTo(HR + 2, HY + 4);
        c.quadraticCurveTo(HR + 6, HY + 30, HR - 2, HY + 34);
        c.lineTo(HR - 6, HY - 2);
        c.closePath();
        fill(c, T.ink, 2);
        hairCap(c, T.ink);
        break;
      }
      case "short": {
        hairCap(c, T.ink);
        break;
      }
      case "perm": {
        var curls = [];
        [-3, -2.62, -2.25, -1.88, -1.57, -1.26, -0.89, -0.52, -0.14].forEach(function (a) { curls.push([a, HR + 0.6, 7]); });
        [-2.3, -1.57, -0.84].forEach(function (a) { curls.push([a, HR - 8, 6.4]); });
        curls.forEach(function (q) {
          ell(c, Math.cos(q[0]) * q[1], HY + Math.sin(q[0]) * q[1], q[2], q[2]);
          fill(c, T.red, 2);
        });
        break;
      }
      case "bun": {
        hairCap(c, T.ink);
        ell(c, 0, HY - HR - 6.5, 10, 8.4);
        fill(c, T.ink, 2);
        c.beginPath();
        c.moveTo(-7, HY - HR - 7);
        c.quadraticCurveTo(0, HY - HR - 3, 7, HY - HR - 7);
        stroke(c, 1.5, T.paper);
        if (p.pencil) {
          c.beginPath();
          c.moveTo(-16, HY - HR - 13);
          c.lineTo(15, HY - HR - 2);
          stroke(c, 5.4, T.ink);
          c.beginPath();
          c.moveTo(-15.4, HY - HR - 12.7);
          c.lineTo(14.2, HY - HR - 2.3);
          stroke(c, 2.8, T.red);
        }
        break;
      }
      case "flatcap": {
        c.beginPath();
        c.ellipse(0, HY - 16, HR + 3, 14, 0, Math.PI, 0);
        c.closePath();
        fill(c, T.paper);
        c.fillStyle = shade(c);
        c.fill();
        stroke(c, 2.2);
        c.beginPath();
        c.ellipse(0, HY - 16, HR - 1, 5, 0, 0, Math.PI);
        c.closePath();
        fill(c, T.paper, 2.2);
        break;
      }
      case "band": {
        // a sweatband, and three loyal hairs
        c.beginPath();
        c.moveTo(-HR + 2, HY - 15.5);
        c.quadraticCurveTo(0, HY - 23, HR - 2, HY - 15.5);
        c.lineTo(HR - 0.6, HY - 8.6);
        c.quadraticCurveTo(0, HY - 16, -HR + 0.6, HY - 8.6);
        c.closePath();
        fill(c, T.accent, 2.1);
        c.beginPath();
        [-4, 0, 4].forEach(function (o) {
          c.moveTo(o, HY - HR + 0.6);
          c.quadraticCurveTo(o + 2.6, HY - HR - 6, o + 5, HY - HR - 4);
        });
        stroke(c, 1.7);
        break;
      }
      case "quiff": {
        hairCap(c, T.ink);
        c.beginPath();
        c.moveTo(-16, HY - 17);
        c.bezierCurveTo(-18, HY - 40, 10, HY - 45, 20, HY - 31);
        c.quadraticCurveTo(7, HY - 33, 7, HY - 17);
        c.closePath();
        fill(c, T.ink, 2.1);
        break;
      }
      case "bobble": {
        c.beginPath();
        c.arc(0, HY, HR + 1.6, Math.PI + 0.42, -0.42);
        c.closePath();
        fill(c, T.accent, 2.2);
        rr(c, -HR - 2.2, HY - 19.5, HR * 2 + 4.4, 7.6, 3);
        fill(c, T.accent, 2.1);
        c.save();
        rr(c, -HR - 2.2, HY - 19.5, HR * 2 + 4.4, 7.6, 3);
        c.clip();
        c.fillStyle = shade(c);
        c.fillRect(-HR - 3, HY - 20, HR * 2 + 6, 9);
        c.restore();
        ell(c, 0, HY - HR - 6, 6.6, 6.2);
        fill(c, T.red, 2.1);
        break;
      }
      case "bald": {
        c.beginPath();
        c.moveTo(-2, HY - HR + 0.4);
        c.quadraticCurveTo(0.4, HY - HR - 6.4, 4.4, HY - HR - 5);
        stroke(c, 1.7);
        break;
      }
      case "phones": {
        hairCap(c, T.ink);
        c.beginPath();
        c.arc(0, HY, HR + 4.2, Math.PI + 0.12, -0.12);
        stroke(c, 6, T.ink);
        c.beginPath();
        c.arc(0, HY, HR + 4.2, Math.PI + 0.12, -0.12);
        stroke(c, 2.4, T.paper);
        [-1, 1].forEach(function (side) {
          ell(c, side * (HR + 2), HY + 1, 7.6, 10);
          fill(c, T.accent, 2.2);
        });
        break;
      }
      case "party": {
        // a party hat. It's their birthday. Nobody has mentioned it.
        c.beginPath();
        c.moveTo(-12.5, HY - HR + 4);
        c.lineTo(4, HY - HR - 23);
        c.lineTo(14, HY - HR + 3.4);
        c.closePath();
        fill(c, T.accent, 2.2);
        c.save();
        c.clip();
        c.beginPath();
        c.moveTo(-14, HY - HR - 3); c.lineTo(15, HY - HR - 11);
        c.moveTo(-14, HY - HR - 14); c.lineTo(15, HY - HR - 22);
        stroke(c, 4.2, T.red);
        c.restore();
        c.beginPath();
        c.moveTo(-12.5, HY - HR + 4);
        c.lineTo(4, HY - HR - 23);
        c.lineTo(14, HY - HR + 3.4);
        stroke(c, 2.2);
        ell(c, 4, HY - HR - 24, 4, 4);
        fill(c, T.paper, 1.8);
        break;
      }
      case "spiky": {
        c.beginPath();
        var pts = 7;
        c.moveTo(-HR + 0.4, HY - 8);
        for (var i = 0; i <= pts; i++) {
          var a = Math.PI + 0.35 + (Math.PI - 0.7) * (i / pts);
          var am = a + (Math.PI - 0.7) / pts / 2;
          c.lineTo(Math.cos(a) * (HR - 2.4), HY + Math.sin(a) * (HR - 2.4));
          if (i < pts) c.lineTo(Math.cos(am) * (HR + 9), HY + Math.sin(am) * (HR + 9));
        }
        c.lineTo(HR - 0.4, HY - 8);
        c.quadraticCurveTo(0, HY - 15, -HR + 0.4, HY - 8);
        c.closePath();
        fill(c, T.ink, 2.1);
        break;
      }
      case "fringe": {
        hairCap(c, T.ink);
        c.beginPath();
        c.moveTo(-HR + 1, HY - 8);
        c.quadraticCurveTo(-HR + 2, HY - HR - 2, 0, HY - HR - 1);
        c.quadraticCurveTo(HR - 2, HY - HR - 2, HR - 1, HY - 8);
        c.lineTo(HR - 6, HY - 12);
        c.lineTo(-HR + 6, HY - 12);
        c.closePath();
        fill(c, T.ink, 2);
        break;
      }
      case "beanie": {
        c.beginPath();
        c.arc(0, HY, HR + 1.6, Math.PI + 0.36, -0.36);
        c.closePath();
        fill(c, T.ink, 2.2, T.ink);
        c.beginPath();
        c.arc(0, HY, HR + 1.6, Math.PI + 0.36, -0.36);
        stroke(c, 1.6, T.paper);
        rr(c, -HR - 2.6, HY - 18, HR * 2 + 5.2, 7.4, 3);
        fill(c, T.red, 2.1);
        break;
      }
      case "wisps": {
        c.beginPath();
        [-14, -6, 3, 12].forEach(function (o, i) {
          c.moveTo(o, HY - HR + 1);
          c.quadraticCurveTo(o + 3, HY - HR - 8 - (i % 2) * 3, o + 7, HY - HR - 5);
        });
        stroke(c, 1.8);
        break;
      }
    }
    if (p.headset) {
      c.beginPath();
      c.arc(0, HY, HR + 3, Math.PI + 0.2, -0.2);
      stroke(c, 5.6, T.ink);
      c.beginPath();
      c.arc(0, HY, HR + 3, Math.PI + 0.2, -0.2);
      stroke(c, 2, T.paper);
      rr(c, -HR - 6, HY - 7, 8, 15, 3);
      fill(c, T.ink, 1.6, T.paper);
      rr(c, HR - 2, HY - 7, 8, 15, 3);
      fill(c, T.ink, 1.6, T.paper);
      c.beginPath();
      c.moveTo(-HR - 2, HY + 6);
      c.quadraticCurveTo(-HR + 2, HY + 17, -11, HY + 16.5);
      stroke(c, 5, T.ink);
      c.beginPath();
      c.moveTo(-HR - 2, HY + 6);
      c.quadraticCurveTo(-HR + 2, HY + 17, -11, HY + 16.5);
      stroke(c, 2.2, T.accent);
      ell(c, -10.4, HY + 16.5, 2.8, 2.5);
      fill(c, T.ink, 1.2, T.paper);
    }
  }

  // The shoulders and whatever they wear
  function drawShoulders(c, p) {
    var shirt = ink(p.shirt || "paper");
    ell(c, 0, 114, 47, 36);
    fill(c, shirt);
    if (p.dots) { c.fillStyle = shadeLight(c); c.fill(); }
    if (shirt !== T.ink) crescent(c, 0, 114, 47, 36);
    ell(c, 0, 114, 47, 36);
    stroke(c, 2.6, edgeFor(shirt));
    if (p.polo) {
      // a polo neck, for vision
      rr(c, -15, 72, 30, 12, 5);
      fill(c, T.ink, 2, T.paper);
    }
    if (p.collar) {
      c.beginPath();
      c.moveTo(-12, 76); c.lineTo(-2.4, 86); c.lineTo(0, 80);
      c.moveTo(12, 76); c.lineTo(2.4, 86); c.lineTo(0, 80);
      c.closePath();
      fill(c, T.paper, 1.8);
    }
    if (p.tie) {
      c.beginPath();
      c.moveTo(-3.4, 80.5); c.lineTo(3.4, 80.5); c.lineTo(2.2, 85); c.lineTo(-2.2, 85);
      c.closePath();
      fill(c, T.red, 1.6);
      c.beginPath();
      c.moveTo(-2.2, 85); c.lineTo(2.2, 85); c.lineTo(5.2, 100); c.lineTo(0, 104); c.lineTo(-5.2, 100);
      c.closePath();
      fill(c, T.red, 1.8);
    }
    if (p.bow) {
      c.beginPath();
      c.moveTo(0, 80); c.lineTo(-10, 75); c.lineTo(-10, 85); c.closePath();
      c.moveTo(0, 80); c.lineTo(10, 75); c.lineTo(10, 85); c.closePath();
      fill(c, T.red, 1.8);
      ell(c, 0, 80, 2.6, 2.6);
      fill(c, T.red, 1.6);
    }
    if (p.lanyard) {
      c.beginPath();
      c.moveTo(-12, 76); c.lineTo(0, 94); c.lineTo(12, 76);
      stroke(c, 4, T.accent);
      rr(c, -6, 92, 12, 11, 1.6);
      fill(c, T.paper, 1.6);
    }
  }

  function drawHead(c, p) {
    ell(c, -HR + 0.6, HY + 3, 4.4, 6);
    fill(c, T.paper, 2.2);
    ell(c, HR - 0.6, HY + 3, 4.4, 6);
    fill(c, T.paper, 2.2);
    ell(c, 0, HY, HR, HR);
    fill(c, T.paper);
    crescent(c, 0, HY, HR, HR, 0.09);
    ell(c, 0, HY, HR, HR);
    stroke(c, 2.6);
    drawHair(c, p);
  }

  // f: { mood, gx, gy, talk }
  //   mood: idle, talk, look, shock, smile, sad, sleep, work, chew
  //   gx, gy: where they're looking, -1 to 1
  function drawFace(c, p, f) {
    var mood = f.mood || "idle";
    var gx = f.gx || 0, gy = f.gy || 0;
    [-1, 1].forEach(function (side) {
      var ex = side * 9, ey = HY - 1;
      if (mood === "smile") {
        c.beginPath();
        c.moveTo(ex - 5, ey + 1.5);
        c.quadraticCurveTo(ex, ey - 4.5, ex + 5, ey + 1.5);
        stroke(c, 2.4);
        return;
      }
      var big = mood === "shock" ? 1.18 : 1;
      ell(c, ex, ey, 5.6 * big, 6.8 * big);
      fill(c, T.paper, 2);
      var pr = mood === "shock" ? 1.6 : 2.3;
      ell(c, ex + gx * 2.4, ey + gy * 2.9, pr, pr * 1.06);
      fill(c, T.ink);
      if (mood === "sleep" || mood === "work") {
        // heavy lids: frozen mid-blink, or looking down at a spreadsheet
        c.save();
        ell(c, ex, ey, 5.6, 6.8);
        c.clip();
        c.fillStyle = T.ink;
        c.fillRect(ex - 7, ey - 8, 14, mood === "sleep" ? 8.6 : 5.4);
        c.restore();
        c.beginPath();
        c.moveTo(ex - 5.4, ey + (mood === "sleep" ? 0.6 : -2.6));
        c.lineTo(ex + 5.4, ey + (mood === "sleep" ? 0.6 : -2.6));
        stroke(c, 1.4, T.paper);
      }
    });
    if (p.glasses) {
      c.beginPath();
      rrPath(c, -16.8, HY - 8, 14.6, 13.6, 3.4);
      rrPath(c, 2.2, HY - 8, 14.6, 13.6, 3.4);
      c.moveTo(-2.2, HY - 2.6); c.lineTo(2.2, HY - 2.6);
      stroke(c, 2.4);
    }
    // eyebrows: furious at all times, down at the middle
    c.beginPath();
    if (mood === "sad") {
      c.moveTo(-3, HY - 13.5); c.lineTo(-15, HY - 9);
      c.moveTo(3, HY - 13.5); c.lineTo(15, HY - 9);
    } else if (mood === "shock") {
      c.moveTo(-3.6, HY - 15); c.quadraticCurveTo(-9, HY - 19, -15.4, HY - 15);
      c.moveTo(3.6, HY - 15); c.quadraticCurveTo(9, HY - 19, 15.4, HY - 15);
    } else if (mood === "smile") {
      c.moveTo(-3, HY - 12); c.quadraticCurveTo(-9, HY - 16, -15, HY - 12.6);
      c.moveTo(3, HY - 12); c.quadraticCurveTo(9, HY - 16, 15, HY - 12.6);
    } else {
      var steep = mood === "talk" || mood === "look" ? 1.6 : 0;
      c.moveTo(-2.6, HY - 9.8 + steep * 0.4); c.lineTo(-15.4, HY - 14.6 - steep);
      c.moveTo(2.6, HY - 9.8 + steep * 0.4); c.lineTo(15.4, HY - 14.6 - steep);
    }
    stroke(c, 3.6);
    // the mouth
    var my = HY + 12.6;
    if (mood === "talk" || mood === "chew") {
      var open = mood === "chew" ? 0.6 + Math.abs(f.talk || 0) * 1.6 : 1.2 + Math.abs(f.talk || 0) * 4.2;
      ell(c, 0, my + 0.6, 5.2, open);
      fill(c, T.ink);
      if (open > 3.4) { ell(c, 0, my + open * 0.55, 2.8, 1.2); fill(c, T.red); }
    } else if (mood === "shock") {
      ell(c, 0, my + 1.4, 4.4, 5.4);
      fill(c, T.ink);
    } else if (mood === "smile") {
      c.beginPath();
      c.moveTo(-7.4, my - 1.6);
      c.quadraticCurveTo(0, my + 10, 7.4, my - 1.6);
      c.closePath();
      fill(c, T.ink);
      ell(c, 0, my + 3, 3, 1.5);
      fill(c, T.red);
    } else if (mood === "sad" || mood === "sleep") {
      c.beginPath();
      c.moveTo(-6, my + 2.6);
      c.quadraticCurveTo(0, my - 3.4, 6, my + 2.6);
      stroke(c, 2.3);
    } else if (mood === "work") {
      c.beginPath();
      c.moveTo(-5.4, my + 1);
      c.lineTo(5.4, my + 0.4);
      stroke(c, 2.3);
    } else {
      c.beginPath();
      c.moveTo(-7, my + 1.6);
      c.quadraticCurveTo(0, my - 3, 7, my + 1.6);
      stroke(c, 2.3);
    }
    if (p.tache) {
      c.beginPath();
      c.moveTo(-9.4, my - 1.6);
      c.quadraticCurveTo(-5, my - 7, 0, my - 4.6);
      c.quadraticCurveTo(5, my - 7, 9.4, my - 1.6);
      c.quadraticCurveTo(0, my - 3, -9.4, my - 1.6);
      fill(c, T.ink);
    }
    // the second chin
    c.beginPath();
    c.moveTo(-10, HY + 19.6);
    c.quadraticCurveTo(0, HY + 23.4, 10, HY + 19.6);
    stroke(c, 2);
  }
  function rrPath(c, x, y, w, h, r) {
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  // A mitten, for waving a sandwich about or nodding along
  function mitten(c, x, y, rot) {
    c.save();
    c.translate(x, y);
    c.rotate(rot || 0);
    ell(c, 0, 0, 7.4, 6.4);
    fill(c, T.paper, 2.2);
    ell(c, -5.6, -2.4, 3, 2.6);
    fill(c, T.paper, 1.8);
    c.restore();
  }

  // ---------------------------------------------------------------------------
  // Rooms: what's behind each person. ww is the tile's width in units.
  // ---------------------------------------------------------------------------
  function wall(c, ww, colour) {
    c.fillStyle = colour || T.paper;
    c.fillRect(-ww / 2, 0, ww, 100);
    c.fillStyle = shadeLight(c);
    c.fillRect(-ww / 2, 0, ww, 100);
  }

  function drawRoom(c, kind, ww) {
    var L = -ww / 2, R = ww / 2;
    switch (kind) {
      case "none":
        c.fillStyle = T.ink;
        c.fillRect(L, 0, ww, 100);
        break;
      case "shelf": {
        wall(c, ww);
        // a bookshelf behind the left shoulder, as seen in every call
        var sx = Math.max(L + 4, -78), sw = 42;
        rr(c, sx, 8, sw, 92, 2);
        fill(c, T.paper, 2.2);
        [36, 66].forEach(function (y) { c.beginPath(); c.moveTo(sx, y); c.lineTo(sx + sw, y); stroke(c, 2.2); });
        var books = [[4, 9, "accent"], [5, 11, "ink"], [4, 8, "red"], [6, 12, "paper"], [4, 10, "accent"], [5, 9, "ink"], [4, 11, "paper"]];
        [36, 66].forEach(function (y, row) {
          var x = sx + 3;
          books.forEach(function (b, i) {
            var h = b[1] + 10 + ((i + row) % 3) * 2;
            var w = b[0] + 1;
            if (x + w > sx + sw - 3) return;
            c.beginPath();
            if (i === 4 && row === 1) { c.save(); c.translate(x, y); c.rotate(-0.3); c.rect(0, -h, w, h); c.restore(); }
            else c.rect(x, y - h, w, h);
            fill(c, ink(b[2]), 1.6);
            x += w + 0.6;
          });
        });
        // and a plant on the right, for credibility
        drawPlantPot(c, Math.min(R - 16, 62), 100, 0.8);
        break;
      }
      case "plant": {
        wall(c, ww);
        drawPlantPot(c, Math.min(R - 20, 58), 100, 1.15);
        // a light switch
        rr(c, L + 10, 40, 8, 12, 1.4);
        fill(c, T.paper, 1.6);
        break;
      }
      case "frame": {
        wall(c, ww);
        c.save();
        c.translate(Math.max(L + 30, -60), 30);
        c.rotate(-0.08);
        rr(c, -18, -13, 36, 26, 1.4);
        fill(c, T.ink, 2);
        rr(c, -14, -9, 28, 18, 0.6);
        fill(c, T.paper);
        // a hill and a sun: someone's holiday
        c.beginPath();
        c.moveTo(-14, 8); c.quadraticCurveTo(-4, -4, 14, 6); c.lineTo(14, 9); c.lineTo(-14, 9);
        c.closePath();
        fill(c, T.accent);
        ell(c, 7, -3, 3, 3);
        fill(c, T.red);
        c.restore();
        break;
      }
      case "kitchen": {
        wall(c, ww);
        // cupboards along the top and tiles behind
        for (var x = L; x < R; x += 34) {
          rr(c, x + 1, -4, 32, 28, 1);
          fill(c, T.paper, 2);
          rr(c, x + 14, 14, 6, 3, 1);
          fill(c, T.ink);
        }
        c.beginPath();
        for (var gy = 34; gy < 100; gy += 11) { c.moveTo(L, gy); c.lineTo(R, gy); }
        for (var gx = L; gx < R; gx += 11) { c.moveTo(gx, 28); c.lineTo(gx, 100); }
        stroke(c, 0.8);
        // the kettle
        var kx = Math.max(L + 18, -64);
        c.beginPath();
        c.moveTo(kx - 9, 100); c.lineTo(kx - 7, 80); c.quadraticCurveTo(kx, 74, kx + 7, 80); c.lineTo(kx + 9, 100);
        c.closePath();
        fill(c, T.red, 2);
        c.beginPath();
        c.moveTo(kx + 8, 84); c.quadraticCurveTo(kx + 15, 86, kx + 9, 94);
        stroke(c, 2.2);
        break;
      }
      case "blinds": {
        wall(c, ww);
        var bx = Math.max(L + 6, -76), bw = 48;
        rr(c, bx, 10, bw, 60, 1);
        fill(c, T.paper, 2.2);
        c.beginPath();
        for (var by = 16; by < 70; by += 5.4) { c.moveTo(bx + 2, by); c.lineTo(bx + bw - 2, by); }
        stroke(c, 1.3);
        c.beginPath();
        c.moveTo(bx + bw - 6, 10); c.lineTo(bx + bw - 6, 78);
        stroke(c, 1.2);
        break;
      }
      case "ceiling": {
        // the camera points up: the ceiling, and its light
        c.fillStyle = T.paper;
        c.fillRect(L, 0, ww, 100);
        c.fillStyle = shade(c);
        c.fillRect(L, 0, ww, 100);
        var lx = Math.min(R - 22, 48);
        ell(c, lx, 18, 13, 13);
        fill(c, T.paper, 2.2);
        c.beginPath();
        for (var a = 0; a < 8; a++) {
          var an = a / 8 * TAU;
          c.moveTo(lx + Math.cos(an) * 17, 18 + Math.sin(an) * 17);
          c.lineTo(lx + Math.cos(an) * 23, 18 + Math.sin(an) * 23);
        }
        stroke(c, 2);
        break;
      }
      case "train": {
        c.fillStyle = T.ink;
        c.fillRect(L, 0, ww, 100);
        break;
      }
      case "blank": {
        wall(c, ww);
        break;
      }
      case "outdoors": {
        c.fillStyle = T.paper;
        c.fillRect(L, 0, ww, 100);
        break;
      }
      case "office": {
        wall(c, ww);
        var wx = Math.max(L + 6, -82);
        rr(c, wx, 10, 58, 40, 2);
        fill(c, T.paper, 2.2);
        c.beginPath();
        c.moveTo(wx + 6, 20); c.lineTo(wx + 36, 18);
        c.moveTo(wx + 6, 28); c.quadraticCurveTo(wx + 20, 24, wx + 30, 30);
        c.moveTo(wx + 6, 38); c.lineTo(wx + 26, 37);
        stroke(c, 1.6, T.accent);
        ell(c, wx + 46, 30, 6, 6);
        stroke(c, 1.6, T.red);
        break;
      }
      case "vision": {
        // a canvas print of a mountain: vision
        wall(c, ww);
        var vx = Math.max(L + 8, -84);
        rr(c, vx, 8, 50, 40, 1);
        fill(c, T.ink, 2);
        c.beginPath();
        c.moveTo(vx + 3, 45); c.lineTo(vx + 20, 18); c.lineTo(vx + 28, 30); c.lineTo(vx + 34, 22); c.lineTo(vx + 47, 45);
        c.closePath();
        fill(c, T.accent);
        c.beginPath();
        c.moveTo(vx + 16, 24); c.lineTo(vx + 20, 18); c.lineTo(vx + 24, 24);
        stroke(c, 2, T.paper);
        drawPlantPot(c, Math.min(R - 18, 66), 100, 1);
        break;
      }
      case "yours":
        drawYourRoom(c, ww, {});
        break;
    }
  }

  function drawPlantPot(c, x, y, s) {
    c.save();
    c.translate(x, y);
    c.scale(s, s);
    [[-0.55, 22], [0.5, 20], [0.05, 27], [-1, 15], [1.05, 14]].forEach(function (l) {
      ell(c, Math.sin(l[0]) * 12, -30 - Math.cos(l[0]) * 10, 5, l[1] / 2 + 2, l[0]);
      fill(c, T.ink, 1.8, T.ink);
      c.beginPath();
      c.moveTo(Math.sin(l[0]) * 6, -24 - Math.cos(l[0]) * 4);
      c.lineTo(Math.sin(l[0]) * 15, -32 - Math.cos(l[0]) * 14);
      stroke(c, 1.2, T.paper);
    });
    c.beginPath();
    c.moveTo(-11, -22); c.lineTo(11, -22); c.lineTo(8, 0); c.lineTo(-8, 0);
    c.closePath();
    fill(c, T.accent, 2);
    c.restore();
  }

  // Your kitchen: the dishwasher on the left, the door on the right (that's
  // where the cat comes in). s: { door (0..1 open), shake (0..1), suds (0..1), t }
  function yourDoorX(ww) { return Math.min(ww / 2 - 30, 58); }
  function yourDishX(ww) { return Math.max(-ww / 2 + 8, -86); }
  function drawYourRoom(c, ww, s) {
    var L = -ww / 2;
    wall(c, ww);
    // the door, and the hall behind it
    var dx = yourDoorX(ww), dw = 26, top = 14;
    rr(c, dx - 3, top - 3, dw + 6, 100 - top + 6, 1);
    fill(c, T.paper, 2.2);
    var open = Math.max(0, Math.min(1, s.door || 0));
    c.fillStyle = T.ink;
    c.fillRect(dx, top, dw, 100 - top);
    // the door itself swings in: its visible width shrinks as it opens
    var vis = dw * (1 - open * 0.78);
    c.beginPath();
    c.rect(dx + dw - vis, top, vis, 100 - top);
    fill(c, T.paper, 2);
    c.save();
    c.beginPath();
    c.rect(dx + dw - vis, top, vis, 100 - top);
    c.clip();
    c.fillStyle = shadeLight(c);
    c.fillRect(dx, top, dw, 100 - top);
    rr(c, dx + dw - vis + vis * 0.18, top + 8, vis * 0.64, 26, 1);
    stroke(c, 1.4);
    rr(c, dx + dw - vis + vis * 0.18, top + 42, vis * 0.64, 30, 1);
    stroke(c, 1.4);
    c.restore();
    ell(c, dx + dw - vis + 4, 62, 1.8, 1.8);
    fill(c, T.ink);
    // the dishwasher, under a worktop
    var kx = yourDishX(ww), kw = 40;
    var sh = s.shake || 0;
    var jx = sh ? Math.sin((s.t || 0) * 70) * sh * 1.2 : 0, jy = sh ? Math.cos((s.t || 0) * 53) * sh * 0.8 : 0;
    c.beginPath();
    c.rect(L - 2, 52, kx + kw + 10 - L, 6);
    fill(c, T.paper, 2.2);
    c.save();
    c.translate(jx, jy);
    rr(c, kx, 58, kw, 46, 1);
    fill(c, T.paper, 2.2);
    c.beginPath();
    c.rect(kx, 58, kw, 9);
    fill(c, T.ink, 2);
    ell(c, kx + 8, 62.5, 2.4, 2.4);
    fill(c, sh ? T.red : T.accent);
    ell(c, kx + 15, 62.5, 1.6, 1.6);
    fill(c, T.paper);
    rr(c, kx + 9, 72, kw - 18, 3.4, 1.4);
    fill(c, T.ink);
    c.save();
    rr(c, kx, 67, kw, 37, 1);
    c.clip();
    c.fillStyle = shade(c);
    c.fillRect(kx + kw * 0.62, 67, kw, 40);
    c.restore();
    c.restore();
    if (sh > 0.05) {
      // it's going: motion lines either side
      c.beginPath();
      [[kx - 4, 70], [kx - 6, 80], [kx + kw + 4, 72], [kx + kw + 6, 84]].forEach(function (p, i) {
        var dir = i < 2 ? -1 : 1;
        c.moveTo(p[0], p[1]);
        c.lineTo(p[0] + dir * 5 * sh, p[1] - 1);
      });
      stroke(c, 2, T.ink);
    }
    if (s.suds > 0) {
      // the suds give it away
      var k = s.suds;
      [[0.2, 0, 7], [0.5, -4, 9], [0.8, 1, 6], [0.35, -9, 5], [0.65, -11, 6]].forEach(function (b, i) {
        var r = b[2] * Math.min(1, k * 1.6 + i * 0.05);
        var bxp = kx + kw * b[0], byp = 58 + b[1] - k * 6;
        ell(c, bxp + 1.4, byp + 1.4, r, r);
        fill(c, T.accent);
        ell(c, bxp, byp, r, r);
        fill(c, T.paper, 1.4);
      });
    }
  }

  // ---------------------------------------------------------------------------
  // The cat. Ink with a paper edge, paper eyes with slits, a tail with
  // opinions. pose: "eyes" (in the doorway), "walk" (side on), "bum" (on the
  // desk, right in front of the camera, facing away).
  // ---------------------------------------------------------------------------
  function catEyes(c, x, y, s, blink) {
    c.save();
    c.translate(x, y);
    c.scale(s, s);
    [-1, 1].forEach(function (side) {
      c.beginPath();
      c.ellipse(side * 6, 0, 4.4, blink ? 0.6 : 3.2, 0, 0, TAU);
      fill(c, T.paper);
      if (!blink) {
        ell(c, side * 6, 0, 0.9, 2.6);
        fill(c, T.ink);
      }
    });
    c.restore();
  }

  function cat(c, x, y, s, pose, t, dir) {
    c.save();
    c.translate(x, y);
    c.scale(s * (dir || 1), s);
    var step = Math.sin((t || 0) * 12);
    if (pose === "walk") {
      // legs
      c.beginPath();
      [[-14, step], [-8, -step], [10, -step], [16, step]].forEach(function (l) {
        c.moveTo(l[0], 2);
        c.lineTo(l[0] + l[1] * 3, 15);
      });
      stroke(c, 7.4, T.paper);
      c.beginPath();
      [[-14, step], [-8, -step], [10, -step], [16, step]].forEach(function (l) {
        c.moveTo(l[0], 2);
        c.lineTo(l[0] + l[1] * 3, 15);
      });
      stroke(c, 4.4, T.ink);
      // tail, up
      c.beginPath();
      c.moveTo(-18, -4);
      c.quadraticCurveTo(-34, -12, -28, -30 + step * 2);
      stroke(c, 7.4, T.paper);
      c.beginPath();
      c.moveTo(-18, -4);
      c.quadraticCurveTo(-34, -12, -28, -30 + step * 2);
      stroke(c, 4.4, T.ink);
      ell(c, 0, 0, 22, 10);
      fill(c, T.ink, 2.2, T.paper);
      // head, ears
      c.beginPath();
      c.moveTo(18, -14); c.lineTo(21, -26); c.lineTo(26, -16);
      c.moveTo(27, -15); c.lineTo(33, -24); c.lineTo(34, -12);
      fill(c, T.ink, 2.2, T.paper);
      ell(c, 26, -8, 10, 9);
      fill(c, T.ink, 2.2, T.paper);
      ell(c, 30, -9, 2.6, 2.2);
      fill(c, T.paper);
      ell(c, 30.6, -9, 0.7, 1.8);
      fill(c, T.ink);
      c.beginPath();
      c.moveTo(34, -5); c.lineTo(42, -7);
      c.moveTo(34, -3); c.lineTo(42, -2);
      stroke(c, 1, T.paper);
    } else if (pose === "bum") {
      // Right up against the camera, facing away. Two curves and a tail.
      var sway = Math.sin((t || 0) * 5) * 0.18;
      c.beginPath();
      c.moveTo(0, -30);
      c.quadraticCurveTo(-4 + sway * 20, -58, 10 + sway * 30, -74);
      stroke(c, 12, T.paper);
      c.beginPath();
      c.moveTo(0, -30);
      c.quadraticCurveTo(-4 + sway * 20, -58, 10 + sway * 30, -74);
      stroke(c, 8, T.ink);
      // the ears, peeking over the back
      c.beginPath();
      c.moveTo(-24, -40); c.lineTo(-20, -56); c.lineTo(-12, -42);
      c.moveTo(12, -42); c.lineTo(20, -56); c.lineTo(24, -40);
      fill(c, T.ink, 2.4, T.paper);
      // the tail's white tip
      ell(c, 10 + sway * 30, -74, 5.2, 5.2);
      fill(c, T.paper, 2, T.ink);
      ell(c, 0, -4, 36, 36);
      fill(c, T.ink, 2.6, T.paper);
      // the haunches: two curves and a line
      c.beginPath();
      c.moveTo(-30, 18); c.quadraticCurveTo(-18, -4, -2, 14);
      c.moveTo(30, 18); c.quadraticCurveTo(18, -4, 2, 14);
      c.moveTo(0, -24); c.lineTo(0, -14);
      stroke(c, 2.2, T.paper);
      // back paws
      ell(c, -16, 30, 9, 5.4);
      fill(c, T.paper, 2.2, T.ink);
      ell(c, 16, 30, 9, 5.4);
      fill(c, T.paper, 2.2, T.ink);
    }
    c.restore();
  }

  // ---------------------------------------------------------------------------
  // A tile's still parts (the room, the shoulders and the head), kept as a
  // bitmap at this size. Faces, hands and anything that moves are drawn live.
  // ---------------------------------------------------------------------------
  function tileSprite(p, w, h) {
    var key = p.id + "-" + w + "x" + h + "-" + DPR;
    var hit = cache[key];
    if (hit) return hit;
    var cv = document.createElement("canvas");
    cv.width = Math.max(1, Math.round(w * DPR));
    cv.height = Math.max(1, Math.round(h * DPR));
    var c = cv.getContext("2d");
    var k = h / 100;
    c.scale(DPR, DPR);
    c.translate(w / 2, 0);
    c.scale(k, k);
    var ww = w / k;
    drawRoom(c, p.room, ww);
    if (!p.special || p.special === "frozen") {
      drawShoulders(c, p);
      drawHead(c, p);
    }
    hit = cache[key] = cv;
    return hit;
  }

  // A whole tile's person, in tile units (the room has been drawn). f is the
  // face. Specials draw everything themselves.
  function person(c, p, f, t, ww) {
    if (p.special === "nose") return nose(c, p, f, t);
    if (p.special === "forehead") return forehead(c, p, f, t);
    if (p.special === "bot") return bot(c, f, t, ww);
    if (p.special === "phone") return phone(c, f, t, ww);
    if (p.special === "train") return train(c, p, f, t, ww);
    if (p.special === "walk") return walking(c, p, f, t, ww);
    drawFace(c, p, f);
    if (p.sandwich && f.mood === "chew") {
      // lunch, on camera
      c.save();
      c.translate(10, HY + 22);
      c.rotate(-0.25);
      c.beginPath();
      c.moveTo(-12, 4); c.lineTo(12, -6); c.lineTo(12, 4); c.closePath();
      fill(c, T.paper, 2);
      c.beginPath();
      c.moveTo(-12, 4); c.lineTo(12, -2);
      stroke(c, 2.4, T.accent);
      c.restore();
      mitten(c, 18, HY + 30, -0.6);
    }
    if (p.special === "frozen") pixels(c, t);
  }

  // Dave's connection: blocks of his face that haven't arrived
  function pixels(c, t) {
    var phase = Math.floor((t || 0) * 2) % 3;
    var blocks = [[-14, 40, 9], [6, 58, 8], [-4, 64, 6], [13, 44, 7], [-20, 62, 7]];
    blocks.forEach(function (b, i) {
      if ((i + phase) % 3 === 0) return;
      c.beginPath();
      c.rect(b[0], b[1], b[2], b[2]);
      fill(c, i % 2 ? T.ink : T.paper, 1);
    });
  }

  // Gaz: the camera is on his desk, pointing up
  function nose(c, p, f, t) {
    var cy = 84, r = 48;
    ell(c, 0, cy, r, r * 0.92);
    fill(c, T.paper);
    crescent(c, 0, cy, r, r * 0.92, 0.08);
    ell(c, 0, cy, r, r * 0.92);
    stroke(c, 2.6);
    // a backwards cap, from underneath
    c.beginPath();
    c.arc(0, cy, r + 1, Math.PI + 0.62, -0.62);
    c.quadraticCurveTo(0, cy - r * 0.62, Math.cos(Math.PI + 0.62) * (r + 1), cy + Math.sin(Math.PI + 0.62) * (r + 1));
    c.closePath();
    fill(c, T.red, 2.4);
    // small eyes up top, looking down at the screen
    [-1, 1].forEach(function (side) {
      ell(c, side * 13, cy - 30, 4.4, 4);
      fill(c, T.paper, 1.8);
      ell(c, side * 13 + (f.gx || 0) * 1.6, cy - 28.6, 1.7, 1.7);
      fill(c, T.ink);
    });
    c.beginPath();
    c.moveTo(-4, cy - 37); c.lineTo(-19, cy - 40);
    c.moveTo(4, cy - 37); c.lineTo(19, cy - 40);
    stroke(c, 3);
    // nostrils, and plenty of chin
    ell(c, -5.4, cy - 13, 3, 2.2, -0.3);
    fill(c, T.ink);
    ell(c, 5.4, cy - 13, 3, 2.2, 0.3);
    fill(c, T.ink);
    var open = f.mood === "talk" ? 1 + Math.abs(f.talk || 0) * 3.4 : 0;
    if (open) { ell(c, 0, cy - 1, 7, open); fill(c, T.ink); }
    else { c.beginPath(); c.moveTo(-8, cy); c.quadraticCurveTo(0, cy - 3.6, 8, cy); stroke(c, 2.2); }
    c.beginPath();
    c.moveTo(-14, cy + 14); c.quadraticCurveTo(0, cy + 19, 14, cy + 14);
    c.moveTo(-18, cy + 24); c.quadraticCurveTo(0, cy + 30, 18, cy + 24);
    stroke(c, 2);
  }

  // Bernard: the camera is about four inches from his forehead
  function forehead(c, p, f, t) {
    var cy = 132, r = 96;
    ell(c, 0, cy, r, r);
    fill(c, T.paper);
    crescent(c, 0, cy, r, r, 0.07);
    ell(c, 0, cy, r, r);
    stroke(c, 2.8);
    c.beginPath();
    [-30, -14, 4, 22].forEach(function (o, i) {
      c.moveTo(o, cy - r + 2);
      c.quadraticCurveTo(o + 6, cy - r - 10 - (i % 2) * 4, o + 14, cy - r - 6);
    });
    stroke(c, 2.2);
    // wrinkles of concentration
    c.beginPath();
    c.moveTo(-24, 62); c.quadraticCurveTo(0, 58, 24, 62);
    c.moveTo(-18, 70); c.quadraticCurveTo(0, 66, 18, 70);
    stroke(c, 1.8);
    c.beginPath();
    var lift = f.mood === "talk" ? Math.abs(f.talk || 0) * 3 : 0;
    c.moveTo(-6, 88 - lift); c.lineTo(-38, 80 - lift);
    c.moveTo(6, 88 - lift); c.lineTo(38, 80 - lift);
    stroke(c, 6);
    [-1, 1].forEach(function (side) {
      ell(c, side * 22, 104, 11, 10);
      fill(c, T.paper, 2.4);
      ell(c, side * 22 + (f.gx || 0) * 4, 100 + (f.gy || 0) * 2, 4, 4);
      fill(c, T.ink);
    });
  }

  // The notetaker: nobody invited it. It's recording.
  function bot(c, f, t, ww) {
    c.fillStyle = T.ink;
    c.fillRect(-ww / 2, 0, ww, 100);
    c.beginPath();
    c.moveTo(0, 26); c.lineTo(0, 14);
    stroke(c, 2.4, T.paper);
    ell(c, 0, 12, 3.4, 3.4);
    fill(c, T.red, 1.6, T.paper);
    rr(c, -24, 26, 48, 38, 6);
    fill(c, T.paper, 2.4, T.ink);
    rr(c, -18, 33, 36, 18, 3);
    fill(c, T.ink);
    var blink = Math.sin((t || 0) * 1.7) > 0.96;
    [-1, 1].forEach(function (side) {
      c.beginPath();
      c.rect(side * 8 - 3.4, 38.4, 6.8, blink ? 1.4 : 6.8);
      c.fillStyle = T.accent;
      c.fill();
    });
    c.beginPath();
    c.moveTo(-8, 58); c.lineTo(8, 58);
    stroke(c, 2.2, T.ink);
    rr(c, -16, 64, 32, 14, 3);
    fill(c, T.paper, 2.4, T.ink);
  }

  // Someone who dialled in: a phone, and nothing else
  function phone(c, f, t, ww) {
    c.fillStyle = T.ink;
    c.fillRect(-ww / 2, 0, ww, 100);
    ell(c, 0, 48, 24, 24);
    fill(c, T.ink, 2.4, T.paper);
    c.save();
    c.translate(0, 48);
    c.rotate(-0.6);
    rr(c, -4, -15, 8, 30, 3);
    fill(c, T.paper);
    rr(c, -7.4, -16, 14.8, 8, 3);
    fill(c, T.paper);
    rr(c, -7.4, 8, 14.8, 8, 3);
    fill(c, T.paper);
    c.restore();
  }

  // Keith is on a train. The view goes past; now and then, a tunnel.
  function train(c, p, f, t, ww) {
    var L = -ww / 2, tunnel = f.tunnel || 0;
    c.fillStyle = T.paper;
    c.fillRect(L, 0, ww, 100);
    // the window, and the countryside going by
    rr(c, L + 6, 8, ww - 12, 64, 8);
    c.save();
    c.clip();
    c.fillStyle = T.paper;
    c.fillRect(L, 0, ww, 100);
    var off = ((t || 0) * 60) % 70;
    for (var x = L - 70 + 70 - off; x < ww / 2 + 70; x += 70) {
      c.beginPath();
      c.moveTo(x, 72); c.quadraticCurveTo(x + 18, 40, x + 36, 72);
      fill(c, T.accent, 2);
      c.beginPath();
      c.moveTo(x + 50, 20); c.lineTo(x + 50, 72);
      stroke(c, 2.4);
    }
    c.restore();
    rr(c, L + 6, 8, ww - 12, 64, 8);
    stroke(c, 2.4);
    // the seat
    rr(c, -44, 30, 88, 80, 16);
    fill(c, T.red, 2.4);
    c.save();
    rr(c, -44, 30, 88, 80, 16);
    c.clip();
    c.fillStyle = shade(c);
    c.fillRect(14, 30, 40, 80);
    c.restore();
    drawShoulders(c, p);
    drawHead(c, p);
    drawFace(c, p, f);
    if (tunnel > 0) {
      c.globalAlpha *= Math.min(1, tunnel);
      c.fillStyle = T.ink;
      c.fillRect(L, 0, ww, 100);
      c.globalAlpha = 1;
    }
  }

  // Mo is walking. The trees go by and the picture bounces.
  function walking(c, p, f, t, ww) {
    var L = -ww / 2;
    var bob = Math.abs(Math.sin((t || 0) * 5)) * 3;
    c.fillStyle = T.paper;
    c.fillRect(L, 0, ww, 100);
    var off = ((t || 0) * 30) % 60;
    for (var x = L - 60 + 60 - off; x < ww / 2 + 60; x += 60) {
      c.beginPath();
      c.moveTo(x, 100); c.lineTo(x, 50);
      stroke(c, 3);
      ell(c, x, 38, 16, 18);
      fill(c, T.ink, 2, T.ink);
      c.save();
      ell(c, x, 38, 16, 18);
      c.clip();
      c.fillStyle = dots(c, T.paper, 3.4, 0.22);
      c.fillRect(x - 18, 18, 36, 40);
      c.restore();
    }
    c.save();
    c.translate(0, bob);
    drawShoulders(c, p);
    drawHead(c, p);
    drawFace(c, p, f);
    c.restore();
  }

  // ---------------------------------------------------------------------------
  // You, live: every frame, because you nod, look up, talk and look down at
  // the spreadsheet. f: { mood, gx, gy, talk, nod (0..1, how far through a
  // nod), lean }.
  // ---------------------------------------------------------------------------
  function you(c, p, f) {
    var dip = f.nod ? Math.sin(f.nod * Math.PI * 2) * 7 : 0;     // two nods
    drawShoulders(c, p);
    c.save();
    c.translate(0, Math.max(0, dip) + (f.lean || 0));
    drawHead(c, p);
    drawFace(c, p, f);
    c.restore();
  }

  // ---------------------------------------------------------------------------
  // Screen-pixel pieces: drawn with the canvas at CSS pixel scale
  // ---------------------------------------------------------------------------

  // A speech bubble: paper, a thick ink outline, rounded corners, a tail to
  // the speaker, capitals. box: { x, y, w, h }; tail: the point it aims at.
  // hi: a word (your name) to underline in the accent.
  function bubble(c, box, tail, lines, size, alpha, edge, hi) {
    var x = box.x, y = box.y, w = box.w, h = box.h;
    var r = Math.min(8, h / 2);
    c.save();
    c.globalAlpha *= alpha;
    c.beginPath();
    var below = tail.y > y + h, above = tail.y < y, left = !below && !above && tail.x < x;
    var tx = Math.max(x + 10, Math.min(x + w - 10, tail.x)), ty = Math.max(y + 8, Math.min(y + h - 8, tail.y));
    var tw = Math.min(6, w / 5);
    var gapY = below ? tail.y - (y + h) : above ? y - tail.y : 0;
    var gapX = left ? x - tail.x : tail.x - (x + w);
    var reach = Math.max(size * 0.5, Math.min(18, (below || above ? gapY : gapX) - 1));
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
    c.lineWidth = edge === T.accent ? 3.2 : 2.4;
    c.lineJoin = "round";
    c.strokeStyle = edge || T.ink;
    c.stroke();
    c.font = size + "px " + T.display;
    c.fillStyle = T.ink;
    c.textAlign = "left";
    c.textBaseline = "top";
    var lh = size * 1.04;
    lines.forEach(function (l, i) {
      var lw = textWidth(c, l, size);
      var lx = x + (w - lw) / 2, ly = y + (h - lines.length * lh) / 2 + i * lh + size * 0.08;
      if (hi) {
        // underline the word that matters (your name)
        var words = l.split(" "), at = lx;
        words.forEach(function (word, n) {
          var ww = c.measureText(word).width;
          if (word.replace(/[^A-Z]/g, "") === hi) {
            c.fillStyle = T.accent;
            c.fillRect(at - 1, ly + size * 0.86, ww + 2, Math.max(2, size * 0.16));
          }
          at += ww + size * GAP;
          if (n === words.length - 1) c.fillStyle = T.ink;
        });
        c.fillStyle = T.ink;
      }
      text(c, l, lx, ly, size);
    });
    c.restore();
  }

  // A small rubber stamp: paper, a red double border, red capitals
  function stamp(c, x, y, label, size, tilt, alpha, grow, colour) {
    var col = colour || T.red;
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
    c.strokeStyle = col;
    c.strokeRect(-w / 2, -h / 2, w, h);
    c.lineWidth = Math.max(0.8, size * 0.06);
    c.strokeRect(-w / 2 + size * 0.22, -h / 2 + size * 0.22, w - size * 0.44, h - size * 0.44);
    c.fillStyle = col;
    c.textAlign = "center";
    c.textBaseline = "middle";
    text(c, label.toUpperCase(), 0, size * 0.06, size);
    c.restore();
    return { w: w * grow, h: h * grow };
  }

  // A bobbing arrow pointing down at x, y (or left at it, dir "left"), with
  // a word over it
  function arrow(c, x, y, word, size, dir, maxRight) {
    var s = size / 22;
    c.save();
    c.translate(x, y);
    c.scale(s, s);
    c.save();
    if (dir === "left") c.rotate(Math.PI / 2);
    if (dir === "up") c.rotate(Math.PI);
    if (dir === "right") c.rotate(-Math.PI / 2);
    c.lineJoin = "round";
    c.beginPath();
    c.moveTo(-5, -22); c.lineTo(5, -22); c.lineTo(5, -12); c.lineTo(11, -12); c.lineTo(0, 0); c.lineTo(-11, -12); c.lineTo(-5, -12);
    c.closePath();
    fill(c, T.paper, 2);
    c.restore();
    var fs = Math.max(12, 16 / s);
    c.font = fs + "px " + T.display;
    c.textAlign = dir === "left" ? "left" : dir === "right" ? "right" : "center";
    c.textBaseline = dir === "up" ? "top" : "bottom";
    c.lineWidth = 3.4;
    c.strokeStyle = T.ink;
    c.fillStyle = T.paper;
    var tx = dir === "left" ? 4 : dir === "right" ? -4 : 0, ty = dir === "left" || dir === "right" ? -13 : dir === "up" ? 25 : -25;
    if (maxRight) {
      var tw = textWidth(c, word.toUpperCase(), fs);
      var over = x + (tx + (dir === "left" ? tw : dir === "right" ? 0 : tw / 2)) * s - maxRight;
      if (over > 0) tx -= over / s;
      var under = x + (tx - (dir === "right" ? tw : dir === "left" ? 0 : tw / 2)) * s - 4;
      if (under < 0) tx -= under / s;
    }
    text(c, word.toUpperCase(), tx, ty, fs, "both");
    c.restore();
  }

  // White motion lines behind something moving from (x0, y0) to (x1, y1)
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

  // A sealed envelope, centred on x, y, w wide
  function envelope(c, x, y, w, rot, edge) {
    var h = w * 0.66;
    c.save();
    c.translate(x, y);
    c.rotate(rot || 0);
    c.beginPath();
    c.rect(-w / 2, -h / 2, w, h);
    fill(c, T.paper, Math.max(1.4, w * 0.09), edge || T.ink);
    c.beginPath();
    c.moveTo(-w / 2, -h / 2);
    c.lineTo(0, h * 0.12);
    c.lineTo(w / 2, -h / 2);
    stroke(c, Math.max(1.1, w * 0.07), edge || T.ink);
    c.restore();
  }

  // Icons for the call's buttons and name tags, centred on x, y, about s across.
  //   mic (on: live), cam (on), nod
  function micIcon(c, x, y, s, live, colour) {
    var col = colour || T.paper;
    c.save();
    c.translate(x, y);
    c.scale(s / 20, s / 20);
    rr(c, -4, -9, 8, 13, 4);
    if (live) fill(c, col); else stroke(c, 2.2, col);
    c.beginPath();
    c.moveTo(-7, -1); c.quadraticCurveTo(-7, 8, 0, 8); c.quadraticCurveTo(7, 8, 7, -1);
    c.moveTo(0, 8); c.lineTo(0, 11); c.moveTo(-4, 11); c.lineTo(4, 11);
    stroke(c, 2.2, col);
    if (!live) {
      c.beginPath();
      c.moveTo(-9, 10); c.lineTo(9, -10);
      stroke(c, 4.8, T.ink);
      c.beginPath();
      c.moveTo(-9, 10); c.lineTo(9, -10);
      stroke(c, 2.2, col);
    }
    c.restore();
  }
  function camIcon(c, x, y, s, on, colour) {
    var col = colour || T.paper;
    c.save();
    c.translate(x, y);
    c.scale(s / 20, s / 20);
    rr(c, -10, -6, 13, 12, 2.4);
    if (on) fill(c, col); else stroke(c, 2.2, col);
    c.beginPath();
    c.moveTo(4, -1); c.lineTo(10, -5); c.lineTo(10, 5); c.lineTo(4, 1); c.closePath();
    if (on) fill(c, col); else stroke(c, 2.2, col);
    if (!on) {
      c.beginPath();
      c.moveTo(-10, 9); c.lineTo(10, -9);
      stroke(c, 4.8, T.ink);
      c.beginPath();
      c.moveTo(-10, 9); c.lineTo(10, -9);
      stroke(c, 2.2, col);
    }
    c.restore();
  }
  function nodIcon(c, x, y, s, colour) {
    var col = colour || T.paper;
    c.save();
    c.translate(x, y);
    c.scale(s / 20, s / 20);
    ell(c, 0, -1, 6.4, 6.4);
    stroke(c, 2.2, col);
    c.beginPath();
    c.moveTo(-10, -8); c.quadraticCurveTo(-12, -1, -10, 6);
    c.moveTo(10, -8); c.quadraticCurveTo(12, -1, 10, 6);
    stroke(c, 2.2, col);
    c.beginPath();
    c.moveTo(-3, 8); c.lineTo(0, 11); c.lineTo(3, 8);
    stroke(c, 2.2, col);
    c.restore();
  }

  // Smoke and suds: white circles with the accent offset behind
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

  // A spinner: the spreadsheet is not responding
  function spinner(c, x, y, r, t) {
    c.save();
    c.translate(x, y);
    for (var i = 0; i < 8; i++) {
      var a = i / 8 * TAU + Math.floor((t || 0) * 10) / 8 * TAU;
      c.globalAlpha = 0.25 + (i / 8) * 0.75;
      c.beginPath();
      c.arc(Math.cos(a) * r, Math.sin(a) * r, r * 0.22, 0, TAU);
      c.fillStyle = T.ink;
      c.fill();
    }
    c.restore();
  }

  window.OnMuteArt = {
    PEOPLE: PEOPLE,
    init: init,
    flush: flush,
    tileSprite: tileSprite,
    person: person,
    you: you,
    drawRoom: drawRoom,
    drawShoulders: drawShoulders,
    drawHead: drawHead,
    drawFace: drawFace,
    yourRoom: drawYourRoom,
    yourDoorX: yourDoorX,
    yourDishX: yourDishX,
    cat: cat,
    catEyes: catEyes,
    mitten: mitten,
    bubble: bubble,
    stamp: stamp,
    arrow: arrow,
    motion: motion,
    envelope: envelope,
    micIcon: micIcon,
    camIcon: camIcon,
    nodIcon: nodIcon,
    puff: puff,
    spinner: spinner,
    shade: shade,
    shadeLight: shadeLight,
    dots: dots,
    crescent: crescent,
    text: text,
    textWidth: textWidth,
    rr: rr,
    ell: ell,
    fill: fill,
    stroke: stroke,
    pen: pen
  };
})();
