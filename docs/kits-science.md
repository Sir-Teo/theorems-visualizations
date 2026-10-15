# Science kits

Five kits for the natural sciences and engineering: **`v.phasePlane`** (planar ODEs), **`v.fields`** (2D vector
fields and potentials), **`v.quantum`** (qubits), **`v.mol`** (molecules and orbitals) and **`v.circuit`**
(schematics + circuit solver). Each is registered in `assets/js/viz/kits/index.js` and called from a `viz(v)`
like any other API member. Demos of every kit: `tools/demos/kits-science.js`
(`tools/harness.html?file=tools/demos/kits-science.js&id=demo-2.1`). Numerical tests: `node tests/kits-science.test.mjs`.

**Calling conventions.** Single-purpose kits take the stage first: `v.phasePlane(stage, spec)`, `v.fields(stage, spec)`,
`v.circuit(stage, parts)`; create them **once** (outside `render`) and call `.draw()` inside `v.render`/`v.animate`.
`v.quantum` and `v.mol` are **namespaces**: the core exposes every kit as a function, so `v.quantum()` (no arguments)
returns an object of helpers bound to this viz, and `v.quantum('bloch', s3, ψ)` calls one helper directly
(the same string-dispatch shape as `v.graphs('petersen')` and `v.geo('haversine', …)`).

```js
const Q = v.quantum();   // Q.circuit, Q.bloch, Q.diagram, Q.amplitudes, …
const Mo = v.mol();      // Mo.draw3d, Mo.levels, Mo.orbitalSlice, Mo.get, Mo.hydrogen, …
```

Everything numerical is DOM-free and exported from the kit files for tests and for reuse by other kits
(`fixedPoints`, `orbit`, `lineIntegrals`, `isolines`, `streamlines`, `Circuit`, `QState`, `Netlist`, `hydrogen`, …).
Colours are palette names throughout; every layer adapts to light and dark.

---

## `v.phasePlane(stage, spec)` — planar ODEs

`x' = f(x, y, t, p)` on the stage's window. Fixed points are found by damped Newton from a grid of seeds and classified
from the Jacobian's eigenvalues; trajectories are integrated in pixel-limited steps (smooth at any zoom), forward and
backward, and stop at the edge, at a stable fixed point, or once they close up / converge onto a limit cycle (successive
returns to a Poincaré section through the start agree to < 0.6 px, with a geometric-extrapolation check so slowly
decaying spirals are not mistaken for cycles).

| spec key | default | |
|---|---|---|
| `f(x, y, t, p) → [dx, dy]` | required | the vector field; `p` = current params |
| `params` | `{}` | object of numbers, controls (`{value}`) or functions; its values are the cache key |
| `key` | — | extra cache key (function) if `f` reads state outside `params` |
| `field` | `'arrows'` | `'arrows'` (direction field, opacity ∝ log speed), `'stream'` (evenly spaced streamlines), `'none'` |
| `nullclines` | `true` | `x' = 0` orange, `y' = 0` purple (marching squares, poles rejected) |
| `fixedPoints` | `true` | glyphs: stable = filled green, unstable = hollow red, saddle = half-filled ink with eigen-direction ticks, center = teal rings; spirals/centers get a swirl showing the rotation sense |
| `separatrices` | `false` | stable (green) / unstable (red) manifolds of saddles |
| `H(x, y, p)`, `contours` | — | conserved quantity: `contours` = count, array of levels, `(p) => levels`, or `{n, levels, color}`; the level through each saddle is dashed |
| `seeds` | `[]` | initial trajectories `[[x, y, colour?], …]` |
| `click` | `true` | click on the stage launches a trajectory |
| `both` | `true` | also integrate backward in time (drawn faint) |
| `method`, `dt`, `tMax` | `'rk4'`, `0.02`, `200` | `'rk45'` = Dormand–Prince with error control; `dt` = largest step |
| `trajColor` | `'accent'` | colour, `'cycle'`, or `(i) => colour` |
| `maxTraj`, `labels`, `J(x,y,t,p)` | `12`, `false`, — | FIFO limit; write the type beside each equilibrium; analytic Jacobian |

