// Just the Recipe: the pages, and the words on them.
//
// Each course is one recipe page, built fresh from a seed taken from the
// round's (shell.seed), so today's run lays out the same three pages for
// everyone, whatever they chose along the way. A page is a list of
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

  // The new tab an advert opens
  var TABS = ["Mattresses near you", "Ten soups ranked", "A free cruise. Terms apply.", "Saucepan clearance"];

  var SAY = {
    // the chef, on cookie banners and in autoplay videos
    chef: ["Cookies. Not the nice kind.", "Accept all. Go on.", "We only want to know everything."],
    chefRejected: ["Rude.", "Fine. Melon.", "Suit yourself, plonker."],
    chefAccepted: ["Lovely. We'll tell everyone.", "Good. Adverts on the way."],
    chefManage: ["Have a seat.", "This might take a while."],
    chefVideo: ["Before the recipe, a short video.", "Don't close me.", "Up next: more of me.", "Is the sound on. Good."],
    chefClosed: ["I was getting to the soup.", "Charming."],
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
    grandad: ["Hated it. Read about it anyway.", "In my day we read the whole thing."],
    oven: [],
    cake: [],
    // the ad blocker pop-up
    adblock: ["Please. We have saucepans to sell."]
  };

  // ---------------------------------------------------------------------------
  // Building a page
  // ---------------------------------------------------------------------------
  // n: which course (0, 1, 2). rand: a seeded random for this page. mods: the choices so far.
  // extraAds: adverts owed for cookies accepted on earlier pages.
  function build(n, rand, mods, extraAds) {
    var def = COURSES[n];
    var items = [], triggers = [];
    var y = 0, gx = 50, storyTotal = 0, seedN = 1;

    function R(a, b) { return a + rand() * (b - a); }
    function shuffle(list) {
      for (var i = list.length - 1; i > 0; i--) {
        var j = Math.floor(rand() * (i + 1)), t = list[i];
        list[i] = list[j]; list[j] = t;
      }
      return list;
    }
    var quotes = shuffle(def.quotes.slice());
    var photos = shuffle(def.photos.slice());
    var ads = shuffle(ADVERTS.slice());
    var adN = 0;

    // The top of the page: the site, the title, a big photo of the dish
    items.push({ kind: "head", y: 0, h: 104, def: def });
    y = 108;
    if (!mods.reader) items.push({ kind: "jump", y: y, h: 9, x0: 33, x1: 67, fake: false, first: true });
    y += 18;

    // Which story sections get an extra advert, for cookies accepted earlier
    var plan = def.plan.slice();
    if (extraAds) {
      var storyAt = [];
      plan.forEach(function (s, i) { if (s.t === "story" && i > 0) storyAt.push(i); });
      shuffle(storyAt).slice(0, Math.min(extraAds, storyAt.length)).sort(function (a, b) { return b - a; })
        .forEach(function (i) { plan.splice(i, 0, { t: "advert", known: true }); });
    }
    // Accept all, forever: no banners, and the adverts come in pairs
    if (mods.forever) {
      plan = plan.map(function (s) { return s.t === "banner" ? { t: "advert", known: true } : s; });
    }

    plan.forEach(function (step) {
      if (step.t === "story") story(step);
      else if (step.t === "banner") banner(step.v);
      else if (step.t === "advert") advert(step);
      else if (step.t === "jump") jump(step.fake);
      else if (step.t === "video") video();
    });

    // A pop-up asking you to turn the ad blocker off, twice a page
    if (mods.adblock) {
      var rows = items.filter(function (it) { return it.kind === "story" && it.y > 200; });
      shuffle(rows).slice(0, 2).forEach(function (row) { triggers.push({ at: row.y, kind: "adblock" }); });
    }
    triggers.sort(function (a, b) { return a.at - b.at; });

    y += 10;
    items.push({ kind: "recipe", y: y, h: 62, def: def });
    return { items: items, triggers: triggers, len: y, storyTotal: storyTotal };

    // ---------- the life story ----------
    function story(step) {
      var rows = step.rows;
      var photoAt = step.photo ? 1 + Math.floor(rand() * (rows - 1)) : -1;
      var quoteAt = -1;
      if (step.quote) { do { quoteAt = Math.floor(rand() * rows); } while (quoteAt === photoAt); }
      var popAt = step.pop ? Math.floor(rand() * rows) : -1;
      for (var i = 0; i < rows; i++) {
        if (i && rand() < 0.3) y += 4;   // a paragraph break: white space all the way across
        var gw = R(def.gap[0], def.gap[1]);
        var row = { kind: "story", y: y, h: 14, blocks: [] };
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
        if (i === popAt) triggers.push({ at: y - 6, kind: "news", track: n >= 2, confirm: n >= 2 && rand() < 0.5 });
        storyTotal += row.h;
        items.push(row);
        y += row.h;
      }
      y += 8;
    }

    // ---------- cookie banners ----------
    // edge: Reject all at one end. middle: tucked between the others.
    // hidden: no Reject all until you've been through Manage.
    function banner(v) {
      var copy = BANNERS[Math.floor(rand() * BANNERS.length)];
      var b = { kind: "banner", y: y, h: 34, row: 14, rowH: 9, state: "up", t: 0, v: v, layer: 1,
                title: copy.title, line: copy.line };
      b.buttons = buttons(v === "hidden" ? "first" : v);
      if (v === "hidden") b.second = buttons("second");
      items.push(b);
      y += b.h + 10;
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
    function advert(step) {
      var ad = ads[adN++ % ads.length];
      var head = ad.head;
      if (step.known) head = KNOWN[Math.floor(rand() * KNOWN.length)];
      var it = { kind: "advert", y: y, h: PH, loaded: false, art: ad.art, head: head, pop: 1 };
      if (step.behind) {
        it.behind = true;
        it.x0 = 0; it.x1 = 100;
        it.full = Math.round(R(26, 32));
        it.load = R(6, 26);           // how far past it you get before it loads
      } else {
        var w = R(54, 66), left = rand() < 0.5;
        it.x0 = left ? 0 : 100 - w;
        it.x1 = left ? w : 100;
        it.full = Math.round(R(22, 28));
        it.load = R(20, 30);          // how far ahead of you it is when it loads
      }
      if (mods.forever && step.known) {
        // Accept all, forever: a second one straight after, on the other side
        items.push(it);
        y += PH + 18;
        var w2 = R(50, 60), l2 = it.x0 > 0;
        it = { kind: "advert", y: y, h: PH, loaded: false, art: ads[adN++ % ads.length].art, head: KNOWN[Math.floor(rand() * KNOWN.length)],
               pop: 1, x0: l2 ? 0 : 100 - w2, x1: l2 ? w2 : 100, full: Math.round(R(20, 26)), load: R(20, 28) };
      }
      items.push(it);
      y += PH + 8;
    }

    // ---------- Jump to recipe ----------
    function jump(fake) {
      if (mods.reader && !fake) return;
      var cx = R(24, 76);
      items.push({ kind: "jump", y: y, h: 9, x0: cx - 17, x1: cx + 17, fake: !!fake });
      y += 17;
    }

    // ---------- an autoplay video, which comes loose and follows you ----------
    function video() {
      var cx = R(28, 72);
      items.push({ kind: "video", y: y, h: 25, x0: cx - 20, x1: cx + 20 });
      y += 33;
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
