# Current-atlas readiness inventory (read-only)

The root-reported frozen-map runner pass does **not** establish current-atlas fidelity. Independent raw/pixel acceptance of that light-case runner result remains pending. The current catalog has the same 13,574 nodes and stored coordinates, but **23,955 edges rather than 23,364**. Its graph-derived node sizes, selection closures and label priority differ. A separately pinned current-data case is needed; changing only a directory environment variable is insufficient and currently fails the frozen index pin.

This is implementation/data inventory only. No browser, runner (including PREPARE), build, full-map, timing, content-module evaluation or source-content review ran. No runner, data or production file changed. BIGHIST3.5 received no review, retry, render, acceptance or source closure; whole-catalog/shard comparisons treat strings as opaque values. Source flags and the frozen exclusion are outside this audit.

## Exact comparison boundary

- Frozen fixture data: `/tmp/atlas-continuation/checkpoint5`, source `68aa4e24889ec290d8f90206c4441485389f7e26`. Actual successful prepared manifest: `/tmp/atlas-root-paired-selected-state/prepared.json`, SHA256 `7e3b9f912cf0623262262535764fc82c892f58049b195d7a4385944417e9b61a`.
- Later built data: `/tmp/atlas-continuation/checkpoint12`, exact `.commit` `94a77908068d8c6a3be5fbe10808d0910195facf`, matching `checkpoint-94a77908.md`. This is the continuation checkpoint12, **not** the older coordinator/checkpoint12.
- Accepted source audited: `b6ca416f8b95b8e93bd12b9973ab0999f6519942`. Relative to checkpoint12, its only content changes are inside visualization functions/imports in `content/pl/ch02.js`, `content/pl/ch02-b.js`, `content/cplx/ch01-b.js`. Build serialization fields are unchanged; `scripts/build.mjs` and `scripts/lib.mjs` are byte-identical. Private selected-shard harness files were added/changed after checkpoint12 and are audited at b6ca416f. No b6ca416f build was performed: checkpoint12's byte hashes below identify that artifact, not a newly generated root build. A new build changes `generated` timestamps even with identical serialized content.

Read sources: `scripts/build.mjs` serialization and layout; `assets/js/app.js` catalog/planned/shard installation; `assets/js/graph.js` MapView construction, radius/top/closure logic; `scripts/lib/map-paired-guarded-fixture.mjs`, `map-paired-selected-shard-fixture.mjs`, `map-paired-selected-shard.mjs`, `map-paired-quiescence.mjs`, `map-paired-font-census.mjs`; and `tests/map-paired-guarded-oracle.mjs`, all at b6ca416f. The actual prepared manifest's 98 non-private paths all match frozen bytes. Its eight source private modules also match b6ca416f exactly; the ninth private path is its generated selected-shard spec.

## Catalog and layout differences

| Measure | Frozen checkpoint5 | Checkpoint12 / applicable current metadata |
|---|---:|---:|
| Written / planned / all nodes | 6,684 / 6,890 / 13,574 | identical |
| Written→written edges | 11,845 | 12,436 |
| Written item dependencies on planned nodes | 540 | 540 |
| Planned consumer edges | 10,979 | 10,979 |
| All existing-endpoint model edges | 23,364 | 23,955 |
| Fields / collections / map rows | 13 / 85 / 88 | identical |
| Chapter flow pairs | 1,818 | 2,224 |
| Collection flow pairs | 429 | 535 |
| Field flow pairs | 81 | 82 |
| Bridges / paper count / written chapters | 15 / 450 / 450 | identical |

IDs, order, names, kinds, coordinates, tags, file/viz/verify metadata, pdeps, see-links, fields, collection records (including chapter bands/aliases), map rows/field boxes, planned bytes and bridge records all remain identical. Exactly **2,365 written item records** differ, and their only changed fields are `deps` (510 records), `anc` (1,304), `desc` (1,038), `depth` (630); counts overlap. The other changed top-level index fields are `generated`, `chapterEdges`, `collectionEdges`, `fieldEdges`. There are **592 added edges and one removal**, net +591 (2.530%): the removed opaque pair is `stoch-2.4 → popgen-2.4`. No added/removed node or reordered dependency-only difference accounts for the edge delta.

Chapter aggregation adds 407/removes 1 pairs and changes 26 surviving weights; collection aggregation adds 107/removes 1 and changes 41 weights; field aggregation adds 1/removes 0 and changes 26 weights. Their summed weights change respectively 4,243→4,834,1,621→2,212,2,285→2,876. These are different aggregation domains, not independent new edges.

