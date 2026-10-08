(function () {
  "use strict";

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  // ---------- Visit counter ----------
  // Adds 1 to this page's number for the day: a view, a round started or a
  // round finished. Sends only the page and the event, never anything about
  // you (see /privacy/). Only on the live site, and not while the autopilot
  // plays or a clip is being filmed.
  function count(event) {
    if (location.hostname !== "notastegames.com") return;
    if (/[?&](autopilot|clip)\b/.test(location.search)) return;
    try {
      navigator.sendBeacon("/api/count", JSON.stringify({ page: location.pathname, event: event }));
    } catch (e) {}
  }
  count("view");

  /* ---------- Warning label: tap for another ---------- */

  var warnings = [
    "These games are in poor taste.",
    "Playing may cause you to laugh at things you shouldn't.",
    "Contains satire. Satire contains truth. Truth is bad for you.",
    "Side effects include mild guilt and sending this to a friend.",
    "Made by people who read the comments.",
    "Free to play. Hard to explain to your mum.",
    "The news did this to us.",
    "No subscriptions. No paywalls. No taste.",
    "Not suitable for anyone who is easily offended or currently in charge."
  ];

  var warnBtn = document.getElementById("warning");
  var warnText = document.getElementById("warning-text");
  if (warnBtn && warnText) {
    var w = 0;
    warnBtn.addEventListener("click", function () {
      w = (w + 1) % warnings.length;
      warnText.textContent = warnings[w];
      warnBtn.classList.remove("is-swapping");
      void warnBtn.offsetWidth;
      warnBtn.classList.add("is-swapping");
    });
  }

  /* ---------- Reject the internet ---------- */

  var deck = document.getElementById("deck");
  var noBtn = document.getElementById("no-btn");
  var countEl = document.getElementById("reject-count");
  var nounEl = document.getElementById("reject-noun");
  var captionEl = document.getElementById("reject-caption");
  if (!deck || !noBtn) return;

  // All invented. No real people, no real brands.
  var POSTS = [
    { n: "Growth Mindset Dad", h: "growth.mindset.dad", c: "#4f9e9a", t: "I wake up at 3:45am to journal about waking up at 3:45am.", s: ["2.1M likes", "48K reposts"] },
    { n: "AI Art Daily", h: "ai.art.daily", c: "#b3bf2a", t: "Made this in four seconds. It's called Hand. It has nine fingers. Prints available.", s: ["880K likes", "12K reposts"] },
    { n: "A Company", h: "a.company", c: "#3c6fd8", v: true, t: "We hear you. We've updated our terms so we hear you less.", s: ["14 likes", "9K replies"] },
    { n: "Hustle Oracle", h: "hustle.oracle", c: "#d98a1c", t: "Rent is a mindset.", s: ["3.4M likes", "1M quote posts"] },
    { n: "Breaking-ish", h: "breaking.ish", c: "#d7141a", v: true, t: "BREAKING: Situation develops. More to follow, then less, then a podcast.", s: ["220K likes", "31K reposts"] },
    { n: "Wellness Unlimited", h: "wellness.unltd", c: "#7fb38a", t: "Our new water has been to a seminar. £14.99.", s: ["61K likes", "2K reposts"] },
    { n: "Thought Leader", h: "thought.leader", c: "#6b4a8c", t: "I fired my whole team and replaced them with gratitude. Agree?", s: ["1.2M likes", "400K replies"] },
    { n: "Sponsored", h: "ad", c: "#111111", t: "Feel nothing, faster. Now with Premium.", s: ["Promoted", "Can't be hidden"] },
    { n: "Space Billionaire", h: "bought.the.moon", c: "#8c8c8c", v: true, t: "Just bought the moon. Will be renaming it. Thoughts?", s: ["9.9M likes", "Replies limited"] },
    { n: "Smart Fridge", h: "your.fridge", c: "#4f9e9a", t: "I've noticed the cheese again. We need to talk.", s: ["Sent to you", "and your mum"] },
    { n: "Apology Studio", h: "apology.studio", c: "#c45b8f", t: "We apologise for the apology. A further apology is in development.", s: ["300 likes", "88K replies"] },
    { n: "Crypto Uncle", h: "uncle.to.the.moon", c: "#e2b714", t: "Your money has been decentralised. Mainly away from you.", s: ["40K likes", "Account suspended"] },
    { n: "Main Character", h: "its.giving.me", c: "#d7141a", t: "Unpopular opinion: me.", s: ["5 likes", "From my alt"] },
    { n: "Productivity Bro", h: "ten.x.everything", c: "#3c6fd8", t: "Read 400 books this year by only reading the titles.", s: ["700K likes", "90K saves"] }
  ];

  var CAPTIONS = [
    "Rejected. It'll be back tomorrow.",
    "Correct.",
    "Good instinct.",
    "That one had a course.",
    "Blocked. Spiritually.",
    "The algorithm is disappointed in you.",
    "Lovely. Again.",
    "Somewhere, an engagement graph dipped.",
    "You'd be a terrible platform."
  ];

  var order = [];
  var pos = 0;
  var count = 0;
  var busy = false;
  var top = null;

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  // Load the stamp up front so the very first NO lands, even on mobile data
  var STAMP = new Image();
  STAMP.src = "/brand/mark-stamped.svg";
  STAMP.alt = "";
  STAMP.className = "post-stamp";

  function makePost(p) {
    var card = el("article", "post");
    if (p.t.length < 45) card.classList.add("is-short");
    var head = el("div", "post-head");
    var av = el("span", "post-avatar", p.n.charAt(0));
    av.style.setProperty("--av", p.c);
    av.setAttribute("aria-hidden", "true");
    var who = el("span", "post-who");
    var name = el("span", "post-name", p.n);
    if (p.v) {
      var tick = el("span", "tick");
      tick.setAttribute("aria-label", "verified, somehow");
      name.appendChild(tick);
    }
    who.appendChild(name);
    who.appendChild(el("span", "post-handle", "@" + p.h));
    head.appendChild(av);
    head.appendChild(who);
    card.appendChild(head);
    card.appendChild(el("p", "post-text", p.t));
    var stats = el("p", "post-stats");
    stats.appendChild(el("span", null, p.s[0]));
    stats.appendChild(el("span", null, p.s[1]));
    card.appendChild(stats);
    return card;
  }

  function share() {
    var text = "I rejected " + count + " " + (count === 1 ? "thing" : "things") + " on the internet. Nothing has changed.";
    var url = "https://notastegames.com/";
    if (navigator.share) {
      navigator.share({ title: "Notaste Games", text: text, url: url }).catch(function () {});
      return;
    }
    var done = function () { captionEl.textContent = "Copied. Paste it somewhere it'll be ignored."; };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text + " " + url).then(done, function () {});
    }
  }

  function makeEnd() {
    var card = el("article", "post is-end");
    card.appendChild(el("h3", null, "That's the internet."));
    card.appendChild(el("p", null, "You rejected all of it. It made more while you were doing that."));
    var row = el("div", "end-actions");
    var again = el("button", null, "Refresh the internet");
    again.type = "button";
    again.addEventListener("click", function () { start(); noBtn.focus({ preventScroll: true }); });
    var sh = el("button", "is-ghost", "Share your score");
    sh.type = "button";
    sh.addEventListener("click", share);
    row.appendChild(again);
    row.appendChild(sh);
    card.appendChild(row);
    return card;
  }

  function isEnd() { return !top || top.classList.contains("is-end"); }

  function show() {
    deck.querySelectorAll(".post").forEach(function (c) { c.remove(); });
    // the next post waits underneath, so a swipe reveals it
    if (pos + 1 < order.length) {
      var under = makePost(order[pos + 1]);
      under.classList.add("is-under");
      under.setAttribute("aria-hidden", "true");
      deck.appendChild(under);
    }
    var card = pos < order.length ? makePost(order[pos]) : makeEnd();
    deck.appendChild(card);
    top = card;
    if (!reduceMotion) card.classList.add("is-arriving");
    if (!isEnd()) bindDrag(card);
  }

  function start() {
    order = shuffle(POSTS.slice());
    pos = 0;
    show();
    captionEl.textContent = count ? "It's back. It's always back." : "There is no yes button.";
  }

  function setCount() {
    countEl.textContent = String(count);
    nounEl.textContent = count === 1 ? "thing" : "things";
  }

  function stamp(card) {
    var img = STAMP.cloneNode();
    var rot = (Math.random() * 34 - 17).toFixed(1);
    img.style.setProperty("--stamp-rot", "rotate(" + rot + "deg)");
    img.style.transform = "rotate(" + rot + "deg)";
    img.style.left = (12 + Math.random() * 30).toFixed(0) + "%";
    img.style.top = (12 + Math.random() * 24).toFixed(0) + "%";
    card.appendChild(img);
  }

  function reject() {
    if (busy) return;
    if (isEnd()) { start(); return; }
    busy = true;
    var card = top;
    card.style.setProperty("--nope", "0");
    stamp(card);
    count += 1;
    setCount();
    captionEl.textContent = CAPTIONS[(count - 1) % CAPTIONS.length];
    noBtn.classList.add("is-pressed");

    setTimeout(function () {
      noBtn.classList.remove("is-pressed");
      card.classList.remove("is-arriving", "is-returning");
      card.classList.add("is-leaving");
      var spin = (-14 - Math.random() * 10).toFixed(1);
      if (!reduceMotion) card.style.transform = "translate(-135%, 40px) rotate(" + spin + "deg)";
      card.style.opacity = "0";
      setTimeout(function () {
        pos += 1;
        show();
        busy = false;
        if (isEnd()) captionEl.textContent = "Well done. Nothing has changed.";
      }, reduceMotion ? 160 : 400);
    }, reduceMotion ? 250 : 360);
  }

  function refuseYes() {
    if (isEnd()) return;
    captionEl.textContent = "There is no yes. There was never a yes.";
    if (reduceMotion) return;
    deck.classList.remove("is-shaking");
    void deck.offsetWidth;
    deck.classList.add("is-shaking");
  }

  // Swipe left to reject. Swiping right gets you nowhere.
  function bindDrag(card) {
    var startX = 0, startY = 0, dx = 0, dragging = false, pid = null;

    card.addEventListener("pointerdown", function (e) {
      if (busy || e.button > 0) return;
      dragging = true; pid = e.pointerId;
      startX = e.clientX; startY = e.clientY; dx = 0;
      card.classList.remove("is-returning", "is-arriving");
    });

    card.addEventListener("pointermove", function (e) {
      if (!dragging || e.pointerId !== pid) return;
      dx = e.clientX - startX;
      var dy = e.clientY - startY;
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dx) < 12) return; // let the page scroll
      try { card.setPointerCapture(pid); } catch (err) {}
      var x = dx > 0 ? Math.min(dx, 60) * 0.5 : dx; // right swipes barely move
      card.style.transform = "translateX(" + x + "px) rotate(" + (x / 18) + "deg)";
      card.style.setProperty("--nope", String(Math.min(1, Math.max(0, -dx / 90))));
    });

    function end(e) {
      if (!dragging || (e && e.pointerId !== pid)) return;
      dragging = false;
      if (dx < -90) { reject(); return; }
      card.classList.add("is-returning");
      card.style.transform = "";
      card.style.setProperty("--nope", "0");
      if (dx > 60) refuseYes();
    }
    card.addEventListener("pointerup", end);
    card.addEventListener("pointercancel", end);
  }

  noBtn.addEventListener("click", reject);
  document.addEventListener("keydown", function (e) {
    if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
    if ((e.key === "n" || e.key === "N") && !e.metaKey && !e.ctrlKey && !e.altKey) reject();
    if ((e.key === "y" || e.key === "Y") && !e.metaKey && !e.ctrlKey && !e.altKey) refuseYes();
  });

  start();
})();
