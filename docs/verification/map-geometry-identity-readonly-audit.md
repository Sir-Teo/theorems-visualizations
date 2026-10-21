# Geometry identity and synchronous writer audit

**The no-write premise for path coordinates and ordered style-ID lists is supported by the exact normal sources below, including the two unwired f8 curve modules.** Their code has no writer to these contents inside a synchronous union/bind. This is a closed-world source fact, **not** an enforced immutability guarantee: array identity, scene generation, controlKey and unchanged element count do not detect an injected same-count ID edit. Deep's reported before-bind/mid-prefix `bufferSubData` mutation probes therefore remain outside-domain counterexamples, not mutation-resilience passes.

This is a report-only source audit. No model/test/browser/worker/full-map/timing case was executed; no runtime, source, data, global acceptance or flag was edited. No BIGHIST content was inspected. The coordinator's current-run result is not independently reanalyzed or accepted here. The curve candidate's geometry proof, budget fit, observer integration and native acceptance belong to its separate reviewers.

## Exact source boundary

Primary original/current-case source: `d7d07ed84da592a04c8c038ffc405d5b5607bfc0`. All19original/observer/prototype sources in companion `map-geometry-identity-readonly-evidence.json` are byte-identical at b6ca416f and curve baseline `90e2e8166a8553008490c67f68ec5fbc862c2045`.

| Source | SHA256 |
|---|---|
| graph.js | `9a8850528193c87e97deba14a387bebff3215e9e67569c125cac265e061f94fc` |
| map-webgl-scene.js | `2422e59c2780e19e0c7b5c11da56127bc23718925ddde3e4d71527e4e45c21b5` |
| map-scene-model.js | `a7d10c9ba64acd3f4be8307d07461e0d9fad04f567d0d40dbbebfa37f2a581af` |
| map-scene-worker.js | `d913af8f8baf5ea8a0a83d504332ceb4fdd17e58e48cc560c246e08ed8690009` |
| map-scene-edges.js | `7b3fcf731105674252465c1376942b2f2b549fa51f9a3c9a3ee581a10c242262` |
| map-scene-gl.js | `b94855c4988e6c7d951d97ca9f2fa773d25ae828872ff6dee79cd42decdda4dc` |

The production MapView uses Canvas. `map-webgl-scene.js` is a repository experiment; `scripts/lib/map-scene-prototype.mjs` privately wires it into the routed case. The audit follows both that exact scene and the original MapView it consumes.

Additional read-only candidate boundary: `f8eb0b366bb98ff906315469f9cc022089f73465`, only `scripts/lib/map-curve-bounds-runtime.mjs` and `map-curve-bounds-math.mjs`. Their full hashes/lengths are in the evidence. No candidate implementation was changed or independently accepted by this audit.

## Paths, IDs and uploaded geometry

