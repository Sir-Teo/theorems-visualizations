# Independent offline audit: checkpoint12 current-light saved case

**PASS only for the saved fallback/protocol case. Optimized current-graph binding was not exercised.** I audited `/tmp/atlas-root-current-light-state` against immutable source stage `d7d07ed84da592a04c8c038ffc405d5b5607bfc0`, without a browser, server, redraw, timing or native rerun. Earlier failures and frozen checkpoint5 results keep their separate dispositions. This is not matrix, production, performance or lifecycle acceptance.

## Exact source and data boundary

The saved case uses checkpoint12 data at `/tmp/atlas-continuation/checkpoint12`, data commit `94a77908068d8c6a3be5fbe10808d0910195facf`, support-source commit `b6ca416f8b95b8e93bd12b9973ab0999f6519942`, and pinned manifest SHA256 `f142f4c464998520b45476d94432ee3c21ad7ad532f100fd9ed3c3499b2b01f3`. Its catalog has **13,574 nodes and 23,955 edges**. “Current” denotes that explicit frozen checkpoint, not subsequent content or live app state.

From my own exact Git archive, the pure `currentAtlasFixture()` re-read and verified the complete 2,179-file static path census, sizes, SHA256 values and commit marker, all 12 support-source files/three reference files, both generated 2,188-path served inventories, 68 font-source definitions and selected-shard specification. All these exactly match the saved manifest. Actual selected reachability is 10 full ancestors and 3,442 descendants; 365 LADR metadata rows/nine chapter summaries are pinned. The fixture, boundary, actual runner and manifest files also compare byte-exact with the declared stage directory. Source/importing these preparation helpers does not execute a renderer or server.

Index SHA256 is `0b32cdf702f2b2d9fab0d55d9f50975742beeebc14e5a29cfa56c69cd236dd3a`; planned SHA256 remains `9627cdd57f3131e3876efeeaf5ebe3d1f5d06f6450c1a104a6d1e028c1f8ebbd`. App, graph, atlas CSS and LADR source hashes are recorded separately in the evidence. The original and alternate use these current edges, not a cached checkpoint5 graph.

Chrome version is `155.0.8059.85`, with the runner's Metal launch configuration; light viewport 3840×2160/DPR2, map backing 7680×4184. A0–A3 each use W=3840,H=2092,k=.8,tx=1574.35,ty=−1071.0500000000002. Private e643 lifecycle repairs are not adopted by this static case.

## Whole transport, raw pixels and screenshots

All **998** recorded transport pieces independently pass SHA256, size, contiguous offsets and exact coverage, totaling **1,041,043,559 bytes**. Each of eight complete RGBA files has 123 pieces/128,532,480 bytes; each metadata file has seven pieces. Reconstructed metadata exactly equals its `complete.json` variant. The 984 raw pieces match the 492 actual successful POST request/response pairs per variant in order. The subsequent 14 metadata pieces are present in transport evidence but correctly absent from the earlier encoded network prefix.

All eight complete raw arrays are byte-equal, including original cold/warm ordinals A0 versus A1/A2/A3 and every corresponding original/chunk ordinal. Independently recomputed whole SHA256:

`7d92770cb067446ac7183c2df631f711483037c9cedc50c55b6befae2de2c822`.

Every pixel/channel of all 21 saved raw actual/reference/diff PNGs decodes to the correct vertically flipped source array. All seven complete diff buffers have zero RGB difference and opaque alpha; no acceptance masks or omitted alpha channels. Original/chunk complete GPU, direct Canvas and difference screenshots are themselves exactly equal, checked across all RGBA channels.

Independent full unmasked GPU/direct RGB metrics reproduce mean **0.5683512110453846 on the 0–255 scale**, fraction of RGB channels differing by **>20** levels **0.0020163411873273846**. Both variants satisfy the unchanged mean<2/channel-fraction<.02 gates. Additional disclosed any-channel pixel fraction is 0.002692268911328872; it does not replace the channel gate. GPU/direct are not identical: readable crops show heading/text rasterization/placement differences, in both variants.

I personally inspected all 27 complete saved images in five full-picture overview sheets plus 19 native 1280×1000 readable crops of both variants' GPU/direct/diff headings, dense LADR geometry, bottom controls, and one raw frame. They show matching original/chunk whole coverage and geometry; all raw difference pictures are black. The raw images' transparent background is not a dark-theme case. Crops are only inspection aids, never acceptance masks. Exact inspected view identities/hashes accompany this report.

## Actual per-frame binding and optional-resource chronology

These are independently extracted deltas of the chunk's actual before/after counters. Runtime `originalBinds` increments when it calls original `super.bind`; chunk/indices counters increment only after actual scratch upload and successful scratch binding. Every frame has zero optimized tiles, chunks, indices, empty optimized tiles, live replays and stale aborts:

| Frame | Original binds | Optimized tiles | Chunks | Indices | Complete main raw capture |
|---|---:|---:|---:|---:|---|
| pre-unselected-0 |125|0|0|0|none|
| pre-unselected-1 |125|0|0|0|none|
| pre-unselected-third |125|0|0|0|none|
| pre-selected-0 |13|0|0|0|none|
| pre-selected-1 |13|0|0|0|none|
| pre-selected-third |13|0|0|0|none|
| pre-selected-explicit-transfer-0 |13|0|0|0|none|
| pre-selected-explicit-transfer-1 |13|0|0|0|none|
| A0 |125|0|0|0|yes|
| A1 |125|0|0|0|yes|
| A2 |125|0|0|0|yes|
| A3 |125|0|0|0|yes|

The single optional metadata reservation succeeds during initialization: owner X1, 10,455,440 bytes, ledger event 5. Initialization later releases that owner at event 93, before reserving the 7,999,488-byte mask at event 94. The source's original-reserve-priority condition is supported numerically: 49,062,652 original +10,455,440 metadata +7,999,488 mask would require **67,517,580 >64,000,000** bytes. Dropping metadata leaves the original mask reservation at 57,062,140 bytes. Reset/first-before statistics already contain metadataCopies=1, metadataDrops=1, priorityDrops=1; no further per-frame drops occur. No scratch reservation is attempted; every frame and the final snapshot has optional bytes zero. This is original-priority fallback, not failed optimized pixel output.

Thus this result establishes the alternate's conservative fallback, actual source/input/protocol/history and budget behavior on this checkpoint. It provides **no corresponding raw pixel proof of optimized index binding on the 23,955-edge graph**. The five preceding selected draws have no captured main raw arrays and are not promoted to pixel cases. Older checkpoint5 optimized captures remain older evidence only.

## Readiness, complete histories and resources

Both contexts use exactly one actual LADR shard invocation/GET/200 under metadata digest `55200351eca693897e2cc51612710ee6f9a301534b4196004e3d533d6942a86f`. The selected `ladr-2.30` statement is available to the actual 33-role font census; all 14 explicit font requests and census records match across variants. Both own protected prefixes—33 callback events/four network events—are retained exactly and also match across contexts.

The complete ordered **7,493 renderer events** match, including initialization before fresh reset at 4904. All 12 draws finish with zero GL/read errors and exactly one draw-begin/end each. Map/scene/model/group/range-hash/loaded-count snapshots match. All three models remain live and budget-owned. The two prescribed cleanup transitions temporarily have a 1×1 GPU backing/full direct input before the next draw; every after-draw snapshot has the full ready GPU backing and one-pixel input Canvas.

Full callback arrays are **not** exactly equal: index 66, `loadingdone` during explicit-font-preparation at glyph index 2456, contains the same 14 FontFace identities/multiplicities in different order. All other events/fields match. That event follows protected prefix 33 and precedes quiet 77. No normalization is applied to claim array equality. Unchanged source gates require within-context prefix retention and unchanged quiet/tails, rather than cross-context full preparation-array equality. Both quiet intervals start/end at 77 with no callbacks; all external and metadata post-capture callback/renderer tails are empty.

Every classified ledger event, owner identity/count, component sum and frame resource bound was checked. The **447 original-classified reservation/release events are exactly equal** across variants. Original independent peak is **59,375,200** bytes, chunk logical peak **59,518,092**; final original/chunk retained bytes are both **57,483,620**, with no optional owners. The one optional reservation leaves original byte/owner counts unchanged. Original owners are not evicted or altered by it. Maximum mask is **7,999,488 pixels**, below the unchanged 8,000,000 cap by 512.

Logical budgets are not physical GPU-memory limits: each full primary drawing buffer is 128,532,480 bytes and each context's four raw diagnostic arrays total 514,129,920 bytes outside that ledger. Readiness diagnostic storage is separately original 8,918,317 serialized UTF16 units/537,380 reference slots/74,530 closure checks and chunk 8,933,110/537,380/74,530, under the unchanged 16-million-unit diagnostic limit; those units are not physical bytes.

## Evidence and disposition

Own offline methods/results: `/tmp/atlas-new-imaging-source/current-light-run-peer/{audit.py,audit.json,fixture-audit.json,chunk-frame-usage.json,finalize.py,views}`. Python uses the bundled runtime with hashlib, NumPy and Pillow, whole-file/whole-array comparisons, and no browser imports. Evidence records the complete run artifact inventory, transport groups, current source/input/served hashes, optional reservation/drop chronology, actual per-frame counters, callback difference and every personally inspected view hash. The empty sibling `.log` is recorded without inferring exit status from it.

Accept only this **one saved current-light fallback/protocol case** at its exact pinned source/data. No optimized current binding, current dark, new native lifecycle, matrix, production, timing or physical-memory acceptance follows. No production/shared/global/source-flag edits, fixture edits, source closure or browser rerun were performed.
