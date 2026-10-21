# Exact group re-enumeration and bounded scratch — read-only feasibility

**Existing borrowed arrays suffice to regenerate the exact original group index sequence without a retained CPU Uint32 copy.** This requires the original group's **saved coverage**, original path endpoints and original model ranges; current camera visibility or uploaded Float32 endpoints are not substitutes. A fresh count pass can establish a bounded filtered scratch maximum before allocation. Allocation failure must use the untouched original group buffer, without evicting original resource owners. No implementation, renderer binding, browser run or timing was performed.

The actual-mesh census **b5b680b8e1d4645bcf6508d49f8cf9f6d72e999c remains immutable** for independent review. This report adds no changes to its helper, protocol, raw output, bounds or claims. The proof below concerns index membership/order and scratch ownership; acceptance of its conservative mesh enclosure is a separate pending obligation.

## Source proof of identical membership and order

`assets/js/map-webgl-scene.js:83–90` is the complete group constructor. For a non-bundle style it traverses the caller's `ids` with `for...of`. For each ID it gets the existing `paths[id]`, first/last control points a/b, and applies this exact skip predicate against the newly saved `coverage`:

```
max(ax,bx) < coverage[0] || min(ax,bx) > coverage[2] ||
max(ay,by) < coverage[1] || min(ay,by) > coverage[3]
```

For every non-skipped ID it obtains `model.ranges[id]` and emits `range.startPoint+i` for i=0 through segments−1. Finally it stores that same coverage array and model on the group. No segment coordinate, join, cap, width, dash, group bounding box or shader endpoint predicate enters membership. The later model upload retains ranges (`SceneEdges.upload:61–69`) even though it discards point/join/instance CPU buffers.

Take a descriptor consisting only of borrowed references to **the same ids, paths, model.ranges and group.coverage**. Re-enumerate its outer loop and predicate verbatim, then its inner range loop. By induction over outer-loop positions, both traversals skip the same ID or append exactly the same contiguous ascending integer sequence. Appending equal sequences to equal prefixes preserves equal order, multiplicity and count. Zero-segment ranges append nothing in both cases. Consequently the complete emitted stream is identical to the original `new Uint32Array(indices)`, including any legitimate duplicates. No global deduplication or sorting is permitted. Original valid indices are nonnegative safe integers within Uint32; a future validator must refuse to optimize if those assumptions fail.

This is a source-level equality proof, not a claim that a new re-enumerator has been implemented or exhaustively tested. A separately assigned implementation should stream-compare against captured original construction bytes/hash at creation and after covered camera moves, without retaining that diagnostic copy in production.

### Which existing IDs to borrow

`controls:92–101` builds every style array by one ordered `map.edges.forEach`: visible IDs, per-source-collection arrays, ghosts, ancestors and descendants. `draw:116–128` supplies those exact arrays to group construction:

- `col:<collection>` → `byCol.get(collection)`;
- ghost → `ghostEdges`;
- gray → `visibleEdges`;
- up/down → `ancestorEdges`/`descendantEdges`.

The byCol map preserves first-seen collection order; each ID list preserves map.edges order. Ancestor/descendant/background groups may share an edge and must remain separate. `paths` is generated once in initialize:46 from that same static edge order; model.ranges uses the same path order through the worker/model builder. Borrow those arrays, not newly inferred node/edge order. Source edge IDs are array indices, not theorem-ID strings.

The far bundled path is direct and outside the proposed tiled optimization. If needed only for a generic membership diagnostic, its original `bundle:<id>` group bypasses the endpoint predicate entirely and receives a single ID. The temporary `[id]` argument is recreated each call; a borrowed synchronous reference is fine, or the existing group-map key identifies the ID. Do not retain arbitrary per-frame singleton arrays indefinitely. No bundle index redesign is needed here.

## Cache/control/lifetime cases

