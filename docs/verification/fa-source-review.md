# FA chapters 5–13: source verification ledger

The source is Walter Rudin, *Functional Analysis*, second edition (1991), full PDF at https://59clc.files.wordpress.com/2012/08/functional-analysis-_-rudin-2th.pdf, retained at `/tmp/atlas-rudin/fa.pdf`. Printed page = PDF page − 17. The full PDF SHA-256 is `01f4ada9c9e0ed17dcb64c4a257b53e38d194cd53ed7141819d0f31578a683ef`. Source headings and full surrounding text are being reviewed; heading matches alone do not close a flag. The machine-readable ledger `fa-source-alignment.json` lists all 180 assigned flagged items, existing titles, exact source pages and the actual source opening paragraphs. Chapters5–11 close129 original flags. Eighteen missing numbered source sections/results and two derived consequences are restored across this review. Chapters12–13 are assigned to the climate reviewer; their51 original flags remain pending in this ledger until that separate review completes.

Existing IDs/URLs are preserved. Where the existing content describes another result, its statement and picture must be replaced at that stable source ID. Some late FA chapter files mention `verify: true` in a header comment; those 27 comments are not additional item flags.

## Chapter 5 repaired source mismatches

| Stable ID | Existing content | Actual numbered Rudin content | Required repair |
| --- | --- | --- | --- |
| fa-5.3 | L2-closed lacunary span | L1-closed span is closed in L4, pp.118–119 | Restore L1 closure and both norm inequalities |
| fa-5.4 | Vector measure/atom definition | Prescribed square-summable Fourier data on a Sidon set extend to an L-infinity function, pp.119–120 | Replace statement and add matching constructive finite-data illustration |
| fa-5.8 | Null-set interpolation | Polynomial approximation on compact sets with nonseparating complex fibers, pp.123–124 | Replace; actual null-set interpolation is5.9 |
| fa-5.9 | Pointwise weighted interpolation | Norm-preserving null-set interpolation, pp.124–125 | Make source theorem primary; weighted extension is Exercise3, p.145 |
| fa-5.10 | Affine/equicontinuity definitions | Solvable Pick–Nevanlinna data have a finite Blaschke solution, pp.125–126 | Replace |
| fa-5.15 | Continuous projections only | Algebraic projections, continuity is extra, p.133 | Correct definition |
| fa-5.17 | Phillips c0 noncomplementation | Jointly continuous group action by linear operators, p.134 | Replace |
| fa-5.19 | General invariant multiplier theorem | H1 and disc algebra noncomplementation examples, pp.136–137 | Replace using existing5.20 illustration; correct kind to Model |
| fa-5.20 | H1 and disc algebra noncomplementation | Quantitative bounded decomposition X=A+B, pp.137–138 | Replace |
| fa-5.22 | Sum of Poisson kernels | Abstract l1 representation from a norming sequence, pp.138–139 | Restore abstract theorem; Poisson theorem belongs at5.21, currently missing |
| fa-5.25 | Noncontracting semigroup definition | Translation-invariant finitely additive probability on every abelian group, pp.141–142 | Replace |
| fa-5.26 | Small slices/dentability | A norm-one functional with L(1)=1 is positive, pp.142–143 | Replace |
| fa-5.28 | Ryll–Nardzewski affine fixed point theorem | Schauder–Tychonoff continuous fixed point theorem, pp.143–144 | Replace |

All chapter 5 statements and complete relevant proofs (printed pp.117–144) were reviewed. The 13 demonstrated mismatches above are repaired at their stable book IDs; 5.21, previously missing, is restored. Antisymmetric algebra definitions do not require constants; projections need not be continuous; the group-action definition now includes joint continuity. Incoming prerequisites depending on the former meanings of 5.4, 5.10 and 5.19 were repaired. The Banach-limit display labels finite-prefix extrema as estimates and derives preset limit sets analytically rather than claiming a finite sample bounds all invariant means.

