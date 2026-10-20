# Isolated GPU edge operation census

A bounded non-timing diagnostic on frozen checkpoint6981ce3 input confirms that per-style scissoring is already active. Actual GL scissor arguments and per-tile coverage bindings match the source-derived rectangles in all four draws. This does not measure GPU cost, establish picture equivalence, improve production or pass the60fps gate. Concurrent unrelated correctness work continued. Independent review of this diagnostic is pending.

| CSS viewport | Focus | Active groups | Distinct group segment instances | Submitted across tiles | Clear pixels | Composite pixels |
|---|---|---:|---:|---:|---:|---:|
|1440×932,DPR2|none|18|251,266|251,266|75,329,541|75,329,541|
|1440×932,DPR2|selection|3|270,133|270,133|10,796,240|10,796,240|
|3840×2092,DPR2|none|22|432,239|2,579,756|422,936,387|422,936,387|
|3840×2092,DPR2|selection|3|476,457|2,857,707|64,325,840|64,325,840|

“Distinct group” does not deduplicate a segment occurring in more than one style; the selected ancestor/descendant/background passes may legitimately reuse segments. Submitted instances count the actual per-tile bind calls; shader rejection can avoid raster work after vertex submission. Clear/composite counts are logical rectangle pixels, not shaded fragments, bytes, durations or hardware work estimates. The oversized view submits about6times its distinct group segment inventory; the normal view submits each once. Broad groups still cover much of the viewport despite valid scissoring. These counts distinguish repeated submission from the formerly unsupported claim of missing bounds, but cannot identify which dominates GPU time.

The exact snapshot has13,574nodes and23,258edges, definitions/planned enabled, all13fields, k=.8 centered on ladr2.30; selected states use that node. All four states have identical node-ID and endpoint hashes. Frozen index SHA256 `e30edc52e17812418a9aede80b7842380749c377939762eecc2468eaea20ab42`; planned `9627cdd57f3131e3876efeeaf5ebe3d1f5d06f6450c1a104a6d1e028c1f8ebbd`. Full Chrome155.0.8059.85 with ANGLE Metal was used solely to exercise actual GL calls.

Reproduce explicitly with `node scripts/audit-map-scene-area-census.mjs OUTPUT_JSON FROZEN_DATA_DIR`. No files in the frozen data directory are modified. Source/data hashes and every active group's bounds, segment counts, tile count and area are in [raw census](map-scene-area-census.json), SHA256 `d6bff5c4ab8cb4a23007ffc703a939edad14fbb0bc9bb7f01d183a355e61d2b8`. Original output/log: `/tmp/atlas-continuation/map-scene-area-census.{json,log}`. Production graph SHA remains `9a8850528193c87e97deba14a387bebff3215e9e67569c125cac265e061f94fc`; only a test route wires the isolated scene. All browser/server processes closed.

Before any spatial reduction, conservative segment bounds must enclose actual quantized meshes/antialias support, and disjoint output cells must preserve complete same-style MAX coverage and style order. No performance implementation or benchmark is proposed as accepted by these counts. See [source-path audit and conservative bound obligations](map-gpu-scissor-readonly-2026-10-20.md).
