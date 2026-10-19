# All-node map transitions and focus rebuilds

2026-10-19. This follow-up covers continuous zoom, selected-node focus/fit,
changing hover, and the oversized direct-render fallback. All runs enable
13,574 nodes and 23,073 edges, all 13 fields, planned items and definitions.
Every saved case records that actual inventory; the early method strings
mistakenly hardcoded 23,068 edges. This prose now follows the recorded cases.
Source hashes accompany each case; the later runs also hash both input JSON files.
The full MASTER_PLAN §7.3 60 fps gate remains open. These historical runs used
the default Chromium headless-shell launch configuration. A later probe of the
same binary and default configuration on this host reported ANGLE SwiftShader,
a software renderer. The original artifacts did not capture a GPU renderer ID,
so that historical identification is an inference from the matching probe.
The recorded failures establish limits of that test configuration; they do not
establish that hardware-accelerated Canvas fails the same gate. See the
[hardware protocol](map-hardware-followup.md) for the separate Metal assessment.
The complete measured snapshot is
[map-transitions-performance.json](map-transitions-performance.json).

## Changes and rendering limits

`assets/js/graph.js` reuses an unselected raster during a zoom only while the current
level-of-detail tier is unchanged, the scale ratio is between 0.6 and 1.8, and
the cached image still covers the viewport. Crossing a tier or leaving the
covered region rebuilds it. Zoom, pinch and animated focus/fit retain the exact
logical transform for hit testing. After motion stops, the map redraws at the
exact final transform. Moving text and markers may temporarily be scaled raster
images; the settled image is rendered at full device resolution. A moving
selected view draws directly into the main canvas at full resolution, then
builds its exact pan raster once at the end of motion. This avoids allocating
and copying a larger padded scene for every intermediate selected zoom step.

Hovering a different node from the selection separates the static dimmed graph from the colored
closure, labels and focus rings. Changing hover can reuse that backdrop, paint its new
foreground directly, and build the complete pan raster after 120 ms without a
new hover. A zoom settles after 160 ms without new wheel/key/button input.
Those delays and the additional exact paint are measured separately from the
interaction. A cold backdrop or a level-of-detail rebuild can still be expensive.
Selected views without a different hovered node use the original single-pass
drawing and one raster: their stable closure does not benefit from a separate
backdrop. If hover differs, the overlay retains both focus rings and labels.
Animation easing uses elapsed wall time at the callback, so an expensive earlier paint in the
same RAF does not prolong the transition using an already stale frame timestamp.

Both extra rasters share a 16,000,000-pixel budget (64 MB of RGBA pixels), with
an 8,192-pixel maximum edge. The padding shrinks to keep the hover pair within
that combined budget. An oversized viewport releases both caches and renders
directly at full resolution. This bound excludes the main canvas, GPU copies,
browser internals and transient allocations; it is not a whole-process memory
limit. The direct fallback preserves resolution and remains a slow mode.

World-space bins accelerate hover lookup while preserving the original weighted
distance, filter, ghost penalty and original-order tie rule. The 24 CSS-pixel
search radius covers the largest marker radius (11.2 px) plus the 12 px hit
margin. Source closures use an eight-entry LRU. Tooltip markup and dimensions
are reused until the item, name, statement, fonts or viewport changes. Filter,
selection, highlight, theme, font, resize and DPR changes invalidate the relevant
images. Destroy releases both images and cancels timers and animation frames.

The hover rendering composites the dim backdrop below the colored foreground.
All edges remain available; this is a layering change, not edge sampling. Fine
antialiasing overlap can differ from the former single-pass picture. The native
pixel comparisons and inspected screenshots below bound the resulting output.

## Measurement method

Run `node scripts/audit-map-transitions.mjs /tmp/atlas-map-transitions.json` for
60 input frames per continuous-zoom/hover case in both themes and three regimes:
1,440 × 1,000 CSS px at DPR 1 and DPR 2, and 3,840 × 2,160 CSS px at DPR 2.
`--baseline` selects the shorter 24-frame light-only comparison; `--graph=PATH`
serves a frozen source file. `--modes=focus,fit`, `--frames=12` and
`--regime=1440x1000@2` select bounded follow-ups. The source SHA-256, browser, CPU, timing summaries,
cache pixel peak and fallback status accompany each saved result. An incomplete
run is explicitly marked `complete: false`.
The final selected before/after comparison hashes `index.json` and
`planned.json` and checks their combined digest matches. The earlier zoom/hover
window recorded inventory and source hashes while data builds were held;
input-file digests were added for the targeted selected follow-up.

