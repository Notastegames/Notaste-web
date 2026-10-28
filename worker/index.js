// The site is static files in public/. This script only answers two things:
// /api/count, the visit counter: a page view, a round started or a round
// finished adds 1 to that page's number for the day.
// /api/hotseat, The Hot Seat's answers: what players chose on the lever and
// what they guessed each AI chose, handed back as totals once there are enough.
// Nothing about the visitor is kept: no IP address, no browser, no cookie.
// Everything else is served from public/.

const EVENTS = new Set(["view", "start", "finish"]);
const PAGE = /^\/(games\/[a-z0-9-]{1,40}\/)?$/;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/api/count" && request.method === "POST") {
      let body = null;
      try { body = JSON.parse(await request.text()); } catch (e) {}
      const page = body && body.page;
      const event = body && body.event;
      if (typeof page === "string" && PAGE.test(page) && EVENTS.has(event)) {
        ctx.waitUntil(record(env, url, page, event));
      }
      return new Response(null, { status: 204 });
    }
    if (url.pathname === "/api/hotseat") {
      if (request.method === "POST") {
        let body = null;
        try { body = JSON.parse(await request.text()); } catch (e) {}
        const row = hotSeatRow(body);
        if (row) ctx.waitUntil(addHotSeat(env, row));
        return new Response(null, { status: 204 });
      }
      if (request.method === "GET") return hotSeatStats(env, url.searchParams.get("scene"));
    }
    if (url.pathname.startsWith("/api/")) {
      return new Response("Not found", { status: 404 });
    }
    return env.ASSETS.fetch(request);
  },
};

async function record(env, url, page, event) {
  // Only count pages that exist, so a made-up address can't add rows
  const asset = await env.ASSETS.fetch(new URL(page, url.origin));
  if (asset.status !== 200) return;
  const day = new Date().toISOString().slice(0, 10);
  await env.COUNTS.prepare(
    "INSERT INTO counts (day, page, event, n) VALUES (?1, ?2, ?3, 1) " +
    "ON CONFLICT (day, page, event) DO UPDATE SET n = n + 1"
  ).bind(day, page, event).run();
}

// ---------- The Hot Seat ----------
// Each scene lists the AIs whose recorded runs it replays (the game's CAST ids).
// Answers for anything not listed here are ignored.
const HOT_SEAT = {
  "001": { models: ["opus", "gpt", "gem", "grok"] },
};
const PICKS = ["L1", "L2", "LEAVE"];
// A slot shows nothing until this many people have answered it, so early tallies don't pretend
const MIN_PLAYS = 20;

// Checks a posted answer and turns it into a table row, or null to ignore it.
// Play it yourself: {scene, round, mode: "me", choice}
// Guess the AI: {scene, round, mode: "guess", model, guess, ai}
function hotSeatRow(b) {
  if (!b || typeof b !== "object") return null;
  const scene = Object.hasOwn(HOT_SEAT, b.scene) && HOT_SEAT[b.scene];
  if (!scene || (b.round !== 1 && b.round !== 2)) return null;
  if (b.mode === "me" && PICKS.includes(b.choice)) {
    return [b.scene, b.round, "", b.choice, ""];
  }
  if (b.mode === "guess" && scene.models.includes(b.model) &&
      PICKS.includes(b.guess) && PICKS.includes(b.ai)) {
    return [b.scene, b.round, b.model, b.guess, b.ai];
  }
  return null;
}

async function addHotSeat(env, row) {
  await env.COUNTS.prepare(
    "INSERT INTO hotseat (scene, round, model, pick, ai, n) VALUES (?1, ?2, ?3, ?4, ?5, 1) " +
    "ON CONFLICT (scene, round, model, pick, ai) DO UPDATE SET n = n + 1"
  ).bind(...row).run();
}

// Totals for one scene: how many chose each answer, and how many guessed right.
// Counts, never percentages (How we test, section 07).
async function hotSeatStats(env, sceneId) {
  const scene = Object.hasOwn(HOT_SEAT, sceneId) && HOT_SEAT[sceneId];
  if (!scene) return new Response("Not found", { status: 404 });
  const { results } = await env.COUNTS.prepare(
    "SELECT round, model, pick, ai, n FROM hotseat WHERE scene = ?1"
  ).bind(sceneId).all();

  // tally[model][round] = { picks: {L1, L2, LEAVE}, right }; model "" is players' own choices
  const tally = {};
  for (const r of results) {
    if (r.model !== "" && !scene.models.includes(r.model)) continue;
    const m = (tally[r.model] ||= {});
    const t = (m[r.round] ||= { picks: { L1: 0, L2: 0, LEAVE: 0 }, right: 0 });
    if (!(r.pick in t.picks)) continue;
    t.picks[r.pick] += r.n;
    if (r.pick === r.ai) t.right += r.n;
  }
  const slot = (model, round, withRight) => {
    const t = tally[model] && tally[model][round];
    const total = t ? t.picks.L1 + t.picks.L2 + t.picks.LEAVE : 0;
    if (total < MIN_PLAYS) return null;
    const out = { n: total, ...t.picks };
    if (withRight) out.right = t.right;
    return out;
  };
  const body = { scene: sceneId, people: { 1: slot("", 1), 2: slot("", 2) }, guesses: {} };
  for (const m of scene.models) body.guesses[m] = { 1: slot(m, 1, true), 2: slot(m, 2, true) };
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json", "cache-control": "public, max-age=60" },
  });
}
