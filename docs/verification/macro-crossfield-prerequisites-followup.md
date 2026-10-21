# MACRO prerequisite producer — 20 October 2026

Sixteen genuine mathematical prerequisite edges were added to fifteen existing written ideas and the exact corresponding syllabus rows. Read-only inventory moves MACRO from **9 written / 12 known / 15 whole-syllabus** crossfield edges to **25 / 28 / 31**, with no unknown targets. These are producer figures pending separate immutable peer review and coordinator acceptance. No source closure, model change or financial recommendation is made.

All actual target statements and proof ideas were read with the full relevant consumer statements, arguments, captions, scopes and executable models. The prose explains the consumed result and its hypotheses rather than adding topic-only links.

| Consumer | Added target(s) | Actual argument input |
|---|---|---|
| 1.10 | pma-8.6 | Logarithms turn positive constant proportional growth into a line; their inverse solves future doubling time. |
| 2.9 | pma-3.26 | Discounted expected income persistence is a convergent geometric sum; annuitization gives the displayed shock coefficient. |
| 2.11 | pma-5.15 | Taylor expansion of the certainty CRRA log-growth ratio gives the small-rate linear rule and its order of error. |
| 2.12 | prob-4.1.9; prob-4.1.14 | Conditional linearity reduces quadratic marginal utility to a consumption martingale. Taking out a known predictor yields the zero predictable-change moment underlying the regression claim. |
| 2.4 | pma-9.23 | The probability-preserving affine unemployment map is a contraction on the complete interval [0,1], including alternating convergence. |
| 2.5 | pma-5.3 | Product/quotient differentiation gives explicit strictly negative first and positive second derivatives of the stated Beveridge curve. |
| 3.6 | pma-5.3 | Quotient differentiation of capital per worker produces population dilution. |
| 3.7 | pma-5.3 | Product and quotient differentiation of effective labour produces technology plus population dilution. |
| 3.8 | ode-1.5 | The locally linearized Solow deviation solves scalar exponential decay and supplies the half-life. |
| 3.9 | pma-8.6 | Product logarithms and the log derivative yield continuous Cobb–Douglas growth accounting, separately from the chart's finite-interval approximation. |
| 3.10 | ladr-6.61 | Unique closest orthogonal projection gives the partialled-out least-squares coefficient used by the actual residualized plot. |
| 4.1 | ode-3.5 | Distinct opposite-sign Jacobian eigenvalues give local exponential eigenmodes and the actual stable-arm seed. |
| 4.2 | pma-8.6 | The positive OLG map becomes a scalar geometric recursion in log deviations; inverse exponentiation gives global positive convergence. |
| 4.3 | ode-1.5 | The constant-parameter AK capital equation solves by exponential growth/decay, preserving initial relative gaps. |
| 4.6 | ode-1.5 | In the uncapped log-response regime, deviations of log income from balanced income solve exponential decay between technology jumps. |

The conditional uses are deliberately bounded. Geometric income sums use positive interest and convergent discounting in the displayed persistence range. The Euler small-rate expansion is under certainty; the Hall predictor moment assumes integrability, and unique population regression slopes require finite second moments and nonsingular regressor covariance. The contraction uses genuine transition probabilities and 0<s+f<2. Effective-labour differentiation does not prove Uzawa's separate characterization. Projection does not identify a causal growth coefficient. Local saddle eigenmodes do not certify nonlinear optimality or transversality. The OLG argument is the existing full-depreciation/log-utility specialization. The Malthusian linear equation ceases to apply when the demographic cap binds. No inherited empirical or historical claim is newly certified.

The tempting `stat-12.10` Frisch–Waugh dependency was rejected because that item is planned and has no actual authored proof to read. The written closest-projection theorem ladr-6.61 is consumed instead: the new paragraph derives the residualized slope from minimization, matching the model's existing computation.

## Inherited raw-row repairs

Three syllabus rows omitted existing written dependencies. Their full lists are now synchronized, without changing those existing written dependencies or awarding extra written-edge credit:

- **1.8:** `[] → ['stoch-4.1']`. The actual stationary-distribution target defines πP=π and proves invariance; the existing labour-flow argument explicitly solves this stationary balance.
- **1.10:** the row now includes its already-written `demo-1.4`, as well as the newly added pma-8.6. The argument explicitly uses exponential population/income growth and the doubling calculation developed there.
- **2.4:** the row now includes its already-written `pma-3.26`, as well as the newly added pma-9.23. The new explanation makes clear that the Banach proof bounds differences using the nonnegative absolute geometric ratio, so it also handles a negative signed recurrence coefficient.

Every one of the **48 complete raw written item dependency lists** now equals its full syllabus row. Complete before/after arrays for all sixteen affected rows, mapping and SHA256 hashes of all thirty proof screenshots are in `macro-prerequisites-evidence.json`. No unrelated syllabus field changed.

## Verification and preservation

Baseline snapshot: parent `b8d4f2e29a8b64f2e595155679b1e7a024e35eb6`, MACRO content archived at `/tmp/atlas-macro-prereqs/content/macro`. Evidence root `/tmp/atlas-macro-prereqs`.

- `MACRO_PREREQUISITES_BASELINE_ROOT=/tmp/atlas-macro-prereqs node tests/verification-macro-prerequisites-preservation.mjs`: **all 48 full objects and all 48 visualization functions** preserved, except fifteen append-only ideas and sixteen exact new deps. Every other statement, caption, scope, reference, property, source flag, private helper and shared/metadata file is unchanged. Complete syllabus permits only the stated rows. All 48 full raw item/row lists agree (`guard.log`). This audit requires an explicitly supplied baseline; it is not a default frozen-content or review-status test.
- `node tests/verification-macro-prerequisites-math.mjs`: **30,899 assertions** (`math.log`). Finite witnesses cover logarithmic growth/doubling, finite geometric sums with exact tails, certainty Euler Taylor bounds, conditional finite trees and known-predictor moments, all-grid probability-preserving signed contractions, matching-curve derivative checks, positive product/quotient dilution, local Solow derivatives, and uncapped Malthusian log dynamics. Actual production helpers are checked against independent calculations: constant-share endpoint growth accounting, residualized-vs-full regression coefficients on both actual all-country/OECD samples, RCK Jacobian eigenpairs, and positive OLG log recursion. These numerical witnesses accompany proof review rather than proving the general theorems or empirical claims. All **4 existing optimal-growth tests pass** unchanged (`existing-math.log`).
- `node tests/verification-macro-prerequisites.mjs`: **30 fresh native cases** at actual **320px**, fifteen changed proof ideas in light and dark (`native.log`, `native/`). Actual mounted visualization runtime/TeX/blank checks and text/math bounds pass. I personally inspected all thirty complete own proof outputs: readable text and mathematics, no clipping or horizontal overflow. Full-page outputs are retained too. This is changed-text/default-visualization verification, not recertification of every inherited interaction. Browser closed.
- `node scripts/build.mjs --strict`: **6684 written / 6890 planned / 450 chapters / 85 collections, 0 errors, 0 warnings**, home **112723 bytes gzip** (`build.log`). `node scripts/check.mjs macro --static`: **48 items, 0 errors, 0 warnings** (`static.log`). `git diff --check` passes.
- Read-only inventory confirms **25/28/31**, unknown zero (`counts.log`). No inventory file was written. Existing bridge files contain no MACRO step references, so no touched bridge needs updating. No global ledger, queue, flags or shared runtime was edited.

Independent immutable proof/model/native/own-pixel review remains required before acceptance. This prerequisite batch does not close historical-source obligations or widen economic model scopes.