The compact `map` JSON is identical (SHA256 `66411c2b2749e50a210e3f55d096d5ffa89ea83c55b9bbd32f9209f8670fb86a`). However MapView's actual radius formula `min(8,2.6+sqrt(desc)*.4)` yields **494 changed radii**. Its stable desc-sorted top80 list changes29 positions: `pma-7.1` enters and `pma-9.4` leaves. Node hit-test radii, selection descendants, edge geometry/bundles and GPU ownership/cost cannot be certified from coordinate identity. Ordered model-edge JSON SHA256 changes from `b74500c3374db3863ffc7824c139bd7b8d2168a774e6c928d54c437f75f96ad5` to `4cef46000f0ee8e1599ab50ce9aa949b0db37ba606322844ce67c1873a129b85`.

## Data pins and lazy shards

| Artifact | Frozen SHA256 | Checkpoint12 SHA256 |
|---|---|---|
| index.json | `c62d6beda2c317280aa99d107873d880a4b5c4fb6748113b8e9b45c5772cb1fd` | `0b32cdf702f2b2d9fab0d55d9f50975742beeebc14e5a29cfa56c69cd236dd3a` |
| home.json | `59320e87023b4ab08de38209b838e276c7cd2efd464b12d4ae43cd05f593e668` | `00033ce06cacd3893314b1d1d2935b8edee3d67cb05eb3c1188dcfc904268dbb` |
| planned.json | `9627cdd57f3131e3876efeeaf5ebe3d1f5d06f6450c1a104a6d1e028c1f8ebbd` | identical |
| atlas.css | `792d9bdaa2e9978863ff78a42a5d5d87e084b9f8d810941de07def487ddff29f` | identical |
| col/ladr.json | `4e516b7f74c31d76b1b6c52d6b24ee9f8e4692d924bd1527f53834feaec461ab` | identical |

Index bytes increase 2,284,685→2,311,429; home bytes 464,147→464,444. Home's changed top fields are `generated`, `items`, `home`, `fieldEdges`. Existing timestamps are2026-10-20T20:53:34.003Z and2026-10-21T00:33:13.195Z. Planned remains 572,377 bytes and generated CSS 11,584 bytes.

Of 85 collection shards, 29 differ; no record additions/removals or chapter-summary changes. Changed record-field totals: 195 `st`, 21 `scope`, 2 `links` (overlap allowed). Changed shard names: arch,art,astro,bighist,causal,cg,circ,climate,cm,cplx,crypto,dist,ecol,game,geog,ling,mat,ml,neuro,ode,pharm,pl,popgen,qinfo,rel,solid,sysbio,toc,xtal. This is byte/field inventory, not an assessment of these strings. Full before/after shard hashes are in the companion evidence. The paired route pins only LADR; unlisted requests fall through to the static server rooted at the selected fixture directory. A new current case must therefore pin the complete fallback tree too, especially if routes later request other shards or home data.

## Real selected LADR readiness

**The hydration count and exact payload hash do not change.** Both data sets contain 365 written LADR items, no planned LADR items, 365 detail records and 9 chapter summaries. The shard remains 116,559 bytes. The selected item is `ladr-2.30`; its name, statement, deps, x 448/y 2636, anc 10 and depth 8 are unchanged. Its readiness metadata SHA256 remains `55200351eca693897e2cc51612710ee6f9a301534b4196004e3d533d6942a86f`. Actual loader source `app.js` remains 84,566 bytes/SHA256 `c9058dfa4df306f90b71c5a90385f8567285471b5ba954b0d47812ceaa8cbc9d`. Accordingly the generated spec bytes can remain identical (`e8a0e7cba0f859ae8709eeb7db7ec8e609b7a9bc9dbe408e9b23ad0421dbcc7a`) when derived by the same fixture code from these byte-identical inputs and selected item name.

This does **not** make the full selected state identical. 258 LADR index records have changed `desc`. For the selected item, written-only `desc` is 960→1,163. Independently traversing the actual MapView relation over written+planned nodes gives ancestors 10→10 and descendants**2,892→3,442**. The sorted descendant-ID JSON SHA changes `f801852bd653511b8223376097978b352fce8d6d3925ca1565171081ff6aa583`→`efdbcc2017574190445a6d514c8c255075c9806d6c84f98956600a8d3f7ea8b0`. The selected DOM stats/highlight/resource history therefore need fresh current-state evidence despite identical missing→available shard hydration.

