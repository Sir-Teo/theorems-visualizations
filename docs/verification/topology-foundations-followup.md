# Topology: covers, Cantor sets and compactification — 2026-10-17

Resolved `top-3.15`, `top-4.1`, `top-4.14` and `top-4.18`. **799 source reviews remain**, including four topology entries. Wave 5 remains gated.

## Primary text and source anchors

Compared the statements and proofs directly with James R. Munkres, *Topology*, second edition (Prentice Hall, 2000). Verified the title/copyright pages of the [276-sheet scan](https://raw.githubusercontent.com/enilsen16/The-Math-Group/master/Munkres-Topology.pdf), SHA-256 `bac788483e6ffd7932a8786d920690297cac59898e0f03a59b60d63d9645a0fd`. It contains two printed pages per PDF sheet. Rendered/OCRed the relevant sheets locally; the edition distinction matters because the initially located MIT-hosted scan is the first edition and has different numbering.

| Entry | Second-edition anchors | Result |
| --- | --- | --- |
| 3.15 | §23, Example 4 and Lemma 23.2, printed p.149/PDF sheet 82; §23 Exercise 5, p.152/sheet 84; §27 Exercise 6, p.178/sheet 97 | Rational irrational-cut separation, the definition of total disconnectedness, and Cantor-set construction/endpoints/compactness/no isolated points. |
| 4.1 | §26, definition and examples, p.164; Lemma 26.1, pp.164–165/PDF sheet 90 | Open covers and finite subcovers; equivalent ambient-open formulation for subspaces; the noncompact half-open interval example. |
| 4.14 | Theorem 27.7, pp.176–177/PDF sheet 96; §27 Exercise 6, p.178/sheet 97 | Nonempty compact Hausdorff spaces without isolated points are uncountable. The proof needs only the stated hypotheses and nested closed sets. |
| 4.18 | Theorem 29.1, pp.183–184/PDF sheets 99–100; definition/Example 4 and Theorem 29.2, p.185/sheet 100 | One-point compactification, uniqueness fixing the original space, noncompactness for density, compact-neighborhood formulation and the circle/sphere examples. |

Removed unverified historical priority/date credits from these four ordinary mathematical entries and replaced broad references with checked anchors. No original Borel/Cantor/Fréchet/Alexandroff-paper audit is claimed by this batch.

## Corrections

**Totally disconnected examples:** the initial handles were at arbitrary decimals, which need not lie in the Cantor set. They now snap on initialization and whenever the space changes; rational mode snaps to denominator 20 as its caption promises. Coarse construction intervals that straddle the separating cut remain neutral until their side is resolved.

**Compactness definition:** verified the open-endpoint treatment and greedy finite-subcover extraction independently. The random-cover slider counts subdivisions and generates one additional interval; its label now says so. The strict overlap needed to bridge the added neighborhood at zero is preserved—merely touching at an excluded endpoint does not cover that point.

**Uncountability construction:** the previous finite-stage midpoint generally lies in a removed middle third. The displayed candidate is now the selected interval's left endpoint, which is in the Cantor set, with its terminating ternary expansion. The caption separates this finite candidate from the limit determined by an infinite construction. Removed artificially widened interval bars that falsified the stated lengths at deep stages. Centered a zoom annotation that was visibly clipped. Replaced the proof's unnecessary appeal to later regularity machinery with the direct Hausdorff-neighborhood argument in the checked source.

**Compactification:** uniqueness is now explicitly up to a homeomorphism fixing X; the R^n example specifies n≥1. The plane viewport grows to include every displayed sequence term instead of silently omitting distant terms. Added the shaded spherical cap corresponding to the exterior of the compact disc. The readout specifies the Euclidean chord length on the unit sphere, avoiding ambiguity with differently normalized chordal metrics. The stereographic formula, inverse, pole limit and cap/exterior correspondence were checked algebraically and numerically.

## Independent and functional verification

Three new numerical tests pass:

- Greedy interval extraction agrees with an exhaustive minimum-subfamily search for 500 eight-interval families. The independent coverage oracle tests every interval endpoint and each intervening cell. Endpoint-only failures, every supported subdivision count with five seeds, and strict overlap at zero are included.
- Every pair of selectable level-6 Cantor endpoints has a separating removed gap (including pairs requiring stage 7). All 1,001 snapping probes return actual endpoints. Forty lists through all fourteen depths produce nested intervals of the stated lengths; the displayed endpoint has the stated ternary digits and avoids every listed point excluded so far.
- Both forty-term sequences satisfy the unit-sphere identity, inverse stereographic formula, Euclidean pole-distance identity and cap/exterior test. The outward sequence approaches the north pole; the inward sequence approaches the south pole.

Validation passed:

- `npm test`: 47 math, 20 science-kit and **51 content-verification tests**.
- `node tests/verification-topology-foundations.mjs`: eight light/dark scenario groups. Actual handle drags and mode-switch snapping; cover parameter endpoints/resampling; both Cantor lists at depth endpoints; both compactification sequences with all radius/count extremes and real sphere rotation. Every plane sequence point remains visible. No browser errors.
- Four-item light/dark checks: no runtime, TeX, blank or quality warnings. Inspected the Cantor-construction and sphere screenshots; corrected and rechecked the clipped annotation.
- Strict build and full static check: 6,684 items, 6,890 planned, 450 chapters and 6,621 visualizations; no warnings/errors.
- Six smoke routes pass with expected titles: chapters 3–4 and all four reviewed entries. These entries have no audio controls.

## Remaining topology work

Keep `top-4.11`, `4.12`, `4.13` and `4.16` flagged. Initial inspection identified missing nonempty scope and numerical extrema claims, sampled Lebesgue/local-continuity quantities presented too strongly, clipped inverse-function ranges, and a circular compactness argument. These require their own corrections and evidence; this batch does not clear them or infer their correctness from shared tests.
