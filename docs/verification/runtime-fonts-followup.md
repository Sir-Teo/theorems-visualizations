# Canvas redraw after font completion

Status: accepted after independent root reproduction and browser checks. This is a runtime correction, not a source-queue closure.

Static canvas labels could retain fallback font metrics after Newsreader finished loading. On the actual game 4.5 canvas at 1440 px, holding the two Newsreader requests through the initial render reproduced the defect: the “binary-tree depth” bounds stayed at `[288.3972, 323.0225, 391.3831, 336.6748]` after `document.fonts.ready`. Explicit invalidation changed them to `[287.1935, 322.2669, 393.0897, 336.8844]`. The loaded font alone had not repainted the canvas.

The runtime now invalidates when the initial font-ready promise resolves and on subsequent `loadingdone` events. Destruction removes the event listener; the promise callback checks the runtime's destroyed state. These callbacks redraw without changing controls or the animation clock.

Independent root checks:

- A real local WOFF2 request is held, released after the first static paint, and checked against actual loaded native canvas metrics. The initial-loading and later-loading cases both failed before the fix and pass afterward.
- Destruction while the font request is pending removes the listener and prevents a new paint. Both live cases preserve the slider value and clock. All three portable regression groups pass in `tests/verification-runtime-fonts.test.mjs`.
- The actual game 4.5 reproduction now changes automatically to the loaded bounds above. Subsequent explicit invalidation produces identical bounds.
- All six existing browser UI regression groups pass. The independently rerun four MDS browser groups also pass on this runtime.

Root evidence is retained locally in `/tmp/atlas-root-runtime-cold-font-before.{mjs,json,log}`, `/tmp/atlas-root-runtime-cold-font-after.{mjs,json,log}`, `/tmp/atlas-root-runtime-fonts-before.log`, `/tmp/atlas-root-runtime-fonts-portable.log`, and `/tmp/atlas-root-runtime-fonts-ui.log`. The portable test is the durable regression. This checks Chromium's real font loading and canvas paint behavior; it makes no full-map frame-rate or other-browser claim. The production graph renderer was not changed.