## Source and font identity

All **126 tracked production assets** in b6ca416f match checkpoint5 bytes, including every production JS/CSS/vendor asset; they also match checkpoint12. `index.html` is identical. Production graph SHA256 remains `9a8850528193c87e97deba14a387bebff3215e9e67569c125cac265e061f94fc`; core.js remains `a6fa1753d9d9e8b9a05a7161fffc58dfd53b27002d9d393a3266aeb96515fe73`. Thus the source-string transformations have the same production inputs, but their new data-dependent output requires its own case.

The successful prepared manifest has 107 served paths per variant: 98 fixture paths, 8 private source modules and 1 generated spec. Only `data/index.json` differs among its frozen fixture paths versus checkpoint12. All 68 parsed font-face blocks and 79 font-file hashes (Google-font WOFF2 plus KaTeX font formats) remain identical. The ordered fontSources JSON SHA256 is `fe147824268f713eafd267081c7350cd6720f6b21ee5d8ae188be4f10b73c34f`. The actual quiescence source's label-word sequence also matches exactly (SHA256 `7e4a15a924ffe451f24d12ab77e5df5b81f73557b6864363143bb1e72de45e6d`); its 296-character unique-string UTF8 SHA256 is `def1d487c07394d6c4b5a5f6e5601ec7093860b9cf41c27cb77e2f080e92d2d2`. Actual selected-role DOM inputs and styles are source-identical; computed FontFace status, actual network resolution and post-load quietness still require fresh observed evidence, not this inventory.

## Required separate current-atlas preparation

1. Preserve the successful frozen fixture and its result. Create a separately reviewed, explicitly pinned current case: exact source commit, exact existing checkpoint12 artifact or a separately generated immutable root build, full generated-data hashes, complete fallback source tree, font inputs and both variants' transformed served-byte manifests. Do not label a newly built timestamped index with checkpoint12's hash.
2. In the separate case, change the fixture's default/source provenance and exact index pin; the existing `pairedFixture` hard-rejects every index except `c62d6beda…`. Change the case's expected edges to 23,955; retain 13,574 nodes. Update corresponding source/model/tiny-test data-root pins: existing font-census, selected-shard model and selected-shard tiny utilities explicitly name checkpoint5. The actual LADR 365/9 checks, app/shard pins and payload hash need no relaxation or artificial count update.
3. Retain the strict one real GET/200 LADR hydration, initially absent metadata, exact merge and all catalog/layout/control/closure/trace/callback/network/resource identity guards. The current graph is the initial protected baseline; do not try to match it to the old graph or bypass changed fields. Pin the new ordered edge/metadata/closure hashes for preparation checks.
4. Preserve original-first execution and all twelve ordinal semantics, actual font census/fixed drain/quiet interval, no late callbacks/draws during transfer, exact cold/warm A0–A3 arrays, corresponding original/chunk traces/resource ownership, direct full DOM/Canvas comparison and stop-before-alternate on an original failure. Re-observe dimensions/transform on the separate case; unchanged source/layout supports the old intended geometry, not observed equality. Historical raw SHA `ea66776d…`, 7,493 events and 4,904 reset instances are frozen-case results, not values to bless a different catalog.
5. Keep MSAA 0, one input canvas, GL errors 0, three live models, 64,000,000 logical bytes, 8,000,000 mask bytes and 1,048,576 transport chunk limits and contiguous/hash-checked transfer intact. Recompute actual GPU/mask costs and all resource histories from the new graph. Frozen chunk peak 63,895,600 bytes leaves 104,400 bytes below its 64M cap; +591 net edges cannot establish that the new case fits. No budget increase or performance conclusion follows from this audit.
6. Review this separate preparation with source/tiny evidence before any later explicitly authorized map execution. The root-reported frozen one-case runner PASS applies only to its exact frozen inputs; independent raw/pixel acceptance remains pending. Current fidelity, lifecycle and timing remain unestablished here; neither a wider matrix nor timing is authorized by this report.

Evidence: companion `map-current-atlas-readiness-evidence.json`; full raw read-only inventory and helper at `/tmp/atlas-new-arch-source/current-atlas-readiness/`. Only this report and its evidence are committed. No tests were run: this boundary changes no implementation and explicitly forbids browser/full-map work.