Six independent mathematical regressions pass in `tests/verification-fa5.test.mjs`: exact arc-integral Fourier data and norm bound, joint-polynomial approximation bound, Blaschke interpolation/boundary modulus/invalid data, nonunique bounded decompositions, polygon norming representations, and nonlinear fixed points outside the contraction regime. All 48 diagram/theme cases pass with actual local KaTeX and controls; all light/dark screenshots were inspected. Six targeted follow-ups also pass for the clipped fiber error plot, the interpolation reference and the violated Schwarz/holomorphy hypotheses. Browser evidence is `/tmp/atlas-fa5-browser.json` and `/tmp/atlas-fa5-shots`.

### Exact chapter 5 closures

- `fa-5.6` — source §5.6, printed p.121 and complete following proof.
- `fa-5.7` — source §5.7, printed p.121 and complete following proof.
- `fa-5.8` — source §5.8, printed p.123 and complete following proof.
- `fa-5.9` — source §5.9, printed p.124 and complete following proof.
- `fa-5.10` — source §5.10, printed p.125 and complete following proof.
- `fa-5.12` — source §5.12, printed p.128 and complete following proof.
- `fa-5.13` — source §5.13, printed p.129 and complete following proof.
- `fa-5.15` — source §5.15, printed p.133 and complete following proof.
- `fa-5.16` — source §5.16, printed p.133 and complete following proof.
- `fa-5.17` — source §5.17, printed p.134 and complete following proof.
- `fa-5.18` — source §5.18, printed p.134 and complete following proof.
- `fa-5.19` — source §5.19, printed p.136 and complete following proof.
- `fa-5.20` — source §5.20, printed p.137 and complete following proof.
- `fa-5.22` — source §5.22, printed p.138 and complete following proof.
- `fa-5.24` — source §5.24, printed p.141 and complete following proof.
- `fa-5.25` — source §5.25, printed p.141 and complete following proof.
- `fa-5.26` — source §5.26, printed p.142 and complete following proof.
- `fa-5.28` — source §5.28, printed p.143 and complete following proof.
- `fa-5.1` — source §5.1, printed p.117 and complete following proof.
- `fa-5.2` — source §5.2, printed p.117 and complete following proof.
- `fa-5.3` — source §5.3, printed p.118 and complete following proof.
- `fa-5.4` — source §5.4, printed p.119 and complete following proof.
- `fa-5.21` — newly restored theorem, printed pp.138–139; its abstract representation proof is 5.22.

No outstanding source mismatch is represented as verified.


## Chapter 6 closed source review

All 26 original flags close after reading complete source sections and proofs, printed pp.155–177 (the continuity corollary 6.6a uses 6.6(d)). Stable 6.14 now contains the BV/Stieltjes derivative example; 6.15 defines smooth multiplication and its Leibniz rule. The union-vanishing result is restored at 6.23, all four support clauses at 6.24, and the point-support converse at 6.25. The compact and global structure results are restored at 6.27 and 6.28. Convolution definitions are restored at 6.34 and 6.36; the complete translation/smoothness/support/associativity theorem is 6.35 and the five-clause distribution theorem is 6.37. Dependencies formerly tied to shifted meanings were repaired. The approximate-identity definition permits arbitrary compact support, matching the source.

Finite-sequence error samples no longer claim bounds over an uncomputed infinite tail. The product-convergence illustration distinguishes its sufficient order-one C1 convergence from the source's full C-infinity hypothesis, and identifies the tests that detect failure. The BV example actually evaluates the missing jump mass and dipole. `tests/verification-fa6.test.mjs` passes two independent regressions: actual diagram weak-derivative identities and the source Exercise24 counterexample showing why a single compact factor does not ensure three-factor associativity. All 54 diagram/theme cases and ten targeted hypothesis-control follow-ups pass with local KaTeX; all screenshots were visually inspected. Evidence is `/tmp/atlas-fa6-browser.json` and `/tmp/atlas-fa6-shots`.

Exact original closures:

