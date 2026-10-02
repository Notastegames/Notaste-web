// Thonglets: tiny creatures in thongs who think you're their god.
// You are a glowing hand. They follow you anywhere, including into a pit.
// Lead them to the brick pile, then to the building site, and they'll build
// you a statue. They've never seen you, so the statue is a guess.
//
// Built on the shared kit (/games/kit/kit.js): the intro, the screens,
// controls, sound and saving. sprites.js draws the characters. This file is
// the field, the crowd, the rivals, the statue and the score.
//
// The comedy is blind faith and what it costs the faithful, never anyone's
// body: they're cartoon beans in thongs. The rivals are invented stand-ins for
// broken things (stage 1: the Feed), never real people or brands.
(function () {
  "use strict";

  var N = window.Notaste;
  var S = window.ThongletSprites;
  var root = document.getElementById("game-root");
  if (!N || !S || !root) return;

  var params = new URLSearchParams(window.location.search);
  var AUTOPILOT = params.has("autopilot"); // for testing: the computer plays god
  var DEBUG = params.has("debug");

  // ---------------------------------------------------------------------------
  // Tuning. The field is VIEW world units across the screen's short side.
  // ---------------------------------------------------------------------------
  var VIEW = 400;
  var STAGE_TIME = 120;              // seconds
  var TARGET = 150;                  // bricks in a finished statue
  var TIER = 30;                     // bricks per stage of the statue
  var START_FOLK = 30;
  var CONVERTS = 4;                  // new believers each time the statue grows
  var FOLLOW_R = 190;                // how far away they can still see your light
  var LIGHT_SPEED = 250;             // keys and pad
  var LIGHT_CHASE = 620;             // mouse and finger: the light catches up this fast
  var WALK = 105;
  var WALK_LOADED = 82;              // carrying a brick
  var QUARRY_R = 44;
  var SITE_R = 52;
  var FEED_AT = 10;                  // seconds before the Feed switches on
  var FEED_R = 112;                  // how far its glow reaches
  var RESCUE_R = 58;                 // bring your light this close to snap them out of it
  var SMITE_CD = 6;
  var SMITE_R = 50;
  var FEE_EVERY = 5;                 // the Priest keeps every fifth brick
  var DEVOTION_PER = 0.01;           // each one smitten makes them love you a bit more
  var DEVOTION_MAX = 2;

  // ---------------------------------------------------------------------------
  // What they say. Crude is fine; cruel isn't (DESIGN.md, section 2).
  // ---------------------------------------------------------------------------
  var PRAYERS = ["Is it statue time.", "I've done a little shrine.", "Bless this thong.", "Lord, it's ridden up again.",
                 "I named my bum after you.", "Is god watching me wee.", "I'd die for you. Please don't check.",
                 "We love you. Do you love us. Doesn't matter.", "Make the bricks lighter. Or me stronger."];
  var CARRYING = ["Hnngh.", "It's for you.", "Lift with your bum.", "Brick. Heavy. Worth it.", "Mind my back.",
                  "This brick has your name on. I wrote it."];
  var LEFT_BEHIND = ["Come back.", "Where's god gone.", "Is this a test.", "We'll just wait here. Forever.", "Did we do something."];
  var SERMONS = ["Blessed are the bricklayers.", "Give generously. To me.", "The light is never wrong. Walk into it.",
                 "God wants you to work weekends.", "Thou shalt not ask questions.", "Thongs on, heads down.",
                 "Questions go in the box. The box is a bin."];
  var FEES = ["Admin fee.", "For the church. The church is me.", "Processing charge.", "Thank you for your donation."];
  var FEED_SAYS = ["You won't believe what happens next.", "Ten bums you need to see.", "Keep scrolling.",
                   "Someone is wrong online.", "Sponsored.", "This bum went viral."];
  var STARING = ["One more.", "Ha. Bum.", "Just checking something.", "I've got eleven notifications.", "Is that my bum."];
  var RESCUED = ["Sorry. Got distracted.", "I was praying. On my phone.", "Ten more minutes.", "Where am I."];
  var FALLING = ["Wheee.", "Worth it.", "Was this the plan.", "Following god."];
  var SMITTEN = ["Thank you.", "Again.", "I felt that in my thong.", "Where's my thong.", "Worth it.", "God noticed me."];
  var PUFFED = ["Who did that.", "Better out than in.", "That was a prayer.", "Not me. I'm holy.", "Offering accepted."];
  var JOINING = ["We saw the statue. We're in.", "Is that a bum. We're in.", "Nice statue. Where do we sign."];
  var TIER_CALLS = ["Feet: approved", "Bum: in progress", "Thong: installed", "Head: pending"];

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  var shell, T, ctx;
  var W = 1, H = 1, DPR = 1, SC = 1;   // CSS px, device ratio, CSS px per world unit
  var WW = VIEW, WH = VIEW;            // the field in world units
  var bg = null;
  var place = {};                      // where things are on the field
  var folk = [], priest = null, light = null, feed = null;
  var bubbles = [], fx = [];
  var clock = 0, timeLeft = STAGE_TIME;
  var bricks = 0, delivered = 0, fees = 0, lost = 0, smitten = 0, devotion = 1;
  var smiteWait = 0, prevAction = false, shake = 0;
  var timers = {};
  var over = false, hudEls = null, firstFall = true;
  var stepT = 0;

  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

  // ---------------------------------------------------------------------------
  // The field
  // ---------------------------------------------------------------------------
  function layout() {
    place = {
      quarry: { x: WW * 0.16, y: WH * 0.76 },
      site: { x: WW * 0.78, y: WH * 0.62 },
      pit: { x: WW * 0.5, y: WH * 0.6, rx: Math.min(80, WW * 0.12), ry: 46 },
      feed: { x: WW * 0.44, y: WH * 0.27 },
      fees: { x: WW * 0.78 + 30, y: WH * 0.62 + 52 },
      start: { x: WW * 0.22, y: WH * 0.5 }
    };
  }

  function newFolk(x, y, opts) {
    var a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random());
    var f = {
      x: x, y: y, vx: 0, vy: 0,
      ox: Math.cos(a) * r, oy: Math.sin(a) * r,   // their place in the crowd
      state: "follow", t: 0, hat: false, carry: false, censored: false,
      face: Math.random() < 0.5 ? -1 : 1, back: false, phase: Math.random() * 6,
      speed: WALK * rand(0.9, 1.1)
    };
    if (opts) for (var k in opts) f[k] = opts[k];
    folk.push(f);
    return f;
  }

  function reset(sh) {
    shell = sh;
    T = sh.tokens;
    layout();
    folk = [];
    bubbles = [];
    fx = [];
    for (var i = 0; i < START_FOLK; i++) newFolk(place.start.x + rand(-50, 50), place.start.y + rand(-50, 50));
    priest = { x: place.start.x - 40, y: place.start.y + 10, vx: 0, vy: 0, ox: -0.9, oy: 0.6, state: "follow",
               t: 0, face: 1, back: false, phase: 0, priest: true, censored: false, speed: WALK * 0.8, gone: 0 };
    light = { x: place.start.x + 40, y: place.start.y, vx: 0, vy: 0 };
    feed = { x: place.feed.x, y: place.feed.y, on: false, off: 0, glow: 0 };
    clock = 0;
    timeLeft = STAGE_TIME;
    bricks = delivered = fees = lost = smitten = 0;
    devotion = 1;
    smiteWait = 0;
    prevAction = false;
    shake = 0;
    over = false;
    firstFall = true;
    timers = { prayer: 2.5, sermon: 5, feed: 3, puff: 9, behind: 4 };
    if (hudEls) paintHud();
  }

  // ---------------------------------------------------------------------------
  // Speech bubbles: at most three at once, one per speaker
  // ---------------------------------------------------------------------------
  function say(who, text, force) {
    if (!who || !text) return;
    for (var i = 0; i < bubbles.length; i++) if (bubbles[i].who === who) { if (!force) return; bubbles.splice(i, 1); break; }
    if (bubbles.length >= 3) { if (!force) return; bubbles.shift(); }
    bubbles.push({ who: who, text: text, t: 0, life: 2.2 + text.length * 0.03 });
  }

  function someone(test) {
    var pool = folk.filter(function (f) { return f.state !== "gone" && f.state !== "fall" && (!test || test(f)); });
    return pool.length ? pick(pool) : null;
  }

  // ---------------------------------------------------------------------------
  // Sound, all made in code (DESIGN.md, section 9)
  // ---------------------------------------------------------------------------
  var sfx = {
    step: function () { N.sound.tone(rand(1300, 1900), 0.022, { vol: 0.018 }); },
    pick: function () { N.sound.tone(260, 0.09, { slide: 420, vol: 0.05 }); },
    drop: function () { N.sound.tone(170, 0.08, { vol: 0.07 }); N.sound.noise(0.05, { freq: 1500, vol: 0.07 }); },
    choir: function () {
      [392, 494, 587].forEach(function (f, i) { N.sound.tone(f, 0.9, { vol: 0.035, delay: i * 0.06 }); });
    },
    fall: function () { N.sound.tone(1100, 0.7, { type: "sine", slide: 140, vol: 0.07 }); },
    puff: function () {
      N.sound.tone(95, 0.32, { type: "sawtooth", slide: 58, vol: 0.09 });
      N.sound.noise(0.28, { type: "bandpass", freq: 220, q: 5, vol: 0.12 });
      N.sound.tone(118, 0.12, { type: "sawtooth", slide: 80, vol: 0.06, delay: 0.34 });
    },
    zap: function () {
      N.sound.noise(0.5, { type: "highpass", freq: 1800, vol: 0.22 });
      N.sound.tone(1600, 0.25, { type: "sawtooth", slide: 90, vol: 0.08 });
      N.sound.stamp(0.03);
    },
    ping: function () { N.sound.tone(1320, 0.06, { vol: 0.045 }); N.sound.tone(1760, 0.08, { vol: 0.045, delay: 0.08 }); },
    till: function () { N.sound.tone(2100, 0.05, { vol: 0.05 }); N.sound.tone(2800, 0.14, { vol: 0.05, delay: 0.06 }); },
    ready: function () { N.sound.tone(880, 0.06, { vol: 0.035 }); }
  };

  // ---------------------------------------------------------------------------
  // Update
  // ---------------------------------------------------------------------------
  function inPit(p) {
    var dx = (p.x - place.pit.x) / place.pit.rx, dy = (p.y - place.pit.y) / place.pit.ry;
    return dx * dx + dy * dy < 1;
  }

  function steer(f, tx, ty, speed, dt) {
    var dx = tx - f.x, dy = ty - f.y, d = Math.hypot(dx, dy);
    var want = d > 0.5 ? speed * Math.min(1, d / 24) : 0;
    var dvx = d > 0.5 ? dx / d * want : 0, dvy = d > 0.5 ? dy / d * want : 0;
    var k = Math.min(1, dt * 6);
    f.vx += (dvx - f.vx) * k;
    f.vy += (dvy - f.vy) * k;
  }

  function moveLight(dt, input) {
    var tx = null, ty = null;
    if (AUTOPILOT) {
      var goal = autopilot();
      // never get more than a short walk ahead of the flock
      var flock = folk.filter(function (f) { return f.state === "follow" || f.state === "pray"; });
      if (flock.length) {
        var cx = 0, cy = 0;
        flock.forEach(function (f) { cx += f.x; cy += f.y; });
        cx /= flock.length; cy /= flock.length;
        var gx = goal.x - cx, gy = goal.y - cy, gl = Math.hypot(gx, gy);
        if (gl > 60) { gx *= 60 / gl; gy *= 60 / gl; }
        goal = { x: cx + gx, y: cy + gy };
      }
      tx = goal.x; ty = goal.y;
      var d = Math.hypot(tx - light.x, ty - light.y), sp = Math.min(LIGHT_SPEED * 0.85, d / dt);
      if (d > 0.1) { light.x += (tx - light.x) / d * sp * dt; light.y += (ty - light.y) / d * sp * dt; }
    } else if (input.aim.on) {
      // the light trails a finger a little above it, so the finger doesn't hide it
      tx = input.aim.x / SC;
      ty = (input.aim.y - (input.mode === "touch" ? 34 : 0)) / SC;
      var dd = Math.hypot(tx - light.x, ty - light.y), step = Math.min(dd, LIGHT_CHASE * dt);
      if (dd > 0.1) { light.x += (tx - light.x) / dd * step; light.y += (ty - light.y) / dd * step; }
    } else {
      var mx = input.stick.x || ((input.right ? 1 : 0) - (input.left ? 1 : 0));
      var my = input.stick.y || ((input.down ? 1 : 0) - (input.up ? 1 : 0));
      var m = Math.hypot(mx, my);
      if (m > 1) { mx /= m; my /= m; }
      light.x += mx * LIGHT_SPEED * dt;
      light.y += my * LIGHT_SPEED * dt;
    }
    light.x = clamp(light.x, 16, WW - 16);
    light.y = clamp(light.y, 30, WH - 12);
  }

  // The computer plays god, for testing: fetch bricks, take them round the
  // bottom of the pit, and smite the Feed when it has a crowd.
  function autopilot() {
    var live = folk.filter(function (f) { return f.state !== "gone" && f.state !== "fall"; });
    var loaded = live.filter(function (f) { return f.carry; }).length;
    var staring = live.filter(function (f) { return f.state === "stare"; }).length;
    if (feed.on && staring >= 4) return { x: feed.x, y: feed.y + 20 };
    var goal = loaded >= live.length * 0.6 ? place.site : place.quarry;
    var below = place.pit.y + place.pit.ry + 46;
    var leftSide = light.x < place.pit.x - place.pit.rx - 10, rightSide = light.x > place.pit.x + place.pit.rx + 10;
    var goalLeft = goal.x < place.pit.x;
    if ((goalLeft && !leftSide) || (!goalLeft && !rightSide)) {
      if (light.y < below - 6) return { x: light.x < place.pit.x ? place.pit.x - place.pit.rx - 40 : place.pit.x + place.pit.rx + 40, y: below };
      return { x: goalLeft ? place.pit.x - place.pit.rx - 40 : place.pit.x + place.pit.rx + 40, y: below };
    }
    return goal;
  }

  function smite() {
    smiteWait = SMITE_CD;
    var hit = 0, x = light.x, y = light.y;
    fx.push({ kind: "bolt", x: x, y: y, t: 0, life: 0.45, seed: Math.random() * 1000 });
    fx.push({ kind: "scorch", x: x, y: y, t: 0, life: 6 });
    if (!shell.reduceMotion) shake = 0.3;
    sfx.zap();
    folk.concat(priest ? [priest] : []).forEach(function (f) {
      if (f.state === "gone" || f.state === "fall") return;
      var d = dist(f, light);
      if (d > SMITE_R) return;
      var a = Math.atan2(f.y - y, f.x - x) || Math.random() * 6;
      f.vx = Math.cos(a) * 170;
      f.vy = Math.sin(a) * 170;
      f.state = "stun";
      f.t = 1.4;
      if (f.carry) { f.carry = false; bricks = Math.max(0, bricks); }
      f.censored = true;
      hit++;
    });
    if (hit) {
      smitten += hit;
      devotion = Math.min(DEVOTION_MAX, devotion + hit * DEVOTION_PER);
      var who = someone(function (f) { return f.state === "stun"; });
      if (priest && priest.state === "stun") say(priest, "I forgive you. Invoice to follow.", true);
      else say(who, pick(SMITTEN), true);
      shell.callout(hit > 1 ? hit + " smitten" : "Smitten", { sound: false });
    }
    if (feed.on && feed.off <= 0 && Math.hypot(feed.x - x, feed.y - y) < SMITE_R + 30) {
      feed.off = 10;
      shell.callout("Feed: down", { sound: false });
      var dazed = someone(function (f) { return f.state === "stare"; });
      folk.forEach(function (f) { if (f.state === "stare") f.state = "follow"; });
      say(dazed, "What do we do now. Talk.", true);
    } else if (!hit) {
      shell.callout("Missed", { sound: false, ms: 900 });
    }
  }

  function deliver(f) {
    f.carry = false;
    delivered++;
    fx.push({ kind: "spark", x: place.site.x + rand(-14, 14), y: place.site.y - rand(10, 40), t: 0, life: 0.4 });
    if (priest && priest.state !== "gone" && delivered % FEE_EVERY === 0) {
      fees++;
      sfx.till();
      say(priest, pick(FEES), true);
      if (fees === 1 || fees % 3 === 0) shell.callout("Administration fee", { sound: false, ms: 1100 });
      return;
    }
    sfx.drop();
    bricks++;
    if (bricks % TIER === 0 && bricks < TARGET) {
      shell.callout(TIER_CALLS[Math.min(TIER_CALLS.length - 1, bricks / TIER - 1)]);
      sfx.choir();
      for (var i = 0; i < CONVERTS; i++) {
        newFolk(place.site.x + rand(-30, 30), place.site.y + rand(14, 40), { state: "follow" });
      }
      say(folk[folk.length - 1], pick(JOINING), true);
    }
    if (bricks >= TARGET) end("done");
  }

  function updateOne(f, dt, crowdR, scatter) {
    if (f.state === "gone") return;
    f.phase += dt * (Math.hypot(f.vx, f.vy) > 12 ? 14 : 3);

    if (f.state === "fall") {
      f.t += dt;
      f.x += (place.pit.x - f.x) * dt * 2;
      f.y += (place.pit.y - f.y) * dt * 2;
      if (f.t > 0.9) {
        f.state = "gone";
        if (f.priest) { priest.gone = 8; } else lost++;
      }
      return;
    }
    if (f.state === "stun") {
      f.t -= dt;
      f.vx *= 1 - Math.min(1, dt * 4);
      f.vy *= 1 - Math.min(1, dt * 4);
      if (f.t <= 0) f.state = "follow";
    } else if (f.state === "pick") {
      f.t -= dt;
      f.vx = f.vy = 0;
      if (f.t <= 0) {
        f.carry = true;
        f.hat = true;
        f.state = "follow";
        sfx.pick();
        if (Math.random() < 0.06) puff(f);
      }
    } else if (f.state === "stare") {
      var fa = Math.atan2(f.y - feed.y, f.x - feed.x);
      steer(f, feed.x + Math.cos(fa) * 34, feed.y + Math.sin(fa) * 22 + 10, f.speed * 0.6, dt);
      if (!feed.on || feed.off > 0 || dist(f, light) < RESCUE_R) {
        f.state = "follow";
        if (Math.random() < 0.3) say(f, pick(RESCUED));
      }
    } else {
      var dl = dist(f, light);
      var reach = scatter ? FOLLOW_R * 0.45 : FOLLOW_R;
      var lure = FEED_R;
      if (priest && priest.state !== "gone" && !f.priest && dist(f, priest) < 90) lure *= 0.55;
      if (!f.priest && feed.on && feed.off <= 0 && dl > 70 && Math.hypot(f.x - feed.x, f.y - feed.y) < lure) {
        f.state = "stare";
        if (Math.random() < 0.25) say(f, pick(STARING));
      } else if (dl < reach) {
        f.state = "follow";
        var spread = scatter ? crowdR * 2.4 : crowdR;
        var tx = light.x + f.ox * spread, ty = light.y + f.oy * spread * 0.7;
        if (f.priest) { tx = light.x + f.ox * (crowdR + 26); ty = light.y + f.oy * (crowdR + 26) * 0.7; }
        steer(f, tx, ty, f.carry ? WALK_LOADED : f.speed, dt);
      } else {
        f.state = "pray";
        steer(f, f.x, f.y, 0, dt);
      }
    }

    f.x += f.vx * dt;
    f.y += f.vy * dt;
    f.x = clamp(f.x, 8, WW - 8);
    f.y = clamp(f.y, 26, WH - 4);
    if (Math.abs(f.vx) > 6) f.face = f.vx > 0 ? 1 : -1;
    f.back = f.vy < -22 && Math.abs(f.vy) > Math.abs(f.vx) * 0.6;

    // Blind faith: they walk wherever the light leads
    if (inPit(f)) {
      f.state = "fall";
      f.t = 0;
      f.carry = false;
      sfx.fall();
      if (f.priest) {
        shell.callout("Priest: lost");
        say(f, "Admin fee waived. Just this once.", true);
      } else {
        if (firstFall) { firstFall = false; shell.callout("Faith: tested", { sound: false }); }
        if (Math.random() < 0.5) say(f, pick(FALLING), true);
      }
      return;
    }
    if (f.priest || f.state === "stun" || f.state === "pick") return;
    if (!f.carry && dist(f, place.quarry) < QUARRY_R) { f.state = "pick"; f.t = 0.35; }
    else if (f.carry && dist(f, place.site) < SITE_R) deliver(f);
  }

  function separate(dt) {
    var live = folk.filter(function (f) { return f.state !== "gone" && f.state !== "fall"; });
    if (priest && priest.state !== "gone" && priest.state !== "fall") live.push(priest);
    var crowded = null;
    for (var i = 0; i < live.length; i++) {
      var a = live[i], near = 0;
      for (var j = i + 1; j < live.length; j++) {
        var b = live[j];
        var dx = b.x - a.x, dy = (b.y - a.y) * 1.4, d = Math.hypot(dx, dy);
        var min = (a.priest || b.priest) ? 18 : 13;
        if (d < min && d > 0.01) {
          var push = (min - d) * 0.5 / d;
          a.x -= dx * push; a.y -= dy * push / 1.4;
          b.x += dx * push; b.y += dy * push / 1.4;
        }
        if (d < 17) { near++; b.near = (b.near || 0) + 1; }
      }
      a.near = (a.near || 0) + near;
      if (a.near >= 6 && !crowded) crowded = a;
    }
    live.forEach(function (f) { f.near = 0; });
    return crowded;
  }

  // A little puff of something. Nobody admits to it.
  function puff(f) {
    var blobs = [];
    for (var i = 0; i < 5; i++) blobs.push({ x: rand(-6, 6), y: rand(-6, 2), r: rand(2.5, 4.5) });
    fx.push({ kind: "puff", x: f.x + f.face * -6, y: f.y - 4, t: 0, life: 1.4, blobs: blobs });
    sfx.puff();
    timers.puff = rand(8, 14);
    var neighbour = someone(function (o) { return o !== f && dist(o, f) < 40; });
    say(neighbour || f, pick(PUFFED), true);
  }

  function update(dt, input) {
    if (over) { tickFx(dt); tickBubbles(dt); return; }
    clock += dt;
    timeLeft = Math.max(0, STAGE_TIME - clock);

    moveLight(dt, input);

    // Smite: on the press, not while held
    smiteWait = Math.max(0, smiteWait - dt);
    if (input.action && !prevAction) {
      if (smiteWait <= 0) smite();
    }
    prevAction = input.action;
    if (smiteWait > 0 && smiteWait - dt <= 0) sfx.ready();

    // The Feed switches on after a few seconds and stays on
    if (!feed.on && clock >= FEED_AT) {
      feed.on = true;
      shell.callout("New rival: The Feed");
      sfx.ping();
      say(feed, "Hey. Hey. Look at me.", true);
    }
    if (feed.off > 0) feed.off = Math.max(0, feed.off - dt);
    feed.glow += dt;

    var live = folk.filter(function (f) { return f.state !== "gone"; });
    var crowdR = 10 + 3.6 * Math.sqrt(live.length);
    var scatter = priest && priest.state === "gone" && priest.gone > 0;
    folk.forEach(function (f) { updateOne(f, dt, crowdR, scatter); });
    if (priest) {
      if (priest.state === "gone") {
        priest.gone -= dt;
        if (priest.gone <= 0) appointPriest();
      } else updateOne(priest, dt, crowdR, false);
    }
    var crowded = separate(dt);

    // Footsteps: a patter that follows how many are walking
    var walking = live.filter(function (f) { return Math.hypot(f.vx, f.vy) > 25; }).length;
    stepT -= dt * Math.min(8, walking * 0.4);
    if (stepT <= 0) { stepT = 1; if (walking) sfx.step(); }

    chatter(dt, crowded);
    tickFx(dt);
    tickBubbles(dt);
    shake = Math.max(0, shake - dt);

    var left = folk.filter(function (f) { return f.state !== "gone" && f.state !== "fall"; }).length;
    var falling = folk.some(function (f) { return f.state === "fall"; });
    if (!left && !falling) end("empty");
    else if (timeLeft <= 0) end("time");
    paintHud();
  }

  function appointPriest() {
    var f = someone(function (o) { return o.state === "follow" || o.state === "pray"; });
    if (!f) { priest.gone = 2; return; }
    folk.splice(folk.indexOf(f), 1);
    priest = { x: f.x, y: f.y, vx: 0, vy: 0, ox: -0.9, oy: 0.6, state: "follow", t: 0, face: f.face, back: false,
               phase: 0, priest: true, censored: false, speed: WALK * 0.8, gone: 0 };
    shell.callout("New priest appointed");
    say(priest, "Same fee.", true);
  }

  function chatter(dt, crowded) {
    timers.prayer -= dt;
    timers.sermon -= dt;
    timers.feed -= dt;
    timers.puff -= dt;
    timers.behind -= dt;
    if (timers.prayer <= 0) {
      timers.prayer = rand(3.5, 6);
      var f = someone(function (o) { return o.state === "follow"; });
      if (f) say(f, pick(f.carry ? CARRYING : PRAYERS));
    }
    if (timers.behind <= 0) {
      timers.behind = rand(4, 7);
      var lonely = someone(function (o) { return o.state === "pray"; });
      if (lonely) say(lonely, pick(LEFT_BEHIND));
    }
    if (timers.sermon <= 0 && priest && priest.state !== "gone") {
      timers.sermon = rand(6, 9);
      say(priest, pick(SERMONS));
    }
    if (timers.feed <= 0 && feed.on && feed.off <= 0) {
      timers.feed = rand(4, 6);
      say(feed, pick(FEED_SAYS));
      sfx.ping();
    }
    if (crowded && timers.puff <= 0 && Math.random() < dt * 0.6) puff(crowded);
  }

  function tickFx(dt) {
    for (var i = fx.length - 1; i >= 0; i--) {
      fx[i].t += dt;
      if (fx[i].t >= fx[i].life) fx.splice(i, 1);
    }
  }

  function tickBubbles(dt) {
    for (var i = bubbles.length - 1; i >= 0; i--) {
      var b = bubbles[i];
      b.t += dt;
      var gone = b.who.state === "gone" && b.who !== feed;
      if (b.t >= b.life || gone) bubbles.splice(i, 1);
    }
  }

  // ---------------------------------------------------------------------------
  // The end of the stage
  // ---------------------------------------------------------------------------
  function end(why) {
    if (over) return;
    over = true;
    var faithful = folk.filter(function (f) { return f.state !== "gone" && f.state !== "fall"; }).length;
    var done = why === "done";
    var secs = Math.ceil(timeLeft);
    var score = Math.round((bricks * 100 + faithful * 25 + (done ? secs * 20 : 0)) * devotion);
    var best = shell.store.get("best", 0);
    var newBest = score > best;
    if (newBest) shell.store.set("best", score);

    var stamp, heading, line, rank;
    if (done) {
      sfx.choir();
      heading = "Statue complete.";
      if (secs >= 30 && lost <= 3) { stamp = "Approved"; rank = 1; line = "They built you a statue. They've never seen you, so they guessed."; }
      else { stamp = "Pending review"; rank = 2; line = "It looks nothing like you. It looks like a bum. They're thrilled."; }
    } else if (why === "empty") {
      stamp = "Rejected"; rank = 4;
      heading = "Nobody left to worship you.";
      line = "Your followers followed you. That was the problem.";
    } else if (bricks >= TARGET / 2) {
      stamp = "Not approved"; rank = 3;
      heading = "Time's up. Statue: half.";
      line = "Half a statue. The Thonglets say it's the best half.";
    } else {
      stamp = "Rejected"; rank = 4;
      heading = "Time's up. Statue: mostly plinth.";
      line = "They're very proud of the plinth. Please say something nice about the plinth.";
    }
    shell.finish({
      place: rank, total: 4, stamp: stamp, heading: heading, line: line,
      stats: [
        { label: "Score", value: fmt(score) },
        { label: "Statue", value: bricks + "/" + TARGET },
        { label: "Faithful", value: String(faithful) },
        { label: "Lost", value: String(lost) },
        { label: "Admin fees", value: String(fees) },
        { label: newBest ? "New best" : "Best", value: fmt(newBest ? score : best), highlight: newBest }
      ]
    });
  }

  function fmt(n) { return Math.round(n).toLocaleString("en-GB"); }

  // ---------------------------------------------------------------------------
  // HUD: stage, time and the statue top left; score, faithful and devotion top right
  // ---------------------------------------------------------------------------
  function buildHud() {
    var hud = shell.hud;
    hud.innerHTML =
      '<div class="kit-hud-tl">' +
        '<p class="kit-stat"><small>Stage</small>1</p>' +
        '<p class="kit-mono" data-time>2:00</p>' +
        '<p class="kit-meter" data-statue><span class="kit-meter-label">Statue</span><span class="kit-meter-bar"><span data-built></span></span></p>' +
        '<p class="kit-meter" data-smite><span class="kit-meter-label">Smite</span><span class="kit-meter-bar"><span data-charge></span></span></p>' +
      '</div>' +
      '<div class="kit-hud-tr">' +
        '<p class="kit-stat kit-stat-big"><span data-score>0</span></p>' +
        '<p class="kit-stat"><small>Faithful</small><span data-faithful>0</span></p>' +
        '<p class="kit-stat"><small>Devotion</small><span data-devotion>x1.00</span></p>' +
      '</div>';
    hudEls = {
      time: hud.querySelector("[data-time]"),
      built: hud.querySelector("[data-built]"),
      smite: hud.querySelector("[data-smite]"),
      charge: hud.querySelector("[data-charge]"),
      score: hud.querySelector("[data-score]"),
      faithful: hud.querySelector("[data-faithful]"),
      devotion: hud.querySelector("[data-devotion]")
    };
  }

  function setText(node, text) { if (node.textContent !== text) node.textContent = text; }
  function setWidth(node, share) {
    var w = Math.round(clamp(share, 0, 1) * 100) + "%";
    if (node.style.width !== w) node.style.width = w;
  }

  function paintHud() {
    if (!hudEls) return;
    var s = Math.ceil(timeLeft);
    setText(hudEls.time, Math.floor(s / 60) + ":" + (s % 60 < 10 ? "0" : "") + (s % 60));
    setWidth(hudEls.built, bricks / TARGET);
    setWidth(hudEls.charge, 1 - smiteWait / SMITE_CD);
    hudEls.smite.classList.toggle("is-full", smiteWait <= 0);
    setText(hudEls.score, fmt(bricks * 100 * devotion));
    setText(hudEls.faithful, String(folk.filter(function (f) { return f.state !== "gone" && f.state !== "fall"; }).length));
    setText(hudEls.devotion, "x" + devotion.toFixed(2));
  }

  // ---------------------------------------------------------------------------
  // Drawing
  // ---------------------------------------------------------------------------
  function resize(w, h, dpr) {
    var oldW = WW, oldH = WH;
    W = w; H = h; DPR = dpr;
    SC = Math.min(W, H) / VIEW;
    WW = W / SC; WH = H / SC;
    ctx = shell ? shell.canvas.getContext("2d") : root.querySelector("canvas").getContext("2d");
    S.init(T || N.tokens(root), SC * DPR);
    bg = null;
    statueImg = null;
    // keep everyone where they were, in proportion
    if (light && (oldW !== WW || oldH !== WH)) {
      var kx = WW / oldW, ky = WH / oldH;
      folk.concat([light, priest, feed]).forEach(function (p) { if (p) { p.x *= kx; p.y *= ky; } });
      layout();
      feed.x = place.feed.x; feed.y = place.feed.y;
    } else layout();
  }

  // The ground and everything on it that never moves, drawn once
  function buildGround() {
    var cv = document.createElement("canvas");
    cv.width = Math.round(W * DPR);
    cv.height = Math.round(H * DPR);
    var c = cv.getContext("2d");
    c.scale(DPR * SC, DPR * SC);
    c.fillStyle = T.ink;
    c.fillRect(0, 0, WW, WH);

    // worn patches of halftone and a few tufts, so it reads as a field
    var r = seeded(7);
    c.fillStyle = T.ash;
    for (var i = 0; i < 26; i++) {
      var px = r() * WW, py = r() * WH, pr = 20 + r() * 50;
      for (var dy = -pr; dy < pr; dy += 7) {
        for (var dx = -pr; dx < pr; dx += 7) {
          var dd = Math.hypot(dx, dy) / pr;
          if (dd < 1) { c.beginPath(); c.arc(px + dx + (dy % 14 ? 3.5 : 0), py + dy, 1.6 * (1 - dd), 0, 7); c.fill(); }
        }
      }
    }
    c.strokeStyle = T.paper;
    c.lineWidth = 1.1;
    c.lineCap = "round";
    for (var g = 0; g < 40; g++) {
      var gx = r() * WW, gy = 30 + r() * (WH - 30);
      c.beginPath();
      c.moveTo(gx - 2, gy); c.lineTo(gx - 3, gy - 3.5);
      c.moveTo(gx, gy); c.lineTo(gx, gy - 4.5);
      c.moveTo(gx + 2, gy); c.lineTo(gx + 3, gy - 3.5);
      c.globalAlpha = 0.45;
      c.stroke();
    }
    c.globalAlpha = 1;

    // the pit: hazard stripes round the edge, nothing inside
    var p = place.pit;
    c.beginPath();
    c.ellipse(p.x, p.y, p.rx + 6, p.ry + 6, 0, 0, Math.PI * 2);
    c.fillStyle = T.paper;
    c.fill();
    c.save();
    c.clip();
    c.strokeStyle = T.red;
    c.lineWidth = 6;
    for (var s = -p.rx * 2; s < p.rx * 2; s += 14) {
      c.beginPath(); c.moveTo(p.x + s, p.y - p.ry - 10); c.lineTo(p.x + s + 30, p.y + p.ry + 10); c.stroke();
    }
    c.restore();
    c.beginPath();
    c.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, Math.PI * 2);
    c.fillStyle = T.ink;
    c.fill();
    c.lineWidth = 2;
    c.strokeStyle = T.ink;
    c.beginPath();
    c.ellipse(p.x, p.y, p.rx + 6, p.ry + 6, 0, 0, Math.PI * 2);
    c.stroke();
    sign(c, p.x + p.rx * 0.55, p.y - p.ry - 14, "Pit");

    // the brick pile
    var q = place.quarry;
    var rows = [[-24, -16, -8, 0, 8, 16], [-20, -12, -4, 4, 12], [-16, -8, 0, 8], [-12, -4, 4], [-8, 0]];
    rows.forEach(function (row, y) {
      row.forEach(function (x) {
        c.beginPath();
        c.rect(q.x + x - 4, q.y - 4 - y * 5, 8, 5);
        c.fillStyle = T.red;
        c.fill();
        c.lineWidth = 1.2;
        c.strokeStyle = T.ink;
        c.stroke();
      });
    });
    sign(c, q.x + 30, q.y - 30, "Bricks");

    // the building site
    var st = place.site;
    c.setLineDash([3, 4]);
    c.lineWidth = 1.6;
    c.strokeStyle = T.paper;
    c.globalAlpha = 0.5;
    c.beginPath();
    c.ellipse(st.x, st.y + 4, SITE_R, SITE_R * 0.42, 0, 0, Math.PI * 2);
    c.stroke();
    c.setLineDash([]);
    c.globalAlpha = 1;
    return cv;
  }

  function sign(c, x, y, text) {
    c.font = "11px " + T.display;
    var w = c.measureText(text.toUpperCase()).width + 10;
    c.fillStyle = T.paper;
    c.strokeStyle = T.ink;
    c.lineWidth = 1.4;
    c.beginPath(); c.moveTo(x, y + 6); c.lineTo(x, y + 20); c.stroke();
    c.fillRect(x - w / 2, y - 7, w, 14);
    c.strokeRect(x - w / 2, y - 7, w, 14);
    c.fillStyle = T.ink;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(text.toUpperCase(), x, y + 0.5);
  }

  function seeded(n) {
    return function () { n = (n * 16807) % 2147483647; return (n - 1) / 2147483646; };
  }

  // The statue: their best guess at what you look like. A giant Thonglet from
  // behind, arms up, in a thong, with a halo. Drawn whole once, then revealed
  // brick by brick from the plinth up.
  var statueImg = null;
  var STATUE = { w: 130, h: 146, ox: 65, oy: 146 };
  function buildStatue() {
    var cv = document.createElement("canvas");
    var sc = SC * DPR;
    cv.width = Math.ceil(STATUE.w * sc);
    cv.height = Math.ceil(STATUE.h * sc);
    var c = cv.getContext("2d");
    c.scale(sc, sc);
    c.translate(STATUE.ox, STATUE.oy);
    c.lineJoin = "round";
    c.lineCap = "round";
    function ink(w, colour) { c.lineWidth = w; c.strokeStyle = colour || T.ink; }

    // plinth
    c.fillStyle = T.paper;
    ink(2.4);
    c.fillRect(-42, -22, 84, 22);
    c.strokeRect(-42, -22, 84, 22);
    c.fillStyle = T.ink;
    c.font = "13px " + T.display;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("OUR GOD", 0, -10.5);

    // feet, then arms raised in glory
    [-17, 17].forEach(function (x) {
      c.beginPath(); c.ellipse(x, -25, 13, 5, 0, 0, Math.PI * 2);
      c.fillStyle = T.paper; c.fill(); ink(2.4); c.stroke();
    });
    [-1, 1].forEach(function (side) {
      c.beginPath();
      c.moveTo(side * 30, -80);
      c.quadraticCurveTo(side * 46, -92, side * 50, -112);
      ink(10); c.stroke();
      ink(5, T.paper); c.stroke();
      c.beginPath(); c.arc(side * 50, -114, 6.5, 0, Math.PI * 2);
      c.fillStyle = T.paper; c.fill(); ink(2.4); c.stroke();
    });

    // the body, with a proper bum at the bottom
    var body = new Path2D();
    body.moveTo(0, -120);
    body.bezierCurveTo(26, -120, 37, -96, 37, -70);
    body.lineTo(37, -50);
    body.bezierCurveTo(37, -32, 27, -24, 15, -24);
    body.bezierCurveTo(7, -24, 2, -27, 0, -31);
    body.bezierCurveTo(-2, -27, -7, -24, -15, -24);
    body.bezierCurveTo(-27, -24, -37, -32, -37, -50);
    body.lineTo(-37, -70);
    body.bezierCurveTo(-37, -96, -26, -120, 0, -120);
    body.closePath();
    c.fillStyle = T.paper;
    c.fill(body);
    c.save();
    c.clip(body);
    c.fillStyle = S.shade(c);
    c.beginPath(); c.ellipse(36, -64, 14, 50, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(8, -36, 9, 9, 0, 0, Math.PI * 2); c.fill();
    c.restore();
    ink(3);
    c.stroke(body);
    c.beginPath(); c.moveTo(0, -52); c.quadraticCurveTo(-1.2, -42, 0, -31);
    ink(2); c.stroke();

    // the thong, from behind
    var band = new Path2D();
    band.moveTo(-36, -55); band.quadraticCurveTo(0, -47, 36, -55);
    var string = new Path2D();
    string.moveTo(0, -50); string.lineTo(0, -33);
    [band, string].forEach(function (path) { ink(7); c.stroke(path); ink(3.6, T.red); c.stroke(path); });
    c.beginPath(); c.moveTo(-6, -51); c.lineTo(6, -51); c.lineTo(0, -43); c.closePath();
    c.fillStyle = T.red; c.fill(); ink(1.8); c.stroke();

    // halo
    c.beginPath();
    c.ellipse(0, -132, 22, 6, 0, 0, Math.PI * 2);
    ink(6); c.stroke();
    ink(3, T.accent); c.stroke();
    return cv;
  }

  function drawStatue(c) {
    if (!statueImg) statueImg = buildStatue();
    var st = place.site;
    var share = bricks / TARGET;
    var shown = 22 + share * (STATUE.h - 22);
    if (bricks >= TARGET) shown = STATUE.h;
    var top = st.y - shown;
    c.save();
    c.beginPath();
    c.rect(st.x - STATUE.ox, top, STATUE.w, shown + 2);
    c.clip();
    c.drawImage(statueImg, st.x - STATUE.ox, st.y - STATUE.oy, STATUE.w, STATUE.h);
    c.restore();
    if (bricks < TARGET) {
      // scaffolding round the top of what's built so far
      c.lineWidth = 3.4;
      c.strokeStyle = T.ink;
      c.beginPath();
      c.moveTo(st.x - 56, st.y); c.lineTo(st.x - 56, top - 6);
      c.moveTo(st.x + 56, st.y); c.lineTo(st.x + 56, top - 6);
      c.moveTo(st.x - 60, top - 2); c.lineTo(st.x + 60, top - 2);
      c.stroke();
      c.lineWidth = 1.6;
      c.strokeStyle = T.paper;
      c.stroke();
    }
  }

  // The Feed: a giant phone in the ground, glowing. Everyone wants a look.
  function drawFeed(c) {
    var on = feed.on && feed.off <= 0;
    var x = feed.x, y = feed.y;
    if (on) {
      // its glow on the ground, in dots
      c.save();
      c.globalAlpha = 0.5 + Math.sin(feed.glow * 3) * 0.15;
      c.fillStyle = accentDots(c);
      c.beginPath();
      c.ellipse(x, y + 6, FEED_R, FEED_R * 0.55, 0, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }
    c.save();
    c.translate(x, y);
    c.rotate(-0.06);
    c.fillStyle = T.paper;
    c.strokeStyle = T.ink;
    c.lineWidth = 2.4;
    c.beginPath();
    roundRect(c, -15, -52, 30, 54, 6);
    c.fill();
    c.stroke();
    c.beginPath();
    roundRect(c, -11, -46, 22, 40, 2);
    c.fillStyle = on ? T.accent : T.ink;
    c.fill();
    if (on) {
      // a scrolling feed: lines of nothing
      c.fillStyle = T.paper;
      var scroll = (feed.glow * 14) % 10;
      for (var i = 0; i < 5; i++) {
        var ly = -44 + i * 10 - scroll;
        if (ly > -46 && ly < -10) { c.fillRect(-8, ly, 16, 2.4); c.fillRect(-8, ly + 3.6, 10, 1.6); }
      }
      // the red dot with a number in it
      c.beginPath();
      c.arc(11, -50, 6, 0, Math.PI * 2);
      c.fillStyle = T.red;
      c.fill();
      c.lineWidth = 1.4;
      c.stroke();
      c.fillStyle = T.paper;
      c.font = "8px " + T.display;
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText("99", 11, -49.5);
    }
    c.restore();
  }

  function roundRect(c, x, y, w, h, r) {
    if (c.roundRect) { c.roundRect(x, y, w, h, r); return; }
    c.rect(x, y, w, h);
  }

  var dotsCache = null;
  function accentDots(c) {
    if (!dotsCache) {
      var p = document.createElement("canvas");
      var n = Math.max(4, Math.round(5 * SC * DPR));
      p.width = p.height = n;
      var x = p.getContext("2d");
      x.fillStyle = T.accent;
      x.beginPath();
      x.arc(n / 2, n / 2, n * 0.22, 0, Math.PI * 2);
      x.fill();
      dotsCache = { canvas: p, n: n };
    }
    var pat = c.createPattern(dotsCache.canvas, "repeat");
    if (pat.setTransform && window.DOMMatrix) pat.setTransform(new DOMMatrix().scale(1 / (SC * DPR)));
    return pat;
  }

  // The Priest's cut, piling up next to the statue in a heap that spreads
  function drawFees(c) {
    var x = place.fees.x, y = place.fees.y, n = 0;
    var base = Math.ceil((Math.sqrt(8 * fees + 1) - 1) / 2);
    for (var row = 0; n < fees; row++) {
      var across = Math.max(1, base - row);
      for (var i = 0; i < across && n < fees; i++, n++) {
        c.beginPath();
        c.rect(x + (i - across / 2) * 8, y - 5 - row * 5, 8, 5);
        c.fillStyle = T.red;
        c.fill();
        c.lineWidth = 1.2;
        c.strokeStyle = T.ink;
        c.stroke();
      }
    }
  }

  function drawPerson(c, f) {
    if (f.state === "gone") return;
    var o = f.priest
      ? { back: f.back, censored: f.censored }
      : { back: f.back && f.state !== "stare", hat: f.hat, brick: f.carry, censored: f.censored, stare: f.state === "stare" };
    var spr = S.get(f.priest ? "priest" : "bean", o);
    var moving = Math.hypot(f.vx, f.vy) > 12;
    var hop = moving && !shell.reduceMotion ? Math.abs(Math.sin(f.phase)) * 1.8 : 0;
    var lean = moving && !shell.reduceMotion ? Math.sin(f.phase) * 0.06 : 0;
    // a shadow so they sit on the ground
    c.fillStyle = T.ash;
    c.beginPath();
    c.ellipse(f.x, f.y, f.priest ? 9 : 7, 2.4, 0, 0, Math.PI * 2);
    c.fill();
    c.save();
    c.translate(f.x, f.y - hop);
    if (f.state === "fall") {
      var k = Math.max(0.05, 1 - f.t / 0.9);
      c.rotate(f.t * 7);
      c.scale(k, k);
    } else if (f.state === "stun") {
      c.rotate(Math.sin(f.t * 30) * 0.25);
    } else c.rotate(lean);
    if (f.face < 0) c.scale(-1, 1);
    c.drawImage(spr.img, -spr.ox, -spr.oy, spr.w, spr.h);
    c.restore();
    if (f.state === "stun") {
      // sparks over the head
      c.strokeStyle = T.paper;
      c.lineWidth = 1.4;
      for (var i = 0; i < 3; i++) {
        var a = f.t * 8 + i * 2.1;
        var sx = f.x + Math.cos(a) * 9, sy = f.y - 30 + Math.sin(a) * 3;
        c.beginPath(); c.moveTo(sx - 2, sy); c.lineTo(sx + 2, sy); c.moveTo(sx, sy - 2); c.lineTo(sx, sy + 2); c.stroke();
      }
    }
  }

  // Your light: a pool of dots on the ground and a big hand pointing at it
  function drawLightPool(c) {
    c.save();
    c.fillStyle = accentDots(c);
    c.beginPath();
    c.ellipse(light.x, light.y, 40, 18, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();
    c.save();
    c.setLineDash([5, 6]);
    c.lineDashOffset = shell.reduceMotion ? 0 : -clock * 18;
    c.strokeStyle = T.paper;
    c.lineWidth = 1.6;
    c.beginPath();
    c.ellipse(light.x, light.y, 40, 18, 0, 0, Math.PI * 2);
    c.stroke();
    c.restore();
  }

  function drawHand(c) {
    var x = light.x, y = light.y - 46 + (shell.reduceMotion ? 0 : Math.sin(clock * 2.4) * 2);
    c.save();
    c.translate(x, y);
    c.lineJoin = "round";
    c.lineCap = "round";
    c.strokeStyle = T.ink;
    c.fillStyle = T.paper;
    c.lineWidth = 2.2;
    // cuff
    c.beginPath();
    c.rect(-8, -30, 16, 8);
    c.fillStyle = T.accent;
    c.fill();
    c.stroke();
    // mitten, finger pointing down
    c.beginPath();
    c.ellipse(0, -14, 10, 9, 0, 0, Math.PI * 2);
    c.fillStyle = T.paper;
    c.fill();
    c.stroke();
    c.beginPath();
    roundRect(c, -3.2, -12, 6.4, 18, 3.2);
    c.fill();
    c.stroke();
    c.beginPath();
    c.moveTo(-7, -11); c.lineTo(-7, -7);
    c.moveTo(-4, -9); c.lineTo(-4, -5);
    c.lineWidth = 1.2;
    c.stroke();
    c.restore();
  }

  function drawFx(c, list) {
    list.forEach(function (e) {
      var k = e.t / e.life;
      if (e.kind === "scorch") {
        c.globalAlpha = 1 - k;
        c.fillStyle = T.ash;
        c.beginPath();
        c.ellipse(e.x, e.y, 30, 12, 0, 0, Math.PI * 2);
        c.fill();
        c.globalAlpha = 1;
      } else if (e.kind === "bolt") {
        var r = seeded(Math.floor(e.seed) + 1);
        var pts = [], steps = 9;
        for (var i = 0; i <= steps; i++) {
          var yy = e.y - (1 - i / steps) * (e.y + 20);
          pts.push([e.x + (i === steps ? 0 : (r() - 0.5) * 26), yy]);
        }
        c.globalAlpha = k < 0.5 ? 1 : 2 - k * 2;
        [[7, T.ink], [3, T.paper]].forEach(function (s) {
          c.lineWidth = s[0];
          c.strokeStyle = s[1];
          c.lineJoin = "miter";
          c.beginPath();
          pts.forEach(function (p, i) { if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); });
          c.stroke();
        });
        c.beginPath();
        c.arc(e.x, e.y, SMITE_R * (0.4 + k), 0, Math.PI * 2);
        c.lineWidth = 3;
        c.strokeStyle = T.paper;
        c.stroke();
        c.globalAlpha = 1;
      } else if (e.kind === "puff") {
        // white circles with the accent offset behind (DESIGN.md, section 7)
        var rise = k * 14, grow = 0.7 + k * 0.8;
        c.globalAlpha = 1 - k * k;
        e.blobs.forEach(function (b) {
          c.fillStyle = T.accent;
          c.beginPath(); c.arc(e.x + b.x * grow + 1.6, e.y + b.y * grow - rise + 1.6, b.r * grow, 0, 7); c.fill();
        });
        e.blobs.forEach(function (b) {
          c.fillStyle = T.paper;
          c.beginPath(); c.arc(e.x + b.x * grow, e.y + b.y * grow - rise, b.r * grow, 0, 7); c.fill();
        });
        c.globalAlpha = 1;
      } else if (e.kind === "spark") {
        c.strokeStyle = T.paper;
        c.lineWidth = 1.6;
        c.globalAlpha = 1 - k;
        for (var j = 0; j < 4; j++) {
          var a = j * Math.PI / 2 + 0.4, r0 = 4 + k * 8, r1 = r0 + 4;
          c.beginPath();
          c.moveTo(e.x + Math.cos(a) * r0, e.y + Math.sin(a) * r0);
          c.lineTo(e.x + Math.cos(a) * r1, e.y + Math.sin(a) * r1);
          c.stroke();
        }
        c.globalAlpha = 1;
      }
    });
  }

  // A speech bubble: paper, ink outline, a tail, capitals. Drawn in screen
  // pixels so the words stay readable on a phone.
  function drawBubble(c, b) {
    var who = b.who;
    var ax = who.x * SC, ay = (who.y - (who === feed ? 60 : who.priest ? 44 : 34)) * SC;
    var size = clamp(SC * 10.5, 11, 15);
    c.font = size + "px " + T.display;
    var words = b.text.toUpperCase().split(" "), lines = [""];
    words.forEach(function (w) {
      var tryLine = lines[lines.length - 1] ? lines[lines.length - 1] + " " + w : w;
      if (tryLine.length > 24 && lines[lines.length - 1]) lines.push(w); else lines[lines.length - 1] = tryLine;
    });
    var tw = 0;
    lines.forEach(function (l) { tw = Math.max(tw, c.measureText(l).width); });
    var pad = size * 0.5, lh = size * 1.02;
    var bw = tw + pad * 2, bh = lines.length * lh + pad * 1.3;
    var bx = clamp(ax - bw / 2, 6, W - bw - 6), by = clamp(ay - bh - size * 0.7, 54, H - bh - 6);
    var tailX = clamp(ax, bx + 12, bx + bw - 12);
    var pop = shell.reduceMotion ? 1 : clamp(b.t * 8, 0, 1);
    c.globalAlpha = Math.min(pop, clamp((b.life - b.t) * 3, 0, 1));
    c.beginPath();
    var r = Math.min(9, bh / 2);
    c.moveTo(bx + r, by);
    c.arcTo(bx + bw, by, bx + bw, by + bh, r);
    c.arcTo(bx + bw, by + bh, bx, by + bh, r);
    c.lineTo(tailX + 6, by + bh);
    c.lineTo(tailX - 2, by + bh + size * 0.7);
    c.lineTo(tailX - 5, by + bh);
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
    c.globalAlpha = 1;
  }

  function render() {
    if (!ctx || !light) return;
    if (!hudEls) buildHud();
    if (!bg) bg = buildGround();
    var c = ctx;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.drawImage(bg, 0, 0);
    var sx = 0, sy = 0;
    if (shake > 0) { sx = (Math.random() - 0.5) * 6 * shake; sy = (Math.random() - 0.5) * 6 * shake; }
    c.setTransform(DPR * SC, 0, 0, DPR * SC, sx * DPR, sy * DPR);

    drawScorches(c);
    drawLightPool(c);

    // everything standing on the field, back to front
    var things = [];
    folk.forEach(function (f) { if (f.state !== "gone") things.push({ y: f.y, f: f }); });
    if (priest && priest.state !== "gone") things.push({ y: priest.y, f: priest });
    things.push({ y: place.site.y, draw: drawStatue });
    things.push({ y: feed.y, draw: drawFeed });
    things.push({ y: place.fees.y, draw: drawFees });
    things.sort(function (a, b) { return a.y - b.y; });
    things.forEach(function (t) { if (t.draw) t.draw(c); else drawPerson(c, t.f); });

    drawHand(c);
    drawOverFx(c);

    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    bubbles.forEach(function (b) { drawBubble(c, b); });
  }

  function drawScorches(c) { drawFx(c, fx.filter(function (e) { return e.kind === "scorch"; })); }
  function drawOverFx(c) { drawFx(c, fx.filter(function (e) { return e.kind !== "scorch"; })); }

  // ---------------------------------------------------------------------------
  // Start it up
  // ---------------------------------------------------------------------------
  shell = N.createGame({
    root: root,
    slug: "thonglets",
    title: "Thonglets",
    stamp: "Classified",
    tilt: -3,
    note: "They think you're god. Lead them to the bricks, then to the statue. Mind the pit.",
    hints: {
      keys: "Mouse, arrow keys or WASD to lead them. Click or Space to smite. P to pause.",
      touch: "Drag to lead them. Smite on the right."
    },
    againLabel: "Play again",
    aim: true,
    clickAction: true,
    touch: [
      { key: "action", label: "Smite", icon: "Smite", side: "right" }
    ],
    reset: reset,
    update: function (dt, input) { update(dt, input); },
    render: function () { render(); },
    resize: resize
  });
  T = shell.tokens;
  S.init(T, SC * DPR);

  // The canvas font may arrive after the first frame: redraw the signs when it does
  if (document.fonts && document.fonts.load) {
    document.fonts.load("12px " + T.display).then(function () { bg = null; statueImg = null; });
  }

  if (DEBUG) {
    window.__thonglets = {
      folk: function () { return folk; },
      priest: function () { return priest; },
      light: function () { return light; },
      feed: function () { return feed; },
      place: function () { return place; },
      score: function () { return { bricks: bricks, delivered: delivered, fees: fees, lost: lost, smitten: smitten, devotion: devotion, timeLeft: timeLeft }; },
      state: function () { return shell.state(); }
    };
  }
})();
