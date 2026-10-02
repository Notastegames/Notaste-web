# Notaste Games website

Free satirical browser games at notastegames.com. Plain static site in `public/`, hosted on Cloudflare.

## Read first

**Before any visual, copy, sound or game work, read `DESIGN.md` and follow it.** It is the source of truth for colours, type, logo use, stamps, illustration, voice, motion, sound and game interface rules. Don't introduce colours, fonts, motifs or copy styles that aren't in it. If a rule needs to change, change `DESIGN.md` in the same pull request and say why.

## Rules

- No build step and no external libraries, fonts, trackers or third-party requests. Everything ships from `public/`.
- Colours come from the CSS variables in `public/styles.css`. Canvas code reads them with `Notaste.tokens()`; never hard-code a hex value that isn't in `DESIGN.md`.
- Games use the shared kit in `public/games/kit/` (intro, title/pause/results screens, countdown, callouts, controls, sound, fullscreen, saved bests). Extend the kit rather than rebuilding those parts inside a game.
- Copy: British English, deadpan, no exclamation marks, no emoji, no em dashes, no punching down, no real people or brands in games.
- Respect `prefers-reduced-motion` everywhere.
- Work on a branch and open a pull request. Never push straight to `main`; merging into `main` puts it live.
- Before anything people will see goes live, publish a playable preview as a private Claude artifact and get the owner's approval. `python3 tools/preview_artifact.py <slug> <folder>` packages a game page (every path made relative) into a folder ready to publish: its `index.html` is the page, everything else goes alongside. Once approved, merge.
- Commits must not contain personal email addresses. Use the GitHub noreply address.

## Layout

| Path | What |
| --- | --- |
| `DESIGN.md` | Design and voice rules |
| `ROADMAP.md` | What's being built next, in order, and what "polished" means |
| `public/index.html`, `public/main.js`, `public/styles.css` | Homepage and shared site styles |
| `public/games/game.css`, `public/games/game.js` | Shared game page layout, cabinet, "More games", share button, placeholder boot |
| `public/games/kit/` | Shared game kit used by every playable game |
| `public/games/starter/` | In Tray, the starter game: copy it to start a new game |
| `public/games/<slug>/` | One folder per game |
| `public/art/` | Game covers (800×600 SVG) and share images (1200×630 PNG) |
| `public/brand/` | Logo files |
| `tools/build_font.py` | Rebuilds the Notaste Display font |
| `tools/playtest.mjs` | The automatic play-through: every page, every game played to the end |
| `wrangler.jsonc` | Cloudflare config (keep the `previews` block, preview builds need it) |

## Checking work

Run `node tools/playtest.mjs` (Playwright is needed once: `npm install -g playwright`). It checks every page at phone width (375px) and desktop width for console errors, failed or third-party requests and sideways scrolling, and plays every kit game to the end with its autopilot. It must pass before a pull request.

Then serve `public/` locally (`python3 -m http.server -d public 8787`) and look at what changed in a browser at both widths. Games: play a full round with keyboard, and check touch controls and reduced motion.
