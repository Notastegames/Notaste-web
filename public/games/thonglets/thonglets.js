// Thonglets: tiny creatures in thongs who think you're their god.
// You are a glowing hand. They follow you anywhere, including into a pit.
// Lead them to the brick pile, then to the building site, and they'll build
// you a statue. They've never seen you, so the statue is a guess.
//
// A run is seven stages and then Judgement Day. Each stage brings a new rival
// god (rivals.js) and a bigger statue to build; between stages you pick a
// commandment, which helps and costs in equal measure. Fail a stage and the
// run is over. "Today's run" gives everyone the same fields and offers.
//
// Built on the shared kit (/games/kit/kit.js): the intro, the screens,
// controls, sound and saving. sprites.js draws the characters. This file is
// the field, the crowd, the stages, the statue and the score.
//
// The comedy is blind faith and what it costs the faithful, never anyone's
// body: they're cartoon beans in thongs. The rivals are invented stand-ins for
// broken things, never real people or brands.
(function () {
  "use strict";

  var N = window.Notaste;
  var S = window.ThongletSprites;
  var R = window.ThongletRivals;
  var root = document.getElementById("game-root");
  if (!N || !S || !R || !root) return;

  var params = new URLSearchParams(window.location.search);
  var AUTOPILOT = params.has("autopilot"); // for testing: the computer plays god
  var DEBUG = params.has("debug");
  var SPEED = DEBUG ? Math.max(1, Math.min(8, parseInt(params.get("speed"), 10) || 1)) : 1;
  var FIRST = DEBUG ? Math.max(0, Math.min(7, (parseInt(params.get("stage"), 10) || 1) - 1)) : 0;

  // ---------------------------------------------------------------------------
  // Tuning. The field is VIEW world units across the screen's short side.
  // ---------------------------------------------------------------------------
  var VIEW = 400;
  var START_FOLK = 30;
  var MAX_FOLK = 140;
  var CONVERTS = 4;                  // new believers each time the statue grows
  var FOLLOW_R = 190;                // how far away they can still see your light
  var LIGHT_SPEED = 250;             // keys and pad
  var LIGHT_CHASE = 620;             // mouse and finger: the light catches up this fast
  var WALK = 105;
  var WALK_LOADED = 82;              // carrying a brick
  var QUARRY_R = 44;
  var SITE_R = 52;
  var RESCUE_R = 58;                 // bring your light this close to snap them out of anything
  var SMITE_CD = 6;
  var SMITE_R = 50;
  var BLESS_CD = 12;
  var BLESS_TIME = 4;
  var FEE_EVERY = 5;                 // the Priest keeps every fifth brick
  var DEVOTION_PER = 0.006;          // each one smitten makes them love you a bit more
  var DEVOTION_MAX = 2.5;
  var TEETER = 0.6;                  // how long they wobble on the edge before following you in
  var EXTENSION = 25;                // seconds added, once a run, to a stage that's nearly built
  var JUDGEMENT_TIME = 60;           // Judgement Day starts with this long
  var JUDGEMENT_TIER = 30;           // ...the first tier of bricks adds
  var JUDGEMENT_GROW = 1.35;         // ...each tier after needs this much more than the last
  var JUDGEMENT_BONUS = 12;          // ...this many seconds

  // The run. Each stage brings its rival god, and some bring back an old one.
  var STAGES = [
    { rival: "feed", target: 100, time: 90, pits: 1, plinth: "Our god",
      clear: "The Thonglets have never been happier. They've never been anything else." },
    { rival: "landlord", target: 140, time: 95, pits: 1, plinth: "Still our god", old: 1,
      clear: "The Landlord would like to discuss the statue's rent." },
    { rival: "rocket", target: 180, time: 100, pits: 1, plinth: "Our god again", old: 1,
      clear: "Some of them are in space now. They send their love. It takes a while." },
    { rival: "loudspeaker", target: 240, time: 105, pits: 2, plinth: "Our god. Louder.",
      clear: "Nobody remembers what the shouting was about. Everyone agrees with it." },
    { rival: "sea", target: 290, time: 110, pits: 1, plinth: "Our god. Wetter.", old: 1,
      clear: "The statue's feet are wet. Nobody's mentioned it." },
    { rival: "office", target: 300, time: 115, pits: 1, plinth: "Our god. Approved.", old: 1,
      clear: "Permit filed. The statue is now officially a statue." },
    { rival: "all", target: 360, time: 125, pits: 1, plinth: "All of our god",
      clear: "Everything happened at once. The statue survived. Some of them did too." },
    { rival: "judgement", target: Infinity, time: JUDGEMENT_TIME, pits: 1, plinth: "Judge us" }
  ];
  var LAST = 6;                      // stage index of the seventh and final stage

  // Commandments: something good, something bad, in that order
  var COMMANDMENTS = [
    { id: "hurry", label: "Thou shalt hurry", detail: "They walk faster. They also fall over.",
      apply: function (m) { m.walk *= 1.2; m.trip += 0.05; } },
    { id: "multiply", label: "Thou shalt multiply", detail: "Ten new believers now. The Priest takes every fourth brick.",
      apply: function (m) { m.feeEvery = Math.max(2, m.feeEvery - 1); for (var i = 0; i < 10; i++) addFolk(G.place.start.x + rand(-40, 40), G.place.start.y + rand(-40, 40)); } },
    { id: "two", label: "Thou shalt carry two", detail: "Every brick counts double. They walk slower.",
      apply: function (m) { m.load = 2; m.walk *= 0.82; } },
    { id: "smite", label: "Thou shalt smite freely", detail: "Smite recharges faster and hits wider. Mind your own.",
      apply: function (m) { m.smiteCd *= 0.6; m.smiteR *= 1.3; } },
    { id: "loved", label: "Thou shalt be loved", detail: "Devotion up by half. The Priest takes every third brick.",
      apply: function (m) { G.devotion = Math.min(DEVOTION_MAX, G.devotion + 0.5); m.feeEvery = Math.min(m.feeEvery, 3); } },
    { id: "weekends", label: "Thou shalt work weekends", detail: "Fifteen more seconds a stage. Half as many new believers.",
      apply: function (m) { m.time += 15; m.converts *= 0.5; } },
    { id: "lookup", label: "Thou shalt look up", detail: "Rivals pull half as hard. Your light doesn't reach as far.",
      apply: function (m) { m.lure *= 0.5; m.reach *= 0.85; } },
    { id: "pit", label: "Thou shalt not fear the pit", detail: "Half of those who fall climb back out. Devotion down a bit.",
      apply: function (m) { m.pitSave = 0.5; G.devotion = Math.max(1, G.devotion - 0.2); } },
    { id: "questions", label: "Thou shalt not ask questions", detail: "No more Priest. No more fees. Nobody holds the crowd together.",
      apply: function (m) { m.feeEvery = Infinity; m.noPriest = true; if (G.priest) G.priest.state = "gone"; } },
    { id: "bless", label: "Thou shalt bless more", detail: "Bless recharges twice as fast. Smite slower.",
      apply: function (m) { m.blessCd *= 0.5; m.smiteCd *= 1.3; } }
  ];

  // ---------------------------------------------------------------------------
  // What they say. Crude is fine; cruel isn't (DESIGN.md, section 2).
  // ---------------------------------------------------------------------------
  var PRAYERS = ["Is it statue time.", "I've done a little shrine.", "Bless this thong.", "Lord, it's ridden up again.",
                 "I named my bum after you.", "Is god watching me wee.", "I'd die for you. Please don't check.",
                 "We love you. Do you love us. Doesn't matter.", "Make the bricks lighter. Or me stronger.",
                 "I've had a thong on since Tuesday.", "Can god see through thongs.", "Does god have a bum. Asking for me."];
  var CARRYING = ["Hnngh.", "It's for you.", "Lift with your bum.", "Brick. Heavy. Worth it.", "Mind my back.",
                  "This brick has your name on. I wrote it.", "My thong's taking the strain."];
  var LEFT_BEHIND = ["Come back.", "Where's god gone.", "Is this a test.", "We'll just wait here. Forever.", "Did we do something."];
  var SERMONS = ["Blessed are the bricklayers.", "Give generously. To me.", "The light is never wrong. Walk into it.",
                 "God wants you to work weekends.", "Thou shalt not ask questions.", "Thongs on, heads down.",
                 "Questions go in the box. The box is a bin.", "The meek shall inherit the pit."];
  var FEES = ["Admin fee.", "For the church. The church is me.", "Processing charge.", "Thank you for your donation."];
  var FALLING = ["Wheee.", "Worth it.", "Was this the plan.", "Following god."];
  var SMITTEN = ["Thank you.", "Again.", "I felt that in my thong.", "Where's my thong.", "Worth it.", "God noticed me."];
  var PUFFED = ["Who did that.", "Better out than in.", "That was a prayer.", "Not me. I'm holy.", "Offering accepted.",
                "Someone's been at the beans."];
  var BLESSED = ["I feel fast.", "My thong's glowing.", "Blessed. Very blessed.", "Is this what love feels like. Fast."];
  var JOINING = ["We saw the statue. We're in.", "Is that a bum. We're in.", "Nice statue. Where do we sign."];
  var TRIPPED = ["Fell over. For you.", "Ow. Worth it.", "Hurrying. Sorry."];
  var TIER_CALLS = ["Feet: approved", "Bum: in progress", "Thong: installed", "Head: pending"];
  var TEETERING = ["Oh.", "Is that a pit.", "Bit of a drop.", "God's in the pit. Fair enough.", "Are we sure."];
  var TRAILING = ["Following the trail.", "God went this way.", "Wait for us.", "Is god lost or are we."];
  var CHEERS = ["Our god.", "It's beautiful.", "It's got a bum.", "Look at it.", "Worth it."];

  // What each rival does and what to do about it, shown as a notice when it
  // first turns up. Smite stops the gods with faces; the Sea and the Planning
  // Office can't be smitten and have to be worked round.
  var BRIEFS = {
    feed: "A phone they can't stop staring at. Put your light on it and smite {how} to switch it off, or walk past to snap them out of it.",
    landlord: "Takes a brick off anyone carrying one. Smite him {how} and he drops the lot and leaves for a bit.",
    rocket: "Boards anyone near it, eight at a time, and takes them to space. Smite it {how} while it's boarding to scrub the launch.",
    loudspeaker: "Shouts, and everyone in earshot marches over. Smite it {how} to take the microphone away. Two pits this time.",
    sea: "Rises from the bottom all stage. They wade slowly, and too long in deep water takes them. You can't smite the sea: keep them up the field.",
    office: "No bricks go on the statue without a permit. Lead them into the queue until it's stamped. You can't smite paperwork.",
    all: "All of them at once, except the Office. Smite the ones with faces. Mind the water.",
    judgement: "No statue to finish. Every tier of bricks buys more time. Build until you're judged."
  };

  // ---------------------------------------------------------------------------
  // State. G is shared with the rivals (rivals.js).
  // ---------------------------------------------------------------------------
  var shell, ctx;
  var W = 1, H = 1, DPR = 1, SC = 1;   // CSS px, device ratio, CSS px per world unit
  var G = {
    T: null, WW: VIEW, WH: VIEW, place: {}, folk: [], priest: null, light: null, rivals: [], piles: [],
    mods: null, stage: 0, stageTime: 90, devotion: 1
  };
  var bubbles = [], fx = [];
  var bg = null, statueImg = null, hudEls = null;
  var rng = Math.random, seed = 0, offers = [];
  var clock = 0, timeLeft = 0, phase = "play";
  var bricks = 0, delivered = 0, stageLost = 0;
  var run = null;                      // the whole run's tallies
  var smiteWait = 0, blessWait = 0, prevAction = false, prevBless = false, shake = 0;
  var timers = {}, stepT = 0, announced = false, firstFall = true;
  var judgeTier = 0, judgeFrom = 0, judgeNext = 30;   // Judgement Day: which tier, and the bricks it starts and ends at
  var feeCalled = false, guide = null, lostSight = 0;
  var hintNow = null, hintSeen = 0, noticed = false;    // the arrow showing this frame, and how long the sea's has shown

  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  function fmt(n) { return Math.round(n).toLocaleString("en-GB"); }
  function alive(f) { return f.state !== "gone" && f.state !== "fall" && f.state !== "aboard"; }
  function stageInfo() { return STAGES[G.stage]; }
  function judgement() { return G.stage > LAST; }

  // A seeded random, so today's run is the same for everyone
  function mulberry(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function today() {
    var d = new Date();
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  }
  function todayLabel() {
    return new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long" });
  }

  // ---------------------------------------------------------------------------
  // Helpers the rivals use
  // ---------------------------------------------------------------------------
  var HELP = {
    RESCUE: RESCUE_R,
    rand: rand, pick: pick,
    say: function (who, text, force) { say(who, text, force); },
    callout: function (text) { shell.callout(text, { sound: false }); },
    steer: steer,
    nearPriest: function (f) { return G.priest && alive(G.priest) && f !== G.priest && dist(f, G.priest) < 90; },
    lose: lose,
    dropPile: function (x, y, n) { G.piles.push({ x: clamp(x, 20, G.WW - 20), y: clamp(y, 40, G.WH - 20), n: n }); },
    dots: function (c) { return accentDots(c); },
    roundRect: roundRect,
    calm: function () { return shell.reduceMotion; },
    sfx: null
  };

  // ---------------------------------------------------------------------------
  // The field: laid out fresh for every stage, from the run's seed
  // ---------------------------------------------------------------------------
  function far(p, list, d) {
    for (var i = 0; i < list.length; i++) {
      if (Math.hypot((p.x - list[i].x) * 1.25, p.y - list[i].y) < d) return false;
    }
    return true;
  }
  // Positions are shares of the field, so a rotated phone keeps the layout.
  // Pits and rivals keep their distance from each other and from the bricks,
  // the site and the start, so there's always a way round.
  function planStage() {
    var info = stageInfo();
    var kinds = rivalsFor(G.stage);
    var wet = kinds.indexOf("sea") >= 0;
    var left = rng() < 0.5;
    var plan = { kinds: kinds, wet: wet };
    plan.quarry = { x: left ? 0.13 : 0.87, y: wet ? 0.74 : 0.34 + rng() * 0.46 };
    // low enough that the statue's head clears the HUD
    plan.site = { x: left ? 0.8 : 0.2, y: wet ? 0.64 : 0.64 + rng() * 0.1 };
    plan.start = { x: left ? 0.25 : 0.75, y: 0.5 };
    var keep = [plan.quarry, plan.site, plan.start, { x: plan.site.x, y: plan.site.y - 0.22 }];
    plan.pits = [];
    var rivals = [];
    function find(x0, x1, y0, y1, dKeep, dPit, dRival) {
      var best = null, bestScore = -1;
      for (var n = 0; n < 120; n++) {
        var q = { x: x0 + rng() * (x1 - x0), y: y0 + rng() * (y1 - y0) };
        if (far(q, keep, dKeep) && far(q, plan.pits, dPit) && far(q, rivals, dRival)) return q;
        // otherwise remember the roomiest spot
        var room = Math.min(gap(q, keep) / dKeep, gap(q, plan.pits) / dPit, gap(q, rivals) / dRival);
        if (room > bestScore) { bestScore = room; best = q; }
      }
      return best;
    }
    for (var i = 0; i < info.pits; i++) plan.pits.push(find(0.32, 0.68, wet ? 0.24 : 0.28, wet ? 0.5 : 0.8, 0.26, 0.36, 1));
    plan.spots = {};
    kinds.forEach(function (k) {
      var s;
      if (k === "feed") s = find(0.28, 0.72, 0.3, 0.38, 0.36, 0.26, 0.28);
      else if (k === "landlord") s = find(0.3, 0.7, 0.26, 0.75, 0.2, 0.22, 0.2);
      else if (k === "rocket") s = find(0.3, 0.7, 0.44, wet ? 0.56 : 0.82, 0.32, 0.3, 0.28);   // tall: low enough for its labels
      else if (k === "loudspeaker") s = wet ? find(0.3, 0.7, 0.24, 0.34, 0.28, 0.26, 0.28) : find(0.3, 0.7, 0.76, 0.88, 0.28, 0.26, 0.28);
      else if (k === "office") s = find(left ? 0.54 : 0.3, left ? 0.7 : 0.46, 0.42, 0.8, 0.16, 0.34, 0.26);
      else s = { x: 0.5, y: 0.5 };
      plan.spots[k] = s;
      rivals.push(s);
    });
    return plan;
  }

  function gap(p, list) {
    var g = 9;
    for (var i = 0; i < list.length; i++) g = Math.min(g, Math.hypot((p.x - list[i].x) * 1.25, p.y - list[i].y));
    return g;
  }

  function rivalsFor(i) {
    var info = STAGES[i];
    if (info.rival === "all") return ["feed", "landlord", "rocket", "loudspeaker", "sea"];
    if (info.rival === "judgement") {
      var pool = ["feed", "landlord", "rocket", "loudspeaker", "office"];
      var out = [];
      while (out.length < 3) { var k = pool[Math.floor(rng() * pool.length)]; if (out.indexOf(k) < 0) out.push(k); }
      return out;
    }
    var list = [info.rival];
    if (info.old) {
      // bring back one of the earlier rivals (never the sea or the office twice over)
      var earlier = STAGES.slice(0, i).map(function (s) { return s.rival; }).filter(function (k) { return k !== "sea" && k !== "office"; });
      if (earlier.length) list.push(earlier[Math.floor(rng() * earlier.length)]);
    }
    return list;
  }

  function layout() {
    var p = G.plan;
    if (!p) return;
    var WW = G.WW, WH = G.WH;
    function at(s) { return { x: s.x * WW, y: s.y * WH }; }
    var rx = Math.min(70, WW * 0.12);
    G.place = {
      quarry: at(p.quarry),
      site: at(p.site),
      start: at(p.start),
      pits: p.pits.map(function (s) { var q = at(s); q.rx = rx; q.ry = 40; return q; })
    };
    G.place.fees = { x: G.place.site.x + (p.site.x > 0.5 ? -60 : 60), y: G.place.site.y + 42 };
    G.rivals.forEach(function (r) { r.place(); });
  }

  // ---------------------------------------------------------------------------
  // The run and its stages
  // ---------------------------------------------------------------------------
  function addFolk(x, y, opts) {
    if (G.folk.filter(alive).length >= MAX_FOLK) return null;
    var a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random());
    var f = {
      x: x, y: y, vx: 0, vy: 0,
      ox: Math.cos(a) * r, oy: Math.sin(a) * r,   // their place in the crowd
      state: "follow", t: 0, hat: false, carry: false, load: 0, censored: false,
      face: Math.random() < 0.5 ? -1 : 1, back: false, phase: Math.random() * 6,
      speed: WALK * rand(0.9, 1.1), wet: 0, wade: 1, blessed: 0,
      sx: x, sy: y, trail: false, teeter: 0      // where they last saw the light
    };
    if (opts) for (var k in opts) f[k] = opts[k];
    G.folk.push(f);
    return f;
  }

  function newPriest(x, y) {
    return { x: x, y: y, vx: 0, vy: 0, ox: -0.9, oy: 0.6, state: "follow", t: 0, face: 1, back: false,
             phase: 0, priest: true, censored: false, speed: WALK * 0.8, gone: 0, wet: 0, wade: 1, blessed: 0,
             sx: x, sy: y, trail: false, teeter: 0 };
  }

  function reset(sh) {
    shell = sh;
    G.T = sh.tokens;
    HELP.sfx = sfx;
    var daily = shell.mode === "daily";
    seed = daily ? today() : Math.floor(Math.random() * 1e9);
    rng = mulberry(seed);
    G.mods = { walk: 1, trip: 0, load: 1, smiteCd: 1, smiteR: 1, blessCd: 1, feeEvery: FEE_EVERY, time: 0,
               converts: 1, lure: 1, reach: 1, pitSave: 0, noPriest: false };
    G.devotion = 1;
    run = { score: 0, statues: 0, lost: 0, fees: 0, smitten: 0, taken: [], daily: daily, reached: 0, extended: false,
            learned: {} };    // rivals you've already smitten: their arrows stop showing
    G.folk = [];
    G.priest = null;
    G.stage = FIRST;
    for (var s = 0; s < FIRST; s++) rng(); // debug: start further in
    startStage(true);
  }

  function startStage(fresh) {
    var info = stageInfo();
    G.plan = planStage();
    G.permitSize = isFinite(info.target) ? Math.max(40, Math.round(info.target / 3)) : 80;
    G.rivals = G.plan.kinds.map(function (k) { return R[k](G, HELP, G.plan.spots[k]); });
    G.piles = [];
    layout();
    var st = G.place.start;
    if (fresh) {
      for (var i = 0; i < START_FOLK; i++) addFolk(st.x + rand(-50, 50), st.y + rand(-50, 50));
    } else {
      // the survivors walk on to the next field
      G.folk = G.folk.filter(alive);
      G.folk.forEach(function (f) {
        f.x = st.x + rand(-55, 55); f.y = st.y + rand(-55, 55);
        f.vx = f.vy = 0; f.state = "follow"; f.carry = false; f.load = 0; f.wet = 0; f.blessed = 0;
        f.sx = f.x; f.sy = f.y; f.trail = false; f.teeter = 0;
      });
    }
    if (!G.mods.noPriest && (!G.priest || !alive(G.priest))) G.priest = newPriest(st.x - 40, st.y + 10);
    else if (G.priest && alive(G.priest)) {
      G.priest.x = G.priest.sx = st.x - 40; G.priest.y = G.priest.sy = st.y + 10;
      G.priest.state = "follow"; G.priest.vx = G.priest.vy = 0; G.priest.trail = false; G.priest.teeter = 0;
    }
    G.light = { x: st.x + (G.plan.start.x < 0.5 ? 40 : -40), y: st.y };
    G.stageTime = info.time + G.mods.time;
    clock = 0;
    timeLeft = G.stageTime;
    bricks = delivered = stageLost = 0;
    bubbles = [];
    fx = [];
    smiteWait = 0;
    blessWait = 0;
    prevAction = prevBless = false;
    shake = 0;
    phase = "play";
    announced = false;
    firstFall = true;
    timers = { prayer: 2.5, sermon: 5, rival: 6, puff: 9, behind: 4, teeter: 0 };
    run.reached = G.stage;
    judgeTier = 0;
    judgeFrom = 0;
    judgeNext = JUDGEMENT_TIER;
    feeCalled = false;
    guide = G.stage === 0 ? "bricks" : null;
    lostSight = 0;
    hintNow = null;
    hintSeen = 0;
    noticed = false;
    bg = null;
    statueImg = null;
    if (hudEls) paintHud();
  }

  // Three commandments you haven't taken, from the run's seed
  function offer() {
    var pool = COMMANDMENTS.filter(function (c) { return run.taken.indexOf(c.id) < 0; });
    var out = [];
    while (out.length < 3 && pool.length) out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
    return out;
  }

  function stageClear() {
    if (phase !== "play") return;
    phase = "clear";
    run.statues++;
    cheer();
    var secs = Math.ceil(timeLeft);
    var faithful = G.folk.filter(alive).length;
    var bonus = Math.round((secs * 20 + faithful * 25) * G.devotion);
    run.score += bonus;
    sfx.choir();
    var info = stageInfo();
    var next = G.stage + 1;
    offers = offer();
    var stats = [
      { label: "Statue", value: bricks + "/" + info.target },
      { label: "Time left", value: secs + "s" },
      { label: "Faithful", value: String(faithful) },
      { label: "Lost", value: String(stageLost) },
      { label: "Score", value: fmt(run.score) }
    ];
    var opts = {
      stamp: secs >= 25 ? "Approved" : "Pending review",
      tilt: secs >= 25 ? -5 : 4,
      heading: "Stage " + (G.stage + 1) + " complete.",
      line: info.clear,
      stats: stats,
      ask: next > LAST ? "Judgement Day is next. One last commandment." : "Stage " + (next + 1) + ": " + stageName(next) + ". Pick a commandment.",
      choices: offers.map(function (c) { return { label: c.label, detail: c.detail }; })
    };
    paintHud();
    shell.interlude(opts).then(function (i) {
      var c = offers[i] || offers[0];
      if (c) { run.taken.push(c.id); c.apply(G.mods); }
      G.stage = next;
      startStage(false);
      shell.next();
    });
  }

  function stageName(i) {
    var info = STAGES[i];
    if (info.rival === "all") return "Everything at once";
    if (info.rival === "judgement") return "Judgement Day";
    return R.names[info.rival];
  }

  // ---------------------------------------------------------------------------
  // Speech bubbles: at most three at once, one per speaker
  // ---------------------------------------------------------------------------
  function say(who, text, force) {
    if (!who || !text) return;
    for (var j = 0; j < bubbles.length; j++) if (bubbles[j].text === text) return;   // once is plenty
    for (var i = 0; i < bubbles.length; i++) if (bubbles[i].who === who) { if (!force) return; bubbles.splice(i, 1); break; }
    if (bubbles.length >= 3) { if (!force) return; bubbles.shift(); }
    bubbles.push({ who: who, text: text, t: 0, life: 2.2 + text.length * 0.03 });
  }

  function someone(test) {
    var pool = G.folk.filter(function (f) { return alive(f) && (!test || test(f)); });
    return pool.length ? pick(pool) : null;
  }

  // ---------------------------------------------------------------------------
  // Sound, all made in code (DESIGN.md, section 9)
  // ---------------------------------------------------------------------------
  var sfx = {
    step: function () { N.sound.tone(rand(1300, 1900), 0.022, { vol: 0.016 }); },
    pick: function () { N.sound.tone(260, 0.09, { slide: 420, vol: 0.05 }); },
    drop: function () { N.sound.tone(170, 0.08, { vol: 0.07 }); N.sound.noise(0.05, { freq: 1500, vol: 0.07 }); },
    choir: function () {
      [392, 494, 587, 784].forEach(function (f, i) {
        N.sound.tone(f, 1.1, { vol: 0.03, delay: i * 0.07 });
        N.sound.tone(f * 1.006, 1.1, { type: "sawtooth", vol: 0.012, delay: i * 0.07 });
      });
    },
    fall: function () { N.sound.tone(1100, 0.7, { type: "sine", slide: 140, vol: 0.07 }); },
    splash: function () { N.sound.noise(0.5, { type: "bandpass", freq: 600, q: 0.8, vol: 0.16 }); N.sound.tone(500, 0.3, { type: "sine", slide: 180, vol: 0.05 }); },
    puff: function () {
      N.sound.tone(95, 0.32, { type: "sawtooth", slide: 58, vol: 0.09 });
      N.sound.noise(0.28, { type: "bandpass", freq: 220, q: 5, vol: 0.12 });
      N.sound.tone(118, 0.12, { type: "sawtooth", slide: 80, vol: 0.06, delay: 0.34 });
    },
    zap: function () {
      N.sound.noise(0.5, { type: "highpass", freq: 1800, vol: 0.22 });
      N.sound.tone(1600, 0.25, { type: "sawtooth", slide: 90, vol: 0.08 });
      N.sound.stamp(0.03);
    },
    bless: function () {
      [660, 880, 1320].forEach(function (f, i) { N.sound.tone(f, 0.4, { type: "triangle", vol: 0.04, delay: i * 0.06 }); });
    },
    ping: function () { N.sound.tone(1320, 0.06, { vol: 0.045 }); N.sound.tone(1760, 0.08, { vol: 0.045, delay: 0.08 }); },
    till: function () { N.sound.tone(2100, 0.05, { vol: 0.05 }); N.sound.tone(2800, 0.14, { vol: 0.05, delay: 0.06 }); },
    blare: function () { N.sound.tone(220, 0.5, { type: "sawtooth", vol: 0.06 }); N.sound.tone(277, 0.5, { type: "sawtooth", vol: 0.05 }); },
    launch: function () { N.sound.noise(1.8, { type: "lowpass", freq: 400, vol: 0.22 }); N.sound.tone(90, 1.6, { type: "sawtooth", slide: 400, vol: 0.06 }); },
    stamp: function () { N.sound.stamp(); },
    ready: function () { N.sound.tone(880, 0.06, { vol: 0.035 }); },
    teeter: function () { N.sound.tone(622, 0.11, { type: "triangle", vol: 0.06 }); N.sound.tone(494, 0.2, { type: "triangle", vol: 0.06, delay: 0.13 }); },
    extend: function () { N.sound.stamp(); N.sound.tone(784, 0.3, { type: "triangle", vol: 0.05, delay: 0.2 }); }
  };

  // ---------------------------------------------------------------------------
  // Update
  // ---------------------------------------------------------------------------
  function inPit(p) {
    var pits = G.place.pits;
    for (var i = 0; i < pits.length; i++) {
      var dx = (p.x - pits[i].x) / pits[i].rx, dy = (p.y - pits[i].y) / pits[i].ry;
      if (dx * dx + dy * dy < 1) return pits[i];
    }
    return null;
  }

  // Is the light itself over the hole (the striped rim doesn't count)
  function lightIn(pit) {
    var dx = (G.light.x - pit.x) / pit.rx, dy = (G.light.y - pit.y) / pit.ry;
    return dx * dx + dy * dy < 1;
  }

  // Put them back on the edge of the pit, still moving round it
  function rim(f, pit) {
    var ang = Math.atan2((f.y - pit.y) / pit.ry, (f.x - pit.x) / pit.rx);
    var c = Math.cos(ang), s = Math.sin(ang);
    f.x = pit.x + c * (pit.rx + 1.5);
    f.y = pit.y + s * (pit.ry + 1.5);
    var nx = c / pit.rx, ny = s / pit.ry, nl = Math.hypot(nx, ny);
    nx /= nl; ny /= nl;
    var vn = f.vx * nx + f.vy * ny;
    if (vn < 0) { f.vx -= nx * vn; f.vy -= ny * vn; }
  }

  function steer(f, tx, ty, speed, dt) {
    var dx = tx - f.x, dy = ty - f.y, d = Math.hypot(dx, dy);
    var want = d > 0.5 ? speed * Math.min(1, d / 24) : 0;
    var dvx = d > 0.5 ? dx / d * want : 0, dvy = d > 0.5 ? dy / d * want : 0;
    var k = Math.min(1, dt * 6);
    f.vx += (dvx - f.vx) * k;
    f.vy += (dvy - f.vy) * k;
  }

  // Gone for good: into a pit, out to sea, or off to space
  function lose(list, how) {
    list.forEach(function (f) {
      if (f.state === "gone") return;
      if (how === "rocket") {
        f.state = "gone";
        if (!f.priest) { run.lost++; stageLost++; }
        return;
      }
      f.state = "fall";
      f.how = how;
      f.t = 0;
      f.carry = false;
      if (how === "sea") { sfx.splash(); if (Math.random() < 0.5) say(f, pick(["Glub.", "Nobody mention it.", "Swimming to god."]), true); }
      else { sfx.fall(); if (Math.random() < 0.5) say(f, pick(FALLING), true); }
    });
  }

  function moveLight(dt, input) {
    var L = G.light;
    if (AUTOPILOT) {
      var goal = autopilot(), d = Math.hypot(goal.x - L.x, goal.y - L.y), sp = Math.min(LIGHT_SPEED * 0.85, d / dt);
      if (d > 0.1) { L.x += (goal.x - L.x) / d * sp * dt; L.y += (goal.y - L.y) / d * sp * dt; }
    } else if (input.aim.on) {
      // the light trails a finger a little above it, so the finger doesn't hide it
      var tx = input.aim.x / SC, ty = (input.aim.y - (input.mode === "touch" ? 34 : 0)) / SC;
      var dd = Math.hypot(tx - L.x, ty - L.y), step = Math.min(dd, LIGHT_CHASE * dt);
      if (dd > 0.1) { L.x += (tx - L.x) / dd * step; L.y += (ty - L.y) / dd * step; }
    } else {
      var mx = input.stick.x || ((input.right ? 1 : 0) - (input.left ? 1 : 0));
      var my = input.stick.y || ((input.down ? 1 : 0) - (input.up ? 1 : 0));
      var m = Math.hypot(mx, my);
      if (m > 1) { mx /= m; my /= m; }
      L.x += mx * LIGHT_SPEED * dt;
      L.y += my * LIGHT_SPEED * dt;
    }
    L.x = clamp(L.x, 16, G.WW - 16);
    L.y = clamp(L.y, 30, G.WH - 12);
  }

  // The computer plays god, for testing: fetch bricks, go round the pits,
  // queue at the office, and smite whatever's causing trouble.
  var auto = { detour: null, want: null };
  function autopilot() {
    var live = G.folk.filter(alive);
    var flock = live.filter(function (f) { return f.state === "follow" || f.state === "pray"; });
    var loaded = live.filter(function (f) { return f.carry; }).length;
    var P = G.place, L = G.light;
    var goal = null;
    G.rivals.forEach(function (r) {
      if (goal) return;
      if (r.kind === "feed" && r.live() && live.filter(function (f) { return f.state === "stare"; }).length >= 4) goal = { x: r.x, y: r.y + 16, smite: true };
      if (r.kind === "rocket" && r.phase === "boarding" && live.filter(function (f) { return f.state === "board"; }).length >= 3) goal = { x: r.x, y: r.y - 20, smite: true };
      if (r.kind === "landlord" && r.away <= 0 && r.rent >= 6 && smiteWait <= 0) goal = { x: r.x, y: r.y, smite: true };
      if (r.kind === "office" && r.blocks() && loaded >= live.length * 0.5) goal = { x: r.x, y: r.y + 24 };
    });
    if (!goal && G.piles.length && loaded < live.length * 0.6) goal = G.piles[0];
    if (!goal) goal = loaded >= live.length * 0.6 ? P.site : P.quarry;
    auto.want = goal;
    var target = route(L, goal);
    // never get more than a short walk ahead of the flock
    if (flock.length) {
      var fx0 = 0, fy0 = 0;
      flock.forEach(function (f) { fx0 += f.x; fy0 += f.y; });
      fx0 /= flock.length; fy0 /= flock.length;
      var gx = target.x - fx0, gy = target.y - fy0, gl = Math.hypot(gx, gy);
      if (gl > 60) { gx *= 60 / gl; gy *= 60 / gl; }
      target = { x: fx0 + gx, y: fy0 + gy };
    }
    return target;
  }
  // A path round the pits (and any glowing rival) on a coarse grid
  function route(from, to) {
    var CELL = 16, cols = Math.ceil(G.WW / CELL), rows = Math.ceil(G.WH / CELL);
    function blocked(cx, cy) {
      var x = (cx + 0.5) * CELL, y = (cy + 0.5) * CELL;
      if (y < 30) return true;
      for (var i = 0; i < G.place.pits.length; i++) {
        var p = G.place.pits[i];
        if (Math.hypot((x - p.x) / (p.rx + 34), (y - p.y) / (p.ry + 34)) < 1) return true;
      }
      for (var j = 0; j < G.rivals.length; j++) {
        var r = G.rivals[j];
        if (r.kind === "feed" && r.live() && Math.hypot((x - r.x) / 120, (y - r.y) / 70) < 1) return true;
      }
      return false;
    }
    var sx = clamp(Math.floor(from.x / CELL), 0, cols - 1), sy = clamp(Math.floor(from.y / CELL), 0, rows - 1);
    var gx = clamp(Math.floor(to.x / CELL), 0, cols - 1), gy = clamp(Math.floor(to.y / CELL), 0, rows - 1);
    var prev = new Int32Array(cols * rows).fill(-2);
    var queue = [sy * cols + sx];
    prev[queue[0]] = -1;
    var goalId = gy * cols + gx, found = false;
    for (var q = 0; q < queue.length && !found; q++) {
      var id = queue[q], cx = id % cols, cy = (id - cx) / cols;
      for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        var nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
        var nid = ny * cols + nx;
        if (prev[nid] !== -2) continue;
        if (nid !== goalId && blocked(nx, ny)) continue;
        prev[nid] = id;
        if (nid === goalId) { found = true; break; }
        queue.push(nid);
      }
    }
    if (!found) return to;
    var path = [], at = goalId;
    while (at >= 0) { path.push(at); at = prev[at]; }
    path.reverse();
    var step = path[Math.min(path.length - 1, 4)];
    if (step === goalId) return to;
    return { x: (step % cols + 0.5) * CELL, y: (Math.floor(step / cols) + 0.5) * CELL };
  }

  function autoActions() {
    var w = auto.want;
    var near = w && Math.hypot(w.x - G.light.x, w.y - G.light.y) < 26;
    var act = !!(w && w.smite && near && smiteWait <= 0);
    var loaded = G.folk.filter(function (f) { return alive(f) && f.carry; }).length;
    var bless = blessWait <= 0 && loaded > 8;
    return { action: act, bless: bless };
  }

  function smite() {
    smiteWait = SMITE_CD * G.mods.smiteCd;
    var r = SMITE_R * G.mods.smiteR, hit = 0, x = G.light.x, y = G.light.y;
    fx.push({ kind: "bolt", x: x, y: y, t: 0, life: 0.45, seed: Math.random() * 1000, r: r });
    fx.push({ kind: "scorch", x: x, y: y, t: 0, life: 6 });
    if (!shell.reduceMotion) shake = 0.3;
    sfx.zap();
    var said = null;
    G.rivals.forEach(function (rv) {
      if (said) return;
      said = rv.smite(x, y, r);
      if (said) run.learned[rv.kind] = true;
    });
    G.folk.concat(G.priest ? [G.priest] : []).forEach(function (f) {
      if (!alive(f)) return;
      if (dist(f, G.light) > r) return;
      var a = Math.atan2(f.y - y, f.x - x) || Math.random() * 6;
      f.vx = Math.cos(a) * 170;
      f.vy = Math.sin(a) * 170;
      f.state = "stun";
      f.t = 1.4;
      f.carry = false;
      f.censored = true;
      hit++;
    });
    if (hit) {
      run.smitten += hit;
      G.devotion = Math.min(DEVOTION_MAX, G.devotion + hit * DEVOTION_PER);
      if (G.priest && G.priest.state === "stun") say(G.priest, "I forgive you. Invoice to follow.", true);
      else say(someone(function (f) { return f.state === "stun"; }), pick(SMITTEN), true);
    }
    if (said) shell.callout(said, { sound: false });
    else if (hit) shell.callout(hit > 1 ? hit + " smitten" : "Smitten", { sound: false });
    else shell.callout("Missed", { sound: false, ms: 900 });
  }

  function bless() {
    blessWait = BLESS_CD * G.mods.blessCd;
    run.learned.bless = true;
    sfx.bless();
    var n = 0;
    G.folk.forEach(function (f) {
      if (!alive(f) || dist(f, G.light) > FOLLOW_R * G.mods.reach) return;
      f.blessed = BLESS_TIME;
      if (f.state === "stare" || f.state === "march" || f.state === "board" || f.state === "pray") f.state = "follow";
      n++;
    });
    fx.push({ kind: "halo", x: G.light.x, y: G.light.y, t: 0, life: 0.7 });
    if (n) say(someone(function (f) { return f.blessed > 0; }), pick(BLESSED), true);
    shell.callout(n ? "Blessed" : "Blessed nobody", { sound: false, ms: 900 });
  }

  function deliver(f) {
    if (phase !== "play") return;     // the statue's done: the rest can keep theirs
    var office = G.rivals.filter(function (r) { return r.kind === "office"; })[0];
    if (office && office.blocks()) { office.waiting(f); return; }
    var load = f.load || 1;
    f.carry = false;
    f.load = 0;
    delivered++;
    fx.push({ kind: "spark", x: G.place.site.x + rand(-14, 14), y: G.place.site.y - rand(10, 40), t: 0, life: 0.4 });
    if (G.priest && alive(G.priest) && delivered % G.mods.feeEvery === 0) {
      run.fees += load;
      sfx.till();
      say(G.priest, pick(FEES), true);
      if (!feeCalled) { feeCalled = true; shell.callout("Administration fee", { sound: false, ms: 1100 }); }
      return;
    }
    sfx.drop();
    if (guide === "site") guide = null;
    var before = bricks;
    bricks += load;
    run.score += 100 * load * G.devotion;
    if (office) office.used(load);
    var tier = stageInfo().target / 5;
    var up = judgement() ? bricks >= judgeNext : Math.floor(bricks / tier) > Math.floor(before / tier) && bricks < stageInfo().target;
    if (up) {
      var n = Math.floor(bricks / tier);
      if (judgement()) {
        // each tier needs a few more bricks than the last, so judgement comes in the end
        judgeTier++;
        judgeFrom = judgeNext;
        judgeNext += Math.round(JUDGEMENT_TIER * Math.pow(JUDGEMENT_GROW, judgeTier));
        timeLeft += JUDGEMENT_BONUS;
        G.stageTime += JUDGEMENT_BONUS;
        run.score += 500 * G.devotion;
        shell.callout("Judgement: deferred");
      } else shell.callout(TIER_CALLS[Math.min(TIER_CALLS.length - 1, n - 1)]);
      sfx.choir();
      var count = Math.round(CONVERTS * G.mods.converts), last = null;
      for (var i = 0; i < count; i++) last = addFolk(G.place.site.x + rand(-30, 30), G.place.site.y + rand(14, 40)) || last;
      if (last) say(last, pick(JOINING), true);
    }
    if (bricks >= stageInfo().target) stageClear();
  }

  function updateOne(f, dt, crowdR, scatter) {
    if (f.state === "gone" || f.state === "aboard") return;
    f.phase += dt * (Math.hypot(f.vx, f.vy) > 12 ? 14 : 3);
    if (f.blessed > 0) f.blessed -= dt;

    if (f.state === "fall") {
      f.t += dt;
      var hole = f.pit || { x: f.x, y: f.y + 30 };
      if (f.how === "sea") { f.y += dt * 30; f.x += dt * 10; }
      else { f.x += (hole.x - f.x) * dt * 2; f.y += (hole.y - f.y) * dt * 2; }
      if (f.t > 0.9) {
        if (f.how === "pit" && Math.random() < G.mods.pitSave) {
          // faith rewarded: they climb back out
          f.state = "stun"; f.t = 1; f.x = hole.x + (Math.random() < 0.5 ? -1 : 1) * (hole.rx + 8); f.y = hole.y; f.vx = f.vy = 0;
          say(f, "Faith: rewarded.", true);
          return;
        }
        f.state = "gone";
        if (f.priest) G.priest.gone = 8;
        else { run.lost++; stageLost++; }
      }
      return;
    }

    var dl = dist(f, G.light);
    var taken = false;
    if (f.state === "stun") {
      f.t -= dt;
      f.vx *= 1 - Math.min(1, dt * 4);
      f.vy *= 1 - Math.min(1, dt * 4);
      if (f.t <= 0) f.state = "follow";
      taken = true;
    } else if (f.state === "pick") {
      f.t -= dt;
      f.vx = f.vy = 0;
      if (f.t <= 0) {
        f.carry = true;
        f.load = G.mods.load;
        f.hat = true;
        f.state = "follow";
        sfx.pick();
        if (guide === "bricks") guide = "site";
        if (Math.random() < 0.06) puff(f);
      }
      taken = true;
    } else {
      for (var i = 0; i < G.rivals.length && !taken; i++) taken = G.rivals[i].capture(f, dt, dl);
    }
    if (!taken && f.state !== "gone" && f.state !== "fall") {
      var reach = (scatter ? FOLLOW_R * 0.45 : FOLLOW_R) * G.mods.reach;
      var speed = (f.carry ? WALK_LOADED : f.speed) * G.mods.walk * (f.blessed > 0 ? 1.5 : 1);
      var spread = scatter ? crowdR * 2.4 : crowdR;
      if (f.priest) spread = crowdR + 26;
      if (dl < reach) {
        f.state = "follow";
        f.trail = false;
        f.sx = G.light.x; f.sy = G.light.y;
        steer(f, G.light.x + f.ox * spread, G.light.y + f.oy * spread * 0.7, speed * (f.wade || 1), dt);
        if (G.mods.trip && !f.priest && Math.hypot(f.vx, f.vy) > 40 && Math.random() < G.mods.trip * dt) {
          f.state = "stun"; f.t = 0.7;
          if (Math.random() < 0.3) say(f, pick(TRIPPED));
        }
      } else {
        // out of sight: they walk to where they last saw the light, and wait there
        var wx = f.sx + f.ox * spread, wy = f.sy + f.oy * spread * 0.7;
        if (Math.hypot(wx - f.x, wy - f.y) > 12) {
          if (!f.trail && Math.random() < 0.08) say(f, pick(TRAILING));
          f.state = "follow";
          f.trail = true;
          steer(f, wx, wy, speed * 0.85 * (f.wade || 1), dt);
        } else {
          f.state = "pray";
          f.trail = false;
          steer(f, f.x, f.y, 0, dt);
        }
      }
    }
    if (f.state === "gone" || f.state === "fall" || f.state === "aboard") return;

    f.x += f.vx * dt;
    f.y += f.vy * dt;
    f.x = clamp(f.x, 8, G.WW - 8);
    f.y = clamp(f.y, 26, G.WH - 4);
    if (Math.abs(f.vx) > 6) f.face = f.vx > 0 ? 1 : -1;
    f.back = f.vy < -22 && Math.abs(f.vy) > Math.abs(f.vx) * 0.6;

    // Blind faith: they'll follow the light into a pit, but only the light.
    // Anything else (a shove, a slogan, the long way round) and they walk
    // round the edge. Even then they wobble on the brink for a moment first.
    var pit = inPit(f);
    if (pit && f.state === "follow" && !f.trail && lightIn(pit)) {
      var brink = f.teeter === 0;
      f.teeter += dt;
      if (brink) {
        if (Math.random() < 0.25) say(f, pick(TEETERING));
        if (timers.teeter <= 0) { timers.teeter = 1; sfx.teeter(); }
      }
      if (f.teeter < TEETER) { rim(f, pit); return; }
      f.pit = pit;
      f.teeter = 0;
      lose([f], "pit");
      if (f.priest) { shell.callout("Priest: lost"); say(f, "Admin fee waived. Just this once.", true); }
      else if (firstFall) { firstFall = false; shell.callout("Faith: tested", { sound: false }); }
      return;
    }
    if (pit) {
      rim(f, pit);
      if (f.state === "march" && Math.random() < 0.02) say(f, "Is that a pit. Nobody said pit.");
    } else if (f.teeter > 0) {
      f.teeter = 0;
      if (Math.random() < 0.3) say(f, pick(["Close one.", "Phew.", "Faith: postponed."]));
    }
    if (f.priest || f.state === "stun" || f.state === "pick") return;
    if (!f.carry) {
      if (dist(f, G.place.quarry) < QUARRY_R) { f.state = "pick"; f.t = 0.35; return; }
      for (var j = 0; j < G.piles.length; j++) {
        var pl = G.piles[j];
        if (pl.n > 0 && dist(f, pl) < 26) { pl.n--; f.state = "pick"; f.t = 0.3; if (!pl.n) G.piles.splice(j, 1); return; }
      }
    } else if (dist(f, G.place.site) < SITE_R) deliver(f);
  }

  function separate() {
    var live = G.folk.filter(function (f) { return alive(f); });
    if (G.priest && alive(G.priest)) live.push(G.priest);
    var crowded = null;
    for (var i = 0; i < live.length; i++) {
      var a = live[i], near = a.near || 0;
      for (var j = i + 1; j < live.length; j++) {
        var b = live[j];
        var dx = b.x - a.x, dy = (b.y - a.y) * 1.4;
        if (dx > 18 || dx < -18 || dy > 25 || dy < -25) continue;
        var d = Math.hypot(dx, dy);
        var min = (a.priest || b.priest) ? 18 : 13;
        if (d < min && d > 0.01) {
          var push = (min - d) * 0.5 / d;
          a.x -= dx * push; a.y -= dy * push / 1.4;
          b.x += dx * push; b.y += dy * push / 1.4;
        }
        if (d < 17) { near++; b.near = (b.near || 0) + 1; }
      }
      if (near >= 6 && !crowded) crowded = a;
    }
    live.forEach(function (f) { f.near = 0; });
    return crowded;
  }

  // A little puff of something. Nobody admits to it.
  function puff(f) {
    var blobs = [];
    for (var i = 0; i < 5; i++) blobs.push({ x: rand(-6, 6), y: rand(-6, 2), r: rand(2.5, 4.5) });
    fx.push({ kind: "puff", x: f.x + f.face * -6, y: f.y - 4, t: 0, life: 1.4, blobs: blobs });
    sfx.puff();
    timers.puff = rand(8, 14);
    var neighbour = someone(function (o) { return o !== f && dist(o, f) < 40; });
    say(neighbour || f, pick(PUFFED), true);
  }

  // The one thing worth pointing at right now: the Office's queue whenever
  // it's needed, otherwise a rival causing trouble that you haven't yet
  // smitten this run. Stage one points at the bricks and the statue.
  function pickHint(dt) {
    hintNow = null;
    var office = officeRival();
    if (office) hintNow = office.hint();
    for (var i = 0; i < G.rivals.length && !hintNow; i++) {
      var rv = G.rivals[i];
      if (rv === office || !rv.hint || run.learned[rv.kind]) continue;
      hintNow = rv.hint();
      if (hintNow && rv.kind === "sea") {
        hintSeen += dt;
        if (hintSeen > 6) run.learned.sea = true;
      }
    }
    // until you've blessed once: when rivals have hold of a few near you, say so
    if (!hintNow && !run.learned.bless && blessWait <= 0) {
      var held = 0, reach = FOLLOW_R * G.mods.reach;
      G.folk.forEach(function (f) {
        if ((f.state === "stare" || f.state === "march" || f.state === "board") && dist(f, G.light) < reach) held++;
      });
      if (held >= 4) hintNow = { x: G.light.x, y: G.light.y - 88, word: root.classList.contains("kit-touching") ? "Tap Bless" : "Bless: press B" };
    }
  }
  function officeRival() {
    for (var i = 0; i < G.rivals.length; i++) if (G.rivals[i].kind === "office") return G.rivals[i];
    return null;
  }

  // The stage's notice: who's turned up and what to do about them
  function notice() {
    var info = stageInfo();
    var title = judgement() ? "Judgement Day" : "Stage " + (G.stage + 1) + ": " + stageName(G.stage);
    var text = (BRIEFS[info.rival] || "").replace("{how}", smiteHow());
    var back = G.plan.kinds.filter(function (k) { return k !== info.rival; });
    if (info.old && back.length) text += " " + R.names[back[0]] + " is back.";
    if (G.stage === 0) text = "Lead them to the bricks, then to the statue. " + text;
    shell.brief({ title: title, text: text, ms: G.stage === 0 ? 9000 : 7000 });
  }
  function smiteHow() {
    return root.classList.contains("kit-touching") ? "(tap Smite)" : "(click, or Space)";
  }

  // The statue's finished: everyone jumps up and down about it
  function cheer() {
    bubbles = [];
    var n = 0;
    G.folk.forEach(function (f) {
      if (!alive(f)) return;
      f.vx = f.vy = 0;
      if (f.state !== "follow" && f.state !== "pray") f.state = "follow";
      if (n < 2 && Math.random() < 0.15) { say(f, pick(CHEERS), true); n++; }
    });
    if (G.priest && alive(G.priest)) say(G.priest, "Collection plate's by the bum.", true);
  }

  function update(dt, input) {
    if (phase !== "play") { clock += dt; tickFx(dt); tickBubbles(dt); return; }
    if (!announced) {
      announced = true;
      var fresh = G.rivals.filter(function (r) { return r.kind === stageInfo().rival; })[0] || G.rivals[0];
      if (fresh && fresh.intro) say(fresh.who, fresh.intro, true);
    }
    clock += dt;
    timeLeft = Math.max(0, timeLeft - dt);

    moveLight(dt, input);

    var a = AUTOPILOT ? autoActions() : null;
    var act = a ? a.action : input.action, bl = a ? a.bless : input.bless;
    smiteWait = Math.max(0, smiteWait - dt);
    blessWait = Math.max(0, blessWait - dt);
    if (act && !prevAction && smiteWait <= 0) smite();
    if (bl && !prevBless && blessWait <= 0) bless();
    prevAction = act;
    prevBless = bl;
    if (smiteWait > 0 && smiteWait - dt <= 0) sfx.ready();

    G.rivals.forEach(function (r) { r.update(dt); });
    pickHint(dt);

    var live = G.folk.filter(alive);
    var crowdR = 10 + 3.6 * Math.sqrt(live.length);
    var scatter = G.priest && G.priest.state === "gone" && G.priest.gone > 0;
    G.reach = (scatter ? FOLLOW_R * 0.45 : FOLLOW_R) * G.mods.reach;
    G.folk.forEach(function (f) { updateOne(f, dt, crowdR, scatter); });
    if (G.priest && !G.mods.noPriest) {
      if (G.priest.state === "gone") {
        G.priest.gone -= dt;
        if (G.priest.gone <= 0) appointPriest();
      } else updateOne(G.priest, dt, crowdR, false);
    }
    var crowded = separate();

    // Footsteps: a patter that follows how many are walking
    var walking = live.filter(function (f) { return Math.hypot(f.vx, f.vy) > 25; }).length;
    stepT -= dt * Math.min(8, walking * 0.4);
    if (stepT <= 0) { stepT = 1; if (walking) sfx.step(); }

    chatter(dt, crowded);
    tickFx(dt);
    tickBubbles(dt);
    shake = Math.max(0, shake - dt);
    if (phase !== "play") return;

    var left = G.folk.filter(alive).length;
    var pending = G.folk.some(function (f) { return f.state === "fall" || f.state === "aboard"; });
    // once a run, a statue that's nearly there gets more time. There's a form.
    if (timeLeft <= 0 && !judgement() && !run.extended && left && bricks >= stageInfo().target * 0.6) {
      run.extended = true;
      timeLeft = EXTENSION;
      G.stageTime += EXTENSION;
      sfx.extend();
      shell.callout("Extension: granted", { sound: false, ms: 1600 });
      say(G.priest && alive(G.priest) ? G.priest : someone(), "One extension. Don't make it a habit.", true);
    }
    if (!left && !pending) end("empty");
    else if (timeLeft <= 0) end(judgement() ? "judged" : "time");
    // the light's reach shows while anyone is out of it
    var behind = live.some(function (f) { return f.state === "pray" || f.trail; });
    lostSight = clamp(lostSight + (behind ? dt : -dt) * 2.5, 0, 1);
    paintHud();
  }

  function appointPriest() {
    var f = someone(function (o) { return o.state === "follow" || o.state === "pray"; });
    if (!f) { G.priest.gone = 2; return; }
    G.folk.splice(G.folk.indexOf(f), 1);
    G.priest = newPriest(f.x, f.y);
    G.priest.face = f.face;
    shell.callout("New priest appointed");
    say(G.priest, "Same fee.", true);
  }

  function chatter(dt, crowded) {
    timers.prayer -= dt;
    timers.sermon -= dt;
    timers.rival -= dt;
    timers.puff -= dt;
    timers.behind -= dt;
    timers.teeter -= dt;
    if (timers.prayer <= 0) {
      timers.prayer = rand(3.5, 6);
      var f = someone(function (o) { return o.state === "follow"; });
      if (f) say(f, pick(f.carry ? CARRYING : PRAYERS));
    }
    if (timers.behind <= 0) {
      timers.behind = rand(4, 7);
      var lonely = someone(function (o) { return o.state === "pray"; });
      if (lonely) say(lonely, pick(LEFT_BEHIND));
    }
    if (timers.sermon <= 0 && G.priest && alive(G.priest)) {
      timers.sermon = rand(6, 9);
      say(G.priest, pick(SERMONS));
    }
    if (timers.rival <= 0 && G.rivals.length) {
      timers.rival = rand(4, 6);
      var r = pick(G.rivals), line = r.speak();
      if (line) { say(r.who, line); if (r.kind === "feed") sfx.ping(); }
    }
    if (crowded && timers.puff <= 0 && Math.random() < dt * 0.6) puff(crowded);
  }

  function tickFx(dt) {
    for (var i = fx.length - 1; i >= 0; i--) {
      fx[i].t += dt;
      if (fx[i].t >= fx[i].life) fx.splice(i, 1);
    }
  }

  function tickBubbles(dt) {
    for (var i = bubbles.length - 1; i >= 0; i--) {
      var b = bubbles[i];
      b.t += dt;
      var gone = b.who.state === "gone" || b.who.state === "aboard";
      if (b.t >= b.life || gone) bubbles.splice(i, 1);
    }
  }

  // ---------------------------------------------------------------------------
  // The end of the run
  // ---------------------------------------------------------------------------
  function end(why) {
    if (phase !== "play") return;
    phase = "over";
    var faithful = G.folk.filter(alive).length;
    var score = Math.round(run.score);
    var key = run.daily ? "daily" : "best";
    var saved = shell.store.get(key, run.daily ? { day: 0, best: 0 } : 0);
    var best = run.daily ? (saved && saved.day === seed ? saved.best : 0) : saved;
    var newBest = score > best;
    if (newBest) shell.store.set(key, run.daily ? { day: seed, best: score } : score);

    var stagesDone = run.statues;
    var stamp, heading, line, rank;
    if (why === "judged") {
      sfx.choir();
      heading = "Judgement Day is over.";
      line = "You were judged. The statues were nice. " + run.statues + " of them, all bums.";
      stamp = bricks >= JUDGEMENT_TIER ? "Approved" : "Pending review";
      rank = bricks >= JUDGEMENT_TIER ? 1 : 2;
    } else {
      if (why === "empty") {
        heading = "Nobody left to worship you.";
        line = "Your followers followed you. That was the problem.";
      } else if (bricks >= stageInfo().target / 2) {
        heading = "Time's up. Statue: half.";
        line = "Half a statue. The Thonglets say it's the best half.";
      } else {
        heading = "Time's up. Statue: mostly plinth.";
        line = "They're very proud of the plinth. Please say something nice about the plinth.";
      }
      rank = stagesDone >= 5 ? 2 : stagesDone >= 2 ? 3 : 4;
      stamp = rank === 2 ? "Pending review" : rank === 3 ? "Not approved" : "Rejected";
    }
    var stats = [
      { label: "Score", value: fmt(score) },
      { label: "Reached", value: judgement() ? "Judgement Day" : "Stage " + (G.stage + 1) + " of 7" },
      { label: "Statues", value: String(run.statues) },
      { label: "Faithful", value: String(faithful) },
      { label: "Lost", value: String(run.lost) },
      { label: "Admin fees", value: String(run.fees) },
      { label: newBest ? (run.daily ? "New best today" : "New best") : (run.daily ? "Best today" : "Best"),
        value: fmt(newBest ? score : best), highlight: newBest }
    ];
    if (run.daily) stats.unshift({ label: "Run", value: todayLabel() });
    shell.finish({ place: rank, total: 4, stamp: stamp, heading: heading, line: line, stats: stats });
  }

  // ---------------------------------------------------------------------------
  // HUD: stage, time and meters top left; score, faithful and devotion top right
  // ---------------------------------------------------------------------------
  function meter(name, key, pad) {
    return '<p class="kit-meter" data-' + key + (pad ? " data-pad" : "") + '><span class="kit-meter-label">' + name + '</span><span class="kit-meter-bar"><span data-' + key + '-bar></span></span></p>';
  }
  function buildHud() {
    var hud = shell.hud;
    hud.innerHTML =
      '<div class="kit-hud-tl">' +
        '<p class="kit-stat"><small data-stage-label>Stage</small><span data-stage>1</span></p>' +
        '<p class="kit-mono" data-time>0:00</p>' +
        meter("Statue", "statue") + meter("Smite", "smite", true) + meter("Bless", "bless", true) +
      '</div>' +
      '<div class="kit-hud-tr">' +
        '<p class="kit-stat kit-stat-big"><span data-score>0</span></p>' +
        '<p class="kit-stat"><small>Faithful</small><span data-faithful>0</span></p>' +
        '<p class="kit-stat" data-minor><small>Devotion</small><span data-devotion>x1.00</span></p>' +
      '</div>';
    hudEls = {};
    ["stage", "stage-label", "time", "statue-bar", "smite", "smite-bar", "bless", "bless-bar", "score", "faithful", "devotion"].forEach(function (k) {
      hudEls[k] = hud.querySelector("[data-" + k + "]");
    });
  }

  function setText(node, text) { if (node.textContent !== text) node.textContent = text; }
  function setWidth(node, share) {
    var w = Math.round(clamp(share, 0, 1) * 100) + "%";
    if (node.style.width !== w) node.style.width = w;
  }

  function paintHud() {
    if (!hudEls || !run) return;
    var s = Math.ceil(timeLeft);
    setText(hudEls["stage-label"], judgement() ? "Judgement" : "Stage");
    setText(hudEls.stage, judgement() ? "Day" : (G.stage + 1) + "/7");
    setText(hudEls.time, Math.floor(s / 60) + ":" + (s % 60 < 10 ? "0" : "") + (s % 60));
    setWidth(hudEls["statue-bar"], judgement() ? (bricks - judgeFrom) / (judgeNext - judgeFrom) : bricks / stageInfo().target);
    var smiteShare = 1 - smiteWait / (SMITE_CD * G.mods.smiteCd), blessShare = 1 - blessWait / (BLESS_CD * G.mods.blessCd);
    setWidth(hudEls["smite-bar"], smiteShare);
    hudEls.smite.classList.toggle("is-full", smiteWait <= 0);
    setWidth(hudEls["bless-bar"], blessShare);
    hudEls.bless.classList.toggle("is-full", blessWait <= 0);
    if (shell.padFill) { shell.padFill("action", smiteShare); shell.padFill("bless", blessShare); }
    setText(hudEls.score, fmt(run.score));
    setText(hudEls.faithful, String(G.folk.filter(alive).length));
    setText(hudEls.devotion, "x" + G.devotion.toFixed(2));
  }

  // ---------------------------------------------------------------------------
  // Drawing
  // ---------------------------------------------------------------------------
  function resize(w, h, dpr) {
    var oldW = G.WW, oldH = G.WH;
    W = w; H = h; DPR = dpr;
    SC = Math.min(W, H) / VIEW;
    G.WW = W / SC; G.WH = H / SC;
    ctx = (shell ? shell.canvas : root.querySelector("canvas")).getContext("2d");
    S.init(G.T || N.tokens(root), SC * DPR);
    bg = null;
    statueImg = null;
    dotsCache = null;
    boxes = null;
    // keep everyone where they were, in proportion
    if (G.light && (oldW !== G.WW || oldH !== G.WH)) {
      var kx = G.WW / oldW, ky = G.WH / oldH;
      G.folk.concat([G.light, G.priest]).concat(G.piles).forEach(function (p) { if (p) { p.x *= kx; p.y *= ky; } });
      G.rivals.forEach(function (r) { if (r.kind === "landlord") { r.x *= kx; r.y *= ky; } });
    }
    layout();
  }

  // The ground and everything on it that never moves, drawn once a stage
  function buildGround() {
    var T = G.T, WW = G.WW, WH = G.WH;
    var cv = document.createElement("canvas");
    cv.width = Math.round(W * DPR);
    cv.height = Math.round(H * DPR);
    var c = cv.getContext("2d");
    c.scale(DPR * SC, DPR * SC);
    c.fillStyle = T.ink;
    c.fillRect(0, 0, WW, WH);

    // worn patches of halftone and a few tufts, so it reads as a field
    var r = seeded(7 + G.stage * 13);
    c.fillStyle = T.ash;
    for (var i = 0; i < 26; i++) {
      var px = r() * WW, py = r() * WH, pr = 20 + r() * 50;
      for (var dy = -pr; dy < pr; dy += 7) {
        for (var dx = -pr; dx < pr; dx += 7) {
          var dd = Math.hypot(dx, dy) / pr;
          if (dd < 1) { c.beginPath(); c.arc(px + dx + (dy % 14 ? 3.5 : 0), py + dy, 1.6 * (1 - dd), 0, 7); c.fill(); }
        }
      }
    }
    c.strokeStyle = T.paper;
    c.lineWidth = 1.1;
    c.lineCap = "round";
    c.globalAlpha = 0.45;
    for (var g = 0; g < 40; g++) {
      var gx = r() * WW, gy = 30 + r() * (WH - 30);
      c.beginPath();
      c.moveTo(gx - 2, gy); c.lineTo(gx - 3, gy - 3.5);
      c.moveTo(gx, gy); c.lineTo(gx, gy - 4.5);
      c.moveTo(gx + 2, gy); c.lineTo(gx + 3, gy - 3.5);
      c.stroke();
    }
    c.globalAlpha = 1;

    // the pits: hazard stripes round the edge, nothing inside
    G.place.pits.forEach(function (p, n) {
      c.beginPath();
      c.ellipse(p.x, p.y, p.rx + 6, p.ry + 6, 0, 0, Math.PI * 2);
      c.fillStyle = T.paper;
      c.fill();
      c.save();
      c.clip();
      c.strokeStyle = T.red;
      c.lineWidth = 6;
      for (var s = -p.rx * 2; s < p.rx * 2; s += 14) {
        c.beginPath(); c.moveTo(p.x + s, p.y - p.ry - 10); c.lineTo(p.x + s + 30, p.y + p.ry + 10); c.stroke();
      }
      c.restore();
      c.beginPath();
      c.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, Math.PI * 2);
      c.fillStyle = T.ink;
      c.fill();
      c.lineWidth = 2;
      c.strokeStyle = T.ink;
      c.beginPath();
      c.ellipse(p.x, p.y, p.rx + 6, p.ry + 6, 0, 0, Math.PI * 2);
      c.stroke();
      sign(c, p.x + p.rx * 0.55, p.y - p.ry - 14, n ? "Also a pit" : "Pit");
    });

    // the brick pile
    var q = G.place.quarry;
    var rows = [[-24, -16, -8, 0, 8, 16], [-20, -12, -4, 4, 12], [-16, -8, 0, 8], [-12, -4, 4], [-8, 0]];
    rows.forEach(function (row, y) {
      row.forEach(function (x) { brick(c, q.x + x - 4, q.y - 4 - y * 5); });
    });
    sign(c, q.x + (q.x < WW / 2 ? 30 : -30), q.y - 30, "Bricks");

    // the building site
    var st = G.place.site;
    c.setLineDash([3, 4]);
    c.lineWidth = 1.6;
    c.strokeStyle = T.paper;
    c.globalAlpha = 0.5;
    c.beginPath();
    c.ellipse(st.x, st.y + 4, SITE_R, SITE_R * 0.42, 0, 0, Math.PI * 2);
    c.stroke();
    c.setLineDash([]);
    c.globalAlpha = 1;
    return cv;
  }

  function brick(c, x, y) {
    c.beginPath();
    c.rect(x, y, 8, 5);
    c.fillStyle = G.T.red;
    c.fill();
    c.lineWidth = 1.2;
    c.strokeStyle = G.T.ink;
    c.stroke();
  }

  function sign(c, x, y, text) {
    var T = G.T;
    c.font = "11px " + T.display;
    var w = c.measureText(text.toUpperCase()).width + 10;
    c.fillStyle = T.paper;
    c.strokeStyle = T.ink;
    c.lineWidth = 1.4;
    c.beginPath(); c.moveTo(x, y + 6); c.lineTo(x, y + 20); c.stroke();
    c.fillRect(x - w / 2, y - 7, w, 14);
    c.strokeRect(x - w / 2, y - 7, w, 14);
    c.fillStyle = T.ink;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(text.toUpperCase(), x, y + 0.5);
  }

  function seeded(n) {
    return function () { n = (n * 16807) % 2147483647; return (n - 1) / 2147483646; };
  }

  // The statue: their best guess at what you look like. A giant Thonglet from
  // behind, arms up, in a thong, with a halo. Drawn whole once, then revealed
  // brick by brick from the plinth up.
  var STATUE = { w: 130, h: 146, ox: 65, oy: 146 };
  function buildStatue() {
    var T = G.T;
    var cv = document.createElement("canvas");
    var sc = SC * DPR;
    cv.width = Math.ceil(STATUE.w * sc);
    cv.height = Math.ceil(STATUE.h * sc);
    var c = cv.getContext("2d");
    c.scale(sc, sc);
    c.translate(STATUE.ox, STATUE.oy);
    c.lineJoin = "round";
    c.lineCap = "round";
    function ink(w, colour) { c.lineWidth = w; c.strokeStyle = colour || T.ink; }

    // plinth
    c.fillStyle = T.paper;
    ink(2.4);
    c.fillRect(-46, -22, 92, 22);
    c.strokeRect(-46, -22, 92, 22);
    c.fillStyle = T.ink;
    var words = stageInfo().plinth.toUpperCase();
    var size = 13;
    c.font = size + "px " + T.display;
    while (c.measureText(words).width > 84 && size > 8) { size--; c.font = size + "px " + T.display; }
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(words, 0, -10.5);

    // feet, then arms raised in glory
    [-17, 17].forEach(function (x) {
      c.beginPath(); c.ellipse(x, -25, 13, 5, 0, 0, Math.PI * 2);
      c.fillStyle = T.paper; c.fill(); ink(2.4); c.stroke();
    });
    [-1, 1].forEach(function (side) {
      c.beginPath();
      c.moveTo(side * 30, -80);
      c.quadraticCurveTo(side * 46, -92, side * 50, -112);
      ink(10); c.stroke();
      ink(5, T.paper); c.stroke();
      c.beginPath(); c.arc(side * 50, -114, 6.5, 0, Math.PI * 2);
      c.fillStyle = T.paper; c.fill(); ink(2.4); c.stroke();
    });

    // the body, with a proper bum at the bottom
    var body = new Path2D();
    body.moveTo(0, -120);
    body.bezierCurveTo(26, -120, 37, -96, 37, -70);
    body.lineTo(37, -50);
    body.bezierCurveTo(37, -32, 27, -24, 15, -24);
    body.bezierCurveTo(7, -24, 2, -27, 0, -31);
    body.bezierCurveTo(-2, -27, -7, -24, -15, -24);
    body.bezierCurveTo(-27, -24, -37, -32, -37, -50);
    body.lineTo(-37, -70);
    body.bezierCurveTo(-37, -96, -26, -120, 0, -120);
    body.closePath();
    c.fillStyle = T.paper;
    c.fill(body);
    c.save();
    c.clip(body);
    c.fillStyle = S.shade(c);
    c.beginPath(); c.ellipse(36, -64, 14, 50, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(8, -36, 9, 9, 0, 0, Math.PI * 2); c.fill();
    c.restore();
    ink(3);
    c.stroke(body);
    c.beginPath(); c.moveTo(0, -52); c.quadraticCurveTo(-1.2, -42, 0, -31);
    ink(2); c.stroke();

    // the thong, from behind
    var band = new Path2D();
    band.moveTo(-36, -55); band.quadraticCurveTo(0, -47, 36, -55);
    var string = new Path2D();
    string.moveTo(0, -50); string.lineTo(0, -33);
    [band, string].forEach(function (path) { ink(7); c.stroke(path); ink(3.6, T.red); c.stroke(path); });
    c.beginPath(); c.moveTo(-6, -51); c.lineTo(6, -51); c.lineTo(0, -43); c.closePath();
    c.fillStyle = T.red; c.fill(); ink(1.8); c.stroke();

    // halo
    c.beginPath();
    c.ellipse(0, -132, 22, 6, 0, 0, Math.PI * 2);
    ink(6); c.stroke();
    ink(3, T.accent); c.stroke();
    return cv;
  }

  function drawStatue(c) {
    if (!statueImg) statueImg = buildStatue();
    var T = G.T, st = G.place.site;
    var share = judgement() ? Math.min(1, bricks / (JUDGEMENT_TIER * 4)) : bricks / stageInfo().target;
    var shown = bricks >= stageInfo().target ? STATUE.h : 22 + share * (STATUE.h - 22);
    var top = st.y - shown;
    c.save();
    c.beginPath();
    c.rect(st.x - STATUE.ox, top, STATUE.w, shown + 2);
    c.clip();
    c.drawImage(statueImg, st.x - STATUE.ox, st.y - STATUE.oy, STATUE.w, STATUE.h);
    c.restore();
    var office = officeRival();
    if (office && office.blocks() && phase === "play") drawTape(c, st.x, st.y - 30, "No permit");
    if (share < 1) {
      // scaffolding round the top of what's built so far
      c.lineWidth = 3.4;
      c.strokeStyle = T.ink;
      c.beginPath();
      c.moveTo(st.x - 56, st.y); c.lineTo(st.x - 56, top - 6);
      c.moveTo(st.x + 56, st.y); c.lineTo(st.x + 56, top - 6);
      c.moveTo(st.x - 60, top - 2); c.lineTo(st.x + 60, top - 2);
      c.stroke();
      c.lineWidth = 1.6;
      c.strokeStyle = T.paper;
      c.stroke();
    }
  }

  function roundRect(c, x, y, w, h, r) {
    if (c.roundRect) { c.roundRect(x, y, w, h, r); return; }
    c.rect(x, y, w, h);
  }

  var dotsCache = null;
  function accentDots(c) {
    if (!dotsCache) {
      var p = document.createElement("canvas");
      var n = Math.max(4, Math.round(5 * SC * DPR));
      p.width = p.height = n;
      var x = p.getContext("2d");
      x.fillStyle = G.T.accent;
      x.beginPath();
      x.arc(n / 2, n / 2, n * 0.22, 0, Math.PI * 2);
      x.fill();
      dotsCache = p;
    }
    var pat = c.createPattern(dotsCache, "repeat");
    if (pat.setTransform && window.DOMMatrix) pat.setTransform(new DOMMatrix().scale(1 / (SC * DPR)));
    return pat;
  }

  // The Priest's cut, piling up next to the statue in a heap that spreads
  function drawFees(c) {
    var fees = Math.min(run.fees, 45);
    if (!fees) return;
    var x = G.place.fees.x, y = G.place.fees.y, n = 0;
    var base = Math.ceil((Math.sqrt(8 * fees + 1) - 1) / 2);
    for (var row = 0; n < fees; row++) {
      var across = Math.max(1, base - row);
      for (var i = 0; i < across && n < fees; i++, n++) brick(c, x + (i - across / 2) * 8, y - 5 - row * 5);
    }
  }

  // Bricks the Landlord dropped, there for the taking
  function drawPiles(c) {
    G.piles.forEach(function (p) {
      for (var i = 0; i < Math.min(p.n, 10); i++) brick(c, p.x - 12 + (i % 4) * 7, p.y - 5 - Math.floor(i / 4) * 5);
    });
  }

  function drawPerson(c, f) {
    if (f.state === "gone" || f.state === "aboard") return;
    var T = G.T;
    var o = f.priest
      ? { back: f.back, censored: f.censored }
      : { back: f.back && f.state !== "stare", hat: f.hat, brick: f.carry, censored: f.censored, stare: f.state === "stare" };
    var spr = S.get(f.priest ? "priest" : "bean", o);
    var moving = Math.hypot(f.vx, f.vy) > 12;
    var calm = shell.reduceMotion;
    var hop = moving && !calm ? Math.abs(Math.sin(f.phase)) * 1.8 : 0;
    var lean = moving && !calm ? Math.sin(f.phase) * 0.06 : 0;
    if (f.state === "march" && !calm) hop = Math.abs(Math.sin(f.phase * 1.4)) * 3;
    if (phase === "clear" && !calm) hop = Math.abs(Math.sin(clock * 9 + f.phase)) * 5;
    var wading = f.wade < 1 && f.state !== "fall";
    c.fillStyle = T.ash;
    if (!wading) { c.beginPath(); c.ellipse(f.x, f.y, f.priest ? 9 : 7, 2.4, 0, 0, Math.PI * 2); c.fill(); }
    if (f.blessed > 0) {
      c.save();
      c.globalAlpha = Math.min(1, f.blessed);
      c.strokeStyle = T.accent;
      c.lineWidth = 1.6;
      c.beginPath(); c.ellipse(f.x, f.y - (f.priest ? 44 : 34), 5, 1.6, 0, 0, Math.PI * 2); c.stroke();
      c.restore();
    }
    c.save();
    c.translate(f.x, f.y - hop);
    if (f.state === "fall") {
      var k = Math.max(0.05, 1 - f.t / 0.9);
      if (f.how === "sea") c.rotate(Math.sin(f.t * 10) * 0.3);
      else { c.rotate(f.t * 7); c.scale(k, k); }
    } else if (f.state === "stun") {
      c.rotate(Math.sin(f.t * 30) * 0.25);
    } else if (f.teeter > 0) {
      // wobbling on the brink
      c.rotate(calm ? 0.2 : Math.sin(clock * 26 + f.phase) * 0.32);
    } else c.rotate(lean);
    if (f.face < 0) c.scale(-1, 1);
    c.drawImage(spr.img, -spr.ox, -spr.oy, spr.w, spr.h);
    c.restore();
    if (wading || (f.state === "fall" && f.how === "sea")) {
      // the water comes up to the thong
      var depth = f.state === "fall" ? 8 + f.t * 20 : 7;
      c.fillStyle = T.ink;
      c.fillRect(f.x - 11, f.y - depth, 22, depth + 2);
      c.strokeStyle = T.paper;
      c.lineWidth = 1.4;
      c.beginPath();
      c.moveTo(f.x - 11, f.y - depth);
      c.quadraticCurveTo(f.x - 5, f.y - depth - 2, f.x, f.y - depth);
      c.quadraticCurveTo(f.x + 5, f.y - depth + 2, f.x + 11, f.y - depth);
      c.stroke();
    }
    if (f.state === "stun") {
      // seeing sparkles: the Notaste sparkle, never a plus (it reads as a cross)
      c.fillStyle = T.paper;
      c.strokeStyle = T.ink;
      c.lineWidth = 0.7;
      for (var i = 0; i < 3; i++) {
        var a = f.t * 8 + i * 2.1;
        var sx = f.x + Math.cos(a) * 9, sy = f.y - 30 + Math.sin(a) * 3;
        c.beginPath();
        c.moveTo(sx, sy - 2.8);
        c.quadraticCurveTo(sx, sy, sx + 2.4, sy);
        c.quadraticCurveTo(sx, sy, sx, sy + 2.8);
        c.quadraticCurveTo(sx, sy, sx - 2.4, sy);
        c.quadraticCurveTo(sx, sy, sx, sy - 2.8);
        c.fill();
        c.stroke();
      }
    }
  }

  // Your light: a pool of dots on the ground and a big hand pointing at it
  function drawLightPool(c) {
    var L = G.light, T = G.T;
    c.save();
    c.fillStyle = accentDots(c);
    c.beginPath();
    c.ellipse(L.x, L.y, 40, 18, 0, 0, Math.PI * 2);
    c.fill();
    c.setLineDash([5, 6]);
    c.lineDashOffset = shell.reduceMotion ? 0 : -clock * 18;
    c.strokeStyle = T.paper;
    c.lineWidth = 1.6;
    c.beginPath();
    c.ellipse(L.x, L.y, 40, 18, 0, 0, Math.PI * 2);
    c.stroke();
    c.restore();
  }

  // How far your light reaches, shown while anyone's out of it
  function drawReach(c) {
    var L = G.light;
    c.save();
    c.globalAlpha = 0.4 * lostSight;
    c.setLineDash([2, 8]);
    c.lineDashOffset = shell.reduceMotion ? 0 : -clock * 10;
    c.strokeStyle = G.T.paper;
    c.lineWidth = 1.4;
    c.beginPath();
    c.arc(L.x, L.y, G.reach || FOLLOW_R, 0, Math.PI * 2);
    c.stroke();
    c.restore();
  }

  // A rival a smite would stop: red brackets round it, so you know it'll
  // land before you strike
  function drawTarget(c, m) {
    var T = G.T, k = shell.reduceMotion ? 0 : (Math.sin(clock * 9) + 1) * 1.5;
    var x0 = m.x - m.w / 2 - k, x1 = m.x + m.w / 2 + k, y0 = m.y - m.h - k, y1 = m.y + k, a = 8;
    var path = new Path2D();
    [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]].forEach(function (q) {
      path.moveTo(q[0], q[1] + q[3] * a); path.lineTo(q[0], q[1]); path.lineTo(q[0] + q[2] * a, q[1]);
    });
    c.save();
    c.lineCap = "round";
    c.lineJoin = "round";
    c.lineWidth = 5;
    c.strokeStyle = T.ink;
    c.stroke(path);
    c.lineWidth = 2.6;
    c.strokeStyle = T.red;
    c.stroke(path);
    c.restore();
  }

  // Hazard tape across the statue while there's no permit
  function drawTape(c, x, y, word) {
    var T = G.T;
    c.save();
    c.translate(x, y);
    c.rotate(-0.05);
    c.font = "9px " + T.display;
    var text = word.toUpperCase(), w = c.measureText(text).width + 34;
    c.fillStyle = T.red;
    c.fillRect(-w / 2, -6.5, w, 13);
    c.lineWidth = 1.2;
    c.strokeStyle = T.ink;
    c.strokeRect(-w / 2, -6.5, w, 13);
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillStyle = T.paper;
    c.fillText(text, 0, 0.5);
    c.fillStyle = T.ink;
    c.fillText("*", -w / 2 + 8, 1.5);
    c.fillText("*", w / 2 - 8, 1.5);
    c.restore();
  }

  // A bobbing arrow pointing down at something, with a word over it
  function drawArrow(c, x, y, word) {
    var T = G.T;
    var bob = shell.reduceMotion ? 0 : Math.abs(Math.sin(clock * 4)) * -5;
    c.save();
    c.translate(x, y + bob);
    c.lineJoin = "round";
    c.beginPath();
    c.moveTo(-5, -16); c.lineTo(5, -16); c.lineTo(5, -6); c.lineTo(11, -6); c.lineTo(0, 6); c.lineTo(-11, -6); c.lineTo(-5, -6);
    c.closePath();
    c.fillStyle = T.paper;
    c.fill();
    c.lineWidth = 2;
    c.strokeStyle = T.ink;
    c.stroke();
    c.font = "10px " + T.display;
    c.textAlign = "center";
    c.textBaseline = "bottom";
    c.lineWidth = 3;
    c.strokeText(word.toUpperCase(), 0, -19);
    c.fillStyle = T.paper;
    c.fillText(word.toUpperCase(), 0, -19);
    c.restore();
  }

  function drawHand(c) {
    var T = G.T, x = G.light.x, y = G.light.y - 46 + (shell.reduceMotion ? 0 : Math.sin(clock * 2.4) * 2);
    c.save();
    c.translate(x, y);
    c.lineJoin = "round";
    c.lineCap = "round";
    c.strokeStyle = T.ink;
    c.lineWidth = 2.2;
    c.beginPath();
    c.rect(-8, -30, 16, 8);
    c.fillStyle = T.accent;
    c.fill();
    c.stroke();
    c.beginPath();
    c.ellipse(0, -14, 10, 9, 0, 0, Math.PI * 2);
    c.fillStyle = T.paper;
    c.fill();
    c.stroke();
    c.beginPath();
    roundRect(c, -3.2, -12, 6.4, 18, 3.2);
    c.fill();
    c.stroke();
    c.beginPath();
    c.moveTo(-7, -11); c.lineTo(-7, -7);
    c.moveTo(-4, -9); c.lineTo(-4, -5);
    c.lineWidth = 1.2;
    c.stroke();
    c.restore();
  }

  function drawFx(c, list) {
    var T = G.T;
    list.forEach(function (e) {
      var k = e.t / e.life;
      if (e.kind === "scorch") {
        c.globalAlpha = 1 - k;
        c.fillStyle = T.ash;
        c.beginPath();
        c.ellipse(e.x, e.y, 30, 12, 0, 0, Math.PI * 2);
        c.fill();
        c.globalAlpha = 1;
      } else if (e.kind === "bolt") {
        var r = seeded(Math.floor(e.seed) + 1);
        var pts = [], steps = 9;
        for (var i = 0; i <= steps; i++) {
          var yy = e.y - (1 - i / steps) * (e.y + 20);
          pts.push([e.x + (i === steps ? 0 : (r() - 0.5) * 26), yy]);
        }
        c.globalAlpha = k < 0.5 ? 1 : 2 - k * 2;
        [[7, T.ink], [3, T.paper]].forEach(function (s) {
          c.lineWidth = s[0];
          c.strokeStyle = s[1];
          c.lineJoin = "miter";
          c.beginPath();
          pts.forEach(function (p, n) { if (n) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); });
          c.stroke();
        });
        c.beginPath();
        c.arc(e.x, e.y, e.r * (0.4 + k), 0, Math.PI * 2);
        c.lineWidth = 3;
        c.strokeStyle = T.paper;
        c.stroke();
        c.globalAlpha = 1;
      } else if (e.kind === "halo") {
        c.globalAlpha = 1 - k;
        c.strokeStyle = T.accent;
        c.lineWidth = 4;
        c.beginPath();
        c.ellipse(e.x, e.y, 40 + k * 120, 18 + k * 54, 0, 0, Math.PI * 2);
        c.stroke();
        c.globalAlpha = 1;
      } else if (e.kind === "puff") {
        // white circles with the accent offset behind (DESIGN.md, section 7)
        var rise = k * 14, grow = 0.7 + k * 0.8;
        c.globalAlpha = 1 - k * k;
        e.blobs.forEach(function (b) {
          c.fillStyle = T.accent;
          c.beginPath(); c.arc(e.x + b.x * grow + 1.6, e.y + b.y * grow - rise + 1.6, b.r * grow, 0, 7); c.fill();
        });
        e.blobs.forEach(function (b) {
          c.fillStyle = T.paper;
          c.beginPath(); c.arc(e.x + b.x * grow, e.y + b.y * grow - rise, b.r * grow, 0, 7); c.fill();
        });
        c.globalAlpha = 1;
      } else if (e.kind === "spark") {
        c.strokeStyle = T.paper;
        c.lineWidth = 1.6;
        c.globalAlpha = 1 - k;
        for (var j = 0; j < 4; j++) {
          var a = j * Math.PI / 2 + 0.4, r0 = 4 + k * 8, r1 = r0 + 4;
          c.beginPath();
          c.moveTo(e.x + Math.cos(a) * r0, e.y + Math.sin(a) * r0);
          c.lineTo(e.x + Math.cos(a) * r1, e.y + Math.sin(a) * r1);
          c.stroke();
        }
        c.globalAlpha = 1;
      }
    });
  }

  // A speech bubble: paper, ink outline, a tail, capitals. Drawn in screen
  // pixels so the words stay readable on a phone. Bubbles that would land on
  // one another are stacked instead.
  function drawBubble(c, b, placed) {
    var T = G.T, who = b.who;
    var lift = who.lift != null ? who.lift : who.priest ? 44 : 34;
    var ax = who.x * SC, ay = (who.y - lift) * SC;
    var size = clamp(SC * 10.5, 11, 15);
    c.font = size + "px " + T.display;
    var words = b.text.toUpperCase().split(" "), lines = [""];
    words.forEach(function (w) {
      var tryLine = lines[lines.length - 1] ? lines[lines.length - 1] + " " + w : w;
      if (tryLine.length > 24 && lines[lines.length - 1]) lines.push(w); else lines[lines.length - 1] = tryLine;
    });
    var tw = 0;
    lines.forEach(function (l) { tw = Math.max(tw, c.measureText(l).width); });
    var pad = size * 0.5, lh = size * 1.02;
    var bw = tw + pad * 2, bh = lines.length * lh + pad * 1.3;
    var bx = clamp(ax - bw / 2, 6, W - bw - 6);
    // clear of the HUD and the buttons above wherever it lands
    var top = 6;
    hudBoxes().forEach(function (r) { if (bx < r.right + 4 && bx + bw > r.left - 4) top = Math.max(top, r.bottom + 4); });
    var by = clamp(ay - bh - size * 0.7, top, H - bh - 6);
    for (var tries = 0; tries < 4; tries++) {
      var hit = null;
      for (var k = 0; k < placed.length; k++) {
        var o = placed[k];
        if (bx < o.x + o.w + 4 && bx + bw + 4 > o.x && by < o.y + o.h + 4 && by + bh + 4 > o.y) { hit = o; break; }
      }
      if (!hit) break;
      by = hit.y - bh - size * 0.8 >= top ? hit.y - bh - size * 0.8 : hit.y + hit.h + size * 0.8;
      by = clamp(by, top, H - bh - 6);
    }
    placed.push({ x: bx, y: by, w: bw, h: bh });
    var tailX = clamp(ax, bx + 12, bx + bw - 12);
    var pop = shell.reduceMotion ? 1 : clamp(b.t * 8, 0, 1);
    c.globalAlpha = Math.min(pop, clamp((b.life - b.t) * 3, 0, 1));
    c.beginPath();
    var r = Math.min(9, bh / 2);
    var under = by > ay;      // stacked below the speaker: the tail points up
    c.moveTo(bx + r, by);
    if (under) { c.lineTo(tailX - 5, by); c.lineTo(tailX - 2, by - size * 0.7); c.lineTo(tailX + 6, by); }
    c.arcTo(bx + bw, by, bx + bw, by + bh, r);
    c.arcTo(bx + bw, by + bh, bx, by + bh, r);
    if (!under) { c.lineTo(tailX + 6, by + bh); c.lineTo(tailX - 2, by + bh + size * 0.7); c.lineTo(tailX - 5, by + bh); }
    c.arcTo(bx, by + bh, bx, by, r);
    c.arcTo(bx, by, bx + bw, by, r);
    c.closePath();
    c.fillStyle = T.paper;
    c.fill();
    c.lineWidth = 2.4;
    c.lineJoin = "round";
    c.strokeStyle = T.ink;
    c.stroke();
    c.fillStyle = T.ink;
    c.textAlign = "center";
    c.textBaseline = "top";
    lines.forEach(function (l, i) { c.fillText(l, bx + bw / 2, by + pad * 0.75 + i * lh); });
    c.globalAlpha = 1;
  }

  // Where the HUD and the buttons sit over the canvas, in CSS pixels. Measured
  // about once a second, as the score grows.
  var boxes = null, boxAge = 0;
  function hudBoxes() {
    if (boxes) return boxes;
    var base = root.getBoundingClientRect();
    boxes = [];
    Array.prototype.forEach.call(root.querySelectorAll(".kit-hud-tl, .kit-hud-tr, .kit-bar"), function (el) {
      var r = el.getBoundingClientRect();
      if (r.width) boxes.push({ left: r.left - base.left, right: r.right - base.left, bottom: r.bottom - base.top });
    });
    return boxes;
  }

  function render() {
    if (!ctx || !G.light || !run) return;
    // the stage's notice goes up with the countdown, so it's read before Go
    if (!noticed && (shell.state() === "countdown" || shell.state() === "playing")) { noticed = true; notice(); }
    if (!hudEls) { buildHud(); paintHud(); }
    if (!bg) bg = buildGround();
    var c = ctx;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.drawImage(bg, 0, 0);
    var sx = 0, sy = 0;
    if (shake > 0) { sx = (Math.random() - 0.5) * 6 * shake; sy = (Math.random() - 0.5) * 6 * shake; }
    c.setTransform(DPR * SC, 0, 0, DPR * SC, sx * DPR, sy * DPR);

    G.rivals.forEach(function (r) { r.ground(c); });
    drawFx(c, fx.filter(function (e) { return e.kind === "scorch"; }));
    if (lostSight > 0) drawReach(c);
    drawLightPool(c);

    // everything standing on the field, back to front
    var things = [];
    G.folk.forEach(function (f) { if (f.state !== "gone" && f.state !== "aboard") things.push({ y: f.y, f: f }); });
    if (G.priest && G.priest.state !== "gone") things.push({ y: G.priest.y, f: G.priest });
    things.push({ y: G.place.site.y, draw: drawStatue });
    things.push({ y: G.place.fees.y, draw: drawFees });
    if (G.piles.length) things.push({ y: G.piles[0].y, draw: drawPiles });
    G.rivals.forEach(function (r) { things = things.concat(r.stand()); });
    things.sort(function (a, b) { return a.y - b.y; });
    things.forEach(function (t) { if (t.draw) t.draw(c); else drawPerson(c, t.f); });

    if (phase === "play" && smiteWait <= 0) {
      var reach = SMITE_R * G.mods.smiteR;
      for (var t = 0; t < G.rivals.length; t++) {
        if (G.rivals[t].aim(G.light.x, G.light.y, reach)) { drawTarget(c, G.rivals[t].mark()); break; }
      }
    }
    drawHand(c);
    drawFx(c, fx.filter(function (e) { return e.kind !== "scorch"; }));

    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (++boxAge > 60) { boxes = null; boxAge = 0; }
    var placed = [];
    var arrow = null;
    if (phase === "play") {
      if (hintNow) arrow = { x: hintNow.x, y: hintNow.y, word: hintNow.word };
      else if (guide === "bricks") arrow = { x: G.place.quarry.x, y: G.place.quarry.y - 52, word: "Bricks" };
      else if (guide) arrow = { x: G.place.site.x, y: G.place.site.y - 50, word: "Statue" };
    }
    if (arrow) {
      arrow.x = clamp(arrow.x, 44, G.WW - 44);
      arrow.y = Math.max(48, arrow.y);
      placed.push({ x: (arrow.x - 40) * SC, y: (arrow.y - 34) * SC, w: 80 * SC, h: 42 * SC });
    }
    bubbles.forEach(function (b) { drawBubble(c, b, placed); });
    if (arrow) {
      c.setTransform(DPR * SC, 0, 0, DPR * SC, 0, 0);
      drawArrow(c, arrow.x, arrow.y, arrow.word);
    }
  }

  // ---------------------------------------------------------------------------
  // Start it up
  // ---------------------------------------------------------------------------
  shell = N.createGame({
    root: root,
    slug: "thonglets",
    title: "Thonglets",
    stamp: "Classified",
    tilt: -3,
    note: "They think you're god. Seven stages, seven statues, a lot of rivals. Mind the pit.",
    hints: {
      keys: "Mouse, arrows or WASD to lead them. Click or Space to smite a rival god. B to bless. P to pause.",
      touch: "Drag to lead them. Smite rival gods on the right. Bless on the left."
    },
    againLabel: "Play again",
    aim: true,
    clickAction: true,
    keys: {
      up: ["ArrowUp", "KeyW"], down: ["ArrowDown", "KeyS"], left: ["ArrowLeft", "KeyA"], right: ["ArrowRight", "KeyD"],
      action: ["Space"], bless: ["KeyB", "KeyE", "ShiftLeft", "ShiftRight"]
    },
    pad: { action: [0, 2, 7], bless: [1, 3, 6] },
    modes: [{ key: "daily", label: "Today's run" }],
    smallCallouts: true,
    touch: [
      { key: "bless", label: "Bless", icon: "Bless", side: "left" },
      { key: "action", label: "Smite", icon: "Smite", side: "right" }
    ],
    reset: reset,
    update: function (dt, input) { for (var i = 0; i < SPEED; i++) update(dt, input); },
    render: function () { render(); },
    resize: resize
  });
  G.T = shell.tokens;
  S.init(G.T, SC * DPR);

  // The canvas font may arrive after the first frame: redraw the signs when it does
  if (document.fonts && document.fonts.load) {
    document.fonts.load("12px " + G.T.display).then(function () { bg = null; statueImg = null; });
  }

  if (DEBUG) {
    window.__thonglets = {
      G: G,
      folk: function () { return G.folk; },
      light: function () { return G.light; },
      place: function () { return G.place; },
      run: function () { return run; },
      score: function () {
        return { stage: G.stage + 1, bricks: bricks, target: stageInfo().target, score: Math.round(run.score), statues: run.statues,
                 lost: run.lost, fees: run.fees, devotion: +G.devotion.toFixed(2), timeLeft: Math.round(timeLeft),
                 faithful: G.folk.filter(alive).length, taken: run.taken.join(","), rivals: G.rivals.map(function (r) { return r.kind; }).join(",") };
      },
      state: function () { return shell.state(); }
    };
  }
})();