| member | |
|---|---|
| `pp.draw({field, particles, t, …})` | draw every layer (per-call overrides; `particles: true` puts a gold dot at time `t` on each trajectory) |
| `pp.trajectories` | `[{x0, y0, color, fwd, bwd}]`, branches `{pts, ts, stop, period}`, `stop` ∈ edge · fixed point · closed orbit · limit cycle · time |
| `pp.fixedPoints()` | `[{x, y, type, kind, stable, l: [{re, im}], vecs, J, tr, det}]` |
| `pp.add(x, y)`, `pp.clear()` | launch / remove trajectories |
| `pp.at(k, t)` | position at time `t` on trajectory `k` |
| `pp.describe({digits, max, eig})` | rich text for `v.readout`: “(1, 1) **center** (λ = 0 ± 1i) · …” |
| `pp.legend(extra)` | sets the legend and keeps it in sync with the kinds of equilibria in view |

```js
viz(v) {   // damped pendulum: spirals, saddles, separatrices, energy
  const s = v.stage({ x: [-7, 7], y: [-3.5, 3.5], height: 360, axes: 'box', xlabel: 'θ', ylabel: 'ω' });
  const b = v.slider('damping $b$', 0, 1, 0.2, { step: 0.01 });
  const pp = v.phasePlane(s, {
    f: (x, y, t, p) => [y, -Math.sin(x) - p.b * y], params: { b },
    field: 'stream', nullclines: false, separatrices: true,
    H: (x, y) => y * y / 2 - Math.cos(x), contours: [], seeds: [[-4.6, 2.75]],
  });
  v.button('Clear trajectories', () => pp.clear());
  v.render(() => pp.draw());
  pp.legend();
  v.readout(() => pp.describe({ max: 3 }));
}
```

## `v.fields(stage, spec)` — 2D vector fields and potentials

Sources superpose; **charges are line charges** (2D law, `E = q r̂ /(2π ε₀ r)`), so Gauss's law holds exactly for every
closed curve in the plane: `∮ E·n ds = q_enc/ε₀`. `law: '3d'` gives point charges seen in a plane (1/r², no planar Gauss
law). Every field is `F = −∇φ`; vortices have a stream function ψ instead (`F = (∂ψ/∂y, −∂ψ/∂x)`). The loop integrals
use adaptive Simpson on the exact curve (circle or polygon), accurate to ~1e-10.

| spec key | default | |
|---|---|---|
| `sources` | `[]` | `{type: 'charge' (q) \| 'source' (m) \| 'vortex' (gamma) \| 'mass' (m), x, y, draggable: true, label, color}` — draggable handles (charge + red / − blue, vortex purple, source teal, mass gold) |
| `law`, `eps0`, `G` | `'2d'`, `1`, `1` | units: flux = q/ε₀; a mass m has flux −G m |
| `uniform` | — | `[U, V]` or `() => [U, V]` background field |
| `F`, `extra`, `phi`, `psi` | — | custom field (replaces sources), added field, custom potential / stream function |
| `lines`, `lineDensity` | `true`, `8` | field lines seeded around each source, number ∝ \|strength\| (lines arriving at sinks are not re-seeded); `seeds: [[x, y]]` adds lines |
| `equipotentials` | `false` | `true` or `{n, levels, color}`: φ > 0 red, φ < 0 blue, φ = 0 dashed |
| `streamFunction` | `false` | level sets of ψ |
| `streamlines`, `streamSep` | `false`, `24` | evenly spaced streamlines (Jobard–Lefer) instead of field lines |
| `arrows` | `false` | direction-field arrows |
| `heat` | `false` | `'potential'` (signed, theme-safe red/blue ramp) \| `'magnitude'` (log \|F\|) \| `'stream'` |
| `loop` | — | `{type: 'circle', x, y, r}` (centre + rim handles) or `{type: 'poly', pts}` (a handle per vertex) |
| `loopArrows` | `'normal'` | arrows of F·n (out green / in red) or `'tangent'` (F·t) or `'none'` |

