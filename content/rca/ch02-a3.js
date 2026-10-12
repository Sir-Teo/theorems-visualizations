// Rudin, Real and Complex Analysis — Chapter 2, part 3: the Riesz representation theorem and
// regularity of Borel measures (2.14–2.18).

function segD2(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1;
  let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L; t = t < 0 ? 0 : t > 1 ? 1 : t;
  const ex = a[0] + t * dx - p[0], ey = a[1] + t * dy - p[1];
  return ex * ex + ey * ey;
}
function polyDist(p, poly) { let d = Infinity; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) d = Math.min(d, segD2(p, poly[j], poly[i])); return Math.sqrt(d); }
function inPoly([x, y], poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function tnum(x, d = 3) {
  if (!isFinite(x)) return x > 0 ? '\\infty' : '-\\infty';
  if (x === 0) return '0';
  const a = Math.abs(x);
  if (a >= 1e-3 && a < 1e5) return String(Number(x.toPrecision(d)));
  const k = Math.floor(Math.log10(a)), m = x / Math.pow(10, k);
  return `${Number(m.toPrecision(d))}\\times 10^{${k}}`;
}
/** Simpson integral of f on [a,b] with n panels (n even) */
function simpson(f, a, b, n = 400) {
  if (b <= a) return 0; if (n % 2) n++;
  const h = (b - a) / n; let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2);
  return s * h / 3;
}
function bisectInc(F, target, lo, hi) { for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (F(m) < target) lo = m; else hi = m; } return (lo + hi) / 2; }

