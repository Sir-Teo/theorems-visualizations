# Wave five — Fluid Dynamics chapter 5

Authored 2026-10-21. Items fluid-5.1 through fluid-5.8, with new numerical helpers in `content/fluid/ch05.shared.js` and mathematical checks in `tests/wave5-fluid.test.mjs`. No runtime, generated data or previous-wave gates changed.

## Sources actually inspected

- [MIT 18.354, 2015 lecture notes](https://ocw.mit.edu/courses/18-354j-nonlinear-dynamics-ii-continuum-systems-spring-2015/6163837c5efa5d6ed969e535ec8f890c_MIT18_354JS15_lectureNotes.pdf), §§18.4, 19.3, 20.1–20.4, printed pp. 90, 93–98. The circle field, Joukowski transform, cancellation of the trailing-edge numerator (equations 497–498), pressure-contour force (499 onward) and Kutta–Joukowski derivation were checked. The notes use a different circulation sign; this chapter explicitly takes clockwise positive. The circle parameter and map scale have distinct names here.
- [MIT Unified Engineering, F20 notes](https://ocw.mit.edu/courses/16-01-unified-engineering-i-ii-iii-iv-fall-2005-spring-2006/f790501546695cacc137229c5df03511_f20.pdf), first page: smooth flow-off at the trailing edge requires circulation; following pages introduce the vortex sheet. This is an added physical selection condition, not a consequence of ideal slip alone.
- [NPTEL, lecture 23: Generation of Vortices Around a Wing](https://archive.nptel.ac.in/content/storage2/courses/112104118/lecture-23/23-6_gen_vortices_wing.htm), discussion of starting shedding and compensation of bound circulation. The page motivates the budget only; the displayed exponential history is explicitly prescribed.
- [NASA Glenn: Incorrect Lift Theory #1](https://www.grc.nasa.gov/WWW/k-12/VirtualAero/BottleRocket/airplane/wrong1.html), the equal-transit hypothesis and symmetric-wing counterexample. The displayed particle paths are independently integrated from the exact steady map velocity; they are not copied NASA data.
- [University of Sydney: Thin Aerofoil Section Theory, hosted at Cambridge](https://www-mdp.eng.cam.ac.uk/web/library/enginfo/aerothermal_dvd_only/aero/thinaero/thinaero.html), mean-line vortex-sheet construction, small-angle boundary condition, Fourier solution, lift and quarter-chord moment. Its closing paragraph explicitly excludes boundary-layer effects and stall prediction. The polynomial family's coefficients are derived analytically here and force/moment are checked by numerical integration.
- [NASA Glenn: Induced Drag Coefficient](https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/induced-drag-coefficient/), aspect ratio, span efficiency and elliptic minimum. The two-mode Fourier loading and span-integral comparison are computed here.

## Decisions that preserve scope

1. All Joukowski circulation is clockwise positive; the stream points at positive incidence in chord coordinates. Pressure force is projected normal to the incoming stream. Coefficients distinguish section force per unit span from finite-wing force and wing area.
2. A cusped map uses a circle through +a, enclosing -a. The degenerate unit circle gives the flat plate. The cambered chord is explicitly a sampled chord; the symmetric chord agrees with its analytic extrema.
3. Non-Kutta pressure is singular at the cusp. The pressure plot excludes the exact cusp and labels its extrema as sampled. The edge demo resolves distances down to 1e-5 radians and reports the computed numerator residual.
4. The section lift law is exact for the ideal plate, with an explicit radius/chord correction for a finite symmetric section. Its verification point is a pressure integral. There is no invented stall curve or wind-tunnel data.
5. Starting-vortex content demonstrates a prescribed circulation budget with discretized shedding and prescribed convection. It makes no claim to compute viscous startup, vortex roll-up or Wagner lift. Kelvin applies to an outer material circuit staying outside the viscous region.
6. Equal-transit trajectories share one RK4 clock. The arrival plane is downstream of the trailing edge; no particle is forced to touch the singular edge. Particle clocks are never rescaled. A symmetric zero-incidence control restores equal arrival times.
7. Thin-aerofoil camber is a polynomial family with analytic Fourier coefficients. Leading-edge singularity is integrable and explicitly excluded from the displayed finite graph, not from force quadrature. Nose-up moment is positive.
8. Lifting-line loading is constructed by first and third harmonics, rather than pretending to solve a specified planform. Span efficiency is calculated from those coefficients. The integral of circulation times downwash verifies induced drag. No profile drag is claimed.

## Verification

`node --test tests/wave5-fluid.test.mjs` — 8 tests passed, covering entire slider endpoint grids where relevant:

- map geometry and critical points;
- Kutta numerator residual, two-sided finite edge limits, and non-Kutta divergence;
- pressure-force convergence, thickness correction and streamwise drag residual;
- numerical zero-normal-flux check and negative counterclockwise circulation integral;
- thin-sheet force/moment integrals against Fourier coefficients;
- bound/shed circulation budget at endpoint times and growth scales;
- equal-time symmetry and unequal arrival counterexample, with RK4 step halving;
- lifting-line force/drag span quadratures and elliptic minimality.

`node scripts/check.mjs fluid/5 --static` — 8 items, 0 errors, 0 warnings.

`node scripts/check.mjs fluid/5 --modes --shots --still --jobs=2` — 8 browser runs, 0 failures, 0 TeX/blank warnings, 0 quality warnings. All section modes included.

`node scripts/check.mjs fluid/5 --modes --shots --still --dark --w=390 --jobs=2` — same clean results at narrow width in dark theme. Default light screenshots for all 8 items inspected; dark narrow pressure, edge, wake, sheet and lifting-line screenshots inspected. Wake-label clipping found during visual QA and corrected; edge-axis label shortened. Screenshots live in `shots/fluid-5.*.png` (and `.dark.png`). Final reruns refresh those after the label fix.

Root review additionally checked 1,008 independent real-coordinate surface-velocity states (maximum scaled discrepancy 3.54e-14), independently expanded the thin-camber Fourier coefficients, and passed 32 native browser groups with 180 control actions. Final review requested an exterior gutter for the edge log plot and explicit disclosure that the log floor clips speeds below 0.01U, including true zeros. All box-axis stages now use exterior gutters as requested. Both edge changes were applied; 5.3 was recaptured at 390 and 860 pixels in both themes with clean browser results and the label clear of the curve. The plain-text 5.4 name now reads “Ideal section lift and the sine law”.

Independent review accepted on 2026-10-21: [root review and final native evidence](wave5-fluid-review.md).
