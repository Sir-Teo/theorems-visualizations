# Independent read-only chunk lifecycle and fault protocol

This is a report-only source audit of exact root `b6ca416f8b95b8e93bd12b9973ab0999f6519942`. No test/model, browser, full-map, fault injection, timing or renderer execution was performed in this lane. It defines finite proposed evidence, not permission to run it. Root's separately accepted single light paired case and any static dark mirror remain separate. Neither covers the lifecycle cases below. No production implementation, shared runtime, source flag, global inventory or image/resource gate changed.

I personally read the actual private chunk runtime/prototype, isolated original scene/edges/budget/painter/text ownership, observer/fixture/reset interfaces, graph event lifecycle and the two old lifecycle runners. Exact source locations and range hashes are pinned below. Importantly, `assets/js/map-webgl-scene.js` calls itself an isolated experiment at its header; production `graph.js` does not import it. The private fixture routes it into the candidate. Findings in that inherited class are not demonstrated live production bugs.

## Current contract and ownership

`ChunkedEdges` subclasses the complete original `SceneEdges`; the original shaders, MAX-mask union and single colour composite remain inherited. Only mask-only binding can take the alternate path. A completed tile uses the same mask/scissor and exactly one original style/tile composite. Zero retained indices still reach that inherited transparent composite; this implementation does not skip it. The membership stream borrows original ordered IDs, paths, ranges and saved group coverage; the construction hook compares every regenerated index with the original Uint32 array. Camera bounds or Float32 endpoints must not replace that original membership test. No original index buffer is eliminated.

The optional metadata owner is `8*pointCount +4096` logical bytes for the genuine scale4 upload only; fixed scratch is32768 Uint32 slots,131072 CPU +131072 GPU =262144 bytes. Metadata and scratch are distinct budget owners. Original geometry/index/node/atlas/mask owners remain classified as original. `reserveOptional` checks no-eviction headroom before calling the real reserve. Original reserve pressure drops optional scratch then metadata before calling original reserve, but only when the requested original bytes plus current optional storage would exceed the limit. It does not promise that a fundamentally oversized original request can never invoke original-policy eviction/failure.

Each future generation must have its own observer installed from an empty SceneBudget and a complete separate history. Original peaks are independently accumulated; never derive them by subtracting current optional bytes from a historical total peak. Old-generation budget zeroing precedes replacement-generation allocations. Report both generations and their boundary, not one misleading reset peak. Logical retained/component/peak accounting remains distinct from primary framebuffer bytes, driver storage and diagnostic CPU/raw buffers. No physical64MB claim follows.

A live prefix failure can replay only the same still-owned original group/model, matching scene generation/control/view/coverage and resources. The catch clears the current original composite clip (the same scissored region) and replays its original index buffer before the inherited colour composite. Earlier already-composited styles/tiles are preserved only if that complete frame snapshot remains valid. A stale snapshot must throw out of bind/union; scene.draw must return false, hide/shrink the partial GPU canvas and let the routed `_draw` paint the complete Canvas fallback. It must not display a mixture of prior-state GPU tiles or replay a deleted handle. This does not require an unimplemented in-GPU restart path.

## Source-only findings requiring actual-class witnesses

**S1 — inherited worker error callback has an unbound name.** In `WebGLMapScene.initialize`, line58 creates `worker.onerror` that calls `map.draw()`. `initialize` has no map parameter or local; the constructor's parameter does not lexically extend into this method. With no unrelated global named map, the error callback first falls back and then throws ReferenceError. The proposed witness must invoke the actual saved callback and retain both its fallback and exception. This is a source-grounded concern in the isolated original experiment, not a native reproduction.

**S2 — inherited lazy geometry rejection can outlive its generation.** Line107 attaches a rejection handler that unconditionally adds the key to `this.failed` and calls `this.fallback`. Unlike prewarm handlers at59, it checks neither dead nor captured generation. Disposal at138 rejects pending promises and clears failed; their microtasks can subsequently mutate a dead scene or a replacement generation. A stale rejection must not be accepted merely because worker.onmessage itself has the correct generation guard at52. Test destroy and replacement-generation variants separately; preserve current behavior if the expected isolation fails.

**S3 — private live predicate does not prove group ownership.** Runtime line20 tests truthy `g.buffer` and membership in scene.groups, not the group's budget entry or live buffer status. Original releaseGroup delegates to budget.release, whose cleanup deletes the GPU buffer but does not null the JavaScript handle (original edges74,77). A releaseGroup-only injected prefix failure can therefore retain a truthy deleted handle and pass that predicate. Existing runtime fault mode released additionally nulls g.buffer at26, so it is a stronger invalidation and cannot establish release-only safety. This is a source-level API/fault-contract gap, not proof that normal synchronous controls reach it: ordinary controls change the key and remove groups. An actual-class model must settle the distinct release-only case before native claims. Do not silently strengthen the fault by nulling the handle.

