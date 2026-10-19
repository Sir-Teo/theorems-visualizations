# Physiology ventricular-wall source audit

Resolved: **physio-3.8**. Parent independent mathematical/native checks and screenshot inspection passed; the content flag and source ledger are reconciled.

## Primary source actually read

Mirsky (1969), [Left Ventricular Stresses in the Intact Human Heart](https://pmc.ncbi.nlm.nih.gov/articles/PMC1367427/), *Biophys J* **9**, 189–208, DOI **10.1016/S0006-3495(69)86379-4**. Read complete original pp. **190–193 and202–204** by OCR and directly inspected the original pp. **203–204**. These describe the geometric assumptions, radial and tangential stress variation, and the limitations of applying a naive inner- or midwall-radius Laplace formula to thick ventricular walls. The paper's modified formulas and numerical local-stress estimates are not claimed to be reproduced here.

The entry now confines the familiar law to a thin spherical membrane with transmural pressure. A second curve is derived independently by force balance: pressure force on a hemisphere's cavity disk equals the resultant normal force over its equatorial annulus, so the cut-average stress is `P ri²/(ro²−ri²)`. This is an exact force-resultant average for the chosen static spherical geometry, not a local myocardial fibre-stress solution. Unsupported historical dates and clinical predictions are removed; the chosen wall volume, zero exterior pressure and thick-wall violations are explicit.

Local HTML `/tmp/atlas-physio-mirsky1969.html`, SHA-256 `abff3f5ea53bb61155430582490336efaacaf4a9cfb033c42b8996e6576f998d`; scan203 `80ce56a1aed1caf9663029291c59f4ee80e993e147123cc7be233fbcf87968cf`; scan204 `ea3aa7613dbd3a773aa15375e605a5c146ad338c49e5620e60898d1e7c35aebc`.

## Corrections and validation

The panel now exposes `h/ri` and the relative excess of the thin-wall estimate over the cut average, instead of silently using the membrane formula for thick geometries. Cross-section and full pressure/stress curves use adaptive bounds.

- `node --test tests/verification-physio-source-audit-wall.test.mjs`: **3 groups pass**.601 independent volume-preserving geometries; Simpson integration of pressure over the hemisphere compared with annular resultant force for27 volume/wall/pressure combinations; exact relative-error identity and thin-wall limit; every sample of all16 actual resistance/wall-volume/dilation/contractility corners.
- `node tests/verification-physio-source-audit-wall.mjs`: **2 native light/dark groups pass**. All4 actual preset buttons and all16 actual slider corners per theme; independent force/volume/error calculations, complete curve and marker containment, native play/pause, finite readouts and no page/math errors.
- Inspected original pp.203–204 and full-size low/light and high/dark screenshots: `/tmp/atlas-physio-wall-3.8-{low,high}-{light,dark}.png`.
