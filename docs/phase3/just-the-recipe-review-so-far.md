# Just the Recipe: the review so far

Paused part way on 3 October 2026, at the owner's request. Reviewed on branch claude/game-just-the-recipe at 4ce3fe6. Not yet covered: mouse and touch play (and the far-right touch measurement), repeat runs and today's run, the losing screens (Session expired, Rejected), phone frame rate, the cover and share image against the others, the homepage poster and More games, a full copy pass, gamepad, focus, the pause, sound and fullscreen buttons, and the sound.

JUST THE RECIPE: REVIEW, PAUSED PART WAY THROUGH (stopped at the owner's request)
Branch origin/claude/game-just-the-recipe at 4ce3fe6. Nothing changed in the repo.
Screenshots: <scratchpad>/review-just-the-recipe/
Scripts: <scratchpad>/rv-jtr/ (tour.mjs, scenes.mjs, clip.mjs, human.mjs; human-results.txt holds the human-player runs)

CHECKS DONE
- node tools/playtest.mjs just-the-recipe: all passed. The autopilot reached the pudding in 1:54.59 (Pending review).
- No console errors, failed requests or sideways scroll in any run, at 375x812 (touch) or 1280x800.
- No exclamation marks or em dashes in the game's copy.
- Reduced motion: shakes, banner folds, pop-up fly-ins, the advert bounce and the tab slide all fade instead. One small miss is under Nice to have.
- Human-like players, my own judgement code rather than the game's autopilot advice, keyboard only, real keys, 200-450ms reactions, one run each:
    good     24.0 / 36.4 / 41.3 = 1:41.8, 85% skipped, Approved
    average  32.6 / 43.3 / 41.4 = 1:57.2, 83% skipped, 1 advert clicked, Pending review
    novice   47.4 / 52.6 / 64.3 = 2:44.3, 53% skipped, 3 cookie banners accepted, no Jumps, Not approved
  The autopilot scored 1:41.5, 1:47.6 and 1:54.6 in my runs. Skill decides the score and the spread is healthy.

MUST FIX

1. On phones, the notice covers whatever is coming. Everything in this game comes up from below the hand, and on touch screens the notice card sits just under the hand (kit-brief, bottom 5.4rem) until about 2.8s after Go (ms 5200 from the start of the countdown). On the starter, the first Jump to recipe and its "Jump" arrow pass underneath the card. On pudding, the first autoplay video rises out from under it. The kit fix that lifts notices still leaves the card below the hand, so this one is the game's to solve.
   Shots: tour-phone-c1-01, -03, -04, -05, -29.
   Fix: give each page about 3 seconds of nothing at the top (move the first Jump and the first video down by about 70 units, or lengthen the head), or end the notice at Go (recipe.js notice(), ms ~2600).

2. Callouts land on the hand. The kit puts callouts 22% down the screen, and the hand's fist spans roughly 20-40%. This confirms the builder's worry, on desktop too.
   - Worst case: "Jumped to recipe. Nearly" lands at the moment the first banner stops you. That banner always follows the first Jump, so every new player who takes the Jump the arrow points at gets the callout over the hand and the banner, at the same time as the chef's bubble and the Reject all arrow. Shots: tour-phone-c1-07, scene-phone-01, scene-desktop-01.
   - "Newsletter: open" covers the cat's line. Shots: scene-phone-09, scene-desktop-09.
   - "Layout: shifted" covers the hand. Shot: tour-desktop-c1-20.
   - "Jumped to recipe. Nearly", the pudding notice and the rising video all arrive together. Shot: tour-phone-c1-29.
   Fix (game): skip the jump-end callout when a banner, advert or pop-up ends the jump (endJump, recipe.js ~470), and drop "Newsletter: open", since the cat already says it.
   Fix (kit): add a callout position option, or the game moves HY lower on square screens.

3. The chef's speech bubble hides the tiny Reject all. The chef is always anchored at x=88 (chefAnchor, recipe.js ~976). On "edge" banners, Reject all sits at x 80-98 half the time, so on a phone the chef peeks over it and his bubble ("We only want to know everything.") lands on top of it, right under the Reject all arrow. The first banner a new player meets is this kind.
   Shot: scene-phone-01.
   Fix: put the chef over Accept all, which is also the better joke, and add the banner's button row to the bubble's keep-clear list.

4. On results and interludes, the recipe card shows through the panel behind the stats, at both sizes ("Tomatoes / An onion" under "Page 0:25.65"; "Eggs / Flour" under "Time").
   Shots: tour-desktop-c1-10, tour-desktop-c1-39, tour-phone-c1-41.
   Fix: in ending(), park the card out from behind the panel, or put an ink halftone over the page once the state is interlude or results.

5. On phones, the 12px floor makes text bigger than the box it sits in:
   - "Advertisement" overlaps the advert's headline. Shots: scene-phone-04, -05, -06.
   - "Autoplay" runs into the chef's toque. Shots: scene-phone-13, tour-phone-c1-33. The last commit's fix holds on desktop only.
   - "Close in 3" spills out of its black tab and the number gets lost. Shot: scene-phone-12.
   - "Confirm choices" fills its button edge to edge. Shot: scene-phone-16.
   - The banner's joke line ("We and 1,412 partners would like to follow you home.") doesn't fit at 12px, so drawBanner (recipe.js ~1477) greeks it: no phone player ever sees the four banner jokes. Compare scene-phone-01 with scene-desktop-01.
   Fix: size these boxes from the measured width at 12px, wrap the banner line onto two lines, and use "Ad" for the label when it's tight.

SHOULD FIX

6. On phones the between-course screen loses its joke line and all its stats, because the kit hides .kit-line and .kit-stats under 40rem (kit). The screen reads only "Soup found." (tour-phone-c1-10).
   Game workaround: put the time in the heading, "Soup found in 0:25.", so the result survives.
   Also: the heading says "found" and the line says "located", which repeats itself on desktop.

7. Touch steering (builder's worry, confirmed by the geometry; I didn't get to a touch run). On a 375px phone the Click button covers page x of about 80 and up. Reject all on edge banners, the right-hand gaps (up to about 86) and pop-up X buttons all live there, so the steering thumb has to go above the Click button, onto the part of the page that's coming up. Lifting the finger leaves the hand where it is, so drag, lift, then tap Click works, but it's slow.
   Fix (game-side, no kit change): relative drag. The hand moves by the finger's change in x times about 1.3, so a thumb resting bottom-left reaches the whole column.

8. Reader mode and the fake Jumps (builder's worry, confirmed). page.js line 342 removes only the real Jumps, but the card says "No more Jump to recipe buttons." Keep the fakes, since that's true to life, and say so: "The life story slows you less. Only the fake Jump buttons are left."

9. The ladder is calibrated on the best move, but holds up roughly. A skilled player gets Approved first time (1:41.8 against a par of 1:51), and so does the autopilot in most runs, so Approved is not "rare and grudging". Consider a par of about 1:40-1:45 for Approved. This rests on one sample per persona; mouse and touch players are unmeasured.

10. Clips have no jokes in them. The clip autopilot dodges everything, so a clip is a hand weaving through white bars (clip-02). For filming, let it get caught on purpose once a page: accept one banner, let one pop-up land, take one layout shift. Separately, the clip stalls at the first interlude; that's the kit fix already coming.

11. "No, take me back" on the "Are you sure" box does nothing at all: press() only handles the Yes span (recipe.js ~384). It should re-open the newsletter, which is the joke. The box is also drawn centred on the hand, so the hand covers "Are you sure" (scene-phone-18).

12. The new tab has problems:
   - The art doesn't match the headline: drawTab uses index % 4, so "Mattresses near you" shows a saucepan and "Saucepan clearance" shows an onion.
   - White HUD text sits on the white tab and can't be read.
   - Speech bubbles and the hint arrow stay drawn on top of the tab.
   Shots: scene-phone-07, scene-phone-14, scene-desktop-07.

NICE TO HAVE

13. "Starter 1/3" in the HUD sits on top of "A recipe site" at the start of each page (tour-phone-c1-01). On desktop the scrollbar runs under the HUD (tour-desktop-c1-04).
14. The highlighter trail reads as rust pipes, and sideways moves draw long bars (scene-phone-13, tour-desktop-c1-20). Light up the word bars the fingertip passed over instead.
15. The video's "leave" slide isn't covered by reduced motion (drawVideo, recipe.js ~1715).
16. The author holds a soup bowl in every photo, including "Me in Italy, near some pasta" (tour-phone-c1-22).
17. The chef appears twice on the cover, in the video and over the banner (builder's worry). It's in character for the mascot, but the cover would be livelier with the cat or Nan in one of those places. I haven't yet examined the cover full size.
18. The touch hint "Click on the right." would read better as "Tap Click, bottom right, to click."
19. Already good copy, which phones should get to see: "No thanks, I don't like food", "342 comments. Most of them ask if you can use a slow cooker.", "From 2 ratings", "Four ingredients. Seven thousand words.", "Lasagne means family. I looked it up. It doesn't."

KIT, NOT GAME (the lead has these)
- The interlude stalls in ?clip (fix coming).
- On phones the results stamp is cut off at the top and "All games" at the bottom (tour-phone-c1-41; panel compaction is coming).
- The kit hides the interlude's line and stats on phones (item 6).
- A callout position option (item 2).

NOT COVERED YET
- Mouse and touch human runs, and the touch far-right measurement.
- Repeat runs per persona, and today's run (same pages, the date on the results).
- Losing screens: Session expired, and a Rejected result.
- Phone performance and frame rate.
- The cover and share image full size beside the others in public/art.
- The homepage poster and "More games" screenshots.
- Comparison shots of Thonglets and Heavy Traffic.
- A full copy pass on every line.
- Gamepad, keyboard focus, the pause, sound and fullscreen buttons during play, and listening to the sound.

WHAT WORKS (keep)
The joke reads at a glance:
- A dark-mode recipe site, "Ready in 20 minutes. Reading time: 45 minutes.", two ratings.
- A pointing-hand cursor as the hero, with a hover ring on whatever it would click.
- A huge rust Accept all next to a tiny underlined Reject all.
- Manage makes you wait, then swaps the buttons round.
- Pudding hides Reject all under Manage.
- A pushy cat hanging off its own pop-up.
- Adverts that jump open late and shove the page.
- The recipe card payoff.
- Sidebar adverts on desktop.

The between-course choices have real catches. Skill clearly decides the time. There are no errors, playtest passes, and reduced motion is mostly right.

HOW CLOSE
The mechanics and the joke density are close to the standard, and the premise is one of the clearest on the site. The art is short of Heavy Traffic and Thonglets: there the characters are the screen, while here most of the screen is white bars, and the cast (chef, cat, family) is small, peeking, or in polaroids. On phones the screen is also more crowded and overlapped than either reference.

THE SINGLE CHANGE
Keep the hand, the button row and the next thing coming clear of everything else. The game is about finding small targets (the tiny Reject all, the little X), and at the moment callouts, the chef's bubble and the notice sit on exactly those, especially on a phone.
