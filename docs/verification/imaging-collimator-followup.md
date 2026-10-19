# Imaging collimator source and model follow-up

Resolved after coordinator integration: **imaging-4.4**. The source flag and ledger were reconciled after independent parent reruns. No other item or prerequisite list is changed.

## Primary evidence

Weinmann, Hruska and O'Connor, *Design of optimal collimation for dedicated molecular breast imaging systems*, Medical Physics 36(3):845-856 (2009), [complete original author manuscript](https://pmc.ncbi.nlm.nih.gov/articles/PMC2736746/), [DOI](https://doi.org/10.1118/1.3077119). The entire relevant Methods treatment was read: General collimator theory, Eqs.1-6 and Fig.1; septal penetration constraints; Table I; and Collimator near-field considerations. The article's task-specific breast-imaging optimization and clinical-dose conclusions are not generalized into this entry. Local source HTML `/tmp/atlas-imaging-collimator-primary.html`, SHA256 `a40f64a7704d08498f64173efbb26cfd19234e7c5be44297e024eb79aa85284f`. MathML was inspected to retain square roots lost by plain-text extraction.

Exact source anchors: Eq.1 gives geometric efficiency as open area squared divided by 4 pi times effective length squared times cell area. Eq.2 specializes this to regular hexagonal holes, with diameter flat-to-flat and coefficient sqrt(3)/(8 pi). Eq.5 gives Rc = d(Le+z)/Le under that convention. Eq.6 gives approximate quadrature system blur. The near-field section explicitly gives zmin = L/2 + Lt/d and explains failure of position- and distance-independent sensitivity below that value. Table I supplies the lead coefficient 26.32 cm^-1 at 140 keV, now used explicitly rather than an undocumented interpolated surrogate.

## Corrections

The remembered coefficient .24 squared was 0.0576, whereas the actual hexagonal geometry coefficient is approximately 0.0689161: the old efficiency was about 16.4% low relative to the corrected estimate (the corrected/old ratio is about 1.196). A dedicated helper derives the result through the two hexagonal areas.

The old universal claim g proportional to Rc squared contradicted the displayed sweep, which varies diameter while holding septa fixed. Its actual logarithmic slope is 2 + 2t/(d+t), between 2 and 4, and doubling diameter changes efficiency by 16(d+t)^2/(2d+t)^2, greater than four for nonzero septa. A square law applies when t/d stays fixed at fixed length and distance. Statement, caption, readout and numeric comparison now distinguish these cases.

The near-field controls remain usable to break the averaged model's assumptions. The readout explicitly marks estimates as formal and flags z below zmin. The left picture is labelled a two-dimensional acceptance cross-section, with no unsupported claim about counting holes in a two-dimensional hexagonal array. The selected source now tracks the full 5-200 mm control range; it previously stopped drawing at 125 mm. Geometry, blur and log-tradeoff axes now include all plotted values. The former fixed 40 mm blur ceiling hid supported estimates exceeding 100 mm.

The shortest-septal-path attenuation screen uses w = tL/(2d+t). Solving exp(-mu w) <= .05 gives t >= 2d[-ln(.05)]/[mu L + ln(.05)]. This is an explicit geometric screen, not a simulated septal-penetration correction or a claim about complete gamma transport. The readout flags excessive transmission rather than silently treating its added counts/blur as part of the model. Intrinsic blur and presets remain explicitly illustrative, and unit detector efficiency and absence of body scatter are retained.

## Independent checks

`node --test tests/verification-imaging-collimator.test.mjs`: **5/5 groups pass**. A separately constructed six-vertex polygon and shoelace area recover aperture/cell areas and the geometric coefficient across diameter/length/septa combinations. Symmetric finite log differences verify the slope; diameter doubling supplies the counterexample to a universal square law, while matched fractional septa restore it. Near-field endpoints and exact threshold crossing are checked. The exponential attenuation inequality is tested immediately above and below the solved septal threshold. Every supported physical input corner is finite and the formerly clipped >100 mm blur is asserted. No Monte Carlo transport or empirical instrument calibration is claimed by these tests.

`node tests/verification-imaging-collimator.mjs`: **2/2 actual light/dark groups pass**, each exercising all sixteen input corners and three presets. The gold source tracks 5 and 200 mm exactly; all tracked curves, points and handles fit their bounds; the worst blur corner expands beyond 100 mm; regime and coefficient labels remain present. No runtime, TeX or blank-canvas errors. Both screenshots `/tmp/atlas-imaging-collimator-{light,dark}.png` were visually inspected for the corrected formulas, readable plots, dynamic source position and explicit model limitations.

`node scripts/check.mjs imaging-4.4 --static`: **1 item, 0 errors, 0 warnings**. This is source, mathematical, browser and agent visual evidence; it does not claim a calibrated clinical scanner model.