- **Covered camera-only reuse:** group85 returns the original object when model identity and saved world coverage contain the current required rectangle. The cache keeps the original padded inventory, even if the current view could select a smaller one. Re-enumeration must use `group.coverage` exactly, without recomputing pad/required/coverage from the new camera. Width/cap changes can affect tile filtering but do not change this group inventory.
- **Coverage miss:** group86 releases/deletes the old group, then builds a new one with a new saved coverage at87. A descriptor for the old group is invalid immediately; borrow the new coverage/model/IDs and recount. Never retain a list across that transition.
- **Control change:** controls95 releases and clears all groups **before** controls98 replaces any ID arrays. Its key includes definition/planned/field visibility, highlight contents, focus and selection IDs, theme and ink. Therefore no live original group bridges a legitimate control-generation change with an old ID-array owner. A future descriptor must share this invalidation, not keep old arrays alive through a group back-reference. The graph/paths/model ranges are static within a scene generation; map recreation handles a different underlying graph.
- **Model replacement/release:** group85 checks exact model identity and released status; draw cleans released-model groups at110. A matching fidelity number alone is insufficient. Metadata and descriptors need model object identity plus scene generation; drop them on release/eviction/reconstruction. An old range array can remain readable through a JS reference after GPU release but must not be used for the replacement texture.
- **Context loss, restore or destroy:** disposeResources releases groups/models, terminates worker, clears maps and increments generation. Every borrowed descriptor and count proof expires. No promise/worker callback may retain and later submit a previous generation's IDs/ranges/metadata.
- **Empty/degenerate group:** zero counts/zero-segment paths stay empty exactly. Keep the original group filtering/style traversal; do not allocate a full scratch just for an empty list. Endpoint equalities are included because the constructor skips only strict inequalities.

The saved-coverage predicate uses **original JavaScript path endpoint values**. It is intentionally different from the shader's current-view endpoint culling with a50px margin. The latter stays enabled after submission. Applying it during membership reconstruction could remove indices that were in the original buffer, alter ordering/count evidence and disagree near Float32 boundaries. It must not be substituted, even if final raster output might happen to agree in an example.

A synchronous per-frame descriptor may borrow current group, IDs, paths, ranges and coverage with O(active-style-count) references; it needs no O(segment-count) index array. It must not survive an await/yield/control event without validating the generation token and all owner identities again. The current line/group call already has the ID array, so a tiny ephemeral descriptor lookup can capture it before union. Alternatively inspect the existing groups map/style key; do not guess style from color/width. Persistent back-references require explicit clearing on every group release and controls invalidation, or they would extend old array lifetimes. A descriptor should not keep an otherwise evicted model alive as uncounted CPU metadata.

## Fresh count → reserve → pack protocol

A fixed census maximum is evidence for that exact frame, not a lifetime capacity. For every eligible current frame:

1. Freeze a synchronous snapshot of scene/control/model/group identities, original saved coverage, current view/style/cap, original mask partition/scissors and the independently accepted conservative-bound rule. Use the exact re-enumerated membership stream. Count filtered instances for **every current style/tile** without materializing a full index list. Record only C, the maximum count; scalar/per-style bookkeeping is enough. Unknown arithmetic includes the segment. If count overflows a safe integer, stop optimization.
2. After all original required resource sizes are known, compute the incremental logical ownership for active packed x/y metadata, **CPU Uint32 scratch4C and GPU scratch4C**, plus declared bookkeeping/reservation owners. Existing original group buffers remain available. CPU metadata/scratch must count explicitly, although the historical scene cap excluded existing CPU paths/ranges. No full-original-group capacity, all-model metadata, hidden staging copy or geometric over-allocation is implied by4C.
3. Reserve **before** allocating or growing. If existing scratch capacity exceeds what fits a changed resource configuration, release or shrink it; do not treat an old peak capacity as free. Growth must account for old+new coexistence, or explicitly release old CPU/GPU owners before creating replacements. This can sacrifice previous scratch reuse, not the original geometry tiers. A failed allocation leaves the original pipeline usable.
4. Re-enumerate and filter each tile into the fixed CPU scratch, preserving original order. No JS `push` array or full Uint32 membership copy is allowed as a convenience intermediate. Verify actual packed count≤C. If the same frozen count rule/inputs are used, equality with its count is guaranteed; a mismatch indicates a bug or expired snapshot and must fall back. Reusing the GPU scratch requires an explicit no-orphan/no-unaccounted-capacity storage policy and resource evidence. Buffer update/synchronization cost remains unknown.
5. Any uncertain/missing metadata, stale identity, insufficient reservation or count/pack discrepancy uses the **unchanged original group buffer for that original tile pass**, preserving its shader, scissor, MAX clear/coverage and single composite. Decide before submitting any partial subset to that tile. If fallback occurs after a subset has touched its mask, clear and replay the complete original tile before compositing. Do not run a whole-group/whole-frame color composite on top of already composited tiles; that would double opacity. Device/context failure uses the original complete Canvas fallback path rather than a partially displayed GL frame.

