# Notaste Games website

The site for [notastegames.com](https://notastegames.com): free satirical browser games.

**Design rules live in [`DESIGN.md`](DESIGN.md).** Colours, type, logo use, stamps, illustration, copy voice, motion, sound and how games behave. Read it before changing anything people will see.

## How it works

- Plain static site, no build step. Everything the browser loads lives in `public/`.
- Hosted on Cloudflare (Workers static assets). `wrangler.jsonc` tells Cloudflare to serve `public/`.
- Changes are checked before they go live: a playable preview is published as a private Claude artifact (see `tools/preview_artifact.py`), and once it's approved the pull request is merged. Merging into `main` puts it live. Cloudflare also builds a preview link for every branch.

## Files

| Path | What it is |
| --- | --- |
| `DESIGN.md` | The design and voice rules every page and game follows |
| `CLAUDE.md` | Instructions for Claude sessions working on this repo |
| `ROADMAP.md` | The plan: games in order, site work, socials and merch |
| `public/index.html` | Homepage, including the "reject the internet" mini-game |
| `public/main.js` | The reject game (fake posts, NO button, swipe, N key) and the warning label |
| `public/styles.css` | Shared styles and colour tokens for every page |
| `public/games/game.css`, `game.js` | Game page layout, the arcade cabinet, "More games", share button, placeholder screen |
| `public/games/kit/` | The shared game kit: Notaste intro, title/pause/results screens, countdown, controls, sound, fullscreen, saved bests |
| `public/games/starter/` | In Tray, the starter game: a whole small game on the kit, kept out of search, copied to start every new game |
| `public/games/<slug>/` | One folder per game. Heavy Traffic is playable (`race.js` the race, `ground.js` the 3D road, `driver.js` the karts and drivers), and so are Thonglets (`thonglets.js` the game and its stages, `rivals.js` the six rival gods, `sprites.js` the characters) and Slop Cannon (`slop-cannon.js` the feed, the shots and the stages, `art.js` the drawings) |
| `public/art/` | Game cover art (SVG) and per-game share images (`og-<slug>.png`) |
| `public/brand/` | Logo, square mark and the worn stamp |
| `public/fonts/notaste-display.woff` | Headline font, built from the logo's letterforms |
| `public/404.html` | Page shown for links that don't exist |
| `public/privacy/` | The privacy note: what the site keeps (best scores, in your browser) and what it doesn't |
| `public/og-image.png` | Preview image when the homepage is shared |
| `public/site.webmanifest` | Name and icons for "Add to home screen" |
| `public/robots.txt`, `sitemap.xml` | For search engines |
| `public/_headers` | Basic security headers |
| `tools/build_font.py` | Rebuilds the headline font (`python3 tools/build_font.py public/fonts/notaste-display`, needs fonttools) |
| `tools/preview_artifact.py` | Packages a game page as a playable preview for a Claude artifact (`python3 tools/preview_artifact.py heavy-traffic <folder>`) |
| `tools/playtest.mjs` | The automatic play-through: checks every page and plays every kit game to the end (`node tools/playtest.mjs`, needs Playwright) |

## Games

Each game has a page at `public/games/<slug>/index.html`, sharing `public/games/game.css` and `public/games/game.js`.

Playable games are built on the kit: the page loads `/games/kit/kit.css`, `/games/kit/kit.js` and the game's own script, which calls `Notaste.createGame()`. The kit supplies the Notaste intro, the screens, controls, sound, saving, today's run and the Share result button, so every game looks and behaves the same. `public/games/starter/starter.js` (In Tray) is the small complete example to copy; Heavy Traffic and Thonglets are the big ones.

Games that aren't ready show a placeholder "Press start" screen from `game.js` while their `#game-root` has `data-placeholder`.

To add a game, follow the checklist at the end of `DESIGN.md`.

## Testing a game locally

```
python3 -m http.server -d public 8787
```

Then open `http://localhost:8787/games/heavy-traffic/`. Every game on the kit takes these flags:

- `?autopilot`: the game plays itself (it drives your kart, plays god, files the paperwork). Add `&speed=4` to run it four times as fast.
- `?clip`: the 9:16 frame for filming social clips, with the autopilot playing. Press Enter to start, and record the frame.

Heavy Traffic's `?debug` exposes the race as `window.__heavyTraffic`. Thonglets' `?debug` exposes the crowd and the score as `window.__thonglets`, and `&stage=4` starts at stage 4. Slop Cannon's `?debug` exposes the round as `window.__slop`, `&stage=3` starts at stage 3 and `&take=bots,fingers` starts with those upgrades.

## The automatic play-through

```
node tools/playtest.mjs              # every page and every game
node tools/playtest.mjs thonglets    # the site pages and one game
node tools/playtest.mjs --pages      # pages only, no play-throughs
```

It serves `public/` itself and opens it in headless Chromium. Every page has to load at phone width (375px, touch, reduced motion) and desktop width with no console errors, no failed or third-party requests and no sideways scrolling. Then each kit game is played to its results screen by its autopilot at eight times speed, Share result and Play again are pressed, today's run is started and the clip frame is checked. Thonglets takes about two minutes; everything else is quicker.

It needs Playwright once (`npm install -g playwright`, then `npx playwright install chromium`). There's deliberately no `package.json`, so Cloudflare's build has nothing to install.
