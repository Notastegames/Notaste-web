// Leave It at the Door: the town. Its streets as a graph (junctions and the
// streets between them), the houses and restaurants along them, the way
// from anywhere to anywhere, and the drawing of everything that doesn't
// move, baked once into a bitmap for each stage.
//
// The town is 100 units across and 80 down, seen from straight above. Five
// streets run down it and four across, with two narrow lanes behind the
// flats (the back lane and the ginnel), a park, a car park full of
// kitchens, and a high street that becomes a precinct on cup final night.
(function () {
  "use strict";

  var WW = 100, WH = 80;
  var XS = [5, 27, 50, 73, 95];
  var YS = [6, 29, 52, 74];
  var RW = 2.6;      // half the width of a street
  var LW = 1.45;     // half the width of a lane

  var STREET_X = ["Albert Road", "Elm Road", "Church Street", "Victoria Road", "Ferry Lane"];
  var STREET_Y = ["Station Road", "Mill Lane", "High Street", "Canal Street"];

  var nodes = [], edges = [], stops = [], houses = [], blocks = [];
  var restaurants = [];

  function addNode(x, y) {
    for (var i = 0; i < nodes.length; i++) if (Math.abs(nodes[i].x - x) < 0.01 && Math.abs(nodes[i].y - y) < 0.01) return i;
    nodes.push({ id: nodes.length, x: x, y: y, adj: {} });
    return nodes.length - 1;
  }
  // An edge always runs from its lower coordinate to its higher one
  function addEdge(a, b, name, lane) {
    var A = nodes[a], B = nodes[b];
    if (A.x > B.x || A.y > B.y) { var t = a; a = b; b = t; A = nodes[a]; B = nodes[b]; }
    var h = Math.abs(A.y - B.y) < 0.01;
    var e = { id: edges.length, a: a, b: b, h: h, len: h ? B.x - A.x : B.y - A.y, name: name, lane: !!lane,
              oneway: 0, precinct: false, puddles: [], cars: [] };
    edges.push(e);
    A.adj[h ? "R" : "D"] = e.id;
    B.adj[h ? "L" : "U"] = e.id;
    return e;
  }
  function point(e, s) {
    var A = nodes[e.a];
    return e.h ? { x: A.x + s, y: A.y } : { x: A.x, y: A.y + s };
  }

  // ---------------------------------------------------------------------------
  // The streets
  // ---------------------------------------------------------------------------
  var LANE_A = 17.5;   // the back lane, across behind Mill Court
  var LANE_B = 16;     // the ginnel, down behind the Ginnel Flats
  (function build() {
    var grid = [];
    YS.forEach(function (y, r) { grid[r] = XS.map(function (x) { return addNode(x, y); }); });
    var la = addNode(XS[2], LANE_A), lb = addNode(XS[3], LANE_A);
    var ga = addNode(LANE_B, YS[2]), gb = addNode(LANE_B, YS[3]);
    // across
    YS.forEach(function (y, r) {
      for (var c = 0; c < XS.length - 1; c++) {
        if (c === 0 && r >= 2) {
          var mid = r === 2 ? ga : gb;
          addEdge(grid[r][0], mid, STREET_Y[r]);
          addEdge(mid, grid[r][1], STREET_Y[r]);
        } else addEdge(grid[r][c], grid[r][c + 1], STREET_Y[r]);
      }
    });
    // down
    XS.forEach(function (x, c) {
      for (var r = 0; r < YS.length - 1; r++) {
        if (r === 0 && (c === 2 || c === 3)) {
          var mid = c === 2 ? la : lb;
          addEdge(grid[0][c], mid, STREET_X[c]);
          addEdge(mid, grid[1][c], STREET_X[c]);
        } else addEdge(grid[r][c], grid[r + 1][c], STREET_X[c]);
      }
    });
    addEdge(la, lb, "the back lane", true);
    addEdge(ga, gb, "the ginnel", true);
  })();

  function edgeAt(x, y, h) {
    for (var i = 0; i < edges.length; i++) {
      var e = edges[i], A = nodes[e.a], B = nodes[e.b];
      if (e.h !== h) continue;
      if (h && Math.abs(A.y - y) < 0.01 && x >= A.x - 0.01 && x <= B.x + 0.01) return e;
      if (!h && Math.abs(A.x - x) < 0.01 && y >= A.y - 0.01 && y <= B.y + 0.01) return e;
    }
    return null;
  }
  // A place on the streets: the edge it's on and how far along
  function placeAt(x, y, h) {
    var e = edgeAt(x, y, h);
    if (!e) return null;
    var A = nodes[e.a];
    return { e: e.id, s: h ? x - A.x : y - A.y };
  }

  // ---------------------------------------------------------------------------
  // The blocks, and what's on them
  // ---------------------------------------------------------------------------
  // kind: houses, park, carpark. Restaurants and flats are placed by hand.
  var BLOCKS = {
    "0,0": "houses", "1,0": "houses", "2,0": "court", "3,0": "houses",
    "0,1": "houses", "1,1": "park", "2,1": "houses", "3,1": "houses",
    "0,2": "ginnel", "1,2": "houses", "2,2": "houses", "3,2": "carpark"
  };
  var REST = [
    { key: "chippy", name: "The Chippy", block: "0,0", side: "S", at: 16, icon: "fish" },
    { key: "noodle", name: "Noodle Bar", block: "2,1", side: "S", at: 61.5, icon: "bowl" },
    { key: "kebab", name: "Kebab Palace", block: "1,2", side: "N", at: 38.5, icon: "kebab" },
    { key: "burger", name: "Burger Shack", block: "3,0", side: "S", at: 84, icon: "burger" },
    { key: "dark", name: "The car park", block: "3,2", side: "N", at: 84, icon: "kitchen", dark: true }
  ];
  // Twelve restaurants, one kitchen, one car park
  var DARK_BRANDS = ["Mr Smash", "Bao Down", "Wing Theory", "Pasta La Vista", "Loaded", "Curry Up",
                     "Bowl Society", "Nacho Problem", "Big Cheese", "Fry Day", "Salad Days", "Peri Perry"];

  // a block's box, inside the pavements
  function blockBox(c, r) {
    return { x0: XS[c] + RW, x1: XS[c + 1] - RW, y0: YS[r] + RW, y1: YS[r + 1] - RW, c: c, r: r };
  }

  var HOUSE_W = 5.4, HOUSE_D = 6.6;
  function addStop(kind, x, y, h, side, extra) {
    var p = placeAt(x, y, h);
    var st = { id: stops.length, kind: kind, e: p.e, s: p.s, x: x, y: y, side: side };
    for (var k in extra) st[k] = extra[k];
    stops.push(st);
    return st;
  }

  // Houses along one side of a block. side: the street's side of the block
  // (N, S, W, E). Returns the houses made.
  function terrace(box, side, from, to, avoid) {
    var made = [];
    var horiz = side === "N" || side === "S";
    var lo = (horiz ? box.x0 : box.y0) + 0.7, hi = (horiz ? box.x1 : box.y1) - 0.7;
    lo = Math.max(lo, from == null ? lo : from);
    hi = Math.min(hi, to == null ? hi : to);
    var n = Math.floor((hi - lo + 0.6) / (HOUSE_W + 0.6));
    if (n < 1) return made;
    var gap = (hi - lo - n * HOUSE_W) / Math.max(1, n - 1);
    if (n === 1) gap = 0;
    var start = n === 1 ? (lo + hi) / 2 - HOUSE_W / 2 : lo;
    for (var i = 0; i < n; i++) {
      var a = start + i * (HOUSE_W + gap), mid = a + HOUSE_W / 2;
      if (avoid && avoid.some(function (v) { return Math.abs(v - mid) < 7.6; })) continue;
      var hs = { side: side, mid: mid, box: box };
      if (side === "N") { hs.x = a; hs.y = box.y0; hs.w = HOUSE_W; hs.h = HOUSE_D; hs.dx = mid; hs.dy = YS[box.r]; }
      if (side === "S") { hs.x = a; hs.y = box.y1 - HOUSE_D; hs.w = HOUSE_W; hs.h = HOUSE_D; hs.dx = mid; hs.dy = YS[box.r + 1]; }
      if (side === "W") { hs.x = box.x0; hs.y = a; hs.w = HOUSE_D; hs.h = HOUSE_W; hs.dx = XS[box.c]; hs.dy = mid; }
      if (side === "E") { hs.x = box.x1 - HOUSE_D; hs.y = a; hs.w = HOUSE_D; hs.h = HOUSE_W; hs.dx = XS[box.c + 1]; hs.dy = mid; }
      made.push(hs);
    }
    return made;
  }

  (function furnish() {
    var restAt = {};
    REST.forEach(function (R) { (restAt[R.block + R.side] = restAt[R.block + R.side] || []).push(R.at); });
    for (var r = 0; r < 3; r++) for (var c = 0; c < 4; c++) {
      var key = c + "," + r, kind = BLOCKS[key], box = blockBox(c, r);
      blocks.push({ key: key, kind: kind, box: box });
      var list = [];
      if (kind === "houses") {
        list = list.concat(terrace(box, "N", null, null, restAt[key + "N"]));
        list = list.concat(terrace(box, "S", null, null, restAt[key + "S"]));
      } else if (kind === "court") {
        // houses facing Station Road; Mill Court's flats face Mill Lane, back doors on the back lane
        list = list.concat(terrace(box, "N", null, null));
      } else if (kind === "ginnel") {
        // houses on the left of the ginnel facing the high street and the canal
        var left = { x0: box.x0, x1: LANE_B - LW, y0: box.y0, y1: box.y1, c: c, r: r };
        list = list.concat(terrace(left, "N"));
        list = list.concat(terrace(left, "S"));
      }
      list.forEach(function (hs) { hs.kind = "house"; houses.push(hs); });
    }
    // Mill Court: three flats, front doors on Mill Lane, back doors on the back lane
    var court = blockBox(2, 0);
    [54, 61.5, 69].forEach(function (x, i) {
      houses.push({ kind: "flat", block: "court", side: "S", x: x - 3.2, y: LANE_A + LW + 0.6, w: 6.4, h: court.y1 - (LANE_A + LW + 0.6),
                    mid: x, dx: x, dy: YS[1], bx: x, by: LANE_A, flatNo: i });
    });
    // The Ginnel Flats: front doors on Elm Road, back doors on the ginnel
    var gin = blockBox(0, 2);
    [57, 63.5, 70].forEach(function (y, i) {
      houses.push({ kind: "flat", block: "ginnel", side: "E", x: LANE_B + LW + 0.6, y: y - 2.9, w: gin.x1 - (LANE_B + LW + 0.6), h: 5.8,
                    mid: y, dx: XS[1], dy: y, bx: LANE_B, by: y, flatNo: i });
    });

    // House numbers: along each street, odd on one side and even on the other
    var byStreet = {};
    houses.forEach(function (hs) {
      var horiz = hs.side === "N" || hs.side === "S";
      var e = edgeAt(hs.dx, hs.dy, horiz);
      hs.street = e.name;
      var k = e.name + (hs.side === "N" || hs.side === "W" ? "a" : "b");
      (byStreet[k] = byStreet[k] || []).push(hs);
    });
    Object.keys(byStreet).forEach(function (k) {
      var list = byStreet[k].sort(function (p, q) { return p.mid - q.mid; });
      var odd = k.charAt(k.length - 1) === "a";
      list.forEach(function (hs, i) { hs.no = (odd ? 1 : 2) + i * 2 + (hs.street === "High Street" ? 20 : 0); });
    });

    // Stops: a front door for every house and flat, a back door for every flat
    houses.forEach(function (hs) {
      var horiz = hs.side === "N" || hs.side === "S";
      hs.front = addStop("door", hs.dx, hs.dy, horiz, hs.side, { house: hs });
      if (hs.kind === "flat") hs.back = addStop("back", hs.bx, hs.by, hs.block === "court", hs.block === "court" ? "S" : "E", { house: hs });
    });
    REST.forEach(function (R) {
      var c = +R.block.charAt(0), r = +R.block.charAt(2);
      var box = blockBox(c, r);
      var y = R.side === "N" ? YS[r] : YS[r + 1];
      var w = R.dark ? 16 : 9.5, d = R.dark ? box.y1 - box.y0 : 8.2;
      var rs = { key: R.key, name: R.name, icon: R.icon, dark: !!R.dark, side: R.side, block: box,
                 x: R.at - w / 2, y: R.side === "N" ? box.y0 : box.y1 - d, w: w, h: d, mid: R.at };
      if (R.dark) { rs.x = box.x0; rs.w = box.x1 - box.x0; }
      rs.stop = addStop("rest", R.at, y, true, R.side, { rest: rs });
      restaurants.push(rs);
    });
  })();

  // ---------------------------------------------------------------------------
  // Each stage's streets: rain puddles, the one-way system, parked cars, the
  // precinct. Movement cost: how long a stretch takes, as a share of normal.
  // ---------------------------------------------------------------------------
  var ONEWAY = [
    // [x, y, horizontal, +1 (towards higher coordinate only) or -1]
    [XS[2], 63, false, 1],      // Church Street, south of the high street: southbound
    [84, YS[1], true, -1],      // Mill Lane, east end: westbound
    [XS[1], 17, false, -1],     // Elm Road, north end: northbound
    [61, YS[3], true, 1],       // Canal Street: eastbound
    [XS[4], 40, false, 1]       // Ferry Lane: southbound
  ];
  var PUDDLES = [[40, YS[1], true], [XS[1], 63, false], [XS[3], 41, false], [84, YS[3], true], [61, YS[0], true], [XS[0], 40, false], [38, YS[3], true]];
  var CARS = [[39.5, YS[0], true, 1], [XS[4], 63, false, -1], [30.5, YS[3], true, -1], [XS[3], 64, false, 1], [16, YS[1], true, 1], [XS[2], 41, false, -1]];

  function setStage(opts) {
    edges.forEach(function (e) { e.oneway = 0; e.precinct = false; e.puddles = []; e.cars = []; });
    if (opts.oneway) ONEWAY.forEach(function (o) { var e = edgeAt(o[0], o[1], o[2]); if (e) e.oneway = o[3]; });
    if (opts.puddles) PUDDLES.forEach(function (p) { var pl = placeAt(p[0], p[1], p[2]); edges[pl.e].puddles.push(pl.s); });
    if (opts.cars) CARS.forEach(function (p) {
      var pl = placeAt(p[0], p[1], p[2]);
      edges[pl.e].cars.push({ s: pl.s, side: p[3], state: "parked", t: 0, wait: 2 + Math.random() * 4, id: edges[pl.e].id + ":" + pl.s });
    });
    if (opts.precinct) {
      [38, 61].forEach(function (x) { edgeAt(x, YS[2], true).precinct = true; });
    }
  }

  // ---------------------------------------------------------------------------
  // The way from anywhere to anywhere: shortest times between junctions,
  // worked out once a stage (one-way streets and the precinct cost more).
  // ---------------------------------------------------------------------------
  var dist = null, nextHop = null, costs = { against: 2.6, precinct: 2.2, lane: 1.15 };
  function edgeCost(e, forward) {
    var k = 1;
    if (e.oneway && (e.oneway > 0) !== forward) k *= costs.against;
    if (e.precinct) k *= costs.precinct;
    if (e.lane) k *= costs.lane;
    return e.len * k;
  }
  function plan(c) {
    if (c) for (var k in c) costs[k] = c[k];
    var n = nodes.length, i, j, m;
    dist = []; nextHop = [];
    for (i = 0; i < n; i++) { dist[i] = []; nextHop[i] = []; for (j = 0; j < n; j++) { dist[i][j] = i === j ? 0 : Infinity; nextHop[i][j] = i === j ? i : -1; } }
    edges.forEach(function (e) {
      dist[e.a][e.b] = edgeCost(e, true); nextHop[e.a][e.b] = e.b;
      dist[e.b][e.a] = edgeCost(e, false); nextHop[e.b][e.a] = e.a;
    });
    for (m = 0; m < n; m++) for (i = 0; i < n; i++) for (j = 0; j < n; j++) {
      if (dist[i][m] + dist[m][j] < dist[i][j]) { dist[i][j] = dist[i][m] + dist[m][j]; nextHop[i][j] = nextHop[i][m]; }
    }
  }
  // From a place {e, s} to a place: the cost and the junctions in between.
  // Cost is in units of normal riding.
  function route(from, to) {
    var E = edges[from.e], F = edges[to.e];
    var best = { cost: Infinity, path: [] };
    if (from.e === to.e) {
      var fwd = to.s >= from.s;
      var c = Math.abs(to.s - from.s) * edgeCost(E, fwd) / E.len;
      best = { cost: c, path: [] };
    }
    var outs = [[E.a, from.s * edgeCost(E, false) / E.len], [E.b, (E.len - from.s) * edgeCost(E, true) / E.len]];
    var ins = [[F.a, to.s * edgeCost(F, true) / F.len], [F.b, (F.len - to.s) * edgeCost(F, false) / F.len]];
    outs.forEach(function (o) {
      ins.forEach(function (q) {
        var c = o[1] + dist[o[0]][q[0]] + q[1];
        if (c < best.cost) best = { cost: c, from: o[0], to: q[0] };
      });
    });
    if (best.from != null) {
      var path = [best.from], at = best.from;
      while (at !== best.to && path.length < 60) { at = nextHop[at][best.to]; if (at < 0) break; path.push(at); }
      best.path = path;
    }
    return best;
  }

  // From junction n to a place {e, s}: the cost of the best way
  function costFrom(n, to) {
    var F = edges[to.e];
    return Math.min(dist[n][F.a] + to.s * edgeCost(F, true) / F.len, dist[n][F.b] + (F.len - to.s) * edgeCost(F, false) / F.len);
  }

  // The nearest place on the streets to a point in the town
  function nearest(x, y) {
    var best = null;
    edges.forEach(function (e) {
      var A = nodes[e.a];
      var s = e.h ? x - A.x : y - A.y;
      s = Math.max(0, Math.min(e.len, s));
      var p = point(e, s), d = Math.hypot(p.x - x, p.y - y);
      if (!best || d < best.d) best = { e: e.id, s: s, d: d };
    });
    return best;
  }

  window.LeaveTown = {
    WW: WW, WH: WH, XS: XS, YS: YS, RW: RW, LW: LW, LANE_A: LANE_A, LANE_B: LANE_B,
    nodes: nodes, edges: edges, stops: stops, houses: houses, blocks: blocks, restaurants: restaurants,
    DARK_BRANDS: DARK_BRANDS,
    point: point, placeAt: placeAt, edgeAt: edgeAt, nearest: nearest,
    setStage: setStage, plan: plan, route: route, edgeCost: edgeCost, costFrom: costFrom
  };
})();
