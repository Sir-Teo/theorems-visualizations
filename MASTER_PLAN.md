# Master plan: from *Rudin, visualized* to an atlas of STEM

> **Status:** proposal · **Scope:** the whole project · **Supersedes nothing**: AUTHORING.md stays
> the rulebook for writing items and gets field-specific extensions (§7).

## 0. The one-paragraph version

Today the site covers one subfield, analysis: 1,062 results from Rudin's three books, each with
an interactive picture, all wired into one dependency graph. The goal is the same treatment for
**the load-bearing results of STEM**: mathematics, statistics, computer science, physics,
chemistry, biology and engineering. That means **about 59 collections and about 10,000 results**,
still **one graph**, so a reader can follow a single chain from the completeness of ℝ through
the spectral theorem to the hydrogen spectrum, or from Fourier series to the sampling theorem to
MRI. We get there in four steps. First, generalise the engine so that adding a field means adding
a folder, with no code edits (Phase 0). Next, test the new schema on three pilots from three
different fields (Phase 1). Then sketch the whole atlas as a graph of planned results before
writing any of them (Phase 2). Finally, fill that skeleton in four breadth-first waves (Phases
3–6). Alongside the waves, build the connective tissue that only an atlas can offer: cross-field
*bridges*, prerequisite paths, a zoomable map, and proof steppers (Phase 7).

---

## 1. Where we are

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

**Product.** *Theorems, Visualized*: an atlas of STEM's load-bearing results. Each result gets
a faithful statement, an interactive picture you can push on, the idea behind it, and its place
in a single cross-field dependency graph. The Rudin trilogy becomes the **Analysis** shelf of the
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
Field (7)          Mathematics · Statistics & Data Science · Computer Science · Physics & Astronomy
                   · Chemistry · Biology · Engineering
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
| `kind` | add **Law, Principle, Postulate, Algorithm, Model** to Theorem/Lemma/Corollary/Proposition/Definition |
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

### 5.1 Mathematics (22 collections, ≈ 4,640 items)

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

### 5.4 Physics & astronomy (11 collections, ≈ 1,660)

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

**Totals:** 59 collections (3 existing + 56 new) · ≈ 8,700 new items · **≈ 9,800 overall**.

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

1. **Syllabus** (Phase 2): inventory of `num, kind, name, deps, refs`, reviewed first. This is
   where structural correctness lives.
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
| **1 · Pilots** | `ladr` (math, book-anchored), `mech` (physics, curated), `algo` (CS, curated) + kits `graph`, `steps`, `table`, `sim`, `units` + the first three field guides | ≈ 820 | schema and kit APIs frozen; pilot retrospective folded into AUTHORING |
| **2 · Skeleton** | syllabi for all 53 remaining collections (≈ 7,900 planned entries with deps); ghost nodes on the map; `#/status`; map v2 at full scale | (planned) | every planned id exists; the planned graph is acyclic; you have reviewed each field's syllabus |
| **3 · Wave A**: every field gets a shelf | `vcalc`, `ode`, `prob`, `em`, `qm`, `thermo`, `toc`, `info`, `stat`, `sig`, `mathbio`, `pchem` + kits `grid`, `fields`, `freq`, `automata` | ≈ 2,430 | all 7 fields live; first bridges (Fourier, Spectral, Entropy, Diffusion) |
| **4 · Wave B**: core curriculum | `alg`, `graph`, `nla`, `num`, `opt`, `stoch`, `waves`, `ml`, `ctrl`, `kin`, `popgen`, `qchem`, `circ` + kits `circuit`, `mol`, `nt` | ≈ 2,030 | prerequisite planner; bridges (Fixed points, Duality, Stability) |
| **5 · Wave C**: depth | `top`, `dg`, `mfd`, `pde`, `nt`, `comb`, `logic`, `rep`, `game`, `rel`, `fluid`, `crypto`, `cplx`, `solid` | ≈ 2,180 | proof steppers for the first 50 flagships; bridges (Least action, Harmonic, Symmetry) |
| **6 · Wave D**: frontiers & crossovers | `astro`, `cm`, `qinfo`, `geo`, `deep`, `causal`, `dist`, `pl`, `cg`, `neuro`, `bioinf`, `sysbio`, `xtal`, `robot` + kits `quantum`, `lattice` | ≈ 1,260 | ≈ 9,800 items; 15+ bridges; 100 proof steppers |
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

## 11. Decisions needed from you (defaults in bold)

1. **Name**: **"Theorems, Visualized"** (matches the repo; the Rudin trilogy stays a named
   shelf), or something else.
2. **Anchor policy**: **open-access anchors where a canonical theorem-numbered free text
   exists (`ladr`, `alg`, `prob`, `graph`, `ode`, `ml`); curated syllabi with refs elsewhere.**
   The alternative is to follow canonical closed texts (Munkres, Griffiths, CLRS, Sipser) for
   "use it alongside your course" value, at the cost of Rudin-style numbering verification.
3. **Order**: **breadth-first waves (every field visible after Wave A)**, or math-first depth.
4. **Planned items in public**: **visible as ghost nodes on the map and on `#/status` only**,
   or hidden until written.
5. **Git flow**: **a branch and PR per collection with CI**, or keep committing to `main`.
6. **Scope edges**: include `game` (game theory), `geo` (earth and climate) and `robot`? Add
   anything missing (economics/finance, materials science, medicine/epidemiology as its own
   field)?

**Next step once you approve:** Phase 0. It is pure refactoring with Rudin as the regression
suite, and it ends with "add a folder, get a field".
