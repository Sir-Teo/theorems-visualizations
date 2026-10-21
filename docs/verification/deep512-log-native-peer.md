# DEEP 5.12 local log controls — independent runtime peer

20 October 2026. **Accept the bounded runtime candidate** `d9bb7096a8d21f200aef2b2d96805f8b3cea2af6`, parent `e1c8d247a82b48a75ce18bf1d6c5c2e85481da37`.
This acceptance covers local native-log synchronization, exact physical state/replay, the retained clipping model, and native output. It does not accept a source closure, a prerequisite batch, or the separate label-only correction. The value-mode legend/readout still describes the coordinate bound as `eta c`; the already-correct plotted bound is `eta c sqrt(2)`. That inherited, separately tracked wording remains open in this exact commit.

## Immutable scope and independent reading

Peer reviewed a fresh exact-commit archive at `/tmp/atlas-ctrl-deep512-peer/archive`, not the producer worktree. Read the complete 5.12 statement, proof idea, caption, controls, gradient/trajectory functions and drawn/readout quantities, plus the actual shared slider and state replay/validation implementation. The change inserts exactly seven local lines: two comments, a loop over the two controls, native `step='any'`, initial physical-value resynchronization, a post-input resynchronization listener, and the closing brace.

The peer byte guard removes exactly that insertion and recovers the entire parent `content/deep/ch05-c.js` byte for byte. Shared core, the DEEP syllabus and chapter helper remain byte-identical. The candidate has exactly three changed paths: the one local chapter, producer report and producer native test. Therefore all statements, labels, mathematical functions, control domains/inventory, other items and source flags survive unchanged.

The native range represents `log10(physical value)`. The shared slider retains the exact physical default/set value independently from its thumb. Changing only the local native step removes the independent 400-tick sanitization. The subsequent local listener executes after the existing native listener: two-significant-digit physical rounding and bounds still occur in the shared listener, then `set` writes that exact physical result's logarithm back into the native thumb. Programmatic `set` does not synthesize another input event. The initial resynchronization also covers the exact default when state replay omits a setter because the saved value already equals it.

## Before/after counterexample

The independently authored `tests/verification-deep512-log-peer.mjs` fails against a separate exact-parent archive `/tmp/atlas-ctrl-deep512-peer/before` at the original default:

- actual DOM log: `-2.69930362327112`;
- independently computed `log10(0.002)`: `-2.6989700043360187`.

The same independent probe passes the exact candidate. This is a direct actual numeric DOM versus physical-model oracle; no second sanitized range is used as a reference. Log-coordinate tolerance is `6e-14 × (1+abs(expected))` in the independent probe; the rerun producer probe independently uses its stricter documented `6e-14 × max(1,abs(expected))` bound. Physical saved/model values are compared exactly.

## Fresh native and independent mathematics

Reran the candidate's complete `verification-deep-clipping-state.mjs` with a new peer output directory. All six combinations **1450/430/320 × light/dark** pass: actual native logarithms, both mode buttons, real Home/End/Arrow keys and three pointer-drag positions per control, two-significant-digit physical input, exact whole-state remount/replay, continuous raw restores, and ten malformed whole-state fallbacks per combination. The scalar-RNN polynomial-sum oracle compares the actual red/blue parameter paths and step-length data and both actual dashed bounds. Runtime/TeX/blank and horizontal-overflow checks pass.

The separate peer utility runs at **320 px in both themes** and independently uses differentiated Horner evaluation of the 30-term polynomial, then applies the exact selected norm/coordinate clipping update for sixty iterations. It compares the actual blue parameter trajectory against this independent evaluation. For each theme it additionally checks:

- both actual mode buttons, including `aria-pressed` DOM state;
- Home, ArrowRight, PageUp, End, ArrowLeft, PageDown on each control in each mode (24 real key transitions per theme), endpoint equality and two-significant-digit physical values;
- 48 arbitrary continuous logarithmically distributed raw physical-state pairs, alternating modes, with exact physical state preserved and exact snapshot/path/native-DOM/readout replay;
- ten additional malformed states containing booleans, arrays, objects, below-minimum numbers and one-ULP outside-domain numbers, with the other control and mode validly edited; every case notifies and resets the **whole** state to defaults.

Peer personally inspected sixteen fresh independent PNGs: actual controls and all three actual stage outputs for both modes in light/dark at 320 px. Thumbs and mode buttons are legible and synchronized; plots and mode-specific dashed bounds are present. Also inspected the rerun default/value captures and step-length panels from the wider producer probe as supporting evidence. The separate label issue above is visible and is intentionally not certified by this runtime acceptance.

## Checks and reproducibility

- `node scripts/build.mjs --strict`: 6684 written / 6890 planned / 450 chapters / 85 collections; zero errors/warnings, home 112703 gzip bytes in this exact archive.
- `node scripts/check.mjs deep-5.12 --static`: one item, zero errors/warnings.
- `node --test tests/verification-deep-sources.test.mjs`: all sixteen existing mathematical groups pass, no fail/cancel/skip.
- All browser servers use OS-assigned ephemeral ports, with no FPS benchmark performed.

Evidence root `/tmp/atlas-ctrl-deep512-peer/`: `guard.log`, `before.log` (expected regression failure), `native.log` (six combinations), `independent.log` (both narrow themes), `build.log`, `static.log`, `existing-math.log`; producer-probe fresh pixels in `output/`; independently authored probe pixels in `independent/` and personally inspected contact sheets `contact-0.png`, `contact-1.png`.

Rerun independent probe from any checkout with dependencies:

```
DEEP512_PEER_ROOT=/absolute/path/to/exact-candidate-archive \
DEEP512_PEER_OUTPUT=/own/unique/output \
node tests/verification-deep512-log-peer.mjs
```

No source flag, acceptance ledger, global inventory, queue, MASTER or coordination file is changed by this peer report. Coordinator may accept this runtime follow-up separately while leaving independent prerequisite/source/label records intact.
