# ENERGY5 — independent review

Status: **accepted against exact author freeze v1**. All eight frozen hashes match before and after independent native review. All reviewer browsers and servers are closed; the lane is released. Author evidence remains separate from the independent results below.

## Actual source and prerequisite reading

Read the actual available primary/official bodies, not only filenames or author claims: MIT wind lecture PDF16–18; Godart's official OCW book PDF194–201 / printed191–198; DOE-hosted EPRI PDF111–113 / Appendix A-5–A-7; Blankenship et al original article PDF2–3 / printed805–806; official SAM Wind Resource HTML's annual Weibull/time-series and wind-direction restrictions. Independently extracted actual PDF passages are saved in `/tmp/wave5-energy-peer-actual-source-read.txt`. Personally viewed the actual Godart PDF197, EPRI PDF111 and Blankenship PDF3 page images.

The MIT wind lecture's verbal capacity-factor definition is imprecise; the new chapter correctly uses average output divided by nameplate rating and does not copy the fraction-of-time-at-rating sentence. No historical market figures or geothermal core-temperature efficiency are adopted as present observations. The EPRI spectral formula and biomass annual whole-spectrum/land-time boundaries support the chapter's explicit conventions.

Read the actual written prerequisite statements, ideas and scopes in `/tmp/atlas-wave5-energy-prereqs.json` and `-wave-inputs.json`, plus the live bodies of FLUID1.5, ENERGY1.1/2.1 and ODE1.4. Momentum and Bernoulli are applied to the appropriate steady control volumes and separately on the two sides of the actuator disk, not unchanged across work extraction. WAVES3.5 provides group propagation; the chapter separately supplies the wave pressure-work calculation rather than silently treating envelope propagation as a universal energy theorem. Unwritten AERO7.3, FLUID11.3/9.2/9.3 and PCHEM10.6 are not proof dependencies.

No original Betz1920 body, restricted2013 translation, Jensen1983 body or NREL55054 body was requested/recovered by this reviewer. Existing stops remain binding. The Paper5.12 original-body uncertainty flag and original bibliography/introduced relationship survive final compiled native review; a modern independent disk derivation does not clear that flag.

## Proof/model assessment

The disk hypotheses make the 16/27 bound conditional on a steady unconfined single disk, equal remote pressure, no swirl or extra energy. Actual continuity areas and momentum/pressure-jump power agree. The tip curve, height profile and wake recovery are explicitly authored finite choices rather than calibrated blade, turbulence or original Jensen simulations. The wake's spacing convention is consistent: its control uses diameters, so radius growth uses twice the control value.

Wind statistics integrate the full power-producing support, with an exact probability plateau and an independent quadrature/refinement diagnostic for the ramp. Cut-out mass produces zero power; no false pure-cube Jensen guarantee is extended to the capped curve. Hydropower uses net total head and a separate conversion efficiency. The one-way basin model integrates potential energy and stops its orifice solution at emptying; no real tide timing is inferred.

Regular wave height gives mean energy rho*g*H²/8; spectral Hm0 gives rho*g*Hm0²/16. The supplied three periods have 35/21/15 whole cycles in 21Te, so the fixed phases are orthogonal over that interval. Their actual amplitudes give variance Hm0²/16, and their weighted mean period is Te. Deep-water pressure-work flux agrees with energy times group velocity. The finite signal is not presented as measured weather or a random sea.

The geothermal thermal balance, exact cooling and variable-temperature Carnot-fraction work integral are consistent. Available heat and recoverable work stay distinct. Biomass uses chosen annual net harvested chemical energy and a separately chosen dry heating value/electrical fraction; quantum yield, moisture/crop calibration, carbon neutrality and land availability are not inferred.

## Independent numerical evidence

`/tmp/wave5-energy-peer-export.mjs`, `-values.json`, `-reference.py` and `-reference.log` independently check **1,632 scalar outputs** against 850-digit original-input mpmath expressions and SciPy adaptive quadrature. Coverage includes wind mass/flux, disk velocities/coefficient/power, finite-reservoir temperature/drop/heat/work/power/Carnot average, basin head/remaining/released energy, and 80 independently integrated capacity factors. The largest ordinary relative discrepancy is about 1.017e-9 from the intentionally finite 400-panel CF quadrature; the comparison allows 2e-9 there. Closed forms use a separate 4e-13 relative criterion; very small outputs additionally require agreement on nonzero/zero representability and at most two minimum-subnormal units. This finite evidence is not a universal error bound.

The additional `/tmp/wave5-energy-peer-extra.mjs/.json/.py/.log` passes **204 independent output/finite-signal comparisons** for hydro conversion, tip-response tiny coefficients versus rescued power, biomass conversion, repaired wake loss, regular/spectral energy and flux, and actual sampled surface mean/variance over 21Te. Tiny original-input references again use 850 digits. Finite-signal integration uses42,000 midpoint samples and checks the known analytic variance independently of the model output.

## Findings and disposition

