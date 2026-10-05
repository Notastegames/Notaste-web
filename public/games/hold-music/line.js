// Hold Music: the line. Everything you hear, made in code on the kit's sound
// (Notaste.sound.ctx() and out()), and the clock everything keeps time by.
//
// THE CLOCK. The transport is a clock in seconds that follows the audio
// context's own clock one for one while sound is running, so what you see
// and what you hear can't drift apart. With no running sound (blocked, not
// started yet) or with ?speed above 1 (the automatic play-through), it runs
// on the frame clock instead. Pausing suspends the context (the kit does
// that), so the transport stops with it.
//
// HEARD TIME. Sound leaves the speaker a little after it's scheduled (the
// output latency). Everything on screen, and every judgement of a tap, uses
// heard time: the transport minus that latency. Taps are timed from the
// event's own timestamp, not from the frame that reads them.
//
// THE SCHEDULER. Sounds are queued by transport time and handed to the
// audio context 0.15s before they're due, in groups that can be cancelled
// (the music stops dead when you're cut off).
//
// THE LINE. Everything goes down a phone line: a high-pass at 220Hz, a
// low-pass at 3300Hz and a soft clip, with a music bus (ducked under the
// announcements), a beat bus and a voice bus, plus hiss and crackle. The
// line comes out about as loud as Heavy Traffic's engine, and the tick on
// every note you tap sits a few dB over the music.
//
// THE TUNES. Each tune is played in an arrangement: the same eight bars, with
// some quavers folded into the note before them for the easier calls. The
// notes you tap are the lead's own notes in that arrangement, so you really
// are tapping along to the hold music, and on a beat where the tune rests the
// backing rests too, so nothing tempts you to tap it.
//
// hold-music.js is the game; draw.js draws it.
(function () {
  "use strict";

  var N = window.Notaste;
  if (!N) return;
  var snd = N.sound;
  var FAST = N.flags.speed > 1;      // the play-through: the frame clock, no sound
  var LOOK = 0.15;                   // how far ahead sounds are handed over

  // ---------------------------------------------------------------------------
  // The transport
  // ---------------------------------------------------------------------------
  var tr = 0;                 // transport time, seconds
  var lastAudio = 0;          // the context's clock at the last step
  var resync = true;          // the next step starts counting afresh
  var stall = 0;              // how long the context's clock has stood still
  var held = 0;               // how long the context has been suspended while playing
  var offset = null;          // transport minus performance.now(), smoothed, for taps
  var mode = "frame";         // "audio" or "frame"

  function live() {
    var c = snd.ctx();
    return c && !FAST ? c : null;
  }

  // One step of the game: move the transport on
  function advance(dt) {
    var c = live();
    if (c && c.state === "running") {
      held = 0;
      var now = c.currentTime;
      if (resync || mode !== "audio") { lastAudio = now; resync = false; mode = "audio"; }
      var d = now - lastAudio;
      lastAudio = now;
      if (d <= 0) {
        // the context's clock isn't moving (no output device): carry on by the frame
        stall += dt;
        if (stall > 0.5) tr += dt;
      } else {
        stall = 0;
        tr += Math.min(d, 1);
      }
    } else if (c && c.state !== "closed" && mode === "audio") {
      // suspended while playing: a resume is on its way, so wait for it, but
      // not for ever (a phone that won't give the sound back plays on silently)
      held += dt;
      if (held > 0.8) { mode = "frame"; tr += dt; }
      resync = true;
    } else {
      mode = "frame";
      tr += dt;
      resync = true;
    }
    // the map from an event's timestamp to the transport, smoothed
    var o = tr - performance.now() / 1000;
    if (offset == null || Math.abs(o - offset) > 0.05) offset = o;
    else offset += (o - offset) * 0.1;
    pump();
  }

  // Called when the game isn't running: the next step starts afresh
  function idle() { resync = true; offset = null; }

  function latency() {
    var c = live();
    if (!c || mode !== "audio") return 0;
    var l = (c.outputLatency || 0) + (c.baseLatency || 0);
    return l > 0 ? Math.min(0.2, l) : 0;
  }

  // the transport time of an event, from its timestamp, as heard
  function tapTime(stamp) {
    if (offset == null || !stamp) return tr - latency();
    var t = stamp / 1000 + offset;
    // a stamp from before the last step or after now is clamped to the steps
    return Math.min(t, tr + 0.05) - latency();
  }

  // the audio context's time for a transport time
  function at(t) {
    var c = live();
    return c ? c.currentTime + Math.max(0, t - tr) : 0;
  }

  // ---------------------------------------------------------------------------
  // The scheduler
  // ---------------------------------------------------------------------------
  var queue = [];             // { t, fn, group }, by time
  var nodes = [];             // { src, gain, group, end }: playing, so they can be stopped

  function sched(t, fn, group) {
    var e = { t: t, fn: fn, group: group || "fx" };
    var i = queue.length;
    while (i > 0 && queue[i - 1].t > t) i--;
    queue.splice(i, 0, e);
  }

  function pump() {
    var c = live();
    var sounding = c && c.state === "running" && mode === "audio";
    while (queue.length && queue[0].t <= tr + LOOK) {
      var e = queue.shift();
      if (sounding && e.t > tr - 0.05) {
        try { e.fn(at(e.t), e.group); } catch (err) { /* a sound that fails is only a sound */ }
      }
    }
    if (nodes.length > 80 && c) {
      var now = c.currentTime;
      nodes = nodes.filter(function (n) { return n.end > now; });
    }
  }

  // stop a group dead: queued sounds and anything already playing
  function cancel(group) {
    queue = queue.filter(function (e) { return group !== "all" && e.group !== group; });
    var c = snd.ctx();
    if (!c) { nodes = []; return; }
    var now = c.currentTime;
    nodes = nodes.filter(function (n) {
      if (group !== "all" && n.group !== group) return true;
      try {
        n.gain.gain.cancelScheduledValues(now);
        n.gain.gain.setTargetAtTime(0, now, 0.012);
        n.src.stop(now + 0.06);
      } catch (e) {}
      return false;
    });
    if ((group === "music" || group === "all") && G) {
      G.music.gain.cancelScheduledValues(now);
      G.music.gain.setTargetAtTime(1, now, 0.02);
    }
  }

  function reset() {
    cancel("all");
    bedOff();
    tr = 0;
    resync = true;
    offset = null;
    stall = 0;
    held = 0;
  }

  // ---------------------------------------------------------------------------
  // The line: buses, filters, hiss and crackle
  // ---------------------------------------------------------------------------
  var G = null;               // the graph, built for one context
  var pulse = null;           // a 25% pulse wave, for the lead
  var bed = null;             // the hiss and crackle, while a call is on

  function graph() {
    var c = live();
    if (!c) return null;
    if (G && G.ctx === c) return G;
    var lineIn = c.createGain();
    var hp = c.createBiquadFilter();
    hp.type = "highpass"; hp.frequency.value = 220; hp.Q.value = 0.7;
    var lp = c.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 3300; lp.Q.value = 0.9;
    var clip = c.createWaveShaper();
    var curve = new Float32Array(1024), k = 1.8;
    for (var i = 0; i < curve.length; i++) {
      var x = i / (curve.length - 1) * 2 - 1;
      curve[i] = Math.tanh(k * x) / Math.tanh(k);
    }
    clip.curve = curve;
    var out = c.createGain();
    out.gain.value = 0.3;
    lineIn.connect(hp); hp.connect(lp); lp.connect(clip); clip.connect(out); out.connect(snd.out());
    var music = c.createGain(), beat = c.createGain(), voice = c.createGain(), fx = c.createGain();
    music.gain.value = 1; beat.gain.value = 1; voice.gain.value = 1; fx.gain.value = 1;
    var musicVol = c.createGain();
    musicVol.gain.value = 0.85;
    music.connect(musicVol); musicVol.connect(lineIn);
    beat.connect(lineIn); voice.connect(lineIn); fx.connect(lineIn);
    // the slow wow on the lead: one wobble, shared by every note
    var wow = c.createOscillator(), wowAmt = c.createGain();
    wow.frequency.value = 0.55;
    wowAmt.gain.value = 14;        // cents
    wow.connect(wowAmt);
    wow.start();
    // a 25% pulse
    var n = 40, re = new Float32Array(n), im = new Float32Array(n);
    for (var h = 1; h < n; h++) re[h] = (2 / (h * Math.PI)) * Math.sin(h * Math.PI * 0.25);
    pulse = c.createPeriodicWave(re, im);
    var noise = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), d = noise.getChannelData(0);
    for (var j = 0; j < d.length; j++) d[j] = Math.random() * 2 - 1;
    // crackle: nine and a bit seconds of pops at uneven gaps, so it never
    // falls into step with the music
    var crackle = c.createBuffer(1, Math.round(c.sampleRate * 9.37), c.sampleRate), cd = crackle.getChannelData(0);
    for (var q = 0; q < 70; q++) {
      var p = Math.floor(Math.random() * (cd.length - 200)), amp = 0.3 + Math.random() * 0.7;
      for (var s = 0; s < 60 + Math.random() * 120; s++) cd[p + s] = (Math.random() * 2 - 1) * amp * Math.exp(-s / 30);
    }
    G = { ctx: c, lineIn: lineIn, music: music, beat: beat, voice: voice, fx: fx, wow: wowAmt, noise: noise, crackle: crackle };
    return G;
  }

  // the hiss and crackle of an open line
  function bedOn() {
    var g = graph();
    if (!g || bed) return;
    var c = g.ctx;
    var hiss = c.createBufferSource();
    hiss.buffer = g.noise; hiss.loop = true;
    var bp = c.createBiquadFilter();
    bp.type = "bandpass"; bp.frequency.value = 2400; bp.Q.value = 0.6;
    var hg = c.createGain(); hg.gain.value = 0.009;
    hiss.connect(bp); bp.connect(hg); hg.connect(g.lineIn);
    var crk = c.createBufferSource();
    crk.buffer = g.crackle; crk.loop = true;
    var cg = c.createGain(); cg.gain.value = 0.045;
    crk.connect(cg); cg.connect(g.lineIn);
    hiss.start(); crk.start();
    bed = { hiss: hiss, crk: crk, hg: hg, cg: cg };
  }
  function bedOff() {
    if (!bed) return;
    var c = snd.ctx();
    try {
      var now = c.currentTime;
      bed.hg.gain.setTargetAtTime(0, now, 0.05);
      bed.cg.gain.setTargetAtTime(0, now, 0.05);
      bed.hiss.stop(now + 0.3); bed.crk.stop(now + 0.3);
    } catch (e) {}
    bed = null;
  }

  // ---------------------------------------------------------------------------
  // Instruments. Each takes the audio time it starts at.
  // ---------------------------------------------------------------------------
  function hz(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }

  // a note on an oscillator: type (or "pulse"), frequency, length, volume,
  // the bus it goes to, and its group (so it can be stopped)
  function note(t, type, f, dur, vol, bus, group, o) {
    var g = graph();
    if (!g) return;
    o = o || {};
    var c = g.ctx;
    var osc = c.createOscillator();
    if (type === "pulse") { osc.setPeriodicWave(pulse); g.wow.connect(osc.detune); }
    else osc.type = type;
    osc.frequency.setValueAtTime(f, t);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(o.slide, t + dur);
    var amp = c.createGain();
    var atk = o.attack || 0.006, rel = o.release || 0.04;
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.linearRampToValueAtTime(vol, t + atk);
    if (o.decay) amp.gain.setTargetAtTime(vol * (o.sustain || 0.4), t + atk, o.decay);
    amp.gain.setValueAtTime(o.decay ? vol * (o.sustain || 0.4) : vol, t + Math.max(atk, dur - rel));
    amp.gain.linearRampToValueAtTime(0.0001, t + dur);
    osc.connect(amp);
    amp.connect(g[bus] || g.fx);
    osc.start(t);
    osc.stop(t + dur + 0.05);
    nodes.push({ src: osc, gain: amp, group: group, end: t + dur + 0.05 });
  }

  function burst(t, dur, vol, bus, group, o) {
    var g = graph();
    if (!g) return;
    o = o || {};
    var c = g.ctx;
    var src = c.createBufferSource();
    src.buffer = g.noise;
    var f = c.createBiquadFilter();
    f.type = o.type || "bandpass";
    f.frequency.value = o.freq || 3000;
    f.Q.value = o.q || 0.8;
    var amp = c.createGain();
    amp.gain.setValueAtTime(vol, t);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(amp); amp.connect(g[bus] || g.fx);
    src.start(t, Math.random() * 1.5);
    src.stop(t + dur + 0.05);
    nodes.push({ src: src, gain: amp, group: group, end: t + dur + 0.05 });
  }

  var DTMF = { 1: [697, 1209], 2: [697, 1336], 3: [697, 1477], 4: [770, 1209], 5: [770, 1336], 6: [770, 1477],
               7: [852, 1209], 8: [852, 1336], 9: [852, 1477], 0: [941, 1336], "*": [941, 1209], "#": [941, 1477] };

  var inst = {
    lead: function (t, midi, dur, group) { note(t, "pulse", hz(midi), dur, 0.16, "music", group, { decay: 0.18, sustain: 0.55, release: 0.05 }); },
    bass: function (t, midi, dur, group) { note(t, "square", hz(midi), dur, 0.085, "music", group, { decay: 0.08, sustain: 0.5 }); },
    stab: function (t, midis, dur, group) {
      midis.forEach(function (m) { note(t, "square", hz(m), dur, 0.022, "music", group, { release: 0.02 }); });
    },
    // hats: the loud one on the beat, a soft one on the off-beat
    hat: function (t, loud, group) { burst(t, loud ? 0.05 : 0.025, loud ? 0.07 : 0.03, "music", group, { type: "highpass", freq: 2600 }); },
    // the tick: a woodblock on every note you tap, on the beat bus (it carries
    // on under announcements), a few dB over the music
    tick: function (t, accent, group) {
      note(t, "square", accent ? 1560 : 1180, 0.045, accent ? 0.12 : 0.095, "beat", group, { release: 0.03 });
      note(t, "triangle", accent ? 780 : 590, 0.06, 0.13, "beat", group, { release: 0.04 });
    },
    // a quiet metronome under the menu
    pulseTick: function (t, group) { note(t, "triangle", 880, 0.03, 0.03, "beat", group); },
    dtmf: function (t, key, dur, group, vol) {
      var p = DTMF[key];
      if (!p) return;
      note(t, "sine", p[0], dur, vol || 0.09, "voice", group, { attack: 0.004, release: 0.01 });
      note(t, "sine", p[1], dur, vol || 0.09, "voice", group, { attack: 0.004, release: 0.01 });
    },
    // the UK ringing tone: 400 and 450Hz, two short rings
    ring: function (t, group) {
      [0, 0.6].forEach(function (d) {
        note(t + d, "sine", 400, 0.4, 0.05, "fx", group, { attack: 0.01, release: 0.02 });
        note(t + d, "sine", 450, 0.4, 0.05, "fx", group, { attack: 0.01, release: 0.02 });
      });
    },
    // the dial tone: 350 and 440Hz
    dial: function (t, dur, group) {
      note(t, "sine", 350, dur, 0.06, "fx", group, { attack: 0.01, release: 0.03 });
      note(t, "sine", 440, dur, 0.06, "fx", group, { attack: 0.01, release: 0.03 });
    },
    // picked up, or put down
    click: function (t, group) {
      burst(t, 0.03, 0.4, "fx", group, { type: "lowpass", freq: 1800 });
      note(t, "sine", 160, 0.07, 0.15, "fx", group, { slide: 60 });
    },
    staticHit: function (t, dur, group) { burst(t, dur || 0.3, 0.32, "fx", group, { type: "bandpass", freq: 1800, q: 0.4 }); },
    // a press of a key on your own phone
    key: function (t, k, group) { inst.dtmf(t, k, 0.13, group, 0.08); },
    buzz: function (t, group) { note(t, "sawtooth", 150, 0.16, 0.06, "fx", group, { release: 0.04 }); note(t, "square", 158, 0.16, 0.03, "fx", group); },
    // a hit lands: a small bright blip, a perfect one rings a little
    hit: function (t, perfect, group) {
      note(t, "square", perfect ? 2093 : 1568, 0.05, 0.035, "fx", group);
      if (perfect) note(t + 0.04, "square", 2637, 0.06, 0.025, "fx", group);
    },
    miss: function (t, group) { burst(t, 0.16, 0.22, "fx", group, { type: "bandpass", freq: 1300, q: 0.5 }); }
  };

  // ---------------------------------------------------------------------------
  // The tunes: original, eight bars each. Notes are [beat, length, midi].
  // "please": C, A minor, D minor, G. The hold music you've heard before,
  // but haven't. "fast": the fast version, C, G, A minor, F.
  // ---------------------------------------------------------------------------
  var PLEASE_1 = [[0, 1, 76], [1, 0.5, 79], [1.5, 0.5, 76], [2, 1, 74], [3, 1, 72]];
  var FAST_1 = [[0, 0.5, 79], [0.5, 0.5, 79], [1, 0.5, 76], [1.5, 0.5, 79], [2, 1, 84], [3, 1, 79]];
  var TUNES = {
    please: {
      chords: [[[60, 64, 67]], [[57, 60, 64]], [[62, 65, 69]], [[59, 62, 67]], [[60, 64, 67]], [[57, 60, 64]], [[57, 60, 65], [59, 62, 67]], [[60, 64, 67]]],
      roots: [[48], [45], [50], [43], [48], [45], [41, 43], [48]],
      lead: [
        PLEASE_1,
        [[0, 1, 72], [1, 1, 76], [2, 1.5, 81], [3.5, 0.5, 79]],
        [[0, 1, 77], [1, 0.5, 81], [1.5, 0.5, 77], [2, 1, 76], [3, 1, 74]],
        [[0, 1, 74], [1, 1, 67], [2, 1, 71], [3, 1, 74]],
        PLEASE_1,
        [[0, 1, 72], [1, 1, 76], [2, 1, 81], [3, 1, 84]],
        [[0, 1, 81], [1, 0.5, 79], [1.5, 0.5, 77], [2, 1, 76], [3, 1, 74]],
        [[0, 3, 72]]
      ],
      bass: "walk"
    },
    fast: {
      chords: [[[60, 64, 67]], [[59, 62, 67]], [[57, 60, 64]], [[57, 60, 65]], [[60, 64, 67]], [[59, 62, 67]], [[57, 60, 64]], [[57, 60, 65]]],
      roots: [[48], [43], [45], [41], [48], [43], [45], [41]],
      lead: [
        FAST_1,
        [[0, 0.5, 79], [0.5, 0.5, 77], [1, 0.5, 74], [1.5, 0.5, 71], [2, 1, 74], [3, 1, 79]],
        [[0, 0.5, 81], [0.5, 0.5, 81], [1, 0.5, 76], [1.5, 0.5, 81], [2, 1, 84], [3, 1, 81]],
        [[0, 0.5, 81], [0.5, 0.5, 79], [1, 0.5, 77], [1.5, 0.5, 72], [2, 2, 77]],
        FAST_1,
        [[0, 0.5, 83], [0.5, 0.5, 81], [1, 0.5, 79], [1.5, 0.5, 74], [2, 1, 79], [3, 1, 83]],
        [[0, 1, 84], [1, 0.5, 83], [1.5, 0.5, 81], [2, 1, 76], [3, 1, 81]],
        [[0, 0.5, 81], [0.5, 0.5, 79], [1, 1, 77], [2, 2, 79]]
      ],
      bass: "pump"
    }
  };

  // Arrangements: which quavers fold into the note before them. A rule (of
  // the bar and the beat) says which off-beat notes go.
  //   easy:   every off-beat note goes, so it's crotchets only (call 1)
  //   tune:   the tune as written (calls 2 to 4, before the fast version)
  //   medium: the fast tune with each bar's first quaver folded (call 3)
  //   hard:   the fast tune, with its runs in bars 1, 3, 5 and 7 (call 4)
  var ARRANGE = {
    easy: function (bi, beat) { return beat % 1 !== 0; },
    tune: function () { return false; },
    medium: function (bi, beat) { return beat === 0.5; },
    hard: function (bi, beat) { return beat === 0.5 && bi % 2 === 1; }
  };
  var arranged = {};
  // The lead of bar bi of a tune in an arrangement, as [beat, length, midi]
  function lead(name, arr, bi) {
    var key = name + "|" + arr + "|" + (bi % 8);
    if (arranged[key]) return arranged[key];
    var drop = ARRANGE[arr] || ARRANGE.tune, out = [];
    TUNES[name].lead[bi % 8].forEach(function (n) {
      var prev = out[out.length - 1];
      if (prev && drop(bi % 8, n[0])) out[out.length - 1] = [prev[0], prev[1] + n[1], prev[2]];
      else out.push(n.slice());
    });
    arranged[key] = out;
    return out;
  }
  // The beats you tap in that bar: where the lead's notes start
  function taps(name, arr, bi) { return lead(name, arr, bi).map(function (n) { return n[0]; }); }

  // Queue one bar of a tune: at transport time t0, beat length b (seconds),
  // bar i of the tune in arrangement arr, transposed by key semitones. On a
  // beat with no tapped note the bass and the loud hat rest, and on a beat
  // with nothing to tap in it at all the whole backing rests.
  function bar(t0, b, name, i, key, arr) {
    var tune = TUNES[name], bi = i % 8;
    var chords = tune.chords[bi], roots = tune.roots[bi];
    var notes = lead(name, arr, bi), starts = notes.map(function (n) { return n[0]; });
    notes.forEach(function (n) {
      sched(t0 + n[0] * b, function (a) { inst.lead(a, n[2] + key, n[1] * b * 0.92, "music"); }, "music");
    });
    for (var beat = 0; beat < 4; beat++) {
      var half = beat < 2 || chords.length < 2 ? 0 : 1;
      var root = roots[Math.min(roots.length - 1, beat < 2 ? 0 : roots.length - 1)] + key;
      var on = starts.indexOf(beat) >= 0;
      var any = starts.some(function (s) { return s >= beat && s < beat + 1; });
      if (!any) continue;
      (function (beat, root, on, ch) {
        if (tune.bass === "walk") {
          var m = beat % 2 ? root + 7 : root;
          if (on) sched(t0 + beat * b, function (a) { inst.bass(a, m, b * 0.55, "music"); }, "music");
        } else {
          if (on) sched(t0 + beat * b, function (a) { inst.bass(a, root, b * 0.4, "music"); }, "music");
          sched(t0 + (beat + 0.5) * b, function (a) { inst.bass(a, root + 12, b * 0.32, "music"); }, "music");
        }
        sched(t0 + (beat + 0.5) * b, function (a) { inst.stab(a, ch, b * 0.18, "music"); }, "music");
        if (on) sched(t0 + beat * b, function (a) { inst.hat(a, true, "music"); }, "music");
        sched(t0 + (beat + 0.5) * b, function (a) { inst.hat(a, false, "music"); }, "music");
      })(beat, root, on, chords[half].map(function (m) { return m + key; }));
    }
  }

  // turn the music down under an announcement, from t0 to t1 (transport)
  function duck(t0, t1) {
    sched(t0, function (a) {
      var g = graph();
      if (g) { g.music.gain.cancelScheduledValues(a); g.music.gain.setTargetAtTime(0.22, a, 0.06); }
    }, "music");
    sched(t1, function (a) {
      var g = graph();
      if (g) g.music.gain.setTargetAtTime(1, a, 0.12);
    }, "music");
  }

  // ---------------------------------------------------------------------------
  // Voices: one blip a syllable, with a tune to it. The Voice of the menu is
  // high and cheerful; the agents are lower and tired. Numbers are said as
  // their keypad tones, so you can hear which is which.
  // ---------------------------------------------------------------------------
  var VOICES = {
    voice: { base: 560, type: "square", vol: 0.05, lilt: 0.16 },
    agent: { base: 300, type: "triangle", vol: 0.11, lilt: 0.09 },
    dept: { base: 420, type: "sawtooth", vol: 0.045, lilt: 0.12 }
  };
  var DIGITS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, zero: 0 };

  function syllables(word) {
    var w = word.toLowerCase().replace(/[^a-z]/g, "");
    if (!w) return 0;
    var n = (w.match(/[aeiouy]+/g) || []).length;
    if (w.length > 2 && /e$/.test(w) && !/le$/.test(w) && n > 1) n--;
    return Math.max(1, n);
  }

  // Say a line, from transport time t0, spread over span seconds.
  // Returns when each digit in it is said, as [{ t, digit }].
  function say(t0, text, who, span, group) {
    var v = VOICES[who] || VOICES.voice;
    var words = text.split(/\s+/).filter(Boolean);
    var units = [];
    words.forEach(function (w, wi) {
      var clean = w.replace(/[^0-9a-z]/gi, "");
      if (/^[0-9]$/.test(clean)) units.push({ digit: clean });
      else if (DIGITS[clean.toLowerCase()] != null && /^press$|^for$/i.test(words[wi - 1] || "")) units.push({ digit: String(DIGITS[clean.toLowerCase()]) });
      else for (var s = 0, n = syllables(clean); s < n; s++) units.push({ s: s, last: s === n - 1, stop: /[.,]$/.test(w) && s === n - 1 });
    });
    if (!units.length) return [];
    var step = Math.min(0.17, span / (units.length + 0.6));
    var out = [], t = t0;
    units.forEach(function (u, i) {
      if (u.digit) {
        var tt = t;
        sched(tt, function (a) { inst.dtmf(a, u.digit, step * 0.95, group || "voice"); }, group || "voice");
        out.push({ t: tt, digit: u.digit });
      } else {
        var f = v.base * (1 + v.lilt * Math.sin(i * 1.9 + text.length * 0.7)) * (u.stop ? 0.86 : 1);
        sched(t, function (a) { note(a, v.type, f, step * 0.78, v.vol, "voice", group || "voice", { attack: 0.008, release: 0.025 }); }, group || "voice");
      }
      t += step * (u.stop ? 1.6 : 1);
    });
    return out;
  }

  window.HoldLine = {
    FAST: FAST,
    advance: advance,
    idle: idle,
    reset: reset,
    now: function () { return tr; },
    heard: function () { return tr - latency(); },
    latency: latency,
    tapTime: tapTime,
    mode: function () { return mode; },
    sched: sched,
    cancel: cancel,
    inst: inst,
    bar: bar,
    taps: taps,
    lead: lead,
    duck: duck,
    say: say,
    bedOn: bedOn,
    bedOff: bedOff,
    TUNES: TUNES
  };
})();
