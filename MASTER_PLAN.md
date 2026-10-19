# Master plan: from *Rudin, visualized* to an atlas of human knowledge

> **Status:** waves 3–4 verification blocked on recorded gates; wave 5 has not started · **Scope:** the whole project ·
> AUTHORING.md stays the rulebook for writing items and gets field-specific extensions (§7).
>
> **Revision 2.** The scope widened from STEM theorems to *the breadth of human knowledge*:
> six more fields (Earth & environment, medicine, economics, social sciences, arts, humanities),
> item kinds beyond theorems (concepts, phenomena, methods, paradoxes, inventions, events), and
> the working name *Ideas, Visualized*. The §11 decisions have been made (see there).

## 0. The one-paragraph version

Today the site covers one subfield, analysis: 1,062 results from Rudin's three books, each with
an interactive picture, all wired into one dependency graph. The goal is the same treatment for
**the load-bearing ideas of human knowledge**. That means theorems and laws, but also models,
mechanisms, phenomena, methods, paradoxes and inventions, across 13 fields: mathematics,
statistics, computer science, physics, chemistry, Earth & environment, biology, medicine,
engineering, economics, the social sciences, the arts, and the humanities. That comes to **85
collections and roughly 12,500 ideas**, still in **one graph**. A reader can follow a single
chain from the completeness of ℝ through the spectral theorem to the hydrogen spectrum, from
Fourier series to the sampling theorem to MRI, from the harmonic series to equal temperament, or
from simple machines to the printing press to the internet. We get there in four steps. First,
generalise the engine so that adding a field means adding a folder, with no code edits (Phase 0).
Next, test the new schema on five pilots from five different fields (Phase 1). Then sketch the whole atlas as a graph of planned results before
writing any of them (Phase 2). Finally, fill that skeleton in four breadth-first waves (Phases
3–6). Alongside the waves, build the connective tissue that only an atlas can offer: cross-field
*bridges*, prerequisite paths, a zoomable map, and proof steppers (Phase 7).

---

## 1. Where we are

### Progress (updated as work lands)

| phase | state |
|---|---|
| 0 · Engine | done: registry and schema v2, catalog split (index + lazy planned + per-collection shards), routes, field pages, OKLCH colours, map v2 with field regions and LOD, treemap overview, timeline, bridges, prerequisite planner, runtime numerics (incl. complex linear algebra, generalized eigenproblems, split-step Schrödinger, Nelder–Mead, safe formula parser) and 17 kits (incl. scene3, circuit, quantum, icons), CI, smoke and unit tests |
| 1 · Pilots | LADR complete (ch. 1–9, 365 items); mechanics ch. 1–11 (ch. 12 in production); algorithms ch. 1–7; microeconomics ch. 1–6; music ch. 1–4 |
| 2 · Skeleton | done for all 85 collections (≈ 11,700 planned items from real tables of contents and syllabi, sources in each file header); cross-listings reconcile duplicates (`scripts/crosslist.mjs`, `scripts/dupes.mjs`) |
| 3 · Wave A (first chapters) | written: stat (1–3), qm (1–3), thermo (1–2), psych (1–2), behav (1–2), neuro (1–2), sig (1–2), epi (1–2), phil (1–2), astro (1–2), climate, popgen, game, info, nt, macro, pchem, toc, em, ling, ode, ecol, ctrl, art, comb, waves, geol, physio, demo, soc, fin, rel, polsci, prob, top, geog, alg, logic, graph, tech, bighist · in production: deep, polsci 2, arch, and more (about 20 chapters at a time) |
| Wave 1 (breadth first) | **COMPLETE (2026-10-16): all collections have their opening chapter; fact-check clusters A–G done; 3,737 items, 272 smoke routes, 0 errors.** Definition was: every one of the 81 collections has at least its opening chapter written, interactive and checked, plus the landmark papers whose chapters exist; then a fact-check pass, runtime promotions (v.nn, stereo sound, Wigner/Husimi, frame solver) and a final verification. Deeper chapters resume in wave 2. |
| Wave 2 (second chapters) | **COMPLETE (2026-10-16): every collection has chapters 1 and 2 (gaps filled: fluid 1, mathbio 1, stoch 1); fact-check clusters A–F done.** 56 chapters, about 680 items, each run headless in light, dark and mode variants with 0 quality warnings; 4,446 items in 300 chapters, 272 smoke routes, 0 errors. The fact-check corrected real errors (a wrong Vasicek sign, a wrong reflection formula in the wave equation, one wrong Karp-tree edge, a mixed-up Tyndall table, a haemoglobin extinction table, Rb-87 decay-constant credit, Buri effective size) and retuned the climate column to 2.6 K per doubling at fixed relative humidity (paper: 2.36 K). Still unverifiable and flagged `verify: true`: Palacios-Huerta penalty-kick table (game 2.8), snakes-and-ladders layout (stoch 2.6), Ashcroft–Mermin Hall and Lorenz tables (cm 2.5, 2.6), von Klitzing accuracy (cm 2.14), Buri details, textbook chapter pointers in `refs`. Open syllabus corrections: popgen ch2 dropped four unrelated `stoch-14.*` deps. |
| Wave 3 (third chapters) | **COMPLETE (first pass):** the next unwritten chapter of every collection is written (5,515 items in 368 chapters; build, static check and 272-route smoke test all clean). Authors verified credits and constants while writing; unconfirmable claims are softened and flagged `verify: true`. **Open follow-ups:** fact-check pass over wave-3 `verify: true` items; manual test of audio buttons (sig 3.15, music 7); syllabus fixes (popgen `stoch-14.*` deps, behav 4.1/4.4/4.6 deps, graph 4.2.7/4.2.8 should depend on 4.2.1a); tech 4.1 thrust-line scan 0.114 vs published 0.1075 (reuse `arch` ch3 engine); unverified tables in cm (Hall/Lorenz), game 2.8, stoch 2.6. |
| Wave 4 (next chapter of each collection) | **COMPLETE (first pass):** the next unwritten chapter of every collection is written (6,684 items in 450 chapters; build, static check and 272-route smoke test clean). Same verification rule as wave 3; any item with an unconfirmed credit or constant should carry `verify: true`, but a few chapters (climate 4, macro 4, circ 4, energy 4) left some unflagged and need a flagging pass. About 6,890 planned items remain in later chapters (wave 5 = next unwritten chapter of each of the 80 collections). **Open follow-ups:** fact-check pass over all `verify: true` items (waves 3 and 4); manual tests of audio buttons (sig 3.15, sig 4.12, music 7, music 8, physio 4.14, pde 4.2, ling) and of drag/click interactions; syllabus fixes (ecol 4.6 and 4.7 pictures; geo 4.5 spin-down factor; aero Ackeret reference; imaging `stoch-9.3` dep; ling 4 shared file is 590 KB of embedded texts — consider trimming); items cited as unverified in several chapters (e.g. climate 4, macro 4, circ 4 credits). |
| Papers | 450 landmark papers across all 13 fields in the syllabi, every citation checked (Crossref, archive.org, PubMed…), each linked to the ideas it introduced; `#/papers` with live filter, era grouping and timeline; "First published in" on idea pages; 72 papers written as interactive items so far (reproducing the original numbers), more as their chapters land |
| Search | one index over written and planned ideas, papers (title, authors, year), fields, collections, chapters, bridges; operators (kind:, field:, col:, year:, by:, is:), facets, typo tolerance; results on the map and timeline |
| 7 · Connective tissue | 8 bridges (Fourier, spectral theorem, fixed points, entropy, least action, random walk, contagion, symmetry); home-page chord diagram of cross-field dependencies |

**Verification checkpoint (2026-10-19, cloud checkout `8e9e930`):** the authorized source, numerical, dependency and browser review passes are recorded in [the verification checkpoint](docs/verification/waves-3-4.md) and [final gate report](docs/verification/final-wave-gates.json). Current light/dark captures cover 6688 visualizations per theme and the 106-item conditional-control inventory; final strict build, regressions, native audio instrumentation and measured map movement pass. The goal remains **blocked**: 243 source flags retain precise original-evidence gaps, 12 written non-math collections fall below 25 cross-field prerequisites, actual human review is 0/339 pages, and subjective audio listening remains pending. The 768 reviewed cross-field additions are integrated; no weak links were invented to meet a quota. The original analysis flags are resolved. Wave 5 has not started. The original open-follow-up lists above describe the starting state; the checkpoint records subsequent closures and limits.

**Sequential follow-up:** eleven source flags are closed and three prerequisite shortfalls are resolved. The live source queue has **232** remaining flags; **9** written non-math collections remain below 25 cross-field prerequisites. Human review remains **0/339**, subjective listening is pending, and Wave 5 has not started. [Hooke’s announcement and decipherment](docs/verification/hooke-original-source-review.md) now have primary-scan evidence. The earlier final-gate report is a historical checkpoint; fresh browser checks cover the changed visualizations.

