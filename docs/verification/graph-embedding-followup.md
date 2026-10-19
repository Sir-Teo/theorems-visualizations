# Graph embeddings and maximal planarity follow-up

This review resolves eight original source-review flags in `content/graph/ch04-z.js`: `graph-4.3.1a`, `graph-4.3.1`, `graph-4.3.2`, `graph-4.4.1a`, `graph-4.4.2`, `graph-4.4.3`, `graph-4.4.4`, and `graph-4.4.5`. It covers the exact source statements and arguments, the distinctions illustrated by the diagrams, and the finite graph computations and inputs. A limited correction to the adjacent unflagged 4.4.7 caption is documented separately below; it is not an extra resolved queue flag.

## Primary source and exact edition

The primary source is Reinhard Diestel, *Graph Theory*, **sixth edition, 2025**, Chapter 4, from the author's [official preview page](https://diestel-graph-theory.com/basic.html) and its [Chapter 4 PDF](https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch4.pdf). The chapter PDF has 30 pages, printed pp. 93–122; its SHA-256 is `bfdfbcb1e7c0df0d6fc1322ae02b11a8c7ef5c6c85f509e96ad20ad7665b15a9`. Thus a printed page p corresponds to PDF page p−92. The statements and complete relevant proofs were read in this edition; printed pp. 103–104 and 110 were rendered and inspected directly. No older fourth-edition sample was used to settle numbering or definitions.

| Item | Printed pages / chapter-PDF pages | Source scope |
|---|---|---|
| 4.3.1a | 102–104 / 10–12 | The unnumbered planar-embedding, topological, combinatorial and graph-theoretical isomorphism definitions. Topological isomorphism uses the sphere. |
| 4.3.1 | 104–106 / 12–14 | Both parts of the theorem, including graph-theoretical ⇒ combinatorial, uniqueness of the face extension except for a cycle, and combinatorial ⇒ topological for 2-connected drawings. |
| 4.3.2 | 106 / 14 | Any two planar embeddings of a 3-connected graph are equivalent under the canonical identity of the abstract graph. Facial cycles are determined by nonseparating induced cycles. |
| 4.4.1a | 106 / 14 | The unnumbered planar and maximally planar definitions; no minimum vertex count is imposed by the definition itself. |
| 4.4.2 | 107 / 15 | Excluding K⁵/K₃,₃ minors is equivalent to excluding their subdivisions. The proof uses a minimal minor model and four-leaf trees, then Proposition 1.7.3. |
| 4.4.3 | 108–109 / 16–17 | A 3-connected graph with neither forbidden minor is planar; contraction induction and the local extension/rerouting argument. |
| 4.4.4 | 109–110 / 17–18 | A family of 3-connected forbidden graphs; a proper separation of order equal to connectivity, at most 2; both induced sides retain edge-maximality and their intersection is K². |
| 4.4.5 | 110–111 / 18–19 | A forbidden-subdivision-free edge-maximal graph on at least four vertices is 3-connected; the proof inducts through both maximal sides and rules out the selected cross-edge obstruction using planar faces. |

The stable suffixed IDs for the two unnumbered definition entries are preserved. Every reviewed entry now links to its precise sixth-edition chapter-PDF page. The old Whitney 1932 credit was removed; the source labels Theorem 4.3.2 “Whitney 1933,” which is recorded explicitly as the book's attribution rather than an independently verified priority claim. The author name is retained without a year.

## Corrections

### Three isomorphism notions, the sphere, and the exceptional cycle

The former definition called an isomorphism topological only when it extended to a homeomorphism of the plane. That is not this edition's convention: Diestel deliberately passes to the sphere so that the outer face is not distinguished. The former display consequently labelled a change of outer face “not topological” even while its facial structure was unchanged. Both the definition and the theorem display now report sphere-topological equivalence correctly; extension to a homeomorphism of the plane is a separately labelled additional condition.

The former definition also described preservation of the set of facial boundary subgraphs as a combinatorial isomorphism. The sixth edition distinguishes that **graph-theoretical** condition from the incidence-preserving bijection of vertices, edges **and faces** that defines combinatorial isomorphism. Theorem 4.3.1(i) says the graph-theoretical condition nevertheless suffices, and identifies when the extension to individual faces is unique. The old theorem omitted this entire part. The restored statement now includes it, alongside part (ii)'s 2-connected hypothesis and sphere conclusion.

