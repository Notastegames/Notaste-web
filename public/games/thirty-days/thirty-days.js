// Thirty Days: thirty days of nothing but fast food, and every meal has to
// be processed. Your insides are a council office.
//
// THE GAME
// Food comes down the chute from the intake at the top and lands on the plate
// in the middle. Every item has a sticker saying what it mostly is, and each
// department has a desk: grease goes left to the Liver, sugar right to the
// Pancreas, salt down to the Kidneys (twins, who share a desk). Send each
// item to the right desk with the arrow keys, a click or a tap (or a swipe
// from the plate). The clerks stamp things through one at a time.
// What goes wrong goes into the pipes, which the Heart looks after with a
// plunger and drains slowly:
//   wrong desk      the clerk throws it back, the streak ends, a little clog
//   full in-tray    it spills: a lot of clog
//   chute backs up  the item on the plate is swallowed whole: clog
// Fill the pipes and you're signed off, and the day is over.
//
// A round is one day in four meals of about thirty seconds of food each,
// two and a quarter minutes in all. Each meal adds something, said in a
// notice (shell.brief) before Go:
//   1. Breakfast (07:30): the Liver and the Pancreas. The Kidneys are on a
//      break ("Back at lunch").
//   2. Lunch (12:30): the Kidneys open. Meal deals: three things at once.
//   3. Dinner (18:30): Flush (Space, Up, the hatch or the Flush button)
//      sends anything down the hatch, then recharges. Drinks come with a free
//      refill: they come back once.
//   4. The late one (23:45): half the stickers have come off, so you have to
//      know a doughnut is sugar. The big items have two stickers and need
//      sorting twice.
// Between meals the speaker asks if you'd like to go large (shell.interlude),
// with three answers, all of them yes, each with a catch.
//
// SCORING
// Each item filed scores 10, times the streak (x2 after 10 in a row with
// nothing wrong, x3 after 20, x4 after 30), and times half again if you went
// large. Lettuce scores 25, because nobody has seen it before. Each meal ends
// with a bonus for clear pipes (half a point per point of pipe left, times
// the meal number) and 100 for a clean meal; 250 for making it to bed.
//
// DIFFICULTY
// Tuned with the autopilot at three reaction times (?debug&skill=0.3, 0.45,
// 0.65 seconds): the quick one usually gets Approved, the middle one gets to
// bed with a few spills, and the slow one is signed off at dinner or in the
// late one. Breakfast is for learning and nobody should fail it.
//
// THE LADDER (results stamp)
//   Approved        made it to bed with four or fewer things gone wrong all day
//   Pending review  made it to bed
//   Not approved    signed off at dinner or in the late one
//   Rejected        signed off at breakfast or lunch
//
// THE JOKE
// The chain's upselling (go large, make it a meal, free refills, a speaker
// that only ever asks if you want more) and our own habits, with the organs
// as tired council clerks doing the paperwork. The person eating is never
// seen and never the punchline: the jokes land on the food, the speaker and
// the clerks. The chain is invented, and has no name.
//
// Built on the shared kit (/games/kit/kit.js): intro, screens, controls,
// sound and saving. art.js draws everything.
//
// TESTING
// ?autopilot plays it (&speed=4 for four times as fast), ?clip films it.
// ?debug exposes window.__thirtyDays, and with it &stage=3 starts at the late
// one and &skill=0.6 slows the autopilot down.
(function () {
  "use strict";

  var N = window.Notaste;
  var A = window.ThirtyDaysArt;
  var root = document.getElementById("game-root");
  if (!N || !A || !root) return;

  var params = new URLSearchParams(window.location.search);
  var DEBUG = params.has("debug");
  var AUTOPILOT = N.flags.autopilot;
  var SKILL = DEBUG && params.get("skill") ? Math.max(0.1, Math.min(2, parseFloat(params.get("skill")) || 0.35)) : null;

  // ---------------------------------------------------------------------------
  // The menu. Each food is mostly one thing.
  // ---------------------------------------------------------------------------
  var FOODS = {
    burger: { kinds: ["grease"], name: "a burger" },
    hashbrown: { kinds: ["grease"], name: "a hash brown" },
    drumstick: { kinds: ["grease"], name: "a drumstick" },
    muffin: { kinds: ["grease"], name: "a breakfast muffin" },
    cola: { kinds: ["sugar"], name: "a cola", drink: true },
    shake: { kinds: ["sugar"], name: "a shake", drink: true },
    doughnut: { kinds: ["sugar"], name: "a doughnut" },
    pie: { kinds: ["sugar"], name: "a hot pie" },
    sundae: { kinds: ["sugar"], name: "a sundae" },
    fries: { kinds: ["salt"], name: "fries" },
    crisps: { kinds: ["salt"], name: "crisps" },
    pretzel: { kinds: ["salt"], name: "a pretzel" },
    sachet: { kinds: ["salt"], name: "a sachet of salt" },
    lettuce: { kinds: ["leaf"], name: "lettuce" },
    // the big ones, from the late one: two stickers, sorted twice
    quadruple: { kinds: ["grease", "salt"], name: "the quadruple", big: true },
    loaded: { kinds: ["salt", "grease"], name: "loaded fries", big: true },
    bucket: { kinds: ["grease", "sugar"], name: "a bucket", big: true }
  };
  var BY_KIND = {
    grease: ["burger", "hashbrown", "drumstick", "muffin"],
    sugar: ["cola", "shake", "doughnut", "pie", "sundae"],
    salt: ["fries", "crisps", "pretzel", "sachet"]
  };

  // The four meals. gap: seconds between arrivals (give or take a quarter);
  // mix: how much of each kind; deal: seconds between meal deals.
  var STAGES = [
    { name: "Breakfast", at: 7 * 60 + 30, time: 28, gap: 1.4, mix: { grease: 0.55, sugar: 0.45, salt: 0 },
      foods: ["muffin", "hashbrown", "burger", "cola", "doughnut", "pie"], deal: 0, leaf: 0.03,
      clear: "Breakfast has been processed. Most of it." },
    { name: "Lunch", at: 12 * 60 + 30, time: 30, gap: 1.2, mix: { grease: 0.36, sugar: 0.3, salt: 0.34 },
      foods: null, deal: 9, leaf: 0.03, kidneys: true,
      clear: "Lunch has been processed. The Kidneys would like it noted that they were on a break." },
    { name: "Dinner", at: 18 * 60 + 30, time: 30, gap: 1.15, mix: { grease: 0.36, sugar: 0.34, salt: 0.3 },
      foods: null, deal: 8.5, leaf: 0.03, kidneys: true, flush: true, refill: true,
      clear: "Dinner has been processed. The hatch would like a word." },
    { name: "The late one", at: 23 * 60 + 45, time: 30, gap: 1.15, mix: { grease: 0.4, sugar: 0.3, salt: 0.3 },
      foods: null, deal: 8, leaf: 0.02, kidneys: true, flush: true, refill: true, bare: 0.5, big: 0.14,
      clear: "" }
  ];
  var LAST = STAGES.length - 1;

  var CAP = 5;              // things an in-tray holds
  var RATE = 1 / 1.9;      // things a desk stamps through a second
  var QUEUE_MAX = 5;        // things waiting in the chute, not counting the plate
  var CLOG = { wrong: 5, spill: 14, swallow: 11 };
  var DRAIN = 0.7;          // pipe cleared a second
  var FLUSH_WAIT = 8;       // seconds for the hatch to recharge
  var REST = 15;            // pipe cleared between meals

  // Between meals: would you like to go large? Every answer is yes.
  var OFFERS = [
    { id: "large", label: "Go large", detail: "Everything scores half as much again. It also comes down faster.",
      apply: function (m) { m.score *= 1.5; m.rate *= 1.12; } },
    { id: "meal", label: "Make it a meal", detail: "Every in-tray holds two more. Meal deals come more often.",
      apply: function (m) { m.cap += 2; m.deals *= 1.6; } },
    { id: "side", label: "Add a side", detail: "The Liver gets an intern and works faster. More grease comes down.",
      apply: function (m) { m.speed.liver *= 1.45; m.mix.grease *= 1.45; } },
    { id: "refill", label: "Free refill", detail: "The Heart gets a bigger plunger: the pipes clear twice as fast. Every drink comes back for more.",
      apply: function (m) { m.drain *= 2; m.refillAll = true; } },
    { id: "salt", label: "Extra salt", detail: "The Kidneys find a third twin and work faster. More salt comes down.", from: 2,
      apply: function (m) { m.speed.kidneys *= 1.45; m.mix.salt *= 1.45; } },
    { id: "bucket", label: "Upgrade to a bucket", detail: "Flush recharges twice as fast. The pipes start the next meal fuller.", from: 3,
      apply: function (m, g) { m.flush *= 0.5; g.pipesStart += 12; } },
    { id: "yes", label: "Yes", detail: "It was always going to be yes. The pipes get a quick rinse, and that's all.",
      apply: function (m, g) { g.pipesStart -= 18; } }
  ];

  var RANKS = [
    { line: "The doctor has signed you fit for another day. The doctor would like a second opinion." },
    { line: "Your organs have filed a complaint. It has been put in a tray." },
    { line: "The pipes have been reported to the council. The council has gone large." },
    { line: "The Liver has asked to be moved to another body. The request is in a tray." }
  ];

  // What the clerks say. Two short lines at most.
  var SAY = {
    wrong: {
      liver: [["Not my", "department"], ["Does that look", "greasy"], ["Try next door"]],
      pancreas: [["Not my", "department"], ["That's not", "sugar"], ["Wrong desk"]],
      kidneys: [["We only", "do salt"], ["Not ours"], ["Wrong desk.", "Both of us"]]
    },
    full: [["We're full"], ["Take a", "number"], ["Tray's full"], ["One pair", "of hands"]],
    filed: {
      liver: [["More grease"], ["That's lard"], ["Lovely.", "Again"], ["Fine"]],
      pancreas: [["Sugar.", "Lovely"], ["More sugar"], ["Last nerve"], ["Sugar all", "the way down"]],
      kidneys: [["Salt again"], ["We'll split it"], ["We filter.", "No miracles"]]
    },
    leaf: [["What is", "this"], ["Is it food"], ["Filed under", "other"]],
    closed: [["Back at", "lunch"]],
    heartWorry: [["Pipes are", "fine"], ["Pipes are", "not fine"], ["Getting the", "big plunger"]],
    heartSpill: [["Who did", "that"], ["I saw", "that"]],
    speakerStart: [["Hello. Any sides"], ["Go large for 30p"], ["Make it a meal"]],
    speakerDeal: [["Make it a meal"], ["Meal deal"]],
    speakerRefill: [["Free refill"]],
    speakerIdle: [["Any sides"], ["Dessert"], ["Go large"], ["Anything else"], ["Large for 30p more"], ["Try our new bucket"]],
    speakerEnd: [["Enjoy your meal"]]
  };

  var LOOKS = {
    liver: { id: "liver", shirt: "paper", hat: "visor", tie: true },
    pancreas: { id: "pancreas", shirt: "accent", dots: true, hat: "bob", glasses: true, chain: true, cardigan: true },
    kidneys: { id: "kidneys", shirt: "paper", hat: "bowl", bow: true },
    heart: { id: "heart", shirt: "paper", hat: "flatcap", tache: true, overalls: true }
  };
  var DESKS = ["liver", "pancreas", "kidneys"];
  var DEPT = { liver: "grease", pancreas: "sugar", kidneys: "salt" };
  var NAMES = { liver: "Liver", pancreas: "Pancreas", kidneys: "Kidneys" };
  var KEYS = { liver: "Left", pancreas: "Right", kidneys: "Down" };

  var shell = null, T = null, ctx = null;
  var W = 1, H = 1, DPR = 1, U = 1, WW = 100, WH = 100;
  var L = null;
  var run = null, G = null, hudEls = null;
  var prev = {};
  var briefed = -1;
  var anim = 0;              // a clock for wobbles, always running
  var pointerMode = "keys";
  var hover = null;
  var mouse = { x: 0, y: 0, on: false };
  var swipe = null;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, f) { return a + (b - a) * clamp(f, 0, 1); }
  function fmt(n) { return Math.round(n).toLocaleString("en-GB"); }
  function info() { return STAGES[run.stage]; }
  function touching() { return root.classList.contains("kit-touching"); }
  function padsOn() { return touching() && !N.flags.clip; }
  function pick(list, rnd) { return list[Math.floor((rnd || Math.random)() * list.length)]; }
  function ease(t) { t = clamp(t, 0, 1); return 1 - (1 - t) * (1 - t); }
  function clockText(mins) {
    mins = Math.floor(mins) % (24 * 60);
    var h = Math.floor(mins / 60), m = mins % 60;
    return (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m;
  }
  function px(n) { return n / U; }       // CSS pixels to world units

  // ---------------------------------------------------------------------------
  // The round
  // ---------------------------------------------------------------------------
  function dayNumber() {
    if (shell.daily) return new Date().getDate();
    return 1 + (shell.seed % 30);
  }

  function reset(sh) {
    shell = sh;
    T = sh.tokens;
    run = {
      stage: DEBUG && params.get("stage") ? clamp(parseInt(params.get("stage"), 10) || 0, 0, LAST) : 0,
      day: dayNumber(),
      score: 0, filed: 0, spills: 0, wrong: 0, swallowed: 0, flushed: 0, leaves: 0,
      streak: 0, bestStreak: 0, peak: 0, taken: [],
      mods: { score: 1, rate: 1, cap: 0, deals: 1, drain: 1, flush: 1, refillAll: false,
              speed: { liver: 1, pancreas: 1, kidneys: 1 }, mix: { grease: 1, sugar: 1, salt: 1 } },
      signedOff: false, done: false,
      pipesCarry: 0
    };
    briefed = -1;
    prev = {};
    startStage();
    if (!hudEls) buildHud();
    paintHud();
  }

  function startStage() {
    var st = info();
    var carry = run.pipesCarry;
    G = {
      phase: "play",
      clock: 0,
      spawnWait: 0.6,
      dealWait: st.deal ? st.deal * 0.6 : 0,
      rnd: N.seeded(shell.seed + 101 * (run.stage + 1)),
      queue: [],
      plate: null,
      flying: [],
      fx: [],
      blobs: [],
      desks: {},
      pipes: clamp(carry, 0, 80),
      pipesStart: 0,
      flushWait: 0,
      flushSpin: 0,
      stageWrong: 0, stageSpills: 0, stageFiled: 0,
      speaker: { talk: 0, say: null, t: 0, idle: 4 },
      heart: { say: null, t: 0, worried: false, poke: 0 },
      intakeOpen: 0,
      endT: 0,
      auto: { think: 0, item: null },
      hint: { liver: 0, pancreas: 0, kidneys: 0, flush: 0 },
      taught: run.taught || { first: 0, kidneys: false, flush: false },
      nextId: 1,
      shake: 0,
      alarmT: 0
    };
    run.taught = G.taught;
    DESKS.forEach(function (id) {
      G.desks[id] = { id: id, tray: [], proc: 0, stampK: 0, say: null, sayT: 0, mood: "idle", moodT: 0, flash: 0, wobble: 0,
                      open: id !== "kidneys" || !!st.kidneys };
    });
    if (run.stage === 0 && !G.taught.first) G.taught.first = 0;
    speak(pick(SAY.speakerStart, G.rnd), 2.4);
    setFlushPad();
  }

  function cap() { return CAP + run.mods.cap; }
  function deskFor(kind) {
    for (var i = 0; i < DESKS.length; i++) if (DEPT[DESKS[i]] === kind) return DESKS[i];
    return null;
  }

  // ---------------------------------------------------------------------------
  // Food arriving. Everything is drawn from the meal's own seeded random, so
  // today's run serves the same food in the same order for everyone (until
  // the choices between meals change the mix).
  // ---------------------------------------------------------------------------
  function makeItem(food, opts) {
    var f = FOODS[food];
    opts = opts || {};
    return { id: G.nextId++, food: food, kinds: f.kinds.slice(), step: 0, bare: !!opts.bare, refill: !!opts.refill,
             isRefill: !!opts.isRefill, y: L ? L.chuteTop - 4 : 0, drop: 0, bounce: 0, big: !!f.big };
  }

  function rollFood() {
    var st = info(), r = G.rnd, m = run.mods.mix;
    if (r() < st.leaf) return "lettuce";
    if (st.big && r() < st.big) return pick(["quadruple", "loaded", "bucket"], r);
    var w = { grease: st.mix.grease * m.grease, sugar: st.mix.sugar * m.sugar, salt: st.mix.salt * m.salt };
    var total = w.grease + w.sugar + w.salt, x = r() * total, kind = "grease";
    if (x < w.grease) kind = "grease";
    else if (x < w.grease + w.sugar) kind = "sugar";
    else kind = "salt";
    var list = BY_KIND[kind];
    if (st.foods) list = list.filter(function (f) { return st.foods.indexOf(f) >= 0; });
    return pick(list, r);
  }

  function arrive(item) {
    G.intakeOpen = 1;
    sfx.arrive();
    if (!G.plate && !G.queue.length) { toPlate(item); return; }
    G.queue.push(item);
    if (G.queue.length > QUEUE_MAX) {
      // the chute's full: whatever's on the plate goes down whole
      if (G.plate) swallow();
      else toPlate(G.queue.shift());
    }
  }

  function spawn() {
    var st = info(), r = G.rnd;
    var food = rollFood();
    var bare = !!st.bare && !FOODS[food].big && food !== "lettuce" && r() < st.bare;
    var refill = !!st.refill && FOODS[food].drink && (run.mods.refillAll || r() < 0.55);
    arrive(makeItem(food, { bare: bare, refill: refill }));
    G.spawnWait = st.gap / run.mods.rate * (0.75 + r() * 0.5);
  }

  function mealDeal() {
    var r = G.rnd, st = info();
    var foods = [pick(BY_KIND.grease, r), pick(BY_KIND.salt, r), pick(["cola", "shake"], r)];
    foods.forEach(function (f, i) {
      var bare = !!st.bare && r() < st.bare * 0.6;
      var refill = !!st.refill && FOODS[f].drink && (run.mods.refillAll || r() < 0.55);
      var it = makeItem(f, { bare: bare, refill: refill });
      it.deal = true;
      it.y -= i * 6;
      arrive(it);
    });
    call("Meal deal", "routine");
    speak(pick(SAY.speakerDeal, r), 1.8);
    G.spawnWait = Math.max(G.spawnWait, info().gap * 0.9);
  }

  function toPlate(item) {
    item.drop = 0;
    item.from = Math.max(item.y, L.chuteTop + 2);
    G.plate = item;
    G.auto.item = null;
  }

  function nextOnPlate() {
    G.plate = null;
    if (G.queue.length) toPlate(G.queue.shift());
  }

  // ---------------------------------------------------------------------------
  // Sorting
  // ---------------------------------------------------------------------------
  function send(id) {
    if (!G || G.phase !== "play" || shell.state() !== "playing") return;
    var d = G.desks[id], it = G.plate;
    if (!it) { sfx.nope(); return; }
    if (!d.open) {
      say(d, SAY.closed[0], 1.4);
      d.wobble = 1;
      sfx.nope();
      call("Back at lunch", "routine");
      return;
    }
    var need = it.kinds[it.step];
    var leaf = need === "leaf";
    if (!leaf && DEPT[id] !== need) {
      // wrong desk: thrown back
      G.stageWrong++;
      run.wrong++;
      breakStreak();
      clog(CLOG.wrong, d);
      it.bounce = 1;
      it.bounceDir = id === "liver" ? -1 : id === "pancreas" ? 1 : 0;
      d.flash = 1;
      say(d, pick(SAY.wrong[id]), 1.5);
      mood(d, "shout", 0.9);
      sfx.wrong();
      call("Not my department");
      return;
    }
    var full = d.tray.length + countFlying(id) >= cap();
    var piece = it;
    if (it.kinds.length > 1 && it.step < it.kinds.length - 1) {
      // a big one: half of it goes, the rest stays on the plate
      piece = { id: G.nextId++, food: it.food, kinds: [need], step: 0, half: true };
      it.step++;
      it.bounce = 0.6;
      it.bounceDir = 0;
      it.chomp = 1;
    } else {
      nextOnPlate();
    }
    G.flying.push({ item: piece, to: id, t: 0, spill: full, x0: L.plate.x, y0: L.plate.y - 3 });
    sfx.send();
    if (full) {
      // it goes, but there's nowhere to put it
      G.stageSpills++;
      run.spills++;
      breakStreak();
      return;
    }
    G.stageFiled++;
    run.filed++;
    if (leaf) {
      run.leaves++;
      score(25);
      say(d, pick(SAY.leaf), 1.6);
      mood(d, "shock", 1);
      call("Lettuce: unrecognised");
    } else {
      score(10);
      run.streak++;
      run.bestStreak = Math.max(run.bestStreak, run.streak);
      if (run.streak === 10 || run.streak === 20 || run.streak === 30) { call("Streak x" + mult()); sfx.streak(); }
      if (G.rnd() < 0.14 && !d.say) say(d, pick(SAY.filed[id]), 1.3);
    }
    if (it.refill && !it.isRefill && piece === it) {
      // free refill: it comes back
      var again = makeItem(it.food, { isRefill: true, bare: it.bare });
      again.y = L.chuteTop - 4;
      G.queue.unshift(again);
      if (G.queue.length === 1 && !G.plate) toPlate(G.queue.shift());
      call("Free refill", "routine");
      if (!G.speaker.say) speak(SAY.speakerRefill[0], 1.4);
    }
  }

  function countFlying(id) {
    var n = 0;
    G.flying.forEach(function (f) { if (f.to === id && !f.spill) n++; });
    return n;
  }

  function flush() {
    if (!G || G.phase !== "play" || shell.state() !== "playing") return;
    if (!info().flush) return;
    if (!G.plate) { sfx.nope(); return; }
    if (G.flushWait > 0) {
      sfx.nope();
      G.hint.flush = 1.2;
      return;
    }
    var it = G.plate;
    G.flying.push({ item: it, to: "hatch", t: 0, x0: L.plate.x, y0: L.plate.y - 3 });
    nextOnPlate();
    G.flushWait = FLUSH_WAIT * run.mods.flush;
    run.flushed++;
    sfx.flush();
    call("Flushed", "routine");
  }

  function swallow() {
    var it = G.plate;
    if (!it) return;
    G.flying.push({ item: it, to: "pipes", t: 0, x0: L.plate.x, y0: L.plate.y - 3 });
    run.swallowed++;
    G.stageSpills++;
    breakStreak();
    nextOnPlate();
    sfx.gulp();
    call("Swallowed whole");
  }

  function clog(n, from) {
    G.pipes += n;
    run.peak = Math.max(run.peak, G.pipes);
    G.blobs.push({ t: 0, x: from ? L[from.id].tray.x : L.plate.x, y: from ? L[from.id].tray.y : L.plate.y, n: n });
    if (G.pipes > 60 && !G.heart.say && G.rnd() < 0.5) heartSay(pick(SAY.heartWorry.slice(1)), 1.6);
  }

  function score(n) { run.score += Math.round(n * mult() * run.mods.score); }
  function mult() { return Math.min(4, 1 + Math.floor(run.streak / 10)); }
  function breakStreak() {
    if (run.streak >= 10) call("Streak: over", "routine");
    run.streak = 0;
  }

  function say(d, lines, secs) { d.say = lines; d.sayT = secs || 1.4; }
  function mood(d, m, secs) { d.mood = m; d.moodT = secs || 0.8; }
  // The board over the chute says it, scrolling if it's long, so it stays up
  // long enough to read
  function speak(lines, secs) {
    G.speaker.say = lines;
    G.speaker.t = Math.max(secs || 1.8, lines.join(" ").length * 0.13 + 0.6);
    G.speaker.talk = 1;
  }
  function heartSay(lines, secs) { G.heart.say = lines; G.heart.t = secs || 1.6; }

  // In-game stamps: at most one at a time; routine ones not too often
  var lastCall = 0;
  function call(text, routine) {
    var now = Date.now();
    if (routine && now - lastCall < 1600) return;
    lastCall = now;
    shell.callout(text);
  }

  // ---------------------------------------------------------------------------
  // Every frame
  // ---------------------------------------------------------------------------
  function update(dt, input) {
    anim += dt;
    if (!run || !G || !L) return;
    animate(dt);
    if (shell.state() !== "playing") { prev = {}; return; }

    if (G.phase === "play") play(dt, input);
    else if (G.phase === "clear") {
      G.endT += dt;
      if (G.endT > 1.1) stageDone();
    } else if (G.phase === "off") {
      G.endT += dt;
      if (G.endT > 1.4) end();
    }
    paintHud();
  }

  function play(dt, input) {
    var st = info();
    G.clock += dt;

    // controls: a fresh press only
    var auto = AUTOPILOT ? autopilot(dt) : null;
    var press = function (k) { var on = !!input[k]; var was = prev[k]; prev[k] = on; return on && !was; };
    var pl = press("left"), pr = press("right"), pd = press("down"), pu = press("up"), pa = press("action"), pf = press("flush");
    if (!AUTOPILOT) {
      if (pl || pr || pd || pu || pa) { if (pointerMode !== "keys") pointerMode = "keys"; }
      if (pl) send("liver");
      else if (pr) send("pancreas");
      else if (pd) send("kidneys");
      if (pu || pa || pf) flush();
    } else if (auto) {
      if (auto === "flush") flush();
      else send(auto);
    }

    // arrivals
    if (G.clock < st.time) {
      G.spawnWait -= dt;
      if (G.spawnWait <= 0) spawn();
      if (st.deal) {
        G.dealWait -= dt;
        if (G.dealWait <= 0) {
          G.dealWait = st.deal / run.mods.deals * (0.85 + G.rnd() * 0.3);
          if (G.clock < st.time - 2) mealDeal();
        }
      }
    }

    // the desks stamp things through
    DESKS.forEach(function (id) {
      var d = G.desks[id];
      if (!d.tray.length) { d.proc = 0; return; }
      d.proc += dt * RATE * run.mods.speed[id];
      if (d.proc >= 1) {
        d.proc -= 1;
        d.tray.shift();
        d.stampK = 1;
        sfx.stamp(id);
      }
    });

    // the pipes drain
    G.pipes = Math.max(0, G.pipes - DRAIN * run.mods.drain * dt);
    if (G.flushWait > 0) {
      var was = G.flushWait;
      G.flushWait = Math.max(0, G.flushWait - dt);
      if (was > 0 && G.flushWait === 0) sfx.ready();
    }
    setFlushPad();

    // the speaker, every so often
    G.speaker.idle -= dt;
    if (G.speaker.idle <= 0) {
      G.speaker.idle = 5 + G.rnd() * 4;
      if (!G.speaker.say && G.clock < st.time) speak(pick(SAY.speakerIdle, G.rnd), 1.5);
    }

    // the heart frets when the pipes are high
    if (G.pipes > 75) {
      G.alarmT -= dt;
      if (G.alarmT <= 0) { G.alarmT = 0.9; sfx.alarm(); }
      if (!G.heart.worried) { G.heart.worried = true; heartSay(SAY.heartWorry[1], 1.6); }
    } else if (G.pipes < 55) G.heart.worried = false;

    teach();

    if (G.pipes >= 100) { signOff(); return; }

    // the meal's over when the food's stopped and everything's sorted
    if (G.clock >= st.time && !G.plate && !G.queue.length && !G.flying.length) {
      G.phase = "clear";
      G.endT = 0;
      speak(SAY.speakerEnd[0], 1.6);
      sfx.bell();
    }
  }

  // Animations that run whatever the state: flights, bounces, faces
  function animate(dt) {
    var anyFly = G.flying.length;
    G.flying = G.flying.filter(function (f) {
      f.t += dt / (f.to === "pipes" ? 0.5 : f.to === "hatch" ? 0.34 : 0.22);
      if (f.t < 1) return true;
      land(f);
      return false;
    });
    if (anyFly && !G.flying.length && G.phase === "play") { /* nothing */ }
    G.fx = G.fx.filter(function (e) { e.t += dt / e.dur; return e.t < 1; });
    G.blobs = G.blobs.filter(function (b) { b.t += dt / 0.9; return b.t < 1; });
    if (G.plate) {
      var p = G.plate;
      // it falls from wherever it was in the chute
      var fall = Math.max(4, L.plate.y - 3 - (p.from == null ? L.chuteBottom - 3 : p.from));
      p.drop = Math.min(1, p.drop + dt * 120 / fall);
      if (p.bounce > 0) p.bounce = Math.max(0, p.bounce - dt * 3);
      if (p.chomp > 0) p.chomp = Math.max(0, p.chomp - dt * 4);
    }
    // the queue slides down the chute
    G.queue.forEach(function (it, i) {
      var target = L.slot(i);
      it.y = it.y < target ? Math.min(target, it.y + dt * 70) : target;
    });
    G.intakeOpen = Math.max(0, G.intakeOpen - dt * 3);
    G.flushSpin += dt * (G.flushWait > 0 ? 1 : 3);
    DESKS.forEach(function (id) {
      var d = G.desks[id];
      d.stampK = Math.max(0, d.stampK - dt * 5);
      d.flash = Math.max(0, d.flash - dt * 2.5);
      d.wobble = Math.max(0, d.wobble - dt * 3);
      if (d.sayT > 0) { d.sayT -= dt; if (d.sayT <= 0) d.say = null; }
      if (d.moodT > 0) { d.moodT -= dt; if (d.moodT <= 0) d.mood = "idle"; }
    });
    var sp = G.speaker;
    if (sp.t > 0) { sp.t -= dt; if (sp.t <= 0) sp.say = null; }
    sp.talk = Math.max(0, sp.talk - dt * 1.2);
    if (G.heart.t > 0) { G.heart.t -= dt; if (G.heart.t <= 0) G.heart.say = null; }
    G.heart.poke = Math.max(0, G.heart.poke - dt * 2);
    G.shake = Math.max(0, G.shake - dt * 3);
    ["liver", "pancreas", "kidneys", "flush"].forEach(function (k) { G.hint[k] = Math.max(0, G.hint[k] - dt); });
  }

  function land(f) {
    if (f.to === "hatch") {
      G.fx.push({ kind: "puff", x: L.hatch.x, y: L.hatch.y, t: 0, dur: 0.6 });
      return;
    }
    if (f.to === "pipes") {
      clog(CLOG.swallow, null);
      G.fx.push({ kind: "splat", x: L.gauge.x, y: L.gauge.y + L.gauge.h * 0.3, t: 0, dur: 0.6 });
      G.heart.poke = 1;
      if (!G.heart.say) heartSay(pick(SAY.heartSpill), 1.3);
      G.shake = Math.max(G.shake, 0.6);
      return;
    }
    var d = G.desks[f.to];
    if (f.spill || d.tray.length >= cap()) {
      clog(CLOG.spill, d);
      d.flash = 1;
      say(d, pick(SAY.full), 1.5);
      mood(d, "sweat", 1.2);
      G.fx.push({ kind: "splat", x: L[f.to].tray.x, y: L[f.to].tray.y - 2, t: 0, dur: 0.7 });
      G.shake = Math.max(G.shake, 0.8);
      sfx.spill();
      call("Overflow");
      if (!f.spill) { G.stageSpills++; run.spills++; G.stageFiled--; run.filed--; breakStreak(); }
      return;
    }
    d.tray.push(f.item);
    sfx.land();
  }

  // Bobbing arrows that teach the controls, the first few times they matter
  function teach() {
    var it = G.plate;
    if (!it || it.drop < 1) return;
    var need = it.kinds[it.step];
    var id = need === "leaf" ? null : deskFor(need);
    if (run.stage === 0 && G.stageFiled < 5 && id) G.hint[id] = 0.2;
    if (id === "kidneys" && !G.taught.kidneys) {
      G.hint.kidneys = 0.2;
      if (G.desks.kidneys.tray.length) G.taught.kidneys = true;
    }
    if (info().flush && !G.taught.flush && G.flushWait === 0 && id && G.desks[id].tray.length >= cap() - 1) {
      G.hint.flush = 0.2;
    }
    if (run.flushed) G.taught.flush = true;
  }

  // ---------------------------------------------------------------------------
  // The autopilot, for ?autopilot and ?clip. It waits a human reaction time
  // after each new item, sends it to the right desk, and when that desk is
  // full it flushes if it can, waits if the chute has room, and spills if not.
  // ---------------------------------------------------------------------------
  function autopilot(dt) {
    var it = G.plate;
    if (!it || it.drop < 1) return null;
    var a = G.auto;
    var key = it.id + ":" + it.step + ":" + (it.bounce > 0 ? "b" : "");
    if (a.item !== key) {
      a.item = key;
      var base = SKILL || (N.flags.clip ? 0.42 : 0.3);
      a.think = base * (0.8 + Math.random() * 0.4) + (it.bare ? base * 0.4 : 0);
      a.wait = 0;
    }
    a.think -= dt;
    if (a.think > 0) return null;
    var need = it.kinds[it.step];
    var id = need === "leaf" ? leafDesk() : deskFor(need);
    // a slow player gets the odd one wrong, mostly when the sticker's off
    if (SKILL && SKILL > 0.4 && !a.erred) {
      a.erred = true;
      if (Math.random() < (it.bare ? 0.18 : 0.04) * SKILL / 0.45) {
        var open = DESKS.filter(function (k) { return k !== id && G.desks[k].open; });
        if (open.length) return pick(open);
      }
    }
    var d = G.desks[id];
    if (d.tray.length + countFlying(id) >= cap()) {
      if (info().flush && G.flushWait === 0) { a.erred = false; return "flush"; }
      a.wait += dt;
      if (G.queue.length < QUEUE_MAX - 1 && a.wait < 3) return null;
    }
    a.erred = false;
    return id;
  }
  function leafDesk() {
    var best = null;
    DESKS.forEach(function (id) {
      var d = G.desks[id];
      if (!d.open) return;
      if (!best || d.tray.length < G.desks[best].tray.length) best = id;
    });
    return best || "liver";
  }

  // ---------------------------------------------------------------------------
  // Between meals, and the end of the day
  // ---------------------------------------------------------------------------
  function stageDone() {
    var st = info();
    G.phase = "done";
    var left = Math.max(0, 100 - G.pipes);
    var bonus = Math.round(left * 0.5 * (run.stage + 1));
    var clean = G.stageWrong + G.stageSpills === 0 ? 100 : 0;
    run.score += bonus + clean;
    paintHud();
    if (run.stage === LAST) { goToBed(); return; }
    var offers = offer();
    var next = run.stage + 1;
    var bad = G.stageWrong + G.stageSpills;
    var stamp = bad === 0 ? "Approved" : bad <= 3 ? "Pending review" : "Not approved";
    var stats = [
      { label: "Filed", value: String(G.stageFiled) },
      { label: "Gone wrong", value: String(bad) },
      { label: "Pipes", value: Math.round(G.pipes) + "% full" },
      { label: clean ? "Clean meal" : "Pipe bonus", value: "+" + fmt(bonus + clean) },
      { label: "Score", value: fmt(run.score) }
    ];
    var carry = G.pipes;
    shell.interlude({
      stamp: stamp,
      tilt: stamp === "Approved" ? -5 : 4,
      heading: st.name + " is done.",
      line: st.clear,
      stats: stats,
      ask: STAGES[next].name + " is at " + clockText(STAGES[next].at) + ". Would you like to go large?",
      choices: offers.map(function (o) { return { label: o.label, detail: o.detail }; })
    }).then(function (i) {
      var o = offers[i] || offers[0];
      var g = { pipesStart: 0 };
      if (o) { run.taken.push(o.id); o.apply(run.mods, g); }
      run.pipesCarry = Math.max(0, carry - REST + g.pipesStart);
      run.stage = next;
      startStage();
      paintHud();
      shell.next();
    });
  }

  // Three answers you haven't given yet, all of them yes, from the run's seed
  function offer() {
    var rnd = N.seeded(shell.seed + 7000 + 1000 * run.stage);
    var next = run.stage + 1;
    var pool = OFFERS.filter(function (o) { return run.taken.indexOf(o.id) < 0 && o.id !== "yes" && (!o.from || next >= o.from); });
    var out = [];
    while (out.length < 2 && pool.length) out.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
    // there's always a plain yes
    out.push(OFFERS[OFFERS.length - 1]);
    return out;
  }

  function signOff() {
    G.phase = "off";
    G.endT = 0;
    run.signedOff = true;
    G.pipes = 100;
    sfx.signedOff();
    call("Signed off");
    heartSay(["That's", "me done"], 2);
    DESKS.forEach(function (id) { mood(G.desks[id], "shock", 3); });
    G.shake = 1;
  }

  function goToBed() {
    run.score += 250;
    run.done = true;
    end();
  }

  function end() {
    var bad = run.spills + run.wrong + run.swallowed;
    var place;
    if (run.done) place = bad <= 4 ? 1 : 2;
    else place = run.stage >= 2 ? 3 : 4;
    var rec = shell.record(run.score);
    var meal = info().name.charAt(0).toLowerCase() + info().name.slice(1);
    var when = run.stage === LAST ? "in the late one" : "at " + meal;
    var heading = run.done ? "Day " + run.day + " of 30. You made it to bed." : "Day " + run.day + " of 30. Signed off " + when + ".";
    var stats = [
      { label: "Score", value: fmt(run.score) },
      { label: "Filed", value: String(run.filed) },
      { label: "Gone wrong", value: String(bad) },
      { label: "Pipes at worst", value: Math.round(Math.min(100, run.peak)) + "%" },
      { label: rec.isNew ? (shell.daily ? "New best today" : "New best") : (shell.daily ? "Best today" : "Best"),
        value: fmt(rec.best || 0), highlight: rec.isNew }
    ];
    if (shell.daily) stats.unshift({ label: "Run", value: shell.today });
    shell.finish({
      place: place,
      total: 4,
      heading: heading,
      line: RANKS[place - 1].line,
      stats: stats,
      share: "day " + run.day + " of 30, " + fmt(run.score) + " points, " + (run.done ? "made it to bed" : "signed off " + when),
      delay: run.done ? 1200 : 1600
    });
  }

  // ---------------------------------------------------------------------------
  // HUD: the day and the meal top left, the score and the pipes top right
  // ---------------------------------------------------------------------------
  function buildHud() {
    shell.hud.innerHTML =
      '<div class="kit-hud-tl">' +
        '<p class="kit-stat"><small>Day</small><span data-day>1</span></p>' +
        '<p class="kit-stat"><small data-meal>Breakfast</small><span data-clock>07:30</span></p>' +
      '</div>' +
      '<div class="kit-hud-tr">' +
        '<p class="kit-stat kit-stat-big" data-score>0</p>' +
        '<p class="kit-meter" data-pipes><span class="kit-meter-label">Pipes</span><span class="kit-meter-bar"><span data-pipes-bar></span></span></p>' +
        '<p class="kit-stat" data-minor><small>Streak</small><span data-streak>x1</span></p>' +
      '</div>';
    hudEls = {};
    ["day", "meal", "clock", "score", "streak", "pipes", "pipes-bar"].forEach(function (k) { hudEls[k] = shell.hud.querySelector("[data-" + k + "]"); });
  }
  function setText(node, text) { if (node && node.textContent !== text) node.textContent = text; }
  function paintHud() {
    if (!hudEls || !run || !G) return;
    var st = info();
    setText(hudEls.day, run.day + " of 30");
    setText(hudEls.meal, st.name);
    setText(hudEls.clock, clockText(st.at + Math.min(G.clock, st.time)));
    setText(hudEls.score, fmt(run.score));
    setText(hudEls.streak, "x" + mult());
    var k = clamp(G.pipes / 100, 0, 1);
    hudEls["pipes-bar"].style.width = (k * 100).toFixed(1) + "%";
    hudEls.pipes.classList.toggle("is-full", k > 0.75);
  }

  // The Flush button only shows once there's a hatch, and fills as it recharges
  var flushPad = null;
  function setFlushPad() {
    if (!flushPad) flushPad = root.querySelector('.kit-pad[data-key="flush"]');
    if (!flushPad || !run) return;
    var on = !!info().flush;
    flushPad.style.visibility = on ? "" : "hidden";
    if (on) shell.padFill("flush", G.flushWait > 0 ? 1 - G.flushWait / (FLUSH_WAIT * run.mods.flush) : 1);
  }

  // ---------------------------------------------------------------------------
  // Layout, in world units: 100 across the screen's shorter side
  // ---------------------------------------------------------------------------
  function layout() {
    var cx = WW / 2;
    var top = Math.max(px(58), 11);
    var plateY = clamp(WH * 0.52, top + 32, WH - 40);
    var side = clamp(WW * 0.34, 31, 48);
    var deskW = 25, deskY = plateY + 3;
    var kY = WH - 11;
    var o = {
      cx: cx,
      top: top,
      board: { y: top + 0.5, w: 27, h: 7.5 },
      chuteTop: top + 8,
      chuteBottom: plateY - 6.5,
      chuteW: 13,
      plate: { x: cx, y: plateY, r: 11 },
      deskW: deskW,
      gauge: { x: 5, y: WH - 31, w: 5, h: 25 },
      heart: { x: 17.5, y: WH - 21, r: 4.8 },
      hatch: { x: WW - 11, y: WH - 12, r: 5.2 }
    };
    o.liver = { x: cx - side, deskY: deskY, head: { x: cx - side - 2.5, y: deskY - 8.5, r: 6.4 } };
    o.pancreas = { x: cx + side, deskY: deskY, head: { x: cx + side + 2.5, y: deskY - 8.5, r: 6.4 } };
    o.kidneys = { x: cx, deskY: kY, heads: [{ x: cx - 4, y: kY - 7.5, r: 5.2 }, { x: cx + 7, y: kY - 7.5, r: 5.2 }] };
    o.liver.tray = { x: o.liver.x + 7.5, y: deskY - 0.6, w: 9.5 };
    o.pancreas.tray = { x: o.pancreas.x - 7.5, y: deskY - 0.6, w: 9.5 };
    o.kidneys.tray = { x: cx - 14.5, y: kY - 0.6, w: 9.5 };
    o.liver.sign = { x: o.liver.head.x, y: deskY - 22 };
    o.pancreas.sign = { x: o.pancreas.head.x, y: deskY - 22 };
    o.kidneys.sign = { x: cx + 1.5, y: kY - 19.5 };
    // hit areas for a click or a tap: the clerk, the desk and the sign
    o.liver.hit = { x: o.liver.x - deskW / 2 - 2, y: deskY - 27, w: deskW + 4, h: 38 };
    o.pancreas.hit = { x: o.pancreas.x - deskW / 2 - 2, y: deskY - 27, w: deskW + 4, h: 38 };
    o.kidneys.hit = { x: cx - 20, y: kY - 24, w: 40, h: 34 };
    // where the chute's queue sits: slot 0 at the bottom
    o.slots = Math.max(2, Math.floor((o.chuteBottom - o.chuteTop - 3) / 8.5));
    o.slot = function (i) { return o.chuteBottom - 4.6 - Math.min(i, o.slots - 1) * 8.5; };
    return o;
  }

  // ---------------------------------------------------------------------------
  // Drawing
  // ---------------------------------------------------------------------------
  var bg = null, bgKey = "";
  function background() {
    var key = W + "x" + H + "@" + DPR + ":" + run.stage + ":" + padsOn();
    if (bg && bgKey === key) return bg;
    bgKey = key;
    bg = document.createElement("canvas");
    bg.width = Math.round(W * DPR);
    bg.height = Math.round(H * DPR);
    var c = bg.getContext("2d");
    c.setTransform(DPR * U, 0, 0, DPR * U, 0, 0);
    c.fillStyle = T.ink;
    c.fillRect(0, 0, WW, WH);
    // the office wall: panels and a dado rail, in faint ash
    c.strokeStyle = T.ash;
    c.lineWidth = 0.5;
    for (var x = 4; x < WW; x += 16) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, WH * 0.62); c.stroke(); }
    c.beginPath(); c.moveTo(0, WH * 0.62); c.lineTo(WW, WH * 0.62); c.stroke();
    c.lineWidth = 0.9;
    c.beginPath(); c.moveTo(0, WH * 0.62 + 1.4); c.lineTo(WW, WH * 0.62 + 1.4); c.stroke();
    // a little halftone texture in the corners
    c.save();
    c.globalAlpha = 0.18;
    c.fillStyle = T.paper;
    var dot = 1.1;
    for (var yy = 0; yy < WH; yy += 2.6) {
      for (var xx = 0; xx < WW; xx += 2.6) {
        var edge = Math.min(xx, WW - xx) / WW + Math.min(yy, WH - yy) / WH;
        var r = dot * clamp(0.5 - edge * 1.6, 0, 0.5);
        if (r > 0.05) { c.beginPath(); c.arc(xx + (yy % 5.2 ? 1.3 : 0), yy, r, 0, Math.PI * 2); c.fill(); }
      }
    }
    c.restore();
    // a poster on the wall, behind the speaker: five a day, with a tally of none
    var px0 = L.cx - 31, py0 = L.top + 2;
    var roomy = px0 - 7 > px(130);      // clear of the HUD's top left corner
    if (roomy && run.stage < 3) {
      c.save();
      c.translate(px0, py0);
      c.rotate(-0.06);
      A.rr(c, -6, -1, 12, 14, 0.6);
      A.fill(c, T.paper, 0.5);
      A.font(c, 2.6);
      c.fillStyle = T.ink;
      c.textAlign = "center";
      c.textBaseline = "middle";
      A.text(c, "5 A DAY", 0, 2.6, 2.6);
      A.font(c, 6);
      c.fillStyle = T.red;
      A.text(c, "0", 0, 8.4, 6);
      c.restore();
    }
    // the pipes along the floor, from the hatch to the gauge
    var fy = WH - 2.6;
    c.beginPath();
    c.moveTo(L.gauge.x, L.gauge.y + L.gauge.h);
    c.lineTo(L.gauge.x, fy);
    c.lineTo(WW - 3, fy);
    A.stroke(c, 2.4, T.paper);
    c.beginPath();
    c.moveTo(L.gauge.x, L.gauge.y + L.gauge.h);
    c.lineTo(L.gauge.x, fy);
    c.lineTo(WW - 3, fy);
    A.stroke(c, 1.2, T.ink);
    // joints
    [L.cx - 30, L.cx, L.cx + 30].forEach(function (jx) {
      if (jx < 8 || jx > WW - 6) return;
      A.rr(c, jx - 1.2, fy - 1.8, 2.4, 3.6, 0.4);
      A.fill(c, T.paper, 0.4);
    });
    // the late one: a window with the moon in it
    if (run.stage === 3) {
      var wx = L.cx - 31, wy = L.top + 3;
      if (roomy) {
        A.rr(c, wx - 7, wy - 1, 14, 13, 0.6);
        A.fill(c, T.ink, 0.6, T.paper);
        c.beginPath();
        c.moveTo(wx, wy - 1); c.lineTo(wx, wy + 12); c.moveTo(wx - 7, wy + 5.5); c.lineTo(wx + 7, wy + 5.5);
        A.stroke(c, 0.5, T.paper);
        A.ell(c, wx + 3.4, wy + 2.6, 2, 2);
        A.fill(c, T.paper);
        A.ell(c, wx + 2.6, wy + 2.1, 1.6, 1.6);
        A.fill(c, T.ink);
      }
    }
    return bg;
  }

  function render(dt) {
    if (!ctx || !run || !G || !L) return;
    // each meal's notice goes up with its countdown, so it's read before Go
    if (briefed !== run.stage && shell.state() === "countdown") {
      briefed = run.stage;
      notice();
    }
    A.init(T, U * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.drawImage(background(), 0, 0, W, H);
    var sx = 0, sy = 0;
    if (G.shake > 0 && !shell.reduceMotion) { sx = (Math.random() - 0.5) * 1.2 * G.shake; sy = (Math.random() - 0.5) * 1.2 * G.shake; }
    ctx.setTransform(DPR * U, 0, 0, DPR * U, sx * DPR * U, sy * DPR * U);
    var c = ctx;

    drawHeart(c);
    drawHatch(c);
    drawChute(c);
    DESKS.forEach(function (id) { drawDesk(c, id); });
    drawPlate(c);
    drawFlying(c);
    drawFx(c);
    drawBubbles(c);
    drawHints(c);
    if (G.phase === "off") {
      A.stamp(c, L.cx, L.plate.y - 2, "Signed off", 7, -0.1, Math.min(1, G.endT * 3), 1 + Math.max(0, 0.3 - G.endT) * 2);
    }
  }

  function drawChute(c) {
    var x = L.cx;
    A.chute(c, x, L.chuteTop + 2, L.chuteBottom, L.chuteW);
    c.save();
    A.rr(c, x - L.chuteW / 2 + 0.6, L.chuteTop + 2.6, L.chuteW - 1.2, L.chuteBottom - L.chuteTop - 3.2, 1);
    c.clip();
    var shown = Math.min(G.queue.length, L.slots);
    for (var i = shown - 1; i >= 0; i--) {
      var it = G.queue[i];
      // stickers stay on in the chute: you can see what's coming
      A.item(c, it, x, it.y, 6.6, { minSticker: 2.6, rot: (it.id % 3 - 1) * 0.08 });
    }
    c.restore();
    A.board(c, x, L.board.y, L.board.w, L.board.h, G.speaker.say ? G.speaker.say.join(" ") : null, anim, G.intakeOpen);
    if (G.queue.length > L.slots) A.label(c, "+" + (G.queue.length - L.slots), x - L.chuteW / 2 - 1.5, L.chuteTop + 5, 3.8, "right");
    // queue pressure: the chute's mouth goes red when it's nearly full
    if (G.queue.length >= QUEUE_MAX - 1) {
      var blink = Math.floor(anim * 5) % 2;
      A.rr(c, x - L.chuteW * 0.62, L.chuteBottom - 1.4, L.chuteW * 1.24, 2.4, 0.8);
      A.fill(c, blink ? T.red : T.paper, 0.5);
      if (G.queue.length >= QUEUE_MAX) A.label(c, "Chute full", x + L.chuteW / 2 + 1.5, L.chuteBottom - 3, 3.6, "left", T.paper);
    }
  }

  function drawPlate(c) {
    var p = L.plate;
    var it = G.plate;
    A.plate(c, p.x, p.y + 3.5, p.r, false);
    if (!it) return;
    var k = ease(it.drop);
    var y = lerp(it.from == null ? L.chuteBottom - 3 : it.from, p.y - 3, k);
    var bx = 0;
    if (it.bounce > 0) {
      var b = it.bounce;
      if (it.bounceDir) bx = Math.sin(b * Math.PI) * it.bounceDir * 7 * b;
      else y -= Math.sin(b * Math.PI) * 4;
    }
    var size = it.big ? 15 : 13;
    if (it.chomp) size *= 1 - it.chomp * 0.12;
    A.item(c, it, p.x + bx, y, size, { minSticker: 3.8, squash: it.drop < 1 ? 0 : (it.bounce > 0 ? -0.08 * it.bounce : 0) });
    if (it.bare && it.drop >= 1) {
      // the sticker's come off: a sticky patch where it was
      A.rr(c, p.x + bx + size * 0.08, y + size * 0.3, size * 0.5, size * 0.22, size * 0.08);
      c.setLineDash([0.8, 0.8]);
      A.stroke(c, 0.4, T.paper);
      c.setLineDash([]);
    }
    if (it.isRefill && it.drop >= 1) A.label(c, "Refill", p.x - size * 0.55 + bx, y - size * 0.5, 3.6, "right", T.accent);
  }

  function drawDesk(c, id) {
    var d = G.desks[id], lo = L[id];
    var lit = hover === id && G.phase === "play" && d.open;
    var keyWord = touching() ? "" : pointerMode === "keys" ? KEYS[id] : "";
    // the sign
    A.sign(c, lo.sign.x, lo.sign.y, NAMES[id], d.open ? keyWord : "Back at lunch", 4.2, lit, !d.open);
    // the clerk(s), then the desk in front
    var t = anim;
    if (id === "kidneys") {
      lo.heads.forEach(function (h, i) {
        if (!d.open) return;
        A.clerk(c, h.x, h.y, h.r, LOOKS.kidneys, faceFor(d, h, i, t));
      });
      if (!d.open) {
        // their chairs, empty, with a cardigan over one
        lo.heads.forEach(function (h) {
          A.rr(c, h.x - h.r * 1.3, h.y - h.r * 0.2, h.r * 2.6, h.r * 2.4, h.r * 0.6);
          A.fill(c, T.ink, 0.6, T.paper);
        });
      }
    } else {
      A.clerk(c, lo.head.x, lo.head.y, lo.head.r, LOOKS[id], faceFor(d, lo.head, 0, t));
    }
    var w = id === "kidneys" ? 40 : L.deskW;
    A.desk(c, lo.x, lo.deskY, w, 8.5);
    // the department's sticker on the front of the desk
    A.sticker(c, DEPT[id], lo.x + (id === "kidneys" ? 5 : id === "liver" ? -3 : 3), lo.deskY + 5, 4.2, id === "liver" ? -0.05 : 0.05);
    A.tray(c, lo.tray.x, lo.tray.y, lo.tray.w, d.tray, cap(), d.flash > 0 && Math.floor(anim * 10) % 2 === 0);
    // mitten hands on the desk, and a stamp coming down on the tray when
    // something's done
    if (d.open) {
      var heads = id === "kidneys" ? lo.heads : [lo.head];
      heads.forEach(function (h) {
        var toward = lo.tray.x < h.x ? -1 : 1;
        A.mitten(c, h.x - toward * h.r * 0.95, lo.deskY - 0.3, h.r * 0.3);
        if (!(d.stampK > 0 && h === heads[0])) A.mitten(c, h.x + toward * h.r * 0.95, lo.deskY - 0.3, h.r * 0.3);
      });
      if (d.stampK > 0) A.stamper(c, lo.tray.x, lo.tray.y - 1.5, 3, 1 - Math.abs(d.stampK - 0.5) * 2);
    }
    if (d.stampK > 0.5) {
      // a little "Processed" stamp pops up
      A.stamp(c, lo.tray.x, lo.tray.y - 9 - (1 - d.stampK) * 6, "Done", 2.6, -0.12, d.stampK, 1);
    }
    if (lit) A.brackets(c, lo.hit.x + 1, lo.hit.y + 3, lo.hit.w - 2, lo.hit.h - 3, T.paper, 3, 0.6);
  }

  function faceFor(d, head, i, t) {
    var m = d.mood;
    var n = d.tray.length, full = n >= cap();
    if (m === "idle") {
      if (full) m = "sweat";
      else if (n > 0 && d.proc > 0.75) m = "busy";
    }
    // eyes on the plate
    var gx = clamp((L.plate.x - head.x) / 30, -1, 1), gy = clamp((L.plate.y - head.y) / 30, -1, 1);
    return {
      mood: m, gx: gx, gy: gy, talk: d.say ? (Math.sin(t * 18 + i) + 1) / 2 : 0,
      sweat: full ? 1 : n >= cap() - 1 ? 0.5 : 0, time: t + i,
      wobble: d.wobble > 0 && !shell.reduceMotion ? Math.sin(d.wobble * 20) * 0.08 : 0,
      blink: (Math.floor(t * 0.7 + i * 0.37 + head.x) % 7 === 0) && (t * 0.7 % 1) < 0.08
    };
  }

  function drawHeart(c) {
    var g = L.gauge, h = L.heart;
    A.gauge(c, g.x, g.y, g.w, g.h, G.pipes / 100, G.pipes > 75, anim);
    c.save();
    c.translate(g.x + g.w / 2 + 2.4, g.y + g.h * 0.5);
    c.rotate(-Math.PI / 2);
    A.label(c, "Pipes", 0, 0, 3.2);
    c.restore();
    var worried = G.pipes > 60;
    var mood = G.phase === "off" ? "sad" : worried ? "sweat" : G.heart.say ? "talk" : "idle";
    var poke = G.heart.poke > 0 && !shell.reduceMotion ? Math.sin(G.heart.poke * 12) * 0.2 : 0;
    A.plunger(c, h.x + 5.5, h.y + 7, 7, 0.25 + poke + (worried && !shell.reduceMotion ? Math.sin(anim * 9) * 0.12 : 0));
    A.clerk(c, h.x, h.y, h.r, LOOKS.heart, {
      mood: mood, gx: -0.8, gy: 0.4, talk: G.heart.say ? (Math.sin(anim * 18) + 1) / 2 : 0,
      sweat: worried ? 1 : 0, time: anim
    });
    A.mitten(c, h.x + 5.5, h.y + 7, 1.5);
    A.label(c, "Heart", h.x, h.y + h.r * 3.1, 3.4);
  }

  function drawHatch(c) {
    // on a touch screen the Flush button is the hatch
    if (!info().flush || padsOn()) return;
    var hh = L.hatch;
    var ready = G.flushWait > 0 ? 1 - G.flushWait / (FLUSH_WAIT * run.mods.flush) : 1;
    var word = padsOn() ? "" : touching() || pointerMode !== "keys" ? "Flush" : "Flush: Space";
    A.hatch(c, hh.x, hh.y, hh.r, ready, G.flushSpin, word);
    if (hover === "hatch" && G.phase === "play") A.brackets(c, hh.x - hh.r * 1.5, hh.y - hh.r * 1.5, hh.r * 3, hh.r * 3, T.paper, 2, 0.6);
  }

  function drawFlying(c) {
    G.flying.forEach(function (f) {
      var k = ease(f.t);
      var to;
      if (f.to === "hatch") to = { x: L.hatch.x, y: L.hatch.y };
      else if (f.to === "pipes") to = { x: L.gauge.x, y: L.gauge.y + 4 };
      else to = { x: L[f.to].tray.x, y: L[f.to].tray.y - 3 };
      var x = lerp(f.x0, to.x, k), y = lerp(f.y0, to.y, k) - Math.sin(k * Math.PI) * (f.to === "kidneys" ? 3 : 7);
      var s = lerp(13, f.to === "hatch" || f.to === "pipes" ? 4 : 6, k);
      if (!shell.reduceMotion) A.motion(c, f.x0, f.y0, x, y, s * 0.7);
      A.item(c, f.item, x, y, s, { noSticker: true, rot: (f.to === "hatch" ? k * 6 : f.to === "pipes" ? k * 3 : 0) });
    });
  }

  function drawFx(c) {
    G.fx.forEach(function (e) {
      if (e.kind === "puff") A.puff(c, e.x, e.y - 3, 4, e.t);
      else if (e.kind === "splat") A.splat(c, e.x, e.y, 5, e.t);
    });
    // clog travelling down to the pipes: a red blob dropping to the floor pipe
    G.blobs.forEach(function (b) {
      var k = b.t, fy = WH - 2.6;
      var x, y;
      if (k < 0.4) { x = b.x; y = lerp(b.y, fy, k / 0.4); }
      else { x = lerp(b.x, L.gauge.x, (k - 0.4) / 0.6); y = fy; }
      A.ell(c, x, y, 1.1 + b.n * 0.05, 1.1 + b.n * 0.05);
      A.fill(c, T.red, 0.4);
    });
  }

  function drawBubbles(c) {
    var size = 3.6;
    DESKS.forEach(function (id) {
      var d = G.desks[id];
      if (!d.say) return;
      var lo = L[id];
      var head = id === "kidneys" ? lo.heads[1] : lo.head;
      var bx = id === "liver" ? head.x + 4 : id === "pancreas" ? head.x - 4 : head.x + 13;
      var by = id === "kidneys" ? head.y - 3 : head.y - 12;
      A.bubble(c, bx, by, d.say, size, head.x, head.y - head.r, Math.min(1, d.sayT * 4), WW - 1.5, 1.5);
    });
    if (G.heart.say) {
      var h = L.heart;
      A.bubble(c, h.x + 12, h.y - 9, G.heart.say, size, h.x + 2, h.y - h.r, Math.min(1, G.heart.t * 4), WW - 1.5, 1.5);
    }
  }

  function drawHints(c) {
    if (G.phase !== "play" || shell.state() !== "playing") return;
    var bob = shell.reduceMotion ? 0 : Math.sin(anim * 6) * 1.2;
    DESKS.forEach(function (id) {
      if (G.hint[id] <= 0) return;
      var lo = L[id];
      var word = touching() ? "Tap" : pointerMode === "keys" ? KEYS[id] : "Click";
      if (id === "kidneys") A.arrow(c, lo.x + 15, lo.deskY - 14 + bob, word, 5, "down");
      else if (id === "liver") A.arrow(c, L.plate.x - L.plate.r - 4 + bob, L.plate.y - 1, word, 5, "left");
      else A.arrow(c, L.plate.x + L.plate.r + 4 - bob, L.plate.y - 1, word, 5, "right");
    });
    if (G.hint.flush > 0 && !padsOn()) {
      var hh = L.hatch;
      A.arrow(c, hh.x, hh.y - hh.r * 1.6 + bob, touching() ? "Flush" : pointerMode === "keys" ? "Space" : "Flush", 5, "down");
    }
  }

  // ---------------------------------------------------------------------------
  // Notices: what's new this meal, and what to do about it
  // ---------------------------------------------------------------------------
  function notice() {
    var touch = touching();
    var text;
    if (run.stage === 0) {
      text = touch
        ? "Tap the desk on each item's sticker: grease to the Liver, sugar to the Pancreas. A full in-tray spills into the pipes. Fill the pipes and you're signed off."
        : "Send each item to the desk on its sticker: grease left to the Liver, sugar right to the Pancreas. A full in-tray spills into the pipes. Fill the pipes and you're signed off.";
    } else if (run.stage === 1) {
      text = "The Kidneys are back from their break: salt goes to them" + (touch ? "." : " (down arrow).") +
        " Meal deals come three at a time.";
    } else if (run.stage === 2) {
      text = "New: Flush " + (touch ? "(the Flush button)" : "(Space or up arrow)") +
        " sends anything down the hatch, then recharges. Drinks come with a free refill: they come back once.";
    } else {
      text = "Half the stickers have come off. A doughnut is sugar. You know this. Big items have two stickers: sort them twice.";
    }
    shell.brief({ title: info().name + ", " + clockText(info().at), text: text, ms: run.stage === 0 ? 8000 : 6800 });
  }

  // ---------------------------------------------------------------------------
  // Sound: lo-fi, short and dry, through the kit
  // ---------------------------------------------------------------------------
  var S = N.sound;
  var sfx = {
    arrive: function () { S.tone(520, 0.06, { type: "triangle", slide: 260, vol: 0.04 }); },
    send: function () { S.noise(0.12, { type: "bandpass", freq: 1400, q: 0.8, vol: 0.08 }); },
    land: function () { S.tone(160, 0.07, { type: "square", slide: 90, vol: 0.05 }); },
    stamp: function (id) {
      var f = id === "liver" ? 130 : id === "pancreas" ? 150 : 115;
      S.tone(f, 0.08, { type: "sine", slide: 50, vol: 0.12 });
      S.noise(0.03, { freq: 2200, vol: 0.05 });
    },
    wrong: function () { S.tone(200, 0.08, { vol: 0.06 }); S.tone(150, 0.12, { vol: 0.06, delay: 0.08 }); },
    nope: function () { S.tone(180, 0.08, { vol: 0.04 }); },
    spill: function () {
      S.noise(0.35, { type: "lowpass", freq: 420, vol: 0.3 });
      S.tone(110, 0.3, { type: "sawtooth", slide: 55, vol: 0.07 });
    },
    gulp: function () {
      S.tone(420, 0.18, { type: "sine", slide: 110, vol: 0.12 });
      S.noise(0.15, { type: "lowpass", freq: 600, vol: 0.18, delay: 0.08 });
    },
    flush: function () {
      S.noise(0.7, { type: "bandpass", freq: 900, q: 0.6, vol: 0.22 });
      S.tone(700, 0.6, { type: "triangle", slide: 120, vol: 0.05 });
    },
    ready: function () { S.tone(990, 0.06, { type: "triangle", vol: 0.04 }); S.tone(1320, 0.08, { type: "triangle", vol: 0.04, delay: 0.07 }); },
    streak: function () { [660, 880, 1100].forEach(function (f, i) { S.tone(f, 0.08, { type: "triangle", vol: 0.05, delay: i * 0.06 }); }); },
    alarm: function () { S.tone(880, 0.09, { vol: 0.035 }); S.tone(660, 0.09, { vol: 0.035, delay: 0.12 }); },
    bell: function () { S.tone(1175, 0.18, { type: "triangle", vol: 0.06 }); S.tone(880, 0.32, { type: "triangle", vol: 0.06, delay: 0.16 }); },
    signedOff: function () {
      S.tone(74, 1.2, { type: "sawtooth", slide: 44, vol: 0.09 });
      S.noise(0.9, { type: "lowpass", freq: 500, vol: 0.22 });
      S.stamp(0.25);
    }
  };

  // ---------------------------------------------------------------------------
  // Pointer: a click or a tap on a desk sends it the food; a swipe from the
  // plate works too (left, right, down, and up to flush)
  // ---------------------------------------------------------------------------
  function local(e) {
    var r = root.getBoundingClientRect();
    return { x: (e.clientX - r.left) / U, y: (e.clientY - r.top) / U };
  }
  function onScreen(e) {
    var t = e.target;
    return !(t && t.closest && t.closest(".kit-panel, .kit-bar, .kit-pad, .kit-intro, button, a"));
  }
  function inBox(p, b) { return p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h; }
  function targetAt(p) {
    if (!L) return null;
    if (info().flush && Math.hypot(p.x - L.hatch.x, p.y - L.hatch.y) < L.hatch.r * 1.7) return "hatch";
    for (var i = 0; i < DESKS.length; i++) if (inBox(p, L[DESKS[i]].hit)) return DESKS[i];
    return null;
  }
  root.addEventListener("pointerdown", function (e) {
    if (!shell || !G || shell.state() !== "playing" || !onScreen(e)) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (e.pointerType !== "mouse") e.preventDefault();
    else pointerMode = "mouse";
    if (e.pointerType !== "mouse") pointerMode = "touch";
    if (AUTOPILOT) return;
    var p = local(e);
    var t = targetAt(p);
    if (t === "hatch") flush();
    else if (t) send(t);
    else swipe = { x: p.x, y: p.y, id: e.pointerId };
  });
  root.addEventListener("pointerup", function (e) {
    if (!swipe || swipe.id !== e.pointerId) return;
    var p = local(e), dx = p.x - swipe.x, dy = p.y - swipe.y;
    swipe = null;
    if (!shell || shell.state() !== "playing" || AUTOPILOT) return;
    if (Math.hypot(dx, dy) < 5) return;
    if (Math.abs(dx) > Math.abs(dy)) send(dx < 0 ? "liver" : "pancreas");
    else if (dy > 0) send("kidneys");
    else flush();
  });
  root.addEventListener("pointercancel", function () { swipe = null; });
  root.addEventListener("pointermove", function (e) {
    if (e.pointerType !== "mouse" || !shell) return;
    var p = local(e);
    mouse.x = p.x; mouse.y = p.y; mouse.on = onScreen(e);
    if (pointerMode !== "mouse" && (Math.abs(e.movementX) + Math.abs(e.movementY) > 2)) pointerMode = "mouse";
    hover = mouse.on && shell.state() === "playing" ? targetAt(p) : null;
    root.style.cursor = hover && !AUTOPILOT ? "pointer" : "";
  });
  root.addEventListener("pointerleave", function () { mouse.on = false; hover = null; root.style.cursor = ""; });

  function resize(w, h, dpr) {
    W = w; H = h; DPR = dpr;
    U = Math.min(W, H) / 100;
    WW = W / U; WH = H / U;
    ctx = (shell ? shell.canvas : root.querySelector("canvas")).getContext("2d");
    L = layout();
    bg = null;
    // in-game stamps land in the chute, under the board: over what's coming
    // next, never over the plate or a desk
    if (shell) shell.placeCallouts({ top: (L.board.y + L.board.h + 1.5) * U });
  }

  // ---------------------------------------------------------------------------
  // Start it up
  // ---------------------------------------------------------------------------
  shell = N.createGame({
    root: root,
    slug: "thirty-days",
    title: "Thirty Days",
    stamp: "Go large",
    tilt: -5,
    note: "Four meals a day. Three desks. Nobody does lettuce.",
    pitch: "Thirty days of fast food. Your insides are a council office, and the in-trays are full.",
    hints: {
      keys: "Left, right and down send the food to a desk. Space flushes, from dinner. P to pause.",
      touch: "Tap a desk to send it the food, or swipe from the plate."
    },
    againLabel: "Another day",
    daily: true,
    smallCallouts: true,
    keys: {
      up: ["ArrowUp", "KeyW"],
      down: ["ArrowDown", "KeyS"],
      left: ["ArrowLeft", "KeyA"],
      right: ["ArrowRight", "KeyD"],
      action: ["Space"],
      flush: ["KeyF", "Enter", "NumpadEnter"]
    },
    pad: { action: [0, 2], flush: [1, 3] },
    touch: [{ key: "flush", label: "Flush", icon: "Flush", side: "right" }],
    reset: reset,
    update: function (dt, input) { update(dt, input); },
    render: function (dt) { render(dt); },
    resize: resize
  });
  T = shell.tokens;
  resize(W, H, DPR);

  // The canvas font may arrive after the first frame
  if (document.fonts && document.fonts.load) {
    document.fonts.load("12px " + T.display).then(function () { bg = null; });
  }

  if (DEBUG) {
    window.__thirtyDays = {
      run: function () { return run; },
      stage: function () { return G; },
      layout: function () { return L; },
      state: function () { return shell.state(); },
      send: send,
      flush: flush,
      // where a desk is on the page, for tests that click and tap
      desk: function (id) {
        var r = root.getBoundingClientRect(), b = L[id].hit;
        return { x: r.left + (b.x + b.w / 2) * U, y: r.top + (b.y + b.h / 2) * U };
      },
      plate: function () {
        var it = G.plate;
        return it ? { food: it.food, need: it.kinds[it.step], bare: it.bare, ready: it.drop >= 1 } : null;
      },
      score: function () {
        return { stage: run.stage + 1, score: run.score, filed: run.filed, spills: run.spills, wrong: run.wrong,
                 swallowed: run.swallowed, pipes: Math.round(G.pipes), peak: Math.round(run.peak), queue: G.queue.length, taken: run.taken.join(",") };
      }
    };
  }
})();
