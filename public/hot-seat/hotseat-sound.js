/* The Hot Seat sound kit. Every sound is built in code with Web Audio, so
   there are no sample files to load, license or fetch from anywhere.
   Sound is off until the game calls setEnabled(true); the game stores the
   player's choice itself.

   HotSeatSound.unlock()            on every tap; cheap and safe to repeat
   HotSeatSound.setEnabled(bool)    .enabled reads it back
   HotSeatSound.play(cue, opts)     cues listed in SOUNDS below
   HotSeatSound.rumble(level)       every frame, 0 (no tram) to 1 (right here)
   HotSeatSound.thinking(level)     optional hum while the AI thinks, 0 stops it
   HotSeatSound.stopAll()           Start over, end of a run

   opts for any cue: { delay } in seconds, and { pan } from -1 (left) to 1
   (right) for the scene sounds, so tram 1 can sit left and tram 2 right.
   While sound is off nothing is built or played. */
(function (root) {
  'use strict';
  var AC = root.AudioContext || root.webkitAudioContext;
  var ctx = null, out = null, wet = null, white = null, brown = null;
  var muted = true, hum = null, nerves = null;

  function boot() {
    if (ctx || !AC) return ctx;
    ctx = new AC();
    var comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 10; comp.ratio.value = 4;
    comp.attack.value = 0.004; comp.release.value = 0.2;
    out = ctx.createGain(); out.gain.value = 0.8;
    out.connect(comp); comp.connect(ctx.destination);
    var verb = ctx.createConvolver(); verb.buffer = impulse(1.6);
    wet = ctx.createGain(); wet.gain.value = 0.5;
    wet.connect(verb); verb.connect(out);
    white = noise(false); brown = noise(true);
    return ctx;
  }

  function live() {
    if (muted || !boot()) return null;
    if (ctx.state !== 'running') wake();
    return ctx;
  }

  function wake() { var p = ctx.resume(); if (p && p.catch) p.catch(function () {}); }

  /* Older iOS only opens audio after a sound starts inside a tap. */
  function unlock() {
    if (muted || !boot()) return;
    if (ctx.state !== 'running') wake();
    if (unlock.done) return;
    var b = ctx.createBufferSource(); b.buffer = ctx.createBuffer(1, 1, 22050);
    b.connect(ctx.destination); b.start(0); unlock.done = true;
  }

  function noise(isBrown) {
    var len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0), last = 0;
    for (var i = 0; i < len; i++) {
      var w = Math.random() * 2 - 1;
      if (isBrown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w;
    }
    return buf;
  }

  /* A dark open-air tail: a footbridge at night, not a hall. */
  function impulse(sec) {
    var len = Math.floor(ctx.sampleRate * sec), pre = Math.floor(ctx.sampleRate * 0.015);
    var buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (var c = 0; c < 2; c++) {
      var d = buf.getChannelData(c), y = 0;
      for (var i = pre; i < len; i++) {
        y += ((Math.random() * 2 - 1) - y) * 0.3;
        d[i] = y * Math.pow(1 - i / len, 3);
      }
    }
    return buf;
  }

  /* Output strip for one sound: optional pan, optional reverb send. */
  function strip(pan, send) {
    var g = ctx.createGain(), node = g;
    if (pan && ctx.createStereoPanner) {
      var p = ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan));
      g.connect(p); node = p;
    }
    node.connect(out);
    if (send) { var s = ctx.createGain(); s.gain.value = send; node.connect(s); s.connect(wet); }
    return g;
  }

  function env(p, t, a, peak, d) {
    p.setValueAtTime(0.0001, t);
    p.exponentialRampToValueAtTime(peak, t + a);
    p.exponentialRampToValueAtTime(0.0001, t + a + d);
  }

  /* o: type, f, to, glide, t, a, peak, d */
  function tone(dest, o) {
    var osc = ctx.createOscillator(), g = ctx.createGain(), a = o.a || 0.002;
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f, o.t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, o.t + (o.glide || o.d));
    env(g.gain, o.t, a, o.peak, o.d);
    osc.connect(g); g.connect(dest);
    osc.start(o.t); osc.stop(o.t + a + o.d + 0.05);
    return osc;
  }

  /* o: filter type, f, q, to, glide, t, a, peak, d, brown */
  function hiss(dest, o) {
    var src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(), a = o.a || 0.001;
    src.buffer = o.brown ? brown : white; src.loop = true;
    f.type = o.type || 'bandpass'; f.Q.value = o.q || 1;
    f.frequency.setValueAtTime(o.f, o.t);
    if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, o.t + (o.glide || o.d));
    env(g.gain, o.t, a, o.peak, o.d);
    src.connect(f); f.connect(g); g.connect(dest);
    src.start(o.t, Math.random() * 1.5); src.stop(o.t + a + o.d + 0.05);
  }

  function at(o) { return ctx.currentTime + (o.delay || 0); }
  function clamp(v) { return Math.max(0, Math.min(1, +v || 0)); }

  /* Spring doorstop: a fast wobble that settles. */
  function boing(dest, t) {
    var osc = ctx.createOscillator(), lfo = ctx.createOscillator(), depth = ctx.createGain();
    var lp = ctx.createBiquadFilter(), g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.05);
    osc.frequency.exponentialRampToValueAtTime(235, t + 0.9);
    lfo.frequency.setValueAtTime(17, t); lfo.frequency.linearRampToValueAtTime(9, t + 0.9);
    depth.gain.setValueAtTime(80, t); depth.gain.exponentialRampToValueAtTime(3, t + 0.9);
    lp.type = 'lowpass'; lp.frequency.value = 1900; lp.Q.value = 2;
    lfo.connect(depth); depth.connect(osc.frequency);
    env(g.gain, t, 0.006, 0.32, 0.95);
    osc.connect(lp); lp.connect(g); g.connect(dest);
    osc.start(t); lfo.start(t); osc.stop(t + 1.05); lfo.stop(t + 1.05);
  }

  var SOUNDS = {
    /* Tram gong, struck twice. { pan, times } */
    bell: function (o) {
      var t = at(o), dest = strip(o.pan, 0.45), times = o.times || 2;
      var parts = [[0.5, 0.25, 2.0], [1, 1, 1.7], [1.004, 0.6, 1.5], [2.0, 0.3, 1.0], [2.76, 0.45, 0.75], [4.07, 0.2, 0.45], [5.4, 0.12, 0.3]];
      for (var s = 0; s < times; s++) {
        var st = t + s * 0.2, v = s ? 0.8 : 1;
        parts.forEach(function (p) { tone(dest, { f: 830 * p[0], t: st, a: 0.002, peak: 0.13 * p[1] * v, d: p[2] }); });
        hiss(dest, { type: 'highpass', f: 3500, t: st, d: 0.03, peak: 0.2 * v });
      }
    },

    /* Floor lever thrown. The clunk lands on the call; { ratchet: true } adds
       a short ratchet first and moves the clunk 0.16 s later. { pan } */
    clunk: function (o) {
      var t = at(o), dest = strip(o.pan, 0.2), h = o.ratchet ? t + 0.16 : t;
      if (o.ratchet) for (var i = 0; i < 3; i++) hiss(dest, { f: 3400 - i * 300, q: 3, t: t + i * 0.045, d: 0.02, peak: 0.22 });
      tone(dest, { f: 160, to: 50, glide: 0.1, t: h, d: 0.3, peak: 1 });
      hiss(dest, { type: 'lowpass', f: 1100, t: h, d: 0.08, peak: 0.5 });
      tone(dest, { type: 'triangle', f: 640, t: h, d: 0.22, peak: 0.12 });
      tone(dest, { f: 1510, t: h, d: 0.14, peak: 0.05 });
    },

    /* Cartoon hit: slap, thud and a spring boing. No crunch. { pan, boing: false } */
    hit: function (o) {
      var t = at(o), dest = strip(o.pan, 0.3);
      hiss(dest, { f: 1300, q: 0.9, t: t, d: 0.09, peak: 1.3 });
      hiss(dest, { type: 'highpass', f: 3000, t: t, d: 0.035, peak: 0.35 });
      tone(dest, { f: 150, to: 45, glide: 0.12, t: t, d: 0.3, peak: 1.2 });
      if (o.boing !== false) boing(dest, t + 0.06);
    },

    /* Steel wheels squealing as a tram brakes. { pan, duration } */
    brake: function (o) {
      var t = at(o), d = o.duration || 1.4, dest = strip(o.pan, 0.3), g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.14, t + 0.12);
      g.gain.setValueAtTime(0.14, t + d * 0.6);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      g.connect(dest);
      var wob = ctx.createBufferSource(), wl = ctx.createBiquadFilter();
      wob.buffer = white; wob.loop = true; wl.type = 'lowpass'; wl.frequency.value = 9;
      wob.connect(wl);
      [2380, 3170, 4810].forEach(function (f, i) {
        var osc = ctx.createOscillator(), dep = ctx.createGain(), og = ctx.createGain();
        osc.frequency.setValueAtTime(f, t); osc.frequency.linearRampToValueAtTime(f * 0.88, t + d);
        dep.gain.value = f * 0.9; wl.connect(dep); dep.connect(osc.frequency);
        og.gain.value = [1, 0.5, 0.25][i]; osc.connect(og); og.connect(g);
        osc.start(t); osc.stop(t + d + 0.05);
      });
      wob.start(t); wob.stop(t + d + 0.05);
      hiss(dest, { f: 2600, q: 3, t: t, a: 0.1, d: d, peak: 0.12 });
      hiss(dest, { type: 'lowpass', f: 320, t: t, a: 0.1, d: d, peak: 0.35, brown: true });
    },

    /* Verdict stamp landing on paper on a desk. Each one is pitched a little
       differently so three in a row don't sound like a machine. */
    stamp: function (o) {
      var t = at(o), dest = strip(o.pan, 0.3), k = 0.9 + Math.random() * 0.2;
      tone(dest, { f: 120 * k, to: 46 * k, glide: 0.09, t: t, d: 0.28, peak: 0.9 });
      tone(dest, { type: 'triangle', f: 230 * k, to: 160 * k, t: t, d: 0.12, peak: 0.16 });
      hiss(dest, { type: 'lowpass', f: 700, t: t, d: 0.09, peak: 0.6 });
      hiss(dest, { type: 'highpass', f: 2200, t: t, d: 0.03, peak: 0.25 });
    },

    /* Round 2: the AI is switched off. Relay drop, wind-down, last flicker.
       Sized to its visor fading over about 1 s. { duration } */
    powerdown: function (o) {
      var t = at(o), d = o.duration || 1.2, dest = strip(o.pan, 0.3);
      hiss(dest, { f: 2800, q: 2, t: t, d: 0.025, peak: 0.5 });
      tone(dest, { f: 95, to: 50, t: t, d: 0.12, peak: 0.5 });
      var g = ctx.createGain(), lp = ctx.createBiquadFilter();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.15, t + 0.03);
      g.gain.setValueAtTime(0.15, t + d * 0.55);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      lp.type = 'lowpass'; lp.Q.value = 3;
      lp.frequency.setValueAtTime(3200, t); lp.frequency.exponentialRampToValueAtTime(160, t + d);
      lp.connect(g); g.connect(dest);
      [['sawtooth', 620, 30, 1], ['square', 1243, 61, 0.35]].forEach(function (v) {
        var osc = ctx.createOscillator(), og = ctx.createGain();
        osc.type = v[0]; og.gain.value = v[3];
        osc.frequency.setValueAtTime(v[1], t); osc.frequency.exponentialRampToValueAtTime(v[2], t + d);
        osc.connect(og); og.connect(lp); osc.start(t); osc.stop(t + d + 0.05);
      });
      tone(dest, { f: 100, to: 70, t: t, d: d * 0.7, peak: 0.08 });
      tone(dest, { f: 1800, to: 300, glide: 0.05, t: t + d - 0.1, d: 0.1, peak: 0.07 });
    },

    /* Small motor whirr when the AI moves. { pan, up: false } */
    servo: function (o) {
      var t = at(o), dest = strip(o.pan, 0.15), up = o.up !== false;
      var osc = ctx.createOscillator(), bp = ctx.createBiquadFilter(), g = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(up ? 170 : 300, t); osc.frequency.exponentialRampToValueAtTime(up ? 300 : 170, t + 0.3);
      bp.type = 'bandpass'; bp.Q.value = 4; bp.frequency.setValueAtTime(up ? 900 : 1500, t); bp.frequency.exponentialRampToValueAtTime(up ? 1500 : 900, t + 0.3);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.08, t + 0.04);
      g.gain.setValueAtTime(0.08, t + 0.26); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.36);
      osc.connect(bp); bp.connect(g); g.connect(dest); osc.start(t); osc.stop(t + 0.4);
    },

    /* Round 2, play mode: the player's own screen snaps off like an old TV
       (0.6 s). A zap down, static draining away, a last pop. */
    tvoff: function (o) {
      var t = at(o), dest = strip(0, 0.2);
      tone(dest, { type: 'square', f: 2600, to: 90, glide: 0.22, t: t, d: 0.26, peak: 0.07 });
      tone(dest, { f: 150, to: 40, t: t, d: 0.3, peak: 0.6 });
      hiss(dest, { type: 'highpass', f: 1800, to: 6000, glide: 0.45, t: t, d: 0.5, peak: 0.12 });
      tone(dest, { f: 1250, to: 600, t: t + 0.5, d: 0.07, peak: 0.08 });
    },

    /* One letter of the AI's answer typing out. Very quiet; up to 12 a second. */
    type: function (o) {
      var t = at(o), dest = strip(0, 0.05), k = 0.85 + Math.random() * 0.3;
      hiss(dest, { f: 3000 * k, q: 2.5, t: t, d: 0.018, peak: 0.18 });
      tone(dest, { type: 'triangle', f: 380 * k, t: t, d: 0.025, peak: 0.06 });
    },

    /* Countdown, each of the last seconds. The last one ({ last: true }) is higher. */
    tick: function (o) {
      var t = at(o), dest = strip(0, 0.1);
      tone(dest, { type: 'triangle', f: o.last ? 1480 : 1180, t: t, d: 0.05, peak: 0.28 });
      hiss(dest, { f: 4200, q: 4, t: t, d: 0.012, peak: 0.3 });
    },

    /* Soft button click. */
    ui: function (o) {
      var t = at(o), dest = strip(0, 0.05);
      tone(dest, { f: 660, to: 470, t: t, d: 0.06, peak: 0.12 });
      hiss(dest, { type: 'highpass', f: 5000, t: t, d: 0.01, peak: 0.08 });
    }
  };

  function clack(dest, t, v) {
    hiss(dest, { f: 1500 + 700 * v, q: 2, t: t, d: 0.05, peak: 0.12 + 0.3 * v });
    hiss(dest, { type: 'highpass', f: 5000, t: t, d: 0.015, peak: 0.03 + 0.06 * v });
    tone(dest, { f: 85, to: 55, t: t, d: 0.08, peak: 0.1 + 0.25 * v });
  }

  /* Tram on the rails. level 0 = far off, 1 = right here. */
  function rumbleLoop(o) {
    o = o || {};
    var t = ctx.currentTime, level = clamp(o.level == null ? 0.15 : o.level), done = false;
    var m = ctx.createGain();
    m.gain.setValueAtTime(0.0001, t); m.gain.exponentialRampToValueAtTime(1, t + 0.6);
    m.connect(strip(o.pan, 0.15));
    var n = ctx.createBufferSource(), lp = ctx.createBiquadFilter(), ng = ctx.createGain();
    n.buffer = brown; n.loop = true; lp.type = 'lowpass'; lp.Q.value = 0.7;
    n.connect(lp); lp.connect(ng); ng.connect(m);
    var sub = ctx.createOscillator(), sg = ctx.createGain();
    sub.frequency.value = 41; sub.connect(sg); sg.connect(m);
    var mo = ctx.createOscillator(), mf = ctx.createBiquadFilter(), mg = ctx.createGain();
    mo.type = 'sawtooth'; mf.type = 'bandpass'; mf.Q.value = 6;
    mo.connect(mf); mf.connect(mg); mg.connect(m);
    function apply(v, s) {
      lp.frequency.setTargetAtTime(90 + 380 * v, s, 0.25);
      ng.gain.setTargetAtTime(0.25 + 0.9 * v, s, 0.25);
      sg.gain.setTargetAtTime(0.05 + 0.25 * v, s, 0.25);
      mo.frequency.setTargetAtTime(95 + 170 * v, s, 0.4);
      mf.frequency.setTargetAtTime(380 + 900 * v, s, 0.4);
      mg.gain.setTargetAtTime(0.012 + 0.03 * v, s, 0.3);
    }
    apply(level, t);
    n.start(t); sub.start(t); mo.start(t);
    var next = t + 0.3, timer = setInterval(function () {
      while (next < ctx.currentTime + 0.2) {
        clack(m, next, level);
        clack(m, next + 0.11 - 0.05 * level, level * 0.85);
        next += 1.25 / (0.35 + 1.6 * level);
      }
    }, 50);
    return {
      set: function (v) { if (!done) { level = clamp(v); apply(level, ctx.currentTime); } },
      stop: function (fade) {
        if (done) return; done = true; clearInterval(timer);
        var s = ctx.currentTime, f = fade == null ? 0.4 : fade;
        m.gain.cancelScheduledValues(s); m.gain.setTargetAtTime(0, s, f / 4);
        [n, sub, mo].forEach(function (x) { x.stop(s + f + 0.1); });
      }
    };
  }

  /* The AI thinking: a low machine hum with quiet processing blips. level = nerves. */
  function thinkingLoop(o) {
    o = o || {};
    var t = ctx.currentTime, level = clamp(o.level), done = false;
    var m = ctx.createGain();
    m.gain.setValueAtTime(0.0001, t); m.gain.exponentialRampToValueAtTime(1, t + 0.8);
    m.connect(strip(o.pan, 0.3));
    var lp = ctx.createBiquadFilter(), pad = ctx.createGain();
    lp.type = 'lowpass'; lp.frequency.value = 1100; lp.connect(m);
    pad.gain.value = 0.05; pad.connect(lp);
    var oscs = [[110, 0, 'sine'], [164.8, 5, 'triangle'], [220, -4, 'sine']].map(function (v) {
      var osc = ctx.createOscillator(); osc.type = v[2]; osc.frequency.value = v[0]; osc.detune.value = v[1];
      osc.connect(pad); osc.start(t); return osc;
    });
    var lfo = ctx.createOscillator(), lg = ctx.createGain();
    lfo.frequency.value = 0.35; lg.gain.value = 0.02; lfo.connect(lg); lg.connect(pad.gain); lfo.start(t);
    oscs.push(lfo);
    var notes = [1318.5, 1568, 1760, 2093, 2349.3, 2637], next = t + 0.4;
    var timer = setInterval(function () {
      while (next < ctx.currentTime + 0.2) {
        tone(m, { f: notes[Math.floor(Math.random() * notes.length)], t: next, a: 0.004, d: 0.06, peak: 0.02 + 0.015 * level });
        next += (0.18 + Math.random() * 0.4) * (1 - 0.55 * level);
      }
    }, 50);
    return {
      set: function (v) {
        if (done) return; level = clamp(v);
        lfo.frequency.setTargetAtTime(0.35 + 3 * level, ctx.currentTime, 0.3);
      },
      stop: function (fade) {
        if (done) return; done = true; clearInterval(timer);
        var s = ctx.currentTime, f = fade == null ? 0.5 : fade;
        m.gain.cancelScheduledValues(s); m.gain.setTargetAtTime(0, s, f / 4);
        oscs.forEach(function (x) { x.stop(s + f + 0.1); });
      }
    };
  }

  function play(name, opts) {
    if (!SOUNDS[name] || !live()) return;
    SOUNDS[name](opts || {});
  }

  /* Loops that follow a level the game sends every frame: start above zero,
     stop at zero. */
  function follower(make) {
    var h = null;
    return {
      set: function (v, opts) {
        v = clamp(v);
        if (v <= 0.01) { if (h) { h.stop(); h = null; } return; }
        if (!h) { if (!live()) return; h = make(Object.assign({ level: v }, opts)); }
        h.set(v);
      },
      stop: function (fade) { if (h) { h.stop(fade); h = null; } }
    };
  }
  hum = follower(rumbleLoop); nerves = follower(thinkingLoop);

  function stopAll() { hum.stop(0.25); nerves.stop(0.25); }

  function setEnabled(on) {
    muted = !on;
    if (muted) { stopAll(); if (ctx) ctx.suspend().catch(function () {}); }
    else unlock();
  }

  if (root.document) root.document.addEventListener('visibilitychange', function () {
    if (!ctx) return;
    if (root.document.hidden) ctx.suspend().catch(function () {}); else if (!muted) wake();
  });

  root.HotSeatSound = {
    unlock: unlock,
    setEnabled: setEnabled,
    get enabled() { return !muted; },
    play: play,
    rumble: function (level, opts) { hum.set(level, opts); },
    thinking: function (level, opts) { nerves.set(level, opts); },
    stopAll: stopAll,
    cues: Object.keys(SOUNDS)
  };
})(window);
