# Electrostatic source and numerical review — 2026-10-18

Read AUTHORING.md and physics field guidance. This review uses complete relevant
first-party technical passages, not abstracts or catalogue records. Source
closures below are specific to the stated model and conventions.

| Item | Evidence and disposition |
| --- | --- |
| em-3.7 | Closed. [Feynman II §§5–9–5–10](https://www.feynmanlectures.caltech.edu/II_05.html), entire conductor/cavity arguments, and [§6–7](https://www.feynmanlectures.caltech.edu/II_06.html). Removed an unsupported historical date and the overly broad mesh/frequency shielding rule. The centred cylindrical line charge has an image at infinity; handle that limit by omitting its zero-field contribution, avoiding NaN. Empty cavity and conductor field remain zero. |
| em-3.11 | Closed. Same complete Feynman §6–8, Eqs.(6.28)–(6.30), including surface density, induced total charge and image force. Grounded infinite-plane hypotheses retained; removed ambiguous isolated-neutral-plane extension. An exactly zero input now gives exactly zero sources rather than a substitute10^-6nC charge. |
| em-3.12 | Closed. Complete Feynman §6–9, Eqs.(6.31)–(6.32), distance-ratio derivation and isolated sphere extension. Boundary cancellation independently checked around the sphere. Removed unverified historical decade and fixed exact-zero sources and a zero-radius drag constraint. |
| em-3.15 | Closed. [Fitzpatrick, Classical Electromagnetism](https://farside.ph.utexas.edu/teaching/jk1/Electromagnetism.pdf), full §§3.3–3.8 relevant passages, printed pp.50–58: orthogonality, radial solutions, axisymmetric expansion and Dirichlet boundary coefficients. Corrected false “no charge at r=R” scope: the prescribed nonconstant potential requires a charged interface or separate electrodes. Corrected P2 cutoff wording and RMS versus mean-square convergence. Piecewise constant profile coefficients now use analytic Legendre antiderivatives, eliminating Simpson samples taken directly at discontinuities. |
| em-3.17 | Closed. [Feynman II complete §7–2](https://www.feynmanlectures.caltech.edu/II_07.html), Eqs.(7.3)–(7.15), Cauchy–Riemann, harmonic potentials, conjugate contours and branch examples. Regular-point condition added. Critical-point gradient angle is explicitly undefined; singular neighbourhood is masked. Changed the cylinder example from z+1/z to z−1/z so its real potential is constant on the conducting unit circle. Removed unsupported historical priority dates. |
| em-4.6 | Closed. Same complete Fitzpatrick §§3.3–3.6, pp.50–55, Eqs.(3.17)–(3.59): normalization, addition theorem and exterior multipoles. The implementation uses a real orthonormal sine/cosine basis without the Condon–Shortley phase. Its relation to an orthonormal complex basis is unitary, preserving total squared moment exactly; corrected the former “up to normalization factors” statement. Removed unchecked historical dates. |
| em-4.8 | Closed. [MIT18.303 Lecture20](https://ocw.mit.edu/courses/18-303-linear-partial-differential-equations-analysis-and-numerics-fall-2014/ed2e057a15b67090d2e1c8f09cf30406_MIT18_303F14_Lecture20.pdf), full §3.1, pp.2–3, derivative action, dipole finite difference and Green function. Second derivative extension follows by applying the same test-function definition twice; independently checked on cubic and trigonometric fixtures. Error is O(epsilon²), with exact cancellations allowed. Stems are visibly capped and now labeled schematic; readout no longer adds a fake epsilon to exact zero errors. |
| em-4.10 | Closed. NIST CCCBDB [water](https://cccbdb.nist.gov/exp2x.asp?casno=7732185&charge=0) and [CO2](https://cccbdb.nist.gov/exp2x.asp?casno=124389&charge=0), entire relevant experimental geometry and dipole tables including comments. Water uses rounded ground-vibrational-state1.855D (NIST gives mu0=1.85498), distinct from equilibrium1.857D. Water0.958Å,104.4776° and CO2≈1.16Å,180° support rounded geometry. Removed an unsupported1.8546 target and historical date; fitting no longer rounds the internal partial charge. Zero partial charge now skips0/0 potential terms at nuclei. Partial charges remain explicitly fitted/illustrative. |

| em-3.4 | Closed. Complete [Feynman II §6–11](https://www.feynmanlectures.caltech.edu/II_06.html), two-sphere approximation and Eq.(6.35). Replaced a universal local-curvature law with a qualified exposed-tip result. The air line is illustrative, not a corona calculation; removed unsupported historical date. Fixed the radius curve to change the common potential at fixed total charge, widened its field range, removed ordinate clamping and kept the sphere drawings disjoint. |
| em-3.14 | Closed. Complete [MIT Electromagnetic Fields and Energy §§5.4–5.5](https://web.mit.edu/6.013_book/www/chapter5/5.5.html), especially Eqs.(3)–(9), including rendered equation image9: Fourier projection and rectangle solution; the semi-infinite limit gives the stated exponential. Exact profile coefficients replace discontinuity-biased quadrature. Gibbs limit follows directly from the odd-square-wave sine sum; numerical check matches1.179. Removed unreviewed historical dates. |
| em-3.18 | Closed. [C. Pope, TAMU Electromagnetic Theory I, Homework4 comments](https://people.tamu.edu/~c-pope/EM603/Prob23/prob4_comments.pdf), complete question3, PDF pp.2–4, Eqs.(1)–(4), plate-edge map and branch behaviour. Removed the unchecked Treatise article/date attribution; primary Maxwell scan remains inaccessible but is no longer claimed as reviewed. Fixed inverse dragging to synchronize both probes, added damped multi-start inversion and stated its bounded window. |
| em-3.19 | Closed. Complete [Netlib Templates SOR method](https://netlib.org/linalg/html_templates/node15.html) and [parameter discussion](https://netlib.org/linalg/html_templates/node16.html), plus [Darian arXiv:2501.09995v1](https://arxiv.org/html/2501.09995v1), complete §§2.1 and3.1, Eqs.(3),(8),(14)–(23). Define n as cells, distinguish averaging defect from a sweep change, and qualify spectral radius as asymptotic. Over-relaxed iterates can overshoot even inside the convergence interval; corrected the maximum-principle claim. Removed unchecked historical dates. |
| em-3.22 | Closed. Complete [Feynman II §8–5](https://www.feynmanlectures.caltech.edu/II_08.html), Eqs.(8.27)–(8.35), followed by the explicitly supplied fixed-charge quadratic expansion. Removed unchecked historical decade. Distinguished midpoint strip self-potential from double-averaged self-energy; absolute energy of a net 2D line charge is divergent. Display finite excess energy and potential spread in fixed kernel units, avoiding gauge-dependent relative normalization and artificial positive floors. The density axis includes negative trial charges when present. |

`node tests/verification-em.test.mjs`: **13/13 numerical groups pass**. These run
production callbacks and independent fixtures. New checks cover fixed-charge
sphere curves, analytic Cartesian profile integrals, an independent relaxation
sweep and exact spectral factor, SOR overshoot, the circular Fourier-energy limit,
and Cholesky positivity on the complete neutral subspace for81 aspect ratios in
[0.2,1]. Plate-map checks cover boundaries, inverse targets and bounded projection.

Real local KaTeX0.16.11 is installed by installBrowserAssets in
`tests/verification-physics-browser.mjs`. Each of the13 reviewed items has actual
input checks in light and dark themes: **26/26 final groups pass** (reports in
/tmp/atlas-physics-browser-*.json). Initial plane testing clicked a hidden native
input; its visible-label rerun passed. An exact critical point is checked
numerically, because pointer rounding can leave a nonzero gradient even when
its formatted magnitude reads0.000. No source closure follows from rendering
alone.

Cross-field prerequisite: em-3.3's actual readout compares electrostatic pressure
with4gamma/R for a two-surface soap film. Added fluid-2.7 (Young–Laplace law) to
both the written item and syllabus dependencies; this is a used equation.

All13 original EM source flags reviewed and cleared within the revised scope.
