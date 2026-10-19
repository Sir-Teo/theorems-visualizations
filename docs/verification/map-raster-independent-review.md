# Independent map raster review

2026-10-19. Reviewed the `MapView` raster cache and statement retry changes independently
and reran `node tests/map-rendering.mjs` against the final bounded patch. Both themes pass
with all 13,574 written/planned nodes, including direct/raster composited pixel comparisons,
filter/highlight/theme/font invalidation, same-Set highlight changes, failed statement and
tooltip requests, and the 3,840 CSS px / DPR 2 full-resolution direct fallback.

The initial review identified three gaps: unbounded extra raster allocation, font completion
not invalidating an initial fallback-font raster, and reuse of a mutated highlight Set. The
final code addresses all three. Allocation is checked before creating/resizing a cache: at
most 16,000,000 pixels and 8,192 pixels per edge. This bounds the extra logical RGBA bitmap
to 64 MB; it does not estimate all browser/GPU memory. Larger views use the existing direct
renderer at full resolution. Font-ready/loadingdone callbacks invalidate the cache, are
removed on destroy, and check the destroyed runtime. Explicit `setHighlight` calls invalidate
even when a caller reuses the same Set. Resize, field/definition/planned filters, focus,
selection, zoom and theme all participate in rebuilding.

An additional high-zoom check found visible fractional-image resampling at DPR 1. The final
patch aligns moving cached blits to device pixels, retaining the precise logical transform
for hit testing. Pointer-up discards the moving raster and rebuilds at the precise final
transform. `tests/map-fractional-rendering.mjs` independently tests these behaviors with
native pointer input at zoom 1.6 in both themes and DPR 1/2:

| Theme | DPR | Settled mean composited channel difference | Channels differing by >20 |
| --- | --- | --- | --- |
| Light | 1 | 0.532 | 0.636% |
| Light | 2 | 0.449 | 0.953% |
| Dark | 1 | 0.815 | 1.759% |
| Dark | 2 | 0.614 | 1.219% |

All four retain the exact logical pan `(33.25, −22.5)` CSS px. During motion the blit is
device-pixel aligned, with at most half a device pixel of visual quantization. On release,
all four rebuild at exactly the logical `tx/ty`, with mean pixel difference below 2/255 and
fewer than 2% of channels differing by more than 20/255 from the direct renderer. The test
also verifies resize invalidation, cache release and font callback cleanup on destroy, with
no browser errors. High zoom can first request an additional row-heading font, so the test
waits for that font before defining its comparison baseline.

Native screenshots: `/tmp/atlas-map-fractional-{light,dark}-dpr{1,2}.png`. The light DPR 1
and dark DPR 2 views were inspected. These checks establish rendering and invalidation
behavior; they are separate from the root agent's steady-pan frame-rate benchmark and make
no claim of 60 fps during CPU raster rebuilds, zoom transitions or oversized direct fallback.

No graph implementation edits were made by this reviewer. New files are this report and
`tests/map-fractional-rendering.mjs`; `git diff --check` passes for the test.
