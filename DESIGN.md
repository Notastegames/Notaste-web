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

A new game picks a new accent that is clearly different from these and from red, and gets added to this table. The starter game (In Tray, section 12) borrows `--smoke` because it isn't a real game; a game copied from it replaces that. Accents must stay readable as small dots on black (at least 3:1 against `#000`).

### Exceptions

Parody content that imitates a real interface (the fake social posts in "Reject the internet") may use the colours it imitates, inside that parody only.

---

## 4. Type

| Role | Face | Where |
| --- | --- | --- |
| Display | **Notaste Display** (`--display`) | Headlines, stamps, game titles, HUD numbers, game buttons, the tape. Always uppercase. |
| Body | The device's own UI font (`--body`) | Paragraphs, links, small print. |
| Mono | The device's monospace (`--mono`, game pages) | Timers and boot logs, where digits must not jump about. |

- Notaste Display is our own face, drawn from the logo's letterforms. It lives at `public/fonts/notaste-display.woff` and is rebuilt with `tools/build_font.py`. It covers A–Z, a–z, 0–9, common punctuation, £, curly quotes, en dash and ellipsis. Anything outside that falls back to Impact, so keep display text inside that set.
- No other web fonts. No Google Fonts, no font services, no third-party requests of any kind.
- Type scale: `--step--1` (0.875rem), `--step-0` (1.0625rem body), `--step-1` (1.25rem), `--step-2` (section headings), `--step-3` (the hero). Game titles use the sizes in `games/game.css`.
- Display text is tight: line-height about 0.86–0.95.

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

**Between stages.** A stamp from the approval ladder, a heading ("Stage 2 complete."), one joke line, the numbers, and up to three choices as equal cards: none of them is red, because none is the main action. Each card is a short label and one line saying what it does and what it costs. Number keys pick them as well as Tab and Enter.

**Title screen.** The cover art behind, the game's title in Notaste Display, one red "Press start" button, one line of small print, and a controls hint that matches the device (keys on desktop, touch on phones). Another way to play is a quiet outlined button under Press start, never a second red one.

**HUD.** White Notaste Display with a black shadow so it reads over anything. Progress (lap, level, wave) top left. Rank or score top right. The pause, sound and fullscreen buttons sit together at the top in the middle. Keep it to what the player needs this second.

**Callouts.** In-game jokes and events appear as small stamps that land and fade ("Spun out", "Wheel: optional"). At most one at a time. They're decoration, so screen readers don't announce them. A game with a busy field (Thonglets) asks the kit for smaller ones (`smallCallouts`) so they don't cover the action, and keeps routine ones (a fee, a tier) to once a stage.

**Today's run.** Every game has one (`daily: true` in the kit, or `{ label: "Today's race" }` to name it): a quiet button under Press start that plays a round everyone gets the same that day. The kit seeds it from the date; anything that should be the same for everyone comes from `shell.random`, never `Math.random`. Today's best is kept apart from the all-time best, and the results show the date ("Run: 2 October").

**Results screen.** A stamp from the approval ladder, a heading that says what happened ("You finished 2nd."), one joke line, the numbers (time, best), and three actions: play again (red), a quiet "Share result", and "All games". Share result opens the device's share menu, or copies one line and the link: the game, today's run if it was one, the result in a few words, and the stamp ("Thonglets, today's run (2 October): 4,210 points, stage 5 of 7. Pending review."). The game supplies the few words (`share` in `shell.finish`); the line follows the copy rules like everything else.

**Controls.**
- Keyboard: arrow keys and WASD to move, P or Esc to pause, M to mute. Every button works with Enter and Space, and focus moves to the button that matters (Resume, Race again).
- Touch: large on-screen buttons (at least 56px), bottom corners, thumbs only. Touch controls show only on touch devices. A button with a cooldown fills up from the bottom as it recharges and gets an accent rim when it's ready (`shell.padFill`); the matching HUD meter (marked `data-pad`) then hides on touch screens, since the button already says it.
- Pointer: a game that follows the mouse or a finger (Thonglets) turns on the kit's `aim`. Dragging anywhere on the screen moves it, and the thing being moved sits a little above the finger so the finger doesn't hide it.
- Gamepad: supported where it makes sense.
- The page never scrolls while a game is running.

**Say what's new, and what to do about it.** Each stage that brings something new opens with a notice (`shell.brief`): a paper card with the game's colour along the top, the stage's name, and two or three plain sentences on what the new thing does and how to deal with it. It goes up with the countdown so it's read before Go. In play, a small bobbing arrow with a word on it ("Smite it", "Get a permit", "Bless: press B") points at the one thing that needs dealing with right now, and stops once you've shown you know (you've smitten that rival, or blessed once). One arrow at a time; speech bubbles keep clear of it.

**One rule per action.** An action means one thing everywhere, and the exceptions are said out loud. In Thonglets, Smite stops the rival gods with faces (the Feed, the Landlord, the rocket, the Loudspeaker). The Sea and the Planning Office can't be smitten and say so ("You can't smite the sea", "You can't smite paperwork"), and trying costs nothing. When a smite would land, red brackets mark the target before you strike.

**Forgiving by default.** Hazards punish a clear mistake, not bad luck or a corner cut by the crowd. Heavy Traffic's barriers let you slide along them and a tow puts you back on the road. Thonglets walk round a pit unless your own light is over it, and even then wobble on the edge long enough to pull back; anyone who loses sight of you walks to where they last saw you, and a run gets one extension for a statue that's nearly built. Speech bubbles stack rather than overlap, and stay clear of the HUD.

**Behaviour.**
- Pause automatically when the tab is hidden or the window loses focus.
- Fullscreen button on every game. Phones that can't do real fullscreen get a full-window version.
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

1. Pick a name, a slug, a one-line pitch and an accent colour. Add the accent to section 3.
2. Copy `public/games/starter/` to `public/games/<slug>/`, rename `starter.js` and rewrite it as the new game. In Tray is a whole small game on the kit (HUD, keys, aim, a touch button, callouts, a notice, today's run, bests, share, autopilot), so keep what fits and replace the rest. Delete the page's `robots` line.
3. Fill in the page: title, description, share tags, `data-game`, `--accent`, stamp word, how-to-play lines.
4. Add the game to `GAMES` in `public/games/game.js` and add a poster on the homepage.
5. Draw the 800×600 cover and the 1200×630 share image (section 7).
6. Use the kit for intro, screens, controls, sound and saving. Draw with `Notaste.tokens()` colours. Give it today's run, a `share` line in the results and an autopilot.
7. Write the copy in the house voice (section 2) and check the punch-down rule.
8. Test at phone and desktop sizes, with keyboard, touch and reduced motion. Run `node tools/playtest.mjs <slug>`, which must pass. Publish the preview artifact for approval, then merge the pull request.
