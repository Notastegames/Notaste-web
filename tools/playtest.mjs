#!/usr/bin/env node
// Notaste Games: the automatic play-through.
//
//   node tools/playtest.mjs                every page and every game
//   node tools/playtest.mjs thonglets      the site pages and just these games
//   node tools/playtest.mjs --pages        skip the play-throughs
//   node tools/playtest.mjs --shots DIR    also save screenshots of results and clips
//
// It serves public/ on a spare port and opens it in headless Chromium
// (Playwright). Every page must load at phone width (375px, touch, reduced
// motion) and at desktop width with no console errors, no failed or
// third-party requests and no sideways scrolling. Then every game built on
// the kit is played to its results screen by its own autopilot at eight times
// speed, its Share result line is checked, Play again is pressed, today's run
// is started, and the clip frame (?clip) is checked.
//
// A checking tool only: nothing here ships with the site. It needs Playwright
// once: npm install -g playwright && npx playwright install chromium

import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PUBLIC = path.join(ROOT, "public");
const SITE = "https://notastegames.com";
const TIMEOUT = 300000;   // the longest a play-through may take, in ms

// ---------- Arguments ----------
const args = process.argv.slice(2);
const pagesOnly = args.includes("--pages");
const shotsAt = args.indexOf("--shots");
const shots = shotsAt >= 0 ? path.resolve(args[shotsAt + 1] || "playtest-shots") : null;
const only = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--shots");
if (shots) fs.mkdirSync(shots, { recursive: true });

// ---------- Playwright, from this folder or installed globally ----------
function playwright() {
  const require = createRequire(import.meta.url);
  try { return require("playwright"); } catch (e) {}
  try { return require(path.join(execSync("npm root -g").toString().trim(), "playwright")); } catch (e) {}
  console.error("Playwright isn't installed. Install it once with:\n  npm install -g playwright\n  npx playwright install chromium");
  process.exit(2);
}
const { chromium } = playwright();

