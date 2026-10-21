# TOP 5 independent review

Status: **accepted**. All 15 frozen TOP5 items pass independent source/model review, final production/native replay and visual inspection. No outstanding content findings or source uncertainty flags.

Reviewer: wave5_reviewer. No content changes by the reviewer.

## Source checks

Independently read Munkres, *Topology*, second edition, §§30–32 and exercise 24.12 on the long line. Checked against the author's primary course references [Bankston §§16–17](https://www.mssc.mu.edu/~paul/Paper/112042text.pdf) and [Koski §§2.1.1,2.2.1,4.1–4.2](https://atkoski.fi/topology.pdf). Munkres includes T₁ in regular/normal; finite examples must use the stated convention. Metric first countability does not imply second countability. Infinite-product, ordinal and antidiagonal claims require infinite arguments separate from their finite diagrams.

First five item statements and proof ideas pass the initial read. Requested a pinpoint citation improvement: the sequence/closure and sequential-continuity claims in 5.2 are Koski Theorems 2.4 and 2.7, rather than only §4.2.

## Independent finite checks

Executed `/tmp/wave5-top-review-oracle.mjs` with Node 22. The reference oracle enumerates open and closed sets as arrays of point labels, and searches all open-set pairs to test separation; this is independent of the author's bitmask separation routine.

- All 29 topologies on three labelled points: T₁, Hausdorff, regular and normal classifications agree.
- All 203 nonempty subspaces and 29 products with a two-point chain: classifications agree with independent exhaustive open-set searches.
- 1,000 rational-ball states across angles, distances and denominator seeds: rational center/radius identities, strict point inclusion and strict containment in the outer ball all pass.
- All six finite compact-separation/staircase constructions: coverage and disjointness pass direct interval checks. These checks establish only the displayed finite constructions.

## Findings resolved during authoring

- The infinite cofinite example's largest deletion setting excluded its advertised common witness 9. The author capped that setting at 7, so 9 is strictly above both finite deletion prefixes.
- Item 5.13's ordinal sequence used alternating decorative rows while its limit marker sat between them. All terms now share the marker's row, so the plotted horizontal convergence is coherent.
- Item 5.14 now explicitly verifies dense order and the bounded-supremum property, making the linear-continuum prerequisite's role in connectedness explicit.
- Item 5.2's source reference now points to the actual sequence and sequential-continuity passages.

All 15 statements and proof ideas have now been read. In particular, regular/normal use an explicit T₁ convention; the Sorgenfrey antidiagonal argument uses the cardinality of all its subsets; the ordinal arguments quantify over the entire sequence; the long-line convention is distinguished from long rays; and the uncountable-product obstruction chooses a coordinate outside the union of all sequence supports. None of those infinite conclusions is inferred from a finite sketch. Final native/visual acceptance is recorded below.


## Final rounding, native and visual checks

The final long-line helper corrects its logarithmic block estimate using actual power-of-two comparisons. The independent `/tmp/wave5-top-review-chart.mjs` checks **2,148** exact dyadic powers and adjacent binary64 values through the smallest subnormals; every limit-seam block and internal coordinate is valid. A tiny negative successor coordinate can round to the excluded endpoint; the readout now explicitly reports that loss of numerical distinction rather than representing it as an exact interior point. The author's final **15 mathematical groups** were independently rerun and pass.

After source freeze, the reviewer executed the bounded existing production runner on 5.5, 5.7 and 5.13–5.15: **20 actual 1200/320px light/dark groups, 144 real native actions and 32 off-grid/malformed replay checks pass**. Full dot/ring clearance is at least **9.865 CSSpx** beyond the marker extent. Formula/rich-text bounds, visible scope, axis labels and native/model values pass. Evidence: `/tmp/wave5-top-independent-native.log`. This includes revealed/deactivated control states and the split 5.15 metric formula.

All 30 narrow production default visualizations were independently inspected at their full-size contact-sheet scale. Rational witnesses, finite topologies, subspaces, metric separators, interval trims, the antidiagonal, ordinal sequences and long-line charts are legible. The initial dark 5.15 weighted bars were too faint; explicit opacity 0.6 now makes the primary data clear. The final both-theme author rerun for 5.15 passes 4 groups, 32 actions and 8 replays; the reviewer inspected the new dark bars and the complete narrow statement/scope capture. Infinite claims remain expressly separate from finite diagrams.


A separate final production Share-link check passes **six** actual 320px states with the page theme explicitly asserted: tiny-negative successor coordinates, the smallest negative subnormal limit coordinate and the dyadic next-float boundary, each in light and dark. Recreated Share links preserve the exact model value. Native range serialization differs by one rounding unit for one adjacent dyadic value; the comparison allows only that binary64 serialization tolerance, while the captured model value is checked exactly. All six final captures were inspected. Utility: `/tmp/wave5-top-review-replay.mjs`; captures: `/tmp/wave5-top-review-boundary-*`.

No content corrections remain. Author source/model bytes are frozen. The author and coordinator retain ownership of integration/generated data; the reviewer changed only this scoped report.
