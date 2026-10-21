# Read-only uploaded-curve bounds feasibility

**Four Float32 extrema per original path are a plausible memory alternative to retained XY, but they trade segment selectivity for coarser curve rejection.** Frozen metadata would shrink from 9,291,784 to 373,824 bytes, saving 8,917,960 bytes. This is source-grounded feasibility and arithmetic, not an implementation, new acceptance, current-data fit guarantee or performance result.

No runtime, source transform, static candidate, original asset/data, fixture, shader, browser, full-map or timing execution changed. No uploaded geometry was regenerated. The report reads immutable saved light `/tmp/atlas-root-paired-selected-state/complete.json` (independently accepted by root) and dark `/tmp/atlas-root-paired-dark-state/complete.json` (runner PASS, independent peer pending when supplied). Both complete-file SHA-256 values, source pins, ledger arithmetic and count summaries are in `map-curve-bounds-feasibility-evidence.json`. The relevant unchanged implementation source is pinned at `b6ca416f8b95b8e93bd12b9973ab0999f6519942`.

## Storage and actual saved ownership history

The scale-4 model has 1,161,473 actual points and 1,138,109 segments. `buildWorldPaths` retains at least one point for each nonempty input path, with one more point than segments per path. Its 23,364 frozen paths agree with their difference. Array storage for four extrema is exactly 16 bytes per path:

| Owner/measure | Frozen XY candidate | Conditional curve-bounds alternative |
| --- | ---: | ---: |
| Active point/path metadata array | 9,291,784 | 373,824 |
| Existing bookkeeping | 4,096 | 4,096 |
| Fixed CPU + GPU index scratch | 262,144 | 262,144 |
| Main retained owners, unchanged original history | 62,471,764 | 53,553,804 |
| Conservative envelope: original peak + one metadata owner + scratch | — | 55,239,784 |
| Headroom below 64,000,000 at that envelope | — | 8,760,216 |

The original retained/peak owners are 52,913,740 / 54,599,720 bytes; the actual XY candidate's observed peak is 63,895,600, leaving 104,400. **Simply subtracting the metadata saving from the old peak gives 54,977,640, but is insufficient as a new peak bound.** Both saved ledgers contain 351 denied scratch attempts at the old peak and one later success. Smaller metadata could permit scratch earlier. The conservative conditional envelope therefore includes all 262,144 scratch bytes simultaneously with the original peak: `54,599,720 + 373,824 + 4,096 + 262,144 = 55,239,784`.

These numbers assume the same original owner history, at most one bounds owner and the same single fixed scratch pair. New retained per-path JavaScript objects, dense flags, per-path join arrays, GPU copies, replacement overlap or staging cannot be hidden inside this arithmetic. A flat bounds array can retain global join/max-coordinate scalars under the existing bookkeeping model; per-path joins are unnecessary for a conservative global-J envelope. Metadata replacement must release or reserve old ownership explicitly and retain original-priority denial/fallback. This is a logical owner envelope, not physical GPU/process memory.

The current metadata audit has 23,955 paths, net +591: its bounds array alone would be 383,280 bytes, only 9,456 more. That does not establish current-state fit: added/removed curves also change all fidelity-tier textures, ranges, visibility/closure groups, index buffers and ownership peaks. Those current GPU/peak values were not measured here. Existing accepted frozen data and its ledger remain unchanged.

## Exact uploaded data and range semantics required

Extrema must come from `geometry.points`, the actual Float32 upload input, while it is still available. For each original range `r`, read x/y at every index from `r.startPoint` **through** `r.startPoint+r.segments`, inclusive. Store `(xmin,ymin,xmax,ymax)` at that original path's stable integer index. Min/max selects existing Float32 values exactly, so packing these four selected values into Float32 adds no rounding error; arithmetic guards are still needed after transformation. Computing an ideal Bezier bound, or a min/max of its double endpoints, is a different premise.

