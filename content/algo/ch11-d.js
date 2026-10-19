// Algorithms — Chapter 11: Network flow, matching and linear programming (items 11.21–11.25; 11.1–11.6 in ch11.js, 11.7–11.13 in ch11-b.js, 11.14–11.19 in ch11-c.js)
import { K, ids, plural, clamp, rngOf, sumOf, NETS, num, flowValue, cutCap, minCutBrute, resArcs, reachSet, findPath, pushPath, fordFulkerson, arcsOf, zeros, netStage, mkNet, loadNet, netIds, drawFlow, simplex, vertices, detOf, combos, clipHalf, R, TX } from './ch11.shared.js';

const NET_SELECT = [{ value: 'A', label: 'network A' }, { value: 'B', label: 'B' }, { value: 'C', label: 'C' }];
const EDITW = { editWeight: true, minWeight: 1, maxWeight: 20, addNode: false, addEdge: false, deleteNode: false, deleteEdge: false, moveNode: true };

/** The max-flow LP and its dual (potentials d, edge variables y) solved by the simplex method. */
function flowLPs(ids, arcs, s, t) {
  const m = arcs.length, mid = ids.filter((x) => x !== s && x !== t), n = mid.length;
  const obj = arcs.map(([u, v]) => (u === s ? 1 : 0) - (v === s ? 1 : 0));
  const rows = arcs.map((_, i) => ({ a: arcs.map((__, j) => (i === j ? 1 : 0)), op: '<=', b: arcs[i][2] }));
  for (const x of mid) rows.push({ a: arcs.map(([u, v]) => (v === x ? 1 : 0) - (u === x ? 1 : 0)), op: '=', b: 0 });
  const P = simplex(obj, rows);
  // dual: min sum c_e y_e, y_e + d_u - d_v >= 0 with d_s = 0, d_t = 1, 0 <= d <= 1
  const idx = (x) => m + mid.indexOf(x), drows = [];
  arcs.forEach(([u, v], e) => {
    const a = Array(m + n).fill(0); a[e] = 1; let rhs = 0;
    if (u === t) rhs -= 1; else if (u !== s) a[idx(u)] += 1;
    if (v === t) rhs += 1; else if (v !== s) a[idx(v)] -= 1;
    drows.push({ a, op: '>=', b: rhs });
  });
  mid.forEach((x, k) => { const a = Array(m + n).fill(0); a[m + k] = 1; drows.push({ a, op: '<=', b: 1 }); });
  const D = simplex([...arcs.map(([, , c]) => -c), ...Array(n).fill(0)], drows);
  return { P, D, mid, m, f: P.x, y: D.x ? D.x.slice(0, m) : null, d: D.x ? Object.fromEntries([[s, 0], [t, 1], ...mid.map((x, k) => [x, D.x[m + k]])]) : null, pv: P.value, dv: -D.value };
}

// ---------------------------------------------------------------- Klee–Minty data
// Explicit scaling of the original epsilon-cube (epsilon=0.1), not a literal
// transcription of the 1972 coefficients. Full source and all-n gradient proof:
// docs/verification/klee-minty-primary-followup.md.
function kmLP(n) {
  const c = Array.from({ length: n }, (_, j) => 10 ** (n - 1 - j));
  const rows = Array.from({ length: n }, (_, i) => { const a = Array(n).fill(0); for (let j = 0; j < i; j++) a[j] = 2 * 10 ** (i - j); a[i] = 1; return { a, op: '<=', b: 100 ** i }; });
  return { c, rows };
}
const kmRun = (n, rule) => { const { c, rows } = kmLP(n); return simplex(c, rows, { rule }); };
const KM_RULES = [{ value: 'dantzig', label: 'largest coefficient', col: 'red' }, { value: 'bland', label: 'smallest index (Bland)', col: 'orange' }, { value: 'greatest', label: 'greatest increase', col: 'green' }];

// ---------------------------------------------------------------- ellipsoid and barrier on a 2D polygon
const POLY_CONS = [{ a: [-1, 0], b: -0.5 }, { a: [0, -1], b: -0.5 }, { a: [1, 1], b: 8 }, { a: [1, 0], b: 6 }, { a: [0, 1], b: 5 }, { a: [-1, 1], b: 3 }];
function ellipsoidRun(cons, cobj, K = 60) {
  const n = 2; let c = [4, 3], Q = [[100, 0], [0, 100]]; const out = [], optPoly = (() => { let P = [[0, 0], [20, 0], [20, 20], [0, 20]]; for (const q of cons) P = clipHalf(P, q.a, q.b); return P; })();
  const opt = Math.max(...optPoly.map((p) => cobj[0] * p[0] + cobj[1] * p[1])); let best = -Infinity;
  for (let k = 0; k <= K; k++) {
    const viol = cons.find((q) => q.a[0] * c[0] + q.a[1] * c[1] > q.b + 1e-12), feas = !viol;
    if (feas) best = Math.max(best, cobj[0] * c[0] + cobj[1] * c[1]);
    const det = Q[0][0] * Q[1][1] - Q[0][1] ** 2;
    out.push({ c: c.slice(), Q: Q.map((r) => r.slice()), feas, area: Math.PI * Math.sqrt(det), best, cut: viol ? viol.a : [-cobj[0], -cobj[1]], opt });
    const a = viol ? viol.a : [-cobj[0], -cobj[1]], Qa = [Q[0][0] * a[0] + Q[0][1] * a[1], Q[1][0] * a[0] + Q[1][1] * a[1]], aQa = a[0] * Qa[0] + a[1] * Qa[1], g = [Qa[0] / Math.sqrt(aQa), Qa[1] / Math.sqrt(aQa)];
    c = [c[0] - g[0] / (n + 1), c[1] - g[1] / (n + 1)];
    const f = (n * n) / (n * n - 1), sc = 2 / (n + 1);
    Q = [[f * (Q[0][0] - sc * g[0] * g[0]), f * (Q[0][1] - sc * g[0] * g[1])], [f * (Q[1][0] - sc * g[1] * g[0]), f * (Q[1][1] - sc * g[1] * g[1])]];
  }
  return out;
}
function barrierPath(cons, cobj, N = 90) {
  let x = [3, 2]; const out = [];
  const grad = (t, x) => { let g = [t * cobj[0], t * cobj[1]], H = [[0, 0], [0, 0]]; for (const q of cons) { const sl = q.b - (q.a[0] * x[0] + q.a[1] * x[1]); g[0] += q.a[0] / sl; g[1] += q.a[1] / sl; for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) H[i][j] += (q.a[i] * q.a[j]) / (sl * sl); } return { g, H }; };
  const phi = (t, x) => { let val = t * (cobj[0] * x[0] + cobj[1] * x[1]); for (const q of cons) { const sl = q.b - (q.a[0] * x[0] + q.a[1] * x[1]); if (sl <= 0) return -Infinity; val += Math.log(sl); } return val; };
  for (let k = 0; k <= N; k++) {
    const t = 10 ** (-1.5 + (k * 5) / N);
    for (let it = 0; it < 40; it++) {
      const { g, H } = grad(t, x), det = H[0][0] * H[1][1] - H[0][1] ** 2, d = [(H[1][1] * g[0] - H[0][1] * g[1]) / det, (-H[1][0] * g[0] + H[0][0] * g[1]) / det];
      let a = 1; const f0 = phi(t, x); while (phi(t, [x[0] + a * d[0], x[1] + a * d[1]]) < f0 + 0.25 * a * (g[0] * d[0] + g[1] * d[1]) && a > 1e-12) a *= 0.5;
      x = [x[0] + a * d[0], x[1] + a * d[1]]; if (Math.hypot(a * d[0], a * d[1]) < 1e-12) break;
    }
    out.push({ t, x: x.slice() });
  }
  return out;
}

