# Saved S2 Canvas differences localize to the label

Offline examination of the original old S2 light/dark evidence finds differences confined to the source-label footprint. No separate node-disk or exposed-line discrepancy is present. This is localization, not a demonstrated cause or an accepted reference repair. Repaired S2 remains unrun, and its exact-zero fallback comparison remains unchanged.

The source boundaries remain first-stop `35fc7302a68d3e584499e9e71297d1a3ef5a3cc4` and protocol-only `1730a9cc7b6a4a3d54c8abae09676240f16a9351`. This report follows read-only plan `732ceb05f35220ca4926a2bb910e5cf87c8c8db4`. Only the original saved files under `/tmp/atlas-ctrl-native-lifecycle-first/old-{light,dark}-S2` were read. New derived images and measurements are isolated in `/tmp/atlas-ctrl-s2-offline-localization`; originals were not rewritten. Imaging's independent peer was notified of this output ownership. No browser, model, PREPARE, native retry, application change, threshold change, or reference replacement occurred.

## Complete unmasked measurements

Each image is 640 × 360. Raw differences use all four RGBA channels without compositing. RGB differences independently composite each original over the same declared light `(247,245,240)` or dark `(14,16,20)` background, then compare all channels. Original saved PNGs match these recomputations byte-for-byte as RGB pixels. Bounds below are half-open, with top-left origin. The companion evidence JSON preserves original raw/metadata SHA256 values, full counts, supplementary region counts, method, derived image hashes, and inspection scope.

| Measure | Light | Dark |
| --- | --- | --- |
| Raw differing RGBA channels / pixels | 3,297 / 994 | 3,313 / 992 |
| Raw mean / maximum channel difference | 0.055296223958333335 / 255 | 0.056396484375 / 87 |
| Raw support bounds, union of all channels | `[66,153,178,167)` | `[66,153,178,167)` |
| Differing alpha samples | 895 | 939 |
| Composited differing RGB channels / pixels | 2,213 / 892 | 2,030 / 804 |
| Composited mean / maximum channel difference | 0.02970775462962963 / 38 | 0.04253327546296296 / 53 |
| Composited support bounds | `[66,153,178,167)` | `[66,153,176,167)` |

The complete original actual Canvas equals both saved earlier `fault-canvas-2` and `fault-canvas-3` **exactly as raw RGBA**, in each theme. In the fixture those are the scale-8 preparation fallback paint and explicit acknowledgement-handler paint. Therefore the saved evidence contains no pixel mutation between either recorded actual paint and final actual read. This does not reconstruct every unobserved platform/context property.

## Source-derived primitive coordinates and visual inspection

The immutable fixture sets source world coordinates `(0,40)`, target `(200,40)`, camera `k=8`, `tx=60`, `ty=-160`, and DPR 1. Both actual and detached calls use the same saved `_paint` body and this same map object (`tests/fixtures/map-private-lifecycle-native-browser.mjs:22,26–28`). These are exact **source-derived arguments**, not a saved primitive-call trace or newly measured font metrics.

- `graph.js:434,686–696` maps the dependency endpoints to `(60,160)` and `(1660,160)`. Its cubic controls are `(780,160)` and `(940,160)` because `dx=max(20k,0.45×1600)=720`. The line width is 1.3 pixels, with the collection color at opacity 0.16. The visible exposed line continues to the right edge. There is only one dependency in S2.
- `graph.js:730–752` gives the source node radius `3×1.5=4.5`, centered at `(60,160)`. The target center `(1660,160)` is culled. The complete supplementary node rectangle `[54,154,66,166)` has **zero** raw or composited differences in both themes.
- `graph.js:758–773` paints the single visible label `1.1 Synthetic source` in `500 11px Inter, system-ui, sans-serif`, left aligned and middle baseline, at `(68.5,160)`. It first strokes using background color at opacity 0.9 and width 3.5, then fills using the resolved muted color. The target label is culled. No field/chapter/row decoration exists in this declared synthetic graph. Actual measured text width and inherited context settings were not captured by the first runner.

I personally inspected all six original full-size actual/reference/difference images at 640 × 360, plus six native-size supplementary crops: actual, reference, and 12× brightness-amplified difference for each theme. Crops are `[48,140,205,180)` without resizing. The differences visibly follow the label's glyph strokes and coverage; actual text appears lighter/thinner than the detached rendering. The node is identical, and no exposed-line difference occurs outside the label support. The full raw support bounds prove no differences anywhere outside that footprint. The edge passes under the label: nonzero differences in its horizontal strip are **not** evidence of a separate line error, and the final composited images cannot disentangle line pixels underneath differing glyph coverage. No region is excluded from any complete count or acceptance gate.

This supports a glyph-localized discrepancy and rules out a separate visible shape discrepancy in these saved pairs. It does not distinguish connection-dependent font rasterization, inherited context settings, font state, or another text-specific mechanism. It does not establish that connecting the reference would fix the discrepancy. The read-only diagnostic plan remains the source of the separately scoped state observations needed for causal discrimination. All first-stop failures, originals, exact-zero fallback criterion, normal GPU tolerances, and unproved lifecycle/full-map/context-restoration limits remain intact.
