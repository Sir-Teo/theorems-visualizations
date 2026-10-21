# Independent audit of the saved selected-readiness paired case

PASS for the single saved run at `/tmp/atlas-root-paired-selected-state`, produced from immutable `f778d8ebf95df00fb6c2bb4cb506dd37e2728312`. This is an offline independent evidence audit, not another browser run, matrix acceptance, production acceptance, or performance result. Earlier stopped/failed attempts remain failures.

The case is Chrome `155.0.8059.85`, Metal launch configuration, light theme, viewport 3840×2160 at DPR2; the map backing is 7680×4184. The captured state has W=3840,H=2092,k=.8,tx=1574.35,ty=−1071.0500000000002, 13,574 nodes and 23,364 edges. Inputs are the exact frozen checkpoint5 fixture, not a claim about later accepted content. Independently invoking only the pure `pairedFixture()` source preparation from an exact revision archive reproduced all 107 input hashes, both 107-file generated served-source inventories, 68 font-face source definitions, and the selected-shard specification against `prepared.json`/`complete.json`. No route, browser, server, renderer or timer was started.

## Bytes and pictures

Independently recomputed all 998 transport-piece SHA256 values, exact offsets, contiguous coverage and full file sizes: 123 pieces for each of eight RGBA files and seven pieces for each of two metadata files. The 984 raw pieces also correspond in order to 492 actual successful POST request/response pairs per variant. The 14 metadata pieces occur after metadata encoding and therefore correctly do not appear in that encoded network prefix. Both decoded metadata files equal their variant's complete.json object.

All eight 128,532,480-byte complete RGBA arrays are byte-for-byte equal, including original A0 versus its A1/A2/A3 warm ordinals and each corresponding original/chunk ordinal. Independently recomputed whole SHA256:

`ea66776de451ea6c270235cbfc5ea9dfa22d1392de7e2b5f0de5166816bce5d7`.

Decoded every one of the 21 saved raw comparison PNGs and checked every RGBA byte against its complete vertically flipped source buffer. All seven comparison diff buffers have zero RGB differences and opaque alpha; no pixels or channels were omitted. The black appearance of transparent-background raw images in the viewer is not a dark-theme test. All three complete screenshot types—GPU, direct Canvas and their difference—are separately exactly identical between original and chunk, including all RGBA channels.

Independently recomputed the complete unmasked GPU/direct screenshot differences for both variants: RGB mean **0.4882011249867219 on the 0–255 scale**, fraction of RGB channels differing by more than 20 **0.0020204076043658383**. These satisfy the existing mean<2 and channel-fraction<.02 gates. The additional disclosed fraction of pixels with any RGB channel>20 is 0.0026940427820267687; it is not substituted for the channel gate. Direct Canvas is not pixel-identical to GPU: readable crops visibly show text rasterization/placement differences, particularly italic collection headings, in both variants.

Personally inspected all 27 saved complete images using five full-picture overview sheets, four full-coverage original-GPU tile sheets (the image tool scaled these), and 19 readable native 1280×1000 crops covering original/chunk GPU, direct and diff titles, dense LADR geometry, bottom controls, and a representative raw frame. These inspection crops never enter an acceptance metric or mask. Exact view paths/hashes are recorded in the evidence JSON. Full-picture overviews show the same graph coverage and blank left region; native crops show matching chunk/original dense geometry, text, boundaries and controls. All raw comparison difference pictures are black as independently proved over their entire arrays.

## Twelve-frame execution inventory

These are differences of the actual chunk `before.stats`/`after.stats`, not cumulative counts. `originalBinds` increments at the runtime's actual fallback `super.bind`; `chunks`/`indices` increment after actual scratch `bufferSubData` plus scratch-backed `super.bind`; `optimizedTiles` increments after a successful retained-index visit. Thus the captured main arrays really exercise optimized binding in this run.

| Frame | Original binds | Optimized tiles | Chunks | Indices | Empty optimized tiles | Main raw capture |
|---|---:|---:|---:|---:|---:|---|
| pre-unselected-0 |117|0|0|0|0|none|
| pre-unselected-1 |117|0|0|0|0|none|
| pre-unselected-third |117|0|0|0|0|none|
| pre-selected-0 |0|13|15|132163|0|none|
| pre-selected-1 |0|13|15|132163|0|none|
| pre-selected-third |0|13|15|132163|0|none|
| pre-selected-explicit-transfer-0 |0|13|15|132163|0|none|
| pre-selected-explicit-transfer-1 |0|13|15|132163|0|none|
| A0 |0|117|70|112334|47|complete|
| A1 |0|117|70|112334|47|complete|
| A2 |0|117|70|112334|47|complete|
| A3 |0|117|70|112334|47|complete|

