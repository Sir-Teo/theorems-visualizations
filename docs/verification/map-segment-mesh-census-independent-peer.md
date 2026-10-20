# Independent actual-mesh census peer — 20 October 2026

**Endorse the bounded diagnostic conclusions of exact commit `b5b680b8e1d4645bcf6508d49f8cf9f6d72e999c`: substantial conservative instance-count reductions in the four measured states, with the stated memory failures and no renderer/performance acceptance.** The candidate is archived at `/tmp/atlas-new-map-mesh-peer/archive`. No source-content review, renderer binding/index replacement, timing or FPS measurement was performed by this peer.

I read the prior `map-tile-segment-index-readonly-2026-10-20.md`, the complete current vertex/fragment/union/upload/group paths, scene resource accounting, budget eviction semantics, geometry construction/worker transfer and the candidate interval helper/probe/raw report. The current geometry worker requests `includeInstances:false`; its captured geometry has no additional full CPU instance array omitted from the diagnostic arithmetic. Captured padded Float32 points and joins are counted; existing shared ranges/path objects are not a newly allocated second copy.

## Frozen identity and independent recount

Frozen checkpoint `/tmp/atlas-continuation/checkpoint5` is marked source **`68aa4e24889ec290d8f90206c4441485389f7e26`**. The peer independently verifies all recorded input/protocol hashes and compares source asset hashes directly with that Git source. The three data hashes are:

- index `c62d6beda2c317280aa99d107873d880a4b5c4fb6748113b8e9b45c5772cb1fd`
- planned `9627cdd57f3131e3876efeeaf5ebe3d1f5d06f6450c1a104a6d1e028c1f8ebbd`
- atlas.css `792d9bdaa2e9978863ff78a42a5d5d87e084b9f8d810941de07def487ddff29f`

Sixteen direct source-hash comparisons (including overlapping raw/input manifests) cover eleven distinct source assets. The immutable prototype injection helper additionally hashes to `76eb562cebb368c00cbcfcbbedf31591ce6a32b8adaf85adfa0c7aeea8bfe68f`; the peer records this helper explicitly rather than silently assuming its test wiring is production code.

I ran the exact committed count-only probe freshly against the frozen checkpoint, output `/tmp/atlas-new-map-mesh-peer/evidence/recount.json`. All **four complete raw result objects** exactly match the producer JSON, including every style/tile count, sampled enclosure count, model count and resource component:

| Map size / selection | Original submitted instances | Conservative retained instances | Original GPU/native logical bytes | With active packed x/y, counted CPU/GPU scratch, original CPU membership |
| --- | ---: | ---: | ---: | ---: |
| 1440×932 / none | 270068 | 24327 | 49552336 | 60007488 |
| 1440×932 / selected | 289759 | 26777 | 49631100 | 60276392 |
| 3840×2092 / none | 2700820 | 112786 | 52913740 | 64227968 |
| 3840×2092 / selected | 2986323 | 132171 | 53094804 | 64780328 |

These are segment/group/tile instances, not distinct edges. In the two actual normal frames every drawn group has one tile, yet filtering removes padded offscreen segments. The prior report's blanket advice to bypass one-tile views was too broad: lack of tile repetition does not imply lack of viewport-filtering savings. This does not establish that CPU filtering/upload cost is worthwhile in any frame.

A separate bounded peer probe re-enumerated original memberships in both unselected sizes. It uses the actual original style ID arrays, saved original group coverage, original Float64 path endpoint predicate and model ranges, without changing a binding or submitted list. All **86 group calls per state**, including empty groups, match the captured original typed arrays **index-for-index and in order**: 270068 and 452627 entries respectively. These snapshot checks support the exact nested-loop membership proof; they are not acceptance of a future invalidation/regeneration implementation.

That probe separately obtains the loaded graph identities: **13574 nodes / 23364 directed edges**, all definitions/planned/fields enabled. Actual node-order hash is `c0c4dd4c74b1943da1411a9032f2eeb554f5a97b5479ce002c71e2fe5b272057`; actual ordered endpoint-pair hash is `b74500c3374db3863ffc7824c139bd7b8d2168a774e6c928d54c437f75f96ad5`, exactly matching the input manifest. It includes current written planned-dependency edges, rather than substituting an earlier graph inventory.

## Enclosure assessment

