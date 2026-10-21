# S2 next control: isolate the added paint readbacks

Propose one new **source-only** variant that removes only the two `observeRead('diagnostic-before-paint-'+ordinal, …)` / `observeRead('diagnostic-after-paint-'+ordinal, …)` calls inside the painter observer. Keep the property/metric observations, every actual painter call, the original capture reads, the connected-control read and the after-control actual read unchanged. This is one finite readback-ablation control, not an unchanged retry or a causal conclusion. No implementation, model, PREPARE, browser, pixel processing or native execution was performed for this plan.

The evidence is root result `6ddf9109f716c34886e73b58c9c1fabea81dc7ea` and independent saved-output peer `a446d806edf3b8c7de7acb162754ba839e823cdc`, against stage `63608647d8bf52a872f9e4c6493fb54b693d88b5`. The successful saved generated fixture is `/tmp/atlas-root-s2-connected-stage/native-evidence/browser-fixture.mjs`; its raw/event record is `native/old-light-S2/raw-before-assertions.json`. These files and the earlier prelaunch dependency stop remain untouched. First native `35fc7302` and protocol `1730a9cc` remain separate immutable boundaries.

## Exact observation order in the saved case

For each of the five observed paints, the generated fixture does:

1. `paintState(c)`: computed styles/rect, available context attributes/properties, transform/dash, **one `measureText('1.1 Synthetic source')`**, font checks, map/scene/RAF inputs and resolved colors. No font assignment occurs in this observation.
2. Save the before event, then `observeRead(before-label,c.canvas)`. That calls the original `canvas` helper: `getContext('2d').getImageData(0,0,width,height)`, copies the bytes, hashes them, saves the buffer and emits its Canvas-read event, followed by the diagnostic-read event. These two events describe **one** readback, not two.
3. Invoke `originalPaint.apply(this,args)` exactly once. Its own ordinary label measurements and text/shape draws are part of the painter, not added diagnostic observations.
4. Run `paintState(c)` again: one more metric observation, properties and font checks; save after event.
5. Read/hash/save the after-label buffer once. The surrounding original wrapper or reference then issues its original capture read. Paint 5 instead issues the separately named connected-reference read.

The sequence below counts only calls after observer installation in this fixture. It does not claim a census of all native operations during initial construction/GPU text-atlas preparation. Context/canvas IDs and paint roles come from the saved events; counts follow the exact straight-line observer source and recorded read order.

| Paint and context/canvas | `getImageData` reads completed globally before its before observation | Reads already on this same context, then before-read count immediately before painter | Added metric observations on this context before painter, including current before observation | Read immediately following after-read |
| --- | --- | --- | --- | --- |
| 1: detached control reference, 1/2 | 0 | 0 → 1 | 1 | Original `control-reference` |
| 2: connected pre-ack actual, 4/3 | 3 | 0 → 1 | 1 | Original `fault-canvas-2` |
| 3: explicit actual repaint after destroy, 4/3 | 6 | 3 → 4 | 3 | Original `fault-canvas-3` |
| 4: detached final reference, 6/7 | 9 | 0 → 1 | 1 | Original `reference`, then original `actual-final-canvas` on context 4 |
| 5: fresh connected control, 9/8 | 13 | 0 → 1 | 1 | `diagnostic-connected-reference`, then `diagnostic-actual-after-connected` on context 4 |

Thus there are ten new before/after-paint readbacks, five retained original Canvas captures, one connected-control capture and one after-control actual capture: **17 Canvas `getImageData` calls**. The two GPU buffer captures use the separate GL readback helper and are not Canvas `getImageData`. Ten before/after metric observations occur (two per paint); they are not ten extra paints. The painter itself measures two visible labels in paint 1 and one in each of paints 2–5, from the synthetic graph and `graph.js:758–773`. These six painter measurements stay fixed. This accounting does not include the distinct GPU atlas's own text measurements.

Immediately before paint 3, the same actual context has already experienced paint 2's before-read, after-read and original `fault-canvas-2` read. Paint 3's added before-read is its fourth readback in this observed interval. Its third added metric observation precedes that read (paint 2 contributed before/after observations). After paint 3 its after-read and original capture bring this context to six; the later final/after-control actual captures bring it to eight. The fresh detached/connected contexts each receive before-read, after-read and one capture, then are discarded/removed. This order is a material difference from first `35fc`, where the original post-paint actual capture occurred but the added before/after readbacks and property/metric observers did not.

Saved paint 2 produces `d23157de…`; paint 3 changes the same context to `8df8e48e…`. Fresh connected paint 5 yields `d23157de…`, and detached paint 4 yields `7fd820eb…`. New actual differences include nodes and exposed edges, so the result cannot be described as the original glyph-only mismatch. Matching captured properties/metrics does not expose or prove a raster/provider/cache mechanism.

## One controlled source-only proposal, if separately requested

A future proposal should use a new identity, manifest, blocked-by-default PREPARE runner and fresh output. Prove exact reverse reconstruction against the saved diagnostic source with only the two observer readback-call removals plus the identity/artifact-accounting distinctions needed to declare their absence. Do not replace omitted buffers with blank/fabricated snapshots or claim an omitted after-paint hash exists. Preserve the `diagnostic-paint-before/after` property/metric events and ordinals, each saved painter invocation, `s.destroy(); m._paint()` and promise sequencing, every error/callback, all original capture labels/order, both GPU captures, the actual/detached/connected complete comparisons, and every threshold. Leave `observeRead` available for the connected capture. Keep control restoration/removal and the original after-control actual equality guard.

With the two call sites omitted for all five paints, ten buffers disappear explicitly; **nine raw buffers remain**: the seven original buffers plus connected reference and after-control actual. There should be seven Canvas readbacks and two GL captures. Do not remove the original post-paint `fault-canvas-2` read between actual paints; that would change the original fixture contract and confound the intended comparison. The fixed property/font/metric observers remain an acknowledged alternative source of observation effects.

Use retained `fault-canvas-2` and `fault-canvas-3` hashes to observe whether the same-context change persists; use retained original final actual/detached/connected buffers for all complete comparisons. If paint 3 returns to paint 2's bytes while all retained recorded state matches, the result supports sensitivity to removing this readback bundle under the recorded sequence. It would not identify which individual before/after call matters, establish an acceleration cause, or eliminate interactions with the remaining metric/property observations. If the difference persists, this ablation does not explain it; do not broaden to more experiments or reset caches. Other new results are retained as unexpected evidence, not normalized toward a desired image.

A separately authorised execution would be one fresh old-S2/light context, with raw data/errors/events preserved before assertions/teardown and first-unexpected-failure stopping. No extra draw, wait, warm, font load, context setting/reset, callback suppression, reference replacement, exclusion mask, threshold relaxation or lifecycle acceptance follows. This report requests no execution and leaves all original failed evidence untouched.
