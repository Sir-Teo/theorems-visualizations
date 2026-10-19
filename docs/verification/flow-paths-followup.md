# Augmenting paths and König cover follow-up

Resolves `algo-11.8`, `algo-11.9`, `algo-11.12` in `content/algo/ch11-b.js`. Dedicated helper: `content/algo/flow-paths-audit.shared.js`. No shared flow/simplex helper, neighboring item, central ledger, master plan, package, global test entry point, build or commit is changed.

## Primary sources and anchors

Sources retrieved 2026-10-18. The [author's index](https://jeffe.cs.illinois.edu/teaching/algorithms/index.html) identifies Erickson's first edition, June 2019, and its official chapter extracts.

| Source | Reviewed anchors | SHA-256 |
| --- | --- | --- |
| [Erickson, chapter 10](https://jeffe.cs.illinois.edu/teaching/algorithms/book/10-maxflow.pdf) | §10.4, Figures 10.7–10.8, printed pp. 334–336/PDF pp. 8–10; §10.6, Lemmas 10.2–10.3, printed pp. 341–342/PDF pp. 15–16 | `54275a9d794bc7889139caab204a8acdf1a1171fb5dae84e4bcc2b993dd4f63b` |
| [Zwick, original 1995 paper, university mirror](https://www.tu-chemnitz.de/informatik/TI/lehre/archiv/ws20212022/ti1/uebung/zwick_ford.pdf) | §2, printed pp. 166–167/PDF pp. 2–3; introduction distinguishes the nine-edge and eight-edge examples | `110bc80065ca14c8f931af0344cb2901ab451d4a6831e3969e91b097cd6a28af` |
| [Erickson, chapter 11](https://jeffe.cs.illinois.edu/teaching/algorithms/book/11-maxflowapps.pdf) | §11.3, printed pp. 355–356/PDF pp. 3–4, matching/flow/alternating-path correspondence | `195a9649f1a23fde9ef2ef3be4199303b960551592bfb8211d86cdd19432ac89` |
| [Diestel, sixth edition, chapter 2](https://www.math.uni-hamburg.de/home/diestel/books/graph.theory/preview/Ch2.pdf) | Theorem 2.1.1, printed p. 39/PDF p. 3, König 1931 and alternating-path cover proof | `060b4490c6fe6d3be54bf2e97e5664a157f6629209178c7ebee42de8ef02ede6` |

The book extract and original Zwick pages containing the irrational construction were rendered and visually inspected. Course item numbering is independent of source numbering. Removed the unverified Egerváry priority enrichment; retained König's dated source attribution. Distinguished the shortest-path heuristic from Dinitz's stronger blocking-flow algorithm rather than identifying the two algorithms.

## Source discrepancies and corrected irrational example

Both primary presentations contain arithmetic/index slips in the irrational example. Erickson printed p. 336 evaluates a series starting at power 1 as though its first power were 0, and prints `4+sqrt(5)`. The same page's residual exponents after `4n+1` augmentations are shifted by two. Zwick printed p. 167 lists the four-step recurrence and positive bottlenecks but subsequently sums from index 2 and prints a limit of 3. These are visible in the original rendered pages, not just OCR artifacts. Their nontermination constructions remain valid; the incorrect numerical sums were not copied.

For the actual pictured network and prescribed path order, the bottlenecks are

`1, r, r, r², r², r³, r³, ...`, where `r=(sqrt(5)-1)/2`.

After the initial unit augmentation, the three special residual capacities in left/middle/right order are `(1,0,r)`. Starting from `(r^(k-1),0,r^k)`, one four-path block gives

`(r^(k+1),r^k,0) → (r^(k+1),0,r^k) → (0,r^(k+1),r^(k+2)) → (r^(k+1),0,r^(k+2))`.

The first transition into this chain has bottleneck `r^k`; the complete block has bottlenecks `r^k,r^k,r^(k+1),r^(k+1)`. After `4n+1` pushes, the special residuals are `(r^(2n),0,r^(2n+1))`. Consequently the exact flow-value limit is

`1 + 2 sum_(j≥1) r^j = 1 + 2r/(1-r) = 3+2r = 2+sqrt(5)`.

The six outer capacities now use **M=4**, the original paper's sufficient hypothesis. Their limiting loads, in order `(s→v1,s→v2,s→v4,v1→t,v3→t,v4→t)`, are `(r,2,1+r,1+r,1+r,1)`. Outer flows are monotone, so each outer residual stays at least 2. This proves these edges never obstruct the special-edge cycle. Every indicated power stays positive, giving an infinite prescribed run. A feasible flow using the two direct M-capacity routes plus the unit middle route has value `2M+1=9`; the cut `{s,v1,v2}` has capacity 9. The limiting prescribed value is strictly smaller.

The implementation now uses exact integer coefficient pairs `a+b*r`, the identity `r²=1-r`, and exact algebraic sign comparisons. Only plot coordinates and decimal labels are converted to floating point, using the conjugate/norm to avoid cancellation. The 30-step display is explicitly a **cutoff**, not a completion or finite proof of nontermination. Dashed original edges and “undo” labels identify reverse residual usage. The nine-edge example is no longer described as the separate smallest eight-edge construction.

The slow integer example states **positive integer C**, tests every UI value 1–12, and retains the correct totals `2C` versus two shortest augmentations, including C=1. Readouts derive the full trace count from the actual run.

## Edmonds–Karp and König corrections

- **Shortest paths:** State finite nonnegative real capacities and the arithmetic-operation model. Distinguish each original edge's two oriented residual arc identities. The per-orientation count is at most `floor(V/2)`; with at most `2E` identities, use the safe total bound `VE`, preserving `O(VE²)`. The plot now includes augmentation 0, every completed push and the final residual state. Unreachable vertices appear on an explicit infinity row; their values are no longer silently omitted or vertically perturbed. Tallies count completed pushes only, rather than displaying future critical events from the entire trace. The current path's reversed original edges are dashed. Mathematical real-capacity claims are not inferred from floating tolerances in the small integer illustrations.
- **König:** Add finiteness and repair the proof's missing **matched-edge** case. A reached matched left vertex must have been entered through its matched partner; an unmatched edge is traversable forward. Thus no edge leaves reachable left vertices for unreachable right vertices. Both ends of a matched edge have the same reachability status, giving exactly one endpoint in the canonical cover. Cover vertices are matched, giving the equality. The actual canonical cover is independently checked against all covers. All uncovered user-selected edges, including matching edges, now receive the promised dashed-red style; the caption states when this overlay is active.

## Validation

- `node --test tests/verification-flow-paths.test.mjs`: **5/5**. Exact field identities/signs through power 2000; all **12** integer capacities and both path rules; **1001** exact irrational augmentations with feasibility, conservation, every bottleneck, outer slack and cycle invariant; **303** shortest-path networks (3 presets, 100 generated, 200 independently generated including antiparallel edges), cut certificates, monotone distances and oriented critical counts; **512** exhaustive 3×3 bipartite graphs plus empty/unbalanced cases, independent match/cover enumeration and alternating reachability.
- `scripts/verify-flow-paths.py`: **150-digit** independent closed-form references for ten augmentation indices through 1001, all nine edge flows, bottlenecks and flow values, saved as `docs/verification/flow-paths-references.json`. It does not call the JavaScript recurrence.
- `node tests/verification-flow-paths.mjs`: **6/6** real light/dark control groups. All capacities and both path choices; actual first/next/final controls and every irrational frame; all three shortest-path presets and eight random networks per theme, every frame and actual post-push/final curves; all three cover presets and four resamples per theme, every vertex click, canonical minimum cover, user-cover edge styling, toggle and clear; real graph-node drags preserve their flow calculations. No runtime, TeX or blank-stage failures.
- Targeted static check: **3 items, zero errors/warnings**. Scoped diff check clean. All **seven** pre-existing dependency arrays in the owned chapter are unchanged.
- Representative inspected screenshots: `/tmp/atlas-flow-irrational-dark.png`, `/tmp/atlas-flow-shortest-light.png`, `/tmp/atlas-flow-konig-dark.png`. Source discrepancy renders: `/tmp/atlas-erickson-flow-10.png`, `/tmp/atlas-zwick-3.png`.

Finite tests check implementations and independently derived identities; they do not substitute for the source/theorem arguments. Decimal plot output is approximate even when the underlying irrational updates are exact. Root owns central queue reconciliation and global checks.
