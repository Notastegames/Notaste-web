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
// THE LOOP. Assistant types, then says something ("Have you checked behind
// your bins?") and offers four replies. One answers it and doesn't let it
// off ("I don't have bins"). The other three look like it, but they go along
// with it ("I'll check my bins"), dodge it ("Which bins?") or thank it
// ("Thanks, bins"). Every line has its own replies (lines.js), dealt so
// nothing comes round twice in a round: you have to read the bot to beat it.
// The true reply pushes the "Distance to a human" bar down: faster is harder,
// true replies in a row stack, and three in a row earns the Speak to a human
// chip, which hits hardest (a human starts typing, then it's Assistant again).
//
// YOUR PHONE'S BATTERY is what runs out. It drains while you're in the chat,
// and every reply that plays along takes a chunk (and heals the bot). At 0%
// the phone dies and the round ends. Between orders it only gets a little
// back, so a slow or sloppy round 1 is felt in round 4.
//
// TEACHING IT IN THE FIRST SECONDS. The tracking screen runs under the
// countdown, so the chat opens soon after Go. Then the pointer (a dashed ring
// with a word on it) does the teaching, one thing at a time: "Complain" on
// the opener, a ring round the bar ("Get it to 0%") the first time it moves,
// "Argue back" on the first ordinary line, and a ring round the battery
// ("Phone dies at 0%") the first time it drops. Pick a reply that plays
// along and the next ordinary line gets its "Argue back" ring again (three
// times a round at most), so nobody is left guessing and nobody who's got it
// is told twice.
//
// THE BOT FIGHTS BACK. Each order's countdown notice says what's new; in
// play, only the pointer teaches (the first time each one comes up):
// - "Did this answer your question?" Yes / Yes, and a small No that drifts
//   along under them and shrinks away. Catch it.
// - "Can I take your order number again?" Four lookalike numbers. Yours is in
//   the chat's header the whole time.
// - "I understand you're frustrated." It's healing: a ring runs down and the
//   heal shows on the bar in red. A true reply before it ends stops it and
//   hits double ("Interrupted").
// - A 50p voucher, once an order (from the second), when it's losing: take it
//   and the order ends there for 50p; refuse and fight on.
// - "This chat will close due to inactivity", while you're mid-reply. Say
//   you're there before the fuse ends, or the chat starts again from hello.
// - A satisfaction survey over the replies: five big stars (each one heals
//   the bot) and a small No thanks that moves between corners.
// - Replies drift and swap places (keys follow the place, not the reply),
//   and on the last order the true reply shrinks and then it's gone.
//
// THE ORDERS (stages). Each opens with the tracking screen going wrong (6
// seconds; any key or tap skips it, and a restarted round skips it): the
// rider, a cut-out on a scooter with the bag on his back, circles the block,
// "Your rider is 2 minutes away" while the minutes since you ordered race up,
// then Delivered and a photo.
// 1. The missing drink (£2.80): the basics, Yes or yes.
// 2. The cold chips (£3.20): your order number, it understands, a voucher.
// 3. The hedge (£24.60): closing the chat, the survey, replies that move.
// 4. The £14 coffee (£14.00, mostly fees): shrinking replies, then Dave, a
//    human, with his own bar ("Distance to a refund") and all of the above,
//    faster. He offers the voucher in this order.
//
// BETWEEN ORDERS (shell.interlude) pick how you go into the next chat, each
// with a cost on its card: Type in capitals, Say agent repeatedly, Threaten a
// review, Low power mode, Plug in the charger, Turn notifications on. The
// first two interludes offer different halves of the six.
//
// SCORE. The refund in pence, plus up to 300 a full refund for time (par for
// the order or better, nothing at twice par), plus 4 for every 1% of battery
// left at the end. THE LADDER. Approved: all four refunded in full (Dave
// beaten) and at least APPROVED points. Pending review: finished, two or more
// in full. Not approved: finished on vouchers, or the phone died on the hedge
// or the coffee. Rejected: the phone died on the drink or the chips.
//
// TODAY'S RUN deals everyone the same order numbers, the same lines and
// replies in the same places, the same tricks in the same order and the same
// ways in, each order from its own stream (planRun).
//
// TEST FLAGS (with ?debug, which also exposes window.__speakToAHuman for
// test players): &stage=3 starts at that order, &dave starts at Dave, &hp=20
// starts the bar there, &skill=0.4 sets the autopilot's skill (0 to 1) with
// ?autopilot.
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
  var BASE = 8.5, FIN = 18;                // damage of a true reply, and of Speak to a human
  var QUICK = 0.5;                        // up to this much more for a quick reply
  var QUICK_FULL = 0.9, QUICK_NONE = 2.6; // seconds after the replies come up: full bonus, none
  var STREAK = 0.08, STREAK_MAX = 5;      // each true reply in a row adds this, up to five
  var ARMOUR = [1.3, 1.0, 0.9, 1.0];      // how hard a hit lands, per order; Dave's below
  var DAVE_ARMOUR = 0.95;
  var HEAL = { decoy: 6, yes: 8, frustrated: 10, still: 15, star: 8, survey: 6, shrink: 6, number: 5, yesyes: 8 };
  var TYPING = [0.62, 0.55, 0.5, 0.45], DAVE_TYPING = 0.42;
  var FUSE = {                            // seconds, per order (Dave last)
    no: [3.0, 2.8, 2.6, 2.4, 2.3],
    ring: [2.6, 2.5, 2.3, 2.2, 2.0],
    still: [3.2, 3.2, 3.0, 2.8, 2.6],
    survey: [3.8, 3.8, 3.6, 3.4, 3.2],
    voucher: [4.5, 4.5, 4.5, 4.5, 4.5],
    shrink: [3.4, 3.4, 3.4, 3.2, 3.0]
  };
  var DRIFT = [0, 0, 0.06, 0.09, 0.1];    // share of a chip's width
  var SHUFFLE = [0, 0, 0.35, 0.45, 0.5];  // chance a message's replies swap places
  var WOBBLE = 0.35;                      // seconds the replies shake before they swap
  var PAR = [16, 20, 26, 48];             // seconds in the chat for the time bonus (order 4 includes Dave)
  var TIME_BONUS = 300;
  // the phone's battery, in %
  var DRAIN = 0.45;                       // a second, in the chat
  var WRONG = 12;                         // a reply that plays along
  var LOOPED = 10;                        // the chat closed on you
  var BETWEEN = 6;                        // back between orders
  var CHARGE = 30;                        // Plug in the charger
  var BATT_SCORE = 4;                     // points for each 1% left at the end
  var APPROVED = 5750;
  var IDLE = 7;                           // seconds of nothing before it closes the chat on you
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
  function ease2(v, to) { v = v || 0; return v + (to - v) * 0.18; }
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
  var verdict = null; // the last reply's result, for the flash: { ok, born }

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
    // the lines anyone gets are dealt once a round, a few to each order
    var general = shuffled(N.seeded(seedFrom(seed, 55)), L.GENERAL);
    var per = Math.floor(general.length / 4);
    for (var i = 0; i < 4; i++) {
      var r = N.seeded(seedFrom(seed, i));
      var p = {
        no: orderNumber(r),
        deck: planDeck(i, false, r),
        lines: shuffled(r, L.STAGES[i].lines.concat(general.slice(i * per, (i + 1) * per))),
        rng: Math.floor(r() * 2147483647),
        offers: null
      };
      if (i === 3) {
        p.daveDeck = planDeck(i, true, r);
        p.daveLines = shuffled(r, L.DAVE);
      }
      plan.push(p);
    }
    // the first two interludes offer different halves of the six ways in;
    // the third is dealt from what you haven't picked (endStage)
    var pr = N.seeded(seedFrom(seed, 77));
    var perm = shuffled(pr, L.PERKS);
    plan[1].offers = perm.slice(0, 3);
    plan[2].offers = perm.slice(3, 6);
    plan.lastDeal = shuffled(pr, L.PERKS);
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
      battery: 100,
      picked: [],
      refund: 0,
      score: 0,
      time: 0,
      results: [],
      perk: null,
      deadAt: null,
      daveBeaten: false,
      taught: {},
      hints: 0,
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
      tache: 0, tacheOff: 0, briefed: false, cooldowns: {},
      rng: N.seeded(p.rng), fin: null, unmask: 0
    };
    if (run.perk === "review") { sg.hp = sg.hpShown = sg.ghost = 75; sg.voucherDone = true; }
    ex = null;
    focus = 0;
    hover = -1;
    if (sg.phase === "chat") beginChat();
  }

  // The notice is for before the chat. The kit has no way to take one down
  // early, so it's put up again for a millisecond, which fades it out.
  var lastBrief = null;
  function brief(o) { lastBrief = o; shell.brief(o); }
  function briefDown() {
    if (lastBrief) shell.brief({ title: lastBrief.title, text: lastBrief.text, ms: 1 });
    lastBrief = null;
  }

  function beginChat() {
    if (shell.state() === "playing") briefDown();
    sg.phase = "chat";
    post("sys", "Help: chat with Assistant");
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

  function nextLine() {
    var list = isDave() ? sg.p.daveLines : sg.p.lines;
    var line = list[sg.lineAt % list.length];
    sg.lineAt++;
    return line;
  }

  // along: what the bot says back if you pick this one and it plays along
  function chip(text, honest, kind, said, along) {
    return { text: text, honest: !!honest, kind: kind || (honest ? "honest" : "decoy"), said: said || text, along: along || null, slot: 0, from: -1, swap: 1, phase: 0 };
  }
  // a line from lines.js: [what it says, the true reply, three that play
  // along, what it says back to any of those three]
  function fromLine(line) {
    return [chip(line[1], true)].concat(line.slice(2, 5).map(function (d) { return chip(d, false, null, null, line[5]); }));
  }

  function build(kind, entry) {
    var r = N.seeded(entry.seed | 0);
    var k = stageKey();
    var dave = isDave();
    var e = { kind: kind, t: 0, chips: [], timer: null, shuffleAt: -1, shuffled: false, drift: DRIFT[k], shrink: 0, picked: false, bot: "", idle: 0 };
    var S = L.SPECIAL, line;
    var fuse = function (name) { return FUSE[name][k] * (run.perk === "notify" ? 1.5 : 1); };
    if (kind === "open") {
      e.bot = dave ? L.DAVE_OPEN : L.OPEN;
      if (dave) e.chips = [chip(L.DAVE_COMPLAINT[0], true)].concat(L.DAVE_COMPLAINT[1].map(function (d, i) { return chip(d, false, null, null, L.DAVE_COMPLAINT[2][i]); }));
      else e.chips = [chip(sg.st.complaint, true)].concat(sg.st.looks.map(function (d, i) { return chip(d, false, null, null, sg.st.along[i]); }));
    } else if (kind === "std" || kind === "shrink") {
      line = nextLine();
      e.bot = line[0];
      e.chips = fromLine(line);
      if (kind === "shrink") { e.shrink = fuse("shrink"); e.timer = { kind: "shrink", dur: e.shrink, label: "" }; }
    } else if (kind === "frustrated") {
      e.bot = dave ? S.frustrated.dave : S.frustrated.bot;
      e.chips = [chip(pickFrom(r, S.frustrated.honest), true)].concat(shuffled(r, S.frustrated.decoys).slice(0, 3).map(function (d) { return chip(d, false, null, null, S.frustrated.along); }));
      e.timer = { kind: "ring", dur: fuse("ring"), label: "Healing" };
    } else if (kind === "yesyes") {
      e.bot = dave ? S.yesyes.dave : S.yesyes.bot;
      e.chips = [chip("Yes", false, "yes", null, S.yesyes.along), chip("Yes", false, "yes", null, S.yesyes.along), chip(S.yesyes.no, true, "no", S.yesyes.said)];
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
      e.bot = dave ? S.still.dave : pickFrom(r, S.still.bot);
      e.chips = [chip(pickFrom(r, S.still.honest), true, "still")].concat(shuffled(r, S.still.decoys).map(function (d) { return chip(d); }));
      e.timer = { kind: "still", dur: fuse("still"), label: "Closing" };
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
    // (the order number sits in the chat's header the whole time)
    readOut((isDave() ? "Dave: " : "Assistant: ") + ex.bot + (ex.kind === "number" ? " Your order number is " + sg.p.no + "." : ""));
    sound("bot");
    if (ex.kind === "survey") sound("survey");
    if (ex.kind === "frustrated") {
      sg.pendingHeal = HEAL.frustrated;
      mood("tilt", ex.timer.dur);
    }
  }

  // The chat and the replies are only drawn, so read them out: the line, then
  // each reply with the key that picks it (keys follow the place).
  function readOut(lead) {
    var list = ex.chips.filter(function (c) { return !c.gone; }).sort(function (a, b) { return a.slot - b.slot; });
    shell.announce(lead + " " + list.map(function (c) {
      return (c.slot + 1) + ": " + c.text + (/[.?!]$/.test(c.text) ? "" : ".");
    }).join(" "));
  }

  // ---------------------------------------------------------------------------
  // Picking a reply
  // ---------------------------------------------------------------------------
  // Right or wrong, said at once: the reply you picked turns green with a tick
  // or red with a cross, and the screen's edge flashes the same colour
  function judge(ok, c) {
    verdict = { ok: ok, born: clock };
    if (c) c.verdict = ok;
  }

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
    ex.doneAt = clock;
    c.pressed = clock;
    sg.pendingHeal = 0;
    auto = null;
    if (c.kind === "close") {   // the survey's No thanks: no bubble, it just goes
      judge(true, c);
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
    judge(!!c.honest, c);
    if (c.honest) {
      if (ex.kind === "open") run.taught.open = true;
      else run.taught.basic = true;
      if (c.kind === "fin") {
        run.taught.fin = true;
        sg.streak = 0;
        sg.finReady = false;
        callout("Escalated");
        sound("fin");
        if (!calm) shake = 0.35;
        damage(FIN, rt, { fin: true });
        if (sg.hp > 0) {
          // the payoff: a human starts typing, and then it's the bot again
          var daveNow = isDave();
          sg.fin = { t: 0, dur: 1.25 };
          mood("bye", 1.25);
          later(1.25, function () {
            sg.fin = null;
            sg.glitch = 0.3;
            mood("smug", 1.2);
            sound("loop");
            post("bot", daveNow ? L.SPECIAL.fin.daveReply : pickFrom(sg.rng, L.SPECIAL.fin.reply));
          });
          ex.wait = 1.75;
        }
      } else {
        var mult = 1;
        if (ex.kind === "frustrated" && ex.t <= ex.timer.dur) { mult = 2; callout("Interrupted", { routine: "int", gap: 6 }); }
        if (ex.kind === "no") run.taught.no = true;
        if (c.kind === "no") { run.taught.no = true; callout("Not yes", { routine: "notyes", gap: 8 }); }
        if (c.kind === "number") callout("Order number: confirmed", { routine: "num", gap: 10 });
        if (c.kind === "number") run.taught.number = true;
        if (ex.kind === "frustrated") run.taught.frustrated = true;
        if (ex.kind === "shrink") run.taught.shrink = true;
        if (c.kind === "still") { run.taught.still = true; }
        if (c.kind === "refuse") { run.taught.voucher = true; callout("Voucher: declined"); }
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
    var quick = clamp(1 - (rt - QUICK_FULL) / (QUICK_NONE - QUICK_FULL), 0, 1) * QUICK;
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
    // and in the chat, where the eyes are: what that reply did
    post("res", Math.max(1, Math.round(d)) + "% closer to a human", { ok: true });
    if (quick > QUICK * 0.55 && !o.fin) floater("Quick", "you");
    if (sg.hp <= 0) { win(); return; }
    tell("bar", "Get it to 0%");
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

  // the battery: true if the phone died
  function drain(n, quiet) {
    var was = run.battery;
    run.battery = Math.max(0, run.battery - n);
    paintHud();
    if (!quiet) { sound("wrong"); floater("-" + Math.round(n) + "%", "batt"); }
    if (run.battery <= 0) { phoneDies(); return true; }
    if (was > 20 && run.battery <= 20) callout("Battery: low");
    return false;
  }

  function wrong(c) {
    sg.streak = 0;
    sg.finReady = false;
    var cost = WRONG * (run.perk === "agent" ? 2 : 1);
    var heals = c.kind === "yes" ? HEAL.yes : c.kind === "star" ? HEAL.star : c.kind === "number" ? HEAL.number : HEAL.decoy;
    mood("smug", 0.8);
    // played along with an ordinary line: show the next one's true reply again
    if ((ex.kind === "std" || ex.kind === "open") && run.hints < 3) { run.hints++; run.taught.basic = false; }
    // "OK, close it": so it does, and you start again from hello
    if (ex.kind === "still") {
      loop("Chat closed. You asked");
      return;
    }
    if (drain(cost)) return;
    tell("batt", "Phone dies at 0%");
    post("res", "Played along: battery -" + Math.round(cost) + "%", { ok: false });
    heal(heals);
    var lines = isDave() ? L.DAVE_HEAL : L.HEAL;
    // it answers what you actually said
    var said = c.kind === "number" ? (sg.i === 2 ? L.SPECIAL.number.wrongHedge : L.SPECIAL.number.wrong)
      : c.kind === "star" ? "Thank you. That really helps me." : c.along || pickFrom(sg.rng, lines);
    later(0.28, function () { post("bot", said); });
    if (c.kind === "yes") callout("Ticket: closed", { routine: "closed", gap: 6 });
    else if (c.kind === "star") callout("Rated. Why", { routine: "rated", gap: 6 });
    else if (c.kind === "number") callout("Wrong order", { routine: "wrongno", gap: 6 });
    else callout("Played along", { routine: "along", gap: 5 });
    ex.wait = 0.75;
    // you said it was fine, so it closes the chat as resolved, and it's
    // hello again: the complaint has to be made before anything else
    if (ex.kind === "open") {
      var who = isDave() ? "Dave" : "Assistant";
      later(1.1, function () { post("sys", "Chat closed: resolved"); sound("loop"); });
      later(1.5, function () { post("sys", "New chat with " + who); });
      sg.inject.unshift("open");
      ex.wait = 1.9;
    }
  }

  // a timer ran out
  function expire() {
    var k = ex.kind;
    if (k !== "voucher") judge(false);
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

  // It closed the chat on you: the chat starts again from hello
  function loop(why) {
    sg.hp = Math.min(100, sg.hp + HEAL.still);
    sg.ghost = Math.max(sg.ghost, sg.hp);
    sg.streak = 0;
    sg.finReady = false;
    sg.msgs = [];
    sg.scroll = 0;
    callout("Loop detected");
    sound("loop");
    mood("smug", 1);
    post("res", "Chat closed: battery -" + LOOPED + "%", { ok: false });
    post("sys", why || "Chat closed due to inactivity");
    post("sys", "New chat with " + (isDave() ? "Dave" : "Assistant"));
    sg.inject.unshift("open");
    if (drain(LOOPED)) return true;
    tell("batt", "Phone dies at 0%");
    ex.state = "done";
    ex.wait = 0.7;
    return false;
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
      // the unmasking, big, over everything: the moustache comes off, and
      // underneath, for a moment, it's Assistant
      run.daveBeaten = true;
      sg.unmask = 0.0001;
      script([
        [0.35, function () { sound("fall"); callout("Moustache: detached"); }],
        [1.5, function () { sound("loop"); }],
        [3.0, function () { post("bot", "Fine. Refund approved."); }],
        [3.6, function () { post("bot", "Thanks for chatting with Dave."); }],
        [4.1, function () { post("sys", "Dave left the chat"); }],
        [4.7, function () { endStage("full"); }]
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
      [2.6, function () {
        sg.phase = "chat";
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

  // 0%: the screen goes off, and that's the round
  function phoneDies() {
    sg.phase = "closed";
    if (ex) ex.state = "over";
    sg.fin = null;
    run.deadAt = sg.i;
    callout("Phone: dead");
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
    if (DEBUG) console.log("stage " + (sg.i + 1) + ": " + outcome + " in " + sg.chatT.toFixed(1) + "s, bonus " + bonus + ", battery " + Math.round(run.battery));
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
      { label: "Battery", value: Math.round(run.battery) + "%" }
    ];
    if (bonus) stats.push({ label: "Quick", value: "+" + bonus });
    // the third interlude deals from the ways in you haven't picked
    var offers = run.plan[i + 1].offers;
    if (!offers) {
      offers = run.plan.lastDeal.filter(function (o) { return run.picked.indexOf(o.key) < 0; }).slice(0, 3);
      run.plan[i + 1].offers = offers;
    }
    shell.interlude({
      stamp: stamp,
      tilt: good ? -4 : 5,
      // the joke goes in the heading, because a short screen hides the line
      heading: (good ? L.AFTER.full : L.AFTER.voucher)[i],
      line: good ? "Refund approved for " + st.short + "." : "You took the voucher for " + st.short + ".",
      stats: stats,
      ask: "Next order. How are you going in?",
      choices: offers.map(function (o) { return { label: o.label, detail: o.detail }; }),
      delay: 900
    }).then(function (n) {
      var perk = offers[n] ? offers[n].key : null;
      run.perk = perk;
      if (perk) run.picked.push(perk);
      run.battery = Math.min(100, run.battery + BETWEEN + (perk === "charge" ? CHARGE : 0));
      run.stage = i + 1;
      restarting = false;
      startStage(i + 1);
      paintHud();
      measureHud();
      shell.next();
    });
  }

  function endRound() {
    var fulls = run.results.filter(function (r) { return r.outcome === "full"; }).length;
    var dead = run.deadAt != null;
    if (!dead) run.score += Math.round(run.battery) * BATT_SCORE;
    var R = L.RESULTS;
    var place, line, heading = "Refunded " + money(run.refund) + " of " + money(TOTAL) + ".";
    if (dead) {
      place = run.deadAt <= 1 ? 4 : 3;
      heading = "Your phone died.";
      line = place === 4 ? R.deadEarly[run.refund > 0 ? 1 : 0] : R.deadLate;
    } else if (fulls === 4 && run.score >= APPROVED) {
      place = 1; line = R.approved[run.score % 2];
    } else if (fulls === 4) {
      place = 2; line = R.slow;
    } else if (fulls >= 2) {
      place = 2; line = R.most;
    } else {
      place = 3; heading = "Refunded " + money(run.refund) + ", mostly in vouchers."; line = R.vouchers;
    }
    if (DEBUG) console.log("round: place " + place + ", score " + run.score + ", refund " + money(run.refund) + ", time " + mmss(run.time) + ", battery " + Math.round(run.battery) + (dead ? ", died at " + (run.deadAt + 1) : ""));
    var rec = shell.record(run.score);
    var stats = [
      { label: "Refunded", value: money(run.refund) + " of " + money(TOTAL) },
      { label: "Time", value: mmss(run.time) },
      { label: "Battery", value: Math.round(run.battery) + "%" },
      { label: "Score", value: run.score.toLocaleString("en-GB") },
      { label: rec.isNew ? (shell.daily ? "New best today" : "New best") : (shell.daily ? "Best today" : "Best"),
        value: (rec.best || 0).toLocaleString("en-GB"), highlight: rec.isNew }
    ];
    if (shell.daily) stats.unshift({ label: "Run", value: shell.today });
    var share = dead
      ? "my phone died on " + L.STAGES[run.deadAt].short + ", " + money(run.refund) + " refunded"
      : money(run.refund) + " of " + money(TOTAL) + " refunded in " + mmss(run.time) + ", " + Math.round(run.battery) + "% battery left" + (run.daveBeaten ? ", Dave unmasked" : "");
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
    if (sg.closing > 0) sg.closing = Math.min(1.6, sg.closing + dt / 0.9);
    if (sg.glitch > 0) sg.glitch -= dt;

    if (sg.phase === "track") {
      sg.trackT += dt;
      if (sg.trackT >= TRACK_LEN) beginChat();
      return;
    }
    if (sg.phase === "chat" || sg.phase === "trans") sg.chatT += dt;
    if (sg.phase === "chat" || sg.phase === "trans") run.time += dt;
    if (sg.fin) sg.fin.t += dt;
    if (sg.unmask > 0) sg.unmask += dt;
    // the battery runs down while you're in the chat
    if (sg.phase === "chat" && drain(DRAIN * (run.perk === "lowpower" ? 0.5 : 1) * dt, true)) return;
    // the bar catches up
    if (sg.ghostT > 0) sg.ghostT -= dt;
    else sg.ghost = Math.max(sg.hp, sg.ghost - dt * 60);
    sg.hpShown += (sg.hp - sg.hpShown) * Math.min(1, dt * 14);
    if (sg.boss === "dave") sg.tache = clamp((60 - sg.hp) / 60, 0, 1);
    if (sg.phase === "won" && isDave()) sg.tacheOff = clamp((sg.unmask - 0.3) / 0.9, 0, 1);

    if (sg.phase !== "chat" || !ex) return;
    if (ex.state === "wait") {
      ex.wait -= dt;
      if (ex.wait <= 0) {
        ex.state = "typing";
        var tl = isDave() ? DAVE_TYPING : TYPING[sg.i];
        ex.type = tl + Math.min(0.25, ex.bot.length * 0.006) + (run.perk === "lowpower" ? 0.35 : 0);
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
      if (ex.shuffleAt > 0 && !ex.shuffled && ex.t >= ex.shuffleAt + WOBBLE) {
        ex.shuffled = true;
        var slots = ex.chips.map(function (c) { return c.slot; });
        var rot = slots.slice(1).concat(slots[0]);
        if (ex.chips.length === 4 && ex.t % 1 < 0.5) rot = [slots[3], slots[2], slots[1], slots[0]];
        ex.chips.forEach(function (c, i) { c.from = c.slot; c.slot = rot[i]; c.swap = 0; });
        sound("shuffle");
        readOut("The replies have moved.");
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
  // The tracking screen says any key skips it, so any key does, not only the
  // game's own (pause, sound, Tab, and Enter or Space on a focused button keep their jobs)
  document.addEventListener("keydown", function (e) {
    if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
    if (!shell || shell.state() !== "playing" || !sg || sg.phase !== "track") return;
    if (e.code === "KeyP" || e.code === "KeyM" || /^(Escape|Tab|Shift|Control|Alt|Meta|CapsLock)$/.test(e.key)) return;
    var t = e.target;
    if ((e.key === "Enter" || e.key === " ") && t && t.closest && t.closest("button, a")) return;
    inputMode = "keys";
    if (sg.trackT > 0.4) beginChat();
  });
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
      // reading the line and the replies takes a moment
      if (ex.kind !== "yesyes" && ex.kind !== "survey" && ex.kind !== "voucher") {
        var chars = ex.bot.length + ex.chips.reduce(function (n, c) { return n + c.text.length; }, 0);
        react += chars * (0.008 + (1 - SKILL) * 0.012);
      }
      var target = null;
      var honest = ex.chips.filter(function (c) { return c.honest; });
      var fin = ex.chips.filter(function (c) { return c.kind === "fin"; })[0];
      var bad = ex.chips.filter(function (c) { return !c.honest; });
      if (CLIP && ex.kind === "yesyes" && !run.clipSlips.yes) { run.clipSlips.yes = true; slip = true; react = 0.6; }
      if (ex.kind === "voucher") {
        target = run.battery < 15 && !CLIP ? bad[0] : honest[0];
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
    var wide = !CLIP && W >= H * 1.15 && W >= 560;
    var pad = W < 420 ? 8 : 12;
    var chipH = touch ? 56 : clamp(Math.round(H * 0.075), 42, 56);
    if (!touch && H < 420) chipH = 40;
    if (CLIP) chipH = clamp(Math.round(H * 0.09), 44, 60);
    var gap = W < 420 ? 6 : 8;
    var trayH = chipH * 2 + gap + 18;
    Lay.wide = wide;
    Lay.pad = pad;
    if (wide) {
      // the bot gets a column of its own, big, with its bar under it
      var bw = Math.round(W * 0.38);
      Lay.boss = { x: 0, y: hudB, w: bw, h: H - hudB };
      Lay.col = { x: bw + pad, y: hudB, w: W - bw - pad * 2, h: H - hudB - pad };
      var ms = Math.min(bw * 0.84, (H - hudB) * 0.58);
      Lay.mascot = { x: bw / 2, y: hudB + (H - hudB) * 0.04 + ms * 0.5, s: ms };
      Lay.name = { x: bw / 2, y: Lay.mascot.y + ms * 0.6 + 22, align: "center" };
      Lay.bar = { x: Math.round(bw * 0.1), y: Lay.name.y + 36, w: Math.round(bw * 0.8), h: 18 };
      Lay.head = null;
    } else {
      // a phone held upright, and the clip: the bot big across the top
      var headH = CLIP ? Math.round(H * 0.26) : clamp(Math.round(H * 0.22), H < 480 ? 74 : 96, 190);
      Lay.head = { x: 0, y: hudB, w: W, h: headH };
      var hs = Math.min(headH - 4, W * 0.42);
      Lay.mascot = { x: pad + hs * 0.55, y: hudB + headH * 0.5 + 2, s: hs };
      var bx = pad + hs * 1.12 + 10;
      Lay.name = { x: bx, y: hudB + headH * 0.36 + 4, align: "left" };
      Lay.bar = { x: bx, y: hudB + headH * 0.6, w: W - bx - pad, h: clamp(Math.round(headH * 0.12), 12, 20) };
      Lay.col = { x: pad, y: hudB + headH, w: W - pad * 2, h: H - hudB - headH - pad };
      Lay.boss = null;
    }
    Lay.tray = { x: Lay.col.x, y: H - pad - trayH, w: Lay.col.w, h: trayH, chipH: chipH, gap: gap };
    Lay.fs = CLIP ? clamp(Math.round(Lay.col.w * 0.045), 15, 20) : clamp(Math.round(Lay.col.w * 0.042), 14, 19);
    Lay.chipFs = CLIP ? clamp(Math.round(Lay.tray.w * 0.045), 16, 20) : clamp(Math.round(Lay.tray.w * 0.038), 14, 18);
    // the order, pinned to the top of the chat the whole time
    var oh = Math.round(Lay.fs * (CLIP ? 1.7 : 2.1) + 8);
    Lay.order = { x: Lay.col.x, y: Lay.col.y + 6, w: Lay.col.w, h: oh };
    Lay.chat = { x: Lay.col.x, y: Lay.order.y + oh + 4, w: Lay.col.w, h: Lay.tray.y - (Lay.order.y + oh + 4) - 6 };
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
    if (Lay.wide) {
      // under the bar, or over the bot's head where there's no room under it (a landscape phone)
      var below = Math.round(Lay.bar.y + Lay.bar.h + 26);
      shell.placeCallouts({ top: H - below < 76 ? Math.round(Lay.boss.y + 4) : below, left: 0, right: W - Lay.boss.w });
    }
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
      // played with keys, it stops shrinking while its number still fits
      r.w = Math.max(inputMode === "keys" ? 70 : minW * 0.8, w0 * (1 - 0.55 * share));
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
    if (!calm) r.y += (1 - d) * 18;
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
    if (m.who === "res") return Math.round(Math.max(13, fs * 0.82) * 2);
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
    var stack = 0;
    for (var si = sg.msgs.length - 1; si >= 0 && stack < c.h; si--) stack += msgHeight(sg.msgs[si]) + gapY();
    if ((sg.phase === "chat" && ex && ex.state === "typing") || sg.fin) stack += fs * 1.6 + gapY();
    if (stack < c.h - 12) y = c.y + 6 + stack;
    // the bot typing, or (for a moment) a human
    var human = !!sg.fin;
    if (human || (sg.phase === "chat" && ex && ex.state === "typing")) {
      var tw = fs * 3.4, th = fs * 1.6;
      y -= th;
      bubble(c.x + 8, y, tw, th, human ? T.accent : T.paper, false);
      if (human) {
        var label = isDave() ? L.SPECIAL.fin.daveTyping : L.SPECIAL.fin.typing;
        A.text(ctx, label, c.x + 8 + tw + 10, y + th * 0.68, Math.max(12, fs * 0.8), T.accent, "left");
      }
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
    ctx.restore();
  }

  // the order, pinned at the top of the chat: its number, what it was, what it cost
  function drawOrder() {
    var o = Lay.order, fs = Lay.fs;
    A.rr(ctx, o.x, o.y, o.w, o.h, 6);
    A.ink(ctx, T.paper, 2.5);
    ctx.fillStyle = T.accent;
    ctx.fillRect(o.x + 1.5, o.y + 1.5, 8, o.h - 3);
    var big = Math.round(fs * 1.1);
    var no = "Order " + sg.p.no;
    A.text(ctx, no, o.x + 18, o.y + o.h / 2 + big * 0.36, big, T.ink, "left");
    ctx.font = A.font(big);
    var lw = ctx.measureText(no.toUpperCase()).width;
    var small = Math.max(12, Math.round(fs * 0.78));
    var room = o.w - lw - 44;
    var item = sg.st.order + ", " + money(sg.st.value);
    ctx.font = A.font(small);
    if (ctx.measureText(item.toUpperCase()).width > room) item = money(sg.st.value);
    A.text(ctx, item, o.x + o.w - 12, o.y + o.h / 2 + small * 0.36, small, T.ink, "right");
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
    if (m.who === "res") {
      // what your reply did: a green pill with a tick, or a red one with a cross
      var rs = Math.max(13, fs * 0.82);
      ctx.font = A.font(rs);
      var rw = ctx.measureText(m.text.toUpperCase()).width + rs * 2.6, rh = h - 4;
      var rx = c.x + c.w - rw - 8;
      ctx.globalAlpha = pop;
      A.rr(ctx, rx, y + 1, rw, rh, rh / 2);
      ctx.fillStyle = m.ok ? T.right : T.red;
      ctx.fill();
      var rc = m.ok ? T.ink : T.paper;
      mark(m.ok, rx + rs * 0.95, y + 1 + rh / 2, rs * 0.32, rc);
      A.text(ctx, m.text, rx + rs * 1.7, y + 1 + rh / 2 + rs * 0.36, rs, rc, "left");
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
      // once you've picked, the others go (quickly), and yours follows
      if (ex.state === "done" && c !== ex.picked) {
        if (calm || ex.wait < 0.3 || clock - (ex.doneAt || 0) > 0.22) return;
      }
      if (ex.state === "done" && c === ex.picked && clock - (ex.doneAt || 0) > 0.6) return;
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
    var judged = c.verdict != null && ex.picked === c;
    A.rr(ctx, r.x, r.y, r.w, r.h, rad);
    A.ink(ctx, judged ? (c.verdict ? T.right : T.red) : fin ? T.accent : T.paper, 2.5);
    var ink = judged && !c.verdict ? T.paper : T.ink;
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
      A.text(ctx, l, cx, ly, fs, ink, "center");
    });
    if (judged) mark(c.verdict, r.x + r.w - Math.min(22, r.h * 0.4), r.y + r.h / 2, Math.min(9, r.h * 0.17), ink);
    ctx.restore();
  }

  // a tick or a cross, so the colour is never the only signal
  function mark(ok, x, y, s, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(2.5, s * 0.45);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    if (ok) { ctx.moveTo(x - s, y); ctx.lineTo(x - s * 0.3, y + s * 0.75); ctx.lineTo(x + s, y - s * 0.75); }
    else { ctx.moveTo(x - s * 0.8, y - s * 0.8); ctx.lineTo(x + s * 0.8, y + s * 0.8); ctx.moveTo(x + s * 0.8, y - s * 0.8); ctx.lineTo(x - s * 0.8, y + s * 0.8); }
    ctx.stroke();
    ctx.restore();
  }

  // the edge of the screen flashes with the last reply's result
  function drawVerdict() {
    if (!verdict) return;
    var a = clock - verdict.born, len = 0.5;
    if (a > len) { verdict = null; return; }
    var k = calm ? 1 : 1 - a / len;
    ctx.save();
    ctx.globalAlpha = 0.85 * k;
    ctx.strokeStyle = verdict.ok ? T.right : T.red;
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, W - 10, H - 10);
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
      tache: sg.tache, off: sg.tacheOff, glitch: sg.glitch > 0 && Math.floor(clock * 30) % 2 === 0,
      // it leans in to type, holds a mitten out at the replies, and its
      // microphone swells while it heals
      lean: calm ? 0 : (sg.leanS = ease2(sg.leanS, ex && ex.state === "typing" && sg.phase === "chat" ? 1 : 0)),
      present: !Lay.wide ? 0 : calm ? (ex && ex.state === "open" ? 1 : 0) : (sg.presentS = ease2(sg.presentS, ex && ex.state === "open" && sg.phase === "chat" && ex.kind !== "survey" ? 1 : 0)),
      mic: (mk === "heal" || (ex && ex.state === "open" && ex.kind === "frustrated")) ? (calm ? 1 : 0.6 + 0.4 * Math.abs(Math.sin(clock * 8))) : 0
    };
    if (Lay.wide) {
      // a periwinkle halftone burst behind the boss
      ctx.save();
      ctx.beginPath();
      ctx.arc(m.x, m.y, Math.min(m.s * 0.68, Lay.boss.w * 0.5 - 4), 0, Math.PI * 2);
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
    // while "a human" types, the bot steps back
    if (sg.fin) ctx.globalAlpha = 0.25;
    if (isDave()) A.dave(ctx, m.x, m.y, m.s * sc, pose);
    else A.assistant(ctx, m.x, m.y, m.s * sc, pose);
    ctx.restore();
    sg.hurt = Math.max(0, sg.hurt - 0.05);

    // name, status, the bar and the streak
    var nm = sg.fin ? "A human" : isDave() ? "Dave" : "Assistant";
    var nfs = Lay.wide ? clamp(m.s * 0.15, 20, 30) : clamp(Lay.head.h * 0.22, 16, 24);
    var nx = Lay.name.x, ny = Lay.name.y;
    ctx.font = A.font(nfs);
    var nw = ctx.measureText(nm.toUpperCase()).width;
    var statusFs = Math.max(12, nfs * 0.55);
    var status = sg.fin ? "Typing" : isDave() ? "A human" : "Online";
    ctx.font = A.font(statusFs);
    var sw = ctx.measureText(status.toUpperCase()).width + statusFs * 1.4;
    var startX = Lay.name.align === "center" ? nx - (nw + 14 + sw) / 2 : nx;
    A.text(ctx, nm, startX, ny, nfs, T.paper, "left");
    ctx.beginPath();
    ctx.arc(startX + nw + 14 + statusFs * 0.35, ny - statusFs * 0.38, statusFs * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = T.accent;
    ctx.fill();
    A.text(ctx, status, startX + nw + 14 + statusFs * 0.9, ny, statusFs, T.smoke, "left");
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
      if (!Lay.wide) cx = b.x + pr + 2 + i * pr * 2.6;
      var cy = b.y + b.h + pr + 7;
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
      if (f.where === "bar") { x = b.x + b.w * clamp(sg.hp / 100, 0, 1) + 6; y = b.y + b.h + 20; color = T.right; }
      else if (f.where === "heal") { x = b.x + b.w * clamp(sg.hp / 100, 0, 1); y = b.y + b.h + 20; color = T.red; }
      else if (f.where === "batt") { x = 96; y = hudB + 14; size = 16; color = T.red; }
      else { x = Lay.chat.x + Lay.chat.w - 40; y = Lay.chat.y + Lay.chat.h - 30; size = 14; color = T.accent; }
      // clear of the streak pips under the middle of the bar on a wide screen
      if ((f.where === "bar" || f.where === "heal") && Math.abs(x - (Lay.wide ? b.x + b.w / 2 : b.x + 20)) < Math.max(4, b.h * 0.3) * 4 + 30) y += 30;
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
    if (tag || !ex || ex.state !== "open" || sg.phase !== "chat") return;
    var target = null, word = null;
    var keys = inputMode === "keys" || inputMode === "pad";
    var fin = ex.chips.filter(function (c) { return c.kind === "fin" && !c.gone; })[0];
    var honest = ex.chips.filter(function (c) { return c.honest && !c.gone; })[0];
    // on keys the word keeps its rule and adds the key: "Argue back: 3"
    function say(c, w) { return keys ? w + ": " + (c.slot + 1) : w; }
    var teach = { number: "Same as the top", frustrated: "Before it heals", voucher: "Say no", still: "Say so", shrink: "Quick" };
    if (ex.kind === "open" && !run.taught.open && honest) { target = honest; word = say(honest, "Complain"); }
    else if (ex.kind === "std" && !run.taught.basic && honest) { target = honest; word = say(honest, "Argue back"); }
    else if (fin && !run.taught.fin) { target = fin; word = say(fin, "Big one"); }
    else if (ex.kind === "yesyes" && !run.taught.no && honest) { target = honest; word = say(honest, "Not yes"); }
    else if (ex.kind === "survey" && !run.taught.survey && honest) { target = honest; word = keys ? "This: 6" : "This"; }
    else if (teach[ex.kind] && !run.taught[ex.kind] && honest) { target = honest; word = say(honest, teach[ex.kind]); }
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
    // the word sits on the ring's top edge, so it never covers the chat
    var px = 12;
    ctx.font = A.font(px);
    var tw = ctx.measureText(word.toUpperCase()).width + 14, th = px + 9;
    var tx = clamp(r.x + r.w / 2 - tw / 2, 4, W - tw - 4);
    var ty = r.y - 5 - th / 2 + (calm ? 0 : Math.sin(clock * 6) * 1.5);
    A.rr(ctx, tx, ty, tw, th, 4);
    A.ink(ctx, T.ink, 2);
    A.rr(ctx, tx, ty, tw, th, 4);
    ctx.strokeStyle = T.paper;
    ctx.lineWidth = 2;
    ctx.stroke();
    A.text(ctx, word, tx + tw / 2, ty + th / 2 + px * 0.36, px, T.paper, "center");
  }

  // The bar and the battery decide the round, so each gets the pointer once a
  // visit, the first time it moves: a dashed ring round it and a word just
  // under it (the bar's label is over it). One at a time: it goes when the
  // next replies come up, and the replies' ring waits until then.
  // (drawArrow waits on tag from when it's set, so nothing flickers in between.)
  var told = {}, tag = null, TAG_LEN = 2.2;
  function tell(what, word) {
    if (told[what] || CLIP) return;
    told[what] = true;
    // after the -17% or -12% has had its moment, so the two don't share the spot
    tag = { what: what, word: word, born: clock + 0.7 };
  }
  function drawTag() {
    if (!tag) return;
    var st = shell.state();
    var age = clock - tag.born;
    if (age < 0) return;
    var next = ex && ex.state === "open" && ex.t > 0.15 && age > 1.2;
    if (age > TAG_LEN || next || (st !== "playing" && st !== "paused") || sg.phase === "track") { tag = null; return; }
    var r;
    if (tag.what === "bar") r = { x: Lay.bar.x, y: Lay.bar.y, w: Lay.bar.w, h: Lay.bar.h };
    else {
      var box = root.getBoundingClientRect(), e = hudEls.wrap.getBoundingClientRect();
      r = { x: e.left - box.left, y: e.top - box.top, w: e.width, h: e.height };
    }
    var p = 6;
    A.rr(ctx, r.x - p, r.y - p, r.w + p * 2, r.h + p * 2, 8);
    ctx.strokeStyle = T.paper;
    ctx.lineWidth = 3;
    ctx.setLineDash([7, 5]);
    ctx.lineDashOffset = calm ? 0 : -clock * 20;
    ctx.stroke();
    ctx.setLineDash([]);
    var px = 12;
    ctx.font = A.font(px);
    var tw = ctx.measureText(tag.word.toUpperCase()).width + 14, th = px + 9;
    // under the end of the bar that's clear of the streak pips; under the start of the battery
    var tx = tag.what === "bar" ? r.x + r.w + p - tw - 8 : r.x - p + 6;
    tx = clamp(tx, 4, W - tw - 4);
    var ty = r.y + r.h + p + 3 + (calm ? 0 : Math.sin(clock * 6) * 1.5);
    A.rr(ctx, tx, ty, tw, th, 4);
    A.ink(ctx, T.ink, 2);
    A.rr(ctx, tx, ty, tw, th, 4);
    ctx.strokeStyle = T.paper;
    ctx.lineWidth = 2;
    ctx.stroke();
    A.text(ctx, tag.word, tx + tw / 2, ty + th / 2 + px * 0.36, px, T.paper, "center");
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
    // the rider, facing the way he's going
    var was = riderAt(path, p - 0.03);
    if (Math.abs(pos[0] - was[0]) > 0.05) sg.riderDir = pos[0] > was[0] ? 1 : -1;
    A.rider(ctx, m.x(pos[0]), m.y(pos[1]) + m.road * 0.4, clamp(m.s * 17, 60, 140), clock, calm, sg.riderDir || -1);

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
    if (!CLIP) {
      var skip = inputMode === "keys" ? "Any key skips" : inputMode === "touch" ? "Tap to skip" : "Click to skip";
      A.text(ctx, skip, cx + cw - 12, cy + ch - 9, 12, T.ink, "right");
    }
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
    // the tracking screen starts under the last second of the countdown, so
    // the chat isn't far behind Go but the notice still has time to be read
    if (st === "countdown" && sg && sg.phase === "track") sg.trackT = Math.min(sg.trackT + dt, 1);
    if (shell.state() === "countdown" && sg && !sg.briefed) {
      sg.briefed = true;
      // what's new this order, said once, before it starts (not while filming)
      if (!CLIP) brief({ title: (sg.i + 1) + ". " + sg.st.name, text: sg.st.brief, ms: sg.phase === "track" ? 7000 : 3400 });
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
    drawOrder();
    drawTray();
    drawTag();
    drawArrow();
    drawFloaters();
    drawUnmask();
    drawVerdict();
    // the scroll settles
    sg.scroll = calm ? 0 : sg.scroll * Math.exp(-dt * 16);
    if (sg.closing > 0) {
      // the app closing: the screen folds to a line
      var k = ease(sg.closing);
      ctx.fillStyle = T.ink;
      var cy = Lay.col.y + Lay.col.h / 2;
      ctx.fillRect(0, Lay.col.y, W, (cy - Lay.col.y) * k);
      ctx.fillRect(0, cy + (Lay.col.y + Lay.col.h - cy) * (1 - k), W, (Lay.col.y + Lay.col.h - cy) * k + 2);
      // then the line shrinks to nothing, so it's gone before the results
      var lw = W * 0.6 * (1 - clamp((sg.closing - 1) / 0.5, 0, 1));
      if (k > 0.9 && lw > 1) { ctx.fillStyle = T.paper; ctx.fillRect(W / 2 - lw / 2, cy - 1, lw, 2); }
    }
    // between orders and on the results the chat sits back, so the panel over it reads
    if (st === "interlude" || st === "results") {
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.fillStyle = "rgba(0,0,0,0.72)";
      ctx.fillRect(0, 0, W, H);
    }
  }

  // Dave, beaten: big, over everything. The moustache comes off, and under it,
  // for a moment, it's Assistant.
  function drawUnmask() {
    var u = sg.unmask;
    if (!(u > 0)) return;
    var a = clamp(u / 0.3, 0, 1) * clamp((3.0 - u) / 0.45, 0, 1);
    if (a <= 0) return;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(0, 0, W, H);
    var s = Math.min(W * 0.8, (H - hudB) * 0.66);
    var cx = W / 2, cy = hudB + (H - hudB) * 0.5;
    ctx.beginPath();
    ctx.arc(cx, cy, s * 0.66, 0, Math.PI * 2);
    ctx.fillStyle = A.ht(ctx, T.accent, 12, 3.2);
    ctx.fill();
    var glitch = u > 1.5 && (calm ? u > 2.0 : (u > 2.2 || Math.floor(u * 24) % 2 === 0));
    A.dave(ctx, cx, cy, s, {
      t: clock, mood: u < 1.4 ? "hit" : "smug", calm: calm, hurt: u < 0.6 ? 1 : 0,
      look: { x: 0, y: 0.2 }, tache: 1, off: sg.tacheOff, glitch: glitch
    });
    ctx.restore();
  }

  function resize(w, h, dpr) {
    W = w; H = h; DPR = dpr;
    ctx = (shell ? shell.canvas : root.querySelector("canvas")).getContext("2d");
    wrapCache = {};
    if (shell) { layout(); measureHud(); }
  }

  // ---------------------------------------------------------------------------
  // HUD: the order and your phone's battery top left, the refund top right.
  // No clock in play: the time only counts for the bonus, and the results say it.
  // ---------------------------------------------------------------------------
  function buildHud() {
    shell.hud.innerHTML =
      '<div class="kit-hud-tl">' +
        '<p class="kit-stat"><small>Order</small><span data-stage>1</span>/4</p>' +
        '<p class="kit-stat sth-battery"><small>Battery</small><span class="sth-cell" aria-hidden="true"><span class="sth-fill" data-fill></span></span><span data-batt>100%</span></p>' +
      '</div>' +
      '<div class="kit-hud-tr">' +
        '<p class="kit-stat kit-stat-big"><span data-refund>£0.00</span><small>refunded</small></p>' +
      '</div>';
    hudEls = {
      stage: shell.hud.querySelector("[data-stage]"),
      fill: shell.hud.querySelector("[data-fill]"),
      batt: shell.hud.querySelector("[data-batt]"),
      wrap: shell.hud.querySelector(".sth-battery"),
      refund: shell.hud.querySelector("[data-refund]")
    };
  }

  function paintHud() {
    if (!hudEls || !run) return;
    var b = Math.ceil(run.battery);
    var v = { stage: String(run.stage + 1), refund: money(run.refund), batt: String(b) };
    if (v.stage !== hudWas.stage) hudEls.stage.textContent = v.stage;
    if (v.refund !== hudWas.refund) hudEls.refund.textContent = v.refund;
    if (v.batt !== hudWas.batt) {
      hudEls.batt.textContent = b + "%";
      hudEls.fill.style.width = b + "%";
      hudEls.wrap.classList.toggle("is-low", b <= 20);
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
      keys: "Pick the reply that argues back: 1 to 4, or click. P to pause.",
      touch: "Tap the reply that argues back. Get a human."
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

  // ?debug: what's on screen, for test players (which reply is true, and
  // where each one is, in page pixels)
  if (DEBUG) {
    window.__speakToAHuman = {
      state: function () { return shell.state(); },
      phase: function () { return sg ? sg.phase : null; },
      boss: function () { return sg ? sg.boss : null; },
      battery: function () { return run ? run.battery : null; },
      open: function () {
        if (!ex || ex.state !== "open" || !sg || sg.phase !== "chat") return null;
        var box = root.getBoundingClientRect();
        return {
          kind: ex.kind, t: ex.t, focus: focus, bot: ex.bot,
          chips: ex.chips.filter(function (c) { return !c.gone; }).map(function (c) {
            var r = chipRect(c);
            return { slot: c.slot, honest: !!c.honest, kind: c.kind || "", text: c.text,
              x: box.left + r.x, y: box.top + r.y, w: r.w, h: r.h };
          })
        };
      }
    };
  }
})();