- `fa-6.11` — source §6.11, printed p.157 and complete following proof.
- `fa-6.12` — source §6.12, printed p.158 and complete following proof.
- `fa-6.14` — source §6.14, printed p.158 and complete following proof.
- `fa-6.15` — source §6.15, printed p.159 and complete following proof.
- `fa-6.17` — source §6.17, printed p.161 and complete following proof.
- `fa-6.18` — source §6.18, printed p.161 and complete following proof.
- `fa-6.19` — source §6.19, printed p.162 and complete following proof.
- `fa-6.20` — source §6.20, printed p.162 and complete following proof.
- `fa-6.21` — source §6.21, printed p.163 and complete following proof.
- `fa-6.22` — source §6.22, printed p.164 and complete following proof.
- `fa-6.23` — source §6.23, printed p.164 and complete following proof.
- `fa-6.24` — source §6.24, printed p.164 and complete following proof.
- `fa-6.25` — source §6.25, printed p.165 and complete following proof.
- `fa-6.26` — source §6.26, printed p.167 and complete following proof.
- `fa-6.27` — source §6.27, printed p.168 and complete following proof.
- `fa-6.28` — source §6.28, printed p.169 and complete following proof.
- `fa-6.29` — source §6.29, printed p.170 and complete following proof.
- `fa-6.30` — source §6.30, printed p.171 and complete following proof.
- `fa-6.31` — source §6.31, printed p.173 and complete following proof.
- `fa-6.32` — source §6.32, printed p.173 and complete following proof.
- `fa-6.33` — source §6.33, printed p.173 and complete following proof.
- `fa-6.34` — source §6.34, printed p.174 and complete following proof.
- `fa-6.35` — source §6.35, printed p.174 and complete following proof.
- `fa-6.36` — source §6.36, printed p.175 and complete following proof.
- `fa-6.37` — source §6.37, printed p.175 and complete following proof.
- `fa-6.6a` — source §6.6a, printed p.155 and complete following proof.


## Chapters 7 and 8 closed source review

All 13 original Chapter7 flags close after complete source statements and proofs, printed pp.182–204. Restored every clause of7.19 and the pure-coordinate derivative hypothesis of7.25: mixed derivative assumptions are unnecessary. Corrected the normalized-measure factor in the exponential tempered-distribution probe and the beta-zero constant example. Plancherel errors are labelled finite-window samples; a sampled maximum is not a full-line supremum. The rational Schwartz counterexample now distinguishes its infinite order-two seminorm from a finite-window sample, and a small nonzero tail coefficient is not called faster asymptotic decay. Two regressions exercise the actual constant Sobolev and normalized exponential readouts. All32 item/theme cases and two final tail-caption follow-ups pass; every light/dark control screenshot was inspected.

All13 original Chapter8 flags close after complete source statements/proofs, printed pp.210–222. The numbered8.5 statement now includes Rudin's quantified torus estimate and its Hahn–Banach proof; its contour picture is explicitly an alternative one-variable illustration. Restored8.9(c),8.11(c), and the constant highest-order coefficient hypothesis in8.12, while distinguishing the broader extension that Rudin notes after the theorem. Ordinary-dx fundamental-solution densities are distinguished from normalized-measure densities. Fourier amplitudes and Sobolev integrals now use the declared normalized convention.

The compact-support projection button previously tried to invert a Gram matrix with dependent conjugate equations, producing NaN. It now projects onto an orthonormal basis of the constraint row space and scales all amplitudes together, preserving every constraint. Numeric residuals are not called a proof that an entire quotient exists. The elliptic lower bound now uses the exact quadratic eigenvalues and a proved exterior radius, instead of inferring an infinite-region certificate from sampled radii/angles. Tangent characteristic directions of rotated semidefinite symbols are detected analytically. Five independent regressions cover those computations, all three actual projection-button presets, and the actual normalized Gaussian H0 norm. All24 item/theme cases and16 targeted follow-ups pass, including failed ellipticity and the Gaussian norm; every light/dark control screenshot was inspected.

Evidence: `tests/verification-fa7*.mjs`, `tests/verification-fa8*.mjs`, `/tmp/atlas-fa7-browser.json`, `/tmp/atlas-fa8-browser.json` and their screenshot directories. Unsupported optional historical dates were removed; attribution names remain.

Exact original closures:

