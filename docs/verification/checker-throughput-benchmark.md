# Checker throughput experiment — 18 October 2026

A temporary verification server and frame-based settling reduced this20-item full-mode sample from136.6s to40.6s (**3.36× faster**) while producing **67 byte-identical PNGs**, including all47 alternative-mode states and their readouts. The experiment initially left shared files untouched; the parent subsequently authorized the implementation described below. The visualization runtime remains unchanged. The existing light/dark checker processes210918 and231731 were left running.

| Temporary configuration | Time | Transferred bytes | PNGs identical to baseline |
| --- | ---: | ---: | ---: |
| Existing route/no-store server and waits |136.6s|23.70MB|67/67|
| Local KaTeX, broad asset/module cache, existing waits |104.4s|2.56MB|67/67|
| Broad cache and frame readiness, no transition settling |35.9s|2.56MB|32/67|
| Stable shared assets only, frames, no transition settling |51.3s|2.85MB|52/67|
| Stable shared assets, frames, screenshot animation fast-forward |39.9s|2.85MB|67/67|
| **Stable shared assets, frames, actual CSS-transition completion** |**40.6s**|**2.85MB**|**67/67**|

The final candidate preserves natural animations; it waits for actual running `CSSTransition.finished` promises. The screenshot fast-forward variant was exploratory, not the implementation recommendation. The frame-only differences were confined to controls'160ms color/background transitions; a cropped comparison confirmed the preceding button still fading and the new button still darkening. Canvas, text and readout regions were unchanged. The final candidate is byte-identical without any screenshot masks or image tolerance.

## Recommended implementation scope

1. Use a private verification-server option to serve the harness with **local pinned KaTeX0.16.11 CSS/JS** and omit the optional Google font link. This permits avoiding Playwright routing for that context. The current helper's routing disables HTTP cache, and `scripts/serve.mjs` independently sends `cache-control:no-store` for every file; fixing only routing cannot create caching.
2. Cache only `/assets/*` and `/node_modules/katex/*`. Keep `/content/*`, harness HTML and generated `/data/*` responses `no-store`, so active content edits are reloaded. The final two candidates used this policy. They transferred about88% fewer bytes; median page load fell475ms→71ms.
3. For `--still` only, retain real `document.fonts.ready`, scroll the visualization into view, and wait two animation frames after mounting. Replace initial1500+120ms sleeps with that readiness. `v.animate` already receives the still flag and pauses at its declared still state.
4. After each native mode/toggle click in still mode, await font readiness, dispatch `vizpause`, wait two frames, await running CSS transitions, then wait two further frames before canvas inspection/screenshot. Transition waiting used:
   ```js
   await Promise.all(document.getAnimations()
     .filter(a => typeof CSSTransition !== 'undefined'
       && a instanceof CSSTransition && a.playState === 'running')
     .map(a => a.finished.catch(() => {})));
   ```
   This uses actual completion rather than a guessed100ms delay. Leave live-animation default settling unchanged.
5. Keep every existing mode, native click, blank-canvas inspection, runtime/TeX error check and screenshot. A changed checker fingerprint will require the final sweep to restart under its new configuration; the measured gain justifies that decision, which belongs to the integrating parent.

## Evidence and limits

The same20IDs were run in order with one browser page/worker, light theme, width860, viewport1000×1400, deviceScaleFactor2, `still=1`, while the two existing four-worker full-mode jobs continued. Every arm covered20 defaults plus47 segmented/toggle alternatives, with real KaTeX0.16.11, no runtime/TeX/blank failures. This is a controlled sample under changing host contention, not a throughput guarantee for every visualization or the live-animation path. The fixed sleeps alone account for more than69s of the baseline sample, before reset delays.

`checker-throughput-benchmark.json` preserves per-arm totals and exact sample IDs. Detailed timing/resource rows and67 structured state readouts are under `/tmp/atlas-bench/transition-results.json` and `transition-readouts.json`; final PNGs are `/tmp/atlas-bench/transitions`. The complete standalone final experiment is `/tmp/atlas-bench/transitions.mjs`. Original/broad-cache/frame-only evidence remains in that directory. SHA256 comparisons found all67 final PNGs byte-identical to the current checker baseline, which also proves identical displayed mode readouts. No installation, production URL, public site or shared runtime was changed by the experiment.


## Implemented validation

After the integrating parent stopped the old full-mode processes and authorized the change, the opt-in server transport, local-asset helper option, still-only harness settling, native-mode transition settling and fingerprint policy were implemented. `scripts/verification-browser-evidence.mjs` now hashes `scripts/serve.mjs` in the same common-file list as the checker and requires the new transport/settling configuration. All live-mode1500+120ms initial waits and700+80ms per-mode waits remain unchanged. The public server defaults to no-store and unmodified harness URLs.

`tests/verification-browser-server.test.mjs` passes2tests covering public/default behavior, pinned local JS/CSS/font serving, font MIME and exact cache boundaries. The actual implemented checker, run on the same20IDs with `--modes --still --jobs=1 --fail-on-warnings`, passes20items and47alternate states with0runtime/TeX/blank/quality warnings. Its67`shots/*.png` are **byte-identical** to the legacy baseline. Evidence reconciliation accepts all20under the new fingerprint/config. Report `/tmp/atlas-bench/implemented-light.json`; comparison `/tmp/atlas-bench/implementation-comparison.json`; reconciled evidence `/tmp/atlas-bench/implemented-evidence.json`. The JSON report includes SHA256 hashes of changed code, the legacy common runtime hash and all67matching baseline/candidate PNG pairs.
