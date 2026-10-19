# Solar-energy source and numerical review — 2026-10-18

Scope: `content/energy/ch04*.js`, all twelve items. Read AUTHORING.md and
the physics/engineering guidance in docs/fields.md. Source closures below mean
the relevant full technical passages were read, not merely search snippets,
Crossref metadata or abstracts. Illustrative models are identified as such.

| Item | Result | Evidence and disposition |
| --- | --- | --- |
| energy-4.1 | Closed | [IAU B3](https://arxiv.org/pdf/1510.07674), pp. 2–4, nominal conversion factors; [Kopp & Lean](https://agupubs.onlinelibrary.wiley.com/doi/full/10.1029/2010GL045777), §§2 and 5, especially paragraph 28; [PVEducation atmospheric effects](https://www.pveducation.org/pvcdrom/properties-of-sunlight/atmospheric-effects), absorption/scattering sections. The wavelength-density blackbody calculation actually gives 71.75% below 1 µm and 12.18% below 400 nm, correcting “half” and “a few percent.” The Gaussian atmospheric notches are explicitly schematic, with invented strengths/widths, not Bird-model or measured data. Rounded nominal constants yield 1361.16 W/m², not exactly 1361.0. |
| energy-4.2 | Closed | [pvlib solarposition source](https://pvlib-python.readthedocs.io/en/stable/_modules/pvlib/solarposition.html), complete `declination_cooper69`, `solar_zenith_analytical` and azimuth functions; [atmosphere source](https://pvlib-python.readthedocs.io/en/stable/_modules/pvlib/atmosphere.html), complete `get_relative_airmass`; [Sandia report p. 15](https://digital.library.unt.edu/ark:/67531/metadc831646/m1/15/), Eqs. (22)–(23). The 23.44° amplitude is an intentional rounded obliquity rather than pvlib's 23.45°. Attenuation applies the Meinel shape with the regularized Kasten–Young air mass. This is an approximate clear-sky beam model using geometric solar altitude, with no refraction correction, equation of time or diffuse light. Narrowed the annual-tilt rule and stated the hemisphere/range condition for noon normal incidence. |
| energy-4.3 | Closed | [Sandia PVPMC single-diode model](https://pvpmc.sandia.gov/modeling-guide/2-dc-module-iv/single-diode-equivalent-circuit-models/), governing equations and parameter definitions. Corrected the plotted generating quadrant to the first quadrant under positive output current. At fixed saturation current, increasing ideality factor raises voltage; the previous caption said it fell. The closed-form Voc relation requires zero shunt leakage. J0 control is the 25 °C reference value. All device parameters remain illustrative. |
| energy-4.4 | Closed | [PVEducation fill factor](https://www.pveducation.org/pvcdrom/solar-cell-operation/fill-factor), definition, maximum-power derivative, empirical expression and reference 1. Attribution corrected to Green (1981), *Solid-State Electronics* 24: 788–789; the 1982 article is a later accuracy assessment. Independent numerical optimization checks the empirical approximation in its applicable normalized-voltage range. |
| energy-4.5 | Closed | [Shockley–Queisser full paper](https://banavathvalyaiitmadras.wordpress.com/wp-content/uploads/2015/12/limit-of-efficiency_shockley_queisser.pdf), printed pp. 511–517, §§2–5, including the photon integral, emission geometry, diode characteristic and maximum-power condition. [Markvart (2022)](https://wires.onlinelibrary.wiley.com/doi/10.1002/wene.430), complete §6, Eqs. (12)–(13), supplies the generalized Planck extension used at intense illumination. Removed the unverified exact terrestrial-spectrum tabulation; this visualization calculates a blackbody spectrum. Loss region includes both carrier voltage and current/load losses. |
| energy-4.6 | **Source comparison open** | Physical spectrum-splitting, equal series current and power conservation have independent checks. Corrected dark spectral areas to allocate delivered power, including radiative current loss and mismatch; removed the unsupported infinite-stack percentage and fixed the coincident-gap NaN. Exact historical model attribution remains flagged: Henry, DOI [10.1063/1.328272](https://doi.org/10.1063/1.328272), pp. 4494–4500, and De Vos, DOI [10.1088/0022-3727/13/5/018](https://doi.org/10.1088/0022-3727/13/5/018), pp. 839–846. Henry's first page/abstract and bibliographic records were available; complete relevant derivations were not obtained. The current display states these are independently recomputed model optima, not a reproduction of either paper. |
| energy-4.7 | Closed | [TI C2000 Solar Library (2014)](https://e2e.ti.com/cfs-file/__key/communityserver-discussions-components-files/171/SolarLib.pdf), complete MPPT_PNO technical description/flowchart, printed pp. 12–13. The fixed-step controller follows this update, with an explicitly stated tie rule. The cloud sequence is invented. The displayed current power curve now uses the same sampled irradiance as the operating point. Tracking efficiencies are labeled sampled ratios. |
| energy-4.8 | Closed | [PVEducation temperature effect](https://www.pveducation.org/pvcdrom/solar-cell-operation/effect-of-temperature), complete saturation-current and Voc sections; [Sandia NOCT model](https://pvpmc.sandia.gov/modeling-guide/2-dc-module-iv/cell-temperature/noct-cell-temperature/), complete formula and corrections. Stated n=1, fixed-gap and weak-photocurrent assumptions for the derivative. Removed unsourced commercial coefficient ranges and a misleading “doubly penalized” claim. The 45 °C heating parameter is illustrative, and omitted wind/mounting/efficiency corrections are explicit. Local power coefficient now divides by local power, not the 25 °C reference power. |
| energy-4.9 | Closed | [PVEducation bypass diodes](https://www.pveducation.org/pvcdrom/modules-and-arrays/bypass-diodes), complete operation explanation. The 60-cell, three-substring example is a chosen topology, not a market-wide claim. Corrected “weakest cell sets MPP current” to depend on reverse losses; bypass bounds the substring voltage, not each cell's reverse voltage. Several peaks can occur; one peak per possible combination is not guaranteed. Reverse resistance and diode drop are illustrative, not hotspot-temperature predictions. |
| energy-4.10 | Closed | [MIT 2.997 Lecture 9](https://ocw.mit.edu/courses/2-997-direct-solar-thermal-to-electrical-energy-conversion-technologies-fall-2009/5c5726704689ebb55d2b43730fe810c4_MIT2_997F09_lec09.pdf), PDF pp. 7–9: second-law concentration limit, refractive-index dependence and nonimaging sine condition; IAU constants above. Added the full projected étendue integral and specified lossless geometrical optics. Specified one radiating face, no ambient return flux and no other losses for stagnation temperature. Only the 3D limit reaches the Sun's temperature; the 2D bound is about 1500 K under these thermal assumptions. The drawing is explicitly schematic, not a ray-traced design. |
| energy-4.11 | Closed | [Chapin–Fuller–Pearson full letter transcription](https://es.scribd.com/document/598911344/1-1721711), printed pp. 676–677, entire letter including Fig. 1 discussion and final output paragraph (neighboring letters excluded). DOI [10.1063/1.1721711](https://doi.org/10.1063/1.1721711). The primary letter reports 60 W/m² and approximately 6%; this no longer relies on a secondary history. Replaced unsupported application anecdotes with the letter's practical reflection/recombination/resistance discussion. Removed stale present-day record claims; both plotted devices remain labeled reconstructions. |
| energy-4.12 | Closed | Same complete Shockley–Queisser sections and Markvart §6 as 4.5. Removed stale device-record markers and unsupported current-record/AM1.5G claims. The green area now includes the MPP current reduction, so its area represents delivered electrical output rather than assigning Vmp to every absorbed photon. Full concentration uses the source geometry's 1/fw bound. |

## Numerical implementation and reproducibility

The original exponential radiative-emission approximation could give
Voc greater than Eg/q at low gap and full concentration. The shared junction now
integrates the generalized Planck distribution with photon chemical potential
qV below the absorption threshold (Markvart §6). It evaluates the energy integral
using convergent Bose/polylog series and uses bracketed current/voltage inversion
and maximum-power optimization. Ordinary one-sun values are preserved to the
displayed precision. Coincident tandem gap handles produce an empty slice and
zero shared-current output, with finite readouts.

`node tests/verification-energy.test.mjs` checks eight groups: independent
analytic Bose sums; blackbody power and fractions; the generalized emission
expansion boundary; derivative conditions and gap bounds including 46,200 suns;
diode residuals/MPP/temperature derivatives; tandem current/power balance,
independent-terminal comparison and coincident gaps; actual production spectral
callbacks for the paper and tandem; and wavelength-density/Wien/étendue identities.
The independent sums do not call the production quadrature or polylog routines.

`node tests/verification-energy-browser.mjs` runs all twelve items in light and
dark using `installBrowserAssets` and real local KaTeX 0.16.11. It sends real
slider events, mode changes, handle drags and a shading-cell click, checks changed
finite readouts, browser exceptions and TeX errors, and captures the resulting
panels in `/tmp/atlas-energy-shots`. Machine-readable results are written to
`/tmp/atlas-energy-browser.json`. This is an interaction/rendering check, not a
claim of measured-device fidelity.

Observed results: **8/8 numerical groups, 24/24 light/dark interaction groups,
zero browser or TeX errors**, and a clean strict build and chapter static check.
Visual inspection of the tandem and concentrated single-junction panels found
large-current tick labels clipped at full concentration. The latter axis now
switches from mA/cm² to A/cm², and its additional two-theme input rerun passed
(`/tmp/atlas-energy-browser-energy-4.5.json`).

Remaining closure: energy-4.6's exact Henry/De Vos literature comparison. All
other eleven source flags have been cleared after the corrections above.

A later screenshot audit corrected the browser helper's native-log slider mapping
and replaced assumed handle ordinates with actual handle coordinates. The affected
4.3/4.4/4.6/4.11 two-theme rerun passed **8/8**; report
`/tmp/atlas-energy-browser-energy-4.3-energy-4.4-energy-4.6-energy-4.11.json`.
Concentration controls are explicitly linear controls of log10 concentration and
were already mapped correctly. Numerical production tests exercised physical
extremes independently of the browser mapping.

Cross-field prerequisite audit: energy-4.1 directly uses the Planck spectrum and Stefan–Boltzmann total flux, so thermo-9.4 and9.6 are explicit prerequisites. Energy-4.10 calculates its receiver equilibrium by the Stefan–Boltzmann law, adding thermo-9.6. All are mirrored in the syllabus. Corrected an inline second-law reference from thermo-9.11 (fluctuations) to thermo-2.1 (Clausius statement). These are actual displayed equations, not analogy links.
