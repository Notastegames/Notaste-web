// Unexpected Item: a self-checkout, and a timing game.
//
// THE JOKE. Shops replaced the staff with machines, and the machines think
// you're stealing. Till 4 (Bev calls it Dennis) is the comedian: it accuses
// you, apologises, and accuses you again. You, the shopper, are never the
// joke; you're just trying to buy some beans. The one assistant, Bev, covers
// every till in the shop. She walks over slowly and swipes her card without
// looking.
//
// THE CORE LOOP. Your shopping rides along the belt towards the scanner.
// 1. Scan (Space, the Scan button, a click or a tap) as each barcode crosses
//    the red line. Red brackets mark a barcode while it can be scanned. Dead
//    centre is a perfect scan. Too early or too late is a mistimed scan: a
//    rude beep, and the machine gets more suspicious. Anything that gets past
//    the scanner drops down the chute and comes round again.
// 2. The scanned item jumps into your hand. Bag it (B, the Bag button, or a
//    click on the bag). One item at a time: you can't scan the next until
//    this one's in the bag.
// 3. Every time something goes in the bag, the scale wobbles and settles. It
//    says Wait, then OK. Touch the bag while it says Wait and there is an
//    UNEXPECTED ITEM IN THE BAGGING AREA. The till freezes, its light goes
//    on, and Bev sets off. You can fix it yourself with the ritual everyone
//    knows: lift the bag, put it back, each time the scale says OK. Rush the
//    ritual and it accuses you again. Or just wait for Bev.
// One rule for the bag, everywhere: never touch it while the scale says Wait.
//
// SUSPICION. The till's face is a meter (and a gauge on the till spells it
// out). Mistimed scans and wrong fruit make it suspicious; perfect scans calm
// it down. When it fills, it accuses you anyway. Same ritual, same Bev.
//
// THE STAGES. Four shops, each a fresh day with its own closing time.
// 1. A basket. Six things. Learn to scan and bag, and meet the accusation.
// 2. A trolley. Ten things. Adds loose fruit: no barcode, so the belt stops
//    and the till asks ("Lime, lemon, lime or lime."). Pick the matching
//    picture (1 to 4, the arrows and Space, or a tap) before it guesses.
//    Its guesses are always wrong.
// 3. The big shop. Thirteen things. Adds age checks (cooking wine, scissors,
//    a large candle): they need Bev's approval. Scan them and carry on; you
//    can't pay until she's been, so the earlier you scan them the better.
//    Heavy things (rice, bleach) take the scale longer to settle.
// 4. Christmas Eve. Fifteen things on a fast belt, and the shop shuts early.
//    Adds a machine on edge: suspicion rises on its own, and only good
//    scanning keeps it down. The queue behind you has opinions. A turkey.
// Between shops you pick one way of shopping from three (shell.interlude).
// Each helps and costs: bring your own bags (the scale settles faster, the
// machine accuses your bag), a loyalty card (more points, it knows who you
// are), eye contact with Bev (she comes faster, then has a chat), and so on.
//
// SCORING. Each item scanned: 100, plus 100 for a perfect scan, plus a streak
// bonus (10 a scan in a row, up to 200). Bagging: 10. Fruit picked right:
// 150, plus up to 100 for being quick. Each shop paid for: 20 a second left on
// the clock, and 500 for a clean record (nobody accused you). If the shop
// shuts before you've paid, the run is over.
//
// THE LADDER (DESIGN.md, section 6). Approved: every shop paid for and at
// least 15,500 points. Pending review: you reached Christmas Eve. Not
// approved: you got as far as the trolley or the big shop. Rejected: the
// basket beat you.
//
// Built on the shared kit (/games/kit/kit.js): the intro, the screens,
// controls, sound and saving. sprites.js draws the shopping and the people.
(function () {
  "use strict";

  var N = window.Notaste;
  var S = window.UnexpectedSprites;
  var root = document.getElementById("game-root");
  if (!N || !S || !root) return;

  var params = new URLSearchParams(window.location.search);
  var AUTOPILOT = N.flags.autopilot;   // ?autopilot or ?clip: the computer does the big shop
  var DEBUG = params.has("debug");
  var FIRST = DEBUG ? Math.max(0, Math.min(3, (parseInt(params.get("stage"), 10) || 1) - 1)) : 0;

  // ---------------------------------------------------------------------------
  // Tuning. The world is 100 units across the screen's shorter side.
  // ---------------------------------------------------------------------------
  var LINE_TOL = 0.75;        // a barcode still counts this far either side of the red line
  var PERFECT = 1.15;         // ...and this close to its centre is a perfect scan
  var SETTLE = 0.8;           // seconds the scale takes to settle after something goes in
  var HEAVY = 2.3;            // heavy things take this many times longer
  var RITUAL_SETTLE = 0.55;   // lifting the bag or putting it back
  var HOP = 0.26;             // scanner to hand
  var DROP = 0.2;             // hand to bag
  var SCAN_LOCK = 0.28;       // after a mistimed scan, so mashing doesn't work
  var BELT_WAIT = 2.6;        // the belt starts this long after Go
  var SUS_MISS = 13, SUS_WRONG = 24, SUS_GUESS = 14;
  var SUS_DRAIN = 2.2;        // a second, in the first three shops
  var SUS_EDGE = 2.8;         // a second, up, on Christmas Eve
  var SUS_PERFECT = 10, SUS_GOOD = 3, SUS_AFTER = 35;
  var TIME_BONUS = 20, CLEAN_BONUS = 500;
  var K = 1.25;               // the shopping is drawn this much bigger than sprites.js draws it
  var APPROVED = 15500;

  // What goes in which trolley. No real brands anywhere.
  var POOLS = {
    basket: ["beans", "milk", "bread", "eggs", "tea", "jam", "loo", "cheese"],
    trolley: ["beans", "milk", "bread", "eggs", "tea", "jam", "loo", "cheese", "cereal", "washing", "pasta", "crisps", "catfood", "biscuits"],
    big: ["cereal", "washing", "pasta", "crisps", "catfood", "biscuits", "milk", "bread", "loo", "baguette", "tea", "beans", "eggs"],
    xmas: ["pies", "wrap", "choc", "tape", "baguette", "milk", "cheese", "biscuits", "crisps", "pies", "choc"]
  };

  // Loose fruit, in sets of four lookalikes, and how the till asks
  var SETS = {
    lime: { q: "Lime, lemon, lime or lime.", opts: ["lime", "lemon", "limeLeaf", "limeSad"] },
    onion: { q: "Onion, onion, shallot or onion.", opts: ["onion", "redOnion", "shallot", "garlic"] },
    apple: { q: "Apple, apple, apple or tomato.", opts: ["apple", "greenApple", "bittenApple", "tomato"] },
    potato: { q: "Potato, potato, potato or stone.", opts: ["potato", "sweetPotato", "newPotatoes", "stone"] },
    banana: { q: "Banana, banana, banana or banana.", opts: ["banana", "greenBanana", "bananas", "plantain"] },
    sprout: { q: "Sprout, sprout, sprout or small cabbage.", opts: ["sprout", "cabbage", "sproutNervous", "sprouts"] }
  };

  var STAGES = [
    { name: "A basket", count: 6, belt: 10.5, gap: [15, 25], time: 45, walk: 4, pool: "basket",
      sets: [], fruit: 0, age: [], heavy: [],
      brief: "Scan each item as its barcode crosses the red line. Then bag it, but only when the scale says OK.",
      clear: "One basket. The machine has opened a file on you.",
      hello: "Welcome. Please scan your first item. I'm watching." },
    { name: "A trolley", count: 10, belt: 12.5, gap: [12, 22], time: 70, walk: 5, pool: "trolley",
      sets: ["lime", "onion", "apple", "potato", "banana"], fruit: 3, age: [], heavy: [],
      brief: "Loose fruit has no barcode. The belt stops and the till asks what it is: pick the matching picture before it guesses.",
      clear: "Every lime accounted for. The machine has kept a note about the lime.",
      hello: "Hello again. I remember you." },
    { name: "The big shop", count: 13, belt: 14.5, gap: [10, 20], time: 80, walk: 6, pool: "big",
      sets: ["lime", "onion", "apple", "potato", "banana"], fruit: 2, age: ["wine", "scissors", "candle"], heavy: ["rice", "bleach"],
      brief: "Scissors, candles and cooking wine need Bev's approval. Scan them and carry on: you can't pay until she's been.",
      clear: "The candle has been approved. Nobody looked at the candle.",
      hello: "Welcome back. Your file is open." },
    { name: "Christmas Eve", count: 15, belt: 16, gap: [9, 18], time: 70, walk: 7, pool: "xmas", edge: true, xmas: true,
      sets: ["sprout", "potato", "apple"], fruit: 2, age: ["crackers", "candle"], heavy: ["turkey"],
      brief: "The machine is on edge: suspicion rises on its own, and perfect scans calm it down. The shop shuts early.",
      clear: "",
      hello: "Merry Christmas. Please scan your first item. Slowly." }
  ];

  // Ways of shopping, picked between stages. Something good, something bad.
  var CHOICES = [
    { id: "bags", label: "Bring your own bags", detail: "The scale settles twice as fast. The machine accuses your bag at the start of every shop.",
      apply: function (m) { m.settle *= 0.5; m.byob = true; } },
    { id: "card", label: "Use a loyalty card", detail: "Every item scores a quarter more. It knows who you are now, and it is even more suspicious.",
      apply: function (m) { m.points *= 1.25; m.sus *= 1.5; } },
    { id: "bev", label: "Make eye contact with Bev", detail: "Bev comes over twice as fast. Then she has a chat.",
      apply: function (m) { m.walk *= 0.45; m.chat += 1.6; } },
    { id: "glasses", label: "Wear your reading glasses", detail: "Twice as long to look up fruit. The belt runs a bit faster.",
      apply: function (m) { m.lookup *= 2; m.belt *= 1.1; } },
    { id: "mean", label: "Scan like you mean it", detail: "Perfect scans score half as much again. Mistimed ones look twice as suspicious.",
      apply: function (m) { m.perfect *= 1.5; m.missSus *= 2; } },
    { id: "quiet", label: "Come back when it's quieter", detail: "Twenty more seconds before the shop shuts. Bev's on her break, so she takes longer.",
      apply: function (m) { m.time += 20; m.walk *= 1.4; } },
    { id: "wave", label: "Wave at the camera", detail: "Suspicion drains twice as fast. Every item scores a fifth less.",
      apply: function (m) { m.drain *= 2; m.points *= 0.8; } },
    { id: "still", label: "Hold it very still", detail: "Barcodes scan a little way off the red line. The belt runs faster.",
      apply: function (m) { m.tol += 1.1; m.belt *= 1.12; } },
    { id: "staffed", label: "Ask for a staffed till", detail: "There isn't one. Nothing happens. It costs nothing.",
      apply: function () {} }
  ];

  // ---------------------------------------------------------------------------
  // What they say. The machine accuses, apologises, accuses again. Bev has
  // seen it all. Nobody is the joke but the machine (DESIGN.md, section 2).
  // ---------------------------------------------------------------------------
  var SAY = {
    scanned: ["Thank you.", "Noted.", "Item accepted. You are pending.", "Good. Suspiciously good.", "Beep. That's me being polite."],
    streak: ["Five in a row. What are you hiding.", "Very smooth. Too smooth.", "Nobody's this good at scanning. Nobody honest."],
    missed: ["I didn't see a barcode.", "That was the belt.", "Please scan the item, not the air.", "Scanning nothing is suspicious.", "Was that a barcode. No."],
    fruitMiss: ["That's fruit. Fruit has no barcode. Wait.", "It's a vegetable. Hold on."],
    holding: ["Please place the item in the bagging area.", "Bag that one first.", "One thing at a time. I'm watching both."],
    round: ["That one's going round again.", "Have you scanned your item.", "It'll be back. They always come back."],
    accuse: "Unexpected item in the bagging area.",
    accuseBag: "Unexpected bag in the bagging area.",
    accuseWatch: ["I've seen enough. Unexpected item.", "I've been watching you. Unexpected item."],
    lift: "Please remove the item from the bagging area.",
    back: "Please replace the item in the bagging area.",
    again: ["Unexpected item in the bagging area.", "No. Unexpected item. Again.", "Still unexpected."],
    sorry: ["Sorry. Item: expected.", "My mistake. I'll remember it.", "Apologies. It won't happen again. It will.", "That was my fault. Don't tell Bev."],
    coming: ["Assistance is on its way.", "Assistance is on its way. Slowly.", "Help is coming. Eventually."],
    arrive: ["She's here. You're in trouble.", "Bev. Search them."],
    age: { wine: "Cooking wine. For cooking, is it.", scissors: "Scissors. Approval needed.", candle: "A large candle. Why so large.",
           crackers: "Crackers. They go bang. Approval needed.", glue: "Glue. I know what glue's for." },
    noBarcode: ["Item has no barcode. Suspicious.", "No barcode. Are you a farmer."],
    right: ["{name}. If you say so.", "{name}. I'll allow it.", "{name}. I was going to say that."],
    wrong: ["{name}. Noted. Charged as {wrong}.", "That's not a {wrong}. Noted."],
    guessed: "I've gone with {wrong}.",
    heavy: ["Heavy item. Please wait.", "Heavy item. Please wait. Longer."],
    turkey: "Turkey detected. Please wait.",
    high: ["I'm watching you.", "Smile. You're on camera.", "I've seen this before.", "Hmm."],
    bagFirst: "Bag your item first. I'll wait. I'm good at waiting.",
    waitApproval: "Waiting for approval. Bev's on her way. Probably.",
    tenLeft: "The shop shuts in ten seconds. I'll lock you in.",
    paid: ["Thank you for shopping. Please take your receipt.", "Payment accepted. You may go. I'll be watching."],
    shut: "We're closed. You're staying."
  };
  var BEV = {
    freeze: ["It does that.", "Not again, Dennis.", "Behave, Dennis.", "It's done that all day.",
             "Dennis thinks everyone's a thief. Even me.", "I've got nine of these. Dennis is the worst."],
    approve: ["Approved. Didn't look.", "You look over twenty-five. Or under. Either way.", "It's scissors, Dennis. Calm down.",
              "Approved. I've seen your face. It's fine."],
    both: ["Two for one. Lovely.", "While I'm here. Approved. Sorted."],
    never: ["Never mind, then.", "Fixed it yourself. Lovely.", "Don't call me if it's fixed."],
    chat: ["Busy today. It's always busy today.", "I used to be on the tills. The real ones.",
           "They're getting eight more of these. Just me, though."],
    xmas: ["Merry Christmas. Don't touch the bag.", "Dennis gets like this at Christmas."]
  };
  var QUEUE = ["Any time today.", "It's a sprout, not a bomb.", "Scan it, you lemon.", "I've got a turkey in the car.",
               "It did that to me. Twice.", "Behave, Dennis.", "Is there a staffed till. No. Course not.",
               "Merry Christmas. Hurry up.", "Get a move on, melon.", "Lift the bag. Everyone knows. Lift the bag."];

  var RANKS = [
    { line: "The machine has no further questions. It's thinking of some." },
    { line: "Everything's paid for. The machine has kept your picture, for training purposes." },
    { line: "The shop shut with you still in it. Bev turned the lights off on her way out." },
    { line: "The machine has kept your shopping. It says it's evidence." }
  ];

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  var shell = null, T = null, ctx = null;
  var W = 1, H = 1, DPR = 1, U = 1, WW = 100, WH = 100;
  var L = {};                                    // the layout, in world units
  var rng = Math.random;
  var run = null;                                // the whole run's tallies
  var mods = null;                               // the ways of shopping picked so far
  var stage = 0, phase = "play", clock = 0, timeLeft = 0, beltWait = 0, beltPos = 0;
  var pending = [], belt = [], falls = [], drops = [], hand = null;
  var bag = null, scale = null, frozen = null, look = null, bev = null, queue = [];
  var sus = 0, susCalled = false, streak = 0, scanLock = 0, bagGrace = 0, approvals = 0, approvalNames = [];
  var st = null;                                 // this stage's tallies
  var bubbles = [], floats = [], fx = [];
  var prev = {}, taps = [], tiles = [], auto = null;
  var learned = { scan: 0, bag: 0, ritual: false };
  var shake = 0, sorryT = 0, blinkT = 3, flashT = 0, endT = 0, clearT = 0, shutter = 0;
  var hudEls = null, back = null, front = null, noticed = false;
  var boxes = null, boxAge = 0;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function fmt(n) { return Math.round(n).toLocaleString("en-GB"); }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function rpick(list) { return list[Math.floor(rng() * list.length)]; }
  function shuffle(list) {
    for (var i = list.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1)), t = list[i];
      list[i] = list[j]; list[j] = t;
    }
    return list;
  }
  function touching() { return root.classList.contains("kit-touching"); }
  function info() { return STAGES[stage]; }
  function ease(t) { return t < 0 ? 0 : t > 1 ? 1 : 1 - Math.pow(1 - t, 3); }

  // ---------------------------------------------------------------------------
  // Layout: where everything sits for this screen shape. Square on phones, 4:3
  // on desktop, 4:5 in the clip frame; the scene is built round the red line.
  // ---------------------------------------------------------------------------
  function layout() {
    var extra = Math.max(0, WH - 100);
    var oy = extra * 0.7;
    var phone = window.matchMedia && window.matchMedia("(max-width: 39.99rem)").matches;
    var coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
    var barPx = N.flags.clip ? 0 : phone ? 40 : 46;   // the pause, sound and fullscreen buttons
    L.top = barPx / U + 0.8;
    // the top of the belt and the counter: higher on touch screens, where
    // the buttons take the bottom corners
    L.belt = (coarse && !N.flags.clip ? 62 : 66) + oy;
    L.floor = WH - 3;
    L.compact = coarse && !N.flags.clip;
    L.sx = WW / 2 + 3;                   // the red line
    L.kx = L.sx - 14;                    // the till
    L.beltEnd = L.sx + 6;
    L.chute = L.beltEnd + 2.4;
    L.counter = L.beltEnd + 5;
    L.bagX = L.sx + 27;
    L.bagW = 19;
    L.bagH = 15;
    L.handY = L.belt - 16.5;             // the bottom of whatever's in your hand
    L.scrB = L.belt - 21;
    L.scrT = Math.max(L.top + 7, L.scrB - 26 - extra * 0.4);   // a taller screen when there is room (the clip frame)
    L.kTop = L.scrT - 2.4;
    L.kW = 36;
    L.reader = { x: L.kx - L.kW / 2 + 2.2, y: L.belt - 15 };
    L.bevX = L.reader.x - 13;
    L.bevOff = -16;
    L.lineTop = L.belt - 20;
    L.dennis = { x: L.kx + L.kW / 2 + 0.5, y: L.scrT + 5 };
  }

  // ---------------------------------------------------------------------------
  // The run and its stages
  // ---------------------------------------------------------------------------
  function freshMods() {
    return { settle: 1, byob: false, points: 1, sus: 1, walk: 1, chat: 0, lookup: 1, belt: 1,
             perfect: 1, missSus: 1, time: 0, drain: 1, tol: 0 };
  }

  function reset(sh) {
    shell = sh;
    T = sh.tokens;
    rng = sh.random;
    run = { score: 0, scanned: 0, perfect: 0, accused: 0, round: 0, fruitRight: 0, fruit: 0, approved: 0,
            shops: 0, taken: [], daily: sh.daily, roundCalled: false, heavyCalled: false };
    mods = freshMods();
    learned = { scan: 0, bag: 0, ritual: false };
    auto = { cool: 0, think: 0, guessed: false, wrong: false };
    stage = FIRST;
    startStage();
    if (!hudEls) buildHud();
    paintHud();
  }

  function startStage() {
    var s = info();
    phase = "play";
    clock = 0;
    timeLeft = s.time + mods.time;
    beltWait = BELT_WAIT;
    belt = []; falls = []; drops = []; hand = null; frozen = null; look = null;
    pending = shoppingList(stage);
    bag = { items: [], up: 0, lift: 0 };
    scale = { t: 0, total: 1 };
    bev = { state: "off", x: L.bevOff, phase: 0, t: 0, reach: 0, say: false };
    sus = stage === 3 ? 25 : 0;
    susCalled = false;
    streak = 0; scanLock = 0; approvals = 0; approvalNames = [];
    st = { accused: 0, done: 0, perfect: 0, score: 0, byobDone: false, heavySaid: false, tenSaid: false, turkeySaid: false };
    bubbles = []; floats = []; fx = [];
    queue = s.xmas ? [{ hat: "santa", coat: T.red, t: 0, shout: 0 }, { hat: "bobble", coat: T.paper, t: 0, shout: 0, tache: true }] : [];
    shutter = 0; clearT = 0; endT = 0; sorryT = 0;
    noticed = false;
    auto.impatient = AUTOPILOT && stage !== 1 && stage < 3;
    auto.impatientAt = 2 + Math.floor(rng() * 2);
    auto.bagsHere = 0;
    // the first couple of things are already on the belt, waiting
    var x = L.sx - 24;
    for (var i = 0; i < 2 && pending.length; i++) {
      var it = makeItem(pending.shift());
      it.x = x - it.w / 2;
      it.gap = gapNext();
      belt.push(it);
      x = it.x - it.w / 2 - it.gap;
    }
    back = null;
    front = null;
  }

  function gapNext() {
    var g = info().gap;
    return g[0] + rng() * (g[1] - g[0]);
  }

  // Everything for this shop, in the order it comes down the belt. Today's
  // run draws all of it from the day's seed.
  function shoppingList(si) {
    var s = STAGES[si];
    var list = [];
    s.age.forEach(function (id) { list.push({ id: id }); });
    s.heavy.forEach(function (id) { list.push({ id: id }); });
    shuffle(s.sets.slice()).slice(0, s.fruit).forEach(function (set) {
      list.push({ fruit: set, answer: rpick(SETS[set].opts) });
    });
    var pool = shuffle(POOLS[s.pool].slice());
    for (var i = 0; list.length < s.count; i++) list.push({ id: pool[i % pool.length] });
    shuffle(list);
    // age checks come early (Bev needs a head start), and the first fruit of
    // the trolley turns up while the notice is still fresh
    var n = list.length;
    list.forEach(function (spec, k) {
      var d = spec.id && S.ITEMS[spec.id];
      if (d && d.age && k > n * 0.55) {
        var j = 1 + Math.floor(rng() * Math.floor(n * 0.45));
        var t = list[j]; list[j] = spec; list[k] = t;
      }
    });
    if (si === 1) {
      var f = -1;
      for (var q = 0; q < n; q++) if (list[q].fruit) { f = q; break; }
      if (f > 2) { var tmp = list[2]; list[2] = list[f]; list[f] = tmp; }
    }
    if (list[0].fruit || (list[0].id && S.ITEMS[list[0].id].age)) { var a = list[0]; list[0] = list[n - 1]; list[n - 1] = a; }
    return list;
  }

  function makeItem(spec) {
    if (spec.fruit) {
      return { spec: spec, id: "fruit:" + spec.answer, fruit: spec.fruit, answer: spec.answer,
               name: S.FRUIT[spec.answer].name, w: 10.4 * K, h: 10 * K, bar: null, x: 0 };
    }
    var d = S.ITEMS[spec.id];
    return { spec: spec, id: spec.id, name: d.name, w: d.w * K, h: d.h * K, age: !!d.age, heavy: !!d.heavy,
             bar: { off: (-d.w / 2 + d.bar.x * d.w) * K, half: d.bar.w / 2 * K, y: d.bar.y * K }, x: 0 };
  }

  // ---------------------------------------------------------------------------
  // Speech: one bubble per speaker, at most three at once
  // ---------------------------------------------------------------------------
  function say(who, text, force) {
    if (!text) return;
    for (var i = 0; i < bubbles.length; i++) {
      if (bubbles[i].who === who) { if (!force && bubbles[i].t < 1) return; bubbles.splice(i, 1); break; }
    }
    if (bubbles.length >= 3) { if (!force) return; bubbles.shift(); }
    bubbles.push({ who: who, text: text, t: 0, life: 1.8 + text.length * 0.045 });
    voice(who, text);
  }
  function dennis(text, force) { say("dennis", text, force); }
  function fill(line, o) {
    return line.replace("{name}", o.name || "").replace("{wrong}", (o.wrong || "").toLowerCase());
  }

  // ---------------------------------------------------------------------------
  // Sound, all made in code (DESIGN.md, section 9). The scanner's beep and the
  // alarm are the stars. Everyone talks in little blips.
  // ---------------------------------------------------------------------------
  var snd = N.sound;
  var sfx = {
    beep: function () { snd.tone(1870, 0.1, { type: "square", vol: 0.07 }); },
    perfect: function () { snd.tone(1870, 0.08, { type: "square", vol: 0.07 }); snd.tone(2490, 0.1, { type: "square", vol: 0.05, delay: 0.08 }); },
    error: function () { snd.tone(210, 0.13, { type: "square", vol: 0.08 }); snd.tone(150, 0.2, { type: "square", vol: 0.08, delay: 0.12 }); },
    refuse: function () { snd.tone(330, 0.12, { type: "triangle", vol: 0.06 }); snd.tone(262, 0.14, { type: "triangle", vol: 0.06, delay: 0.1 }); },
    rustle: function () { snd.noise(0.18, { type: "bandpass", freq: 2600, q: 0.6, vol: 0.14 }); snd.tone(110, 0.09, { type: "sine", vol: 0.12 }); },
    thud: function () { snd.tone(80, 0.2, { type: "sine", slide: 50, vol: 0.2 }); snd.noise(0.12, { freq: 400, vol: 0.12 }); },
    ok: function () { snd.tone(990, 0.05, { type: "square", vol: 0.025 }); },
    alarm: function () {
      for (var i = 0; i < 4; i++) snd.tone(i % 2 ? 660 : 880, 0.16, { type: "square", vol: 0.065, delay: i * 0.18 });
    },
    nag: function () { snd.tone(880, 0.08, { type: "square", vol: 0.03 }); },
    swipe: function () {
      snd.noise(0.16, { type: "highpass", freq: 3200, vol: 0.12 });
      snd.tone(1320, 0.09, { type: "triangle", vol: 0.06, delay: 0.2 });
      snd.tone(1760, 0.16, { type: "triangle", vol: 0.06, delay: 0.3 });
    },
    lift: function () { snd.tone(300, 0.12, { type: "triangle", slide: 520, vol: 0.05 }); snd.noise(0.1, { type: "bandpass", freq: 2200, vol: 0.08 }); },
    lower: function () { snd.tone(520, 0.12, { type: "triangle", slide: 300, vol: 0.05 }); snd.noise(0.1, { type: "bandpass", freq: 2200, vol: 0.08 }); },
    pick: function () { snd.tone(1200, 0.04, { vol: 0.04 }); },
    right: function () { snd.tone(1568, 0.08, { type: "square", vol: 0.06 }); snd.tone(2093, 0.12, { type: "square", vol: 0.05, delay: 0.08 }); },
    wrong: function () { snd.tone(300, 0.3, { type: "sawtooth", slide: 140, vol: 0.06 }); },
    guess: function () { snd.tone(523, 0.12, { type: "square", vol: 0.05 }); snd.tone(392, 0.12, { type: "square", vol: 0.05, delay: 0.13 }); snd.tone(262, 0.3, { type: "square", vol: 0.05, delay: 0.26 }); },
    step: function () { snd.tone(95, 0.05, { type: "sine", vol: 0.06 }); },
    motor: function () { snd.tone(70, 0.5, { type: "sawtooth", slide: 110, vol: 0.04 }); },
    fall: function () { snd.tone(700, 0.3, { type: "triangle", slide: 200, vol: 0.04 }); },
    paid: function () {
      for (var i = 0; i < 7; i++) snd.noise(0.03, { type: "bandpass", freq: 3000, vol: 0.06, delay: i * 0.05 });
      snd.tone(1568, 0.35, { type: "triangle", vol: 0.07, delay: 0.4 });
      snd.tone(2093, 0.5, { type: "triangle", vol: 0.06, delay: 0.52 });
    },
    shutter: function () { snd.noise(1, { freq: 300, vol: 0.18 }); snd.tone(90, 0.9, { type: "sawtooth", slide: 50, vol: 0.06 }); }
  };

  // A voice for each speaker: one blip a syllable, with a bit of a tune
  function voice(who, text) {
    var syl = Math.min(16, (text.match(/[aeiouy]+/gi) || []).length);
    var base = who === "dennis" ? 440 : who === "bev" ? 196 : 262;
    var type = who === "dennis" ? "square" : who === "bev" ? "triangle" : "sawtooth";
    var gap = who === "bev" ? 0.1 : 0.075;
    var vol = who === "dennis" ? 0.026 : 0.035;
    for (var i = 0; i < syl; i++) {
      var f = base * (1 + 0.12 * Math.sin(i * 1.7 + text.length) + (i === syl - 1 ? -0.12 : 0));
      snd.tone(f, gap * 0.8, { type: type, vol: vol, delay: i * gap });
    }
  }

  // ---------------------------------------------------------------------------
  // Playing: input
  // ---------------------------------------------------------------------------
  function edge(name, now) {
    var e = now && !prev[name];
    prev[name] = now;
    return e;
  }

  function readInput(input) {
    var p = { scan: edge("action", input.action), bag: edge("bag", input.bag), pick: -1,
              left: edge("left", input.left), right: edge("right", input.right), mode: input.mode };
    ["one", "two", "three", "four"].forEach(function (k, i) { if (edge(k, input[k])) p.pick = i; });
    // taps and clicks on the screen: a fruit picture, the bag, or anywhere to scan
    while (taps.length) {
      var t = taps.shift();
      if (look) {
        for (var i = 0; i < tiles.length; i++) {
          var r = tiles[i];
          if (t.x >= r.x && t.x <= r.x + r.w && t.y >= r.y && t.y <= r.y + r.h) p.pick = i;
        }
        continue;
      }
      var wx = t.x / U, wy = t.y / U;
      if (Math.abs(wx - L.bagX) < L.bagW / 2 + 4 && wy > L.handY - 14 && wy < L.belt + 12) p.bag = true;
      else p.scan = true;
    }
    return p;
  }

  // ---------------------------------------------------------------------------
  // Playing: the frame
  // ---------------------------------------------------------------------------
  function update(dt, input) {
    var playing = shell.state() === "playing";
    if (playing || shell.state() === "ending") animate(dt);
    if (!playing) return;
    if (phase === "clear") {
      clearT += dt;
      if (clearT > 1 && clearT - dt <= 1) stageDone();
      return;
    }
    if (phase !== "play") return;
    if (!st.hello) { st.hello = true; dennis(info().hello, true); }
    clock += dt;
    bagGrace = Math.max(0, bagGrace - dt);
    var p = readInput(input);
    if (AUTOPILOT) {
      var a = autopilot(dt);
      p = { scan: a.scan, bag: a.bag, pick: a.pick, left: false, right: false };
    }

    timeLeft = Math.max(0, timeLeft - dt);
    if (timeLeft <= 10 && !st.tenSaid) { st.tenSaid = true; dennis(SAY.tenLeft, true); }
    if (timeLeft <= 0) { closed(); return; }

    scanLock = Math.max(0, scanLock - dt);
    var wasSettling = scale.t > 0;
    scale.t = Math.max(0, scale.t - dt);
    if (wasSettling && scale.t <= 0) sfx.ok();

    // bring your own bags: the machine doesn't trust them
    if (mods.byob && !st.byobDone && clock > 1.2) { st.byobDone = true; accuse("byob"); }

    var wasFrozen = !!frozen;
    if (frozen) tickFrozen(dt, p);
    else if (look) tickLook(dt, p);
    else tickBelt(dt, p);

    if (p.bag && !wasFrozen && !look) pressBag();
    tickSuspicion(dt);
    tickBev(dt);
    tickQueue(dt);

    if (!frozen && !look && !hand && !drops.length && !falls.length && !belt.length && !pending.length && approvals === 0) {
      paid();
    } else if (approvals && !hand && !belt.length && !pending.length && !drops.length && !frozen && Math.random() < dt * 0.25) {
      dennis(SAY.waitApproval);
    }
    paintHud();
  }

  // Things that move whatever's happening: hops, drops, bubbles, Bev's legs
  function animate(dt) {
    if (hand && hand.t < 1) hand.t = Math.min(1, hand.t + dt / HOP);
    for (var i = drops.length - 1; i >= 0; i--) {
      var d = drops[i];
      d.t += dt / DROP;
      if (d.t >= 1) {
        drops.splice(i, 1);
        bag.items.push(d.item.id);
        if (bag.items.length > 6) bag.items.shift();
        fx.push({ kind: "puff", x: L.bagX + (Math.random() - 0.5) * 6, y: L.belt - L.bagH + 1, t: 0, life: 0.45 });
      }
    }
    for (var j = falls.length - 1; j >= 0; j--) {
      var f = falls[j];
      f.t += dt;
      if (f.t > 0.55) {
        falls.splice(j, 1);
        pending.push(f.item.spec);
        run.round++;
      }
    }
    bag.up += ((frozen && frozen.up ? 1 : 0) - bag.up) * Math.min(1, dt * 14);
    for (var k = bubbles.length - 1; k >= 0; k--) {
      bubbles[k].t += dt;
      if (bubbles[k].t > bubbles[k].life) bubbles.splice(k, 1);
    }
    for (var m = floats.length - 1; m >= 0; m--) {
      floats[m].t += dt;
      if (floats[m].t > floats[m].life) floats.splice(m, 1);
    }
    for (var n = fx.length - 1; n >= 0; n--) {
      fx[n].t += dt;
      if (fx[n].t > fx[n].life) fx.splice(n, 1);
    }
    shake = Math.max(0, shake - dt * 4);
    sorryT = Math.max(0, sorryT - dt);
    flashT += dt;
    blinkT -= dt;
    if (blinkT < -0.14) blinkT = 2 + Math.random() * 3;
    if (phase === "over") shutter = Math.min(1, shutter + dt * 1.4);
  }

  // The belt: everything moves along, things drop down the chute at the end,
  // and loose fruit stops at the red line to be looked up
  function tickBelt(dt, p) {
    if (beltWait > 0) {
      beltWait -= dt;
      if (beltWait <= 0) sfx.motor();
    } else {
      var v = info().belt * mods.belt;
      var stop = false;
      belt.forEach(function (it) {
        if (it.fruit && !it.looked && it.x >= L.sx - 0.2) stop = true;
      });
      if (!stop) {
        beltPos += v * dt;
        belt.forEach(function (it) { it.x += v * dt; });
      }
      // a fruit at the line: look it up as soon as your hand is free
      for (var i = 0; i < belt.length; i++) {
        var f = belt[i];
        if (f.fruit && !f.looked && f.x >= L.sx - 0.2) {
          f.x = Math.max(f.x, L.sx);
          if (!hand && !drops.length) openLook(f);
          else if (!f.waitSaid) { f.waitSaid = true; dennis(SAY.bagFirst); }
          break;
        }
      }
      // the next thing on
      var last = belt.length ? belt[belt.length - 1] : null;
      if (pending.length && (!last || last.x - last.w / 2 > (last.gap || 0) - 1)) {
        var it = makeItem(pending.shift());
        it.x = -it.w / 2 - 1;
        it.gap = gapNext();
        belt.push(it);
      }
      // off the end and down the chute
      for (var j = belt.length - 1; j >= 0; j--) {
        var b = belt[j];
        if (b.x - b.w / 2 > L.beltEnd - 1.5) {
          belt.splice(j, 1);
          falls.push({ item: b, x: b.x, t: 0 });
          sfx.fall();
          if (!run.roundCalled) { run.roundCalled = true; shell.callout("Round again", { sound: false, ms: 1100 }); }
          else if (Math.random() < 0.35) dennis(pick(SAY.round));
        }
      }
    }
    if (p.scan) pressScan();
  }

  // ---------------------------------------------------------------------------
  // Scanning
  // ---------------------------------------------------------------------------
  function barCentre(it) { return it.x + it.bar.off; }
  function onLine(it) {
    if (!it.bar) return false;
    var c = barCentre(it), tol = LINE_TOL + mods.tol;
    return L.sx >= c - it.bar.half - tol && L.sx <= c + it.bar.half + tol;
  }
  function scannable() {
    for (var i = 0; i < belt.length; i++) if (onLine(belt[i])) return belt[i];
    return null;
  }
  function canScan() { return !hand && !frozen && !look && beltWait <= 0; }

  function pressScan() {
    if (scanLock > 0 || frozen || look) return;
    var it = scannable();
    if (it && hand) {
      sfx.refuse();
      dennis(pick(SAY.holding));
      scanLock = SCAN_LOCK;
      return;
    }
    if (!it) {
      // too early, too late, or nothing there at all
      var near = null, dist = 99;
      belt.forEach(function (b) {
        var c = b.bar ? barCentre(b) : b.x;
        if (Math.abs(c - L.sx) < dist) { dist = Math.abs(c - L.sx); near = b; }
      });
      sfx.error();
      scanLock = SCAN_LOCK;
      if (hand) { dennis(pick(SAY.holding)); return; }
      if (beltWait > 0) return;
      streak = 0;
      if (near && near.fruit && dist < 14) { dennis(pick(SAY.fruitMiss)); return; }
      sus += SUS_MISS * mods.missSus * mods.sus;
      var word = !near || dist > 14 ? "Nothing there" : (near.bar ? barCentre(near) : near.x) < L.sx ? "Early" : "Late";
      float(L.sx, L.belt + 11, word, "miss");
      if (Math.random() < 0.4) dennis(pick(SAY.missed));
      return;
    }
    scan(it);
  }

  function scan(it) {
    var perfect = Math.abs(barCentre(it) - L.sx) <= PERFECT + mods.tol * 0.5;
    belt.splice(belt.indexOf(it), 1);
    hand = { item: it, t: 0, from: { x: it.x, y: L.belt } };
    streak++;
    run.scanned++;
    learned.scan++;
    var pts = 100 + (perfect ? 100 * mods.perfect : 0) + 10 * Math.min(streak - 1, 20);
    pts = Math.round(pts * mods.points / 10) * 10;
    addScore(pts);
    if (perfect) { run.perfect++; st.perfect++; sfx.perfect(); sus -= SUS_PERFECT; }
    else { sfx.beep(); sus -= SUS_GOOD; }
    sus = Math.max(0, sus);
    float(L.sx, L.belt + 11, (perfect ? "Perfect " : "") + "+" + pts, perfect ? "perfect" : "good");
    fx.push({ kind: "flash", t: 0, life: 0.25 });
    if (it.age) {
      approvals++;
      approvalNames.push(it.name);
      shell.callout("Approval needed", { ms: 1300 });
      dennis(SAY.age[it.id] || "Approval needed.", true);
      callBev();
    } else if (streak === 5 || streak === 12) {
      dennis(pick(SAY.streak));
      shell.callout(streak === 5 ? "Five in a row" : "Twelve in a row. Suspicious", { sound: false, ms: 1200 });
    } else if (Math.random() < 0.12) {
      dennis(pick(SAY.scanned));
    }
  }

  function addScore(pts) {
    run.score += pts;
    st.score += pts;
  }

  function float(x, y, text, kind) {
    floats.push({ x: x, y: y, text: text, kind: kind, t: 0, life: 0.9 });
    if (floats.length > 3) floats.shift();
  }

  // ---------------------------------------------------------------------------
  // Bagging, and the scale
  // ---------------------------------------------------------------------------
  function settling() { return scale.t > 0; }

  function pressBag() {
    if (bagGrace > 0) return;
    if (settling()) { accuse("bag"); return; }
    if (!hand) { sfx.pick(); return; }
    if (hand.t < 0.6) return;
    var it = hand.item;
    hand = null;
    drops.push({ item: it, t: 0 });
    var k = it.heavy ? HEAVY : 1;
    scale.total = scale.t = SETTLE * mods.settle * k;
    bagGrace = 0.22;
    st.done++;
    learned.bag++;
    addScore(10);
    if (AUTOPILOT) auto.bagsHere++;
    if (it.heavy) {
      sfx.thud();
      if (it.id === "turkey" && !st.turkeySaid) { st.turkeySaid = true; dennis(SAY.turkey, true); }
      else if (!st.heavySaid) { st.heavySaid = true; dennis(pick(SAY.heavy), true); }
      if (!run.heavyCalled) { run.heavyCalled = true; shell.callout("Heavy item", { sound: false, ms: 1100 }); }
    } else sfx.rustle();
  }

  // ---------------------------------------------------------------------------
  // Unexpected item in the bagging area: the till freezes, the light goes on
  // and Bev sets off. Fix it yourself (lift the bag, put it back, each time
  // the scale says OK) or wait for her.
  // ---------------------------------------------------------------------------
  function accuse(cause) {
    if (frozen) return;
    frozen = { cause: cause, step: "lift", up: false, tries: 0 };
    run.accused++;
    st.accused++;
    streak = 0;
    shell.callout("Unexpected item", { ms: 1600 });
    dennis(cause === "byob" ? SAY.accuseBag : cause === "watch" ? pick(SAY.accuseWatch) : SAY.accuse, true);
    sfx.alarm();
    if (!shell.reduceMotion) shake = 1;
    flashT = 0;
    callBev();
  }

  function tickFrozen(dt, p) {
    frozen.t = (frozen.t || 0) + dt;
    frozen.nag = (frozen.nag || 0) - dt;
    if (frozen.nag <= 0) { frozen.nag = 1.2; sfx.nag(); }
    if (frozen.step === "lift" && !frozen.liftSaid && frozen.t > 1.7) { frozen.liftSaid = true; dennis(SAY.lift, true); }
    if (frozen.step === "check" && !settling()) {
      // the ritual worked. This time.
      frozen = null;
      sorryT = 2.6;
      learned.ritual = true;
      sus = Math.min(sus, SUS_AFTER);
      shell.callout("Item: expected", { sound: false, ms: 1200 });
      dennis(pick(SAY.sorry), true);
      sfx.ok();
      return;
    }
    if (p.bag) ritual();
    if (p.scan) { sfx.refuse(); }
  }

  function ritual() {
    if (settling()) {
      // rushed it: accused again
      frozen.step = "lift";
      frozen.up = false;
      frozen.tries++;
      scale.total = scale.t = RITUAL_SETTLE;
      dennis(pick(SAY.again), true);
      sfx.alarm();
      if (!shell.reduceMotion) shake = 0.6;
      return;
    }
    if (frozen.step === "lift") {
      frozen.up = true;
      frozen.step = "back";
      scale.total = scale.t = RITUAL_SETTLE;
      sfx.lift();
      dennis(SAY.back, true);
    } else if (frozen.step === "back") {
      frozen.up = false;
      frozen.step = "check";
      scale.total = scale.t = RITUAL_SETTLE;
      sfx.lower();
    }
  }

  // ---------------------------------------------------------------------------
  // Loose fruit: no barcode, so the till asks what it is
  // ---------------------------------------------------------------------------
  function openLook(it) {
    var set = SETS[it.fruit];
    var opts = shuffle(set.opts.slice());
    look = { item: it, set: set, opts: opts, answer: opts.indexOf(it.answer), t: 0,
             limit: (stage === 3 ? 4 : stage === 2 ? 4.5 : 5) * mods.lookup, sel: 0, result: null };
    sfx.nag();
    voice("dennis", set.q);
    run.fruit++;
    if (AUTOPILOT) auto.think = 0.7 + rng() * 0.5;
  }

  function tickLook(dt, p) {
    look.t += dt;
    if (look.result) {
      look.result.t += dt;
      if (look.result.t > 0.7) closeLook();
      return;
    }
    if (p.left) { look.sel = (look.sel + 3) % 4; sfx.pick(); }
    if (p.right) { look.sel = (look.sel + 1) % 4; sfx.pick(); }
    // Space (or the pad's button) picks the highlighted one, but not in the
    // first moment, in case you were still scanning, and not from the Scan button
    var confirm = p.scan && look.t > 0.35 && (p.mode === "keys" || p.mode === "pad" || AUTOPILOT);
    var chosen = p.pick >= 0 ? p.pick : confirm ? look.sel : -1;
    if (chosen >= 0) { decide(chosen, false); return; }
    if (look.t >= look.limit) {
      // the machine guesses, and it's always wrong
      var wrong = (look.answer + 1 + Math.floor(Math.random() * 3)) % 4;
      decide(wrong, true);
    }
  }

  function decide(i, guessed) {
    var right = i === look.answer;
    var name = S.FRUIT[look.opts[look.answer]].name;
    var wrong = S.FRUIT[look.opts[i]].name;
    look.sel = i;
    look.result = { i: i, ok: right, guessed: guessed, t: 0 };
    if (right) {
      var quick = Math.max(0, 1 - look.t / look.limit);
      var pts = Math.round((150 + 100 * quick) * mods.points / 10) * 10;
      addScore(pts);
      run.fruitRight++;
      streak++;
      sus = Math.max(0, sus - 5);
      sfx.right();
      float(L.sx, L.belt + 11, "+" + pts, "perfect");
      shell.callout(name + ": confirmed", { sound: false, ms: 1100 });
    } else {
      streak = 0;
      sus += (guessed ? SUS_GUESS : SUS_WRONG) * mods.sus;
      if (guessed) { sfx.guess(); shell.callout("Guessed: " + wrong.toLowerCase(), { ms: 1300 }); }
      else { sfx.wrong(); shell.callout("Charged as " + wrong.toLowerCase(), { ms: 1300 }); }
    }
    look.say = right ? fill(pick(SAY.right), { name: name }) :
      guessed ? fill(SAY.guessed, { wrong: wrong }) : fill(pick(SAY.wrong), { name: wrong, wrong: wrong });
  }

  function closeLook() {
    var it = look.item, line = look.say;
    it.looked = true;
    belt.splice(belt.indexOf(it), 1);
    hand = { item: it, t: 0, from: { x: it.x, y: L.belt } };
    look = null;
    tiles = [];
    run.scanned++;
    dennis(line, true);
  }

  // ---------------------------------------------------------------------------
  // Suspicion: the till's mood. Full, and it accuses you anyway.
  // ---------------------------------------------------------------------------
  function tickSuspicion(dt) {
    if (frozen || look) return;
    if (info().edge && beltWait <= 0) sus += SUS_EDGE / mods.drain * dt;
    else sus -= SUS_DRAIN * mods.drain * dt;
    sus = clamp(sus, 0, 100);
    if (sus > 66 && !susCalled) { susCalled = true; dennis(pick(SAY.high)); }
    if (sus < 45) susCalled = false;
    if (sus >= 100) accuse("watch");
  }
  function afterAccuse() { sus = Math.min(sus, SUS_AFTER); }

  // ---------------------------------------------------------------------------
  // Bev: walks over slowly, swipes without looking, walks off quickly
  // ---------------------------------------------------------------------------
  function needed() { return !!frozen || approvals > 0; }
  function walkTime() { return info().walk * mods.walk; }

  function callBev() {
    if (bev.state === "off" || bev.state === "out") {
      bev.state = "in";
      bev.walking = true;
      bev.coming = Math.random() < 0.6 ? 1.4 : -1;
    }
  }

  function tickBev(dt) {
    var speedIn = (L.bevX - L.bevOff) / walkTime();
    var wasStep = Math.floor(bev.phase / Math.PI);
    if (bev.walking) bev.phase += dt * (bev.state === "out" ? 9 : 5);
    if (bev.coming > 0) {
      bev.coming -= dt;
      if (bev.coming <= 0 && bev.state === "in" && !frozen) dennis(pick(SAY.coming));
      else if (bev.coming <= 0 && bev.state === "in") bev.coming = 1;
    }
    if (bev.state === "in") {
      if (!needed()) {
        bev.state = "out";
        say("bev", pick(BEV.never), true);
      } else {
        bev.x = Math.min(L.bevX, bev.x + speedIn * dt);
        if (bev.x >= L.bevX) {
          bev.state = mods.chat ? "chat" : "swipe";
          bev.walking = false;
          bev.t = 0;
          if (mods.chat) say("bev", pick(BEV.chat), true);
          else if (Math.random() < 0.5) dennis(pick(SAY.arrive));
        }
      }
    } else if (bev.state === "chat") {
      bev.t += dt;
      if (bev.t > mods.chat) { bev.state = "swipe"; bev.t = 0; }
    } else if (bev.state === "swipe") {
      bev.t += dt;
      bev.reach = clamp(bev.t < 0.3 ? bev.t / 0.3 : bev.t > 0.85 ? 1 - (bev.t - 0.85) / 0.25 : 1, 0, 1);
      if (bev.t >= 0.55 && !bev.done) {
        bev.done = true;
        sfx.swipe();
        var froze = !!frozen, ok = approvals > 0;
        if (frozen) { frozen = null; afterAccuse(); sorryT = 0; }
        if (approvals) { run.approved += approvals; approvals = 0; approvalNames = []; }
        var line = froze && ok ? pick(BEV.both) : ok ? pick(BEV.approve) : info().xmas && Math.random() < 0.5 ? pick(BEV.xmas) : pick(BEV.freeze);
        say("bev", line, true);
        shell.callout(ok ? "Approved. Didn't look" : "Sorted. Didn't look", { sound: false, ms: 1300 });
      }
      if (bev.t >= 1.1) { bev.state = "out"; bev.walking = true; bev.done = false; bev.reach = 0; }
    } else if (bev.state === "out") {
      if (needed()) { bev.state = "in"; }
      else {
        bev.x = Math.max(L.bevOff, bev.x - speedIn * 2.2 * dt);
        if (bev.x <= L.bevOff) { bev.state = "off"; bev.walking = false; }
      }
    }
    if (bev.walking && Math.floor(bev.phase / Math.PI) !== wasStep && bev.x > -4) sfx.step();
  }

  // The queue on Christmas Eve: they tut, and now and then they say something
  function tickQueue(dt) {
    if (!queue.length) return;
    queue.forEach(function (q) { q.shout = Math.max(0, q.shout - dt); });
    var chance = (frozen ? 0.18 : 0.05) * dt;
    if (beltWait <= 0 && Math.random() < chance) {
      var i = Math.floor(Math.random() * queue.length);
      queue[i].shout = 1.6;
      say("q" + i, pick(QUEUE));
    }
  }

  // ---------------------------------------------------------------------------
  // Paying, closing, and the stage in between
  // ---------------------------------------------------------------------------
  function paid() {
    if (phase !== "play") return;
    phase = "clear";
    clearT = 0;
    run.shops++;
    var secs = Math.ceil(timeLeft);
    var bonus = secs * TIME_BONUS + (st.accused ? 0 : CLEAN_BONUS);
    addScore(bonus);
    st.bonus = bonus;
    st.secs = secs;
    sfx.paid();
    dennis(pick(SAY.paid), true);
    shell.callout(stage === 3 ? "Paid. Reluctantly" : "Paid", { sound: false, ms: 1300 });
    bubbles = bubbles.filter(function (b) { return b.who === "dennis"; });
  }

  // called a moment after paying: the stage break, or the end of the run
  function stageDone() {
    if (stage >= STAGES.length - 1) { end("paid"); return; }
    var next = stage + 1;
    var offers = offer();
    var stamp = st.accused === 0 ? "Approved" : st.accused === 1 ? "Pending review" : "Not approved";
    var stats = [
      { label: "Items", value: String(info().count) },
      { label: "Perfect", value: String(st.perfect) },
      { label: "Accused", value: times(st.accused) },
      { label: "Time left", value: st.secs + "s" },
      { label: "Score", value: fmt(run.score) }
    ];
    shell.interlude({
      stamp: stamp,
      tilt: stage % 2 ? 4 : -4,
      heading: ["Basket: paid for.", "Trolley: paid for.", "Big shop: paid for."][stage],
      line: info().clear,
      stats: stats,
      ask: "Stage " + (next + 1) + ": " + STAGES[next].name + ". How are you shopping.",
      choices: offers.map(function (c) { return { label: c.label, detail: c.detail }; })
    }).then(function (i) {
      var c = offers[i] || offers[0];
      if (c) { run.taken.push(c.id); c.apply(mods); }
      stage = next;
      startStage();
      paintHud();
      shell.next();
    });
  }

  // three ways of shopping not yet taken, from the run's seed
  function offer() {
    var pool = CHOICES.filter(function (c) { return run.taken.indexOf(c.id) < 0; });
    var out = [];
    while (out.length < 3 && pool.length) out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
    return out;
  }

  function times(n) { return n === 0 ? "Never" : n === 1 ? "Once" : n === 2 ? "Twice" : n + " times"; }

  // the shop shut before you'd paid
  function closed() {
    if (phase !== "play") return;
    phase = "over";
    dennis(SAY.shut, true);
    sfx.shutter();
    shell.callout("Shop: shut", { ms: 1400 });
    end("shut");
  }

  function end(why) {
    var score = Math.round(run.score);
    var rec = shell.record(score);
    var all = why === "paid";
    var rank = all && score >= APPROVED ? 1 : (all || stage >= 3) ? 2 : stage >= 1 ? 3 : 4;
    var heading = all ? (rank === 1 ? "All paid for." : "Paid. Slowly.") : "Shutters down.";
    var stats = [
      { label: "Score", value: fmt(score) },
      { label: "Paid for", value: run.shops + " of 4" },
      { label: "Accused", value: times(run.accused) },
      { label: rec.isNew ? (run.daily ? "New best today" : "New best") : (run.daily ? "Best today" : "Best"),
        value: fmt(rec.isNew ? score : rec.best || 0), highlight: rec.isNew }
    ];
    if (run.daily) stats.unshift({ label: "Run", value: shell.today });
    var accused = run.accused === 0 ? "never accused" : "accused " + times(run.accused).toLowerCase();
    shell.finish({
      place: rank, total: 4,
      heading: heading,
      line: rank === 2 && !all ? "Christmas Eve got you. The machine has kept your picture, for training purposes." : RANKS[rank - 1].line,
      stats: stats,
      delay: all ? 1000 : 1800,
      share: fmt(score) + " points, " + (all ? "paid for everything" : "stage " + (stage + 1) + " of 4") + ", " + accused
    });
    if (all) phase = "over-paid";
  }

  // ---------------------------------------------------------------------------
  // The autopilot (?autopilot, ?clip): a good shopper with one bad habit. Once
  // a shop it gets impatient with the bag, so the clips have the joke in.
  // ---------------------------------------------------------------------------
  function autopilot(dt) {
    var out = { scan: false, bag: false, pick: -1 };
    auto.cool -= dt;
    if (auto.cool > 0) return out;
    if (frozen) {
      if (!settling()) { out.bag = true; auto.cool = 0.35; }
      return out;
    }
    if (look) {
      if (!look.result && look.t > auto.think) {
        // once a run it dithers and lets the machine guess
        if (stage === 1 && !auto.guessed) { if (look.t > look.limit - 0.1) auto.guessed = true; return out; }
        out.pick = look.answer;
        auto.cool = 0.3;
      }
      return out;
    }
    // the bad habit: a second go at the bag while the scale's still wobbling
    if (auto.impatient && auto.bagsHere >= auto.impatientAt && settling() && bagGrace <= 0) {
      auto.impatient = false;
      out.bag = true;
      auto.cool = 0.4;
      return out;
    }
    if (hand && hand.t >= 1) {
      if (!settling()) { out.bag = true; auto.cool = 0.1; }
      return out;
    }
    if (canScan()) {
      for (var i = 0; i < belt.length; i++) {
        var it = belt[i];
        if (!it.bar) continue;
        var c = barCentre(it);
        if (c >= L.sx - 0.45 && c <= L.sx + it.bar.half) { out.scan = true; auto.cool = 0.15; break; }
      }
    }
    return out;
  }

  // ---------------------------------------------------------------------------
  // HUD: stage and the clock top left, score and items top right
  // ---------------------------------------------------------------------------
  function buildHud() {
    shell.hud.innerHTML =
      '<div class="kit-hud-tl">' +
        '<p class="kit-stat"><small>Stage</small><span data-stage>1/4</span></p>' +
        '<p class="kit-stat"><small>Shuts in</small><span data-time>0:45</span></p>' +
      '</div>' +
      '<div class="kit-hud-tr">' +
        '<p class="kit-stat kit-stat-big"><span data-score>0</span></p>' +
        '<p class="kit-stat"><small>Items</small><span data-items>0/6</span></p>' +
      '</div>';
    hudEls = {};
    ["stage", "time", "score", "items"].forEach(function (k) { hudEls[k] = shell.hud.querySelector("[data-" + k + "]"); });
  }
  function setText(node, text) { if (node && node.textContent !== text) node.textContent = text; }
  function paintHud() {
    if (!hudEls || !run) return;
    var s = Math.ceil(timeLeft);
    setText(hudEls.stage, (stage + 1) + "/4");
    setText(hudEls.time, Math.floor(s / 60) + ":" + (s % 60 < 10 ? "0" : "") + (s % 60));
    setText(hudEls.score, fmt(run.score));
    setText(hudEls.items, st.done + "/" + info().count);
    if (shell.padFill) shell.padFill("bag", settling() ? 1 - scale.t / scale.total : 1);
  }

  // ---------------------------------------------------------------------------
  // Drawing (DESIGN.md, section 7): thick ink outlines, flat fills, halftone,
  // the four inks. The shop and the till are cached; everything else is drawn
  // fresh each frame.
  // ---------------------------------------------------------------------------
  function resize(w, h, dpr) {
    W = w; H = h; DPR = dpr;
    U = Math.min(W, H) / 100;
    WW = W / U; WH = H / U;
    ctx = (shell ? shell.canvas : root.querySelector("canvas")).getContext("2d");
    var oldSx = L.sx;
    layout();
    S.init(T || N.tokens(root), U * DPR);
    back = null; front = null; boxes = null;
    // keep the belt where it was, relative to the red line
    if (oldSx != null && oldSx !== L.sx) {
      belt.forEach(function (it) { it.x += L.sx - oldSx; });
      if (bev && bev.state !== "off") bev.x = Math.min(bev.x, L.bevX);
    }
  }

  function newCanvas() {
    var cv = document.createElement("canvas");
    cv.width = Math.round(W * DPR);
    cv.height = Math.round(H * DPR);
    var c = cv.getContext("2d");
    c.scale(DPR * U, DPR * U);
    return { cv: cv, c: c };
  }

  // The shop behind: shelves, the other tills, and ours
  function buildBack() {
    var b = newCanvas(), c = b.c;
    c.fillStyle = T.ink;
    c.fillRect(0, 0, WW, WH);
    // the back wall: shelves in halftone, so it's a shop and not a void
    var r = seeded(11 + stage * 7);
    for (var y = L.belt - 30; y > -10; y -= 11) {
      c.fillStyle = T.ash;
      c.fillRect(0, y, WW, 0.8);
      for (var x = -2; x < WW; ) {
        var w = 3 + r() * 6, h = 4 + r() * 5;
        c.fillStyle = S.dots(c, T.ash, 1.1);
        c.fillRect(x, y - h, w, h);
        x += w + 0.8 + r() * 2;
      }
    }
    // the other tills: one assistant, all of them
    [-1, 1].forEach(function (side) {
      var x0 = L.kx + side * 52;
      tillShape(c, x0, true);
    });
    tillShape(c, L.kx, false);
    // the card reader, where Bev swipes
    var rd = L.reader;
    S.solid(c, S.rr(rd.x - 2.4, rd.y - 3, 4.8, 6, 0.6), T.paper, 0.6);
    c.fillStyle = T.ink;
    c.fillRect(rd.x - 1.6, rd.y - 1.8, 3.2, 0.8);
    S.solid(c, S.ell(rd.x, rd.y + 1.4, 0.6, 0.6), T.accent, 0.3);
    if (info().xmas) S.hat(c, L.kx - L.kW / 2 + 5, L.kTop + 0.4, 5.4, "santa");
    back = b.cv;
  }

  // A till: a green kiosk with a screen. Ours is drawn in full; the others
  // are shapes in the dark.
  function tillShape(c, x, far) {
    var w = L.kW, top = L.kTop;
    var body = S.rr(x - w / 2, top, w, L.belt + 4 - top, 2);
    if (far) {
      c.fillStyle = S.dots(c, T.ash, 1.1);
      c.fill(body);
      S.ink(c, 0.5, T.ash);
      c.stroke(body);
      c.fillStyle = T.ink;
      c.fillRect(x - w / 2 + 3, L.scrT, w - 6, L.scrB - L.scrT);
      S.ink(c, 0.5, T.ash);
      c.strokeRect(x - w / 2 + 3, L.scrT, w - 6, L.scrB - L.scrT);
      return;
    }
    S.solid(c, body, T.accent, 1);
    S.shade(c, body, S.rr(x + w * 0.26, top, w, WH, 0), 1.1);
    S.ink(c, 1);
    c.stroke(body);
    // the screen's bezel
    S.solid(c, S.rr(x - w / 2 + 2, L.scrT - 1, w - 4, L.scrB - L.scrT + 2, 1.2), T.ink, 0.6);
    // speaker grille on the right, where its voice comes from
    for (var i = 0; i < 4; i++) S.line(c, [[x + w / 2 - 1.2, L.scrT + 3 + i * 1.3], [x + w / 2 - 0.4, L.scrT + 3 + i * 1.3]], 0.45);
    // the lamp's stalk
    c.fillStyle = T.ink;
    c.fillRect(x - 0.7, top - 1.6, 1.4, 1.8);
    // its name, on a plate under the screen
    S.solid(c, S.rr(x + 2.4, L.scrB + 1.2, 9, 3.4, 0.5), T.paper, 0.4);
    S.text(c, "Till 4", x + 6.9, L.scrB + 3, 2.4);
    // the suspicion gauge's frame
    S.solid(c, S.rr(x - w / 2 + 2, L.scrB + 1.2, 18, 3.4, 0.5), T.ink, 0.4);
  }

  // The counter in front: the belt's housing, the chute, the bagging shelf
  function buildFront() {
    var b = newCanvas(), c = b.c;
    var y = L.belt;
    // the belt housing, below the belt
    var housing = S.rr(-4, y + 1.4, L.beltEnd + 4, WH - y, 0);
    c.fillStyle = T.ink;
    c.fill(housing);
    c.fillStyle = S.dots(c, T.ash, 1.2);
    c.fillRect(-4, y + 6, L.beltEnd + 4, WH - y);
    // rollers
    for (var x = 2; x < L.beltEnd - 1; x += 8) {
      S.solid(c, S.ell(x, y + 3.6, 1.4, 1.4), T.paper, 0.4);
      c.fillStyle = T.ink;
      c.beginPath(); c.arc(x, y + 3.6, 0.45, 0, 7); c.fill();
    }
    S.ink(c, 0.6, T.paper);
    c.beginPath(); c.moveTo(-4, y + 5.6); c.lineTo(L.beltEnd, y + 5.6); c.stroke();
    // the scanner: a glass window at the red line
    S.solid(c, S.rr(L.sx - 6, y + 1.4, 12, 5, 0.8), T.paper, 0.6);
    S.solid(c, S.rr(L.sx - 4.6, y + 2.4, 9.2, 2.2, 0.4), T.ink, 0.3);
    c.fillStyle = T.red;
    c.fillRect(L.sx - 0.3, y + 2.4, 0.6, 2.2);
    // the chute: anything not scanned goes round again
    var cx = L.chute;
    c.fillStyle = T.ink;
    c.fillRect(L.beltEnd, y - 0.2, 4.8, WH);
    c.save();
    c.beginPath(); c.rect(L.beltEnd, y - 0.2, 4.8, 3); c.clip();
    S.ink(c, 1.2, T.red);
    for (var s = -4; s < 8; s += 2.4) { c.beginPath(); c.moveTo(L.beltEnd + s, y + 3); c.lineTo(L.beltEnd + s + 3, y - 0.2); c.stroke(); }
    c.restore();
    S.ink(c, 0.5, T.paper);
    c.strokeRect(L.beltEnd, y - 0.2, 4.8, 3);
    // the bagging shelf and its front
    var sx0 = L.counter;
    c.fillStyle = T.ink;
    c.fillRect(sx0, y, WW - sx0 + 2, WH);
    c.fillStyle = S.dots(c, T.ash, 1.2);
    c.fillRect(sx0, y + 6, WW - sx0 + 2, WH);
    S.ink(c, 0.8, T.paper);
    c.beginPath(); c.moveTo(sx0, y); c.lineTo(WW + 2, y); c.stroke();
    // the scale plate under the bag
    S.solid(c, S.rr(L.bagX - L.bagW / 2 - 1.6, y - 1, L.bagW + 3.2, 1.4, 0.4), T.paper, 0.5);
    // a sign by the chute
    sign(c, cx + 3.4, y + 15.5, "Round again");
    // the floor
    c.fillStyle = T.ink;
    c.fillRect(-2, L.floor, WW + 4, WH);
    S.ink(c, 0.6, T.ash);
    c.beginPath(); c.moveTo(-2, L.floor); c.lineTo(WW + 2, L.floor); c.stroke();
    // the card machine, and where the receipt comes out
    var tx = L.kx - 12, ty = y + 9;
    S.solid(c, S.rr(tx - 4.2, ty, 8.4, 11, 1), T.paper, 0.6);
    S.solid(c, S.rr(tx - 3, ty + 1.2, 6, 3, 0.4), T.ink, 0.3);
    c.fillStyle = T.ink;
    for (var k = 0; k < 9; k++) c.fillRect(tx - 2.6 + (k % 3) * 2, ty + 5.4 + Math.floor(k / 3) * 1.6, 1.2, 0.9);
    S.solid(c, S.rr(tx - 2.6, ty + 10.2, 5.2, 0.6, 0.2), T.red, 0.2);
    S.solid(c, S.rr(L.kx - 6.4, y + 8, 8, 2.2, 0.6), T.paper, 0.5);
    c.fillStyle = T.ink;
    c.fillRect(L.kx - 5.4, y + 8.9, 6, 0.6);
    front = b.cv;
  }

  // The receipt: it grows with everything you scan
  function drawReceipt(c) {
    var x = L.kx - 2.4, y = L.belt + 9.4;
    var len = Math.min(L.floor - y - 1, 1.5 + st.done * 1.5 + (phase === "clear" ? clearT * 6 : 0));
    var p = new Path2D();
    p.moveTo(x - 2.6, y);
    p.lineTo(x + 2.6, y);
    p.lineTo(x + 2.6, y + len - 0.6);
    for (var i = 0; i < 5; i++) p.lineTo(x + 2.6 - (i + 0.5) * 1.04, y + len + (i % 2 ? -0.6 : 0.2));
    p.lineTo(x - 2.6, y + len - 0.6);
    p.closePath();
    S.solid(c, p, T.paper, 0.4);
    c.fillStyle = T.ink;
    for (var ly = y + 1.4; ly < y + len - 1.2; ly += 1.5) {
      var r = (Math.floor(ly * 7) % 5) / 5;
      c.fillRect(x - 1.8, ly, 1.8 + r * 1.4, 0.36);
      c.fillRect(x + 1, ly, 0.9, 0.36);
    }
  }

  // The basket (or trolley) on the floor: whatever's not on the belt yet
  function drawBasket(c) {
    if (L.compact) return;
    var s = info();
    var trolley = stage > 0;
    var w = trolley ? 26 : 20, h = trolley ? 11 : 9;
    var x = Math.max(w / 2 + 1, L.sx - 40 - w / 2), y = L.floor - (trolley ? 4 : 0.4);
    // what's left, poking out of the top
    c.save();
    c.beginPath(); c.rect(x - w / 2, -50, w, y - h + 2.2 + 50); c.clip();
    var n = Math.min(pending.length, trolley ? 5 : 3);
    for (var i = 0; i < n; i++) {
      var spec = pending[pending.length - 1 - i];
      var id = spec.fruit ? "fruit:" + spec.answer : spec.id;
      S.drawItem(c, id, x - w / 2 + 4.5 + i * (w - 9) / Math.max(1, n - 1 || 1), y - h + 4.6 + (i % 2) * 1.2, K * 0.75);
    }
    c.restore();
    var body = new Path2D();
    body.moveTo(x - w / 2, y - h);
    body.lineTo(x + w / 2, y - h);
    body.lineTo(x + w / 2 - 1.6, y);
    body.lineTo(x - w / 2 + 1.6, y);
    body.closePath();
    if (!trolley) {
      // a red plastic basket, holes and all
      S.solid(c, body, T.red, 0.7);
      c.save(); c.clip(body);
      c.fillStyle = T.ink;
      for (var hy = y - h + 2.4; hy < y - 1; hy += 2.4) {
        for (var hx = x - w / 2 + 1.6; hx < x + w / 2 - 1; hx += 2.6) c.fillRect(hx, hy, 1.4, 1);
      }
      c.restore();
      S.ink(c, 0.7); c.stroke(body);
      c.beginPath(); c.moveTo(x - w / 2 + 3, y - h); c.quadraticCurveTo(x, y - h - 9, x + w / 2 - 3, y - h);
      S.ink(c, 1.6); c.stroke(); S.ink(c, 0.7, T.red); c.stroke();
    } else {
      // a trolley: wire, a handle, four small wheels with opinions
      c.fillStyle = T.ink;
      c.fill(body);
      c.save(); c.clip(body);
      S.ink(c, 0.45, T.paper);
      for (var gx = x - w / 2; gx < x + w / 2; gx += 2.2) { c.beginPath(); c.moveTo(gx, y - h); c.lineTo(gx + 0.6, y); c.stroke(); }
      for (var gy = y - h + 2.6; gy < y; gy += 2.6) { c.beginPath(); c.moveTo(x - w / 2, gy); c.lineTo(x + w / 2, gy); c.stroke(); }
      c.restore();
      S.ink(c, 0.8, T.paper); c.stroke(body);
      S.line(c, [[x + w / 2, y - h], [x + w / 2 + 4, y - h - 3.6]], 0.8, T.paper);
      S.solid(c, S.rr(x + w / 2 + 2.6, y - h - 4.6, 4.6, 1.8, 0.6), stage === 3 ? T.red : T.accent, 0.4);
      S.line(c, [[x - w / 2 + 2, y], [x - w / 2 + 2, y + 2.4]], 0.6, T.paper);
      S.line(c, [[x + w / 2 - 2, y], [x + w / 2 - 2, y + 2.4]], 0.6, T.paper);
      [x - w / 2 + 2, x + w / 2 - 2].forEach(function (wx) { S.solid(c, S.ell(wx, y + 3, 1.4, 1.4), T.ink, 0.5); });
      if (s.xmas) {
        // tinsel, in the game's green
        c.beginPath();
        for (var t = 0; t <= 10; t++) c.lineTo(x - w / 2 + t * w / 10, y - h + 1.2 + (t % 2) * 1.2);
        S.ink(c, 1.4, T.accent); c.stroke();
      }
    }
  }

  function sign(c, x, y, text) {
    var w = S.measure(c, text, 2.6) + 2.4;
    S.solid(c, S.rr(x - w / 2, y - 1.9, w, 3.8, 0.5), T.paper, 0.4);
    S.text(c, text, x, y + 0.15, 2.6);
    // a little arrow going round
    c.beginPath();
    c.arc(x, y - 4.6, 1.4, Math.PI * 0.2, Math.PI * 1.6);
    S.ink(c, 0.5, T.paper);
    c.stroke();
  }

  function seeded(n) {
    return function () { n = (n * 16807) % 2147483647; return (n - 1) / 2147483646; };
  }

  // ---------------------------------------------------------------------------
  // The till's face: the most suspicious face in retail
  // ---------------------------------------------------------------------------
  function mood() {
    if (frozen) return "alarm";
    if (sorryT > 0) return "sorry";
    if (look) return "puzzled";
    if (phase === "clear") return "calm";
    if (sus > 66) return "angry";
    if (sus > 33) return "watch";
    return "calm";
  }

  function drawScreen(c) {
    var x0 = L.kx - L.kW / 2 + 3, x1 = L.kx + L.kW / 2 - 3, y0 = L.scrT, y1 = L.scrB;
    var w = x1 - x0, h = y1 - y0;
    var m = mood();
    var alarm = m === "alarm";
    var flashOn = alarm && (shell.reduceMotion || Math.floor(flashT * 2.5) % 2 === 0);
    c.fillStyle = flashOn ? T.red : T.paper;
    c.fillRect(x0, y0, w, h);
    // the strip along the bottom: what it wants from you right now
    var stripH = Math.min(5.2, h * 0.22);
    c.fillStyle = alarm ? T.ink : T.accent;
    c.fillRect(x0, y1 - stripH, w, stripH);
    S.ink(c, 0.4);
    c.beginPath(); c.moveTo(x0, y1 - stripH); c.lineTo(x1, y1 - stripH); c.stroke();
    var said = instruction();
    var size = Math.min(stripH * 0.66, 3.6);
    while (S.measure(c, said, size) > w - 2 && size > 1.6) size -= 0.2;
    S.text(c, said, L.kx, y1 - stripH / 2 + 0.25, size, { colour: alarm ? T.paper : T.ink });

    // the face
    var fx0 = L.kx, fy = y0 + (h - stripH) * 0.48, R = Math.min(w * 0.42, (h - stripH) * 0.55);
    var ink = T.ink;
    // where it's looking: at the next barcode, at you, or at the fruit
    var target = lookTarget();
    var lx = clamp((target - fx0) / 30, -1, 1);
    var eyeW = R * 0.24, eyeH = R * 0.3;
    var blink = blinkT < 0 && m !== "alarm";
    [-1, 1].forEach(function (s) {
      var ex = fx0 + s * R * 0.45, ey = fy - R * 0.1;
      var open = m === "alarm" ? 1.25 : m === "angry" ? 0.55 : m === "watch" && s === 1 ? 0.6 : m === "sorry" ? 0.85 : 1;
      if (blink) open = 0.08;
      var eh = eyeH * open;
      S.solid(c, S.ell(ex, ey, eyeW * (m === "alarm" ? 1.1 : 1), Math.max(0.3, eh)), T.paper, R * 0.07);
      if (!blink) {
        c.fillStyle = ink;
        var pr = m === "alarm" ? R * 0.06 : R * 0.09;
        var py = m === "sorry" ? eh * 0.4 : m === "watch" || m === "angry" ? eh * 0.15 : 0;
        c.beginPath();
        c.arc(ex + lx * eyeW * 0.5, ey + py, Math.min(pr, eh * 0.9), 0, Math.PI * 2);
        c.fill();
      }
      // eyebrows: furious at rest, more furious when it matters, worried when sorry
      var inner, outer;
      if (m === "sorry") { inner = -R * 0.62; outer = -R * 0.46; }
      else if (m === "alarm") { inner = -R * 0.5; outer = -R * 0.74; }
      else if (m === "puzzled") { inner = s === 1 ? -R * 0.7 : -R * 0.4; outer = s === 1 ? -R * 0.66 : -R * 0.54; }
      else if (m === "angry") { inner = -R * 0.24; outer = -R * 0.56; }
      else if (m === "watch") { inner = s === 1 ? -R * 0.3 : -R * 0.48; outer = s === 1 ? -R * 0.58 : -R * 0.6; }
      else { inner = -R * 0.4; outer = -R * 0.56; }
      S.line(c, [[fx0 + s * R * 0.16, ey + inner], [fx0 + s * R * 0.78, ey + outer]], R * 0.13);
    });
    var my = fy + R * 0.52;
    if (m === "alarm") {
      var open = shell.reduceMotion ? 0.7 : 0.55 + Math.abs(Math.sin(flashT * 9)) * 0.45;
      S.solid(c, S.ell(fx0, my, R * 0.26, R * 0.2 * open + 0.3), T.ink, 0.01);
    } else if (m === "sorry") {
      S.solid(c, S.ell(fx0, my, R * 0.08, R * 0.07), T.ink, 0.01);
    } else if (m === "puzzled") {
      S.line(c, [[fx0 - R * 0.22, my], [fx0, my - R * 0.06], [fx0 + R * 0.22, my + 0.02]], R * 0.09);
    } else {
      var deep = m === "angry" ? 0.32 : m === "watch" ? 0.26 : 0.2;
      c.beginPath();
      c.arc(fx0, my + R * deep, R * 0.3, Math.PI * 1.22, Math.PI * 1.78);
      S.ink(c, R * 0.1);
      c.stroke();
    }
    // the screen's glass
    S.ink(c, 0.5);
    c.strokeRect(x0, y0, w, h);
    c.save();
    c.globalAlpha = 0.5;
    S.line(c, [[x0 + 1.2, y0 + 4], [x0 + 4, y0 + 1.2]], 0.5, T.paper);
    c.restore();

    // the suspicion gauge, on the till under the screen
    var gx = L.kx - L.kW / 2 + 2, gy = L.scrB + 1.2;
    S.text(c, "Suspicion", gx + 0.8, gy + 1.8, 2, { align: "left", colour: T.paper });
    var lit = Math.ceil(sus / 20 - 0.001);
    for (var i = 0; i < 5; i++) {
      var on = i < lit;
      c.fillStyle = on ? T.red : T.ash;
      c.fillRect(gx + 9.4 + i * 1.66, gy + 0.7, 1.3, 2);
    }
  }

  // what the strip on the screen says
  function instruction() {
    if (phase === "over") return "Closed";
    if (phase !== "play") return "Thank you";
    if (frozen) return frozen.step === "lift" ? (settling() ? "Unexpected item" : "Remove the item") : frozen.step === "back" ? (settling() ? "Please wait" : "Replace the item") : "Please wait";
    if (look) return "Look up item";
    if (hand) return settling() ? "Please wait" : "Bag your item";
    if (approvals) return "Approval needed";
    if (beltWait > 0) return "Please wait";
    return "Scan your item";
  }

  function lookTarget() {
    if (look) return L.sx;
    if (frozen || hand) return L.bagX;
    var best = null;
    belt.forEach(function (it) { if (it.bar && barCentre(it) < L.sx + 2 && (!best || barCentre(it) > barCentre(best))) best = it; });
    return best ? barCentre(best) : L.kx;
  }

  function drawLamp(c) {
    var x = L.kx, y = L.kTop - 1.4;
    var on = needed();
    var lit = on && (shell.reduceMotion || Math.floor(flashT * 3) % 2 === 0);
    var dome = new Path2D();
    dome.arc(x, y, 2.4, Math.PI, 0);
    dome.lineTo(x + 2.4, y + 0.6);
    dome.lineTo(x - 2.4, y + 0.6);
    dome.closePath();
    S.solid(c, dome, lit ? T.red : T.paper, 0.5);
    if (lit && !shell.reduceMotion) {
      // light lines, flashing
      S.ink(c, 0.5, T.paper);
      [[-1, -0.6], [0, -1], [1, -0.6]].forEach(function (d) {
        c.beginPath(); c.moveTo(x + d[0] * 3.4, y - 0.6 + d[1] * 2.6); c.lineTo(x + d[0] * 4.8, y - 0.6 + d[1] * 3.8); c.stroke();
      });
    }
    // the other tills' lamps: busy, later in the day
    if (stage >= 2) {
      [-1, 1].forEach(function (side, i) {
        var ox = L.kx + side * 52;
        if (ox < -4 || ox > WW + 4) return;
        var blink = shell.reduceMotion ? i === 0 : Math.floor(flashT * 2 + i) % 2 === 0;
        c.fillStyle = blink ? T.red : T.ash;
        c.beginPath(); c.arc(ox, L.kTop - 1.4, 2, Math.PI, 0); c.fill();
      });
    }
  }

  // ---------------------------------------------------------------------------
  // The belt, the red line, the shopping
  // ---------------------------------------------------------------------------
  function drawBelt(c) {
    var y = L.belt;
    c.fillStyle = T.ink;
    c.fillRect(-4, y - 0.3, L.beltEnd + 4, 1.9);
    // moving ribs, so you can see it go
    c.save();
    c.beginPath(); c.rect(-4, y - 0.3, L.beltEnd + 4, 1.9); c.clip();
    S.ink(c, 0.35, T.ash);
    var off = beltPos % 3.2;
    for (var x = -4 + off; x < L.beltEnd; x += 3.2) { c.beginPath(); c.moveTo(x, y); c.lineTo(x - 0.6, y + 1.4); c.stroke(); }
    c.restore();
    S.ink(c, 0.5, T.paper);
    c.beginPath(); c.moveTo(-4, y - 0.3); c.lineTo(L.beltEnd, y - 0.3); c.stroke();
  }

  function drawLine(c) {
    var y0 = L.lineTop, y1 = L.belt - 0.2, x = L.sx;
    c.fillStyle = T.red;
    c.fillRect(x - 0.28, y0, 0.56, y1 - y0);
    // aim marks at the top
    var tri = new Path2D();
    tri.moveTo(x - 1.6, y0 - 2.2); tri.lineTo(x + 1.6, y0 - 2.2); tri.lineTo(x, y0); tri.closePath();
    S.solid(c, tri, T.red, 0.4);
  }

  // red brackets round a barcode that can be scanned now
  function drawBrackets(c, it) {
    var cx = barCentre(it), cy = L.belt - 0.3 - it.bar.y;
    var k = shell.reduceMotion ? 0 : Math.abs(Math.sin(clock * 10)) * 0.4;
    var hw = it.bar.half + 1 + k, hh = 1.5 * K + 1 + k, a = 1.3;
    var p = new Path2D();
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (q) {
      var x = cx + q[0] * hw, y = cy + q[1] * hh;
      p.moveTo(x, y - q[1] * a); p.lineTo(x, y); p.lineTo(x - q[0] * a, y);
    });
    S.ink(c, 1.1);
    c.stroke(p);
    S.ink(c, 0.55, T.red);
    c.stroke(p);
  }

  function drawItems(c) {
    var ready = canScan();
    belt.forEach(function (it) {
      if (look && it === look.item) return;
      S.drawItem(c, it.id, it.x, L.belt - 0.3, K);
      if (it.fruit && !it.looked) {
        // a tag that says there's no barcode
        tag(c, it.x - 2, L.belt - it.h - 2.4, "?");
      }
    });
    if (ready) {
      var on = scannable();
      if (on) drawBrackets(c, on);
    }
    falls.forEach(function (f) {
      var k = f.t / 0.55;
      c.save();
      c.beginPath(); c.rect(L.beltEnd - 20, -10, 40, L.belt + 2.6 + 10); c.clip();
      S.drawItem(c, f.item.id, f.x + k * 3, L.belt - 0.3 + k * k * 22, K, k * 1.4);
      c.restore();
    });
  }

  function tag(c, x, y, text) {
    S.solid(c, S.rr(x - 1.8, y - 1.8, 3.6, 3.6, 0.6), T.red, 0.4);
    S.text(c, text, x, y + 0.25, 3, { colour: T.paper });
  }

  // the fruit, held up to the scanner while the till looks it up
  function drawHeldFruit(c) {
    if (!look) return;
    var it = look.item;
    var bob = shell.reduceMotion ? 0 : Math.sin(clock * 3) * 0.3;
    S.drawItem(c, it.id, L.sx, L.belt - 0.3 + bob, K * 1.3);
  }

  // ---------------------------------------------------------------------------
  // The bag, the scale, your hand
  // ---------------------------------------------------------------------------
  function bagPath(x, y, w, h) {
    var p = new Path2D();
    p.moveTo(x - w / 2, y - h);
    p.lineTo(x + w / 2, y - h);
    p.lineTo(x + w / 2 - 1, y);
    p.lineTo(x - w / 2 + 1, y);
    p.closePath();
    return p;
  }

  function drawBag(c) {
    var lift = ease(bag.up) * 8;
    var x = L.bagX, y = L.belt - 0.8 - lift, w = L.bagW, h = L.bagH;
    // back handle
    c.beginPath();
    c.moveTo(x - 4.4, y - h); c.quadraticCurveTo(x, y - h - 9, x + 4.4, y - h);
    S.ink(c, 1.5); c.stroke();
    S.ink(c, 0.6, T.paper); c.stroke();
    // what's in it, poking out of the top
    bag.items.forEach(function (id, i) {
      var spread = [-4.6, 3.8, -0.6, 5.4, -5.6, 1.6][i % 6];
      S.drawItem(c, id, x + spread, y - h + 7 + (i % 3) * 0.8, K * 0.8);
    });
    drops.forEach(function (d) {
      var k = ease(d.t);
      S.drawItem(c, d.item.id, x + 1, L.handY + k * 9 - lift, K * (1 - k * 0.2));
    });
    var body = bagPath(x, y, w, h);
    S.solid(c, body, T.paper, 0.8);
    S.shade(c, body, S.rr(x + w * 0.18, y - h, w, h, 0), 1);
    S.ink(c, 0.8);
    c.stroke(body);
    // the print: a big green tick-shaped promise
    S.solid(c, S.ell(x - 1, y - h * 0.48, 4.4, 4.4), T.accent, 0.5);
    S.line(c, [[x - 3, y - h * 0.48], [x - 1.4, y - h * 0.48 + 1.8], [x + 1.6, y - h * 0.48 - 2]], 0.9, T.paper);
    S.text(c, "Bag for life", x - 1, y - 2.4, 2.2);
    // front handle
    c.beginPath();
    c.moveTo(x - 4.4, y - h + 0.2); c.quadraticCurveTo(x - 0.4, y - h - 6.4, x + 3.6, y - h + 0.2);
    S.ink(c, 1.5); c.stroke();
    S.ink(c, 0.6, T.paper); c.stroke();
    if (lift > 0.5 && !shell.reduceMotion) {
      // lifted: little lines under it
      S.ink(c, 0.5, T.paper);
      [-5, 0, 5].forEach(function (d) { c.beginPath(); c.moveTo(x + d, y + 1.6); c.lineTo(x + d, y + 3.4); c.stroke(); });
    }
  }

  // the scale's display, on the counter front: OK, Wait, and the ritual
  function drawScale(c) {
    var x = L.bagX, y = L.belt + 2.6, w = 22, h = 8.4;
    S.text(c, "Bagging area", x, y + h + 2.2, 2.3, { colour: T.paper });
    var waiting = settling();
    var word, bg, fg;
    if (frozen && !waiting) { word = frozen.step === "lift" ? "Lift it" : frozen.step === "back" ? "Put back" : "Wait"; bg = T.paper; fg = T.ink; }
    else if (waiting) { word = "Wait"; bg = T.red; fg = T.paper; }
    else { word = "OK"; bg = T.accent; fg = T.ink; }
    if (waiting && !shell.reduceMotion && Math.floor(flashT * 6) % 2 === 1) { bg = T.paper; fg = T.red; }
    S.solid(c, S.rr(x - w / 2, y, w, h, 1), T.paper, 0.6);
    S.solid(c, S.rr(x - w / 2 + 7.6, y + 1, w - 8.6, h - 2, 0.6), bg, 0.4);
    if (frozen && !waiting) { S.ink(c, 0.6, T.red); c.strokeRect(x - w / 2 + 7.6, y + 1, w - 8.6, h - 2); }
    var size = 4.6;
    while (S.measure(c, word, size) > w - 10.6 && size > 2) size -= 0.2;
    S.text(c, word, x + 3.9, y + h / 2 + 0.35, size, { colour: fg });
    // the dial: the needle swings until it settles
    var dx = x - w / 2 + 3.9, dy = y + h - 1.6;
    var dial = new Path2D();
    dial.arc(dx, dy, 3, Math.PI, 0);
    dial.closePath();
    S.solid(c, dial, T.paper, 0.4);
    var wob = waiting ? Math.sin(clock * 24) * 0.9 * (scale.t / scale.total) : 0;
    var a = -Math.PI / 2 + wob;
    S.line(c, [[dx, dy], [dx + Math.cos(a) * 2.6, dy + Math.sin(a) * 2.6]], 0.5, waiting ? T.red : T.ink);
  }

  function drawHand(c) {
    var lift = ease(bag.up) * 8;
    var from = { x: WW + 6, y: L.handY + 16 };
    if (hand) {
      var k = ease(hand.t);
      var it = hand.item;
      var hx = L.bagX + 1, hy = L.handY;
      // the item flies from the scanner to your hand
      var ix = hand.from.x + (hx - hand.from.x) * k;
      var iy = hand.from.y + (hy - hand.from.y) * k - Math.sin(k * Math.PI) * 8;
      S.hand(c, hx + 0.6, hy + 1.2, from);
      S.drawItem(c, it.id, ix, iy, K);
    } else if (frozen && frozen.up) {
      S.hand(c, L.bagX + 2, L.belt - L.bagH - 3.4 - lift, from);
    } else if (drops.length) {
      S.hand(c, L.bagX + 1.6, L.handY + 6, from);
    } else {
      S.hand(c, L.bagX + 9.6, L.belt - 3.4, from);
    }
  }

  // ---------------------------------------------------------------------------
  // People
  // ---------------------------------------------------------------------------
  function bevPose() {
    var swiping = bev.state === "swipe";
    return {
      phase: bev.phase, walking: bev.walking, reach: bev.reach,
      look: swiping ? -1 : bev.state === "out" ? -1 : 1,
      shut: swiping && bev.reach > 0.5,
      shout: bubbles.some(function (b) { return b.who === "bev" && b.t < 1.2; }),
      mug: bev.state !== "swipe", steam: true, xmas: info().xmas, face: bev.state === "out" ? -1 : 1
    };
  }
  function bevBase() { return L.belt + 3; }

  function drawQueue(c) {
    queue.forEach(function (q, i) {
      var x = L.bevX - 7 - i * 14;
      if (x < -12) return;
      S.shopper(c, x, L.belt + 1 - i * 1.4, 0.82 - i * 0.06, {
        coat: q.coat, hat: q.hat, look: 1, shout: q.shout > 0, tache: q.tache
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Words over the scene: the look-up screen, speech bubbles, the arrow
  // ---------------------------------------------------------------------------
  function hudBoxes() {
    if (boxes) return boxes;
    var base = root.getBoundingClientRect();
    boxes = [];
    Array.prototype.forEach.call(root.querySelectorAll(".kit-hud-tl, .kit-hud-tr, .kit-bar"), function (el) {
      var r = el.getBoundingClientRect();
      if (r.width) boxes.push({ left: r.left - base.left, right: r.right - base.left, bottom: r.bottom - base.top });
    });
    return boxes;
  }
  function hudBottom(left, right) {
    var top = 6;
    hudBoxes().forEach(function (r) { if (left < r.right + 4 && right > r.left - 4) top = Math.max(top, r.bottom + 4); });
    return top;
  }

  // The look-up screen: what's on the scale, four pictures (one of them
  // right) and a clock. A row of four on wide screens, two by two on phones.
  function drawLookup(c) {
    if (!look) { tiles = []; return; }
    var narrow = W < 520;
    var left = 8, right = W - 8, w = right - left;
    var top = hudBottom(left, right);
    var bottom = narrow ? Math.min((L.belt + 13) * U, H - 88) : (L.belt - 14) * U;
    if (bottom - top < 120) bottom = Math.min(H - 8, top + 120);
    var h = bottom - top;
    var pop = shell.reduceMotion ? 1 : ease(look.t * 7);
    c.save();
    c.translate(W / 2, top + h / 2);
    c.scale(0.9 + pop * 0.1, 0.9 + pop * 0.1);
    c.translate(-W / 2, -top - h / 2);
    c.globalAlpha = pop;
    // the card: paper, ink edge, the game's colour along the top
    c.fillStyle = T.paper;
    c.fillRect(left, top, w, h);
    c.fillStyle = T.accent;
    c.fillRect(left, top, w, 5);
    S.ink(c, 2);
    c.strokeRect(left, top, w, h);
    // the question and the clock
    var qs = clamp(U * 3.6, 12, 22);
    var left2 = Math.max(0, look.limit - look.t);
    var q = look.set.q.toUpperCase();
    var qSize = qs;
    c.font = qSize + "px " + T.display;
    while (c.measureText(q).width > w - 16 - qs * 1.6 && qSize > 9) { qSize -= 0.5; c.font = qSize + "px " + T.display; }
    c.fillStyle = T.ink;
    c.textAlign = "left";
    c.textBaseline = "top";
    c.fillText(q, left + 8, top + 11);
    c.font = qs + "px " + T.display;
    c.textAlign = "right";
    c.fillStyle = left2 < 1.5 ? T.red : T.ink;
    if (!look.result) c.fillText(String(Math.ceil(left2)), right - 8, top + 11);
    var barY = top + 15 + qs;
    c.fillStyle = T.ink;
    c.fillRect(left + 8, barY, w - 16, 5);
    c.fillStyle = left2 < 1.5 ? T.red : T.accent;
    c.fillRect(left + 9, barY + 1, (w - 18) * (look.result ? 0 : left2 / look.limit), 3);

    var by = barY + 11, bh = bottom - by - 8, gap = 6;
    var ls = clamp(U * 2.7, 10, 16);
    // what's on the scale, in a dashed frame
    var hw = Math.round(w * (narrow ? 0.27 : 0.19));
    var hx = left + 8;
    c.save();
    c.setLineDash([5, 4]);
    S.ink(c, 1.6);
    c.strokeRect(hx, by, hw, bh);
    c.restore();
    c.font = Math.max(9, ls * 0.85) + "px " + T.display;
    c.fillStyle = T.ink;
    c.textAlign = "center";
    c.textBaseline = "top";
    c.fillText("ON THE SCALE", hx + hw / 2, by + 5);
    var hs = Math.min(hw - 12, bh - ls - 18);
    S.drawFruit(c, look.item.answer, hx + hw / 2, by + ls + 10 + hs * 0.95 + (bh - ls - 18 - hs) / 2, hs, DPR);

    // the four options
    var ox = hx + hw + 8, ow = right - 8 - ox;
    var cols = narrow ? 2 : 4, rows = narrow ? 2 : 1;
    var tw = (ow - gap * (cols - 1)) / cols, th = (bh - gap * (rows - 1)) / rows;
    var side = tw > th * 1.45;
    tiles = [];
    for (var i = 0; i < 4; i++) {
      var tx = ox + (i % cols) * (tw + gap), ty = by + Math.floor(i / cols) * (th + gap);
      var sel = i === look.sel;
      var res = look.result;
      var isAns = res && i === look.answer, isPick = res && i === res.i;
      c.fillStyle = isAns ? T.accent : T.paper;
      c.fillRect(tx, ty, tw, th);
      if (sel && !res) {
        S.ink(c, 1.6); c.strokeRect(tx, ty, tw, th);
        S.ink(c, 3.4, T.accent); c.strokeRect(tx + 2.4, ty + 2.4, tw - 4.8, th - 4.8);
      } else {
        S.ink(c, isPick ? 3.4 : 1.6, isPick && !res.ok ? T.red : T.ink);
        c.strokeRect(tx, ty, tw, th);
      }
      var name = S.FRUIT[look.opts[i]].name.toUpperCase();
      c.font = ls + "px " + T.display;
      c.fillStyle = T.ink;
      var lines, ps;
      if (side) {
        // picture on the left, name on the right
        ps = Math.min(th - 10, tw * 0.46);
        S.drawFruit(c, look.opts[i], tx + 6 + ps / 2, ty + th / 2 + ps * 0.46, ps, DPR);
        lines = wrap(c, name, tw - ps - 16);
        c.textAlign = "left";
        c.textBaseline = "middle";
        lines.forEach(function (ln, k) { c.fillText(ln, tx + ps + 10, ty + th / 2 + (k - (lines.length - 1) / 2) * ls * 0.98 + 1); });
      } else {
        lines = wrap(c, name, tw - 8);
        var labelH = lines.length * ls * 0.95 + 4;
        c.textAlign = "center";
        c.textBaseline = "bottom";
        lines.forEach(function (ln, k) { c.fillText(ln, tx + tw / 2, ty + th - 4 - (lines.length - 1 - k) * ls * 0.95); });
        ps = Math.min(tw - 10, th - labelH - 12);
        S.drawFruit(c, look.opts[i], tx + tw / 2, ty + 8 + ps * 0.96, ps, DPR);
      }
      // the number to press
      var nr = clamp(ls * 0.66, 7, 11);
      c.fillStyle = T.ink;
      c.beginPath(); c.arc(tx + nr + 3, ty + nr + 3, nr, 0, Math.PI * 2); c.fill();
      c.fillStyle = T.paper;
      c.font = (nr * 1.3) + "px " + T.display;
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText(String(i + 1), tx + nr + 3, ty + nr + 3.6);
      tiles.push({ x: tx, y: ty, w: tw, h: th });
    }
    c.restore();
  }

  function wrap(c, text, maxW) {
    var words = text.split(" "), lines = [""];
    words.forEach(function (wd) {
      var tryLine = lines[lines.length - 1] ? lines[lines.length - 1] + " " + wd : wd;
      if (c.measureText(tryLine).width > maxW && lines[lines.length - 1]) lines.push(wd);
      else lines[lines.length - 1] = tryLine;
    });
    return lines.slice(0, 2);
  }

  // Where each speaker's bubble comes from, in CSS pixels
  function anchor(who) {
    if (who === "dennis") return { x: L.dennis.x * U, y: L.dennis.y * U, side: "right" };
    if (who === "bev") return { x: bev.x * U, y: (bevBase() - 37) * U, side: "up" };
    var i = parseInt(who.slice(1), 10);
    var qx = L.bevX - 7 - i * 14;
    return { x: Math.max(4, qx) * U, y: (L.belt + 1 - i * 1.4 - 34 * (0.82 - i * 0.06)) * U, side: "up" };
  }

  // A speech bubble: paper, a thick ink outline, a tail to the speaker, two
  // short lines of capitals at most (DESIGN.md, section 7)
  function drawBubble(c, b, placed) {
    if (b.who === "bev" && bev.state === "off") return;
    if (look && b.who === "dennis") return;
    var a = anchor(b.who);
    var size = clamp(U * 3.3, 11, 20);
    c.font = size + "px " + T.display;
    var maxW = a.side === "right" ? Math.min(W - a.x - 14, size * 15) : Math.min(size * 13, W * 0.46);
    maxW = Math.max(maxW, size * 6);
    var lines = wrapAll(c, b.text.toUpperCase(), maxW - size);
    var tw = 0;
    lines.forEach(function (l) { tw = Math.max(tw, c.measureText(l).width); });
    var pad = size * 0.5, lh = size * 1.02;
    var bw = tw + pad * 2, bh = lines.length * lh + pad * 1.2;
    var bx, by;
    if (a.side === "right") {
      bx = clamp(a.x + size * 0.7, 6, W - bw - 6);
      by = a.y - bh / 2;
    } else {
      bx = clamp(a.x - bw / 2, 6, W - bw - 6);
      by = a.y - bh - size * 0.7;
    }
    var top = hudBottom(bx, bx + bw);
    by = clamp(by, top, H - bh - 6);
    for (var tries = 0; tries < 4; tries++) {
      var hit = null;
      for (var k = 0; k < placed.length; k++) {
        var o = placed[k];
        if (bx < o.x + o.w + 4 && bx + bw + 4 > o.x && by < o.y + o.h + 4 && by + bh + 4 > o.y) { hit = o; break; }
      }
      if (!hit) break;
      by = hit.y + hit.h + 6;
      if (by + bh > H - 6) by = hit.y - bh - 6;
    }
    placed.push({ x: bx, y: by, w: bw, h: bh });
    var pop = shell.reduceMotion ? 1 : clamp(b.t * 8, 0, 1);
    c.save();
    c.globalAlpha = Math.min(pop, clamp((b.life - b.t) * 3, 0, 1));
    var r = Math.min(9, bh / 2);
    c.beginPath();
    if (a.side === "right") {
      var ty = clamp(a.y, by + r + 2, by + bh - r - 2);
      c.moveTo(bx + r, by);
      c.arcTo(bx + bw, by, bx + bw, by + bh, r);
      c.arcTo(bx + bw, by + bh, bx, by + bh, r);
      c.arcTo(bx, by + bh, bx, by, r);
      c.lineTo(bx, ty + 5);
      c.lineTo(a.x + 2, a.y);
      c.lineTo(bx, ty - 4);
      c.arcTo(bx, by, bx + bw, by, r);
    } else {
      var under = by > a.y;
      var tx = clamp(a.x, bx + 12, bx + bw - 12);
      c.moveTo(bx + r, by);
      if (under) { c.lineTo(tx - 5, by); c.lineTo(tx - 2, by - size * 0.7); c.lineTo(tx + 6, by); }
      c.arcTo(bx + bw, by, bx + bw, by + bh, r);
      c.arcTo(bx + bw, by + bh, bx, by + bh, r);
      if (!under) { c.lineTo(tx + 6, by + bh); c.lineTo(tx - 2, by + bh + size * 0.7); c.lineTo(tx - 5, by + bh); }
      c.arcTo(bx, by + bh, bx, by, r);
      c.arcTo(bx, by, bx + bw, by, r);
    }
    c.closePath();
    c.fillStyle = T.paper;
    c.fill();
    c.lineWidth = 2.4;
    c.lineJoin = "round";
    c.strokeStyle = T.ink;
    c.stroke();
    c.fillStyle = T.ink;
    c.textAlign = "center";
    c.textBaseline = "top";
    lines.forEach(function (l, i) { c.fillText(l, bx + bw / 2, by + pad * 0.7 + i * lh); });
    c.restore();
  }
  function wrapAll(c, text, maxW) {
    var words = text.split(" "), lines = [""];
    words.forEach(function (wd) {
      var tryLine = lines[lines.length - 1] ? lines[lines.length - 1] + " " + wd : wd;
      if (c.measureText(tryLine).width > maxW && lines[lines.length - 1]) lines.push(wd);
      else lines[lines.length - 1] = tryLine;
    });
    return lines;
  }

  // A bobbing arrow pointing down at the one thing to deal with right now
  function drawArrow(c, x, y, word, dir) {
    var bob = shell.reduceMotion ? 0 : Math.abs(Math.sin(clock * 4)) * -1.4;
    c.save();
    if (dir === "right") c.translate(x + bob, y); else c.translate(x, y + bob);
    c.save();
    if (dir === "right") c.rotate(-Math.PI / 2);
    c.beginPath();
    c.moveTo(-1.4, -4.4); c.lineTo(1.4, -4.4); c.lineTo(1.4, -1.8); c.lineTo(3, -1.8); c.lineTo(0, 1.4); c.lineTo(-3, -1.8); c.lineTo(-1.4, -1.8);
    c.closePath();
    c.fillStyle = T.paper;
    c.fill();
    S.ink(c, 0.55);
    c.stroke();
    c.restore();
    var size = Math.max(3, 12 / U);
    if (dir === "right") S.text(c, word, -3, -3.6, size, { base: "bottom", colour: T.paper, stroke: size * 0.32 });
    else S.text(c, word, 0, -5.2, size, { base: "bottom", colour: T.paper, stroke: size * 0.32 });
    c.restore();
  }

  // The one hint worth showing right now, until you've shown you know.
  // Bag hints come in from the side, so they stay clear of the till's voice.
  function hint() {
    if (phase !== "play" || look) return null;
    var t = touching();
    var bx = L.bagX - L.bagW / 2 - 0.8, by = L.belt - 0.8 - ease(bag.up) * 8 - L.bagH * 0.45;
    if (frozen && !learned.ritual) {
      if (settling()) return { x: bx, y: by, word: "Wait", dir: "right" };
      if (frozen.step === "lift") return { x: bx, y: by, word: t ? "Lift: tap Bag" : "Lift it: B", dir: "right" };
      if (frozen.step === "back") return { x: bx, y: by, word: t ? "Put back: tap Bag" : "Put back: B", dir: "right" };
      return null;
    }
    if (frozen) return null;
    if (hand && hand.t >= 1 && learned.bag < 2) {
      if (settling()) return { x: bx, y: by, word: "Wait", dir: "right" };
      return { x: bx, y: by, word: t ? "Tap Bag" : "Bag: press B", dir: "right" };
    }
    if (!hand && learned.scan < 3 && beltWait <= 0) {
      var soon = belt.some(function (it) { return it.bar && barCentre(it) > L.sx - 12 && barCentre(it) < L.sx + 2; });
      if (soon) return { x: L.sx, y: L.lineTop - 3, word: t ? "Tap Scan" : "Scan: Space" };
    }
    return null;
  }

  function drawFloats(c) {
    floats.forEach(function (f) {
      var k = f.t / f.life;
      var size = Math.max(3.4, 13 / U);
      c.save();
      c.globalAlpha = 1 - k * k;
      S.text(c, f.text, f.x, f.y - k * 5, size, { base: "bottom", stroke: size * 0.3,
        colour: f.kind === "miss" ? T.red : f.kind === "perfect" ? T.accent : T.paper });
      c.restore();
    });
  }

  function drawFx(c) {
    fx.forEach(function (e) {
      var k = e.t / e.life;
      if (e.kind === "puff") {
        // white circles with the accent behind (DESIGN.md, section 7)
        c.save();
        c.globalAlpha = 1 - k;
        [[-1.4, 0, 1.2], [0.6, -0.8, 1.5], [1.8, 0.3, 1]].forEach(function (b) {
          c.fillStyle = T.accent;
          c.beginPath(); c.arc(e.x + b[0] * (1 + k) + 0.5, e.y + b[1] - k * 3 + 0.5, b[2] * (0.7 + k), 0, 7); c.fill();
          c.fillStyle = T.paper;
          c.beginPath(); c.arc(e.x + b[0] * (1 + k), e.y + b[1] - k * 3, b[2] * (0.7 + k), 0, 7); c.fill();
        });
        c.restore();
      } else if (e.kind === "flash") {
        c.save();
        c.globalAlpha = 1 - k;
        S.ink(c, 0.5, T.paper);
        for (var i = 0; i < 6; i++) {
          var a = i * Math.PI / 3, r0 = 2 + k * 3, r1 = r0 + 2;
          c.beginPath();
          c.moveTo(L.sx + Math.cos(a) * r0, L.lineTop + 6 + Math.sin(a) * r0);
          c.lineTo(L.sx + Math.cos(a) * r1, L.lineTop + 6 + Math.sin(a) * r1);
          c.stroke();
        }
        c.restore();
      }
    });
  }

  // the shutters come down when the shop shuts
  function drawShutter(c) {
    if (!shutter) return;
    var h = ease(shutter) * WH;
    c.fillStyle = T.paper;
    c.fillRect(0, 0, WW, h);
    S.ink(c, 0.6);
    for (var y = h; y > 0; y -= 3.2) { c.beginPath(); c.moveTo(0, y); c.lineTo(WW, y); c.stroke(); }
    c.fillStyle = S.dots(c, T.ink, 1.2);
    c.fillRect(0, 0, WW, h);
    c.fillStyle = T.red;
    c.fillRect(0, h - 2.4, WW, 2.4);
    S.ink(c, 0.6);
    c.strokeRect(-1, h - 2.4, WW + 2, 2.4);
  }

  function render() {
    if (!ctx || !run) return;
    if (!noticed && (shell.state() === "countdown" || shell.state() === "playing")) {
      noticed = true;
      shell.brief({ title: "Stage " + (stage + 1) + ": " + info().name, text: info().brief, ms: stage === 0 ? 7000 : 6000 });
    }
    if (!back) buildBack();
    if (!front) buildFront();
    var c = ctx;
    c.setTransform(1, 0, 0, 1, 0, 0);
    var sx = 0, sy = 0;
    if (shake > 0 && !shell.reduceMotion) { sx = (Math.random() - 0.5) * 5 * shake; sy = (Math.random() - 0.5) * 5 * shake; }
    c.drawImage(back, sx * DPR, sy * DPR);
    c.setTransform(DPR * U, 0, 0, DPR * U, sx * DPR, sy * DPR);
    drawLamp(c);
    drawScreen(c);
    drawQueue(c);
    if (bev.state !== "off") S.bev(c, bev.x, bevBase(), bevPose());
    drawBelt(c);
    drawItems(c);
    if (!look) drawLine(c);
    c.setTransform(DPR, 0, 0, DPR, sx * DPR, sy * DPR);
    c.drawImage(front, 0, 0, W, H);
    c.setTransform(DPR * U, 0, 0, DPR * U, sx * DPR, sy * DPR);
    if (look) { drawLine(c); drawHeldFruit(c); }
    drawReceipt(c);
    drawBasket(c);
    drawScale(c);
    drawBag(c);
    drawHand(c);
    drawFx(c);
    drawFloats(c);
    drawShutter(c);

    // words, in screen pixels, so they stay readable on a phone
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (++boxAge > 60) { boxes = null; boxAge = 0; }
    drawLookup(c);
    var placed = [];
    var h = hint();
    if (h) placed.push(h.dir === "right" ? { x: (h.x - 16) * U, y: (h.y - 9) * U, w: 22 * U, h: 12 * U } : { x: (h.x - 9) * U, y: (h.y - 9) * U, w: 18 * U, h: 11 * U });
    bubbles.forEach(function (b) { drawBubble(c, b, placed); });
    if (h) {
      c.setTransform(DPR * U, 0, 0, DPR * U, 0, 0);
      drawArrow(c, h.x, h.y, h.word, h.dir);
    }
  }

  // ---------------------------------------------------------------------------
  // Start it up
  // ---------------------------------------------------------------------------
  shell = N.createGame({
    root: root,
    slug: "unexpected-item",
    title: "Unexpected Item",
    stamp: "Approval needed",
    tilt: -4,
    note: "Four shops, one machine, one assistant. The machine thinks you're stealing.",
    pitch: "Scan your own shopping. The machine thinks you're stealing it.",
    hints: {
      keys: "Space to scan as the barcode crosses the red line. B to bag, when the scale says OK. 1 to 4 to look up fruit. P to pause.",
      touch: "Scan on the right, as the barcode crosses the red line. Bag on the left, when the scale says OK."
    },
    againLabel: "Shop again",
    daily: true,
    smallCallouts: true,
    keys: {
      up: [], down: [],
      left: ["ArrowLeft", "KeyA"], right: ["ArrowRight", "KeyD"],
      action: ["Space", "ArrowUp", "KeyW"],
      bag: ["KeyB", "ArrowDown", "KeyS"],
      one: ["Digit1", "Numpad1"], two: ["Digit2", "Numpad2"], three: ["Digit3", "Numpad3"], four: ["Digit4", "Numpad4"]
    },
    pad: { action: [0, 7], bag: [1, 6] },
    touch: [
      { key: "bag", label: "Bag", icon: "Bag", side: "left" },
      { key: "action", label: "Scan", icon: "Scan", side: "right" }
    ],
    reset: reset,
    update: function (dt, input) { update(dt, input); },
    render: function () { render(); },
    resize: resize
  });
  T = shell.tokens;
  S.init(T, U * DPR);

  // taps and clicks on the screen itself (the buttons look after themselves)
  root.addEventListener("pointerdown", function (e) {
    if (shell.state() !== "playing") return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    var t = e.target;
    if (t && t.closest && t.closest(".kit-pad, .kit-bar, .kit-panel, button, a")) return;
    var box = root.getBoundingClientRect();
    taps.push({ x: e.clientX - box.left, y: e.clientY - box.top });
  });

  // The canvas font may arrive after the first frame: redraw the signs when it does
  if (document.fonts && document.fonts.load) {
    document.fonts.load("12px " + T.display).then(function () { back = null; front = null; S.flush(); });
  }

  if (DEBUG) {
    window.__unexpectedItem = {
      state: function () { return shell.state(); },
      run: function () { return run; },
      stage: function () { return stage; },
      sus: function () { return sus; },
      belt: function () { return belt; },
      score: function () { return { stage: stage + 1, score: Math.round(run.score), accused: run.accused, scanned: run.scanned, perfect: run.perfect, left: Math.round(timeLeft) }; },
      accuse: function () { accuse("bag"); },
      setSus: function (v) { sus = v; },
      tiles: function () { return tiles; },
      // everything a test needs to play by the rules, in one snapshot
      peek: function () {
        return {
          state: shell.state(), phase: phase, stage: stage, sx: L.sx, speed: info().belt * mods.belt, beltWait: beltWait,
          bars: belt.filter(function (b) { return b.bar; }).map(function (b) { return { c: barCentre(b), half: b.bar.half }; }),
          hand: !!hand, handReady: !!hand && hand.t >= 1, settling: scale.t, frozen: frozen ? frozen.step : null,
          look: look ? { answer: look.answer, t: look.t, limit: look.limit, result: !!look.result } : null,
          score: Math.round(run.score), accused: run.accused, perfect: run.perfect, scanned: run.scanned,
          timeLeft: timeLeft, approvals: approvals, sus: sus, bev: bev.state, U: U
        };
      }
    };
  }
})();
