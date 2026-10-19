# Music source review: chapters 7–8

Reviewed all 23 open source checks, their statements and computational models. Closed 7.16 against a full primary adaptive-tuning paper, with explicit differences between the panel and the published algorithm. The other 22 remain flagged for the historical/original-paper gaps listed below; exact computed arithmetic does not certify priority dates.

## Full sources read

Dave Benson, *Music: A Mathematical Offering*, author-hosted full 531-page preprint, https://homepages.abdn.ac.uk/d.j.benson/pages/html/music.pdf, linked by https://homepages.abdn.ac.uk/d.j.benson/pages/html/maths-music.html. Local PDF `/tmp/imaging-sources/benson.pdf`, full text `/tmp/benson.txt`. Relevant complete passages and tables, printed pages:

- §5.2 pp.154–155 Pythagorean scale and comma; §5.3 pp.155–157 cycle/spiral.
- §5.5 pp.159–160 five-limit major scale and pure I/IV/V triads.
- §5.12 pp.176–180 quarter-comma construction and historical recipes; §5.13 pp.181–187 relevant complete WerckmeisterIII, KirnbergerIII and Vallotti/Young recipe passages/tables; §5.14 pp.190–193 equal temperament. In particular pp.190–191 explicitly distinguish **approximate** eleventh-syntonic-comma tuning from equal temperament: residual closure difference 0.0013964 cents.
- §5.15 pp.193–195 Greek and later historical discussion used to distinguish a mathematical tuning from claims about actual historical practice; not treated as an original ancient source.
- §6.2 pp.204–209 full irrationality/convergent discussion and proofs; §6.3 pp.213–21753-tone tables; §§6.4–6.5 pp.217–22119/31-tone tables and meantone comparisons; §6.7 pp.224–227 complete Bohlen–Pierce construction/just-ratio/equal-step tables; §6.8 pp.227–232 full lattice, determinant/index and periodicity-block discussion.
- §9.4 pp.314–316 full change-ringing construction; §9.8 pp.322–324 tone-row operations; §§9.13–9.14 pp.330–335 complete Burnside proof, fixed-subset table, orbit counts, prime-form ordering, interval vectors and complement shifts. Prime forms agree with this source's first-last-second lexicographic rule; not asserted to resolve every Forte/Rahn convention.

William A. Sethares, *Real-Time Adaptive Tunings Using Max* (2002), full author manuscript nine pages, https://sethares.engr.wisc.edu/paperspdf/adaptun2002.pdf. Read the entire paper, including §§2–6, Eqs.1–8, context/persistence examples and limitations, conclusion and references. The algorithm minimizes pairwise sensory dissonance; local minima depend on spectra/constraints; held-note or static context can limit pitch wandering. The panel uses Nelder–Mead rather than the paper's gradient/SPSA and the chapter 6 helper's minimum-amplitude pair weights rather than Eq.1's amplitude product. These distinctions are explicit in scope. Downloaded 1994 original https://sethares.engr.wisc.edu/paperspdf/adaptun.pdf is image-only (nine extracted formfeeds); **not** recorded as read or used as direct evidence. The 2002 paper itself references the 1994 method, but the panel now cites 2002 without claiming a historical first.

*Tintinnalogia*, full original text transcription of the **1671 edition**, https://www.gutenberg.org/cache/epub/18567/pg18567.txt. Read title page and complete relevant sections *Of the Changes* and *The Plain Changes on four Bells*: adjacent swaps, hunt's single-place moves,24-row examples. This confirms the construction existed in this original text; it does **not** verify the often quoted 1668 first edition or 1677*Campanalogia*. The 1671 title page is not misreported as 1668.

## Repairs and dispositions

