# Actual-upload segment/tile operation and storage census

**The conservative count reduction is substantial, including normal single-tile views. Memory feasibility requires eliminating retained CPU group-index copies or falling back. This is not an implemented renderer or a performance result.** The diagnostic leaves original shaders, indices, GL bindings, scissors, MAX union, style order and endpoint culling unchanged. No index subset was submitted. No timings were collected.

## Frozen actual input and counts

The run uses immutable `/tmp/atlas-continuation/checkpoint5`, source **68aa4e24889ec290d8f90206c4441485389f7e26**, without modifying it. It verifies and routes index **c62d6beda2c317280aa99d107873d880a4b5c4fb6748113b8e9b45c5772cb1fd**, planned **9627cdd57f3131e3876efeeaf5ebe3d1f5d06f6450c1a104a6d1e028c1f8ebbd**, and generated atlas.css **792d9bdaa2e9978863ff78a42a5d5d87e084b9f8d810941de07def487ddff29f**. No stale inventory is substituted. Actual loaded graph: **6684 written +6890 planned =13,574nodes;23,364 directed edges;85collections/13fields**. Node and endpoint inventory hashes, independently reconstructed including written pdeps, are in `map-segment-mesh-census-input.json`; original source/helper/protocol hashes are also recorded. The complete frozen archive supplies remaining unchanged assets.

Full Chrome155.0.8059.85 uses the unchanged isolated scene. Both sizes use DPR2/light, k=.8 centered on ladr2.30; definitions, planned and all fields remain enabled. Selected rows select that node. Default tests ran concurrently elsewhere; no quiet window or timing result is claimed.

| Actual map CSS size | Focus | Active styles | Original submitted instances | Conservatively retained per tile | Removed |
|---|---|---:|---:|---:|---:|
|1440×932|none|18|270,068|24,327|90.9923%|
|1440×932|selection|3|289,759|26,777|90.7589%|
|3840×2092|none|22|2,700,820|112,786|95.8240%|
|3840×2092|selection|3|2,986,323|132,171|95.5741%|

These are group/segment instances, not unique edges. The normal rows have one tile: filtering removes off-screen parts of the **padded group inventory** even without repeated-tile submission. This corrects the earlier feasibility report's overbroad statement that a normal view cannot gain submission reduction. It has no *repetition* reduction but does have measured viewport filtering reduction. Oversized group inventories have452,627/497,893 distinct group instances before tile repetition. Respectively342,779/368,995 intersect none of their style's clipped output tiles.

The census evaluates each group segment once, then tests its enclosure against every original clipped tile:270,068/289,759/2,700,820/2,986,323 tile intersection tests. Retained counts include boundary-touching boxes and all uncertain cases. No uncertain/nonfinite case occurred. It does not apply a new CPU endpoint reject. GPU shader endpoint rejection is left unchanged, so counts may still include instances that the original shader later culls. Clear/composite rectangle areas are not reduced by this count-only experiment.

## Actual mesh enclosure, not ideal curves

Before the map census, `tests/map-segment-mesh-enclosure.mjs` passed **29,514 adversarial half/corner witnesses** with both caps, DPR1/2, .01/.8/16 scales, fractional phases, near-clamped joins, tile boundaries and uncertain/include fallback. The first draft of the test compared CSS corner coordinates with physical bounds at DPR2; that test-unit error was corrected by multiplying the independent reference by DPR. The retained passing test compares matching physical units. No renderer or acceptance bound was changed.

The diagnostic retains references to the actual Float32 arrays passed into `SceneEdges.upload()` and exact Uint32 arrays passed into `SceneEdges.group()`. It does not regenerate ideal Beziers or replace uploaded points. The original upload discards CPU references; the diagnostic's additional captured CPU ownership is reported separately below. Uploaded RG16F joins are enclosed by the adjacent representable half values around their actual Float32 upload inputs (including possible subnormal flush to zero). The model's maximum enclosed join component is **J=3.982421875** in every measured group. This is an actual upload-derived envelope, not the theoretical clamp10.

For each of the segment's two uploaded Float32 endpoints q, each side and endpoint flag, the shader's position has the form `q*k+t + j*outer*side + (jy,-jx)*extra - tileOffset`, with `outer=halfWidth+1/dpr` and `|extra|<=extension` (outer for round cap,1/dpr for butt). Thus every axis extrusion is at most **J(outer+extension)**. This is deliberately looser than per-corner joins and remains safe for both endpoint flags/interior joins. Antialias and dash logic only reduce fragments inside these triangles; ideal-curve flattening error is irrelevant to enclosing the existing mesh.

