// Leave It at the Door: a delivery rider's shift, seen from above. Deliver
// the food. The app has promised it was already here.
//
// THE JOKE. Delivery apps' pay and promise model. The app hands you orders
// whether you like it or not, pays you pennies for each, promises the
// customer a time and then shrinks it, tells them you're outside when you
// aren't, adds a rain fee for them and a 10p weather bonus for you, and
// counts a tip as part of your pay. The rider is the sympathetic one and
// never the punchline; customers can be short with you, but what they're
// short about is what the app told them. Two numbers on the phone run all
// shift: what customers paid in fees, and what you earned.
//
// THE LOOP. Orders arrive on their own (the app accepts them for you). Each
// has a pickup (a restaurant, or one of the twelve "restaurants" in the
// car park, which are one kitchen) and a door, a promised time, a tiny pay
// and a note from the customer. Ride to the pickup and wait while it's
// being prepared (or go and drop something else off and come back), then
// ride to the door. The bag holds three. The skill is in the order you do
// things: which pickup first, what to drop on the way, when to wait.
//
// THE DOORS. At every door the customer's note says what to do, and the
// doorstep cycles through the choices: the bell or a knock ("Don't ring,
// baby asleep"), a gate code ("Gate code 2741"), the right door for the
// photo ("Leave it at the door. We're 14B"). Press when it shows what the
// note asked for. One rule for the one button, everywhere. Some flats are
// round the back through the bins, and the app's pin is at the front.
//
// THE CONTROLS. Arrow keys or WASD steer along the streets like a tram
// with opinions: press a turn before the junction and it's taken there;
// press back the other way to turn round. Space (or Enter) at a door. A
// click or a tap on the map rides there along the streets (on a pin, to
// that stop); a tap on an order on the phone rides to its next stop; a
// swipe steers like a key. At a door, a tap or a click on the doorstep is
// the button. Nothing needs both hands.
//
// RATING. Starts at 4.90. On time nudges it up, late takes it down by how
// late, a woken baby, soggy food or a wrong photo take a bit, a cancelled
// order takes more. Under 4.50 the account is deactivated and the shift
// ends. Approved needs the whole shift, 4.80 or better and 26 deliveries.
//
// THE STAGES. Lunch (bell, knock and gate codes), Rain (late turns skid,
// puddles soak the food, photos at the door), Friday night (one-way
// streets, car doors, round the back), the Cup final (everyone orders at
// once and again at every goal; the high street is a precinct). Between
// them the app offers three things, each with a cost.
//
// TODAY'S RUN. Each stage deals its orders (pickups, doors, notes, pay,
// fees, when they come) and its car doors from its own seeded stream,
// drawn from shell.random at the start; promised times follow your riding.
//
// THE AUTOPILOT (?autopilot, ?clip) picks the stop with the least time to
// spare, rides there along the streets, reads the note and presses with a
// human delay, and now and then presses on the wrong thing.
//
// ?debug exposes window.__leave, and takes &stage=N to start at stage N.
(function () {
  "use strict";

  var N = window.Notaste, TW = window.LeaveTown, A = window.LeaveArt;
  var root = document.getElementById("game-root");
  if (!N || !root || !TW || !A) return;

  var params = new URLSearchParams(location.search);
  var DEBUG = params.has("debug");

  var SPEED = 27;          // units a second
  var BAG = 3;
  var START = 4.9, FLOOR = 4.5;
  var SKID = 3.6;            // in the rain, a turn pressed this close to the junction skids past it
  var APPROVE = { rating: 4.8, delivered: 26 };

  var STAGES = [
    { key: "lunch", name: "Lunch", start: 12 * 60, len: 40, gap: [4.4, 5.4], types: { bell: 3, knock: 3, code: 2 },
      k: 1.6, slack: 4, shrink: 0.3, batch: 0.15, prep: [1.6, 3.4],
      brief: "Orders arrive by themselves. Ride to the pickup, then the door: arrow keys steer, or tap where to go. At the door, read the note and press when it shows what they asked for." },
    { key: "rain", name: "Rain", start: 15 * 60, len: 40, gap: [4.0, 5.0], types: { bell: 2, knock: 2, code: 2, photo: 3 },
      k: 1.55, slack: 4, shrink: 0.45, batch: 0.22, prep: [1.5, 3.2], rain: true,
      brief: "Rain. Press your turn before the junction or you'll skid past it. Puddles soak the food. The app has added a 10p weather bonus for you, and a rain fee for them." },
    { key: "friday", name: "Friday night", start: 19 * 60, len: 42, gap: [3.6, 4.5], types: { bell: 2, knock: 2, code: 2, photo: 2, back: 3 },
      k: 1.6, slack: 4, shrink: 0.55, batch: 0.3, prep: [1.4, 3.0], oneway: true, cars: true,
      brief: "Friday night. One-way streets: go the wrong way and you push. Parked cars open their doors: when the light comes on, wait. Some flats are round the back. The app's pin isn't." },
    { key: "final", name: "Cup final", start: 20 * 60, len: 44, gap: [3.2, 4.0], types: { bell: 2, knock: 3, code: 2, photo: 2, back: 2 },
      k: 1.55, slack: 4, shrink: 0.6, batch: 0.35, prep: [1.3, 2.8], oneway: true, cars: true, precinct: true, goals: 2,
      brief: "Cup final. Everyone orders at once, and again at every goal. The high street is a precinct: walk your bike through it." }
  ];

  // ---------------------------------------------------------------------------
  // Copy
  // ---------------------------------------------------------------------------
  var NAMES = ["Dawn", "Gary", "Priya", "Tom", "Shaz", "Kev", "Jo", "Linda", "Mo", "Bex", "Dev", "Pat", "Ellie", "Sunil", "Marge", "Craig", "Aisha", "Den"];
  var NOTES = {
    bell: ["Ring the bell. I'm upstairs.", "Ring the bell. Loudly.", "Bell works. Ring it.", "Ring the bell. Ignore the dog."],
    knock: ["Don't ring. Baby asleep.", "Bell's broken. Knock.", "Don't ring the bell. Knock.", "Knock. The dog goes mad at the bell.", "Don't ring. Night shift. Knock."],
    code: ["Gate code {code}.", "Code for the gate is {code}.", "Buzz in. Code {code}."],
    photo: ["Leave it at the door. We're {no}.", "Leave it at the door. Photo please. {no}, not next door."],
    back: ["Flat {flat}. Round the back through the bins. {bk}", "Flat {flat}. Round the back, past the bins. {bk}"]
  };
  var BACK_BK = { Bell: "Ring.", Knock: "Knock." };
  var LINES = {
    onTime: ["The app said you were outside.", "Ta. The app said you'd been.", "Cheers. Is it hot.", "Lovely. Is there sauce.", "The app said ten past. It's ten past.", "Thanks. Sorry about the stairs."],
    late: ["The app said twelve minutes.", "The app had you in the canal.", "It said you were outside. Twice.", "Cold. Not your fault. Still cold.", "The map had you going round the park."],
    baby: ["That's the baby up. Brilliant.", "The baby. You absolute melon."],
    soggy: ["Why is it wet.", "It's soup now. It wasn't soup."],
    gate: ["That's not the code, you lemon.", "Wrong code. Try the right one."],
    trap: ["Round the back, you plonker.", "Not this door. Read the note."],
    final: ["Did you see that goal.", "Quick. It's extra time."]
  };
  var CHOICES = [
    { key: "ebike", label: "Rent an e-bike", detail: "A fifth faster everywhere. £5 a stage, from your pay.", cost: 500, every: true },
    { key: "mudguards", label: "Mudguards", detail: "Puddles don't soak the food. £4.", cost: 400, from: 0 },
    { key: "all", label: "Accept all orders", detail: "A third more orders, 15p more each. You weren't asked before either.", cost: 0 },
    { key: "bag", label: "Bigger bag", detail: "Carry four, not three. A tenth slower: it catches the wind.", cost: 0 },
    { key: "mount", label: "Phone mount", detail: "The way to your next stop is drawn on the map. £3.", cost: 300 },
    { key: "bell", label: "Bike bell", detail: "Crowds let you through. The precinct is half as slow. £2.", cost: 200, from: 2 },
    { key: "plus", label: "Rider Plus", detail: "Pay to be offered pickups nearer to you. £6 a stage.", cost: 600, every: true },
    { key: "meal", label: "Meal deal", detail: "You stop being hungry. Nothing else changes. £3.50.", cost: 350 }
  ];
  var RESULT_LINES = {
    approved: "Rated {r}. The app has offered you more hours at the same rate.",
    pending: "Shift complete. The app is deciding whether you were efficient enough to keep.",
    notApproved: ["Deactivated on Friday night. The app thanks you for your flexibility.", "Deactivated during the cup final. Nobody noticed. They were watching the cup final."],
    rejected: ["Deactivated at lunch. An automated email will explain. It won't.", "Deactivated in the rain. The weather bonus has been kept."]
  };

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  var shell = null, T = null, ctx = null;
  var W = 1, H = 1, DPR = 1, L = null;
  var townCanvas = null, townKey = "";
  var stageIdx = 0, stage = null, clock = 0, rng = null, carRng = null;
  var rider, route, orders, deals, dealAt, nextTag;
  var rating, earned, fees, delivered, onTime, lateCount, cancelled, babies;
  var stageStats, owned, toasts, mapBubbles, fx, doorstep, taught, prev, hudEls, briefed, ended, goalsAt, toldOutside;
  var pointerDown = null, autoT = 0, autoDoorT = 0, autoWrong = false;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function money(p) { return (p < 0 ? "-£" : "£") + (Math.abs(p) / 100).toFixed(2); }
  function pick(list, r) { return list[Math.floor((r || Math.random)() * list.length)]; }
  function hhmm(min) { min = Math.floor(min); var h = Math.floor(min / 60) % 24, m = min % 60; return h + ":" + (m < 10 ? "0" : "") + m; }
  function now() { return stage.start + clock; }
  function opp(d) { return { L: "R", R: "L", U: "D", D: "U" }[d]; }

  function reset(sh) {
    shell = sh;
    T = sh.tokens;
    A.init(T);
    stageIdx = DEBUG ? clamp((parseInt(params.get("stage"), 10) || 1) - 1, 0, 3) : 0;
    rating = START; earned = 0; fees = 0; delivered = 0; onTime = 0; lateCount = 0; cancelled = 0; babies = 0;
    owned = {};
    taught = { pick: false, door: false, note: false };
    nextTag = 1;
    // every stage's own stream, drawn now, so a choice never changes what a later stage deals
    var seeds = [0, 1, 2, 3].map(function () { return Math.floor(sh.random() * 4294967296); });
    STAGES.forEach(function (st, i) { st.seed = seeds[i]; });
    ended = false;
    if (!hudEls) buildHud();
    startStage();
  }

  function startStage() {
    stage = STAGES[stageIdx];
    clock = 0;
    rng = N.seeded(stage.seed);
    carRng = N.seeded(stage.seed ^ 0x5bd1e995);
    TW.setStage({ puddles: stageIdx >= 1, oneway: !!stage.oneway, cars: !!stage.cars, precinct: !!stage.precinct });
    TW.edges.forEach(function (e) { e.cars.forEach(function (c, i) { c.wait = 1.5 + carRng() * 4 + i * 0.6; c.state = "parked"; c.t = 0; c.col = Math.floor(carRng() * 2); }); });
    TW.plan({ precinct: owned.bell ? 1.5 : 2.2 });
    var start = TW.placeAt(73, TW.YS[2] - 6, false);
    rider = { e: start.e, s: start.s, dir: 0, facing: "D", v: 0, q: null, qLate: false, busy: null, last: null, lastS: 0,
              pedal: 0, stun: 0, wobble: 0, push: false, resumeDir: 0, resumeT: 0, skidT: 0, splashT: 0, idleT: 0 };
    route = null;
    orders = [];
    toasts = [];
    mapBubbles = [];
    fx = [];
    doorstep = null;
    prev = {};
    briefed = false;
    toldOutside = false;
    stageStats = { delivered: 0, onTime: 0, late: 0, earned: 0, fees: 0, rating0: rating, cancelled: 0 };
    dealStage();
    toast(stageIdx === 0 ? "You're online. Orders will be accepted for you." : stageIdx === 1 ? "Weather bonus: 10p. Stay safe out there." :
          stageIdx === 2 ? "It's Friday. Demand is high. Pay is not." : "Cup final tonight. Big match fee for customers: £2.99.");
    if (stageIdx >= 1 && owned.ebike) charge(500, "E-bike rental");
    if (stageIdx >= 1 && owned.plus) charge(600, "Rider Plus");
    townKey = "";
    paintHud();
  }

  function charge(p, why) {
    earned -= p;
    stageStats.earned -= p;
    toast(why + ": " + money(p) + ". Taken from your pay.");
  }

  // ---------------------------------------------------------------------------
  // Orders: what the stage deals, from its own stream
  // ---------------------------------------------------------------------------
  function weighted(map, r) {
    var keys = Object.keys(map), sum = 0;
    keys.forEach(function (k) { sum += map[k]; });
    var x = r() * sum;
    for (var i = 0; i < keys.length; i++) { x -= map[keys[i]]; if (x <= 0) return keys[i]; }
    return keys[0];
  }
  function dealStage() {
    deals = [];
    var t = 0.8, gapK = owned.all ? 0.75 : 1;
    // goals in the cup final: two bursts
    goalsAt = [];
    if (stage.goals) { goalsAt = [12 + rng() * 6, 27 + rng() * 6]; }
    while (t < stage.len - 7) {
      deals.push({ t: t, d: makeDeal() });
      t += (stage.gap[0] + rng() * (stage.gap[1] - stage.gap[0])) * gapK;
    }
    goalsAt.forEach(function (g) {
      for (var i = 0; i < 2; i++) deals.push({ t: g + i * 0.3, d: makeDeal(), goal: i === 0 });
    });
    deals.sort(function (a, b) { return a.t - b.t; });
    // the first order of the shift comes from near the start, so the first ride is short
    dealAt = 0;
  }
  function makeDeal() {
    var r = rng;
    var rests = TW.restaurants;
    var rA = r() < 0.36 ? rests[4] : rests[Math.floor(r() * 4)];
    var rB = r() < 0.36 ? rests[4] : rests[Math.floor(r() * 4)];
    var type = weighted(stage.types, r);
    var hs = r(), hs2 = r();
    var d = {
      restA: rA, restB: rB, type: type, houseR: hs, houseR2: hs2,
      brand: rA.dark || rB.dark ? pick(TW.DARK_BRANDS, r) : null,
      name: pick(NAMES, r), note: Math.floor(r() * 10), look: Math.floor(r() * A.LOOKS.length),
      pay: 180 + Math.floor(r() * 90), fee: 249 + Math.floor(r() * 4) * 50, service: 160 + Math.floor(r() * 120),
      small: r() < 0.3 ? 150 : 0, prep: stage.prep[0] + r() * (stage.prep[1] - stage.prep[0]),
      shrinkAt: 0.25 + r() * 0.35, shrinkBy: 1 + Math.floor(r() * 3), shrink: r() < stage.shrink,
      code: [r(), r(), r(), r()].map(function (x) { return Math.floor(x * 10); }), perm: r(), bk: r() < 0.5 ? "Bell" : "Knock",
      first: r(), tip: r(), opt: r(), batch: r()
    };
    return d;
  }

  function stopOf(o) { return o.state === "assigned" ? o.rest.stop : (o.type === "back" && o.frontTried ? o.house.back : o.house.front); }
  function realStop(o) { return o.state === "assigned" ? o.rest.stop : (o.type === "back" ? o.house.back : o.house.front); }
  function bagCount() { var n = 0; orders.forEach(function (o) { if (o.state === "bag") n++; }); return n; }
  function bagSize() { return owned.bag ? 4 : BAG; }
  function riderPlace() { return { e: rider.e, s: rider.s }; }
  function travel(a, b) { return TW.route(a, b).cost / speedNow(true); }

  function assign(deal, batched, restOverride) {
    if (orders.filter(function (o) { return o.state === "assigned" || o.state === "bag"; }).length >= 7) return null;
    var rest = restOverride || deal.restA;
    if (!restOverride && owned.plus) {
      var here = riderPlace();
      rest = TW.route(here, deal.restA.stop).cost <= TW.route(here, deal.restB.stop).cost ? deal.restA : deal.restB;
    }
    // a door not already waiting for something, not on the restaurant's doorstep
    var busy = {};
    orders.forEach(function (o) { if (o.state === "assigned" || o.state === "bag") busy[o.house.front.id] = true; });
    var pool = TW.houses.filter(function (hs) {
      if (busy[hs.front.id]) return false;
      if (deal.type === "back" ? hs.kind !== "flat" : false) return false;
      var dx = hs.front.x - rest.stop.x, dy = hs.front.y - rest.stop.y;
      return Math.hypot(dx, dy) > 18;
    });
    if (!pool.length) return null;
    var house = pool[Math.floor(deal.houseR * pool.length)];
    var type = deal.type;
    var o = {
      id: nextTag++, rest: rest, house: house, type: type, state: "assigned", batched: !!batched,
      brand: rest.dark ? deal.brand || pick(TW.DARK_BRANDS) : rest.name, name: deal.name, look: A.LOOKS[deal.look],
      pay: deal.pay + (owned.all ? 15 : 0) + (stage.rain ? 10 : 0),
      fees: deal.fee + deal.service + deal.small + (stage.rain ? 150 : 0) + (stageIdx === 2 ? 199 : 0) + (stageIdx === 3 ? 299 : 0),
      assignedAt: clock, readyAt: clock + (batched ? 1.0 : deal.prep * (rest.dark ? 0.75 : 1)),
      soggy: false, frontTried: false, deal: deal
    };
    // the note, and what the doorstep will cycle through
    var tmpl = NOTES[type][deal.note % NOTES[type].length];
    if (type === "bell" || type === "knock") {
      o.options = deal.opt < 0.5 ? ["Bell", "Knock"] : ["Knock", "Bell"];
      o.answer = type === "bell" ? "Bell" : "Knock";
    } else if (type === "back") {
      o.options = deal.opt < 0.5 ? ["Bell", "Knock"] : ["Knock", "Bell"];
      o.answer = deal.bk;
      tmpl = tmpl.replace("{flat}", String(house.flatNo + 1) + (house.block === "court" ? "B" : "A")).replace("{bk}", BACK_BK[deal.bk]);
    } else if (type === "code") {
      var c = deal.code.slice();
      if (c[0] === c[1]) c[1] = (c[1] + 3) % 10;
      if (c[2] === c[3]) c[3] = (c[3] + 7) % 10;
      var real = c.join("");
      var swapA = [c[1], c[0], c[2], c[3]].join(""), swapB = [c[0], c[1], c[3], c[2]].join(""), swapC = [c[0], c[2], c[1], c[3]].join("");
      var opts = [real, swapA, swapB, swapC].filter(function (v, i, a) { return a.indexOf(v) === i; }).slice(0, 3);
      o.options = rotate(opts, Math.floor(deal.perm * opts.length));
      o.answer = real;
      tmpl = tmpl.replace("{code}", real);
    } else if (type === "photo") {
      var base = house.no;
      var nums = [String(base), base + "A", base + "B"];
      o.options = nums;
      o.answer = nums[1 + Math.floor(deal.perm * 2)];
      tmpl = tmpl.replace("{no}", o.answer);
    }
    o.note = tmpl;
    // the promise: how long a decent ride would take, times the app's optimism
    var est = travel(riderPlace(), rest.stop) + Math.max(0, o.readyAt - clock) * 0.6 + travel(rest.stop, realStop(Object.assign({}, o, { state: "bag" }))) + 1.5;
    var queued = orders.filter(function (q) { return q.state === "assigned" || q.state === "bag"; }).length;
    o.due = now() + Math.round(est * stage.k + stage.slack + queued * 2);
    o.promised = o.due;
    o.shrinkAt = clock + (o.due - now()) * deal.shrinkAt;
    o.willShrink = deal.shrink;
    orders.push(o);
    return o;
  }
  function rotate(a, n) { return a.slice(n).concat(a.slice(0, n)); }

  function deal(i) {
    var d = deals[i];
    var o = assign(d.d);
    if (!o) return;
    sfx("ping");
    if (d.goal) {
      shell.callout("Goal", { tilt: -4 });
      sfx("crowd");
      toast("Goal. Everyone has ordered chips.");
    } else {
      toast("New order: " + o.brand + ". Accepted for you.");
    }
  }

  // ---------------------------------------------------------------------------
  // Toasts (the app's notifications) and bubbles
  // ---------------------------------------------------------------------------
  function toast(text) {
    toasts.unshift({ text: text, t: 0 });
    if (toasts.length > 3) toasts.length = 3;
  }
  function say(x, y, line, who) {
    mapBubbles = mapBubbles.filter(function (b) { return b.who !== who; });
    mapBubbles.push({ x: x, y: y, text: line, t: 0, who: who || "x" });
  }

  // ---------------------------------------------------------------------------
  // Riding: along the streets, junction to junction
  // ---------------------------------------------------------------------------
  function edgeDir(e, dir) { return e.h ? (dir > 0 ? "R" : "L") : (dir > 0 ? "D" : "U"); }
  function speedNow(plain) {
    var v = SPEED * (owned.ebike ? 1.2 : 1) * (owned.bag ? 0.9 : 1);
    if (plain) return v;
    var e = TW.edges[rider.e];
    if (e.precinct) v *= owned.bell ? 0.7 : 0.45;
    if (e.oneway && rider.dir && (e.oneway > 0) !== (rider.dir > 0)) v *= 0.45;
    if (e.lane) v *= 0.85;
    return v;
  }
  function nextNode() {
    var e = TW.edges[rider.e];
    return rider.dir > 0 ? e.b : e.a;
  }
  function toJunction() {
    var e = TW.edges[rider.e];
    return rider.dir > 0 ? e.len - rider.s : rider.s;
  }

  // Which stops would stop you right now
  function activeStops() {
    var act = {}, room = bagCount() < bagSize();
    orders.forEach(function (o) {
      if (o.state === "assigned" && room) act[o.rest.stop.id] = true;
      if (o.state === "bag") {
        if (o.type === "back") { act[o.house.back.id] = true; if (!o.frontTried) act[o.house.front.id] = true; }
        else act[o.house.front.id] = true;
      }
    });
    if (route && route.stop != null) act[route.stop] = true;
    return act;
  }

  function queue(d, fromRoute) {
    if (!d) return;
    if (!fromRoute) route = null;
    if (rider.busy) {
      // a press away from a pickup that's still being made: leave it
      if (rider.busy.kind === "rest") leaveStop();
      else return;
    }
    var e = TW.edges[rider.e];
    if (rider.dir && d === opp(edgeDir(e, rider.dir))) {
      rider.dir = -rider.dir;
      rider.facing = d;
      rider.q = null;
      return;
    }
    rider.q = d;
    rider.qLate = rider.dir !== 0 && toJunction() < SKID && !fromRoute;
    if (rider.dir === 0) startFromRest();
  }
  function startFromRest() {
    var e = TW.edges[rider.e], d = rider.q;
    if (!d) return;
    var atA = rider.s < 0.01, atB = rider.s > e.len - 0.01;
    var node = atA ? e.a : atB ? e.b : -1;
    if (node >= 0 && TW.nodes[node].adj[d] != null) { take(node, d); return; }
    var along = e.h ? (d === "R" ? 1 : d === "L" ? -1 : 0) : (d === "D" ? 1 : d === "U" ? -1 : 0);
    if (along) {
      if ((along > 0 && atB) || (along < 0 && atA)) { rider.q = null; return; }
      rider.dir = along; rider.facing = d; rider.q = null; return;
    }
    // a turn while standing mid-street: ride to the nearer junction that has it
    var ca = TW.nodes[e.a].adj[d] != null, cb = TW.nodes[e.b].adj[d] != null;
    if (atA && ca) { take(e.a, d); return; }
    if (atB && cb) { take(e.b, d); return; }
    var dir = ca && cb ? (rider.s < e.len / 2 ? -1 : 1) : ca ? -1 : cb ? 1 : (rider.s < e.len / 2 ? -1 : 1);
    if (atA && dir < 0) dir = 1;
    if (atB && dir > 0) dir = -1;
    rider.dir = dir;
    rider.facing = edgeDir(e, dir);
    rider.qLate = false;
  }
  function take(node, d) {
    var eid = TW.nodes[node].adj[d];
    var e = TW.edges[eid];
    rider.e = eid;
    rider.s = e.a === node ? 0 : e.len;
    rider.dir = e.a === node ? 1 : -1;
    rider.facing = d;
    if (rider.q === d) rider.q = null;
    rider.qLate = false;
  }

  // At a junction: the queued turn (or the route's), else straight on, else stop
  function junction(node) {
    var e = TW.edges[rider.e];
    var cur = edgeDir(e, rider.dir);
    var want = route ? routeDir(node) : rider.q;
    var adj = TW.nodes[node].adj;
    if (want && want !== cur && adj[want] != null) {
      if (stage.rain && rider.qLate && !route && adj[cur] != null) {
        // late in the wet: you slide straight over
        rider.q = null; rider.qLate = false;
        rider.v *= 0.45;
        rider.skidT = 0.6;
        rare("skid", "Skidded");
        sfx("skid");
        take(node, cur);
        return;
      }
      if (want === opp(cur) && !route) { rider.q = null; }
      take(node, want);
      if (route && want) rider.q = null;
      return;
    }
    if (adj[cur] != null) { take(node, cur); return; }
    // a dead end: stand at the junction and wait for a turn
    rider.e = e.id; rider.s = rider.dir > 0 ? e.len : 0; rider.dir = 0; rider.v = 0;
    if (rider.q && adj[rider.q] != null) take(node, rider.q);
  }

  // A route: to a place (and a stop, if it's one)
  function routeTo(place, stopId) {
    route = { to: place, stop: stopId == null ? null : stopId };
    rider.q = null;
    if (rider.busy) {
      if (rider.busy.kind === "rest" && rider.busy.stop.id !== stopId) leaveStop();
      else if (rider.busy.kind !== "rest") return;
      else return;
    }
    // which way along this street
    var e = TW.edges[rider.e];
    if (route.to.e === rider.e && Math.abs(route.to.s - rider.s) < 0.6) {
      var st0 = stopId != null ? TW.stops[stopId] : null;
      arriveFree();
      if (st0) arrive(st0);
      return;
    }
    var dir = bestDirHere();
    if (dir !== rider.dir) { rider.dir = dir; rider.facing = edgeDir(e, dir); }
    rider.qLate = false;
  }
  function bestDirHere() {
    var e = TW.edges[rider.e], t = route.to;
    var costA = rider.s + TW.costFrom(e.a, t), costB = (e.len - rider.s) + TW.costFrom(e.b, t);
    if (t.e === rider.e) {
      var direct = Math.abs(t.s - rider.s);
      if (direct <= Math.min(costA, costB)) return t.s >= rider.s ? 1 : -1;
    }
    if (rider.s < 0.01) costA = Infinity; else if (rider.s > e.len - 0.01) costB = Infinity;
    if (rider.s < 0.01 && costB === Infinity) return 1;
    return costA <= costB ? -1 : 1;
  }
  function routeDir(node) {
    var t = route.to, adj = TW.nodes[node].adj, best = null, bestC = Infinity;
    Object.keys(adj).forEach(function (d) {
      var e = TW.edges[adj[d]];
      var fwd = e.a === node;
      var other = fwd ? e.b : e.a;
      var c;
      if (e.id === t.e) {
        var s = fwd ? t.s : e.len - t.s;
        c = s * TW.edgeCost(e, fwd) / e.len;
      } else c = TW.edgeCost(e, fwd) + TW.costFrom(other, t);
      if (c < bestC - 0.001) { bestC = c; best = d; }
    });
    return best;
  }
  function arriveFree() {
    rider.dir = 0; rider.v = 0;
    route = null;
  }

  function moveRider(dt) {
    if (rider.stun > 0) { rider.stun -= dt; rider.wobble = Math.sin(rider.stun * 30) * 0.2 * (shell.reduceMotion ? 0 : 1); return; }
    rider.wobble = 0;
    if (rider.busy) return;
    if (rider.resumeT > 0) {
      rider.resumeT -= dt;
      if (rider.resumeT <= 0 && rider.dir === 0 && rider.resumeDir && !route) {
        var e0 = TW.edges[rider.e];
        if (!((rider.resumeDir > 0 && rider.s >= e0.len - 0.01) || (rider.resumeDir < 0 && rider.s <= 0.01))) {
          rider.dir = rider.resumeDir; rider.facing = edgeDir(e0, rider.dir);
        }
      }
    }
    if (rider.dir === 0) {
      rider.v = 0;
      // standing on a stop that has just become yours (an order for the
      // restaurant you're outside): it starts
      var act0 = activeStops(), here0 = null;
      TW.stops.forEach(function (st) { if (st.e === rider.e && Math.abs(st.s - rider.s) < 0.3 && act0[st.id] && st.kind !== "door") here0 = st; });
      if (here0 && !rider.q) { arrive(here0); if (rider.busy) return; }
      if (rider.q) startFromRest();
      if (route && rider.dir === 0 && !rider.busy) routeTo(route.to, route.stop);
      return;
    }
    var want = speedNow();
    rider.v += (want - rider.v) * Math.min(1, dt * (rider.skidT > 0 ? 1.5 : 7));
    if (rider.skidT > 0) rider.skidT -= dt;
    var e = TW.edges[rider.e];
    rider.push = !!(e.oneway && (e.oneway > 0) !== (rider.dir > 0)) || e.precinct;
    var dist = rider.v * dt;
    rider.pedal += dist * (rider.push ? 0.6 : 1.1);
    var act = activeStops();
    var guard = 0;
    while (dist > 0.0001 && guard++ < 6 && rider.dir !== 0 && !rider.busy) {
      e = TW.edges[rider.e];
      var room = toJunction();
      var step = Math.min(dist, room);
      var from = rider.s, to = rider.s + rider.dir * step;
      // stops crossed on the way
      var hit = null;
      TW.stops.forEach(function (st) {
        if (st.e !== e.id || !act[st.id]) return;
        if (rider.last === st.id && Math.abs(st.s - rider.lastS) < 0.01 && Math.abs(from - st.s) < 2.5) return;
        var lo = Math.min(from, to), hi = Math.max(from, to);
        if (st.s >= lo - 0.001 && st.s <= hi + 0.001) {
          if (!hit || Math.abs(st.s - from) < Math.abs(hit.s - from)) hit = st;
        }
      });
      // the route's end, if it isn't a stop
      var endHere = route && route.stop == null && route.to.e === e.id &&
        route.to.s >= Math.min(from, to) - 0.001 && route.to.s <= Math.max(from, to) + 0.001;
      // a car door open across the road
      var door = null;
      e.cars.forEach(function (cr) {
        if (cr.state !== "open") return;
        var lo = Math.min(from, to) - 1.2, hi = Math.max(from, to) + 1.2;
        if (cr.s >= lo && cr.s <= hi && (rider.dir > 0 ? cr.s >= from : cr.s <= from)) door = cr;
      });
      if (door) { doored(door); return; }
      // puddles
      e.puddles.forEach(function (ps) {
        if (ps >= Math.min(from, to) && ps <= Math.max(from, to)) splash();
      });
      if (hit) { rider.s = hit.s; arrive(hit); return; }
      if (endHere) { rider.s = route.to.s; arriveFree(); return; }
      rider.s = to;
      dist -= step;
      if (rider.last != null && Math.abs(rider.s - rider.lastS) > 2.5) rider.last = null;
      if (step >= room - 0.0001) {
        rider.last = null;
        junction(nextNode());
      }
    }
  }

  function doored(cr) {
    rider.stun = 0.9;
    rider.v = 0;
    rider.s = clamp(rider.s - rider.dir * 0.5, 0, TW.edges[rider.e].len);
    rare("door", "Doored");
    sfx("thunk");
    if (!shell.reduceMotion) shake(0.25);
    var p = TW.point(TW.edges[rider.e], cr.s);
    say(p.x, p.y, "Sorry, didn't see you.", "car");
  }
  function splash() {
    if (rider.splashT > 0) return;
    rider.splashT = 0.8;
    var p = TW.point(TW.edges[rider.e], rider.s);
    fx.push({ kind: "splash", x: p.x, y: p.y, t: 0 });
    sfx("splash");
    if (owned.mudguards) { rare("guard", "Mudguards: approved"); return; }
    var any = false;
    orders.forEach(function (o) { if (o.state === "bag" && !o.soggy) { o.soggy = true; any = true; } });
    if (any) rare("soggy", "Soggy");
  }

  // Callouts that aren't news every time: once in a while
  var rareAt = {};
  function rare(key, text, gap) {
    if (rareAt[key] != null && clock - rareAt[key] < (gap || 6) && rareAt.stage === stageIdx) return;
    rareAt[key] = clock; rareAt.stage = stageIdx;
    shell.callout(text, { tilt: (Math.random() - 0.5) * 8 });
  }

  // ---------------------------------------------------------------------------
  // Stops: pickups and doors
  // ---------------------------------------------------------------------------
  function arrive(st) {
    rider.resumeDir = rider.dir;
    rider.dir = 0; rider.v = 0;
    rider.last = st.id; rider.lastS = st.s;
    var wasRoute = route && route.stop === st.id;
    if (wasRoute) route = null;
    rider.routed = wasRoute;
    if (st.kind === "rest") {
      var here = orders.filter(function (o) { return o.state === "assigned" && o.rest.stop.id === st.id; });
      if (!here.length) { if (wasRoute) toast("Nothing to collect here. Yet."); return; }
      if (bagCount() >= bagSize()) { rare("full", "Bag: full"); toast("Your bag is full. More orders are on the way."); return; }
      rider.busy = { kind: "rest", stop: st, t: 0 };
      rider.facing = st.side === "N" ? "U" : "D";
      return;
    }
    var mine = orders.filter(function (o) { return o.state === "bag" && (st.kind === "back" ? o.type === "back" && o.house.back.id === st.id : o.house.front.id === st.id); });
    if (!mine.length) return;
    var o = mine[0];
    rider.facing = st.side === "N" ? "U" : st.side === "S" ? "D" : st.side === "W" ? "L" : "R";
    if (st.kind === "door" && o.type === "back") {
      // the app's pin is at the front. The note isn't.
      o.frontTried = true;
      rider.busy = { kind: "trap", stop: st, t: 0 };
      say(st.x, st.y - 3, pick(LINES.trap), "door");
      sfx("nope");
      toast("The app's pin is at the front. The note says round the back.");
      return;
    }
    startDoor(o, st);
  }
  function leaveStop() {
    rider.busy = null;
  }
  function finishStop() {
    var routed = rider.routed;
    rider.busy = null;
    if (!routed && !route) rider.resumeT = 0.25;
    else rider.resumeDir = 0;
  }

  function collect(o) {
    o.state = "bag";
    o.pickedAt = clock;
    sfx("zip");
    if (!taught.pick) taught.pick = true;
    // the app batches more on, whether you like it or not
    var r = o.deal.batch;
    var pending = deals.length - dealAt;
    if (r < stage.batch && !o.batched && pending > 0 && clock < stage.len - 9 && bagCount() < bagSize()) {
      var d = deals.splice(dealAt + Math.floor(o.deal.first * Math.min(3, pending)), 1)[0];
      var b = assign(d.d, true, o.rest);
      if (b) {
        rare("batch", "Batched", 4);
        toast("Batched: " + b.brand + ". You're here anyway.");
        sfx("ping");
      }
    }
  }

  function updateStop(dt) {
    var b = rider.busy;
    if (!b) return;
    b.t += dt;
    if (b.kind === "trap") { if (b.t > 0.9) finishStop(); return; }
    if (b.kind === "rest") {
      var waiting = 0;
      orders.forEach(function (o) {
        if (o.state !== "assigned" || o.rest.stop.id !== b.stop.id) return;
        if (o.readyAt <= clock && bagCount() < bagSize()) collect(o);
        else waiting++;
      });
      if (!waiting) finishStop();
      else if (bagCount() >= bagSize()) finishStop();
      return;
    }
    if (b.kind === "door") updateDoor(dt);
  }

  // ---------------------------------------------------------------------------
  // The doorstep: the choices cycle; press when it shows what the note says
  // ---------------------------------------------------------------------------
  var STEP = [0.72, 0.64, 0.58, 0.54];
  function startDoor(o, st) {
    var opts = o.options;
    doorstep = { o: o, st: st, opts: opts, at: Math.floor(o.deal.perm * 7) % opts.length, stepT: 0, step: STEP[stageIdx],
                 t: 0, done: false, doneT: 0, wrongs: 0, flash: 0, line: null, shout: false, awake: false, slide: 0 };
    rider.busy = { kind: "door", stop: st, t: 0 };
    sfx("brake");
  }
  function showing() {
    var d = doorstep;
    if (d.o.type === "photo") return d.opts[clamp(Math.round(d.slide), 0, d.opts.length - 1)];
    return d.opts[d.at];
  }
  function updateDoor(dt) {
    var d = doorstep;
    if (!d) { finishStop(); return; }
    d.t += dt;
    if (d.flash > 0) d.flash -= dt;
    if (d.done) return;
    d.stepT += dt;
    if (d.o.type === "photo") {
      // the viewfinder slides from door to door and rests on each
      var n = d.opts.length, seq = [], i;
      for (i = 0; i < n; i++) seq.push(i);
      for (i = n - 2; i > 0; i--) seq.push(i);
      var k = d.stepT / d.step, idx = Math.floor(k) % seq.length, f = k - Math.floor(k);
      var a = seq[idx], b = seq[(idx + 1) % seq.length];
      var was = Math.round(d.slide);
      d.slide = a + (b - a) * (f < 0.62 ? 0 : (f - 0.62) / 0.38);
      if (Math.round(d.slide) !== was) sfx("tick");
    } else if (d.stepT >= d.step) {
      d.stepT -= d.step;
      d.at = (d.at + 1) % d.opts.length;
      sfx("tick");
    }
  }
  function press() {
    var d = doorstep;
    if (!d || d.done || d.t < 0.3) return;
    var o = d.o, shown = showing();
    if (shown === o.answer) {
      if (o.type === "bell" || (o.type === "back" && shown === "Bell")) sfx("bell");
      else if (o.type === "knock" || o.type === "back") sfx("knock");
      else if (o.type === "code") sfx("buzz");
      else sfx("shutter");
      deliver(o, d.wrongs ? "fixed" : "ok");
      return;
    }
    d.wrongs++;
    d.flash = 0.5;
    if (o.type === "knock" || (o.type === "back" && o.answer === "Knock")) {
      if (shown === "Bell") {
        sfx("bell");
        sfx("baby");
        d.awake = true;
        babies++;
        rate(-0.08);
        deliver(o, "baby");
        return;
      }
    }
    if (o.type === "bell" || o.type === "back") { sfx("knock"); rare("noanswer", "No answer", 2); return; }
    if (o.type === "code") { sfx("buzzWrong"); d.line = pick(LINES.gate); rare("gate", "Gate: shut", 2); return; }
    if (o.type === "photo") { sfx("shutter"); rate(-0.04); rare("photo", "Wrong door", 2); toast("Customer says it isn't there. You photographed next door."); }
  }

  // ---------------------------------------------------------------------------
  // Delivered: pay, fees, the rating, what the customer says
  // ---------------------------------------------------------------------------
  function rate(dv) {
    rating = clamp(rating + dv, 0, 5);
    if (rating < FLOOR) deactivate();
  }
  function deliver(o, how) {
    var d = doorstep;
    d.done = true;
    d.doneT = 0;
    // you're free to go; the doorstep stays on the phone a moment
    finishStop();
    o.state = "done";
    var late = Math.max(0, Math.ceil(now() - o.due));
    var lines = late > 0 ? LINES.late : stageIdx === 3 && o.deal.tip < 0.4 ? LINES.final : LINES.onTime;
    var line = pick(lines);
    if (how === "baby") line = pick(LINES.baby);
    else if (o.soggy) line = pick(LINES.soggy);
    d.line = line;
    d.shout = late > 0 || how === "baby" || o.soggy;
    delivered++; stageStats.delivered++;
    earned += o.pay; fees += o.fees;
    stageStats.earned += o.pay; stageStats.fees += o.fees;
    if (late > 0) {
      lateCount++; stageStats.late++;
      rate(-(0.03 + Math.min(0.08, late * 0.01)));
    } else {
      onTime++; stageStats.onTime++;
      rate(0.025 + (o.due - now() >= 3 ? 0.01 : 0));
    }
    if (o.soggy) rate(-0.04);
    if (!taught.door) taught.door = true;
    if (how !== "baby") taught.note = true;
    // the stamp
    var word = how === "baby" ? "Baby: awake" : o.type === "photo" ? "Left at door" : o.soggy ? "Soggy" : late > 0 ? "Late" : o.type === "code" ? "Gate: open" : "Delivered";
    shell.callout(word, { tilt: (Math.random() - 0.5) * 9, sound: false });
    sfx(late > 0 || how === "baby" ? "low" : "coin");
    // the app has something to say about it
    var tip = o.deal.tip;
    if (tip < 0.22) toast(o.name + " tipped 0p. Say thanks.");
    else if (tip < 0.32) { toast(o.name + " tipped £1. Your pay has been adjusted by -£1. Tip included."); }
    else if (late > 0) toast("You were " + late + " minute" + (late > 1 ? "s" : "") + " late. The customer has been told it was you.");
    else if (tip < 0.5) toast("Delivered. The customer paid " + money(o.fees) + " in fees. You earned " + money(o.pay) + ".");
    else if (tip < 0.62) toast("Great job. Your pay is unchanged.");
    paintHud();
  }

  function deactivate() {
    if (ended) return;
    ended = true;
    toast("Your account is under review. This decision was made automatically.");
    shell.callout("Account: under review", { tilt: -5 });
    sfx("low");
    endRound(false);
  }

  // ---------------------------------------------------------------------------
  // Each frame
  // ---------------------------------------------------------------------------
  function update(dt, input) {
    if (shell.state() !== "playing" || ended) { animate(dt); return; }
    clock += dt;
    // orders arriving
    while (dealAt < deals.length && deals[dealAt].t <= clock) { deal(dealAt); dealAt++; }
    // input
    var auto = N.flags.autopilot ? autopilot(dt) : null;
    if (DEBUG && window.__leaveBot) { window.__leaveBot(dt); auto = {}; }
    if (!auto) readInput(input);
    // the app shrinks promises, cancels the very late, and tells customers you're outside
    orders.forEach(function (o) {
      if (o.state !== "assigned" && o.state !== "bag") return;
      if (o.willShrink && clock >= o.shrinkAt) {
        o.willShrink = false;
        o.due -= o.deal.shrinkBy;
        o.shrunk = 1.2;
        toast("Promise updated: " + o.deal.shrinkBy + " minute" + (o.deal.shrinkBy > 1 ? "s" : "") + " sooner. The customer has been told.");
        rare("shrink", "Promise: shrunk", 9);
        sfx("ping2");
      }
      if (o.shrunk > 0) o.shrunk -= dt;
      if (!o.wentLate && now() > o.due) { o.wentLate = true; sfx("late"); }
      if (now() - o.due > 9 && !(doorstep && doorstep.o === o)) {
        var wasBag = o.state === "bag";
        o.state = "cancelled";
        cancelled++; stageStats.cancelled++;
        toast(wasBag ? "Cancelled. The food is yours now. It's cold." : "Order cancelled. The customer has had cereal.");
        rare("cancel", "Cancelled", 3);
        rate(-0.1);
        if (route && route.stop === stopOf(o).id) route = null;
      }
      if (o.state === "bag" && !toldOutside && clock - o.pickedAt > 1.2 && clock - o.pickedAt < 2) {
        toldOutside = true;
        toast("We've told " + o.name + " you're outside.");
      }
    });
    if (ended) return;
    updateStop(dt);
    moveRider(dt);
    if (rider.splashT > 0) rider.splashT -= dt;
    // car doors
    TW.edges.forEach(function (e) {
      e.cars.forEach(function (cr) {
        cr.t += dt;
        if (cr.state === "parked" && cr.t > cr.wait) { cr.state = "warn"; cr.t = 0; sfx("click"); }
        else if (cr.state === "warn" && cr.t > 1.0) { cr.state = "open"; cr.t = 0; }
        else if (cr.state === "open" && cr.t > 1.7) { cr.state = "parked"; cr.t = 0; cr.wait = 3 + carRng() * 5; }
      });
    });
    animate(dt);
    orders = orders.filter(function (o) { return o.state === "assigned" || o.state === "bag" || (doorstep && doorstep.o === o); });
    if (clock >= stage.len) endStage();
    paintHud();
  }
  function animate(dt) {
    toasts.forEach(function (t) { t.t += dt; });
    mapBubbles.forEach(function (b) { b.t += dt; });
    mapBubbles = mapBubbles.filter(function (b) { return b.t < 2.4; });
    fx.forEach(function (f) { f.t += dt; });
    fx = fx.filter(function (f) { return f.t < 0.9; });
    if (shakeT > 0) shakeT -= dt;
    if (doorstep && doorstep.done) {
      doorstep.doneT += dt;
      if (doorstep.doneT > 1.6) doorstep = null;
    }
  }

  var shakeT = 0;
  function shake(t) { shakeT = t; }

  function readInput(input) {
    ["up", "down", "left", "right"].forEach(function (k) {
      var d = { up: "U", down: "D", left: "L", right: "R" }[k];
      if (input[k] && !prev[k]) queue(d);
      prev[k] = input[k];
    });
    if (input.action && !prev.action) press();
    prev.action = input.action;
  }

  // ---------------------------------------------------------------------------
  // The end of a stage, and of the shift
  // ---------------------------------------------------------------------------
  function endStage() {
    if (ended) return;
    var left = orders.filter(function (o) { return o.state === "bag"; }).length;
    if (left) { rate(-0.03 * left); toast(left + " order" + (left > 1 ? "s" : "") + " reassigned. The app noted it."); }
    if (ended) return;
    if (stageIdx >= STAGES.length - 1) { endRound(true); return; }
    var share = stageStats.delivered ? stageStats.onTime / stageStats.delivered : 0;
    var stamp = !stageStats.delivered ? "Rejected" : share >= 0.85 && rating >= stageStats.rating0 ? "Approved" : share >= 0.6 ? "Pending review" : "Not approved";
    var lines = [
      "Customers paid " + money(stageStats.fees) + " in fees. You made " + money(stageStats.earned) + ". The app calls this a partnership.",
      "The app made " + money(stageStats.fees) + ". You made " + money(stageStats.earned) + ". It thanks you for your flexibility.",
      "Customers paid " + money(stageStats.fees) + " in fees. You made " + money(stageStats.earned) + ". Some of that was weather."
    ];
    var offer = offers();
    var nextName = STAGES[stageIdx + 1].name.toLowerCase();
    shell.interlude({
      stamp: stamp,
      heading: stage.name + ": " + stageStats.delivered + " delivered.",
      line: lines[stageIdx % lines.length],
      stats: [
        { label: "On time", value: stageStats.onTime + " of " + stageStats.delivered },
        { label: "Earned", value: money(stageStats.earned) },
        { label: "Rating", value: rating.toFixed(2) }
      ],
      ask: "Before " + (stageIdx === 2 ? "the " : "") + nextName + ", the app suggests:",
      choices: offer.map(function (c) { return { label: c.label, detail: c.detail }; })
    }).then(function (i) {
      var c = offer[i];
      owned[c.key] = true;
      if (c.cost && !c.every) { earned -= c.cost; }
      stageIdx++;
      startStage();
      if (c.every) charge(c.cost, c.label);
      shell.next();
    });
  }
  function offers() {
    var r = N.seeded(stage.seed ^ 0x2545f491);
    var pool = CHOICES.filter(function (c) {
      if (owned[c.key]) return false;
      if (c.from != null && stageIdx < c.from) return false;
      if (c.key === "bell" && stageIdx !== 2) return false;
      return true;
    });
    var out = [];
    // mudguards before the rain, the bell before the final
    var must = stageIdx === 0 ? "mudguards" : stageIdx === 2 ? "bell" : null;
    pool.forEach(function (c) { if (c.key === must) out.push(c); });
    pool = pool.filter(function (c) { return c.key !== must; });
    while (out.length < 3 && pool.length) out.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
    return out;
  }

  function endRound(complete) {
    ended = true;
    var rung, line;
    var r2 = rating.toFixed(2);
    if (complete) {
      if (rating >= APPROVE.rating && delivered >= APPROVE.delivered) { rung = 1; line = RESULT_LINES.approved.replace("{r}", r2); }
      else {
        rung = 2;
        line = RESULT_LINES.pending;
        if (rating >= APPROVE.rating) line += " Approved needed " + (APPROVE.delivered - delivered) + " more.";
        else line += " Approved needed a " + APPROVE.rating.toFixed(2) + " rating.";
      }
    } else if (stageIdx >= 2) { rung = 3; line = RESULT_LINES.notApproved[stageIdx - 2]; }
    else { rung = 4; line = RESULT_LINES.rejected[stageIdx]; }
    var stamp = ["Approved", "Pending review", "Not approved", "Rejected"][rung - 1];
    var rec = shell.record(earned);
    var stats = [
      { label: "Delivered", value: String(delivered) + (lateCount ? " (" + lateCount + " late)" : "") },
      { label: "You earned", value: money(earned) },
      { label: "Customers paid in fees", value: money(fees) },
      { label: "Rating", value: r2 },
      { label: rec.isNew ? (shell.daily ? "New best today" : "New best") : (shell.daily ? "Best today" : "Best"), value: money(rec.best || 0), highlight: rec.isNew }
    ];
    if (shell.daily) stats.unshift({ label: "Run", value: shell.today });
    shell.finish({
      place: rung, total: 4, stamp: stamp,
      heading: complete ? "Shift over. " + delivered + " delivered." : "Account deactivated.",
      line: line,
      stats: stats,
      share: delivered + " delivered, " + money(earned) + " earned while customers paid " + money(fees) + " in fees, rated " + r2,
      delay: complete ? 1200 : 1900
    });
  }

  // ---------------------------------------------------------------------------
  // The autopilot: the stop with the least time to spare, a human delay at
  // the door, and the odd wrong press
  // ---------------------------------------------------------------------------
  function autopilot(dt) {
    autoT -= dt;
    if (doorstep && !doorstep.done) {
      var d = doorstep;
      if (d.t < 0.35) { autoDoorT = 0; autoWrong = Math.random() < 0.05; return {}; }
      var target = autoWrong ? d.opts.filter(function (x) { return x !== d.o.answer; })[0] : d.o.answer;
      if (showing() === target) {
        autoDoorT += dt;
        if (autoDoorT > 0.12 + Math.random() * 0.05) { press(); autoDoorT = 0; autoWrong = false; }
      } else autoDoorT = 0;
      return {};
    }
    if (rider.busy) return {};
    if (autoT > 0) return {};
    autoT = 0.3;
    var here = riderPlace(), best = null;
    var room = bagCount() < bagSize();
    orders.forEach(function (o) {
      var st;
      if (o.state === "bag") st = realStop(o);
      else if (o.state === "assigned" && room) st = o.rest.stop;
      else return;
      var tt = travel(here, st);
      var rest = o.state === "assigned" ? Math.max(0, o.readyAt - clock - tt) + travel(o.rest.stop, realStop(Object.assign({}, o, { state: "bag" }))) : 0;
      var spare = o.due - now() - tt - rest;
      var score = tt + Math.max(-4, Math.min(spare, 12)) * 0.6 + (o.state === "bag" ? -1.5 : 0);
      if (!best || score < best.score) best = { score: score, st: st };
    });
    if (best) {
      if (!route || route.stop !== best.st.id) routeTo({ e: best.st.e, s: best.st.s }, best.st.id);
    } else if (!route && rider.dir === 0) {
      // nothing to do: drift back towards the middle of town
      var mid = TW.nearest(50, 40);
      if (Math.abs(mid.s - rider.s) > 1 || mid.e !== rider.e) routeTo({ e: mid.e, s: mid.s }, null);
    }
    return {};
  }

  // ---------------------------------------------------------------------------
  // Pointer: a tap or a click rides there; a swipe steers; a tap on the
  // doorstep is the button; a tap on an order rides to its next stop
  // ---------------------------------------------------------------------------
  var hits = [];   // tappable things drawn this frame: { x, y, w, h, fn }
  function onDown(e) {
    if (!(shell.state() === "playing" || shell.state() === "countdown")) return;
    var t = e.target;
    if (t && t.closest && t.closest(".kit-panel, .kit-bar, button, a")) return;
    var b = root.getBoundingClientRect();
    pointerDown = { x: e.clientX - b.left, y: e.clientY - b.top, id: e.pointerId, t: performance.now(), moved: false, type: e.pointerType };
  }
  function onMove(e) {
    if (!pointerDown || e.pointerId !== pointerDown.id) return;
    var b = root.getBoundingClientRect();
    var x = e.clientX - b.left, y = e.clientY - b.top;
    var dx = x - pointerDown.x, dy = y - pointerDown.y;
    if (!pointerDown.moved && Math.hypot(dx, dy) > 26 && inMap(pointerDown.x, pointerDown.y)) {
      pointerDown.moved = true;
      if (shell.state() === "playing" && !N.flags.autopilot) queue(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "R" : "L") : (dy > 0 ? "D" : "U"));
    }
  }
  function onUp(e) {
    if (!pointerDown || e.pointerId !== pointerDown.id) return;
    var p = pointerDown;
    pointerDown = null;
    if (p.moved || shell.state() !== "playing" || N.flags.autopilot) return;
    tap(p.x, p.y);
  }
  function inMap(x, y) { return L && x >= L.mapX && x <= L.mapX + 100 * L.S && y >= L.mapY && y <= L.mapY + 80 * L.S; }
  function tap(x, y) {
    for (var i = hits.length - 1; i >= 0; i--) {
      var h = hits[i];
      if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) { h.fn(); return; }
    }
    if (!inMap(x, y) || (doorstep && !doorstep.done)) return;
    var wx = (x - L.mapX) / L.S, wy = (y - L.mapY) / L.S;
    var nr = TW.nearest(wx, wy);
    if (nr.d > 9) return;
    // a stop near the tap: ride to it
    var stopHit = null;
    var act = activeStops();
    TW.stops.forEach(function (st) {
      if (!act[st.id] && !(route && route.stop === st.id)) return;
      if (st.kind === "door" && !orders.some(function (o) { return o.state === "bag" && (o.house.front.id === st.id); })) return;
      var d = Math.hypot(st.x - wx, st.y - wy);
      if (d < 5 && (!stopHit || d < stopHit.d)) stopHit = { st: st, d: d };
    });
    if (stopHit) routeTo({ e: stopHit.st.e, s: stopHit.st.s }, stopHit.st.id);
    else routeTo({ e: nr.e, s: nr.s }, null);
    fx.push({ kind: "tap", x: wx, y: wy, t: 0 });
  }
  function routeToOrder(o) {
    var st = stopOf(o);
    routeTo({ e: st.e, s: st.s }, st.id);
  }

  // ---------------------------------------------------------------------------
  // HUD: the stage and the clock top left, the rating top right
  // ---------------------------------------------------------------------------
  function buildHud() {
    shell.hud.innerHTML =
      '<div class="kit-hud-tl"><p class="kit-stat"><small data-stage>Lunch</small><span data-clock>12:00</span></p></div>' +
      '<div class="kit-hud-tr"><p class="kit-stat"><small>Rating</small><span data-rating>4.90</span></p></div>';
    hudEls = {
      stage: shell.hud.querySelector("[data-stage]"),
      clock: shell.hud.querySelector("[data-clock]"),
      rating: shell.hud.querySelector("[data-rating]")
    };
  }
  function paintHud() {
    if (!hudEls || !stage) return;
    hudEls.stage.textContent = stage.name;
    hudEls.clock.textContent = hhmm(now());
    hudEls.rating.textContent = rating.toFixed(2);
    hudEls.rating.style.color = rating < 4.65 ? T.red : "";
  }

  // ---------------------------------------------------------------------------
  // Layout: the town and the phone, for each shape of screen
  // ---------------------------------------------------------------------------
  function layout() {
    var top = W < 440 ? 46 : 52, pad = 8;
    var full = Math.min((W - pad * 2) / 100, (H - top - pad) / 80);
    var colW = clamp(W * 0.3, 190, 290);
    var sCol = Math.min((W - colW - pad * 3) / 100, (H - top - pad) / 80);
    var sBot = Math.min((W - pad * 2) / 100, (H - top - 170 - pad * 2) / 80);
    var o = { top: top };
    if (sCol >= sBot && sCol >= full * 0.7 && W > 520) {
      o.mode = "col"; o.S = sCol;
      o.mapX = pad; o.mapY = top + Math.max(0, (H - top - pad - 80 * sCol) / 2);
      o.panel = { x: pad * 2 + 100 * sCol, y: top, w: W - 100 * sCol - pad * 3, h: H - top - pad };
    } else if (sBot >= full * 0.82) {
      o.mode = "bot"; o.S = sBot;
      o.mapX = (W - 100 * sBot) / 2; o.mapY = top;
      o.panel = { x: pad, y: top + 80 * sBot + pad, w: W - pad * 2, h: H - top - 80 * sBot - pad * 2 };
    } else {
      var strip = 66;
      o.mode = "strip"; o.S = Math.min((W - pad * 2) / 100, (H - top - strip - pad * 2) / 80);
      o.mapX = (W - 100 * o.S) / 2; o.mapY = top;
      o.panel = { x: pad, y: top + 80 * o.S + pad, w: W - pad * 2, h: H - top - 80 * o.S - pad * 2 };
    }
    return o;
  }

  function resize(w, h, dpr) {
    W = w; H = h; DPR = dpr;
    ctx = (shell ? shell.canvas : root.querySelector("canvas")).getContext("2d");
    L = layout();
    townKey = "";
    if (shell) {
      if (L.mode === "col") shell.placeCallouts({ top: L.panel.y + 70, left: L.panel.x, right: W - L.panel.x - L.panel.w });
      else if (L.mode === "bot") shell.placeCallouts({ top: L.panel.y + 112, left: 0, right: 0 });
      else shell.placeCallouts({ top: L.mapY + 2, left: 0, right: 0 });
    }
  }

  function bake() {
    var key = [W, H, DPR, stageIdx, L.S].join("|");
    if (key === townKey && townCanvas) return;
    townKey = key;
    townCanvas = townCanvas || document.createElement("canvas");
    townCanvas.width = Math.ceil(100 * L.S * DPR);
    townCanvas.height = Math.ceil(80 * L.S * DPR);
    var c = townCanvas.getContext("2d");
    c.setTransform(DPR * L.S, 0, 0, DPR * L.S, 0, 0);
    A.bakeTown(c, { bunting: !!stage.precinct });
  }

  // ---------------------------------------------------------------------------
  // Drawing
  // ---------------------------------------------------------------------------
  var tNow = 0;
  function render(dt) {
    if (!ctx || !stage || !L) return;
    tNow += dt || 0;
    if (!briefed && shell.state() === "countdown") {
      briefed = true;
      shell.brief({ title: stage.name + ", " + hhmm(stage.start), text: N.flags.clip ? "" : stage.brief, ms: N.flags.clip ? 1800 : 7000 });
    }
    hits = [];
    bake();
    var c = ctx;
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    c.fillStyle = T.ink;
    c.fillRect(0, 0, W, H);
    var sx = 0, sy = 0;
    if (shakeT > 0 && !shell.reduceMotion) { sx = (Math.random() - 0.5) * 6 * shakeT; sy = (Math.random() - 0.5) * 6 * shakeT; }
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.drawImage(townCanvas, Math.round((L.mapX + sx) * DPR), Math.round((L.mapY + sy) * DPR));
    c.setTransform(DPR * L.S, 0, 0, DPR * L.S, DPR * (L.mapX + sx), DPR * (L.mapY + sy));
    drawWorld(c);
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    drawPanel(c);
    if (doorstep && L.mode === "strip") drawDoorCard(c, overlayBox(), true);
  }

  function overlayBox() {
    var w = Math.min(330, W - 20), h = Math.min(190, 80 * L.S - 10);
    return { x: (W - w) / 2, y: L.mapY + 80 * L.S - h - 4, w: w, h: h };
  }

  function minSize() { return 12.5 / L.S; }

  function drawWorld(c) {
    var t = tNow;
    // the phone mount's line to the next stop
    if (owned.mount) drawRouteLine(c);
    // parked cars
    TW.edges.forEach(function (e) {
      e.cars.forEach(function (cr) {
        var p = TW.point(e, cr.s);
        A.car(c, p.x, p.y, e.h, cr.side, cr.state, t, cr.col);
      });
    });
    // fans in the precinct
    if (stage.precinct) drawCrowd(c, t);
    // effects under the rider
    fx.forEach(function (f) {
      if (f.kind === "splash") {
        var k = f.t / 0.9;
        for (var i = 0; i < 7; i++) {
          var a = i / 7 * Math.PI * 2;
          A.solid(c, A.ell(f.x + Math.cos(a) * (1 + k * 3), f.y + Math.sin(a) * (1 + k * 2) - k * 1.5, 0.45 * (1 - k) + 0.05, 0.45 * (1 - k) + 0.05), T.paper, 0);
        }
      } else if (f.kind === "tap") {
        A.ink(c, 0.3, T.accent);
        c.beginPath(); c.arc(f.x, f.y, 1 + f.t * 4, 0, Math.PI * 2); c.globalAlpha = 1 - f.t / 0.9; c.stroke(); c.globalAlpha = 1;
      }
    });
    drawPins(c);
    // the rider
    var p = TW.point(TW.edges[rider.e], rider.s);
    var lateNow = orders.some(function (o) { return o.state === "bag" && now() > o.due; });
    A.rider(c, p.x, p.y, rider.facing, { k: 1.22, pedal: rider.pedal, still: rider.dir === 0, push: rider.push, late: lateNow, wobble: rider.wobble, t: t });
    if (rider.busy && rider.busy.kind === "rest") {
      var o = orders.filter(function (q) { return q.state === "assigned" && q.rest.stop.id === rider.busy.stop.id; })[0];
      if (o) {
        // being prepared
        var share = clamp((clock - o.assignedAt) / Math.max(0.1, o.readyAt - o.assignedAt), 0, 1);
        var bw = 9, bx = p.x - bw / 2, by = p.y + 1.5;
        A.solid(c, A.rr(bx, by, bw, 1.4, 0.4), T.ink, 0.25, T.paper);
        c.fillStyle = T.accent;
        c.fillRect(bx + 0.3, by + 0.3, (bw - 0.6) * share, 0.8);
        A.text(c, "Being prepared", p.x, by + 3.1, Math.max(2.2, minSize()), { colour: T.paper, stroke: 0.5, min: 12, dpr: DPR });
      }
    }
    // bubbles on the map
    mapBubbles.forEach(function (b) {
      var size = Math.max(2.2, minSize());
      var lines = A.wrap(c, b.text, size, 30);
      var bx = clamp(b.x, 16, 84), by = clamp(b.y - 9, 6, 70);
      A.bubble(c, bx, by, lines, size, b.x, b.y - 2);
    });
    if (stage.rain) drawRain(c, t);
    // the pointer, for the one thing to do first
    drawPointer(c, t);
  }

  function drawRouteLine(c) {
    var target = null;
    if (route) target = route.to;
    else {
      var o = focusOrder();
      if (o) { var st = stopOf(o); target = { e: st.e, s: st.s }; }
    }
    if (!target) return;
    var pts = [], e = TW.edges[rider.e];
    var p0 = TW.point(e, rider.s);
    pts.push([p0.x, p0.y]);
    var r = TW.route({ e: rider.e, s: rider.s }, target);
    r.path.forEach(function (n) { pts.push([TW.nodes[n].x, TW.nodes[n].y]); });
    var pe = TW.point(TW.edges[target.e], target.s);
    pts.push([pe.x, pe.y]);
    c.save();
    c.setLineDash([1.0, 0.9]);
    A.line(c, pts, 0.55, T.accent);
    c.restore();
  }

  function drawCrowd(c, t) {
    var y = TW.YS[2];
    for (var i = 0; i < 14; i++) {
      var x = 30 + ((i * 7.3 + t * (i % 2 ? 1.2 : -1.0)) % 40 + 40) % 40;
      if (x > 47 && x < 53) continue;
      var yy = y + (i % 2 ? 1.4 : -1.4) + Math.sin(t * 5 + i) * 0.15;
      var bob = shell.reduceMotion ? 0 : Math.abs(Math.sin(t * 6 + i)) * 0.3;
      A.solid(c, A.ell(x, yy - bob, 0.75, 0.75), T.paper, 0.18);
      A.solid(c, A.rr(x - 0.75, yy - bob + 0.35, 1.5, 0.4, 0.15), i % 3 ? T.accent : T.red, 0.1);
    }
  }

  function drawRain(c, t) {
    if (shell.reduceMotion) {
      c.fillStyle = A.dots(c, T.paper, 2.2, 0.08);
      c.fillRect(0, 0, 100, 80);
      return;
    }
    A.ink(c, 0.16, T.paper);
    c.beginPath();
    for (var i = 0; i < 70; i++) {
      var x = (i * 37.7 + t * 9) % 104 - 2, y = (i * 23.3 + t * 55) % 84 - 2;
      c.moveTo(x, y); c.lineTo(x - 0.5, y + 1.8);
    }
    c.stroke();
  }

  function minutesLeft(o) { return Math.ceil(o.due - now()); }
  function focusOrder() {
    if (doorstep) return doorstep.o;
    if (route && route.stop != null) {
      var f = orders.filter(function (o) { return (o.state === "assigned" || o.state === "bag") && stopOf(o).id === route.stop; })[0];
      if (f) return f;
    }
    var best = null;
    orders.forEach(function (o) {
      if (o.state !== "bag") return;
      if (!best || o.due < best.due) best = o;
    });
    if (best) return best;
    orders.forEach(function (o) { if (o.state === "assigned" && (!best || o.due < best.due)) best = o; });
    return best;
  }

  function drawPins(c) {
    var size = Math.max(2.3, minSize());
    var byStop = {};
    orders.forEach(function (o) {
      if (o.state !== "assigned" && o.state !== "bag") return;
      var st = o.state === "assigned" ? o.rest.stop : o.house.front;
      if (o.state === "bag" && o.type === "back" && o.frontTried) st = o.house.back;
      (byStop[st.id] = byStop[st.id] || { st: st, list: [] }).list.push(o);
    });
    var keys = Object.keys(byStop).sort(function (a, b) { return byStop[a].st.y - byStop[b].st.y; });
    keys.forEach(function (k) {
      var g = byStop[k], st = g.st;
      var o = g.list.reduce(function (a, b) { return a.due <= b.due ? a : b; });
      var mins = minutesLeft(o);
      var late = mins <= 0;
      var pick = o.state === "assigned";
      var label = late ? "Late" : mins + " min";
      if (g.list.length > 1) label += " x" + g.list.length;
      var kind = late ? "late" : pick ? "pick" : "door";
      var ring = route && route.stop === st.id;
      var prog = null;
      if (pick) prog = clamp((clock - o.assignedAt) / Math.max(0.1, o.readyAt - o.assignedAt), 0, 1);
      var px = st.x, py = st.y + (st.side === "S" ? -TW.RW : st.side === "N" ? TW.RW * 0.2 : 0);
      var bx = A.pin(c, px, py, label, kind, size, { icon: pick ? "bag" : null, ring: ring, progress: prog });
      if (o.shrunk > 0 && Math.floor(o.shrunk * 6) % 2 === 0) {
        A.ink(c, 0.4, T.red);
        c.strokeRect(bx.x - 0.5, bx.y - 0.5, bx.w + 1, bx.h - size * 0.75 + 1);
      }
      g.box = bx;
      hits.push({ x: L.mapX + bx.x * L.S, y: L.mapY + bx.y * L.S, w: bx.w * L.S, h: bx.h * L.S,
                  fn: function () { routeTo({ e: st.e, s: st.s }, st.id); } });
    });
    pinBoxes = byStop;
  }
  var pinBoxes = {};

  function drawPointer(c, t) {
    if (N.flags.clip || doorstep) return;
    var size = Math.max(2.6, 13 / L.S);
    var target = null, word = "";
    if (!taught.pick) {
      var o = orders.filter(function (q) { return q.state === "assigned"; })[0];
      if (o) { target = pinBoxes[o.rest.stop.id]; word = coarse() ? "Tap it" : "Pick up"; }
    } else if (!taught.door) {
      var b = orders.filter(function (q) { return q.state === "bag"; })[0];
      if (b) { target = pinBoxes[stopOf(b).id]; word = "Deliver"; }
    }
    if (!target || !target.box) return;
    var bx = target.box;
    A.arrow(c, bx.x + bx.w / 2, bx.y - size * 0.1, word, t, size, shell.reduceMotion);
  }
  function coarse() { return shell.input.mode === "touch"; }

  // ---------------------------------------------------------------------------
  // The phone: the app's notifications, the two numbers, the orders, the
  // note (or the doorstep)
  // ---------------------------------------------------------------------------
  function drawPanel(c) {
    var P = L.panel;
    if (L.mode === "strip") { drawStrip(c, P); return; }
    // the phone
    A.solid(c, A.rr(P.x, P.y, P.w, P.h, 14), T.ink, 2, T.paper);
    var x = P.x + 8, y = P.y + 8, w = P.w - 16, h = P.h - 16;
    // header: the app
    A.solid(c, A.rr(x, y, w, 26, 6), T.accent, 0);
    A.logo(c, x + 14, y + 13, 8);
    A.text(c, "A Delivery App", x + 27, y + 14, 13, { align: "left", colour: T.ink });
    A.text(c, "Online", x + w - 8, y + 14, 12, { align: "right", colour: T.ink });
    y += 32;
    // the latest notification
    var tt = toasts[0];
    var nh = 38;
    if (tt) {
      var fresh = tt.t < 0.25 ? tt.t / 0.25 : 1;
      c.globalAlpha = 0.4 + 0.6 * fresh;
      var lines = A.wrap(c, tt.text, 12.5, w - 30, T.body, false);
      nh = Math.max(38, lines.length * 15 + 10);
      if (lines.length > 3) lines = lines.slice(0, 3);
      A.solid(c, A.rr(x, y, w, nh, 6), T.ink, 1.5, T.paper);
      A.solid(c, A.ell(x + 11, y + 12, 4, 4), tt.t < 3 ? T.accent : T.ink, 1.2, T.paper);
      lines.forEach(function (l, i) { A.text(c, l, x + 22, y + 12 + i * 15, 12.5, { align: "left", colour: T.paper, font: T.body, upper: false }); });
      c.globalAlpha = 1;
    }
    y += nh + 8;
    // the two numbers
    var half = (w - 8) / 2;
    [["Customers paid in fees", fees, T.paper], ["You earned", earned, T.accent]].forEach(function (m, i) {
      var mx = x + i * (half + 8);
      A.text(c, m[0], mx, y + 7, 12, { align: "left", colour: T.accent, max: half, upper: false, font: T.body });
      A.text(c, money(m[1]), mx, y + 27, 22, { align: "left", colour: m[2] });
    });
    y += 46;
    // orders
    var list = orders.filter(function (o) { return o.state === "assigned" || o.state === "bag"; }).sort(function (a, b) { return a.due - b.due; });
    var rowH = 36;
    // the card takes what four orders leave, within reason
    var cardMin = clamp(P.y + P.h - 8 - (y + 18 + rowH * 4 + 8), 150, 250);
    var room = Math.max(0, Math.floor((P.y + P.h - 8 - cardMin - 8 - y - 18) / rowH));
    A.text(c, "Your orders " + bagCount() + "/" + bagSize() + " in the bag", x, y + 6, 12, { align: "left", colour: T.paper, upper: false, font: T.body });
    y += 16;
    var focus = focusOrder();
    list.slice(0, room).forEach(function (o, i) {
      var ry = y + i * rowH;
      var sel = route && route.stop === stopOf(o).id;
      var lateBy = now() - o.due;
      var row = A.rr(x, ry, w, rowH - 4, 6);
      A.solid(c, row, T.ink, sel ? 2.4 : 1.2, sel ? T.accent : T.paper);
      if (o === focus && !sel) { A.ink(c, 1.2, T.accent); c.setLineDash([4, 3]); c.stroke(row); c.setLineDash([]); }
      // state icon
      if (o.state === "bag") A.solid(c, A.rr(x + 6, ry + 6, 18, 18, 3), T.accent, 1.4);
      else { A.icon(c, "bag", x + 15, ry + 16, 9); }
      var mins = Math.ceil(o.due - now());
      var name = o.state === "assigned" ? o.brand : (o.house.kind === "flat" ? "Flat, " : o.house.no + " ") + o.house.street;
      A.text(c, name, x + 31, ry + 10, 13, { align: "left", colour: T.paper, max: w - 31 - 64 });
      var sub = o.state === "assigned" ? (o.readyAt <= clock ? "Ready" : "Being prepared") + (o.batched ? ". Batched" : "") :
        "In the bag" + (o.soggy ? ". Soggy" : "");
      A.text(c, sub, x + 31, ry + 24, 12, { align: "left", colour: T.accent, font: T.body, upper: false, max: w - 31 - 64 });
      A.text(c, lateBy > 0 ? "Late " + Math.ceil(lateBy) : mins + " min", x + w - 8, ry + 11, 15, { align: "right", colour: lateBy > 0 ? T.red : o.shrunk > 0 ? T.red : T.paper });
      A.text(c, money(o.pay), x + w - 8, ry + 25, 12, { align: "right", colour: T.paper, font: T.body });
      hits.push({ x: x, y: ry, w: w, h: rowH - 4, fn: function () { routeToOrder(o); } });
    });
    if (list.length > room && room > 0) A.text(c, "+" + (list.length - room) + " more", x + w - 8, y + room * rowH - 2, 12, { align: "right", colour: T.paper });
    if (!list.length) A.text(c, "Looking for orders near you.", x, y + 14, 12.5, { align: "left", colour: T.paper, font: T.body, upper: false });
    // the note, or the doorstep
    var cardY = P.y + P.h - 8 - cardMin;
    var box = { x: x, y: cardY, w: w, h: cardMin };
    if (doorstep) drawDoorCard(c, box, false);
    else drawNote(c, box, focus);
  }

  function drawNote(c, b, o) {
    var card = A.rr(b.x, b.y, b.w, b.h, 8);
    A.solid(c, card, T.paper, 2);
    if (!o) {
      A.text(c, "No notes yet.", b.x + b.w / 2, b.y + b.h / 2, 14, { colour: T.ink });
      return;
    }
    c.fillStyle = T.accent;
    c.fillRect(b.x + 1, b.y + 1, b.w - 2, 6);
    var head = o.state === "assigned" ? "Pick up: " + o.brand : "Note from " + o.name;
    A.text(c, head, b.x + 12, b.y + 22, 13, { align: "left", colour: T.ink, max: b.w - 24 });
    var where = o.house.kind === "flat" ? (o.type === "back" ? "Flat " : "Flat ") + (o.house.flatNo + 1) + ", " + o.house.street : o.house.no + " " + o.house.street;
    A.text(c, "To " + where, b.x + 12, b.y + 39, 12, { align: "left", colour: T.ink, font: T.body, upper: false, max: b.w - 24 });
    var size = b.w < 230 ? 16 : 18;
    var lines = A.wrap(c, "“" + o.note + "”", size, b.w - 24);
    lines.slice(0, 4).forEach(function (l, i) { A.text(c, l, b.x + 12, b.y + 62 + i * (size + 2), size, { align: "left", colour: T.ink }); });
    var foot = o.state === "assigned" ? (o.readyAt <= clock ? "Ready to collect." : "Being prepared.") : "Due " + hhmm(o.due) + ". Promised " + hhmm(o.promised) + ".";
    A.text(c, foot, b.x + 12, b.y + b.h - 13, 12, { align: "left", colour: T.ink, font: T.body, upper: false, max: b.w - 24 });
  }

  function drawStrip(c, P) {
    // a narrow screen: the note on the left, the two numbers on the right
    A.solid(c, A.rr(P.x, P.y, P.w, P.h, 8), T.ink, 1.5, T.paper);
    var o = focusOrder();
    var mw = Math.min(118, P.w * 0.36);
    var nx = P.x + 8, nw = P.w - mw - 22;
    if (o) {
      var lines = A.wrap(c, o.note, 13, nw);
      var head = o.state === "assigned" ? "Pick up: " + o.brand : (o.house.kind === "flat" ? "Flat " + (o.house.flatNo + 1) : "No " + o.house.no) + ": " + minutesLeft(o) + " min";
      A.text(c, head, nx, P.y + 13, 12, { align: "left", colour: T.accent, max: nw });
      lines.slice(0, Math.max(1, Math.floor((P.h - 22) / 15))).forEach(function (l, i) { A.text(c, l, nx, P.y + 30 + i * 15, 13, { align: "left", colour: T.paper, max: nw }); });
    } else {
      A.text(c, toasts[0] ? toasts[0].text : "Looking for orders.", nx, P.y + P.h / 2, 12, { align: "left", colour: T.paper, font: T.body, upper: false, max: nw });
    }
    var mx = P.x + P.w - mw - 6;
    A.text(c, "Fees " + money(fees), mx, P.y + 16, 13, { align: "left", colour: T.paper, max: mw });
    A.text(c, "You " + money(earned), mx, P.y + 34, 13, { align: "left", colour: T.accent, max: mw });
    A.text(c, bagCount() + "/" + bagSize() + " in bag", mx, P.y + 52, 12, { align: "left", colour: T.paper, max: mw });
  }

  // The doorstep card: the note at the top, the choices cycling below
  function drawDoorCard(c, b, overlay) {
    var d = doorstep, o = d.o;
    var card = A.rr(b.x, b.y, b.w, b.h, 8);
    A.solid(c, card, T.paper, 2);
    c.fillStyle = T.accent;
    c.fillRect(b.x + 1, b.y + 1, b.w - 2, 6);
    hits.push({ x: b.x, y: b.y, w: b.w, h: b.h, fn: function () { press(); } });
    var size = b.w < 230 ? 14 : 15;
    var lines = A.wrap(c, "“" + o.note + "”", size, b.w - 20);
    lines = lines.slice(0, 3);
    lines.forEach(function (l, i) { A.text(c, l, b.x + 10, b.y + 20 + i * (size + 1), size, { align: "left", colour: T.ink }); });
    var top = b.y + 20 + lines.length * (size + 1) + 4;
    var bottom = b.y + b.h - 20;
    var area = { x: b.x + 8, y: top, w: b.w - 16, h: bottom - top };
    if (d.done) drawDoorDone(c, area, d);
    else if (o.type === "code") drawCode(c, area, d);
    else if (o.type === "photo") drawPhoto(c, area, d);
    else drawBellKnock(c, area, d);
    var hint = d.done ? "" : (shell.input.mode === "touch" ? "Tap" : shell.input.mode === "mouse" ? "Click" : "Space") + " when it's the right one";
    if (hint) A.text(c, hint, b.x + b.w / 2, b.y + b.h - 10, 12, { colour: T.ink, font: T.body, upper: false });
    if (d.flash > 0 && !d.done) {
      A.ink(c, 3, T.red);
      c.globalAlpha = Math.min(1, d.flash * 3);
      c.stroke(card);
      c.globalAlpha = 1;
    }
    // first time: point at the note
    if (!taught.note && !N.flags.clip && !d.done) {
      A.arrow(c, b.x + b.w - 34, b.y + 6, "Read this", tNow, 13, shell.reduceMotion);
    }
  }

  function tileBox(area, n, i) {
    var gap = 8, tw = Math.min(110, (area.w - gap * (n - 1)) / n);
    var total = tw * n + gap * (n - 1);
    return { x: area.x + (area.w - total) / 2 + i * (tw + gap), y: area.y + 2, w: tw, h: Math.max(30, area.h - 4) };
  }
  function drawBellKnock(c, area, d) {
    d.opts.forEach(function (opt, i) {
      var tb = tileBox(area, d.opts.length, i);
      var on = i === d.at;
      A.solid(c, A.rr(tb.x, tb.y, tb.w, tb.h, 6), on ? T.accent : T.paper, 2);
      var cx = tb.x + tb.w / 2, cy = tb.y + (tb.h - 16) / 2;
      var s = Math.min(tb.h - 22, tb.w * 0.5);
      if (opt === "Bell") A.doorbell(c, cx, cy, s * 0.9, on);
      else {
        A.mitten(c, cx + s * 0.1, cy, s * 0.32, T.paper, false, 2);
        [-1, 0, 1].forEach(function (k) { A.line(c, [[cx - s * 0.42, cy + k * s * 0.25], [cx - s * 0.62, cy + k * s * 0.32]], 2); });
      }
      A.text(c, opt, cx, tb.y + tb.h - 9, 13, { colour: T.ink });
      if (on) A.brackets(c, tb.x - 3, tb.y - 3, tb.w + 6, tb.h + 6, 9, 3);
    });
  }
  function drawCode(c, area, d) {
    var w = Math.min(190, area.w), h = Math.max(34, area.h - 4);
    var x = area.x + (area.w - w) / 2, y = area.y + 2;
    A.solid(c, A.rr(x, y, w, h, 6), T.ink, 2);
    A.solid(c, A.rr(x + 8, y + 6, w - 16, h - 20, 4), T.accent, 1.5);
    A.text(c, d.opts[d.at].split("").join(" "), x + w / 2, y + 6 + (h - 20) / 2, Math.min(26, (h - 20) * 0.75), { colour: T.ink });
    // which of the codes this is
    d.opts.forEach(function (o, i) {
      A.solid(c, A.ell(x + w / 2 + (i - (d.opts.length - 1) / 2) * 12, y + h - 7, 3, 3), i === d.at ? T.paper : T.ink, 1.2, T.paper);
    });
    A.brackets(c, x - 3, y - 3, w + 6, h + 6, 9, 3);
  }
  function drawPhoto(c, area, d) {
    var n = d.opts.length, gap = 10;
    var dw = Math.min(54, (area.w - gap * (n - 1)) / n * 0.8), dh = Math.max(28, area.h - 18);
    var step = (area.w - dw) / (n - 1) * 0.8;
    var x0 = area.x + (area.w - (step * (n - 1) + dw)) / 2;
    d.opts.forEach(function (num, i) {
      A.frontDoor(c, x0 + i * step, area.y + 6, dw, dh - 6, num, false, i % 2 === 1);
    });
    // the viewfinder
    var fx2 = x0 + d.slide * step - 6, fy = area.y;
    A.ink(c, 2, T.ink);
    A.brackets(c, fx2, fy, dw + 12, dh + 6, 10, 3, T.red);
    A.solid(c, A.ell(fx2 + dw + 4, fy + 6, 3, 3), T.red, 0);
  }
  function drawDoorDone(c, area, d) {
    var o = d.o;
    if (o.type === "photo") {
      // the photo, on file
      var ph = area.h - 4, pw = Math.min(ph * 0.85, area.w * 0.5);
      var x = area.x + (area.w - pw) / 2, y = area.y + 2;
      c.save();
      c.translate(x + pw / 2, y + ph / 2);
      c.rotate(-0.06);
      A.solid(c, A.rr(-pw / 2, -ph / 2, pw, ph, 2), T.paper, 2);
      A.solid(c, A.box(-pw / 2 + 5, -ph / 2 + 5, pw - 10, ph * 0.74), T.ink, 1.5);
      A.frontDoor(c, -pw * 0.2, -ph / 2 + 10, pw * 0.4, ph * 0.62, o.answer, false, false);
      A.icon(c, "bag", pw * 0.27, ph * 0.12, 8);
      A.text(c, "On file", 0, ph / 2 - ph * 0.11, 12, { colour: T.ink });
      c.restore();
      return;
    }
    // the door opens and they come to it (the gate's intercom, for a code)
    var dh = area.h - 4, dw = Math.min(dh * 0.62, area.w * 0.32);
    var dx = area.x + 6, dy = area.y + 2;
    var R = dw * 0.36;
    if (o.type === "code") {
      // the gate, open, and the intercom
      for (var i = 0; i < 5; i++) A.line(c, [[dx + i * dw / 4.5, dy + dh * 0.1], [dx + i * dw / 4.5 - dw * 0.2, dy + dh]], 3);
      A.line(c, [[dx - dw * 0.2, dy + dh * 0.55], [dx + dw * 0.8, dy + dh * 0.45]], 3);
      A.solid(c, A.rr(dx + dw * 0.8, dy + dh * 0.15, dw * 0.45, dh * 0.5, 4), T.ink, 2);
      for (var g = 0; g < 4; g++) A.line(c, [[dx + dw * 0.88, dy + dh * 0.24 + g * dh * 0.07], [dx + dw * 1.17, dy + dh * 0.24 + g * dh * 0.07]], 1.5, T.paper);
      if (d.line) {
        var l2 = A.wrap(c, d.line, 13, area.w - dw * 1.5 - 20);
        A.bubble(c, area.x + dw * 1.3 + (area.w - dw * 1.3) / 2, area.y + area.h * 0.4, l2.slice(0, 3), 13, dx + dw * 1.25, dy + dh * 0.3, { lw: 2 });
      }
      return;
    }
    A.frontDoor(c, dx, dy, dw, dh * 0.94, null, true, o.type === "back");
    c.save();
    c.beginPath(); c.rect(dx, dy, dw, dh * 0.94); c.clip();
    A.person(c, dx + dw * 0.6, dy + dh * 0.36, R, o.look, { shout: d.shout ? 0.6 : 0, brows: d.shout ? 1 : 0.5, look: 1, awake: d.awake, smile: !d.shout });
    c.restore();
    if (d.line) {
      var bw = area.w - dw - 22;
      var lines = A.wrap(c, d.line, 13, bw - 16);
      A.bubble(c, dx + dw + 14 + bw / 2, area.y + area.h * 0.38, lines.slice(0, 3), 13, dx + dw * 0.85, dy + dh * 0.3, { lw: 2 });
    }
  }

  // ---------------------------------------------------------------------------
  // Sound: lo-fi, through the kit
  // ---------------------------------------------------------------------------
  var rainSrc = null, rainGain = null;
  function sfx(kind) {
    var s = shell.sound;
    switch (kind) {
      case "ping": s.tone(1320, 0.08, { type: "sine", vol: 0.09 }); s.tone(1760, 0.12, { type: "sine", vol: 0.09, delay: 0.09 }); break;
      case "ping2": s.tone(1760, 0.08, { type: "sine", vol: 0.08 }); s.tone(1320, 0.14, { type: "sine", vol: 0.08, delay: 0.09 }); break;
      case "tick": s.tone(900, 0.03, { vol: 0.03 }); break;
      case "bell": s.tone(880, 0.35, { type: "sine", vol: 0.14 }); s.tone(698, 0.5, { type: "sine", vol: 0.14, delay: 0.32 }); break;
      case "knock": [0, 0.16, 0.32].forEach(function (d) { s.noise(0.07, { freq: 260, vol: 0.4, delay: d }); s.tone(110, 0.06, { type: "sine", vol: 0.2, delay: d }); }); break;
      case "baby": s.tone(620, 0.5, { type: "square", slide: 880, vol: 0.05, delay: 0.7 }); s.tone(880, 0.6, { type: "square", slide: 560, vol: 0.05, delay: 1.2 }); break;
      case "buzz": s.tone(120, 0.35, { type: "sawtooth", vol: 0.09 }); break;
      case "buzzWrong": s.tone(180, 0.12, { type: "square", vol: 0.07 }); s.tone(140, 0.2, { type: "square", vol: 0.07, delay: 0.13 }); break;
      case "shutter": s.noise(0.05, { type: "highpass", freq: 3000, vol: 0.3 }); s.noise(0.05, { type: "highpass", freq: 2200, vol: 0.25, delay: 0.07 }); break;
      case "zip": s.noise(0.18, { type: "bandpass", freq: 2400, q: 2, vol: 0.18 }); s.tone(500, 0.1, { vol: 0.04, slide: 900 }); break;
      case "coin": s.tone(988, 0.06, { vol: 0.06 }); s.tone(1319, 0.14, { vol: 0.06, delay: 0.06 }); break;
      case "low": s.tone(220, 0.18, { vol: 0.07 }); s.tone(165, 0.3, { vol: 0.07, delay: 0.16 }); break;
      case "late": s.tone(300, 0.1, { type: "triangle", vol: 0.07 }); break;
      case "skid": s.noise(0.35, { type: "bandpass", freq: 1800, q: 3, vol: 0.18 }); break;
      case "splash": s.noise(0.3, { type: "bandpass", freq: 900, q: 0.7, vol: 0.2 }); break;
      case "thunk": s.tone(120, 0.15, { type: "sine", slide: 60, vol: 0.3 }); s.noise(0.1, { freq: 600, vol: 0.25 }); break;
      case "click": s.tone(1500, 0.02, { vol: 0.03 }); break;
      case "nope": s.tone(330, 0.1, { vol: 0.06 }); s.tone(262, 0.18, { vol: 0.06, delay: 0.1 }); break;
      case "brake": s.noise(0.12, { type: "bandpass", freq: 3200, q: 4, vol: 0.06 }); break;
      case "crowd":
        s.noise(1.4, { type: "bandpass", freq: 600, q: 0.5, vol: 0.3 });
        [523, 659, 784].forEach(function (f, i) { s.tone(f, 0.3, { type: "square", vol: 0.04, delay: 0.2 + i * 0.25 }); });
        break;
    }
  }
  function rainSound(on) {
    var ac = shell.sound.ctx();
    if (!ac || !shell.sound.out()) return;
    if (on && !rainSrc) {
      var buf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), d = buf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      rainSrc = ac.createBufferSource(); rainSrc.buffer = buf; rainSrc.loop = true;
      var f = ac.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 1800;
      rainGain = ac.createGain(); rainGain.gain.value = 0.0001;
      rainSrc.connect(f); f.connect(rainGain); rainGain.connect(shell.sound.out());
      rainSrc.start();
      rainGain.gain.setTargetAtTime(0.05, ac.currentTime, 0.4);
    } else if (!on && rainSrc) {
      var src = rainSrc;
      rainGain.gain.setTargetAtTime(0.0001, ac.currentTime, 0.2);
      setTimeout(function () { try { src.stop(); } catch (e) {} }, 800);
      rainSrc = null;
    }
  }

  // ---------------------------------------------------------------------------
  // Start it up
  // ---------------------------------------------------------------------------
  shell = N.createGame({
    root: root,
    slug: "leave-it-at-the-door",
    title: "Leave It at the Door",
    stamp: "Left at door",
    tilt: -5,
    note: "One shift. Four rushes. The pay is the joke.",
    pitch: "Deliver the food. The app has promised it was already here.",
    hints: {
      keys: "Arrow keys or WASD to ride, a click to go somewhere. Space at the door. P to pause.",
      touch: "Tap where to go, or swipe to turn. Tap the doorstep at the door."
    },
    againLabel: "Log on again",
    daily: true,
    smallCallouts: true,
    fullOnTouch: true,
    keys: { up: ["ArrowUp", "KeyW"], down: ["ArrowDown", "KeyS"], left: ["ArrowLeft", "KeyA"], right: ["ArrowRight", "KeyD"], action: ["Space", "Enter"] },
    pad: { action: [0, 2] },
    reset: reset,
    update: function (dt, input) {
      update(dt, input);
      var want = shell.state() === "playing" && stage && stage.rain && !ended;
      if (want !== !!rainSrc) rainSound(want);
    },
    render: render,
    resize: resize
  });
  T = shell.tokens;
  A.init(T);
  root.addEventListener("pointerdown", onDown);
  root.addEventListener("pointermove", onMove);
  root.addEventListener("pointerup", onUp);
  root.addEventListener("pointercancel", function () { pointerDown = null; });

  if (DEBUG) {
    window.__leave = {
      get state() { return { stage: stageIdx, clock: clock, rating: rating, delivered: delivered, earned: earned, fees: fees, orders: orders, rider: rider, route: route, doorstep: doorstep, owned: owned, L: L }; },
      routeTo: routeTo, tap: tap, press: press, queue: queue, TW: TW, showing: function () { return doorstep && showing(); },
      stopOf: stopOf, realStop: realStop, travel: travel, now: now, bagCount: bagCount, bagSize: bagSize, riderPlace: riderPlace
    };
  }
})();