The zoom trajectory spans 0.06–0.20 or 0.5–1.8, crossing the actual drawing
thresholds. Browser-dispatched wheel and pointer events invoke the production
input handlers on requestAnimationFrame; a separate trusted Playwright wheel
checks the input path. Focus and fit use a real selected node and its side panel,
including the 180 px focus offset on wider screens. Their requested 600 ms
animations are measured through the exact final transform and its drained paint.
Two additional RAFs drain the final animation frame: its callback can schedule
the exact paint for the following frame, whose browser rendering must also
complete before the end measurement. The focused animation cases were rerun
with this stronger drain; earlier one-drain animation rates are superseded.
The benchmark fails if the logical target is not reached within ten seconds.
The final rendering drain is included in the recorded frame cadence. Hover visits eight
visible real nodes and verifies that focus changes. The timed target/candidate statements
are cached or primed to empty strings in memory so asynchronous detail fetches
and full statement-content layout do not enter the rendering timing; failed-request/retry behavior is covered by
the separate correctness suite.

CPU draw submission and wall-clock frame cadence are different measurements.
The latter uses `performance.now()` after callbacks and includes a drained final
paint, rather than relying on RAF timestamps taken before expensive work. A
small CPU submission time in the oversized fallback can coexist with slow frame
cadence because the browser must still render the submitted canvas scene.
Initial cold setup, the post-input settle period and its exact draw are reported
separately. They are not counted as completed 60 fps interactions.
`renderThroughMS` includes the interaction and any additional settle period.
It is reported alongside cadence, because more intermediate frames can still
take longer to reach the final picture.

Only matching 24-frame trajectories are used for before/after comparisons; the
60-frame runs are a separate longer stress workload. Timings describe this
headless Chromium run on this host, not every device or GPU. Other team browser
and heavy jobs were paused during the serial measurements. Unrelated host jobs
were left running; process snapshots record variable Python and system load.
The measured host was an Apple M1 with eight logical CPUs, macOS/arm64 and
headless Chromium 153.0.8010.12. During the original run, snapshots included
unrelated Python at 193% CPU and `duetexpertd` at 91%; a later revised-run
snapshot included unrelated `ffmpeg` at 106%. CPU percentages can exceed 100%
when a process uses more than one core. These samples qualify the timings;
they cannot correct the results to an otherwise idle machine.
The original graph source is reproducible as
`git show 150613a:assets/js/graph.js`; its SHA-256 is
`39d9c74d440994f4c36e6988b58a7589753e0f24b19fc3ab89e72ec1ec48f069`.

## Validation

`node tests/map-transitions.mjs` passes four theme/DPR groups. It independently
compares indexed lookup with the original brute-force distance calculation at
2,400 deterministic points per group: eight zooms, three filters, fractional
transforms and both near-node and arbitrary viewport coordinates. It also checks
wheel-anchor preservation, reuse within a drawing tier, rebuilding across a
tier, exact settled transform/image, backdrop reuse, the combined bitmap limit,
tooltip refresh after asynchronous statement changes, cancellation of an old
animation by manual zoom, single-pass selected drawing, completed animated
focus/fit, catch-up from a deliberately delayed callback with a stale RAF
timestamp, closure LRU size and destruction cleanup.
An asynchronous statement-failure regression verifies that changing the tooltip
message clears its measured dimensions, the next positioning call measures the
new DOM, and the taller error box remains inside the viewport.

The existing `node tests/map-rendering.mjs` and
`node tests/map-fractional-rendering.mjs` still pass, covering both themes,
filters/highlights, fonts, resize/DPR, selected paths, failed detail-request
retry, direct fallback, exact fractional settled panning and cache cleanup.
Composited pixel comparisons stay below a mean channel difference of 2/255 and
2% of channels differing by more than 20/255. Six existing UI groups also pass.

Native focus-layer screenshots show the colored focus/ancestor/descendant
paths, rings, labels, dimmed context and tooltip in both themes; the light and
dark DPR 2 images were inspected. Overview and fractional-rendering screenshots
were also inspected for layout and settled text clarity. Images are generated
in `/tmp/atlas-map-focus-layers-{light,dark}-dpr{1,2}.png`,
`/tmp/atlas-map-transitions-{light,dark}-dpr{1,2}.png` and the existing
`/tmp/atlas-map-fractional-{light,dark}-dpr{1,2}.png`.

