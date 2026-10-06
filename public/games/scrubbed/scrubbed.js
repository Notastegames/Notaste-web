// Scrubbed: Space Billionaire's reusable rocket comes back down tail first,
// and you land it. A lander game.
//
// THE JOKE. Billionaire space races, and the PR that comes with them. He
// films the whole thing from a boat, live, and whatever happens he calls it
// a success: a rocket that lands is his ("I did that."), and a rocket that
// turns into a large fire is "Good data." Now and then the stream drops,
// and off air he's less relaxed about it. He is the invented Space
// Billionaire from Thonglets (DESIGN.md, section 2), never a real person:
// the same rocket, the same face in its porthole, the same sunglasses.
//
// THE CONTROLS. Thrust (Up, W, Space, the Thrust button, a held mouse
// button, A or the right trigger) pushes along the rocket. Left and right
// (arrows, A and D, the arrow buttons, the stick) lean it, at a steady rate,
// and it stays where you leave it. With a mouse it leans towards the
// pointer instead, more the further the pointer is to one side. Thrust is
// all or nothing, so you feather it.
//
// THE PHYSICS. World units, about a metre and a half each: the rocket is 13
// tall. Gravity 7.5 a second a second (Mars 3). The engine pushes 18 along
// the rocket's axis, so it can hover with room to spare and stops a fall in
// a couple of seconds, but not instantly. Leaning turns at 1.6 radians a
// second (about 90 degrees), eased in over a few hundredths so a tap makes
// a small lean; it stops at 69 degrees. Air drag is light (0.12 a second
// sideways), so a sideways drift keeps going until you lean the other way:
// that's the skill. Wind pushes through that same drag, harder higher up,
// in gusts. Each booster has eight seconds of full thrust. Every booster
// starts high (60 to 95 up), off to one side, falling and drifting, so the
// first second is about catching it. Learnable in ten seconds (hold to
// slow, lean to move, let go to fall), skilful after that: a good landing
// falls most of the way and burns late, comes in straight over the cross,
// and keeps fuel back. Slower than real rockets on purpose: people react in
// a quarter of a second, and the numbers were set against test players who
// do (see THE LADDER).
//
// LANDING AND CRASHING. The legs come down below 28 up. A landing is the
// legs touching a flat bit (the deck, the lawn, the pad) going down no
// faster than 6 (relative to the deck, which moves in a swell), sideways no
// faster than 4, within 17 degrees of the deck's own lean, and with both
// feet on it. Anything else: a crash. Too hard, too fast sideways or too
// leant on the deck is a fire. Off the deck is the sea. A gentle landing
// with a foot over the edge stands for a moment, then tips over. On Mars
// there's no air, so no fire: a dent. Every crash is over quickly: a burst,
// a fire, his line, and the next booster is on its way in two seconds
// (press thrust to skip the last of it).
//
// THE CAMERA. It frames the rocket and the whole landing area together
// (barge, his boat, the windsock), with the HUD clear above and the touch
// buttons clear below. It keeps a box that grows at once when a booster
// comes in high and shrinks smoothly as it comes down, so it eases in, and
// the scene always stands on the bottom of the free space. On a square
// phone the scene sits low with the sky above it; on a touch screen the
// round goes full-window (a tall descent wants the height), and in the 4:5
// clip frame the extra height becomes sky. While the notice is up the scene
// stands on top of it.
//
// THE STAGES. Eight boosters over five stages, each new thing with a notice:
//   1. The barge (two boosters). A big barge called Told You So, calm sea.
//      The first booster starts gently, close, with arrows to teach thrust,
//      lean and the cross.
//   2. Weather (two). Wind, stronger higher up, in gusts, shown by streaks
//      and the windsock. A smaller barge.
//   3. Swell (two). The deck heaves and rolls on the waves: land as it
//      sinks, not as it rises. Smaller again, with some wind.
//   4. Launch party (one). His own lawn, between a marquee and a heated
//      pool, his guests filming from the terrace. Balloons drift up through
//      the descent and nudge you. The marquee and the cake can catch fire;
//      the guests duck long before anything gets near them.
//   5. Mars (one). Low gravity and next to no air, coming in fast and
//      sideways, so nothing stops you but you. Worth double. Nobody is
//      watching: his messages come through a dish fourteen minutes late, so
//      they're always about the wrong thing.
//
// BETWEEN STAGES (shell.interlude) he offers three of seven upgrades, each
// with a cost (UPGRADES): bigger tanks (more fuel, weaker push), a bigger
// engine (more push, thirstier), grid fins (half the wind, slower to lean),
// wider legs (lands harder and more leant, less fuel), cheaper legs (more
// fuel, only a gentle landing), self-landing beta (straightens itself when
// you let go, takes a fifth of every landing) and a PR team (a crash is a
// test worth 250, every landing pays a fifth less).
//
// SCORING. A landing: 400, plus up to 250 for soft and upright, up to 300
// for how close to the cross, and up to 250 for fuel left. Mars doubles it.
// A crash: nothing (250 with the PR team).
//
// THE LADDER (calibrated against test players with human reaction times:
// see the numbers at the end of this comment). Approved: seven or more of
// the eight landed, Mars among them, and at least 8,000 points: soft,
// central, thrifty landings all round, and in practice all eight of them
// and no upgrade that takes a cut. Pending review: five landed. Not
// approved: at least one. Rejected: nothing landed ("Every rocket is now
// data.").
//
// TODAY'S RUN. Everything that decides the run comes from shell.random at
// the start of each stage, from that stage's own stream: where each booster
// starts and how it's moving, the wind and its gusts, the swell, the
// balloons, the ground on Mars and the upgrades offered. What he says is
// left to chance.
//
// THE AUTOPILOT (?autopilot, ?clip) flies a profile: a descent speed for
// each height that slows to a walk at the deck, a sideways speed that heads
// for the cross, and a lean to get it, allowing for the wind. It reacts
// every tenth of a second or so, aims a little off the cross, and now and
// then misjudges the wind or burns late, so it lands most of the time but
// not all of it.
//
// ?debug exposes window.__scrubbed for test players, and takes &stage=N to
// start at stage N.
//
// Built on the shared kit (/games/kit/kit.js): the intro, screens,
// controls, sound and saving. art.js draws everything.
//
// THE NUMBERS. Scripted test players (outside the repo) see the game only
// as it was 200 to 450ms ago, misjudge speed and height, forget the wind,
// lean and thrust to move sideways, and play with real key presses, a real
// mouse or real touches held on the buttons. 27 rounds, October 2026:
//   good, upgrades picked at random: 5,500 to 7,000, six to eight landed.
//     Pending review every time: they all took the beta or the PR team.
//   good and expert, leaving those two alone: 6,400 to 8,600. Approved in
//     three of nine, each with all eight landed; seven landed, Mars among
//     them, made 6,400 to 7,400 (Pending review).
//   average: 2,400 to 5,900, three to six landed. Pending review or Not
//     approved, about half each.
//   novice: 0 to 1,500, none or one landed. Rejected or Not approved.
// Keys, mouse and touch come out about the same. A round takes two minutes
// or so.
(function () {
  "use strict";

  var N = window.Notaste;
  var A = window.ScrubbedArt;
  var root = document.getElementById("game-root");
  if (!N || !A || !root) return;

  var params = new URLSearchParams(window.location.search);
  var AUTO = N.flags.autopilot;
  var DEBUG = params.has("debug");
  var FIRST = DEBUG ? Math.max(0, Math.min(4, (parseInt(params.get("stage"), 10) || 1) - 1)) : 0;
  var FORCE = DEBUG ? params.get("fly") : null;   // the autopilot on purpose: late (burns too late), drift (ignores the wind), sea (aims off the deck)

  // ---------------------------------------------------------------------------
  // Tuning
  // ---------------------------------------------------------------------------
  var RH = 13, RK = RH / 86;     // the rocket's height; art.js draws it 86 tall
  var THRUST = 18;               // the engine's push, along the rocket
  var TURN = 1.6;                // radians a second, leaning
  var TURN_EASE = 14;            // how quickly leaning gets up to speed
  var MAX_TILT = 1.2;
  var FUEL = 8;                  // seconds of full thrust a booster
  var SPOOL = 0.07;              // seconds for the engine to light or go out
  var MOUSE_REACH = 0.25;        // the pointer this far to the side (a share of the screen) leans it 45 degrees
  var SAFE_VY = 6, SAFE_VX = 4, SAFE_TILT = 0.3;
  var SOFT = 1.0;                // under this it's feather light
  var CROSS_R = 6;               // cross points run out this far from the cross
  var PTS = { land: 400, soft: 250, cross: 300, fuel: 250 };
  var SEA_DROP = 2.2;            // the waterline, under the deck
  var LEGS_AT = 28;
  var BEAT = { landed: 2.4, crash: 2.2, splash: 2.0, lost: 1.6 };
  var SKIP_AFTER = 0.9;
  var STEP = 1 / 120;

  var STAGES = [
    { id: "barge", name: "The barge", boosters: 2, scene: "sea", deck: 34, barge: "Told you so",
      wind: 0, gust: 0, swell: 0.18, roll: 0.008, period: 4.2, g: 7.5, drag: 0.12,
      start: { h: [62, 70], dx: [10, 20], vx: 3, vy: [7, 10], tilt: 0.12 } },
    { id: "weather", name: "Weather", boosters: 2, scene: "sea", deck: 28, barge: "Trust me",
      wind: 6.5, gust: 5, swell: 0.3, roll: 0.012, period: 4, g: 7.5, drag: 0.12,
      start: { h: [66, 76], dx: [12, 24], vx: 4, vy: [8, 12], tilt: 0.18 } },
    { id: "swell", name: "Swell", boosters: 2, scene: "sea", deck: 24, barge: "Cost saving",
      wind: 4, gust: 3.5, swell: 1.25, roll: 0.07, period: 3.4, g: 7.5, drag: 0.12,
      start: { h: [66, 76], dx: [12, 24], vx: 4, vy: [8, 12], tilt: 0.18 } },
    { id: "party", name: "Launch party", boosters: 1, scene: "party",
      wind: 2.5, gust: 2, swell: 0, roll: 0, period: 4, g: 7.5, drag: 0.12,
      start: { h: [70, 78], dx: [16, 24], vx: 4, vy: [8, 11], tilt: 0.18 } },
    { id: "mars", name: "Mars", boosters: 1, scene: "mars", mult: 2, fuel: 0.9,
      wind: 0, gust: 0, swell: 0, roll: 0, period: 4, g: 3, drag: 0.025,
      start: { h: [86, 96], dx: [30, 38], vx: [7, 10], vy: [4, 6], tilt: 0.3, inbound: true } }
  ];
  var LAST = STAGES.length - 1;
  var TOTAL = STAGES.reduce(function (n, s) { return n + s.boosters; }, 0);
  var APPROVE = 8000;

  // Between stages: what it does, then what it costs
  var UPGRADES = [
    { id: "tanks", label: "Bigger tanks", detail: "A third more fuel. Heavier, so the engine pushes a sixth less.",
      apply: function (m) { m.fuel *= 1.33; m.thrust *= 0.84; m.tanks = true; } },
    { id: "engine", label: "Bigger engine", detail: "Pushes a fifth harder. Burns fuel a third faster.",
      apply: function (m) { m.thrust *= 1.2; m.burn *= 1.33; m.engine = true; } },
    { id: "fins", label: "Grid fins", detail: "Wind pushes half as hard. Leaning is a fifth slower.",
      apply: function (m) { m.windK *= 0.5; m.turn *= 0.8; m.fins = true; } },
    { id: "legs", label: "Wider legs", detail: "Takes a landing a third harder and more leant. A fifth less fuel.",
      apply: function (m) { m.safeVy *= 1.33; m.safeTilt *= 1.35; m.fuel *= 0.8; m.legs = true; m.cheap = false; } },
    { id: "cheap", label: "Cheaper legs", detail: "Saves weight: a quarter more fuel. Only takes a gentle landing.",
      apply: function (m) { m.fuel *= 1.25; m.safeVy *= 0.7; m.cheap = !m.legs; } },
    { id: "beta", label: "Self-landing (beta)", detail: "Straightens itself when you stop leaning. Every landing pays a fifth less: it takes the credit.",
      apply: function (m) { m.level = true; m.pay *= 0.8; m.beta = true; } },
    { id: "pr", label: "PR team", detail: "Every crash is a test, worth 250. Every landing pays a fifth less.",
      apply: function (m) { m.crashPay = 250; m.pay *= 0.8; m.pr = true; } }
  ];

  // ---------------------------------------------------------------------------
  // What everyone says. He insults your flying, never you (DESIGN.md, 2).
  // ---------------------------------------------------------------------------
  var BOSS = {
    first: ["Bring it home. Gently. It's mine.", "Everyone's watching. Mostly me.", "Land it, then I'll say I landed it."],
    start: ["Don't scratch it. It's my favourite.", "Two million watching. Do the landing.", "Smile for the stream.",
            "This one's going in the advert.", "Land it. I've already posted that it landed."],
    again: ["We have more rockets. Obviously.", "Next one. Same, but landing.", "Plenty more where that came from."],
    weather: ["I'll buy the wind.", "The wind's not in the plan."],
    swell: ["Someone tell the sea to stop.", "The sea's doing this on purpose."],
    smaller: ["Smaller barge. Same rocket. Efficiency."],
    landed: ["Obviously.", "I did that.", "That was me.", "Post that. Twice.", "Told you.", "Book the parade.",
             "Ten out of ten. I'm the judge.", "Easy. I'll take it from here."],
    perfect: ["Flawless. Like me.", "That's going on a stamp.", "I'll be doing interviews."],
    offcross: ["The cross was in the wrong place.", "We'll move the cross."],
    firm: ["Firm. Like my handshake.", "Landed. Mostly."],
    crash: ["Good data.", "That counts.", "Delete that.", "Rapid unscheduled success.", "Exactly as planned.",
            "We learned loads.", "Technically, it landed.", "Clip that. Not that bit.", "They're all tests.",
            "Nominal.", "Most of it is on the barge."],
    sea: ["Water landing. On purpose.", "The sea was in the way.", "It'll wash up somewhere. Probably mine.", "Delete that."],
    edge: ["It was nearly on.", "That's a landing. Then a swim."],
    fuel: ["Fuel is a mindset.", "We're testing gravity now."],
    lost: ["It's in orbit now. Probably.", "Gone to a better place. Mine."],
    offair: ["Who was flying that, you plonker.", "Find out who that was.", "That was my favourite, you pillock.",
             "I can see the share price from here.", "Don't clip that, you absolute weapon."],
    party: ["Everyone important is here. Land it nicely.", "Land it by the cake. For the photos.", "Mind the pool. It's heated."],
    partyCrash: ["The marquee was old anyway.", "Good data. Good party.", "Nobody tell the insurance."],
    pool: ["Pool landing. Very exclusive.", "That pool was heated, you plonker."],
    cake: ["The cake was a test as well."],
    balloon: ["Those balloons were for the photos.", "Mind the balloons, you lemon."]
  };
  var GUESTS = ["Is it meant to do that.", "Getting this for my story.", "He said there'd be canapés.",
                "Is the cake safe.", "I flew here for this.", "Is that the one from the advert."];
  var DUCK = ["Mind the hats.", "Not the hats.", "Get down."];
  // Mars: his messages, fourteen minutes old, so always about the wrong thing
  var EARTH = {
    start: ["Is it filming yet.", "Plant the flag first. For the photo.", "Tell them I'm on my way."],
    landed: ["Good data.", "Delete that.", "We'll call it a test."],
    crash: ["Flawless. Like me.", "Told you. Easy.", "Book the parade."]
  };
  var CALL = {
    landed: "Landed", perfect: "Bang on the cross", feather: "Feather light", firm: "Firm", off: "Off the cross",
    crash: ["Disassembled", "Unscheduled", "Lit", "On fire. Nominally"],
    sea: "Sea: entered", edge: "Over the edge", pool: "Pool: entered", marquee: "Party: lit", cake: "Cake: lost",
    dent: "No air. No fire", tip: "Tipped over", fuel: "Fuel: none", lost: "Gone", balloon: "Balloon: popped",
    nobody: "Nobody saw that"
  };
  var CLEAR = {
    all: ["He announced both landings before they happened.", "He's told everyone he was flying them. He was on a boat."],
    one: ["He announced the landing. He's announced the other one as data.", "One landed. The other is being described as research."],
    none: ["Nothing landed. He has called it a historic day.", "Nothing landed. He's described it as content."],
    partyAll: ["It landed by the cake. He's told the guests he did it with his mind."],
    partyNone: ["The party is now a fire. The guests filmed all of it. He's calling it the launch of the season."],
    partyPool: ["It's in the pool. The guests filmed all of it. He's calling it a pool party."]
  };
  var RANKS = [
    "Every one came home. The best was on Mars, where nobody saw it. He has announced he flew them himself, from a boat.",
    "Most of them came back. The rest are being described as data.",
    "A lot of good data. The barge is mostly scorch marks now. He calls it a success.",
    "Every rocket is now data. He is calling it the most successful test in history."
  ];

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  var shell = null, ctx = null, T = null;
  var W = 1, H = 1, DPR = 1;
  var run = null;              // the whole round
  var st = null;               // this stage: its scene, wind, swell, plan
  var rk = null;               // the rocket in the air
  var phase = "fly";           // fly | beat | wrap
  var beatT = 0, beatKind = "", clock = 0, vis = 0, acc = 0;
  var cam = { x: 0, y: 30, z: 4, snap: true, box: null };
  var fx = [], debris = [], puffs = [], streaks = [], bubbles = [], balloons = [];
  var receipt = null, shake = 0, wreck = null;
  var hudEls = null, hudBox = null, hudAge = 0;
  var noticed = false, lastMode = "keys", held = false, heldId = null;
  var hint = null, said = {};
  var boss = { pose: "film", mood: "smug", air: true, t: 0, soot: 0, viewers: 2.1 };
  var guests = [];
  var auto = {};
  var stars = [];
  var prevUp = false;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function fmt(n) { return Math.round(n).toLocaleString("en-GB"); }
  function touching() { return root.classList.contains("kit-touching") && !N.flags.clip; }
  function stage() { return STAGES[run.stage]; }

  // ---------------------------------------------------------------------------
  // The round
  // ---------------------------------------------------------------------------
  function newMods() {
    return { fuel: 1, thrust: 1, burn: 1, turn: 1, windK: 1, safeVy: 1, safeTilt: 1, pay: 1, crashPay: 0, level: false };
  }

  function reset(sh) {
    shell = sh;
    T = sh.tokens;
    A.init(T);
    if (DEBUG && params.get("seed")) { sh.seed = parseInt(params.get("seed"), 10) || 1; sh.random = N.seeded(sh.seed); }
    run = { stage: FIRST, mods: newMods(), score: 0, landed: 0, flown: 0, crashes: 0, taken: [], closest: null,
            stageScore: 0, stageLanded: 0, daily: sh.daily, marsLanded: false, firstCrash: true, fuelLeft: 0 };
    said = {};
    noticed = false;
    held = false;
    timers = []; fx = []; debris = []; puffs = []; streaks = []; bubbles = []; balloons = [];
    shake = 0; acc = 0; prevUp = true;
    boss.viewers = 1.8 + Math.random() * 0.8;
    thrustSound(0);
    startStage();
    if (!hudEls) buildHud();
    paintHud();
  }

  // Each stage draws from its own seeded stream, so nothing a player does
  // in one stage changes what the next one deals.
  function stageRandom(i) { return N.seeded((shell.seed + (i + 1) * 104729) | 0); }

  function startStage() {
    var s = stage(), r = stageRandom(run.stage);
    st = {
      s: s, rand: r, booster: 0, t: 0,
      windDir: r() < 0.5 ? -1 : 1, windPhase: r() * 6.28, gusts: [],
      swellPhase: r() * 6.28, starts: [], scorch: [], balloonAt: [], earthAt: r() * 3 + 2,
      biasSeed: r()
    };
    // gusts: every few seconds, a push in the wind's direction (now and then against it)
    var t = 1 + r() * 2;
    while (t < 200) {
      st.gusts.push({ t: t, size: s.gust * (0.6 + r() * 0.8) * (r() < 0.15 ? -0.6 : 1), dur: 1.2 + r() * 1.4 });
      t += 2.5 + r() * 3.5;
    }
    for (var b = 0; b < s.boosters; b++) {
      var side = r() < 0.5 ? -1 : 1;
      var gentle = run.stage === 0 && b === 0;
      var dx = gentle ? 7 : lerp(s.start.dx[0], s.start.dx[1], r());
      var vxs = s.start.vx;
      var vx = Array.isArray(vxs) ? -side * lerp(vxs[0], vxs[1], r()) : (r() - 0.5) * 2 * vxs;
      st.starts.push({
        x: side * dx,
        y: gentle ? 50 : lerp(s.start.h[0], s.start.h[1], r()),
        vx: gentle ? 0 : vx,
        vy: -(gentle ? 4 : lerp(s.start.vy[0], s.start.vy[1], r())),
        a: gentle ? 0 : (s.start.inbound ? -side * s.start.tilt * (0.6 + r() * 0.4) : (r() - 0.5) * 2 * s.start.tilt),
        bias: (r() - 0.5) * 2.4, sloppy: r()
      });
    }
    if (s.scene === "party") {
      for (var k = 0; k < 14; k++) st.balloonAt.push({ t: 0.6 + k * 1.7 + r() * 1.2, x: 22 + r() * 10, c: k % 3 });
    }
    if (s.scene === "mars") buildMars(r);
    balloons = [];
    guests = s.scene === "party" ? [
      { x: 26.2, look: "hat", top: T.paper, duck: 0, gaze: -0.6, phone: true },
      { x: 28.8, look: "perm", top: T.accent, duck: 0, gaze: -0.6, phone: true },
      { x: 31.4, look: "hat", top: T.paper, duck: 0, gaze: -0.6, phone: false },
      { x: 33.6, look: "tache", top: T.red, duck: 0, gaze: -0.6, phone: true }
    ] : [];
    run.stageScore = 0;
    run.stageLanded = 0;
    clock = 0;
    noticed = false;
    st.cake = true;
    st.lit = false;
    spawn();
  }

  // Mars: a flat pad in the middle, rough ground with rocks either side
  function buildMars(r) {
    var g = [], rocks = [], craters = [];
    for (var x = -90; x <= 90; x += 3) {
      var y;
      if (Math.abs(x) <= 9) y = 0;
      else {
        var edge = Math.min(1, (Math.abs(x) - 9) / 6);
        y = edge * (0.6 + Math.sin(x * 0.21 + r() * 0.5) * 1.3 + (r() - 0.5) * 1.8 + Math.abs(x) * 0.012);
      }
      g.push({ x: x, y: y });
    }
    // the pad's edges, exactly
    g.push({ x: -9, y: 0 }, { x: 9, y: 0 });
    g.sort(function (a, b) { return a.x - b.x; });
    for (var i = 0; i < 16; i++) {
      var rx = (r() < 0.5 ? -1 : 1) * (12 + r() * 60);
      rocks.push({ x: rx, y: marsY(g, rx), s: 0.6 + r() * 1.2 });
    }
    for (var j = 0; j < 6; j++) craters.push({ x: (r() - 0.5) * 140, y: 0, r: 2 + r() * 4 });
    st.mars = { ground: g, rocks: rocks, craters: craters, pad: [-9, 9] };
  }
  function marsY(g, x) {
    for (var i = 1; i < g.length; i++) {
      if (g[i].x >= x) {
        var a = g[i - 1], b = g[i];
        return b.x === a.x ? b.y : a.y + (b.y - a.y) * (x - a.x) / (b.x - a.x);
      }
    }
    return g[g.length - 1].y;
  }

  function spawn() {
    var p = st.starts[st.booster];
    var m = run.mods, s = stage();
    rk = {
      x: p.x, y: p.y, vx: p.vx, vy: p.vy, a: p.a, va: 0,
      fuel: FUEL * m.fuel * (s.fuel || 1), cap: FUEL * m.fuel * (s.fuel || 1),
      thrust: 0, legs: 0, squash: 0, state: "fly", t: 0, burned: 0, leaned: 0, warn: 0,
      bias: p.bias, sloppy: p.sloppy
    };
    phase = "fly";
    beatT = 0;
    wreck = null;
    timers = [];
    receipt = null;
    cam.snap = cam.snap || st.booster === 0;
    auto = { t: 0, out: { up: false, steer: 0 }, bias: p.bias * (AUTO ? 1 : 0),
             windSense: p.sloppy < 0.1 || FORCE === "drift" ? 0.2 : 0.85, late: p.sloppy > 0.88 || FORCE === "late", prevUp: false };
    if (FORCE === "sea") auto.bias = (p.x > 0 ? 1 : -1) * ((stage().deck || 30) / 2 + 3);
    boss.pose = "film"; boss.mood = "smug"; boss.air = true;
  }

  // ---------------------------------------------------------------------------
  // The world: wind, swell, and what's under the rocket
  // ---------------------------------------------------------------------------
  function windAt(t, h) {
    var s = stage();
    if (!s.wind) return 0;
    var w = s.wind * (1 + 0.22 * Math.sin(t * 0.8 + st.windPhase));
    for (var i = 0; i < st.gusts.length; i++) {
      var g = st.gusts[i];
      if (g.t > t) break;
      var u = (t - g.t) / g.dur;
      if (u < 1) w += g.size * Math.sin(u * Math.PI);
    }
    var lift = h == null ? 1 : 0.5 + 0.5 * clamp(h / 70, 0, 1);
    return st.windDir * w * lift;
  }
  // the swell: the deck heaves and rolls; the sea's surface is the same wave
  function swell(t) {
    var s = stage(), w = Math.PI * 2 / s.period, ph = w * t + st.swellPhase;
    return {
      y: s.swell * Math.sin(ph), vy: s.swell * w * Math.cos(ph),
      roll: s.roll * Math.sin(ph + 1.1), vroll: s.roll * w * Math.cos(ph + 1.1)
    };
  }
  function seaY(x, t) {
    var s = stage(), w = Math.PI * 2 / s.period;
    return -SEA_DROP + s.swell * Math.sin(w * t + st.swellPhase - x * 0.07) + 0.12 * Math.sin(t * 2.1 + x * 0.6);
  }

  // What's under x: { kind, y, vy, angle, land (a flat bit), x0, x1 (its edges) }
  function under(x, t) {
    var s = stage();
    if (s.scene === "sea") {
      var half = s.deck / 2, sw = swell(t);
      if (x >= -half && x <= half) {
        return { kind: "deck", y: sw.y + Math.tan(sw.roll) * x, vy: sw.vy + sw.vroll * x, angle: sw.roll, land: true, x0: -half, x1: half };
      }
      return { kind: "sea", y: seaY(x, t), vy: 0, angle: 0, land: false };
    }
    if (s.scene === "party") {
      var P = A.PARTY;
      if (x >= P.marquee[0] - 0.6 && x <= P.marquee[1] + 0.6) {
        var mid = (P.marquee[0] + P.marquee[1]) / 2, half2 = (P.marquee[1] - P.marquee[0]) / 2 + 0.6;
        return { kind: "marquee", y: 8.5 + 3.7 * (1 - Math.abs(x - mid) / half2), vy: 0, angle: 0, land: false };
      }
      if (st.cake && Math.abs(x - P.cake) < 1.5) return { kind: "cake", y: 5.2, vy: 0, angle: 0, land: false };
      if (x >= P.pool[0] && x <= P.pool[1]) return { kind: "pool", y: -0.4, vy: 0, angle: 0, land: false };
      if (x >= P.terrace[0] && x <= P.terrace[1]) return { kind: "terrace", y: 1.4, vy: 0, angle: 0, land: false };
      if (x < P.marquee[0]) return { kind: "lawn", y: 0, vy: 0, angle: 0, land: true, x0: -200, x1: P.marquee[0] - 0.6 };
      if (x > P.terrace[1]) return { kind: "lawn", y: 0, vy: 0, angle: 0, land: true, x0: P.terrace[1], x1: 200 };
      return { kind: "lawn", y: 0, vy: 0, angle: 0, land: true, x0: st.cake && x < P.cake ? P.marquee[1] + 0.6 : st.cake ? P.cake + 1.5 : P.marquee[1] + 0.6,
               x1: st.cake && x < P.cake ? P.cake - 1.5 : P.pool[0] };
    }
    // mars
    var M = st.mars;
    if (x >= M.pad[0] && x <= M.pad[1]) return { kind: "pad", y: 0, vy: 0, angle: 0, land: true, x0: M.pad[0], x1: M.pad[1] };
    var y = marsY(M.ground, x), y2 = marsY(M.ground, x + 0.5);
    return { kind: "rough", y: y, vy: 0, angle: Math.atan2(y2 - y, 0.5), land: false };
  }
  function crossX() { return 0; }

  // The rocket's feet and its other low points, in the world
  function feet(r) {
    var m = run.mods, spread = (m.legs ? A.LEG_WIDE : A.LEG_X);
    var d = r.legs;
    var fx = (10.5 + (spread - 10.5) * d) * RK, fy = (9 - 9 * d) * RK;
    var c = Math.cos(r.a), s = Math.sin(r.a);
    function at(lx, ly) { return { x: r.x + lx * c + ly * s, y: r.y - lx * s + ly * c }; }
    return [at(-fx, fy), at(fx, fy), at(-19 * RK, 15 * RK), at(19 * RK, 15 * RK), at(0, RH)];
  }
  function heightAbove(r) {
    var u = under(r.x, clock);
    return r.y - u.y;
  }

  // ---------------------------------------------------------------------------
  // Flying
  // ---------------------------------------------------------------------------
  function steerFrom(input) {
    var m = run.mods;
    if (AUTO) return { up: auto.out.up, rate: auto.out.steer * TURN * m.turn };
    var up = input.up || input.action || held;
    // a mouse: the rocket leans towards the pointer, more the further it is to one side
    if (input.mode === "mouse" && input.aim.on && !input.left && !input.right) {
      lastMode = "mouse";
      var p = toScreen(rk.x, rk.y + RH * 0.55);
      var want = clamp(Math.atan2(input.aim.x - p.x, Math.min(W, H) * MOUSE_REACH), -0.95, 0.95);
      return { up: up, rate: clamp((want - rk.a) * 9, -TURN * m.turn, TURN * m.turn), aimed: true };
    }
    if (input.mode === "touch") lastMode = "touch"; else if (input.mode === "pad") lastMode = "pad"; else if (input.left || input.right || input.up) lastMode = "keys";
    var steer = input.steer || ((input.right ? 1 : 0) - (input.left ? 1 : 0));
    var rate = steer * TURN * m.turn;
    if (!steer && m.level) rate = clamp(-rk.a * 5, -TURN * m.turn * 0.8, TURN * m.turn * 0.8);
    return { up: up, rate: rate };
  }

  function fly(dt, ctl) {
    var r = rk, s = stage(), m = run.mods;
    r.t += dt;
    // leaning
    r.va += (ctl.rate - r.va) * Math.min(1, dt * TURN_EASE);
    r.a = clamp(r.a + r.va * dt, -MAX_TILT, MAX_TILT);
    if (Math.abs(r.a) >= MAX_TILT) r.va = 0;
    if (Math.abs(ctl.rate) > 0.3 && !ctl.aimed) r.leaned += dt;
    if (ctl.aimed && Math.abs(r.a) > 0.15) r.leaned += dt;
    // the engine
    var on = ctl.up && r.fuel > 0;
    r.thrust = clamp(r.thrust + (on ? dt : -dt) / SPOOL, 0, 1);
    if (r.thrust > 0) {
      r.fuel = Math.max(0, r.fuel - r.thrust * m.burn * dt);
      r.burned += dt * r.thrust;
      if (r.fuel <= 0 && !r.dry) { r.dry = true; shell.callout(CALL.fuel, { ms: 1100 }); bossSay(BOSS.fuel, true); }
    }
    var push = THRUST * m.thrust * r.thrust;
    var h = heightAbove(r);
    var wind = windAt(clock, h) * m.windK;
    var ax = push * Math.sin(r.a) - s.drag * (r.vx - wind);
    var ay = push * Math.cos(r.a) - s.g - 0.03 * r.vy;
    r.vx += ax * dt;
    r.vy += ay * dt;
    r.x += r.vx * dt;
    r.y += r.vy * dt;
    r.legs = clamp(r.legs + (h < LEGS_AT ? dt / 0.6 : 0), 0, 1);
    if (h < LEGS_AT && !r.legSound) { r.legSound = true; sfx.legs(); }
    // gone: too far off to come back
    var u = under(r.x, clock);
    if (Math.abs(r.x) > 140 || r.y > 260) return outcome("lost", u);
    // touching anything?
    var pts = feet(r);
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i], below = under(p.x, clock);
      if (p.y <= below.y) return touch(p, below, i);
    }
  }

  // First contact: a landing, or which kind of crash
  function touch(p, below, which) {
    var r = rk, m = run.mods;
    var mid = under(r.x, clock);
    if (DEBUG) (run.log = run.log || []).push({ s: run.stage, b: st.booster, kind: below.kind, which: which, impact: +(-(r.vy - below.vy)).toFixed(2),
      side: +Math.abs(r.vx).toFixed(2), lean: +Math.abs(r.a + below.angle).toFixed(3), x: +r.x.toFixed(2), legs: +r.legs.toFixed(2), fuel: +r.fuel.toFixed(2) });
    if (below.kind === "sea" || below.kind === "pool") return outcome(below.kind === "pool" ? "pool" : "splash", below);
    if (below.kind === "marquee") { st.lit = true; return outcome("marquee", below); }
    if (below.kind === "cake") { st.cake = false; return outcome("cake", below); }
    var impact = -(r.vy - below.vy);
    var side = Math.abs(r.vx);
    var lean = Math.abs(r.a + below.angle);
    var safeVy = SAFE_VY * m.safeVy, safeTilt = SAFE_TILT * m.safeTilt;
    var legsOn = which < 2 && r.legs > 0.85;
    // both feet on the flat bit?
    var pts = feet(r);
    var onFlat = mid.land && pts[0].x >= mid.x0 - 0.2 && pts[1].x <= mid.x1 + 0.2;
    var centreOn = mid.land;
    var gentle = impact <= safeVy && side <= SAFE_VX && lean <= safeTilt && legsOn;
    if (gentle && onFlat) return land(impact, lean, mid);
    // gentle enough, but not all of it on the flat: it stands for a moment, then goes over
    if (gentle || (stage().scene === "mars" && impact <= safeVy * 1.3 && side <= SAFE_VX * 1.5)) return outcome("tip", centreOn ? mid : below);
    return outcome(stage().scene === "mars" ? "dent" : "crash", below);
  }

  function land(impact, lean, surf) {
    var r = rk, m = run.mods, s = stage();
    r.state = "landed";
    r.thrust = 0;
    r.squash = 1;
    r.onX = r.x;
    r.y = surf.y;
    r.a = -surf.angle;
    r.vx = r.vy = r.va = 0;
    var safeVy = SAFE_VY * m.safeVy, safeTilt = SAFE_TILT * m.safeTilt;
    var dx = Math.abs(r.x - crossX());
    var soft = PTS.soft * clamp(1 - (impact - SOFT) / (safeVy - SOFT), 0, 1) * (1 - 0.5 * clamp(lean / safeTilt, 0, 1));
    var cross = PTS.cross * Math.pow(clamp(1 - dx / CROSS_R, 0, 1), 1.2);
    var fuel = PTS.fuel * clamp(r.fuel / r.cap, 0, 1);
    var mult = (s.mult || 1) * m.pay;
    var total = Math.round((PTS.land + soft + cross + fuel) * mult);
    run.score += total;
    run.stageScore += total;
    run.landed++;
    run.stageLanded++;
    run.fuelLeft += r.fuel / r.cap;
    if (run.closest == null || dx < run.closest) run.closest = dx;
    if (s.scene === "mars") run.marsLanded = true;
    said.landed = true;
    receipt = { t: 0, total: total, rows: [
      ["Landed", Math.round(PTS.land)], ["Soft", Math.round(soft)], ["Cross", Math.round(cross)], ["Fuel", Math.round(fuel)]
    ], mult: mult !== 1 ? (s.mult ? "Mars x2" : "") + (m.pay !== 1 ? (s.mult ? ", " : "") + "less a fifth" : "") : "" };
    var word = dx < 0.5 ? CALL.perfect : impact < SOFT ? CALL.feather : dx > 4 ? CALL.off : impact > safeVy * 0.8 ? CALL.firm : CALL.landed;
    if (s.scene === "mars") word = CALL.nobody;
    shell.callout(word, { ms: 1500 });
    sfx.land(word === CALL.perfect || word === CALL.feather);
    shake = Math.max(shake, clamp(impact / 10, 0.05, 0.3));
    for (var i = 0; i < 8; i++) puffAt(r.x + rand(-4, 4), r.y + rand(0.2, 1), rand(0.8, 1.6), (Math.random() < 0.5 ? -1 : 1) * rand(2, 5), rand(0.3, 1.2), 1.4);
    if (s.scene === "mars") earthSay(EARTH.landed);
    else {
      boss.pose = "cheer"; boss.mood = "grin";
      bossSay(word === CALL.perfect || word === CALL.feather ? BOSS.perfect : word === CALL.off ? BOSS.offcross : word === CALL.firm ? BOSS.firm : BOSS.landed, true);
    }
    if (s.scene === "party") guests.forEach(function (g) { g.cheer = 1.5; });
    phase = "beat"; beatKind = "landed"; beatT = 0;
  }

  // Everything that isn't a landing
  function outcome(kind, surf) {
    var r = rk, s = stage(), m = run.mods;
    var fire = kind === "crash" || kind === "marquee" || kind === "cake";
    r.state = kind;
    r.thrust = 0;
    run.crashes++;
    if (m.crashPay) { run.score += m.crashPay; run.stageScore += m.crashPay; }
    var word;
    if (kind === "splash") word = CALL.sea;
    else if (kind === "pool") word = CALL.pool;
    else if (kind === "tip") word = stage().scene === "sea" ? CALL.edge : CALL.tip;
    else if (kind === "marquee") word = CALL.marquee;
    else if (kind === "cake") word = CALL.cake;
    else if (kind === "dent") word = CALL.dent;
    else if (kind === "lost") word = CALL.lost;
    else { word = run.firstCrash ? "Scrubbed" : pick(CALL.crash); }
    if (kind !== "lost") run.firstCrash = false;
    if (m.crashPay) receipt = { t: 0, total: m.crashPay, rows: [["Test", m.crashPay]], mult: "" };
    shell.callout(word, { ms: 1500 });
    if (kind === "tip") {
      // it stands for a moment, then goes over: off the nearer edge, or the way it leans
      if (surf.land) r.tipDir = r.x - surf.x0 < surf.x1 - r.x ? -1 : 1;
      else r.tipDir = Math.abs(r.a) > 0.05 ? (r.a > 0 ? 1 : -1) : (r.x >= 0 ? 1 : -1);
      r.tip = 0; r.vx = r.vy = 0; r.onX = r.x; r.onY = r.y;
      sfx.creak();
    } else if (kind === "splash" || kind === "pool") {
      splash(r.x, kind === "pool" ? -0.4 : seaY(r.x, clock), 1);
      r.sink = 0;
    } else if (kind === "lost") {
      r.gone = true;
    } else {
      explode(r.x, Math.max(r.y, surf.y), kind === "dent");
    }
    // what he says
    if (s.scene === "mars") earthSay(EARTH.crash);
    else {
      boss.pose = "point"; boss.mood = "smug";
      var list = kind === "splash" ? BOSS.sea : kind === "pool" ? BOSS.pool : kind === "tip" ? BOSS.edge :
                 kind === "marquee" ? BOSS.partyCrash : kind === "cake" ? BOSS.cake : kind === "lost" ? BOSS.lost :
                 r.dry ? BOSS.fuel : s.scene === "party" ? BOSS.partyCrash : BOSS.crash;
      if (kind !== "tip") after(0.35, function () { bossSay(list, true); });
      else after(1.0, function () { bossSay(list, true); });
      boss.viewers *= 1.4 + Math.random() * 0.5;   // a fire gets the views
      // now and then the stream drops, and off air he's less relaxed
      if (run.crashes >= 2 && Math.random() < 0.4 && fire) {
        after(1.25, function () { boss.air = false; boss.pose = "shout"; boss.mood = "shout"; bossSay(BOSS.offair, true, true); });
      }
    }
    if (s.scene === "party" && (fire || kind === "pool")) guests.forEach(function (g) { g.duck = Math.max(g.duck, 1.6); });
    phase = "beat"; beatKind = kind === "splash" || kind === "pool" ? "splash" : kind === "lost" ? "lost" : "crash"; beatT = 0;
    if (kind === "tip") beatT = -0.9;     // the tip takes a moment
  }

  var timers = [];
  function after(sec, fn) { timers.push({ t: sec, fn: fn }); }
  function tickTimers(dt) {
    for (var i = timers.length - 1; i >= 0; i--) {
      timers[i].t -= dt;
      if (timers[i].t <= 0) { var f = timers[i].fn; timers.splice(i, 1); f(); }
    }
  }

  // A burst, a fire and bits flying off. Mars has no air: a dent and dust.
  function explode(x, y, dust) {
    var r = rk;
    var side = stage().scene === "sea" ? (x > 0 ? -1 : 1) : (r.a >= 0 ? 1 : -1);
    if (stage().scene === "party" && x > 0 && x < A.PARTY.pool[0]) side = -1;
    wreck = { x: x, y: y, a: side * Math.PI / 2 * 0.94, t: 0, dust: dust, side: side };
    r.gone = true;
    if (!dust) {
      fx.push({ kind: "burst", x: x, y: y + 3, t: 0, life: 0.6 });
      fx.push({ kind: "ring", x: x, y: y + 0.3, t: 0, life: 0.7, big: true });
    }
    shake = shell.reduceMotion ? 0 : 1;
    sfx.crash(dust);
    // the nose cone, the fins and a leg
    ["nose", "fin", "fin", "leg"].forEach(function (what, i) {
      debris.push({ what: what, x: x + rand(-1, 1), y: y + 4 + i, vx: rand(-9, 9), vy: rand(9, 18), a: 0, va: rand(-9, 9), t: 0, rest: false });
    });
    for (var k = 0; k < (dust ? 12 : 5); k++) {
      puffAt(x + rand(-4, 4), y + rand(dust ? 0.5 : 4, dust ? 3 : 7), rand(1, dust ? 2.4 : 1.8), rand(-3, 3), rand(1, 4), 1.8, dust, true);
    }
    if (stage().scene === "sea") st.scorch.push({ x: clamp(x, -stage().deck / 2 + 2, stage().deck / 2 - 2), r: 1 });
  }

  function splash(x, y, big) {
    sfx.splash();
    for (var i = 0; i < 26; i++) {
      fx.push({ kind: "drop", x: x + rand(-2.5, 2.5), y: y, vx: rand(-7, 7), vy: rand(8, 22) * big, t: 0, life: 1.6, r: rand(0.3, 0.7) });
    }
    fx.push({ kind: "ring", x: x, y: y, t: 0, life: 1.4 });
  }

  function puffAt(x, y, r, vx, vy, life, dust, back) {
    puffs.push({ x: x, y: y, r: r, vx: vx, vy: vy, t: 0, life: life, dust: !!dust, back: back != null ? back : Math.random() < 0.5 });
  }

  // ---------------------------------------------------------------------------
  // The update
  // ---------------------------------------------------------------------------
  function update(dt, input) {
    var state = shell.state();
    if (state === "playing") {
      if (AUTO) autopilot(dt);
      var ctl = rk ? steerFrom(input) : { up: false, rate: 0 };
      acc += dt;
      while (acc >= STEP) {
        acc -= STEP;
        clock += STEP;
        if (phase === "fly" && rk.state === "fly") fly(STEP, ctl);
        else rideDeck();
      }
      tickTimers(dt);
      if (phase === "fly" && rk.state === "fly") {
        warnings(dt);
        thrustSound(rk.thrust);
      } else thrustSound(0);
      var pressed = ctl.up && !prevUp;
      prevUp = ctl.up;
      if (phase === "fly" && rk && !rk.boomed) { rk.boomed = true; sfx.boom(); }
      if (phase === "beat") beat(dt, pressed);
      pickHint();
      party(dt);
      if (stage().scene === "mars" && phase === "fly") marsTalk();
    } else {
      thrustSound(0);
    }
    if (state === "playing" || state === "ending" || state === "results") {
      tickFx(dt);
      tickBubbles(dt);
      bossTick(dt);
    }
    paintHud(dt);
  }

  // A landed rocket rides the deck; a tipping one goes over
  function rideDeck() {
    var r = rk;
    if (!r) return;
    if (r.state === "landed") {
      var u = under(r.onX, clock);
      r.x = r.onX; r.y = u.y; r.a = -u.angle;
      r.squash = Math.max(0, r.squash - STEP * 4);
    } else if (r.state === "tip") {
      r.tip += STEP;
      var k = clamp(r.tip / 0.9, 0, 1);
      r.a = r.tipDir * (0.12 + k * k * (Math.PI / 2 - 0.12));
      r.x = r.onX + r.tipDir * k * k * 1.5;
      var u2 = under(r.onX, clock);
      r.y = Math.max(u2.y, r.onY - k * 1.5);
      if (r.tip >= 0.9 && !r.over) {
        r.over = true;
        // whatever is out there where the nose comes down
        var nx = r.onX + r.tipDir * RH * 0.7, far = under(nx, clock);
        if (far.kind === "sea" || far.kind === "pool") {
          splash(nx, far.y, 1);
          r.gone = true;
          rk.state = far.kind === "pool" ? "pool" : "splash";
          rk.sink = 0;
          if (far.kind === "pool") shell.callout(CALL.pool, { ms: 1200 });
        } else explode(r.onX + r.tipDir * 2, u2.y, stage().scene === "mars");
      }
    } else if (r.state === "splash" || r.state === "pool") {
      r.sink += STEP;
      r.y -= STEP * (4 + r.sink * 6);
      r.a += (r.a >= 0 ? 1 : -1) * STEP * 0.6;
    }
  }

  // After an outcome: let it land, then the next booster (or the stage's end)
  function beat(dt, pressed) {
    beatT += dt;
    var skip = pressed && beatT > SKIP_AFTER && !AUTO;
    if (beatT >= BEAT[beatKind] || skip) {
      run.flown++;
      st.booster++;
      bubbles = bubbles.filter(function (b) { return b.who !== "boss" || !b.offair; });
      if (st.booster < stage().boosters) {
        if (rk.state !== "landed") said.again = true;
        spawn();
        if (stage().scene !== "mars" && Math.random() < 0.6) bossSay(said.again ? BOSS.again : BOSS.start);
        said.again = false;
        boss.air = true;
      } else {
        phase = "wrap";
        stageEnd();
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Warnings near the deck, and the arrow (DESIGN.md, section 10)
  // ---------------------------------------------------------------------------
  var tag = null;
  function warnings(dt) {
    var r = rk, m = run.mods, h = heightAbove(r), u = under(r.x, clock);
    var fall = -(r.vy - u.vy);
    tag = null;
    var stop = THRUST * m.thrust * Math.cos(r.a) - stage().g;
    var need = (fall * fall - Math.pow(SAFE_VY * m.safeVy * 0.8, 2)) / (2 * Math.max(0.5, h - 0.5));
    if (fall > SAFE_VY * m.safeVy && (need > stop * 0.5 || h < 3)) tag = { word: "Too fast", bad: true };
    else if (h < 18 && Math.abs(r.a + u.angle) > SAFE_TILT * m.safeTilt) tag = { word: "Not upright", bad: true };
    else if (h < 14 && Math.abs(r.vx) > SAFE_VX) tag = { word: "Drifting", bad: true };
    else tag = { word: "Speed " + Math.max(0, Math.round(fall)), bad: false };
    if (tag.bad && h < 20) {
      r.warn -= dt;
      if (r.warn <= 0) { r.warn = 0.32; sfx.warn(); }
    }
    if (r.fuel > 0 && r.fuel / r.cap < 0.2) {
      r.lowT = (r.lowT || 0) - dt;
      if (r.lowT <= 0) { r.lowT = 0.6; sfx.low(); }
    }
  }

  function pickHint() {
    hint = null;
    if (phase !== "fly" || !rk) return;
    var r = rk, i = run.stage, b = st.booster, h = heightAbove(r);
    var mode = touching() ? "touch" : lastMode;
    if (i === 0 && b === 0 && r.burned < 0.6 && !AUTO) {
      hint = { at: "rocket", word: mode === "touch" ? "Hold Thrust" : mode === "mouse" ? "Hold the button" : mode === "pad" ? "Hold A" : "Hold Up" };
      return;
    }
    if (i === 0 && b === 0 && r.leaned < 0.3 && Math.abs(r.x - crossX()) > 3 && !AUTO) {
      hint = { at: "rocket", word: mode === "touch" ? "Lean: arrows" : mode === "mouse" ? "Point to lean" : "Lean: left, right" };
      return;
    }
    if (i === 0 && b === 0 && h < 50 && h > 14 && !said.landed) { hint = { at: "cross", word: "Land here" }; return; }
    if (i === 1 && b === 0 && clock < 3.5) { hint = { at: "sock", word: "Wind" }; return; }
    if (h < 14) return;
    if (i === 2 && b === 0 && clock < 3.5) { hint = { at: "cross", word: "It moves" }; return; }
    if (i === 3 && clock < 3.5) { hint = { at: "cross", word: "Land here" }; return; }
    if (i === 4 && clock < 3.5) { hint = { at: "cross", word: "The pad" }; return; }
  }

  // ---------------------------------------------------------------------------
  // The party: balloons up through the descent, guests duck and cheer
  // ---------------------------------------------------------------------------
  function party(dt) {
    if (stage().scene !== "party") return;
    while (st.balloonAt.length && st.balloonAt[0].t <= clock) {
      var b = st.balloonAt.shift();
      balloons.push({ x: b.x, y: 4, c: b.c, t: 0, popped: 0 });
    }
    balloons = balloons.filter(function (b) {
      b.t += dt;
      if (b.popped) { b.popped += dt; return b.popped < 0.4; }
      b.y += 3.1 * dt;
      b.x += (windAt(clock, b.y) * 0.4 - 1.6) * dt + Math.sin(b.t * 1.7 + b.c) * 0.6 * dt;
      if (rk && rk.state === "fly") {
        // the rocket's body, as a line from its feet to its nose
        var c = Math.cos(rk.a), s = Math.sin(rk.a);
        var ax = rk.x + s * 2, ay = rk.y + c * 2, bx = rk.x + s * RH, by = rk.y + c * RH;
        var t = clamp(((b.x - ax) * (bx - ax) + (b.y - ay) * (by - ay)) / ((bx - ax) * (bx - ax) + (by - ay) * (by - ay)), 0, 1);
        var px = ax + (bx - ax) * t, py = ay + (by - ay) * t;
        if (Math.hypot(b.x - px, b.y - py) < 2.6) {
          b.popped = 0.01;
          var dir = b.x < px ? 1 : -1;
          rk.vx += dir * 2.2;
          rk.va += dir * 0.9;
          sfx.pop();
          if (!said.balloon) { said.balloon = true; shell.callout(CALL.balloon, { ms: 1000, sound: false }); bossSay(BOSS.balloon, true); }
        }
      }
      return b.y < 140;
    });
    guests.forEach(function (g) {
      // duck when it comes anywhere near the terrace
      if (rk && rk.state === "fly" && rk.x > 14 && rk.y < 32) {
        if (g.duck <= 0.2 && !said.duck) { said.duck = true; guestSay(g, pick(DUCK)); }
        g.duck = Math.max(g.duck, 0.8);
      }
      g.duck = Math.max(0, g.duck - dt * 0.6);
      if (g.cheer) g.cheer = Math.max(0, g.cheer - dt);
    });
    if (phase === "fly" && rk && rk.t > 2.2 && rk.t < 2.3 && !said.guest) {
      said.guest = true;
      guestSay(guests[1], pick(GUESTS));
    }
  }

  function marsTalk() {
    if (!said.earth && clock > st.earthAt) { said.earth = true; earthSay(EARTH.start); }
  }

  // ---------------------------------------------------------------------------
  // The end of a stage, and of the round
  // ---------------------------------------------------------------------------
  function stageEnd() {
    var s = stage(), n = s.boosters;
    if (run.stage === LAST) { end(); return; }
    var all = run.stageLanded === n, none = run.stageLanded === 0;
    var next = run.stage + 1;
    var offers = offer();
    var stats = [
      { label: "Landed", value: run.stageLanded + " of " + n },
      { label: "Points", value: fmt(run.stageScore) },
      { label: "Total", value: fmt(run.score) }
    ];
    shell.interlude({
      stamp: all ? "Approved" : none ? "Not approved" : "Pending review",
      tilt: all ? -5 : 4,
      heading: "Stage " + (run.stage + 1) + " complete.",
      line: pick(s.id === "party" ? (all ? CLEAR.partyAll : rk && rk.state === "pool" ? CLEAR.partyPool : CLEAR.partyNone) : all ? CLEAR.all : none ? CLEAR.none : CLEAR.one),
      stats: stats,
      ask: "Stage " + (next + 1) + ": " + STAGES[next].name + ". He's offering upgrades.",
      choices: offers.map(function (u) { return { label: u.label, detail: u.detail }; }),
      delay: 1200
    }).then(function (i) {
      var u = offers[i] || offers[0];
      if (u) { run.taken.push(u.id); u.apply(run.mods); }
      run.stage = next;
      bubbles = [];
      fx = []; debris = []; puffs = [];
      cam.snap = true;
      startStage();
      shell.next();
    });
  }

  // Three upgrades not taken yet, from the stage's own stream
  function offer() {
    var r = N.seeded((shell.seed + 7 + run.stage * 7919) | 0);
    var pool = UPGRADES.filter(function (u) {
      if (run.taken.indexOf(u.id) >= 0) return false;
      if (u.id === "cheap" && run.taken.indexOf("legs") >= 0) return false;
      if (u.id === "legs" && run.taken.indexOf("cheap") >= 0) return false;
      return true;
    });
    var out = [];
    while (out.length < 3 && pool.length) out.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
    return out;
  }

  function end() {
    var score = Math.round(run.score);
    var rec = shell.record(score);
    var rank;
    if (run.landed >= TOTAL - 1 && run.marsLanded && score >= APPROVE) rank = 1;
    else if (run.landed >= 5) rank = 2;
    else if (run.landed >= 1) rank = 3;
    else rank = 4;
    var heading = run.landed === TOTAL ? "All " + TOTAL + " landed." : run.landed ? "Landed " + run.landed + " of " + TOTAL + "." : "Nothing landed.";
    var line = RANKS[rank - 1];
    if (rank === 1 && run.landed < TOTAL) line = "Seven came home, and the best was on Mars, where nobody saw it. The other is data. He has announced he flew them himself, from a boat.";
    if (rank === 2 && run.landed === TOTAL) line = "Every one came home, a bit bent. He has announced they came home perfect.";
    else if (rank === 2 && run.marsLanded) line = "Most of them came back, and one landed on Mars, where nobody saw it. The rest are being described as data.";
    else if (rank === 3 && run.landed === 1) line = "One landed. He has had it framed. The rest are data.";
    var stats = [
      { label: "Score", value: fmt(score) },
      { label: "Landed", value: run.landed + " of " + TOTAL }
    ];
    if (run.closest != null) stats.push({ label: "Closest to the cross", value: (run.closest * 1.5).toFixed(1) + "m" });
    stats.push({ label: rec.isNew ? (run.daily ? "New best today" : "New best") : (run.daily ? "Best today" : "Best"),
                 value: fmt(rec.isNew ? score : rec.best || 0), highlight: rec.isNew });
    if (run.daily) stats.unshift({ label: "Run", value: shell.today });
    shell.finish({
      place: rank, total: 4, heading: heading, line: line, stats: stats, delay: 1300,
      share: fmt(score) + " points, " + run.landed + " of " + TOTAL + " landed"
    });
  }

  // ---------------------------------------------------------------------------
  // The autopilot (?autopilot and ?clip): a descent speed for every height, a
  // sideways speed towards the cross, and a lean to get it. It reacts every
  // tenth of a second or so, aims a little off, and now and then misjudges
  // the wind or leaves the burn too late.
  // ---------------------------------------------------------------------------
  function autopilot(dt) {
    auto.t -= dt;
    if (auto.t > 0 || !rk || rk.state !== "fly") { if (phase !== "fly") auto.out = { up: false, steer: 0 }; return; }
    auto.t = rand(0.06, 0.14);
    var r = rk, s = stage(), m = run.mods;
    var push = THRUST * m.thrust;
    var tx = crossX() + auto.bias;
    var u = under(tx, clock);
    var h = r.y - u.y;
    var dx = tx - r.x;
    // sideways: a speed towards the cross, gentler close in
    var vxWant = clamp(dx * 0.42, -9, 9);
    if (h < 10) vxWant = clamp(dx * 0.3, -2, 2);
    var wind = windAt(clock, h) * m.windK * auto.windSense;
    var axWant = (vxWant - r.vx) * 1.1 - s.drag * (wind - r.vx);
    var lean = Math.asin(clamp(axWant / push, -0.55, 0.55));
    var limit = h < 4 ? 0.04 : h < 12 ? 0.18 : 0.5;
    lean = clamp(lean, -limit, limit);
    // down: fall most of the way, then slow to a walk at the deck
    var brake = (push * Math.cos(r.a) - s.g) * (auto.late ? (FORCE === "late" ? 2.6 : 1.8) : 0.62);
    var vyWant = -(1.4 + Math.sqrt(Math.max(0, 2 * brake * Math.max(0, h - 1.2))) * 0.82);
    if (Math.abs(dx) > 6 && h < 26) vyWant = Math.max(vyWant, -2.5);   // hold off until it's over the deck
    var fall = r.vy - u.vy;
    var up = fall < vyWant - 0.2 ? true : fall > vyWant + 0.2 ? false : auto.prevUp;
    if (r.fuel / r.cap < 0.08 && h > 6) up = fall < -4.5;
    auto.prevUp = up;
    var diff = lean - r.a;
    auto.out = { up: up, steer: Math.abs(diff) < 0.035 ? 0 : clamp(diff * 7, -1, 1) };
  }

  // ---------------------------------------------------------------------------
  // Talking
  // ---------------------------------------------------------------------------
  function bossSay(list, force, offair) {
    var text = typeof list === "string" ? list : pick(list);
    if (!force && bubbles.some(function (b) { return b.who === "boss"; })) return;
    bubbles = bubbles.filter(function (b) { return b.who !== "boss"; });
    bubbles.push({ who: "boss", text: text, t: 0, life: 2.2 + text.length * 0.03, offair: !!offair });
    voice("boss", text);
  }
  function earthSay(list) {
    var text = pick(list);
    bubbles = bubbles.filter(function (b) { return b.who !== "earth"; });
    bubbles.push({ who: "earth", text: text, t: 0, life: 2.6 + text.length * 0.03 });
    voice("earth", text);
  }
  function guestSay(g, text) {
    if (!g) return;
    bubbles = bubbles.filter(function (b) { return b.who !== "guest"; });
    bubbles.push({ who: "guest", g: g, text: text, t: 0, life: 2.2 });
    voice("guest", text);
  }
  function tickBubbles(dt) {
    bubbles = bubbles.filter(function (b) { b.t += dt; return b.t < b.life; });
    // quiet on the final approach: nobody talks over the landing
    if (phase === "fly" && rk && heightAbove(rk) < 20) bubbles.forEach(function (b) { if (b.t < b.life - 0.4) b.life = b.t + 0.4; });
  }
  function bossTick(dt) {
    boss.t += dt;
    if (phase === "fly" && rk && rk.t > 0.6 && rk.t < 0.7 && !said["s" + run.stage + "b" + st.booster] && stage().scene !== "mars") {
      said["s" + run.stage + "b" + st.booster] = true;
      var s = stage();
      if (st.booster === 0) {
        var list = run.stage === 0 ? BOSS.first : s.id === "weather" ? BOSS.weather.concat(BOSS.smaller) :
                   s.id === "swell" ? BOSS.swell : s.id === "party" ? BOSS.party : BOSS.start;
        bossSay(list);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------
  function tickFx(dt) {
    shake = Math.max(0, shake - dt * 2.4);
    if (wreck) wreck.t += dt;
    if (receipt) receipt.t += dt;
    fx = fx.filter(function (f) {
      f.t += dt;
      if (f.kind === "drop") { f.vy -= 22 * dt; f.x += f.vx * dt; f.y += f.vy * dt; }
      return f.t < f.life;
    });
    debris.forEach(function (d) {
      if (d.rest) return;
      d.t += dt;
      d.vy -= stage().g * 1.6 * dt;
      d.x += d.vx * dt; d.y += d.vy * dt; d.a += d.va * dt;
      var u = under(d.x, clock);
      if (d.y <= u.y + 0.3) {
        if (u.kind === "sea" || u.kind === "pool") { d.rest = true; d.sunk = true; splashSmall(d.x, u.y); }
        else if (d.vy < -4) { d.vy *= -0.3; d.vx *= 0.5; d.va *= 0.5; d.y = u.y + 0.3; }
        else { d.rest = true; d.y = u.y + 0.3; d.a = d.what === "nose" ? 0 : d.a; }
      }
    });
    puffs = puffs.filter(function (p) {
      p.t += dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= Math.pow(0.4, dt); p.vy *= Math.pow(0.6, dt);
      p.r += dt * 1.2;
      return p.t < p.life;
    });
    // smoke off a fire, and a little dust or spray off the engine near the ground
    if (wreck && !wreck.dust && wreck.t > 0.3 && wreck.t < 2.6 && Math.random() < dt * 7) {
      puffAt(wreck.x + wreck.side * rand(1, 10), wreck.y + rand(4.5, 6), rand(0.7, 1.3), rand(-1, 1) + windAt(clock, 10) * 0.3, rand(3, 5), 1.6, false, true);
    }
    if (rk && rk.state === "fly" && rk.thrust > 0.5) {
      var h = heightAbove(rk);
      if (h < 12 && Math.random() < dt * 30 * (1 - h / 12)) {
        var u = under(rk.x, clock);
        var dir = Math.random() < 0.5 ? -1 : 1;
        puffAt(rk.x + dir * rand(1, 3), u.y + 0.6, rand(0.6, 1.2), dir * rand(5, 10), rand(0.2, 1.2), 0.9, stage().scene === "mars");
      }
    }
    // wind streaks across the sky
    var wind = stage().wind ? windAt(clock, 60) : 0;
    if (Math.abs(wind) > 1 && Math.random() < dt * Math.abs(wind) * 1.6 && streaks.length < 40) {
      var vw = W / cam.z, vh = H / cam.z;
      streaks.push({ x: cam.x + rand(-0.6, 0.5) * vw * (wind > 0 ? 1 : -1), y: cam.y + rand(-0.3, 0.45) * vh, t: 0, life: rand(0.8, 1.5), v: wind * rand(1.6, 2.4) });
    }
    streaks = streaks.filter(function (s) { s.t += dt; s.x += s.v * dt; return s.t < s.life; });
  }
  function splashSmall(x, y) {
    for (var i = 0; i < 6; i++) fx.push({ kind: "drop", x: x, y: y, vx: rand(-3, 3), vy: rand(4, 9), t: 0, life: 0.9, r: rand(0.2, 0.4) });
  }

  // ---------------------------------------------------------------------------
  // Sound, all made in code (DESIGN.md, section 9)
  // ---------------------------------------------------------------------------
  var snd = N.sound;
  var engine = null;
  function thrustSound(level) {
    var c = snd.ctx();
    if (!c || c.state !== "running") return;
    if (!engine) {
      if (level <= 0) return;
      // a looped rumble: low-passed noise and a buzzing saw, faded with the thrust
      var buf = c.createBuffer(1, c.sampleRate, c.sampleRate), d = buf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      var src = c.createBufferSource(); src.buffer = buf; src.loop = true;
      var lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 520; lp.Q.value = 0.9;
      var saw = c.createOscillator(); saw.type = "sawtooth"; saw.frequency.value = 52;
      var sg = c.createGain(); sg.gain.value = 0.18;
      var gain = c.createGain(); gain.gain.value = 0;
      src.connect(lp); lp.connect(gain); saw.connect(sg); sg.connect(gain); gain.connect(snd.out());
      src.start(); saw.start();
      engine = { gain: gain, saw: saw, lp: lp };
    }
    engine.gain.gain.setTargetAtTime(level * 0.42, c.currentTime, 0.03);
    engine.saw.frequency.setTargetAtTime(48 + level * 14 + Math.random() * 4, c.currentTime, 0.05);
  }
  var sfx = {
    boom: function () { snd.tone(70, 0.3, { type: "sine", slide: 32, vol: 0.32 }); snd.noise(0.25, { freq: 300, vol: 0.18 }); snd.tone(64, 0.3, { type: "sine", slide: 30, vol: 0.28, delay: 0.24 }); snd.noise(0.22, { freq: 280, vol: 0.14, delay: 0.24 }); },
    legs: function () { snd.tone(200, 0.07, { type: "square", slide: 120, vol: 0.05 }); snd.tone(160, 0.07, { type: "square", slide: 100, vol: 0.05, delay: 0.12 }); },
    land: function (great) {
      snd.tone(90, 0.22, { type: "sine", slide: 50, vol: 0.32 }); snd.noise(0.12, { freq: 500, vol: 0.12 });
      snd.tone(784, 0.12, { type: "triangle", vol: 0.07, delay: 0.25 }); snd.tone(1047, 0.2, { type: "triangle", vol: 0.07, delay: 0.36 });
      if (great) snd.tone(1568, 0.3, { type: "triangle", vol: 0.06, delay: 0.5 });
    },
    crash: function (dust) {
      snd.noise(dust ? 0.5 : 1.1, { freq: dust ? 400 : 700, vol: dust ? 0.3 : 0.42 });
      snd.tone(110, 0.6, { type: "sine", slide: 28, vol: 0.45 });
      if (!dust) for (var i = 0; i < 8; i++) snd.noise(0.05, { type: "highpass", freq: 2500, vol: 0.06, delay: 0.3 + i * 0.13 + Math.random() * 0.08 });
    },
    splash: function () { snd.noise(0.7, { type: "bandpass", freq: 1300, q: 0.7, vol: 0.3 }); snd.tone(500, 0.4, { type: "triangle", slide: 160, vol: 0.05 }); },
    creak: function () { snd.tone(140, 0.7, { type: "sawtooth", slide: 90, vol: 0.05 }); },
    warn: function () { snd.tone(988, 0.07, { type: "square", vol: 0.035 }); },
    low: function () { snd.tone(440, 0.06, { type: "square", vol: 0.03 }); },
    pop: function () { snd.noise(0.06, { type: "highpass", freq: 1800, vol: 0.25 }); }
  };
  // Everyone talks in blips, one a syllable (as in Unexpected Item)
  function voice(who, text) {
    var syl = Math.min(14, (text.match(/[aeiouy]+/gi) || []).length);
    var base = who === "boss" ? 175 : who === "earth" ? 330 : 262;
    var type = who === "boss" ? "sawtooth" : who === "earth" ? "square" : "triangle";
    var gap = who === "boss" ? 0.085 : 0.075;
    for (var i = 0; i < syl; i++) {
      var f = base * (1 + 0.1 * Math.sin(i * 1.9 + text.length) + (i === syl - 1 ? -0.1 : 0));
      snd.tone(f, gap * 0.8, { type: type, vol: who === "earth" ? 0.022 : 0.03, delay: i * gap + (who === "earth" ? 0.05 : 0) });
    }
    if (who === "earth") snd.noise(0.12, { type: "highpass", freq: 3000, vol: 0.04 });
  }

  // ---------------------------------------------------------------------------
  // HUD: stage and fuel top left; points and rockets top right
  // ---------------------------------------------------------------------------
  function buildHud() {
    shell.hud.innerHTML =
      '<div class="kit-hud-tl">' +
        '<p class="kit-stat"><small>Stage</small><span data-stage>1/5</span></p>' +
        '<p class="kit-meter scrubbed-fuel" data-fuel><span class="kit-meter-label" data-fuel-label>Fuel</span><span class="kit-meter-bar"><span data-fuel-bar></span></span></p>' +
      '</div>' +
      '<div class="kit-hud-tr">' +
        '<p class="kit-stat kit-stat-big"><span data-score>0</span></p>' +
        '<p class="kit-stat"><small>Rocket</small><span data-rocket>1/2</span></p>' +
      '</div>';
    hudEls = {};
    ["stage", "fuel", "fuel-label", "fuel-bar", "score", "rocket"].forEach(function (k) {
      hudEls[k] = shell.hud.querySelector("[data-" + k + "]");
    });
  }
  function setText(node, value) { if (node && node.textContent !== value) node.textContent = value; }
  var shown = 0;
  function paintHud(dt) {
    if (!hudEls || !run) return;
    shown += (run.score - shown) * Math.min(1, (dt || 1) * 6);
    if (Math.abs(run.score - shown) < 1) shown = run.score;
    setText(hudEls.stage, (run.stage + 1) + "/" + STAGES.length);
    setText(hudEls.score, fmt(shown));
    setText(hudEls.rocket, Math.min(st.booster + 1, stage().boosters) + "/" + stage().boosters);
    var share = rk ? clamp(rk.fuel / rk.cap, 0, 1) : 1;
    var w = Math.round(share * 100) + "%";
    if (hudEls["fuel-bar"].style.width !== w) hudEls["fuel-bar"].style.width = w;
    var low = rk && rk.state === "fly" && share < 0.2;
    setText(hudEls["fuel-label"], rk && rk.fuel <= 0 ? "Fuel: none" : low ? "Fuel: low" : "Fuel");
    hudEls.fuel.classList.toggle("is-low", !!low || !!(rk && rk.fuel <= 0));
    shell.padFill("up", share);
  }

  // ---------------------------------------------------------------------------
  // The camera: the rocket and the whole landing area together, clear of the
  // HUD above and the buttons below, easing in as the rocket comes down
  // ---------------------------------------------------------------------------
  function sceneBox() {
    var s = stage();
    if (s.scene === "sea") return { x0: -s.deck / 2 - 4, x1: Math.max(s.deck / 2 + 4, boatX() + 6.5), y0: -SEA_DROP - 1.6, y1: 9 };
    if (s.scene === "party") return { x0: A.PARTY.marquee[0] - 1.5, x1: A.PARTY.terrace[1] + 1, y0: -2.2, y1: 13.5 };
    return { x0: -19, x1: 17, y0: -2.4, y1: 9 };
  }
  function boatX() { return stage().deck / 2 + 9.5; }
  // The notice card sits along the bottom while it's up, so the scene stands
  // on top of it during the countdown, then settles once it's gone
  var briefEl = null;
  function margins() {
    var boxes = hudBoxes(), top = 8;
    boxes.forEach(function (b) { top = Math.max(top, b.bottom + 8); });
    var bottom = touching() ? 92 : 10;
    briefEl = briefEl || root.querySelector(".kit-brief");
    if (briefEl && briefEl.classList.contains("is-on")) {
      var base = root.getBoundingClientRect(), r = briefEl.getBoundingClientRect();
      if (r.height) bottom = Math.max(bottom, base.bottom - r.top + 8);
    }
    return { top: top, bottom: bottom, side: 10 };
  }
  // The camera keeps a box that must be on screen: the landing area and the
  // rocket. It grows at once (the rocket is never off screen) and shrinks
  // smoothly (easing in as it comes down). Zoom and position both come from
  // that box, so the scene always stands on the bottom of the free space.
  function frame(dt) {
    if (!rk) return;
    var b = sceneBox(), M = margins();
    var rx = rk.gone && wreck ? wreck.x : rk.x, ry = rk.gone && wreck ? wreck.y : rk.y;
    var want = { x0: Math.min(b.x0, rx - 5), x1: Math.max(b.x1, rx + 5), y0: b.y0, y1: Math.max(b.y1, ry + RH + 3) };
    var B = cam.box;
    if (!B || cam.snap || !dt) { B = cam.box = { x0: want.x0, x1: want.x1, y0: want.y0, y1: want.y1 }; cam.snap = false; }
    else {
      var k = 1 - Math.exp(-dt * 2.2);
      B.x0 = Math.min(want.x0, B.x0 + (want.x0 - B.x0) * k);
      B.x1 = Math.max(want.x1, B.x1 + (want.x1 - B.x1) * k);
      B.y1 = Math.max(want.y1, B.y1 + (want.y1 - B.y1) * k);
      B.y0 = want.y0;
    }
    // the free space can move (the notice going), so the margins are eased too
    var mb = cam.mb == null || !dt ? M.bottom : cam.mb + (M.bottom - cam.mb) * (1 - Math.exp(-dt * 5));
    cam.mb = mb;
    var aw = Math.max(40, W - M.side * 2), ah = Math.max(40, H - M.top - mb);
    var zMax = Math.min(W, H) / 34, zMin = Math.min(W, H) / 300;
    var z = clamp(Math.min(aw / (B.x1 - B.x0), ah / (B.y1 - B.y0)), zMin, zMax);
    cam.z = z;
    cam.x = (B.x0 + B.x1) / 2;
    cam.y = B.y0 + (H / 2 - mb) / z;
    // too tall to fit even far out: keep the rocket in view instead
    if ((B.y1 - B.y0) * z > ah + 1) cam.y = Math.max(cam.y, ry + RH + 2 - (H / 2 - M.top) / z);
  }
  function toScreen(x, y) { return { x: W / 2 + (x - cam.x) * cam.z, y: H / 2 - (y - cam.y) * cam.z }; }

  // Where the HUD and the buttons sit over the canvas, in CSS pixels
  function hudBoxes() {
    if (hudBox) return hudBox;
    var base = root.getBoundingClientRect();
    hudBox = [];
    Array.prototype.forEach.call(root.querySelectorAll(".kit-hud-tl, .kit-hud-tr, .kit-bar"), function (el) {
      var r = el.getBoundingClientRect();
      if (r.width) hudBox.push({ left: r.left - base.left, right: r.right - base.left, bottom: r.bottom - base.top, top: r.top - base.top });
    });
    return hudBox;
  }

  // ---------------------------------------------------------------------------
  // Drawing
  // ---------------------------------------------------------------------------
  var MAX_PIXELS = 640000;      // a full-window phone at 2x is 1.2 million: too many to fill at 60fps
  function resize(w, h, dpr) {
    var canvas = shell ? shell.canvas : root.querySelector("canvas");
    // a big canvas (a phone gone full-window) draws at a little under 2x
    if (w * h * dpr * dpr > MAX_PIXELS) {
      dpr = Math.max(1, Math.sqrt(MAX_PIXELS / (w * h)));
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      dpr = canvas.width / w;
    }
    W = w; H = h; DPR = dpr;
    ctx = canvas.getContext("2d");
    hudBox = null;
    cam.snap = true;
    stars = [];
    for (var i = 0; i < 70; i++) stars.push({ u: Math.random(), v: Math.random(), s: Math.random(), k: Math.random() < 0.12 });
  }

  var jolt = { x: 0, y: 0 };
  function world(c) {
    var sx = jolt.x, sy = jolt.y;
    c.setTransform(DPR * cam.z, 0, 0, DPR * cam.z, DPR * (W / 2 - cam.x * cam.z + sx), DPR * (H / 2 + cam.y * cam.z + sy));
    A.setView(DPR, cam.z);
  }

  function render(dt) {
    if (!ctx || !run) return;
    vis += dt || 0;
    var state = shell.state();
    if (!noticed && (state === "countdown" || state === "playing")) { noticed = true; notice(); }
    if (state === "paused") held = false;
    if (!hudEls) { buildHud(); paintHud(0); }
    if (++hudAge > 60) { hudBox = null; hudAge = 0; }
    frame(dt);
    jolt.x = jolt.y = 0;
    if (shake > 0 && !shell.reduceMotion) { jolt.x = (Math.random() - 0.5) * 7 * shake; jolt.y = (Math.random() - 0.5) * 7 * shake; }
    var c = ctx, s = stage();
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    c.fillStyle = T.ink;
    c.fillRect(0, 0, W, H);
    drawSky(c);
    world(c);
    if (s.scene === "sea") drawSea(c);
    else if (s.scene === "party") drawParty(c);
    else drawMars(c);
    drawStreaks(c);
    drawPuffs(c, true);
    drawRocket(c);
    drawWreck(c);
    drawDebris(c);
    drawPuffs(c, false);
    drawFx(c);
    if (s.scene === "sea") drawNearSea(c);
    // screen things: the tag, the arrow, the bubbles, the receipt
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    var placed = [];
    var rr = rocketRect();
    if (rr) placed.push(rr);
    drawTag(c, placed);
    drawLive(c, placed);
    var arrow = drawHint(c, placed);
    drawReceipt(c, placed);
    bubbles.forEach(function (b) { drawBubble(c, b, placed); });
    if (arrow) arrow();
  }

  // The night: stars and sparkles that drift a little with the camera
  function drawSky(c) {
    var s = stage();
    stars.forEach(function (p) {
      var x = ((p.u * W - cam.x * cam.z * 0.04) % W + W) % W, y = ((p.v * H * 0.75 + cam.y * cam.z * 0.04) % H + H) % H;
      if (p.k) A.sparkle(c, x, y, 3 + p.s * 3, p.s < 0.3 ? T.accent : T.paper);
      else { c.fillStyle = T.paper; c.globalAlpha = 0.35 + p.s * 0.5; c.fillRect(x, y, 1.6, 1.6); c.globalAlpha = 1; }
    });
    // the moon (an accent one), or on Mars a small sun and a far-off Earth
    var m = moonAt();
    var mx = m.x, my = m.y;
    var r = Math.min(W, H) * (s.scene === "mars" ? 0.03 : 0.045);
    c.save();
    c.translate(mx, my);
    A.setView(DPR, 1);
    A.oval(c, 0, 0, r, r, T.accent, 2, T.ink);
    if (s.scene !== "mars") {
      c.save(); c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.clip();
      c.fillStyle = A.dots(c, T.ink, 5); c.beginPath(); c.arc(r * 0.45, r * 0.1, r * 0.9, 0, Math.PI * 2); c.fill();
      c.restore();
    } else {
      A.oval(c, -r * 4.5, r * 2.2, 3.2, 3.2, T.paper);
      A.sparkle(c, -r * 4.5, r * 2.2, 7, T.paper);
    }
    c.restore();
  }

  function moonAt() {
    var mars = stage().scene === "mars";
    return { x: W * (mars ? 0.78 : 0.2) - cam.x * cam.z * 0.03, y: H * (mars ? 0.3 : 0.27) + cam.y * cam.z * 0.02 };
  }
  function drawSea(c) {
    var s = stage(), sw = swell(clock);
    var v = view();
    // the far sea, from the horizon down, with a halftone haze along it
    var hy = -(-SEA_DROP + 7);
    c.fillStyle = T.ink;
    c.fillRect(v.x0, hy, v.x1 - v.x0, v.y1 - hy + 2);
    c.fillStyle = A.dots(c, T.paper, 0.9);
    c.fillRect(v.x0, hy, v.x1 - v.x0, 1.4);
    A.ink(c, A.thick(0.1, 1), T.paper);
    c.beginPath(); c.moveTo(v.x0, hy); c.lineTo(v.x1, hy); c.stroke();
    waveRows(c, v, hy + 1.2, -(-SEA_DROP) - 0.6, 5);
    // the boat and him, then the barge
    var bx = boatX();
    var by = seaY(bx, clock);
    c.save();
    c.translate(bx, -by);
    c.rotate(Math.sin(clock * 1.7 + 1) * 0.03 + (seaY(bx + 2, clock) - seaY(bx - 2, clock)) * -0.2);
    A.boat(c, {});
    c.save(); c.translate(2.2, A.BOAT_DECK + 0.1);
    drawBoss(c);
    c.restore();
    c.restore();
    c.save();
    c.translate(0, -sw.y);
    c.rotate(-sw.roll);
    A.barge(c, { w: s.deck, name: s.barge, wind: windAt(clock, 8) * run.mods.windK, t: vis, scorch: st.scorch, cross: crossX() });
    c.restore();
    bargeName(c, s);
  }
  function drawNearSea(c) {
    var v = view();
    waveRows(c, v, -(-SEA_DROP) + 0.4, v.y1, 4, true);
  }
  // rows of little paper waves, following the swell
  function waveRows(c, v, yTop, yBot, rows, near) {
    var s = stage();
    if (near) {
      // the sea in front of the hull
      c.beginPath();
      c.moveTo(v.x0, v.y1 + 2);
      for (var x = v.x0; x <= v.x1 + 2; x += 1.5) c.lineTo(x, -seaY(x, clock));
      c.lineTo(v.x1 + 2, v.y1 + 2);
      c.closePath();
      c.fillStyle = T.ink;
      c.fill();
      A.ink(c, A.thick(0.12, 1.2), T.paper);
      c.beginPath();
      for (var x2 = v.x0; x2 <= v.x1 + 2; x2 += 1.5) { if (x2 === v.x0) c.moveTo(x2, -seaY(x2, clock)); else c.lineTo(x2, -seaY(x2, clock)); }
      c.stroke();
    }
    var w = Math.PI * 2 / s.period;
    for (var i = 0; i < rows; i++) {
      var k = (i + 0.5) / rows;
      var y = yTop + (yBot - yTop) * k;
      var gap = 3 + k * 4, len = 0.8 + k * 1.4;
      A.ink(c, A.thick(0.08 + k * 0.08, 1), T.paper);
      c.globalAlpha = near ? 0.9 : 0.4 + k * 0.4;
      c.beginPath();
      var off = (i * 1.7 + vis * (0.4 + k)) % gap;
      for (var x3 = Math.floor(v.x0 / gap) * gap - off; x3 < v.x1 + gap; x3 += gap) {
        var bob = s.swell * Math.sin(w * clock + st.swellPhase - x3 * 0.07) * (near ? 1 : 0.4);
        var xx = x3 + (i % 2) * gap * 0.5;
        c.moveTo(xx - len, y - bob);
        c.quadraticCurveTo(xx, y - bob - len * 0.45, xx + len, y - bob);
      }
      c.stroke();
      c.globalAlpha = 1;
    }
  }
  // The barge's name on its hull, in screen pixels, if it can be 12px
  function bargeName(c, s) {
    var sw = swell(clock);
    var p = toScreen(-s.deck / 2 + s.deck * 0.3, sw.y - 1.9);
    var size = 1.0 * cam.z;
    if (size < 12) return;
    c.save();
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    c.font = Math.min(size, 20) + "px " + T.display;
    c.textAlign = "center"; c.textBaseline = "middle";
    c.fillStyle = T.paper;
    c.fillText(s.barge.toUpperCase(), p.x, p.y);
    c.restore();
    world(c);
  }

  function drawParty(c) {
    var v = view(), P = A.PARTY;
    // his house, set back behind the lawn: long, low, glass along the front
    var hx0 = -8, hx1 = 20, hy = -9.5;
    c.fillStyle = T.ink;
    c.fillRect(hx0, hy, hx1 - hx0, -hy);
    c.fillStyle = A.dots(c, T.paper, 0.9);
    c.fillRect(hx0, hy, hx1 - hx0, 1.2);
    A.ink(c, A.thick(0.12, 1), T.paper);
    c.strokeRect(hx0, hy, hx1 - hx0, -hy);
    c.strokeRect(hx0 - 1, hy - 0.6, hx1 - hx0 + 2, 0.6);
    for (var wx = hx0 + 1.2; wx < hx1 - 1.5; wx += 3.4) {
      var lit = ((wx * 7) | 0) % 3 === 0;
      c.fillStyle = lit ? T.accent : T.ink;
      c.fillRect(wx, hy + 2.4, 2.6, 4.6);
      c.strokeRect(wx, hy + 2.4, 2.6, 4.6);
    }
    A.lawn(c, v.x0 - 2, v.x1 + 2, v.y1 + 2);
    A.party(c, { t: vis, lit: st.lit, cake: st.cake });
    // him on the terrace with his guests
    c.save(); c.translate(23.6, -1.4); drawBoss(c, -1); c.restore();
    guests.forEach(function (g) {
      c.save(); c.translate(g.x, -1.4); c.scale(0.95, 0.95);
      A.guest(c, { look: g.look, top: g.top, duck: clamp(g.duck, 0, 1), gaze: g.gaze, phone: g.phone && !g.cheer, mood: g.cheer ? "calm" : "cross" });
      c.restore();
    });
    balloons.forEach(function (b) {
      if (b.popped) {
        A.ink(c, A.thick(0.12, 1.2), T.paper);
        c.beginPath();
        for (var i = 0; i < 6; i++) {
          var a = i / 6 * Math.PI * 2, r0 = 0.6 + b.popped * 4, r1 = r0 + 0.8;
          c.moveTo(b.x + Math.cos(a) * r0, -b.y + Math.sin(a) * r0); c.lineTo(b.x + Math.cos(a) * r1, -b.y + Math.sin(a) * r1);
        }
        c.stroke();
      } else A.balloon(c, b.x, -b.y, 1.1, [T.red, T.paper, T.accent][b.c], vis + b.c);
    });
  }

  function drawMars(c) {
    var v = view();
    // far hills: dark, red halftone on black, so the ground in front reads as near
    c.fillStyle = T.ink;
    c.beginPath();
    c.moveTo(v.x0 - 2, -2);
    for (var x = Math.floor(v.x0 / 4) * 4 - 4; x < v.x1 + 4; x += 4) c.lineTo(x, -6 - 3 * Math.abs(Math.sin(x * 0.07 + 1)) - 2 * Math.sin(x * 0.19));
    c.lineTo(v.x1 + 2, -2);
    c.closePath();
    c.fill();
    c.save(); c.clip(); c.fillStyle = A.dots(c, T.red, 0.6); c.fillRect(v.x0 - 2, -16, v.x1 - v.x0 + 4, 16); c.restore();
    A.ink(c, A.thick(0.1, 1), T.red);
    c.beginPath();
    for (var x2 = Math.floor(v.x0 / 4) * 4 - 4; x2 < v.x1 + 4; x2 += 4) {
      var hy2 = -6 - 3 * Math.abs(Math.sin(x2 * 0.07 + 1)) - 2 * Math.sin(x2 * 0.19);
      if (x2 === Math.floor(v.x0 / 4) * 4 - 4) c.moveTo(x2, hy2); else c.lineTo(x2, hy2);
    }
    c.stroke();
    A.mars(c, st.mars, v.x0 - 2, v.x1 + 2, v.y1 + 2);
    A.flag(c, -13, -marsY(st.mars.ground, -13));
    A.sign(c, -16.5, -marsY(st.mars.ground, -16.5), 6.2);
    signText(c, -16.5, marsY(st.mars.ground, -16.5) + 3.7, "Private planet", 5.6);
    A.dish(c, 13, -marsY(st.mars.ground, 13), vis);
  }
  function signText(c, x, y, words, w) {
    var p = toScreen(x, y);
    var size = Math.min(1.1 * cam.z, w * cam.z / (words.length * 0.55));
    if (size < 12) return;
    c.save();
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    c.font = size + "px " + T.display;
    c.textAlign = "center"; c.textBaseline = "middle";
    c.fillStyle = T.ink;
    c.fillText(words.toUpperCase(), p.x, p.y + 1);
    c.restore();
    world(c);
  }

  function drawBoss(c, face) {
    var f = face || -1;
    var p = boss.pose;
    A.billionaire(c, { pose: p, mood: boss.mood, face: f, gaze: p === "shout" ? 0 : 0.7, soot: false });
  }

  // the part of the world the camera can see, in world units (y down)
  function view() {
    var hw = W / 2 / cam.z, hh = H / 2 / cam.z;
    return { x0: cam.x - hw - 2, x1: cam.x + hw + 2, y0: -cam.y - hh - 2, y1: -cam.y + hh + 2 };
  }

  function drawRocket(c) {
    var r = rk;
    if (!r || r.gone) return;
    c.save();
    c.translate(r.x, -r.y);
    c.rotate(r.a);
    A.rocket(c, { k: RK, legs: r.legs, flame: r.thrust, t: vis, mods: run.mods, squash: r.squash, wreck: r.state !== "fly" && r.state !== "landed" });
    c.restore();
  }

  function drawWreck(c) {
    if (!wreck) return;
    var w = wreck, lw = A.thick(0.14, 1.2);
    c.save();
    c.translate(w.x, -w.y - 1.4);
    c.rotate(w.a);
    c.scale(1, 0.92);
    A.rocket(c, { k: RK * 0.92, legs: 0.3, flame: 0, t: vis, mods: run.mods, wreck: true });
    c.restore();
    if (!w.dust) {
      // the fire along the wreck, dying down
      var n = 5, life = clamp(1 - (w.t - 1.6) / 1.2, 0.25, 1);
      for (var i = 0; i < n; i++) {
        var fx0 = w.x + w.side * (1.6 + i * 2.3);
        A.fire(c, fx0, -w.y - 0.6, (3.2 + Math.sin(vis * 7 + i * 2) * 0.8 + (i === 2 ? 1.6 : 0)) * life * (shell.reduceMotion ? 1 : 1), 1.1 + (i % 2) * 0.4, vis + i, lw);
      }
    }
  }

  function drawDebris(c) {
    var lw = A.thick(0.12, 1.1);
    debris.forEach(function (d) {
      if (d.sunk) return;
      c.save();
      c.translate(d.x, -d.y);
      c.rotate(d.a);
      if (d.what === "nose") {
        c.beginPath(); c.moveTo(0, -1.7); c.quadraticCurveTo(1.2, -0.6, 1.3, 0.6); c.lineTo(-1.3, 0.6); c.quadraticCurveTo(-1.2, -0.6, 0, -1.7); c.closePath();
        c.fillStyle = T.red; c.fill(); A.ink(c, lw); c.stroke();
      } else if (d.what === "fin") {
        c.beginPath(); c.moveTo(-0.8, -1.2); c.lineTo(1.2, 1); c.lineTo(-0.6, 0.5); c.closePath();
        c.fillStyle = T.red; c.fill(); A.ink(c, lw); c.stroke();
      } else {
        A.ink(c, lw * 3); c.beginPath(); c.moveTo(-1.6, 0); c.lineTo(1.6, 0); c.stroke();
        A.ink(c, lw, T.paper); c.stroke();
      }
      c.restore();
    });
  }

  function drawFx(c) {
    var lw = A.thick(0.14, 1.2);
    fx.forEach(function (f) {
      var k = f.t / f.life;
      if (f.kind === "burst") {
        var r = (shell.reduceMotion ? 6 : 2 + 9 * Math.sqrt(k)) * (1 - k * 0.3);
        c.globalAlpha = 1 - Math.max(0, k - 0.6) / 0.4;
        A.burst(c, f.x, -f.y, r, 9, f.t, lw);
        c.globalAlpha = 1;
      } else if (f.kind === "drop") {
        A.oval(c, f.x, -f.y, f.r, f.r * 1.3, T.paper, lw * 0.6);
      } else if (f.kind === "ring") {
        c.globalAlpha = 1 - k;
        A.ink(c, lw * (f.big ? 2 : 1), T.paper);
        var rr = f.big ? 2 + Math.sqrt(k) * 16 : 1 + k * 7;
        c.beginPath(); c.ellipse(f.x, -f.y, rr, rr * (f.big ? 0.22 : 0.2) + 0.4, 0, 0, Math.PI * 2); c.stroke();
        c.globalAlpha = 1;
      }
    });
  }

  function drawPuffs(c, back) {
    puffs.forEach(function (p) {
      if (p.back !== back) return;
      var k = p.t / p.life;
      A.puff(c, p.x, -p.y, p.r, 1 - k * k, p.dust ? T.accent : T.paper, p.dust ? T.red : T.accent);
    });
  }

  function drawStreaks(c) {
    if (!streaks.length) return;
    A.ink(c, A.thick(0.1, 1.2), T.paper);
    streaks.forEach(function (s) {
      var k = s.t / s.life;
      c.globalAlpha = Math.sin(k * Math.PI) * 0.7;
      c.beginPath();
      c.moveTo(s.x, -s.y);
      c.lineTo(s.x - s.v * 0.35, -s.y);
      c.stroke();
    });
    c.globalAlpha = 1;
  }

  // The rocket's box on screen, so words keep off it
  function rocketRect() {
    if (!rk || rk.gone) return null;
    var a = toScreen(rk.x - 4, rk.y + RH + 1), b = toScreen(rk.x + 4, rk.y - 1);
    return { x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y };
  }

  // A tag beside the rocket: its speed, or what's wrong
  function drawTag(c, placed) {
    if (phase !== "fly" || !rk || rk.state !== "fly" || !tag || shell.state() !== "playing") return;
    var p = toScreen(rk.x, rk.y + RH * 0.5);
    var size = clamp(Math.min(W, H) * 0.036, 12, 15);
    c.font = size + "px " + T.display;
    var text = tag.word.toUpperCase(), tw = c.measureText(text).width;
    var w = tw + size * 0.9, h = size * 1.45;
    var side = p.x > W * 0.62 ? -1 : 1;
    var x = side > 0 ? p.x + 3.6 * cam.z + 6 : p.x - 3.6 * cam.z - 6 - w;
    x = clamp(x, 4, W - w - 4);
    var y = clamp(p.y - h / 2, 8, H - h - 8);
    A.rrect(c, x, y, w, h, 4);
    c.fillStyle = tag.bad ? T.red : T.paper;
    c.fill();
    c.lineWidth = 2; c.strokeStyle = T.ink; c.stroke();
    c.fillStyle = tag.bad ? T.paper : T.ink;
    c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText(text, x + w / 2, y + h / 2 + 1);
    placed.push({ x: x, y: y, w: w, h: h });
  }

  // His Live tag, with the viewers, or Off air
  function bossAt() {
    var s = stage();
    if (s.scene === "sea") {
      var bx = boatX(), by = seaY(bx, clock);
      return toScreen(bx + 2.2, by - A.BOAT_DECK + 6.2);
    }
    if (s.scene === "party") return toScreen(23.6, 1.4 + 6.2);
    return toScreen(13, marsY(st.mars.ground, 13) + 4.6);
  }
  var liveTop = null;
  function drawLive(c, placed) {
    var s = stage();
    var p = bossAt();
    var size = 12;
    c.font = size + "px " + T.display;
    var text = s.scene === "mars" ? "Earth: 14 minutes ago" : boss.air ? "Live " + boss.viewers.toFixed(1) + "m" : "Off air";
    text = text.toUpperCase();
    var tw = c.measureText(text).width, w = tw + 12 + (boss.air && s.scene !== "mars" ? 8 : 0), h = 18;
    var x = clamp(p.x - w / 2, 4, W - w - 4), y = clamp(p.y - h - 4, 4, H - h - 4);
    A.rrect(c, x, y, w, h, 3);
    var live = boss.air && s.scene !== "mars";
    c.fillStyle = live ? T.red : T.paper;
    c.fill();
    c.lineWidth = 1.5; c.strokeStyle = T.ink; c.stroke();
    c.fillStyle = live ? T.paper : T.ink;
    c.textAlign = "left"; c.textBaseline = "middle";
    if (live) {
      c.beginPath(); c.arc(x + 8, y + h / 2, 3, 0, Math.PI * 2);
      if (Math.floor(vis * 2) % 2 || shell.reduceMotion) c.fill();
    }
    c.fillText(text, x + (live ? 15 : 6), y + h / 2 + 1);
    placed.push({ x: x, y: y, w: w, h: h, live: true });
    liveTop = { x: x + w / 2, y: y };
  }

  function drawHint(c, placed) {
    if (!hint || shell.state() !== "playing") return null;
    var p;
    if (hint.at === "rocket") { if (!rk || rk.gone) return null; p = toScreen(rk.x, rk.y + RH + 1.5); }
    else if (hint.at === "cross") {
      var u = under(crossX(), clock);
      p = toScreen(crossX(), u.y + 1.2);
    } else if (hint.at === "sock") {
      var sw = swell(clock);
      p = toScreen(-stage().deck / 2 + 1.8, sw.y + 6.6);
    }
    if (!p) return null;
    var bob = shell.reduceMotion ? 0 : -Math.abs(Math.sin(vis * 4)) * 5;
    var x = clamp(p.x, 40, W - 40), y = Math.max(44, p.y - 4);
    placed.push({ x: x - 50, y: y - 46, w: 100, h: 50 });
    return function () { A.arrow(c, x, y + bob, hint.word, 1); };
  }

  // A speech bubble, drawn in screen pixels so it stays readable on a phone
  function drawBubble(c, b, placed) {
    var spot;
    if (b.who === "boss" || b.who === "earth") spot = liveTop || bossAt();
    else if (b.who === "guest" && b.g) spot = toScreen(b.g.x, 1.4 + 6.4);
    if (!spot) return;
    var ax = spot.x, ay = spot.y;
    var size = clamp(Math.min(W, H) * 0.04, 12, N.flags.clip ? 18 : 16);
    c.font = size + "px " + T.display;
    var words = b.text.toUpperCase().split(" "), lines = [""];
    var maxChars = W < 420 ? 18 : 24;
    words.forEach(function (w) {
      var line = lines[lines.length - 1] ? lines[lines.length - 1] + " " + w : w;
      if (line.length > maxChars && lines[lines.length - 1]) lines.push(w); else lines[lines.length - 1] = line;
    });
    var tw = 0;
    lines.forEach(function (l) { tw = Math.max(tw, c.measureText(l).width); });
    var pad = size * 0.5, lh = size * 1.02;
    var bw = tw + pad * 2, bh = lines.length * lh + pad * 1.3;
    var boxes = hudBoxes();
    var want = { x: clamp(ax - bw / 2, 4, W - bw - 4), y: ay - bh - 12 };
    function topAt(x) {
      var t = 6;
      boxes.forEach(function (r) { if (x < r.right + 4 && x + bw > r.left - 4) t = Math.max(t, r.bottom + 4); });
      return t;
    }
    function overlap(x, y) {
      var sum = 0;
      placed.forEach(function (o) {
        var w = Math.min(x + bw + 4, o.x + o.w + 4) - Math.max(x, o.x), h = Math.min(y + bh + 4, o.y + o.h + 4) - Math.max(y, o.y);
        if (w > 0 && h > 0) sum += w * h;
      });
      return sum;
    }
    var spots = [want, { x: want.x - bw * 0.6, y: want.y }, { x: want.x + bw * 0.6, y: want.y }, { x: want.x, y: want.y - bh - 8 }];
    placed.forEach(function (o) {
      spots.push({ x: want.x, y: o.y - bh - 6 }, { x: o.x - bw - 6, y: want.y }, { x: o.x + o.w + 6, y: want.y });
    });
    var best = null;
    spots.forEach(function (p) {
      var x = clamp(p.x, 4, W - bw - 4);
      var y = clamp(p.y, topAt(x), H - bh - 4);
      var cost = overlap(x, y) * 50 + Math.abs(x - want.x) + Math.abs(y - want.y) * 1.2;
      if (!best || cost < best.cost) best = { x: x, y: y, cost: cost };
    });
    var bx = best.x, by = best.y;
    placed.push({ x: bx, y: by, w: bw, h: bh });
    var pop = shell.reduceMotion ? 1 : clamp(b.t * 8, 0, 1);
    c.globalAlpha = Math.min(pop, clamp((b.life - b.t) * 3, 0, 1));
    var r = Math.min(8, bh / 2);
    c.beginPath();
    c.moveTo(bx + r, by);
    c.arcTo(bx + bw, by, bx + bw, by + bh, r);
    c.arcTo(bx + bw, by + bh, bx, by + bh, r);
    if (by + bh < ay - 4) {
      var tx = clamp(ax, bx + 12, bx + bw - 12);
      c.lineTo(tx + 6, by + bh); c.lineTo(clamp(ax, tx - 8, tx + 8), Math.min(ay - 2, by + bh + size * 0.9)); c.lineTo(tx - 5, by + bh);
    }
    c.arcTo(bx, by + bh, bx, by, r);
    c.arcTo(bx, by, bx + bw, by, r);
    c.closePath();
    c.fillStyle = T.paper;
    c.fill();
    c.lineWidth = 2.2;
    c.lineJoin = "round";
    c.strokeStyle = T.ink;
    c.stroke();
    if (b.offair) {
      // off air: a red rule along the top, so it's clearly not for the stream
      c.fillStyle = T.red;
      c.fillRect(bx + 3, by + 2, bw - 6, 3);
    }
    c.fillStyle = T.ink;
    c.textAlign = "center";
    c.textBaseline = "top";
    lines.forEach(function (l, i) { c.fillText(l, bx + bw / 2, by + pad * 0.75 + i * lh + (b.offair ? 2 : 0)); });
    c.globalAlpha = 1;
  }

  // What a landing paid, beside the rocket, for a moment
  function drawReceipt(c, placed) {
    if (!receipt || receipt.t > 2.3 || !rk) return;
    var k = receipt.t;
    var size = clamp(Math.min(W, H) * 0.034, 12, 14);
    var rows = receipt.rows;
    var w = size * 8.6, lh = size * 1.25;
    var h = (rows.length + 1) * lh + size * 0.9 + (receipt.mult ? lh : 0);
    var p = toScreen(rk.onX != null ? rk.onX : rk.x, rk.y + RH * 0.75);
    var side = p.x < W * 0.5 ? 1 : -1;
    var x = side > 0 ? p.x + 4.8 * cam.z + 8 : p.x - 4.8 * cam.z - 8 - w;
    if (x < 4 || x + w > W - 4) x = side > 0 ? p.x - 4.8 * cam.z - 8 - w : p.x + 4.8 * cam.z + 8;
    x = clamp(x, 4, W - w - 4);
    var y = clamp(p.y - h / 2 - (shell.reduceMotion ? 0 : k * 6), 8, H - h - 8);
    c.globalAlpha = clamp(k * 6, 0, 1) * clamp((2.3 - k) * 3, 0, 1);
    A.rrect(c, x, y, w, h, 3);
    c.fillStyle = T.paper; c.fill();
    c.lineWidth = 2; c.strokeStyle = T.ink; c.stroke();
    c.fillStyle = T.accent; c.fillRect(x + 1, y + 1, w - 2, 4);
    c.font = size + "px " + T.display;
    c.textBaseline = "middle";
    rows.forEach(function (row, i) {
      var ry = y + size * 0.7 + lh * (i + 0.5);
      c.fillStyle = T.ink;
      c.textAlign = "left"; c.fillText(row[0].toUpperCase(), x + size * 0.6, ry);
      c.textAlign = "right"; c.fillText(String(row[1]), x + w - size * 0.6, ry);
    });
    var yy = y + size * 0.7 + lh * rows.length;
    if (receipt.mult) {
      c.textAlign = "left"; c.fillText(receipt.mult.toUpperCase(), x + size * 0.6, yy + lh * 0.5);
      yy += lh;
    }
    c.fillRect(x + size * 0.5, yy + 1, w - size, 1.5);
    c.textAlign = "left"; c.fillText("Total".toUpperCase(), x + size * 0.6, yy + lh * 0.6);
    c.textAlign = "right"; c.fillText("+" + fmt(receipt.total), x + w - size * 0.6, yy + lh * 0.6);
    c.globalAlpha = 1;
    placed.push({ x: x, y: y, w: w, h: h });
  }

  // The stage's notice goes up with the countdown and comes down soon after Go
  function notice() {
    var s = stage(), title = "Stage " + (run.stage + 1) + ": " + s.name;
    var go = 250 + 3 * (shell.reduceMotion ? 650 : 700);
    if (N.flags.clip) { shell.brief({ title: title, ms: go }); return; }
    var touch = touching();
    var text = {
      barge: touch ? "Hold Thrust to slow down. The arrows lean the rocket. Land on the cross, slowly and upright."
                   : "Hold Up or Space to slow down. Left and right lean the rocket. Land on the cross, slowly and upright.",
      weather: "Wind, stronger higher up. The streaks and the windsock show which way. Lean into it. A smaller barge.",
      swell: "The deck rides the waves. Land as it sinks, not as it rises. Smaller again.",
      party: "His own lawn. Land on the cross, not the marquee or the pool. Balloons give you a shove.",
      mars: "A third of the gravity and no air to slow you, coming in sideways. Worth double. Nobody is watching."
    }[s.id];
    shell.brief({ title: title, text: text, ms: go + 1100 });
  }

  // ---------------------------------------------------------------------------
  // The mouse: held down anywhere on the open screen fires the engine
  // ---------------------------------------------------------------------------
  root.addEventListener("pointerdown", function (e) {
    var s = shell && shell.state();
    if (s !== "playing" && s !== "countdown") return;
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    if (e.target && e.target.closest && e.target.closest(".kit-panel, .kit-bar, .kit-pad, button, a")) return;
    held = true;
    heldId = e.pointerId;
    lastMode = "mouse";
  });
  function letGo(e) { if (e.pointerId === heldId) { held = false; heldId = null; } }
  window.addEventListener("pointerup", letGo);
  window.addEventListener("pointercancel", letGo);
  window.addEventListener("blur", function () { held = false; heldId = null; });

  // ---------------------------------------------------------------------------
  // Start it up
  // ---------------------------------------------------------------------------
  shell = N.createGame({
    root: root,
    slug: "scrubbed",
    title: "Scrubbed",
    stamp: "Good data",
    tilt: -6,
    note: "Eight reusable rockets, five stages, one barge that keeps getting smaller. He'll call it a success either way.",
    hints: {
      keys: "Up, W or Space to thrust. Left and right, or A and D, to lean. Or hold the mouse button to thrust, and it leans towards the pointer. P to pause.",
      touch: "Hold Thrust on the right. Lean with the arrows on the left."
    },
    againLabel: "Fly again",
    aim: true,
    keys: {
      up: ["ArrowUp", "KeyW", "Space"], down: ["ArrowDown", "KeyS"], left: ["ArrowLeft", "KeyA"], right: ["ArrowRight", "KeyD"],
      action: []
    },
    pad: { up: [0, 7, 5] },
    daily: true,
    fullOnTouch: true,
    pitch: "Land a billionaire's reusable rocket on a barge. He'll call it a success either way.",
    touch: [
      { key: "left", label: "Lean left", icon: "left", side: "left" },
      { key: "right", label: "Lean right", icon: "right", side: "left" },
      { key: "up", label: "Thrust", icon: "Thrust", side: "right" }
    ],
    reset: reset,
    update: function (dt, input) { update(dt, input); },
    render: function (dt) { render(dt); },
    resize: resize
  });
  T = shell.tokens;
  A.init(T);

  // The canvas font may arrive after the first frame
  if (document.fonts && document.fonts.load) document.fonts.load("12px " + T.display);

  if (DEBUG) {
    window.__scrubbed = {
      state: function () { return shell.state(); },
      run: function () { return run; },
      talk: function () { return bubbles.map(function (b) { return { who: b.who, text: b.text, offair: b.offair, t: b.t }; }); },
      view: function () {
        if (!rk || !run) return null;
        var u = under(rk.x, clock), cu = under(crossX(), clock), m = run.mods, s = stage();
        var sp = toScreen(rk.x, rk.y + RH * 0.5);
        return {
          phase: phase, stage: run.stage, booster: st.booster, clock: clock,
          x: rk.x, y: rk.y, vx: rk.vx, vy: rk.vy, a: rk.a, fuel: rk.fuel, cap: rk.cap, legs: rk.legs, state: rk.state,
          h: rk.y - u.y, hCross: rk.y - cu.y, surfVy: cu.vy, surfAngle: cu.angle, cross: crossX(),
          g: s.g, drag: s.drag, push: THRUST * m.thrust, turn: TURN * m.turn, wind: windAt(clock, rk.y - u.y) * m.windK,
          safeVy: SAFE_VY * m.safeVy, safeTilt: SAFE_TILT * m.safeTilt, scene: s.scene, deck: s.deck || 18,
          screen: { x: sp.x, y: sp.y, w: W, h: H }, reach: MOUSE_REACH, tag: tag && tag.word, score: run.score, landed: run.landed, flown: run.flown
        };
      }
    };
  }
})();
