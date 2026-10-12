// Rudin, Real and Complex Analysis — Chapter 6 (part 3): consequences of Radon–Nikodym, duality of Lᵖ, Riesz representation
const TAU = 2 * Math.PI;

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
/** Draw a unit circle whose colour encodes the argument (hue), matching the phase colouring of densities. */
function hueCircle(S, M, r = 1, width = 5) {
  const n = 120;
  for (let k = 0; k < n; k++) {
    const a0 = TAU * k / n, a1 = TAU * (k + 1.05) / n;
    S.path([[r * Math.cos(a0), r * Math.sin(a0)], [r * Math.cos((a0 + a1) / 2), r * Math.sin((a0 + a1) / 2)], [r * Math.cos(a1), r * Math.sin(a1)]], { color: M.hsl2rgb((a0 + a1) / 2 / TAU, 0.62, 0.55), width, cap: 'butt' });
  }
}

export default {
  book: 'rca',
  chapter: 6,
  items: [
    // ------------------------------------------------------------------ consequences of Radon–Nikodym
    {
      num: '6.12',
      kind: 'Theorem',
      name: 'Polar decomposition dμ = h d|μ|',
      statement: String.raw`Let $\mu$ be a complex measure on a σ-algebra $\mathfrak M$ in $X$. Then there is a measurable function $h$ with $|h(x)|=1$ for every $x\in X$ such that
$$d\mu=h\,d|\mu| .$$`,
      idea: String.raw`Since $|\mu(E)|\le|\mu|(E)$, $\mu\ll|\mu|$, and Radon–Nikodym (6.10) gives $h\in L^1(|\mu|)$ with $d\mu=h\,d|\mu|$. Its averages $\mu(E)/|\mu|(E)$ lie in the closed unit disc, so $|h|\le1$ a.e. (1.40). If $A_r=\{|h|<r\}$ with $r<1$, then for any partition $\{E_j\}$ of $A_r$, $\sum|\mu(E_j)|=\sum\big|\int_{E_j}h\,d|\mu|\big|\le r\,|\mu|(A_r)$; taking the supremum gives $|\mu|(A_r)\le r|\mu|(A_r)$, so $|\mu|(A_r)=0$. Hence $|h|=1$ a.e., and $h$ may be redefined on a null set.`,
      caption: String.raw`A complex measure on $[0,1]$: a density $g$ (height $|g|$, hue $\arg g$) plus two small atoms. Drag the point $x$ (it snaps onto an atom) and shrink the window $E=[x-r,x+r]$. Left: the average $\mu(E)/|\mu|(E)$ always lies in the closed unit disc, and as $r\to0$ it moves out to the unit circle, landing on $h(x)=g(x)/|g(x)|$ (or the phase of the atom). The trail shows the average for every $r$; right, its modulus tends to $1$.`,
      deps: ['rca-6.10', 'rca-1.40', 'rca-6.2', 'rca-6.4'],
      tags: ['polar decomposition', 'complex measures'],
      viz(v) {
        const M = v.M, Cx = v.Cx;
        const rad = (x) => 0.95 + 0.55 * Math.sin(TAU * x + 0.8);
        const ang = (x) => -1.2 + TAU * 1.3 * x + 0.7 * Math.sin(3 * x);
        const g = (x) => [rad(x) * Math.cos(ang(x)), rad(x) * Math.sin(ang(x))];
        const G = cumulative(g, 4000);
        const ATOMS = [{ x: 0.27, m: Cx.polar(0.12, 2.6) }, { x: 0.78, m: Cx.polar(0.09, -0.35) }];
        const rS = v.slider('window radius $r$', 0.0005, 0.5, 0.12, { log: true, decimals: 4 });
        const L = v.stage({ x: [-0.02, 1.02], y: [-0.5, 1.75], height: 160, full: true, axes: false, title: 'the measure on $[0,1]$ and the window $E=[x-r,x+r]$' });
        const D = v.stage({ x: [-1.2, 1.2], y: [-1.2, 1.2], equal: true, height: 320, axes: false, title: 'the averages $\\mu(E)/|\\mu|(E)$ in the closed unit disc' });
        const C = v.stage({ x: [-3.3, Math.log10(0.5)], y: [0, 1.08], height: 320, axes: 'box', xlabel: 'r', title: '$|\\mu(E)|/|\\mu|(E)$ as the window shrinks',
          xticks: [[-3, '0.001'], [-2, '0.01'], [-1, '0.1']] });
        const snap = (x) => { for (const a of ATOMS) if (Math.abs(x - a.x) < 0.015) return a.x; return M.clamp(x, 0, 1); };
        const X = L.handle(0.52, 0, { color: 'ink', label: 'x', labelPos: 's', constrain: (x) => [snap(x), 0] });
        const muE = (a, b) => {
          a = Math.max(0, a); b = Math.min(1, b);
          let re = G.re(b) - G.re(a), im = G.im(b) - G.im(a), ab = G.abs(b) - G.abs(a);
          for (const at of ATOMS) if (at.x >= a && at.x <= b) { re += at.m.re; im += at.m.im; ab += at.m.abs(); }
          return [re / ab, im / ab, re, im, ab];
        };
        let st = null;
        v.legend([['gold', 'average over $E$ (current $r$)', { dot: true }], ['muted', 'trail as $r$ decreases'], ['green', '$h(x)$ on the unit circle', { dot: true }]]);
        v.render(() => {
          const x = X.x, r = rS.value;
          // strip
          L.raster((xx, y) => {
            if (xx < 0 || xx > 1 || y < 0) return null;
            const [re, im] = g(xx), m = Math.hypot(re, im);
            if (y > m * 1.03) return null;
            return [...M.hsl2rgb(Math.atan2(im, re) / TAU, 0.62, 0.56), 225];
          }, { key: 'strip', res: 1 });
          L.fn((xx) => rad(xx), { domain: [0, 1], color: 'ink', width: 1, alpha: 0.35 });
          L.vband(Math.max(0, x - r), Math.min(1, x + r), { color: 'orange', alpha: 0.22, edges: true });
          L.line(0, 0, 1, 0, { color: 'muted', width: 1 });
          for (const a of ATOMS) { const col = M.hsl2rgb(a.m.arg() / TAU, 0.7, 0.45); L.arrow(a.x, 0, a.x, 1.62, { color: col, width: 2.4, head: 8 }); L.text('atom', a.x, 1.62, { color: col, dx: 6, size: 11, baseline: 'top' }); }
          // disc
          D.circle(0, 0, 1, { fill: 'faint', fillAlpha: 0.15, stroke: false });
          hueCircle(D, M, 1, 6);
          D.line(-1.2, 0, 1.2, 0, { color: 'faint', width: 1 }); D.line(0, -1.2, 0, 1.2, { color: 'faint', width: 1 });
          const rs = M.linspace(Math.log10(0.5), -3.3, 220).map((e) => Math.pow(10, e));
          const trail = rs.map((rr) => muE(x - rr, x + rr));
          D.path(trail.map((t) => [t[0], t[1]]), { color: 'muted', width: 2 });
          const atom = ATOMS.find((a) => a.x === x);
          const hx = atom ? [Math.cos(atom.m.arg()), Math.sin(atom.m.arg())] : (() => { const [re, im] = g(x), m = Math.hypot(re, im); return [re / m, im / m]; })();
          const all = muE(0, 1);
          D.dot(all[0], all[1], { color: 'muted', r: 4, label: 'μ(X)/|μ|(X)', labelPos: 'e', math: false, labelSize: 11 });
          D.dot(hx[0], hx[1], { color: 'green', r: 7, hollow: true, width: 2.6 });
          D.tex('h(x)', hx[0] * 1.13, hx[1] * 1.13, { color: 'green', size: 14 });
          const cur = muE(x - r, x + r);
          D.dot(cur[0], cur[1], { color: 'gold', r: 6 });
          // modulus chart
          C.hline(1, { color: 'green', width: 1.4, dash: [6, 4] });
          C.path(rs.map((rr, i) => [Math.log10(rr), Math.hypot(trail[i][0], trail[i][1])]), { color: 'muted', width: 2.2 });
          C.vline(Math.log10(r), { color: 'orange', width: 1, dash: [3, 3] });
          C.dot(Math.log10(r), Math.hypot(cur[0], cur[1]), { color: 'gold', r: 5.5 });
          st = { x, r, cur, hx, atom: !!atom };
        });
        v.readout(() => {
          if (!st) return '';
          const z = st.cur, fz = (a, b) => `${v.fix(a, 3)}${b < 0 ? '-' : '+'}${v.fix(Math.abs(b), 3)}\\,i`;
          return String.raw`$x=${v.fix(st.x, 3)}$${st.atom ? ' (an atom)' : ''}, $r=${v.fmt(st.r, 3)}$: $\;\dfrac{\mu(E)}{|\mu|(E)}=${fz(z[0], z[1])}$, modulus $${v.fix(Math.hypot(z[0], z[1]), 4)}\le1$; $\;h(x)=${fz(st.hx[0], st.hx[1])}$.`;
        });
      },
    },
    {
      num: '6.13',
      kind: 'Theorem',
      name: 'The total variation of g dμ is |g| dμ',
      statement: String.raw`Suppose $\mu$ is a positive measure on $\mathfrak M$, $g\in L^1(\mu)$, and $\lambda(E)=\int_E g\,d\mu$ for $E\in\mathfrak M$. Then
$$|\lambda|(E)=\int_E|g|\,d\mu\qquad(E\in\mathfrak M).$$`,
      idea: String.raw`By 6.12, $d\lambda=h\,d|\lambda|$ with $|h|=1$; also $d\lambda=g\,d\mu$. Multiplying by $\bar h$ gives $d|\lambda|=\bar h g\,d\mu$, and since $|\lambda|\ge0$ the function $\bar hg$ is $\ge0$ a.e., hence equals $|g|$ a.e. Concretely the supremum defining $|\lambda|(E)$ is approached by sorting points by the argument of $g$: if $E_k$ is the set where $\arg g$ lies in the $k$-th of $n$ equal sectors, then $|\lambda(E_k)|\ge\cos(\pi/n)\int_{E_k}|g|\,d\mu$. This is the measure version of "the length of a curve is $\int|\gamma'|$".`,
      caption: String.raw`$\lambda=g\,dx$ on $[0,1]$ with a complex $g$ (top: height $|g|$, colour = which of the $n$ sectors contains $\arg g$). The sets $E_k$ — all points of one colour — are unions of intervals, not intervals. Left: the vectors $\lambda(E_k)=\int_{E_k}g\,dx$, each inside its own sector. Right: $\sum_k|\lambda(E_k)|$ is squeezed between $\cos(\pi/n)\int|g|$ and $\int|g|=|\lambda|([0,1])$.`,
      deps: ['rca-6.12', 'rca-6.10', 'rca-1.29', 'rca-6.1'],
      see: ['pma-6.27'],
      tags: ['total variation', 'densities'],
      viz(v) {
        const M = v.M;
        const NG = 5000;
        const rad = (x) => 0.55 + 1.1 * x * (1 - x) * (1 + 0.6 * Math.sin(9 * x));
        const ang = (x) => TAU * 2.35 * x - 0.4 + 0.9 * Math.sin(TAU * 1.5 * x);
        const g = (x) => [rad(x) * Math.cos(ang(x)), rad(x) * Math.sin(ang(x))];
        const mids = M.range(NG).map((i) => (i + 0.5) / NG);
        const gv = mids.map(g), arg = gv.map(([a, b]) => M.mod(Math.atan2(b, a), TAU)), mod = gv.map(([a, b]) => Math.hypot(a, b));
        const total = M.sum(mod) / NG;
        const sectorSums = (n) => {
          const S = M.range(n).map(() => [0, 0]);
          for (let i = 0; i < NG; i++) { const k = Math.min(n - 1, Math.floor(arg[i] / (TAU / n))); S[k][0] += gv[i][0] / NG; S[k][1] += gv[i][1] / NG; }
          return S;
        };
        const NMAX = 24;
        const curve = M.range(NMAX, 1).map((n) => [n, M.sum(sectorSums(n), (z) => Math.hypot(z[0], z[1]))]);
        let R0 = 0; for (let n = 1; n <= 8; n++) for (const z of sectorSums(n)) R0 = Math.max(R0, Math.hypot(z[0], z[1]));
        const nS = v.slider('sectors $n$', 1, NMAX, 6, { int: true });
        const T = v.stage({ x: [-0.02, 1.02], y: [-0.08, 1.12], height: 140, full: true, axes: false, title: '$|g|$ on $[0,1]$, coloured by the sector of $\\arg g$: the sets $E_k$' });
        const P = v.stage({ x: [-R0 * 1.2, R0 * 1.2], y: [-R0 * 1.2, R0 * 1.2], equal: true, height: 330, axes: false, title: 'the vectors $\\lambda(E_k)$ in their sectors' });
        const C = v.stage({ x: [0.3, NMAX + 0.7], y: [0, total * 1.12], height: 330, axes: 'box', xlabel: 'n', title: '$\\sum_k|\\lambda(E_k)|$ against the number of sectors' });
        const hue = (k, n) => M.hsl2rgb((k + 0.5) / n, 0.62, 0.55);
        let st = null;
        v.legend([['accent', '$\\sum_k|\\lambda(E_k)|$'], ['orange', '$\\cos(\\pi/n)\\int|g|\\,dx$', { dash: true }], ['green', '$|\\lambda|([0,1])=\\int|g|\\,dx$', { dash: true }]]);
        v.render(() => {
          const n = nS.value, S = sectorSums(n);
          T.raster((x, y) => {
            if (x < 0 || x > 1 || y < 0) return null;
            const i = Math.min(NG - 1, Math.floor(x * NG));
            if (y > mod[i]) return null;
            const k = Math.min(n - 1, Math.floor(arg[i] / (TAU / n)));
            return [...hue(k, n), 230];
          }, { key: 'n' + n, res: 1 });
          T.fn(rad, { domain: [0, 1], color: 'ink', width: 1, alpha: 0.35 });
          T.line(0, 0, 1, 0, { color: 'muted', width: 1 });
          // sector wedges and vectors (view adapted to the current vectors)
          const Rr = Math.max(0.12, ...S.map((z) => Math.hypot(z[0], z[1]))) * 1.18;
          P.setView([-Rr * 1.08, Rr * 1.08], [-Rr * 1.08, Rr * 1.08]);
          for (let k = 0; k < n; k++) {
            const a0 = TAU * k / n, a1 = TAU * (k + 1) / n;
            const wedge = [[0, 0], ...M.linspace(a0, a1, 24).map((a) => [Rr * Math.cos(a), Rr * Math.sin(a)])];
            P.poly(wedge, { fill: hue(k, n), fillAlpha: 0.1, stroke: false });
            if (n > 1) P.line(0, 0, Rr * Math.cos(a0), Rr * Math.sin(a0), { color: 'faint', width: 1 });
          }
          P.circle(0, 0, Rr, { color: 'faint', width: 1 });
          const lx = S.reduce((s, z) => [s[0] + z[0], s[1] + z[1]], [0, 0]);
          P.arrow(0, 0, lx[0], lx[1], { color: 'red', width: 1.6, dash: [4, 3], head: 8 });
          S.forEach((z, k) => { if (Math.hypot(z[0], z[1]) > 1e-4) P.arrow(0, 0, z[0], z[1], { color: M.hsl2rgb((k + 0.5) / n, 0.7, 0.42), width: 2.6, head: 9 }); });
          const ll = Math.hypot(lx[0], lx[1]) || 1;
          P.tex('\\lambda(X)', lx[0], lx[1], { color: 'red', align: lx[0] >= 0 ? 'left' : 'right', baseline: lx[1] >= 0 ? 'bottom' : 'top', dx: (lx[0] / ll) * 6, dy: -(lx[1] / ll) * 6, size: 13 });
          // chart
          C.hline(total, { color: 'green', width: 1.6, dash: [6, 4] });
          C.fn((x) => (x >= 2 ? Math.cos(Math.PI / x) * total : NaN), { color: 'orange', width: 1.6, dash: [5, 4], domain: [2, NMAX] });
          C.path(curve, { color: 'accent', width: 2 });
          curve.forEach(([x, y]) => C.dot(x, y, { color: 'accent', r: x === n ? 5.5 : 2.6 }));
          st = { n, sum: curve[n - 1][1], lo: Math.cos(Math.PI / n) * total, total, lx: Math.hypot(lx[0], lx[1]) };
        });
        v.readout(() => {
          if (!st) return '';
          return String.raw`$n=${st.n}$: $\;${st.n >= 2 ? String.raw`\cos(\pi/n)\int|g|=${v.fix(st.lo, 4)}\le` : ''}\sum_k|\lambda(E_k)|=${v.fix(st.sum, 4)}\le\int_0^1|g|\,dx=${v.fix(st.total, 4)}$, $\;$ while $|\lambda(X)|=${v.fix(st.lx, 4)}$.`;
        });
      },
    },
    {
      num: '6.14',
      kind: 'Theorem',
      name: 'Hahn decomposition theorem',
      statement: String.raw`Let $\mu$ be a real measure on a σ-algebra $\mathfrak M$ in $X$. Then there are sets $A,B\in\mathfrak M$ with $A\cup B=X$, $A\cap B=\varnothing$, such that
$$\mu^+(E)=\mu(A\cap E),\qquad\mu^-(E)=-\mu(B\cap E)\qquad(E\in\mathfrak M).$$`,
      idea: String.raw`By 6.12, $d\mu=h\,d|\mu|$ with $|h|=1$; as $\mu$ is real, $h$ is real a.e., so we may take $h=\pm1$. Let $A=\{h=1\}$, $B=\{h=-1\}$. Since $\tfrac12(1+h)=\chi_A$,
$$\mu^+(E)=\tfrac12\int_E(1+h)\,d|\mu|=\int_{E\cap A}h\,d|\mu|=\mu(E\cap A),$$
and similarly for $\mu^-$ with $\tfrac12(1-h)=\chi_B$. Thus $A$ is a positive set, $B$ a negative set, $\mu^+\perp\mu^-$, and $\mu(A)=\mu^+(X)$ is the largest value $\mu$ takes.`,
      caption: String.raw`A real measure on the square: a signed density (blue $>0$, red $<0$; drag the four bumps). The Hahn set $A=\{h=1\}$ is everything on the blue side of the zero-level curve. Drag the test disc $E$ and change its radius: $\mu^+(E)=\mu(E\cap A)$ and $\mu^-(E)=-\mu(E\cap B)$, and $\mu(E)$ never exceeds $\mu(A)=\mu^+(X)$ (right).`,
      deps: ['rca-6.12', 'rca-6.6', 'rca-6.13'],
      tags: ['Hahn decomposition', 'real measures'],
      viz(v) {
        const M = v.M;
        const NGr = 150;
        const S = v.stage({ x: [-0.02, 1.02], y: [-0.02, 1.02], equal: true, height: 390, axes: false, weight: 1.4, title: 'signed density; $A$ = blue side, $B$ = red side' });
        const Bp = v.stage({ x: [0.4, 4.6], y: [-1, 1], height: 390, axes: 'box', weight: 1, title: 'masses',
          xticks: [[1, 'μ(E∩A)'], [2, 'μ(E∩B)'], [3, 'μ(E)'], [4, 'μ(A)']] });
        const BUMPS = [{ s: 1, a: 1.0, sg: 0.15, x: 0.3, y: 0.66 }, { s: 1, a: 1.25, sg: 0.12, x: 0.74, y: 0.3 }, { s: -1, a: 1.15, sg: 0.14, x: 0.68, y: 0.74 }, { s: -1, a: 1.35, sg: 0.1, x: 0.26, y: 0.26 }];
        const hs = BUMPS.map((b) => S.handle(b.x, b.y, { color: b.s > 0 ? 'blue' : 'red', r: 6, label: b.s > 0 ? '+' : '−', labelPos: 'ne', constrain: { x: [0, 1], y: [0, 1] } }));
        const E = S.handle(0.5, 0.5, { color: 'gold', label: 'E', labelPos: 'ne', constrain: { x: [0, 1], y: [0, 1] } });
        const rE = v.slider('radius of $E$', 0.04, 0.45, 0.2, { step: 0.01 });
        const dens = (x, y) => { let s = 0; for (let j = 0; j < 4; j++) { const b = BUMPS[j], h = hs[j]; s += b.s * b.a * Math.exp(-((x - h.x) ** 2 + (y - h.y) ** 2) / (2 * b.sg * b.sg)); } return s; };
        let grid = null;
        let st = null;
        v.legend([['blue', '$\\mu^+$ lives on $A$', { area: true }], ['red', '$\\mu^-$ lives on $B$', { area: true }], ['ink', '$\\partial A$: density $=0$'], ['gold', 'test set $E$']]);
        v.render(() => {
          const key = hs.map((h) => `${h.x.toFixed(4)},${h.y.toFixed(4)}`).join('|');
          if (!grid || grid.key !== key) {
            const F = new Float64Array(NGr * NGr); let pos = 0, neg = 0, fmax = 0;
            for (let i = 0; i < NGr; i++) for (let j = 0; j < NGr; j++) { const f = dens((i + 0.5) / NGr, (j + 0.5) / NGr); F[i * NGr + j] = f; if (f >= 0) pos += f; else neg -= f; fmax = Math.max(fmax, Math.abs(f)); }
            grid = { key, F, pos: pos / (NGr * NGr), neg: neg / (NGr * NGr), fmax };
          }
          const blue = v.rgb('blue'), red = v.rgb('red'), ink = v.rgb('ink');
          const px = 2.2 / S.scale;
          S.raster((x, y) => {
            if (x < 0 || x > 1 || y < 0 || y > 1) return null;
            const f = dens(x, y), sx = dens(x + px, y), sy = dens(x, y + px);
            if ((f >= 0) !== (sx >= 0) || (f >= 0) !== (sy >= 0)) return [ink[0], ink[1], ink[2], 255];
            const t = Math.min(1, Math.pow(Math.abs(f) / grid.fmax, 0.6)), c = f >= 0 ? blue : red;
            return [c[0], c[1], c[2], Math.round(255 * (0.1 + 0.62 * t))];
          }, { key: key + blue + red + ink, res: 2 });
          S.rect(0, 0, 1, 1, { color: 'muted', width: 1.2 });
          // test set E
          const r = rE.value;
          let ea = 0, eb = 0;
          for (let i = 0; i < NGr; i++) {
            const x = (i + 0.5) / NGr; if (Math.abs(x - E.x) > r) continue;
            for (let j = 0; j < NGr; j++) { const y = (j + 0.5) / NGr; if ((x - E.x) ** 2 + (y - E.y) ** 2 > r * r) continue; const f = grid.F[i * NGr + j]; if (f >= 0) ea += f; else eb += f; }
          }
          ea /= NGr * NGr; eb /= NGr * NGr;
          S.circle(E.x, E.y, r, { color: 'gold', width: 2.6, fill: 'gold', fillAlpha: 0.1 });
          // bars
          const top = Math.max(grid.pos, 0.05) * 1.22, bot = -Math.max(-eb, 0.3 * grid.pos) * 1.3;
          Bp.setView(null, [bot, top]);
          Bp.hline(0, { color: 'muted', width: 1 });
          const bar = (x, y, col) => Bp.rect(x - 0.3, 0, x + 0.3, y, { fill: col, fillAlpha: 0.7, stroke: false });
          bar(1, ea, 'blue'); bar(2, eb, 'red'); bar(3, ea + eb, 'ink'); bar(4, grid.pos, 'green');
          Bp.hline(grid.pos, { color: 'green', width: 1.2, dash: [5, 4] });
          Bp.text('max of μ', 4.55, grid.pos, { color: 'green', align: 'right', dy: -10, size: 11 });
          st = { ea, eb, pos: grid.pos, neg: grid.neg };
        });
        v.readout(() => {
          if (!st) return '';
          return String.raw`$\mu^+(E)=\mu(E\cap A)=${v.fix(st.ea, 4)}$, $\;\mu^-(E)=-\mu(E\cap B)=${v.fix(-st.eb, 4)}$, $\;\mu(E)=${v.fix(st.ea + st.eb, 4)}\le\mu(A)=\mu^+(X)=${v.fix(st.pos, 4)}$; $\;\mu^-(X)=-\mu(B)=${v.fix(st.neg, 4)}$.`;
        });
      },
    },
    {
      num: '6.14a',
      kind: 'Corollary',
      name: 'The Jordan decomposition is minimal',
      statement: String.raw`If $\mu=\lambda_1-\lambda_2$, where $\lambda_1$ and $\lambda_2$ are positive measures, then $\lambda_1\ge\mu^+$ and $\lambda_2\ge\mu^-$.`,
      idea: String.raw`Let $X=A\cup B$ be a Hahn decomposition (6.14). Since $\mu\le\lambda_1$ setwise, $\mu^+(E)=\mu(E\cap A)\le\lambda_1(E\cap A)\le\lambda_1(E)$, and likewise $\mu^-(E)=-\mu(E\cap B)\le\lambda_2(E\cap B)\le\lambda_2(E)$. Equivalently $\nu=\lambda_1-\mu^+=\lambda_2-\mu^-$ is a positive measure: every splitting is the Jordan one plus a common surplus, so $\lambda_1+\lambda_2=|\mu|+2\nu\ge|\mu|$. This is the measure version of the minimality of $f=f^+-f^-$ (1.15).`,
      caption: String.raw`The density $f$ of $\mu$ is shaded (blue $f^+$, red $f^-$). Drag the handles on the blue curve to propose a density for $\lambda_1$; then $\lambda_2=\lambda_1-\mu$ is forced, and is drawn downward in red. The surplus $\nu=\lambda_1-\mu^+=\lambda_2-\mu^-$ is the green gap, the same above and below. Push $\lambda_1$ under $f^+$ anywhere and the gap turns red: there $\lambda_1$ or $\lambda_2$ becomes negative.`,
      deps: ['rca-6.14', 'rca-6.6'],
      see: ['rca-1.15'],
      tags: ['Jordan decomposition', 'real measures'],
      viz(v) {
        const M = v.M;
        const f = (x) => 1.05 * Math.sin(TAU * 1.25 * x + 0.35) * (1 - 0.25 * x);
        const fp = (x) => Math.max(0, f(x)), fm = (x) => Math.max(0, -f(x));
        const T = v.stage({ x: [-0.02, 1.02], y: [-1.9, 2.05], height: 380, full: true, axes: 'box', xlabel: 'x', title: '$\\lambda_1$ (up, blue) and $\\lambda_2$ (drawn as $-\\lambda_2$, red) against $f^\\pm$' });
        const S0 = [0.18, 0.32, 0.08, 0.25, 0.4, 0.15, 0.3];
        const xs = S0.map((_, j) => j / 6);
        const knots = S0.map((s, j) => T.handle(xs[j], fp(xs[j]) + s, { color: 'blue', r: 6, constrain: (x, y) => [xs[j], M.clamp(y, fp(xs[j]) - 0.7, fp(xs[j]) + 1.2)] }));
        v.button('Reset to $\\nu=0$', () => { knots.forEach((h, j) => { h.y = fp(xs[j]); }); });
        let st = null;
        v.legend([['blue', '$\\lambda_1=f^++\\nu$'], ['red', '$-\\lambda_2=-(f^-+\\nu)$'], ['green', 'surplus $\\nu\\ge0$', { area: true }], ['red', 'violation: $\\nu<0$', { area: true }], ['muted', '$f^\\pm$, density of $\\mu^\\pm$', { area: true }]]);
        v.render(() => {
          const s = spline(knots.map((h, j) => h.y - fp(xs[j])));
          const l1 = (x) => fp(x) + s(x), l2 = (x) => fm(x) + s(x);
          T.fn(fp, { color: 'blue', width: 0.01, fill: 'blue', fillAlpha: 0.1, stroke: false, domain: [0, 1] });
          T.fn((x) => -fm(x), { color: 'red', width: 0.01, fill: 'red', fillAlpha: 0.1, stroke: false, domain: [0, 1] });
          T.between((x) => fp(x) + Math.max(0, s(x)), fp, 0, 1, { fill: 'green', fillAlpha: 0.28, n: 400 });
          T.between((x) => -fm(x), (x) => -fm(x) - Math.max(0, s(x)), 0, 1, { fill: 'green', fillAlpha: 0.28, n: 400 });
          T.between(fp, (x) => fp(x) + Math.min(0, s(x)), 0, 1, { fill: 'red', fillAlpha: 0.75, n: 400 });
          T.between((x) => -fm(x) - Math.min(0, s(x)), (x) => -fm(x), 0, 1, { fill: 'red', fillAlpha: 0.75, n: 400 });
          T.fn(f, { color: 'ink', width: 1.4, dash: [4, 3], domain: [0, 1] });
          T.fn(l1, { color: 'blue', width: 2.6, domain: [0, 1] });
          T.fn((x) => -l2(x), { color: 'red', width: 2.6, domain: [0, 1] });
          T.tex('f', 0.55, f(0.55), { color: 'ink', baseline: 'bottom', dy: -6, size: 16 });
          // numerics
          const N = 2000; let P = 0, Nn = 0, nu = 0, bad = 0, neg1 = 0, neg2 = 0;
          for (let i = 0; i < N; i++) { const x = (i + 0.5) / N, sv = s(x); P += fp(x) / N; Nn += fm(x) / N; nu += sv / N; if (sv < -1e-9) { bad += 1 / N; if (f(x) >= 0) neg2 += 1 / N; else neg1 += 1 / N; } }
          T.corner(bad > 0 ? 'λ₁ < μ⁺ somewhere — not a splitting into positive measures' : 'valid: λ₁ ≥ μ⁺ and λ₂ ≥ μ⁻', 'tr', { color: bad > 0 ? 'red' : 'green', weight: 600 });
          st = { P, Nn, nu, bad, neg1, neg2 };
        });
        v.readout(() => {
          if (!st) return '';
          if (st.bad > 0) return String.raw`$\nu<0$ on a set of length $${v.fix(st.bad, 3)}$: there $\lambda_2<0$ (where $f\ge0$, length $${v.fix(st.neg2, 3)}$) or $\lambda_1<0$ (where $f<0$, length $${v.fix(st.neg1, 3)}$).`;
          return String.raw`$\lambda_1(X)=${v.fix(st.P + st.nu, 3)}\ge\mu^+(X)=${v.fix(st.P, 3)}$, $\;\lambda_2(X)=${v.fix(st.Nn + st.nu, 3)}\ge\mu^-(X)=${v.fix(st.Nn, 3)}$; $\;\lambda_1(X)+\lambda_2(X)=|\mu|(X)+2\nu(X)=${v.fix(st.P + st.Nn, 3)}+${v.fix(2 * st.nu, 3)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ bounded linear functionals on Lᵖ
    {
      num: '6.16',
      kind: 'Theorem',
      name: 'The dual of Lᵖ(μ) is L^q(μ) (1 ≤ p < ∞)',
      statement: String.raw`Suppose $1\le p<\infty$, $\mu$ is a σ-finite positive measure on $X$, and $\Phi$ is a bounded linear functional on $L^p(\mu)$. Then there is a unique $g\in L^q(\mu)$, where $q$ is the exponent conjugate to $p$, such that
$$\Phi(f)=\int_X fg\,d\mu\qquad(f\in L^p(\mu)),$$
and $\|\Phi\|=\|g\|_q$. Thus $L^q(\mu)$ is isometrically isomorphic to the dual space of $L^p(\mu)$.`,
      idea: String.raw`Hölder gives $\|\Phi\|\le\|g\|_q$, and uniqueness is clear. For existence with $\mu(X)<\infty$, set $\lambda(E)=\Phi(\chi_E)$: since $p<\infty$, $\|\chi_{\bigcup E_i}-\chi_{E_1\cup\dots\cup E_k}\|_p\to0$, so $\lambda$ is a complex measure, and $\lambda\ll\mu$. Radon–Nikodym (6.10) yields $g$ with $\Phi(\chi_E)=\int_Eg\,d\mu$; linearity and density extend this to simple functions, then to $L^\infty$, and testing on $f=\chi_{\{|g|\le n\}}|g|^{q-1}\overline{\sgn g}$ (or using 1.40 when $p=1$) shows $\|g\|_q\le\|\Phi\|$; density of simple functions (3.13) finishes. The σ-finite case reduces to this via the weight $w$ of 6.9. For $p=\infty$ the statement fails: $L^1$ is a proper part of $(L^\infty)^*$.`,
      caption: String.raw`$\mu$ = Lebesgue measure on $[0,1]$ and $\Phi$ a bounded functional given by a formula (pick one). Top: the proof's recipe — the values $\Phi(\chi_I)/\mu(I)$ on $2^k$ intervals (orange) converge to the representing $g$ (blue). Bottom: drag the purple handles to shape a test function $f$; always $|\Phi(f)|\le\|g\|_q\|f\|_p$. The green function $f_p=|g|^{q-1}\overline{\sgn g}/\|g\|_q^{q-1}$ has $\|f_p\|_p=1$ and attains $\Phi(f_p)=\|g\|_q$; at $p=1$ only an approximating family exists.`,
      deps: ['rca-6.10', 'rca-6.9', 'rca-3.8', 'rca-3.13', 'rca-1.40', 'rca-5.2'],
      see: ['rca-4.12', 'fa-3.1'],
      tags: ['duality', 'Lᵖ spaces'],
      viz(v) {
        const M = v.M;
        const NF = 1536, mids = M.range(NF).map((i) => (i + 0.5) / NF);
        const FUN = {
          integ: {
            label: '$\\Phi f=\\int_0^1\\!\\big(\\int_0^x\\!f\\big)\\,w(x)\\,dx$',
            apply: (fv) => { const w = (x) => 4 * Math.cos(TAU * x) + 2 * x; let F = 0, s = 0; for (let i = 0; i < NF; i++) { const half = fv[i] / (2 * NF); F += half; s += F * w(mids[i]) / NF; F += half; } return s; },
            g: (t) => 1 - t * t - (2 / Math.PI) * Math.sin(TAU * t),
          },
          avgs: {
            label: '$\\Phi f=$ mean of $f$ on $[.1,.3]$ − mean on $[.55,.8]$',
            apply: (fv) => { let a = 0, b = 0; for (let i = 0; i < NF; i++) { const x = mids[i]; if (x >= 0.1 && x < 0.3) a += fv[i] / NF; if (x >= 0.55 && x < 0.8) b += fv[i] / NF; } return a / 0.2 - b / 0.25; },
            g: (t) => (t >= 0.1 && t < 0.3 ? 5 : t >= 0.55 && t < 0.8 ? -4 : 0),
          },
        };
        const which = v.select('', Object.entries(FUN).map(([value, o]) => ({ value, label: o.label })), 'integ');
        const kS = v.slider('intervals $2^k$, $k=$', 1, 7, 4, { int: true });
        const pS = v.slider('$p$', 1, 6, 2, { step: 0.05 });
        const T = v.stage({ x: [-0.02, 1.02], y: [-2, 2], height: 230, full: true, axes: 'box', title: 'recovering $g$: $\\Phi(\\chi_I)/\\mu(I)$ on $2^k$ intervals $I$' });
        const B = v.stage({ x: [-0.02, 1.02], y: [-2.5, 2.5], height: 230, full: true, axes: 'box', xlabel: 'x', title: 'test functions in $L^p$: your $f$ (purple) and the extremal $f_p$ (green)' });
        const Y0 = [1.0, 0.2, 0.6, 1.3, 0.9, -0.3];
        const knots = Y0.map((y, j) => B.handle(j / 5, y, { color: 'purple', r: 6, constrain: (x, yy) => [j / 5, M.clamp(yy, -2.3, 2.3)] }));
        const cache = new Map();
        const recon = (w, k) => {
          const key = w + k; if (cache.has(key)) return cache.get(key);
          const n = 2 ** k, F = FUN[w], out = [];
          for (let i = 0; i < n; i++) { const fv = mids.map((x) => (x >= i / n && x < (i + 1) / n ? 1 : 0)); out.push(F.apply(fv) * n); }
          cache.set(key, out); return out;
        };
        let st = null;
        v.legend([['accent', 'representing function $g$'], ['orange', '$\\Phi(\\chi_I)/\\mu(I)$', { area: true }], ['purple', 'your $f$'], ['green', 'extremal $f_p$']]);
        v.render(() => {
          const F = FUN[which.value], k = kS.value, n = 2 ** k;
          const p = pS.value, one = p < 1.001, q = one ? Infinity : p / (p - 1);
          // top: reconstruction
          const rc = recon(which.value, k);
          const gv = mids.map(F.g);
          const gmax = Math.max(...gv.map(Math.abs), ...rc.map(Math.abs));
          const gmin = Math.min(0, ...gv, ...rc);
          T.setView(null, [gmin * 1.18 - 0.12 * gmax, gmax * 1.18]);
          T.hline(0, { color: 'faint', width: 1 });
          rc.forEach((y, i) => T.rect(i / n, 0, (i + 1) / n, y, { fill: 'orange', fillAlpha: 0.3, color: 'orange', width: 1 }));
          T.fn(F.g, { color: 'accent', width: 2.6, domain: [0, 1], n: 1200 });
          // norms
          const normG = one ? Math.max(...gv.map(Math.abs)) : Math.pow(M.sum(gv, (y) => Math.abs(y) ** q) / NF, 1 / q);
          // extremal function
          let fpv;
          if (one) { const thr = 0.95 * normG; const sel = gv.map((y) => Math.abs(y) >= thr); const m = sel.filter(Boolean).length / NF; fpv = gv.map((y, i) => (sel[i] ? Math.sign(y) / m : 0)); }
          else fpv = gv.map((y) => Math.sign(y) * Math.abs(y) ** (q - 1) / normG ** (q - 1));
          const normP = (fv) => Math.pow(M.sum(fv, (y) => Math.abs(y) ** p) / NF, 1 / p);
          const phiP = F.apply(fpv), nP = normP(fpv);
          // user f
          const fu = spline(knots.map((h) => h.y)), fuv = mids.map(fu);
          const phiU = F.apply(fuv), nU = normP(fuv);
          const span = Math.max(2.5, ...fpv.map(Math.abs)) * 1.1;
          B.setView(null, [-Math.min(span, 12), Math.min(span, 12)]);
          B.hline(0, { color: 'faint', width: 1 });
          B.path(mids.map((x, i) => [x, fpv[i]]), { color: 'green', width: 2.4 });
          B.fn(fu, { color: 'purple', width: 2.4, domain: [0, 1] });
          st = { p, q, one, normG, phiP, nP, phiU, nU };
        });
        v.readout(() => {
          if (!st) return '';
          const qs = st.one ? '\\infty' : v.fix(st.q, 2);
          const ext = st.one
            ? String.raw`$f$ = normalised $\overline{\sgn g}$ on $\{|g|\ge0.95\|g\|_\infty\}$: $\Phi(f)=${v.fix(st.phiP, 4)}$ — close to, but (in general) below, $\|g\|_\infty$`
            : String.raw`$\|f_p\|_p=${v.fix(st.nP, 3)}$, $\;\Phi(f_p)=${v.fix(st.phiP, 4)}$`;
          return String.raw`$p=${v.fix(st.p, 2)}$, $q=${qs}$: $\;\|\Phi\|=\|g\|_q=${v.fix(st.normG, 4)}$. ${ext}. Your $f$: $|\Phi(f)|/\|f\|_p=${v.fix(Math.abs(st.phiU) / st.nU, 4)}\le\|g\|_q$.`;
        });
      },
    },
    // ------------------------------------------------------------------ Riesz representation theorem
    {
      num: '6.18',
      kind: 'Definition',
      name: 'Regular complex Borel measures; the space M(X)',
      verify: true,
      statement: String.raw`Let $X$ be a locally compact Hausdorff space. A complex Borel measure $\mu$ on $X$ is **regular** if the positive measure $|\mu|$ is regular in the sense of 2.15. The regular complex Borel measures on $X$ form a vector space $M(X)$, normed by $\|\mu\|=|\mu|(X)$. Each $\mu\in M(X)$ defines a linear functional on $C_0(X)$,
$$\Phi_\mu(f)=\int_X f\,d\mu=\int_X fh\,d|\mu|\qquad(d\mu=h\,d|\mu|\text{ as in 6.12}),$$
which is bounded, with $|\Phi_\mu(f)|\le\|f\|_\infty|\mu|(X)$.`,
      idea: String.raw`Integration against a complex measure is defined through its polar form (6.12), or equivalently by splitting $\mu$ into real and imaginary, positive and negative parts. The bound is the triangle inequality for integrals. The Riesz theorem 6.19 says that every bounded functional on $C_0(X)$ arises this way, from exactly one $\mu\in M(X)$, and that the bound is sharp.`,
      deps: ['rca-2.15', 'rca-6.12', 'rca-3.16', 'rca-6.5'],
      tags: ['regular measures', 'duality'],
    },
    {
      num: '6.19',
      kind: 'Theorem',
      name: 'Riesz representation theorem for C₀(X)*',
      statement: String.raw`If $X$ is a locally compact Hausdorff space, then every bounded linear functional $\Phi$ on $C_0(X)$ is represented by a unique regular complex Borel measure $\mu$, in the sense that
$$\Phi f=\int_X f\,d\mu\qquad(f\in C_0(X)).$$
Moreover $\|\Phi\|=|\mu|(X)$.`,
      idea: String.raw`Uniqueness: if $\mu\in M(X)$ annihilates $C_0(X)$, write $d\mu=h\,d|\mu|$ (6.12) and use Lusin's theorem (2.24) to approximate $\bar h$ in $L^1(|\mu|)$ by $f\in C_c(X)$ with $|f|\le1$; then $|\mu|(X)=\int\bar h\,d\mu\approx\int f\,d\mu=0$. Existence: for $f\in C_c^+(X)$ put $\Lambda f=\sup\{|\Phi h|:h\in C_c(X),\,|h|\le f\}$; $\Lambda$ extends to a positive linear functional with $|\Phi f|\le\Lambda|f|$ and $\Lambda1\le\|\Phi\|$, so 2.14 gives a regular $\lambda$ with $\lambda(X)\le\|\Phi\|$. Then $|\Phi f|\le\|f\|_{L^1(\lambda)}$, so $\Phi$ extends to $L^1(\lambda)$, and 6.16 provides $g$, $|g|\le1$, with $\Phi f=\int fg\,d\lambda$; set $d\mu=g\,d\lambda$. Finally $\|\Phi\|\le|\mu|(X)\le\lambda(X)\le\|\Phi\|$ (6.13).`,
      caption: String.raw`A real example on $X=\R$: $\mu=k\,dx+c_1\delta_{a_1}+c_2\delta_{a_2}$ (drag the atoms: position and mass). The functional $\Phi f=\int f\,d\mu$ has norm $|\mu|(X)$, but no single $f\in C_0(\R)$ with $\|f\|_\infty\le1$ need attain it. The norming functions $f_\eps$ (bottom left) are continuous versions of $\sgn$ of $\mu$ — steep ramps where $k$ changes sign, narrow tents at the atoms, cut off far out — and $\Phi(f_\eps)$ climbs to $|\mu|(X)$ as $\eps\to0$ (bottom right).`,
      deps: ['rca-2.14', 'rca-6.16', 'rca-6.13', 'rca-6.12', 'rca-2.24', 'rca-3.14', 'rca-6.18'],
      see: ['pma-6.2', 'fa-3.15'],
      tags: ['Riesz representation', 'duality'],
      viz(v) {
        const M = v.M;
        const XL = 14, NX = 9000, dx = 2 * XL / NX;
        const k = (x) => 1.05 * Math.sin(1.7 * x + 0.4) * Math.exp(-x * x / 7);
        const xsI = M.range(NX).map((i) => -XL + (i + 0.5) * dx), kv = xsI.map(k);
        const kInt = M.sum(kv, Math.abs) * dx, kmax = Math.max(...kv.map(Math.abs));
        const MASS = 0.5;
        const eS = v.slider('$\\varepsilon$', 0.004, 1, 0.3, { log: true, decimals: 3 });
        const T = v.stage({ x: [-6.5, 6.5], y: [-1.6, 1.6], height: 220, full: true, xlabel: 'x', title: '$\\mu=k\\,dx+c_1\\delta_{a_1}+c_2\\delta_{a_2}$ (arrow height $=2\\times$ mass)' });
        const F = v.stage({ x: [-6.5, 6.5], y: [-1.25, 1.25], height: 230, weight: 1.7, xlabel: 'x', title: 'a norming function $f_\\varepsilon\\in C_c(\\R)$, $|f_\\varepsilon|\\le1$' });
        const C = v.stage({ x: [Math.log10(0.004), 0], y: [0, 1], height: 230, weight: 1, axes: 'box', xlabel: 'ε', title: '$\\Phi(f_\\varepsilon)\\to\\|\\Phi\\|$',
          xticks: [[-2, '0.01'], [-1, '0.1'], [0, '1']] });
        const atoms = [T.handle(-1.6, 1.1, { color: 'gold', label: 'c₁', labelPos: 'ne' }), T.handle(2.3, -0.7, { color: 'gold', label: 'c₂', labelPos: 'se' })];
        atoms.forEach((h) => { h.constrain = (x, y) => [M.clamp(x, -6, 6), M.clamp(y, -1.45, 1.45)]; });
        const sgnK = (x, eps) => M.clamp(k(x) / (eps * kmax), -1, 1);
        const fEps = (x, eps, at) => {
          let y = sgnK(x, eps) * M.clamp(1 / eps + 3 - Math.abs(x), 0, 1);
          const w = 0.7 * eps;
          for (const a of at) { const d = Math.abs(x - a.x); if (d < w) { const t = d / w; y = (1 - t) * Math.sign(a.m) + t * y; } }
          return y;
        };
        const Phi = (eps, at) => {
          // ∫ f_ε k dx on the grid (reusing the tabulated k), plus the atoms
          let s = 0; const R = 1 / eps + 3, w = 0.7 * eps;
          for (let i = 0; i < NX; i++) {
            const x = xsI[i];
            let y = M.clamp(kv[i] / (eps * kmax), -1, 1) * M.clamp(R - Math.abs(x), 0, 1);
            for (const a of at) { const d = Math.abs(x - a.x); if (d < w) { const t = d / w; y = (1 - t) * Math.sign(a.m) + t * y; } }
            s += y * kv[i] * dx;
          }
          for (const a of at) s += a.m * fEps(a.x, eps, at);
          return s;
        };
        let st = null;
        v.legend([['accent', '$k>0$', { area: true }], ['red', '$k<0$', { area: true }], ['purple', '$f_\\varepsilon$'], ['green', '$|\\mu|(X)=\\int|k|+|c_1|+|c_2|$', { dash: true }]]);
        v.render(() => {
          const eps = eS.value;
          const at = atoms.map((h) => ({ x: h.x, m: h.y * MASS }));
          const total = kInt + M.sum(at, (a) => Math.abs(a.m));
          // measure
          T.fn((x) => Math.max(0, k(x)), { color: 'accent', width: 0.01, fill: 'accent', fillAlpha: 0.3, stroke: false });
          T.fn((x) => Math.min(0, k(x)), { color: 'red', width: 0.01, fill: 'red', fillAlpha: 0.3, stroke: false });
          T.fn(k, { color: 'ink', width: 1.6 });
          for (const h of atoms) T.arrow(h.x, 0, h.x, h.y, { color: 'gold', width: 3, head: 9 });
          // norming function
          F.hband(-1, 1, { color: 'purple', alpha: 0.05 });
          F.hline(1, { color: 'purple', width: 1, dash: [3, 4], alpha: 0.6 }); F.hline(-1, { color: 'purple', width: 1, dash: [3, 4], alpha: 0.6 });
          F.fn((x) => fEps(x, eps, at), { color: 'purple', width: 2.4, n: 3000, connect: true });
          for (const a of at) F.vline(a.x, { color: 'gold', width: 1, dash: [2, 3] });
          // convergence chart
          const es = M.linspace(0, Math.log10(0.004), 40);
          const vals = es.map((e) => [e, Phi(Math.pow(10, e), at)]);
          C.setView(null, [Math.min(0, ...vals.map((p) => p[1])) - 0.05 * total, total * 1.12]);
          C.hline(total, { color: 'green', width: 1.6, dash: [6, 4] });
          C.path(vals, { color: 'purple', width: 2.2 });
          const now = Phi(eps, at);
          C.dot(Math.log10(eps), now, { color: 'purple', r: 5.5 });
          st = { eps, now, total, kInt, at };
        });
        v.readout(() => {
          if (!st) return '';
          return String.raw`$\varepsilon=${v.fix(st.eps, 3)}$: $\;\|f_\varepsilon\|_\infty=1$, $\;\Phi(f_\varepsilon)=${v.fix(st.now, 4)}\le\|\Phi\|=|\mu|(X)=\int|k|\,dx+|c_1|+|c_2|=${v.fix(st.kInt, 3)}+${v.fix(Math.abs(st.at[0].m), 3)}+${v.fix(Math.abs(st.at[1].m), 3)}=${v.fix(st.total, 4)}$`;
        });
      },
    },
  ],
};