- [Laitone original](docs/verification/laitone-primary-followup.md): closes aero-4.1 and fixes its invalid-pressure Mach readout.
- [König–Egerváry originals](docs/verification/konig-egervary-primary-followup.md): corrects the independence claim and closes algo-11.12.
- [Klee–Minty original and coefficient comparison](docs/verification/klee-minty-primary-followup.md): closes algo-11.22 with an explicit all-dimension proof and stronger regression checks.
- [LP complexity](docs/verification/lp-complexity-primary-followup.md): corrects the barrier schedule and verifies Karmarkar's original; the [Khachiyan follow-up](docs/verification/khachiyan-original-source-review.md) closes the scoped overview gap and corrects the Newton gradient.
- [Dijkstra original](docs/verification/dijkstra-primary-followup.md): closes dist-4.13, splits a falsely atomic conditional write and states the limits of its finite-state checks.
- [Transistor original](docs/verification/transistor-primary-followup.md): closes circ-4.14 and separates the original device reports from the illustrative model.
- [Sheffer and Peirce originals](docs/verification/sheffer-peirce-primary-followup.md): closes circ-4.9 with precise NOR/NAND attribution and qualified manuscript dating.
- [Lehmann–Rabin original](docs/verification/lehmann-rabin-primary-followup.md): closes dist-4.6/4.7, restores individual fork operations and distinguishes progress from starvation freedom.
- [Louisville Census reconciliation](docs/verification/louisville-census-followup.md): closes soc-4.13 by identifying the displayed two-place aggregate and its official component counts.
- [Demography prerequisite](docs/verification/demo-prerequisite-followup.md): replaces the planned least-squares link with its exact written treatment, reaching 25 qualifying edges.
- [Thrust-network uniqueness](docs/verification/arch-thrust-prerequisite-followup.md): supplies the positive-definite matrix prerequisite, fixes negative diagonal forces and reaches 25 edges for architecture.
- [Calibration](docs/verification/behav-calibration-followup.md): supplies conditional-probability and independence prerequisites, corrects the binomial benchmark and reaches 25 edges for behavioural economics.

The [human-review and listening handoff](docs/verification/listening-review-handoff.md) links the prepared 339-page human worksheet and 50-page listening worksheet. The listening inventory shares its target selection with the native audio checks and records actual reviewer observations; generation and synthetic form tests grant no review credit.

**Reviewer instruction (2026-10-19):** the user directs the agent to perform the sample review ("you review"). Review the same 339 pages and record agent findings, corrections and field-guide feedback separately. This replaces the requested reviewer for this follow-up without relabelling agent work as human review. Distinguish direct audio perception from signal/playback instrumentation. The agent review is in progress.

The [agent sample record](docs/verification/agent-sample-review.json) contains **339 semantic text reviews**, **336 visual inspections** and **thirty-seven instrumented interaction reviews**. All 336 sample visualizations have a first visual inspection; three definitions have none. These are separate work-in-progress measures, not 339 completed full-page reviews. Initial findings remain recorded alongside corrections, and field-guide feedback is integrated.

The [default-mode control baseline](docs/verification/agent-controls-review.md) covers all 336 sampled visualizations; three sampled definitions have no visualization. Focused checks cover subsequent changes. [Capture anomalies](docs/verification/agent-capture-anomalies.md) are recorded separately from confirmed product defects; passing runtime checks alone do not establish visual correctness.

Corrected sample findings include:

- Statements and proofs: [nineteen hypothesis/caption corrections](docs/verification/agent-text-hypotheses-review.md), [primitive-root lifting](docs/verification/agent-primitive-root-review.md) and [diatonic rotations](docs/verification/agent-diatonic-review.md) and [Minkowski gauge geometry](docs/verification/agent-minkowski-gauge-review.md) and [polygonal path budgets](docs/verification/agent-polygon-path-review.md) and [complex function ideals and positivity](docs/verification/agent-ideal-squares-review.md) and [point evaluation versus local averages](docs/verification/agent-point-evaluation-review.md) and [continuous approximation in L2](docs/verification/agent-l2-density-review.md) and [linear-algebra zero and field cases](docs/verification/agent-linear-edge-review.md) and [regular-singular branches and resonances](docs/verification/agent-frobenius-review.md) and [zero functionals and extension boundaries](docs/verification/agent-dual-boundary-review.md).
- Mathematical models: [Planck response](docs/verification/agent-planck-review.md), [classical versus weak Gauss density](docs/verification/agent-gauss-density-review.md), [buoyancy linearization](docs/verification/agent-buoyancy-review.md), [filter cancellation](docs/verification/agent-fir-review.md), [rational facets](docs/verification/agent-rational-facets-review.md) and [electron spatial spinors/projections](docs/verification/agent-electron-spin-review.md) and [restricted helium products versus correlation](docs/verification/agent-helium-correlation-review.md).
- Computation and interpretation: [optimization grid residuals](docs/verification/agent-optimization-grid-review.md), [spaced-seed expectations](docs/verification/agent-spaced-seeds-review.md),
  [type candidates](docs/verification/agent-type-candidates-review.md), [fixed area-rule reference](docs/verification/agent-area-reference-review.md),
  [local small-world routing](docs/verification/agent-small-world-routing-review.md), [coordinate midpoint rates](docs/verification/agent-coordinate-midpoint-review.md) and [population positivity versus sampled overlap](docs/verification/agent-positivity-review.md) and [childhood mortality contributions](docs/verification/agent-childhood-mortality-review.md) and [confounding and causal targets](docs/verification/agent-confounding-review.md) and [ChaCha original and sampling scope](docs/verification/chacha-original-source-review.md) and [quicksort exact counts and rounding](docs/verification/agent-quicksort-count-review.md) and [fixed-size learning guarantees](docs/verification/agent-learning-bound-review.md) and [noisy-label risk and empty ERM choices](docs/verification/agent-erm-risk-review.md) and [renewal iteration indices and grid errors](docs/verification/agent-renewal-iteration-review.md).
- Signals and playback: [full-buffer spectrum analysis](docs/verification/agent-spectrum-review.md), the [articulation noise gate](docs/verification/agent-articulation-review.md) and [causal time advance](docs/verification/agent-causal-advance-review.md). Subjective listening is still unsupported in this runtime.

The corrected derivations supply directly used prerequisites, bringing integrated additions to **777**. Linguistics now has **22** qualifying written cross-field dependencies, leaving three below its target. The live source queue still has **232** original-evidence gaps, nine collection prerequisite shortfalls remain, and Wave 5 has not started.

### Where we started


| | |
|---|---|
| Content | 3 collections (PMA 364, RCA 388, FA 310 items) · 45 chapters · 181 content modules · ~77k lines |
| Item kinds | 661 theorems, 56 corollaries, 35 lemmas, 24 propositions, 286 definitions; every non-definition has a `viz` |
| Engine | static SPA (`index.html`, `assets/js/app.js`, `graph.js`), viz runtime (`viz/core.js` 2D/3D stages, controls, TeX; `viz/math.js` numerics), build to `data/catalog.json` (737 KB), headless checker with screenshots |
| Pace | the full trilogy was produced in ~3 days of agent-driven work (Oct 12–14), then a numbering-verification pass |

**What is hard-wired to "three Rudin books"** (Phase 0 removes all of it):

- `scripts/lib.mjs:7` `BOOKS`, `:12` `KINDS`, `:13` `ID_RE = /^(pma|rca|fa)-…/`, `:14` `NUM_RE` (two-level only)
- `scripts/build.mjs:52` hand-written map `ROWS`; a single monolithic catalog
- `assets/js/app.js`: `BOOK_INFO`, `BOOK_SHORT`, `bookIdx`, `chapterLabel` (the RCA Prologue special case), search tokens `pma|rca|fa`, homepage copy
- `assets/js/graph.js`: `BOOK_VAR`, `BOOK_SHORT`, `renderFlow` defaulting to three columns, map filter checkboxes, per-book edge colours
- `assets/css/style.css:37–39, 151–153`: `--c-pma/rca/fa` and `[data-book=…]` rules
- `index.html`: brand, `<title>`, meta description, nav links, footer
- `scripts/check.mjs:33` `findBrowser` knows only macOS paths, not `PLAYWRIGHT_BROWSERS_PATH` or Linux

**Lessons from the trilogy build that shape this plan**

1. **Agents can produce at volume; verification is the bottleneck.** Seven of the last twenty
   commits are renumbering fixes ("checked against Google Books snippets"). New collections
   should prefer sources whose numbering we can actually check (open-access texts) or our own
   numbering.
