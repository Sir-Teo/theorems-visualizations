# Home JSON budget follow-up

2026-10-19. This closes the home transfer gate in MASTER_PLAN §7.3.

## Change and measured result

The previous home startup downloaded the complete `index.json` (430,911 gzip bytes at the initial measurement), then fetched planned items and every collection detail shard from an idle callback. Delaying those requests still exceeded the home budget.

The build now emits `data/home.json`, containing the complete field and collection metadata and the exact home summaries, together with every landmark paper and every bridge target. The home route requests only this file. The build rejects a home payload larger than **300,000 gzip bytes**, before replacing generated data. Complete graph data is loaded when a non-home route needs it. Search loads all written and planned records and all collection details on the first actual query, with failed requests eligible for retry. An empty search focus does not start that work.

The native HTTP audit served actual gzip responses through the normal static server and compared server response lengths with Chromium resource timing `encodedBodySize`. Both light and dark runs transferred **112,823 gzip bytes**, in exactly **one JSON response** (`/data/home.json`). The measurement includes 2.5 seconds of idle time, scrolling, keyboard treemap zoom and return, and empty global search focus. It therefore covers the old eager idle path rather than measuring only the first paint.

The full `index.json` remains available on demand and remains approximately 430 KB gzipped. This result addresses the home transfer gate; it does not claim to satisfy the separate aspirational standalone index-size target at 10,000 items.

## Preserved behavior

- Home counts still cover all 6,684 written items, 6,621 visualizations and 11,541 dependency edges, across all 85 collections and 13 fields.
- The home paper timeline contains all 450 papers, including all 234 planned papers, and six featured paper links. Field navigation and the dependency chord use complete metadata.
- The longest chain contains the full 77-item maximum-depth path. Twelve workhorses retain whole-graph citation counts and the existing four-per-collection cap. Every bridge target is available to home rendering.
- A statement-only query (`"pole separation alone"`) finds `ctrl-4.8` in global search and on the map after all 85 detail shards are loaded. Its visualization opens normally. The papers route still reports 450 papers.
- Starting directly in the control collection, then searching a planned description (`"integrator state keeps growing"`), finds `ctrl-5.2`. Cached collection details are replayed after planned hydration, preserving those descriptions. Returning home still renders the complete home paper sections.
- Failed detail requests show a search error and retry on the next query. An incomplete detail set is never declared search-ready. Global and map queries are both covered.

## Validation

Commands run:

```sh
node --test tests/catalog-bootstrap.test.mjs
node tests/catalog-bootstrap.mjs
node --test tests/ui.test.mjs
node scripts/build.mjs --strict
node scripts/check.mjs --static --quiet
git diff --check
```

The four new data tests check the enforced gzip limit, exact whole-atlas summaries, every paper and bridge target, the maximum-depth dependency chain, whole-graph citation counts, source-order changes and planned inventory changes. The six existing UI regressions pass. The strict build and static check pass with zero errors and warnings. The native script checks both themes, all demand-loading flows above, failed-request retry, and browser page errors.

Native evidence from Chromium 153.0.8010.12:

- `/tmp/atlas-home-json-budget-network.json`: actual response and resource timing measurements in both themes.
- `/tmp/atlas-home-catalog-light.png` and `/tmp/atlas-home-catalog-dark.png`: full home screenshots.
- `/tmp/atlas-home-catalog-hero-light.png` and `/tmp/atlas-home-catalog-hero-dark.png`: native hero screenshots.

The full light screenshot and both hero themes were inspected. The complete home sections, navigation, paper timeline, chain and workhorses render in the expected order, with legible theme contrast and the exact whole-atlas counts. Screenshots are local run evidence; the executable native test regenerates them.

## Files

- `scripts/home-catalog.mjs`: deterministic home catalog derivation and budget constant.
- `scripts/build.mjs`: atomic home output and enforced gzip ceiling.
- `assets/js/app.js`: home bootstrap, demand-driven full catalog and search hydration, cached shard replay and retry behavior.
- `tests/catalog-bootstrap.test.mjs`: data and budget invariants.
- `tests/catalog-bootstrap.mjs`: actual HTTP gzip transfer, native input, navigation and retry regressions.
