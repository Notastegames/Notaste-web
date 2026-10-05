// Hold Music: a phone menu, then hold music. A memory game and a rhythm game.
//
// THE JOKE. Customer service built to make you give up. You phone A Company
// about your broadband. The menu reads out options in a cheerful voice; your
// problem is on a sticky note; you press the number that matches. Then
// you're on hold, and you tap along to the hold music to stay on the line.
// Everyone you get through to is lovely and on your side, and puts you
// through to someone else. The system is the joke, never the people in it.
//
// THE CALLS (stages). Four of them: Billing, Faults, Complaints, then
// Cancellations, which picks up, starts to say its name and goes dead, and
// the menu starts again from the top. Each call: it rings (the first one you
// dial), the menu, hold, then an agent who puts you through to the next.
// 1. Billing. One question, four options. Press your option's number as
//    soon as you've heard it. On hold, tap every beat; this call can't cut
//    you off (the signal stops at one bar and says so).
// 2. Faults. Two questions, and the keypad stays locked until every option
//    has been read: the memory test. Announcements on hold duck the music;
//    the beat carries on under them. Lose all your signal and you're cut off.
// 3. Complaints. Two questions, five options, and "our options have
//    changed": the numbers come in any order. Halfway through the hold the
//    fast version starts, in a new key, with extra notes and gaps.
// 4. Cancellations. Three questions, the options the other way round ("For
//    a boat, press 7"), and the fast version is faster.
//
// THE MENU. Each question is two beats, each option two beats, then "Please
// choose now", a bar to choose, "Here they are again", the options again
// (worth half), "Please choose now", another bar, and "Sorry, I didn't catch
// that": dropped, and redialled. A wrong number transfers you to a useless
// department (Lanyards, The car park) and back to the same question.
// Pressing before you're allowed just buzzes; 0, * and # are never options.
// Spoken numbers are their keypad tones.
//
// HOLD. A count-in bar, then you're number N in the queue: one bar off the
// queue for every bar you stay on the line. Notes run along the beat pad
// into a ring; tap as each one gets there. Each note owns the taps near it
// (up to 0.4 of a beat, never past halfway to its neighbours): the first
// decides it, a hit in the window or a miss (early or late) outside it,
// and any more are ignored, so a late tap is one mistake, not two. The
// signal has four bars: a missed note costs one, a stray tap (in no note's
// zone) costs one, once per gap between notes, and two hits in a row win
// one back. Lose all four and you're cut off: a dial tone, a redial, and two
// more places in the queue.
//
// PATIENCE. Three to start, five at most. A wrong number, a dropped call or
// a cut-off each cost one. Run out and you hang up, and the round ends.
//
// BETWEEN CALLS (shell.interlude) pick one of three ways to get ready, each
// with a cost: Put the kettle on (one more patience, a longer queue), Put it
// on speaker (wider timing, half the beat points), Press 0 a lot (skip a
// question, faster music), Say you're a new customer (half the queue, one
// less patience), Find a pen (your number on the note, half the menu points),
// Ask for a callback (nothing).
//
// TIMING. line.js keeps a transport clock that follows the audio context
// one for one, schedules every sound 0.15s ahead, and works out heard time
// (the transport minus the output latency). Notes, lamps and bubbles are
// drawn at heard time, and taps are judged at heard time from each event's
// own timestamp, against a window centred 15ms after the note: perfect
// within 60ms, close within 140ms (or 0.3 of a beat, if that's shorter).
// With ?speed above 1, or no sound running, the transport runs on the frame
// clock, so the automatic play-through works at eight times speed.
//
// SCORING. A question right first time: 100 (50 on the repeat, or after a
// transfer or a drop). Each hold is worth 600 shared among the notes its
// queue will play (close notes half), however long the queue, so a longer
// queue can't buy points; a hold with no misses, strays or cut-offs is a
// clean line, worth 100 more. Every call put through: 200. Finish and every
// patience left is worth 100. The most a run can score is about 4,700, a
// little more with the kettle on.
//
// THE LADDER (DESIGN.md, section 6). Finish all four calls: Approved at
// 4,300 or more, Pending review at 3,400 or more, Not approved below that.
// Hang up on Complaints or Cancellations: Not approved. Hang up any sooner:
// Rejected. Tuned with test players: good ones are Approved about one run
// in four, average ones mostly Pending review, beginners Not approved.
//
// TODAY'S RUN gives everyone the same problem, the same menus (the same
// options in the same order with the same numbers), the same announcements
// and the same choices between calls, all dealt from shell.random at the
// start (planRun). Which useless department a wrong number reaches is left
// to chance.
//
// Built on the shared kit (/games/kit/kit.js). line.js is the sound and the
// clock; draw.js draws the people and the phone.
(function () {
  "use strict";

  var N = window.Notaste;
  var Line = window.HoldLine;
  var D = window.HoldDraw;
  var root = document.getElementById("game-root");
  if (!N || !Line || !D || !root) return;

  var params = new URLSearchParams(window.location.search);
  var DEBUG = params.has("debug");
  var AUTOPILOT = N.flags.autopilot;
  var FIRST = DEBUG ? Math.max(0, Math.min(3, (parseInt(params.get("call"), 10) || 1) - 1)) : 0;

  // ---------------------------------------------------------------------------
  // Tuning
  // ---------------------------------------------------------------------------
  var CENTRE = 0.015;          // taps are judged against the note plus this
  var PERFECT = 0.06;          // either side of it: perfect
  var CLOSE = 0.14;            // close: this, or...
  var CLOSE_BEATS = 0.3;       // ...this much of a beat, if that's shorter
  var SPEAKER = 0.04;          // on speaker, both windows are this much wider
  var PATIENCE = 3, PATIENCE_MAX = 5;
  var SIGNAL = 4;              // bars of signal
  var RESTORE = 2;             // hits in a row to win a bar back
  var CUT_QUEUE = 2;           // places added to the queue when you're cut off
  var AHEAD = 0.2;             // the next part of a call is queued this soon
  var PTS = { menu: 100, retry: 50, hold: 600, clean: 100, call: 200, patience: 100 };
  var APPROVED = 4300, PENDING = 3400;
  var DIAL = "08004655";       // the number you dial (it's not a real one)

  // ---------------------------------------------------------------------------
  // Your problem, and the menu's questions about it
  // ---------------------------------------------------------------------------
  var CATS = {
    topic: { q: "What's your call about.", line: function (v) { return v.note; }, values: [
      { note: "Broadband", say: "broadband" }, { note: "Landline", say: "the landline" },
      { note: "Telly box", say: "a telly box" }, { note: "Smart meter", say: "a smart meter" },
      { note: "Mobile", say: "a mobile" }, { note: "Fax machine", say: "a fax machine" }] },
    place: { q: "Is it home, or business.", line: function (v) { return "Account: " + v.note; }, values: [
      { note: "Home", say: "your home" }, { note: "Business", say: "a business" }, { note: "Boat", say: "a boat" },
      { note: "Shed", say: "a shed" }, { note: "Caravan", say: "a caravan" }, { note: "Lighthouse", say: "a lighthouse" }] },
    light: { q: "What colour is the light.", line: function (v) { return "Light: " + v.note; }, iff: true, values: [
      { note: "Red", say: "red" }, { note: "Green", say: "green" }, { note: "Orange", say: "orange" },
      { note: "Blue", say: "blue" }, { note: "Flashing", say: "flashing" }, { note: "Off", say: "off" }] },
    since: { q: "When did it stop working.", line: function (v) { return "Since " + v.note; }, values: [
      { note: "Monday", say: "Monday" }, { note: "Tuesday", say: "Tuesday" }, { note: "Wednesday", say: "Wednesday" },
      { note: "Thursday", say: "Thursday" }, { note: "Friday", say: "Friday" }, { note: "Saturday", say: "Saturday" },
      { note: "Sunday", say: "Sunday" }] },
    tried: { q: "Tried it off and on again.", line: function (v) { return "Tried: " + v.note; }, values: [
      { note: "Once", say: "once" }, { note: "Twice", say: "twice" }, { note: "Three times", say: "three times" },
      { note: "Never", say: "never" }, { note: "Lost count", say: "lost count" }] }
  };

  function optionText(cat, v, n, flip) {
    if (CATS[cat].iff) return flip ? "If it's " + v.say + ", press " + n + "." : "Press " + n + " if it's " + v.say + ".";
    return flip ? "For " + v.say + ", press " + n + "." : "Press " + n + " for " + v.say + ".";
  }

  // Tap patterns, in beats from the start of a bar
  var PATS = { q: [0, 1, 2, 3], a3: [0, 1, 2, 2.5, 3], a1: [0, 1, 1.5, 2, 3], a4: [0, 1, 2, 3, 3.5], r4: [0, 1, 2], r3: [0, 1, 3] };

  var CALLS = [
    { dept: "Billing", menuBpm: 96, hold: [92], key: [0, 0], fastAt: null, queue: 4, cats: ["topic"], opts: 4,
      lock: false, scatter: false, flip: false, vo: false,
      pats: { please: ["q", "q", "q", "q", "q", "q", "q", "q"] },
      welcome: "Thank you for calling A Company.",
      agent: { name: "Sam", look: "glasses", lines: ["Sam, Billing. Oh, that's a fault.", "I'll put you through to Faults."] },
      brief: "Find your problem on the note. When the menu reads it out, press its number. On hold, tap on the beat to keep your signal up.",
      done: "Sam was lovely. Sam couldn't help. Sam has put you through to Faults." },
    { dept: "Faults", menuBpm: 104, hold: [100], key: [0, 0], fastAt: null, queue: 5, cats: ["place", "light"], opts: 4,
      lock: true, scatter: false, flip: false, vo: true,
      pats: { please: ["q", "q", "q", "q", "q", "q", "q", "q"] },
      welcome: "Welcome back. We missed you.",
      agent: { name: "Jo", look: "bun", lines: ["Jo, Faults. I can see it from here.", "It has to be a complaint first."] },
      brief: "The keypad now stays locked until every option has been read, so remember your number. On hold, lose all your signal and you're cut off.",
      done: "Jo can see the fault from her desk. Jo is not allowed to touch it." },
    { dept: "Complaints", menuBpm: 112, hold: [104, 120], key: [0, 2], fastAt: 3, queue: 6, cats: ["since", "topic"], opts: 5,
      lock: true, scatter: true, flip: false, vo: true,
      pats: { please: ["q", "q", "q", "q", "q", "q", "q", "q"], fast: ["a3", "q", "r4", "a1", "q", "r4", "a3", "q"] },
      welcome: "Our options have changed.",
      agent: { name: "Dee", look: "perm", lines: ["Dee, Complaints. Honestly, I'd leave.", "I didn't say that. Cancellations next."] },
      brief: "Our options have changed: the numbers come in any order. Halfway through the hold the fast version starts, with extra notes and gaps.",
      done: "Dee agrees with you completely. Dee has been asked not to." },
    { dept: "Cancellations", menuBpm: 120, hold: [112, 132], key: [0, 3], fastAt: 3, queue: 6, cats: ["tried", "light", "place"], opts: 5,
      lock: true, scatter: true, flip: true, vo: true,
      pats: { please: ["q", "a3", "r4", "q", "a1", "q", "r4", "q"], fast: ["a1", "a4", "r3", "a3", "a1", "r4", "a3", "q"] },
      welcome: "Thanks for calling. Again.",
      agent: { name: "", look: "none", lines: ["Cancellations. Hello, my name is"] },
      brief: "The options come the other way round now: the thing first, then its number. The fast version is faster.",
      done: "" }
  ];

  var DEPTS = [
    { name: "Lanyards", line: "Lanyards. None left for you." },
    { name: "Restructuring", line: "Restructuring. Back in March." },
    { name: "Pens", line: "Pens. All our pens are in use." },
    { name: "The car park", line: "The car park. It's raining." },
    { name: "Brand refresh", line: "Brand Refresh. New font, same us." },
    { name: "Customer delight", line: "Customer Delight. We're closed." }
  ];

  var THANKS = ["Thank you.", "Lovely.", "Noted.", "Great choice."];

  // Announcements on hold, from the second call. Short, so they fit a bubble.
  var VO = [
    "Your call is important to us.",
    "We're busy. We're always busy.",
    "Our website can't help either.",
    "Calls are recorded. Nobody listens.",
    "Please don't hang up. Please.",
    "Thanks for your patience. All of it.",
    "Your call is still important. Ish.",
    "Holding is free. So is giving up."
  ];
  var VO_BARS = [1, 4];

  // What you say to the phone. Always about the phone.
  var YOU = {
    transfer: ["I pressed {n}, you melon.", "That was {n}. I pressed {n}.", "Not Lanyards. Never Lanyards."],
    drop: ["I was thinking.", "Hang on. Hang on."],
    cut: ["Hello. Hello.", "Don't you dare.", "No no no no."],
    hang: ["Right. That's it.", "I'm writing a letter."],
    dead: ["Hello. Hello.", "You absolute weapon."]
  };

  // Ways to get ready for the next call. Each helps and costs.
  var CHOICES = [
    { id: "kettle", label: "Put the kettle on", detail: "One more patience. The queue's two longer, because you were in the kitchen.",
      apply: function (m, r) { r.patience = Math.min(PATIENCE_MAX, r.patience + 1); m.queue += 2; m.kettle = true; } },
    { id: "speaker", label: "Put it on speaker", detail: "Easier to keep time: the beat is 40ms more forgiving. Beats score half.",
      apply: function (m) { m.speaker = true; } },
    { id: "zero", label: "Press 0 a lot", detail: "Skips the first question. The hold music is 8 beats a minute faster.",
      apply: function (m) { m.skip = true; m.bpm += 8; } },
    { id: "new", label: "Say you're a new customer", detail: "Sales pick up fast, so the queue is half as long. They try to sell you broadband: one less patience, though never your last.",
      apply: function (m, r) { m.half = true; r.patience = Math.max(1, r.patience - 1); } },
    { id: "pen", label: "Find a pen", detail: "You write your number on the note as it's read. The menu scores half.",
      apply: function (m) { m.pen = true; } },
    { id: "callback", label: "Ask for a callback", detail: "They'll call you back. They won't. Nothing changes.",
      apply: function () {} }
  ];

  var RANKS = [
    "You reached Cancellations, on the beat, and the line went dead. A Company considers this resolved.",
    "Four departments, one problem. It has been passed to the relevant team, which is Billing.",
    "You got all the way through, and all the way back to the start.",
    "You hung up. Your call was important to us. Briefly."
  ];

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  var shell = null, T = null, ctx = null;
  var W = 1, H = 1, DPR = 1, U = 1, WW = 100, WH = 100;
  var Lay = {};
  var plan = [], facts = null, run = null, st = null, mods = null, nextMods = null;
  var call = 0, ph = null, prevPh = null;
  var talks = [], floats = [], presses = [], keyFlash = {}, lcdFlash = null;
  var signal = SIGNAL, hitRun = 0, strayGap = -1;
  var react = { shout: 0, steam: 0, drum: 0, lift: 0, bob: 0, said: null, saidT: 0, sweatT: 0 };
  var shake = 0, clockMin = 540, clockT = 0, animT = 0;
  var learned = { beat: 0, menu: false }, briefed = -1;
  var hudEls = null, back = null, front = null, bot = null;
  var lastMode = "";

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function fmt(n) { return Math.round(n).toLocaleString("en-GB"); }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function shuffle(list, r) {
    for (var i = list.length - 1; i > 0; i--) {
      var j = Math.floor(r() * (i + 1)), t = list[i];
      list[i] = list[j]; list[j] = t;
    }
    return list;
  }
  function info() { return CALLS[call]; }
  function touching() { return root.classList.contains("kit-touching"); }
  function times(n) { return n === 0 ? "Never" : n === 1 ? "Once" : n === 2 ? "Twice" : n + " times"; }

  // ---------------------------------------------------------------------------
  // Today's run: everything that should be the same for everyone, dealt at
  // the start from the run's seed, one stream for each call
  // ---------------------------------------------------------------------------
  function planRun(random) {
    function seed() { return Math.floor(random() * 4294967296) | 0; }
    facts = {};
    Object.keys(CATS).forEach(function (k) {
      var vals = CATS[k].values;
      facts[k] = vals[Math.floor(random() * vals.length)];
    });
    plan = CALLS.map(function (c) {
      var r = N.seeded(seed());
      return {
        levels: c.cats.map(function (cat) {
          var answer = facts[cat];
          var others = shuffle(CATS[cat].values.filter(function (v) { return v !== answer; }), r).slice(0, c.opts - 1);
          var list = shuffle(others.concat([answer]), r);
          var nums = c.scatter ? shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], r).slice(0, c.opts) : list.map(function (v, i) { return i + 1; });
          return { cat: cat, options: list.map(function (v, i) { return { v: v, n: nums[i], right: v === answer }; }) };
        }),
        vo: shuffle(VO.slice(), r),
        offers: N.seeded(seed())
      };
    });
  }

  function freshMods() { return { queue: 0, speaker: false, skip: false, bpm: 0, half: false, pen: false, kettle: false }; }

  // ---------------------------------------------------------------------------
  // The round
  // ---------------------------------------------------------------------------
  function reset(sh) {
    shell = sh;
    T = sh.tokens;
    Line.reset();
    planRun(sh.random);
    run = { score: 0, patience: PATIENCE, cutoffs: 0, transfers: 0, drops: 0, hits: 0, perfects: 0, notes: 0,
            menuFirst: 0, menuLevels: 0, streak: 0, best: 0, calls: 0, hungUp: false, daily: sh.daily, taken: [] };
    nextMods = freshMods();
    learned = { beat: 0, menu: false };
    clockMin = 540;
    call = FIRST;
    startCall();
    if (!hudEls) buildHud();
    paintHud();
  }

  function startCall() {
    mods = nextMods;
    nextMods = freshMods();
    st = { transfers: 0, drops: 0, cutoffs: 0, hits: 0, notes: 0, menuFirst: 0, levels: 0, vo: 0,
           value: 0, hold: 0, clean: true };
    talks = []; floats = []; presses = [];
    ph = { kind: "start", t0: 0 };
    prevPh = null;
    signal = SIGNAL; hitRun = 0; strayGap = -1;
    react.shout = react.steam = 0;
    briefed = -1;
    lcdFlash = null;
  }

  // ---------------------------------------------------------------------------
  // The call, part by part. Every part has a start (t0) and, usually, an end
  // on the transport, and the next part is queued just before it ends, so
  // its sounds are scheduled in time. What's drawn follows heard time.
  // ---------------------------------------------------------------------------
  function go(kind, t, data) {
    prevPh = ph;
    ph = data || {};
    ph.kind = kind;
    ph.t0 = t;
    ENTER[kind](ph);
  }
  // the part being heard right now (the next one may already be queued)
  function vis() {
    var h = Line.heard();
    return prevPh && ph.t0 > h ? prevPh : ph;
  }

  // stop whatever's being said, and what was still to come
  function hush() {
    var h = Line.heard();
    Line.cancel("voice");
    talks = talks.filter(function (tk) { return tk.t <= h; });
    talks.forEach(function (tk) { if (tk.end > h) tk.end = h; });
  }
  function talk(t, end, who, text) {
    talks.push({ t: t, end: end, who: who, text: text });
    if (talks.length > 16) talks.shift();
  }
  function speak(t, span, who, text, group) {
    talk(t, t + span, who, text);
    return Line.say(t, text, who, span * 0.88, group || "voice");
  }
  // you say something to the phone
  function youSay(kind, n) {
    var line = pick(YOU[kind]).replace(/\{n\}/g, n || "1");
    react.said = line;
    react.saidT = 0;
  }
  // a quiet tick on each beat under the menu
  function metronome(t0, beats, b) {
    for (var i = 0; i < beats; i++) {
      (function (t) { Line.sched(t, function (a) { Line.inst.pulseTick(a, "voice"); }, "voice"); })(t0 + i * b);
    }
  }
  function menuBeat() { return 60 / info().menuBpm; }
  function level() { return plan[call].levels[ph.li]; }
  function levelOf(p) { return plan[call].levels[p.li]; }

  var ENTER = {
    // Dialling, ringing, picked up. A redial starts with a click and a dial tone.
    dial: function (p) {
      var t = p.t0;
      if (p.redial) {
        Line.sched(t, function (a) { Line.inst.click(a, "fx"); }, "fx");
        Line.sched(t + 0.15, function (a) { Line.inst.dial(a, 0.7, "fx"); }, "fx");
        p.toneAt = t + 0.15;
        t += 0.95;
      }
      p.dialAt = t;
      if (!p.through) {
        // a redial is the redial button: the same number, faster
        var gap = p.redial ? 0.045 : 0.075;
        DIAL.split("").forEach(function (d, i) {
          Line.sched(t + i * gap, function (a) { Line.inst.dtmf(a, d, gap * 0.8, "fx", 0.06); }, "fx");
        });
        t += DIAL.length * gap + 0.12;
      }
      p.ringAt = t;
      Line.sched(t, function (a) { Line.inst.ring(a, "fx"); }, "fx");
      t += 1.15;
      p.pickAt = t;
      Line.sched(t, function (a) { Line.inst.click(a, "fx"); Line.bedOn(); }, "fx");
      p.end = t + 0.25;
      p.next = function (t1) {
        if (p.after === "level") go("level", t1, { li: p.li, retry: true });
        else if (p.after === "hold") go("hold", t1, { queue: p.queue, reconnect: true });
        else go("welcome", t1);
      };
    },

    welcome: function (p) {
      var b = menuBeat();
      var beats = call === 0 ? 4 : 3;
      speak(p.t0, (beats - 0.4) * b, "voice", info().welcome);
      metronome(p.t0, beats, b);
      p.end = p.t0 + beats * b;
      p.next = function (t1) {
        if (mods.skip && plan[call].levels.length > 1) {
          // pressed 0 a lot: the first question goes by
          go("skip", t1);
        } else go("level", t1, { li: 0 });
      };
    },

    skip: function (p) {
      var b = menuBeat();
      speak(p.t0, 1.8 * b, "voice", "Let's skip that one.");
      for (var i = 0; i < 6; i++) {
        (function (t) { Line.sched(t, function (a) { Line.inst.key(a, "0", "fx"); }, "fx"); })(p.t0 - 0.9 + i * 0.13);
      }
      p.end = p.t0 + 2 * b;
      p.next = function (t1) { go("level", t1, { li: 1 }); };
    },

    // One question of the menu, read out and then read out again
    level: function (p) {
      var c = info(), lv = level(), b = menuBeat();
      var t = p.t0;
      p.items = [];
      function item(role, text, beats, k, pass) {
        var it = { t: t, end: t + beats * b, role: role, text: text, k: k, pass: pass };
        var said = speak(t, beats * b, "voice", text);
        it.digitAt = said.length ? said[0].t : null;
        p.items.push(it);
        t += beats * b;
        return it;
      }
      item("q", CATS[lv.cat].q, 2);
      lv.options.forEach(function (o, k) {
        var it = item("opt", optionText(lv.cat, o.v, o.n, c.flip), 2, k, 1);
        o.heard1 = it.digitAt != null ? it.digitAt + 0.05 : it.end;
        o.at1 = it.t;
      });
      p.unlock = t;
      item("choose", "Please choose now.", 2);
      t += 4 * b;
      p.againAt = t;
      item("again", "Here they are again.", 2);
      lv.options.forEach(function (o, k) {
        var it = item("opt", optionText(lv.cat, o.v, o.n, c.flip), 2, k, 2);
        o.heard2 = it.digitAt != null ? it.digitAt + 0.05 : it.end;
      });
      item("choose", "Please choose now.", 2);
      t += 4 * b;
      item("sorry", "Sorry, I didn't catch that.", 2);
      metronome(p.t0, Math.round((t - p.t0) / b), b);
      p.end = t;
      p.next = function (t1) { dropped(t1); };
      st.levels += p.retry ? 0 : 1;
    },

    thanks: function (p) {
      var b = menuBeat();
      if (p.li + 1 >= plan[call].levels.length) st.value = PTS.hold / plannedNotes(queueLength());
      speak(p.t0, 1.2 * b, "voice", pick(THANKS));
      p.end = p.t0 + 1.5 * b;
      p.next = function (t1) {
        if (p.li + 1 < plan[call].levels.length) go("level", t1, { li: p.li + 1 });
        else go("hold", t1, { queue: queueLength(), reconnect: false });
      };
    },

    // A wrong number: through to a department that can't help, and back
    transfer: function (p) {
      var b = menuBeat();
      p.dept = pick(DEPTS);
      speak(p.t0, 1.8 * b, "voice", "Transferring you now.");
      Line.sched(p.t0 + 2 * b - 0.1, function (a) { Line.inst.click(a, "fx"); }, "fx");
      speak(p.t0 + 2 * b, 3.6 * b, "dept", p.dept.line);
      p.deptAt = p.t0 + 2 * b;
      Line.sched(p.t0 + 6 * b - 0.1, function (a) { Line.inst.click(a, "fx"); }, "fx");
      speak(p.t0 + 6 * b, 1.8 * b, "voice", "Returning you to the menu.");
      p.end = p.t0 + 8 * b;
      p.next = function (t1) { go("level", t1, { li: p.li, retry: true }); };
    },

    // On hold: an announcement, a count-in, then bars until you're through
    hold: function (p) {
      var c = info(), b = 60 / (c.hold[0] + mods.bpm);
      var text = p.reconnect ? "You are now number " + p.queue + " in the queue." : "You are number " + p.queue + " in the queue.";
      speak(p.t0, 3.6 * b, "voice", text);
      p.countAt = p.t0 + 4 * b;
      p.b0 = b;
      for (var i = 0; i < 4; i++) {
        (function (t, first) { Line.sched(t, function (a) { Line.inst.tick(a, first, "beat"); }, "beat"); })(p.countAt + i * b, i === 0);
      }
      p.barsAt = p.countAt + 4 * b;
      p.nextT = p.barsAt;
      p.nextIdx = 0;
      p.queue0 = p.queue;
      p.bars = [];
      p.notes = [];
      p.vo = 0;
      signal = SIGNAL; hitRun = 0; strayGap = -1;
      p.end = null;
    },

    // Through to someone. Lovely, sympathetic, and no help at all.
    agent: function (p) {
      var c = info(), t = p.t0 + 0.35;
      if (st.clean) {
        run.score += PTS.clean;
        p.clean = true;
        setTimeout(function () { if (shell.state() === "playing") shell.callout("Clean line", { tilt: -4 }); }, 250);
      }
      Line.sched(p.t0, function (a) { Line.inst.click(a, "fx"); }, "fx");
      Line.cancel("music");
      p.lines = [];
      c.agent.lines.forEach(function (line, i) {
        var n = line.split(" ").length;
        var span = 0.45 + n * 0.18;
        speak(t, span, "agent", line);
        p.lines.push({ t: t, end: t + span });
        t += span + (i < c.agent.lines.length - 1 ? 0.45 : 0.2);
      });
      p.end = t;
      p.next = function (t1) {
        if (call === 3) go("dead", t1);
        else putThrough();
      };
    },

    // Cancellations: the line goes dead, and the menu starts again
    dead: function (p) {
      hush();
      Line.sched(p.t0, function (a) { Line.inst.click(a, "fx"); Line.inst.staticHit(a, 0.5, "fx"); }, "fx");
      p.toneAt = p.t0 + 1.6;
      Line.sched(p.toneAt, function (a) { Line.inst.dial(a, 1.4, "fx"); }, "fx");
      p.againAt = p.toneAt + 1.7;
      Line.sched(p.againAt - 0.1, function (a) { Line.inst.click(a, "fx"); }, "fx");
      speak(p.againAt, 1.7, "voice", "Thank you for calling A Company.");
      speak(p.againAt + 1.9, 1.3, "voice", "Press 1 for billing.");
      p.end = p.againAt + 3.6;
      p.next = function () { p.done = true; Line.bedOff(); finish(true); };
      shell.callout("Line: dead", { tilt: -4, ms: 1800 });
      react.shout = 1.4; react.steam = 3;
      setTimeout(function () { youSay("dead"); }, 1600);
      run.score += PTS.call;
      run.calls++;
    },

    hung: function (p) {
      Line.cancel("music"); Line.cancel("beat"); hush();
      Line.sched(p.t0, function (a) { Line.inst.click(a, "fx"); }, "fx");
      p.end = p.t0 + 1.1;
      p.next = function () { p.done = true; Line.bedOff(); finish(false); };
    }
  };

  // how many notes a hold of this many bars plays, from the top
  function plannedNotes(bars) {
    var c = info(), n = 0;
    for (var i = 0; i < bars; i++) {
      var fast = c.fastAt != null && i >= c.fastAt;
      var tune = fast ? "fast" : "please", ti = fast ? (i - c.fastAt) % 8 : i % 8;
      n += PATS[c.pats[tune][ti]].length;
    }
    return n;
  }

  function queueLength() {
    var q = info().queue + mods.queue;
    if (mods.half) q = Math.ceil(q / 2);
    return Math.max(2, q);
  }

  // ---------------------------------------------------------------------------
  // The menu: pressing a number
  // ---------------------------------------------------------------------------
  function pressKey(d, hp) {
    keyFlash[d] = 0;
    soundNow(function (a) { Line.inst.key(a, d === "x" ? "#" : d, "fx"); });
    var p = ph;
    if (p.kind !== "level" || hp < p.t0) return;
    var c = info(), lv = level();
    var repeat = hp >= p.againAt;
    var opt = null;
    lv.options.forEach(function (o) { if (String(o.n) === d) opt = o; });
    // calls 2 to 4: nothing until every option has been read
    if (c.lock && !repeat && hp < p.unlock) { refuse(); return; }
    // call 1: only what you've heard so far
    if (!c.lock && !repeat && (opt ? hp < opt.heard1 : hp < p.unlock)) { refuse(); return; }
    if (!/^[1-9]$/.test(d)) { refuse("Not an option"); return; }
    hush();
    run.menuLevels += p.retry ? 0 : 1;
    if (opt && opt.right) {
      var first = !p.retry && !repeat;
      var pts = (first ? PTS.menu : PTS.retry) * (mods.pen ? 0.5 : 1);
      run.score += pts;
      if (first) { run.menuFirst++; st.menuFirst++; }
      learned.menu = true;
      lcdFlash = { text: "Thank you", t: 0, good: true };
      floats.push({ kind: "good", text: "+" + pts, t: 0, life: 0.8, key: d });
      go("thanks", Line.now() + 0.08, { li: p.li, pressed: d });
    } else {
      transferred(d);
    }
  }

  function refuse(text) {
    soundNow(function (a) { Line.inst.buzz(a, "fx"); });
    lcdFlash = { text: text || "Listen first", t: 0 };
  }

  function transferred(d) {
    run.transfers++; st.transfers++;
    shell.callout("Transferred", { tilt: -5 });
    youSay("transfer", d);
    react.shout = 1.2; react.steam = 2.6;
    if (losePatience()) return;
    go("transfer", Line.now() + 0.08, { li: ph.li, pressed: d });
  }

  function dropped(t1) {
    run.drops++; st.drops++;
    shell.callout("Call dropped", { tilt: 4 });
    youSay("drop");
    react.shout = 1;
    if (losePatience()) return;
    go("dial", t1, { redial: true, after: "level", li: ph.li });
  }

  // one less patience: true if that was the last of it, and you've hung up
  function losePatience() {
    run.patience = Math.max(0, run.patience - 1);
    paintHud();
    if (run.patience > 0) return false;
    run.hungUp = true;
    youSay("hang");
    Line.cancel("music"); Line.cancel("beat"); hush();
    setTimeout(function () { shell.callout("Hung up", { tilt: -6, ms: 1800 }); }, 700);
    go("hung", Line.now() + 0.4);
    return true;
  }

  // play a sound straight away (a press on your own keypad)
  function soundNow(fn) {
    Line.sched(Line.now(), fn, "fx");
  }

  // ---------------------------------------------------------------------------
  // On hold: planning bars, judging taps
  // ---------------------------------------------------------------------------
  function planBar(p) {
    var c = info(), i = p.nextIdx;
    var fast = c.fastAt != null && i >= c.fastAt;
    var bpm = (fast ? c.hold[1] : c.hold[0]) + mods.bpm;
    var b = 60 / bpm, t0 = p.nextT;
    var tune = fast ? "fast" : "please", ti = fast ? (i - c.fastAt) % 8 : i % 8;
    Line.bar(t0, b, tune, ti, fast ? c.key[1] : c.key[0]);
    PATS[c.pats[tune][ti]].forEach(function (beat) {
      var t = t0 + beat * b;
      p.notes.push({ t: t, state: 0, bar: i, beat: beat, b: b });
      Line.sched(t, function (a) { Line.inst.tick(a, beat === 0, "beat"); }, "beat");
    });
    var bar = { t: t0, end: t0 + 4 * b, b: b, bpm: bpm, i: i, fast: fast, first: fast && i === c.fastAt };
    if (c.vo && VO_BARS.indexOf(i) >= 0 && i < p.queue0 - 1) {
      var line = plan[call].vo[(st.vo++) % VO.length];
      speak(t0 + 0.1 * b, Math.min(7 * b, 0.5 + line.split(" ").length * 0.3), "voice", line);
      Line.duck(t0, t0 + 8 * b);
      bar.vo = line;
    }
    if (i === p.queue0 - 1) bar.last = true;
    p.bars.push(bar);
    p.nextT = t0 + 4 * b;
    p.nextIdx++;
  }

  function windows(b) {
    var extra = mods.speaker ? SPEAKER : 0;
    return { perfect: PERFECT + extra, close: Math.min(CLOSE, CLOSE_BEATS * b) + extra };
  }

  function laneOn(p, t) {
    return p.kind === "hold" && p.bars.length && t >= p.barsAt - 0.2 && t <= p.nextT + 0.2;
  }

  // How far either side of a note a tap still counts as meant for it: up
  // to 0.4 of a beat, never past halfway to the next note, and never less
  // than its close window
  function zone(notes, i) {
    var n = notes[i];
    var prev = i > 0 ? n.t - notes[i - 1].t : 9, next = i < notes.length - 1 ? notes[i + 1].t - n.t : 9;
    return Math.max(windows(n.b).close, Math.min(0.4 * n.b, prev / 2, next / 2));
  }

  // One tap, judged at heard time. The first tap in a note's zone decides
  // it: in the window it's a hit, outside it's early or late (a miss). More
  // taps in the same zone are ignored. Only a tap in no note's zone at all
  // is a stray.
  var tapLog = [];
  function beatTap(t, via) {
    react.drum = 1;
    var p = ph;
    if (p.kind !== "hold" || !laneOn(p, t)) return;
    var target = null, td = 1e9;
    for (var i = 0; i < p.notes.length; i++) {
      var d = Math.abs(t - (p.notes[i].t + CENTRE));
      if (d <= zone(p.notes, i) && d < td) { target = p.notes[i]; td = d; }
    }
    if (DEBUG) tapLog.push({ call: call, t: +t.toFixed(3), d: target ? +(t - target.t - CENTRE).toFixed(3) : null, via: via });
    if (target && target.state) return;
    if (target && td > windows(target.b).close) {
      missNote(target, t < target.t + CENTRE ? "Early" : "Late");
      return;
    }
    if (target) {
      var w = windows(target.b), perfect = td <= w.perfect;
      target.state = perfect ? 1 : 2;
      target.hitAt = t;
      run.hits++; st.hits++;
      if (perfect) run.perfects++;
      // each note is worth a share of the hold's 600, half if it's only close
      var pts = Math.min(Math.round(st.value * (perfect ? 1 : 0.5) * (mods.speaker ? 0.5 : 1)), PTS.hold - st.hold);
      st.hold += pts;
      run.score += pts;
      run.streak++;
      run.best = Math.max(run.best, run.streak);
      if (run.streak === 16 || run.streak === 32 || run.streak === 64) {
        shell.callout(run.streak === 16 ? "Sixteen in a row" : run.streak === 32 ? "Thirty-two in a row" : "Still holding", { tilt: 4, sound: false });
      }
      learned.beat++;
      hitRun++;
      if (hitRun >= RESTORE && signal < SIGNAL) { signal++; hitRun = 0; soundNow(function (a) { Line.inst.hit(a, true, "fx"); }); }
      soundNow(function (a) { Line.inst.hit(a, perfect, "fx"); });
      laneFloat(perfect ? "perfect" : "close", perfect ? "Perfect" : "Close", 0.6);
      return;
    }
    // a stray tap: costs a bar of signal, once in each gap between notes
    var gap = 0;
    while (gap < p.notes.length && p.notes[gap].t + CENTRE < t) gap++;
    laneFloat("stray", "Off beat", 0.6);
    run.streak = 0;
    st.clean = false;
    hitRun = 0;
    if (gap === strayGap) return;
    strayGap = gap;
    loseSignal();
  }

  // a note gone by: missed outright, or tapped too early or too late
  function missNote(n, how) {
    n.state = 3;
    if (DEBUG) tapLog.push({ call: call, miss: +n.t.toFixed(3), how: how || "" });
    run.notes++; st.notes++;
    run.streak = 0;
    hitRun = 0;
    laneFloat("miss", how || "Missed", 0.7);
    st.clean = false;
    soundNow(function (a) { Line.inst.miss(a, "fx"); });
    return loseSignal();
  }

  function checkMisses(p, h) {
    for (var i = 0; i < p.notes.length; i++) {
      var n = p.notes[i];
      if (n.state || h <= n.t + CENTRE + windows(n.b).close) continue;
      if (missNote(n)) return;
    }
  }

  // a bar of signal gone: true if that was the last, and you're cut off
  function loseSignal() {
    signal = Math.max(call === 0 ? 1 : 0, signal - 1);
    if (signal === 1 && !st.weakSaid) {
      st.weakSaid = true;
      shell.callout("Signal: weak", { tilt: 5, sound: false });
    }
    if (signal > 0) return false;
    cutOff();
    return true;
  }

  function cutOff() {
    var p = ph, h = Line.heard();
    var finished = p.bars.filter(function (bar) { return bar.end <= h; }).length;
    var left = Math.max(1, p.queue0 - finished);
    // the notes nobody got to don't count against you
    p.notes.forEach(function (n) { if (!n.state) n.state = 4; });
    run.cutoffs++; st.cutoffs++;
    st.clean = false;
    Line.cancel("music"); Line.cancel("beat"); hush();
    soundNow(function (a) { Line.inst.staticHit(a, 0.45, "fx"); Line.inst.click(a, "fx"); });
    shell.callout("Cut off", { tilt: -5 });
    youSay("cut");
    react.shout = 1.2;
    if (!shell.reduceMotion) shake = 0.7;
    if (losePatience()) return;
    go("dial", Line.now() + 0.7, { redial: true, after: "hold", queue: left + CUT_QUEUE, cutAt: Line.now() });
  }

  function countNotes(p) {
    // notes that were played and finished count towards "on the beat"
    p.notes.forEach(function (n) {
      if ((n.state === 1 || n.state === 2) && !n.counted) { n.counted = true; run.notes++; st.notes++; }
    });
  }

  // ---------------------------------------------------------------------------
  // Between calls, and the end
  // ---------------------------------------------------------------------------
  function putThrough() {
    ph.done = true;
    Line.bedOff();
    run.score += PTS.call;
    run.calls++;
    var c = info(), next = call + 1;
    var mistakes = st.transfers + st.drops + st.cutoffs;
    var beat = st.notes ? st.hits / st.notes : 0;
    var stamp = mistakes === 0 && beat >= 0.9 ? "Approved" : mistakes <= 1 && beat >= 0.75 ? "Pending review" : "Not approved";
    var offers = offer();
    var stats = [
      { label: "Right first time", value: st.levels ? st.menuFirst + " of " + st.levels : "Skipped" },
      { label: "On the beat", value: st.hits + " of " + st.notes },
      { label: "Cut off", value: times(st.cutoffs) },
      { label: "Patience", value: run.patience + " of " + PATIENCE_MAX },
      { label: "Score", value: fmt(run.score) }
    ];
    shell.interlude({
      stamp: stamp,
      tilt: call % 2 ? 4 : -4,
      heading: c.dept + ": put through.",
      line: c.done,
      stats: stats,
      ask: "Call " + (next + 1) + ": " + CALLS[next].dept + ". Before you ring.",
      choices: offers.map(function (o) { return { label: o.label, detail: o.detail }; })
    }).then(function (i) {
      var o = offers[i] || offers[0];
      run.taken.push(o.id);
      o.apply(nextMods, run);
      call = next;
      startCall();
      paintHud();
      shell.next();
    });
  }

  // three ways to get ready, from this call's stream (the same for everyone today)
  function offer() {
    var r = plan[call].offers;
    var pool = CHOICES.slice();
    var out = [];
    while (out.length < 3 && pool.length) out.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
    return out;
  }

  function finish(completed) {
    if (shell.state() !== "playing") return;
    if (completed) run.score += run.patience * PTS.patience;
    var score = Math.round(run.score);
    var rec = shell.record(score);
    var rank;
    if (completed) rank = score >= APPROVED ? 1 : score >= PENDING ? 2 : 3;
    else rank = call >= 2 ? 3 : 4;
    var dept = CALLS[call].dept;
    var heading = completed ? "Press 1 for billing." : "You hung up on " + dept + ".";
    var line = completed ? RANKS[rank - 1] : rank === 3 ? "You hung up on " + dept + ". You were nearly cancelled. Nearly." : RANKS[3];
    var onBeat = run.notes ? Math.round(run.hits / run.notes * 100) : 0;
    var stats = [
      { label: "Score", value: fmt(score) },
      { label: "Calls", value: run.calls + " of 4" },
      { label: "On the beat", value: onBeat + "%" },
      { label: "Cut off", value: times(run.cutoffs) },
      { label: rec.isNew ? (run.daily ? "New best today" : "New best") : (run.daily ? "Best today" : "Best"),
        value: fmt(rec.isNew ? score : rec.best || 0), highlight: rec.isNew }
    ];
    if (run.daily) stats.unshift({ label: "Run", value: shell.today });
    shell.finish({
      place: rank, total: 4,
      heading: heading,
      line: line,
      stats: stats,
      delay: completed ? 900 : 1200,
      share: fmt(score) + " points, " + (completed ? "all four calls" : "hung up on " + dept) + ", " + onBeat + "% on the beat"
    });
  }

  // ---------------------------------------------------------------------------
  // The frame
  // ---------------------------------------------------------------------------
  function update(dt) {
    var state = shell.state();
    animT += dt;
    animate(dt, state);
    if (state !== "playing") return;
    Line.advance(dt);
    var now = Line.now(), h = Line.heard();
    if (ph.kind === "start") {
      go("dial", now + 0.1, { after: "welcome", through: call > 0 });
    }
    if (AUTOPILOT || bot) autopilot(h);
    // presses, in the order they happened
    presses.sort(function (a, b) { return a.t - b.t; });
    while (presses.length) {
      var e = presses.shift();
      if (e.kind === "key") pressKey(e.key, e.t);
      else if (e.kind === "beat") beatTap(e.t, e.via);
    }
    if (ph.kind === "hold") {
      var p = ph;
      while (p.nextIdx < p.queue0 && p.nextT < now + 1.8) planBar(p);
      checkMisses(p, h);
      if (ph === p) {
        countNotes(p);
        // the last bar's notes are all judged before the pick-up
        if (p.nextIdx >= p.queue0 && p.end == null) {
          p.end = p.nextT + 0.45;
          p.next = function (t1) { go("agent", t1); };
        }
      }
    }
    if (ph.end != null && !ph.done && now >= ph.end - AHEAD) {
      var was = ph;
      was.done = true;
      was.next(was.end);
    }
    paintHud();
  }

  function animate(dt, state) {
    react.shout = Math.max(0, react.shout - dt);
    react.steam = Math.max(0, react.steam - dt);
    react.drum = Math.max(0, react.drum - dt * 7);
    react.saidT += dt;
    react.sweatT = (react.sweatT + dt * 0.7) % 1;
    shake = Math.max(0, shake - dt * 3);
    if (lcdFlash) { lcdFlash.t += dt; if (lcdFlash.t > 1.1) lcdFlash = null; }
    Object.keys(keyFlash).forEach(function (k) { keyFlash[k] += dt; if (keyFlash[k] > 0.25) delete keyFlash[k]; });
    for (var i = floats.length - 1; i >= 0; i--) { floats[i].t += dt; if (floats[i].t > floats[i].life) floats.splice(i, 1); }
    // the wall clock: a minute a second, and much faster on hold
    if (state === "playing") clockMin += dt * (ph && ph.kind === "hold" ? 22 : 2);
  }

  // ---------------------------------------------------------------------------
  // The autopilot (?autopilot, ?clip), and the test player (?debug): a
  // caller with a good memory and steady hands. It sometimes gets a number
  // wrong, so a clip gets to see Lanyards.
  // ---------------------------------------------------------------------------
  var AUTO = { react: [0.25, 0.45], wrong: [0, 0.08, 0.1, 0.1], spread: 0.035, sigma: 0, bias: 0, lapse: 0.03, stray: 0 };
  function gauss() { var u = 1 - Math.random(), v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

  function autopilot(h) {
    var prof = bot || AUTO, p = ph;
    if (p.kind === "level" && !p.auto) {
      var lv = level(), right = null;
      lv.options.forEach(function (o) { if (o.right) right = o; });
      var ready = info().lock ? p.unlock : right.heard1;
      var r = prof.react[0] + Math.random() * (prof.react[1] - prof.react[0]);
      var wrongP = p.retry ? (prof.wrong[call] || 0) * 0.4 : (prof.wrong[call] || 0);
      var wrong = Math.random() < wrongP;
      var key = String(right.n);
      if (wrong) {
        var others = lv.options.filter(function (o) { return !o.right; });
        key = String(pick(others).n);
      }
      // someone slow to remember waits for the repeat
      if (prof.repeat && Math.random() < prof.repeat[call]) { ready = right.heard2; key = wrong ? key : String(right.n); }
      p.auto = { at: ready + r, key: key };
    }
    if (p.kind === "level" && p.auto && !p.auto.done && h >= p.auto.at) {
      p.auto.done = true;
      presses.push({ kind: "key", key: p.auto.key, t: p.auto.at, via: "auto" });
    }
    if (p.kind === "hold") {
      p.notes.forEach(function (n) {
        if (n.auto == null) {
          if (Math.random() < prof.lapse) n.auto = -1;
          else n.auto = n.t + CENTRE + prof.bias + (prof.sigma ? gauss() * prof.sigma : (Math.random() * 2 - 1) * (prof.spread || 0));
          // a nervous extra tap in the gap after this note
          if (prof.stray && Math.random() < prof.stray) n.extra = n.t + n.b * (0.45 + Math.random() * 0.15);
        }
        if (n.auto > 0 && !n.autoDone && h >= n.auto) { n.autoDone = true; presses.push({ kind: "beat", t: n.auto, via: "auto" }); }
        if (n.extra && !n.extraDone && h >= n.extra) { n.extraDone = true; presses.push({ kind: "beat", t: n.extra, via: "auto" }); }
      });
      if (prof.restTap) {
        p.bars.forEach(function (bar) {
          if (bar.rests == null) {
            bar.rests = [];
            for (var q = 0; q < 4; q++) {
              var on = p.notes.some(function (n) { return n.bar === bar.i && n.beat === q && Math.abs(n.t - (bar.t + q * bar.b)) < 0.01; });
              if (!on && Math.random() < prof.restTap) bar.rests.push({ t: bar.t + q * bar.b + CENTRE + gauss() * (prof.sigma || 0.03) });
            }
          }
          bar.rests.forEach(function (r) { if (!r.done && h >= r.t) { r.done = true; presses.push({ kind: "beat", t: r.t, via: "auto" }); } });
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // HUD: the call and your patience top left, the score top right
  // ---------------------------------------------------------------------------
  function buildHud() {
    shell.hud.innerHTML =
      '<div class="kit-hud-tl">' +
        '<p class="kit-stat"><small>Call</small><span data-call>1/4</span></p>' +
        '<p class="kit-stat hm-patience"><small>Patience</small><span class="hm-pips" data-pips></span></p>' +
      '</div>' +
      '<div class="kit-hud-tr">' +
        '<p class="kit-stat kit-stat-big"><span data-score>0</span></p>' +
        '<p class="kit-stat" data-minor><small>In a row</small><span data-streak>0</span></p>' +
      '</div>';
    hudEls = {};
    ["call", "pips", "score", "streak"].forEach(function (k) { hudEls[k] = shell.hud.querySelector("[data-" + k + "]"); });
    hudEls.pipsAt = -1;
  }
  function setText(node, text) { if (node && node.textContent !== text) node.textContent = text; }
  function paintHud() {
    if (!hudEls || !run) return;
    setText(hudEls.call, (call + 1) + "/4");
    setText(hudEls.score, fmt(run.score));
    setText(hudEls.streak, String(run.streak));
    var cap = Math.max(PATIENCE, run.patience);
    if (hudEls.pipsAt !== run.patience * 10 + cap) {
      hudEls.pipsAt = run.patience * 10 + cap;
      var html = "";
      for (var i = 0; i < cap; i++) html += '<span class="hm-pip' + (i < run.patience ? " is-on" : "") + '"></span>';
      hudEls.pips.innerHTML = html;
      hudEls.pips.parentNode.setAttribute("aria-label", "Patience: " + run.patience);
    }
  }

  // ---------------------------------------------------------------------------
  // Layout: where everything sits, in world units (100 across the shorter
  // side). Square on phones, 4:3 on desktop, 4:5 in the clip frame.
  // ---------------------------------------------------------------------------
  function layout() {
    var coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches && !N.flags.clip;
    var narrow = window.matchMedia && window.matchMedia("(max-width: 39.99rem)").matches;
    var tall = WH > WW * 1.1, wide = WW > WH * 1.15;
    Lay.tmin = 12 / U;
    Lay.touch = coarse;
    Lay.shape = tall ? "tall" : wide ? "wide" : "square";
    // the HUD's top left block (the call and your patience)
    Lay.top = (N.flags.clip ? 64 : narrow ? 46 : 72) / U;
    // the keypad: keys 56px on a touch screen, unless that would push the
    // phone up under the pause buttons and the score (a 320px phone gets
    // about 50px)
    var gap = coarse ? 1 : 0, pad = coarse ? 1.7 : 0;
    var lcdH = Math.max(tall ? 16 : 14, 46 / U);
    var kk = coarse ? Math.max(56 / U + 0.25, 12) : wide ? 11 : tall ? 13.5 : 10.5;
    if (coarse) {
      var room = WH - 46 / U - 2.8 - 1.2 - 3 * pad - lcdH - 2 * gap;
      kk = Math.max(Math.min(kk, room / 3), 44 / U);
    } else {
      gap = kk * 0.08; pad = Math.max(2, kk * 0.16);
    }
    var star = !coarse;
    var gridW = 3 * kk + 2 * gap, gridH = 3 * kk + 2 * gap + (star ? kk * 0.6 + gap : 0);
    var pw = gridW + 2 * pad, phH = pad + lcdH + pad + gridH + pad;
    var px = WW - pw - (wide ? 5 : 1.5), py = WH - phH - (coarse ? 1.2 : 2.4);
    Lay.phone = { x: px, y: py, w: pw, h: phH, pad: pad };
    Lay.lcd = { x: px + pad, y: py + pad, w: gridW, h: lcdH };
    Lay.keys = { x: px + pad, y: py + pad + lcdH + pad, w: gridW, h: gridH, kk: kk, gap: gap, star: star };
    // the phone stands on the table
    Lay.table = py + phH - 3;
    // you, behind the table on the left, as big as the space allows
    var cw = px - 1;
    var R = wide ? clamp(Math.min(cw * 0.18, WH * 0.15), 9, 15) : tall ? clamp(cw * 0.3, 8, 16) : clamp(cw * 0.26, 8, 11);
    Lay.you = { x: cw * (wide ? 0.42 : tall ? 0.46 : 0.42), y: Lay.table, R: R };
    var hatTop = Lay.table - R * 3.75;
    Lay.hatTop = hatTop;
    if (wide) {
      Lay.note = { x: Lay.you.x + R * 0.9, y: Lay.top + 1, w: Math.min(44, px - Lay.you.x - R * 0.9 - 4) };
      Lay.bubble = { x: Math.max(Lay.note.x + 14, px - 30), y: Lay.top + 0.5, right: WW - 2, bottom: py - 5, side: "down" };
      Lay.youBubble = { x: 2, y: Lay.top + 1, right: Lay.you.x + R * 0.6, bottom: hatTop - 1.5 };
      Lay.clock = { x: Math.max(9, Lay.you.x - R * 1.9), y: Lay.top + 13, r: 6.5 };
    } else if (tall) {
      Lay.note = { x: 3, y: Lay.top + 1.5, w: Math.min(46, px - 4) };
      Lay.bubble = { x: Math.min(px - 22, 34), y: Lay.top + 1.5, right: WW - 2, bottom: py - 5, side: "down" };
      Lay.youBubble = null;
      Lay.clock = { x: 9, y: Math.max(Lay.top + 34, hatTop - 9), r: 6 };
    } else {
      // a square phone screen: the note top left, the bubble under it
      Lay.note = { x: 1.6, y: Lay.top + 0.5, w: px - 2.6 };
      Lay.bubble = { x: 1.2, y: 0, right: px + pad - 1.2, bottom: hatTop - 0.5, side: "right" };
      Lay.youBubble = null;
      Lay.clock = null;
    }
    Lay.mug = { x: Math.max(5.5, Lay.you.x - R * 2.15), y: Lay.table + R * 0.12, k: R * 0.16 };
    // callouts land on your side, clear of the phone, the note and the bubbles:
    // on the wall between you and the phone on a wide screen, over you otherwise
    var cl = wide ? Lay.you.x + R * 1.5 : 0, ct = wide ? WH * 0.5 : tall ? WH * 0.38 : hatTop + R * 1.2;
    root.style.setProperty("--hm-callouts-left", Math.round(cl * U) + "px");
    root.style.setProperty("--hm-callouts-right", Math.round((WW - px + 1) * U) + "px");
    root.style.setProperty("--hm-callouts-top", Math.round(ct * U) + "px");
  }

  // ---------------------------------------------------------------------------
  // Drawing (DESIGN.md, section 7)
  // ---------------------------------------------------------------------------
  function resize(w, h, dpr) {
    W = w; H = h; DPR = dpr;
    U = Math.min(W, H) / 100;
    WW = W / U; WH = H / U;
    ctx = (shell ? shell.canvas : root.querySelector("canvas")).getContext("2d");
    layout();
    D.init(T || N.tokens(root), U * DPR);
    back = null; front = null;
  }

  function newCanvas() {
    var cv = document.createElement("canvas");
    cv.width = Math.round(W * DPR);
    cv.height = Math.round(H * DPR);
    var c = cv.getContext("2d");
    c.scale(DPR * U, DPR * U);
    return { cv: cv, c: c };
  }

  // The room behind you, and the table and the phone's body in front of
  // you: each drawn once per size
  function buildBack() {
    var b = newCanvas(), c = b.c;
    c.fillStyle = T.ink;
    c.fillRect(0, 0, WW, WH);
    // wallpaper: rows of faint halftone diamonds
    c.fillStyle = D.dots(c, T.ash, 1.3);
    for (var y = -2, row = 0; y < Lay.table; y += 9, row++) {
      for (var x = row % 2 ? 0 : 4.5; x < WW + 3; x += 9) {
        c.beginPath();
        c.moveTo(x, y); c.lineTo(x + 2.4, y + 2.4); c.lineTo(x, y + 4.8); c.lineTo(x - 2.4, y + 2.4); c.closePath();
        c.fill();
      }
    }
    back = b.cv;
  }

  function buildFront() {
    var b = newCanvas(), c = b.c;
    // the table: a paper edge, its front in halftone
    c.fillStyle = T.ink;
    c.fillRect(-1, Lay.table, WW + 2, WH);
    c.fillStyle = D.dots(c, T.ash, 1.1);
    c.fillRect(-1, Lay.table + 2.4, WW + 2, WH);
    D.ink(c, 0.8, T.paper);
    c.beginPath(); c.moveTo(-1, Lay.table); c.lineTo(WW + 1, Lay.table); c.stroke();
    D.ink(c, 0.4, T.paper);
    c.beginPath(); c.moveTo(-1, Lay.table + 2.2); c.lineTo(WW + 1, Lay.table + 2.2); c.stroke();
    D.phoneBody(c, Lay.phone);
    front = b.cv;
  }

  function render() {
    if (!ctx || !run) return;
    var state = shell.state();
    if (state !== "playing") Line.idle();
    if (briefed !== call && (state === "countdown" || state === "playing")) {
      briefed = call;
      shell.brief({ title: "Call " + (call + 1) + ": " + info().dept, text: info().brief, ms: call === 0 ? 7000 : 6200 });
    }
    if (!back) buildBack();
    if (!front) buildFront();
    var c = ctx, h = Line.heard(), v = vis();
    var sx = 0, sy = 0;
    if (shake > 0 && !shell.reduceMotion) { sx = (Math.random() - 0.5) * 6 * shake; sy = (Math.random() - 0.5) * 6 * shake; }
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.drawImage(back, sx * DPR, sy * DPR);
    c.setTransform(DPR * U, 0, 0, DPR * U, sx * DPR, sy * DPR);
    if (Lay.clock) D.clock(c, Lay.clock.x, Lay.clock.y, Lay.clock.r, clockMin);
    drawNote(c, v, h);
    var me = drawYou(c, v, h);
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.drawImage(front, sx * DPR, sy * DPR);
    c.setTransform(DPR * U, 0, 0, DPR * U, sx * DPR, sy * DPR);
    D.mug(c, Lay.mug.x, Lay.mug.y, Lay.mug.k, mods && mods.kettle ? 1 : 0, shell.reduceMotion ? 0 : animT);
    // your other mitten, on the table, drumming along
    D.mitten(c, me.rest.x, me.rest.y - react.drum * Lay.you.R * 0.12, me.rest.r, T.paper, false);
    // the cord, from the handset to the phone
    D.cord(c, me.cord.x, me.cord.y, Lay.phone.x + 0.6, Lay.phone.y + Lay.phone.h * 0.8, Math.max(0.5, Lay.you.R * 0.055), Lay.you.R * 0.3);
    drawLcd(c, v, h);
    if (padOn(v)) drawPad(c, v, h);
    else drawKeys(c, v, h);
    drawFloats(c);
    // words, in screen pixels, so they stay readable on a phone
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    var placed = [];
    drawBubbles(c, v, h, placed);
    var hn = hint(v, h);
    if (hn) {
      c.setTransform(DPR * U, 0, 0, DPR * U, 0, 0);
      drawArrow(c, hn.x, hn.y, hn.word, hn.dir, hn.left);
    }
  }

  function padOn(v) {
    return v.kind === "hold" || (v.kind === "dial" && v.after === "hold");
  }

  // ---------- You ----------
  function drawYou(c, v, h) {
    var y = Lay.you, R = y.R;
    var bob = 0;
    if (v.kind === "hold" && !shell.reduceMotion && v.bars && v.bars.length && h >= v.barsAt) {
      var bar = currentBar(v, h);
      if (bar) { var ph01 = ((h - bar.t) / bar.b) % 1; bob = Math.max(0, 1 - ph01 * 4) * R * 0.07; }
    }
    // look at the note while a question is read, at the phone otherwise
    var look = 0.8, up = 0.1;
    var reading = v.kind === "level" && v.items && (h < v.items[0].end + 0.4);
    if (reading) {
      look = clamp((Lay.note.x + (Lay.note.dw || 20) / 2 - y.x) / (R * 2), -1, 1);
      up = 0.9;
    }
    var q = v.kind === "hold" ? (v.queue0 || 9) : 9;
    var o = {
      look: look, up: up, bob: bob,
      shout: react.shout > 0 ? Math.min(1, react.shout * 2) : 0,
      brows: v.kind === "agent" ? 0.55 : 1,
      lids: v.kind === "hold" && !react.shout && q > 3 && h > (v.barsAt || 0) + 2,
      drum: react.drum,
      sweat: run.patience <= 1, sweatT: react.sweatT,
      steam: react.steam > 0 ? Math.min(1, react.steam) : 0, steamT: shell.reduceMotion ? 0.3 : animT
    };
    return D.you(c, y.x, y.y, R, o);
  }

  // ---------- The sticky note ----------
  function noteLines() {
    var c = info(), lines = [];
    c.cats.forEach(function (cat, i) {
      lines.push({ cat: cat, text: CATS[cat].line(facts[cat]), li: i });
    });
    return lines;
  }

  function drawNote(c, v, h) {
    var n = Lay.note, size = Lay.shape === "square" ? Math.max(13 / U, 3.1) : Math.max(Lay.tmin, Lay.shape === "tall" ? 5 : 4.2);
    var lines = noteLines();
    var title = "My problem";
    var tw = 0;
    // on a narrow phone the note's words shrink to fit its column, to 12px at the least
    lines.forEach(function (l) { tw = Math.max(tw, D.measure(c, l.text, size) + size * (mods.pen ? 3.4 : 1.9)); });
    if (tw + size * 1.5 > n.w) size = Math.max(Lay.tmin, size * (n.w - size * 1.5) / tw);
    var lh = size * 1.18;
    tw = D.measure(c, title, size * 0.9);
    lines.forEach(function (l) { tw = Math.max(tw, D.measure(c, l.text, size) + size * (mods.pen ? 3.4 : 1.9)); });
    var w = Math.min(n.w, tw + size * 1.5), hgt = lh * (lines.length + 1) + size * 1.1;
    var x = n.x, y = n.y;
    n.h = hgt;
    n.dw = w;
    c.save();
    c.translate(x + w / 2, y + hgt / 2);
    c.rotate(-0.025);
    c.translate(-w / 2, -hgt / 2);
    // a strip of tape at the top
    var paper = new Path2D();
    paper.moveTo(0, 0); paper.lineTo(w, 0); paper.lineTo(w, hgt - size * 0.5); paper.lineTo(w - size * 0.6, hgt); paper.lineTo(0, hgt); paper.closePath();
    D.solid(c, paper, T.accent, 0.5);
    D.shade(c, paper, D.rr(0, hgt * 0.7, w, hgt, 0), 0.9);
    D.ink(c, 0.5); c.stroke(paper);
    D.text(c, title, size * 0.7, size * 0.35 + lh * 0.5, size * 0.9, { align: "left" });
    c.fillStyle = T.ink;
    c.fillRect(size * 0.7, lh * 1.02 + size * 0.2, D.measure(c, title, size * 0.9), size * 0.09);
    var nLv = plan[call].levels.length;
    var cur = v.li != null ? v.li : v.kind === "hold" || v.kind === "agent" || v.kind === "dead" || v.kind === "hung" ? nLv : v.kind === "skip" ? 0 : -1;
    if (v.kind === "dial" && v.after === "hold") cur = nLv;
    var skipped = mods.skip && nLv > 1 && (cur >= 1 || v.kind === "skip");
    lines.forEach(function (l, i) {
      var ly = size * 0.35 + lh * (i + 1.5) + size * 0.25;
      D.text(c, l.text, size * 0.7, ly, size, { align: "left" });
      var lw2 = D.measure(c, l.text, size);
      if (skipped && i === 0) {
        c.fillStyle = T.ink;
        c.fillRect(size * 0.5, ly - size * 0.06, lw2 + size * 0.4, size * 0.12);
      } else if (i < cur || (v.kind === "thanks" && i === v.li)) {
        // ticked off
        D.line(c, [[size * 0.7 + lw2 + size * 0.35, ly], [size * 0.7 + lw2 + size * 0.65, ly + size * 0.3], [size * 1.15 + lw2 + size * 0.5, ly - size * 0.42]], size * 0.16, T.ink);
      }
      if (v.kind === "level" && i === v.li) {
        // ringed in red: the question being asked
        c.save();
        D.ink(c, size * 0.13, T.red);
        c.beginPath();
        c.ellipse(size * 0.7 + lw2 / 2, ly, lw2 / 2 + size * 0.5, size * 0.72, -0.03, 0, Math.PI * 2);
        c.stroke();
        c.restore();
        // with a pen, your number goes on the note as it's read
        if (mods.pen) {
          var right = null;
          levelOf(v).options.forEach(function (o) { if (o.right) right = o; });
          if (right && h >= right.heard1) D.text(c, "= " + right.n, size * 1.2 + lw2 + size * 0.4, ly, size, { align: "left", colour: T.paper, stroke: size * 0.22 });
        }
      }
    });
    c.restore();
  }

  // ---------- The phone's screen ----------
  function drawLcd(c, v, h) {
    var l = Lay.lcd;
    var screen = D.rr(l.x, l.y, l.w, l.h, 1.2);
    D.solid(c, screen, T.accent, 0.7);
    c.save();
    c.clip(screen);
    c.fillStyle = D.dots(c, T.ink, 0.7);
    c.globalAlpha = 0.25;
    c.fillRect(l.x, l.y, l.w, l.h);
    c.globalAlpha = 1;
    var s = Math.max(Lay.tmin, l.h * 0.26), big = Math.max(Lay.tmin * 1.6, l.h * 0.62);
    var px = l.x + l.h * 0.55, py = l.y + l.h / 2, mid = l.x + l.h * 1.1 + (l.w - l.h * 1.1) / 2;
    var talking = talkingNow(h);
    var mouth = talking ? Math.abs(Math.sin(h * 22)) : 0;
    if (lcdFlash && lcdFlash.t < 1) {
      D.text(c, lcdFlash.text, l.x + l.w / 2, py, s * 1.1, { colour: T.ink });
      if (!lcdFlash.good) D.padlock(c, l.x + l.w - s * 1.1, l.y + s * 0.9, s * 0.9, T.ink);
    } else if (v.kind === "start") {
      D.text(c, "A Company", l.x + l.w / 2, py, s * 1.2);
    } else if (v.kind === "dial") {
      if (v.redial && h < v.dialAt) {
        D.text(c, v.after === "hold" ? "Line lost" : "Dropped", l.x + l.w / 2, py, s * 1.25);
      } else if (h < v.ringAt) {
        var typed = DIAL.slice(0, clamp(Math.floor((h - v.dialAt) / (v.redial ? 0.045 : 0.075)) + 1, 0, DIAL.length));
        D.text(c, "Dialling", l.x + l.w / 2, l.y + s * 0.95, s * 0.9);
        D.text(c, typed, l.x + l.w / 2, py + s * 0.7, s * 1.5, { font: "monospace", upper: false });
      } else {
        D.text(c, "Ringing", l.x + l.w / 2, py, s * 1.3);
        if (Math.floor((h - v.ringAt) / 0.3) % 2 === 0) {
          D.ink(c, s * 0.12);
          [-1, 1].forEach(function (d) {
            c.beginPath(); c.arc(l.x + l.w / 2 + d * s * 3.2, py, s * 0.7, d > 0 ? -0.9 : Math.PI - 0.9, d > 0 ? 0.9 : Math.PI + 0.9); c.stroke();
          });
        }
      }
    } else if (v.kind === "welcome" || v.kind === "level" || v.kind === "thanks" || v.kind === "skip") {
      D.voiceFace(c, px, py, l.h * 0.84, mouth);
      var shown = null;
      if (v.kind === "level") {
        var item = null;
        v.items.forEach(function (it) { if (h >= it.t) item = it; });
        var locked = info().lock && h < v.unlock && h < v.againAt;
        if (item && item.role === "opt" && item.digitAt != null && h >= item.digitAt) shown = String(levelOf(v).options[item.k].n);
        if (shown) D.text(c, shown, mid, py + big * 0.04, big, { colour: T.ink });
        else if (item && (item.role === "choose" || item.role === "again" || item.role === "sorry" || (!locked && item.role === "opt"))) D.text(c, item.role === "sorry" ? "Sorry" : "Choose", mid, py, s * 1.3);
        else if (locked) D.text(c, "Listen", mid, py, s * 1.3);
        if (locked) D.padlock(c, l.x + l.w - s * 0.9, l.y + s * 0.9, s * 0.75, T.ink);
      } else if (v.kind === "thanks") {
        D.text(c, v.pressed || "", mid, py + big * 0.04, big);
      } else {
        D.text(c, "A Company", mid, py, s * 1.05);
      }
    } else if (v.kind === "transfer") {
      if (h < v.deptAt) D.text(c, "Transferring", l.x + l.w / 2, py, s * 1.15);
      else if (h < v.end - menuBeat() * 2) {
        D.text(c, "Through to", l.x + l.w / 2, l.y + s * 0.95, s * 0.85);
        D.text(c, v.dept.name, l.x + l.w / 2, py + s * 0.55, s * 1.25);
      } else D.text(c, "Menu", l.x + l.w / 2, py, s * 1.3);
    } else if (v.kind === "hold") {
      var left = queueLeft(v, h);
      if (mods.speaker) D.text(c, "Speaker", l.x + l.w * 0.56, l.y + l.h - s * 0.8, s * 0.8);
      D.text(c, "Queue", l.x + s * 0.5, l.y + s * 0.9, s * 0.85, { align: "left" });
      D.text(c, String(left), l.x + s * 0.5, py + s * 0.7, big * 0.95, { align: "left" });
      D.signal(c, l.x + l.w - s * 2.3, l.y + l.h - s * 0.5, s * 1.9, signal, T.ink, T.ink);
      var bar = currentBar(v, h);
      var label = h < v.countAt ? "On hold" : h < v.barsAt ? "Count in" : bar && bar.fast ? "Fast version" : "On hold";
      D.text(c, label, l.x + l.w * 0.56, l.y + s * 0.9, s * 0.85);
    } else if (v.kind === "agent") {
      var a = info().agent;
      D.agentFace(c, px, py + l.h * 0.04, l.h * 0.84, a.look, mouth);
      D.text(c, a.name || "Connected", mid, l.y + s * 1.05, s * 1.05);
      D.text(c, info().dept, mid, py + s * 0.75, s * 0.85);
    } else if (v.kind === "dead") {
      if (h < v.toneAt) D.text(c, "Call ended", l.x + l.w / 2, py, s * 1.2);
      else if (h < v.againAt) D.text(c, "", l.x + l.w / 2, py, s);
      else { D.voiceFace(c, px, py, l.h * 0.84, mouth); D.text(c, "Billing", mid, py, s * 1.2); }
    } else if (v.kind === "hung") {
      D.text(c, "Hung up", l.x + l.w / 2, py, s * 1.3);
    }
    c.restore();
    D.ink(c, 0.7); c.stroke(screen);
  }

  function talkingNow(h) {
    for (var i = talks.length - 1; i >= 0; i--) if (h >= talks[i].t && h < talks[i].end) return talks[i];
    return null;
  }
  function currentBar(v, h) {
    var bar = null;
    (v.bars || []).forEach(function (b) { if (h >= b.t) bar = b; });
    return bar;
  }
  function queueLeft(v, h) {
    var done = (v.bars || []).filter(function (b) { return b.end <= h; }).length;
    return Math.max(1, v.queue0 - done);
  }

  // ---------- The keypad ----------
  function keyRects() {
    var k = Lay.keys, out = [];
    for (var i = 0; i < 9; i++) {
      out.push({ key: String(i + 1), x: k.x + (i % 3) * (k.kk + k.gap), y: k.y + Math.floor(i / 3) * (k.kk + k.gap), w: k.kk, h: k.kk });
    }
    if (k.star) {
      var sy = k.y + 3 * (k.kk + k.gap), sh = k.kk * 0.62;
      ["*", "0", "#"].forEach(function (s, i) { out.push({ key: s, x: k.x + i * (k.kk + k.gap), y: sy, w: k.kk, h: sh, small: true }); });
    }
    return out;
  }

  function drawKeys(c, v, h) {
    var locked = v.kind === "level" && info().lock && h < v.unlock && h < v.againAt;
    var size = Math.max(Lay.tmin * 1.25, Lay.keys.kk * 0.5);
    keyRects().forEach(function (r) {
      var down = keyFlash[r.key] != null;
      var path = D.rr(r.x, r.y + (down ? 0.4 : 0), r.w, r.h - 0.4, r.w * 0.16);
      // the key's edge underneath
      D.solid(c, D.rr(r.x, r.y + 0.6, r.w, r.h - 0.4, r.w * 0.16), T.ink, 0.5, T.ink);
      D.solid(c, path, down ? T.accent : T.paper, 0.6);
      if (locked && !r.small) D.shade(c, path, D.rr(r.x, r.y, r.w, r.h, 0), 0.75);
      D.text(c, r.key, r.x + r.w / 2, r.y + r.h / 2 + (down ? 0.6 : 0.2), r.small ? size * 0.7 : size, { colour: T.ink, stroke: locked && !r.small ? size * 0.2 : 0, strokeColour: T.paper });
    });
  }

  // ---------- The beat pad, on hold ----------
  function padRect() { var k = Lay.keys; return { x: k.x, y: k.y, w: k.w, h: k.h }; }

  function drawPad(c, v, h) {
    var r = padRect();
    var path = D.rr(r.x, r.y, r.w, r.h, 2);
    D.solid(c, path, T.ink, 0.8, T.paper);
    var s = Math.max(Lay.tmin, 3);
    var bar = v.kind === "hold" ? currentBar(v, h) : null;
    // four lamps: the beats of the bar
    var lampY = r.y + r.h * 0.14, lampR = Math.min(r.w * 0.06, r.h * 0.07);
    var beatNow = -1, beatT = 0;
    if (v.kind === "hold") {
      if (h >= v.countAt && h < v.barsAt) { beatNow = Math.floor((h - v.countAt) / v.b0); beatT = ((h - v.countAt) / v.b0) % 1; }
      else if (bar && h < bar.end) { beatNow = Math.floor((h - bar.t) / bar.b); beatT = ((h - bar.t) / bar.b) % 1; }
    }
    for (var i = 0; i < 4; i++) {
      var lx = r.x + r.w * (0.2 + i * 0.2);
      var lit = i === beatNow && beatT < 0.5;
      D.solid(c, D.ell(lx, lampY, lampR, lampR), lit ? T.accent : T.ink, 0.45, T.paper);
      if (lit && !shell.reduceMotion) {
        D.ink(c, 0.3, T.paper);
        for (var a = 0; a < 6; a++) {
          var an = a * Math.PI / 3;
          c.beginPath(); c.moveTo(lx + Math.cos(an) * lampR * 1.4, lampY + Math.sin(an) * lampR * 1.4); c.lineTo(lx + Math.cos(an) * lampR * 1.9, lampY + Math.sin(an) * lampR * 1.9); c.stroke();
        }
      }
    }
    // the lane: notes run in from the right to the ring
    var laneY = r.y + r.h * 0.5, tx = r.x + r.w * 0.2, end = r.x + r.w - 2;
    var ahead = 1.5;                        // seconds of notes shown
    var span = end - tx;
    D.ink(c, 0.35, T.paper);
    c.beginPath(); c.moveTo(r.x + 2, laneY); c.lineTo(end, laneY); c.stroke();
    var ring = Math.min(r.h * 0.13, r.w * 0.09);
    var flash = floats.length && floats[floats.length - 1].t < 0.15 ? floats[floats.length - 1].kind : null;
    D.solid(c, D.ell(tx, laneY, ring, ring), flash === "perfect" || flash === "close" ? T.accent : T.ink, 0.7, T.paper);
    D.ink(c, 0.35, T.paper);
    c.beginPath(); c.arc(tx, laneY, ring * 0.55, 0, Math.PI * 2); c.stroke();
    if (v.kind === "hold") {
      // the count-in, as ghost notes
      if (h < v.barsAt + 0.2) {
        for (var ci = 0; ci < 4; ci++) {
          var ct = v.countAt + ci * v.b0, cx = tx + (ct - h) / ahead * span;
          if (cx < r.x + 1 || cx > end) continue;
          D.ink(c, 0.35, T.paper);
          c.beginPath(); c.arc(cx, laneY, ring * 0.45, 0, Math.PI * 2); c.stroke();
        }
      }
      v.notes.forEach(function (n) {
        var x = tx + (n.t - h) / ahead * span;
        if (x > end + 1 || x < r.x - 2) return;
        if (n.state === 1 || n.state === 2) {
          var k = clamp((h - n.hitAt) / 0.25, 0, 1);
          if (k >= 1) return;
          D.ink(c, 0.35, T.paper);
          for (var a2 = 0; a2 < 6; a2++) {
            var an2 = a2 * Math.PI / 3 + 0.3;
            c.beginPath(); c.moveTo(tx + Math.cos(an2) * ring * (1 + k), laneY + Math.sin(an2) * ring * (1 + k)); c.lineTo(tx + Math.cos(an2) * ring * (1.4 + k * 1.4), laneY + Math.sin(an2) * ring * (1.4 + k * 1.4)); c.stroke();
          }
          return;
        }
        if (n.state === 3) {
          D.line(c, [[x - ring * 0.4, laneY - ring * 0.4], [x + ring * 0.4, laneY + ring * 0.4]], 0.6, T.red);
          D.line(c, [[x + ring * 0.4, laneY - ring * 0.4], [x - ring * 0.4, laneY + ring * 0.4]], 0.6, T.red);
          return;
        }
        if (n.state === 4) return;
        var down = n.beat % 1 === 0 && n.beat === 0;
        D.solid(c, D.ell(x, laneY, ring * (down ? 0.6 : 0.5), ring * (down ? 0.6 : 0.5)), T.paper, 0.5);
      });
      // bar lines
      (v.bars || []).forEach(function (b) {
        var x = tx + (b.t - h) / ahead * span;
        if (x < r.x + 1 || x > end) return;
        D.ink(c, 0.25, T.paper);
        c.beginPath(); c.moveTo(x, laneY - ring * 1.1); c.lineTo(x, laneY + ring * 1.1); c.stroke();
      });
    }
    // underneath: what's going on, in words
    var word = "";
    if (v.kind === "dial") word = h < v.dialAt ? "Cut off" : "Redialling";
    else if (h < v.countAt) word = "Please hold";
    else if (h < v.barsAt) word = String(Math.min(4, Math.floor((h - v.countAt) / v.b0) + 1));
    else if (bar && bar.first && h < bar.t + bar.b * 4) word = "Fast version";
    else if (bar && bar.last) word = "You're next";
    if (word) D.text(c, word, r.x + r.w / 2, r.y + r.h * 0.83, s * (word.length < 3 ? 1.6 : 1), { colour: T.paper });
  }

  // ---------- Floating words ----------
  // over the beat pad, one at a time
  function laneFloat(kind, text, life) {
    floats = floats.filter(function (f) { return f.key; });
    floats.push({ kind: kind, text: text, t: 0, life: life });
  }

  function drawFloats(c) {
    var r = padRect();
    floats.forEach(function (f) {
      var k = f.t / f.life, size = Math.max(Lay.tmin, 3.2);
      var x, y;
      if (f.key) {
        var kr = keyRects().filter(function (q) { return q.key === f.key; })[0];
        if (!kr) return;
        x = kr.x + kr.w / 2; y = kr.y - 1;
      } else { x = r.x + r.w * 0.2; y = r.y + r.h * 0.36; }
      c.save();
      c.globalAlpha = 1 - k * k;
      D.text(c, f.text, x, y - k * 3, size, { base: "bottom", stroke: size * 0.3,
        colour: f.kind === "miss" || f.kind === "stray" ? T.red : f.kind === "perfect" || f.kind === "good" ? T.accent : T.paper });
      c.restore();
    });
  }

  // ---------- Speech bubbles ----------
  function wrapAll(c, text, maxW) {
    var ws = text.split(" "), lines = [""];
    ws.forEach(function (wd) {
      var tryLine = lines[lines.length - 1] ? lines[lines.length - 1] + " " + wd : wd;
      if (c.measureText(tryLine).width > maxW && lines[lines.length - 1]) lines.push(wd);
      else lines[lines.length - 1] = tryLine;
    });
    return lines;
  }

  function drawBubbles(c, v, h, placed) {
    // the phone's bubble: whoever's on the line
    var cur = null;
    for (var i = talks.length - 1; i >= 0; i--) {
      var tk = talks[i];
      if (h >= tk.t && h < tk.end + 0.5) { cur = tk; break; }
    }
    if (cur) {
      var b = Lay.bubble;
      var top = b.side === "right" ? Lay.note.y + (Lay.note.h || 0) + 2.4 : b.y;
      if (b.side === "right" && (v.kind === "hold" || v.kind === "agent")) top = Lay.note.y + (Lay.note.h || 0) + 2.4;
      var bx0 = b.side === "down" && Lay.note.dw ? Math.max(b.x, Lay.note.x + Lay.note.dw + 2) : b.x;
      var box = { x: bx0 * U, y: top * U, w: (b.right - bx0) * U, bottom: b.bottom * U };
      var anchor = { x: (Lay.lcd.x + 1) * U, y: (Lay.lcd.y + Lay.lcd.h * 0.5) * U };
      if (b.side === "down") anchor = { x: (Lay.lcd.x + Lay.lcd.w * 0.3) * U, y: (Lay.phone.y - 3.2) * U };
      var fade = clamp((cur.end + 0.5 - h) * 4, 0, 1);
      bubble(c, cur.text.toUpperCase(), box, anchor, b.side, Math.min(fade, shell.reduceMotion ? 1 : clamp((h - cur.t) * 9, 0, 1)), cur.who === "dept", placed);
    }
    // what you say back: in your own bubble where there's room for one,
    // otherwise in the phone's space while the phone isn't talking
    if (react.said && react.saidT < 2.2 && (Lay.youBubble || !cur)) {
      var R = Lay.you.R;
      var yb = Lay.youBubble || { x: Lay.bubble.x, y: Lay.bubble.side === "right" ? Lay.note.y + (Lay.note.h || 0) + 2.4 : Lay.bubble.y,
                                   right: Lay.bubble.side === "right" ? Lay.bubble.right : Math.min(Lay.phone.x - 2, WW - 2), bottom: Lay.hatTop - 1.5 };
      var yAnchor = { x: (Lay.you.x - R * 0.3) * U, y: (Lay.hatTop + R * 0.4) * U };
      bubble(c, react.said.toUpperCase(), { x: yb.x * U, y: yb.y * U, w: (yb.right - yb.x) * U, bottom: yb.bottom * U }, yAnchor, "down",
        clamp((2.2 - react.saidT) * 4, 0, 1) * (shell.reduceMotion ? 1 : clamp(react.saidT * 9, 0, 1)), false, placed);
    }
  }

  // A speech bubble: paper, a thick ink outline, a tail to the speaker
  // (DESIGN.md, section 7). box: the room it has, in CSS pixels.
  function bubble(c, text, box, anchor, side, alpha, dashed, placed) {
    var size = N.flags.clip ? clamp(U * 3.6, 12, U * 4.2) : clamp(U * 3.3, 12, 20);
    var lines;
    for (;;) {
      c.font = size + "px " + T.display;
      lines = wrapAll(c, text, box.w - size * 1.2);
      if (lines.length <= 2 || size <= 12) break;
      size = Math.max(12, size - 1);
    }
    var lh = size * 1.04, pad = size * 0.55;
    var tw = 0;
    lines.forEach(function (l) { tw = Math.max(tw, c.measureText(l).width); });
    var bw = tw + pad * 2, bh = lines.length * lh + pad * 1.15;
    var bx, by;
    if (side === "right") {
      bx = box.x + Math.max(0, (box.w - bw) / 2);
      by = box.y;
      if (box.bottom && by + bh > box.bottom) by = Math.max(box.y - (by + bh - box.bottom), box.y - size);
    } else {
      bx = clamp(anchor.x - bw * 0.35, box.x, box.x + box.w - bw);
      by = Math.max(box.y, (box.bottom || anchor.y) - bh);
    }
    for (var k = 0; k < placed.length; k++) {
      var o = placed[k];
      if (bx < o.x + o.w + 4 && bx + bw + 4 > o.x && by < o.y + o.h + 4 && by + bh + 4 > o.y) by = o.y + o.h + 6;
    }
    placed.push({ x: bx, y: by, w: bw, h: bh });
    c.save();
    c.globalAlpha = alpha;
    var r = Math.min(9, bh / 2);
    c.beginPath();
    if (side === "right") {
      var ty = clamp(anchor.y, by + r + 4, by + bh - r - 4);
      c.moveTo(bx + r, by);
      c.arcTo(bx + bw, by, bx + bw, by + bh, r);
      c.lineTo(bx + bw, ty - 5);
      c.lineTo(Math.max(anchor.x, bx + bw + 6), anchor.y);
      c.lineTo(bx + bw, ty + 5);
      c.arcTo(bx + bw, by + bh, bx, by + bh, r);
      c.arcTo(bx, by + bh, bx, by, r);
      c.arcTo(bx, by, bx + bw, by, r);
    } else {
      var tx = clamp(anchor.x, bx + 14, bx + bw - 14);
      c.moveTo(bx + r, by);
      c.arcTo(bx + bw, by, bx + bw, by + bh, r);
      c.arcTo(bx + bw, by + bh, bx, by + bh, r);
      c.lineTo(tx + 7, by + bh);
      c.lineTo(anchor.x, Math.max(anchor.y, by + bh + 6));
      c.lineTo(tx - 6, by + bh);
      c.arcTo(bx, by + bh, bx, by, r);
      c.arcTo(bx, by, bx + bw, by, r);
    }
    c.closePath();
    c.fillStyle = T.paper;
    c.fill();
    c.lineWidth = 2.4;
    c.lineJoin = "round";
    c.strokeStyle = T.ink;
    if (dashed) c.setLineDash([6, 4]);
    c.stroke();
    c.setLineDash([]);
    c.fillStyle = T.ink;
    c.textAlign = "center";
    c.textBaseline = "top";
    lines.forEach(function (l, i) { c.fillText(l, bx + bw / 2, by + pad * 0.62 + i * lh); });
    c.restore();
  }

  // ---------- The arrow: the one thing to deal with now ----------
  function hint(v, h) {
    if (shell.state() !== "playing") return null;
    var how = touching() ? "touch" : lastMode || "keys";
    if (call === 0 && v.kind === "hold" && learned.beat < 6 && h >= v.countAt) {
      var r = padRect();
      return { x: r.x + r.w * 0.2, y: r.y + r.h * 0.5 + Math.min(r.h * 0.13, r.w * 0.09) + 1.2, dir: "up",
               word: how === "touch" ? "Tap anywhere on the beat" : how === "mouse" ? "Click on the beat" : "Space on the beat", left: true };
    }
    if (call === 0 && v.kind === "level" && !learned.menu) {
      var lv = levelOf(v), right = null;
      lv.options.forEach(function (o) { if (o.right) right = o; });
      if (right && h >= right.heard1 + 0.6) {
        var kr = keyRects().filter(function (q) { return q.key === String(right.n); })[0];
        return { x: Lay.keys.x - 0.6, y: kr.y + kr.h / 2, word: how === "touch" ? "Tap " + right.n : how === "mouse" ? "Click " + right.n : "Press " + right.n, dir: "right" };
      }
      if (h < (v.items[1] ? v.items[1].t : 0)) {
        return { x: Lay.note.x + Math.min(Lay.note.dw || 20, 26) * 0.5, y: Lay.note.y + (Lay.note.h || 12) + 1.2, word: "Your problem", dir: "up" };
      }
    }
    return null;
  }

  function drawArrow(c, x, y, word, dir, left) {
    var bob = shell.reduceMotion ? 0 : Math.abs(Math.sin(animT * 4)) * -1.4;
    var size = Math.max(3, Lay.tmin);
    c.save();
    if (dir === "right") c.translate(x + bob, y);
    else c.translate(x, y + (dir === "up" ? -bob : bob));
    c.save();
    if (dir === "right") c.rotate(-Math.PI / 2);
    if (dir === "up") c.scale(1, -1);
    c.beginPath();
    c.moveTo(-1.4, -4.4); c.lineTo(1.4, -4.4); c.lineTo(1.4, -1.8); c.lineTo(3, -1.8); c.lineTo(0, 1.4); c.lineTo(-3, -1.8); c.lineTo(-1.4, -1.8);
    c.closePath();
    c.fillStyle = T.paper;
    c.fill();
    D.ink(c, 0.55);
    c.stroke();
    c.restore();
    if (dir === "right") D.text(c, word, -5.2, 0, size, { align: "right", colour: T.paper, stroke: size * 0.32 });
    else if (dir === "up" && left) D.text(c, word, 4, 2.6, size, { align: "left", colour: T.paper, stroke: size * 0.32 });
    else if (dir === "up") D.text(c, word, 0, 5.6, size, { base: "top", colour: T.paper, stroke: size * 0.32 });
    else D.text(c, word, 0, -5.2, size, { base: "bottom", colour: T.paper, stroke: size * 0.32 });
    c.restore();
  }

  // ---------------------------------------------------------------------------
  // Start it up
  // ---------------------------------------------------------------------------
  shell = N.createGame({
    root: root,
    slug: "hold-music",
    title: "Hold Music",
    stamp: "Please hold",
    tilt: -5,
    note: "Four calls. One problem. Your call is important to us.",
    pitch: "Phone a company. Remember the menu. Tap along to the hold music. Get put through to someone else.",
    hints: {
      keys: "1 to 9 to pick an option. Space on the beat while you're on hold. P to pause, M to mute.",
      touch: "Tap the keypad to pick an option. On hold, tap anywhere on the beat."
    },
    againLabel: "Call again",
    daily: true,
    smallCallouts: true,
    keys: { up: [], down: [], left: [], right: [], action: ["Space"] },
    reset: reset,
    update: function (dt) { update(dt); },
    render: function () { render(); },
    resize: resize
  });
  T = shell.tokens;
  D.init(T, U * DPR);

  // Keys: numbers for the menu, Space for the beat. Timed from the event.
  document.addEventListener("keydown", function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
    if (shell.state() !== "playing") return;
    var t = e.target;
    if (t && t.closest && t.closest(".kit-bar") && (e.key === "Enter" || e.key === " ")) return;
    var m = /^(?:Digit|Numpad)([0-9])$/.exec(e.code || "");
    var d = m ? m[1] : null;
    if (d != null) {
      e.preventDefault();
      lastMode = "keys";
      presses.push({ kind: "key", key: d, t: Line.tapTime(e.timeStamp), via: "keys" });
      return;
    }
    if (e.code === "Space") {
      e.preventDefault();
      lastMode = "keys";
      presses.push({ kind: "beat", t: Line.tapTime(e.timeStamp), via: "keys" });
    }
  });

  // Taps and clicks: a key on the keypad, or anywhere on hold
  root.addEventListener("pointerdown", function (e) {
    if (shell.state() !== "playing") return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    var tg = e.target;
    if (tg && tg.closest && tg.closest(".kit-bar, .kit-panel, button, a")) return;
    lastMode = e.pointerType === "mouse" ? "mouse" : "touch";
    var t = Line.tapTime(e.timeStamp);
    var box = root.getBoundingClientRect();
    var wx = (e.clientX - box.left) / U, wy = (e.clientY - box.top) / U;
    if (padOn(ph)) { e.preventDefault(); presses.push({ kind: "beat", t: t, via: e.pointerType }); return; }
    var hit = null;
    keyRects().forEach(function (r) {
      var slop = Lay.touch ? r.w * 0.06 : 0;
      if (wx >= r.x - slop && wx <= r.x + r.w + slop && wy >= r.y - slop && wy <= r.y + r.h + slop) hit = r;
    });
    if (hit) { e.preventDefault(); presses.push({ kind: "key", key: hit.key === "*" || hit.key === "#" ? "x" : hit.key, t: t, via: e.pointerType }); }
  });

  if (document.fonts && document.fonts.load) {
    document.fonts.load("12px " + T.display).then(function () { back = null; front = null; });
  }

  if (DEBUG) {
    window.__holdMusic = {
      peek: function () {
        var p = ph, h = Line.heard();
        var right = null;
        if (p.kind === "level") level().options.forEach(function (o) { if (o.right) right = o; });
        return {
          state: shell.state(), call: call, kind: p.kind, t0: p.t0, now: Line.now(), heard: h, mode: Line.mode(), latency: Line.latency(),
          perf: performance.now(), score: Math.round(run.score), patience: run.patience, signal: signal,
          cutoffs: run.cutoffs, transfers: run.transfers, drops: run.drops, hits: run.hits, notes: run.notes, perfects: run.perfects,
          unlock: p.unlock, againAt: p.againAt, lock: info().lock, li: p.li,
          right: right ? { n: right.n, heard1: right.heard1, heard2: right.heard2 } : null,
          notesAhead: p.kind === "hold" ? p.notes.filter(function (n) { return !n.state; }).map(function (n) { return n.t; }) : [],
          barsAt: p.barsAt, queue: p.kind === "hold" ? queueLeft(p, h) : null,
          keys: keyRects().map(function (r) { return { key: r.key, x: (r.x + r.w / 2) * U, y: (r.y + r.h / 2) * U }; }),
          pad: (function () { var r = padRect(); return { x: (r.x + r.w / 2) * U, y: (r.y + r.h / 2) * U }; })(),
          U: U, run: run
        };
      },
      bot: function (profile) { bot = profile; },
      taps: function () { return tapLog.slice(); },
      setMods: function (m) { Object.assign(mods, m); },
      longLines: function () {
        var out = [], lines = [];
        CALLS.forEach(function (c) { lines.push(c.welcome); c.agent.lines.forEach(function (l) { lines.push(l); }); });
        DEPTS.forEach(function (d) { lines.push(d.line); });
        VO.concat(THANKS).forEach(function (l) { lines.push(l); });
        ["Please choose now.", "Here they are again.", "Sorry, I didn't catch that.", "Transferring you now.", "Returning you to the menu.",
         "Let's skip that one.", "You are now number 12 in the queue.", "Thank you for calling A Company.", "Press 1 for billing."].forEach(function (l) { lines.push(l); });
        Object.keys(CATS).forEach(function (k) {
          lines.push(CATS[k].q);
          CATS[k].values.forEach(function (v) { lines.push(optionText(k, v, 7, false)); lines.push(optionText(k, v, 7, true)); });
        });
        var b = Lay.bubble, c = ctx;
        var size = clamp(U * 3.3, 12, 20);
        c.font = size + "px " + T.display;
        lines.forEach(function (l) { var n = wrapAll(c, l.toUpperCase(), (b.right - b.x) * U - size * 1.2).length; if (n > 2) out.push(n + ": " + l); });
        return out;
      },
      facts: function () { return facts; },
      plan: function () { return plan; }
    };
  }
})();
