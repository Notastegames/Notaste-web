// Thonglets: the characters, drawn in code and cached as little bitmaps.
// Three kinds, from the concept sheet: the Devout (a bean in a thong, arms up
// in praise), the Builder (the same bean in a hard hat with a brick on its
// head) and the High Priest (a gremlin wearing a second thong as a hat).
// Smitten ones lose their thong to a censor bar, and are delighted about it.
//
// Every drawing is outline first, flat fill, four inks (DESIGN.md, section 7).
// Coordinates are in world units with the feet at 0,0 and up being negative.
(function () {
  "use strict";

  var T = null;          // colour tokens, set by init()
  var SCALE = 1;         // device pixels per world unit
  var cache = {};
  var dots = null;       // halftone shading pattern

  function init(tokens, scale) {
    T = tokens;
    if (scale !== SCALE) cache = {};
    SCALE = scale;
    dots = null;
  }

  // Black halftone dots for shading white (never a grey fill)
  function shade(c) {
    if (!dots) {
      var p = document.createElement("canvas");
      var n = Math.max(3, Math.round(2.6 * SCALE));
      p.width = p.height = n;
      var x = p.getContext("2d");
      x.fillStyle = T.ink;
      x.beginPath();
      x.arc(n / 2, n / 2, n * 0.24, 0, Math.PI * 2);
      x.fill();
      dots = p;
    }
    var pat = c.createPattern(dots, "repeat");
    // the pattern is in device pixels; undo the drawing scale so dots stay small
    if (pat.setTransform && window.DOMMatrix) pat.setTransform(new DOMMatrix().scale(1 / SCALE));
    return pat;
  }

  function line(c, w, colour) {
    c.lineWidth = w;
    c.strokeStyle = colour || T.ink;
    c.lineJoin = "round";
    c.lineCap = "round";
  }

  function blob(c, x, y, rx, ry, fill, w) {
    c.beginPath();
    c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    c.fillStyle = fill;
    c.fill();
    if (w) { line(c, w); c.stroke(); }
  }

  // A strap: ink underneath, colour on top
  function strap(c, path, colour, w) {
    line(c, w + 1.4);
    c.stroke(path);
    line(c, w, colour);
    c.stroke(path);
  }

  // ---------------------------------------------------------------------------
  // The bean: Devout and Builder share a body
  // ---------------------------------------------------------------------------
  function beanPath() {
    var p = new Path2D();
    p.moveTo(0, -21);
    p.bezierCurveTo(6, -21, 8.5, -15, 8.5, -9);
    p.bezierCurveTo(8.5, -3, 5.5, 0, 0, 0);
    p.bezierCurveTo(-5.5, 0, -8.5, -3, -8.5, -9);
    p.bezierCurveTo(-8.5, -15, -6, -21, 0, -21);
    p.closePath();
    return p;
  }

  function arm(c, x0, y0, x1, y1) {
    c.beginPath();
    c.moveTo(x0, y0);
    c.quadraticCurveTo(x0 + (x1 - x0) * 0.1, y1 + (y0 - y1) * 0.3, x1, y1);
    line(c, 3.6);
    c.stroke();
    line(c, 1.6, T.paper);
    c.stroke();
  }

  // o: { back, hat, brick, censored, stare }
  function drawBean(c, o) {
    var body = beanPath();
    var carrying = o.brick;
    var hy = carrying ? -25.5 : -18.5;
    var hx = carrying ? 7.4 : 10.6;

    // feet, then arms behind the body
    blob(c, -3.8, -0.4, 3.2, 1.6, T.paper, 1.4);
    blob(c, 3.8, -0.4, 3.2, 1.6, T.paper, 1.4);
    if (!o.stare) {
      arm(c, -7, -11, -hx, hy);
      arm(c, 7, -11, hx, hy);
    }

    c.fillStyle = T.paper;
    c.fill(body);
    // shading down one side
    c.save();
    c.clip(body);
    c.fillStyle = shade(c);
    c.beginPath();
    c.ellipse(o.back ? -9 : 9, -6, 5, 13, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();
    line(c, 1.6);
    c.stroke(body);

    if (o.back) {
      // the view from behind: a cartoon bum and the thong's string
      c.beginPath();
      c.moveTo(0, -6);
      c.quadraticCurveTo(-0.3, -3, 0, -0.6);
      line(c, 1);
      c.stroke();
      if (o.censored) {
        censor(c, 0, -3.6, 9);
      } else {
        var band = new Path2D();
        band.moveTo(-8.3, -6.4);
        band.quadraticCurveTo(0, -4.6, 8.3, -6.4);
        strap(c, band, T.red, 1.1);
        var string = new Path2D();
        string.moveTo(0, -5.2);
        string.lineTo(0, -0.8);
        strap(c, string, T.red, 0.8);
      }
    } else {
      // face: eyes up at you, eyebrows raised, mouth open in awe
      var look = o.stare ? 1.6 : -1.2;
      blob(c, -2.6, -14.2, 2, 2.6, T.paper, 0.9);
      blob(c, 2.6, -14.2, 2, 2.6, T.paper, 0.9);
      blob(c, -2.4, -14.2 + look, 0.95, 0.95, T.ink);
      blob(c, 2.4, -14.2 + look, 0.95, 0.95, T.ink);
      c.beginPath();
      c.moveTo(-4.6, -17.6); c.quadraticCurveTo(-2.8, -18.8, -0.9, -17.9);
      c.moveTo(0.9, -17.9); c.quadraticCurveTo(2.8, -18.8, 4.6, -17.6);
      line(c, 0.9);
      c.stroke();
      blob(c, -5.2, -10.6, 1.3, 0.65, T.accent);
      blob(c, 5.2, -10.6, 1.3, 0.65, T.accent);
      if (o.stare) {
        // a flat little line: transfixed by the Feed
        c.beginPath(); c.moveTo(-1.4, -9.6); c.lineTo(1.4, -9.6); line(c, 0.9); c.stroke();
      } else {
        blob(c, 0, -9.8, 1, 1.3, T.ink);
      }
      if (o.censored) {
        censor(c, 0, -3.8, 9);
      } else {
        var front = new Path2D();
        front.moveTo(-8.3, -5.8);
        front.quadraticCurveTo(0, -3.6, 8.3, -5.8);
        strap(c, front, T.red, 1.1);
        c.beginPath();
        c.moveTo(-3, -4.5);
        c.quadraticCurveTo(0, -4, 3, -4.5);
        c.lineTo(0.4, -1.2);
        c.lineTo(-0.4, -1.2);
        c.closePath();
        c.fillStyle = T.red;
        c.fill();
        line(c, 0.8);
        c.stroke();
      }
    }

    if (o.hat) {
      c.beginPath();
      c.arc(0, -19.2, 6.4, Math.PI, 0);
      c.closePath();
      c.fillStyle = T.accent;
      c.fill();
      line(c, 1.3);
      c.stroke();
      c.beginPath();
      c.moveTo(0, -25.4); c.lineTo(0, -19.4);
      line(c, 0.9);
      c.stroke();
      c.beginPath();
      c.roundRect ? c.roundRect(-8.2, -20.2, 16.4, 2.2, 1.1) : c.rect(-8.2, -20.2, 16.4, 2.2);
      c.fillStyle = T.accent;
      c.fill();
      line(c, 1.1);
      c.stroke();
    }

    if (carrying) {
      c.beginPath();
      c.rect(-7.6, -31.4, 15.2, 5.4);
      c.fillStyle = T.red;
      c.fill();
      line(c, 1.3);
      c.stroke();
      c.beginPath();
      c.moveTo(-7.6, -28.7); c.lineTo(7.6, -28.7);
      c.moveTo(-1.5, -31.4); c.lineTo(-1.5, -28.7);
      c.moveTo(3, -28.7); c.lineTo(3, -26);
      line(c, 0.7);
      c.stroke();
    }
    if (!o.stare) {
      blob(c, -hx, hy, 1.9, 1.9, T.paper, 1.1);
      blob(c, hx, hy, 1.9, 1.9, T.paper, 1.1);
    }
  }

  // The bar that goes where the thong was. Classified.
  function censor(c, x, y, w) {
    c.save();
    c.translate(x, y);
    c.rotate(-0.08);
    c.fillStyle = T.ink;
    c.fillRect(-w / 2, -1.9, w, 3.8);
    line(c, 0.6, T.paper);
    c.strokeRect(-w / 2, -1.9, w, 3.8);
    c.restore();
  }

  // ---------------------------------------------------------------------------
  // The High Priest: a gremlin in rapture, thong on its head as a mitre
  // ---------------------------------------------------------------------------
  function drawPriest(c, o) {
    var body = new Path2D();
    body.moveTo(0, -30);
    body.bezierCurveTo(6.5, -30, 8.6, -23, 10, -14);
    body.bezierCurveTo(11.6, -4, 8, 0, 0, 0);
    body.bezierCurveTo(-8, 0, -11.6, -4, -10, -14);
    body.bezierCurveTo(-8.6, -23, -6.5, -30, 0, -30);
    body.closePath();

    blob(c, -4.6, -0.4, 4.2, 1.7, T.paper, 1.4);
    blob(c, 4.6, -0.4, 4.2, 1.7, T.paper, 1.4);
    // floppy ears
    [-1, 1].forEach(function (side) {
      c.beginPath();
      c.moveTo(side * 6, -24.5);
      c.quadraticCurveTo(side * 15, -25, side * 18, -17);
      c.quadraticCurveTo(side * 12, -20, side * 6.4, -20.5);
      c.closePath();
      c.fillStyle = T.paper;
      c.fill();
      line(c, 1.4);
      c.stroke();
    });

    c.fillStyle = T.paper;
    c.fill(body);
    c.save();
    c.clip(body);
    c.fillStyle = shade(c);
    c.beginPath();
    c.ellipse(o.back ? -10 : 10, -8, 5, 15, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();
    line(c, 1.6);
    c.stroke(body);

    if (o.back) {
      c.beginPath();
      c.moveTo(0, -7); c.quadraticCurveTo(-0.3, -3.5, 0, -0.6);
      line(c, 1);
      c.stroke();
      if (o.censored) censor(c, 0, -4, 11);
      else {
        var band = new Path2D();
        band.moveTo(-10.2, -8); band.quadraticCurveTo(0, -6, 10.2, -8);
        strap(c, band, T.accent, 1.1);
        var string = new Path2D();
        string.moveTo(0, -6.6); string.lineTo(0, -0.8);
        strap(c, string, T.accent, 0.8);
      }
    } else {
      // eyes shut in rapture, a grin with one tooth
      c.beginPath();
      c.moveTo(-5, -21.5); c.quadraticCurveTo(-3.4, -23.2, -1.8, -21.5);
      c.moveTo(1.8, -21.5); c.quadraticCurveTo(3.4, -23.2, 5, -21.5);
      line(c, 1);
      c.stroke();
      c.beginPath();
      c.moveTo(-4.6, -17.6);
      c.quadraticCurveTo(0, -12.6, 4.6, -17.6);
      c.closePath();
      c.fillStyle = T.ink;
      c.fill();
      line(c, 0.7);
      c.stroke();
      c.fillStyle = T.paper;
      c.fillRect(-0.9, -17.5, 1.8, 1.7);
      // hands together
      blob(c, -1.2, -12, 1.8, 3, T.paper, 0.9);
      blob(c, 1.2, -12, 1.8, 3, T.paper, 0.9);
      if (o.censored) censor(c, 0, -5, 11);
      else {
        var front = new Path2D();
        front.moveTo(-10.2, -7.4); front.quadraticCurveTo(0, -5, 10.2, -7.4);
        strap(c, front, T.accent, 1.1);
        c.beginPath();
        c.moveTo(-3.4, -6); c.quadraticCurveTo(0, -5.2, 3.4, -6);
        c.lineTo(0.4, -1.6); c.lineTo(-0.4, -1.6);
        c.closePath();
        c.fillStyle = T.accent;
        c.fill();
        line(c, 0.8);
        c.stroke();
      }
    }

    // the sacred thong, worn as a hat
    var straps = new Path2D();
    straps.moveTo(-3.8, -28.6); straps.quadraticCurveTo(-6.2, -27, -6.4, -23.6);
    straps.moveTo(3.8, -28.6); straps.quadraticCurveTo(6.2, -27, 6.4, -23.6);
    strap(c, straps, T.red, 1);
    c.beginPath();
    c.moveTo(-4.4, -28.2);
    c.quadraticCurveTo(0, -29.6, 4.4, -28.2);
    c.lineTo(0.5, -39.5);
    c.lineTo(-0.5, -39.5);
    c.closePath();
    c.fillStyle = T.red;
    c.fill();
    line(c, 1.2);
    c.stroke();
    // a little Notaste sparkle on the front
    if (!o.back) {
      c.beginPath();
      c.moveTo(0, -35.5);
      c.quadraticCurveTo(0, -33.2, 1.8, -33.2);
      c.quadraticCurveTo(0, -33.2, 0, -31);
      c.quadraticCurveTo(0, -33.2, -1.8, -33.2);
      c.quadraticCurveTo(0, -33.2, 0, -35.5);
      c.fillStyle = T.paper;
      c.fill();
    }
  }

  // ---------------------------------------------------------------------------
  // Cached bitmaps. get(kind, opts) returns { img, ox, oy, w, h } in world units:
  // draw img at (x - ox, y - oy) with size w x h.
  // ---------------------------------------------------------------------------
  var BOX = {
    bean: { w: 30, h: 36, ox: 15, oy: 33 },
    priest: { w: 42, h: 46, ox: 21, oy: 42 }
  };

  function get(kind, o) {
    var key = kind + (o.back ? "b" : "f") + (o.hat ? "h" : "") + (o.brick ? "k" : "") + (o.censored ? "c" : "") + (o.stare ? "s" : "");
    var hit = cache[key];
    if (hit) return hit;
    var box = BOX[kind];
    var cv = document.createElement("canvas");
    cv.width = Math.ceil(box.w * SCALE);
    cv.height = Math.ceil(box.h * SCALE);
    var c = cv.getContext("2d");
    c.scale(SCALE, SCALE);
    c.translate(box.ox, box.oy);
    if (kind === "priest") drawPriest(c, o); else drawBean(c, o);
    hit = cache[key] = { img: cv, ox: box.ox, oy: box.oy, w: box.w, h: box.h };
    return hit;
  }

  window.ThongletSprites = { init: init, get: get, shade: shade, drawBean: drawBean, drawPriest: drawPriest };
})();
