# STOCH 1.8 preset layout follow-up

The reported blank third alternate mode was a real star-preset rendering defect. `v.graphs('star', 8)` supplies nine bare nodes, eight edges and a requested force layout. `G.set(...)` replaces graph data without running that layout; all star-node coordinates were therefore undefined, and graph drawing skipped them. The right visit-frequency target was visible and the readout correctly counted nine vertices/eight edges, while the left graph was genuinely empty. Native pre-change light/dark screenshots confirmed this was neither an intentional text overlay nor an offscreen/paused visualization.

The same omitted layout call affected the grid preset: its raw coordinates placed most vertices outside the stage, leaving only four of twelve visible. The source-local repair applies `G.layout('force')` after loading the star and `G.layout('fit')` after loading the grid. Petersen and lollipop are unchanged. No canvas was hidden; no fake content or common-runtime/checker change was introduced.

Verification used the real KaTeX 0.16.11 renderer through `installBrowserAssets` and native segmented buttons. In each theme the checked sequence was lollipop → Petersen → lollipop → grid → lollipop → star → grid → star → lollipop: 18 states, all with two visible, nonblank canvases and no page, visualization or TeX errors. All eight distinct theme/preset screenshots were manually inspected: every star has nine visible vertices/eight spokes and every grid has twelve visible vertices/seventeen edges. The unaffected presets and return transitions remain correct.

Native play/pause controls were also exercised in both repaired presets and both themes. Four additional cases produced live visit bars and walker highlights, with recorded hop counts of 81/92 in light star/grid and 79/79 in dark star/grid. All four live screenshots were inspected; no new rendering errors or blank canvases appeared. These finite walk counts check functionality, not a convergence claim.

Commands:

```sh
node --check content/stoch/ch01-b.js
node scripts/check.mjs stoch-1.8 --static
node /tmp/atlas-stoch-1-8/native.mjs
node /tmp/atlas-stoch-1-8/live.mjs
```

Static result: one item, zero errors and zero warnings; scoped diff whitespace check passed. Evidence: `/tmp/atlas-stoch-1-8/before.json`, `results.json`, `live-results.json`, `{light,dark}-{petersen,grid,star,lolli}.png` and `{light,dark}-{star,grid}-live.png`. Only STOCH 1.8's content fingerprint changed. Source edits are complete and frozen.