A new cycle preset exhibits the exception: its two faces have the same boundary, and there are two possible face bijections. In noncycle presets, boundary subgraphs determine the faces uniquely. The face-comparison helper retains multiplicities rather than collapsing the two cycle faces into one set element. For the 2-connected demonstrations, the face-boundary comparison supports the source's combinatorial/sphere conclusion; comparing the outer boundary adds the plane-extension test. In the cycle case the latter means that a plane extension **exists** with the outer face preserved; the display does not claim that both possible face bijections preserve it.

The proof sketches now follow the source: the cycle case uses Jordan; otherwise Lemma 4.2.5 identifies individual faces from their boundaries; for part (ii), first extend the map along all edges, then extend the already compatible boundary-circle maps over the face discs on the sphere. The finite gluing control illustrates selected bounded faces; it is not a numerical construction or proof of an arbitrary surface homeomorphism.

### Whitney and finite embedding searches

The 3-connected examples' facial cycles are compared with independently enumerated nonseparating induced cycles. Those are drawing-independent, which is the proof of uniqueness; finding one sample group in 400 randomized trials does not prove uniqueness. The caption now says so and distinguishes procedure frequencies from uniform sampling of all embeddings. The sample button advances the seed instead of always repeating the same 400 choices. The embedding selector is hidden when only one group exists, and values are clamped to the number of groups actually found.

For every selected graph, all cycles fit well below the enumerator's 4,000-cycle cap: the six Whitney examples have 28, 52, 21, 63, 6 and 30 cycles, respectively. Independent vertex-subset enumeration checks both the induced-cycle and nonseparation conditions. The empty remaining graph is excluded in accordance with the source's connectivity convention; the cycle exception is handled by the face-bijection theorem rather than falsely treated as a 3-connected example.

### Abstract planarity versus a valid straight-line drawing

The former geometric test counted only proper intersections of disjoint edges, so it could call coincident vertices, an overlapping edge, or a vertex lying on another edge “a plane graph.” The new dedicated drawing check detects vertex collisions and nonincident vertex–edge contacts as well as proper crossings. These degeneracies receive their own readout messages and highlights. The editable drawing's geometry remains separate from the abstract graph's planarity, which is determined combinatorially. The manual drag tests deliberately create contacts while leaving the underlying graph planar.

Interactive pointer coordinates have finite precision. The drawing check therefore uses a relative tolerance of 10⁻⁶ and says that a contact fails the check at its numerical precision; it does not claim an exact topological impossibility for two mathematically distinct points that are visually indistinguishable. Tests with exact prescribed coordinates separately cover overlapping collinear segments, incident collinear segments containing another vertex, proper crossings, coincident vertices and a valid square.

Real player tests exposed two generated intermediate layouts with near-collinear contacts at this display precision. The local layout wrapper preserves the existing planarity machinery but retries other outer faces and positive barycentric weights when a drawing is too close to a contact. The accepted retry is itself checked geometrically; no topology or planarity result is inferred from how the original picture looked. A regression retains the two-disjoint-paths case on 11 vertices that previously produced the ambiguous intermediate layout.

The maximally-planar definition applies to complete graphs with fewer than three vertices as well. Removed the readout's erroneous n≥3 condition, which previously called K² nonmaximal even though it has no missing edge. The actual editor now exercises removal down to two vertices and restoration of their edge. The separate 3n−6 proposition still correctly keeps its n≥3 hypothesis.

### Minor models and the induction illustration

Lemma 4.4.2 now uses the actual four-leaf-tree argument rather than an unspecified list of split patterns. In a minimal K⁵ model, each branch set is a tree with one external edge to each other branch set. After suppressing degree-2 vertices, the four-leaf tree is either a 4-star or has two degree-3 vertices. If all are stars, the model gives TK⁵. Otherwise contraction to the two degree-3 vertices on the exceptional side and one vertex on each other side produces a six-vertex graph containing K₃,₃; its maximum degree-3 target then yields a subdivision by 1.7.3.

All five displayed split patterns are built by one pure helper shared with the tests. Each reported obstruction is independently checked as an actual subdivision: branch vertices are distinct, internal vertices of different paths are disjoint, the paths use exactly the reported edges, and suppression yields either complete K⁵ or complete bipartite K₃,₃. The 3+1 split yields TK⁵; the 2+2, 2+1+1 and double 2+2 patterns yield TK₃,₃. These checked examples illustrate the general tree argument without purporting to exhaust arbitrary graphs.

