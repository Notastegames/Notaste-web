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
| `public/main.js` | Rotating health warnings on the homepage |
| `public/favicon.svg` | Browser tab icon (placeholder until the logo is final) |
| `public/og-image.png` | Preview image shown when the link is shared on socials |
| `public/_headers` | Basic security headers |

## Design

Placeholder identity built on plain cigarette packaging: Pantone 448 C ("the ugliest colour"), plain Helvetica, and a white health-warning box as the one loud element. Will be revisited once the logo is final.

## Adding a game later

Each game can live in its own folder, e.g. `public/game-name/index.html`, which appears at `notastegames.com/game-name`. Bigger games can have their own repo in the Notastegames org instead.
