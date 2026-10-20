# THERMO derivational prerequisite candidate — 20 October 2026

Producer checkout: isolated `atlas-thermo-prereqs`, starting at `4b959d65d5f2ab5877a410b7414c46a7805e54f4`. This is a candidate for an independent immutable-commit peer. No source review flags are closed and no global accepted inventory is changed.

Eleven new directed edges across ten written items make explicit mathematical facts actually consumed by the derivation. Every edge is present in its matching syllabus row. Each proof paragraph explains the target's specific operation and its hypotheses; no related-link or same-physics-field edge is counted.

| Written item | Added prerequisite | Actual use |
|---|---|---|
| thermo-1.16 | pma-6.21 | Evaluate positive-temperature/volume logarithmic integrals in the adiabatic invariant and isothermal work. |
| thermo-2.11 | pma-6.21 | Evaluate the two reversible entropy integrals as endpoint logarithms for constant heat capacity. |
| thermo-3.5 | pma-9.15 | Differentiate the fundamental relation along the scaling map to prove Euler's homogeneous identity. |
| thermo-3.11 | pma-6.21 | Evaluate the constant-heat-capacity block's Carnot-weighted work integral, retaining the environmental logarithm. |
| thermo-4.10 | pma-5.8 | Require zero derivative at the positive interior nucleation barrier, then check its sign change and substitute. |
| thermo-6.3 | prob-1.6.9a | Identify the centered variance in the second logarithmic derivative of the partition function. |
| thermo-6.4 | prob-2.2.1 | Add finite-second-moment independent energy variances, obtaining relative width for a nonzero one-part mean. |
| thermo-6.8 | prob-2.1.11 | Read canonical joint-probability factorization as a product law, hence independence. |
| thermo-6.15 | pma-8.21 | Normalize all three velocity-component Gaussians, giving the speed density's prefactor. |
| thermo-6.16 | pma-8.21 | Evaluate the three momentum Gaussian integrals in the one-atom partition function. |
| thermo-6.16 | pma-8.22 | Derive the leading extensive entropy while distinguishing its logarithmic finite-size correction. |

The producer read the complete actual authored target statements and proof ideas in PMA, PROB and the current THERMO items. These are explicit local mathematical derivations; this batch makes no new historical-source acceptance claim. The four mathematical test groups separately exercise midpoint integrals against analytic endpoint values, homogeneous entropy derivatives, the positive nucleation maximum, direct enumerated canonical moments and independent variance sums, scaled Gaussian normalization, and the finite-size Stirling correction.

The read-only `crossFieldInventory(await loadAll())` result in this candidate is **25 written-to-written / 27 written-to-known / 38 whole-syllabus**, from **14 / 16 / 27** before these eleven edges. Those are candidate counts only until peer/coordinator acceptance. Existing bridge files reference none of these ten IDs; no bridge narrative is changed.

## Preservation and validation

- `tests/verification-thermo-prerequisites.test.mjs`: **4/4 pass**. The first test fingerprints every one of the **112 full item objects**, including visualization function source, flags, statement, caption, scope and all other properties, excluding only the ten authorized `idea`/`deps` fields. Each old idea remains an exact prefix; all original deps are retained in order. The full syllabus is fingerprinted after only the ten row-dependency additions.
- `node scripts/build.mjs --strict`: **6684 written / 6890 planned / 450 chapters / 85 collections**, **0 errors / 0 warnings**, home **112692 bytes gzip** in this isolated candidate.
- `node scripts/check.mjs thermo --static`: **112 items**, **0 errors / 0 warnings**.
- `tests/verification-thermo-prerequisites.mjs`: **20/20 fresh checks**, every changed proof at **320px light and dark**. Actual math rectangles and proof overflow checked, with no runtime/TeX/blank-canvas errors. Fresh full-page and proof-only PNGs exist. The producer personally inspected all twenty changed proof screenshots in both themes; the final raw-string apostrophe cleanup in 6.16 was rerendered and both fresh final images inspected. Formula and text wrapping is legible.
- `git diff --check`: clean. All viz functions, model calculations, controls, flags, statements and shared files are unchanged. This prose-only batch does not claim a new native-control/replay audit of inherited visualizations.

Evidence lives in `/tmp/atlas-thermo-prereqs/`: `build.log`, `static.log`, `math.log`, `native.log`, `inventory.log`, and `native/thermo-<number>-<theme>-{idea,full}.png`. `baseline-files.json` retains the complete producer pre-edit source, and `baseline/` contains isolated modules used to generate the committed compact object fingerprints. No generated `data/` or dependency symlink is staged.

Independent peer instructions: use a fresh immutable `git archive` of the delivered candidate; personally read the actual target statement/proof and each consumer, recalculate the implications, rerun the four math/guard groups and static/build checks, and run the native script with `THERMO_PREREQUISITE_OUTPUT=<your unique path>`. Inspect your own new proof pixels. Keep prerequisite acceptance separate from source-queue closure and full integrated checkpoint claims.