| member | |
|---|---|
| `F.draw({heat, lines, loopArrows, …})` | draw (per-call overrides) |
| `F.flux()`, `F.circulation()`, `F.integrals()` | numerical ∮F·n ds, ∮F·ds (counter-clockwise), both + length |
| `F.enclosed()` | `{q, gamma, n}`: strengths inside the loop (Gauss: flux = q/ε₀; Stokes: circulation = gamma) |
| `F.field(x, y)`, `F.potential(x, y)`, `F.stream(x, y)`, `F.F()` | evaluate at the current source positions |
| `F.setStrength(i, q)` | change a source's strength (handle colour and label follow) |
| `F.sources`, `F.handles`, `F.live()`, `F.legend(extra)` | data; live positions; auto-synced legend |

```js
viz(v) {   // Gauss's law for a dipole
  const s = v.stage({ x: [-3.2, 3.2], y: [-2, 2], equal: true, height: 380, axes: false });
  const F = v.fields(s, {
    sources: [{ type: 'charge', x: -1, y: 0, q: 1 }, { type: 'charge', x: 1, y: 0, q: -1 }],
    lines: true, equipotentials: { n: 16 }, heat: 'potential', loop: { type: 'circle', x: -1.3, y: 0.3, r: 0.85 },
  });
  v.render(() => F.draw());
  F.legend();
  v.readout(() => `$\\oint E\\cdot n\\,ds = ${v.fix(F.flux(), 4)}$, $q_{enc}/\\varepsilon_0 = ${v.fix(F.enclosed().q, 4)}$`);
}
```

Shared helpers exported from `kits/fields.js`: `gridOf`, `isolines` (marching squares → linked polylines), `contours`,
`niceLevels`, `lineIntegrals`, `streamlines`, `traceLine`, `sourceField`, `sourcePotential`, `sourceStream`,
`arrowField`, `arrowPath`, `signedRamp`.

## `v.quantum()` — qubits

A state-vector simulator for ≤ 6 qubits. Basis labels read **q0 q1 … left to right** (q0 is the most significant bit);
qubits start in |0⟩; rotations take the angle first (`rx(θ, q)`).

