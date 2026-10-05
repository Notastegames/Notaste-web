# Hold Music: the design

Worked out by the builder on 3 October 2026 before the pause; no code yet. Build from this.

HOLD MUSIC: design notes (paused before any code was written)

Files planned: public/games/hold-music/{index.html, hold-music.js (main + design header), line.js (sound/sequencer), draw.js (art), hold-music.css (patience pips)}.

ROUND: 4 calls (stages): Billing, Faults, Complaints, Cancellations. Each call: ring -> menu levels -> hold -> agent picks up -> interlude (calls 1-3) / line dies and you're sent back to the start (call 4) -> results.
- Menu levels per call 1,2,3,3; options 4,4,5,5; menu bpm 92,100,108,116. Option slot = 2 beats, question = 2 beats, "Please choose now" = 2 beats, then "Here they are again", a repeat (half points), then "Sorry, I didn't catch that" -> dropped (patience -1, redial, same level).
- Call 1: you can answer as soon as your option is read. Calls 2-4: keypad locked until every option has been read (the memory test; an early press just buzzes, "Listen first" on the LCD). Calls 3-4: numbers scattered 1-9 ("our options have changed"). Call 4: "For X, press N" (number said last).
- Sticky note (accent fill, ink text): "My problem" + this call's facts only (1-3 lines); the current question's line ringed in red. Facts, seeded by shell.random: topic (Broadband, Landline, Telly box, Smart meter, Mobile, Fax machine), account (home, business, boat, shed, caravan, lighthouse), light colour, since (weekday), off and on (once, twice, three times, never, lost count). Call questions: 1 [topic]; 2 [place, light]; 3 [since, topic, tried]; 4 [tried, light, place].
- Wrong number: "Transferring you now" -> useless department ("Lanyards", "Ongoing Restructuring", "Pens", "The Car Park", "Brand Refresh", "Customer Delight. We're closed.") -> "Returning you to the menu", patience -1, callout "Transferred".
- Hold: count-in bar, then queue N bars (5, 6, 8, 8; queue -1 per finished bar while on the line). Hold bpm 92; 100; 104->120 at bar 4 ("the fast version", key change); 112->132. Voice-overs from call 2 ("Your call is important to us", etc.), music ducks 2 bars, beat tick and lights carry on.
- Signal 4 bars: miss -1, stray tap -1 (at most once per beat gap), +1 per 4 hits in a row. 0 = cut off: patience -1, queue +3, dial tone, redial, count-in. Patience 3 (max 5); 0 = you hang up, round ends.
- Agent is sympathetic; the system does the transferring. Call 4: "Hello, you're through to Cancellations. My name is" -> line dead -> "Thank you for calling A Company. Press 1 for billing."
- Interlude choices: Put the kettle on (patience +1, queue +2); Speakerphone (beat window +40ms, beats score half); Press 0 a lot (skip the first question, hold +8 bpm). Clip mode auto-picks after about 2.5s.

TIMING: a transport clock that follows AudioContext.currentTime 1:1 (virtual dt clock when there's no running context, or when ?speed>1). The scheduler queues sounds by transport time, plays them 0.15s ahead at audioAt(t), cancellable by group. Visuals and judging use heard time = transport - (outputLatency + baseLatency, clamped 0..0.2). Taps from my own keydown/pointerdown listeners, timed from e.timeStamp. Window centre +15ms; perfect +/-75ms; good +/-min(150ms, 0.3 beat). Pause works because the kit suspends the context. Autopilot taps at beat time +/-35ms and presses the remembered number 0.25-0.45s after the keypad unlocks.

SCORING: menu 100 (50 on the repeat); beat 20 perfect / 10 close; streak +50 every 8; call +200; +100 per patience left at the end. Max about 4,800. Draft ladder: Approved 4300, Pending review 3200, Not approved 1800, Rejected (hung up caps at Not approved). Tune with the autopilot.

SOUND (all on N.sound.ctx()/out()): a "line" chain (highpass 220, lowpass 3300, soft clip) with music (duckable), beat and voice buses. 25% pulse lead with slow wow, square bass, square chord stabs on the off-beats, noise hats, a square tick on every beat (beat bus), crackle and hiss loops. Original 8-bar tunes: "please" (C Am Dm G, melody E5-G5E5D5-C5 ...) and "fast" (C G Am F). DTMF tones for spoken numbers and key presses, UK ring (400+450Hz), dial tone (350+440Hz), syllable blips for voices (Voice about 560Hz and cheerful, agent about 300Hz), static on a miss.

LAYOUT: phone bottom right; keypad keys at least 56px on touch, about 11.5 units on desktop. The LCD shows the speaker's portrait (Voice / agent) in the menu and the queue number, signal and a note lane (notes run right to left into a target) on hold; a big beat pad replaces the keypad on hold (tap anywhere counts); 4 bar lamps. You (cut-out, accent bobble hat, handset at your ear, curly cord to the phone) bottom left; sticky note above you; bubble above the phone or in the left column on a square phone, tail to the LCD.

STILL TO DO: everything. Code, cover SVG (text as paths with fontTools from public/fonts/notaste-display.woff), OG PNG (Playwright render, og-thonglets layout), GAMES line, poster, sitemap, DESIGN.md section 13, playtest, screenshots.
Playwright: require('/opt/node22/lib/node_modules/playwright') (the NODE_PATH=... form gets refused by the sandbox).