2. **Unknown-id dependencies were tolerated and reconciled later.** That works for three books
   but not for fifty-nine. We need the planned ids to exist *before* authors cite them, hence the
   skeleton phase.
3. **The quality bar (AUTHORING §2) is what makes the site worth visiting.** Scaling 10× must
   not dilute it. Hence pilots before mass production, plus automated and reviewer gates.

---

## 2. Vision and principles

**Product.** *Ideas, Visualized*: an atlas of the load-bearing ideas of human knowledge. Each
idea gets a faithful statement, an interactive picture you can push on, the reason it is true or
the way it works, and its place in a single cross-field dependency graph. The Rudin trilogy becomes the **Analysis** shelf of the
Mathematics field and keeps its identity and URLs.

Principles:

1. **One graph.** Deps cross collection and field boundaries whenever a derivation really uses
   another result: Gauss's law ← divergence theorem; uncertainty principle ← Cauchy–Schwarz and
   the Fourier transform; Nyquist stability criterion ← argument principle (RCA 10). The
   cross-field edges are the product.
2. **Every result is testable on screen.** The AUTHORING §2 bar applies in every field. Each
   field translates "break a hypothesis" in its own way: in physics you leave the regime of
   validity, in CS you feed the adversarial input, in statistics you violate an assumption and
   watch coverage collapse, in engineering you push a gain past the stability boundary.
3. **Honest computation.** Simulations use integrators that respect the physics (symplectic for
   Hamiltonian systems), probability is shown with seeded samples next to the exact law, and
   algorithms really run on the reader's input.
4. **Measurable completeness.** Every collection has a published syllabus, so "done" is a
   number, not a feeling.
5. **Stable ids forever.** `pma-4.19` never changes. Curated collections never renumber, they
   only append.
6. **Static, fast, offline-friendly.** No server and no build step in the browser. The atlas
   must stay snappy at 10k nodes.

---

## 3. Information architecture

```
Field (13)         Mathematics · Statistics & Data Science · Computer Science · Physics & Astronomy
                   · Chemistry & Materials · Earth & Environment · Biology · Medicine & Health
                   · Engineering · Economics & Finance · Social & Behavioral Sciences
                   · Arts, Music & Design · Humanities
  └ Area           e.g. Mathematics → Analysis · Algebra · Geometry & Topology · Probability
                   · Discrete · Logic · Applied & Computational
      └ Collection e.g. pma, rca, fa · ladr · mech · algo      (a "book" generalised)
          └ Chapter
              └ Item  <collection>-<num>, e.g. pma-4.19, mech-5.3, algo-12.4, prob-2.4.1
```

**Two kinds of collection**

| type | numbering | completeness promise | when to use |
|---|---|---|---|
| **book-anchored** | follows the book (`prob-2.4.1` = Durrett Thm 2.4.1) | every numbered theorem/lemma/corollary/proposition + key definitions | a canonical, theorem-numbered text exists, **preferably open access** so numbers can be verified |
| **curated course** | our own syllabus, `chapter.n`, append-only | every result in the published syllabus | everywhere else, especially physics, chemistry, biology and engineering, where texts number equations, not results. Each item carries `refs` to 1–3 standard texts |

**Routes** (old ones redirect):

| route | page |
|---|---|
| `#/` | atlas home: field cards, cross-field flow, the longest chain in STEM, load-bearing results, featured bridges |
| `#/f/<field>` | field page: areas, collections, the flow between collections |
| `#/c/<col>` · `#/c/<col>/<ch>` | collection and chapter (replaces `#/book/…`, which redirects) |
| `#/t/<id>` | a result (unchanged) |
| `#/map` | atlas map with semantic zoom (field, then collection, chapter, result) |
| `#/bridge/<slug>` | a cross-field narrative (§8) |
| `#/path/<id>` | "everything you need for X": prerequisite planner (§8) |
| `#/status` | coverage dashboard: planned / written / reviewed / verified per collection |

---

## 4. Phase 0: the atlas engine (generalise, no new content)

**Acceptance test:** add a dummy collection `content/zzz/` with a `collection.js` and one
chapter. It shows up on the home page, field page, map, search and status with **zero code
edits**. The Rudin content renders exactly as before (same 1,062 items, same screenshots).

### 4.1 Registry, schema v2

```
content/fields.js            fields → areas: id, title, hue, blurb, order
content/<col>/collection.js  collection metadata (below)
content/<col>/syllabus.js    planned inventory (Phase 2), optional
content/<col>/chNN*.js       chapters, as today
content/bridges/<slug>.js    cross-field narratives (Phase 7)
```

```js
// content/mech/collection.js
export default {
  id: 'mech', short: 'MECH', title: 'Classical Mechanics',
  field: 'physics', area: 'mechanics', order: 10,
  source: { type: 'course', refs: ['Taylor, Classical Mechanics (2005)', 'Goldstein, Poole & Safko 3e', 'Arnold, Mathematical Methods of Classical Mechanics', 'Tong, Lectures on Classical Dynamics'] },
  // book-anchored: source: { type: 'book', author, title, edition, license, url }
  blurb: String.raw`…`,
  chapterLabels: {},            // e.g. rca: { 0: 'Prologue' }
  mapRows: null,                // optional split of a long collection into map rows, e.g. rca: [[0,9],[10,20]]
};
```

Item schema changes (all optional except `kind`):

| field | change |
|---|---|
| `kind` | add **Law, Principle, Postulate, Algorithm, Model, Concept, Phenomenon, Method, Paradox, Hypothesis, Invention, Event** to Theorem/Lemma/Corollary/Proposition/Definition |
| `num` | allow three-level (`2.4.1`) and lettered appendices (`A.3`): `^([A-Z]\|\d{1,2})(\.\d{1,3}){1,2}[a-z]?$` |
| `refs` | pointers into standard texts: `['Griffiths 4e §2.2.1', 'Feynman II-4']` |
| `scope` | regime of validity for laws and models ("non-relativistic, point masses"), rendered as a box |
| `credit` | discoverer and year ("Noether, 1918") |
| `links` | `{ wikipedia, mathlib, nlab }`: external cross-references; Mathlib names checked by script (stretch) |

Chapter files rename the key `book:` to `collection:` in one mechanical commit; ids are untouched.

### 4.2 Build and data

- `scripts/lib.mjs` loads the registry and derives `ID_RE` from it. Collection ids match
  `^[a-z][a-z0-9]{1,7}$`.
- **Split the catalog.** `data/index.json` holds the registry, chapters and light item records
  (id, num, kind, name, deps, see, x/y, stats, flags). `data/col/<id>.json` holds statements and
  tags, lazy-loaded for tooltips, search and pages. Budget: index ≤ 300 KB gzipped at 10k items.
- Map layout generalised from the hard-coded `ROWS` (§4.4).
- Collection colours come from the registry. Each field has a hue family; its collections are
  OKLCH shades within it, with light and dark variants, emitted as CSS custom properties.
  `[data-book]` becomes `[data-col]`, with the colour set inline or in a generated stylesheet.
- Coverage statistics for `#/status` (planned/written/reviewed/verify-flagged).

### 4.3 App

- Nav: a **Fields** menu, plus Map, Bridges, About. The brand changes to *Theorems, Visualized*
  and the Analysis shelf keeps "Rudin" in its copy.
- Home: field cards with progress bars; a cross-field flow (fields as columns, chapters on
  hover); the longest chain across the atlas; load-bearing results per field; "new this week".
- Search: field and collection filters (`qm`, `physics:`), LaTeX-insensitive name matching,
  "uses:pma-4.19" queries.
- Theorem page: `refs`, `scope`, `credit` and `links` blocks. "Across the books" becomes
  **Across fields**.

### 4.4 Map v2 (semantic zoom)

The geographic-atlas metaphor: **fields are continents, collections countries, chapters
provinces, results towns.** Collections are placed by a layered layout of the
collection-to-collection dependency graph, with foundations on the left and applications on the
right, grouped into field regions. Inside a collection, the existing per-chapter column/barycentre
layout is reused. Rendering uses Canvas2D with level of detail: zoomed out, collections are blobs
with bundled edges; zoomed in, individual nodes and edges are culled to the viewport. If 10k nodes
and ~30k edges can't hold 60 fps, move to WebGL. Phase 2's ghost nodes give a full-size stress
test before the content exists.

### 4.5 Viz runtime: first additions (cheap, widely needed)

