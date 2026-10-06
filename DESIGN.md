# Notaste Games design rules

This file is the source of truth for how Notaste Games looks, sounds and talks. The website and every game follow it. If something isn't covered here, match what already exists and then add the rule here, so the next person (or the next Claude session) doesn't have to guess.

To change a rule, change this file in the same pull request as the work, and say why in the pull request.

---

## 1. The brand in one paragraph

Notaste makes quick, free browser games that laugh at the news, the internet and the people who run both. The look is a rubber stamp on a black page: heavy condensed capitals, one loud red reserved for rejection, film grain, worn ink and arcade cabinets. The voice is deadpan bureaucracy. Everything is "not approved", "pending review" or "rejected", and nothing is ever impressed.

- **Name:** Notaste Games (the logo reads NO TASTE). In running text write "Notaste", never "No Taste" or "NoTaste".
- **Tagline:** Free games in poor taste.
- **Domain:** notastegames.com. Games live at `notastegames.com/games/<slug>/`.

---

## 2. Voice and copy

Write like a tired official who has seen everything and approved none of it.

**Do**
- Keep sentences short. Deadpan beats wacky. Let the joke sit in a plain sentence.
- Use British English: colour, civilisation, mum, £, "in development".
- Use the approval vocabulary (section 6) as the running gag.
- Make buttons say exactly what they do: "Press start", "Race again", "Go to the homepage".
- Use sentence case in source text. Capitals come only from the display font's `text-transform: uppercase`, never from typing in caps.
- Give every game a one-line pitch, three "how to play" lines and an end-state joke.

**Don't**
- No exclamation marks. No emoji in interface text. No em dashes. Use a full stop or a colon instead.
- No "Oops", no "Uh oh", no apologising cutesy errors. Errors say what happened and what to do.
- No jokes that punch down. Satire aims at platforms, companies, the powerful, the internet and our own bad habits. Never at people for who they are: body, race, religion, disability, gender, sexuality, class or age. When a game's joke is about a person ("large drivers, tiny cars"), the punchline is the situation (the car is too small, physics gave up), never the person.
- Crude is fine; cruel isn't. Cartoon exaggeration, slapstick and toilet humour are on brand: Heavy Traffic's drivers are twice the width of their karts, wobble, sweat, show a bit of builder's bum and have a button marked Gas. The words never insult the driver: no jokes about weight, eating, health or laziness. The thing that suffers is the car ("Suspension: deceased", "The car's family has been informed").
- Characters can insult each other, and the player, about their driving, their manners and their opinion of themselves, never their bodies. Use the playground and road-rage register: numpty, pillock, plonker, lemon, melon, absolute weapon. No swearing beyond that, no slurs, nothing sexual. Dark is allowed when it lands on the speaker ("You drive like my nan. My nan's dead.").
- Give characters a conviction to be funny about. Heavy Traffic's drivers each believe they own the road and are at one with their kart ("She's called Pamela. Show her some respect.").
- Real people and real brands don't appear in games. Use invented stand-ins ("Space Billionaire", "A Company"). The satire disclaimer in the footer stays on every page.
- Satire can point at broken things in the world, as long as it aims at systems and types, never real people. Show it, don't preach it: the joke is what the game makes you do, and the commentary is in what's chasing you. Thonglets' rival gods are the approved set: The Feed (attention), A Landlord (housing), Space Billionaire, The Loudspeaker (slogans and populism), The Sea (rising, unmentioned) and The Planning Office (bureaucracy).
- Worship and gods are invented. No real religious symbols, texts, figures or rituals: a halo, candles and the Notaste sparkle are fine; a cross, a crescent or a prayer from a real faith isn't. That includes things that only look like one: dizzy or stunned marks in a game about worship are the Notaste sparkle, never a plus sign.
- No real slurs, no gore, nothing sexual. "Poor taste" means cheeky, not cruel.

**Examples from the site** (match this tone)
- "Three games are being made. None of them have been approved. We didn't ask."
- "The link may be old, or the game may have been taken down. Possibly by a lawyer."
- "There is no yes button."

---

## 3. Colour

All colours are CSS variables in `public/styles.css`. Canvas games read the same variables through the kit (`Notaste.tokens()`), so a colour only ever changes in one place. Never type a hex value into a game that isn't listed here.

### Core

| Token | Hex | Use |
| --- | --- | --- |
| `--ink` | `#000000` | The ground. Every page and game screen is black. |
| `--paper` | `#FFFFFF` | Text on black, the one calm paper section, stamp backgrounds. |
| `--red` | `#D7141A` | Stamp red, from the logo. Reserved: see below. |
| `--red-press` | `#A90F14` | The pressed edge under red buttons. Nothing else. |
| `--smoke` | `#A6A6A6` | Secondary text on black. |
| `--ash` | `#2A2A2A` | Rules, borders and edges on black. |
| `--grey` | `#5C5C5C` | Secondary text on paper. |
| `--rule` | `#E2E2E2` | Rules on paper. |

### Red is for rejection

In the interface, red appears only on: stamps, the NO button, the logo, the hazard tape, and the single main action on a screen ("Press start"). One red button per screen. Never use red for decoration, links, headings or error text.

In illustration (cover art, game graphics) red is one of the four inks, alongside black, white and the game's accent.

### Game accents

Each game owns exactly one accent colour. It's set as `--accent` on the game page's `<body>` and used sparingly: the bar over the title, status dots, the cabinet's credit light, HUD details, and as the fourth ink in that game's art.