- `fa-7.8` — source §7.8, printed p.188 and complete following proof (letter suffixes are derived corollaries).
- `fa-7.9` — source §7.9, printed p.188 and complete following proof (letter suffixes are derived corollaries).
- `fa-7.10` — source §7.10, printed p.189 and complete following proof (letter suffixes are derived corollaries).
- `fa-7.11` — source §7.11, printed p.190 and complete following proof (letter suffixes are derived corollaries).
- `fa-7.14` — source §7.14, printed p.192 and complete following proof (letter suffixes are derived corollaries).
- `fa-7.15` — source §7.15, printed p.192 and complete following proof (letter suffixes are derived corollaries).
- `fa-7.19` — source §7.19, printed p.195 and complete following proof (letter suffixes are derived corollaries).
- `fa-7.22` — source §7.22, printed p.198 and complete following proof (letter suffixes are derived corollaries).
- `fa-7.23` — source §7.23, printed p.199 and complete following proof (letter suffixes are derived corollaries).
- `fa-7.25` — source §7.25, printed p.202 and complete following proof (letter suffixes are derived corollaries).
- `fa-7.1` — source §7.1, printed p.182 and complete following proof (letter suffixes are derived corollaries).
- `fa-7.5` — source §7.5, printed p.185 and complete following proof (letter suffixes are derived corollaries).
- `fa-7.6` — source §7.6, printed p.186 and complete following proof (letter suffixes are derived corollaries).
- `fa-8.7` — source §8.7, printed p.216 and complete following proof (letter suffixes are derived corollaries).
- `fa-8.7a` — source §8.7a, printed p.216 and complete following proof (letter suffixes are derived corollaries).
- `fa-8.12` — source §8.12, printed p.219 and complete following proof (letter suffixes are derived corollaries).
- `fa-8.12a` — source §8.12a, printed p.220 and complete following proof (letter suffixes are derived corollaries).
- `fa-8.4` — source §8.4, printed p.212 and complete following proof (letter suffixes are derived corollaries).
- `fa-8.8` — source §8.8, printed p.216 and complete following proof (letter suffixes are derived corollaries).
- `fa-8.9` — source §8.9, printed p.217 and complete following proof (letter suffixes are derived corollaries).
- `fa-8.10` — source §8.10, printed p.218 and complete following proof (letter suffixes are derived corollaries).
- `fa-8.11` — source §8.11, printed p.218 and complete following proof (letter suffixes are derived corollaries).
- `fa-8.1` — source §8.1, printed p.210 and complete following proof (letter suffixes are derived corollaries).
- `fa-8.1a` — source §8.1a, printed p.210 and complete following proof (letter suffixes are derived corollaries).
- `fa-8.3` — source §8.3, printed p.211 and complete following proof (letter suffixes are derived corollaries).
- `fa-8.5` — source §8.5, printed p.213 and complete following proof (letter suffixes are derived corollaries).


## Chapter 9 closed source review

All11 original flags close after complete source statements and proofs, printed pp.227–237. Stable9.10 now contains the actual preparatory log-factorial construction;9.11 contains the zeta argument. Stable9.13 now states Rudin’s homogeneous renewal uniqueness theorem for bounded Borel solutions, instead of an unrelated renewal-limit theorem. Its picture evaluates exact characteristic functions for uniform, irrational two-point and integer-supported measures. The integer-supported example supplies an actual nonconstant periodic solution when the noncyclic-support hypothesis fails. Incoming RCA9 links now target the corrected source identities9.17 and9.23.

Finite windows no longer certify infinite tail oscillation or convergence. Slow-oscillation presets use analytic whole-tail bounds; the alternating series extends its partial sums on demand. A tiny nonzero Fourier multiplier is not called exact annihilation. Coincident tone frequencies are combined before finding the spectrum, including cancellation and the zero wavepacket. Sampled least-squares approximations, convolution errors and zeta minima are labelled with their finite scope.

