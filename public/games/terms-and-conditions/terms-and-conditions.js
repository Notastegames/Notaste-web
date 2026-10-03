// Terms and Conditions: read the terms, strike out the bad bits, accept
// anyway. There is no other button.
//
// THE JOKE. Companies hide everything in terms nobody can read. You're the one
// person who reads them, against the clock, with a red pen. Legal, the
// company's lawyer, is paid by the word and personally offended by readers.
// The app's mascot grins at everything, whatever it's saying. You catch the
// worst of it, and at the end you press Accept anyway, because that's the only
// button there is. The joke is on the people writing the terms, never on the
// person trying to read them.
//
// THE LOOP. You're installing an app. Its terms scroll up the phone, a clause
// at a time. Most are real-sounding boilerplate. Some aren't ("Your fridge may
// vote on your behalf"). Tap or click a bad clause to strike it: a red pen
// line, a VOID stamp, a thump. Or pick one with up and down and press Space.
// Strike a normal clause and Legal writes "stet" on it and bills you for the
// afternoon; strike two wrongly in a few seconds and he confiscates your pen.
// A bad clause that scrolls away unstruck is signed, and costs one of your
// five rights. Lose them all and the run's over. At the bottom: Accept. That
// signs anything bad you left on the screen, so strike it first.
//
// THE STAGES. Four apps, each with its own mascot and its own clauses, each
// faster than the last, each bringing something new (with a notice):
//   1. Torch Plus (Beam, holds a torch). Just the clauses. Learn the strike.
//   2. Kettle Cloud (Tilly, is a kettle). The sting in the tail: clauses that
//      turn bad in the last few words. Read to the end. And a pop-up asking if
//      you're still reading, which covers the page until you close it.
//   3. Sniff, a dating app for dogs (Biscuit, has ears). The small print: a
//      fine clause with an asterisk and a footnote that isn't. The same clause
//      can come with a harmless footnote, so you have to read it. More pop-ups.
//   4. A Bank (Penny, wears a bow tie). Legal leans in and edits clauses on the
//      screen while you read: a word struck out, a new one written in. A fine
//      clause can go bad in front of you. Fastest, longest, and it speeds up.
// Between apps (shell.interlude) you get one right back and pick a perk, each
// with a cost: reading glasses, strong coffee, skimming, legal aid, a friend
// who reads terms, an ad blocker, a highlighter, a cooling-off period.
// A round is about two minutes.
//
// SCORING. A catch is 100 (a sting or small print 150, one of Legal's edits
// 200), times your streak: x2 from three in a row, x3 from six, x4 from nine.
// A wrong strike is -60 and £600 of Legal's time. Closing a pop-up within a
// second and a half is 25. Each Accept pays 40 a right you still have, and
// 250 more for a clean read: nothing missed, nothing struck wrongly.
//
// THE LADDER (results). Approved: all four apps, 90% of bad clauses struck,
// three wrong strikes at most. Pending review: all four apps and 70%. Not
// approved: all four apps, or out of rights on the third or fourth. Rejected:
// out of rights before that. Today's terms (the daily run) gives everyone the
// same clauses in the same order, the same pop-ups and the same perks on
// offer. Each app draws from its own seeded streams (the clauses, the friend's
// circles, the pop-ups, the perks), so a different perk picked between apps
// changes nothing about the next app's terms.
//
// Built on the shared kit (/games/kit/kit.js). clauses.js holds the words,
// cast.js draws Legal and the mascots. Everything is drawn on the canvas in
// the four inks from Notaste.tokens(); the clause text is cached as bitmaps.
(function () {
  "use strict";

  var N = window.Notaste;
  var C = window.TermsClauses;
  var CAST = window.TermsCast;
  var root = document.getElementById("game-root");
  if (!N || !C || !CAST || !root) return;

  var params = new URLSearchParams(window.location.search);
  var AUTOPILOT = N.flags.autopilot;      // ?autopilot or ?clip: the computer reads for you
  var DEBUG = params.has("debug");
  var FIRST = DEBUG ? Math.max(0, Math.min(3, (parseInt(params.get("stage"), 10) || 1) - 1)) : 0;

  // ---------------------------------------------------------------------------
  // Tuning
  // ---------------------------------------------------------------------------
  var RIGHTS = 5;
  var POINTS = { bad: 100, sting: 150, small: 150, amend: 200 };
  var WRONG = 60;              // points off for striking a normal clause
  var FEE = 600;               // ...and what Legal bills for the afternoon, in pounds
  var PEN_GAP = 5;             // two wrong strikes this close together and he takes the pen
  var PEN_TIME = 2.6;
  var POPUP_FAST = 25;         // closing a pop-up quickly
  var PER_RIGHT = 40;          // at each Accept, for each right still held
  var CLEAN = 250;             // ...and for a clean read
  var WAIT_ACCEPT = 9;         // seconds before the mascot presses Accept for you

  // What each app's terms hold. lps: lines a second the page scrolls.
  var STAGES = [
    { normal: 7, bad: 5, sting: 0, smallBad: 0, smallOk: 0, amend: 0, popups: 0, lps: 1.45, ramp: 0.1 },
    { normal: 7, bad: 3, sting: 3, smallBad: 0, smallOk: 0, amend: 0, popups: 1, lps: 1.65, ramp: 0.12 },
    { normal: 6, bad: 3, sting: 2, smallBad: 3, smallOk: 3, amend: 0, popups: 2, lps: 1.85, ramp: 0.14 },
    { normal: 6, bad: 2, sting: 3, smallBad: 3, smallOk: 2, amend: 3, popups: 2, lps: 2, ramp: 0.3 }
  ];

  // What's new each app, shown as a notice with the countdown
  var BRIEFS = [
    "Its terms scroll up the phone. Most clauses are normal. Strike the ones that aren't before they scroll away: {how}. Strike a normal one and Legal bills you.",
    "Read to the end. Some clauses turn bad in their last few words. And a pop-up will ask if you're still reading: {close}.",
    "A dating app for dogs. Read the small print: a fine clause with a bad footnote is a bad clause. A harmless footnote is fine.",
    "Legal edits clauses while you read. When his pen comes out, read that clause again. It's a bank, so everything's faster."
  ];

  // Between apps: one perk, each with a cost
  var PERKS = [
    { id: "glasses", label: "Reading glasses", detail: "Bigger print. Fewer clauses fit on the screen.",
      apply: function (m) { m.size *= 1.13; } },
    { id: "coffee", label: "Strong coffee", detail: "The terms scroll a fifth slower. Wrong strikes cost double.",
      apply: function (m) { m.speed *= 0.8; m.wrong *= 2; } },
    { id: "skim", label: "Skim it", detail: "The terms scroll a third faster. Every catch scores double.",
      apply: function (m) { m.speed *= 1.3; m.catch *= 2; } },
    { id: "aid", label: "Legal aid", detail: "Three wrong strikes for free. Catches score a fifth less.",
      apply: function (m) { m.free += 3; m.catch *= 0.8; } },
    { id: "friend", label: "A friend who reads terms", detail: "Circles one bad clause in three. Takes half the points for it.",
      apply: function (m) { m.hint = 0.34; } },
    { id: "blocker", label: "Ad blocker", detail: "No more pop-ups. The terms scroll a tenth faster instead.",
      apply: function (m) { m.popups = 0; m.speed *= 1.1; } },
    { id: "highlighter", label: "Highlighter", detail: "The last three words of every clause, highlighted. Twice the pop-ups.",
      apply: function (m) { m.highlight = true; m.popups *= 2; } },
    { id: "cooling", label: "Cooling-off period", detail: "Two extra rights, over the limit. Streaks build half as fast.",
      apply: function (m) { run.rights += 2; m.streak *= 0.5; } }
  ];

  // The results ladder: what it takes and what it says
  var RANKS = [
    { stamp: "Approved", line: "You read every word. The company has flagged your account as unusual." },
    { stamp: "Pending review", line: "You caught most of it. The rest is binding, and your fridge has been told." },
    { stamp: "Not approved", line: "You read some of it. They read all of you." },
    { stamp: "Rejected", line: "You agreed to nearly everything. Everyone does. That's the business model." }
  ];

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  var shell = null, T = null, ctx = null;
  var W = 1, H = 1, DPR = 1;
  var L = null;                        // the layout (rectangles and sizes)
  var mctx = document.createElement("canvas").getContext("2d");   // for measuring text
  var run = null;                      // the whole run's tallies
  var stage = 0, app = null, doc = [], docH = 0;
  var scroll = 0, speed = 0, hitch = 0, phase = "read";
  var clock = 0, stageClock = 0, phaseClock = 0;
  var sel = -1, keyMode = false, hover = -1;
  var ACCEPT = -2, DECLINE = -3;
  var popup = null, popupPlan = [], arm = null, pen = 0;
  var wrongAt = -99, bubbles = [], fx = [], pops = [], shake = 0;
  var hintNow = null, noticed = false, footer = 0, accepted = false;
  var prev = { up: false, down: false, action: false }, repeat = { up: 0, down: 0 };
  var hudEls = null, bg = null, stampCache = {}, autoT = 0, autoPick = 0;
  var said = { legal: -9, mascot: -9 };
  var pointer = { x: 0, y: 0, mouse: false };
  var pending = 0, fling = 0, pull = 0, skimmed = 0, lastSkim = -99;
  var coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function fmt(n) { return Math.round(n).toLocaleString("en-GB"); }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  // Each app draws from its own streams, seeded from the run, so today's
  // terms are the same for everyone whatever they picked between apps
  var rnd = Math.random;
  function stream(i, which) { return N.seeded(((shell.seed % 1000003) + 1) * 977 + i * 7919 + which * 104729); }
  function shuffle(list) {
    for (var i = list.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1)), t = list[i];
      list[i] = list[j];
      list[j] = t;
    }
    return list;
  }
  function calm() { return shell.reduceMotion; }
  function isClause(b) { return b && b.kind === "clause"; }
  function isBad(b) { return b.type === "bad" || b.type === "sting" || b.type === "small" || b.type === "amend"; }
  function touchy() { return root.classList.contains("kit-touching"); }

  // ---------------------------------------------------------------------------
  // Building the terms for an app, from the run's seed
  // ---------------------------------------------------------------------------
  // n unused items: some from the app's own list, the rest from the general one
  function take(own, general, n, ownShare) {
    var out = [];
    var mine = shuffle((own || []).filter(function (x) { return !run.used[key(x)]; }));
    var theirs = shuffle((general || []).filter(function (x) { return !run.used[key(x)]; }));
    var fromOwn = Math.min(mine.length, Math.round(n * ownShare));
    out = mine.slice(0, fromOwn).concat(theirs.slice(0, n - fromOwn));
    out.forEach(function (x) { run.used[key(x)] = true; });
    return out;
  }
  function key(x) { return typeof x === "string" ? x : x.join("|"); }

  function buildDoc(i) {
    var st = STAGES[i];
    app = C.apps[i];
    rnd = stream(i, 1);
    var badItems = [], normals = [], amendables = [];
    take(app.bad, C.bad, st.bad, 0.45).forEach(function (t) { badItems.push({ type: "bad", text: t }); });
    take(app.sting, C.sting, st.sting, 0.4).forEach(function (s) { badItems.push({ type: "sting", text: s[0], n: s[1] }); });
    take(app.smallBad, C.smallBad, st.smallBad, 0.34).forEach(function (s) { badItems.push({ type: "small", text: s[0], foot: s[1] }); });
    take(app.normal, C.normal, st.normal, 0.35).forEach(function (t) { normals.push({ type: "normal", text: t }); });
    take(app.smallOk, C.smallOk, st.smallOk, 0.34).forEach(function (s) { normals.push({ type: "smallok", text: s[0], foot: s[1] }); });
    take(null, C.amend, st.amend, 0).forEach(function (s) { amendables.push({ type: "amendable", text: s[0], from: s[1], to: s[2] }); });
    shuffle(badItems);
    shuffle(normals);

    // bad clauses spread evenly through the terms, so it never goes quiet
    var total = badItems.length + normals.length + amendables.length;
    var slots = new Array(total);
    badItems.forEach(function (b, j) {
      var at = Math.floor((j + 0.25 + rnd() * 0.55) * total / badItems.length);
      at = clamp(at, i === 0 ? 1 : 0, total - 1);
      while (slots[at]) at = (at + 1) % total;
      slots[at] = b;
    });
    // Legal's edits go in the first three quarters, so there's time to read them
    amendables.forEach(function (b, j) {
      var at = Math.floor((j + 0.2 + rnd() * 0.4) * total * 0.78 / amendables.length) + 1;
      while (slots[at % total]) at++;
      slots[at % total] = b;
    });
    var ni = 0;
    for (var s = 0; s < total; s++) if (!slots[s]) slots[s] = normals[ni++];
    // the first app opens gently: a normal clause, then an obvious one
    if (i === 0 && isBad(slots[0])) {
      var swap = slots.findIndex(function (b) { return b.type === "normal"; });
      var t = slots[0]; slots[0] = slots[swap]; slots[swap] = t;
    }

    // headings every few clauses, and clause numbers under them
    var heads = shuffle(C.headings.slice());
    doc = [{ kind: "title" }];
    var section = 0, n = 0, until = 0;
    slots.forEach(function (b) {
      if (n >= until) {
        section++;
        n = 0;
        until = 3 + Math.floor(rnd() * 3);
        doc.push({ kind: "heading", text: section + ". " + heads[(section - 1) % heads.length] });
      }
      n++;
      b.kind = "clause";
      b.num = section + "." + n;
      b.state = "open";
      doc.push(b);
    });
    // the friend's circles
    var friend = stream(i, 2);
    doc.forEach(function (b) { b.hinted = isClause(b) && isBad(b) && run.mods.hint > 0 && friend() < run.mods.hint; });
    doc.push({ kind: "end" });
    if (L) measureAll();

    // pop-ups, at points through the terms
    rnd = stream(i, 3);
    var count = Math.round(st.popups * run.mods.popups);
    var pool = shuffle(C.popups.concat(C.appPopups[app.key] || []).slice());
    popupPlan = [];
    for (var p = 0; p < count; p++) {
      popupPlan.push({ at: (p + 0.6 + rnd() * 0.5) / (count + 0.6), def: pool[p % pool.length] });
    }
  }

  // ---------------------------------------------------------------------------
  // Layout: where the phone, the page and the cast go, at any shape of screen
  //   wide    4:3 desktop. The phone in the middle, Legal and the mascot either side.
  //   tall    the 4:5 clip frame and phones in fullscreen. The cast stand underneath.
  //   square  phones. The page fills the screen; the cast peek up at the corners.
  // ---------------------------------------------------------------------------
  function layout() {
    var m = {};
    var ar = W / H;
    m.mode = ar >= 1.2 ? "wide" : H / W >= 1.15 ? "tall" : "square";
    // below the HUD: in the middle only the kit's buttons, across the page the corners too
    var top = m.mode === "wide" ? Math.max(52, hudFit.bar + 6) : Math.max(42, hudFit.corners - Math.round(clamp(W / 330 * 13, 12, 15)) + 2, hudFit.bar + 2);
    if (m.mode === "wide") {
      var pw = clamp(Math.min(W * 0.5, (H - top) * 0.78), 250, 440);
      var bez = Math.round(clamp(pw * 0.04, 8, 15));
      m.phone = { x: Math.round((W - pw) / 2), y: top, w: Math.round(pw), h: H - top + 40, r: Math.round(pw * 0.11), bez: bez };
      m.page = { x: m.phone.x + bez, y: top + bez, w: m.phone.w - bez * 2, h: H - top - bez };
      var col = m.phone.x;
      var ls = Math.min(col * 0.86 / 112, H * 0.6 / 146);
      m.legal = { x: col * 0.5, y: H + 14 * ls, s: ls, rest: 0, up: 0 };
      var ms = Math.min(col * 0.72 / 112, H * 0.36 / 112);
      m.mascot = { x: W - col * 0.5, y: H - 10, s: ms, rest: 0, up: 0 };
      m.bubbleW = col - 18;
    } else {
      var side = Math.round(clamp(W * 0.03, 7, 14));
      m.phone = { x: side - 6, y: top - 6, w: W - (side - 6) * 2, h: H, r: 20, bez: 6 };
      var strip = m.mode === "tall" ? Math.round(clamp(W * 0.3, 96, 170)) : 0;
      m.page = { x: side, y: top, w: W - side * 2, h: H - top - strip - (strip ? 0 : 4) };
      var u = W / 330;
      if (m.mode === "tall") {
        var ts = Math.min(strip * 0.9 / 120, W * 0.3 / 112);
        m.legal = { x: W * 0.2, y: H + 22 * ts, s: ts, rest: 0, up: 0 };
        var tm = Math.min(strip * 0.8 / 110, W * 0.26 / 112);
        m.mascot = { x: W * 0.8, y: H - 6, s: tm, rest: 0, up: 0 };
      } else {
        // peeking: just the head shows until they've something to say
        var ps = 0.72 * u;
        m.legal = { x: W * 0.12, y: H + 92 * ps, s: ps, rest: 0, up: 58 * ps };
        var pm = 0.68 * u;
        m.mascot = { x: W * 0.88, y: H + 58 * pm, s: pm, rest: 0, up: 46 * pm };
      }
      m.bubbleW = W * 0.56;
    }
    var p = m.page;
    var fs = m.mode === "wide" ? clamp(Math.round(p.w / 21), 14, 17) : clamp(Math.round(p.w / 22), 13, 16);
    fs = Math.round(fs * (run ? run.mods.size : 1) * 2) / 2;
    m.fs = fs;
    m.lh = Math.round(fs * 1.34);
    m.pad = Math.round(fs * 0.85);
    m.status = Math.round(clamp(fs * 0.95, 12, 15));
    m.bar = Math.round(fs * 2.2);
    m.head = m.status + m.bar;
    m.view = { x: p.x, y: p.y + m.head, w: p.w, h: p.h - m.head };
    m.textW = m.view.w - m.pad * 2 - 6;
    m.fonts = {
      body: "500 " + fs + "px " + bodyFont(),
      bold: "700 " + fs + "px " + bodyFont(),
      num: Math.round(fs * 1.02) + "px " + T.display,
      foot: "italic 500 " + Math.max(12, Math.round(fs * 0.82)) + "px " + bodyFont(),
      head: Math.round(fs * 1.3) + "px " + T.display,
      title: Math.round(fs * 2.3) + "px " + T.display,
      small: "500 " + Math.max(12, Math.round(fs * 0.85)) + "px " + bodyFont(),
      bubble: Math.round(clamp(fs * 0.98, 12, 16)) + "px " + T.display
    };
    m.footLh = Math.round(Math.max(12, fs * 0.82) * 1.3);
    L = m;
  }

  // Where the HTML HUD ends, measured once it's showing (it's sized by the page's
  // width, not the screen's, so in the clip frame it's bigger than on a phone)
  var hudFit = { done: false, corners: 0, bar: 0 };
  function fitHud() {
    hudFit.done = true;
    var base = root.getBoundingClientRect(), corners = 0, bar = 0;
    Array.prototype.forEach.call(root.querySelectorAll(".kit-hud-tl, .kit-hud-tr, .kit-bar"), function (el) {
      var r = el.getBoundingClientRect();
      if (!r.height) return;
      if (el.classList.contains("kit-bar")) bar = Math.max(bar, r.bottom - base.top);
      else corners = Math.max(corners, r.bottom - base.top);
    });
    if (Math.abs(corners - hudFit.corners) > 1 || Math.abs(bar - hudFit.bar) > 1) {
      hudFit.corners = corners;
      hudFit.bar = bar;
      layout();
      measureAll();
      bg = null;
      hudBoxes = null;
    }
  }

  var bodyFamily = null;
  function bodyFont() {
    if (bodyFamily) return bodyFamily;
    // the device's own UI font, as the site uses; plain sans-serif if the list won't parse
    mctx.font = "500 14px " + T.body;
    bodyFamily = /14px/.test(mctx.font) ? T.body : "sans-serif";
    return bodyFamily;
  }

  // ---------------------------------------------------------------------------
  // Setting the text: clauses wrap word by word, and remember where each word
  // landed, so the pen can strike lines and circle the words that matter.
  // ---------------------------------------------------------------------------
  function words(text, f, extra) {
    return text.split(" ").map(function (t) {
      var w = { t: t, f: f };
      if (extra) for (var k in extra) w[k] = extra[k];
      return w;
    });
  }

  function tokens(b) {
    var out = [{ t: b.num, f: "num" }];
    var list = b.text.split(" ");
    if (b.amended) {
      var from = b.from.split(" "), at = -1, punct = "";
      for (var i = 0; i <= list.length - from.length; i++) {
        var chunk = list.slice(i, i + from.length).join(" ");
        var bare = chunk.replace(/[.,;:]+$/, "");
        if (bare === b.from) { at = i; punct = chunk.slice(bare.length); break; }
      }
      if (at >= 0) {
        var before = list.slice(0, at).join(" "), after = list.slice(at + from.length).join(" ");
        if (before) out = out.concat(words(before, "body"));
        out = out.concat(words(b.from, "del"));
        out = out.concat(words(b.to + punct, "ins", { culprit: true }));
        if (after) out = out.concat(words(after, "body"));
        return out;
      }
    }
    var body = words(b.text, "body");
    if (b.type === "sting") for (var s = Math.max(0, body.length - b.n); s < body.length; s++) body[s].culprit = true;
    if (run.mods.highlight) for (var h = Math.max(0, body.length - 3); h < body.length; h++) body[h].hl = true;
    return out.concat(body);
  }

  function fontFor(f) { return f === "num" ? L.fonts.num : f === "foot" ? L.fonts.foot : f === "bold" ? L.fonts.bold : L.fonts.body; }
  function wrap(toks, width, firstIndent) {
    var lines = [], line = { words: [], w: firstIndent || 0 };
    toks.forEach(function (tok) {
      mctx.font = fontFor(tok.f === "num" ? "body" : tok.f);
      var space = mctx.measureText(" ").width;
      mctx.font = fontFor(tok.f);
      var w = mctx.measureText(tok.t).width;
      var gap = line.words.length ? (tok.f === "num" || (line.words[line.words.length - 1].f === "num") ? space * 1.6 : space) : 0;
      if (line.words.length && line.w + gap + w > width) {
        lines.push(line);
        line = { words: [], w: 0 };
        gap = 0;
      }
      var placed = {};
      for (var k in tok) placed[k] = tok[k];
      placed.x = line.w + gap;
      placed.w = w;
      line.words.push(placed);
      line.w += gap + w;
    });
    if (line.words.length) lines.push(line);
    return lines;
  }

  function measure(b) {
    b.img = null;
    var pad = L.pad;
    if (b.kind === "clause") {
      b.lines = wrap(tokens(b), L.textW);
      b.foot = b.foot || null;
      b.footLines = b.foot ? wrap(words(b.foot, "foot", b.type === "small" ? { culprit: true } : null), L.textW - pad) : [];
      b.h = Math.round(pad * 0.55 + b.lines.length * L.lh + (b.footLines.length ? 3 + b.footLines.length * L.footLh : 0) + pad * 0.6);
    } else if (b.kind === "heading") {
      b.h = Math.round(L.fs * 1.3 * 1.1 + pad * 1.4);
    } else if (b.kind === "title") {
      mctx.font = L.fonts.small;
      b.kick = wrap(words(app.kicker, "body"), L.textW);
      b.h = Math.round(L.fs * 2.3 + L.lh * 1.3 + b.kick.length * L.lh + pad * 2.6);
    } else if (b.kind === "end") {
      b.lines = wrap(words("That's everything. By pressing Accept, you agree to all of the above, and to anything we add later.", "bold"), L.textW);
      b.h = Math.round(b.lines.length * L.lh + pad * 3);
    }
  }

  function measureAll() {
    // keep whatever's at the top of the screen at the top of the screen
    var anchor = null, offset = 0;
    for (var i = 0; i < doc.length; i++) {
      if (doc[i].top != null && doc[i].h && doc[i].top + doc[i].h > scroll) { anchor = i; offset = (scroll - doc[i].top) / doc[i].h; break; }
    }
    doc.forEach(measure);
    reflow();
    if (anchor != null && doc[anchor].top != null) scroll = doc[anchor].top + offset * doc[anchor].h;
  }

  function reflow() {
    var y = 0;
    doc.forEach(function (b) { b.top = y; y += b.h; });
    docH = y;
  }

  // The words of a block, drawn once into a bitmap the size of the block
  function blockImage(b) {
    if (b.img) return b.img;
    var cv = document.createElement("canvas");
    cv.width = Math.max(1, Math.round(L.view.w * DPR));
    cv.height = Math.max(1, Math.round(b.h * DPR));
    var c = cv.getContext("2d");
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    var x0 = L.pad, pad = L.pad;
    c.textBaseline = "alphabetic";
    if (b.kind === "clause") {
      var base = pad * 0.55 + L.lh * 0.78;
      b.lines.forEach(function (line, li) {
        var y = Math.round(base + li * L.lh);
        line.words.forEach(function (w) {
          if (w.f === "ins" || w.hl) {
            c.fillStyle = T.accent;
            c.fillRect(x0 + w.x - 2, y - L.fs * 0.86, w.w + 4, L.fs * 1.12);
          }
        });
        line.words.forEach(function (w) {
          c.font = w.f === "num" ? L.fonts.num : L.fonts.body;
          c.fillStyle = T.ink;
          c.fillText(w.t, x0 + w.x, y);
          if (w.f === "del") {
            c.fillRect(x0 + w.x - 1, y - L.fs * 0.34, w.w + 2, Math.max(1.5, L.fs * 0.11));
          }
        });
      });
      if (b.footLines.length) {
        var fy = base + b.lines.length * L.lh + 3 - L.lh * 0.15;
        b.footLines.forEach(function (line, li) {
          line.words.forEach(function (w) {
            c.font = L.fonts.foot;
            c.fillStyle = T.ink;
            c.fillText(w.t, x0 + pad + w.x, Math.round(fy + li * L.footLh));
          });
        });
      }
      dottedRule(c, x0, b.h - 1, L.view.w - pad * 2);
    } else if (b.kind === "heading") {
      c.font = L.fonts.head;
      c.fillStyle = T.ink;
      var hy = Math.round(pad * 0.9 + L.fs * 1.3 * 0.9);
      c.fillText(b.text.toUpperCase(), x0, hy);
      c.fillStyle = T.accent;
      c.fillRect(x0, hy + 4, Math.min(L.view.w - pad * 2, c.measureText(b.text.toUpperCase()).width), Math.max(3, L.fs * 0.24));
      c.fillStyle = T.ink;
      c.fillRect(x0, hy + 4 + Math.max(3, L.fs * 0.24), Math.min(L.view.w - pad * 2, c.measureText(b.text.toUpperCase()).width), 1.2);
    } else if (b.kind === "title") {
      var size = L.fs * 2.3;
      CAST.icon(c, x0 + size * 0.5, pad * 1.1 + size * 0.5, size);
      c.font = L.fonts.title;
      c.fillStyle = T.ink;
      c.fillText(app.name.toUpperCase(), x0 + size * 1.25, pad * 1.1 + size * 0.86);
      c.font = L.fonts.body;
      var ty = pad * 1.1 + size + L.lh * 1.05;
      c.fillText(app.subtitle, x0, ty);
      c.font = L.fonts.body;
      b.kick.forEach(function (line, li) {
        line.words.forEach(function (w) { c.fillText(w.t, x0 + w.x, ty + L.lh * (li + 1)); });
      });
      dottedRule(c, x0, b.h - 2, L.view.w - pad * 2);
    } else if (b.kind === "end") {
      c.font = L.fonts.bold;
      c.fillStyle = T.ink;
      b.lines.forEach(function (line, li) {
        line.words.forEach(function (w) { c.fillText(w.t, x0 + w.x, Math.round(pad * 1.2 + L.lh * 0.8 + li * L.lh)); });
      });
    }
    b.img = cv;
    return cv;
  }

  // Grey is halftone on white: a rule made of dots
  function dottedRule(c, x, y, w) {
    c.fillStyle = T.ink;
    for (var i = 0; i < w; i += 4) c.fillRect(x + i, y, 1.4, 1.4);
  }

  // ---------------------------------------------------------------------------
  // The round
  // ---------------------------------------------------------------------------
  function freshMods() {
    return { speed: 1, size: 1, catch: 1, wrong: 1, free: 0, hint: 0, popups: 1, highlight: false, streak: 1 };
  }

  function reset(sh) {
    shell = sh;
    T = sh.tokens;
    CAST.init(T, DPR);
    run = {
      score: 0, caught: 0, missed: 0, wrong: 0, fees: 0, rights: RIGHTS, streak: 0, best: 0,
      used: {}, taken: [], agreed: [], mods: freshMods(), daily: sh.daily, quick: 0, popupsClosed: 0
    };
    if (!hudEls) buildHud();
    stampCache = {};
    startStage(FIRST);
  }

  function startStage(i) {
    stage = i;
    run.stageCaught = 0;
    run.stageBad = 0;
    run.stageMissed = 0;
    run.stageWrong = 0;
    layout();
    buildDoc(i);
    measureAll();
    scroll = -L.view.h * 0.3;
    speed = 0;
    hitch = 0;
    phase = "read";
    stageClock = phaseClock = 0;
    sel = -1;
    hover = -1;
    popup = null;
    arm = null;
    pen = 0;
    wrongAt = -99;
    bubbles = [];
    fx = [];
    pops = [];
    footer = 0;
    pending = fling = pull = skimmed = 0;
    drag = null;
    accepted = false;
    noticed = false;
    hintNow = null;
    autoT = 0;
    bg = null;
    hudBoxes = null;
    said = { legal: -9, mascot: -9 };
    paintHud();
  }

  function scrollSpeed() {
    var st = STAGES[stage];
    var progress = clamp(scroll / Math.max(1, docH - L.view.h), 0, 1);
    var fit = clamp(L.view.h / L.lh / 15, 0.84, 1);
    return st.lps * L.lh * run.mods.speed * (1 + st.ramp * progress) * fit;
  }

  function update(dt, input) {
    var state = shell.state();
    if (state !== "playing") {
      prev.up = input.up; prev.down = input.down; prev.action = input.action;
      if (state === "ending") cosmetics(dt);
      return;
    }
    clock += dt;
    stageClock += dt;
    phaseClock += dt;
    if (pen > 0 && pen - dt <= 0) say("legal", "Fine. Have it back.", true);
    pen = Math.max(0, pen - dt);
    shake = Math.max(0, shake - dt * 3);

    keys(input, dt);
    if (AUTOPILOT) autopilot(dt);
    if (stageClock - dt < 0.3 && stageClock >= 0.3) say("mascot", app.hello, true);
    if (stageClock - dt < 3.6 && stageClock >= 3.6) say("legal", app.legal, true);

    if (phase === "read") {
      var target = scrollSpeed() * clamp(stageClock / 1.6, 0, 1);
      if (hitch > 0) { hitch -= dt; target *= 0.12; }
      speed += (target - speed) * Math.min(1, dt * 7);
      var take = pending * Math.min(1, dt * 10);
      pending -= take;
      fling *= Math.exp(-dt * 3.4);
      if (fling < 5) fling = 0;
      scroll = Math.min(maxScroll() + 0.5, scroll + speed * dt + take + fling * dt);
      var end = doc[doc.length - 1];
      if (end.top + end.h - scroll <= L.view.h * 0.66) {
        phase = "accept";
        phaseClock = 0;
        speed = 0;
        sfx.ding();
        if (keyMode && (sel < 0 || !isClause(doc[sel]) || doc[sel].state !== "open")) sel = ACCEPT;
      }
      // pop-ups, part way through
      var progress = scroll / Math.max(1, docH - L.view.h);
      if (!popup && popupPlan.length && progress >= popupPlan[0].at) openPopup(popupPlan.shift().def);
      // Legal's edits, once the clause is all on screen and low enough to
      // leave time to read it again after he's done (on a phone too)
      if (STAGES[stage].amend && !arm && !popup) {
        for (var a = 0; a < doc.length; a++) {
          var b = doc[a];
          if (b.type !== "amendable" || b.state !== "open") continue;
          var y = b.top - scroll;
          if (y + b.h < L.view.h - 4 && y > L.view.h * 0.42) { startAmend(b); break; }
        }
      }
    } else if (phase === "accept") {
      footer = Math.min(1, footer + dt * 4);
      if (!accepted && phaseClock > WAIT_ACCEPT) acceptAll(true);
    }

    // anything bad that scrolls away unstruck is signed
    doc.forEach(function (b) {
      if (isClause(b) && b.state === "open" && isBad(b) && b.top + b.h * 0.5 - scroll < 0) missed(b);
    });
    keepSelection();

    if (!drag) pull += (0 - pull) * Math.min(1, dt * 14);
    if (popup) popup.t += dt;
    if (arm) tickArm(dt);
    cosmetics(dt, true);
    pickHint();
    paintHud();
  }

  // what keeps moving after the round stops: bubbles, ink, points, the cast
  function cosmetics(dt, playing) {
    if (!playing) { phaseClock += dt; clock += dt; }
    if (phase === "done" || phase === "accept") footer = Math.min(1, footer + dt * 4);
    bubbles = bubbles.filter(function (bb) { bb.t += dt; return bb.t < bb.life; });
    fx = fx.filter(function (e) { e.t += dt; return e.t < e.life; });
    pops = pops.filter(function (e) { e.t += dt; return e.t < 0.9; });
  }

  // ---------- Striking ----------
  function strike(b) {
    if (!isClause(b) || b.state !== "open" || phase === "done" || accepted) return;
    if (pen > 0) {
      sfx.nope();
      if (!fx.some(function (e) { return e.kind === "nopen"; })) {
        shell.callout("Pen: confiscated", { sound: false, ms: 900 });
        fx.push({ kind: "nopen", t: 0, life: 1 });
      }
      return;
    }
    b.struckAt = clock;
    if (arm && arm.b === b) arm.phase = "back";
    if (isBad(b)) caught(b); else wrong(b);
  }

  function caught(b) {
    b.state = "struck";
    var before = Math.floor(run.streak);
    run.streak += run.mods.streak;
    var mult = Math.min(4, 1 + Math.floor(run.streak / 3));
    var points = Math.round(POINTS[b.type === "small" ? "small" : b.type] * run.mods.catch * mult * (b.hinted ? 0.5 : 1));
    run.score += points;
    run.caught++;
    run.stageCaught++;
    run.best = Math.max(run.best, Math.floor(run.streak));
    pops.push({ text: "+" + points + (mult > 1 ? " x" + mult : ""), x: L.view.x + L.view.w * 0.62, y: b.top + b.h * 0.3, t: 0 });
    splat(b);
    hitch = 0.22;
    if (!calm()) { shake = Math.max(shake, 0.5); pull = Math.max(pull, 5); }
    sfx.strike(mult);
    var s = Math.floor(run.streak);
    if (s !== before && (s === 5 || s === 10 || s === 15)) {
      shell.callout(s === 5 ? "Reading: suspicious" : s === 10 ? "Account: flagged" : "Legal: informed", { sound: false, ms: 1100 });
      say("legal", pick(C.lines.legal.streak), true);
    } else if (b.type === "amend") {
      say("legal", pick(C.lines.legal.amendCaught), true);
    } else if ((b.type === "sting" || b.type === "small") && Math.random() < 0.75) {
      say("legal", pick(C.lines.legal[b.type]), true);
    } else if (Math.random() < 0.55) {
      if (Math.random() < 0.62) say("legal", pick(C.lines.legal.caught));
      else say("mascot", pick(C.lines.mascot.caught));
    }
    run.learned = run.learned || {};
    run.learned.strike = true;
    if (b.type === "sting") run.learned.sting = true;
    if (b.type === "small") run.learned.small = true;
    if (b.type === "amend") run.learned.amend = true;
  }

  function wrong(b) {
    b.state = "stet";
    run.streak = 0;
    run.wrong++;
    run.stageWrong++;
    var free = run.mods.free > 0;
    if (free) {
      run.mods.free--;
      shell.callout("Legal aid", { sound: false, ms: 900 });
    } else {
      var cost = Math.round(WRONG * run.mods.wrong);
      run.score = Math.max(0, run.score - cost);
      run.fees += FEE;
      pops.push({ text: "-" + cost, x: L.view.x + L.view.w * 0.62, y: b.top + b.h * 0.3, t: 0, bad: true });
    }
    sfx.wrong();
    if (!calm()) shake = Math.max(shake, 0.3);
    say("legal", pick(C.lines.legal.wrong), true);
    if (clock - wrongAt < PEN_GAP && !free) {
      pen = PEN_TIME;
      wrongAt = -99;
      shell.callout("Pen: confiscated", { ms: 1300 });
      say("legal", pick(C.lines.legal.pen), true);
      sfx.snatch();
    } else {
      wrongAt = clock;
    }
  }

  function missed(b) {
    b.state = "signed";
    b.signedAt = clock;
    run.streak = 0;
    run.missed++;
    run.stageMissed++;
    run.rights--;
    run.agreed.push(b);
    sfx.signed();
    if (Math.random() < 0.6) say("legal", pick(C.lines.legal.missed));
    else say("mascot", pick(C.lines.mascot.missed));
    if (run.rights <= 0) end("rights");
  }

  // ink flicked off the stamp
  function splat(b) {
    if (calm()) return;
    for (var i = 0; i < 8; i++) {
      var a = Math.random() * Math.PI * 2, v = 50 + Math.random() * 90;
      fx.push({ kind: "ink", t: 0, life: 0.45, y0: b.top + b.h * 0.5, x: L.view.x + L.view.w - L.pad - L.fs * 3.2,
                vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: 1.4 + Math.random() * 2.2 });
    }
  }

  // ---------- Pop-ups ----------
  function openPopup(def) {
    popup = { def: def, t: 0 };
    sfx.ding();
    if (Math.random() < 0.5) say("mascot", pick(C.lines.mascot.popup));
  }
  function closePopup() {
    if (!popup) return;
    if (popup.t < 1.5) {
      run.score += POPUP_FAST;
      pops.push({ text: "+" + POPUP_FAST, x: L.view.x + L.view.w * 0.5, y: scroll + L.view.h * 0.4, t: 0 });
    }
    run.popupsClosed++;
    run.learned = run.learned || {};
    run.learned.popup = true;
    popup = null;
    sfx.tick();
  }
  function popupRect() {
    var v = L.view;
    var w = Math.min(v.w - L.pad * 2, L.fs * 19), h = L.fs * 8.4;
    return { x: v.x + (v.w - w) / 2, y: v.y + v.h * 0.36 - h / 2, w: w, h: h };
  }

  // ---------- Legal's edits ----------
  function startAmend(b) {
    arm = { b: b, t: 0, phase: "reach" };
    say("legal", pick(C.lines.legal.amend), true);
  }
  function tickArm(dt) {
    arm.t += dt;
    if (arm.phase === "reach" && arm.t > 0.5) { arm.phase = "write"; arm.t = 0; sfx.scribble(); }
    else if (arm.phase === "write" && arm.t > 0.7) {
      var b = arm.b;
      if (b.state === "open") {
        b.amended = true;
        b.type = "amend";
        b.amendedAt = clock;
        b.verdict = null;          // the autopilot has to read it again too
        b.seen = 0;
        measure(b);
        reflow();
      }
      arm.phase = "back";
      arm.t = 0;
    } else if (arm.phase === "back" && arm.t > 0.45) arm = null;
  }
  // where on the screen Legal's pen goes: the word he's changing
  function armTarget() {
    var b = arm.b, y = L.view.y + b.top - scroll, x = L.view.x + L.view.w * 0.5;
    var found = false;
    (b.lines || []).forEach(function (line, li) {
      line.words.forEach(function (w) {
        if (!found && (w.f === "del" || w.t.replace(/[.,;:]+$/, "") === b.from.split(" ")[0])) {
          x = L.view.x + L.pad + w.x + w.w * 0.5;
          y += L.pad * 0.55 + L.lh * (li + 0.5);
          found = true;
        }
      });
    });
    if (!found) y += b.h * 0.5;
    return { x: x, y: y };
  }

  // ---------- Accept ----------
  function acceptAll(waited) {
    if (accepted || phase !== "accept") return;
    accepted = true;
    run.learned = run.learned || {};
    run.learned.accept = true;
    var signed = 0;
    doc.forEach(function (b) {
      if (isClause(b) && b.state === "open" && isBad(b)) {
        b.state = "signed";
        b.signedAt = clock;
        run.missed++;
        run.stageMissed++;
        run.rights--;
        run.agreed.push(b);
        signed++;
      }
    });
    run.streak = signed ? 0 : run.streak;
    sfx.jingle();
    shell.callout("Accepted", { ms: 1400, tilt: -4 });
    say("mascot", waited ? C.lines.mascot.waited : pick(C.lines.mascot.accept), true);
    if (!waited) say("legal", pick(C.lines.legal.accept), true);
    if (run.rights <= 0) { end("rights"); return; }
    var kept = Math.max(0, run.rights);
    var bonus = kept * PER_RIGHT + (run.stageMissed === 0 && run.stageWrong === 0 ? CLEAN : 0);
    run.score += bonus;
    pops.push({ text: "+" + bonus, x: L.view.x + L.view.w * 0.5, y: scroll + L.view.h * 0.5, t: 0 });
    phase = "done";
    if (stage < STAGES.length - 1) stageClear();
    else end("done");
  }

  function decline() {
    sfx.nope();
    shell.callout(app.decline, { sound: false, ms: 1200 });
    say("mascot", pick(C.lines.mascot.decline), true);
  }

  // ---------- Between apps ----------
  // The same order for everyone today, whatever they picked last time: what
  // they've taken already drops out and the next in line moves up
  function offer() {
    rnd = stream(stage, 4);
    return shuffle(PERKS.slice()).filter(function (p) { return run.taken.indexOf(p.id) < 0; }).slice(0, 3);
  }

  function stageStamp() {
    var total = run.stageCaught + run.stageMissed;
    var share = total ? run.stageCaught / total : 1;
    if (share >= 1 && run.stageWrong === 0) return "Approved";
    if (share >= 0.7) return "Pending review";
    if (share >= 0.4) return "Not approved";
    return "Rejected";
  }

  function stageClear() {
    var restored = run.rights < RIGHTS;
    if (restored) run.rights++;
    var offers = offer();
    var next = C.apps[stage + 1];
    var total = run.stageCaught + run.stageMissed;
    var stamp = stageStamp();
    var stats = [
      { label: "Struck", value: run.stageCaught + "/" + total },
      { label: "Wrong strikes", value: String(run.stageWrong) },
      { label: "Signed away", value: String(run.stageMissed) },
      { label: "Rights", value: run.rights + (restored ? " (one back)" : "") },
      { label: "Score", value: fmt(run.score) }
    ];
    shell.interlude({
      stamp: stamp,
      tilt: stamp === "Approved" ? -5 : 4,
      heading: app.installed,
      line: app.after,
      stats: stats,
      ask: "Next: " + next.name + ". Pick one.",
      choices: offers.map(function (p) { return { label: p.label, detail: p.detail }; }),
      delay: 1500
    }).then(function (i) {
      var p = offers[i] || offers[0];
      if (p) { run.taken.push(p.id); p.apply(run.mods); }
      startStage(stage + 1);
      shell.next();
    });
    // the autopilot (and the clip camera) can't click: it picks for itself
    if (AUTOPILOT) {
      window.clearTimeout(autoPick);
      autoPick = window.setTimeout(function () {
        var first = root.querySelector(".kit-inter .kit-choice");
        if (shell.state() === "interlude" && first) first.click();
      }, 1500 + 2600);
    }
  }

  // ---------- The end ----------
  function end(why) {
    if (phase === "over") return;
    phase = "over";
    popup = null;
    arm = null;
    var total = run.caught + run.missed;
    var share = total ? run.caught / total : 0;
    var finished = why === "done";
    var rank;
    if (finished && share >= 0.9 && run.wrong <= 3) rank = 0;
    else if (finished && share >= 0.7) rank = 1;
    else if (finished || stage >= 2) rank = 2;
    else rank = 3;
    var score = Math.round(run.score);
    var rec = shell.record(score);
    var heading, line;
    if (finished) {
      heading = run.caught + " of " + total + " struck.";
      line = RANKS[rank].line;
    } else {
      heading = "No rights left.";
      line = "The last one was the right to complain about it.";
    }
    var worst = run.agreed.filter(function (b) { return b.type === "bad"; });
    var quote = (worst.length ? pick(worst) : run.agreed.length ? pick(run.agreed) : null);
    if (quote) line += " You also agreed to this: “" + agreedText(quote) + "”";
    else line += " Then you pressed Accept anyway. There was no other button.";
    // short, so they sit on one or two rows on a phone's square screen
    var stats = [
      { label: "Score", value: fmt(score) },
      { label: "Struck", value: run.caught + "/" + total },
      { label: rec.isNew ? (run.daily ? "New best today" : "New best") : (run.daily ? "Best today" : "Best"),
        value: fmt(rec.isNew ? score : rec.best || 0), highlight: rec.isNew }
    ];
    if (run.fees) stats.splice(2, 0, { label: "Legal fees", value: "£" + fmt(run.fees) });
    if (!finished) stats.splice(1, 0, { label: "App", value: (stage + 1) + " of 4" });
    if (run.daily) stats.unshift({ label: "Run", value: shell.today });
    shell.finish({
      place: rank + 1, total: 4, stamp: RANKS[rank].stamp, heading: heading, line: line, stats: stats,
      share: fmt(score) + " points, " + run.caught + " of " + total + " bad clauses struck" + (finished ? "" : ", app " + (stage + 1) + " of 4"),
      delay: 1600
    });
  }

  // What a clause you agreed to said, for the results line
  function agreedText(b) {
    return b.type === "small" ? b.text.replace(/\*$/, "") + " " + b.foot.replace(/^\*/, "") : b.amended ? amendedText(b) : b.text;
  }
  function amendedText(b) {
    return b.text.replace(b.from, b.to);
  }

  // ---------------------------------------------------------------------------
  // Controls. Click or tap a clause to strike it. On keys, up and down move a
  // highlight between the clauses on screen, and Space strikes.
  // ---------------------------------------------------------------------------
  function keys(input, dt) {
    var pressed = { up: false, down: false, action: input.action && !prev.action };
    ["up", "down"].forEach(function (k) {
      if (input[k] && !prev[k]) { pressed[k] = true; repeat[k] = 0.36; }
      else if (input[k]) {
        repeat[k] -= dt;
        if (repeat[k] <= 0) { pressed[k] = true; repeat[k] = 0.11; }
      }
    });
    prev.up = input.up; prev.down = input.down; prev.action = input.action;
    if (AUTOPILOT) return;
    if (pressed.up || pressed.down || pressed.action) {
      if (input.mode === "keys" || input.mode === "pad") {
        if (!keyMode) {
          keyMode = true;
          hover = -1;
          if (!popup && sel < 0) { sel = firstOnScreen(); if (pressed.action && phase !== "accept") return; }
        }
      }
    }
    if (popup) {
      if (pressed.action) closePopup();
      return;
    }
    var was = sel;
    if (pressed.down) moveSel(1);
    if (pressed.up) moveSel(-1);
    // screen readers hear the clause the highlight lands on
    if (sel !== was) {
      if (sel === ACCEPT) shell.announce("Accept. There is no other button.");
      else if (sel === DECLINE) shell.announce("Decline.");
      else if (sel >= 0) shell.announce(doc[sel].num + ". " + (doc[sel].amended ? amendedText(doc[sel]) : doc[sel].text) + (doc[sel].foot ? " " + doc[sel].foot : ""));
    }
    if (pressed.action) {
      if (sel === ACCEPT) acceptAll(false);
      else if (sel === DECLINE) decline();
      // the highlight has just moved by itself (its clause scrolled away):
      // a press this quick was meant for the old one, so it strikes nothing
      else if (sel >= 0 && clock - jumped < 0.3) sfx.tick();
      // at the end, a press on a clause that's already dealt with goes to Accept
      else if (sel >= 0 && doc[sel].state !== "open" && phase === "accept") { sel = ACCEPT; shell.announce("Accept. There is no other button."); }
      else if (sel >= 0) strike(doc[sel]);
      else if (phase === "accept") { sel = ACCEPT; }
    }
  }

  var briefEl = null;
  function briefUp() {
    briefEl = briefEl || root.querySelector(".kit-brief");
    return !!(briefEl && briefEl.classList.contains("is-on"));
  }

  function onScreen(b) {
    var y = b.top - scroll;
    return y + b.h > 2 && y < L.view.h - 4;
  }
  // still on screen and not yet past the top; "open" ones can still be struck
  function strikable(b) { return isClause(b) && b.top + b.h * 0.5 - scroll >= 0 && onScreen(b); }
  function choosable(b) { return strikable(b) && b.state === "open"; }

  function firstOnScreen() {
    for (var i = 0; i < doc.length; i++) if (choosable(doc[i]) && doc[i].top - scroll >= -doc[i].h * 0.3) return i;
    return phase === "accept" ? ACCEPT : -1;
  }

  function moveSel(dir) {
    sfx.tick();
    if (sel === DECLINE) { if (dir < 0) sel = ACCEPT; return; }
    if (sel === ACCEPT) {
      if (dir > 0) { sel = DECLINE; return; }
      for (var j = doc.length - 1; j >= 0; j--) if (choosable(doc[j])) { sel = j; return; }
      return;
    }
    if (sel < 0) { sel = firstOnScreen(); return; }
    for (var i = sel + dir; i >= 0 && i < doc.length; i += dir) {
      if (choosable(doc[i])) { sel = i; return; }
      if (dir > 0 && doc[i].top - scroll > L.view.h) break;
    }
    if (dir > 0 && phase === "accept") sel = ACCEPT;
    else if (dir > 0) pushAhead(L.lh * 3);
  }

  // the highlight can't stay on a clause that's scrolled away
  var jumped = -9;   // when the highlight last moved by itself
  function keepSelection() {
    if (sel >= 0 && !strikable(doc[sel])) {
      sel = firstOnScreen();
      jumped = clock;
    }
    if (hover >= 0 && !strikable(doc[hover])) hover = -1;
  }

  // what's under a point on the screen
  function hit(x, y) {
    var v = L.view;
    if (x < v.x || x > v.x + v.w || y < v.y || y > v.y + v.h) return -1;
    var dy = y - v.y + scroll - pull;
    for (var i = 0; i < doc.length; i++) {
      var b = doc[i];
      if (dy >= b.top - 3 && dy < b.top + b.h + 3 && isClause(b)) return i;
    }
    return -1;
  }
  function inRect(x, y, r) { return r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h; }

  function pointAt(e) {
    var box = root.getBoundingClientRect();
    return { x: e.clientX - box.left, y: e.clientY - box.top };
  }
  function ignore(e) {
    var t = e.target;
    return t && t.closest && t.closest(".kit-panel, .kit-bar, .kit-pad, button, a");
  }

  // A mouse click strikes straight away. A finger strikes when it lifts, so a
  // finger that drags scrolls the page on instead: forwards only, like the
  // real thing, with a bit of give if you pull it back.
  var drag = null;
  root.addEventListener("pointerdown", function (e) {
    if (!shell || shell.state() !== "playing" || ignore(e) || AUTOPILOT) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    var p = pointAt(e);
    keyMode = false;
    if (popup) {
      if (inRect(p.x, p.y, popupRect())) closePopup();
      return;
    }
    if (phase === "accept") {
      var r = acceptRects();
      if (inRect(p.x, p.y, r.accept)) { acceptAll(false); return; }
      if (inRect(p.x, p.y, r.decline)) { decline(); return; }
    }
    if (e.pointerType === "mouse") {
      var i = hit(p.x, p.y);
      if (i >= 0) strike(doc[i]);
      return;
    }
    drag = { id: e.pointerId, y0: p.y, last: p.y, t: performance.now(), moved: false, v: 0 };
  });
  root.addEventListener("pointermove", function (e) {
    if (!shell || AUTOPILOT) return;
    var p = pointAt(e);
    if (drag && e.pointerId === drag.id) {
      if (!drag.moved && Math.abs(p.y - drag.y0) > 10) drag.moved = true;
      var now = performance.now(), dy = drag.last - p.y, ms = Math.max(1, now - drag.t);
      drag.last = p.y;
      drag.t = now;
      if (drag.moved && shell.state() === "playing") {
        if (dy > 0) pushAhead(dy, true);
        else pull = Math.min(30, pull - dy * 0.35);
        drag.v = drag.v * 0.6 + (dy / ms * 1000) * 0.4;
      }
      return;
    }
    if (e.pointerType !== "mouse") return;
    pointer.x = p.x; pointer.y = p.y; pointer.mouse = true;
    if (shell.state() !== "playing") return;
    if (Math.abs(e.movementX) + Math.abs(e.movementY) > 0) keyMode = false;
    hover = popup ? -1 : hit(p.x, p.y);
  });
  function lift(e) {
    if (!drag || e.pointerId !== drag.id) return;
    var d = drag;
    drag = null;
    if (!shell || shell.state() !== "playing") return;
    if (!d.moved) {
      if (e.type === "pointercancel") return;
      var p = pointAt(e), i = hit(p.x, p.y);
      if (i >= 0) strike(doc[i]);
      return;
    }
    // a flick keeps it going for a moment: half a screen more at most,
    // so a flick on a small phone doesn't fling bad clauses past unread
    if (d.v > 150 && performance.now() - d.t < 120) {
      fling = Math.min(L.view.h * 1.6, d.v);
      sfx.flick(fling);
    }
  }
  root.addEventListener("pointerup", lift);
  root.addEventListener("pointercancel", lift);
  root.addEventListener("pointerleave", function () { hover = -1; });
  // the wheel reads ahead too (and never scrolls the page under the game)
  root.addEventListener("wheel", function (e) {
    if (!shell || shell.state() !== "playing" || AUTOPILOT) return;
    e.preventDefault();
    var dy = e.deltaMode === 1 ? e.deltaY * 18 : e.deltaMode === 2 ? e.deltaY * L.view.h : e.deltaY;
    if (dy > 0) pushAhead(Math.min(dy, L.view.h * 0.5) * 0.8);
    else pull = Math.min(30, pull - dy * 0.15);
  }, { passive: false });

  // Read ahead: push the page on, faster than it scrolls by itself. You can't
  // push it back. Legal is all for it.
  function pushAhead(px, now) {
    if (phase !== "read" || popup || accepted) return;
    if (now) scroll = Math.min(maxScroll(), scroll + px);
    else pending += px;
    skimmed += px;
    if (skimmed > L.view.h * 0.9 && clock - lastSkim > 9) {
      skimmed = 0;
      lastSkim = clock;
      if (Math.random() < 0.7) say("legal", pick(C.lines.legal.skim), true);
      else say("mascot", pick(C.lines.mascot.skim), true);
    }
  }
  function maxScroll() {
    var end = doc[doc.length - 1];
    return end.top + end.h - L.view.h * 0.66;
  }

  // ---------------------------------------------------------------------------
  // The autopilot (?autopilot, ?clip): reads each clause once it's fully on
  // screen, takes a moment over it, and strikes the bad ones. Not perfect.
  // ---------------------------------------------------------------------------
  function autopilot(dt) {
    autoT -= dt;
    if (popup) {
      if (popup.t > 0.7) closePopup();
      return;
    }
    if (phase === "accept") {
      var waiting = doc.filter(function (b) { return isClause(b) && b.state === "open" && isBad(b) && onScreen(b) && b.verdict !== "miss"; });
      if (waiting.length) { aim(waiting[0]); return; }
      sel = ACCEPT;
      keyMode = true;
      if (phaseClock > 0.9) acceptAll(false);
      return;
    }
    if (autoT > 0) return;
    for (var i = 0; i < doc.length; i++) {
      var b = doc[i];
      if (!isClause(b) || b.state !== "open" || !onScreen(b)) continue;
      var y = b.top - scroll;
      if (y + b.h > L.view.h) continue;            // not all on screen yet
      b.seen = b.seen || clock;
      if (b.verdict == null) {
        var skill = [0.97, 0.95, 0.94, 0.93][stage];
        b.verdict = isBad(b) ? (Math.random() < skill ? "strike" : "miss") : (Math.random() < 0.025 ? "strike" : "leave");
        b.readFor = 0.35 + b.text.length * 0.012;
      }
      if (b.verdict === "strike" && clock - b.seen > b.readFor) { aim(b); return; }
    }
  }
  function aim(b) {
    var i = doc.indexOf(b);
    keyMode = true;
    if (sel !== i) { sel = i; autoT = 0.18; return; }
    strike(b);
    autoT = 0.25;
  }

  // ---------------------------------------------------------------------------
  // Hints: one arrow at a time, pointing at the thing to deal with now, until
  // you've shown you know (DESIGN.md, section 10)
  // ---------------------------------------------------------------------------
  function pickHint() {
    hintNow = null;
    var learned = run.learned || (run.learned = {});
    if (briefUp()) return;
    if (popup) {
      if (!learned.popup) {
        var r = popupRect();
        hintNow = { x: r.x + r.w / 2, y: r.y - 4, word: touchy() ? "Tap to close" : keyMode ? "Space to close" : "Click to close" };
      }
      return;
    }
    if (phase === "accept" && !accepted) {
      if (!learned.accept) {
        var a = acceptRects().accept;
        hintNow = { x: a.x + a.w / 2, y: a.y - 4, word: "There is no other button" };
      }
      return;
    }
    var want = !learned.strike ? "bad" : stage >= 1 && !learned.sting ? "sting" : stage >= 2 && !learned.small ? "small" : stage >= 3 && !learned.amend ? "amend" : null;
    if (!want) return;
    for (var i = 0; i < doc.length; i++) {
      var b = doc[i];
      if (!isClause(b) || b.state !== "open" || b.type !== want || !onScreen(b)) continue;
      var y = L.view.y + b.top - scroll;
      if (y < L.view.y + L.lh * 2.4 || y + b.h > L.view.y + L.view.h) continue;
      var word = want === "bad" ? (keyMode ? (sel === i ? "Space" : "Down, then Space") : touchy() ? "Tap it" : "Click it")
               : want === "sting" ? "Read to the end" : want === "small" ? "Read the small print" : "Legal changed this";
      var x = L.view.x + L.view.w * 0.5;
      var last = b.lines[b.lines.length - 1];
      if (want === "sting" && last) { var lw = last.words[last.words.length - 1]; x = L.view.x + L.pad + lw.x + lw.w * 0.5; }
      if (want === "amend") x = L.view.x + L.view.w * 0.6;
      hintNow = { x: x, y: y + 2, word: word, block: i };
      return;
    }
  }

  // ---------------------------------------------------------------------------
  // Speech bubbles: one each, Legal's and the mascot's
  // ---------------------------------------------------------------------------
  function say(who, text, force) {
    if (!text) return;
    if (!force && clock - said[who] < 2.2) return;
    said[who] = clock;
    bubbles = bubbles.filter(function (b) { return b.who !== who; });
    bubbles.push({ who: who, text: text, t: 0, life: 1.8 + text.length * 0.045 });
  }
  function speaking(who) {
    for (var i = 0; i < bubbles.length; i++) if (bubbles[i].who === who) return bubbles[i];
    return null;
  }

  // ---------------------------------------------------------------------------
  // Sound: lo-fi, through the kit
  // ---------------------------------------------------------------------------
  var S = N.sound;
  var sfx = {
    tick: function () { S.tone(1500, 0.025, { vol: 0.03 }); },
    flick: function (v) { S.noise(0.18 + v / 4000, { type: "bandpass", freq: 1800, q: 0.7, vol: 0.05 + v / 12000 }); },
    strike: function (mult) {
      S.noise(0.09, { type: "bandpass", freq: 2600, q: 1.6, vol: 0.22 });
      S.noise(0.08, { type: "bandpass", freq: 3400, q: 1.6, vol: 0.18, delay: 0.07 });
      S.stamp(0.13);
      if (mult > 1) S.tone(520 + mult * 130, 0.09, { vol: 0.05, delay: 0.2 });
    },
    wrong: function () {
      S.noise(0.08, { type: "bandpass", freq: 2600, q: 1.6, vol: 0.18 });
      S.tone(150, 0.26, { type: "sawtooth", vol: 0.07, delay: 0.08 });
      S.tone(2100, 0.05, { vol: 0.045, delay: 0.32 });
      S.tone(2800, 0.13, { vol: 0.045, delay: 0.38 });
    },
    signed: function () {
      S.noise(0.22, { type: "bandpass", freq: 1500, q: 1.2, vol: 0.12 });
      S.tone(330, 0.36, { type: "triangle", slide: 160, vol: 0.08, delay: 0.05 });
    },
    ding: function () {
      S.tone(880, 0.08, { type: "sine", vol: 0.08 });
      S.tone(1320, 0.14, { type: "sine", vol: 0.08, delay: 0.09 });
    },
    nope: function () { S.tone(220, 0.09, { type: "square", vol: 0.05 }); S.tone(185, 0.12, { type: "square", vol: 0.05, delay: 0.09 }); },
    snatch: function () { S.whoosh(); S.tone(600, 0.2, { slide: 200, vol: 0.05 }); },
    scribble: function () {
      for (var i = 0; i < 4; i++) S.noise(0.07, { type: "bandpass", freq: 1200 + i * 300, q: 2, vol: 0.12, delay: i * 0.13 });
    },
    jingle: function () {
      [523, 659, 784, 1046].forEach(function (f, i) { S.tone(f, 0.16, { type: "square", vol: 0.045, delay: i * 0.09 }); });
      S.stamp(0.42);
    }
  };

  // ---------------------------------------------------------------------------
  // HUD: the app top left with your rights, the score and the streak top right
  // ---------------------------------------------------------------------------
  function buildHud() {
    var pips = "";
    for (var i = 0; i < RIGHTS + 2; i++) pips += '<span class="tc-pip"></span>';
    shell.hud.innerHTML =
      '<div class="kit-hud-tl">' +
        '<p class="kit-stat"><small>App</small><span data-stage>1/4</span></p>' +
        '<p class="kit-stat tc-rights"><small>Rights</small><span class="tc-pips" data-rights>' + pips + '</span><span class="kit-sr" data-rights-n></span></p>' +
      '</div>' +
      '<div class="kit-hud-tr">' +
        '<p class="kit-stat kit-stat-big"><span data-score>0</span></p>' +
        '<p class="kit-stat" data-minor><small>Streak</small><span data-streak>x1</span></p>' +
      '</div>';
    hudEls = {};
    ["stage", "rights", "rights-n", "score", "streak"].forEach(function (k) { hudEls[k] = shell.hud.querySelector("[data-" + k + "]"); });
    hudEls.pips = Array.prototype.slice.call(shell.hud.querySelectorAll(".tc-pip"));
  }
  function setText(node, text) { if (node && node.textContent !== text) node.textContent = text; }
  function paintHud() {
    if (!hudEls || !run) return;
    setText(hudEls.stage, (stage + 1) + "/4");
    var max = Math.max(RIGHTS, run.rights);
    hudEls.pips.forEach(function (p, i) {
      var want = i >= max ? "none" : "";
      if (p.style.display !== want) p.style.display = want;
      var on = i < run.rights;
      if (p.classList.contains("is-on") && !on && !calm()) {
        p.classList.remove("is-lost");
        void p.offsetWidth;
        p.classList.add("is-lost");
      }
      p.classList.toggle("is-on", on);
    });
    setText(hudEls["rights-n"], " " + Math.max(0, run.rights) + " of " + max);
    // a longer score is a wider corner: measure the HUD again
    if (hudEls.score && hudEls.score.textContent.length !== fmt(run.score).length) hudBoxes = null;
    setText(hudEls.score, fmt(run.score));
    setText(hudEls.streak, "x" + Math.min(4, 1 + Math.floor(run.streak / 3)));
  }

  // ---------------------------------------------------------------------------
  // Drawing
  // ---------------------------------------------------------------------------
  function resize(w, h, dpr) {
    W = w; H = h; DPR = dpr;
    ctx = (shell ? shell.canvas : root.querySelector("canvas")).getContext("2d");
    if (!T) return;
    CAST.init(T, DPR);
    hudFit.done = false;
    layout();
    stampCache = {};
    bg = null;
    hudBoxes = null;
    if (doc.length) measureAll();
  }

  // The still parts, drawn once: the black ground with a little grain, the phone
  function buildBg() {
    var cv = document.createElement("canvas");
    cv.width = Math.round(W * DPR);
    cv.height = Math.round(H * DPR);
    var c = cv.getContext("2d");
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    c.fillStyle = T.ink;
    c.fillRect(0, 0, W, H);
    // speckle, so nothing's perfectly clean
    var r = N.seeded(7);
    c.fillStyle = T.paper;
    for (var i = 0; i < W * H / 900; i++) {
      c.globalAlpha = 0.08 + r() * 0.16;
      c.fillRect(r() * W, r() * H, 1 + r(), 1 + r());
    }
    c.globalAlpha = 1;
    var ph = L.phone;
    if (L.mode === "wide") {
      var cx = W / 2, cy = ph.y + (H - ph.y) * 0.45, R = Math.min(W * 0.5, H * 0.95);
      [[1, 0.13], [0.8, 0.19], [0.6, 0.25], [0.4, 0.31]].forEach(function (ring, i, all) {
        var step = Math.max(4, Math.round(7 * DPR));
        var tile = document.createElement("canvas");
        tile.width = tile.height = step;
        var tc = tile.getContext("2d");
        tc.fillStyle = T.accent;
        tc.beginPath();
        tc.arc(step / 2, step / 2, step * ring[1], 0, Math.PI * 2);
        tc.fill();
        var pat = c.createPattern(tile, "repeat");
        if (pat.setTransform && window.DOMMatrix) pat.setTransform(new DOMMatrix().scale(1 / DPR));
        c.beginPath();
        c.arc(cx, cy, R * ring[0], 0, Math.PI * 2);
        if (all[i + 1]) { c.moveTo(cx + R * all[i + 1][0], cy); c.arc(cx, cy, R * all[i + 1][0], 0, Math.PI * 2, true); }
        c.fillStyle = pat;
        c.fill("evenodd");
      });
    }
    CAST.roundRect(c, ph.x, ph.y, ph.w, ph.h, ph.r);
    c.fillStyle = T.ink;
    c.fill();
    c.lineWidth = 3;
    c.strokeStyle = T.paper;
    c.stroke();
    if (L.mode === "wide") {
      // side buttons
      c.fillStyle = T.ink;
      [[ph.x - 5, ph.y + ph.r * 1.6, 5, 34], [ph.x - 5, ph.y + ph.r * 1.6 + 46, 5, 34], [ph.x + ph.w, ph.y + ph.r * 2, 5, 52]].forEach(function (b) {
        CAST.roundRect(c, b[0], b[1], b[2], b[3], 2);
        c.fill();
        c.lineWidth = 2;
        c.stroke();
      });
    }
    // the screen: paper, rounded at the top like a phone's
    var p = L.page, rr = L.mode === "wide" ? Math.round(ph.r * 0.7) : 14;
    c.beginPath();
    c.moveTo(p.x, p.y + p.h);
    c.lineTo(p.x, p.y + rr);
    c.arcTo(p.x, p.y, p.x + rr, p.y, rr);
    c.lineTo(p.x + p.w - rr, p.y);
    c.arcTo(p.x + p.w, p.y, p.x + p.w, p.y + rr, rr);
    c.lineTo(p.x + p.w, p.y + p.h);
    c.closePath();
    c.fillStyle = T.paper;
    c.fill();
    if (L.mode !== "wide") {
      // the bottom edge of the page, with the cast standing below it
      c.fillStyle = T.ink;
      c.fillRect(p.x, p.y + p.h, p.w, 2);
    }
    return cv;
  }

  function render() {
    if (!ctx || !run || !L) return;
    var state = shell.state();
    if (!hudFit.done && (state === "countdown" || state === "playing")) fitHud();
    if (!noticed && (state === "countdown" || state === "playing")) {
      noticed = true;
      notice();
    }
    if (!bg) bg = buildBg();
    var c = ctx;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.drawImage(bg, 0, 0);
    if (L.mode !== "wide") legends(c);
    var sx = 0, sy = 0;
    if (shake > 0 && !calm()) { sx = (Math.random() - 0.5) * 4 * shake; sy = (Math.random() - 0.5) * 4 * shake; }
    c.setTransform(DPR, 0, 0, DPR, sx * DPR, sy * DPR);

    drawPage(c);
    drawHeader(c);
    if (phase === "accept" || (phase === "done" && footer > 0)) drawFooter(c);
    if (popup) drawPopup(c);
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    drawCast(c);
    drawFx(c);
    drawBubbles(c);
    if (hintNow && state === "playing") drawArrow(c, hintNow.x, hintNow.y, hintNow.word);
    // under the results and the choices between apps, the page steps back so
    // the words on top aren't read against the words underneath
    var back = state === "results" || state === "interlude";
    dim = back ? (calm() ? 1 : Math.min(1, dim + 0.07)) : 0;
    if (dim) {
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.globalAlpha = 0.6 * dim;
      c.fillStyle = T.ink;
      c.fillRect(0, 0, c.canvas.width, c.canvas.height);
      c.globalAlpha = 1;
    }
  }
  var dim = 0;

  // On narrow screens the HUD's corners sit over the phone's top edge: the
  // edge stops short of them, like a label on a form, rather than running
  // through the words
  function legends(c) {
    hudBottom(0, 0);
    var ph = L.phone;
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    c.fillStyle = T.ink;
    hudBoxes.forEach(function (r) {
      if (r.bar || r.bottom < ph.y - 2) return;
      c.fillRect(r.left - 6, ph.y - 3, r.right - r.left + 12, 6);
    });
  }

  // The stage's notice goes up with the countdown, so it's read before Go
  function notice() {
    var how = touchy() ? "tap them" : "click them, or pick with up and down and press Space";
    var close = touchy() ? "tap it to close it" : "click it or press Space";
    var text = BRIEFS[stage].replace("{how}", how).replace("{close}", close);
    shell.brief({ title: "App " + (stage + 1) + ": " + app.name, text: text, ms: stage === 0 ? 7600 : 6800 });
  }

  function screenY(b) { return Math.round((L.view.y + b.top - scroll + pull) * DPR) / DPR; }

  function drawPage(c) {
    var v = L.view;
    c.save();
    c.beginPath();
    c.rect(v.x, v.y, v.w, v.h);
    c.clip();
    for (var i = 0; i < doc.length; i++) {
      var b = doc[i];
      var y = screenY(b);
      if (y + b.h < v.y - 2) continue;
      if (y > v.y + v.h) break;
      // the highlight: solid peach for the keys' choice, halftone for the mouse
      if (keyMode && sel === i) {
        c.fillStyle = T.accent;
        c.fillRect(v.x, y, v.w, b.h);
        c.fillStyle = T.ink;
        c.fillRect(v.x, y, 5, b.h);
      } else if ((!keyMode && hover === i && b.state === "open") || (hintNow && hintNow.block === i)) {
        c.fillStyle = CAST.dots(c, T.accent, DPR, 2.6);
        c.fillRect(v.x, y, v.w, b.h);
        c.fillStyle = T.accent;
        c.fillRect(v.x, y, 5, b.h);
      }
      if (b.amendedAt && clock - b.amendedAt < 0.6 && !calm()) {
        c.globalAlpha = 1 - (clock - b.amendedAt) / 0.6;
        c.fillStyle = T.accent;
        c.fillRect(v.x, y, v.w, b.h);
        c.globalAlpha = 1;
      }
      var img = blockImage(b);
      c.drawImage(img, v.x, y, v.w, b.h);
      if (isClause(b)) drawMarks(c, b, y);
    }
    // points, floating up off the page
    pops.forEach(function (p) {
      var k = p.t / 0.9, py = L.view.y + p.y - scroll + pull - (calm() ? 0 : k * 22);
      c.globalAlpha = 1 - k * k;
      c.font = Math.round(L.fs * 1.15) + "px " + T.display;
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.lineWidth = 4;
      c.strokeStyle = T.paper;
      c.strokeText(p.text, p.x, py);
      c.fillStyle = T.ink;
      c.fillText(p.text, p.x, py);
      c.globalAlpha = 1;
    });
    c.restore();
    drawScrollbar(c);
  }

  // Red pen through the lines, a stamp, a circle round the words that gave
  // it away; "stet" for a wrong strike; a signature for one that got through
  function drawMarks(c, b, y) {
    var x0 = L.view.x + L.pad, base = y + L.pad * 0.55 + L.lh * 0.5;
    if (b.hinted && b.state === "open") {
      c.save();
      c.strokeStyle = T.accent;
      c.lineWidth = 3;
      CAST.roundRect(c, L.view.x + 4, y + 2, L.view.w - 12, b.h - 4, 10);
      c.stroke();
      c.restore();
    }
    if (b.state === "struck" || b.state === "stet") {
      var age = clock - b.struckAt;
      var each = 0.07, n = b.lines.length + (b.footLines.length || 0);
      c.strokeStyle = T.red;
      c.lineCap = "round";
      c.lineWidth = Math.max(2, L.fs * 0.17);
      c.globalAlpha = b.state === "stet" ? clamp(1 - (age - 0.35) * 2, 0.4, 1) : 1;
      var lines = b.lines.concat(b.footLines);
      lines.forEach(function (line, li) {
        var k = clamp((age - li * each) / each, 0, 1);
        if (calm()) k = age > 0 ? 1 : 0;
        if (!k) return;
        var foot = li >= b.lines.length;
        var ly = foot ? y + L.pad * 0.55 + b.lines.length * L.lh + 3 + (li - b.lines.length + 0.45) * L.footLh : base + li * L.lh;
        var lx = x0 + (foot ? L.pad : 0) - 2, w = line.w + 4;
        var wob = ((li * 37 + b.top) % 7) / 7 - 0.5;
        c.beginPath();
        c.moveTo(lx, ly + wob);
        c.quadraticCurveTo(lx + w * k * 0.5, ly - wob * 2, lx + w * k, ly + wob * 1.5);
        c.stroke();
      });
      c.globalAlpha = 1;
      if (b.state === "struck") {
        if (age > n * each) drawCulprits(c, b, y);
        drawStamp(c, b, y, age - Math.min(0.2, n * each));
      } else if (age > 0.3) {
        // Legal's "stet": let it stand
        var sw = L.fs * 3, sh = L.fs * 1.4;
        var sx = L.view.x + L.view.w - L.pad - sw, sy2 = y + b.h * 0.5 - sh / 2;
        c.save();
        c.translate(sx + sw / 2, sy2 + sh / 2);
        c.rotate(-0.06);
        c.fillStyle = T.accent;
        c.fillRect(-sw / 2, -sh / 2, sw, sh);
        c.lineWidth = 2;
        c.strokeStyle = T.ink;
        c.strokeRect(-sw / 2, -sh / 2, sw, sh);
        c.fillStyle = T.ink;
        c.font = Math.round(L.fs * 1.05) + "px " + T.display;
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.fillText("STET", 0, 1);
        c.restore();
      }
    } else if (b.state === "signed") {
      // a signature, scrawled across it
      var sage = clamp((clock - b.signedAt) / 0.4, 0, 1);
      if (calm()) sage = 1;
      var sy = y + b.h * 0.62, sx0 = x0 + L.view.w * 0.12, sx1 = L.view.x + L.view.w * 0.82;
      c.save();
      c.beginPath();
      var steps = 30, end = Math.max(1, Math.round(steps * sage));
      for (var i = 0; i <= end; i++) {
        var t = i / steps, xx = sx0 + (sx1 - sx0) * t;
        var yy = sy + Math.sin(t * 22 + b.top) * L.fs * 0.5 * (0.6 + Math.sin(t * 5) * 0.4) - t * L.fs * 0.6;
        if (i) c.lineTo(xx, yy); else c.moveTo(xx, yy);
      }
      c.strokeStyle = T.ink;
      c.lineWidth = 2.2;
      c.lineJoin = "round";
      c.stroke();
      c.restore();
    }
  }

  // red rings round the last words of a sting, the small print, Legal's edit
  function drawCulprits(c, b, y) {
    var groups = [];
    b.lines.forEach(function (line, li) {
      var ws = line.words.filter(function (w) { return w.culprit; });
      if (ws.length) groups.push({ x0: ws[0].x, x1: ws[ws.length - 1].x + ws[ws.length - 1].w, y: y + L.pad * 0.55 + L.lh * (li + 0.5), h: L.lh });
    });
    b.footLines.forEach(function (line, li) {
      var ws = line.words.filter(function (w) { return w.culprit; });
      if (ws.length) groups.push({ x0: ws[0].x + L.pad, x1: ws[ws.length - 1].x + ws[ws.length - 1].w + L.pad, y: y + L.pad * 0.55 + b.lines.length * L.lh + 3 + L.footLh * (li + 0.4), h: L.footLh });
    });
    c.strokeStyle = T.red;
    c.lineWidth = 2.2;
    groups.forEach(function (g) {
      var cx = L.view.x + L.pad + (g.x0 + g.x1) / 2;
      c.beginPath();
      c.ellipse(cx, g.y, (g.x1 - g.x0) / 2 + 7, g.h * 0.62, -0.03, 0, Math.PI * 2);
      c.stroke();
    });
  }

  // A stamp, made once per word: red double border, worn ink
  function stampImage(word, size) {
    var k = word + size;
    if (stampCache[k]) return stampCache[k];
    var cv = document.createElement("canvas");
    var c = cv.getContext("2d");
    var font = size + "px " + T.display;
    c.font = font;
    var tw = c.measureText(word.toUpperCase()).width;
    var w = Math.ceil(tw + size * 1.3), h = Math.ceil(size * 1.75);
    cv.width = Math.round(w * DPR);
    cv.height = Math.round(h * DPR);
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    c.fillStyle = T.paper;
    CAST.roundRect(c, 1, 1, w - 2, h - 2, 3);
    c.fill();
    c.strokeStyle = T.red;
    c.lineWidth = Math.max(2, size * 0.12);
    CAST.roundRect(c, 2, 2, w - 4, h - 4, 3);
    c.stroke();
    c.lineWidth = 1;
    CAST.roundRect(c, size * 0.24, size * 0.24, w - size * 0.48, h - size * 0.48, 2);
    c.stroke();
    c.fillStyle = T.red;
    c.font = font;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(word.toUpperCase(), w / 2, h / 2 + size * 0.05);
    // worn: knock little flecks out of the ink
    c.globalCompositeOperation = "destination-out";
    var r = N.seeded(word.length * 97 + size);
    for (var i = 0; i < w * h / 14; i++) {
      c.globalAlpha = 0.5 + r() * 0.5;
      c.fillRect(r() * w, r() * h, 0.6 + r() * 1.2, 0.6 + r() * 1.2);
    }
    stampCache[k] = { img: cv, w: w, h: h };
    return stampCache[k];
  }

  function drawStamp(c, b, y, age) {
    if (age < 0) return;
    var s = stampImage(b.type === "amend" ? "Overruled" : "Void", Math.round(L.fs * 1.1));
    var tilt = (((b.top * 13) % 11) - 5) * 0.02 - 0.04;
    var cx = L.view.x + L.view.w - L.pad - s.w * 0.55, cy = y + b.h * 0.5;
    var k = clamp(age / 0.28, 0, 1), scale = 1, alpha = 1;
    if (calm()) alpha = k;
    else scale = k < 0.6 ? 1.9 - k / 0.6 * 0.98 : k < 0.8 ? 0.92 + (k - 0.6) / 0.2 * 0.11 : 1.03 - (k - 0.8) / 0.2 * 0.03;
    if (!calm()) alpha = Math.min(1, k * 3);
    c.save();
    c.globalAlpha = alpha;
    c.translate(cx, cy);
    c.rotate(tilt);
    c.scale(scale, scale);
    c.drawImage(s.img, -s.w / 2, -s.h / 2, s.w, s.h);
    c.restore();
  }

  function drawScrollbar(c) {
    var v = L.view, x = v.x + v.w - 5, top = v.y + 4, h = v.h - 8;
    var share = clamp(v.h / Math.max(docH, 1), 0.06, 1);
    var at = clamp(scroll / Math.max(1, docH - v.h), 0, 1);
    c.fillStyle = CAST.dots(c, T.ink, DPR, 2.6);
    c.fillRect(x, top, 3, h);
    c.fillStyle = T.ink;
    CAST.roundRect(c, x - 0.5, top + (h - h * share) * at, 4, h * share, 2);
    c.fill();
  }

  // The app's own header: the phone's status bar, the app's name, the page count
  function drawHeader(c) {
    var p = L.page, sb = L.status, bar = L.bar;
    var rr = L.mode === "wide" ? Math.round(L.phone.r * 0.7) : 14;
    c.save();
    c.beginPath();
    c.moveTo(p.x, p.y + L.head);
    c.lineTo(p.x, p.y + rr);
    c.arcTo(p.x, p.y, p.x + rr, p.y, rr);
    c.lineTo(p.x + p.w - rr, p.y);
    c.arcTo(p.x + p.w, p.y, p.x + p.w, p.y + rr, rr);
    c.lineTo(p.x + p.w, p.y + L.head);
    c.closePath();
    var dark = app.header === "ink";
    var fg = dark ? T.paper : T.ink;
    c.fillStyle = dark ? T.ink : T.accent;
    c.fill();
    if (dark) {
      // a dark app: a peach rule under it, and the bank's double line
      c.fillStyle = T.accent;
      c.fillRect(p.x, p.y + L.head - 4, p.w, 4);
      if (app.key === "bank") { c.fillStyle = T.paper; c.fillRect(p.x + L.pad, p.y + L.head - 9, p.w - L.pad * 2, 1.5); }
    } else {
      c.fillStyle = T.ink;
      c.fillRect(p.x, p.y + L.head - 2, p.w, 2);
    }
    c.fillStyle = fg;
    // status bar: the time, a notch, the battery (which the torch is draining)
    c.fillStyle = fg;
    var now = new Date();
    var time = (now.getHours() < 10 ? "0" : "") + now.getHours() + ":" + (now.getMinutes() < 10 ? "0" : "") + now.getMinutes();
    var fsz = Math.max(12, Math.round(sb * 0.82));
    c.font = fsz + "px " + T.display;
    c.textBaseline = "middle";
    c.textAlign = "left";
    c.fillText(time, p.x + rr * 0.9, p.y + sb * 0.62);
    CAST.roundRect(c, p.x + p.w / 2 - p.w * 0.12, p.y + 3, p.w * 0.24, sb * 0.62, sb * 0.31);
    c.fillStyle = T.ink;
    c.fill();
    if (dark) { c.lineWidth = 1.2; c.strokeStyle = T.paper; c.stroke(); }
    var progress = clamp(scroll / Math.max(1, docH - L.view.h), 0, 1);
    var level = [1 - 0.55 * progress, 0.45 - 0.2 * progress, 0.25 - 0.1 * progress, 0.12 - 0.08 * progress][stage];
    var bw = sb * 1.5, bh = sb * 0.62, bx = p.x + p.w - rr * 0.9 - bw, by = p.y + sb * 0.62 - bh / 2;
    c.lineWidth = 1.4;
    c.strokeStyle = fg;
    c.strokeRect(bx, by, bw, bh);
    c.fillStyle = fg;
    c.fillRect(bx + bw, by + bh * 0.3, 2, bh * 0.4);
    c.fillStyle = level < 0.2 ? T.red : fg;
    c.fillRect(bx + 1.5, by + 1.5, (bw - 3) * clamp(level, 0.04, 1), bh - 3);
    // signal bars
    c.fillStyle = fg;
    for (var s = 0; s < 4; s++) c.fillRect(bx - 8 - (3 - s) * 4, by + bh - (s + 1) * bh / 4, 2.6, (s + 1) * bh / 4);
    // the app bar
    var iy = p.y + sb + bar / 2, isz = bar * 0.7;
    CAST.icon(c, p.x + L.pad + isz / 2, iy, isz);
    c.fillStyle = fg;
    c.font = Math.round(bar * 0.5) + "px " + T.display;
    c.textAlign = "left";
    c.fillText(app.name.toUpperCase(), p.x + L.pad + isz + 8, iy + 1);
    var pages = 1 + Math.floor(progress * (app.pages - 1));
    c.font = Math.max(12, Math.round(bar * 0.36)) + "px " + T.display;
    c.textAlign = "right";
    c.fillText("PAGE " + fmt(pages) + " OF " + fmt(app.pages), p.x + p.w - L.pad, iy + 1);
    c.restore();
  }

  // Accept, and a very small Decline
  function acceptRects() {
    var v = L.view, k = calm() ? 1 : 1 - Math.pow(1 - footer, 3);
    var fh = L.fs * 5.6, fy = v.y + v.h - fh * k;
    var bw = Math.min(v.w * 0.62, L.fs * 13), bh = L.fs * 2.6;
    var accept = { x: v.x + (v.w - bw) / 2, y: fy + L.fs * 0.8, w: bw, h: bh };
    c_dec.font = Math.max(12, Math.round(L.fs * 0.78)) + "px " + bodyFont();
    var dw = c_dec.measureText("Decline").width + 12;
    var decline = { x: v.x + (v.w - dw) / 2, y: accept.y + bh + L.fs * 0.35, w: dw, h: L.fs * 1.3 };
    return { panel: { x: v.x, y: fy, w: v.w, h: fh }, accept: accept, decline: decline };
  }
  var c_dec = document.createElement("canvas").getContext("2d");

  function drawFooter(c) {
    var r = acceptRects(), p = r.panel;
    c.fillStyle = T.paper;
    c.fillRect(p.x, p.y, p.w, p.h);
    c.fillStyle = T.ink;
    c.fillRect(p.x, p.y, p.w, 2);
    var a = r.accept, pressed = accepted;
    var pulse = calm() || accepted ? 0 : Math.sin(clock * 5) * 0.5 + 0.5;
    c.save();
    c.translate(0, pressed ? 3 : 0);
    if (!pressed) {
      CAST.roundRect(c, a.x, a.y + 4, a.w, a.h, 8);
      c.fillStyle = T.ink;
      c.fill();
    }
    CAST.roundRect(c, a.x, a.y, a.w, a.h, 8);
    c.fillStyle = T.accent;
    c.fill();
    c.lineWidth = 2.6;
    c.strokeStyle = T.ink;
    c.stroke();
    if (keyMode && sel === ACCEPT) {
      // the keys' focus: a ring round it
      CAST.roundRect(c, a.x - 5, a.y - 5, a.w + 10, a.h + 10, 12);
      c.lineWidth = 2.6;
      c.stroke();
    } else if (pulse && !keyMode) {
      c.globalAlpha = 0.5 * pulse;
      CAST.roundRect(c, a.x - 4, a.y - 4, a.w + 8, a.h + 8, 11);
      c.lineWidth = 2;
      c.stroke();
      c.globalAlpha = 1;
    }
    c.fillStyle = T.ink;
    c.font = Math.round(L.fs * 1.5) + "px " + T.display;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("ACCEPT", a.x + a.w / 2, a.y + a.h / 2 + 1);
    c.restore();
    var d = r.decline;
    c.font = Math.max(12, Math.round(L.fs * 0.78)) + "px " + bodyFont();
    c.fillStyle = T.ink;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("Decline", d.x + d.w / 2, d.y + d.h / 2);
    c.fillRect(d.x + 6, d.y + d.h / 2 + L.fs * 0.42, d.w - 12, 1);
    if (keyMode && sel === DECLINE) {
      c.lineWidth = 2;
      c.strokeStyle = T.ink;
      c.strokeRect(d.x, d.y, d.w, d.h);
    }
  }

  function drawPopup(c) {
    var v = L.view, r = popupRect(), def = popup.def;
    var k = calm() ? 1 : clamp(popup.t / 0.16, 0, 1);
    // the page behind, greyed with halftone
    c.fillStyle = CAST.dots(c, T.ink, DPR, 3);
    c.fillRect(v.x, v.y, v.w, v.h);
    c.save();
    c.translate(r.x + r.w / 2, r.y + r.h / 2);
    c.scale(0.85 + 0.15 * k, 0.85 + 0.15 * k);
    c.globalAlpha = k;
    CAST.roundRect(c, -r.w / 2 + 4, -r.h / 2 + 5, r.w, r.h, 12);
    c.fillStyle = T.ink;
    c.fill();
    CAST.roundRect(c, -r.w / 2, -r.h / 2, r.w, r.h, 12);
    c.fillStyle = T.paper;
    c.fill();
    c.lineWidth = 3;
    c.strokeStyle = T.ink;
    c.stroke();
    c.fillStyle = T.accent;
    c.save();
    CAST.roundRect(c, -r.w / 2, -r.h / 2, r.w, r.h, 12);
    c.clip();
    c.fillRect(-r.w / 2, -r.h / 2, r.w, L.fs * 0.55);
    c.restore();
    c.fillStyle = T.ink;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.font = Math.round(L.fs * 1.3) + "px " + T.display;
    c.fillText(def.title.toUpperCase(), 0, -r.h / 2 + L.fs * 1.9);
    c.font = L.fonts.small;
    c.fillText(def.text, 0, -r.h / 2 + L.fs * 3.5, r.w - 20);
    var by = r.h / 2 - L.fs * 2.4;
    if (def.stars) {
      for (var s = 0; s < 5; s++) star(c, (s - 2) * L.fs * 1.6, -r.h / 2 + L.fs * 5.1, L.fs * 0.62);
    }
    var n = def.buttons.length, gap = 8, bw = Math.min((r.w - 24 - gap * (n - 1)) / n, L.fs * 8), bh = L.fs * 1.9;
    var x0 = -(bw * n + gap * (n - 1)) / 2;
    def.buttons.forEach(function (label, i) {
      var bx = x0 + i * (bw + gap);
      CAST.roundRect(c, bx, by, bw, bh, 6);
      c.fillStyle = i === 0 ? T.accent : T.paper;
      c.fill();
      c.lineWidth = 2;
      c.strokeStyle = T.ink;
      c.stroke();
      c.fillStyle = T.ink;
      c.font = Math.round(L.fs * 0.98) + "px " + T.display;
      c.fillText(label.toUpperCase(), bx + bw / 2, by + bh / 2 + 1);
    });
    c.restore();
  }
  function star(c, x, y, r) {
    c.beginPath();
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r;
      c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    c.closePath();
    c.fillStyle = T.accent;
    c.fill();
    c.lineWidth = 1.6;
    c.strokeStyle = T.ink;
    c.stroke();
  }

  // ---------- Legal and the mascot ----------
  function castPose(who) {
    var spot = who === "legal" ? L.legal : L.mascot;
    var talking = speaking(who) || (who === "legal" && (arm || pen > 0));
    // the peekers rise up to talk and sink back down after
    var key = who + "Rise";
    var want = talking || phase === "accept" ? 1 : 0;
    castPose[key] = castPose[key] == null ? want : castPose[key] + (want - castPose[key]) * 0.12;
    var rise = calm() ? want : castPose[key];
    return { x: spot.x, y: spot.y - spot.up * rise, s: spot.s };
  }

  function drawCast(c) {
    var lp = castPose("legal"), mp = castPose("mascot");
    var lb = speaking("legal");
    var face = pen > 0 ? "smug" : lb ? (lb.text.length < 22 || /Objection|Billable|Stet|Pen/.test(lb.text) ? "shout" : "glare") : phase === "accept" ? "smug" : "glare";
    var reach = null;
    if (arm) {
      var tgt = armTarget();
      var k = arm.phase === "reach" ? clamp(arm.t / 0.5, 0, 1) : arm.phase === "write" ? 1 : 1 - clamp(arm.t / 0.45, 0, 1);
      k = 1 - Math.pow(1 - k, 2);
      var ox = (tgt.x - lp.x) / lp.s, oy = (tgt.y - lp.y) / lp.s;
      var hx = 34, hy = -50;
      reach = { x: hx + (ox - hx) * k, y: hy + (oy - hy) * k, scribble: arm.phase === "write" };
    }
    // he looks at what's happening: the pen, the clause being struck, you
    var look = { x: 0.7, y: 0.1 };
    if (arm) look = { x: 0.9, y: -0.3 };
    else if (L.mode !== "wide") look = { x: 0.6, y: -0.6 };
    CAST.legal(c, lp.x, lp.y, lp.s, {
      face: arm ? "smug" : face, anim: clock, look: look, reach: reach, calm: calm(),
      fist: !reach && lb && face === "shout" && pen <= 0, pen: pen > 0 && !reach
    });
    var mb = speaking("mascot");
    CAST.mascot(c, mp.x, mp.y, mp.s, app.key, {
      anim: clock, calm: calm(), wave: mb ? 1 : 0.25, hop: accepted && !calm() ? Math.abs(Math.sin(phaseClock * 9)) * 0.6 : 0,
      look: L.mode === "wide" ? { x: -0.8, y: 0.1 } : { x: -0.5, y: -0.5 }
    });
  }

  // Bubbles over the speaker's head. In the corners they lean inwards.
  function drawBubbles(c) {
    var placed = [];
    bubbles.forEach(function (b) {
      var who = b.who === "legal" ? castPose("legal") : castPose("mascot");
      var headTop = b.who === "legal" ? who.y - 140 * who.s : who.y - 112 * who.s;
      var ax = who.x, ay = headTop;
      c.font = L.fonts.bubble;
      var size = parseFloat(L.fonts.bubble);
      var maxW = Math.max(110, L.bubbleW);
      var lines = [""];
      b.text.toUpperCase().split(" ").forEach(function (w) {
        var tryLine = lines[lines.length - 1] ? lines[lines.length - 1] + " " + w : w;
        if (c.measureText(tryLine).width > maxW - size && lines[lines.length - 1]) lines.push(w);
        else lines[lines.length - 1] = tryLine;
      });
      var tw = 0;
      lines.forEach(function (l) { tw = Math.max(tw, c.measureText(l).width); });
      var pad = size * 0.55, lh = size * 1.04;
      var bw = tw + pad * 2, bh = lines.length * lh + pad * 1.2;
      var bx, by;
      if (L.mode === "wide") {
        bx = clamp(ax - bw / 2, 8, W - bw - 8);
        if (b.who === "legal") bx = clamp(ax - bw / 2, 8, L.phone.x - bw - 6);
        else bx = clamp(ax - bw / 2, L.phone.x + L.phone.w + 6, W - bw - 8);
        by = clamp(ay - bh - size * 0.8, hudBottom(bx, bw) + 6, H - bh - 8);
      } else {
        // lean in over the page, towards the middle
        bx = b.who === "legal" ? clamp(ax - bw * 0.2, 6, W - bw - 6) : clamp(ax - bw * 0.8, 6, W - bw - 6);
        by = clamp(ay - bh - size * 0.7, L.view.y + 6, H - bh - 6);
      }
      for (var k = 0; k < placed.length; k++) {
        var o = placed[k];
        if (bx < o.x + o.w + 4 && bx + bw + 4 > o.x && by < o.y + o.h + 4 && by + bh + 4 > o.y) by = o.y - bh - 8;
      }
      placed.push({ x: bx, y: by, w: bw, h: bh });
      var tailX = clamp(ax, bx + 14, bx + bw - 14);
      var pop = calm() ? 1 : clamp(b.t * 9, 0, 1);
      c.globalAlpha = Math.min(pop, clamp((b.life - b.t) * 4, 0, 1));
      var r = Math.min(10, bh / 2);
      c.beginPath();
      c.moveTo(bx + r, by);
      c.arcTo(bx + bw, by, bx + bw, by + bh, r);
      c.arcTo(bx + bw, by + bh, bx, by + bh, r);
      c.lineTo(tailX + 7, by + bh);
      c.lineTo(tailX + (b.who === "legal" ? -4 : 4), by + bh + size * 0.85);
      c.lineTo(tailX - 7, by + bh);
      c.arcTo(bx, by + bh, bx, by, r);
      c.arcTo(bx, by, bx + bw, by, r);
      c.closePath();
      c.save();
      c.translate(3, 4);
      c.fillStyle = T.ink;
      c.fill();
      c.restore();
      c.fillStyle = T.paper;
      c.fill();
      c.lineWidth = 2.6;
      c.lineJoin = "round";
      c.strokeStyle = T.ink;
      c.stroke();
      c.fillStyle = T.ink;
      c.textAlign = "center";
      c.textBaseline = "top";
      lines.forEach(function (l, i) { c.fillText(l, bx + bw / 2, by + pad * 0.72 + i * lh); });
      c.globalAlpha = 1;
    });
  }

  // the bottom of whatever HUD sits above this stretch of the screen
  var hudBoxes = null, hudAge = 0;
  function hudBottom(x, w) {
    if (!hudBoxes || ++hudAge > 90) {
      hudAge = 0;
      var base = root.getBoundingClientRect();
      hudBoxes = [];
      Array.prototype.forEach.call(root.querySelectorAll(".kit-hud-tl, .kit-hud-tr, .kit-bar"), function (el) {
        var r = el.getBoundingClientRect();
        if (r.width) hudBoxes.push({ left: r.left - base.left, right: r.right - base.left, bottom: r.bottom - base.top, bar: el.classList.contains("kit-bar") });
      });
    }
    var bottom = 0;
    hudBoxes.forEach(function (r) { if (x < r.right + 4 && x + w > r.left - 4) bottom = Math.max(bottom, r.bottom); });
    return bottom;
  }

  function drawFx(c) {
    fx.forEach(function (e) {
      if (e.kind !== "ink") return;
      var k = e.t / e.life;
      c.globalAlpha = 1 - k;
      c.fillStyle = T.red;
      c.beginPath();
      c.arc(e.x + e.vx * e.t, L.view.y + e.y0 - scroll + e.vy * e.t, e.r * (1 - k * 0.5), 0, Math.PI * 2);
      c.fill();
      c.globalAlpha = 1;
    });
  }

  // A small bobbing arrow with a word on it
  function drawArrow(c, x, y, word) {
    var bob = calm() ? 0 : Math.abs(Math.sin(clock * 4)) * -5;
    c.save();
    c.translate(Math.round(x), Math.round(y + bob));
    c.lineJoin = "round";
    c.beginPath();
    c.moveTo(-5, -18); c.lineTo(5, -18); c.lineTo(5, -8); c.lineTo(11, -8); c.lineTo(0, 3); c.lineTo(-11, -8); c.lineTo(-5, -8);
    c.closePath();
    c.fillStyle = T.accent;
    c.fill();
    c.lineWidth = 2.2;
    c.strokeStyle = T.ink;
    c.stroke();
    var size = Math.round(clamp(L.fs * 0.86, 12, 15));
    c.font = size + "px " + T.display;
    var text = word.toUpperCase(), tw = c.measureText(text).width;
    var tx = clamp(0, -x + tw / 2 + 10, W - x - tw / 2 - 10);
    CAST.roundRect(c, tx - tw / 2 - 6, -20 - size * 1.5, tw + 12, size * 1.4, 4);
    c.fillStyle = T.ink;
    c.fill();
    c.lineWidth = 1.5;
    c.strokeStyle = T.paper;
    c.stroke();
    c.fillStyle = T.paper;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(text, tx, -20 - size * 0.8);
    c.restore();
  }

  // ---------------------------------------------------------------------------
  // Start it up
  // ---------------------------------------------------------------------------
  shell = N.createGame({
    root: root,
    slug: "terms-and-conditions",
    title: "Terms and Conditions",
    stamp: "Unread",
    tilt: -5,
    note: "Four apps, four sets of terms. Strike the bad clauses. Then accept anyway.",
    pitch: "Read the terms. Strike out the bad bits. Accept anyway. There is no other button.",
    hints: {
      keys: "Click a bad clause to strike it, or pick one with up and down (W, S) and press Space. Scroll to read ahead. P to pause.",
      touch: "Tap a bad clause to strike it. Flick the page up to read ahead."
    },
    againLabel: "Read again",
    daily: { label: "Today's terms" },
    keys: {
      up: ["ArrowUp", "KeyW"], down: ["ArrowDown", "KeyS"], left: ["ArrowLeft", "KeyA"], right: ["ArrowRight", "KeyD"],
      action: ["Space", "Enter"]
    },
    pad: { action: [0, 2] },
    smallCallouts: true,
    reset: reset,
    update: function (dt, input) { update(dt, input); },
    render: function () { render(); },
    resize: resize
  });
  T = shell.tokens;
  CAST.init(T, DPR);

  // The canvas fonts may arrive after the first frame: set the text again when they do
  if (document.fonts && document.fonts.load) {
    document.fonts.load("16px " + T.display).then(function () {
      stampCache = {};
      if (doc.length && L) measureAll();
    });
  }

  if (DEBUG) {
    window.__terms = {
      run: function () { return run; },
      doc: function () { return doc; },
      state: function () { return { stage: stage + 1, phase: phase, scroll: Math.round(scroll), docH: docH, sel: sel, mode: L && L.mode, fs: L && L.fs }; },
      strike: function (i) { strike(doc[i]); },
      // the first open clause of a type that's fully on screen, and where its middle is
      find: function (type) {
        for (var i = 0; i < doc.length; i++) {
          var b = doc[i], y = b.top - scroll;
          if (isClause(b) && b.state === "open" && (!type || b.type === type) && y > L.lh && y + b.h < L.view.h - L.lh) {
            return { i: i, x: Math.round(L.view.x + L.view.w * 0.4), y: Math.round(L.view.y + y + b.h / 2), text: b.text, state: b.state };
          }
        }
        return null;
      },
      // every open clause that's all on screen, top first: { i, type, bad, x, y }
      spots: function () {
        var out = [];
        doc.forEach(function (b, i) {
          var y = b.top - scroll;
          if (isClause(b) && b.state === "open" && y > L.lh && y + b.h < L.view.h - L.lh) {
            out.push({ i: i, type: b.type, bad: isBad(b), x: Math.round(L.view.x + L.view.w * 0.4), y: Math.round(L.view.y + y + b.h / 2) });
          }
        });
        return out;
      },
      block: function (i) { var b = doc[i]; return { type: b.type, state: b.state, text: b.text }; },
      armOut: function () { return !!arm && arm.phase === "write"; },
      popupUp: function () { return !!popup; },
      // how long this app's terms take to scroll, and how long a line is on screen
      pace: function () {
        var st = STAGES[stage], v = scrollSpeed() / (1 + st.ramp * clamp(scroll / Math.max(1, docH - L.view.h), 0, 1));
        var avg = v * (1 + st.ramp / 2), travel = docH - L.view.h * 0.66 + L.view.h * 0.3;
        return { mode: L.mode, fs: L.fs, viewH: Math.round(L.view.h), lines: +(L.view.h / L.lh).toFixed(1), pxs: +avg.toFixed(1),
                 seconds: Math.round(travel / avg), onScreen: +(L.view.h / avg).toFixed(1), clauses: doc.filter(isClause).length };
      },
      popup: function () { openPopup(C.popups[0]); },
      // where the pop-up and the buttons at the bottom are, for test scripts that tap them
      rects: function () { return { popup: popup ? popupRect() : null, accept: phase === "accept" ? acceptRects() : null }; },
      // the pop-ups still to come this app, and when
      plan: function () { return popupPlan.map(function (p) { return [+p.at.toFixed(4), p.def.title]; }); },
      say: say,
      // jump to the bottom of the terms, having struck everything bad on the way
      skip: function () {
        doc.forEach(function (b) { if (isClause(b) && b.state === "open" && isBad(b)) { b.state = "struck"; b.struckAt = clock - 1; } });
        var end = doc[doc.length - 1];
        scroll = end.top + end.h - L.view.h * 0.7;
      }
    };
  }
})();
