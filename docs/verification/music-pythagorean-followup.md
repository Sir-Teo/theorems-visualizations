# Music 7.1–7.2: exact tuning and infinite-orbit claims

Resolved after independent root acceptance: **music-7.1 and music-7.2**. Source flags and queue are reconciled. Scope is the two items, isolated import, two syllabus rows, helper, dedicated tests and this report.

## Source actually read

Dave Benson, *Music: A Mathematical Offering*, **Web version dated 14 December 2008**, acquired from the author's host:
<https://homepages.abdn.ac.uk/d.j.benson/pages/html/music.pdf>.

- Local complete PDF: `/tmp/atlas-music-pythagorean-sources/benson-music.pdf`, 10,147,294 bytes, 531 PDF pages.
- SHA256: `6983deabf65460f5bfa01fdf3748963d2a4a8045c3fe8a4c42aa18a477da57a7`.
- Extracted text: `/tmp/atlas-music-pythagorean-sources/benson-music.txt`, with explicit PDF-page markers.
- Read complete §§5.2–5.4, printed pp.154–158 / PDF168–172: fifth/octave construction; fa–do–so–re–la–mi–ti chain and C-major ratio table; two limmas versus one tone; comma; limma/apotome; twelve-note cycle versus spiral; cents definition and complete ratio/cents table.
- Read §6.2 opening and complete Lemma6.2.1 with proof, printed p.204 / PDF218: rational approximation 7/12 and irrationality of log₂3. No claim to have read the rest of the continued-fraction chapter.
- Inspected actual original formula/table images at `/tmp/atlas-music-pythagorean-sources/benson-page-{169,172,218}.png` (PDF pages; printed155/158/204), checking extraction against the printed exponents, ratios, cents and parity proof.

This is primary author technical exposition of tuning, not an ancient original or an experimental source. Public refs/credit identify the actual Web version. Removed unread Loy references and Greek/Philolaus/Plato/medieval/Kronecker historical-priority or causal claims. The finite display and audio choices are authored; the full density proof is an authored mathematical argument. No claim of new historical-source closure follows from Benson's historical discussion.

## Actual prerequisite reading

- `content/music/ch01.js`1.6, Cents: definition 1200log₂(f₂/f₁), additive logarithmic intervals, octave1200 and exact-to-rounded examples. Retained as the sole derivational dependency of7.1.
- `content/music/ch06.js`6.1, Consonance/simple ratios: actual statement, idea and scope. Its empirical/historical accounts are unnecessary to the construction or proofs, so moved from deps to see.
- `content/pma/ch01-a2.js`1.20: actual Archimedean statement/proof and density-of-rationals argument. The new proof invokes only its Archimedean step to choose arbitrarily large N. It does not pretend the prerequisite itself proves irrational-rotation density.
- 7.2 directly uses the new7.1 exact fifth/octave convention. No dependency is inferred solely from a title.

## Corrections and exact finite models

### 7.1

The previous prose counted five fifths as five notes and seven fifths as the F-to-B chain. The new control explicitly counts1–12 notes, including the start; there are0–11 fifths. Names and exact ratios use k=0,…,n−1. A ratio3ᵏ is divided by2^floor(log₂3ᵏ) to put it in[1,2). BigInt bit length and reduced integer fractions decide the construction; decimal cents are output values.

The selected start is now the octave origin. This preserves the formerly cropped F-only closing octave and makes every table contain the start at ratio1 and an explicit closing octave at ratio2/1200c. Table rows replace colliding horizontal ladder labels. Every next-gap ratio is a reduced quotient of adjacent exact ratios, including the closing gap. Their product is exactly2; the displayed gaps sum to1200c. Five-note and seven-note collections are derived from the exact chain. Seven notes give five9/8 gaps and two256/243 gaps; twelve notes give five2187/2048 gaps and seven256/243 gaps. The previous erroneous65536/59049='T+T' classification and unreachable E♯/F comparison are removed.

Playback is expressly authored: C4=261.6256Hz or F4=(4/3)C4, mono44,100Hz pure sines; scale events0.3s with0.03s silence only between events; last fifth1.2s; linear10ms start/end ramps; amplitude bounded by0.12. The simultaneous pair is the previous chain note folded above the root and exactly1.5 times that frequency, so its upper note may lie outside the table octave. The last-fifth button is disabled at one note. No autoplay, historical timbre, consonance-rating, calibrated-level or human-listening claim.

