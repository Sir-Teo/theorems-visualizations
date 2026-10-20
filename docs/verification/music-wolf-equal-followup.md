# Music 7.4 / 7.9: closing fifth and equal temperament

This bounded follow-up repairs the two flagged public items, their matching syllabus rows and isolated exact-ratio/synthesis code. Both `verify` flags remain true pending independent parent acceptance. The accepted 7.5/7.7 objects, source-audit helper and root repairs are preserved. No central queue, master plan, generated data, shared renderer/audio runtime, historical neighbor or summary is changed.

## Actual source and reading scope

The author technical source is Dave Benson, *Music: A Mathematical Offering*, **Web version 14 December 2008**, downloaded from the author's [Aberdeen PDF](https://homepages.abdn.ac.uk/d.j.benson/pages/html/music.pdf). The complete cached file `/tmp/atlas-music-pythagorean-sources/benson-music.pdf` is 10,147,294 bytes, 531 PDF pages, SHA256 **6983deabf65460f5bfa01fdf3748963d2a4a8045c3fe8a4c42aa18a477da57a7**. The version date was read on the actual title page; this is not a claim that all 531 pages were read.

The complete extracted text is `/tmp/atlas-music-pythagorean-sources/benson-music.txt`, with `=== PDF PAGE n ===` markers. Actual used readings:

- Complete §§5.3–5.4, printed pp.155–158 / PDF169–172: fifths, octave folding, Pythagorean comma and cents. Actual image `benson-page-170.png` was inspected, including the distinction between a fifths spiral and a closed enharmonic diagram. The movable one-edge cut and its third formulas are derived here; this does not authenticate a traditional cut placement.
- Complete §5.14 core, printed pp.190–192 / PDF204–206, including exercise1's integer-power comparison. Actual images204/205 were inspected. The text explicitly calls the one-eleventh syntonic-comma approximation “almost exactly equal”; it does not give an exact equality. The public item retains only the mathematical definition and approximation distinction, without authenticating Kirnberger/Ellis/Farey historical or experimental claims.
- Complete §§5.5 and5.7, printed pp.159–162 / PDF173–176: source just-major ratios and declared chord comparisons. Actual images174 and176 were inspected. Page162 explicitly distinguishes the harmonic `4:5:6:7` version with `7/4` from a related dominant-seventh version with `16/9`. The widget names its choice **harmonic seventh**, and never treats every seventh reference as unique.
- Used fixed-string passages in §3.2, printed pp.89–91 / PDF103–105, including mode formulas3.2.6/7. Actual image105 was inspected. The fixed-tension/fixed-density inverse-length formula supports the ideal-string derivation; this does not validate fret compensation on a real stretched instrument.

The actual written prerequisite statements and derivations were read: music7.3 (comma definition), music1.6 (cents), music2.4 (fixed-string fundamental), accepted music7.5 (pure-major triad construction) and music6.2 (specified harmonic-pair difference formula). The latter's broader roughness/historical account is not inherited as a premise. Item7.4 keeps its actual comma dependency. Item7.9 uses these five written inputs explicitly. Its planned-only or unused edges are not padded.

The chromatic rational reference collection is **authored** and explicitly nonunique. Its ratios are numerical comparison choices; it is not presented as a copied empirical dataset or one canonical just-chromatic table. No separately unread original by Zhu Zaiyu, Stevin, Helmholtz or a historical tuner is certified. The rule-of-eighteen recipe, dates, priority assertions, broad piano-standardization claim and subjective “all keys sound alike” claim were removed.

## Corrected mathematical scope

### 7.4

The old idea falsely inferred twelve700-cent fifths from their total alone and reversed excess/shortfall accounting. The old readout identified a678.5-cent closing interval with the comma ratio. The repair instead gives exact identities:

- Twelve pure fifths exceed seven octaves by `P=(3/2)^12/2^7=531441/524288>1`.
- Eleven pure fifths and one closing fifth require `W=2^7/(3/2)^11=262144/177147`.
- `(3/2)/W=P`, and `(3/2)^11 W=2^7`.
- A four-edge major third avoiding the cut is `81/64`; crossing the cut divides it by `P`, giving `8192/6561`. Exactly four of twelve four-edge windows contain the specified cut. Errors from5/4 have exact ratios81/80 and32768/32805, respectively.

The construction uses reduced BigInt ratios for all twelve possible cuts. C remains the fixed authored C4=261.6256-Hz reference for every cut. Each pair starts at its own folded note in `[C4,2C4)` and ascends by its actual interval; a cycle is twelve individual pairs, not a repeatedly rising twelve-fifth scale. Equal angular positions indicate chain order. Every major third appears in the table; no rounded-cents threshold decides “good”, “usable”, pure or historical status.

Selection is an integer control independent of the closing-edge control, and real clicks must fall near an actual visible segment interior. Center, exterior and endpoint clicks are ignored. The inherited invisible angular sectors have been removed. Selected-edge state is replayable and does not auto-play on mount.

