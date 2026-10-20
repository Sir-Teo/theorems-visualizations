# NEURO4.6 resting morphology contrast

The resting morphology was almost invisible because both voltage ramps began at `panel`, while the stage uses a nearby panel/background mix. This candidate changes only two call sites in `content/neuro/ch04-b.js`: branch color and soma fill now call `v.ramp(level,'orange','muted')`. The renderer's documented argument order is `(t,to,from)`. Level zero is now the existing muted foreground, level one remains the exact same orange, and the original interpolation and voltage normalization remain unchanged.

Private baseline alignment `29a9ea61` copied exact already accepted NEURO content from `6bdf1706`; **do not integrate that private alignment**. Integrate only this contrast candidate onto the accepted NEURO chain. Root independently confirmed no later NEURO source changes. The complete before archive is `/tmp/atlas-neuro-contrast/baseline`; its NEURO source is byte-identical to the accepted boundary.

`verification-neuro-compartment-contrast.mjs BASELINE CANDIDATE` guards all 27 NEURO files, all 36 whole written objects and functions, metadata, helpers, flags and the whole raw syllabus. Exactly the two specified function literals are exempted; every other byte is exact. Shared `core.js`, `math.js` and `share-state.js` are also byte-identical. Accepted prerequisites and source/review flags are preserved. This explicit audit is not a default historical snapshot test.

`verification-neuro-compartment-contrast-numeric.mjs BASELINE CANDIDATE` executes both actual visualization functions with the same deterministic drawing recorder. Across **96 frames**, two injection sites, meshes 200/25/6.25 µm, both norm/sqrt scales and eight clock values, every normalized ramp level, line endpoint/width, trace/convergence path, all other numerical drawing arguments and complete readout strings compare exactly after normalizing only the declared ramp origin. Baseline numeric digest: `87a2e7a537b6ec3840bee1f540c95a1db6186ae05bd306a07fe8f4faa3b1e8fb`. No numerical helper or model changes were made.

Fresh actual production-browser evidence compares baseline and candidate at **24 frames**: both themes, both color scales, resting clock0, before-injection clock.1 and positive-response clock.9. The complete numerical readouts and the two numerical trace/convergence canvas rasters are exactly equal for every matched state. All four real-control cases use restart, physical keyboard mesh edits, the offered color-scale control, a morphology pointer click and play/pause. Complete candidate statement/scope/proof/caption/readout fields fit at the actual 320px viewport (statement inner253px, prose288px), with no text-range overflow or TeX/runtime errors. All browser/server jobs closed.

At rest the canvas contains about 4,073 opaque baseline branch pixels at RGB(255,253,249) in light and RGB(22,26,33) in dark, against the nearby stage colors. The candidate has 4,008 opaque branch/soma pixels at the existing muted colors RGB(107,102,91) and RGB(162,158,148), respectively. I personally inspected **all 38 complete pictures** via ten sheets: the resting tree is clear in both themes and scales, the selected patch remains marked, and positive-response orange remains distinct. The native JSON records full pixel histograms, exact numerical readouts and both trace rasters. A first probe attempted to store a string in the selector's actual tuple-shaped saved state and was rejected; the probe was corrected to preserve its option-label tuple and change only its index. No runtime repair or malformed-state claim is inferred from that test-only mistake.

Strict candidate build: 0 errors/0 warnings, home112765 gzip bytes. Baseline strict build: 0/0. Static NEURO:36 items,0 errors/0 warnings. Evidence: `/tmp/atlas-neuro-contrast/{guard.log,numeric.log,build.log,baseline-build.log,static.log,native.log,native/native.json,native/sheets}`. No shared renderer, global inventory, source closure, mathematical prose, simulation, mesh, control or dependency change is included. Independent root peer is required before acceptance.

Reproduce explicitly:

```sh
node tests/verification-neuro-compartment-contrast.mjs BASELINE CANDIDATE
node tests/verification-neuro-compartment-contrast-numeric.mjs BASELINE CANDIDATE
node tests/verification-neuro-compartment-contrast-native.mjs BASELINE CANDIDATE OUTPUT
```
