# Functional Analysis, chapters1–4: source alignment

Reviewed2026-10-18 against the complete second edition of Walter Rudin, *Functional Analysis* (1991). Original full book: https://59clc.files.wordpress.com/2012/08/functional-analysis-_-rudin-2th.pdf . Local PDF/text: `/tmp/atlas-rudin/fa.pdf`, `/tmp/atlas-rudin/fa.txt`. Read the complete numbered statements, adjacent definitions and proof arguments at the pages listed below; OCR comparison was performed against the full book, not abstracts or snippets. Paraphrases remain in the atlas's own wording.

All28 pre-existing flags in chapters1–4 are now closed. The original review closed25 book-content flags; the root follow-up below resolves the three optional historical annotations. Mazur’s normed-space antecedent is now checked in the complete original, while the unsupported Pettis annotation and unresolved Riesz year are removed. The table and initial source attempts below preserve the audit history.

## Alignment ledger

| Atlas ID | Printed source | Disposition |
|---|---|---|
|1.4|§1.4, pp5–6|Convexity, real/complex balance and algebra checked. Qualified nonempty-set characterization of real balance. Closed.|
|1.6|§1.6, pp7–8|Rudin includes closed singleton axiom, joint operations and dilation-based boundedness. Closed.|
|1.7|§1.7, pp8–9|Invariance proposition and local-base consequence match. Closed.|
|1.11|Theorem1.11, p11|Local-base member contains closure of another; proof via1.10 matches. Closed.|
|1.12|Theorem1.12, p11|Hausdorff conclusion uses singleton axiom; corrected ancillary claim to a seminorm with nontrivial kernel (a norm itself is Hausdorff). Closed.|
|1.20|Lemma1.20, p16|Every complex-linear map from C^n to a complex TVS is continuous. Coordinate proof and example bound match. Closed.|
|1.23|Theorem1.23, p18|Locally bounded plus Heine–Borel implies finite dimension, via bounded closure/local compactness. Closed.|
|1.26|Theorem1.26, p21|**Wrong result replaced.** Rudin's dilation principle concerns a continuous expanding map from a closed subset of a complete metric space and its closed image. Former invariant-metric equivalence was the preceding unnumbered §1.25 observation; it is now included there. New graph/arctan/incomplete-domain demonstration. Closed.|
|1.42|Theorem1.42, p32|**Wrong subject corrected.** Closed N plus finite-dimensional F has closed sum N+F. Existing corresponding demonstration had been mislabeled1.43; moved to its correct ID. Closed.|
|1.43|§1.43, pp32–33|**Wrong subject corrected.** Quotient by N=ker p turns a seminorm into a norm with pbar(πx)=p(x). Former arbitrary-subspace infimum model did not represent this section; replaced with kernel/coset demonstration. Closed.|
|2.9|Theorem2.9, pp46–47|Pointwise-bounded family on compact convex K is uniformly bounded on K; Baire/convexity proof and nonconvex counterexample checked. Closed.|
|2.10|§2.10, pp47–48|Open-at-point definition and linear reduction to origin checked. Closed.|
|2.13|§2.13, p50|Graph definition/product topology and linear-subspace observation checked; no visualization required for this definition. Closed.|
|2.16|§2.16, p52|Bilinear/separate continuity checked. Ancillary reference to2.17 now includes other factor's metrizability, and inner-product example is restricted to real spaces. Closed.|
|3.1|§3.1, pp56–57; §1.47, pp36–37|Continuous dual checked. Trivial-dual example corrected from unrestricted Lp to Lebesgue Lp[0,1] for0<p<1; atomic ℓp is not such an example. Closed.|
|3.8|§3.8, pp62–63|Induced topology, Hausdorff separation and compact-topology rigidity checked. Added omitted countable-separation metrization consequence and convergent-series metric argument. Closed.|
|3.13|Theorem3.13, p67|Metrizable locally convex, weak convergence gives original-topology convergence of finite convex combinations. Removed “norm” from title since no norm is assumed. Book content checked; Mazur1933 original priority remains flagged.|
|3.24|Theorem3.24, p76|**Wrong result replaced.** Compact K need not be convex: K⊂closedcoE(K), equivalently equality of the closed hulls. Former entry repeated a step of3.23's proof. New finite nonconvex K demo carefully distinguishes hull vertices from all extreme points of nonconvex K. Closed.|
|3.26|Definition3.26 and remarks, pp77–78|Weak integral defined via all continuous scalar functionals; separating dual gives uniqueness. Removed Pettis label from title because this single-domain definition does not explicitly require integrals over every measurable subset. Book content checked; Pettis1938 priority remains flagged.|
|3.29|Theorem3.29, p81;3.27, pp78–79;3.20(c)|Banach norm bound checked. Entry also states existence in a Fréchet space, supplied by3.27/3.20(c); finite positive measure assumption explicit. Closed.|
|4.1|Theorem4.1, pp92–93; notation4.2|Corrected kind Definition→Theorem. Operator-norm completeness requires Y complete, with no completeness assumption on X. Closed.|
|4.12a|Corollaries following4.12, p99|Weak*-closed adjoint kernel, dense range iff adjoint injective, and injectivity iff adjoint range weak*-dense all match. Letter suffix correctly denotes the unnumbered corollaries. Closed.|
|4.17|Definitions4.17, pp103–104|Banach-algebra invertibility, spectrum/eigenspace and open-mapping implication checked. Closed.|
|4.20|Definition4.20, p106|Complement requires both closed subspaces; direct sum definition checked. Closed.|
|4.21|Lemma4.21, p106|Finite-dimensional case requires local convexity; finite-codimensional case does not. Proof by extended coordinates/quotient basis checked. Closed.|
|4.22|Lemma4.22, p106|Restored source's nondense M hypothesis, which does not require M closed; proof chooses x outside closureM. Fixed the r=1 readout and representative-slider endpoints so strict inequalities are not falsely asserted. Book content checked; original lemma also read (see below), publication-year detail remains flagged.|
|4.23|Theorem4.23, p107|Corrected kind Lemma→Theorem. Nonzero λ and compactness essential; complemented-kernel/bounded-below argument matches. Added dependency1.26 for closed expanding images. Closed.|
|4.24|Theorem4.24, pp107–108|Both non-surjectivity at nonzero eigenvalues and finiteness outside a positive-radius disc checked against full invariant-subspace/compactness proof. Closed.|