- Stage: `xlog`/`ylog` axes, polar axes, a colour-bar legend for `heat`, a histogram helper.
- `v.M`: FFT (1D/2D, complex and real); n×n linear algebra (LU with pivoting, QR, Jacobi
  symmetric eigen, QR-iteration eigen with complex eigenvalues, n×n SVD, least squares, matrix
  exponential); probability distributions (pdf/cdf/quantile/sample for normal, binomial,
  Poisson, exponential, gamma, beta, χ², t).
- Field kits come later and just in time (§6).

### 4.6 Tooling and CI

- `check.mjs`: targets by field and collection (`physics`, `mech/5`); `findBrowser` honours
  `PLAYWRIGHT_BROWSERS_PATH` and Linux paths; a `--changed` mode (git-diff based).
- New automatic gates in the harness: at least one control or handle (interactivity), a readout
  present, redraw time budget, no console errors, nothing drawn outside the canvas.
- `scripts/smoke.mjs`: every route renders without console errors (home, field, collection,
  chapter, theorem, map, status, bridge).
- A PR workflow running `build --strict`, `check --static`, smoke tests, and a headless run of
  changed chapters. Pages deploy stays on `main`.

---

## 5. The atlas: fields, collections, and what we visualize

Estimates are planning numbers. Anchors marked † are open-access or freely available, which
makes numbering verifiable; licences get confirmed before we commit to an anchor. **B** = book-anchored, **C** = curated
course with refs.

### 5.1 Mathematics (21 collections, ≈ 4,560 items; `game` moved to economics)

| id | collection | type · anchor / refs | est. | flagship visualizations | key cross-links |
|---|---|---|---|---|---|
| `pma` `rca` `fa` | Analysis (Rudin trilogy) | B · existing | 1,062 | (done) | everything |
| `ladr` | Linear algebra | B · Axler, *Linear Algebra Done Right* 4e† | 300 | span/dimension by dragging vectors; eigenvectors as invariant directions of a draggable map; Gram–Schmidt step by step; spectral theorem as ellipse axes; SVD as rotate-stretch-rotate; Jordan chains | FA 12, RCA 4, `qm`, `stat`, `mech` normal modes |
| `alg` | Abstract algebra | B · Judson, *Abstract Algebra: Theory and Applications*† | 250 | dihedral groups acting live; Cayley graphs; cosets colour the group (Lagrange); Sylow counting; Galois correspondence flipping the lattice; RSA from Euler's theorem | `nt`, `crypto`, `rep`, `xtal` |
| `rep` | Representation theory | C · Fulton–Harris, Serre | 100 | character tables; orthogonality as dot products; irreps of Dₙ on functions on a polygon; Fourier analysis on finite groups | `alg`, RCA 9, `qchem` symmetry |
| `top` | Topology | C · Munkres, Hatcher | 300 | gluing squares into torus, Klein bottle and ℝP²; cover games for compactness; Urysohn functions; loops deforming in π₁; path lifting in covering spaces; Brouwer via no-retraction | PMA 2, RCA 2, FA 1, `dg` |
| `dg` | Differential geometry of curves & surfaces | C · do Carmo, Pressley | 180 | Frenet frame riding a space curve; Gauss map; principal curvatures; Theorema Egregium (bend the surface, K stays); geodesics; Gauss–Bonnet angle sums | `mech`, `rel`, `mfd` |
| `mfd` | Manifolds & Riemannian geometry | C · Lee (smooth, Riemannian) | 150 | flows of vector fields; Lie bracket as an unclosed parallelogram; forms and Stokes; de Rham on the punctured plane; curvature; Hopf–Rinow | PMA 10, `rel`, `mech` (symplectic) |
| `vcalc` | Vector calculus | C · Marsden–Tromba, Schey *div grad curl* | 100 | div and curl as flux and circulation densities; live flux counters for Green, Stokes and divergence; path independence; Helmholtz decomposition | PMA 10, `em`, `fluid` |
| `ode` | ODEs & dynamical systems | B · Teschl, *ODEs and Dynamical Systems*† (or C: Hirsch–Smale–Devaney, Strogatz) | 220 | Picard iterates converging; Grönwall envelopes; phase portraits and Hartman–Grobman; Poincaré–Bendixson limit cycles; bifurcation diagrams; Lyapunov functions; Lorenz chaos | PMA 9 contraction, `mech`, `ctrl`, `mathbio`, `kin` |
| `pde` | Partial differential equations | C · Evans, Strauss | 180 | heat smoothing and the maximum principle; d'Alembert and domains of dependence; mean-value property; separation of variables; characteristics; CFL condition | PMA 8, RCA 9, FA 7–8, `em`, `fluid`, `qm` |
| `prob` | Probability | B · Durrett, *Probability: Theory and Examples* 5e† | 350 | running means (LLN); histograms converging to the bell curve (CLT); Borel–Cantelli; characteristic functions; random-walk recurrence in d = 1, 2, 3; martingale convergence; building Brownian motion | RCA 1–8 (deep), `stat`, `thermo`, `stoch` |
| `stoch` | Stochastic processes | C · Norris, Levin–Peres–Wilmer† | 200 | Markov chains mixing (TV-distance curves); Perron–Frobenius; coupling; hitting times; Poisson processes; queues and Little's law; Itô (pathwise) | `prob`, `algo`, `mathbio`, `kin` |
| `graph` | Graph theory | B · Diestel, *Graph Theory*† | 250 | Euler tours; Menger/max-flow on editable graphs; Hall's theorem via augmenting paths; planarity and Kuratowski; a playable R(3,3)=6; Turán graphs; giant component in random graphs | `algo`, `comb`, `circ`, `bioinf` |
| `comb` | Combinatorics | C · Stanley EC1, Aigner, Alon–Spencer | 180 | animated bijections; Catalan families; inclusion–exclusion; Pólya counting with necklaces; probabilistic method; Sperner/LYM | `graph`, `prob` |
| `nt` | Number theory | C · Hardy–Wright, Ireland–Rosen, Apostol | 200 | Euclid's algorithm as rectangle tiling; quadratic reciprocity by lattice points; Pell equations and continued fractions; Gauss circle problem; prime number theorem and zeta zeros | FA 9 (PNT), RCA 10, `alg`, `crypto` |
| `logic` | Logic & foundations | C · Enderton, Smullyan, Kunen | 120 | Cantor diagonal; ordinals as nested pictures; truth tables and completeness; compactness; a Gödel-numbering machine; Löwenheim–Skolem; Zorn/choice | `toc`, `pl`, RCA (maximality) |
| `num` | Numerical analysis | C · Süli–Mayers, Trefethen *ATAP* | 150 | Runge vs Chebyshev nodes; Newton basins; quadrature error rates on log–log axes; stability regions of ODE solvers; floating-point traps | PMA 7 (Weierstrass), `ode`, `nla` |
| `nla` | Numerical linear algebra | C · Trefethen–Bau | 120 | Householder QR step by step; conditioning as ellipse distortion; power iteration; CG convergence; SVD image compression | `ladr`, `ml`, `opt` |
| `opt` | Optimization | C · Boyd–Vandenberghe†, Nocedal–Wright | 150 | separating hyperplanes; gradient-descent trajectories and rates; KKT geometry; LP duality; simplex walking vertices; interior-point central path | FA 3 (Hahn–Banach), `ml`, `ctrl`, `game` |
| `game` | Game theory & social choice | C · Osborne, Maschler–Solan–Zamir | 80 | minimax via separation; Nash via Brouwer; Gale–Shapley stable matching; Shapley value; Arrow's impossibility; VCG mechanisms | `opt`, `top`, `graph` |

### 5.2 Statistics & data science (4 collections, ≈ 580)

| id | collection | type · refs | est. | flagship visualizations | cross-links |
|---|---|---|---|---|---|
| `stat` | Statistical inference | C · Casella–Berger, Wasserman | 200 | Cramér–Rao bound against estimator spread; Neyman–Pearson and ROC curves; CI coverage accumulating over 1,000 repeats; bootstrap; conjugate Bayesian updating; regression as projection | `prob`, `ladr`, `ml` |
| `ml` | Learning theory | B · Shalev-Shwartz & Ben-David† | 200 | VC shattering game; PAC sample complexity; no-free-lunch; perceptron convergence; SVM margins; kernels; boosting; SGD rates | `opt`, `stat`, `prob` |
| `deep` | Deep learning theory | C · Goodfellow et al., Prince *UDL*† | 100 | universal approximation by summed sigmoids; backprop as the chain rule on a graph; vanishing gradients; double descent; attention as soft lookup; convolution equivariance | `ml`, `opt`, `ladr` |
| `causal` | Causal inference | C · Pearl, Hernán–Robins† | 80 | d-separation on editable DAGs; back-door adjustment; Simpson's paradox; instruments; randomization | `stat`, `graph` |

### 5.3 Computer science (8 collections, ≈ 1,260)

