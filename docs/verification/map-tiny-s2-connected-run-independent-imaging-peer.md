# Independent saved old-S2/light connected diagnostic audit

The saved diagnostic is internally consistent, but the connected control does **not** agree with the newly observed actual canvas. This verifies one diagnostic's evidence only. It closes neither the fallback reference discrepancy nor any lifecycle repair.

## Immutable scope and launch provenance

Reviewed stage `63608647d8bf52a872f9e4c6493fb54b693d88b5`, `/tmp/atlas-root-s2-connected-stage`, and saved output `native-evidence` inside that stage. Exactly one old/S2/light synthetic component case ran: 640×480 viewport, DPR 1, 640×360 canvas. No browser, renderer, native retry, timing or full-map run was performed by this peer.

The first external-output attempt at `/tmp/atlas-root-s2-connected-state` failed resolving bare `playwright-core` during ESM linking, before browser module execution. Its log and four preparation files remain preserved. Root then changed output location/environment only; the inside-stage run exited 0. The preparation JSON is a prelaunch snapshot, not evidence that the successful native run never happened.

The independent source reconstruction reproduces both generated attempts exactly, including the canonical `/private/tmp/atlas-root-s2-connected-stage` source root produced by Node realpath. All 71 protected files match their pinned hashes and exact immutable archive bytes. No source normalization or changed acceptance threshold was needed.

## Whole evidence checks

Independent Python/NumPy checks pass for all 19 raw arrays (640×360×4, 921,600 bytes each), their lengths/hashes, all 19 derived PNGs, both original difference PNGs and all six supplementary three-way difference PNGs. GPU orientation/unpremultiplication and the integer RGB composition on light background (247,245,240) were independently reconstructed. The complete record, metadata and raw-before-assertions record agree. The case has no page errors or fixture failure.

I checked all 63 saved events, five before/after paint pairs, and diagnostic reads numbered 1 through 11. The native Worker acknowledges the pending scale-8 request; actual destroy terminates it. The old late rejection still writes `Scene generation disposed` and marks edges:8 failed, preserving the expected old negative behavior. Cleanup records zero bytes, owners, pending, scratch and native-live resources, null/terminated worker and disconnected scene. These observations do not prove context restoration, deletion-once semantics or an unobserved late-callback window.

## Exact paint and hash sequence

Full hashes are in the accompanying evidence. Short prefixes below identify them unambiguously there.

| Paint | Actual saved role | Context / canvas | Before → after SHA-256 |
|---|---|---|---|
| 1 | Detached control reference | 1 / 2 | blank `0b150fd3` → `9795415d` |
| 2 | Connected actual, pre-ack fallback | 4 / 3 | blank → `d23157de` |
| 3 | Explicit actual repaint after destroy | 4 / 3 | `d23157de` → `8df8e48e` |
| 4 | Fresh detached final reference | 6 / 7 | blank → `7fd820eb` |
| 5 | Fresh connected control | 9 / 8 | blank → `d23157de` |

The final actual was captured before the connected control. Removing the control restores context 4; the after-control actual hash remains `8df8e48e`. Both original control GPU/reference hashes are unchanged from first-run 35fc evidence. The detached final reference also remains byte-identical to its first-run `7fd820eb` array. The connected control and paint 2 match **old** actual `d23157de`; they do not match new paint 3/final actual `8df8e48e`. In first 35fc, both actual paints and final actual were `d23157de`.

## Unmasked comparisons and localization

Means below are byte-channel means over each complete image, without masks or display gain.

| Complete pair | Raw RGBA changed channels / mean / maximum | Composited RGB changed channels / mean / maximum |
|---|---|---|
| New actual / detached | 7227 / 0.07342122395833334 / 255 | 3325 / 0.031219618055555554 / 48 |
| New actual / connected | 5511 / 0.022710503472222223 / 255 | 2443 / 0.0045847800925925926 / 48 |
| Detached / connected | 3297 / 0.055296223958333335 / 255 | 2213 / 0.02970775462962963 / 38 |

Both new-actual pairs have complete difference support `[55,153,640,167)`; detached/connected support is `[66,153,178,167)`, reproducing the old glyph-footprint discrepancy. Bounds are half-open.

A disjoint, source-guided localization accounts for every differing pixel. For new actual/connected, the conservative node rectangle `[54,153,66,167)` contains 85 RGB channel differences (31 pixels, max 48); the old glyph footprint `[66,153,178,167)` contains 1434 (796 pixels, max 3); exposed edge `[178,157,640,163)` contains 924 (924 pixels, max 1); the remaining image contains zero. New actual/detached has respective counts 85, 2316, 924 and zero. Detached/connected has 0, 2213, 0 and zero. The under-label edge contribution cannot be separated from glyph coverage by this partition. The new mismatch is therefore not glyph-only. These regions localize evidence; they do not mask any comparison gate.

## Observer limits and personal pixels

All captured context attributes agree: alpha true, sRGB, unorm8, desynchronized false, standard tone mapping, willReadFrequently false. Paints 2–5 also have identical recorded post-paint properties, identity transform, empty dash, 500 11px Inter font, middle baseline and measured label width 103.14067077636719. Map inputs agree; no RAF or animation is pending. Recorded font states are loaded and no installed diagnostic font-event record occurs. Connected canvases inherit the page font/features; the detached computed style fields are empty. These facts do not expose acceleration/provider/cache/raster history.

The new instrumentation includes property/measureText observations and **before/after-paint getImageData readbacks**. Paint 3 differs from paint 2 on the same actual connected context, so connection alone does not account for the saved sequence. Readbacks may affect Canvas acceleration/raster history, separately from font/cache observations, but this diagnostic does not establish either mechanism. Original-pair drift is material evidence, not something to normalize away or target with warming. Even connected agreement in another sequence would concern only that exact control and would not prove causality.

I personally inspected all 28 complete native pictures in four readable sheets, three enlarged nearest-neighbor node/label crops and three whole RGB difference images shown with ×16 display gain. The visible new differences include node and exposed edge as well as the label region. Display crops/gain never enter the numerical comparisons. Paths and hashes for all views, offline probes, all saved artifacts and launch logs are recorded in `map-tiny-s2-connected-run-independent-imaging-evidence.json`.

## Disposition

Accept this as one verified saved old-S2/light diagnostic with a disclosed observer-sensitive change. The original 35fc first-stop and 1730 protocol boundaries remain intact; the repaired exact-zero fallback gate has not run or passed. No causal attribution, connected-reference fix, repaired S2/S3/dark/context-restoration acceptance, production readiness, full-app, performance or matrix acceptance follows. This commit contains only independent report/evidence; every browser/server job remains closed.