The original point texture is padded to width 1024 and whole rows; pointCount excludes this tail padding. Its RGBA lanes contain XY, cumulative arc length and curve ID/endpoint flags. Joins are uploaded from Float32 inputs to RG16F. Bounds must not interpret padding as extra curves, scan into the next range, lose the final endpoint, treat every four floats as XY, or infer segment boundaries from nonzero coordinates. Zero coordinates are real geometry. A zero-segment range emits no indices; retain its range identity and do not invent a segment. The builder filters near-duplicate double points before Float32 conversion; distinct double points can subsequently collapse to the same Float32 XY. Do not deduplicate or change this original zero-length/duplicate incidence behavior.

Required validation includes finite points/extrema, safe integral range starts/counts, inclusive end within actual pointCount, complete original path/range correspondence and original valid Uint32 segment indices. Each emitted segment must address its own range's two uploaded points, and its encoded curve ID must agree at both ends. This also keeps the shader's endpoint rejection uniform across its four vertices; malformed cross-range indices cannot be made safe merely by an AABB around one path. Missing, corrupt, uncertain or incompatible metadata must include the curve or use the original whole-group GPU path, never silently reject it.

The saved complete frames retain counts and range hashes, not the uploaded point arrays or complete ranges. Therefore this report cannot compute actual per-path extrema, validate every range, or count curve-bound intersections from those artifacts. New upload-derived proof/census evidence would be needed for those steps under a separate assignment.

## Conservative shader enclosure: sufficient proof boundary

For each uploaded XY point q of a range, actual shader position before tile translation is

`q*k + t + j*outer*side + (jy,-jx)*extra`,

where `outer=halfWidth+1/dpr`, `|extra|<=extension`, `extension=outer` for round caps and `1/dpr` for butt caps, and `side` is ±1. Preserve actual Float32 uniforms and the uploaded half-join enclosure. A global component bound J must include both adjacent representable half values around every uploaded join input, including allowed subnormal conversion; it is not a bound guessed from the ideal curve's normals. Existing saved census J=3.982421875 is measured for its upload, not a universal value for current data.

Because all original q lie in the stored range box, each axis extrusion is bounded by `J*(outer+extension)`. Transform the box with k/t and expand by this radius and a justified numerical/raster guard. The current domain has positive k; if the domain changes, negative k must swap extrema and zero/nonfinite/infinite intermediates require explicit handling rather than trusting min/max order. Fused versus separate operations, width rounding, inverse DPR and viewport division still matter even when metadata extrema are exact.

A proof-oriented construction can propagate outward intervals through box-coordinate multiplication and translation, the half-join/style extrusion, actual Float32 tileOffset, NDC division/multiplication/addition and viewport conversion, with outward floor/ceil and the same conservative device-pixel raster margin. Existing `map-segment-mesh-enclosure.mjs` documents these operation assumptions and unknown/include handling. Using a range interval instead of two point constants is conservative but can be looser. It does not remove the need to independently prove the whole interval-to-raster envelope for the admitted domain.

Alternatively, to **dominate the existing supported cheap segment boxes** rather than merely ideal geometry, take the curve coordinate extrema and dominate its per-segment magnitude guard. With K being the Float32 k, a suitable magnitude upper bound for that existing formula is

`Mcurve = 2 max(|xmin*K|,|xmax*K|) + 2 max(|ymin*K|,|ymax*K|) + |tx|+|ty| + radius + (pw+ph)/dpr + 1`.

This dominates both endpoint products in each original segment's M. The existing `1 + 128*2^-23*M*dpr` guard and outward integer bounds would then enclose every current segment box, **conditional on the existing finite supported-domain arithmetic proof**. It is not permission to apply 128 spacings to arbitrary inputs. Overflow, unsupported styles/joins, projection uncertainty and stale ownership must retain conservative fallback. An independent proof should check all permitted k, translation, DPR, width, cap and tile-resolution limits, with exact Float32 boundary neighbors, not certify a few samples.

The fragment shader's dash and coverage computations can remove fragments but cannot expand the enclosing mesh. Its AA fringe is already accommodated by outer/extension plus the raster guard; do not reduce this to halfWidth. Canonical clipping and MAX coverage cannot justify removing a segment with uncertain geometry. Endpoint GPU culling, original style/group bounds, clear/scissor rectangles, tile overlap inclusion, MAX union and single style composite remain exactly the original semantics.

## Ordered membership and work census

