# Music 7.5/7.7 — just ratios and exact meantone closure

Accepted source audit; both source flags and the central ledger are reconciled after the independent root acceptance below. Scope is only7.5 in `content/music/ch07.js`,7.7 in `content/music/ch07-b.js`, their isolated imports, two syllabus rows, a new isolated helper, mathematical/native tests and this report. Accepted7.1/7.2, all summaries/neighbors and shared music/audio/input/runtime files are preserved. Root separately added the7.4 source flag during this work; that parent-owned flag is preserved and is not a change or closure claimed by this batch. No Git mutation, full build, generated-data or central ledger/plan edit was performed by this author.

## Actual source and prerequisite reading

Dave Benson, *Music: A Mathematical Offering*, **Web version dated14December2008**, complete531-page author PDF acquired earlier from [the author's host](https://homepages.abdn.ac.uk/d.j.benson/pages/html/music.pdf).

- Actual PDF: `/tmp/atlas-music-pythagorean-sources/benson-music.pdf`,10,147,294bytes, SHA-256 `6983deabf65460f5bfa01fdf3748963d2a4a8045c3fe8a4c42aa18a477da57a7`; hash rechecked for this audit.
- Actual extracted text, with PDF-page markers: `/tmp/atlas-music-pythagorean-sources/benson-music.txt`.
- Read complete §5.5, printed159–160/PDF173–174: octave-reduced harmonic ratios,4:5:6 triads, the complete just-major ratio/cents table, complementary thirds/sixths and the distinction between that diatonic table and alternative chromatic fillings.
- Read §5.12's core exposition printed176–179/PDF190–193 and exercise1 on printed179/PDF193: quarter-comma ratio table, generator construction, twelve/extra-note examples, diesis128/125, general alpha-comma definition, the statement that equal temperament is **close** to1/11 comma, and the third-comma pure-minor-third exercise. The historical names table was read as Benson's secondary historical account, not as original historical-source verification. Listening/recording suggestions and the rest of the chapter/book are not claimed read.
- Actual formula/table images inspected: `/tmp/atlas-music-pythagorean-sources/benson-page-{174,191,192,193}.png`; pages rendered with bundled `pdfplumber` at130dpi. These check the ratio exponents, octave placements, comma powers and “close to1/11” wording against actual page images.

This is explicitly primary author technical exposition of the mathematics, not an ancient, sixteenth-century or empirical listening source. Removed unread Loy references, Ptolemy/Aron/Zarlino priority/date assertions and listener-quality claims. The generator, finite cut, playback register and synthesis are disclosed as mathematical/authored choices. Benson's printed quarter-comma G value696.579c is not copied at that precision: the exact generator5^(1/4) gives696.578428466...c, which rounds to696.578c at three decimals.

Actual used prerequisite bodies read: accepted7.1 fifth/octave construction,1.6 cents/logarithmic interval identity,6.2 actual harmonic-partial frequency-difference formula and its scope,7.6 syntonic-comma identity, and7.4's twelve-note cut. Only the mathematical partial-pair identity of6.2 is used; its perceptual/Helmholtz claims are not adopted or re-verified here.7.5 retains7.1/6.2.7.7 uses7.6's comma identity and7.5's pure-third ratio;7.4 is a related `see`, not a required derivation. No new cross-field edge or planned prerequisite was added.

## Model/source repairs

### Just intonation

Five-limit means integer prime exponents2^a3^b5^c, not a unique chromatic scale. The exact C-major source table is1,9/8,5/4,4/3,3/2,5/3,15/8,2. Its I,IV,V upward voicings are respectively[1,5/4,3/2], [4/3,5/3,2], [3/2,15/8,9/4], each4:5:6 relative to its own root. Exact consecutive quotients give9/8,10/9,16/15,9/8,10/9,9/8,16/15 and telescope to2. D–A is40/27, a counterexample to every triad being pure in this fixed collection. A common frequency multiplication does transpose the whole scale; the inherited blanket “cannot be transposed/cannot modulate” was removed.

The finite authored patch is i=−1…2,j=0…1, with horizontal3/2 and vertical5/4 generators followed by exact reduced-rational octave folding. Its eight points include every source-scale note and one explicitly extra45/32 point. This replaces48 crowded ratio labels and restricts clicks to actual visible nodes. A real eight-option control persists the selected node without opaque unregistered state; a click selects and plays that node. The table includes all source notes and the explicit closing octave even when only a triad is highlighted.

The old scale-mode audio silently used the just scale for all three playback buttons. All just/equal/alternating scale and chord actions now have distinct declared event lists. C4 remains261.6256Hz throughout. IV is voiced F4–A4–C5, V G4–B4–D5; equal-tempered comparison uses the corresponding C-relative semitone indices in the same register. The old partial-frequency readout re-rooted all chords at C4 while audio sometimes lowered G by an octave. Both readout and signal now use the actual played roots.

Only specifically identified partial pairs are compared: root5 versus third4, root3 versus fifth2. Their frequency differences are zero at exact4:5:6 ratios and nonzero in the equal-tempered comparison. This is a frequency identity, not “all partials coincide”, “beat-free chord”, a roughness measurement or a consonance rating. The generated six-harmonic signal has many other partials, so the old universal beat-free conclusion was removed from body, caption/readout and syllabus row.

### Meantone

For comma c_s=1200log2(81/80), q=(3/2)(81/80)^(−alpha) is the regular generator. A twelve-note cut has eleven such fifths and W=2^7/q^11 as its closing fifth. Their product is2^7. This closure constrains their sum in cents; it does not force unequal temperaments to have twelve700c fifths.

Quarter comma gives q^4=5 and q^12=125. Thus the regular major third q^4/4=5/4 exactly, W/q=128/125, and four cut-crossing major thirds differ from the other eight by the diesis41.058858405...c. The cut is explicitly E-flat–B-flat–F–C–G–D–A–E–B–F-sharp–C-sharp–G-sharp, closed G-sharp→E-flat; C is anchored at1. The four major thirds on B,F-sharp,C-sharp,G-sharp cross that cut. Third comma gives q^3=10/3 and regular minor third4/q^3=6/5 exactly. “Pure” identifies exact interval arithmetic and does not classify usability.

Exact equal temperament requires q=2^(7/12) and alpha_ET=(1200log2(3/2)−700)/c_s≈0.0909036799024. It does not equal1/11. At1/11 the regular fifth is699.9998836293224c and closing fifth700.0012800774538c. An exact inequality certificate avoids dependence on rounding: equality of q_(1/11) with2^(7/12), raised to power132, would require3^84*5^12=2^161; the left is odd and in fact strictly smaller. The old exact1/11 claim, incorrect algebraic explanation and epsilon-based “now equal temperament” readout are removed. The separate1/11 comparison preset makes the distinction visible numerically.

The alpha slider declares a continuous0…0.34 domain with `step:'any'`; presets no longer silently conflict with a0.001 stepped input. Exact preset formulas identify Pythagorean, quarter-comma, third-comma and equal-tempered constructions; matching preset values restore those same symbolic definitions. Other values are general numerical evaluations. The stored numeric preset coefficient is a binary64 evaluation of that exact definition; the equal-tempered preset itself uses exact700c and semitone positions. Classification uses no near-preset tolerance. Actual DOM serialization is checked against a fresh detached range; model/snapshot values remain intact.

At alpha0.34 the closing-fifth deviation reaches56.973512707...c and cut-crossing third errors56.543386915...c, beyond the old42/48c axes. Left bounds now derive from all actual errors with text margin. The right row plot includes all twelve third errors, with enough space for names, bars, numeric values and selected-root marker at320px. Its color is a sign/exact-identity cue, not a perceptual threshold.

## Authored audio and mathematical checks

All playback uses a new isolated generator, not a shared-audio mutation: mono44,100Hz; six harmonics with amplitude1/h; harmonic amplitude sum49/20; averaging notes and harmonics gives a pre-output absolute peak bound0.12;10ms linear ramps; explicit between-event silence. Each action declares its event frequencies, frame count, gaps and ramp. Voices request gain1 and `normalize:false`; runtime master gain0.9 and its existing compressor/device path remain separate. There is no autoplay, calibration or subjective listening gate.

`node --test tests/verification-music-just-meantone.test.mjs`: six mathematical groups pass. The test draft ran outside the default glob before promotion.

1. All32 family/selected-node combinations: independent prime-power rational construction, source ratios, distinct visible points, exact4:5:6 voicings, all reduced gaps/telescoping octave, source-table numerical cents and40/27 counterexample.
2. Dense alpha grid0…0.34 at0.001 plus exact presets, subnormal and non-grid values, all12keys: independent multiplicative q-chain/voicings and octave folding, regular/closing cycle, all third values and full endpoint ranges.
3. Symbolic quarter/third-comma identities, exactly eight pure thirds, exact ET700/700 and semitone positions, and the integer-power proof that1/11 differs from ET.
4. All20 just-collection/single-node actions: independently recomputed every sample, ramp/gap/peak, distinct just/ET lists, actual voicing/partial identities. Independent interpolated rising-zero crossings recover all eight single-node fundamentals within0.002Hz.
5. All216 alpha-preset/key/action combinations construct their actual signals and verify frequency lists/ratios/registers. Every sample is independently checked at key0 and11 for all six alpha cases and three actions (36complete waveforms), in addition to the20 just waveforms above.
6. Invalid/coerced/off-lattice/model/audio domains reject before allocation; bounded event/voice/duration/sub-Nyquist domains are explicit.

The first mathematical draft used a negative exponent in its independent integer reference and strict signed-zero equality at a silent waveform endpoint. These were corrected test assumptions; no mathematical/model tolerance was relaxed. The public draft also briefly had a const-initializer syntax typo; it was fixed immediately after detection. The initial static report with one item was therefore partial and is not a valid two-item pass. Subsequent imports and scoped checks cover both items.

## Browser evidence and frozen handoff

Final browser, mathematical, static and scope checks pass. The first7.5 narrow run found a genuine long display-math overflow; its ordered scale list now uses smaller inline groups. A separate native audio-instrument attempt initially measured scheduling after its own expensive sample loop. The final interceptor captures currentTime and calls the real start immediately on entry, then checks the immutable buffer, avoiding instrumentation-induced late playback; the scheduling bound is unchanged. Failed logs remain `/tmp/atlas-music-just-native75-{first,second}.log`, with the passing targeted75/77 logs preserved separately. No relaxed control-serialization or perceptual acceptance criterion was introduced.

Known neighboring followups are preserved for parent tracking: root independently added a source flag/open report for7.4's false equal-only closure reasoning and comma-as-wolf ratio;7.9 was already queued and repeats the exact1/11 error. This batch does not change either neighbor or add a duplicate flag.


### Final evidence

- `node --test tests/verification-music-just-meantone.test.mjs`: **6/6 groups pass**, `/tmp/atlas-music-just-math-final.log`.
- `node tests/verification-music-just-meantone.mjs`: **12/12 groups pass**, both items ×1450/430/320px ×light/dark, exit0, `/tmp/atlas-music-just-native-final.log`. Browser and server closed in `finally`.
- `node scripts/check.mjs music-7.5 music-7.7 --static`: **2items,0errors,0warnings**, `/tmp/atlas-music-just-static-final.log`.
- `python3 /tmp/atlas-music-just-scope-check.py`: all unowned bytes match the initial backups, allowing only root's explicitly parent-owned7.4 `verify:true` addition; that flag is also asserted present. Accepted7.1/7.2 and every neighbor body, both summaries, all other syllabus rows and shared files remain preserved. Log `/tmp/atlas-music-just-scope-final.log`.
- An independent80-digit Decimal calculation of cents/commas/exact-ET coefficient and quarter/1/11 values is reproducible with `/tmp/atlas-music-just-decimal.py`; output `/tmp/atlas-music-just-decimal.log`. The mathematical alpha_ET is0.090903679902369102632...; the control's stored binary64 evaluation differs by about1e−15 while the named ET preset uses exact700c and exact semitone positions. The public approximation does not print unsupported16-digit precision.

Every native group checks all collection choices/visible-node clicks, all twelve key values at each preset, alpha endpoints/subnormal/non-grid values, keyboard Home/End, exact DOM serialization via a fresh detached-range oracle, output/ARIA, actual seed-free selected state, nondefault snapshot/destroy/remount equality and malformed selection/noninteger-key fallback. No restoration starts audio. Bounds cover complete polygons/lines/bars/strokes, filled/hollow markers and rings, all table labels, actual canvas text metrics and halos, pairwise data-text overlap, TeX and page overflow. This is not a marker-center-only or screenshot-only check.

The12 groups execute **216 actual buffered playback actions**:20 per7.5 group (all12 collection actions and eight actual lattice clicks) and16 per7.7 group (three actions at each of five presets and an endpoint triad). Every submitted sample is independently evaluated from the declared frequencies, harmonic amplitudes, envelope/gap and register; finite/peak/rate/length checks, actual voice gain1, master0.9, compressor threshold−10/knee8/ratio6 and real stop calls pass. Real start is called before the expensive oracle work and its scheduled time is captured at entry. This is automated generated-signal evidence, not a subjective listening result or an addition to a historical inventory.

Final regenerated full-page and panel screenshots were inspected at all three widths in both themes. Representative files are under `/tmp/atlas-music-just-<7.5|7.7>-<state>-<width>-<theme>[-panel0|-panel1].png`, including:

- 7.5 `default-1450-light`, `V-1450-dark`, `IV-430-light`, `I-430-dark`, `V-320-light`, `IV-320-dark`: complete source table/closing octave, finite patch, selected node, actual F/G chord registers and readout all fit.
- 7.7 `default-1450-light`, `1-3-1450-dark`, `Exact 12-TET-430-light`, `1-4-430-dark`, `1-11 comparison-320-light`, `endpoint-320-dark`: every major-third row, zero/pure identity, distinct1/11/ET values and full endpoint bars/labels fit.

Frozen **seven-path** manifest with source/cache/image and final evidence hashes: `/tmp/atlas-music-just-manifest.json`:

1. `content/music/ch07.js` —7.5 and isolated import only, preserving the parent7.4 flag.
2. `content/music/ch07-b.js` —7.7 and isolated import only.
3. `content/music/syllabus.js` —7.5/7.7 rows only.
4. `content/music/source-audit-just-meantone.js`.
5. `tests/verification-music-just-meantone.test.mjs`.
6. `tests/verification-music-just-meantone.mjs`.
7. This report.

Both owned flags remain true. This handoff claims no parent acceptance or central queue closure.

## Independent root acceptance

Root read both complete revised objects, every isolated model/audio/renderer function, all six mathematical groups and the complete native instrumentation. Actual prerequisite reading covered7.1's octave folding,1.6's logarithmic identity,6.2's explicitly used partial-frequency formula and7.6's comma identity. Root read actual Benson§5.5and§5.12core/exercise1 and inspected actual PDF174/191/192/193 formula pages. Six source/cache identities were reverified. Historical names/priority, empirical tuning preference and subjective listening claims are excluded; only the identified author exposition and complete ratio proofs are accepted.

Root independently checked the source table and upward4:5:6voicings, reduced prime-power lattice, common-factor transposition,40/27fixed-scale limitation, regular generator/closing-product construction, four cut-crossing thirds, quarter/third-comma identities, exact ETcoefficient and strict integer-power obstruction to1/11equality. The separate80-digit counterreview checks5,820alpha/key states; independent harmonic fits check66buffers/122events and exact partial identities. Root read that complete counterreport and verified all84artifact identities. The frozen report's inferred mpmath1.3.0label is corrected separately by `/tmp/atlas-music-psych-counter-version-correction.md`: current import is1.4.1; historical logs did not record its version. No historical runtime version is invented and no mathematical result changes.

The original frozen seven paths passed root sixmath/full12native/static2/0/0. The counterreview then confirmed two bounded defects: a hollow selected ring erased the inner highlighted node fill, and sparse arrays bypassed `.some` validation and could produce nonfinite samples. Root reproduced both failures in `/tmp/atlas-root-music-just-{markers,boundary}-before.log`, swapped the two node-marker draw calls, and added dense own-index checks before audio allocation. No valid-event samples/frequencies, shared runtime/audio path, source ratios or saved values changed.

Final independent root **six mathematical groups, all12native width/theme groups and static2/0/0pass with exit0**, logs `/tmp/atlas-root-music-just-{math,native,static}-final.log`. The six math groups are included in the default suite. Native evidence contains216actual buffered actions:120just collection/canvas-node actions and96meantone actions, with actual sample/register/ramp/gap/peak/start/gain/master/compressor/stop checks and no autoplay on restore. This is separate from the historical53-item/95-action audio report and the prior7.1audit. Twelve repeated original-candidate groups are not added to the final group count.

Root inspected the final1450-light default lattice,320-dark IVpage and320-dark alpha.34endpoint page: selected C now retains its green fill inside the gold ring, the whole source table/voicing remains visible and all twelve third errors plus the56.974cclosing-fifth endpoint fit. Actual full strokes/rings, labels, input domains, off-grid/subnormal parameter values, all12keys/presets, invalid saved states and exact model/snapshot replay pass. Native range serialization is compared with the independent detached browser range, without changing model precision.

Exact guards preserve every unowned byte of both chapters and the syllabus against HEAD, including accepted7.1/7.2, root's7.4flag and all neighboring tuning bodies. Seven frozen owned paths/six sources/seven evidence paths/216candidate pictures were verified at the236-entry checkpoint; final root file/log/selected-picture hashes are `/tmp/atlas-root-music-just-final-manifest.json`. The next7.4/7.9audit remains separate. The combined1,621-test checkpoint through6978d28is unchanged and excludes this later acceptance.
