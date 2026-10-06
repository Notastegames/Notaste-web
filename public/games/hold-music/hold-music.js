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
// 4. Cancellations. Two questions, the options the other way round ("For
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
// HOLD. A count-in bar, with your place in the queue read over it, then one
// bar off the queue for every bar you stay on the line. The notes you tap
// are the tune's own (line.js), and they ride the curly cord from the phone
// to a ring at your handset: tap as each one gets there, while you nod, the
// bobble bounces and your free mitten drums. Each note owns the taps near it
// (up to 0.4 of a beat, never past halfway to its neighbours): the first
// decides it, a hit in the window or a miss (early or late) outside it,
// and any more are ignored, so a late tap is one mistake, not two. The
// signal has four bars: a missed note costs one, a stray tap (in no note's
// zone) costs one, once per gap between notes, and two hits in a row win
// one back. Lose all four and you're cut off: a dial tone, a redial, and two
// more places in the queue. Back from a pause or a tab switch mid-hold, the
// notes still to come are let off and the hold picks up at the start of its
// bar after a fresh count-in: a pause never costs anything.
//
// PATIENCE. Three to start, five at most. A wrong number, a dropped call or
// a cut-off each cost one. Run out and you hang up, and the round ends.
//
// BETWEEN CALLS (shell.interlude) pick one of three ways to get ready. Each
// helps a different kind of caller and costs something, and its card says
// what: Put the kettle on (one more patience, for someone about to run out;
// the queue is three longer), Put it on speaker (the beat 40ms more
// forgiving, for unsteady hands; no clean-line bonus), Press 0 a lot (skip
// the first question and its points, faster music; a clean line pays 200
// more, a bet for steady hands), Say you're a new customer (half the queue
// and no fast version, for anyone who keeps being cut off; the call pays 100
// less: they sell you broadband), Find a pen (your number on the note as it's read, for
// a poor memory; the menu scores half), Ask for a callback (nothing). Tested
// with scripted callers of different skills: no single pick wins for all.
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
// clean line, worth 100 more (300 after Press 0 a lot). Every call put
// through: 200 (100 if Sales sold you broadband). Finish and every patience
// left, up to three, is worth 100. A flawless run scores 4,600, and up to
// 4,900 by betting on clean lines.
//
// THE LADDER (DESIGN.md, section 6). Finish all four calls: Approved at
// 4,450 or more, Pending review at 3,400 or more, Not approved below that.
// Hang up on Complaints or Cancellations: Not approved. Hang up any sooner:
// Rejected. Tuned with scripted callers picking from what they're offered:
// good ones are Approved about one run in four (nearly always when they bet
// on Press 0 a lot and keep a clean line), average ones Pending review,
// beginners Not approved.
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
  var PATIENCE = 3, PATIENCE_MAX = 5;   // patience left at the end scores up to PATIENCE
  var SIGNAL = 4;              // bars of signal
  var RESTORE = 2;             // hits in a row to win a bar back
  var CUT_QUEUE = 2;           // places added to the queue when you're cut off
  var AHEAD = 0.2;             // the next part of a call is queued this soon
  var PTS = { menu: 100, retry: 50, hold: 600, clean: 100, call: 200, patience: 100, zero: 200, sold: 100 };
  var APPROVED = 4450, PENDING = 3400;
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

  var CALLS = [
    { dept: "Billing", menuBpm: 96, hold: [92], key: [0, 0], fastAt: null, queue: 4, cats: ["topic"], opts: 4,
      lock: false, scatter: false, flip: false, vo: false, arr: { please: "easy" },
      welcome: "Thank you for calling A Company.",
      agent: { name: "Sam", look: "glasses", lines: ["Sam, Billing. Oh, that's a fault.", "I'll put you through to Faults."] },
      brief: "Find your problem on the note. When the menu reads it out, press its number. On hold, tap as each note reaches the ring at your ear.",
      done: "Sam was lovely. Sam couldn't help. Sam has put you through to Faults." },
    { dept: "Faults", menuBpm: 104, hold: [100], key: [0, 0], fastAt: null, queue: 5, cats: ["place", "light"], opts: 4,
      lock: true, scatter: false, flip: false, vo: true, arr: { please: "tune" },
      welcome: "Welcome back. We missed you.",
      agent: { name: "Jo", look: "bun", lines: ["Jo, Faults. I can see it from here.", "It has to be a complaint first."] },
      brief: "The keypad now stays locked until every option has been read, so remember your number. On hold, lose all your signal and you're cut off.",
      done: "Jo can see the fault from her desk. Jo is not allowed to touch it." },
    { dept: "Complaints", menuBpm: 112, hold: [104, 120], key: [0, 2], fastAt: 3, queue: 5, cats: ["since", "topic"], opts: 5,
      lock: true, scatter: true, flip: false, vo: true, arr: { please: "tune", fast: "medium" },
      welcome: "Our options have changed.",
      agent: { name: "Dee", look: "perm", lines: ["Dee, Complaints. Honestly, I'd leave.", "I didn't say that. Cancellations next."] },
      brief: "Our options have changed: the numbers come in any order. Halfway through the hold the fast version starts, with extra notes and gaps.",
      done: "Dee agrees with you completely. Dee has been asked not to." },
    { dept: "Cancellations", menuBpm: 120, hold: [112, 132], key: [0, 3], fastAt: 3, queue: 5, cats: ["tried", "place"], opts: 5,
      lock: true, scatter: true, flip: true, vo: true, arr: { please: "tune", fast: "hard" },
      welcome: "Thanks for calling. Again.",
      agent: { name: "", look: "none", lines: ["Cancellations. Hello, my name is"] },
      brief: "The options come the other way round now: the thing first, then its number. The fast version is faster.",
      done: "" }
  ];

  // say: how you'd name it in the middle of a sentence
  var DEPTS = [
    { name: "Lanyards", say: "Lanyards", line: "Lanyards. None left for you." },
    { name: "Restructuring", say: "Restructuring", line: "Restructuring. Back in March." },
    { name: "Pens", say: "Pens", line: "Pens. All our pens are in use." },
    { name: "The car park", say: "the car park", line: "The car park. It's raining." },
    { name: "Brand refresh", say: "Brand Refresh", line: "Brand Refresh. New font, same us." },
    { name: "Customer delight", say: "Customer Delight", line: "Customer Delight. We're closed." }
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

  // What you say to the phone. Always about the phone. A wrong number gets
  // one of the first two as you press it, or the third when the department
  // you didn't want answers.
  var YOU = {
    transfer: ["I pressed {n}, you melon.", "That was {n}. I pressed {n}.", "Not {dept}. Never {dept}."],
    drop: ["I was thinking.", "Hang on. Hang on."],
    cut: ["Don't you dare.", "I was number {q}.", "Hello. Hello. Hello."],
    hang: ["Right. That's it.", "I'm writing a letter."],
    dead: ["Hello. Hello.", "You absolute weapon."]
  };

  // Ways to get ready for the next call. Each one helps somebody and costs
  // something, and its card says what. Patience left at the end only scores
  // up to three, so the kettle's is for emergencies.
  var CHOICES = [
    { id: "kettle", label: "Put the kettle on", detail: "One more patience, for emergencies. The queue is three longer: you were in the kitchen.",
      apply: function (m, r) { r.patience = Math.min(PATIENCE_MAX, r.patience + 1); m.queue += 3; m.kettle = true; } },
    { id: "speaker", label: "Put it on speaker", detail: "The beat is 40ms more forgiving. The whole house can hear it: no clean-line bonus.",
      apply: function (m) { m.speaker = true; } },
    { id: "zero", label: "Press 0 a lot", detail: "Skips the first question and its points. A clean line pays 200 more. The music is faster.",
      apply: function (m) { m.skip = true; m.bpm += 8; m.zero = true; } },
    { id: "new", label: "Say you're a new customer", detail: "Sales answer quickly: half the queue, and no fast version. They sell you broadband: 100 points.",
      apply: function (m) { m.half = true; } },
    { id: "pen", label: "Find a pen", detail: "Your number goes on the note as it's read. The menu scores half.",
      apply: function (m) { m.pen = true; } },
    { id: "callback", label: "Ask for a callback", detail: "They'll call you back. They won't. Nothing changes.",
      apply: function () {} }
  ];

  var RANKS = [
    "You reached Cancellations, on the beat, and the line went dead. A Company considers this resolved.",
    "Four departments, one problem. It has been passed to the relevant team, which is Billing.",
    "You got all the way through, and all the way back to the start.",
    "Your call was important to us. Briefly."
  ];
  // after "You hung up on ...": what A Company makes of it
  var HUNG = { Complaints: "Complaints have been noted. By you.", Cancellations: "You were nearly cancelled. Nearly." };

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  var shell = null, T = null, ctx = null;
  var W = 1, H = 1, DPR = 1, U = 1, WW = 100, WH = 100;
  var Lay = {};
  var plan = [], facts = null, run = null, st = null, mods = null, nextMods = null;
  var call = 0, ph = null, prevPh = null;
  var talks = [], floats = [], presses = [], keyFlash = {}, lcdFlash = null, cues = [];
  var signal = SIGNAL, hitRun = 0, strayGap = -1;
  var react = { shout: 0, steam: 0, drum: 0, puff: 0, cut: 0, said: null, saidT: 0, sweatT: 0 };
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

  function freshMods() { return { queue: 0, speaker: false, skip: false, bpm: 0, half: false, pen: false, kettle: false, zero: false }; }

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
    talks = []; floats = []; presses = []; cues = [];
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
  // you say something to the phone. o: { n, q, dept, line (one of the kind's lines) }
  function youSay(kind, o) {
    o = o || {};
    var line = (o.line != null ? YOU[kind][o.line] : pick(YOU[kind]))
      .replace(/\{n\}/g, o.n || "1").replace(/\{q\}/g, o.q || "2").replace(/\{dept\}/g, o.dept || "Lanyards");
    react.said = line;
    react.saidT = 0;
  }
  // something to do when a moment is heard (heard time)
  function cue(t, fn) { cues.push({ t: t, fn: fn }); }
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
      // the menu starts talking as it picks up
      p.end = t + 0.1;
      p.next = function (t1) {
        if (p.after === "level") go("level", t1, { li: p.li, retry: true });
        else if (p.after === "hold") go("hold", t1, { queue: p.queue, reconnect: true });
        else go("welcome", t1);
      };
    },

    welcome: function (p) {
      var b = menuBeat();
      var beats = 3;
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
      if (p.li + 1 >= plan[call].levels.length) st.value = holdWorth() / plannedNotes(queueLength());
      speak(p.t0, 1.2 * b, "voice", pick(THANKS));
      p.end = p.t0 + 1.5 * b;
      p.next = function (t1) {
        if (p.li + 1 < plan[call].levels.length) go("level", t1, { li: p.li + 1 });
        else go("hold", t1, { queue: queueLength(), reconnect: false });
      };
    },

    // A wrong number: through to a department that can't help, and back.
    // The menu waits a beat, so what you said gets its moment first.
    transfer: function (p) {
      var b = menuBeat(), t = p.t0 + b;
      speak(t, 1.8 * b, "voice", "Transferring you now.");
      Line.sched(t + 2 * b - 0.1, function (a) { Line.inst.click(a, "fx"); }, "fx");
      speak(t + 2 * b, 3.6 * b, "dept", p.dept.line);
      p.deptAt = t + 2 * b;
      Line.sched(t + 6 * b - 0.1, function (a) { Line.inst.click(a, "fx"); }, "fx");
      speak(t + 6 * b, 1.8 * b, "voice", "Returning you to the menu.");
      if (p.late) {
        cue(t + 5.2 * b, function () {
          youSay("transfer", { line: 2, dept: p.dept.say });
          react.shout = 1.2; react.steam = 2.6;
        });
      }
      p.end = t + 8 * b;
      p.next = function (t1) { go("level", t1, { li: p.li, retry: true }); };
    },

    // On hold: a count-in, with your place in the queue read over it, then
    // bars until you're through. Back from a pause, just the count-in.
    hold: function (p) {
      var c = info(), b = 60 / (c.hold[0] + mods.bpm);
      if (!p.resumed) {
        var text = p.reconnect ? "You are now number " + p.queue + " in the queue." : "You are number " + p.queue + " in the queue.";
        speak(p.t0, 3.6 * b, "voice", text);
      }
      p.countAt = p.t0;
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
      if (!p.resumed) signal = SIGNAL;
      hitRun = 0; strayGap = -1;
      p.end = null;
    },

    // Through to someone. Lovely, sympathetic, and no help at all.
    agent: function (p) {
      var c = info(), t = p.t0 + 0.35;
      if (st.clean && !mods.speaker) {
        run.score += PTS.clean + (mods.zero ? PTS.zero : 0);
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
        t += span + (i < c.agent.lines.length - 1 ? 0.35 : 0.2);
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
      run.score += callWorth();
      run.calls++;
    },

    hung: function (p) {
      Line.cancel("music"); Line.cancel("beat"); hush();
      Line.sched(p.t0, function (a) { Line.inst.click(a, "fx"); }, "fx");
      p.end = p.t0 + 1.1;
      p.next = function () { p.done = true; Line.bedOff(); finish(false); };
    }
  };

  // which tune bar i of this call's hold plays, in which arrangement
  function barTune(i) {
    // Sales (a new customer) never get the fast version
    var c = info(), fast = c.fastAt != null && i >= c.fastAt && !(mods && mods.half);
    var tune = fast ? "fast" : "please";
    return { fast: fast, tune: tune, ti: fast ? (i - c.fastAt) % 8 : i % 8, arr: c.arr[tune] || "tune" };
  }
  // how many notes a hold of this many bars plays, from the top
  function plannedNotes(bars) {
    var n = 0;
    for (var i = 0; i < bars; i++) {
      var bt = barTune(i);
      n += Line.taps(bt.tune, bt.arr, bt.ti).length;
    }
    return n;
  }
  // what this call's hold is worth, however long the queue
  function holdWorth() { return PTS.hold; }
  // what getting through is worth (less if Sales sold you broadband)
  function callWorth() { return PTS.call - (mods.half ? PTS.sold : 0); }

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
    var dept = pick(DEPTS);
    // either you shout now, about the number, or later, about the department
    var late = Math.random() < 1 / 3;
    if (!late) {
      youSay("transfer", { line: Math.random() < 0.5 ? 0 : 1, n: d });
      react.shout = 1.2; react.steam = 2.6;
    }
    if (losePatience()) return;
    go("transfer", Line.now() + 0.08, { li: ph.li, pressed: d, dept: dept, late: late });
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
    var c = info(), i = p.nextIdx + (p.idx0 || 0);
    var bt = barTune(i), fast = bt.fast;
    var bpm = (fast ? c.hold[1] : c.hold[0]) + mods.bpm;
    var b = 60 / bpm, t0 = p.nextT;
    Line.bar(t0, b, bt.tune, bt.ti, fast ? c.key[1] : c.key[0], bt.arr);
    Line.lead(bt.tune, bt.arr, bt.ti).forEach(function (ln) {
      var beat = ln[0], t = t0 + beat * b;
      // len: how long the tune holds this note, in beats (drawn as its tail)
      p.notes.push({ t: t, state: 0, bar: i, beat: beat, b: b, len: ln[1], pitch: ln[2] });
      Line.sched(t, function (a) { Line.inst.tick(a, beat === 0, "beat"); }, "beat");
    });
    var bar = { t: t0, end: t0 + 4 * b, b: b, bpm: bpm, i: i, fast: fast, first: fast && i === c.fastAt };
    if (c.vo && VO_BARS.indexOf(i) >= 0 && p.nextIdx < p.queue0 - 1) {
      var line = plan[call].vo[(st.vo++) % VO.length];
      speak(t0 + 0.1 * b, Math.min(7 * b, 0.5 + line.split(" ").length * 0.3), "voice", line);
      Line.duck(t0, t0 + 8 * b);
      bar.vo = line;
    }
    if (p.nextIdx === p.queue0 - 1) bar.last = true;
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
      var pts = Math.min(Math.round(st.value * (perfect ? 1 : 0.5)), holdWorth() - st.hold);
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
    // a puff of steam from one ear
    react.puff = 0.7;
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
    run.clipCut = true;
    st.clean = false;
    Line.cancel("music"); Line.cancel("beat"); hush();
    soundNow(function (a) { Line.inst.staticHit(a, 0.45, "fx"); Line.inst.click(a, "fx"); });
    shell.callout("Cut off", { tilt: -5 });
    youSay("cut", { q: String(left) });
    react.shout = 1.8; react.steam = 3; react.cut = 1;
    if (!shell.reduceMotion) shake = 0.7;
    if (losePatience()) return;
    go("dial", Line.now() + 0.7, { redial: true, after: "hold", queue: left + CUT_QUEUE, cutAt: Line.now() });
  }

  // Back from a pause in the middle of a hold: the bars you finished stay
  // finished, the notes still to come are let off, and the hold picks up
  // from the start of the bar it was in, after a fresh count-in. A pause
  // never costs anything.
  function resumed() {
    var p = ph, h = Line.heard();
    if (p.kind !== "hold" || p.done || p.end != null && h >= p.nextT) return;
    var finished = p.bars.filter(function (bar) { return bar.end <= h; }).length;
    p.notes.forEach(function (n) { if (!n.state) n.state = 4; });
    p.done = true;
    Line.cancel("music"); Line.cancel("beat"); hush();
    go("hold", Line.now() + 0.25, { queue: Math.max(1, p.queue0 - finished), reconnect: true, resumed: true,
                                     idx0: (p.idx0 || 0) + finished });
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
    run.score += callWorth();
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
      if (forcePick) o = CHOICES.filter(function (q) { return q.id === forcePick; })[0] || o;
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
    if (completed) run.score += Math.min(run.patience, PATIENCE) * PTS.patience;
    var score = Math.round(run.score);
    var rec = shell.record(score);
    var rank;
    if (completed) rank = score >= APPROVED ? 1 : score >= PENDING ? 2 : 3;
    else rank = call >= 2 ? 3 : 4;
    var dept = CALLS[call].dept;
    var heading = completed ? "Press 1 for billing." : "You hung up on " + dept + ".";
    var line = completed ? RANKS[rank - 1] : HUNG[dept] || RANKS[3];
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
  var wasPaused = false, padWas = false;
  function update(dt, input) {
    var state = shell.state();
    animT += dt;
    animate(dt, state);
    if (state !== "playing") return;
    Line.advance(dt);
    var now = Line.now(), h = Line.heard();
    if (wasPaused) { wasPaused = false; resumed(); }
    if (ph.kind === "start") {
      go("dial", now + 0.1, { after: "welcome", through: call > 0 });
    }
    // a gamepad's buttons are the beat
    var padNow = !!(input && input.beat);
    if (padNow && !padWas) { lastMode = "pad"; presses.push({ kind: "beat", stamp: performance.now(), via: "pad" }); }
    padWas = padNow;
    if (AUTOPILOT || bot) autopilot(h);
    // things to do when a moment is heard
    for (var ci = 0; ci < cues.length; ci++) {
      if (h >= cues[ci].t) { var cu = cues.splice(ci--, 1)[0]; cu.fn(); }
    }
    // presses, in the order they happened. Each event's own timestamp is
    // turned into transport time now, after the clock has moved, so a tap
    // made during a slow frame is timed from when it was made.
    presses.forEach(function (e) { if (e.t == null) e.t = Line.tapTime(e.stamp); });
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
    react.puff = Math.max(0, (react.puff || 0) - dt);
    react.cut = Math.max(0, (react.cut || 0) - dt * 1.4);
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
  // wrong. Filming a clip, it gets exactly one wrong (the first question of
  // the second call), so a clip sees a department, and it loses the beat
  // once in Complaints' fast version, so a clip sees a cut-off.
  // ---------------------------------------------------------------------------
  var AUTO = { react: [0.25, 0.45], wrong: [0, 0.08, 0.1, 0.1], spread: 0.035, sigma: 0, bias: 0, lapse: 0.03, stray: 0 };
  var CLIP = { react: [0.25, 0.45], wrong: [0, 0, 0, 0], spread: 0.03, sigma: 0, bias: 0, lapse: 0.01, stray: 0 };
  var forcePick = null;
  function gauss() { var u = 1 - Math.random(), v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

  function autopilot(h) {
    var clip = N.flags.clip && !bot;
    var prof = bot || (clip ? CLIP : AUTO), p = ph;
    if (p.kind === "level" && !p.auto) {
      var lv = level(), right = null;
      lv.options.forEach(function (o) { if (o.right) right = o; });
      var ready = info().lock ? p.unlock : right.heard1;
      var r = prof.react[0] + Math.random() * (prof.react[1] - prof.react[0]);
      var wrongP = p.retry ? (prof.wrong[call] || 0) * 0.4 : (prof.wrong[call] || 0);
      // with a pen, the number's on the note
      if (mods.pen) wrongP = 0;
      var wrong = Math.random() < wrongP;
      if (clip && call === 1 && !p.retry && !run.clipWrong) { wrong = true; run.clipWrong = true; }
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
      var c = info();
      p.notes.forEach(function (n) {
        if (n.auto == null) {
          if (clip && call === 2 && !run.clipCut && c.fastAt != null && n.bar >= c.fastAt) n.auto = -1;
          else if (Math.random() < prof.lapse) n.auto = -1;
          else n.auto = n.t + CENTRE + (prof.bias || 0) + (prof.sigma ? gauss() * prof.sigma : (Math.random() * 2 - 1) * (prof.spread || 0));
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
  // side). Three shapes:
  //   wide (desktop, 4:3 and wider): you on the left, the phone on the right,
  //     the note on the wall between, and the cord hanging in a long loop
  //     down the phone's side, along the front of the table and up to your
  //     ear.
  //   tall (a phone, full-window): the note at the top, you on the left with
  //     the handset at your left ear, the phone at the bottom right under your
  //     thumbs, and the cord running from the phone down across the table and
  //     up to your ear. The phone's bubble sits over the phone; yours over
  //     your hat, or beside you on a short screen.
  //   square (the clip frame, a phone in the page): the phone on the right,
  //     you on the left, the note and the bubbles above, the cord looping
  //     along the bottom.
  // On hold the notes of the tune ride the cord from the phone to a ring at
  // your handset, so the cord is the lane: Lay.lane is its path. Every box
  // here is in world units: { x, y, right, bottom }.
  // ---------------------------------------------------------------------------
  function layout() {
    var clip = N.flags.clip;
    var coarse = !clip && !!(window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
    var narrow = window.matchMedia && window.matchMedia("(max-width: 39.99rem)").matches;
    var wide = WW > WH * 1.15, tall = !wide && WH > 150;
    Lay.tmin = 12 / U;
    Lay.touch = coarse;
    Lay.shape = wide ? "wide" : tall ? "tall" : "square";
    // the HUD's top left block (the call and your patience)
    Lay.top = (clip ? 64 : narrow ? 46 : 72) / U;
    // the note's lettering, and how tall the note gets (two facts and a title)
    Lay.noteSize = wide ? Math.max(Lay.tmin, 4.2) : tall ? Math.max(Lay.tmin, 4.8) : Math.max(13 / U, 3.1);
    Lay.noteBottom = Lay.top + 1.5 + Lay.noteSize * 4.7;
    if (wide) layWide(coarse); else if (tall) layTall(coarse); else laySquare(coarse, clip);
    var y = Lay.you, R = y.R, f = y.flip ? -1 : 1;
    Lay.hatTop = y.y - R * 4.05;
    Lay.mouth = { x: y.x + f * R * 0.15, y: y.y - R * 2.05 + R * 0.62 };
    // where the cord leaves the handset: at your ear, or on the table on speaker
    Lay.earCord = { x: y.x + f * R * 1.02, y: y.y - R * 0.6 };
    if (!Lay.flat) Lay.flat = { x: y.x + f * R * 1.35, y: y.y + (Lay.tableTop ? R * 0.42 : -R * 0.12) };
    Lay.flatCord = { x: Lay.flat.x + f * R * 0.95, y: Lay.flat.y + R * 0.05 };
    Lay.noteR = Math.max(13 / U, Lay.noteR);
    Lay.lane = lanePath(Lay.earCord);
    Lay.laneFlat = lanePath(Lay.flatCord);
    // callouts land on the keypad: it's never needed when one lands (after a
    // wrong number, a dropped call, on hold or cut off), and it keeps them off
    // your face, the note, the cord and the bubbles
    var k = Lay.keys;
    root.style.setProperty("--hm-callouts-left", Math.round(k.x * U) + "px");
    root.style.setProperty("--hm-callouts-right", Math.round((WW - k.x - k.w) * U) + "px");
    root.style.setProperty("--hm-callouts-top", Math.round((k.y + k.h * 0.3) * U) + "px");
  }

  // The phone: keys kk across with gaps, pad around, a screen lcdH high,
  // `right` in from the right edge and `bottom` up from the bottom
  function phoneAt(kk, gap, pad, lcdH, star, right, bottom) {
    var gridW = 3 * kk + 2 * gap, gridH = 3 * kk + 2 * gap + (star ? kk * 0.6 + gap : 0);
    var pw = gridW + 2 * pad, phH = pad + lcdH + pad + gridH + pad;
    var px = WW - pw - right, py = WH - phH - bottom;
    Lay.phone = { x: px, y: py, w: pw, h: phH, pad: pad };
    Lay.lcd = { x: px + pad, y: py + pad, w: gridW, h: lcdH };
    Lay.keys = { x: px + pad, y: py + pad + lcdH + pad, w: gridW, h: gridH, kk: kk, gap: gap, star: star };
    Lay.jack = { x: px + 0.2, y: py + pad + lcdH * 0.8 };
  }

  // The phone's own bubble over the phone, its tail down to the screen
  function phoneBubble(x, y, right, bottom) {
    var l = Lay.lcd;
    Lay.bubble = { x: x, y: y, right: right, bottom: bottom, side: "down",
                   anchor: { x: l.x + l.w * 0.55, y: Lay.phone.y - 3.4 } };
  }

  function layWide(coarse) {
    // a phone on its side (a landscape phone) still gets 56px keys
    var kk = coarse ? Math.max(10, 56 / U + 0.25) : 10;
    phoneAt(kk, kk * 0.08, Math.max(2, kk * 0.16), 14, !coarse, 4, 2.5);
    var p = Lay.phone;
    Lay.table = Math.max(p.y + p.h * 0.62, Math.min(82, p.y + p.h * 0.74));
    Lay.tableTop = false;
    var R = clamp(Math.min(WW * 0.115, (p.x - 8) * 0.2, (Lay.table - Lay.top - 4) / 4.4), 11, 17);
    var yx = Math.max(R * 1.5 + 6, WW * 0.2);
    Lay.you = { x: yx, y: Lay.table, R: R, flip: false };
    var hy = Lay.table - R * 2.05;
    Lay.clock = { x: Math.max(7, yx - R * 1.75), y: Lay.top + 17, r: 5.5 };
    Lay.note = { x: yx + R * 1.3, y: Lay.top + 1, w: Math.min(48, p.x - yx - R * 1.3 - 4) };
    phoneBubble(p.x - 4, Lay.top + 0.5, WW - 2, p.y - 4);
    // yours beside your head, between you and the phone
    Lay.youBubble = { x: yx + R * 1.3, y: Math.max(Lay.noteBottom - 2, hy - R * 1.3), right: p.x - 4, bottom: hy + R * 0.5, side: "left",
                      anchor: { x: yx + R * 0.75, y: hy + R * 0.5 } };
    // the agent's frame on the wall, where the note was, their bubble beside it
    var P = { x: yx + R * 1.3, y: Lay.top + 1, w: Math.min(38, p.x - yx - R * 1.3 - 7) };
    P.h = Math.min(P.w * 1.22, Lay.table - 9 - P.y);
    P.w = Math.min(P.w, P.h / 1.1);
    Lay.portrait = P;
    Lay.agentBubble = { x: P.x + P.w + 2.5, y: Lay.top + 0.5, right: WW - 2, bottom: p.y - 4, side: "left" };
    Lay.mug = { x: Math.max(5.5, yx - R * 1.95), y: Lay.table + R * 0.12, k: R * 0.16 };
    Lay.flat = null;
    Lay.noteR = 3;
    // the cord drops down the phone's side, runs along the front of the
    // table and climbs to your ear
    Lay.laneCtl = function (j, e) { return [[j.x - 4, WH + 12], [e.x + 6, WH + 16]]; };
  }

  function layTall(coarse) {
    // keys at least 56px under your thumbs, bigger on a long screen: the beat
    // pad is the same size
    var kk = Math.max(coarse ? 56 / U + 0.3 : 14, Math.min(19, 12 + (WH - 170) * 0.2));
    phoneAt(kk, 1.2, 1.7, 17, false, 2, 2);
    var p = Lay.phone;
    Lay.table = p.y - 4;
    Lay.tableTop = true;
    // you, as big as the room allows, with a band over your hat for your bubble
    var R = clamp((Lay.table - Lay.noteBottom - 14) / 4.05, 11.5, 18);
    var yx = R * 1.95 + 2.5;
    Lay.you = { x: yx, y: Lay.table, R: R, flip: true };
    var hatTop = Lay.table - R * 4.05, right = yx + R * 1.42;
    Lay.clock = { x: WW - 9.5, y: Lay.top + 8.5, r: 6 };
    Lay.note = { x: 3, y: Lay.top + 1.5, w: Math.min(60, WW - 25) };
    // the mug at the right-hand end of the table, the phone's bubble over it
    var mk = Math.min(R * 0.15, 2.8);
    Lay.mug = { x: WW - 2.5 - mk * 2.2, y: Lay.table + 0.4, k: mk };
    phoneBubble(right + 1, Lay.noteBottom + 1, WW - 2, Lay.table - mk * 4.6 - 1.5);
    if (hatTop - Lay.noteBottom >= 12) {
      Lay.youBubble = { x: 2, y: Lay.noteBottom + 1, right: WW - 2, bottom: hatTop - 0.5, side: "down",
                        anchor: { x: yx + R * 0.3, y: hatTop + R * 0.9 } };
    } else {
      Lay.youBubble = { x: right + 1, y: Lay.noteBottom + 1, right: WW - 2, bottom: Lay.table - R * 1.6, side: "left",
                        anchor: { x: yx + R * 0.75, y: Lay.table - R * 1.45 } };
    }
    // the agent's frame: top left, where the note was, or in the right-hand
    // column on a short screen, whichever is bigger
    var aw = Math.min(56, (hatTop - 5 - (Lay.top + 1)) / 1.22);
    var bx = right + 1.5, bw = Math.min(56, WW - 3 - bx, (Lay.table - 9 - (Lay.top + 1)) / 1.22);
    var P;
    if (aw >= bw) {
      P = { x: 3, y: Lay.top + 1, w: aw, h: aw * 1.22 };
      Lay.agentBubble = { x: P.x + P.w + 3, y: Lay.top + 1, right: WW - 2, bottom: Lay.table - 2, side: "left" };
    } else {
      P = { x: WW - 3 - bw, y: Lay.top + 1, w: bw, h: bw * 1.22 };
      Lay.agentBubble = { x: 2, y: Lay.top + 1, right: P.x - 3, bottom: hatTop - 1, side: "right" };
    }
    Lay.portrait = P;
    // on speaker the handset lies on the table in front of you
    Lay.flat = { x: yx - R * 0.45, y: Lay.table + R * 0.75 };
    Lay.noteR = 3.2;
    // from the phone's side, down across the table and up to your ear
    Lay.laneCtl = function (j, e) { return [[j.x - 16, WH - 2], [Math.max(1, e.x - 15), WH + 8]]; };
  }

  function laySquare(coarse, clip) {
    var gap = coarse ? 1 : 0, pad = coarse ? 1.7 : 0;
    var lcdH = Math.max(14, 46 / U);
    var kk = coarse ? Math.max(56 / U + 0.25, 12) : clip ? 11 : 10.5;
    if (coarse) {
      // 56px keys, unless that would push the phone up under the score
      var room = WH - 46 / U - 2.8 - 1.2 - 3 * pad - lcdH - 2 * gap;
      kk = Math.max(Math.min(kk, room / 3), 44 / U);
    } else {
      gap = kk * 0.08; pad = Math.max(2, kk * 0.16);
    }
    phoneAt(kk, gap, pad, lcdH, !coarse, 1.5, coarse ? 1.2 : 2.4);
    var p = Lay.phone;
    Lay.table = coarse ? p.y + p.h - 3 : p.y + p.h * 0.6;
    Lay.tableTop = false;
    // you, with the handset at your left ear, as on a tall phone, so the
    // cord can run from the foot of the phone, under you and up to your ear
    var R = clamp(Math.min((p.x - 4) / 3.4, (Lay.table - Lay.noteBottom - 10) / 4.05), 8, 17);
    var yx = R * 1.95 + 2.5;
    Lay.you = { x: yx, y: Lay.table, R: R, flip: true };
    Lay.jack.y = p.y + p.h * 0.74;
    var hatTop = Lay.table - R * 4.05;
    Lay.clock = WH > 112 ? { x: WW - 8.5, y: Lay.top + 7, r: 5 } : null;
    Lay.note = { x: 1.6, y: Lay.top + 0.5, w: p.x - 2.6 };
    // the phone's bubble over the phone; yours over your hat
    phoneBubble(Math.min(yx + R * 1.2, p.x - 6), Lay.noteBottom + 1, WW - 1.5, p.y - 4.5);
    if (coarse) {
      // a phone in the page: the phone fills the right, so its bubble goes
      // in the column under the note, its tail across to the screen
      var l = Lay.lcd;
      Lay.bubble = { x: 1.2, y: Lay.noteBottom + 1, right: p.x - 1, bottom: hatTop - 0.5, side: "right",
                     anchor: { x: l.x + 1, y: l.y + l.h * 0.5 } };
    }
    Lay.youBubble = { x: 1.2, y: Lay.noteBottom + 0.5, right: p.x - 1.5, bottom: hatTop - 0.5, side: "down",
                      anchor: { x: yx + R * 0.3, y: hatTop + R * 0.9 } };
    // the agent's frame: on the wall over the phone, their bubble beside it
    // over your hat, or (a phone in the page) where the note was
    var P = { x: 2, y: Lay.top + 1, w: Math.min(34, p.x - 6) };
    P.h = Math.min(P.w * 1.22, hatTop - 4 - P.y);
    P.w = Math.min(P.w, P.h / 1.1);
    var oh = p.y - 6.5 - (Lay.top + 0.5), ow = Math.min(oh / 1.15, WW - 3 - (yx + R * 1.2), 40);
    if (ow > P.w) {
      P = { x: WW - 1.5 - ow, y: Lay.top + 0.5, w: ow, h: Math.min(oh, ow * 1.22) };
      Lay.agentBubble = { x: 1.2, y: Lay.top + 1, right: P.x - 3, bottom: hatTop - 0.5, side: "right" };
    } else {
      Lay.agentBubble = { x: P.x + P.w + 3, y: Lay.top + 1, right: WW - 1.5, bottom: p.y - 4.5, side: "left" };
    }
    Lay.portrait = P;
    // the mug between you and the phone
    Lay.mug = { x: Math.min(p.x - 3.5, yx + R * 1.75), y: Lay.table + R * 0.12, k: Math.min(R * 0.14, 2.6) };
    Lay.flat = { x: yx - R * 0.2, y: Lay.table + R * 0.05 };
    Lay.noteR = clip ? 2.8 : 2.6;
    // out of the foot of the phone, along the bottom under you, and up to your ear
    Lay.laneCtl = function (j, e) { return [[j.x - 14, WH + 6], [Math.max(1, e.x - 14), WH + 6]]; };
  }

  // The cord's path from the phone to the handset, as points, with the
  // distance along it from the handset end (where the ring is)
  function lanePath(end) {
    var j = Lay.jack;
    var ctl = Lay.laneCtl(j, end);
    var P0 = [j.x, j.y], P1 = ctl[0], P2 = ctl[1], P3 = [end.x, end.y];
    var pts = [];
    for (var i = 0; i <= 96; i++) {
      var t = i / 96, u = 1 - t;
      pts.push([u * u * u * P0[0] + 3 * u * u * t * P1[0] + 3 * u * t * t * P2[0] + t * t * t * P3[0],
                u * u * u * P0[1] + 3 * u * u * t * P1[1] + 3 * u * t * t * P2[1] + t * t * t * P3[1]]);
    }
    // keep it on the screen: along the bottom edge rather than off it
    pts.forEach(function (q) { q[1] = Math.min(q[1], WH - 3); q[0] = Math.max(q[0], 2.5); });
    var cum = [0];
    for (var k = pts.length - 2; k >= 0; k--) cum.unshift(cum[0] + Math.hypot(pts[k + 1][0] - pts[k][0], pts[k + 1][1] - pts[k][1]));
    return { pts: pts, cum: cum, len: cum[0], end: end };
  }

  // A point on the lane `s` along it from the ring (0) towards the phone
  function laneAt(lane, s) {
    var pts = lane.pts, cum = lane.cum, n = pts.length;
    if (s <= 0) return { x: pts[n - 1][0], y: pts[n - 1][1] };
    if (s >= lane.len) return { x: pts[0][0], y: pts[0][1] };
    var i = n - 1;
    while (i > 0 && cum[i - 1] < s) i--;
    // cum falls from the phone end (index 0) to 0 at the ring
    var a = cum[i], b = cum[i - 1] != null ? cum[i - 1] : a, k = b > a ? (s - a) / (b - a) : 0;
    var p0 = pts[i], p1 = pts[Math.max(0, i - 1)];
    return { x: p0[0] + (p1[0] - p0[0]) * k, y: p0[1] + (p1[1] - p0[1]) * k };
  }

  function lane() { return mods && mods.speaker ? Lay.laneFlat : Lay.lane; }
  // seconds of notes the lane shows: at least 200 pixels a second, so quavers
  // keep apart, and never less than a second and a half
  function laneAhead() { return clamp(lane().len * U / 200, 1.5, 2.6); }

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
    back = null; front = null; sprites = {};
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
    c.fillStyle = T.ink;
    c.fillRect(-1, Lay.table, WW + 2, WH);
    if (Lay.tableTop) {
      // the table top runs from its back edge to the bottom of the screen
      c.fillStyle = D.dots(c, T.ash, 1.6);
      c.fillRect(-1, Lay.table + 1, WW + 2, WH);
      D.ink(c, 0.8, T.paper);
      c.beginPath(); c.moveTo(-1, Lay.table); c.lineTo(WW + 1, Lay.table); c.stroke();
    } else {
      // a paper edge, its front in halftone
      c.fillStyle = D.dots(c, T.ash, 1.1);
      c.fillRect(-1, Lay.table + 2.4, WW + 2, WH);
      D.ink(c, 0.8, T.paper);
      c.beginPath(); c.moveTo(-1, Lay.table); c.lineTo(WW + 1, Lay.table); c.stroke();
      D.ink(c, 0.4, T.paper);
      c.beginPath(); c.moveTo(-1, Lay.table + 2.2); c.lineTo(WW + 1, Lay.table + 2.2); c.stroke();
    }
    D.phoneBody(c, Lay.phone);
    front = b.cv;
  }

  function render() {
    if (!ctx || !run) return;
    var state = shell.state();
    if (state !== "playing") Line.idle();
    if (state === "paused") wasPaused = true;
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
    var agentOn = portraitOn(v, h);
    // the agent's frame goes up where the note was
    if (!agentOn) drawNote(c, v, h);
    var me = drawYou(c, v, h);
    c.setTransform(1, 0, 0, 1, 0, 0);
    // only the part with something on it: the table and the phone
    var fy = Math.max(0, Math.floor(Math.min(Lay.table, Lay.phone.y - 5) * U * DPR) - 2);
    c.drawImage(front, 0, fy, front.width, front.height - fy, sx * DPR, fy + sy * DPR, front.width, front.height - fy);
    c.setTransform(DPR * U, 0, 0, DPR * U, sx * DPR, sy * DPR);
    D.mug(c, Lay.mug.x, Lay.mug.y, Lay.mug.k, mods && mods.kettle ? 1 : 0, shell.reduceMotion ? 0 : animT);
    drawHands(c, me, v, h);
    // the cord, from the phone to the handset
    var ln = me.flat ? Lay.laneFlat : Lay.lane;
    drawCord(c, ln, me.flat ? "flat" : "ear");
    drawLcd(c, v, h);
    if (padOn(v)) drawPad(c, v, h);
    else drawKeys(c, v, h);
    if (v.kind === "hold") drawLane(c, v, h, ln);
    if (agentOn) drawPortrait(c, v, h, agentOn);
    drawFloats(c);
    // words, in screen pixels, so they stay readable on a phone
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    var placed = [];
    drawBubbles(c, v, h, placed, agentOn);
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
  // On hold you play along: your head nods on every beat, the bobble on
  // your hat bounces a moment behind it, your free mitten drums whenever you
  // tap, a missed note gets a puff of steam, and being cut off gets the lot.
  function beatPhase(v, h) {
    if (v.kind !== "hold" || !v.bars) return null;
    if (h >= v.countAt && h < v.barsAt) return ((h - v.countAt) / v.b0) % 1;
    var bar = currentBar(v, h);
    if (bar && h < bar.end) return ((h - bar.t) / bar.b) % 1;
    return null;
  }

  function drawYou(c, v, h) {
    var y = Lay.you, R = y.R;
    var calm = shell.reduceMotion;
    var ph01 = calm ? null : beatPhase(v, h);
    var bob = 0, bobble = 0;
    if (ph01 != null) {
      bob = Math.max(0, 1 - ph01 * 3.2) * R * 0.1;
      // the bobble lags the nod: thrown up just after the beat, back by the next
      bobble = Math.sin(Math.min(1, ph01 * 1.6) * Math.PI) * 0.34;
    }
    if (!calm && react.cut > 0) bobble = Math.max(bobble, react.cut * 0.5);
    // look at the note while a question is read, at the phone otherwise
    var look = y.flip ? -0.2 : 0.8, up = 0.1;
    var reading = v.kind === "level" && v.items && (h < v.items[0].end + 0.4);
    if (reading) {
      look = clamp((Lay.note.x + (Lay.note.dw || 20) / 2 - y.x) / (R * 2), -1, 1);
      up = 0.9;
    } else if (v.kind === "agent" && Lay.portrait) {
      look = clamp((Lay.portrait.x + Lay.portrait.w / 2 - y.x) / (R * 2), -1, 1);
      up = 0.5;
    } else if (v.kind === "hold" && h >= v.countAt) {
      // watching the notes come along the cord
      var ring = lane().end;
      look = clamp((ring.x - y.x) / (R * 1.5) + (y.flip ? 0 : 0.5), -1, 1);
      up = -0.4;
    }
    var q = v.kind === "hold" ? (v.queue0 || 9) : 9;
    var speaker = mods && mods.speaker && (v.kind === "hold" || (v.kind === "dial" && v.after === "hold"));
    var slam = v.kind === "hung";
    var o = {
      look: look, up: up, bob: bob, bobble: bobble, flip: y.flip,
      shout: react.shout > 0 ? Math.min(1, react.shout * 2) : 0,
      brows: v.kind === "agent" ? 0.55 : 1,
      lids: v.kind === "hold" && !react.shout && q > 3 && h > (v.barsAt || 0) + 4,
      sweat: run.patience <= 1, sweatT: react.sweatT,
      steam: react.steam > 0 ? Math.min(1, react.steam) : 0,
      puff: react.puff > 0 ? Math.min(1, react.puff * 2) : 0,
      steamT: calm ? 0.3 : animT,
      cut: calm ? 0 : react.cut,
      handset: speaker || slam ? "table" : "ear"
    };
    // the jumper never moves, so it comes from a sprite
    var sp = sprite("body", y.x - R * 1.5, y.y - R * 1.6, R * 3, R * 2.9, function (sc) { D.youBody(sc, y.x, y.y, R, y.flip); });
    c.drawImage(sp.cv, sp.x, sp.y, sp.w, sp.h);
    o.noBody = true;
    var me = D.you(c, y.x, y.y, R, o);
    me.flat = speaker || slam;
    me.slam = slam;
    return me;
  }

  // your free mitten (two on speaker), and the handset when it's on the table
  function drawHands(c, me, v, h) {
    var y = Lay.you, R = y.R;
    var calm = shell.reduceMotion;
    var hit = react.drum, lift = 0;
    if (!calm) {
      // up between taps, down hard on each one
      var ph01 = beatPhase(v, h);
      lift = hit > 0 ? 0 : ph01 != null ? R * 0.42 * Math.sin(ph01 * Math.PI) : 0;
    }
    var r = me.rest;
    D.mitten(c, r.x, r.y - lift, r.r, T.paper, !y.flip);
    if (hit > 0.3 && !calm) D.burst(c, r.x, r.y + r.r * 0.3, r.r * 1.3, r.r * 2.3, Math.max(0.3, R * 0.05), 6, -Math.PI * 0.95);
    if (me.flat) {
      D.handsetFlat(c, Lay.flat.x, Lay.flat.y, R, y.flip, me.slam && !calm && (h - v.t0) < 0.8);
      if (me.slam) {
        // the mitten that put it down, still on it
        D.mitten(c, Lay.flat.x, Lay.flat.y - R * 0.3, R * 0.4, T.paper, !y.flip);
      } else if (me.rest2) {
        var r2 = me.rest2;
        D.mitten(c, r2.x, r2.y - (calm ? 0 : lift * 0.6), r2.r, T.paper, y.flip);
      }
    }
  }

  // ---------- Sprites ----------
  // The cord's hundreds of curls and the notes riding it are drawn once into
  // small canvases and copied each frame, which a phone does much faster
  var sprites = {};
  // a sprite of the box x0, y0, w, h (world units), drawn by draw(c) in world units
  function sprite(key, x0, y0, w, h, draw) {
    var sp = sprites[key];
    if (!sp) {
      var k = U * DPR, cv = document.createElement("canvas");
      cv.width = Math.max(1, Math.ceil(w * k));
      cv.height = Math.max(1, Math.ceil(h * k));
      var sc = cv.getContext("2d");
      sc.scale(k, k);
      sc.translate(-x0, -y0);
      draw(sc);
      sp = sprites[key] = { cv: cv, x: x0, y: y0, w: cv.width / k, h: cv.height / k };
    }
    return sp;
  }
  function drawCord(c, ln, which) {
    var key = "cord|" + which, sp = sprites[key];
    if (!sp) {
      // the box round the cord, with room for its curls
      var w = Math.max(0.5, Lay.you.R * 0.05), pad = w * 3;
      var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      ln.pts.forEach(function (q) { x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]); x1 = Math.max(x1, q[0]); y1 = Math.max(y1, q[1]); });
      sp = sprite(key, x0 - pad, y0 - pad, x1 - x0 + pad * 2, y1 - y0 + pad * 2, function (sc) { D.cordAlong(sc, ln.pts, w); });
    }
    c.drawImage(sp.cv, sp.x, sp.y, sp.w, sp.h);
  }
  function noteSprite(c, x, y, r, kind) {
    var key = "note|" + kind + "|" + r.toFixed(3);
    var sp = sprite(key, -r * 1.6, -r * 3.8, r * 4.6, r * 5.6, function (sc) { D.musicNote(sc, 0, 0, r, kind, T.paper); });
    c.drawImage(sp.cv, x + sp.x, y + sp.y, sp.w, sp.h);
  }

  // ---------- The lane: the tune's notes, riding the cord to your ear ----------
  function drawLane(c, v, h, ln) {
    var R = Lay.you.R, nr = Lay.noteR;
    var ahead = laneAhead(), span = ln.len;
    var ring = ln.end, calm = shell.reduceMotion;
    var ph01 = beatPhase(v, h);
    // the ring at the handset: magenta, with a paper edge; it swells on the beat
    var rr = nr * 1.75 * (calm || ph01 == null ? 1 : 1 + 0.08 * Math.max(0, 1 - ph01 * 4));
    var flash = floats.length && !floats[floats.length - 1].key && floats[floats.length - 1].t < 0.16 ? floats[floats.length - 1].kind : null;
    D.solid(c, D.ell(ring.x, ring.y, rr, rr), flash === "perfect" || flash === "close" ? T.paper : T.accent, Math.max(0.35, nr * 0.24), T.ink);
    D.ink(c, Math.max(0.3, nr * 0.16), T.ink);
    c.beginPath(); c.arc(ring.x, ring.y, rr * 0.55, 0, Math.PI * 2); c.stroke();
    // the count-in: ghost notes
    if (h < v.barsAt + 0.2) {
      for (var ci = 0; ci < 4; ci++) {
        var ct = v.countAt + ci * v.b0, s0 = (ct - h) / ahead * span;
        if (s0 < -0.5 || s0 > span) continue;
        var cp = laneAt(ln, s0);
        D.ink(c, Math.max(0.3, nr * 0.22), T.paper);
        c.beginPath(); c.arc(cp.x, cp.y, nr * 0.9, 0, Math.PI * 2); c.stroke();
      }
    }
    // bar lines: a paper tick across the cord at each bar
    (v.bars || []).forEach(function (b) {
      var s = (b.t - h) / ahead * span;
      if (s < nr || s > span) return;
      var p0 = laneAt(ln, s), p1 = laneAt(ln, s + 1);
      var nx = -(p1.y - p0.y), ny = p1.x - p0.x, nl = Math.hypot(nx, ny) || 1;
      nx /= nl; ny /= nl;
      D.line(c, [[p0.x - nx * nr * 1.6, p0.y - ny * nr * 1.6], [p0.x + nx * nr * 1.6, p0.y + ny * nr * 1.6]], Math.max(0.3, nr * 0.2), T.paper);
    });
    // the notes, last first, so the next one is on top
    for (var i = v.notes.length - 1; i >= 0; i--) {
      var n = v.notes[i];
      var s = (n.t - h) / ahead * span;
      if (s > span + nr) continue;
      if (n.state === 1 || n.state === 2) {
        // hit: a burst at the ring
        var k = clamp((h - n.hitAt) / 0.28, 0, 1);
        if (k >= 1) continue;
        if (calm) {
          c.save(); c.globalAlpha = 1 - k;
          D.burst(c, ring.x, ring.y, rr * 1.2, rr * 1.8, Math.max(0.3, nr * 0.22), 8, 0.2);
          c.restore();
        } else D.burst(c, ring.x, ring.y, rr * (1.1 + k), rr * (1.6 + k * 1.4), Math.max(0.3, nr * 0.22), 8, 0.2);
        continue;
      }
      if (n.state === 4) continue;
      if (n.state === 3) {
        // missed: it drops off the cord
        var m = clamp((h - (n.missAt || h)) / 0.6, 0, 1);
        if (m >= 1) continue;
        var mp = laneAt(ln, Math.max(0, s));
        c.save();
        c.globalAlpha = 1 - m;
        var fall = calm ? 0 : m * m * nr * 9;
        noteSprite(c, mp.x, mp.y + fall, nr * 0.85, "crotchet");
        D.line(c, [[mp.x - nr, mp.y + fall - nr], [mp.x + nr, mp.y + fall + nr]], Math.max(0.4, nr * 0.32), T.red);
        D.line(c, [[mp.x + nr, mp.y + fall - nr], [mp.x - nr, mp.y + fall + nr]], Math.max(0.4, nr * 0.32), T.red);
        c.restore();
        continue;
      }
      if (s < -nr * 2) continue;
      var p = laneAt(ln, Math.max(0, s));
      var kind = n.len <= 0.5 ? "quaver" : n.len >= 1.5 ? "minim" : "crotchet";
      noteSprite(c, p.x, p.y, nr * (n.beat === 0 ? 1.08 : 0.94), kind);
    }
  }

  // ---------- The agent, in a frame on the wall ----------
  function portraitOn(v, h) {
    if (!Lay.portrait) return null;
    if (v.kind === "agent") return { k: clamp((h - v.t0) / 0.32, 0, 1), dead: 0 };
    if (v.kind === "dead") return h < v.toneAt + 0.6 ? { k: 1, dead: clamp((h - v.t0) / 0.15, 0, 1) } : null;
    return null;
  }

  function drawPortrait(c, v, h, on) {
    var P = Lay.portrait, a = info().agent;
    var k = on.k, calm = shell.reduceMotion;
    var w = P.w, ph = P.h;
    c.save();
    if (calm) c.globalAlpha = k;
    else {
      // it pops onto the wall, with a little overshoot
      var s = k < 1 ? 0.6 + 0.48 * Math.sin(k * Math.PI * 0.62) : 1;
      c.translate(P.x + w / 2, P.y + ph / 2);
      c.scale(s, s);
      c.translate(-(P.x + w / 2), -(P.y + ph / 2));
    }
    var talking = talkingNow(h);
    var mouth = talking && talking.who === "agent" ? Math.abs(Math.sin(h * 20)) : 0;
    var look = a.look === "none" ? "none" : a.look;
    var out = D.agentCutout(c, P.x, P.y, w, ph, { look: look, mouth: mouth, tilt: Lay.shape === "tall" ? 0.03 : -0.035, dead: on.dead, staticT: calm ? 0 : h });
    // a name plate under the frame
    var label = on.dead ? "Line: dead" : (a.name ? a.name + ", " : "") + info().dept;
    var size = Math.max(Lay.tmin, Math.min(w * 0.12, 4.2));
    var tw = D.measure(c, label, size) + size * 1.2;
    var plate = D.rr(P.x + w / 2 - tw / 2, P.y + ph - size * 0.7, tw, size * 1.5, size * 0.2);
    D.solid(c, plate, T.paper, Math.max(0.35, size * 0.12));
    D.text(c, label, P.x + w / 2, P.y + ph + size * 0.06, size, { colour: on.dead ? T.red : T.ink });
    c.restore();
    Lay.portraitMouth = out.mouth;
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
    var n = Lay.note, size = Lay.noteSize;
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
        c.ellipse(size * 0.7 + lw2 / 2, ly - size * 0.05, lw2 * 0.56 + size * 0.9, size * 0.76, -0.02, 0, Math.PI * 2);
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
        var item = null, said = null;
        v.items.forEach(function (it) {
          if (h >= it.t) item = it;
          if (it.role === "opt" && it.digitAt != null && h >= it.digitAt) said = it;
        });
        var locked = info().lock && h < v.unlock && h < v.againAt;
        // the last number read stays up until the next one is read (in
        // Cancellations the number comes last, so it would only flash)
        if (item && item.role === "opt" && said && said.pass === item.pass) shown = String(levelOf(v).options[said.k].n);
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
        D.text(c, v.dept.name, l.x + l.w / 2, py + s * 0.55, fit(c, v.dept.name, s * 1.25, l.w - s));
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
      var room = l.w - l.h * 1.1 - s * 0.6;
      D.text(c, a.name || "Connected", mid, l.y + s * 1.05, fit(c, a.name || "Connected", s * 1.05, room));
      D.text(c, info().dept, mid, py + s * 0.75, fit(c, info().dept, s * 0.85, room));
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

  // a size for a word on the phone's screen that fits in maxW, never under 12px
  function fit(c, str, size, maxW) {
    var w = D.measure(c, str, size);
    return w > maxW ? Math.max(Lay.tmin, size * maxW / w) : size;
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

  // The keypad goes dark on hold: four lamps for the beats of the bar, and
  // what's going on in words. Tapping anywhere is a tap on the beat.
  function drawPad(c, v, h) {
    var r = padRect();
    var path = D.rr(r.x, r.y, r.w, r.h, 2);
    D.solid(c, path, T.ink, 0.8, T.paper);
    var s = Math.max(Lay.tmin, Math.min(r.w * 0.1, 4.2));
    var bar = v.kind === "hold" ? currentBar(v, h) : null;
    var lampY = r.y + r.h * 0.3, lampR = Math.min(r.w * 0.085, r.h * 0.12);
    var beatNow = -1, beatT = 0;
    if (v.kind === "hold") {
      if (h >= v.countAt && h < v.barsAt) { beatNow = Math.floor((h - v.countAt) / v.b0); beatT = ((h - v.countAt) / v.b0) % 1; }
      else if (bar && h < bar.end) { beatNow = Math.floor((h - bar.t) / bar.b); beatT = ((h - bar.t) / bar.b) % 1; }
    }
    for (var i = 0; i < 4; i++) {
      var lx = r.x + r.w * (0.17 + i * 0.22);
      var lit = i === beatNow && beatT < 0.5;
      D.solid(c, D.ell(lx, lampY, lampR, lampR), lit ? T.accent : T.ink, Math.max(0.4, lampR * 0.16), T.paper);
      if (lit && !shell.reduceMotion) D.burst(c, lx, lampY, lampR * 1.35, lampR * 1.8, Math.max(0.25, lampR * 0.1), 6, 0);
    }
    // what's going on, in words
    var word = "";
    if (v.kind === "dial") word = h < v.dialAt ? "Cut off" : "Redialling";
    else if (h < v.barsAt) word = String(Math.min(4, Math.max(1, Math.floor((h - v.countAt) / v.b0) + 1)));
    else if (bar && bar.first && h < bar.t + bar.b * 4) word = "Fast version";
    else if (bar && bar.last) word = "You're next";
    else if (mods && mods.speaker) word = "On speaker";
    else word = Lay.touch ? "Tap anywhere" : "On hold";
    D.text(c, word, r.x + r.w / 2, r.y + r.h * 0.66, s * (word.length < 3 ? 1.9 : 1.05), { colour: word.length < 3 || word === "Fast version" ? T.accent : T.paper });
  }

  // ---------- Floating words ----------
  // by the ring, one at a time
  function laneFloat(kind, text, life) {
    floats = floats.filter(function (f) { return f.key; });
    floats.push({ kind: kind, text: text, t: 0, life: life });
  }

  function drawFloats(c) {
    var ring = lane().end, nr = Lay.noteR;
    floats.forEach(function (f) {
      var k = f.t / f.life, size = Math.max(Lay.tmin, nr * 1.25);
      var x, y;
      if (f.key) {
        var kr = keyRects().filter(function (q) { return q.key === f.key; })[0];
        if (!kr) return;
        x = kr.x + kr.w / 2; y = kr.y - 1;
      } else {
        // beside the ring, on the side away from you, clear of your face
        x = ring.x + nr * 2.3;
        y = Math.min(ring.y + (Lay.you.flip ? nr * 3.2 : -nr * 0.2), WH - 1.5);
      }
      c.save();
      c.globalAlpha = 1 - k * k;
      // with reduced motion the words fade where they are
      var rise = shell.reduceMotion ? 0 : k * 3;
      D.text(c, f.text, x, y - rise, size, { base: "bottom", stroke: size * 0.3, align: f.key ? "center" : "left",
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

  // The phone's bubble (whoever's on the line), the agent's from their frame,
  // and yours, each in its own box on every shape of screen (see layout)
  function boxPx(b) { return { x: b.x * U, y: b.y * U, w: (b.right - b.x) * U, bottom: b.bottom * U }; }
  function ptPx(q) { return { x: q.x * U, y: q.y * U }; }

  function drawBubbles(c, v, h, placed, agentOn) {
    var cur = null;
    for (var i = talks.length - 1; i >= 0; i--) {
      var tk = talks[i];
      if (h >= tk.t && h < tk.end + 0.5) { cur = tk; break; }
    }
    var mine = react.said && react.saidT < 2.4;
    // yours first, so the phone's makes way
    if (mine) {
      var yb = Lay.youBubble;
      bubble(c, react.said.toUpperCase(), boxPx(yb), ptPx(yb.anchor), yb.side,
        clamp((2.4 - react.saidT) * 4, 0, 1) * (shell.reduceMotion ? 1 : clamp(react.saidT * 9, 0, 1)), false, placed);
    }
    if (!cur) return;
    var fade = clamp((cur.end + 0.5 - h) * 4, 0, 1);
    var alpha = Math.min(fade, shell.reduceMotion ? 1 : clamp((h - cur.t) * 9, 0, 1));
    var text = cur.text.toUpperCase();
    if (cur.who === "agent" && agentOn) {
      // the agent speaks from their frame
      var P = Lay.portrait, ab = Lay.agentBubble;
      var anc = { x: ab.side === "left" ? P.x + P.w - 1 : P.x + 1, y: P.y + P.h * 0.42 };
      bubble(c, text, boxPx(ab), ptPx(anc), ab.side, alpha, false, placed);
      return;
    }
    var b = Lay.bubble;
    var box = boxPx(b);
    // on a wide screen the phone's bubble keeps clear of the note
    if (Lay.shape === "wide" && Lay.note.dw && !agentOn) {
      var nx = (Lay.note.x + Lay.note.dw + 2) * U;
      if (nx > box.x) { box.w -= nx - box.x; box.x = nx; }
    }
    bubble(c, text, box, ptPx(b.anchor), b.side, alpha, cur.who === "dept", placed);
  }

  // A speech bubble: paper, a thick ink outline, a tail to the speaker
  // (DESIGN.md, section 7). box: the room it has, in CSS pixels. side: where
  // the tail comes out ("down", "right" or "left").
  function bubble(c, text, box, anchor, side, alpha, dashed, placed) {
    var size = N.flags.clip ? clamp(U * 3.6, 12, U * 4.2) : clamp(U * (Lay.shape === "tall" ? 3.8 : 3.3), 12, 20);
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
      // as near the speaker as the box allows
      bx = box.x + Math.max(0, box.w - bw);
      by = clamp(anchor.y - bh * 0.5, box.y, Math.max(box.y, (box.bottom || anchor.y) - bh));
    } else if (side === "left") {
      bx = box.x;
      by = clamp(anchor.y - bh * 0.6, box.y, Math.max(box.y, (box.bottom || anchor.y) - bh));
    } else {
      bx = clamp(anchor.x - bw * 0.35, box.x, box.x + box.w - bw);
      by = Math.max(box.y, (box.bottom || anchor.y) - bh);
    }
    for (var k = 0; k < placed.length; k++) {
      var o = placed[k];
      if (bx < o.x + o.w + 4 && bx + bw + 4 > o.x && by < o.y + o.h + 4 && by + bh + 4 > o.y) {
        // below the other one if it fits, otherwise above it
        if (o.y + o.h + 6 + bh <= (box.bottom || 1e9) + bh * 0.5) by = o.y + o.h + 6;
        else by = o.y - bh - 6;
      }
    }
    placed.push({ x: bx, y: by, w: bw, h: bh });
    c.save();
    c.globalAlpha = alpha;
    var r = Math.min(9, bh / 2);
    c.beginPath();
    if (side === "right" || side === "left") {
      var ty = clamp(anchor.y, by + r + 4, by + bh - r - 4);
      var ex = side === "right" ? bx + bw : bx;
      var tipX = side === "right" ? Math.max(anchor.x, bx + bw + 6) : Math.min(anchor.x, bx - 6);
      c.moveTo(bx + r, by);
      c.arcTo(bx + bw, by, bx + bw, by + bh, r);
      if (side === "right") { c.lineTo(ex, ty - 5); c.lineTo(tipX, anchor.y); c.lineTo(ex, ty + 5); }
      c.arcTo(bx + bw, by + bh, bx, by + bh, r);
      c.arcTo(bx, by + bh, bx, by, r);
      if (side === "left") { c.lineTo(ex, ty + 5); c.lineTo(tipX, anchor.y); c.lineTo(ex, ty - 5); }
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
      var ring = lane().end, nr = Lay.noteR;
      return { x: ring.x, y: ring.y + nr * 1.9 + 0.8, dir: "up", left: true,
               word: N.flags.clip ? "Tap on the beat" : how === "touch" ? "Tap anywhere on the beat" : how === "mouse" ? "Click on the beat" : how === "pad" ? "Press on the beat" : "Space on the beat" };
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
    // the word goes where there's room: towards the middle of the screen
    var toLeft = left && x > WW * 0.6;
    if (dir === "right") D.text(c, word, -5.2, 0, size, { align: "right", colour: T.paper, stroke: size * 0.32 });
    else if (dir === "up" && left) D.text(c, word, toLeft ? -4 : 4, 2.6, size, { align: toLeft ? "right" : "left", colour: T.paper, stroke: size * 0.32 });
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
    // a phone gets the whole screen: room for 56px keys, a big beat pad and a long cord
    fullOnTouch: true,
    smallCallouts: true,
    keys: { up: [], down: [], left: [], right: [], action: ["Space"], beat: [] },
    // a gamepad's face buttons and shoulders tap the beat
    pad: { beat: [0, 1, 2, 3, 4, 5, 6, 7] },
    reset: reset,
    update: function (dt, input) { update(dt, input); },
    render: function () { render(); },
    resize: resize
  });
  T = shell.tokens;
  D.init(T, U * DPR);

  // How focus got to the pause, sound or fullscreen button: a click leaves
  // it there, but Space should still be the beat; reached with Tab, Space
  // and Enter belong to the button.
  var focusVia = "pointer";
  document.addEventListener("pointerdown", function () { focusVia = "pointer"; }, true);
  document.addEventListener("keydown", function (e) { if (e.key === "Tab") focusVia = "keys"; }, true);
  function barButton(e) {
    var t = e.target;
    return t && t.closest ? t.closest(".kit-bar button") : null;
  }

  // Keys: numbers for the menu, Space for the beat. Each press keeps its
  // event's timestamp, turned into transport time in the next update.
  document.addEventListener("keydown", function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
    if (shell.state() !== "playing") return;
    var btn = barButton(e);
    if (btn && (e.key === "Enter" || e.key === " ") && focusVia === "keys") return;
    var m = /^(?:Digit|Numpad)([0-9])$/.exec(e.code || "");
    var d = m ? m[1] : null;
    if (d != null) {
      e.preventDefault();
      lastMode = "keys";
      presses.push({ kind: "key", key: d, stamp: e.timeStamp, via: "keys" });
      return;
    }
    if (e.code === "Space") {
      e.preventDefault();
      // a button clicked with the mouse lets go of the focus, so it can't
      // take the next Space either
      if (btn) { btn.blur(); root.focus({ preventScroll: true }); }
      lastMode = "keys";
      presses.push({ kind: "beat", stamp: e.timeStamp, via: "keys" });
    }
  });
  document.addEventListener("keyup", function (e) {
    if (e.code === "Space" && shell.state() === "playing" && !(barButton(e) && focusVia === "keys")) e.preventDefault();
  });

  // Taps and clicks: a key on the keypad, or anywhere on hold
  root.addEventListener("pointerdown", function (e) {
    if (shell.state() !== "playing") return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    var tg = e.target;
    if (tg && tg.closest && tg.closest(".kit-bar, .kit-panel, button, a")) return;
    lastMode = e.pointerType === "mouse" ? "mouse" : "touch";
    var t = e.timeStamp;
    var box = root.getBoundingClientRect();
    var wx = (e.clientX - box.left) / U, wy = (e.clientY - box.top) / U;
    if (padOn(ph)) { e.preventDefault(); presses.push({ kind: "beat", stamp: t, via: e.pointerType }); return; }
    var hit = null;
    keyRects().forEach(function (r) {
      var slop = Lay.touch ? r.w * 0.06 : 0;
      if (wx >= r.x - slop && wx <= r.x + r.w + slop && wy >= r.y - slop && wy <= r.y + r.h + slop) hit = r;
    });
    if (hit) { e.preventDefault(); presses.push({ kind: "key", key: hit.key === "*" || hit.key === "#" ? "x" : hit.key, stamp: t, via: e.pointerType }); }
  });

  if (document.fonts && document.fonts.load) {
    document.fonts.load("12px " + T.display).then(function () { back = null; front = null; });
  }

  if (DEBUG) {
    window.__holdMusic = {
      peek: function () {
        if (!ph || !run) return { state: shell.state(), kind: "none", call: call, notesAhead: [], heard: 0, now: 0, score: 0, run: {} };
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
      force: function (id) { forcePick = id; },
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
