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
| `public/index.html` | Homepage, including the "reject the internet" mini-game |
| `public/main.js` | The reject game (fake posts, NO button, swipe, N key) and the warning label |
| `public/styles.css` | Shared styles and colour tokens for every page |
| `public/games/game.css`, `game.js` | Game page layout, the arcade cabinet, "More games", share button, placeholder screen |
| `public/games/kit/` | The shared game kit: Notaste intro, title/pause/results screens, countdown, controls, sound, fullscreen, saved bests |
| `public/games/<slug>/` | One folder per game. Heavy Traffic is playable (`race.js` the race, `ground.js` the 3D road, `driver.js` the karts and drivers), and so is Thonglets (`thonglets.js` the game, `sprites.js` the characters); Slop Cannon shows a placeholder |
| `public/art/` | Game cover art (SVG) and per-game share images (`og-<slug>.png`) |
| `public/brand/` | Logo, square mark and the worn stamp |
| `public/fonts/notaste-display.woff` | Headline font, built from the logo's letterforms |
| `public/404.html` | Page shown for links that don't exist |
| `public/og-image.png` | Preview image when the homepage is shared |
| `public/site.webmanifest` | Name and icons for "Add to home screen" |
| `public/robots.txt`, `sitemap.xml` | For search engines |
| `public/_headers` | Basic security headers |
| `tools/build_font.py` | Rebuilds the headline font (`python3 tools/build_font.py public/fonts/notaste-display`, needs fonttools) |
| `tools/preview_artifact.py` | Packages a game page as a playable preview for a Claude artifact (`python3 tools/preview_artifact.py heavy-traffic <folder>`) |

## Games

Each game has a page at `public/games/<slug>/index.html`, sharing `public/games/game.css` and `public/games/game.js`.

Playable games are built on the kit: the page loads `/games/kit/kit.css`, `/games/kit/kit.js` and the game's own script, which calls `Notaste.createGame()`. The kit supplies the Notaste intro, the screens, controls, sound and saving, so every game looks and behaves the same. See `public/games/heavy-traffic/race.js` for a complete example.

Games that aren't ready show a placeholder "Press start" screen from `game.js` while their `#game-root` has `data-placeholder`.

To add a game, follow the checklist at the end of `DESIGN.md`.

## Testing a game locally

```
python3 -m http.server -d public 8787
```

Then open `http://localhost:8787/games/heavy-traffic/`. Adding `?autopilot` lets the computer drive your kart, and `?debug` exposes the race state as `window.__heavyTraffic` for poking at in the console.

Thonglets takes the same flags: `?autopilot` lets the computer play god, and `?debug` exposes the crowd and the score as `window.__thonglets`.
