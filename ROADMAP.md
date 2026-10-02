# Notaste Games roadmap

Where the site is going in the short term. Plain order of work, not dates. Change it whenever the plan changes.

Last updated: 2 October 2026.

---

## Where we are

- **Playable:** Thonglets (seven stages, Judgement Day, a daily run) and Heavy Traffic (still labelled an early prototype).
- **Placeholder:** Slop Cannon, next out of the door.
- **Built:** the shared game kit (with today's run, Share result and a clip mode for filming), the starter game, the automatic play-through, `DESIGN.md`, per-game share images, a privacy note, and the preview-then-approve process.
- **Not yet:** the socials (accounts partly set up, not linked yet), a shop link, and a homepage that works with more than three games.

## The goals

1. **Ten well-polished games on the site.** Nothing is promoted until then, because three games looks thin.
2. **Then open the socials** and build a following with short clips.
3. **Then five edgier games** (11 to 15) that take on how things are right now. These keep the socials going.
4. **Make some money along the way**, starting with merch.

---

## What "polished" means

A game counts towards the ten only when all of this is true:

- [ ] The full kit flow: title, intro, countdown, play, results. Pause, mute and fullscreen work.
- [ ] A round takes one to three minutes, and there's a reason to play again (a best score, a daily run).
- [ ] It plays well on a phone (375px, touch) and on desktop (keyboard), with reduced motion, no console errors and no sideways scrolling.
- [ ] Copy in the house voice: the pitch, three how-to-play lines, and a results joke for every rung of the approval ladder.
- [ ] It has a cover (800×600 SVG), a share image (1200×630 PNG), a homepage poster, an entry in `GAMES` and a line in the sitemap.
- [ ] It passes the automatic play-through (phase 2, once that exists).
- [ ] A preview has been published and approved.

Heavy Traffic needs one polish pass against this list before it drops the prototype label.

---

## Phase 1: tidy what's live

- [x] Homepage: replace "Coming soon" and "Three games are being made" with copy that says two games are playable. Fix the homepage share text, which also says "Coming soon".
- [x] Put a playable game (Thonglets) in the big featured slot until Slop Cannon is ready. "More games" lists playable games first too.
- [x] A short privacy note at `/privacy/` ("We save your best scores in your browser. That's it."), linked from every footer.
- [ ] A contact address. Left off for now; add it to the privacy page and footer once there is one.
- [ ] **Owner:** reserve `@notastegames` on TikTok, YouTube, Instagram, X and Bluesky now, so nobody else takes it. Partly done. Don't post or link them yet; the Follow section stays as it is until phase 5.

## Phase 2: make games cheaper and easier to share

Do this before game 3, so every game after it gets these for free.

- [x] **A starter game in the kit.** In Tray (`public/games/starter/`), a whole small game of about 300 lines, to copy instead of Heavy Traffic (about 2,700 lines across three files). The checklist in `DESIGN.md` section 12 points at it.
- [x] **A daily run for every game.** Today's run is in the kit (`daily: true`). Thonglets uses it, and Heavy Traffic has a "Today's race".
- [x] **Share your result.** A button on the results screen that shares or copies one line and a link: "Thonglets, today's run: 4,210. Not approved. notastegames.com/games/thonglets". Text only, Wordle-style.
- [x] **A clip mode.** `?clip` shows the game in a tall 9:16 frame, with no cabinet and the autopilot playing, ready for screen recording. This is where the social clips come from.
- [x] **An automatic play-through.** `node tools/playtest.mjs` checks every page at 375px and desktop width and plays every kit game to its results screen with the autopilot. It fails on console errors, failed or third-party requests, or sideways scrolling. It's for checking only and never ships.

## Phase 3: games 3 to 10

Small games: one mechanic, short rounds and a daily run. They're suggestions, so swap them freely. Record clips of each game as it ships (phase 2's clip mode), so phase 5 starts with a stockpile.

| # | Game | Type | Pitch |
| --- | --- | --- | --- |
| 1 | Thonglets | Done | Tiny creatures in thongs who think you're their god. You are not a good one. |
| 2 | Heavy Traffic | Needs polish | Kart racing. Large drivers, tiny cars. Physics has given up. |
| 3 | Slop Cannon | Arcade shooter | Fire endless AI slop into a feed. Nobody is checking. |
| 4 | Unexpected Item | Timing | Scan your shopping before the self-checkout decides you're a criminal. |
| 5 | Reply All | Whack-a-mole | Someone pressed reply all. Stop it before it reaches the whole company. |
| 6 | Terms and Conditions | Spot it | Read the small print at speed. Find the clause where you agreed to everything. |
| 7 | Just the Recipe | Side-scrolling dodger | Get to the recipe. Past the cookie banners, the newsletter and the life story. |
| 8 | Hold Music | Rhythm and memory | You are number 412 in the queue. Your call is important to us. |
| 9 | On Mute | Multitasking | Look engaged in a meeting while doing your actual job. |
| 10 | Scrubbed | Moon-lander physics | Land a billionaire's reusable rocket. It has been reused a lot. |