| Game | Accent |
| --- | --- |
| Slop Cannon | `#B3BF2A` (slime) |
| Heavy Traffic | `#4F9E9A` (teal) |
| Thonglets | `#9A7BC4` (lilac) |
| Unexpected Item | `#4E9A55` (checkout green) |
| Reply All | `#4FA3E0` (sky) |
| Terms and Conditions | `#F2B48C` (peach) |
| Just the Recipe | `#C2643A` (rust) |
| Hold Music | `#C452B5` (magenta) |
| On Mute | `#7A5CD6` (violet) |
| Scrubbed | `#E8892B` (orange) |
| Bonus Season | `#B8862E` (ochre) |
| Surge | `#E07AB0` (pink) |
| Rage Bait | `#E2BC3B` (gold) |
| Be Your Own Boss | `#E8919B` (rose) |
| Verify | `#8DD14A` (lime) |

The games on the roadmap have their accents picked already, all at once, so the later ones don't get the leftovers: every one is at least 4:1 against black and clearly different from the others and from red. A game that isn't in this table picks a new accent that is clearly different from all of these, and gets added to it. The starter game (In Tray, section 12) borrows `--smoke` because it isn't a real game; a game copied from it replaces that. Accents must stay readable as small dots on black (at least 3:1 against `#000`).

### Exceptions

Parody content that imitates a real interface (the fake social posts in "Reject the internet") may use the colours it imitates, inside that parody only.

---

## 4. Type

| Role | Face | Where |
| --- | --- | --- |
| Display | **Notaste Display** (`--display`) | Headlines, stamps, game titles, HUD numbers, game buttons, the tape. Always uppercase. |
| Body | The device's own UI font (`--body`) | Paragraphs, links, small print. |
| Mono | The device's monospace (`--mono`, game pages) | Timers and boot logs, where digits must not jump about. |

- Notaste Display is our own face, drawn from the logo's letterforms. It lives at `public/fonts/notaste-display.woff` and is rebuilt with `tools/build_font.py`. It covers A–Z, a–z, 0–9, common punctuation, £, curly quotes, en dash and ellipsis. Its space is about a quarter of an em, wide enough that small words in a speech bubble don't run together. Anything outside that falls back to Impact, so keep display text inside that set.
- No other web fonts. No Google Fonts, no font services, no third-party requests of any kind.
- Type scale: `--step--1` (0.875rem), `--step-0` (1.0625rem body), `--step-1` (1.25rem), `--step-2` (section headings), `--step-3` (the hero). Game titles use the sizes in `games/game.css`.
- Display text is tight: line-height about 0.86–0.95.
- On a game screen nothing is under 12px, on a phone too: canvas text, the HUD's labels, the notice, the numbers between stages and on the results. The kit's screens keep to it; a label that can't be that big is left out rather than shrunk.

---

## 5. Logo

Files in `public/brand/`:

| File | Use |
| --- | --- |
| `logo-on-dark.svg` | Primary logo: red NO box plus white TASTE, on black. The header uses it. |
| `logo.svg` | The same for light backgrounds. |
| `mark-on-dark.svg` | The NO box on its own, on black (footer, small spaces). |
| `mark.svg` | The NO box on light backgrounds. |
| `mark-stamped.svg` | The worn red NO stamp. Used as an inked stamp graphic, on white only. |

- Keep clear space around the logo of at least a quarter of its height.
- Smallest sizes: the full logo at 112px wide, the mark at 24px tall.
- Never recolour, stretch, outline, add shadows or effects, or rotate the full logo. Only the stamped mark rotates, because it's being used as a stamp.
- On busy art, put the logo on a black plate.
- The Notaste intro rebuilds the logo from these files. It doesn't redraw it.

---

## 6. Motifs

These are the recurring pieces that make something look like Notaste. Use them; don't invent new ones without adding them here.

**The rubber stamp** (`.stamp-label` in `styles.css`). Red display capitals in a red double border on paper white, with worn-ink speckle. Always tilted between -8° and 8°, never straight. It lands with a slam (scale down from big, slight overshoot) and a thump sound.

**The approval ladder.** The words stamps can say. Results screens in every game rank the player with this ladder, best to worst:

1. **Approved** (first place, top score. Rare and grudging.)
2. **Pending review**
3. **Not approved**
4. **Rejected**

Other stamp words for labels and states: Classified, Unfinished, Stalled, Not yet, Not found, Not collected (the privacy page), Paused, Smitten, Blessed, Missed. In-game callouts can be short deadpan lines in the same voice ("Spun out", "Wheel: optional", "Overtake approved", "That's gravel", "Faith: tested", "Feed: down", "Administration fee", "Thong: installed", "Rent: refunded", "Launch: scrubbed", "Microphone: confiscated", "Permit: denied", "You can't smite the sea", "Judgement: deferred", "Barrier: consulted", "The wall has been informed", "Contact with the scenery", "Slipstream: unpleasant", "Towed. Invoice to follow", "Recovered. Reluctantly", "Put back. Like a trolley", "Extension: granted", "Permit: expired", "Permit needed", "You can't smite paperwork", "Filed", "Filed. Unread", "Stack: wobbly", "Coffee: on the forms"). Add new stamp words here.

**Hazard tape.** A red strip, tilted about -2°, carrying white display capitals separated by black asterisks ("Not approved * In poor taste * Free to play"). It scrolls slowly on the homepage and wipes across the screen at the end of the intro.

**Texture.** Film grain over black (`--grain`), worn speckle over stamps (`--worn`), halftone dots in illustration. Nothing is perfectly clean.

