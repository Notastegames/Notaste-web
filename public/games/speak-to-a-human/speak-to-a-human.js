// Speak to a Human: the help chat as a boss fight.
//
// THE JOKE. Apps that put a bot between you and anyone who can help. You
// ordered food through A Delivery App (invented). It went wrong. The help
// chat is Assistant, a cheerful periwinkle chat bubble with a headset and a
// smile that never changes. It is never rude and it never helps. The bot and
// the app are the joke: never the riders, never the support staff, never
// you. The one "human" you reach, Dave, has the bot's smile under a
// moustache, and the moustache comes off.
//
// THE LOOP. Assistant sends a message (it types first, so you know it's
// coming) and offers four reply chips. One is true ("My drink is missing",
// "No, that did not help", "I want a refund"); the rest play along, and
// from the second order some are made to look like the true one ("No, that
// did help", "I want a refund voucher", "The chips are cool"). Tap the true
// one: the "Distance to a human" bar goes down. Faster is harder (up to 60%
// more for a reply in a third of a second), and true replies in a row stack
// (8% each, up to five). Three in a row earns the Speak to a human chip,
// which hits hardest. A wrong tap costs a patience and heals the bot; run
// out of patience and you close the app, which ends the round. Mashing loses.
//
// THE BOT FIGHTS BACK (each announced with a notice the first time):
// - "Did this answer your question?" Yes / Yes, and a small No that drifts
//   along under them and shrinks away. Catch it.
// - "Can I take your order number again?" Four lookalike numbers. Yours was
//   on the order card at the top of the chat when it opened.
// - "I understand you're frustrated." It's healing: a ring runs down and
//   the heal shows on the bar in red. A true reply before it ends stops it
//   and hits double ("Interrupted").
// - A 50p voucher, once an order (from the second), when it's losing: take
//   it and the order ends there for 50p; refuse and fight on.
// - "Are you still there?" A fuse; miss it and the chat starts again from
//   hello ("Loop detected"), with the bot healed.
// - A satisfaction survey over the chips: five big stars (each one heals the
//   bot) and a small No thanks that moves between corners.
// - Replies drift and swap places (keys follow the place, not the reply),
//   and on the last order the true reply shrinks and then it's gone.
//
// THE ORDERS (stages). Each opens with the tracking screen going wrong (6.4
// seconds, any key or tap skips it, and a restarted round skips it): the
// rider's dot circles the block, "Your rider is 2 minutes away" while the
// minutes since you ordered race up, then Delivered and a photo.
// 1. The missing drink (£2.80): the basics, Yes or yes.
// 2. The cold chips (£3.20): your order number, it understands, a voucher.
// 3. The hedge (£24.60): still there, the survey, replies that move.
// 4. The £14 coffee (£14.00, mostly fees): shrinking replies, then Dave, a
//    human, with his own bar ("Distance to a refund") and all of the above,
//    faster. He offers the voucher in this order.
//
// BETWEEN ORDERS (shell.interlude) pick one of three ways to get ready, each
// with a cost on its card: Type in capitals, Say agent repeatedly, Threaten a
// review, Screenshot your order, Charge your phone, Turn notifications on.
// It lasts one order. Patience comes back by one between orders.
//
// SCORE. The refund in pence, plus up to 300 a full refund for time (par
// for the order or better, nothing at 2.2 times par). The HUD shows the
// refund in pounds and the time spent in the chat.
// THE LADDER. Approved: all four refunded in full (Dave beaten) and at least
// APPROVED points. Pending review: finished, two or more in full. Not
// approved: finished on vouchers, or closed the app on the hedge or the
// coffee. Rejected: closed the app on the drink or the chips.
//
// TODAY'S RUN deals everyone the same order numbers, the same messages,
// replies and places, the same tricks in the same order and the same ways
// to get ready, each order from its own stream (planRun).
//
// TEST FLAGS (with ?debug): &stage=3 starts at that order, &dave starts at
// Dave, &hp=20 starts the bar there, &skill=0.4 sets the autopilot's skill
// (0 to 1) with ?autopilot.
//
// Built on the shared kit (/games/kit/kit.js). lines.js is the words, art.js
// draws the people, the map and the photos.
(function () {
  "use strict";

  var N = window.Notaste, A = window.STAHArt, L = window.STAHLines;
  var root = document.getElementById("game-root");
  if (!N || !A || !L || !root) return;

  var params = new URLSearchParams(window.location.search);
  var DEBUG = params.has("debug");
  var START_DAVE = DEBUG && params.has("dave");
  var FIRST = START_DAVE ? 3 : DEBUG ? clamp((parseInt(params.get("stage"), 10) || 1) - 1, 0, 3) : 0;
  var START_HP = DEBUG && params.has("hp") ? clamp(parseFloat(params.get("hp")) || 100, 1, 100) : 100;
  var AUTO = N.flags.autopilot;
  var CLIP = N.flags.clip;
  var SKILL = params.has("skill") ? clamp(parseFloat(params.get("skill")) || 0, 0, 1) : 0.85;
  var coarse = !!(window.matchMedia && window.matchMedia("(pointer: coarse)").matches);

  // ---------------------------------------------------------------------------
  // Tuning
  // ---------------------------------------------------------------------------
  var BASE = 5.4, FIN = 15;               // damage of a true reply, and of Speak to a human
  var QUICK = 0.6;                        // up to this much more for a quick reply
  var STREAK = 0.08, STREAK_MAX = 5;      // each true reply in a row adds this, up to five
  var ARMOUR = [1.3, 1.1, 1.0, 1.05];     // per order; Dave's below
  var DAVE_ARMOUR = 1.3;
  var HEAL = { decoy: 5, yes: 8, frustrated: 10, still: 15, star: 8, survey: 6, shrink: 6, number: 5, yesyes: 8 };
  var TYPING = [0.62, 0.55, 0.5, 0.45], DAVE_TYPING = 0.42;
  var FUSE = {                            // seconds, per order (Dave last)
    no: [2.8, 2.5, 2.3, 2.1, 2.0],
    ring: [1.7, 1.7, 1.5, 1.4, 1.3],
    still: [2.4, 2.4, 2.4, 2.2, 2.0],
    survey: [3.6, 3.6, 3.6, 3.3, 3.2],
    voucher: [4, 4, 4, 4, 4],
    shrink: [2.6, 2.6, 2.6, 2.6, 2.3]
  };
  var DRIFT = [0, 0, 0.06, 0.09, 0.1];    // share of a chip's width
  var SHUFFLE = [0, 0, 0.35, 0.45, 0.5];  // chance a message's replies swap places
  var PAR = [15, 16, 20, 38];             // seconds in the chat for the time bonus (order 4 includes Dave)
  var TIME_BONUS = 300;
  var PATIENCE = 5, PATIENCE_MAX = 5;
  var APPROVED = 5300;
  var IDLE = 6;                           // seconds before it asks if you're still there
  var TRACK_LEN = 6.0;

  // What turns up first, and when (by message), and how often after that
  var INTRO = [{ yesyes: 3 }, { number: 2, frustrated: 4 }, { still: 2, survey: 5 }, { shrink: 1 }];
  var RECUR = [
    { yesyes: 0.16 },
    { yesyes: 0.1, number: 0.1, frustrated: 0.16 },
    { yesyes: 0.08, number: 0.07, frustrated: 0.1, still: 0.09, survey: 0.07 },
    { yesyes: 0.07, number: 0.06, frustrated: 0.1, still: 0.07, survey: 0.06, shrink: 0.18 },
    { yesyes: 0.1, number: 0.08, frustrated: 0.12, still: 0.08, survey: 0.06, shrink: 0.14 }
  ];
  var TOTAL = L.STAGES.reduce(function (s, st) { return s + st.value; }, 0);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { t = clamp(t, 0, 1); return 1 - Math.pow(1 - t, 3); }
  function money(v) { return "£" + (Math.round(v * 100) / 100).toFixed(2); }
  function mmss(s) { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ":" + (s % 60 < 10 ? "0" : "") + (s % 60); }
  function pickFrom(r, list) { return list[Math.floor(r() * list.length) % list.length]; }
  function shuffled(r, list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var tmp = a[i]; a[i] = a[j]; a[j] = tmp; }
    return a;
  }
  function seedFrom(a, b) { return ((a | 0) ^ Math.imul((b + 1) | 0, 0x9e3779b1)) | 0; }

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  var shell = null, T = null, ctx = null;
  var W = 1, H = 1, DPR = 1;
  var Lay = {};
  var run = null;     // the round
  var sg = null;      // the order being argued about
  var ex = null;      // the message on screen and its replies
  var hudEls = null, hudWas = {};
  var clock = 0;      // animation time
  var prev = {};      // keys held last frame
  var inputMode = coarse ? "touch" : "mouse";
  var hover = -1;
  var focus = 0;
  var auto = null;
  var shake = 0;
  var floaters = [];
  var hudB = 64, hudCheck = 0;
  var restarting = false;
  var calm = false;
  var lastState = "";

  // ---------------------------------------------------------------------------
  // Planning the round: everything that should be the same for everyone in
  // today's run comes from shell.random's seed, each order from its own stream
  // ---------------------------------------------------------------------------
  function orderNumber(r) {
    var d = [1 + Math.floor(r() * 9)];
    while (d.length < 4) {
      var n = Math.floor(r() * 10);
      if (n !== d[d.length - 1]) d.push(n);
    }
    return d.join("");
  }
  var CONFUSE = { 0: "8", 1: "7", 2: "7", 3: "8", 4: "9", 5: "6", 6: "5", 7: "1", 8: "3", 9: "6" };
  function lookalikes(no, r) {
    var out = [], tries = 0;
    while (out.length < 3 && tries++ < 60) {
      var d = no.split(""), k = Math.floor(r() * 4);
      if (r() < 0.55 && k < 3) { var tmp = d[k]; d[k] = d[k + 1]; d[k + 1] = tmp; }
      else d[k] = CONFUSE[d[k]];
      var s = d.join("");
      if (s !== no && s[0] !== "0" && out.indexOf(s) < 0) out.push(s);
    }
    while (out.length < 3) out.push(String(1000 + Math.floor(r() * 9000)));
    return out;
  }

  function planDeck(si, dave, r) {
    var intro = dave ? {} : INTRO[si];
    var recur = dave ? RECUR[4] : RECUR[si];
    var deck = [], last = "open";
    for (var k = 0; k < 120; k++) {
      var kind = "std";
      if (k === 0) kind = "open";
      else if (intro) {
        for (var key in intro) if (intro[key] === k) kind = key;
      }
      var roll = r();
      var introNext = false;
      if (intro) for (var nk in intro) if (intro[nk] === k + 1) introNext = true;
      if (kind === "std" && last === "std" && k > 1 && !introNext) {
        var acc = 0;
        for (var rk in recur) {
          acc += recur[rk];
          if (roll < acc) { kind = rk; break; }
        }
      }
      deck.push({ kind: kind, seed: Math.floor(r() * 2147483647), alt: r() });
      last = kind;
    }
    return deck;
  }

  function planRun(seed) {
    var plan = [];
    for (var i = 0; i < 4; i++) {
      var r = N.seeded(seedFrom(seed, i));
      var p = {
        no: orderNumber(r),
        deck: planDeck(i, false, r),
        lines: shuffled(r, L.STAGES[i].lines.concat(L.STAGES[i].lines, L.GENERAL)),
        offers: null
      };
      if (i === 3) {
        p.daveDeck = planDeck(i, true, r);
        p.daveLines = shuffled(r, L.DAVE.concat(L.DAVE, L.STAGES[3].lines, L.GENERAL.slice(0, 8)));
      }
      plan.push(p);
    }
    var pr = N.seeded(seedFrom(seed, 77));
    for (var s = 1; s < 4; s++) plan[s].offers = shuffled(pr, L.PERKS).slice(0, 3);
    return plan;
  }

  // ---------------------------------------------------------------------------
  // The round
  // ---------------------------------------------------------------------------
  function reset(sh) {
    shell = sh;
    T = sh.tokens;
    A.init(T);
    calm = !!sh.reduceMotion;
    restarting = sh.state() !== "title";
    run = {
      plan: planRun(sh.seed),
      stage: FIRST,
      patience: PATIENCE,
      patienceMax: PATIENCE_MAX,
      refund: 0,
      score: 0,
      time: 0,
      results: [],
      perk: null,
      closedAt: null,
      daveBeaten: false,
      taught: {},
      clipSlips: {}
    };
    if (!hudEls) buildHud();
    floaters = [];
    auto = null;
    startStage(FIRST);
    if (START_DAVE) { sg.phase = "chat"; toDave(true); }
    paintHud();
    measureHud();
  }

  function startStage(i) {
    var p = run.plan[i];
    var st = L.STAGES[i];
    sg = {
      i: i, st: st, p: p,
      phase: restarting ? "chat" : "track",
      t: 0, trackT: 0, chatT: 0,
      boss: "bot", bossIn: 1, bossOut: 0,
      hp: START_HP, hpShown: START_HP, ghost: START_HP, ghostT: 0, pendingHeal: 0,
      deck: p.deck, deckAt: 0, lineAt: 0, inject: [],
      msgs: [], queue: [], scroll: 0,
      streak: 0, finReady: false,
      voucherDone: false, idleSaid: false,
      mood: { kind: "idle", until: 0 }, hurt: 0, glitch: 0,
      script: null, scriptT: 0, closing: 0,
      tache: 0, tacheOff: 0, briefed: false, cooldowns: {}
    };
    if (run.perk === "review") { sg.hp = sg.hpShown = sg.ghost = 75; sg.voucherDone = true; }
    ex = null;
    focus = 0;
    hover = -1;
    if (sg.phase === "chat") beginChat();
  }

  function beginChat() {
    sg.phase = "chat";
    post("sys", "Help: chat with Assistant");
    post("card", "Order " + sg.p.no, { lines: [sg.st.order, money(sg.st.value)] });
    nextExchange(0.5);
  }

  // ---------------------------------------------------------------------------
  // The chat log
  // ---------------------------------------------------------------------------
  function post(who, text, extra) {
    var m = { who: who, text: text, born: clock };
    if (extra) for (var k in extra) m[k] = extra[k];
    sg.msgs.push(m);
    if (sg.msgs.length > 40) sg.msgs.shift();
    var h = msgHeight(m);
    sg.scroll += h + gapY();
    if (who === "bot") botVoice(text);
    return m;
  }
  function later(at, fn) { sg.queue.push({ at: sg.t + at, fn: fn }); }

  // ---------------------------------------------------------------------------
  // Exchanges: the bot's message and the replies it offers
  // ---------------------------------------------------------------------------
  function isDave() { return sg.boss === "dave"; }
  function stageKey() { return isDave() ? 4 : sg.i; }

  function nextExchange(wait) {
    var kind, entry;
    if (sg.inject.length) {
      kind = sg.inject.shift();
      entry = { kind: kind, seed: Math.floor((sg.t * 7919 + sg.deckAt * 104729) % 2147483647) + sg.i, alt: 0.5 };
    } else {
      entry = sg.deck[sg.deckAt % sg.deck.length];
      sg.deckAt++;
      kind = entry.kind;
      // Type in capitals: it understands you twice as often
      if (kind === "std" && run.perk === "caps" && sg.i >= 1 && entry.alt < (RECUR[stageKey()].frustrated || 0)) kind = "frustrated";
    }
    ex = build(kind, entry);
    ex.state = "wait";
    ex.wait = wait == null ? 0.3 : wait;
  }

  function nextLine(r) {
    var list = isDave() ? sg.p.daveLines : sg.p.lines;
    var line = list[sg.lineAt % list.length];
    sg.lineAt++;
    return line;
  }

  function honestFor(r) {
    if (isDave()) return r() < 0.45 ? sg.st.complaint : pickFrom(r, L.DAVE_HONEST);
    return r() < 0.45 ? sg.st.complaint : pickFrom(r, L.HONEST);
  }

  function looksFor(honest) {
    return honest === sg.st.complaint ? sg.st.looks : (L.LOOKMAP[honest] || sg.st.looks);
  }

  // three replies that aren't true: from the stage on, some made to look true
  function decoys(r, honest, line, nLooks) {
    var out = [];
    var looks = shuffled(r, looksFor(honest));
    for (var i = 0; i < nLooks && i < looks.length; i++) out.push(looks[i]);
    if (line) [line[1], line[2]].forEach(function (d) { if (out.length < 3 && out.indexOf(d) < 0) out.push(d); });
    var polite = shuffled(r, L.POLITE);
    for (var j = 0; out.length < 3; j++) if (out.indexOf(polite[j]) < 0) out.push(polite[j]);
    return out.slice(0, 3);
  }

  function nLooks(r) {
    var k = stageKey();
    if (k === 0) return r() < 0.35 ? 1 : 0;
    if (k === 1) return 1;
    if (k === 2) return r() < 0.5 ? 1 : 2;
    return 2;
  }

  function chip(text, honest, kind, said) {
    return { text: text, honest: !!honest, kind: kind || (honest ? "honest" : "decoy"), said: said || text, slot: 0, from: -1, swap: 1, phase: 0 };
  }

  function build(kind, entry) {
    var r = N.seeded(entry.seed | 0);
    var k = stageKey();
    var dave = isDave();
    var e = { kind: kind, t: 0, chips: [], timer: null, shuffleAt: -1, shuffled: false, drift: DRIFT[k], shrink: 0, picked: false, bot: "", idle: 0 };
    var S = L.SPECIAL, h, line;
    var fuse = function (name) { return FUSE[name][k] * (run.perk === "notify" ? 1.5 : 1); };
    if (kind === "open") {
      e.bot = dave ? L.DAVE_OPEN : L.OPEN;
      h = sg.st.complaint;
      e.chips = [chip(h, true)].concat(decoys(r, h, null, k === 0 ? 0 : 1).map(function (d) { return chip(d); }));
    } else if (kind === "std" || kind === "shrink" || kind === "frustrated") {
      line = nextLine(r);
      h = honestFor(r);
      if (kind === "frustrated") {
        e.bot = dave ? S.frustrated.dave : S.frustrated.bot;
        var dd = decoys(r, h, null, 1);
        dd[1] = pickFrom(r, S.frustrated.decoys);
        e.chips = [chip(h, true)].concat(dd.map(function (d) { return chip(d); }));
        e.timer = { kind: "ring", dur: fuse("ring"), label: "Healing" };
      } else {
        e.bot = line[0];
        e.chips = [chip(h, true)].concat(decoys(r, h, line, nLooks(r)).map(function (d) { return chip(d); }));
        if (kind === "shrink") { e.shrink = fuse("shrink"); e.timer = { kind: "shrink", dur: e.shrink, label: "" }; }
      }
    } else if (kind === "yesyes") {
      e.bot = dave ? S.yesyes.dave : S.yesyes.bot;
      e.chips = [chip("Yes", false, "yes"), chip("Yes", false, "yes"), chip(S.yesyes.no, true, "no", S.yesyes.said)];
      e.timer = { kind: "no", dur: fuse("no"), label: "" };
    } else if (kind === "number") {
      e.bot = dave ? S.number.dave : S.number.bot;
      var looks = lookalikes(sg.p.no, r);
      e.chips = [chip(sg.p.no, true, "number")].concat(looks.map(function (n) { return chip(n, false, "number"); }));
    } else if (kind === "voucher") {
      e.bot = S.voucher.bot[clamp(sg.i - 1, 0, 2)];
      e.chips = [chip(S.voucher.refuse, true, "refuse", S.voucher.saidRefuse), chip(S.voucher.take, false, "take", S.voucher.saidTake)];
      e.timer = { kind: "voucher", dur: fuse("voucher"), label: "Offer ends" };
    } else if (kind === "still") {
      e.bot = dave ? S.still.dave : S.still.bot;
      var sd = shuffled(r, S.still.decoys);
      e.chips = [chip(S.still.honest, true, "still")].concat(sd.map(function (d) { return chip(d); }));
      e.timer = { kind: "still", dur: fuse("still"), label: "Still there?" };
    } else if (kind === "survey") {
      e.bot = "Before you go, a quick survey.";
      e.chips = [1, 2, 3, 4, 5].map(function (n) { return chip(n + (n === 1 ? " star" : " stars"), false, "star"); })
        .concat([chip(S.survey.close, true, "close")]);
      e.timer = { kind: "survey", dur: fuse("survey"), label: "" };
      e.corner = 0;
    }
    // where each reply sits
    var n = e.chips.length;
    if (kind === "yesyes" || kind === "survey") {
      e.chips.forEach(function (c, i) { c.slot = i; });
    } else {
      var order = shuffled(r, n === 2 ? [0, 1] : [0, 1, 2, 3]);
      e.chips.forEach(function (c, i) { c.slot = order[i]; });
    }
    e.chips.forEach(function (c, i) { c.phase = r() * 6.28; c.delay = i * 0.04; });
    var shuffleChance = run.perk === "notify" ? 1 : SHUFFLE[k];
    if (n === 4 && kind !== "number" && r() < shuffleChance) e.shuffleAt = 0.55 + r() * 0.4;
    if (kind === "number" && k >= 2 && r() < shuffleChance) e.shuffleAt = 0.7 + r() * 0.3;
    if (kind === "survey" || kind === "voucher") e.drift = 0;
    return e;
  }

  // the bot says its line and the replies come up
  function openExchange() {
    ex.state = "open";
    ex.t = 0;
    focus = 0;
    // Speak to a human: earned by true replies in a row, it takes a decoy's place
    if (sg.finReady && ["open", "std", "shrink", "frustrated", "still"].indexOf(ex.kind) >= 0) {
      for (var i = 0; i < ex.chips.length; i++) {
        if (!ex.chips[i].honest) {
          var slot = ex.chips[i].slot;
          var f = chip(isDave() ? L.SPECIAL.fin.dave : L.SPECIAL.fin.chip, true, "fin");
          f.slot = slot; f.phase = ex.chips[i].phase; f.delay = ex.chips[i].delay;
          ex.chips[i] = f;
          break;
        }
      }
    }
    if (ex.kind === "voucher") post("voucher", "50p", {});
    post("bot", ex.bot);
    sound("bot");
    var first = ex.kind === "std" || ex.kind === "open" ? null : ex.kind;
    if (ex.chips.some(function (c) { return c.kind === "fin"; })) first = first || "fin";
    if (first && L.FIRST[first] && !run.taught["brief-" + first]) {
      run.taught["brief-" + first] = true;
      shell.brief({ title: L.FIRST[first].title, text: L.FIRST[first].text, ms: 3800 });
    }
    if (ex.kind === "survey") sound("survey");
    if (ex.kind === "frustrated") {
      sg.pendingHeal = HEAL.frustrated;
      mood("tilt", ex.timer.dur);
    }
  }

  // ---------------------------------------------------------------------------
  // Picking a reply
  // ---------------------------------------------------------------------------
  function chipAt(slot) {
    if (!ex) return null;
    for (var i = 0; i < ex.chips.length; i++) if (ex.chips[i].slot === slot && !ex.chips[i].gone) return ex.chips[i];
    return null;
  }

  function pick(slot) {
    if (!ex || ex.state !== "open" || sg.phase !== "chat") return;
    var c = chipAt(slot);
    if (!c) return;
    if (ex.t < 0.08) return;   // still dealing
    var rt = ex.t;
    ex.state = "done";
    ex.wait = 0.5;
    ex.picked = c;
    c.pressed = clock;
    sg.pendingHeal = 0;
    auto = null;
    if (c.kind === "close") {   // the survey's No thanks: no bubble, it just goes
      callout("Survey: dismissed");
      damage(BASE * 0.6, rt, { noStreak: true });
      sound("hit");
      run.taught.survey = true;
      ex.wait = 0.35;
      return;
    }
    post("you", c.said);
    sound("send");
    if (c.kind === "take") { takeVoucher(); return; }
    if (c.honest) {
      run.taught.basic = true;
      if (c.kind === "fin") {
        run.taught.fin = true;
        sg.streak = 0;
        sg.finReady = false;
        // a human was requested: that's worth a patience back
        if (run.patience < run.patienceMax) { run.patience++; paintHud(); }
        damage(FIN, rt, { fin: true });
        if (isDave()) { sg.glitch = 0.32; later(0.32, function () { post("bot", L.SPECIAL.fin.daveReply); }); }
        else later(0.3, function () { post("bot", L.SPECIAL.fin.reply); });
        callout("Escalated");
        sound("fin");
        if (!calm) shake = 0.3;
        ex.wait = 0.8;
      } else {
        var mult = 1;
        if (ex.kind === "frustrated" && ex.t <= ex.timer.dur) { mult = 2; callout("Interrupted", { routine: "int", gap: 6 }); }
        if (ex.kind === "no") run.taught.no = true;
        if (c.kind === "no") { run.taught.no = true; callout("Not yes", { routine: "notyes", gap: 8 }); }
        if (c.kind === "number") callout("Order number: confirmed", { routine: "num", gap: 10 });
        if (c.kind === "still") { run.taught.still = true; }
        if (c.kind === "refuse") { callout("Voucher: declined"); }
        damage(BASE * mult, rt, {});
        sound("hit");
      }
    } else {
      wrong(c);
    }
  }

  function damage(base, rt, o) {
    var k = stageKey();
    var arm = isDave() ? DAVE_ARMOUR : ARMOUR[k];
    var quick = clamp(1 - (rt - 0.3) / 1.2, 0, 1) * QUICK;
    var streakMult = 1 + STREAK * Math.min(sg.streak, STREAK_MAX);
    var caps = run.perk === "caps" ? 1.33 : 1;
    var d = base * arm * (1 + quick) * (o.fin ? 1 : streakMult) * caps;
    if (!o.noStreak && !o.fin) {
      sg.streak++;
      var need = run.perk === "agent" ? 2 : 3;
      if (sg.streak >= need) sg.finReady = true;
    }
    sg.hp = Math.max(0, sg.hp - d);
    sg.ghostT = 0.45;
    sg.hurt = 1;
    mood("hit", 0.35);
    floater("-" + Math.max(1, Math.round(d)) + "%", "bar");
    if (quick > QUICK * 0.55 && !o.fin) floater("Quick", "you");
    if (sg.hp <= 0) { win(); return; }
    // losing: the voucher, once an order, from the second
    var vAt = isDave() ? 60 : 55;
    if (!sg.voucherDone && sg.i >= 1 && sg.hp <= vAt && (sg.i < 3 || isDave())) {
      sg.voucherDone = true;
      sg.inject.unshift("voucher");
    }
  }

  function heal(n, why) {
    sg.hp = Math.min(100, sg.hp + n);
    sg.hpShown = Math.min(sg.hpShown, sg.hp);
    sg.ghost = Math.max(sg.ghost, sg.hp);
    floater("+" + Math.round(n) + "%", "heal");
    mood("heal", 0.9);
    sound("heal");
  }

  function losePatience(n) {
    run.patience = Math.max(0, run.patience - n);
    paintHud();
    sound("wrong");
    if (run.patience <= 0) { closeApp(); return true; }
    if (run.patience === 1) callout("Patience: low", { routine: "low", gap: 30 });
    return false;
  }

  function wrong(c) {
    sg.streak = 0;
    sg.finReady = false;
    var cost = run.perk === "agent" ? 2 : 1;
    var heals = c.kind === "yes" ? HEAL.yes : c.kind === "star" ? HEAL.star : c.kind === "number" ? HEAL.number : HEAL.decoy;
    mood("smug", 0.8);
    if (losePatience(cost)) return;
    heal(heals);
    var lines = isDave() ? L.DAVE_HEAL : L.HEAL;
    if (c.kind === "number") later(0.28, function () { post("bot", "That order went to a hedge. Let's start there."); });
    else if (c.kind === "star") later(0.28, function () { post("bot", "Thank you. That really helps me."); });
    else later(0.28, function () { post("bot", lines[Math.floor(Math.random() * lines.length)]); });
    if (c.kind === "yes") callout("Ticket: closed", { routine: "closed", gap: 6 });
    else if (c.kind === "star") callout("Rated. Why", { routine: "rated", gap: 6 });
    else if (c.kind === "number") callout("Wrong order", { routine: "wrongno", gap: 6 });
    else callout("Loop detected", { routine: "loop", gap: 5 });
    ex.wait = 0.75;
  }

  // a timer ran out
  function expire() {
    var k = ex.kind;
    ex.state = "done";
    ex.wait = 0.55;
    sg.pendingHeal = 0;
    auto = null;
    if (k === "frustrated") {
      heal(HEAL.frustrated);
      post("bot", L.SPECIAL.frustrated.after);
      sg.streak = 0;
      sg.finReady = false;
      // the replies are still there: carry on with them, without the ring
      ex.state = "open";
      ex.timer = null;
      ex.kind = "std";
      return;
    }
    if (k === "yesyes") {
      heal(HEAL.yesyes);
      post("bot", "I'll take that as a yes.");
      callout("Ticket: closed", { routine: "closed", gap: 6 });
      sg.streak = 0; sg.finReady = false;
    } else if (k === "still") {
      loop();
      return;
    } else if (k === "survey") {
      heal(HEAL.survey);
      post("bot", "No answer is five stars. Thank you.");
      callout("Rated. Why", { routine: "rated", gap: 6 });
    } else if (k === "voucher") {
      post("you", L.SPECIAL.voucher.saidRefuse);
      post("bot", "No problem. The offer has been noted.");
      callout("Voucher: declined");
    } else if (k === "shrink") {
      heal(HEAL.shrink);
      post("bot", "Glad that's sorted.");
      callout("Ticket: closed", { routine: "closed", gap: 6 });
      sg.streak = 0; sg.finReady = false;
    }
  }

  // Are you still there, missed: the chat starts again from hello
  function loop() {
    sg.hp = Math.min(100, sg.hp + HEAL.still);
    sg.ghost = Math.max(sg.ghost, sg.hp);
    sg.streak = 0;
    sg.finReady = false;
    sg.msgs = [];
    sg.scroll = 0;
    callout("Loop detected");
    sound("loop");
    mood("smug", 1);
    post("sys", "Chat restarted");
    post("card", "Order " + sg.p.no, { lines: [sg.st.order, money(sg.st.value)] });
    sg.inject.unshift("open");
    ex.state = "done";
    ex.wait = 0.7;
  }

  // ---------------------------------------------------------------------------
  // How an order ends
  // ---------------------------------------------------------------------------
  function win() {
    ex.state = "over";
    if (sg.i === 3 && !isDave()) { toDave(false); return; }
    sg.phase = "won";
    var dave = isDave();
    if (dave) {
      run.daveBeaten = true;
      callout("Moustache: detached");
      script([
        [0.2, function () { sound("fall"); }],
        [1.0, function () { post("bot", "Fine. Refund approved."); }],
        [1.9, function () { sg.glitch = 0.5; post("bot", "Thanks for chatting with Dave."); }],
        [2.6, function () { post("sys", "Dave left the chat"); }],
        [3.2, function () { endStage("full"); }]
      ]);
    } else {
      script([
        [0.5, function () { post("sys", "A human joined the chat"); sound("join"); mood("bye", 3); }],
        [1.2, function () { post("sys", "Refund approved: " + money(sg.st.value)); callout("Refund: pending review"); }],
        [1.9, function () { post("sys", "A human left the chat"); }],
        [2.2, function () { endStage("full"); }]
      ]);
    }
  }

  function toDave(now) {
    sg.phase = "trans";
    var steps = [
      [0.3, function () { post("sys", "Transferring you to a human"); mood("bye", 2); sound("join"); }],
      [1.1, function () { sg.bossOut = 0.0001; }],
      [1.7, function () {
        sg.boss = "dave"; sg.bossOut = 0; sg.bossIn = 0.0001;
        sg.hp = sg.hpShown = sg.ghost = now ? START_HP : 100;
        sg.streak = 0; sg.finReady = false; sg.voucherDone = run.perk === "review";
        sg.deck = sg.p.daveDeck; sg.deckAt = 0; sg.lineAt = 0;
        post("sys", "Dave joined the chat");
        callout("A human. Allegedly");
      }],
      [2.4, function () {
        sg.phase = "chat";
        if (!run.taught["brief-dave"]) {
          run.taught["brief-dave"] = true;
          shell.brief({ title: L.FIRST.dave.title, text: L.FIRST.dave.text, ms: 3800 });
        }
        sg.inject = [];
        nextExchange(0.2);
      }]
    ];
    if (now) steps = [[0, steps[2][1]], [0.1, steps[3][1]]];
    script(steps);
  }

  function takeVoucher() {
    sg.phase = "won";
    ex.state = "over";
    callout("Voucher: accepted. Sadly");
    sound("coin");
    script([
      [0.4, function () { post("bot", "Lovely. Your 50p is on its way."); mood("smug", 2); }],
      [1.2, function () { post("sys", "Chat ended"); }],
      [1.8, function () { endStage("voucher"); }]
    ]);
  }

  function closeApp() {
    sg.phase = "closed";
    if (ex) ex.state = "over";
    run.closedAt = sg.i;
    callout("App: closed");
    sound("close");
    sg.closing = 0.0001;
    script([[1.3, function () { endRound(); }]]);
  }

  function script(list) {
    sg.script = list.slice();
    sg.scriptT = 0;
  }

  function endStage(outcome) {
    var st = sg.st;
    var refund = outcome === "full" ? st.value : 0.5;
    var bonus = 0;
    if (outcome === "full" && run.perk !== "charge") {
      bonus = Math.round(TIME_BONUS * clamp((2 * PAR[sg.i] - sg.chatT) / PAR[sg.i], 0, 1));
    }
    run.results.push({ outcome: outcome, refund: refund, time: sg.chatT, bonus: bonus });
    if (DEBUG) console.log("stage " + (sg.i + 1) + ": " + outcome + " in " + sg.chatT.toFixed(1) + "s, bonus " + bonus + ", patience " + run.patience);
    run.refund += refund;
    run.score += Math.round(refund * 100) + bonus;
    paintHud();
    if (sg.i >= 3) { endRound(); return; }
    var i = sg.i;
    var good = outcome === "full";
    var stamp = good ? (sg.chatT <= PAR[i] * 1.3 ? "Approved" : "Pending review") : "Not approved";
    var stats = [
      { label: "Refund", value: good ? money(refund) : "50p" },
      { label: "Time", value: mmss(sg.chatT) },
      { label: "Patience", value: String(run.patience) }
    ];
    if (bonus) stats.push({ label: "Quick", value: "+" + bonus });
    var heading = good ? cap(st.short) + ": refunded." : cap(st.short) + ": 50p.";
    var offers = run.plan[i + 1].offers;
    shell.interlude({
      stamp: stamp,
      tilt: good ? -4 : 5,
      heading: heading,
      line: (good ? L.AFTER.full : L.AFTER.voucher)[i],
      stats: stats,
      ask: "Before the next order, pick one.",
      choices: offers.map(function (o) { return { label: o.label, detail: o.detail }; }),
      delay: 900
    }).then(function (n) {
      var perk = offers[n] ? offers[n].key : null;
      run.perk = perk;
      run.patience = Math.min(run.patienceMax, run.patience + 1);
      if (perk === "screenshot") run.patience = Math.max(1, run.patience - 1);
      if (perk === "charge") run.patience = Math.min(PATIENCE_MAX + 2, run.patience + 2);
      run.stage = i + 1;
      restarting = false;
      startStage(i + 1);
      paintHud();
      measureHud();
      shell.next();
    });
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function endRound() {
    var fulls = run.results.filter(function (r) { return r.outcome === "full"; }).length;
    var place, line;
    if (run.closedAt != null) {
      place = run.closedAt <= 1 ? 4 : 3;
      line = place === 4 ? L.RESULTS[4][run.refund > 0 ? 1 : 0] : L.RESULTS[3][1];
    } else if (fulls === 4 && run.score >= APPROVED) {
      place = 1; line = L.RESULTS[1][run.daveBeaten ? 1 : 0];
    } else if (fulls >= 2) {
      place = 2; line = L.RESULTS[2][fulls === 4 ? 1 : 0];
    } else {
      place = 3; line = L.RESULTS[3][0];
    }
    if (DEBUG) console.log("round: place " + place + ", score " + run.score + ", refund " + money(run.refund) + ", time " + mmss(run.time) + (run.closedAt != null ? ", closed at " + (run.closedAt + 1) : ""));
    var rec = shell.record(run.score);
    var stats = [
      { label: "Refunded", value: money(run.refund) + " of " + money(TOTAL) },
      { label: "Time", value: mmss(run.time) },
      { label: "Score", value: run.score.toLocaleString("en-GB") },
      { label: rec.isNew ? (shell.daily ? "New best today" : "New best") : (shell.daily ? "Best today" : "Best"),
        value: (rec.best || 0).toLocaleString("en-GB"), highlight: rec.isNew }
    ];
    if (place === 1 || place === 2) stats.splice(2, 0, { label: "Dave", value: run.daveBeaten ? "Unmasked" : "Not reached" });
    if (shell.daily) stats.unshift({ label: "Run", value: shell.today });
    var heading = run.closedAt != null ? "You closed the app." : "Refunded " + money(run.refund) + " of " + money(TOTAL) + ".";
    var share = run.closedAt != null
      ? "closed the app on " + L.STAGES[run.closedAt].short + ", " + money(run.refund) + " refunded"
      : money(run.refund) + " of " + money(TOTAL) + " refunded in " + mmss(run.time) + (run.daveBeaten ? ", Dave unmasked" : "");
    shell.finish({ place: place, total: 4, heading: heading, line: line, stats: stats, share: share, delay: 1100 });
  }

  // ---------------------------------------------------------------------------
  // Every frame
  // ---------------------------------------------------------------------------
  function update(dt, input) {
    if (!sg || shell.state() !== "playing") { readKeys(input, true); return; }
    sg.t += dt;
    readKeys(input, false);
    if (AUTO) autopilot();

    // the scripted bits: an order ending, Dave arriving, closing the app
    if (sg.script) {
      sg.scriptT += dt;
      while (sg.script && sg.script.length && sg.script[0][0] <= sg.scriptT) {
        var step = sg.script.shift();
        if (!sg.script.length) sg.script = null;
        step[1]();
      }
    }
    for (var q = 0; q < sg.queue.length; q++) {
      if (sg.queue[q].at <= sg.t) { var item = sg.queue.splice(q, 1)[0]; q--; item.fn(); }
    }
    if (sg.bossOut > 0) sg.bossOut = Math.min(1, sg.bossOut + dt / 0.5);
    if (sg.bossIn > 0 && sg.bossIn < 1) sg.bossIn = Math.min(1, sg.bossIn + dt / 0.5);
    if (sg.closing > 0) sg.closing = Math.min(1, sg.closing + dt / 0.9);
    if (sg.glitch > 0) sg.glitch -= dt;

    if (sg.phase === "track") {
      sg.trackT += dt;
      if (sg.trackT >= TRACK_LEN) beginChat();
      return;
    }
    if (sg.phase === "chat" || sg.phase === "trans") sg.chatT += dt;
    if (sg.phase === "chat" || sg.phase === "trans") run.time += dt;
    // the bar catches up
    if (sg.ghostT > 0) sg.ghostT -= dt;
    else sg.ghost = Math.max(sg.hp, sg.ghost - dt * 60);
    sg.hpShown += (sg.hp - sg.hpShown) * Math.min(1, dt * 14);
    if (sg.boss === "dave") sg.tache = clamp((60 - sg.hp) / 60, 0, 1);
    if (sg.phase === "won" && isDave()) sg.tacheOff = Math.min(1, sg.tacheOff + dt / 0.9);

    if (sg.phase !== "chat" || !ex) return;
    if (ex.state === "wait") {
      ex.wait -= dt;
      if (ex.wait <= 0) {
        ex.state = "typing";
        var tl = isDave() ? DAVE_TYPING : TYPING[sg.i];
        ex.type = tl + Math.min(0.25, ex.bot.length * 0.006);
      }
    } else if (ex.state === "typing") {
      ex.type -= dt;
      if (ex.type <= 0) openExchange();
    } else if (ex.state === "open") {
      ex.t += dt;
      if (ex.timer && ex.t >= ex.timer.dur) {
        if (ex.timer.kind === "no" || ex.timer.kind === "shrink") {
          var hc = ex.chips.filter(function (c) { return c.honest; })[0];
          if (hc) hc.gone = true;
        }
        expire();
      }
      // replies swap places, with a wobble first so it's fair
      if (ex.shuffleAt > 0 && !ex.shuffled && ex.t >= ex.shuffleAt + 0.22) {
        ex.shuffled = true;
        var slots = ex.chips.map(function (c) { return c.slot; });
        var rot = slots.slice(1).concat(slots[0]);
        if (ex.chips.length === 4 && ex.t % 1 < 0.5) rot = [slots[3], slots[2], slots[1], slots[0]];
        ex.chips.forEach(function (c, i) { c.from = c.slot; c.slot = rot[i]; c.swap = 0; });
        sound("shuffle");
      }
      ex.chips.forEach(function (c) { if (c.swap < 1) c.swap = Math.min(1, c.swap + dt / 0.2); });
      if (ex.kind === "survey" && !calm) ex.corner = Math.floor(ex.t / 0.9) % 3;
      // nobody's said anything for a while
      if (ex.kind === "std" || ex.kind === "open") {
        ex.idle += dt;
        if (ex.idle > IDLE) {
          if (stageKey() >= 2) { sg.inject.unshift("still"); ex.state = "done"; ex.wait = 0.1; }
          else if (!sg.idleSaid) { sg.idleSaid = true; post("bot", "Take your time. I'm not going anywhere."); ex.idle = -100; }
        }
      }
    } else if (ex.state === "done") {
      ex.wait -= dt;
      if (ex.wait <= 0 && sg.phase === "chat") nextExchange(0);
    }
  }

  // Keys: 1 to 6 pick a reply; arrows move the highlight; Enter or Space presses it
  function readKeys(input, idle) {
    var names = ["c1", "c2", "c3", "c4", "c5", "c6", "close", "left", "right", "up", "down", "action"];
    var edge = {};
    names.forEach(function (k) { edge[k] = input[k] && !prev[k]; prev[k] = input[k]; });
    if (idle || !sg) return;
    var any = names.some(function (k) { return edge[k]; });
    if (!any) return;
    if (input.mode === "keys" || input.mode === "pad") inputMode = input.mode === "pad" ? "pad" : "keys";
    if (sg.phase === "track") { if (sg.trackT > 0.4) beginChat(); return; }
    if (!ex || ex.state !== "open") return;
    var count = ex.kind === "survey" ? 6 : ex.kind === "voucher" ? 2 : ex.kind === "yesyes" ? 3 : 4;
    for (var i = 1; i <= 6; i++) if (edge["c" + i] && i <= count) { focus = i - 1; pick(i - 1); return; }
    if (edge.close && ex.kind === "survey") { pick(5); return; }
    if (edge.left) focus = (focus + count - 1) % count;
    if (edge.right) focus = (focus + 1) % count;
    if (edge.up) focus = ex.kind === "survey" ? (focus === 5 ? 0 : 5) : (focus + count - 2 + count) % count;
    if (edge.down) focus = ex.kind === "survey" ? (focus === 5 ? 0 : 5) : (focus + 2) % count;
    if (edge.action) pick(focus);
  }

  // A tap or a click
  function onPointer(e) {
    if (!shell || shell.state() !== "playing" || !sg) return;
    var t = e.target;
    if (t && t.closest && t.closest(".kit-panel, .kit-bar, button, a")) return;
    var box = root.getBoundingClientRect();
    var x = e.clientX - box.left, y = e.clientY - box.top;
    inputMode = e.pointerType === "mouse" ? "mouse" : "touch";
    if (sg.phase === "track") { if (sg.trackT > 0.4) beginChat(); return; }
    var s = slotAt(x, y);
    if (s >= 0) { focus = s; pick(s); }
  }
  root.addEventListener("pointerdown", onPointer);
  root.addEventListener("pointermove", function (e) {
    if (e.pointerType !== "mouse" || !sg) { hover = -1; return; }
    var box = root.getBoundingClientRect();
    hover = slotAt(e.clientX - box.left, e.clientY - box.top);
    root.style.cursor = hover >= 0 && shell && shell.state() === "playing" ? "pointer" : "";
  });

  // ---------------------------------------------------------------------------
  // The autopilot (?autopilot and ?clip): reads, reacts in a human time,
  // gets it wrong now and then. While filming a clip it falls for Yes or yes
  // once, because that's the bit people share.
  // ---------------------------------------------------------------------------
  function autopilot() {
    if (sg.phase === "track") { if (!CLIP && sg.trackT > 1.0) beginChat(); return; }
    if (sg.phase !== "chat" || !ex || ex.state !== "open") return;
    if (!auto || auto.ex !== ex) {
      var slip = Math.random() < 0.03 + (1 - SKILL) * 0.2;
      var react = 0.3 + (1 - SKILL) * 0.7 + Math.random() * 0.3;
      var target = null;
      var honest = ex.chips.filter(function (c) { return c.honest; });
      var fin = ex.chips.filter(function (c) { return c.kind === "fin"; })[0];
      var bad = ex.chips.filter(function (c) { return !c.honest; });
      if (CLIP && ex.kind === "yesyes" && !run.clipSlips.yes) { run.clipSlips.yes = true; slip = true; react = 0.6; }
      if (ex.kind === "voucher") {
        target = run.patience <= 1 && !CLIP ? bad[0] : honest[0];
        react += 0.5;
      } else if (ex.kind === "survey") {
        target = slip ? bad[Math.floor(Math.random() * bad.length)] : honest[0];
        react += 0.35;
      } else {
        target = slip ? bad[Math.floor(Math.random() * bad.length)] : (fin || honest[0]);
        if (ex.kind === "yesyes") react += 0.15;
        if (ex.kind === "number") react += 0.25;
        if (ex.shuffleAt > 0 && react > ex.shuffleAt - 0.1) react = Math.max(react, ex.shuffleAt + 0.5);
      }
      auto = { ex: ex, at: react, target: target };
    }
    if (ex.t >= auto.at && auto.target && !auto.target.gone) {
      inputMode = coarse ? "touch" : "mouse";
      pick(auto.target.slot);
    }
  }

  // ---------------------------------------------------------------------------
  // Layout: a phone held upright (and the clip frame) stacks the chat's
  // header (the bot and its bar) over the chat and the replies; a wide screen
  // puts the bot big on the left and the chat on the right.
  // ---------------------------------------------------------------------------
  function measureHud() {
    window.requestAnimationFrame(function () {
      var box = root.getBoundingClientRect();
      var b = 0;
      Array.prototype.forEach.call(root.querySelectorAll(".kit-hud-tl, .kit-hud-tr, .kit-bar"), function (el) {
        var r = el.getBoundingClientRect();
        if (r.height) b = Math.max(b, r.bottom - box.top);
      });
      if (b) { hudB = Math.round(b + 6); layout(); }
    });
  }

  function layout() {
    var touch = coarse;
    var wide = W >= H * 1.15 && W >= 560;
    var pad = W < 420 ? 8 : 12;
    var chipH = touch ? 56 : clamp(Math.round(H * 0.075), 42, 56);
    if (!touch && H < 420) chipH = 40;
    var gap = W < 420 ? 6 : 8;
    var trayH = chipH * 2 + gap + 18;
    Lay.wide = wide;
    Lay.pad = pad;
    if (wide) {
      var bw = Math.round(W * 0.36);
      Lay.boss = { x: 0, y: hudB, w: bw, h: H - hudB };
      Lay.col = { x: bw + pad, y: hudB, w: W - bw - pad * 2, h: H - hudB - pad };
      var ms = Math.min(bw * 0.7, (H - hudB) * 0.44);
      Lay.mascot = { x: bw / 2, y: hudB + (H - hudB) * 0.05 + ms * 0.52, s: ms };
      Lay.name = { x: bw / 2, y: Lay.mascot.y + ms * 0.62 + 18, align: "center" };
      Lay.bar = { x: Math.round(bw * 0.12), y: Lay.name.y + 40, w: Math.round(bw * 0.76), h: 16 };
      Lay.head = null;
    } else {
      var headH = clamp(Math.round(H * 0.15), H < 480 ? 66 : 84, 124);
      Lay.head = { x: 0, y: hudB, w: W, h: headH };
      var hs = headH - 8;
      Lay.mascot = { x: pad + hs * 0.5, y: hudB + headH * 0.5 + 2, s: hs };
      var bx = pad + hs + 10;
      Lay.name = { x: bx, y: hudB + headH * 0.3 + 4, align: "left" };
      Lay.bar = { x: bx, y: hudB + headH * 0.62, w: W - bx - pad, h: clamp(Math.round(headH * 0.14), 12, 18) };
      Lay.col = { x: pad, y: hudB + headH, w: W - pad * 2, h: H - hudB - headH - pad };
      Lay.boss = null;
    }
    Lay.tray = { x: Lay.col.x, y: H - pad - trayH, w: Lay.col.w, h: trayH, chipH: chipH, gap: gap };
    Lay.chat = { x: Lay.col.x, y: Lay.col.y + 4, w: Lay.col.w, h: Lay.tray.y - Lay.col.y - 8 };
    Lay.fs = clamp(Math.round(Lay.chat.w * 0.042), 14, 19);
    Lay.chipFs = clamp(Math.round(Lay.tray.w * 0.038), 14, 18);
    placeKitBits();
  }

  // The notice goes over the top of the chat (old news), never over the
  // replies; callouts land on the bot (its header on a phone)
  function placeKitBits() {
    var brief = root.querySelector(".kit-brief");
    if (brief && Lay.chat) {
      // clear of the countdown's stamps (7% or 3.2rem down, kit.css), over the chat's old news
      var rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      var font = clamp(window.innerWidth * 0.03 + 1.1 * rem, 2 * rem, 3.6 * rem);
      var countBottom = Math.max(H * 0.07, 3.2 * rem) + font * 1.75;
      brief.style.top = Math.round(Math.max(Lay.chat.y + 6, Math.min(countBottom, H * 0.4))) + "px";
      brief.style.bottom = "auto";
      brief.style.left = Math.round(Lay.chat.x + Lay.chat.w / 2) + "px";
      brief.style.width = "min(25rem, " + Math.round(Lay.chat.w - 12) + "px)";
    }
    if (Lay.wide) shell.placeCallouts({ top: Math.round(Lay.bar.y + Lay.bar.h + 26), left: 0, right: W - Lay.boss.w });
    else shell.placeCallouts({ top: Math.round(Lay.head.y + 2), left: 0, right: 0 });
  }

  // where each reply is drawn, this frame (also what a tap hits)
  function slotXY(s) {
    var tr = Lay.tray, cw = (tr.w - tr.gap) / 2;
    var col = s % 2, row = Math.floor(s / 2);
    var y = tr.y + 12 + row * (tr.chipH + tr.gap);
    if (ex && ex.kind === "voucher") y = tr.y + 12 + (tr.chipH + tr.gap) / 2;
    return { x: tr.x + col * (cw + tr.gap), y: y, w: cw, h: tr.chipH };
  }

  function chipRect(c) {
    var tr = Lay.tray;
    var r = slotXY(c.slot);
    if (c.from >= 0 && c.swap < 1) {
      var f = slotXY(c.from), k = calm ? (c.swap < 0.5 ? 0 : 1) : ease(c.swap);
      r.x = lerp(f.x, r.x, k);
      r.y = lerp(f.y, r.y, k);
    }
    if (ex.drift && !calm) {
      // drifting, but never out of the tray
      // narrower, and wandering inside its own place, so replies never overlap
      var room = r.w * ex.drift * 2;
      r.w -= room;
      r.x += room / 2 + Math.sin(ex.t * 1.8 + c.phase) * room / 2;
    }
    if (ex.shuffleAt > 0 && !ex.shuffled && ex.t > ex.shuffleAt && !calm) r.x += Math.sin(ex.t * 60 + c.phase) * 3;
    var share = ex.timer ? clamp(ex.t / ex.timer.dur, 0, 1) : 0;
    if (c.kind === "no") {
      var minW = coarse ? 64 : 52;
      var w0 = Math.max(minW, r.w * 0.6);
      r.w = Math.max(minW * 0.8, w0 * (1 - 0.55 * share));
      var lane = tr.w - r.w;
      r.x = tr.x + (calm ? lane / 2 : lane * (0.5 + 0.5 * Math.sin(ex.t * 2.3 + 0.6)));
    }
    if (ex.shrink && c.honest && c.kind !== "fin") {
      var nw = r.w * (1 - 0.72 * share);
      r.x += (r.w - nw) / 2;
      r.w = nw;
    }
    if (ex.kind === "survey") return surveyRect(c);
    var d = ease((ex.t - (c.delay || 0)) / 0.16);
    r.y += (1 - d) * 18;
    r.alpha = calm ? 1 : d;
    return r;
  }

  function surveyBox() {
    var tr = Lay.tray;
    var top = Math.max(Lay.chat.y + 10, tr.y - 92);
    return { x: tr.x, y: top, w: tr.w, h: tr.y + tr.h - top };
  }
  function surveyRect(c) {
    var b = surveyBox();
    if (c.kind === "close") {
      var fs = 13;
      var w = coarse ? 104 : 96, h = coarse ? 56 : 40;
      var spots = [[b.x + b.w - w - 4, b.y + 4], [b.x + 4, b.y + b.h - h - 4], [b.x + b.w - w - 4, b.y + b.h - h - 4]];
      var at = spots[calm ? 2 : (ex.corner || 0)];
      return { x: at[0], y: at[1], w: w, h: h, fs: fs, alpha: 1 };
    }
    var n = c.slot;
    var size = Math.min((b.w - 24) / 5 - 6, 62, b.h * 0.42);
    if (coarse) size = Math.max(size, Math.min(56, (b.w - 24) / 5 - 4));
    var total = size * 5 + 6 * 4;
    var x = b.x + (b.w - total) / 2 + n * (size + 6);
    return { x: x, y: b.y + b.h * 0.52 - size / 2, w: size, h: size, alpha: 1 };
  }

  function slotAt(x, y) {
    if (!ex || ex.state !== "open" || !Lay.tray) return -1;
    var best = -1;
    ex.chips.forEach(function (c) {
      if (c.gone) return;
      var r = chipRect(c);
      var padY = coarse ? Math.max(0, (56 - r.h) / 2) : 0;
      if (x >= r.x - 3 && x <= r.x + r.w + 3 && y >= r.y - 3 - padY && y <= r.y + r.h + 3 + padY) best = c.slot;
    });
    return best;
  }

  // ---------------------------------------------------------------------------
  // Drawing
  // ---------------------------------------------------------------------------
  function gapY() { return Math.round((Lay.fs || 15) * 0.55); }
  var wrapCache = {};
  function wrap(text, maxW, px) {
    var key = px + "|" + Math.round(maxW) + "|" + text;
    if (wrapCache[key]) return wrapCache[key];
    ctx.font = A.font(px);
    var words = String(text).toUpperCase().split(" "), lines = [], cur = "";
    words.forEach(function (w) {
      var test = cur ? cur + " " + w : w;
      if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; }
      else cur = test;
    });
    if (cur) lines.push(cur);
    var width = 0;
    lines.forEach(function (l) { width = Math.max(width, ctx.measureText(l).width); });
    var out = { lines: lines, w: width };
    wrapCache[key] = out;
    return out;
  }

  function msgHeight(m) {
    if (!Lay.chat || !ctx) return 30;
    var fs = Lay.fs, lh = Math.round(fs * 1.12);
    if (m.who === "sys") return Math.round(Math.max(12, fs * 0.8) * 1.4);
    if (m.who === "card") return Math.round(fs * 1.25 + 2 * Math.max(13, fs * 0.82) * 1.3 + 22);
    if (m.who === "voucher") return Math.round(fs * 2.6);
    var wr = wrap(m.text, Lay.chat.w * 0.74 - 24, fs);
    return wr.lines.length * lh + 18;
  }

  function bubble(x, y, w, h, fill, tailRight) {
    var r = Math.min(14, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arc(x + w - r, y + r, r, -Math.PI / 2, 0);
    if (tailRight) {
      ctx.lineTo(x + w, y + h - 4);
      ctx.lineTo(x + w + 7, y + h + 2);
      ctx.lineTo(x + w - 10, y + h);
    } else {
      ctx.lineTo(x + w, y + h - r);
      ctx.arc(x + w - r, y + h - r, r, 0, Math.PI / 2);
    }
    if (!tailRight) {
      ctx.lineTo(x + 10, y + h);
      ctx.lineTo(x - 7, y + h + 2);
      ctx.lineTo(x, y + h - 4);
    } else {
      ctx.lineTo(x + r, y + h);
      ctx.arc(x + r, y + h - r, r, Math.PI / 2, Math.PI);
    }
    ctx.lineTo(x, y + r);
    ctx.arc(x + r, y + r, r, Math.PI, Math.PI * 1.5);
    ctx.closePath();
    A.ink(ctx, fill, 2.5);
  }

  function drawChat() {
    var c = Lay.chat, fs = Lay.fs, lh = Math.round(fs * 1.12);
    ctx.save();
    ctx.beginPath();
    ctx.rect(c.x - 10, c.y, c.w + 20, c.h);
    ctx.clip();
    var y = c.y + c.h - 6 + sg.scroll;
    // the bot typing
    if (sg.phase === "chat" && ex && ex.state === "typing") {
      var tw = fs * 3.4, th = fs * 1.6;
      y -= th;
      bubble(c.x + 8, y, tw, th, T.paper, false);
      for (var d = 0; d < 3; d++) {
        var bob = calm ? 0 : Math.max(0, Math.sin(clock * 9 - d * 0.7)) * fs * 0.22;
        ctx.beginPath();
        ctx.arc(c.x + 8 + tw * (0.28 + d * 0.22), y + th / 2 - bob, fs * 0.16, 0, Math.PI * 2);
        ctx.fillStyle = T.ink;
        ctx.fill();
      }
      y -= gapY();
    }
    for (var i = sg.msgs.length - 1; i >= 0 && y > c.y - 10; i--) {
      var m = sg.msgs[i];
      var h = msgHeight(m);
      y -= h;
      if (y + h < c.y) { y -= gapY(); continue; }
      drawMsg(m, c, y, h, fs, lh);
      y -= gapY();
    }
    // Screenshot your order: the number, pinned
    if (run.perk === "screenshot") {
      var px = Math.max(12, fs * 0.78);
      ctx.font = A.font(px);
      var label = "Order " + sg.p.no;
      var lw = ctx.measureText(label.toUpperCase()).width + 16;
      A.rr(ctx, c.x + c.w - lw - 4, c.y + 4, lw, px * 1.7, 3);
      A.ink(ctx, T.accent, 2.5);
      A.text(ctx, label, c.x + c.w - lw / 2 - 4, c.y + 4 + px * 1.18, px, T.ink, "center");
    }
    ctx.restore();
  }

  function drawMsg(m, c, y, h, fs, lh) {
    var age = clock - m.born;
    var pop = calm ? 1 : ease(age / 0.16);
    ctx.save();
    if (m.who === "sys") {
      var sp = Math.max(12, fs * 0.8);
      A.text(ctx, m.text, c.x + c.w / 2, y + h * 0.7, sp, T.smoke, "center");
      ctx.restore();
      return;
    }
    if (m.who === "card") {
      var cw = Math.min(c.w * 0.74, 300), sx = c.x + 8;
      ctx.globalAlpha = pop;
      A.rr(ctx, sx, y, cw, h - 4, 6);
      A.ink(ctx, T.paper, 2.5);
      ctx.fillStyle = T.accent;
      ctx.fillRect(sx + 1.5, y + 1.5, cw - 3, 6);
      var small = Math.max(13, fs * 0.82);
      A.text(ctx, m.text, sx + 12, y + 10 + fs * 1.05, fs * 1.15, T.ink, "left");
      A.text(ctx, m.lines[0], sx + 12, y + 14 + fs * 1.25 + small * 1.1, small, T.ink, "left");
      A.text(ctx, m.lines[1], sx + 12, y + 14 + fs * 1.25 + small * 2.4, small, T.ink, "left");
      ctx.restore();
      return;
    }
    if (m.who === "voucher") {
      var vw = Math.min(c.w * 0.5, 190), vx = c.x + 8, vh = h - 6;
      ctx.globalAlpha = pop;
      ctx.setLineDash([5, 4]);
      A.rr(ctx, vx, y, vw, vh, 4);
      A.ink(ctx, T.paper, 2.5);
      ctx.setLineDash([]);
      A.text(ctx, "Voucher", vx + 12, y + vh * 0.62, Math.max(13, fs * 0.8), T.ink, "left");
      A.text(ctx, "50p", vx + vw - 12, y + vh * 0.7, fs * 1.6, T.red, "right");
      ctx.restore();
      return;
    }
    var you = m.who === "you";
    var wr = wrap(m.text, c.w * 0.74 - 24, fs);
    var bw = wr.w + 24;
    var x = you ? c.x + c.w - bw - 8 : c.x + 8;
    if (!calm) {
      var s = 0.85 + 0.15 * pop;
      ctx.translate(you ? x + bw : x, y + h);
      ctx.scale(s, s);
      ctx.translate(-(you ? x + bw : x), -(y + h));
    }
    bubble(x, y, bw, h - 2, you ? T.accent : T.paper, you);
    wr.lines.forEach(function (l, i) {
      A.text(ctx, l, x + 12, y + 9 + lh * (i + 0.8), fs, T.ink, "left");
    });
    ctx.restore();
  }

  function drawTray() {
    var tr = Lay.tray;
    ctx.fillStyle = T.ash;
    ctx.fillRect(tr.x, tr.y, tr.w, 2);
    if (!ex) return;
    // the fuse: periwinkle, red near the end
    if (ex.state === "open" && ex.timer && ex.timer.kind !== "survey") {
      var share = clamp(1 - ex.t / ex.timer.dur, 0, 1);
      ctx.fillStyle = share < 0.3 ? T.red : T.accent;
      ctx.fillRect(tr.x, tr.y, tr.w * share, 5);
      if (ex.timer.label) {
        var lp = 12;
        ctx.font = A.font(lp);
        var lw = ctx.measureText(ex.timer.label.toUpperCase()).width + 10;
        ctx.fillStyle = T.ink;
        ctx.fillRect(tr.x, tr.y - lp - 8, lw, lp + 7);
        A.text(ctx, ex.timer.label, tr.x + 5, tr.y - 5, lp, share < 0.3 ? T.red : T.accent, "left");
      }
    }
    if (ex.state !== "open" && ex.state !== "done") {
      // empty places, so the tray doesn't jump
      var n = 4;
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = T.ash;
      ctx.lineWidth = 2;
      for (var i = 0; i < n; i++) {
        var r = slotXY(i);
        A.rr(ctx, r.x + 1, r.y + 1, r.w - 2, r.h - 2, Math.min(r.h / 2, 16));
        ctx.stroke();
      }
      ctx.setLineDash([]);
      return;
    }
    if (ex.kind === "survey") { drawSurvey(); return; }
    var fadeOut = ex.state === "done" ? clamp(1 - ex.wait / 0.12, 0, 1) : 0;
    ex.chips.forEach(function (c) {
      if (c.gone) return;
      if (ex.state === "done" && c !== ex.picked) {
        if (calm || ex.wait < 0.3) return;
      }
      drawChip(c, chipRect(c), fadeOut);
    });
  }

  function drawChip(c, r, fadeOut) {
    var pressed = c.pressed && clock - c.pressed < 0.25;
    ctx.save();
    ctx.globalAlpha = (r.alpha == null ? 1 : r.alpha);
    if (pressed && !calm) {
      ctx.translate(r.x + r.w / 2, r.y + r.h / 2);
      ctx.scale(0.94, 0.94);
      ctx.translate(-(r.x + r.w / 2), -(r.y + r.h / 2));
    }
    var rad = Math.min(r.h / 2, 18);
    var fin = c.kind === "fin";
    // an accent halftone shadow, so the chip sits on the black
    A.rr(ctx, r.x + 3, r.y + 4, r.w, r.h, rad);
    ctx.fillStyle = A.ht(ctx, T.accent, 5, 1.3);
    ctx.fill();
    A.rr(ctx, r.x, r.y, r.w, r.h, rad);
    A.ink(ctx, fin ? T.accent : T.paper, 2.5);
    var slotFocus = (inputMode === "keys" || inputMode === "pad") ? focus === c.slot : hover === c.slot;
    if (slotFocus && ex.state === "open") {
      A.rr(ctx, r.x - 4, r.y - 4, r.w + 8, r.h + 8, rad + 4);
      ctx.strokeStyle = T.accent;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    if (fin && !calm) {
      var p = (clock * 1.6) % 1;
      A.rr(ctx, r.x - 3 - p * 6, r.y - 3 - p * 6, r.w + 6 + p * 12, r.h + 6 + p * 12, rad + 3 + p * 6);
      ctx.strokeStyle = T.paper;
      ctx.globalAlpha = (1 - p) * (r.alpha == null ? 1 : r.alpha);
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.globalAlpha = r.alpha == null ? 1 : r.alpha;
    }
    // key badge
    var keyed = inputMode === "keys";
    var left = r.x + 10;
    if (keyed && r.w > 60) {
      var kr = Math.min(11, r.h * 0.26);
      ctx.beginPath();
      ctx.arc(r.x + 8 + kr, r.y + r.h / 2, kr, 0, Math.PI * 2);
      ctx.fillStyle = T.ink;
      ctx.fill();
      A.text(ctx, String(c.slot + 1), r.x + 8 + kr, r.y + r.h / 2 + kr * 0.45, Math.max(12, kr * 1.25), T.paper, "center");
      left = r.x + 12 + kr * 2;
    }
    // the words: fitted, two lines if need be, cut short if it's shrinking
    var room = r.x + r.w - 10 - left;
    var fs = r.fs || Lay.chipFs;
    var txt = c.text.toUpperCase();
    ctx.font = A.font(fs);
    while (fs > 13 && ctx.measureText(txt).width > room) { fs -= 0.5; ctx.font = A.font(fs); }
    var lines = [txt];
    if (ctx.measureText(txt).width > room) {
      var wr = wrap(c.text, room, fs);
      if (wr.lines.length <= 2 && wr.w <= room && fs * 2.3 < r.h) lines = wr.lines;
      else {
        var cut = txt;
        while (cut.length > 1 && ctx.measureText(cut + "…").width > room) cut = cut.slice(0, -1);
        lines = [cut.length > 1 ? cut.replace(/\s+$/, "") + "…" : ""];
      }
    }
    var cx = keyed && r.w > 60 ? left + room / 2 : r.x + r.w / 2;
    lines.forEach(function (l, i) {
      var ly = r.y + r.h / 2 + fs * 0.36 + (i - (lines.length - 1) / 2) * fs * 1.05;
      A.text(ctx, l, cx, ly, fs, T.ink, "center");
    });
    ctx.restore();
  }

  function star(x, y, r) {
    ctx.beginPath();
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r;
      if (i) ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
      else ctx.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath();
  }

  function drawSurvey() {
    var b = surveyBox();
    var pop = calm ? 1 : ease(ex.t / 0.2);
    ctx.save();
    ctx.globalAlpha = pop;
    A.rr(ctx, b.x + 4, b.y + 5, b.w, b.h, 8);
    ctx.fillStyle = A.ht(ctx, T.accent, 6, 1.6);
    ctx.fill();
    A.rr(ctx, b.x, b.y, b.w, b.h, 8);
    A.ink(ctx, T.paper, 3);
    ctx.fillStyle = T.accent;
    ctx.fillRect(b.x + 1.5, b.y + 1.5, b.w - 3, 6);
    var fs = clamp(b.w * 0.05, 15, 22);
    A.text(ctx, L.SPECIAL.survey.ask, b.x + 14, b.y + 14 + fs, fs, T.ink, "left");
    // the fuse along the bottom of the card
    var share = clamp(1 - ex.t / ex.timer.dur, 0, 1);
    ctx.fillStyle = share < 0.3 ? T.red : T.accent;
    ctx.fillRect(b.x + 2, b.y + b.h - 7, (b.w - 4) * share, 5);
    ex.chips.forEach(function (c) {
      var r = surveyRect(c);
      var focused = ((inputMode === "keys" || inputMode === "pad") ? focus : hover) === c.slot && ex.state === "open";
      if (c.kind === "close") {
        A.text(ctx, c.text, r.x + r.w / 2, r.y + r.h / 2 + 4.5, 13, T.ink, "center");
        ctx.fillStyle = T.ink;
        ctx.font = A.font(13);
        var tw = ctx.measureText(c.text.toUpperCase()).width;
        ctx.fillRect(r.x + r.w / 2 - tw / 2, r.y + r.h / 2 + 7, tw, 1.5);
        if (inputMode === "keys") A.text(ctx, "6", r.x + r.w / 2 - tw / 2 - 10, r.y + r.h / 2 + 4.5, 12, T.ink, "center");
        if (focused) { A.rr(ctx, r.x, r.y, r.w, r.h, 6); ctx.strokeStyle = T.accent; ctx.lineWidth = 3; ctx.stroke(); }
        return;
      }
      var wob = calm ? 0 : Math.sin(clock * 5 + c.slot) * 0.08;
      ctx.save();
      ctx.translate(r.x + r.w / 2, r.y + r.h / 2);
      ctx.rotate(wob);
      star(0, 0, r.w * 0.48);
      A.ink(ctx, T.accent, 2.5);
      ctx.restore();
      if (inputMode === "keys") A.text(ctx, String(c.slot + 1), r.x + r.w / 2, r.y + r.h / 2 + 5, 13, T.ink, "center");
      if (focused) { A.rr(ctx, r.x - 2, r.y - 2, r.w + 4, r.h + 4, 6); ctx.strokeStyle = T.ink; ctx.lineWidth = 3; ctx.stroke(); }
    });
    ctx.restore();
  }

  function moodNow() {
    if (sg.mood.until > sg.t) return sg.mood.kind;
    if (sg.phase === "won" && !isDave()) return "bye";
    return ex && ex.state === "typing" ? "type" : "idle";
  }
  function mood(kind, dur) { if (sg) sg.mood = { kind: kind, until: sg.t + dur }; }

  function drawBoss() {
    var m = Lay.mascot;
    var mk = moodNow();
    if (mk === "type") mk = "idle";
    var pose = {
      t: clock, mood: mk, calm: calm, hurt: sg.hurt,
      low: sg.hp < 30 && sg.phase === "chat",
      blink: (clock % 3.7) < 0.12 ? 1 : 0,
      look: Lay.wide ? { x: 0.7, y: ex && ex.state === "open" ? 0.5 : 0.1 } : { x: 0.6, y: ex && ex.state === "open" ? 0.6 : 0 },
      tache: sg.tache, off: sg.tacheOff, glitch: sg.glitch > 0 && Math.floor(clock * 30) % 2 === 0
    };
    if (Lay.wide) {
      // a periwinkle halftone burst behind the boss
      ctx.save();
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.s * 0.68, 0, Math.PI * 2);
      ctx.fillStyle = A.ht(ctx, T.accent, 9, 2.1);
      ctx.fill();
      ctx.restore();
    }
    var ox = 0, oy = 0, sc = 1;
    if (sg.bossOut > 0) { ox = -ease(sg.bossOut) * (m.x + m.s); }
    if (sg.bossIn > 0 && sg.bossIn < 1) { ox = (1 - ease(sg.bossIn)) * -(m.x + m.s); }
    if (sg.phase === "closed") sc = 1 - ease(sg.closing) * 0.2;
    ctx.save();
    ctx.translate(ox, oy);
    if (isDave()) A.dave(ctx, m.x, m.y, m.s * sc, pose);
    else A.assistant(ctx, m.x, m.y, m.s * sc, pose);
    ctx.restore();
    sg.hurt = Math.max(0, sg.hurt - 0.05);

    // name, status, the bar and the streak
    var nm = isDave() ? "Dave" : "Assistant";
    var nfs = Lay.wide ? clamp(m.s * 0.15, 20, 30) : clamp(Lay.head.h * 0.22, 16, 24);
    var nx = Lay.name.x, ny = Lay.name.y;
    ctx.font = A.font(nfs);
    var nw = ctx.measureText(nm.toUpperCase()).width;
    var statusFs = Math.max(12, nfs * 0.55);
    var status = isDave() ? "A human" : "Online";
    ctx.font = A.font(statusFs);
    var sw = ctx.measureText(status.toUpperCase()).width + statusFs;
    var startX = Lay.name.align === "center" ? nx - (nw + 10 + sw) / 2 : nx;
    A.text(ctx, nm, startX, ny, nfs, T.paper, "left");
    ctx.beginPath();
    ctx.arc(startX + nw + 10 + statusFs * 0.35, ny - statusFs * 0.38, statusFs * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = T.accent;
    ctx.fill();
    A.text(ctx, status, startX + nw + 10 + statusFs * 0.85, ny, statusFs, T.smoke, "left");
    drawBar();
  }

  function drawBar() {
    var b = Lay.bar;
    var label = isDave() ? "Distance to a refund" : "Distance to a human";
    var lfs = 12;
    if (Lay.wide) lfs = 13;
    A.text(ctx, label, b.x, b.y - 6, lfs, T.paper, "left");
    var pct = Math.ceil(sg.hpShown - 0.01);
    A.text(ctx, Math.max(0, pct) + "%", b.x + b.w, b.y - 5, Math.max(16, b.h * 1.1), T.paper, "right");
    // streak pips: Speak to a human charging
    var need = run.perk === "agent" ? 2 : 3;
    var have = sg.finReady ? need : Math.min(sg.streak % (need + 1), need);
    var pr = Math.max(4, b.h * 0.3);
    var px0 = b.x + b.w * (Lay.wide ? 0.5 : 0.62);
    ctx.font = A.font(lfs);
    var pctW = ctx.measureText((Math.max(0, pct) + "%").toUpperCase()).width;
    for (var i = 0; i < need; i++) {
      var cx = b.x + b.w - pctW - 20 - (need - 1 - i) * (pr * 2.6) - (Lay.wide ? 30 : 16);
      if (Lay.wide) cx = b.x + b.w / 2 - (need - 1) * pr * 1.3 + i * pr * 2.6;
      var cy = Lay.wide ? b.y + b.h + 14 : b.y - 10;
      if (!Lay.wide && cx < b.x + 120) continue;
      ctx.beginPath();
      ctx.arc(cx, cy, pr, 0, Math.PI * 2);
      ctx.fillStyle = i < have ? (sg.finReady && !calm && Math.floor(clock * 4) % 2 ? T.paper : T.accent) : T.ink;
      ctx.fill();
      ctx.strokeStyle = T.paper;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    void px0;
    // the bar itself
    A.rr(ctx, b.x, b.y, b.w, b.h, 3);
    A.ink(ctx, T.ink, 0.0001);
    var inner = { x: b.x + 3, y: b.y + 3, w: b.w - 6, h: b.h - 6 };
    var g = clamp(sg.ghost / 100, 0, 1), s = clamp(sg.hpShown / 100, 0, 1);
    if (g > s) { ctx.fillStyle = T.paper; ctx.fillRect(inner.x, inner.y, inner.w * g, inner.h); }
    ctx.fillStyle = T.accent;
    ctx.fillRect(inner.x, inner.y, inner.w * s, inner.h);
    if (sg.pendingHeal > 0 && ex && ex.state === "open" && ex.timer) {
      var share = clamp(ex.t / ex.timer.dur, 0, 1);
      var hw = inner.w * Math.min(1 - s, sg.pendingHeal / 100) * share;
      ctx.fillStyle = A.ht(ctx, T.red, 4, 1.4);
      ctx.fillRect(inner.x + inner.w * s, inner.y, hw, inner.h);
      ctx.fillStyle = T.red;
      ctx.fillRect(inner.x + inner.w * s + hw - 2, inner.y, 2, inner.h);
    }
    A.rr(ctx, b.x, b.y, b.w, b.h, 3);
    ctx.strokeStyle = T.paper;
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

  function floater(text, where) { floaters.push({ text: text, where: where, born: clock }); }
  function drawFloaters() {
    floaters = floaters.filter(function (f) { return clock - f.born < 0.9; });
    floaters.forEach(function (f) {
      var a = clock - f.born, k = ease(a / 0.9);
      var x, y, color = T.paper, size = 18;
      var b = Lay.bar;
      if (f.where === "bar") { x = b.x + b.w * clamp(sg.hp / 100, 0, 1) + 6; y = b.y + b.h + 20; }
      else if (f.where === "heal") { x = b.x + b.w * clamp(sg.hp / 100, 0, 1); y = b.y + b.h + 20; color = T.red; }
      else { x = Lay.chat.x + Lay.chat.w - 40; y = Lay.chat.y + Lay.chat.h - 30; size = 14; color = T.accent; }
      y -= (calm ? 0 : k * 16);
      ctx.save();
      ctx.globalAlpha = 1 - clamp((a - 0.5) / 0.4, 0, 1);
      ctx.font = A.font(size);
      ctx.lineWidth = 4;
      ctx.strokeStyle = T.ink;
      ctx.textAlign = "center";
      ctx.strokeText(f.text.toUpperCase(), x, y);
      A.text(ctx, f.text, x, y, size, color, "center");
      ctx.restore();
    });
  }

  // the one thing to do, the first time it comes up
  function drawArrow() {
    if (!ex || ex.state !== "open" || sg.phase !== "chat") return;
    var target = null, word = null;
    var keys = inputMode === "keys" || inputMode === "pad";
    function verb(c) { return keys ? "Press " + (c.slot + 1) : inputMode === "touch" ? "Tap" : "Click"; }
    var fin = ex.chips.filter(function (c) { return c.kind === "fin" && !c.gone; })[0];
    var honest = ex.chips.filter(function (c) { return c.honest && !c.gone; })[0];
    if (!run.taught.basic && honest && (ex.kind === "open" || ex.kind === "std")) { target = honest; word = verb(honest) + ": it's true"; }
    else if (fin && !run.taught.fin) { target = fin; word = keys ? "Press " + (fin.slot + 1) : "Big one"; }
    else if (ex.kind === "yesyes" && !run.taught.no && honest) { target = honest; word = keys ? "Press 3" : "Not yes"; }
    else if (ex.kind === "survey" && !run.taught.survey && honest) { target = honest; word = keys ? "Press 6" : "This"; }
    else if (ex.kind === "still" && !run.taught.still && honest) { target = honest; word = keys ? "Press " + (honest.slot + 1) : "Say so"; }
    if (!target) return;
    var r = chipRect(target);
    var rad = Math.min(r.h / 2, 18);
    A.rr(ctx, r.x - 5, r.y - 5, r.w + 10, r.h + 10, rad + 5);
    ctx.strokeStyle = T.paper;
    ctx.lineWidth = 3;
    ctx.setLineDash([7, 5]);
    ctx.lineDashOffset = calm ? 0 : -clock * 20;
    ctx.stroke();
    ctx.setLineDash([]);
    var x = clamp(r.x + r.w / 2, Lay.tray.x + 60, Lay.tray.x + Lay.tray.w - 60);
    var y = Math.min(r.y - 4, Lay.tray.y + 6);
    if (y - 70 < Lay.chat.y) return;
    A.arrow(ctx, x, y, word, 13, clock, calm);
  }

  // ---------------------------------------------------------------------------
  // The tracking screen: it goes wrong, then you're in the chat
  // ---------------------------------------------------------------------------
  function riderAt(path, p) {
    var len = 0, segs = [];
    for (var i = 1; i < path.length; i++) {
      var d = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
      segs.push(d); len += d;
    }
    var want = clamp(p, 0, 1) * len;
    for (var j = 0; j < segs.length; j++) {
      if (want <= segs[j] || j === segs.length - 1) {
        var k = segs[j] ? clamp(want / segs[j], 0, 1) : 0;
        return [lerp(path[j][0], path[j + 1][0], k), lerp(path[j][1], path[j + 1][1], k)];
      }
      want -= segs[j];
    }
    return path[path.length - 1];
  }

  function drawTracking() {
    var box = { x: 0, y: hudB - 4, w: W, h: H - hudB + 4 };
    var t = sg.trackT;
    var st = sg.st;
    var m = A.map(ctx, box, {});
    // other houses on the street
    var homes = [[28, 43], [42, 43], [28, 57], [42, 57], [58, 43], [72, 43], [65, 57], [58, 27], [12, 43]];
    var hs = Math.max(10, m.s * 4.2);
    homes.forEach(function (h, i) { A.house(ctx, m.x(h[0]), m.y(h[1]), hs * (i === 1 ? 1 : 0.8), ""); });
    var hedgeStage = st.key === "hedge";
    var deliveredAt = 4.2;
    // your pin; on the hedge, it jumps across the road
    var pinX = 35, pinY = 44;
    if (hedgeStage && t > 3.2) { pinX = 65; pinY = 56; }
    var path = st.track.path;
    var p = st.key === "coffee" ? clamp((t - 2.6) / 1.6, 0, 1) : clamp((t - 0.2) / (deliveredAt - 0.3), 0, 1);
    var pos = riderAt(path, p);
    A.pin(ctx, m.x(pinX), m.y(pinY) - hs * 0.4, Math.max(16, m.s * 5));
    if (st.key === "coffee") {
      // the coffee shop, on the corner
      A.rr(ctx, m.x(84), m.y(84), m.s * 9, m.s * 6, 3);
      A.ink(ctx, T.accent, 2.5);
    }
    A.rider(ctx, m.x(pos[0]), m.y(pos[1]), Math.max(12, m.s * 3.2), clock, calm);

    // the status card
    var cw = Math.min(W - 24, 400), fs = clamp(cw * 0.055, 16, 22), small = Math.max(13, fs * 0.66);
    var extra = st.key === "coffee" ? Math.min(st.fees.length, 1 + Math.floor(t / 0.6)) : 0;
    var lines = st.key === "coffee" ? Math.ceil(extra / 2) : 0;
    var ch = fs * 2.6 + small * 2.4 + 22 + lines * small * 1.35;
    var cx = (W - cw) / 2, cy = H - ch - 14;
    A.rr(ctx, cx + 4, cy + 5, cw, ch, 8);
    ctx.fillStyle = A.ht(ctx, T.accent, 6, 1.6);
    ctx.fill();
    A.rr(ctx, cx, cy, cw, ch, 8);
    A.ink(ctx, T.paper, 3);
    var delivered = t >= deliveredAt;
    var mins = Math.round(lerp(st.track.mins[0], st.track.mins[1], clamp(t / deliveredAt, 0, 1)));
    ctx.fillStyle = delivered ? T.accent : T.ink;
    ctx.fillRect(cx + 1.5, cy + 1.5, cw - 3, 7);
    var head = delivered ? "Delivered" : "Your rider is 2 minutes away";
    var wr = wrap(head, cw - 28, fs);
    wr.lines.slice(0, 2).forEach(function (l, i) { A.text(ctx, l, cx + 14, cy + 14 + fs * (i + 1) * 1.02, fs, T.ink, "left"); });
    var sub = delivered ? st.caption : "Ordered " + mins + " minutes ago";
    var sy = cy + 14 + fs * Math.min(2, wr.lines.length) * 1.02 + small * 1.4;
    A.text(ctx, sub, cx + 14, sy, small, T.ink, "left");
    // the progress bar, stuck
    if (!delivered) {
      var bw = cw - 28;
      ctx.fillStyle = T.ink;
      ctx.fillRect(cx + 14, sy + small * 0.7, bw, 6);
      ctx.fillStyle = T.accent;
      ctx.fillRect(cx + 14, sy + small * 0.7, bw * 0.9, 6);
    }
    if (extra) {
      for (var f = 0; f < extra; f++) {
        var fx = cx + 14 + (f % 2) * (cw - 28) / 2, fy = sy + small * 1.9 + Math.floor(f / 2) * small * 1.35;
        A.text(ctx, st.fees[f][0] + " £" + st.fees[f][1], fx, fy, small, f ? T.red : T.ink, "left");
      }
    }
    // skip
    var skip = inputMode === "keys" ? "Any key skips" : inputMode === "touch" ? "Tap to skip" : "Click to skip";
    A.text(ctx, skip, cx + cw - 12, cy + ch - 9, 12, T.ink, "right");
    // the photo
    if (t > deliveredAt + 0.15) {
      var k = calm ? 1 : ease((t - deliveredAt - 0.15) / 0.3);
      var pw = Math.min(W * 0.48, (cy - hudB) * 0.72, 260);
      var py = hudB + (cy - hudB) / 2;
      ctx.save();
      ctx.globalAlpha = calm ? k : 1;
      ctx.translate(W / 2, py);
      if (!calm) ctx.scale(0.6 + 0.4 * k, 0.6 + 0.4 * k);
      A.photo(ctx, 0, 0, pw, st.key, st.key === "hedge" ? "Not my hedge" : st.key === "drink" ? "Where is the drink" : st.key === "chips" ? "Chips. Cold" : "Mostly fees", -0.05);
      ctx.restore();
    }
  }

  function render(dt) {
    if (!ctx || !run) return;
    var st = shell.state();
    if (st !== "paused") clock += dt;
    if (st !== lastState) { lastState = st; measureHud(); }
    if (shell.state() === "countdown" && sg && !sg.briefed) {
      sg.briefed = true;
      shell.brief({ title: (sg.i + 1) + ". " + sg.st.name, text: sg.st.brief, ms: sg.phase === "track" ? 7000 : 5200 });
    }
    if (++hudCheck % 30 === 0) paintHud();
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.fillStyle = T.ink;
    ctx.fillRect(0, 0, W, H);
    if (!sg || !Lay.tray) return;
    if (shake > 0 && !calm) {
      shake -= dt;
      ctx.translate((Math.random() - 0.5) * 6 * shake / 0.3, (Math.random() - 0.5) * 6 * shake / 0.3);
    }
    if (sg.phase === "track") { drawTracking(); return; }
    if (Lay.wide) {
      // the phone's screen: an ash edge round the chat
      A.rr(ctx, Lay.col.x - 4, Lay.col.y - 2, Lay.col.w + 8, Lay.col.h + 4, 14);
      ctx.strokeStyle = T.ash;
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      ctx.fillStyle = T.ash;
      ctx.fillRect(0, Lay.head.y + Lay.head.h - 2, W, 2);
    }
    drawBoss();
    drawChat();
    drawTray();
    drawArrow();
    drawFloaters();
    // the scroll settles
    sg.scroll = calm ? 0 : sg.scroll * Math.exp(-dt * 16);
    if (sg.closing > 0) {
      // the app closing: the screen folds to a line
      var k = ease(sg.closing);
      ctx.fillStyle = T.ink;
      var cy = Lay.col.y + Lay.col.h / 2;
      ctx.fillRect(0, Lay.col.y, W, (cy - Lay.col.y) * k);
      ctx.fillRect(0, cy + (Lay.col.y + Lay.col.h - cy) * (1 - k), W, (Lay.col.y + Lay.col.h - cy) * k + 2);
      if (k > 0.9) { ctx.fillStyle = T.paper; ctx.fillRect(W * 0.2, cy - 1, W * 0.6, 2); }
    }
  }

  function resize(w, h, dpr) {
    W = w; H = h; DPR = dpr;
    ctx = (shell ? shell.canvas : root.querySelector("canvas")).getContext("2d");
    wrapCache = {};
    if (shell) { layout(); measureHud(); }
  }

  // ---------------------------------------------------------------------------
  // HUD: the order and your patience top left, the refund and the time top right
  // ---------------------------------------------------------------------------
  function buildHud() {
    shell.hud.innerHTML =
      '<div class="kit-hud-tl">' +
        '<p class="kit-stat"><small>Order</small><span data-stage>1</span>/4</p>' +
        '<p class="kit-stat sth-patience"><small>Patience</small><span class="sth-pips" data-pips></span></p>' +
      '</div>' +
      '<div class="kit-hud-tr">' +
        '<p class="kit-stat kit-stat-big" data-refund>£0.00</p>' +
        '<p class="kit-stat" data-minor><small>Time</small><span data-time>0:00</span></p>' +
      '</div>';
    hudEls = {
      stage: shell.hud.querySelector("[data-stage]"),
      pips: shell.hud.querySelector("[data-pips]"),
      refund: shell.hud.querySelector("[data-refund]"),
      time: shell.hud.querySelector("[data-time]")
    };
  }

  function paintHud() {
    if (!hudEls || !run) return;
    var v = { stage: String(run.stage + 1), refund: money(run.refund), time: mmss(run.time),
              pips: run.patience + "/" + Math.max(run.patienceMax, run.patience) };
    if (v.stage !== hudWas.stage) hudEls.stage.textContent = v.stage;
    if (v.refund !== hudWas.refund) hudEls.refund.textContent = v.refund;
    if (v.time !== hudWas.time) hudEls.time.textContent = v.time;
    if (v.pips !== hudWas.pips) {
      var n = Math.max(run.patienceMax, run.patience), html = "";
      for (var i = 0; i < n; i++) html += '<span class="sth-pip' + (i < run.patience ? " is-on" : "") + '"></span>';
      hudEls.pips.innerHTML = html;
      hudEls.pips.parentNode.setAttribute("aria-label", "Patience " + run.patience);
      hudEls.pips.parentNode.classList.toggle("is-low", run.patience <= 1);
    }
    hudWas = v;
  }

  // ---------------------------------------------------------------------------
  // Callouts (one at a time; routine ones rationed) and sound
  // ---------------------------------------------------------------------------
  function callout(text, o) {
    o = o || {};
    if (o.routine) {
      var last = sg.cooldowns[o.routine];
      if (last != null && sg.t - last < (o.gap || 5)) return;
      sg.cooldowns[o.routine] = sg.t;
    }
    shell.callout(text, { sound: o.sound });
  }

  function botVoice(text) {
    var n = Math.min(6, text.split(" ").length);
    var base = isDave() ? 440 : 640;
    for (var i = 0; i < n; i++) {
      shell.sound.tone(base + ((i * 37) % 90) - 40, 0.045, { type: "square", vol: 0.03, delay: 0.02 + i * 0.065 });
    }
  }

  function sound(name) {
    var S = shell.sound;
    switch (name) {
      case "bot": S.tone(880, 0.05, { vol: 0.05 }); S.tone(1175, 0.07, { vol: 0.05, delay: 0.05 }); break;
      case "send": S.noise(0.1, { type: "bandpass", freq: 1800, q: 1, vol: 0.08 }); S.tone(660, 0.08, { vol: 0.05, slide: 990 }); break;
      case "hit":
        S.tone(170, 0.16, { type: "sine", slide: 60, vol: 0.35 });
        S.noise(0.09, { freq: 1500, vol: 0.18 });
        S.tone(520, 0.12, { vol: 0.05, slide: 260, delay: 0.04 });
        break;
      case "fin":
        S.tone(392, 0.32, { type: "sawtooth", vol: 0.06, delay: 0.06 });
        S.tone(494, 0.32, { type: "sawtooth", vol: 0.06, delay: 0.1 });
        S.tone(587, 0.4, { type: "sawtooth", vol: 0.06, delay: 0.14 });
        break;
      case "wrong": S.tone(110, 0.25, { type: "sawtooth", vol: 0.12 }); S.tone(104, 0.25, { type: "sawtooth", vol: 0.1 }); break;
      case "heal": [523, 659, 784, 1047].forEach(function (f, i) { S.tone(f, 0.08, { vol: 0.045, delay: 0.05 + i * 0.06 }); }); break;
      case "survey": S.tone(988, 0.1, { type: "sine", vol: 0.1 }); S.tone(1319, 0.16, { type: "sine", vol: 0.1, delay: 0.1 }); break;
      case "loop": [784, 659, 523, 392].forEach(function (f, i) { S.tone(f, 0.09, { vol: 0.06, delay: i * 0.08 }); }); break;
      case "close": S.tone(440, 0.6, { type: "sawtooth", vol: 0.1, slide: 40 }); break;
      case "join": S.tone(659, 0.18, { type: "sine", vol: 0.12 }); S.tone(523, 0.3, { type: "sine", vol: 0.12, delay: 0.2 }); break;
      case "coin": S.tone(988, 0.07, { vol: 0.06 }); S.tone(1319, 0.2, { vol: 0.06, delay: 0.07 }); break;
      case "shuffle": S.noise(0.12, { type: "bandpass", freq: 3200, q: 2, vol: 0.06 }); break;
      case "fall": S.tone(900, 0.5, { type: "square", vol: 0.05, slide: 200 }); S.noise(0.1, { freq: 800, vol: 0.2, delay: 0.5 }); break;
      case "ding": S.tone(1568, 0.12, { type: "sine", vol: 0.1 }); S.tone(2093, 0.25, { type: "sine", vol: 0.08, delay: 0.1 }); break;
    }
  }

  // The tracking screen's ding when it says Delivered, and the ticking fuse
  var wasDelivered = false, lastTick = -1;
  function soundTicks() {
    if (!sg || shell.state() !== "playing") return;
    if (sg.phase === "track") {
      var d = sg.trackT >= 4.2;
      if (d && !wasDelivered) sound("ding");
      wasDelivered = d;
    } else wasDelivered = false;
    if (ex && ex.state === "open" && ex.timer && ex.kind !== "survey") {
      var step = Math.floor(ex.t / 0.25);
      if (step !== lastTick) {
        lastTick = step;
        var share = ex.t / ex.timer.dur;
        if (share > 0.4) shell.sound.tone(900 + share * 600, 0.025, { vol: 0.035 });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Start it up
  // ---------------------------------------------------------------------------
  shell = N.createGame({
    root: root,
    slug: "speak-to-a-human",
    title: "Speak to a Human",
    stamp: "Case closed",
    tilt: -5,
    note: "Four orders. One help chat. It's never rude, and it never helps.",
    pitch: "Your food never came. The help chat is a bot. Get past it.",
    hints: {
      keys: "1 to 4, or the arrows and Enter, to pick a reply. Or click. P to pause.",
      touch: "Tap the reply that's true."
    },
    againLabel: "Complain again",
    daily: true,
    fullOnTouch: true,
    keys: {
      up: ["ArrowUp", "KeyW"], down: ["ArrowDown", "KeyS"], left: ["ArrowLeft", "KeyA"], right: ["ArrowRight", "KeyD"],
      action: ["Enter", "NumpadEnter", "Space"],
      c1: ["Digit1", "Numpad1"], c2: ["Digit2", "Numpad2"], c3: ["Digit3", "Numpad3"],
      c4: ["Digit4", "Numpad4"], c5: ["Digit5", "Numpad5"], c6: ["Digit6", "Numpad6"],
      close: ["KeyX"]
    },
    pad: { action: [0, 2] },
    reset: reset,
    update: function (dt, input) { update(dt, input); soundTicks(); },
    render: render,
    resize: resize
  });
  T = shell.tokens;
  A.init(T);
})();
