# Independent REL5 review

Status: **ACCEPTED** on the final frozen source bytes, all ten items.

## Sources and mathematical scope

Read the actual saved official [Tong electromagnetism chapter](https://www.damtp.cam.ac.uk/user/tong/em/el4.pdf): neutral-wire discussion pp.103–105, boost equations5.17–5.18, covariant Maxwell equations5.26–5.28 and stress/energy equations5.44–5.50. Rendered p.108 was inspected for the boost signs. Read [Carroll's author-hosted notes](https://www.preposterousuniverse.com/wp-content/uploads/grnotes-one.pdf), pp.28–30, including number flux, dust, isotropic pressure and conservation conditional on equations of motion; inspected rendered p.29. The opposite metric signature and c=1 convention are converted correctly.

The +--- metric, passive observer boost and SI factors agree throughout. E·B is explicitly restricted to proper Lorentz transformations; parity reverses its pseudoscalar sign. The wire transforms species densities rather than assuming equal proper densities, and correctly relates transverse three-force to four-force. Maxwell covariance transforms derivative indices too; it is not claimed to derive the physical law from symmetry. The circle is boosted in time as well as position. Six cold streams transform both coordinate density and momentum, without pretending to be a thermal perfect fluid. The hydrostatic constitutive tensor and conservation equations are separate claims. The contact profile is an exact isobaric advection example rather than a pressure-step solver. Radiation pressure assumes a fixed opaque normally illuminated surface and distinguishes instantaneous tensors from averaged intensity.

Actual derivational dependencies and related future generalizations were inspected; no hidden future field equation or fluid solver is needed by the supplied examples.

## Independent calculations

Reviewer utilities `/tmp/wave5-rel-review-data.mjs` and `/tmp/wave5-rel-review-oracle.py` pass **987 independent comparisons**:

- Explicit six-component boost formulas and EM stress computed by independent Minkowski tensor contraction.
- Independently simplified boosted Maxwell fields and every analytic derivative component, source and cyclic identity.
- Carrier proper-density/velocity addition and transverse force conversion; cold-beam moments from transformed velocities and densities; fluid tensors by boosting the diagonal rest tensor.
- Gaussian box charges using analytic erf integrals, contact-profile analytic storage and flux, and SciPy integration of the relativistic Lorentz force against the boosted circular trajectory and work balance.

The largest observed true quadrature differences are 1.54e-9 in normalized Gaussian charge and 1.95e-10 in normalized contact flux. These remain numerical diagnostics, not certified bounds. Independently reran all **13 math/metadata groups**, including the final parity and amplitude-normalization regressions: pass.

## Native and visual evidence

Independent `/tmp/wave5-rel-review-browser.mjs`: **40 groups, 448 physical actions, 192 actual URL replay/rejection checks**, actual1200/320 CSSpx in both themes. Log `/tmp/wave5-rel-review-browser.log`; captures `/tmp/wave5-rel-review-production`. All selector branches, conditional controls and visible range endpoints pass, together with complete statement/idea/caption/scope/readout math/text bounds and conservative arrow/path/rectangle/circle/glyph/dot-ring bounds. Minimum marker/ring clearance5.333 CSSpx, glyph clearance3.116 CSSpx. Final bounded-volume prose in5.5/5.9 was included.

Edited/off-grid snapshots, malformed/out-of-range rejection and real Create state link replay pass. Positive MIN_VALUE/1e-200/1e-20 amplitudes preserve their exact model values and nonzero analytic normalized tensor; zero amplitude uses its explicitly declared zero matrix. These states also survive real Share links with identical readouts. Normalized field shapes and pressure response are declared conventions at zero intensity; tiny physical SI values may underflow.

Personally inspected all20 narrow default visualizations in both themes, and full-size rich conservation/radiation statements and scopes. Matrices, arrows, drift orbit, flux charts and readouts are legible. The tall5.10 locator-only widget capture truncates its final readout lines; its complete full-page capture confirms these lines fit and are visible in the actual page. This is a capture artifact, not product clipping.

All ten items pass AUTHORING§2's seven qualitative criteria, with distinct tensor, field, orbit, distribution and finite-volume examples. No unresolved mathematical, source, state or visual issue remains. Reviewer browser closed; keep source frozen.