## Dependency audit

The declared IDs/URLs remain identities of their numbered Rudin results. No source item depends on the formerly mislabeled1.42/1.43 or metric-equivalence1.26. Existing opt/cg/algo links to3.24 use its compact-convex special case, which follows from the corrected theorem; they remain meaningful. The FA5–13 reviewer was notified of all four changed subjects. The former useful invariant-metric observation is retained in1.25. No new theorem numbering was invented.

## Validation

`node tests/verification-fa.test.mjs`: four tests execute the real replacement visualization callbacks. They independently check expanding graph distances and missing image limits; invariance of the quotient norm under kernel translations; finite-set convex-hull containment with extreme generators under point drags; and strict Riesz admissibility at both slider endpoints, with the excluded r=1 case explained.

Static check:106 items in FA chapters1–4, zero errors/warnings. Real-browser controls, light/dark and pointer results are recorded by `tests/verification-fa-browser.mjs` in `/tmp/fa-verification-browser.json`, with screenshots in `/tmp/fa-verification-shots/`. All50 item/theme cases pass, including142 slider endpoint sweeps and34 real pointer drags. All50 screenshots were visually inspected in light/dark contact sheets. The three definitions2.10/2.13/2.16 have no viz and are covered by source/static review.

## Historical-source follow-up

- Riesz, *Über lineare Funktionalgleichungen*, Acta Mathematica41,71–98, full original scan: https://history-of-approximation-theory.com/fpapers/rie1.pdf . Read the complete relevant §1 opening through Hilfssätze1–2 and their proofs, pp71–76 (serial OCR, first six pages, plus visual formula inspection). The paper works in continuous functions with the sup norm; p76 explicitly allows every separation constant below1 and explains why1 cannot generally replace it. This verifies the attribution and mathematical antecedent. The handwritten cover gives1918, while publisher search metadata labels the paper1916; the scan's annotation alone does not resolve publication chronology. The4.22 flag is retained for that narrow year question.
- Pettis original AMS full PDF https://www.ams.org/journals/tran/1938-044-02/S0002-9947-1938-1501970-8/S0002-9947-1938-1501970-8.pdf returned403; no abstract substituted for its definition.
- Mazur's1933 Studia Mathematica4 original was sought, but the publisher's volume index https://www.impan.pl/en/publishing-house/journals-and-series/studia-mathematica/all/4 returned a proxy403 and no verified original was read. Search snippets and a different later paper were not used for closure.

## Missing canonical theorem restored

The FA chapter 12 reviewer found a dependency on actual Rudin Theorem 3.32, absent from the atlas's original Chapter 3 coverage. Restored `fa-3.32` in `ch03-a5.js` after reading the full statement and proof on pp. 84–85: weakly holomorphic entire map into a complex TVS with separating continuous dual, and weakly bounded image, imply constancy. Completeness/local convexity are not required. The proof applies scalar Liouville to every functional, then separation of points. This adds one canonical item rather than renumbering any existing result. The C² polynomial probe demonstration explicitly distinguishes bounded discs from the whole-plane hypothesis. `tests/verification-engineering.test.mjs` independently checks its exact scalar circle maximum and Cauchy coefficient bounds across 27 parameter combinations. Native light/dark checks pass in `tests/verification-engineering-focus-browser.mjs`, with all three slider endpoints and constant/nonconstant readouts checked in both themes; screenshots were inspected.

## Root follow-up: all 28 original flags now closed

The three retained flags above were resolved after the original reviewer confirmed no remaining mathematical issue beyond the optional historical annotations.

- **3.13:** The complete original Mazur paper was obtained from the official ICM archive: https://matwbn.icm.edu.pl/ksiazki/sm/sm4/sm4113.pdf, SHA256 `64c5e9720430ae828becd650ed07535deae6fb0bfa82b38bf281678cbc491df1`. Read the introduction pp.70–71, the separating-hyperplane argument pp.73–74, and the complete §2 definition, Satz3 proof and consequence11 pp.80–81. The displayed source formulas were visually checked on the original scan. The original proves the normed-space antecedent; Rudin supplies the metrizable locally convex formulation used by the card. Credit and references explicitly distinguish them. The official publisher's Volume4/1933 record confirms the year: https://www.impan.pl/en/publishing-house/journals-and-series/studia-mathematica/all/4/1/93066/uber-konvexe-mengen-in-linearen-normierten-raumen .
- **3.26:** Removed the unsupported Pettis1938 annotation and the stronger Pettis-integral tag. The card already states and names Rudin's weak integral definition, fully checked above. The inaccessible original is not claimed as inspected, and this does not establish a historical priority claim.
- **4.22:** Retained the Riesz attribution verified in the complete original above, and removed the unresolved publication year. The mathematical statement remains exactly the checked Rudin lemma.

No visualization algorithm changed in this follow-up. The original50 native theme cases and independent replacement-model tests remain applicable; the complete global mode sweep supplies fresh runtime evidence separately. Historical-source attempts remain recorded above as an audit trail, not as active mathematical uncertainty.
