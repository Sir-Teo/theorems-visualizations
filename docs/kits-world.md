# World kits — globe, timeline, agents, curves, tree

Kits for the earth sciences, social sciences, economics and humanities: `v.globe`, `v.timeline`, `v.agents`,
`v.curves`, `v.tree`, each with a DOM-free helper namespace (`v.geo`, `v.timelines`, `v.automata`, `v.econ`,
`v.trees`). As with every kit (docs/kits.md): **create once** in `viz(v)`, **draw inside `v.render`**, palette names only.

**Namespacing** follows the graph kit: a kit `v.foo(stage, spec)` returns an object with `draw()`; its pure helpers are
one dispatcher `v.<ns>(name, ...args)` (`v.<ns>()` returns the whole table; an unknown name throws and lists the valid
ones). The same functions are attached to the factory (`globe.haversine`) and exported by the module, so Node tests can
import them (`tests/kits-world.test.mjs`).

Working examples: `tools/demos/kits-world.js` → `tools/harness.html?file=tools/demos/kits-world.js&id=demo-3.1`
(ids `demo-3.1` … `demo-3.14`; add `&theme=dark`).

| demo | shows |
|---|---|
| 3.1 | Mercator vs a selectable projection with Tissot indicatrices (Jacobian), probe readout of $a, b$, area, $\omega$ |
| 3.2 | Great circle vs rhumb line on a globe and on Mercator, shared draggable endpoints, haversine check |
| 3.3 | South America rotated about Bullard's Euler pole back onto Africa, velocity arrows, $v = \omega R\sin\Delta$ |
| 3.4 | Deep time on a log axis (switchable to linear), geologic eons/eras/periods, cursor + cosmic calendar |
| 3.5 | Technology timeline on a broken axis with dependency arcs; click to light up prerequisites |
| 3.6 | Schelling segregation, tolerance slider, segregation index plot |
| 3.7 | SIR on a lattice vs the mean-field model; percolation threshold |
| 3.8 | Boids (continuous agents), alignment slider, polarisation plot |
| 3.9 | Supply and demand with tax/subsidy wedge, ceiling, floor; integrated CS, PS, revenue, DWL |
| 3.10 | Consumer choice: Cobb–Douglas / substitutes / complements / quasilinear, pivoting budget line |
| 3.11 | PPF, cost curves (MC through min AVC and AC), Lorenz curve and Gini |
| 3.12 | Neighbour joining vs UPGMA under rate heterogeneity (Robinson–Foulds distance) |
| 3.13 | Indo-European languages: radial / rectangular cladogram, collapsing, path between two languages |
| 3.14 | Tidy layouts: constituency trees (PP attachment) and a decision tree |

---

## 1. `v.globe(stage, spec)` → `G`

The Earth and the sphere. All coordinates are **`[lon, lat]` in degrees** (or a handle `{lon, lat}`). The kit owns the
stage's view (it sets `equal`, hides axes): data coordinates are map units of the projection on the unit sphere, so
`G.project(lon, lat)` → `[x, y]` works with every stage primitive. Dragging the map rotates it (handles win).

| spec key | default | |
|---|---|---|
| `projection` | `'orthographic'` | `orthographic` `equirectangular` `mercator` `transverseMercator` `stereographic` `lambert` (azimuthal equal-area) `mollweide` `robinson` `gnomonic` `azimuthalEquidistant` (aliases: `globe`, `tmerc`, `laea`, `aeqd`, …) |
| `center` | `[0, 20]` | centre `[lon0, lat0]`; cylindrical maps drag only in longitude |
| `roll`, `clip` | `0`, per projection | extra rotation (deg); cap radius of azimuthal maps (ortho 90, stereo 110, gnomonic 60, LAEA/AE 179.5) |
| `graticule` | `30` | step (deg) or `false` |
| `land`, `outline` | `true` | coastline fill + stroke (Natural Earth 110 m, see `world-110m.js`), map edge |
| `drag`, `wheel`, `zoom` | `true`, `false`, `1` | drag to rotate; wheel zoom; zoom factor |
| `onRotate(center)` | | after a drag |

