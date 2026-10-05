# How to review a Phase 3 game (notastegames.com)

You're reviewing a new browser game on a static site of free satirical games (plain HTML, CSS and JS in `public/`). Another agent built it. Find what stops it matching or beating the site's two finished games, Thonglets and Heavy Traffic. Be the demanding first player and art director: specific, honest and practical. Don't fix anything; report.

## Set up
- You're in your own git worktree. Find its root with `git rev-parse --show-toplevel` and use absolute paths.
- Run `git fetch origin && git checkout --detach origin/claude/game-<slug>`. Don't commit or push.
- Usage limits can stop you without warning. As you go, write your findings so far to `scratchpad/review-<slug>/findings.txt` (the harness blocks report `.md` files), so a restarted reviewer can pick them up.

## Read
- `CLAUDE.md` and all of `DESIGN.md` (the rules). Section 13 has the game's own notes.
- `ROADMAP.md` Phase 3: "Every Phase 3 game" is the bar, and the game's brief is the intent.
- The game folder (the main script's header comment is the design, with its test flags), its cover `public/art/<slug>.svg`, its share image `public/art/og-<slug>.png`, and its lines in `public/games/game.js`, `public/index.html` and `public/sitemap.xml`.
- For comparison, look at Thonglets and Heavy Traffic.

## Play it properly
- Serve `public/` with `python3 -m http.server -d public <some free port>` in the background. Drive Chromium with Playwright scripts kept in a scratch folder outside the repo (run with `NODE_PATH=$(npm root -g)`).
- Play as a human would, not just with `?autopilot`: mouse, touch emulation (375×812, `hasTouch`, `isMobile`) and keyboard only. Give your scripted players human reaction times (200 to 450ms) and errors. Try to win and try to lose. Measure whether skill decides the score.
- Screenshot every stage, the interludes, the results for a win and a loss, the title screen, `?clip`, and the homepage and "More games", at 375×812 and 1280×800. Look at each image.
- Check reduced motion. Run `node tools/playtest.mjs <slug>`.
- Look at the cover and share image next to the others in `public/art/`.

## Judge it against
- **Fun and clarity:** is it obvious what to do in the first ten seconds? Is it fair, does it build, does it have moments worth clipping? Would you play again? Is today's run worth sharing?
- **House style:** cut-out cartoon characters drawn per DESIGN.md section 7, the four inks only, thick outlines, halftone, speech bubbles. Is the art as good as Heavy Traffic's drivers and the Thonglets?
- **Copy:** British English, deadpan, no exclamation marks, no emoji, no em dashes, no real people or brands, no punching down. Is it actually funny? Flag weak lines and suggest better ones.
- **Interface rules** (DESIGN.md section 10): HUD layout, one red button per screen, notices, callouts at most one at a time, touch targets of 56px or more, keyboard focus, the pause, sound and fullscreen buttons.
- **Bugs:** console errors, overlaps, text under 12px on a phone, things off-screen, the 4:5 clip frame, performance.
- Mark anything that's really a kit problem (shared code) as **kit**; the lead handles those.

## Report
A prioritised list:
- **Must fix:** blocking problems, bugs, rule breaks, anything a player would hit.
- **Should fix:** these make it noticeably better.
- **Nice to have.**

For each item, say what you saw, where (file and line, or a screenshot path), and what to do about it. Finish with:
- **What works:** what to keep.
- **How close it is** to Thonglets and Heavy Traffic, in one paragraph.
- **The single change** that would lift it most.

Save screenshots under `<scratchpad>/review-<slug>/` and give their paths.