export default {
  collection: 'algo',
  chapter: 11,
  items: [
    // ------------------------------------------------------------------ 11.21
    {
      num: '11.21',
      kind: 'Theorem',
      name: 'Max-flow min-cut as LP duality',
      statement: String.raw`The maximum-flow problem is the linear program
$$\max\ \sum_{(s,v)}f_{sv}-\sum_{(u,s)}f_{us}\quad\text{s.t.}\quad f_e\le c_e\ (e\in E),\qquad \sum_{(u,v)}f_{uv}-\sum_{(v,w)}f_{vw}=0\ (v\ne s,t),\qquad f\ge0.$$
Its dual is
$$\min\ \sum_{e}c_e\,y_e\quad\text{s.t.}\quad y_{uv}\ge d_v-d_u\ \ (uv\in E),\qquad d_s=0,\ d_t=1,\qquad y\ge0,$$
with one variable $y_e$ per capacity constraint and one potential $d_v$ per conservation constraint. The constraint matrix is totally unimodular, so the dual has an optimal solution with $d\in\{0,1\}^V$; it is the cut $S=\{v:d_v=0\}$ with $y_e=1$ exactly on the edges leaving $S$. Hence LP duality gives max-flow $=$ min-cut, and **complementary slackness** says that at optimal flows and cuts every edge leaving $S$ is saturated and every edge entering $S$ is empty.`,
      idea: String.raw`Dualising the flow LP produces the potential form of the dual directly; any feasible $(y,d)$ is a "fractional cut": the potentials say how far along the way from $s$ ($d=0$) to $t$ ($d=1$) each vertex sits, and an edge pays $y_e$ for the climb it makes. Rounding the potentials at a random threshold $\theta\in(0,1)$ gives a genuine cut whose expected capacity is the dual objective, so some cut is at most as expensive as the fractional one (this also shows that an optimal dual vertex can be taken integral). Weak duality is 11.3; strong duality (11.19) then reproves 11.6 without augmenting paths.`,
      caption: String.raw`The flow LP and the cut LP are both solved here with a simplex method on the network you see. Left: the LP's optimal flow (labels flow/capacity), each vertex tagged with the potential $d_v$ the dual LP found, and the edges with $y_e=1$ in red: they form a cut. Right: the four numbers that must agree. Edit capacities by clicking them; the table recomputes.`,
      deps: ['algo-11.19', 'algo-11.6'],
      refs: ['Erickson notes: Linear Programming', 'CLRS 4e §29.3'],
      tags: ['linear programming', 'flow'],
      viz(v) {
        const s1 = netStage(v, { x: [-0.7, 10.2], weight: 1.5, height: 330 });
        const s2 = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, weight: 0.8, title: 'Four ways to the same number' });
        const G = mkNet(v, s1, 'A', { editable: EDITW });
        v.select('network', NET_SELECT, 'A', { onChange: (k) => loadNet(G, k) });
        const T = v.table(s2, { rows: 4, cols: 1, square: false, cellAspect: 1.6, maxCell: 50, size: 14, colLabels: ['value'], rowLabels: ['flow LP (simplex)', 'Ford–Fulkerson', 'cut LP (simplex)', 'all cuts, exhaustive'], labelWidth: 1.8 });
        const cache = new Map();
        const solve = () => {
          const arcs = arcsOf(G), I = netIds(G), key = arcs.map((a) => a.join('/')).join(';');
          if (!cache.has(key)) { if (cache.size > 40) cache.clear(); const L = flowLPs(I, arcs, 's', 't'), ff = fordFulkerson(I, arcs, 's', 't', 'bfs'), mc = minCutBrute(I, arcs, 's', 't'); cache.set(key, { L, ff, mc, arcs }); }
          return cache.get(key);
        };
        v.render(() => {
          const { L, ff, mc, arcs } = solve(), f = L.f || zeros(arcs.length), y = L.y || zeros(arcs.length);
          drawFlow(G, f.map((x) => Math.round(x * 1e6) / 1e6), (fl, idx) => ({
            edgeColor: (e) => (y[idx.get(e)] > 0.5 ? 'red' : fl(e) > 1e-9 ? 'accent' : 'faint'), edgeWidth: (e) => (y[idx.get(e)] > 0.5 ? 4.4 : 1.5 + 0.45 * Math.min(fl(e), 14)),
            nodeNote: (id) => (L.d ? `d=${num(L.d[String(id)], 2)}` : null), noteColor: 'muted',
            nodeColor: (id) => (L.d && L.d[String(id)] < 0.5 ? 'blue' : L.d ? 'orange' : null),
          }));
          const vals = [L.pv, ff.value, L.dv, mc.cap], ok = vals.every((x) => Math.abs(x - vals[0]) < 1e-6);
          T.draw({ value: (i) => num(vals[i], 3), fill: () => (ok ? ['green', 0.3] : ['red', 0.3]), rows: 4, cols: 1 });
        });
        v.legend([['red', 'edges with $y_e=1$: the cut'], ['blue', 'potential $d_v=0$ (source side)', { dot: true }], ['orange', '$d_v=1$ (sink side)', { dot: true }]]);
        v.readout(() => {
          const { L, ff, mc, arcs } = solve(), f = L.f, y = L.y, I = netIds(G), d = L.d;
          if (!f || !y) return 'LP solver failed on this input.';
          const integral = I.every((x) => Math.abs(d[x] - Math.round(d[x])) < 1e-6), S = new Set(I.filter((x) => d[x] < 0.5));
          const sat = arcs.every(([u, w, c], i) => !(S.has(u) && !S.has(w)) || Math.abs(f[i] - c) < 1e-6), emp = arcs.every(([u, w], i) => !(!S.has(u) && S.has(w)) || Math.abs(f[i]) < 1e-6);
          return `Flow LP $=${num(L.pv, 3)}$, cut LP $=${num(L.dv, 3)}$ — equal ✓ · dual optimum is a 0/1 cut: **${integral ? 'yes' : 'no'}**, $S=\\{${[...S].join(',')}\\}$ of capacity $${num(cutCap(arcs, S), 3)}$\ncomplementary slackness: edges leaving $S$ saturated **${sat ? 'yes' : 'no'}**, edges entering $S$ empty **${emp ? 'yes' : 'no'}** · exhaustive min cut $${num(mc.cap, 3)}$`;
        });
      },
    },
    // ------------------------------------------------------------------ 11.22
    {
      num: '11.22',
      kind: 'Proposition',
      name: 'Simplex can take exponentially many pivots (Klee–Minty)',
      statement: String.raw`For every $n$ there is a linear program in $n$ variables and $n$ constraints (plus $x\ge0$), a "squashed $n$-cube", for which the simplex method with the **largest-coefficient** pivot rule, started at the origin, visits all $2^n$ vertices and so makes $2^n-1$ pivots. One such family is
$$\max\ \sum_{j=1}^n10^{\,n-j}x_j\quad\text{s.t.}\quad 2\sum_{j<i}10^{\,i-j}x_j+x_i\le 100^{\,i-1}\ (i=1,\dots,n),\ x\ge0.$$
This is an explicit rescaling of Klee and Minty's $\varepsilon$-cube with $\varepsilon=0.1$, not a transcription of their printed coefficients. So no bound polynomial in $n$ holds for this pivot rule. The same LP is solved in one pivot by the greatest-increase rule, so the example indicts a *rule*, not the LP.`,
      idea: String.raw`Each constraint is a slightly tilted face of a cube; because the tilts are small, the vertices keep the combinatorial structure of a cube, and the objective increases along a path through all $2^n$ of them (a Hamiltonian path of the cube along which the objective is strictly increasing). Recursively, the path in dimension $n$ goes through the path of dimension $n-1$ on the face $x_n=0$, climbs the vertical edge, and traverses the path of dimension $n-1$ again, in reverse, on the opposite face; the coefficient scaling $10^{n-j}$ makes the largest-coefficient rule choose exactly these moves. Hence $T(n)=2T(n-1)+1$ pivots.`,
      caption: String.raw`Left: the Klee–Minty polytope for $n=3$ (each axis rescaled to $[0,1]$ so the squashed cube is visible), with the simplex path in the order of the pivots; step through it and drag to rotate. Right: pivot counts for $n=1,\dots,7$ under three rules, computed by actually running the simplex method; the dashed line is $2^n-1$. Largest-coefficient hits it on the nose; greatest-increase finishes in one pivot. Choose the rule for the path on the left.`,
      deps: ['opt-6.3'],
      refs: ['Erickson notes: Linear Programming Algorithms', 'Klee–Minty, How Good Is the Simplex Algorithm?, Inequalities III (1972), pp.159–175; §4 pp.162–164, §7 pp.170–174, Eq.(29)'],
      tags: ['linear programming', 'counterexample'],
      credit: 'V. Klee & G. J. Minty, 1972 (“How good is the simplex algorithm?”)',
      links: { source: 'https://sophie.huiberts.me/files/Klee-Minty-How-Good-Is-the-Simplex-Algorithm-1970.pdf' },
      viz(v) {
        const s = v.stage({ x: [-1.7, 1.7], y: [-1.5, 1.5], equal: true, axes: false, height: 380, weight: 1.1 });
        const bars = v.stage({ x: [0.3, 7.7], y: [0.7, 400], ylog: true, axes: 'box', gutter: true, height: 380, weight: 1, xlabel: 'dimension $n$', ylabel: 'pivots', xticks: [1, 2, 3, 4, 5, 6, 7] });
        const sc = v.scene3(s, { yaw: -0.75, pitch: 0.38, axes: false, hint: true });
        const rule = v.select('pivot rule', KM_RULES.map(({ value, label }) => ({ value, label })), 'dantzig', { onChange: () => { frames = mkFrames(); S.reset({ at: 'start' }); } });
        const N = 3, { c, rows } = kmLP(N), G = rows.map((r) => r.a).concat(Array.from({ length: N }, (_, i) => Array.from({ length: N }, (_, j) => (i === j ? -1 : 0)))), h = rows.map((r) => r.b).concat(Array(N).fill(0));
        const verts = vertices(G, h, N), mx = Array.from({ length: N }, (_, j) => Math.max(...verts.map((q) => q.x[j])));
        const pos = (x) => x.map((xj, j) => (xj / mx[j] - 0.5) * 1.6), edges = [];
        verts.forEach((a, i) => verts.forEach((b, j) => { if (j > i && a.tight.filter((t) => b.tight.includes(t)).length >= N - 1) edges.push([i, j]); }));
        const names = (k) => (k < N ? `x${k + 1}` : `s${k - N + 1}`);
        const mkFrames = () => {
          const r = simplex(c, rows, { rule: rule.value }), path = [[0, 0, 0], ...r.pivots.map((p) => p.x)];
          const F = [{ k: 0, at: path[0], value: 0, note: 'Start at the origin, a feasible vertex: all slack variables are basic.' }];
          r.pivots.forEach((p, k) => F.push({ k: k + 1, at: p.x, value: p.value, note: `Pivot ${k + 1}: ${names(p.enter)} enters the basis, ${names(p.leave)} leaves. Objective ${num(p.value, 0)}.` }));
          F.forEach((q) => { q.path = path.slice(0, q.k + 1); }); return F;
        };
        let frames = mkFrames();
        const S = v.steps({ frames: () => frames, speed: 1.2, still: 4 });
        const cnt = (n, rl) => kmRun(n, rl).pivots.length, table = [1, 2, 3, 4, 5, 6, 7].map((n) => KM_RULES.map((r) => cnt(n, r.value)));
        v.render(() => {
          sc.begin();
          const P0 = pos([0, 0, 0]);
          [[1, 0, 0], [0, 1, 0], [0, 0, 1]].forEach((e, i) => { sc.arrow(P0, P0.map((c0, j) => c0 + e[j] * 2.0), { color: 'faint', width: 1.2, head: 7 }); sc.tex(`x_${i + 1}`, P0.map((c0, j) => c0 + e[j] * 2.12), { color: 'muted', size: 15 }); });
          edges.forEach(([i, j]) => sc.line(pos(verts[i].x), pos(verts[j].x), { color: 'muted', width: 1.2, alpha: 0.55 }, 1));
          const fr = S.frame, pts = fr.path.map(pos);
          for (let k = 0; k + 1 < pts.length; k++) sc.line(pts[k], pts[k + 1], { color: 'orange', width: 3.4, top: true }, 1);
          fr.path.forEach((p, k) => sc.dot(pos(p), { r: k === fr.path.length - 1 ? 7 : 4.5, color: k === fr.path.length - 1 ? 'gold' : 'orange' }));
          sc.flush();
          for (let n = 1; n <= 7; n++) KM_RULES.forEach((r, k) => { const x0 = n - 0.36 + k * 0.24, hgt = Math.max(table[n - 1][k], 1); bars.rect(x0, 0.7, x0 + 0.21, hgt, { fill: r.col, fillAlpha: 0.7, color: r.col, width: 1 }); });
          bars.path(Array.from({ length: 7 }, (_, i) => [i + 1, 2 ** (i + 1) - 1]), { color: 'ink', dash: true, width: 1.4 });
        });
        v.legend([['red', 'largest coefficient', { area: true }], ['orange', 'smallest index (Bland)', { area: true }], ['green', 'greatest increase', { area: true }], ['ink', '$2^n-1$', { dash: true }]]);
        v.readout(() => {
          const rl = KM_RULES.findIndex((r) => r.value === rule.value), fr = S.frame;
          return `$n=3$, ${KM_RULES[rl].label}: pivot ${fr.k} of ${S.n - 1} (vertices visited: ${fr.k + 1} of ${verts.length}) · objective $${num(fr.value, 0)}$\npivots for $n=1..7$ with largest coefficient: ${table.map((r) => r[0]).join(', ')} = $2^n-1$: **${table.every((r, i) => r[0] === 2 ** (i + 1) - 1) ? 'yes' : 'no'}** · greatest increase: ${table.map((r) => r[2]).join(', ')} · Bland: ${table.map((r) => r[1]).join(', ')}`;
        });
      },
    },
    // ------------------------------------------------------------------ 11.23
    {
      num: '11.23',
      kind: 'Theorem',
      name: 'Linear programs are solvable in polynomial time (statement)',
      statement: String.raw`There are algorithms that solve every linear program with rational data, given in binary, in time bounded by a polynomial in the number of variables, the number of constraints and the total bit length $L$ of the input: the **ellipsoid method** (Khachiyan, 1979) and **interior-point methods** (Karmarkar, 1984, and its successors). The ellipsoid method keeps an ellipsoid containing the feasible region (or its optimal part) and replaces it at each step by the smallest ellipsoid containing the half that survives a cut through the center; in $\R^n$ for $n\ge2$, the volume shrinks by at least the factor $e^{-1/(2(n+1))}$ per step. A modern log-barrier approach follows the **central path** $x^*(\mu)$, the maximizers of $\mu\,c^{\top}x+\sum_i\ln(b_i-a_i^{\top}x)$, for a bounded full-dimensional polytope with strict interior. This path lies in its interior and approaches the optimal face (which need not be a vertex) with duality gap at most $m/\mu$. Whether LP can be solved in *strongly* polynomial time, in a number of arithmetic operations polynomial in $n,m$ alone, is a famous open problem.`,
      idea: String.raw`A hyperplane through the center divides an ellipsoid into equal-volume halves. The minimum-volume enclosing ellipsoid of the retained half is smaller by a dimension-dependent factor. The full-dimensional rational case has bit-length-dependent inner and outer size bounds; arbitrary rational LPs additionally need reductions for lower-dimensional or unbounded feasible sets and controlled finite-precision arithmetic. These steps are essential to the exact polynomial-time theorem. For the modern log barrier, self-concordance bounds Newton work: after initial centering, increasing the weight by $1+1/\sqrt m$ permits a bounded number of Newton steps per update, giving $O(\sqrt m\log(m/(\mu_0\epsilon)))$ steps to reach duality gap $\epsilon$ from initial weight $\mu_0$. A fixed factor independent of $m$ does not give the same worst-case bound on inner work. Exact rational recovery also needs input-dependent separation bounds; a fixed absolute gap $2^{-L}$ alone is not a general exactness certificate. The diagram illustrates real-arithmetic planar cuts and a modern barrier path, not Karmarkar's original projective algorithm or its bit-complexity proof.`,
      caption: String.raw`The same polygon in two ways. **Left, ellipsoid method:** slide the iteration; the cutting half-plane goes through the center (red if the center is infeasible and a violated constraint is used, green if it is feasible and the objective cut is used), and the area falls by the constant factor $0.77$ per step in the plane, never worse than the bound $e^{-1/6}\approx0.85$. **Right, interior-point:** slide $\mu$; the point $x^*(\mu)$ glides through the middle of the polygon from the analytic center toward the optimal vertex.`,
      deps: ['algo-11.15', 'algo-11.22'],
      refs: ['CLRS 4e §29.1', 'Karmarkar, Combinatorica4 (1984), pp.373–395, §§1.6,2–5,7.4', 'Boyd–Vandenberghe, Convex Optimization, §§11.2.2–11.2.3 and 11.5.3, pp.564–567,590–592; Eqs.(11.27)–(11.29)'],
      tags: ['linear programming'],
      credit: 'L. G. Khachiyan, 1979 (ellipsoid); N. Karmarkar, 1984 (interior point)',
      links: { doi: 'https://doi.org/10.1007/BF02579150' },
      verify: true,
      viz(v) {
        const win = { x: [0, 8], y: [0, 6.5], equal: true, axes: 'box', gutter: true, height: 340, weight: 1 };
        const sE = v.stage({ ...win, title: 'Ellipsoid method', xlabel: '$x$', ylabel: '$y$' }), sB = v.stage({ ...win, title: 'Central path', xlabel: '$x$', ylabel: '$y$' });
        const th = v.slider('objective direction (degrees)', 0, 90, 40, { step: 1, onChange: () => { E = null; B = null; } });
        const k = v.slider('ellipsoid step $k$', 0, 40, 6, { int: true });
        const lm = v.slider('barrier weight $\\log_{10}\\mu$', -1.5, 3.5, 0, { step: 0.05 });
        let E = null, B = null;
        const cobj = () => [Math.cos((th.value * Math.PI) / 180), Math.sin((th.value * Math.PI) / 180)];
        const ensure = () => { if (!E) { E = ellipsoidRun(POLY_CONS, cobj(), 60); B = barrierPath(POLY_CONS, cobj(), 100); } };
        const poly = (() => { let P = [[0, 0], [20, 0], [20, 20], [0, 20]]; for (const q of POLY_CONS) P = clipHalf(P, q.a, q.b); return P; })();
        const ellipse = (e) => { const [[a, b], [, d]] = e.Q, l11 = Math.sqrt(a), l21 = b / l11, l22 = Math.sqrt(Math.max(d - l21 * l21, 0)); return (q) => [e.c[0] + l11 * Math.cos(q), e.c[1] + l21 * Math.cos(q) + l22 * Math.sin(q)]; };
        v.render(() => {
          ensure(); const kk = Math.min(k.value, E.length - 1), c = cobj();
          for (const [s0] of [[sE], [sB]]) s0.poly(poly, { fill: 'accent', fillAlpha: 0.12, color: 'accent', width: 2 });
          for (let i = 0; i < kk; i++) sE.curve(ellipse(E[i]), 0, 2 * Math.PI, { color: 'muted', width: 1, alpha: 0.35 });
          const e = E[kk]; sE.curve(ellipse(e), 0, 2 * Math.PI, { color: 'blue', width: 2.6 });
          const a = e.cut, nrm = Math.hypot(a[0], a[1]);
          sE.clip(() => sE.line(e.c[0] - 30 * -a[1] / nrm, e.c[1] - 30 * a[0] / nrm, e.c[0] + 30 * -a[1] / nrm, e.c[1] + 30 * a[0] / nrm, { color: e.feas ? 'green' : 'red', width: 2.2, dash: true }));
          sE.arrow(e.c[0], e.c[1], e.c[0] - 0.8 * a[0] / nrm, e.c[1] - 0.8 * a[1] / nrm, { color: e.feas ? 'green' : 'red', width: 2 });
          sE.dot(e.c[0], e.c[1], { r: 5, color: e.feas ? 'green' : 'red' });
          const opt = poly.reduce((b, p) => (c[0] * p[0] + c[1] * p[1] > c[0] * b[0] + c[1] * b[1] ? p : b), poly[0]); sE.dot(opt[0], opt[1], { r: 8, hollow: true, color: 'green' }); sB.dot(opt[0], opt[1], { r: 8, hollow: true, color: 'green' });
          sB.path(B.map((q) => q.x), { color: 'purple', width: 2.4 });
          const cur = B.reduce((b, q) => (Math.abs(Math.log10(q.t) - lm.value) < Math.abs(Math.log10(b.t) - lm.value) ? q : b), B[0]);
          sB.dot(B[0].x[0], B[0].x[1], { r: 4, color: 'purple' }); sB.dot(cur.x[0], cur.x[1], { r: 7, color: 'gold' });
          sB.arrow(cur.x[0], cur.x[1], cur.x[0] + c[0], cur.x[1] + c[1], { color: 'orange', width: 1.8 });
        });
        v.legend([['blue', 'current ellipsoid'], ['muted', 'earlier ellipsoids'], ['purple', 'central path $x^*(\\mu)$'], ['gold', 'current $x^*(\\mu)$', { dot: true }], ['green', 'optimal vertex', { dot: true }]]);
        v.readout(() => {
          ensure(); const kk = Math.min(k.value, E.length - 1), e = E[kk], p = kk ? E[kk - 1] : null, c = cobj(), gap = E[0].opt - e.best;
          const t = 10 ** lm.value, cur = B.reduce((b, q) => (Math.abs(Math.log10(q.t) - lm.value) < Math.abs(Math.log10(b.t) - lm.value) ? q : b), B[0]);
          return `ellipsoid step ${kk}: area $${num(e.area, 3)}$${p ? `, ratio to previous $${num(e.area / p.area, 4)}\\le e^{-1/6}=${num(Math.exp(-1 / 6), 4)}$` : ''} · best feasible objective $${isFinite(e.best) ? num(e.best, 4) : '-'}$ (gap to optimum $${isFinite(gap) ? num(gap, 4) : '-'}$)\ncentral path: $\\mu=${num(t, 3)}$, $x^*=(${num(cur.x[0], 3)},${num(cur.x[1], 3)})$ · duality gap $\\le m/\\mu=${num(POLY_CONS.length / cur.t, 3)}$ (here $m=${POLY_CONS.length}$) · objective $${num(c[0] * cur.x[0] + c[1] * cur.x[1], 4)}$`;
        });
      },
    },
    // ------------------------------------------------------------------ 11.24
    {
      num: '11.24',
      kind: 'Theorem',
      name: 'Totally unimodular LPs have integral vertices',
      statement: String.raw`A matrix is **totally unimodular** (TU) if every square submatrix has determinant $0$, $1$ or $-1$. If $A$ is TU and $b$ is an integer vector, every vertex of $\{x:Ax\le b,\ x\ge0\}$ is an integer vector. The vertex-edge incidence matrix of a graph is TU **if and only if the graph is bipartite**; therefore for a bipartite graph every vertex of the polytope $\{x\ge0:\ \sum_{e\ni v}x_e\le1\ \forall v\}$ is a $0/1$ vector, that is, a matching, and so linear programming finds maximum matchings (and, by duality, minimum vertex covers: König's theorem). For a graph with an odd cycle the polytope has fractional vertices: on a triangle, $x=(\tfrac12,\tfrac12,\tfrac12)$.`,
      idea: String.raw`A vertex is the unique solution of a nonsingular square system $A_Bx_B=b_B$ taken from tight rows. By Cramer's rule each coordinate is a ratio of determinants, with denominator $\det A_B\in\{\pm1\}$ when $A$ is TU, hence an integer. For a bipartite incidence matrix, expand a square submatrix along a column with at most one $1$ (zero determinant if there is none; otherwise induct), or at a column with two $1$s, one per colour class, which cancel when the rows of the left side are summed against those of the right. An odd cycle contributes a $k\times k$ submatrix with determinant $\pm2$ (the cycle's rows and edges), which breaks TU and creates the half-integral vertex.`,
      caption: String.raw`Click a vertex and then another to add or remove an edge (up to 9 edges). The matrix is the incidence matrix; the first square submatrix with determinant of absolute value $\ge2$, if any, is shaded red. Every vertex of the matching polytope is found exhaustively; fractional ones are shown on the graph with half-weight edges. Bipartite: all vertices are 0/1. Press **Add an odd cycle** to join two left vertices and watch a half-integral vertex appear.`,
      deps: ['algo-11.16', 'algo-11.10', 'ladr-9.43'],
      refs: ['Erickson, Simplex, Exercise 9(a–d), p. 15'], sourceUrl: 'https://jeffe.cs.illinois.edu/teaching/algorithms/notes/I-simplex.pdf',
      tags: ['linear programming', 'matching'],
      credit: 'Cramer-rule proof and bipartite/odd-cycle characterization: Erickson, Simplex, Exercise 9(a–d), p. 15; details shown here',
      viz(v) {
        const POS = [['l0', 2.2, 5.0], ['l1', 2.2, 3.0], ['l2', 2.2, 1.0], ['r0', 6.8, 5.0], ['r1', 6.8, 3.0], ['r2', 6.8, 1.0]];
        const s = v.stage({ x: [0, 9], y: [0, 6], axes: false, equal: true, height: 330, weight: 1.2 });
        const sm = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, weight: 1, title: 'Incidence matrix' });
        let E = [[0, 3], [0, 4], [1, 3], [1, 5], [2, 4], [2, 5], [1, 4]], pick = null, vsel = 0;
        const nodes = POS.map(([id, x, y], i) => ({ id, x, y, label: i < 3 ? `L${i + 1}` : `R${i - 2}` }));
        const G = v.graph(s, { layout: 'none', nodes, edges: [], draggable: false, onClick: ({ node, id }) => {
          if (!node) return false; const k = String(id), i = POS.findIndex((p) => p[0] === k);
          if (pick == null) { pick = i; return true; }
          if (pick === i) { pick = null; return true; }
          const a = Math.min(pick, i), b = Math.max(pick, i), at = E.findIndex(([p, q]) => p === a && q === b);
          if (at >= 0) E.splice(at, 1); else if (E.length < 9) E.push([a, b]); pick = null; return true;
        } });
        const T = v.table(sm, { square: false, cellAspect: 0.9, maxCell: 40, size: 14 });
        v.button('Bipartite example', () => { E = [[0, 3], [0, 4], [1, 3], [1, 5], [2, 4], [2, 5], [1, 4]]; pick = null; });
        v.button('Add an odd cycle', () => { if (!E.some(([a, b]) => a === 0 && b === 1) && E.length < 9) E.push([0, 1]); });
        v.button('Clear', () => { E = []; pick = null; });
        const cache = new Map();
        const analyse = () => {
          const key = JSON.stringify(E); if (cache.has(key)) return cache.get(key);
          const n = 6, m = E.length, M = Array.from({ length: n }, (_, r) => E.map(([a, b]) => (a === r || b === r ? 1 : 0)));
          let bad = null;
          outer: for (let k = 2; k <= Math.min(n, m); k++) for (const R0 of combos(n, k)) for (const C0 of combos(m, k)) { const d = detOf(R0.map((r) => C0.map((c) => M[r][c]))); if (Math.abs(d) > 1.5) { bad = { R0, C0, d }; break outer; } }
          const Gc = [...M, ...Array.from({ length: m }, (_, i) => Array.from({ length: m }, (_, j) => (i === j ? -1 : 0)))], h = [...Array(n).fill(1), ...Array(m).fill(0)];
          const V = m ? vertices(Gc, h, m) : [], frac = V.filter((q) => q.x.some((x) => Math.abs(x - Math.round(x)) > 1e-7));
          const col = Array(n).fill(-1), adj = Array.from({ length: n }, () => []); E.forEach(([a, b]) => { adj[a].push(b); adj[b].push(a); });
          let bip = true; for (let r = 0; r < n; r++) if (col[r] < 0) { col[r] = 0; const q = [r]; for (let h2 = 0; h2 < q.length; h2++) for (const w of adj[q[h2]]) { if (col[w] < 0) { col[w] = 1 - col[q[h2]]; q.push(w); } else if (col[w] === col[q[h2]]) bip = false; } }
          const out = { M, bad, V, frac, bip, m }; cache.set(key, out); return out;
        };
        const nxt = v.button('Next fractional vertex', () => { vsel++; });
        v.render(() => {
          const A = analyse(), fv = A.frac.length ? A.frac[vsel % A.frac.length] : null;
          G.edges = E.map(([a, b], i) => ({ from: POS[a][0], to: POS[b][0], x: fv ? fv.x[i] : 0 }));
          G.draw({ edgeColor: (e) => (fv && e.x > 1e-7 ? 'purple' : 'faint'), edgeWidth: (e) => (fv ? 1.6 + 5 * e.x : 2), edgeLabel: (e) => (fv && e.x > 1e-7 ? num(e.x, 2) : null), nodeColor: (id) => (POS.findIndex((p) => p[0] === String(id)) === pick ? 'gold' : null), nodeRing: (id) => (POS.findIndex((p) => p[0] === String(id)) === pick ? 'gold' : null) });
          T.draw({ rows: 6, cols: Math.max(A.m, 1), value: (i, j) => A.M[i]?.[j] ?? 0, rowLabels: ['L1', 'L2', 'L3', 'R1', 'R2', 'R3'], colLabels: E.map(([a, b]) => `${POS[a][0].toUpperCase()}${POS[b][0].toUpperCase()}`.replace(/L(\d)/, (_, d) => `L${+d + 1}`).replace(/R(\d)/, (_, d) => `R${+d + 1}`)), size: 14,
            fill: (i, j) => (A.bad && A.bad.R0.includes(i) && A.bad.C0.includes(j) ? ['red', 0.3] : A.M[i][j] ? ['blue', 0.15] : null), textColor: (i, j) => (A.M[i][j] ? 'ink' : 'faint') });
        });
        v.legend([['purple', 'fractional vertex: edge weight $x_e$', {}], ['red', 'square submatrix with $|\\det|\\ge2$', { area: true }]]);
        v.readout(() => {
          const A = analyse();
          return `${A.m} edges · graph is **${A.bip ? 'bipartite' : 'not bipartite'}** · incidence matrix **${A.bad ? 'not TU' : 'TU'}**${A.bad ? ` (a ${A.bad.R0.length}×${A.bad.R0.length} submatrix has $\\det=${A.bad.d}$)` : ' (all square submatrices checked)'}\npolytope $\\{x\\ge0: \\sum_{e\\ni v}x_e\\le1\\}$ has **${A.V.length}** vertices, **${A.frac.length}** fractional${A.frac.length ? `: e.g. $x=(${A.frac[vsel % A.frac.length].x.map((q) => num(q, 2)).join(', ')})$` : ' — every vertex is a matching'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 11.25
    {
      num: '11.25',
      kind: 'Paper',
      name: 'Maximal Flow Through a Network',
      paper: { authors: 'L. R. Ford, Jr. and D. R. Fulkerson', year: 1956, title: 'Maximal Flow Through a Network', venue: 'Canadian Journal of Mathematics 8: 399–404', doi: '10.4153/CJM-1956-045-5' },
      introduces: ['algo-11.6', 'graph-6.2.2'],
      statement: String.raw`Ford and Fulkerson prove that the **maximal flow value equals the minimal cut capacity** in a finite undirected network with positive capacities, one source and one sink. Their flow is a nonnegative collection of simple source-to-sink chain flows, with total use of each link bounded by its capacity. The general proof is **nonconstructive**. For a **source–sink-planar** network — one that remains planar after adding a source-to-sink link — they give a finite algorithm: select a topmost or bottommost chain that meets every cut once, send its bottleneck flow, subtract that amount from its capacities, delete saturated links, and repeat until disconnected. They also relate this planar flow problem to shortest paths in the planar dual. The general residual-labeling procedure illustrated here is a modern comparison, not the algorithm given in this paper.`,
      idea: String.raw`The paper begins with T. Harris's rail-network question. In §1, the feasible chain flows form a compact polytope, so a maximal flow exists. Averaging maximal flows shows that the links saturated in every maximal flow disconnect the terminals. The authors then select a separating set of these links that every positive chain flow crosses exactly once; its capacity equals the maximal flow value. In §2, source–sink planarity supplies an extreme chain meeting every cut exactly once. Subtracting its bottleneck reduces every cut capacity by that amount, and deleting at least one saturated link at each step gives finite termination. Section 3 uses planar duality to convert a shortest-path problem to this flow problem. The visualization instead uses the residual-labeling method of 11.4–11.6 on our own directed networks, illustrating the modern theorem and its cut certificate without reproducing the original paper's algorithm or examples.`,
      caption: String.raw`A **modern residual-labeling comparison**, on an editable directed network of our own; the 1956 paper's planar extreme-chain algorithm is described above. Each vertex receives a label $[\,u\pm,\ \varepsilon\,]$: reached from $u$ forward (+) or backward (−), with the largest amount $\varepsilon$ that can still be pushed. A breakthrough (the sink is labeled) pushes $\varepsilon$ along the chain; when labeling gets stuck the labeled vertices (teal) form a cut whose capacity (red edges) equals the flow. Click a capacity to edit it.`,
      deps: ['algo-11.1', 'algo-11.2'],
      refs: ['Ford–Fulkerson (1956), pp. 399–404, §§1–3, Theorems 1–2 and corollary'],
      tags: ['flow', 'duality'],
      viz(v) {
        const win = { x: [-1.2, 10], y: [0, 6], axes: false, equal: true, height: 340, weight: 1.6 };
        const s = v.stage(win), bars = v.stage({ x: [0, 3], y: [0, 24], axes: 'box', gutter: true, height: 340, weight: 0.6, xticks: [[0.75, 'flow'], [2.25, 'cut']], ylabel: 'value' });
        const G = mkNet(v, s, 'A', { editable: EDITW, onChange: () => S.reset({ at: 'start' }) });
        v.select('network', NET_SELECT, 'A', { onChange: (k) => { loadNet(G, k); S.reset({ at: 'start' }); } });
        const labelRun = (I, arcs) => {
          let f = zeros(arcs.length), labels = null; const F = [];
          const snap = (type, extra) => F.push({ type, f: f.slice(), value: flowValue(arcs, f, 's'), labels: labels ? { ...labels } : {}, ...extra });
          snap('init', { note: 'Start from the zero flow.' });
          for (let round = 0; round < 60; round++) {
            labels = { s: { pred: null, sign: '', eps: Infinity } }; const Q = ['s'];
            snap('label', { note: `Round ${round + 1}: label the source, [−, ∞].`, cur: 's' });
            let hit = false;
            for (let h = 0; h < Q.length && !hit; h++) {
              const u = Q[h]; let did = false;
              for (let i = 0; i < arcs.length && !hit; i++) {
                const [a, b, c] = arcs[i];
                if (a === u && !labels[b] && f[i] < c - 1e-9) { labels[b] = { pred: u, sign: '+', eps: Math.min(labels[u].eps, c - f[i]), i }; Q.push(b); did = true; snap('label', { cur: u, note: `Scan ${u}: ${b} is labeled [${u}+, ${num(labels[b].eps, 2)}] because ${u}→${b} has ${num(c - f[i], 2)} unused capacity.` }); if (b === 't') hit = true; }
                else if (b === u && !labels[a] && f[i] > 1e-9) { labels[a] = { pred: u, sign: '−', eps: Math.min(labels[u].eps, f[i]), i }; Q.push(a); did = true; snap('label', { cur: u, note: `Scan ${u}: ${a} is labeled [${u}−, ${num(labels[a].eps, 2)}] because the flow ${num(f[i], 2)} on ${a}→${u} can be reduced.` }); if (a === 't') hit = true; }
              }
              void did;
            }
            if (hit) {
              const path = []; let x = 't'; while (x !== 's') { const L = labels[x]; path.unshift({ i: L.i, fwd: L.sign === '+', from: L.pred, to: x }); x = L.pred; }
              const eps = labels.t.eps; snap('break', { path, eps, note: `Breakthrough: the sink is labeled. Push ε = ${num(eps, 2)} along the chain of labels.` });
              for (const r of path) f[r.i] += r.fwd ? eps : -eps; labels = null; snap('push', { path, eps, note: `The flow value is now ${num(flowValue(arcs, f, 's'), 2)}. Erase all labels and start over.` });
            } else {
              const X = new Set(Object.keys(labels)); snap('stop', { X, cap: cutCap(arcs, X), note: `Non-breakthrough: no more vertices can be labeled. The labeled set {${[...X].join(', ')}} defines a cut of capacity ${num(cutCap(arcs, X), 2)}, equal to the flow value.` });
              break;
            }
          }
          return F;
        };
        const S = v.steps({ frames: () => labelRun(netIds(G), arcsOf(G)), speed: 1.3, still: 12 });
        v.render(() => {
          const fr = S.frame, X = fr.X, arcs = arcsOf(G), pk = new Set((fr.path || []).map((r) => r.i)), idx = new Map(G.edges.map((e, i) => [e, i]));
          drawFlow(G, fr.f, (fl) => ({
            edgeColor: (e) => (X && X.has(String(e.from)) && !X.has(String(e.to)) ? 'red' : pk.has(idx.get(e)) ? 'orange' : fl(e) > 1e-9 ? 'accent' : 'faint'), edgeWidth: (e) => (X && X.has(String(e.from)) && !X.has(String(e.to)) ? 4.4 : pk.has(idx.get(e)) ? 3.6 : 1.5 + 0.45 * Math.min(fl(e), 14)),
            nodeColor: (id) => (fr.labels[String(id)] ? 'teal' : null), nodeFill: (id) => (fr.labels[String(id)] && (fr.type === 'stop') ? 'teal' : null),
            nodeNote: (id) => { const L = fr.labels[String(id)]; return L ? (L.pred ? `[${L.pred}${L.sign}, ${num(L.eps, 2)}]` : '[−, ∞]') : null; }, noteColor: 'teal',
          }));
          const mc = minCutBrute(netIds(G), arcs, 's', 't').cap, top = Math.max(mc, fr.value, 1) * 1.2;
          bars.setView([0, 3], [0, top]);
          bars.rect(0.3, 0, 1.2, fr.value, { fill: 'accent', fillAlpha: 0.7, color: 'accent' });
          if (fr.type === 'stop') bars.rect(1.8, 0, 2.7, fr.cap, { fill: 'red', fillAlpha: 0.6, color: 'red' });
          bars.hline(mc, { color: 'green', dash: true });
        });
        v.legend([['teal', 'labeled vertex $[\\text{pred}\\pm,\\varepsilon]$', { dot: true }], ['orange', 'chain of labels'], ['red', 'edges of the final cut'], ['green', 'minimum cut (exhaustive)', { dash: true }]]);
        v.readout(() => {
          const fr = S.frame, arcs = arcsOf(G), mc = minCutBrute(netIds(G), arcs, 's', 't').cap;
          return `Flow value **${num(fr.value, 2)}**${fr.type === 'stop' ? ` · cut of the labeled set: **${num(fr.cap, 2)}** · exhaustive minimum cut over all ${2 ** (netIds(G).length - 2)} cuts: **${num(mc, 2)}** — paper’s theorem (max flow = min cut) ${Math.abs(fr.value - mc) < 1e-9 && Math.abs(fr.cap - mc) < 1e-9 ? 'confirmed ✓' : 'violated ✗'}` : ` · minimum cut (for comparison): ${num(mc, 2)}`}`;
        });
      },
    },
  ],
};
