# Independent review — Wave5 chemical kinetics chapter5

**Accepted.** Reviewed all11 frozen items in `content/kin/ch05.js`, `ch05-b.js`, `ch05-c.js` and their chapter-local helper. No content edits were made by this reviewer. Source, physical assumptions, mathematical calculations, units, signs and final both-theme mobile captures pass independent review.

## Physical and source checks

Opened the primary Illinois PHYS498 diffusion chapter, MIT10.626 Butler–Volmer notes and CaltechAUTHORS1956 Marcus paper record. Independently consulted official indexed IUPAC cage, kinetic-electrolyte and Marcus definitions after modern direct pages returned403. Source access limits in the author report are accurate: the original1956 abstract is distinguished from a modern authored reconstruction and inaccessible original fulltext/lecture access is disclosed.

-5.1 distinguishes collisions and encounters; the geometric recurrence is explicitly an authored model, with tail probability retained.
-5.2 correctly uses an unbounded3D stationary maintained reservoir, independent relative diffusion DA+DB and perfect absorption. The 1000NA conversion from m³/s to L mol⁻¹ s⁻¹ is correct.
-5.3 uses a surface speed w with unitsm/s. Contact concentration, Damköhler ratio and reciprocal resistances agree; this is not mistaken for a bimolecular microscopic constant.
-5.4 uses the correct positive-exponential radial resistance for potential U. The substitution x=R/r yields exp(ξxexp(−s/x)), consistent with the actual chosen screened potential. Repulsion suppresses and attraction enhances capture; neutral/screened limits agree. Quadrature differences are not called rigorous error bounds.
-5.5 correctly subtracts reactant/transition-state activity charges, uses log10, normalized molal ionic strength and dilute limiting assumptions. No high-salt universality is asserted.
-5.6 acid-series slope against pKa is−α. The transport cap is explicitly a separate same-unit model; empirical slope ranges are not universalized.
-5.7/5.8 separate molar harmonic reorganization barriers from an explicitly chosen first-order transmission/prefactor rate. They do not confuse an encounter-complex rate with bimolecular capture. Classical equal-curvature assumptions and quantum/electronic-coupling limitations are stated.
-5.9/5.10 consistently use anodic-positive current, cathodicα, η=interfacial E−local Eeq, local dimensionless activities and one electron. The Nernst ratio, both signed branches, area-specific resistance and Tafel slopes/error are correct. Film transport is explicitly one-way and restricted to the suitable branch.
-5.11's two-coordinate variational identity is algebraically correct; the modern model is not falsely presented as a reproduction of1956 figures/data.

## Independent numerical checks

Reran `node --test tests/wave5-kin.test.mjs`: **11/11 groups pass**. Tests include40,000-panel independent resistance integrals, terminating-branch cage sums, flux derivatives, activity quotients, Marcus barriers, current reversals and Tafel errors.

Additional reviewer oracles, executed separately from the author test definitions:

1. Inverted symmetric Butler–Volmer using η=(2RT/F)asinh(j/(2j0)) for temperatures250/298.15/350, j0=0.1/1/10 and signed currents spanning10⁻³–10⁴. Maximum relative current mismatch1.46×10⁻¹⁵.
2. Independently checked detailed-balance partial-current ratio exp(Fη/RT) and nonnegative dissipationηj across transfer coefficients0.2/0.37/0.8, temperatures270/298/340 and31signed overpotentials. Maximum logarithmic ratio residual8.88×10⁻¹⁶.
3. Located reactant/product parabolic intersections by70-step bisection, including exergonic and endergonic cases beyond the plotted subset. Maximum independent barrier mismatch5.68×10⁻¹⁴kJ/mol.
4. At exactly1mol/L, calculated number-density capture events and independently compared with the molar coefficient; conversion ratio exactly1 in floating arithmetic.
5. Independent native320px browser interaction on5.9 in both themes atη=−0.15,0,+0.15 verified the readout sign and exact zero, with no runtime/TeX errors.

## Visual/native evidence

Inspected all22 light/dark320px full-page captures in `/tmp/atlas-wave5-native/kin-5.N-{light,dark}-320.png`, plus both-theme wide contact sheets and individual full-resolution5.9dark mobile capture. Display equations fit, controls wrap, panel labels/readouts remain legible and positive/negative branches are clear. No actionable clipping or theme defect remains.

The author's final native matrix reports **11items,44theme/width groups,252real control actions** at320/1200px, both themes, all passing. Both-theme all-mode captures and mobile display-math audit also pass. Mathematical conclusions are analytical identities/model claims; plotted numerical residuals and illustrative curves are honestly scoped.

No review finding remains open. Ready for root acceptance/commit.