| method | |
|---|---|
| `G.draw({graticule, land, ocean, landColor, shade})` | base map: ocean/sphere (shaded globe), graticule, land, outline |
| `G.handle(lon, lat, {label, color, constrain(l, f)})` → `{lon, lat, set}` | draggable point; `G2.handle(A)` shows the same point on another map |
| `G.project(lon, lat)` / `G.invert(x, y)` / `G.visible(p)` | map ↔ sphere (`null` when clipped) |
| `G.set({projection, center, roll, clip, zoom})`, `G.projection`, `G.center` | cheap; fine inside render |
| `G.path(pts, st)` | polyline, geodesic edges (`geodesic: false` for raw), clipped at seams/horizon |
| `G.polygon(rings, {fill, color, …})` | spherical polygon (outer CCW, holes CW), Weiler–Atherton clipped, re-closed along the map edge |
| `G.greatCircle(a, b, {full})` → km | minor arc (+ whole circle dashed); returns the haversine length |
| `G.rhumbLine(a, b)` → km | loxodrome (straight on Mercator) |
| `G.smallCircle(c, r°, st)` | true image of a geodesic circle |
| `G.indicatrix(p, {radius, axes, circle})` → distortion | Tissot ellipse = image of the tangent circle under the numerical Jacobian |
| `G.tissot({step, lat, radius, …})` → list | grid of indicatrices |
| `G.distortion(p)` → `{a, b, h, k, area, omega, theta}` | semi-axes, meridian/parallel scales, area factor $ab$, max angular distortion $\omega = 2\arcsin\frac{a-b}{a+b}$ |
| `G.velocities(pole, ω°/Myr, {step, points, scale})` | arrows along small circles about an Euler pole |
| `G.dot`, `G.text`, `G.tex`, `G.arrow(a, b)` | at sphere points (geodesic arrow) |
| `G.landmass(name)`, `G.km(x)` | rings of `'Africa'`, `'South America'`, `'Eurasia'`, `'North America'`, `'Australia'`, `'Antarctica'`, `'Greenland'`, `'Madagascar'`, …; `12 345 km` |

**`v.geo(name, …)`**: `haversine(a, b, R?)`, `centralAngle`, `bearing`, `destination(p, brg, dist°)`, `interpolate(a, b, n)`,
`greatCirclePoints`, `rhumb(a, b)` → `{length, bearing, points}`, `smallCircle(c, r)`, `rotate(pts, pole, angle)`,
`velocity(p, pole, ω)` → `{speed mm/yr, east, north, azimuth}`, `projection(name, {center})` (forward, invert, tissot,
clipLine, clipPolygon, outline), `projections()`, `tissot(name, p)`, `land()`, `landmass(name)`, `sphericalArea(ring)`,
`EARTH_KM`.

```js
viz(v) {   // great circle vs rhumb line, globe + Mercator sharing the endpoints
  const L = v.stage({ height: 330 }), R = v.stage({ height: 330 });
  const G1 = v.globe(L, { projection: 'orthographic', center: [-30, 45], graticule: 15 });
  const G2 = v.globe(R, { projection: 'mercator', center: [-20, 0] });
  const A = G1.handle(-74, 40.7, { label: 'A' }), B = G1.handle(37.6, 55.8, { label: 'B', color: 'orange' });
  G2.handle(A); G2.handle(B);
  let gc = 0, rl = 0;
  v.render(() => { for (const G of [G1, G2]) { G.draw(); gc = G.greatCircle(A, B, { full: true }); rl = G.rhumbLine(A, B); } });
  v.readout(() => `great circle ${G1.km(gc)} · rhumb line ${G1.km(rl)} (${v.fix((rl / gc - 1) * 100, 1)}% longer)`);
}
```

---

## 2. `v.timeline(stage, spec)` → `T`

Time axes for history and deep time. A time is a year CE (negative = BCE) or a string: `'3.5 Ga'`, `'66 Ma'`, `'12 ka'`,
`'300 yr ago'`, `'10,000 BCE'`, `'1450 CE'`, `'1450'`, `'5000 BP'`, `'now'`, or `{ago: n}` ("ago" from `present`).