|Item|Review and remaining gap|
|---|---|
|7.1|Corrected five-note pentatonic=four consecutive fifths, seven-note diatonic=six fifths. Full Benson tuning table checked. Ancient Philolaus/Plato/Pythagoras priority originals remain unread.|
|7.2|Uses exact 1200 k log 2(3/2), not a finite rounded decimal, in distinctness claim. Clarifies density uses integer multiples of arbitrarily small rotations. Irrationality proof checked against full Benson§6.2. Euclid/Boethius/Kronecker 1884 historical sources remain unchecked.|
|7.5|Full just-scale table and I/IV/V ratios checked. Ptolemy/Zarlino originals and exact priority chronology still open.|
|7.7|Corrected false exact alpha=1/11 claim everywhere, including actual preset and readout: exact alpha=(pure-fifth−700)/syntonic-comma≈0.090903680. Approximation is explicitly distinguished. Aron 1523/Zarlino 1571 first-description claims remain unchecked.|
|7.8|Corrected major-third error sign: syntonic comma minus the sum of four narrowings. Full Benson recipes corroborate the modeled recipes but do not directly establish original Werckmeister/Kirnberger/Vallotti dates or historical recipe variants; flag retained.|
|7.9|Exact equal-step ratios and errors checked; cross-reference no longer asserts exact eleventh-comma equality. ZhuZaiyu/Stevin priority/publication originals remain unread.|
|7.10|Full convergent discussion plus independent arithmetic reasoning; second-kind best approximation distinguished from first-kind. Huygens/Lagrange attribution still open.|
|7.12|19/31 tables and meantone comparison checked in full Benson passages. Salinas/Woolhouse/Rossi/Huygens/Fokker exact dates/priority remain open; textbook history is not direct verification.|
|7.13|Removed false uniform 1.5 cent guarantee for every five-limit interval. The displayed eleven ratios have maxerror 1.5445 cents; error for 3^a 5^b is a e 3+b e 5 and can grow (27/25≈2.61 cents under this mapping). Removed register-independent <1 Hz beat claim. JingFang/Mercator/Bosanquet original sources remain open.|
|7.15|Distinguishes finite quotient classes from a continuous torus and from a faithfully embedded octave tuning; arbitrary quotients need not be cyclic. A kernel basis, not any independent pair, is needed to get exactlynclasses. Actual panel rejects dependent vectors rather than claiming 0 notes. All preset determinants/unique pitches independently tested. Original Fokker 1969 three-prime paper not read; the 5-limit panel is explicitly distinct.|
|7.16|**Closed.** Full primary 2002 paper supports dissonance-based retuning/context/drift. Corrects perfect-just/minimum/exact-comma assertions: this optimizer can reach local minima and need not drift by the ideal pure-interval comma. Differences in optimizer/weights explicitly stated, including initialization from pinned-note deviations, the soft 35-cent penalty and the separate pull toward 12-TET; actual held-tone and anchored-root constraints independently checked.|
|7.17|Full Benson just/equal tables confirm the entire ratio list. Clarifies model versus perception, and distinguishes ideal odd-harmonic pipes from real clarinets. Bohlen 1972/1978, vanProoijen 1978 and Pierce/Mathews/Roberts 1984 priority originals remain open.|
|8.5|Removed false converse identifying every Myhill set with a maximally even set: chromatic{0,1,2,3,4}has two sizes for each generic interval without maximal evenness. Displayed sufficient theorem/proof checked; original Clough–Myerson 1985 not read.|
|8.6|Actual rational-generator panel removes repeated pitch classes before counting positive gaps;700 cents with 24 notes has 12 distinct equally spaced pitches, not a spurious zero gap. Original three-gap proofs and Carey–Clampitt 1989 still open.|
|8.9|All 4096 canonical representatives checked against independent full-orbit first-last-second search, matching full Benson convention. Exact original Forte 1964/1973/Rahn 1980 numbering/conventions remain unverified.|
|8.10|Full Burnside proof/tables plus independent cycle-polynomial counts confirm 352/224 and every cardinality count. Original Burnside 1897/Cauchy/Frobenius/Reiner 1985 historical attributions not directly checked.|
|8.11|Full Benson pair-count definition and exhaustive vector invariance checked. Claim about Forte 1964 establishing the invariant still needs the original.|
|8.12|Exhaustive complement shifts checked for every cardinality; corrected reference to equal Fourier magnitudes to distinguish k=0. Babbitt/Lewin 1959–60/Kassler/etc. priority and exact papers remain open.|
|8.13|Enumerated 23 pairs with stated 1/3/15/3/1 cardinality distribution, all hexachord pairs complementary up toT/I. Full Benson counterexample checked. Forte/Hanson naming/priority originals not read.|
|8.14|DFT rotation/conjugation and finite 12-tone maximum claims mathematically checked; original Lewin/Quinn/Amiot chronology and full general maximally-even theorem remain open.|
|8.15|Corrects false equal-vector claim for **all** complements: k≠0 magnitudes always agree, k=0 only for hexachords. Same-vector/full-magnitude equivalence now explicitly assumes equal cardinality (empty/singleton edge). Exhaustive inverse-DFT/complement checks. Lewin/Quinn/Amiot original attributions remain open.|
|8.16|Tone-row operations checked against full Benson and permutation model; Berg row and Schoenberg/Hauer chronology still require original score/treatises.|
|8.21|Original 1671 text supports adjacent/hunt/24-row constructions; actual four/five/six-bell presets independently checked. Exact 1668 first-print/1677 chronology still open.|

A nearby unflagged 7.14 sentence also falsely gave every unequal well temperament the same intervals in every key; it now distinguishes circle closure from key-dependent interval patterns.

Original-access attempts: Clough–Myerson DOI 10.2307/843615 and Carey–Clampitt DOI 10.1525/mts.1989.11.2.02 a 00030 returned a 3038-byte HTML browser challenge rather than papers; Forte 1964 JSTOR request failed 502; Amiot 2007 DOI 10.1080/17459730701654990 returned 403. OpenAlex bibliographic records were used only to locate originals, never to clear source flags. Other historical originals listed above were not obtained/read; their dates remain explicitly unresolved.

## Validation

- `node tests/verification-music.test.mjs`:12 meaningful tests, including actual exact temperament preset, bounded-list versus arbitrary five-limit errors, Myhill counterexample, rational-gap deduplication, lattice basis/degeneracy,4096 prime forms, independent Burnside cycle-polynomial counts,4096 autocorrelation/complement transforms,23 Z-pairs, bell permutations and actual adaptive constraints.
- `node tests/verification-music-browser.mjs`:46 light/dark cases,226 native slider endpoint sweeps, every segmented option/toggle/native button (including explicit sound buttons),2 actual handle drags and 16 actual diagram clicks. Real KaTeX 0.16.11; no runtime/TeX/blank failures. All 46 screens visually inspected in `/tmp/music-contact.png`; full screenshots `/tmp/music-verification-shots`, report `/tmp/music-verification-browser.json`.
- Combined imaging 3–4, ODE 3–4, music 7–8 static check:99 items, zero errors and warnings. `node tests/verification-music-ode-focus-browser.mjs`:10 additional light/dark cases pass, checking dependent-vector rejection,24 generated pitches at 700 cents deduplicating to one 100 cent gap, the updated adaptive statement and the ODEendpoint/analyticity fixes. Screenshots in `/tmp/music-ode-focus-shots`, JSON `/tmp/music-ode-focus-browser.json`; all 10 visually inspected.
