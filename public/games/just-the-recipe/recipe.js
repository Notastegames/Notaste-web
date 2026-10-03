// Just the Recipe: scroll down a recipe site to the recipe. The page fights
// you all the way.
//
// THE DESIGN
//
// You are a hand: the pointing cursor, pointing down the page, with a cuff in
// rust. The page scrolls itself; you steer left and right (arrows or A and D,
// the mouse, or a finger dragged anywhere) and click (Space, a mouse click or
// the Click button) on whatever your fingertip is touching. One rule for
// clicking: only the thing under your fingertip gets clicked, and anything
// that's an advert opens a new tab and costs you two seconds.
//
// The score is the time it takes to reach all three recipes, and how much of
// the life story you skipped. Nothing kills you. Everything costs time.
//
// What's in the way, and what to do about it:
// - The life story. Paragraphs, family photos and pull quotes, with white
//   space wandering down between them. On the words you wade (about a third of
//   the speed) and leave a highlighter trail of what you read; in the white
//   space you skim at full speed. The share of story you didn't wade through
//   is "Skipped".
// - Cookie banners, stretched across the whole page. Your fingertip stops at
//   their row of buttons. Accept all is huge and lets you through, but it
//   sends an advert straight after you and more on the next page. Manage
//   makes you sit through "loading your preferences" and then moves the
//   buttons. The tiny Reject all is free. Click a button just before it
//   reaches you and you don't stop at all.
// - Newsletter pop-ups. The pushy cat peeks in from the side of the page and
//   a dashed box marks where the pop-up will land: where you are now. Move
//   before it lands and it misses. If it lands on you, the whole page stops
//   until you find the little X. On pudding, the box follows you for a moment,
//   and closing one sometimes gets you an "Are you sure?" with a tiny "Yes".
// - Adverts. A thin strip saying Advertisement, which jumps open into a solid
//   box when you get near it. Nothing closes an advert: go round. One you've
//   already passed can load late and shove the whole page down, putting you
//   back where you were a moment ago.
// - Autoplay videos (pudding). The embed comes loose as you reach it, rises
//   to your fingertip and slides after you, slower than you can move. While
//   it's under you, you can't scroll. After three seconds an X appears; until
//   then, keep away from it. It gives up after a while and sulks in a corner.
// - Jump to recipe. A button at the top of every page and sometimes in the
//   middle. Click it as it goes by and the page races down, skipping the
//   story, until the next thing in the way. It helps sometimes: it stops at
//   the next banner or advert, and adverts load as you arrive. On pudding,
//   some of them are adverts with a tiny Ad tag.
//
// Three courses, each a longer page, each announced with a notice:
// - Starter, Nan's tomato soup: the life story, cookie banners, Jump to recipe.
// - Main, an easy weeknight lasagne: newsletter pop-ups and adverts.
// - Pudding, a very simple sponge: autoplay videos, fake Jump buttons, a banner
//   that hides Reject all under Manage, pop-ups that follow you.
// Each page ends with the recipe card: a few ingredients and one line of
// method. Reaching it is "Recipe: found". Between courses you get a stamp for
// that page and pick one of three settings, each with a catch: Reader mode,
// an Ad blocker, Accept all forever, Faster scrolling, Mute all tabs.
// A page that takes too long times out ("Session expired"), which ends the
// run. The results rank the whole meal on the approval ladder by time.
//
// The cast, in the house cut-out style (cast.js): the site's chef mascot
// (toque, curly moustache), who presents the cookie banners and stars in the
// autoplay videos; the newsletter cat, holding on to its pop-up; and the
// author's family in the photos, who complain as you skip them: Nan (a perm),
// Uncle Keith (flat cap and moustache), the kids (backwards caps), Grandad,
// the author (a bun) and Biscuit the dog. The satire is aimed at the advert
// web wrapped round the recipe, never at the cook or the family.
//
// Built on the shared kit (/games/kit/kit.js). page.js builds the pages and
// holds the words; cast.js draws the characters; this file is the game.
(function () {
  "use strict";

  var N = window.Notaste, PG = window.RecipePage, CA = window.RecipeCast;
  var root = document.getElementById("game-root");
  if (!N || !PG || !CA || !root) return;

  var params = new URLSearchParams(window.location.search);
  var AUTO = N.flags.autopilot;
  var DEBUG = params.has("debug");
  var FIRST = DEBUG ? Math.max(0, Math.min(2, (parseInt(params.get("course"), 10) || 1) - 1)) : 0;
  var COURSES = PG.COURSES, SAY = PG.SAY;

  // ---------------------------------------------------------------------------
  // Tuning. The page is 100 units across. The screen shows 106 units across
  // or 112 down, whichever fits, so phones, desktops and the clip frame all
  // see about the same amount of page.
  // ---------------------------------------------------------------------------
  var VIEW_W = 106, VIEW_H = 112;
  var START = 45;                // where the fingertip starts on every page
  var TIP = 1.8;                 // half the width of the fingertip
  var HAND_SPEED = 100;          // keys and pad, units a second
  var AIM_SPEED = 320;           // mouse and finger
  var AUTO_SPEED = 115;          // the autopilot, at about a keyboard's pace
  var WADE = 0.36;               // speed through the words of the life story
  var WADE_READER = 0.6;         // ...in reader mode
  var JUMP_SPEED = 190;          // Jump to recipe
  var EARLY = 6;                 // a button can be clicked this far before it reaches you
  var POP_W = 46, POP_H = 30, POP_TOP = 6;   // a newsletter pop-up, and how far above the fingertip its top sits
  var POP_WARN = [1, 0.9, 0.75]; // how long the cat gives you, per course
  var POP_FLY = 0.28;
  var VIDEO_W = 40, VIDEO_H = 25;
  var VIDEO_CHASE = 36;          // how fast a loose video slides after you
  var VIDEO_RISE = 18;           // ...and comes up to meet you
  var VIDEO_X = 3;               // seconds before its X appears
  var VIDEO_LIFE = 11;           // seconds before it gives up
  var MANAGE_WAIT = 1.7;         // loading your preferences
  var TAB_TIME = 1.8;            // the new tab an advert opens
  var LADDER = [1, 1.2, 1.5];       // time against par: approved, pending review, not approved, then rejected

  // Between courses: something good, something bad, in that order
  var CHOICES = {
    reader: { label: "Reader mode", detail: "The life story slows you less. No more Jump to recipe buttons.",
              apply: function (m) { m.reader = true; } },
    adblock: { label: "Ad blocker", detail: "Adverts never load. A pop-up asks you to turn it off, twice a page.",
               apply: function (m) { m.adblock = true; } },
    forever: { label: "Accept all, forever", detail: "No more cookie banners. Twice the adverts, and they know you.",
               apply: function (m) { m.forever = true; } },
    fast: { label: "Faster scrolling", detail: "The page scrolls faster. So does everything on it.",
            apply: function (m) { m.speed *= 1.14; } },
    mute: { label: "Mute all tabs", detail: "Autoplay videos give up twice as fast. Pop-ups give less warning.",
            apply: function (m) { m.videoLife = 0.5; m.warn = 0.72; } }
  };
  var OFFERS = [["reader", "adblock", "forever", "fast"], ["reader", "adblock", "forever", "fast", "mute"]];

  var RANKS = [
    { line: "Three recipes, hardly a word of anyone's childhood. Nan has been informed." },
    { line: "You got all three recipes. You also know what the author did in Tuscany." },
    { line: "Dinner is very late. You know a lot about the author's kitchen tiles." },
    { line: "By the time you reached the pudding, it was breakfast." }
  ];
  // Between courses, by how that page went
  var CLEARED = [
    ["Soup located. Nan's childhood went largely unread.", "Lasagne located. Italy can wait.", ""],
    ["Soup located. You know about the tiles now.", "Lasagne located. You've seen the oven.", ""],
    ["Soup located. It's gone cold.", "Lasagne located. The kids have had toast.", ""],
    ["Soup located, eventually. The soup has been informed.", "Lasagne located. It's tomorrow.", ""]
  ];

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  var shell = null, T = null, ctx = null;
  var W = 1, H = 1, DPR = 1, U = 1, OX = 0, VH = 100, VW = 100, HY = 45, MARGIN = 0;
  var run = null;       // the whole meal
  var G = null;         // the page you're on
  var hand = { x: 50, kv: 0, press: 0, squash: 0, tilt: 0, wob: 0 };
  var prevAct = false, autoCd = 0;
  var bubbles = [], fx = [], shake = 0, clock = 0;
  var hint = null, noticed = false, hudEls = null, talkWait = 0, mumble = 0, jingle = 0;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function pct(n) { return Math.round(n * 100) + "%"; }
  function ease(t) { t = clamp(t, 0, 1); return 1 - (1 - t) * (1 - t); }

  // ---------------------------------------------------------------------------
  // A new meal, and a new page
  // ---------------------------------------------------------------------------
  function reset(sh) {
    shell = sh;
    T = sh.tokens;
    run = {
      time: 0, read: 0, total: 0, accepted: 0, rejected: 0, closed: 0, dodged: 0, clicked: 0, jumps: 0,
      owed: 0, times: [], picked: [], expired: false,
      mods: { speed: 1, warn: 1, videoLife: 1, reader: false, adblock: false, forever: false },
      knows: { reject: false, close: false, video: false, jump: false, gap: false }
    };
    startCourse(FIRST);
  }

  function startCourse(n) {
    var def = COURSES[n];
    var page = PG.build(n, shell.random, run.mods, run.owed);
    run.owed = 0;
    G = {
      n: n, def: def, items: page.items, triggers: page.triggers, len: page.len, storyTotal: page.storyTotal,
      recipe: page.items[page.items.length - 1], read: 0, scroll: START, v: 0, clock: 0,
      popups: [], video: null, tab: null, jump: null, blocked: null, blockT: 0, wade: false, wadeT: 0, skimT: 0,
      trail: [], calls: {}, over: false, endT: 0, hover: null, warned: false
    };
    hand.x = 50; hand.kv = 0; hand.press = 0; hand.squash = 0;
    prevAct = true;
    bubbles = []; fx = [];
    noticed = false;
    hint = null;
  }

  // Once a page, a routine callout; the rest happen quietly
  function once(key, text, opts) {
    if (G.calls[key]) return false;
    G.calls[key] = true;
    shell.callout(text, opts);
    return true;
  }

  // ---------------------------------------------------------------------------
  // What's where. All in page units: x across the column, y down the page.
  // ---------------------------------------------------------------------------
  // On the words of the life story?
  function storyAt(x, y) {
    for (var i = 0; i < G.items.length; i++) {
      var it = G.items[i];
      if (it.y > y) break;
      if (it.kind !== "story" || it.y + it.h <= y) continue;
      for (var k = 0; k < it.blocks.length; k++) {
        var b = it.blocks[k];
        if (x >= b.x0 + 1 && x <= b.x1 - 1) return it;
      }
      return null;
    }
    return null;
  }

  // The first thing between from and to that stops a fingertip at x
  function blocker(x, from, to) {
    var best = null, by = Infinity;
    for (var i = 0; i < G.items.length; i++) {
      var it = G.items[i], L;
      if (it.y > to + 40) break;
      if (it.kind === "banner" && (it.state === "up" || it.state === "wait")) L = it.y + it.row;
      else if (it.kind === "advert" && it.loaded) {
        if (it.x1 <= x - TIP || it.x0 >= x + TIP) continue;
        L = it.y;
      } else continue;
      if (L >= from - 0.01 && L <= to && L < by) { by = L; best = it; }
    }
    var v = G.video;
    if (v && v.state === "dock" && Math.abs(v.x - x) < VIDEO_W / 2 + TIP && from < by) { by = from; best = v; }
    return best ? { y: by, it: best } : null;
  }

  // Adverts you're beside are walls: you can't steer into the side of one
  function walls(x0, x1) {
    var y = G.scroll;
    for (var i = 0; i < G.items.length; i++) {
      var it = G.items[i];
      if (it.y > y) break;
      if (it.kind !== "advert" || !it.loaded || it.y + it.h <= y + 0.05 || it.y >= y - 0.05) continue;
      if (x0 + TIP <= it.x0 + 0.05 && x1 + TIP > it.x0) x1 = it.x0 - TIP;
      if (x0 - TIP >= it.x1 - 0.05 && x1 - TIP < it.x1) x1 = it.x1 + TIP;
    }
    return x1;
  }

  function openPopup() {
    for (var i = 0; i < G.popups.length; i++) if (G.popups[i].state === "open") return G.popups[i];
    return null;
  }
  function modal() { return !!(openPopup() || G.tab); }

  // The pop-up's close target: the X, or "Yes, leave" on an Are you sure
  function closeSpan(p) {
    var x1 = p.cx + p.w / 2;
    return p.kind === "confirm" ? [x1 - 16, x1 - 1] : [x1 - 7.5, x1 - 0.5];
  }
  function videoX(v) { var x1 = v.x + VIDEO_W / 2; return [x1 - 7.5, x1 - 0.5]; }

  // A banner whose buttons are at your fingertip, or about to be
  function bannerNear(y, ahead) {
    for (var i = 0; i < G.items.length; i++) {
      var it = G.items[i];
      if (it.y > y + ahead + 20) break;
      if (it.kind !== "banner" || (it.state !== "up" && it.state !== "wait")) continue;
      var L = it.y + it.row;
      if (L >= y - 0.5 && L <= y + ahead) return it;
    }
    return null;
  }
  function buttonAt(b, x) {
    for (var i = 0; i < b.buttons.length; i++) {
      var btn = b.buttons[i];
      if (x >= btn.x0 - 0.8 && x <= btn.x1 + 0.8) return btn;
    }
    return null;
  }
  function jumpAt(x, y) {
    for (var i = 0; i < G.items.length; i++) {
      var it = G.items[i];
      if (it.y > y + 6) break;
      if (it.kind === "jump" && !it.used && x >= it.x0 - 1 && x <= it.x1 + 1 && y >= it.y - 5 && y <= it.y + it.h + 3) return it;
    }
    return null;
  }
  function advertAt(x, y) {
    for (var i = 0; i < G.items.length; i++) {
      var it = G.items[i];
      if (it.y > y + EARLY) break;
      if (it.kind === "advert" && it.loaded && x > it.x0 - TIP && x < it.x1 + TIP && it.y >= y - 0.5 && it.y <= y + EARLY) return it;
    }
    return null;
  }

  // What the fingertip is over right now, for the hover ring
  function hovering() {
    var x = hand.x, y = G.scroll;
    var p = openPopup();
    if (p) {
      var s = closeSpan(p);
      return x >= s[0] && x <= s[1] ? { what: "close", p: p } : null;
    }
    var b = bannerNear(y, EARLY);
    if (b && b.state === "up") { var btn = buttonAt(b, x); if (btn) return { what: "button", b: b, btn: btn }; }
    var v = G.video;
    if (v && v.state === "dock" && v.t >= VIDEO_X) { var vs = videoX(v); if (x >= vs[0] && x <= vs[1]) return { what: "videoX" }; }
    var j = jumpAt(x, y);
    if (j) return { what: "jump", j: j };
    return null;
  }

  // ---------------------------------------------------------------------------
  // The round
  // ---------------------------------------------------------------------------
  function update(dt, input) {
    if (!G) return;
    clock += dt;
    tickFx(dt);
    var st = shell.state();
    if (st === "ending" || st === "results") { ending(dt); return; }
    if (st !== "playing" || G.over) return;
    G.clock += dt;
    run.time += dt;

    var auto = AUTO ? autopilot(dt) : null;
    steer(dt, input, auto);
    var act = auto ? auto.act : input.action;
    if (act && !prevAct) press();
    prevAct = act;

    updatePopups(dt);
    updateVideo(dt);
    updateBanners(dt);
    if (G.tab && (G.tab.t += dt) >= G.tab.life) G.tab = null;
    loadAdverts();
    fireTriggers();
    scrollPage(dt);
    G.hover = hovering();
    pickHint(dt);
    chatter(dt);
    noises(dt);

    if (G.scroll >= G.recipe.y - 0.01) courseDone();
    else if (G.clock >= G.def.limit) expire();
    else if (!G.warned && G.clock >= G.def.limit - 10) {
      G.warned = true;
      shell.callout("Session expires in 10", { tilt: -3 });
    }
    paintHud();
  }

  function steer(dt, input, auto) {
    var want = null, speed = HAND_SPEED, nx;
    if (auto) { want = auto.x; speed = AUTO_SPEED; }
    else if (input.aim.on) { want = (input.aim.x - OX) / U; speed = AIM_SPEED; }
    if (want != null) {
      hand.kv = 0;
      nx = hand.x + clamp(want - hand.x, -speed * dt, speed * dt);
    } else {
      // keys and pad: a quick run-up, so a tap nudges and a hold travels
      hand.kv += (input.steer * HAND_SPEED - hand.kv) * Math.min(1, dt * 18);
      nx = hand.x + hand.kv * dt;
    }
    nx = walls(hand.x, clamp(nx, TIP, 100 - TIP));
    var vx = dt ? (nx - hand.x) / dt : 0;
    hand.tilt += (clamp(-vx * 0.0022, -0.22, 0.22) - hand.tilt) * Math.min(1, dt * 12);
    hand.x = nx;
    hand.press = Math.max(0, hand.press - dt * 7);
    hand.squash = Math.max(0, hand.squash - dt * 5);
  }

  // ---------- Clicking: only what's under the fingertip ----------
  function press() {
    hand.press = 1;
    shell.sound.tone(1600, 0.025, { vol: 0.07 });
    fx.push({ kind: "ring", x: hand.x, y: HY, t: 0, life: 0.3 });
    if (G.tab) return;
    var x = hand.x, y = G.scroll;

    var p = openPopup();
    if (p) {
      var s = closeSpan(p);
      if (x >= s[0] && x <= s[1]) closePopup(p);
      else if (p.kind === "news" && Math.random() < 0.5) say(catAnchor(p), pick(SAY.catWrong));
      return;
    }

    var b = bannerNear(y, EARLY);
    if (b && b.state === "up") {
      var btn = buttonAt(b, x);
      if (btn) { clickButton(b, btn); return; }
    }

    var v = G.video;
    if (v && v.state === "dock" && Math.abs(v.x - x) < VIDEO_W / 2 + TIP) {
      var vs = videoX(v);
      if (v.t >= VIDEO_X && x >= vs[0] && x <= vs[1]) closeVideo();
      else newTab("The video");
      return;
    }

    var j = jumpAt(x, y);
    if (j) {
      if (j.fake) { j.used = true; newTab("Jump to recipes"); }
      else jumpFrom(j);
      return;
    }

    if (advertAt(x, y)) newTab("An advert");
  }

  function clickButton(b, btn) {
    var anchor = chefAnchor(b);
    if (btn.type === "reject") {
      b.state = "gone"; b.t = 0;
      run.rejected++;
      run.knows.reject = true;
      if (!once("reject", "Cookies: rejected")) shell.sound.stamp();
      puff(hand.x, HY + 2);
      if (Math.random() < 0.6) say(anchor, pick(SAY.chefRejected));
    } else if (btn.type === "accept" || btn.type === "confirm") {
      b.state = "gone"; b.t = 0;
      run.accepted++;
      run.owed++;
      shell.callout(btn.type === "confirm" ? "Choices: confirmed. All of them" : "Cookies: accepted. All of them", { tilt: 4 });
      say(anchor, pick(SAY.chefAccepted));
      puff(hand.x, HY + 2);
      // an advert, straight away, right where you're heading
      var at = Math.max(b.y + b.h + 2, G.scroll + 30);
      var w = 58, x0 = clamp(hand.x - w / 2, 0, 100 - w);
      var ad = { kind: "advert", y: at, h: PG.PH, loaded: false, art: "pan", head: "Thank you for accepting",
                 x0: x0, x1: x0 + w, full: 24, load: 26, pop: 1 };
      shove(at, PG.PH + 6, null);
      insert(ad);
    } else if (btn.type === "manage") {
      b.state = "wait"; b.t = 0;
      once("manage", "Preferences: loading", { tilt: -3 });
      say(anchor, pick(SAY.chefManage));
      shell.sound.tone(300, 0.3, { type: "triangle", slide: 220, vol: 0.08 });
    }
  }

  function newTab(what) {
    G.tab = { t: 0, life: TAB_TIME, head: pick(PG.TABS), what: what };
    run.clicked++;
    shell.callout("Advert: clicked", { tilt: 3 });
    shell.sound.tone(700, 0.4, { type: "sawtooth", slide: 160, vol: 0.09 });
    if (!shell.reduceMotion) shake = Math.max(shake, 0.4);
  }

  // ---------- Jump to recipe ----------
  function jumpFrom(j) {
    j.used = true;
    run.jumps++;
    run.knows.jump = true;
    // down the page until the next thing that isn't the life story
    var to = G.recipe.y;
    for (var i = 0; i < G.items.length; i++) {
      var it = G.items[i];
      if (it.y <= j.y + j.h || it.dead || it.gone) continue;
      if (it.kind === "banner" && it.state !== "gone") { to = it.y + it.row - 16; break; }
      if ((it.kind === "advert" && !it.behind && !run.mods.adblock) || it.kind === "video" || it.kind === "recipe") { to = it.y - 16; break; }
    }
    G.jump = { from: G.scroll, to: Math.max(G.scroll + 4, to) };
    shell.sound.tone(260, 0.35, { type: "sawtooth", slide: 1300, vol: 0.08 });
    shell.sound.whoosh();
  }

  function endJump(blocked) {
    var d = G.scroll - G.jump.from;
    G.jump = null;
    shell.callout(blocked ? "Jumped. Into an advert" : d > 70 ? "Jumped to recipe. Nearly" : "Jumped. Not far", { tilt: -4 });
  }

  // ---------- Cookie banners ----------
  function updateBanners(dt) {
    for (var i = 0; i < G.items.length; i++) {
      var b = G.items[i];
      if (b.kind !== "banner" || b.dead) continue;
      b.t += dt;
      if (b.state === "wait" && b.t >= MANAGE_WAIT) {
        b.state = "up"; b.t = 0;
        if (b.second && b.layer === 1) { b.buttons = b.second; b.layer = 2; }
        else b.buttons.forEach(function (btn) { var x0 = 100 - btn.x1; btn.x1 = 100 - btn.x0; btn.x0 = x0; });
        shell.sound.tone(520, 0.06, { vol: 0.06 });
      } else if (b.state === "gone" && b.t > 0.3) b.dead = true;
    }
  }

  // ---------- Newsletter pop-ups ----------
  function fireTriggers() {
    while (G.triggers.length && G.scroll >= G.triggers[0].at) {
      var tr = G.triggers[0];
      var busy = G.popups.length || G.tab || G.jump || (G.blocked && G.blocked.kind === "banner");
      if (busy) { tr.at = G.scroll + 12; G.triggers.sort(function (a, b) { return a.at - b.at; }); break; }
      G.triggers.shift();
      spawnPopup(tr);
    }
  }

  function spawnPopup(tr) {
    var w = tr.kind === "adblock" ? 92 : POP_W;
    var p = { kind: tr.kind, w: w, cx: clamp(hand.x, w / 2 + 1, 99 - w / 2), side: hand.x < 50 ? 1 : -1,
              t: 0, warn: POP_WARN[G.n] * run.mods.warn, state: "warn", track: tr.track, confirm: tr.confirm };
    G.popups.push(p);
    if (tr.kind === "news") {
      say(catAnchor(p), pick(SAY.catWarn));
      shell.sound.tone(660, 0.12, { type: "square", slide: 990, vol: 0.06 });
    } else {
      shell.sound.tone(440, 0.1, { vol: 0.06 });
    }
  }

  function updatePopups(dt) {
    G.popups.forEach(function (p) {
      p.t += dt;
      if (p.state === "warn") {
        if (p.track && p.t < p.warn * 0.55) p.cx = clamp(p.cx + clamp(hand.x - p.cx, -40 * dt, 40 * dt), p.w / 2 + 1, 99 - p.w / 2);
        if (p.t >= p.warn) { p.state = "fly"; p.t = 0; shell.sound.whoosh(); }
      } else if (p.state === "fly" && p.t >= POP_FLY) {
        p.t = 0;
        if (Math.abs(hand.x - p.cx) < p.w / 2 || p.kind === "adblock") {
          p.state = "open";
          shell.sound.tone(150, 0.18, { type: "square", slide: 90, vol: 0.12 });
          if (!shell.reduceMotion) shake = Math.max(shake, 0.35);
          hand.squash = 1;
          if (p.kind === "news") { say(catAnchor(p), pick(SAY.catOpen)); once("news", "Newsletter: open"); }
          else say(chefAt(p.cx + p.w / 2 - 12, HY - POP_TOP - 4), pick(SAY.adblock));
        } else {
          p.state = "miss";
          run.dodged++;
          if (!once("dodge", "Subscribed: no", { tilt: 4 })) shell.sound.tone(880, 0.08, { vol: 0.05 });
          if (Math.random() < 0.7) say(catAnchor(p), pick(SAY.catMissed));
        }
      } else if ((p.state === "miss" && p.t > 0.45) || (p.state === "close" && p.t > 0.22)) {
        p.state = "gone";
      }
    });
    G.popups = G.popups.filter(function (p) { return p.state !== "gone"; });
  }

  function closePopup(p) {
    p.state = "close"; p.t = 0;
    run.closed++;
    run.knows.close = true;
    shell.sound.tone(900, 0.08, { slide: 500, vol: 0.08 });
    puff(closeSpan(p)[1] - 3, HY);
    if (p.kind === "news") {
      say(catAnchor(p), pick(SAY.catClosed));
      // on pudding, closing one sometimes asks if you're sure
      if (p.confirm) {
        G.popups.push({ kind: "confirm", w: 40, cx: clamp(hand.x, 21, 79), side: p.side, t: 0, state: "open" });
        shell.sound.tone(500, 0.12, { type: "square", slide: 700, vol: 0.06 });
      }
    } else if (p.kind === "confirm") {
      once("sure", "Sure: yes", { tilt: -3 });
    }
  }

  // ---------- Autoplay videos ----------
  function updateVideo(dt) {
    if (!G.video) {
      for (var i = 0; i < G.items.length; i++) {
        var it = G.items[i];
        if (it.kind !== "video" || it.gone) continue;
        var ahead = it.y - G.scroll;
        if (ahead > 30 || ahead < -it.h) continue;
        it.gone = true;
        G.video = { kind: "loose", x: (it.x0 + it.x1) / 2, off: Math.max(0, ahead), t: 0, state: "rise", life: VIDEO_LIFE * run.mods.videoLife, lt: 0 };
        once("video", "Autoplay: on", { tilt: 3 });
        say(videoAnchor(), pick(SAY.chefVideo));
        break;
      }
    }
    var v = G.video;
    if (!v) return;
    v.t += dt;
    if (v.state === "leave" || v.state === "close") {
      v.lt += dt;
      if (v.lt > 0.5) G.video = null;
      return;
    }
    if (v.state === "rise") {
      v.off = Math.max(0, v.off - VIDEO_RISE * dt);
      if (!v.off) v.state = "dock";
    }
    v.x = clamp(v.x + clamp(hand.x - v.x, -VIDEO_CHASE * dt, VIDEO_CHASE * dt), VIDEO_W / 2, 100 - VIDEO_W / 2);
    if (v.t >= v.life) {
      v.state = "leave"; v.lt = 0;
      shell.callout("Video: still playing. Elsewhere", { tilt: -3 });
    }
  }

  function closeVideo() {
    var v = G.video;
    v.state = "close"; v.lt = 0;
    run.closed++;
    run.knows.video = true;
    once("videoClosed", "Video: closed");
    shell.sound.tone(900, 0.08, { slide: 400, vol: 0.08 });
    puff(videoX(v)[1] - 3, HY + 2);
    if (Math.random() < 0.6) say(videoAnchor(), pick(SAY.chefClosed));
  }

  // ---------- Adverts ----------
  function loadAdverts() {
    if (run.mods.adblock) return;
    for (var i = 0; i < G.items.length; i++) {
      var it = G.items[i];
      if (it.kind !== "advert" || it.loaded) continue;
      var go = it.behind ? G.scroll - (it.y + it.full) >= it.load : it.y - G.scroll <= it.load;
      if (!go) continue;
      var dh = it.full - it.h;
      it.loaded = true;
      it.h = it.full;
      it.pop = 0;
      shove(it.y + PG.PH, dh, it);
      shell.sound.tone(240, 0.09, { type: "square", slide: 620, vol: 0.07 });
      shell.sound.noise(0.07, { freq: 2600, vol: 0.08 });
      if (it.behind) {
        if (!shell.reduceMotion) shake = Math.max(shake, 0.7);
        shell.sound.tone(90, 0.25, { type: "sine", slide: 50, vol: 0.3 });
        once("shift", "Layout: shifted", { tilt: 3 });
        G.shifted = 0.6;
      }
    }
  }

  // Everything from y0 down moves down by dh
  function shove(y0, dh, except) {
    G.items.forEach(function (it) { if (it !== except && it.y >= y0 - 0.001) it.y += dh; });
    G.triggers.forEach(function (tr) { if (tr.at >= y0) tr.at += dh; });
    G.trail.forEach(function (p) { if (p && p[1] >= y0) p[1] += dh; });
    if (G.jump && G.jump.to >= y0) G.jump.to += dh;
    G.len += dh;
  }

  function insert(it) {
    var i = 0;
    while (i < G.items.length && G.items[i].y <= it.y) i++;
    G.items.splice(i, 0, it);
  }

  // ---------- Scrolling ----------
  function scrollPage(dt) {
    var x = hand.x;
    var row = G.jump ? null : storyAt(x, G.scroll);
    G.wade = !!row;
    var target;
    if (modal()) target = 0;
    else if (G.jump) target = JUMP_SPEED;
    else target = G.def.speed * run.mods.speed * (G.wade ? (run.mods.reader ? WADE_READER : WADE) : 1);
    // a scroll wheel has a little weight to it, but a wall stops it dead
    G.v += (target - G.v) * Math.min(1, dt * 12);
    if (!target) G.v = 0;
    var ds = G.v * dt;
    var hit = blocker(x, G.scroll, G.scroll + ds + 0.001);
    var was = G.blocked;
    if (hit) {
      ds = Math.max(0, hit.y - G.scroll);
      G.scroll += ds;
      G.blocked = hit.it;
      G.v = 0;
      if (was !== hit.it) impact(hit.it);
      if (G.jump) endJump(hit.it.kind === "advert");
    } else {
      G.blocked = null;
      G.scroll += ds;
    }
    G.blockT = G.blocked ? G.blockT + dt : 0;
    if (G.jump && G.scroll >= G.jump.to) endJump(false);

    // the life story: what you read, and what you skimmed
    var inStory = storyRowAt(G.scroll);
    if (G.wade) {
      G.read += ds;
      G.wadeT += dt;
      var last = G.trail[G.trail.length - 1];
      if (!last || Math.abs(last[0] - x) + Math.abs(last[1] - G.scroll) > 0.8) G.trail.push([x, G.scroll]);
    } else {
      G.wadeT = 0;
      if (G.trail.length && G.trail[G.trail.length - 1]) G.trail.push(null);
      if (inStory && !G.jump && ds > 0) {
        G.skimT += dt;
        if (G.skimT > 1.6) run.knows.gap = true;
      }
    }
    if (G.trail.length > 900) G.trail.splice(0, 300);
  }

  function storyRowAt(y) {
    for (var i = 0; i < G.items.length; i++) {
      var it = G.items[i];
      if (it.y > y) return null;
      if (it.kind === "story" && it.y + it.h > y) return it;
    }
    return null;
  }

  function impact(it) {
    hand.squash = 1;
    shell.sound.tone(110, 0.12, { type: "sine", slide: 55, vol: 0.32 });
    shell.sound.noise(0.05, { freq: 900, vol: 0.1 });
    if (!shell.reduceMotion) shake = Math.max(shake, 0.25);
    for (var i = 0; i < 4; i++) fx.push({ kind: "spark", x: hand.x, y: HY, a: Math.PI * (1.05 + i * 0.3), t: 0, life: 0.25 });
    if (it.kind === "banner") {
      if (Math.random() < 0.5) say(chefAnchor(it), pick(SAY.chef));
    } else if (it.kind === "advert") {
      once("advert", "Advert: unclosable", { tilt: -3 });
    }
  }

  // ---------- The end of a page ----------
  function courseDone() {
    G.over = true;
    G.endT = 0;
    var t = G.clock;
    run.times.push(t);
    run.read += G.read;
    run.total += G.storyTotal;
    shell.callout("Recipe: found", { tilt: -4 });
    [660, 880, 1320].forEach(function (f, i) { shell.sound.tone(f, 0.16, { delay: 0.1 + i * 0.09, vol: 0.1 }); });
    if (G.n >= 2) { end(); return; }

    var rank = rankOf(t / G.def.par);
    var offer = offers();
    var stamp = N.ladder(rank + 1, 4);
    var skipped = G.storyTotal ? 1 - G.read / G.storyTotal : 1;
    shell.interlude({
      stamp: stamp,
      tilt: rank % 2 ? 4 : -4,
      heading: G.def.food + " found.",
      line: CLEARED[rank][G.n],
      stats: [
        { label: "Page", value: N.fmtTime(t * 1000) },
        { label: "Life story skipped", value: pct(skipped) },
        { label: "So far", value: N.fmtTime(run.time * 1000) }
      ],
      ask: G.n === 0 ? "Before the main course:" : "Before pudding:",
      choices: offer.map(function (k) { return { label: CHOICES[k].label, detail: CHOICES[k].detail }; }),
      delay: 1500
    }).then(function (i) {
      var k = offer[i] || offer[0];
      run.picked.push(k);
      CHOICES[k].apply(run.mods);
      startCourse(G.n + 1);
      shell.next();
    });
  }

  // Three settings to choose from, the same for everyone in today's run
  function offers() {
    var pool = OFFERS[G.n].filter(function (k) { return run.picked.indexOf(k) < 0; });
    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(shell.random() * (i + 1)), t = pool[i];
      pool[i] = pool[j]; pool[j] = t;
    }
    return pool.slice(0, 3);
  }

  function rankOf(ratio) {
    var r = 0;
    while (r < LADDER.length && ratio > LADDER[r]) r++;
    return r;
  }

  function expire() {
    G.over = true;
    G.endT = 0;
    run.expired = true;
    run.read += G.read;
    run.total += G.storyTotal;
    shell.callout("Session expired", { tilt: 5 });
    shell.sound.tone(300, 0.6, { type: "sawtooth", slide: 70, vol: 0.1 });
    end();
  }

  function end() {
    var par = COURSES[0].par + COURSES[1].par + COURSES[2].par;
    var skipped = run.total ? 1 - run.read / run.total : 1;
    var total = run.time;
    var rank = run.expired ? 3 : rankOf(total / par);
    var rec = run.expired ? shell.record(0, { lower: true }) : shell.record(Math.round(total * 1000), { lower: true });
    var stats = [
      { label: "Time", value: run.expired ? "Expired" : N.fmtTime(total * 1000) },
      { label: "Life story skipped", value: pct(skipped) },
      { label: "Cookies accepted", value: String(run.accepted) }
    ];
    stats.push({
      label: rec.isNew ? (shell.daily ? "New best today" : "New best") : (shell.daily ? "Best today" : "Best"),
      value: rec.best ? N.fmtTime(rec.best) : "None yet", highlight: rec.isNew
    });
    if (shell.daily) stats.unshift({ label: "Run", value: shell.today });
    var where = G.def.name.toLowerCase();
    shell.finish({
      place: rank + 1,
      total: 4,
      heading: run.expired ? "Session expired at the " + where + "." : "You reached the pudding in " + N.fmtTime(total * 1000) + ".",
      line: run.expired ? "Please log in to keep reading about the author's nan." : RANKS[rank].line,
      stats: stats,
      share: (run.expired ? "session expired at the " + where : N.fmtTime(total * 1000) + " to the pudding") +
             ", " + pct(skipped) + " of the life story skipped",
      delay: 1700
    });
  }

  // After the recipe: the page settles with the recipe card in the middle
  function ending(dt) {
    if (!G.over) return;
    G.endT += dt;
    if (!run.expired) {
      var to = G.recipe.y + 22 - (VH * 0.5 - HY);
      G.scroll += (Math.max(G.scroll, to) - G.scroll) * Math.min(1, dt * 3);
      if (G.endT > 0.7 && G.endT - dt <= 0.7) hand.press = 1;
    }
  }

  // ---------------------------------------------------------------------------
  // The autopilot, for ?autopilot and ?clip. It sees what a player sees and
  // does what a careful player would: reject cookies, dodge the cat, keep to
  // the white space, close what can be closed and go round what can't.
  // ---------------------------------------------------------------------------
  // ?debug&sloppy plays like a person: it decides a third of a second late,
  // steers roughly and fumbles a click now and then (for tuning the ladder).
  var SLOPPY = DEBUG && params.has("sloppy"), late = null, lateT = 0;
  function autopilot(dt) {
    if (!SLOPPY) return pilot(dt);
    lateT -= dt;
    var now = pilot(dt);
    if (lateT <= 0 || !late) {
      lateT = 0.28 + Math.random() * 0.17;
      late = { x: now.x + (Math.random() - 0.5) * 7, act: false };
    }
    if (now.act && Math.random() < 0.75) late.act = true;
    var out = { x: late.x, act: late.act };
    late.act = false;
    return out;
  }

  function pilot(dt) {
    autoCd -= dt;
    var x = hand.x, y = G.scroll, out = { x: x, act: false };
    function tap(lo, hi) {
      out.x = (lo + hi) / 2;
      out.click = [lo, hi];
      if (x >= lo + 0.6 && x <= hi - 0.6 && autoCd <= 0) { out.act = true; autoCd = 0.3; }
    }
    if (G.tab) return out;
    var p = openPopup();
    if (p) { var s = closeSpan(p); tap(s[0], s[1]); return out; }

    var speed = Math.max(G.v, G.def.speed);
    var b = bannerNear(y, 60);
    if (b) {
      if (b.state === "wait") return out;
      var btn = null;
      b.buttons.forEach(function (k) { if (k.type === "reject") btn = k; });
      if (!btn) b.buttons.forEach(function (k) { if (k.type === "manage") btn = k; });
      if (!btn) btn = b.buttons[0];
      out.x = (btn.x0 + btn.x1) / 2;
      if (b.y + b.row - y <= EARLY - 1) tap(btn.x0, btn.x1);
      return out;
    }

    // keep out of the way of a pop-up that's coming
    var warn = null;
    G.popups.forEach(function (q) { if (q.state === "warn" || q.state === "fly") warn = q; });

    var v = G.video;
    if (v && v.state === "dock" && v.t >= VIDEO_X && Math.abs(v.x - x) < VIDEO_W) {
      var vs = videoX(v);
      tap(vs[0], vs[1]);
      return out;
    }

    // where's free, a little way ahead: not inside an advert, ideally in the white space
    var look = y + Math.min(46, speed * 1.2);
    var bad = [];
    G.items.forEach(function (it) {
      if (it.kind !== "advert" || it.y > look + 30 || it.y + Math.max(it.h, it.full) < y - 0.5) return;
      if (it.behind || run.mods.adblock) return;
      if (it.loaded || it.y - y < it.load + 14) bad.push([it.x0 - TIP - 1.5, it.x1 + TIP + 1.5]);
    });
    if (v && v.state !== "leave" && v.state !== "close") bad.push([v.x - VIDEO_W / 2 - 6, v.x + VIDEO_W / 2 + 6]);
    if (warn) bad.push([warn.cx - warn.w / 2 - 3, warn.cx + warn.w / 2 + 3]);

    var want = x;
    // a real Jump to recipe, coming up: worth it
    var jump = null;
    G.items.forEach(function (it) {
      if (!jump && it.kind === "jump" && !it.fake && !it.used && it.y + it.h > y - 2 && it.y < y + 34) jump = it;
    });
    if (jump) {
      want = (jump.x0 + jump.x1) / 2;
      if (y >= jump.y - 4 && y <= jump.y + jump.h + 2) tap(jump.x0 + 2, jump.x1 - 2);
    } else {
      // the white space in the next paragraph that's coming up
      var row = null;
      for (var i = 0; i < G.items.length; i++) {
        var it = G.items[i];
        if (it.kind === "story" && it.y + it.h > y + 2 && it.y < look) { row = it; if (it.y + it.h > y + speed * 0.45) break; }
      }
      if (row) want = row.gx;
    }
    // nudge out of anything bad
    for (var tries = 0; tries < 3; tries++) {
      var hitBad = null;
      bad.forEach(function (r) { if (want > r[0] && want < r[1]) hitBad = r; });
      if (!hitBad) break;
      var left = hitBad[0], right = hitBad[1];
      want = (left > 3 && (Math.abs(want - left) < Math.abs(want - right) || right > 97)) ? left : right;
    }
    out.x = clamp(want, TIP, 100 - TIP);
    return out;
  }

  // ---------------------------------------------------------------------------
  // Hints: the bobbing arrow, pointing at the one thing to deal with now,
  // until you've shown you know.
  // ---------------------------------------------------------------------------
  function pickHint() {
    hint = null;
    var p = openPopup();
    if (p) {
      if (!run.knows.close) { var s = closeSpan(p); hint = { x: (s[0] + s[1]) / 2, y: HY - 3, word: p.kind === "confirm" ? "Yes" : "Close" }; }
      return;
    }
    var b = G.blocked && G.blocked.kind === "banner" ? G.blocked : null;
    if (b && !run.knows.reject && b.state === "up") {
      var r = null, m = null;
      b.buttons.forEach(function (k) { if (k.type === "reject") r = k; if (k.type === "manage") m = k; });
      var t = r || m;
      if (t) hint = { x: (t.x0 + t.x1) / 2, y: HY - 1, word: r ? "Reject all" : "Manage" };
      return;
    }
    var v = G.video;
    if (v && v.state === "dock" && v.t >= VIDEO_X && !run.knows.video) {
      var vs = videoX(v);
      hint = { x: (vs[0] + vs[1]) / 2, y: HY - 1, word: "Close" };
      return;
    }
    if (!run.knows.jump) {
      for (var i = 0; i < G.items.length; i++) {
        var it = G.items[i];
        if (it.kind === "jump" && !it.fake && !it.used && it.y > G.scroll - 2 && it.y < G.scroll + 40) {
          hint = { x: (it.x0 + it.x1) / 2, y: HY + it.y - G.scroll - 1, word: "Jump" };
          return;
        }
      }
    }
    if (G.n === 0 && !run.knows.gap && G.wadeT > 0.7) {
      var row = storyRowAt(G.scroll + 6) || storyRowAt(G.scroll);
      if (row) hint = { x: row.gx, y: HY + row.y - G.scroll + 2, word: "White space" };
    }
  }

  // ---------------------------------------------------------------------------
  // Speech bubbles. Anchors are where the speaker's head is, in page x and
  // screen y (units), worked out fresh every frame as the page moves.
  // ---------------------------------------------------------------------------
  function say(anchor, text) {
    if (!text || !anchor) return;
    bubbles = bubbles.filter(function (b) { return b.key !== anchor.key; });
    if (bubbles.length >= 2) bubbles.shift();
    bubbles.push({ at: anchor.at, key: anchor.key, text: text, t: 0, life: 2.2 + text.length * 0.03 });
  }
  function catAnchor(p) {
    return { key: "cat", at: function () {
      if (p.state === "warn") return { x: p.side > 0 ? 95 : 5, y: HY + 6 };
      return { x: catX(p), y: HY - POP_TOP - 8 };
    } };
  }
  function catX(p) { return p.cx - p.w / 2 + 9; }
  function chefAnchor(b) { return { key: "chef", at: function () { return { x: 88, y: HY + b.y - G.scroll - 9 }; } }; }
  function chefAt(x, y) { return { key: "chef", at: function () { return { x: x, y: y }; } }; }
  function videoAnchor() {
    return { key: "chef", at: function () { var v = G.video; return v ? { x: v.x - 6, y: HY + v.off + 3 } : null; } };
  }

  // The family, as you skip their photos
  function chatter(dt) {
    talkWait -= dt;
    if (talkWait > 0) return;
    for (var i = 0; i < G.items.length; i++) {
      var it = G.items[i];
      if (it.kind !== "story" || it.said || it.y > G.scroll) continue;
      if (it.y + it.h * 0.5 > G.scroll) continue;
      it.said = true;
      var ph = null;
      it.blocks.forEach(function (b) { if (b.type === "photo") ph = b; });
      if (!ph || !SAY[ph.who] || !SAY[ph.who].length) continue;
      if (Math.random() < 0.35) continue;
      (function (row, b) {
        say({ key: "photo", at: function () { return { x: (b.x0 + b.x1) / 2, y: HY + row.y - G.scroll + 9 }; } }, pick(SAY[b.who]));
      })(it, ph);
      talkWait = 3;
      break;
    }
  }

  // ---------------------------------------------------------------------------
  // Sound that carries on: mumbling while you read, and the autoplay jingle
  // ---------------------------------------------------------------------------
  var JINGLE = [523, 659, 784, 659, 587, 698, 880, 698];
  function noises(dt) {
    mumble -= dt;
    if (G.wade && G.v > 1 && mumble <= 0) {
      mumble = 0.13 + Math.random() * 0.08;
      shell.sound.tone(150 + Math.random() * 90, 0.07, { type: "square", vol: 0.022 });
    }
    var v = G.video;
    if (v && (v.state === "rise" || v.state === "dock")) {
      jingle -= dt;
      if (jingle <= 0) {
        jingle = 0.19;
        v.note = ((v.note || 0) + 1) % JINGLE.length;
        shell.sound.tone(JINGLE[v.note], 0.12, { type: "square", vol: 0.025 });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------
  function puff(x, y) {
    for (var i = 0; i < 6; i++) {
      var a = Math.random() * Math.PI * 2;
      fx.push({ kind: "puff", x: x, y: y, vx: Math.cos(a) * 14, vy: Math.sin(a) * 10 - 4, r: 1.4 + Math.random() * 1.6, t: 0, life: 0.45 });
    }
  }

  function tickFx(dt) {
    fx.forEach(function (e) {
      e.t += dt;
      if (e.kind === "puff") { e.x += e.vx * dt; e.y += e.vy * dt; e.vx *= 0.9; e.vy *= 0.9; }
    });
    fx = fx.filter(function (e) { return e.t < e.life; });
    bubbles.forEach(function (b) { b.t += dt; });
    bubbles = bubbles.filter(function (b) { return b.t < b.life; });
    shake = Math.max(0, shake - dt * 3);
    if (G && G.shifted) G.shifted = Math.max(0, G.shifted - dt);
    G && G.items.forEach(function (it) { if (it.kind === "advert" && it.pop < 1) it.pop = Math.min(1, it.pop + dt * 6); });
  }

  // ---------------------------------------------------------------------------
  // The notice for each course, up with the countdown so it's read before Go
  // ---------------------------------------------------------------------------
  function how() {
    var m = shell.input.mode;
    return m === "touch" ? "tap Click" : m === "mouse" ? "click" : m === "pad" ? "press A" : "press Space";
  }
  function notice() {
    var texts = [
      "Steer onto the tiny Reject all and " + how() + ". Accept all costs you adverts. The words slow you down: keep to the white space.",
      "Pop-ups land where you are: move, or close the little X. Adverts jump open late and can't be closed. Go round.",
      "Videos follow you: keep away until the X turns up. Some Jump buttons are adverts. One banner hides Reject all under Manage."
    ];
    shell.brief({ title: ["Course one: starter", "Course two: main", "Course three: pudding"][G.n], text: texts[G.n], ms: 5200 });
  }

  // ---------------------------------------------------------------------------
  // HUD: the course top left, the clock and the story skipped top right
  // ---------------------------------------------------------------------------
  function buildHud() {
    shell.hud.innerHTML =
      '<div class="kit-hud-tl">' +
        '<p class="kit-stat"><span data-course>Starter</span> <small data-of>1/3</small></p>' +
        '<p class="kit-stat" data-minor><small>Page</small><span data-page>0%</span></p>' +
      '</div>' +
      '<div class="kit-hud-tr">' +
        '<p class="kit-stat kit-stat-big" data-time>0:00</p>' +
        '<p class="kit-stat" data-minor><small>Skipped</small><span data-skip>100%</span></p>' +
      '</div>';
    hudEls = {
      course: shell.hud.querySelector("[data-course]"),
      of: shell.hud.querySelector("[data-of]"),
      page: shell.hud.querySelector("[data-page]"),
      time: shell.hud.querySelector("[data-time]"),
      skip: shell.hud.querySelector("[data-skip]")
    };
  }
  function setText(node, text) { if (node.textContent !== text) node.textContent = text; }
  function paintHud() {
    if (!hudEls || !G) return;
    var s = Math.floor(run.time);
    setText(hudEls.course, G.def.name);
    setText(hudEls.of, (G.n + 1) + "/3");
    setText(hudEls.page, pct(clamp((G.scroll - START) / (G.recipe.y - START), 0, 1)));
    setText(hudEls.time, Math.floor(s / 60) + ":" + (s % 60 < 10 ? "0" : "") + (s % 60));
    var read = run.read + G.read, total = run.total + passedStory();
    setText(hudEls.skip, pct(total ? 1 - read / total : 1));
  }
  // how much life story is above the fingertip so far this page
  function passedStory() {
    var n = 0;
    for (var i = 0; i < G.items.length; i++) {
      var it = G.items[i];
      if (it.y > G.scroll) break;
      if (it.kind === "story") n += Math.min(it.h, G.scroll - it.y);
    }
    return n;
  }

  // ---------------------------------------------------------------------------
  // Drawing. The page is black (dark mode, naturally), the words are white
  // bars, and everything trying to sell you something is a paper card with
  // an ink outline and a rust halftone shadow. Four inks (DESIGN.md, 7).
  // ---------------------------------------------------------------------------
  function resize(w, h, dpr) {
    W = w; H = h; DPR = dpr;
    U = Math.min(W / VIEW_W, H / VIEW_H);
    VW = W / U; VH = H / U;
    OX = (W - 100 * U) / 2;
    MARGIN = (VW - 100) / 2;
    HY = clamp(VH * 0.4, 44, 64);
    ctx = (shell ? shell.canvas : root.querySelector("canvas")).getContext("2d");
    if (T) CA.init(T, U * DPR);
    boxes = null;
  }

  // Page space: x across the column, y down the page. Screen space: x across
  // the column, y down the screen.
  function pageSpace(c, sx, sy) { c.setTransform(DPR * U, 0, 0, DPR * U, DPR * (OX + sx), DPR * (U * (HY - G.scroll) + sy)); }
  function screenSpace(c, sx, sy) { c.setTransform(DPR * U, 0, 0, DPR * U, DPR * (OX + sx), DPR * sy); }

  // Text never smaller than 12px
  // Text is set at its real size in pixels, never under 12, and drawn
  // unscaled: a tiny canvas font blown up spaces its letters badly.
  // font() returns the size it set, in units.
  function font(c, size, face, weight) {
    var px = Math.max(12, size * U);
    c.font = (weight ? weight + " " : "") + px.toFixed(2) + "px " + (face || T.display);
    return px / U;
  }
  function textW(c, t) { return c.measureText(t).width / U; }
  function text(c, t, x, y, maxW, stroke) {
    c.save();
    c.translate(x, y);
    c.scale(1 / U, 1 / U);
    if (stroke) c.strokeText(t, 0, 0);
    else if (maxW) c.fillText(t, 0, 0, maxW * U);
    else c.fillText(t, 0, 0);
    c.restore();
  }
  function wrap(c, str, maxW) {
    var words = str.split(" "), lines = [""];
    words.forEach(function (w) {
      var tryLine = lines[lines.length - 1] ? lines[lines.length - 1] + " " + w : w;
      if (textW(c, tryLine) > maxW && lines[lines.length - 1]) lines.push(w);
      else lines[lines.length - 1] = tryLine;
    });
    return lines;
  }
  // Display text, upper case, shrunk to fit a width but never below 12px
  function fitText(c, str, x, y, maxW, size, align, colour) {
    var s = font(c, size);
    var t = str.toUpperCase();
    var w = textW(c, t);
    if (w > maxW) { s = Math.max(12 / U, s * maxW / w); font(c, s); }
    c.textAlign = align || "left";
    c.fillStyle = colour || T.ink;
    text(c, t, x, y);
    return s;
  }

  function card(c, x, y, w, h, opts) {
    opts = opts || {};
    // the shadow: rust halftone, offset down and right
    c.fillStyle = CA.dots(c, T.accent, true);
    c.fillRect(x + 1.6, y + 1.6, w, h);
    CA.rrect(c, x, y, w, h, opts.r != null ? opts.r : 1.2);
    c.fillStyle = opts.fill || T.paper;
    c.fill();
    CA.ink(c, opts.line || 0.55, opts.edge || T.ink);
    c.stroke();
  }

  function render() {
    if (!ctx || !G || !run) return;
    if (!noticed && (shell.state() === "countdown" || shell.state() === "playing")) { noticed = true; notice(); }
    if (!hudEls) { buildHud(); paintHud(); }
    if (!T) return;
    var c = ctx;
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    c.fillStyle = T.ink;
    c.fillRect(0, 0, W, H);
    var sx = 0, sy = 0;
    if (shake > 0 && !shell.reduceMotion) { sx = (Math.random() - 0.5) * 7 * shake; sy = (Math.random() - 0.5) * 7 * shake; }

    pageSpace(c, sx, sy);
    var top = G.scroll - HY - 6, bottom = G.scroll - HY + VH + 6;
    drawMargins(c, top, bottom);
    drawTrail(c, top, bottom);
    for (var i = 0; i < G.items.length; i++) {
      var it = G.items[i];
      if (it.y > bottom) break;
      if (it.y + Math.max(it.h, it.full || 0) < top || it.dead) continue;
      drawItem(c, it);
    }

    screenSpace(c, sx, sy);
    drawSideAds(c);
    drawVideo(c);
    drawPopups(c);
    drawHover(c);
    if (!G.tab) drawHand(c);
    drawFx(c);
    drawScrollbar(c);
    drawTab(c);

    // speech bubbles and the arrow, in CSS pixels
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (++boxAge > 60) { boxes = null; boxAge = 0; }
    var placed = [];
    // no arrow once you're already on the thing it points at
    if (hint && G.hover && Math.abs(hint.x - hand.x) < 6) hint = null;
    if (hint && shell.state() === "playing") {
      var ax = clamp(hint.x, 14, 86);
      placed.push({ x: OX + (ax - 14) * U, y: (hint.y - 24) * U, w: 28 * U, h: 24 * U });
    }
    bubbles.forEach(function (b) { drawBubble(c, b, placed); });
    if (hint && shell.state() === "playing") {
      screenSpace(c, 0, 0);
      drawArrow(c, clamp(hint.x, 10, 90), hint.y, hint.word);
    }
  }

  // ---------- the desk round the page ----------
  function drawMargins(c, top, bottom) {
    if (MARGIN > 0.5) {
      c.fillStyle = CA.dots(c, T.ash, true);
      c.fillRect(-MARGIN - 2, top, MARGIN + 2, bottom - top);
      c.fillRect(100, top, MARGIN + 2, bottom - top);
    }
    c.fillStyle = T.ash;
    c.fillRect(-0.6, top, 0.6, bottom - top);
    c.fillRect(100, top, 0.6, bottom - top);
  }

  // Sticky sidebar adverts, where there's room: they stay put below the HUD
  // and swap themselves for a new one every so often, with a little jump.
  var SIDE_ADS = [["onion", "This onion will make you cry"], ["kettle", "Kettles hate this trick"], ["fridge", "Win a fridge. Probably."],
                  ["spoon", "A spoon. Wow."], ["pan", "Pans near you"]];
  function drawSideAds(c) {
    if (MARGIN < 15) return;
    var w = Math.min(MARGIN - 4, 26), h = 46, y = clamp(VH * 0.44, 30, VH - h - 4);
    [0, 1].forEach(function (side) {
      var at = G.scroll + side * 90;
      var k = Math.floor(at / 180) * 2 + side + 1, since = (at % 180) / 180;
      var x = side ? 100 + (MARGIN - w) / 2 : -MARGIN + (MARGIN - w) / 2;
      c.save();
      if (since < 0.06 && !shell.reduceMotion) {
        var q = 0.85 + 0.15 * ease(since / 0.06);
        c.translate(x + w / 2, y + h / 2);
        c.scale(q, q);
        c.translate(-(x + w / 2), -(y + h / 2));
      }
      sideAd(c, x, y, w, h, k);
      c.restore();
    });
  }

  function sideAd(c, x, y, w, h, k) {
    var ad = SIDE_ADS[(k * 7 + G.n * 3) % SIDE_ADS.length];
    var head = run.accepted && k % 2 ? "Still thinking about soup" : ad[1];
    card(c, x, y, w, h);
    c.save();
    c.beginPath();
    c.rect(x, y, w, h);
    c.clip();
    c.fillStyle = CA.dots(c, T.accent, true);
    c.fillRect(x, y + h * 0.5, w, h * 0.5);
    CA.product(c, ad[0], x + w / 2, y + h * 0.72, Math.min(w * 0.3, 8));
    var s = font(c, 3.4);
    c.fillStyle = T.ink;
    c.textAlign = "center";
    c.textBaseline = "top";
    wrap(c, head.toUpperCase(), w - 3).slice(0, 3).forEach(function (l, i) { text(c, l, x + w / 2, y + 2.4 + i * s * 1.02); });
    c.restore();
  }

  // ---------- what you read: a highlighter trail through the words ----------
  function drawTrail(c, top, bottom) {
    if (G.trail.length < 2) return;
    c.beginPath();
    var on = false;
    for (var i = 0; i < G.trail.length; i++) {
      var p = G.trail[i];
      if (!p || p[1] < top - 10 || p[1] > bottom + 10) { on = false; continue; }
      if (on) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]);
      on = true;
    }
    CA.ink(c, 3.2, T.accent);
    c.stroke();
  }

  function drawItem(c, it) {
    if (it.kind === "story") drawStory(c, it);
    else if (it.kind === "banner") drawBanner(c, it);
    else if (it.kind === "advert") drawAdvert(c, it);
    else if (it.kind === "jump") drawJump(c, it);
    else if (it.kind === "video" && !it.gone) drawVideoBox(c, (it.x0 + it.x1) / 2, it.y, 0, false);
    else if (it.kind === "head") drawHead(c, it);
    else if (it.kind === "recipe") drawRecipe(c, it);
  }

  // ---------- the top of the page ----------
  function drawHead(c, it) {
    var def = it.def;
    c.textBaseline = "alphabetic";
    fitText(c, "A recipe site", 2, 8, 40, 5.2, "left", T.paper);
    fitText(c, "Recipes  My story  Shop", 98, 7.6, 52, 3, "right", T.paper);
    c.fillStyle = T.accent;
    c.fillRect(0, 11, 100, 0.9);
    // the title, with the accent bar the house puts over every title
    var s = font(c, 8.6);
    var lines = wrap(c, def.dish.toUpperCase(), 94);
    c.fillStyle = T.paper;
    c.textAlign = "left";
    lines.slice(0, 2).forEach(function (l, i) { text(c, l, 3, 24 + i * s * 0.92); });
    var y = 24 + (Math.min(2, lines.length) - 1) * s * 0.92;
    font(c, 3.4, T.body, "600");
    c.fillStyle = T.paper;
    text(c, def.sub, 3, y + 6.2);
    // a rating, from two people, one of whom is the author
    for (var k = 0; k < 5; k++) star(c, 5 + k * 5, y + 11.5, 1.9, k < 4 ? T.red : null);
    font(c, 3, T.body, "600");
    text(c, "From 2 ratings", 30, y + 12.6);
    // the photo of the dish
    var py = y + 17, ph = 104 - py - 2;
    card(c, 14, py, 72, ph, { r: 1.5 });
    c.save();
    CA.rrect(c, 14, py, 72, ph, 1.5);
    c.clip();
    c.fillStyle = T.accent;
    c.fillRect(14, py, 72, ph);
    c.fillStyle = CA.dots(c, T.ink, true);
    c.fillRect(14, py + ph * 0.62, 72, ph * 0.38);
    CA.dish(c, def.art, 50, py + ph * 0.58, Math.min(16, ph * 0.36));
    c.restore();
  }

  function star(c, x, y, r, fill) {
    c.beginPath();
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r;
      if (i) c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); else c.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    c.closePath();
    if (fill) { c.fillStyle = fill; c.fill(); }
    CA.ink(c, 0.4, T.paper);
    c.stroke();
  }

  // ---------- the life story ----------
  function drawStory(c, row) {
    row.blocks.forEach(function (b) {
      if (b.type === "text") drawText(c, row, b);
      else if (b.type === "quote") drawQuote(c, row, b);
      else drawPhoto(c, row, b);
    });
  }

  function bars(row, b) {
    if (b.bars) return b.bars;
    var r = N.seeded(b.seed * 7919 + G.n * 104729 + Math.round(b.x0 * 13));
    var out = [];
    var lines = Math.max(1, Math.floor((row.h - 2.6) / 3.3) + 1);
    for (var l = 0; l < lines; l++) {
      var ly = 1.6 + l * 3.3;
      if (ly + 1.3 > row.h - 0.6) break;
      var x = b.x0 + 1, end = b.x1 - 1 - (l === lines - 1 ? r() * (b.x1 - b.x0) * 0.4 : r() * 3);
      while (x < end - 1.5) {
        var w = Math.min(1.8 + r() * 6.5, end - x);
        out.push([x, ly, w]);
        x += w + 1.3;
      }
    }
    b.bars = out;
    return out;
  }

  function drawText(c, row, b) {
    c.fillStyle = T.paper;
    bars(row, b).forEach(function (w) { c.fillRect(w[0], row.y + w[1], w[2], 1.25); });
  }

  function drawQuote(c, row, b) {
    var x0 = b.x0 + 1.5, w = b.x1 - b.x0 - 3;
    c.fillStyle = T.accent;
    c.fillRect(x0, row.y + 1.4, 1, row.h - 2.8);
    var s = font(c, 4.6);
    var lines = wrap(c, b.text.toUpperCase(), w - 4);
    if (lines.length > 2) {
      s = font(c, 4.6 * 0.8);
      lines = wrap(c, b.text.toUpperCase(), w - 4);
    }
    c.fillStyle = T.paper;
    c.textAlign = "left";
    c.textBaseline = "top";
    var y = row.y + (row.h - lines.length * s * 1.0) / 2 + 0.3;
    lines.slice(0, 3).forEach(function (l, i) { text(c, l, x0 + 3, y + i * s); });
    c.textBaseline = "alphabetic";
  }

  function drawPhoto(c, row, b) {
    var x = b.x0, y = row.y + 1, w = b.x1 - b.x0, h = row.h - 2;
    var tilt = (b.x0 < 50 ? -1 : 1) * 0.03;
    c.save();
    c.translate(x + w / 2, y + h / 2);
    c.rotate(tilt);
    c.translate(-(x + w / 2), -(y + h / 2));
    card(c, x, y, w, h, { r: 0.6 });
    // the caption, at least 12px, on two lines if it must
    var s = font(c, 3, T.body, "700");
    var lines = wrap(c, b.cap, w - 3).slice(0, 2);
    var capH = lines.length * s * 1.08 + 1.4;
    var px = x + 1.6, py = y + 1.6, pw = w - 3.2, phh = h - 3.2 - capH;
    var look = [clamp((hand.x - (x + w / 2)) / 30, -1, 1), clamp((HY - (HY + y - G.scroll)) / 40, -1, 1)];
    CA.photo(c, b.who, px, py, pw, phh, look);
    CA.ink(c, 0.4);
    c.strokeRect(px, py, pw, phh);
    font(c, 3, T.body, "700");
    c.fillStyle = T.ink;
    c.textAlign = "center";
    c.textBaseline = "top";
    lines.forEach(function (l, i) { text(c, l, x + w / 2, py + phh + 0.9 + i * s * 1.08); });
    c.textBaseline = "alphabetic";
    c.restore();
  }

  // ---------- cookie banners ----------
  function drawBanner(c, b) {
    var fold = b.state === "gone" ? ease(b.t / 0.28) : 0;
    var y = b.y, h = b.h, line = y + b.row;
    c.save();
    if (fold) {
      if (shell.reduceMotion) c.globalAlpha = 1 - fold;
      else {
        c.translate(0, line);
        c.scale(1, 1 - fold);
        c.translate(0, -line);
      }
    }
    // the chef, peeking over the top of a banner stretched across the whole page
    if (!fold) CA.chef(c, 88, y - 2.6, 4.6, { look: [clamp((hand.x - 88) / 30, -1, 1), 0.6] });
    card(c, -1.5, y, 103, h, { r: 0.8 });
    if (!fold) {
      CA.blob(c, 84.4, y + 0.4, 1.4, 1.3, T.paper, 0.4);
      CA.blob(c, 91.6, y + 0.4, 1.4, 1.3, T.paper, 0.4);
    }
    c.textBaseline = "alphabetic";
    fitText(c, b.title, 2, y + 7.4, 76, 4.4, "left", T.ink);
    font(c, 2.8, T.body, "600");
    c.fillStyle = T.ink;
    c.textAlign = "left";
    var lineW = textW(c, b.line);
    if (lineW <= 96) text(c, b.line, 2, y + 11.6);
    else greek(c, 2, y + 10, 76, 1);
    // the buttons
    if (b.state === "wait") {
      fitText(c, "Loading your preferences", 50, line + 6, 90, 3.6, "center", T.ink);
      for (var k = 0; k < 3; k++) {
        var on = Math.floor(clock * 4) % 3 === k;
        CA.blob(c, 40 + k * 4 - 4, line + 8.6, 0.9, 0.9, on ? T.accent : T.ink);
      }
    } else {
      b.buttons.forEach(function (btn) { drawButton(c, btn, line, b.rowH); });
    }
    // the small print, which nobody reads
    greek(c, 2, line + b.rowH + 3.2, 96, 2);
    c.restore();
  }

  function greek(c, x, y, w, lines) {
    c.fillStyle = T.ink;
    for (var l = 0; l < lines; l++) {
      var xx = x, end = x + w - (l === lines - 1 ? w * 0.3 : 0), k = l * 5 + 1;
      while (xx < end - 1) {
        var ww = Math.min(1.5 + ((k * 37) % 50) / 10, end - xx);
        c.fillRect(xx, y + l * 2.6, ww, 0.9);
        xx += ww + 1;
        k++;
      }
    }
  }

  var LABELS = { accept: "Accept all", manage: "Manage", reject: "Reject all", confirm: "Confirm choices" };
  function drawButton(c, btn, y, h) {
    var w = btn.x1 - btn.x0, mid = (btn.x0 + btn.x1) / 2;
    c.textBaseline = "middle";
    if (btn.type === "accept") {
      // the one they want you to press: huge, and in a lovely colour
      CA.rrect(c, btn.x0, y - 1.6, w, h + 3.2, 1.6);
      c.fillStyle = T.accent;
      c.fill();
      CA.ink(c, 0.6);
      c.stroke();
      fitText(c, LABELS.accept, mid, y + h / 2 + 0.3, w - 3, 5.6, "center", T.ink);
    } else if (btn.type === "reject") {
      // the one they don't: small, plain, underlined, and trying not to be found
      var s = fitText(c, LABELS.reject, mid, y + h / 2 + 0.2, w, 2.6, "center", T.ink);
      var tw = Math.min(w, textW(c, LABELS.reject.toUpperCase()));
      c.fillRect(mid - tw / 2, y + h / 2 + s * 0.5, tw, 0.35);
    } else {
      CA.rrect(c, btn.x0, y + 0.8, w, h - 1.6, 1);
      c.fillStyle = T.paper;
      c.fill();
      CA.ink(c, 0.45);
      c.stroke();
      fitText(c, LABELS[btn.type], mid, y + h / 2 + 0.2, w - 2, 3, "center", T.ink);
    }
    c.textBaseline = "alphabetic";
  }

  // ---------- adverts ----------
  function drawAdvert(c, a) {
    var w = a.x1 - a.x0;
    if (!a.loaded) {
      // not loaded yet: a thin dashed strip, and three dots that mean trouble
      c.setLineDash([1.2, 1]);
      CA.ink(c, 0.4, T.smoke);
      c.strokeRect(a.x0 + 0.5, a.y + 0.5, w - 1, a.h - 1);
      c.setLineDash([]);
      c.textBaseline = "middle";
      var s = fitText(c, run.mods.adblock ? "Advert blocked" : "Advertisement", a.x0 + 2.5, a.y + a.h / 2 + 0.2, w * 0.6, 2.6, "left", T.smoke);
      if (!run.mods.adblock) {
        var tw = textW(c, (run.mods.adblock ? "Advert blocked" : "Advertisement").toUpperCase());
        for (var k = 0; k < 3; k++) {
          var on = Math.floor(clock * 5) % 3 === k;
          CA.blob(c, a.x0 + 5 + tw + k * 2.4, a.y + a.h / 2, 0.6, 0.6, on ? T.accent : T.smoke);
        }
      }
      c.textBaseline = "alphabetic";
      return s;
    }
    var pop = shell.reduceMotion ? 1 : a.pop;
    c.save();
    if (pop < 1) {
      var k2 = 0.82 + 0.18 * ease(pop) + Math.sin(pop * Math.PI) * 0.06;
      c.translate((a.x0 + a.x1) / 2, a.y);
      c.scale(k2, k2);
      c.translate(-(a.x0 + a.x1) / 2, -a.y);
    }
    card(c, a.x0 + 0.3, a.y, w - 0.6, a.h, { r: 0.8 });
    c.save();
    CA.rrect(c, a.x0 + 0.3, a.y, w - 0.6, a.h, 0.8);
    c.clip();
    var artLeft = a.x0 > 0;
    var ax = artLeft ? a.x0 + 0.3 : a.x1 - 0.3 - Math.min(26, w * 0.4);
    var aw = Math.min(26, w * 0.4);
    c.fillStyle = T.accent;
    c.fillRect(ax, a.y, aw, a.h);
    c.fillStyle = CA.dots(c, T.ink, true);
    c.fillRect(ax, a.y + a.h * 0.6, aw, a.h * 0.4);
    CA.product(c, a.art, ax + aw / 2, a.y + a.h * 0.55, Math.min(aw * 0.32, a.h * 0.32));
    // the headline, and a red button
    var tx = artLeft ? ax + aw + 2.5 : a.x0 + 3, tw = w - aw - 5.5;
    var s = font(c, 4.4);
    var lines = wrap(c, a.head.toUpperCase(), tw);
    if (lines.length > 2) { s = font(c, 3.4); lines = wrap(c, a.head.toUpperCase(), tw); }
    c.fillStyle = T.ink;
    c.textAlign = "left";
    c.textBaseline = "top";
    lines.slice(0, 3).forEach(function (l, i) { text(c, l, tx, a.y + 4.6 + i * s * 0.98); });
    var by = a.y + a.h - 8.2;
    CA.rrect(c, tx, by, Math.min(tw, 22), 5.4, 1);
    c.fillStyle = T.red;
    c.fill();
    CA.ink(c, 0.4);
    c.stroke();
    c.textBaseline = "middle";
    fitText(c, "Shop now", tx + Math.min(tw, 22) / 2, by + 2.9, Math.min(tw, 22) - 2, 3, "center", T.paper);
    // the label that makes it legal
    c.textBaseline = "top";
    font(c, 2.2, T.body, "700");
    c.fillStyle = T.ink;
    c.textAlign = "left";
    text(c, "Advertisement", artLeft ? tx : a.x0 + 3, a.y + 0.9);
    c.restore();
    c.restore();
    c.textBaseline = "alphabetic";
  }

  // ---------- Jump to recipe ----------
  function drawJump(c, j) {
    var w = j.x1 - j.x0, h = j.h, used = j.used && !j.fake;
    c.save();
    if (used) c.globalAlpha = 0.45;
    CA.rrect(c, j.x0 + 1.2, j.y + 1.2, w, h, h / 2);
    c.fillStyle = CA.dots(c, T.paper);
    c.fill();
    CA.rrect(c, j.x0, j.y, w, h, h / 2);
    c.fillStyle = j.fake ? T.red : T.accent;
    c.fill();
    CA.ink(c, 0.6);
    c.stroke();
    c.textBaseline = "middle";
    fitText(c, j.fake ? "Jump to recipes" : "Jump to recipe", j.x0 + w / 2 - 2.5, j.y + h / 2 + 0.3, w - 10, 3.8, "center", j.fake ? T.paper : T.ink);
    // a little down arrow
    var ax = j.x1 - 5, ay = j.y + h / 2;
    c.beginPath();
    c.moveTo(ax - 1.6, ay - 1);
    c.lineTo(ax + 1.6, ay - 1);
    c.lineTo(ax, ay + 1.4);
    c.closePath();
    c.fillStyle = j.fake ? T.paper : T.ink;
    c.fill();
    if (j.fake) {
      // the tiny tag that gives it away
      var tx = j.x1 - 3, ty = j.y - 2.2;
      var s = font(c, 2.4, T.display);
      var tw = textW(c, "AD") + 1.6;
      c.fillStyle = T.paper;
      c.fillRect(tx - tw / 2, ty - s / 2 - 0.4, tw, s + 0.8);
      CA.ink(c, 0.35);
      c.strokeRect(tx - tw / 2, ty - s / 2 - 0.4, tw, s + 0.8);
      c.fillStyle = T.ink;
      c.textAlign = "center";
      text(c, "AD", tx, ty + 0.2);
    }
    c.textBaseline = "alphabetic";
    c.restore();
  }

  // ---------- the recipe, at last ----------
  function drawRecipe(c, it) {
    var def = it.def, x = 8, y = it.y, w = 84, h = it.h;
    card(c, x, y, w, h, { r: 1.5 });
    c.fillStyle = T.accent;
    c.fillRect(x + 0.3, y + 0.3, w - 0.6, 2.2);
    c.textBaseline = "alphabetic";
    fitText(c, "The recipe", x + 4, y + 10, 50, 6, "left", T.ink);
    fitText(c, def.dish, x + 4, y + 15.4, w - 8, 3.4, "left", T.ink);
    var s = font(c, 3.2, T.body, "600");
    c.fillStyle = T.ink;
    c.textAlign = "left";
    def.recipe.lines.forEach(function (l, i) {
      CA.blob(c, x + 5.2, y + 20.6 + i * s * 1.25 - s * 0.32, 0.7, 0.7, T.ink);
      text(c, l, x + 7.4, y + 20.6 + i * s * 1.25);
    });
    var my = y + 21 + def.recipe.lines.length * s * 1.25 + 1.5;
    wrap(c, def.recipe.method, w - 8).slice(0, 3).forEach(function (l, i) { text(c, l, x + 4, my + i * s * 1.2); });
    // print it, if you like
    CA.rrect(c, x + w - 24, y + 4.4, 20, 6, 1);
    CA.ink(c, 0.45);
    c.stroke();
    c.textBaseline = "middle";
    fitText(c, "Print", x + w - 14, y + 7.6, 18, 3, "center", T.ink);
    c.textBaseline = "alphabetic";
    // and below it, the comments, which are a whole other game
    font(c, 3, T.body, "600");
    c.fillStyle = T.paper;
    text(c, "342 comments. Most of them ask if you can use a slow cooker.", x, y + h + 6);
  }

  // ---------- the loose video, and the embed it came from ----------
  function drawVideoBox(c, cx, y, t, loose) {
    var x = cx - VIDEO_W / 2, w = VIDEO_W, h = VIDEO_H;
    card(c, x, y, w, h, { fill: T.ink, edge: T.paper, line: 0.7, r: 1 });
    c.save();
    CA.rrect(c, x, y, w, h, 1);
    c.clip();
    // the chef, mid-sentence
    CA.chef(c, cx - 6, y + 12.5, 5.2, { mood: Math.floor(clock * 6) % 2 ? "shout" : "glare", look: [clamp((hand.x - cx) / 20, -1, 1), -0.6] });
    CA.dish(c, "soup", cx + 9, y + 17, 4.2);
    c.restore();
    // the play bar, in red, as is traditional
    c.fillStyle = T.paper;
    c.fillRect(x + 2, y + h - 2.6, w - 4, 0.8);
    c.fillStyle = T.red;
    c.fillRect(x + 2, y + h - 2.6, (w - 4) * ((t * 0.07) % 1), 0.8);
    c.textBaseline = "top";
    font(c, 2.4, T.body, "700");
    c.fillStyle = T.paper;
    c.textAlign = "left";
    text(c, "Autoplay", x + 1.8, y + 1.3);
    c.textBaseline = "alphabetic";
    if (!loose) {
      // a play button, though it's already playing
      c.beginPath();
      c.moveTo(cx + 9, y + 4);
      c.lineTo(cx + 13.6, y + 6.6);
      c.lineTo(cx + 9, y + 9.2);
      c.closePath();
      c.fillStyle = T.paper;
      c.fill();
    }
  }

  function drawVideo(c) {
    var v = G.video;
    if (!v) return;
    var y = HY + v.off;
    c.save();
    if (v.state === "leave") {
      var k = ease(v.lt / 0.5);
      // off to sulk in the corner
      var tx = 100 - VIDEO_W * 0.25, ty = VH - VIDEO_H * 0.4;
      c.translate(v.x + (tx - v.x) * k, y + (ty - y) * k);
      c.scale(1 - k * 0.6, 1 - k * 0.6);
      c.translate(-v.x, -y);
      c.globalAlpha = 1 - k * 0.5;
    } else if (v.state === "close") {
      c.globalAlpha = 1 - ease(v.lt / 0.3);
    }
    drawVideoBox(c, v.x, y, v.t, true);
    // the X, after it's made you wait
    var s = videoX(v), xr = s[1];
    c.textBaseline = "middle";
    if (v.t < VIDEO_X) {
      var n = Math.ceil(VIDEO_X - v.t);
      var bw = 13;
      c.fillStyle = T.ink;
      c.fillRect(xr - bw, y + 0.6, bw, 4.6);
      fitText(c, "Close in " + n, xr - bw / 2, y + 3.1, bw - 1, 2.6, "center", T.paper);
    } else if (v.state === "dock" || v.state === "rise") {
      closeBox(c, s[0], y - 0.4, s[1] - s[0]);
    }
    c.textBaseline = "alphabetic";
    c.restore();
  }

  function closeBox(c, x, y, w) {
    CA.rrect(c, x, y, w, w, 0.6);
    c.fillStyle = T.ink;
    c.fill();
    CA.ink(c, 0.5, T.paper);
    c.stroke();
    CA.seg(c, [[x + w * 0.28, y + w * 0.28], [x + w * 0.72, y + w * 0.72]], 0.7, T.paper);
    CA.seg(c, [[x + w * 0.72, y + w * 0.28], [x + w * 0.28, y + w * 0.72]], 0.7, T.paper);
  }

  // ---------- newsletter pop-ups ----------
  function drawPopups(c) {
    var open = openPopup();
    if (open) {
      // the page behind goes dim: ink halftone over everything
      c.fillStyle = CA.dots(c, T.ink, true);
      c.fillRect(-MARGIN - 2, 0, VW + 4, VH);
    }
    G.popups.forEach(function (p) {
      var y = HY - POP_TOP;
      if (p.state === "warn") {
        // where it'll land, and the cat, peeking in
        c.setLineDash([1.6, 1.2]);
        CA.ink(c, 0.5, T.paper);
        c.strokeRect(p.cx - p.w / 2, y, p.w, POP_H);
        c.setLineDash([]);
        var peek = shell.reduceMotion ? 1 : ease(p.t / 0.25);
        if (p.kind === "news") {
          var catX0 = p.side > 0 ? 100 + 7 - peek * 9 : -7 + peek * 9;
          CA.cat(c, catX0, HY + 8, 4.6, { look: [-p.side, 0], mood: "shout" });
        }
        return;
      }
      var k = 1, cx = p.cx, alpha = 1, sc = 1;
      if (p.state === "fly") {
        k = ease(p.t / POP_FLY);
        if (shell.reduceMotion) alpha = k;
        else cx = (p.side > 0 ? 100 + p.w / 2 + 6 : -p.w / 2 - 6) * (1 - k) + p.cx * k;
      } else if (p.state === "miss") {
        alpha = 1 - ease(p.t / 0.45);
        if (!shell.reduceMotion) cx = p.cx - p.side * p.t * 60;
      } else if (p.state === "close") {
        sc = 1 - ease(p.t / 0.22);
      }
      c.save();
      c.globalAlpha = alpha;
      if (sc < 1) {
        var s = closeSpan(p);
        c.translate(s[1], y);
        c.scale(sc, sc);
        c.translate(-s[1], -y);
      }
      drawPopupCard(c, p, cx, y);
      c.restore();
    });
  }

  function drawPopupCard(c, p, cx, y) {
    var x = cx - p.w / 2, w = p.w;
    var h = p.kind === "confirm" ? 22 : POP_H;
    card(c, x, y, w, h, { r: 1.2 });
    c.fillStyle = T.accent;
    c.fillRect(x + 0.3, y + 0.3, w - 0.6, 7.4);
    c.fillStyle = T.ink;
    c.fillRect(x + 0.3, y + 7.4, w - 0.6, 0.45);
    c.textBaseline = "middle";
    var s = p.kind === "confirm" ? null : closeSpan({ cx: cx, w: w, kind: p.kind });
    if (p.kind === "news") {
      fitText(c, "Don't miss a recipe", x + (w - 9) / 2 + 1, y + 4.1, w - 12, 3.6, "center", T.ink);
      CA.rrect(c, x + 3, y + 11, w - 6, 5.6, 0.6);
      c.fillStyle = T.paper;
      c.fill();
      CA.ink(c, 0.4);
      c.stroke();
      font(c, 2.8, T.body, "600");
      c.fillStyle = T.ink;
      c.textAlign = "left";
      text(c, "Your email", x + 4.5, y + 13.9);
      CA.rrect(c, x + 3, y + 18.4, w - 6, 5.6, 1);
      c.fillStyle = T.red;
      c.fill();
      CA.ink(c, 0.4);
      c.stroke();
      fitText(c, "Subscribe", cx, y + 21.3, w - 10, 3.4, "center", T.paper);
      font(c, 2.5, T.body, "600");
      c.fillStyle = T.ink;
      c.textAlign = "center";
      text(c, "No thanks, I don't like food", cx, y + 27, w - 2);
      // the cat, hanging on to the top
      if (p.state !== "close") {
        CA.cat(c, catX({ cx: cx, w: w }), y - 3.2, 4.4, { look: [clamp((hand.x - cx) / 20, -1, 1), 0.5], paws: true });
      }
    } else if (p.kind === "adblock") {
      fitText(c, "Ad blocker detected", x + w / 2, y + 4.1, w - 16, 3.6, "center", T.ink);
      font(c, 3, T.body, "600");
      c.fillStyle = T.ink;
      c.textAlign = "center";
      text(c, "Please turn it off. We have saucepans to sell.", cx, y + 12.6, w - 6);
      CA.rrect(c, cx - 18, y + 17, 36, 6.4, 1);
      c.fillStyle = T.red;
      c.fill();
      CA.ink(c, 0.4);
      c.stroke();
      fitText(c, "Turn it off", cx, y + 20.3, 32, 3.4, "center", T.paper);
      if (p.state !== "close") CA.chef(c, x + 10, y - 2.2, 4.2, { look: [0.5, 0.5] });
    } else {
      fitText(c, "Are you sure", x + 3, y + 4.1, w - 22, 3.6, "left", T.ink);
      var ys = closeSpan({ cx: cx, w: w, kind: "confirm" });
      fitText(c, "Yes", (ys[0] + ys[1]) / 2, y + 4.1, ys[1] - ys[0] - 1, 2.6, "center", T.ink);
      c.fillRect(ys[0] + 4, y + 5.6, ys[1] - ys[0] - 8, 0.3);
      CA.rrect(c, x + 4, y + 11, w - 8, 7, 1.2);
      c.fillStyle = T.red;
      c.fill();
      CA.ink(c, 0.4);
      c.stroke();
      fitText(c, "No, take me back", cx, y + 14.6, w - 12, 3.4, "center", T.paper);
    }
    if (s) closeBox(c, s[0], y + 0.6, s[1] - s[0]);
    c.textBaseline = "alphabetic";
  }

  // ---------- you're on it: a ring round whatever the fingertip would click ----------
  function drawHover(c) {
    var hv = G.hover;
    if (!hv || shell.state() !== "playing") return;
    var x0, x1, y0, y1;
    if (hv.what === "close") { var s = closeSpan(hv.p); x0 = s[0]; x1 = s[1]; y0 = HY - POP_TOP + 0.6; y1 = y0 + (s[1] - s[0]); }
    else if (hv.what === "button") { x0 = hv.btn.x0; x1 = hv.btn.x1; y0 = HY + hv.b.y + hv.b.row - G.scroll - (hv.btn.type === "accept" ? 1.6 : 0); y1 = y0 + hv.b.rowH + (hv.btn.type === "accept" ? 3.2 : 0); }
    else if (hv.what === "videoX") { var vs = videoX(G.video); x0 = vs[0]; x1 = vs[1]; y0 = HY - 0.4; y1 = y0 + (vs[1] - vs[0]); }
    else if (hv.what === "jump") { x0 = hv.j.x0; x1 = hv.j.x1; y0 = HY + hv.j.y - G.scroll; y1 = y0 + hv.j.h; }
    else return;
    CA.rrect(c, x0 - 1.2, y0 - 1.2, x1 - x0 + 2.4, y1 - y0 + 2.4, 1.6);
    CA.ink(c, 1.6, T.ink);
    c.stroke();
    CA.ink(c, 0.8, T.paper);
    c.stroke();
  }

  // ---------- the hand ----------
  function drawHand(c) {
    var wob = 0;
    if (G.wade && !shell.reduceMotion) wob = Math.sin(clock * 22) * 0.06;
    // wading: little wake lines either side of the fingertip
    if (G.wade && G.v > 1) {
      [-1, 1].forEach(function (s) {
        CA.seg(c, [[hand.x + s * 2.4, HY - 0.6], [hand.x + s * 4.2, HY - 3]], 0.9, T.ink);
        CA.seg(c, [[hand.x + s * 2.4, HY - 0.6], [hand.x + s * 4.2, HY - 3]], 0.45, T.accent);
      });
    }
    CA.hand(c, hand.x, HY, 0.95, { press: hand.press, squash: hand.squash, tilt: hand.tilt + wob });
    // stopped: impact lines
    if (G.blocked && !shell.reduceMotion && G.blockT < 0.5) {
      [-1, 1].forEach(function (s) {
        CA.seg(c, [[hand.x + s * 3, HY + 0.4], [hand.x + s * 5.4, HY + 0.4]], 0.5, T.paper);
      });
    }
  }

  function drawFx(c) {
    fx.forEach(function (e) {
      var k = e.t / e.life;
      if (e.kind === "ring") {
        c.beginPath();
        c.arc(e.x, e.y, 1 + k * 4, 0, Math.PI * 2);
        c.globalAlpha = 1 - k;
        CA.ink(c, 0.5, T.paper);
        c.stroke();
        c.globalAlpha = 1;
      } else if (e.kind === "spark") {
        var r0 = 2 + k * 3, r1 = r0 + 2;
        CA.seg(c, [[e.x + Math.cos(e.a) * r0, e.y + Math.sin(e.a) * r0 * 0.6], [e.x + Math.cos(e.a) * r1, e.y + Math.sin(e.a) * r1 * 0.6]], 0.45, T.paper);
      } else if (e.kind === "puff") {
        var r = e.r * (1 - k * 0.5);
        c.globalAlpha = 1 - k;
        CA.blob(c, e.x + 0.5, e.y + 0.5, r, r, T.accent);
        CA.blob(c, e.x, e.y, r, r, T.paper);
        c.globalAlpha = 1;
      }
    });
  }

  // The page's own scrollbar: a long page means a tiny thumb
  function drawScrollbar(c) {
    var x = MARGIN > 3 ? 101.6 : 98.6, top = 2, len = VH - 4;
    c.fillStyle = T.ash;
    c.fillRect(x - 0.4, top, 0.8, len);
    var p = clamp((G.scroll - START) / Math.max(1, G.len - START), 0, 1);
    var th = Math.max(3.5, len * VH / (G.len + VH));
    CA.rrect(c, x - 0.8, top + p * (len - th), 1.6, th, 0.8);
    c.fillStyle = T.paper;
    c.fill();
  }

  // ---------- a new tab, opened by an advert ----------
  function drawTab(c) {
    var tb = G.tab;
    if (!tb) return;
    var k = shell.reduceMotion ? 1 : ease(Math.min(tb.t, tb.life - tb.t) / 0.15);
    var x = -MARGIN, w = VW, y = (1 - k) * VH;
    c.save();
    c.globalAlpha = shell.reduceMotion ? Math.min(1, Math.min(tb.t, tb.life - tb.t) / 0.15) : 1;
    c.fillStyle = T.paper;
    c.fillRect(x, y, w, VH);
    c.fillStyle = T.ink;
    c.fillRect(x, y, w, 9);
    c.fillStyle = T.paper;
    CA.rrect(c, 4, y + 3, 34, 6, 1);
    c.fill();
    c.textBaseline = "middle";
    fitText(c, "A new tab", 21, y + 6.2, 30, 2.8, "center", T.ink);
    // the advert, at full size, which is what it always wanted
    c.fillStyle = CA.dots(c, T.accent, true);
    c.fillRect(x, y + VH * 0.55, w, VH * 0.45);
    var s = font(c, 7);
    var lines = wrap(c, tb.head.toUpperCase(), 90);
    c.fillStyle = T.ink;
    c.textAlign = "center";
    lines.slice(0, 3).forEach(function (l, i) { text(c, l, 50, y + 22 + i * s); });
    CA.product(c, ["pan", "kettle", "fridge", "onion"][PG.TABS.indexOf(tb.head) % 4], 50, y + VH * 0.62, 11);
    fitText(c, "Closing it for you", 50, y + VH - 8, 80, 3.2, "center", T.ink);
    c.textBaseline = "alphabetic";
    c.restore();
  }

  // ---------- bubbles and the arrow ----------
  function drawBubble(c, b, placed) {
    var a = b.at();
    if (!a) return;
    var ax = OX + a.x * U, ay = a.y * U;
    var size = clamp(U * 3.4, 12, 15);
    c.font = size + "px " + T.display;
    var words = b.text.toUpperCase().split(" "), lines = [""];
    words.forEach(function (w) {
      var tryLine = lines[lines.length - 1] ? lines[lines.length - 1] + " " + w : w;
      if (tryLine.length > 18 && lines[lines.length - 1]) lines.push(w); else lines[lines.length - 1] = tryLine;
    });
    var tw = 0;
    lines.forEach(function (l) { tw = Math.max(tw, c.measureText(l).width); });
    var pad = size * 0.5, lh = size * 1.02;
    var bw = tw + pad * 2, bh = lines.length * lh + pad * 1.3;
    var bx = clamp(ax - bw / 2, 4, W - bw - 4);
    var topY = 4;
    hudBoxes().forEach(function (r) { if (bx < r.right + 4 && bx + bw > r.left - 4) topY = Math.max(topY, r.bottom + 4); });
    var by = clamp(ay - bh - size * 0.7, topY, H - bh - 4);
    for (var tries = 0; tries < 4; tries++) {
      var hit = null;
      for (var k = 0; k < placed.length; k++) {
        var o = placed[k];
        if (bx < o.x + o.w + 4 && bx + bw + 4 > o.x && by < o.y + o.h + 4 && by + bh + 4 > o.y) { hit = o; break; }
      }
      if (!hit) break;
      by = hit.y - bh - size * 0.8 >= topY ? hit.y - bh - size * 0.8 : hit.y + hit.h + size * 0.8;
      by = clamp(by, topY, H - bh - 4);
    }
    placed.push({ x: bx, y: by, w: bw, h: bh });
    var tailX = clamp(ax, bx + 12, bx + bw - 12);
    var pop = shell.reduceMotion ? 1 : clamp(b.t * 8, 0, 1);
    c.globalAlpha = Math.min(pop, clamp((b.life - b.t) * 3, 0, 1));
    c.beginPath();
    var r = Math.min(9, bh / 2);
    var under = by > ay;
    c.moveTo(bx + r, by);
    if (under) { c.lineTo(tailX - 5, by); c.lineTo(tailX - 2, by - size * 0.7); c.lineTo(tailX + 6, by); }
    c.arcTo(bx + bw, by, bx + bw, by + bh, r);
    c.arcTo(bx + bw, by + bh, bx, by + bh, r);
    if (!under) { c.lineTo(tailX + 6, by + bh); c.lineTo(tailX - 2, by + bh + size * 0.7); c.lineTo(tailX - 5, by + bh); }
    c.arcTo(bx, by + bh, bx, by, r);
    c.arcTo(bx, by, bx + bw, by, r);
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
    lines.forEach(function (l, i) { c.fillText(l, bx + bw / 2, by + pad * 0.75 + i * lh); });
    c.textBaseline = "alphabetic";
    c.globalAlpha = 1;
  }

  var boxes = null, boxAge = 0;
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

  // A bobbing arrow pointing down at something, with a word over it
  function drawArrow(c, x, y, word) {
    var bob = shell.reduceMotion ? 0 : Math.abs(Math.sin(clock * 4)) * -1.6;
    c.save();
    c.translate(x, y - 1 + bob);
    c.lineJoin = "round";
    c.beginPath();
    c.moveTo(-1.6, -6.4); c.lineTo(1.6, -6.4); c.lineTo(1.6, -3); c.lineTo(3.6, -3); c.lineTo(0, 0.8); c.lineTo(-3.6, -3); c.lineTo(-1.6, -3);
    c.closePath();
    c.fillStyle = T.paper;
    c.fill();
    CA.ink(c, 0.6);
    c.stroke();
    var s = font(c, 3.4);
    var t = word.toUpperCase();
    var tw = textW(c, t);
    c.textAlign = "center";
    c.textBaseline = "bottom";
    var tx = clamp(0, -x + tw / 2 + 1, 100 - x - tw / 2 - 1);
    c.lineWidth = s * 0.28 * U;
    c.strokeStyle = T.ink;
    text(c, t, tx, -7.2, 0, true);
    c.fillStyle = T.paper;
    text(c, t, tx, -7.2);
    c.textBaseline = "alphabetic";
    c.restore();
  }

  // ---------------------------------------------------------------------------
  // Start it up
  // ---------------------------------------------------------------------------
  shell = N.createGame({
    root: root,
    slug: "just-the-recipe",
    title: "Just the Recipe",
    stamp: "Rejected",
    tilt: -5,
    note: "Three courses. Three recipes. About nine thousand words in the way.",
    pitch: "Scroll down to the recipe. The page has other ideas.",
    hints: {
      keys: "Arrow keys, A and D, or the mouse to steer. Space or click to click. P to pause.",
      touch: "Drag anywhere to steer the hand. Click on the right."
    },
    againLabel: "Scroll again",
    aim: true,
    clickAction: true,
    pad: { action: [0, 2] },
    daily: true,
    smallCallouts: true,
    touch: [{ key: "action", label: "Click", icon: "Click", side: "right" }],
    reset: reset,
    update: function (dt, input) { update(dt, input); },
    render: function () { render(); },
    resize: resize
  });
  T = shell.tokens;
  CA.init(T, U * DPR);

  // The canvas font may arrive after the first frame
  if (document.fonts && document.fonts.load) document.fonts.load("12px " + T.display);

  if (DEBUG) {
    window.__recipe = {
      G: function () { return G; },
      run: function () { return run; },
      hand: function () { return hand; },
      state: function () { return shell.state(); },
      view: function () { return { U: U, HY: HY, VH: VH, OX: OX, W: W, H: H }; },
      // what the autopilot would do now, for test players that use real input
      advice: function () {
        if (!G || shell.state() !== "playing" || G.over) return null;
        var cd = autoCd, o = pilot(0);
        autoCd = cd;
        return { x: o.x, click: o.click || null, hand: hand.x, U: U, OX: OX, HY: HY };
      }
    };
  }
})();
