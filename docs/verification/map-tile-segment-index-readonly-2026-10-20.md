# Per-tile segment indices — bounded read-only feasibility assessment

**Geometrically feasible, but only conditionally justified for multi-tile draws. Reject an all-model retained-bounds/all-tile-buffer design under the current memory discipline.** A small active-model metadata cache and one reusable per-tile index buffer could preserve the current picture while reducing repeated vertex submissions. Current evidence does not establish CPU/upload affordability or a GPU-time benefit. No implementation, browser run or benchmark was performed.

This is distinct from the already rejected “missing group scissor” hypothesis: the existing scissors stay unchanged. It is also distinct from both rejected Canvas compositors. Production and all saved experiments remain untouched.

## Actual path and evidence

`assets/js/map-scene-edges.js:78–82` binds one Uint32 first-point index per segment and submits the entire group's `count` for every intersecting mask tile. `union:93–103` already clips each style to its rectangle, tiles that rectangle, clears R8 under a scissor, uses MAX for same-style coverage, then composites that style once over each disjoint output tile. Per-tile index subsets are not currently implemented. The far bundled branch is direct (`map-webgl-scene.js:121–122`); leave it alone.

The accepted non-timing census (`map-scene-area-census.md/json`, coordinator checkout) uses frozen checkpoint6981ce3 input:13,574nodes/23,258edges, indexe30edc52e17812418a9aede80b7842380749c377939762eecc2468eaea20ab42, k=.8, DPR2. Its repaired fixture freezes atlas.css792d9bdaa2e9978863ff78a42a5d5d87e084b9f8d810941de07def487ddff29f. Normal unselected submits251,266 group instances once; oversized unselected submits432,239 group instances2,579,756times across tiles. Oversized selected totals476,457/2,857,707. These are instance counts, not unique physical edges or GPU durations.

Normal's single tile cannot gain fewer per-tile submissions from this optimization. Oversized has up to2×3tiles. A segment intersecting just one tile could be submitted once instead of six times, while a segment crossing tile borders must be submitted to every affected tile. The census contains no per-segment intersection counts: the achievable reduction is unknown. Clear/composite rectangle pixels remain unchanged by merely filtering segment instances, except that an independently proven empty group/tile can skip both operations. No fill-cost reduction is assumed.

## A conservative actual-mesh bound

The vertex shader at `map-scene-edges.js:20–27` uses **uploaded Float32 point coordinates** and **sampled RG16F join components**. For one segment's endpoints q0,q1 and their sampled join vectors j0,j1, its four vertices are:

```
p = q*k + (tx,ty) + j*outer*side + (jy,-jx)*extra - tileOffset
outer = width/2 + 1/dpr
side = -1 or +1
extra = -extension, 0 or +extension
extension = roundCap ? outer : 1/dpr
```

The actual endpoint flag in point.w chooses extra, and all four corners determine the two triangle-strip triangles. The union of their axis-aligned corner bounds encloses the triangles. Fragment cap/dash/AA calculations only reduce coverage inside that mesh; they create no fragments outside it. Therefore filtering on a conservative enclosure of these vertices preserves the existing shader output. **No Bezier flattening error needs adding when bounding the actual uploaded polyline mesh**; it would be necessary if replacing this with ideal-curve bounds.

Do not use unquantized path control points or recompute tangent/miter normals independently. CPU Float32 points are known before upload. FLOAT→RG16F conversion and shader uniform/arithmetic precision need an outward interval treatment: enclose both adjacent representable half values for each uploaded join component unless exact device conversion has independently been established. Use the actual quantized transform/DPR uniforms, or conservative intervals covering their upload rounding. Bound multiply/add/tile-subtract and NDC conversion error before outward rounding to physical pixel cells; include a rasterization guard. JS Float64 evaluations plus an unexplained fixed epsilon are not a proof.

A simpler safe enclosure avoids retaining every individual join: scan the actual Float32 upload joins once to obtain a finite component maximum, enlarge it to a conservative half-conversion envelope J. For each segment use the AABB of the two actual Float32 center points transformed to screen and expand each axis by `J*(outer+extension)` plus the numerical/raster guard. This covers both sides and all possible endpoint extensions; it is looser than enumerating exact corners. Current joins are length-clamped to10 in `map-scene-model.js:40–41`, but the half-conversion envelope must be derived from the actual upload values, not assumed to equal the mathematical10 exactly. Interior vertices need only J*outer; endpoint-specific tighter bounds require storing/interpreting their actual flags.

Keep the current shader's endpoint cull **enabled and identical**. Select only from the original group's padded inventory; do not add edges that group construction excluded. CPU bounds must never independently reject a segment on a slightly different endpoint test. Shader culling then remains authoritative and the subset can safely overinclude currently culled segments. Group coverage/cache selection at `map-webgl-scene.js:80–90` remains unchanged.

## Same-style union and order

For each original style and original output tile, include every segment whose conservative mesh bound intersects that tile's **actual scissored output rectangle**, conservatively including boundary-touching cases. Keep its original first-point integer; do not regenerate geometry. Replicate an intersecting segment in adjacent tiles as required. Use the same original shader, view/tile uniforms, scissor, R8 clear/MAX blend, and composite once for that tile. Since output tile pixel cells are disjoint, every output pixel receives the MAX over all same-style segments that could cover it, then exactly one style-color source-over. Preserve original outer style order, including gray/up/down overlap. No per-segment color blend, reordered style composition or sequential blending of partial style masks is equivalent.

A false positive costs work; one false negative can change translucent union coverage. Treat nonfinite/overflow/uncertain bounds as “include,” or use the unchanged original full-group draw. Empty-list skipping is safe only after conservative inclusion is proven. Keep all original group bounds/scissors even if they are loose; do not accidentally combine this task with a second clipping change.

