# CPLX 5: randomized computation

Independently accepted after source, mathematical, native-state and personal visual review. No findings remain. The chapter preserves all 13 frozen identities, 5.1–5.8 and 5.10–5.14, including the original Paper kind and metadata on 5.14. No renderer or generated-data files are changed.

## Sources actually read

Normal HTTP 200 receipts and source files are saved in `/tmp/atlas-wave5-cplx-sources/receipts.json`:

- Arora–Barak's January 2007 author draft, actual PDF pages 132–144 / printed 7.2–7.14, and Appendix A.25 at PDF 475 / printed A.13. Read fixed-input random-tape semantics, one-sided and zero-error classes, amplification, circuit evaluation, advice and XOR coverage. This is the accessible author draft, not the published 2009 body.
- CMU 15-859E (2015), Lecture 11, all five pages: Schwartz–Zippel induction, field representation and general Tutte determinant statement. The source omits the Tutte proof; the chapter supplies a complete odd-cycle cancellation and matching restriction argument.
- Price, UT Austin CS388R (2021), Lecture 11, pages 1–3: Freivalds' test. The proof here directly conditions on the other coordinates, avoiding the notes' incompatible real-field/modulo-two step.
- Lovett, UCSD CSE200 (2013), Lecture 15, the 2SAT argument on page 1 and advice/XOR passages on pages 3–4. The chapter supplies the stopped-potential expectation and explicit timeout bound instead of importing an unsupported high-probability phrase.
- Agrawal–Kayal–Saxena's nine-page IIT Kanpur author manuscript: abstract/introduction and actual proof/runtime pages 2–7, including Algorithm 4 and its order, group-size and correctness arguments. Personally inspected rendered algorithm/correctness pages 3 and 6. The 2004 Annals metadata is preserved separately; another published layout is not claimed as read.

No denied source body was recovered through another route. There are no new source-uncertainty flags. Source transcription defects are corrected explicitly: Schwartz–Zippel needs a nonzero formal polynomial, amplification uses the independently derived moment bound, and XOR noncoverage is epsilon to the number of shifts.

Actual written inputs read: CPLX 3.4 and 4.4, NT 2.5, and ALGO 12.17–12.18. LADR 9.50, CPLX 3.2 and NT 3.12 were read for reconciliation. The real/complex determinant theorem and historical primality comparisons remain see-only. Planned TOC 12.5 and 13.13 remain see-only; the finite-field and random-walk proofs are supplied here.

## Mathematical and computational scope

The chapter distinguishes worst-case tape bounds from expected runtime, one-sided certificates from inconclusive answers, and independent ideal randomness from finite seeded illustrations. Reusing an answer does not amplify confidence. Exact odd-majority tails and tiny positive unresolved mass remain visible.

Schwartz–Zippel includes independent coordinates, formal nonidentity and field-size conditions. The complexity-class PIT argument uses a power-of-two subset with bounded fair-bit indexing and polynomial representation/sampling/evaluation costs. The F101 widget is a finite field illustration. Tutte is a decision certificate, with all field values including zero allowed; a singular matrix does not prove absence of a matching. Its proof and elimination work in finite characteristic, including two.

Freivalds computes actual exact integer residuals and enumerates every binary vector. The full binomial criterion keeps its unit hypothesis and exposes its n-coefficient cost. The bounded AKS implementation executes every branch and cyclic congruence for inputs 2–600. It uses the conservative integer bit length L in its order and factor thresholds; its finite work is separate from the source's asymptotic bit-complexity proof.

The 2SAT walk uses a separate seed from the planted formula target. The default honestly times out after a nontrivial walk. An exhaustive absorbing chain supplies the finite success law; W(d)=d(2n−d), stopped drift and Markov give the stated satisfiable-input guarantee. Unsatisfiable formulas disable that guarantee. Advice requires one common tape for all inputs of a length. XOR coverage keeps both strict inequalities and finite small-length exceptions; exhaustive best-family search is illustrative.

## Focused checks

`tests/wave5-cplx.test.mjs`: **17/17 groups pass**, log `/tmp/atlas-wave5-cplx-models-final.log`. These include all 46,656 four-vertex Tutte states against a separate Pfaffian formula; 2,940 cyclic powers against full BigInt binomial expansion; every AKS input 2–600 against trial division; finite polynomial grids, actual circuit outputs, all-vector Freivalds checks, absorbing chains, advice tables and XOR families. Geometric draws are checked against separately accumulated CDF bins, and the decoupled default SAT trace has an explicit regression. A focused source/metadata check preserves the frozen identities and Paper metadata.

