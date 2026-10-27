# Authoring guide

*Ideas, Visualized* gives the load-bearing ideas of human knowledge (theorems, laws, models,
algorithms, phenomena, inventions and more) an interactive visualization each, and draws the
**dependency graph** that shows how they build on one another across collections and fields.
The atlas began with every numbered result of Walter Rudin's three analysis books; see
MASTER_PLAN.md for the 85 collections it is growing into.

Everything is a static site (no build step for the browser). Content lives in
`content/<collection>/chNN.js`; `node scripts/build.mjs` turns it into `data/` (an index, one
detail file per collection, and the collection colours).

---

## 0. Fields, collections and syllabi

- `content/fields.js` lists the 13 fields and their areas.
- `content/<id>/collection.js` describes a collection: `id`, `short`, `title`, `field`, `area`,
  `order`, `source` (`{type: 'book', author, title, edition, license?, url?}` when the collection
  follows a book's numbering, or `{type: 'course', refs: [...]}` for a curated course), `blurb`,
  and optionally `nick`, `color: [light, dark]`, `chapterLabels: {0: 'Prologue'}`,
  `mapRows: [[fromCh, toCh, label], …]`. Adding a folder with a `collection.js` adds a collection;
  no code changes are needed.
- `content/<id>/syllabus.js` is the planned inventory (see docs/syllabus.md). Planned items
  appear as faded nodes until a chapter file defines an item with the same number.
- docs/fields.md has field-specific guidance; read your field's section.

## 1. Content files

One chapter = one module `content/<collection>/chNN.js` (two-digit chapter). Large chapters may
be split into extra **part files** `chNN-b.js`, `chNN-c.js`, … that export only `collection`,
`chapter` and `items` (the build merges parts and sorts items by number; a chapter's title can
also come from the syllabus). Keep each file under ~1 500 lines; a part per 8–12 items is a good
size.

```js
// Rudin, Principles of Mathematical Analysis — Chapter 4: Continuity
export default {
  collection: 'pma',
  chapter: 4,
  title: 'Continuity',                 // only in chNN.js
  summary: String.raw`2–4 sentences, in your own words, on the arc of the chapter.`,
  items: [
    {
      num: '4.19',                      // the book's number, or the syllabus number, as a string
      kind: 'Theorem',                  // see "kind" below
      name: 'Continuity on a compact space is uniform',
      statement: String.raw`... $\eps$ ...`,
      idea: String.raw`... why it is true (or how it works), 2–4 sentences ...`,
      caption: String.raw`... what to drag / watch, 1–2 sentences ...`,
      deps: ['pma-4.18', 'pma-2.32', 'pma-4.8'],
      see: ['rca-2.x'],                 // optional related items anywhere (no ordering constraint)
      tags: ['compactness', 'continuity'],
      refs: ['Taylor §7.3'],            // optional: where to read more (curated collections)
      scope: String.raw`...`,           // optional: where a law or model holds ("Holds when …")
      credit: 'Heine & Borel, 1872',    // optional: who and when (feeds the timeline)
      links: { wikipedia: 'https://…' },// optional external references
      verify: true,                     // optional: set when unsure of the number or exact hypotheses
      viz(v) { /* see §3 */ },
    },
  ],
};
```

### Field rules

- **Always use `String.raw\`…\``** for any string containing TeX, so backslashes survive.
- **`kind`** — `Theorem Lemma Corollary Proposition Definition` for mathematics, plus `Law
  Principle Postulate Algorithm Model Concept Phenomenon Method Paradox Hypothesis Invention
  Event` for the rest of the atlas. Pick the most honest one (docs/syllabus.md has examples).
- **`num`** — the book's own number (`'2.41'`; three levels such as `'2.4.1'` are allowed) for
  book-anchored collections, the syllabus number for curated ones; never renumber. In a book,
  every numbered *Theorem, Lemma, Corollary, Proposition* in the chapter gets an item. An *unnumbered* corollary that Rudin states right
  after a theorem gets the theorem's number plus a letter (`'2.35a'`, `'2.35b'`); it is shown
  as “Corollary to 2.35”. If a whole section is unnumbered (e.g. RCA's Prologue), number its
  results `0.1, 0.2, …` in order and set `verify: true`.
- **Definitions** — include the *key* numbered definitions that later theorems rely on
  (compactness, Cauchy sequence, measure, Banach space, …): typically 3–10 per chapter.
  `kind: 'Definition'`, `viz` optional (but a good picture of a central definition is welcome).
- **`id`** is derived: `<collection>-<num>`, e.g. `pma-4.19`, `rca-10.15`, `mech-5.3`. Never write it.
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
A single backslash in a normal string or template literal is silently eaten (`\frac` becomes a form
feed + `rac`, `\;` becomes `;`); the checker flags the detectable cases as TeX errors.

### `v` — runtime

| member | description |
|---|---|
| `v.stage(opts)` → Stage | 2D canvas panel. Call repeatedly for side-by-side panels. |
| `v.stage3d(opts)` → Stage3D | 3D panel (drag to rotate). |
| `v.render(fn)` | register `fn(t)`; rerun on any change. |
| `v.animate(fn, {period, speed, autoplay, once})` | continuous `fn(t)`, `t` in seconds (wraps at `period`; `once` stops at the end). Adds play/pause/restart. |
| `v.sim(init, step, {dt, maxSteps})` | fixed-step simulation that follows the animation clock: `S.advance(t)` steps to time t (restarting from `init()` when the clock goes backwards: loop wrap, reset, `--still` jump), `S.state`, `S.reset()`. `step(state, dt, t)` mutates or returns the new state. |
| `v.slider(label, min, max, value, {step, int, log, sig, decimals, fmt, onChange})` | returns `{value, set(x)}`. `int: true` for integers, `log: true` for log scale (drags round to `sig` = 3 significant figures). The default and `set(x)` are kept exact (never snapped to the step grid). |
| `v.toggle(label, value, {onChange})` | switch → `{value}` |
| `v.select(label, options, value, {onChange})` | segmented buttons; options are strings or `{value, label}` (labels may contain TeX). → `{value, set}`; `value` is assignable, `set(v, {fire: true})` also calls onChange. |
| `v.input(label, text, {vars, onChange, width, placeholder})` | text field; with `vars: ['t', 'x']` it compiles a typed formula safely (no eval) → `.fn(t, x)` (last valid version), `.error`, `.value`; errors show under the field. The parser alone is `v.M.compileExpr(src, vars)`. |
| `v.button(label, fn)` | e.g. “Resample”, “Step”. |
| `v.sound()`, `v.soundButton(label, fn)` | audio controller / a speaker button that calls `fn(sound)` — see *Audio* below. |
| `v.onCleanup(fn)` | run `fn` when the viz is destroyed (clear your own `setInterval`s, observers…). |
| `v.shareState(key, {get, set, validate?})` | register opaque custom data for share links; see *Shareable state* below. |
| `ctl.el.hidden = true` | every control exposes its element as `.el` (a button *is* its element): hide controls that do nothing in the current mode. |
| `v.readout(fn)` | live rich text under the panels (TeX allowed); recomputed after each draw. A `\n` in the string starts a new line. |
| `v.legend([[color, label], [color, label, {dash, dot, area}]])` | legend row (call once, or inside render if it changes). |
| `v.t`, `v.play()`, `v.pause()`, `v.restart()`, `v.playing` | animation clock. |
| `v.invalidate()` | request a redraw (e.g. after mutating state in a button handler — buttons already do this). |
| `v.color(name, alpha)` | palette colour as CSS string. `v.rgb(name)` → `[r,g,b,a]`; `v.mix(a, b, t)`. |
| `v.M` | math library (below). `v.Cx`, `v.cx(re, im)` complex numbers. `v.rng(seed)` seeded RNG. |
| `v.fmt(x, digits)` / `v.fix(x, decimals)` | number formatting with a real minus sign (plain text). `v.sci(x, digits)` gives TeX (`1.2\times10^{-5}`) for use inside `$…$`. |

### Shareable state

The item page's **Share / embed** panel creates `#/t/<id>?s=…` links and an iframe with
`?embed=1`. Core slider, toggle, segmented-choice and formula values are read from the runtime,
not scraped from the DOM. Native 2D handles, native Stage3D cameras, proof-step indices and the
animation clock are included. Opening a state pauses playback. Controls replay `onChange`;
handles replay their constraint and `onDrag` callbacks before the first draw. Create controls
and handles once, in a stable order, with stable labels. Changed component inventories and
select options are rejected rather than applied to a different control.

**Opaque state needs an adapter.** Edited graph nodes/edges, freehand points, random samples,
button counters, custom-kit handles/cameras and simulation histories are not automatically
reconstructible from controls. The sharing panel says so. Register the data that determines
the picture, including seeds or samples when relevant:

```js
const G = v.graph(stage, { nodes, edges, editable: true });
v.shareState('edited network', {
  get: () => ({
    nodes: G.nodes.map(({ id, x, y }) => ({ id, x, y })),
    edges: G.edges.map(({ from, to }) => ({ from, to })),
  }),
  validate: data => Array.isArray(data.nodes) && Array.isArray(data.edges),
  set: data => G.set({ ...data, layout: 'none' }),
});
```

Use a unique, stable key and validate your data's actual mathematical constraints (the small
example above only checks its shape). Adapters run after controls and handles and before the
camera, clock and proof step are restored; update any dependent caches in `set`. The snapshot
is copied, so later edits do not change an existing link. Values must be finite numbers,
booleans, text, arrays or plain objects; convert typed arrays explicitly. Functions, audio,
pointer hover and external resources are not serialized. The versioned codec limits decoded
state to 18,000 UTF-8 bytes and rejects malformed or oversized links. Links are tied to one
item. A bad link reports the problem while leaving the visualization available.

### Stage options

`{ x: [x0, x1], y: [y0, y1], height: 340, equal: false, axes: true | 'box' | false, grid: false,
ticks: true, xlabel, ylabel, xticks: [v | [v, 'label']], yticks, title: 'rich text',
full: false /* force full row */, weight: 1, minWidth: 260, hover: false, aspect /* H/W */,
xlog: false, ylog: false }`

- `equal: true` keeps 1:1 aspect (expands the shorter range) — use for geometry and ℂ.
- `xlog: true` / `ylog: true` make an axis logarithmic; give its (positive) range in actual units (`x: [1, 1e4]`).
  `X/Y/inv`, ticks (decades labelled `10 100 1k`, or `10ⁿ` beyond 0.001…100k; 2·10ᵏ, 5·10ᵏ when there
  is room; faint minor ticks/grid at 2…9), `fn` (samples evenly in log x), `between`, `field`, `hist`
  and every primitive follow. Non-positive values break lines / sit below the panel; a log axis lies on
  the panel edge (like `'box'`); `scale` is then pixels per decade.
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
| `circle(x,y,r)`, `ball(x,y,r,{p})` (ℓ^p ball), `rect(x0,y0,x1,y1)` | shapes (data units). `rect` takes `radius` (px) for rounded boxes. Any filled shape takes `hatch: true \| colour` (with `hatchGap`, `hatchAngle`, `hatchAlpha`) for diagonal hatching, e.g. double-counted or excluded regions. |
| `hband(y0,y1,{color, alpha, edges})`, `vband(x0,x1,…)` | ε- and δ-strips across the panel. |
| `between(f, g, a, b, {fill})` | shade between two graphs. |
| `interval(a,b,y,{open:[l,r], label})` | number-line interval with open/closed ends. |
| `measure(x1,y1,x2,y2,label)` | double arrow with label (e.g. a radius “δ”). |
| `bars(values, {x0:1, dx:1, barWidth:0.7, color: c or (v,i)=>c})` | bar chart of a sequence. `barWidth` is a fraction of `dx`: actual width is `barWidth * dx`. When `dx=1/n`, keep a fractional width such as `0.7`; multiplying it by `1/n` again makes the bars disappear. |
| `field((x,y) => [u,v], {spacing})` | vector field. |
| `text(str, x, y, {size, color, align, baseline, dx, dy, math})` | canvas text (`math: true` = italic serif). A string with `$…$` renders through KaTeX ("$0 < x$" is maths); prices are left alone (an odd number of `$`, or a pair like "$5 and $10" whose content is a number followed by words). |
| `tex(latex, x, y, {color, size, align, baseline, dx, dy})` | KaTeX label overlay. |
| `corner(str, 'tl'|'tr'|'bl'|'br', {color, weight})` | status text in a corner. |
| `raster((x,y) => [r,g,b,a?] or null, {res, key, id})` | per-pixel image; recomputed only when `key` changes. |
| `v.ramp(t, to='accent', from='panel')`, `v.diverge(t, neg='blue', pos='red')` | theme-aware colour ramps → `[r,g,b]` built from the panel colour, so heat maps read in light and dark; `s.heat(f, {cmap: 'theme' \| 'theme-diverging', color, neg, pos})` uses them. `raster`/`heat` take `rect: [x0, y0, x1, y1]` to fill only part of the stage. Text: `s.text`/`s.corner(..., {plate: true})` draws a rounded backing box for labels over busy pictures. |
| `heat((x,y) => number, {range:[lo,hi], cmap:'viridis'|'magma'|'diverging', res, key})` | scalar field. |
| `domain(z => Cx, {key, res, contours, gridLines, fade})` | phase portrait of a complex function; `fade` (0–1) blends toward the panel colour so labels drawn on top stay legible. |
| `hist(values or {edges, counts}, {bins, range, density, color, fillAlpha, outline, gap})` | histogram: bars + step outline (binned by `M.histogram`; `density: true` integrates to 1; on a log x axis pass log-spaced edges as `bins`). |
| `colorbar([lo,hi], cmap, {pos:'right'|'left'|'top'|'bottom', label, tex, ticks, fmt, length})` | colour bar on a small panel inside the edge, for a `heat` map (`cmap`: name or `t => [r,g,b]`). |
| `polarGrid({rings, spokes:12, rmax, center, angles:'deg'|'rad'|false, labelAngle, labels})` | polar grid (`rings`: count or radii); use with `equal: true, axes: false`. |
| `setView([x0,x1], [y0,y1])` | change the window (fine to call inside render). |
| `gutter: true` (stage option; or `{l, r, t, b}` px) | **recommended with `axes: 'box'`**: insets the data area so tick labels sit outside it (left and bottom), the x label is centred below the ticks and the y label above the axis, and all drawing is clipped to the data area. No more padding view ranges to keep data off the labels. |
| `setLabels(xlabel, ylabel)` | change the axis labels (`undefined` keeps one, `null` removes it). `setTicks(x, y)` likewise: `undefined` keeps, `null` = automatic. |
| `setScale({xlog, ylog, equal, x, y})` | switch an axis between linear and log, or equal/unequal aspect, in place (with an optional new window); e.g. a lin/log toggle on one panel. Cheap to call every frame. |
| `contour(f, levels, {color, width, dash, res, labels, fmt})` | contour lines of a scalar field `f(x, y)` by marching squares (`levels`: a number or an array; `res` grid cells across, default 120; `labels: true` writes each level on its line). |
| `clip(fn, [x0,x1]?, [y0,y1]?)` | run `fn` with drawing clipped to a data rectangle (default: the window), e.g. `s.clip(() => s.curve(f))`. |
| `setTitle(rich)` | change (or add) the stage title. |
| `setTicks(xticks, yticks)` | change custom ticks per mode (`null` = automatic). |
| `axes()`, `grid()` | redraw the axes/grid on top (e.g. after a full-panel `raster`/`domain`). |
| `X(x)`, `Y(y)`, `inv(px,py)`, `bounds`, `width`, `height`, `ctx`, `textPx`, `texPx` | escape hatches for custom canvas drawing in pixels. |

Interaction (create once, outside `render`):

| call | |
|---|---|
| `s.handle(x, y, {color, r, label, labelPos, constrain})` → `h` | draggable point; read `h.x`, `h.y`. `constrain`: `'x'`, `'y'`, `{x:[a,b], y:[c,d]}` or `(x,y) => [x', y']` (e.g. snap onto a curve). `h.onDrag = fn`, `h.visible = false`, `h.set(x,y)` (free to call inside render). |
| `s.onDrag((x, y, phase) => …)` | free drag/draw anywhere (`phase`: start/move/end). |
| `s.onClick((x, y, mod) => …)` | click to add points etc.; `mod = {shift, alt, ctrl, button}` (e.g. shift-click to decrease). |

### Stage3D

`v.stage3d({ range: 1.6, height: 380, yaw, pitch, zoom, persp: 7 (0 = orthographic), axes,
labels: ['x','y','z'] })`. Methods (points are `[x,y,z]`): `line(p,q)`, `path(pts)`,
`curve(t => p, t0, t1)`, `arrow(p,q)`, `dot(p, {label})`, `text(str, p)`, `tex(latex, p)`,
`poly(pts, {fill, fillAlpha})`, `surface((u,v) => p, [u0,u1], [v0,v1], {n, color, alpha, wire,
colorFn(u,v,p)})`. `s.yaw`/`s.pitch` may be animated. Depth sorting is automatic.

### Audio

`const snd = v.sound()` (one per viz): `snd.tone(partials, {duration: 1, gain: .25, attack: .01,
release: .3, delay, type, harmonics, rolloff})` — `partials` is a frequency, `[f, …]` or
`[[f, amp], …]` (amplitudes normalised to sum 1; `harmonics: n` turns a frequency into a 1/k harmonic
tone) · `snd.chord(f1, f2, …, opts)` (each note a frequency or a partial list) ·
`snd.samples(Float32Array, sampleRate, {gain, loop})` · `snd.noise({color: 'white'|'pink'|'brown',
duration})` · `snd.stop()` · `snd.playing`, `snd.available`. Every play call returns a voice `{stop(), playing, setGain(k), setFreq(f)}`: `sustain: true` holds a tone (or noise) until `stop()`, and `setGain`/`setFreq` change a playing voice smoothly, so a drag can retune or fade a sound live; `glide: f1` slides the fundamental to `f1` Hz over `duration` (a chirp).
`v.soundButton('Play', (snd) => snd.chord(220, 330))` adds a speaker button (stops what is playing
first). Sound starts only after a user gesture (autoplay rules), so trigger it from buttons or handles;
without Web Audio (headless checks) every call is a silent no-op; all sound stops when the viz is destroyed.

### `v.M` math library

`clamp lerp invLerp remap smoothstep ease sign fract mod range linspace sum mean argmin argmax
dist fmt fix` · `rng(seed)` → `r()`, `r.uniform(a,b)`, `r.int(a,b)`, `r.normal()`, `r.pick`,
`r.shuffle` · calculus: `integrate(f,a,b,n)` (Simpson), `riemann(f, partition, 'left'|'right'|
'mid'|'lower'|'upper')`, `cellValue`, `deriv`, `deriv2`, `bisect`, `newton`, `newtonPath`, `nelderMead(f, x0, {step, tol, maxIt})` → `{x, fx, it}` (derivative-free n-dim minimizer for likelihood fits), `hessian(f, x)` (numerical; invert at an MLE for standard errors),
`iterate(g,x0,n)`, `partialSums(term,n,start)`, `rk4(F,t0,y0,t1,n)` · special: `factorial binom
gamma gaussian bump cantorFn cantorIntervals(level)` · Fourier: `dirichlet(N,x) fejer(N,x)
poisson(r,t) fourierCoeffs(f,N) fourierEval(c,t,fejer) trigCoeffs(f,N) trigEval` ·
approximation: `polyEval polyRoots(coef, {start}) polyFromRoots(roots) bernstein(f,n,x) landau(n) lagrange(xs,ys) chebyshevT` · linear
algebra: `dot vadd vsub vscale vlerp norm(a,p) normalize cross3 matVec matMul transpose identity
det inverse solve eigSym2 eig2 svd2 gramSchmidt project` · geometry: `hull pointInPoly polyArea
closestOnSegment closestOnConvexPoly unitBall(p) blob(cx,cy,r,seed)` · complex: `Cx` (methods
`add sub mul div scale neg conj inv abs abs2 arg exp log pow sqrt sin cos`, `Cx.polar(r,θ)`),
`cx I mobius discAuto contourIntegral(f, g:[0,1]→ℂ) winding(g, a)` · colour: `hsl2rgb cmap(t,name)`.

**FFT** (forward `X_k = Σ x_n e^{−2πikn/N}`, unnormalised): `fft(re, im)` in place, any length
(radix-2 for powers of two, exact Bluestein otherwise — never pads; `zeroPad(x, n)`, `nextPow2` if you
want padding) · `ifft` (÷N) · `fftReal(x)` → `{re, im}` · `dft(re, im, inverse)` (naive) ·
`fft2(reRows, imRows)` / `ifft2` in place · `fftShift`, `ifftShift` (1D or rows) · `spectrum(x, fs)` →
one-sided `{freq, amp, phase}` (a cosine of amplitude A reads A).

**Matrices** (arrays of rows): `zeros(m,n) trace outer kron matPow(A,k)` · `lu(A)` → `{L, U, P, perm,
sign, singular}` (PA = LU), `luSolve(lu or A, b or B)` · `qr(A, {thin})` (Householder, R_ii ≥ 0) ·
`eigSym(A)` (Jacobi) → `{values ↓, vectors (columns), vecs (list)}` · `eigH(A)` (complex Hermitian, Jacobi → `{values ↑, vectors: [{re, im}]}`, orthonormal even for repeated eigenvalues — use it instead of `eigC` for Hermitian matrices), `expmC(A)` (complex matrix exponential → [re, im] pairs), `ellipK(m)`, `ellipE(m)` (complete elliptic integrals, m = k², AGM) · `cholesky(A)` → lower L (A = LLᵀ) or null if not positive definite · `genEig(K, M)` (K v = λ M v, M SPD — normal modes) → `{values ↑, vecs}` M-normalised, largest component positive · `eig(A)` (Hessenberg + shifted QR)
→ `{values: [Cx] by |λ| ↓, vectors: [real unit vector | null], cvectors: [{re, im}]}` · complex matrices (entries number | `Cx` | [re, im]): `eigC(A)` → `{values: [Cx], vectors: [{re, im}]}` (repeated eigenvalues come back as exactly equal copies), `solveC(A, b)`, `rrefC(A)`, `rankC(A)`, `nullspaceC(A)` → `[{re, im}]`, `charPolyC(A)` → ascending `Cx` coefficients, `clusterRoots(roots, tol)` → `[{value, mult}]` · `solve(A, B)` also takes a matrix right-hand side · `svd(A)` (m×n,
one-sided Jacobi) → thin `{U, S ↓, V}`, A = U diag(S) Vᵀ · `pinv`, `lstsq(A, b)`, `rank(A, tol)`,
`nullspace(A)` (orthonormal list), `rref(A)` → `{R, pivots}` · `expm(A)` (Padé + squaring) ·
`charPoly(A)` → ascending coefficients for `polyEval`.

**Quanta & light**: `schrodinger1D(V, [x0, x1], {n, k, mass, hbar})` → `{x, E, psi}` (lowest k bound states, ψ = 0 at the ends, ∫|ψ|² = 1) · `crankNicolson1D(re, im, Vgrid, dx, dt, {mass, hbar})` (one unitary time step, in place: wavepackets, tunnelling) · `splitStep1D(V, dx, dt, {m, hbar, Vi})` → `step(re, im)` (split-step Fourier on a periodic power-of-two grid: spectrally accurate momentum, so Ehrenfest/⟨p⟩ checks hold to ~1e-4; `Vi` = absorbing imaginary potential) · `gridSampler(xs, ps)` → `u ↦ x` inverse-CDF sampler for a tabulated density (Born-rule detection clicks), with `.cdf` · `tridiagEig(d, e, k)` · `wavelengthRGB(nm)` → `[r, g, b]` for spectral colours (pass the array as a colour).

**More distributions** in `dist`: `cauchy(x0, γ)`, `lognormal(μ, σ)`, `F(d1, d2)`, `mixture([[dist, w], …])`, `kolmogorov()` (limit law of √n·Dₙ), `negbinom(r, p)` (failures before the r-th success; r may be fractional). Special functions: `digamma(x)`, `trigamma(x)` alongside `lgamma`, `betaI`.

**Probability**: `dist.normal(μ,σ) dist.binomial(n,p) dist.poisson(λ) dist.exponential(rate)
dist.uniform(a,b) dist.gamma(k,θ) dist.beta(a,b) dist.chi2(k) dist.studentT(ν) dist.geometric(p)`
(trials up to the first success, k ≥ 1), each `{pdf (= pmf), cdf, quantile, mean, variance, stdev,
support, discrete, sample(r, n?), span(p)}` with `r = v.rng(seed)` (`dist(p, q)` is still the distance)
· `erf erfc lgamma lbeta gammaP(a,x) gammaQ betaI(a,b,x)` · data: `histogram(xs, {bins, range})` →
`{edges, counts, density, centers, total}`, `quantile(xs, q or [q…])`, `median`, `variance(xs, ddof = 1)`,
`stdev`, `cumsum`, `linreg(xs, ys)` → `{slope, intercept, r, r2, predict(x), seSlope, seIntercept, sigma}`.

**ODEs** (states are numbers or arrays; unlike `rk4` these return `{t: [], y: []}`):
`rk45(F, t0, y0, t1, {tol, rtol, atol, hmax})` (adaptive Dormand–Prince; also `ok`) ·
`implicitEuler(F, J?, t0, y0, t1, n)` (stiff; Newton, numerical Jacobian if `J` omitted) ·
`euler(F, t0, y0, t1, n)` · for `x'' = accel(x, t)`: `verlet`, `leapfrog`, `symplecticEuler(accel, x0,
v0, dt, n)` → `{t, x, v}` · `gillespie(rates, stoich, x0, tMax, r)` → `{t, x, reactions}` (exact SSA;
`rates` = `x => [a_j]` or `[x => a_j]`).

**Physics**: `CONST` (SI, CODATA 2018: `c h hbar kB NA e me mp mn u G eps0 mu0 ke R F sigma b alpha Ry
a0 muB eV g0 atm T0 au ly pc yr Msun Rsun Lsun Mearth Rearth`; units in `CONST_UNITS`) ·
`si(x, unit, digits)` → `"2.34 mA"` · `pow10Text(k)` → `"10⁻³"`.

**Number theory** (Number or BigInt): `gcd lcm egcd(a,b)` → `{g, x, y}` · `modpow(b,e,m)` (exact at any
size) · `modinv` (null if none) · `isPrime` (deterministic Miller–Rabin below 3.3·10²⁴) · `sieve(n)` →
primes · `factor(n)` → `[[p, e]…]` · `primeFactors(n)` → `[2, 2, 3]` · `totient` · `contFrac(x or
[p, q], n)` · `convergents(a or x)` → `[[p, q]…]`.

**Music**: `midiToFreq(m, a4 = 440) freqToMidi centsBetween(f1, f2) noteName(m, {flats})` (`"C♯4"`) ·
`plompLevelt(f1, f2, a1, a2)` (Sethares, peak 1) · `dissonance(partials…)` (sum over all pairs).

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
- A literal dollar sign in any rich string (statement, caption, readout, labels) is written `\$` (e.g. `String.raw`costs \$20``); a bare `$` opens TeX. `s.contour` ignores `dash` (each cell segment restarts the pattern), so use `alpha` or `width` to de-emphasize contours.
- No `import` statements in content files except one: `v` provides everything. Helpers shared by
  several items in a file go at the top of the module as plain functions; helpers shared by the part
  files of one chapter go in `content/<col>/chNN.shared.js` (named exports) and are imported with
  `import { f } from './chNN.shared.js';`.
- Prefer deterministic pictures (`v.rng(seed)`) so screenshots are stable; `Math.random` only
  behind a “Resample” button.
- No network access, no DOM access outside the API.

---

## 5. Kits

Higher-level building blocks on `v` for algorithms, networks, tables and step-by-step constructions — full
reference, worked examples and the list of demos in **[docs/kits.md](docs/kits.md)** (live demos:
`tools/harness.html?file=tools/demos/kits.js&id=demo-1.1` … `demo-1.16`). Create once, draw inside `v.render`.

| kit | |
|---|---|
| `v.graph(stage, spec)` → `G` | node-link diagrams: layouts `force circle grid layered tree fit none`, arrows/curved parallel edges/self-loops, weight labels, dragging and editing (`onChange`), hit-testing, and `bfs dfs dijkstra topoSort mst maxflow` returning step events with ready-made `view`s for `G.draw`. |
| `v.graphs(name, …)` | generators to spread into a spec: `random grid complete cycle path star wheel bipartite tree hypercube petersen fromAdjacency`. |
| `v.steps({frames, code})` → `S` | step-through player (⏮ ◀ ▶ ▶\|, scrubber, counter) with highlighted pseudocode, per-frame notes, `S.frame`, `S.reset()`, optional gliding transitions (`S.tween`). |
| `v.table(stage, spec)` → `T` | grids of cells (DP, Cayley, payoff, truth, transition tables): TeX/pair values, fills, highlights, headers, `T.hit`, `T.arrow`/`T.pointer` back-pointers. |
| `v.icons(stage, spec)` → `I` | icon arrays / natural frequencies (person pictograms or dots), waffles, **split blocks** for conditioning (`block: i → k`, `blockLabels`), **parliament hemicycles** (`layout: 'hemicycle'`); groups = consecutive runs `{n, color, label}`; every re-arrangement glides; hover shows group counts; `I.set` is free to call every frame; `I.legend()`, `I.pos(i)`, `I.bbox(k)`, `I.blocks()`, `I.hit`. Demos `demo-1.15`, `demo-1.16`. |

## 6. Pitfalls found by chapter writers (read before your first viz)

Each of these cost somebody an hour. They are about the runtime as it is today.

**Drawing and layout**
- `s.raster` / `s.heat`: `res` is the pixel **block size** (2–4 is fine), not a grid resolution. A large value silently draws nothing or a blocky map. With `equal: true` a heat map fills the whole stage — pass `rect: [x0, y0, x1, y1]` to confine it.
- `s.contour` takes an explicit array of levels, samples evenly in data units (coarse on log axes) and cannot be limited to a rectangle — wrap it in `s.clip`.
- `s.field` spacing is in **pixels**; a data-unit value hangs the page.
- `s.circle` draws an ellipse on stages without `equal: true`; use a hollow `s.dot` for rings there. A hollow dot paints the panel colour inside, covering a fill drawn under it — draw the ring first, the fill after.
- `s.line` is a segment, not an infinite line.
- `gutter: true` fixes the bottom margin when the stage is created: pass the `xlabel` at creation (or call `setLabels`, which now refits). Everything is clipped to the data area; `corner()` now sits inside it.
- Stage text: `$…$` goes through KaTeX; prices like "$5 and $10" stay plain. Axis tick labels are plain text (use Unicode superscripts, `M.pow10Text`). `s.tex` takes raw LaTeX **without** `$`. In canvas text a bare `$` is fine and `\$` prints the backslash (rich text/captions are the opposite: write `\$`). There is no monospace option and no multiline text — wrap by hand.
- Palette `ink` turns light in dark mode; use fixed RGB arrays for things that must stay dark (charcoal, soot).
- Stages have a minimum height of about 200 px, so thin strips come out tall. `equal: true` with a gutter widens the window beyond the requested range — drop `equal` where exact counting matters.
- Check complete strokes, hollow-marker rings, handle hover halos and label backing plates at narrow widths. A glyph fitting inside the stage does not establish that its plate leaves neighboring labels visible. Wait for fonts and split long displayed equations when necessary.
- Check custom `s.text`/`s.tex` glyphs against the inner data area when a stage has gutters: a label can fit inside the canvas yet be clipped by the plot boundary. Keep axis tick labels under their separate canvas bounds. See the [COMB5 review](docs/verification/wave5-comb-review.md).
- Use `stage.bounds` for background masks and reference lines after fitting an equal-scale view: the realized limits can extend beyond the requested ranges. Check labels at both ends of a moving marker's range, and separate nearby endpoint labels without moving the endpoints. The [CTRL6 review](docs/verification/wave6-ctrl.md) caught both defects in otherwise passing canvas checks.
- A complete range can hide the mechanism being taught. If one fast root compresses a stability crossing into unresolved pixels, retain the full locus and add a labelled crossing-detail view using the same roots. Keep numerical root coordinates separate from exact stability counts.
- Give `step: 'any'` sliders an explicit formatter or decimal count; their default display cannot derive precision from that string. Use `int: true` when saved values must be integers: a native step grid alone does not impose that restore constraint. See the [GEOG7 review](docs/verification/wave5-geog-review.md).
- Check the actual narrow-screen canvas height when drawing at fixed pixel coordinates. Responsive stage scaling can leave a row below the canvas even when the requested height seems sufficient. Place labels and terms on separate rows, wrap notes, and verify the last row through the actual offered presets and steps in both themes. See the [PL layout peer](docs/verification/pl-local-layout-independent-peer.md).
- Verify statements and ideas on the actual strict-built page at 320px in both themes. Check each KaTeX display’s inner scroll width as well as its container, after fonts load. A fixed-width harness can pass while a narrower production card clips the same equation; use equivalent line breaks at that actual width.
- Measure visible text ranges against content padding too. A 285px outer statement can fit while its 253px inner display scrolls to260px; the [LING closing peer](docs/verification/ling-independent-prerequisite-peer.md) caught exactly this case. Save and inspect complete fields, including the ends of long proofs.
- Include the complete scope block in that check. Rich text does not parse Markdown links or raw HTML: put short source labels/pages in prose and exact external URLs in the item’s `links` map, which the detail page renders as clickable links. A literal long URL can overflow even when every equation fits.
- For pixel-comparison failures, persist the exact compared candidate and reference pixels plus a difference image before asserting or closing the browser. Record the actual view/control/moving state. A later redraw screenshot or a reference from a different renderer cannot locate the failed oracle’s differences.

**Controls and state**
- `v.readout(fn)` must be registered **once**, outside `v.render`; calling it inside the render loops forever. Set a variable in render and read it in the readout.
- `h.set(x, y)` and the `set` of selects/sliders are safe inside render (no-ops when unchanged). `v.select(...).value` is assignable; `set(v, {fire: true})` also calls `onChange`. `v.input` fires `onChange` only when the user types, not on `set()`; `v.input` with `vars` rejects `sigmoid`/`relu` — use your own parser.
- Options of a `v.select` are fixed at creation: for lists that depend on state use a "next example" button.
- `v.select` renders segmented buttons with a labelled group, not a native HTML select. Native probes must click the actual offered buttons; use physical keyboard/pointer input for sliders and record the resulting readout before taking a state picture.
- Check which controls are actually visible in each mode. Control CSS can override an HTML `hidden` attribute, leaving an overridden input on screen even when the calculation is correct. Use chapter-local display state and assert the visible inventory, including historical-constant modes. See the [MATHBIO visibility review](docs/verification/wave5-mathbio-review.md).
- Treat graph-kit node IDs as opaque identities. Editing an emptied graph can create IDs such as `n0`; converting an ID suffix to a number can break adjacency lookup. Match the kit's string identity convention consistently for nodes and endpoints, and exercise delete-all → add vertices → add edges → restore a preset. See the [CPLX runtime peer](docs/verification/cplx-local-runtime-independent-peer.md).
- Hiding a stage: set `stage.el.style.display = 'none'` (`el.hidden` does not work on a flex `.stage`). The checker ignores hidden stages. Clicking a handle never fires `onClick`; selecting by dragging works.
- `v.animate` has one clock per viz and its period is fixed at registration. For button-triggered motions use your own `requestAnimationFrame` loop, cleaned up with `onCleanup`, and jump to the end under `window.__vizStill`. Do not call `v.restart()` on the first frame. Screenshots without `--still` are taken ~1.5 s into an animation; set a `still` frame with a meaningful state.
- Heavy computation: spread it over frames with a `setTimeout` loop that calls `v.invalidate()`; `s.dots` is slow above ~10⁴ points (draw squares directly on `s.ctx`).
- Match slider domains to the model: use `step: 'any'` for continuous values, or reject unsupported raw saved ticks locally before the setter runs for a discrete model. Compare the actual numeric DOM value directly with the registered/model value; for logarithmic controls compare against its declared log transform within browser serialization precision. Comparing two sanitized native ranges can hide a step/model mismatch. Keep exact saved/model values and test off-grid raw restores as well as valid edited replay. Do not round the mathematics or change shared replay behavior to make a test pass.
- If an offered rational share is converted to an integer count, compute the declared rounding from its integer tick numerator and denominator. Binary multiplication can put a positive half tie below its exact value: `.35 * 90` and `.7 * 45` round to31 instead of32. Exhaust the finite offered tick/count grid with an independent integer oracle. Preserve separately declared continuous inputs rather than snapping them onto that grid. See the accepted [learning](docs/verification/bighist-learning-peer.md) and [aggregation](docs/verification/polsci-aggregation-rounding-peer.md) corrections.
- A handle's drag constraint can silently clamp a restored point. Validate raw saved coordinates before that constraint, including the actual finite/grid domain and any consistency with a saved control. Invalid states must notify and reset; test every handle separately. A chapter-local constraint can distinguish an active drag through the returned handle’s public `dragging` flag, clamp that drag and throw for an invalid restored point. The mount then resets to fresh defaults; test a mixed payload with another valid changed control to verify that every component resets.
- The current logarithmic slider sets its own native step even when passed `step: 'any'`. If an instance requires continuous log input, set its native step explicitly, resynchronize its value, and check actual Home/End endpoints plus off-grid replay. Browser exponent serialization can otherwise change an exact endpoint.

- Offscreen visualizations pause rendering. Before a state screenshot, bring the visualization into view, wait for fonts and a fresh frame, and assert model/control/readout agreement. A full-page screenshot can otherwise combine fresh controls with an old canvas.
- Check complete contour strokes at intermediate native states, including pointer drags. Filtering only centre coordinates at the current view boundary can crop a round cap or join. An actual pixel inset of at least half the stroke width keeps a straight segment inside the convex plot rectangle; independently reconstruct bounds from data coordinates. See the accepted [fusion contour counterexample](docs/verification/energy-erratum-peer.md).

**Numerics and data**
- Normalize an exact complex direction before converting its components to floating point. Separately rounded tiny components can change the displayed phase, while expanded polynomial evaluation can cancel near a pole. For a magnitude, avoid squaring through underflow/overflow; retain finite status and a logarithmic magnitude when a finite answer exceeds the display range. The [CTRL6 review](docs/verification/wave6-ctrl.md) includes independent adjacent-pole and subnormal references.
- Handle empty collections explicitly in counts: a seeded maximum followed by `+1` can invent one colour class for zero vertices. Check named graph presets with an explicit adjacency-preserving permutation; a label saying “isomorphic” is not evidence that the stored edge lists match. The [CPLX peer](docs/verification/cplx-local-runtime-independent-peer.md) retains both actual counterexamples.
- `rng.shuffle` returns a **copy**. `v.rng` gives 32-bit uniforms: build 53-bit values from two draws when summing many terms. `M.bisect(f, a, b, tol)` takes a number, not an options object. `M.smoothstep` has one argument. `M.solve` inverts the matrix — write a banded/dense solver for big systems.
- `M.eigC` does **not** return orthogonal eigenvectors for repeated eigenvalues: use `M.eigH` for Hermitian matrices. `M.eigSym` fixes only the sign of each vector's largest component (it flips across a degeneracy).
- Root finders that scan for sign changes must test every grid point (a root exactly on a grid point is easy to miss).
- A fixed iteration budget does not establish equilibrium. Check the stated equation's residual at offered control extremes, expose nonconvergence, and do not hide invalid returned values by clipping the drawing.
- On log axes a zero error cannot be drawn: clip to a floor (~10⁻¹⁷) and say so.
- For tiny widths around a nonzero centre, forming absolute endpoints can lose the width before evaluation. Evaluate a ramp in centred coordinates, such as `0.5 + (x - centre) / width`, and handle width zero explicitly. Test sub-ULP widths and independent midpoint values.
- Array `some` and `every` skip missing indices. Validate dense own indices before generating samples from a declared finite event list; include sparse outer and inner arrays in malformed-input checks.

**3D**
- `stage3d` has no handles, no click hit-testing and no sphere/surface primitives; `v.scene3` has handles (to planes or lines through the origin), polygons and dots but no hidden-line removal, tubes, sphere shading or box clipping. Build surfaces from polygons (`patch`/`planePatch` helpers exist in `content/vcalc/ch01.shared.js`), draw far-side curves faintly, and sync the yaw/pitch of two scenes by hand.

**Content discipline**
- The syllabus decides which items exist, their numbers, kinds and deps. If your brief and the syllabus disagree, build the syllabus.
- After changing prerequisites, parse each changed item and its syllabus row and compare their complete expected dependency lists, including multiline rows. Removing newly added IDs and comparing the remainder cannot detect an omitted addition. Preserve immutable object/function snapshots as explicit review utilities rather than lasting default tests.
- A chapter's `chNN.shared.js` may import its own chapter's helpers; other chapters of the same collection may re-export from it (`export * from './ch01.shared.js'` works); never import across collections — copy.
- Say in the item what is illustrative, what is from memory, and what is a secondary source. Recompute printed numbers (the Pearson, Rabin and Patriot items each found real slips that way).
- A numerical coordinate distance or a display proxy does not establish a perceptual threshold. State the observer, conditions and source for a perception claim; keep authored model calculations distinct from measured brightness, visibility or structural safety.
