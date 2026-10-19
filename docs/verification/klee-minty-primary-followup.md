# Klee–Minty original and explicit coefficient comparison

Read the complete original chapter, *How Good Is the Simplex Algorithm?*,
Inequalities III (1972), pp. 159–175, from
[this library scan](https://sophie.huiberts.me/files/Klee-Minty-How-Good-Is-the-Simplex-Algorithm-1970.pdf).
The filename says 1970; the [scan description](https://sophie.huiberts.me/scans/)
identifies the published 1972 proceedings chapter. The scan contains nine
two-page images; p. 158 belongs to the preceding chapter. All 17 relevant
pages were read through serial-per-image OCR; pp. 162–163 and 172–173 were
also inspected as rendered images to check the crucial formulas.
PDF SHA256:
`a149f8f54b0f2225b65d154175d902e8132bf70cb0551c4d151a5b06b7e87c64`.

Section 4, pp. 162–164, constructs a tilted cube and its reflected path.
Section 7, pp. 170–174, defines Dantzig's rule using nonbasic gradients and
proves the doubled-path recurrence for that rule, Eq. (29). Section 8
distinguishes worst-case from practical experience. The atlas's concrete
10/100 coefficients are an explicit scaling, not the original's literal
printed coefficients; the item now states that distinction.

## Exact correspondence for every dimension

Use one-based indices and set `B_i=100^(i−1)`, `u_0=0`, and

`u_i = x_i/B_i + 0.1 u_(i−1)`.

Equivalently, `B_i u_i = sum_(j≤i) 10^(i−j) x_j`.
The displayed nonnegativity and upper inequality become exactly

`0.1 u_(i−1) ≤ u_i ≤ 1−0.1 u_(i−1)`.

The objective is `B_n u_n`. Thus the feasible region is the original
epsilon-cube on p. 163 with epsilon 0.1, under an invertible triangular
linear transformation. All its intervals have positive width (at least 0.8),
so its vertices are indexed by independent lower/upper choices `b_i∈{0,1}`.

It is not enough to match the polytope: variable/slack scaling affects the
largest-coefficient rule. Write `s_i=1−2b_i`. At a vertex, the nonbasic
variable for facet pair i is either `x_i` or its upper-inequality slack,
both measured with scale `B_i`. Increasing it gives `du_i/dg_i=s_i/B_i`;
holding all downstream active facets fixed gives
`du_j/du_(j−1)=0.1 s_j`. Consequently the objective's nonbasic gradient is

`(product_(j=i..n) s_j) 10^(n−i)`.

The positive gradients have distinct magnitudes. Dantzig therefore flips
the smallest-index facet with positive suffix sign. Starting at all zeros,
it traverses the first n−1 dimensions while `b_n=0`, flips `b_n`, then
traverses the lower-dimensional path in reverse because all its objective
gradient signs reverse. The same argument for the reversed objective shows
the required symmetry inductively. Thus `T(1)=1`,
`T(n)=2T(n−1)+1=2^n−1`, with every vertex visited exactly once.
The final vertex has `u_n=1`, so its objective is the maximum `B_n`.
The greatest-increase rule reaches it directly along x_n from the origin.

This derivation establishes the displayed coefficient family for all n;
finite tests are a separate implementation check. The existing regression
now covers every displayed dimension 1–7, checks all 254 visited states
across those runs, unique vertex choices, adjacency and the independently
derived gradient selection, plus agreement with the one-pivot solution.

## Disposition and validation

`algo-11.22` is closed against the complete original plus the explicit
all-dimension transformation/gradient proof above. Written and syllabus
references now point to the exact original sections. The correction makes
the provenance clear without replacing or weakening the theorem. Numerical
code and interaction are unchanged.

The computing regression suite and focused static check pass. Strict build,
source census and current human-review worksheet are regenerated for this
commit. Source closure does not claim a new whole-atlas browser pass or any
actual human review/listening credit.
