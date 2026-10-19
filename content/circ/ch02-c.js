// Circuits — Chapter 2: Kirchhoff’s laws and resistive networks (part c: 2.12–2.15)
//
// From memory (not checked against a source in this session): the lattice resistances R(1,0) = 1/2, R(1,1) = 2/π, R(2,0) = 2 − 4/π
// (the numerics in 2.15 reproduce them to the displayed precision), the attribution of the matrix-tree theorem to Kirchhoff (1847)
// and of the monotonicity law to Rayleigh (Theory of Sound, 1877–78).
import { clamp, laplacian, reduce, solveNet, gauss, det, components, forests, reff, NETS } from './ch02.shared.js';

function geom(net) {
  const xs = net.pos.map((p) => p[0]), ys = net.pos.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), k = 1 / Math.max(x1 - x0, y1 - y0, 1e-9);
  return net.pos.map((p) => [(p[0] - (x0 + x1) / 2) * k, (p[1] - (y0 + y1) / 2) * k]);
}
const segDist = (px, py, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1, t = clamp(((px - a[0]) * dx + (py - a[1]) * dy) / L, 0, 1); return Math.hypot(px - a[0] - t * dx, py - a[1] - t * dy); };

/** Resistance between A = (0,0) and B = off on a (2h+1)×(2h+1) grid of 1 Ω resistors: 'free' (insulating edge) or 'short' (all boundary nodes tied to one node). */
function gridSolve(h, off, mode) {
  const W = 2 * h + 1, N = W * W, id = (i, j) => (i + h) * W + (j + h);
  const bnd = new Uint8Array(N); if (mode === 'short') for (let i = -h; i <= h; i++) for (let j = -h; j <= h; j++) if (Math.abs(i) === h || Math.abs(j) === h) bnd[id(i, j)] = 1;
  const b = new Float64Array(N); b[id(0, 0)] += 1; b[id(off[0], off[1])] -= 1;
  const apply = (x, out) => {
    for (let i = -h; i <= h; i++) for (let j = -h; j <= h; j++) {
      const n = id(i, j); if (bnd[n]) { out[n] = 0; continue; }
      let s = 0;
      if (i > -h) s += x[n] - x[id(i - 1, j)]; if (i < h) s += x[n] - x[id(i + 1, j)];
      if (j > -h) s += x[n] - x[id(i, j - 1)]; if (j < h) s += x[n] - x[id(i, j + 1)];
      out[n] = s;
    }
  };
  const x = new Float64Array(N), r = Float64Array.from(b), p = Float64Array.from(b), q = new Float64Array(N);
  let rr = 0; for (let n = 0; n < N; n++) rr += r[n] * r[n];
  const r0 = rr;
  for (let it = 0; it < 6000 && rr > 1e-24 * r0; it++) {
    apply(p, q); let pq = 0; for (let n = 0; n < N; n++) pq += p[n] * q[n]; if (!pq) break;
    const a = rr / pq; let rn = 0;
    for (let n = 0; n < N; n++) { x[n] += a * p[n]; r[n] -= a * q[n]; rn += r[n] * r[n]; }
    const be = rn / rr; rr = rn; for (let n = 0; n < N; n++) p[n] = r[n] + be * p[n];
  }
  return { R: x[id(0, 0)] - x[id(off[0], off[1])], phi: x, W, h, id };
}

