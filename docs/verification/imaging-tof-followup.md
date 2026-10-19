# Imaging 4.9 — time-of-flight PET source and implementation audit

Status: source, independent mathematics, native browser and agent visual checks complete. Parent independent mathematical/native checks and screenshot inspection passed; source flag and ledger are reconciled.

## Source inspected

Read the complete six-page original: T. F. Budinger, “Time-of-Flight Positron Emission Tomography: Status Relative to Conventional PET,” *Journal of Nuclear Medicine* 24 (1983), 73–78, [publisher PDF](https://jnm.snmjournals.org/content/jnumed/24/1/73.full.pdf). Local source `/tmp/atlas-imaging-budinger1983.pdf`, SHA-256 `cbb66bad92e58c4be0978f7eef9af51aa1aa6bc3579c8cb858aea016ca92ad1c`.

The displacement conversion is Eq. 1, p. 73. The derivation on pp. 74–76 distinguishes the approximate SNR ratio `sqrt(D/Δx)` (Eq. 6) from the relative sensitivity/effective-count ratio `D/Δx = 2D/(cΔt)` (Eq. 7). The nonuniform-source and detector-efficiency qualifications immediately following those equations are reflected in the entry. Inspected the rendered original p. 75, `/tmp/atlas-imaging-budinger-equations.png`, to check the square roots and factors of two directly. The entry makes no current hardware claim from this 1983 source.

## Corrections

- Defined the signed coordinate from detector 1 toward detector 2, so `t1−t2=2x/c` has an unambiguous sign. Used the exact speed of light. Identified `cΔt/2` as localization FWHM, distinct from final image resolution.
- Made uniform-object, comparable-detection/reconstruction assumptions explicit; separated SNR from effective counts. The plotted gain saturates at 1 outside its useful regime and is described as a heuristic, not a measured image SNR.
- Replaced a Gaussian source mixture mislabeled as a uniform 4:1 lesion with an exact mixture: unit background over the body plus three units in a radius-1 cm disc. The readout separately identifies the wider 1.3 cm averaging ROI.
- Normalized each non-TOF and TOF event to unit mass on its known-support chord. Equal midpoint cells cover short tangential chords; the previous fixed starting offset dropped such events. Both images now retain every event.
- Kept the resampled geometry probe independent of the fixed seeded image events. The gain and localization drawing bounds expand across the full controls; the detector-to-detector likelihood curve uses actual LOR endpoints.

## Verification

`node --test tests/verification-imaging-tof.test.mjs` — six independent groups pass: detector flight lengths and FWHM conversion; SNR/count distinction and saturation; sampler density/support moments; image mass for diameter/timing corners; a short near-tangent event; broad-timing convergence to non-TOF weights.

`node tests/verification-imaging-tof.mjs` — both light and dark themes pass all 16 input corners, no runtime/TeX/blank-stage errors, finite readouts, all instrumented paths/points/handles within bounds, large-gain curve visible, probe projection to the body and five independent timing resamples with unchanged image canvases.

`node scripts/check.mjs imaging-4.9 --static` — one item, zero errors and warnings.

Agent-inspected full screenshots: `/tmp/atlas-imaging-tof-light.png` and `/tmp/atlas-imaging-tof-dark.png`. Equations, FWHM label, four stages, controls and readout are legible in both themes at the inspected width. No human review is claimed or required by this report.

## Model limits

This is a fixed-seed, 56×56, unfiltered back-projection illustration with known circular support and about 0.4 cm chord sampling. It excludes attenuation, scatter, random coincidences, positron range, noncollinearity and iterative image reconstruction. Separate image grayscale normalization supports structural comparison rather than absolute intensity comparison. Neither the ROI contrast nor the uniform-object heuristic is a clinical performance estimate.
