// Rudin, Real and Complex Analysis — Chapter 6: Complex Measures
const TAU = 2 * Math.PI;
const SUB = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];

/** Running integrals of a complex density g(x) = [re, im] on [0,1] (trapezoid rule on N cells). */
function cumulative(g, N = 3000) {
  const R = new Float64Array(N + 1), I = new Float64Array(N + 1), A = new Float64Array(N + 1);
  let p = g(0);
  for (let k = 1; k <= N; k++) {
    const q = g(k / N);
    R[k] = R[k - 1] + (p[0] + q[0]) / (2 * N);
    I[k] = I[k - 1] + (p[1] + q[1]) / (2 * N);
    A[k] = A[k - 1] + (Math.hypot(p[0], p[1]) + Math.hypot(q[0], q[1])) / (2 * N);
    p = q;
  }
  const at = (T, t) => { const u = Math.min(Math.max(t, 0), 1) * N, k = Math.min(N - 1, Math.floor(u)), f = u - k; return T[k] + (T[k + 1] - T[k]) * f; };
  return { re: (t) => at(R, t), im: (t) => at(I, t), abs: (t) => at(A, t) };
}

/** Catmull–Rom spline through equally spaced values ys on [0,1]. */
function spline(ys) {
  const n = ys.length - 1;
  return (x) => {
    const u = Math.min(Math.max(x, 0), 1) * n, i = Math.min(n - 1, Math.floor(u)), t = u - i;
    const p0 = ys[Math.max(0, i - 1)], p1 = ys[i], p2 = ys[i + 1], p3 = ys[Math.min(n, i + 2)];
    return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
  };
}

/** Bounding box [[x0,x1],[y0,y1]] of points (nulls ignored), padded. */
function bbox(pts, pad = 0.12, min = 0.2) {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const p of pts) { if (!p) continue; x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  const w = Math.max(min, x1 - x0), h = Math.max(min, y1 - y0), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  return [[cx - w * (0.5 + pad), cx + w * (0.5 + pad)], [cy - h * (0.5 + pad), cy + h * (0.5 + pad)]];
}

const PIECE_COLORS = ['orange', 'purple', 'teal', 'pink', 'gold'];