| spec key | default | |
|---|---|---|
| `scale` | `'linear'` | `'linear'` (wheel zoom, drag pan), `'log'` (years ago, old on the left; `minAgo` default 1), `'broken'` |
| `range` | data extent | e.g. `['13.8 Ga', '10 yr ago']` |
| `segments` | | broken axis: `[{from, to, weight}]` linear pieces with `//` marks |
| `events` | `[]` | `{t, label, id, color, priority, note}` — dots + labels in lanes (priority first, never overlapping; hidden labels show on hover) |
| `spans` | `[]` | `{from, to, label, color, track}` — bars below the axis; greedy tracks unless `track` is given |
| `links` | `[]` | `[fromId, toId]` dependency arcs (prerequisite → dependent) in a band above the axis |
| `cursor` | none | draggable "now" cursor (`true` = present) with a red readout |
| `present`, `zoom`, `fontSize`, `laneHeight`, `trackHeight`, `linkBand` | 2025, true, 12, 17, 17, 58 | |
| `onSelect(e)`, `onCursor(year)` | | |

Methods: `T.draw({highlight: id})`, `T.setScale(s)`, `T.setView(a, b)`, `T.px(year)` / `T.year(px)`, `T.fmt(year)`,
`T.parse(t)`, `T.cursor`, `T.selected` (click an event or span), `T.spansAt(year)` (half-open: a boundary belongs to the
younger span), `T.ancestors(id)`, `T.descendants(id)`, `T.event(id)`, `T.set({events, spans, links})`.

**`v.timelines(name, …)`**: `parse`, `format` (→ `3.5 Ga`, `66 Ma`, `300 ka`, `10,000 BCE`, `1450 CE`), `ago`, `linearTicks`,
`logTicks`, `lanes(boxes, maxLanes)`, `geologic(levels = ['eon', 'era', 'period'])` → ICS spans (Ma boundaries), `PRESENT`.

```js
viz(v) {   // deep time on a log axis with the geologic time scale
  const s = v.stage({ height: 360, full: true });
  const T = v.timeline(s, { scale: 'log', range: ['13.8 Ga', '10 yr ago'], minAgo: 10, cursor: '66 Ma',
    events: [{ label: 'Big Bang', t: '13.8 Ga', priority: 1 }, { label: 'Earth', t: '4.5 Ga' }, { label: 'K–Pg extinction', t: '66 Ma' }, { label: 'writing', t: '3200 BCE' }],
    spans: v.timelines('geologic') });
  v.select('axis', ['log', 'linear'], 'log', { onChange: (x) => T.setScale(x) });
  v.render(() => T.draw());
  v.readout(() => `${T.fmt(T.cursor)} — ${T.spansAt().map((x) => x.label).join(', ')}`);
}
```

---

## 3. `v.agents(stage, spec)` → `A`

Cellular automata and agent-based models. The kit owns the runtime animation (▶/⏸, restart = same seed) and adds
**Step** and **New run** buttons; `speed` = steps per second. Stats are recorded every step.

| spec key | | |
|---|---|---|
| `size` | grid | `n` or `[w, h]`; cell (i, j) is the data square `[i, i+1] × [h−j−1, h−j]` (row 0 at the top) |
| `states` | grid | `[{name, color, alpha}]` (`color: null` = transparent); index = state value |
| `init(rng, i, j, M)` / `fill` | grid | initial state, or `{stateName: fraction}` |
| `rule(s, counts, rng, i, j, M)` | grid | synchronous update; `counts[k]` = neighbours in state k |
| `step(M, rng)` | both | free-form update (asynchronous rules, moves) |
| `neighborhood`, `wrap` | grid | `'moore'` / `'vonneumann'`; torus by default |
| `agents`, `box`, `radius`, `speed`, `move` | continuous | n agents in `[w, h]`; `'walk'` (with `turn`), `'ballistic'`, `'boids'` (`align`, `cohere`, `avoid`, `vision`, `noise`) |
| `collide`, `walls`, `interact(i, j, M, rng)`, `contact`, `update(M, rng)` | continuous | elastic discs; `'reflect'` / `'wrap'`; contact hook (spatial hashing) |
| `stats(M)` | both | extra statistics `{name: number}` (state fractions are always recorded) |
| `stopWhen(M)`, `maxSteps`, `seed`, `speed`, `autoplay`, `animate`, `controls`, `paint`, `onStep` | | `paint: state` lets the reader draw cells |

