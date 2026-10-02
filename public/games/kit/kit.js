// Notaste Games: the shared game kit.
// Every playable game loads /games/kit/kit.css and /games/kit/kit.js before its
// own script, and builds itself with Notaste.createGame(). The kit owns the
// parts every game shares, so they all look and behave the same: the Notaste
// intro, the title / pause / results screens, the countdown, stamp callouts,
// controls (keys, touch, gamepad), sound, fullscreen and saved bests.
// The rules behind all of it are in DESIGN.md at the root of the repo.
(function () {
  "use strict";

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------------------------------------------------------------------------
  // Tokens. Canvas drawing reads colours from the same CSS variables as the
  // site, so a colour only ever changes in one place (public/styles.css).
  // ---------------------------------------------------------------------------
  function tokens(el) {
    var cs = getComputedStyle(el || document.body);
    function v(name, fallback) {
      var value = cs.getPropertyValue(name).trim();
      return value || fallback;
    }
    return {
      ink: v("--ink", "#000000"),
      paper: v("--paper", "#ffffff"),
      red: v("--red", "#d7141a"),
      redPress: v("--red-press", "#a90f14"),
      smoke: v("--smoke", "#a6a6a6"),
      ash: v("--ash", "#2a2a2a"),
      accent: v("--accent", "#a6a6a6"),
      display: v("--display", "Impact, sans-serif"),
      body: v("--body", "sans-serif")
    };
  }

  // ---------------------------------------------------------------------------
  // Saved data: bests and settings only, in this browser, under notaste.<slug>.
  // Storage can be missing or full (private windows), so every call is guarded.
  // ---------------------------------------------------------------------------
  function store(slug) {
    var prefix = "notaste." + slug + ".";
    return {
      get: function (key, fallback) {
        try {
          var raw = localStorage.getItem(prefix + key);
          return raw == null ? fallback : JSON.parse(raw);
        } catch (e) { return fallback; }
      },
      set: function (key, value) {
        try { localStorage.setItem(prefix + key, JSON.stringify(value)); } catch (e) {}
      }
    };
  }

  // ---------------------------------------------------------------------------
  // Sound. Made in code, nothing to download. Starts only after the player
  // presses something (unlock), and one mute setting covers every game.
  // ---------------------------------------------------------------------------
  var sound = (function () {
    var ctx = null;
    var master = null;
    var noiseBuf = null;
    var muted = false;
    var VOLUME = 0.6;
    try { muted = localStorage.getItem("notaste.muted") === "1"; } catch (e) {}

    function unlock() {
      if (!ctx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = muted ? 0 : VOLUME;
        master.connect(ctx.destination);
        noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        var data = noiseBuf.getChannelData(0);
        for (var i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      }
      if (ctx.state === "suspended") ctx.resume().catch(function () {});
      return ctx;
    }

    function setMuted(value) {
      muted = !!value;
      try { localStorage.setItem("notaste.muted", muted ? "1" : "0"); } catch (e) {}
      if (master) master.gain.setTargetAtTime(muted ? 0 : VOLUME, ctx.currentTime, 0.02);
    }

    // A single beep. opts: type, vol, slide (frequency to glide to), delay (s)
    function tone(freq, dur, opts) {
      if (!ctx || ctx.state !== "running") return;
      opts = opts || {};
      var t = ctx.currentTime + (opts.delay || 0);
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = opts.type || "square";
      osc.frequency.setValueAtTime(freq, t);
      if (opts.slide) osc.frequency.exponentialRampToValueAtTime(opts.slide, t + dur);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(opts.vol || 0.12, t + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain);
      gain.connect(master);
      osc.start(t);
      osc.stop(t + dur + 0.05);
    }

    // A burst of filtered noise. opts: freq, q, type (filter), vol, delay
    function noise(dur, opts) {
      if (!ctx || ctx.state !== "running") return;
      opts = opts || {};
      var t = ctx.currentTime + (opts.delay || 0);
      var src = ctx.createBufferSource();
      src.buffer = noiseBuf;
      var filter = ctx.createBiquadFilter();
      filter.type = opts.type || "lowpass";
      filter.frequency.value = opts.freq || 900;
      filter.Q.value = opts.q || 0.8;
      var gain = ctx.createGain();
      gain.gain.setValueAtTime(opts.vol || 0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      src.start(t, Math.random() * 0.5);
      src.stop(t + dur + 0.05);
    }

    return {
      unlock: unlock,
      ctx: function () { return ctx; },
      out: function () { return master; },
      isMuted: function () { return muted; },
      setMuted: setMuted,
      toggle: function () { setMuted(!muted); return muted; },
      suspend: function () { if (ctx && ctx.state === "running") ctx.suspend().catch(function () {}); },
      resume: function () { if (ctx && ctx.state === "suspended") ctx.resume().catch(function () {}); },
      tone: tone,
      noise: noise,
      // The signature sound: a rubber stamp hitting paper. A low thump and a slap.
      stamp: function (delay) {
        tone(150, 0.2, { type: "sine", slide: 42, vol: 0.55, delay: delay });
        noise(0.08, { freq: 2200, vol: 0.32, delay: delay });
      },
      tick: function (delay) { tone(1150, 0.035, { vol: 0.05, delay: delay }); },
      whoosh: function (delay) { noise(0.45, { type: "bandpass", freq: 700, q: 0.6, vol: 0.18, delay: delay }); }
    };
  })();

  // ---------------------------------------------------------------------------
  // Small helpers
  // ---------------------------------------------------------------------------
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function pad2(n) { return (n < 10 ? "0" : "") + n; }

  // 83456 -> "1:23.46"
  function fmtTime(ms) {
    var t = Math.max(0, Math.round(ms / 10));
    return Math.floor(t / 6000) + ":" + pad2(Math.floor(t / 100) % 60) + "." + pad2(t % 100);
  }

  function ordinal(n) {
    var tens = n % 100;
    if (tens >= 11 && tens <= 13) return n + "th";
    return n + (["th", "st", "nd", "rd"][n % 10] || "th");
  }

  // The approval ladder (DESIGN.md, section 6): what the results stamp says.
  function ladder(place, total) {
    if (place <= 1) return "Approved";
    if (place >= total) return "Rejected";
    return (place - 1) / (total - 1) <= 0.5 ? "Pending review" : "Not approved";
  }

  var ICONS = {
    pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>',
    soundOn: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    soundOff: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 9.5l5 5M21.5 9.5l-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    full: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>',
    unfull: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4v5H4M20 9h-5V4M15 20v-5h5M4 15h5v5" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>',
    left: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.5 4.5v15L5 12z"/></svg>',
    right: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.5 4.5v15L19 12z"/></svg>',
    up: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 16.5h15L12 5z"/></svg>',
    down: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 7.5h15L12 19z"/></svg>'
  };

  // ---------------------------------------------------------------------------
  // The Notaste intro (DESIGN.md, section 8). The NO box slams down, TASTE
  // stamps in letter by letter, "Presents", then the game's title card and its
  // stamp, and hazard tape wipes it all away. The full version plays once per
  // visit; after that only the title card. Any key, click or tap skips it.
  // ---------------------------------------------------------------------------

  // Where each letter of TASTE ends in logo-on-dark.svg, as a share of its width
  var TASTE_CUTS = [53.9, 38.5, 25.9, 12.8, 0];
  var TAPE_WORDS = ["Not approved", "In poor taste", "Free to play", "Pending review", "Contains satire"];

  function intro(root, opts) {
    var seen = false;
    try { seen = sessionStorage.getItem("notaste.intro") === "1"; } catch (e) {}
    var full = !seen && !opts.short;

    return new Promise(function (resolve) {
      // box: catches taps. sheet: the black card that gets wiped away. tape: the
      // strip of hazard tape riding the edge of the wipe.
      var box = el("div", "kit-intro" + (full ? "" : " is-short") + (reduceMotion ? " is-calm" : ""));
      box.setAttribute("role", "img");
      box.setAttribute("aria-label", "Notaste Games presents " + opts.title);
      var sheet = el("div", "kit-intro-sheet");
      box.appendChild(sheet);

      var head = el("div", "kit-intro-head");
      var logo = el("div", "kit-intro-logo");
      var no = el("img", "kit-intro-no");
      var taste = el("img", "kit-intro-taste");
      no.src = taste.src = "/brand/logo-on-dark.svg";
      no.alt = taste.alt = "";
      logo.appendChild(no);
      logo.appendChild(taste);
      // ink flicked off the stamp when it lands
      var ink = el("div", "kit-intro-ink");
      for (var i = 0; i < 9; i++) {
        var drop = el("span");
        var angle = (i / 9) * Math.PI * 2 + Math.random() * 0.5;
        var dist = 34 + Math.random() * 56;
        drop.style.setProperty("--dx", (Math.cos(angle) * dist).toFixed(0) + "px");
        drop.style.setProperty("--dy", (Math.sin(angle) * dist).toFixed(0) + "px");
        drop.style.setProperty("--s", (0.45 + Math.random() * 0.9).toFixed(2));
        ink.appendChild(drop);
      }
      logo.appendChild(ink);
      head.appendChild(logo);
      head.appendChild(el("p", "kit-intro-presents", "Presents"));
      sheet.appendChild(head);

      var card = el("div", "kit-intro-card");
      card.appendChild(el("p", "kit-intro-title", opts.title));
      var stamp = el("span", "stamp-label", opts.stamp || "Not approved");
      stamp.style.setProperty("--tilt", (opts.tilt != null ? opts.tilt : -6) + "deg");
      card.appendChild(stamp);
      sheet.appendChild(card);

      var tapeWrap = el("div", "kit-intro-tape");
      var tape = el("div", "tape");
      var track = el("div", "tape-track");
      for (var r = 0; r < 3; r++) {
        TAPE_WORDS.forEach(function (word) { track.appendChild(el("span", null, word)); });
      }
      tape.appendChild(track);
      tapeWrap.appendChild(tape);
      box.appendChild(tapeWrap);

      root.appendChild(box);

      var timers = [];
      var finished = false;
      function at(ms, fn) { timers.push(window.setTimeout(fn, ms)); }
      function phase(name) { box.classList.add("is-" + name); }

      function done() {
        if (finished) return;
        finished = true;
        timers.forEach(window.clearTimeout);
        box.removeEventListener("pointerdown", skip);
        document.removeEventListener("keydown", skip, true);
        if (full) { try { sessionStorage.setItem("notaste.intro", "1"); } catch (e) {} }
        if (box.parentNode) box.parentNode.removeChild(box);
        resolve();
      }

      function skip(e) {
        if (e && e.type === "keydown") { e.preventDefault(); e.stopPropagation(); }
        if (finished) return;
        timers.forEach(window.clearTimeout);
        timers = [];
        box.classList.add("is-skipped");
        at(160, done);
      }

      box.addEventListener("pointerdown", skip);
      document.addEventListener("keydown", skip, true);

      if (reduceMotion) {
        // Calm version: the same frames, faded rather than slammed
        if (full) {
          at(30, function () { phase("logo"); phase("word"); });
          at(500, function () { phase("presents"); });
          at(1400, function () { phase("card"); phase("stamp"); });
          at(2600, function () { phase("out"); });
          at(2900, done);
        } else {
          at(30, function () { phase("card"); phase("stamp"); });
          at(1100, function () { phase("out"); });
          at(1400, done);
        }
        return;
      }

      var t = 0;
      if (full) {
        at(100, function () { phase("logo"); });
        at(330, function () { sound.stamp(); phase("hit"); });
        TASTE_CUTS.forEach(function (cut, n) {
          at(560 + n * 80, function () {
            taste.style.setProperty("--cut", cut + "%");
            if (n === 0) phase("word");
            sound.tick();
          });
        });
        at(1080, function () { phase("presents"); });
        at(1750, function () { phase("away"); });
        t = 1900;
      }
      at(t, function () { phase("card"); });
      at(t + 120, function () { sound.stamp(); });
      at(t + 420, function () { phase("stamp"); });
      at(t + 600, function () { sound.stamp(); });
      at(t + 1150, function () { phase("wipe"); sound.whoosh(); });
      at(t + 1150 + 640, done);
    });
  }

  // ---------------------------------------------------------------------------
  // Controls. Keyboard, on-screen touch buttons and gamepads all write into one
  // input object the game reads each frame. input.mode says which was used last.
  // ---------------------------------------------------------------------------
  var DEFAULT_KEYS = {
    up: ["ArrowUp", "KeyW"],
    down: ["ArrowDown", "KeyS"],
    left: ["ArrowLeft", "KeyA"],
    right: ["ArrowRight", "KeyD"],
    action: ["Space"]
  };

  // ---------------------------------------------------------------------------
  // createGame: builds the shell inside #game-root and runs the loop.
  //
  //   Notaste.createGame({
  //     root, slug, title, stamp, note, againLabel,
  //     hints: { keys: "...", touch: "..." },
  //     touch: [{ key: "left", label: "Steer left", icon: "◀", side: "left" }, ...],
  //     reset(shell),            a fresh round: put everything on the start line
  //     update(dt, input, shell), every frame while playing (and after the finish)
  //     render(dt, shell),        every frame while the game is on screen
  //     resize(width, height, dpr)
  //   })
  //
  // The game calls shell.callout(text) for in-game stamps and
  // shell.finish({ place, total, heading, line, stats }) when the round ends.
  // ---------------------------------------------------------------------------
  function createGame(game) {
    var root = game.root;
    var screen = root.closest(".screen") || root;
    var keys = game.keys || DEFAULT_KEYS;
    var state = "title";
    var raf = 0;
    var last = 0;
    var input = { up: false, down: false, left: false, right: false, action: false, steer: 0, mode: "keys" };
    var touchHeld = {};
    var padHeld = {};
    var keyHeld = {};
    var tapped = {};      // pressed since the last frame, so a quick tap is never missed
    var pausedFrom = null;
    var countTimers = [];
    var finishTimer = 0;
    var calloutTimer = 0;
    var started = false;

    // ---------- Build the shell ----------
    root.textContent = "";
    root.classList.add("kit");
    root.setAttribute("data-kit", "title");

    var canvas = el("canvas", "kit-canvas");
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", game.title + ". " + (game.hints && game.hints.keys || ""));
    root.appendChild(canvas);

    var hud = el("div", "kit-hud");
    root.appendChild(hud);

    var bar = el("div", "kit-bar");
    var pauseBtn = el("button", "kit-icon");
    pauseBtn.type = "button";
    pauseBtn.innerHTML = ICONS.pause;
    pauseBtn.setAttribute("aria-label", "Pause");
    var soundBtn = el("button", "kit-icon");
    soundBtn.type = "button";
    var fullBtn = el("button", "kit-icon");
    fullBtn.type = "button";
    bar.appendChild(pauseBtn);
    bar.appendChild(soundBtn);
    bar.appendChild(fullBtn);
    root.appendChild(bar);

    var touch = el("div", "kit-touch");
    var touchLeft = el("div", "kit-touch-side kit-touch-left");
    var touchRight = el("div", "kit-touch-side kit-touch-right");
    (game.touch || []).forEach(function (b) {
      var btn = el("button", "kit-pad");
      btn.type = "button";
      btn.setAttribute("aria-label", b.label);
      btn.setAttribute("data-key", b.key);
      // icon: one of the kit's arrows ("left", "right", "up", "down") or a short word
      var face = el("span", "kit-pad-face");
      if (ICONS[b.icon]) face.innerHTML = ICONS[b.icon];
      else face.textContent = b.icon || b.label;
      btn.appendChild(face);
      (b.side === "right" ? touchRight : touchLeft).appendChild(btn);
    });
    touch.appendChild(touchLeft);
    touch.appendChild(touchRight);
    root.appendChild(touch);

    var callouts = el("div", "kit-callouts");
    callouts.setAttribute("aria-hidden", "true");
    root.appendChild(callouts);

    var count = el("div", "kit-count");
    count.setAttribute("aria-hidden", "true");
    root.appendChild(count);

    // Title screen
    var titlePanel = el("section", "kit-panel kit-title");
    titlePanel.setAttribute("aria-label", game.title);
    titlePanel.appendChild(el("p", "kit-title-name", game.title));
    var startBtn = el("button", "btn kit-start", "Press start");
    startBtn.type = "button";
    titlePanel.appendChild(startBtn);
    if (game.note) titlePanel.appendChild(el("p", "kit-note", game.note));
    if (game.hints) {
      var hint = el("p", "kit-hint");
      if (game.hints.keys) hint.appendChild(el("span", "kit-hint-keys", game.hints.keys));
      if (game.hints.touch) hint.appendChild(el("span", "kit-hint-touch", game.hints.touch));
      titlePanel.appendChild(hint);
    }
    root.appendChild(titlePanel);

    // Pause screen
    var pausePanel = el("section", "kit-panel kit-pause");
    pausePanel.setAttribute("aria-label", "Paused");
    var pauseStamp = el("span", "stamp-label", "Paused");
    pausePanel.appendChild(pauseStamp);
    var pauseActions = el("div", "kit-actions");
    var resumeBtn = el("button", "btn", "Resume");
    resumeBtn.type = "button";
    var restartBtn = el("button", "kit-quiet", "Restart");
    restartBtn.type = "button";
    var quitBtn = el("button", "kit-quiet", "Quit to title");
    quitBtn.type = "button";
    pauseActions.appendChild(resumeBtn);
    pauseActions.appendChild(restartBtn);
    pauseActions.appendChild(quitBtn);
    pausePanel.appendChild(pauseActions);
    root.appendChild(pausePanel);

    // Results screen
    var resultsPanel = el("section", "kit-panel kit-results");
    resultsPanel.setAttribute("aria-label", "Results");
    var resultStamp = el("span", "stamp-label");
    var resultHeading = el("h2", "kit-heading");
    resultHeading.tabIndex = -1;
    var resultLine = el("p", "kit-line");
    var resultStats = el("dl", "kit-stats");
    var resultActions = el("div", "kit-actions");
    var againBtn = el("button", "btn", game.againLabel || "Play again");
    againBtn.type = "button";
    var allLink = el("a", "text-link", "All games");
    allLink.href = "/#games";
    resultActions.appendChild(againBtn);
    resultActions.appendChild(allLink);
    resultsPanel.appendChild(resultStamp);
    resultsPanel.appendChild(resultHeading);
    resultsPanel.appendChild(resultLine);
    resultsPanel.appendChild(resultStats);
    resultsPanel.appendChild(resultActions);
    root.appendChild(resultsPanel);

    var live = el("p", "kit-sr");
    live.setAttribute("aria-live", "polite");
    root.appendChild(live);

    var shell = {
      root: root,
      canvas: canvas,
      hud: hud,
      input: input,
      tokens: tokens(root),
      store: store(game.slug),
      sound: sound,
      reduceMotion: reduceMotion,
      state: function () { return state; },
      callout: callout,
      finish: finish,
      announce: announce
    };

    function setState(next) {
      state = next;
      root.setAttribute("data-kit", next);
      if (next === "title") screen.classList.remove("kit-live");
      else screen.classList.add("kit-live");
    }

    function announce(text) {
      live.textContent = "";
      window.setTimeout(function () { live.textContent = text; }, 40);
    }

    // ---------- Sizing ----------
    var dpr = 1;
    function resize() {
      var w = root.clientWidth;
      var h = root.clientHeight;
      if (!w || !h) return;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      if (game.resize) game.resize(w, h, dpr);
      if (started) game.render(0, shell);
    }
    if (window.ResizeObserver) new ResizeObserver(resize).observe(root);
    else window.addEventListener("resize", resize);
    resize();

    // ---------- Loop ----------
    function frame(now) {
      raf = window.requestAnimationFrame(frame);
      var dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      pollPads();
      combineInput();
      if (state === "playing" || state === "ending" || state === "results") game.update(dt, input, shell);
      game.render(dt, shell);
    }
    function startLoop() {
      if (raf) return;
      last = 0;
      raf = window.requestAnimationFrame(frame);
    }
    function stopLoop() {
      if (raf) window.cancelAnimationFrame(raf);
      raf = 0;
    }

    // ---------- Flow ----------
    function begin() {
      sound.unlock();
      started = true;
      game.reset(shell);
      resize();
      setState("intro");
      startLoop();
      intro(root, { title: game.title, stamp: game.stamp, tilt: game.tilt }).then(countdown);
    }

    function restart() {
      clearTimers();
      callouts.textContent = "";
      game.reset(shell);
      sound.resume();
      startLoop();
      countdown();
    }

    function quit() {
      clearTimers();
      callouts.textContent = "";
      count.textContent = "";
      stopLoop();
      exitFull();
      setState("title");
      sound.suspend();
      startBtn.focus({ preventScroll: true });
    }

    function clearTimers() {
      countTimers.forEach(window.clearTimeout);
      countTimers = [];
      window.clearTimeout(finishTimer);
    }

    // 3, 2, 1, Go. Each one a stamp with a beep.
    function countdown() {
      setState("countdown");
      clearTimers();
      var steps = ["3", "2", "1", "Go"];
      var gap = reduceMotion ? 650 : 700;
      steps.forEach(function (word, i) {
        countTimers.push(window.setTimeout(function () {
          count.textContent = "";
          var s = el("span", "stamp-label" + (i === 3 ? " is-go" : ""), word);
          s.style.setProperty("--tilt", (i % 2 ? 5 : -5) + "deg");
          count.appendChild(s);
          if (i < 3) sound.tone(520, 0.12, { vol: 0.1 });
          else sound.tone(1040, 0.32, { vol: 0.12 });
          if (i === 3) setState("playing");
        }, 250 + i * gap));
      });
      countTimers.push(window.setTimeout(function () { count.textContent = ""; }, 250 + 3 * gap + 600));
    }

    function pause() {
      if (state !== "playing" && state !== "countdown") return;
      pausedFrom = state;
      clearTimers();
      count.textContent = "";
      setState("paused");
      sound.suspend();
      resumeBtn.focus({ preventScroll: true });
    }

    function resume() {
      if (state !== "paused") return;
      sound.resume();
      last = 0;
      if (pausedFrom === "countdown") countdown();
      else setState("playing");
      root.focus({ preventScroll: true });
    }

    // In-game stamps: one at a time, decoration only (aria-hidden)
    function callout(text, opts) {
      opts = opts || {};
      callouts.textContent = "";
      var s = el("span", "stamp-label", text);
      s.style.setProperty("--tilt", (opts.tilt != null ? opts.tilt : (Math.random() * 10 - 5)).toFixed(1) + "deg");
      callouts.appendChild(s);
      if (opts.sound !== false) sound.stamp();
      window.clearTimeout(calloutTimer);
      calloutTimer = window.setTimeout(function () { callouts.textContent = ""; }, opts.ms || 1500);
    }

    // The round is over. Show the results after a moment to let it land.
    function finish(result) {
      if (state !== "playing") return;
      setState("ending");
      finishTimer = window.setTimeout(function () {
        resultStamp.textContent = result.stamp || ladder(result.place, result.total);
        resultStamp.style.setProperty("--tilt", (result.place % 2 ? -5 : 4) + "deg");
        resultHeading.textContent = result.heading;
        resultLine.textContent = result.line || "";
        resultStats.textContent = "";
        (result.stats || []).forEach(function (row) {
          var wrap = el("div", row.highlight ? "is-new" : null);
          wrap.appendChild(el("dt", null, row.label));
          wrap.appendChild(el("dd", null, row.value));
          resultStats.appendChild(wrap);
        });
        setState("results");
        sound.stamp(0.15);
        againBtn.focus({ preventScroll: true });
        announce(result.heading + " " + (result.stats || []).map(function (r) { return r.label + " " + r.value + "."; }).join(" "));
      }, result.delay != null ? result.delay : 1400);
    }

    startBtn.addEventListener("click", begin);
    againBtn.addEventListener("click", restart);
    resumeBtn.addEventListener("click", resume);
    restartBtn.addEventListener("click", restart);
    quitBtn.addEventListener("click", quit);
    pauseBtn.addEventListener("click", function () { if (state === "paused") resume(); else pause(); });

    // ---------- Sound button ----------
    function paintSound() {
      var m = sound.isMuted();
      soundBtn.innerHTML = m ? ICONS.soundOff : ICONS.soundOn;
      soundBtn.setAttribute("aria-label", m ? "Turn sound on" : "Turn sound off");
    }
    soundBtn.addEventListener("click", function () { sound.toggle(); paintSound(); });
    paintSound();

    // ---------- Fullscreen ----------
    // Real fullscreen where the browser allows it, otherwise the screen fills
    // the window (iPhones can't make a page element fullscreen).
    function isFull() {
      return !!(document.fullscreenElement || document.webkitFullscreenElement) || screen.classList.contains("kit-full");
    }
    function paintFull() {
      var f = isFull();
      fullBtn.innerHTML = f ? ICONS.unfull : ICONS.full;
      fullBtn.setAttribute("aria-label", f ? "Exit fullscreen" : "Fullscreen");
    }
    function enterFull() {
      var req = screen.requestFullscreen || screen.webkitRequestFullscreen;
      if (req) {
        var p = req.call(screen);
        if (p && p.catch) p.catch(fakeFull);
      } else {
        fakeFull();
      }
    }
    function fakeFull() {
      screen.classList.add("kit-full");
      document.documentElement.classList.add("kit-lock");
      paintFull();
    }
    function exitFull() {
      if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(function () {});
      else if (document.webkitFullscreenElement && document.webkitExitFullscreen) document.webkitExitFullscreen();
      screen.classList.remove("kit-full");
      document.documentElement.classList.remove("kit-lock");
      paintFull();
    }
    fullBtn.addEventListener("click", function () { if (isFull()) exitFull(); else enterFull(); });
    document.addEventListener("fullscreenchange", paintFull);
    document.addEventListener("webkitfullscreenchange", paintFull);
    paintFull();

    // ---------- Keyboard ----------
    var keyToAction = {};
    Object.keys(keys).forEach(function (action) {
      keys[action].forEach(function (code) { keyToAction[code] = action; });
    });
    function codeOf(e) {
      // e.code is the key's position (so WASD works on any layout); arrows by name
      return keyToAction[e.code] ? e.code : (keyToAction[e.key] ? e.key : null);
    }
    var active = { countdown: 1, playing: 1, ending: 1, paused: 1 };

    document.addEventListener("keydown", function (e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (state === "title" || state === "intro") return;
      // Enter and Space on a focused button (Resume, Restart) belong to the button
      var target = e.target;
      if ((e.key === "Enter" || e.key === " ") && target && target.closest && target.closest("button, a")) return;
      if (e.code === "KeyP" || e.key === "Escape") {
        if (state === "paused") resume(); else pause();
        e.preventDefault();
        return;
      }
      if (e.code === "KeyM") { sound.toggle(); paintSound(); return; }
      var code = codeOf(e);
      if (!code) return;
      if (active[state]) e.preventDefault();
      keyHeld[keyToAction[code]] = true;
      tapped[keyToAction[code]] = true;
      input.mode = "keys";
      root.classList.remove("kit-touching");
    });
    document.addEventListener("keyup", function (e) {
      var code = codeOf(e);
      if (code) keyHeld[keyToAction[code]] = false;
    });

    // Let go of everything when focus leaves, and pause the game
    function releaseAll() { keyHeld = {}; touchHeld = {}; }
    window.addEventListener("blur", function () { releaseAll(); pause(); });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { releaseAll(); pause(); }
    });

    // Pause if the game is scrolled mostly out of view
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (entries) {
        if (entries[0].intersectionRatio < 0.35 && !isFull()) pause();
      }, { threshold: [0, 0.35] }).observe(root);
    }

    // ---------- Touch ----------
    var coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
    if (coarse) root.classList.add("kit-touching");
    var pointers = {};

    function padAt(x, y) {
      var hit = document.elementFromPoint(x, y);
      var pad = hit && hit.closest ? hit.closest(".kit-pad") : null;
      return pad && touch.contains(pad) ? pad : null;
    }
    function syncPads() {
      touchHeld = {};
      Object.keys(pointers).forEach(function (id) {
        var pad = pointers[id];
        if (pad) touchHeld[pad.getAttribute("data-key")] = true;
      });
      Array.prototype.forEach.call(touch.querySelectorAll(".kit-pad"), function (pad) {
        pad.classList.toggle("is-down", !!touchHeld[pad.getAttribute("data-key")]);
      });
    }
    root.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse") return;
      root.classList.add("kit-touching");
      input.mode = "touch";
      var pad = padAt(e.clientX, e.clientY);
      if (pad) {
        e.preventDefault();
        tapped[pad.getAttribute("data-key")] = true;
        pointers[e.pointerId] = pad;
        syncPads();
      }
    });
    root.addEventListener("pointermove", function (e) {
      if (!(e.pointerId in pointers)) return;
      // slide a thumb from one button to its neighbour without lifting
      pointers[e.pointerId] = padAt(e.clientX, e.clientY);
      syncPads();
    });
    function lift(e) {
      if (!(e.pointerId in pointers)) return;
      delete pointers[e.pointerId];
      syncPads();
    }
    root.addEventListener("pointerup", lift);
    root.addEventListener("pointercancel", lift);
    // stop the long-press menu on the buttons
    touch.addEventListener("contextmenu", function (e) { e.preventDefault(); });

    // ---------- Gamepads ----------
    var padStartWas = false;
    function pollPads() {
      padHeld = {};
      input.steer = 0;
      if (!navigator.getGamepads) return;
      var pads = navigator.getGamepads();
      for (var i = 0; i < pads.length; i++) {
        var p = pads[i];
        if (!p || !p.connected) continue;
        var b = p.buttons;
        var down = function (n) { return b[n] && (b[n].pressed || b[n].value > 0.4); };
        var x = p.axes[0] || 0;
        if (Math.abs(x) > 0.18) { input.steer = x; padHeld[x < 0 ? "left" : "right"] = true; }
        if (down(14)) { padHeld.left = true; input.steer = -1; }
        if (down(15)) { padHeld.right = true; input.steer = 1; }
        if (down(0) || down(7) || down(12)) padHeld.up = true;
        if (down(1) || down(6) || down(13)) padHeld.down = true;
        if (down(2)) padHeld.action = true;
        var startNow = down(9);
        if (startNow && !padStartWas) { if (state === "paused") resume(); else pause(); }
        padStartWas = startNow;
        if (Object.keys(padHeld).length) input.mode = "pad";
      }
    }

    function combineInput() {
      ["up", "down", "left", "right", "action"].forEach(function (k) {
        input[k] = !!(keyHeld[k] || touchHeld[k] || padHeld[k] || tapped[k]);
      });
      tapped = {};
      if (!input.steer) input.steer = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    }

    root.tabIndex = -1;
    return shell;
  }

  window.Notaste = {
    tokens: tokens,
    store: store,
    sound: sound,
    intro: intro,
    createGame: createGame,
    fmtTime: fmtTime,
    ordinal: ordinal,
    ladder: ladder
  };
})();
