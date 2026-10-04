# Rules for every Phase 3 builder and fixer (notastegames.com)

The site: a static site of free satirical browser games (plain HTML, CSS and JS in `public/`, no build step, no libraries, hosted on Cloudflare). Thonglets and Heavy Traffic set the standard; every new game must match or beat them. The owner plays every game before it merges.

## Branch and commits
- You're in your own git worktree. Find its root with `git rev-parse --show-toplevel` and use absolute paths.
- Your branch is `claude/game-<slug>`. Run `git fetch origin`. If `origin/claude/game-<slug>` exists, run `git checkout -B claude/game-<slug> origin/claude/game-<slug>` and carry on from it; never start again. Otherwise branch from `origin/main`.
- If the lead gives you a patch of unsaved work from a stopped helper, apply it (`git apply`), finish it, and commit it early.
- Commit after every meaningful step and push each time (`git push -u origin claude/game-<slug>`). Usage limits and restarts stop helpers without warning, and unpushed work is lost.
- Use the repo's git identity, never a personal email. End every commit message with:
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01Phqp5Sct2fBuhmAQCcMgAG
- Don't open a pull request, merge, or publish anything. Push only to your own branch.

## Rules
- `CLAUDE.md` and all of `DESIGN.md` are the rules. `ROADMAP.md` Phase 3 has the checklist ("Every Phase 3 game") and each game's brief.
- The kit is `public/games/kit/kit.js` (its API notes are above `createGame`) and `kit.css`; the starter template is `public/games/starter/`.
- Don't change shared files (`public/games/kit/`, `game.css`, `styles.css`, `tools/`, the font): other games are built in parallel. Solve kit gaps inside the game and say so in your report.
- In DESIGN.md, edit only your game's part of section 13.
- Leave the homepage section note and the order of posters and `GAMES` entries alone; the lead sorts those at merge.
- Copy: British English, deadpan, sentence case in the source, no exclamation marks, no emoji, no em dashes, no real people or brands, no punching down.
- Drawing: canvas in the house style, with thick ink outlines, flat fills, halftone shading, and only the four inks from `Notaste.tokens()` (grey only as halftone on white). Characters are the house cut-out cartoons (DESIGN.md section 7). Keep 60fps on a phone.
- It must read well on a 375px phone (square screen), on desktop (4:3) and in `?clip` (a 4:5 screen). Canvas text 12px minimum.
- Every game has today's run (`daily: true`), a `share` line, `shell.record`, notices, callouts, and an autopilot (`Notaste.flags.autopilot`) good enough to reach the results screen.

## Checks
- `node tools/playtest.mjs <slug>` must pass (Playwright is installed globally).
- Write your own Playwright scripts in a scratch folder outside the repo (run with `NODE_PATH=$(npm root -g)`). Screenshot the title screen, every stage, the interludes, the results and `?clip`, at 375×812 (touch) and 1280×800. Look at every image and fix what's off.
- Play with mouse, touch and keyboard using human-like reaction times (200 to 450ms), not just the autopilot. Check reduced motion.
- Leave no stray files in the repo.
