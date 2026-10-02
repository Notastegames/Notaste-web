// In Tray: the starter game. Catch the paperwork, file it before the coffee
// gets it. None of it will be read.
//
// This is the game to copy when starting a new one (DESIGN.md, section 12).
// It's small on purpose, and it uses every part of the kit a game needs:
// Notaste.createGame with reset / update / render / resize, a HUD, keys,
// pointer aim and a touch button, callouts, a notice (shell.brief), today's
// run (shell.random, shell.today), saved bests (shell.record), the results
// ladder and its Share result line, and an autopilot for ?autopilot and ?clip,
// which the play-through (tools/playtest.mjs) uses to play it to the end.
//
// Everything is measured in world units: 100 of them across the screen's
// shorter side, so the game looks the same at any size.
(function () {
  "use strict";

  var N = window.Notaste;
  var root = document.getElementById("game-root");
  if (!N || !root) return;

  var ROUND = 60;          // seconds in a round
  var TOPPLE = 12;         // a stack this tall falls over
  var TRAY_W = 30, TRAY_H = 8, TRAY_SPEED = 120;
  var FORM_W = 12, FORM_H = 15, CUP_W = 9, CUP_H = 12;
  var SHEET = 1.3;         // how tall one filed form is in the tray
  // EDIT: what each rung of the approval ladder needs, and what it says
  var RANKS = [
    { score: 500, line: "The paperwork has been filed. Nobody will ever read it. Well done." },
    { score: 250, line: "Most of it got filed. The rest is in a drawer, which counts." },
    { score: 80, line: "Some of it was filed. The coffee got the rest." },
    { score: 0, line: "The in tray is now a coffee tray." }
  ];

  var shell = null, T = null, ctx = null;
  var W = 1, H = 1, DPR = 1, U = 1, WW = 100, WH = 100;
  var tray, items, clock, spawnWait, stack, score, filed, soaked, prevAction, hudEls;
  var briefed = false;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function fmt(n) { return Math.round(n).toLocaleString("en-GB"); }
  function trayY() { return WH - TRAY_H - 4; }

  // ---------------------------------------------------------------------------
  // The round
  // ---------------------------------------------------------------------------
  function reset(sh) {
    shell = sh;
    T = sh.tokens;
    tray = { x: WW / 2 };
    items = [];
    clock = 0;
    spawnWait = 1;
    stack = score = filed = soaked = 0;
    prevAction = false;
    if (!hudEls) buildHud();
    paintHud();
  }

  // Everything that falls comes from shell.random, so today's run drops the
  // same forms in the same places for everyone.
  function spawn() {
    var r = shell.random, t = clock / ROUND;
    var coffee = r() < 0.18 + t * 0.14;
    items.push({
      kind: coffee ? "cup" : "form",
      x: FORM_W + r() * (WW - FORM_W * 2),
      y: -FORM_H,
      v: (26 + t * 22) * (0.85 + r() * 0.3),
      tilt: (r() - 0.5) * 0.5
    });
    spawnWait = 0.78 - t * 0.36 + r() * 0.28;
  }

  function file() {
    if (!stack) return;
    var points = stack * stack;    // bigger stacks score more: the risk is the coffee
    score += points;
    filed += stack;
    shell.callout(stack >= 8 ? "Filed. Unread" : "Filed");
    stack = 0;
  }

  function catchIt(item) {
    if (item.kind === "form") {
      stack++;
      shell.sound.tick();
      if (stack >= TOPPLE) {
        soaked += stack;
        stack = 0;
        shell.callout("Stack: wobbly");
      }
    } else if (stack) {
      soaked += stack;
      stack = 0;
      shell.callout("Coffee: on the forms");
      shell.sound.noise(0.35, { freq: 500, vol: 0.25 });
    } else {
      shell.sound.noise(0.2, { freq: 700, vol: 0.12 });
    }
  }

  function update(dt, input) {
    if (shell.state() !== "playing") return;
    clock += dt;

    // move: keys or a pad steer, a mouse or finger leads, or the autopilot drives
    var auto = N.flags.autopilot ? autopilot() : null;
    var want = auto ? auto.x : input.aim.on ? input.aim.x / U : null;
    if (want != null) tray.x += clamp(want - tray.x, -TRAY_SPEED * 1.6 * dt, TRAY_SPEED * 1.6 * dt);
    else tray.x += input.steer * TRAY_SPEED * dt;
    tray.x = clamp(tray.x, TRAY_W / 2, WW - TRAY_W / 2);

    var action = auto ? auto.file : input.action;
    if (action && !prevAction) file();
    prevAction = action;

    spawnWait -= dt;
    if (spawnWait <= 0 && clock < ROUND - 1.5) spawn();
    var top = trayY() - stack * SHEET;
    items = items.filter(function (it) {
      var was = it.y;
      it.y += it.v * dt;
      var h = it.kind === "form" ? FORM_H : CUP_H;
      if (was + h / 2 < top && it.y + h / 2 >= top && Math.abs(it.x - tray.x) < TRAY_W / 2 + 1) {
        catchIt(it);
        return false;
      }
      return it.y < WH + 20;
    });

    if (clock >= ROUND) end();
    paintHud();
  }

  // For ?autopilot and ?clip: head for the next form that can be reached,
  // file a decent stack, and file early if coffee is about to land.
  function autopilot() {
    var y = trayY(), best = null, danger = false;
    items.forEach(function (it) {
      var time = (y - it.y) / it.v;
      if (time < 0) return;
      if (it.kind === "cup") {
        if (time < 0.7 && Math.abs(it.x - tray.x) < TRAY_W) danger = true;
        return;
      }
      if (Math.abs(it.x - tray.x) > TRAY_SPEED * 1.6 * time + TRAY_W / 2) return;
      if (!best || time < best.time) best = { x: it.x, time: time };
    });
    return { x: best ? best.x : tray.x, file: stack >= 9 || (danger && stack > 0) || clock > ROUND - 1 };
  }

  function end() {
    soaked += stack;    // whatever's still in the tray goes unfiled
    stack = 0;
    var rank = 0;
    while (rank < RANKS.length - 1 && score < RANKS[rank].score) rank++;
    var rec = shell.record(score);
    var stats = [
      { label: "Score", value: fmt(score) },
      { label: "Filed", value: String(filed) },
      { label: "Soaked", value: String(soaked) },
      { label: rec.isNew ? (shell.daily ? "New best today" : "New best") : (shell.daily ? "Best today" : "Best"),
        value: fmt(rec.best || 0), highlight: rec.isNew }
    ];
    if (shell.daily) stats.unshift({ label: "Run", value: shell.today });
    shell.finish({
      place: rank + 1,
      total: RANKS.length,
      heading: filed ? "You filed " + filed + " forms." : "Nothing was filed.",
      line: RANKS[rank].line,
      stats: stats,
      share: fmt(score) + " points, " + filed + " forms filed"
    });
  }

  // ---------------------------------------------------------------------------
  // HUD: time top left, the score and the stack top right
  // ---------------------------------------------------------------------------
  function buildHud() {
    shell.hud.innerHTML =
      '<div class="kit-hud-tl"><p class="kit-stat"><small>Time</small><span data-time>1:00</span></p></div>' +
      '<div class="kit-hud-tr">' +
        '<p class="kit-stat kit-stat-big" data-score>0</p>' +
        '<p class="kit-stat"><small>Stack</small><span data-stack>0</span>/' + TOPPLE + '</p>' +
      '</div>';
    hudEls = {
      time: shell.hud.querySelector("[data-time]"),
      stack: shell.hud.querySelector("[data-stack]"),
      score: shell.hud.querySelector("[data-score]")
    };
  }

  function paintHud() {
    var left = Math.max(0, Math.ceil(ROUND - clock));
    hudEls.time.textContent = Math.floor(left / 60) + ":" + (left % 60 < 10 ? "0" : "") + (left % 60);
    hudEls.stack.textContent = String(stack);
    hudEls.score.textContent = fmt(score);
  }

  // ---------------------------------------------------------------------------
  // Drawing: thick ink outlines, flat fills, the four inks (DESIGN.md, section 7)
  // ---------------------------------------------------------------------------
  function outline(path, fill) {
    ctx.fillStyle = fill;
    ctx.strokeStyle = T.ink;
    ctx.lineWidth = 0.9;
    ctx.lineJoin = "round";
    path();
    ctx.fill();
    ctx.stroke();
  }

  function drawForm(x, y, tilt) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt);
    outline(function () { ctx.beginPath(); ctx.rect(-FORM_W / 2, -FORM_H / 2, FORM_W, FORM_H); }, T.paper);
    ctx.fillStyle = T.ink;
    for (var i = 0; i < 3; i++) ctx.fillRect(-FORM_W / 2 + 2, -FORM_H / 2 + 2.6 + i * 2.6, FORM_W - 4 - (i % 2) * 3, 0.8);
    ctx.strokeStyle = T.red;
    ctx.lineWidth = 0.6;
    ctx.strokeRect(FORM_W / 2 - 5.4, FORM_H / 2 - 4.2, 3.4, 2.4);   // sign here
    ctx.restore();
  }

  function drawCup(x, y) {
    var w = CUP_W, h = CUP_H;
    outline(function () {
      ctx.beginPath();
      ctx.moveTo(x - w / 2, y - h / 2 + 1.4);
      ctx.lineTo(x + w / 2, y - h / 2 + 1.4);
      ctx.lineTo(x + w / 2 - 1.2, y + h / 2);
      ctx.lineTo(x - w / 2 + 1.2, y + h / 2);
      ctx.closePath();
    }, T.paper);
    outline(function () { ctx.beginPath(); ctx.rect(x - w / 2 - 0.6, y - h / 2, w + 1.2, 1.8); }, T.paper);   // lid
    outline(function () { ctx.beginPath(); ctx.rect(x - w / 2 + 0.5, y - 0.6, w - 1, 3.4); }, T.red);       // sleeve
    // steam
    ctx.strokeStyle = T.paper;
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(x, y - h / 2 - 1.2);
    ctx.quadraticCurveTo(x + 2, y - h / 2 - 3.2, x, y - h / 2 - 5.2);
    ctx.stroke();
  }

  function drawTray() {
    var x = tray.x, y = trayY();
    // the stack: one block of paper with a line between each form
    if (stack) {
      var sw = FORM_W + 4, sh = stack * SHEET;
      outline(function () { ctx.beginPath(); ctx.rect(x - sw / 2, y - sh, sw, sh); }, T.paper);
      ctx.fillStyle = T.ink;
      for (var i = 1; i < stack; i++) ctx.fillRect(x - sw / 2, y - i * SHEET - 0.2, sw, 0.4);
    }
    outline(function () {
      ctx.beginPath();
      ctx.moveTo(x - TRAY_W / 2, y);
      ctx.lineTo(x + TRAY_W / 2, y);
      ctx.lineTo(x + TRAY_W / 2 - 1.5, y + TRAY_H);
      ctx.lineTo(x - TRAY_W / 2 + 1.5, y + TRAY_H);
      ctx.closePath();
    }, T.paper);
    ctx.fillStyle = T.ink;
    ctx.font = "5.4px " + T.display;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("In".toUpperCase(), x, y + TRAY_H / 2 + 0.3);
  }

  function render() {
    if (!ctx || !tray) return;
    // the notice goes up with the first countdown, so it's read before Go
    if (!briefed && shell.state() === "countdown") {
      briefed = true;
      shell.brief({ title: "Your in tray", ms: 4200,
                    text: "Catch the forms, then file them. Bigger stacks score more. Coffee soaks anything you haven't filed." });
    }
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.fillStyle = T.ink;
    ctx.fillRect(0, 0, W, H);
    ctx.setTransform(DPR * U, 0, 0, DPR * U, 0, 0);
    // the desk edge
    ctx.fillStyle = T.ash;
    ctx.fillRect(0, trayY() + TRAY_H, WW, 0.6);
    items.forEach(function (it) {
      if (it.kind === "form") drawForm(it.x, it.y, it.tilt + Math.sin(it.y * 0.08) * 0.15);
      else drawCup(it.x, it.y);
    });
    drawTray();
  }

  function resize(w, h, dpr) {
    var oldW = WW;
    W = w; H = h; DPR = dpr;
    U = Math.min(W, H) / 100;
    WW = W / U; WH = H / U;
    ctx = (shell ? shell.canvas : root.querySelector("canvas")).getContext("2d");
    // keep everything where it was, in proportion
    if (tray && oldW !== WW) {
      tray.x *= WW / oldW;
      items.forEach(function (it) { it.x *= WW / oldW; });
    }
  }

  // ---------------------------------------------------------------------------
  // Start it up. EDIT: everything here says what the game is and how it plays.
  // ---------------------------------------------------------------------------
  shell = N.createGame({
    root: root,
    slug: "starter",
    title: "In Tray",
    stamp: "Pending review",
    tilt: -4,
    note: "Sixty seconds. One tray. Nobody will read any of it.",
    pitch: "Catch the paperwork. File it before the coffee gets it.",
    hints: {
      keys: "Arrow keys, A and D, or the mouse to move. Space or click to file. P to pause.",
      touch: "Drag to move the tray. File on the right."
    },
    againLabel: "File again",
    aim: true,
    clickAction: true,
    daily: true,
    touch: [{ key: "action", label: "File", icon: "File", side: "right" }],
    reset: reset,
    update: function (dt, input) { update(dt, input); },
    render: render,
    resize: resize
  });
  T = shell.tokens;
})();