Every frame has zero live replay/stale abort deltas. The three historical unselected preparation frames fall back completely. The five preceding selected commands are history/resource evidence, **not corresponding captured selected pixel cases**. A0–A3 are fractional-pan, unselected states; all four include 70 nonempty optimized tile visits and 47 empty optimized tile visits, zero original-bind fallback, and70 uploaded chunks. This bounded case does not establish pixel fidelity for the preceding selected states or every binding/fallback state.

## Readiness, callbacks and histories

The actual frozen loader is invoked once for LADR; one successful LADR GET/200 hydrates 365 metadata rows/nine available summaries under the pinned specification. The selected `ladr-2.30` statement is present at the actual font census. Both variants have matching 33 census roles and 14 explicit merged font requests. The exact selected-shard metadata digest is `55200351eca693897e2cc51612710ee6f9a301534b4196004e3d533d6942a86f`. Protected 33 callback events/four network events are retained exactly within each context and match between contexts. This explicitly uses the newly available-DOM preparation boundary; it does not rehabilitate older empty-DOM attempts.

All 7,493 ordered renderer events match exactly, including the complete initialization prefix before fresh reset at 4904. All 12 draws complete with zero GL/read errors and one draw-begin/end each; matching model, range hash, group, loaded-node/edge, scene and map snapshots are preserved. The two recorded pre-draw direct-reference transitions explicitly have a 1×1 GPU canvas and full direct-input canvas; every post-draw snapshot returns to the full ready GPU backing and one-pixel input canvas. These are source-prescribed cleanup transitions, not omitted history.

**Entire callback arrays are not exactly equal.** Both contain 93 entries, but index 66 is a `FontFaceSet.loadingdone` event during `explicit-font-preparation` whose 14 identical FontFace identities appear in different order. Every other callback entry and the event's other fields match. This is retained as an actual preparation-prefix difference, not normalized into equality. Source `prepareFixedQuiescence` requires a within-context unchanged quiet interval, not cross-context equality of the complete preparation callback arrays; the selected-shard prefix ends before this event. Both fixed quiet intervals start/end at 77 and contain no callback. All saved metadata/external post-capture callback and renderer-event tails are empty. The exact renderer trace and protected-prefix gates therefore pass without relaxation. No claim of full callback-array equality is made.

## Resources and limits

Audited every classified ledger event and all before/after frame snapshots: component sums, owner uniqueness, original/optional totals, monotone peaks and existing logical/mask bounds. The 447 original-classified reserve/release events are exactly identical across variants, including original independent peak 54,599,720 bytes. Chunk adds only packed-XY/bookkeeping 9,295,880 bytes and fixed CPU/GPU scratch 262,144 bytes. Its 353 optional reservation attempts comprise two successes and 351 false returns; every attempt completes without changing original byte count or owner count. They are not 353 allocations.

Original logical peak 54,599,720 bytes; chunk logical peak**63,895,600** under 64,000,000, headroom 104,400. Final chunk logical retained 62,471,764 bytes = 52,913,740 original + 9,558,024 optional. Maximum recorded mask 7,999,488 pixels is below 8,000,000 by 512. All three model owners remain live and budget-owned. This is the declared logical renderer ledger, **not a physical memory cap**: the full primary drawing buffer alone is 128,532,480 bytes and each variant's four diagnostic raw buffers total 514,129,920 bytes outside that ledger. Selected-readiness serialized diagnostic units are separately recorded and are not physical-byte measurements.

## Reproduction and disposition

Offline probe/source and image artifacts are under `/tmp/atlas-new-imaging-source/paired-run-peer`: `audit.py`, `audit.json`, `fixture-audit.json`, `chunk-frame-usage.json`, `finalize.py`, and `views/`. The Python audit uses the bundled runtime at `/Users/teodev/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3`. It reads only the frozen saved artifacts and uses independent hashlib, NumPy and Pillow comparisons. The evidence JSON records their identities, the complete saved artifact inventory, fixture/input/served hashes, each reconstructed file hash, per-frame binding deltas, the preserved callback difference, and exact inspected view hashes. The sibling run log is empty; no exit-status conclusion is inferred from it.

Accept this evidence only for the one saved paired case and exact source/input boundary above. No production/source flags, source closure, renderer changes, timing/FPS, matrix expansion, browser or server jobs were performed. Previous failures and the prior compositor performance rejection retain their original dispositions.
