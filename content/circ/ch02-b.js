// Circuits — Chapter 2: Kirchhoff’s laws and resistive networks (part b: 2.7–2.11)
import { clamp, sI, laplacian, reduce, solveNet, components, NETS, bridgeParts } from './ch02.shared.js';

/** Node positions of a named network centred on the origin, largest dimension 1. */
function geom(net) {
  const xs = net.pos.map((p) => p[0]), ys = net.pos.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), k = 1 / Math.max(x1 - x0, y1 - y0, 1e-9);
  return net.pos.map((p) => [(p[0] - (x0 + x1) / 2) * k, (p[1] - (y0 + y1) / 2) * k]);
}
const segDist = (px, py, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1, t = clamp(((px - a[0]) * dx + (py - a[1]) * dy) / L, 0, 1); return Math.hypot(px - a[0] - t * dx, py - a[1] - t * dy); };
/** A resistor zigzag from p to q (data units). */
function zig(s, p, q, o = {}) {
  const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy, ny = ux, a = o.amp ?? 0.035, f0 = 0.3, f1 = 0.7, K = 6;
  const pts = [p, [p[0] + dx * f0, p[1] + dy * f0]];
  for (let k = 0; k < K; k++) { const t = f0 + ((f1 - f0) * (k + 0.5)) / K, sg = k % 2 ? -1 : 1; pts.push([p[0] + dx * t + nx * a * sg, p[1] + dy * t + ny * a * sg]); }
  pts.push([p[0] + dx * f1, p[1] + dy * f1], q);
  s.path(pts, { color: o.color || 'ink', width: o.width || 2, alpha: o.alpha ?? 1 });
}
const rank = (v, A) => (A.length ? v.M.rank(A, 1e-9) : 0);

