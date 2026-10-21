# Native curve edge gate — root result

All 32 native cases pass from immutable `292e0f2288f0fc7e688a50da52fd780965722213`, after source/PREPARE peer `896191f5f626b9a316d5470a3f4c98eaec30f49a` reviewed producer `83add753` plus closing successor `67a3e294`. [Independent saved-evidence review](map-curve-edge-native-independent-imaging-peer.md) passes at `b2dcdf284639c5a27be699cbd2b56e9488a71161`. No renderer or gate was changed during execution; no failed native attempt or retry occurred.

Root prepared the exact stage once with Node22.23.3, then ran:

```sh
MAP_CURVE_EDGE_ROOT_RUN=ROOT_AUTHORISED_CURVE_EDGE_PIXELS_2026_10_20 /tmp/atlas-ci-node22-20261020/node tests/map-curve-edge-tiny.mjs --run-root-only /tmp/atlas-root-curve-edge-prepared/prepared.json /tmp/atlas-root-curve-edge-native
```

Actual browser version is 155.0.8059.85. Native GL reports WebGL2, zero samples, no depth/stencil/antialias and ANGLE Metal Renderer: Apple M1. Each subject uses a fresh 128×96 logical GL context at DPR1/2, preserveDrawingBuffer=true, actual original SceneEdges/SceneBudget/builder and the exact f8 curve factory. There are 64 original/curve subjects, with each original succeeding before its alternate opens. Browsers, pages and the server are closed.

Sixteen healthy cases cross cap/dash/DPR/tile choices. Two cases each cover full-curve, empty, genuine 32768+1 tail, live replay, released-group abort, metadata denial, scratch denial and original priority. Every intended active branch has real nonempty submissions and positive successful counters. The tail is exactly 32768+1. Every pair has zero changed RGBA channels and maximum zero; the two released-abort references intentionally remain clear-only, proving no partial-mask composite rather than equivalence to a successful complete drawing. Denials/pressure require original fallback, and empty cases intentionally require no submitted indices. No such case is presented as a healthy optimized draw.

Actual original pressure allocates native storage and raises maximum logical peak to 63,995,904 bytes, within 64,000,000. Bounds/mapping views share the counted 24-byte/path backing; scratch CPU/GPU are separate fixed owners. All 64 contexts have zero cleanup budget, exactly one recorded explicit deletion per created object, no deleted-buffer rebind and observed context loss. This proves the recorded edge-context chronology, not MapView/Worker/context-restoration behavior or physical driver-memory release.

Root independently reopened every complete blob and transport piece: 198 pieces/9,303,224 bytes, checked lengths/SHA256/offsets/full coverage, all 32 exact pairs and all 64 cleanup/owner sums. Audit `/tmp/atlas-continuation/curve-edge-root-audit.json`. Complete results SHA256 is `069da16d199d051794abe95652dd5f9c205f82b49d468434e3836c10edd2b8de`. Raw outputs, source/prepared manifests and sibling logs remain at the paths above. Diagnostic/staging/fixture/submission arrays remain separately disclosed outside candidate logical ownership.

This is the small edge-only prerequisite for the separate current-light experiment. It does not resolve S2, certify the full current graph's fit/pixels, accept production or establish FPS. The pinned normal-writer premise and both unsupported style-ID mutation failures remain. Independent saved-evidence review and all six fresh quiet acknowledgements are now complete. Root will execute the separately staged current-light case; Wave5 remains gated.