Keep the original cached coverage/endpoints predicate and ordered style IDs before testing a range box. Do not substitute a fresh view or the curve box for that membership predicate. For every original admitted path occurrence, account for its full `r.segments` in the original stream-count check even if its curve is rejected without iterating those segments. If the box intersects/touches the original clipped tile or is uncertain, emit the entire contiguous original range in order; retain repeated IDs and multiplicity. Never deduplicate, sort, stitch or replace boundary segments. Continue fixed 32,768-index flushes, original shader binding/MAX mask composition, owner/generation/control/snapshot checks and whole-snapshot abort/fallback semantics.

Let E_g be the admitted path occurrences, S_g their segment-count sum, and T_g the original tile visits. Current per-tile segment boxing scans roughly `T_g*S_g` segments. Curve-first rejection tests `T_g*E_g` boxes and enumerates only the segments of curves whose boxes survive. Worst case every curve survives, so work is `T_g*(E_g+S_g)` and all original indices are emitted; no speedup follows. Long curves whose box crosses many tiles can keep numerous off-tile segments that the current segment boxes remove.

The saved A0 group counts/bounds and original tile arithmetic independently yield **117 nonempty clipped style/tile visits and 2,700,820 full original membership instances**, matching the saved 117 optimized visits. The current XY policy emits 112,334 indices in 70 chunks, with zero original binds in each main frame. If the proposed cheap curve boxes are explicitly constructed to contain the existing segment boxes, its emitted indices would be between 112,334 and 2,700,820 for that unchanged frozen A0 inventory, and fixed scratch would need between 70 and at most **171** nonempty flushes (the sum of `ceil(group.count/32768)` per original clipped tile). These are conditional arithmetic limits, not measured proposed counts or durations. A differently constructed valid interval enclosure need not contain every false-positive old segment box, so that particular lower bound would not automatically apply.

The global ratio of 1,138,109 segments to 23,364 paths does not establish a per-style or per-tile work reduction. Actual E_g, surviving curve instances and submitted-index counts require the missing upload/range census. Changed current data needs its own inventory and original/alternate comparison. Mask clear/composite area is unchanged; none of these counts establishes faster frames.

## Counterexamples and independent proof obligations

- Endpoint-only bounds fail for a curved uploaded polyline that leaves its endpoint box. For example a legitimate uploaded range can contain `(0,0),(8,50),(0,100)`; endpoint x bounds exclude its middle segments. The real worldCurve construction also permits control-point excursions beyond endpoint x bounds. Actual Float32 range extrema avoid this premise error.
- Omitting the inclusive final point fails even for one segment `(0,0)→(100,0)` when a tile touches its far endpoint. Scanning through the next range instead can inflate or corrupt a different curve's bound.
- A centerline/halfWidth-only box misses join extrusion, endpoint extension and AA support. A diagonal cap has simultaneous normal and tangent components; the conservative sum radius must not drop the extension term. Half conversion and miter components must be enclosed from the upload, rather than normalized back to ideal unit normals.
- Copying double ideal extrema without outward rounding can miss Float32-upload extrema near a rounding boundary. Selecting minima/maxima from actual Float32 XY is exact; subsequent k/t/NDC arithmetic is not.
- Strict `<` versus inclusive boundary contact, local CSS versus global device coordinates, tile origin subtraction, non-square terminal tiles and fractional translations can create seams if mixed. Unknown enclosures must include.
- A long curve box may span a tile containing no part of its polyline. This is a safe false positive but defeats selectivity and can increase uploads/chunks materially. It cannot justify shrinking the bound.
- Stale model/range correspondence and a released-but-truthy group buffer are lifetime failures rather than geometric ones. The independently reviewed unused lifecycle proposal is separate; a new curve policy must retain original ownership/abort requirements and cannot assume its future wiring.

Before any implementation/acceptance: independently establish range/padding correctness and actual half/Float32 enclosure; preserve an exact original membership hash/order/multiplicity oracle; census actual uploaded curve extrema and per-tile retained ranges; reconcile every owner/transient peak with optional-denial fallback; and separately validate original/alternate native pixels, boundaries and lifetime faults. This read-only report authorizes none of those executions and leaves the accepted static candidate unchanged.
