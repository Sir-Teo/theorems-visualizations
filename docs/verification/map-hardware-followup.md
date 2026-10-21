# Hardware map protocol and WebGL assessment

2026-10-19. The committed Canvas renderer remains in production. The tested-regime
60 fps gate remains open. The existing [transition evidence](map-transitions-followup.md)
measures the default headless-shell configuration; a matching subsequent probe
reports SwiftShader software rendering. Its original artifacts did not capture a
GPU renderer ID, so that historical identification is an inference. It does not
establish that the same Canvas renderer fails on hardware acceleration.

## Controlled hardware protocol

The completed run is reproducible with:

```sh
node scripts/audit-map-transitions.mjs /tmp/atlas-map-hardware-controlled.json --frames=24 --metal --full-chrome
```

This launches full Google Chrome in a fresh temporary Playwright profile with
`--use-angle=metal`. The artifact records the actual executable, Chrome version,
ANGLE renderer, CDP GPU device/feature information, graph-source SHA-256 and
in-memory frozen `index.json`/`planned.json` bytes and SHA-256 values. A browser
capability probe has confirmed `ANGLE Metal Renderer: Apple M1`, with accelerated
2D canvas, GPU compositing and rasterization enabled. Neither that probe nor the
concurrent smoke run is a controlled gate result.

All cases enable 13,574 nodes, 23,073 edges, all 13 fields, definitions and planned
items. Both themes run at 1,440 × 1,000 CSS px, DPR 1 and DPR 2, and at
3,840 × 2,160 CSS px, DPR 2. Each of those six contexts runs ten modes:

- Overview and detail continuous zoom: 24 RAF wheel inputs over two sinusoidal
  cycles, crossing the actual .13, .35 and 1.15 level-of-detail thresholds.
- Unselected hover and selected hover: 24 RAF pointer positions visiting eight
  real visible ideas, through the production hit-testing and tooltip handlers.
- Selected focus and fit: requested 600 ms production animations, measured until
  their exact logical target, followed by two RAFs for final paint submission
  and browser rendering.
- Overview, selected overview, detail and selected detail pan: 60 RAF inputs
  following a 32 × 24 CSS-pixel sinusoid after eight warm-up draws. A separate
  trusted browser pointer drag verifies the input path. Pan release discards
  the moving cache and performs an exact final paint.

That is 36 transition cases and 24 pan cases. Trusted wheel input also verifies
the zoom path. No canvas pixel reads occur during timing. Frame durations use
`performance.now()` after callbacks. Input-only cadence and cadence including
two drained RAFs are both retained. A final RAF after any delayed settle paint
is included in render-through latency. Frame counts above 20 ms accompany mean,
p50, p95 and maximum durations; raw results are retained rather than rounding a
sub-60 rate into a pass.

Each case clears both retained rasters before its cold setup. Cold CPU submission,
cold setup through two RAFs, first retained pixel count, moving draw timings,
post-input settle latency and final draws are separate fields. Every observed
combined extra-raster allocation must stay within 16,000,000 logical pixels and
8,192 pixels per edge; the oversized context must exercise the full-resolution
Canvas fallback. The bound excludes the main canvas, GPU copies, browser
internals and transient allocations, as in the existing renderer. Target and
candidate statements are cached or primed to empty strings in memory to isolate
handler/rendering costs; full statement-content layout is not timed. Request
failure/retry/layout semantics remain covered by the native correctness suites.

The team held native/heavy work and data builds while unrelated host processes
remained undisturbed. Host-load snapshots before/after the window are retained.
The artifact was written incrementally as `complete: false` until all sixty
cases finished. Slow cases remain measured failures rather than omitted passes.

## Controlled hardware results

[Immutable raw evidence](map-hardware-performance.json) contains all 60 cases,
source/data hashes, CDP capabilities, host captures, cold/settle/resource metrics
and the rejected prototype artifacts. The complete run used Chrome 155.0.8059.80
and the Apple M1 Metal renderer with accelerated Canvas/compositing/rasterization.
The team held browsers/heavy work and data builds. Unrelated `ffmpeg` remained
near 120% CPU in both endpoint snapshots; aggregate CPU idle was 62.9% before
and 70.1% after. AC power was connected. Memory was compressed, and GPU load was
not continuously measured. These results describe this host and bounded workload.

| Mode | 1440 DPR 1 | 1440 DPR 2 | 3840 DPR 2 |
|---|---:|---:|---:|
| overview-zoom | 50.5 / 50.3 | 50.3 / 50.3 | 23.4 / 25.0 |
| detail-zoom | 50.1 / 49.9 | 47.8 / 49.0 | 11.4 / 10.8 |
| focus | 60.0 / 60.2 | 59.8 / 59.9 | 56.5 / 58.6 |
| fit | 60.1 / 60.2 | 59.9 / 59.9 | 59.2 / 59.4 |
| hover | 60.0 / 60.0 | 60.0 / 59.8 | 45.8 / 47.3 |
| selected-hover | 60.0 / 60.0 | 60.0 / 60.0 | 59.9 / 60.0 |
| pan-overview | 60.1 / 60.0 | 60.1 / 60.0 | 18.7 / 18.5 |
| pan-overview-selected | 60.1 / 59.9 | 59.9 / 60.0 | 56.8 / 54.6 |
| pan-detail | 60.0 / 60.1 | 60.0 / 60.0 | 12.3 / 12.2 |
| pan-selected | 60.0 / 60.0 | 59.9 / 60.0 | 60.1 / 60.0 |

