# Authoring guide

This site gives **every numbered theorem** in Walter Rudin's three analysis books an
interactive visualization, and draws the **dependency graph** that shows how the results
build on one another — from the least-upper-bound property in *Principles* to the spectral
theorem in *Functional Analysis*.

| id prefix | book | edition |
|---|---|---|
| `pma` | Principles of Mathematical Analysis (“Baby Rudin”) | 3rd ed., 1976 — chapters 1–11 |
| `rca` | Real and Complex Analysis (“Papa Rudin”) | 3rd ed., 1987 — Prologue (= chapter 0) and chapters 1–20 |
| `fa`  | Functional Analysis (“Grandpa Rudin”) | 2nd ed., 1991 — chapters 1–13 |

Everything is a static site (no build step for the browser). Content lives in
`content/<book>/chNN.js`; `node scripts/build.mjs` turns it into `data/catalog.json`.

---

## 1. Content files

One chapter = one module `content/<book>/chNN.js` (two-digit chapter). Large chapters may be
split into extra **part files** `chNN-b.js`, `chNN-c.js`, … that export only `book`, `chapter`
and `items` (the build merges parts and sorts items by number). Keep each file under ~1 500
lines; a part per 8–12 items is a good size.

```js
// Rudin, Principles of Mathematical Analysis — Chapter 4: Continuity
export default {
  book: 'pma',
  chapter: 4,
  title: 'Continuity',                 // only in chNN.js
  summary: String.raw`2–4 sentences, in your own words, on the arc of the chapter.`,
  items: [
    {
      num: '4.19',                      // Rudin's number, as a string
      kind: 'Theorem',                  // Theorem | Lemma | Corollary | Proposition | Definition
      name: 'Continuity on a compact space is uniform',
      statement: String.raw`... $\eps$ ...`,
      idea: String.raw`... why it is true, 2–4 sentences ...`,
      caption: String.raw`... what to drag / watch, 1–2 sentences ...`,
      deps: ['pma-4.18', 'pma-2.32', 'pma-4.8'],
      see: ['rca-2.x'],                 // optional related results in any book (no ordering constraint)
      tags: ['compactness', 'continuity'],
      verify: true,                     // optional: set when unsure of the number or exact hypotheses
      viz(v) { /* see §3 */ },
    },
  ],
};
```

### Field rules

