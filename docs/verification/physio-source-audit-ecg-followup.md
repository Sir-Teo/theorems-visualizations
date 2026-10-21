# Physiology ECG source audit

Resolved after parent integration: **physio-3.9**. The source flag and ledger were reconciled together after parent reruns; prerequisites and adjacent chapter items are preserved.

## Sources actually read

- Willem Einthoven, [Nobel lecture delivered 11 December 1925](https://www.nobelprize.org/uploads/2018/06/einthoven-lecture.pdf), *The string galvanometer and the measurement of the action currents of the heart*. Read the **entire 18-page lecture**, printed pp. 94–111. In particular **p. 102 / PDF p. 9** directly specifies the three limb leads and states III = II − I; inspected its original rendered page. The entry now cites this definite primary-source event rather than asserting unchecked galvanometer/triangle priority dates. Local `/tmp/atlas-physio-einthoven1925.pdf`, SHA-256 `490d70888ef7e9350fb40e4902dacb35072f498c8523ba4e48d51702fd20bead`.
- Keener and Sneyd, [author-hosted manuscript](https://www.math.utah.edu/~keener/books/control.pdf), complete §12.1.2, printed pp. **533–539**, equations **12.5–12.11** and **Figure 12.5**. The current-dipole simplification, homogeneous conductor, projection law and equilateral lead vectors are separately specified there. The exact voltage-difference identity precedes those approximations. Read the equations and explicit real-torso caveat; rendered and inspected **p. 538**. Exact artifact/edition convention and SHA-256 are as in the geometry/dynamics reports.

## Corrections

- The single dipole and equilateral projection rule are now explicitly approximations. Einthoven's algebraic lead identity does **not** depend on an equilateral body or a dipole approximation.
- Removed the unchecked and internally inconsistent normal-axis cutoff variants and clinical deviation labels. The animation still gives the chosen loop's mean QRS axis, states its exact 55–130 ms averaging interval, and lets the reader test projection signs. No diagnostic classification is inferred from an invented Gaussian trace.
- The triangle is now exactly equilateral, with its heart-vector origin at the actual centroid, so the electrode geometry agrees with the claimed 0/60/120-degree lead axes.
- Added horizontal margins for the lead-trace time domain so the animated cursor dot remains visible at the cycle boundaries.
- Gaussian wave parameters are unchanged and explicitly labelled as chosen model inputs in the dedicated `physio-source-audit-ecg.js` helper.

## Validation

- `node --test tests/verification-physio-source-audit-ecg.test.mjs`: **4 groups pass**. 200 arbitrary electrode-potential triples establish the algebraic identity independently of any body model. For 601 independent vector angles, actual electrode-potential differences agree with unit-axis projections and the drawn triangle has equal side lengths. Across **211 rotation settings ×801 time samples**, all complete waveforms satisfy I+III=II and rotation preserves vector magnitude. Perpendicular projections vanish, and the chosen mean QRS direction rotates by exactly the control angle.
- `node tests/verification-physio-source-audit-ecg.mjs`: **2 native light/dark groups pass**. Actual slider endpoints and play/pause, independent displayed lead identity, complete waveforms and dot-radius containment, no page/math-render/invalid-number errors.
- Inspected full-size negative-rotation/light and positive-rotation/dark screenshots; traces, triangle, vector arrows, labels and readout are legible. Files `/tmp/atlas-physio-ecg-3.9-{Home,End}-{light,dark}.png`.
