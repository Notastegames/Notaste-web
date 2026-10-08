// The site is static files in public/. This script only answers /api/count,
// the visit counter: a page view, a round started or a round finished adds 1
// to that page's number for the day. Nothing about the visitor is kept: no
// IP address, no browser, no cookie. Everything else is served from public/.

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