**Colours:** every game owns one colour (its accent), and fifteen of them that stay readable on black and distinct from each other is tight. Pick all fifteen up front and add them to `DESIGN.md` section 3, so later games don't get the leftovers.

## Phase 4: the site at ten games

- [ ] A games grid in place of the three-poster layout: "New", "Today's runs", then everything. Possibly a `/games/` page.
- [ ] A **Shop** link in the header and footer to the existing hoodie and T-shirt shop. Just a link: no embedded store, no shop scripts.
- [ ] A press page: logo, screenshots, one-line pitches, contact.
- [ ] An RSS feed of new games (a static file, no third parties).
- [ ] Search-engine tags (structured data) on each game page.
- [ ] Copies on itch.io and Newgrounds. `tools/preview_artifact.py` already makes every path relative, which is what those sites need.

## Phase 5: open the socials

Once there are ten polished games.

- [ ] Add the real links to the Follow section, the footer and the press page. Plain links: no embeds, widgets or follow buttons.
- [ ] **Where:** TikTok, YouTube Shorts and Instagram Reels first. That's where browser games get found. X and Bluesky are for the one-line jokes, if anyone can be bothered.
- [ ] **What:** 10–20 second clips of the funniest moment in each game (a smite, the Gas button, a stamp landing), with the pitch line as the caption. Post the daily run results. Launch with a stockpile from phase 3 so it doesn't run dry in week two.
- [ ] Each new game launches with a clip, a merch design and a share image.

## Phase 6: the edgier five (games 11 to 15)

These take on what's going on right now, and they're the ones most likely to get shared. In each one **you play the system**: the joke is how easy the system makes it, and the results stamp judges you for it.

| # | Game | Type | Pitch | Aimed at |
| --- | --- | --- | --- | --- |
| 11 | Bonus Season | Valve management | Run a water company. The pipes are full. The river is right there. | Privatised utilities, sewage in rivers |
| 12 | Surge | Push your luck | You are the pricing algorithm. It's raining. Umbrellas are now £80. | Dynamic pricing |
| 13 | Rage Bait | Word tiles | Run a news site. Make everyone furious. Furious people click. | The outrage economy |
| 14 | Be Your Own Boss | Pyramid building | Recruit two friends. They recruit two friends. The bottom of the pyramid is always someone else. | Pyramid schemes and course grifts |
| 15 | Verify | Quick-fire micro-games | Prove you're human to read the weather. The bots did it in 0.2 seconds. | Age checks and captchas that stop people, not bots |

Reserves if one doesn't work: **Rug Pull** (Launch a coin named after a dog. Sell it to everyone. Leave.) and **Upskill** (Train the AI that's replacing you. It's taking notes.).

**Where the line is.** Copy these into `DESIGN.md` section 2 in the pull request for the first edgier game:

- You play the institution or the business model. The joke is how easy it makes it, never the people on the receiving end. The swimmers, the customers and the bottom of the pyramid are never the punchline.
- Invented stand-ins only: "A Water Company", "A News Site". No real companies, people or political parties.
- Mock the machinery (outrage, slogans, small print), not a side. Rage Bait winds up two crowds who agree on nothing, and both are equally ridiculous.
- Aim at things that will still be true in a year, so the games don't date in a week.
- Everything else in `DESIGN.md` still applies: no gore, no slurs, nothing sexual, no punching down.

---

## Making money

This should cost next to nothing to run (static files on Cloudflare), so it can stay a passion project with upside. In order of how well each option fits:

1. **Merch.** The hoodie and T-shirt shop already exists, and the stamp words are ready-made designs: "Not approved", "Rejected", "In poor taste", "There is no yes button", plus one design per game (a Thonglet, the Gas button). Drop one with each game launch, and link the shop from the site in phase 4.
2. **Commissions.** Campaign groups, charities and publications pay for satirical games about their issue. Fifteen polished games is the portfolio. This fits the edgier five especially well.
3. **Adverts on portal copies, not on the site.** Poki and CrazyGames share advert revenue but need their own code in the game. Apply with separate copies of the best games, and the site itself stays ad-free (and keeps "Adverts: None, yet" true).
4. **A tip link** ("Buy the developer a coffee"). Small money, no scripts, keeps the rules.
5. **Adverts on the site.** Last resort. They pay little per player at this size and need third-party scripts, which breaks the site's rules and the joke.

The realistic big break is one game or one clip catching on. Daily runs, shareable results and clip mode are what give that a chance, and the merch is what turns the attention into money.

---

## Owner's decisions

- [ ] Reserve the social handles (phase 1).
- [ ] A contact address for the site (phase 1).
- [x] OK the automatic play-through tool (phase 2).
- [ ] Pick or swap the game ideas, and their order.
- [ ] The shop URL for the Shop link (phase 4).
- [ ] Whether and when to apply to the advert portals.