Scoped static validation passes **13 items, zero errors and zero warnings**. Independent peer source/model evidence adds **72,252 comparisons** and **297 exact scaled-integer SAT-tail states**, including 105 positive tiny complements. These are separate from the author tests; see [independent review](wave5-cplx-review.md).

## Native and personal visual checks

The real production detail route is used with current chapter metadata injected in memory. Generated data is not edited. The utility checks actual statement/idea/caption text, consumer-to-model agreement, all visible physical control endpoints and modes, actual Create-state-link replays, malformed/out-of-domain/integer rejection, custom graph weights and drags, complete readout and pseudocode bounds, formula/text bounds, and finite plot/glyph/ring/stroke geometry.

The initial complete matrix passes **52 distinct settings**, all 13 items at actual 1200/320 widths in both themes, with **1,412 physical actions and 436 URL checks**, log `/tmp/atlas-wave5-cplx-native-first.log`. All 26 narrow default widgets were personally inspected. Early aborted metadata-route pilots are not accepted coverage. Bounded final replacements and final pixel inspection are recorded below before independent native handoff.

Visual review prompted a real sampled runtime histogram and first-runtime readout on 5.2, corrected the accidental formula/walk seed coupling on 5.11, and clarified matrix/grid orientation and the polynomial expression. These changes do not claim an empirical plot proves a complexity theorem.

Final 5.2/5.11 replacement passes **8 settings, 244 physical actions and 68 URL checks**, with minimum marker/ring clearance 10.0989208633 CSSpx and glyph clearance 3.1156244278 CSSpx (`/tmp/atlas-wave5-cplx-native-final-replacements.log`). This replaces existing cases, rather than adding unique coverage. The new helper also passed the peer's independent exact-rational inverse-CDF check: 204 percent/seed states and 104,448 samples, with complete histogram, overflow and mean comparisons.

A final **26-case narrow default pass** uses a 2400px viewport height at the same actual 320px width so tall readouts are fully painted (`/tmp/atlas-wave5-cplx-defaults-final.log`). Personally inspected all 26 complete widgets and selected rich statement/scope/proof/citation pages. These pixels exposed a shared chapter-local bars offset: count distributions, matrix rows, coefficient exponents and advice tape columns require indices starting at zero. Four consumers now explicitly request base zero; geometric rounds and output categories retain base one. The native utility asserts actual drawn abscissae and model ordinates. The final eight affected narrow defaults pass (`/tmp/atlas-wave5-cplx-defaults-indices-final2.log`), and both themes were personally inspected after the correction. The preceding failed probe was a test-instrumentation name collision, preserved in `-indices-final.log`; it is not accepted coverage. Screenshots and paired inspection images are `/tmp/wave5-cplx-production` and `/tmp/atlas-cplx-final-{pair,indices}-N.png`.

Author browser and server are CLOSED. Final product/test hashes are `/tmp/atlas-wave5-cplx-author-freeze.sha256`. Independent final native review uses a fresh full matrix, including the corrected plotted-coordinate assertions. Delivery remains local only.

The peer found that the native fixture omitted `paper` from its detail overlay, so earlier 5.14 screenshots lacked the citation card. This was a fixture defect; authored metadata and the strict builder already preserve it. The matching test-only correction now injects the paper and asserts actual authors, year, venue and DOI link, with padding-aware `.paper-cite`, `.theorem-scope` and legend scans. The peer's four-setting citation replacement passes (`/tmp/wave5-cplx-peer-citation-final.log`); coordinator also personally inspected both actual narrow citation cards in `/tmp/wave5-cplx-review-citation/citation-contact.png`. Product hashes remain unchanged; the final test manifest is `/tmp/atlas-wave5-cplx-author-freeze-final.sha256`.

The independent final matrix passes all 52 settings with 1,412 physical actions, 444 URL checks, 220 physical Create-link pairs and 5,008 extra plot assertions. Its bounded citation four-setting and scoped-text six-default replacements pass. Final peer report is accepted; author and reviewer browsers are closed.

The first integrated export exposed an accidental syllabus-boundary replacement that omitted the untouched planned chapter 6. The coordinator restored its exact original block and compared every non-5 chapter semantically against baseline `a7b6906f`; all match. A focused preservation assertion now keeps chapters 1–13 and every chapter-6 identity. The restored chapter/static check passes 66 items with zero warnings, and the 17 CPLX groups plus two planner groups pass. This restoration changes no accepted chapter prose or widgets. The earlier export's four warnings and failed planner test are retained rather than reported as a successful checkpoint.