Lemma 4.4.3's player contracts edges preserving 3-connectivity and shows the sequence in reverse. It independently invokes a planarity algorithm and computes a new layout at each frame; it does **not** implement the source's local geometric vertex-splitting proof. The caption and idea now make this distinction explicit. Contraction branch sets are checked as partitions of the original vertices, every contracted edge comes from an original inter-group edge, and all levels remain 3-connected. The nonplanar examples stop at a verified forbidden-subdivision frame.

### Proper minimum separations and maximality

The old 4.4.4 statement omitted that the separation is proper and has order κ(G), rather than merely any intersection of size at most two. It also omitted the conclusion that **both induced sides** remain edge-maximal, and restricted the forbidden family without explaining the source's general formulation. The corrected statement gives the complete source hypotheses and both conclusions for an arbitrary family of 3-connected graphs. The examples still specialize to K⁵ and K₃,₃.

The proof now records how minimum-order separation ensures adjacency to each separator vertex, why 3-connected forbidden branch graphs put their branch vertices on one side, and how rerouting rules out separator orders zero or one and a missing edge in an order-two separator. It also gives the final replacement-by-the-separator-edge argument that proves maximality of each side. All 48 selected gluing cases use 3-connected pieces and proper minimum-order gluing sets. Planar cases have an addable edge across the sides and fail maximality; nonplanar cases fail the exclusion hypothesis. They are not presented as a computational proof of the general lemma.

The old 4.4.5 argument vaguely said a forbidden subdivision was “essentially 3-connected” and could always be rerouted across a two-separator. The replacement follows the source's induction: maximal sides are triangles or 3-connected and hence planar; choose third boundary vertices z₁,z₂ on faces incident with xy; adding z₁z₂ forces a forbidden subdivision; its branch distribution produces one in a planar side or in a planar augmentation through the chosen face, contradicting 4.2.11. The proof does not assume the Kuratowski theorem that this lemma helps establish.

Removed the false claim that connectivity first reaches 3 exactly when maximality is attained. For example, the cube already has connectivity 3 while admitting more planar edges. The player reports the actual connectivity at each step and only asserts the required final lower bound. Its final 3n−6 edge count is separately checked.

The adjacent unflagged 4.4.7 caption also claimed that deleting its selected edge always creates a degree-2 vertex and destroys 3-connectivity. That is guaranteed when the edge meets a degree-3 vertex, but not when the generator produces a triangulation without such a vertex. The caption now states the condition and allows the graph to remain 3-connected in other cases. This is a limited factual correction, not a claim that the entire neighboring item was source-reviewed in this batch.

## Independent references and validation

[graph-embedding-references.json](graph-embedding-references.json) contains **199** independently evaluated finite graph cases. NetworkX **3.7** supplies its separate Left–Right planarity implementation, max-flow-based node connectivity, and exhaustive single-edge-addition outcomes. The cases include all diagram presets, all five split minor models, all 48 gluings, every tested contraction-chain level, maximalized starting graphs and 80 seeded random graphs on 4–11 vertices. The independent results agree with the application's combinatorial computations. These are bounded tests, not a formal verification of an algorithm on all finite inputs.

- `node --test tests/verification-graph-embedding.test.mjs`: **seven groups pass**. They verify all 199 independent references; every obstruction certificate; sphere/outer-face comparisons, cycle face multiplicity and Whitney's induced cycles; geometric degeneracies and the layout retry; contraction models; proper gluing separators; and maximal endpoints versus earlier 3-connectivity.
- `node scripts/check.mjs graph-4.3.1a graph-4.3.1 graph-4.3.2 graph-4.4.1a graph-4.4.2 graph-4.4.3 graph-4.4.4 graph-4.4.5 --modes --still`: all **eight** entries pass, with zero static, runtime, TeX, blank-canvas or quality warnings.
- `node tests/verification-graph-embedding.mjs`: **16 real-input light/dark groups pass**. Actual selector clicks, keyboard-controlled ranges and players, sample/order buttons, vertex drags, edge addition/removal, and Alt-delete exercise all eight entries. The run includes all 48 gluing choices, every selected contraction/addition frame, the cycle exception, changed outer faces, deliberate coincident-vertex and vertex-on-edge contacts, and the two-vertex maximality case. No automated sample is treated as a proof of a general graph or topological theorem.
- Source pages and representative product screenshots were inspected directly, including sphere equivalence after changing the outer face, cycle face ambiguity, contraction obstructions and maximal-connectivity examples. Syntax checks and `git diff --check` pass.

The new helper is `content/graph/ch04-embedding.audit.js`; existing shared helpers were preserved. Central queue/master-plan integration and full-site checks remain the root agent's responsibility. This report does not satisfy the remaining Wave 5 gate.