- **MapView nodes/edge order:** `graph.js:314–321,353–367` constructs node objects with copied x/y/r values, a byId map, stable order numbers/bins and dependency→consumer edge pairs. `top=nodes.filter(...).sort(...)` sorts a new filtered array, not nodes. Collection centers are accumulated/averaged once. No later MapView node-coordinate write or edge insertion/reordering was found. The similarly named x/y mutations in TimelineView and local lineage/layout helpers are different objects/classes. Pan/zoom/fit/resize write view k/tx/ty/W/H/dpr, not these world coordinates.
- **Scene paths:** `map-webgl-scene.js:40–47` replaces `paths` on initialize with newly allocated cubics from `worldCurve` and creates/filter-appends quadratic `bundlePaths` alongside aligned `bundleEntries`. `worldCurve` (`map-scene-model.js:4–7`) copies numeric node coordinates into fresh nested arrays. No post-initialize coordinate write, path reorder or path-array splice was found in the audited normal sources. Dispose leaves the old path properties present until another initialize replaces them; a cache keyed only by scene object is insufficient across generations.
- **Implicit path IDs:** edges use their stable array index, not a separately immutable identifier. Bundle IDs index the scene's filtered bundlePaths/bundleEntries, not arbitrary map-edge IDs. `buildWorldPaths` enumerates paths in order, packs that ID plus endpoint flags into point w, and makes one range record per path. Different kinds and fidelity buckets need distinct model/range association even when outer path identity is shared.
- **Worker boundary:** `geometry()` retains `pending.paths` as the main-thread reference and posts `{request,paths,scale}` without transferring paths (`map-webgl-scene.js:63–68`). The Worker receives a structured-cloned input, constructs Float32 points/joins/ranges and transfers point/join buffers back (`map-scene-worker.js:3–8`). No main-thread path content-version is attached. Normal sources do not edit those paths while waiting; a hypothetical edit could otherwise separate cloned tessellation from later endpoint metadata read through pending.paths.
- **Construction writes:** `buildWorldPaths` writes newly allocated coordinates/ranges, Float32 points/joins and optional Uint32 instances (`map-scene-model.js:23–46`). `flattenBezier` creates subdivision rows/output and reverses a newly built local right array; it reads original controls without rewriting them. Returned endpoint aliases are read and copied into packed numeric coordinates, not subsequently assigned through.
- **Upload and retained aliases:** `SceneEdges.upload` (`map-scene-edges.js:63–70`) shallow-spreads geometry, retaining the same ordinary mutable `ranges`, but explicitly sets **model.points/joins/instances=null**. It uploads the argument's point array as RGBA32F, joins as RG16F and new Float32 endpoint/length metadata as RGBA32F. A bounds prototype must capture/validate its required payload while the geometry argument exists; model.points cannot provide it afterward. No production post-upload rewrite of range numeric fields or these three geometry-texture contents was found. The model object itself does change: texture handles during upload, constructionMS after upload, released on cleanup.

These arrays/records are not frozen, sealed or content-versioned. Typed arrays also remain mutable while owned. “No audited normal writer” is the established fact; “JavaScript or GPU contents cannot change” is not.

## Exact ordered-ID lifetime

All scene style-ID writers are together in `WebGLMapScene.controls()`:

1. `map-webgl-scene.js:94` returns immediately when its selected control key matches.
2. At95, a new key is recorded and every previous group is released/cleared **before** list replacement.
3. At98, visibleEdges, ghostEdges, ancestorEdges, descendantEdges are replaced with new arrays and byCol with a new map.
4. At100, a single `map.edges.forEach` pushes edge IDs in original map-edge order; byCol's per-collection lists are newly created/pushed here. No sort/splice/reverse or later in-place ID assignment was found.
5. `draw()` calls controls before building/using groups (`:111–129`). `group()` enumerates a chosen list synchronously and uploads a fresh Uint32 index buffer (`:83–90`; `map-scene-edges.js:72–75`). It caches by model/style and coverage. Controls changing again release cached groups first. Pure pan may replace a coverage group while retaining the unchanged ID list; the old group is removed from the cache.

The Canvas painter's local `byCol` at `graph.js:711` is a separate per-paint variable, not this scene map. A control-key match is not a list fingerprint: direct external same-count replacements are not detected, but **there is no normal source writer performing them**. A new control key rebuilds groups/lists as one synchronous sequence, rather than mutating an old list during its bind.

## Synchronous union/bind callgraph and real reentry sites

The exact composition audited is the original `SceneEdges` class, the accepted chunked wrapper and f8's curve subclass—not an arbitrary `Original` class supplied to the factory.

`WebGLMapScene.draw → controls → group → SceneEdges.union → ensureMask → tile loop → this.bind`

For f8, the last call is:

`CurveBoundsEdges.bind → descriptor/supported/ensureScratch → visitCurveMembership → local accept(box)/emit → local flush → gl.bufferSubData → Original.prototype.bind`

