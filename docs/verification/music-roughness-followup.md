# Music6.4/6.5: roughness curves, coincidences and local consonance

Candidate adds exactly **music-6.4** and **music-6.5** to `verify:true`; they were previously unflagged. These flags must remain until independent coordinator acceptance. No central ledger is edited here. This batch follows the material counterexample discovered while auditing7.16/7.17. It repairs the claims, their syllabi, and their widgets rather than merely flagging them.

## Actually accessed primary sources

- William A. Sethares, [Some Useful Computer Programs](https://sethares.engr.wisc.edu/comprog.html), entire author page, especially MATLAB `dissmeasure` and the immediately following concatenated-tone curve example. Cached `/tmp/atlas-worker-one/sethares-comprog.html`,10,006bytes,SHA256 `0987b1e88e8c944f7b4ece43da9a8d4d73442fb4c206316f909a487836f46af7`.
- Sethares, [Relating Tuning and Timbre](https://sethares.engr.wisc.edu/consemi.html), actual full explanatory article: introduction/local-consonance discussion, calculation/two-partial Figure4 description, properties discussion and stretched/compressed-timbre section. Cached `/tmp/atlas-worker-one/sethares-consemi.html`,46,498bytes,SHA256 `7083a04960ba18224aa1cfe28eeb51d3675c2cca4be0ba40cd3283a36f51537e`. The author identifies this as an explanatory version of his technical work; this audit does not claim to have checked the1993 JASA paper itself. No proof of the article's global minimum/count/symmetry assertions is inferred for this later model.

The source MATLAB function specifies the minimum-amplitude weight, constants.24/.0207/18.96/−3.51/−5.75 and coefficient5. Its example concatenates both tone lists, so all unordered pairs, including pairs within each tone, contribute. The BASIC program lower on that page instead sums only cross-tone terms. The widget explicitly chooses MATLAB's full-list convention, and does not mix them. The example's manually initialized zero at unison is not used: our unison value is computed by the same full-pair formula as every other point, and can contain intrinsic roughness.

This is also distinct from the original1994 adaptive-tuning paper's product-amplitude formula, audited separately in `music-adaptive-bp-followup.md`. No equivalence of amplitudes or their effects on minima is asserted. The old shared helper had the same minimum-amplitude shape but divided by the single-pair peak; the new isolated helper uses the author's coefficient5 and does not change shared helpers or other items.

## Material correction and independent counterexample

6.4 previously said harmonic minima occur exactly at simple partial ratios, and alternate amplitude rules change only depths.6.5 inferred that all minima are partial coincidences and the whole stretched curve is just a horizontal rescaling. These are too strong. The author describes shallow noncoincidence minima even for two partials. Coincidence locations transform under stretching; the whole frequency-dependent sum must be recomputed.

For two equal-amplitude partials at C4=261.6256Hz and2C4, the only distinct coincidence in(1,2] is2. Independent90-digit Decimal sums in `music-roughness-reference.json` give:

| Ratio | Score | Derivative with respect to ratio |
|---|---:|---:|
|1.4814|.13246134225867252|−.00075056689152616|
|1.4815|.13246131637282552|+.00023282454404346|
|1.4816|.13246138881850949|+.00121606382444868|

The middle score is lower than both neighbors. The finite exponential sum is continuous and smooth throughout this interval, so this numerical evidence demonstrates the interior dip away from all coincidences; the independently differentiated formula brackets the stationary point as well. The90-digit calculation is high-precision numerical evidence, not an interval-arithmetic certificate. The widget separately marks its actual2-cent grid minima, including one-sided endpoints, without claiming those grid positions are exact continuous minima. Its default preset shows a680-cent sampled minimum.

6.5 now states the local-consonance relation as a model-based way to propose scale positions, with no universal best-scale or matched-music guarantee. Every stretched spectrum and curve is recomputed, with one common divisor for the harmonic comparison. Four authored cadence combinations expose both spectra and both scales. The exact scored frequencies/partial amplitudes feed synthesis. AtA=2 all four event lists and mean scores agree exactly; atA=2.1 the independent mean scores are3.2937110682791433(stretched/stretched),4.565996014572376(stretched/ordinary),4.922763553515214(harmonic/stretched),3.848174978140816(harmonic/ordinary). These are model outputs for stated voicings, not listener results.

## Implementation contracts

6.4 has eight native amplitude handles and a continuous selected-interval control. All native handles, preset choice and selected interval replay through the existing state registry. Every positive amplitude, even below the old1e−4 cutoff, is retained. Silence is finite, has a zero score/curve/signal, and no falsely detected minima. Presets are now explicitly synthetic numerical spectra rather than unverified measured-instrument claims. The interactive spectrum model is preserved and expanded with the two-partial counterexample and silence.

6.5 uses six partialsA^(log2j), amplitudes.88^(j−1), actual C4 anchored voicings[0,4,7],[5,9,12],[7,11,14],[0,4,7] and continuousA∈[1.87,2.22]. The readout reports raw dyad and raw mean chord scores; the two curve plots use a common divisor. The labels2:1 andA occupy different vertical bands even whenA=2.

Both use deterministic mono44,100Hz additive samples, ten-ms linear end ramps, normalization by the positive amplitude sum and voice count, a magnitude bound.12 before output, explicit voice gain1 and normalization disabled. The existing master gain.9 and limiter remain. Both have explicit Stop audio, no autoplay and no audio on state restore or interval selection alone. All partials are checked below Nyquist. The isolated helper rejects nonfinite, sparse, out-of-domain and oversized spectra/events rather than truncating them.

## Verification

- `python3 tests/verification-music-roughness-reference.py`: independent90-digit sorted-pair sum and separately derived analytic derivative; three counterexample rows,30dyads and20complete cadence frequency/score fixtures.
- `node --test tests/verification-music-roughness.test.mjs`: five groups covering the fixtures, separately regrouped expm1 sums, all full curve samples/minima for presets/custom/silent/tiny spectra, continuous/off-grid stretches, amplitude-location counterexample, failure of an exact horizontal rescaling identity, A=2 equality, all actual audio presets/intervals/cadences, sample bounds/gaps and malformed domains. `/tmp/atlas-worker-one/roughness-math.log`.
- `node scripts/check.mjs music-6.4 music-6.5 --static`: two items,zero errors/warnings. `/tmp/atlas-worker-one/roughness-static.log`.

Native evidence and clean scratch build are recorded below after final runs. No claim is made about human audibility, complete musical consonance, original-paper proofs, measured instruments or exact placement of every local minimum. Direct repetitions in6.6 and6.15 are assigned to a separate follow-up batch.

Final native command: `node tests/verification-music-roughness.mjs` (or restrict with `dark 320 6.4` / `dark 320 6.5`). Final production passed six groups per item at1450/430/320px in both light/dark; logs `/tmp/atlas-worker-one/roughness-native-dyad.log` and `roughness-native-stretch.log`, both exit0. In total198 real buffers/558events were checked sample by sample against an independently ordered additive sum, including every preset, silence, a real custom-amplitude edit and all four cadence actions at fiveA values. The tests assert rate/channels, all gap samples, peak, gain/master/limiter routing and actual Stop calls. They independently check every plotted curve sample, shared normalization, every minimum marker, all actual coincidences, native range endpoints/off-grid values/keyboard, real mouse drag/click, exact edited-state remount, malformed fallback, no autoplay, complete marker/handle/path/text bounds, TeX and page overflow.

Fresh screenshots actually inspected include `/tmp/atlas-worker-one/music-roughness-6.4-initial-panel1-320-dark.png` (the counterexample curve), `music-roughness-6.4-edited-panel0-320-dark.png` (real custom handles), `music-roughness-6.4-silent-panel1-320-light.png` (finite silence/comparison), `music-roughness-6.5-harmonic-panel0-320-dark.png` (A=2 identity and separate labels) and `music-roughness-6.5-2.22-panel0-320-light.png` (stretched complete curves). Other panel/full-page images follow the same `music-roughness-ITEM-STATE[-panelN]-WIDTH-THEME.png` pattern. Early native runs caught narrow display-math overflow, inadequate full-handle margins and anA-label halo too close to the frame; the final source and passing matrices include all repairs.

A strict build from an isolated git archive with only this batch's owned content overlaid passes6,684items/450chapters/85collections,zero errors/warnings; `/tmp/atlas-worker-one/roughness-build.log`, output confined to `/tmp/atlas-worker-one/roughness-build`. No tracked generated files were modified. `git diff --check` passes. Independent peer review remains the flag-closing gate.