Model `A.model` (also `A.t`, `A.stats`, `A.history`): `step(n)`, `reset(seed)`, `get/set(i, j, s)`, `count(s)`, `frac(s)`,
`neighbors(k)`, `counts(k)`, `series(name)`; continuous: `x, y, vx, vy, state` (typed arrays), `msd()`, `order()`,
`pairs(d, fn)`. Kit: `A.draw({gridLines, heading})` (ImageData, one pixel per cell, no smoothing), `A.plot(stage2,
{series, colors, names, window, minWindow, y})` (time series with end labels; create `stage2` with `axes: 'box'`),
`A.step()`, `A.reset()`, `A.resume()` (after a parameter change ends a finished run).

**`v.automata(name, params)`** → spec to spread (params may be functions for live sliders): `life` (`rule: 'B3/S23'`,
`density`), `schelling` (`tolerance`, `density`, `ratio`; stats `segregation`, `unhappy`), `sir` (`beta`, `gamma`, `seeds`,
`center`, `waning`), `fire` (`growth`, `lightning`), `voter` (`opinions`; stat `interface`), `sandpile` (`drop`; stats
`height`, `avalanche`; `M.data.sizes`), `walkers` (stat `msd`), `gas`, `boids` (stat `order`), `contagion` (SIR by contact).

```js
viz(v) {   // Schelling with a tolerance slider and the segregation index over time
  const s = v.stage({ height: 330 }), ts = v.stage({ height: 330, axes: 'box', xlabel: 'step' });
  let A = null; const tol = v.slider('tolerance', 0, 0.9, 0.35, { step: 0.01, onChange: () => A.resume() });
  A = v.agents(s, { ...v.automata('schelling', { tolerance: () => tol.value }), size: 50, seed: 7, speed: 6 });
  v.render(() => { A.draw(); A.plot(ts, { series: ['segregation', 'unhappy'], colors: { segregation: 'purple', unhappy: 'red' } }); });
  v.readout(() => `step ${A.t} · segregation ${v.fix(A.stats.segregation, 3)}`);
}
```

---

## 4. `v.curves(stage, spec)` → `E`

Economics diagrams on a normal stage (you choose the window, e.g. `{x: [0, 100], y: [0, 100], axes: 'box', xlabel: 'Q', ylabel: 'P'}`).

| spec key | |
|---|---|
| `demand`, `supply` | inverse curves $P(Q)$: `{linear: [[q, p], [q, p]]}` (two handles), `{points: [[q, p], …]}` (monotone cubic through handles: "curved"), or `{fn: q => p}`; options `shift: () => ΔQ` (old curve dashed), `color`, `label`, `drag: false`. Handles keep the curve monotone. |
| `tax`, `ceiling`, `floor` | numbers or functions (`tax < 0` = subsidy); one policy applies (tax, else a binding ceiling, else a binding floor) |
| `shade`, `areaColors`, `labels`, `guides` | `['cs', 'ps', 'rev', 'dwl']`; CS blue, PS orange, revenue green, DWL red |
| `utility`, `alpha`, `beta`, `income`, `prices` | consumer: `'cobb-douglas'` $x^\alpha y^{1-\alpha}$, `'substitutes'` $\alpha x + \beta y$, `'complements'` $\min(\alpha x, \beta y)$, `'quasilinear'` $\alpha\ln x + y$, `'ces'`, or `(x, y) => u`; intercept handles set the prices (income fixed) |
| `frontier` | PPF $(x/a)^k + (y/b)^k = 1$: `{a, b, k, point}` (functions allowed) with a draggable bundle |

`E.draw()` draws whatever the spec describes. `E.result` (market, recomputed on access) → `{q0, p0, q, pb, ps, cs, psur, rev,
dwl, total, total0, shortage, excess, binding}` — equilibrium by bisection, areas by Simpson. `E.consumer` → `{px, py, m, U,
opt: {x, y, u}, mrs, ratio}`; `E.frontier` → `{status: 'inside'|'on'|'outside', cost, Y}`. `E.curve(f, {label, color,
domain})` draws any labelled curve (labels at the right end, nudged apart); `E.lorenz(incomes)` → Gini; `E.D`, `E.S`.

**`v.econ(name, …)`**: `market(D, S, qmax, {tax, ceiling, floor})`, `utility(kind, a, b)`, `optimum(U, px, py, m)`
(golden section + corners), `mrs`, `contour(f, level, xr, yr)` (marching squares), `lorenz`, `gini`, `costs({F, a, b, c})`
→ `{TC, VC, AVC, AC, MC, minAVC, minAC}`, `simpson`, `root`, `monotone`.

