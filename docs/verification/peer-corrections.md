# Focused corrections from prerequisite peer review

Corrected six confirmed mathematical/scope issues under the verification goal. Source flags are unchanged; ecology 4.7 remains open with its original-source gaps. The [machine record](peer-corrections.json) distinguishes mathematical fixes from source closure.

## physio-3.7

Corrected positive external stroke work to −∮P dV for the counter-clockwise loop; ejection −∫P dV; heart-rate conversion uses beats/s. Computation now uses the explicit negative signed trapezoid integral instead of absolute value. Ejection/filling readout partitions the same sample increments, eliminating the prior small event-boundary discrepancy. Corrected weak-ventricle afterload decline wording.

Normal default6558 mmHg·mL=0.87 J, at 75/min1.09 W. Weak/high-afterload3337 mmHg·mL=0.44 J,0.56 W. Values remain the prior positive magnitudes.

Complete Klabunde Ventricular Pressure–Volume Relationship webpage (revised 2023), https://cvphysiology.com/cardiac-function/cf024, read in full. Its phase sequence establishes ejection at decreasing ventricular volume and enclosed area as stroke work. The sign also follows independently from −P dV = P(Qout−Qin)dt. This does not claim a complete Guyton–Hall book reading.

## mathbio-3.4

Specified canonical q=ln y,p=ln x and the exact Hamiltonian. Removed false exact energy-preservation claim for symplectic Euler and renamed tiny-step RK4 as a reference. Error plot now includes both extrema of the whole computed series rather than clipping negative oscillations or sizing from only the final error.

At default start with h=.25 the symplectic error visibly oscillates; final V−V0≈.02902. Hamiltonian is conserved by the exact differential equations, not exactly by the discrete method.

## mathbio-4.13

Added finite positive mean of the exponentially tilted kernel and directly Riemann-integrable tilted forcing to the key-renewal limit. Distinguished continuous Gamma hypotheses from the discrete time-grid approximation.

No numerical algorithm changed; the illustrative smooth forcing/Gamma kernel has the stated integrability properties.

## ecol-4.7

Restricted symmetric strict Gram positivity to equal-norm linearly independent utilization curves, as in the distinct equal-width translates in all three presets. General Gram matrices may be semidefinite and row normalization need not be symmetric. Added the diagonal similarity argument giving local asymptotic stability of a feasible positive equilibrium.

No algorithm changed. Numerical unresolved status for nearly singular matrices remains explicit.

Original MacArthur–Levins 1967 and May–MacArthur 1972 full-source historical/model attribution gaps remain as recorded in ecol-source-review.md; flag retained.

## ecol-2.10

Described variance stabilization as a first-order delta approximation at positive means. Added g′(x)=x^(−b/2), the power antiderivative for b≠2 and log x for b=2; zero counts require separate treatment.

The visualization simulates raw abundance distributions, not transformed counts, so no plotted computation required change.

## epi-2.7

Distinguished stationary smooth ROC candidates from a global optimum, and single upper score cutoffs from unrestricted likelihood-ratio regions. Monotone increasing LR/concave ROC justifies their equivalence; the unequal-dispersion PSA preset compares finite-grid upper cutoffs in the displayed range. Removed readout claims that an endpoint-selected LR approximately equals the interior target slope.

No cost algorithm changed. The endpoint native case explicitly labels the best displayed-grid cutoff and reports its actual LR separately from the interior target slope.

## Verification

Six independent groups test work against pressure times flow and SI units; an area-preserving symplectic step that changes V; a solvable continuous renewal limit; independent overlap quadrature/Cholesky and a nonsymmetric row-normalization counterexample; delta variance and the logarithmic limit; and a likelihood-ratio decision region requiring both tails. Existing physio 14, mathbio 12 and ecology 7 groups pass. Scoped static validation covers 432 items with zero errors/warnings.

All12 native card/theme groups pass in serial Chromium with actual pinned KaTeX. Real keyboard slider changes, buttons and toggles exercise both work decompositions, large/small symplectic steps, Gamma extremes, all overlap presets, raw-count resampling and a PSA endpoint optimum. Screenshots were manually inspected for ventricular work in both themes, symplectic error bounds in both themes and the PSA endpoint readout. Evidence: `/tmp/peer-corrections-browser.json`, `/tmp/peer-corrections-shots/`. The first browser run had an expected-value rounding typo (.45 instead of .44J); the corrected final run passes all 12 groups. No further exploration follows this batch.