Two-pass counting/packing means repeat CPU traversal. Reconstructing the membership stream itself also repeats its original edge endpoint/range tests. This avoids retained membership bytes, not CPU work. Async worker preparation and transferring packed metadata need their own reserve-before-allocation/cancellation/peak ownership protocol; borrowing ranges does not make the9.3MB coordinate array disappear.

## Budget allocator caveat and actual frame arithmetic

`SceneBudget.reserve` at `map-scene-gl.js:20–27` first releases the requested key, then evicts *other* entries marked evictable until it fits. Passing `{evictable:false}` for a new scratch owner only protects that owner afterward; it does **not** prevent eviction of inactive original prewarmed geometry during reservation. That could reintroduce cold fallbacks and change established behavior. An exact no-regression fallback protocol needs a **no-eviction headroom precheck**, plus accounting for all new CPU owners, before calling this allocator. The precheck and reservation must be synchronous with no intervening allocation; otherwise a separate non-evicting reservation operation is needed in a future isolated candidate. No shared allocator edit is authorized here.

Original font atlas storage is fixed/reserved during ScenePainter construction (`map-scene-painter.js:91`, `map-scene-text.js:10–11`), but mask/model/group allocations can change on viewport/control/fidelity transitions. Count and reserve against the actual current owners after those required transitions; a stale prior-frame total is insufficient. Releasing scratch on failure must not release original groups/models or consume the resources needed by the fallback path.

The immutable census's exact maxima imply the following **minimum exact-capacity pair sizes**, conditional on its pending enclosure acceptance:

| Frame | C instances | CPU+GPU scratch8C | Original logical owners + active x/y + pair |
|---|---:|---:|---:|
|normal none|10,387|83,096|58,927,216|
|normal selection|24,309|194,472|59,117,356|
|oversized none|26,492|211,936|62,417,460|
|oversized selection|50,271|402,168|62,788,756|

Active x/y contributes9,291,784bytes. Avoiding retained CPU membership removes the census's oversized227,968/780,328-byte deficits; nominal remaining headroom is1,582,540/1,211,244bytes. Those totals exclude any new bookkeeping, replacement coexistence or metadata-preparation copies, so they are **not allocation acceptance**. Using a full original-group scratch instead would reach66,007,604bytes in selected oversized and is rejected. Growing by a multiplier or retaining stale max capacity can also fail even if a fresh exact4C pair fits. All-tile list/history caches are outside this bounded design.

## Disposition

There is no source-level impossibility: stable existing edge-ID arrays, paths, saved coverage and ranges contain all information needed for the exact original index stream, including cache reuse. New persistent reference lifetimes can be avoided with synchronous borrowed descriptors and normal invalidation. The remaining hard obligations are independently accepted mesh enclosure, an exact stream comparison, bounded active-model metadata preparation, non-evicting reserve-before-growth and safe original per-tile fallback before color composition. CPU repetition and upload synchronization remain unmeasured. No performance or production-readiness claim follows.

If separately assigned, the next smallest diagnostic would compare streaming count/hash with actual original buffers at creation and covered reuse, exercise boundary/control/model-generation transitions, and model every allocation/fallback stage using the exact current resource snapshot. It should not change a binding or submit subsets until those proofs pass. Questions about the immutable census were coordinated directly with deep_peer; this report does not modify its review target.