**The arcade cabinet.** Every game screen sits in a cabinet: a moulded black bezel, rounded glass, scanlines, a glare and a strip underneath with "Notaste Games" and a credit light in the game's accent. Defined in `games/game.css`. Don't restyle it per game.

---

## 7. Illustration

Cover art and in-game graphics share one style. It's set by the existing covers in `public/art/`.

- **Thick black outlines** on everything, around 3–4% of a character's height. Outline first, then flat fill.
- **Four inks only:** black, white, stamp red, and the game's accent. Shading is black halftone dots, never gradients.
- **Speckle and halftone** texture on large areas. White motion lines. Puffs of smoke as clusters of white circles with an accent shadow offset behind them. Sparks as short white strokes.
- **Characters** are chunky and simple: helmets, visors, dot eyes or no faces. No realistic people, no likenesses of real people.
- **Covers** are 800×600 SVG (`public/art/<slug>.svg`) with the action in the middle. The stamp over a cover is added by the page's CSS, not baked into the art.
- **Share images** are 1200×630 PNG (`public/art/og-<slug>.png`): headline on the left in Notaste Display, art on the right, logo bottom left, a stamp. Copy the layout of `public/og-image.png`.
- **In games**, drawing code follows the same rules: black outline, flat fill, the four inks. Colours come from `Notaste.tokens()`. Grey is made with halftone dots on white, never a grey fill.
- **Characters** are flat cut-out cartoons of our own: a round body, a big round head as wide as the shoulders with no neck, white skin, two oval eyes with small pupils, furious eyebrows, a frown and a second chin, mitten hands. Each wears one thing that tells them apart from behind (a backwards cap, a sweatband, a perm, a flat cap and moustache). Faces turn to look at whoever they're shouting at. Never copy a character from someone else's show.
- **Heavy Traffic's drivers** are the reference: those characters at twice the width of their karts, the shirt riding up over a strip of bare back, trousers spilling over both sides, wheels splayed under the weight, a TNY number plate. Seen from behind, the way the race is played. The cover shows them that way too: you in the backwards red cap, Lorraine turned round to shout, Gaz up on two wheels.
- **Heavy Traffic's circuit**: red and white kerbs, gravel in halftone, a low white barrier with a red length every so often, billboard stamps, and arrow boards (paper, red chevrons, an ink edge) on the outside of every corner you need to brake for.
- **Thonglets** are the other reference, and the exception to the furious faces: they adore you. A white jelly-bean body with no neck, two oval eyes looking up, raised eyebrows, a small open mouth of awe, lilac blush, stubby arms raised in praise and mitten hands. Each wears a red thong (front: a band and a small pouch; behind: a band, a string and a cartoon bum, two curves and a line, nothing more). Builders add a lilac hard hat and carry a red brick on their heads. The High Priest is a pear-shaped gremlin with floppy ears, eyes shut in rapture, a grin with one tooth, a lilac thong, and a red thong worn on its head as a mitre with the Notaste sparkle on it. Smitten Thonglets lose their thong to a black censor bar and are delighted. Their statue of you is a giant Thonglet from behind, arms up, with a halo, on a plinth that says "Our god".
- **Speech bubbles**: paper, a thick ink outline, rounded corners, a tail to the speaker, Notaste Display capitals, at most two short lines. They pop in and fade out.

---

## 8. Motion

- One orchestrated moment per screen (usually a stamp landing). Everything else stays still or moves quietly.
- Interface motion is quick: 80–260ms. Stamps land in about 360–520ms with `cubic-bezier(0.2, 0.7, 0.3, 1)` and a small overshoot.
- Screen shake is for impacts only, short and small.
- Respect `prefers-reduced-motion`: no shakes, no slams (fade instead), no screen shake in games, no scrolling tape.
- Nothing moves until the visitor does something, apart from the slow homepage tape.

### The Notaste intro

Every game opens with the same sting (`Notaste.intro`, in the kit):

1. The red NO box slams onto a black screen with a thump.
2. TASTE stamps in letter by letter with a tick per letter, completing the logo.
3. "Presents" appears underneath.
4. The game's title card lands with its accent bar, and the game's stamp slams across it.
5. A strip of hazard tape wipes the card away and the game begins.

About three seconds the first time in a visit, about one second after that (title card and tape only). Restarting a round ("Race again", "Restart") skips it. Any key, click or tap skips it. With reduced motion it fades instead.

---

## 9. Sound

- Sounds are made in code with the Web Audio API through the kit (`Notaste.sound`). No audio files for now.
- Lo-fi arcade: square and saw beeps, short noise bursts. Short and dry.
- The signature sound is the **stamp**: a low thump with a slap of noise. It plays whenever a stamp lands.
- Game sounds stay in the same lo-fi family: Heavy Traffic's engine is a buzzing saw wave, its Gas button is a long, low, wobbling note, and its tyres squeal on a warbling square wave when they're about to give up (a warning, so the spin is never a surprise).
- Sound starts only after the player presses something. One mute setting covers every game and is remembered (`notaste.muted`).
- Pause all sound when the game is paused or the tab is hidden.

---

## 10. Game interface rules

Every game uses the shared kit in `public/games/kit/` so that all games behave the same. The kit provides each of these; a game should not rebuild them.

**Flow:** title screen, then the Notaste intro, then countdown (3, 2, 1, Go, each one a stamp), then play, then the results screen. Pause from anywhere. A game with stages puts the kit's between-stages screen in the middle (`shell.interlude`): a stamp, what happened, the numbers, and a choice for the next stage, then the countdown again.