// ---------- A static server for public/, with the site's 404 page ----------
const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".mjs": "text/javascript",
  ".svg": "image/svg+xml", ".png": "image/png", ".woff": "font/woff", ".woff2": "font/woff2",
  ".json": "application/json", ".webmanifest": "application/manifest+json", ".xml": "application/xml", ".txt": "text/plain"
};
const server = http.createServer((req, res) => {
  let file = path.join(PUBLIC, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (!file.startsWith(PUBLIC)) { res.writeHead(403); res.end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
  if (!fs.existsSync(file)) {
    res.writeHead(404, { "content-type": TYPES[".html"] });
    fs.createReadStream(path.join(PUBLIC, "404.html")).pipe(res);
    return;
  }
  res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
const BASE = "http://127.0.0.1:" + server.address().port;

// ---------- What to check ----------
const games = fs.readdirSync(path.join(PUBLIC, "games"))
  .filter((d) => d !== "kit" && fs.existsSync(path.join(PUBLIC, "games", d, "index.html")))
  .filter((d) => !only.length || only.includes(d));
const pages = ["/", "/privacy/", "/404.html"].concat(games.map((g) => "/games/" + g + "/"));

const VIEWS = {
  phone: { viewport: { width: 375, height: 812 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: "reduce" },
  desktop: { viewport: { width: 1280, height: 800 }, reducedMotion: "no-preference" }
};

// Everything that goes wrong on a page ends up in its list of problems
function watch(page) {
  const problems = [];
  page.on("console", (m) => { if (m.type() === "error") problems.push("console: " + m.text()); });
  page.on("pageerror", (e) => problems.push("script error: " + e.message));
  page.on("requestfailed", (r) => problems.push("failed: " + r.url().replace(BASE, "")));
  page.on("request", (r) => {
    const url = r.url();
    if (!url.startsWith(BASE) && !url.startsWith("data:") && !url.startsWith("blob:")) problems.push("third-party request: " + url);
  });
  return problems;
}

async function sideways(page) {
  const wide = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  return wide > 0 ? ["scrolls sideways by " + wide + "px"] : [];
}

const state = (page) => page.getAttribute("#game-root", "data-kit");

async function waitForState(page, want, ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (want.includes(await state(page))) return true;
    await page.waitForTimeout(200);
  }
  return false;
}

// ---------- A page loads cleanly ----------
async function checkPage(ctx, url) {
  const page = await ctx.newPage();
  const problems = watch(page);
  await page.goto(BASE + url, { waitUntil: "networkidle" });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));   // lazy images too
  await page.waitForTimeout(400);
  problems.push(...(await sideways(page)));
  await page.close();
  return problems;
}

// ---------- A game plays to the end, shares, and starts again ----------
async function playThrough(ctx, slug) {
  const page = await ctx.newPage();
  const problems = watch(page);
  await page.goto(BASE + "/games/" + slug + "/?autopilot&speed=8", { waitUntil: "networkidle" });
  if (!(await page.$(".kit-start"))) { await page.close(); return null; }   // not on the kit yet
  const title = (await page.textContent(".kit-title-name")).trim();
  const began = Date.now();
  await page.click(".kit-start");
  const seen = [];
  let now = "";
  while (Date.now() - began < TIMEOUT) {
    now = await state(page);
    if (seen[seen.length - 1] !== now) seen.push(now);
    if (now === "results") break;
    if (now === "interlude") await page.click(".kit-inter .kit-choice").catch(() => {});
    if (now === "paused") await page.click(".kit-pause .btn").catch(() => {});
    await page.waitForTimeout(250);
  }
  const took = Math.round((Date.now() - began) / 1000);
  const stages = seen.filter((s) => s === "interlude").length;
  if (now !== "results") {
    problems.push("no results screen after " + took + "s (stuck at " + now + ")");
  } else {
    const heading = (await page.textContent(".kit-results:not(.kit-inter) .kit-heading")).trim();
    if (!heading) problems.push("the results heading is empty");
    if (shots) await page.screenshot({ path: path.join(shots, slug + "-results.png") });
    await page.click(".kit-share");
    await page.waitForTimeout(300);
    const line = await page.evaluate(() => navigator.clipboard.readText()).catch(() => "");
    if (!line.startsWith(title) || !line.includes(SITE + "/games/" + slug + "/")) problems.push("share line: " + JSON.stringify(line));
    if (/!|—/.test(line)) problems.push("share line breaks the copy rules: " + line);
    await page.click(".kit-results:not(.kit-inter) .kit-actions .btn");
    if (!(await waitForState(page, ["playing"], 10000))) problems.push("Play again didn't start a round");
    console.log("        " + heading + " (" + took + "s" + (stages ? ", " + stages + " stage breaks" : "") + ")");
    console.log("        " + line);
  }
  await page.close();
  return problems;
}

// ---------- Today's run starts ----------
async function daily(ctx, slug) {
  const page = await ctx.newPage();
  const problems = watch(page);
  await page.goto(BASE + "/games/" + slug + "/?autopilot", { waitUntil: "networkidle" });
  const button = await page.$(".kit-mode");
  if (!button) { await page.close(); return ["no today's run on the title screen"]; }
  await button.click();
  if (!(await waitForState(page, ["playing"], 15000))) problems.push("today's run didn't start");
  await page.waitForTimeout(1500);
  await page.close();
  return problems;
}

// ---------- The clip frame is 9:16, with the screen inside it ----------
async function clip(ctx, slug) {
  const page = await ctx.newPage();
  const problems = watch(page);
  await page.goto(BASE + "/games/" + slug + "/?clip", { waitUntil: "networkidle" });
  const box = await page.evaluate(() => {
    const frame = document.querySelector(".kit-clip");
    if (!frame) return null;
    const r = frame.getBoundingClientRect();
    return { ratio: r.width / r.height, holds: !!frame.querySelector(".screen #game-root") };
  });
  if (!box) problems.push("no clip frame");
  else {
    if (Math.abs(box.ratio - 9 / 16) > 0.01) problems.push("the clip frame isn't 9:16 (" + box.ratio.toFixed(3) + ")");
    if (!box.holds) problems.push("the game screen isn't in the clip frame");
    await page.keyboard.press("Enter");
    if (!(await waitForState(page, ["playing"], 15000))) problems.push("Enter didn't start the clip");
    await page.waitForTimeout(3000);
    if (shots) await page.screenshot({ path: path.join(shots, slug + "-clip.png") });
  }
  problems.push(...(await sideways(page)));
  await page.close();
  return problems;
}

// ---------- Run it ----------
const browser = await chromium.launch();
let failed = 0;
function report(what, problems) {
  if (problems === null) return;
  const unique = [...new Set(problems)];
  console.log((unique.length ? "  FAIL  " : "  ok    ") + what);
  unique.forEach((p) => console.log("        " + p));
  if (unique.length) failed++;
}

const contexts = {};
for (const name of Object.keys(VIEWS)) {
  contexts[name] = await browser.newContext(VIEWS[name]);
  await contexts[name].grantPermissions(["clipboard-read", "clipboard-write"], { origin: BASE });
}

console.log("Pages");
for (const url of pages) {
  for (const name of Object.keys(VIEWS)) report(url + " (" + name + ")", await checkPage(contexts[name], url));
}

if (!pagesOnly) {
  for (const slug of games) {
    console.log("\n" + slug);
    const played = await playThrough(contexts.desktop, slug);
    if (played === null) { console.log("  -     not on the kit yet, nothing to play"); continue; }
    report("plays to the results screen, shares, plays again", played);
    report("today's run starts", await daily(contexts.desktop, slug));
    report("clip frame", await clip(contexts.desktop, slug));
  }
}

await browser.close();
server.close();
console.log(failed ? "\n" + failed + " failed." : "\nAll passed.");
process.exit(failed ? 1 : 0);
