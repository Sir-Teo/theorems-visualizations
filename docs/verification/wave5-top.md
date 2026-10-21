# Wave 5 — Topology chapter 5

All15 frozen IDs top-5.1–top-5.15 are authored in ch05.js,ch05-b.js,ch05-c.js, with chapter-local pure routines in ch05.shared.js. Work occurred only in the isolated shipping worktree. Only chapter5 syllabus rows/summary were reconciled. No shared runtime, generated data, global ledger, old-source flags or Git operations were changed by the author.

## Source research and mathematical scope

Actual author/university texts retrieved:

- [Paul Bankston, A First Course in Topology](https://www.mssc.mu.edu/~paul/Paper/112042text.pdf), §§16–17: T1-inclusive regular/normal convention, hereditary/product properties, metrizable normality, countable-base consequences, metric equivalences, Sorgenfrey examples and countable trimming. Relevant theorem/example numbers are recorded on each item.
- [Aleksis Koski, General Topology](https://atkoski.fi/topology.pdf), §2.1.1 Theorem2.4 and §2.2.1 Theorem2.7 for sequences/continuity; §4.1–4.2 for separation/countability; AppendixA for examples. The local long-ray construction was read, but its claim that the **open** long ray is sequentially compact is not used: a sequence approaching the removed initial point refutes that claim. Our5.14 explicitly defines the two-sided line from two **closed** rays and proves the properties for that convention.
- [Robert Freiwald, Ordered Sets, Ordinals and Transfinite Methods](https://www.math.wustl.edu/~freiwald/ch8.pdf), ChapterVIII §8, especially Corollary8.5: bounded countable ordinal sequences and sequential compactness.
- [Hart's Delft set-topology preliminaries](https://fa.ewi.tudelft.nl/~hart/37/onderwijs/old-courses/settop/preliminaries.pdf), Exercise17 and surrounding ordinal/countability material. The countable-union fact uses the usual ZFC setting.
- Munkres2nd ed. §§20–21,24,30–32 remain the syllabus cross-reference. The independent reviewer additionally checked the actual Munkres passages, including the long-line exercise. Statements and explanations here are original derivations/paraphrases, not copied proofs.

The syllabus's assertion that every metric space enjoys **all** countability axioms was corrected. Every metric space is first-countable and normal; the stronger global countability properties are equivalent to separability/Lindelöfness in the metrizable category and can all fail. The Sorgenfrey example shows that separability alone is insufficient outside it.

First countability is not attached to the wrong ordinal endpoint: [0,ω1) is first-countable, while ω1 in [0,ω1] is not. The long line, closed ray and open ray are explicitly distinguished. Connectedness of the long line uses its dense order and bounded-supremum property, hence the actual linear-continuum dependency top-3.2. Countable initial intervals give local real charts; a closed ray supplies the sequentially-compact/noncompact obstruction to a global metric. No finite diagram pretends to enumerate countable ordinals or draw an uncountable line in R.

The normality counterexample uses an elementary open-trace counting argument instead of silently using the later Tietze extension theorem. If the Sorgenfrey plane were normal, each subset A of its closed discrete antidiagonal would admit disjoint open neighborhoods UA,VA of A and its complement. Different A give distinct traces UA∩Q², by density and the disjoint VA. This contradicts Cantor because there are2^c subsets but only c subsets of countable Q². The factor's Lindelöf proof and5.11 establish its normality; dependencies point to the already written Cantor/continuum results, not future material.

The uncountable-product sequence obstruction uses finitely supported points approaching the all-ones point in closure. Every proposed sequence has a countable union of supports, leaving a coordinate outside that entire union. The countable product uses a summable metric with exact tail2^−N; box/uniform topologies are excluded. The displayed12-coordinate weighted bars are scaled by2^N for visibility, while the readout reports unscaled distances and the exact undisplayed tail.

## Finite computational models

Every item has a distinct interactive construction/readout. Rational-ball and half-open-interval witnesses are found by a denominator search and satisfy strict inequalities. Finite set masks enumerate actual open families, minimal neighborhoods, products and subspaces. The three-point separation audit acknowledges that every finite T1 space is discrete; infinite cofinite N is a separately labelled example. Its maximum deletion prefix leaves9 in both open sets.

The metric separator uses true distances to two explicit finite closed sets. Its sampled color grid and marching contours are distinguished from an exact continuum boundary; exact probe distances verify the denominator. The theorem does not assume disjoint closed sets are uniformly separated. Compact-Hausdorff selections and countable trimming compute open interval unions/intersections and subtraction of closed intervals; hollow endpoints are excluded rather than silently filled. Empty-set cases are stated in the theorem proofs.

The ordinal preview uses a specified increasing sequence ωk+n and its countable supremum, with all terms on the limit marker's row. The long-line limit-seam chart maps the nth preceding block onto[−2^−n,−2^−n−1), joining at0 to the ω block; the finite drawing is explicitly a prefix of this formula. No synthetic observations or data appear.

## Focused mathematical checks

`PATH=/tmp/atlas-ci-node22-20261020:$PATH node --test tests/wave5-top.test.mjs` passes **15 groups**:

1. Strict rational disk containment for hundreds of positions/denominators.
2. One-sided rational witnesses and eventual nested-base membership; cofinite endpoint witness.
3. All29 labelled three-point topologies independently enumerated by union/intersection closure; minimal neighborhoods and all four separation classifications agree.
4. Dense-point and basis-to-cover extraction on every such finite topology.
5. Product opens independently generated from rectangles, then every nonempty subspace for all6 offered factor combinations.
6. Interval union/intersection/closed-subtraction membership checked independently, including removed endpoints.
7. True disjointness and point coverage for all compact-pair and alternating-trimming prefixes.
8. Metric separator distances, triangle-inequality denominator bound and distance-function Lipschitz inequality.
9. Exact antidiagonal/basic-rectangle corner logic across all offered corners/widths.
10. Ordinal pair ordering and compressed finite successors below the specified supremum.
11. Local chart inverses and exact adjacent dyadic seam joins.
12. Independent infinite geometric-tail sums and triangle inequality across all triples of a5-dimensional binary cube, plus nonbinary truncated distances.

13. Negative subnormal limit-chart inputs retain finite valid block coordinates without underflow.
14. Successor-seam rounding to an excluded endpoint is explicitly identified by a flag and readout.
15. All1074 binary powers and adjacent nonzero binary64 values are classified by exact dyadic comparisons, avoiding log2 boundary rounding.

Scoped static: **15 items,0 errors,0 warnings**.

## Browser acceptance

Both light and dark native all-mode harness runs pass all15 items: no runtime, TeX, blank or quality warnings. All64 default/mode captures were personally inspected via contact sheets; geometry, contrast and meaningful mode changes are clear. Final5.5 toggle hides the irrelevant point/radius controls;5.7 reveals its deletion-prefix control only for infinite cofinite N.

The actual strict-built production runner tests1200/320 in both themes, every visible Home/End control including newly revealed controls, modes and toggles, whole marker rings, axis labels, statement/proof/caption/scope text against inner padding, displayed formulas, off-grid raw replay and visible rejection of fractional integer state. The initial run passed57 groups, stopping at an actual5.15 narrow formula overflow; its metric now uses a separately defined coordinate distance to fit. After root rebuilt source-aligned JSON, final affected5.5/5.8/5.14/5.15 passed16 production groups,212 actions and24 replays, minimum full-marker-ring clearance10.8214CSSpx. The final raw dyadic-boundary robustness refinement is separately covered by the15th math test and independent reviewer native replay. Actual production mobile default captures for all15 in both themes, complete statement/scope and proof captures, and the final discrete toggle/product/uncountable modes were personally inspected and are clear. The final run also explicitly exercises the simultaneous chain×chain factor mode in5.8.

Final5.15 bar opacity is explicit0.6 for readable primary data in dark mode. Its final four production theme/width groups pass32 actions and8 replays; both mobile captures were personally inspected. Source/model bytes frozen; source-aligned final production checks pass. Independent reviewer ACCEPTED in `docs/verification/wave5-top-review.md`: primary sources/hypotheses and independent model oracles pass;20 production groups/144 actions/32 replays plus6 actual320 boundary Share states pass. All30 narrow defaults and final dark-bar/formula/boundary captures inspected, no findings remain. Source remains frozen. Evidence: `shots/top-5*.png`, `/tmp/wave5-top-production/`, runner `tests/wave5-top-browser.mjs`.