The helper independently encloses the complete corner expression, NDC division and viewport conversion with outward intervals. Input uniforms use their actual Float32 upload values. Basic operations enclose rounding and either fused/separate multiply-add; division uses four adjacent Float32 steps to cover its2.5ULP allowance. IEEE highp storage, arithmetic requirements and possible subnormal flushing are specified in [GLSL ES3.00 §4.5.1](https://registry.khronos.org/OpenGL/specs/es/3.0/GLSL_ES_Specification_3.00.pdf). Texture-half conversion is enclosed rather than presumed bit-identical to a guessed CPU rounding rule. Nonfinite, overflow or undefined division returns unknown, which includes the segment.

For full-map counting, the cheaper bound uses the transformed two-point AABB expanded by the same J radius, plus a conservative numerical envelope `128*2^-23*M` in CSS units and **one physical pixel**, then outward floor/ceil. M sums absolute endpoint products, translations, extrusion, viewport/tile scales and1. In these measured frames all uniforms/coordinates and intermediate values are finite normal-range values, DPR2 is exact, tile resolutions4096/2 and1953/2 are exactly representable, and homogeneous w=1. Each basic operation contributes at most one float spacing and each division at most2.5 spacings; fewer than20 successive scalar stages, viewport rescaling and possible FMA are dominated by the128-spacing sum-of-magnitudes envelope. It is a conservative diagnostic arithmetic envelope for these finite frames, not an unrestricted arbitrary-coordinate theorem. Values outside the proved finite domain must be included or use the full interval helper in a future implementation.

**453 sampled full interval-corner enclosures** (first/middle/last original segment per group/tile) are additionally checked inside the cheaper bounds, with no failure. Those samples do not replace the extrusion/numerical bound reasoning or certify every possible device. The small adversarial test and interval helper remain separately inspectable. No GPU half readback or actual alternate-index pixel-equivalence test was performed. An independent peer must assess the enclosure proof and diagnostic protocol before any implementation.

The original style rectangles and scissor partition are retained exactly. A prospective subset must include every segment whose conservative box intersects the actual clipped tile rectangle, replicate across boundaries, and leave the same MAX union and one color composite per style/pixel. No style reordering, partial-mask source-over or new endpoint rule is justified by this census.

## Exact current storage arithmetic and deficits

Current uploaded models have **1,644,999** points across three resident models; the authoritative per-model values are in raw JSON: edge.5 has444,859points/421,495segments, edge4 has1,161,473/1,138,109, bundles.5 has38,667/37,911. Packed x/y for the active detail model needs **9,291,784bytes**; all three need13,159,992. These packed arrays were not allocated by a new renderer: they are proposed representation sizes derived from actual counts.

| Case | Original logical GPU/native owners | Max filtered tile list bytes | + active x/y + one CPU/GPU scratch pair | + CPU original group-membership copies |
|---|---:|---:|---:|---:|
|normal none|49,552,336|41,548|58,927,216|60,007,488|
|normal selection|49,631,100|97,236|59,117,356|60,276,392|
|oversized none|52,913,740|105,968|62,417,460|**64,227,968**|
|oversized selection|53,094,804|201,084|62,788,756|**64,780,328**|

The final column exceeds64,000,000 by **227,968/780,328bytes** in oversized states, before additional metadata/object/staging/transient growth. Thus simply retaining the original group typed arrays is unsound under the stronger logical owner bound. The preceding column fits nominally but leaves only1,582,540/1,211,244bytes oversized. It must include global-J/range/owner bookkeeping and any replacement allocation; no cap increase or hidden extra store is authorized.

Those scratch capacities are the **counted filtered maxima**, not worst-case original group capacities. They require an initial count (then packing), or a bounded capacity strategy that falls back. A single-pass scratch sized to each full original largest group gives63,667,164bytes oversized unselected and **66,007,604selected**, exceeding64MB by2,007,604. Reusing an old smaller buffer while allocating a new one also adds transient ownership; release or reserve before growth and verify every stage. Orphaning/upload staging is not proof of zero additional memory.

An alternative retaining every filtered tile list totals451,144/528,684 GPU bytes oversized. With a CPU copy, active x/y and original CPU membership that totals64,918,320/65,435,528, again over64MB. Retaining only the current frame lists without original CPU membership is nominally smaller, but adds many owners and repeated upload/binding costs. Transform-history list caches are rejected; membership invalidates on camera, DPR/mask partition, width/cap/model and control changes.

Avoiding the original CPU membership copy requires independently regenerating its **exact existing inventory/order** from stable style IDs, model ranges and the original cached world coverage predicate (`WebGLMapScene.group`). It must reproduce the cached group's original typed-array hash, not silently use a fresh different visibility window. That adds CPU traversal and requires a correctness proof/test. Keeping metadata only for the active model must not evict required prewarmed GPU tiers. Missing CPU metadata should use the original full-group GPU path until ready.

The count-only instrumentation itself retains the **complete captured upload arrays plus CPU copies of all still-owned group index arrays**:40,598,480/40,677,244bytes normal and41,328,716/41,509,780oversized, in addition to the original logical owners. **This diagnostic retention is not a64MB production pass.** It exists to inspect actual inputs and is released when the scene/page is destroyed. Original GPU resource accounting remains unchanged and below64MB. Original primary framebuffer bytes, existing CPU path/range objects, worker construction arrays, deferred GC, driver upload staging and compositor storage remain separately excluded as in the old experiment; no process/physical-memory ceiling is claimed. A future candidate must count all newly retained CPU arrays and scratch explicitly rather than inherit this diagnostic capture.

## Disposition and evidence

The result supports a bounded correctness-only indexing experiment **if separately assigned**, with original full-group fallback on missing metadata, uncertain arithmetic or any reservation deficit. It does not authorize implementation, higher caps, benchmarks, or claims of faster frames. The large count reduction may be offset by CPU scans, exact membership regeneration, packing, uploads, synchronization and unchanged mask clear/composite work. Normal viewport filtering deserves equal consideration with oversized tile repetition.

Raw unchanged JSON: `map-segment-mesh-census.json`; input/additional source hashes: `map-segment-mesh-census-input.json`. Original output/log: `/tmp/atlas-map-segment-mesh-census.{json,log}`; math log `/tmp/atlas-map-segment-mesh-enclosure.log`. The explicit script, independent interval helper and adversarial test are committed. All four requested count states completed; browser/server closed normally. No original archive, prior failure, production file or shared renderer binding changed.

Subsequent independent peer `7da1da8c0743178f5ba25ad9cd86669a1c1c9a0a` endorses this bounded diagnostic and reproduces every raw result. Its separate half/corner and exact original-membership checks supplement the source reasoning. See [independent assessment and unchanged limitations](map-segment-mesh-census-independent-peer.md). No implementation or performance result follows.