One helper-level premature-rounding defect was reported and repaired before author freeze: wake loss multiplied already rounded upstream device power. At speed8.5e-109, radius5, density.8, induction.1, spacing2 and expansion.01, the old result was zero even though an 850-digit original-input loss is 0.5800790132518700 minimum-subnormal units and rounds to MIN. The repaired original-factor product returns MIN with no false underflow flag. Neighboring below-range values remain zero with an explicit underflow flag. The actual wake widget fixes wind speed10, so this was a valid pure-helper domain defect rather than an exposed speed-control failure.

Independent live-vs-baseline metadata comparison passes all twelve frozen identities, exact Paper authors/year/title/venue and introduces, verify:true, and non-5/top-level syllabus deep equality. No source, proof, model or UI finding remains pending. Final controls, modes, raw states, Share, Paper metadata, complete text/ink/readout bounds and independent pixels have now been checked as recorded below.


Bounded subsequent author additions were reviewed offline: tidal converted-energy, geothermal instantaneous-power/cumulative-work and biomass electrical-equivalent underflow flags use original positive inputs and distinguish exact zero conversion from below-range positive output. Direct tiny-vs-zero pairs pass for each. At zero spectral height the UI now explicitly labels the period and group-speed coefficient as formal; it does not define an energy-weighted period from zero energy. Ordinary numerical formulas are unchanged. The final native and pixel checks below include these changes.


The bounded spectral-surface repair was independently checked at850 digits: at time2.46, period8 and Hm0=MIN the dimensionless sum is −0.59253907530146400437, whose scaled result rounds to−MIN. The final implementation returns−MIN and exact height0 returns canonical0. Re-exporting the final surface and rerunning all204 extra comparisons, including42,000-point finite-period mean/variance checks, passes (`/tmp/wave5-energy-peer-extra-final.log`). The biomass plot's tonnes conversion is consistent with its actual dryMass/1000 curve and selected dot, while the readout retains kilograms; default262,980kg corresponds262.98tonnes. Captions/syllabus explicitly identify the differing units. No broader numerical or source claim changed.


## Final independent native and visual acceptance

The temporary peer runner copies the final authored utility with absolute import paths and separate output directories; it preserves the production assertions. Fresh independent results on the exact v1 files:

- **48 configurations** (12 items × 1200/320 widths × light/dark): **1,008 physical actions, 600 URL checks, 256 actual Create state link actions and restorations**. The actual Share counter is 256; those panel actions are included in the physical total, not additional actions. Log: `/tmp/wave5-energy-peer-native.log`.
- **24 narrow item/theme groups, 106 critical raw states**: **212 physical actions, 212 URL checks, 106 actual Shares**. Log: `/tmp/wave5-energy-peer-critical.log`.
- **Five actual internal-link clicks**, with loaded target content checked: momentum, gravity-wave dispersion, integrating-factor input, Paper5.12 and its introduced5.2 relationship. These are link checks, not Shares. Log: `/tmp/wave5-energy-peer-links.log`.
- Independently rerun **18 focused tests** and scoped static **12 items / 0 errors / 0 warnings**. Logs: `/tmp/wave5-energy-peer-focused-v1.log` and `/tmp/wave5-energy-peer-static-v1.log`.

The native gates exercise physical controls, every mode, endpoints, continuous off-grid restoration and malformed states, exact edited/replayed model readings, full glyph/halo and marker/ring extents, paths/strokes, complete formulas and readout dimensions. Minimum observed marker/ring clearance is **9.870689655 CSS px**; minimum glyph/halo clearance is **3.115623474 CSS px**. Full strokes pass separately; the marker minimum is not an aggregate minimum over all ink. No independent native failure occurred.

Personally inspected all **24 narrow defaults**, all **24 wide default layout sheets**, and all four narrow regular/spectral mode captures from the fresh peer output. The image-use manifest with original paths and hashes is `/tmp/wave5-energy-peer-gallery-v1/manifest.json`. Read the complete actual narrow rich pages 2, 9, 10, 11 and 12, including statement, scope, controls, readout, proof, source card and dependency/introduced links. Paper12 visibly retains NUMBER UNVERIFIED and the explicit unread-original limitation. Selected full-size raw images cover rescued tiny tip power, net-head underflow, converted-energy underflow, tiny regular-wave flux, zero-height spectral formal-period wording, MIN spectral height, tiny-time geothermal work, tiny engine fraction, tiny biomass chemical output and the large-wake Paper geometry. The readouts remain complete and the keys match the drawn quantities.

The final original-input numerical reference rerun passes all **1,836 independent comparisons** (1,632 reference + 204 additional), with the separate tolerances and finite-evidence limitations described above. Final logs: `/tmp/wave5-energy-peer-reference-final-v1.log` and `/tmp/wave5-energy-peer-extra-final.log`.

The exact accepted manifest is copied to `/tmp/wave5-energy-peer-accepted-freeze-v1.sha256`; all eight files are unchanged. Existing body-access stops, Paper5.12 verify flag, chosen-model boundaries, non-5 metadata and all original bibliography/introduced fields remain intact. This acceptance concerns the authored educational models and their stated hypotheses; it does not establish an unread historical reconstruction or empirical site forecast. All reviewer browsers/servers are explicitly closed and the lane is released.