export default {
  book: 'rca',
  chapter: 2,
  items: [
    // ------------------------------------------------------------ 2.14
    {
      num: '2.14',
      kind: 'Theorem',
      name: 'Riesz representation theorem',
      statement: String.raw`Let $X$ be a locally compact Hausdorff space and $\Lambda$ a positive linear functional on $C_c(X)$. Then there are a $\sigma$-algebra $\mathfrak M$ in $X$ containing every Borel set and a unique positive measure $\mu$ on $\mathfrak M$ such that
(a) $\Lambda f=\int_X f\,d\mu$ for every $f\in C_c(X)$,
and which in addition satisfies:
(b) $\mu(K)<\infty$ for every compact $K\subset X$;
(c) $\mu(E)=\inf\{\mu(V): E\subset V,\ V\text{ open}\}$ for every $E\in\mathfrak M$;
(d) $\mu(E)=\sup\{\mu(K): K\subset E,\ K\text{ compact}\}$ for every open $E$, and for every $E\in\mathfrak M$ with $\mu(E)<\infty$;
(e) if $E\in\mathfrak M$, $A\subset E$ and $\mu(E)=0$, then $A\in\mathfrak M$.`,
      idea: String.raw`Uniqueness: by (c), (d) a measure is fixed by its values on compact sets, and Urysohn's lemma (2.12) gives $\mu(K)=\inf\{\Lambda f: K\prec f\}$, which depends only on $\Lambda$. Existence: define $\mu(V)=\sup\{\Lambda f: f\prec V\}$ for open $V$ and $\mu(E)=\inf\{\mu(V):E\subset V\}$ for all $E$. Partitions of unity (2.13) give countable subadditivity, Urysohn separates disjoint compact sets to give additivity, and the class of sets that are inner regular on compact pieces turns out to be a $\sigma$-algebra containing the Borel sets. Finally, slicing the range of $f$ into thin layers and using a partition of unity squeezes $\Lambda f$ between $\int f\,d\mu\pm\eps$.`,
      caption: String.raw`$X=\R$ and $\Lambda f=\int f\,d\mu$ for a hidden $\mu$ (orange: a density plus two point masses). Only $\Lambda$ is used to recover $\mu$. For compact $K=[a,b]$ the tents $f_\eta$ with $K\prec f_\eta$ give $\Lambda f_\eta$ decreasing to $\mu(K)$. For open $V=(a,b)$ the functions $f_\eta\prec V$ give $\Lambda f_\eta$ increasing to $\mu(V)$. Drag the endpoints and the large atom: with the atom sitting at $a$, $\mu([a,b])$ and $\mu((a,b))$ differ by its mass.`,
      deps: ['rca-2.12', 'rca-2.13', 'rca-2.11', 'rca-2.2', 'rca-1.18', 'rca-1.11'],
      see: ['rca-6.19', 'rca-2.18', 'rca-2.20'],
      tags: ['Riesz representation', 'measure', 'linear functional'],
      viz(v) {
        const M = v.M;
        const mode = v.select('', [{ value: 'K', label: String.raw`compact $K=[a,b]$: $\mu(K)=\inf\Lambda f$, $K\prec f$` }, { value: 'V', label: String.raw`open $V=(a,b)$: $\mu(V)=\sup\Lambda f$, $f\prec V$` }], 'K');
        const eta = v.slider('ramp width $\\eta$', 0.004, 0.3, 0.12, { log: true, fmt: (x) => x.toFixed(3) });
        const T = v.stage({ x: [-0.06, 1.06], y: [-0.36, 1.42], height: 300, full: true, axes: false, title: 'the hidden measure $\\mu$ (orange) and the test function $f_\\eta$' });
        const B = v.stage({ x: [0, 0.31], y: [0, 1], height: 190, full: true, axes: 'box', xlabel: 'η', title: '$\\eta\\mapsto\\Lambda f_\\eta$ — computed from $\\Lambda$ alone' });
        const w = (x) => (x < 0 || x > 1 ? 0 : 0.35 + 0.95 * Math.sin(Math.PI * x) ** 2 * (0.6 + 0.4 * Math.cos(4 * x)));
        const yA = -0.18;
        const a = T.handle(0.32, yA, { color: 'green', label: 'a', constrain: (x) => [Math.min(x, b.x - 0.03), yA] });
        const b = T.handle(0.71, yA, { color: 'green', label: 'b', constrain: (x) => [Math.max(x, a.x + 0.03), yA] });
        a.labelPos = 's'; b.labelPos = 's';
        const fixedAtom = [0.86, 0.12];
        const atom = T.handle(0.32, 0.62, { color: 'orange', r: 6, constrain: (x) => { let xx = Math.max(0, Math.min(1, x)); if (Math.abs(xx - a.x) < 0.012) xx = a.x; if (Math.abs(xx - b.x) < 0.012) xx = b.x; return [xx, 0.62]; } });
        const mA = 0.28;
        const atoms = () => [[atom.x, mA], fixedAtom];
        const Lam = (f) => simpson((x) => f(x) * w(x), -0.06, 1.06, 2400) + atoms().reduce((s, [p, m]) => s + m * f(p), 0);
        const fK = (e) => (x) => { const d = x < a.x ? a.x - x : x > b.x ? x - b.x : 0; return Math.max(0, 1 - d / e); };
        const fV = (e) => (x) => { const d = Math.min(x - a.x, b.x - x); return Math.max(0, Math.min(1, (d - e / 2) / (e / 2))); };
        let st = {};
        v.render(() => {
          const K = mode.value === 'K', e = eta.value;
          const fe = (K ? fK : fV)(e);
          // hidden measure
          T.fn((x) => 0.42 * w(x), { domain: [0, 1], color: 'orange', width: 1.4, fill: 'orange', fillAlpha: 0.2 });
          for (const [p, m] of atoms()) { T.line(p, 0, p, m * 2.2, { color: 'orange', width: 2.6 }); }
          T.dot(fixedAtom[0], fixedAtom[1] * 2.2, { color: 'orange', r: 4.5 });
          T.tex(String.raw`${mA}\,\delta`, atom.x, 0.62, { color: 'orange', dx: 10, dy: -12, align: 'left', size: 12 });
          T.tex(String.raw`${fixedAtom[1]}\,\delta`, fixedAtom[0], fixedAtom[1] * 2.2, { color: 'orange', dx: 8, dy: -10, align: 'left', size: 12 });
          T.line(-0.06, 0, 1.06, 0, { color: 'faint', width: 1 });
          // the test function
          T.fn(fe, { color: K ? 'green' : 'accent', width: 2.6, fill: K ? 'green' : 'accent', fillAlpha: 0.08, n: 1400 });
          T.hline(1, { color: 'faint', width: 1, dash: [3, 4] });
          T.tex('1', -0.055, 1, { color: 'muted', size: 12, align: 'left' });
          // the set on the axis
          T.line(a.x, yA, b.x, yA, { color: K ? 'green' : 'accent', width: 5, alpha: 0.7, cap: 'butt' });
          T.tex(K ? 'K' : 'V', (a.x + b.x) / 2, yA, { color: K ? 'green' : 'accent', dy: -13, size: 14 });
          T.tex(K ? 'K\\prec f_\\eta' : 'f_\\eta\\prec V', b.x + (K ? e : 0) + 0.01, 0.5, { color: K ? 'green' : 'accent', align: 'left', size: 14 });
          if (!K) { T.dot(a.x, yA, { color: 'accent', r: 7.5, hollow: true, width: 2 }); T.dot(b.x, yA, { color: 'accent', r: 7.5, hollow: true, width: 2 }); }
          // exact values from the hidden measure
          const base = simpson(w, a.x, b.x, 800);
          const inK = atoms().filter(([p]) => p >= a.x - 1e-12 && p <= b.x + 1e-12).reduce((s, [, m]) => s + m, 0);
          const inV = atoms().filter(([p]) => p > a.x + 1e-12 && p < b.x - 1e-12).reduce((s, [, m]) => s + m, 0);
          const target = base + (K ? inK : inV);
          // the curve η ↦ Λ f_η
          const es = M.linspace(0.002, 0.31, 90);
          const Ls = es.map((x) => Lam((K ? fK : fV)(x)));
          const lo = Math.min(target, ...Ls), hi = Math.max(target, ...Ls), pad = (hi - lo) * 0.18 + 0.02;
          B.setView(null, [lo - 1.6 * pad, hi + 1.6 * pad]);
          B.hline(target, { color: K ? 'green' : 'accent', width: 1.6, dash: [6, 4] });
          B.path(es.map((x, i) => [x, Ls[i]]), { color: 'ink', width: 2.2 });
          const Le = Lam(fe);
          B.dot(e, Le, { color: 'gold', r: 6 });
          B.dot(0, target, { color: K ? 'green' : 'accent', r: 6 });
          B.tex(K ? String.raw`\mu(K)=\inf_\eta\Lambda f_\eta` : String.raw`\mu(V)=\sup_\eta\Lambda f_\eta`, 0.305, target, { color: K ? 'green' : 'accent', align: 'right', dy: K ? 13 : -13, size: 13 });
          st = { K, Le, target, gap: Math.abs(Le - target), atAend: Math.abs(atom.x - a.x) < 1e-9 || Math.abs(atom.x - b.x) < 1e-9, muK: base + inK, muV: base + inV };
        });
        v.legend([['orange', 'hidden $\\mu$: density and atoms', { area: true }], ['green', '$K\\prec f_\\eta$'], ['accent', '$f_\\eta\\prec V$'], ['ink', '$\\Lambda f_\\eta$']]);
        v.readout(() => `$\\Lambda f_\\eta=${v.fix(st.Le, 4)}$, $\\;${st.K ? '\\mu(K)' : '\\mu(V)'}=${v.fix(st.target, 4)}$ (gap $${tnum(st.gap)}$). ` +
          (st.atAend ? `The big atom sits at an endpoint: $\\mu([a,b])=${v.fix(st.muK, 3)}$ but $\\mu((a,b))=${v.fix(st.muV, 3)}$ — the inf over $K\\prec f$ catches it, the sup over $f\\prec V$ never does.` : `Here $\\mu([a,b])=${v.fix(st.muK, 3)}$ and $\\mu((a,b))=${v.fix(st.muV, 3)}$; drag the big atom onto $a$ or $b$ to separate them.`));
      },
    },
    // ------------------------------------------------------------ 2.15
    {
      num: '2.15',
      kind: 'Definition',
      name: 'Borel measures; inner and outer regularity',
      statement: String.raw`A measure $\mu$ defined on the $\sigma$-algebra of all Borel sets of a locally compact Hausdorff space $X$ is called a *Borel measure* on $X$. If $\mu$ is positive, a Borel set $E$ is *outer regular* if
$$\mu(E)=\inf\{\mu(V): E\subset V,\ V\text{ open}\},$$
and *inner regular* if
$$\mu(E)=\sup\{\mu(K): K\subset E,\ K\text{ compact}\}.$$
If every Borel set is both outer and inner regular, $\mu$ is called *regular*.`,
      idea: String.raw`Regularity lets topology approximate measure: every Borel set is squeezed between compact sets from inside and open sets from outside. The measure built in 2.14 is outer regular everywhere and inner regular on open sets and on sets of finite measure. Theorems 2.17 and 2.18 give conditions for full regularity.`,
      caption: String.raw`$E$ is a ring-shaped region in the plane and $\mu$ is area weighted by the density shown in grey. $K_r$ (green) is the compact set of points of $E$ at distance $\ge r$ from $E^c$, and $V_r$ is the open $r$-neighbourhood of $E$ (orange). Shrink $r$: the right panel shows $\mu(K_r)\uparrow\mu(E)$ and $\mu(V_r)\downarrow\mu(E)$.`,
      deps: ['rca-2.3', 'rca-1.11', 'rca-1.18'],
      see: ['rca-2.17', 'rca-2.18'],
      tags: ['regularity', 'Borel measure'],
      viz(v) {
        const M = v.M;
        const L = v.stage({ x: [-2.3, 2.3], y: [-1.55, 1.55], equal: true, height: 340, axes: false, minWidth: 320, weight: 1.2, title: '$K_r\\subset E\\subset V_r$' });
        const R = v.stage({ x: [0, 0.6], y: [0, 1], height: 340, axes: 'box', xlabel: 'r', minWidth: 260, title: '$\\mu(K_r)\\le\\mu(E)\\le\\mu(V_r)$' });
        const r = v.slider('$r$', 0.01, 0.55, 0.22, { step: 0.005 });
        const outer = M.blob(0.05, 0, 1.25, 31, 0.24, 150), hole = M.blob(0.25, 0.1, 0.48, 8, 0.3, 90);
        const dens = (x, y) => 0.35 + 1.1 * Math.exp(-((x + 0.7) ** 2 + (y - 0.35) ** 2) / 0.9);
        // precompute a grid: signed distance (negative inside E) and weights
        const h = 0.025, G = [];
        for (let x = -2.3 + h / 2; x < 2.3; x += h) for (let y = -1.55 + h / 2; y < 1.55; y += h) {
          const inO = inPoly([x, y], outer), inH = inPoly([x, y], hole), inE = inO && !inH;
          const d = Math.min(polyDist([x, y], outer), polyDist([x, y], hole));
          const dE = inE ? -d : (inH ? polyDist([x, y], hole) : polyDist([x, y], outer));
          G.push([x, y, dE, dens(x, y) * h * h]);
        }
        const muE = G.reduce((s, g) => s + (g[2] < 0 ? g[3] : 0), 0);
        const muK = (rr) => G.reduce((s, g) => s + (g[2] <= -rr ? g[3] : 0), 0);
        const muV = (rr) => G.reduce((s, g) => s + (g[2] < rr ? g[3] : 0), 0);
        const rs = M.linspace(0, 0.6, 61), cK = rs.map(muK), cV = rs.map(muV);
        const sdist = (x, y) => { const inO = inPoly([x, y], outer), inH = inPoly([x, y], hole); const d = Math.min(polyDist([x, y], outer), polyDist([x, y], hole)); return inO && !inH ? -d : (inH ? polyDist([x, y], hole) : polyDist([x, y], outer)); };
        let st = {};
        v.render(() => {
          const rr = r.value;
          const gC = v.rgb('green'), oC = v.rgb('orange'), aC = v.rgb('accent'), mC = v.rgb('muted');
          L.raster((x, y) => {
            const d = sdist(x, y);
            if (d <= -rr) return [gC[0], gC[1], gC[2], 150];
            if (d < 0) return [aC[0], aC[1], aC[2], 70];
            if (d < rr) return [oC[0], oC[1], oC[2], 95];
            const t = Math.min(1, (dens(x, y) - 0.35) / 1.1); return [mC[0], mC[1], mC[2], Math.round(10 + 45 * t)];
          }, { res: 2, key: rr });
          L.poly(outer, { color: 'accent', width: 1.8 }); L.poly(hole, { color: 'accent', width: 1.8 });
          L.tex('E', 1.05, -0.95, { color: 'accent', size: 18 });
          R.setView(null, [0, Math.max(...cV) * 1.05]);
          R.hline(muE, { color: 'accent', dash: [6, 4], width: 1.5 });
          R.path(rs.map((x, i) => [x, cV[i]]), { color: 'orange', width: 2.4 });
          R.path(rs.map((x, i) => [x, cK[i]]), { color: 'green', width: 2.4 });
          const k = muK(rr), V = muV(rr);
          R.line(rr, k, rr, V, { color: 'gold', width: 3, alpha: 0.6 });
          R.dot(rr, V, { color: 'orange', r: 5 }); R.dot(rr, k, { color: 'green', r: 5 });
          R.tex('\\mu(E)', 0.6, muE, { color: 'accent', align: 'right', dy: -11, dx: -4, size: 13 });
          st = { k, V, rr };
        });
        v.legend([['green', 'compact $K_r\\subset E$', { area: true }], ['accent', '$E$', { area: true }], ['orange', 'open $V_r\\supset E$', { area: true }], ['gold', 'the gap $\\mu(V_r)-\\mu(K_r)$']]);
        v.readout(() => `$\\mu(K_r)=${v.fix(st.k, 3)}\\ \\le\\ \\mu(E)=${v.fix(muE, 3)}\\ \\le\\ \\mu(V_r)=${v.fix(st.V, 3)}$; the gap $${v.fix(st.V - st.k, 3)}$ tends to $0$ with $r$ — every set here is inner and outer regular.`);
      },
    },
    // ------------------------------------------------------------ 2.16
    {
      num: '2.16',
      kind: 'Definition',
      name: 'σ-compact sets and σ-finite measure',
      statement: String.raw`A set $E$ in a topological space is *$\sigma$-compact* if it is a countable union of compact sets. A set $E$ in a measure space with measure $\mu$ has *$\sigma$-finite measure* if it is a countable union of sets $E_i$ with $\mu(E_i)<\infty$.`,
      idea: String.raw`In a $\sigma$-compact space $X=\bigcup K_n$, every set of the representing measure in 2.14 has $\sigma$-finite measure, since $\mu(K_n)<\infty$ by 2.14(b). For example, $\R^k$ is the union of the closed balls of radius $n$.`,
      deps: ['rca-2.3', 'rca-1.18'],
      tags: ['σ-compact', 'σ-finite'],
    },
    // ------------------------------------------------------------ 2.17
    {
      num: '2.17',
      kind: 'Theorem',
      name: 'Regularity in σ-compact spaces',
      statement: String.raw`Let $X$ be a locally compact, $\sigma$-compact Hausdorff space, and let $\mathfrak M$ and $\mu$ be as in the Riesz representation theorem 2.14. Then:
(a) for every $E\in\mathfrak M$ and $\eps>0$ there are a closed $F$ and an open $V$ with $F\subset E\subset V$ and $\mu(V-F)<\eps$;
(b) $\mu$ is a regular Borel measure on $X$;
(c) for every $E\in\mathfrak M$ there are an $F_\sigma$ set $A$ and a $G_\delta$ set $B$ with $A\subset E\subset B$ and $\mu(B-A)=0$.`,
      idea: String.raw`Write $X=\bigcup K_n$. Each $E\cap K_n$ has finite measure, so 2.14(c) gives open $V_n\supset E\cap K_n$ with $\mu(V_n-(E\cap K_n))<\eps/2^{n+2}$. Then $V=\bigcup V_n$ satisfies $\mu(V-E)<\eps/2$. Applying the same to $E^c$ gives an open $W\supset E^c$, and $F=W^c$ is closed with $\mu(E-F)<\eps/2$. Every closed set is $\sigma$-compact ($F=\bigcup F\cap K_n$), which gives inner regularity (b). Taking $\eps=1/j$ and intersecting or uniting gives (c).`,
      caption: String.raw`$X=\R^2$ and $E$ is the region under a wavy curve over $[0,\infty)$, of infinite area. Each slab $E_n$ gets its own error budget $\eps/2^{n+2}$ on each side: an open $V_n$ (orange band) outside and a closed $F_n$ (green) inside. The bands thin out as $n$ grows, so the total area of $V-F$ stays below $\eps$, although no compact subset of $E$ comes close in measure. The right panel magnifies slab $n$.`,
      deps: ['rca-2.14', 'rca-2.15', 'rca-2.16'],
      see: ['rca-2.20'],
      tags: ['regularity', 'σ-compact'],
      viz(v) {
        const M = v.M;
        const eps = v.slider('$\\varepsilon$', 0.2, 2, 1.2, { step: 0.01 });
        const nz = v.slider('magnified slab $n$', 1, 6, 2, { int: true });
        const L = v.stage({ x: [-0.3, 7.5], y: [-0.25, 1.6], height: 280, full: true, axes: false, title: '$F=\\bigcup F_n\\subset E\\subset V=\\bigcup V_n$ — the first slabs of infinitely many' });
        const Z = v.stage({ x: [0, 1], y: [0, 1], height: 260, axes: false, minWidth: 300, title: 'slab $n$, magnified' });
        const Bb = v.stage({ x: [-0.2, 6.6], y: [0, 1], height: 260, axes: 'box', minWidth: 260, title: 'error budget per slab: $\\mu(V_n-F_n)$', xticks: [1, 2, 3, 4, 5, 6] });
        const g = (x) => 0.95 + 0.32 * Math.sin(1.7 * x) + 0.14 * Math.sin(4.1 * x + 1);
        const areaE = (n) => simpson(g, n - 1, n, 200);
        const outerExtra = (n, t) => simpson((x) => g(x) + 2 * t, n - 1 - t, n + t, 200) - areaE(n); // μ(V_n − E_n)
        const innerLoss = (n, s) => areaE(n) - simpson((x) => g(x) - 2 * s, n - 1 + s, n - s, 200); // μ(E_n − F_n)
        let st = {};
        v.render(() => {
          const e = eps.value, NS = 7;
          const T = [], S = [];
          for (let n = 1; n <= NS; n++) {
            const budget = e / 2 ** (n + 2);
            T.push(bisectInc((t) => outerExtra(n, t), budget, 0, 0.5));
            S.push(bisectInc((s) => innerLoss(n, s), budget, 0, 0.3));
          }
          const drawSlab = (Sg, n, t, s) => {
            const xs = M.linspace(n - 1 - t, n + t, 120);
            Sg.poly(xs.map((x) => [x, g(x) + t]).concat([[n + t, -t], [n - 1 - t, -t]]), { fill: 'orange', fillAlpha: 0.75, stroke: false });
            const xi = M.linspace(n - 1 + s, n - s, 120);
            Sg.poly(xi.map((x) => [x, g(x) - s]).concat([[n - s, s], [n - 1 + s, s]]), { fill: 'panel', fillAlpha: 1, stroke: false });
            Sg.poly(xi.map((x) => [x, g(x) - s]).concat([[n - s, s], [n - 1 + s, s]]), { fill: 'green', fillAlpha: 0.3, color: 'green', width: 1.2 });
          };
          for (let n = 1; n <= NS; n++) drawSlab(L, n, T[n - 1], S[n - 1]);
          L.fn(g, { domain: [0, 7.5], color: 'accent', width: 2 });
          L.line(0, 0, 7.5, 0, { color: 'accent', width: 2 }); L.line(0, 0, 0, g(0), { color: 'accent', width: 2 });
          for (let n = 1; n <= NS; n++) { L.vline(n, { color: 'muted', width: 1, dash: [3, 4], alpha: 0.7 }); L.tex(`E_{${n}}`, n - 0.5, 0.42, { color: 'ink', size: 13 }); }
          L.text('…', 7.35, 0.6, { color: 'muted', size: 20 });
          L.tex(String.raw`\mu(E)=\infty`, 0.1, 1.42, { color: 'accent', align: 'left', size: 14 });
          L.vband(nz.value - 1, nz.value, { color: 'gold', alpha: 0.08 });
          // magnified slab (zoom on its top-right corner region to show both bands)
          const n = nz.value, t = T[n - 1], s = S[n - 1];
          const cx = n - 0.5, cy = g(n - 0.5), half = Math.max(7 * Math.max(t, s), 0.004);
          Z.setView([cx - half, cx + half], [cy - half * 0.8, cy + half * 0.8]);
          drawSlab(Z, n, t, s);
          Z.measure(cx + half * 0.45, g(cx + half * 0.45), cx + half * 0.45, g(cx + half * 0.45) + t, null, { color: 'orange' });
          Z.measure(cx - half * 0.45, g(cx - half * 0.45), cx - half * 0.45, g(cx - half * 0.45) - s, null, { color: 'green' });
          Z.fn(g, { color: 'accent', width: 2, n: 400 });
          Z.corner(`zoom ×${Math.round(7.8 / (2 * half))}`, 'tl', { color: 'muted' });
          Z.tex('V_' + n, cx, cy + t, { color: 'orange', dy: -14, size: 14 }); Z.tex('F_' + n, cx, cy - s, { color: 'green', dy: 16, size: 14 });
          // budget bars
          const bud = T.map((tt, i) => outerExtra(i + 1, tt) + innerLoss(i + 1, S[i]));
          Bb.setView(null, [0, e / 4 * 1.25]);
          Bb.bars(bud.slice(0, 6), { color: (val, i) => (i + 1 === n ? 'gold' : 'orange'), x0: 1 });
          let cum = 0; const cp = bud.slice(0, 6).map((b, i) => { cum += b; return [i + 1, cum]; });
          st = { total: bud.reduce((a, b) => a + b, 0) + e / 2 ** (NS + 1), e, t, s, n };
        });
        v.legend([['accent', 'boundary of $E$'], ['green', 'closed $F_n\\subset E_n$', { area: true }], ['orange', 'open $V_n\\supset E_n$', { area: true }]]);
        v.readout(() => `Budget $\\eps/2^{n+2}$ per side per slab: $\\mu(V-F)\\le\\sum_n 2\\cdot\\eps/2^{n+2}=\\eps/2=${v.fix(st.e / 2, 3)}<\\eps$, although $\\mu(E)=\\infty$. Slab ${st.n}: outer band $${tnum(st.t)}$ thick, inner margin $${tnum(st.s)}$.`);
      },
    },
    // ------------------------------------------------------------ 2.18
    {
      num: '2.18',
      kind: 'Theorem',
      name: 'Locally finite Borel measures are regular',
      statement: String.raw`Let $X$ be a locally compact Hausdorff space in which every open set is $\sigma$-compact, and let $\lambda$ be a positive Borel measure on $X$ with $\lambda(K)<\infty$ for every compact $K$. Then $\lambda$ is regular.`,
      idea: String.raw`$\Lambda f=\int f\,d\lambda$ is a positive linear functional on $C_c(X)$, so 2.14 produces a measure $\mu$ for which 2.17 holds. For open $V=\bigcup K_i$, choose $f_n$ with $K_1\cup\dots\cup K_n\prec f_n\prec V$, increasing in $n$. Then $f_n\uparrow\chi_V$, and monotone convergence gives $\lambda(V)=\lim\int f_n\,d\lambda=\lim\int f_n\,d\mu=\mu(V)$. Finally 2.17(a) squeezes every Borel set between a closed and an open set whose difference is small for $\mu$, hence also for $\lambda$.`,
      caption: String.raw`On $\R$, pick a point $e$ (gold) and shrink the open intervals $V_r=(e-r,e+r)$. For a locally finite $\lambda$ (density plus atoms), $\lambda(V_r)\downarrow\lambda(\{e\})$: outer regularity. Switch to $\lambda=\sum_n\delta_{1/n}$, which gives the compact set $[0,1]$ infinite mass. At $e=0$, every $V_r$ has $\lambda(V_r)=\infty$ while $\lambda(\{0\})=0$, so regularity fails.`,
      deps: ['rca-2.14', 'rca-2.17', 'rca-2.12', 'rca-1.26'],
      see: ['rca-2.20'],
      tags: ['regularity', 'Borel measure'],
      viz(v) {
        const M = v.M;
        const mode = v.select('$\\lambda$', [{ value: 'good', label: 'density + 3 atoms (locally finite)' }, { value: 'bad', label: String.raw`$\sum_n\delta_{1/n}$ (not locally finite)` }], 'good');
        const r = v.slider('$r$', 0.003, 0.5, 0.25, { log: true, fmt: (x) => x.toFixed(3) });
        const T = v.stage({ x: [-0.55, 1.15], y: [-0.36, 1.1], height: 260, full: true, axes: false, title: 'the measure $\\lambda$ and the open set $V_r=(e-r,e+r)$' });
        const B = v.stage({ x: [0, 0.5], y: [0, 2], height: 220, full: true, axes: 'box', xlabel: 'r', title: '$r\\mapsto\\lambda(V_r)$' });
        const atomsG = [[0.2, 0.35], [0.55, 0.25], [0.9, 0.18]];
        const w = (x) => 0.25 + 0.55 * Math.exp(-((x - 0.4) ** 2) / 0.08);
        const e = T.handle(0.2, 0, { color: 'gold', label: 'e', constrain: (x) => [x, 0] });
        e.labelPos = 's';
        const NB = 4000;
        const lam = (lo, hi, bad) => {
          if (bad) { if (lo < 0 && hi > 0) return Infinity; let c = 0; for (let n = 1; n <= NB; n++) { const p = 1 / n; if (p > lo && p < hi) c++; } return lo <= 0 && hi > 0 ? Infinity : c; }
          return simpson(w, lo, hi, 300) + atomsG.filter(([p]) => p > lo && p < hi).reduce((s, [, m]) => s + m, 0);
        };
        const point = (x, bad) => bad ? (x > 0 && Math.abs(1 / x - Math.round(1 / x)) < 1e-9 ? 1 : 0) : atomsG.filter(([p]) => Math.abs(p - x) < 1e-9).reduce((s, [, m]) => s + m, 0);
        let st = {}, lastMode = 'good';
        v.render(() => {
          const bad = mode.value === 'bad';
          if (mode.value !== lastMode) { lastMode = mode.value; e.x = bad ? 0 : 0.2; }
          // snap e to an atom if close
          const snapTo = bad ? [0, 1, 0.5, 1 / 3, 0.25] : atomsG.map(([p]) => p);
          for (const p of snapTo) if (Math.abs(e.x - p) < 0.012) e.x = p;
          T.line(-0.55, 0, 1.15, 0, { color: 'faint', width: 1 });
          if (!bad) {
            T.fn((x) => 0.6 * w(x), { color: 'orange', width: 1.4, fill: 'orange', fillAlpha: 0.2 });
            for (const [p, m] of atomsG) { T.line(p, 0, p, 2.2 * m, { color: 'orange', width: 2.4 }); T.dot(p, 2.2 * m, { color: 'orange', r: 4.5 }); }
          } else {
            for (let n = 1; n <= 400; n++) { const p = 1 / n; T.line(p, 0, p, 0.55, { color: 'orange', width: 1, alpha: Math.max(0.15, 1 - n / 60) }); }
            for (let n = 1; n <= 6; n++) T.dot(1 / n, 0.55, { color: 'orange', r: 3.5 });
            T.tex(String.raw`\delta_{1/n}`, 0.5, 0.55, { color: 'orange', dy: -14, size: 13 });
            T.tex(String.raw`\lambda([0,1])=\infty`, 0.05, 0.95, { color: 'red', align: 'left', size: 13 });
          }
          const rr = r.value;
          T.vband(e.x - rr, e.x + rr, { color: 'accent', alpha: 0.12 });
          T.line(e.x - rr, -0.25, e.x + rr, -0.25, { color: 'accent', width: 4, cap: 'butt' });
          T.dot(e.x - rr, -0.25, { color: 'accent', r: 4, hollow: true }); T.dot(e.x + rr, -0.25, { color: 'accent', r: 4, hollow: true });
          T.tex('V_r', e.x + rr, -0.25, { color: 'accent', align: 'left', dx: 8, size: 13 });
          // curve r ↦ λ(V_r)
          const rs = M.linspace(0.003, 0.5, 160);
          const vals = rs.map((x) => lam(e.x - x, e.x + x, bad));
          const pt = point(e.x, bad);
          const finite = vals.filter(isFinite);
          const top = Math.min(bad ? 12 : Infinity, Math.max(1, pt, ...(finite.length ? finite : [1])) * 1.15);
          B.setView(null, [0, top]);
          B.hline(pt, { color: 'green', dash: [6, 4], width: 1.6 });
          B.tex(String.raw`\lambda(\{e\})=${v.fix(pt, 2)}`, 0.49, pt, { color: 'green', align: 'right', dy: -11, size: 13 });
          B.path(rs.map((x, i) => (isFinite(vals[i]) ? [x, Math.min(vals[i], top * 1.5)] : null)), { color: 'accent', width: 2.4 });
          const iInf = vals.findIndex((x) => !isFinite(x));
          if (iInf >= 0) { B.vband(rs[iInf], 0.5, { color: 'red', alpha: 0.12 }); B.text(iInf === 0 ? 'λ(Vᵣ) = ∞ for every r > 0' : 'λ(Vᵣ) = ∞ once Vᵣ ∋ 0', (rs[iInf] + 0.5) / 2, top * 0.88, { color: 'red', weight: 600, align: 'center', size: 13 }); }
          const cur = lam(e.x - rr, e.x + rr, bad);
          if (isFinite(cur)) B.dot(rr, cur, { color: 'gold', r: 5.5 });
          st = { cur, pt, bad, ex: e.x };
        });
        v.legend([['orange', '$\\lambda$ (density / atoms)', { area: true }], ['accent', '$\\lambda(V_r)$'], ['green', '$\\lambda(\\{e\\})$', { dash: true }]]);
        v.readout(() => isFinite(st.cur) ? `$\\lambda(V_r)=${v.fix(st.cur, 4)}\\ \\downarrow\\ \\lambda(\\{e\\})=${v.fix(st.pt, 3)}$ as $r\\to0$ — outer regular at $e=${v.fix(st.ex, 3)}$.`
          : `Every neighbourhood of $0$ contains infinitely many atoms $1/n$, so $\\inf_r\\lambda(V_r)=\\infty\\neq0=\\lambda(\\{0\\})$. The hypothesis $\\lambda(K)<\\infty$ for compact $K$ fails, and so does regularity.`);
      },
    },
  ],
};
