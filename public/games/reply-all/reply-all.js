// Reply All: someone has replied all to the whole company. Now everyone is
// replying all to say stop replying all.
//
// THE GAME
// An open-plan office, seen from the front: a grid of desks, a cut-out office
// worker at each. Workers get the itch: a bar fills over their head while
// they type, and a speech bubble says what ("Please remove me from this
// list", "+1", "Per my last email"). Click or tap them, or move the cursor
// with the arrows and press Space, before the bar fills and they hit Send.
// Every reply that gets out flies to the server, fills its load gauge, and
// lands in everyone's inbox, which sets off two more desks. Miss one, get two.
// The server drains slowly; fill it and it melts, and the run is over.
//
// A round is one working day, 09:00 to 17:00, in four stages of two office
// hours each (about 28 to 40 seconds of play apiece, a bit over two minutes
// in all). Each stage adds something, said in a notice (shell.brief) before Go:
//   1. Your team (09:00): nine desks. Just the itch, the bar and the click.
//   2. The department (11:00): twelve desks. The +1 crowd, who reply from
//      their phones twice as fast. And Mute thread (E or Shift, or the Mute
//      button): stops the busiest row at once, marked in red brackets, then
//      recharges.
//   3. The whole company (13:00): sixteen desks. Long emails (a red flag on
//      the bar) take two goes to stop and fill the server more. Two desks are
//      out of office: they can't be stopped, and auto-reply to every reply
//      that gets out.
//   4. The CEO's assistant (15:00): a glass corner office. The assistant
//      can't be stopped and every few seconds, very sadly, asks everyone to
//      stop replying all. To everyone. That sets off four desks at once.
//      Hold on until 17:00.
// Between stages (shell.interlude) IT offer three fixes, each with a cost:
// turn the server off and on again, a bigger server, etiquette training,
// hiding the reply all button, inbox rules, or an intern.
//
// SCORING
// Stopping someone scores 100, times a streak multiplier (x2 after 6 in a row
// without a reply getting out, up to x5), plus 50 for a long email and 50 for
// a close call (the bar nearly full). Each stage ends with a bonus for how
// much server is left (500 x the stage number, scaled by what's left), 1,000
// more if nothing got out that stage, and 2,500 for making it to 17:00.
//
// THE LADDER (results stamp)
//   Approved        home at 17:00 with 3 or fewer replies got out all day
//   Pending review  home at 17:00
//   Not approved    the server melted in the afternoon (stage 3 or 4)
//   Rejected        the server melted before lunch (stage 1 or 2)
//
// THE JOKE
// Company email and our own habits: replying all to complain about replying
// all, +1, per my last email, the out of office that answers everything, the
// email from the top asking everyone to stop, sent to everyone. Nobody is the
// punchline for who they are. The office is invented; nobody in it is real.
//
// Built on the shared kit (/games/kit/kit.js): intro, screens, controls,
// sound and saving. office.js draws the people, desks and the server.
(function () {
  "use strict";

  var N = window.Notaste;
  var A = window.ReplyAllArt;
  var root = document.getElementById("game-root");
  if (!N || !A || !root) return;

  var params = new URLSearchParams(window.location.search);
  var AUTOPILOT = N.flags.autopilot;      // ?autopilot or ?clip: the computer stops the replies
  var DEBUG = params.has("debug");
  var FIRST = DEBUG ? Math.max(0, Math.min(3, (parseInt(params.get("stage"), 10) || 1) - 1)) : 0;
  // ?debug&skill=0.6: a slower autopilot, for tuning the difficulty
  var SKILL = DEBUG && params.has("skill") ? Math.max(0.3, Math.min(2, parseFloat(params.get("skill")) || 1)) : N.flags.clip ? 0.85 : 1;

  // ---------------------------------------------------------------------------
  // Tuning. A desk is drawn in a box 100 local units wide and 76 tall; rows
  // overlap a little (a bar sits over the desk in front of the row above).
  // ---------------------------------------------------------------------------
  var PX = 100, PY = 64, CH = 76;
  var CAP = 100;                     // the server's capacity
  var DRAIN = 2.6;                   // load it clears each second
  var LOAD = { normal: 10, quick: 7, stubborn: 15, ooo: 3, boss: 8, intern: 8 };
  var MUTE_CD = 12;                  // seconds for Mute thread to recharge
  var STREAK_STEP = 8;               // stops in a row for each step of the multiplier
  var MULT_MAX = 4;
  var CLOSE = 0.85;                  // a close call: stopped with the bar this full
  var APPROVED_OUT = 3;              // replies that may get out in a day and still be Approved
  var BOSS_SPREAD = 4;
  var LAST = 3;

  // spawn: seconds between new repliers, start to end of the stage. dur: how
  // long a reply takes to type. busy: no new ones start while this many are
  // typing. bursts: [when, how many]: the thread gets forwarded.
  var STAGES = [
    { name: "Your team", desks: 9, time: 28, spawn: [1.8, 1.2], dur: [3.8, 3.1], busy: 3,
      bursts: [[12, 2], [21, 3]],
      quick: 0, stubborn: 0, ooo: 0, boss: false,
      clear: "Your team has gone quiet. They've booked a meeting to discuss the email." },
    { name: "The department", desks: 12, time: 32, spawn: [1.2, 0.85], dur: [3.4, 2.9], busy: 5,
      bursts: [[9, 3], [19, 3], [27, 4]],
      quick: 3, stubborn: 0, ooo: 0, boss: false, mute: true,
      clear: "The department has gone to lunch. They're discussing the thread in the queue." },
    { name: "The whole company", desks: 16, time: 36, spawn: [1.3, 0.92], dur: [3.3, 2.8], busy: 6,
      bursts: [[9, 3], [19, 3], [29, 4]],
      quick: 3, stubborn: 3, ooo: 2, boss: false, mute: true,
      clear: "Everyone has had their say. IT have sent an email asking people to stop. To everyone." },
    { name: "The CEO's assistant", desks: 16, time: 40, spawn: [1.2, 0.85], dur: [3.2, 2.7], busy: 7,
      bursts: [[13, 4], [28, 4]],
      quick: 3, stubborn: 3, ooo: 2, boss: true, mute: true }
  ];

  // What they type. Their manners, never them.
  var LINES = {
    normal: ["Please remove me from this list", "Who is this", "Stop replying all", "Unsubscribe", "Why am I on this",
             "Not sure this was meant for me", "Can everyone stop", "Please take me off this", "This is not the place",
             "Is this about the fridge", "Did anyone else get this", "Can IT block this", "Please advise",
             "Wrong button. Sorry", "Who is Dave", "Is this the fire drill", "Let's take this offline",
             "Adding my manager", "Stop replying all, you lemon", "Reply all is not a personality",
             "Off this list please", "Remove me as well", "Stop it, you melon"],
    quick: ["+1", "Same", "Me too", "This", "Thanks", "Following", "Noted", "Agreed", "Sent from my phone", "Seconded", "+1 +1"],
    stubborn: ["Per my last email", "As I said", "To reiterate", "Circling back", "Just to be clear", "Please see below",
               "Further to my email", "As previously stated", "See attached. All of it"],
    boss: ["Please stop replying all", "Sent on behalf of the CEO", "The CEO is aware", "Please do not reply to this email",
           "The CEO has asked everyone to stop"],
    ooo: ["I am out of the office", "Back Monday", "On annual leave", "Limited access to email", "Out until further notice"]
  };
  var GRUMBLES = ["Fine.", "I was only saying.", "It was important.", "I'll say it in the meeting.", "Rude.", "Noted.",
                  "Who did that.", "I had a point.", "Saving it for Friday.", "I'll print it out then.", "Pillock."];
  var MUTED = ["Muted. By a numpty.", "Who muted me.", "I've been muted.", "Rude.", "I'll write a letter."];
  var FLINCH = ["Still typing.", "As I was saying.", "I'm not done.", "Further to that."];
  var SNIPES = ["Reply all, you melon.", "Who replied all. Numpty.", "Oh, here we go.", "Plonker."];
  var CHEERS = ["Email's down.", "Is it lunch.", "Do we just talk now.", "Best day ever.", "We'll have to talk to each other."];
  var HOMES = ["Home time.", "Same again tomorrow.", "Forward me the thread.", "Logging off. Loudly."];
  var GLARES = ["What.", "I'm not typing.", "Can I help you."];
  var STOPS = ["Unsent", "Deleted", "Not sent", "Binned"];
  var FORWARDS = ["Thread: forwarded", "Forwarded again", "Now copying in finance", "Thread: escalated", "Forwarded to the whole floor"];
  var INTERN = ["Sorry. Wrong button.", "Is this the right email.", "Oops is not a word. Sorry."];

  // Between stages: IT's suggestions. Each one helps and each one costs.
  var OFFERS = [
    { id: "reboot", label: "Turn it off and on again", detail: "The server starts the next stage empty. So does Mute thread.",
      apply: function (m) { run.load = 0; m.muteEmpty = true; } },
    { id: "bigger", label: "Bigger server", detail: "Holds half as much again. Everyone types a bit faster to fill it.",
      apply: function (m) { m.cap *= 1.5; m.typeSpeed *= 1.12; } },
    { id: "training", label: "Email etiquette training", detail: "Everyone takes a third longer to type. Each one you stop scores a third less.",
      apply: function (m) { m.typeSpeed *= 0.75; m.points *= 0.67; } },
    { id: "button", label: "Hide the reply all button", detail: "A reply that gets out sets off one more, not two. More people start replying on their own.",
      apply: function (m) { m.spread = 1; m.spawn *= 1.25; } },
    { id: "rules", label: "Inbox rules", detail: "Mute thread recharges twice as fast. The server holds a bit less.",
      apply: function (m) { m.muteCd *= 0.5; m.cap *= 0.85; } },
    { id: "intern", label: "Hire an intern", detail: "Stops someone every few seconds. Replies all now and then.",
      apply: function (m) { m.intern = true; } }
  ];

  var RESULT_LINES = [
    "The thread died at 16:59. Nobody thanked you, which is how you know it worked.",
    "The server survived. It has asked to work from home.",
    "Email is down. Everyone is talking to each other. Nobody likes it.",
    "Everyone went home early. They're replying all from their phones."
  ];

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  var shell = null, T = null, ctx = null;
  var W = 1, H = 1, DPR = 1;
  var run = null;        // the whole day
  var G = null;          // this stage
  var L = { k: 1, cols: 3, rows: 3, ox: 0, oy: 0, top: 50 };
  var offers = [];
  var hudEls = null;
  var mutePad = null;
  var bg = null;
  var cursor = 0;
  var hand = { x: -100, y: -100, press: 0, show: 0 };
  var pointerMode = "keys";
  var mouse = { x: 0, y: 0, on: false };
  var prev = {}, held = {};
  var auto = { wait: 0.6, target: null };
  var shakeAmt = 0;
  var hum = null;
  var calloutAt = -10, calloutPri = 0;
  var layoutAge = 99;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, f) { return a + (b - a) * clamp(f, 0, 1); }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function fmt(n) { return Math.round(n).toLocaleString("en-GB"); }
  function info() { return STAGES[run.stage]; }
  function stoppable(d) { return d.kind === "normal" || d.kind === "quick" || d.kind === "stubborn"; }
  function touching() { return root.classList.contains("kit-touching"); }
  function mult() { return Math.min(MULT_MAX, 1 + Math.floor(run.streak / STREAK_STEP)); }
  function cap() { return CAP * run.mods.cap; }

  // ---------------------------------------------------------------------------
  // The day
  // ---------------------------------------------------------------------------
  function reset(sh) {
    shell = sh;
    T = sh.tokens;
    run = {
      stage: FIRST, score: 0, stopped: 0, out: 0, streak: 0, bestStreak: 0, load: 0,
      taken: [], melted: false, meltAt: "", mutes: 0,
      learned: {},
      mods: { cap: 1, typeSpeed: 1, points: 1, spread: 2, spawn: 1, muteCd: 1, intern: false, muteEmpty: false },
      // the office, the same for everyone in today's run: who sits where, and what's on their desk
      looks: shuffle(A.LOOKS.slice(), shell.random),
      decor: A.LOOKS.map(function () { return Math.floor(shell.random() * 4); })
    };
    auto = { wait: 0.6, target: null };
    prev = {}; held = {};
    shakeAmt = 0;
    quietHum();
    startStage();
  }

  function shuffle(list, rnd) {
    for (var i = list.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var t = list[i]; list[i] = list[j]; list[j] = t;
    }
    return list;
  }

  function startStage() {
    var st = info();
    G = {
      desks: [], flights: [], fx: [], stamps: [], bubbles: [], tapes: [], pops: [], pendingOoo: [],
      time: 0, spawnWait: 0.9, phase: "play", endT: 0,
      muteWait: st.mute ? (run.mods.muteEmpty ? MUTE_CD * run.mods.muteCd : MUTE_CD * run.mods.muteCd * 0.3) : Infinity,
      bossWait: 4.5, boss: null,
      internWait: 3, internOops: 14, intern: null,
      stageOut: 0, stageStopped: 0, recentOut: [], keyAcc: 0,
      briefed: false, hint: null, groaned: 0, lastLand: -10,
      bursts: st.bursts.slice(), forwards: 0
    };
    run.mods.muteEmpty = false;
    // who's at which desk this stage, and what sort of replier they are
    var n = st.desks;
    var kinds = [];
    for (var i = 0; i < n; i++) kinds.push("normal");
    var cols = n === 9 ? 3 : 4;
    var free = [];
    for (var f = 0; f < n; f++) free.push(f);
    function take(kind, count, spot) {
      for (var c = 0; c < count && free.length; c++) {
        var at = spot != null ? free.indexOf(spot) : Math.floor(shell.random() * free.length);
        if (at < 0) at = 0;
        kinds[free[at]] = kind;
        free.splice(at, 1);
      }
    }
    if (st.boss) take("boss", 1, cols - 1);          // the corner office
    take("ooo", st.ooo);
    take("stubborn", st.stubborn);
    take("quick", st.quick);
    for (var d = 0; d < n; d++) {
      G.desks.push({
        i: d, kind: kinds[d], look: kinds[d] === "boss" ? A.ASSISTANT : run.looks[d % run.looks.length],
        decor: run.decor[d % run.decor.length], row: 0, col: 0,
        state: "idle", t: 0, dur: 3, hits: 1, cool: 0, stateT: 0, anim: d * 0.37,
        line: "", mail: 0, gaze: null, flash: 0, flinch: 0, incoming: false, dark: 0
      });
    }
    G.boss = G.desks.filter(function (x) { return x.kind === "boss"; })[0] || null;
    if (run.mods.intern) G.intern = { x: -50, y: -50, target: null, t: 0, tag: true };
    layout(true);
    cursor = Math.floor(L.rows / 2) * L.cols + Math.floor((L.cols - 1) / 2);
    var c0 = G.desks[cursor];
    if (c0) { var p = handSpot(c0); hand.x = p.x; hand.y = p.y; }
    paintHud();
  }

  // ---------------------------------------------------------------------------
  // Layout: the grid between the HUD and the strip along the bottom, where
  // the server lives (and, on keyboards, the drawn Mute thread button)
  // ---------------------------------------------------------------------------
  function hudTop() {
    var st = shell ? shell.state() : "title";
    if (st === "title" || st === "intro") return clamp(H * 0.13, 44, 72);
    var base = root.getBoundingClientRect();
    var bottom = 0;
    Array.prototype.forEach.call(root.querySelectorAll(".kit-hud-tl, .kit-hud-tr, .kit-bar"), function (el) {
      var r = el.getBoundingClientRect();
      if (r.height) bottom = Math.max(bottom, r.bottom - base.top);
    });
    return bottom ? bottom + 4 : clamp(H * 0.13, 44, 72);
  }

  function layout(force) {
    if (!G || !run) return;
    var top = hudTop();
    if (!force && Math.abs(top - L.top) < 3 && L.W === W && L.H === H) return;
    L.top = top; L.W = W; L.H = H;
    var n = G.desks.length;
    var strip = Math.round(clamp(H * 0.17, 62, 104));
    var gridH = H - strip - top - 2;
    var opts = n === 9 ? [[3, 3]] : n === 12 ? [[4, 3], [3, 4]] : [[4, 4]];
    var best = null;
    opts.forEach(function (o) {
      var k = Math.min((W - 12) / (o[0] * PX), gridH / ((o[1] - 1) * PY + CH));
      if (!best || k > best.k) best = { cols: o[0], rows: o[1], k: k };
    });
    L.k = Math.min(best.k, 2.4);
    L.cols = best.cols; L.rows = best.rows;
    L.ox = (W - L.cols * PX * L.k) / 2;
    L.oy = top + (gridH - ((L.rows - 1) * PY + CH) * L.k) / 2;
    G.desks.forEach(function (d, i) { d.col = i % L.cols; d.row = Math.floor(i / L.cols); });
    // the strip
    var sh = strip - 12;
    L.strip = strip;
    L.server = { x: 10, y: H - strip + 6, w: Math.round(Math.min(W * 0.44, sh * 2.9, 250)), h: sh };
    L.mute = { x: W - 14 - Math.min(30, strip * 0.4), y: H - strip / 2 - 2, r: Math.min(30, strip * 0.4) };
    var signX = L.server.x + L.server.w + 14, signR = W - 2 * L.mute.r - 30;
    var sw = Math.min(150, signR - signX);
    L.sign = sw >= 92 ? { x: signX + Math.max(0, (signR - signX - sw) / 2), y: H - strip + 8, w: sw, h: strip - 16 } : null;
    A.init(T, L.k * DPR);
    bg = null;
  }

  function origin(d) { return { x: L.ox + d.col * PX * L.k, y: L.oy + d.row * PY * L.k }; }
  function at(d, lx, ly) { var o = origin(d); return { x: o.x + lx * L.k, y: o.y + ly * L.k }; }
  function handSpot(d) { return at(d, 57, 30); }
  function serverMouth() { return A.serverFace(L.server.x, L.server.y, L.server.w, L.server.h).mouth; }

  function deskAt(px, py) {
    var best = null, bd = 1e9;
    G.desks.forEach(function (d) {
      var c = at(d, 46, 33);
      var dx = (px - c.x) / (PX * L.k * 0.5), dy = (py - c.y) / (PY * L.k * 0.5);
      var dist = dx * dx + dy * dy;
      if (dist < bd) { bd = dist; best = d; }
    });
    return bd < 1.8 ? best : null;
  }
  function deskAtCell(col, row) {
    for (var i = 0; i < G.desks.length; i++) if (G.desks[i].col === col && G.desks[i].row === row) return G.desks[i];
    return null;
  }

  // Desks the notice card is sitting on: nobody starts typing under it
  var briefBox = null, briefAge = 99;
  function underBrief(d) {
    if (briefAge > 0.5) {
      briefAge = 0;
      briefBox = null;
      var el = root.querySelector(".kit-brief.is-on");
      if (el) {
        var r = el.getBoundingClientRect(), base = root.getBoundingClientRect();
        briefBox = { l: r.left - base.left, t: r.top - base.top, r: r.right - base.left, b: r.bottom - base.top };
      }
    }
    if (!briefBox) return false;
    var a = at(d, 10, 0), b = at(d, 90, 64);
    return a.x < briefBox.r && b.x > briefBox.l && a.y < briefBox.b && b.y > briefBox.t;
  }

  // ---------------------------------------------------------------------------
  // Typing, stopping, sending
  // ---------------------------------------------------------------------------
  function typingCount() {
    var n = 0;
    G.desks.forEach(function (d) { if (d.state === "typing" && stoppable(d)) n++; });
    return n;
  }

  function pickIdle() {
    var pool = G.desks.filter(function (d) {
      return stoppable(d) && d.state === "idle" && d.cool <= 0 && !d.incoming && !underBrief(d);
    });
    if (!pool.length) return null;
    return pool[Math.floor(shell.random() * pool.length)];
  }

  function itch(d) {
    var st = info(), f = G.time / st.time;
    var base = lerp(st.dur[0], st.dur[1], f);
    var k = d.kind === "quick" ? 0.5 : d.kind === "stubborn" ? 1.35 : 1;
    d.state = "typing";
    d.t = 0;
    d.stateT = 0;
    d.dur = base * k * (0.9 + shell.random() * 0.2);
    d.hits = d.kind === "stubborn" ? 2 : 1;
    // something nobody else is typing right now
    var taken = G.desks.map(function (o) { return o.state === "typing" ? o.line : ""; });
    var fresh = LINES[d.kind].filter(function (l) { return taken.indexOf(l) < 0; });
    d.line = pick(fresh.length ? fresh : LINES[d.kind]);
    d.gaze = null;
    sfx.itch();
  }

  function spawnTick(dt) {
    G.spawnWait -= dt;
    if (G.spawnWait > 0) return;
    var st = info(), f = G.time / st.time;
    G.spawnWait = lerp(st.spawn[0], st.spawn[1], f) / run.mods.spawn * (0.75 + shell.random() * 0.5);
    if (typingCount() >= st.busy) return;      // the office is busy enough
    var d = pickIdle();
    if (d) itch(d);
  }

  // Someone forwards the thread: several desks at once
  function burst(n) {
    var sent = 0;
    for (var s = 0; s < n; s++) {
      var d = pickIdle();
      if (!d) break;
      d.incoming = true;
      launch({ from: "server", to: d, dur: 0.45 + s * 0.12, kind: "down" });
      sent++;
    }
    if (!sent) return;
    G.desks.forEach(function (d) { if (d.kind !== "ooo") d.mail = 1; });
    G.gulp = 0.35;
    sfx.mail();
    sfx.send();
    say(FORWARDS[Math.min(G.forwards + run.stage, FORWARDS.length - 1)], 1);
    G.forwards++;
  }

  // The player (or the autopilot) goes for a desk
  function hit(d, how) {
    if (!d || G.phase !== "play") return;
    hand.press = 1;
    if (d.kind === "ooo") {
      d.flash = 0.5;
      sfx.nope();
      say("Out of office", 0);
      return;
    }
    if (d.kind === "boss") {
      d.flash = 0.5;
      sfx.nope();
      say("On behalf of the CEO", 0);
      return;
    }
    if (d.state !== "typing") {
      // nothing to stop: a glare, and no harm done
      sfx.tap();
      if (d.state === "idle") { d.gaze = { x: 0, y: 0.1, t: 0.9 }; if (Math.random() < 0.15) say1(d, pick(GLARES)); }
      return;
    }
    if (d.hits > 1) {
      // a long email: knocked back, not stopped
      d.hits--;
      d.t = Math.max(0, d.t - 0.4);
      d.flinch = 0.55;
      sfx.flinch();
      addStamp(d, "Still typing", 0.8);
      say1(d, pick(FLINCH), true);
      return;
    }
    stop(d, how);
  }

  function stop(d, how) {
    var close = d.t >= CLOSE;
    var m0 = mult();
    d.state = "stopped";
    d.stateT = 0;
    d.gaze = { x: 0, y: 0.15, t: 2 };
    run.stopped++;
    G.stageStopped++;
    var pts;
    if (how === "intern") {
      pts = 50 * run.mods.points;
    } else {
      run.streak++;
      run.bestStreak = Math.max(run.bestStreak, run.streak);
      pts = (100 + (d.kind === "stubborn" ? 50 : 0) + (close ? 50 : 0)) * m0 * run.mods.points;
    }
    pts = Math.round(pts / 10) * 10;
    run.score += pts;
    var c = at(d, 40, 8);
    G.pops.push({ x: c.x, y: c.y, text: "+" + pts, t: 0 });
    addStamp(d, close && how !== "mute" ? "Just in time" : pick(STOPS), 0.75);
    dropBubble(d);
    if (how === "mute") { if (Math.random() < 0.25) say1(d, pick(MUTED)); }
    else if (how === "intern") { if (Math.random() < 0.3) say1(d, "Who are you."); }
    else if (Math.random() < 0.3) say1(d, pick(GRUMBLES));
    sfx.stop(close);
    if (how !== "intern" && mult() > m0) {
      say("Streak: x" + mult(), 1);
      sfx.streak();
    }
    if (how !== "intern" && how !== "mute") run.learned.stops = (run.learned.stops || 0) + 1;
    if (d.kind === "stubborn") run.learned.stubborn = true;
  }

  function send(d) {
    d.state = "sent";
    d.stateT = 0;
    d.t = 0;
    d.gaze = { x: 0, y: 0.1, t: 1 };
    dropBubble(d);
    launch({ from: d, to: "server", load: LOAD[d.kind], spread: d.kind === "boss" ? BOSS_SPREAD : run.mods.spread,
             kind: d.kind, dur: 0.6 });
    sfx.send();
    if (d.kind === "boss") {
      sfx.boss();
      run.learned.boss = true;
      return;
    }
    run.streak = 0;
    run.out++;
    G.stageOut++;
    G.recentOut.push(G.time);
    G.recentOut = G.recentOut.filter(function (t) { return G.time - t < 5; });
    if (G.recentOut.length >= 3) say("Thread: out of control", 2);
    else if (G.stageOut === 1) say("Reply all: sent", 1);
    // a neighbour has something to say about it
    if (Math.random() < 0.3) {
      var near = G.desks.filter(function (o) {
        return o !== d && o.state === "idle" && stoppable(o) && Math.abs(o.col - d.col) + Math.abs(o.row - d.row) === 1;
      });
      if (near.length) say1(pick(near), pick(SNIPES));
    }
  }

  // Envelopes in the air: desk to server, server to desk
  function launch(o) {
    G.flights.push({ from: o.from, to: o.to, t: 0, dur: o.dur || 0.55, load: o.load || 0, spread: o.spread || 0,
                     kind: o.kind || "", rot: (Math.random() - 0.5) * 0.6, intern: o.intern || null });
  }
  function endpoint(p, f) {
    if (p === "server") return serverMouth();
    if (p === "intern") return { x: f.intern.x, y: f.intern.y };
    if (p.x != null) return p;
    return at(p, p.kind === "ooo" ? 80 : 74, 20);
  }

  function land(f) {
    if (G.phase !== "play") return;
    run.load += f.load;
    G.lastLand = G.time;
    G.gulp = 0.35;
    sfx.land();
    var share = run.load / cap();
    if (share >= 1) { melt(); return; }
    if (share >= 0.7 && G.groaned < 2) { G.groaned = 2; say("Server: groaning", 2); sfx.groan(); }
    else if (share >= 0.5 && G.groaned < 1) { G.groaned = 1; sfx.groan(); }
    if (!f.spread) return;
    // it lands in everyone's inbox
    var sender = f.from && f.from.i != null ? f.from : null;
    G.desks.forEach(function (d) {
      if (d !== sender && d.kind !== "ooo") d.mail = 1;
      if (d !== sender && d.state === "idle" && sender) {
        var a = at(d, 40, 30), b = at(sender, 40, 30), len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
        d.gaze = { x: (b.x - a.x) / len, y: (b.y - a.y) / len, t: 1.2 };
      }
    });
    sfx.mail();
    // and sets off more
    for (var s = 0; s < f.spread; s++) {
      var d = pickIdle();
      if (!d) break;
      d.incoming = true;
      launch({ from: "server", to: d, dur: 0.42 + s * 0.08, kind: "down" });
    }
    // the out of office answers everything
    if (f.kind !== "ooo") {
      G.desks.forEach(function (o, n) {
        if (o.kind === "ooo") G.pendingOoo.push({ desk: o, wait: 0.5 + n * 0.05 + G.pendingOoo.length * 0.3 });
      });
    }
  }

  function arrive(f) {
    var d = f.to;
    d.incoming = false;
    if (G.phase === "play" && d.state === "idle") itch(d);
  }

  function tryMute() {
    if (!info().mute || G.phase !== "play") return;
    if (G.muteWait > 0) { sfx.nope(); return; }
    var row = muteRow();
    if (row < 0) { sfx.nope(); return; }
    G.desks.forEach(function (d) {
      if (d.row === row && stoppable(d) && d.state === "typing") stop(d, "mute");
    });
    G.tapes.push({ row: row, t: 0 });
    G.muteWait = MUTE_CD * run.mods.muteCd;
    run.mutes++;
    run.learned.mute = true;
    say("Thread: muted", 1);
    sfx.mute();
  }

  // The row Mute thread would hit: the one with the most typing, the nearest to sending
  function muteRow() {
    var best = -1, top = 0;
    for (var r = 0; r < L.rows; r++) {
      var s = 0;
      G.desks.forEach(function (d) { if (d.row === r && stoppable(d) && d.state === "typing") s += 1 + d.t; });
      if (s > top) { top = s; best = r; }
    }
    return best;
  }

  function bossTick(dt) {
    var b = G.boss;
    if (!b || G.phase !== "play") return;
    if (b.state === "idle") {
      G.bossWait -= dt;
      if (G.bossWait <= 0) {
        b.state = "typing";
        b.t = 0;
        b.stateT = 0;
        b.dur = 2.6;
        b.line = pick(LINES.boss);
        say1(b, b.line, true);
        G.bossWait = lerp(8, 5.5, G.time / info().time);
      }
    }
  }

  // The intern: stops someone every few seconds, and replies all now and then
  function internTick(dt) {
    var it = G.intern;
    if (!it || G.phase !== "play") return;
    var home = { x: W * 0.5, y: H - L.strip * 0.5 };
    var aim = it.target ? at(it.target, 24, 30) : home;    // the left of their head; yours goes on the right
    it.x += (aim.x - it.x) * Math.min(1, dt * 7);
    it.y += (aim.y - it.y) * Math.min(1, dt * 7);
    if (it.target) {
      it.t += dt;
      if (it.t > 0.4) {
        if (it.target.state === "typing" && stoppable(it.target)) {
          if (it.target.hits > 1) it.target.hits = 1;
          stop(it.target, "intern");
        }
        it.target = null;
      }
      return;
    }
    G.internWait -= dt;
    G.internOops -= dt;
    if (G.internOops <= 0) {
      G.internOops = 18 + Math.random() * 6;
      launch({ from: "intern", to: "server", load: LOAD.intern, spread: 1, kind: "intern", intern: { x: it.x, y: it.y } });
      sfx.send();
      say("Intern: replied all", 1);
      it.oops = 1.6;
      return;
    }
    if (G.internWait <= 0) {
      G.internWait = 4.2;
      var typing = G.desks.filter(function (d) { return stoppable(d) && d.state === "typing"; });
      typing.sort(function (a, b) { return b.t - a.t; });
      if (typing[0]) { it.target = typing[0]; it.t = 0; }
    }
  }

  // ---------------------------------------------------------------------------
  // The end of a stage, the end of the day, and the end of the server
  // ---------------------------------------------------------------------------
  function calmDown() {
    G.desks.forEach(function (d) {
      if (d.state === "typing") { d.state = "idle"; d.t = 0; }
      d.incoming = false;
    });
    G.bubbles = [];
    G.flights = [];
    G.pendingOoo = [];
  }

  function endStage() {
    if (G.phase !== "play") return;
    G.phase = "clear";
    G.endT = 0;
    calmDown();
    sfx.bell();
    var share = run.load / cap();
    var saved = Math.round((1 - share) * 500 * (run.stage + 1) / 10) * 10;
    var clean = G.stageOut === 0 ? 1000 : 0;
    run.score += saved + clean;
    paintHud();
    if (run.stage === LAST) { goHome(); return; }
    offers = offer();
    var next = run.stage + 1;
    var stamp = G.stageOut === 0 ? "Approved" : G.stageOut <= 3 ? "Pending review" : "Not approved";
    var stats = [
      { label: "Stopped", value: String(G.stageStopped) },
      { label: "Got out", value: String(G.stageOut) },
      { label: "Server", value: Math.round(share * 100) + "% full" },
      { label: clean ? "Clean stage" : "Server bonus", value: "+" + fmt(saved + clean) },
      { label: "Score", value: fmt(run.score) }
    ];
    shell.interlude({
      stamp: stamp,
      tilt: stamp === "Approved" ? -5 : 4,
      heading: "Stage " + (run.stage + 1) + " complete.",
      line: info().clear,
      stats: stats,
      ask: "Stage " + (next + 1) + ": " + STAGES[next].name.toLowerCase() + ". IT have three suggestions.",
      choices: offers.map(function (o) { return { label: o.label, detail: o.detail }; })
    }).then(function (i) {
      var o = offers[i] || offers[0];
      if (o) { run.taken.push(o.id); o.apply(run.mods); }
      run.stage = next;
      startStage();
      shell.next();
    });
  }

  // Three of IT's suggestions you haven't taken, from the run's seed
  function offer() {
    var pool = OFFERS.filter(function (o) { return run.taken.indexOf(o.id) < 0; });
    var out = [];
    while (out.length < 3 && pool.length) out.push(pool.splice(Math.floor(shell.random() * pool.length), 1)[0]);
    return out;
  }

  function goHome() {
    G.phase = "home";
    G.endT = 0;
    run.score += 2500;
    say("Home time", 3);
    var folk = G.desks.filter(function (d) { return d.kind !== "ooo"; });
    say1(pick(folk), pick(HOMES), true);
    end("home");
  }

  function melt() {
    if (G.phase !== "play") return;
    G.phase = "melt";
    G.endT = 0;
    run.melted = true;
    run.meltAt = clockText();
    run.load = cap();
    calmDown();
    shake(1);
    say("Server: melted", 3);
    sfx.melt();
    // the office has never been happier
    var folk = shuffle(G.desks.filter(function (d) { return d.kind !== "ooo"; }), Math.random);
    folk.slice(0, 2).forEach(function (d, n) { G.bubbles.push(bub(d, CHEERS[(n + Math.floor(Math.random() * CHEERS.length)) % CHEERS.length], 3)); });
    for (var p = 0; p < 6; p++) addPuff(true);
    end("melt");
  }

  function end(why) {
    var home = why === "home";
    var rank = home ? (run.out <= APPROVED_OUT ? 1 : 2) : (run.stage >= 2 ? 3 : 4);
    var stamp = ["Approved", "Pending review", "Not approved", "Rejected"][rank - 1];
    var score = Math.round(run.score);
    var rec = shell.record(score);
    // short, so it all fits a phone's square screen
    var stats = [
      { label: "Score", value: fmt(score) },
      home ? { label: "Stopped", value: String(run.stopped) } : { label: "Melted at", value: run.meltAt },
      { label: "Got out", value: String(run.out) },
      { label: rec.isNew ? (shell.daily ? "New best today" : "New best") : (shell.daily ? "Best today" : "Best"),
        value: fmt(rec.best || 0), highlight: rec.isNew }
    ];
    if (shell.daily) stats.unshift({ label: "Run", value: shell.today });
    shell.finish({
      place: rank,
      total: 4,
      stamp: stamp,
      heading: home ? "Home at 17:00." : "Server melted.",
      line: RESULT_LINES[rank - 1],
      stats: stats,
      share: fmt(score) + " points, " + (home ? "home by 17:00" : "server melted at " + run.meltAt),
      delay: home ? 2200 : 2600
    });
  }

  // ---------------------------------------------------------------------------
  // Every frame
  // ---------------------------------------------------------------------------
  function update(dt, input) {
    var st = shell.state();
    if (!G || (st !== "playing" && st !== "ending" && st !== "results")) return;
    briefAge += dt;
    if (G.phase === "play" && st === "playing") {
      G.time += dt;
      controls(input, dt);
      if (AUTOPILOT) autopilot(dt);
      spawnTick(dt);
      if (G.bursts.length && G.time >= G.bursts[0][0]) burst(G.bursts.shift()[1]);
      bossTick(dt);
      internTick(dt);
      G.muteWait -= dt;
      run.load = Math.max(0, run.load - DRAIN * dt);
      if (G.time >= info().time) endStage();
    } else {
      G.endT += dt;
    }
    tickDesks(dt);
    tickFlights(dt);
    tickFx(dt);
    pickHint();
    if (st !== "results") paintHud();
  }

  function tickDesks(dt) {
    var typing = 0;
    G.desks.forEach(function (d) {
      d.anim += dt;
      d.stateT += dt;
      if (d.mail > 0) d.mail -= dt;
      if (d.flash > 0) d.flash -= dt;
      if (d.flinch > 0) d.flinch -= dt;
      if (d.gaze && (d.gaze.t -= dt) <= 0) d.gaze = null;
      if (d.cool > 0) d.cool -= dt;
      if (d.state === "typing") {
        if (G.phase === "play") {
          d.t += dt / d.dur * (d.kind === "boss" ? 1 : run.mods.typeSpeed);
          if (d.t >= 1) send(d);
        }
        typing++;
      } else if (d.state === "stopped" && d.stateT > 2.2) {
        d.state = "idle"; d.cool = 0.6;
      } else if (d.state === "sent" && d.stateT > 0.9) {
        d.state = "idle"; d.cool = 1.2;
      }
      if (G.phase === "home") d.dark = clamp((G.endT - 0.6 - (d.row * L.cols + d.col) * 0.07) * 3, 0, 1);
    });
    // the out of office answers
    for (var i = G.pendingOoo.length - 1; i >= 0; i--) {
      var p = G.pendingOoo[i];
      p.wait -= dt;
      if (p.wait <= 0 && G.phase === "play") {
        G.pendingOoo.splice(i, 1);
        launch({ from: p.desk, to: "server", load: LOAD.ooo, kind: "ooo", dur: 0.6 });
        say1(p.desk, pick(LINES.ooo));
        sfx.ooo();
        run.learned.oooSeen = (run.learned.oooSeen || 0) + 1;
      }
    }
    // keyboards clattering
    if (G.phase === "play") {
      G.keyAcc += dt * Math.min(typing, 4) * 7;
      if (G.keyAcc >= 1) { G.keyAcc = 0; sfx.key(); }
    }
  }

  function tickFlights(dt) {
    for (var i = G.flights.length - 1; i >= 0; i--) {
      var f = G.flights[i];
      f.t += dt / f.dur;
      if (f.t >= 1) {
        G.flights.splice(i, 1);
        if (f.to === "server") land(f);
        else if (f.to && f.to.i != null) arrive(f);
        if (!G || G.phase !== "play") break;
      }
    }
  }

  function tickFx(dt) {
    G.stamps = G.stamps.filter(function (s) { s.t += dt; return s.t < s.life; });
    G.pops = G.pops.filter(function (p) { p.t += dt; return p.t < 0.9; });
    G.tapes = G.tapes.filter(function (p) { p.t += dt; return p.t < 1.2; });
    G.fx = G.fx.filter(function (p) { p.t += dt; return p.t < p.life; });
    G.bubbles = G.bubbles.filter(function (b) {
      b.t += dt;
      if (b.typing && b.desk.state !== "typing") return false;
      return b.t < b.life;
    });
    // the most urgent typists get their words shown, a few at a time
    var max = W < 420 ? 2 : 3;
    if (G.phase === "play" && G.bubbles.length < max) {
      var best = null;
      G.desks.forEach(function (d) {
        if (d.state !== "typing" || d.t > 0.8 || G.bubbles.some(function (b) { return b.desk === d; })) return;
        if (!best || d.t > best.t) best = d;
      });
      if (best) { var b = bub(best, best.line, 99); b.typing = true; b.boss = best.kind === "boss"; G.bubbles.push(b); }
    }
    // smoke when the server's working hard
    var share = run.load / cap();
    if (G.phase === "melt") { if (Math.random() < dt * 8) addPuff(true); }
    else if (share > 0.55 && Math.random() < dt * (share - 0.5) * 9) addPuff(false);
    if (shakeAmt > 0) shakeAmt = Math.max(0, shakeAmt - dt * 2.5);
    if (hand.press > 0) hand.press = Math.max(0, hand.press - dt * 7);
    if (G.gulp > 0) G.gulp -= dt;
    if (hand.show > 0) hand.show -= dt;
    if (G.intern && G.intern.oops > 0) G.intern.oops -= dt;
  }

  function addStamp(d, text, life) {
    var c = at(d, 40, 47);
    G.stamps.push({ x: c.x, y: c.y, text: text, t: 0, life: life || 0.75, tilt: (Math.random() - 0.5) * 0.24 });
  }
  function addPuff(big) {
    var s = L.server;
    var blobs = [];
    var n = 3 + Math.floor(Math.random() * 3);
    for (var i = 0; i < n; i++) blobs.push([(Math.random() - 0.5) * 1.6, (Math.random() - 0.5) * 0.8, 0.5 + Math.random() * 0.5]);
    G.fx.push({ kind: "puff", x: s.x + s.w * (0.2 + Math.random() * 0.6), y: s.y + s.h * 0.2,
                r: (big ? 16 : 9) * Math.max(0.8, s.h / 60), blobs: blobs, t: 0, life: big ? 1.6 : 1.1 });
  }

  function bub(d, text, life) { return { desk: d, text: text, t: 0, life: life || (1.4 + text.length * 0.03) }; }
  // say1: one speech bubble, one per speaker, a few at once
  function say1(d, text, force) {
    if (!d || !text) return;
    for (var i = 0; i < G.bubbles.length; i++) {
      if (G.bubbles[i].desk === d) { if (!force && !G.bubbles[i].typing) return; G.bubbles.splice(i, 1); break; }
    }
    var max = W < 420 ? 2 : 3;
    if (G.bubbles.length >= max) {
      if (!force) return;
      var drop = G.bubbles.findIndex ? G.bubbles.findIndex(function (b) { return !b.boss; }) : 0;
      G.bubbles.splice(Math.max(0, drop), 1);
    }
    var b = bub(d, text);
    b.boss = d.kind === "boss";
    G.bubbles.push(b);
  }
  function dropBubble(d) { G.bubbles = G.bubbles.filter(function (b) { return b.desk !== d; }); }

  // Callouts: one at a time, the important ones win
  function say(text, priority) {
    if (!shell || (shell.state() !== "playing" && priority < 3)) return;
    var now = performance.now() / 1000;
    if (now - calloutAt < 1.6 && priority <= calloutPri) return;
    calloutAt = now;
    calloutPri = priority;
    shell.callout(text, { sound: priority >= 2 });
  }

  function shake(amount) {
    if (shell.reduceMotion) return;
    shakeAmt = Math.max(shakeAmt, amount);
  }

  function clockText() {
    if (!G || !run) return "09:00";
    var mins = Math.floor(clamp(G.time / info().time, 0, 1) * 120);
    var h = 9 + run.stage * 2 + Math.floor(mins / 60), m = mins % 60;
    return (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m;
  }

  // ---------------------------------------------------------------------------
  // Controls: arrows or WASD move the cursor a desk at a time, Space stops
  // that desk, E or Shift mutes a thread. Clicks and taps go straight to the
  // desk under them (see the pointer listeners at the bottom).
  // ---------------------------------------------------------------------------
  function controls(input, dt) {
    var sy = input.stick ? input.stick.y : 0;
    var dirs = [["left", -1, 0, input.left], ["right", 1, 0, input.right],
                ["up", 0, -1, input.up || sy < -0.55], ["down", 0, 1, input.down || sy > 0.55]];
    dirs.forEach(function (dd) {
      var k = dd[0], down = dd[3];
      if (down && !prev[k]) { move(dd[1], dd[2]); held[k] = 0; }
      else if (down) {
        held[k] += dt;
        if (held[k] > 0.3) { held[k] -= 0.12; move(dd[1], dd[2]); }
      }
      prev[k] = down;
    });
    if (input.action && !prev.action) {
      if (!AUTOPILOT) pointerMode = "keys";
      hit(G.desks[cursor], "key");
    }
    prev.action = input.action;
    if (input.mute && !prev.mute) tryMute();
    prev.mute = input.mute;
  }

  function move(dx, dy) {
    if (AUTOPILOT) return;
    pointerMode = "keys";
    var d = G.desks[cursor];
    if (!d) return;
    var to = deskAtCell(clamp(d.col + dx, 0, L.cols - 1), clamp(d.row + dy, 0, L.rows - 1));
    if (to && to !== d) { cursor = to.i; sfx.move(); }
  }

  // For ?autopilot and ?clip: go for whoever is closest to sending, with a
  // human-ish pause, and mute a row when it gets busy
  function autopilot(dt) {
    auto.wait -= dt;
    var typing = G.desks.filter(function (d) { return stoppable(d) && d.state === "typing" && !(G.intern && G.intern.target === d); });
    if (info().mute && G.muteWait <= 0) {
      var r = muteRow();
      var inRow = typing.filter(function (d) { return d.row === r; }).length;
      if (inRow >= 3 || (inRow >= 2 && typing.length >= 4)) { tryMute(); return; }
    }
    if (!typing.length) { auto.target = null; return; }
    function left(d) { return (1 - d.t) * d.dur / run.mods.typeSpeed; }
    typing.sort(function (a, b) { return left(a) - left(b); });
    var t = typing[0];
    if (auto.target !== t) {
      // see it, then get the cursor over there: further away takes longer
      var from = auto.last || t;
      var cells = Math.abs(from.col - t.col) + Math.abs(from.row - t.row);
      auto.target = t;
      cursor = t.i;
      auto.wait = Math.max(auto.wait, (0.26 + Math.random() * 0.22 + cells * 0.06) / SKILL);
    }
    if (auto.wait <= 0) {
      hit(t, "auto");
      auto.last = t;
      auto.wait = 0.08 + Math.random() * 0.1;
      if (t.state !== "typing") auto.target = null;
    }
  }

  // The one thing worth pointing at right now (DESIGN.md, section 10)
  function pickHint() {
    G.hint = null;
    if (G.phase !== "play" || shell.state() !== "playing") return;
    var typing = G.desks.filter(function (d) { return d.state === "typing"; });
    if ((run.learned.stops || 0) < 2) {
      var first = typing.filter(stoppable).sort(function (a, b) { return b.t - a.t; })[0];
      if (first) {
        var word = touching() ? "Tap" : pointerMode === "keys" && !AUTOPILOT && run.learned.keys ? "Space" : "Click";
        G.hint = { desk: first, word: word };
        return;
      }
    }
    if (info().stubborn && !run.learned.stubborn) {
      var long = typing.filter(function (d) { return d.kind === "stubborn" && d.hits > 1; })[0];
      if (long) { G.hint = { desk: long, word: "Twice" }; return; }
    }
    if (info().mute && !run.learned.mute && G.muteWait <= 0) {
      var r = muteRow();
      var inRow = typing.filter(function (d) { return d.row === r && stoppable(d); }).length;
      if (inRow >= 2) {
        if (touching()) G.hint = { pad: true, word: "Mute" };
        else G.hint = { mute: true, word: "Press E" };
        return;
      }
    }
  }

  // The stage's notice: what's new, and what to do about it
  function notice() {
    var st = info(), touch = touching();
    var text;
    if (run.stage === 0) {
      text = "Someone has replied all. Anyone with a bar over their head is writing back: " +
        (touch ? "tap them" : "click them, or use the arrow keys and Space,") + " before it fills. Every reply that gets out sets off two more.";
    } else if (run.stage === 1) {
      text = "The +1 crowd reply from their phones, twice as fast. New: Mute thread " +
        (touch ? "(the Mute button)" : "(E or Shift)") + " stops the row in red brackets, then recharges.";
    } else if (run.stage === 2) {
      text = "A red flag means a long email: stop it twice. Out of office desks can't be stopped, and auto-reply to every reply that gets out.";
    } else {
      text = "The CEO's assistant can't be stopped. Every so often they ask everyone to stop replying all. To everyone. Hold on until 17:00.";
    }
    shell.brief({ title: "Stage " + (run.stage + 1) + ": " + st.name, text: text, ms: run.stage === 0 ? 7500 : 6500 });
    briefAge = 99;
  }

  // ---------------------------------------------------------------------------
  // HUD: stage and office clock top left, score top right
  // ---------------------------------------------------------------------------
  function buildHud() {
    shell.hud.innerHTML =
      '<div class="kit-hud-tl">' +
        '<p class="kit-stat"><small>Stage</small><span data-stage>1/4</span></p>' +
        '<p class="kit-mono" data-clock>09:00 / 11:00</p>' +
      '</div>' +
      '<div class="kit-hud-tr">' +
        '<p class="kit-stat kit-stat-big"><span data-score>0</span><small data-mult></small></p>' +
      '</div>';
    hudEls = {};
    ["stage", "clock", "score", "mult"].forEach(function (k) { hudEls[k] = shell.hud.querySelector("[data-" + k + "]"); });
  }
  function setText(node, text) { if (node && node.textContent !== text) node.textContent = text; }
  function paintHud() {
    if (!hudEls || !run) return;
    setText(hudEls.stage, (run.stage + 1) + "/4");
    var endH = 11 + run.stage * 2;
    setText(hudEls.clock, clockText() + " / " + endH + ":00");
    setText(hudEls.score, fmt(run.score));
    setText(hudEls.mult, mult() > 1 ? "x" + mult() : "");
    if (shell.padFill && info().mute) shell.padFill("mute", 1 - G.muteWait / (MUTE_CD * run.mods.muteCd));
    // no Mute thread until stage 2
    var pad = mutePad || (mutePad = root.querySelector('.kit-pad[data-key="mute"]'));
    if (pad) { var vis = info().mute ? "" : "hidden"; if (pad.style.visibility !== vis) pad.style.visibility = vis; }
  }

  // ---------------------------------------------------------------------------
  // Drawing
  // ---------------------------------------------------------------------------
  function resize(w, h, dpr) {
    W = w; H = h; DPR = dpr;
    ctx = (shell ? shell.canvas : root.querySelector("canvas")).getContext("2d");
    if (T) { A.flush(); layout(true); }
    bg = null;
  }

  // The floor and the back wall, cached
  function buildBg() {
    var cv = document.createElement("canvas");
    cv.width = Math.round(W * DPR);
    cv.height = Math.round(H * DPR);
    var c = cv.getContext("2d");
    c.scale(DPR, DPR);
    c.fillStyle = T.ink;
    c.fillRect(0, 0, W, H);
    // carpet tiles: a faint halftone, every other tile
    var tile = Math.max(26, L.k * 40);
    c.save();
    c.fillStyle = T.paper;
    for (var ty = L.top; ty < H; ty += tile) {
      for (var tx = 0; tx < W; tx += tile) {
        if (((tx / tile) + (ty / tile)) % 2 < 1) continue;
        for (var dy = 3; dy < tile; dy += 7) {
          for (var dx = 3 + (dy % 14 ? 3.5 : 0); dx < tile; dx += 7) {
            c.globalAlpha = 0.14;
            c.fillRect(tx + dx, ty + dy, 1, 1);
          }
        }
      }
    }
    c.restore();
    // the back wall
    var wallH = Math.max(0, L.oy - 6);
    if (wallH > 10) {
      c.fillStyle = T.paper;
      c.globalAlpha = 0.3;
      c.fillRect(0, wallH, W, 1.5);
      c.globalAlpha = 1;
    }
    // the strip's edge
    c.fillStyle = T.paper;
    c.globalAlpha = 0.25;
    c.fillRect(0, H - L.strip, W, 1);
    c.globalAlpha = 1;
    return cv;
  }

  function render(dt) {
    if (!ctx || !G || !run) return;
    var st = shell.state();
    if (!hudEls) { buildHud(); paintHud(); }
    if ((st === "countdown" || st === "playing") && ++layoutAge > 20) { layoutAge = 0; layout(false); }
    if (st !== "playing" && root.style.cursor) root.style.cursor = "";
    if (!G.briefed && (st === "countdown" || st === "playing")) { G.briefed = true; notice(); }
    if (!bg) bg = buildBg();
    var c = ctx;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.drawImage(bg, 0, 0);
    var sx = 0, sy = 0;
    if (shakeAmt > 0) { sx = (Math.random() - 0.5) * 8 * shakeAmt; sy = (Math.random() - 0.5) * 8 * shakeAmt; }
    c.setTransform(DPR, 0, 0, DPR, sx * DPR, sy * DPR);

    var muteTarget = G.phase === "play" && info().mute && G.muteWait <= 0 ? muteRow() : -1;
    // the office, a row at a time, back to front
    for (var r = 0; r < L.rows; r++) {
      G.desks.forEach(function (d) { if (d.row === r) drawDesk(c, d, sx, sy); });
    }
    drawStrip(c);
    // red brackets: the row Mute thread would stop
    if (muteTarget >= 0 && st === "playing") {
      var first = deskAtCell(0, muteTarget), lastD = deskAtCell(L.cols - 1, muteTarget);
      if (first && lastD) {
        var a = at(first, 8, -2), b = at(lastD, 98, 62);
        A.brackets(c, a.x, a.y, b.x - a.x, b.y - a.y, T.red, Math.min(22, L.k * 18), 3);
      }
    }
    drawTapes(c);
    drawFlights(c);
    drawFx(c);
    drawStamps(c);
    // the cursor
    if (G.phase === "play" && (st === "playing" || st === "countdown")) drawCursor(c);
    if (G.intern) drawIntern(c);
    var arrowBox = drawHint(c, true);
    drawBubbles(c, arrowBox);
    drawHint(c, false);
    drawPops(c);
    if (st === "playing" || st === "countdown" || st === "ending") drawHand(c);
    tickHum();
  }

  function drawDesk(c, d, sx, sy) {
    var o = origin(d), k = L.k;
    c.setTransform(DPR * k, 0, 0, DPR * k, (o.x + sx) * DPR, (o.y + sy) * DPR);
    var look = d.look;
    var shakeX = 0;
    if (d.flash > 0 && !shell.reduceMotion) shakeX = Math.sin(d.flash * 60) * 1.2;
    if (d.kind === "boss") drawGlass(c, d);
    if (d.kind === "ooo") {
      A.blit(c, A.chair());
    } else {
      var bob = 0;
      if (d.state === "typing" && !shell.reduceMotion) bob = Math.sin(d.anim * 9) * 0.35;
      if (G.phase === "melt" && !shell.reduceMotion) bob = -Math.abs(Math.sin(d.anim * 8 + d.i)) * 2.2;
      c.translate(shakeX, bob);
      A.blit(c, A.body(look));
      A.face(c, look, faceFor(d));
      c.translate(-shakeX, -bob);
    }
    A.blit(c, A.desk(d.kind === "boss" ? 0 : d.decor));
    if (d.kind !== "ooo") A.arms(c, look, handsFor(d), d.kind === "quick" && d.state === "typing");
    if (d.kind === "quick" && d.state !== "typing") {
      // their phone, face down on the desk
      A.rr(c, 56, 56.6, 8, 2.6, 0.8);
      A.fill(c, T.ink, 1, T.paper);
    }
    if (d.kind === "stubborn" && !(d.state === "typing" && d.hits < 2)) drawFlag(c, 92, 23, 1);
    // you've got mail
    if (d.mail > 0) {
      var up = shell.reduceMotion ? 0 : Math.sin((1 - d.mail) * Math.PI) * 3;
      c.globalAlpha = clamp(d.mail * 3, 0, 1);
      c.setTransform(DPR, 0, 0, DPR, 0, 0);
      var m = at(d, 80, 16 - up);
      A.envelope(c, m.x + sx, m.y + sy, Math.max(9, 11 * k), 0);
      c.globalAlpha = 1;
      c.setTransform(DPR * k, 0, 0, DPR * k, (o.x + sx) * DPR, (o.y + sy) * DPR);
    }
    if (d.state === "typing") drawBar(c, d);
    if (d.kind === "ooo") drawOooSign(c, d, sx, sy);
    if (d.dark > 0) {
      c.setTransform(DPR, 0, 0, DPR, 0, 0);
      c.globalAlpha = d.dark * 0.6;
      c.fillStyle = T.ink;
      var a = at(d, -2, -16);
      c.fillRect(a.x, a.y, PX * k + 1, (CH + 16) * k);
      c.globalAlpha = 1;
    }
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function faceFor(d) {
    var f = { mood: "idle", gx: 0.75, gy: 0.35, talk: 0 };
    if (d.kind === "boss") {
      f.mood = "sad";
      f.gx = 0; f.gy = 0.6;
      if (d.state === "typing") { f.gx = 0.7; f.gy = 0.4; }
      return f;
    }
    if (G.phase === "melt") { f.mood = "cheer"; return f; }
    if (G.phase === "home") { f.mood = "smug"; f.gx = 0; f.gy = 0.1; return f; }
    if (d.state === "typing") {
      f.mood = d.flinch > 0 ? "flinch" : d.t > 0.82 ? "shout" : "type";
      f.talk = Math.abs(Math.sin(d.anim * 11));
      f.gx = 0.8; f.gy = 0.45;
      if (d.flinch > 0) { f.gx = 0; f.gy = 0; }
    } else if (d.state === "stopped") {
      f.mood = "sulk";
    } else if (d.state === "sent") {
      f.mood = "smug";
    }
    if (d.gaze) { f.gx = d.gaze.x; f.gy = d.gaze.y; }
    return f;
  }

  function handsFor(d) {
    if (d.kind === "boss") {
      if (d.state === "typing") return [[33 + Math.sin(d.anim * 10) * 1.2, 56.4], [48 - Math.sin(d.anim * 10) * 1.2, 56.4]];
      return [[34, 56.5], [47, 56.5]];
    }
    if (G.phase === "melt" && !shell.reduceMotion) {
      var w = Math.sin(d.anim * 9 + d.i) * 2;
      return [[19 + w, 27], [61 - w, 27]];
    }
    if (G.phase === "melt") return [[19, 27], [61, 27]];
    if (d.state === "stopped") return [[44, 50], [36, 50.5]];      // arms folded
    if (d.kind === "quick" && d.state === "typing") {
      var th = Math.sin(d.anim * 16) * 0.8;
      return [[35, 51 + th], [45, 51 - th]];
    }
    if (d.state === "typing") {
      if (d.t > 0.82) {
        // the finger hovering over Send
        var lift = clamp((d.t - 0.82) / 0.18, 0, 1);
        return [[32, 56.4], [52, 56.4 - lift * 12]];
      }
      var s = Math.sin(d.anim * 14);
      return [[32, 56.4 - Math.max(0, s) * 2.2], [48, 56.4 - Math.max(0, -s) * 2.2]];
    }
    if (d.state === "sent") {
      var down = clamp(d.stateT * 6, 0, 1);
      return [[32, 56.4], [52, 44 + down * 12.4]];
    }
    return [[32, 56.5], [48, 56.5]];
  }

  // The wind-up bar over their head
  function drawBar(c, d) {
    var x = 18, y = -1, w = 44, h = 7.4;
    var hot = d.t > 0.75;
    A.rr(c, x - 1.4, y - 1.4, w + 2.8, h + 2.8, 3.6);
    A.fill(c, T.ink);
    A.rr(c, x, y, w, h, 2.6);
    A.fill(c, T.ink, 1.6, T.paper);
    var fillCol = d.kind === "boss" ? T.red : hot && (d.anim * 8 % 1 < 0.5) ? T.red : T.accent;
    c.fillStyle = fillCol;
    var inner = Math.max(0, (w - 3.2) * clamp(d.t, 0, 1));
    if (inner > 0) {
      A.rr(c, x + 1.6, y + 1.6, inner, h - 3.2, 1.4);
      c.fill();
    }
    if (d.kind === "stubborn" && d.hits > 1) drawFlag(c, x - 2.5, y + 4.5, 0.9);
  }

  // A red flag: high importance
  function drawFlag(c, x, y, s) {
    c.save();
    c.translate(x, y);
    c.scale(s, s);
    c.beginPath();
    c.moveTo(0, 0); c.lineTo(0, -12);
    A.stroke(c, 2.6, T.ink);
    c.beginPath();
    c.moveTo(0, 0); c.lineTo(0, -12);
    A.stroke(c, 1.2, T.paper);
    c.beginPath();
    c.moveTo(0.6, -12); c.lineTo(8, -9.4); c.lineTo(0.6, -6.6);
    c.closePath();
    A.fill(c, T.red, 1.1);
    c.restore();
  }

  // The CEO's corner office: glass, a nameplate, and a plant that's thriving
  function drawGlass(c, d) {
    c.save();
    A.rr(c, 3, -6, 94, 80, 4);
    c.fillStyle = T.ink;
    c.fill();
    c.lineWidth = 2.2;
    c.strokeStyle = T.accent;
    c.stroke();
    c.beginPath();
    c.moveTo(10, 10); c.lineTo(22, -2);
    c.moveTo(14, 16); c.lineTo(30, 0);
    c.moveTo(78, 70); c.lineTo(92, 56);
    c.lineWidth = 1.4;
    c.strokeStyle = T.paper;
    c.globalAlpha = 0.6;
    c.stroke();
    c.restore();
  }

  function drawOooSign(c, d, sx, sy) {
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    var size = clamp(L.k * 8.5, 9, 14);
    var p = at(d, 40, 41);
    c.font = size + "px " + T.display;
    var w1 = c.measureText("OUT OF").width, w2 = c.measureText("OFFICE").width;
    var w = Math.max(w1, w2) + size * 1.1, h = size * 2.5;
    var wob = d.flash > 0 && !shell.reduceMotion ? Math.sin(d.flash * 40) * 0.08 : 0;
    c.save();
    c.translate(p.x + sx, p.y + sy);
    c.rotate(-0.06 + wob);
    A.rr(c, -w / 2, -h / 2, w, h, 2);
    A.fill(c, T.paper, 2);
    c.fillStyle = T.ink;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("OUT OF", 0, -size * 0.5);
    c.fillText("OFFICE", 0, size * 0.55);
    c.restore();
  }

  function drawStrip(c) {
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    var s = L.server;
    var melt = G.phase === "melt" ? clamp(G.endT / 1.1, 0, 1) : 0;
    var jig = 0;
    var share = run.load / cap();
    if (!shell.reduceMotion && share > 0.7 && G.phase === "play") jig = (Math.random() - 0.5) * (share - 0.7) * 6;
    c.save();
    c.translate(jig, 0);
    A.server(c, s.x, s.y, s.w, s.h, { load: share, clock: G.time + G.endT, melt: melt,
                                       gulp: shell.reduceMotion ? 0 : clamp((G.gulp || 0) / 0.35, 0, 1) });
    c.restore();
    if (L.sign) A.sign(c, L.sign.x, L.sign.y, L.sign.w, L.sign.h);
    if (!touching() && info().mute) {
      var m = L.mute;
      var share2 = 1 - G.muteWait / (MUTE_CD * run.mods.muteCd);
      A.muteButton(c, m.x, m.y, m.r, share2, G.muteWait <= 0, "E", hand.press > 0.5 && G.lastMuteAt && performance.now() - G.lastMuteAt < 200);
    }
  }

  function drawTapes(c) {
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    G.tapes.forEach(function (tp) {
      var first = deskAtCell(0, tp.row), lastD = deskAtCell(L.cols - 1, tp.row);
      if (!first || !lastD) return;
      var a = at(first, 0, 30), b = at(lastD, 100, 30);
      var reveal = shell.reduceMotion ? 1 : clamp(tp.t / 0.25, 0, 1);
      var alpha = shell.reduceMotion ? clamp(tp.t * 6, 0, 1) * clamp((1.2 - tp.t) * 4, 0, 1) : clamp((1.2 - tp.t) * 4, 0, 1);
      A.tape(c, a.x, b.x, a.y, Math.max(16, 14 * L.k), reveal, alpha, "Muted");
    });
  }

  function drawFlights(c) {
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    G.flights.forEach(function (f) {
      var a = endpoint(f.from, f), b = endpoint(f.to, f);
      var k = f.t < 0.5 ? 2 * f.t * f.t : 1 - Math.pow(-2 * f.t + 2, 2) / 2;
      var lift = Math.min(80, Math.hypot(b.x - a.x, b.y - a.y) * 0.25);
      var x = a.x + (b.x - a.x) * k, y = a.y + (b.y - a.y) * k - Math.sin(k * Math.PI) * lift;
      var k2 = Math.max(0, k - 0.08);
      var px = a.x + (b.x - a.x) * k2, py = a.y + (b.y - a.y) * k2 - Math.sin(k2 * Math.PI) * lift;
      var w = clamp(L.k * 13, 11, 22) * (f.kind === "boss" ? 1.3 : 1);
      A.motion(c, px, py, x, y, w);
      A.envelope(c, x, y, w, f.rot + Math.sin(f.t * 9) * 0.15, f.kind === "boss");
    });
  }

  function drawFx(c) {
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    G.fx.forEach(function (e) {
      if (e.kind === "puff") A.puff(c, e.x, e.y, e.r, e.t / e.life, e.blobs);
    });
  }

  function drawStamps(c) {
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    var size = clamp(L.k * 9, 10, 16);
    G.stamps.forEach(function (s) {
      var k = s.t / s.life;
      var grow = shell.reduceMotion ? 1 : s.t < 0.12 ? 1.7 - (s.t / 0.12) * 0.75 : s.t < 0.2 ? 0.95 + (s.t - 0.12) / 0.08 * 0.05 : 1;
      var alpha = shell.reduceMotion ? Math.min(1, s.t * 10) * Math.min(1, (1 - k) * 4) : Math.min(1, (1 - k) * 4);
      A.stamp(c, s.x, s.y, s.text, size, s.tilt, alpha, grow);
    });
  }

  function drawPops(c) {
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    var size = clamp(L.k * 9, 11, 16);
    c.font = size + "px " + T.display;
    c.textAlign = "center";
    c.textBaseline = "middle";
    G.pops.forEach(function (p) {
      var k = p.t / 0.9;
      var y = p.y - (shell.reduceMotion ? 0 : k * 16);
      c.globalAlpha = 1 - k * k;
      c.lineWidth = 3;
      c.strokeStyle = T.ink;
      c.strokeText(p.text, p.x, y);
      c.fillStyle = T.paper;
      c.fillText(p.text, p.x, y);
    });
    c.globalAlpha = 1;
  }

  function drawCursor(c) {
    if (AUTOPILOT || touching()) return;
    if (pointerMode === "mouse" && !mouse.on) return;
    var d = pointerMode === "mouse" ? deskAt(mouse.x, mouse.y) : G.desks[cursor];
    if (!d) return;
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    var a = at(d, 13, -3), b = at(d, 68, 63);
    A.brackets(c, a.x, a.y, b.x - a.x, b.y - a.y, T.paper, Math.min(16, L.k * 12), 2.6);
  }

  function drawHand(c) {
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    var size = clamp(L.k * 34, 30, 60);
    var tx, ty;
    if (touching() && !AUTOPILOT) {
      if (hand.show <= 0) return;
      c.globalAlpha = clamp(hand.show * 4, 0, 1);
      tx = hand.tx; ty = hand.ty;
    } else if (pointerMode === "mouse" && !AUTOPILOT) {
      if (!mouse.on) return;
      tx = mouse.x; ty = mouse.y;
    } else {
      var d = G.desks[cursor];
      if (!d) return;
      var p = handSpot(d);
      tx = p.x; ty = p.y;
    }
    // glide (keys and the autopilot), or stick to the pointer
    var glide = pointerMode === "mouse" && !AUTOPILOT ? 1 : 0.35;
    hand.x += (tx - hand.x) * glide;
    hand.y += (ty - hand.y) * glide;
    c.save();
    c.translate(hand.x, hand.y);
    c.rotate(0.55);    // pointing down and left, the hand up and to the right, clear of the bar
    A.hand(c, 0, 0, size, shell.reduceMotion ? 0 : hand.press);
    c.restore();
    c.globalAlpha = 1;
  }

  function drawIntern(c) {
    var it = G.intern;
    if (it.x < -20) return;
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    c.save();
    c.translate(it.x, it.y);
    c.rotate(-0.5);     // the intern comes from the other side
    A.hand(c, 0, 0, clamp(L.k * 26, 24, 44), 0, "Intern");
    c.restore();
  }

  // The arrow: first pass just reserves its space (so bubbles keep clear)
  function drawHint(c, measureOnly) {
    var h = G.hint;
    if (!h) return null;
    var x, y, dir = "down";
    // at a desk: from the side, over their monitor, so it never covers anyone
    if (h.desk) { var q = at(h.desk, 56, 25); x = q.x; y = q.y; dir = "left"; }
    else if (h.mute) { x = L.mute.x; y = L.mute.y - L.mute.r - 4; }
    else if (h.pad) {
      var pad = root.querySelector('.kit-pad[data-key="mute"]');
      if (!pad) return null;
      var r = pad.getBoundingClientRect(), base = root.getBoundingClientRect();
      x = r.left - base.left + r.width / 2; y = r.top - base.top - 4;
    } else return null;
    var size = clamp(L.k * 20, 20, 28);
    var bob = shell.reduceMotion ? 0 : Math.abs(Math.sin(performance.now() / 250)) * 5;
    if (dir === "left") {
      if (measureOnly) return { x: x, y: y - size * 1.1, w: size * 3.4, h: size * 1.6 };
      c.setTransform(DPR, 0, 0, DPR, 0, 0);
      A.arrow(c, x + bob, y, h.word, size, "left", W - 4);
      return null;
    }
    if (measureOnly) return { x: x - size * 2, y: y - size * 1.9, w: size * 4, h: size * 1.9 };
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    A.arrow(c, clamp(x, size * 1.6, W - size * 1.6), y - bob, h.word, size);
    return null;
  }

  // Speech bubbles, in screen pixels so the words stay readable on a phone.
  // Above the speaker if there's room, otherwise beside them; stacked, not overlapped.
  var hudCache = null, hudAge = 0;
  function hudBoxes() {
    if (hudCache && hudAge++ < 60) return hudCache;
    hudAge = 0;
    var base = root.getBoundingClientRect();
    hudCache = [];
    Array.prototype.forEach.call(root.querySelectorAll(".kit-hud-tl, .kit-hud-tr, .kit-bar"), function (el) {
      var r = el.getBoundingClientRect();
      if (r.width) hudCache.push({ x: r.left - base.left, y: 0, w: r.width, h: r.bottom - base.top });
    });
    return hudCache;
  }
  function overlaps(a, b, gap) {
    return a.x < b.x + b.w + gap && a.x + a.w + gap > b.x && a.y < b.y + b.h + gap && a.y + a.h + gap > b.y;
  }
  function wrap(text, max) {
    var words = text.toUpperCase().split(" "), lines = [""];
    words.forEach(function (w) {
      var tryLine = lines[lines.length - 1] ? lines[lines.length - 1] + " " + w : w;
      if (tryLine.length > max && lines[lines.length - 1] && lines.length < 2) lines.push(w);
      else lines[lines.length - 1] = tryLine;
    });
    return lines;
  }
  function drawBubbles(c, arrowBox) {
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    var size = clamp(L.k * 9.5, 11, 15);
    c.font = size + "px " + T.display;
    var placed = hudBoxes().slice();
    if (arrowBox) placed.push(arrowBox);
    // keep clear of everyone's bars
    var bars = [];
    G.desks.forEach(function (d) {
      if (d.state !== "typing") return;
      var a = at(d, 16, -3), b = at(d, 64, 8);
      bars.push({ x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y, desk: d });
    });
    G.bubbles.forEach(function (b) {
      var d = b.desk;
      var lines = wrap(b.text, 16);
      var tw = 0;
      lines.forEach(function (l) { tw = Math.max(tw, c.measureText(l).width); });
      var pad = size * 0.55, lh = size * 1.02;
      var bw = tw + pad * 2, bh = lines.length * lh + pad * 1.15;
      var head = at(d, 40, d.kind === "ooo" ? 36 : 18);
      var o = origin(d);
      var tries = [
        { x: head.x - bw / 2, y: o.y - 3 - bh - size * 0.65 },                      // above
        { x: o.x + 60 * L.k, y: o.y + 22 * L.k - bh / 2 },                           // to the right
        { x: o.x + 20 * L.k - bw, y: o.y + 22 * L.k - bh / 2 },                      // to the left
        { x: head.x - bw / 2, y: o.y + 66 * L.k }                                    // below
      ];
      var box = null;
      for (var i = 0; i < tries.length && !box; i++) {
        var t = { x: clamp(tries[i].x, 4, W - bw - 4), y: clamp(tries[i].y, 4, H - bh - 4), w: bw, h: bh };
        if (!placed.some(function (p) { return overlaps(t, p, 3); }) &&
            !bars.some(function (p) { return p.desk !== d && overlaps(t, p, 1); })) box = t;
      }
      if (!box) box = { x: clamp(tries[0].x, 4, W - bw - 4), y: clamp(tries[0].y, 4, H - bh - 4), w: bw, h: bh };
      placed.push(box);
      var pop = shell.reduceMotion ? 1 : clamp(b.t * 8, 0, 1);
      var fade = b.typing ? 1 : clamp((b.life - b.t) * 3, 0, 1);
      A.bubble(c, box, at(d, 40, d.kind === "ooo" ? 40 : 22), lines, size, Math.min(pop, fade), b.boss);
    });
  }

  // ---------------------------------------------------------------------------
  // Sound: lo-fi, through the kit. The server hums, then groans.
  // ---------------------------------------------------------------------------
  var sfx = {
    key: function () { N.sound.tone(1500 + Math.random() * 1100, 0.016, { vol: 0.016 }); },
    itch: function () { N.sound.tone(330, 0.06, { type: "triangle", vol: 0.035 }); N.sound.tone(440, 0.07, { type: "triangle", vol: 0.035, delay: 0.05 }); },
    tap: function () { N.sound.tone(240, 0.05, { vol: 0.035 }); },
    stop: function (close) {
      N.sound.tone(210, 0.1, { type: "square", slide: 80, vol: 0.09 });
      N.sound.noise(0.06, { freq: 2000, vol: 0.12 });
      if (close) N.sound.tone(1320, 0.1, { vol: 0.05, delay: 0.06 });
    },
    flinch: function () { N.sound.tone(280, 0.07, { vol: 0.06 }); N.sound.tone(220, 0.09, { vol: 0.06, delay: 0.07 }); },
    send: function () {
      N.sound.noise(0.42, { type: "bandpass", freq: 1100, q: 0.7, vol: 0.2 });
      N.sound.tone(500, 0.3, { type: "sine", slide: 1500, vol: 0.06 });
    },
    land: function () { N.sound.tone(95, 0.22, { type: "sawtooth", slide: 60, vol: 0.07 }); },
    mail: function () { N.sound.tone(1760, 0.05, { vol: 0.03, delay: 0.05 }); N.sound.tone(2350, 0.08, { vol: 0.03, delay: 0.11 }); },
    mute: function () {
      N.sound.noise(0.4, { type: "highpass", freq: 2500, vol: 0.14 });
      N.sound.tone(620, 0.25, { slide: 200, vol: 0.05 });
      G.lastMuteAt = performance.now();
    },
    nope: function () { N.sound.tone(180, 0.12, { vol: 0.05 }); },
    ooo: function () { [880, 660, 880].forEach(function (f, i) { N.sound.tone(f, 0.05, { vol: 0.03, delay: i * 0.07 }); }); },
    boss: function () {
      // very sad
      [392, 370, 349].forEach(function (f, i) { N.sound.tone(f, 0.22, { type: "sawtooth", vol: 0.04, delay: 0.2 + i * 0.24 }); });
      N.sound.tone(330, 0.8, { type: "sawtooth", slide: 296, vol: 0.045, delay: 0.92 });
    },
    streak: function () { [660, 880, 1100].forEach(function (f, i) { N.sound.tone(f, 0.08, { type: "triangle", vol: 0.05, delay: i * 0.06 }); }); },
    bell: function () { N.sound.tone(1047, 0.5, { type: "triangle", vol: 0.07 }); N.sound.tone(784, 0.7, { type: "triangle", vol: 0.07, delay: 0.32 }); },
    groan: function () { N.sound.tone(74, 1.2, { type: "sawtooth", slide: 44, vol: 0.09 }); },
    melt: function () {
      N.sound.noise(1.6, { type: "lowpass", freq: 600, vol: 0.3 });
      N.sound.tone(140, 1.6, { type: "sawtooth", slide: 38, vol: 0.12 });
      N.sound.stamp(0.1);
    },
    move: function () { N.sound.tone(900, 0.02, { vol: 0.02 }); }
  };

  // The server's hum: a low buzz that rises and wobbles as the load climbs
  function tickHum() {
    var ac = N.sound.ctx();
    if (!ac || ac.state !== "running") return;
    var playing = shell.state() === "playing" && G && G.phase === "play";
    var share = playing ? clamp(run.load / cap(), 0, 1) : 0;
    if (!hum) {
      if (!share) return;
      var o = ac.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = 50;
      var lfo = ac.createOscillator();
      lfo.frequency.value = 0.8;
      var depth = ac.createGain();
      depth.gain.value = 0;
      lfo.connect(depth);
      depth.connect(o.frequency);
      var f = ac.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = 260;
      var g = ac.createGain();
      g.gain.value = 0;
      o.connect(f);
      f.connect(g);
      g.connect(N.sound.out());
      o.start();
      lfo.start();
      hum = { o: o, lfo: lfo, depth: depth, g: g };
    }
    var t = ac.currentTime;
    var vol = share > 0.3 ? (share - 0.3) * 0.085 : 0;
    hum.g.gain.setTargetAtTime(vol, t, 0.15);
    hum.o.frequency.setTargetAtTime(46 + share * 34, t, 0.2);
    hum.lfo.frequency.setTargetAtTime(0.6 + share * 3, t, 0.2);
    hum.depth.gain.setTargetAtTime(share > 0.6 ? (share - 0.6) * 30 : 0, t, 0.2);
  }
  function quietHum() {
    var ac = N.sound.ctx();
    if (hum && ac) hum.g.gain.setTargetAtTime(0, ac.currentTime, 0.05);
  }

  // ---------------------------------------------------------------------------
  // Pointer: a click or a tap stops whoever is under it
  // ---------------------------------------------------------------------------
  function local(e) {
    var r = root.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function onScreen(e) {
    var t = e.target;
    return !(t && t.closest && t.closest(".kit-panel, .kit-bar, .kit-pad, .kit-intro, button, a"));
  }
  root.addEventListener("pointerdown", function (e) {
    if (!shell || !G || shell.state() !== "playing" || !onScreen(e)) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    var p = local(e);
    if (e.pointerType === "mouse") {
      pointerMode = "mouse";
      mouse.x = p.x; mouse.y = p.y; mouse.on = true;
    } else {
      e.preventDefault();
      hand.tx = p.x; hand.ty = p.y; hand.x = p.x; hand.y = p.y; hand.show = 0.45;
    }
    if (AUTOPILOT) return;
    if (!touching() && info().mute && Math.hypot(p.x - L.mute.x, p.y - L.mute.y) < L.mute.r + 6) { hand.press = 1; tryMute(); return; }
    var d = deskAt(p.x, p.y);
    if (d) { cursor = d.i; hit(d, "point"); }
    else hand.press = 1;
  });
  root.addEventListener("pointermove", function (e) {
    if (e.pointerType !== "mouse" || !shell) return;
    var p = local(e);
    mouse.x = p.x; mouse.y = p.y; mouse.on = onScreen(e);
    if (pointerMode !== "mouse" && (Math.abs(e.movementX) + Math.abs(e.movementY) > 2)) pointerMode = "mouse";
    root.style.cursor = shell.state() === "playing" && pointerMode === "mouse" && mouse.on && !AUTOPILOT ? "none" : "";
  });
  root.addEventListener("pointerleave", function () { mouse.on = false; root.style.cursor = ""; });
  document.addEventListener("keydown", function (e) {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "KeyW", "KeyA", "KeyS", "KeyD", "Space"].indexOf(e.code) >= 0 && run) {
      run.learned.keys = true;
      if (pointerMode === "mouse") { pointerMode = "keys"; root.style.cursor = ""; }
    }
  });

  // ---------------------------------------------------------------------------
  // Start it up
  // ---------------------------------------------------------------------------
  shell = N.createGame({
    root: root,
    slug: "reply-all",
    title: "Reply All",
    stamp: "Not sent",
    tilt: -5,
    note: "Someone has replied all to the whole company. Stop the replies before the server melts. Home at 17:00.",
    pitch: "Someone has replied all to the whole company. Now everyone is replying all to say stop replying all.",
    hints: {
      keys: "Click anyone about to reply, or move with the arrow keys and press Space. E or Shift mutes a row. P to pause.",
      touch: "Tap anyone about to reply. Mute thread on the right."
    },
    againLabel: "Start another day",
    daily: true,
    smallCallouts: true,
    keys: {
      up: ["ArrowUp", "KeyW"], down: ["ArrowDown", "KeyS"], left: ["ArrowLeft", "KeyA"], right: ["ArrowRight", "KeyD"],
      action: ["Space"], mute: ["KeyE", "ShiftLeft", "ShiftRight"]
    },
    pad: { action: [0, 2, 7], mute: [1, 3, 6] },
    touch: [{ key: "mute", label: "Mute thread", icon: "Mute", side: "right" }],
    reset: reset,
    update: function (dt, input) { update(dt, input); },
    render: function (dt) { render(dt); },
    resize: resize
  });
  T = shell.tokens;

  // The canvas font may arrive after the first frame
  if (document.fonts && document.fonts.load) {
    document.fonts.load("12px " + T.display).then(function () { bg = null; });
  }

  if (DEBUG) {
    window.__replyAll = {
      run: function () { return run; },
      stage: function () { return G; },
      layout: function () { return L; },
      state: function () { return shell.state(); },
      score: function () {
        return { stage: run.stage + 1, clock: clockText(), score: Math.round(run.score), stopped: run.stopped, out: run.out,
                 load: Math.round(run.load), cap: cap(), streak: run.streak, taken: run.taken.join(",") };
      }
    };
  }
})();