No fix is proposed or implemented here. Thermo's separately assigned actual-class model lane received these findings. Its future results must be reported separately from this source audit and from native/GL behavior.

## Finite case schedule

Each row is a separate unique-output case with a fresh declared baseline, explicit one-event transition and no retry after a failure. Parenthesized variants are the complete finite list to expand; they are not an open-ended matrix. Start with models/GL tiny as authorized separately; native lifecycle execution requires a reviewed new runner. A source-model success alone cannot establish pixel or driver behavior.

| ID | Concrete transition or fault | Expected observable contract |
|---|---|---|
| R1 | Deny scale4 metadata reservation with optionalLimit=0 | Original upload remains owned; metadata/scratch absent; no original entry identity or peak changed by denied optional reserve; bind uses original. |
| R2 | Permit metadata, then deny the262144 scratch pair by exact headroom | Same original owners and metadata entry; no CPU/GPU scratch allocation before reservation; original binding succeeds. |
| R3 | Original reserve that fits with optional owners | Exact existing entry identities retained; no priority drop; original reserve sequence matches original class. |
| R4 | Original reserve fits only after removing optional pair and metadata | Release scratch and metadata before original reserve; no optional-caused original eviction; original entry identities and independent original peak match reference. |
| R5 | Original request exceeds headroom even after dropping optional | Preserve exact original reserve/eviction/failure policy; record denial/evictions; complete Canvas fallback on failure. Do not invent retained-prewarm success. |
| R6 | Release metadata's model; separately release an unrelated model | Matching release drops both optional owners before original model cleanup; unrelated release must not spuriously replace metadata/model. Final budgets reconcile exactly. |
| M1 | Upload scale4 twice, then upload scale0.5 | Second scale4 drops prior optional owners and binds metadata to exact new model; scale0.5 does not fabricate metadata for itself. Save all original owners, including unused retained scale4. |
| M2 | Metadata missing; metadata.corrupt=true | Each goes directly to original binding, with no filtered indices or changed rendered semantics. |
| M3 | Unsupported domain variants: k=.009; k=16.001; DPR1.5; width8.1; cap=square | Each independently uses original, no forced clamp/relaxed enclosure. Keep all supported-domain limits unchanged. |
| M4 | Scratch allocation returns null buffer; separately bufferData reports GL error | Drop allocated optional owners exactly once; no leaked buffer or nonzero owner; fall back safely with recorded error. Actual GL identity/error checks remain required. |
| B1 | maskOnly=false and separately forceOriginal=true | Exact original bind path; no chunk work or optional forced allocation. |
| B2 | Membership lengths0,1,32768,32769,65538 | Exact ordered stream and multiplicity, fixed capacity, used-count tail with no stale slots; MAX union and one colour composite per original style/tile. Zero case remains transparent. |
| F1 | Throw after first completed chunk with every original snapshot field live | Clear current composite clip, one full original bind, exactly one colour composite; no doubled alpha, changed prior tiles, or second composite. Compare exact raw RGBA with matched original history. |
| F2 | Change camera k between prefix and fault | Stale abort, no replay/current composite; hide partial GPU output and paint whole Canvas for the actual new state. |
| F3 | Change control key and release/remove old groups after prefix | Stale abort rather than replay of old filter/style arrays; complete fallback. |
| F4 | Release original model after prefix through actual budget release | model.released true; optional owners drop; abort and whole fallback; no upload/draw using deleted textures. |
| F5 | Release group and remove it from scene.groups after prefix | Abort despite a still-truthy JavaScript buffer handle. |
| F6 | Call releaseGroup alone after prefix, retain map entry and handle | Required contract is still abort; S3 predicts a gap. Save actual behavior before any assertion and stop. Do not additionally null buffer. |
| F7 | Replace coverage array or increment scene generation after prefix | Each separately invalidates replay; no use of stale borrowed membership. |
| F8 | Lose context after prefix | No original replay on unusable context; whole fallback, zero old owners after disposal and no visible partial GPU frame. |
| I1 | Camera pan entirely within saved group coverage | Same group buffer/coverage identity; descriptor borrows same original IDs; regenerated membership exactly original order. Filtering uses current tile only after membership generation. |
| I2 | Pan outside saved coverage | Old group release, new saved-coverage group/index construction; compare every stream index; no stale buffer survives its release. |
| I3 | Separately toggle defs, planned, field set, highlight, selection, hover, theme | Each of these seven named cases replaces controls/groups/flags when its actual key changes; exact original style order, membership and hit results preserved. Font-only callback clears atlas without pretending to alter original membership. |
| I4 | Model tier0.5→4; separately4→16 | Cold missing tier returns Canvas; actual worker success uploads then permits a fresh complete draw, or explicit allocation failure stays Canvas. Warm success must actually be asserted; do not reuse old runner's missing assertion. |
| I5 | Resize320×900 then separately3840×2160 at DPR2 | Exact scene/backing/primary dimensions, mask≤8M, input1pixel only on successful GPU; current view/coverage validated. Required fallback uses full-size input canvas. |
| L1 | Actual context-loss event while ready with pending work | preventDefault, fallback, generation increment, worker termination, all pending rejected/cleared, original/optional budget zero, hidden1pixel scene. Save all rejection microtasks; S2 may invalidate readiness. |
| L2 | Restore once after fully recorded loss | New worker/budget/atlas and generation, three actual original prewarm models, optional owner classification from zero, no old GL handle; same view/filter/selection/hit state. Do not assume old shader/program locations remain usable. |
| L3 | Deliver saved old worker.onmessage after restore; separately after destroy | No geometry upload/model insertion/map draw from stale generation/dead callback; retained provenance still records attempted delivery. |
| L4 | Invoke saved worker.onerror while live | Actual fallback plus draw/error behavior retained; S1 predicts ReferenceError. Stop on unexpected exception rather than suppressing it. |
| L5 | Reject a lazy requested geometry after dispose; separately after restore | No mutation of failed/status/visibility/control/owners in dead/new generation; S2 predicts a violation. Keep old promise identity and microtask ordering. |
| L6 | destroy({restore:true}); separately routed map.destroy using restore:false | Both release all owners once, terminate worker, empty pending/groups/models, remove listeners/scene/scratch canvas. restore:true restores a live Canvas; restore:false is map teardown and must not be forced to repaint a dead host. |
| L7 | Saved font/focus/restore callbacks after destroy | No resource recreation or live rendering; events and attempted callbacks retained, legitimate dead guards observed. Do not equate manual invocation with an event listener still being registered. |

