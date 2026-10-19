# Algebraic planarity and duality follow-up — 2026-10-17

Five queued source reviews are resolved in `content/graph/ch04-z2.js`:
`graph-4.5.2`, `graph-4.5.3`, `graph-4.6.1a`, `graph-4.6.1b`, and
`graph-4.6.3`. Supporting unflagged neighbors 4.5.1 and 4.6.2 are corrected
without additional queue reductions. No central ledger, master plan, package,
shared toolbox, or shared test file was edited by this batch.

## Primary evidence and numbering

Reinhard Diestel, *Graph Theory*, sixth edition (2025),
[author-hosted Chapter 4](https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch4.pdf).
The version was established from the author's `basic.html` preview link by the
coordinating review. The supplied PDF and its text extraction were read here;
its SHA-256 was independently checked:
`bfdfbcb1e7c0df0d6fc1322ae02b11a8c7ef5c6c85f509e96ad20ad7665b15a9`.
Printed page 93 is PDF page 1.

| Atlas item | Exact source anchor | Review result |
|---|---|---|
| `4.5.2` | [Theorem 4.5.2, p. 113, PDF p. 21](https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch4.pdf#page=21) | Finite 3-connected graphs; at most two is equivalent to exactly two. Forward direction uses facial/nonseparating induced cycles and two face incidences; converse uses Tutte's cycle-space generation plus MacLane. |
| `4.5.3` | [Theorem 4.5.3, p. 113, PDF p. 21](https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch4.pdf#page=21) | Incidence-poset dimension at most three. The book states the theorem without a proof. The repaired proof explanation and concrete three-order construction use the author papers below. |
| `4.6.1a` | [Unnumbered plane-dual definition, pp. 114–115, PDF pp. 22–23](https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch4.pdf#page=22) | Stable `a` suffix denotes the definition, not Proposition 4.6.1. Plane multigraphs, loops, double-edge cycles, edge crossing, vertex/face exchange, connectedness and isomorphic double dual checked. |
| `4.6.1b` | [Unnumbered abstract-dual definition, p. 116, PDF p. 24](https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch4.pdf#page=24) | Stable `b` suffix denotes the definition. The source explicitly does not require either graph to be connected. All cycles must correspond precisely to all bonds under the edge bijection. |
| `4.6.3` | [Theorem 4.6.3, p. 117, PDF p. 25](https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch4.pdf#page=25) | General finite graph, without a 2-connectivity hypothesis. Source proof combines componentwise plane duals, Proposition 4.6.2, the sparse atomic-cut basis (1.9.2), and MacLane's criterion. |

The supporting items use Theorem 4.5.1, p. 112 (PDF p. 20), and Proposition
4.6.2, p. 116 (PDF p. 24). Unsupported historical date/priority metadata was
removed; conventional theorem names are retained. The reviewed theorem
numbering is the sixth-edition numbering, not inferred from earlier editions.

Two primary research papers supply Schnyder details missing from the book:

* Fidel Barrera-Cruz and Penny Haxell,
  [*A Note on Schnyder's Theorem*](https://arxiv.org/abs/1606.08943),
  *Order* 28 (2011), 221–226; author arXiv submission 2016.
  The standard-representation definition on PDF p. 2 and Theorems 1, 4 and 5
  on pp. 2, 4–6 establish the separation criterion and the contraction/inverse
  insertion proof. PDF SHA-256:
  `8e8f36d350902cef85d3d3ae24f9aa6f86b725280984205071026f6f39014a92`.
* Fidel Barrera-Cruz, Penny Haxell and Anna Lubiw,
  [*Morphing Schnyder drawings of planar triangulations*](https://arxiv.org/abs/1411.6186),
  author preprint, 2014. Section 2, pp. 3–6: complete local wood rules,
  disjoint root paths, face-count drawing (Theorem 1, p. 5), and vertex-edge
  coordinate separation (R1, p. 6). PDF SHA-256:
  `b47a4dfd4be04659ff23ab981a7cc52a8adcba30d940e6052a712a27741af250`.

## Material corrections

### An actual incidence-poset realizer

The former Schnyder picture showed a wood and region-count drawing without
constructing the advertised three incidence orders. Its proof explanation also
used an unsupported shortcut about subdivisions and order dimension.
The explanation now follows the primary representation proof. Sorting the
three face-count coordinates gives vertex orders with no common strict
comparison; the separation property places each nonincident vertex above both
ends of an edge in some order. Inserting an edge immediately after its later
endpoint extends these to three orders of all vertices and edges.

The new toggle displays those complete orders and corresponding edge labels.
For each generated graph the runtime intersects every strict ordered-pair
relation and compares it with the incidence relation, rather than reporting
success from a constant label. It checks complete local wood rules, all root
paths, path disjointness, distinct points, vertex-edge contacts and edge
crossings. Defect tests include a malformed coloring, vertex on an edge and
collinear overlapping edges; the malformed coloring is rejected without an
infinite normalization loop.

### Dual paths were geometrically wrong after spreading

The former force-spreading step kept primal crossings away but could make
faces concave. Their arithmetic centroids could then lie across a supporting
edge, and the displayed dual paths could fail to cross the intended edge or
cross other primal edges. This occurred on cube, prism, K2,4 and glued-K4
examples under offered outer-face choices.

The scoped plane model now retains its barycentric embedding, whose displayed
face centers work with the centroid-to-edge-midpoint routing for these presets.
Independent checks cover every one of the 42 face choices: each path crosses
its matched primal edge once and no other primal edge. All plotted paths stay
within the stage in browser tests. The dashed outer circle is explicitly a
schematic single identified outer-face vertex; its many path endpoints are not
claimed to be distinct dual vertices or a literal point drawing of that vertex.

Changing the outer face redraws the same combinatorial embedding and preserves
its abstract dual incidences. The old claim that two K4 copies glued along an
edge necessarily produce parallel dual edges was false for the offered graph:
that displayed dual has no parallel pair. K2,4 is the correct parallel example:
four dual edge pairs, counted as four excess parallel edges by the readout.

### Both directions of abstract duality and disconnected graphs

The former candidate checker only tested cycle-to-bond. It now also tests
whether every candidate bond is the image of a primal cycle and validates the
edge bijection. The reverse direction matters: a one-edge forest has no cycles,
so its identity pairing to a one-edge candidate would pass a forward-only
vacuous test although that candidate has a bond. The corrected checker rejects
it. The loop candidate is its valid dual. Loops and double-edge cycles are
covered by the dedicated exact-subset fallback.

The old K4 wording suggested uniqueness of the opposite-edge pairing.
Enumerating all 720 bijections finds exactly 24 valid self-dual pairings,
consistent with composing the opposite pairing with vertex automorphisms.
The actual right-panel edge-swap controls are used to repair the identity
pairing to the opposite pairing in the browser test.

An abstract dual need not be connected, even when its primal is connected.
Adding isolated dual vertices preserves all bonds. Supporting Proposition
4.6.2 now states the correct dimension identity
`m−n+c = n*−c*`, including isolated components. A triangle's dual can be three
parallel edges on two vertices together with two isolated vertices: both
spaces have dimension one. The connected-only `n*−1` formula formerly failed
this example. Connected plane presets retain the valid specialization.

### Sparse bases and bounded searches

Whitney's converse uses an atomic-cut basis without assuming 2-connectivity;
its pullback is a sparse Eulerian basis, whose vectors need not initially be
single cycles. Splitting each vector into edge-disjoint cycles and extracting
a basis cannot increase any edge's total use. This links the general sparse
basis theorem to the app's search over individual cycles.

Supporting MacLane text now states that distinction and handles component
counts and facial boundaries modulo two. The proof reference follows the
source's inheritance under deletion/subdivision and dimension/girth exclusions.
Both MacLane and Whitney distinguish a completed unsuccessful search from a
budget-limited failure, and call the saved family a partial independent family,
without claiming it is maximum. The current K5, K3,3 and Petersen searches do
finish (98,990; 909; and 138,315 search nodes respectively). A zero-budget test
separately verifies that exhaustion is not reported when search stops early.
The general theorems are supported by the primary proofs, not inferred from
these finite searches or the 480 generated Schnyder examples.

## Validation and remaining limits

* `node --test tests/verification-graph-duality.test.mjs`: **7/7 pass**.
  Independent edge-subset cycles/edge-removal bonds check the finite examples;
  all 720 K4 pairings are tested; all 42 plane face choices satisfy Euler,
  degree, full cycle/bond and crossing checks; 480 Schnyder instances satisfy
  complete wood, contact and incidence-order checks; sparse-search outcomes
  are checked including a deliberately exhausted budget.
* `node tests/verification-graph-duality.mjs`: **14/14 light/dark groups pass**.
  Real mouse/keyboard controls cover all eight Kelmans graphs, edge selection
  and cycle extremes; both Schnyder size extremes and ten new triangulations
  per theme, inner-vertex selection and order toggle; all seven plane graphs
  times twelve offered outer choices per theme, plus dual visibility;
  both candidate types on all four abstract-dual graphs, actual edge swaps,
  reset and random-swap actions; all nine Whitney examples; and supporting
  cycle/cut-space and MacLane controls.
* Static validation of the owned content and `git diff --check` pass.
  No global build was run by this agent; central integration owns that check.
* Representative screenshots were visually inspected:
  `/tmp/atlas-graph-plane-dual-light.png` and
  `/tmp/atlas-graph-schnyder-dark.png`. Additional light/dark captures:
  `/tmp/atlas-graph-k4-pairing-{light,dark}.png` and
  `/tmp/atlas-graph-whitney-{light,dark}.png`.

Finite examples remain intentionally small and simple on the primal side;
small multigraph/disconnected edge cases are verified by dedicated calculations.
The plane picture's outer vertex remains a labeled schematic identification.
No subjective human or listening check was marked complete by these automated
checks. The five source flags are cleared only for this reviewed scope.
