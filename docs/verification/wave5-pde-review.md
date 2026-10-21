# Independent review: PDE chapter 5

Reviewed 2026-10-21. Scope: all16 new items in `content/pde/ch05.js`, `content/pde/ch05-b.js`, their numerical helper, and the dedicated math/browser tests. Reviewer owns only this report; requested content fixes were sent to the author.

## Mathematical and source review

No theorem, operator-sign or numerical-normalization defect found. The chapter consistently uses `−ΔΦ=δ` and outward normal derivatives. It distinguishes exact finite families, quadrature, finite-difference residuals, and a discrete matrix Green function from continuum assertions.

Primary sources inspected independently:

- [Stanford Math220B, Laplace’s Equation](https://web.stanford.edu/class/math220b/handouts/laplace.pdf), §§3.1–3.2.5: fundamental solution, distributional sign, sphere/ball means, maximum principle, uniqueness, mollification, analyticity remark and Liouville theorem.
- [Stanford Math220B, Green’s Functions](https://web.stanford.edu/class/math220b/handouts/greensfcns.pdf), representation formula(4.3), corrected-kernel construction, half-space/ball images, Poisson formula: source and boundary signs agree with the authored statement and integrands. Inversion coefficient in3D is `1/|y|`.
- [Ivrii §6.3](https://www.math.toronto.edu/ivrii/PDE-textbook/Chapter6/S6.3.html): polar Laplacian has all three radial/angular terms, including `r^−2 u_theta_theta`.
- [Ivrii §7.2](https://www.math.toronto.edu/ivrii/PDE-textbook/Chapter7/S7.2.html): means, maximum/Dirichlet uniqueness and Green identities. This source uses an inward normal; the chapter's conversion to outward normal is correct.
- [Ivrii §7.1](https://www.math.toronto.edu/ivrii/PDE-textbook/Chapter7/S7.1.html): pure Neumann compatibility and additive-constant ambiguity. Its `Δu=f`, inward-normal statement becomes the chapter's `−Δu=f`, outward-normal compatibility `∫f+∫g=0`.
- [Leon Simon, Lectures on PDE, basic harmonic theory](https://math.stanford.edu/~lms/lecs-on-pde.pdf): compact-subset Harnack principle. The chapter's sharper disc constants are independently obtained by bounding the normalized Poisson kernel between `(1−r)/(1+r)` and its reciprocal.
- [Stanford Math220B, Calculus of Variations](https://web.stanford.edu/class/math220b/handouts/calcvar.pdf): energy formulation. The chapter correctly makes Dirichlet minimality conditional on the existence of a harmonic extension rather than deriving unrestricted existence from a formal minimum.

The general Neumann existence assertion includes connectedness, C∞ boundary and compatible C∞ data, and uniqueness modulo constants. Its proof explicitly invokes variational solvability and boundary regularity; the simple visualization claims only the explicit disc family. The image-method slice is correctly a3D potential displayed on a plane; images lie outside the physical domain. The wedge statement does not mistake a singular boundary vertex for an interior harmonic point.

## Independent numerical checks

Reran `node --test tests/wave5-pde-math.test.mjs`: all12 passed. These tests include substantive independent oracles: a Gaussian-elimination inverse of the small five-point matrix against its spectral inverse, Jacobi eigenmode decay, full3D image-boundary cancellation, separate sphere/disc quadratures, analytic Fourier-mode Poisson extension, independent chord integration for symmetric-difference area, and Neumann PDE/normal derivative/conservation identities.

Additional reviewer calculations, executed without adding source/test files:

- For the mixed harmonic polynomial `u=x²−y²+0.4x`, the single-layer and signed double-layer boundary integrals each independently equal `u(x)/2`. Checked at `(0.3,0.2)`, `(-0.7,0.4)`, `(0.85,0)` with errors below1e−12. This tests the individual representation terms, beyond merely checking their sum.
- A square grid with2×2 interior nodes has a closed-form inverse point-source column `(7/24,1/12,1/12,1/24)` from the source corner. The helper agrees within1e−13, confirming discrete source normalization independently of the large spectral test.
- The Poisson integral of pure boundary mode cos(4t) equals `r^4 cos(4theta)`. Checked at radii0.5 and0.85 with errors below1e−12.

The finite-grid equation is `−Δ_h G=δ_node/h²`, not a pointwise continuum delta. Displayed finite diagonal values are labeled as grid quantities. Quadrature sample counts and finite-difference steps are disclosed in the relevant readouts.

## Requested fixes and visual review

Requested and observed in updated source:

1.5.2 caption originally promised a negative-gradient plot that was not drawn. It now says the potential is plotted and the gradient is used in flux calculation.
2.5.12 representation formula now explicitly requires regularity up to the boundary so its boundary derivatives are defined.
3. Add external axis-label gutters where bottom ticks were clipped or the5.11 angular xlabel crossed the lower Harnack bound. Refreshed captures for5.9,5.11 and5.13 were independently re-inspected: tick labels are complete and the Harnack xlabel is outside its bounds.

Inspected captures for all16 items across light/dark, including log/power mode, mean-value contamination, Jacobi initial bump, separation, Poisson kernel, exterior mode, mollifier, Liouville geometry, Harnack profile, signed Green boundary contributions, grid Green source/observation, image configuration, energy curve and Neumann conservation. Rasters genuinely occupy the stages after the author's heat-rectangle ordering correction; these are not axes-only blank-check passes.

The final author report `docs/verification/wave5-pde.md` was read. Its scoped static, both-theme all-mode checks and four theme/width browser combinations are recorded; the custom check verifies substantial actual colored-raster pixels, slider extremes, Poisson near-boundary mass, Green diagonal/corner, image location and Neumann drift. These author checks supplement the reviewer's independent source, numerical and screenshot work.

**Review status: accepted.** No unresolved mathematical, source, visual or scope findings. All requested fixes were applied by the author and re-inspected. Root independently handles the integration/native input matrix. No additional content changes were made by this reviewer.