### 7.9

Equal temperament uses `2^(n/12)` and exactly100n cents. Its equal fifth is700 cents; the deficit from a pure fifth is exactly one twelfth of the Pythagorean comma. It differs from the 1/11 syntonic-comma recipe. The independent integer inequality `3^84 5^12 < 2^161` establishes that non-equivalence without comparing two rounded decimals.

The ideal fixed string has `f1=(2L)^−1 sqrt(T/μ)`. At fixed tension and density, remaining vibrating length is `L 2^(−n/12)` while nut distance is `L(1−2^(−n/12))`. All thirteen offered positions n0–12 are drawn, including both exact endpoints. A650-mm scale is explicitly an authored distance example. Fixed text locations avoid the old labels running outside the plot near the first and last intervals.

The table includes all twelve declared reference rows, with separate9/5 and7/4 seventh rows. The old plot mentioned the harmonic seventh but omitted its7/4 row. Reference selection changes the fret comparison; the independent chord control determines actual playback. Ratios/cent errors do not classify perceived quality.

Exact coincidences are counted by integer cross-products for **all and only** the played H1–H8 partials between distinct chord voices. Independent common-multiple enumeration gives four pairs for 4:5:6, four for 10:12:15 and seven for 4:5:6:7. The old code counted up to H8 although shared playback contained only H1–H6, and used a 0.05-Hz tolerance as exact equality. The new readout reports exact rational coincidences and numerical ET separations for those same indices. It does not infer that every other pair is inaudible, that the rational chord has no beating, or that any perceived beat is certified.

For integer0<n<12, `2^(n/12)` is irrational: in a reduced rational p/q with twelfth power2^n, unique factorization forces q=1 and12|n. Thus non-octave ET voice ratios cannot make an exact integer harmonic coincidence. This exact theorem is separate from floating-point evaluation of the displayed frequency differences.

## Authored audio contract

The isolated helper renders mono 44,100-Hz buffers. Each voice has exactly eight harmonics, amplitudes1/h; voices are averaged and divided by `Σ(h=1..8)1/h=761/280`. Multiplication by 0.12 and 10-ms linear end ramps gives an analytic pre-output peak bound 0.12. Every offered event has every harmonic strictly below22,050Hz. Cycle/alternating gaps are exact zero samples. The helper rejects nonfinite/nonpositive/aliased frequencies, unsupported duration/gap/actions, empty or excessive voice/event counts, sparse arrays and inherited numeric indices before buffer allocation.

Playback uses the actual synthesized buffers with voice gain1 and normalization disabled. The existing runtime master gain0.9, compressor and device remain separate output stages. Automated checks assess buffers, scheduled actions, gains, stops and state; no calibrated acoustic measurement or human listening gate is claimed.

## Independent numerical and native evidence

Six focused math groups cover exact all 144 cut/selected states, products and crossed-third windows, all 12 visible segment targets and ignored regions, all 13 frets and 12 reference rows, independent common-multiple H8 enumeration, all 12 cycles/144 selected pairs/every reference-chord-action, independent waveform samples/ramps/gaps and malformed domains. The full draft run passed 6/6 in about 9.7 seconds: `/tmp/atlas-music-wolf-equal-math-final.log`. The installed test `tests/verification-music-wolf-equal.test.mjs` was independently rerun: 6/6 pass in about 10.7 seconds, `/tmp/atlas-music-wolf-equal-math-installed-final.log`.

A separate90-digit Decimal/Fraction oracle, `/tmp/atlas-music-wolf-equal-decimal.py`, reads the exported model values in `/tmp/atlas-music-wolf-equal-numeric-data.json`. All 666 comparisons pass. Maximum absolute error is1.95e−13 cents,1.60e−16 for ratio/position and3.33e−13Hz for ET partial separation. It also proves the closure and 1/11 non-equivalence identities with exact integers. Log: `/tmp/atlas-music-wolf-equal-decimal.log`. The Python script uses only standard-library Decimal/Fraction, and does not call the production helper for its oracle formulas.

Scoped static checking selects the two actual items and passes2items/0errors/0warnings: `/tmp/atlas-music-wolf-equal-static-final.log`.

Native script `tests/verification-music-wolf-equal.mjs` operates the actual harness controls, snapshots and AudioBufferSourceNode entry points. The final matrix covers 1450/430/320 px in light/dark. It checks every cut×selected pair, every reference/chord, actual edge clicks and ignored clicks, integer Home/End controls, destroy/remount state, malformed-state fallback, graph/fret/table/full marker-and-stroke bounds, pairwise canvas-text bounds, rendered TeX/page overflow, every actual audio-buffer sample/gap/finite value/register/gain/limiter/schedule/stop and no autoplay. **Final result: all 12/12 groups pass, process exit 0, browser/server closed.** Log: `/tmp/atlas-music-wolf-equal-native-final.log`. Across the matrix, 222 actual user-triggered buffered actions contain 1,068 events: 168 wolf/cycle actions and 54 equal/rational/alternating chord actions. Every actual buffer sample is checked against the independent H8 formula, with unchanged 7e−9 tolerance, finite-value/peak/gap and output-route assertions.

