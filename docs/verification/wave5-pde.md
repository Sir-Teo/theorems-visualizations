# Wave 5 — PDE chapter 5: Laplace’s equation and harmonic functions

All 16 planned items are authored in `content/pde/ch05.js` (5.1–5.8), `ch05-b.js` (5.9–5.16) and pure numerical helpers `ch05.shared.js`. Only chapter-5 dependency rows in `content/pde/syllabus.js` were edited. No central runtime, data, ledger, master-plan or Git operations were performed.

## Source and hypothesis review

Original statements, proof sketches and model explanations were checked against these primary teaching sources (accessed 2026-10-21):

- [Victor Ivrii §6.3, Laplace operator in polar coordinates](https://www.math.toronto.edu/ivrii/PDE-textbook/Chapter6/S6.3.html): polar identity and separated radial/angular modes, 5.1/5.8.
- [Ivrii §6.2, Laplace equation in a rectangle](https://www.math.toronto.edu/ivrii/PDE-textbook/Chapter6/S6.2.html): rectangle separation, 5.6. Cube modes are the directly checked product extension.
- [Ivrii §7.2, Potential theory](https://www.math.toronto.edu/ivrii/PDE-textbook/Chapter7/S7.2.html): mean value, maximum principle, Dirichlet uniqueness, 5.3–5.5.
- [Stanford Math 220B, Laplace’s Equation](https://web.stanford.edu/class/math220b/handouts/laplace.pdf): fundamental solution, mean value, maximum principle, smoothing and Liouville, 5.2–5.4/5.9/5.10. Its regularity section explicitly distinguishes smoothness from the stronger analyticity statement; the authored proof sketch also distinguishes the two arguments.
- [Leon Simon, Lectures on PDE, Basic Theory of Harmonic Functions](https://math.stanford.edu/~lms/lecs-on-pde.pdf): nonnegative Harnack inequality and connected-domain compact-set form, 5.11. Disc constants are independently derived from the kernel bounds. [Stanford MATH312 Homework 4, Problems 6–8](https://math.stanford.edu/~ryzhik/MATH312-06/hw312-06-4.pdf) was also checked for the explicit disc kernel and Harnack formulation.
- [Stanford Math 220B, Green’s Functions](https://web.stanford.edu/class/math220b/handouts/greensfcns.pdf): Green representation, Poisson kernel, reflected/inverted images and signs, 5.7/5.12–5.14.
- [Stanford Math 220B, Calculus of Variations](https://web.stanford.edu/class/math220b/handouts/calcvar.pdf): energy functional and conditional minimization, 5.15.
- [Ivrii §7.1, General properties of Laplace equation](https://www.math.utoronto.ca/ivrii/PDE-textbook/Chapter7/S7.1.html): compatibility and uniqueness modulo constants for the Neumann problem, 5.16. Ivrii uses inward normals; all authored formulas explicitly convert to outward normals.

Original planned Strauss/Evans edition-specific section labels were not independently confirmed, so authored content cites the accessible sources above instead. No unconfirmed source numbering is asserted.

The chapter consistently uses **−ΔΦ=δ**, **outward normal derivative**, and positive Dirichlet Green functions for −Δ. The harmonic representation is Φ∂νu−u∂νΦ; the volume term is Φ(−Δu). General Green identities require smooth data up to the boundary; the representation explicitly requires u∈C²(closure Ω). Mean-value balls must remain inside the harmonicity domain. Dirichlet stability does not assert existence on arbitrary domains. Dirichlet’s energy identity proves conditional minimality, rather than inventing an existence proof. Neumann sufficiency is stated in the safe smooth bounded connected domain/smooth data setting; its scope explicitly exposes the advanced variational/elliptic regularity step.

## Independent mathematics and numerical honesty

`node --test tests/wave5-pde-math.test.mjs`: **12/12 tests pass**.

| Items | Numerical model and independent verification |
| --- | --- |
| 5.1–5.2 | Separate polar/Cartesian finite differences; log excludes the origin; radial fundamental-solution flux uses actual circle/sphere measure and the negative gradient sign. No finite value is supplied at the source. |
| 5.3 | Independent circle and equal-area-disc averages of an entire harmonic function; the quadratic counterexample yields the known R² and R²/2 discrepancies. Discretization sizes and approximation signs are displayed. |
| 5.4 | Actual Jacobi sweeps of the five-point grid with fixed boundary data. Every grid entry is independently compared with the exact discrete eigenmode decay cos(π/24)^k. The UI distinguishes a finite grid maximum/residual from a continuum theorem. |
| 5.5 | Explicit harmonic perturbation with exact radial envelope bounded by ε; sampled maxima are labelled as samples and do not substitute for the envelope proof. |
| 5.6 | Rectangle and cube finite sums; independent finite-difference PDE checks and exact homogeneous faces. Finite sums solve the PDE but change the truncated boundary data, stated clearly. |
| 5.7 | Poisson mass and weighted boundary integral compared with a separately evaluated harmonic polynomial through radius0.95, modes1/3/6. The kernel plot rescales to contain its peak. |
| 5.8 | Wedge power and exact gradient growth, logarithmic annulus solution and decaying exterior mode. Excluded regions are masked; the tip is not regularized, and exterior uniqueness includes an infinity condition. |
| 5.9 | Normalized C∞ radial mollifier convolution. Tested against constants, an entire harmonic function and independently predicted quadratic scaling. Smoothness and analyticity have separate arguments. |
| 5.10 | Exact symmetric-difference area of two discs checked against an independent integration of horizontal chord differences. A growing local bound for u=x demonstrates why global boundedness matters. |
| 5.11 | Positive kernel mixtures checked against exact lower/upper Harnack constants. Angular min/max are explicitly sampled; the universal constant comes from analytical kernel bounds. |
| 5.12 | Two separately integrated Green boundary terms recover a known mixed harmonic polynomial. Outward derivative and fundamental-solution signs are independently checked. |
| 5.13 | Spectral inverse of a finite-difference matrix compared with a separate Gaussian-elimination solver; positivity, reciprocity, zero boundary and discrete source normalization tested. The finite diagonal is explicitly a grid value, not a continuum Green singularity. |
| 5.14 | Image cancellation checked at full 3D sphere/plane points, independently of the displayed 2D slice; three-dimensional finite-difference Laplacian tested away from source. Image strength/location match reflection or inversion. A small source display hole is disclosed. |
| 5.15 | Independent 2D energy quadrature matches 1+a²π²/4 and fixed trace. Exact single-mode heat decay demonstrates descent without presenting a finite family as proof for the entire variational class. |
| 5.16 | Exact heat-family Laplacian, prescribed outward derivative, disc average, drift and net boundary derivative all independently checked. Temperature derivative g is clearly distinguished from physical outward heat flux −g. |

## Dependency corrections

All edits are restricted to chapter-5 rows. Removed later `vcalc-9.5`, `vcalc-9.10`, `vcalc-9.6`, `vcalc-8.9`, `vcalc-8.3`, and the unnecessary `fa-8.12a` prerequisites. Polar differentiation/radial ODEs are introduced here; the existing divergence theorem `pma-10.51` supports the mean-value and Green-identity arguments. Poisson uniqueness uses 5.5; smoothing analyticity/Harnack use the already introduced 5.7 kernel; wedge separation uses 5.1/5.6. These are derivational corrections, not fabricated replacements for later general theory. The advanced Neumann existence step remains honestly exposed in `scope`.

## Browser and visual QA

- `node scripts/check.mjs pde/5 --static`: 16 items; 0 errors/warnings.
- `node scripts/check.mjs pde/5 --modes --shots --still --w=390 --jobs=2` and the same with `--dark`: all16 plus every segmented option; clean TeX, canvas and interaction checks.
- `node tests/wave5-pde-browser.mjs`: all16 in both themes at390/860 widths, every visible slider endpoint, actual heat-raster colored-pixel coverage, near-boundary Poisson mass/plot bounds, corner and diagonal discrete Green values, ball image at radius0.2, and extreme Neumann mean7.25.
- Screenshots are `shots/pde-5.N.png` / `shots/pde-5.N.dark.png`; alternate modes have `~k` suffixes. Both-theme contact sheets and key individual/mode views were inspected. Generic nonblank checks initially missed a heatmap rectangle coordinate-order error because axes were present; visual inspection found it, the helper was corrected, and the custom browser test now checks substantial actual colored raster coverage.
- Independent reviewer requested a caption correction, explicit boundary regularity wording and tick/label gutters. Those changes were applied; square heat panels and secondary curve panels reserve external gutters. Neumann heat scaling is dynamic so its default harmonic pattern remains visible.

Ready for independent acceptance; reviewer evidence is recorded separately in `wave5-pde-review.md`. No full-suite run was performed by this author.
