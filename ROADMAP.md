# Notaste Games roadmap

Where the site is going in the short term. Plain order of work, not dates. Change it whenever the plan changes.

Last updated: 6 October 2026.

---

## Where we are

- **Playable (10):** Thonglets, Heavy Traffic, Slop Cannon, Unexpected Item, Reply All, Terms and Conditions, Just the Recipe, Hold Music, On Mute and Scrubbed. Phase 3 is done.
- **Extra:** Thirty Days (mint, sorting), the owner's own idea after phase 3: thirty days of fast food, with your insides as a council office. Live on 6 October 2026. It isn't one of the edgier five, so those are still 11 to 15 in their own order.
- **Extra:** two delivery games, also the owner's idea, live on 6 October 2026. Speak to a Human (periwinkle, chat boss fight): your food never came and the help chat is a bot. Leave It at the Door (cyan, delivery juggling): a rider's shift in a town one app runs. Neither is one of the edgier five either.
- **Next:** the owner's notes on the ten (see "Left over" in Phase 3), then phase 4 (the site at ten games), then phase 5 (the socials).
- **Built:** the shared game kit (with today's run, Share result and a clip mode for filming), the starter game, the automatic play-through, `DESIGN.md`, per-game share images, a privacy note, and the preview-then-approve process.
- **Not yet:** the socials (accounts partly set up, not linked yet) and a shop link, which now comes after the socials.
- **Homepage:** the newest game has the wide featured slot, and every other game is a small tile in a grid under it, newest first (3 across on desktop, 2 on a phone).

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

All ten games meet this list. Heavy Traffic had its polish pass on 6 October and dropped the prototype label. Batches 2 and 3 went live together on 6 October, as the owner asked ("merge all together once complete"); their playable previews are still there to play.

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

## Phase 3: games 3 to 10 (done)

Eight new games and a polish pass on Heavy Traffic, so the site has ten. All live on 6 October 2026. The briefs are kept below for reference.

| # | Game | Type | Accent | Status |
| --- | --- | --- | --- | --- |
| 1 | Thonglets | God game | lilac | Live |
| 2 | Heavy Traffic | Kart racing | teal | Live; polished (#23) |
| 3 | Slop Cannon | Arcade artillery | slime | Live (#14) |
| 4 | Unexpected Item | Timing | checkout green | Live (#16) |
| 5 | Reply All | Whack-a-mole | sky | Live (#15) |
| 6 | Terms and Conditions | Spot it | peach | Live (#18) |
| 7 | Just the Recipe | Vertical dodger | rust | Live (#20) |
| 8 | Hold Music | Rhythm and memory | magenta | Live (#22) |
| 9 | On Mute | Multitasking | violet | Live (#21) |
| 10 | Scrubbed | Lander physics | orange | Live (#24) |

All fifteen accents (these and the edgier five) are in `DESIGN.md` section 3.

### Left over

Nothing in Phase 3 is half done. What's left is notes and small things, none of them blocking.

1. **The owner's notes on the ten.** Each becomes a fix on a fresh `claude/game-<slug>` branch from `main`, before phase 4.
2. ~~**Kit follow-ups** the reviews found~~. Done on `claude/kit-fixes`: the results fit a 320×568 phone, leaving full-window mid-round pauses with "Back to full screen", the notice fades under a finger and its clock stops while paused, `countIn` and a callout position option (Heavy Traffic, Unexpected Item and Hold Music moved onto it). Heavy Traffic and Scrubbed count in after a pause.
3. **Each game's "still weak" list** is at the end of its pull request. The ones worth a real phone: the frame rate in Just the Recipe's full window and On Mute's all-hands, and Hold Music's tap timing through Bluetooth headphones.
4. **Loose ends:**
    - The homepage's own share image (`public/og-image.png`) still shows the old Slop Cannon art.
    - A few share images are heavy (Slop Cannon's is 593KB, Scrubbed's 357KB).
    - Thonglets' autopilot sometimes fails an early stage in the play-through. That's chance, not a fault.

Helpers are briefed with `docs/phase3/builder-rules.md` (builders and fixers) and `docs/phase3/reviewer-rules.md` (reviewers), plus the game's brief below. The same briefs work for games 11 to 15.

### How it runs

- **One branch and one pull request per game:** `claude/game-<slug>`, pushed as it goes, so nothing is lost if a session stops.
- **Batches of three.** Each game gets a builder, which designs and builds it from its brief, then a reviewer, which plays it cold against `DESIGN.md` and the standard Thonglets and Heavy Traffic set. The builder fixes what the reviewer finds, then a final check, a playable preview and a pull request.
- **Nothing merges until the owner has played it and said yes.** Expect a round or two of notes per game; that's where "as good as the first two" comes from. (For batches 2 and 3 the owner said to merge them all together once everything was finished.)
- **If a session stops** (a usage limit, a restart), a check-in every couple of hours picks the work back up from the branches, the open pull requests and this list.
- **The homepage** gets each game as it merges: the new one takes the featured slot and the one before it joins the top of the grid.

### Every Phase 3 game

- Built from the starter (`public/games/starter/`) on the kit, and passes `node tools/playtest.mjs <slug>`.
- A round of one to three minutes that builds: at least three stages or waves, each new thing announced with a notice (`shell.brief`), and a choice between stages where it suits (`shell.interlude`).
- Today's run, a `share` line on the results, an autopilot good enough to reach the results screen, and it reads well in the clip frame (a 4:5 screen) as well as square and 4:3.
- Characters are the house cut-out cartoons (`DESIGN.md` section 7) with speech bubbles and the house insults. Stamp callouts, lo-fi sounds through the kit, small shakes on impacts (none with reduced motion).
- A cover (800×600 SVG) and a share image (1200×630 PNG) in the four inks, a pitch, three how-to-play lines, a results joke for every rung of the ladder, a `GAMES` entry, a homepage poster and a sitemap line.
- Its own part of `DESIGN.md` section 13: characters, stamp words, anything only it does.
- Satire aims at the system in the brief, never at the people stuck in it.

### Briefs

**Slop Cannon** (slime, arcade artillery). A giant phone stands on the right, its feed scrolling up. You run a content farm's cannon in the bottom left: aim with the mouse, a finger or the up and down keys, hold to charge, let go to fire a ball of AI slop (green goo carrying a hand with too many fingers, a melting dog, a soldier carved from bread) in an arc. Hit a post and it's slopped, and reactions pour in. Chain hits for "Gone viral". Real posts (someone's actual dinner, a blurry cat) are worth more to slop, which is the joke. Each stage the feed speeds up and something new arrives: a Fact Check card that bounces slop back ("Context added", which nobody reads), a Trending post worth triple, and a lone Moderator with a tiny net who catches one shot in five, then goes on lunch. Between stages pick an upgrade, each with a cost: More fingers (a bigger splash), Bot farm (auto-likes for ten seconds), Engagement bait (posts linger longer). Three stages and a Final Push. Score: engagement. Aimed at the platforms that reward slop, not the people scrolling past it.

**Unexpected Item** (checkout green, timing). Your shopping rides down the belt. Press Scan (Space or tap) as each barcode crosses the red line; early or late and it beeps and goes round again. Loose fruit has no barcode: pick it from four lookalikes before the machine guesses ("Lime, lemon, lime or lime?"). Bag as you go, but bag too fast and "Unexpected item in the bagging area" freezes the till until the one assistant walks over, slowly, and swipes a card without looking. Age-checked items (cooking wine, scissors, a large candle) need approval too. Stages: a basket, a trolley, the big shop, then the Christmas Eve rush. Score: items scanned, time, and how often you were treated as a criminal. The machine is the comedian: it accuses, apologises, accuses again. Aimed at shops that replaced staff with machines that think you're stealing.

**Reply All** (sky, whack-a-mole). An open-plan office: a grid of desks with cut-out office workers. Someone has replied all to the whole company. Workers get the itch: a wind-up bar over their head and a speech bubble ("Please remove me from this list", "Same", "Who is this", "Stop replying all", "+1", "Per my last email"). Click or tap them, or move a cursor with the arrows and press Space, before they hit Send. Every reply that lands sets off two more desks, so it spreads, and fills the server meter; full, and the server melts. Stages: your team, the department, the whole company, then the CEO's assistant, who can't be stopped and replies to everyone with a sad face. A recharging Mute thread button clears a row. Score: replies stopped and server saved. Aimed at company email and our own habit of replying all to complain about replying all.

**Terms and Conditions** (peach, spot it). You're installing an app. Its terms scroll up the phone: real-sounding boilerplate with a few clauses that aren't ("Your fridge may vote on your behalf", "We may sell your face", "Your firstborn's Wi-Fi password now belongs to us"). Tap a bad clause to strike it out before it scrolls away; tap a normal one and you've wasted a lawyer's afternoon. At the end you press Accept anyway, because there is no other button. Each app is a stage: a torch app, a smart kettle, a dating app for dogs, then a bank. Faster scroll, smaller print, clauses that turn bad in the last three words, and a pop-up asking if you're still reading. Needs a deep pool (at least 80 normal clauses and 50 bad ones) so runs don't repeat. Aimed at companies that hide everything in terms nobody can read.

**Just the Recipe** (rust, vertical dodger, portrait). You're a hand scrolling down a recipe site to reach the recipe at the bottom. Steer left and right while the page scrolls itself. In the way: cookie banners stretched across the page (find the tiny Reject all), newsletter pop-ups that fly in, an autoplay video that chases you, adverts that load late and shove the page about, and the life story, which you wade through slowly. A "Jump to recipe" button helps, sometimes. Three courses: starter, main and pudding, each a longer page. Score: time to the recipe and how much of the life story you skipped. Aimed at the advert-stuffed web, never at the cooks.

**Hold Music** (magenta, rhythm and memory). You're phoning a company. The menu reads out options ("Press 1 for billing, 2 for faults") and your problem is on a sticky note: press the number that matches before the menu loops. Then you're on hold. An original lo-fi loop plays (square waves and a crackle) and you tap on the beat to stay on the line; miss too many and you're cut off. Your place in the queue counts down while you keep time. Each call adds menu levels, longer holds, a tempo change and a cheerful voice saying your call is important. The last call transfers you back to the start. Needs a small step sequencer on the kit's sound. Keys 1 to 9 and Space; touch gets a keypad. Aimed at customer service built to make you give up.

**On Mute** (violet, multitasking). At the top, a video call grid with your face in one tile. At the bottom, your actual job (something simple to play: filling a spreadsheet, pasting the same thing into twelve boxes). Keep working and keep up appearances: nod when someone says your name, unmute and say "Yep" when you're asked something (then mute again, or they hear the dishwasher), and turn the camera off when the cat arrives. Miss one and your reputation drops; ignore the work and the inbox piles up. Stages: a stand-up, a team meeting, an all-hands, then a meeting that could have been an email. M is the kit's mute key, so use others. Aimed at meeting culture.

**Scrubbed** (orange, lander physics). Space Billionaire's reusable rocket comes down tail first onto a barge at sea. Thrust (Up, Space or a Thrust button), tilt left and right, and watch the fuel. Land gently and upright; too hard and it's a large fire that the billionaire's speech bubble calls a success ("Good data", "That counts", "Delete that"). Wind, waves under the barge, a smaller barge each time, a landing on the lawn of his own launch party, then Mars in low gravity, where nobody is watching. Score: landings, fuel left, and how close to the cross. The billionaire is the invented Space Billionaire from Thonglets, never a real person. Aimed at billionaire space races and the PR that comes with them.

**Heavy Traffic polish** (teal). A pass against "What polished means": today's race, the share line and the clip frame are in already. Look at the results jokes for every place, the touch controls on a small phone, the first thirty seconds for a new player, and anything the owner has noticed. Then drop the "Early prototype" label.

## Phase 4: the site at ten games

- [x] A games grid in place of the poster list: the newest game featured, then every other game as a tile, newest first. A "Today's runs" row and a `/games/` page were left out, since every game has a daily run and one page holds them all.
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
- [ ] A **Shop** link in the header and footer to the existing hoodie and T-shirt shop, added with the first merch drop once the socials bring people in (the owner's call, 6 October 2026). Just a link: no embedded store, no shop scripts.

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

1. **Merch.** The hoodie and T-shirt shop already exists, and the stamp words are ready-made designs: "Not approved", "Rejected", "In poor taste", "There is no yes button", plus one design per game (a Thonglet, the Gas button). Drop one with each game launch, and link the shop from the site in phase 5, once the socials are open.
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
- [ ] The shop URL for the Shop link (phase 5).
- [ ] Whether and when to apply to the advert portals.