### 7.2

The theorem uses exact α=log₂(3/2), not rounded701.955c. Its elementary proof handles all integer m, including m+k≤0; the analogous5ᵏ=2^(m+2k) proves the third case. Distinctness uses the difference of two positive indices.

The authored density proof fills the previous logical gap. Among N+1 fractional parts in N bins, distinctness gives0<δ<1/N. A positive-index difference gives a rotation by eitherδ or−δ. Its forward multiples through floor(1/δ) make a circle grid with every gap≤δ, in one direction or the other. Arbitrarily large N therefore give arbitrarily fine grids within the forward orbit. A finite chart is explicitly separated from that infinite proof; no finite maximum-step display purports to establish density.

For pure modes, BigInt powers and bit length select the folded ratio. Squaring compares that ratio to√2 to choose the nearest octave exactly. Strict record decisions compare exact ratios max(r,1/r) by cross products, without floating tolerances. Numeric log1p of an exact integer difference yields signed cents and avoids cancellation near1. Closest-pair gaps are chosen by exact quotient comparisons on the sorted circle before conversion to cents. For ET, all folded cents and signed distances are integer arithmetic on700k; equality occurs exactly when12 divides k. Its primitive period is12 because gcd(7,12)=1. Distinct pitches and completed returns depend on the selected prefix; zero is an actual plotted zero, without an error floor.

The count slider is linear, integer1–400 so every offered prefix is reachable. All selected steps, all strict records and the complete finite path remain visible. The chart uses log₁₀(1+d), with ordinary-distance tick labels including0. Only the best record is text-labelled, preventing clustered record-label collisions; all records remain gold markers and are listed in the readout.

## Independent mathematics and audio

Command: `node --test tests/verification-music-pythagorean.test.mjs`.
Log: `/tmp/atlas-music-pythagorean-math-final.log`.
Six groups pass:

1. All24 start/count scales: independently accumulated fifths; exact reduced ratios, spelling, ordered gaps and telescoping product2; pentatonic/diatonic/chromatic checks and exact transposition back to Benson’s actual C-major ratio table (PDF172).
2. All1,200 mode/count prefixes: independent75-decimal fixed-point atanh-series logarithms, nearest-octave arithmetic, record sequences and ordered-circle minimum gaps. This reference does not call the production bit-length/squared-√2/cross-product algorithm.
3. All800 positive pure steps: exact odd-power versus power-of-two inequality and sign certificates; ET zeros only at multiples of12. Fifth records through400 are1,2,5,12,41,53,306; ET records1,2,5,12.
4. All46 possible scale/fifth start/count audio actions: exact chosen frequencies, every finite sample, amplitude bound, silence and both end ramps, with independent sample formula/order.
5. Invalid or coerced domains: noninteger/out-of-range controls, arrays/objects in place of selection strings, one-note fifth rejection.
6. An independent period estimate from interpolated rising zero crossings recovers every played scale frequency within0.002Hz, across both roots and all counts.

Draft tests were first run outside the default test glob; the default test file was added only after passing. The first draft's strict signed-zero assertion was corrected to numerical equality; it did not indicate a waveform defect.

## Native verification

Commands actually run on the final per-item behavior:

- `node tests/verification-music-pythagorean.mjs 7.1` → four groups, final log `/tmp/atlas-music-pythagorean-native7.1-final.log`.
- `node tests/verification-music-pythagorean.mjs 7.2` → four groups, final log `/tmp/atlas-music-pythagorean-native7.2-final.log`.
- `node scripts/check.mjs music-7.1 music-7.2 --static` →2 items,0 errors,0 warnings; `/tmp/atlas-music-pythagorean-static-final.log`.

Each item ran at1450/430px × light/dark. The native harness inspects actual rendered full paths, circle/line/arrow/marker/ring strokes, actual transformed canvas text metrics, TeX and page containment. It checks actual input-event values against models/readouts and DOM outputs/ARIA, every integer count, every selection, real keyboard Home/End/ArrowLeft, real pointer drags to both slider endpoints, valid snapshot/reload equality and invalid-zero-state rejection.7.1 additionally intercepts actual AudioBufferSourceNode starts, verifies every submitted sample, voice/master gain and limiter path, no autoplay after initial load or restoration, and actual Stop calls. It performs six real buffered audio actions per layout/theme,24 total. Cross-engine transcendental output comparisons use a1e−9c tolerance; integer equality and record decisions remain exact.

