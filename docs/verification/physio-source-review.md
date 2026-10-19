# Physiology: source follow-up, 18 October 2026

This follow-up closes physio-3.6, physio-4.15, physio-4.19 and, in the bounded final acquisition pass, physio-3.11. Source flags on physio-4.6 and physio-4.7 remain after numerical corrections. The final ledger records all nineteen initial flags as reviewed; fifteen retain the precise source gaps below.

## Evidence read

[Lang et al. (2015), ASE/EACVI chamber-quantification recommendations, complete official 53-page PDF](https://www.asecho.org/wp-content/uploads/2025/04/2015_ChamberQuantificationREV.pdf), doi:10.1016/j.echo.2014.10.003. Read complete relevant §§1.2–1.3 and 2.1–2.4, including reference-population exclusions, biplane disk measurement, EF definition, normal-reference discussion and recommendations. Visually inspected original Tables 2 and 4 on pp. 7 and 10. The sex-specific biplane 2D ranges are 52–72% for men and 54–74% for women; the text also gives a pooled 53–73% range. These are method-specific reference intervals, not a universal diagnostic threshold. The remaining unrelated chamber-specific sections were not read.

Read the complete original Starling (1896) offprint, pp. 312–326, through [Wellcome](https://wellcomecollection.org/works/rf97rsqu/items), using the library’s complete OCR plus visual checks of tables pp. 316/319, the two diagrams pp. 319/321 and conclusions pp. 325–326. The original circulated defibrinated blood through limbs after saline or serum was injected into connective tissue; it did not perfuse the limbs with the saline/serum alternatives as the item previously said. Osmometer measurements were around 30–40 mmHg. This complete reading does not close physio-4.20’s separate modern parameter claims. Europe PMC's PDF endpoint returned HTTP 500 on two attempts. The Landis–Pappenheimer polynomial and the claimed muscle filtration coefficient still require their own evidence even if Starling's paper is read.

[Harvey, On the motion of the heart and blood, full original work in Willis’s translation](https://www.gutenberg.org/cache/epub/67065/pg67065-images.html): read complete Chapters IX and XIII–XIV, pp. 58–63 and 78–85 in the 1906 Dent reprint of the 1847 translation; visually inspected the four-step vein plates, especially Figs. 3–4. The modern source is a transcription of this translation, not a claim that the 1628 Latin was independently collated. Chapter IX explicitly gives 1,000 drachms = ten pounds five ounces, and Chapter XIII says the heart-side segment remains filled when the backward stroke fails at a valve. Parkyn’s later introduction, pp. xvi–xvii, supplies the 1661 Malpighi attribution; it is distinguished from Harvey’s own account.

## Corrections and scope

| Item | Outcome |
| --- | --- |
| physio-3.6 | Closed. Replaced the secondary-source qualification with the original guideline citation and its exact measurement/population context. The four heart presets remain illustrative parameter sets, rather than patients or reference-population measurements. |
| physio-4.6 | Retained. The saturating model has maximum volume Vu+C0·p∞. Its former binary inverse silently returned the 4,000-mmHg search boundary when requested volume exceeded that capacity. Replaced it with the analytic logarithmic inverse and explicit “no finite pressure/capacity exceeded” output. Finite pressures expand the chart. The caption also discloses reversal of model compliance ordering at high pressures unphysiological for systemic veins. Full primary evidence for the broad venous-volume/compliance claims remains open; the invented curve parameters are not measurements. |
| physio-4.7 | Retained. Fourteen beats from an arbitrary starting pressure did not establish periodic equilibrium at the high-RC controls. Solved the affine one-beat map for the exact periodic starting pressure; the RK4 trajectory now starts in periodic equilibrium. Mean pressure uses trapezoidal endpoint weights. Independent mean-pressure and diastolic-decay checks include a one-beat integration where RC exceeds the run duration. Graph ranges expand to show high mean pressures and peak inflows. The exponential comparison uses the actual sampled end-systolic time and compares with end-of-beat pressure, not the minimum reached shortly after the next beat starts. Historical Frank/Windkessel attribution and the cited empirical time-constant range remain open. |
| physio-4.8 | Mathematical correction to the adjacent unflagged item. Mean inlet pressure is Pv+(R+Zc)·mean(Q), not Pv+R·mean(Q); changing compliance at fixed R,Zc leaves it unchanged. Corrected the readout and expanded pressure/pulse-pressure plots over all controls. No new historical source closure is claimed. |
| physio-4.19 | Closed using the original work in a named scholarly translation. Checked conservative arithmetic and the complete vein argument; modern comparisons are labeled rounded illustrative references, not measured patient data. Corrected the backward-stroke diagram: the hand-side segment stays empty while the heart-side segment remains filled. The original drawing was inconsistent with that argument. Step 4 is explicitly controlled refilling progress after the lower finger is released. The output graph now includes the largest 104-pound control result instead of clipping at 14 pounds. |
| physio-4.20 | Retained. Corrected the experimental protocol against the full original and explicitly distinguishes the modern perfusate-protein model from Starling’s experiment. Added its actual interstitial-pressure/oncotic assumptions and corrected the 7-g/dL zero-flux threshold to about 22.6 mmHg. The weight-change plot now covers the complete duration/protein range and does not clamp the marker at ±100 g. The Landis–Pappenheimer polynomial and filtration-coefficient source gaps remain explicit. |

## Validation

- `node --test tests/verification-physio-source.test.mjs`: eight groups, checking an independent derivative/inverse of the capacity model, cardiac volume identities, exact periodicity/mean/diastolic decay across 27 parameter combinations, characteristic impedance’s contribution to mean pressure, original Harvey arithmetic, and the vein-filling sequence.
- `node tests/verification-physio-pharm-browser.mjs`: serial real Chromium, both themes, pinned KaTeX installed with `installBrowserAssets`, actual preset buttons and extreme sliders. Physiology items 3.6, 3.8, 3.9, 4.6, 4.7, 4.8, 4.15, 4.19 and 4.20; pharmacology items are documented separately.

Evidence paths: `/tmp/physio-primary`, `/tmp/physio-pharm-verification-browser.json`, `/tmp/physio-pharm-verification-shots/`.

## Initial-flag coverage ledger

This records the actual review state; a source-location attempt alone is not a completed item review.

| Initial item | Status |
| --- | --- |
| physio-2.7 | Reviewed; retained. Complete Helmholtz1850 recording and conditioned mammalian twitch/fusion evidence remain unread. The entire calcium/force model was reviewed, boundedness and slow/fast fusion tested; removed unsupported universal fusion-frequency/body-temperature claims. |
| physio-3.1 | Reviewed; retained. Complete original Wiggers diagram/history and full authoritative pressure/valve-phase account remain unread. Reviewed all model equations/events, tested event ordering and beat flow/volume balance over heart-rate endpoints; values are explicitly illustrative. |
| physio-3.11 | Closed in the final bounded follow-up. Complete original pp.357–379 read through the public1914 library scan, with both original figures, key tables and conclusions visually checked. Corrected the protocol, fixed-inflow/fixed-pressure distinction and hormonal-control scope. See geology-bounded-source-followup.md. |
| physio-3.6 | Closed; evidence and validation above. |
| physio-3.8 | Reviewed; fixed membrane/thick-wall distinction, volume identity and plot extent. Original attribution and direct ventricular-stress evidence remain open. |
| physio-3.9 | Reviewed; complete relevant Nobel Lecture read, lead identity tested and schematic geometry corrected. Original triangle/dating and clinical-axis-range sources remain open. |
| physio-4.10 | Reviewed; complete continuity computation and unit conversion checked; extreme-axis clipping and red-cell/mean-fluid transit distinction corrected. Exact total-area source remains open. |
| physio-4.13 | Reviewed; retained. Complete primary evidence for whole-body Kf7, Pi−3, Pc17.3, oncotic28, 25-fold lymph ceiling and safety-factor history remains unread. Reviewed full equations; corrected missing sigma and false global-runaway claim: this unbounded Pi law always has an eventual finite equilibrium. |
| physio-4.14 | Reviewed; retained. Complete Reynolds1883 original, conditioned vessel diameter/velocity values and primary murmur-acoustics evidence remain unread. Reviewed units and cartoon controls; corrected equal-Re-alone dynamic similarity and diagnostic/synthetic-sound claims. |
| physio-4.15 | Closed; complete original read, key equations visually checked, governing-PDE test and both-theme controls passed. |
| physio-4.16 | Reviewed; retained. Complete Bayliss1902 original remains inaccessible; organ-specific 60–160mmHg plateau data and historical priority are unread. Reviewed the entire pressure-target feedback model; tested exact gain, fixed passive-curve clipping and used exact first-order transient rather than a shifted Euler sample. |
| physio-4.17 | Reviewed; retained. Complete Guyton1955 source for original graphical argument, normal Pmsf7/RVR1.4/plateau13 values and volume/compliance calibration remains unread. Reviewed equations and equilibrium; corrected negative forward flow at severe blood-volume loss, collapse-limit readout and extreme plot extents. |
| physio-4.18 | Reviewed; retained. Complete Hatle1980 Doppler paper and lesion-specific clinical applicability evidence remain unread. Reviewed SI pressure conversion, proximal term, continuity and assumed recovery; corrected total-drop quadrupling and exact-versus-rounded coefficient wording. |
| physio-4.19 | Closed; evidence and validation above. |
| physio-4.20 | Reviewed; full Starling1896 original read and experiment corrected. Landis–Pappenheimer polynomial/Kf evidence remains open. |
| physio-4.2 | Reviewed; force balance, numerical flux, units and extreme-control applicability checked. Original Poiseuille/Hagen sources and conditioned blood/plasma viscosity values remain open. |
| physio-4.6 | Reviewed; capacity inverse/math/controls corrected. Original physiological volume/compliance evidence remains open. |
| physio-4.7 | Reviewed; periodic initialization, mean and decay checked in math/browser. Complete relevant original Windkessel source remains open. |
| physio-4.9 | Reviewed; thin-wall speed/round-trip delay and full control geometry checked; clipping/hidden site clamp fixed. Original Moens–Korteweg source and measured human PWV ranges remain open. |

## Womersley follow-up

Read the complete original [Womersley (1955), pp. 553–563](https://archive.org/details/sim_journal-of-physiology_the-journal-of-physiology_1955_127/page/n576/mode/1up), doi:10.1113/jphysiol.1955.sp005276, using the full journal-volume OCR. Visually checked original pp. 554–555 (Eqs. 4–17), p. 559 (Table 2/Fig. 1), and pp. 562–563 (human-femoral calculation and both approximation limitations). The text and images are under `/tmp/physio-primary/womersley*`; Europe PMC's PDF endpoint had failed, but the complete Internet Archive scan succeeds.

Closed physio-4.15. Corrected the characteristic force ratio to α² and the Stokes e-folding thickness to √2 R/α; labeled its small-α output as not a thin layer. Corrected the claim of monotonically increasing centre-line phase lag: it can slightly exceed 90° before converging. The paper’s integrated-flow lag differs from this centre-line observable. Replaced unsupported human reference ranges with explicitly computed illustrative presets, and separately gives the actual original p. 562 human-femoral example α=3.52.

The seventh independent physiology test checks the momentum PDE using finite differences at 36 radius/phase/frequency combinations, the wall boundary, low-frequency Poiseuille and high-frequency plug limits, and the centre-line overshoot. Real controls passed in both themes with pinned KaTeX, including α≈6, the arteriole thin-layer limitation and the aorta preset.

## Ventricular wall and ECG follow-up

Reviewed physio-3.8's geometry and thin-shell force balance. Corrected “thick membrane” to “thin membrane,” added the actual h/r with a warning when the thin-wall assumption fails, and expanded the stress axis to show high-pressure/thin-wall control results. Fixed wall volume is checked independently from the generated radii; the anatomical thick-wall stress model and original historical attribution still need primary evidence.

Read the complete relevant electrocardiography portion of [Einthoven’s Nobel Lecture (11 December 1925), pp. 99–111](https://www.nobelprize.org/uploads/2018/06/einthoven-lecture.pdf), with a visual check of p. 102 and its exact three-lead identity. Original instrument discussion pp. 94–98 was also read. This supports the lead definitions and the resultant-of-segment-potentials account, but does not establish the claimed 1901–03/1912 dates or modern normal-axis limits. Those gaps keep physio-3.9 flagged. The single-dipole statement is explicitly approximate. The drawn triangle now uses exact equilateral side geometry; the implementation’s previous 105° cutoff contradicted its stated 90° convention, so the readout now follows the stated 90° convention. A complete modern guideline is still needed to validate that clinical range; AHA/JACC full texts returned 403. Independent projections verify I+III=II across 575 time/rotation combinations.

The final physiology/pharmacology browser evidence combines 22 baseline theme checks and four checks for 3.8/3.9, all 26 passed. Their real controls cover wall-volume/contractility extremes and both axis-deviation directions. Static physiology check: 55 items, zero errors/warnings.

## Vessel-flow follow-up

Reviewed the complete implementations of physio-4.2, 4.9 and 4.10. Their source flags remain: original Poiseuille/Hagen and Moens–Korteweg sources, conditioned blood/plasma viscosities, measured human PWV ranges and the seven total cross-sectional area values still need full source evidence.

4.2 now displays Reynolds number and length/diameter, because extreme controls produce a short tube and very high speeds far outside the assumed long laminar regime. Independent integration and force balance check flux/shear and all unit conversions; the formula is not misrepresented as a physiological prediction at invalid settings.

4.9 sum curves could reach twice the forward pressure but were clipped by 1.2/1.5-high axes; both plots now include that maximum. The draggable site is constrained to the actual tube and moves visibly when its reflector is shortened, replacing a hidden clamp. Corrected delay wording and distinguished calculated preset speed limits (3.1–10.9m/s) from measured human ranges. Independent speed-scaling and round-trip-distance checks added.

4.10 now shows the maximum cardiac-output/recruitment results and annotation ranges; the former velocity axis clipped the 166.7cm/s aortic value. Transit is labeled fluid transit at mean speed, rather than equated exactly with red-cell transit.

Additional vessel-flow browser evidence: six real-control theme groups passed for 4.2, 4.9 and 4.10, including formula applicability at extreme settings, dragging and shortening the reflection site, peak-range checks and maximum cardiac-output/recruitment annotation ranges. Combined physiology/pharmacology evidence now contains 32 passed theme checks. Physiology math suite: nine groups passed.

## Final retained-item follow-up

**physio-2.7:** Complete Helmholtz1850 recording and conditioned mammalian twitch/fusion evidence remain unread. The entire calcium/force model was reviewed, boundedness and slow/fast fusion tested; removed unsupported universal fusion-frequency/body-temperature claims.

**physio-3.1:** Complete original Wiggers diagram/history and full authoritative pressure/valve-phase account remain unread. Reviewed all model equations/events, tested event ordering and beat flow/volume balance over heart-rate endpoints; values are explicitly illustrative.

**physio-3.11:** Subsequently closed through the new public library route; the complete original and both figures have now been read. The earlier EuropePMC access failure did not prevent this independent ordinary-public-source reading. Protocol and interpretation corrections are recorded in [the bounded follow-up](geology-bounded-source-followup.md).

**physio-4.13:** Complete primary evidence for whole-body Kf7, Pi−3, Pc17.3, oncotic28, 25-fold lymph ceiling and safety-factor history remains unread. Reviewed full equations; corrected missing sigma and false global-runaway claim: this unbounded Pi law always has an eventual finite equilibrium.

**physio-4.14:** Complete Reynolds1883 original, conditioned vessel diameter/velocity values and primary murmur-acoustics evidence remain unread. Reviewed units and cartoon controls; corrected equal-Re-alone dynamic similarity and diagnostic/synthetic-sound claims.

**physio-4.16:** Complete Bayliss1902 original remains inaccessible; organ-specific 60–160mmHg plateau data and historical priority are unread. Reviewed the entire pressure-target feedback model; tested exact gain, fixed passive-curve clipping and used exact first-order transient rather than a shifted Euler sample.

**physio-4.17:** Complete Guyton1955 source for original graphical argument, normal Pmsf7/RVR1.4/plateau13 values and volume/compliance calibration remains unread. Reviewed equations and equilibrium; corrected negative forward flow at severe blood-volume loss, collapse-limit readout and extreme plot extents.

**physio-4.18:** Complete Hatle1980 Doppler paper and lesion-specific clinical applicability evidence remain unread. Reviewed SI pressure conversion, proximal term, continuity and assumed recovery; corrected total-drop quadrupling and exact-versus-rounded coefficient wording.

Fourteen independent math groups now pass. All nineteen initial physiology flags have an actual content/model review; fifteen retain source gaps and four are closed after the final bounded follow-up. The retained status does not certify unread sources.

Final control validation: all 58 unique physiology/pharmacology item/theme groups passed in serial Chromium with installed pinned KaTeX, actual native controls, runtime/TeX checks and screenshot capture. This includes all newly reviewed eight physiology and five pharmacology items. A text-only Patterson–Starling readout correctly does not contain a KaTeX node; the harness still installs the actual renderer. Selected final screenshots were visually inspected, including severe volume loss/high volume, normal oedema balance, repeat-bolus redistribution and PBPK tail. Static combined physiology/pharmacology/mathbio check: 167 items, zero errors/warnings.

## Cross-field peer follow-up

The separately authorized known mathematical/scope corrections are documented in [peer-corrections.md](peer-corrections.md), with independent math and both-theme native evidence. This follow-up does not close any source flag.

## Complete Patterson–Starling original: bounded final acquisition

The complete paper, pp.357–379, is now read from the ordinary public [1914 volume48 library scan](https://archive.org/details/sim_journal-of-physiology_the-journal-of-physiology_1914_48/page/n364/mode/2up). Both original figures, pp.363/367, Tables I/III/IV on pp.366/373/376, and conclusions pp.378–379 were visually inspected. Full claim-by-claim evidence, file hashes, new public routes and the two unsuccessful companion source searches appear in [geology-bounded-source-followup.md](geology-bounded-source-followup.md). The chapter still uses a modern model and does not digitize the original dog data. No numerical or interaction code changed.
