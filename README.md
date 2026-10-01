# Notaste Games website

The site for [notastegames.com](https://notastegames.com): free satirical browser games.

## How it works

- Plain static site, no build step. Everything the browser loads lives in `public/`.
- Hosted on Cloudflare (Workers static assets). `wrangler.jsonc` tells Cloudflare to serve `public/`.
- Cloudflare is connected to this repo, so every push to `main` goes live automatically.

## Files

| Path | What it is |
| --- | --- |
| `public/index.html` | Homepage |
| `public/404.html` | Page shown for links that don't exist |
| `public/styles.css` | All styling, colours and type |
| `public/main.js` | Rotating warnings, and hides the header logo while the big stamp is on screen |
| `public/favicon.svg` | Browser tab icon (plus PNG sizes and apple-touch-icon) |
| `public/brand/` | Logo, stamp badge and square mark (SVG) |
| `public/og-image.png` | Preview image shown when the link is shared on socials |
| `public/_headers` | Basic security headers |

## Design

"Stamped": clean white page, heavy condensed headlines (Anton) with Archivo body text, and stamp red (#D7141A) used only for stamps and the main button. The logo stamp lands on the page once when it loads. Logo files live in `public/brand/` (source pack generated separately, not a font).

## Adding a game later

Each game can live in its own folder, e.g. `public/game-name/index.html`, which appears at `notastegames.com/game-name`. Bigger games can have their own repo in the Notastegames org instead.
