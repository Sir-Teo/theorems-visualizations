# Graph direction-mode blank-canvas repair

Fixed **algo-8.1** and **algo-8.10** in `content/algo/ch08.js`. Both direction toggles passed only `directed` to `Graph.set`. That method replaces graph data, so omitted nodes and edges became empty arrays. The failure reproduced in both themes: algo-8.1 displayed “Add a vertex to start,” and algo-8.10 reported zero classified edges and a blank first canvas.

Each call now passes the **existing nodes and edges** with the new direction. This preserves edits and positions while the public `set` operation invalidates cached adjacency indexes. The DFS item then rebuilds its trace as before. No shared graph kit, runtime, harness or checker changed; no source flag changed.

The dedicated regression script, [verification-algo-graph-modes-browser.mjs](../../tests/verification-algo-graph-modes-browser.mjs), uses one Chromium worker, the actual harness and real offline KaTeX 0.16.11. Its optional `--record-baseline` mode recorded the four original failures before the fix. The final run exercises both themes, choice modes, repeated direction changes, native graph edits and node drags:

- **26 captured states**, all nonblank; 16 toggle clicks, six segmented-choice clicks, four native node drags and eight edge-edit clicks.
- **algo-8.1:** 10 vertices and 11 edges survive direction changes, directed degree sums equal 11, and reachability is asymmetric. Adding an edge changes the count to 12 and remains intact through another direction round-trip.
- **algo-8.10:** all 14 edges survive. Undirected DFS has seven tree and seven back edges, no forward/cross edges, and 14/14 timestamp agreement. Removing an edge yields 13/13 agreement in both directions.
- A native drag changes graph pixels. After an edge edit, the first canvas is **pixel-identical after direction toggle and restoration**, in both items and themes. This checks preservation of the edited geometry as well as counts.

Runtime and TeX errors: **0**. All 26 screenshots were manually inspected through the four item/theme contact sheets in `/tmp/algo-graph-modes-after`; individual alternate-mode screenshots were also inspected. The original failing states are in `/tmp/algo-graph-modes-before`. Focused static check: **2 items, 0 errors, 0 warnings**; scoped diff check passed. Exact readouts, source/test hashes and evidence paths are in [algo-graph-modes-followup.json](algo-graph-modes-followup.json).

The source is frozen. A whole-collection evidence refresh remains with the parent task; no collection sweep was launched here.