| `Q.` | |
|---|---|
| `circuit(n)` → `qc` | chainable: `h x y z s sdg t tdg (q)`, `rx ry rz p (θ, q)`, `cx(c, t)` (= `cnot`), `cz(a, b)`, `swap(a, b)`, `measure(q?)` (diagram marker; all qubits if omitted), `add(name, qubits, θ)`, `setTheta(k, θ)`, `clear()` |
| `qc.state(k)` → `QState` | state after the first `k` ops (cached); `qc.length`, `qc.ops`, `qc.layout()`, `qc.probs(k)`, `qc.sample(shots, rng, k)` |
| `QState` | `probs()`, `prob('01')`, `amp(i) → {re, im, abs, arg}`, `sample(shots, rng) → {counts, freqs}`, `bloch(q)` (reduced Bloch vector; length < 1 when entangled), `rho(q)`, `purity(q)`, `entropy(q)`, `measure(q, rng)` (collapses), `ket(digits)` (TeX), `label(i)` |
| `ket('01')`, `state(amps)` | basis state; normalised state from amplitudes `[[re, im], …]` |
| `bloch(s3, state, o)` | Bloch sphere on a Stage3D (switches off the stage's own axes): `state` = QState (`o.qubit`), `[x,y,z]`, `{theta, phi}` or two amplitudes; `o: {trail: [[x,y,z]], angles, project, labels, color, extra: [{v, color, label}]}` |
| `diagram(s, qc, o)` | circuit on a 2D stage (`axes: false`): wires, gate boxes (angles as π-fractions), controls, ⊕, swaps, meters; `o: {step, onPick(k), labels, init, colWidth, wireGap, gateColor, wireEnd: 'full'}`; ops `< step` are drawn solid and the column of op `step − 1` is highlighted |
| `amplitudes(s, state, o)` | bars of \|a\|² (`mode: 'prob'`) or \|a\| (`'amp'`), colour = phase (0 blue, π/2 pink, π orange, −π/2 green; wheel inset); `o.counts` overlays sampled frequencies as ticks |
| `phaseColor(φ)`, `fmtAngle(θ)`, `toBloch(…)`, `GATES` | helpers |

```js
viz(v) {   // Bell state, step by step
  const Q = v.quantum(), qc = Q.circuit(2).h(0).cx(0, 1).measure();
  const sd = v.stage({ height: 150, axes: false, full: true });
  const sa = v.stage({ height: 270, axes: false }), s3 = v.stage3d({ height: 270, range: 1.55 });
  const step = v.slider('step', 0, 4, 4, { int: true }), rng = v.rng(1);
  v.render(() => {
    const psi = qc.state(step.value);
    Q.diagram(sd, qc, { step: step.value, onPick: (k) => step.set(k) });
    Q.amplitudes(sa, psi, { counts: step.value === 4 ? psi.sample(1000, rng) : null });
    Q.bloch(s3, psi, { qubit: 0 });   // shrinks to the centre once q0 is entangled
  });
  v.readout(() => `$|\\psi\\rangle = ${qc.state(step.value).ket()}$`);
}
```

## `v.mol()` — molecules, MO diagrams, orbitals

| `Mo.` | |
|---|---|
| `draw3d(s3, mol, o)` | ball-and-stick on a Stage3D. `mol`: library name or `{atoms: [{el, pos}] \| [[el, pos]], bonds?: [[i, j, order]]}` (Å). Bonds omitted → auto-bonded by covalent radii (d < r₁ + r₂ + 0.4 Å, orders guessed from the contraction). Order 2/3 = parallel sticks, 1.5 = dashed inner line (aromatic). `o: {style: 'ballstick' \| 'spacefill' \| 'stick', scale, labels: true \| 'heavy', highlight: [i], colors: {el: palette}, center}`. CPK-like palette names (H light, C dark — both theme-aware; N blue, O red, F/Cl green, S gold, P orange, …). Spin with `s3.yaw` in `v.animate`; fit with `s3.zoom`. |
| library | `H2 H2O CO2 CH4 NH3 C2H4 C6H6 SF6 C2H5OH` (aliases: water, methane, ammonia, ethylene, benzene, ethanol); experimental geometries |
| `get(m)`, `formula(m)`, `formulaTeX(m)`, `molarMass(m)`, `distance(m, i, j)`, `angle(m, i, j, k)`, `autoBond(atoms)` | data helpers (angles in degrees) |
| `levels(s, spec)` | energy-level / MO diagram (stage `axes: false`). `spec.levels: [{E, label (TeX), deg, occ, col, type: 'bonding' \| 'antibonding' \| 'nonbonding', color, dx}]`, `columns: [TeX]`, `electrons: n \| {col: n}` (Aufbau + Pauli + Hund where `occ` is omitted), `links: [[i, j]]` (dashed correlation lines), `unit`, `energies`, `homo`, `range`, `mo` (molecule column). Returns `{bondOrder, unpaired, homo, lumo, energy, occ}` for the molecule's levels. |
| `orbitalSlice(s, ψ, o)` | signed heat map (red ψ > 0, blue ψ < 0) with contour lines and dashed nodal lines. `ψ`: `(x, y) → value` or a hydrogen orbital `'2p_z'`, `'3d_{z^2}'`, `'3dxy'`, `{n, l, m}`; `o: {plane: 'xz' \| 'xy' \| 'yz', offset, Z, mode: 'psi' \| 'density', gamma, contours, nodes, pos, neg}`. Data units are a₀. Returns `{name, n, l, m, E, radialNodes, angularNodes, max}`. |
| `hydrogen(n, l, m, Z)` / `hydrogen('3d_xz')` | real ψ_nlm(x, y, z) for n ≤ 4 (associated Laguerre × real spherical harmonics, normalised) |
| `radial`, `realY`, `laguerre`, `legendre`, `orbitalSpec`, `energyH(n, Z)`, `orbitalExtent(n)`, `aufbau(levels, N)`, `spins(g, k)` | building blocks |

```js
viz(v) {   // H₂ molecular orbitals
  const Mo = v.mol(), s = v.stage({ height: 330, axes: false });
  const sel = v.select('species', ['H2+', 'H2', 'He2'], 'H2'), N = { 'H2+': [1, 0], H2: [1, 1], He2: [2, 2] };
  let info;
  v.render(() => {
    const [l, r] = N[sel.value];
    info = Mo.levels(s, {
      columns: ['1s', sel.value, '1s'], unit: 'eV', energies: true, homo: true,
      levels: [{ E: -13.6, label: '1s', col: 0 }, { E: -15.5, label: '\\sigma_{1s}', col: 1, type: 'bonding' },
               { E: -11, label: '\\sigma^*_{1s}', col: 1, type: 'antibonding' }, { E: -13.6, label: '1s', col: 2 }],
      electrons: { 0: l, 1: l + r, 2: r }, links: [[0, 1], [0, 2], [3, 1], [3, 2]],
    });
  });
  v.readout(() => `bond order ${info.bondOrder}, unpaired electrons ${info.unpaired}`);
}
```

## `v.circuit(stage, parts)` — schematics and a circuit solver

`parts` (or `{parts, ...options}`): each part has `type`, optional `id`, `name`, `label`, and either node names
(`a`, `b`) or grid positions `at: [x0, y0, x1, y1]` (terminal a, terminal b) — usually both or just `at`: nets are joined
by name **and by geometry** (wire polylines, T-junctions, ground symbols), so wires need no names. Ground: nodes `'0'`,
`'gnd'`, or any net touching a `GND` part (else the − terminal of the first voltage source).

| type | fields | model |
|---|---|---|
| `R` | `value` (Ω) | conductance |
| `C` | `value` (F), `ic` (V) | DC open; AC jωC; transient BE / trapezoidal companion |
| `L` | `value` (H), `ic` (A) | DC short; AC jωL; transient companion (branch current) |
| `V` | `value` (DC), `wave` (`t => v`, `{type: 'step' \| 'sine' \| 'pulse', …}`), `ac` (`mag` or `{mag, phase°}`) | `a` is the + terminal |
| `I` | `value`, `wave`, `ac` | pushes the current from `a` to `b` |
| `SW` | `closed` (default true), `closedAt`, `openAt`, `ron` | ideal switch |
| `D` | `model: 'shockley'` (`Is`, `n`) or `'ideal'` (`vf`) | Newton with junction-voltage limiting / on-off state iteration; AC linearised at the operating point |
| `OA` | `at: [x, y]`, `plus`, `minus`, `out`, `gain` (∞), `rails: [lo, hi]`, `flip`, `mirror` | ideal op-amp (pins: − at (x−1.5, y+0.5), + at (x−1.5, y−0.5), out at (x+1.5, y)) |
| `GND` | `at: [x, y]`, `dir` | ground symbol |
| `W` | `at: [x0, y0, x1, y1, …]` | wire polyline |
| `label` | `at`, `text` (plain or `$TeX$`), `node`, `dx`, `dy`, `show` | node marker with live voltage |

Sign conventions: a part's current flows from `a` to `b` through the part; power `p = (v_a − v_b)·i` is absorbed
(a source delivering power has `p < 0`).

| member | |
|---|---|
| `C.dc({t})` → result | operating point: `res.V(node)`, `res.I(id)`, `res.P(id)`, `res.v`, `res.i` |
| `C.ac(f)` → result | phasors `[re, im]`; `res.mag(n)`, `res.phase(n)`, `res.imag(id)`, `res.iphase(id)`, average power `res.P(id)`. Driven by sources with `ac`; if none has one, every `V` drives with amplitude `value`. |
| `C.sweep(f0, f1, n, pick)` | `[{f, res, y: pick(res)}]`, log-spaced (`{log: false}` for linear) |
| `C.transient(tEnd, dt, {method: 'trap' \| 'be', uic})` | `{t, v: {node: []}, i: {id: []}, at(time) → result, series(node), imax, vmax}`; starts from the parts' `ic` (default 0; `uic: false` = DC operating point); LU factors are reused while the topology is unchanged |
| `C.draw({result, t, dots, colors, labels, vmax, imax, acRate})` | draws the schematic: wires coloured by node voltage (blue − … grey 0 … red +), gold dots moving with speed ∝ current (conventional direction; transient: relative to the run's peak current; AC: sloshing with amplitude and phase); returns the result used |
| `C.control(id, label, min, max, o)` | a slider bound to a part's value (SI-formatted, log for R/C/L) |
| `C.set(id, value)`, `C.part(id)`, `C.net` | edit values; the `Netlist` (`termNode`, `nodes`, `ground`, `segs`) |
| `onEdit(part)` option | click on a part calls it (for custom editors) |

```js
viz(v) {   // RC charging, animated
  const s = v.stage({ x: [-1.6, 6.9], y: [-1, 3.95], equal: true, height: 290, axes: false });
  const C = v.circuit(s, [
    { type: 'V', id: 'V0', value: 5, at: [0, 3, 0, 0] }, { type: 'SW', id: 'S', closedAt: 0, at: [0, 3, 2, 3] },
    { type: 'R', id: 'R', value: 1e3, at: [2, 3, 5, 3] }, { type: 'C', id: 'C', value: 100e-6, at: [5, 3, 5, 0] },
    { type: 'W', at: [5, 0, 0, 0] }, { type: 'GND', at: [2.5, 0] }, { type: 'label', at: [5, 3], text: '$v_C$' },
  ]);
  C.control('R', '$R$', 100, 10e3);
  let tr, key;
  v.animate((t) => {
    const tau = C.part('R').value * C.part('C').value;
    if (key !== tau) { key = tau; tr = C.transient(5 * tau, tau / 200); }
    C.draw({ result: tr.at((t % 6) / 6 * 5 * tau), t });
  });
  v.readout(() => `$v_C(\\tau) / V_0 = ${v.fix(tr.at(key).V(C.net.termNode.get('C').a) / 5, 4)}$`);
}
```

## Verified numerics (tests/kits-science.test.mjs)

Flux through circles, rectangles, clockwise and non-convex polygons = q_enc/ε₀ to 1e-8; vortex circulation = Γ;
E = −∇φ; marching squares on a circle; Newton/classification on Lotka–Volterra, the damped pendulum and a competition
model; H conserved to 1e-7 (RK4 and RK45); Van der Pol period 6.663; Bell/GHZ probabilities, sampling within 4σ,
gate identities, unitarity of random 6-qubit circuits; hydrogen R_nl normalised with n−l−1 nodes and Hψ = Eψ by finite
differences, Y_lm orthonormal; library bond lengths/angles; Aufbau + Hund (O₂); divider + Tellegen, geometric nets,
RC/RL/RLC transients vs closed forms (trap 5e-4, BE 2e-2), RC low-pass −3 dB/−45°, RLC resonance at 1/(2π√LC) with
|I| = V/R, Shockley diode, ideal diode, inverting amplifier, rails, follower, rectifier ripple.
