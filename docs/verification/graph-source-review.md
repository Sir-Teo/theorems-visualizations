# Graph source verification — 18 October 2026

All **77** previously flagged implemented graph items were checked against the author-hosted sixth-edition preview declared in `content/graph/syllabus.js` (June 2024 build for the collection’s sixth-edition anchor). All assigned source checks are closed; no `verify: true` remains in implemented graph chapter files. Letter-suffixed definitions are editorial anchors for unnumbered definitions. Future, unimplemented syllabus entries retain their flags.

The review used complete relevant pages and proofs in the [author’s chapter PDFs](https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch1.pdf), including chapter 11 for the probabilistic proof referenced by 5.2.5. This is the declared edition’s numbering, rather than older edition numbers or search excerpts. Printed page numbers are recorded below. The following SHA-256 values identify the downloaded sources; URLs share the prefix `https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/`.

| Source | Pages | SHA-256 |
| --- | --- | --- |
| `Ch1.pdf` | 35 | `ebd9084653a1a534b964cbe327eeb8ab6b46a5e98deeee94280b05ebb6f37b56` |
| `Ch2.pdf` | 25 | `060b4490c6fe6d3be54bf2e97e5664a157f6629209178c7ebee42de8ef02ede6` |
| `Ch3.pdf` | 30 | `1d54f8cf0a846e8acedc5a5eb87839173a3145148a6c23eba49e4d4d6d0c8775` |
| `Ch4.pdf` | 30 | `bfdfbcb1e7c0df0d6fc1322ae02b11a8c7ef5c6c85f509e96ad20ad7665b15a9` |
| `Ch5.pdf` | 32 | `d6aa599b28b33ba4ccd8090e7ae53cfad6b30b215d9217d072c7ee8fb338f24d` |
| `Ch11.pdf` | 23 | `69d9942aed1d767be7571b051611bcf082f80f83fcf141e4bd9e8eb85d848e66` |

The review corrected these issues:

- **Drawings (4.3.1a–4.3.1):** the book deliberately defines topological isomorphism on the sphere. Restored its three levels (graph-theoretical, combinatorial and topological), the first theorem clause for arbitrary plane graphs, and the cycle’s two possible face bijections. The diagram reports spherical equivalence separately from the extra condition of preserving the outer face.
- **Kuratowski reduction (4.4.4–4.4.5):** restored proper separation of minimum order, the general forbidden class of 3-connected graphs, and the conclusion that both sides remain edge-maximal. Replaced the incomplete proof sketches with the book’s actual rerouting and induction arguments. The related minimal K5-model proof now uses four-leaf branch trees and the six-vertex K3,3 minor, without an invented case analysis.
- **Numbered statements:** restored Diestel’s `d≥n/2` sufficiently-large-order version of 5.3.3, and qualitative Alon 5.4.1 and Scott–Seymour 5.6.1. Removed unsupported sharper general bounds while preserving the explicitly derived complete-bipartite list obstruction. Corrected the induced-path parameter from Diestel’s length to the diagram’s vertex count; the recurrence now states this conversion explicitly. Restored the uniform-in-r definition of a chi-bounding function.
- **Proofs and illustrations:** the book’s Brooks proof is Kempe recolouring; the greedy triple construction is labelled as the diagram’s alternative and its cutvertex limitation is stated. The perfection characterization’s converse is the source’s rank argument. Schnyder’s source states the criterion without proof; the wood/grid picture is expressly an illustration, and it does not claim to compute the incidence-poset orders. Abstract duality no longer assumes the dual 2-connected or says that only one literal K4 self-dual edge pairing works.
- **Computational honesty:** a capped longest-cycle search reports a lower bound and leaves non-Hamiltonicity undecided. A capped path-cover search does not claim minimality. Lists of size below the chromatic index can still succeed when their palettes differ; only identical lists necessarily fail. A list solver timeout is labelled undecided. Hollow odd-hole-free construction points are lower bounds, not computed chromatic numbers. Arboricity is restricted to loopless multigraphs. Isolated vertices are distinguished from leaves in the tree legend. Visual inspection also caught the arboricity Optimal button losing every edge colour after reloading an unchanged preset: a structure cache retained old edge-object keys. The handler now indexes the current graph edges, and the browser regression asserts coverage after preset reload. The four-colour picture likewise now indexes its actual kit graph: it previously counted conflicts on synthetic edge objects and failed to paint the real edges red.

Historical credits are aligned with source years (Whitney 1933 for embedding uniqueness, Kelmans 1978, Alon 1993, Scott–Seymour 2016, Gyárfás 1975 and Sumner 1981). Unsupported optional dates were removed; no historical uncertainty is used to close a source flag. Parent fixes in the plane-addition implementation and prerequisite links were preserved.

Validation:

- `node scripts/check.mjs graph --static`: **172 items, 0 errors, 0 warnings**.
- `node tests/verification-graph.test.mjs`: **6 independent regressions pass**: actual capped-search readout, differing-list counterexample, multiple K4 dual pairings, dual bridge/loop and bond calculation, spherical cycle face-bijection exception, and actual four-colour conflict highlighting.
- Browser controls: all **154** item/theme cases passed; all light/dark control screenshots were visually inspected. Targeted follow-ups for arboricity preset reload, actual four-colour red conflicts, the Alon legend, and cone-extension orientation also pass. `tests/verification-graph-browser.mjs` uses `installBrowserAssets`, actual local KaTeX 0.16.11 and one browser worker for all 77 diagrams in light/dark. Results and screenshots: `/tmp/atlas-graph-browser*.json`, `/tmp/atlas-graph-shots`.

## Exact closure ledger

All rows are closed; no assigned source flag is unresolved.

| Item | File | Source location |
| --- | --- | --- |
| `graph-1.1.1a` | `content/graph/ch01.js` | §1.1, pp. 2–3 |
| `graph-1.1.1b` | `content/graph/ch01.js` | §1.1, p. 3 |
| `graph-1.1.1c` | `content/graph/ch01.js` | §1.1, pp. 3–4 |
| `graph-1.2.1a` | `content/graph/ch01.js` | §1.2, p. 5 |
| `graph-1.3.1a` | `content/graph/ch01.js` | §1.3, pp. 6–8, 10 |
| `graph-1.3.1b` | `content/graph/ch01.js` | §1.3, p. 8 |
| `graph-1.3.1c` | `content/graph/ch01.js` | §1.3, pp. 8–9 |
| `graph-1.4.1a` | `content/graph/ch01-b.js` | §1.4, pp. 10–11 |
| `graph-1.4.1b` | `content/graph/ch01-b.js` | §1.4, pp. 11–12 |
| `graph-1.5.1a` | `content/graph/ch01-b.js` | §1.5, pp. 13–14, including footnote 5 |
| `graph-1.5.3a` | `content/graph/ch01-b.js` | §1.5, pp. 15–16 |
| `graph-1.6.1a` | `content/graph/ch01-b.js` | §1.6, p. 17 |
| `graph-1.7.1a` | `content/graph/ch01-c.js` | §1.7, pp. 19–20 |
| `graph-1.7.1b` | `content/graph/ch01-c.js` | §1.7, pp. 18–19 |
| `graph-1.8.1a` | `content/graph/ch01-c.js` | §1.8, pp. 21–22 |
| `graph-1.9.1a` | `content/graph/ch01-c.js` | §1.9, pp. 23–24 |
| `graph-1.9.1b` | `content/graph/ch01-c.js` | §1.9, pp. 24–25 |
| `graph-1.9.5a` | `content/graph/ch01-c.js` | §1.9, pp. 26–27 |
| `graph-1.10.1a` | `content/graph/ch01-c.js` | §1.10, pp. 27–29 |
| `graph-2.1.1a` | `content/graph/ch02.js` | Chapter 2 introduction, p. 37 |
| `graph-2.1.1b` | `content/graph/ch02.js` | §2.1, p. 38; Exercise 1, p. 57 |
| `graph-2.1.1c` | `content/graph/ch02.js` | §2.1, p. 39 |
| `graph-2.1.3a` | `content/graph/ch02.js` | §2.1, pp. 41–42 |
| `graph-2.2.1a` | `content/graph/ch02.js` | §2.2, pp. 43–44 |
| `graph-2.2.2a` | `content/graph/ch02.js` | §2.2, p. 45 |
| `graph-2.3.1a` | `content/graph/ch02-b.js` | §2.3, pp. 47–48 |
| `graph-2.4.3a` | `content/graph/ch02-b.js` | §2.4, p. 51; Theorem 2.4.3 |
| `graph-2.5.1a` | `content/graph/ch02-b.js` | §2.5, pp. 54–55 |
| `graph-3.1.1a` | `content/graph/ch03.js` | §3.1, p. 64 |
| `graph-3.1.3a` | `content/graph/ch03.js` | §3.1, pp. 65–66 |
| `graph-3.5.1a` | `content/graph/ch03-b.js` | §3.5, p. 79 |
| `graph-4.1.1a` | `content/graph/ch04-a.js` | §4.1, pp. 94–95 |
| `graph-4.1.4` | `content/graph/ch04-a.js` | Theorem 4.1.4, p. 96 |
| `graph-4.2.1a` | `content/graph/ch04-a.js` | §4.2, pp. 96–97 |
| `graph-4.2.7a` | `content/graph/ch04-a2.js` | §4.2, pp. 99–100; Proposition 4.2.8 |
| `graph-4.2.9` | `content/graph/ch04-a2.js` | Theorem 4.2.9 and proof, p. 101 |
| `graph-4.3.1` | `content/graph/ch04-z.js` | Theorem 4.3.1 and proof, pp. 104–106 |
| `graph-4.3.1a` | `content/graph/ch04-z.js` | §4.3, pp. 102–104 |
| `graph-4.3.2` | `content/graph/ch04-z.js` | Theorem 4.3.2 and proof, p. 106 |
| `graph-4.4.1a` | `content/graph/ch04-z.js` | §4.4, pp. 106–107 |
| `graph-4.4.2` | `content/graph/ch04-z.js` | Lemma 4.4.2 and proof, p. 107 |
| `graph-4.4.3` | `content/graph/ch04-z.js` | Lemma 4.4.3 and proof, pp. 108–109 |
| `graph-4.4.4` | `content/graph/ch04-z.js` | Lemma 4.4.4 and proof, pp. 109–110 |
| `graph-4.4.5` | `content/graph/ch04-z.js` | Lemma 4.4.5 and proof, pp. 110–111 |
| `graph-4.5.2` | `content/graph/ch04-z2.js` | Theorem 4.5.2 and proof, p. 113 |
| `graph-4.5.3` | `content/graph/ch04-z2.js` | Theorem 4.5.3 (no proof supplied), p. 113 |
| `graph-4.6.1a` | `content/graph/ch04-z2.js` | §4.6, pp. 114–115 |
| `graph-4.6.1b` | `content/graph/ch04-z2.js` | §4.6, pp. 115–116 |
| `graph-4.6.3` | `content/graph/ch04-z2.js` | Theorem 4.6.3 and proof, pp. 116–117 |
| `graph-5.1.1` | `content/graph/ch05-a.js` | Theorem 5.1.1, p. 124; notes pp. 152–153 |
| `graph-5.1.1a` | `content/graph/ch05-a.js` | Chapter 5 introduction, p. 123 |
| `graph-5.1.1b` | `content/graph/ch05-a.js` | Chapter 5 introduction, p. 124 |
| `graph-5.1.2` | `content/graph/ch05-a.js` | Proposition 5.1.2 and first proof, pp. 124–125 |
| `graph-5.1.3` | `content/graph/ch05-a.js` | Theorem 5.1.3, p. 126 |
| `graph-5.2.1a` | `content/graph/ch05-a.js` | §5.2, pp. 126–127 |
| `graph-5.2.2` | `content/graph/ch05-a.js` | Proposition 5.2.2 and preceding proof, p. 127 |
| `graph-5.2.4` | `content/graph/ch05-a2.js` | Theorem 5.2.4 and proof, pp. 127–129 |
| `graph-5.2.5` | `content/graph/ch05-a2.js` | Theorem 5.2.5, p. 130; Theorem 11.2.2 and proof, pp. 345–347 |
| `graph-5.2.5a` | `content/graph/ch05-a2.js` | §5.2, pp. 130–131 |
| `graph-5.2.6` | `content/graph/ch05-a2.js` | Theorem 5.2.6 and proof, p. 131 |
| `graph-5.3.1` | `content/graph/ch05-a2.js` | Proposition 5.3.1 and proof, p. 132 |
| `graph-5.3.2` | `content/graph/ch05-a2.js` | Theorem 5.3.2 and proof, pp. 132–133 |
| `graph-5.3.3` | `content/graph/ch05-a2.js` | Theorem 5.3.3, p. 133 |
| `graph-5.4.1` | `content/graph/ch05-z.js` | Theorem 5.4.1, pp. 134–135 |
| `graph-5.4.1a` | `content/graph/ch05-z.js` | §5.4, p. 134 |
| `graph-5.4.2a` | `content/graph/ch05-z.js` | §5.4, List Colouring Conjecture, p. 137 |
| `graph-5.4.2b` | `content/graph/ch05-z.js` | §5.4, p. 137 |
| `graph-5.5.1a` | `content/graph/ch05-z2.js` | §5.5, pp. 139–140 |
| `graph-5.5.1b` | `content/graph/ch05-z2.js` | §5.5, p. 140 |
| `graph-5.5.3` | `content/graph/ch05-z2.js` | Theorem 5.5.3 and discussion, p. 141 |
| `graph-5.5.4` | `content/graph/ch05-z2.js` | Theorem 5.5.4 and proofs, pp. 142–145 |
| `graph-5.5.5` | `content/graph/ch05-z2.js` | Lemma 5.5.5 and proof, pp. 142–143 |
| `graph-5.5.6` | `content/graph/ch05-z2.js` | Theorem 5.5.6 and proof, pp. 144–145 |
| `graph-5.6.1` | `content/graph/ch05-z2.js` | Theorem 5.6.1, p. 146 |
| `graph-5.6.1a` | `content/graph/ch05-z2.js` | §5.6, p. 146 |
| `graph-5.6.2` | `content/graph/ch05-z2.js` | Proposition 5.6.2 and Lemma 5.6.3, pp. 146–147 |
| `graph-5.6.3a` | `content/graph/ch05-z2.js` | §5.6, Gyárfás–Sumner conjecture, p. 147 |