`node tests/map-original-rendering.mjs` separately reads the immutable original
`_paint` method from commit `150613a`, verifies the full source hash above, and
injects that reference only into the test module. It freezes the input JSON
bytes and uses identical graph geometry, closures, fonts and transforms for the
two painters. This isolates rendering from graph-layout changes. Its 52 states
produce 104 original/revised comparisons: direct and actual cached display,
both themes/DPRs, two zooms, highlights, hover, selected focus and distinct
connected/unrelated selected rings. Selected direct output matches the
original up to floating-point arithmetic; hover decomposition has a maximum
mean channel difference of 0.0561/255. The actual cached display stays below
0.374/255 mean difference and 0.591% of channels differing by more than 20/255.
Both are within the established 2/255 and 2% bounds. The remaining differences
are raster positioning/antialiasing and the documented layer overlap.

Paired original/revised dark selected-hover and light hover images were inspected;
the separate selection/focus rings and labels remain present. Both versions
retain the original strong-label overlap in the deliberately nearby connected
pair stress case. The audit generates
`/tmp/atlas-map-original-{old,new}-{mode}-{light,dark}.png` and saves
its exact comparison metrics in the evidence JSON. Rerunning this historical
audit requires the pinned commit to be available in the local Git history.

## Matching before/after workload

These are the serial 24-frame light-theme runs of the original source and the
frozen revised source. Paint calls count the outer `_paint` invocation; a hover
foreground pass is counted even when it reuses the full dimmed backdrop. They
are observations under variable background load, not a statistical estimate of
performance on other machines.

| Regime | Interaction | Before fps | After fps | Paint calls, before / after |
| --- | --- | ---: | ---: | ---: |
| 1440 px / DPR 1 | Overview zoom | 17.2 | 30.6 | 24 / 7 |
| 1440 px / DPR 1 | Detail zoom | 17.6 | 34.6 | 24 / 7 |
| 1440 px / DPR 1 | Unselected hover | 19.1 | 46.5 | 24 / 23 |
| 1440 px / DPR 2 | Overview zoom | 1.4 | 5.1 | 24 / 7 |
| 1440 px / DPR 2 | Detail zoom | 5.0 | 12.9 | 24 / 7 |
| 1440 px / DPR 2 | Unselected hover | 0.7 | 3.6 | 24 / 23 |
| 3840 px / DPR 2 | Overview zoom | 0.9 | 1.0 | 24 / 24 |
| 3840 px / DPR 2 | Detail zoom | 1.4 | 1.5 | 24 / 24 |
| 3840 px / DPR 2 | Unselected hover | 0.6 | 0.7 | 24 / 24 |

The revised normal-view zoom/hover settling periods ranged from 139 to 448 ms,
with an additional exact draw up to 340 ms. The oversized detail-zoom settle
reached 1,081 ms even though its final CPU submission took about 4 ms. These are
visible costs and remain part of the open performance gate.

## Longer zoom and hover workload

The 60-event runs exercise the same two-cycle zoom trajectory more gradually.
They are separate from the matching 24-event comparison above. This code path
is unchanged by the subsequent selected-only raster/animation correction.

| Regime | Interaction | Light fps | Dark fps |
| --- | --- | ---: | ---: |
| 1440 px / DPR 1 | Overview zoom | 45.2 | 47.5 |
| 1440 px / DPR 1 | Detail zoom | 44.1 | 45.3 |
| 1440 px / DPR 1 | Unselected hover | 56.3 | 56.2 |
| 1440 px / DPR 2 | Overview zoom | 11.2 | 10.9 |
| 1440 px / DPR 2 | Detail zoom | 21.0 | 20.3 |
| 1440 px / DPR 2 | Unselected hover | 4.2 | 4.1 |
| 3840 px / DPR 2 | Overview zoom | 1.0 | 1.0 |
| 3840 px / DPR 2 | Detail zoom | 1.4 | 1.5 |
| 3840 px / DPR 2 | Unselected hover | 0.7 | 0.7 |

## Selected animation tradeoff

The intermediate two-layer selected renderer improved measured frame cadence
while increasing total render-through latency at DPR 2: focus took 1,951 ms
versus 1,400 ms for the original, and fit took 3,765 ms versus 3,359 ms. Its selected
setup could also take longer. That result motivated reserving the backdrop for
unselected hover and retaining the original single-pass selected rendering.
The final selected comparison measures both cadence and render-through duration
with the stronger two-RAF drain on one rebuilt graph snapshot.

## Final selected motion and changing hover

The final controlled old/new pass uses exactly the same frozen index/planned
bytes (combined SHA-256
`34f6cc7e59b274fe8036124c87a556bc501128bfd6e93d4ad52537f95fb0a6f2`).
It measures six original light-theme focus/fit cases and eighteen revised
focus/fit/12-event selected-hover cases in both themes. These durations include
the final browser render and any remaining settle period; cold setup is
recorded separately.

