# Graph theory: plane topology, extension and Euler — 2026-10-17

Resolved the five assigned flags: `graph-4.1.1a`, `graph-4.1.4`, `graph-4.2.1a`, `graph-4.2.7a` and `graph-4.2.9`. Existing dependency edits in both chapter modules, including all pre-existing dependencies in `ch04-a2.js`, are preserved. Two adjacent proof sentences were also corrected as described below; they are not counted as additional completed item reviews.

## Sixth-edition primary source

The collection pins **Reinhard Diestel, Graph Theory, sixth edition (2025)**. The [author's current homepage](https://diestel-graph-theory.com/) and [free-preview page](https://diestel-graph-theory.com/basic.html) explicitly identify that edition. The latter links the complete [author-hosted chapter 4 preview](https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch4.pdf), 30 PDF pages, printed pp.93–122. SHA-256: `bfdfbcb1e7c0df0d6fc1322ae02b11a8c7ef5c6c85f509e96ad20ad7665b15a9`. Its PDF creation metadata is June 2024; the edition attribution comes from the author's explicitly labelled sixth-edition preview page, rather than inferring it from metadata. The associated [contents](https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Contents.pdf) match the chapter pagination; SHA-256 `d90ea7fcbc19b1a187c7b6193b9e2aa65cd5a50289bab902f88ce643b76534ed`.

The homepage's separate `Sample.pdf` is explicitly a **fourth-edition 2010/2012** sample of chapter 2. It was not used to verify sixth-edition numbering or claims.

| Reviewed identifier | Source anchor, sixth-edition author preview |
|---|---|
| 4.1.1a | Unnumbered polygon, polygonal-arc, region and frontier definitions, printed pp.94–95 / PDF pp.2–3. |
| 4.1.4 | Definitions of circles/regions on the sphere and Theorem 4.1.4, p.96 / PDF p.4. |
| 4.2.1a | Unnumbered plane-graph definition with all four conditions, p.96 / PDF p.4; face, inner/outer face and frontier discussion, p.97 / PDF p.5. |
| 4.2.7a | Unnumbered maximal-plane and triangulation definitions immediately before Proposition 4.2.8, p.100 / PDF p.8. Read the proposition and its proof as well. |
| 4.2.9 | Theorem 4.2.9 and complete edge-deletion induction, pp.101–102 / PDF pp.9–10; Lemmas 4.2.1–4.2.2, pp.97–98, and forest Proposition 4.2.4, p.99. |

The three `a` suffixes are stable atlas identifiers for unnumbered definitions. They have not been substituted with older-edition numbering. Removed unverified historical date/priority credits for Schoenflies and Euler; the mathematical theorem names remain as in the source. An adjacent unsupported “first fully accepted proof” historical claim for Jordan was removed as well.

## Regions, frontiers and plane drawings

The definitions match the source's piecewise-linear convention. The region equivalence relation explicitly permits equality of its two points; this avoids requiring a nondegenerate arc from a point to itself. Polygon/arc labels describe the initial examples: freely dragging a vertex can make the drawn set cease to be a simple arc or polygon, while remaining a finite segment union with a well-defined complement.

A gold probe on the drawn set does not belong to a complementary region. Previously it was still assigned an inside/outside region by numerical winding. The corrected visualization reports an exclusion band of **0.02 data units** and does not assign a region there. It includes isolated-point frontier contributions when a drawn component degenerates to a point, instead of treating an empty edge set as an empty frontier. Crossings are split for face calculations; geometric tolerances and their near-degenerate numerical scope are stated rather than presented as a proof of planar topology.

Plane-graph editing now rejects coincident isolated vertices as well as crossing edges and vertices on foreign edges. The old guard checked edge intersections only, so two isolated vertex objects could occupy the same geometric point. The dedicated guard imposes a stated 0.08-unit vertex clearance, rolls invalid moves back, and reports the reason in both the canvas and textual readout. The source's restrictions remain the ordinary finite simple plane-graph conditions; these numerical clearances are interface choices. The existing shared graph helpers are left intact.

An adjacent Jordan proof explanation previously inferred “exactly two regions” solely from ray parity being constant on regions and alternating across edges. That inference omitted the global connectedness of each parity class. The limited text correction now says which additional global assertion is supplied by the Jordan theorem. It does not claim a finite ray calculation proves that theorem.

## Boundary homeomorphisms and explicit inverse

The source theorem is precisely about the specified circles on the **sphere**, obtained from planar polygons, and either chosen complementary region on each side. Its boundary homeomorphism can preserve or reverse orientation. The old display used smooth radial curves while describing the polygonal theorem, supported only preserving maps, and treated a finite count of positively oriented mesh cells as certifying homeomorphism. A finite mesh cannot establish global bijectivity or continuity of an inverse, and reversing maps are allowed by the theorem.

The corrected demonstration uses planar representatives of the bounded closed discs: a regular 80-gon and one of three star-shaped **80-edge polygons**. Each polygon has a positive radial function R(theta), obtained by intersecting the ray with the actual polygon edge, rather than silently replacing the polygon by a smooth profile. The target radial bounds are respectively `0.6 cos(pi/80)`, `0.58 cos(pi/80)` and `0.7 cos(pi/80)`, all strictly positive. Dragging preserves positive gaps between four angular parameters. The map interpolates those lifted angles monotonically, with preserving/reversing choices.

In relative polar coordinates the extension is

`r R_source(theta) exp(i theta) -> r R_target(phi(theta)) exp(i phi(theta))`, for 0<=r<=1.

For a nonzero target point, invert phi on the circle and recover r by dividing its radius by `R_target(arg z)`. The positive lower radial bound gives continuity of this inverse at zero; the forward map is continuous there as well. This proves the displayed star-shaped special case, including the orientation-reversing one. It does not purport to prove the full Jordan–Schoenflies theorem. The readout gives analytic radial and angular-gap/slope bounds, replacing the former mesh-cell certificate. Mesh samples include preimages of every target polygon corner and every source corner, so straight rendered mesh segments follow the actual polygonal boundaries instead of cutting across omitted corners.

## Maximality, routing and Euler induction

Maximality refers to adding an arbitrary polygonal edge with the same vertex set, rather than only a straight segment. A nonadjacent cofacial vertex pair is an exact topological candidate. The finite-clearance router searches for one admissible realization; failure of that numerical search is not evidence that no edge can be added. The updated controls try all candidates, report router failure separately from the remaining cofacial-pair count, and only label a drawing maximal when that count is zero. All five supplied presets reach genuine triangulations with `m=3n−6`, `ell=2n−4`, every face triangular including the outer face, and no crossings.

The definition's accompanying explanation now states the **at least three vertices** hypothesis for maximality iff triangulation. One- and two-vertex maximal graphs are not triangulations. The adjacent Proposition 4.2.8 explanation also had the false phrase that a forest boundary would make its face the whole plane. The corrected proof instead uses `f union H=R²`, whence G=H; completeness forced by maximality then contradicts H being a forest of order at least three. Its four-cycle is taken in the complete graph G[H], as the source does, rather than presuming the boundary itself already contains that four-cycle.

Euler's theorem is stated for a nonempty connected finite plane graph. The proof deletes an edge on a cycle, which preserves connectivity and merges its two incident faces. Other faces remain unchanged by the boundary/subgraph lemmas. The induction reaches a tree with m=n−1 and one face. Actual editor tests follow this deletion sequence for all three presets. The generalized editor counter `n−m+ell=1+c` also remains correct after disconnection and when every vertex has been removed: the empty drawing has one face and c=0, giving one, outside the connected theorem's hypothesis. Invalid intermediate drags no longer leave a stale successful readout visible.

## Reproducible validation

- `node --test tests/verification-graph-plane.test.mjs`: **6 tests pass**. The polygonal cone map and its explicit inverse are checked densely for three target shapes, three strongly unequal angular configurations, four radii and both orientations. Mesh samples include every polygon corner. Frontier tests distinguish isolated points, nested components, crossings and on-drawing probes. All five triangulation presets are checked for exact graph/face counts, valid bent routes and resettable finite saturation. Every cycle-edge deletion is checked to preserve component count and lower face count by one. Editor rollback is checked for coincident isolated vertices.
- Independent raster flood filling checks **all 4,096 subgraphs of the 3×3 orthogonal grid**, including disconnected graphs and isolated vertices. Its free-pixel connected components agree with the separately computed half-edge faces and Euler balance. The four-pixel-per-unit raster leaves positive corridors between these fixed lattice segments; this exact finite-family check is not a claim that arbitrary continuous embeddings can be certified by a raster.
- `node tests/verification-graph-plane.mjs`: **10 light/dark interaction groups pass**. Real pointer/keyboard input covers all five region examples, vertex/probe drags and the exclusion band; all three target polygons, both orientations and every marker; all four editor presets, real isolated-vertex creation, vertex-coincidence rollback, crossing refusal, valid edge creation and Alt-deletion; all five triangulation presets with incremental edges, saturation, bent arcs and reset; all three Euler proof sequences followed by disconnection and complete deletion to the empty graph. All initial canvases are nonblank and have readouts/interactions, with no runtime or TeX errors.
- Inspected light/dark screenshots for reversing polygonal extensions, triangulation through bent edges, region selection, editing and the empty-graph boundary case. These are named agent visual checks. There are no audio controls in these five entries.
- Chapter syntax and scoped diff checks pass. A direct comparison confirms that **every pre-existing dependency array in both modules is unchanged**. Global build/static/smoke, central queue counts and the master plan are reconciled by the coordinating agent after parallel batches are combined. No Wave 5 work is started.