export default {
  collection: 'circ',
  chapter: 2,
  items: [
    // ───────────────────────────────────────────────────────────────────────────────────── 2.12
    {
      num: '2.12',
      kind: 'Theorem',
      name: 'Kirchhoff’s matrix-tree theorem and effective resistance',
      statement: String.raw`Let a connected network have unit conductances on its branches (or conductances $g_e$ with trees weighted by $\prod_{e\in T} g_e$). The number of spanning trees is $\tau = \det\mathbf G$, the determinant of the Laplacian (2.8) with any one row and column deleted. The effective resistance between nodes $a$ and $b$, i.e. the voltage needed to push one ampere from $a$ to $b$, is $R_{ab} = \dfrac{\tau_{ab}}{\tau}$, where $\tau_{ab}$ is the number of spanning forests with two trees that separate $a$ from $b$ (equivalently the number of spanning trees of the network with $a$ and $b$ merged).`,
      idea: String.raw`By Cramer's rule the node voltage $v_a$ with 1 A pushed in at $a$ and out at $b$ (grounded) is a ratio of two minors of $\mathbf G$, and the all-minors matrix-tree theorem identifies the minor with deleted rows $\{b\}$ and columns $\{b\}$ merged at $a$ with a count of 2-forests. The classic proof expands $\det$ by the Cauchy–Binet formula as $\det(\mathbf A_0\mathbf A_0^{\!\top}) = \sum_S \det(\mathbf A_S)^2$ over sets $S$ of $n-1$ branches, where $\det\mathbf A_S\in\{0,\pm1\}$ is non-zero exactly when $S$ is a spanning tree (the incidence matrix of a tree is unimodular, while a set containing a cycle is dependent).`,
      caption: String.raw`Pick a network and a pair of terminals (click a node for $a$, shift-click for $b$). All spanning trees are listed as thumbnails (green branches), or switch to the two-tree forests that separate $a$ (blue) from $b$ (orange). The count $\tau$ equals the determinant of the reduced Laplacian, and $R_{ab} = \tau_{ab}/\tau$ matches what the circuit solver computes with unit resistors.`,
      credit: 'Gustav Kirchhoff, 1847',
      scope: String.raw`Finite connected networks of positive conductances; with unit resistors the quantities are integers.`,
      deps: ['circ-2.8', 'circ-2.7', 'ladr-9.43'],
      refs: ['Agarwal–Lang §3.3'],
      tags: ['spanning tree', 'effective resistance'],
      viz(v) {
        const s = v.stage({ x: [-0.7, 0.7], y: [-0.62, 0.62], equal: true, axes: false, height: 330, weight: 0.8, minWidth: 260, title: 'unit resistors; click = $a$, shift-click = $b$' });
        const st = v.stage({ x: [0, 10], y: [0, 6], equal: true, axes: false, height: 330, weight: 1.5, minWidth: 360, title: 'thumbnails' });
        const sel = v.select('network', ['bridge', 'k4', 'k23', 'ladder'].map((k) => ({ value: k, label: NETS[k].label })), 'k4');
        const mode = v.select('show', [{ value: 'trees', label: 'spanning trees' }, { value: 'forests', label: '2-forests separating $a$ and $b$' }], 'trees');
        let a = 0, b = 2, lastNet = null;
        s.onClick((x, y, mod) => {
          const P = geom(NETS[sel.value]); let nd = -1, nb = 0.07; P.forEach((p, i) => { const d = Math.hypot(x - p[0], y - p[1]); if (d < nb) { nb = d; nd = i; } });
          if (nd < 0) return; if (mod && mod.shift) { if (nd !== a) b = nd; } else if (nd !== b) a = nd;
        });
        let info = null;
        v.render(() => {
          const net = NETS[sel.value], n = net.names.length, P = geom(net);
          if (lastNet !== sel.value) { lastNet = sel.value; a = 0; b = n - 1; if (sel.value === 'k4') b = 2; }
          const E = net.edges.map(([x, y]) => ({ a: x, b: y, g: 1 }));
          const trees = forests(n, E, n - 1), fs = forests(n, E, n - 2).filter((f) => f.lab[a] !== f.lab[b]);
          const tau = trees.length, tab = fs.length, detv = Math.round(det(reduce(laplacian(n, E), 0)));
          const rs = reff(n, E, a, b);
          net.edges.forEach(([x, y]) => s.line(P[x][0], P[x][1], P[y][0], P[y][1], { color: 'ink', width: 2.5 }));
          P.forEach((p, i) => s.dot(p[0], p[1], { r: 11, color: i === a ? 'accent' : i === b ? 'orange' : 'muted', label: net.names[i], labelPos: 'ne' }));
          // thumbnails
          const list = mode.value === 'trees' ? trees : fs, m = Math.max(1, list.length);
          const cols = Math.ceil(Math.sqrt(m * 1.7)), rows = Math.ceil(m / cols), cw = Math.min(10 / cols, 6 / rows * 1.0), chh = cw;
          st.setView([0, 10], [0, 6]);
          const ox = (10 - cols * cw) / 2, oy = (6 + rows * chh) / 2;
          list.forEach((f, k) => {
            const cx = ox + (k % cols + 0.5) * cw, cy = oy - (Math.floor(k / cols) + 0.5) * chh, sc = cw * 0.78;
            const set = new Set(f.idx);
            net.edges.forEach(([x, y], e) => { st.line(cx + P[x][0] * sc, cy + P[x][1] * sc, cx + P[y][0] * sc, cy + P[y][1] * sc, { color: set.has(e) ? 'green' : 'faint', width: set.has(e) ? 2.6 : 0.8, alpha: set.has(e) ? 1 : 0.5 }); });
            P.forEach((p, i) => st.dot(cx + p[0] * sc, cy + p[1] * sc, { r: 3, color: mode.value === 'forests' ? (f.lab[i] === f.lab[a] ? 'accent' : f.lab[i] === f.lab[b] ? 'orange' : 'muted') : 'ink' }));
          });
          info = { tau, tab, detv, rs, n, b: E.length, a, bb: b, names: net.names };
        });
        v.readout(() => {
          if (!info) return '';
          const { tau, tab, detv, rs, names, a: aa, bb } = info;
          return `$\\tau = ${tau}$ spanning trees $=\\det\\mathbf G = ${detv}$. Terminals ${names[aa]}, ${names[bb]}: $\\tau_{ab} = ${tab}$ two-tree forests, so $R_{ab} = \\tau_{ab}/\\tau = ${tab}/${tau} = ${v.fix(tab / tau, 5)}\\ \\Omega$; circuit solver: $${v.fix(rs, 5)}\\ \\Omega$.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 2.13
    {
      num: '2.13',
      kind: 'Theorem',
      name: 'Rayleigh’s monotonicity law',
      statement: String.raw`In a network of positive resistances, the effective resistance $R_{ab}$ between any two nodes is a nondecreasing function of every individual resistance: increasing one or several resistances (never decreasing any) can only increase $R_{ab}$ or leave it unchanged, and decreasing them can only decrease it. Two special cases: replacing a resistor by a short circuit ($R\to0$) gives a lower bound, and removing it ($R\to\infty$) gives an upper bound. As a function of one resistance $r$, $R_{ab}(r) = (\alpha r+\beta)/(\gamma r+\delta)$ is a Möbius function that is increasing and concave on $r>0$.`,
      idea: String.raw`Thomson's principle says that the actual current distribution minimises the dissipated power $\sum_e r_e i_e^2$ among all flows of unit current from $a$ to $b$, and that minimum is $R_{ab}$. For a fixed flow, raising any $r_e$ can only raise the power; so the minimum over flows can only go up. The shorted network has the same flows available plus more, hence a lower minimum, and the cut network a smaller set of flows, hence a higher one. (The same statement follows from the matrix-tree formula 2.12, where $R_{ab}$ is a ratio of polynomials linear in each conductance.)`,
      caption: String.raw`Click two nodes of the 3×3 grid (click $a$, shift-click $b$), click a branch to select it, and slide its resistance: the curve $R_{ab}$ against $r$ rises monotonically between the "shorted" (dashed green) and "cut" (dashed red) limits. The button "test" raises many resistors at random thousands of times and counts how often $R_{ab}$ went down (never). Turn on "allow negative resistance" (an active element) and the curve develops a pole and is no longer monotone: the law is a statement about passive networks.`,
      credit: 'Lord Rayleigh, 1870s',
      scope: String.raw`Passive networks, i.e. positive resistances. With a negative resistance the effective resistance can fall when a resistance rises.`,
      deps: ['circ-2.12', 'opt-3.6'],
      refs: ['Agarwal–Lang §3.3'],
      tags: ['monotonicity', 'effective resistance'],
      viz(v) {
        const net = NETS.grid3, P = geom(net), n = net.names.length;
        const s = v.stage({ x: [-0.78, 0.78], y: [-0.68, 0.68], equal: true, axes: false, height: 360, weight: 0.9, title: 'click: $a$ · shift-click: $b$ · click a branch: select' });
        const sp = v.stage({ x: [0, 10], y: [0, 4], axes: 'box', gutter: true, height: 360, weight: 1.1, xlabel: 'resistance $r$ of the selected branch (Ω)', ylabel: '$R_{ab}$ (Ω)' });
        const base = net.edges.map(() => 1);
        let a = 0, b = 8, selE = 4, viol = null;
        const rs = v.slider('selected branch $r$', 0.1, 10, 1, { log: true, sig: 2, fmt: (x) => `${v.fix(x, 2)} Ω`, onChange: (x) => { base[selE] = x; } });
        const neg = v.toggle('allow negative resistance (active element)', false);
        const rneg = v.slider('negative $r$', -3, -0.1, -0.5, { step: 0.05, fmt: (x) => `${v.fix(x, 2)} Ω` });
        v.button('randomise the other resistors', () => { const r = v.rng(Math.floor(Math.random() * 1e6)); for (let k = 0; k < base.length; k++) if (k !== selE) base[k] = +(0.3 + 2.7 * r()).toFixed(2); });
        v.button('test: 3000 random increases', () => {
          const r = v.rng(2024); let bad = 0, worst = 0;
          for (let t = 0; t < 3000; t++) {
            const g0 = base.map((x, k) => ({ a: net.edges[k][0], b: net.edges[k][1], g: 1 / x }));
            const up = base.map((x) => (r() < 0.5 ? x * (1 + 3 * r()) : x));
            const g1 = up.map((x, k) => ({ a: net.edges[k][0], b: net.edges[k][1], g: 1 / x }));
            const d = reff(n, g1, a, b) - reff(n, g0, a, b); if (d < -1e-12) { bad++; worst = Math.min(worst, d); }
          }
          viol = { bad, worst };
        });
        s.onClick((x, y, mod) => {
          let nd = -1, nb = 0.06; P.forEach((p, i) => { const d = Math.hypot(x - p[0], y - p[1]); if (d < nb) { nb = d; nd = i; } });
          if (nd >= 0) { if (mod && mod.shift) { if (nd !== a) b = nd; } else if (nd !== b) a = nd; return; }
          let best = -1, bd = 0.06; net.edges.forEach(([p, q], k) => { const d = segDist(x, y, P[p], P[q]); if (d < bd) { bd = d; best = k; } });
          if (best >= 0) { selE = best; rs.set(clamp(base[best], 0.1, 10)); }
        });
        const edgesWith = (rv) => net.edges.map(([p, q], k) => ({ a: p, b: q, g: 1 / (k === selE ? rv : base[k]) }));
        let info = null;
        v.render(() => {
          rneg.el.hidden = !neg.value;
          const cur = neg.value ? rneg.value : base[selE];
          const f = (r) => { const E = edgesWith(r), x = reffSafe(E); return x; };
          function reffSafe(E) { const inj = new Array(n).fill(0); inj[a] = 1; inj[b] = -1; const phi = solveNet(n, E, inj, b); if (!phi) return NaN; const r = phi[a] - phi[b]; return Math.abs(r) > 50 ? NaN : r; }
          const lo = neg.value ? -3 : 0.02, hi = 10;
          const Rshort = f(1e-6), Rcut = (() => { const E = edgesWith(1).map((e, k) => (k === selE ? { ...e, g: 0 } : e)); return reffSafe(E); })();
          const top = Math.min(6, Math.max(1.5, ...[0.1, 0.5, 1, 2, 5, 10].map((r) => f(r)).filter(isFinite)) * 1.2);
          sp.setView([lo, hi], [neg.value ? -top : 0, top]);
          const pts = []; const N = 260; let prev = null, mono = true;
          for (let k = 0; k <= N; k++) { const r = lo + (hi - lo) * k / N; if (Math.abs(r) < 0.02) { pts.push(null); prev = null; continue; } const y = f(r); pts.push(isFinite(y) ? [r, y] : null); if (isFinite(y) && prev != null && y < prev - 1e-9) mono = false; prev = isFinite(y) ? y : null; }
          sp.path(pts, { color: 'accent', width: 3 });
          if (isFinite(Rshort)) sp.hline(Rshort, { color: 'green', dash: true, width: 1.5 });
          if (isFinite(Rcut)) sp.hline(Rcut, { color: 'red', dash: true, width: 1.5 });
          sp.vline(0, { color: 'muted', width: 1 });
          const y0 = f(cur); if (isFinite(y0)) sp.dot(cur, y0, { r: 7, color: 'gold' });
          // network
          const gmax = Math.max(...base);
          net.edges.forEach(([p, q], k) => {
            const r = k === selE ? cur : base[k], sel = k === selE;
            if (sel) s.line(P[p][0], P[p][1], P[q][0], P[q][1], { color: 'gold', width: 11, alpha: 0.4 });
            s.line(P[p][0], P[p][1], P[q][0], P[q][1], { color: r < 0 ? 'red' : 'ink', width: clamp(5 / Math.sqrt(Math.max(Math.abs(r), 0.15)), 1, 7) * 0.7 });
            s.text(v.fix(r, 1), (P[p][0] + P[q][0]) / 2, (P[p][1] + P[q][1]) / 2, { size: 11, color: r < 0 ? 'red' : 'ink', plate: true });
          });
          void gmax;
          P.forEach((p, i) => s.dot(p[0], p[1], { r: 11, color: i === a ? 'accent' : i === b ? 'orange' : 'muted', label: i === a ? 'a' : i === b ? 'b' : '', labelPos: 'ne' }));
          info = { y0, mono, Rshort, Rcut, cur, neg: neg.value };
        });
        v.legend([['accent', '$R_{ab}$ as the selected resistance varies'], ['green', 'branch shorted', { dash: true }], ['red', 'branch removed', { dash: true }]]);
        v.readout(() => {
          if (!info) return '';
          const { y0, mono, Rshort, Rcut, cur } = info;
          const t = viol ? ` Test: ${viol.bad} decreases in 3000 random increases (smallest change $${v.sci(Math.abs(viol.worst) + 1e-18, 1)}$).` : '';
          return `$R_{ab} = ${isFinite(y0) ? v.fix(y0, 4) : '\\text{pole}'}\\ \\Omega$ at $r = ${v.fix(cur, 2)}\\ \\Omega$; bounds: shorted $${v.fix(Rshort, 4)}$ $\\le R_{ab} \\le$ cut $${v.fix(Rcut, 4)}\\ \\Omega$. ${mono ? 'The curve is monotone increasing.' : 'The curve is NOT monotone: with a negative resistance the law fails.'}${t}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 2.14
    {
      num: '2.14',
      kind: 'Theorem',
      name: 'Voltages as random-walk hitting probabilities',
      statement: String.raw`Hold node $A$ of a resistor network at $1$ V and node $B$ at $0$ V, with all other nodes free. A random walker that, at each step, moves from its node to a neighbouring node chosen with probability proportional to the conductance of the connecting branch, $p_{jk} = g_{jk}/\sum_m g_{jm}$, and stops on reaching $A$ or $B$, hits $A$ before $B$ with a probability $h(j)$ that equals the voltage of node $j$: $v_j = h(j)$. Consequently the voltage at an interior node is a weighted average of the voltages of its neighbours (a discrete harmonic function), and $0\le v_j\le1$ everywhere.`,
      idea: String.raw`KCL (2.1) with Ohm's law at a free node $j$ reads $\sum_k g_{jk}(v_k - v_j) = 0$, i.e. $v_j = \sum_k p_{jk}v_k$: the voltage is the average of its neighbours' voltages, weighted by the walker's jump probabilities. The hitting probability $h$ obeys the same equation after conditioning on the first step, with the boundary values $h(A) = 1$, $h(B) = 0$. The equation has a unique solution (2.9, 2.8), so $v = h$.`,
      caption: String.raw`A random $3\times3$ network with $A$ at 1 V and $B$ at 0 V; node colours are the exact voltages. The gold token replays random walks from the chosen node, leaving a gold trail; each walk ends on the red-ringed node $A$ (1 V) or the blue-ringed node $B$ (0 V). Right: for every node, the fraction of walkers that reached $A$ (dots, with $\pm2\sigma$ error bars) against the exact voltage (bars) from solving the network; below, the running fraction for the chosen start converging to its voltage as more walks accumulate.`,
      scope: String.raw`Finite connected network with positive conductances and two fixed-potential nodes; the walk is reversible with respect to the conductances.`,
      deps: ['circ-2.5', 'circ-2.8', 'em-6.15', 'stoch-2.2'],
      refs: ['Agarwal–Lang §3.3'],
      credit: 'Kakutani 1944 (continuum case); Doyle & Snell, 1984 (networks)',
      tags: ['random walk', 'harmonic'],
      viz(v) {
        const net = NETS.grid3, P = geom(net), n = net.names.length, E0 = net.edges;
        const s = v.stage({ x: [-0.78, 0.78], y: [-0.66, 0.66], equal: true, axes: false, height: 360, weight: 1, title: 'the network; click = start node' });
        const sb = v.stage({ x: [0, n + 1], y: [0, 1.15], axes: 'box', gutter: true, height: 360, weight: 1, xlabel: 'start node', ylabel: 'voltage = fraction reaching $A$', xticks: net.names.map((nm, i) => [i + 1, nm]) });
        const sc = v.stage({ x: [1, 5000], y: [0, 1], xlog: true, axes: 'box', gutter: true, height: 260, weight: 1, full: true, xlabel: 'number of walks from the start node', ylabel: 'fraction reaching $A$' });
        const Aid = 0, Bid = 8;
        let seed = 5, start = 4;
        const g = E0.map((_, k) => 1);
        const resample = () => { const r = v.rng(seed); for (let k = 0; k < g.length; k++) g[k] = +(0.4 + 2.6 * r()).toFixed(1); };
        resample();
        v.button('new random conductances', () => { seed++; resample(); cache = null; });
        const NW = 5000;
        let cache = null;
        const build = () => {
          const E = E0.map(([a, b], k) => ({ a, b, g: g[k] })), adj = Array.from({ length: n }, () => []);
          E.forEach((e) => { adj[e.a].push([e.b, e.g]); adj[e.b].push([e.a, e.g]); });
          const unk = [...Array(n).keys()].filter((i) => i !== Aid && i !== Bid), L = laplacian(n, E);
          const M = unk.map((i) => unk.map((j) => L[i][j])), rhs = unk.map((i) => -L[i][Aid] * 1);
          const x = gauss(M, rhs), volt = new Array(n).fill(0); volt[Aid] = 1; unk.forEach((i, k) => { volt[i] = x[k]; });
          const r = v.rng(900 + seed), walks = [];
          for (let i = 0; i < n; i++) {
            const res = []; const paths = [];
            for (let w = 0; w < NW; w++) {
              let u = i, path = [u];
              while (u !== Aid && u !== Bid && path.length < 400) { const tot = adj[u].reduce((a, q) => a + q[1], 0); let t = r() * tot; for (const [nb, gg] of adj[u]) { t -= gg; if (t <= 0) { u = nb; break; } } path.push(u); }
              res.push(u === Aid ? 1 : 0); if (w < 14 && i === i) paths.push(path);
            }
            walks.push({ res, paths });
          }
          cache = { volt, walks, E };
        };
        const sl = v.slider('start node (1 = A … 9 = I)', 1, n, 5, { int: true, onChange: (x) => { start = x - 1; } });
        s.onClick((x, y) => { let nd = -1, nb = 0.07; P.forEach((p, i) => { const d = Math.hypot(x - p[0], y - p[1]); if (d < nb) { nb = d; nd = i; } }); if (nd >= 0) { start = nd; sl.set(nd + 1); } });
        const STEP = 0.32, GAP = 0.9;
        const durOf = (paths) => paths.map((p) => (p.length - 1) * STEP + GAP);
        let readInfo = null;
        v.animate((t) => {
          if (!cache) build();
          const { volt, walks, E } = cache, W = walks[start], durs = durOf(W.paths), total = durs.reduce((a, b) => a + b, 0);
          const tt = t % total; let k = 0, acc = 0; while (k < durs.length - 1 && acc + durs[k] <= tt) { acc += durs[k]; k++; }
          const path = W.paths[k], loc = tt - acc, si = Math.min(path.length - 1, Math.floor(loc / STEP)), fr = Math.min(1, (loc - si * STEP) / STEP);
          const gmax = Math.max(...g);
          E.forEach((e, q) => s.line(P[e.a][0], P[e.a][1], P[e.b][0], P[e.b][1], { color: 'muted', width: 1 + 4 * e.g / gmax }));
          for (let q = 0; q < si; q++) s.line(P[path[q]][0], P[path[q]][1], P[path[q + 1]][0], P[path[q + 1]][1], { color: 'gold', width: 3.5, alpha: 0.9 });
          s.dot(P[Aid][0], P[Aid][1], { r: 21, color: 'red', hollow: true }); s.dot(P[Bid][0], P[Bid][1], { r: 21, color: 'accent', hollow: true });
          P.forEach((p, i) => { s.dot(p[0], p[1], { r: 16, color: v.ramp(volt[i], 'red'), label: net.names[i], labelPos: 'nw' }); s.text(v.fix(volt[i], 2), p[0], p[1], { size: 10.5, color: 'ink' }); });
          const a0 = path[si], a1 = path[Math.min(path.length - 1, si + 1)];
          const gx = P[a0][0] + (P[a1][0] - P[a0][0]) * fr, gy = P[a0][1] + (P[a1][1] - P[a0][1]) * fr;
          s.dot(gx, gy, { r: 8, color: 'gold' });
          // bars: exact vs estimate, using the first nW walks
          const nW = 5000;
          for (let i = 0; i < n; i++) {
            sb.rect(i + 0.65, 0, i + 1.35, volt[i], { fill: 'accent', fillAlpha: 0.3, color: 'accent', width: 1.5 });
            const hits = walks[i].res.reduce((a, b) => a + b, 0), ph = hits / nW, se = 2 * Math.sqrt(Math.max(ph * (1 - ph), 1e-6) / nW);
            sb.line(i + 1, Math.max(0, ph - se), i + 1, Math.min(1.1, ph + se), { color: 'ink', width: 1.5 });
            sb.dot(i + 1, ph, { r: 5, color: i === start ? 'gold' : 'ink' });
          }
          // convergence
          const res = W.res; let c = 0; const pts = []; const marks = new Set(); for (let w = 1; w <= NW; w++) { c += res[w - 1]; if (w <= 20 || w % 25 === 0) { pts.push([w, c / w]); marks.add(w); } }
          const band = []; for (let w = 1; w <= NW; w += Math.max(1, Math.floor(w / 40))) band.push(w);
          sc.hline(volt[start], { color: 'accent', width: 2, dash: true });
          sc.between((w) => volt[start] - 2 * Math.sqrt(volt[start] * (1 - volt[start]) / w), (w) => volt[start] + 2 * Math.sqrt(volt[start] * (1 - volt[start]) / w), 1, NW, { fill: 'accent', fillAlpha: 0.12 });
          sc.path(pts, { color: 'ink', width: 1.8 });
          readInfo = { volt, ph: res.reduce((a, b) => a + b, 0) / NW, start, names: net.names, hit: path[path.length - 1] === Aid, k, done: si >= path.length - 1 };
        }, { period: 10, still: 2 });
        v.readout(() => {
          if (!readInfo) return '';
          const { volt, ph, start: st, names } = readInfo;
          return `Start ${names[st]}: exact voltage (network solved by $\\mathbf G\\mathbf v=\\mathbf i$) $v = ${v.fix(volt[st], 4)}$ V; fraction of ${NW} walkers that reached $A$ before $B$: $${v.fix(ph, 4)}$ (expected scatter $\\pm${v.fix(2 * Math.sqrt(volt[st] * (1 - volt[st]) / NW), 3)}$). $A$ is held at 1 V (red ring), $B$ at 0 V (blue ring).`;
        });
        void segDist; void components;
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 2.15
    {
      num: '2.15',
      kind: 'Proposition',
      name: 'Infinite resistor lattice: R/2 between neighbours',
      statement: String.raw`In an infinite square lattice of equal resistors $R$, the effective resistance between two adjacent nodes is exactly $R/2$. Other pairs are not so simple: between diagonal neighbours it is $2R/\pi \approx 0.637R$, and between nodes two steps apart along a line $(2-4/\pi)R\approx 0.727R$, with $R_{(m,n)}\sim \frac{R}{\pi}\ln\sqrt{m^2+n^2}$ growing only logarithmically for distant nodes.`,
      idea: String.raw`Push 1 A into one node $P$ and let it spread to infinity: by the four-fold symmetry each of the 4 branches at $P$ carries $1/4$ A. Now remove 1 A from the adjacent node $Q$ the same way: by symmetry again, $1/4$ A flows into $Q$ along each of its branches. By superposition (linearity, Chapter 3) the current in the branch $PQ$ is $\tfrac14+\tfrac14=\tfrac12$ A, and its voltage is $\tfrac12R\cdot1$ A. The voltage between $P$ and $Q$ is the same as the voltage across that one branch, so $R_{PQ} = R/2$. The other values need the lattice Green's function.`,
      caption: String.raw`Solve finite $(2h+1)\times(2h+1)$ grids of 1 Ω resistors with 1 A in at the centre and out at a neighbour (choose adjacent, diagonal or two apart). Two finite approximations bracket the infinite lattice: leave the boundary open (insulating edges, red; Rayleigh's law 2.13 says this over-estimates) or tie the whole boundary together by a perfect conductor (green; this under-estimates). The map shows the potential for the chosen size. Both curves squeeze onto the dashed limit as the grid grows.`,
      scope: String.raw`Infinite, perfectly regular lattice of identical resistors; the finite solutions illustrate convergence.`,
      deps: ['circ-2.1', 'circ-1.4', 'circ-2.13'],
      refs: ['Agarwal–Lang ch. 2'],
      tags: ['lattice', 'symmetry'],
      viz(v) {
        const s = v.stage({ x: [-8, 8], y: [-8, 8], equal: true, axes: false, height: 360, weight: 0.9, title: 'potential of the finite grid' });
        const sp = v.stage({ x: [1.5, 40], y: [0.3, 1], xlog: true, axes: 'box', gutter: true, height: 360, weight: 1.1, xlabel: 'half-width $h$ of the grid', ylabel: 'resistance between the pair (Ω)' });
        const pair = v.select('pair', [{ value: 'adj', label: 'adjacent (1,0)' }, { value: 'dia', label: 'diagonal (1,1)' }, { value: 'two', label: 'two apart (2,0)' }], 'adj');
        const HS = [3, 4, 5, 6, 8, 10, 13, 17, 22, 30, 40];
        const hsl = v.slider('half-width $h$ for the map', 3, 40, 10, { int: true });
        const OFF = { adj: [1, 0], dia: [1, 1], two: [2, 0] }, LIM = { adj: 0.5, dia: 2 / Math.PI, two: 2 - 4 / Math.PI };
        const cache = new Map();
        const get = (h, mode, key) => { const k = `${h}|${mode}|${key}`; if (!cache.has(k)) cache.set(k, gridSolve(h, OFF[key], mode)); return cache.get(k); };
        let info = null;
        v.render(() => {
          const key = pair.value, lim = LIM[key], off = OFF[key];
          const curve = (mode) => HS.map((h) => [h, get(h, mode, key).R]);
          const cf = curve('free'), cs = curve('short');
          const lo = Math.min(...cs.map((p) => p[1])) * 0.97, hi = Math.max(...cf.map((p) => p[1])) * 1.03;
          sp.setView([2.2, 44], [Math.min(lo, lim * 0.95), Math.max(hi, lim * 1.05)]);
          sp.hline(lim, { color: 'ink', width: 1.8, dash: true });
          sp.path(cf, { color: 'red', width: 2.5 }); sp.path(cs, { color: 'green', width: 2.5 });
          sp.dots(cf, { r: 3.5, color: 'red' }); sp.dots(cs, { r: 3.5, color: 'green' });
          const h = hsl.value, S = get(h, 'free', key), W = S.W;
          let mean = 0; for (let q = 0; q < S.phi.length; q++) mean += S.phi[q]; mean /= S.phi.length;
          const phiA = S.phi[S.id(0, 0)] - mean, cmax = Math.max(1e-9, S.R * 0.9);
          s.setView([-h - 0.5, h + 0.5], [-h - 0.5, h + 0.5]);
          s.raster((x, y) => { const i = Math.round(x), j = Math.round(y); if (Math.abs(i) > h || Math.abs(j) > h) return null; const f = (S.phi[S.id(i, j)] - mean) / cmax; const c = v.diverge(clamp(f, -1, 1), 'blue', 'red'); return [...c, 1]; }, { res: 2, key: `${h}|${key}` });
          const m = h >= 10 ? 0 : 1;
          if (h <= 9) for (let i = -h; i <= h; i++) for (let j = -h; j <= h; j++) s.dot(i, j, { r: 1.8, color: 'ink', alpha: 0.35 });
          s.dot(0, 0, { r: 7, color: 'gold' }); s.dot(off[0], off[1], { r: 7, color: 'gold', hollow: true }); void m; void W;
          const Rf = S.R, Rs = get(h, 'short', key).R;
          info = { Rf, Rs, lim, key, h, Rbig: get(40, 'free', key).R, Rbigs: get(40, 'short', key).R };
        });
        v.legend([['red', 'open boundary (upper bound)'], ['green', 'boundary shorted (lower bound)'], ['ink', 'infinite lattice', { dash: true }]]);
        v.readout(() => {
          if (!info) return '';
          const { Rf, Rs, lim, key, h, Rbig, Rbigs } = info, name = { adj: '1/2', dia: '2/\\pi', two: '2-4/\\pi' }[key];
          return `$h = ${h}$ (${(2 * h + 1) ** 2} nodes): ${v.fix(Rs, 5)} $\\le R \\le$ ${v.fix(Rf, 5)} Ω. At $h = 40$: ${v.fix(Rbigs, 5)} … ${v.fix(Rbig, 5)} Ω; infinite lattice: $${name} = ${v.fix(lim, 5)}$ Ω.`;
        });
      },
    },
  ],
};