- `visitCurveMembership` (`f8 runtime:24–33`) reads d.ids/d.paths/ranges and invokes only the locally supplied box/emit closures from bind (`:77`). These closures write scratch.cpu, counters and GL state; they do not assign IDs or path coordinates. Curve validation/extrema construction writes only owned metadata at upload, not the borrowed originals. Its own fault hook (`:75`) can change map.k or release/null a group buffer, then throws; it has no style-ID/path callback and is inactive without deliberate injection.
- `SceneEdges.union/bind` (`map-scene-edges.js:78–104`) are synchronous loops with no await, yield, dispatchEvent, timer/RAF execution, controls call or Worker-message processing. They call GL binding, uniform, texture-sampling draw and mask operations; no JS callback is passed to a GL method. The normal source provides **no explicit route from those calls back to the ID/path writers**. Ordinary queued callbacks do not enter this synchronous stack through an explicit event-loop yield. This source audit does not claim arbitrary replaced GL methods or browser-native reentrancy impossible.
- **Real synchronous callback site:** `ensureMask` calls SceneBudget reserve/release. `SceneBudget.release` (`map-scene-gl.js:30`) immediately invokes its stored cleanup; reserve can evict owners (`:19–27`). Audited cleanups delete resources, change model.released/resource sets, or invalidate optional metadata/scratch. They do not edit path coordinates or ordered ID lists. Current-model eviction is disabled before draw; metadata priority-drop remains possible and must cause valid fallback, not an immutability assumption.
- Existing `map-paired-atlas-observer.mjs:31–34` wraps texImage2D/texSubImage2D only for atlas logging/hashing. It does not wrap bufferSubData with an ID-mutating callback. Resource observers append diagnostics and call the same audited cleanup chain; they introduce no ID/path writer. A Deep probe replacing bufferSubData with a JS callback that changes ids is a new reentrant writer, outside this pinned composition.
- Worker messages/prewarm promises, RAF/input/resize/theme/font/context callbacks are outside this synchronous stack. Geometry callbacks check dead/generation/request; MapView.draw schedules RAF rather than recursively drawing. Context loss can dispose resources and font/input events can request another frame, but their normal handlers do not rewrite ID arrays or world controls inside bind. A context loss or resource release still invalidates owner/liveness assumptions independently of ID stability.

## What the guards establish—and do not

Scene generation rejects stale Worker replies and separates initialize/dispose lifetimes (`map-webgl-scene.js:49–59,138–141`). Request serials/pending entries associate an answer with one requested kind/scale/path reference. They do not fingerprint path coordinates. ControlKey includes selected controls/focus/theme, not paths, IDs, model ranges or uploaded payload. Group reuse checks model identity/released state/coverage, not membership contents. Width/cap do change normally between draws (`:116–126`), so a screen bound must use current view/style rather than an upload-time style assumption.

The accepted alternate live guard checks model/group refs, generation/control/view and scene group membership, but not path/range/ID contents. f8 adds explicit owner checks and counted range mapping snapshots/validation. This source audit confirms that addition is an explicit validation step, not proof from object identity. Neither variant fingerprints style-ID order; `count===g.count` cannot establish it under adversarial equal-count edits. The adversarial limit must remain disclosed.

The selected-shard preparation guard deep-compares paths and range records during that bounded hydration interval. The epoch snapshot hashes range start/count and records current scene/model/group state. These diagnostics do not freeze objects forever or prove arbitrary point/texture content equality during future operations.

**Supported premise:** for the exact audited normal writers/native GL composition, ordered IDs and path coordinates do not mutate between original group creation and synchronous bind. **Unsupported extension:** assuming that premise for arbitrary hooks/external in-place edits/other class implementations or future source changes, or advertising mutation resilience. Any prototype relying on it must state the boundary; broader supported domains require their own validation/invalidation or original-path bypass. No runtime change is proposed here, and no candidate numerical/native acceptance is implied.