**Between stages.** A stamp from the approval ladder, a heading ("Stage 2 complete."), one joke line, the numbers, and up to three choices as equal cards: none of them is red, because none is the main action. Each card is a short label and one line saying what it does and what it costs. Number keys pick them as well as Tab and Enter. On a short screen (the phone-sized square in the page, the clip frame) the joke line and the numbers drop out so the choices fit; a full-window phone keeps them.

**Title screen.** The cover art behind, the game's title in Notaste Display, one red "Press start" button, one line of small print, and a controls hint that matches the device (keys on desktop, touch on phones). Another way to play is a quiet outlined button under Press start, never a second red one.

**HUD.** White Notaste Display with a black shadow so it reads over anything. Progress (lap, level, wave) top left. Rank or score top right. The pause, sound and fullscreen buttons sit together at the top in the middle. Keep it to what the player needs this second.

**Callouts.** In-game jokes and events appear as small stamps that land and fade ("Spun out", "Wheel: optional"). At most one at a time. They're decoration, so screen readers don't announce them. A game with a busy field (Thonglets) asks the kit for smaller ones (`smallCallouts`) so they don't cover the action, and keeps routine ones (a fee, a tier) to once a stage.

**Today's run.** Every game has one (`daily: true` in the kit, or `{ label: "Today's race" }` to name it): a quiet button under Press start that plays a round everyone gets the same that day. The kit seeds it from the date; anything that should be the same for everyone comes from `shell.random`, never `Math.random`. Today's best is kept apart from the all-time best, and the results show the date ("Run: 2 October").

**Results screen.** A stamp from the approval ladder, a heading that says what happened ("You finished 2nd."), one joke line, the numbers (time, best), and three actions: play again (red), a quiet "Share result", and "All games". Share result opens the device's share menu, or copies one line and the link: the game, today's run if it was one, the result in a few words, and the stamp ("Thonglets, today's run (2 October): 4,210 points, stage 5 of 7. Pending review."). The game supplies the few words (`share` in `shell.finish`); the line follows the copy rules like everything else.

**Controls.**
- Keyboard: arrow keys and WASD to move, P or Esc to pause, M to mute. Every button works with Enter and Space, and focus moves to the button that matters (Resume, Race again). Clicking the pause, sound or fullscreen button hands the keys straight back to the game, so the next Space plays rather than pressing that button again. A key still held when a screen of buttons comes up (thrust held through the end of a round) doesn't press one: only a fresh press does.
- Touch: large on-screen buttons (at least 56px), bottom corners, thumbs only. The small pause, sound and fullscreen buttons at the top reach 56px tall on touch screens without looking any bigger. Touch controls show only on touch devices. A button with a cooldown fills up from the bottom as it recharges and gets an accent rim when it's ready (`shell.padFill`); the matching HUD meter (marked `data-pad`) then hides on touch screens, since the button already says it.
- Pointer: a game that follows the mouse or a finger (Thonglets) turns on the kit's `aim`. Dragging anywhere on the screen moves it, and the thing being moved sits a little above the finger so the finger doesn't hide it.
- Gamepad: supported where it makes sense. In play the game decides the buttons; on every menu (title, between stages, pause, results) the d-pad or stick moves between buttons, A presses one, and Start presses it too outside the pause.
- The page never scrolls while a game is running.

**Say what's new, and what to do about it.** Each stage that brings something new opens with a notice (`shell.brief`): a paper card with the game's colour along the top, the stage's name, and two or three plain sentences on what the new thing does and how to deal with it. It goes up with the countdown so it's read before Go. In play, a small bobbing arrow with a word on it ("Smite it", "Get a permit", "Bless: press B") points at the one thing that needs dealing with right now, and stops once you've shown you know (you've smitten that rival, or blessed once). One arrow at a time; speech bubbles keep clear of it.

**One rule per action.** An action means one thing everywhere, and the exceptions are said out loud. In Thonglets, Smite stops the rival gods with faces (the Feed, the Landlord, the rocket, the Loudspeaker). The Sea and the Planning Office can't be smitten and say so ("You can't smite the sea", "You can't smite paperwork"), and trying costs nothing. When a smite would land, red brackets mark the target before you strike.

**Forgiving by default.** Hazards punish a clear mistake, not bad luck or a corner cut by the crowd. Heavy Traffic's barriers let you slide along them and a tow puts you back on the road. Thonglets walk round a pit unless your own light is over it, and even then wobble on the edge long enough to pull back; anyone who loses sight of you walks to where they last saw you, and a run gets one extension for a statue that's nearly built. Speech bubbles stack rather than overlap, and stay clear of the HUD.

**Behaviour.**
- Pause automatically when the tab is hidden or the window loses focus.
- Fullscreen button on every game. Phones that can't do real fullscreen get a full-window version. A game that needs the whole height of a phone (a reading game) can go full-window by itself when a round starts on a touch screen (`fullOnTouch`); the button takes it back out.
- Save only bests and settings, in the browser's local storage, under `notaste.<slug>.<name>` (`shell.record` does this). No accounts, no tracking, no cookies.

**Autopilot and clips.** Every game drives itself when `Notaste.flags.autopilot` is on, well enough to reach the results screen: the play-through (`tools/playtest.mjs`) depends on it. `?autopilot` turns it on, and `&speed=4` runs it four times as fast. `?clip` is for filming social clips: a 9:16 frame with the logo at the top, the game's screen at 4:5 in the middle, and the title (with its accent bar), the pitch and "Free at notastegames.com" underneath. The autopilot plays, the pause, sound and fullscreen buttons are hidden, the game doesn't pause when the screen recorder takes the focus, and Enter starts it.