## Real ownership and memory constraints

`SceneEdges.upload:61–69` uploads geometry, then stores `points:null, joins:null, instances:null` in the retained model. Consequently later CPU filtering cannot access actual positions/joins. It needs new retained metadata created before transfer/upload, or an independently verified metadata payload. GPU readback per frame would defeat the purpose and is not justified.

The saved older `map-scene-gpu.json` resource sample is a **different23,078-edge dataset**, not the23,258 census. It retains three models with1,490,529segments/1,537,408points (edge fidelity.5 and4 plus bundles.5), and oversized unselected logical bytes52,115,516: nominal headroom11,884,484 to64,000,000. Its separate primary128,532,480-byte drawing buffer and existing CPU paths/ranges/worker temporaries are outside that historical logical GPU cap. The following figures are storage arithmetic/scenarios, **not a matched current allocation certification**:

| Candidate retained representation | Additional bytes on those old model counts |
|---|---:|
| Four Float32 AABB values for every segment, all models |23,848,464|
| Same AABBs for detail model alone |16,965,696|
| Packed x/y Float32 coordinates for all resident model points |12,299,264|
| Full Float32 point texels plus packed half joins, all models |30,748,160|
| Packed x/y for detail model only |8,667,472|

The first four exceed the old oversized headroom even before tile indices. Declaring CPU metadata “free” would misrepresent the added ownership. The old cap excludes existing retained CPU objects; any experiment must report new CPU metadata/scratch separately and preferably reserve it against the same64MB logical owner total so the bound has an explicit meaning. If that stronger total cannot fit, bypass the optimization rather than increasing the cap or silently excluding new allocations.

Retaining every new tile list adds4*T GPU bytes where T is selected tile-instance count, bounded above by current submissions if the list never duplicates an index inside one tile. With **census counts**, upper bounds are10,319,024bytes oversized unselected and11,430,828selected, plus any retained CPU arrays. Combined with full metadata these are untenable. Caching those lists across moving transforms would multiply this by history; reject that design. Original groups already retain their own buffers and must remain available for exact fallback.

A bounded alternative uses **one scratch Uint32 GPU buffer** and one CPU typed-array scratch for the largest active group, releasing/reusing rather than retaining a buffer per tile. Census maxima are182,705segments unselected (ghost):730,820bytes each; selected gray432,239:1,728,956bytes each. Thus both scratch copies cost1,461,640 or3,457,912bytes, respectively, before upload staging. Old detail-only x/y metadata plus these gives10,129,112 or12,125,384 extra logical owned bytes. Adding these to the respective old52,115,516/50,696,636 baselines gives62,244,628/62,822,020 as **mixed-snapshot feasibility estimates only**, with little spare capacity. They do not establish a current fit or transient safety. Actual reservations must precede every allocation/growth, include old/new coexistence, preserve required geometry tiers, and fall back to original full groups on reservation failure.

Only the active model's x/y metadata should be retained under an explicit bounded owner. An inactive cached GPU model may have no CPU metadata: use its original full-group pass until validated metadata is available, rather than evicting required prewarmed geometry or forcing Canvas fallback. Generating metadata again has worker/transfer/cold cost; do not hide it. Existing transferred geometry construction already has large temporary CPU arrays; any additional copies and their peak coexistence must be separately reported. Actual half-join per-corner metadata can cost more than the conservative global-J approach.

## Motion/CPU costs and falsifiable next diagnostic

Per-tile membership depends on k/tx/ty/DPR, viewport/mask partition, style width/cap and model/visibility/focus inventory. Even when an existing padded group is reusable, a camera move invalidates its screen-tile membership. Reusing lists without proving an enclosing motion envelope is unsound. Enlarged envelopes trade retained instances for fewer rebuilds; the saving cannot be inferred from current6× submission counts.

A direct scan per original tile requires at most T segment-bound tests:2,579,756unselected or2,857,707selected in the census oversized state. A one-pass-per-group computation of each segment AABB plus rectangular tile-span enumeration uses N bound evaluations and up to T insertions; it still needs output packing/counts and can upload up to4*T bytes each changing frame. Reusing one GPU scratch buffer across tiles can incur upload/driver synchronization because preceding draws consume it; STREAM_DRAW/orphaning would not prove no extra allocation. No speed estimate is justified. One-tile views should bypass all metadata/filter/upload work.

If assigned, first run a **non-timing, CPU operation/storage census**, not another renderer: immutable current source/data/CSS, actual uploaded model arrays, independently conservative half/uniform intervals, per-style/per-tile candidate lists. Report N/T before and after, largest scratch capacity, CPU/GPU retained and construction peaks, and original shader-cull inventory. Check every emitted corner against its bounds, adversarial half values/joins/caps/dashes/large coordinates and tile-border cases; preserve all required group members. If bounds barely reduce T, reject before implementation.

Only after that arithmetic is promising and fits exact current ownership should an explicitly assigned tiny alternate index binding be considered. It would require unmasked same-scene pixel identity/reference coverage, same-style crossing/dash/endpoint fixtures, full map both themes/DPRs/narrow/oversized, moving invalidations and all resource/lifecycle fallbacks, then independent immutable peer. No renderer or timing work is authorized by this read-only report.

The fatal risks are dropped mesh corners/uncertain half conversion, retained metadata exceeding headroom, unbounded transform-list history, or an upload/scan cost with negligible actual instance reduction. None is resolved by valid group scissoring or low CPU submission times in old diagnostics. A single bounded active-model/scratch design is worth an operation census; a claimed production optimization is not yet supported.