```js
viz(v) {   // a per-unit tax: wedge, revenue and deadweight loss
  const s = v.stage({ x: [0, 100], y: [0, 106], height: 360, axes: 'box', xlabel: 'Q', ylabel: 'P' });
  const t = v.slider('tax $t$', -20, 40, 18, { step: 0.5 });
  const E = v.curves(s, { demand: { linear: [[8, 92], [92, 14]] }, supply: { linear: [[8, 14], [92, 82]] }, tax: () => t.value });
  v.render(() => E.draw());
  v.readout(() => { const r = E.result; return `DWL ${v.fix(r.dwl, 1)} = ½·t·ΔQ = ${v.fix(0.5 * t.value * (r.q0 - r.q), 1)} · revenue ${v.fix(r.rev, 1)}`; });
}
```

---

## 5. `v.tree(stage, spec)` → `T`

Hierarchies. `data`: a Newick string (`'((A:1,B:2)AB:1,C:3);'`, quoted names, `_` = space), a nested object
`{name, length, children}` (aliases `label`, `len`, `kids`; strings are leaves), nested arrays, or `v.trees('nj' | 'upgma', D, names)`.

| spec / draw key | default | |
|---|---|---|
| `layout` | `'rect'` | `'rect'` (elbows; `orientation` `'right'` `'left'` `'down'` `'up'`), `'radial'` (`arc`, `start`, `innerRadius`, `alignLabels`), `'tidy'` (boxes sized to labels; `alignLeaves`, `edgeLabels` from `node.edge`, `gap`, `rowHeight`), `'unrooted'` (equal-angle) |
| `lengths` | auto | branch lengths (phylogram / dendrogram) or aligned leaves (cladogram) |
| `colors` | | `{cladeName: colour}` colours a subtree (nested clades override) |
| `highlight` | `T.selected` | `[a, b]` path between two nodes, or one node (root path) |
| `collapsible`, `collapsed` | `true`, `[]` | click an internal node to fold it into a wedge `name (n)` |
| `internalLabels`, `labels`, `nodes`, `scaleBar`, `unit`, `fontSize`, `width`, `edgeColor` | | internal labels are skipped when they would overlap |

Leaf labels never overlap: the font shrinks to the leaf spacing (rect/radial), then labels are thinned; unrooted labels are
placed greedily; tidy boxes are packed by contours. Methods: `T.draw(o)`, `T.set(data)`, `T.find(name)`, `T.leaves`,
`T.mrca(a, b)`, `T.path(a, b)`, `T.distance(a, b)`, `T.toggle(node)`, `T.selected` (last two clicked leaves), `T.layoutInfo`.

**`v.trees(name, …)`**: `newick`, `toNewick`, `finalize`, `upgma(D, names)` (ultrametric, `node.height`), `nj(D, names, {midpoint})`
(Saitou–Nei; `t.joins`), `patristic(t, names)`, `mrca`, `path`, `distance`, `midpoint`, `reroot`, `leaves`, `nodes`, `find`,
`splits`, `rf` (Robinson–Foulds).

```js
viz(v) {   // neighbour joining from a small distance matrix
  const s = v.stage({ height: 300 });
  const D = [[0, 5, 9, 9, 8], [5, 0, 10, 10, 9], [9, 10, 0, 8, 7], [9, 10, 8, 0, 3], [8, 9, 7, 3, 0]];
  const T = v.tree(s, { data: v.trees('nj', D, ['a', 'b', 'c', 'd', 'e']), layout: 'unrooted' });
  v.render(() => T.draw());
  v.readout(() => `${v.trees('toNewick', T.root)} — patristic distances reproduce the matrix exactly`);
}
```

---

**Data and licences.** `assets/js/viz/kits/world-110m.js` is derived from Natural Earth 1:110m land (public domain): rings
reoriented, the Americas split at Panama and Afro-Eurasia at Suez, Antarctica's pole edge removed, Douglas–Peucker 0.2°,
66 polygons / ~2.2k vertices, 7.8 KB as base64url zig-zag varints. Robinson's table is Snyder's (1993); geologic boundaries
are from the ICS chart.

**Known site issue.** `assets/css/style.css` has a page rule `.area { margin-top: 30px }` that also hits the legend's
`area` swatch (`v.legend([..., {area: true}])`), pushing it below its label. The world demos avoid `area: true`.