Five independent regressions pass in `tests/verification-fa9.test.mjs`: exact probability characteristic functions and lattice behavior; analytic infinite-tail oscillation bounds; the actual near-zero multiplier readout; Euler–Maclaurin zeta against independent positive-series bounds; and actual cancellation/zero-packet spectrum controls. All22 diagram/theme cases and eight targeted follow-ups pass with local KaTeX. Every light/dark control screenshot was inspected, including the lattice counterexample, failed slow oscillation and exact tone annihilation. Evidence is `/tmp/atlas-fa9-browser.json` and `/tmp/atlas-fa9-shots`.

Exact original closures:

- `fa-9.10` — source §9.10, printed p.231 and complete following proof.
- `fa-9.11` — source §9.11, printed p.232 and complete following proof.
- `fa-9.12` — source §9.12, printed p.233 and complete following proof.
- `fa-9.12a` — complete source statement/proof at printed p.234;9.12a is the prime-number-theorem consequence following9.12.
- `fa-9.13` — source §9.13, printed p.236 and complete following proof.
- `fa-9.3` — source §9.3, printed p.228 and complete following proof.
- `fa-9.2` — source §9.2, printed p.227 and complete following proof.
- `fa-9.4` — source §9.4, printed p.228 and complete following proof.
- `fa-9.5` — source §9.5, printed p.229 and complete following proof.
- `fa-9.6` — source §9.6, printed p.229 and complete following proof.
- `fa-9.7` — source §9.7, printed p.229 and complete following proof.


## Chapters 10 and 11 closed source review

All18 original Chapter10 flags close after reading the complete source statements, surrounding paragraphs and proofs, printed pp.245–271. Stable10.4 now contains the complex-scalar/homomorphism discussion;10.5 the actual invertibility/character definition;10.17 the inverse-norm blowup lemma;10.23 surrounding contours;10.31 the polynomial/Hermite reduction theorem. Missing numbered10.6,10.11,10.16,10.19,10.20,10.24,10.25,10.32 and10.33 are restored. The valuable disconnected-spectrum idempotent consequence remains at10.31a, explicitly tied to Exercise17, printed p.273. Complete multiplication identities are restored at10.22, the function-algebra isomorphism at10.27, the positive-spectrum root clause at10.30 and the torsion-free commutative quotient at10.34. The source proof of10.35 now uses compactness plus spectral radius, without the former unsupported eigenvector inference.

All26 original Chapter11 flags close after complete source statements/proofs, printed pp.275–301. Stable11.1 is the ideal definition;11.2 the proper-ideal/closure proposition;11.8 the Gelfand-transform/topology/radical definition. The B* definition is restored at11.17. Stable11.22 is the double-centralizer theorem and11.25 the maximal-normal-set theorem; the positive cone consequence moves to11.28a. Stable11.27 defines positivity. Stable11.33 is the three-way equivalence of multiplicativity, the square identity and extremality for positive subprobability functionals, including zero and without a symmetric-involution assumption; the positive-measure correspondence is restored at11.32. Missing11.6,11.7,11.19,11.20,11.21 and11.24 are restored as well. The11.20/26 proof handles discontinuous involutions via the radical and maximal normal sets; applying such an involution under a contour integral would be invalid. The11.31 statement now includes every source clause: boundedness holds in every Banach algebra with any involution, with sharper commutative and continuous-involution bounds.

Computational repairs include the false claim that nonzero even winding forbids a square root; reversed subalgebra labels; false claims of monotone spectral-radius convergence; noncommutative polarization in the GKZ proof; nearly coincident ideal zeros and small character values being called exact zeros; near-unit-circle points being called two-sided characters; an extra unintended cosine zero; and a sampled trigonometric minimum being treated as a positivity certificate. The Herglotz quadratic minimum is now exact, detecting negative dips between the old angular samples. The quotient representative uses a Lipschitz upper bound so clipping preserves its coset. Finite least-squares, spectral-max and winding samples are labelled with their scope. Unsupported historical dates were removed.

