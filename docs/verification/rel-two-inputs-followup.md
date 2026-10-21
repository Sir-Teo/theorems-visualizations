# REL rank-nullity and differentiated metric inputs

Producer scope is REL3.2 and REL3.5 only. The exact accepted REL baseline is coordinator `efc3345` (full hash in evidence); this private tree's alignment `be7e599` is not an integration commit. The prerequisite-only commit is `e4bf3e16de02c4f91eca693fe426b908bde0ca29`; the separate inherited magnitude/zero-case correction is `70b7f3ded1b33004363deb623e5f9c952fef853e`. Independent acceptance is still required. No source status, global inventory, shared runtime or map code changes.

The two new directed prerequisites are REL3.2 → LADR3.21 and REL3.5 → PMA5.3, physics → math. Reading the complete actual target statements and proof ideas confirms their hypotheses and concrete use. LADR3.21 extends a kernel basis to a domain basis, proves the remaining images form a range basis and counts dimensions. For nonzero A, the Minkowski pairing defines a nonzero linear functional on R4; its image is R, hence its kernel has dimension three. The appended argument separately treats A=0 (dimension four), nonzero members of a timelike vector's rest-frame kernel (spacelike), B=0, and planar coordinate-axis cases where the old ratio is undefined. It does not claim every nonzero functional has a spacelike kernel: the timelike hypothesis is essential.

PMA5.3's statement gives the sum/product derivative rules; its proof splits a product increment, divides by the increment and uses differentiability's continuity consequence. Applying that rule to each differentiable proper-time component of the constant inertial-coordinate metric gives twice the Minkowski pairing of velocity and acceleration. This is a genuine direct derivative step, distinct from REL3.4's existing chain-rule conversion of coordinate time. The paragraph explicitly excludes silently differentiating a coordinate-dependent metric as though its coefficients were constant.

REL3.5 inherited a signed formula for a nonnegative magnitude and omitted the zero exception in its proof. The separate correction changes the statement to gamma cubed times the absolute lab acceleration, retains the signed four-vector components, and keeps the absolute value when taking the square root. The caption visibly explains that the unchanged blue graph and alpha readout use the signed one-dimensional rest-frame component, whose absolute value is the accelerometer magnitude. All visualization/helper function bytes remain unchanged, including the existing signed oscillator. Positive, negative and zero cases are tested; a positive default slider alone would miss the issue.

Read-only inventory comparison, using the build's normal alias resolution, is **23/24/46 → 25/26/48** (written-to-written / written-to-known / whole syllabus). No other crossfield edge is added. Both complete raw item dependency arrays and their syllabus rows append exactly one target, preserving order and all existing entries. No bridge card references either changed ID, so there is no bridge edit.

The explicit snapshot guard compares all **57 full REL objects, 57 visualization functions, all helper/collection bytes and 156 full raw syllabus rows**, allowing only two appended idea paragraphs/dependencies and the exact bounded REL3.5 statement/idea/caption correction. Existing accepted wraps, flags, captions elsewhere, source annotations and executable behavior are preserved. It is explicit-only so later accepted review status changes do not break default math tests.

Four independent math groups pass: 624 nonzero integer Minkowski functionals with an explicit independent kernel basis plus the zero functional; boosted rest-frame complements with null/zero exceptions; componentwise product differentiation for one-dimensional and changing-direction four-velocities plus a variable-metric counterexample; signed lab accelerations and actual oscillator comparisons including negative, positive and vanishing cases. The first local test run exposed JavaScript negative zero in an exact equality assertion; the test now compares numeric equality and the complete suite passes. No content change followed that test-only correction.

Strict build: 6684 written / 6890 planned / 450 chapters / 85 collections, zero errors/warnings; home 112713 bytes gzip for this private combined tree. REL static: 57 items, zero errors/warnings. These are bounded producer checks, not an integrated full-default checkpoint.

After the coordinator explicitly closed its capture window, all native gates passed: four actual production states (two items × both themes), four controlled full-text states at an exact 253px measure, and six native signed-slider states (positive, negative and near-zero × both themes). No overflow, TeX, runtime or blank error was found. All 24 complete statement/scope, proof and caption output images and all six full caption/visualization/control/readout images were personally read in six full-resolution contact sheets. The text/proof captures are complete, with the longest controlled proof 994px high. No wrap successor was needed. Neither item has a scope field; the harness includes it if present. The original signed graph title and alpha notation are retained; its preceding visible caption explicitly defines that signed convention and the absolute-value relation to magnitude. Native time ticks of 0.01 cannot exactly represent pi/(2 omega); the near-zero UI sample is t=1.96 with signed acceleration about 0.024, while exact zero lab acceleration is tested independently in the math suite. All browsers closed after the captures.

Reproduction from this producer tree:

```
node --test tests/verification-rel-two-inputs.test.mjs
node tests/verification-rel-two-inputs-preservation.mjs /tmp/atlas-rel-two-inputs/before
node scripts/build.mjs --strict
node scripts/check.mjs rel --static
node tests/verification-rel-two-inputs-native.mjs
node tests/verification-rel-two-inputs-text253.mjs
node tests/verification-rel-two-inputs-signed-native.mjs
```

Evidence and its exact SHA-256 manifest are retained at `/tmp/atlas-rel-two-inputs` and in `rel-two-inputs-evidence.json`. No performance benchmark is part of this task.