| id | collection | type · refs | est. | flagship visualizations | cross-links |
|---|---|---|---|---|---|
| `algo` | Algorithms | C · CLRS 4e, Erickson† (CC BY), Kleinberg–Tardos | 300 | sorting with comparison counters against the decision-tree lower bound; recursion trees (master theorem); Dijkstra/Bellman–Ford/A*; MST cut property; max-flow min-cut; DP tables filling; potential-function amortization; FFT butterflies | `graph`, `opt`, `cplx`, RCA 9 |
| `toc` | Theory of computation | C · Sipser | 200 | DFA ↔ NFA ↔ regex conversions; pumping-lemma game; Myhill–Nerode classes; CFG parse trees; Turing machines running; undecidability diagonal; Rice; Cook–Levin | `logic`, `cplx` |
| `cplx` | Computational complexity | C · Arora–Barak† (draft) | 150 | reduction chains (3SAT → CLIQUE → …); hierarchy theorems; randomized classes; interactive proofs; PCP and hardness of approximation | `toc`, `algo`, `crypto` |
| `info` | Information & coding theory | C · Cover–Thomas, MacKay† | 180 | entropy and Huffman trees; Kraft inequality; typical sets (AEP); capacity; noisy-channel coding by simulation; Hamming codes and syndromes; rate–distortion | `prob`, `thermo`, `sig` |
| `crypto` | Cryptography | C · Katz–Lindell, Boneh–Shoup† | 150 | one-time pad perfect secrecy; Diffie–Hellman; RSA; elliptic-curve chord-and-tangent law; birthday bound; zero-knowledge 3-colouring; LWE lattices | `nt`, `alg`, `cplx` |
| `dist` | Distributed computing | C · Lynch, Attiya–Welch | 80 | Lamport and vector clocks; FLP bivalence; Paxos/Raft invariants step by step; Byzantine 3f+1; gossip spread | `graph`, `prob` |
| `pl` | Programming languages & types | C · Pierce *TAPL* | 100 | λ-reduction graphs; Church–Rosser diamonds; progress and preservation; Curry–Howard proof trees ↔ programs; Hindley–Milner unification | `logic`, `toc` |
| `cg` | Geometry & graphics | C · de Berg et al., Pharr–Jakob–Humphreys† | 100 | de Casteljau/Bézier; Voronoi/Delaunay empty circles; convex hull algorithms; aliasing; Monte Carlo rendering equation; quaternion rotations | `algo`, `sig`, `ladr` |

### 5.4 Physics & astronomy (10 collections, ≈ 1,580; `geo` moved to Earth & environment)

| id | collection | type · refs | est. | flagship visualizations | cross-links |
|---|---|---|---|---|---|
| `mech` | Classical mechanics | C · Taylor, Goldstein, Arnold, Tong† | 220 | Kepler orbits and the effective potential; Euler–Lagrange; Noether (drag a symmetry, watch the conserved quantity); normal modes; tumbling about the intermediate axis; Liouville (phase-space area conserved); Poincaré sections; double-pendulum chaos | `ode`, `ladr`, `vcalc`, `mfd` |
| `em` | Electromagnetism | C · Griffiths, Purcell, Feynman II† | 220 | field lines by superposition; Gauss's law with draggable surfaces; Laplace and the method of images; multipoles; Biot–Savart; Faraday induction; Maxwell to EM waves; Poynting theorem; radiation | `vcalc`, `pde`, RCA 11, `rel` |
| `waves` | Waves & optics | C · Hecht, Crawford | 120 | beats; standing waves; dispersion and group velocity; double slit; gratings; Fraunhofer diffraction as a Fourier transform; Snell from Fermat; polarization | `em`, `sig`, RCA 9 |
| `thermo` | Thermodynamics & statistical mechanics | C · Schroeder, Callen, Kardar, Tong† | 200 | Carnot cycles on PV diagrams; Boltzmann distribution from counting; equipartition; a kinetic-theory gas; Maxwell–Boltzmann speeds; Ising model by Metropolis with a phase transition; Planck's law; Legendre transforms | `prob`, `info`, `opt`, `pchem` |
| `qm` | Quantum mechanics | C · Griffiths, Sakurai, Hall | 250 | wave packets and dispersion; uncertainty as a Fourier pair; box and oscillator eigenstates; tunnelling; hydrogen orbitals; Bloch sphere; sequential Stern–Gerlach; perturbation theory; variational principle; Bell inequalities | `ladr`, FA 12–13, RCA 9, `waves` |
| `rel` | Special & general relativity | C · Taylor–Wheeler, Schutz, Carroll† | 150 | Minkowski diagrams with draggable boosts; twin paradox; four-momentum collisions; equivalence principle; Schwarzschild orbits and perihelion precession; light bending; GPS clocks; gravitational waves | `mech`, `em`, `dg`, `mfd` |
| `astro` | Astrophysics & celestial mechanics | C · Carroll–Ostlie, Murray–Dermott | 100 | Lagrange points; virial theorem; Jeans instability; hydrostatic equilibrium; Chandrasekhar limit; Saha equation; Friedmann expansion; Roche limit | `mech`, `thermo`, `rel` |
| `fluid` | Fluid dynamics | C · Acheson, Kundu | 120 | Bernoulli; Kelvin circulation; potential flow by conformal maps; Joukowski airfoil and Kutta–Joukowski lift; Reynolds number and Stokes flow; boundary layers; Kelvin–Helmholtz | `vcalc`, `pde`, **RCA 14 (conformal mapping)** |
| `cm` | Condensed matter | C · Ashcroft–Mermin, Kittel | 100 | reciprocal lattices; Bloch's theorem; tight-binding bands; Fermi surfaces; phonon dispersion; Drude model | `qm`, `xtal`, `ladr` |
| `qinfo` | Quantum information | C · Nielsen–Chuang | 100 | gates as Bloch-sphere rotations; CHSH violation; no-cloning; teleportation circuit; Deutsch–Jozsa; Grover as a rotation; Shor's period finding; bit-flip code | `qm`, `ladr`, `cplx`, `nt` |
| `geo` | Earth & climate physics | C · Vallis, Pierrehumbert | 80 | Coriolis and inertial circles; geostrophic balance; Ekman spiral; greenhouse layer model; Milankovitch cycles; Lorenz-63 | `fluid`, `thermo`, `ode` |

### 5.5 Chemistry (4 collections, ≈ 480)

| id | collection | type · refs | est. | flagship visualizations | cross-links |
|---|---|---|---|---|---|
| `pchem` | Physical chemistry: thermodynamics & equilibrium | C · Atkins, McQuarrie–Simon | 180 | van der Waals isotherms and the critical point; phase diagrams and Clausius–Clapeyron; ΔG and K; Le Chatelier; Raoult/Henry; Nernst equation; Gibbs phase rule | `thermo`, `kin` |
| `kin` | Chemical kinetics | C · Houston, Steinfeld | 100 | integrated rate laws; Arrhenius and Eyring; steady-state approximation; Lindemann; Michaelis–Menten; Brusselator/BZ oscillations; Gillespie vs mass-action | `ode`, `stoch`, `sysbio` |
| `qchem` | Quantum chemistry & spectroscopy | C · Szabo–Ostlund, McQuarrie | 120 | LCAO and H₂⁺ bonding/antibonding; Hückel π systems as eigenproblems; particle-in-a-box dyes; selection rules; rotational–vibrational spectra; Franck–Condon | `qm`, `ladr`, `rep` |
| `xtal` | Crystallography | C · Hammond, Giacovazzo | 80 | Bravais lattices; point and space groups; Miller indices; Bragg's law; Ewald sphere; diffraction as a Fourier transform; systematic absences; Penrose tilings | `alg`, `rep`, `waves`, `cm` |

### 5.6 Biology (5 collections, ≈ 530)

| id | collection | type · refs | est. | flagship visualizations | cross-links |
|---|---|---|---|---|---|
| `popgen` | Population genetics & evolution | C · Gillespie, Nielsen–Slatkin, Ewens | 120 | de Finetti diagram (Hardy–Weinberg); Wright–Fisher drift; Kimura fixation probability; Fisher's fundamental theorem; Price equation; coalescent trees; F_ST | `prob`, `stoch`, `ode` |
| `mathbio` | Mathematical biology | C · Murray, Edelstein-Keshet | 150 | Lotka–Volterra conserved quantity; competitive exclusion; SIR and the R₀ = 1 threshold; Turing patterns; Leslie matrices (Perron–Frobenius); Fisher–KPP waves; logistic-map period doubling | `ode`, `pde`, `ladr`, `stoch` |
| `neuro` | Computational neuroscience | C · Dayan–Abbott | 80 | Hodgkin–Huxley spikes; FitzHugh–Nagumo phase plane; cable equation; integrate-and-fire f–I curves; Oja's rule finds the principal component; Hopfield energy descent | `ode`, `pde`, `deep`, `ladr` |
| `bioinf` | Bioinformatics algorithms | C · Durbin et al., Compeau–Pevzner | 100 | Needleman–Wunsch/Smith–Waterman tables; Karlin–Altschul statistics; Viterbi gene finding; neighbour-joining and Felsenstein pruning; de Bruijn assembly as Euler paths; BWT | `algo`, `graph`, `stoch` |
| `sysbio` | Systems biology | C · Alon | 80 | Hill functions; toggle-switch bistability; repressilator; feed-forward loops; perfect adaptation via integral feedback; expression noise | `ode`, `kin`, `ctrl` |