Failed development logs are preserved. The initial native check wrongly required bit-identical transcendental results across Node and Chromium; actual log/cos results differed by one binary64 ulp. Exact integer/string/boolean fields remain exact, while numerical transcendental fields now use a2e−14 relative/absolute bounded check. A later visible-edge click check took the old rendered selection as the expected audio selection, although the real control updates before the next frame; its oracle now reads the actual changed integer control at audio start. Neither finding required a production math repair or a widened audio-sample tolerance. The corrected 320px light 7.9 group passed before launching the complete final matrix. Original logs: `/tmp/atlas-music-wolf-equal-native-draft-74.log`, `...-74b.log`, `...-79.log`.

## Scope and reproducibility

Fresh accepted baselines were saved only after root released commit e0850c9: `/tmp/atlas-music-wolf-baseline/{ch07.js,ch07-b.js,syllabus.js}`. `/tmp/atlas-music-wolf-scope.py` removes only the two owned objects/rows and their new isolated imports, then asserts exact equality of all remaining bytes. It passes; log `/tmp/atlas-music-wolf-scope-final.log`. This includes the accepted7.5 selected-ring-before-fill repair and both accepted source flags. The accepted just/meantone helper was never edited.

Rerun the focused math with `node --test tests/verification-music-wolf-equal.test.mjs`, static with `node scripts/check.mjs music-7.4 music-7.9 --static`, and native with `node tests/verification-music-wolf-equal.mjs` (optional arguments: item, theme, width). The Decimal oracle can be rerun using any Python with standard-library Decimal. The frozen manifest `/tmp/atlas-music-wolf-equal-manifest.json` includes the seven owned paths, exact source/evidence identities, accepted-neighbor identity and all 198 unique final screenshot files. Source flags remain true; only the independent parent may accept this candidate.

Final screenshot inspection covered complete 1450/430/320px layouts in light/dark for both items, including moved closing edges, all twelve table rows, low/high fret references, 9/5 versus7/4 and the harmonic-seventh playback state. Selected representative final files are `/tmp/atlas-music-wolf-equal-7.4-cut0-1450-light.png`, `...-7.4-final-430-light.png`, `...-7.4-default-320-light.png`, `...-7.4-final-1450-dark.png`, `...-7.4-final-430-dark.png`, `...-7.4-final-320-dark.png`, `...-7.9-harmonic7-1450-light.png`, `...-7.9-m2-430-light.png`, `...-7.9-H7-320-light.png`, `...-7.9-H7-1450-dark.png`, `...-7.9-H7-430-dark.png` and `...-7.9-H7-320-dark.png`. Full-page and isolated-panel checks show readable labels/tables, distinct selection/cut markers and contained first/last fret markers; no additional visual repair was needed after the final production freeze. This is automated and agent visual inspection, without a human listening or review claim.

Artifact naming detail: on this case-insensitive macOS volume, the `m7` and `M7` screenshot names coincide, so there are 198 unique final PNGs rather than 216 attempted outputs. Both reference states are independently asserted in every native group; the surviving `m7`-named PNG is the final major-seventh state. No separate minor-seventh bitmap is claimed. The source/model/control/audio checks and all width/theme layouts are unaffected.

## Worker-one independent recheck (2026-10-20)

The preceding sections preserve the inherited author's evidence record. A fresh isolated worktree at baseline `dad83c6` independently re-read the cached author PDF (same SHA-256), complete used §§5.3–5.4 and §5.14 core, the used chord passages §§5.5–5.7, and fixed-string pp.89–91. Formula-page images170,205,105 were inspected directly. The author-host web fetch timed out in this run; the complete cached PDF and its hash, rather than an inaccessible search snippet, are the actual source used. The PDF skill was used for read-only page inspection.

Fresh evidence is under `/tmp/atlas-worker-one/`: `wolf-equal-math.log` passes all6 tests, `wolf-equal-static.log` passes2 items with0 errors/warnings, and `wolf-equal-decimal.log` passes the independent90-digit Decimal/Fraction666-value oracle against freshly exported production values. Maximum errors are1.95e−13 cents,1.60e−16 ratio/position and3.33e−13Hz. The native test now writes to that unique directory. At this review checkpoint its complete light matrix for7.4 has passed at1450/430/320px; the remaining dark7.4 and all7.9 groups are still running and are not claimed freshly complete by this checkpoint. All inherited source flags remain true for coordinator acceptance.

Fresh7.4 final1450/320 light full-page images were independently inspected: chain nodes, selected gold edge, red closing edge, all12 ratio rows and controls are legible and contained. Inherited7.9 harmonic-seventh1450 light and H7/320dark images were also directly inspected; those are explicitly prior-run images, with fresh replacements to follow. No content defect was identified in this bounded recheck. Human listening is not a gate claimed by this work.
