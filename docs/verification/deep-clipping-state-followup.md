# DEEP 5.12: local logarithmic-thumb synchronization

## Scope and regression

This runtime candidate is separate from the prerequisite candidate `e57c6a5758904c1f08f79c437a2be87a69924471` and the pending label-only 5.12 correction. It changes only seven lines within the existing 5.12 visualization in `content/deep/ch05-c.js`, plus this report and its native regression probe. No shared runtime, other item, syllabus row, inventory, acceptance ledger, or source flag is changed. Independent peer acceptance is pending.

The unmodified item reproduced the inherited defect: saved/model learning rate `0.002` had actual native numeric DOM logarithm `-2.69930362327112`, whereas `Math.log10(0.002)` is `-2.6989700043360187`. The shared logarithmic 400-tick step grid sanitized the range thumb independently of its exact physical model value. The failing before log is `/tmp/atlas-new-imaging-source/deep-clipping-before.log`.

Both local controls now use native `step='any'` and are immediately resynchronized from their exact physical model values. A local input listener, registered after the slider's own input listener, resynchronizes each thumb after the existing two-significant-digit physical input rounding. Physical domains remain learning rate `[0.0005,0.01]` and threshold `[1,400]`. Defaults and valid restored physical values remain exact, including arbitrary continuous in-domain values; no saved-state rounding was added. No mathematical trajectory code or control inventory changed.

## Verification

`node tests/verification-deep-clipping-state.mjs` passes all six combinations of 1450/430/320 px and light/dark. The server uses an OS-assigned unique port. Evidence and screenshots are under `/tmp/atlas-new-imaging-source/deep-clipping/`, with log `/tmp/atlas-new-imaging-source/deep-clipping-native.log`.

Each combination checks:

- Actual `input.valueAsNumber` against the independently calculated logarithm of the exact physical saved/model value, tolerance `6e-14` in log coordinates; this detects the original error without comparing two sanitized controls.
- Both selectors and both controls through real Home/End/ArrowLeft/ArrowRight plus pointer drags to three intermediate positions. Exact physical endpoints and two-significant-digit native input are checked.
- Independent polynomial-sum/differentiation evaluation of the scalar linear RNN, both norm and coordinate clipping, actual parameter paths and displayed step-length data, plus the selected norm/coordinate dashed bound. The oracle imports no production math helper.
- Exact remount/replay of whole state, native DOM data, both full trajectories, dashed bound, selected mode and rendered readout.
- Raw continuous valid restores `[0.0012345678912345, pi]` and near-boundary values, plus the original defaults, without physical snapping.
- Ten malformed whole-state cases per combination (null/string/nonpositive/out-of-domain values in each control) with a second valid edited slider and edited selector. Each produces a restore notice and resets the complete state to defaults, rather than retaining valid fragments.
- No runtime/TeX/blank-stage errors or horizontal page overflow.

The producer personally inspected new output pixels: default wide light, value-clipping narrow light/dark, and step-length panels across all widths/themes. Controls and plots are legible and the exact-default thumb is synchronized. The inherited value-mode legend/readout still labels the already-correct plotted coordinate bound as `eta c`; that distinct pending label-only correction is neither overwritten nor certified by this runtime report. The test computes the actual plotted `eta c sqrt(2)` bound independently. Source acceptance is not claimed.

`node --test tests/verification-deep-sources.test.mjs`: 16 existing mathematical groups pass. These supplement the focused clipping oracle; they do not independently certify this runtime change. `node scripts/check.mjs deep-5.12 --static`: 1 item, 0 errors, 0 warnings. `node scripts/build.mjs --strict`: 6684 written / 6890 planned / 450 chapters / 85 collections, 0 errors, 0 warnings; home gzip 112705 bytes. Full integrated checkpoint remains the coordinator's responsibility.

## Peer instructions

Review an immutable archive containing this runtime candidate and the intended prerequisite/label candidates, inspect the seven-line scope, rerun the probe with a new `DEEP_CLIPPING_OUTPUT` directory, and personally inspect fresh pixels. Preserve independent label-only verification and source/prerequisite acceptance records; do not infer source closure from runtime checks.
