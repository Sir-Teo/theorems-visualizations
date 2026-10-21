# Energy 3.3 — carbon capture work and penalty accounting

Status: primary source, independent mathematics, native browser and agent visual checks complete; parent independent mathematical/native checks and screenshot inspection passed; source flag and ledger are reconciled.

Read the complete 12-page original report by Knudsen, Jensen, Vilhelmsen and Biede, “First year operation experience with a 1 t/h CO₂ absorption pilot plant at Esbjerg coal-fired power plant,” ECCE6, Copenhagen, 16–20 September 2007, [institution-hosted original](https://skoge.folk.ntnu.no/prost/proceedings/ecce6_sep07/upload/3356.pdf). Local `/tmp/atlas-energy-capture-pilot.pdf`, SHA-256 `2a8ce0f29bad04846add1c4f7c7f47e846fb88d99052ecbc09de0221fcd9dc08`. Agent-inspected original rendered Tables 2 and 3, PDF pp. 7–8, `/tmp/atlas-energy-capture-pilot-p{7,8}.png`.

Table 2 gives five solvent-flow points with heat duties 3.9, 3.7, 3.7, 3.6 and 3.7 GJ/t near 90% capture. Table 3 instead reports the 550-hour averages 3.7 GJ/t and 88% capture, with an average reboiler temperature of 120.4°C. The entry distinguishes those conditions and removes an unsupported universal MEA range. Its full-plant loss model is explicitly independent of these pilot measurements.

Re-derived reversible separation by integrating the chemical-potential difference `RT ln[(1−n)/(y−n)]` over removed CO₂ `n=0…ry`. This independently yields the stated Gibbs mixing expression. The denominator is captured CO₂, not total feed. Feed/tail/product pressures and purity are specified; compression is additional ideal-gas work. Real high-pressure CO₂ is nonideal.

The former readout called `separation minimum / (steam electricity worth + compression)` a second-law efficiency “counting compression.” It omitted the reversible compression minimum from the numerator. The revised explicit accounting proxy includes **both** separation and ideal compression in the numerator and their electricity-loss estimates in the denominator. The dark bar still represents separation only, consistently identified. Heat and work are not treated as thermodynamically interchangeable. Baseline efficiency, carbon factor, flue concentration, heat duty, steam worth and compressor efficiency are declared independent illustrative inputs.

`node --test tests/verification-energy-capture.test.mjs`: four groups pass—independent numerical incremental extraction, dilution/capture/temperature limits, all 64 parameter corners with energy/carbon/efficiency closure, and corrected compression numerator/denominator accounting.

`node tests/verification-energy-capture.mjs`: light/dark each pass all 64 dilution/capture/heat-duty/steam-worth/plant/compressor corners, finite readouts, expected accounting language and no runtime/TeX/blank-stage or instrumented-data clipping errors.

`node scripts/check.mjs energy-3.1 energy-3.3 --static`: two items, zero errors/warnings.

Agent-inspected `/tmp/atlas-energy-capture-{light,dark}.png`: same-fuel loss bars, separation-only dark segment, reference markers, logarithmic work curve and corrected accounting readout are legible. No human review is claimed or required. The model excludes fan/pump loads, solvent degradation, actual turbine integration, upstream emissions and storage; the calculated loss fraction is not a measured process efficiency.