`tests/verification-fa10.test.mjs` passes3 independent regressions for matrix inverse blowup, Hermite interpolation against a separately summed exponential, and the actual even-winding root readout. `tests/verification-fa11.test.mjs` passes6 for the continuous trigonometric minimum, extreme subprobability vertices, the actual near-circle character control, the actual near-coincident/extra-zero ideal cases, Wiener inverse Fourier coefficients on both sides of the circle, and the actual small-but-nonzero character value.

All54 Chapter10 and60 Chapter11 diagram/theme cases pass with local KaTeX and real controls. Twenty Chapter10 and16 Chapter11 targeted follow-up cases also pass, including violated perturbation/contour hypotheses, values-only interpolation, a failed Bezout identity, a nonnormal-set probe, zero functionals, exact character zeros and Wiener nonvanishing failure. Every light/dark control screenshot was inspected. Evidence is `tests/verification-fa10-browser.mjs`, `tests/verification-fa11-browser.mjs`, `/tmp/atlas-fa10-browser.json`, `/tmp/atlas-fa11-browser.json` and their screenshot directories. Static checks for both chapters report0 errors and0 warnings.

Incoming FA10–11 dependencies were audited after restoring numbered meanings. RCA18 links target the root review’s corrected identities; the L1-character link targetsRCA9.23. The external random-Fourier-feature dependency in `deep/syllabus.js` needs11.32 rather than11.33; the root reviewer was notified and owns that external repair.

Exact original closures:

- `fa-10.10` — complete source section and proof, printed p.252.
- `fa-10.12` — complete source section and proof, printed p.253.
- `fa-10.13` — complete source section and proof, printed p.253.
- `fa-10.14` — complete source section and proof, printed p.255.
- `fa-10.17` — complete source section and proof, printed p.256.
- `fa-10.18` — complete source section and proof, printed p.256.
- `fa-10.22` — complete source section and proof, printed p.259.
- `fa-10.23` — complete source section and proof, printed p.259.
- `fa-10.26` — complete source section and proof, printed p.261.
- `fa-10.27` — complete source section and proof, printed p.262.
- `fa-10.28` — complete source section and proof, printed p.263.
- `fa-10.29` — complete source section and proof, printed p.263.
- `fa-10.30` — complete source section and proof, printed p.264.
- `fa-10.31` — complete source section and proof, printed p.265.
- `fa-10.34` — complete source section and proof, printed p.268.
- `fa-10.35` — complete source section and proof, printed p.269.
- `fa-10.4` — complete source section and proof, printed p.248.
- `fa-10.5` — complete source section and proof, printed p.249.
- `fa-11.9a` — complete source section and proof, printed p.284; derived from11.9 and11.13(d), with the following Runge discussion.
- `fa-11.13` — complete source section and proof, printed p.283.
- `fa-11.14` — complete source section and proof, printed p.287.
- `fa-11.15` — complete source section and proof, printed p.288.
- `fa-11.18` — complete source section and proof, printed p.289.
- `fa-11.29` — complete source section and proof, printed p.296.
- `fa-11.31` — complete source section and proof, printed p.296.
- `fa-11.10` — complete source section and proof, printed p.281.
- `fa-11.11` — complete source section and proof, printed p.282.
- `fa-11.12` — complete source section and proof, printed p.282.
- `fa-11.16` — complete source section and proof, printed p.288.
- `fa-11.22` — complete source section and proof, printed p.293.
- `fa-11.23` — complete source section and proof, printed p.293.
- `fa-11.25` — complete source section and proof, printed p.293.
- `fa-11.26` — complete source section and proof, printed p.294.
- `fa-11.27` — complete source section and proof, printed p.294.
- `fa-11.28` — complete source section and proof, printed p.294.
- `fa-11.30` — complete source section and proof, printed p.296.
- `fa-11.33` — complete source section and proof, printed p.299.
- `fa-11.1` — complete source section and proof, printed p.275.
- `fa-11.2` — complete source section and proof, printed p.275.
- `fa-11.3` — complete source section and proof, printed p.276.
- `fa-11.4` — complete source section and proof, printed p.276.
- `fa-11.5` — complete source section and proof, printed p.277.
- `fa-11.8` — complete source section and proof, printed p.280.
- `fa-11.9` — complete source section and proof, printed p.280.
