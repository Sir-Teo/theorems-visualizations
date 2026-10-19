# Fluid source and numerical review — 2026-10-18

Read AUTHORING.md and physics field guidance. All11 original source flags below
are reviewed within the stated ideal-flow scope. Unverified priority dates are
removed rather than inferred from textbook names.

| Items | Complete source passages and results |
| --- | --- |
| fluid-3.6 | [OpenFAST OLAF Theory](https://openfast.readthedocs.io/en/main/source/user/aerodyn-olaf/OLAFTheory.html), complete regularization/Rankine subsection4.4.6.8.3.1, plus the displayed direct radial-Euler integration. Profile and vorticity agree; pressure and surface height checked by differentiation and continuity. The free surface follows hydrostatics and radial balance; a shared Bernoulli constant cannot be assumed across rotating-core streamlines. Real drainage/viscous cores are outside scope. |
| fluid-3.11 | [Mei, MIT1.63 §7.2](https://web.mit.edu/fluids-modules/www/coastal_gfd/7-2Tay-Prou.pdf), full2-page derivation, Eqs.(7.2.1)–(7.2.4), plus [Fitzpatrick sphere flow](https://farside.ph.utexas.edu/teaching/336L/Fluidhtml/node103.html), potential/velocity formulas. A stagnant Taylor-column interior is an illustrative limiting choice. 3D horizontal-slice integral curves are distinguished from material streamlines. |
| fluid-4.3 | [Fitzpatrick §4.13](https://farside.ph.utexas.edu/teaching/336L/Fluidhtml/node64.html), complete Euler-to-unsteady-Bernoulli argument, Eqs.(4.82)–(4.97); source potential has the opposite sign. U-tube specialization follows the stated endpoint balance. Corrected physical total length versus inertance, limited amplitude visibly to keep both arms filled, and retained exact equal-arm harmonic comparison. |
| fluid-4.8,4.9,4.10,4.11 | [Fitzpatrick §5.7](https://farside.ph.utexas.edu/teaching/336L/Fluidhtml/node74.html), complete circulation/stagnation/pressure derivation, Eqs.(5.70)–(5.83); [§6.11](https://farside.ph.utexas.edu/teaching/336L/Fluidhtml/node91.html), full Blasius proof and contour argument, Eqs.(6.173)–(6.188); [§9.2](https://farside.ph.utexas.edu/teaching/336L/Fluidhtml/node122.html), complete far-field residue/lift derivation, Eqs.(9.3)–(9.10). Conventions translated to clockwise-positive circulation and u=+grad(phi). Pressure integration now uses the analytic boundary differential, eliminating polygon-chord bias. Removed artificial positive floors and an unsupported universal spinning-cylinder circulation comparison. The off-surface stagnation point and lift arrows remain in view. Wake-pressure example remains explicitly illustrative. |
| fluid-4.12 | Complete [Fitzpatrick §§6.6–6.7](https://farside.ph.utexas.edu/teaching/336L/Fluidhtml/node86.html), repeated-wall construction, conformal channel/corner examples, Eqs.(6.42)–(6.67). The exact periodic image-lattice derivative now computes channel velocities, drift and wall checks; drawn image dots alone are truncated. Former finite-sum error was incorrectly called roundoff. Independent long lattice sums and both-wall cancellation check the kernel; the corner invariant is differentiated directly. |
| fluid-4.15 | Complete [Fitzpatrick §6.7](https://farside.ph.utexas.edu/teaching/336L/Fluidhtml/node87.html), harmonic composition, velocity/flux mapping; original [Theodorsen NACA411](https://ntrs.nasa.gov/api/citations/19930091485/downloads/19930091485.pdf), full Fourier/conjugate mapping derivation printed pp.231–232, Eqs.(a)–(e),(VIII), and appendix p.237 successive approximations. Rendered pp.231–232 inspected directly. The implementation is a damped discrete Fourier version for star-shaped profiles; it reports numerical mismatch and failure. Removed unchecked Report452 attribution. Corrected cache invalidation when a shape change alters far-field scale at nonzero circulation. Exterior Riemann-map hypothesis includes infinity and a Jordan obstacle. |
| fluid-4.16 | Complete Fitzpatrick §§4.13,5.7,9.2 linked above: multiply connected circulation freedom. Clarified loop orientation and potential change: clockwise-positive Gamma means a counter-clockwise integral and potential increment of -Gamma. |
| fluid-4.17 | Complete [Fitzpatrick cylinder §5.8](https://farside.ph.utexas.edu/teaching/336L/Fluidhtml/node75.html), Eqs.(5.84)–(5.105), and [sphere §7.8](https://farside.ph.utexas.edu/teaching/336L/Fluidhtml/node103.html), Eqs.(7.59)–(7.78): acceleration-pressure force, kinetic energy and buoyancy. Exact density-zero added-mass limit retained; naive acceleration is explicitly undefined there. Removed its artificial60g cap, reversed arrows for sinking, and removed pressure/motion arrows for neutral buoyancy. |

`node tests/verification-fluid.test.mjs`: **8/8 independent numerical groups pass**.
They cover pressure derivatives, vorticity spin, column-height invariance, equal-arm
RK4 versus cosine, positive heights at control extremes, Kutta–Joukowski vectors
for varied shapes/speeds/angles and three contours, actual stagnation points,
periodic wall cancellation and lattice sums, exact circle/ellipse conformal maps
and their derivatives, and added-mass limits/signs.

Serial browser checks use real local KaTeX0.16.11 and actual controls in both
light and dark themes. Initial20/22 passed; the2 added-mass assertions rejected
KaTeX's Unicode minus sign, and their corrected targeted rerun passed2/2, for **22/22 final groups**. It is recorded in
/tmp/atlas-physics-browser-fluid-4.17.json. Browser verification remains separate
from source closure.

Genuine cross-field prerequisites, mirrored in syllabus: fluid-4.3 uses
mech-4.2's harmonic-oscillator solution in its explicit cosine/frequency
comparison; fluid-4.17 uses mech-1.6 to combine applied force and added inertia.