| Regime | Motion | Original light ms | Revised light ms | Revised dark ms |
| --- | --- | ---: | ---: | ---: |
| 1440 px / DPR 1 | Focus | 650 | 643 | 643 |
| 1440 px / DPR 1 | Fit | 719 | 685 | 693 |
| 1440 px / DPR 2 | Focus | 1405 | 1425 | 1439 |
| 1440 px / DPR 2 | Fit | 3176 | 2730 | 2614 |
| 3840 px / DPR 2 | Focus | 6385 | 6515 | 6656 |
| 3840 px / DPR 2 | Fit | 7561 | 7654 | 7858 |

Normal DPR 1 revised animation cadence is 47–48 fps. Normal DPR 2 focus remains
about 3.5 fps and fit 4.4–5.0 fps. Direct selected motion removes the large
intermediate offscreen draw: its DPR 2 focus CPU draw p95 is 117–119 ms, with
final cold selected setup still 606–614 ms. The 20 ms light-focus increase and
slightly slower oversized results remain visible; there is no universal
latency improvement claim. The oversized fallback still takes several seconds
to render through a requested 600 ms animation.

The prior single-pass selected-hover run and final backdrop run use the same
frozen dataset and twelve input positions, including initial rebuilds:

| Regime | Prior light / dark fps | Final light / dark fps | Final settle ms |
| --- | ---: | ---: | ---: |
| 1440 px / DPR 1 | 18.9 / 20.5 | 45.8 / 48.9 | 147–151 |
| 1440 px / DPR 2 | 0.8 / 0.8 | 3.6 / 3.6 | 341–351 |
| 3840 px / DPR 2 | 0.8 / 0.7 | 0.8 / 0.7 | 0 |

Normal DPR 2 selected-hover setup is still 1,012–1,040 ms, and an interaction
draw p95 still reaches 1,114 ms. Its twelve events and final settle take about
3,956–3,958 ms. Reusing a warm dimmed backdrop helps repeated hover changes;
clearing hover, returning to the selection, or invalidating the backdrop can
incur a fresh build. This is bounded evidence for that measured workload.

An earlier single-case direct-motion diagnostic measured normal DPR 2 focus at
1,415 ms after the quiet window had been released. It is retained under
`directSelectedDiagnostic` and explicitly marked uncontrolled; the final
controlled results above supersede it. The first window had variable unrelated
Python/system/video load; the final window's closing snapshot also shows three
unrelated Python processes at approximately 95%, 62% and 42% CPU. Team work was
paused, but the host was not an otherwise idle reference machine.

The final eight steady-pan cases still measure 60.00 fps at 1440 × 1000 / DPR 1,
with CPU draw p95 0.10 ms after warm-up. This excludes the cold builds and
transition costs measured above. Combined retained extra raster pixels never
exceed 16,000,000; the recorded hover peak is 15,388,672 pixels.

Timing source SHA-256 is
`2231de327f3371e5e01a516a7e3c2ae7a361ea232e982002b839366f553b1736`.
The final source is
`9a8850528193c87e97deba14a387bebff3215e9e67569c125cac265e061f94fc`:
its sole subsequent production change clears tooltip dimensions after an
asynchronous statement failure. Four native failure-layout groups and the
original-renderer audit pass against that final source. The successful-statement
timing path is unchanged; timings were not repeated for this error-layout fix.

## Remaining performance gate

The all-node 60 fps gate remains open. The DPR 2 rebuild, selected-transition
and oversized failures above apply to the recorded headless configuration;
the completed [controlled hardware follow-up](map-hardware-followup.md) now
separates those results from Apple M1 Metal acceleration. Normal hardware pan,
focus and hover are near 60 fps, while continuous zoom is about 48–51 fps;
oversized unselected motion is slower. MASTER_PLAN §4.4 therefore keeps the
scene-backend investigation open. The isolated edge-only WebGL prototype
regressed performance and remains outside production. This follow-up preserves
the historical baseline and independent original-renderer comparisons.

Parent verification independently reran the final transition/failure and original-renderer suites, then reviewed the renderer, measurement code, recorded datasets/latency qualifications and paired dark selected-hover images. The legacy raster/fallback and fractional suites also pass independently. Logs: `/tmp/atlas-root-map-transitions-final.log`, `/tmp/atlas-root-map-original-rendering.log`, `/tmp/atlas-root-map-rendering.log` and `/tmp/atlas-root-map-fractional.log`.
