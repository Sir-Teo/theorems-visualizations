# All-node map rendering

2026-10-19. The map loads all6,684 written and6,890 planned nodes,23,068 prerequisite
edges and13 fields. Both definitions and planned ideas remain enabled in the benchmark.

The initial continuous-pan run measured about22–24fps in its overview case. The renderer
now keeps one reusable raster with a256CSS-pixel margin and copies it during panning.
Changing zoom, focus, filters, highlights, viewport, fonts or theme rebuilds it. Native
pointer-up rebuilds at the precise final transform. Moving blits align to device pixels;
hit testing keeps the full-precision transform.

At1440×1000 in headless Chromium153.0.8010.12, the120-frame benchmark measured
**60fps in all eight theme/mode cases**: overview, selected overview, detail and selected
detail in light and dark. Warm-up uses20 frames. Cached draw submission p95 was0.1ms.
The complete measured snapshot is [map-performance.json](map-performance.json); run
`node scripts/audit-map-performance.mjs` to regenerate local measurements in`/tmp`.

This is steady-pan evidence. It excludes cache reconstruction and does not establish60fps
during every zoom/hover transition, on every device, or in the oversized direct-render
fallback. Those limits remain part of assessing the full MASTER_PLAN§7.3 performance gate.

The raster is checked before allocation: no more than16million pixels or8192pixels on
either edge (at most64MB of rawRGBA, excluding browser/GPU overhead). Larger views render
directly at full resolution. Existing raster storage is reused on ordinary rebuilds and
released on destroy. Font completion invalidates earlier fallback-font images; font
listeners are cleaned up. Reusing and mutating a highlight Set also invalidates the image.

`node tests/map-rendering.mjs` passes both themes, direct/raster composited pixel comparisons,
pan margins, filter/highlight/font/theme invalidation, retry after failed selection/tooltip
detail requests and the3840CSS-pixel/DPR2 memory fallback. The separate
`node tests/map-fractional-rendering.mjs` passes four high-zoom theme/DPR cases with native
fractional pointer pans, resize and destruction checks. The final settled images stay below
2/255 mean channel difference and2% of channels differing by more than20/255 from direct
rendering. See the [independent review](map-raster-independent-review.md) for exact results.

The existing six UI groups pass, including a strengthened treemap regression: resizing no
longer replaces a focused chapter control without restoring its focus. Root inspected the
final map and statement-retry screenshots. The independent reviewer inspected high-zoom
light/DPR1 and dark/DPR2 views. Failed detail requests remain usable and expose an explicit
retry instead of producing an unhandled rejection.
