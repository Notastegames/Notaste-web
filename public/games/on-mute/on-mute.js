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
// Everything addressed to you lights your tile. The tell comes first: half
// a second before they say it, everyone turns to look at your tile and its
// frame goes dashed violet (get ready). A press made then waits for what
// comes, and counts if it was the right one. Then the bubble, a solid frame
// and a badge in your tile's corner with a ring that runs down for as long
// as you have, with the button's icon in it and, all through the first
// meeting, its key underneath. Bubbles that name you have a violet outline
// and your name underlined, only while they're waiting for you.
//   Your name    "Like Sam said last week." The badge says SAM. Nod (N or
//                Down). 2.6 seconds in the stand-up, down to 1.8 in the last.
//   A question   "Sam, any blockers?" The badge is a question mark. Unmute
//                (Space or Up) and you say "Yep." Whatever the question was.
//                3 seconds, down to 2.1. Then you're live, with a ring round
//                your mic: mute again before it runs out, or they hear the
//                dishwasher behind you (it starts shaking as soon as you're
//                live), the host mutes you, and that costs reputation.
//   The cat      From the team meeting on. The door behind you creaks open
//                and two eyes appear in the gap. It walks across the kitchen
//                and jumps up in front of the camera, facing away. Camera off
//                (C) before it gets there (3.2 seconds, down to 2.5), and
//                back on once it's gone: the camera can only be off while the
//                cat's about, and a few seconds after (a bar on your tile
//                runs down) people ask where you've gone.
// One rule per action, everywhere: nod at your name, answer questions out
// loud, camera off for the cat. Do any of them when nobody asked and you've
// volunteered ("Great. Sam's on it."): one more email. The exceptions are
// said out loud and cost nothing: a nod at a question gets "We can't hear a
// nod, Sam.", and a nod with the camera off "We can't see a nod, Sam." Nobody
// says your name while your camera's off. Questions to everyone ("Any
// questions?") and to other people (Pam, mostly) aren't for you.
// Every yep goes on the record. Some questions take it at its word ("Lovely.
// Thursday it is."), and those are action points; one you miss is taken as
// a yes. The notetaker reads them back between meetings.
// Miss something and your reputation drops a pip (five to start). Get through
// a meeting without missing anything and one comes back. Lose them all and
// the host removes you from the meeting: the run is over.
//
// THE STAGES (a notice, shell.brief, says what's new before Go, and comes
// down before anything's said to you). Each meeting talks on its own clock,
// whatever's said to you, every line dealt from a deck.
//   1. The stand-up (09:00, 24s). Graham, Priya and Dave (frozen). Your name
//      and questions only, with long windows. Priya gives her update; Dave
//      unfreezes at the end to ask if you can repeat that.
//   2. The team meeting (10:00, 30s). Six tiles, and the cat. People ask Pam
//      things, and Pam says no. Now and then a locked "Do not edit" row: let
//      it go by.
//   3. The all-hands (13:00, 32s). Twelve tiles and Rupert, Head of Vision.
//      Questions to everyone, which aren't for you, and "Let's go round the
//      room": a frame moves tile to tile as each person says one word about
//      their week, and when it gets to you, unmute. Rows Pam has done: leave
//      them.
//   4. This could have been an email (16:00, 34s). Graham reads the fridge
//      email out, a line at a time. Everything is quicker, and he asks you to
//      share your screen: say yep, and for eight seconds everyone can see
//      your spreadsheet, so a wrong box costs reputation ("Is that a #N/A?").
//      Nothing else is asked of you while you're sharing. Then it overruns
//      (six seconds more).
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
  var SKIP_WAIT = 0.5;          // a row that wants nothing goes by after this long
  var CAM_GRACE = 3.4;          // camera off with no cat about: this long before they ask
  var CAT_STAY = 2.2;           // on the desk, in front of the camera
  var CHASE_GAP = 6;            // at most one "did you see my email" this often
  var VOLUNTEER_GAP = 1.2;      // a second wrong nod this soon is the same nod
  var KEEN = 0.8;
  var APPROVED = 22000;
  var PTS = { box: 10, sheet: 50, nod: 50, yep: 75, keen: 25, muted: 25, hidden: 100, camBack: 25, survive: 1000 };
  // The first thing anyone says to you, in seconds after Go: the notice is
  // up until just before its tell (the countdown is 2.35s of the notice's ms)
  var T0S = [4.4, 4.0, 4.0, 4.0], NOTICE_MS = [6000, 5700, 5700, 5700];

  // start: the meeting's clock (minutes past midnight), mins: how long it says
  // it lasts. time: seconds of play. slots: what happens to you, in order
  // (shuffled from the stage's seed where it says so). nameWin/askWin: how
  // long you get. grace: how long you can stay unmuted. catTime: from the door
  // to the desk. email: seconds between emails, start to end. gap: seconds
  // per thing addressed to you.
  var STAGES = [
    { id: "standup", name: "The stand-up", start: 9 * 60, mins: 15, time: 24,
      cast: ["graham", "priya", "dave"], host: "graham",
      you: ["name", "ask", "name", "ask", "name"], cats: 0, gap: 4.2,
      nameWin: 2.6, askWin: 3.0, grace: 2.4, catTime: 3.4, email: [6.4, 5.6],
      clip: "TBC", twist: null },
    { id: "team", name: "The team meeting", start: 10 * 60, mins: 60, time: 30,
      cast: ["graham", "priya", "gaz", "linda", "pam", "notes"], host: "graham",
      you: ["name", "ask", "name", "ask", "name"], cats: 2, gap: 3.8,
      nameWin: 2.2, askWin: 2.6, grace: 2.0, catTime: 3.2, email: [5.2, 4.5],
      clip: "See attached", twist: "locked" },
    { id: "allhands", name: "The all-hands", start: 13 * 60, mins: 60, time: 32,
      cast: ["rupert", "graham", "priya", "gaz", "linda", "pam", "dave", "femi", "hannah", "phone", "rob", "notes"],
      host: "rupert", you: ["name", "ask", "round", "name", "ask"], cats: 2, gap: 3.3,
      nameWin: 1.9, askWin: 2.2, grace: 1.8, catTime: 2.8, email: [4.2, 3.6],
      clip: "Per my email", twist: "pam" },
    { id: "email", name: "This could have been an email", start: 16 * 60, mins: 30, time: 34, overrun: 6,
      cast: ["graham", "priya", "keith", "bernard", "mo", "notes"], host: "graham",
      you: ["name", "ask", "share", "name", "ask", "name"], cats: 3, gap: 2.9,
      nameWin: 1.8, askWin: 2.1, grace: 1.7, catTime: 2.5, email: [3.9, 3.3],
      clip: "N/A", twist: null }
  ];
  var LAST = STAGES.length - 1;

  // ---------------------------------------------------------------------------
  // What people say. Your name is Sam. You say "Yep." Every line is dealt
  // from a shuffled deck, so nothing is said twice in one meeting.
  // ---------------------------------------------------------------------------
  var YOU_NAME = "Sam";
  var YEP = "Yep.";
  var NAMES = ["Like Sam said last week.", "Sam's across that.", "Sam's got the spreadsheet.", "Thanks, Sam.",
               "As per Sam's email.", "Sam and I were just saying.", "Credit to Sam for that.", "Sam's been great on this.",
               "I'll pick that up with Sam.", "That's Sam's area.", "Sam sorted that.", "Sam knows the history.",
               "Sam flagged that.", "Big thanks to Sam.", "Sam's on the next one too.", "Sam will remember."];
  // Questions for you. Some take your yep at its word (reply), and some of
  // those are an action point for the notetaker (agree: what you agreed to).
  var ASKS = [
    { line: "Sam, any blockers?", reply: "So you do have blockers.", agree: "having blockers" },
    { line: "Sam, shall we say Thursday?", reply: "Lovely. Thursday it is.", agree: "Thursday" },
    { line: "Sam, are you OK to own that?", reply: "Great. Sam's owning it.", agree: "owning it" },
    { line: "Sam, can you present it next week?", reply: "Great. Sam's presenting.", agree: "presenting next week" },
    { line: "Sam, could you take the minutes?", reply: "Thanks, Sam.", agree: "taking the minutes" },
    { line: "Sam, can you send that round?", reply: "Lovely. Sam's sending it round.", agree: "sending it round" },
    { line: "Sam, can you cover Saturday?", reply: "Saturday it is.", agree: "working Saturday" },
    { line: "Sam, are you free after this?", reply: "I'll book us in.", agree: "another meeting" },
    { line: "Sam, did you read the doc?", reply: "Great. Comments by Friday, then.", agree: "comments by Friday" },
    { line: "Sam, happy to do the slides?", reply: "Lovely. Slides from Sam.", agree: "the slides" },
    { line: "Sam, anything to add?", reply: "Go on, then." },
    { line: "Sam, are we on track?", reply: "Good. Sam says we're on track." },
    { line: "Sam, is that a no?", reply: "OK. It's a no." },
    { line: "Sam, are you happy with that?" }, { line: "Sam, did you get a chance to look?" },
    { line: "Can you hear us, Sam?" }, { line: "Sam, are you still with us?" }, { line: "Sam, does that work for you?" },
    { line: "Sam, can you see my screen?" }, { line: "Sam, did that go out?" }, { line: "Sam, are you across this?" }
  ];
  // The meetings' own chatter: none of it is for you.
  // Someone else asked or named, with what they say back (null: nothing)
  var PAM = [["Pam, any blockers?", "None."], ["Pam, shall we say Thursday?", "Friday."], ["Pam, can you own that?", "No."],
             ["Pam, did you get that?", "Got it."], ["Pam, are you happy with that?", "Not really."],
             ["Pam, could you take the minutes?", "I did them last time."]];
  var TEAM_OTHERS = [["Like Pam said.", "pam", null], ["Thanks, Priya.", "priya", null], ["Priya, happy with that?", "priya", "Fine."],
                     ["Over to Priya.", "priya", "Thanks."]];
  var UPDATES = {
    yesterday: ["Yesterday: meetings.", "Yesterday: the deck.", "Yesterday: emails.", "Yesterday: a workshop."],
    today: ["Today: meetings.", "Today: more meetings.", "Today: the deck again.", "Today: a workshop about workshops."],
    blockers: ["No blockers.", "Blockers: meetings.", "Blocker: this meeting.", "Blocked by Dave."],
    host: ["Me: same as yesterday.", "Nothing from me.", "Quick one from me. No, it's fine."]
  };
  var TEAM_TALK = ["Let's go through the actions.", "That's still open.", "Can we get a date on that?", "Let's park that.",
                   "Sorry, I was on mute.", "Just to piggyback.", "I've got a hard stop.", "Can we circle back?"];
  var RUPERT = ["Big quarter.", "We're a family.", "Next slide.", "Exciting times.", "Our values haven't changed.",
                "Huge shout-out to everyone.", "We're on a journey.", "Wellbeing is a priority.", "Synergy."];
  // questions to everyone, and someone who answers (or nobody)
  var EVERYONE = ["Any questions?", "Can everyone see my screen?", "Is everyone happy?", "Does that make sense?",
                  "Are we all here?", "Thoughts?", "Is it just me?", "Who's taking notes?", "Anyone?", "Any objections?"];
  var EVERYONE_BACK = ["No.", "Fine.", "Nope.", "Mm.", "All good.", "Not really."];
  // the last meeting: Graham reads out the email, in order
  var EMAIL = ["Hi all.", "Just a quick reminder.", "The kitchen is not a storage area.", "Please label your milk.",
               "The fridge will be cleared on Friday.", "Anything left will be binned.", "This includes the yoghurts.",
               "Thanks in advance.", "Kind regards.", "Sent from my phone."];
  // each meeting's regulars, saying their one thing
  var CAMEOS = [
    [["dave", "Sorry. You cut out. Can you repeat that?"]],
    [["linda", "Sorry, I'm eating."], ["gaz", "Is my camera on?"]],
    [["phone", "Hello? Hello?"], ["femi", "Can you hear me now?"]],
    [["keith", "Sorry. Tunnel."], ["bernard", "Can everyone see me?"], ["mo", "I'm doing my steps."]]
  ];
  var STARTS = ["Let's give it a minute.", "Shall we start.", "Can everyone hear me?", "Right. Let me read this out."];
  var ENDS = ["Right, I'll let you all go.", "Let's take the rest offline.", "Exciting times. Bye.", "I'll send this round as an email."];
  var ROUND_ASK = "Let's go round. One word on your week.";
  var ROUND_WORDS = ["Busy.", "Quiet.", "Long.", "Thursday.", "Meetings.", "Mixed.", "Hectic.", "Grand.", "Ongoing.", "Wet."];
  var SHARE_ASK = "Sam, can you share your screen?";
  var SHARE_LINES = ["Very colourful.", "Is that live?", "Love a spreadsheet.", "Can you make it bigger?"];
  var SHARE_OOPS = ["Is that a #N/A?", "Why's it doing that.", "That's not right.", "Can you zoom in."];
  var SHARE_END = "Thanks, Sam. Stop sharing.";
  var SHARE_SAVED = ["Lovely. Thanks, Sam.", "Another one done.", "Very efficient."];
  var OVERRUN = "Just one more thing.";
  var OVERRUN_MORE = "The microwave is also not a storage area.";

  var MISS_NAME = ["Sam? Frozen.", "We've lost Sam.", "Earth to Sam.", "Sam's gone quiet.", "Sam? Never mind."];
  var MISS_ASK = ["Sam? You're on mute.", "Sam?", "Sam's not with us.", "Let's come back to Sam."];
  var TAKE_AS_YES = "I'll take that as a yes.";
  var CAT_SEEN = ["Is that a cat.", "Hello, puss.", "Sam's cat has joined.", "Lovely. A cat's bum.", "The cat's on mute too."];
  var DISH = ["Is that a dishwasher.", "Someone's not on mute.", "Sam, you're not on mute.", "Sounds like a spin cycle."];
  var VOLUNTEER = ["Great. Sam's on it.", "Thanks, Sam. I'll send it over.", "Lovely. Action on Sam.", "Sam's volunteered.", "Sam will take the minutes."];
  var NOD_AT_ASK = "We can't hear a nod, Sam.";
  var NOD_NO_CAM = "We can't see a nod, Sam.";
  var CAM_LONG = ["Camera on, please, Sam.", "Can we see you, Sam?", "Sam's gone dark."];
  var CHASE = ["Sam, did you see my email?", "Just flagging my email, Sam.", "Sam, I've emailed you about this.", "Sam, check your inbox."];

  // The spreadsheet
  // (Notaste Display has no equals sign, so no formulas: what's already in a box is words)
  var FILLED = ["Dave", "Ongoing", "Ask Graham", "Not mine", "See above", "Q4", "Pending", "Yes", "Nobody",
                "Parked", "Maybe", "Tuesday", "Sorted", "As before", "Blue", "Who", "Ages ago", "Later", "Gaz", "£40"];
  var SHEETS = ["Stand-up actions", "Q3 final v7", "Copy of budget (2)", "Tracker for the tracker", "Who's bringing what",
                "Holiday rota", "Sheet1", "Untitled spreadsheet (4)", "Actions (old)", "Meeting notes FINAL", "Risks and issues",
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

  // The results' joke, by rung (the last rung by meeting)
  var RESULT_LINES = [
    "Nobody noticed you weren't listening. That's called a career.",
    "You got through the day. A follow-up has been booked to discuss it.",
    "You were removed from the call. Nobody has noticed yet.",
    ["Removed from a fifteen-minute stand-up. It's still going.", "Removed from the team meeting. Your actions have been reassigned to you."]
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
    var T0 = T0S[run.stage];
    var k = (end - T0) / total;
    var t = T0;
    var beats = [];
    var nameDeck = deck(NAMES, rnd), askDeck = deck(ASKS, rnd);
    slots.forEach(function (kind, i) {
      var d = dur[i] * k;
      var jitter = kind === "name" || kind === "ask" ? (rnd() - 0.5) * d * 0.3 : 0;
      var beat = { kind: kind, t: t + Math.max(0, jitter), done: false };
      if (kind === "name") beat.line = nameDeck();
      if (kind === "ask") { var q = askDeck(); beat.line = q.line; beat.reply = q.reply; beat.agree = q.agree; }
      if (kind === "share") beat.line = SHARE_ASK;
      beat.who = speakerFor(st, rnd, kind);
      beats.push(beat);
      t += d;
    });
    // the meeting opens with someone talking, Dave unfreezes just before the
    // end of the stand-up, and the last meeting overruns
    beats.push({ kind: "talk", t: 0.6, line: STARTS[run.stage], who: st.host });
    if (run.stage === 0) beats.push({ kind: "talk", t: st.time - 3.2, line: CAMEOS[0][0][1], who: "dave" });
    if (st.overrun) {
      beats.push({ kind: "overrun", t: st.time - 0.2, line: OVERRUN, who: st.host });
      beats.push({ kind: "talk", t: st.time + 2.2, line: OVERRUN_MORE, who: st.host });
    }
    beats.sort(function (a, b) { return a.t - b.t; });
    // and everything else that's said, on its own clock
    var chat = planChatter(st, N.seeded(base + 8), beats, end);

    // the spreadsheet: which box is empty in each row, and what's in the other.
    // From the team meeting on, now and then a row that wants nothing: let it go by.
    var rows = [], rr = N.seeded(base + 2);
    var lastSide = 0, run2 = 0, nextSkip = 9 + Math.floor(rr() * 4);
    for (var n = 0; n < 700; n++) {
      if (st.twist && n === nextSkip) {
        rows.push({ empty: -1, skip: st.twist, state: "todo" });
        nextSkip = n + 8 + Math.floor(rr() * 6);
        continue;
      }
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
      var words = deck(ROUND_WORDS, ro);
      order = order.map(function (id) { return { id: id, word: id === "you" ? YEP : words() }; });
    }
    return { beats: beats, chat: chat, rows: rows, names: names, mails: mails, round: order };
  }

  function castHas(st, id) { return st.cast.indexOf(id) >= 0; }

  // A deck: deals from a list without putting anything back, so nothing is
  // dealt twice (it only reshuffles once it's been all the way through)
  function deck(list, rnd) {
    var pile = [];
    return function () {
      if (!pile.length) pile = shuffle(list.slice(), rnd || Math.random);
      return pile.pop();
    };
  }

  // Who says the things that are for you. Pam doesn't ask anyone anything
  // (people ask Pam), and in the last meeting the host is busy reading.
  function speakerFor(st, rnd, kind) {
    if (kind === "share" || kind === "round") return st.host;
    var pool = st.cast.filter(function (id) { return id !== "notes" && id !== "phone" && id !== "dave" && id !== "pam"; });
    if (st.id === "email") pool = pool.filter(function (id) { return id !== st.host; });
    else if (rnd() < 0.45) return st.host;
    return rpick(pool, rnd);
  }

  // What the meeting says while it isn't talking to you, dealt for each
  // meeting: the stand-up's updates, the questions for Pam, the all-hands'
  // questions to everyone and Rupert's vision, and the email, read out.
  function chatterFor(st, rnd) {
    var main = [], side = [], host = st.host;
    function talk(q, who, line) { q.push({ kind: "talk", who: who, line: line }); }
    function ask(q, who, line, target, reply) { q.push({ kind: "decoy", who: who, line: line, target: target, reply: reply }); }
    var backs = deck(EVERYONE_BACK, rnd);
    function all(q, who, line) {
      var by = null, back = null;
      if (line === "Who's taking notes?" && castHas(st, "notes")) { by = "notes"; back = "Recording."; }
      else if (rnd() < 0.6) {
        by = rpick(st.cast.filter(function (id) { return id !== who && id !== "notes" && id !== "phone" && id !== "dave" && id !== host; }), rnd);
        back = backs();
      }
      q.push({ kind: "everyone", who: who, line: line, replyBy: by, reply: back });
    }
    if (st.id === "standup") {
      // updates, one person at a time. Everyone's update is meetings.
      ask(main, host, "Priya, you go first.", "priya", null);
      talk(main, "priya", rpick(UPDATES.yesterday, rnd));
      talk(main, "priya", rpick(UPDATES.today, rnd));
      talk(main, "priya", rpick(UPDATES.blockers, rnd));
      talk(main, host, rpick(UPDATES.host, rnd));
    } else if (st.id === "team") {
      // people ask Pam things, and Pam can say no
      var pam = deck(PAM, rnd), tt = deck(TEAM_TALK, rnd), other = rpick(TEAM_OTHERS, rnd);
      var asker = function () { return rnd() < 0.7 ? host : "priya"; };
      var p1 = pam(), p2 = pam(), p3 = pam();
      talk(main, host, tt());
      ask(main, asker(), p1[0], "pam", p1[1]);
      talk(main, "linda", CAMEOS[1][0][1]);
      ask(main, asker(), p2[0], "pam", p2[1]);
      ask(main, other[1] === "priya" ? host : asker(), other[0], other[1], other[2]);
      talk(main, "gaz", CAMEOS[1][1][1]);
      ask(main, asker(), p3[0], "pam", p3[1]);
      talk(main, rnd() < 0.5 ? "priya" : "linda", tt());
    } else if (st.id === "allhands") {
      // Rupert's vision, and questions to everyone
      var ev = deck(EVERYONE, rnd), rv = deck(RUPERT, rnd);
      talk(main, host, rv());
      all(main, host, ev());
      talk(main, "phone", CAMEOS[2][0][1]);
      all(main, host, ev());
      talk(main, host, rv());
      all(main, rnd() < 0.5 ? "graham" : host, ev());
      main.push({ kind: "everyone", who: "femi", line: CAMEOS[2][1][1], replyBy: null, reply: null });
      talk(main, host, rv());
    } else {
      // the email, read out from the top
      EMAIL.forEach(function (line) { main.push({ kind: "email", who: host, line: line }); });
      CAMEOS[3].forEach(function (cm) { talk(side, cm[0], cm[1]); });
    }
    return side.length ? [main, side] : [main];
  }

  // Spread each queue of chatter through the meeting, clear of the moments
  // something's said to you (and the look before) and the round. The email
  // is read at a steady pace, whatever else is going on.
  var CHAT_GAP = 1.4;
  function planChatter(st, rnd, beats, end) {
    var from = T0S[run.stage] + 0.4, to = end - 0.6;
    var busy = [];
    beats.forEach(function (b) {
      if (b.kind === "name" || b.kind === "ask" || b.kind === "share") busy.push([b.t - PRE - 0.5, b.t + 1.0]);
      if (b.kind === "round") busy.push([b.t - PRE, b.t + 10.5]);
    });
    busy.sort(function (a, b) { return a[0] - b[0]; });
    var free = [], at = from;
    busy.forEach(function (bz) {
      if (bz[0] > at) free.push([at, Math.min(bz[0], to)]);
      at = Math.max(at, bz[1]);
    });
    if (at < to) free.push([at, to]);
    free = free.filter(function (f) { return f[1] - f[0] > 0.3; });
    var room = free.reduce(function (a, f) { return a + f[1] - f[0]; }, 0);
    function when(u) {
      for (var i = 0; i < free.length; i++) {
        var len = free[i][1] - free[i][0];
        if (u <= len) return free[i][0] + u;
        u -= len;
      }
      return to;
    }
    return chatterFor(st, rnd).map(function (lines) {
      var email = lines[0] && lines[0].kind === "email";
      var n = lines.length, last = -9;
      lines.forEach(function (l, i) {
        var tt;
        if (email) tt = from + (st.time - 2.6 - from) * (i + 0.5) / n;
        else tt = when(Math.max(0, room * (i + 0.5 + (rnd() - 0.5) * 0.5) / n));
        l.t = last = Math.max(tt, last + CHAT_GAP);
      });
      return { lines: lines, i: 0, last: -9 };
    });
  }

  function startStage() {
    var st = info();
    var p = plan(st);
    G = {
      time: 0, phase: "play", endT: 0,
      beats: p.beats, chat: p.chat, rows: p.rows, row: 0, rowT: 0, sheetRow: 0, sheetNames: p.names, sheetIdx: 0, rowAnim: 0,
      mails: p.mails, mi: 0, roundOrder: p.round, round: null, share: null, overrun: false,
      open: null,           // the thing addressed to you right now
      held: null,           // a press made during the tell, waiting for what it was for
      mic: { live: false, left: 0, max: 1, answered: false, heard: false, t: 0 },
      cam: { on: true, off: 0 },
      cat: null,
      stall: 0, wrongBox: -1, stamps: [], pops: [], bubbles: [], toasts: [], flights: [], fx: [], later: [],
      speaking: {}, gaze: null, tiles: [], volunteerAt: -9, chaseAt: -99, closedAt: -9, camNodAt: -9,
      missed: 0, forgiven: 0, stageYeps: 0, stageNods: 0, stageVolunteered: 0, stageBoxes: 0, stageSheets: 0,
      agreed: [], said: {}, rowCache: {},
      briefed: false, hint: null, nod: 0, yepT: 0, flash: 0, seen: 0, lastPaste: 0, sheetFlash: 0
    };
    G.tiles = st.cast.map(function (id, i) {
      return { id: id, p: A.PEOPLE[id], i: i, dark: 0, tunnel: 0, tunnelT: 3 + i };
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
      // the callouts land in the inbox column, under the count, where it's empty
      var used = sideUsed();
      L.lane = { x: L.side.x, y: L.side.y + used + 2, w: L.side.w, h: L.side.h - used - 2 };
      if (L.lane.h < 26) L.lane = { x: L.sheet.x, y: L.sheet.y - 2, w: L.sheet.w, h: 26 };
    } else {
      // the callouts get a lane of their own between the call and the work
      // (a phone in the page has no room for one: they land on the sheet's title bar)
      var cramped = L.mode === "square" && avail < 300;
      var lane = L.mode === "wide" ? 40 : cramped ? 8 : 30;
      var callFrac = L.mode === "wide" ? 0.47 : 0.43;
      var ch = Math.round((avail - lane + 8) * callFrac);
      L.call = { x: m, y: top, w: W - m * 2, h: ch };
      var by = top + ch + lane, bh = bottom - by;
      var sideW = Math.round(clamp(W * (L.mode === "wide" ? 0.36 : 0.4), 120, 420));
      L.sheet = { x: m, y: by, w: W - m * 3 - sideW, h: bh };
      var sx = L.sheet.x + L.sheet.w + m;
      var toolsH = touch ? 0 : Math.round(clamp(bh * 0.28, 40, 64));
      var yh = Math.round(Math.min(bh - toolsH - (toolsH ? 6 : 0), sideW / 1.25));
      var yw = Math.round(Math.min(sideW, yh * 1.6));
      L.you = { x: sx + (sideW - yw) / 2, y: by, w: yw, h: yh };
      L.tools = touch ? null : { x: sx, y: by + yh + 6, w: sideW, h: toolsH };
      L.side = null;
      L.lane = cramped ? { x: L.sheet.x, y: by - 2, w: L.sheet.w, h: 26 } : { x: L.sheet.x, y: top + ch + 2, w: L.sheet.w, h: lane - 4 };
    }
    // the call's grid
    fitGrid();
    placeKitBits();
    A.init(T, DPR);
    bg = null;
    tagCache = {};
  }

  // A square screen (a phone in the page) has no room for twelve faces: it
  // shows five, the host and whoever's spoken lately, and a "+7 others" tile,
  // the way call software does.
  var CROWD = 6;
  function crowded() { return L.mode === "square" && G.tiles.length > CROWD; }
  function shownTiles() {
    if (!crowded()) { G.tiles.forEach(function (t) { t.hidden = false; }); return G.tiles; }
    if (!G.vis) {
      var host = tileOf(info().host);
      G.vis = [host].concat(G.tiles.filter(function (t) { return t !== host; }).slice(0, CROWD - 2));
    }
    G.tiles.forEach(function (t) { t.hidden = G.vis.indexOf(t) < 0; });
    G.others = G.others || { id: "others", p: { id: "others", name: "", room: "none", special: "others" }, i: CROWD, dark: 0 };
    G.others.n = G.tiles.length - G.vis.length;
    return G.vis.concat([G.others]);
  }
  // Someone hidden speaks (or is spoken to): they take the place of whoever's
  // been quiet longest, never the host's
  function bringIn(t) {
    if (!t || !crowded() || !t.hidden || !G.vis) return;
    var slot = -1, oldest = Infinity;
    for (var i = 1; i < G.vis.length; i++) {
      var v = G.vis[i];
      if (G.speaking[v.id]) continue;
      var at = v.lastSpoke || -1;
      if (at < oldest) { oldest = at; slot = i; }
    }
    if (slot < 0) slot = G.vis.length - 1;
    var out = G.vis[slot];
    G.vis[slot] = t;
    bg = null;
    t.x = out.x; t.y = out.y; t.w = out.w; t.h = out.h;
    t.hidden = false;
    out.hidden = true;
  }

  function fitGrid() {
    var shown = shownTiles();
    var n = shown.length, c = L.call;
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
    shown.forEach(function (t, i) {
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
    // the callouts: in their lane, sized to fit it (and its width, for the
    // longest of them), never over a face, a name tag or the rows
    var cl = root.querySelector(".kit-callouts");
    if (cl && L.lane) {
      var ln = L.lane;
      var f = clamp(Math.min((Math.min(ln.h, 40) - 10) / 1.83, (ln.w - 12) / 11.5), 12, 16);
      var h = f * 1.83 + 6;
      cl.style.setProperty("--om-callout", f.toFixed(1) + "px");
      cl.style.top = Math.round(ln.y + Math.max(0, (Math.min(ln.h, 48) - h) / 2)) + "px";
      cl.style.bottom = "auto";
      cl.style.left = Math.round(ln.x) + "px";
      cl.style.right = Math.round(W - ln.x - ln.w) + "px";
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
      r.hit = true;
      run.wrong++;
      run.streak = 0;
      sfx.wrong();
      shake(0.35);
      if (G.share) loseRep("share", pickFrom("oops", SHARE_OOPS), reactor());
      else say("Not responding", 1, true);
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
    nextRow();
    G.pasted = 1;
    sfx.paste(run.streak);
    if (mult() > m0) { say("Streak: x" + mult(), 1, true); sfx.streak(); }
    if (G.sheetRow >= SHEET_ROWS) saveSheet();
  }
  function nextRow() {
    G.row++;
    G.sheetRow++;
    G.rowAnim = 1;
    G.rowT = 0;
  }
  // A row that wants nothing (locked, or Pam's already done it) goes by on
  // its own, once you've left it alone for a moment
  function tickRows(dt) {
    var r = curRow();
    if (!r || !r.skip || G.stall > 0) return;
    G.rowT += dt;
    if (G.rowT < SKIP_WAIT) return;
    r.state = "skipped";
    if (!r.hit) run.learned.skip = true;
    nextRow();
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
    if (pts) G.pops.push({ x: s.x + s.w - 34, y: s.y + g.tb + g.fb * 0.5 + 4, text: "+" + pts, t: 0 });
    // and an email answered: it flies out of the inbox
    if (run.inbox > 0) {
      run.inbox--;
      var ib = inboxSpot();
      G.flights.push({ x0: ib.x, y0: ib.y, x1: ib.x + 40, y1: L.call.y + L.call.h * 0.3, t: 0, dur: 0.5 });
      if (run.inbox === 0 && !G.zeroSaid) { G.zeroSaid = true; say("Inbox zero", 2, true); sfx.zero(); }
    }
    sfx.save();
    if (G.share) {
      run.score += 100;
      var line = G.share.saved.shift();
      if (line) speak(reactor(), line, 1.6);
    }
  }

  // ---------------------------------------------------------------------------
  // The meeting: your tile's three buttons
  // ---------------------------------------------------------------------------
  // The tell: everyone has turned to look at you, and something's about to
  // be said. A press now isn't held against you: it waits for what it was
  // for, and if that isn't what comes, it's dropped.
  function tellOn() { return !!(G.pre && !G.pre.done && G.phase === "play" && G.pre.t - G.time <= PRE + 0.05); }
  function hold(kind) { G.held = { kind: kind, at: G.time }; }
  // A second press straight after you've dealt with something is the same press
  function justDone() { return G.time - G.closedAt < 0.45; }

  function nod() {
    if (G.phase !== "play") return;
    var o = G.open;
    if (!o && (tellOn() || roundNextIsYou())) { hold("nod"); return; }
    if (!o && justDone()) return;
    G.nod = 1;
    sfx.nod();
    if (o && o.kind === "name") { handled(o, "nod"); return; }
    if (o && (o.kind === "ask" || o.kind === "round" || o.kind === "share")) {
      if (!o.nodSaid) { o.nodSaid = true; speak(o.who, G.cam.on ? NOD_AT_ASK : NOD_NO_CAM, 1.6); }
      return;
    }
    // with the camera off, nobody can see a nod: it costs nothing
    if (!G.cam.on) {
      if (G.time - G.camNodAt > 3) { G.camNodAt = G.time; speak(reactor(), NOD_NO_CAM, 1.6); }
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
    var o = G.open;
    if (!o && (tellOn() || roundNextIsYou())) { hold("mic"); return; }
    if (!o && justDone()) return;
    m.live = true;
    m.heard = false;
    m.max = info().grace * run.mods.grace;
    m.left = m.max;
    m.t = 0;
    sfx.unmute();
    yep();
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

  // Every yep goes on the record
  function yep() {
    G.yepT = 1.2;
    run.yeps++;
    G.stageYeps++;
    sfx.yep();
    G.bubbles = G.bubbles.filter(function (b) { return b.who !== "you"; });
    G.bubbles.push({ who: "you", text: YEP, t: 0, life: 1.2 });
  }

  function volunteer() {
    if (G.time - G.volunteerAt < VOLUNTEER_GAP) return;
    G.volunteerAt = G.time;
    run.volunteered++;
    G.stageVolunteered++;
    speak(reactor(), pickFrom("volunteer", VOLUNTEER), 1.8);
    addStamp("Volunteered", 0.9);
    say("Volunteered", 1);
    addEmail({ from: "Graham", subject: "Action: Sam" }, true);
    lookAtYou(1.2);
  }

  // Anyone but the host in the last meeting (he's reading the email out),
  // and never the notetaker, the phone or Dave
  function reactor() {
    var st = info();
    return pick(st.cast.filter(function (id) {
      return id !== "notes" && id !== "phone" && id !== "dave" && !(st.id === "email" && id === st.host);
    }));
  }
  // Reactions to what you do are left to chance, but not said twice running
  var decks = {};
  function pickFrom(name, list) { return (decks[name] || (decks[name] = deck(list)))(); }

  // Something's been dealt with or missed: its bubble stops being for you
  function settle() {
    G.bubbles.forEach(function (b) {
      if (b.toYou) { b.toYou = false; b.life = Math.min(b.life, b.t + 0.6); }
    });
  }

  // Something addressed to you, dealt with
  function handled(o, how) {
    o.state = "done";
    G.open = null;
    G.closedAt = G.time;
    settle();
    var pts = 0, label = "";
    if (how === "nod") { pts = Math.round(PTS.nod * run.mods.nodPts); label = "Nodded"; run.nods++; G.stageNods++; run.learned.nod = true; }
    else {
      // keen: answered quickly (not just already live when they asked)
      var fast = how === "yep" && G.time - o.opened <= KEEN;
      pts = PTS.yep + (fast ? PTS.keen : 0);
      label = fast ? "Keen" : "Yep";
      run.learned.yep = true;
      // and they take it at its word
      if (o.agree) G.agreed.push(o.agree);
      if (o.reply) G.later.push({ t: G.time + 0.9, who: o.who, line: o.reply });
    }
    run.score += pts;
    addStamp(label, 0.75);
    if (pts) popAtYou("+" + pts);
    if (o.kind === "round") roundNext(0.9);
    if (o.kind === "share") startShare();
    // they carry on: a moment later, nobody's looking at you any more
    if (G.gaze && G.gaze.target === "you") G.gaze.t = Math.min(G.gaze.t, 0.5);
  }

  function missed(o) {
    o.state = "missed";
    G.open = null;
    G.closedAt = G.time;
    settle();
    var line = o.kind === "name" ? pickFrom("missName", MISS_NAME) : pickFrom("missAsk", MISS_ASK);
    // a question you could have agreed to: they take silence as a yes
    if (o.agree) { line = TAKE_AS_YES; G.agreed.push(o.agree); }
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
    if (line) speak(who || (info().id === "email" ? reactor() : info().host), line, 2);
    addStamp(why === "cat" ? "Cat: seen" : why === "dish" ? "Heard" : why === "chase" ? "Unread" : why === "share" ? "Seen" : "Missed", 1);
    lookAtYou(1.6);
    paintHud();
    if (run.rep <= 0) removed();
  }

  // ---------------------------------------------------------------------------
  // Beats: things people say, on a timetable
  // ---------------------------------------------------------------------------
  var PRE = 0.6;      // the tell: everyone turns to look at you this long before they say it
  function tickBeats() {
    for (var i = 0; i < G.beats.length; i++) {
      var b = G.beats[i];
      if (b.done) continue;
      // one thing at a time for you, with a breath between; nothing else
      // while you're sharing or they're going round. Nobody names you while
      // your camera's off (they can't see a nod). The cat waits for the share
      // and the round, and in the team meeting for whatever's open.
      var mine = b.kind === "name" || b.kind === "ask" || b.kind === "share";
      var busy = (mine || b.kind === "round") && (G.share || G.open || G.round || G.time - G.closedAt < 0.9);
      if (b.kind === "name" && !G.cam.on) busy = true;
      if (b.t > G.time) {
        if (mine && !busy && b.t - G.time <= PRE && G.pre !== b) { G.pre = b; G.preAt = G.time; lookAtYou(PRE + 0.3); }
        continue;
      }
      if (b.kind === "cat") busy = G.share || G.round || G.cat || (run.stage < 2 && G.open);
      if (busy) { b.t = G.time + 0.3; continue; }
      b.done = true;
      fire(b);
    }
  }

  // The meeting's chatter: each queue in order, a breath between lines, and
  // out of the way of anything that's for you (the email is read on regardless)
  function tickChatter() {
    G.chat.forEach(function (q) {
      var b = q.lines[q.i];
      if (!b || b.t > G.time || G.time - q.last < CHAT_GAP || !chatClear(b)) return;
      q.i++;
      q.last = G.time;
      fire(b);
    });
  }
  function chatClear(b) {
    if (G.open && G.open.who === b.who) return false;      // they're asking you something
    if (b.kind === "email") return true;
    if (G.round || G.share || tellOn()) return false;
    return !(G.open && G.time - G.open.opened < 0.7);
  }
  // Replies, a moment after the line they answer
  function tickLater() {
    G.later = G.later.filter(function (l) {
      if (l.t > G.time) return true;
      if (G.open && G.open.who === l.who) { l.t = G.time + 0.4; return true; }
      speak(l.who, l.line, 1.4);
      return false;
    });
  }

  function fire(b) {
    var st = info();
    switch (b.kind) {
      case "name":
      case "ask":
      case "share": {
        var win = (b.kind === "name" ? st.nameWin * run.mods.nameWin : st.askWin * run.mods.askWin);
        G.open = { kind: b.kind, who: b.who, line: b.line, reply: b.reply, agree: b.agree, opened: G.time, deadline: G.time + win, win: win, state: "open" };
        speak(b.who, b.line, win + 0.3, true);
        lookAtYou(win);
        if (b.kind === "name") sfx.named(); else sfx.asked();
        // if you're already live, you just answer
        if (b.kind !== "name" && G.mic.live) { G.mic.answered = true; G.mic.left = G.mic.max; yep(); handled(G.open, "auto"); }
        // a press made during the tell: now it counts, if it was the right one
        var h = G.held;
        G.held = null;
        if (h && G.open && G.time - h.at < 1.2) {
          if (h.kind === "nod" && b.kind === "name") nod();
          else if (h.kind === "mic" && b.kind !== "name") mic();
        }
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
          if (b.reply) G.later.push({ t: G.time + 1.1, who: b.target, line: b.reply });
        }
        break;
      }
      case "everyone":
        G.lastDecoy = G.time;
        speak(b.who, b.line, 1.9);
        if (b.reply && b.replyBy) G.later.push({ t: G.time + 1.1, who: b.replyBy, line: b.reply });
        break;
      case "email":
        speak(b.who, b.line, 2.3);
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
      G.closedAt = G.time;
      return;
    }
    var who = r.order[r.i];
    if (who.id === "you") {
      var win = info().askWin * run.mods.askWin + 0.4;
      G.open = { kind: "round", who: info().host, line: "Sam?", opened: G.time, deadline: G.time + win, win: win, state: "open" };
      speak(info().host, "Sam?", win, true);
      lookAtYou(win);
      sfx.asked();
      if (G.mic.live) { G.mic.answered = true; G.mic.left = G.mic.max; yep(); handled(G.open, "auto"); }
      // unmuted while "You're next" was up: that was for this
      var h = G.held;
      G.held = null;
      if (h && G.open && h.kind === "mic" && G.time - h.at < 2) mic();
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
    G.share = { t: -0.5, dur: 8, saved: SHARE_SAVED.slice() };
    say("Screen: shared", 2);
    sfx.share();
  }
  function tickShare(dt) {
    var s = G.share;
    if (!s) return;
    s.t += dt;
    if (s.t > 2.5 && !s.said) { s.said = true; speak(pick(info().cast.filter(function (id) { return id !== "notes" && id !== info().host; })), pickFrom("shareLines", SHARE_LINES), 1.6); }
    if (s.t >= s.dur) {
      G.share = null;
      speak(info().host, SHARE_END, 1.8);
      G.closedAt = G.time;
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
    loseRep("cat", pickFrom("cat", CAT_SEEN), pick(info().cast.filter(function (id) { return id !== "notes" && id !== "phone" && id !== "dave"; })));
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
      loseRep("cam", pickFrom("cam", CAM_LONG));
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
      loseRep("dish", pickFrom("dish", DISH));
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
        loseRep("chase", pickFrom("chase", CHASE), who);
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
    // the last meeting's last line is the punchline: it gets a beat of its own
    var lastOne = run.stage === LAST;
    speak(st.host, ENDS[run.stage], lastOne ? 4.2 : 2.4);
    if (lastOne) window.setTimeout(function () { sfx.leave(); }, 1500);
    else sfx.leave();
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

  // The notetaker's summary of the meeting: every yep is on the record, and
  // everything you agreed to is read back. Volunteering counts too.
  var WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
  function times(n) { return n === 1 ? "once" : n === 2 ? "twice" : (WORDS[n] || String(n)) + " times"; }
  function listOf(items) {
    var seen = [];
    items.forEach(function (x) { if (seen.indexOf(x) < 0) seen.push(x); });
    if (seen.length > 3) seen = seen.slice(0, 3).concat(["more"]);
    return seen.length < 2 ? seen.join("") : seen.slice(0, -1).join(", ") + " and " + seen[seen.length - 1];
  }
  function summary() {
    var y = G.stageYeps, acts = G.agreed.length + G.stageVolunteered;
    var line = "Notetaker: " + (y ? "Sam said yep " + times(y) + "." : "Sam said nothing.");
    if (G.agreed.length) line += " Sam agreed to " + listOf(G.agreed) + ".";
    var n = WORDS[acts] || String(acts);
    line += " " + (acts === 0 ? "No action points." : acts === 1 ? "One action point, Sam's." :
      n.charAt(0).toUpperCase() + n.slice(1) + " action points, all Sam's.");
    return line;
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
    // today's run says which day it was (and drops the boxes, so it fits a phone)
    if (shell.daily) stats.splice(1, 1, { label: "Run", value: shell.today });
    shell.finish({
      place: rank,
      total: 4,
      stamp: stamp,
      heading: survived ? "You got through four meetings." : "Removed from " + where + " at " + run.removedAt + ".",
      line: rank === 4 ? RESULT_LINES[3][run.stage] : RESULT_LINES[rank - 1],
      stats: stats,
      share: fmt(score) + " points, " + (survived ? "four meetings" : "removed from " + where) + ", said yep " + times(run.yeps),
      delay: survived ? 3800 : 2600
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
      tickChatter();
      tickLater();
      tickRows(dt);
      tickRound(dt);
      tickShare(dt);
      tickCat(dt);
      tickCam(dt);
      tickMic(dt);
      tickMail();
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
    if (G.pasted > 0) G.pasted = Math.max(0, G.pasted - dt * 6);
    if (G.nod > 0) G.nod = Math.max(0, G.nod - dt * 1.9);
    if (G.yepT > 0) G.yepT -= dt;
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 1.6);
    if (G.seen > 0) G.seen -= dt;
    if (G.suds > 0) G.suds -= dt;
    if (G.sheetFlash > 0) G.sheetFlash = Math.max(0, G.sheetFlash - dt * 3);
    if (shakeAmt > 0) shakeAmt = Math.max(0, shakeAmt - dt * 3);
    if (G.gaze && (G.gaze.t -= dt) <= 0) G.gaze = null;
    G.tiles.forEach(function (t) {
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
      if (G.phase === "done") t.dark = clamp((G.endT - 1.6 - t.i * 0.14) * 3, 0, 1);
      if (G.phase === "removed") t.dark = clamp((G.endT - 0.2) * 3, 0, 1);
    });
    // the dishwasher's hum while you're live
    if (G.mic.live && G.phase === "play") {
      hum.t -= dt;
      if (hum.t <= 0) { hum.t = 0.16; sfx.hum(1 - G.mic.left / G.mic.max); }
    }
  }

  // What you did lands at the bottom of your tile, over your shirt, clear of
  // your mouth and the tags; points go top right, where the badge was
  function addStamp(text, life) {
    var y = L.you, size = stampSize();
    G.stamps.push({ x: y.x + y.w * 0.5, y: y.y + y.h - size * 1.3, text: text, t: 0, life: life || 0.8, tilt: (Math.random() - 0.5) * 0.24 });
  }
  function stampSize() { return clamp(L.you.h * 0.1, 13, 20); }
  function popAtYou(text) {
    var y = L.you, rad = badgeRadius(y);
    if (y.w < 170) return;
    G.pops.push({ x: y.x + y.w - rad - 8, y: y.y + rad + 8 + (G.open ? rad * 2 + 16 : 0), text: text, t: 0 });
  }

  // Someone says something: a bubble from their tile, and their mouth moves
  function speak(who, text, life, toYou) {
    if (!who || !text) return;
    var st0 = tileOf(who);
    if (st0) { bringIn(st0); st0.lastSpoke = G.time; }
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
    if (DEBUG) (G.log || (G.log = [])).push([Math.round(G.time * 10) / 10, who, text]);
    G.speaking[who] = Math.min(life || 1.8, 0.35 + text.length * 0.045);
    sfx.voice(who, text);
  }

  function tileOf(id) {
    for (var i = 0; i < G.tiles.length; i++) if (G.tiles[i].id === id) return G.tiles[i];
    return null;
  }
  function lookAtYou(t) { G.gaze = { target: "you", t: t }; }
  function lookAtTile(tile, t) { bringIn(tile); G.gaze = { target: tile, t: t }; }

  // Callouts: one at a time, the important ones win. Routine ones (the
  // streak, inbox zero, not responding) land once a meeting.
  function say(text, priority, routine) {
    if (!shell || (shell.state() !== "playing" && priority < 3)) return;
    var key = routine ? text.split(":")[0] : null;
    if (key && G.said[key]) return;
    var now = performance.now() / 1000;
    if (now - calloutAt < 1.5 && priority <= calloutPri) return;
    if (key) G.said[key] = true;
    calloutAt = now;
    calloutPri = priority;
    placeKitBits();
    // a small tilt (never straight), so the stamp stays in its lane
    shell.callout(text, { sound: priority >= 2, tilt: (Math.random() < 0.5 ? -1 : 1) * (1.5 + Math.random() * 1.5) });
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
      if (auto.camFor !== c) {
        auto.camFor = c;
        // filming a clip, the first cat of the day gets seen: it's the moment to film
        var late = N.flags.clip && !run.clipCat;
        run.clipCat = true;
        auto.cam = late ? 99 : (0.4 + Math.random() * 0.45) / SKILL;
      }
      if (auto.cam <= 0) { cam(); auto.work = 0.12; }
    }
    if (!G.cam.on && (!c || c.phase === "gone")) {
      if (auto.camBack !== c || auto.camBackSet === undefined) { auto.camBack = c; auto.camBackSet = true; auto.cam = Math.max(auto.cam, (0.35 + Math.random() * 0.4) / SKILL); }
      if (auto.cam <= 0) { cam(); auto.camBackSet = undefined; auto.work = 0.12; }
    }
    if (busy && auto.react < 0.25) return;
    if (auto.work <= 0 && G.stall <= 0) {
      var row = curRow();
      if (row && !row.skip) {
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
    if (curRow() && curRow().skip && !run.learned.skip) {
      G.hint = { at: "row", word: "Leave it" };
      return;
    }
    if ((run.learned.paste || 0) < 4 && G.stall <= 0 && curRow() && !curRow().skip) {
      var side = curRow().empty;
      G.hint = { at: "box", side: side, word: touch ? "Tap" : keys ? (side ? "Right" : "Left") : "Click" };
    }
  }

  // The meeting's notice: what's new, and what to do about it
  function notice() {
    var touch = touching(), text;
    if (run.stage === 0) {
      text = touch ? "Tap the empty box in each row. Someone says your name: Nod. Someone asks you something: Mic, then Mic again to mute."
        : "Paste into the empty box: left or right. Someone says your name: nod (N or Down). Someone asks you something: unmute (Space or Up), then mute again.";
    } else if (run.stage === 1) {
      text = "The cat has found out you're on a call. When the door opens, " + (touch ? "camera off (Cam)" : "camera off (C)") +
        " before it reaches the desk, and back on once it's gone. A row that says Do not edit: leave it.";
    } else if (run.stage === 2) {
      text = "Questions to everyone aren't for you. Only answer the ones with your name in. When they go round the room, unmute when it gets to you. Pam has done some rows: leave those.";
    } else {
      text = "Graham is reading out an email. He'll ask you to share your screen: say yep, then don't paste into a full box while everyone's watching.";
    }
    shell.brief({ title: info().name, text: text, ms: NOTICE_MS[run.stage] });
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
    var sx = 0, sy = 0;
    if (shakeAmt > 0) {
      sx = (Math.random() - 0.5) * 7 * shakeAmt; sy = (Math.random() - 0.5) * 7 * shakeAmt;
      c.fillStyle = T.ink;
      c.fillRect(0, 0, W, H);
    }
    if (!bg) buildBg();
    c.setTransform(DPR, 0, 0, DPR, sx * DPR, sy * DPR);
    // everything that doesn't change is one bitmap; the rest is drawn over it
    c.drawImage(bg, 0, 0, W, H);
    var now = G.time + G.endT;
    G.tiles.forEach(function (t) { if (!t.hidden) drawTile(c, t, now); });
    if (crowded() && G.others) drawOthers(c, G.others);
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

  // ---------------------------------------------------------------------------
  // The background: everything that stays put, drawn once into a bitmap (the
  // tiles' rooms and people, your kitchen and shoulders, the sheet's window),
  // and drawn again only when the layout or the tiles on show change. On a
  // phone that's most of the pixels, so each frame is mostly faces and words.
  // ---------------------------------------------------------------------------
  var bgCanvas = null;
  function buildBg() {
    var cv = bgCanvas || (bgCanvas = document.createElement("canvas"));
    cv.width = Math.max(1, Math.round(W * DPR));
    cv.height = Math.max(1, Math.round(H * DPR));
    var b = cv.getContext("2d");
    b.setTransform(DPR, 0, 0, DPR, 0, 0);
    b.fillStyle = T.ink;
    b.fillRect(0, 0, W, H);
    G.tiles.forEach(function (t) { if (!t.hidden) drawTileStill(b, t); });
    if (crowded() && G.others) drawOthers(b, G.others);
    var r = L.you;
    b.save();
    A.rr(b, r.x, r.y, r.w, r.h, 7);
    b.clip();
    b.drawImage(A.youSprite("room", r.w, r.h), r.x, r.y, r.w, r.h);
    b.drawImage(A.youSprite("body", r.w, r.h), r.x, r.y, r.w, r.h);
    b.restore();
    drawSheetStill(b);
    bg = cv;
  }

  // A tile's still parts: the room and the person (its sprite), its ash
  // frame and its chips
  function drawTileStill(c, t) {
    var x = t.x, y = t.y, w = t.w, h = t.h;
    c.save();
    A.rr(c, x, y, w, h, 6);
    c.clip();
    c.drawImage(A.tileSprite(t.p, w, h), x, y, w, h);
    c.restore();
    A.rr(c, x, y, w, h, 6);
    c.lineWidth = 1.5;
    c.strokeStyle = T.ash;
    c.stroke();
    if (t.p.special === "frozen" && w > 130) chip(c, x + w - 4, y + 4, "Poor connection", "right");
    if (t.p.special === "bot" && w > 100) chip(c, x + w - 4, y + 4, "Recording", "right", T.red);
  }

  // A tile, every frame: the face (and whatever else moves: Keith's train,
  // Mo's trees), the name tag, a violet frame for whoever's talking, and the
  // dark when they've left
  function drawTile(c, t, now) {
    var x = t.x, y = t.y, w = t.w, h = t.h, k = h / 100;
    var moving = t.p.special === "train" || t.p.special === "walk";
    if (moving) {
      c.save();
      A.rr(c, x, y, w, h, 6);
      c.clip();
    }
    c.save();
    c.translate(x + w / 2, y);
    c.scale(k, k);
    A.person(c, t.p, faceFor(t, now), shell.reduceMotion ? 0 : now, w / k, w, h);
    c.restore();
    if (moving) {
      c.restore();
      A.rr(c, x, y, w, h, 6);
      c.lineWidth = 1.5;
      c.strokeStyle = T.ash;
      c.stroke();
    }
    if (t.dark > 0) {
      c.globalAlpha = t.dark;
      A.rr(c, x, y, w, h, 6);
      c.fillStyle = T.ink;
      c.fill();
      c.globalAlpha = 1;
      if (t.dark > 0.8 && w > 80) {
        var ls = Math.max(12, Math.round(h * 0.11));
        c.font = ls + "px " + T.display;
        c.fillStyle = T.paper;
        c.textAlign = "center";
        c.textBaseline = "middle";
        A.text(c, "LEFT", x + w / 2, y + h / 2, ls);
      }
      return;
    }
    // the frame: violet for whoever's talking
    var talking = !!G.speaking[t.id] || (G.round && G.round.order[G.round.i] && G.round.order[G.round.i].id === t.id);
    if (talking) {
      A.rr(c, x, y, w, h, 6);
      c.lineWidth = 3.5;
      c.strokeStyle = T.accent;
      c.stroke();
    }
    // a small tile gets just its mic, and a very small one nothing
    if (w >= 84 && h >= 52) {
      var tg = tagSprite(t.p.name, !!G.speaking[t.id], Math.min(w - 8, 220));
      c.drawImage(tg.cv, x + 4, y + h - 4 - tg.h + 1, tg.w, tg.h);
    } else if (h >= 60 && w >= 60) micTag(c, x + 3, y + h - 3, !!G.speaking[t.id]);
  }

  // A name tag as a bitmap (a dozen of them are drawn every frame)
  var tagCache = {};
  function tagSprite(name, live, maxW) {
    var size = tagSize();
    var key = name + "|" + live + "|" + Math.round(maxW) + "|" + size + "|" + DPR;
    var hit = tagCache[key];
    if (hit) return hit;
    var h = Math.ceil(size * 1.6) + 1, w = Math.ceil(maxW) + 1;
    var cv = document.createElement("canvas");
    cv.width = Math.max(1, Math.round(w * DPR));
    cv.height = Math.max(1, Math.round(h * DPR));
    var c = cv.getContext("2d");
    c.scale(DPR, DPR);
    nameTag(c, 0, h - 1, name, live, maxW, false);
    return (tagCache[key] = { cv: cv, w: w, h: h });
  }

  // The rest of the all-hands, on a square screen
  function drawOthers(c, t) {
    A.rr(c, t.x, t.y, t.w, t.h, 6);
    c.fillStyle = T.ink;
    c.fill();
    c.lineWidth = 1.5;
    c.strokeStyle = T.ash;
    c.stroke();
    var size = clamp(Math.round(t.h * 0.22), 12, 18);
    c.font = size + "px " + T.display;
    c.fillStyle = T.paper;
    c.textAlign = "center";
    c.textBaseline = "middle";
    A.text(c, "+" + t.n, t.x + t.w / 2, t.y + t.h / 2 - size * 0.55, size);
    A.text(c, "OTHERS", t.x + t.w / 2, t.y + t.h / 2 + size * 0.6, size);
    if (t.dark > 0) {
      c.globalAlpha = t.dark;
      A.rr(c, t.x, t.y, t.w, t.h, 6);
      c.fill();
      c.globalAlpha = 1;
    }
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
    if (t.p.special === "frozen" && !G.speaking[t.id]) { f.mood = "sleep"; f.gx = 0; f.gy = 0; }
    if (G.seen > 0 && t.p.special !== "frozen") f.mood = "shock";
    if (G.phase === "removed") f.mood = "shock";
    if (t.p.id === "keith") f.tunnel = t.tunnel;
    return f;
  }

  // A name tag in a tile's corner: ink, paper words, a mic. bg: another
  // colour behind it (yours, while you're live). Returns where it went.
  // ring: you're live, and a ring runs round the mic, so the words start
  // after it rather than under it
  function nameTag(c, x, y, name, live, maxW, rec, bg, ring) {
    var size = tagSize();
    c.font = size + "px " + T.display;
    var label = name.toUpperCase();
    var tw = A.textWidth(c, label, size);
    var icon = size * 1.05;
    var ringR = icon * 0.62 + 2;
    var pad = ring ? icon * 0.12 + 4.5 + size * 0.3 : size * 0.3;
    var room = function () { return tw + size * 0.45 + icon + pad + size * 0.45; };
    var w = Math.min(maxW, room()), h = size * 1.6;
    if (room() > maxW) {
      // too long for the tile: the bit in brackets goes
      label = name.replace(/\s*\(.*\)$/, "").toUpperCase();
      if (ring) label += ": LIVE";
      tw = A.textWidth(c, label, size);
      w = Math.min(maxW, room());
    }
    if (room() > maxW + 1) { icon = 0; w = Math.min(maxW, tw + size * 0.9); }
    A.rr(c, x, y - h, w, h, 3);
    c.fillStyle = bg || T.ink;
    c.fill();
    if (bg) { c.lineWidth = 1.5; c.strokeStyle = T.paper; c.stroke(); }
    var ix = x + size * 0.45 + icon / 2;
    if (icon) A.micIcon(c, ix, y - h / 2, icon, live, bg ? T.paper : live ? T.accent : T.paper);
    c.save();
    c.beginPath();
    c.rect(x, y - h, w - 3, h);
    c.clip();
    c.fillStyle = T.paper;
    c.textAlign = "left";
    c.textBaseline = "middle";
    A.text(c, label, icon ? ix + icon / 2 + pad : x + size * 0.45, y - h / 2 + size * 0.06, size);
    c.restore();
    return { x: x, y: y - h, w: w, h: h, icon: icon ? { x: ix, y: y - h / 2, r: ringR } : null };
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
    var shakeOn = live || G.suds > 0;
    // the kitchen with the door shut and the dishwasher off, and your
    // shoulders, are in the background; your head and face are bitmaps too.
    // Only a moving kitchen, the cat and the camera's screen need the
    // tile's rounded corners to clip to.
    var still = !door && !shakeOn;
    var clipped = !still || cat || !G.cam.on;
    if (clipped) {
      c.save();
      A.rr(c, x, y, w, h, 7);
      c.clip();
    }
    // the cat's eyes in the doorway are behind you; once it's out of the
    // door it's coming towards the camera, so it's in front
    var catFront = cat && (cat.phase === "walk" || cat.phase === "desk" || cat.phase === "leave");
    if (!still || (cat && !catFront)) {
      c.save();
      c.translate(x + w / 2, y);
      c.scale(k, k);
      if (!still) A.yourRoom(c, ww, { door: door, shake: shakeOn ? Math.max(0.3, shakeD) : 0, suds: G.suds > 0 ? clamp(G.suds, 0, 1) : 0, t: shell.reduceMotion ? 0 : now });
      if (cat && !catFront) drawCat(c, cat, ww, now);
      c.restore();
    }
    A.youFromSprites(c, x, y, w, h, yourFace(now), !still);
    if (catFront) {
      c.save();
      c.translate(x + w / 2, y);
      c.scale(k, k);
      drawCat(c, cat, ww, now);
      c.restore();
    }
    // the camera's off: only you can see this (dark, but the cat shows through)
    if (!G.cam.on) {
      c.fillStyle = A.dots(c, T.ink, 3.2, 0.56);
      c.fillRect(x, y, w, h);
    }
    if (clipped) c.restore();
    // the frame: violet when they want something from you. Just before (the
    // tell, while everyone turns to look, or when you're next), it's dashed:
    // get ready, not yet.
    var o = G.open;
    var next = !o && roundNextIsYou();
    var coming = !o && (next || tellOn());
    A.rr(c, x, y, w, h, 7);
    var pulse = shell.reduceMotion ? 1 : 0.5 + 0.5 * Math.abs(Math.sin(now * 6));
    if (coming) {
      c.setLineDash([8, 6]);
      c.lineWidth = 2.5;
      c.strokeStyle = T.accent;
      c.stroke();
      c.setLineDash([]);
    } else {
      c.lineWidth = o ? 3 + pulse * 2 : G.flash > 0 ? 4 : 2;
      c.strokeStyle = o ? T.accent : G.flash > 0 && Math.floor(G.flash * 8) % 2 ? T.red : T.paper;
      c.stroke();
    }
    // your name tag, top left, with your mic: violet (then red) while you're live
    var left = live ? clamp(G.mic.left / G.mic.max, 0, 1) : 1;
    var tag = nameTag(c, x + 5, y + 5 + tagSize() * 1.6, live ? "Sam (you): live" : "Sam (you)", live, w - 10, false,
                      live ? (left < 0.35 ? T.red : T.accent) : null, live);
    // (while you're live it goes under the "Mute again" tag)
    if (!G.cam.on) camOffCard(c, r, live ? tag.y + tag.h + 27 : 0);
    if (live) micRing(c, r, tag, left);
    if (o) badge(c, r, o, now);
    else if (next) chip(c, x + w - 6, y + 6, "You're next", "right", T.accent);
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
    var name = o.kind === "name";
    if (name) {
      var size = Math.round(rad * 0.62);
      c.font = size + "px " + T.display;
      c.fillText("SAM", 0, size * 0.06);
    } else {
      var size2 = Math.round(rad * 1.25);
      c.font = size2 + "px " + T.display;
      c.fillText("?", 0, size2 * 0.08);
    }
    // which button: its icon, tucked into the badge's corner
    var sr = Math.max(9, rad * 0.5), sx = -rad * 0.86, sy = rad * 0.72;
    A.ell(c, sx, sy, sr, sr);
    A.fill(c, T.ink, 1.6, T.paper);
    if (name) A.nodIcon(c, sx, sy, sr * 1.45, T.paper);
    else A.micIcon(c, sx, sy, sr * 1.45, false, T.paper);
    c.restore();
    // and its key or button underneath, all through the first meeting
    if (run.stage === 0 || !run.learned[name ? "nod" : "yep"]) {
      var touch = touching(), mouseOn = !touch && pointerMode === "mouse";
      var word = touch ? (name ? "Tap Nod" : "Tap Mic") : mouseOn ? (name ? "Click Nod" : "Click Unmute") : (name ? "N or Down" : "Space or Up");
      chip(c, r.x + r.w - 6, by + rad + 7, word, "right", T.ink);
    }
  }
  function badgeRadius(r) { return clamp(r.h * 0.17, 15, 26); }

  // You're live: a ring round your mic, running down, and what to do about it
  function micRing(c, r, tag, left) {
    if (tag.icon) {
      var ic = tag.icon;
      c.beginPath();
      c.arc(ic.x, ic.y, ic.r, 0, Math.PI * 2);
      c.lineWidth = 5;
      c.strokeStyle = T.ink;
      c.stroke();
      c.beginPath();
      c.arc(ic.x, ic.y, ic.r, -Math.PI / 2, -Math.PI / 2 + left * Math.PI * 2);
      c.lineWidth = 3;
      c.strokeStyle = left < 0.35 ? T.red : T.paper;
      c.stroke();
    }
    chip(c, r.x + 5, tag.y + tag.h + 5, "Mute again", "left", left < 0.35 ? T.red : T.ink);
  }

  // The camera's off: a label over where your face was, and how long they'll wait
  function camOffCard(c, r, minY) {
    var size = 12;
    c.font = size + "px " + T.display;
    var cw = A.textWidth(c, "CAMERA OFF", size) + size * 0.9;
    var cy = Math.max(r.y + r.h * 0.34, minY || 0);
    chip(c, r.x + (r.w - cw) / 2, cy, "Camera off", "left");
    // how long before they ask: only when there's no cat about
    if (!catAbout() && G.cam.off > 0) {
      var left = clamp(1 - G.cam.off / CAM_GRACE, 0, 1);
      var bw = Math.min(r.w * 0.6, 140), bx = r.x + (r.w - bw) / 2, by = cy + size * 2;
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
      { key: "mic", label: G.mic.live ? "Mute" : "Unmute", keyName: "Space or Up", short: "Space" },
      { key: "cam", label: "Camera", keyName: "C" },
      { key: "nod", label: "Nod", keyName: "N or Down", short: "N" }
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
      // both keys if they fit (down to 12px), otherwise the main one
      var label = (showKeys ? b.keyName : b.label).toUpperCase(), ls = size;
      if (showKeys && b.short && A.textWidth(c, label, ls) > b.w - 8) {
        ls = 12;
        c.font = ls + "px " + T.display;
        if (A.textWidth(c, label, ls) > b.w - 8) { ls = size; c.font = ls + "px " + T.display; label = b.short.toUpperCase(); }
      }
      A.text(c, label, ix, b.y + b.h - size * 0.85, ls);
    });
  }

  // Tall screens: the inbox beside your tile
  // the inbox's count and slots, at the top of the column; the rest of the
  // column is where the callouts land
  function sideMetrics() {
    var size = W < 480 ? 12 : 13;
    var big = Math.round(clamp(L.side.h * 0.3, 22, 40));
    return { size: size, big: big, used: size * 1.6 + big + 4 + 9 + 4 };
  }
  function sideUsed() { return sideMetrics().used; }
  function drawSide(c) {
    var r = L.side;
    if (!r || r.h < 30) return;
    var sm = sideMetrics(), size = sm.size;
    c.font = size + "px " + T.display;
    c.fillStyle = T.smoke;
    c.textAlign = "left";
    c.textBaseline = "top";
    A.text(c, "INBOX", r.x + 2, r.y + 2, size);
    var full = run.inbox >= INBOX_MAX - 2;
    var big = sm.big;
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

  function sheetSize(g) { return W < 480 ? 12 : clamp(Math.round(g.rh * 0.36), 12, 17); }
  // The window's top with its rounded corners (the title bar), and the part
  // the rows scroll through, with its rounded bottom corners
  function titlePath(c, s, tb) {
    var r = 6;
    c.beginPath();
    c.moveTo(s.x, s.y + tb);
    c.lineTo(s.x, s.y + r);
    c.arcTo(s.x, s.y, s.x + r, s.y, r);
    c.lineTo(s.x + s.w - r, s.y);
    c.arcTo(s.x + s.w, s.y, s.x + s.w, s.y + r, r);
    c.lineTo(s.x + s.w, s.y + tb);
    c.closePath();
  }
  function rowsPath(c, s, top) {
    var r = 6, b = s.y + s.h;
    c.beginPath();
    c.moveTo(s.x, top);
    c.lineTo(s.x + s.w, top);
    c.lineTo(s.x + s.w, b - r);
    c.arcTo(s.x + s.w, b, s.x + s.w - r, b, r);
    c.lineTo(s.x + r, b);
    c.arcTo(s.x, b, s.x, b - r, r);
    c.closePath();
  }

  // The sheet's still parts, into the background: the window, the clipboard
  // bar and the column letters
  function drawSheetStill(c) {
    var g = sheetGeom(), s = g.s, size = sheetSize(g);
    A.rr(c, s.x, s.y, s.w, s.h, 6);
    c.fillStyle = T.paper;
    c.fill();
    // formula bar: what's on the clipboard
    var fy = s.y + g.tb;
    c.beginPath();
    c.moveTo(s.x, fy + g.fb); c.lineTo(s.x + s.w, fy + g.fb);
    c.moveTo(s.x, fy); c.lineTo(s.x + s.w, fy);
    A.stroke(c, 1.5, T.ink);
    c.font = size + "px " + T.display;
    c.fillStyle = T.ink;
    c.textAlign = "left";
    c.textBaseline = "middle";
    A.text(c, "PASTE:", s.x + 10, fy + g.fb / 2 + size * 0.06, size);
    var pw = A.textWidth(c, "PASTE:", size);
    c.fillStyle = T.accent;
    A.text(c, info().clip.toUpperCase(), s.x + 18 + pw, fy + g.fb / 2 + size * 0.06, size);
    // column headers
    var hy = fy + g.fb;
    if (g.hb) {
      c.fillStyle = A.shadeLight(c);
      c.fillRect(s.x + 1.5, hy, s.w - 3, g.hb);
      c.font = Math.max(12, g.hb - 3) + "px " + T.display;
      c.fillStyle = T.ink;
      c.textAlign = "center";
      c.fillText("A", s.x + g.gut + 2 + g.colW / 2, hy + g.hb / 2 + 1);
      c.fillText("B", s.x + g.gut + 2 + g.colW * 1.5, hy + g.hb / 2 + 1);
      c.beginPath();
      c.moveTo(s.x, hy + g.hb); c.lineTo(s.x + s.w, hy + g.hb);
      A.stroke(c, 1.5, T.ink);
      c.beginPath();
      c.moveTo(s.x + g.gut, hy); c.lineTo(s.x + g.gut, hy + g.hb);
      A.stroke(c, 1.5, T.ink);
    }
  }

  // The sheet, every frame: the title bar (the sheet's name, new mail, the
  // inbox), the rows, the selection, and the frame
  function drawSheet(c, now) {
    var g = sheetGeom(), s = g.s;
    var size = sheetSize(g);
    c.save();
    // title bar
    titlePath(c, s, g.tb);
    c.fillStyle = G.stall > 0 ? T.paper : T.accent;
    c.fill();
    c.beginPath();
    c.moveTo(s.x, s.y + g.tb); c.lineTo(s.x + s.w, s.y + g.tb);
    A.stroke(c, 1.5, T.ink);
    c.font = size + "px " + T.display;
    c.textAlign = "left";
    c.textBaseline = "middle";
    var title = (G.sheetNames[G.sheetIdx % G.sheetNames.length] + (G.stall > 0 ? " (not responding)" : "")).toUpperCase();
    var inboxW = L.side && L.side.h >= 30 ? 0 : drawInbox(c, g, size);
    c.save();
    c.beginPath();
    c.rect(s.x + 3, s.y + 1.5, s.w - inboxW - 13, g.tb - 2.25);
    c.clip();
    // new mail takes over the title bar for a moment: who from, and what about
    var mail = G.toasts.length && G.stall <= 0 ? G.toasts[G.toasts.length - 1] : null;
    if (mail && mail.t < 2.2) {
      var ew = size * 1.3;
      c.fillStyle = T.paper;
      c.fillRect(s.x, s.y, s.w - inboxW - 10, g.tb);
      A.envelope(c, s.x + 10 + ew / 2, s.y + g.tb / 2, ew, 0);
      c.fillStyle = T.ink;
      A.text(c, (mail.from + ": " + mail.subject).toUpperCase(), s.x + 18 + ew, s.y + g.tb / 2 + size * 0.06, size);
    } else {
      c.fillStyle = T.ink;
      A.text(c, title, s.x + 10, s.y + g.tb / 2 + size * 0.06, size);
    }
    c.restore();
    // the rows: one done, the one you're on, the ones coming
    c.save();
    rowsPath(c, s, g.top);
    c.clip();
    var slide = shell.reduceMotion ? 0 : G.rowAnim * g.rh;
    var first = Math.max(0, G.row - 1);
    for (var i = first; i < G.row + 6 + run.mods.ahead; i++) {
      var ry = g.activeY + (i - G.row) * g.rh + slide;
      if (ry > s.y + s.h) break;
      drawRow(c, g, i, ry, size, now);
    }
    drawSelection(c, g, g.activeY + slide, now);
    c.restore();
    if (G.stall > 0) A.spinner(c, s.x + s.w / 2, g.activeY + g.rh * 1.6, Math.min(16, g.rh * 0.4), now);
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
    // the row's cells don't change from one frame to the next: a bitmap,
    // unless it's the row that's flashing or saying #N/A
    var flashing = row.state === "done" && i === G.row - 1 && G.pasted > 0.45;
    var wrong = active && G.stall > 0;
    if (flashing || wrong) drawCells(c, g, i, ry, size, num, true);
    else c.drawImage(rowSprite(g, i, size, num), s.x, ry, s.w, g.rh);
    // which sheet the row belongs to: a thick line where a new one starts
    if (num === 1 && i > 0) {
      c.beginPath();
      c.moveTo(s.x, ry); c.lineTo(s.x + s.w, ry);
      A.stroke(c, 3, T.ink);
    }
  }
  // The selection: a thick violet frame round the row you're on, and a caret
  // in the empty box (drawn after the rows, so nothing covers it)
  function drawSelection(c, g, ry, now) {
    var row = curRow();
    if (!row || G.phase !== "play") return;
    var a = boxRect(g, ry, 0);
    c.beginPath();
    c.rect(a.x - 1, ry - 1, g.colW * 2 + 2, g.rh + 2);
    c.lineWidth = 4;
    c.strokeStyle = G.stall > 0 ? T.red : T.accent;
    c.stroke();
    if (G.stall <= 0 && !row.skip && (shell.reduceMotion || Math.floor(now * 2.4) % 2 === 0)) {
      var e = boxRect(g, ry, row.empty);
      c.fillStyle = T.ink;
      c.fillRect(e.x + 10, e.y + g.rh * 0.24, 2, g.rh * 0.52);
    }
  }

  // A row's cells as a bitmap, kept while the row is in view
  function rowSprite(g, i, size, num) {
    var row = G.rows[i];
    var key = row.state + ":" + num + ":" + Math.round(g.s.w) + "x" + Math.round(g.rh) + ":" + size + ":" + DPR;
    var hit = G.rowCache[i];
    if (hit && hit.key === key) return hit.cv;
    var cv = document.createElement("canvas");
    cv.width = Math.max(1, Math.round(g.s.w * DPR));
    cv.height = Math.max(1, Math.round(g.rh * DPR));
    var c = cv.getContext("2d");
    c.scale(DPR, DPR);
    c.translate(-g.s.x, 0);
    drawCells(c, g, i, 0, size, num, false);
    G.rowCache[i] = { key: key, cv: cv };
    // and let go of the rows that have scrolled away
    Object.keys(G.rowCache).forEach(function (n) { if (+n < G.row - 2) delete G.rowCache[n]; });
    return cv;
  }

  // The gutter with the row's number, and its two boxes. live: the moving
  // parts too (the box that's just been pasted into, #N/A)
  function drawCells(c, g, i, ry, size, num, live) {
    var row = G.rows[i], s = g.s, active = live && i === G.row && G.phase === "play";
    c.fillStyle = T.paper;
    c.fillRect(s.x, ry, s.w, g.rh);
    c.fillStyle = A.shadeLight(c);
    c.fillRect(s.x, ry, g.gut, g.rh);
    c.font = size + "px " + T.display;
    c.fillStyle = T.ink;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(String(num), s.x + g.gut / 2, ry + g.rh / 2 + 1);
    c.beginPath();
    c.moveTo(s.x + g.gut, ry); c.lineTo(s.x + g.gut, ry + g.rh);
    A.stroke(c, 1.5, T.ink);
    if (row.skip) drawSkipRow(c, g, row, ry, size, active);
    else for (var side = 0; side < 2; side++) {
      var b = boxRect(g, ry, side);
      var empty = row.empty === side;
      var done = row.state === "done" && empty;
      c.beginPath();
      c.rect(b.x, b.y, b.w, b.h);
      c.fillStyle = T.paper;
      c.fill();
      if (!empty) { c.fillStyle = A.shade(c); c.fill(); }
      // the box you've just pasted into flashes violet for a moment (flat, no tint)
      var flash = live && done && i === G.row - 1 && G.pasted > 0.45;
      if (flash) { c.fillStyle = T.accent; c.fill(); }
      c.lineWidth = 1.2;
      c.strokeStyle = T.ink;
      c.stroke();
      var label = null, col = T.ink;
      if (!empty) label = row.text;
      if (done) { label = info().clip; col = flash ? T.paper : T.accent; }
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
  }

  // A row that wants nothing: locked ("Do not edit", with a padlock), or
  // one Pam has already done. Leave it, and it goes by.
  function drawSkipRow(c, g, row, ry, size, active) {
    var a = boxRect(g, ry, 0), b = boxRect(g, ry, 1);
    [a, b].forEach(function (r) {
      c.beginPath();
      c.rect(r.x, r.y, r.w, r.h);
      c.fillStyle = T.paper;
      c.fill();
      c.fillStyle = A.shade(c);
      c.fill();
      c.lineWidth = 1.2;
      c.strokeStyle = T.ink;
      c.stroke();
    });
    c.font = size + "px " + T.display;
    c.textBaseline = "middle";
    var wrong = active && G.stall > 0;
    function label(text, x, y, maxW, lock) {
      var tw = A.textWidth(c, text, size), lw = lock ? size * 1.1 : 0;
      var w = Math.min(maxW, tw + lw + 10), h = size * 1.44;
      c.fillStyle = T.paper;
      c.fillRect(x - w / 2, y - h / 2, w, h);
      c.lineWidth = 1.5;
      c.strokeStyle = wrong ? T.red : T.ink;
      c.strokeRect(x - w / 2, y - h / 2, w, h);
      var px = x - w / 2 + 5 + lw * 0.4, py = y + size * 0.12, pw = size * 0.62;
      if (lock === "lock") {
        // a padlock
        c.beginPath();
        c.arc(px, py - pw * 0.42, pw * 0.3, Math.PI, 0);
        A.stroke(c, 1.6, T.ink);
        c.fillStyle = T.ink;
        c.fillRect(px - pw / 2, py - pw * 0.4, pw, pw * 0.72);
      } else if (lock) {
        // a tick
        c.beginPath();
        c.moveTo(px - pw * 0.5, py - pw * 0.05);
        c.lineTo(px - pw * 0.12, py + pw * 0.3);
        c.lineTo(px + pw * 0.5, py - pw * 0.55);
        A.stroke(c, 2, T.accent);
      }
      c.fillStyle = wrong ? T.red : T.ink;
      c.textAlign = "left";
      A.text(c, text, x - w / 2 + 5 + lw, y + size * 0.06, size);
    }
    c.save();
    c.beginPath();
    c.rect(a.x, ry, g.colW * 2, g.rh);
    c.clip();
    if (row.skip === "pam") label("DONE BY PAM", a.x + g.colW, ry + g.rh / 2, g.colW * 2 - 8, "tick");
    else label("DO NOT EDIT", a.x + g.colW, ry + g.rh / 2, g.colW * 2 - 8, "lock");
    c.restore();
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
    if (h.at === "box" || h.at === "row") {
      var g = sheetGeom(), b = boxRect(g, g.activeY, h.side || 0);
      return { x: h.at === "row" ? b.x + g.colW : b.x + b.w / 2, y: b.y + 2, dir: "down" };
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
                 rupert: 140, notes: 600, phone: 300, rob: 160, femi: 180, hannah: 280 };
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
      keys: "Left and Right (or A and D) paste. Up or Space to unmute and mute, Down or N to nod, C for the camera. P to pause.",
      touch: "Tap the empty box to paste. Nod, Mic and Cam are along the bottom."
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
    document.fonts.load("12px " + T.display).then(function () { bg = null; tagCache = {}; if (G) G.rowCache = {}; });
  }

  if (DEBUG) {
    window.__onMute = {
      stages: STAGES,
      run: function () { return run; },
      stage: function () { return G; },
      layout: function () { return L; },
      state: function () { return shell.state(); },
      // draw n frames now, each flushed to pixels, and say how long it took (ms a frame)
      bench: function (n) {
        var t0 = performance.now();
        for (var i = 0; i < n; i++) { G.time += 1 / 60; render(1 / 60); ctx.getImageData(0, 0, 1, 1); }
        return (performance.now() - t0) / n;
      },
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