### 5.7 Engineering (5 collections, ≈ 630)

| id | collection | type · refs | est. | flagship visualizations | cross-links |
|---|---|---|---|---|---|
| `sig` | Signals & systems | C · Oppenheim–Willsky, Lathi | 180 | convolution by dragging the flipped kernel; sampling theorem and aliasing; DFT/FFT; Laplace and Z-transform pole–zero plots; Butterworth filters; windowing; Parseval; modulation | PMA 8, RCA 9, **FA 6–7 (distributions)**, `ctrl`, `info` |
| `ctrl` | Control theory | C · Åström–Murray†, Franklin–Powell | 150 | PID tuning on a live plant; root locus; Bode plots and the **Nyquist criterion from the argument principle**; Routh–Hurwitz; controllability (Kalman rank); pole placement; LQR; Kalman filter | `ode`, `ladr`, RCA 10, `sig` |
| `circ` | Circuits | C · Agarwal–Lang, Horowitz–Hill | 100 | Kirchhoff's laws solved live on an editable circuit; Thévenin/Norton; maximum power transfer; RLC transients and resonance; phasors; Tellegen's theorem; matrix-tree theorem | `graph`, `ode`, `sig` |
| `solid` | Solid mechanics & structures | C · Gere, Timoshenko | 120 | Mohr's circle as an eigenproblem; beam bending; Euler buckling; torsion; Castigliano; trusses by joints; Griffith fracture; FEM in one dimension | `ladr`, `pde`, `mech` |
| `robot` | Robotics | C · Lynch–Park, *Modern Robotics*† | 80 | SE(3) transforms; forward and inverse kinematics; Jacobian singularities; manipulability ellipsoids (SVD); configuration space and RRT | `ladr`, `mfd`, `ctrl` |

### 5.8 Earth & environment (4 collections, ≈ 360)

| id | collection | refs | est. | flagship visualizations |
|---|---|---|---|---|
| `geol` | Geology & geophysics | Turcotte–Schubert; Stein–Wysession | 100 | plates rotating about Euler poles on a globe; isostasy; radiometric decay chains and isochrons; seismic rays bending through the layered Earth; Gutenberg–Richter statistics; magnetic stripes from reversals |
| `geo` | Atmosphere & ocean dynamics (moved from physics) | Vallis; Pierrehumbert | 80 | Coriolis and inertial circles; geostrophic balance; the Ekman spiral; Rossby waves; Lorenz-63 |
| `climate` | Climate science | Pierrehumbert; Archer; IPCC AR6 WG1 | 100 | energy-balance models with ice–albedo bistability (snowball Earth); the greenhouse layer model; forcing and feedback sliders; Milankovitch cycles; a carbon-cycle box model |
| `geog` | Geography & cartography | Snyder (USGS); Haggett | 80 | map projections with Tissot ellipses (← Theorema Egregium: no flat map is perfect); great circles vs rhumb lines; central places as hexagons; gravity models; Zipf's law of cities |

### 5.9 Medicine & health (4 collections, ≈ 360)

| id | collection | refs | est. | flagship visualizations |
|---|---|---|---|---|
| `physio` | Human physiology | Guyton–Hall; Keener–Sneyd | 120 | pressure–volume loops of the heart (Frank–Starling); Poiseuille flow in vessels; the oxygen–hemoglobin curve and its shifts; the Windkessel model; Nernst/GHK membrane potentials; glucose–insulin feedback |
| `pharm` | Pharmacology | Rowland–Tozer; Goodman & Gilman | 80 | one- and two-compartment kinetics; repeated dosing and accumulation to steady state; dose–response curves and the therapeutic window; receptor occupancy |
| `epi` | Epidemiology & evidence | Rothman; Gordis | 100 | base rates and the positive predictive value of a test; ROC curves; confounding and Simpson's paradox; Kaplan–Meier curves; herd immunity threshold 1 − 1/R₀ |
| `imaging` | Medical imaging | Prince–Links; Kak–Slaney | 60 | CT reconstruction: sinograms, back-projection and filtered back-projection (← Fourier slice theorem); MRI k-space; ultrasound Doppler |

### 5.10 Economics & finance (5 collections, ≈ 550)

| id | collection | refs | est. | flagship visualizations |
|---|---|---|---|---|
| `micro` | Microeconomics | Varian; Mankiw; CORE Econ | 160 | draggable supply and demand with taxes, price controls and shaded deadweight loss; indifference maps and pivoting budget lines; income and substitution effects; the Edgeworth box and the welfare theorems; Cournot/Bertrand; the market for lemons |
| `macro` | Macroeconomics | Mankiw; Romer; CORE Econ | 120 | the Solow model converging to steady state; the Keynesian multiplier; IS–LM and AD–AS shifts; the Taylor rule; the quantity theory |
| `fin` | Finance | Luenberger; Hull | 120 | compounding and present value; the efficient frontier and CAPM line; option payoffs and put–call parity; binomial trees converging to Black–Scholes (← heat equation); the Kelly criterion |
| `behav` | Behavioral economics & decisions | Kahneman; Wilkinson–Klaes | 80 | the St Petersburg paradox; risk aversion as concavity (Jensen); prospect-theory value and weighting functions; Allais; hyperbolic vs exponential discounting |
| `game` | Game theory & social choice (moved from math) | Osborne; Maschler–Solan–Zamir | 80 | as in §5.1 |

### 5.11 Social & behavioral sciences (4 collections, ≈ 430)

| id | collection | refs | est. | flagship visualizations |
|---|---|---|---|---|
| `psych` | Psychology & perception | Gescheider; Macmillan–Creelman; Goldstein | 150 | Weber–Fechner and Stevens laws you can test on yourself; signal detection (d′, criteria, ROC); Hick's and Fitts's laws with live timing; the Ebbinghaus forgetting curve and spacing; Rescorla–Wagner learning; illusions and lateral inhibition (Mach bands) |
| `soc` | Networks & collective behavior | Easley–Kleinberg; Schelling; Newman | 100 | Schelling segregation from mild preferences; Granovetter thresholds and cascades; small worlds (Watts–Strogatz); preferential attachment and power laws; the Bass diffusion model |
| `polsci` | Political science & social choice | Taylor–Pacelli; Saari | 100 | one electorate, five voting methods, five winners; Condorcet cycles; Arrow; the median voter; apportionment paradoxes; gerrymandering and the efficiency gap; Banzhaf power |
| `demo` | Demography | Preston–Heuveline–Guillot; Keyfitz–Caswell | 80 | life tables and life expectancy; population pyramids and momentum; stable populations (← Perron–Frobenius); the demographic transition |

### 5.12 Arts, music & design (3 collections, ≈ 350)

| id | collection | refs | est. | flagship visualizations |
|---|---|---|---|---|
| `music` | Music theory & acoustics | Benson; Tymoczko; Sethares; Loy | 150 | standing waves and the harmonic series, with sound; beats and roughness; dissonance curves that change with timbre; Pythagorean and syntonic commas; 12-EDO from continued fractions of log₂(3/2); the pitch-class clock and maximal evenness; the Tonnetz; Euclidean rhythms |
| `art` | Visual art & colour | Kemp; Livingstone; Fairchild; Conway et al. | 120 | linear perspective with draggable vanishing points; anamorphosis; additive vs subtractive colour; CIE chromaticity; simultaneous contrast; the 17 wallpaper groups; halftoning and dithering |
| `arch` | Architecture & structural form | Allen–Zalewski; Heyman | 80 | the hanging chain inverted into an arch (Hooke, Gaudí); thrust lines in masonry; domes; trusses; Sabine reverberation |

### 5.13 Humanities (4 collections, ≈ 470)

