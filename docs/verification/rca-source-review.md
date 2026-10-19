# RCA source review — 18 October 2026

A complete third-edition copy of Rudin's *Real and Complex Analysis* was downloaded from
[this full-book mirror](https://absinthe.tuxfamily.net/openmathdep/analysis_complex/Real_and_Complex_Analysis-Rudin.pdf).
SHA256: `fde4a952137aaa406ffb1e3e35dfc99a2dada5c51b10d27eed71ad7bfa820358`.
The complete relevant passages listed below were reviewed. Printed p. 1 is PDF p. 14. Text extraction is checked against page images where
equations are missing or ambiguous; temporary evidence is in `/tmp/atlas-rudin/`.

## Completed batches

| Items | Complete source passages inspected |
| --- | --- |
| 0.1 | Prologue equations (1)–(2), p. 1 |
| 0.2–0.8 | Prologue's unnumbered theorem (a)–(g) and proof, pp. 1–3 |
| 1.7 | Theorem 1.7, p. 10 |
| 1.8 | Theorem 1.8, p. 11 |
| 1.9 | Corollaries 1.9(a)–(e), pp. 11–12 |
| 1.15 | Minimal-decomposition proposition, p. 15 |
| 1.22 | Extended arithmetic and monotone-product limit, pp. 18–19 |
| 1.24 | All six propositions, pp. 19–20 |
| 2.2 | Positive linear functional discussion, p. 34 |
| 2.21 | Lebesgue-measure definition/remarks, pp. 52–53 |
| 2.23 | Determinant scale factor and elementary-map proof, pp. 54–55 |
| 3.3a | Jensen application, pp. 62–63, equations (4)–(8) |
| 3.4 | Definition 3.4, p. 63 |
| 3.5 | Theorem 3.5 and proof, pp. 63–65 |
| 3.10 | Remarks 3.10, pp. 66–67 |
| 4.15 | Section 4.15, pp. 83–84 |
| 4.16 | Lemma 4.16, p. 84 |
| 4.19 | Section 4.19, p. 86 |
| 4.24 | Sections 4.24–4.25, pp. 89–91 |
| 4.26 | Section 4.26, pp. 91–92 |

These **26 source flags are closed**, with exact locators added to the items.
The prologue's 0.n identifiers are editorial divisions of its unnumbered theorem;
they are explicitly cited as such.

The explanation of 1.24(c) incorrectly used a scaling biconditional at c=0.
It now handles zero separately. For 2.21, the credit distinguishes the 1901
measure/integral announcement from the 1902 dissertation, supported by the full
[MacTutor biography](https://mathshistory.st-andrews.ac.uk/Biographies/Lebesgue/),
paragraphs on the 29 April 1901 paper and the 1902 *Intégrale, longueur, aire*.
This historical support is secondary; no claim is made to have read that original thesis.

The combined Hölder/Minkowski credit had incorrectly assigned 1889 to both.
It now separates Hölder 1889 (the header and weighted-mean argument in the
[original transcription](https://de.wikisource.org/wiki/Ueber_einen_Mittelwerthssatz))
from Minkowski 1896 (the explicit *Geometrie der Zahlen*, pp. 115–117, reference
in [Weisstein's full article archived by Michigan State](https://archive.lib.msu.edu/crcmath/math/math/m/m260.htm)).
The latter is a secondary historical locator, not a claim to have read Minkowski's original book.

## Chapters 5–7 source corrections

The complete relevant passages in §§5.7 (p.98),5.11–5.12 (pp.100–103),5.14–5.15 (pp.103–104),5.17 (pp.105–106),5.21 (p.108),5.22–5.25 (pp.108–112),6.5–6.6 (p.119),6.9 (p.121),6.18 (pp.129–130),7.1 (pp.135–136),7.12 (p.141),7.13 (p.142),7.15 (pp.143–144),7.23 (p.151), and7.25 (p.153) were inspected. Formula6.9 was checked on the page image, because extraction omits it.

These close17 further **initial** flags, for43 initial RCA closures in total. Existing source identities were repaired as follows:

-5.12 contained the Riemann–Lebesgue lemma from5.14;5.13 contained the non-surjectivity theorem from5.15;5.15 contained Proposition5.17 on complex functionals. Those results now occupy their actual book numbers.5.12 and5.13 now contain their actual category results, with new interactive finite experiments whose limits are explicitly distinguished from the infinite assertions. Incoming signal/music/PDE links now target5.14, and Hahn–Banach targets5.17.
-5.23 contained the general representing-measure argument from5.22. The missing5.22 is restored;5.23 now demonstrates the polynomial maximum-modulus argument by independently comparing circle quadrature with the coefficient identity.5.24–5.25 now cover the book's full maximum-norm linear-space scope. The finite representing-measure demo no longer invents a positive interval of weights at a vertex.
-7.13 contained Theorem7.1, while7.1 was absent.7.1 is restored with the endpoint-atom argument made explicit;7.13 now states and demonstrates the actual singular-measure derivative theorem.

Additional repairs:5.7 and5.13 explicitly require nonemptiness for their second-category/non-Gδ conclusions;5.7 labels its finite rational rendering honestly.5.11 no longer assigns the stronger category theorem to an uninspected1873 source;5.14 no longer assigns a joint1854 date to Riemann and Lebesgue.6.6 retains the standard Jordan name, but removes the unverified1881 priority annotation.6.5 uses exact point equality for its discontinuous total-variation norm, rather than treating nearby distinct atoms as equal.6.9 halves the book's geometric construction: the unscaled weight can equal1 whenμ=0, whereas the rescaled weight is at most1/2 and satisfies the stated strict upper bound.7.15 now uses the measurable open-cover argument in the original proof instead of assuming an exceptional set's measurability.

Four independent numerical regression groups pass (complex translation, circle orthogonality, constant/broken-hypothesis cases, and the zero-measure weight). Native browser evidence is recorded separately in`/tmp/atlas-rca-browser*.json` and logs, with real pinned KaTeX, slider endpoints, options, actual pointer drags, and screenshots in both themes. The first corrected5.22–5.25 all-mode light run passed all four with zero warnings. The broader30-case native run passed28; its two5.23 failures were a readout-parser defect in the test, corrected and targeted for rerun. These do not count as passes until the rerun completes.

## Chapters 8–11

Complete relevant source passages were inspected for8.13–8.14 (pp.170–171),8.15–8.16 (pp.172–173),9.2 (pp.179–180),9.7 (p.182),9.16–9.17 (pp.188–190),9.18–9.21 (pp.190–191),9.22–9.23 (pp.191–193),10.5 (p.198),10.8–10.9 (pp.200–203),10.16's corollary (p.208),10.19 (p.210),10.22 (pp.211–212),10.27–10.28's corollary (pp.213–214),10.33–10.34 (pp.217–218),10.41 (p.224),11.8–11.11 (pp.234–236),11.16 (pp.239–240),11.18–11.24 (pp.240–244),11.29–11.30 (pp.246–248), and11.32 (p.249).

These close31 more initial flags, bringing the source total to**74 of137 initial RCA checks**. The other**63** remain open. This counts source review separately from runtime and human review.

-8.15–8.16 now state the positiveσ-finite measure hypothesis used in the source. The original wording had silently broadened the theorem while usingσ-finite Fubini in its proof.
-The translation-invariant-subspace classification moved from9.16 to its actual source number9.17;9.16 now gives the definition. Its proof now uses Rudin's Fourier-uniqueness/projection argument instead of an unjustified claim about uniform density of trigonometric sums among bounded functions on the line.
-The Banach-algebra and homomorphism definitions now occupy9.18 and9.20.9.19 retains the actual L1 convolution example; the automatic norm bound moved from9.20 to9.21, and the character classification from9.21 to9.23. Incoming semantic links are being reconciled with the FA reviewers. An actual-control test also caught a real KaTeX error in9.2's derivative-mode annotation; its prime expression is corrected.
-10.34 now defines a cycle through the existence of a representation by closed paths; alternative representations may use open paths, as the book explicitly explains.
-11.16 had contained the approach-region definitions from11.18;11.18 had contained the maximal comparison theorem from11.20;11.22 had contained the Lebesgue-point theorem from11.23. Those results now occupy the correct book numbers. New11.16 demonstrates Lp contraction and the failure of L∞ norm convergence for a discontinuous indicator; new11.22 demonstrates the actual positive-measure zero-derivative criterion.
-The circle maximal function includes the whole circle. Omitting that term could give zero at the antipode of a point mass while its Poisson integral is positive. The maximal-comparison demo now uses the proved conservative constant(1+2/(1−α))² in place of an uncertified grid maximum of majorant integrals; plotted suprema are explicitly finite-sample estimates. Its axis expands to retain the comparison curve.11.32 now includes the source's boundary-arc uniqueness clause and proof.

The final chapter5–8 native run passed**48/48** groups, including range endpoints, segmented options, toggles, actual handle drags and screenshots in both themes, with pinned real KaTeX. Evidence:`/tmp/atlas-rca-browser-final-ch5-8.log` and matching JSON. Six independent numerical groups pass, including analytic semicircle Poisson extension against independent kernel quadrature and the approach-region kernel comparison. RCA-wide static validation passed375visualizations with zero errors/warnings before the latest two restorations; repeat validation and chapter9–11 browser follow-ups remain in progress.
Browser and human-sample gates are tracked separately from this source ledger.

## Chapters12–13

Complete passages reviewed:12.5's extremal argument(p.255),12.7's unbounded-region discussion and the bounded-strip argument in12.8's proof(pp.256–257),12.11(p.260),12.13and proof(pp.262–263),13.7and its brief proof(p.271),13.9and proof(p.272). These close six initial checks, bringing the total to**80initial RCA closures;57remain**.

12.11 was labelled the general Riesz–Thorin theorem, with an unsupported combined1927 attribution. Rudin explicitly says he will not discuss that full generality here; his section sets up the L1→ℓ∞ and L2→ℓ2 bounds for uniformly bounded orthonormal coefficients. The entry now presents those exact endpoint estimates and an interactive orthonormal-basis example. Its former arbitrary-matrix interpolation surface was removed rather than attributed to the wrong numbered source.12.7 is explicitly cited as the preliminary bounded-strip argument, not as a numbered theorem in the book. Targeted controls for this batch remain in progress.

## Chapter14 alignment findings — not yet repaired or closed

Full source §§14.10–14.20(pp.285–291) was read during the next batch. The current entries are substantially misaligned:14.11odd square root belongs14.12(b);14.12area theorem belongs14.13 (book uses punctured-disc coordinates, current equivalent exterior-disc statement);14.13coefficient/quarter theorem belongs14.14. Current14.14growth/distortion and14.15compactness are supplemental results, not the book's14.14/14.15. Actual14.15bounds the diameter of the omitted set for a normalized univalent function with a simple pole at0;14.11is the Koebe example.14.17is actually examples of nonsimple boundary points; its current boundary-arc uniqueness lemma is supplemental.14.19's source theorem assumes every boundary point simple; the current Jordan-domain statement is the converse corollary discussed in14.20(a). These initial flags remain open until canonical IDs, statements/demos, and incoming dependencies are repaired and tested.

Runtime follow-ups: chapter9's two derivative-mode KaTeX failures were corrected and the subsequent9.2 light/dark cases passed. The chapter10–11 sweep produced46passing groups; its other four cases were two attempts to mount a non-visual definition(10.19) and two test errors assuming a3Dstage had a2Dhandle array(11.8). The runner now filters non-visual definitions and handles3Dstages separately. The12–13run passed10/12;12.13's transient missing-constant error during cleanup and the same3Dtest assumption were fixed, and its fresh light/dark rerun passed2/2. Additional real3Drotation coverage is now running for11.8and12.13.

Chapter14repair update: canonical14.11(Koebe examples),14.12(b)(odd roots),14.13(area),14.14(coefficient/quarter),14.15(omitted-set diameter), and14.17(nonsimple slit examples) now follow the inspected source. The prior growth/distortion and compactness entries are retained under editorial14.14aand14.15a with flags still open. The old14.17boundary lemma moved to14.17a; a complete reflection/identity-theorem proof now cites11.14and10.18, and its quantitative demo explicitly normalizes|f|≤1. Uninspected Gronwall1914/Bieberbach1916 priority annotations were removed.14.16now retains the book's simply-connected setting;14.19now states the actual all-boundary-points-simple theorem and presents Jordan boundaries as the separate14.20(a)corollary. These close seven of the nine initial chapter14flags; **87initial RCA checks now closed,50remain**, including the two supplemental results. The remaining batches are15–20. The chapter14native run is in progress.

Chapter15: full statements and proofs inspected for15.12(p.304),15.13(pp.304–305),15.14(p.305),15.15(p.306),15.19(pp.308–309),15.22(pp.310–311),15.23's corollary and15.24(p.312). All eight initial source checks closed with precise locators. The too-many-zeros corollary now forbids repeating a zero beyond its multiplicity; otherwise a single zero repeated indefinitely would falsely force the function to vanish identically. The ideal theorem now explicitly handles components where every generator vanishes identically and ignores identically-zero generators when specifying finite multiplicities. **95initial RCA flags closed;42remain.** Native controls pending for this batch.

Chapter16: full relevant passages and proofs inspected for16.5–16.6(pp.321–322),16.10(p.324),16.12(p.325),16.14(p.326),16.16(p.327),16.17–16.20(pp.328–331), and16.22(p.332). All eight initial source flags close; **103initial RCA flags closed;34remain**, including the two supplemental chapter14results. The modular definitions, fundamental-domain theorem and modular function were shifted: they now occupy17,19and20respectively, with the actual16.18definition separated and the actual16.16counterexample to unrestricted monodromy restored. The fundamental-domain proof now usesσ τ^-n/σ^-1τ^-n comparisons: translations alone do not change height and cannot imply the claimed circle inequalities. Uninspected Hadamard1892/Picard1879 priority dates were removed. Controls for this batch remain pending.

Chapter17alignment findings (not yet closed): full source17.1–17.12(pp.335–341),17.18–17.24(pp.345–351) shows more shifted identities. Current17.2definition belongs17.1; current17.3convex-composition theorem belongs17.2; actual17.3is logarithmic/power subharmonicity. Current17.8quotients and17.9N-boundary-limits belong the discussion17.19; current17.10division-by-Blaschke belongs17.9; actual17.10is the zero-freeH2factor.17.12shouldbe the H2coefficient characterization; current integral-representation entry is a clause of17.11. Current17.18boundary-exponent improvement is a consequence of factorization, while actual17.18is nonvanishing a.e. Current17.23conjugate-function definition belongs17.24; actual17.23identifies the cyclic subspace generated by a function. Current17.24positive-real-part lemma is supplemental. Canonical and lettered editorial splits must be repaired before these flags can close.

Chapter17 repair completed: canonical17.1/2/3,17.8/9/10/11/12,17.18,17.23 and17.24 now follow the complete source; displaced supplementary discussions occupy lettered IDs with explicit locators. Theorem17.11 includes the nontangential maximal assertion as well as boundary convergence; its missing prerequisite11.25 has been restored from the full statement/proof on pp.244–245. Beurling17.21 is restricted to the actualH2 scope. Uninspected Hardy1915,Beurling1949 andKolmogorov1925 dates were removed. All14initial chapter17 flags close: **117initial flags closed,20remain**. Seven independent mathematical groups pass, including the cyclic-approximation error against an independent least-squares normal-equation computation. Native chapter17 controls passed **36/36light/dark groups** with realKaTeX.

Chapter18: complete Definitions18.1 and discussion18.2(pp.356–357),18.3–18.7and all proofs/corollaries(pp.357–360),18.8–18.11(pp.360–362),18.12–18.17including all quotient-norm arguments(pp.362–365), and18.21with full proof(pp.367–368) were read. Existing identities were shifted: definitions18.2→editorial18.1a; combined spectrum/radius18.5→18.9; ideal definitions18.10→18.12; maximal-ideal18.11→18.13; closure18.12→editorial18.13a. Missing canonical18.2,18.5,18.6,18.8,18.10,18.11,18.14and18.15 are restored. The closed-subalgebra holes theorem and its topological lemma occupy editorial18.10b/a; their complete source is RudinFA2nded10.18(b)and10.16(pp.256–257), inspected by the FA reviewer, with the full arguments also checked here. The narrower inversion estimate now presents the full source radius and denominator before its half-radius corollary. The Gelfand theorem's clauses match the source, with the converse maximal-kernel fact explicitly a consequence. Uninspected Gelfand1938/1941 andWiener1932 priority dates were removed. These close all12initial chapter18flags: **129closed;8remain** (chapter19three,chapter20three,andtwo chapter14supplementals). Browser controls for chapter18 are pending.

Chapter19: complete19.1(pp.371–372),19.5–19.9(pp.377–379) were inspected. The old19.5combined derivative/quasi-analytic definitions now occupy19.6, with the actual19.8definition separated; the old19.6analytic-strip theorem moves to19.9. The missing19.5motivation and19.7algebra theorem are restored.19.9now explicitly includes boundedness on strictly narrower strips;19.1no longer infers holomorphy from absolute convergence at an isolated boundary point. The24-order derivative display explicitly labels its grid supremum estimates and does not claim that finitely many orders prove membership; a Cauchy-estimate argument supplies the flat function's Gevrey2 bound. All three initial chapter19flags close.

Chapter20: Lemmas20.2/3and Theorem20.4, with every proof step(pp.387–390), were read.20.2now follows the source's omitted-set bound14.15 and contour definition ofb, with the5r and maximum-principle estimates made explicit. The unsupportedTietze1915priority annotation was removed. These close all three initial chapter20checks. **135of137initial RCAflags closed; only the two editorial chapter14supplementals remain open.** Chapter18controls passed36/36groups, including the newly restored11.25, with realKaTeX and native ranges/options/pointer drags in both themes. Chapters19–20controls and final visual inspection remain in progress.

Chapter14 supplements closed against the complete *Introduction to Univalent Functions*,spring2015lecture notes ([fullPDF](https://integraali.com/courses/univalent_functions/unis2015.pdf)), SHA256`7b60c21ec7f13bb8409f65a1c7480d4571e6c227d4c603423123a41867ee3058`. Read full Theorems5.1–5.3and proofs(pp.17–21) and Corollary5.5with proof(p.22). These exactly cover the growth/distortion bounds and compactness of normalizedS; they are explicitly cited as editorial supplements, **not** Rudin14.14/15. The notes' normalization argument, the radial integration for distortion, and the lifted-segment lower-growth argument were checked. Our compactness proof uses$ f_n(z)-f_n(a)$ in the Hurwitz step; it does not repeat the notes' apparent$f_n(z)-f(a)$typographical error. **All137initial RCA source flags are now closed**, with numbering restorations and unsupported historical dates handled as described. This is source completion only: final runtime, visual, whole-project integration and human-sample gates remain separate.