The four shader vertices use actual uploaded Float32 endpoint positions and sampled half joins, with uniform Float32 transforms. For either side and endpoint flag, each axis of join-plus-tangent extrusion is bounded by **J(outer+extension)**. Enclosing the two transformed center points and expanding by this radius therefore encloses the triangle strip. Fragments are restricted to those triangles; dash/cap/AA code cannot create coverage beyond them. Endpoint shader culling remains unchanged and may only remove more instances; the diagnostic does not introduce a different endpoint reject or add anything to the original group inventory.

The helper mirrors the shader expression, including tile offset, NDC division and viewport mapping. It encloses adjacent half values and possible subnormal flush to zero, interval arithmetic includes outward Float32 rounding and fused/separate expression possibilities, and uncertain/nonfinite/division-through-zero bounds include rather than reject. The measured global half envelope is **J=3.982421875** in all 46 drawn groups. The finite-frame cheap bound adds a sum-of-magnitudes numerical guard plus a physical pixel; its 128-spacing allowance dominates the finite sequence of scalar stages in the measured normal-range domain. This endorsement is restricted to that stated domain and conservative diagnostic, not an unrestricted arbitrary-coordinate or device-precision theorem. Values outside it must fall back/include or use an adequate full interval bound.

The original test independently reruns **29514** half/corner witnesses. The peer's separate utility uses the JavaScript engine's independent IEEE Float16 conversion for **63486** half-conversion/flush enclosure checks and explicitly rounded shader evaluations for **5608** additional corners (both caps, DPR1/2, fractional phases, varying scales, fused/separate initial multiply-add and both endpoint sides). All fit the helper. The fresh actual census again passes **453** sampled full interval-corner boxes inside the cheaper boxes. Samples supplement the algebraic enclosure argument; they do not prove pixel identity for an unimplemented subset renderer.

Original clipped rectangles, scissor partition, shader, R8 MAX union, style order and one color composite per style/output tile remain unchanged. Boundary-touching bounds are included and segment replication across tiles is required. The diagnostic changes neither clear/composite area nor the real submitted draw lists. No GPU half readback or alternate-index equivalence run was performed or claimed.

## Ownership and disposition

The peer independently recomputes every raw component sum, all per-tile maxima and all retained/scratch arithmetic. The active packed x/y proposal is **9291784 bytes**; all three actual resident models contain **1644999 points**. Scratch pairs in the table use the **counted filtered** maximum, requiring count-before-pack or a checked bounded strategy. They do not justify allocating each original group's full capacity.

The two oversized original-membership totals exceed **64000000** by **227968 / 780328 bytes**, before metadata/object/staging/growth overhead. Thus retaining original CPU group memberships is a **failure**, not a production fit. Original-largest-group CPU/GPU scratch without membership reaches **63667164** unselected and **66007604** selected: the selected case exceeds the cap by **2007604** before other overhead. Even the smaller counted-scratch/no-membership totals leave only **1582540 / 1211244** oversized bytes; these are nominal arithmetic headrooms, not successful future reservations.

Count-only instrumentation separately retains complete captured padded upload arrays and original group CPU indices: **40598480 / 40677244 / 41328716 / 41509780 bytes**, in addition to the original logical GPU/native owners. Its retention is explicitly **not** a 64MB production pass. Existing primary framebuffer, driver/compositor/storage staging and inherited CPU construction/path objects remain excluded from that historical logical budget, so no heap/process/physical-memory ceiling follows. Old/new scratch coexistence, GPU upload staging and orphaning are not free. A future owner reservation must also prevent eviction of required prewarmed models; `SceneBudget.reserve` can otherwise evict eligible original owners even if the new owner itself is not evictable.

Avoiding a new membership copy requires exact original order/inventory regeneration from the saved original snapshot, not a new Float32 endpoint test or fresh camera coverage window. All control/model/generation changes and uncertain arithmetic need an exact original full-group fallback. This peer has not reviewed the later standalone regeneration report or any implementation and does not authorize one.

**No blocking discrepancy found in the census.** Its conservative counts and explicit memory failures are reproducible. No faster-frame, 60FPS, production-fit, binding, source closure or content acceptance claim follows. Both fresh probes closed browser/server normally.

Reproduction: `node tests/verification-map-mesh-census-peer.mjs <immutable candidate archive> <frozen checkpoint>`. Evidence under `/tmp/atlas-new-map-mesh-peer/evidence`: `peer-audit.json`, `producer-interval.log`, full fresh `recount.{json,log}`, and separate `membership.{json,log}`. The extra peer snapshot probe is retained at `/tmp/atlas-new-map-mesh-peer/archive/scripts/peer-map-mesh-membership.mjs`; candidate source files remain hash-identical.
