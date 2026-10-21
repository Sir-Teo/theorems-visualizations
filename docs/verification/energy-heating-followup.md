# Energy 3.1 — heating values and burner balance

Status: source, independent arithmetic, native browser and agent visual checks complete; parent independent mathematical/native checks and screenshot inspection passed; source flag and ledger are reconciled.

## Source records inspected

Read the relevant original NIST Chemistry WebBook SRD69 thermochemistry tables directly, including species phase, molecular weight, selected value, uncertainty and underlying attribution:

| Species | Selected formation enthalpy, kJ/mol | NIST record and attribution |
| --- | ---: | --- |
| CO₂(g) | −393.51 | [Record](https://webbook.nist.gov/cgi/cbook.cgi?ID=C124389&Mask=1), CODATA |
| H₂O(l) | −285.830 | [Record](https://webbook.nist.gov/cgi/cbook.cgi?ID=C7732185&Mask=2), CODATA |
| H₂O(g) | −241.826 | [Record](https://webbook.nist.gov/cgi/cbook.cgi?ID=C7732185&Mask=1), CODATA |
| CH₄(g) | −74.6 | [Record](https://webbook.nist.gov/cgi/cbook.cgi?ID=C74828&Mask=1), Manion (2002) recommendation |
| Propane(g) | −104.7 | [Record](https://webbook.nist.gov/cgi/cbook.cgi?ID=C74986&Mask=1), Pittam and Pilcher (1972), ±0.50 |
| n-octane(l) | −250.3 | [Record](https://webbook.nist.gov/cgi/cbook.cgi?ID=C111659&Mask=2), Good (1972), ±1.8 |

These are selected records in an authoritative reference database. No reading of every underlying calorimetry paper is claimed. The propane value is no longer from memory; n-octane uses one attributed result rather than an unattributed average of different measurements. The phase-change value follows directly from the two water formation enthalpies, 44.004 kJ/mol / 18.01528 g/mol = 2.442593 MJ/kg; it is not inferred from an Antoine vapour-pressure fit.

## Repairs

The wet-basis expression is now explicit: if dry hydrogen fraction is `h` and wet-basis moisture is `M`, total water per kilogram wet feed is `8.93668 h(1−M)+M`. Coal and wood are clearly labeled chosen C/H/O/ash models, with both their composition and HHV stated rather than presented as measured sample data.

The burner balance now includes inert ash. Previously the model omitted 5% dry-coal and 4% dry-wood residual mass from the products. Pure-compound balances use the balanced reaction; solid models include water carried in with the fuel. The readout reports the mass closure. Small ash segments have values in an unclipped product summary instead of a label extending beyond the canvas.

## Verification

- `node --test tests/verification-energy-heating.test.mjs`: four groups pass—independent reaction enthalpy arithmetic, liquid/vapour identity, mass and elemental-oxygen budgets, wet-wood moisture penalty and efficiency-basis invariance.
- `node tests/verification-energy-heating.mjs`: both themes pass all six fuels × four moisture/efficiency corners × two displayed bases. Readouts remain finite and identify the mass closure; no runtime/TeX/blank-stage errors.
- `node scripts/check.mjs energy-3.1 --static`: one item, zero errors/warnings.

Agent-inspected full light/dark screenshots `/tmp/atlas-energy-heating-{light,dark}.png`; bars, basis toggle, water latent heat, ash products and mass readout agree with the model. No human review is claimed or required. The model omits excess air/nitrogen, sulfur chemistry, sensible exhaust losses and measured solid-fuel variability.
