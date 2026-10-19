# Physical chemistry chemical potential / Clapeyron review

Ready IDs: **pchem-4.2, pchem-4.3, pchem-4.4** in `content/pchem/ch04.js`. Other three phase reviews remain flagged until their separate source/math/UI pass. Dedicated helper `pchem-source-audit-clapeyron.shared.js`; no existing shared helper or central files changed.

## Evidence

[Arovas author textbook](https://courses.physics.ucsd.edu/2013/Spring/physics210a/LECTURES/BOOK_STATMECH.pdf), full2023 edition already downloaded/read, SHA256 `f8335f922bdb497fb2df4977dc3629bae4fabf7def3e50caac370d19b0e1db2b`: §§2.8–2.9 printed61–66 (PDF87–92), Gibbs extremum and derivative relations; §2.12.2 printed82–83 (PDF108–109), complete derivation Eqs2.283–2.287 from equality of chemical potentials through Clapeyron to integrated ideal-vapour approximation. Required fixed composition, bulk pressure-volume work, first-order discontinuities and nonzero volume difference stated explicitly. Coincident metastable branches need not minimize Gibbs energy. Original historical priority dates removed; these are theorem/method entries, not original-paper entries.

[NIST water phase table](https://webbook.nist.gov/cgi/cbook.cgi?ID=C7732185&Mask=4#Thermo-Phase), actual Antoine coefficient table inspected: Stull row255.9–373K, A4.6543,B1435.264,C−64.848, pressurebar/temperatureK. The visualization uses only273.16–373K. Its sea-level inverse is373.49K, outside this source interval; no source curve or marker is extrapolated there. This is an official regression, not raw measured points or independently validated calorimetry. No percent-accuracy claim retained.

[NIST CO₂ phase table](https://webbook.nist.gov/cgi/cbook.cgi?ID=C124389&Mask=4#Thermo-Phase), actual sublimation table inspected:25.2kJ/mol at195K, Giauque–Egan1937 row. Previous26.1kJ/mol belonged to207K, so the near194.69K illustrative tangent now uses25.2. The gas volume is explicitly ideal. Other rounded water local constants and estimated CO₂ fusion constants are disclosed as illustrative choices; removed the unsupported steam-table provenance and the Antoine comparison evaluated outside its source domain.

The lapse-atmosphere helper follows ideal-gas hydrostatic equilibrium with chosen288.15K sea-level temperature,0.0065K/m lapse,1.01325bar,9.80665m/s² and287.05287J/(kgK). It is a model, not weather or a claim to an independently verified complete ISA implementation.

## Changes

4.2 makes branch minimization hypotheses and the distinction between stable coexistence and equal metastable branches explicit. Gas entropy changes with pressure because its potential contains RTlogp. The displayed zero-Cp curves are affine, and the analytic liquid-vapour crossing is computed from those same potentials. Removed the false equality to a different constant-enthalpy CC approximation. Marked low-pressure ice/liquid equality as metastable when gas wins. Pressure capped100bar within the toy's declared range; all μ branches and zoom markers fit dynamically. The toy is not a real-water critical model.

4.3 qualifies critical/finite-offset limits, constrains actual dragged points to the selected transition window and clips the displayed tangent to that window. All chemical-potential terms retain signs and Pa/bar conversion. The coincidence readout says first-order coexistence within numerical tolerance. Unsupported historical/measurement-specific claims removed.

4.4 restricts Antoine plots and input domains, omits out-of-source inverse markers, and explicitly reports the unavailable comparison. Native altitude reaches8849m. A near-coincident interval below1e−6 axis units uses the analytic midpoint derivative limit rather than an unstable0/0 secant (pointer conversion can leave a few1e−8 axis units); readout identifies the tangent limit. Independent tests verify both separated and approaching secants and the factor1000 in apparent enthalpy. Plot limits include both approximation and tangent endpoints.

## Validation

- `node --test tests/verification-pchem-source-audit-clapeyron.test.mjs`: **6/6 groups**. Independent derivatives/units, analytic crossing versus bisection and metastability, local chemical-potential cancellation, NIST formula/inverse/source endpoints, finite-difference tangent and secant limit, hydrostatic differential equation and CC reference inversion.
- `node tests/verification-pchem-source-audit-clapeyron.mjs`: **6/6 item/theme groups**. Native logarithmic pressure at5cases, all4transition menus×5actual pointer cases,4altitude/enthalpy corners,3coincident-handle pointer regressions at source endpoints and interior. Inspects actual plotted markers/bars/slope, source-domain omissions, geometry containment, browser/TeX errors in light and dark.
- Screenshots inspected: `/tmp/atlas-pchem-clapeyron-chemical-potential-light.png`, `...-clapeyron-dark.png`, `...-clausius-clapeyron-light.png`; both-theme captures exist. Final readout/spacing cleanup rerun: all6native item/theme groups passed again.

No simulations replace source proofs; no subjective human/listening gate or Wave5 completion.
