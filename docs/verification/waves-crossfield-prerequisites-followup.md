# WAVES derivational prerequisite candidate — 20 October 2026

Producer candidate for independent immutable-commit review; no source flags, global inventories, acceptance ledgers or shared runtime are changed. Thirteen added written cross-field edges across twelve items make actual mathematical steps explicit. The corresponding owned syllabus rows exactly match the full current dependency arrays.

| Consumer | Added target | Actual consumed step |
|---|---|---|
| waves-1.1 | pma-5.15 | Taylor remainder bounds the centered-difference consistency error by Ba²/12 for bounded fourth derivative. |
| waves-1.6 | pde-2.5 | Energy uniqueness identifies the linear sum with the solution for combined initial data in the target's boundary/decay setting. |
| waves-1.9 | pma-9.36 | Positive impedance sum is the determinant of the two interface equations and ensures a unique reflection/transmission pair. |
| waves-2.4 | pma-8.16 | Parseval converts velocity/slope norm integrals into diagonal modal energy sums. |
| waves-3.4 | pma-5.10 | The finite two-wave chord speed equals a derivative at an intermediate wavenumber; continuity gives its narrow-band limit. |
| waves-3.5 | pma-5.15 | A Taylor remainder bound controls the dropped quadratic-and-higher phase over a retained band. |
| waves-3.6 | pma-8.21 | Gaussian integral normalization and its parameter derivative identify the normalized rms width. |
| waves-3.6 | rca-9.13 | Plancherel makes unit-modulus spectral propagation preserve the continuum norm; periodic FFT has its discrete counterpart. |
| waves-3.10 | ladr-7.31 | The real-k mass-weighted Bloch matrix is Hermitian, with an orthonormal complex mode basis and the stated real characteristic roots. |
| waves-4.5 | pma-5.8 | Differentiating the least-length reflection path at an interior minimum gives equal angles. |
| waves-4.6 | pma-5.8 | Differentiating the weighted refractive optical path at its interior minimum gives Snell's law. |
| waves-4.12 | pma-5.8 | Interior stationarity locates the rainbow ray; the derivative sign change verifies a minimum with its index-domain condition. |
| waves-4.15 | pma-6.21 | Endpoint logarithms integrate the constant-coefficient attenuation differential and yield absorbance. |

I read the actual complete authored statement and proof idea of each target, and the full consumer statements/proofs. These are mathematical prerequisite claims, not new historical source closures. The energy uniqueness application retains its boundary/regularity/decay setting; real-k Hermitian mode analysis is separated from complex-k evanescence; Gaussian normalization is separated from the finite periodic FFT's window limits. For 3.5 the explicit Taylor bound is for its retained band, rather than a uniform assertion about arbitrary spectra or long elapsed times.

Read-only inventory in this candidate: **25 written-to-written / 33 written-to-known / 40 whole-syllabus**, from **12 / 20 / 27**. Those are candidate counts pending independent peer/coordinator acceptance.

## Bounded qualifications and layout

All visualization functions, models, controls, captions, scopes and source flags are unchanged. The only fields changed are owned idea/deps, matching syllabus deps, and three explicitly guarded statement qualifications/layouts:

- **1.1:** the nonnegative small-k frequency expansion uses c|k| and |ka|≪1, agreeing with the exact absolute-sine frequency also for negative k. The centered-difference operator is named explicitly and the wave-speed/dispersion equations wrap into readable lines.
- **2.4:** finite-energy small oscillations are explicit. The unchanged energy decomposition/formula is split across displays/lines.
- **4.12:** the rainbow's interior stationary minimum requires 1<n<k+1; outside that range the critical cosine formula need not be physically real. The positive-to-negative ambiguity is resolved by checking the actual derivative changes from negative to positive.
- **3.5 proof only:** the inherited unbroken integral overflowed at320. It is now exactly factored into carrier times J using offset κ=k−k₀ and remainder phase R(κ); this is equivalent notation for the same expansion. The band condition is on its own display. The explicit guard stores the original idea and the precise equivalent-prefix transformation.

Initial narrow runs exposed inherited overlong1.1/2.4displays and3.5inline math. Final fresh checks and personally inspected pixels follow the bounded wrapping changes above; no layout failure remains in the changed fields.

## Independent producer validation

- `node --test tests/verification-waves-prerequisites.test.mjs`: **9/9 pass**. Tests independently calculate quartic/Taylor and signed-sinusoid consistency, all sixteen positive-impedance pairs and flux conservation, integrated finite-mode energy/Parseval at three times, mean-value chord and Taylor phase bounds, Gaussian normalization/second moments and spectral phase norm, mass-weighted Hermitian characteristic roots, Fermat reflection/refraction minima, rainbow minima and an outside-domain counterexample, and Beer endpoint logarithms. No default test asserts flags, review status or whole collection snapshots.
- `node tests/verification-waves-prerequisites-guard.mjs`: **explicit-only snapshot audit passes**, all **54 full item objects/functions/flags**, with only owned proof/deps and the three approved statement text hashes excepted; full syllabus hash permits only the owned dependency-row reconciliation. It is intentionally excluded from `tests/*.test.mjs` so later legitimate source acceptance or authoring will not be frozen by a producer snapshot.
- Strict build: **6684 written / 6890 planned / 450 chapters / 85 collections**, **0 errors / 0 warnings**, home **112726 gzip bytes** in this isolated candidate.
- Static WAVES: **54 items / 0 errors / 0 warnings**.
- `node tests/verification-waves-prerequisites.mjs`: **24/24 fresh320light/dark changed-proof runs**, with the three changed statements additionally checked in each theme. Actual text/inline/display math bounds, runtime/TeX and nonblank output checks pass. I personally inspected all **24 changed proof screenshots and all6changed statement screenshots** in the two themes. The numeric visualization code is unchanged; these checks do not claim a new full native-control/replay or source audit of inherited models.
- `git diff --check`: clean. No current bridge step references any changed WAVES ID; no bridge narrative is changed. No existing default test was found asserting an exact dependency list for these IDs.

Evidence root `/tmp/atlas-waves-prereqs/`: `build.log`, `static.log`, `math.log`, `guard.log`, `native.log`, `inventory.log`, original `baseline-files.json` and isolated baseline modules, plus `native/waves-<num>-<theme>-{idea,statement,full}.png` where relevant. The earlier `native-diagnostic.log`/overflow PNG record the layout investigation, not final acceptance. No generated data, dependency symlink, source binary or screenshot is committed.

Independent peer: archive the exact delivered commit, read each actual target and consumer, run the nine math groups and the explicit snapshot audit, then run fresh narrow checks with `WAVES_PREREQUISITE_OUTPUT=<your unique directory> node tests/verification-waves-prerequisites.mjs` and personally inspect your own output pixels. Prerequisite acceptance is separate from source-queue closure and the coordinator's integrated full checkpoint.
