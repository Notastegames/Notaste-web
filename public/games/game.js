// Notaste Games — shared script for every game page.
// Runs the "More games" list, the Share button and, until a real game exists,
// the placeholder boot sequence inside #game-root.
(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // The catalogue. One line per game. "More games" on every page is built from
  // this list, so a new game only needs adding here once.
  // ---------------------------------------------------------------------------
  // accent is the game's colour; stamp is the word stamped across its cover;
  // status is shown under the pitch ("In development" if left out).
  var GAMES = [
    { slug: "thonglets",     title: "Thonglets",     accent: "#9a7bc4", stamp: "Classified",     pitch: "Tiny creatures in thongs who think you're their god. You are not a good one.", status: "Playable now. Seven stages and a Judgement Day." },
    { slug: "heavy-traffic", title: "Heavy Traffic", accent: "#4f9e9a", stamp: "Not approved",   pitch: "Kart racing. Large drivers, tiny cars. Physics has given up.", status: "Playable now. Three laps and a button marked Gas." },
    { slug: "slop-cannon",   title: "Slop Cannon",   accent: "#b3bf2a", stamp: "Pending review", pitch: "Fire endless AI slop into a feed. Nobody is checking.", status: "Playable now. Three stages and a final push." },
    { slug: "reply-all",     title: "Reply All",     accent: "#4fa3e0", stamp: "Not sent",       pitch: "Someone has replied all to the whole company. Now everyone is replying all to say stop replying all.", status: "Playable now." },
    { slug: "unexpected-item", title: "Unexpected Item", accent: "#4e9a55", stamp: "Approval needed", pitch: "Scan your own shopping. The machine thinks you're stealing it.", status: "Playable now." },
    { slug: "terms-and-conditions", title: "Terms and Conditions", accent: "#f2b48c", stamp: "Unread", pitch: "Read the terms. Strike out the bad bits. Accept anyway. There is no other button.", status: "Playable now." },
    { slug: "just-the-recipe", title: "Just the Recipe", accent: "#c2643a", stamp: "Rejected", pitch: "Scroll down to the recipe. The page has other ideas.", status: "Playable now. Three courses, one life story." },
    { slug: "on-mute",       title: "On Mute",       accent: "#7a5cd6", stamp: "You're on mute", pitch: "Four meetings, one spreadsheet and a cat. Nod when you hear your name.", status: "Playable now." }
  ];

  var current = document.body.getAttribute("data-game");
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  // Hide cover art that hasn't been drawn yet, rather than show a broken image
  function hideIfMissing(img) {
    function hide() { img.style.visibility = "hidden"; }
    if (img.complete && img.naturalWidth === 0 && img.getAttribute("src")) hide();
    img.addEventListener("error", hide);
  }
  Array.prototype.forEach.call(document.querySelectorAll(".screen-art"), hideIfMissing);

  // ---------- More games ----------
  // Small posters, like the homepage: cover art, a stamp, the title on a tag
  // that bites into the art. The whole card is one link.
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  var moreList = document.getElementById("more-list");
  if (moreList) {
    GAMES.forEach(function (game) {
      if (game.slug === current) return;
      var li = document.createElement("li");
      var a = el("a", "more-card");
      a.href = "/games/" + game.slug + "/";
      if (game.accent) a.style.setProperty("--accent", game.accent);

      var cover = el("span", "more-cover");
      // shown until the cover art exists
      var name = el("span", "more-cover-name", game.title);
      name.setAttribute("aria-hidden", "true");
      cover.appendChild(name);
      var img = document.createElement("img");
      img.src = "/art/" + game.slug + ".svg";
      img.alt = "";
      img.width = 800;
      img.height = 600;
      img.loading = "lazy";
      hideIfMissing(img);
      cover.appendChild(img);
      if (game.stamp) {
        var stamp = el("span", "stamp-label", game.stamp);
        stamp.setAttribute("aria-hidden", "true");
        cover.appendChild(stamp);
      }

      var body = el("span", "more-body");
      body.appendChild(el("span", "more-title", game.title));
      body.appendChild(el("span", "more-pitch", game.pitch));
      var status = el("span", "more-status");
      var dot = el("span", "dot");
      dot.setAttribute("aria-hidden", "true");
      status.appendChild(dot);
      status.appendChild(document.createTextNode(game.status || "In development"));
      body.appendChild(status);

      a.appendChild(cover);
      a.appendChild(body);
      li.appendChild(a);
      moreList.appendChild(li);
    });
  }

  // ---------- Share ----------
  var shareBtn = document.getElementById("share");
  var shareStatus = document.getElementById("share-status");

  function say(msg) {
    if (!shareStatus) return;
    shareStatus.textContent = "";
    // a fresh write so screen readers announce it again on repeat taps
    window.setTimeout(function () { shareStatus.textContent = msg; }, 30);
  }

  function copyFallback(url) {
    var field = document.createElement("textarea");
    field.value = url;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    document.body.removeChild(field);
    say(ok ? "Link copied" : url);
  }

  if (shareBtn) {
    shareBtn.addEventListener("click", function () {
      var url = location.href.split("#")[0];
      var data = {
        title: document.title,
        text: (document.querySelector('meta[name="description"]') || {}).content || "",
        url: url
      };
      if (navigator.share) {
        navigator.share(data).catch(function (err) {
          if (err && err.name === "AbortError") return; // they changed their mind
          copyFallback(url);
        });
      } else if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(url).then(function () { say("Link copied"); }, function () { copyFallback(url); });
      } else {
        copyFallback(url);
      }
    });
  }

  // ---------- Placeholder ----------
  // A real game removes data-placeholder from #game-root and takes over the
  // element itself. Until then this runs a fake boot and admits the truth.
  var root = document.getElementById("game-root");
  if (!root || !root.hasAttribute("data-placeholder")) return;

  var config = {};
  try {
    config = JSON.parse(root.querySelector(".ph-script").textContent);
  } catch (e) {
    config = {};
  }
  var lines = config.boot || [["Loading", "ok"]];

  var startBtn = root.querySelector(".ph-start");
  var restartBtn = root.querySelector(".ph-restart");
  var bootPane = root.querySelector(".ph-boot");
  var log = root.querySelector(".boot-log");
  var heading = root.querySelector(".ph-heading");
  var timers = [];

  function later(fn, ms) { timers.push(window.setTimeout(fn, ms)); }
  function clearTimers() { timers.forEach(window.clearTimeout); timers = []; }

  function setState(state) { root.setAttribute("data-state", state); }

  function finish() {
    clearTimers();
    setState("done");
    root.removeAttribute("aria-busy");
    if (heading) heading.focus({ preventScroll: true });
  }

  function boot() {
    clearTimers();
    log.textContent = "";
    setState("boot");
    root.setAttribute("aria-busy", "true");
    bootPane.focus({ preventScroll: true });

    if (reduceMotion) { finish(); return; }

    // Each line: type the task, pause, print the result. About 2.5 to 3s in total.
    var t = 150;
    var perChar = 9;
    lines.forEach(function (pair) {
      var task = pair[0];
      var result = pair[1];
      later(function () {
        var li = document.createElement("li");
        var span = document.createElement("span");
        li.appendChild(span);
        log.appendChild(li);
        for (var i = 1; i <= task.length; i++) {
          (function (n) {
            later(function () { span.textContent = task.slice(0, n); }, n * perChar);
          })(i);
        }
        if (result) {
          later(function () {
            span.textContent = task + " ... ";
            var res = document.createElement("span");
            res.className = "boot-res";
            res.textContent = result;
            li.appendChild(res);
          }, task.length * perChar + 120);
        }
      }, t);
      t += task.length * perChar + (result ? 230 : 120);
    });
    later(finish, t + 400);
  }

  // Skip the boot with Escape or a tap, in case anyone is in a hurry to be disappointed
  root.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && root.getAttribute("data-state") === "boot") finish();
  });
  bootPane.addEventListener("click", function () {
    if (root.getAttribute("data-state") === "boot") finish();
  });

  startBtn.addEventListener("click", boot);
  restartBtn.addEventListener("click", boot);
  setState("idle");
})();