Values are mean fps including the two final drained RAFs, light / dark. Raw
input-only cadence, every >20 ms frame count, p95/max frame times and elapsed
render-through latency are also retained. Rounding near 60 here does not certify
that every input frame meets a 16.67 ms deadline. The tested-regime gate stays open:
normal continuous zoom is about 48–51 fps; oversized unselected zoom/pan and
unselected hover also miss the target.

Normal-viewport cold CPU submissions range from 6.5–48.9 ms and setup through
two RAFs from 22–112.9 ms. The oversized values are 4.8–35.9 ms CPU and
23–107.1 ms through two RAFs. These are separate from moving cadence. Normal
zoom render-through latency is about 681–700 ms including its 160 ms debounce
and exact settled paint. Normal focus/fit reach their final picture in about
649–650 ms. Oversized detail zoom takes 2.36–2.49 s; its 60-input detail pan
takes 5.14–5.16 s.

Combined retained rasters peak at 15,388,672 pixels, below the 16,000,000 cap;
the largest observed edge is 3,904 pixels. Every oversized case retains zero
extra raster pixels and exercises the direct Canvas fallback. Its main backing
canvas is 7,680 × 4,184 pixels; the main canvas and driver/compositor copies
remain outside the extra-raster cap. The resource bound is not a process/GPU
memory ceiling.

Hardware acceleration corrects the earlier broad inference about selected
transitions, while confirming remaining zoom/oversized failures. MASTER_PLAN
§4.4 therefore still calls for investigating a persistent WebGL scene backend
for these measured failures. The rejected edge-only prototype remains isolated.

## Isolated WebGL edge prototype

`assets/js/map-webgl-edges.js` and the test-only module rewriter in
`scripts/lib/map-webgl-prototype.mjs` leave production `graph.js` unchanged.
The experiment moves solid edge strokes into a WebGL 2 multisample stencil
buffer, tiled into the existing Canvas painter before its native nodes/labels.
Each style group colors its union once. This preserves the Canvas rule that
crossing/duplicated subpaths within one stroke do not accumulate opacity.
[HTML canvas stroke specification](https://html.spec.whatwg.org/multipage/canvas.html#dom-context-2d-stroke)
The requested stencil and antialias context attributes are checked, together
with the actual sample count and stencil bits; WebGL 2 requires those attributes
to be honored. [Khronos WebGL 2 specification](https://registry.khronos.org/webgl/specs/latest/2.0/#drawingbuffer)

Adaptive Bezier flattening has a .2-device-pixel centerline tolerance, independently
checked with dense polynomial evaluation, including loops and degenerate curves.
A stencil mask resolves overlap among the tessellated stroke triangles. GPU
mesh storage uses a 32 MiB LRU cap. One tile retains at most 4,000,000 logical
pixels, with 4× MSAA on the measured browsers. The logical tile cap does not
bound physical GPU memory: multisample color/stencil buffers, resolved images,
compositor copies and driver internals add allocations. This prototype does not
claim to preserve the production renderer's complete retained-memory budget.
Dashed strokes, resource-limit failures and unavailable/lost contexts fall back
to Canvas in paint order; restoration and destroy are tested.

Three analytic groups and four light/dark DPR 1/2 native groups pass. The native
fixture checks grouped crossing opacity, tiled boundaries, curve/cap appearance,
exact dashed/budget fallback, context loss/restoration and resource release.
The full-map Metal comparison has 28 states: overview, hover, selection,
selected-hover, detail, highlights and filters in both themes and DPRs. All
passed the existing mean-channel <2/255 and changed-channel <2% tolerances;
selected-hover and overview screenshots were inspected. Native labels and
separate focus/selection rings remain present. Close strong labels can overlap
in both renderers, as already documented for the original Canvas picture.

A matched concurrent full-Chrome/Metal diagnostic at 1,440 × 1,000, DPR 2, light
measured committed Canvas focus/fit/selected-hover at approximately
59.9/60.1/59.7 fps, while this prototype measured 9.0/10.4/2.6 fps. It bypasses the
existing Canvas raster/backdrop reuse, rebuilds tessellated visible groups during
motion and composites WebGL tiles into Canvas. The result is a material
regression. These diagnostic artifacts use identical frozen input hashes and
record their actual renderer; they are not quiet-window gate results.

The isolated prototype is therefore not integrated. The controlled hardware
measurements confirm remaining failures in the tested host/regimes, keeping the
MASTER_PLAN §4.4 scene-backend investigation open. An eventual WebGL replacement
needs retained geometry, low-copy scene composition and an explicit total
resource budget. The edge substitution has not demonstrated improvement.

## Independent integration check

The parent independently reran all three analytic groups, four native fixture
groups and 28 full-map Metal comparison states. All passed. The 28-state rerun
maximum mean channel difference was 0.650/255 and the maximum changed-channel
fraction was 0.00590, within the declared 2/255 and 0.02 bounds. The parent also
inspected paired selected-hover/dark/DPR2 and overview/light/DPR1 screenshots,
checked all 60 hardware cases, inventory/source hashes and resource/fallback
assertions, and verified that the historical measured values were preserved.
The overview comparison uses the tested local overview zoom and focus; it does
not certify a single screenshot of the complete world fit.

Independent logs: `/tmp/atlas-root-map-webgl-math.log`,
`/tmp/atlas-root-map-webgl-native.log` and
`/tmp/atlas-root-map-webgl-prototype-metal.log`. No production renderer or
source-review flag changed in this follow-up.