For I3, I5 and restored states, retain a fixed hit sample set:24 points (centre plus23 deterministic coordinates) for each of filtered/unfiltered states and k=.1,.13,.35,1.15,8, exactly240 comparisons against the original geometric hit oracle. These are future input-correctness checks, not FPS frames. Theme/image phase is part of each unique context; do not combine lifecycle cohorts by inheriting a prior unrelated cache.

## Evidence and runner requirements

Before assertions, persist actual pre/post owners and entry identities, reserve/release attempt order, model/generation/control/group/coverage/borrowed-array identities, original membership stream hash/count, actual GL allocation/deletion/error trace, exact draw/composite ordinal, failed-frame partial trace and callback/network prefix/tail. Save diagnostic raw buffers and hashes losslessly before teardown; fault salvage may transfer but must never issue a replacement draw. A released group's stale handle is evidence, not a valid live resource. Per-context observed GL handles and program/VAO cleanup are additional evidence beyond logical budget accounting.

For replay equality, original and alternate use independently fresh, symmetric preparation/reset histories, corresponding ordinals and exact glyph/upload-content histories. For required Canvas fallback, compare with a complete original Canvas paint at the same actual state (not a stale copied reference); do not apply the successful-GPU inputCanvasPixels=1 assertion there. Use exact same-scene GPU RGBA equality and original cold/warm stability where applicable; the separate full-DOM Canvas tolerance remains mean<2/255 and changed-channel fraction<.02 at threshold20/255. Neither metric may waive a local lifecycle exception or leak. Preserve64,000,000 retained/historical logical bytes,8,000,000 mask pixels, zero MSAA/GL errors, no original owner eviction caused by optional headroom, complete current-frame output and all prefix/post callbacks. Any failure stops that cohort before another native case.

The old lifecycle tools are not suitable unchanged: one routes only original scene, the other a retained wrapper using s.base; the retained runner fabricates empty selected statements and warms five unrelated tiers; both defer aggregate persistence until successful theme completion. Original scene lifecycle does not assert warm high-tier success. They lack current full atlas/font/shard/history/resource/post-callback protocol and private release-only/late-generation faults. Their historical checks are useful case definitions, not candidate evidence. No use of those stale runners is authorized by this report.

## Exact source/range pins

All entries below refer to the single root hash above. Blob IDs are Git object IDs. Range SHA256 hashes include exact UTF-8 line bytes and original newline endings, inclusive line endpoints; they can be recomputed from git show without executing a renderer. Snapshot read copies are `/tmp/atlas-new-lifecycle-readonly`. This report is the only tracked change.

