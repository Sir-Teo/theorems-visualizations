# Independent offline audit of failed timing screen

**The saved performance screen fails.** Independent arithmetic confirms original cadence10.961406713861612 versus curve7.593494906259625 requested draws/s, with `_draw` wall-duration p95 rising from4.299999952316284 to140ms. Correctness and timing-tail checks pass; that does not turn the final performance assertion into a pass.

Reviewed one immutable stage `51f12b83ad940b2af5476ba58827d7e72d6aaeff`, `/tmp/atlas-root-curve-timing-stage`, and saved `/tmp/atlas-root-curve-timing-state` plus sibling `.log`. Native ran once and exited1 at the final three-reason assertion: candidate below unrounded60, observed cadence regression, observed CPU p95 regression. `failure.json` equals persisted `performance-pending-assertions.json` plus the assertion fields; **no complete.json exists**. No watchdog, salvage or cleanup failure is recorded. No browser/server/native/model retry or extra variant was run by this peer.

| Whole untrimmed24-sample window | Original | Curve |
|---|---:|---:|
| Total elapsed ms | 2189.5 | 3160.5999999046326 |
| Mean interval ms | 91.22916666666667 | 131.69166666269302 |
| Interval p95 ms | 111.90000009536743 | 140.59999990463257 |
| `_draw` mean ms | 2.6333333055178323 | 131.06250001986822 |
| `_draw` p95 ms | 4.299999952316284 | 140 |
| `_draw` maximum ms | 5 | 167.29999995231628 |

I independently recomputed all24 differences from25 saved stamps, all24 single-call draw durations, elapsed totals, cadence24000/elapsed, sorted values and the fixed nearest-rank p95 at zero-based index22. No samples were removed, rounded for acceptance, reordered or normalized. These are an instrumented rejection screen's **callback cadence and `_draw` wall durations**, not GPU completion, presentation/display FPS or production throughput. `_draw` includes observers and possible synchronous GL waits.

Every sample retains its exact fixed active/ready/zooming state. Each has172 expected renderer events and exactly three intentional callbacks (request, RAF entry, scene draw), totaling4128 events/72 callbacks per variant. The validator's declared stage/draw-serial substitutions were checked against the A3 template; no other field differs. Both original correctness prefixes remain exact within each context, both drain phases are quiet, all post-timing/transfer/screenshot tails are empty. `_draw`/RAF restoration and observer-identity flags are true; deadlines are30,000ms from saved t0, untriggered, with no canceled/late frames. The exact source clears the scoped timer in finally and closes the owned browser before the final performance assertion. Saved flags support the normal completion path; no watchdog-failure path was exercised.

All24 curve draws have exact deltas **125 optimized tiles /152 chunks /1,741,699 indices**, zero fallback/replay/stale/metadata-drop/priority-drop. All collectors remain enabled. Full-case raw index streams and an unbounded low-level binding trace are not saved; counter semantics follow the pinned successful real upload/draw/error-check path. The correctness prefix also has positive optimized submissions; this is not fallback-only pixel equality.

Fixture/source reconstruction matches saved PREPARE, exact transformed served hashes and timing protocol pins. Current checkpoint12 remains13,574 nodes/23,955 edges at the pinned light3840×2160/DPR2 state. Independently verified **1010 transport pieces /1,054,711,197 bytes**, every offset/piece/whole SHA, all eight128,532,480-byte RGBA arrays and21 whole raw-comparison PNGs. All raw arrays are byte-identical SHA `7d92770cb067446ac7183c2df631f711483037c9cedc50c55b6befae2de2c822`, including original cold/warm and corresponding ordinals. All7493 correctness renderer entries and447-event original resource projections match exactly. Each context's protected shard/callback prefix is preserved; cross-context whole callback arrays are not claimed equal (font order and source-line stack differences remain).

Resource sums/caps and original-preserving optional attempts pass throughout saved ledger history and both timing-window endpoints: original peak59,375,200 bytes; curve logical peak60,216,360, retaining841,160 optional bytes; limit64M and mask≤8M unchanged. This logical accounting excludes diagnostic/driver/process memory. Full unmasked GPU/direct screenshots pass unchanged bounds: mean0.5683512110453846/255 and RGB-channel fraction>20 of0.0020163411873273846. I personally read all27 complete new pictures in five sheets plus seven native crops. Only offline audit views were generated; all raw/picture evidence remains unchanged.

The saved device is visible, Chrome155.0.8059.85, ANGLE Metal/Apple M1, eight logical CPUs. All four before/after snapshots show AC power,15G used, substantial compression and roughly79–230MB free. Load averages and CPU activity differ between windows; the original ran first. Order, memory pressure, GC, scheduling, observers and synchronous waits were not isolated. Neither these snapshots nor saved range-visit counts establish a cause for the regression.

Bounded evidence, every sample and method/view/file hashes are in `map-curve-timing-independent-imaging-evidence.json`; original raw/metadata remains at the run path. This preserves the exit1 result. It grants no timing success, lifecycle, matrix, production or Wave5 acceptance and initiates no optimization. All audit/browser/server jobs are closed.