**Performance.** Aim for 60 frames a second on a mid-range phone. Canvas resolution is capped at 2× pixel density. No build step and no external libraries without agreeing it first.

**Accessibility.** Everything works from the keyboard. Results are announced to screen readers. Colour is never the only signal. Respect reduced motion. Text keeps at least 4.5:1 contrast.

---

## 11. How the site is built

- Plain static site, no build step. Everything the browser loads is in `public/`.
- Shared page styles: `public/styles.css`. Shared game page styles: `public/games/game.css`. Shared game kit: `public/games/kit/`.
- Each game: `public/games/<slug>/index.html` plus its own script and styles in the same folder.
- Hosted on Cloudflare. Merging into `main` puts it live; Cloudflare also builds a preview link for every branch.
- `node tools/playtest.mjs` checks every page and plays every kit game to the end (section 10, "Autopilot and clips"). It needs Playwright on the machine running it; nothing it uses ships with the site.
- Every change people will see is reviewed before it goes live: a playable preview is published as a private Claude artifact (`python3 tools/preview_artifact.py <slug> <folder>` packages a game page for it), and once it's approved the pull request is merged.
- Commits use the GitHub private address, never a personal email.

---

## 12. Adding a new game: checklist

1. Pick a name, a slug, a one-line pitch and an accent colour. Add the accent to section 3 (games on the roadmap already have one).
2. Copy `public/games/starter/` to `public/games/<slug>/`, rename `starter.js` and rewrite it as the new game. In Tray is a whole small game on the kit (HUD, keys, aim, a touch button, callouts, a notice, today's run, bests, share, autopilot), so keep what fits and replace the rest. Delete the page's `robots` line.
3. Fill in the page: title, description, share tags, `data-game`, `--accent`, stamp word, how-to-play lines.
4. Add the game to `GAMES` in `public/games/game.js` and add a poster on the homepage.
5. Draw the 800×600 cover and the 1200×630 share image (section 7).
6. Use the kit for intro, screens, controls, sound and saving. Draw with `Notaste.tokens()` colours. Give it today's run, a `share` line in the results and an autopilot.
7. Write the copy in the house voice (section 2) and check the punch-down rule.
8. Test at phone and desktop sizes, with keyboard, touch and reduced motion. Run `node tools/playtest.mjs <slug>`, which must pass. Publish the preview artifact for approval, then merge the pull request.
9. Write the game's own rules in its part of section 13: its characters and how they're drawn, its stamp words and callouts, and anything only it does.

---

## 13. The games

Each game's own rules: its characters, its stamp words and callouts, and anything only it does. Everything above still applies. Heavy Traffic's and Thonglets' notes are in sections 6, 7 and 10, where they were first written.

### Slop Cannon

A content farm's cannon fires AI slop at a giant phone's feed. Only real people's posts pay, and slop on slop costs you, which is the joke: the platform pays you to ruin someone's tea, and the slop needs real people to feed on. The people posting are never the joke; the slop and the system that rewards it are.

**The room.** Black, with ash halftone on the back wall and grey server racks humming behind (ash outlines, a few slime and red lights). The cannon stands bottom left: a black barrel with a paper edge, a red band and a paper halftone shine, on a carriage with one big paper-rimmed wheel and a red hub. A hose runs to it from the vat behind, a black drum marked "Slop" in red on a paper label, slime spilling over the top; a lump of slime runs down the hose while it reloads. On the wall above the vat, a paper sign: "Days since a fact check", over a big number that counts up a day a second and goes back to a red 0 whenever a fact check bounces a shot.

**The phone** stands on the floor on the right, its top somewhere above the screen: black, a thick paper edge, side buttons, a home bar. The app's header runs across the top under the score, and the posts slide beneath it.

**The posts** are paper cards: an avatar and a name, a picture, a caption, likes top right (a heart and a number that counts up). Real posts have a cut-out head for an avatar (section 7, calm until slopped, then furious and looking at the cannon, one thing each: a perm, three hairs, a cap, a bun, specs, a beanie, a fringe, a tache) and an ordinary picture drawn in ink: tea, a blurry cat, a shed, a 90th birthday cake, a carrot, a car park sunset, a dog, a found glove on the railings, a deckchair. Slop pages have a slime avatar with a melting smiley, a sickly slime-halftone picture with the slop in the middle, and a slime border. A slopped post gets a solid slime splat with drips, the slop thing stuck in it, the slime border, a rewritten caption ("Tea tonight." becomes "Type yes if you'd eat this.") and thousands of likes. The feed turns green as you go. Trending posts carry a red "Trending" tag. A fact check is a paper card with a magnifying glass, a red double-bordered "Context added" stamp, grey halftone lines of context and "Read by 0 people".

**The slop** is a wobbling slime blob with an ink edge and a paper shine, carrying one of four things drawn in ink and paper: a hand with eight fingers (a palm, a mitten thumb out to the side and seven fingers fanned up), a melting dog, a soldier carved from bread (a loaf in a helmet, saluting) and a melting smiley. It leaves drips, splashes in slime droplets, and leaves slime puddles on the floor.

**Characters.**
- **The Gaffer** runs the farm and stands behind the cannon: the section 7 cut-out in a paper shirt, black trousers pulled up high (paper halftone and a paper edge, so they read on the black floor), a red tie and a clipboard, with a slime-green eyeshade (a band and a brim). He watches the feed and turns to the player to shout, a fist in the air. He insults your aim, never you: "That's the floor, you plonker", "That's already slop, you lemon", "Fire, you absolute weapon". If a bounce lands on him he wears it for a while ("Nobody saw that").
- **The Moderator** hangs off the phone's left edge in a window cleaner's cradle (a paper board marked "Mod", ropes up out of sight), the cut-out with tired, furious eyes, a red lanyard and pass, holding a very small net on a long pole. He's sympathetic and understaffed: "There's just me", "There were forty of us in March", "Back in forty minutes". After three catches he goes up and away, and an "On lunch" sign hangs where he was.
- **The people posting** speak from their avatars when slopped, about their post, in the house register: "That was my tea", "Tigger has four legs", "That was my holiday, you pillock", "I'm telling my nan".

**Stamps and callouts:** Gone viral, Context added, Trend: hijacked, Slop on slop, Moderated, Moderated. Again, Moderator: on lunch, Cannon: slopped, Bots: deployed, Nobody saw it, Target: met, Target: missed, Nobody can tell, Close enough. Routine ones (Slop on slop, Nobody saw it) land once a stage.

**What only it does.**
- **Hold to charge.** While held, the point where the shot will land climbs the phone at a steady speed and comes back down, so the brackets rest on each post as long at any angle. A dotted arc shows the shot, red brackets mark the post it will land on by the time it arrives (the feed keeps moving), a slime halftone ghost of the blob shows where on that post, and a tag on the post says what it's worth: "+150", or in red "Bounces" for a fact check, "-25" for slop, and "Breaks chain" for slop when there's a chain to lose. All of it stays on the phone's screen. Let go a moment after the brackets leave a real post and the shot still goes to it: the brackets you saw are the shot you get. Before it's charging, four dots show where the barrel points.
- **One rule per action.** Firing is the only action. Real posts slopped in a row make the chain (x1.25 a post, up to x3) and every fourth goes viral, spreading slop to the posts either side with a slime zigzag. A shot that only gets slop costs 25 (the platform downranks duplicate content) and breaks it; if your own splash gets to a real post first, the shot that was aimed at it costs nothing. A miss, a bounce or a catch breaks it too. A splash near the line between two posts gets both.
- **Fact checks always bounce,** straight back onto the barrel (jammed for a second and a half) or onto the Gaffer.
- **The Moderator** drifts towards where you're aiming, slowly, lunges at a shot in flight at half that speed, and only the hoop of his net catches. His net never comes lower than the cannon's mouth, so a flat shot can always go under him, and on a square screen, where his net hangs close to the cannon, he moves slower.
- **Reactions pour in:** red hearts and slime comment chips float off slopped posts, and every chip is a bot's ("Bot", "Nice post. Visit my page", "Wow. Link in bio"): the people scrolling past are never shown falling for it.
- **The new caption** pops up big over a post when it's slopped ("Type yes if you'd eat this."), for a couple of seconds, so the joke reads on a phone.
- **Stage notices** are two short lines that go up with the countdown and come down just after Go. Filming a clip, only the stage's name shows, and it's gone by Go.
- **The finale:** when the final push ends, slime floods the phone's screen from the bottom.
- **Results** say how it went against the target in a few words ("Over by 611.", "Short by 340."), with the share of the feed that ended up slop in the numbers.

**The cover** is drawn with the game's own art: the Gaffer shouting "More. Faster. Worse." behind the cannon and the vat, a shot landing on Sandra's tea while she shouts "That was my tea.", the Moderator dangling his tiny net over it from his cradle, bots in the comments, and the feed turning green. The middle stays dark so the title screen's words read over it.

### Unexpected Item

A self-checkout. Four shops (a basket, a trolley, the big shop, Christmas Eve), each with its own closing time. The machine is the comedian: it accuses, apologises and accuses again. The shopper is never the joke; you only ever see their hand.

**Characters**
- **Till 4** (Bev calls it Dennis). A checkout-green kiosk with a thick ink outline and halftone down its right side, a paper screen in a black bezel, a lamp on top and a speaker grille on the right, where its speech bubbles come from. Its face is drawn on the screen in ink: oval eyes with small pupils that follow the next barcode, furious eyebrows, a frown. No chin and no body: it's a machine. The face is its suspicion meter: calm, watching (one brow up, one eye narrowed), angry (both eyes narrowed), alarm (the screen flashes red, eyes wide, mouth open), sorry (brows up, small mouth), puzzled (for fruit). A strip along the bottom of the screen always says what it wants right now ("Scan your item", "Please wait", "Remove the item"), and a five-light gauge under the screen spells out the suspicion. It wears a Santa hat on Christmas Eve.
- **Bev**, the one assistant for every till. A house cut-out cartoon, seen from the waist up behind the counter: a green polo, a red lanyard with a paper card, a name badge, a headset with a little green microphone, scraped-back hair and a bun with a pencil through it (the bun is how you know her from behind). Heavy lids, weary-furious brows, a mug of tea with steam. She walks over slowly, swipes her card with her eyes shut and her head turned away ("without looking"), and leaves quickly. She turns back if you fix it yourself. Her conviction: the machines are her colleagues, and Dennis is the worst of them ("Dennis thinks everyone's a thief. Even me."). She talks about the machine, never about you.
- **The queue**, Christmas Eve only: two cut-out shoppers behind you, one in a Santa hat and a red coat, one in a green bobble hat with a moustache. They look at you and tut in the house register ("Scan it, you lemon.", "It's a sprout, not a bomb.", always naming something loose that's really on your belt), or at Dennis.
- **You**: a paper mitten in a red sleeve, coming in from the right. Nothing else.
- On a narrow screen Bev and the queue are drawn smaller and further in, so nobody stands half off the edge.

**The shopping** is drawn in the four inks with a paper barcode patch on each item, cached as bitmaps (`sprites.js`). Loose fruit has no barcode and comes in sets of four lookalikes, some of them jokes: a sad lime, an apple with a bite out of it, a stone, a nervous sprout. The bitten apple and the stone are only ever wrong answers: what's on the scale is always something a shop would sell you. Invented, never branded.

**One rule for each action.** Scan works only while a barcode is on the red line; red brackets (as in Thonglets) mark a barcode while it can be scanned. Bag works only while the scale says OK; touching the bag while it says Wait is always an unexpected item. The exceptions are said out loud: loose fruit stops at the line and the till asks, and age checks need Bev.

**The false alarm.** The joke is in the rules: the machine accuses people who have done nothing wrong. In the basket it always does, once, after the second thing has gone in and the scale has said OK, so everyone meets the accusation and learns the ritual while it's calm. That one is the machine's own mistake and costs nothing but time. After that its suspicion decides: every time the scale says OK it may call an unexpected item anyway, never while no more than one light is lit, likelier with every light after that, and on the spot when all five are. Suspicion lingers. Mistimed scans, things going round again and wrong fruit raise it, perfect scans are what bring it down, and on Christmas Eve it rises by itself. Every accusation stops the till until it's fixed, breaks the streak and costs that shop's clean bonus.

**The ritual.** Every accusation is fixed the same way: lift the bag, put it back, each time the scale says OK. Rush it and the machine accuses you again. Or wait for Bev.

**The ladder.** Approved: every shop paid for, at least 17,500 points, and accused no more than the once everyone is. Pending review: every shop paid for. Not approved: a later shop shut on you. Rejected: the basket beat you. A shop's own stamp, between shops, goes by the accusations you're charged with.

**Ways of shopping.** Each one helps and costs, and none is best for everyone: a loyalty card scores a tenth more but every shop starts with the machine suspicious; your own bags settle the scale twice as fast but each thing you put in looks suspicious; waving at the camera calms it, for fewer points; holding it very still widens the red line but speeds the belt and leaves perfect as narrow as ever; coming back when it's quieter gives seconds that don't score.

**Stamp words and callouts**: Unexpected item, Item: expected, Approval needed, Approved. Didn't look, Sorted. Didn't look, Guessed: lemon (whatever it guessed), Charged as lemon, Lime: confirmed, Round again, Heavy item, Five in a row, Twelve in a row. Suspicious, Paid, Paid. Reluctantly. The game's stamp is Approval needed.

**Only this game**
- Callouts land under the belt (`unexpected-item.css`, placed by the game for each screen shape), clear of the till's face, its instruction strip and the scale's display, which are what you're reading when one lands. A look-up result's stamp waits until the card has gone. The arrow that points at the bag comes in from the side with its word underneath, and doesn't rise with the bag, so it never lands on what's in your hand. Its words match how you're playing ("Tap Bag", "Press B", "Click it").
- The belt waits for the stage's notice to go (it covers the belt on a phone), and the shop's clock starts when the belt does.
- Canvas text is never under 12px. A label that can't be that big on a phone is left out there (the till's name plate, the print on the bag, the Round again sign, the Bagging area label beside the Scan button), and the look-up card fades in rather than growing, so its words never shrink. On a narrow screen Dennis's bubble starts at the edge of his screen so his lines fit in two.
- Today's run deals each shop from its own seeded streams (its list, the gaps on the belt, the order of the fruit pictures, the ways of shopping offered after it), all drawn from `shell.random` at the start. An item going round again or a different choice never changes what the next shop deals.
- The look-up screen is a paper card with the game's colour along the top: the question ("Lime, lemon, lime or lime."), a clock, what's on the scale in a dashed frame, and four numbered pictures (a row of four, or two by two on phones). With a mouse or keys it sits under the belt, so you can see the till looking puzzled; on a touch screen it sits over the top, clear of the buttons. The machine's guesses are always wrong.
- The till's voice, Bev's and the queue's are blips, one a syllable, so "Unexpected item in the bagging area" has its real rhythm.
- The scale's display (OK in green, Wait in red and flashing, plus a needle) is also the Bag button's cooldown on touch screens.
- The receipt grows out of the till with everything you bag, and the basket or trolley on the floor empties as you go.
- When the shop shuts, paper shutters come down out of an ink box along the top (so the HUD stays on black), with a red edge and a red Closed sign hung on them. No stamp: the sign is the moment.

### Reply All

Someone has replied all to the whole company, and everyone is replying all to say stop replying all. The joke is company email and our own habits; nobody in the office is the punchline for who they are. The office, the company and the CEO are invented.

- **The office.** Seen from the front: a grid of desks, nine, then twelve, then sixteen. Each desk is white with a sparse halftone front, a keyboard, a monitor seen from behind (white, shaded down its right side) and one thing on the left: a mug, a plant, paperwork or a photo. Furniture uses sparser dots than people, so the people stand out. A strip along the bottom holds the server, a "Days since the last reply all" sign that always says 0 (left out where it won't fit at 12px), and the Mute thread button: drawn on keyboards, the kit's touch button on phones, with the strip made tall enough that the button never sits on a desk. Callouts land on the strip too (or in the HUD's row, where the strip is too narrow or the notice card is on it), never over the top row of desks.
- **The workers.** The house cut-outs, sitting down: a round body behind the desk, a big round head about as wide as the shoulders, shaded with a thin halftone rim so the face stays white, an office chair peeking out behind, mittens on the keyboard. Sixteen looks, one thing each: a backwards red cap, a red perm, a tweed flat cap and moustache, a sweatband, a headset, glasses and a side parting, a bun, a quiff, a red tie, a birthday party hat (nobody has noticed, because of the email), a bobble hat, a red bow tie, an accounts eyeshade, spiky hair and a lanyard, a pencil behind the ear, big headphones. Hats and hair sit clear of the eyebrows. They mutter as they type, shout as the bar fills, hover a mitten over Send, look at whoever just replied all, fold their arms and sulk when stopped, and smile only once: eyes shut, arms up, when the server melts.
- **Kinds of replier.** The +1 crowd type on a phone held in both mittens (ink, with an accent screen), twice as fast. Long emails carry a red flag, on the monitor when idle and at the start of the bar when typing, and take two goes. Out of office desks are an empty chair with a cardigan over it and a paper "Out of office" sign. The CEO's assistant sits in a glass corner office (accent outline, white glare lines) in an accent cardigan, with a neat bun and a red pencil through it, a headset, and the only sad face in the building: eyebrows up in the middle, mouth turned down. Their bar, bubble outline and envelopes are red: high importance. Each of their emails gets a "High importance" callout, a fan of red envelopes into the server and the whole office turning round to look, and the second one always says "Please reply to confirm you have stopped replying".
- **The bar.** A rounded paper outline over the head, filling with the accent and flashing red in its last quarter. Bubbles keep clear of everyone's bars and faces, never cover the speaker's own face or the assistant's, and are at least 12px (bigger in the clip frame). Clicking or tapping a bubble stops whoever is saying it.
- **The server.** An ink box with a paper outline: a face on the left, a rack of lights under a paper "Server" plate on the right, and a thermometer up the side (accent, then red from 70%). The face goes bored (heavy lids), cross, worried (sweating), then panicking (tiny pupils, open mouth), and opens wide to swallow every reply. It hums, then groans. When it melts it sags and drips, smoke pours off it, the office lights flicker, the server has the last word ("I quit.") and the run ends.
- **Envelopes.** Paper with an ink flap and white motion lines, flying in arcs from a desk into the server's mouth and back out to whoever it sets off. Every reply that lands puts a small envelope over every monitor.
- **The hand.** The player's cursor is a white mitten with an accent cuff, pointing down and to the left so the hand sits over the monitor and never covers a bar. Paper corner brackets mark the selected desk. Red brackets mark the row Mute thread would stop, and hazard tape reading "Muted" runs across it when it does. The intern's hand comes from the other side and is labelled "Intern".
- **One rule per action.** A click or a tap on a worker (or their bubble) stops whoever is typing at that desk. A long email is knocked back the first time ("Not yet"). Out of office desks and the CEO's assistant can't be stopped and say so ("Out of office", "On behalf of the CEO"); trying costs nothing. Clicking someone who isn't typing just gets a glare; poke three in a second (mashing) and your hand is slapped away for a second ("Hands off").
- **Keys.** So a keyboard keeps up with a mouse, every desk has its own key, laid out like the office: 1 2 3 4 along the back row, then Q W E R, A S D F and Z X C V, one press per stop. The keys are printed on the front of each desk while you play with keys, and light up while someone there is typing. That block replaces WASD in this game. The arrows still move the cursor (jumping to whoever is typing that way) and Enter stops them. Space is Mute thread, so a thumb can reach it while the fingers are on the desks; Shift isn't used (it sets off Sticky Keys).
- **Stamp words.** Not sent (the game's stamp). On a desk when you stop someone: Unsent, Deleted, Not sent, Binned, Just in time, Not yet for a long email that needs a second go, and Hands off for mashing.
- **Callouts.** Reply all: sent, Thread: out of control, Thread: forwarded, Forwarded again, Now copying in finance, Thread: escalated, Forwarded to the whole floor, Thread: muted, Server: groaning, Server: melted, Streak: x2 (to x4), Out of office, On behalf of the CEO, High importance, Intern: replied all, Home time.
- **Bubbles.** The reply itself, as typed ("Please remove me from this list", "+1", "Per my last email", "Stop replying all, you lemon"), and the grumble after being stopped ("Fine.", "I'll say it in the meeting.", "Muted. By a numpty."). Insults are about manners only.
- **Sounds.** Keyboards clattering (tiny square ticks), the email whoosh (filtered noise and a rising sine) when a reply gets out, a low thud as the server swallows it, a two-note ping in every inbox, a hiss for Mute thread, a sad falling sawtooth for the CEO's assistant, a three-note bleep for the out of office, a bell at the end of each stage, and the server's hum rising into a low wobbling groan.
- **Between stages** IT make three suggestions, each with a cost: Turn it off and on again, Bigger server, Email etiquette training, Hide the reply all button, Inbox rules, Hire an intern. Nothing about Mute thread is offered before stage 2, where it arrives.

### Terms and Conditions

To be written when the game is built.

### Just the Recipe

To be written when the game is built.

### Hold Music

To be written when the game is built.

### On Mute

To be written when the game is built.

### Scrubbed

To be written when the game is built.
