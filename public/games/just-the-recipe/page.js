// Just the Recipe: the pages, and the words on them.
//
// Each course is one recipe page, built fresh from seeds taken from the
// round's (shell.seed), so today's run lays out the same three pages for
// everyone, whatever they chose along the way (see build). A page is a list of
// items in page units: 100 across the column, y measured down from the top of
// the page. recipe.js scrolls through them, draws them and makes them fight.
//
// The life story, the captions and everything the cast says live here too.
// The cooks are never the joke: the joke is everything the page has wrapped
// round the recipe to make money out of you on the way down.
(function () {
  "use strict";

  var PH = 5;             // an advert that hasn't loaded yet: a thin strip saying Advertisement

  // ---------------------------------------------------------------------------
  // The three courses. speed is how fast the page scrolls itself (units a
  // second); gap is how wide the white space through the life story is; shift
  // is how far that white space moves from one paragraph to the next; par is
  // the time a decent run takes, for the stamp between courses; limit is when
  // the session expires.
  // ---------------------------------------------------------------------------
  var COURSES = [
    {
      key: "starter", name: "Starter", dish: "Nan's tomato soup", food: "Soup",
      sub: "Ready in 20 minutes. Reading time: 45 minutes.",
      speed: 25, gap: [28, 34], shift: 34, par: 25, limit: 90, art: "soup",
      plan: [
        { t: "story", rows: 5, quote: 1 },
        { t: "banner", v: "edge" },
        { t: "story", rows: 7, photo: 1 },
        { t: "jump" },
        { t: "story", rows: 6, quote: 1 },
        { t: "banner", v: "edge" },
        { t: "story", rows: 6, photo: 1, quote: 1 },
        { t: "story", rows: 5, photo: 1 }
      ],
      quotes: ["It all started in 1987, in Nan's kitchen.", "Nan never measured anything. Neither do I.",
               "But first, a word about my kitchen tiles.", "The secret ingredient is time. Mostly yours.",
               "We moved house twice. The soup came with us."],
      photos: [{ who: "nan", cap: "Nan, 1987." }, { who: "keith", cap: "Uncle Keith. Not a soup man." },
               { who: "dog", cap: "Biscuit. Also not a soup man." }, { who: "me", cap: "Me, thinking about soup." }],
      recipe: { lines: ["Tomatoes", "An onion", "Stock", "Salt"], method: "Soften the onion. Add the rest. Simmer. Blend." }
    },
    {
      key: "main", name: "Main", dish: "Easy weeknight lasagne", food: "Lasagne",
      sub: "Serves four. Reading time: one evening.",
      speed: 27, gap: [25, 31], shift: 42, par: 40, limit: 110, art: "lasagne",
      plan: [
        { t: "story", rows: 4 },
        { t: "banner", v: "middle" },
        { t: "story", rows: 5, quote: 1, pop: 1 },
        { t: "advert" },
        { t: "story", rows: 5, photo: 1 },
        { t: "advert", behind: true },
        { t: "story", rows: 5, quote: 1, pop: 1 },
        { t: "banner", v: "middle" },
        { t: "story", rows: 4, quote: 1 },
        { t: "advert" },
        { t: "story", rows: 5, photo: 1, pop: 1 },
        { t: "jump" },
        { t: "story", rows: 4, photo: 1, quote: 1 },
        { t: "advert" },
        { t: "story", rows: 4 }
      ],
      quotes: ["Lasagne means family. I looked it up. It doesn't.", "Before the recipe, my trip to Italy. All of it.",
               "I layer it with love. And pasta.", "The kids call it the good lasagne. There is no bad lasagne.",
               "Some of you have asked about my oven. Here it is.", "We first made this on holiday. The holiday was our kitchen."],
      photos: [{ who: "kids", cap: "The kids. They eat toast." }, { who: "oven", cap: "My oven, from the front." },
               { who: "nan", cap: "Nan again. She insisted." }, { who: "me", cap: "Me in Italy, near some pasta." }],
      recipe: { lines: ["Pasta sheets", "Meat sauce", "White sauce", "Cheese"], method: "Layer it. Bake it. That's the recipe." }
    },
    {
      key: "pudding", name: "Pudding", dish: "A very simple sponge", food: "Sponge",
      sub: "Four ingredients. Seven thousand words.",
      speed: 29, gap: [22, 28], shift: 48, par: 46, limit: 125, art: "sponge",
      plan: [
        { t: "story", rows: 4 },
        { t: "video" },
        { t: "story", rows: 5, quote: 1 },
        { t: "banner", v: "hidden" },
        { t: "story", rows: 5, photo: 1, pop: 1 },
        { t: "jump", fake: true },
        { t: "story", rows: 4 },
        { t: "advert" },
        { t: "story", rows: 5, quote: 1, pop: 1 },
        { t: "video" },
        { t: "story", rows: 5, quote: 1 },
        { t: "banner", v: "middle" },
        { t: "story", rows: 4, photo: 1, pop: 1 },
        { t: "jump" },
        { t: "advert", behind: true },
        { t: "story", rows: 5, quote: 1 },
        { t: "jump", fake: true },
        { t: "story", rows: 4, photo: 1 }
      ],
      quotes: ["A sponge is a lot like life. Let me explain.", "Grandad hated sponge. This one's for him anyway.",
               "It's been a long year. Here's my year.", "You can't rush a sponge. Or this paragraph.",
               "My first sponge sank. So did I.", "Every sponge tells a story. This is that story."],
      photos: [{ who: "grandad", cap: "Grandad. Hated sponge." }, { who: "cake", cap: "The sponge. Finally." },
               { who: "dog", cap: "Biscuit, older now." }, { who: "me", cap: "Me, waiting for an oven." }],
      recipe: { lines: ["Eggs", "Flour", "Sugar", "Butter"], method: "Weigh the eggs. Same weight of everything else. Bake." }
    }
  ];

  // ---------------------------------------------------------------------------
  // The words
  // ---------------------------------------------------------------------------
  var BANNERS = [
    { title: "We value your privacy", line: "We and 1,412 partners would like to follow you home." },
    { title: "This site uses cookies", line: "Not the nice kind. The kind that remember you." },
    { title: "Your privacy matters to us", line: "A bit. Less than adverts. About the same as soup." },
    { title: "Before you continue", line: "Our partners would like a quick look through your bins." }
  ];

  // Adverts: invented, food-adjacent, and lying about something
  var ADVERTS = [
    { art: "onion", head: "This onion will make you cry" },
    { art: "pan", head: "Saucepans in your area" },
    { art: "fridge", head: "Win a fridge. Probably." },
    { art: "kettle", head: "Kettles hate this one trick" },
    { art: "spoon", head: "You won't believe this spoon" },
    { art: "pan", head: "Pans. Now with handles." }
  ];
  // After Accept all: the adverts know you now
  var KNOWN = ["Still thinking about soup", "We saw you looking at sponges", "Hello again. We remember you",
               "You, yes you. Saucepans."];

  // The new tab an advert opens, and what's on it
  var TABS = [{ head: "Mattresses near you", art: "bed" }, { head: "Ten soups ranked", art: "soup", dish: true },
              { head: "A free kettle. Terms apply.", art: "kettle" }, { head: "Saucepan clearance", art: "pan" }];

  var SAY = {
    // the chef, on cookie banners and in autoplay videos
    chef: ["Go on. Everyone else did.", "Accept all. Go on.", "We only want to know everything."],
    chefRejected: ["Rude.", "Fine. Melon.", "Suit yourself, plonker."],
    chefAccepted: ["Lovely. We'll tell everyone.", "Good. Adverts on the way."],
    chefManage: ["Have a seat.", "This might take a while."],
    chefVideo: ["Before the recipe, a short video.", "Don't close me.", "Up next: more of me.", "Is the sound on. Good."],
    chefClosed: ["I was getting to the sponge.", "Charming."],
    // the newsletter cat
    catWarn: ["Psst.", "Before you go.", "Quick one."],
    catOpen: ["Join 40,000 others.", "It's free. For now.", "Don't go.", "Weekly. Ish."],
    catClosed: ["Fine. Pillock.", "Your loss, lemon.", "I'll be back.", "We'll email you anyway."],
    catMissed: ["Missed. This time.", "I'll get you next paragraph.", "Fast, aren't you."],
    catWrong: ["That's not the X, lemon.", "Wrong button. Absolute weapon."],
    // the family, in the photos, as you skip past them
    nan: ["Skipping Nan. Lovely.", "Read it, you plonker.", "I'm in this bit, love."],
    keith: ["Don't mind me.", "Scroll on, melon."],
    dog: ["Woof. Means read it.", "Woof. Rude."],
    me: ["That's my life, that.", "You'll miss the bit about Tuscany."],
    kids: ["Toast is faster.", "Mum's on about Italy again."],
    grandad: ["I hated sponge. Read it anyway.", "In my day we read the whole thing."],
    oven: [],
    cake: [],
    // the ad blocker pop-up
    adblock: ["Saucepans don't sell themselves.", "That's our livelihood, melon."]
  };

  // ---------------------------------------------------------------------------
  // Building a page, in two passes, so today's run is the same pages for
  // everyone whatever they pick between courses.
  //
  // 1. The layout, all of it drawn from the page's own stream (rand) before
  //    any choice is looked at: every row of the life story and its white
  //    space, the photos and quotes, every banner and its buttons, every
  //    advert's side and size, where each Jump and video sits, and the
  //    pop-ups. Nothing a player picks changes a single draw from it.
  // 2. The choices, applied afterwards without touching that stream. Reader
  //    mode leaves the real Jump buttons' slots empty. Adverts owed for
  //    cookies, the banners that Accept all, forever turns into adverts and
  //    their pairs, and the ad blocker's pop-ups take their places and sizes
  //    from a second stream (more), so they're the same for everyone who
  //    made the same choice.
  // ---------------------------------------------------------------------------
  // n: which course (0, 1, 2). rand, more: the page's two seeded streams.
  // mods: the choices so far. owed: adverts owed for cookies accepted earlier.
  function build(n, rand, more, mods, owed) {
    var def = COURSES[n];
    var seedN = 1, gx = 50, adN = 0;

    function R(a, b) { return a + rand() * (b - a); }
    function shuffle(list, r) {
      r = r || rand;
      for (var i = list.length - 1; i > 0; i--) {
        var j = Math.floor(r() * (i + 1)), t = list[i];
        list[i] = list[j]; list[j] = t;
      }
      return list;
    }

    // ---------- 1. the layout ----------
    var quotes = shuffle(def.quotes.slice());
    var photos = shuffle(def.photos.slice());
    var ads = shuffle(ADVERTS.slice());
    var slots = def.plan.map(function (step) {
      if (step.t === "story") return planStory(step);
      if (step.t === "banner") return planBanner(step.v);
      if (step.t === "advert") return planAdvert(step);
      if (step.t === "jump") return { t: "jump", fake: !!step.fake, cx: R(24, 76) };
      return { t: "video", cx: R(28, 72) };
    });

    // ---------- 2. the choices ----------
    // Adverts owed for cookies accepted on earlier pages, before story sections
    if (owed) {
      var storyAt = [];
      slots.forEach(function (sl, i) { if (sl.t === "story" && i > 0) storyAt.push(i); });
      shuffle(storyAt, more).slice(0, Math.min(owed, storyAt.length)).sort(function (a, b) { return b - a; })
        .forEach(function (i) { slots.splice(i, 0, { t: "advert", known: true }); });
    }

    var items = [], triggers = [], storyTotal = 0;
    // The top of the page: the site, the title, a big photo of the dish
    items.push({ kind: "head", y: 0, h: 104, def: def });
    var y = 108;
    if (!mods.reader) items.push({ kind: "jump", y: y, h: 9, x0: 33, x1: 67, fake: false, first: true });
    y += 18;

    slots.forEach(function (sl) {
      if (sl.t === "story") {
        sl.rows.forEach(function (r) {
          y += r.pre;
          if (r.pop) triggers.push({ at: y - 6, kind: "news", track: n >= 2, confirm: r.pop.confirm });
          items.push({ kind: "story", y: y, h: r.h, blocks: r.blocks, gx: r.gx, gw: r.gw });
          storyTotal += r.h;
          y += r.h;
        });
        y += 8;
      } else if (sl.t === "banner") {
        // Accept all, forever: no banners, and the adverts that replace them come in pairs
        if (mods.forever) knownAdvert();
        else {
          items.push({ kind: "banner", y: y, h: 34, row: 14, rowH: 9, state: "up", t: 0, v: sl.v, layer: 1,
                       title: sl.title, line: sl.line, buttons: sl.buttons, second: sl.second });
          y += 44;
        }
      } else if (sl.t === "advert") {
        if (sl.known) knownAdvert();
        else {
          var it = { kind: "advert", y: y, h: PH, loaded: false, art: sl.art, head: sl.head, pop: 1,
                     x0: sl.x0, x1: sl.x1, full: sl.full, load: sl.load };
          if (sl.behind) it.behind = true;
          items.push(it);
          y += PH + 8;
        }
      } else if (sl.t === "jump") {
        // Reader mode takes the real ones away and leaves the gap
        if (sl.fake || !mods.reader) items.push({ kind: "jump", y: y, h: 9, x0: sl.cx - 17, x1: sl.cx + 17, fake: sl.fake });
        y += 17;
      } else {
        items.push({ kind: "video", y: y, h: 25, x0: sl.cx - 20, x1: sl.cx + 20 });
        y += 33;
      }
    });

    // A pop-up asking you to turn the ad blocker off, twice a page
    if (mods.adblock) {
      var rows = items.filter(function (it) { return it.kind === "story" && it.y > 200; });
      shuffle(rows, more).slice(0, 2).forEach(function (row) { triggers.push({ at: row.y, kind: "adblock" }); });
    }
    triggers.sort(function (a, b) { return a.at - b.at; });

    y += 10;
    items.push({ kind: "recipe", y: y, h: 62, def: def });
    return { items: items, triggers: triggers, len: y, storyTotal: storyTotal };

    // An advert that knows you (owed, or in place of a banner), from the
    // second stream; with Accept all, forever, a second one straight after
    function knownAdvert() {
      var w = 54 + more() * 12, left = more() < 0.5;
      items.push({ kind: "advert", y: y, h: PH, loaded: false, art: ADVERTS[Math.floor(more() * ADVERTS.length)].art,
                   head: KNOWN[Math.floor(more() * KNOWN.length)], pop: 1,
                   x0: left ? 0 : 100 - w, x1: left ? w : 100, full: Math.round(22 + more() * 6), load: 20 + more() * 10 });
      if (mods.forever) {
        y += PH + 18;
        var w2 = 50 + more() * 10;
        items.push({ kind: "advert", y: y, h: PH, loaded: false, art: ADVERTS[Math.floor(more() * ADVERTS.length)].art,
                     head: KNOWN[Math.floor(more() * KNOWN.length)], pop: 1,
                     x0: left ? 100 - w2 : 0, x1: left ? 100 : w2, full: Math.round(20 + more() * 6), load: 20 + more() * 8 });
      }
      y += PH + 8;
    }

    // ---------- the life story ----------
    function planStory(step) {
      var count = step.rows, out = [];
      var photoAt = step.photo ? 1 + Math.floor(rand() * (count - 1)) : -1;
      var quoteAt = -1;
      if (step.quote) { do { quoteAt = Math.floor(rand() * count); } while (quoteAt === photoAt); }
      var popAt = step.pop ? Math.floor(rand() * count) : -1;
      for (var i = 0; i < count; i++) {
        var pre = i && rand() < 0.3 ? 4 : 0;   // a paragraph break: white space all the way across
        var gw = R(def.gap[0], def.gap[1]);
        var row = { pre: pre, h: 14, blocks: [] };
        var a, b;
        if (i === photoAt && photos.length) {
          var ph = photos.pop();
          row.h = 36;
          // the photo goes on whichever side keeps the gap nearest the last one
          a = 44 + gw / 2; b = 56 - gw / 2;
          if (Math.abs(a - gx) <= Math.abs(b - gx)) {
            row.blocks.push({ type: "photo", x0: 3, x1: 44, who: ph.who, cap: ph.cap });
            if (44 + gw < 92) row.blocks.push({ type: "text", x0: 44 + gw, x1: 100, seed: seedN++ });
            gx = a;
          } else {
            row.blocks.push({ type: "photo", x0: 56, x1: 97, who: ph.who, cap: ph.cap });
            if (56 - gw > 8) row.blocks.push({ type: "text", x0: 0, x1: 56 - gw, seed: seedN++ });
            gx = b;
          }
        } else if (i === quoteAt && quotes.length) {
          var qw = Math.min(100 - gw, R(66, 74));
          row.h = 17;
          a = (qw + 100) / 2; b = (100 - qw) / 2;
          if (Math.abs(a - gx) <= Math.abs(b - gx)) {
            row.blocks.push({ type: "quote", x0: 0, x1: qw, text: quotes.pop() });
            gx = a;
          } else {
            row.blocks.push({ type: "quote", x0: 100 - qw, x1: 100, text: quotes.pop() });
            gx = b;
          }
        } else {
          row.h = Math.round(R(11, 17));
          // move the gap, but never further than a hand can follow
          var lo = Math.max(gw / 2, gx - def.shift), hi = Math.min(100 - gw / 2, gx + def.shift);
          var nx = R(lo, hi);
          if (rand() < 0.22) nx = nx < 50 ? lo : hi;
          gx = nx;
          if (gx - gw / 2 > 7) row.blocks.push({ type: "text", x0: 0, x1: gx - gw / 2, seed: seedN++ });
          if (gx + gw / 2 < 93) row.blocks.push({ type: "text", x0: gx + gw / 2, x1: 100, seed: seedN++ });
        }
        row.gx = gx;
        row.gw = gw;
        if (i === popAt) row.pop = { confirm: n >= 2 && rand() < 0.5 };
        out.push(row);
      }
      return { t: "story", rows: out };
    }

    // ---------- cookie banners ----------
    // edge: Reject all at one end. middle: tucked between the others.
    // hidden: no Reject all until you've been through Manage.
    function planBanner(v) {
      var copy = BANNERS[Math.floor(rand() * BANNERS.length)];
      var sl = { t: "banner", v: v, title: copy.title, line: copy.line };
      sl.buttons = buttons(v === "hidden" ? "first" : v);
      if (v === "hidden") sl.second = buttons("second");
      return sl;
    }

    function buttons(v) {
      var W = { accept: 42, manage: 17, reject: n ? 18 : 20, confirm: 27 };
      var order;
      if (v === "edge") order = rand() < 0.5 ? ["accept", "manage", "reject"] : ["reject", "manage", "accept"];
      else if (v === "middle") order = rand() < 0.5 ? ["accept", "reject", "manage"] : ["manage", "reject", "accept"];
      else if (v === "first") order = rand() < 0.5 ? ["accept", "manage"] : ["manage", "accept"];
      else order = rand() < 0.5 ? ["confirm", "accept", "reject"] : ["reject", "accept", "confirm"];
      var gap = 4, total = -gap;
      order.forEach(function (k) { total += W[k] + gap; });
      var x = v === "edge" || v === "second" ? (order[0] === "reject" ? 2 : 98 - total) : R(3, 97 - total);
      return order.map(function (k) {
        var btn = { type: k, x0: x, x1: x + W[k] };
        x += W[k] + gap;
        return btn;
      });
    }

    // ---------- adverts ----------
    // Ahead: a strip that jumps open in front of you. Behind: one you've
    // already passed, which loads late and shoves the whole page down.
    function planAdvert(step) {
      var ad = ads[adN++ % ads.length];
      var sl = { t: "advert", art: ad.art, head: ad.head };
      if (step.behind) {
        sl.behind = true;
        sl.x0 = 0; sl.x1 = 100;
        sl.full = Math.round(R(26, 32));
        sl.load = R(6, 26);           // how far past it you get before it loads
      } else {
        var w = R(54, 66), left = rand() < 0.5;
        sl.x0 = left ? 0 : 100 - w;
        sl.x1 = left ? w : 100;
        sl.full = Math.round(R(22, 28));
        sl.load = R(20, 30);          // how far ahead of you it is when it loads
      }
      return sl;
    }
  }

  window.RecipePage = {
    COURSES: COURSES,
    SAY: SAY,
    TABS: TABS,
    PH: PH,
    build: build
  };
})();
