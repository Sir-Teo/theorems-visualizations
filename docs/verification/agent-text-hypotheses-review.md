# Statement and caption corrections from the agent sample

Nineteen sampled pages had overstatements or omitted qualifications that
can be resolved from their mathematics and displayed models. These changes
do not claim new original-source acquisitions or close source flags.

| Page | Correction |
|---|---|
| alg-3.23 | Agreement at one exponent need not imply commutativity; agreement for every displayed exponent does. |
| comb-3.8 | Justify the limiting inclusion–exclusion sum with fixed Bonferroni bounds, then increase the truncation. |
| qm-2.14 | Parenthesize the quantization-condition denominator K√(−2mE). |
| rca-9.10 | L∞ convergence can fail at a jump; it does not fail for every discontinuous representative. |
| ml-3.2a | The finite risk grid approximates the continuous distribution; its risk is not an exact integral. |
| music-8.11 | The interval vector is an invariant, not a complete identifier of a set class. The historical source flag remains. |
| vcalc-1.3 | A vanishing cross product means linear dependence, including zero vectors. |
| opt-4.3 | Slack equalities preserve convex standard form only for affine inequalities. |
| polsci-5.10 | State equal competence and growth along odd jury sizes, matching the plotted probabilities. |
| pl-4.8 | At most one candidate type passes; an ill-typed term has none. |
| toc-3.14 | Token expressions must reject the empty word so successful scanning advances. |
| algo-3.3 | Record indicators in a uniform random permutation are independent; linearity does not need that fact. |
| mfd-3.8 | Same-dimensional chart changes preserve null sets; arbitrary dimension-changing smooth maps do not. |
| mfd-1.11 | Qualify the analytic-function comparison by connectedness and flatness at a point. |
| ode-1.1 | x′=x² has a maximal interval with a finite endpoint, not necessarily two finite endpoints. |
| graph-4.2.10 | State the simple-graph assumption in the 3n−6 bound. |
| ladr-1.36 | A line and a plane span R³ only when the line is not contained in the plane. |
| prob-4.3.2 | The zero-visit and n compensators described in the caption both assume the unbiased walk. |
| crypto-1.5 | Frequency leakage constrains the substitution but need not uniquely recover it from a short text. |

Several counterexamples make the qualifications necessary. For noncommuting
g,h the product-power identity still holds at n=0 and n=1. Conversely its
n=2 case forces commutativity by cancellation, justifying the corrected
table-wide claim. A function zero except at one point can be discontinuous
as a representative while its L∞ norm and convolution error are zero.
A line segment has planar measure zero but projects onto a positive-length
interval. A line contained in a plane cannot enlarge its span.

For hiring indicators, the relative rank of the ith entry among the first
i entries can be any integer from 1 to i. The sequence of relative ranks
is in bijection with permutations, and there are ∏i = n! such sequences,
so these ranks are independent uniform variables. A record occurs exactly
when its relative rank is i. Independent exhaustive enumeration checked
every record/nonrecord pattern for n=2 through 8; its count equals
∏(i−1), with the product over the nonrecord positions. This confirms the
specific pair-dependence claim in the old explanation was false.

For the ménage limit, the written `comb-3.2` supplies the alternating upper
and lower bounds now used explicitly and is added to the written/syllabus
prerequisites. This is within mathematics and does not change cross-field
counts. Other syllabus pictures were reconciled where they repeated an
overstatement or described the wrong controls, including D4 rather than an
unavailable S3 preset and clock clicks rather than draggable pitch notes.

Validation: strict build, the full regression command, fresh native renders
of all 19 pages in both themes with real KaTeX and no errors or quality
warnings, and graph/source-ledger reconciliation. Five previously inspected
pictures were inspected again after their caption or text corrections.
The source-aware review record preserves each initial finding and records
the correction separately. The full 339-page review is still in progress;
this batch does not certify every interaction, source or audio example.