export default {
  collection: 'rca',
  chapter: 6,
  title: 'Complex Measures',
  summary: String.raw`Measures are now allowed to take complex (or signed) values. The total variation $|\mu|$ — a supremum over partitions — turns every complex measure into a finite positive one, and absolute continuity and mutual singularity organise how two measures can sit relative to each other. The Lebesgue–Radon–Nikodym theorem, proved with a Hilbert-space trick, splits any measure into a part with a density and a singular part; from it come the polar form $d\mu=h\,d|\mu|$, the Hahn decomposition, the identification of the dual of $L^p$ with $L^q$, and the Riesz representation of $C_0(X)^*$ by regular complex measures.`,
  items: [
    // ------------------------------------------------------------------ total variation
    {
      num: '6.1',
      kind: 'Definition',
      name: 'Complex measures and their total variation',
      statement: String.raw`Let $\mathfrak M$ be a σ-algebra in a set $X$. A **partition** of $E\in\mathfrak M$ is a countable family $\{E_i\}$ of pairwise disjoint members of $\mathfrak M$ whose union is $E$. A **complex measure** on $\mathfrak M$ is a complex-valued function $\mu$ on $\mathfrak M$ such that
$$\mu(E)=\sum_{i=1}^\infty\mu(E_i)$$
for every $E\in\mathfrak M$ and every partition $\{E_i\}$ of $E$. Every rearrangement of a partition is again a partition, so these series must converge absolutely. A complex measure with real values is a **real measure** (positive measures count only when they are finite). The **total variation** of $\mu$ is the set function
$$|\mu|(E)=\sup\sum_{i=1}^\infty|\mu(E_i)|\qquad(E\in\mathfrak M),$$
the supremum being taken over all partitions $\{E_i\}$ of $E$.`,
      idea: String.raw`The supremum is forced on us: we want the *smallest* positive measure $\lambda$ with $\lambda(E)\ge|\mu(E)|$ for all $E$, and any such $\lambda$ satisfies $\lambda(E)=\sum\lambda(E_i)\ge\sum|\mu(E_i)|$ for every partition. Refining a partition can only increase the sum (triangle inequality). For a measure on $[0,1]$ and partitions into intervals, $\sum|\mu(E_i)|$ is the length of a polygon inscribed in the curve $t\mapsto\mu([0,t])$, so $|\mu|$ is an arc length — exactly the sup-over-partitions definition of the length of a curve in *Principles*.`,
      caption: String.raw`Top: a complex measure on $[0,1]$ — a density $g$ (height $|g|$, hue $\arg g$), optional point masses $c_1,c_2$ and a singular Cantor part. Orange marks cut $[0,1]$ into $n$ intervals $E_i$; each new mark refines the previous partition. Left: the curve $t\mapsto\mu([0,t])$ in $\C$ (atoms are dashed jumps) and the polygon whose sides are the vectors $\mu(E_i)$. Right: $\sum_i|\mu(E_i)|$ never decreases under refinement and climbs to $|\mu|(X)$.`,
      deps: ['rca-1.18', 'rca-1.3'],
      see: ['pma-6.26'],
      tags: ['complex measures', 'total variation'],
      viz(v) {
        const M = v.M, Cx = v.Cx;
        const rad = (x) => 1.25 + 0.55 * Math.cos(TAU * 1.3 * x);
        const ang = (x) => TAU * 1.55 * x + 0.9 * Math.sin(TAU * x);
        const g = (x) => [rad(x) * Math.cos(ang(x)), rad(x) * Math.sin(ang(x))];
        const G = cumulative(g);
        const ATOMS = [{ x: 0.3, m: Cx.polar(0.34, 2.3), lab: 'c_1' }, { x: 0.71, m: Cx.polar(0.27, -1.2), lab: 'c_2' }];
        const CAN = Cx.polar(0.3, 0.35);
        const which = v.select('$\\mu=$', [{ value: 'd', label: '$g\\,dx$' }, { value: 'a', label: '$g\\,dx+c_1\\delta+c_2\\delta$' }, { value: 'c', label: '$\\dots+$ Cantor part' }], 'a');
        const nS = v.slider('pieces $n$', 1, 120, 7, { int: true });
        let shift = 0.1234;
        v.button('New cut points', () => { shift = Math.random(); cache = null; });
        const top = v.stage({ x: [-0.02, 1.02], y: [-0.5, 2.65], height: 140, full: true, axes: false, title: 'the measure on $X=[0,1]$ and the partition $\\{E_i\\}$' });
        const C = v.stage({ x: [-0.6, 0.6], y: [-0.6, 0.6], equal: true, height: 330, title: 'the curve $t\\mapsto\\mu([0,t])$ and the vectors $\\mu(E_i)$' });
        const S = v.stage({ x: [0, 122], y: [0, 2], height: 330, axes: 'box', xlabel: 'n', title: '$\\sum_i|\\mu(E_i)|$ as cut points are added' });
        const NMAX = 120;
        const parts = (w) => ({ atoms: w === 'd' ? [] : ATOMS, can: w === 'c' ? CAN : null });
        const Gam = (t, P) => {
          let re = G.re(t), im = G.im(t);
          for (const a of P.atoms) if (a.x <= t) { re += a.m.re; im += a.m.im; }
          if (P.can) { const c = M.cantorFn(t); re += P.can.re * c; im += P.can.im * c; }
          return [re, im];
        };
        const totalVar = (P) => G.abs(1) + P.atoms.reduce((s, a) => s + a.m.abs(), 0) + (P.can ? P.can.abs() : 0);
        const cuts = (n) => { const xs = [0, 1]; for (let k = 1; k < n; k++) xs.push((shift + k * 0.6180339887498949) % 1); return xs.sort((a, b) => a - b); };
        const sumFor = (xs, P) => { let s = 0, prev = [0, 0]; for (let i = 1; i < xs.length; i++) { const q = Gam(xs[i], P); s += Math.hypot(q[0] - prev[0], q[1] - prev[1]); prev = q; } return s; };
        const CANT = M.cantorIntervals(6);
        let cache = null, st = null;
        v.legend([['accent', 'sides $\\mu(E_i)$ of the inscribed polygon'], ['orange', 'cut points / vertices', { dot: true }], ['green', '$|\\mu|(X)$', { dash: true }]]);
        v.render(() => {
          const w = which.value, P = parts(w), n = nS.value;
          if (!cache || cache.w !== w) {
            const ts = M.linspace(0, 1, 1601);
            for (const a of P.atoms) ts.push(a.x - 1e-9, a.x);
            ts.sort((a, b) => a - b);
            const pts = [];
            for (const t of ts) { if (P.atoms.some((a) => a.x === t)) pts.push(null); pts.push(Gam(t, P)); }
            const sums = [];
            for (let k = 1; k <= NMAX; k++) sums.push(sumFor(cuts(k), P));
            cache = { w, pts, sums, V: totalVar(P), box: bbox(pts.concat([[0, 0]]), 0.1) };
            C.setView(cache.box[0], cache.box[1]);
          }
          const xs = cuts(n), V = cache.V;
          // --- top strip: density coloured by phase, atoms, Cantor set, cuts
          top.raster((x, y) => {
            if (x < 0 || x > 1 || y < 0) return null;
            const [re, im] = g(x), r = Math.hypot(re, im);
            if (y > r * 1.05) return null;
            return [...M.hsl2rgb(Math.atan2(im, re) / TAU, 0.62, 0.56), 225];
          }, { key: 'strip', res: 1 });
          top.fn((x) => Math.hypot(...g(x)), { domain: [0, 1], color: 'ink', width: 1, alpha: 0.35 });
          top.line(0, 0, 1, 0, { color: 'muted', width: 1 });
          for (const a of P.atoms) {
            const col = M.hsl2rgb(a.m.arg() / TAU, 0.7, 0.45);
            top.arrow(a.x, 0, a.x, 2.3, { color: col, width: 2.6, head: 8 });
            top.tex(a.lab, a.x, 2.3, { color: col, align: 'left', baseline: 'bottom', dx: 5, dy: 4, size: 14 });
          }
          if (P.can) {
            for (const [a, b] of CANT) top.rect(a, -0.42, b, -0.2, { fill: 'purple', fillAlpha: 0.85, stroke: false });
            top.text('Cantor part', 1, -0.31, { color: 'purple', align: 'right', size: 11, dx: -2 });
          }
          for (let i = 1; i < xs.length - 1; i++) top.line(xs[i], -0.48, xs[i], 2.62, { color: 'orange', width: n > 50 ? 1 : 1.5 });
          top.text('height |g|, hue = arg g', 0.37, 1.7, { color: 'muted', size: 11, math: false });
          // --- complex plane: curve and inscribed polygon
          C.path(cache.pts, { color: 'ink', width: 1.6, alpha: 0.4 });
          for (const a of P.atoms) { const p = Gam(a.x - 1e-9, P), q = Gam(a.x, P); C.line(p[0], p[1], q[0], q[1], { color: 'muted', width: 1.3, dash: [4, 4] }); }
          const poly = [[0, 0]]; for (let i = 1; i < xs.length; i++) poly.push(Gam(xs[i], P));
          const end = poly[poly.length - 1];
          C.line(0, 0, end[0], end[1], { color: 'red', width: 1.3, dash: [3, 4], alpha: 0.8 });
          C.path(poly, { color: 'accent', width: 2.4 });
          if (n <= 60) for (const p of poly.slice(1, -1)) C.dot(p[0], p[1], { color: 'orange', r: 3.2 });
          C.dot(0, 0, { color: 'ink', r: 4, label: '0', labelPos: 'sw' });
          C.dot(end[0], end[1], { color: 'red', r: 4.5, label: 'μ(X)', labelPos: 'e' });
          // --- partition sums
          const s = cache.sums;
          S.setView(null, [0, V * 1.15]);
          S.hline(V, { color: 'green', width: 1.6, dash: [6, 4] });
          S.tex('|\\mu|(X)', NMAX, V, { color: 'green', align: 'right', baseline: 'bottom', dy: -4 });
          const stair = []; s.forEach((y, i) => { stair.push([i + 0.5, y], [i + 1.5, y]); });
          S.path(stair, { color: 'accent', width: 2 });
          S.vline(n, { color: 'orange', width: 1, dash: [3, 3] });
          S.dot(n, s[n - 1], { color: 'orange', r: 5 });
          st = { n, sum: s[n - 1], V, muX: Math.hypot(end[0], end[1]), P };
        });
        v.readout(() => {
          if (!st) return '';
          const terms = String.raw`\int_0^1|g|\,dx` + (st.P.atoms.length ? '+|c_1|+|c_2|' : '') + (st.P.can ? '+|c|' : '');
          return String.raw`$|\mu(X)|=${v.fix(st.muX, 3)}\;\le\;\sum_{i=1}^{${st.n}}|\mu(E_i)|=${v.fix(st.sum, 4)}\;\le\;|\mu|(X)=${terms}=${v.fix(st.V, 4)}$`;
        });
      },
    },
    {
      num: '6.2',
      kind: 'Theorem',
      name: 'The total variation |μ| is a positive measure',
      statement: String.raw`If $\mu$ is a complex measure on a σ-algebra $\mathfrak M$, then its total variation $|\mu|$ is a positive measure on $\mathfrak M$.`,
      idea: String.raw`Let $\{E_i\}$ partition $E$. For each $i$ take $t_i<|\mu|(E_i)$ and a partition $\{A_{ij}\}_j$ of $E_i$ with $\sum_j|\mu(A_{ij})|>t_i$; all the $A_{ij}$ together partition $E$, so $\sum_i t_i\le|\mu|(E)$ and hence $\sum_i|\mu|(E_i)\le|\mu|(E)$. Conversely, for any partition $\{A_j\}$ of $E$, $\mu(A_j)=\sum_i\mu(A_j\cap E_i)$, so $\sum_j|\mu(A_j)|\le\sum_i\sum_j|\mu(A_j\cap E_i)|\le\sum_i|\mu|(E_i)$ — interchanging the order of a double series of nonnegative terms (1.27a). Clearly $|\mu|(\varnothing)=0$.`,
      caption: String.raw`$E=[0,1]$ is cut into infinitely many pieces $A_k=(1-\rho^{k-1},1-\rho^k]$ (colours). Each piece is an arc of the curve $t\mapsto\mu([0,t])$, and its length is $|\mu|(A_k)$. Inscribing $m$ chords in every arc gives one partition of $E$ (blue sum), which can never exceed $|\mu|(E)$. Right: running sums over $k$. The arc lengths (green) add up exactly to $|\mu|(E)$, while the single chords $|\mu(A_k)|$ ($m=1$) fall short — $|\mu(\cdot)|$ itself is not additive.`,
      deps: ['rca-6.1', 'rca-1.27a', 'rca-1.18'],
      tags: ['total variation', 'countable additivity'],
      viz(v) {
        const M = v.M;
        const rad = (x) => 1.35 * (1 + 0.35 * Math.sin(TAU * 2.6 * x));
        const ang = (x) => TAU * 2.2 * x * (1 - 0.25 * x) + 0.6;
        const g = (x) => [rad(x) * Math.cos(ang(x)), rad(x) * Math.sin(ang(x))];
        const G = cumulative(g, 4000);
        const Gam = (t) => [G.re(t), G.im(t)];
        const rho = v.slider('ratio $\\rho$', 0.35, 0.8, 0.6, { step: 0.01 });
        const mS = v.slider('chords per piece $m$', 1, 12, 1, { int: true });
        const C = v.stage({ x: [-0.6, 0.6], y: [-0.6, 0.6], equal: true, height: 350, title: 'pieces $A_k$ as arcs of $t\\mapsto\\mu([0,t])$' });
        const R = v.stage({ x: [0.3, 16.7], y: [0, 2], height: 350, axes: 'box', xlabel: 'k', title: 'running sums over the pieces $A_1,\\dots,A_k$' });
        const pts = M.linspace(0, 1, 1601).map(Gam);
        const box = bbox(pts.concat([[0, 0]]), 0.12);
        C.setView(box[0], box[1]);
        const V = G.abs(1);
        const KMAX = 16, KALL = 400;
        let st = null;
        v.legend([['green', '$\\sum_{j\\le k}|\\mu|(A_j)$ (arc lengths)'], ['accent', '$\\sum_{j\\le k}$ ($m$-chord sums in $A_j$)'], ['muted', '$|\\mu|(E)$', { dash: true }]]);
        v.render(() => {
          const r = rho.value, m = mS.value;
          const ends = (k) => (k <= 0 ? 0 : 1 - Math.pow(r, k));
          const chordSum = (a, b) => { let s = 0, p = Gam(a); for (let i = 1; i <= m; i++) { const q = Gam(a + (b - a) * i / m); s += Math.hypot(q[0] - p[0], q[1] - p[1]); p = q; } return s; };
          let arcs = 0, chords = 0, single = 0;
          const arcCum = [], chordCum = [];
          for (let k = 1; k <= KALL; k++) {
            const a = ends(k - 1), b = ends(k);
            arcs += G.abs(b) - G.abs(a); chords += chordSum(a, b);
            const p = Gam(a), q = Gam(b); single += Math.hypot(q[0] - p[0], q[1] - p[1]);
            if (k <= KMAX) { arcCum.push(arcs); chordCum.push(chords); }
          }
          // left: coloured arcs with inscribed chords
          C.path(pts, { color: 'ink', width: 1, alpha: 0.25 });
          for (let k = 1; k <= 40; k++) {
            const a = ends(k - 1), b = ends(k), col = PIECE_COLORS[(k - 1) % PIECE_COLORS.length];
            const seg = M.linspace(a, b, Math.max(8, Math.ceil(400 * (b - a)))).map(Gam);
            C.path(seg, { color: col, width: 6, alpha: 0.28 });
            const poly = M.linspace(a, b, m + 1).map(Gam);
            C.path(poly, { color: col, width: 2 });
            if (k <= 25) C.dot(poly[0][0], poly[0][1], { color: col, r: 2.8 });
            if (k <= 3) {
              // label outside the arc: along the normal pointing away from the arc's centroid
              const tm = a + (k === 1 ? 0.5 : 0.4) * (b - a), p = Gam(tm), q = Gam(tm + 1e-3);
              let nx = -(q[1] - p[1]), ny = q[0] - p[0]; const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
              const cen = seg.reduce((s, z) => [s[0] + z[0] / seg.length, s[1] + z[1] / seg.length], [0, 0]);
              if (nx * (p[0] - cen[0]) + ny * (p[1] - cen[1]) < 0) { nx = -nx; ny = -ny; }
              const off = 0.075 * (box[0][1] - box[0][0]);
              // the first piece is a closed-looking loop: label it at its centre
              if (k === 1) C.tex(`A_${k}`, cen[0], cen[1], { color: col, size: 15 });
              else C.tex(`A_${k}`, p[0] + nx * off, p[1] + ny * off, { color: col, size: 15 });
            }
          }
          C.dot(0, 0, { color: 'ink', r: 3.5 });
          // right: running sums
          R.setView(null, [0, V * 1.15]);
          R.hline(V, { color: 'muted', width: 1.4, dash: [6, 4] });
          R.tex('|\\mu|(E)', KMAX + 0.5, V, { color: 'muted', align: 'right', baseline: 'bottom', dy: -3 });
          R.path(arcCum.map((y, i) => [i + 1, y]), { color: 'green', width: 2.2 });
          R.path(chordCum.map((y, i) => [i + 1, y]), { color: 'accent', width: 2.2 });
          arcCum.forEach((y, i) => R.dot(i + 1, y, { color: 'green', r: 3.2 }));
          chordCum.forEach((y, i) => R.dot(i + 1, y, { color: 'accent', r: 3.2 }));
          st = { arcs, chords, single, m };
        });
        v.readout(() => {
          if (!st) return '';
          return String.raw`$\sum_{k\ge1}|\mu|(A_k)=${v.fix(st.arcs, 4)}=|\mu|(E)$; $\;$ the partition of $E$ by ${st.m} chord${st.m > 1 ? 's' : ''} per piece: $${v.fix(st.chords, 4)}\le|\mu|(E)$; $\;\sum_k|\mu(A_k)|=${v.fix(st.single, 4)}$.`;
        });
      },
    },
    {
      num: '6.3',
      kind: 'Lemma',
      name: 'A subsum captures 1/π of the total length',
      statement: String.raw`If $z_1,\dots,z_N$ are complex numbers, then there is a subset $S\subset\{1,\dots,N\}$ with
$$\Big|\sum_{k\in S}z_k\Big|\ \ge\ \frac1\pi\sum_{k=1}^N|z_k| .$$`,
      idea: String.raw`Write $z_k=|z_k|e^{i\alpha_k}$ and, for a direction $\theta$, let $S(\theta)$ collect the $k$ with $\cos(\alpha_k-\theta)>0$ — the $z_k$ in an open half-plane. Then $|\sum_{S(\theta)}z_k|\ge\Re\big(e^{-i\theta}\sum_{S(\theta)}z_k\big)=\sum_k|z_k|\cos^+(\alpha_k-\theta)$. The average of $\cos^+$ over a period is $1/\pi$, so the right side averages to $\frac1\pi\sum|z_k|$ over $\theta\in[0,2\pi]$, and at its maximum it is at least its average.`,
      caption: String.raw`Drag the six numbers $z_k$ and the green direction handle $\theta$. The shaded half-plane selects $S(\theta)$ (blue arrows); the green arrow is their sum. Right: as $\theta$ turns, $f(\theta)=\sum_k|z_k|\cos^+(\alpha_k-\theta)$ (blue) stays below $|\sum_{S(\theta)}z_k|$ (green) and has mean exactly $\frac1\pi\sum|z_k|$ (orange), so it rises above that level somewhere.`,
      deps: [],
      tags: ['complex numbers', 'inequalities'],
      viz(v) {
        const M = v.M;
        const RT = 1.6, RZ = 1.35;
        const L = v.stage({ x: [-2.3, 2.3], y: [-2.3, 2.3], equal: true, height: 350, title: 'the half-plane $\\{\\Re(e^{-i\\theta}z)>0\\}$ selects $S(\\theta)$' });
        const R = v.stage({ x: [0, TAU], y: [0, 4], height: 350, axes: 'box', xlabel: 'θ', title: 'as functions of the direction $\\theta$',
          xticks: [[0, '0'], [Math.PI / 2, 'π/2'], [Math.PI, 'π'], [3 * Math.PI / 2, '3π/2'], [TAU, '2π']] });
        const Z0 = [[0.95, 0.28], [0.22, 0.92], [-0.72, 0.62], [-0.38, -0.88], [0.62, -0.58], [-1.08, -0.12]];
        const inDisc = (x, y) => { const r = Math.hypot(x, y); return r > RZ ? [x * RZ / r, y * RZ / r] : [x, y]; };
        const Z = Z0.map(([x, y], i) => L.handle(x, y, { color: 'accent', r: 6, label: 'z' + SUB[i + 1], constrain: inDisc }));
        const T = L.handle(RT * Math.cos(1.0), RT * Math.sin(1.0), { color: 'green', label: 'θ', labelPos: 'e', constrain: (x, y) => { const a = Math.atan2(y, x); return [RT * Math.cos(a), RT * Math.sin(a)]; } });
        let st = null;
        v.legend([['accent', '$f(\\theta)=\\sum_k|z_k|\\cos^+(\\alpha_k-\\theta)$'], ['green', '$|\\sum_{k\\in S(\\theta)}z_k|$'], ['orange', '$\\frac1\\pi\\sum_k|z_k|$', { dash: true }]]);
        v.render(() => {
          const zs = Z.map((h) => [h.x, h.y]);
          const th = M.mod(Math.atan2(T.y, T.x), TAU), u = [Math.cos(th), Math.sin(th)], w = [-u[1], u[0]];
          const total = M.sum(zs, (z) => Math.hypot(z[0], z[1]));
          const f = (t) => M.sum(zs, (z) => Math.max(0, z[0] * Math.cos(t) + z[1] * Math.sin(t)));
          const sel = (t) => zs.filter((z) => z[0] * Math.cos(t) + z[1] * Math.sin(t) > 0);
          const sumAbs = (t) => { const s = sel(t).reduce((a, z) => [a[0] + z[0], a[1] + z[1]], [0, 0]); return Math.hypot(s[0], s[1]); };
          // keep the whole picture (including the sum) in view
          let sx0 = 0, sy0 = 0; for (const z of zs) if (z[0] * u[0] + z[1] * u[1] > 0) { sx0 += z[0]; sy0 += z[1]; }
          const span = Math.max(2.3, Math.hypot(sx0, sy0) * 1.18 + 0.25);
          L.setView([-span, span], [-span, span]);
          // half-plane
          const Lr = 40;
          L.poly([[w[0] * Lr, w[1] * Lr], [w[0] * Lr + u[0] * Lr, w[1] * Lr + u[1] * Lr], [-w[0] * Lr + u[0] * Lr, -w[1] * Lr + u[1] * Lr], [-w[0] * Lr, -w[1] * Lr]], { fill: 'green', fillAlpha: 0.08, stroke: false });
          L.line(-w[0] * Lr, -w[1] * Lr, w[0] * Lr, w[1] * Lr, { color: 'green', width: 1.2, dash: [5, 4], alpha: 0.7 });
          L.line(0, 0, T.x, T.y, { color: 'green', width: 1.2, alpha: 0.6 });
          L.circle(0, 0, RT, { color: 'faint', width: 1, dash: [2, 4] });
          const S = []; let sx = 0, sy = 0;
          zs.forEach((z, i) => {
            const inS = z[0] * u[0] + z[1] * u[1] > 0;
            if (inS) { S.push(i + 1); sx += z[0]; sy += z[1]; }
            L.arrow(0, 0, z[0], z[1], { color: inS ? 'accent' : 'muted', width: inS ? 2.2 : 1.5, alpha: inS ? 1 : 0.55, head: 8 });
          });
          const pr = sx * u[0] + sy * u[1];
          L.line(sx, sy, pr * u[0], pr * u[1], { color: 'green', width: 1, dash: [2, 3] });
          L.arrow(0, 0, sx, sy, { color: 'green', width: 3.4, head: 11 });
          L.tex('\\sum_{S(\\theta)} z_k', sx, sy, { color: 'green', align: 'left', baseline: 'bottom', dx: 6, dy: -4, size: 14 });
          // right panel
          const ts = M.linspace(0, TAU, 721);
          const fs = ts.map(f), gs = ts.map(sumAbs);
          const top = Math.max(...gs, total / Math.PI) * 1.15;
          R.setView(null, [0, top]);
          const mean = M.integrate(f, 0, TAU, 720) / TAU;
          R.hline(total / Math.PI, { color: 'orange', width: 1.6, dash: [6, 4] });
          R.path(ts.map((t, i) => [t, gs[i]]), { color: 'green', width: 2.2 });
          R.path(ts.map((t, i) => [t, fs[i]]), { color: 'accent', width: 2.2 });
          R.between((t) => f(t), () => 0, 0, TAU, { fill: 'accent', fillAlpha: 0.08 });
          const im = M.argmax(fs);
          R.dot(ts[im], fs[im], { color: 'accent', r: 4.5, label: 'θ₀', labelPos: 'n' });
          R.vline(th, { color: 'green', width: 1, dash: [3, 3] });
          R.dot(th, f(th), { color: 'accent', r: 5 });
          R.dot(th, sumAbs(th), { color: 'green', r: 5 });
          st = { S, sum: Math.hypot(sx, sy), total, mean, fth: f(th) };
        });
        v.readout(() => {
          if (!st) return '';
          return String.raw`$S(\theta)=\{${st.S.join(',')}\}$: $\;\big|\sum_{S(\theta)}z_k\big|=${v.fix(st.sum, 3)}\ \ge\ f(\theta)=${v.fix(st.fth, 3)}$; $\;\frac1{2\pi}\int_0^{2\pi}f=${v.fix(st.mean, 4)}=\frac1\pi\sum|z_k|=${v.fix(st.total / Math.PI, 4)}$`;
        });
      },
    },
    {
      num: '6.4',
      kind: 'Theorem',
      name: 'Complex measures have finite total variation',
      statement: String.raw`If $\mu$ is a complex measure on $X$, then $|\mu|(X)<\infty$. In particular the range of $\mu$ is bounded: $|\mu(E)|\le|\mu|(X)$ for every measurable $E$.`,
      idea: String.raw`Suppose $|\mu|(E)=\infty$. Pick a partition of $E$ with $\sum|\mu(E_i)|>\pi(1+|\mu(E)|)$; finitely many terms already exceed this, and Lemma 6.3 picks a union $A$ of some of them with $|\mu(A)|>1+|\mu(E)|$. Then $B=E\setminus A$ has $|\mu(B)|\ge|\mu(A)|-|\mu(E)|>1$, and since $|\mu|$ is a measure (6.2), one of $|\mu|(A)$, $|\mu|(B)$ is infinite. Splitting that set again and again produces disjoint sets $A_1,A_2,\dots$ with $|\mu(A_n)|>1$; then $\sum_n\mu(A_n)$ diverges, although countable additivity says it equals $\mu(\bigcup A_n)$.`,
      caption: String.raw`A test case on $X=\mathbb N$: put mass $m_k=e^{ik}/k^s$ at $k$. Scanning the indices, Lemma 6.3's half-plane ($\Re m_k>0$) collects the finite sets $A_1,A_2,\dots$ (coloured bands), each closed as soon as $|\mu(A_n)|>c$. For $s\le1$, $\sum|m_k|=\infty$ and the blocks never stop: along $\bigcup A_n$ the sums (red) run off to infinity, while the ordinary series (grey) converges — so no complex measure has these point masses. For $s>1$ the variation is finite and at most $|\mu|(\mathbb N)/c$ blocks exist.`,
      deps: ['rca-6.3', 'rca-6.2', 'rca-6.1'],
      tags: ['total variation', 'boundedness'],
      viz(v) {
        const M = v.M;
        const K = 8000;
        const sS = v.slider('decay exponent $s$', 0.5, 2, 0.5, { step: 0.05 });
        const cS = v.slider('threshold $c$', 0.2, 1.5, 1, { step: 0.05 });
        const L = v.stage({ x: [0, Math.sqrt(K)], y: [-0.5, 5], height: 330, axes: 'box', weight: 1.7, title: 'partial sums against the index $k$ (horizontal scale $\\sqrt k$)',
          xticks: [1, 10, 100, 500, 1000, 2000, 4000, 8000].map((k) => [Math.sqrt(k), String(k)]) });
        const B = v.stage({ x: [0, 10], y: [0, 2], height: 330, axes: 'box', weight: 1, xlabel: 'n', title: '$|\\mu(A_n)|$ for the blocks found' });
        let st = null;
        v.legend([['muted', '$|\\sum_{j\\le k} m_j|$ (all indices)'], ['red', '$|\\sum_{j\\le k,\\ j\\in A_1\\cup A_2\\cup\\cdots} m_j|$'], ['orange', 'threshold $c$', { dash: true }]]);
        v.render(() => {
          const s = sS.value, c = cS.value;
          const nat = [], uni = [], blocks = [];
          let nr = 0, ni = 0, ur = 0, ui = 0, br = 0, bi = 0, start = 1, abs = 0;
          for (let k = 1; k <= K; k++) {
            const a = Math.pow(k, -s), re = a * Math.cos(k), im = a * Math.sin(k);
            nr += re; ni += im; abs += a;
            if (re > 0) { ur += re; ui += im; br += re; bi += im; if (Math.hypot(br, bi) > c) { blocks.push({ from: start, to: k, m: Math.hypot(br, bi) }); br = bi = 0; start = k + 1; } }
            if (k <= 40 || k % 4 === 0) { nat.push([Math.sqrt(k), Math.hypot(nr, ni)]); uni.push([Math.sqrt(k), Math.hypot(ur, ui)]); }
          }
          const div = s <= 1;
          const tail = div ? Infinity : abs + Math.pow(K, 1 - s) / (s - 1);
          const yTop = Math.max(2.2, ...uni.map((p) => p[1])) * 1.1;
          L.setView(null, [-0.08 * yTop, yTop]);
          blocks.forEach((b, i) => L.vband(Math.sqrt(b.from - 0.5), Math.sqrt(b.to + 0.5), { color: PIECE_COLORS[i % PIECE_COLORS.length], alpha: 0.1 }));
          L.path(nat, { color: 'muted', width: 2 });
          L.path(uni, { color: div ? 'red' : 'green', width: 2.4 });
          L.corner(div ? `Σ|m_k| = ∞: ${blocks.length} blocks so far, more keep coming` : `|μ|(ℕ) = Σ k^(−s) ≈ ${v.fmt(tail, 3)}: only ${blocks.length} block${blocks.length === 1 ? '' : 's'}`, 'tl', { color: div ? 'red' : 'green', weight: 600, dx: 26 });
          // blocks panel
          const nb = Math.max(blocks.length, 1);
          const bTop = Math.max(c * 1.6, ...blocks.map((b) => b.m)) * 1.12;
          B.setView([0.3, Math.max(8, nb) + 0.7], [-0.09 * bTop, bTop]);
          B.bars(blocks.map((b) => b.m), { color: (y, i) => PIECE_COLORS[i % PIECE_COLORS.length], barWidth: 0.72 });
          B.hline(c, { color: 'orange', width: 1.6, dash: [6, 4] });
          B.hline(0, { color: 'faint', width: 1 });
          if (!blocks.length) B.corner('no set with |μ(A)| > c', 'tr', { color: 'green', weight: 600 });
          st = { s, c, div, nb: blocks.length, sumU: Math.hypot(ur, ui), lim: Math.hypot(nr, ni), abs, tail };
        });
        v.readout(() => {
          if (!st) return '';
          return st.div
            ? String.raw`$s=${v.fix(st.s, 2)}\le1$: $\sum_{k\le ${K}}|m_k|=${v.fix(st.abs, 1)}\to\infty$. Found ${st.nb} disjoint sets with $|\mu(A_n)|>${v.fix(st.c, 2)}$; along their union the sum has modulus $${v.fix(st.sumU, 2)}$ and grows without bound, while $|\sum_k m_k|\approx${v.fix(st.lim, 3)}$ converges.`
            : String.raw`$s=${v.fix(st.s, 2)}>1$: $|\mu|(\mathbb N)=\sum_k k^{-s}\approx${v.fix(st.tail, 3)}<\infty$, so at most $|\mu|(\mathbb N)/c=${v.fix(st.tail / st.c, 2)}$ disjoint sets can have $|\mu(A)|>c$ — found ${st.nb}.`;
        });
      },
    },
    {
      num: '6.5',
      kind: 'Definition',
      name: 'The normed space of complex measures',
      verify: true,
      statement: String.raw`If $\mu$ and $\lambda$ are complex measures on the same σ-algebra $\mathfrak M$ and $c\in\C$, then $(\mu+\lambda)(E)=\mu(E)+\lambda(E)$ and $(c\mu)(E)=c\,\mu(E)$ define complex measures. The complex measures on $\mathfrak M$ thus form a vector space, and
$$\|\mu\|=|\mu|(X)$$
is a norm on it (finite by 6.4); one has $|\mu+\lambda|\le|\mu|+|\lambda|$ and $|c\mu|=|c|\,|\mu|$.`,
      idea: String.raw`The triangle inequality holds partition by partition: $\sum|\mu(E_i)+\lambda(E_i)|\le\sum|\mu(E_i)|+\sum|\lambda(E_i)|$; take suprema. If $\|\mu\|=0$ then $|\mu(E)|\le|\mu|(E)=0$ for every $E$. The space is even complete, and it is in this norm that the Riesz theorem 6.19 identifies the dual of $C_0(X)$. The norm is very strong: two unit point masses at different points are always at distance $2$.`,
      caption: String.raw`Drag the points $a$ and $b$. The measure $\delta_a-\delta_b$ has norm $2$ for every $a\ne b$, however close, while its action on a continuous $f$, $\int f\,d(\delta_a-\delta_b)=f(a)-f(b)$, tends to $0$ as $b\to a$ (lower panel, as a function of $b$).`,
      deps: ['rca-6.4', 'rca-6.2', 'rca-5.1'],
      see: ['fa-1.2'],
      tags: ['total variation', 'normed spaces'],
      viz(v) {
        const M = v.M;
        const f = (x) => 0.62 * Math.sin(TAU * x + 0.3) + 0.3 * Math.cos(5.3 * x);
        const T = v.stage({ x: [-0.03, 1.03], y: [-1.45, 1.45], height: 230, full: true, ticks: false, title: 'the measure $\\mu=\\delta_a-\\delta_b$ and a continuous test function $f$' });
        const Bt = v.stage({ x: [-0.03, 1.03], y: [-0.3, 2.4], height: 180, full: true, axes: 'box', xlabel: 'b', title: 'as $b$ moves (with $a$ fixed)' });
        const onAxis = (x) => [M.clamp(x, 0, 1), 0];
        const a = T.handle(0.3, 0, { color: 'accent', label: 'a', labelPos: 's', constrain: onAxis });
        const b = T.handle(0.5, 0, { color: 'red', label: 'b', labelPos: 's', constrain: onAxis });
        let st = null;
        v.legend([['red', '$\\|\\delta_a-\\delta_b\\|=|\\delta_a-\\delta_b|(X)$'], ['accent', '$|\\int f\\,d(\\delta_a-\\delta_b)|=|f(a)-f(b)|$'], ['ink', '$f$']]);
        v.render(() => {
          T.fn(f, { color: 'ink', width: 2, domain: [0, 1] });
          T.arrow(a.x, 0, a.x, 1.15, { color: 'accent', width: 3, head: 10 });
          T.arrow(b.x, 0, b.x, -1.15, { color: 'red', width: 3, head: 10 });
          T.tex('+\\delta_a', a.x, 1.2, { color: 'accent', baseline: 'bottom', size: 14 });
          T.tex('-\\delta_b', b.x, -1.2, { color: 'red', baseline: 'top', size: 14 });
          const xb = b.x + (b.x < 0.9 ? 0.025 : -0.025);
          T.line(a.x, f(a.x), xb, f(a.x), { color: 'muted', width: 1, dash: [3, 3] });
          T.line(b.x, f(b.x), xb, f(b.x), { color: 'muted', width: 1, dash: [3, 3] });
          T.line(xb, f(a.x), xb, f(b.x), { color: 'accent', width: 2.4 });
          T.tex('f(a)-f(b)', xb, (f(a.x) + f(b.x)) / 2, { color: 'accent', align: b.x < 0.9 ? 'left' : 'right', dx: b.x < 0.9 ? 6 : -6, size: 13 });
          T.dot(a.x, f(a.x), { color: 'ink', r: 4 });
          T.dot(b.x, f(b.x), { color: 'ink', r: 4 });
          // lower panel
          const d = (x) => Math.abs(f(a.x) - f(x));
          Bt.fn(d, { color: 'accent', width: 2.2, domain: [0, 1] });
          Bt.line(0, 2, 1, 2, { color: 'red', width: 2.4 });
          Bt.dot(a.x, 2, { color: 'red', r: 4.5, hollow: true });
          Bt.dot(a.x, 0, { color: 'red', r: 4.5 });
          Bt.hline(0, { color: 'faint', width: 1 });
          Bt.vline(b.x, { color: 'muted', width: 1, dash: [3, 3] });
          Bt.dot(b.x, d(b.x), { color: 'accent', r: 5 });
          Bt.dot(b.x, a.x === b.x ? 0 : 2, { color: 'red', r: 5 });
          st = { same: Math.abs(a.x - b.x) < 1e-12, d: d(b.x), gap: Math.abs(a.x - b.x) };
        });
        v.readout(() => {
          if (!st) return '';
          return st.same ? String.raw`$a=b$: $\delta_a-\delta_b=0$ and its norm is $0$.`
            : String.raw`$|a-b|=${v.fix(st.gap, 3)}$: $\;\|\delta_a-\delta_b\|=|\delta_a-\delta_b|(X)=2$, $\;$ but $\big|\int f\,d(\delta_a-\delta_b)\big|=${v.fix(st.d, 4)}$.`;
        });
      },
    },
    {
      num: '6.6',
      kind: 'Definition',
      name: 'Positive and negative variations; Jordan decomposition',
      verify: true,
      statement: String.raw`Let $\mu$ be a real measure on $\mathfrak M$. Its **positive** and **negative variations** are
$$\mu^+=\tfrac12\big(|\mu|+\mu\big),\qquad \mu^-=\tfrac12\big(|\mu|-\mu\big).$$
They are bounded positive measures, and $\mu=\mu^+-\mu^-$, $|\mu|=\mu^++\mu^-$. The representation $\mu=\mu^+-\mu^-$ is the **Jordan decomposition** of $\mu$.`,
      idea: String.raw`Since $|\mu(E)|\le|\mu|(E)$, both $|\mu|\pm\mu$ are nonnegative; they are countably additive because $|\mu|$ (6.2) and $\mu$ are, and bounded by 6.4. When $d\mu=f\,dx$, Theorem 6.13 gives $|\mu|=|f|\,dx$, so $\mu^\pm=f^\pm\,dx$ — the measure-theoretic version of $f=f^+-f^-$ (1.15). The Hahn decomposition (6.14) will show that $\mu^+$ and $\mu^-$ live on disjoint sets, and its corollary that no other splitting $\mu=\lambda_1-\lambda_2$ into positive measures uses less mass.`,
      caption: String.raw`Drag the blue handles to shape a signed density $f$ on $[0,1]$ and the gold handle to place a point mass (arrow height proportional to the mass, up = positive). Bottom: the distribution functions $t\mapsto\mu([0,t])$, $\mu^+([0,t])$, $\mu^-([0,t])$ and $|\mu|([0,t])$. The variations $\mu^\pm$ only increase; their difference is $\mu$ and their sum is $|\mu|$.`,
      deps: ['rca-6.2', 'rca-6.4', 'rca-6.1'],
      see: ['rca-1.15'],
      tags: ['real measures', 'Jordan decomposition'],
      viz(v) {
        const M = v.M;
        const T = v.stage({ x: [-0.03, 1.03], y: [-1.6, 1.6], height: 240, full: true, title: 'density $f$ (blue: $f^+$, red: $f^-$) and a point mass' });
        const Bt = v.stage({ x: [-0.03, 1.03], y: [-1, 1], height: 230, full: true, axes: 'box', xlabel: 't', title: 'distribution functions $t\\mapsto\\nu([0,t])$' });
        const Y0 = [0.7, 1.1, -0.2, -0.9, -0.4, 0.8, 0.3];
        const knots = Y0.map((y, i) => T.handle(i / 6, y, { color: 'accent', r: 6, constrain: (x, yy) => [i / 6, M.clamp(yy, -1.45, 1.45)] }));
        const atom = T.handle(0.45, 1.0, { color: 'gold', label: 'atom', labelPos: 'e', constrain: (x, y) => [M.clamp(x, 0.02, 0.98), M.clamp(y, -1.45, 1.45)] });
        const MASS = 0.3;
        let st = null;
        v.legend([['ink', '$\\mu$'], ['accent', '$\\mu^+$'], ['red', '$\\mu^-$'], ['purple', '$|\\mu|=\\mu^++\\mu^-$', { dash: true }]]);
        v.render(() => {
          const f = spline(knots.map((h) => h.y));
          const xa = atom.x, ma = MASS * atom.y;
          T.fn((x) => Math.max(0, f(x)), { color: 'accent', width: 0.01, fill: 'accent', fillAlpha: 0.25, domain: [0, 1], stroke: false });
          T.fn((x) => Math.min(0, f(x)), { color: 'red', width: 0.01, fill: 'red', fillAlpha: 0.25, domain: [0, 1], stroke: false });
          T.fn(f, { color: 'ink', width: 2, domain: [0, 1] });
          T.line(0, 0, 1, 0, { color: 'muted', width: 1 });
          T.arrow(xa, 0, xa, atom.y, { color: 'gold', width: 3, head: 9 });
          T.text(`mass ${v.fix(ma, 2)}`, xa, atom.y, { color: 'gold', dx: 12, dy: atom.y > 0 ? 14 : -14, size: 11.5 });
          // cumulative functions
          const N = 600, F = [], P = [], Nn = [], Vv = [];
          let F0 = 0, P0 = 0, N0 = 0, prev = f(0), jumped = false;
          const push = (x) => { F.push([x, F0]); P.push([x, P0]); Nn.push([x, N0]); Vv.push([x, P0 + N0]); };
          push(0);
          for (let i = 1; i <= N; i++) {
            const x = i / N, cur = f(x);
            const fp = (Math.max(0, prev) + Math.max(0, cur)) / (2 * N), fm = (Math.max(0, -prev) + Math.max(0, -cur)) / (2 * N);
            P0 += fp; N0 += fm; F0 += fp - fm; prev = cur;
            if (!jumped && x >= xa) {
              push(xa); F.push(null); P.push(null); Nn.push(null); Vv.push(null);
              F0 += ma; if (ma > 0) P0 += ma; else N0 -= ma; jumped = true; push(xa);
            }
            push(x);
          }
          const all = [...F, ...P, ...Nn, ...Vv].filter(Boolean).map((p) => p[1]);
          const lo = Math.min(0, ...all), hi = Math.max(...all);
          Bt.setView(null, [lo - 0.1 * (hi - lo), hi + 0.12 * (hi - lo)]);
          Bt.hline(0, { color: 'faint', width: 1 });
          Bt.vline(xa, { color: 'gold', width: 1, dash: [3, 3] });
          Bt.path(Vv, { color: 'purple', width: 2, dash: [6, 4] });
          Bt.path(P, { color: 'accent', width: 2.4 });
          Bt.path(Nn, { color: 'red', width: 2.4 });
          Bt.path(F, { color: 'ink', width: 2.4 });
          st = { P: P0, N: N0, F: F0 };
        });
        v.readout(() => {
          if (!st) return '';
          return String.raw`$\mu^+(X)=${v.fix(st.P, 3)}$, $\;\mu^-(X)=${v.fix(st.N, 3)}$, $\;\mu(X)=\mu^+(X)-\mu^-(X)=${v.fix(st.F, 3)}$, $\;\|\mu\|=|\mu|(X)=\mu^+(X)+\mu^-(X)=${v.fix(st.P + st.N, 3)}$`;
        });
      },
    },
  ],
};
