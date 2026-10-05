// On Mute: four video calls back to back, and a spreadsheet that needs doing.
//
// THE JOKE
// Meeting culture: the stand-up that runs over, the all-hands nobody can
// leave, the meeting that could have been an email, the notetaker nobody
// invited. You keep your camera on, your mic off and your head down, and you
// say "Yep." to everything. The people stuck in the meetings are never the
// joke; the meetings are. Everyone is invented, and so is the call software.
//
// THE SCREEN, AND WHERE YOUR EYES GO
// Two halves. At the top, the call: a grid of tiles, one person in each, the
// speaker in a violet frame and what they say in a speech bubble. At the
// bottom, your actual job: a spreadsheet. Your own tile (the self-view, with
// your kitchen behind you) sits right next to the spreadsheet, so a glance
// from the work lands on it: everything you need to react to shows up on
// your own tile, and the bubbles up top are for context and the jokes.
// Everyone in the call turns to look at your tile when you're on the spot.
//
// THE WORK (the bottom half, and most of the score)
// Paste the same thing into every empty box. Each row of the sheet has two
// boxes; one is empty, the other already has something in it (a formula, a
// name, "Not mine"). Paste into the empty one: Left or Right (the arrow
// keys or A and D, a click, a tap, or the corner buttons on a phone). The
// next rows are in view, so a good player reads ahead and rattles through
// them: left, left, right, left. Paste into a full box and the sheet stops
// responding for a moment ("Not responding", a spinner) and the streak goes.
// Every box scores 10, times a streak multiplier (x2 after 12 in a row,
// x3 after 24, x4 after 36). Six rows (twelve boxes) make a sheet; every
// sheet saved answers an email.
// The inbox fills on its own, faster each meeting. Ignore the work and it
// piles up; when it's full, every new email gets mentioned in the meeting
// ("Sam, did you see my email?"), and that costs reputation.
//
// THE MEETING (the top half: keep up appearances)
// Everything addressed to you lights your tile: a violet frame, everyone's
// eyes turning to you, and a badge in your tile's corner with a ring that
// runs down for as long as you have. Bubbles that name you have a violet
// outline and your name underlined.
//   Your name    "Like Sam said last week." The badge says SAM. Nod (N).
//                2.6 seconds in the stand-up, down to 1.9 in the last.
//   A question   "Sam, any blockers?" The badge is a question mark. Unmute
//                (Space) and you say "Yep." Whatever the question was.
//                3 seconds, down to 2.2. Then you're live, with a ring round
//                your mic: mute again before it runs out, or they hear the
//                dishwasher behind you (it starts shaking as soon as you're
//                live), the host mutes you, and that costs reputation.
//   The cat      From the team meeting on. The door behind you creaks open
//                and two eyes appear in the gap. It walks across the kitchen
//                and jumps up in front of the camera, facing away. Camera off
//                (C) before it gets there (3.2 seconds, down to 2.6), and
//                back on once it's gone: the camera can only be off while the
//                cat's about, and a few seconds after (a bar on your tile
//                runs down) people ask where you've gone.
// One rule per action, everywhere: nod at your name, answer questions out
// loud, camera off for the cat. Do any of them when nobody asked and you've
// volunteered ("Great. Sam's on it."): one more email. Nodding at a question
// just gets "We can't hear a nod, Sam." Questions to everyone ("Any
// questions?") and to other people (Pam, mostly) aren't for you.
// Miss something and your reputation drops a pip (five to start). Get through
// a meeting without missing anything and one comes back. Lose them all and
// the host removes you from the meeting: the run is over.
//
// THE STAGES (a notice, shell.brief, says what's new before Go)
//   1. The stand-up (09:00, 30s). Graham, Priya and Dave (frozen). Your name
//      and questions only, with long windows and plenty of space between.
//   2. The team meeting (10:00, 34s). Six tiles, and the cat.
//   3. The all-hands (13:00, 38s). Twelve tiles and Rupert, Head of Vision.
//      Lots of questions to everyone, which aren't for you, and "Let's go
//      round the room": a frame moves tile to tile as each person says one
//      word about their week, and when it gets to you, unmute.
//   4. This could have been an email (16:00, 40s). Graham reads an email
//      out. Everything is quicker, and he asks you to share your screen: say
//      yep, and for eight seconds everyone can see your spreadsheet, so a
//      wrong box costs reputation ("Is that a #N/A?"). Nothing else is asked
//      of you while you're sharing. Then it overruns.
// Between meetings (shell.interlude) the notetaker's summary, the numbers,
// and three ways to get through the next one, each with a cost: have an
// opinion (a pip back, three more emails), headphones (longer to mute again,
// less time to answer), a second monitor (more of the sheet in view and
// boxes score more, but you get asked more), close the door (half the cats,
// a louder dishwasher), blur your background (the cat takes longer, nods
// score nothing), out of office (slower emails, sheets score nothing), a bad
// connection (the first miss each meeting is forgiven, but people email you
// instead) and keyboard shortcuts (wrong boxes stall half as long, the
// streak builds half as fast). The cat's ones only come after you've met it.
//
// SCORING
// Boxes as above, 50 a sheet. Nod 50, yep 75 (100 if you answer within
// 0.8s: keen), muted again in time 25, the cat hidden 100, camera back on in
// time 25. Each meeting ends with 100 x your reputation x the meeting's
// number, and 250 x the number for an empty inbox. 1,000 for getting through
// the day.
//
// THE LADDER (results stamp)
//   Approved        all four meetings, 4 or 5 reputation, at least 22,000
//   Pending review  all four meetings
//   Not approved    removed from the all-hands or the last meeting
//   Rejected        removed from the stand-up or the team meeting
//
// TODAY'S RUN
// Each meeting is planned from its own seeded streams when it starts: who
// says what and when, the cat, the emails, the rows of the spreadsheet and
// the choices offered after it. What you do never changes what the next
// meeting deals. Reactions to your mistakes are left to chance.
//
// AUTOPILOT
// ?autopilot (and ?clip) plays like a good player: a reaction time of about
// 0.4s to anything on your tile, a paste every 0.25 to 0.35s with the odd
// wrong box, mutes again after half a second, and hides the cat. In the clip
// frame it's a touch slower, so the cat gets seen now and then.
// ?debug exposes window.__onMute for test players, with &stage=3 to start
// at the all-hands and &skill=0.6 to slow the autopilot down.
//
// Built on the shared kit (/games/kit/kit.js): intro, screens, controls,
// sound and saving. call.js draws the people, their rooms and the cat.
(function () {
  "use strict";

  var N = window.Notaste;
  var A = window.OnMuteArt;
  var root = document.getElementById("game-root");
  if (!N || !A || !root) return;

  var params = new URLSearchParams(window.location.search);
  var AUTOPILOT = N.flags.autopilot;
  var DEBUG = params.has("debug");
  var FIRST = DEBUG || N.flags.clip ? Math.max(0, Math.min(3, (parseInt(params.get("stage"), 10) || 1) - 1)) : 0;
  var SKILL = DEBUG && params.has("skill") ? Math.max(0.3, Math.min(2, parseFloat(params.get("skill")) || 1)) : N.flags.clip ? 0.85 : 1;

  // ---------------------------------------------------------------------------
  // Tuning
  // ---------------------------------------------------------------------------
  var REP_MAX = 5;
  var INBOX_MAX = 10;
  var INBOX_START = 2;
  var SHEET_ROWS = 6;
  var STREAK_STEP = 12, MULT_MAX = 4;
  var STALL = 0.7;              // a wrong box: the sheet stops responding this long
  var CAM_GRACE = 3.4;          // camera off with no cat about: this long before they ask
  var CAT_STAY = 2.2;           // on the desk, in front of the camera
  var CHASE_GAP = 6;            // at most one "did you see my email" this often
  var VOLUNTEER_GAP = 1.2;      // a second wrong nod this soon is the same nod
  var KEEN = 0.8;
  var APPROVED = 22000;
  var PTS = { box: 10, sheet: 50, nod: 50, yep: 75, keen: 25, muted: 25, hidden: 100, camBack: 25, survive: 1000 };
  var T0 = 3.6;                 // the first thing anyone says to you, after Go (the notice is up until then)

  // start: the meeting's clock (minutes past midnight), mins: how long it says
  // it lasts. time: seconds of play. slots: what happens to you, in order
  // (shuffled from the stage's seed where it says so). nameWin/askWin: how
  // long you get. grace: how long you can stay unmuted. catTime: from the door
  // to the desk. email: seconds between emails, start to end. gap: seconds
  // per thing addressed to you.
  var STAGES = [
    { id: "standup", name: "The stand-up", start: 9 * 60, mins: 15, time: 30,
      cast: ["graham", "priya", "dave"], host: "graham",
      you: ["name", "ask", "name", "ask", "name"], cats: 0, gap: 4.7,
      nameWin: 2.6, askWin: 3.0, grace: 2.4, catTime: 3.4, email: [7.0, 6.0],
      clip: "TBC", talk: "standup" },
    { id: "team", name: "The team meeting", start: 10 * 60, mins: 60, time: 34,
      cast: ["graham", "priya", "gaz", "linda", "pam", "notes"], host: "graham",
      you: ["name", "ask", "name", "ask", "ask", "name"], cats: 2, gap: 3.8,
      nameWin: 2.2, askWin: 2.6, grace: 2.0, catTime: 3.2, email: [5.6, 4.8],
      clip: "See attached", talk: "team" },
    { id: "allhands", name: "The all-hands", start: 13 * 60, mins: 60, time: 38,
      cast: ["rupert", "graham", "priya", "gaz", "linda", "pam", "dave", "femi", "hannah", "phone", "rob", "notes"],
      host: "rupert", you: ["name", "ask", "round", "name", "ask", "name"], cats: 2, gap: 3.3,
      nameWin: 1.9, askWin: 2.2, grace: 1.8, catTime: 2.8, email: [4.4, 3.8],
      clip: "Per my email", talk: "allhands" },
    { id: "email", name: "This could have been an email", start: 16 * 60, mins: 30, time: 40, overrun: 6,
      cast: ["graham", "priya", "keith", "bernard", "mo", "notes"], host: "graham",
      you: ["name", "ask", "share", "name", "ask", "name", "ask"], cats: 3, gap: 2.9,
      nameWin: 1.8, askWin: 2.1, grace: 1.7, catTime: 2.5, email: [4.0, 3.4],
      clip: "N/A", talk: "email" }
  ];
  var LAST = STAGES.length - 1;

  // ---------------------------------------------------------------------------
  // What people say. Your name is Sam. You say "Yep."
  // ---------------------------------------------------------------------------
  var YOU_NAME = "Sam";
  var YEP = "Yep.";
  var NAMES = ["Like Sam said last week.", "Sam's across that.", "Sam's got the spreadsheet.", "Thanks, Sam.",
               "As per Sam's email.", "Sam and I were just saying.", "Credit to Sam for that.", "Sam's been great on this.",
               "I'll pick that up with Sam.", "That's Sam's area.", "Sam sorted that.", "Sam knows the history.",
               "Sam flagged that.", "Big thanks to Sam.", "Sam's on the next one too.", "Sam will remember."];
  var ASKS = ["Sam, any blockers?", "Sam, are you happy with that?", "Sam, did you get a chance to look?", "Can you hear us, Sam?",
              "Sam, are you still with us?", "Sam, is that right?", "Sam, does that work for you?", "Sam, anything to add?",
              "Sam, can you see my screen?", "Sam, are we on track?", "Sam, did you read the doc?", "Sam, shall we say Thursday?",
              "Sam, are you OK to own that?", "Sam, did that go out?", "Sam, can you hear me now?", "Sam, are you across this?"];
  // someone else, named or asked, and what they say back
  var DECOYS = [
    ["Pam, any blockers?", "pam", "None."], ["Priya, happy with that?", "priya", "Yep, on it."],
    ["Like Pam said.", "pam", null], ["Thanks, Priya.", "priya", null], ["Gaz, you're on mute.", "gaz", "Am I."],
    ["Linda, are you eating?", "linda", "Sorry."], ["Pam, did you get that?", "pam", "Got it."],
    ["Over to Priya.", "priya", "Thanks."], ["Dave? We've lost Dave.", "dave", null], ["Keith, you're breaking up.", "keith", "Tunnel."],
    ["Mo, are you walking?", "mo", "Steps."], ["Bernard, you're very close.", "bernard", "Am I."], ["Rob, can you see it?", "rob", "Yes."],
    ["Tanya, any questions?", "tanya", "No."], ["Pam, are you on mute?", "pam", "No."]
  ];
  // questions to everyone: not for you
  var EVERYONE = ["Any questions?", "Can everyone see my screen?", "Is everyone happy?", "Does that make sense?",
                  "Can everyone hear me?", "Are we all here?", "Thoughts?", "Is it just me?", "Shall we wait for Dave?",
                  "Who's taking notes?", "Anyone?", "Any objections?"];
  var TALK = {
    standup: ["Let's give it a minute.", "Yesterday: meetings.", "Today: meetings.", "No blockers.", "Same as yesterday.",
              "Quick one.", "I'll keep this short.", "Nothing from me.", "Let's take that offline."],
    team: ["Let's go through the actions.", "That's still open.", "Can we get a date on that?", "Let's park that.",
           "Sorry, I was on mute.", "No, you go.", "Sorry, go on.", "Just to piggyback.", "I've got a hard stop.", "Can we circle back?"],
    allhands: ["Big quarter.", "We're a family.", "Next slide.", "Exciting times.", "Our values haven't changed.",
               "Huge shout-out to everyone.", "We're on a journey.", "Wellbeing is a priority.", "Can everyone go on mute.", "Synergy."],
    email: ["Hi all.", "Just a quick reminder.", "The kitchen is not a storage area.", "Please label your milk.",
            "The fridge will be cleared on Friday.", "Anything left will be binned.", "This includes the yoghurts.",
            "Thanks in advance.", "Kind regards.", "Sent from my phone."]
  };
  var STARTS = ["Let's give it a minute.", "Shall we start.", "Can everyone hear me?", "Right. Let me read this out."];
  var ENDS = ["Right, I'll let you all go.", "Let's take the rest offline.", "Exciting times. Bye.", "I'll send this round as an email."];
  var ROUND_ASK = "Let's go round. One word on your week.";
  var ROUND_WORDS = ["Busy.", "Fine.", "Long.", "Thursday.", "Meetings.", "Mixed.", "Hectic.", "Grand.", "Ongoing.", "Wet."];
  var SHARE_ASK = "Sam, can you share your screen?";
  var SHARE_LINES = ["Very colourful.", "Is that a #N/A?", "Lovely.", "Why's it doing that.", "Is that live?"];
  var SHARE_OOPS = ["Is that a #N/A?", "Why's it doing that.", "That's not right.", "Can you zoom in."];
  var SHARE_END = "Thanks, Sam. Stop sharing.";
  var OVERRUN = "Just one more thing.";

  var MISS_NAME = ["Sam? Frozen.", "We've lost Sam.", "Earth to Sam.", "Sam's gone quiet.", "Sam? Never mind."];
  var MISS_ASK = ["Sam? You're on mute.", "Sam?", "I'll take that as a yes.", "Sam's not with us.", "Let's come back to Sam."];
  var CAT_SEEN = ["Is that a cat.", "Hello, puss.", "Sam's cat has joined.", "Lovely. A cat's bum.", "The cat's on mute too."];
  var DISH = ["Is that a dishwasher.", "Someone's not on mute.", "Sam, you're not on mute.", "Sounds like a spin cycle."];
  var VOLUNTEER = ["Great. Sam's on it.", "Thanks, Sam. I'll send it over.", "Lovely. Action on Sam.", "Sam's volunteered.", "Sam will take the minutes."];
  var NOD_AT_ASK = "We can't hear a nod, Sam.";
  var CAM_LONG = ["Camera on, please, Sam.", "Can we see you, Sam?", "Sam's gone dark."];
  var CHASE = ["Sam, did you see my email?", "Just flagging my email, Sam.", "Sam, I've emailed you about this.", "Sam, check your inbox."];

  // The spreadsheet
  // (Notaste Display has no equals sign, so no formulas: what's already in a box is words)
  var FILLED = ["Done", "Dave", "Ongoing", "Ask Graham", "Not mine", "See above", "Q4", "Pending", "Yes", "Nobody",
                "Parked", "Maybe", "Tuesday", "Pam", "Sorted", "As before", "Blue", "Who", "Ages ago", "Later", "Gaz", "£40"];
  var SHEETS = ["Stand-up actions", "Q3 final v7", "Copy of budget (2)", "Tracker for the tracker", "Who's bringing what",
                "Holiday rota", "Sheet1", "Do not edit", "Actions (old)", "Meeting notes FINAL", "Risks and issues",
                "Lessons learned", "Desk moves", "Fridge rota", "Projects (live)", "Projects (dead)", "Notes for the notes"];
  var SUBJECTS = ["Quick one", "Following up", "Any update?", "Per my last email", "Re: Re: Fwd: Lunch", "Can we jump on a call?",
                  "Notes from the meeting", "Reminder: meeting", "Action points", "Did you see this?", "Pre-meeting prep",
                  "Bumping this", "Just checking in", "Updated: actions", "Agenda (draft)", "Re: the spreadsheet"];
  var FROM = ["Graham", "Priya", "Gaz", "Linda", "Pam", "Rupert", "Keith", "Mo", "Notetaker"];

  // Between meetings: three ways to get through the next one. Each helps,
  // and each costs. cat: only once you've met the cat.
  var OFFERS = [
    { id: "opinion", label: "Have an opinion", detail: "One reputation back now. You've volunteered for something: three more emails.",
      ok: function () { return run.rep < REP_MAX; },
      apply: function (m) { run.rep = Math.min(REP_MAX, run.rep + 1); run.inbox = Math.min(INBOX_MAX, run.inbox + 3); } },
    { id: "headphones", label: "Headphones", detail: "Twice as long to mute again after you speak. Questions give you a bit less time.",
      apply: function (m) { m.grace *= 2; m.askWin *= 0.85; } },
    { id: "monitor", label: "Second monitor", detail: "Two more rows of the sheet in view, and boxes score a fifth more. You get asked things more.",
      apply: function (m) { m.ahead += 2; m.boxPts *= 1.2; m.extraAsks += 1; } },
    { id: "door", label: "Close the door", detail: "The cat comes in half as often. The dishwasher's louder: half as long to mute again.", cat: true,
      apply: function (m) { m.catCount *= 0.5; m.grace *= 0.6; } },
    { id: "blur", label: "Blur your background", detail: "The cat takes longer to reach the desk. Nobody can see you nod: nods score nothing.", cat: true,
      apply: function (m) { m.catTime *= 1.4; m.nodPts = 0; } },
    { id: "ooo", label: "Out of office on", detail: "Emails arrive a third slower. Finished sheets score nothing.",
      apply: function (m) { m.emailGap *= 1.5; m.sheetPts = 0; } },
    { id: "connection", label: "Bad connection", detail: "The first thing you miss in each meeting is forgiven. People email you instead: a quarter more.",
      apply: function (m) { m.forgive = 1; m.emailGap *= 0.8; } },
    { id: "shortcuts", label: "Keyboard shortcuts", detail: "A wrong box only stalls you half as long. Your streak builds half as fast.",
      apply: function (m) { m.stall *= 0.5; m.streakStep *= 2; } }
  ];

  var RESULT_LINES = [
    "Nobody noticed you weren't listening. That's called a career.",
    "You got through the day. A follow-up has been booked to discuss it.",
    "You were removed from the call. The meeting carried on without you, which says a lot.",
    "The stand-up ran over. So did you."
  ];

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  var shell = null, T = null, ctx = null;
  var W = 1, H = 1, DPR = 1;
  var run = null;        // the whole day
  var G = null;          // this meeting
  var L = { mode: "wide" };
  var hudEls = null;
  var prev = {};
  var auto = null;
  var mouse = { x: 0, y: 0, on: false };
  var pointerMode = "keys";
  var shakeAmt = 0;
  var calloutAt = -10, calloutPri = 0;
  var layoutAge = 99;
  var bg = null;
  var hum = { t: 0 };

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, f) { return a + (b - a) * clamp(f, 0, 1); }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function rpick(list, rnd) { return list[Math.floor(rnd() * list.length)]; }
  function fmt(n) { return Math.round(n).toLocaleString("en-GB"); }
  function info() { return STAGES[run.stage]; }
  function touching() { return root.classList.contains("kit-touching"); }
  function padsOn() { return touching() && !N.flags.clip; }
  function mult() { return Math.min(MULT_MAX, 1 + Math.floor(run.streak / (STREAK_STEP * run.mods.streakStep))); }
  function shuffle(list, rnd) {
    for (var i = list.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var t = list[i]; list[i] = list[j]; list[j] = t;
    }
    return list;
  }

  // ---------------------------------------------------------------------------
  // The day
  // ---------------------------------------------------------------------------
  function reset(sh) {
    shell = sh;
    T = sh.tokens;
    run = {
      stage: FIRST, score: 0, rep: REP_MAX, inbox: INBOX_START, boxes: 0, sheets: 0, wrong: 0,
      nods: 0, yeps: 0, hidden: 0, missed: 0, volunteered: 0, streak: 0, bestStreak: 0,
      taken: [], removed: false, removedAt: "", learned: {}, metCat: FIRST >= 2,
      mods: { grace: 1, askWin: 1, nameWin: 1, ahead: 0, boxPts: 1, extraAsks: 0, catCount: 1, catTime: 1, nodPts: 1,
              emailGap: 1, sheetPts: 1, forgive: 0, stall: 1, streakStep: 1 }
    };
    auto = { work: 0.6, react: 0, target: null, mute: 0, cam: 0 };
    prev = {};
    shakeAmt = 0;
    startStage();
  }

  // Everything this meeting deals, from its own seeded streams
  function plan(st) {
    var base = shell.seed + 1000 * (run.stage + 1);
    var rnd = N.seeded(base + 1);
    var mods = run.mods;
    // what happens to you, and when
    var you = st.you.slice();
    var fixed = you.filter(function (k) { return k === "round" || k === "share"; });
    var loose = shuffle(you.filter(function (k) { return k === "name" || k === "ask"; }), rnd);
    // the day's first is the gentlest: your name, with time to read the badge
    if (run.stage === 0 && loose[0] !== "name") { var at1 = loose.indexOf("name"); loose[at1] = loose[0]; loose[0] = "name"; }
    var slots = [];
    loose.forEach(function (k) { slots.push(k); });
    // the long ones go in the middle
    fixed.forEach(function (k) { slots.splice(Math.floor(slots.length / 2), 0, k); });
    // second monitor: more questions, from a stream of their own
    var extra = N.seeded(base + 7);
    for (var e = 0; e < mods.extraAsks; e++) slots.splice(1 + Math.floor(extra() * (slots.length - 1)), 0, "ask");
    // the cat, spread through the meeting (never first)
    var cats = Math.round(st.cats * mods.catCount);
    for (var c = 0; c < cats; c++) {
      var at = Math.round((c + 1) * slots.length / (cats + 1)) + c;
      slots.splice(Math.min(slots.length, Math.max(1, at)), 0, "cat");
    }
    // how long each one takes, then stretched to fill the meeting
    var catSpan = st.catTime * mods.catTime + CAT_STAY + 2.2;
    var dur = slots.map(function (k) {
      if (k === "cat") return catSpan;
      if (k === "round") return 9.5;
      if (k === "share") return 12;
      return st.gap;
    });
    var end = st.time + (st.overrun || 0) - 2.4;
    var total = dur.reduce(function (a, b) { return a + b; }, 0);
    var k = (end - T0) / total;
    var t = T0;
    var beats = [];
    slots.forEach(function (kind, i) {
      var d = dur[i] * k;
      var jitter = kind === "name" || kind === "ask" ? (rnd() - 0.5) * d * 0.3 : 0;
      var at0 = t + Math.max(0, jitter);
      var beat = { kind: kind, t: at0, done: false };
      if (kind === "name") beat.line = rpick(NAMES, rnd);
      if (kind === "ask") beat.line = rpick(ASKS, rnd);
      if (kind === "share") beat.line = SHARE_ASK;
      beat.who = speakerFor(st, rnd, kind);
      beats.push(beat);
      // something else in the gap: someone else's question, one to everyone,
      // or chatter. None of it is for you.
      if ((kind === "name" || kind === "ask") && d > 2.9) {
        var r = rnd(), filler;
        if (r < 0.32 && st.id !== "standup") {
          var dec = rpick(DECOYS.filter(function (x) { return castHas(st, x[1]); }), rnd);
          filler = dec ? { kind: "decoy", line: dec[0], target: dec[1], reply: dec[2] } : null;
        } else if (r < (st.id === "allhands" ? 0.75 : 0.55)) {
          filler = { kind: "everyone", line: rpick(EVERYONE, rnd) };
        }
        if (!filler) filler = { kind: "talk", line: rpick(TALK[st.talk], rnd) };
        filler.t = at0 + d * 0.62;
        filler.who = filler.kind === "decoy" ? speakerFor(st, rnd, "decoy", filler.target) : speakerFor(st, rnd, filler.kind);
        beats.push(filler);
      }
      t += d;
    });
    // the meeting opens with someone talking, and the last meeting overruns
    beats.push({ kind: "talk", t: 0.6, line: STARTS[run.stage], who: st.host });
    if (st.overrun) beats.push({ kind: "overrun", t: st.time - 0.2, line: OVERRUN, who: st.host });
    beats.sort(function (a, b) { return a.t - b.t; });

    // the spreadsheet: which box is empty in each row, and what's in the other
    var rows = [], rr = N.seeded(base + 2);
    var lastSide = 0, run2 = 0;
    for (var n = 0; n < 700; n++) {
      var side = rr() < 0.5 ? 0 : 1;
      if (side === lastSide) run2++; else run2 = 0;
      if (run2 >= 4) { side = 1 - side; run2 = 0; }   // never five the same way in a row
      lastSide = side;
      rows.push({ empty: side, text: rpick(FILLED, rr), state: "todo" });
    }
    var names = shuffle(SHEETS.slice(), N.seeded(base + 3));
    // emails: when they arrive, who from, about what
    var mails = [], mr = N.seeded(base + 4);
    var et = 4.5;
    var stop = st.time + (st.overrun || 0) - 1;
    while (et < stop) {
      mails.push({ t: et, from: rpick(FROM, mr), subject: rpick(SUBJECTS, mr) });
      et += lerp(st.email[0], st.email[1], et / st.time) * mods.emailGap * (0.85 + mr() * 0.3);
    }
    // the round: who's in it, and where you come
    var order = null;
    if (st.you.indexOf("round") >= 0) {
      var ro = N.seeded(base + 5);
      var folk = st.cast.filter(function (id) { return id !== "notes" && id !== "phone" && id !== "dave" && id !== st.host; });
      order = shuffle(folk, ro).slice(0, 5);
      order.splice(3, 0, "you");
      order = order.map(function (id) { return { id: id, word: id === "you" ? YEP : rpick(ROUND_WORDS, ro) }; });
    }
    return { beats: beats, rows: rows, names: names, mails: mails, round: order };
  }

  function castHas(st, id) { return st.cast.indexOf(id) >= 0; }

  function speakerFor(st, rnd, kind, target) {
    var pool = st.cast.filter(function (id) {
      return id !== "notes" && id !== "phone" && id !== "dave" && id !== target && !(st.id === "allhands" && id === "rupert" && kind === "talk" && false);
    });
    if (kind === "share" || kind === "round") return st.host;
    if (st.id === "email" && (kind === "talk")) return st.host;           // he's reading the email out
    if (st.id === "allhands" && (kind === "talk" || kind === "everyone")) return rnd() < 0.8 ? "rupert" : st.host;
    if (rnd() < 0.45) return st.host === target ? pool[0] : st.host;
    return rpick(pool, rnd);
  }

  function startStage() {
    var st = info();
    var p = plan(st);
    G = {
      time: 0, phase: "play", endT: 0,
      beats: p.beats, rows: p.rows, row: 0, sheetRow: 0, sheetNames: p.names, sheetIdx: 0, rowAnim: 0,
      mails: p.mails, mi: 0, roundOrder: p.round, round: null, share: null, overrun: false,
      open: null,           // the thing addressed to you right now
      queue: [],            // things addressed to you held back while you're sharing
      mic: { live: false, left: 0, max: 1, answered: false, heard: false, t: 0 },
      cam: { on: true, off: 0 },
      cat: null,
      stall: 0, wrongBox: -1, stamps: [], pops: [], bubbles: [], toasts: [], flights: [], fx: [],
      speaking: {}, gaze: null, tiles: [], volunteerAt: -9, chaseAt: -99, closedAt: -9,
      missed: 0, forgiven: 0, stageYeps: 0, stageNods: 0, stageVolunteered: 0, stageBoxes: 0, stageSheets: 0,
      briefed: false, hint: null, nod: 0, yepT: 0, flash: 0, seen: 0, lastPaste: 0, sheetFlash: 0
    };
    G.tiles = st.cast.map(function (id, i) {
      return { id: id, p: A.PEOPLE[id], i: i, gaze: { x: 0, y: 0 }, look: null, talk: 0, mood: null, moodT: 0,
               dark: 0, tunnel: 0, tunnelT: 3 + i, chew: 0, frame: 0 };
    });
    run.metCat = run.metCat || st.cats > 0;
    layout(true);
    paintHud();
  }

  // ---------------------------------------------------------------------------
  // Layout. Three shapes of screen:
  //   wide    desktop (4:3) and phones on their side: the call across the top,
  //           the sheet bottom left, your tile and the call's buttons bottom right
  //   square  a phone in the page: the same, squeezed
  //   tall    a phone full-window, and the clip frame: the call on top, then
  //           your tile and the inbox, then the sheet, then the buttons
  // ---------------------------------------------------------------------------
  function hudTop() {
    var base = root.getBoundingClientRect();
    var bottom = 0;
    Array.prototype.forEach.call(root.querySelectorAll(".kit-hud-tl, .kit-hud-tr, .kit-bar"), function (el) {
      var r = el.getBoundingClientRect();
      if (r.height && getComputedStyle(el).display !== "none") bottom = Math.max(bottom, r.bottom - base.top);
    });
    return bottom ? bottom + 6 : clamp(H * 0.12, 44, 76);
  }
  function padTop() {
    if (!padsOn()) return H;
    var base = root.getBoundingClientRect(), top = H;
    Array.prototype.forEach.call(root.querySelectorAll(".kit-pad"), function (el) {
      var r = el.getBoundingClientRect();
      if (r.height) top = Math.min(top, r.top - base.top);
    });
    return top < H ? top - 6 : H - 80;
  }

  function layout(force) {
    if (!G || !run) return;
    var top = hudTop();
    var touch = padsOn();
    if (!force && Math.abs(top - L.top) < 3 && L.W === W && L.H === H && L.touch === touch) return;
    L.top = top; L.W = W; L.H = H; L.touch = touch;
    var bottom = touch ? padTop() : H - 6;
    L.bottom = bottom;
    var ar = W / H;
    L.mode = ar >= 1.2 ? "wide" : H / W >= 1.15 ? "tall" : "square";
    var m = 6;
    var avail = bottom - top;
    if (L.mode === "tall") {
      var callH = Math.round(avail * 0.42);
      L.call = { x: m, y: top, w: W - m * 2, h: callH };
      var midY = top + callH + 8;
      var youW = Math.round(clamp(W * 0.5, 150, 300));
      var youH = Math.round(Math.min(youW / 1.32, avail * 0.24));
      youW = Math.round(Math.min(youW, youH * 1.5));
      L.you = { x: m, y: midY, w: youW, h: youH };
      // beside your tile: the call's buttons (drawn, for keys and mice), and
      // under them the inbox, which also sits in the sheet's title bar
      L.tools = touch ? null : { x: m + youW + 8, y: midY + youH - Math.min(56, youH * 0.5), w: W - m * 2 - youW - 8, h: Math.min(56, youH * 0.5) };
      L.side = { x: m + youW + 8, y: midY, w: W - m * 2 - youW - 8, h: L.tools ? youH - L.tools.h - 6 : youH };
      var sy = midY + youH + 8;
      L.sheet = { x: m, y: sy, w: W - m * 2, h: bottom - sy };
    } else {
      var callFrac = L.mode === "wide" ? 0.47 : 0.43;
      var ch = Math.round(avail * callFrac);
      L.call = { x: m, y: top, w: W - m * 2, h: ch };
      var by = top + ch + 8, bh = bottom - by;
      var sideW = Math.round(clamp(W * (L.mode === "wide" ? 0.36 : 0.4), 120, 420));
      L.sheet = { x: m, y: by, w: W - m * 3 - sideW, h: bh };
      var sx = L.sheet.x + L.sheet.w + m;
      var toolsH = touch ? 0 : Math.round(clamp(bh * 0.28, 40, 64));
      var yh = Math.round(Math.min(bh - toolsH - (toolsH ? 6 : 0), sideW / 1.25));
      var yw = Math.round(Math.min(sideW, yh * 1.6));
      L.you = { x: sx + (sideW - yw) / 2, y: by, w: yw, h: yh };
      L.tools = touch ? null : { x: sx, y: by + yh + 6, w: sideW, h: toolsH };
      L.side = null;
    }
    // the call's grid
    fitGrid();
    placeKitBits();
    A.init(T, DPR);
    bg = null;
  }

  function fitGrid() {
    var n = G.tiles.length, c = L.call;
    var best = null, gap = Math.max(4, Math.round(Math.min(W, H) * 0.012));
    for (var cols = 1; cols <= n; cols++) {
      var rows = Math.ceil(n / cols);
      var tw = (c.w - gap * (cols - 1)) / cols;
      var th = (c.h - gap * (rows - 1)) / rows;
      // video tiles: between 4:3 and 16:9
      if (tw / th > 1.78) tw = th * 1.78;
      if (tw / th < 1.25) th = tw / 1.25;
      var area = tw * th;
      if (!best || area > best.area) best = { cols: cols, rows: rows, tw: tw, th: th, area: area };
    }
    L.cols = best.cols; L.rows = best.rows;
    var tw2 = Math.floor(best.tw), th2 = Math.floor(best.th);
    var gw = best.cols * tw2 + (best.cols - 1) * gap, gh = best.rows * th2 + (best.rows - 1) * gap;
    var ox = c.x + (c.w - gw) / 2, oy = c.y + (c.h - gh) / 2;
    G.tiles.forEach(function (t, i) {
      var row = Math.floor(i / best.cols), col = i % best.cols;
      var inRow = row === best.rows - 1 ? n - row * best.cols : best.cols;
      var rowOx = c.x + (c.w - (inRow * tw2 + (inRow - 1) * gap)) / 2;
      t.x = Math.round(rowOx + col * (tw2 + gap));
      t.y = Math.round(oy + row * (th2 + gap));
      t.w = tw2; t.h = th2;
    });
    L.tileW = tw2; L.tileH = th2;
  }

  // The notice goes over the call (nobody's said anything yet), under where
  // the countdown's stamps land; the callouts land between the call and the
  // work, clear of your tile's badge
  function placeKitBits() {
    var brief = root.querySelector(".kit-brief");
    if (brief) {
      // the countdown: 7% (or 3.2rem) down, in a stamp sized by the page (kit.css)
      var rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      var font = clamp(window.innerWidth * 0.03 + 1.1 * rem, 2 * rem, 3.6 * rem);
      var countBottom = Math.max(H * 0.07, 3.2 * rem) + font * 1.9;
      brief.style.top = Math.round(Math.max(L.call.y + 6, Math.min(countBottom + 4, H * 0.45))) + "px";
      brief.style.bottom = "auto";
    }
    var cl = root.querySelector(".kit-callouts");
    if (cl) {
      cl.style.top = Math.round(L.call.y + L.call.h - 30) + "px";
      cl.style.bottom = "auto";
      cl.style.left = Math.round(L.call.x) + "px";
      cl.style.right = Math.round(W - L.call.x - L.call.w) + "px";
    }
  }

  // ---------------------------------------------------------------------------
  // The work: paste into the empty box
  // ---------------------------------------------------------------------------
  function curRow() { return G.rows[G.row]; }

  function paste(side, how) {
    if (G.phase !== "play") return;
    if (G.stall > 0) { sfx.busy(); return; }
    var r = curRow();
    if (!r) return;
    G.lastPaste = G.time;
    if (r.empty !== side) {
      // a full box: it stops responding
      G.stall = STALL * run.mods.stall;
      G.wrongBox = side;
      run.wrong++;
      run.streak = 0;
      sfx.wrong();
      shake(0.35);
      if (G.share) {
        loseRep("share", pick(SHARE_OOPS));
      } else if (run.wrong === 1 || Math.random() < 0.25) {
        say("Not responding", 1);
      }
      return;
    }
    r.state = "done";
    G.wrongBox = -1;
    var m0 = mult();
    run.streak++;
    run.bestStreak = Math.max(run.bestStreak, run.streak);
    var pts = Math.round(PTS.box * m0 * run.mods.boxPts);
    run.score += pts;
    run.boxes++;
    G.stageBoxes++;
    run.learned.paste = (run.learned.paste || 0) + 1;
    G.row++;
    G.sheetRow++;
    G.rowAnim = 1;
    sfx.paste(run.streak);
    if (mult() > m0) { say("Streak: x" + mult(), 1); sfx.streak(); }
    if (G.sheetRow >= SHEET_ROWS) saveSheet();
  }

  function saveSheet() {
    G.sheetRow = 0;
    G.sheetIdx++;
    run.sheets++;
    G.stageSheets++;
    var pts = Math.round(PTS.sheet * run.mods.sheetPts);
    run.score += pts;
    G.sheetFlash = 1;
    // the stamp lands on the title bar, clear of the rows you're reading
    var g = sheetGeom(), s = g.s;
    G.stamps.push({ x: s.x + s.w * 0.62, y: s.y + g.tb * 0.75, text: G.share ? "Saved. Shared" : "Saved", t: 0, life: 0.8, tilt: (Math.random() - 0.5) * 0.2, big: true });
    if (pts) G.pops.push({ x: s.x + s.w * 0.62, y: s.y + g.tb + g.fb * 0.5, text: "+" + pts, t: 0 });
    // and an email answered: it flies out of the inbox
    if (run.inbox > 0) {
      run.inbox--;
      var ib = inboxSpot();
      G.flights.push({ x0: ib.x, y0: ib.y, x1: ib.x + 40, y1: L.call.y + L.call.h * 0.3, t: 0, dur: 0.5 });
      if (run.inbox === 0 && !G.zeroSaid) { G.zeroSaid = true; say("Inbox zero", 2); sfx.zero(); }
    }
    sfx.save();
    if (G.share) { run.score += 100; speak(info().host, "Lovely. Thanks, Sam.", 1.6); }
  }

  // ---------------------------------------------------------------------------
  // The meeting: your tile's three buttons
  // ---------------------------------------------------------------------------
  function nod() {
    if (G.phase !== "play") return;
    G.nod = 1;
    sfx.nod();
    var o = G.open;
    if (o && o.kind === "name") { handled(o, "nod"); return; }
    if (o && (o.kind === "ask" || o.kind === "round" || o.kind === "share")) {
      if (!o.nodSaid) { o.nodSaid = true; speak(o.who, NOD_AT_ASK, 1.6); }
      return;
    }
    volunteer();
  }

  function mic() {
    if (G.phase !== "play") return;
    var m = G.mic;
    if (m.live) {
      // mute again
      m.live = false;
      sfx.mute();
      run.learned.mute = true;
      if (m.answered && m.left > 0) {
        run.score += PTS.muted;
        addStamp("Muted", 0.7);
      }
      m.answered = false;
      return;
    }
    m.live = true;
    m.heard = false;
    m.max = info().grace * run.mods.grace;
    m.left = m.max;
    m.t = 0;
    sfx.unmute();
    yep();
    var o = G.open;
    if (o && (o.kind === "ask" || o.kind === "round" || o.kind === "share")) { m.answered = true; handled(o, "yep"); return; }
    m.answered = false;
    volunteer();
  }

  function cam() {
    if (G.phase !== "play") return;
    var c = G.cam;
    c.on = !c.on;
    sfx.cam(c.on);
    if (!c.on) {
      c.off = 0;
      if (G.cat && !G.cat.seen && (G.cat.phase === "door" || G.cat.phase === "walk")) {
        // hidden, just in time
        run.learned.camOff = true;
      }
    } else {
      run.learned.camOn = true;
      if (G.cat && G.cat.phase === "desk" && !G.cat.seen) catSeen();
      else if (G.cat && G.cat.phase === "gone" && G.cat.hid && !G.cat.backPaid) {
        G.cat.backPaid = true;
        run.score += PTS.camBack;
      }
    }
  }

  function yep() {
    G.yepT = 1.2;
    sfx.yep();
    G.bubbles = G.bubbles.filter(function (b) { return b.who !== "you"; });
    G.bubbles.push({ who: "you", text: YEP, t: 0, life: 1.2 });
  }

  function volunteer() {
    if (G.time - G.volunteerAt < VOLUNTEER_GAP) return;
    G.volunteerAt = G.time;
    run.volunteered++;
    G.stageVolunteered++;
    speak(pick(info().cast.filter(function (id) { return id !== "notes" && id !== "phone" && id !== "dave"; })), pick(VOLUNTEER), 1.8);
    addStamp("Volunteered", 0.9);
    say("Volunteered", 1);
    addEmail({ from: "Graham", subject: "Action: Sam" }, true);
    lookAtYou(1.2);
  }

  // Something addressed to you, dealt with
  function handled(o, how) {
    o.state = "done";
    G.open = null;
    G.closedAt = G.time;
    var pts = 0, label = "";
    if (how === "nod") { pts = Math.round(PTS.nod * run.mods.nodPts); label = "Nodded"; run.nods++; G.stageNods++; run.learned.nod = true; }
    else {
      var fast = G.time - o.opened <= KEEN;
      pts = PTS.yep + (fast ? PTS.keen : 0);
      label = fast ? "Keen" : "Yep";
      run.yeps++;
      G.stageYeps++;
      run.learned.yep = true;
    }
    run.score += pts;
    addStamp(label, 0.75);
    if (pts) popAtYou("+" + pts);
    if (o.kind === "round") roundNext(0.9);
    if (o.kind === "share") startShare();
    // they carry on
    var tile = tileOf(o.who);
    if (tile) tile.look = null;
  }

  function missed(o) {
    o.state = "missed";
    G.open = null;
    G.closedAt = G.time;
    var line = o.kind === "name" ? pick(MISS_NAME) : pick(MISS_ASK);
    if (o.kind === "round") line = "Let's skip Sam.";
    if (o.kind === "share") line = "I'll share it myself.";
    loseRep(o.kind, line, o.who);
    if (o.kind === "round") roundNext(0.6);
  }

  function loseRep(why, line, who) {
    if (G.phase !== "play") return;
    if (run.mods.forgive && !G.forgiven && why !== "share") {
      G.forgiven = 1;
      speak(who || info().host, "Sorry, you broke up there.", 1.8);
      addStamp("Forgiven", 0.9);
      return;
    }
    run.rep = Math.max(0, run.rep - 1);
    run.missed++;
    G.missed++;
    G.flash = 1;
    shake(0.6);
    sfx.lose();
    if (line) speak(who || info().host, line, 2);
    addStamp(why === "cat" ? "Cat: seen" : why === "dish" ? "Heard" : why === "chase" ? "Unread" : why === "share" ? "Seen" : "Missed", 1);
    lookAtYou(1.6);
    paintHud();
    if (run.rep <= 0) removed();
  }

  // ---------------------------------------------------------------------------
  // Beats: things people say, on a timetable
  // ---------------------------------------------------------------------------
  function tickBeats() {
    for (var i = 0; i < G.beats.length; i++) {
      var b = G.beats[i];
      if (b.done || b.t > G.time) continue;
      // one thing at a time for you, with a breath between; nothing else
      // while you're sharing or they're going round. The cat waits for the
      // share and the round, and in the team meeting for whatever's open.
      var mine = b.kind === "name" || b.kind === "ask" || b.kind === "round" || b.kind === "share";
      var busy = mine && (G.share || G.open || G.round || G.time - G.closedAt < 0.9);
      if (b.kind === "cat") busy = G.share || G.round || G.cat || (run.stage < 2 && G.open);
      if (busy) { b.t = G.time + 0.3; continue; }
      b.done = true;
      fire(b);
    }
  }

  function fire(b) {
    var st = info();
    switch (b.kind) {
      case "name":
      case "ask":
      case "share": {
        var win = (b.kind === "name" ? st.nameWin * run.mods.nameWin : st.askWin * run.mods.askWin);
        G.open = { kind: b.kind, who: b.who, line: b.line, opened: G.time, deadline: G.time + win, win: win, state: "open" };
        speak(b.who, b.line, win + 0.3, true);
        lookAtYou(win);
        if (b.kind === "name") sfx.named(); else sfx.asked();
        // if you're already live, you just answer
        if (b.kind !== "name" && G.mic.live) { G.mic.answered = true; G.mic.left = G.mic.max; yep(); handled(G.open, "yep"); }
        break;
      }
      case "round":
        G.round = { order: G.roundOrder.slice(), i: -1, wait: 2.2 };
        speak(st.host, ROUND_ASK, 2.2);
        break;
      case "cat":
        startCat();
        break;
      case "decoy": {
        G.lastDecoy = G.time;
        speak(b.who, b.line, 1.8);
        var tile = tileOf(b.target);
        if (tile) {
          lookAtTile(tile, 1.4);
          if (b.reply) G.later = (G.later || []).concat([{ t: G.time + 1.1, who: b.target, line: b.reply }]);
          else tile.nodT = 0.8;
        }
        break;
      }
      case "everyone":
        G.lastDecoy = G.time;
        speak(b.who, b.line, 1.9);
        if (b.line === "Who's taking notes?" && castHas(st, "notes")) G.later = (G.later || []).concat([{ t: G.time + 1, who: "notes", line: "Recording." }]);
        else if (Math.random() < 0.5) {
          var someone = pick(st.cast.filter(function (id) { return id !== b.who && id !== "notes" && id !== "phone" && id !== "dave"; }));
          G.later = (G.later || []).concat([{ t: G.time + 1.2, who: someone, line: pick(["Yep.", "No.", "Fine.", "Nope.", "Mm."]) }]);
        }
        break;
      case "overrun":
        G.overrun = true;
        speak(b.who, b.line, 2);
        say("Overrunning", 2);
        break;
      default:
        speak(b.who, b.line, 1.8);
    }
  }

  // Going round the room, one word each
  function roundNext(delay) {
    if (!G.round) return;
    G.round.wait = delay;
  }
  function tickRound(dt) {
    var r = G.round;
    if (!r || G.open) return;
    r.wait -= dt;
    if (r.wait > 0) return;
    r.i++;
    if (r.i >= r.order.length) {
      G.round = null;
      speak(info().host, "Lovely. Thanks, all.", 1.6);
      return;
    }
    var who = r.order[r.i];
    if (who.id === "you") {
      var win = info().askWin * run.mods.askWin + 0.4;
      G.open = { kind: "round", who: info().host, line: "Sam?", opened: G.time, deadline: G.time + win, win: win, state: "open" };
      speak(info().host, "Sam?", win, true);
      lookAtYou(win);
      sfx.asked();
      if (G.mic.live) { G.mic.answered = true; G.mic.left = G.mic.max; yep(); handled(G.open, "yep"); }
      return;
    }
    speak(who.id, who.word, 1.1);
    var tile = tileOf(who.id);
    if (tile) lookAtTile(tile, 1.1);
    r.wait = 1.15;
  }
  function roundNextIsYou() {
    var r = G.round;
    if (!r) return false;
    var nx = r.order[r.i + 1];
    return !!(nx && nx.id === "you" && !G.open);
  }

  // Screen sharing: everyone can see your spreadsheet for a while
  function startShare() {
    G.share = { t: -0.5, dur: 8 };
    say("Screen: shared", 2);
    sfx.share();
  }
  function tickShare(dt) {
    var s = G.share;
    if (!s) return;
    s.t += dt;
    if (s.t > 2.5 && !s.said) { s.said = true; speak(pick(info().cast.filter(function (id) { return id !== "notes" && id !== info().host; })), pick(SHARE_LINES.slice(0, 1).concat(["Very colourful.", "Is that live?"])), 1.6); }
    if (s.t >= s.dur) {
      G.share = null;
      speak(info().host, SHARE_END, 1.8);
      sfx.unshare();
    }
  }

  // ---------------------------------------------------------------------------
  // The cat
  // ---------------------------------------------------------------------------
  function startCat() {
    var st = info();
    var walk = st.catTime * run.mods.catTime;
    G.cat = { phase: "door", t: 0, walk: walk, seen: false, hid: false, backPaid: false, dir: -1 };
    sfx.creak();
    run.metCat = true;
  }
  function tickCat(dt) {
    var c = G.cat;
    if (!c) return;
    c.t += dt;
    if (c.phase === "door" && c.t > c.walk * 0.32) { c.phase = "walk"; c.t2 = 0; sfx.meow(); }
    if (c.phase === "walk") {
      c.t2 = (c.t2 || 0) + dt;
      if (c.t >= c.walk) {
        c.phase = "desk";
        c.t3 = 0;
        sfx.thump();
        if (G.cam.on) catSeen();
        else {
          c.hid = true;
          run.hidden++;
          run.score += PTS.hidden;
          addStamp("Hidden", 0.9);
          popAtYou("+" + PTS.hidden);
        }
      }
    }
    if (c.phase === "desk") {
      c.t3 += dt;
      if (c.t3 >= CAT_STAY) { c.phase = "leave"; c.t4 = 0; }
    }
    if (c.phase === "leave") {
      c.t4 += dt;
      if (c.t4 >= 0.8) { c.phase = "gone"; c.goneT = 0; G.cam.off = 0; }
    }
    if (c.phase === "gone") {
      c.goneT += dt;
      // it's been and gone: once the camera's back on (or a moment after,
      // if it already was), it's over
      if (G.cam.on || c.goneT > 0.5) { if (G.cam.on) G.cat = null; }
    }
  }
  function catSeen() {
    var c = G.cat;
    if (!c || c.seen) return;
    c.seen = true;
    G.seen = 1.4;
    sfx.gasp();
    loseRep("cat", pick(CAT_SEEN), pick(info().cast.filter(function (id) { return id !== "notes" && id !== "phone" && id !== "dave"; })));
    say("Cat: seen", 2);
  }
  // the camera may only be off while the cat's about
  function catAbout() { return G.cat && G.cat.phase !== "gone"; }
  function tickCam(dt) {
    var c = G.cam;
    if (c.on) { c.off = 0; return; }
    if (catAbout()) { c.off = 0; return; }
    c.off += dt;
    if (c.off >= CAM_GRACE) {
      c.off = -0.6;    // they'll ask again a bit later
      loseRep("cam", pick(CAM_LONG));
      if (G.cat && G.cat.phase === "gone") G.cat = null;
    }
  }

  // ---------------------------------------------------------------------------
  // The mic: live after you speak, and the dishwasher's going
  // ---------------------------------------------------------------------------
  function tickMic(dt) {
    var m = G.mic;
    if (!m.live) return;
    m.t += dt;
    m.left -= dt;
    if (m.left <= 0 && !m.heard) {
      m.heard = true;
      m.live = false;
      m.answered = false;
      G.suds = 1.6;
      loseRep("dish", pick(DISH));
      say("Host muted you", 2);
      sfx.hostMute();
    }
  }

  // ---------------------------------------------------------------------------
  // Emails
  // ---------------------------------------------------------------------------
  function tickMail() {
    while (G.mi < G.mails.length && G.mails[G.mi].t <= G.time) addEmail(G.mails[G.mi++]);
  }
  function addEmail(mail, quiet) {
    if (run.inbox >= INBOX_MAX) {
      if (G.time - G.chaseAt >= CHASE_GAP) {
        G.chaseAt = G.time;
        var from = mail.from === "Notetaker" ? "Graham" : mail.from;
        var who = info().cast.filter(function (id) { return A.PEOPLE[id].name.indexOf(from) === 0; })[0] || info().host;
        loseRep("chase", pick(CHASE), who);
        say("Inbox: full", 2);
      }
      return;
    }
    run.inbox++;
    G.zeroSaid = false;
    G.toasts.push({ from: mail.from, subject: mail.subject, t: 0 });
    if (G.toasts.length > 2) G.toasts.shift();
    var ib = inboxSpot();
    G.flights.push({ x0: W + 20, y0: ib.y - 30, x1: ib.x, y1: ib.y, t: 0, dur: 0.45, inbound: true });
    if (!quiet) sfx.mail();
  }

  // ---------------------------------------------------------------------------
  // The end of a meeting, the end of the day, and being removed
  // ---------------------------------------------------------------------------
  function endStage() {
    if (G.phase !== "play") return;
    G.phase = "clear";
    G.endT = 0;
    G.open = null;
    G.round = null;
    G.share = null;
    if (G.cat && G.cat.phase !== "desk") G.cat = null;
    G.mic.live = false;
    var st = info();
    speak(st.host, ENDS[run.stage], 2.4);
    sfx.leave();
    var n = run.stage + 1;
    var repBonus = 100 * run.rep * n;
    var zero = run.inbox === 0 ? 250 * n : 0;
    run.score += repBonus + zero;
    var back = false;
    if (G.missed === 0 && run.rep < REP_MAX) { run.rep++; back = true; }
    paintHud();
    if (run.stage === LAST) { endDay(); return; }
    var offers = offer();
    var next = run.stage + 1;
    var stamp = G.missed === 0 ? "Approved" : G.missed <= 1 ? "Pending review" : "Not approved";
    var stats = [
      { label: "Boxes", value: String(G.stageBoxes) },
      { label: "Inbox", value: run.inbox + "/" + INBOX_MAX },
      { label: "Reputation", value: run.rep + "/" + REP_MAX + (back ? " (+1)" : "") },
      { label: "Bonus", value: "+" + fmt(repBonus + zero) },
      { label: "Score", value: fmt(run.score) }
    ];
    var ns = STAGES[next];
    shell.interlude({
      stamp: stamp,
      tilt: stamp === "Approved" ? -5 : 4,
      heading: ["Stand-up over.", "Meeting over.", "All-hands over."][run.stage] || "Meeting over.",
      line: summary(),
      stats: stats,
      ask: "Next: " + ns.name.charAt(0).toLowerCase() + ns.name.slice(1) + ", " + clockAt(ns.start) + ". Before it starts:",
      choices: offers.map(function (o) { return { label: o.label, detail: o.detail }; }),
      delay: 1700
    }).then(function (i) {
      var o = offers[i] || offers[0];
      if (o) { run.taken.push(o.id); o.apply(run.mods); }
      run.stage = next;
      startStage();
      shell.next();
    });
  }

  // The notetaker's summary of the meeting
  function summary() {
    var y = G.stageYeps, v = G.stageVolunteered;
    var said = y === 0 ? "Sam said nothing" : y === 1 ? "Sam said yep" : "Sam said yep " + ["", "", "twice", "three times", "four times", "five times"][Math.min(y, 5)] + (y > 5 ? " or more" : "");
    var acts = v === 0 ? "No action points" : v === 1 ? "One action point, Sam's" : v + " action points, all Sam's";
    return "The notetaker's summary: " + said + ". " + acts + ".";
  }

  // Three of the ways to get through the next one, from the run's seed.
  // Nothing about the cat before you've met it.
  function offer() {
    var rnd = N.seeded(shell.seed + 7000 + 1000 * run.stage);
    var pool = OFFERS.filter(function (o) {
      return run.taken.indexOf(o.id) < 0 && !(o.cat && run.stage < 1) && (!o.ok || o.ok());
    });
    var out = [];
    while (out.length < 3 && pool.length) out.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
    return out;
  }

  function endDay() {
    G.phase = "done";
    run.score += PTS.survive;
    end(true);
  }

  function removed() {
    if (G.phase !== "play") return;
    G.phase = "removed";
    G.endT = 0;
    run.removed = true;
    run.removedAt = clockText();
    G.open = null;
    G.round = null;
    G.share = null;
    G.mic.live = false;
    say("Removed from the meeting", 3);
    sfx.removed();
    shake(1);
    end(false);
  }

  function end(survived) {
    var rank = survived ? (run.rep >= 4 && run.score >= APPROVED ? 1 : 2) : (run.stage >= 2 ? 3 : 4);
    var stamp = ["Approved", "Pending review", "Not approved", "Rejected"][rank - 1];
    var score = Math.round(run.score);
    var rec = shell.record(score);
    var where = ["the stand-up", "the team meeting", "the all-hands", "the last meeting"][run.stage];
    var stats = [
      { label: "Score", value: fmt(score) },
      { label: "Boxes", value: String(run.boxes) },
      { label: survived ? "Reputation" : "Missed", value: survived ? run.rep + "/" + REP_MAX : String(run.missed) },
      { label: rec.isNew ? (shell.daily ? "New best today" : "New best") : shell.daily ? "Today's best" : "Best",
        value: fmt(rec.best || 0), highlight: rec.isNew }
    ];
    shell.finish({
      place: rank,
      total: 4,
      stamp: stamp,
      heading: survived ? "You got through four meetings." : "Removed from " + where + " at " + run.removedAt + ".",
      line: RESULT_LINES[rank - 1],
      stats: stats,
      share: fmt(score) + " points, " + (survived ? "four meetings survived" : "removed from " + where) + ", " + run.boxes + " boxes pasted",
      delay: survived ? 2400 : 2600
    });
  }

  // ---------------------------------------------------------------------------
  // Every frame
  // ---------------------------------------------------------------------------
  function update(dt, input) {
    var st = shell.state();
    if (!G || (st !== "playing" && st !== "ending" && st !== "results")) return;
    if (G.phase === "play" && st === "playing") {
      G.time += dt;
      controls(input);
      if (AUTOPILOT) autopilot(dt);
      if (DEBUG && window.__onMute && window.__onMute.onTick) window.__onMute.onTick(dt);
      if (G.stall > 0) G.stall = Math.max(0, G.stall - dt);
      tickBeats();
      tickRound(dt);
      tickShare(dt);
      tickCat(dt);
      tickCam(dt);
      tickMic(dt);
      tickMail();
      if (G.later) {
        G.later = G.later.filter(function (l) { if (l.t <= G.time) { speak(l.who, l.line, 1.3); return false; } return true; });
      }
      if (G.open && G.time >= G.open.deadline) missed(G.open);
      if (G.phase === "play" && G.time >= info().time + (info().overrun || 0)) endStage();
    } else {
      G.endT += dt;
      if (G.cat) tickCat(dt);
    }
    tickFx(dt);
    pickHint();
    if (st !== "results") paintHud();
  }

  function tickFx(dt) {
    G.stamps = G.stamps.filter(function (s) { s.t += dt; return s.t < s.life; });
    G.pops = G.pops.filter(function (p) { p.t += dt; return p.t < 0.9; });
    G.toasts = G.toasts.filter(function (p) { p.t += dt; return p.t < 2.4; });
    G.flights = G.flights.filter(function (f) { f.t += dt / f.dur; return f.t < 1; });
    G.fx = G.fx.filter(function (p) { p.t += dt; return p.t < p.life; });
    G.bubbles = G.bubbles.filter(function (b) { b.t += dt; return b.t < b.life; });
    if (G.rowAnim > 0) G.rowAnim = Math.max(0, G.rowAnim - dt * 9);
    if (G.nod > 0) G.nod = Math.max(0, G.nod - dt * 1.9);
    if (G.yepT > 0) G.yepT -= dt;
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 1.6);
    if (G.seen > 0) G.seen -= dt;
    if (G.suds > 0) G.suds -= dt;
    if (G.sheetFlash > 0) G.sheetFlash = Math.max(0, G.sheetFlash - dt * 3);
    if (shakeAmt > 0) shakeAmt = Math.max(0, shakeAmt - dt * 3);
    if (G.gaze && (G.gaze.t -= dt) <= 0) G.gaze = null;
    G.tiles.forEach(function (t) {
      if (t.lookT > 0 && (t.lookT -= dt) <= 0) t.look = null;
      if (t.nodT > 0) t.nodT -= dt;
      if (t.p.id === "keith") {
        t.tunnelT -= dt;
        if (t.tunnelT <= 0) { t.tunnelOn = !t.tunnelOn; t.tunnelT = t.tunnelOn ? 1.6 : 5 + Math.random() * 4; }
        t.tunnel = clamp(t.tunnel + (t.tunnelOn ? dt * 5 : -dt * 5), 0, 1);
      }
      if (t.p.sandwich) {
        t.chewT = (t.chewT || 4) - dt;
        if (t.chewT <= 0) { t.chewing = !t.chewing; t.chewT = t.chewing ? 2.5 : 5 + Math.random() * 5; }
      }
      if (G.phase === "clear") t.dark = clamp((G.endT - 0.4 - t.i * 0.12) * 4, 0, 1);
      if (G.phase === "removed") t.dark = clamp((G.endT - 0.2) * 3, 0, 1);
    });
    // the dishwasher's hum while you're live
    if (G.mic.live && G.phase === "play") {
      hum.t -= dt;
      if (hum.t <= 0) { hum.t = 0.16; sfx.hum(1 - G.mic.left / G.mic.max); }
    }
  }

  function addStamp(text, life) {
    var y = L.you;
    G.stamps.push({ x: y.x + y.w * 0.5, y: y.y + y.h * 0.62, text: text, t: 0, life: life || 0.8, tilt: (Math.random() - 0.5) * 0.24 });
  }
  function popAtYou(text) {
    var y = L.you;
    G.pops.push({ x: y.x + y.w * 0.5, y: y.y + y.h * 0.36, text: text, t: 0 });
  }

  // Someone says something: a bubble from their tile, and their mouth moves
  function speak(who, text, life, toYou) {
    if (!who || !text) return;
    G.bubbles = G.bubbles.filter(function (b) { return b.who !== who; });
    var max = W < 480 ? 2 : 3;
    while (G.bubbles.filter(function (b) { return b.who !== "you"; }).length >= max) {
      var drop = -1;
      for (var i = 0; i < G.bubbles.length; i++) if (G.bubbles[i].who !== "you" && !G.bubbles[i].toYou) { drop = i; break; }
      if (drop < 0) for (var j = 0; j < G.bubbles.length; j++) if (G.bubbles[j].who !== "you") { drop = j; break; }
      if (drop < 0) break;
      G.bubbles.splice(drop, 1);
    }
    G.bubbles.push({ who: who, text: text, t: 0, life: life || 1.8, toYou: !!toYou });
    G.speaking[who] = Math.min(life || 1.8, 0.35 + text.length * 0.045);
    sfx.voice(who, text);
  }

  function tileOf(id) {
    for (var i = 0; i < G.tiles.length; i++) if (G.tiles[i].id === id) return G.tiles[i];
    return null;
  }
  function lookAtYou(t) { G.gaze = { target: "you", t: t }; }
  function lookAtTile(tile, t) { G.gaze = { target: tile, t: t }; }

  // Callouts: one at a time, the important ones win
  function say(text, priority) {
    if (!shell || (shell.state() !== "playing" && priority < 3)) return;
    var now = performance.now() / 1000;
    if (now - calloutAt < 1.5 && priority <= calloutPri) return;
    calloutAt = now;
    calloutPri = priority;
    placeKitBits();
    shell.callout(text, { sound: priority >= 2 });
  }

  function shake(amount) {
    if (shell.reduceMotion) return;
    shakeAmt = Math.max(shakeAmt, amount);
  }

  function clockAt(mins) {
    var h = Math.floor(mins / 60), m = Math.floor(mins % 60);
    return (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m;
  }
  function clockText() {
    if (!G || !run) return "09:00";
    var st = info();
    return clockAt(st.start + G.time / st.time * st.mins);
  }

  // ---------------------------------------------------------------------------
  // Controls
  // ---------------------------------------------------------------------------
  function edge(input, k) { var on = !!input[k] && !prev[k]; prev[k] = !!input[k]; return on; }
  function controls(input) {
    var l = edge(input, "left"), r = edge(input, "right");
    var n = edge(input, "nod"), mc = edge(input, "mic"), c = edge(input, "cam");
    if (AUTOPILOT) return;
    if (l || r || n || mc || c) { if (input.mode === "keys" || input.mode === "pad") pointerMode = input.mode; }
    if (l && !r) paste(0, "key");
    else if (r && !l) paste(1, "key");
    else if (l && r) paste(curRow() && curRow().empty === 0 ? 1 : 0, "key");   // both at once: one of them is wrong
    if (n) nod();
    if (mc) mic();
    if (c) cam();
  }

  // ---------------------------------------------------------------------------
  // The autopilot: plays like a good player, with a human-ish reaction time
  // ---------------------------------------------------------------------------
  function autopilot(dt) {
    auto.work -= dt;
    auto.react -= dt;
    auto.mute -= dt;
    auto.cam -= dt;
    var o = G.open;
    var busy = false;
    if (o) {
      if (auto.target !== o) { auto.target = o; auto.react = (0.32 + Math.random() * 0.28) / SKILL; }
      busy = true;
      if (auto.react <= 0) {
        if (o.kind === "name") nod(); else mic();
        auto.work = 0.15 + Math.random() * 0.1;
        auto.mute = (0.45 + Math.random() * 0.45) / SKILL;
      }
    }
    if (G.mic.live && !o && auto.mute <= 0) { mic(); auto.work = 0.12; }
    var c = G.cat;
    if (c && G.cam.on && (c.phase === "door" || c.phase === "walk")) {
      if (auto.camFor !== c) { auto.camFor = c; auto.cam = (0.4 + Math.random() * 0.45 + (N.flags.clip && Math.random() < 0.3 ? 2.2 : 0)) / SKILL; }
      if (auto.cam <= 0) { cam(); auto.work = 0.12; }
    }
    if (!G.cam.on && (!c || c.phase === "gone")) {
      if (auto.camBack !== c || auto.camBackSet === undefined) { auto.camBack = c; auto.camBackSet = true; auto.cam = Math.max(auto.cam, (0.35 + Math.random() * 0.4) / SKILL); }
      if (auto.cam <= 0) { cam(); auto.camBackSet = undefined; auto.work = 0.12; }
    }
    if (busy && auto.react < 0.25) return;
    if (auto.work <= 0 && G.stall <= 0) {
      var row = curRow();
      if (row) {
        var careful = G.share ? 0 : 0.03;
        var side = Math.random() < careful ? 1 - row.empty : row.empty;
        paste(side, "auto");
      }
      auto.work = (0.25 + Math.random() * 0.1 + (G.share ? 0.12 : 0)) / SKILL;
    }
  }

  // The one thing worth pointing at right now (DESIGN.md, section 10)
  function pickHint() {
    G.hint = null;
    if (G.phase !== "play" || shell.state() !== "playing" || AUTOPILOT) return;
    var touch = touching(), keys = !touch && pointerMode !== "mouse";
    var o = G.open;
    if (o && o.kind === "name" && !run.learned.nod) {
      G.hint = { at: "nod", word: touch ? "Tap Nod" : keys ? "Nod: N" : "Nod" };
      return;
    }
    if (o && o.kind !== "name" && !run.learned.yep) {
      G.hint = { at: "mic", word: touch ? "Tap Mic" : keys ? "Unmute: Space" : "Unmute" };
      return;
    }
    if (G.mic.live && G.mic.answered && !run.learned.mute) {
      G.hint = { at: "mic", word: touch ? "Mute: tap Mic" : keys ? "Mute: Space" : "Mute" };
      return;
    }
    if (G.cat && G.cam.on && (G.cat.phase === "door" || G.cat.phase === "walk") && !run.learned.camOff) {
      G.hint = { at: "cam", word: touch ? "Tap Cam" : keys ? "Camera off: C" : "Camera off" };
      return;
    }
    if (!G.cam.on && (!G.cat || G.cat.phase === "gone") && !run.learned.camOn) {
      G.hint = { at: "cam", word: touch ? "Camera on: Cam" : keys ? "Camera on: C" : "Camera on" };
      return;
    }
    if ((run.learned.paste || 0) < 4 && G.stall <= 0 && curRow()) {
      var side = curRow().empty;
      G.hint = { at: "box", side: side, word: touch ? "Tap" : keys ? (side ? "Right" : "Left") : "Click" };
    }
  }

  // The meeting's notice: what's new, and what to do about it
  function notice() {
    var touch = touching(), text;
    if (run.stage === 0) {
      text = touch ? "Tap the empty box in each row. Someone says your name: Nod. Someone asks you something: Mic, then Mic again to mute."
        : "Paste into the empty box: left or right. Someone says your name: nod (N). Someone asks you something: unmute (Space), then mute again.";
    } else if (run.stage === 1) {
      text = "The cat has found out you're on a call. When the door opens, " + (touch ? "camera off (Cam)" : "camera off (C)") +
        " before it reaches the desk. Back on once it's gone.";
    } else if (run.stage === 2) {
      text = "Questions to everyone aren't for you: only answer your name. Then they'll go round the room, one word each. When it gets to you, unmute.";
    } else {
      text = "Graham is reading out an email. He'll ask you to share your screen: say yep, then don't paste into a full box while everyone's watching.";
    }
    shell.brief({ title: info().name, text: text, ms: run.stage === 0 ? 6200 : 5600 });
  }

  // ---------------------------------------------------------------------------
  // HUD: the meeting and its clock top left, with your reputation; the score
  // top right
  // ---------------------------------------------------------------------------
  function buildHud() {
    var pips = "";
    for (var i = 0; i < REP_MAX; i++) pips += '<span class="om-pip"></span>';
    shell.hud.innerHTML =
      '<div class="kit-hud-tl">' +
        '<p class="kit-stat"><small>Meeting</small><span data-stage>1/4</span></p>' +
        '<p class="om-line"><span class="kit-mono" data-clock>09:00</span>' +
        '<span class="kit-stat om-rep" data-rep><small>Reputation</small><span class="om-pips">' + pips + '</span></span></p>' +
      '</div>' +
      '<div class="kit-hud-tr">' +
        '<p class="kit-stat kit-stat-big"><span data-score>0</span><small data-mult></small></p>' +
      '</div>';
    hudEls = {};
    ["stage", "clock", "rep", "score", "mult"].forEach(function (k) { hudEls[k] = shell.hud.querySelector("[data-" + k + "]"); });
    hudEls.pips = shell.hud.querySelectorAll(".om-pip");
    hudEls.repWas = REP_MAX;
  }
  function setText(node, text) { if (node && node.textContent !== text) node.textContent = text; }
  function paintHud() {
    if (!hudEls || !run) return;
    setText(hudEls.stage, (run.stage + 1) + "/4");
    setText(hudEls.clock, clockText());
    setText(hudEls.score, fmt(run.score));
    setText(hudEls.mult, mult() > 1 ? "x" + mult() : "");
    Array.prototype.forEach.call(hudEls.pips, function (p, i) {
      var on = i < run.rep;
      if (p.classList.contains("is-on") !== on) {
        p.classList.toggle("is-on", on);
        if (!on && hudEls.repWas > run.rep) { p.classList.remove("is-lost"); void p.offsetWidth; p.classList.add("is-lost"); }
      }
    });
    hudEls.repWas = run.rep;
    if (hudEls.rep) hudEls.rep.setAttribute("aria-label", "Reputation " + run.rep + " of " + REP_MAX);
    // the touch buttons say what they'll do
    var pads = root.querySelectorAll(".kit-pad");
    Array.prototype.forEach.call(pads, function (pad) {
      var k = pad.getAttribute("data-key");
      if (k === "mic") pad.classList.toggle("om-live", !!(G && G.mic.live));
      if (k === "cam") pad.classList.toggle("om-off", !!(G && !G.cam.on));
      if (k === "mic" || k === "nod" || k === "cam") {
        var want = G && G.open ? (k === "nod" ? G.open.kind === "name" : k === "mic" ? G.open.kind !== "name" : false) : false;
        if (k === "cam" && G && G.cat && G.cam.on && (G.cat.phase === "door" || G.cat.phase === "walk")) want = true;
        pad.classList.toggle("om-call", !!want && run.learned && !run.learned[k === "nod" ? "nod" : k === "mic" ? "yep" : "camOff"]);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Drawing
  // ---------------------------------------------------------------------------
  function resize(w, h, dpr) {
    W = w; H = h; DPR = dpr;
    ctx = (shell ? shell.canvas : root.querySelector("canvas")).getContext("2d");
    if (T) { A.init(T, DPR); A.flush(); layout(true); }
    bg = null;
  }

  function render(dt) {
    if (!ctx || !G || !run) return;
    var st = shell.state();
    if (!hudEls) { buildHud(); paintHud(); }
    if (st === "countdown" && ++layoutAge > 8) { layoutAge = 0; layout(false); }
    else if (L.touch !== padsOn()) layout(true);
    if (!G.briefed && (st === "countdown" || st === "playing")) { G.briefed = true; notice(); }
    var c = ctx;
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    c.fillStyle = T.ink;
    c.fillRect(0, 0, W, H);
    var sx = 0, sy = 0;
    if (shakeAmt > 0) { sx = (Math.random() - 0.5) * 7 * shakeAmt; sy = (Math.random() - 0.5) * 7 * shakeAmt; }
    c.setTransform(DPR, 0, 0, DPR, sx * DPR, sy * DPR);
    var now = G.time + G.endT;
    G.tiles.forEach(function (t) { drawTile(c, t, now); });
    drawYou(c, now);
    if (L.tools) drawTools(c);
    if (L.side) drawSide(c);
    drawSheet(c, now);
    drawShareBanner(c);
    drawFlights(c);
    drawStamps(c);
    drawPops(c);
    var arrowBox = hintBox();
    drawBubbles(c, arrowBox);
    drawHint(c);
    if (G.phase === "removed") drawRemoved(c);
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (G.speaking) Object.keys(G.speaking).forEach(function (k) { G.speaking[k] -= dt || 0; if (G.speaking[k] <= 0) delete G.speaking[k]; });
  }

  // A tile: the room and the person (cached), the face (live), the name tag
  function drawTile(c, t, now) {
    var x = t.x, y = t.y, w = t.w, h = t.h;
    c.save();
    A.rr(c, x, y, w, h, 6);
    c.clip();
    var sprite = A.tileSprite(t.p, w, h);
    c.drawImage(sprite, x, y, w, h);
    var k = h / 100;
    c.save();
    c.translate(x + w / 2, y);
    c.scale(k, k);
    var f = faceFor(t, now);
    A.person(c, t.p, f, now, w / k);
    c.restore();
    if (t.dark > 0) {
      c.fillStyle = T.ink;
      c.globalAlpha = t.dark;
      c.fillRect(x, y, w, h);
      c.globalAlpha = 1;
      if (t.dark > 0.8 && w > 80) {
        c.font = Math.max(12, Math.round(h * 0.11)) + "px " + T.display;
        c.fillStyle = T.paper;
        c.textAlign = "center";
        c.textBaseline = "middle";
        A.text(c, "LEFT", x + w / 2, y + h / 2, Math.max(12, Math.round(h * 0.11)));
      }
    }
    c.restore();
    // the frame: violet for whoever's talking
    var talking = !!G.speaking[t.id] || (G.round && G.round.order[G.round.i] && G.round.order[G.round.i].id === t.id);
    A.rr(c, x, y, w, h, 6);
    c.lineWidth = talking ? 3.5 : 1.5;
    c.strokeStyle = talking ? T.accent : T.ash;
    c.stroke();
    // a tile too small for a name tag gets just its mic
    if (w >= 84 && h >= 52) nameTag(c, x + 4, y + h - 4, t.p.name, !!G.speaking[t.id], Math.min(w - 8, 220), t.p.special === "bot");
    else micTag(c, x + 3, y + h - 3, !!G.speaking[t.id]);
    if (t.p.special === "frozen" && w > 130) chip(c, x + w - 4, y + 4, "Poor connection", "right");
    if (t.p.special === "bot" && w > 100) chip(c, x + w - 4, y + 4, "Recording", "right", T.red);
  }

  function faceFor(t, now) {
    var f = { mood: "idle", gx: 0, gy: 0.2, talk: 0 };
    var g = G.gaze;
    var target = null;
    if (g && g.target === "you") target = { x: L.you.x + L.you.w / 2, y: L.you.y + L.you.h * 0.4 };
    else if (g && g.target && g.target !== t) target = { x: g.target.x + g.target.w / 2, y: g.target.y + g.target.h * 0.4 };
    if (G.share) target = { x: L.sheet.x + L.sheet.w / 2, y: L.sheet.y + L.sheet.h / 2 };
    if (target) {
      var cx = t.x + t.w / 2, cy = t.y + t.h * 0.5;
      var dx = target.x - cx, dy = target.y - cy, d = Math.hypot(dx, dy) || 1;
      f.gx = dx / d; f.gy = dy / d * 0.9;
    } else {
      // idle: looking at their own screen, a bit off to one side
      f.gx = Math.sin(now * 0.3 + t.i * 1.7) * 0.35;
      f.gy = 0.35;
    }
    if (G.speaking[t.id]) { f.mood = "talk"; f.talk = Math.sin(now * 15 + t.i); }
    if (t.p.sandwich && t.chewing && !G.speaking[t.id]) { f.mood = "chew"; f.talk = Math.sin(now * 9); }
    if (t.p.special === "frozen") { f.mood = "sleep"; f.gx = 0; f.gy = 0; }
    if (G.seen > 0 && t.p.special !== "frozen") f.mood = "shock";
    if (G.phase === "removed") f.mood = "shock";
    if (t.p.id === "keith") f.tunnel = t.tunnel;
    return f;
  }

  // A name tag in a tile's corner: ink, paper words, a mic. bg: another
  // colour behind it (yours, while you're live). Returns where it went.
  function nameTag(c, x, y, name, live, maxW, rec, bg) {
    var size = tagSize();
    c.font = size + "px " + T.display;
    var label = name.toUpperCase();
    var tw = A.textWidth(c, label, size);
    var icon = size * 1.05;
    var w = Math.min(maxW, tw + icon + size * 1.3), h = size * 1.6;
    if (tw + icon + size * 1.3 > maxW) {
      // too long for the tile: the bit in brackets goes
      label = name.replace(/\s*\(.*\)$/, "").toUpperCase();
      tw = A.textWidth(c, label, size);
      w = Math.min(maxW, tw + icon + size * 1.3);
    }
    if (tw + icon + size * 1.3 > maxW + 1) { icon = 0; w = Math.min(maxW, tw + size * 0.9); }
    A.rr(c, x, y - h, w, h, 3);
    c.fillStyle = bg || T.ink;
    c.fill();
    if (bg) { c.lineWidth = 1.5; c.strokeStyle = T.paper; c.stroke(); }
    if (icon) A.micIcon(c, x + size * 0.45 + icon / 2, y - h / 2, icon, live, bg ? T.paper : live ? T.accent : T.paper);
    c.save();
    c.beginPath();
    c.rect(x, y - h, w - 3, h);
    c.clip();
    c.fillStyle = T.paper;
    c.textAlign = "left";
    c.textBaseline = "middle";
    A.text(c, label, x + (icon ? icon + size * 0.75 : size * 0.45), y - h / 2 + size * 0.06, size);
    c.restore();
    return { x: x, y: y - h, w: w, h: h, icon: icon ? { x: x + size * 0.45 + icon / 2, y: y - h / 2, r: icon * 0.75 } : null };
  }
  function micTag(c, x, y, live) {
    var s = 18;
    A.rr(c, x, y - s, s, s, 3);
    c.fillStyle = T.ink;
    c.fill();
    A.micIcon(c, x + s / 2, y - s / 2, 13, live, live ? T.accent : T.paper);
  }
  function tagSize() { return N.flags.clip ? 13 : W < 480 ? 12 : clamp(Math.round(L.tileH * 0.085), 12, 15); }

  function chip(c, x, y, label, align, colour) {
    var size = 12;
    c.font = size + "px " + T.display;
    var tw = A.textWidth(c, label.toUpperCase(), size), w = tw + size * 0.9, h = size * 1.5;
    var x0 = align === "right" ? x - w : x;
    A.rr(c, x0, y, w, h, 3);
    c.fillStyle = colour || T.ink;
    c.fill();
    c.fillStyle = T.paper;
    c.textAlign = "left";
    c.textBaseline = "middle";
    A.text(c, label.toUpperCase(), x0 + size * 0.45, y + h / 2 + size * 0.06, size);
  }

  // Sam is sharing: tape across the top of the sheet
  function drawShareBanner(c) {
    if (!G.share) return;
    var s = L.sheet;
    var size = W < 480 ? 12 : 14;
    var h = size * 1.7, y = s.y + 2;
    c.save();
    c.translate(s.x + s.w / 2, y + h / 2);
    c.rotate(-0.02);
    var w = s.w * 0.96;
    c.fillStyle = T.red;
    c.fillRect(-w / 2, -h / 2, w, h);
    c.fillStyle = T.ink;
    c.fillRect(-w / 2, -h / 2 - 1.5, w, 1.5);
    c.fillRect(-w / 2, h / 2, w, 1.5);
    c.font = size + "px " + T.display;
    c.textAlign = "left";
    c.textBaseline = "middle";
    var label = "EVERYONE CAN SEE THIS", at = -w / 2 + 8;
    var lw = A.textWidth(c, label, size), star = c.measureText("*").width;
    c.beginPath();
    c.rect(-w / 2, -h / 2, w, h);
    c.clip();
    while (at < w / 2) {
      c.fillStyle = T.paper;
      A.text(c, label, at, size * 0.06, size);
      at += lw + size * 0.6;
      c.fillStyle = T.ink;
      c.fillText("*", at, size * 0.12);
      at += star + size * 0.6;
    }
    c.restore();
  }

  // ---------------------------------------------------------------------------
  // Your tile: your kitchen, you, the dishwasher, the cat, and the badge
  // that says what they want
  // ---------------------------------------------------------------------------
  function drawYou(c, now) {
    var r = L.you, x = r.x, y = r.y, w = r.w, h = r.h;
    var k = h / 100, ww = w / k;
    c.save();
    A.rr(c, x, y, w, h, 7);
    c.clip();
    c.save();
    c.translate(x + w / 2, y);
    c.scale(k, k);
    var cat = G.cat;
    var door = 0;
    if (cat) {
      if (cat.phase === "door") door = clamp(cat.t / (cat.walk * 0.2), 0, 1);
      else if (cat.phase === "walk") door = 1;
      else if (cat.phase === "desk" || cat.phase === "leave") door = 1 - clamp((cat.t3 || 0) / 1.5, 0, 0.6);
    }
    var live = G.mic.live;
    var shakeD = live ? 0.4 + 0.6 * (1 - G.mic.left / G.mic.max) : 0;
    if (G.suds > 0) shakeD = 1;
    if (shell.reduceMotion) shakeD = Math.min(shakeD, 0.001) ? 0.001 : 0;
    A.yourRoom(c, ww, { door: door, shake: live || G.suds > 0 ? Math.max(0.3, shakeD) : 0, suds: G.suds > 0 ? clamp(G.suds, 0, 1) : 0, t: shell.reduceMotion ? 0 : now });
    // the cat's eyes in the doorway are behind you; once it's out of the
    // door it's coming towards the camera, so it's in front
    var catFront = cat && (cat.phase === "walk" || cat.phase === "desk" || cat.phase === "leave");
    if (cat && !catFront) drawCat(c, cat, ww, now);
    var f = yourFace(now);
    c.save();
    c.translate(0, 0);
    A.you(c, A.PEOPLE.you, f);
    c.restore();
    if (catFront) drawCat(c, cat, ww, now);
    c.restore();
    // the camera's off: only you can see this
    if (!G.cam.on) {
      c.fillStyle = A.dots(c, T.ink, 3.2, 0.3);
      c.fillRect(x, y, w, h);
    }
    c.restore();
    // the frame: violet when they want something from you
    var o = G.open;
    var want = !!o || roundNextIsYou();
    A.rr(c, x, y, w, h, 7);
    var pulse = shell.reduceMotion ? 1 : 0.5 + 0.5 * Math.abs(Math.sin(now * 6));
    c.lineWidth = want ? 3 + pulse * 2 : G.flash > 0 ? 4 : 2;
    c.strokeStyle = want ? T.accent : G.flash > 0 && Math.floor(G.flash * 8) % 2 ? T.red : T.paper;
    c.stroke();
    // your name tag, top left, with your mic: violet (then red) while you're live
    var left = live ? clamp(G.mic.left / G.mic.max, 0, 1) : 1;
    var tag = nameTag(c, x + 5, y + 5 + tagSize() * 1.6, live ? "Sam (you): live" : "Sam (you)", live, w - 10, false,
                      live ? (left < 0.35 ? T.red : T.accent) : null);
    if (!G.cam.on) camOffCard(c, r);
    if (live) micRing(c, r, tag, left);
    if (o) badge(c, r, o, now);
    else if (roundNextIsYou()) chip(c, x + w - 6, y + 6, "You're next", "right", T.accent);
  }

  function yourFace(now) {
    var f = { mood: "work", gx: 0, gy: 0.9, talk: 0, nod: 0 };
    // eyes on the sheet: down, and towards whichever box is next
    var row = curRow();
    var sheetLeft = L.sheet.x + L.sheet.w * 0.3 < L.you.x;
    f.gx = (row ? (row.empty ? 0.5 : -0.5) : 0) + (sheetLeft ? -0.35 : 0);
    if (G.stall > 0) { f.mood = "shock"; f.gx = sheetLeft ? -0.6 : 0; f.gy = 0.7; }
    if (G.open) { f.mood = "look"; f.gx = 0; f.gy = 0; }
    if (G.yepT > 0) { f.mood = "talk"; f.talk = Math.sin(now * 16) * clamp(G.yepT * 2, 0, 1); f.gx = 0; f.gy = 0; }
    if (G.nod > 0) { f.nod = shell.reduceMotion ? 0 : 1 - G.nod; f.mood = "look"; f.gx = 0; f.gy = 0.2; }
    if (G.seen > 0 || G.flash > 0.6) { f.mood = "shock"; f.gx = 0; f.gy = 0; }
    if (G.phase === "removed") f.mood = "shock";
    if (G.phase === "clear" && G.endT > 0.6) { f.mood = "smile"; }
    return f;
  }

  function drawCat(c, cat, ww, now) {
    var dx = A.yourDoorX(ww) + 13;
    var t = shell.reduceMotion ? 0 : now;
    if (cat.phase === "door") {
      var a = clamp((cat.t / (cat.walk * 0.32) - 0.35) * 2.5, 0, 1);
      if (a > 0) { c.globalAlpha = a; A.catEyes(c, dx, 64, 0.9, Math.sin(now * 3) > 0.97); c.globalAlpha = 1; }
    } else if (cat.phase === "walk") {
      // out of the door and towards the camera, beside you, getting bigger
      var p = clamp(cat.t2 / (cat.walk * 0.68), 0, 1);
      var edge = ww / 2 - 20;
      var x = lerp(dx, Math.max(edge, 40), p), y = lerp(84, 97, p), s = lerp(0.62, 1.15, p * p);
      A.cat(c, x, y, s, "walk", t, -1);
    } else if (cat.phase === "desk" || cat.phase === "leave") {
      var off = cat.phase === "leave" ? clamp(cat.t4 / 0.8, 0, 1) : 0;
      var hop = cat.phase === "desk" ? clamp(cat.t3 / 0.18, 0, 1) : 1;
      var bx = lerp(8, -ww * 0.7, off * off), by = 112 - hop * 18 + off * 10;
      A.cat(c, bx, by, 1.15, "bum", t, 1);
    }
  }

  // The badge: what they want, and how long you've got
  function badge(c, r, o, now) {
    var rad = clamp(r.h * 0.17, 15, 26);
    var bx = r.x + r.w - rad - 6, by = r.y + rad + 6;
    var left = clamp((o.deadline - G.time) / o.win, 0, 1);
    var pop = shell.reduceMotion ? 1 : clamp((G.time - o.opened) * 8, 0, 1) * (1 + 0.15 * Math.sin(clamp((G.time - o.opened) * 8, 0, 1) * Math.PI));
    c.save();
    c.translate(bx, by);
    c.scale(pop, pop);
    A.ell(c, 0, 0, rad, rad);
    A.fill(c, T.paper, 2.4, T.ink);
    // the time left: a violet ring, red near the end
    c.beginPath();
    c.arc(0, 0, rad + 3.5, -Math.PI / 2, -Math.PI / 2 + left * Math.PI * 2);
    c.lineWidth = 4.5;
    c.lineCap = "round";
    c.strokeStyle = left < 0.3 ? T.red : T.accent;
    c.stroke();
    c.fillStyle = T.ink;
    c.textAlign = "center";
    c.textBaseline = "middle";
    if (o.kind === "name") {
      var size = Math.round(rad * 0.62);
      c.font = size + "px " + T.display;
      c.fillText("SAM", 0, size * 0.06);
    } else {
      var size2 = Math.round(rad * 1.25);
      c.font = size2 + "px " + T.display;
      c.fillText("?", 0, size2 * 0.08);
    }
    c.restore();
  }

  // You're live: a ring round your mic, running down, and what to do about it
  function micRing(c, r, tag, left) {
    if (tag.icon) {
      var ic = tag.icon;
      c.beginPath();
      c.arc(ic.x, ic.y, ic.r + 4, 0, Math.PI * 2);
      c.lineWidth = 6;
      c.strokeStyle = T.ink;
      c.stroke();
      c.beginPath();
      c.arc(ic.x, ic.y, ic.r + 4, -Math.PI / 2, -Math.PI / 2 + left * Math.PI * 2);
      c.lineWidth = 3.4;
      c.strokeStyle = left < 0.35 ? T.red : T.paper;
      c.stroke();
    }
    chip(c, r.x + 5, tag.y + tag.h + 4, "Mute again", "left", left < 0.35 ? T.red : T.ink);
  }

  function camOffCard(c, r) {
    var size = W < 480 ? 12 : 13;
    chip(c, r.x + r.w / 2 - 40, r.y + r.h * 0.3, "Camera off", "left");
    // how long before they ask: only when there's no cat about
    if (!catAbout() && G.cam.off > 0) {
      var left = clamp(1 - G.cam.off / CAM_GRACE, 0, 1);
      var bw = Math.min(r.w * 0.6, 140), bx = r.x + (r.w - bw) / 2, by = r.y + r.h * 0.3 + size * 2;
      A.rr(c, bx, by, bw, 8, 3);
      A.fill(c, T.ink, 2, T.paper);
      if (left > 0) {
        A.rr(c, bx + 2, by + 2, (bw - 4) * left, 4, 2);
        c.fillStyle = left < 0.35 ? T.red : T.accent;
        c.fill();
      }
    }
  }

  // ---------------------------------------------------------------------------
  // The call's buttons, drawn for keys and mice (touch has the kit's pads)
  // ---------------------------------------------------------------------------
  function toolButtons() {
    var r = L.tools;
    if (!r) return [];
    var n = 3, gap = 8;
    var bw = (r.w - gap * (n - 1)) / n;
    return [
      { key: "mic", label: G.mic.live ? "Mute" : "Unmute", keyName: "Space" },
      { key: "cam", label: G.cam.on ? "Camera" : "Camera", keyName: "C" },
      { key: "nod", label: "Nod", keyName: "N" }
    ].map(function (b, i) { b.x = r.x + i * (bw + gap); b.y = r.y; b.w = bw; b.h = r.h; return b; });
  }
  function drawTools(c) {
    var size = clamp(Math.round(L.tools.h * 0.26), 12, 15);
    var showKeys = pointerMode !== "mouse";
    toolButtons().forEach(function (b) {
      var want = G.hint && G.hint.at === b.key;
      var active = (b.key === "mic" && G.mic.live) || (b.key === "cam" && !G.cam.on);
      A.rr(c, b.x, b.y, b.w, b.h, 8);
      c.fillStyle = b.key === "mic" && G.mic.live ? T.accent : T.ink;
      c.fill();
      c.lineWidth = want ? 3 : 1.6;
      c.strokeStyle = want ? T.accent : active ? T.paper : T.ash;
      if (b.key === "mic" && G.mic.live) c.strokeStyle = T.paper;
      c.stroke();
      var iconS = Math.min(b.h * 0.42, 24);
      var ix = b.x + b.w / 2, iy = b.y + b.h * (showKeys ? 0.36 : 0.42);
      var col = T.paper;
      if (b.key === "mic") A.micIcon(c, ix, iy, iconS, G.mic.live, col);
      else if (b.key === "cam") A.camIcon(c, ix, iy, iconS, G.cam.on, col);
      else A.nodIcon(c, ix, iy, iconS, col);
      c.font = size + "px " + T.display;
      c.fillStyle = T.paper;
      c.textAlign = "center";
      c.textBaseline = "middle";
      var label = showKeys ? b.keyName.toUpperCase() : b.label.toUpperCase();
      A.text(c, label, ix, b.y + b.h - size * 0.85, size);
    });
  }

  // Tall screens: the inbox beside your tile
  function drawSide(c) {
    var r = L.side;
    if (!r || r.h < 30) return;
    var size = W < 480 ? 12 : 13;
    c.font = size + "px " + T.display;
    c.fillStyle = T.smoke;
    c.textAlign = "left";
    c.textBaseline = "top";
    A.text(c, "INBOX", r.x + 2, r.y + 2, size);
    var full = run.inbox >= INBOX_MAX - 2;
    var big = Math.round(clamp(r.h * 0.42, 22, 44));
    c.font = big + "px " + T.display;
    c.fillStyle = full && Math.floor(G.time * 3) % 2 ? T.red : T.paper;
    c.fillText(String(run.inbox), r.x + 2, r.y + size * 1.4);
    var nw = c.measureText(String(run.inbox)).width;
    c.font = size + "px " + T.display;
    c.fillStyle = T.smoke;
    A.text(c, "OF " + INBOX_MAX, r.x + nw + 8, r.y + size * 1.4 + big - size * 1.25, size);
    // ten slots
    var sw = Math.min((r.w - 4) / INBOX_MAX, 14), sy = r.y + size * 1.6 + big + 4;
    if (sy + 10 < r.y + r.h) {
      for (var i = 0; i < INBOX_MAX; i++) {
        A.rr(c, r.x + 2 + i * sw, sy, sw - 3, 9, 2);
        A.fill(c, i < run.inbox ? (i >= INBOX_MAX - 2 ? T.red : T.accent) : T.ink, 1.5, T.paper);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // The spreadsheet
  // ---------------------------------------------------------------------------
  function sheetGeom() {
    var s = L.sheet;
    var small = s.h < 200;
    var tb = Math.round(clamp(s.h * 0.13, 20, 32));
    var fb = Math.round(clamp(s.h * 0.11, 18, 28));
    var hb = small ? 0 : Math.round(clamp(s.h * 0.07, 14, 18));     // column letters, when there's room
    var gut = Math.round(clamp(s.w * 0.06, 22, 34));
    var top = s.y + tb + fb + hb;
    var area = s.y + s.h - top - 2;
    var show = (small ? 3 : 4) + run.mods.ahead;
    var rh = Math.max(24, area / (show + 1));
    var colW = (s.w - gut - 4) / 2;
    return { s: s, tb: tb, fb: fb, hb: hb, gut: gut, top: top, area: area, rh: rh, colW: colW,
             // the row you're on sits one down, so the one you've just done is still in view
             activeY: top + rh };
  }
  function inboxSpot() {
    if (L.side && L.side.h >= 30) return { x: L.side.x + 20, y: L.side.y + 30 };
    var g = sheetGeom();
    return { x: g.s.x + g.s.w - 22, y: g.s.y + g.tb / 2 };
  }
  function boxRect(g, rowY, side) {
    return { x: g.s.x + g.gut + 2 + side * g.colW, y: rowY, w: g.colW, h: g.rh };
  }

  function drawSheet(c, now) {
    var g = sheetGeom(), s = g.s;
    var size = W < 480 ? 12 : clamp(Math.round(g.rh * 0.36), 12, 17);
    c.save();
    // the window
    A.rr(c, s.x, s.y, s.w, s.h, 6);
    c.fillStyle = T.paper;
    c.fill();
    c.save();
    A.rr(c, s.x, s.y, s.w, s.h, 6);
    c.clip();
    // title bar: the sheet's name, and the inbox
    c.fillStyle = G.stall > 0 ? T.paper : T.accent;
    c.fillRect(s.x, s.y, s.w, g.tb);
    c.beginPath();
    c.moveTo(s.x, s.y + g.tb); c.lineTo(s.x + s.w, s.y + g.tb);
    A.stroke(c, 1.5, T.ink);
    c.fillStyle = T.ink;
    c.font = size + "px " + T.display;
    c.textAlign = "left";
    c.textBaseline = "middle";
    var title = (G.sheetNames[G.sheetIdx % G.sheetNames.length] + (G.stall > 0 ? " (not responding)" : "")).toUpperCase();
    var inboxW = L.side && L.side.h >= 30 ? 0 : drawInbox(c, g, size);
    c.save();
    c.beginPath();
    c.rect(s.x, s.y, s.w - inboxW - 10, g.tb);
    c.clip();
    c.fillStyle = T.ink;
    // new mail takes over the title bar for a moment: who from, and what about
    var mail = G.toasts.length && G.stall <= 0 ? G.toasts[G.toasts.length - 1] : null;
    if (mail && mail.t < 2.2) {
      var ew = size * 1.3;
      c.fillStyle = T.paper;
      c.fillRect(s.x, s.y, s.w - inboxW - 10, g.tb - 0.75);
      A.envelope(c, s.x + 10 + ew / 2, s.y + g.tb / 2, ew, 0);
      c.fillStyle = T.ink;
      A.text(c, (mail.from + ": " + mail.subject).toUpperCase(), s.x + 18 + ew, s.y + g.tb / 2 + size * 0.06, size);
    } else {
      A.text(c, title, s.x + 10, s.y + g.tb / 2 + size * 0.06, size);
    }
    c.restore();
    // formula bar: what's on the clipboard
    var fy = s.y + g.tb;
    c.fillStyle = T.paper;
    c.fillRect(s.x, fy, s.w, g.fb);
    c.beginPath();
    c.moveTo(s.x, fy + g.fb); c.lineTo(s.x + s.w, fy + g.fb);
    c.moveTo(s.x, fy); c.lineTo(s.x + s.w, fy);
    A.stroke(c, 1.5, T.ink);
    c.font = size + "px " + T.display;
    c.fillStyle = T.ink;
    A.text(c, "PASTE:", s.x + 10, fy + g.fb / 2 + size * 0.06, size);
    var pw = A.textWidth(c, "PASTE:", size);
    c.fillStyle = T.accent;
    A.text(c, info().clip.toUpperCase(), s.x + 18 + pw, fy + g.fb / 2 + size * 0.06, size);
    // column headers
    var hy = fy + g.fb;
    if (g.hb) {
      c.fillStyle = T.paper;
      c.fillRect(s.x, hy, s.w, g.hb);
      c.fillStyle = A.shadeLight(c);
      c.fillRect(s.x, hy, s.w, g.hb);
      c.font = Math.max(12, g.hb - 3) + "px " + T.display;
      c.fillStyle = T.ink;
      c.textAlign = "center";
      c.fillText("A", s.x + g.gut + 2 + g.colW / 2, hy + g.hb / 2 + 1);
      c.fillText("B", s.x + g.gut + 2 + g.colW * 1.5, hy + g.hb / 2 + 1);
      c.beginPath();
      c.moveTo(s.x, hy + g.hb); c.lineTo(s.x + s.w, hy + g.hb);
      A.stroke(c, 1.5, T.ink);
    }
    // the rows: one done, the one you're on, the ones coming
    c.save();
    c.beginPath();
    c.rect(s.x, g.top, s.w, s.h - (g.top - s.y));
    c.clip();
    var slide = shell.reduceMotion ? 0 : G.rowAnim * g.rh;
    var first = Math.max(0, G.row - 1);
    for (var i = first; i < G.row + 6 + run.mods.ahead; i++) {
      var ry = g.activeY + (i - G.row) * g.rh + slide;
      if (ry > s.y + s.h) break;
      drawRow(c, g, i, ry, size, now);
    }
    c.restore();
    // the gutter line
    c.beginPath();
    c.moveTo(s.x + g.gut, hy); c.lineTo(s.x + g.gut, s.y + s.h);
    A.stroke(c, 1.5, T.ink);
    if (G.stall > 0) A.spinner(c, s.x + s.w / 2, g.activeY + g.rh * 1.6, Math.min(16, g.rh * 0.4), now);
    c.restore();
    A.rr(c, s.x, s.y, s.w, s.h, 6);
    A.stroke(c, 3, G.share ? T.red : T.ink);
    c.restore();
    if (G.sheetFlash > 0) {
      c.globalAlpha = G.sheetFlash * 0.8;
      A.rr(c, s.x - 3, s.y - 3, s.w + 6, s.h + 6, 8);
      A.stroke(c, 4, T.accent);
      c.globalAlpha = 1;
    }
  }

  function drawRow(c, g, i, ry, size, now) {
    var row = G.rows[i];
    if (!row) return;
    var s = g.s, active = i === G.row && G.phase === "play";
    var num = ((G.sheetRow + (i - G.row)) % SHEET_ROWS + SHEET_ROWS) % SHEET_ROWS + 1;
    // which sheet the row belongs to: a thick line where a new one starts
    if (num === 1 && i > 0) {
      c.beginPath();
      c.moveTo(s.x, ry); c.lineTo(s.x + s.w, ry);
      A.stroke(c, 3, T.ink);
    }
    // the gutter: the row number
    c.fillStyle = A.shadeLight(c);
    c.fillRect(s.x, ry, g.gut, g.rh);
    c.font = size + "px " + T.display;
    c.fillStyle = T.ink;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(String(num), s.x + g.gut / 2, ry + g.rh / 2 + 1);
    for (var side = 0; side < 2; side++) {
      var b = boxRect(g, ry, side);
      var empty = row.empty === side;
      var done = row.state === "done" && empty;
      c.beginPath();
      c.rect(b.x, b.y, b.w, b.h);
      c.fillStyle = T.paper;
      c.fill();
      if (!empty) { c.fillStyle = A.shade(c); c.fill(); }
      c.lineWidth = 1.2;
      c.strokeStyle = T.ink;
      c.stroke();
      var label = null, col = T.ink;
      if (!empty) label = row.text;
      if (done) { label = info().clip; col = T.accent; }
      if (active && G.stall > 0 && G.wrongBox === side) { label = "#N/A"; col = T.red; }
      if (label) {
        c.save();
        c.beginPath();
        c.rect(b.x + 2, b.y, b.w - 4, b.h);
        c.clip();
        c.font = size + "px " + T.display;
        // a filled box's words sit on a paper chip, so they read over the dots
        var tw = A.textWidth(c, label.toUpperCase(), size);
        if (!empty || (active && G.wrongBox === side)) {
          c.fillStyle = T.paper;
          c.fillRect(b.x + 6, b.y + b.h / 2 - size * 0.72, Math.min(tw + 8, b.w - 10), size * 1.44);
        }
        c.fillStyle = col;
        c.textAlign = "left";
        c.textBaseline = "middle";
        A.text(c, label.toUpperCase(), b.x + 10, b.y + b.h / 2 + size * 0.06, size);
        c.restore();
      }
    }
    if (active) {
      // the selection: a thick violet frame round the row, and a caret in the empty box
      var a = boxRect(g, ry, 0);
      c.beginPath();
      c.rect(a.x - 1, ry - 1, g.colW * 2 + 2, g.rh + 2);
      c.lineWidth = 4;
      c.strokeStyle = G.stall > 0 ? T.red : T.accent;
      c.stroke();
      if (G.stall <= 0 && (shell.reduceMotion || Math.floor(now * 2.4) % 2 === 0)) {
        var e = boxRect(g, ry, row.empty);
        c.fillStyle = T.ink;
        c.fillRect(e.x + 10, e.y + g.rh * 0.24, 2, g.rh * 0.52);
      }
    }
  }

  // The inbox, in the title bar. Returns how wide it is.
  function drawInbox(c, g, size) {
    var s = g.s;
    var full = run.inbox >= INBOX_MAX - 2;
    var label = "INBOX " + run.inbox;
    c.font = size + "px " + T.display;
    var tw = A.textWidth(c, label, size);
    var ew = size * 1.3;
    var w = tw + ew + 18;
    var x = s.x + s.w - w - 6, y = s.y + 4, h = g.tb - 8;
    A.rr(c, x, y, w, h, 4);
    c.fillStyle = full ? (Math.floor(G.time * 3) % 2 ? T.red : T.ink) : T.ink;
    c.fill();
    A.envelope(c, x + 8 + ew / 2, y + h / 2, ew, 0);
    c.fillStyle = T.paper;
    c.textAlign = "left";
    c.textBaseline = "middle";
    A.text(c, label, x + 12 + ew, y + h / 2 + size * 0.06, size);
    return w;
  }

  function drawFlights(c) {
    G.flights.forEach(function (f) {
      var k = f.t < 0.5 ? 2 * f.t * f.t : 1 - Math.pow(-2 * f.t + 2, 2) / 2;
      var x = lerp(f.x0, f.x1, k), y = lerp(f.y0, f.y1, k) - Math.sin(k * Math.PI) * 30;
      var k2 = Math.max(0, k - 0.1);
      var px = lerp(f.x0, f.x1, k2), py = lerp(f.y0, f.y1, k2) - Math.sin(k2 * Math.PI) * 30;
      var w = W < 480 ? 16 : 20;
      if (!shell.reduceMotion) A.motion(c, px, py, x, y, w);
      c.globalAlpha = f.inbound ? 1 : 1 - f.t * 0.6;
      A.envelope(c, x, y, w, Math.sin(f.t * 8) * 0.2);
      c.globalAlpha = 1;
    });
  }

  function drawStamps(c) {
    G.stamps.forEach(function (s) {
      var size = s.big ? clamp(L.sheet.h * 0.07, 14, 20) : clamp(L.you.h * 0.1, 13, 20);
      var k = s.t / s.life;
      var grow = shell.reduceMotion ? 1 : s.t < 0.12 ? 1.7 - (s.t / 0.12) * 0.75 : s.t < 0.2 ? 0.95 + (s.t - 0.12) / 0.08 * 0.05 : 1;
      var alpha = shell.reduceMotion ? Math.min(1, s.t * 10) * Math.min(1, (1 - k) * 4) : Math.min(1, (1 - k) * 4);
      A.stamp(c, s.x, s.y, s.text, size, s.tilt, alpha, grow);
    });
  }

  function drawPops(c) {
    var size = W < 480 ? 14 : 17;
    c.font = size + "px " + T.display;
    c.textAlign = "center";
    c.textBaseline = "middle";
    G.pops.forEach(function (p) {
      var k = p.t / 0.9;
      var y = p.y - (shell.reduceMotion ? 0 : k * 18);
      c.globalAlpha = 1 - k * k;
      c.lineWidth = 3.4;
      c.strokeStyle = T.ink;
      c.strokeText(p.text, p.x, y);
      c.fillStyle = T.paper;
      c.fillText(p.text, p.x, y);
    });
    c.globalAlpha = 1;
  }

  // Removed: the call goes, and a card says so
  function drawRemoved(c) {
    var r = L.call, size = W < 480 ? 14 : 18;
    var a = clamp(G.endT * 2, 0, 1);
    c.globalAlpha = a;
    c.font = size + "px " + T.display;
    var l1 = "YOU HAVE BEEN REMOVED", l2 = "FROM THE MEETING";
    var w = Math.max(A.textWidth(c, l1, size), A.textWidth(c, l2, size)) + size * 2, h = size * 3.4;
    var x = r.x + (r.w - w) / 2, y = r.y + (r.h - h) / 2;
    A.rr(c, x, y, w, h, 6);
    A.fill(c, T.paper, 3, T.ink);
    c.fillStyle = T.accent;
    c.fillRect(x + 1.5, y + 1.5, w - 3, 5);
    c.fillStyle = T.ink;
    c.textAlign = "center";
    c.textBaseline = "middle";
    A.text(c, l1, x + w / 2, y + h * 0.4, size);
    A.text(c, l2, x + w / 2, y + h * 0.7, size);
    c.globalAlpha = 1;
  }

  // ---------------------------------------------------------------------------
  // Speech bubbles, in screen pixels: from the speaker's tile, clear of the
  // HUD, your tile, the sheet and each other
  // ---------------------------------------------------------------------------
  var hudCache = null, hudAge = 0;
  function hudBoxes() {
    if (hudCache && hudAge++ < 60) return hudCache;
    hudAge = 0;
    var base = root.getBoundingClientRect();
    hudCache = [];
    Array.prototype.forEach.call(root.querySelectorAll(".kit-hud-tl, .kit-hud-tr, .kit-bar"), function (el) {
      var r = el.getBoundingClientRect();
      if (r.width) hudCache.push({ x: r.left - base.left - 2, y: 0, w: r.width + 4, h: r.bottom - base.top + 2 });
    });
    return hudCache;
  }
  function overlaps(a, b, gap) {
    return a.x < b.x + b.w + gap && a.x + a.w + gap > b.x && a.y < b.y + b.h + gap && a.y + a.h + gap > b.y;
  }
  function wrap(text, max) {
    var words = text.toUpperCase().split(" ");
    if (text.length <= max || words.length < 2) return [words.join(" ")];
    var best = null;
    for (var i = 1; i < words.length; i++) {
      var a = words.slice(0, i).join(" "), b = words.slice(i).join(" ");
      var worst = Math.max(a.length, b.length);
      if (!best || worst < best.worst) best = { worst: worst, lines: [a, b] };
    }
    return best.lines;
  }
  function bubbleSize() { return N.flags.clip ? 14 : W < 480 ? 12 : clamp(Math.round(L.tileH * 0.1), 13, 17); }

  function drawBubbles(c, arrowBox) {
    var size = bubbleSize();
    var placed = hudBoxes().slice();
    if (arrowBox) placed.push(arrowBox);
    var hard = hudBoxes().slice();
    hard.push({ x: L.sheet.x, y: L.sheet.y, w: L.sheet.w, h: L.sheet.h });
    hard.push({ x: L.you.x, y: L.you.y, w: L.you.w, h: L.you.h });
    // newest last, so it wins the best spot
    G.bubbles.forEach(function (b) {
      var fs = b.toYou ? size + 1 : size;
      c.font = fs + "px " + T.display;
      var lines = wrap(b.text, W < 480 ? 15 : 20);
      var tw = 0;
      lines.forEach(function (l) { tw = Math.max(tw, A.textWidth(c, l, fs)); });
      var pad = fs * 0.55, lh = fs * 1.04;
      var bw = tw + pad * 2, bh = lines.length * lh + pad * 1.15;
      var box = null, tail;
      if (b.who === "you") {
        var r = L.you;
        tail = { x: r.x + r.w * 0.5, y: r.y + r.h * 0.62 };
        var tries = [{ x: r.x + r.w * 0.5 - bw / 2, y: r.y - bh - 10 }, { x: r.x - bw - 12, y: r.y + r.h * 0.3 }, { x: r.x + r.w + 12, y: r.y + r.h * 0.3 }];
        for (var q = 0; q < tries.length && !box; q++) {
          var t0 = { x: clamp(tries[q].x, 4, W - bw - 4), y: clamp(tries[q].y, 4, H - bh - 4), w: bw, h: bh };
          if (hudBoxes().some(function (p) { return overlaps(t0, p, 3); })) continue;
          if (overlaps(t0, L.sheet, 0) && q < tries.length - 1) continue;
          box = t0;
        }
        if (!box) box = { x: clamp(r.x + 6, 4, W - bw - 4), y: r.y + 6, w: bw, h: bh };
      } else {
        var t = tileOf(b.who);
        if (!t) return;
        tail = { x: t.x + t.w / 2, y: t.y + t.h * 0.66 };
        var cands = [
          { x: t.x + t.w / 2 - bw / 2, y: t.y - bh - 6 },        // above
          { x: t.x + t.w * 0.75 - bw / 2, y: t.y + 4 },           // inside, top right
          { x: t.x + t.w * 0.25 - bw / 2, y: t.y + 4 },           // inside, top left
          { x: t.x + t.w + 8, y: t.y + t.h * 0.3 - bh / 2 },     // to the right
          { x: t.x - bw - 8, y: t.y + t.h * 0.3 - bh / 2 },      // to the left
          { x: t.x + t.w / 2 - bw / 2, y: t.y + t.h + 6 }         // below
        ];
        for (var pass = 0; pass < 3 && !box; pass++) {
          for (var i = 0; i < cands.length && !box; i++) {
            var tb = { x: clamp(cands[i].x, 4, W - bw - 4), y: clamp(cands[i].y, 4, H - bh - 4), w: bw, h: bh };
            if (hard.some(function (p) { return overlaps(tb, p, 2); })) continue;
            if (pass < 2 && placed.some(function (p) { return overlaps(tb, p, 3); })) continue;
            if (pass < 1 && i === 0 && tb.y + bh > t.y + 2) continue;
            box = tb;
          }
        }
        if (!box) box = { x: clamp(t.x + t.w / 2 - bw / 2, 4, W - bw - 4), y: clamp(t.y + 4, 4, H - bh - 4), w: bw, h: bh };
      }
      placed.push(box);
      var pop = shell.reduceMotion ? 1 : clamp(b.t * 8, 0, 1);
      var fade = clamp((b.life - b.t) * 4, 0, 1);
      A.bubble(c, box, tail, lines, fs, Math.min(pop, fade), b.toYou ? T.accent : T.ink, b.toYou ? YOU_NAME.toUpperCase() : null);
    });
  }

  // ---------------------------------------------------------------------------
  // The arrow: one thing at a time, until you've shown you know
  // ---------------------------------------------------------------------------
  function hintTarget() {
    var h = G.hint;
    if (!h) return null;
    if (h.at === "box") {
      var g = sheetGeom(), b = boxRect(g, g.activeY, h.side);
      return { x: b.x + b.w / 2, y: b.y + 2, dir: "down" };
    }
    if (padsOn()) {
      var pad = root.querySelector('.kit-pad[data-key="' + h.at + '"]');
      if (!pad) return null;
      var r = pad.getBoundingClientRect(), base = root.getBoundingClientRect();
      return { x: r.left - base.left + r.width / 2, y: r.top - base.top - 4, dir: "down" };
    }
    var btn = toolButtons().filter(function (b) { return b.key === h.at; })[0];
    if (btn) return { x: btn.x + btn.w / 2, y: btn.y - 4, dir: "down" };
    return { x: L.you.x + L.you.w / 2, y: L.you.y + 4, dir: "down" };
  }
  function hintBox() {
    var t = hintTarget();
    if (!t) return null;
    var size = W < 480 ? 20 : 24;
    return { x: t.x - size * 3, y: t.y - size * 2.1, w: size * 6, h: size * 2.1 };
  }
  function drawHint(c) {
    var t = hintTarget();
    if (!t) return;
    var size = W < 480 ? 20 : 24;
    var bob = shell.reduceMotion ? 0 : Math.abs(Math.sin(performance.now() / 250)) * 5;
    A.arrow(c, t.x, t.y - bob, G.hint.word, size, t.dir, W - 4);
  }

  // ---------------------------------------------------------------------------
  // Sound: lo-fi, through the kit
  // ---------------------------------------------------------------------------
  var VOICES = { graham: 150, priya: 260, dave: 130, gaz: 170, linda: 230, pam: 250, keith: 120, bernard: 110, mo: 190,
                 rupert: 140, notes: 600, phone: 300, tanya: 270, rob: 160, femi: 180, hannah: 280, clive: 145, joy: 240, marcus: 175 };
  var sfx = {
    paste: function (streak) {
      N.sound.tone(620 + Math.min(streak, 36) * 18, 0.035, { vol: 0.05 });
      N.sound.noise(0.025, { freq: 3000, vol: 0.05 });
    },
    wrong: function () {
      N.sound.tone(150, 0.26, { type: "sawtooth", slide: 90, vol: 0.09 });
      N.sound.noise(0.6, { type: "bandpass", freq: 420, q: 2, vol: 0.06, delay: 0.1 });
    },
    busy: function () { N.sound.tone(200, 0.06, { vol: 0.03 }); },
    save: function () {
      N.sound.tone(880, 0.07, { type: "triangle", vol: 0.06 });
      N.sound.tone(1320, 0.1, { type: "triangle", vol: 0.06, delay: 0.07 });
    },
    zero: function () { [784, 988, 1175, 1568].forEach(function (f, i) { N.sound.tone(f, 0.08, { type: "triangle", vol: 0.05, delay: i * 0.06 }); }); },
    streak: function () { [660, 880, 1100].forEach(function (f, i) { N.sound.tone(f, 0.08, { type: "triangle", vol: 0.05, delay: i * 0.06 }); }); },
    mail: function () { N.sound.tone(1568, 0.05, { vol: 0.03 }); N.sound.tone(2093, 0.08, { vol: 0.03, delay: 0.07 }); },
    named: function () { N.sound.tone(523, 0.09, { type: "triangle", vol: 0.08 }); N.sound.tone(659, 0.12, { type: "triangle", vol: 0.08, delay: 0.1 }); },
    asked: function () { N.sound.tone(440, 0.22, { type: "triangle", slide: 880, vol: 0.09 }); },
    nod: function () { N.sound.tone(220, 0.08, { type: "triangle", vol: 0.07 }); N.sound.tone(196, 0.1, { type: "triangle", vol: 0.07, delay: 0.12 }); },
    yep: function () { N.sound.tone(330, 0.12, { type: "square", slide: 250, vol: 0.06 }); },
    unmute: function () { N.sound.tone(900, 0.04, { vol: 0.04 }); N.sound.tone(1300, 0.05, { vol: 0.04, delay: 0.05 }); },
    mute: function () { N.sound.tone(1300, 0.04, { vol: 0.04 }); N.sound.tone(900, 0.05, { vol: 0.04, delay: 0.05 }); },
    cam: function (on) { N.sound.noise(0.05, { freq: 2600, vol: 0.08 }); N.sound.tone(on ? 1000 : 700, 0.04, { vol: 0.03 }); },
    creak: function () { N.sound.tone(170, 0.6, { type: "sawtooth", slide: 300, vol: 0.035 }); },
    meow: function () { N.sound.tone(760, 0.3, { type: "square", slide: 480, vol: 0.035 }); },
    thump: function () { N.sound.tone(120, 0.12, { type: "sine", slide: 60, vol: 0.12 }); },
    gasp: function () { N.sound.tone(500, 0.15, { type: "triangle", slide: 900, vol: 0.06 }); },
    hum: function (k) { N.sound.noise(0.2, { type: "lowpass", freq: 140 + k * 120, vol: 0.05 + k * 0.08 }); },
    hostMute: function () { N.sound.tone(1300, 0.04, { vol: 0.05 }); N.sound.tone(700, 0.08, { vol: 0.05, delay: 0.05 }); },
    lose: function () { N.sound.tone(110, 0.35, { type: "sawtooth", slide: 70, vol: 0.09 }); },
    share: function () { N.sound.tone(660, 0.1, { type: "triangle", vol: 0.06 }); N.sound.tone(990, 0.14, { type: "triangle", vol: 0.06, delay: 0.1 }); },
    unshare: function () { N.sound.tone(990, 0.1, { type: "triangle", vol: 0.05 }); N.sound.tone(660, 0.14, { type: "triangle", vol: 0.05, delay: 0.1 }); },
    leave: function () { [784, 659, 523].forEach(function (f, i) { N.sound.tone(f, 0.18, { type: "triangle", vol: 0.07, delay: i * 0.14 }); }); },
    removed: function () {
      [523, 392, 262].forEach(function (f, i) { N.sound.tone(f, 0.25, { type: "sawtooth", vol: 0.06, delay: i * 0.2 }); });
      N.sound.stamp(0.7);
    },
    // a blip a syllable, in their own voice
    voice: function (who, text) {
      var base = VOICES[who] || 200;
      var n = Math.min(7, Math.max(1, Math.round(text.split(" ").length * 1.3)));
      for (var i = 0; i < n; i++) {
        N.sound.tone(base * (0.92 + Math.random() * 0.2), 0.05, { type: who === "notes" ? "square" : "square", vol: 0.022, delay: i * 0.085 });
      }
    }
  };

  // ---------------------------------------------------------------------------
  // Pointer: click or tap a box to paste into it; click the call's buttons
  // ---------------------------------------------------------------------------
  function local(e) {
    var r = root.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function onScreen(e) {
    var t = e.target;
    return !(t && t.closest && t.closest(".kit-panel, .kit-bar, .kit-pad, .kit-intro, button, a"));
  }
  function inside(p, r) { return r && p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h; }
  root.addEventListener("pointerdown", function (e) {
    if (!shell || !G || shell.state() !== "playing" || !onScreen(e)) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    var p = local(e);
    if (e.pointerType === "mouse") { pointerMode = "mouse"; mouse.x = p.x; mouse.y = p.y; mouse.on = true; }
    else e.preventDefault();
    if (AUTOPILOT) return;
    // the sheet: the left half pastes left, the right half pastes right
    var g = sheetGeom();
    if (inside(p, { x: g.s.x, y: g.s.y + g.tb, w: g.s.w, h: g.s.h - g.tb })) {
      var mid = g.s.x + g.gut + 2 + g.colW;
      paste(p.x < mid ? 0 : 1, "point");
      return;
    }
    var btn = toolButtons().filter(function (b) { return inside(p, b); })[0];
    if (btn) { if (btn.key === "mic") mic(); else if (btn.key === "cam") cam(); else nod(); }
  });
  root.addEventListener("pointermove", function (e) {
    if (e.pointerType !== "mouse" || !shell) return;
    var p = local(e);
    mouse.x = p.x; mouse.y = p.y; mouse.on = onScreen(e);
    if (pointerMode !== "mouse" && Math.abs(e.movementX) + Math.abs(e.movementY) > 3) pointerMode = "mouse";
  });

  // ---------------------------------------------------------------------------
  // Start it up
  // ---------------------------------------------------------------------------
  shell = N.createGame({
    root: root,
    slug: "on-mute",
    title: "On Mute",
    stamp: "You're on mute",
    tilt: -5,
    note: "Four meetings back to back, and a spreadsheet that needs doing. Camera on. Mic off.",
    pitch: "Four meetings, one spreadsheet and a cat. Nod when you hear your name.",
    hints: {
      keys: "Arrows or A and D paste left and right. N to nod, Space to unmute and mute, C for the camera. P to pause.",
      touch: "Tap the empty box. Nod, Mic and Cam are along the bottom."
    },
    againLabel: "Rejoin the meeting",
    daily: true,
    smallCallouts: true,
    fullOnTouch: true,
    keys: {
      left: ["ArrowLeft", "KeyA"],
      right: ["ArrowRight", "KeyD"],
      nod: ["KeyN", "ArrowDown", "KeyS"],
      mic: ["Space", "KeyU", "ArrowUp", "KeyW"],
      cam: ["KeyC"]
    },
    pad: { left: [14, 4], right: [15, 5], nod: [0], mic: [2, 1], cam: [3] },
    touch: [
      { key: "left", label: "Paste left", icon: "left", side: "left" },
      { key: "nod", label: "Nod", icon: "Nod", side: "left" },
      { key: "mic", label: "Microphone", icon: "Mic", side: "left" },
      { key: "cam", label: "Camera", icon: "Cam", side: "right" },
      { key: "right", label: "Paste right", icon: "right", side: "right" }
    ],
    reset: reset,
    update: function (dt, input) { update(dt, input); },
    render: function (dt) { render(dt); },
    resize: resize
  });
  T = shell.tokens;
  A.init(T, Math.min(2, window.devicePixelRatio || 1));

  if (document.fonts && document.fonts.load) {
    document.fonts.load("12px " + T.display).then(function () { bg = null; });
  }

  if (DEBUG) {
    window.__onMute = {
      stages: STAGES,
      run: function () { return run; },
      stage: function () { return G; },
      layout: function () { return L; },
      state: function () { return shell.state(); },
      // what a test player can see: the row, the badge, the cat, the mic
      view: function () {
        var r = root.getBoundingClientRect(), g = sheetGeom();
        var row = curRow();
        var bl = boxRect(g, g.activeY, 0), br = boxRect(g, g.activeY, 1);
        return {
          time: G.time, phase: G.phase, row: row ? row.empty : -1, stall: G.stall, decoy: G.lastDecoy || -1,
          open: G.open ? { kind: G.open.kind, left: G.open.deadline - G.time, id: G.open.opened } : null,
          micLive: G.mic.live, answered: G.mic.answered, micLeft: G.mic.left,
          cat: G.cat ? G.cat.phase : null, camOn: G.cam.on, camOff: G.cam.off, share: !!G.share,
          inbox: run.inbox, rep: run.rep, score: Math.round(run.score), stage: run.stage + 1,
          boxes: [[r.left + bl.x + bl.w / 2, r.top + bl.y + bl.h / 2], [r.left + br.x + br.w / 2, r.top + br.y + br.h / 2]],
          tools: toolButtons().map(function (b) { return { key: b.key, x: r.left + b.x + b.w / 2, y: r.top + b.y + b.h / 2 }; })
        };
      },
      score: function () {
        return { stage: run.stage + 1, clock: clockText(), score: Math.round(run.score), rep: run.rep, inbox: run.inbox,
                 boxes: run.boxes, wrong: run.wrong, missed: run.missed, volunteered: run.volunteered, taken: run.taken.join(","), removed: run.removed };
      }
    };
  }
})();
