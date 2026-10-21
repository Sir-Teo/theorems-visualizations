# Independent saved current-light curve case audit

**PASS for this one pinned current-light case.** All eight complete raw arrays are byte-identical; the four main curve frames actually exercise the optimized branch with positive submissions and zero original fallback binds. This accepts saved correctness evidence for one state only, with the callback and submission-observation limits below. No browser rerun was performed.

## Exact provenance and raw evidence

Stage: `148407f0511684acd86de70a01fecd6b63c4cdc1`, `/tmp/atlas-root-curve-current-stage`. Saved run: `/tmp/atlas-root-curve-current-state`, sibling `.log`. Independent work: `/tmp/atlas-new-imaging-source/curve-current-peer`. The private curve implementation is `f8eb0b366bb98ff906315469f9cc022089f73465`; data is checkpoint12 `94a77908068d8c6a3be5fbe10808d0910195facf`, support source `b6ca416f8b95b8e93bd12b9973ab0999f6519942`. The actual loaded count is **13,574 nodes / 23,955 edges**, with definitions and planned items enabled.

I reconstructed the fixture from an immutable Git archive: all 2,179 base-file hashes, both exact transformed served-source maps (2,191 files each), font sources, selected-shard specification and source-transform records equal the saved manifest. This is the pinned current dataset, not the earlier frozen checkpoint5 case. The actual state is light, viewport 3840×2160/DPR2, map W3840/H2092, k0.8, tx1574.35, ty−1071.0500000000002; raw backing is 7680×4184.

Independently verified **998 transport pieces / 1,041,157,631 bytes**, each offset/length/SHA and complete concatenation, across eight RGBA files and two metadata files. Every raw file is 128,532,480 bytes with SHA-256 `7d92770cb067446ac7183c2df631f711483037c9cedc50c55b6befae2de2c822`. Complete byte comparisons additionally verify original A0/A1/A2/A3 cold/warm history and each corresponding curve ordinal. No channel, including alpha, differs.

All 21 saved raw-comparison PNGs decode exactly to their full vertically flipped RGBA arrays, including the seven opaque zero-difference images. No mask/crop enters acceptance. Both complete GPU screenshots, both direct-Canvas screenshots and both complete differences match across variants. Independently recomputed unmasked direct metrics for each are mean **0.5683512110453846/255**, RGB-channel fraction above20 **0.0020163411873273846**, passing the unchanged mean<2 and fraction<0.02 limits. The separately disclosed pixel fraction with any RGB channel above20 is 0.002692268911328872; it is not substituted for the protocol's channel statistic.

## Per-ordinal optimized use

These are counter **deltas for each draw**, not cumulative totals or unique logical-edge counts:

| Exact ordinal(s) | Optimized tiles | Submitted chunks | Submitted indices | Original binds |
|---|---:|---:|---:|---:|
| pre-unselected-0 / 1 / third, each | 125 | 152 | 1,758,720 | 0 |
| pre-selected-0 / 1 / third / explicit-transfer-0 / explicit-transfer-1, each | 13 | 66 | 1,913,210 | 0 |
| A0 / A1 / A2 / A3, each | 125 | 152 | 1,741,699 | 0 |

All twelve draws have zero empty-tile, live-replay, stale-abort, metadata-drop and priority-drop deltas. The main four successful positive submissions meet the unchanged chunk bound (each chunk at most32,768 indices). Unlike the earlier packed-index current run that fell back, the curve main pictures therefore correspond to active optimized submissions.

The exact source flush calls real `bufferSubData`, invokes `Original.bind` with the scratch buffer and count, checks GL error, then increments chunks/indices. Optimized tiles increment only after full traversal and live-snapshot checks. I checked this pinned source correspondence and every frame's counter delta. **The full case saves counters plus only a rolling32-entry tile-event log, not raw submitted-index arrays or an unbounded low-level GL binding trace.** Thus I do not claim independent byte reconstruction of this full case's index streams. The preceding separate tiny native cohort saved such arrays; it does not manufacture missing full-case records. Selected preparation draws have no corresponding saved main raw capture and are not extra pixel cases.

## Trace, callbacks and preparation

Both complete renderer traces have exactly **7,493 entries** and are exactly equal, without normalization. All twelve frames have one draw-begin/end pair, successful GL/read errors, equal protected map/scene/model/group/range/loaded state, and live budget-owned models. Capture starts at renderer index4904 and ends7493. All post-epoch renderer histories and callbacks during raw transfer and later screenshot capture are empty. Raw POST order exactly matches the captured callback network records; the seven metadata pieces per variant follow serialization, so those14 later pieces are correctly absent from the encoded network snapshot and present in the transport ledger.

Each context has93 callback events, quiet start/end77, the exact macro/RAF/RAF/macro preparation schedule, 14 font requests and33 census rows. LADR2.30 is loaded exactly once by the actual shard loader; saved metadata SHA and the before/invoke/settled/hydration order agree, and available statement content is used by the font census. Each context's33-event/four-network protected prefix is retained exactly in its own callback record.

The **entire cross-context callback arrays/prefixes are not equal**. Font-face order differs at events1 and66, with identical face multiplicities. Eleven other events differ only in saved stack strings: adding the curve accounting import moves the relevant `map-webgl-scene.js` line numbers by one. Full original/chunk strings and all13 differences are preserved in the evidence. No array was normalized into claimed equality. All differences precede quiet boundary77; later events agree. The required gates enforce each context's own protected prefix and quiet/post-capture behavior, exact renderer trace and original resource history; they do not require whole cross-context callback-stack/font-order equality. These disclosed differences therefore do not waive a required gate.

## Resource history and personal pixels

Original-classified reservation/release histories are exactly equal from empty budget:447 original events in each variant. Curve has two additional, separately classified reservations: **579,016 bytes curve bounds/mapping** and **262,144 bytes fixed CPU/GPU scratch**. Both remain owned, totaling841,160 optional bytes, with no optional release/drop. Their attempts preserve original bytes/owner count. Every ledger snapshot's original/optional sums, unique owners, history-from-zero marker and logical limits were checked.

Original peak is59,375,200 bytes in both original projections. Curve logical peak is**60,216,360**, retained58,324,780 (57,483,620 original +841,160 optional). Logical limit remains64,000,000, mask stays≤8,000,000 pixels, and components sum exactly. Primary samples are zero and primary input canvas is1pixel in successful GPU snapshots. The 514,129,920-byte four-array diagnostic storage per variant and primary GPU drawing buffer remain separately reported; the logical cap is not a physical/process-memory cap.

I personally inspected all27 complete saved PNGs in five whole-picture sheets and19 readable native1280×1000 crops, covering original/curve GPU, direct Canvas, differences, main raw output and original history comparisons. The visible direct difference concentrates prominently at text and also contains faint edge differences, within the full unmasked bound. Raw PNGs are transparent GL output, not screenshots of a dark theme. Inspection crops never mask a numerical gate. View hashes, complete output inventory, both audit methods and exact callback differences are in `map-curve-current-run-independent-imaging-evidence.json`.

Saved Chrome version is155.0.8059.85; the pinned runner launches ANGLE Metal. This review makes no additional driver portability claim. The closed-world no-writer style/path premise remains required: deliberately injected same-count ID/path mutation failures are unsupported. No lifecycle, FPS, timing, matrix, production acceptance or new native experiment follows; all prior failed attempts remain failures. Only independent report/evidence files are committed, and all browser/server/offline heavy jobs are closed.
