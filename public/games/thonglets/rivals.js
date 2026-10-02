// Thonglets: the rival gods. One arrives each stage. They're invented
// stand-ins for broken things (DESIGN.md, section 2): The Feed, A Landlord,
// Space Billionaire, The Loudspeaker, The Sea and The Planning Office.
// They aim at systems and types, never at real people.
//
// thonglets.js owns the game; each rival gets the game's state (G) and its
// helpers (H) and hands back an object the game calls every frame:
//   place()            work out where it stands on this field
//   update(dt)
//   capture(f, dt, dl) take over a Thonglet this frame (true if it did)
//   smite(x, y, r)     the player struck here: return a callout, or null
//   blocks()           true while bricks can't be delivered (the Office)
//   ground(c)          draw on the ground, under everyone
//   stand()            things standing on the field: [{ y, draw(c) }]
//   who                where its speech bubbles come from
(function () {
  "use strict";

  function ring(c, x, y, rx, ry, colour, w, dash) {
    c.save();
    if (dash) c.setLineDash(dash);
    c.strokeStyle = colour;
    c.lineWidth = w;
    c.beginPath();
    c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    c.stroke();
    c.restore();
  }

  function outlined(c, T, w) {
    c.lineWidth = w || 2.2;
    c.strokeStyle = T.ink;
    c.lineJoin = "round";
    c.lineCap = "round";
  }

  function label(c, T, x, y, text, size, fill, ink) {
    c.font = (size || 9) + "px " + T.display;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillStyle = ink || T.ink;
    if (fill) {
      var w = c.measureText(text).width + 8;
      c.fillStyle = fill;
      c.fillRect(x - w / 2, y - size * 0.7, w, size * 1.4);
      outlined(c, T, 1.2);
      c.strokeRect(x - w / 2, y - size * 0.7, w, size * 1.4);
      c.fillStyle = ink || T.ink;
    }
    c.fillText(text.toUpperCase(), x, y + 0.5);
  }

  // ---------------------------------------------------------------------------
  // The Feed: a giant glowing phone. Anyone near it stops and stares.
  // ---------------------------------------------------------------------------
  function feed(G, H, spot) {
    var R = 112;
    var me = {
      kind: "feed", name: "The Feed", spot: spot,
      x: 0, y: 0, on: false, off: 0, glow: 0, wake: 4,
      who: { x: 0, y: 0, lift: 60, state: "rival" },
      intro: "Hey. Hey. Look at me.",
      lines: ["You won't believe what happens next.", "Ten bums you need to see.", "Keep scrolling.",
              "Someone is wrong online.", "Sponsored.", "This bum went viral."],
      place: function () { me.x = spot.x * G.WW; me.y = spot.y * G.WH; me.who.x = me.x; me.who.y = me.y; },
      live: function () { return me.on && me.off <= 0; },
      update: function (dt) {
        me.glow += dt;
        if (!me.on) {
          me.wake -= dt;
          if (me.wake <= 0) { me.on = true; H.say(me.who, me.intro, true); H.sfx.ping(); }
        }
        if (me.off > 0) me.off = Math.max(0, me.off - dt);
      },
      capture: function (f, dt, dl) {
        if (f.state === "stare") {
          var a = Math.atan2(f.y - me.y, f.x - me.x);
          H.steer(f, me.x + Math.cos(a) * 34, me.y + Math.sin(a) * 22 + 10, f.speed * 0.6, dt);
          if (!me.live() || dl < H.RESCUE) {
            f.state = "follow";
            if (Math.random() < 0.3) H.say(f, H.pick(["Sorry. Got distracted.", "I was praying. On my phone.", "Ten more minutes.", "Where am I."]));
          }
          return true;
        }
        if (!me.live() || f.blessed > 0 || dl < 70) return false;
        var reach = R * G.mods.lure * (H.nearPriest(f) ? 0.55 : 1);
        if (Math.hypot(f.x - me.x, f.y - me.y) < reach) {
          f.state = "stare";
          if (Math.random() < 0.25) H.say(f, H.pick(["One more.", "Ha. Bum.", "Just checking something.", "I've got eleven notifications.", "Is that my bum."]));
          return true;
        }
        return false;
      },
      smite: function (x, y, r) {
        if (!me.live() || Math.hypot(me.x - x, me.y - y) > r + 30) return null;
        me.off = 10;
        var dazed = null;
        G.folk.forEach(function (f) { if (f.state === "stare") { f.state = "follow"; dazed = f; } });
        if (dazed) H.say(dazed, "What do we do now. Talk.", true);
        return "Feed: down";
      },
      speak: function () { return me.live() ? H.pick(me.lines) : null; },
      ground: function (c) {
        if (!me.live()) return;
        c.save();
        c.globalAlpha = 0.5 + Math.sin(me.glow * 3) * 0.15;
        c.fillStyle = H.dots(c);
        c.beginPath();
        c.ellipse(me.x, me.y + 6, R * G.mods.lure, R * G.mods.lure * 0.55, 0, 0, Math.PI * 2);
        c.fill();
        c.restore();
      },
      stand: function () { return [{ y: me.y, draw: draw }]; }
    };
    function draw(c) {
      var T = G.T, on = me.live();
      c.save();
      c.translate(me.x, me.y);
      c.rotate(-0.06);
      c.fillStyle = T.paper;
      outlined(c, T, 2.4);
      c.beginPath();
      H.roundRect(c, -15, -52, 30, 54, 6);
      c.fill();
      c.stroke();
      c.beginPath();
      H.roundRect(c, -11, -46, 22, 40, 2);
      c.fillStyle = on ? T.accent : T.ink;
      c.fill();
      if (on) {
        c.fillStyle = T.paper;
        var scroll = (me.glow * 14) % 10;
        for (var i = 0; i < 5; i++) {
          var ly = -44 + i * 10 - scroll;
          if (ly > -46 && ly < -10) { c.fillRect(-8, ly, 16, 2.4); c.fillRect(-8, ly + 3.6, 10, 1.6); }
        }
        c.beginPath();
        c.arc(11, -50, 6, 0, Math.PI * 2);
        c.fillStyle = T.red;
        c.fill();
        c.lineWidth = 1.4;
        c.stroke();
        label(c, T, 11, -50, "99", 8, null, T.paper);
      }
      c.restore();
    }
    return me;
  }

  // ---------------------------------------------------------------------------
  // A Landlord: wanders over and takes a brick off anyone carrying one. Rent.
  // Smite him and he drops the lot and leaves for a bit.
  // ---------------------------------------------------------------------------
  function landlord(G, H, spot) {
    var me = {
      kind: "landlord", name: "A Landlord", spot: spot,
      x: 0, y: 0, vx: 0, vy: 0, rent: 0, away: 0, face: 1, t: 0, grab: 0,
      who: { x: 0, y: 0, lift: 44, state: "rival" },
      intro: "Rent is due. Rent is always due.",
      lines: ["Rent is due. Rent is always due.", "That brick's mine. Service charge.", "Deposit: kept.",
              "No pets. No bricks.", "I've put it up again.", "Viewing by appointment.", "It's a buy to let. I bought you."],
      place: function () {
        if (!me.placed) { me.x = spot.x * G.WW; me.y = spot.y * G.WH; me.placed = true; }
      },
      update: function (dt) {
        me.t += dt;
        me.who.x = me.x; me.who.y = me.y;
        if (me.away > 0) {
          me.away -= dt;
          // off he goes, to the nearest edge
          H.steer(me, me.x < G.WW / 2 ? -60 : G.WW + 60, me.y, 90, dt);
          me.x += me.vx * dt; me.y += me.vy * dt;
          if (me.away <= 0) { me.x = spot.x * G.WW; me.y = spot.y * G.WH; H.say(me.who, "I'm back. Rent's gone up.", true); }
          return;
        }
        // after the nearest Thonglet carrying a brick
        var best = null, bd = 1e9;
        G.folk.forEach(function (f) {
          if (!f.carry || f.state === "gone" || f.state === "fall" || f.state === "aboard") return;
          var d = Math.hypot(f.x - me.x, f.y - me.y);
          if (d < bd) { bd = d; best = f; }
        });
        if (best) H.steer(me, best.x, best.y, 48, dt);
        else H.steer(me, spot.x * G.WW, spot.y * G.WH, 30, dt);
        me.x += me.vx * dt; me.y += me.vy * dt;
        if (Math.abs(me.vx) > 4) me.face = me.vx > 0 ? 1 : -1;
        me.grab -= dt;
        if (best && bd < 20 && me.grab <= 0) {
          best.carry = false;
          me.rent += best.load || 1;
          best.load = 0;
          me.grab = 0.5;
          H.sfx.till();
          if (Math.random() < 0.5) H.say(me.who, H.pick(["Rent.", "Ta.", "Service charge.", "Thank you. Next."]), true);
          else H.say(best, H.pick(["That was for god.", "Fair enough.", "They're allowed, I think.", "I'll just get another."]));
        }
      },
      capture: function () { return false; },
      smite: function (x, y, r) {
        if (me.away > 0 || Math.hypot(me.x - x, me.y - y) > r + 8) return null;
        if (me.rent) H.dropPile(me.x, me.y, me.rent);
        var got = me.rent;
        me.rent = 0;
        me.away = 9;
        H.say(me.who, "I'll be back. With an invoice.", true);
        return got ? "Rent: refunded" : "Landlord: evicted";
      },
      speak: function () { return me.away > 0 ? null : H.pick(me.lines); },
      ground: function () {},
      stand: function () { return me.x < -40 || me.x > G.WW + 40 ? [] : [{ y: me.y, draw: draw }]; }
    };
    function draw(c) {
      var T = G.T;
      c.fillStyle = T.ash;
      c.beginPath(); c.ellipse(me.x, me.y, 10, 2.6, 0, 0, Math.PI * 2); c.fill();
      c.save();
      c.translate(me.x, me.y - Math.abs(Math.sin(me.t * 7)) * 1.2);
      if (me.face < 0) c.scale(-1, 1);
      outlined(c, T, 1.6);
      // feet
      [-4, 4].forEach(function (x) { c.beginPath(); c.ellipse(x, -0.5, 3.6, 1.7, 0, 0, Math.PI * 2); c.fillStyle = T.ink; c.fill(); c.strokeStyle = T.paper; c.lineWidth = 0.9; c.stroke(); });
      // a tall bean in a red suit
      var body = new Path2D();
      body.moveTo(0, -30);
      body.bezierCurveTo(7, -30, 9.5, -22, 9.5, -12);
      body.bezierCurveTo(9.5, -3, 6, 0, 0, 0);
      body.bezierCurveTo(-6, 0, -9.5, -3, -9.5, -12);
      body.bezierCurveTo(-9.5, -22, -7, -30, 0, -30);
      c.fillStyle = T.paper;
      c.fill(body);
      c.save();
      c.clip(body);
      c.fillStyle = T.red;
      c.fillRect(-12, -15, 24, 18);
      c.fillStyle = T.ink;
      c.beginPath(); c.moveTo(0, -15); c.lineTo(-2, -10); c.lineTo(0, -4); c.lineTo(2, -10); c.closePath(); c.fill();
      c.restore();
      outlined(c, T, 1.6);
      c.stroke(body);
      // half-shut eyes and a smug little mouth
      c.beginPath();
      c.moveTo(-4.5, -21); c.lineTo(-1.5, -21);
      c.moveTo(1.5, -21); c.lineTo(4.5, -21);
      c.lineWidth = 1.2;
      c.stroke();
      c.beginPath(); c.arc(-3, -20.4, 1, 0, Math.PI); c.arc(3, -20.4, 1, 0, Math.PI); c.fillStyle = T.ink; c.fill();
      c.beginPath(); c.moveTo(-2.5, -17); c.quadraticCurveTo(0.5, -15.6, 3, -17.4); c.lineWidth = 1; c.stroke();
      // bowler hat
      c.beginPath(); c.ellipse(0, -29.5, 9, 2, 0, 0, Math.PI * 2); c.fillStyle = T.ink; c.fill(); c.strokeStyle = T.paper; c.lineWidth = 1; c.stroke();
      c.beginPath(); c.arc(0, -30, 6, Math.PI, 0); c.closePath(); c.fill(); c.stroke();
      // clipboard
      c.save();
      c.translate(9, -13);
      c.rotate(0.2);
      c.fillStyle = T.paper;
      outlined(c, T, 1.2);
      c.fillRect(-3, -5, 7, 9);
      c.strokeRect(-3, -5, 7, 9);
      c.beginPath(); c.moveTo(-1.5, -2); c.lineTo(2.5, -2); c.moveTo(-1.5, 0.5); c.lineTo(2.5, 0.5); c.lineWidth = 0.7; c.stroke();
      c.restore();
      c.restore();
      if (me.rent) {
        // his pile, on a little sign
        label(c, T, me.x, me.y - 40, "Rent " + me.rent, 8, T.paper);
      }
    }
    return me;
  }

  // ---------------------------------------------------------------------------
  // Space Billionaire: a rocket that offers a free trip. Boarding opens every
  // so often, a beam pulls in anyone nearby, and then it leaves. Smite it
  // during boarding to scrub the launch.
  // ---------------------------------------------------------------------------
  function rocket(G, H, spot) {
    var BEAM = 105, SEATS = 8;
    var me = {
      kind: "rocket", name: "Space Billionaire", spot: spot,
      x: 0, y: 0, phase: "idle", t: 7, aboard: [], lift: 0, claimed: 0,
      who: { x: 0, y: 0, lift: 92, state: "rival" },
      intro: "Free trip to space. Small print applies.",
      lines: ["Going somewhere better. Not you.", "First class. Everyone else, the hold.", "Mars has no taxes.",
              "Free trip. Small print applies.", "Window seat. There are no windows.", "I'm basically a god too."],
      place: function () { me.x = spot.x * G.WW; me.y = spot.y * G.WH; me.who.x = me.x; me.who.y = me.y; },
      update: function (dt) {
        me.t -= dt;
        // seats taken: those aboard, and those on their way
        me.claimed = me.aboard.length;
        G.folk.forEach(function (f) { if (f.state === "board") me.claimed++; });
        if (me.phase === "idle" && me.t <= 0) {
          me.phase = "boarding"; me.t = 6;
          H.say(me.who, "Boarding now. Free seats.", true);
          H.sfx.ping();
        } else if (me.phase === "boarding" && me.t <= 0) {
          me.phase = "launch"; me.t = 2.2;
          G.folk.forEach(function (f) { if (f.state === "board") f.state = "follow"; });
          if (me.aboard.length) H.say(me.who, "Going somewhere better. Not you.", true);
          H.sfx.launch();
        } else if (me.phase === "launch") {
          me.lift += dt * (40 + me.lift * 2.4);
          if (me.t <= 0) {
            if (me.aboard.length) {
              H.lose(me.aboard, "rocket");
              H.callout(me.aboard.length === 1 ? "1 Thonglet: in orbit" : me.aboard.length + " Thonglets: in orbit");
            }
            me.aboard = [];
            me.phase = "away"; me.t = 6;
          }
        } else if (me.phase === "away" && me.t <= 0) {
          me.phase = "idle"; me.t = 9; me.lift = 0;
        }
      },
      capture: function (f, dt, dl) {
        if (f.state === "board") {
          H.steer(f, me.x, me.y, f.speed * 0.8, dt);
          if (dl < H.RESCUE * 0.8 || me.phase !== "boarding") { f.state = "follow"; return false; }
          if (Math.hypot(f.x - me.x, f.y - me.y) < 12) {
            f.state = "aboard";
            f.carry = false;
            me.aboard.push(f);
            H.sfx.pick();
          }
          return true;
        }
        if (me.phase !== "boarding" || f.blessed > 0 || dl < 60 || me.claimed >= SEATS) return false;
        if (Math.hypot(f.x - me.x, f.y - me.y) < BEAM * G.mods.lure) {
          f.state = "board";
          me.claimed++;
          if (me.claimed === SEATS) H.say(me.who, "Fully booked. The rest of you can stay and watch.", true);
          if (Math.random() < 0.2) H.say(f, H.pick(["Ooh. Free.", "Space. Like heaven but further.", "Is god up there.", "I've never been anywhere."]));
          return true;
        }
        return false;
      },
      smite: function (x, y, r) {
        if (me.phase !== "boarding" || Math.hypot(me.x - x, me.y - 30 - y) > r + 40) return null;
        me.phase = "idle"; me.t = 10;
        me.aboard.forEach(function (f) { f.state = "stun"; f.t = 1; f.x = me.x + H.rand(-20, 20); f.y = me.y + H.rand(6, 20); f.vx = H.rand(-60, 60); f.vy = 60; });
        G.folk.forEach(function (f) { if (f.state === "board") f.state = "follow"; });
        me.aboard = [];
        H.say(me.who, "Launch scrubbed. I'm suing the sky.", true);
        return "Launch: scrubbed";
      },
      speak: function () { return me.phase === "away" ? null : H.pick(me.lines); },
      ground: function (c) {
        var T = G.T;
        // the launch pad
        c.fillStyle = T.ash;
        c.beginPath(); c.ellipse(me.x, me.y + 2, 30, 9, 0, 0, Math.PI * 2); c.fill();
        ring(c, me.x, me.y + 2, 30, 9, T.paper, 1.2, [3, 3]);
        if (me.phase === "boarding" && me.claimed < SEATS) {
          c.save();
          c.globalAlpha = 0.55 + Math.sin(me.t * 8) * 0.15;
          c.fillStyle = H.dots(c);
          c.beginPath(); c.ellipse(me.x, me.y + 4, BEAM * G.mods.lure, BEAM * G.mods.lure * 0.55, 0, 0, Math.PI * 2); c.fill();
          c.restore();
        }
      },
      stand: function () { return me.phase === "away" ? [] : [{ y: me.y, draw: draw }]; }
    };
    function draw(c) {
      var T = G.T, y = me.y - me.lift;
      c.save();
      c.translate(me.x + (me.phase === "launch" && !H.calm() ? Math.sin(me.t * 60) * 0.8 : 0), y);
      outlined(c, T, 2.2);
      if (me.phase === "launch") {
        // white smoke puffs with the accent behind (DESIGN.md, section 7)
        for (var i = 0; i < 6; i++) {
          var px = Math.sin(i * 2.3) * 12, py = 6 + i * 6 + me.lift * 0.3, pr = 6 + i;
          c.fillStyle = T.accent; c.beginPath(); c.arc(px + 2, py + 2, pr, 0, 7); c.fill();
          c.fillStyle = T.paper; c.beginPath(); c.arc(px, py, pr, 0, 7); c.fill();
        }
      }
      // fins
      c.fillStyle = T.red;
      [-1, 1].forEach(function (s) {
        c.beginPath(); c.moveTo(s * 9, -20); c.lineTo(s * 19, -2); c.lineTo(s * 9, -6); c.closePath(); c.fill(); c.stroke();
      });
      // body
      c.beginPath();
      c.moveTo(0, -78);
      c.bezierCurveTo(12, -64, 12, -30, 10, -4);
      c.lineTo(-10, -4);
      c.bezierCurveTo(-12, -30, -12, -64, 0, -78);
      c.closePath();
      c.fillStyle = T.paper;
      c.fill();
      c.stroke();
      // nose cone and a window with a smug little passenger
      c.beginPath(); c.moveTo(0, -78); c.bezierCurveTo(6, -71, 8, -64, 8.6, -60); c.lineTo(-8.6, -60); c.bezierCurveTo(-8, -64, -6, -71, 0, -78); c.closePath();
      c.fillStyle = T.red; c.fill(); c.stroke();
      c.beginPath(); c.arc(0, -44, 6.5, 0, Math.PI * 2); c.fillStyle = T.accent; c.fill(); c.stroke();
      c.fillStyle = T.paper;
      c.beginPath(); c.arc(0, -42.5, 3.6, 0, Math.PI * 2); c.fill();
      c.fillStyle = T.ink; c.fillRect(-3.4, -44.5, 6.8, 1.6);
      // the small print
      label(c, T, 0, -22, "Free", 7, null, T.ink);
      c.restore();
      if (me.phase === "boarding") {
        label(c, T, me.x, me.y - 92, "Boarding " + Math.ceil(me.t), 9, T.paper);
        var free = SEATS - me.claimed;
        label(c, T, me.x, me.y - 106, free > 0 ? free + (free === 1 ? " seat left" : " seats left") : "Fully booked", 7, null, T.paper);
      }
    }
    return me;
  }

  // ---------------------------------------------------------------------------
  // The Loudspeaker: a podium that shouts. Everyone in earshot marches towards
  // it chanting for a few seconds, wherever that takes them. Smite it to take
  // the microphone away.
  // ---------------------------------------------------------------------------
  function loudspeaker(G, H, spot) {
    var EAR = 140;
    var me = {
      kind: "loudspeaker", name: "The Loudspeaker", spot: spot,
      x: 0, y: 0, t: 6, quiet: 0, shout: 0,
      who: { x: 0, y: 0, lift: 52, state: "rival" },
      intro: "Simple answers. Loud.",
      slogans: ["Bricks for us. Not them.", "Who's them. Doesn't matter.", "Thongs first.", "The pit is fine. Trust me.",
                "Simple answers. Loud.", "Blame the ones over there.", "I'm one of you. In a better thong.", "Facts are a matter of volume."],
      chants: ["What it said.", "Thongs first.", "Yeah.", "Who's them.", "Hear hear.", "Loud. Good."],
      place: function () { me.x = spot.x * G.WW; me.y = spot.y * G.WH; me.who.x = me.x; me.who.y = me.y; },
      update: function (dt) {
        me.shout = Math.max(0, me.shout - dt);
        if (me.quiet > 0) { me.quiet -= dt; return; }
        me.t -= dt;
        if (me.t <= 0) {
          me.t = H.rand(8, 10);
          me.shout = 0.8;
          H.say(me.who, H.pick(me.slogans), true);
          H.sfx.blare();
          var chanter = null;
          G.folk.forEach(function (f) {
            if (f.state !== "follow" && f.state !== "pray") return;
            if (f.blessed > 0 || Math.hypot(f.x - G.light.x, f.y - G.light.y) < 50) return;
            if (Math.hypot(f.x - me.x, f.y - me.y) > EAR * G.mods.lure) return;
            f.state = "march"; f.t = 3.2; chanter = f;
          });
          if (chanter) H.say(chanter, H.pick(me.chants));
        }
      },
      capture: function (f, dt) {
        if (f.state !== "march") return false;
        f.t -= dt;
        H.steer(f, me.x, me.y + 18, f.speed * 0.85, dt);
        if (f.t <= 0) f.state = "follow";
        return true;
      },
      smite: function (x, y, r) {
        if (me.quiet > 0 || Math.hypot(me.x - x, me.y - y) > r + 24) return null;
        me.quiet = 12;
        G.folk.forEach(function (f) { if (f.state === "march") f.state = "follow"; });
        H.say(me.who, "This is censorship. Very quiet censorship.", true);
        return "Microphone: confiscated";
      },
      speak: function () { return null; },
      ground: function (c) {
        if (me.quiet > 0) return;
        ring(c, me.x, me.y + 4, EAR * G.mods.lure, EAR * G.mods.lure * 0.55, G.T.ash, 2, [2, 7]);
      },
      stand: function () { return [{ y: me.y, draw: draw }]; }
    };
    function draw(c) {
      var T = G.T;
      c.save();
      c.translate(me.x, me.y);
      outlined(c, T, 2.2);
      // podium
      c.fillStyle = T.paper;
      c.beginPath(); c.moveTo(-18, 0); c.lineTo(18, 0); c.lineTo(14, -30); c.lineTo(-14, -30); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = T.red; c.fillRect(-11, -24, 22, 8); c.strokeRect(-11, -24, 22, 8);
      label(c, T, 0, -20, "Loud", 6.5, null, T.paper);
      // stand and megaphone
      c.beginPath(); c.moveTo(0, -30); c.lineTo(0, -40); c.stroke();
      var k = me.shout > 0 && !H.calm() ? 1 + me.shout * 0.15 : 1;
      c.save();
      c.translate(0, -42);
      c.scale(k, k);
      c.fillStyle = me.quiet > 0 ? T.ash : T.paper;
      c.beginPath(); c.moveTo(-4, -3); c.lineTo(10, -9); c.lineTo(10, 9); c.lineTo(-4, 3); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = T.ink; c.fillRect(-9, -3, 5, 6); c.strokeRect(-9, -3, 5, 6);
      c.restore();
      if (me.shout > 0) {
        c.strokeStyle = T.paper;
        c.lineWidth = 1.6;
        for (var i = 0; i < 3; i++) { c.beginPath(); c.arc(12, -42, 8 + i * 5, -0.6, 0.6); c.stroke(); }
      }
      if (me.quiet > 0) {
        c.fillStyle = T.ink;
        c.fillRect(-12, -47, 24, 6);
        c.strokeStyle = T.paper; c.lineWidth = 0.8; c.strokeRect(-12, -47, 24, 6);
      }
      c.restore();
    }
    return me;
  }

  // ---------------------------------------------------------------------------
  // The Sea: rises from the bottom of the field all stage. Nobody mentions it.
  // In the water they wade slowly, and too long in the deep sweeps them away.
  // You can't smite the sea.
  // ---------------------------------------------------------------------------
  function sea(G, H, spot) {
    var me = {
      kind: "sea", name: "The Sea", spot: spot,
      level: 0, t: 0, top: 0.72, mention: 7,
      who: { x: 0, y: 0, lift: 0, state: "rival" },
      intro: null,
      place: function () { me.who.x = G.WW * 0.5; me.who.y = me.y(); },
      y: function () { return G.WH * (1.04 - (1.04 - me.top) * me.level); },
      update: function (dt) {
        me.t += dt;
        me.level = Math.min(1, me.level + dt / (G.stageTime * 0.75));
        me.who.y = me.y();
        me.mention -= dt;
        if (me.mention <= 0) {
          me.mention = H.rand(7, 11);
          var wet = G.folk.filter(function (f) { return f.wet > 0 && f.state !== "gone" && f.state !== "fall"; });
          if (wet.length) H.say(H.pick(wet), H.pick(["Is it me or is it wet.", "Nobody mention it.", "It's just a big puddle.", "My thong's wet. Lovely.", "Was this here before."]));
          else if (G.priest && G.priest.state === "follow") H.say(G.priest, H.pick(["The sea is a hoax. Keep building.", "Water is a matter of opinion.", "That's not the sea. That's weather."]));
        }
      },
      capture: function (f, dt) {
        var sy = me.y();
        if (f.y < sy) { f.wet = Math.max(0, f.wet - dt); f.wade = 1; return false; }
        f.wade = 0.55;
        var deep = f.y - sy > 40;
        f.wet = deep ? f.wet + dt : Math.max(0.01, f.wet - dt * 0.3);
        if (f.wet > 2.4) { H.lose([f], "sea"); return true; }
        return false;
      },
      smite: function (x, y) {
        if (y < me.y() - 10) return null;
        return "You can't smite the sea";
      },
      speak: function () { return null; },
      ground: function (c) { draw(c); },
      stand: function () { return []; }
    };
    function draw(c) {
      var T = G.T, sy = me.y();
      if (sy > G.WH) return;
      c.save();
      c.fillStyle = T.ink;
      c.fillRect(-10, sy, G.WW + 20, G.WH - sy + 10);
      c.globalAlpha = 0.7;
      c.fillStyle = H.dots(c);
      c.fillRect(-10, sy + 8, G.WW + 20, G.WH - sy + 10);
      c.globalAlpha = 1;
      // the wave on top, in white
      c.strokeStyle = T.paper;
      c.lineWidth = 2.4;
      c.beginPath();
      var off = H.calm() ? 0 : me.t * 30;
      for (var x = -10; x <= G.WW + 10; x += 6) {
        var wy = sy + Math.sin((x + off) / 18) * 3;
        if (x === -10) c.moveTo(x, wy); else c.lineTo(x, wy);
      }
      c.stroke();
      c.restore();
    }
    return me;
  }

  // ---------------------------------------------------------------------------
  // The Planning Office: no bricks go on the statue without a permit. Stand
  // enough Thonglets in its queue to get one stamped. Each permit covers so
  // many bricks. Smiting it makes it worse.
  // ---------------------------------------------------------------------------
  function office(G, H, spot) {
    var QUEUE = 52, COVER = 30;
    var me = {
      kind: "office", name: "The Planning Office", spot: spot,
      x: 0, y: 0, permit: 0, left: 0, queued: 0, nag: 0,
      who: { x: 0, y: 0, lift: 52, state: "rival" },
      intro: "Statue. Have you got a permit for that.",
      lines: ["Take a number.", "Form B7 is in the other building.", "Closed for lunch. Lunch is all day.",
              "Your statue has been flagged.", "Try the website. There is no website.", "Next.", "Pending."],
      place: function () { me.x = spot.x * G.WW; me.y = spot.y * G.WH; me.who.x = me.x; me.who.y = me.y; },
      blocks: function () { return me.left <= 0; },
      used: function (n) {
        if (me.left <= 0) return;
        me.left -= n;
        if (me.left <= 0) { me.left = 0; me.permit = 0; H.callout("Permit: expired"); H.say(me.who, "That permit's expired. Back of the queue.", true); }
      },
      update: function (dt) {
        me.nag -= dt;
        if (me.left > 0) return;
        var n = 0;
        G.folk.forEach(function (f) {
          if ((f.state === "follow" || f.state === "pray") && Math.hypot(f.x - me.x, (f.y - me.y - 22) * 1.4) < QUEUE) n++;
        });
        me.queued = n;
        me.permit = Math.min(1, me.permit + dt * Math.min(1, n / 6) * 0.22);
        if (me.permit >= 1) {
          me.left = COVER;
          H.callout("Permit: approved");
          H.sfx.stamp();
          H.say(me.who, "Approved. Don't get used to it.", true);
        }
      },
      waiting: function (f) {
        if (me.nag <= 0) { me.nag = 6; H.say(f, H.pick(["Waiting for a permit.", "Is it a brick if it's not approved.", "We're in a queue. Holy queue."])); }
      },
      capture: function () { return false; },
      smite: function (x, y, r) {
        if (Math.hypot(me.x - x, me.y - y) > r + 24) return null;
        me.permit = Math.max(0, me.permit - 0.5);
        if (me.left > 0) { me.left = 0; me.permit = 0; }
        H.say(me.who, "Assaulting an office. That's another form.", true);
        return "Permit: denied";
      },
      speak: function () { return H.pick(me.lines); },
      ground: function (c) {
        if (me.left > 0) return;
        ring(c, me.x, me.y + 22, QUEUE, QUEUE / 1.4, G.T.paper, 1.4, [3, 4]);
        label(c, G.T, me.x, me.y + 22 + QUEUE / 1.4 + 8, "Queue here", 8, null, G.T.paper);
      },
      stand: function () { return [{ y: me.y, draw: draw }]; }
    };
    function draw(c) {
      var T = G.T;
      c.save();
      c.translate(me.x, me.y);
      outlined(c, T, 2.2);
      c.fillStyle = T.paper;
      c.fillRect(-22, -38, 44, 38); c.strokeRect(-22, -38, 44, 38);
      c.fillStyle = T.ink;
      c.fillRect(-14, -30, 28, 14);
      // the shutter, half down
      c.fillStyle = T.paper;
      c.fillRect(-14, -30, 28, 7);
      c.strokeRect(-14, -30, 28, 14);
      c.beginPath(); c.moveTo(-14, -26.5); c.lineTo(14, -26.5); c.lineWidth = 0.8; c.stroke();
      c.fillStyle = T.paper;
      c.fillRect(-22, -48, 44, 10); outlined(c, T, 1.6); c.strokeRect(-22, -48, 44, 10);
      label(c, T, 0, -43, "Planning", 7.5);
      // its own stamp, on the front
      c.save();
      c.translate(0, -8);
      c.rotate(-0.12);
      label(c, T, 0, 0, me.left > 0 ? "Approved" : "Pending", 7, T.paper, T.red);
      c.restore();
      c.restore();
      // the permit: a meter while queuing, bricks left once it's stamped
      var bx = me.x - 20, by = me.y - 58;
      c.fillStyle = T.ink; c.fillRect(bx, by, 40, 5);
      c.fillStyle = me.left > 0 ? T.paper : T.accent;
      c.fillRect(bx, by, 40 * (me.left > 0 ? me.left / COVER : me.permit), 5);
      c.strokeStyle = T.paper; c.lineWidth = 1; c.strokeRect(bx, by, 40, 5);
    }
    return me;
  }

  window.ThongletRivals = {
    feed: feed, landlord: landlord, rocket: rocket, loudspeaker: loudspeaker, sea: sea, office: office,
    names: { feed: "The Feed", landlord: "A Landlord", rocket: "Space Billionaire", loudspeaker: "The Loudspeaker", sea: "The Sea", office: "The Planning Office" }
  };
})();