| Source and inclusive lines | Git blob | SHA256 of exact line bytes |
|---|---|---|
| `scripts/lib/map-chunked-indices-runtime.mjs:3–17` | `e6cc186f7794161bcdaa3aea12ee0da5630c8da4` | `e21214571a7383d838b46f58e7e0631e3215b2676df7907453fdae2c332008bd` |
| `scripts/lib/map-chunked-indices-runtime.mjs:18–23` | `e6cc186f7794161bcdaa3aea12ee0da5630c8da4` | `e182e8c6d06baf31b6ce9472b7e420151bc528df25c40b9e4d425819c4ac0361` |
| `scripts/lib/map-chunked-indices-runtime.mjs:24–30` | `e6cc186f7794161bcdaa3aea12ee0da5630c8da4` | `e93f0bbaa2ea828177ca1c5183a4a81a914d310e136aa625512a66d5e7737bab` |
| `scripts/lib/map-chunked-indices-prototype.mjs:3–7` | `8abf254d8588e13283b27f8ab4a78d356b2edeb4` | `bd6e6569e73fd20f6ee322c40cdfe8359b5af94c4e2e8c67823fd65d0adbe1fd` |
| `assets/js/map-webgl-scene.js:27–68` | `16110877f809b45b8970de62a86ed65f74695556` | `d21ed29b5208e70c4ef6d16057adc8b200f6e98a9a72c0079d636d53fce85dae` |
| `assets/js/map-webgl-scene.js:70–102` | `16110877f809b45b8970de62a86ed65f74695556` | `db4d0b5df8088d393d9ee4aa90526839a8fb894a232c80df1d7c82a9a9055f4b` |
| `assets/js/map-webgl-scene.js:103–131` | `16110877f809b45b8970de62a86ed65f74695556` | `dbea67015a890fef5a33bf5399be2e09d366b8c1033bf0e26ee1ff1b89e38d87` |
| `assets/js/map-webgl-scene.js:133–142` | `16110877f809b45b8970de62a86ed65f74695556` | `70f92a46428a669acb93a8ee8ca9f068298c5599ea2fc0ece9c927934554f8a2` |
| `assets/js/map-scene-edges.js:57–82` | `15f0e192ba7e295e0d6a055f1e17d0f85a9a9ae6` | `e96a39448bfe57a36fdc2059dc390620a84ca1c8ce66af4c5d3a92a0bd279e72` |
| `assets/js/map-scene-edges.js:84–105` | `15f0e192ba7e295e0d6a055f1e17d0f85a9a9ae6` | `6e712a64072f642d3a5c899069a11cf2290ed757d84caa3f91e21a212df386dc` |
| `assets/js/map-scene-gl.js:17–31` | `d5e228634d7454e387ce1e61a1d5a007527ac9fa` | `d07e8e4f4417fea0611359cf21ccffb775fea75fd30a284259289307bdbfe45a` |
| `assets/js/map-scene-painter.js:90–122` | `9c4cf8bc8b0273950241007454023be173a31566` | `2c8e2be336471de0c986addeeaa27cc9443d9b589e860c5625231f56846d49a6` |
| `assets/js/map-scene-text.js:3–16` | `57f9919ae6299af523da33d262d6324f601daca2` | `4efe32dcb304a8430576f7042452678b6d915527e532da3af12179225592daa2` |
| `assets/js/map-scene-text.js:21–39` | `57f9919ae6299af523da33d262d6324f601daca2` | `bb5694016e406e04781bbb0376e183ed360eb5a4de1003acfd7a6b744e95e42b` |
| `scripts/lib/map-scene-prototype.mjs:3–12` | `ff94765726e1f0019a554d9ce89911bf4449932d` | `c64680c32babb4b62c1a201816cb3b1b788250b808f092a797979fd01793140e` |
| `scripts/lib/map-paired-resource-observer.mjs:3–17` | `79dafd35c26d1c11dca818ce004c2acdad4fa35e` | `ce6833bae5b4614a7950135dac30f049d9c151e07985df23c7b4b33058cd0456` |
| `scripts/lib/map-paired-atlas-observer.mjs:35–49` | `a34d1c31f1640b83083be5f74f800cd81a891477` | `24e95d32782f72f52b80eee10667196b1fcf20b58b751df9e269bdd78464df39` |
| `tests/map-scene-lifecycle.mjs:12–27` | `ac245110f7cac23ea9376c24a32913bd0b0d99e9` | `4225c4dd845928fc3ee27d8fb771ccd2eb3f6cb8c4bb2291049e0d27b8ca9705` |
| `tests/map-retained-lifecycle.mjs:14–30` | `a831cd75218ef68268e4c0fffdb13c66aa249c3a` | `da729adc8898e96850d2d23ba0dd47712ca35bce52f14de6219a9d0ed2da98cb` |
