# Wave 5 ML chapter 5 — independent review

Reviewer validation, 2026-10-21. Scope: `content/ml/ch05.js`, `ch05.shared.js`, `tests/wave5-ml*`, and the author's `wave5-ml.md`. Read AUTHORING, the Statistics & data science field guide, and MASTER_PLAN §7.2. No historical review queue was reopened.

## Source and mathematical review

Independently consulted the authors' [official Understanding Machine Learning PDF](https://www.cs.huji.ac.il/~shais/UnderstandingMachineLearning/understanding-machine-learning-theory-algorithms.pdf), chapter 5, §§5.1–5.2 (PDF pages 60–64). Theorem 5.1 and Corollary 5.2 numbering, assumptions, constants and quantifier order agree. The two lettered entries faithfully explain unnumbered source concepts. The risk identity uses the source's convention including irreducible noise; replacing a minimum by an infimum correctly covers unattained optima. No universal U-shaped risk or monotone estimation-error theorem is asserted.

The NFL illustrations correctly distinguish conditional unseen-label completions and a joint target/sample mixture from one fixed target's sampling law. A finite mixture's failure average supplies a fixed target with at least that failure probability. The distribution may change with sample budget. The infinite-domain corollary uses epsilon and delta strictly below the NFL thresholds. The randomized-learner extension now expressly includes learner randomness in the probability.

## Independently executed checks

These checks do not rely only on the author's test assertions:

- Enumerated every binary target and every ordered iid sample for m=1,2,3 (8, 256 and 13,824 worlds), directly counted memorizing-learner errors, and matched every probability in `nflLaw` to tolerance 1e-12.
- Built a separate binwise oracle by filtering samples into each bin and directly comparing both label losses. Compared true risk, best class risk, training risk and excess risk for 1,620 fits: all six class sizes, noise 0/0.15/0.45, sample sizes 4/32/512, and seeds 1–30. Agreement within 1e-12, including the K16/K32 cases beyond the author's exhaustive binary-class tests.
- Instantiated the actual visualization's sharing adapter in a stub runtime. Eight malformed inputs (outer/inner holes including named-property disguises, invalid cells/labels, and excessive length) were rejected; four valid boundary cases passed. Six hundred synthetic clicks produced exactly 512 added examples, accepted by the same validator.
- Reran `node --test tests/wave5-ml.test.mjs` after fixes: all five tests pass.

## Visual review and fixes

Independently opened author screenshots for every item in both light and dark themes, covering 350px and 860px layouts: 5.1 light350/dark860; 5.2 dark350/light860; 5.2a dark860/light350; 5.2b light350/dark860. The first three items have clear diagrams, legends, controls and exact readouts; the training scatter's overlap honestly reflects repeated samples. The tradeoff plot initially clipped the zero-estimation line, and subsequently placed its xlabel across the low risk curve. Requested an external axis-label gutter; the author applied it. Independently inspected the final light350 and dark860 recaptures: zero curve, tick labels and external xlabel are now separate and legible.

Reviewer-requested fixes also included explicit randomized-probability wording and dense sharing-array validation. Both were independently rechecked and pass. The click cap agrees with the sharing limit.

Status: accepted for source, mathematics, computational honesty, state handling and visual presentation. The final captures meet AUTHORING §2: theorem-specific evidence, live controls, visible controlled quantities, legible quantitative readouts, honest computations, and clear light/dark rendering. Shared native browser matrix remains the root agent's gate.
