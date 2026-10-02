# Notaste Games website

The site for [notastegames.com](https://notastegames.com): free satirical browser games.

## How it works

- Plain static site, no build step. Everything the browser loads lives in `public/`.
- Hosted on Cloudflare (Workers static assets). `wrangler.jsonc` tells Cloudflare to serve `public/`.
- Cloudflare is connected to this repo, so every push to `main` goes live automatically.

## Files

| Path | What it is |
| --- | --- |
| `public/index.html` | Homepage, including the "reject the internet" mini-game |
| `public/main.js` | The reject game (fake posts, NO button, swipe, N key) and the warning label |
| `public/styles.css` | Shared design system for every page |
| `public/games/` | Game pages, shared `game.css` / `game.js` |
| `public/art/` | Game cover art (SVG) and per-game share images (`og-<slug>.png`) |
| `public/brand/` | Logo, square mark and the stamp used in the reject game |
| `public/fonts/notaste-display.woff` | Headline font, built from the logo's letterforms |
| `public/404.html` | Page shown for links that don't exist |
| `public/og-image.png` | Preview image when the homepage is shared |
| `public/_headers` | Basic security headers |
| `tools/build_font.py` | Rebuilds the headline font (`python3 tools/build_font.py public/fonts/notaste-display`, needs fonttools) |

## Design

Black ground with film grain, paper white for the About section, and the logo's stamp red reserved for rejection: stamps and the NO button. Each game has its own accent colour (Slop Cannon #b3bf2a, Heavy Traffic #4f9e9a, Thonglets #9a7bc4). Headlines use Notaste Display, a custom face drawn from the logo; body text uses the device's own UI font so the fake feed reads like a real one. No third-party fonts or trackers.

## Games

Each game has a page at `public/games/<slug>/index.html`, sharing `public/games/game.css` and `public/games/game.js`. Cover art lives at `public/art/<slug>.svg` (800x600).

Until a game is ready, its page shows a placeholder "Press start" screen. The real game mounts in `<div id="game-root" data-placeholder>`: remove `data-placeholder` and replace the div's contents with the game.

To add a game: copy a game folder, edit the lines marked `<!-- EDIT -->`, add one line to the `GAMES` list at the top of `game.js`, add its cover to `public/art/`, and add a card on the homepage. Bigger games can have their own repo in the Notastegames org on a subdomain instead.