The complete7.2 sweep covers all1,200 mode/count pairs in each of four layouts/themes, explicitly checking the actual slider value equals each requested integer. Every visible step, exact zero, record and full finite path is retained.7.1 covers both roots and all24 root/count cases in every layout/theme. Final7.1 filenames distinguish the roots so evidence is not overwritten.

Saved pages and both individual panels use `/tmp/atlas-music-pythagorean-<item>-<state>-<width>-<theme>[-panel0|-panel1].png`. Inspected final representatives include:

- 7.1 `F-one-note-430-light`, `F-twelve-430-dark`, `C-twelve-430-light`, `default-1450-dark`: complete closing octave, long fractions, root spelling, table/header spacing, disabled one-note fifth control and all pitch/arrow labels fit.
- 7.2 `et-record-430-light`, `third-maximum-430-light`, `fifth-maximum-1450-light`, `et-maximum-430-dark`, `one-step-430-dark`: exact zero on the axis, all400 points/paths, strict-record markers and labels, finite-prefix readouts, long proof and all controls fit. No missing glyphs, cropped labels or page/TeX overflow were observed.

The first prototype native comparison used bit-for-bit Node-versus-Chromium equality and exposed only differing final bits in Math.log1p (about1e−13c); the harness now uses the stated tight numeric tolerance. Exact BigInt decisions and their independent75-digit references were unaffected. No model or source claim was relaxed to fix a test.

## Frozen handoff

Six paths:

1. `content/music/ch07.js` — only7.1/7.2 bodies and the isolated import.
2. `content/music/syllabus.js` — only7.1/7.2 rows.
3. `content/music/source-audit-pythagorean.js`.
4. `tests/verification-music-pythagorean.test.mjs`.
5. `tests/verification-music-pythagorean.mjs`.
6. `docs/verification/music-pythagorean-followup.md`.

Exact path hashes and source hash are recorded in `/tmp/atlas-music-pythagorean-manifest.json`. Read-only comparison with HEAD proves the chapter prefix/summary (apart from the isolated import), complete7.3-and-later suffix, and all other syllabus rows remain byte-identical; `/tmp/atlas-music-pythagorean-scope-final.log`. At author handoff both queued flags remained true for independent root review. No Git mutations, central ledger/plan, shared runtime/audio/input/data or full-build changes were made.


## Independent root acceptance

Root read the actual Benson Web title/version, complete §§5.2–5.4 (PDF168–172) and §6.2 opening with complete Lemma6.2.1 (PDF218), and inspected actual formula/table images169/172/218. Root checked the complete public statements, authored density proof, helper and both dedicated test files, plus the actual cents, Archimedean and related consonance prerequisite bodies. Only the cents identity and Archimedean choice are used; no unverified perceptual or historical claim is inherited from a related item. The density argument uses arbitrarily fine finite grids in the forward orbit; the plotted400-step limit is explicitly separate. All six frozen file hashes and the complete author PDF match the handoff manifest before root’s test-width extension.

Root independently reran **6 mathematical groups**, **8 full native groups at1450/430px** and **4 additional full320px groups**, all in light/dark, plus static **2 items,0 errors,0 warnings**. Logs: `/tmp/atlas-root-music-pythagorean-{math,native,320,static}.log`. These are12 distinct full viewport/theme groups; the native script’s default matrix now includes320px and `ATLAS_NARROW_ONLY=1` selects the four extra groups. Every offered integer count/mode, pointer/keyboard endpoint, valid/invalid replay and complete geometry/glyph/TeX/page boundary is checked. The six root7.1 groups execute36 actual buffered audio actions and verify every sample, declared frequency/gain/limiter path and stop call. This is automated signal evidence with no subjective listening requirement, and is not added to the historical53-item/95-action inventory.

Root inspected full430px light one-note and dark ET400 pages, the320px dark C-twelve-note table and the complete320px light third400 page. The final octave, all exact ratios, actual zero returns and strict records remain visible. The exact byte guard against HEAD preserves the chapter summary, all7.3-and-later objects, other syllabus rows and the shared music/audio/runtime code after removing only the two approved objects/rows and isolated import. No source/math correction was needed after the frozen handoff. The latest full accepted checkpoint remains1,582tests through55c657d; these6 default groups pass separately.
