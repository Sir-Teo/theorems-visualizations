# AERO written cross-field prerequisites — 2026-10-20

This batch adds 14 prerequisite edges across 13 existing written items, each accompanied by a bounded derivational paragraph and the identical syllabus-row change. Read-only inventory moves AERO from **11 written-to-written / 25 written-to-known / 55 whole-syllabus** to **25 / 39 / 69**, with no unknown target. These figures remain provisional until independent peer acceptance and coordinator integration; no global inventory, source-closure record, or verification flag is changed.

## Actual target consumption

The actual authored target statements and proof ideas were read, together with each complete consumer argument. The following are mathematical or physical steps already used by those arguments, rather than related-topic links.

| Consumer | Added target(s) | Consumed statement and hypotheses |
|---|---|---|
| 1.1 ISA | pma-6.21 | Fundamental theorem integrates the continuous log-pressure derivative within a positive-temperature prescribed layer; lapse zero is a separate linear exponent and the layer-base pressure fixes the constant. |
| 1.3 Buckingham π | ladr-3.21 | Rank–nullity of the dimensional-exponent map gives kernel dimension n−3 when the three rho,V,S columns are independent. No unconditional dimension count is asserted for rank-deficient variable sets. |
| 1.6 speed of sound | pma-5.5 | Chain rule differentiates C exp(gamma log rho) along a positive-density, fixed-gamma isentrope, giving gamma p/rho rather than the isothermal derivative. |
| 2.3 section lift | pma-6.12 | Integral linearity combines opposite pressure integrals into their difference; common free-stream pressure cancels. The small-angle force direction approximation is distinguished from exact linearity. |
| 2.5 panel methods | ladr-3.43 | Matrices of strength-to-velocity and normal-projection maps compose in matching intermediate coordinates. Invertibility and convergence are separate obligations. |
| 3.4 vortex lattice | ladr-3.43 | The same composition theorem assembles the three-dimensional induced-velocity and fixed-normal maps; entries are velocity dot normal, with free-stream projections on the right-hand side. |
| 3.5 maximum L/D | pma-5.3; pma-5.8 | Quotient rule gives the positive-denominator derivative; the interior-extremum theorem supplies necessary stationarity. Its positive-to-negative sign change establishes the positive-lift global maximum. |
| 3.6 minimum drag | pma-5.8 | Positive-speed differentiability gives the necessary stationary condition for A,B>0. The explicit nonnegative square identity separately establishes global minimality. |
| 4.1 Prandtl–Glauert | pma-9.15 | Multivariable chain rule twice transforms the C² potential equation for fixed 0<M<1; division requires beta>0 and the map degenerates at Mach one. |
| 4.2 drag divergence | pma-5.5 | Fixed correlation parameters and scalar chain rule yield 80(M−Mcr)³ on the positive branch; both derivatives meet at zero at the threshold. The derivative convention yields an offset, not a shock prediction. |
| 4.5 Prandtl–Meyer | pma-6.21 | For gamma>1,M>1 the continuous expansion derivative integrates to primitive differences; sonic limiting value fixes its constant. It does not replace compression-shock jump conditions. |
| 4.6 supersonic thin airfoil | pma-9.15 | First and second derivatives of f(x−beta y) verify the linear potential equation and connect boundary slope to pressure, retaining small-disturbance scope. |
| 4.7 Sutton–Graves heating | climate-1.2 | Actual Stefan–Boltzmann radiation law supplies sigma T⁴; a fixed positive grey emissivity and much colder surroundings yield the separate positive equilibrium reference temperature. No hot-wall convective feedback is claimed. |

These targets are the authored FTC, integral-linearity, rank–nullity, matrix-composition, quotient, stationarity, scalar/multivariable chain-rule and Stefan–Boltzmann results. Their use is limited to those statements; no numerical correlation or aerodynamic approximation acquires a new physical validity claim from the mathematical prerequisite.

## Preservation and independent validation

A temporary explicit audit compares the complete serialized baseline and candidate objects, including actual function source, all flags, refs, links, and model text. All **29** written objects retain every field except exactly the 13 appended idea paragraphs and 14 mapped deps. The complete syllabus retains every field except those exact deps. Existing private helpers are byte-for-byte unchanged. Baseline, audit, mapping and output live in `/tmp/atlas-aero-prereqs-evidence/{baseline.json,guard.mjs,guard.log,mapping.json,inventory.json}`; the audit is not a default snapshot test.

`node tests/verification-aero-prereq-audit.mjs` passes 10 independent groups without importing production formula helpers: positive-temperature hydrostatics/FTC, dimensional rank/kernel examples, isentropic derivatives, oriented pressure-integral cancellation, independent panel/lattice composition, drag extrema and square bound, subsonic/supersonic coordinate derivatives, quartic threshold/0.1 derivative convention, expansion derivative/quadrature, and separate radiation balance/scalings.

`AERO_PREREQ_OUTPUT=<own-directory> node tests/verification-aero-prereq-prose.mjs` passes **26** fresh native mounted pages, all 13 changed ideas at 320px in light and dark themes. Runtime/TeX/blank checks, actual idea horizontal scroll bounds and every rendered TeX rectangle pass. The complete ideas were captured, and separately captured appended paragraphs were inspected in both themes; all changed prose and equations are readable without clipping. Screenshots and native output: `/tmp/atlas-aero-prereqs-evidence/native/` and `native.log`. The text isolation occurs only after native mount checks and retains the harness’s 284px content width. This verifies changed text and mounting; it does not recertify all inherited interactions or source claims.

Strict build: **6684 written + 6890 planned, 450 chapters, 85 collections; 0 errors, 0 warnings**, home payload **112715 bytes gzip**. AERO static check: **29 items, 0 errors, 0 warnings**. Logs: `/tmp/atlas-aero-prereqs-evidence/{math,build,static}.log`.

## Bridge review

Actual changed-ID references were searched in `content/bridges`. The only match is `harmonic.js`’s aero-2.5 step: combining elementary potential flows and solving wall/Kutta conditions, with attached incompressible ideal-flow limits. The added composition proof explains that assembly and expressly preserves the additional solvability obligation. Its existing bounded bridge note remains accurate; no bridge update is needed. No bridge, runtime, source flag, global inventory, or queue file is edited.
