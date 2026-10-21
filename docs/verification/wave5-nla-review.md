# NLA5 independent review

Status: accepted on frozen source after independent source, model, native replay and visual review.

Reviewer: wave5_reviewer. No reviewer content edits.

## Actual sources and proof use

Independently read Bindel's actual Cornell CS6210 author lecture PDFs dated21/26October and9/11November2009: multiplicities/Schur, localization/perturbation, min–max and interlacing/Weyl. Their descending eigenvalue ordering has been translated consistently to the authored increasing ordering. The2009 Bauer–Fike presentation uses induced1-norm; the author now labels that variant and supplies the valid2-norm resolvent proof rather than misattributing its precise norm convention.

Using the read-only PDF skill, inspected the actual rendered Trefethen1999 *Computation of Pseudospectra*, printed pp6–7, equations3.1–3.3, from the [author-hosted paper](https://people.maths.ox.ac.uk/trefethen/publication/PDF/1999_83.pdf). Its raw text is encoded; no acceptance relies on unread extraction. Closed epsilon, complex perturbations, resolvent and least-singular-value conventions match. Also inspected actual Trefethen–Bau pp191–193 (especially Theorem25.1 and companion matrix25.3), the official Netlib reduction/Schur description, and Oxford EigTool's norm-versus-spectral-decay documentation.

All12 statements and proof ideas have been read. They separate algebraic/geometric multiplicity, constructed Schur families from a general solver, nearest-spectrum Bauer–Fike from ordered Hermitian Weyl, raster thresholds from certified contours, and sampled transient peaks from continuous extrema. Abel–Ruffini is restricted to exact finite arithmetic/radicals and general dimension at least5; it does not prohibit finite tolerance computation or structured special cases.

## Resolved review findings

- The initial Weyl idea cited the later variational characterization while min–max depended on Weyl. Weyl now uses a self-contained spectral-basis intersection argument, and min–max depends directly on the spectral basis, removing the circular proof input. Authored and syllabus dependencies match.
- Pseudospectral membership is explicitly a computed threshold test. The least singular value uses determinant divided by the largest singular value, avoiding cancellation from subtracting nearly equal eigenvalues.
- Bisection output is a computed interval, not an outward-rounded enclosure. Independent exact-rational evaluation confirms why this distinction matters: at c=0.6772463826822746 and45steps, computed lo=1.125030517578125 has exact p(lo)=+4.878936245964372e−18, placing the mathematical root just below it. Numerical approximation remains useful with the corrected scope.

## Independent finite calculations

`/tmp/wave5-nla-review-oracle.mjs` passes764 states:

-201 normalized-eigenvector condition numbers agree with the independent closed form sqrt(1+k²)+k; perturbed2×2 eigenvalues satisfy independently evaluated real/imaginary characteristic equations.
-401 normal least-singular-value and compressed-plane extremum states agree with direct distance/analytic Rayleigh formulas.
-162 symmetric/general Householder states preserve independently computed cofactor determinants at five shifts and orthogonality at every step; final structure is Hessenberg/tridiagonal as appropriate.

A further240 general complex triangular cases agree with independent70-digit mpmath SVD; maximum absolute least-singular-value discrepancy is4.44e−16 (`/tmp/wave5-nla-review-sigmas.json`). A further302 symmetric perturbations agree with independently computed trigonometric cubic roots, including ordered Weyl displacements (`/tmp/wave5-nla-review-weyl.mjs`). The final13 mathematical/metadata tests also pass separately (`/tmp/wave5-nla-review-math-final.log`).


## Final production and visual acceptance

Independently ran5.1,5.4,5.6,5.7,5.8,5.12 at actual1200/320 in both themes:24groups,248 physical control actions and104 real Share/off-grid/fractional-integer/out-of-range/malformed replays pass (`/tmp/wave5-nla-review-production.log`). Complete circle/path strokes, markers/rings, glyph/halo and rich statement/proof/scope/caption/readout bounds pass. Minimum full marker/ring clearance2.163147 CSSpx and selected glyph/halo clearance3.265625 CSSpx.

Inspected all24 narrow default visualization captures, the connected epsilon0.5 raster, scalar all-direction circle, actual Q/T tables, log residual history and final Hessenberg examples. Recaptured5.6,5.8,5.10 full rich pages using a bounded `/tmp`-only variant that scrolls to the top and blurs focus before capture, avoiding sticky-header screenshot stitching artifacts. All12 additional default rich-page groups pass (`/tmp/wave5-nla-review-rich.log`); their minimum glyph/halo clearance is3.117500 CSSpx. Final actual320 statements and scopes are legible and mathematically equivalent to the checked source. The author's complete48-case native matrix and endpoint captures supplement these independent checks.

No unresolved source, proof, model, state or presentation finding; no uncertainty flag. Source bytes are frozen. No reviewer content changes. In-memory source catalog injection avoids generated edits; root's source-aligned build/export remains the integration gate.