| id | collection | refs | est. | flagship visualizations |
|---|---|---|---|---|
| `ling` | Linguistics | Fromkin et al.; Ladefoged; Jurafsky–Martin | 120 | the vowel space from formants; Zipf's and Heaps' laws on real text; syntax trees and recursion; Grimm's law as sound change; language family trees (← phylogenetics) |
| `phil` | Philosophy & reasoning | Sainsbury; Resnik; SEP | 120 | Zeno's paradoxes and convergent series (← PMA 3); the sorites and fuzzy boundaries; Newcomb and the two envelopes; Bayesian confirmation and the raven paradox; Sleeping Beauty; the veil of ignorance as maximin |
| `tech` | History of technology | Cardwell; Usher; Mokyr | 150 | **the tech tree as a dependency graph**: simple machines → water wheel → clockwork escapement → printing press → steam engine (Watt's governor) → telegraph → radio → transistor → laser → GPS (trilateration) → internet (packet routing); each invention shown working, with deps into the physics that explains it |
| `bighist` | Big history & quantitative history | Christian; Clark; Turchin–Nefedov | 80 | deep time on a log axis; farming spreading as a wave of advance (← Fisher–KPP); the Malthusian trap and the escape from it; plague as SIR; secular cycles |

Also added: `mat` Materials science (chemistry, ≈ 100), `ecol` Ecology (biology, ≈ 100),
`aero` Aerospace engineering and `energy` Energy systems (engineering, ≈ 80 each).

**Totals:** 85 collections (3 existing + 82 new) across 13 fields · ≈ 11,400 new items · **≈ 12,500 overall**.

---

## 6. Viz kits (runtime extensions, built just in time)

Content never imports anything; kits hang off `v` (`v.graph(...)`, `v.steps(...)`) and are
documented in AUTHORING with a demo page in `tools/kits.html`. Each kit ships with the first wave
that needs it and is frozen (additive changes only) once a collection depends on it.

| kit | provides | first needed by |
|---|---|---|
| core additions | log/polar axes, colour bars, histograms; FFT; n×n linear algebra; distributions | Phase 0 |
| `graph` | node-link drawing, directed/weighted, layouts (force, layered, circular, tree, grid), editable (add, drag, delete), highlight paths, cuts and matchings | `algo`, `graph`, `toc`, `stoch`, `causal`, `bioinf`, `circ` |
| `steps` | timeline of precomputed states with step, back and scrub controls, plus a pseudo-code panel with the active line | `algo`, proofs, `nla`, `toc`, `dist` |
| `table` | matrices and tables with highlighted or editable cells | DP tables, Cayley tables, truth tables, transition matrices, character tables |
| `sim` | Verlet/leapfrog/symplectic Euler, RK45, implicit Euler; particle systems; energy-drift readout; Gillespie SSA | `mech`, `thermo`, `astro`, `kin`, `popgen` |
| `grid` | 1D/2D finite differences (heat, wave, advection, reaction–diffusion); split-step Fourier Schrödinger | `pde`, `qm`, `mathbio`, `em` |
| `fields` | field lines and streamlines in 2D/3D, equipotentials, flux through a draggable surface | `vcalc`, `em`, `fluid` |
| `freq` | Bode, Nyquist, root locus, pole–zero plots | `sig`, `ctrl`, `circ` |
| `circuit` | schematic symbols on a grid plus an MNA solver (DC/AC/transient) | `circ`, `ctrl` |
| `mol` | ball-and-stick (3D), MO/energy-level diagrams, orbital slices | `qchem`, `xtal`, `pchem` |
| `automata` | DFA/NFA/PDA/TM on `graph`, plus a tape renderer | `toc`, `cplx` |
| `quantum` | qubit state, Bloch sphere, circuit diagram simulator (≤ 6 qubits) | `qm`, `qinfo` |
| `nt` | BigInt modpow, egcd, sieve, Pollard ρ, continued fractions, elliptic-curve arithmetic | `nt`, `alg`, `crypto` |
| `lattice` | lattices, reciprocal lattices, symmetry operations, tilings | `xtal`, `cm`, `alg` |
| `units` | SI formatting with prefixes; CODATA constants; dimension check in readouts | all physical sciences |

---

## 6b. Visualizing everything

The rule is simple: **no idea without a picture you can push on, and no part of the atlas you
cannot see at a glance.**

**Every kind of idea has a visual grammar.**

| kind | the picture shows | the reader tests it by |
|---|---|---|
| Theorem / Lemma / Corollary | the hypotheses and the conclusion on a concrete instance | breaking a hypothesis and watching the conclusion fail |
| Law / Principle / Postulate | a simulation obeying the law, with the predicted vs measured quantity read out | leaving the regime of validity |
| Model | the model's state and its key output curve | moving the parameters across thresholds |
| Algorithm | the algorithm running step by step on editable input, invariant and operation counter live | editing the input, stepping, feeding adversarial cases |
| Concept / Definition | the defining picture, examples and non-examples side by side | toggling between examples and non-examples |
| Phenomenon / Paradox | the effect produced live (and heard, for sound) | changing the conditions that create or dissolve it |
| Method | the method applied to a problem, before and after | swapping problems and watching it succeed or fail |
| Invention / Event | the device working, or the historical dynamic quantitatively | operating the mechanism; sliding the parameters of history |

**Kits cover the fields** (the runtime gives every viz the same look and behaviour):

| kit | fields it serves |
|---|---|
| core stages, handles, sliders, 3D, TeX; log/polar axes, histograms, colour bars | everything |
| numerics (FFT, n×n linear algebra, distributions, symplectic and adaptive integrators, Gillespie, units, number theory) | mathematics, physics, chemistry, biology, statistics, engineering |
| `graph`, `steps`, `table` | algorithms, graph theory, automata, Markov chains, causal DAGs, DP, Cayley tables, payoff matrices |
| `phasePlane`, `fields` | ODEs, mechanics, ecology, neuroscience, kinetics, control; vector calculus, electromagnetism, fluids |
| `quantum`, `mol`, `circuit` | quantum mechanics and computing; chemistry and spectroscopy; circuits and electronics |
| `globe`, `timeline`, `agents`, `curves`, `tree` | geography, geology, climate; history and deep time; social and ecological simulations; economics; phylogenetics, linguistics, syntax |
| `sound` (audio) | music, acoustics, hearing, signals |

**Automated gates** (scripts/check.mjs): runtime errors, blank canvases, TeX errors, and
*quality warnings* for a static picture (no control, handle, drag, click or hover) or a missing
live readout. Screenshots in light, dark and every mode are reviewed per chapter.

**Seeing the whole atlas:**

- *Everything at a glance*: a zoomable treemap of fields → collections → chapters (area ∝ ideas,
  solid = written, pale = planned) on the home and field pages.
- *The map*: every idea as a node in one graph, field regions shelf-packed; semantic zoom with
  bundled collection-to-collection edges when far out, individual edges and labels when close;
  hover lights up ancestry and descendants; planned ideas as ghost nodes.
- *Flows*: how chapters and collections feed one another (home, field and collection pages).
- *Lineage*: on every page, the prerequisites a chosen number of steps back.
- *Timeline* (next): every idea with a `credit` year placed on a zoomable log/linear timeline,
  from Euclid to CRISPR.
- *Bridges* and *paths* (§8): curated cross-field walks and computed prerequisite plans.

## 7. Authoring at scale

### 7.1 Field guides (extend AUTHORING.md)

`docs/fields/<field>.md`, one per field, each with: what counts as a dependency, the kinds used,
notation conventions, how "break a hypothesis" translates, the colour semantics, which kits to
reach for, and three exemplary items. Highlights:

- **Physics / chemistry.** Every Law, Principle and Model states its `scope`. Readouts carry
  units. Simulations show their conserved quantities (energy drift < 0.1%). The "break it" mode
  leaves the regime: large-angle pendulum, relativistic speeds, real gas near its critical point.
- **CS.** Algorithms run on input the reader can edit (drag the graph, shuffle the array). The
  readout shows the invariant being maintained and an operation counter against the proven
  bound. Lower bounds show the adversary or the decision tree.
- **Statistics.** Simulation verifies theory: seeded samples, the empirical law beside the exact
  one, a **Resample** button, coverage that accumulates over repeats.
- **Biology / engineering.** Parameter sliders that cross thresholds (R₀ = 1, the Turing
  instability, a gain margin). Stochastic and deterministic versions side by side.

### 7.2 The production line (per collection)

1. **Syllabus** (Phase 2): inventory of `num, kind, name, deps, refs, pic`, reviewed first. This
   is where structural correctness lives, so it is **researched, not recalled**: tables of
   contents of the references, two or three university course syllabi, lists of named results,
   and encyclopedia entries are compared; facts and refs are verified; the sources are recorded
   in the file (docs/syllabus.md, "Research first"). A separate research audit per field checks
   coverage against those sources before chapters are written.
2. **Brief**: `collection.js`, chapter summaries, notation, shared helpers, the kits needed, and
   a *variety plan* so neighbouring items don't look alike.
3. **Authoring**: parallel agents, one part file (8–12 items) each, following AUTHORING and the
   field guide.
4. **Automated gates**: `build --strict`, static check, headless run with light, dark and
   all-modes screenshots, the new harness gates (§4.6).
5. **Review**: an independent reviewer agent per chapter. It checks statements against `refs`,
   verifies computational honesty, scores the AUTHORING §2 rubric from screenshots, and loops
   fixes until each item passes.
6. **Reconcile**: zero unknown deps into written collections; `see` links; bridge updates.
7. **Ship**: one PR per collection, with CI green and a "new" line on the home page.

When we execute, each wave is a natural fit for an orchestrated multi-agent workflow (fan out
authoring by part, then a review per chapter). That needs your explicit go-ahead, wave by wave.

### 7.3 Gates at the end of each wave

- 0 build errors; 0 unknown deps pointing into written collections.
- 100% of non-definition items have a passing `viz`.
- Every non-math collection has ≥ 25 cross-field deps; every touched bridge updated.
- A 5% random sample reviewed by a human (you), with findings fed back into the field guide.
- The map holds 60 fps with all written and planned nodes; the home page loads ≤ 300 KB of JSON
  (gzipped).

---

## 8. Phase 7: connective tissue (runs alongside the waves)

These are features only an atlas can have, and the main reason to build one.

1. **Bridges**: 15+ curated cross-field narratives, each an ordered walk through existing items
   with connecting prose and a "same picture, many guises" viz:
   - *Fourier*: PMA 8 → RCA 9 → FA 7 → sampling theorem → uncertainty principle → X-ray diffraction → MRI → JPEG
   - *Spectral theorem*: LADR → FA 12 → QM observables → normal modes → PCA → PageRank/Perron–Frobenius → Markov mixing
   - *Fixed points*: Banach → Picard–Lindelöf → Brouwer → Nash → Bellman value iteration
   - *Convexity and duality*: Hahn–Banach → separating hyperplanes → LP duality → max-flow min-cut → SVM → Legendre transforms in thermodynamics
   - *Least action*: Euler–Lagrange → Fermat's principle → geodesics → Noether → path integrals
   - *Entropy*: Boltzmann → Shannon → KL divergence → maximum entropy → Landauer
   - *Diffusion*: random walks → Brownian motion → heat equation → Fick → Fisher–KPP → MCMC
   - *Stability*: Lyapunov → Routh–Hurwitz → Nyquist → Turing instability → CFL
   - *Harmonic functions*: RCA 11 → electrostatics → potential flow → conformal maps → airfoils
   - *Symmetry*: groups → representations → crystallography → selection rules → conservation laws
2. **Prerequisite planner** (`#/path/<id>`): the ancestor closure of any result, topologically
   sorted and collapsible by chapter, with "I know this" marks stored per browser, which show
   the frontier of what to learn next.
3. **Proof steppers** for ~100 flagship results: `v.steps` drives the viz through the proof idea
   (cover with balls → extract a finite subcover → take the minimum radius).
4. **Shareable states and embeds**: control and handle state encoded in the URL
   (`#/t/mech-5.3?s=…`), plus `?embed=1` for course pages and slides.
5. **Status dashboard** (`#/status`): coverage, review state, verify flags, unknown deps, kit usage.
6. **External cross-references**: Wikipedia for everything; Mathlib declaration names for math
   items where they exist (checked by script); Feynman Lectures and OpenStax for physics.
7. **Stretch**: offline PWA; keyboard-operable handles and text alternatives for every viz;
   translations.

---

## 9. Roadmap

Breadth-first: after Wave A every field has a shelf, and foundations land before the
collections that depend on them.

| phase | contents | new items | exit criterion |
|---|---|---|---|
| **0 · Engine** | registry, schema v2, catalog split, routes, field pages, colours, map v2 groundwork, core runtime additions, CI and smoke tests | 0 | dummy collection appears with zero code edits; Rudin unchanged |
| **1 · Pilots** | `ladr` (math, book-anchored), `mech` (physics), `algo` (CS), `micro` (economics), `music` (arts) + kits `graph`, `steps`, `table`, audio, numerics + the first field guides | ≈ 1,100 | schema and kit APIs frozen; pilot retrospective folded into AUTHORING |
| **2 · Skeleton** | syllabi for all 80 remaining collections (≈ 10,000 planned entries with deps); ghost nodes on the map; `#/status`; map v2 at full scale | (planned) | every planned id exists; the planned graph is acyclic; each field's syllabus reviewed |
| **3 · Wave A**: every field gets a shelf | `vcalc`, `ode`, `prob`, `em`, `qm`, `thermo`, `toc`, `info`, `stat`, `sig`, `mathbio`, `pchem`, `climate`, `epi`, `macro`, `psych`, `art`, `tech` + kits `grid`, `fields`, `freq`, `automata` | ≈ 3,000 | all 13 fields live; first bridges (Fourier, Spectral, Entropy, Diffusion) |
| **4 · Wave B**: core curriculum | `alg`, `graph`, `nla`, `num`, `opt`, `stoch`, `waves`, `ml`, `ctrl`, `kin`, `popgen`, `qchem`, `circ`, `fin`, `behav`, `physio`, `pharm`, `soc`, `polsci`, `ling`, `phil` + kits `circuit`, `mol`, `nt` | ≈ 2,900 | prerequisite planner; bridges (Fixed points, Duality, Stability) |
| **5 · Wave C**: depth | `top`, `dg`, `mfd`, `pde`, `nt`, `comb`, `logic`, `rep`, `game`, `rel`, `fluid`, `crypto`, `cplx`, `solid`, `geol`, `geog`, `ecol`, `demo`, `arch`, `bighist` | ≈ 2,800 | proof steppers for the first 50 flagships; bridges (Least action, Harmonic, Symmetry) |
| **6 · Wave D**: frontiers & crossovers | `astro`, `cm`, `qinfo`, `geo`, `deep`, `causal`, `dist`, `pl`, `cg`, `neuro`, `bioinf`, `sysbio`, `xtal`, `robot`, `mat`, `aero`, `energy`, `imaging` + kits `quantum`, `lattice` | ≈ 1,700 | ≈ 12,500 items; 15+ bridges; 100 proof steppers |
| **7 · Connective tissue** | runs alongside 3–6 (§8) | — | — |

**Effort, roughly.** The trilogy, about 1,000 items, took around three days of agent-driven
production. At that rate the new content alone is a few weeks of production time. With the
review loops and reconciliation this plan adds, expect two to three times that. Phases 0–2
are worth doing carefully, because every later item inherits their decisions.

---

## 10. Risks and mitigations

| risk | mitigation |
|---|---|
| Quality dilution at 10× volume | pilots first; harness gates; a reviewer agent per chapter; a human 5% sample; field guides with exemplars |
| Wrong statements in the empirical sciences (dropped assumptions, wrong regimes) | mandatory `scope` for laws and models; `refs` on every curated item; reviewer checks against refs; `verify: true` remains the honest flag |
| Numbering-verification sink (as with Rudin) | open-access anchors only, or curated numbering; append-only ids |
| Copyright | the paraphrase rule as today; never transcribe; no copied figures; open licences respected (attribution in `collection.js`) |
| Dependency semantics drifting between fields | a written definition of "dep" per field guide; syllabus review fixes structure before authoring |
| Performance at 10k nodes / 30k edges | catalog sharding; level-of-detail map; WebGL fallback; tested early on Phase 2 ghost nodes |
| Kit sprawl / API churn | kits are frozen once used, demo pages act as tests, content never imports |
| Scope creep | every collection is independently shippable; waves have exit criteria; Wave D can be trimmed without harming anything earlier |

---

## 11. Decisions (taken)

1. **Name:** *Ideas, Visualized*. "Theorems" was too narrow once the scope became the breadth of
   human knowledge; the Rudin trilogy stays a named shelf with its original URLs.
2. **Anchor policy:** open-access book anchors where a canonical numbered free text exists
   (`ladr`, `alg`, `prob`, `graph`, `ml`); curated syllabi with refs everywhere else.
3. **Order:** breadth-first. Five pilots in five fields, then Wave A gives every one of the 13
   fields a shelf.
4. **Planned items:** visible as faded ghost nodes on the map, on chapter pages ("On the
   syllabus") and on `#/status`; each has its own page showing its place in the graph.
5. **Git flow:** work on a feature branch (`claude/stem-atlas`) with CI checks; merge to `main`
   (which deploys) once a phase is green.
6. **Scope:** all of §5, including game theory, earth and climate, robotics, and the six non-STEM
   fields (§5.8–5.13).