export default {
  collection: 'circ',
  chapter: 2,
  items: [
    // ───────────────────────────────────────────────────────────────────────────────────── 2.7
    {
      num: '2.7',
      kind: 'Theorem',
      name: 'Counting independent equations: n − 1 nodes, b − n + 1 loops',
      statement: String.raw`A connected circuit with $n$ nodes and $b$ branches has exactly $n-1$ independent KCL equations (the equations at all $n$ nodes sum to zero, so any one is redundant) and exactly $b-n+1$ independent KVL equations (one per fundamental loop of any spanning tree). Together these give $b$ independent topological constraints on the $2b$ branch currents and voltages. Adding $b$ element laws gives $2b$ equations, but consistency and uniqueness require a well-posed constitutive problem; the equation count alone does not guarantee them. For a graph with $c$ connected components the counts become $n-c$ and $b-n+c$.`,
      idea: String.raw`Write KCL as $\mathbf A\mathbf i = 0$ with $\mathbf A$ the $n\times b$ incidence matrix: each column has one $+1$ and one $-1$, so the rows sum to zero and $\operatorname{rank}\mathbf A\le n-1$; a spanning tree supplies $n-1$ columns that are independent, so the rank is $n-1$. KVL says the branch voltages $\mathbf v = \mathbf A^{\!\top}\mathbf e$ come from node potentials, equivalently $\mathbf B\mathbf v = 0$ for the fundamental-loop matrix $\mathbf B$, which has one row per non-tree branch and a $1$ in its own column, so $\operatorname{rank}\mathbf B = b-n+1$. The two row spaces are orthogonal complements: $\mathbf A\mathbf B^{\!\top} = 0$ and $(n-1)+(b-n+1)=b$ (this is the cycle space and cut space of the graph, 1.10). The rank–nullity theorem (ladr 3.21) turns the incidence rank into the loop count: $A:\mathbb R^b\to\mathbb R^n$ has $\dim\ker A=b-\operatorname{rank}A$. A spanning forest gives rank $n-c$, hence $b-n+c$ independent circulating currents. Fundamental loops lie in this kernel, and their distinct chord coordinates make them independent; having the kernel's dimension makes them a basis. This counts independent topological constraints; it does not by itself guarantee that arbitrary element laws have a unique consistent solution.`,
      caption: String.raw`Choose a network and draw a random spanning tree (green, thick). Each remaining branch (dashed) closes exactly one fundamental loop with the tree: slide through them. The rank of $\mathbf A$ and of $\mathbf B$ are computed numerically, and $\mathbf A\mathbf B^{\!\top}$ is exactly zero. Switch to the disconnected network (two triangles): the tree becomes a forest and the counts are $n-c$ and $b-n+c$, so the hypothesis "connected" matters.`,
      scope: String.raw`Any graph with $b$ branches counted as edges (parallel branches and self-loops allowed); connectedness is needed for the counts $n-1$ and $b-n+1$.`,
      deps: ['circ-2.1', 'circ-2.2', 'ladr-3.21'],
      refs: ['Agarwal–Lang §2.7', 'Agarwal–Lang §3.2'],
      tags: ['graph', 'spanning tree'],
      viz(v) {
        const s = v.stage({ x: [-0.72, 0.72], y: [-0.62, 0.62], equal: true, axes: false, height: 350, weight: 1.1, title: 'the circuit graph, a spanning tree and one fundamental loop' });
        const sc = v.stage({ x: [0, 12], y: [0, 3.2], axes: false, height: 350, weight: 0.9, title: 'the equations: $b = (n-1) + (b-n+1)$' });
        const NS = { ...NETS, islands: { label: 'two islands', names: ['A', 'B', 'C', 'D', 'E', 'F'], pos: [[0, 1], [0, 0], [1, 0.5], [2.2, 1], [2.2, 0], [3.2, 0.5]], edges: [[0, 1], [1, 2], [2, 0], [3, 4], [4, 5], [5, 3]] } };
        const sel = v.select('network', ['bridge', 'k4', 'k23', 'ladder', 'grid3', 'islands'].map((k) => ({ value: k, label: NS[k].label })), 'bridge');
        let seed = 1;
        const bt = v.button('new random tree', () => { seed++; });
        const lp = v.slider('fundamental loop', 1, 8, 1, { int: true });
        const rng = () => v.rng(seed * 7919);
        let cache = null;
        const analyse = () => {
          const key = `${sel.value}|${seed}`; if (cache && cache.key === key) return cache;
          const net = NS[sel.value], n = net.names.length, E = net.edges.map(([a, b]) => ({ a, b })), b = E.length, r = rng();
          const order = r.shuffle([...Array(b).keys()]), p = [...Array(n).keys()], f = (x) => (p[x] === x ? x : (p[x] = f(p[x])));
          const tree = new Set(); for (const k of order) { const x = f(E[k].a), y = f(E[k].b); if (x !== y) { p[x] = y; tree.add(k); } }
          const comp = components(n, E.map((e) => ({ ...e, g: 1 }))), c = new Set(comp).size;
          // fundamental loop of each chord: tree path between its ends
          const adj = Array.from({ length: n }, () => []); for (const k of tree) { adj[E[k].a].push([E[k].b, k]); adj[E[k].b].push([E[k].a, k]); }
          const path = (s0, t0) => { const prev = new Map([[s0, null]]), q = [s0]; while (q.length) { const u = q.shift(); if (u === t0) break; for (const [w, k] of adj[u]) if (!prev.has(w)) { prev.set(w, [u, k]); q.push(w); } } const out = []; let u = t0; while (prev.get(u)) { const [pu, k] = prev.get(u); out.push([k, pu, u]); u = pu; } return out.reverse(); };
          const A = Array.from({ length: n }, () => new Array(b).fill(0)); E.forEach((e, k) => { A[e.a][k] += 1; A[e.b][k] -= 1; });
          const loops = []; const B = [];
          for (let k = 0; k < b; k++) if (!tree.has(k)) {
            const row = new Array(b).fill(0); row[k] = 1; const pe = path(E[k].b, E[k].a), edgesIn = [k];   // walk from b back to a through the tree, then close along the chord a→b
            for (const [kk, from, to] of pe) { row[kk] = E[kk].a === from && E[kk].b === to ? 1 : -1; edgesIn.push(kk); }
            B.push(row); loops.push({ chord: k, edges: edgesIn });
          }
          const AB = A.length && B.length ? v.M.matMul(A, v.M.transpose(B)) : [[0]];
          cache = { key, net, n, b, c, E, tree, loops, A, B, rA: rank(v, A), rB: B.length ? rank(v, B) : 0, ABmax: Math.max(...AB.flat().map(Math.abs)), pos: geom(net) };
          return cache;
        };
        v.render(() => {
          const D = analyse(), { net, n, b, E, tree, loops, pos } = D;
          lp.el.hidden = loops.length < 2; const li = clamp(lp.value, 1, Math.max(1, loops.length)) - 1, L = loops[li];
          const inL = new Set(L ? L.edges : []);
          E.forEach((e, k) => {
            const P = pos[e.a], Q = pos[e.b], isT = tree.has(k);
            if (inL.has(k)) s.line(P[0], P[1], Q[0], Q[1], { color: 'red', width: 9, alpha: 0.25 });
            s.line(P[0], P[1], Q[0], Q[1], { color: isT ? 'green' : inL.has(k) ? 'red' : 'muted', width: isT ? 4.5 : 2, dash: !isT });
            s.text(`${k + 1}`, (P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2, { size: 11.5, color: inL.has(k) ? 'red' : 'ink', plate: true });
          });
          pos.forEach((p, i) => s.dot(p[0], p[1], { r: 11, color: 'accent', label: net.names[i], labelPos: 'ne' }));
          // equation counts as boxes
          const nk = D.rA, nv = D.rB;
          for (let k = 0; k < b; k++) sc.rect(0.25 + (k * 11.5) / b, 1.45, 0.25 + ((k + 0.9) * 11.5) / b, 2.05, { fill: k < nk ? 'green' : 'orange', fillAlpha: 0.4, color: k < nk ? 'green' : 'orange', width: 1.5 });
          sc.text(`${nk} independent KCL equations (rank of $\\mathbf A$)`, 0.25, 3.0, { size: 12.5, color: 'green', align: 'left' });
          sc.text(`${nv} independent KVL equations (rank of $\\mathbf B$)`, 0.25, 1.05, { size: 12.5, color: 'orange', align: 'left' });
          const term = (row, sym) => row.map((c, k) => (c ? `${c > 0 ? '+' : '-'}${sym}_{${k + 1}}` : '')).filter(Boolean).join(' ').replace(/^\+/, '');
          sc.text(`e.g. node ${net.names[0]}:  $${term(D.A[0], 'i')} = 0$`, 0.25, 2.6, { size: 12.5, color: 'ink', align: 'left' });
          if (D.B.length) sc.text(`e.g. loop ${li + 1}:  $${term(D.B[li], 'v')} = 0$`, 0.25, 0.65, { size: 12.5, color: 'ink', align: 'left' });
          sc.text(`${b} branches = ${nk} + ${nv}`, 0.25, 0.2, { size: 12.5, color: 'ink', align: 'left' });
          sc.text(`n − c = ${n} − ${D.c} = ${n - D.c}`, 11.8, 0.2, { size: 11, color: 'muted', align: 'right' });
        });
        v.legend([['green', 'tree branch'], ['muted', 'chord (dashed)'], ['red', 'fundamental loop of the chosen chord']]);
        v.readout(() => {
          const D = analyse();
          const conn = D.c === 1;
          return `$n = ${D.n}$ nodes, $b = ${D.b}$ branches, $c = ${D.c}$ component${D.c > 1 ? 's' : ''}. $\\operatorname{rank}\\mathbf A = ${D.rA}$ ${conn ? `$= n-1$` : `$= n-c = ${D.n - D.c}$`}; $\\operatorname{rank}\\mathbf B = ${D.rB}$ ${conn ? `$= b-n+1$` : `$= b-n+c = ${D.b - D.n + D.c}$`}; $${D.rA} + ${D.rB} = ${D.rA + D.rB} = b$.\n$\\max|\\mathbf A\\mathbf B^{\\top}| = ${D.ABmax}$ (KCL and KVL equations never overlap)${conn ? '' : ' — with the graph in pieces the counts are $n-c$ and $b-n+c$, not $n-1$ and $b-n+1$.'}`;
        });
        void bt;
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 2.8
    {
      num: '2.8',
      kind: 'Definition',
      name: 'Conductance matrix as a weighted graph Laplacian',
      statement: String.raw`For a resistor network with $n$ nodes, let $g_{jk} = 1/R_{jk}$ be the conductance of the branch between nodes $j$ and $k$ (zero if there is none; parallel resistors add). The **conductance matrix** (weighted graph Laplacian) is the symmetric $n\times n$ matrix $\mathbf L$ with $L_{jk} = -g_{jk}$ for $j\ne k$ and $L_{jj} = \sum_{k} g_{jk}$, the total conductance at node $j$. Equivalently $\mathbf L = \mathbf A\,\mathrm{diag}(g)\,\mathbf A^{\!\top}$ with $\mathbf A$ the incidence matrix. Every row sums to zero, and for node voltages $\mathbf v$ the vector $\mathbf L\mathbf v$ lists the net current leaving each node through the resistors. Deleting the row and column of the ground node gives the matrix $\mathbf G$ of node-voltage analysis (2.5).`,
      idea: String.raw`Ohm's law (1.4) gives the current $g_{jk}(v_j - v_k)$ from $j$ to $k$ through each branch, and summing these over the neighbours of $j$ is exactly KCL (2.1) written out: $\sum_k g_{jk}(v_j - v_k) = (\mathbf L\mathbf v)_j$. A constant vector of node voltages produces no currents, so $\mathbf L\mathbf 1 = \mathbf 0$ and every row sums to zero. The quadratic form $\mathbf v^{\!\top}\mathbf L\mathbf v = \sum_{\text{branches}} g\,(v_j - v_k)^2$ is the total power dissipated. The product-of-maps theorem (ladr 3.43) explains the assembly formula. With fixed oriented branch coordinates, $A^\top$ maps node potentials to branch voltage drops, $D=\operatorname{diag}(g)$ maps those drops to currents, and $A$ sums currents at nodes. Their composite therefore has matrix $ADA^\top$. The intermediate branch bases must agree; changing an edge orientation changes the corresponding incidence column and branch coordinates together, leaving this node-space operator unchanged.`,
      caption: String.raw`Click a branch to select it and change its conductance: the matrix on the right is rebuilt (diagonal entries blue = total conductance at that node, off-diagonals orange = $-g$), and the last column shows that every row sums to zero. The matrix assembled by the rule agrees with $\mathbf A\,\mathrm{diag}(g)\,\mathbf A^{\!\top}$ computed separately. Switch on "ground node A" to delete its row and column: what remains is the matrix $\mathbf G$ that node-voltage analysis solves.`,
      deps: ['circ-2.5', 'ladr-3.43'],
      refs: ['Agarwal–Lang §3.3'],
      tags: ['laplacian', 'matrix'],
      viz(v) {
        const s = v.stage({ x: [-0.72, 0.72], y: [-0.62, 0.62], equal: true, axes: false, height: 380, weight: 0.9, title: 'click a branch to select it' });
        const st = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 380, weight: 1.2, title: 'the matrix $\\mathbf L$ (mS)' });
        const sel = v.select('network', ['bridge', 'k4', 'ladder', 'grid3'].map((k) => ({ value: k, label: NETS[k].label })), 'bridge');
        const gs = {}; for (const k of ['bridge', 'k4', 'ladder', 'grid3']) gs[k] = NETS[k].edges.map((_, i) => 1 + 0.5 * (i % 3));
        let selE = 0, lastNet = null;
        const slG = v.slider('conductance of the selected branch', 0.1, 6, 1.5, { step: 0.1, fmt: (x) => `${v.fix(x, 1)} mS`, onChange: (x) => { gs[sel.value][selE] = x; } });
        const grd = v.toggle('ground node A (delete its row and column)', false);
        const pos = () => geom(NETS[sel.value]);
        s.onClick((x, y) => {
          const P = pos(), E = NETS[sel.value].edges; let best = -1, bd = 0.06;
          E.forEach(([a, b], k) => { const d = segDist(x, y, P[a], P[b]); if (d < bd) { bd = d; best = k; } });
          if (best >= 0) { selE = best; slG.set(gs[sel.value][best]); }
        });
        const T = v.table(st, { rows: 4, cols: 5, square: false, cellAspect: 1.2, maxCell: 54, size: 13 });
        let info = null;
        v.render(() => {
          const net = NETS[sel.value], n = net.names.length, P = pos(), g = gs[sel.value];
          if (lastNet !== sel.value) { lastNet = sel.value; selE = 0; slG.set(g[0]); }
          const E = net.edges.map(([a, b], k) => ({ a, b, g: g[k] })), L = laplacian(n, E);
          const A = Array.from({ length: n }, () => new Array(E.length).fill(0)); E.forEach((e, k) => { A[e.a][k] = 1; A[e.b][k] = -1; });
          const L2 = v.M.matMul(A.map((r) => r.map((x, k) => x * g[k])), v.M.transpose(A));
          let diff = 0, rowMax = 0; for (let i = 0; i < n; i++) { let rs = 0; for (let j = 0; j < n; j++) { diff = Math.max(diff, Math.abs(L[i][j] - L2[i][j])); rs += L[i][j]; } rowMax = Math.max(rowMax, Math.abs(rs)); }
          const gmax = Math.max(...g);
          E.forEach((e, k) => {
            const p = P[e.a], q = P[e.b];
            if (k === selE) s.line(p[0], p[1], q[0], q[1], { color: 'gold', width: 11, alpha: 0.4 });
            zig(s, p, q, { color: k === selE ? 'gold' : 'ink', width: 1.6 + 3 * g[k] / gmax, amp: 0.03 });
            const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2, nx = -(q[1] - p[1]), ny = q[0] - p[0], nl = Math.hypot(nx, ny) || 1;
            s.text(`${v.fix(g[k], 1)}`, mx + (nx / nl) * 0.06, my + (ny / nl) * 0.06, { size: 11.5, color: 'ink', plate: true });
          });
          P.forEach((p, i) => s.dot(p[0], p[1], { r: 11, color: i === 0 && grd.value ? 'muted' : 'accent', label: net.names[i], labelPos: 'ne' }));
          T.set({ rows: n, cols: n + 1 });
          T.draw({
            value: (i, j) => (j === n ? L[i].reduce((a, b) => a + b, 0) : L[i][j]),
            format: (x) => (Math.abs(x) < 1e-12 ? '0' : v.fix(x, 1)),
            rowLabels: net.names, colLabels: [...net.names, '$\\Sigma$'], size: n > 6 ? 11 : 13,
            fill: (i, j) => (grd.value && (i === 0 || j === 0) && j < n ? ['grid', 0.5] : j === n ? ['green', 0.25] : i === j ? ['accent', 0.3] : L[i][j] < 0 ? ['orange', 0.25] : null),
            textColor: (i, j) => (grd.value && (i === 0 || j === 0) && j < n ? 'faint' : 'ink'),
          });
          if (grd.value) T.box(1, 1, n - 1, n - 1, { color: 'green', width: 3 });
          info = { diff, rowMax, n, b: E.length, tr: L.reduce((a, r, i) => a + r[i], 0), gsum: g.reduce((a, b) => a + b, 0) };
        });
        v.readout(() => {
          if (!info) return '';
          const { diff, rowMax, tr, gsum } = info;
          return `Largest row sum: $${v.sci(rowMax + 1e-20, 1)}$ (zero: $\\mathbf L\\mathbf 1 = \\mathbf 0$). $\\max|\\mathbf L - \\mathbf A\\,\\mathrm{diag}(g)\\mathbf A^{\\top}| = ${v.sci(diff + 1e-20, 1)}$. Trace $= ${v.fix(tr, 2)} = 2\\sum g = ${v.fix(2 * gsum, 2)}$ mS (each branch is counted at both of its ends).`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 2.9
    {
      num: '2.9',
      kind: 'Theorem',
      name: 'Resistor networks have a unique solution',
      statement: String.raw`Let a connected network of positive resistances have one node grounded. Then the reduced conductance matrix $\mathbf G$ (the Laplacian $\mathbf L$ with the ground row and column deleted) is symmetric positive definite, so for any injected currents the node-voltage equations $\mathbf G\mathbf v = \mathbf i$ have exactly one solution; every branch voltage and current is then determined. Without a connected path from every node to ground the matrix is singular: voltages of a floating sub-network are fixed only up to a common constant (and the equations are inconsistent if net current is pushed into it).`,
      idea: String.raw`For any node potentials $\mathbf v$, the quadratic form $\mathbf v^{\!\top}\mathbf L\mathbf v = \sum g_{jk}(v_j - v_k)^2$ is a sum of nonnegative terms (2.8), and it vanishes only when $v_j = v_k$ across every branch, i.e. when $\mathbf v$ is constant on each connected component. Fixing the ground node at $0$ forces that constant to be $0$ on its component; if the network is connected, the only vector with zero power is $\mathbf v = 0$, so $\mathbf G$ is positive definite and invertible. Physically: a passive network that is not driven dissipates nothing only if nothing moves. If $Gx=0$, then $x^\top Gx=0$; connectedness, positive conductances and a fixed ground force $x=0$. Thus the square finite-dimensional map $G$ is injective, and ladr 3.65 makes it surjective and invertible, giving existence as well as uniqueness for every injected-current vector. The positive-operator characterization (ladr 7.38) also explains the spectrum shown: symmetry gives real eigenvectors, and $Gx=\lambda x$ gives $\lambda\|x\|^2=x^\top Gx>0$ for $x\ne0$. Hence every eigenvalue is strictly positive under the stated hypotheses; floating or active networks need not satisfy them.`,
      caption: String.raw`Click a node to ground it; shift-click a node to inject 1 A there. The bars are the eigenvalues of the reduced matrix $\mathbf G$ (all strictly positive: green) and the colours on the nodes are the unique solution. Click a branch to select it and use the slider or the "cut" button: cut a bridge of the network so that a piece floats and an eigenvalue drops to 0 (the solution is no longer unique); or push one conductance negative (an active element) and watch the smallest eigenvalue cross zero.`,
      scope: String.raw`Positive resistances (a passive network) and a ground connected to every node through the network. Negative resistances, i.e. active elements, can make $\mathbf G$ singular or indefinite.`,
      deps: ['circ-2.8', 'ladr-3.65', 'ladr-7.38'],
      refs: ['Agarwal–Lang §3.3'],
      tags: ['uniqueness', 'positive definite'],
      viz(v) {
        const s = v.stage({ x: [-0.78, 0.78], y: [-0.68, 0.68], equal: true, axes: false, height: 370, weight: 1, title: 'ground (click) and source (shift-click); node values in volts' });
        const se = v.stage({ x: [0, 9], y: [-1, 5], axes: 'box', gutter: true, height: 350, weight: 0.9, xlabel: 'eigenvalue index', ylabel: 'eigenvalue of $\\mathbf G$ (mS)', title: 'spectrum of the reduced matrix' });
        const sel = v.select('network', ['bridge', 'ladder', 'grid3', 'k4'].map((k) => ({ value: k, label: NETS[k].label })), 'grid3');
        const gs = {}; for (const k of ['bridge', 'ladder', 'grid3', 'k4']) gs[k] = NETS[k].edges.map((_, i) => 1 + 0.5 * ((i * 7) % 4));
        const cut = {}; for (const k in gs) cut[k] = new Set();
        let seed = 40, selE = 0, ground = 0, src = 1, lastNet = null;
        const slG = v.slider('conductance of the selected branch', -3, 5, 1, { step: 0.05, fmt: (x) => `${v.fix(x, 2)} mS`, onChange: (x) => { gs[sel.value][selE] = x; } });
        const cb = v.button('cut / restore the selected branch', () => { const c = cut[sel.value]; if (c.has(selE)) c.delete(selE); else c.add(selE); });
        const rr = v.button('re-roll conductances', () => { const r = v.rng(++seed); gs[sel.value] = gs[sel.value].map(() => +(0.3 + 4 * r()).toFixed(1)); slG.set(gs[sel.value][selE]); });
        s.onClick((x, y, mod) => {
          const P = geom(NETS[sel.value]), E = NETS[sel.value].edges; let nd = -1, nb = 0.05;
          P.forEach((p, i) => { const d = Math.hypot(x - p[0], y - p[1]); if (d < nb) { nb = d; nd = i; } });
          if (nd >= 0) { if (mod && mod.shift) src = nd; else ground = nd; return; }
          let best = -1, bd = 0.06; E.forEach(([a, b], k) => { const d = segDist(x, y, P[a], P[b]); if (d < bd) { bd = d; best = k; } });
          if (best >= 0) { selE = best; slG.set(gs[sel.value][best]); }
        });
        let info = null;
        v.render(() => {
          const net = NETS[sel.value], n = net.names.length, P = geom(net), g = gs[sel.value], cs = cut[sel.value];
          if (lastNet !== sel.value) { lastNet = sel.value; selE = 0; ground = 0; src = 1; slG.set(g[0]); }
          const E = net.edges.map(([a, b], k) => ({ a, b, g: cs.has(k) ? 0 : g[k], k })).filter((e) => e.g !== 0 || true);
          const Lm = laplacian(n, E.map((e) => ({ a: e.a, b: e.b, g: e.g }))), G = reduce(Lm, ground), m = G.length;
          const ev = v.M.eigSym(G).values.slice().sort((a, b) => a - b);
          const lmin = ev[0], lmax = ev[m - 1], tol = 1e-9 * Math.max(1, Math.abs(lmax));
          const alive = E.filter((e) => e.g !== 0), comp = components(n, alive.map((e) => ({ a: e.a, b: e.b, g: 1 })));
          const floating = []; for (let i = 0; i < n; i++) if (comp[i] !== comp[ground]) floating.push(i);
          const inj = new Array(n).fill(0); const sNode = src === ground ? (ground + 1) % n : src; inj[sNode] = 1; inj[ground] = -1;
          const sing = Math.abs(lmin) <= tol, phi = !sing ? solveNet(n, E.map((e) => ({ a: e.a, b: e.b, g: e.g })), inj, ground) : null;
          const vmax = phi ? Math.max(1e-9, ...phi.map(Math.abs)) : 1;
          E.forEach((e) => {
            const p = P[e.a], q = P[e.b], isSel = e.k === selE;
            if (isSel) s.line(p[0], p[1], q[0], q[1], { color: 'gold', width: 11, alpha: 0.4 });
            if (e.g === 0) s.line(p[0], p[1], q[0], q[1], { color: 'faint', width: 1.5, dash: true });
            else zig(s, p, q, { color: e.g < 0 ? 'red' : 'ink', width: 2.2, amp: 0.03 });
            const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2, nx = -(q[1] - p[1]), ny = q[0] - p[0], nl = Math.hypot(nx, ny) || 1;
            s.text(e.g === 0 ? 'cut' : `${v.fix(e.g, 1)}`, mx + (nx / nl) * 0.06, my + (ny / nl) * 0.06, { size: 11, color: e.g < 0 ? 'red' : 'muted', plate: true });
          });
          s.dot(P[sNode][0], P[sNode][1], { r: 22, color: 'gold', hollow: true });
          P.forEach((p, i) => {
            const fl = floating.includes(i);
            const col = i === ground ? 'ink' : phi ? v.ramp(Math.max(0, Math.min(1, phi[i] / vmax)), 'orange') : fl ? 'faint' : 'muted';
            s.dot(p[0], p[1], { r: 17, color: col, label: net.names[i], labelPos: 'nw' });
            s.text(i === ground ? 'gnd' : phi ? v.fix(phi[i], 2) : '?', p[0], p[1], { size: 11, color: i === ground ? 'panel' : 'ink' });
          });
          se.setView([0, Math.max(m, 4) + 1], [Math.min(-0.5, lmin * 1.3 - 0.2), Math.max(2, lmax * 1.12)]);
          ev.forEach((x, k) => { const bad = x <= tol; se.rect(k + 0.65, 0, k + 1.35, x, { fill: bad ? 'red' : 'green', fillAlpha: 0.4, color: bad ? 'red' : 'green', width: 1.5 }); });
          se.hline(0, { color: 'ink', width: 1.5 });
          info = { lmin, tol, sing, floating, phi, m, neg: ev.filter((x) => x < -tol).length, names: net.names, sNode, ground };
        });
        v.legend([['green', 'eigenvalue $>0$'], ['red', 'eigenvalue $\\le 0$']]);
        v.readout(() => {
          if (!info) return '';
          const { lmin, sing, floating, phi, neg, names, sNode, ground } = info;
          if (phi && lmin > 0) return `Smallest eigenvalue $\\lambda_{\\min} = ${v.fix(lmin, 4)}$ mS $>0$: $\\mathbf G$ is positive definite, so 1 A pushed in at ${names[sNode]} and out at ${names[ground]} has exactly one solution (colours; ${names[sNode]} sits at ${v.fix(phi[sNode], 3)} V).`;
          if (sing) return `$\\lambda_{\\min} = 0$ — $\\mathbf G$ is singular${floating.length ? `: ${floating.map((i) => names[i]).join(', ')} ${floating.length > 1 ? 'are' : 'is'} cut off from ground and floating` : ' (a conductance has reached the critical negative value)'}. Adding any constant to the floating voltages gives another solution, or none: no unique answer.`;
          return `$\\lambda_{\\min} = ${v.fix(lmin, 4)}$ mS $<0$ (${neg} negative eigenvalue${neg > 1 ? 's' : ''}): with a negative conductance the matrix is no longer positive definite. A solution still exists here but it can fail to be unique as the slider moves to the critical value.`;
        });
        void cb; void rr;
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 2.10
    {
      num: '2.10',
      kind: 'Method',
      name: 'Delta–wye transformation',
      statement: String.raw`Three resistors $R_{12}, R_{23}, R_{31}$ joined in a triangle (**delta**) between terminals 1, 2, 3 are indistinguishable from outside from three resistors $R_1, R_2, R_3$ joined at a common internal node (**wye**, or star) with $R_1 = \dfrac{R_{12}R_{31}}{R_{12}+R_{23}+R_{31}}$, $R_2 = \dfrac{R_{12}R_{23}}{R_{12}+R_{23}+R_{31}}$, $R_3 = \dfrac{R_{23}R_{31}}{R_{12}+R_{23}+R_{31}}$; conversely $R_{12} = \dfrac{R_1R_2+R_2R_3+R_3R_1}{R_3}$ and cyclically. "Indistinguishable" means that the two networks have the same resistance between each pair of terminals (and hence behave identically inside any larger circuit).`,
      idea: String.raw`A three-terminal resistor network is determined by its $3\times3$ conductance matrix (2.8), and a matrix of this kind has only three free numbers. Hence it is enough to match three measurements: the resistance between terminals 1–2 with 3 open, and the same for 2–3 and 3–1. In the delta, $R_{12}\parallel(R_{23}+R_{31})$; in the wye, $R_1 + R_2$. Setting the three pairs equal (series 2.3 and parallel 2.4) gives three linear equations in $R_1, R_2, R_3$, solved by the formulas above. The transformation turns bridge circuits into series–parallel ones.`,
      caption: String.raw`Edit one set of resistors; the other is computed by the transformation formulas. The slider cross-fades the delta (triangle) into the wye (star). On the right, the resistance between every pair of terminals is measured on both networks by solving each one as a circuit (not by the formulas): the paired bars are always equal, however you choose the three resistors.`,
      scope: String.raw`Linear resistive three-terminal networks with all resistances positive. (The same holds for impedances and, with care, networks with negative resistances.)`,
      deps: ['circ-2.3', 'circ-2.4'],
      refs: ['Agarwal–Lang ch. 2'],
      credit: 'A. E. Kennelly, 1899',
      tags: ['delta-wye', 'equivalence'],
      viz(v) {
        const s = v.stage({ x: [-1.45, 1.45], y: [-0.95, 1.3], equal: true, axes: false, height: 360, weight: 1.05, title: 'Δ ⇄ Y' });
        const sb = v.stage({ x: [0, 3.6], y: [0, 1], axes: 'box', gutter: true, height: 360, weight: 0.95, xlabel: 'terminal pair', ylabel: 'measured resistance (Ω)', xticks: [[0.6, '1 – 2'], [1.8, '2 – 3'], [3.0, '3 – 1']] });
        const mode = v.select('edit', [{ value: 'dy', label: 'edit Δ' }, { value: 'yd', label: 'edit Y' }], 'dy');
        const t = v.slider('Δ → Y', 0, 1, 0.5, { step: 0.01, fmt: (x) => `${Math.round(100 * x)} %` });
        const lg = { log: true, sig: 2, fmt: (x) => sI(x, 'Ω', 2) };
        const D = [v.slider('$R_{12}$', 10, 1000, 300, lg), v.slider('$R_{23}$', 10, 1000, 150, lg), v.slider('$R_{31}$', 10, 1000, 100, lg)];
        const W = [v.slider('$R_1$', 10, 1000, 60, lg), v.slider('$R_2$', 10, 1000, 100, lg), v.slider('$R_3$', 10, 1000, 200, lg)];
        const P = [[0, 1.05], [-1.0, -0.6], [1.0, -0.6]], O = [0, 0];
        let info = null;
        v.render(() => {
          const dy = mode.value === 'dy'; D.forEach((x) => { x.el.hidden = !dy; }); W.forEach((x) => { x.el.hidden = dy; });
          let d, w;
          if (dy) { d = D.map((x) => x.value); const S = d[0] + d[1] + d[2]; w = [d[0] * d[2] / S, d[0] * d[1] / S, d[1] * d[2] / S]; }
          else { w = W.map((x) => x.value); const Q = w[0] * w[1] + w[1] * w[2] + w[2] * w[0]; d = [Q / w[2], Q / w[0], Q / w[1]]; }
          const aD = 1 - 0.85 * t.value, aY = 0.15 + 0.85 * t.value;
          const pairs = [[0, 1], [1, 2], [2, 0]];
          pairs.forEach(([a, b], k) => {
            zig(s, P[a], P[b], { color: 'accent', width: 3, alpha: aD, amp: 0.05 });
            const mx = (P[a][0] + P[b][0]) / 2, my = (P[a][1] + P[b][1]) / 2, ox = mx * 0.18, oy = (my - 0.0) * 0.18;
            s.text(sI(d[k], 'Ω', 3), mx + ox + (k === 0 ? 0 : 0), my + oy + (k === 1 ? -0.1 : 0.0), { size: 12, color: 'accent', plate: true, alpha: aD });
          });
          [0, 1, 2].forEach((k) => {
            zig(s, P[k], O, { color: 'orange', width: 3, alpha: aY, amp: 0.05 });
            const mx = P[k][0] * 0.55, my = P[k][1] * 0.55;
            s.text(`${sI(w[k], 'Ω', 3)}`, mx + (k === 0 ? 0.25 : k === 1 ? -0.12 : 0.12), my + (k === 0 ? 0 : -0.12), { size: 12, color: 'orange', plate: true, alpha: aY });
          });
          s.dot(O[0], O[1], { r: 6, color: 'orange', alpha: aY });
          P.forEach((p, i) => s.dot(p[0], p[1], { r: 10, color: 'ink', label: `${i + 1}`, labelPos: i === 0 ? 'n' : i === 1 ? 'sw' : 'se' }));
          // measured pair resistances, by solving each network as a circuit
          const Ed = [{ a: 0, b: 1, g: 1 / d[0] }, { a: 1, b: 2, g: 1 / d[1] }, { a: 2, b: 0, g: 1 / d[2] }];
          const Ew = [{ a: 0, b: 3, g: 1 / w[0] }, { a: 1, b: 3, g: 1 / w[1] }, { a: 2, b: 3, g: 1 / w[2] }];
          const md = pairs.map(([a, b]) => reffNet(3, Ed, a, b)), mw = pairs.map(([a, b]) => reffNet(4, Ew, a, b));
          const top = Math.max(...md, ...mw) * 1.25;
          sb.setView([0, 3.6], [0, top]);
          pairs.forEach((_, k) => {
            sb.rect(0.15 + 1.2 * k, 0, 0.58 + 1.2 * k, md[k], { fill: 'accent', fillAlpha: 0.4, color: 'accent', width: 1.5 });
            sb.rect(0.62 + 1.2 * k, 0, 1.05 + 1.2 * k, mw[k], { fill: 'orange', fillAlpha: 0.4, color: 'orange', width: 1.5 });
            sb.text(v.fix(md[k], 1), 0.365 + 1.2 * k, md[k], { size: 11.5, color: 'accent', baseline: 'bottom', dy: -3 });
            sb.text(v.fix(mw[k], 1), 0.835 + 1.2 * k, mw[k], { size: 11.5, color: 'orange', baseline: 'bottom', dy: -3 });
          });
          info = { d, w, md, mw };
        });
        v.legend([['accent', 'Δ network'], ['orange', 'Y network']]);
        v.readout(() => {
          if (!info) return '';
          const { d, w, md, mw } = info; let err = 0; md.forEach((x, k) => { err = Math.max(err, Math.abs(x - mw[k])); });
          return `Δ: $R_{12}, R_{23}, R_{31} = ${d.map((x) => v.fix(x, 1)).join(',\\ ')}\\ \\Omega$ · Y: $R_1, R_2, R_3 = ${w.map((x) => v.fix(x, 1)).join(',\\ ')}\\ \\Omega$.\nMeasured pair resistances Δ: $${md.map((x) => v.fix(x, 3)).join(',\\ ')}$ · Y: $${mw.map((x) => v.fix(x, 3)).join(',\\ ')}$ Ω — largest difference $${v.sci(err + 1e-18, 1)}\\ \\Omega$.`;
        });
        function reffNet(n, E, a, b) { const inj = new Array(n).fill(0); inj[a] = 1; inj[b] = -1; const phi = solveNet(n, E, inj, b); return phi[a] - phi[b]; }
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 2.11
    {
      num: '2.11',
      kind: 'Model',
      name: 'Wheatstone bridge',
      statement: String.raw`A Wheatstone bridge is two voltage dividers $R_1$–$R_3$ and $R_2$–$R_4$ fed by one source, with a detector (a galvanometer, resistance $R_g$) joining their midpoints. The detector current is $I_g = \dfrac{V_{\text{th}}}{R_{\text{th}} + R_g}$ with $V_{\text{th}} = V\left(\dfrac{R_3}{R_1+R_3} - \dfrac{R_4}{R_2+R_4}\right)$ and $R_{\text{th}} = R_1\parallel R_3 + R_2\parallel R_4$. The bridge is **balanced** ($I_g = 0$, whatever $R_g$ and $V$) exactly when $R_1R_4 = R_2R_3$. If three resistors are known, the fourth is found by adjusting one until the detector reads zero; near balance, $I_g$ is linear in the small change of the unknown.`,
      idea: String.raw`The voltage of each midpoint is a voltage divider (2.3). The two midpoints are at the same potential exactly when the two divider ratios agree: $R_3/(R_1+R_3) = R_4/(R_2+R_4)$, which simplifies to $R_1R_4 = R_2R_3$. With equal potentials no current flows through the detector, so it can be removed or replaced by anything without changing the rest, and the bridge reduces to two series chains in parallel. A null measurement is insensitive to the detector's calibration and to the supply voltage: only the ratio of resistors enters.`,
      caption: String.raw`Turn $R_4$ (or any other arm): the galvanometer needle and the plotted current $I_g$ move through zero at balance, which the checker below marks by its product test $R_1R_4$ vs $R_2R_3$. The left plot covers many decades of $R_4$ (the curve saturates at the open-circuit extremes); the right plot zooms in 10 % around balance, where $I_g$ is a straight line, the sensitivity (µA per Ω). Dots are the circuit simulator's $I_g$, lines the closed formula.`,
      credit: 'S. H. Christie, 1833; popularised by C. Wheatstone, 1843',
      scope: String.raw`Linear resistors and an ideal DC source. Balance does not depend on $R_g$, but sensitivity does.`,
      deps: ['circ-2.3'],
      refs: ['Horowitz–Hill ch. 1'],
      tags: ['bridge', 'measurement'],
      viz(v) {
        const s = v.stage({ x: [-0.9, 5.9], y: [-0.7, 3.9], equal: true, axes: false, height: 320, weight: 1.4, minWidth: 700, title: 'the bridge; $R_5$ is the galvanometer' });
        const sd = v.stage({ x: [-1.3, 1.3], y: [-0.15, 1.2], equal: true, axes: false, height: 320, weight: 0.8, minWidth: 700, title: 'galvanometer (full scale ±100 µA)' });
        const sp = v.stage({ x: [100, 1e5], y: [-1, 1], xlog: true, axes: 'box', gutter: true, height: 300, weight: 1, minWidth: 700, xlabel: '$R_4$ (Ω)', ylabel: '$I_g$ (mA)', title: 'wide range' });
        const sz = v.stage({ x: [3600, 4400], y: [-0.1, 0.1], axes: 'box', gutter: true, height: 300, weight: 1, minWidth: 700, xlabel: '$R_4$ (Ω), ±10 % around balance', ylabel: '$I_g$ (µA)', title: 'near balance' });
        const vals = { V1: 10, R1: 1000, R2: 2000, R3: 2000, R4: 3700, R5: 1000 };
        const C = v.circuit(s, bridgeParts(vals));
        const lg = { log: true, sig: 3, fmt: (x) => sI(x, 'Ω', 3) };
        const R4 = v.slider('$R_4$', 100, 1e5, 3700, lg), R1 = v.slider('$R_1$', 100, 1e4, 1000, lg), R2 = v.slider('$R_2$', 100, 1e4, 2000, lg), R3 = v.slider('$R_3$', 100, 1e4, 2000, lg);
        const Rg = v.slider('$R_g$ (meter)', 50, 1e5, 1000, lg);
        const Ig = (r1, r2, r3, r4, rg, V = 10) => { const vth = V * (r3 / (r1 + r3) - r4 / (r2 + r4)), rth = r1 * r3 / (r1 + r3) + r2 * r4 / (r2 + r4); return vth / (rth + rg); };
        let info = null;
        v.render(() => {
          for (const [k, sl] of [['R1', R1], ['R2', R2], ['R3', R3], ['R4', R4], ['R5', Rg]]) C.part(k).value = sl.value;
          const res = C.dc(); C.draw({ result: res, vmax: 10 });
          const r1 = R1.value, r2 = R2.value, r3 = R3.value, r4 = R4.value, rg = Rg.value, ig = res.I('R5'), bal = r2 * r3 / r1;
          // dial
          const sc = 100e-6, th = (x) => Math.PI / 2 - clamp(x / sc, -1, 1) * 1.0;
          sd.curve((u) => [1.05 * Math.cos(Math.PI / 2 - 1.0 + 2 * u), 1.05 * Math.sin(Math.PI / 2 - 1.0 + 2 * u) * 1 - 0.0], 0, 1, { color: 'muted', width: 2, n: 50 });
          for (let k = -4; k <= 4; k++) { const a = Math.PI / 2 - (k / 4) * 1.0; sd.line(0.93 * Math.cos(a), 0.93 * Math.sin(a), 1.05 * Math.cos(a), 1.05 * Math.sin(a), { color: k === 0 ? 'green' : 'muted', width: k === 0 ? 3 : 1.5 }); if (k % 2 === 0) sd.text(`${25 * k}`, 0.8 * Math.cos(a), 0.8 * Math.sin(a), { size: 11, color: 'muted' }); }
          const a = th(ig), sat = Math.abs(ig) >= sc;
          sd.line(0, 0, 0.98 * Math.cos(a), 0.98 * Math.sin(a), { color: sat ? 'red' : 'ink', width: 3 }); sd.dot(0, 0, { r: 6, color: 'ink' });
          sd.text(`${v.fix(ig * 1e6, 1)} µA`, 0, 0.3, { size: 14, color: Math.abs(ig) < 1e-9 ? 'green' : 'ink', plate: true });
          if (sat) sd.text('off scale', 0, 0.55, { size: 12, color: 'red' });
          // plots
          const ymax = Math.max(0.02, Math.abs(Ig(r1, r2, r3, Math.max(100, bal / 8), rg)), Math.abs(Ig(r1, r2, r3, Math.min(1e5, bal * 8), rg))) * 1e3 * 1.15;
          sp.setView([100, 1e5], [-ymax, ymax]);
          sp.hline(0, { color: 'muted', width: 1.2 });
          sp.fn((x) => Ig(r1, r2, r3, x, rg) * 1e3, { color: 'accent', width: 2.6, n: 220 });
          sp.vline(bal, { color: 'green', width: 1.5, dash: true });
          sp.dot(r4, ig * 1e3, { r: 6, color: 'gold' });
          const x0 = bal * 0.9, x1 = bal * 1.1, h = 1e-9, slope = (Ig(r1, r2, r3, bal * (1 + h), rg) - Ig(r1, r2, r3, bal * (1 - h), rg)) / (2 * h * bal);
          const ym = Math.max(5, Math.abs(Ig(r1, r2, r3, x0, rg)) * 1e6, Math.abs(Ig(r1, r2, r3, x1, rg)) * 1e6) * 1.15;
          sz.setView([x0, x1], [-ym, ym]);
          sz.hline(0, { color: 'muted', width: 1.2 }); sz.vline(bal, { color: 'green', width: 1.5, dash: true });
          sz.fn((x) => Ig(r1, r2, r3, x, rg) * 1e6, { color: 'accent', width: 2.6, n: 60 });
          if (r4 >= x0 && r4 <= x1) sz.dot(r4, ig * 1e6, { r: 6, color: 'gold' });
          else sz.text('$R_4$ is outside this window', (x0 + x1) / 2, -ym * 0.8, { size: 12, color: 'muted' });
          info = { ig, closed: Ig(r1, r2, r3, r4, rg), bal, p14: r1 * r4, p23: r2 * r3, slope, r4 };
        });
        v.legend([['accent', '$I_g$ from the closed formula'], ['gold', 'simulator at the chosen $R_4$', { dot: true }], ['green', 'balance $R_4 = R_2R_3/R_1$', { dash: true }]]);
        v.readout(() => {
          if (!info) return '';
          const { ig, closed, bal, p14, p23, slope, r4 } = info;
          return `$R_1R_4 = ${v.sci(p14, 4)}\\ \\Omega^2$ vs $R_2R_3 = ${v.sci(p23, 4)}\\ \\Omega^2$ · balance at $R_4 = R_2R_3/R_1 =$ ${sI(bal, 'Ω', 4)}; now $R_4 =$ ${sI(r4, 'Ω', 4)}.\n$I_g = ${v.fix(ig * 1e6, 3)}$ µA (simulator) vs ${v.fix(closed * 1e6, 3)} µA (formula). Sensitivity at balance: $\\mathrm dI_g/\\mathrm dR_4 = ${v.fix(slope * 1e6, 4)}$ µA/Ω.`;
        });
      },
    },
  ],
};
