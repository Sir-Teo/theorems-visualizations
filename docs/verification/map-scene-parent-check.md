# Independent persistent-scene check

October 19, 2026. The persistent WebGL scene remains an isolated experiment.
**Do not integrate it into production:** every matched case is slower than the
committed Canvas renderer. The full 60 fps gate remains open.

The [author report](map-scene-followup.md) and
[frozen measured cases](map-scene-performance.json) retain the 12-case coordinated
hardware diagnostic. Parent independently checked its completion, matching data,
baseline and injected graph-source hashes, actual Metal renderer probes,
FPS = 1000 / mean frame interval, all resource-component sums and the 64 MB owned
logical cap. No scene timing case fell back to Canvas. Maximum tracked owned
storage was 52,763,660 bytes; primary drawing storage and driver/backbuffer
limitations are separately disclosed.

Normal DPR-2 zoom/focus/pan measured 24.37/35.68/57.35 fps for the scene versus
51.47/59.92/59.89 for Canvas. Oversized results were 4.80/7.63/9.39 versus
13.45/60.21/14.21. These are single-host, light-theme bounded diagnostics with
statement bodies primed empty; they cannot establish performance of real loaded
statement panels or every map mode/device. Final rendering drains and settling
are explicit. In the slow oversized focus case there were only five frame
interval samples and three measured draws; its low cadence is a rejection signal,
not a precise universal estimate.

The artifact stores distribution **summaries** (sample count, mean, median, p95,
maximum), not the individual interval arrays. The author report's wording was
corrected accordingly. The raw JSON artifact remains unchanged: SHA256
`e9e60dd92334740ec74e0131aeae645ce6efaab35d6269f05104ca814f03df43`.

Parent independently reran the explicit-only correctness suites:

- `node --test tests/map-scene-model.mjs`: six geometry, visibility, fidelity,
  state-flag, independent Bernstein-sample and resource-eviction groups pass.
- `node tests/map-scene-painter.mjs`: four native font/node fixtures pass.
- `node tests/map-scene-edges.mjs`: four native stroke fixtures pass, including
  duplicate/crossing opacity, tiled masks and resource release.
- `node tests/map-scene-prototype.mjs`: 28 full-scene comparisons pass. Maximum
  mean channel difference is 1.20954/255; maximum fraction above 20/255 is
  1.96096%. This is bounded visual agreement, not pixel identity.
- `node tests/map-scene-lifecycle.mjs`: two theme groups pass, including actual
  context loss/restoration, exact Canvas-fallback pixels, retained state,
  unavailable/tiny-budget cleanup, 320 px sizing, oversized coverage and cold
  high-scale recovery. All 480 independent linear hit checks match; destruction
  releases tracked bytes to zero.

The parent runs used the later source checkpoint's rebuilt data, with 13,574
nodes and 23,078 edges, rather than claiming to repeat the older 23,076-edge timing
snapshot. Current index SHA256 is
`bf1b28a2fa31303846f37f1f456fbfc9bad6620a6fc89b3407811020ad7d25ca`;
planned data is
`67bff095ffb81c4424bb8227034cc690cc8f03a98bac4967146be61dfb0b3645`.
The frozen artifact identifies its own older hashes. Parent inspected current
light overview, dark selected/hover and dark native-font fixture screenshots.
The “overview” comparison uses a specified local zoom, not a world-fit picture.

Production `graph.js` retains SHA256
`9a8850528193c87e97deba14a387bebff3215e9e67569c125cac265e061f94fc`.
The app does not import the prototype; only explicit test/profiling rewriting
activates it. Its six model tests are outside the default test glob. The combined
source checkpoint remains 1,453 default tests; these extra checks are reported
separately. No production-renderer change or new source-review closure is claimed.

Logs: `/tmp/atlas-root-map-scene-{model,painter,edges,prototype,lifecycle}.log`.
Future GPU-counter or layer-cache experiments need their own data/protocol hashes
and validation. Their concurrent profiling results are not part of this frozen
matched timing claim.
