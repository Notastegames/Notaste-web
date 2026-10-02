// Slop Cannon: you run a content farm's cannon. A giant phone stands on the
// right, its feed scrolling up: real people's posts (their dinner, a blurry
// cat, Nan's 90th) and posts that are slop already. Aim, hold to charge, let
// go, and a ball of AI slop (green goo carrying a hand with too many fingers,
// a melting dog, a soldier carved from bread) lands on whatever it hits.
//
// THE JOKE. Real posts are worth ten times as much to ruin as slop is, and
// the platform pays you in engagement for doing it. The feed turns green as
// you go, the people who posted shout at you, and bots comment "So real".
// The results tell you how much of the feed is slop now. It's aimed at the
// platforms that reward this, never at the people scrolling past or posting
// their tea: they're the ones getting slopped, and they're not happy.
//
// THE LOOP. Aim with the mouse, a finger, the arrow keys or a stick. Hold to
// charge: the power swings up and down and a dotted arc shows where the shot
// will go, with red brackets on the post it'll land on by the time it gets
// there (the feed keeps moving) and a tag saying what it's worth. Let go to
// fire. A splash that lands near the line between two posts gets both. Real
// posts slopped in a row build a chain, which multiplies what real posts pay
// (x1.25 a post, up to x3). Every fifth in a row goes viral: the slop spreads
// to the posts either side for free. A shot that only gets slop, a miss, a
// bounce or a catch breaks the chain, so picking what to hit matters.
//
// THE ROUND. Three stages and a final push, each with an engagement target,
// about two and a half minutes in all. Miss a stage's target and the board
// pulls the funding: the round ends there.
//   1. The feed (35s, target 600). Real posts and slop. Learn to aim.
//   2. Context added (38s, target 1,000). Fact checks turn up in the feed:
//      hit one and the slop bounces straight back, and if it lands on the
//      cannon it jams it for a second and a half. Trending posts (a red tag)
//      are worth triple. The feed is faster.
//   3. Moderation (40s, target 1,100). The Moderator: one man in a window
//      cleaner's cradle on the side of the phone, with a very small net. He
//      follows where you're aiming, slowly, and catches what passes through
//      it. Three catches and he goes on lunch. Faster again.
//   4. Final push (35s, target 2,000 for approval). Everything, at full
//      speed, and fewer real people post. Beat the target and it's Approved.
// Between stages you pick one upgrade of three, each with a cost (UPGRADES):
// More fingers (bigger splash, slower reload), Bot farm (B: ten seconds of
// double engagement once a stage; targets up a tenth), Engagement bait
// (slopped posts keep paying while they're on screen; fewer real posts),
// Content calendar (fast reload, small splash), Rage bait (real posts pay
// more; more fact checks), Pay for reach (more trending posts; targets up a
// fifth), and before the final push, Lay off the moderator (no Moderator;
// twice the fact checks, out of spite).
//
// SCORING. Engagement: a real post 100 and a trending one 300, times the
// chain; slop 10 and a post you've already slopped 5. Bots double it all.
//
// THE LADDER. Approved: beat the final push's target. Pending review: got
// to the end. Not approved: funding pulled at stage 2 or 3. Rejected:
// funding pulled at stage 1.
//
// Built on the shared kit (/games/kit/kit.js) for the intro, screens,
// controls, sound and saving. art.js draws everything; this file is the
// feed, the shots, the stages, the score and the people shouting.
(function () {
  "use strict";

  var N = window.Notaste;
  var A = window.SlopArt;
  var root = document.getElementById("game-root");
  if (!N || !A || !root) return;

  var params = new URLSearchParams(window.location.search);
  var AUTO = N.flags.autopilot;      // ?autopilot or ?clip: the computer runs the cannon
  var DEBUG = params.has("debug");
  var FIRST = DEBUG ? Math.max(0, Math.min(3, (parseInt(params.get("stage"), 10) || 1) - 1)) : 0;
  var SLOPPY = DEBUG ? parseFloat(params.get("sloppy")) || 0 : 0;   // a clumsier autopilot, for tuning
  var PACE = DEBUG ? parseFloat(params.get("pace")) || 0 : 0;       // ...and a slower one: seconds between shots
  var RECKLESS = DEBUG && params.has("reckless");                    // ...and one that ignores the net and goes for fact checks

  // ---------------------------------------------------------------------------
  // Tuning. World units: 100 across the screen's shorter side. Speeds scale
  // with the screen's height (K), so a tall screen plays like a square one.
  // ---------------------------------------------------------------------------
  var GRAV = 160;              // units per second per second
  var VMIN = 48, VMAX = 182;   // launch speed at no charge and at full charge
  var SWEEP = 0.85;            // seconds for the charge to go from nothing to full (then back)
  var RELOAD = 0.5;
  var BALL_R = 2.8;
  var SPLASH = 2.2;            // how far past the point it lands a splash still gets a post
  var JAM = 1.5;
  var VIRAL = 5;               // hits in a row that make it go viral
  var BOTS_TIME = 10;
  var MOD_CATCHES = 3, MOD_LUNCH = 9, MOD_SPEED = 9;
  var AIM_SPEED = 1.3;         // radians a second, keys and stick
  var MIN_ANGLE = 0.1, MAX_ANGLE = 1.45;
  var POINTS = { real: 100, slop: 10, again: 5 };

  var STAGES = [
    { name: "The feed", time: 35, speed: 12, real: 0.7, trend: 0, fact: 0, mod: false, target: 600,
      clear: "Engagement is up. Nobody is sure what was engaged with." },
    { name: "Context added", time: 38, speed: 14, real: 0.64, trend: 0.2, fact: 0.16, mod: false, target: 1000,
      clear: "The fact checks added context. It was read by nobody." },
    { name: "Moderation", time: 40, speed: 16, real: 0.58, trend: 0.2, fact: 0.14, mod: true, target: 1100,
      clear: "The Moderator is on another lunch. He's earned it. He hasn't been paid for it." },
    { name: "Final push", time: 35, speed: 19, real: 0.5, trend: 0.28, fact: 0.16, mod: true, target: 2000, final: true }
  ];
  var LAST = STAGES.length - 1;

  // Between stages: something good and something bad, in that order
  var UPGRADES = [
    { id: "fingers", label: "More fingers", detail: "A much bigger splash. Each blob takes longer to load.",
      apply: function (m) { m.splash *= 1.9; m.reload *= 1.5; } },
    { id: "bots", label: "Bot farm", detail: function () { return (touching() ? "Tap Bots" : "Press B") + " for ten seconds of double engagement, once a stage. Targets go up a tenth."; },
      apply: function (m) { m.bots = true; m.target *= 1.1; } },
    { id: "bait", label: "Engagement bait", detail: "Slopped posts keep paying for as long as they're on screen. Fewer real people post.",
      apply: function (m) { m.linger = true; m.real *= 0.85; } },
    { id: "calendar", label: "Content calendar", detail: "Reload twice as fast. Every splash is smaller.",
      apply: function (m) { m.reload *= 0.5; m.splash *= 0.6; } },
    { id: "rage", label: "Rage bait", detail: "Real posts pay half as much again. Fact checks turn up twice as often.",
      apply: function (m) { m.realPay *= 1.5; m.fact *= 2; } },
    { id: "reach", label: "Pay for reach", detail: "Trending posts turn up twice as often. Targets go up a fifth.",
      apply: function (m) { m.trend *= 2; m.target *= 1.2; } },
    { id: "layoff", label: "Lay off the moderator", detail: "No more Moderator. Fact checks turn up twice as often, out of spite.", late: true,
      apply: function (m) { m.noMod = true; m.fact *= 2; } }
  ];

  // ---------------------------------------------------------------------------
  // The feed's contents, and what everyone says. Crude is fine, cruel isn't:
  // the people posting are never the joke, the slop is (DESIGN.md, section 2).
  // ---------------------------------------------------------------------------
  var NAMES = ["Sandra", "Big Dave", "Kev", "Maureen", "Trev", "Jodie", "Pat", "Gary", "Linda", "Raj", "Bev", "Craig",
               "Shaz", "Dot", "Wayne", "Gail", "Mo", "Tina", "Barry", "Priya"];
  var LOOKS = ["perm", "bald", "cap", "bun", "specs", "beanie", "fringe", "tache"];
  var REAL = {
    dinner: { caption: "Tea tonight.", slopped: "Type yes if you'd eat this.", says: ["That was my tea.", "Why's my dinner got fingers."] },
    cat: { caption: "Our Tigger.", slopped: "Rate this cat 1 to 10.", says: ["Tigger has four legs.", "That's not my cat."] },
    shed: { caption: "Finished the shed.", slopped: "He built it. Nobody clapped.", says: ["Took me three weekends, that.", "That's my shed, you plonker."] },
    cake: { caption: "Mum's 90th.", slopped: "She's 90. Nobody liked it.", says: ["She's 90. She's not got time for this.", "My mum's seen that now."] },
    carrot: { caption: "First carrot of the year.", slopped: "Grandad grew this. Share.", says: ["That's an organic carrot, you numpty.", "I've waited all year for that carrot."] },
    sunset: { caption: "Car park sunset.", slopped: "Nature is so real.", says: ["It was a nice sunset. Was.", "Oi. That was a sunset."] },
    dog: { caption: "Biscuit at the beach.", slopped: "This dog saved a town.", says: ["Biscuit does not melt.", "He's a good boy. Was."] },
    glove: { caption: "Found a glove. Yours?", slopped: "Rate this hand 1 to 10.", says: ["I was trying to return a glove.", "That's not even the right hand."] },
    beach: { caption: "Two weeks off. Finally.", slopped: "Why don't beaches trend.", says: ["I saved up for that.", "That was my holiday, you pillock."] }
  };
  var SAYS = ["Oi.", "Pillock.", "I posted that for my mum.", "Reported. Not that anyone reads them.",
              "Why's it got eleven fingers.", "Who is this.", "Absolute weapon.", "I'm telling my nan."];
  var TREND_SAYS = ["I was trending for a minute.", "My one good post.", "That was going viral. Properly."];
  var SLOP_NAMES = ["Daily Wow", "Real Pics 4821", "Amazing Hands", "Bread Facts", "Nature Is Wow", "Uplifting Page", "Grandad Builds", "So Real Daily"];
  var SLOP_CAPTIONS = ["Nobody clapped for this.", "Rate this hand 1 to 10.", "He carved this from bread.", "Type yes for this dog.",
                       "So real. So beautiful.", "Why doesn't this trend.", "Share if you remember bread.", "Made by a child. Allegedly."];
  var REACT_WORDS = ["So real", "Wow", "Amazing", "Beautiful", "Great work", "Yes", "Stunning", "Incredible"];

  var GAFFER = {
    start: ["More. Faster. Worse.", "The board wants numbers.", "Quality is not measured.", "Fire, you absolute weapon."],
    idle: ["Fire, you absolute weapon.", "The feed's not going to slop itself.", "I'm not paying you to aim."],
    floor: ["That's the floor, you plonker.", "The floor's not on the internet.", "Missed, you melon."],
    top: ["Lower, you lemon.", "Nobody's scrolled up there since Tuesday."],
    chin: ["That's the bezel, you melon.", "Hit the posts, not the phone."],
    already: ["That's already slop, you lemon.", "Slop on slop. Nobody can tell."],
    real: ["Lovely.", "That's content.", "Engagement.", "Beautiful. Horrible. Beautiful."],
    trend: ["Trending. Put it on my bonus.", "That's a trend now. Our trend."],
    viral: ["Viral. The board will be thrilled.", "That's the quarter sorted."],
    bounce: ["Nobody reads those.", "Context. Disgusting."],
    jam: ["Clean that up, you pillock.", "That's coming out of your wages."],
    caught: ["There's one of him. Go round him.", "He's got a net. We've got a cannon."],
    lunch: ["He's on lunch. Go.", "Moderator's out. Fire."],
    bots: ["The bots love it. The bots love everything."],
    met: ["Target met. Do it again, but worse."],
    missed: ["The board's pulled the funding.", "Pack it up. The board's seen enough dinners."]
  };
  var MOD_SAYS = {
    arrive: ["There's just me.", "I've got a net."],
    caught: ["Got one.", "That's one.", "Against the guidelines. Probably."],
    passed: ["Not paid enough for that one.", "There were forty of us in March."],
    lunch: ["Lunch.", "Back in forty minutes."]
  };

  // What each stage brings, said before it starts (shell.brief)
  function briefText(i) {
    var target = " Target: " + fmt(targetFor(i)) + ".";
    if (i === 0) {
      return (touching() ? "Hold a finger anywhere to aim and charge. Let go to fire. " : "Aim with the mouse or the arrow keys. Hold to charge, let go to fire. ") +
        "Real posts pay ten times what slop does, and five in a row goes viral. Slop breaks the chain." + target;
    }
    if (i === 1) return "Fact checks bounce slop straight back at the cannon: aim round them. Trending posts are worth triple." + target;
    if (i === 2) {
      return run.mods.noMod ? "The Moderator's been laid off already. Lots of fact checks." + target
        : "A Moderator with a tiny net. He follows where you aim, slowly, and catches what goes through it. Three catches and he goes on lunch." + target;
    }
    return "Everything at once, at full speed, and the real people are leaving. Beat the target for approval." + target;
  }

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  var shell = null, ctx = null, T = null;
  var W = 1, H = 1, DPR = 1, U = 1, WW = 100, WH = 100, K = 1;
  var L = {};                          // where everything sits (layout)
  var run = null;                      // the whole round's tallies
  var rng = Math.random;
  var feed = [], balls = [], fx = [], puddles = [], bubbles = [];
  var phase = "play", clock = 0, timeLeft = 0, wrapT = 0, flood = 0;
  var aim = 0.75, power = 0, powerDir = 1, charging = false, reload = 0, jam = 0, recoil = 0, swell = 0, chargeTick = 0;
  var held = false, heldId = null, lastMode = "mouse";
  var mod = null, gaffer = { shout: 0, slopped: 0, cool: 0, idle: 0 };
  var botsLeft = 0, botsUsed = false, prevBots = false;
  var noticed = false, hintNow = null, modSeen = 0;
  var shake = 0, signDays = 1214, signT = 0;
  var bg = null, hudEls = null, poses = {}, hudBox = null, hudAge = 0;
  var shown = 0, offers = [], auto = { target: null, ang: 0.8, charge: false, think: 0, slop: 0, careless: false, rest: 0, idle: 0, hold: 0 };
  var stage = 0;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function seededPick(list) { return list[Math.floor(rng() * list.length)]; }
  function fmt(n) { return Math.round(n).toLocaleString("en-GB"); }
  function touching() { return root.classList.contains("kit-touching"); }
  function stageInfo() { return STAGES[stage]; }
  function targetFor(i) { return Math.round(STAGES[i].target * (run ? run.mods.target : 1) / 10) * 10; }
  function feedSpeed() { return stageInfo().speed * run.mods.feed * K; }
  function short(n) {
    if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/, "") + "m";
    if (n >= 1000) return (n / 1000).toFixed(n >= 1e4 ? 0 : 1).replace(/\.0$/, "") + "k";
    return String(Math.round(n));
  }

  // ---------------------------------------------------------------------------
  // Layout. The phone takes the right of the screen, standing on the floor
  // with its top somewhere above the screen. The cannon and the Gaffer are
  // bottom left, the vat behind them.
  // ---------------------------------------------------------------------------
  function layout() {
    var old = L.sy1;
    L.floor = WH - 7;
    L.phoneW = clamp(WW * 0.43, 42, 60);
    L.phoneX = WW - L.phoneW - 2.4;
    L.phoneR = L.phoneX + L.phoneW;
    L.bezel = 2.6;
    L.sx0 = L.phoneX + L.bezel;
    L.sx1 = L.phoneR - L.bezel;
    L.sy1 = L.floor - 6.2;              // the bottom of the phone's screen
    L.head = L.head || 19;              // the app's header across the top, under the score
    L.cardX = L.sx0 + 1.4;
    L.cardW = L.sx1 - L.sx0 - 2.8;
    L.cardH = clamp(L.cardW * 0.6, 22, 27);
    L.gap = 2;
    L.pivot = { x: clamp(WW * 0.2, 20, 30), y: L.floor - 7 };
    L.gaffer = { x: L.pivot.x - 11.5, y: L.floor };
    L.vat = { x: -1, y: L.floor - 50, w: 15, h: 50 };
    L.sign = { x: 14, y: Math.max(33, L.vat.y - 9) };   // on the wall above the vat, under the HUD
    // the Moderator's cradle straddles the phone's left edge
    L.modX = L.phoneX - 3.4;
    L.modTop = 30 - A.NET.y;
    L.modBottom = L.floor - 0.5;
    L.modHome = (L.modTop + L.modBottom) / 2;
    K = Math.max(1, WH / 100);
    // keep the feed where it was, relative to the bottom of the screen
    if (old != null && old !== L.sy1) feed.forEach(function (p) { p.y += L.sy1 - old; });
  }

  function muzzleAt(ang) {
    return { x: L.pivot.x + Math.cos(ang) * (A.BARREL + 0.6), y: L.pivot.y - Math.sin(ang) * (A.BARREL + 0.6) };
  }

  // ---------------------------------------------------------------------------
  // The round
  // ---------------------------------------------------------------------------
  function newMods() {
    return { splash: 1, reload: 1, feed: 1, real: 1, trend: 1, fact: 1, target: 1, realPay: 1, bots: false, noMod: false, linger: false };
  }

  function reset(sh) {
    shell = sh;
    T = sh.tokens;
    lastKind = null;
    sinceFact = 9;
    rng = N.seeded((sh.seed + 1) | 0);   // the posts already on screen
    run = {
      score: 0, stageScore: 0, chain: 0, bestChain: 0, shots: 0, hits: 0, realSlopped: 0, trends: 0,
      caught: 0, bounced: 0, virals: 0, seen: 0, slopSeen: 0, mods: newMods(), taken: [],
      learned: {}, daily: sh.daily, reached: 0, breaks: {}
    };
    stage = FIRST;
    // ?debug&take=bait,bots: start with these upgrades already picked
    if (DEBUG && params.get("take")) {
      params.get("take").split(",").forEach(function (id) {
        UPGRADES.forEach(function (u) { if (u.id === id) { run.taken.push(id); u.apply(run.mods); } });
      });
    }
    shown = 0;
    feed = [];
    fillFeed(true);
    startStage();
    if (!hudEls) buildHud();
    paintHud(0);
  }

  // Each stage's feed (and each choice of upgrades) has its own random from
  // the round's seed, so today's run scrolls the same posts past everyone
  // however their frames happen to fall.
  function stageRandom(i) { return N.seeded((shell.seed + (i + 1) * 104729) | 0); }

  function startStage() {
    var st = stageInfo();
    rng = stageRandom(stage);
    phase = "play";
    clock = 0;
    timeLeft = st.time;
    wrapT = 0;
    flood = 0;
    balls = [];
    feed.forEach(function (q) { q.incoming = 0; });
    puddles = puddles.filter(function (p) { return p.t < 4; });
    charging = false;
    held = false;
    power = 0;
    reload = 0.2;
    jam = 0;
    run.stageScore = 0;
    run.chain = 0;
    run.reached = stage;
    botsLeft = 0;
    botsUsed = false;
    noticed = false;
    modSeen = 0;
    gaffer.slopped = 0;
    signDays = stage ? signDays : 1214;
    mod = st.mod && !run.mods.noMod ? { state: "in", y: -20, seek: L.modHome, catches: 0, lunch: 0, swing: 0, full: 0, said: false } : null;
    var botPad = root.querySelector('.kit-pad[data-key="bots"]');
    if (botPad) botPad.style.display = run.mods.bots ? "" : "none";
    if (hudEls) hudEls.bots.style.display = run.mods.bots ? "" : "none";
    auto.target = null;
    auto.charge = false;
    auto.think = 0.4;
  }

  // ---------------------------------------------------------------------------
  // The feed. Everything in it comes from shell.random, so today's run
  // scrolls the same posts past everyone.
  // ---------------------------------------------------------------------------
  var lastKind = null, sinceFact = 9;
  function makePost() {
    var st = stageInfo(), m = run.mods;
    var factP = Math.min(0.4, st.fact * m.fact);
    sinceFact++;
    if (factP > 0 && sinceFact > 2 && rng() < factP) { sinceFact = 0; return { type: "fact" }; }
    if (rng() < Math.min(0.9, st.real * m.real)) {
      var kinds = A.KINDS.filter(function (k) { return k !== lastKind; });
      var kind = kinds[Math.floor(rng() * kinds.length)];
      lastKind = kind;
      var trending = rng() < Math.min(0.6, st.trend * m.trend);
      return { type: "real", kind: kind, name: seededPick(NAMES), look: seededPick(LOOKS), caption: REAL[kind].caption,
               trending: trending, likes: trending ? 1200 + Math.floor(rng() * 8000) : 2 + Math.floor(rng() * 40) };
    }
    return { type: "slop", item: seededPick(A.ITEMS), name: seededPick(SLOP_NAMES), caption: seededPick(SLOP_CAPTIONS),
             likes: 12000 + Math.floor(rng() * 80000) };
  }

  function fillFeed(fresh) {
    var last = feed[feed.length - 1];
    var y = last ? last.y + L.cardH + L.gap : (fresh ? 4 : L.sy1 + 2);
    while (y < L.sy1 + L.cardH + 6) {
      var p = makePost();
      p.y = y;
      p.likesShown = p.likes;
      p.id = Math.random();
      feed.push(p);
      y += L.cardH + L.gap;
    }
  }

  function scrollFeed(dt) {
    var v = feedSpeed() * dt;
    feed.forEach(function (p) { p.y -= v; });
    while (feed.length && feed[0].y + L.cardH < -L.cardH) countSeen(feed.shift());
    fillFeed(false);
  }

  function countSeen(p) {
    if (p.type === "fact" || p.counted) return;
    p.counted = true;
    run.seen++;
    if (p.type === "slop" || p.slopped) run.slopSeen++;
  }

  // How much of what's been on screen is slop now, as a percentage
  function slopShare() {
    var seen = run.seen, slop = run.slopSeen;
    feed.forEach(function (p) {
      if (p.type === "fact" || p.counted || p.y > L.sy1 - L.cardH * 0.5) return;
      seen++;
      if (p.type === "slop" || p.slopped) slop++;
    });
    return seen ? Math.round(slop / seen * 100) : 0;
  }

  // ---------------------------------------------------------------------------
  // Shots. A ball's position is worked out from when and where it left, so
  // the dotted arc and the real thing always agree.
  // ---------------------------------------------------------------------------
  function path(x0, y0, vx, vy, land) {
    var g = GRAV * K;
    var tc = vx > 0 ? (L.phoneX - x0) / vx : Infinity;
    var yf = land != null ? land : L.floor - BALL_R * 0.6;
    var tf = (vy + Math.sqrt(Math.max(0, vy * vy + 2 * g * (yf - y0)))) / g;
    var tl = vx < 0 ? (-14 - x0) / vx : Infinity;
    var end = Math.min(tc, tf, tl);
    return { x0: x0, y0: y0, vx: vx, vy: vy, tc: tc, tf: tf, tl: tl, end: end,
             what: end === tc ? "phone" : end === tf ? "floor" : "gone" };
  }
  function at(b, t) {
    return { x: b.x0 + b.vx * t, y: b.y0 - b.vy * t + 0.5 * GRAV * K * t * t };
  }

  function launchSpeed(p) { return (VMIN + p * (VMAX - VMIN)) * K; }

  function fire() {
    // the same arc the dots showed, and the post it's heading for
    var b = preview();
    var mz = muzzleAt(aim);
    b.t = 0;
    b.kind = pick(A.ITEMS);
    b.wob = Math.random();
    b.spin = rand(-0.4, 0.4);
    if (b.target) b.target.incoming = (b.target.incoming || 0) + 1;
    // aimed at a real post nobody else was already slopping: if it gets slopped
    // by something else first, landing on it doesn't count against you
    b.fresh = !!(b.target && b.target.type === "real" && !b.target.slopped && b.target.incoming === 1);
    balls.push(b);
    run.shots++;
    run.learned.fire = true;
    reload = RELOAD * run.mods.reload;
    recoil = 2.2;
    gaffer.idle = 0;
    if (!shell.reduceMotion) shake = Math.max(shake, 0.25);
    sfx.fire();
    puff(mz.x + Math.cos(aim) * 2, mz.y - Math.sin(aim) * 2, 5);
  }

  function updateBalls(dt) {
    for (var i = balls.length - 1; i >= 0; i--) {
      var b = balls[i];
      var t0 = b.t;
      b.t += dt;
      b.wob += dt * 3;
      // drips off the back
      if (Math.random() < dt * 14) {
        var q = at(b, b.t);
        fx.push({ kind: "drop", x: q.x + rand(-1, 1), y: q.y + rand(-1, 1), vx: b.vx * 0.1, vy: rand(-4, 4), t: 0, life: 0.5, r: rand(0.5, 1.1) });
      }
      // the Moderator's net
      if (mod && mod.state === "work" && !b.bounced) {
        var p = at(b, b.t), hx = L.modX + A.NET.x, hy = mod.y + A.NET.y;
        if (Math.hypot(p.x - hx, (p.y - hy) * 1.3) < A.NET.r + BALL_R * 0.6) { arrived(b); caught(b); balls.splice(i, 1); continue; }
        if (!b.passed && t0 < b.end && p.x > hx + 3) { b.passed = true; if (Math.abs(p.y - hy) < 12 && Math.random() < 0.3) say(modSpeaker, pick(MOD_SAYS.passed)); }
      }
      if (b.t >= b.end) {
        balls.splice(i, 1);
        land(b);
      }
    }
  }

  // A ball's done: whatever it was heading for isn't expecting it any more
  function arrived(b) {
    if (b.target) { b.target.incoming = Math.max(0, (b.target.incoming || 0) - 1); b.target = null; }
  }

  function land(b) {
    arrived(b);
    var p = at(b, b.end);
    if (b.what === "phone") {
      if (p.y < L.head) {
        miss(b, "top", p);
      } else if (p.y > L.sy1) {
        puddles.push({ x: L.phoneX + rand(1, 3), y: clamp(p.y, L.sy1 + 1, L.floor - 1), r: 2.4, t: 0, wall: true });
        splash(p.x, p.y, 6);
        miss(b, "chin", p);
      } else {
        impact(b, p);
      }
    } else if (b.what === "floor") {
      puddles.push({ x: p.x, y: L.floor + 0.6, r: rand(2.6, 3.6), t: 0 });
      splash(p.x, p.y, 5);
      sfx.floor();
      if (b.bounced) {
        if (Math.abs(p.x - L.pivot.x) < 9 && phase === "play") {
          jam = JAM;
          charging = false;
          shell.callout("Cannon: slopped", { sound: false, ms: 1200 });
          sfx.jam();
          gafferSay(GAFFER.jam, true);
          if (!shell.reduceMotion) shake = Math.max(shake, 0.6);
        } else if (Math.abs(p.x - L.gaffer.x) < 7) {
          gaffer.slopped = 8;
          gafferSay(["Nobody saw that.", "Not a word."], true);
        }
      } else miss(b, "floor", p);
    }
  }

  function miss(b, where, p) {
    if (b.bounced) return;
    breakChain("miss " + where);
    if (where === "top") {
      if (!run.learned.top) { run.learned.top = true; shell.callout("Nobody saw it", { sound: false, ms: 1100 }); }
      gafferSay(GAFFER.top);
    } else if (where === "chin") {
      gafferSay(GAFFER.chin);
      sfx.floor();
    } else {
      gafferSay(GAFFER.floor);
    }
  }

  function breakChain(why) {
    if (run.chain && DEBUG) run.breaks[why] = (run.breaks[why] || 0) + 1;
    run.chain = 0;
  }

  // A ball reaches the feed: slop whatever's there, or bounce off a fact check
  function impact(b, p) {
    var y = p.y, rs = SPLASH * run.mods.splash;
    var fact = null, hits = [];
    feed.forEach(function (q) {
      if (q.type === "fact") { if (y >= q.y - 0.6 && y <= q.y + L.cardH + 0.6) fact = q; return; }
      if (y >= q.y - rs && y <= q.y + L.cardH + rs) hits.push(q);
    });
    splash(L.phoneX + 1, y, 10);
    if (fact) { bounce(b, p, fact); return; }
    if (!hits.length) { miss(b, "floor", p); return; }
    sfx.splat();
    run.hits++;
    var mult = chainMult();
    // the one nearest the middle of the splash gets the big reaction
    hits.sort(function (a, c) { return Math.abs(a.y + L.cardH / 2 - y) - Math.abs(c.y + L.cardH / 2 - y); });
    var total = 0, wasReal = false, wasTrend = false;
    hits.forEach(function (q) {
      var r = slopPost(q, b.kind, mult);
      total += r.points;
      if (r.real) wasReal = true;
      if (r.trend) wasTrend = true;
    });
    pop(L.phoneX - 1, y, "+" + fmt(total), wasTrend || total >= 200);
    // only real posts keep the chain going: slop on slop breaks it
    if (wasReal) {
      run.chain++;
      run.bestChain = Math.max(run.bestChain, run.chain);
      if (run.chain % VIRAL === 0) viral(hits[0], chainMult());
      else if (wasTrend) { shell.callout("Trend: hijacked", { sound: false, ms: 1200 }); gafferSay(GAFFER.trend, true); }
      else gafferSay(GAFFER.real);
    } else if (b.fresh) {
      // it was real when you fired; your own splash got there first. No harm done.
      gafferSay(GAFFER.already);
    } else {
      var had = run.chain;
      breakChain("slop");
      if (had >= 2 && !run.learned.already) {
        run.learned.already = true;
        shell.callout("Slop on slop", { sound: false, ms: 1100 });
        gafferSay(GAFFER.already, true);
      } else gafferSay(GAFFER.already, had >= 2);
    }
  }

  function chainMult() { return 1 + 0.25 * Math.min(run.chain, 8); }

  // What a post is worth to slop right now (the arc's tag says the same).
  // The chain multiplies real posts only.
  function worth(q, mult) {
    if (q.type === "fact") return 0;
    var bots = botsLeft > 0 ? 2 : 1;
    if (q.type === "slop") return POINTS.slop * bots;
    if (q.slopped) return POINTS.again * bots;
    return Math.round(POINTS.real * run.mods.realPay * (q.trending ? 3 : 1) * mult * bots);
  }

  function slopPost(q, kind, mult) {
    var pts = worth(q, mult);
    var out = { points: pts, real: false, trend: false, slop: false };
    run.score += pts;
    run.stageScore += pts;
    var big = 3;
    if (q.type === "real" && !q.slopped) {
      out.real = true;
      out.trend = !!q.trending;
      q.slopped = kind;
      q.slopCaption = REAL[q.kind].slopped;
      q.img = null;
      q.likes += q.trending ? 40000 + Math.floor(Math.random() * 60000) : 6000 + Math.floor(Math.random() * 30000);
      run.realSlopped++;
      run.learned.real = true;
      if (q.trending) { run.trends++; run.learned.trend = true; }
      big = q.trending ? 14 : 8;
      if (Math.random() < 0.6) say(posterSpeaker(q), pick(q.trending ? TREND_SAYS.concat(REAL[q.kind].says) : REAL[q.kind].says.concat(REAL[q.kind].says, SAYS)));
    } else {
      out.slop = true;
      q.likes += 900 + Math.floor(Math.random() * 4000);
    }
    react(q, big);
    q.flash = 0.35;
    return out;
  }

  // Every fifth hit in a row: the slop spreads to the posts either side
  function viral(q, mult) {
    run.virals++;
    var i = feed.indexOf(q), total = 0;
    [i - 1, i + 1, i - 2, i + 2].forEach(function (j, n) {
      var o = feed[j];
      if (!o || o.type === "fact" || (n > 1 && run.mods.splash < 1.5)) return;
      if (o.y < L.head - 4 || o.y + L.cardH > L.sy1 + 4) return;
      fx.push({ kind: "zap", x: L.cardX + L.cardW * 0.5, y0: q.y + L.cardH / 2, y1: o.y + L.cardH / 2, t: 0, life: 0.6 });
      total += slopPost(o, pick(A.ITEMS), mult).points;
    });
    if (total) pop(L.cardX + L.cardW * 0.5, q.y - 2, "+" + fmt(total), true);
    shell.callout("Gone viral", { sound: false, ms: 1300 });
    sfx.viral();
    gafferSay(GAFFER.viral, true);
  }

  // A fact check sends it straight back: at the cannon, mostly, and now and
  // then at the Gaffer
  function bounce(b, p, fact) {
    var g = GRAV * K;
    var atCannon = Math.random() < 0.75;
    var x0 = L.phoneX - BALL_R, tx = atCannon ? L.pivot.x + rand(-1, 4) : L.gaffer.x + rand(-1, 1);
    var yf = atCannon ? L.pivot.y - 3 : L.gaffer.y - 34;     // on the barrel, or on his head
    var T = clamp((x0 - tx) / (60 * K), 0.6, 1.2);
    var nb = path(x0, p.y, (tx - x0) / T, (p.y - yf + 0.5 * g * T * T) / T, yf);
    nb.t = 0;
    nb.kind = b.kind;
    nb.wob = b.wob;
    nb.spin = -b.spin;
    nb.bounced = true;
    balls.push(nb);
    run.bounced++;
    breakChain("bounce");
    signDays = 0;
    signT = 0;
    fact.flash = 0.5;
    fact.bounces = (fact.bounces || 0) + 1;
    shell.callout("Context added", { sound: false, ms: 1200 });
    sfx.bounce();
    gafferSay(GAFFER.bounce, true);
  }

  function caught(b) {
    var p = at(b, b.t);
    splash(p.x, p.y, 4);
    run.caught++;
    breakChain("caught");
    mod.catches++;
    mod.swing = 1;
    mod.full = 1.2;
    sfx.catchIt();
    if (mod.catches >= MOD_CATCHES) {
      mod.state = "lunch";
      mod.lunch = MOD_LUNCH;
      shell.callout("Moderator: on lunch", { sound: false, ms: 1400 });
      say(modSpeaker, pick(MOD_SAYS.lunch), true);
      sfx.lunch();
      window.setTimeout(function () { gafferSay(GAFFER.lunch, true); }, 900);
    } else {
      shell.callout(mod.catches === 1 ? "Moderated" : "Moderated. Again", { sound: false, ms: 1000 });
      say(modSpeaker, pick(MOD_SAYS.caught), true);
      if (mod.catches === 1) gafferSay(GAFFER.caught, true);
    }
    run.learned.mod = true;
  }

  // ---------------------------------------------------------------------------
  // The Moderator: follows where you're aiming, slowly, and goes on lunch
  // ---------------------------------------------------------------------------
  function updateMod(dt, preview) {
    if (!mod) return;
    mod.swing = Math.max(0, mod.swing - dt * 2.5);
    mod.full = Math.max(0, mod.full - dt);
    var speed = (stage === LAST ? MOD_SPEED * 1.2 : MOD_SPEED) * K;
    if (mod.state === "in") {
      mod.y += 40 * K * dt;
      if (mod.y >= L.modHome) {
        mod.y = L.modHome;
        mod.state = "work";
        mod.catches = 0;
        if (!mod.said) { mod.said = true; say(modSpeaker, pick(MOD_SAYS.arrive), true); }
      }
      return;
    }
    if (mod.state === "lunch") {
      if (mod.y > -30) mod.y -= 45 * K * dt;
      mod.lunch -= dt;
      if (mod.lunch <= 0) { mod.state = "in"; mod.y = -30; }
      return;
    }
    // work: head for where the next shot will cross, or where the arc says
    var want = null, soonest = Infinity;
    balls.forEach(function (b) {
      if (b.bounced || b.modY == null || b.t > b.end) return;
      if (b.end - b.t < soonest) { soonest = b.end - b.t; want = b.modY; }
    });
    if (want == null && preview && preview.modY != null) want = preview.modY;
    if (want == null) want = mod.seek;
    mod.seek += (want - mod.seek) * Math.min(1, dt * 1.6);
    var goal = clamp(mod.seek - A.NET.y, L.modTop, L.modBottom);
    mod.y += clamp(goal - mod.y, -speed * dt, speed * dt);
  }

  // ---------------------------------------------------------------------------
  // Effects: splashes, reactions, smoke, puddles, the score popping up
  // ---------------------------------------------------------------------------
  function splash(x, y, n) {
    for (var i = 0; i < n; i++) {
      var a = rand(Math.PI * 0.55, Math.PI * 1.45), s = rand(10, 34);
      fx.push({ kind: "drop", x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 12, t: 0, life: rand(0.4, 0.75), r: rand(0.6, 1.5), grav: true });
    }
  }
  function react(q, n) {
    var cy = q.y + L.cardH * 0.5;
    for (var i = 0; i < n; i++) {
      var word = Math.random() < 0.38;
      fx.push({ kind: "react", word: word ? pick(REACT_WORDS) : null, x: L.cardX + rand(2, L.cardW * 0.6), y: cy + rand(-4, 4),
                vx: rand(-26, -4), vy: rand(-28, -10), t: -i * 0.06, life: rand(1, 1.5), r: rand(1.3, 2) });
    }
  }
  function puff(x, y, n) {
    var blobs = [];
    for (var i = 0; i < n; i++) blobs.push({ x: rand(-3, 3), y: rand(-2.5, 2.5), r: rand(1.4, 2.6) });
    fx.push({ kind: "puff", x: x, y: y, blobs: blobs, t: 0, life: 0.7 });
  }
  function pop(x, y, words, big) {
    fx.push({ kind: "pop", x: x, y: y, text: words, big: big, t: 0, life: 1.1 });
  }
  function tickFx(dt) {
    for (var i = fx.length - 1; i >= 0; i--) {
      var e = fx[i];
      e.t += dt;
      if (e.t >= e.life) { fx.splice(i, 1); continue; }
      if (e.t < 0) continue;
      if (e.kind === "drop") {
        e.x += e.vx * dt; e.y += e.vy * dt;
        if (e.grav) e.vy += 90 * dt;
      } else if (e.kind === "react") {
        e.x += e.vx * dt; e.y += e.vy * dt;
        e.vx *= 1 - dt * 1.5; e.vy *= 1 - dt * 0.8;
      }
    }
    if (fx.length > 140) fx.splice(0, fx.length - 140);
    puddles.forEach(function (p) { p.t += dt; });
    puddles = puddles.filter(function (p) { return p.t < 10; });
  }

  // ---------------------------------------------------------------------------
  // Speech bubbles: at most three, one per speaker (DESIGN.md, section 7)
  // ---------------------------------------------------------------------------
  var gafferSpeaker = { at: function () { return { x: L.gaffer.x + 1, y: L.gaffer.y - 36 }; }, side: "up", name: "gaffer" };
  var modSpeaker = { at: function () { return { x: L.modX - 1, y: mod ? mod.y - 23 : -50 }; }, side: "up", name: "mod" };
  function posterSpeaker(q) {
    return { at: function () { return { x: L.cardX + 3.9, y: q.y + 3.9 }; }, side: "left", name: q.id, card: q };
  }
  function say(who, words, force) {
    if (!who || !words) return;
    for (var j = 0; j < bubbles.length; j++) if (bubbles[j].text === words) return;
    for (var i = 0; i < bubbles.length; i++) if (bubbles[i].who.name === who.name) { if (!force) return; bubbles.splice(i, 1); break; }
    if (bubbles.length >= 3) { if (!force) return; bubbles.shift(); }
    bubbles.push({ who: who, text: words, t: 0, life: 2 + words.length * 0.035 });
    if (who === gafferSpeaker) gaffer.shout = Math.min(1.6, 0.9 + words.length * 0.02);
  }
  function gafferSay(list, force) {
    if (!force && gaffer.cool > 0) return;
    if (!force && Math.random() < 0.45) return;
    gaffer.cool = 3.5;
    say(gafferSpeaker, pick(list), force);
  }
  function tickBubbles(dt) {
    bubbles.forEach(function (b) { b.t += dt; });
    bubbles = bubbles.filter(function (b) {
      if (b.t >= b.life) return false;
      if (b.who.card && (b.who.card.y + L.cardH < 2 || feed.indexOf(b.who.card) < 0)) return false;
      if (b.who === modSpeaker && (!mod || mod.y < 0)) return false;
      return true;
    });
  }

  // ---------------------------------------------------------------------------
  // Sound, made in code (DESIGN.md, section 9)
  // ---------------------------------------------------------------------------
  var S = N.sound;
  var sfx = {
    charge: function (p) { S.tone(170 + p * 560, 0.05, { type: "square", vol: 0.022 }); },
    fire: function () {
      S.tone(120, 0.24, { type: "sawtooth", slide: 42, vol: 0.11 });
      S.noise(0.28, { freq: 520, vol: 0.24 });
    },
    splat: function () {
      S.noise(0.16, { type: "bandpass", freq: 900, q: 1.3, vol: 0.24 });
      S.tone(440, 0.14, { type: "square", slide: 110, vol: 0.05 });
      for (var i = 0; i < 3; i++) S.tone(1400 + i * 260, 0.04, { vol: 0.025, delay: 0.1 + i * 0.05 });
    },
    floor: function () {
      S.noise(0.2, { freq: 380, vol: 0.18 });
      S.tone(170, 0.12, { type: "square", slide: 70, vol: 0.05 });
    },
    bounce: function () { S.tone(230, 0.24, { type: "triangle", slide: 760, vol: 0.1 }); S.tone(760, 0.16, { type: "triangle", slide: 300, vol: 0.05, delay: 0.2 }); },
    catchIt: function () { S.noise(0.12, { type: "highpass", freq: 3000, vol: 0.12 }); S.tone(880, 0.08, { vol: 0.05, delay: 0.07 }); },
    viral: function () { [523, 659, 784, 1047, 1319].forEach(function (f, i) { S.tone(f, 0.12, { vol: 0.05, delay: i * 0.065 }); }); },
    jam: function () { S.tone(92, 0.45, { type: "sawtooth", vol: 0.08 }); S.noise(0.3, { freq: 300, vol: 0.14 }); },
    lunch: function () { S.tone(1568, 0.25, { type: "triangle", vol: 0.05 }); S.tone(1318, 0.4, { type: "triangle", vol: 0.05, delay: 0.2 }); },
    bots: function () { for (var i = 0; i < 8; i++) S.tone(1800 + (i % 3) * 300, 0.03, { vol: 0.03, delay: i * 0.045 }); },
    ready: function () { S.tone(660, 0.04, { vol: 0.025 }); }
  };

  // ---------------------------------------------------------------------------
  // Each frame
  // ---------------------------------------------------------------------------
  function update(dt, input) {
    if (!run) return;
    gaffer.shout = Math.max(0, gaffer.shout - dt);
    gaffer.cool = Math.max(0, gaffer.cool - dt);
    gaffer.slopped = Math.max(0, gaffer.slopped - dt);
    recoil = Math.max(0, recoil - dt * 12);
    shake = Math.max(0, shake - dt * 3);
    feed.forEach(function (p) {
      if (p.flash) p.flash = Math.max(0, p.flash - dt);
      if (p.likesShown < p.likes) p.likesShown = Math.min(p.likes, p.likesShown + Math.max(1, (p.likes - p.likesShown) * dt * 3));
    });
    tickFx(dt);
    tickBubbles(dt);

    if (phase === "finale") {
      flood = Math.min(1, flood + dt / 1.6);
      wrapT += dt;
      if (wrapT >= 1.3) { phase = "over"; end(run.finalMet ? "approved" : "done"); }
      return;
    }
    if (phase === "over") return;
    if (phase === "between") {
      scrollFeed(dt * 0.5);
      updateBalls(dt);
      return;
    }

    clock += dt;
    signT += dt;
    if (signT > 1) { signT = 0; signDays++; }
    scrollFeed(dt);
    updateBalls(dt);
    if (run.mods.linger && phase === "play") {
      // engagement bait: slopped posts keep paying while anyone can see them
      feed.forEach(function (q) {
        if (!q.slopped || q.y + L.cardH < L.head || q.y > L.sy1) return;
        q.linger = (q.linger || 0) + dt;
        if (q.linger >= 0.5) {
          q.linger -= 0.5;
          var pts = 10 * (botsLeft > 0 ? 2 : 1);
          run.score += pts;
          run.stageScore += pts;
          q.likes += 400;
          fx.push({ kind: "react", x: L.cardX + rand(4, L.cardW * 0.5), y: q.y + L.cardH * 0.5, vx: rand(-14, -4), vy: rand(-18, -8), t: 0, life: 1, r: 1.2 });
        }
      });
    }
    if (botsLeft > 0) {
      botsLeft = Math.max(0, botsLeft - dt);
      if (Math.random() < dt * 3.5) fx.push({ kind: "react", word: "Bot", x: L.sx1 - rand(3, 8), y: L.sy1 - rand(0, 6), vx: rand(-3, 1), vy: rand(-30, -18), t: 0, life: 1.6, r: 1.6, bot: true });
    }

    if (phase === "wrap") {
      wrapT += dt;
      updateMod(dt, null);
      if ((!balls.length && wrapT > 0.6) || wrapT > 3) stageEnd();
      return;
    }

    timeLeft = Math.max(0, timeLeft - dt);
    var a = AUTO ? autopilot(dt) : null;

    // aim: a pointer points the barrel at itself; keys and a stick swing it
    if (a) {
      aim += clamp(a.ang - aim, -AIM_SPEED * 1.8 * dt, AIM_SPEED * 1.8 * dt);
    } else if (input.aim.on) {
      var ax = input.aim.x / U, ay = input.aim.y / U;
      var want = Math.atan2(L.pivot.y - ay, Math.max(0.5, ax - L.pivot.x));
      aim = want;
      lastMode = input.mode === "touch" ? "touch" : "mouse";
    } else {
      var turn = (input.up || input.left ? 1 : 0) - (input.down || input.right ? 1 : 0) - (input.stick.y || 0);
      if (turn) { aim += clamp(turn, -1, 1) * AIM_SPEED * dt; lastMode = "keys"; }
    }
    aim = clamp(aim, MIN_ANGLE, MAX_ANGLE);

    // load, charge, fire
    var wasLoaded = reload <= 0 && jam <= 0;
    reload = Math.max(0, reload - dt);
    jam = Math.max(0, jam - dt);
    var loaded = reload <= 0 && jam <= 0;
    if (loaded && !wasLoaded) sfx.ready();
    var want2 = loaded && (a ? a.charge : (held || input.action));
    if (want2) {
      if (!charging) { charging = true; power = 0; powerDir = 1; chargeTick = 0; }
      power += powerDir * dt / SWEEP;
      if (power >= 1) { power = 2 - power; powerDir = -1; }
      if (power <= 0) { power = -power; powerDir = 1; }
      chargeTick -= dt;
      if (chargeTick <= 0) { chargeTick = 0.07; sfx.charge(power); }
    } else if (charging) {
      charging = false;
      if (loaded) fire();
    }
    swell += ((charging ? power : 0) - swell) * Math.min(1, dt * 14);

    // bots, once a stage
    var botsNow = a ? a.bots : input.bots;
    if (botsNow && !prevBots && run.mods.bots && !botsUsed) {
      botsUsed = true;
      botsLeft = BOTS_TIME;
      run.learned.bots = true;
      shell.callout("Bots: deployed", { sound: false, ms: 1200 });
      sfx.bots();
      gafferSay(GAFFER.bots, true);
    }
    prevBots = botsNow;

    updateMod(dt, charging ? preview() : null);
    pickHint(dt);

    // the Gaffer gets impatient
    gaffer.idle += dt;
    if (gaffer.idle > 5) { gaffer.idle = -3; gafferSay(GAFFER.idle, true); }
    if (clock > 0.6 && clock - dt <= 0.6) gafferSay(stage === 0 ? GAFFER.start : GAFFER.start.slice(0, 3), true);

    if (timeLeft <= 0) { phase = "wrap"; wrapT = 0; charging = false; }
    paintHud(dt);
  }

  // The arc as it stands, and the post it'll land on by the time it gets
  // there (the feed keeps moving while it flies)
  function preview() {
    var v = launchSpeed(power);
    var mz = muzzleAt(aim);
    var b = path(mz.x, mz.y, Math.cos(aim) * v, Math.sin(aim) * v);
    b.target = null;
    b.modY = null;
    if (mod) {
      var tx = (L.modX + A.NET.x - b.x0) / b.vx;
      if (tx > 0 && tx < b.end) b.modY = at(b, tx).y;
    }
    if (b.what === "phone") {
      var y = at(b, b.end).y;
      b.hitY = y;
      if (y >= L.head && y <= L.sy1) {
        var ahead = y + feedSpeed() * b.end, rs = SPLASH * run.mods.splash, best = null, bestD = Infinity;
        feed.forEach(function (q) {
          var inside = q.type === "fact" ? (ahead >= q.y - 0.6 && ahead <= q.y + L.cardH + 0.6) : (ahead >= q.y - rs && ahead <= q.y + L.cardH + rs);
          if (!inside) return;
          var d = q.type === "fact" ? -1 : Math.abs(q.y + L.cardH / 2 - ahead);
          if (d < bestD) { bestD = d; best = q; }
        });
        b.target = best;
      }
    }
    return b;
  }

  function stageEnd() {
    if (phase !== "wrap") return;
    var st = stageInfo();
    var target = targetFor(stage);
    var met = run.stageScore >= target;
    if (st.final) {
      // the slop floods the phone, and then the results (timed in update, so pausing holds it)
      phase = "finale";
      run.finalMet = met;
      wrapT = 0;
      shell.callout(met ? "Nobody can tell" : "Close enough", { ms: 1600 });
      return;
    }
    if (!met) {
      phase = "between";
      shell.callout("Target: missed", { ms: 1500 });
      gafferSay(GAFFER.missed, true);
      end("pulled");
      return;
    }
    phase = "between";
    shell.callout("Target: met", { ms: 1100 });
    gafferSay(GAFFER.met, true);
    rng = N.seeded((shell.seed + 7 + stage * 7919) | 0);
    offers = offer();
    var next = stage + 1;
    var stats = [
      { label: "Engagement", value: fmt(run.stageScore) },
      { label: "Target", value: fmt(target) },
      { label: "Feed", value: slopShare() + "% slop" },
      { label: "Best chain", value: String(run.bestChain) },
      { label: "Total", value: fmt(run.score) }
    ];
    var easy = run.stageScore >= target * 1.4;
    shell.interlude({
      stamp: easy ? "Approved" : "Pending review",
      tilt: easy ? -5 : 4,
      heading: "Stage " + (stage + 1) + " complete.",
      line: st.clear,
      stats: stats,
      ask: (STAGES[next].final ? "Final push next." : "Stage " + (next + 1) + ": " + STAGES[next].name + ".") + " Pick an upgrade.",
      choices: offers.map(function (u) { return { label: u.label, detail: typeof u.detail === "function" ? u.detail() : u.detail }; }),
      delay: 1500
    }).then(function (i) {
      var u = offers[i] || offers[0];
      if (u) { run.taken.push(u.id); u.apply(run.mods); }
      stage = next;
      startStage();
      shell.next();
    });
  }

  // Three upgrades you haven't taken, from the run's seed. Before the final
  // push, laying off the Moderator is always one of them.
  function offer() {
    var late = stage + 1 === LAST && !run.mods.noMod;
    var pool = UPGRADES.filter(function (u) { return run.taken.indexOf(u.id) < 0 && !u.late; });
    var out = [];
    if (late) out.push(UPGRADES.filter(function (u) { return u.late; })[0]);
    while (out.length < 3 && pool.length) out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
    if (late) out.push(out.shift());   // put it last
    return out;
  }

  // ---------------------------------------------------------------------------
  // The end of the round
  // ---------------------------------------------------------------------------
  function end(why) {
    feed.forEach(function (p) { if (p.y < L.sy1 - L.cardH * 0.5) countSeen(p); });
    var pct = run.seen ? Math.round(run.slopSeen / run.seen * 100) : 0;
    var score = Math.round(run.score);
    var rec = shell.record(score);
    var rank, heading, line;
    if (why === "approved") {
      rank = 1;
      heading = "The feed is " + pct + "% slop.";
      line = "Nobody can tell what's real any more. Engagement has never been higher. The board has approved a bigger cannon.";
    } else if (why === "done") {
      rank = 2;
      heading = "The feed is " + pct + "% slop.";
      line = "Short of the final target. The board will review it, which means nobody will.";
    } else if (run.reached >= 1) {
      rank = 3;
      heading = "Funding pulled at stage " + (run.reached + 1) + ".";
      line = "There are still real people in the feed, posting their tea. The board has bought a bigger cannon from someone else.";
    } else {
      rank = 4;
      heading = "Funding pulled at stage 1.";
      line = "The feed is still mostly people's dinners. The board has seen enough dinners.";
    }
    var stats = [
      { label: "Engagement", value: fmt(score) },
      { label: "Reached", value: run.reached === LAST ? "Final push" : "Stage " + (run.reached + 1) + " of 3" },
      { label: "Feed", value: pct + "% slop" },
      { label: "Real posts slopped", value: String(run.realSlopped) },
      { label: "Best chain", value: String(run.bestChain) },
      { label: "Moderated", value: String(run.caught) },
      { label: rec.isNew ? (run.daily ? "New best today" : "New best") : (run.daily ? "Best today" : "Best"),
        value: fmt(rec.isNew ? score : rec.best || 0), highlight: rec.isNew }
    ];
    if (run.daily) stats.unshift({ label: "Run", value: shell.today });
    shell.finish({
      place: rank, total: 4, heading: heading, line: line, stats: stats, delay: why === "pulled" ? 1600 : 900,
      share: fmt(score) + " engagement, feed " + pct + "% slop"
    });
  }

  // ---------------------------------------------------------------------------
  // The autopilot (?autopilot and ?clip): picks the best post it can reach,
  // allowing for the scroll, the fact checks and the Moderator, swings the
  // barrel round, charges, and lets go at the right power.
  // ---------------------------------------------------------------------------
  function solve(q, ang) {
    var mz = muzzleAt(ang), dx = L.phoneX - mz.x;
    if (dx < 2) return null;
    var c = Math.cos(ang), s = Math.sin(ang), g = GRAV * K, sp = feedSpeed(), t = 0.5, v = 0, yt = 0;
    for (var i = 0; i < 4; i++) {
      yt = q.y + L.cardH / 2 - sp * t;
      var d = 2 * c * c * (yt - mz.y + dx * s / c);
      if (d <= 0) return null;
      v = Math.sqrt(g * dx * dx / d);
      t = dx / (v * c);
    }
    var p = v / K;
    p = (p - VMIN) / (VMAX - VMIN);
    if (p < 0.02 || p > 0.98) return null;
    return { p: p, t: t, y: yt };
  }

  // Where a shot at this angle and power is when it passes the Moderator's net
  function heightAt(ang, p, x) {
    var v = launchSpeed(p), mz = muzzleAt(ang);
    var t = (x - mz.x) / (Math.cos(ang) * v);
    return t > 0 ? mz.y - Math.sin(ang) * v * t + 0.5 * GRAV * K * t * t : null;
  }

  // The best post to go for from here, trying a few angles (or only this one)
  function choose(angles) {
    var best = null;
    var hoop = mod && mod.state === "work" ? mod.y + A.NET.y : null;
    // a chain to protect, counting real posts with a shot already on the way
    var chainy = run.chain > 0 || balls.some(function (b) { return b.target && b.target.type === "real" && !b.target.slopped; });
    feed.forEach(function (q) {
      if (q.type === "fact" && !RECKLESS) return;
      var value = q.type === "fact" ? 500 : q.type === "slop" ? 10 : q.slopped || q.incoming ? 3 : q.trending ? 300 : 100;
      // slop would break the chain: wait for a real one, and only bother with
      // slop at all when there's been nothing real for a while
      if (value < 50 && (chainy || balls.length ? auto.idle < 8 : auto.idle < 2.5)) return;
      angles.forEach(function (ang) {
        var s = solve(q, ang);
        if (!s || s.y < L.head + 2 || s.y > L.sy1 - 3) return;
        if (!auto.careless && !RECKLESS) {
          // keep off fact checks (the post's neighbours might be one) and away from the net
          var blocked = feed.some(function (f) { return f.type === "fact" && Math.abs(f.y - q.y) < L.cardH * 0.75; });
          if (blocked) return;
          if (hoop != null) {
            var h = heightAt(ang, s.p, L.modX + A.NET.x);
            if (h != null && Math.abs(h - hoop) < 15) return;
          }
        }
        var score = value - Math.abs(ang - aim) * 30 - s.t * 4;
        if (!best || score > best.score) best = { q: q, ang: ang, score: score };
      });
    });
    return best;
  }

  function autopilot(dt) {
    var out = { ang: auto.ang, charge: false, bots: false };
    if (run.mods.bots && !botsUsed && clock > 4) out.bots = true;
    if (reload > 0 || jam > 0) return out;
    if (auto.rest > 0 && !charging) { auto.rest -= dt; return out; }
    // pick a post: every so often, and at once if the one it had has gone,
    // been slopped, or has a shot on the way already
    var t = auto.target;
    var stale = !t || feed.indexOf(t) < 0 || (t.type === "real" && (t.slopped || t.incoming));
    auto.think -= dt;
    if (stale || auto.think <= 0) {
      auto.think = 0.25;
      var best = choose([aim, auto.ang, 0.55, 0.8, 1.0, 1.2]);
      if (best) {
        if (best.q !== auto.target) auto.slop = SLOPPY ? (Math.random() - 0.5) * 2 * SLOPPY : 0;
        auto.target = best.q;
        auto.ang = best.ang;
        auto.idle = 0;
      } else { auto.target = null; auto.idle += 0.25; }
    }
    out.ang = auto.ang;
    // nothing worth it: keep holding a charge if one's going (it swings back
    // and forth), and let it go only if it's been far too long
    if (!auto.target) {
      auto.hold += dt;
      out.charge = charging && auto.hold < 6;
      return out;
    }
    auto.hold = 0;
    var aligned = Math.abs(aim - auto.ang) < 0.02;
    if (!charging) { out.charge = aligned; return out; }
    // charging: swing the barrel round if it must, and let go when the power's right
    var s = aligned ? solve(auto.target, aim) : null;
    if (!s) { out.charge = true; return out; }
    var need = clamp(s.p + auto.slop, 0, 1);
    out.charge = Math.abs(power - need) >= Math.max(0.022, dt / SWEEP * 0.55);
    if (!out.charge) { auto.target = null; auto.careless = Math.random() < 0.08; auto.rest = PACE * (0.5 + Math.random()); }
    return out;
  }

  // ---------------------------------------------------------------------------
  // The arrow: the one thing worth pointing at right now (DESIGN.md, 10)
  // ---------------------------------------------------------------------------
  function pickHint(dt) {
    hintNow = null;
    var lr = run.learned;
    if (!lr.fire) {
      var word = touching() || lastMode === "touch" ? "Hold, then let go" : lastMode === "keys" ? "Hold Space" : "Hold to fire";
      hintNow = { x: L.pivot.x + 2, y: L.pivot.y - 17, word: word };
      return;
    }
    if (stage === 0 && !lr.real) {
      var r = firstOnScreen(function (q) { return q.type === "real" && !q.slopped; });
      if (r) hintNow = { x: L.cardX + L.cardW * 0.5, y: r.y + 1, word: "Real post" };
      return;
    }
    if (stage >= 1 && !lr.trend) {
      var t = firstOnScreen(function (q) { return q.trending && !q.slopped; });
      if (t) { hintNow = { x: L.cardX + L.cardW * 0.5, y: t.y + 1, word: "Worth triple" }; return; }
    }
    if (mod && mod.state === "work" && !lr.mod) {
      modSeen += dt;
      if (modSeen > 7) lr.mod = true;
      hintNow = { x: L.modX + A.NET.x, y: mod.y + A.NET.y - 5, word: "Tiny net" };
      return;
    }
    if (run.mods.bots && !botsUsed && !lr.bots && clock > 2) {
      hintNow = { x: L.pivot.x + 2, y: L.pivot.y - 17, word: touching() ? "Tap Bots" : "Bots: press B" };
    }
  }
  function firstOnScreen(test) {
    for (var i = 0; i < feed.length; i++) {
      var q = feed[i];
      if (q.y > L.head - 2 && q.y + L.cardH < L.sy1 + 4 && test(q)) return q;
    }
    return null;
  }

  // The stage's notice goes up with the countdown, so it's read before Go
  function notice() {
    var title = stageInfo().final ? "Final push" : "Stage " + (stage + 1) + ": " + stageInfo().name;
    shell.brief({ title: title, text: briefText(stage), ms: stage === 0 ? 8500 : 6500 });
  }

  // ---------------------------------------------------------------------------
  // HUD: stage, time and target top left; engagement and chain top right
  // ---------------------------------------------------------------------------
  function buildHud() {
    shell.hud.innerHTML =
      '<div class="kit-hud-tl">' +
        '<p class="kit-stat"><small data-stage-label>Stage</small><span data-stage>1/3</span></p>' +
        '<p class="kit-mono" data-time>0:35</p>' +
        '<p class="kit-meter" data-target><span class="kit-meter-label" data-target-label>Target</span><span class="kit-meter-bar"><span data-target-bar></span></span></p>' +
        '<p class="kit-meter" data-bots data-pad style="display: none"><span class="kit-meter-label">Bots</span><span class="kit-meter-bar"><span data-bots-bar></span></span></p>' +
      '</div>' +
      '<div class="kit-hud-tr">' +
        '<p class="kit-stat kit-stat-big"><span data-score>0</span></p>' +
        '<p class="kit-stat"><small>Chain</small><span data-chain>0</span></p>' +
      '</div>';
    hudEls = {};
    ["stage", "stage-label", "time", "target", "target-label", "target-bar", "bots", "bots-bar", "score", "chain"].forEach(function (k) {
      hudEls[k] = shell.hud.querySelector("[data-" + k + "]");
    });
    hudEls.bots.style.display = run && run.mods.bots ? "" : "none";
  }
  function setText(node, value) { if (node.textContent !== value) node.textContent = value; }
  function setWidth(node, share) {
    var w = Math.round(clamp(share, 0, 1) * 100) + "%";
    if (node.style.width !== w) node.style.width = w;
  }
  function paintHud(dt) {
    if (!hudEls || !run) return;
    shown += (run.score - shown) * Math.min(1, (dt || 1) * 7);
    if (Math.abs(run.score - shown) < 1) shown = run.score;
    var s = Math.ceil(timeLeft);
    setText(hudEls["stage-label"], stageInfo().final ? "Final" : "Stage");
    setText(hudEls.stage, stageInfo().final ? "push" : (stage + 1) + "/3");
    setText(hudEls.time, Math.floor(s / 60) + ":" + (s % 60 < 10 ? "0" : "") + (s % 60));
    var target = targetFor(stage);
    setWidth(hudEls["target-bar"], run.stageScore / target);
    var met = run.stageScore >= target;
    setText(hudEls["target-label"], met ? "Target: met" : "Target");
    hudEls.target.classList.toggle("is-full", met);
    setText(hudEls.score, fmt(shown));
    setText(hudEls.chain, run.chain ? run.chain + " x" + chainMult().toFixed(2).replace(/0$/, "") : "0");
    if (run.mods.bots) {
      var share = botsLeft > 0 ? botsLeft / BOTS_TIME : botsUsed ? 0 : 1;
      setWidth(hudEls["bots-bar"], share);
      hudEls.bots.classList.toggle("is-full", !botsUsed);
      shell.padFill("bots", share);
    }
  }

  // ---------------------------------------------------------------------------
  // Drawing
  // ---------------------------------------------------------------------------
  function resize(w, h, dpr) {
    W = w; H = h; DPR = dpr;
    U = Math.min(W, H) / 100;
    WW = W / U; WH = H / U;
    ctx = (shell ? shell.canvas : root.querySelector("canvas")).getContext("2d");
    layout();
    A.init(T || N.tokens(root), U * DPR);
    bg = null;
    poses = {};
    hudBox = null;
    feed.forEach(function (p) { p.img = null; });
  }

  // The room and the phone: drawn once, kept as a picture
  function buildBackground() {
    var cv = document.createElement("canvas");
    cv.width = Math.round(W * DPR);
    cv.height = Math.round(H * DPR);
    var c = cv.getContext("2d");
    c.scale(DPR * U, DPR * U);
    c.fillStyle = T.ink;
    c.fillRect(0, 0, WW, WH);
    // worn halftone on the back wall
    var r = seeded(5);
    c.fillStyle = T.ash;
    for (var i = 0; i < 18; i++) {
      var px = r() * WW, py = r() * L.floor, pr = 8 + r() * 16;
      for (var dy = -pr; dy < pr; dy += 2.2) {
        for (var dx = -pr; dx < pr; dx += 2.2) {
          var d = Math.hypot(dx, dy) / pr;
          if (d < 1) { c.beginPath(); c.arc(px + dx + (Math.round(dy / 2.2) % 2 ? 1.1 : 0), py + dy, 0.5 * (1 - d), 0, 7); c.fill(); }
        }
      }
    }
    // server racks, humming at the back
    var rx0 = L.pivot.x + 9, rx1 = L.phoneX - 8;
    for (var x = rx0; x + 9 < rx1; x += 12) {
      var top = L.floor - 30 - (Math.round(x) % 3) * 3;
      c.strokeStyle = T.ash;
      c.lineWidth = 0.7;
      c.strokeRect(x, top, 9, L.floor - top);
      for (var y = top + 3; y < L.floor - 2; y += 3.2) {
        c.fillStyle = T.ash;
        c.fillRect(x + 1.4, y, 6.2, 0.5);
        c.fillStyle = r() < 0.3 ? T.accent : r() < 0.15 ? T.red : T.ash;
        c.beginPath(); c.arc(x + 7.2, y - 0.9, 0.42, 0, 7); c.fill();
      }
    }
    // the floor
    c.fillStyle = A.dots(c, T.ash, 1.3);
    c.fillRect(0, L.floor, WW, WH - L.floor);
    c.strokeStyle = T.paper;
    c.lineWidth = 0.6;
    c.beginPath(); c.moveTo(0, L.floor); c.lineTo(WW, L.floor); c.stroke();
    // the vat
    A.vat(c, L.vat.x, L.vat.y, L.vat.w, L.vat.h);
    // the phone: a giant one, standing on the floor, its top somewhere up there
    var x0 = L.phoneX, x1 = L.phoneR, b = L.floor;
    c.fillStyle = T.ink;
    c.beginPath();
    c.moveTo(x0, -10); c.lineTo(x0, b - 5); c.quadraticCurveTo(x0, b, x0 + 5, b); c.lineTo(x1 - 5, b); c.quadraticCurveTo(x1, b, x1, b - 5); c.lineTo(x1, -10);
    c.closePath();
    c.fill();
    c.strokeStyle = T.paper;
    c.lineWidth = 1;
    c.stroke();
    // side buttons
    c.fillStyle = T.ink;
    [[x1, 22, 7], [x1, 32, 5]].forEach(function (s) { c.fillRect(s[0], s[1], 1.4, s[2]); c.strokeRect(s[0], s[1], 1.4, s[2]); });
    // halftone sheen down the bezel
    c.fillStyle = A.dots(c, T.paper, 1.1);
    c.fillRect(x1 - 1.9, 0, 1, b - 6);
    // the screen
    c.fillStyle = T.ink;
    c.fillRect(L.sx0, -10, L.sx1 - L.sx0, L.sy1 + 10);
    c.strokeStyle = T.ash;
    c.lineWidth = 0.4;
    c.strokeRect(L.sx0, -10, L.sx1 - L.sx0, L.sy1 + 10);
    // the home bar
    c.strokeStyle = T.paper;
    c.lineWidth = 0.9;
    c.lineCap = "round";
    c.beginPath(); c.moveTo((x0 + x1) / 2 - 6, b - 3.4); c.lineTo((x0 + x1) / 2 + 6, b - 3.4); c.stroke();
    return cv;
  }

  function seeded(n) {
    return function () { n = (n * 16807) % 2147483647; return (n - 1) / 2147483646; };
  }

  function pose(name, draw, box) {
    var key = name;
    if (poses[key]) return poses[key];
    var cv = document.createElement("canvas");
    var sc = U * DPR;
    cv.width = Math.ceil(box.w * sc);
    cv.height = Math.ceil(box.h * sc);
    var c = cv.getContext("2d");
    c.scale(sc, sc);
    c.translate(box.ox, box.oy);
    draw(c);
    poses[key] = { img: cv, box: box };
    return poses[key];
  }
  function drawPose(c, p, x, y) {
    c.drawImage(p.img, x - p.box.ox, y - p.box.oy, p.box.w, p.box.h);
  }

  function drawGaffer(c) {
    var shout = gaffer.shout > 0;
    var key = "gaffer" + (shout ? "s" : "") + (gaffer.slopped > 0 ? "x" : "");
    var p = pose(key, function (x) { A.gaffer(x, { shout: shout, slopped: gaffer.slopped > 0, gaze: shout ? 0 : 0.75 }); }, { w: 30, h: 42, ox: 14, oy: 39 });
    c.fillStyle = T.ash;
    c.beginPath(); c.ellipse(L.gaffer.x, L.gaffer.y, 9, 1.6, 0, 0, Math.PI * 2); c.fill();
    var bob = shout && !shell.reduceMotion ? Math.abs(Math.sin(clock * 18)) * 0.6 : 0;
    drawPose(c, p, L.gaffer.x, L.gaffer.y - bob);
  }

  function drawHose(c) {
    var x0 = L.vat.x + L.vat.w - 1, y0 = L.floor - 8, x1 = L.pivot.x - 4, y1 = L.pivot.y + 1;
    var path = new Path2D();
    path.moveTo(x0, y0);
    path.bezierCurveTo(x0 + 6, L.floor + 2, x1 - 6, L.floor + 1, x1, y1);
    c.lineCap = "round";
    c.lineWidth = 3;
    c.strokeStyle = T.paper;
    c.stroke(path);
    c.lineWidth = 1.6;
    c.strokeStyle = T.ink;
    c.stroke(path);
    // a lump of slop on its way to the cannon while it reloads
    if (reload > 0 && phase === "play") {
      var k = 1 - reload / Math.max(0.2, RELOAD * run.mods.reload);
      k = clamp(k, 0, 1);
      var bx = bez(x0, x0 + 6, x1 - 6, x1, k), by = bez(y0, L.floor + 2, L.floor + 1, y1, k);
      A.oval(c, bx, by, 1.6, 1.6, T.accent, 0.4);
    }
  }
  function bez(a, b, c2, d, t) {
    var u = 1 - t;
    return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c2 + t * t * t * d;
  }

  function drawSign(c) {
    var s = L.sign, w = 25, h = 12.4;
    c.save();
    c.translate(s.x, s.y);
    c.rotate(-0.03);
    // two strings to a nail
    c.strokeStyle = T.ash;
    c.lineWidth = 0.4;
    c.beginPath(); c.moveTo(-w * 0.35, -h / 2); c.lineTo(0, -h / 2 - 4); c.lineTo(w * 0.35, -h / 2); c.stroke();
    A.rrect(c, -w / 2, -h / 2, w, h, 0.6);
    c.fillStyle = T.paper; c.fill();
    A.ink(c, 0.5); c.stroke();
    A.text(c, "Days since a fact check", 0, -h / 2 + 2.5, 2.5, w - 2.5, { align: "center", fill: T.ink });
    A.text(c, fmt(signDays), 0, 2.2, 6.4, w - 4, { align: "center", fill: signDays < 10 ? T.red : T.ink });
    c.restore();
  }

  function drawPuddles(c) {
    puddles.forEach(function (p) {
      var k = Math.min(1, p.t * 6), fade = clamp((10 - p.t) / 2, 0, 1);
      c.globalAlpha = fade;
      if (p.wall) A.oval(c, p.x, p.y, p.r * 0.7, p.r * k, T.accent, 0.4);
      else A.oval(c, p.x, p.y, p.r * k, p.r * 0.32 * k, T.accent, 0.4);
      c.globalAlpha = 1;
    });
  }

  function drawPreview(c) {
    var loaded = reload <= 0 && jam <= 0 && phase === "play";
    if (!loaded || shell.state() !== "playing") return null;
    if (!charging) {
      // a short sight along the barrel, so it's clear where it's pointing
      var mz = muzzleAt(aim);
      c.fillStyle = T.paper;
      for (var i = 1; i <= 4; i++) {
        c.globalAlpha = 0.65 - i * 0.12;
        c.beginPath(); c.arc(mz.x + Math.cos(aim) * i * 3.4, mz.y - Math.sin(aim) * i * 3.4, 0.55, 0, 7); c.fill();
      }
      c.globalAlpha = 1;
      return null;
    }
    var b = preview();
    var n = 26;
    for (var j = 1; j <= n; j++) {
      var p = at(b, b.end * j / n);
      c.beginPath();
      c.arc(p.x, p.y, j === n ? 0.95 : 0.62, 0, 7);
      c.fillStyle = T.paper;
      c.fill();
      c.lineWidth = 0.3;
      c.strokeStyle = T.ink;
      c.stroke();
    }
    return b;
  }

  // Red brackets on the post the shot will land on, and what it's worth
  function drawTarget(c, b) {
    if (!b || !b.target) return;
    var q = b.target;
    var x0 = L.cardX - 0.8, x1 = L.cardX + L.cardW + 0.8, y0 = q.y - 0.8, y1 = q.y + L.cardH + 0.8, a = 3.6;
    var k = shell.reduceMotion ? 0 : (Math.sin(clock * 10) + 1) * 0.4;
    x0 -= k; x1 += k; y0 -= k; y1 += k;
    var pth = new Path2D();
    [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]].forEach(function (s) {
      pth.moveTo(s[0], s[1] + s[3] * a); pth.lineTo(s[0], s[1]); pth.lineTo(s[0] + s[2] * a, s[1]);
    });
    c.lineCap = "round"; c.lineJoin = "round";
    c.lineWidth = 2.2; c.strokeStyle = T.ink; c.stroke(pth);
    c.lineWidth = 1.1; c.strokeStyle = T.red; c.stroke(pth);
    // the tag: what it's worth, or that it'll come back
    var fresh = q.type === "real" && !q.slopped && !q.incoming;
    var warn = q.type === "fact" || (!fresh && run.chain >= 2);
    var words = q.type === "fact" ? "Bounces" : warn ? "Breaks chain" : "+" + fmt(worth(q, chainMult()));
    var size = 3.2;
    var tw = A.measure(c, words, size) + 2.4;
    var tx = L.phoneX - tw - 1.4, ty = clamp(q.y + L.cardH / 2, L.head + 3, L.sy1 - 2);
    A.rrect(c, tx, ty - 2.4, tw, 4.8, 0.6);
    c.fillStyle = warn ? T.red : T.paper;
    c.fill();
    A.ink(c, 0.4); c.stroke();
    A.text(c, words, tx + tw / 2, ty + 0.2, size, null, { align: "center", fill: warn ? T.paper : T.ink });
  }

  function drawFeed(c) {
    c.save();
    c.beginPath();
    c.rect(L.sx0, -10, L.sx1 - L.sx0, L.sy1 + 10);
    c.clip();
    var sc = U * DPR;
    feed.forEach(function (q) {
      if (q.y > L.sy1 || q.y + L.cardH < -2) return;
      if (!q.img) {
        var cv = document.createElement("canvas");
        cv.width = Math.ceil(L.cardW * sc);
        cv.height = Math.ceil(L.cardH * sc);
        var x = cv.getContext("2d");
        x.scale(sc, sc);
        A.card(x, q, L.cardW, L.cardH);
        q.img = cv;
      }
      var jolt = q.flash && !shell.reduceMotion ? Math.sin(q.flash * 40) * q.flash * 1.6 : 0;
      c.drawImage(q.img, L.cardX + jolt, q.y, L.cardW, L.cardH);
      if (q.type !== "fact") {
        // likes, counting up
        var lx = L.cardX + L.cardW - 1.6, ly = q.y + 3.9;
        var words = short(q.likesShown);
        var tw = A.measure(c, words, 2.9);
        A.heart(c, lx - tw - 2.2 + jolt, ly - 0.2, 1.3, q.slopped || q.type === "slop" ? T.red : T.paper);
        A.text(c, words, lx + jolt, ly + 0.2, 2.9, null, { align: "right", fill: T.ink });
      }
    });
    // the app's header: the posts slide under it, and the score sits on it
    c.fillStyle = T.ink;
    c.fillRect(L.sx0, -10, L.sx1 - L.sx0, L.head + 10);
    c.fillStyle = A.dots(c, T.ash, 1.1);
    c.fillRect(L.sx0, L.head - 3, L.sx1 - L.sx0, 3);
    c.strokeStyle = T.paper;
    c.lineWidth = 0.5;
    c.beginPath(); c.moveTo(L.sx0, L.head); c.lineTo(L.sx1, L.head); c.stroke();
    // the finale: slop rising up the screen
    if (flood > 0) {
      var top = L.sy1 - (L.sy1 + 10) * flood;
      c.fillStyle = T.accent;
      c.beginPath();
      c.moveTo(L.sx0, L.sy1 + 2);
      for (var x = L.sx0; x <= L.sx1 + 2; x += 3) c.lineTo(x, top + Math.sin(x * 0.7 + clock * 6) * 1.2);
      c.lineTo(L.sx1, L.sy1 + 2);
      c.closePath();
      c.fill();
      c.fillStyle = A.shade(c);
      c.fill();
    }
    c.restore();
  }

  function drawModerator(c) {
    if (!mod) return;
    if (mod.state === "lunch") {
      // a sign on the bezel where he was
      c.save();
      c.translate(L.phoneX + 0.5, L.modHome - 18);
      c.rotate(0.05);
      A.rrect(c, -9, -3.6, 18, 7.2, 0.6);
      c.fillStyle = T.paper; c.fill(); A.ink(c, 0.5); c.stroke();
      A.text(c, "On lunch", 0, 0.3, 3.6, 16, { align: "center", fill: T.ink });
      c.restore();
    }
    if (mod.y < -28) return;
    var x = L.modX, y = mod.y;
    // the ropes
    c.strokeStyle = T.paper;
    c.lineWidth = 0.45;
    c.beginPath(); c.moveTo(x - 5.6, y - 5); c.lineTo(x - 5.6, -12); c.moveTo(x + 5.6, y - 5); c.lineTo(x + 5.6, -12); c.stroke();
    var p = pose("mod" + (mod.full > 0 ? "f" : ""), function (k) { A.moderator(k, { full: mod.full > 0 }); }, { w: 34, h: 28, ox: 24, oy: 24 });
    if (mod.swing > 0 && !shell.reduceMotion) {
      c.save();
      c.translate(x, y);
      c.rotate(-mod.swing * 0.08);
      drawPose(c, p, 0, 0);
      c.restore();
    } else drawPose(c, p, x, y);
  }

  function drawBalls(c) {
    balls.forEach(function (b) {
      var p = at(b, b.t);
      A.blob(c, p.x, p.y, BALL_R, b.kind, shell.reduceMotion ? 0 : b.wob, b.spin + b.t * (b.bounced ? -4 : 2));
    });
  }

  function drawCannon(c) {
    var loaded = reload <= 0 && jam <= 0;
    var shakeIt = charging && !shell.reduceMotion ? Math.sin(clock * 60) * power * 0.25 : 0;
    A.cannon(c, L.pivot.x + shakeIt, L.pivot.y, aim, { recoil: recoil, swell: swell, load: loaded, jam: jam > 0 });
  }

  function drawFx(c) {
    fx.forEach(function (e) {
      if (e.t < 0) return;
      var k = e.t / e.life;
      if (e.kind === "drop") {
        A.oval(c, e.x, e.y, e.r, e.r, T.accent, 0.3);
      } else if (e.kind === "react") {
        c.globalAlpha = k < 0.7 ? 1 : (1 - k) / 0.3;
        if (e.word) {
          var w = A.measure(c, e.word, 2.6) + 2;
          A.rrect(c, e.x - w / 2, e.y - 1.9, w, 3.8, 0.6);
          c.fillStyle = e.bot ? T.accent : T.paper; c.fill();
          A.ink(c, 0.3); c.stroke();
          A.text(c, e.word, e.x, e.y + 0.15, 2.6, null, { align: "center", fill: T.ink });
        } else {
          A.heart(c, e.x, e.y, e.r, T.red);
        }
        c.globalAlpha = 1;
      } else if (e.kind === "puff") {
        var rise = k * 6, grow = 0.7 + k * 0.9;
        c.globalAlpha = 1 - k * k;
        e.blobs.forEach(function (b) { A.oval(c, e.x + b.x * grow + 0.6, e.y + b.y * grow - rise + 0.6, b.r * grow, b.r * grow, T.accent); });
        e.blobs.forEach(function (b) { A.oval(c, e.x + b.x * grow, e.y + b.y * grow - rise, b.r * grow, b.r * grow, T.paper); });
        c.globalAlpha = 1;
      } else if (e.kind === "zap") {
        // the slop leaping from one post to the next
        c.globalAlpha = 1 - k;
        var ya = e.y0, yb = e.y1, steps = 6;
        c.beginPath();
        for (var i = 0; i <= steps; i++) {
          var yy = ya + (yb - ya) * i / steps, xx = e.x + (i % 2 ? 3 : -3) * (i === 0 || i === steps ? 0 : 1);
          if (i) c.lineTo(xx, yy); else c.moveTo(xx, yy);
        }
        c.lineWidth = 2.4; c.strokeStyle = T.ink; c.stroke();
        c.lineWidth = 1.2; c.strokeStyle = T.accent; c.stroke();
        c.globalAlpha = 1;
      } else if (e.kind === "pop") {
        c.globalAlpha = k < 0.75 ? 1 : (1 - k) / 0.25;
        var size = e.big ? 5 : 3.8;
        A.text(c, e.text, e.x - 1, e.y - k * 7, size, null, { align: "right", fill: e.big ? T.accent : T.paper, edge: T.ink, edgeW: size * 0.3 });
        c.globalAlpha = 1;
      }
    });
  }

  // A speech bubble, drawn in screen pixels so it stays readable on a phone
  function drawBubble(c, b, placed) {
    var spot = b.who.at();
    var ax = spot.x * U, ay = spot.y * U;
    var size = clamp(U * 3.4, 11, 15);
    c.font = size + "px " + T.display;
    var words = b.text.toUpperCase().split(" "), lines = [""];
    var maxChars = b.who.side === "left" ? 18 : 22;
    words.forEach(function (w) {
      var line = lines[lines.length - 1] ? lines[lines.length - 1] + " " + w : w;
      if (line.length > maxChars && lines[lines.length - 1]) lines.push(w); else lines[lines.length - 1] = line;
    });
    var tw = 0;
    lines.forEach(function (l) { tw = Math.max(tw, c.measureText(l).width); });
    var pad = size * 0.5, lh = size * 1.02;
    var bw = tw + pad * 2, bh = lines.length * lh + pad * 1.3;
    var top = 6;
    var boxes = hudBoxes();
    var bx, by, tail;
    if (b.who.side === "left") {
      bx = clamp(ax - bw - size * 1.1, 4, W - bw - 4);
      by = ay - bh / 2;
      tail = "right";
    } else {
      bx = clamp(ax - bw / 2, 4, W - bw - 4);
      by = ay - bh - size * 0.7;
      tail = "down";
    }
    boxes.forEach(function (r) { if (bx < r.right + 4 && bx + bw > r.left - 4) top = Math.max(top, r.bottom + 4); });
    by = clamp(by, top, H - bh - 4);
    for (var tries = 0; tries < 4; tries++) {
      var hit = null;
      for (var k = 0; k < placed.length; k++) {
        var o = placed[k];
        if (bx < o.x + o.w + 4 && bx + bw + 4 > o.x && by < o.y + o.h + 4 && by + bh + 4 > o.y) { hit = o; break; }
      }
      if (!hit) break;
      by = hit.y - bh - 6 >= top ? hit.y - bh - 6 : hit.y + hit.h + 6;
      by = clamp(by, top, H - bh - 4);
    }
    placed.push({ x: bx, y: by, w: bw, h: bh });
    var pop = shell.reduceMotion ? 1 : clamp(b.t * 8, 0, 1);
    c.globalAlpha = Math.min(pop, clamp((b.life - b.t) * 3, 0, 1));
    var r = Math.min(8, bh / 2);
    c.beginPath();
    c.moveTo(bx + r, by);
    c.arcTo(bx + bw, by, bx + bw, by + bh, r);
    if (tail === "right") {
      var ty = clamp(ay, by + r + 2, by + bh - r - 2);
      c.lineTo(bx + bw, ty - 4); c.lineTo(Math.min(ax - 2, bx + bw + size * 0.9), ty); c.lineTo(bx + bw, ty + 3);
    }
    c.arcTo(bx + bw, by + bh, bx, by + bh, r);
    if (tail === "down" && by + bh < ay) {
      var tx = clamp(ax, bx + 12, bx + bw - 12);
      c.lineTo(tx + 6, by + bh); c.lineTo(tx - 2, by + bh + size * 0.7); c.lineTo(tx - 5, by + bh);
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
    c.fillStyle = T.ink;
    c.textAlign = "center";
    c.textBaseline = "top";
    lines.forEach(function (l, i) { c.fillText(l, bx + bw / 2, by + pad * 0.75 + i * lh); });
    c.globalAlpha = 1;
  }

  // Where the HUD and the buttons sit over the canvas, in CSS pixels
  function hudBoxes() {
    if (hudBox) return hudBox;
    var base = root.getBoundingClientRect();
    hudBox = [];
    Array.prototype.forEach.call(root.querySelectorAll(".kit-hud-tl, .kit-hud-tr, .kit-bar"), function (el) {
      var r = el.getBoundingClientRect();
      if (r.width) hudBox.push({ left: r.left - base.left, right: r.right - base.left, bottom: r.bottom - base.top });
      // the phone's header is as deep as the score in the corner above it
      if (r.width && el.classList.contains("kit-hud-tr")) L.head = clamp((r.bottom - base.top) / U + 1.5, 12, 26);
    });
    return hudBox;
  }

  function render() {
    if (!ctx || !run) return;
    if (!noticed && (shell.state() === "countdown" || shell.state() === "playing")) { noticed = true; notice(); }
    if (!hudEls) { buildHud(); paintHud(0); }
    if (!bg) bg = buildBackground();
    if (++hudAge > 60) { hudBox = null; hudAge = 0; }
    hudBoxes();
    var c = ctx;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.drawImage(bg, 0, 0);
    var sx = 0, sy = 0;
    if (shake > 0 && !shell.reduceMotion) { sx = (Math.random() - 0.5) * 5 * shake; sy = (Math.random() - 0.5) * 5 * shake; }
    c.setTransform(DPR * U, 0, 0, DPR * U, sx * DPR, sy * DPR);

    drawSign(c);
    drawPuddles(c);
    drawHose(c);
    drawGaffer(c);
    var pv = drawPreview(c);
    drawCannon(c);
    drawFeed(c);
    drawModerator(c);
    if (pv) drawTarget(c, pv);
    drawBalls(c);
    drawFx(c);

    var placed = [];
    // keep the Moderator in view: bubbles go round him
    if (mod && mod.y > 0) placed.push({ x: (L.modX + A.NET.x - 3) * U, y: (mod.y - 22) * U, w: 22 * U, h: 24 * U });
    var arrow = phase === "play" && shell.state() === "playing" ? hintNow : null;
    if (arrow) {
      arrow = { x: clamp(arrow.x, 12, WW - 12), y: Math.max(20, arrow.y), word: arrow.word };
      placed.push({ x: (arrow.x - 12) * U, y: (arrow.y - 13) * U, w: 24 * U, h: 14 * U });
    }
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    bubbles.forEach(function (b) { drawBubble(c, b, placed); });
    if (arrow) {
      c.setTransform(DPR * U, 0, 0, DPR * U, 0, 0);
      var bob = shell.reduceMotion ? 0 : -Math.abs(Math.sin(clock * 4)) * 1.4;
      A.arrow(c, arrow.x, arrow.y + bob, arrow.word, 1);
    }
  }

  // ---------------------------------------------------------------------------
  // Mouse and finger: held down anywhere on the open screen charges the shot.
  // (The kit tells us where the pointer is; this is only whether it's down.)
  // ---------------------------------------------------------------------------
  root.addEventListener("pointerdown", function (e) {
    var st = shell && shell.state();
    if (st !== "playing" && st !== "countdown") return;
    if (e.target && e.target.closest && e.target.closest(".kit-panel, .kit-bar, .kit-pad, button, a")) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    held = true;
    heldId = e.pointerId;
    lastMode = e.pointerType === "mouse" ? "mouse" : "touch";
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
    slug: "slop-cannon",
    title: "Slop Cannon",
    stamp: "Pending review",
    tilt: -5,
    note: "A content farm, a cannon and a feed full of real people's dinners. Three stages and a final push.",
    hints: {
      keys: "Aim with the mouse or the arrow keys. Hold the mouse button or Space to charge, let go to fire. P to pause.",
      touch: "Hold a finger anywhere to aim and charge. Let go to fire."
    },
    againLabel: "Fire again",
    aim: true,
    keys: {
      up: ["ArrowUp", "KeyW"], down: ["ArrowDown", "KeyS"], left: ["ArrowLeft", "KeyA"], right: ["ArrowRight", "KeyD"],
      action: ["Space"], bots: ["KeyB"]
    },
    pad: { action: [0, 2, 7], bots: [1, 3, 6] },
    daily: true,
    pitch: "Fire AI slop into a feed of real people's dinners. Nobody is checking.",
    smallCallouts: true,
    touch: [{ key: "bots", label: "Bots", icon: "Bots", side: "right" }],
    reset: reset,
    update: function (dt, input) { update(dt, input); },
    render: function () { render(); },
    resize: resize
  });
  T = shell.tokens;
  A.init(T, U * DPR);

  // The canvas font may arrive after the first frame: redraw what has words on it
  if (document.fonts && document.fonts.load) {
    document.fonts.load("12px " + T.display).then(function () {
      bg = null;
      poses = {};
      feed.forEach(function (p) { p.img = null; });
    });
  }

  if (DEBUG) {
    window.__slop = {
      run: function () { return run; },
      feed: function () { return feed; },
      stage: function () { return stage; },
      state: function () { return { phase: phase, timeLeft: timeLeft, stageScore: run && run.stageScore, score: run && run.score, target: run && targetFor(stage), aim: aim, power: power, mod: mod }; }
    };
  }
})();
