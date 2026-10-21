# Brooks, Hajós and edge-coloring follow-up — 2026-10-17

Seven queued reviews are resolved in `content/graph/ch05-a2.js`:
`graph-5.2.4`, `graph-5.2.5`, `graph-5.2.5a`, `graph-5.2.6`,
`graph-5.3.1`, `graph-5.3.2`, and `graph-5.3.3`.
Existing dependencies and prior edits were preserved. No central queue, master
plan, package, shared toolbox or shared test file was changed by this batch.

## Primary sources and exact anchors

Reinhard Diestel, *Graph Theory*, sixth edition (2025),
[author Chapter 5](https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch5.pdf),
PDF SHA-256 `d6aa599b28b33ba4ccd8090e7ae53cfad6b30b215d9217d072c7ee8fb338f24d`.
Its supplied author PDF and text were read. Printed page 123 is PDF page 1.

| Atlas ID | Primary anchor | Verified scope |
|---|---|---|
| `5.2.4` | [Theorem 5.2.4, pp. 127–129, PDF pp. 5–7](https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch5.pdf#page=5); Exercise 17, p. 149 | Finite connected simple graph; complete graphs and odd cycles excluded. Book proof uses induction and recoloring. The displayed ordering follows the alternative proof below, with the necessary block reduction. |
| `5.2.5` | [Theorem 5.2.5, p. 130, PDF p. 8](https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch5.pdf#page=8) | Source uses a single integer for both girth and chromatic bounds. The equivalent two-parameter form follows by taking the maximum of the two parameters. The probabilistic proof is checked in Chapter 11, below. |
| `5.2.5a` | [Unnumbered k-constructibility rules, p. 130, PDF p. 8](https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch5.pdf#page=8) | Stable suffix identifies a definition, not Theorem 5.2.5. Disjoint-copy joins followed by identification are equivalent to the source's graphs meeting in their common vertex. Nonadjacent identification and joins preserve non-(k−1)-colorability. |
| `5.2.6` | [Theorem 5.2.6, p. 131, PDF p. 9](https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch5.pdf#page=9) | Contains a k-constructible subgraph iff chromatic number is at least k. It does not say every such whole graph can be reduced to cliques using the forward operations. The recursion's compressed shared labels encode the source's disjoint-copy/identification steps. |
| `5.3.1` | [Proposition 5.3.1, p. 132, PDF p. 10](https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch5.pdf#page=10) | Bipartite simple graphs have chromatic index Δ. Swapping the alternating path from the opposite endpoint is the symmetric version of the source proof; bipartite parity prevents reaching the first endpoint. |
| `5.3.2` | [Theorem 5.3.2, pp. 132–133, PDF pp. 10–11](https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch5.pdf#page=10) | Finite simple graphs, Δ ≤ chromatic index ≤ Δ+1. The displayed fan/inversion/rotation algorithm follows Misra–Gries, below, rather than claiming the book's contradiction proof is its exact code. |
| `5.3.3` | [Theorem 5.3.3, p. 133, PDF p. 11](https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch5.pdf#page=11) | **The book states the weaker condition d ≥ n/2 for sufficiently large even n.** The displayed sharp threshold 2 ceil(n/4)−1 is verified separately in CKLOT's original author paper, Theorem 1.1.1. |

Additional primary sources actually read:

* L. Lovász, [*Three Short Proofs in Graph Theory*](https://www.ime.usp.br/~yw/2017/grafoes/material/Lovasz-3-ShortProofs-in-GT-JCTB75.pdf),
  *J. Combinatorial Theory B* 19 (1975), pp. 269–271. Brooks proof, pp. 269–270:
  nonadjacent pair with connected deletion, and reduction to 2-connected
  pieces. PDF SHA-256
  `7316a86caf0f90da50b7d720c1fa856386812bb2bc254ba63948dd223e73b25c`.
* J. Misra and David Gries,
  [*A Constructive Proof of Vizing's Theorem*](https://www.cs.utexas.edu/~misra/psp.dir/vizing.pdf),
  author-hosted September 1990 preprint, pp. 1–4. Fan invariants F0–F2,
  inversion and the valid prefix/rotation argument match the implementation.
  PDF SHA-256
  `f64ddfd19551f33fa1ef5c598e6428960720b427ba8337d5b5df3a3b818f82ed`.
* Béla Csaba, Daniela Kühn, Allan Lo, Deryk Osthus and Andrew Treglown,
  [*Proof of the 1-factorization and Hamilton Decomposition Conjectures*](https://arxiv.org/abs/1401.4159),
  author preprint v2 (2014). Theorem 1.1.1 and its two sharpness examples,
  printed p. 1 / PDF p. 7. PDF SHA-256
  `aaa1c49adb23fe28f43451a65d5bcb7e71c4a21033430bd7d88d2fdaeb44cfb3`.
* Diestel, [author Chapter 11](https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch11.pdf),
  Lemmas 11.1.2, 11.1.4–5 and 11.2.1, pp. 342–346; Theorem 11.2.2,
  p. 347 / PDF p. 9. Independent-set union bound, exact short-cycle
  expectation, Markov bound and deletion proof checked. PDF SHA-256
  `69d9942aed1d767be7571b051611bcf082f80f83fcf141e4bd9e8eb85d848e66`.

Historical priority/date metadata was removed where this batch did not audit
original historical publications. Conventional names are retained. No proof
has been replaced by finite random sampling.

## Corrections and independent evidence

### Brooks: the last vertex and block reduction matter

Having a later neighbor bounds the colors blocked at each earlier vertex;
it does not by itself handle the last vertex. Its low degree, or two
nonadjacent already-colored neighbors sharing a color, provides the missing
last-vertex argument. The explanation now says this explicitly.

The old regular-graph branch searched for the Lovász pair and otherwise
asserted that breadth-first order was enough. The pair lemma requires
2-connectivity (apart from the explicit cycle case). The dedicated helper
now handles even cycles explicitly and implements a block reduction when
no pair exists. Every proper block of a regular connected graph has a
vertex of degree less than the global Δ; reverse distance order colors that
block within Δ. Permuting colors at its shared cutvertex combines block
colorings. Ordering the resulting color classes then gives a valid greedy
order with at most Δ colors. A cubic graph made from two subdivided K4s
joined at their new degree-two vertices exercises this branch.

All 27,476 connected simple graphs on at most six vertices are independently
enumerated. Greedy outcomes are checked directly for conflicts and the
appropriate Δ / Δ+1 bound. Additional regular families and the explicit
cutvertex example pass. These calculations test the algorithm; Lovász's and
Diestel's proofs support the general theorem.

### Erdős: probabilities, cycle counts and finite grid estimates

The former blue curve plotted the base `b=n exp(−p(r−1)/2)` while the green
threshold tested `b^r`. The two objects could cross the half-probability line
at different positions. Both plotted curves now represent actual upper
estimates: the Markov short-cycle bound and the independent-set union bound
`b^r`. Above-one bounds and clipping to log range [−12,4] are explicit.

The cycle expectation is an upper bound by `sum (np)^i/(2i)`, rather than
an equality. Fewer than n/2 **cycles**, not fewer than n/2 vertices lying on
cycles, is what the expectation controls; deleting one vertex per remaining
short cycle removes fewer than n/2 vertices. The explanation is corrected.
For `r=ceil(n/(2k))`, avoiding independent r-sets means the independence
number is strictly less than n/(2k), giving the required strict chromatic
bound after deletion.

The former first grid hit was described as a proved threshold applying to
all larger n. It is now labeled only the first checked log-scale point.
Green dots identify checked values; no filled interval claims an exact
least n or a certified continuum of valid n. Numerical curves are an
illustration of bounds valid at integer n, not an exact integer-threshold
calculation. The small sample uses its own density and reports its own
outcomes. An undecided chromatic search retains its lower-bound label.

Independent finite-n tests compare the implemented logarithms with exact
falling-factorial cycle expectations and binomial independent-set union
bounds over all offered k, g and representative epsilon values.

### Hajós: subgraph certificate, valid operations, and uncertainty labels

The false whole-graph reduction conclusion is removed. The theorem certifies
a k-constructible **subgraph**. The recursive proof's maximality argument,
virtual added edges, removed join edges and eventual identifications match
the source. Finite checks validate each recipe leaf, each join edge-set
identity, chromatic bounds of intermediate graphs, and final containment.
All four displayed recipes, plus Petersen, are covered.

Joining two K4s does give the abstract seven-vertex Moser spindle; that
identification is preserved. The loose “smallest join” wording is restricted
to the k=4 example. A coloring after identifying nonadjacent vertices pulls
back to the original graph, which is the precise preservation argument.
Readouts distinguish exact chromatic values from lower bounds and avoid the
malformed `chi = >= ...` expression. Actual browser edge selection, joins,
nonadjacent vertex identification, undo and reset all pass for k=3,4,5.

### Edge coloring and sharp factorization

König's partial colorings are checked for incident-edge conflicts after every
recorded action. All sampled bipartite instances complete with Δ colors;
Petersen's displayed failure is independently supported by a completed
three-edge-coloring exclusion. Misra–Gries's partial frames likewise retain
proper edge colors throughout fan creation, path inversion and rotation.

The Δ+1 algorithm is not an optimization algorithm. On the offered cube it
uses four colors although the minimum is three. The caption now says this,
and the readout separately certifies the small graph's minimum using an
independent exact edge-color search; a budget stop remains undecided.

For factorization, two odd cliques of equal order only establish sharpness
when n is 2 mod 4. The picture now offers the original paper's matching
obstruction for both congruences: when n is 0 mod 4, cliques of orders
n/2−1 and n/2+1, with a Hamilton cycle removed from the larger. Both have
regular degree exactly one below the sharp threshold and odd components,
so no perfect matching. All even n from 6 to 100 satisfy these construction
checks. The degree control follows n−1, shows the effective construction
degree while disabled in sharpness mode, and the color-class control follows
the effective palette. Small successful edge-colorings are checked to
partition into perfect matchings; small cases do not certify the unspecified
asymptotic n0. Completed exclusions and budget stops remain distinct.

## Validation

* `node --test tests/verification-graph-brooks-edge.test.mjs`: **7/7 pass**.
  Includes exhaustive Brooks checks through six vertices, all simple graphs
  through five vertices for Vizing, 400 further Vizing samples, 216 bipartite
  König samples, exact recipe checks and both factorization congruences.
* `node tests/verification-graph-brooks-edge.mjs`: **14/14 light/dark groups pass**.
  Real keyboard and mouse controls cover seven Brooks presets and both
  orders; all sixteen Erdős k/g pairs and epsilon extremes; joins and
  identifications for all three k values; four recursive Hajós recipes;
  four König and five Vizing presets, first/next/final steps and eight
  resamples apiece; and all four factorization sizes, degree/class extremes,
  effective degree feedback and matching classes.
* Owned-file static validation reports eight items, zero errors/warnings.
  `git diff --check` passes. No global build was run here; central integration
  owns that check.
* Representative screenshots visually inspected:
  `/tmp/atlas-brooks-factorization-light.png` and
  `/tmp/atlas-brooks-erdos-dark.png`. Additional light/dark captures:
  `/tmp/atlas-brooks-hajos-{light,dark}.png` and
  `/tmp/atlas-brooks-vizing-{light,dark}.png`.

The seven source flags are cleared for the reviewed statements, proofs,
inputs and finite demonstrations.
