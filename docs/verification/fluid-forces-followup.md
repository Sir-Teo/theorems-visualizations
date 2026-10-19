# Fluid force review: d’Alembert, cylinder circulation, Blasius and lift

Reviewed **fluid-4.8, fluid-4.9, fluid-4.10, fluid-4.11**, all in `content/fluid/ch04-b.js`. The neighboring4.7 block and all five dependency arrays are byte-identical to their starting versions. Existing shared flow helpers remain unchanged. These reviews do not close the four remaining fluid flags.

## Full primary derivations actually read

[MIT18.354, Nonlinear Dynamics II: Continuum Systems, Spring2015 lecture notes](https://ocw.mit.edu/courses/18-354j-nonlinear-dynamics-ii-continuum-systems-spring-2015/6163837c5efa5d6ed969e535ec8f890c_MIT18_354JS15_lectureNotes.pdf), instructor Jörn Dunkel; named note authors Michael Brenner, Tom Peacock, Roman Stocker, Pedro Reis and Jörn Dunkel. Full113-page PDF downloaded; SHA256 `e833869a4aaf4171989b8ba744bcd02211f0f359b98b846f8b3a39138076c84d`.

Complete relevant sections read, rather than an abstract/search excerpt: §18.3 PDF/printed89–90, Eqs.(452)–(461), vortex and circulation; §§18.4–18.5 pp90–91, Eqs.(462)–(468), cylinder boundary/pressure/forces; §§19.1–19.3 pp92–94, Eqs.(471)–(485), complex velocity and conformal transformation; §§20.1–20.4 pp94–98, Eqs.(486)–(514), mapped wing flow, full pressure-force proof and complete residue argument. Pages97–98 were rendered and directly inspected to disambiguate conjugates and signs.

The note's circulation convention is counter-clockwise, while these items use clockwise-positive circulation; the retained proof explicitly converts that sign. The constant term in the source's Eq.(513) is printed `a0` rather than `a0²`; the independent expansion retains the correct square, which does not affect the residue. A sentence preceding Eq.(505) says parallel to `z`, but the actual Eq.(505) is the boundary-tangent condition. The revised proof uses the equation, not that literal wording. Historical original publication dates/priority embellishments were removed; no original d’Alembert, Magnus/Rayleigh, Blasius or Kutta/Joukowski paper audit is claimed.

## Corrections and numerical scope

**4.8:** states the plane smooth-body hypotheses and uses the absence of a1/z velocity term, rather than an unreviewed3D assertion. The distant control-volume argument now includes pressure as well as momentum flux. A pressure coefficient near−19.8 at allowed flatness0.9/angle25° was clipped by the old−4.2 lower bound. The complete curve is visible, and the angle is correctly identified as the preimage-circle parameter. Exact circle input0 replaces a hidden0.001 substitution.

The former “wake” overwrite is an imposed load, not a velocity/pressure solution. Its downstream half now follows the stream direction, rather than fixed worldx. Its allowed base pressure0 gives **thrust** for a circle: independent integration gives D=−1/3 in the chosen units. The text no longer promises drag for all settings. Contributions use signed streamwise components of relative pressure; pressure-arrow lengths have a disclosed per-setting scale. Negative pressure coefficients are deviations from the far-field reference, not necessarily negative absolute pressure.

**4.9:** separates imposed circulation from an unspecified solid rotation rate. Rotating ticks are explicitly an arbitrary phase. At normalized circulation2.2 the exterior stagnation point lies4.160a below the centre, outside the former vertical window. Its full position now fits. The lift arrow's former saturation at2.2 drawing units is removed: length is exactly0.12 times the numerical force, and its whole extent fits. The force and pressure integral are signed; artificial1e−18 residual offsets are removed. The model states nonnegative circulation and positive stream/radius, with a single exterior stagnation point above the merger threshold.

**4.10:** distinguishes the single-valued analytic complex velocity from a potentially multivalued circulation potential. Counter-clockwise contours wind once around the body through nonsingular exterior fluid. With q=w′, the correct proof is

`F_x−iF_y=−i integral(p dbar(z))=(i rho/2) integral(|q|² dbar(z))`;

impermeability gives `q dz=bar(q) dbar(z)`, so `|q|² dbar(z)=q² dz`. Replacing a conjugate without its differential, as the previous idea did, is invalid. The complete selected mapped contour now fits the view at every control corner, and the sampling includes radius ratios1 and4 exactly. Analytic contour invariance is distinguished from finite numerical residuals.

**4.11:** signed lift is distinguished from its magnitude. Actual pressure-integral forces are reported separately from theoretical arrows. The previous high-control arrow ended at3.383 in a view ending1.95, while the cambered body's chord quadrature produced drag≈−2.4e−6 despite the claim of zero readout. Views now contain full arrows and signed numerical residuals are shown. The circle is exactly a circle, not a c=0.0001 approximation.

All three mapped-body pressure calculations now use a scoped analytic-tangent midpoint integral. Previously polygon-chord normals introduced a systematic finite-mesh bias. The periodic smooth pressure integral agrees with independent high-precision surface integration and the residue force; the discontinuous imposed-load toy retains a finite quadrature error and is not assigned machine precision. Its circle result converges by more than15fold when1440 panels are increased to5760. Shared map/Blasius implementations were not replaced, allowing the two force calculations to remain distinct.

## Reproducible validation

- `PYTHONPATH=/tmp/atlas-mpmath python3 tests/verification-fluid-forces-reference.py` generates [12 independent65-digit pressure integrals](fluid-forces-reference.json). It uses separate complex formulas and adaptive quadrature, with no production imports; includes zero circulation, full control force and off-centre bodies. Production midpoint integration agrees within2e−12 scaled tolerance.
- `node --test tests/verification-fluid-forces.test.mjs`: **6/6 groups pass**. Checks Cartesian stagnation roots and Fourier pressure forces, critical-point containment, impermeable normals/zero source flux/signed circulation, independent pressure references and residue force, zero-circulation corners, both signs of imposed streamwise load, refinement of the discontinuous case, all64 Blasius endpoint combinations and four-shape vector/arrow bounds.
- `node tests/verification-fluid-forces.mjs`: **8/8 actual light/dark groups pass**. Uses native slider keys and toggle keyboard activation: eight paradox corners plus actual thrust/drag, zero/merger/exterior cylinder states and actual play/pause/restart, all64 Blasius shape/angle/circulation/contour corners, and all eight lift-control corners for four shapes. Test-only instrumentation exposes actual state and stage bounds; it does not substitute programmatic control setters. Raw pressure values, curves, contours, force vectors, arrows, finite readouts and TeX/runtime diagnostics are checked.
- Standard renderer: all four entries pass in light/dark, zero static/runtime/TeX/blank/quality errors. All eight `/tmp/atlas-fluid-forces-{4.8,4.9,4.10,4.11}-{light,dark}.png` screenshots were directly inspected. The first screenshot pass exposed missing residual math delimiters; these were corrected and the full native sweep repeated.

Only these four source flags are cleared after source, mathematical, real-input and visual checks. Wave5 remains gated.
