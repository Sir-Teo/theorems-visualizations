# Ideas, visualized

An interactive atlas of the load-bearing ideas of human knowledge: theorems and laws, models and
mechanisms, phenomena, methods, paradoxes and inventions. Each idea has its own page with a
paraphrased statement, an interactive canvas visualization, a short "why it's true" (or "how it
works"), and its place in **one dependency graph** that crosses collections and fields.

It started as *Rudin, visualized*, every numbered result in Walter Rudin's analysis trilogy
(PMA, RCA, FA: 1,062 results), and is growing into 85 collections across 13 fields:
mathematics, statistics, computer science, physics, chemistry, Earth & environment, biology,
medicine, engineering, economics, the social sciences, the arts, and the humanities. See
[MASTER_PLAN.md](MASTER_PLAN.md) for the roadmap and `#/status` on the site for live progress.

| route | what |
|---|---|
| `#/` | overview: fields, how the shelves connect, the longest chain of reasoning, workhorse results |
| `#/f/<field>` | a field (e.g. `#/f/physics`): its areas and collections |
| `#/c/<collection>` | a collection (e.g. `#/c/pma`, `#/c/mech`) and its chapters |
| `#/c/<collection>/<n>` | a chapter: its internal dependency graph, its results, and what is still planned |
| `#/t/<id>` | an idea, e.g. `#/t/pma-4.19`, `#/t/rca-10.15`, `#/t/fa-3.4` (planned ideas have pages too) |
| `#/map` | zoomable map of everything; hover a node to light up its ancestry and descendants |
| `#/timeline` | every dated idea on one time axis, one lane per field |
| `#/bridges`, `#/bridge/<slug>` | curated walks that follow one idea across fields (e.g. Fourier, the spectral theorem) |
| `#/path/<id>` | prerequisite planner: everything an idea rests on, in learning order, with "I know this" ticks |
| `#/status` | written vs planned, collection by collection |

## Running locally

No build step is needed in the browser. You need Node ≥ 18.

```bash
npm run build        # generate data/ (index, per-collection shards, colours); rerun after editing content/
npm test             # numerical/source-follow-up regressions and generated-catalog integrity
npm run serve        # http://localhost:8173
npm run check        # validate content and run every visualization headless
node scripts/smoke.mjs   # load every kind of page headless and fail on console errors
npm run test:ui         # responsive layouts, keyboard/touch input, and navigation regressions
```

`npm run check` needs `npm install` (for `playwright-core` and pinned verification KaTeX assets) and a Chromium: it uses
`$CHROME_PATH`, a Playwright browser cache (`$PLAYWRIGHT_BROWSERS_PATH`) or a local Google
Chrome. Useful forms:

```bash
node scripts/check.mjs pma/4 --shots      # one chapter, screenshots in shots/
node scripts/check.mjs fa-3.4 --dark      # one result, dark theme
node scripts/check.mjs physics            # a whole field
node scripts/check.mjs --changed          # chapters changed relative to origin/main
node scripts/check.mjs --static           # schema and dependency checks only
node scripts/check.mjs --fail-on-warnings --report=/tmp/atlas-check.json
node scripts/check.mjs --modes --still --jobs=2 --timeout=60000 --report=/tmp/atlas-modes.json
node scripts/check.mjs --modes --still --jobs=2 --timeout=60000 --resume=/tmp/atlas-modes.json --report=/tmp/atlas-modes-resumed.json
node scripts/verification-status.mjs --check # reconcile source flags with the recorded queue
node scripts/verification-audit.mjs --check  # structural/dependency/bridge census; --strict also gates cross-field counts
node scripts/verification-source-evidence.mjs --check # reconcile primary-source dispositions with live flags
node scripts/verification-prerequisite-evidence.mjs --check # reviewed additions, syllabus mirrors and graph cycles
node scripts/verification-human-sample.mjs --check # current reproducible 5% sample; human review is separate
node scripts/verification-human-review-packet.mjs --check # worksheet matches the current sample and sources
node tests/verification-human-review-packet-browser.mjs # synthetic form persistence/export; grants no human credit
node tests/verification-followup-browser.mjs # named wave follow-ups, actual inputs in both themes
node tests/verification-audio.mjs          # native audio sources/signals; does not replace listening
node scripts/measure-map.mjs              # 60 fps evidence; run without competing CPU-heavy jobs
node scripts/report.mjs mech              # written / planned per chapter, unresolved references
```

The browser checks serve the pinned KaTeX renderer locally, so blocked browser access to
the CDN cannot silently turn formula checks into plain-text checks. The harness fails if
the renderer is unavailable. Source-review evidence and remaining master-plan gates are
tracked in [the verification checkpoint](docs/verification/waves-3-4.md).

Mode sweeps save the default view and individually exercise segmented/toggle alternatives
visible from that view. Conditional controls need the supplemental native pass recorded
in the verification checkpoint. Reports
checkpoint every 25 completed items. Resume reuses only passing items with unchanged
collection helpers and verification runtime; failures and changed collections run again.
Use a small worker count when sharing a machine with other browser or OCR jobs. The
optional timeout accommodates a shared machine; it does not establish redraw performance.

For collections importing another collection's helper, use a fresh report with
`node scripts/verification-external-browser.mjs tech --modes --still --fail-on-warnings --report=/tmp/tech-modes.json`
(add `--dark` for the other theme). This guards imported source hashes across the full
capture run; resume is deliberately unsupported for this supplement. The evidence census
rejects such collections when external-import evidence is missing or stale.

The bounded conditional-control inventory has its own capture and evidence tools:

```sh
node tests/verification-conditional-modes-browser.mjs --theme=light --report=/tmp/conditional-light.json
node tests/verification-conditional-modes-browser.mjs --theme=dark --report=/tmp/conditional-dark.json
node scripts/verification-conditional-evidence.mjs /tmp/conditional-light.json /tmp/conditional-dark.json --strict
```

Each capture process uses one browser worker. It follows newly revealed controls and
restores parent choices; independent sibling combinations and unrestricted continuous
inputs are outside its scope. Screenshot inspection and actual human review have separate
evidence. See [coverage and limits](docs/verification/conditional-control-coverage.md).

## Layout

```
index.html                    single-page app shell
assets/js/app.js              router, pages, search, theme
assets/js/graph.js            lineage graph, chapter graph, flow diagrams, global map
assets/js/viz/core.js         visualization runtime (stages, handles, controls, 3D, TeX labels)
assets/js/viz/math.js         numerics: integration, Fourier, linear algebra, complex numbers, …
assets/js/viz/kits/           higher-level building blocks (graphs, step-through players, tables)
content/fields.js             the 13 fields and their areas
content/<id>/collection.js    collection metadata (title, field, source or references, blurb)
content/<id>/syllabus.js      planned inventory of a collection (optional)
content/<id>/chNN*.js         one module per chapter (part files allowed)
content/bridges/<slug>.js     cross-field walks (slug, title, blurb, steps)
data/                         generated by scripts/build.mjs (not committed)
scripts/                      build, check, smoke test, report, local server
AUTHORING.md                  how to write an item and its visualization
docs/syllabus.md              how to write a syllabus
```

Adding a collection means adding a folder under `content/` with a `collection.js`; no code
changes are needed.

The generated light index uses lossless dictionary/column transport; consumers call
`decodeCatalog` from `assets/js/catalog.js` to recover item objects. Tags and statements
live in collection shards and load when search is used. The home page needs only the
index, including planned-paper summaries. Strict builds enforce its 300 KB gzip budget.

## Deploying

`.github/workflows/pages.yml` rebuilds the data and publishes the site with GitHub Pages on
every push to `main`. `.github/workflows/ci.yml` runs the build, static checks, unit tests, the
page smoke test and the visualizations of changed chapters on every other push and pull request.

## Caveats

This is an unofficial study companion, not affiliated with any author or publisher. All
statements and explanations are paraphrased; nothing here replaces the sources. Numbering and
dependency links were reconstructed and can be wrong: items flagged `verify: true` are the least
certain. Corrections are welcome: edit the item in `content/` and open a pull request.
