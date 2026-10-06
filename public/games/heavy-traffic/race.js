// Heavy Traffic: kart racing. Large drivers, tiny cars. Physics has given up.
//
// THE JOKE. Drivers twice the width of their karts, at one with them and
// sure they own the road. The comedy is the fit and the car's suffering,
// never the people: steering that arrives late, corners that lift two
// wheels and then spin you, suspension squashed flat and scraping, wheels
// leaving on their own adventures, and a button marked Gas. The drivers
// insult each other's driving, never anyone's body.
//
// THE RACE. Three laps of one circuit against Gaz, Lorraine and Derek, seen
// from just behind your kart. Keys: Up to go, Down to brake, left and right
// to steer, Space for gas. Touch: it goes by itself; steering bottom left,
// Gas over Brake bottom right. The car considers your steering before it
// does any (STEER_LAG). Too fast into a corner and the driver's weight lifts
// two wheels and the tyres squeal; hold it there and you spin, once round
// and a bit, and end up facing down the road again. Arrow boards stand on
// the outside of every corner you need to brake for. The barriers are
// forgiving: you slide along them. Stuck, or the wrong way round, for long
// enough and you're towed back onto the road. Gas builds up over seven
// seconds and gives a short burst of speed and a cloud everyone behind you
// will remember. Tuck in behind someone and their slipstream helps.
//
// THE RIVALS. Each race deals out one quick, one middling and one slow
// (FORM). On the first two laps anyone well ahead of you eases off, out of
// sight, and anyone behind finds a bit, each settling at their own distance
// so they don't travel as a wall (rubberBand). The final lap is a straight
// race at everyone's own pace. Now and then a rival saves up a mistake and
// spends it on the next proper corner. Get close and they turn round, shake
// a fist and shout, in speech bubbles.
//
// SAYING WHAT TO DO. A notice with the countdown (steer early, brake before
// the arrow boards). On the first two laps a pointer says Brake when you
// arrive at a proper corner far too fast, until you've braked into one, and
// Gas the first time it's full, until you've used it.
//
// TODAY'S RACE. Everyone gets the same form, the same grid chatter and the
// same rivals' moods and mistakes, from seeded streams (shell.random, and
// each rival's own). Where those mistakes land depends on the corners they
// reach, so it isn't quite the same race twice, but it's the same field.
//
// THE LADDER (DESIGN.md, section 6) is your place: first Approved, second
// Pending review, third Not approved, last Rejected. Bests are times, so
// lower wins (shell.record with lower), and the best lap is kept too.
//
// TEST FLAGS. ?autopilot (and ?clip) drives your kart as well; &speed=4
// runs four times as fast. ?debug exposes window.__heavyTraffic (the track,
// the karts, the clock) for scripts. ?debug=map draws the whole circuit
// top-down.
//
// Built on the shared kit (/games/kit/kit.js), which handles the intro, the
// screens, controls, sound and saving. This file is the race itself: the
// track, the karts and their physics, the other drivers, and the drawing.
// ground.js lays the circuit out in perspective (WebGL) and driver.js draws
// the karts; without WebGL the race is drawn top-down instead.
// heavy-traffic.css places the callouts and the touch buttons.
(function () {
  "use strict";

  var N = window.Notaste;
  var root = document.getElementById("game-root");
  if (!N || !root) return;

  var params = new URLSearchParams(window.location.search);
  var AUTOPILOT = N.flags.autopilot;  // ?autopilot or ?clip: the computer drives your kart as well
  var DEBUG = params.has("debug");

  // ---------------------------------------------------------------------------
  // Tuning. World units are roughly pixels at normal zoom.
  // ---------------------------------------------------------------------------
  var LAPS = 3;
  var HW = 54;                       // half the road's width: room for three, if they'd share
  var KERB = 8;                      // kerb beyond the road edge
  var RUNOFF = 64;                   // gravel between the kerb and the wall
  var WALL = HW + KERB + RUNOFF;     // centre line to wall
  var MAX = 300;                     // top speed on tarmac
  var ACCEL = 250;
  var BRAKE = 520;
  var REVERSE = 90;
  var TURN = 2.75;                   // radians per second at full lock
  var STEER_LAG = 10;                // how fast the car agrees to steer
  var GRIP = 9;                      // how fast sideways sliding dies away
  var LEAN_DIV = 430;                // sideways force that lifts two wheels
  var LEAN_RATE = 4.5;
  var SPIN_LEAN = 1.3;               // lean that tips into a spin if held (full lock, flat out, with gas)
  var TIP_TIME = 0.45;               // ...for this long: long enough to hear it coming
  var GRAVEL_TOP = 0.72;             // top speed on the gravel, as a share of the usual
  var KART = 1.4;                    // drawing scale for karts and drivers
  var R = 15;                        // collision radius: mostly driver
  var STEP = 1 / 120;
  var VIEW = 400;                    // top-down: world units across the screen's short side
  var CAM_D = 112;                   // chase camera: distance behind your kart
  var CAM_H = 54;                    // ...and high enough to see over your own head
  var GAS_FILL = 7;                  // seconds for the gas to build back up
  var GAS_TIME = 1.4;                // how long a blast lasts

  var DRIVERS = [
    // the other three, all invented. How quick each is comes from FORM.
    // kart/suit/stripe colour the top-down view; look dresses them in the chase view.
    // Each one owns the road, and is at one with their kart. lines are theirs alone.
    { name: "Gaz", kart: "accent", suit: "red", stripe: "paper",
      look: { car: "accent", shirt: "red", pants: "ink", hat: "band", hatColour: "accent" },
      lines: ["I pay road tax. This is my road.", "Me and the kart are one. We've been through things.",
              "Lads. Lads. Lads.", "This is a private lane, mate.", "I was born in this kart."] },
    { name: "Lorraine", kart: "paper", suit: "accent", stripe: "red",
      look: { car: "paper", shirt: "accent", pants: "red", hat: "perm", hatColour: "red" },
      lines: ["I was here first.", "I'll be speaking to your manager.", "This lane is for residents.",
              "Thirty years. Never once looked.", "She's called Pamela. Show her some respect."] },
    { name: "Derek", kart: "ink", suit: "paper", stripe: "accent",
      look: { car: "ink", shirt: "paper", pants: "accent", hat: "flatcap", hatColour: "ink", tache: true },
      lines: ["I've got all this on dashcam.", "Forty years. Not one indicator.", "The kart and I are married. Not legally.",
              "Mirror, signal, manoeuvre. Look it up.", "In my day this was all fields."] },
    { name: "You", kart: "red", suit: "paper", stripe: "red", player: true,
      look: { car: "red", shirt: "paper", shirtDots: true, pants: "ink", hat: "cap", hatColour: "red" } }
  ];

  // Form: how quick each rival is this race, dealt out afresh every time (the
  // same deal for everyone in today's race): one quick, one middling, one
  // slow, so there's always someone to beat and someone to chase. power and
  // corner are their skill (yours are 1); pace spreads them round the circuit
  // so you meet them one at a time: the quick one waits a little ahead of
  // you, the slow one a little behind (see rubberBand).
  var FORM = [
    { power: 0.84, corner: 0.84, pace: 150 },
    { power: 0.73, corner: 0.85, pace: 0 },
    { power: 0.67, corner: 0.86, pace: -320 }
  ];
  var YOU = { power: 1, corner: 1, pace: 0 };

  // What they shout at you. Your driving, never your body.
  var INSULTS = ["Move, you lemon.", "Numpty.", "Get off my road.", "Learn to drive.", "Absolute weapon.",
                 "Oi. Oi. Oi.", "Do you know who I am.", "Pillock.", "Indicate, you melon.",
                 "You drive like my nan. My nan's dead.", "Seen better driving at a funeral.",
                 "Is that a kart or a cry for help.", "Plonker."];
  var BUMPED = ["Oi. That's assault.", "You've scratched her.", "I'm calling my solicitor.",
                "Whiplash. Definitely whiplash.", "Mind the paintwork, you pillock."];
  var PASSED = ["Cheat.", "That's illegal, that.", "I let you have that.", "Undertaking. Disgusting."];
  var GLOAT = ["See you, numpty.", "Smell my exhaust.", "Bye, lemon.", "That's how it's done."];
  var GASSED = ["Was that you.", "Windows. Down. Now.", "I can taste that.", "That's a crime in some countries."];
  var SELF = ["My kart. My beautiful kart.", "She's never done that before.", "Nobody saw that.", "The kart did that, not me."];
  var GRID = ["This is my road.", "Stay out of my lane.", "Me and the kart are one.", "Don't even look at me."];

  // The circuit: control points for a smooth closed curve, in driving order.
  // The start line is the first point, heading east along the bottom straight.
  var CONTROL = [
    [700, 1500], [1300, 1500], [1850, 1490], [2250, 1400], [2420, 1150],
    [2380, 880], [2180, 700], [2240, 480], [2140, 290], [2055, 200],
    [1970, 290], [1900, 480], [1760, 720], [1450, 900], [1150, 880], [950, 700], [1000, 420],
    [780, 260], [480, 330], [330, 600], [480, 900], [330, 1150], [420, 1420]
  ];

  // ---------------------------------------------------------------------------
  // Track geometry: a centre line sampled every 10 units, with direction,
  // normal (pointing to the driver's right), distance along, and curvature.
  // ---------------------------------------------------------------------------
  var track = buildTrack(CONTROL, 10);

  function buildTrack(pts, spacing) {
    var dense = [];
    var n = pts.length;
    for (var i = 0; i < n; i++) {
      catmullRom(pts[(i - 1 + n) % n], pts[i], pts[(i + 1) % n], pts[(i + 2) % n], 40, dense);
    }
    // resample at an even spacing
    var xs = [], ys = [];
    var carry = 0;
    for (var j = 0; j < dense.length; j++) {
      var a = dense[j], b = dense[(j + 1) % dense.length];
      var dx = b[0] - a[0], dy = b[1] - a[1];
      var len = Math.hypot(dx, dy);
      var d = carry;
      while (d < len) {
        xs.push(a[0] + dx * d / len);
        ys.push(a[1] + dy * d / len);
        d += spacing;
      }
      carry = d - len;
    }
    var count = xs.length;
    var t = {
      n: count, x: xs, y: ys, dx: [], dy: [], nx: [], ny: [], s: [], seg: [], k: [], safe: [],
      length: 0, path: new Path2D(), minX: 1e9, minY: 1e9, maxX: -1e9, maxY: -1e9
    };
    var total = 0;
    for (var p = 0; p < count; p++) {
      var q = (p + 1) % count;
      var ex = xs[q] - xs[p], ey = ys[q] - ys[p];
      var l = Math.hypot(ex, ey) || 1;
      t.dx[p] = ex / l; t.dy[p] = ey / l;
      t.nx[p] = -ey / l; t.ny[p] = ex / l;
      t.s[p] = total;
      t.seg[p] = l;
      total += l;
      if (p === 0) t.path.moveTo(xs[p], ys[p]); else t.path.lineTo(xs[p], ys[p]);
      t.minX = Math.min(t.minX, xs[p]); t.maxX = Math.max(t.maxX, xs[p]);
      t.minY = Math.min(t.minY, ys[p]); t.maxY = Math.max(t.maxY, ys[p]);
    }
    t.path.closePath();
    t.length = total;
    // curvature: turn per unit length (positive turns right), lightly smoothed
    var raw = [];
    for (var c = 0; c < count; c++) {
      var prev = (c - 1 + count) % count;
      var turn = Math.atan2(t.dy[c], t.dx[c]) - Math.atan2(t.dy[prev], t.dx[prev]);
      raw[c] = wrapAngle(turn) / spacing;
    }
    for (var m = 0; m < count; m++) {
      var sum = 0;
      for (var w = -4; w <= 4; w++) sum += raw[(m + w + count) % count];
      t.k[m] = sum / 9;
    }
    // the fastest a kart can take each sample without lifting a wheel
    for (var v = 0; v < count; v++) t.safe[v] = safeSpeed(Math.abs(t.k[v]));
    return t;
  }

  // Centripetal Catmull-Rom: smooth through every point, no loops or cusps
  function catmullRom(p0, p1, p2, p3, steps, out) {
    function knot(ti, a, b) { return ti + Math.pow(Math.hypot(b[0] - a[0], b[1] - a[1]), 0.5); }
    var t0 = 0, t1 = knot(t0, p0, p1), t2 = knot(t1, p1, p2), t3 = knot(t2, p2, p3);
    function mix(a, b, ta, tb, tt) {
      var u = (tt - ta) / (tb - ta);
      return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
    }
    for (var i = 0; i < steps; i++) {
      var tt = t1 + (t2 - t1) * i / steps;
      var a1 = mix(p0, p1, t0, t1, tt), a2 = mix(p1, p2, t1, t2, tt), a3 = mix(p2, p3, t2, t3, tt);
      var b1 = mix(a1, a2, t0, t2, tt), b2 = mix(a2, a3, t1, t3, tt);
      out.push(mix(b1, b2, t1, t2, tt));
    }
  }

  // full steering from walking pace up, and a little even when stopped, so a kart
  // that ends up nose to the wall can be pointed back down the road
  function turnFactor(speed) { return Math.min(1, 0.25 + speed / 50) * (1 - 0.32 * Math.min(1, speed / MAX)); }

  function safeSpeed(curve) {
    if (curve < 1e-5) return MAX;
    var byLean = Math.sqrt(0.9 * LEAN_DIV / curve);
    var v = MAX;
    while (v > 40 && v * curve > 0.88 * TURN * turnFactor(v)) v -= 4;
    return Math.min(MAX, byLean, v);
  }

  function wrapAngle(a) {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
  }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function ahead(i, units) { return (i + Math.round(units / 10) + track.n * 4) % track.n; }

  // Where a kart is on the track: nearest centre-line sample (searching near
  // the last one, so crossing parts of the circuit never confuse it), distance
  // along the lap, and how far it is to the right (+) or left (-) of the line.
  function locate(k, wide) {
    var best = 1e18, bi = k.idx, bt = 0;
    var from = wide ? 0 : k.idx - 12, to = wide ? track.n - 1 : k.idx + 12;
    for (var j = from; j <= to; j++) {
      var i = (j + track.n) % track.n;
      var ox = k.x - track.x[i], oy = k.y - track.y[i];
      var along = clamp(ox * track.dx[i] + oy * track.dy[i], 0, track.seg[i]);
      var px = ox - track.dx[i] * along, py = oy - track.dy[i] * along;
      var dist = px * px + py * py;
      if (dist < best) { best = dist; bi = i; bt = along; }
    }
    k.idx = bi;
    k.s = track.s[bi] + bt;
    k.lat = (k.x - track.x[bi]) * track.nx[bi] + (k.y - track.y[bi]) * track.ny[bi];
  }

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  var T = null;            // colours, from the site's CSS tokens
  var shell = null;
  var karts = [];
  var player = null;
  var parts = [];          // sparks, puffs, gravel, loose wheels
  var skids = [];          // tyre marks: [x1, y1, x2, y2]
  var raceTime = 0;
  var acc = 0;
  var finishers = 0;
  var cam = { x: 0, y: 0, zoom: 1, shake: 0 };
  var W = 300, H = 300, DPR = 1;
  var ctx = null;
  var patterns = null;
  var mini = null;
  var hudEls = null;
  var lastCallout = -10;
  var flags = {};
  var engine = null;
  var lastPlace = 4;
  var ground = null;       // the WebGL floor, when there is one
  var groundFailed = false;
  var glCanvas = null;
  var view = null;         // the chase camera this frame
  var camA = 0;
  var scenery = [];        // signs, corner boards and tyre stacks round the outside
  var barriers = [];       // the low wall along both sides, in short lengths
  var sky = null;
  var looks = {};
  var learned = { gas: false, brake: false };   // shown you know: the pointers stop (kept for the visit)
  var MAP = DEBUG && params.get("debug") === "map";

  function makeKart(d, slot) {
    var r = shell.random;   // seeded: in today's race everyone meets the same moods
    var row = Math.floor(slot / 2), side = slot % 2 ? 1 : -1;
    var s0 = track.length - 40 - row * 46;
    var i = Math.floor(s0 / 10) % track.n;
    var k = {
      name: d.name, d: d, player: !!d.player,
      // each rival's own seeded streams: their moods come and go on the same
      // clock for everyone in today's race, and their mistakes come in the
      // same order, wherever you are
      rand: N.seeded((shell.seed + (slot + 1) * 7919) | 0),
      slip: N.seeded((shell.seed + (slot + 1) * 104729) | 0),
      x: track.x[i] + track.nx[i] * side * 19,
      y: track.y[i] + track.ny[i] * side * 19,
      a: Math.atan2(track.dy[i], track.dx[i]),
      vx: 0, vy: 0, yaw: 0, steer: 0, lean: 0, kick: 0, tip: 0,
      spin: 0, spinRate: 0, z: 0, vz: 0, hopWait: 0,
      wheelOff: 0, wheelSide: 1, offroad: false, kerb: false, twoWheel: false, walled: 0, draft: 0, stuck: 0,
      idx: i, s: 0, lat: 0, lap: 0, progress: 0, done: false, time: 0, place: slot + 1,
      lapStart: 0, bestLap: 0, wrong: 0, gravel: 0, scrapeWait: 0,
      form: YOU, power: 1, skidL: null, skidR: null,
      roll: 0, gas: 0.5 + r() * 0.4, boost: 0, gasHeld: false, sweatWait: 0,
      headTurn: 0, shoutSide: 1, anim: 0, speech: { text: "", t: 0, wait: 3 + r() * 4 },
      jig: { uy: 0, vuy: 0, uz: 0, vuz: 0, ly: 0, vly: 0, lz: 0, vlz: 0 },
      ai: { lane: r() * 6, wander: 0.3 + r() * 0.3, bias: (r() - 0.5) * 14,
            delay: 0.1 + r() * 0.35, stuck: 0, reverse: 0,
            oops: 8 + r() * 14, armed: false, overcook: 0, hog: false, mood: 2 + r() * 6 }
    };
    locate(k, true);
    k.progress = k.s - track.length;
    return k;
  }

  // ---------------------------------------------------------------------------
  // Physics, one fixed step
  // ---------------------------------------------------------------------------
  var IDLE = { steer: 0, throttle: 0, brake: 0 };

  function stepKart(k, dt, ctl) {
    var prevS = k.s;
    var air = k.z > 0.5;
    if (k.spin > 0) { k.spin -= dt; ctl = IDLE; }

    // the car considers your steering before it does any
    k.steer += (ctl.steer - k.steer) * Math.min(1, dt * STEER_LAG);
    var steer = clamp(k.steer + (k.wheelOff > 0 ? k.wheelSide * 0.12 : 0), -1, 1);

    var cos = Math.cos(k.a), sin = Math.sin(k.a);
    var vf = k.vx * cos + k.vy * sin;
    var speed = Math.abs(vf);

    var yaw = 0;
    if (k.spin > 0) yaw = k.spinRate;
    else if (!air) yaw = TURN * steer * turnFactor(speed) * (vf < -5 ? -1 : 1);
    k.a += yaw * dt;
    k.yaw = yaw;

    cos = Math.cos(k.a); sin = Math.sin(k.a);
    vf = k.vx * cos + k.vy * sin;
    var vr = -k.vx * sin + k.vy * cos;

    if (!air) {
      var boosting = k.boost > 0;
      var top = MAX * k.power * (boosting ? 1.3 : 1) * (k.offroad ? GRAVEL_TOP : 1) * (k.wheelOff > 0 ? 0.9 : 1) * (k.draft > 0.3 ? 1.07 : 1);
      var a = 0;
      if (ctl.throttle > 0) a += ACCEL * ctl.throttle * (boosting ? 1.8 : 1);
      if (boosting) a += ACCEL * 0.6;
      if (ctl.brake > 0) a -= (vf > 8 ? BRAKE : ACCEL * 0.6) * ctl.brake;
      a -= vf * (ACCEL / top);                    // drag, which sets the top speed
      if (k.offroad && speed > 5) a -= (vf > 0 ? 1 : -1) * 35;   // gravel
      vf += a * dt;
      if (vf < -REVERSE) vf = -REVERSE;
      var grip = k.spin > 0 ? 1.6 : (k.offroad ? 5.5 : GRIP) * (k.twoWheel ? 0.7 : 1);
      vr *= Math.exp(-grip * dt);
    }
    k.vx = vf * cos - vr * sin;
    k.vy = vf * sin + vr * cos;
    k.x += k.vx * dt;
    k.y += k.vy * dt;

    // where that left us: road, kerb or gravel
    locate(k, false);
    var side = Math.abs(k.lat);
    k.offroad = side > HW + KERB * 0.6;
    k.kerb = side > HW - 2 && side <= HW + KERB;

    // brief flights off the kerbs
    if (air || k.vz > 0) {
      k.vz -= 950 * dt;
      k.z = Math.max(0, k.z + k.vz * dt);
      if (k.z === 0) { k.vz = 0; land(k); }
    } else if (k.kerb && speed > MAX * 0.82 && Math.abs(vr) > 34 && k.hopWait <= 0) {
      k.hopWait = 2;
      if (Math.random() < 0.4) {
        k.vz = 170;
        if (k.player) say("Airborne. Briefly", 2);
      }
    }
    k.hopWait -= dt;

    // lean: the driver goes one way, the kart tries to go the other
    var target = k.spin > 0 || air ? 0 : (vf * yaw) / LEAN_DIV;
    k.lean += (target - k.lean) * Math.min(1, dt * LEAN_RATE) + k.kick;
    k.kick = 0;
    var wasTwo = k.twoWheel;
    k.twoWheel = Math.abs(k.lean) > 1 && !air;
    if (k.twoWheel && !wasTwo && k.player && !flags.two) { flags.two = true; say("Two wheels. Plenty", 1); }
    if (Math.abs(k.lean) > SPIN_LEAN) k.tip += dt; else k.tip = Math.max(0, k.tip - dt * 2);
    if (k.tip > TIP_TIME && k.spin <= 0) spinOut(k);
    k.roll = k.twoWheel ? clamp((Math.abs(k.lean) - 1) * 0.6 + 0.1, 0, 0.34) * (k.lean > 0 ? 1 : -1) : clamp(k.lean, -1, 1) * 0.05;

    wobble(k, dt, speed);

    // gas: builds up, goes off when asked
    k.gas = Math.min(1, k.gas + dt / GAS_FILL);
    if (ctl.gas && k.gas >= 1 && k.spin <= 0) gasBlast(k);
    if (k.boost > 0) {
      k.boost -= dt;
      if (Math.random() < dt * 14) gasPuff(k, 0.55);
    }

    // sweat, in the corners
    if (Math.abs(k.lean) > 0.6 && speed > 140) {
      k.sweatWait -= dt;
      if (k.sweatWait <= 0) { k.sweatWait = 0.09; sweat(k, 1); }
    }

    if (k.wheelOff > 0) {
      k.wheelOff -= dt;
      if (k.wheelOff <= 0 && k.player) say("Wheel found", 1);
    }

    effects(k, dt, vf, vr, speed);
    walls(k);
    laps(k, prevS);
    k.anim += dt;
    if (!k.player) chatter(k, dt);

    // going the wrong way, sitting in the gravel, or stuck against a barrier
    if (k.player && !k.done) {
      var along = k.vx * track.dx[k.idx] + k.vy * track.dy[k.idx];
      k.wrong = along < -40 ? k.wrong + dt : 0;
      if (k.wrong > 1.2) { k.wrong = -2; say("Wrong way", 2); }
      k.gravel = k.offroad ? k.gravel + dt : 0;
      if (k.gravel > 1.6) { k.gravel = -6; say("That's gravel", 0); }
      k.stuck = speed < 25 && k.spin <= 0 && (k.walled || k.offroad || k.wrong > 0) ? k.stuck + dt : 0;
      if (k.stuck > 2.5) tow(k);
    }
  }

  // Stuck for long enough and someone comes and puts you back on the road,
  // facing the right way. There will be paperwork.
  var TOW_LINES = ["Towed. Invoice to follow", "Recovered. Reluctantly", "Put back. Like a trolley"];
  function tow(k) {
    var i = k.idx;
    k.x = track.x[i] + track.nx[i] * clamp(k.lat, -HW * 0.5, HW * 0.5);
    k.y = track.y[i] + track.ny[i] * clamp(k.lat, -HW * 0.5, HW * 0.5);
    k.a = Math.atan2(track.dy[i], track.dx[i]);
    k.vx = k.vy = 0;
    k.lean = k.tip = k.steer = 0;
    k.stuck = k.wrong = 0;
    k.offroad = false;
    k.walled = 0;
    locate(k, false);
    bump(k, 1.5);
    puff(k.x, k.y, 0.8);
    say(pick(TOW_LINES), 2);
  }

  // Round once, and then a bit more, so the kart ends up facing down the road
  // again. The dignity doesn't come back.
  function spinOut(k) {
    k.spin = 0.9;
    var road = Math.atan2(track.dy[k.idx], track.dx[k.idx]);
    k.spinRate = ((k.lean > 0 ? 1 : -1) * Math.PI * 2 + wrapAngle(road - k.a)) / k.spin;
    k.tip = 0;
    k.lean *= 0.3;
    for (var i = 0; i < 4; i++) puff(k.x, k.y, 0.8);
    sweat(k, 6);
    if (k.player) { say("Spun out", 2); shake(0.4); }
    else talk(k, pick(SELF), true);
    if (near(k)) N.sound.noise(0.5, { type: "bandpass", freq: 1400, q: 2, vol: 0.12 });
  }

  function land(k) {
    bump(k, 2.2);
    puff(k.x, k.y, 0.6);
    k.kick += (Math.random() - 0.5) * 0.8;
    if (k.player) shake(0.25);
    if (near(k)) thud(90);
  }

  // The driver wobbles on two springs, chest and seat, at different speeds, so
  // every corner and bump sets off a ripple. Squash the seat far enough and
  // the floor of the kart meets the road.
  function wobble(k, dt, speed) {
    var j = k.jig;
    var sway = -clamp(k.lean, -1.6, 1.6) * 0.8;   // the body goes to the outside of the corner
    j.vuy += (-(j.uy - sway) * 90 - j.vuy * 3.2) * dt;
    j.uy = clamp(j.uy + j.vuy * dt, -2.5, 2.5);
    j.vly += (-(j.ly - sway * 0.7) * 150 - j.vly * 4) * dt;
    j.ly = clamp(j.ly + j.vly * dt, -2.5, 2.5);
    j.vuz += (-j.uz * 110 - j.vuz * 3) * dt;
    j.uz = clamp(j.uz + j.vuz * dt, -1.6, 1.6);
    j.vlz += (-j.lz * 170 - j.vlz * 4) * dt;
    j.lz = clamp(j.lz + j.vlz * dt, -1.6, 1.6);
    if (k.kerb && speed > 80 && Math.random() < dt * 14) bump(k, 0.75);
    if (j.lz < -0.3 && speed > 50) {
      k.scrapeWait -= dt;
      if (k.scrapeWait <= 0) {
        k.scrapeWait = 0.05;
        var cos = Math.cos(k.a), sin = Math.sin(k.a);
        sparks(k.x - cos * 12, k.y - sin * 12, 3, -cos, -sin);
      }
      if (k.player && raceTime > 2) {
        if (!flags.suspension) { flags.suspension = true; say("Suspension: deceased", 1); }
        else if (!flags.praying && raceTime > 30) { flags.praying = true; say("The car is praying", 1); }
      }
    }
  }

  // a jolt from below: the seat squashes first, the chest follows
  function bump(k, size) {
    k.jig.vlz -= size * 9;
    k.jig.vuz -= size * 5;
  }

  // The Gas button. A short burst of speed, a cloud, and a noise. The first
  // one is stamped; after that a stamp only when it gets somebody, and not
  // every time, since the rival's bubble is the joke.
  var GAS_LINES = ["Gas deployed", "Nobody will forget that", "Windows down, everyone", "That was not the engine"];
  function gasBlast(k) {
    k.gas = 0;
    k.boost = GAS_TIME;
    k.jig.vlz += 7;      // lifted clean off the seat
    k.jig.vuz += 4;
    for (var i = 0; i < 6; i++) gasPuff(k, 1);
    if (near(k)) fart(k.player ? 1 : 0.45);
    if (k.player) {
      if (!flags.gas) { say(GAS_LINES[0], 2); flags.gasSaid = raceTime; }
      flags.gas = true;
      learned.gas = true;
      shake(0.2);
      var nearest = null, best = 220;
      karts.forEach(function (o) {
        var d = Math.hypot(o.x - k.x, o.y - k.y);
        if (!o.player && d < best) { best = d; nearest = o; }
      });
      if (nearest) {
        talk(nearest, pick(GASSED), true);
        if (raceTime - flags.gasSaid > 20) {
          flags.gasSaid = raceTime;
          flags.gasN = (flags.gasN || 0) + 1;
          say(GAS_LINES[1 + (flags.gasN - 1) % 3], 1);
        }
      }
    }
  }

  function gasPuff(k, size) {
    var cos = Math.cos(k.a), sin = Math.sin(k.a);
    parts.push({ t: "puff", gas: true,
                 x: k.x - cos * 16 + (Math.random() - 0.5) * 8, y: k.y - sin * 16 + (Math.random() - 0.5) * 8,
                 z: 3 + Math.random() * 6,
                 vx: -cos * 40 + (Math.random() - 0.5) * 40 + k.vx * 0.2, vy: -sin * 40 + (Math.random() - 0.5) * 40 + k.vy * 0.2,
                 r: (4 + Math.random() * 4) * size, life: 0.9, max: 0.9 });
  }

  // flung off the helmet, outwards in the corners and everywhere in a spin
  function sweat(k, n) {
    var cos = Math.cos(k.a), sin = Math.sin(k.a);
    var out = k.lean > 0 ? -1 : 1;
    for (var i = 0; i < n; i++) {
      var side = n > 1 ? (Math.random() < 0.5 ? -1 : 1) : out;
      var fling = 40 + Math.random() * 40;
      parts.push({ t: "sweat", x: k.x + cos * 0.5, y: k.y + sin * 0.5, z: 27,
                   vx: k.vx * 0.85 - sin * side * fling, vy: k.vy * 0.85 + cos * side * fling,
                   vz: 50 + Math.random() * 60, life: 1.2, max: 1.2 });
    }
  }

  // ---------------------------------------------------------------------------
  // The other drivers talk. Get close and they turn round, shake a fist and
  // tell you what they think of your driving, in a speech bubble.
  // ---------------------------------------------------------------------------
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

  function talk(k, text, force) {
    var sp = k.speech;
    if (sp.t > 0 && !force) return;
    if (sp.t > 0.8 && force && sp.text) return;     // let them finish the sentence they're on
    sp.text = text;
    sp.t = 2.6;
    sp.wait = 5 + Math.random() * 5;
    if (near(k) && Math.random() < 0.5 && shell && shell.state() === "playing") honk();
  }

  function chatter(k, dt) {
    var sp = k.speech;
    if (sp.t > 0) sp.t -= dt;
    sp.wait -= dt;
    var dx = player.x - k.x, dy = player.y - k.y, dist = Math.hypot(dx, dy);
    var right = -Math.sin(k.a) * dx + Math.cos(k.a) * dy;
    k.shoutSide = right >= 0 ? 1 : -1;
    // while they're talking they look at you, round over their shoulder if need be
    var want = sp.t > 0 && dist < 400 ? clamp(wrapAngle(Math.atan2(dy, dx) - k.a), -2.7, 2.7) : 0;
    k.headTurn += (want - k.headTurn) * Math.min(1, dt * 7);
    if (sp.t <= 0 && sp.wait <= 0 && dist < 140 && !k.done && k.spin <= 0) {
      talk(k, Math.random() < 0.45 ? pick(k.d.lines) : pick(INSULTS));
    }
  }

  // parp parp
  function honk() {
    N.sound.tone(392, 0.11, { type: "square", vol: 0.09 });
    N.sound.tone(330, 0.16, { type: "square", vol: 0.09, delay: 0.14 });
  }

  // The barriers are forgiving. Hit one and you slide along it: the speed
  // going into the wall goes, most of the rest stays, and the nose is turned
  // back down the road. Only a proper head-on hit costs more than that.
  var WALL_LINES = ["Barrier: consulted", "The wall has been informed", "Contact with the scenery"];
  function walls(k) {
    var limit = WALL - R * 0.7;
    var over = Math.abs(k.lat) - limit;
    if (over <= 0) { k.walled = 0; return; }
    var dir = k.lat > 0 ? 1 : -1;
    var nx = track.nx[k.idx] * dir, ny = track.ny[k.idx] * dir;   // pointing into the wall
    k.x -= nx * over;
    k.y -= ny * over;
    k.lat = dir * limit;
    k.walled = dir;
    var vn = k.vx * nx + k.vy * ny;
    if (vn <= 0) return;
    var tx = k.vx - nx * vn, ty = k.vy - ny * vn;      // what's left, along the wall
    var keep = 1 - Math.min(0.3, vn / 900);
    k.vx = tx * keep - nx * vn * 0.12;
    k.vy = ty * keep - ny * vn * 0.12;
    var along = Math.hypot(tx, ty);
    if (along > 25) {
      var turn = wrapAngle(Math.atan2(ty, tx) - k.a);
      if (Math.abs(turn) < Math.PI / 2) k.a += turn * Math.min(0.7, 0.15 + vn / 200);
    }
    if (vn > 70) {
      impact(k, vn * 0.75, k.x + nx * R, k.y + ny * R, -nx, -ny, true);
      if (k.player && vn > 110) say(pick(WALL_LINES), 0);
    }
  }

  // A knock: sparks, a lean, and past a point, a wheel leaves. Walls (soft)
  // knock you about less than other drivers do.
  function impact(k, strength, cx, cy, px, py, soft) {
    if (strength < 40) return;
    sparks(cx, cy, Math.min(14, strength / 18), px, py);
    var right = { x: -Math.sin(k.a), y: Math.cos(k.a) };
    var sideways = px * right.x + py * right.y;
    k.kick += sideways * strength / (soft ? 900 : 360);
    bump(k, strength / 110);
    k.jig.vuy -= sideways * strength / 25;
    if (near(k)) thud(strength);
    if (k.player) shake(Math.min(soft ? 0.5 : 0.9, strength / 260));
    if (strength > (soft ? 200 : 175) && k.wheelOff <= 0 && Math.random() < 0.5) {
      k.wheelOff = 3;
      k.wheelSide = Math.random() < 0.5 ? -1 : 1;
      var wx = k.x + (Math.cos(k.a) * 8 - Math.sin(k.a) * 8 * k.wheelSide) * KART;
      var wy = k.y + (Math.sin(k.a) * 8 + Math.cos(k.a) * 8 * k.wheelSide) * KART;
      parts.push({ t: "wheel", x: wx, y: wy, vx: k.vx * 0.9 + px * 60, vy: k.vy * 0.9 + py * 60,
                   z: 0, vz: 160, rot: 0, vr: 14, life: 2.6, max: 2.6 });
      if (k.player) say("Wheel: optional", 2);
    } else if (k.player && strength > 150) {
      say("Physics has given up", 1);
    }
  }

  function collide() {
    for (var i = 0; i < karts.length; i++) {
      for (var j = i + 1; j < karts.length; j++) {
        var a = karts[i], b = karts[j];
        var dx = b.x - a.x, dy = b.y - a.y;
        var d2 = dx * dx + dy * dy;
        if (d2 >= 4 * R * R || Math.abs(a.z - b.z) > 12) continue;
        var d = Math.sqrt(d2) || 0.01;
        var nx = dx / d, ny = dy / d;
        var push = (2 * R - d) / 2;
        a.x -= nx * push; a.y -= ny * push;
        b.x += nx * push; b.y += ny * push;
        var rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
        if (rv < 0) {
          var jmp = -1.45 * rv / 2;
          a.vx -= nx * jmp; a.vy -= ny * jmp;
          b.vx += nx * jmp; b.vy += ny * jmp;
          var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
          impact(a, -rv * 0.8, mx, my, -nx, -ny);
          impact(b, -rv * 0.8, mx, my, nx, ny);
          if ((a.player || b.player) && -rv > 50) {
            var other = a.player ? b : a;
            talk(other, pick(BUMPED), true);
            if (-rv > 90) say(["Sorry, " + other.name, "Contact. Approved", "Insurance: pending review"][Math.floor(Math.random() * 3)], 0);
          }
        }
      }
    }
  }

  function laps(k, prevS) {
    var L = track.length;
    if (prevS > L * 0.75 && k.s < L * 0.25) {
      k.lap += 1;
      if (k.lap >= 2 && k.player && !k.done) {
        var lapTime = raceTime - k.lapStart;
        if (!k.bestLap || lapTime < k.bestLap) k.bestLap = lapTime;
      }
      k.lapStart = raceTime;
      if (k.lap > LAPS && !k.done) finishLine(k);
      else if (k.player && k.lap === LAPS) say("Final lap", 3);
      else if (k.player && k.lap > 1) say("Lap " + k.lap, 3);
    } else if (prevS < L * 0.25 && k.s > L * 0.75) {
      k.lap -= 1;
    }
    k.progress = (k.lap - 1) * L + k.s;
  }

  function finishLine(k) {
    k.done = true;
    k.time = raceTime;
    finishers += 1;
    k.place = finishers;
    if (k.player) playerFinished();
  }

  // ---------------------------------------------------------------------------
  // The other drivers. They aim at a point down the road, slow down for what's
  // coming, wander across the road a little, and dodge whoever is in front.
  // ---------------------------------------------------------------------------
  function drive(k, dt) {
    var ai = k.ai;
    var speed = Math.hypot(k.vx, k.vy);
    if (raceTime < ai.delay && !k.done) return IDLE;

    if (ai.reverse > 0) {
      ai.reverse -= dt;
      var back = wrapAngle(Math.atan2(track.dy[k.idx], track.dx[k.idx]) - k.a);
      return { steer: back > 0 ? -1 : 1, throttle: 0, brake: 1 };
    }
    ai.stuck = speed < 18 && k.spin <= 0 ? ai.stuck + dt : 0;
    if (ai.stuck > 1.1) { ai.stuck = 0; ai.reverse = 0.8; }

    // now and then a mistake is saved up and spent on the next proper corner
    ai.oops -= dt;
    if (ai.oops <= 0) ai.armed = true;
    if (ai.overcook > 0) ai.overcook -= dt;

    ai.lane += dt * ai.wander;
    var look = 55 + speed * 0.42;
    var j = ahead(k.idx, look);
    var lane = Math.sin(ai.lane) * HW * 0.4 + ai.bias;
    lane += clamp(track.k[ahead(k.idx, look * 1.6)] * 4200, -HW * 0.45, HW * 0.45);   // cut to the inside

    // dodge a kart just ahead
    for (var o = 0; o < karts.length; o++) {
      var other = karts[o];
      if (other === k) continue;
      var gap = other.s - k.s;
      if (gap < -track.length / 2) gap += track.length;
      if (gap > 0 && gap < 80 && Math.abs(other.lat - k.lat) < 32) {
        lane = other.lat + (other.lat > 0 ? -36 : 36);
      }
    }
    // they own the road: some of the time, if you're right behind, they move over to block you
    ai.mood -= dt;
    if (ai.mood <= 0) { ai.hog = !ai.hog && k.rand() < 0.4; ai.mood = 3 + k.rand() * 6; }
    if (ai.hog && player && !k.player && !k.done) {
      var behind = k.s - player.s;
      if (behind < -track.length / 2) behind += track.length;
      if (behind > track.length / 2) behind -= track.length;
      // ...but not into you once you're alongside: that's a different conversation
      if (behind > 30 && behind < 120) lane += (player.lat - lane) * 0.7;
    }
    lane = clamp(lane, -HW * 0.75, HW * 0.75);

    var tx = track.x[j] + track.nx[j] * lane, ty = track.y[j] + track.ny[j] * lane;
    var diff = wrapAngle(Math.atan2(ty - k.y, tx - k.x) - k.a);
    var steer = clamp(diff * 2.3, -1, 1);

    // slow down in time for the corners ahead (a little more when they're
    // well ahead of you, see rubberBand)
    var target = MAX * k.power;
    var reach = speed * 1.2 + 120;
    var sharpest = MAX;
    var care = k.form.corner * Math.max(0.86, Math.min(1.04, k.power / k.form.power));
    for (var u = 10; u < reach; u += 20) {
      var m = ahead(k.idx, u);
      sharpest = Math.min(sharpest, track.safe[m]);
      var safe = track.safe[m] * care;
      var allowed = Math.sqrt(safe * safe + 2 * BRAKE * 0.6 * u);
      if (allowed < target) target = allowed;
    }
    // ...and arrive at it far too keen, like everyone else
    if (ai.armed && sharpest < MAX * 0.75 && !k.done) {
      ai.armed = false;
      ai.overcook = 2.2;
      ai.oops = 20 + k.slip() * 20;
    }
    if (ai.overcook > 0) {
      target = Math.min(MAX * k.power, target * 1.7);
      // the driver's weight goes the wrong way and takes the kart with it
      if (Math.abs(k.lean) > 0.7) k.kick += (k.lean > 0 ? 1 : -1) * dt * 5;
    }
    if (k.offroad) target = Math.min(target, MAX * 0.45);
    if (k.done) target = Math.min(target, MAX * 0.5);
    var throttle = speed < target - 6 ? 1 : speed < target + 4 ? 0.35 : 0;
    var brake = speed > target + 16 ? clamp((speed - target) / 80, 0.25, 1) : 0;
    // gas on a long straight, when they've got some
    var gas = k.gas >= 1 && !k.done && raceTime > 4 && sharpest > MAX * 0.85 && speed > MAX * 0.5 && Math.random() < dt * 0.5;
    return { steer: steer, throttle: throttle, brake: brake, gas: gas };
  }

  // Keep the race close: anyone well ahead of you eases off (out of sight, so
  // nobody sees them dawdle), anyone behind finds a bit. Each settles at their
  // own distance from you (pace), so the three of them don't travel as a wall.
  // The final lap is a straight race, everyone at their own pace, so where
  // you finish is down to how you drive it.
  function rubberBand(k) {
    if (k.player || !player) return;
    if (k.lap >= LAPS || player.lap >= LAPS) { k.power = k.form.power; return; }
    var gap = player.progress - k.progress + k.form.pace;
    k.power = k.form.power * (1 + clamp(gap / 1500, -0.2, 0.08));
  }

  // ---------------------------------------------------------------------------
  // Sparks, puffs, gravel, loose wheels and tyre marks
  // ---------------------------------------------------------------------------
  function sparks(x, y, n, dx, dy) {
    var count = shell && shell.reduceMotion ? Math.ceil(n / 3) : n;
    for (var i = 0; i < count; i++) {
      var ang = Math.atan2(dy, dx) + (Math.random() - 0.5) * 2.2;
      var sp = 80 + Math.random() * 220;
      parts.push({ t: "spark", x: x, y: y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: 0.25 + Math.random() * 0.2, max: 0.45 });
    }
  }

  function puff(x, y, size) {
    parts.push({ t: "puff", x: x + (Math.random() - 0.5) * 10, y: y + (Math.random() - 0.5) * 10,
                 vx: (Math.random() - 0.5) * 30, vy: (Math.random() - 0.5) * 30,
                 r: 5 + Math.random() * 5 * size, life: 0.7, max: 0.7 });
  }

  function effects(k, dt, vf, vr, speed) {
    var cos = Math.cos(k.a), sin = Math.sin(k.a);
    // scraping the floor on two wheels
    if (k.twoWheel && speed > 60) {
      k.scrapeWait -= dt;
      if (k.scrapeWait <= 0) {
        k.scrapeWait = 0.05;
        var side = k.lean > 0 ? -1 : 1;
        sparks(k.x - (cos * 6 + sin * 8 * side) * KART, k.y - (sin * 6 - cos * 8 * side) * KART, 2, -cos, -sin);
      }
    }
    // gravel spray
    if (k.offroad && speed > 50 && Math.random() < dt * 30) {
      parts.push({ t: "grit", x: k.x - cos * 10 * KART, y: k.y - sin * 10 * KART,
                   vx: -k.vx * 0.3 + (Math.random() - 0.5) * 60, vy: -k.vy * 0.3 + (Math.random() - 0.5) * 60,
                   life: 0.45, max: 0.45 });
    }
    // smoke off the line, and when sliding
    if ((speed < 120 && vf > 10 && Math.random() < dt * 14) || (Math.abs(vr) > 70 && Math.random() < dt * 18)) {
      puff(k.x - cos * 13 * KART, k.y - sin * 13 * KART, 0.5);
    }
    // tyre marks
    var marking = !k.offroad && k.z <= 0 && (Math.abs(vr) > 55 || k.twoWheel || k.spin > 0);
    for (var w = -1; w <= 1; w += 2) {
      var wx = k.x - (cos * 7.5 + sin * 8 * w) * KART, wy = k.y - (sin * 7.5 - cos * 8 * w) * KART;
      var key = w < 0 ? "skidL" : "skidR";
      var prev = k[key];
      if (!marking) { k[key] = null; continue; }
      if (!prev) { k[key] = [wx, wy]; continue; }
      if (Math.hypot(wx - prev[0], wy - prev[1]) > 6) {
        skids.push([prev[0], prev[1], wx, wy]);
        if (skids.length > 1400) skids.splice(0, 200);
        k[key] = [wx, wy];
      }
    }
  }

  function stepParts(dt) {
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      p.life -= dt;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      var drag = p.t === "spark" ? 3 : p.t === "puff" ? 2.5 : p.t === "wheel" ? 0.6 : p.t === "sweat" ? 0.3 : 4;
      p.vx *= Math.exp(-drag * dt);
      p.vy *= Math.exp(-drag * dt);
      if (p.t === "puff") { p.r += dt * 14; if (p.z != null) p.z += dt * 8; }
      if (p.t === "sweat") {
        p.vz -= 520 * dt;
        p.z += p.vz * dt;
        if (p.z <= 0) p.life = 0;
      }
      if (p.t === "wheel") {
        p.vz -= 700 * dt;
        p.z += p.vz * dt;
        if (p.z < 0) { p.z = 0; p.vz *= -0.45; p.vr *= 0.7; }
        p.rot += p.vr * dt;
      }
    }
    if (parts.length > 320) parts.splice(0, parts.length - 320);
  }

  // ---------------------------------------------------------------------------
  // Sound: the player's engine, and thuds
  // ---------------------------------------------------------------------------
  function near(k) { return player && Math.hypot(k.x - player.x, k.y - player.y) < VIEW * 0.7; }

  function thud(strength) {
    var vol = Math.min(0.45, strength / 500);
    N.sound.tone(110, 0.14, { type: "sine", slide: 40, vol: vol });
    N.sound.noise(0.1, { freq: 500, vol: vol * 0.7 });
  }

  // A long, low, wobbling note, for the Gas button. Made in code, like the rest.
  function fart(vol) {
    var ac = N.sound.ctx();
    if (!ac || ac.state !== "running") return;
    var t = ac.currentTime, dur = 0.55 + Math.random() * 0.3;
    var osc = ac.createOscillator(), wob = ac.createOscillator(), wobGain = ac.createGain();
    var filter = ac.createBiquadFilter(), gain = ac.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(92 + Math.random() * 20, t);
    osc.frequency.exponentialRampToValueAtTime(48, t + dur);
    wob.frequency.value = 18 + Math.random() * 10;
    wobGain.gain.value = 26;
    wob.connect(wobGain);
    wobGain.connect(osc.frequency);
    filter.type = "lowpass";
    filter.frequency.value = 520;
    filter.Q.value = 7;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.32 * vol, t + 0.03);
    gain.gain.setValueAtTime(0.28 * vol, t + dur * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(N.sound.out());
    osc.start(t);
    wob.start(t);
    osc.stop(t + dur + 0.05);
    wob.stop(t + dur + 0.05);
  }

  function startEngine() {
    var ac = N.sound.ctx();
    if (!ac || engine) return;
    var o1 = ac.createOscillator(), o2 = ac.createOscillator();
    var filter = ac.createBiquadFilter(), gain = ac.createGain();
    o1.type = "sawtooth";
    o2.type = "square";
    filter.type = "lowpass";
    filter.frequency.value = 420;
    gain.gain.value = 0;
    o1.connect(filter);
    o2.connect(filter);
    filter.connect(gain);
    gain.connect(N.sound.out());
    o1.start();
    o2.start();

    // The tyres: a warbling square that squeals when you're sliding or up on
    // two wheels (the warning before a spin), and a loop of noise for the
    // scrape along a barrier and the rattle of gravel. Silent until needed.
    var sq = ac.createOscillator(), wob = ac.createOscillator(), wobGain = ac.createGain();
    var sqFilter = ac.createBiquadFilter(), sqGain = ac.createGain();
    sq.type = "square";
    sq.frequency.value = 980;
    wob.frequency.value = 23;
    wobGain.gain.value = 45;
    wob.connect(wobGain);
    wobGain.connect(sq.frequency);
    sqFilter.type = "bandpass";
    sqFilter.frequency.value = 1300;
    sqFilter.Q.value = 3;
    sqGain.gain.value = 0;
    sq.connect(sqFilter);
    sqFilter.connect(sqGain);
    sqGain.connect(N.sound.out());
    sq.start();
    wob.start();
    var buf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate), data = buf.getChannelData(0);
    for (var i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    var hiss = ac.createBufferSource(), rough = ac.createBiquadFilter(), roughGain = ac.createGain();
    hiss.buffer = buf;
    hiss.loop = true;
    rough.type = "bandpass";
    rough.Q.value = 0.9;
    rough.frequency.value = 500;
    roughGain.gain.value = 0;
    hiss.connect(rough);
    rough.connect(roughGain);
    roughGain.connect(N.sound.out());
    hiss.start();
    engine = { o1: o1, o2: o2, filter: filter, gain: gain, ac: ac, squeal: sqGain, sq: sq, rough: rough, roughGain: roughGain };
  }

  function engineNote(speed, throttle, on) {
    if (!engine) return;
    var t = engine.ac.currentTime;
    var f = 40 + speed * 0.3 + throttle * 12 + Math.sin(raceTime * 31) * 1.5;
    engine.o1.frequency.setTargetAtTime(f, t, 0.05);
    engine.o2.frequency.setTargetAtTime(f * 0.5, t, 0.05);
    engine.filter.frequency.setTargetAtTime(320 + speed * 2.2, t, 0.08);
    engine.gain.gain.setTargetAtTime(on ? 0.035 + throttle * 0.03 : 0, t, 0.12);

    // tyres: louder and higher the nearer the spin
    var k = player, squeal = 0, rough = 0, at = 500;
    if (on && k && k.z <= 0 && k.spin <= 0 && speed > 60) {
      var cos = Math.cos(k.a), sin = Math.sin(k.a);
      var slide = Math.abs(-k.vx * sin + k.vy * cos);
      squeal = Math.max(clamp((slide - 40) / 90, 0, 1) * 0.5, k.twoWheel ? 0.55 : 0, k.tip > 0 ? 0.75 + k.tip / TIP_TIME * 0.25 : 0);
      if (k.walled) { rough = 0.09; at = 1500; }
      else if (k.offroad) { rough = 0.07 * Math.min(1, speed / 150); at = 380; }
    }
    engine.sq.frequency.setTargetAtTime(900 + squeal * 300, t, 0.05);
    engine.squeal.gain.setTargetAtTime(squeal * 0.032, t, squeal ? 0.03 : 0.08);
    engine.rough.frequency.setTargetAtTime(at, t, 0.02);
    engine.roughGain.gain.setTargetAtTime(rough, t, rough ? 0.02 : 0.06);
  }

  // ---------------------------------------------------------------------------
  // Callouts and camera shake
  // ---------------------------------------------------------------------------
  var calloutPriority = 0;
  function say(text, priority) {
    if (!shell || shell.state() !== "playing") return;
    var since = raceTime - lastCallout;
    if (since < 1.3 && priority <= calloutPriority) return;
    lastCallout = raceTime;
    calloutPriority = priority;
    shell.callout(text, { sound: priority >= 2 });
  }

  function shake(amount) {
    if (shell && shell.reduceMotion) return;
    cam.shake = Math.max(cam.shake, amount);
  }

  // ---------------------------------------------------------------------------
  // The round
  // ---------------------------------------------------------------------------
  function reset(sh) {
    shell = sh;
    T = sh.tokens;
    karts = DRIVERS.map(makeKart);
    player = karts[3];
    var deal = FORM.slice();
    for (var f = deal.length - 1; f > 0; f--) {
      var g = Math.floor(shell.random() * (f + 1)), swap = deal[f];
      deal[f] = deal[g];
      deal[g] = swap;
    }
    karts.forEach(function (k, i) { if (!k.player) { k.form = deal[i]; k.power = deal[i].power; } });
    parts = [];
    skids = [];
    raceTime = 0;
    acc = 0;
    finishers = 0;
    lastCallout = -10;
    calloutPriority = 0;
    lastPlace = 4;
    flags = {};
    cam.x = player.x + Math.cos(player.a) * 60;
    cam.y = player.y + Math.sin(player.a) * 60;
    cam.zoom = Math.min(W, H) / VIEW;
    cam.shake = 0;
    camA = player.a;
    var grid = GRID.slice().sort(function () { return shell.random() - 0.5; });
    karts.filter(function (k) { return !k.player; }).sort(function () { return shell.random() - 0.5; }).slice(0, 2)
      .forEach(function (k, i) { k.speech = { text: grid[i], t: 3.6 + i * 0.4, wait: 6 }; k.headTurn = Math.PI * 0.9 * (i ? 1 : -1); });
    if (!Object.keys(looks).length) {
      DRIVERS.forEach(function (d) {
        looks[d.name] = { car: T[d.look.car], shirt: T[d.look.shirt], shirtDots: !!d.look.shirtDots, pants: T[d.look.pants],
                          hat: d.look.hat, hatColour: T[d.look.hatColour], tache: !!d.look.tache };
      });
    }
    if (!scenery.length) buildScenery();
    initGround();
    if (!hudEls) buildHud();
    startEngine();
    paintHud();
    noticed = false;
    // On a small phone the screen can start below the fold, with the touch
    // buttons off the bottom, and a page can't be scrolled by the screen once
    // the race is on: bring all of it into view (a kit gap)
    if (root.classList.contains("kit-touching") && !N.flags.clip) {
      var scr = root.closest(".screen") || root, box = scr.getBoundingClientRect();
      if (box.top < 0 || box.bottom > window.innerHeight) scr.scrollIntoView({ block: "center", behavior: shell.reduceMotion ? "auto" : "smooth" });
    }
  }

  // The notice goes up with the countdown, so it's read before Go, and comes
  // down soon after it (a little later the first time), since on a phone it
  // sits over your kart. Filming a clip, it's only the title, gone by Go.
  var noticed = false, briefed = false;
  function notice() {
    var go = 250 + 3 * (shell.reduceMotion ? 650 : 700);   // when the kit's countdown says Go
    var title = shell.daily ? "Today's race: three laps" : "Three laps";
    if (N.flags.clip) { shell.brief({ title: title, ms: go }); return; }
    var touch = root.classList.contains("kit-touching");
    shell.brief({
      title: title,
      text: (touch ? "It goes by itself. " : "Hold Up to go. ") +
            "Steer early: the car takes a moment to agree. Brake before the arrow boards, not in the corner.",
      ms: go + (briefed ? 700 : 2200)
    });
    briefed = true;
  }

  function update(dt, input) {
    acc += dt;
    var steps = 0;
    while (acc >= STEP && steps < 8) {
      step(STEP, input);
      acc -= STEP;
      steps += 1;
    }
    if (steps === 8) acc = 0;
    paintHud();
  }

  // The clock keeps running after the player finishes: the others carry on
  function step(dt, input) {
    raceTime += dt;
    if (!flags.concerns && raceTime > 4) { flags.concerns = true; say("The car has concerns", 1); }   // once the notice is down

    for (var i = 0; i < karts.length; i++) {
      var k = karts[i];
      var ctl;
      if (k.player && !k.done && !AUTOPILOT) {
        var brake = input.down ? 1 : 0;
        var throttle = input.mode === "touch" ? (brake ? 0 : 1) : (input.up ? 1 : 0);
        ctl = { steer: clamp(input.steer, -1, 1), throttle: throttle, brake: brake, gas: input.action && !k.gasHeld };
        k.gasHeld = input.action;
      } else {
        rubberBand(k);
        ctl = drive(k, dt);
      }
      if (k.player) k.ctl = ctl;
      stepKart(k, dt, ctl);
    }
    collide();
    slipstream(dt);
    stepParts(dt);
    rank();
    teach(dt, input);
  }

  // The first two laps teach the brake: arrive at a proper corner far too
  // fast and the pointer says Brake, early enough to do it, until you've
  // braked into a corner once (see pointer)
  function teach(dt, input) {
    if (flags.brakeHint > 0) flags.brakeHint -= dt;
    if (AUTOPILOT || learned.brake || player.done || player.lap > 2 || raceTime < 3) return;
    var speed = Math.hypot(player.vx, player.vy);
    var corner = false, late = false;
    for (var u = 10; u < speed + 60; u += 20) {
      var safe = track.safe[ahead(player.idx, u)];
      if (safe > MAX * 0.7) continue;
      corner = true;
      if (speed > Math.sqrt(safe * safe + BRAKE * 0.6 * u) + 10) late = true;
    }
    if (input.down && corner && speed > 120) { learned.brake = true; flags.brakeHint = 0; return; }
    if (late) flags.brakeHint = 1;
  }

  // Tuck in right behind someone and the air's easier. Not nicer: easier.
  function slipstream(dt) {
    for (var i = 0; i < karts.length; i++) {
      var k = karts[i], tucked = false;
      var speed = Math.hypot(k.vx, k.vy);
      if (speed > 150 && k.spin <= 0 && !k.offroad) {
        for (var j = 0; j < karts.length; j++) {
          var o = karts[j];
          if (o === k) continue;
          var gap = o.s - k.s;
          if (gap < -track.length / 2) gap += track.length;
          if (gap > 28 && gap < 120 && Math.abs(o.lat - k.lat) < 22) { tucked = true; break; }
        }
      }
      k.draft = tucked ? Math.min(1, k.draft + dt * 1.5) : Math.max(0, k.draft - dt * 2.5);
      if (k.player && k.draft > 0.9 && !flags.draft) { flags.draft = true; say("Slipstream: unpleasant", 1); }
    }
  }

  function rank() {
    var order = karts.slice().sort(function (a, b) {
      if (a.done && b.done) return a.time - b.time;
      if (a.done) return -1;
      if (b.done) return 1;
      return b.progress - a.progress;
    });
    var before = {};
    karts.forEach(function (k) { before[k.name] = k.place; });
    order.forEach(function (k, i) { k.place = i + 1; });
    if (raceTime > 4 && !player.done) {
      karts.forEach(function (k) {
        if (k.player || k.done) return;
        var close = Math.hypot(k.x - player.x, k.y - player.y) < 200;
        if (before[k.name] < before.You && k.place > player.place && close) talk(k, pick(PASSED), true);
        else if (before[k.name] > before.You && k.place < player.place && close) talk(k, pick(GLOAT), true);
      });
    }
    // not every time two of you swap places: once in a while, and the first
    // time you take the lead gets its own
    if (player.place < lastPlace && raceTime > 4 && !player.done && raceTime - (flags.passSaid || -99) > 6) {
      flags.passSaid = raceTime;
      say(player.place === 1 && !flags.led ? "Lead: provisional" : "Overtake approved", player.place === 1 ? 1 : 0);
      if (player.place === 1) flags.led = true;
    }
    lastPlace = player.place;
  }

  // The results: one line for each rung of the ladder, about what it did to
  // the car. Beaten, you also hear from whoever won, in their own conviction.
  var LINES = [
    "The car did not enjoy it. Nobody asked the car.",
    "Second. The car is being kept in overnight for observation.",
    "Third. The car's family has been informed.",
    "Last. The car has asked for some time apart."
  ];
  var WINNERS = {
    Gaz: ["Gaz won. He'd like it noted that he pays road tax.", "Gaz won. He says it was his road anyway."],
    Lorraine: ["Lorraine won. She'd like a word with your manager.", "Lorraine won. Pamela didn't break a sweat."],
    Derek: ["Derek won. He has the whole thing on dashcam.", "Derek won. He didn't indicate once."]
  };

  function playerFinished() {
    // bests are times, so lower wins; today's race keeps today's separately
    var rec = shell.record(player.time, { lower: true });
    var lap = shell.record(player.bestLap, { lower: true, key: "bestLap" });
    var stats = [
      { label: "Time", value: N.fmtTime(player.time * 1000) },
      { label: "Best lap", value: player.bestLap ? N.fmtTime(player.bestLap * 1000) : "-", highlight: lap.isNew },
      { label: rec.isNew ? (shell.daily ? "New best today" : "New best") : (shell.daily ? "Best today" : "Best"),
        value: N.fmtTime(rec.best * 1000), highlight: rec.isNew }
    ];
    if (shell.daily) stats.unshift({ label: "Race", value: shell.today });
    var winner = karts.filter(function (k) { return k.done && k.place === 1 && !k.player; })[0];
    shell.finish({
      share: N.fmtTime(player.time * 1000) + ", " + N.ordinal(player.place) + " of " + karts.length,
      place: player.place,
      total: karts.length,
      heading: player.place === 1 ? "You won." : "You finished " + N.ordinal(player.place) + ".",
      line: (winner ? pick(WINNERS[winner.name]) + " " : "") + LINES[player.place - 1],
      stats: stats
    });
  }

  // ---------------------------------------------------------------------------
  // HUD: lap and time top left, position top right
  // ---------------------------------------------------------------------------
  function buildHud() {
    var hud = shell.hud;
    hud.innerHTML =
      '<div class="kit-hud-tl">' +
        '<p class="kit-stat"><small>Lap</small><span data-lap>1</span>/' + LAPS + '</p>' +
        '<p class="kit-mono" data-time>0:00.00</p>' +
        '<p class="kit-meter" data-meter data-pad><span class="kit-meter-label">Gas</span><span class="kit-meter-bar"><span data-gas></span></span></p>' +
      '</div>' +
      '<div class="kit-hud-tr">' +
        '<p class="kit-stat kit-stat-big"><span data-pos>4</span><small data-suffix>th</small></p>' +
        '<p class="kit-stat"><small>of</small>' + DRIVERS.length + '</p>' +
      '</div>';
    hudEls = {
      lap: hud.querySelector("[data-lap]"),
      time: hud.querySelector("[data-time]"),
      pos: hud.querySelector("[data-pos]"),
      suffix: hud.querySelector("[data-suffix]"),
      meter: hud.querySelector("[data-meter]"),
      gas: hud.querySelector("[data-gas]"),
      bar: hud.querySelector(".kit-meter-bar")
    };
  }

  function setText(node, text) { if (node.textContent !== text) node.textContent = text; }

  function paintHud() {
    if (!hudEls || !player) return;
    setText(hudEls.lap, String(clamp(player.lap, 1, LAPS)));
    setText(hudEls.time, N.fmtTime((player.done ? player.time : raceTime) * 1000));
    var ord = N.ordinal(player.place);
    setText(hudEls.pos, String(player.place));
    setText(hudEls.suffix, ord.slice(-2));
    var gas = Math.round(player.gas * 100) + "%";
    if (hudEls.gas.style.width !== gas) hudEls.gas.style.width = gas;
    hudEls.meter.classList.toggle("is-full", player.gas >= 1);
    if (shell.padFill) shell.padFill("action", player.gas);
  }

  // ---------------------------------------------------------------------------
  // Drawing
  // ---------------------------------------------------------------------------
  function resize(w, h, dpr) {
    W = w; H = h; DPR = dpr;
    ctx = shell ? shell.canvas.getContext("2d") : root.querySelector("canvas").getContext("2d");
    patterns = null;
    mini = null;
    sky = null;
    boxes = null;
    padBoxes = {};
    if (glCanvas) {
      glCanvas.width = Math.round(w * dpr);
      glCanvas.height = Math.round(h * dpr);
    }
  }

  // Speckle textures, drawn big and scaled down so they stay crisp when zoomed
  function speckle(c, size, dots, rMin, rMax, colour, alpha, seed) {
    var tile = document.createElement("canvas");
    tile.width = tile.height = size;
    var x = tile.getContext("2d");
    var rand = seeded(seed);
    x.fillStyle = colour;
    x.globalAlpha = alpha;
    for (var i = 0; i < dots; i++) {
      var px = rand() * size, py = rand() * size, r = rMin + rand() * (rMax - rMin);
      for (var ox = -size; ox <= size; ox += size) {
        for (var oy = -size; oy <= size; oy += size) {
          x.beginPath();
          x.arc(px + ox, py + oy, r, 0, Math.PI * 2);
          x.fill();
        }
      }
    }
    var pat = c.createPattern(tile, "repeat");
    if (pat.setTransform && window.DOMMatrix) pat.setTransform(new DOMMatrix().scale(0.25));
    return pat;
  }

  function seeded(seed) {
    var s = seed;
    return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  }

  // tiles are drawn at four times size: a 512 tile covers 128 world units
  function makePatterns(c) {
    return {
      ground: speckle(c, 512, 34, 5, 10, T.ash, 0.35, 7),
      gravel: speckle(c, 256, 95, 5, 10, T.ash, 0.9, 11),
      road: speckle(c, 256, 70, 3, 7, T.ink, 0.3, 23)
    };
  }

  function ensurePatterns() {
    if (!patterns) patterns = makePatterns(ctx);
  }

  function render(dt) {
    if (!ctx || !player) return;
    if (ground && !ground.lost()) render3D(dt);
    else renderTop(dt);
  }

  // The top-down view: for debugging the map, and for browsers without WebGL
  function renderTop(dt) {
    ensurePatterns();
    var c = ctx;

    // camera: look ahead of the player, pull back a little at speed
    var speed = Math.hypot(player.vx, player.vy);
    var lead = DEBUG && params.get("debug") === "map" ? 0 : 0.34;
    var tx = player.x + player.vx * lead, ty = player.y + player.vy * lead;
    var ease = dt ? Math.min(1, dt * 5) : 1;
    cam.x += (tx - cam.x) * ease;
    cam.y += (ty - cam.y) * ease;
    var wantZoom = Math.min(W, H) / (VIEW + speed * 0.22);
    cam.zoom += (wantZoom - cam.zoom) * (dt ? Math.min(1, dt * 2) : 1);
    var zoom = cam.zoom;
    var cx = cam.x, cy = cam.y;
    if (DEBUG && params.get("debug") === "map") {
      zoom = Math.min(W / (track.maxX - track.minX + 300), H / (track.maxY - track.minY + 300));
      cx = (track.minX + track.maxX) / 2;
      cy = (track.minY + track.maxY) / 2;
    }
    var sx = 0, sy = 0;
    if (cam.shake > 0.01) {
      sx = (Math.random() - 0.5) * cam.shake * 10;
      sy = (Math.random() - 0.5) * cam.shake * 10;
      cam.shake *= Math.exp(-(dt || 0.016) * 7);
    }

    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    c.fillStyle = T.ink;
    c.fillRect(0, 0, W, H);
    c.setTransform(DPR * zoom, 0, 0, DPR * zoom, DPR * (W / 2 - cx * zoom + sx), DPR * (H / 2 - cy * zoom + sy));

    // the visible part of the world
    var halfW = W / 2 / zoom + 20, halfH = H / 2 / zoom + 20;
    c.fillStyle = patterns.ground;
    c.fillRect(cx - halfW, cy - halfH, halfW * 2, halfH * 2);

    drawTrack(c, patterns);
    drawSkids(c);
    drawParts(c, "under");
    var order = karts.slice().sort(function (a, b) { return a.z - b.z; });
    order.forEach(function (k) { drawShadow(c, k); });
    order.forEach(function (k) { drawKart(c, k); });
    drawParts(c, "over");
    if (shell.state() === "countdown" || (shell.state() === "playing" && raceTime < 2.5)) drawYou(c);

    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    drawMini(c);
  }

  function stroke(c, width, style, dash) {
    c.lineWidth = width;
    c.strokeStyle = style;
    c.setLineDash(dash || []);
    c.stroke(track.path);
  }

  function drawTrack(c, pats) {
    c.lineJoin = "round";
    c.lineCap = "butt";
    // wall: a white line with a black edge, then the gravel inside it
    stroke(c, WALL * 2 + 16, T.ink);
    stroke(c, WALL * 2 + 9, T.paper);
    stroke(c, WALL * 2, T.ink);
    stroke(c, WALL * 2, pats.gravel);
    // red and white kerbs, then the road over the middle
    stroke(c, (HW + KERB) * 2, T.paper);
    stroke(c, (HW + KERB) * 2, T.red, [16, 16]);
    stroke(c, HW * 2 + 2, T.ink);
    stroke(c, HW * 2, T.ash);
    stroke(c, HW * 2, pats.road);
    c.globalAlpha = 0.28;
    stroke(c, 3, T.smoke, [26, 34]);
    c.globalAlpha = 1;
    c.setLineDash([]);
    drawStartLine(c);
  }

  // Chequered strip across the road at the start line, and the grid boxes
  function drawStartLine(c) {
    var x = track.x[0], y = track.y[0];
    c.save();
    c.translate(x, y);
    c.rotate(Math.atan2(track.dy[0], track.dx[0]));
    var sq = 8;
    for (var row = 0; row < 2; row++) {
      for (var i = 0; i < (HW * 2) / sq; i++) {
        c.fillStyle = (i + row) % 2 ? T.ink : T.paper;
        c.fillRect(-sq + row * sq, -HW + i * sq, sq, sq);
      }
    }
    c.restore();
    for (var slot = 0; slot < 4; slot++) {
      var r = Math.floor(slot / 2), side = slot % 2 ? 1 : -1;
      var s0 = track.length - 40 - r * 46;
      var j = Math.floor(s0 / 10) % track.n;
      c.save();
      c.translate(track.x[j] + track.nx[j] * side * 19, track.y[j] + track.ny[j] * side * 19);
      c.rotate(Math.atan2(track.dy[j], track.dx[j]));
      c.strokeStyle = T.paper;
      c.globalAlpha = 0.55;
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(-14, -12); c.lineTo(16, -12); c.lineTo(16, 12); c.lineTo(-14, 12);
      c.stroke();
      c.restore();
    }
    c.globalAlpha = 1;
  }

  function drawSkids(c) {
    if (!skids.length) return;
    c.strokeStyle = T.ink;
    c.globalAlpha = 0.5;
    c.lineWidth = 3;
    c.lineCap = "round";
    c.beginPath();
    for (var i = 0; i < skids.length; i++) {
      var s = skids[i];
      c.moveTo(s[0], s[1]);
      c.lineTo(s[2], s[3]);
    }
    c.stroke();
    c.globalAlpha = 1;
  }

  function drawShadow(c, k) {
    c.save();
    c.translate(k.x + 3 + k.z * 0.5, k.y + 5 + k.z * 0.8);
    c.rotate(k.a);
    c.fillStyle = T.ink;
    c.globalAlpha = 0.5;
    c.beginPath();
    c.ellipse(0, 0, 15 * KART, 11 * KART, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();
    c.globalAlpha = 1;
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

  // A tiny kart and the large person in it. Drawn facing right, then turned.
  function drawKart(c, k) {
    var d = k.d;
    var kart = T[d.kart], suit = T[d.suit], stripe = T[d.stripe];
    var edge = d.kart === "ink" ? T.paper : T.ink;    // a black kart needs a white edge to show
    var lean = clamp(k.lean, -1.7, 1.7);
    var lift = k.twoWheel ? Math.min(1, Math.abs(lean) - 1) : 0;
    var liftSide = lean > 0 ? 1 : -1;                 // the wheels on this side leave the ground
    var scale = (1 + k.z / 90) * KART;

    c.save();
    c.translate(k.x, k.y - k.z * 0.4);
    c.rotate(k.a);
    c.scale(scale, scale);
    c.lineJoin = "round";

    // wheels
    var wheels = [[-10, -8.5, 7.5, 4.5, 0], [-10, 8.5, 7.5, 4.5, 0], [9, -8, 6, 4, 1], [9, 8, 6, 4, 1]];
    for (var i = 0; i < 4; i++) {
      var w = wheels[i];
      var sideOf = w[1] > 0 ? 1 : -1;
      if (k.wheelOff > 0 && w[4] === 1 && sideOf === k.wheelSide) continue;
      var up = sideOf === liftSide ? lift : 0;
      c.save();
      c.translate(w[0], w[1] + sideOf * up * 2.5);
      if (w[4]) c.rotate(k.steer * 0.45);
      c.globalAlpha = 1 - up * 0.35;
      c.fillStyle = T.ink;
      c.strokeStyle = edge === T.paper ? T.paper : T.ink;
      roundRect(c, -w[2] / 2, -w[3] / 2, w[2], w[3], 1.4);
      c.fill();
      if (edge === T.paper) { c.lineWidth = 1; c.stroke(); }
      c.fillStyle = T.paper;
      c.fillRect(-1, -w[3] / 2 + 0.8, 2, w[3] - 1.6);
      c.restore();
    }
    c.globalAlpha = 1;

    // chassis, nose and engine: long enough that the kart's colour shows at
    // both ends, narrow enough that the driver spills over the sides
    c.lineWidth = 2;
    c.strokeStyle = edge;
    c.fillStyle = kart;
    roundRect(c, -16, -6, 29, 12, 3.5);
    c.fill();
    c.stroke();
    c.fillStyle = T.paper;
    c.strokeStyle = T.ink;
    roundRect(c, 12, -5, 4, 10, 1.6);
    c.fill();
    c.stroke();
    c.fillStyle = T.ink;
    c.fillRect(-17.5, -3.5, 3, 7);

    // the driver, who is most of the vehicle
    var off = -lean * 2.6;
    c.lineWidth = 2.2;
    c.strokeStyle = T.ink;
    c.fillStyle = suit;
    c.beginPath();
    c.arc(-4, off, 9.2, 0, Math.PI * 2);
    c.fill();
    c.save();
    c.clip();
    c.fillStyle = stripe;
    c.fillRect(-15, off - 1.6, 22, 3.2);
    c.restore();
    c.stroke();
    // arms out to the wheel
    for (var s = -1; s <= 1; s += 2) {
      c.beginPath();
      c.moveTo(-1, off + s * 6.5);
      c.lineTo(7.5, s * 3.4);
      c.lineCap = "round";
      c.lineWidth = 4.6;
      c.strokeStyle = T.ink;
      c.stroke();
      c.lineWidth = 2.6;
      c.strokeStyle = suit;
      c.stroke();
    }
    // helmet: white, red stripe, black visor at the front
    var hy = -lean * 3.1;
    c.beginPath();
    c.arc(1.5, hy, 5.6, 0, Math.PI * 2);
    c.fillStyle = T.paper;
    c.fill();
    c.save();
    c.clip();
    c.fillStyle = T.red;
    c.fillRect(-4.5, hy - 1.3, 12, 2.6);
    c.restore();
    c.lineWidth = 1.8;
    c.strokeStyle = T.ink;
    c.stroke();
    c.beginPath();
    c.arc(1.5, hy, 4, -0.95, 0.95);
    c.lineWidth = 2.8;
    c.stroke();

    c.restore();
  }

  function drawParts(c, layer) {
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      var fade = p.life / p.max;
      if (layer === "under" && p.t === "grit") {
        c.globalAlpha = fade;
        c.fillStyle = T.smoke;
        c.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
      } else if (layer === "over" && p.t === "spark") {
        c.globalAlpha = Math.min(1, fade * 1.5);
        c.strokeStyle = T.paper;
        c.lineWidth = 1.6;
        c.beginPath();
        c.moveTo(p.x, p.y);
        c.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03);
        c.stroke();
      } else if (layer === "over" && p.t === "puff") {
        // the art's smoke: white, with the accent behind it
        c.globalAlpha = fade * 0.9;
        c.fillStyle = T.accent;
        c.beginPath();
        c.arc(p.x + p.r * 0.25, p.y + p.r * 0.3, p.r, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = T.paper;
        c.beginPath();
        c.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        c.fill();
      } else if (layer === "over" && p.t === "wheel") {
        c.globalAlpha = Math.min(1, fade * 2);
        c.save();
        c.translate(p.x, p.y - p.z * 0.5);
        c.rotate(p.rot);
        c.fillStyle = T.ink;
        c.strokeStyle = T.paper;
        c.lineWidth = 1.2;
        roundRect(c, -5.5, -3.5, 11, 7, 2);
        c.fill();
        c.stroke();
        c.fillStyle = T.red;
        c.fillRect(-1, -1, 2, 2);
        c.restore();
      }
    }
    c.globalAlpha = 1;
  }

  // "YOU", just behind the player's kart on the grid, pointing at it
  function drawYou(c) {
    var bx = -Math.cos(player.a), by = -Math.sin(player.a);
    var x = player.x + bx * 44, y = player.y + by * 44;
    c.save();
    c.translate(x, y);
    c.fillStyle = T.paper;
    c.strokeStyle = T.ink;
    c.lineWidth = 3;
    c.lineJoin = "round";
    c.font = "15px " + T.display;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.strokeText("YOU", 0, 1);
    c.fillText("YOU", 0, 1);
    c.rotate(Math.atan2(-by, -bx));
    c.beginPath();
    c.moveTo(17, -5);
    c.lineTo(17, 5);
    c.lineTo(24, 0);
    c.closePath();
    c.stroke();
    c.fill();
    c.restore();
  }

  // ---------------------------------------------------------------------------
  // The chase view. ground.js draws the floor on a WebGL canvas underneath;
  // the sky, signs, karts and smoke go on the 2D canvas on top, far to near.
  // ---------------------------------------------------------------------------
  function initGround() {
    if (ground || groundFailed) return;
    var HTL = window.HeavyTraffic;
    if (MAP || !HTL || !HTL.createGround || !HTL.drawKart) { groundFailed = true; return; }
    glCanvas = document.createElement("canvas");
    glCanvas.className = "kit-canvas";
    glCanvas.setAttribute("aria-hidden", "true");
    glCanvas.width = Math.round(W * DPR);
    glCanvas.height = Math.round(H * DPR);
    shell.canvas.parentNode.insertBefore(glCanvas, shell.canvas);
    var tex = groundTexture();
    ground = HTL.createGround(glCanvas, tex.canvas, tex.world, T.ink);
    if (!ground) {
      groundFailed = true;
      glCanvas.parentNode.removeChild(glCanvas);
      glCanvas = null;
      return;
    }
    shell.canvas.style.background = "transparent";
  }

  // The whole circuit drawn top-down onto one texture (sides a power of two,
  // smaller on phones), exactly as the top-down view draws it
  function groundTexture() {
    var TW = Math.min(W, H) >= 480 ? 4096 : 2048, TH = TW / 2;
    var pad = WALL + 80;
    var minX = track.minX - pad, minY = track.minY - pad;
    var scale = Math.min(TW / (track.maxX - track.minX + pad * 2), TH / (track.maxY - track.minY + pad * 2));
    var tc = document.createElement("canvas");
    tc.width = TW;
    tc.height = TH;
    var t = tc.getContext("2d");
    t.fillStyle = T.ink;
    t.fillRect(0, 0, TW, TH);
    t.setTransform(scale, 0, 0, scale, -minX * scale, -minY * scale);
    var pats = makePatterns(t);
    t.fillStyle = pats.ground;
    t.fillRect(minX, minY, TW / scale, TH / scale);
    drawTrack(t, pats);
    return { canvas: tc, world: [minX, minY, TW / scale, TH / scale] };
  }

  // Signs (stamps the size of billboards) every so often, and tyre stacks on
  // the outside of the corners
  var SIGNS = ["Not approved", "In poor taste", "Physics: pending review", "No refunds", "Notaste Games",
               "Tight fit", "Suspension: optional", "Contains satire", "Seatbelts: theoretical"];
  function buildScenery() {
    scenery = [];
    var rand = seeded(31);
    for (var s0 = 300, n = 0; s0 < track.length - 200; s0 += 620, n++) {
      var i = Math.floor(s0 / 10) % track.n;
      var side = n % 2 ? 1 : -1;
      if (track.k[i] * side > 0.003) side = -side;     // never on the inside of a corner
      scenery.push({ t: "sign", text: SIGNS[n % SIGNS.length], tilt: (rand() - 0.5) * 0.08,
                     x: track.x[i] + track.nx[i] * side * (WALL + 30), y: track.y[i] + track.ny[i] * side * (WALL + 30) });
    }
    // Arrow boards on the outside of every corner you need to brake for,
    // starting a little before it, pointing the way it goes
    var boards = {};
    for (var c = 0; c < track.n; c++) {
      var prev = (c - 1 + track.n) % track.n;
      if (track.safe[c] < MAX * 0.8 && track.safe[prev] >= MAX * 0.8) {
        var turn = track.k[ahead(c, 60)] > 0 ? 1 : -1;
        for (var b = -4; b <= 8; b += 6) {
          var bi = ahead(c, b * 10);
          boards[bi] = true;
          var o = -turn * (WALL + 16);
          scenery.push({ t: "arrows", turn: turn, x: track.x[bi] + track.nx[bi] * o, y: track.y[bi] + track.ny[bi] * o });
        }
      }
    }
    for (var j = 0; j < track.n; j += 9) {
      if (Math.abs(track.k[j]) < 0.0035) continue;
      var near = false;
      for (var q = -5; q <= 5; q++) if (boards[(j + q + track.n) % track.n]) near = true;
      if (near) continue;
      var out = track.k[j] > 0 ? -1 : 1;
      scenery.push({ t: "tyres", x: track.x[j] + track.nx[j] * out * (WALL + 10), y: track.y[j] + track.ny[j] * out * (WALL + 10) });
    }
    buildBarriers();
  }

  // The low wall along both sides of the circuit, in 20-unit lengths, wherever
  // the white line on the ground is: not where the gravel of two parts of the
  // circuit runs together, and not on the inside of corners too tight for it.
  var BAR_H = 6;
  function buildBarriers() {
    barriers = [];
    var off = WALL + 2;
    [-1, 1].forEach(function (side) {
      var last = null;
      for (var i = 0; i <= track.n; i += 2) {
        var j = i % track.n;
        var x = track.x[j] + track.nx[j] * side * off, y = track.y[j] + track.ny[j] * side * off;
        var clear = true;
        for (var m = 0; m < track.n && clear; m++) {
          var dx = x - track.x[m], dy = y - track.y[m];
          if (dx * dx + dy * dy < (off - 6) * (off - 6)) clear = false;
        }
        var pt = clear ? { x: x, y: y } : null;
        if (pt && last) barriers.push({ ax: last.x, ay: last.y, bx: pt.x, by: pt.y, x: (last.x + pt.x) / 2, y: (last.y + pt.y) / 2, red: (i / 2) % 5 === 0 });
        last = pt;
      }
    });
  }

  function render3D(dt) {
    var c = ctx;
    var HTL = window.HeavyTraffic;
    var speed = Math.hypot(player.vx, player.vy);

    // the camera follows the kart's heading a beat late; in a spin it keeps
    // watching the road rather than spinning with you
    var want = player.a;
    if (player.spin > 0) want = speed > 30 ? Math.atan2(player.vy, player.vx) : camA;
    camA += wrapAngle(want - camA) * (dt ? Math.min(1, dt * 5) : 1);
    var fx = Math.cos(camA), fy = Math.sin(camA);
    // A phone held upright in full window is mostly height: the camera goes
    // up a little and in a little, so more of that height is road, not sky
    var tall = H > W * 1.5;
    var camH = CAM_H * (1 + clamp(H / W - 1.3, 0, 0.9));
    var f = Math.min(W * (tall ? 0.95 : 0.85), H * 0.95) * (1 - Math.min(1, speed / MAX) * 0.1) * (player.boost > 0 ? 0.9 : 1);
    // your kart sits low on screen, but clear of the touch buttons when they're showing
    var kartAt = root.classList.contains("kit-touching") ? (tall ? 0.74 : H > W * 1.3 ? 0.7 : 0.66) : (tall ? 0.78 : 0.8);
    var horizon = clamp(H * kartAt - camH * f / CAM_D, H * 0.2, H * 0.55);
    var sx = 0, sy = 0;
    if (cam.shake > 0.01) {
      sx = (Math.random() - 0.5) * cam.shake * 10;
      sy = (Math.random() - 0.5) * cam.shake * 8;
      cam.shake *= Math.exp(-(dt || 0.016) * 7);
    }
    view = { x: player.x - fx * CAM_D, y: player.y - fy * CAM_D, fx: fx, fy: fy, h: camH, f: f,
             cx: W / 2 + sx, horizon: horizon + sy, dpr: DPR, fogNear: 650, fogFar: 1900 };
    ground.draw(view);

    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    c.clearRect(0, 0, W, H);
    drawSky(c);
    drawSkids3D(c);

    var items = [];
    function add(x, y, draw) {
      var depth = (x - view.x) * fx + (y - view.y) * fy;
      if (depth < 12 || depth > view.fogFar + 100) return;
      items.push({ depth: depth, draw: draw });
    }
    scenery.forEach(function (o) { add(o.x, o.y, function (d) { fogged(d, function () { drawScenery(c, o); }); }); });
    for (var b = 0; b < barriers.length; b++) {
      var bar = barriers[b];
      var bd = (bar.x - view.x) * fx + (bar.y - view.y) * fy;
      if (bd < 20 || bd > view.fogFar) continue;
      items.push({ depth: bd, bar: bar, draw: drawBarrierAt });
    }
    karts.forEach(function (k) { add(k.x, k.y, function (d) { fogged(d, function () { HTL.drawKart(c, k, view, looks[k.name], T, DPR); }, !k.player); }); });
    parts.forEach(function (p) { add(p.x, p.y, function (d) { fogged(d, function () { drawPart3D(c, p); }); }); });
    items.sort(function (a, b) { return b.depth - a.depth; });
    items.forEach(function (it) { it.draw(it.depth, it.bar); });

    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    c.globalAlpha = 1;
    if (!shell.reduceMotion && (player.boost > 0 || player.draft > 0.5)) speedLines(c, player.boost > 0 ? 9 : 4);
    drawMini(c);
    // Speech bubbles go on last, nearest speaker first, each clear of the
    // HUD, the minimap, the pointer and the bubbles already up: they stack,
    // never overlap
    var placed = [miniRect()];
    var arrow = pointer();
    if (arrow) placed.push(arrow.box);
    karts.filter(function (k) { return !k.player && k.speech.t > 0 && k.speech.text; })
      .sort(function (a, b) { return Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y); })
      .forEach(function (k) { drawBubble(c, k, placed); });
    if (arrow) drawPointer(c, arrow);
  }

  // Where the HUD and the buttons sit over the canvas, in CSS pixels.
  // Measured now and then, since the lap and the time change width.
  var boxes = null, boxAge = 0;
  function hudBoxes() {
    if (boxes && ++boxAge < 60) return boxes;
    boxAge = 0;
    var base = root.getBoundingClientRect();
    boxes = [];
    Array.prototype.forEach.call(root.querySelectorAll(".kit-hud-tl, .kit-hud-tr, .kit-bar"), function (el) {
      var r = el.getBoundingClientRect();
      if (r.width) boxes.push({ x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height });
    });
    return boxes;
  }
  // A touch button's place over the canvas, measured once it's showing
  var padBoxes = {};
  function padBox(key) {
    if (padBoxes[key]) return padBoxes[key];
    var el = root.querySelector('.kit-pad[data-key="' + key + '"]');
    if (!el) return null;
    var r = el.getBoundingClientRect(), base = root.getBoundingClientRect();
    if (!r.width) return null;
    padBoxes[key] = { x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height };
    return padBoxes[key];
  }

  // The pointer (DESIGN.md, section 10): a bobbing arrow with a word on it,
  // at the one thing to do right now, until you've shown you know. On the
  // first laps: Brake, when you arrive at a corner far too fast, until you've
  // braked into one; and Gas, the first time it's full, until you've used it.
  // On a touch screen it points at the button.
  function pointer() {
    if (AUTOPILOT || !player || player.done || shell.state() !== "playing") return null;
    var touch = root.classList.contains("kit-touching");
    var a = null;
    if (flags.brakeHint > 0) {
      var bp = touch && padBox("down");
      if (bp) a = { x: bp.x - 6, y: bp.y + bp.h / 2, dir: "right", word: "Brake" };
      else {
        var at = window.HeavyTraffic.placeOnScreen(view, player.x, player.y, 58);
        if (at) a = { x: at.x, y: at.y - 4, dir: "down", word: "Brake: press Down" };
      }
    } else if (!learned.gas && player.gas >= 1 && raceTime > 3 && player.lap <= 2) {
      var gp = touch && padBox("action");
      if (gp) a = { x: gp.x + gp.w / 2, y: gp.y - 6, dir: "down", word: "Tap Gas" };
      else if (hudEls && hudEls.bar) {
        var r = hudEls.bar.getBoundingClientRect(), base = root.getBoundingClientRect();
        if (r.width) a = { x: r.left - base.left + r.width / 2, y: r.bottom - base.top + 6, dir: "up", word: "Gas: press Space" };
      }
    }
    if (!a) return null;
    // the word sits beyond the arrow's tail; keep it on the screen
    var size = 13, tw = a.word.length * size * 0.5 + 8;
    var len = 22;
    if (a.dir === "down") a.box = { x: a.x - tw / 2, y: a.y - len - size - 6, w: tw, h: len + size + 6 };
    else if (a.dir === "up") a.box = { x: a.x - tw / 2, y: a.y, w: tw, h: len + size + 6 };
    else a.box = { x: a.x - len - tw, y: a.y - size - 14, w: len + tw, h: size + 28 };
    var dx = clamp(a.box.x, 4, W - a.box.w - 4) - a.box.x;
    a.wordX = dx;
    a.size = size;
    a.len = len;
    a.box.x += dx;
    return a;
  }

  function drawPointer(c, a) {
    var bob = shell.reduceMotion ? 0 : Math.abs(Math.sin(raceTime * 5)) * 5;
    var s = a.len;
    c.save();
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    c.translate(a.x, a.y);
    c.lineJoin = "round";
    c.font = a.size + "px " + T.display;
    c.textBaseline = "middle";
    var wx, wy, ang;
    if (a.dir === "down") { ang = 0; c.translate(0, -bob); wx = a.wordX; wy = -s - a.size * 0.5 - 4; c.textAlign = "center"; }
    else if (a.dir === "up") { ang = Math.PI; c.translate(0, bob); wx = a.wordX; wy = s + a.size * 0.5 + 4; c.textAlign = "center"; }
    else { ang = -Math.PI / 2; c.translate(-bob, 0); wx = -s * 0.4; wy = -a.size - 4; c.textAlign = "right"; }
    // the word
    c.lineWidth = 3;
    c.strokeStyle = T.ink;
    c.fillStyle = T.paper;
    c.strokeText(a.word.toUpperCase(), wx, wy);
    c.fillText(a.word.toUpperCase(), wx, wy);
    // the arrow, its tip at the origin
    c.rotate(ang);
    c.beginPath();
    c.moveTo(-5, -s); c.lineTo(5, -s); c.lineTo(5, -11); c.lineTo(11, -11); c.lineTo(0, 0); c.lineTo(-11, -11); c.lineTo(-5, -11);
    c.closePath();
    c.fillStyle = T.paper;
    c.fill();
    c.lineWidth = 2;
    c.stroke();
    c.restore();
  }

  function overlaps(a, b, gap) {
    return a.x < b.x + b.w + gap && a.x + a.w + gap > b.x && a.y < b.y + b.h + gap && a.y + a.h + gap > b.y;
  }

  // A speech bubble over a driver's head: paper, ink outline, a tail, capitals.
  // Never under 12px. Pushed down below the HUD, and up (or down) past
  // anything already placed, with the tail still pointing at the speaker.
  function drawBubble(c, k, placed) {
    var HTL = window.HeavyTraffic;
    var at = HTL.placeOnScreen(view, k.x, k.y, 50 + k.z);
    if (!at || at.depth < 45 || at.depth > 900 || at.x < -80 || at.x > W + 80) return;
    var size = clamp(at.s * 3.6, 12, 17);
    c.font = size + "px " + T.display;
    var words = k.speech.text.toUpperCase().split(" "), lines = [""];
    words.forEach(function (w) {
      var tryLine = lines[lines.length - 1] ? lines[lines.length - 1] + " " + w : w;
      if (tryLine.length > 17 && lines[lines.length - 1]) lines.push(w); else lines[lines.length - 1] = tryLine;
    });
    var tw = 0;
    lines.forEach(function (l) { tw = Math.max(tw, c.measureText(l).width); });
    var pad = size * 0.55, lh = size * 1.02;
    var bw = tw + pad * 2, bh = lines.length * lh + pad * 1.4;
    var bx = clamp(at.x - bw / 2, 6, W - bw - 6);
    var top = 6;
    hudBoxes().forEach(function (r) { if (bx < r.x + r.w + 4 && bx + bw > r.x - 4) top = Math.max(top, r.y + r.h + 4); });
    // where it wants to be, else the nearest spot just above or below
    // something already placed that's free of everything
    var want = clamp(at.y - bh - size * 0.9, top, H - bh - 6), by = want;
    var spots = [want];
    placed.forEach(function (r) { spots.push(r.y - bh - 6, r.y + r.h + 6); });
    spots = spots.filter(function (y) { return y >= top && y <= H - bh - 6; })
      .sort(function (a, b) { return Math.abs(a - want) - Math.abs(b - want); });
    for (var i = 0; i < spots.length; i++) {
      var me = { x: bx, y: spots[i], w: bw, h: bh };
      if (!placed.some(function (r) { return overlaps(me, r, 3); })) { by = spots[i]; break; }
    }
    placed.push({ x: bx, y: by, w: bw, h: bh });
    var under = by > at.y;     // pushed below the speaker's head: the tail points up
    var tailX = clamp(at.x, bx + 12, bx + bw - 12);
    c.globalAlpha = clamp(k.speech.t * 4, 0, 1);    // pops in like a stamp, fades out
    c.beginPath();
    var r = Math.min(10, bh / 2);
    c.moveTo(bx + r, by);
    if (under) { c.lineTo(tailX - 6, by); c.lineTo(tailX - 2, by - size * 0.8); c.lineTo(tailX + 7, by); }
    c.arcTo(bx + bw, by, bx + bw, by + bh, r);
    c.arcTo(bx + bw, by + bh, bx, by + bh, r);
    if (!under) { c.lineTo(tailX + 7, by + bh); c.lineTo(tailX - 2, by + bh + size * 0.8); c.lineTo(tailX - 6, by + bh); }
    c.arcTo(bx, by + bh, bx, by, r);
    c.arcTo(bx, by, bx + bw, by, r);
    c.closePath();
    c.fillStyle = T.paper;
    c.fill();
    c.lineWidth = 2.5;
    c.lineJoin = "round";
    c.strokeStyle = T.ink;
    c.stroke();
    c.fillStyle = T.ink;
    c.textAlign = "center";
    c.textBaseline = "top";
    lines.forEach(function (l, i) { c.fillText(l, bx + bw / 2, by + pad * 0.8 + i * lh); });
    c.globalAlpha = 1;
  }

  // things fade into the dark with distance, like the road does
  // ...and anything right up at the camera fades out rather than filling the screen
  // ...and a rival between the camera and your kart fades sooner, so one
  // tucked in behind you doesn't fill a phone's screen and hide the road
  function fogged(depth, draw, near) {
    var t = clamp((depth - view.fogNear) / (view.fogFar - view.fogNear), 0, 1);
    var a = Math.min(1 - t * t * (3 - 2 * t), near ? clamp((depth - 58) / 34, 0, 1) : clamp((depth - 48) / 14, 0, 1));
    if (a <= 0.02) return;
    ctx.globalAlpha = a;
    draw();
    ctx.globalAlpha = 1;
  }

  function drawSky(c) {
    var hz = view.horizon;
    c.fillStyle = T.ink;
    c.fillRect(0, 0, W, hz + 1);
    if (!sky) sky = buildSky();
    var off = -(camA / (Math.PI * 2)) * sky.w * 2;
    var x0 = ((off % sky.w) + sky.w) % sky.w - sky.w;
    for (var x = x0; x < W; x += sky.w) c.drawImage(sky.canvas, x, hz - sky.h + 1, sky.w, sky.h);
  }

  // A low skyline that turns with you, with the NO mark up on two towers
  var markImg = null;
  function buildSky() {
    var ph = Math.round(Math.max(40, Math.min(H, W * 1.25) * 0.16)), pw = ph * 12;
    var cv = document.createElement("canvas");
    cv.width = Math.round(pw * DPR);
    cv.height = Math.round(ph * DPR);
    var s = cv.getContext("2d");
    s.scale(DPR, DPR);
    var rand = seeded(5);
    for (var x = 0; x < pw;) {
      var bw = ph * (0.25 + rand() * 0.5), bh = ph * (0.2 + rand() * 0.6);
      s.fillStyle = T.ash;
      s.fillRect(x, ph - bh, bw, bh);
      s.fillStyle = T.smoke;
      s.globalAlpha = 0.3;
      for (var wy = ph - bh + ph * 0.08; wy < ph - ph * 0.08; wy += ph * 0.11) {
        for (var wx = x + bw * 0.15; wx < x + bw * 0.85; wx += bw * 0.22) {
          if (rand() < 0.2) s.fillRect(wx, wy, ph * 0.035, ph * 0.05);
        }
      }
      s.globalAlpha = 1;
      x += bw + ph * rand() * 0.12;
    }
    if (!markImg) {
      markImg = new Image();
      markImg.onload = function () { sky = null; };
      markImg.src = "/brand/mark-on-dark.svg";
    }
    if (markImg.complete && markImg.naturalWidth) {
      [0.2, 0.68].forEach(function (f) {
        var size = ph * 0.5, bx = pw * f;
        s.fillStyle = T.ash;
        s.fillRect(bx + size * 0.45, ph * 0.5, size * 0.1, ph * 0.5);
        s.fillStyle = T.ink;
        s.fillRect(bx - size * 0.06, ph * 0.04, size * 1.12, size * 1.02);
        s.drawImage(markImg, bx, ph * 0.07, size, size * 166 / 183);
      });
    }
    return { canvas: cv, w: pw, h: ph };
  }

  function drawSkids3D(c) {
    if (!skids.length) return;
    var HTL = window.HeavyTraffic;
    c.strokeStyle = T.ink;
    c.globalAlpha = 0.45;
    c.lineCap = "round";
    for (var i = 0; i < skids.length; i++) {
      var sk = skids[i];
      var depth = (sk[0] - view.x) * view.fx + (sk[1] - view.y) * view.fy;
      if (depth < 20 || depth > 700) continue;
      var a = HTL.placeOnScreen(view, sk[0], sk[1], 0), b = HTL.placeOnScreen(view, sk[2], sk[3], 0);
      if (!a || !b) continue;
      c.lineWidth = Math.max(1, 2.6 * (a.s + b.s) / 2);
      c.beginPath();
      c.moveTo(a.x, a.y);
      c.lineTo(b.x, b.y);
      c.stroke();
    }
    c.globalAlpha = 1;
  }

  function drawScenery(c, o) {
    var at = window.HeavyTraffic.placeOnScreen(view, o.x, o.y, 0);
    if (!at || at.x < -300 || at.x > W + 300) return;
    if (o.t === "sign") drawSign(c, o, at);
    else if (o.t === "arrows") drawArrows(c, o, at);
    else drawTyres(c, at);
  }

  // One length of the low wall: white, an ink edge along the top, and every
  // so often a red one so you can tell it's going past
  function drawBarrierAt(depth, bar) {
    fogged(depth, function () { drawBarrier(ctx, bar); });
  }
  function drawBarrier(c, bar) {
    var place = window.HeavyTraffic.placeOnScreen;
    var a0 = place(view, bar.ax, bar.ay, 0), b0 = place(view, bar.bx, bar.by, 0);
    if (!a0 || !b0) return;
    if ((a0.x < -40 && b0.x < -40) || (a0.x > W + 40 && b0.x > W + 40)) return;
    var a1y = a0.y - BAR_H * a0.s, b1y = b0.y - BAR_H * b0.s;
    c.beginPath();
    c.moveTo(a0.x, a0.y);
    c.lineTo(b0.x, b0.y);
    c.lineTo(b0.x, b1y);
    c.lineTo(a0.x, a1y);
    c.closePath();
    c.fillStyle = bar.red ? T.red : T.paper;
    c.fill();
    c.lineJoin = "round";
    c.lineWidth = Math.max(1, (a0.s + b0.s) * 0.18);
    c.strokeStyle = T.ink;
    c.stroke();
    c.beginPath();
    c.moveTo(a0.x, a1y);
    c.lineTo(b0.x, b1y);
    c.lineWidth = Math.max(1.5, (a0.s + b0.s) * 0.45);
    c.stroke();
  }

  // A board of arrows on the outside of a corner: this way, and slower
  function drawArrows(c, o, at) {
    var s = at.s;
    var bw = 30 * s, bh = 14 * s, post = 9 * s;
    if (bw < 3) return;
    c.fillStyle = T.ink;
    c.fillRect(at.x - s * 1.2, at.y - post - 1, s * 2.4, post + 1);
    var top = at.y - post - bh;
    c.fillStyle = T.paper;
    c.strokeStyle = T.ink;
    c.lineWidth = Math.max(1, s * 0.7);
    c.lineJoin = "round";
    c.fillRect(at.x - bw / 2, top, bw, bh);
    c.strokeRect(at.x - bw / 2, top, bw, bh);
    c.fillStyle = T.red;
    for (var i = -1; i <= 1; i++) {
      var cx = at.x + i * bw * 0.28, d = o.turn;
      c.beginPath();
      c.moveTo(cx - d * bw * 0.12, top + bh * 0.16);
      c.lineTo(cx + d * bw * 0.04, top + bh * 0.16);
      c.lineTo(cx + d * bw * 0.16, top + bh * 0.5);
      c.lineTo(cx + d * bw * 0.04, top + bh * 0.84);
      c.lineTo(cx - d * bw * 0.12, top + bh * 0.84);
      c.lineTo(cx, top + bh * 0.5);
      c.closePath();
      c.fill();
    }
  }

  function drawSign(c, o, at) {
    var s = at.s;
    var bw = 66 * s, bh = 24 * s, post = 16 * s;
    c.fillStyle = T.ink;
    c.strokeStyle = T.paper;
    c.lineWidth = Math.max(1, s * 0.6);
    [-0.32, 0.32].forEach(function (f) {
      c.fillRect(at.x + f * bw - s * 1.3, at.y - post - 2 * s, s * 2.6, post + 2 * s);
      c.strokeRect(at.x + f * bw - s * 1.3, at.y - post - 2 * s, s * 2.6, post + 2 * s);
    });
    c.save();
    c.translate(at.x, at.y - post - bh / 2);
    c.rotate(o.tilt);
    c.fillStyle = T.paper;
    c.fillRect(-bw / 2, -bh / 2, bw, bh);
    c.strokeStyle = T.red;
    c.lineWidth = Math.max(1, s * 1.4);
    c.strokeRect(-bw / 2 + s * 1.2, -bh / 2 + s * 1.2, bw - s * 2.4, bh - s * 2.4);
    c.lineWidth = Math.max(0.5, s * 0.5);
    c.strokeRect(-bw / 2 + s * 3.4, -bh / 2 + s * 3.4, bw - s * 6.8, bh - s * 6.8);
    if (s > 0.1) {
      var size = Math.min(10 * s, (bw - 12 * s) / (o.text.length * 0.5));
      c.fillStyle = T.red;
      c.font = size + "px " + T.display;
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText(o.text.toUpperCase(), 0, size * 0.06);
    }
    c.restore();
  }

  function drawTyres(c, at) {
    var s = at.s, rx = 5 * s, ry = 1.9 * s, step = 3.4 * s;
    c.lineWidth = Math.max(1, s * 0.55);
    [-5.4, 5.4].forEach(function (dx) {
      for (var i = 0; i < 3; i++) {
        var x = at.x + dx * s, y = at.y - ry - i * step;
        c.beginPath();
        c.ellipse(x, y, rx, ry + step * 0.5, 0, 0, Math.PI * 2);
        c.fillStyle = T.ink;
        c.fill();
        c.strokeStyle = T.paper;
        c.stroke();
      }
      c.beginPath();
      c.ellipse(at.x + dx * s, at.y - ry - 2 * step - step * 0.35, rx * 0.5, ry * 0.5, 0, 0, Math.PI * 2);
      c.fillStyle = T.ash;
      c.fill();
    });
  }

  function drawPart3D(c, p) {
    var HTL = window.HeavyTraffic;
    var fade = p.life / p.max;
    var z = p.z != null ? p.z : p.t === "puff" ? 6 : 1;
    var at = HTL.placeOnScreen(view, p.x, p.y, z);
    if (!at) return;
    var s = at.s, base = c.globalAlpha;
    if (p.t === "spark") {
      var tail = HTL.placeOnScreen(view, p.x - p.vx * 0.03, p.y - p.vy * 0.03, z);
      if (!tail) return;
      c.globalAlpha = base * Math.min(1, fade * 1.5);
      c.strokeStyle = T.paper;
      c.lineWidth = Math.max(1, s * 0.5);
      c.lineCap = "round";
      c.beginPath();
      c.moveTo(at.x, at.y);
      c.lineTo(tail.x, tail.y);
      c.stroke();
    } else if (p.t === "puff") {
      var r = p.r * s;
      c.globalAlpha = base * fade * 0.9;
      if (p.gas) {
        // the Gas cloud: a lumpy accent cloud with halftone in it
        c.beginPath();
        c.arc(at.x - r * 0.45, at.y - r * 0.1, r * 0.65, 0, Math.PI * 2);
        c.arc(at.x + r * 0.4, at.y - r * 0.05, r * 0.7, 0, Math.PI * 2);
        c.arc(at.x, at.y - r * 0.55, r * 0.75, 0, Math.PI * 2);
        c.globalAlpha = base * fade * 0.75;
        c.fillStyle = T.accent;
        c.fill();
        c.fillStyle = gasDots || (gasDots = c.createPattern(dotTile(), "repeat"));
        c.fill();
      } else {
        r *= 0.6;
        c.fillStyle = T.accent;
        c.beginPath();
        c.arc(at.x + r * 0.25, at.y - r * 0.7, r, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = T.paper;
        c.beginPath();
        c.arc(at.x, at.y - r, r, 0, Math.PI * 2);
        c.fill();
      }
    } else if (p.t === "grit") {
      c.globalAlpha = base * fade;
      c.fillStyle = T.smoke;
      c.fillRect(at.x - s * 0.8, at.y - s * 1.6, s * 1.6, s * 1.6);
    } else if (p.t === "sweat") {
      var rr = Math.max(1.2, s * 1.3);
      c.globalAlpha = base * Math.min(1, fade * 2);
      c.beginPath();
      c.moveTo(at.x, at.y - rr * 2.4);
      c.quadraticCurveTo(at.x + rr * 1.1, at.y - rr * 0.6, at.x, at.y + rr);
      c.quadraticCurveTo(at.x - rr * 1.1, at.y - rr * 0.6, at.x, at.y - rr * 2.4);
      c.fillStyle = T.paper;
      c.fill();
      c.lineWidth = Math.max(1, s * 0.4);
      c.strokeStyle = T.ink;
      c.stroke();
    } else if (p.t === "wheel") {
      var w = HTL.placeOnScreen(view, p.x, p.y, (p.z || 0) + 3.2);
      if (!w) return;
      var wr = 3.2 * w.s, squash = 0.25 + Math.abs(Math.cos(p.rot)) * 0.75;
      c.globalAlpha = base * Math.min(1, fade * 2);
      c.beginPath();
      c.ellipse(w.x, w.y, wr * squash, wr, 0, 0, Math.PI * 2);
      c.fillStyle = T.ink;
      c.fill();
      c.lineWidth = Math.max(1, w.s * 0.5);
      c.strokeStyle = T.paper;
      c.stroke();
      c.beginPath();
      c.ellipse(w.x, w.y, wr * squash * 0.42, wr * 0.42, 0, 0, Math.PI * 2);
      c.fillStyle = T.paper;
      c.fill();
    }
    c.globalAlpha = base;
  }

  var gasDots = null;
  function dotTile() {
    var t = document.createElement("canvas");
    t.width = t.height = 8;
    var x = t.getContext("2d");
    x.fillStyle = T.ink;
    x.globalAlpha = 0.5;
    x.beginPath();
    x.arc(2, 2, 1.3, 0, Math.PI * 2);
    x.arc(6, 6, 1.3, 0, Math.PI * 2);
    x.fill();
    return t;
  }

  // white motion lines while the gas is on, and a few in someone's slipstream
  function speedLines(c, n) {
    var cx = W / 2, cy = view.horizon + (H - view.horizon) * 0.35, big = Math.max(W, H);
    c.strokeStyle = T.paper;
    c.lineCap = "round";
    for (var i = 0; i < n; i++) {
      var ang = Math.random() * Math.PI * 2;
      var r0 = big * (0.42 + Math.random() * 0.1), r1 = r0 + big * (0.12 + Math.random() * 0.15);
      c.globalAlpha = 0.3 + Math.random() * 0.3;
      c.lineWidth = 1.5 + Math.random() * 2;
      c.beginPath();
      c.moveTo(cx + Math.cos(ang) * r0, cy + Math.sin(ang) * r0);
      c.lineTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1);
      c.stroke();
    }
    c.globalAlpha = 1;
  }

  // Minimap: bottom left, or top left under the lap count and time when the
  // bottom of the screen is taken by touch buttons
  function miniRect() {
    var small = Math.min(W, H) < 420;
    var mw = small ? 80 : 96, mh = small ? 55 : 66;
    if (!root.classList.contains("kit-touching")) return { x: 6, y: H - mh - 8, w: mw, h: mh };
    var y = small ? 84 : 100;
    hudBoxes().forEach(function (b) { if (b.x < W / 3 && b.y < H / 3) y = b.y + b.h + 8; });
    return { x: 6, y: y, w: mw, h: mh };
  }

  function drawMini(c) {
    var at = miniRect(), mw = at.w, mh = at.h;
    if (!mini || mini.mw !== mw) {
      mini = document.createElement("canvas");
      mini.mw = mw;
      mini.width = Math.round(mw * DPR);
      mini.height = Math.round(mh * DPR);
      var m = mini.getContext("2d");
      var sc = Math.min((mw - 12) / (track.maxX - track.minX), (mh - 12) / (track.maxY - track.minY));
      mini.sc = sc;
      mini.ox = (mw - (track.maxX - track.minX) * sc) / 2 - track.minX * sc;
      mini.oy = (mh - (track.maxY - track.minY) * sc) / 2 - track.minY * sc;
      m.setTransform(DPR * sc, 0, 0, DPR * sc, DPR * mini.ox, DPR * mini.oy);
      m.lineJoin = "round";
      m.lineWidth = 9 / sc;
      m.strokeStyle = T.ink;
      m.globalAlpha = 0.7;
      m.stroke(track.path);
      m.globalAlpha = 1;
      m.lineWidth = 2.6 / sc;
      m.strokeStyle = T.paper;
      m.stroke(track.path);
    }
    var x0 = at.x, y0 = at.y;
    c.drawImage(mini, x0, y0, mw, mh);
    karts.forEach(function (k) {
      if (k.player) return;
      dot(c, x0 + mini.ox + k.x * mini.sc, y0 + mini.oy + k.y * mini.sc, 2.6, T[k.d.kart === "ink" ? "smoke" : k.d.kart]);
    });
    dot(c, x0 + mini.ox + player.x * mini.sc, y0 + mini.oy + player.y * mini.sc, 3.6, T.red);
  }

  function dot(c, x, y, r, fill) {
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fillStyle = fill;
    c.fill();
    c.lineWidth = 1.4;
    c.strokeStyle = T.ink;
    c.stroke();
  }

  // ---------------------------------------------------------------------------
  // Start it up
  // ---------------------------------------------------------------------------
  shell = N.createGame({
    root: root,
    slug: "heavy-traffic",
    title: "Heavy Traffic",
    stamp: "Not approved",
    tilt: 4,
    note: "Three laps. Four drivers. Each of them owns the road.",
    hints: {
      keys: "Arrow keys or WASD to drive. Space for gas. P to pause.",
      touch: "It accelerates by itself. Steer on the left. Gas and brake on the right."
    },
    againLabel: "Race again",
    smallCallouts: true,
    daily: { label: "Today's race" },
    pitch: "Kart racing. Large drivers, tiny cars. Physics has given up.",
    touch: [
      { key: "left", label: "Steer left", icon: "left", side: "left" },
      { key: "right", label: "Steer right", icon: "right", side: "left" },
      { key: "action", label: "Gas", icon: "Gas", side: "right" },
      { key: "down", label: "Brake", icon: "Brake", side: "right" }
    ],
    reset: reset,
    update: function (dt, input, sh) {
      update(dt, input);
      var ctl = player.ctl || IDLE;
      engineNote(Math.hypot(player.vx, player.vy), ctl.throttle, sh.state() !== "results");
    },
    render: function (dt, sh) {
      if (sh.state() === "countdown" && engine) engineNote(0, 0.2, true);
      if (!noticed && (sh.state() === "countdown" || sh.state() === "playing")) { noticed = true; notice(); }
      render(dt);
    },
    resize: resize
  });

  if (DEBUG) {
    window.__heavyTraffic = {
      track: track,
      karts: function () { return karts; },
      player: function () { return player; },
      state: function () { return shell.state(); },
      time: function () { return raceTime; }
    };
  }
})();
