# Current-light curve timing screen — preserved failure

The one instrumented matched pair **fails the predeclared performance screen**, after all runner correctness, resource and timing-path gates pass. Root ran exactly once from immutable `51f12b83ad940b2af5476ba58827d7e72d6aaeff`; exit 1 occurs only at the final performance assertion. [Independent saved-evidence review](map-curve-timing-independent-imaging-peer.md) at `44c10528c27d2470909055580b837e8110922a38` confirms the failure and all stated correctness/timing-path checks. This result stops wider cases and production adoption; it does not measure displayed FPS or establish a cause.

| Recorded metric | Original persistent scene | Curve candidate |
| --- | ---: | ---: |
| Requested samples | 24 | 24 |
| Window elapsed, ms | 2189.5 | 3160.5999999046326 |
| Observed RAF cadence, draws/s | 10.961406713861612 | 7.593494906259625 |
| `_draw` wall mean, ms | 2.6333333055178323 | 131.06250001986822 |
| `_draw` wall p95, ms | 4.299999952316284 | 140 |
| Logical retained / peak bytes | 57,483,620 / 59,375,200 | 58,324,780 / 60,216,360 |

All 24 untrimmed intervals and durations, including first samples and outliers, remain in `performance-pending-assertions.json` and `failure.json`. CPU p95 uses the fixed nearest-rank rank 23 / index 22. The candidate is below the unrounded 60-draw/s bound, regresses against the reference cadence, and regresses in `_draw` p95. There is no `complete.json`, native retry, reverse-order confirmation or wider state.

Root first integrated source/model proposal `2b15365a`, preserved its actual stalled-RAF deadline gap, then integrated finite-deadline/cleanup successors `3714fc1a` and `41b07a0b` plus focused evidence `7aebc06e`. [Independent source/model/PREPARE review](map-curve-timing-independent-peer.md) at `b30b11dd` accepts that exact closing chain. Root's Node 22 focused deadline and complete closing suites pass at `/tmp/atlas-root-curve-timing-deadline-model` and `/tmp/atlas-root-curve-timing-closing-model`. Earlier source/model failures remain preserved. All six workers explicitly acknowledged fresh quiet holds; root did no competing checks during the run and explicitly released all six holds afterward.

```sh
MAP_CURVE_TIMING_OUTPUT=/tmp/atlas-root-curve-timing-state /tmp/atlas-ci-node22-20261020/node tests/map-curve-timing-oracle.mjs --root-authorized-curve-timing-screen --quiet-window-attested
```

The stage is `/tmp/atlas-root-curve-timing-stage`; output and sibling `/tmp/atlas-root-curve-timing-state.log` remain intact. Original completes before the fresh curve browser opens. Both windows finish before their deadlines; no watchdog, canceled/late RAF, GL, page, salvage or cleanup failure occurs. Both browser processes and the server close. The source's timeout paths were tested with virtual models; this native run does not exercise a real timeout or process signal.

The unchanged 12-command prefix retains four complete main images per variant. All eight arrays are 128,532,480 bytes with SHA256 `7d92770cb067446ac7183c2df631f711483037c9cedc50c55b6befae2de2c822`; all cold/warm and corresponding comparisons are exact. The full direct-Canvas RGB checks still pass at mean 0.5683512110453846 and fraction above 20 of 0.0020163411873273846. Main raw captures precede the timed tail; screenshots, transfer, full snapshots and direct Canvas are outside the clock. No post-timing raw capture is added.

Each timing sample retains exactly one actual `_draw`, the full A3 renderer/glyph template and three ordered request/RAF/scene callbacks. Each variant has 4,128 exact matching timing renderer events and 72 callbacks. Strict post-tail and raw/DOM transfer tails are empty. Every curve sample submits exactly 125 optimized tiles, 152 chunks and 1,741,699 indices, with zero original binds, replays, stale aborts or drops. Source counters follow successful actual bind/GL checks; full timed-frame index arrays and an unbounded low-level GL trace are not retained. No extra pixel or index-stream acceptance is inferred from counters.

The original logical history has 447 exact matching events from zero ownership. All owner sums, components, peaks, three live models, one-pixel input Canvas, zero primary samples and 7,999,488-pixel mask satisfy the unchanged limits. Root independently reopens all 1,010 checked pieces / 1,054,711,197 bytes across ten complete files, all offsets/lengths/SHA256 and eight whole raw hashes, recomputes all 48 timing records and p95 values, and checks every saved resource snapshot/ledger sum. Audit: `/tmp/atlas-continuation/curve-timing-root-audit.json`. `failure.json` SHA256 is `6c2bacabd4c5a61c85b2a5882f1e664fdb9f29845a32348487f1eac90658ade6`.

Both contexts report Chrome 155.0.8059.85, visible pages and Apple M1 Metal with the same device/version strings, on AC power. Host snapshots show approximately 15G physical memory in use, substantial compression and 79–230 million bytes free; all original snapshot text is retained. The four diagnostic RGBA arrays retain 514,129,920 bytes per context outside the logical cap. Observer, timer-wrapper, driver/synchronous GL wait, scheduling, GC, memory and original-first order effects are not isolated. `_draw` is wall duration including observers and synchronous waits; RAF cadence includes sampler and scheduling cost. Neither is isolated CPU computation, GPU elapsed or actual presentation. Saved operation counts do not attribute the measured regression to a specific function.

The earlier independently accepted tiny and current-light correctness results remain valid at their stated scope. The S2 reference discrepancy, wider matrix, production/lifecycle and 60 FPS gates remain open. Production assets are unchanged. Wave 5 remains prepared and unstarted. Any next optimization or measurement needs a separate bounded proposal; this failure does not authorize another native run.