- **Always use `String.raw\`…\``** for any string containing TeX, so backslashes survive.
- **`num`** — Rudin's own number (`'2.41'`). Every numbered *Theorem, Lemma, Corollary,
  Proposition* in the chapter gets an item. An *unnumbered* corollary that Rudin states right
  after a theorem gets the theorem's number plus a letter (`'2.35a'`, `'2.35b'`); it is shown
  as “Corollary to 2.35”. If a whole section is unnumbered (e.g. RCA's Prologue), number its
  results `0.1, 0.2, …` in order and set `verify: true`.
- **Definitions** — include the *key* numbered definitions that later theorems rely on
  (compactness, Cauchy sequence, measure, Banach space, …): typically 3–10 per chapter.
  `kind: 'Definition'`, `viz` optional (but a good picture of a central definition is welcome).
- **`id`** is derived: `<book>-<num>`, e.g. `pma-4.19`, `rca-10.15`, `fa-3.4`. Never write it.
- **`name`** — short and recognisable (≤ 60 chars): the classical name if there is one
  (“Heine–Borel theorem”, “Baire category theorem”), otherwise a crisp description
  (“Closed subsets of compact sets are compact”).
- **`statement`** — mathematically faithful, complete hypotheses and conclusion, in **your own
  words**. Rudin's text is copyrighted: do **not** reproduce his sentences. Using his notation
  ($H(\Omega)$, $\Ind_\gamma$, $X^*$, $L^p(\mu)$) is fine and encouraged.
- **`idea`** — the proof idea in your own words (not a transcription of Rudin's proof). Mention
  which earlier results do the heavy lifting.
- **`caption`** — tells the reader what to manipulate and what to notice.
- **`deps`** — ids of the results Rudin's proof actually uses, plus the definitions without
  which the statement cannot be formulated (only ones that exist as items). Cross-chapter and
  cross-book ids are encouraged. They must point *backwards* (no cycles). 1–6 is typical.
  An id that does not exist yet is only a warning; it will be reconciled later, so prefer the
  correct Rudin number even if that chapter is being written by someone else.
- **`see`** — optional links that tell the cross-book story: the same idea in an earlier/later
  book (`fa-2.2` *see* `rca-5.6`; `rca-4.18` *see* `pma-8.x`), or a generalisation.
- **`tags`** — 1–3 lowercase topical tags.

### Rich text

`statement`, `idea`, `caption`, labels and readouts accept: `$inline TeX$`, `$$display TeX$$`,
`**bold**`, `*italic*`, blank-line paragraphs, and lines starting with `(a)`, `(b)`, `(i)` or
`- ` which render as hanging list items (use a newline before each).

KaTeX macros available everywhere: `\R \C \Q \Z \N \T \eps \Re \Im \norm{x} \abs{x} \ip{x}{y}
\supp \dist \diam \Ind \Res \co \sgn \tr \spn`. Use `\mathscr{}` / `\mathfrak{}` freely.

---

## 2. What a great visualization looks like

The quality bar is high. Each `viz` must:

1. **Be about *this* theorem.** Show the hypotheses and the conclusion — ideally let the reader
   *break a hypothesis* and watch the conclusion fail (a toggle between a compact and a
   non-compact domain, a convex and a non-convex set, a complete and an incomplete space).
2. **Be interactive.** At least one draggable handle, slider, segmented choice, or animation
   with play/pause. The reader should be able to *test* the statement.
3. **Make the invisible visible.** Plot the quantity the proof controls: the δ chosen for an ε,
   the tail of a Cauchy sequence inside its ε-band, partial sums converging, the finite
   subcover being extracted, the projection onto a subspace, the spectrum in the plane.
4. **Be legible.** Label key objects (`tex()` labels, `dot` labels), add a `legend` when there
   are ≥ 2 series, and a `readout` with live numbers that *verify* the claim.
5. **Be correct.** Compute things honestly (numerical integration, actual suprema, actual
   closest points). Do not fake a curve that the theorem says should appear.
6. **Look good in light and dark.** Use palette names only (never hex colours).
7. **Be fast.** A redraw should take a few ms; cache rasters with `key`.

Variety matters: neighbouring results should not all look alike. Corollaries may share a helper
with their theorem but must show their own specific content.

**Abstract results** (σ-algebras, Banach spaces, distributions, Banach algebras) still get
concrete pictures: work in $\R^2$ with an $\ell^p$ norm, in a finite partition of the square,
with explicit functions on $[0,1]$ or the circle, with $2\times2$ or $n\times n$ matrices, with
spectra drawn in $\C$, with measures drawn as mass distributions/histograms, with nets of
approximants converging, with unit balls and their images under operators, with Fourier
coefficients as bar charts. Pick the most illuminating finite-dimensional or explicit instance
and say so in the caption.

### Colour semantics (keep consistent across the site)

| name | use for |
|---|---|
| `accent` / `blue` | the main object, the point/function the theorem is about, ε-bands |
| `orange` | neighbourhoods, δ, partitions, secondary objects |
| `green` | “the conclusion holds” — limits, separating objects, success states |
| `red` | counterexamples, failure, a second set |
| `gold` | moving / sampled points, partial sums in progress |
| `purple`, `teal`, `pink` | further series |
| `ink`, `muted`, `faint`, `grid` | text, scaffolding, guides |
| `pma`, `rca`, `fa` | book colours (rarely needed inside a viz) |

---

## 3. The `viz(v)` API

`viz(v)` runs **once** to build stages and controls, then registers a draw callback with
`v.render(fn)` (redrawn whenever a control/handle changes) or `v.animate(fn, opts)`
(continuous, with automatic play/pause + restart buttons). Every stage is **cleared
automatically** before each redraw (grid/axes are redrawn for you) — just draw.
Keep per-viz state in closure variables (`let state = …`), not on `v`.

```js
viz(v) {
  const s = v.stage({ x: [-1, 3], y: [-1, 2], equal: true, height: 340 });
  const eps = v.slider('$\\varepsilon$', 0.05, 1, 0.3, { step: 0.01 });
  const p = s.handle(1, 0.5, { color: 'accent', label: 'p' });   // create ONCE
  v.render(() => {
    s.fn((x) => Math.sin(x), { color: 'ink' });
    s.circle(p.x, p.y, eps.value, { fill: 'accent', fillAlpha: 0.15, color: 'accent' });
  });
  v.readout(() => `$d(p,0) = ${v.fix(Math.hypot(p.x, p.y), 3)}$`);
}
```

Note: inside a normal (non-raw) JS string, TeX backslashes must be doubled: `'$\\varepsilon$'`.
Inside `String.raw\`…\`` they must not.

### `v` — runtime

| member | description |
|---|---|
| `v.stage(opts)` → Stage | 2D canvas panel. Call repeatedly for side-by-side panels. |
| `v.stage3d(opts)` → Stage3D | 3D panel (drag to rotate). |
| `v.render(fn)` | register `fn(t)`; rerun on any change. |
| `v.animate(fn, {period, speed, autoplay, once})` | continuous `fn(t)`, `t` in seconds (wraps at `period`; `once` stops at the end). Adds play/pause/restart. |
| `v.slider(label, min, max, value, {step, int, log, decimals, fmt, onChange})` | returns `{value, set(x)}`. `int: true` for integers, `log: true` for log scale. |
| `v.toggle(label, value, {onChange})` | switch → `{value}` |
| `v.select(label, options, value, {onChange})` | segmented buttons; options are strings or `{value, label}` (labels may contain TeX). → `{value, set}` |
| `v.button(label, fn)` | e.g. “Resample”, “Step”. |
| `ctl.el.hidden = true` | every control exposes its element as `.el` (a button *is* its element): hide controls that do nothing in the current mode. |
| `v.readout(fn)` | live rich text under the panels (TeX allowed); recomputed after each draw. |
| `v.legend([[color, label], [color, label, {dash, dot, area}]])` | legend row (call once, or inside render if it changes). |
| `v.t`, `v.play()`, `v.pause()`, `v.restart()`, `v.playing` | animation clock. |
| `v.invalidate()` | request a redraw (e.g. after mutating state in a button handler — buttons already do this). |
| `v.color(name, alpha)` | palette colour as CSS string. `v.rgb(name)` → `[r,g,b,a]`; `v.mix(a, b, t)`. |
| `v.M` | math library (below). `v.Cx`, `v.cx(re, im)` complex numbers. `v.rng(seed)` seeded RNG. |
| `v.fmt(x, digits)` / `v.fix(x, decimals)` | number formatting with a real minus sign (plain text). `v.sci(x, digits)` gives TeX (`1.2\times10^{-5}`) for use inside `$…$`. |

### Stage options

`{ x: [x0, x1], y: [y0, y1], height: 340, equal: false, axes: true | 'box' | false, grid: false,
ticks: true, xlabel, ylabel, xticks: [v | [v, 'label']], yticks, title: 'rich text',
full: false /* force full row */, weight: 1, minWidth: 260, hover: false, aspect /* H/W */ }`

- `equal: true` keeps 1:1 aspect (expands the shorter range) — use for geometry and ℂ.
- `axes: true` draws axes through the origin, `'box'` along the left/bottom edges.
- Several stages sit side by side when wide enough (each at least `minWidth` px) and wrap on
  narrow screens. `full: true` makes a stage take the whole row (stacked layout).
- `hover: true` redraws on mouse move; read `s.pointer = {x, y, inside}`.

### Stage drawing (data coordinates; all return the stage)

Common style keys: `color` (stroke), `width`, `alpha`, `dash` (`true` or `[on, off]`), `fill`
(colour or `true`), `fillAlpha` (default .18), `stroke: false`.

| call | |
|---|---|
| `fn(f, {domain:[a,b], n, fill, base, ...})` | graph of `y = f(x)`; breaks at jumps / non-finite values; `fill` shades to `base` (0). |
| `curve(t => [x,y] or Cx, t0, t1, {n})` | parametric curve. |
| `path(pts, {close})`, `poly(pts)`, `rings([pts...], {evenodd})` | polylines / polygons (`null` in `pts` breaks the line). |
| `line(x1,y1,x2,y2)`, `segment(p,q)`, `hline(y)`, `vline(x)` | lines. |
| `arrow(x1,y1,x2,y2, {head, both})` | arrow. |
| `dot(x,y, {r, hollow, label, labelPos:'ne'|'n'|…, tex})` | marker with pixel radius. `dots(pts, {r})` many at once. |
| `circle(x,y,r)`, `ball(x,y,r,{p})` (ℓ^p ball), `rect(x0,y0,x1,y1)` | shapes (data units). |
| `hband(y0,y1,{color, alpha, edges})`, `vband(x0,x1,…)` | ε- and δ-strips across the panel. |
| `between(f, g, a, b, {fill})` | shade between two graphs. |
| `interval(a,b,y,{open:[l,r], label})` | number-line interval with open/closed ends. |
| `measure(x1,y1,x2,y2,label)` | double arrow with label (e.g. a radius “δ”). |
| `bars(values, {x0:1, dx:1, color: c or (v,i)=>c})` | bar chart of a sequence. |
| `field((x,y) => [u,v], {spacing})` | vector field. |
| `text(str, x, y, {size, color, align, baseline, dx, dy, math})` | canvas text (`math: true` = italic serif). |
| `tex(latex, x, y, {color, size, align, baseline, dx, dy})` | KaTeX label overlay. |
| `corner(str, 'tl'|'tr'|'bl'|'br', {color, weight})` | status text in a corner. |
| `raster((x,y) => [r,g,b,a?] or null, {res, key, id})` | per-pixel image; recomputed only when `key` changes. |
| `heat((x,y) => number, {range:[lo,hi], cmap:'viridis'|'magma'|'diverging', res, key})` | scalar field. |
| `domain(z => Cx, {key, res, contours, gridLines})` | phase portrait of a complex function. |
| `setView([x0,x1], [y0,y1])` | change the window (fine to call inside render). |
| `setTitle(rich)` | change (or add) the stage title. |
| `setTicks(xticks, yticks)` | change custom ticks per mode (`null` = automatic). |
| `axes()`, `grid()` | redraw the axes/grid on top (e.g. after a full-panel `raster`/`domain`). |
| `X(x)`, `Y(y)`, `inv(px,py)`, `bounds`, `width`, `height`, `ctx`, `textPx`, `texPx` | escape hatches for custom canvas drawing in pixels. |

Interaction (create once, outside `render`):

| call | |
|---|---|
| `s.handle(x, y, {color, r, label, labelPos, constrain})` → `h` | draggable point; read `h.x`, `h.y`. `constrain`: `'x'`, `'y'`, `{x:[a,b], y:[c,d]}` or `(x,y) => [x', y']` (e.g. snap onto a curve). `h.onDrag = fn`, `h.visible = false`, `h.set(x,y)`. |
| `s.onDrag((x, y, phase) => …)` | free drag/draw anywhere (`phase`: start/move/end). |
| `s.onClick((x, y) => …)` | click to add points etc. |

### Stage3D

`v.stage3d({ range: 1.6, height: 380, yaw, pitch, zoom, persp: 7 (0 = orthographic), axes,
labels: ['x','y','z'] })`. Methods (points are `[x,y,z]`): `line(p,q)`, `path(pts)`,
`curve(t => p, t0, t1)`, `arrow(p,q)`, `dot(p, {label})`, `text(str, p)`, `tex(latex, p)`,
`poly(pts, {fill, fillAlpha})`, `surface((u,v) => p, [u0,u1], [v0,v1], {n, color, alpha, wire,
colorFn(u,v,p)})`. `s.yaw`/`s.pitch` may be animated. Depth sorting is automatic.

### `v.M` math library

`clamp lerp invLerp remap smoothstep ease sign fract mod range linspace sum mean argmin argmax
dist fmt fix` · `rng(seed)` → `r()`, `r.uniform(a,b)`, `r.int(a,b)`, `r.normal()`, `r.pick`,
`r.shuffle` · calculus: `integrate(f,a,b,n)` (Simpson), `riemann(f, partition, 'left'|'right'|
'mid'|'lower'|'upper')`, `cellValue`, `deriv`, `deriv2`, `bisect`, `newton`, `newtonPath`,
`iterate(g,x0,n)`, `partialSums(term,n,start)`, `rk4(F,t0,y0,t1,n)` · special: `factorial binom
gamma gaussian bump cantorFn cantorIntervals(level)` · Fourier: `dirichlet(N,x) fejer(N,x)
poisson(r,t) fourierCoeffs(f,N) fourierEval(c,t,fejer) trigCoeffs(f,N) trigEval` ·
approximation: `polyEval bernstein(f,n,x) landau(n) lagrange(xs,ys) chebyshevT` · linear
algebra: `dot vadd vsub vscale vlerp norm(a,p) normalize cross3 matVec matMul transpose identity
det inverse solve eigSym2 eig2 svd2 gramSchmidt project` · geometry: `hull pointInPoly polyArea
closestOnSegment closestOnConvexPoly unitBall(p) blob(cx,cy,r,seed)` · complex: `Cx` (methods
`add sub mul div scale neg conj inv abs abs2 arg exp log pow sqrt sin cos`, `Cx.polar(r,θ)`),
`cx I mobius discAuto contourIntegral(f, g:[0,1]→ℂ) winding(g, a)` · colour: `hsl2rgb cmap(t,name)`.

---

## 4. Workflow and checks

```bash
node scripts/check.mjs pma/4 --shots          # static checks + run each viz headless, save shots/<id>.png
node scripts/check.mjs pma-4.19 --shots --dark # one item, dark theme
node scripts/check.mjs pma/4 --static          # only the static checks (fast)
node scripts/check.mjs pma-4.19 --shots --modes # also screenshot every option of each segmented control → shots/<id>~k.png
```

The checker reports import errors, schema problems, unbalanced `$`, KaTeX errors, runtime
exceptions and blank canvases. **Look at every screenshot** (they are PNGs you can open) and
iterate until each one is something you would be proud to show a student: no overlapping
labels, nothing drawn off-screen, sensible ranges, readable readouts. Check a few in `--dark`.

Rules:
- Edit only your own chapter files. Do not modify `assets/`, `scripts/`, other chapters, or run
  git. If the runtime is missing something, work around it and mention it in your report.
- No `import` statements in content files; `v` provides everything. Helpers shared by several
  items in a chapter go at the top of the module as plain functions.
- Prefer deterministic pictures (`v.rng(seed)`) so screenshots are stable; `Math.random` only
  behind a “Resample” button.
- No network access, no DOM access outside the API.
