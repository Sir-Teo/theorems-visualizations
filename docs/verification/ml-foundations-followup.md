# Machine-learning foundations follow-up

Resolves seven source flags: `ml-3.2a`, `ml-3.2b`, `ml-3.3`, `ml-3.3a`, `ml-3.4`, `ml-3.4a`, `ml-4.6a`. This batch owns `content/ml/ch03.js`, `content/ml/ch04.js` and dedicated audit files. Existing shared helpers and all chapter dependency arrays are preserved.

## Primary source

Shai Shalev-Shwartz and Shai Ben-David, *Understanding Machine Learning: From Theory to Algorithms* (2014), [authors' project](https://www.cs.huji.ac.il/~shais/UnderstandingMachineLearning/). The author's PDF endpoint returned an error document during retrieval; the complete authors' personal-use copy was obtained from the [University of Szeged mirror](https://www.inf.u-szeged.hu/~turan/ML-Konyv.pdf). This remains the authors' book, rather than a secondary summary. Its front matter notes small differences from the published pagination; the anchors below refer to this retrieved copy, whose printed and PDF Arabic page numbers coincide here. The original PDF is not added to the repository.

SHA-256: `c446eabd9212e9836a0f489bf537c4e75a15c42cbbd177bc3d405e63de728d13`. Retrieved 2026-10-18. Source pages 46 and 57 were rendered and inspected.

| Reviewed items | Source anchor |
| --- | --- |
| 3.2a | §3.2.1, (3.1)–(3.2), pp. 45–46 |
| 3.2b | Unnumbered Bayes-optimal-predictor discussion, p. 46; Exercise 3.7, p. 52 |
| 3.3 | Definition 3.3, p. 46; Haussler attribution in §3.4, p. 50 |
| 3.3a | §3.2.2, (3.3)–(3.4), pp. 48–49 |
| 3.4 | Definition 3.4 and measurability Remark 3.1, p. 49 |
| 3.4a | Remark 3.2, p. 49; Corollary 4.6, p. 57 |
| 4.6a | Corollary 4.6 and discretization Remark 4.1, pp. 57–58 |

The collection's decimal suffixes are its own numbering. The source supports joint-distribution risk, binary Bayes optimality, distribution-free agnostic PAC definitions, measurable general losses, specified larger output spaces, and a finite-description counting bound. No source-book proposition number is invented for Bayes optimality.

## Corrections to statements, proofs and pictures

- **Joint law and agnostic PAC:** Added the measurable/conditional-law setting and distinguished deterministic labels from realizability by a chosen class. Stated proper outputs explicitly, retained the all-distributions/i.i.d./confidence quantifiers, and qualified unattained minima. The noisy rectangle experiments formerly sampled a continuous distribution while calling grid approximations their true risks. They now sample and score the same explicitly stated 3600-atom probability law. Rectangle boundary indexing uses the actual centers rather than fragile floating `ceil` calculations. The displayed finite world remains an approximation to the continuous illustration.
- **Bayes predictor:** Replaced coarse quadrature by exact piecewise-linear integration, splitting at knots, user-rule cells and every half-probability crossing. The drawn lower strip is pointwise Bayes; the button now finds the best rule on 60 cells, which may still have positive excess. Red polygons use exactly the same split intervals. Restricted-class agnostic learning does not promise to achieve the unrestricted Bayes floor. Eta handles remain in [0,1], and only the upper prediction strip toggles cells.
- **Loss functions and general loss:** Zero–one loss now tests strict equality instead of an arbitrary tolerance, with an exact-alignment button and explicit rounded coordinate labels. Inputs stay within their displayed domains and plots expand for the actual line/data. General-loss definitions include measurability and proper outputs. Bounded hypotheses alone do not control squared loss with unbounded labels or instances. The pictured squared-regression and two-center worlds now use the same finite instance/noise laws for sampling and risk computation; their ERM solutions are independently checked. Histograms classify each round before binning, so a bin straddling epsilon no longer assigns the wrong color to some rounds. Their horizontal ranges include all observed values rather than folding tail values into an earlier final bin.
- **Proper/improper:** Specified the larger output space and extension of the same loss. Removed unsupported blanket equivalence, equal-sample-complexity and universal sample-penalty claims. A cell rule may lie outside the rectangle class; it is not required to do so. Removed a fixed universal error margin for 30-run averages. Such averages and failure fractions remain estimates.
- **Discretization:** The theorem compares against the best member of a fixed finite code class. It supplies neither a risk bound for replacing unrestricted real parameters nor an efficient ERM search. The example now uses exactly 2^b midpoint codes per coordinate, including a correct endpoint half-step error. A separate exact dyadic/BigInt calculation retains the nonzero 2^-65 error at x=1,b=64, even though the rendered double rounds the midpoint to 1. Actual floating-point code counting and the illustrative uniform fixed-point grid are distinguished. Grids above six bits are omitted with a label; no coarse grid is presented as the actual 64-bit lattice. The sample bound is affine in parameter count, with a confidence intercept.

Small related, **unflagged** wording repairs carry no queue-count reduction: 3.1 realizability is almost sure rather than pointwise everywhere; finite 500-run frequencies and 3.2 estimated quantiles can cross theoretical probability thresholds. In 4.6 the probability statement is for each fixed sample size, not a simultaneous claim for every point on every displayed curve.

## Reproducible checks

- `node --test tests/verification-ml-foundations.test.mjs`: **8/8**. Independent direct risk sums and exact atom sampling; exhaustive rectangle ERM and benchmarks for grids of size 2, 3, 6 and 10; exact-rational Bayes integrals, tie and crossing cases; threshold-straddling histogram colors; strict-equality regression; all 64 bit widths and endpoint errors; sample bounds; and all three general-loss ERM tasks.
- `scripts/verify-ml-foundations.py` generates `ml-foundations-references.json` independently using Python fractions and 100-digit mpmath arithmetic: **384** quantization cases, **180** description-length bounds, **15** rational Bayes worlds, and exact finite-regression moments. The production JavaScript helper is not used to generate these references.
- `node tests/verification-ml-foundations.mjs`: **14/14** real browser control groups across light/dark themes. Both noise models and sample/noise extremes; every one of 60 prediction cells and all three Bayes buttons; all three truths and PAC controls; both loss tasks, exact alignment and prediction/truth drags; every general-loss task and accuracy/confidence/sample extremes; both learning curves and resampling; bits 1,6,53,64 with actual grid counts, all accuracy/confidence/parameter corners and the 64-bit endpoint drag. Independently recomputed risks, empirical losses, red polygon areas and histogram counts match their actual displayed figures. No runtime, TeX or blank-stage failures.
- Targeted static check: **7 items, zero errors/warnings**. Scoped `git diff --check` is clean. Existing dependencies are preserved. No central ledger, master plan, package, global test entry point, build or commit is changed by this batch.
- Representative inspected screenshots: `/tmp/atlas-ml-bayes-dark.png`, `/tmp/atlas-ml-loss-light.png`, `/tmp/atlas-ml-improper-dark.png`, `/tmp/atlas-ml-quantization-light.png`.

The finite examples and numerical/browser checks validate these implementations; they do not prove distribution-free theorems or complete subjective human/listening gates. Arithmetic involving continuous piecewise-linear integrals is exact analytically up to floating rounding, not certified interval arithmetic. Pixel resolution cannot display a 64-bit midpoint grid.
