# Psychology 3.2–3.4: effective offsets, historical exponents and reciprocal matching

Status: candidate for independent coordinator review. The existing 3.3/3.4 flags and the newly identified 3.2 flag remain true. Recommended resolution after independent acceptance: all three items. Central records belong to the coordinator.

## Sources and scope of reading

The principal source is S. S. Stevens, *The Psychophysics of Sensory Function*, in W. A. Rosenblith (ed.), *Sensory Communication* (1961), pp.1–33. The actual university-hosted scan is [here](https://hci.stanford.edu/courses/cs448b/papers/Stevens_Psychophysics.pdf). Retained PDF: `/tmp/atlas-worker-two/scaling-sources/stevens-psychophysics.pdf`, SHA256 `53492a0320aa08941100791cca60b18de832034458f00541d2e5ac89ddecbcc2`. It has 17 sideways scanned spreads. Read the actual pp.10–17 and24–25, and inspected upright renders of pp.12–15 and24–25. OCR is retained separately from the PDF pixels and was checked against those pixels for table alignment and formulas.

The actual Table2 on p.13 supports brightness .33 (5° dark-adapted target), heptane smell .6, **binaural loudness .6**, saccharin .8, 60Hz finger vibration .95, static palm force 1.1, gray-paper lightness 1.2, sucrose 1.3, lifted weights 1.45, arm warmth1.6 and 60Hz finger current3.5. The p.12 apparent-length illustration uses about1.1. Temperature is measured above a neutral value, as pp.24–25 show. The previous shared table's loudness .67 and length1.0 were not carried forward under a generic attribution; presets and gallery now identify the specific checked examples.

Two additional numerical illustrations use the **original abstracts**, not an asserted full-paper reading:

- Stevens and Guirao (1963), [Subjective scaling of length and area and the matching of length to loudness and brightness](https://doi.org/10.1037/h0044984), J. Exp. Psychol.66:177–186. The publisher-supplied abstract/preview visible [here](https://www.researchgate.net/publication/9583227_Subjective_scaling_of_length_and_area_and_the_matching_of_length_to_loudness_and_brightness) supports area exponent about.7 for the projected-square example. No experiment-specific sample, procedure or data from the unread full text is presented.
- Stevens and Harris (1962), [The scaling of subjective roughness and smoothness](https://doi.org/10.1037/h0042621), J. Exp. Psychol.64:489–494. The publisher-supplied abstract/preview visible [here](https://www.researchgate.net/publication/9583228_The_scaling_of_subjective_roughness_and_smoothness) reports roughness near−1.5 against emery-cloth **grit number**. The gallery's positive1.5 therefore explicitly uses **inverse grit number**. It is not an exponent against grit number or unspecified physical roughness. The reciprocal-coordinate change is checked algebraically.

The 1961 pp.14–17 supply both the exponent-ratio derivation and the reciprocal loudness/vibration adjustments, including the centering tendency and ten-observer account. The revised item no longer credits an unread 1963 full experiment or calls a reciprocal slope/geometric compromise unbiased. No historical priority or physiological explanation of exponent size is claimed. All continuous controls, reference normalization, seeded samples, noise and drawn ratios are explicitly authored.

## Corrections

3.2 was previously unflagged. For the displayed effective-offset family, logarithmic differentiation gives nI/(I−I₀)>n for I₀>0. Its caption asserted the opposite direction. The previous fixed log bounds also clipped high-offset curves, and its readout incorrectly retained the zero-offset doubling formulas when the offset was on. The revision states the conditional power-law model, derives the local slope, computes the correct 1-to-2 ratio and reference doubling stimulus, and bounds the entire finite plotted curve. Its explicit log cutoff is max(.1,I₀+.02(1−I₀)); no infinite boundary is pretended to be visible.

The native run found another real 3.2 defect: restoring a selected shock preset followed by a custom exponent3.6 changed the saved exponent to3.5. Registering the preset before the independent exponent slider preserves both the selected preset and the exact custom value on replay.

3.3 replaces an opaque canvas-click selection with a registered native selection control. Historical numbers identify the stimulus coordinate and source conditions, and the explanatory text drops unsupported adaptive/danger interpretations. The plots distinguish normalized computations from actual participant data and universal sensory constants.

3.4 replaces untracked random samples with a registered integer seed and deterministic sample advance. Nine exact latent log-sensation levels generate two reciprocal adjustment sets. Independent OLS calculations check the forward, reverse and horizontally noisy fits. The view includes every trial, the complete fit segment, both reference endpoints and the selected exact match. An undefined reciprocal/geometric summary is reported honestly rather than generating an invalid square root. The shared exponent helper changes affect only 3.2–3.4; other chapter objects are unchanged.

## Verification

- `node --test tests/verification-psych-scaling.test.mjs`: **five groups** pass. Independent derivative differences, direct ratio/doubling identities, separately accumulated OLS normal equations over300 preset/noise/seed states, three-way ratio composition, reciprocal-grit sign and malformed finite-domain rejection. `/tmp/atlas-worker-two/scaling-math.log`.
- `node scripts/check.mjs psych-3.2 psych-3.3 psych-3.4 --static`: three items, zero errors/warnings. `/tmp/atlas-worker-two/scaling-static.log`.
- `node tests/verification-psych-scaling.mjs`: **18 matrices** pass, all three items at1450/430/320 in light/dark. `/tmp/atlas-worker-two/scaling-native.log`. Every preset, all25 matching pairs, continuous corners/intermediate inputs, integer seed endpoints, native toggle/button/range events, keyboard controls, handle endpoints, exact saved replay and full path/marker/text/TeX/page bounds are checked.
- Malformed saved values are checked by the same committed runner; `PSYCH_INVALID_ONLY=1` isolates these checks. The separate bounded run is `/tmp/atlas-worker-two/scaling-invalid.log`.
- Screenshots are in `/tmp/atlas-worker-two/scaling/`. Agent inspection includes the320-dark high-offset log plot,320-light shock gallery,1450-light matching full page, and narrow/default light/dark panels. Pixel views were used to verify label readability and complete plotted extents in addition to numerical bounds assertions.

The first native attempt incorrectly clicked the checkbox input under its visible switch track and timed out; the runner now clicks the actual visible label. A subsequent run exposed the real preset-replay defect described above. Both failed attempts remain in separately named logs. Neither is counted as final acceptance.

No shared runtime, generated data, global queue or master-plan file is changed. Other psychology queue entries remain open. Both original flags and the added3.2 flag remain true until independent acceptance.
