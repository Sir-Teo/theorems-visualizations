// Rudin, Real and Complex Analysis — Chapter 8 (part 2): the Fubini theorem; completion of product measures

// ---------------------------------------------------------------- helpers (copied: modules cannot import)
function crossings(ring, c, axis) {
  const o = 1 - axis, out = [];
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const p = ring[j], q = ring[i];
    if ((p[axis] > c) !== (q[axis] > c)) out.push(p[o] + (c - p[axis]) * (q[o] - p[o]) / (q[axis] - p[axis]));
  }
  return out;
}
function mergeIv(ivs) {
  const s = ivs.filter(([a, b]) => b > a).sort((u, w) => u[0] - w[0]), out = [];
  for (const [a, b] of s) { const l = out[out.length - 1]; if (l && a <= l[1] + 1e-12) l[1] = Math.max(l[1], b); else out.push([a, b]); }
  return out;
}
/** Section of a convex or simple polygon by the line {axis = c}: sorted intervals (even–odd rule). */
function polySection(ring, c, axis) {
  const t = crossings(ring, c, axis).sort((a, b) => a - b), out = [];
  for (let k = 0; k + 1 < t.length; k += 2) out.push([t[k], t[k + 1]]);
  return mergeIv(out);
}
const ivLen = (ivs) => ivs.reduce((s, [a, b]) => s + b - a, 0);
const avg01 = (g, N = 1000) => { let s = 0; for (let i = 0; i < N; i++) s += g((i + 0.5) / N); return s / N; };
function drawIv(S, ivs, c, axis, st) {
  for (const [a, b] of ivs) { if (axis === 0) S.line(c, a, c, b, { cap: 'butt', ...st }); else S.line(a, c, b, c, { cap: 'butt', ...st }); }
}
/** SAT test: does the square [x0,x1]×[y0,y1] meet the convex polygon T? */
function meetsConvex(T, x0, y0, x1, y1) {
  const C = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], axes = [[1, 0], [0, 1]];
  for (let i = 0; i < T.length; i++) { const p = T[i], q = T[(i + 1) % T.length]; axes.push([q[1] - p[1], p[0] - q[0]]); }
  for (const a of axes) {
    let pa0 = Infinity, pa1 = -Infinity, pb0 = Infinity, pb1 = -Infinity;
    for (const p of C) { const d = a[0] * p[0] + a[1] * p[1]; pa0 = Math.min(pa0, d); pa1 = Math.max(pa1, d); }
    for (const p of T) { const d = a[0] * p[0] + a[1] * p[1]; pb0 = Math.min(pb0, d); pb1 = Math.max(pb1, d); }
    if (pa1 < pb0 || pb1 < pa0) return false;
  }
  return true;
}
/** Deterministic "dust": a scattered subset of [0,1] standing in for an arbitrary (possibly nonmeasurable) set. */
function dust(seed, n = 70) {
  let a = seed >>> 0; const r = () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; };
  const out = []; for (let i = 0; i < n; i++) { const c = r(); out.push([c, Math.min(1, c + 0.002 + 0.006 * r())]); }
  return out;
}
/** Rudin's staircase (8.9(a)): blocks [δ_n, δ_{n+1}) with δ_n = 1 − 2^{1−n}, g_n = 2^n on block n. */
const blockOf = (t) => (t >= 1 ? 60 : Math.floor(-Math.log2(1 - t)) + 1);
const blockLo = (n) => 1 - Math.pow(2, 1 - n);
function stairF(x, y) {
  const m = blockOf(x), n = blockOf(y);
  if (m === n) return Math.pow(4, n);
  if (m === n + 1) return -Math.pow(2, 2 * n + 1);
  return 0;
}

export default {
  collection: 'rca',
  chapter: 8,
  items: [
    // ------------------------------------------------------------------ the Fubini theorem
    {
      num: '8.8',
      kind: 'Theorem',
      name: 'The Fubini theorem',
      statement: String.raw`Let $(X,\mathscr S,\mu)$ and $(Y,\mathscr T,\lambda)$ be $\sigma$-finite measure spaces and let $f$ be an $(\mathscr S\times\mathscr T)$-measurable function on $X\times Y$.
(a) If $0\le f\le\infty$ and
$$\varphi(x)=\int_Y f_x\,d\lambda,\qquad \psi(y)=\int_X f^y\,d\mu\qquad(x\in X,\ y\in Y),$$
then $\varphi$ is $\mathscr S$-measurable, $\psi$ is $\mathscr T$-measurable, and $\int_X\varphi\,d\mu=\int_{X\times Y}f\,d(\mu\times\lambda)=\int_Y\psi\,d\lambda$.
(b) If $f$ is complex, $\varphi^*(x)=\int_Y|f|_x\,d\lambda$, and $\int_X\varphi^*\,d\mu<\infty$, then $f\in L^1(\mu\times\lambda)$.
(c) If $f\in L^1(\mu\times\lambda)$, then $f_x\in L^1(\lambda)$ for almost every $x\in X$ and $f^y\in L^1(\mu)$ for almost every $y\in Y$; the functions $\varphi,\psi$ (defined a.e. by the formulas above) lie in $L^1(\mu)$ and $L^1(\lambda)$, and the equalities of (a) hold.`,
      idea: String.raw`For $f=\chi_Q$ statement (a) is Theorem 8.6 together with the definition 8.7 of $\mu\times\lambda$. By linearity it holds for nonnegative simple functions; approximate a general $f\ge0$ from below by simple functions (1.17) and pass to the limit three times with the monotone convergence theorem. Part (b) is (a) applied to $|f|$. For (c), apply (a) to the positive and negative parts of $\Re f$ and $\Im f$; each has finite integral, so the corresponding $\varphi$'s are finite a.e. and can be subtracted. The hypotheses matter (8.9): for Rudin's staircase $f=\sum_n[g_n(x)-g_{n+1}(x)]g_n(y)$ on $[0,1]^2$, which is not integrable, the iterated integrals are $1$ and $0$; for counting measure on $[0,1]$ (not $\sigma$-finite) see 8.6; and under the continuum hypothesis a non-measurable indicator has iterated integrals $0$ and $1$.`,
      caption: String.raw`The square shows $f$ on $[0,1]^2$ (Lebesgue measure on both factors); drag the gold point. Below the square is $\varphi(x)=\int f(x,y)\,dy$, to its right $\psi(y)=\int f(x,y)\,dx$, and the bottom panels show the two sections whose integrals these are. For the integrable examples the areas under $\varphi$ and $\psi$ agree. The staircase (colour = sign, shade = $\log|f|$) has $\iint|f|=\infty$: every horizontal section integrates to $0$, every vertical one to $0$ except in the first column, so the two orders give $0$ and $1$.`,
      deps: ['rca-8.6', 'rca-8.7', 'rca-8.5', 'rca-1.17', 'rca-1.26', 'rca-1.32'],
      see: ['pma-10.2'],
      tags: ['Fubini', 'iterated integrals', 'product measure'],
      viz(v) {
        const M = v.M;
        const FN = {
          pos: { label: '$f\\ge 0$', f: (x, y) => 1.6 * Math.exp(-((x - 0.3) ** 2 + (y - 0.68) ** 2) / 0.03) + 1.1 * Math.exp(-((x - 0.7) ** 2 + (y - 0.32) ** 2) / 0.05) + 0.3 * x },
          sgn: { label: '$f\\in L^1$, signed', f: (x, y) => 1.8 * Math.sin(2 * Math.PI * x + 0.5) * (0.3 + y) + 1.6 * Math.cos(2 * Math.PI * y) * (x - 0.2) + 0.4 * x * y },
          stair: { label: 'staircase (8.9a), $f\\notin L^1$' },
        };
        const which = v.select('$f$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'stair');
        const S = v.stage({ x: [-0.1, 1.72], y: [-0.78, 1.06], equal: true, height: 470, axes: false, full: true });
        const A = v.stage({ x: [-0.02, 1.02], y: [-1, 1], height: 190, axes: 'box', xlabel: 'y', title: 'the section $f_x$ on $Y$; its integral is $\\varphi(x)$' });
        const B = v.stage({ x: [-0.02, 1.02], y: [-1, 1], height: 190, axes: 'box', xlabel: 'x', title: 'the section $f^y$ on $X$; its integral is $\\psi(y)$' });
        const g = S.handle(0.62, 0.36, { color: 'gold', constrain: { x: [0.002, 0.998], y: [0.002, 0.998] } });
        const PX = 1.1, PW = 0.58, PY = -0.74, PH = 0.6;
        let cache = { key: null }, st = {};
        const NS = 400;
        function prepare(key) {
          const xs = M.linspace(0, 1, NS + 1);
          let phi, psi, I1, I2, I3, Iabs;
          if (key === 'stair') {
            // exact block sums
            // (inner sums run one block further than outer ones; 2^-45 is still exact in double precision)
            const blockInt = (val, N) => { let s = 0; for (let n = 1; n <= N; n++) s += val(blockLo(n) + 0.5 * Math.pow(2, -n)) * Math.pow(2, -n); return s; };
            phi = (x) => blockInt((y) => stairF(x, y), 45); psi = (y) => blockInt((x) => stairF(x, y), 45);
            I1 = blockInt(phi, 40); I2 = blockInt(psi, 40); I3 = null; Iabs = Infinity;
          } else {
            const f = FN[key].f;
            phi = (x) => M.integrate((y) => f(x, y), 0, 1, 160); psi = (y) => M.integrate((x) => f(x, y), 0, 1, 160);
            I1 = M.integrate(phi, 0, 1, 160); I2 = M.integrate(psi, 0, 1, 160);
            let s = 0, sa = 0; const n = 300; // independent 2D midpoint sum
            for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const z = f((i + 0.5) / n, (j + 0.5) / n); s += z; sa += Math.abs(z); }
            I3 = s / (n * n); Iabs = sa / (n * n);
          }
          const ph = xs.map(phi), ps = xs.map(psi);
          const top = Math.max(1e-9, ...ph.map(Math.abs), ...ps.map(Math.abs));
          const signed = Math.min(...ph, ...ps) < -1e-9;
          return { key, xs, phi, psi, ph, ps, I1, I2, I3, Iabs, top, signed };
        }
        v.render(() => {
          const key = which.value, stair = key === 'stair';
          if (cache.key !== key) cache = prepare(key);
          const C = cache, f = stair ? stairF : FN[key].f;
          // heat map
          const pan = v.rgb('panel');
          if (stair) {
            S.raster((x, y) => {
              if (x < 0 || x >= 1 || y < 0 || y >= 1) return null;
              const z = stairF(x, y); if (!z) return pan;
              const t = 0.35 + 0.65 * Math.min(1, Math.log(Math.abs(z)) / Math.log(4 ** 9));
              return M.cmap(0.5 + 0.5 * Math.sign(z) * t, 'diverging');
            }, { key: 'stair' + pan, res: 1 });
          } else {
            const R = key === 'pos' ? [0, 1.9] : [-2.6, 2.6];
            S.raster((x, y) => (x < 0 || x > 1 || y < 0 || y > 1 ? null : M.cmap((f(x, y) - R[0]) / (R[1] - R[0]), key === 'pos' ? 'viridis' : 'diverging')), { key, res: 2 });
          }
          S.rect(0, 0, 1, 1, { color: 'faint', width: 1.2 });
          // marginal panels
          const k = (PH * (C.signed ? 0.47 : 0.92)) / C.top;
          const by = C.signed ? PY + PH / 2 : PY + 0.03, bx = C.signed ? PX + PW / 2 : PX + 0.03;
          S.line(0, by, 1, by, { color: 'muted', width: 1 }); S.line(bx, 0, bx, 1, { color: 'muted', width: 1 });
          S.path([[0, by], ...C.xs.map((x, i) => [x, by + k * C.ph[i]]), [1, by]], { fill: 'purple', fillAlpha: 0.22, stroke: false, close: true });
          S.path(C.xs.map((x, i) => [x, by + k * C.ph[i]]), { color: 'purple', width: 2 });
          S.path([[bx, 0], ...C.xs.map((y, i) => [bx + k * C.ps[i], y]), [bx, 1]], { fill: 'orange', fillAlpha: 0.22, stroke: false, close: true });
          S.path(C.xs.map((y, i) => [bx + k * C.ps[i], y]), { color: 'orange', width: 2.2 });
          S.tex('\\varphi(x)=\\int_Y f(x,y)\\,dy', 0, PY + PH + 0.02, { color: 'purple', align: 'left', baseline: 'bottom', size: 13 });
          S.tex('\\psi(y)=\\int_X f(x,y)\\,dx', PX, -0.04, { color: 'orange', align: 'left', baseline: 'top', size: 13 });
          S.text('x', 1.02, by, { size: 14, color: 'muted', math: true, align: 'left' });
          // sections through the gold point
          const x = g.x, y = g.y;
          S.line(x, PY, x, 1, { color: 'purple', width: 1.2, dash: [4, 4] });
          S.line(0, y, PX + PW, y, { color: 'orange', width: 1.2, dash: [4, 4] });
          const fx = C.phi(x), fy = C.psi(y);
          S.dot(x, by + k * fx, { color: 'purple', r: 5 }); S.dot(bx + k * fy, y, { color: 'orange', r: 5 });
          S.corner(stair ? `∫φ dx = ${v.fix(C.I1, 3)}   but   ∫ψ dy = ${v.fix(C.I2, 3)}` : `∫φ dx = ${v.fix(C.I1, 4)} = ∫ψ dy = ${v.fix(C.I2, 4)}`, 'br', { color: stair ? 'red' : 'green', weight: 600 });
          // section graphs
          const drawSec = (P, h, val, col) => {
            if (stair) {
              const blocks = [];
              for (let n = 1; n <= 14; n++) { const a = blockLo(n), w = Math.pow(2, -n), z = h(a + w / 2); if (z) blocks.push([a, a + w, z]); }
              const hi = Math.max(1, ...blocks.map((b) => b[2])), lo = Math.min(0, ...blocks.map((b) => b[2]));
              P.setView(null, [lo * 1.18 - 0.08 * hi, hi * 1.18]);
              P.hline(0, { color: 'muted', width: 1 });
              for (const [a, b, z] of blocks) P.rect(a, 0, b, z, { fill: M.cmap(z > 0 ? 0.88 : 0.12, 'diverging'), fillAlpha: 0.45, color: col, width: 1.8 });
            } else {
              const ys = M.linspace(0, 1, 301).map(h), hi = Math.max(0.2, ...ys), lo = Math.min(0, ...ys);
              P.setView(null, [lo - 0.12 * (hi - lo), hi + 0.15 * (hi - lo)]);
              P.hline(0, { color: 'muted', width: 1 });
              P.fn(h, { domain: [0, 1], color: col, width: 2.2, fill: col, fillAlpha: 0.2 });
            }
            P.corner(`integral = ${v.fix(val, 3)}`, 'tr', { color: col, weight: 600 });
          };
          drawSec(A, (t) => f(x, t), fx, 'purple');
          drawSec(B, (t) => f(t, y), fy, 'orange');
          st = { key, fx, fy, C };
        });
        v.legend([['purple', '$\\varphi$ and the section $f_x$'], ['orange', '$\\psi$ and the section $f^y$'], [[200, 50, 50], 'staircase: $f>0$', { area: true }], [[40, 90, 200], 'staircase: $f<0$', { area: true }]]);
        v.readout(() => {
          const s = st, C = s.C; if (!C) return '';
          if (s.key === 'stair') return `$\\varphi(${v.fix(g.x, 2)})=${v.fix(s.fx, 3)}$, $\\psi(${v.fix(g.y, 2)})=${v.fix(s.fy, 3)}$. $\\int_0^1\\!\\big(\\int_0^1 f\\,dy\\big)dx=${v.fix(C.I1, 3)}$ but $\\int_0^1\\!\\big(\\int_0^1 f\\,dx\\big)dy=${v.fix(C.I2, 3)}$. Each diagonal block and the block to its right contribute $1$ each to $\\iint|f|$, so $\\iint_{[0,\\delta_{N+1}]^2}|f|=2N\\to\\infty$: $f\\notin L^1$ and (c) does not apply.`;
          return `$\\int_0^1\\varphi\\,dx=${v.fix(C.I1, 4)}$, $\\;\\int_0^1\\psi\\,dy=${v.fix(C.I2, 4)}$, and a direct 2-D sum gives $\\iint f=${v.fix(C.I3, 4)}$` + (s.key === 'sgn' ? `; here $\\int\\varphi^*=\\iint|f|=${v.fix(C.Iabs, 3)}<\\infty$, so (b) puts $f$ in $L^1$ and (c) applies.` : '.');
        });
      },
    },
    // ------------------------------------------------------------------ completion of product measures
    {
      num: '8.11',
      kind: 'Theorem',
      name: 'Lebesgue measure on ℝᵏ completes the product mᵣ × mₛ',
      statement: String.raw`Let $m_k$ denote Lebesgue measure on $\R^k$ and let $k=r+s$ with $r\ge1$, $s\ge1$. Then $m_k$ is the completion of the product measure $m_r\times m_s$ (on $\mathfrak M_r\times\mathfrak M_s$, where $\mathfrak M_j$ is the $\sigma$-algebra of Lebesgue measurable sets in $\R^j$).`,
      idea: String.raw`Every $k$-cell is a product of an $r$-cell and an $s$-cell, so $\mathscr B_k\subset\mathfrak M_r\times\mathfrak M_s$; conversely sets in $\mathfrak M_r\times\mathfrak M_s$ are Lebesgue measurable in $\R^k$. The measures $m_k$ and $m_r\times m_s$ agree on cells, hence (by regularity and the uniqueness in 2.20) on all of $\mathfrak M_r\times\mathfrak M_s$. Finally each $E\in\mathfrak M_k$ lies between two Borel sets $F\subset E\subset G$ with $m_k(G\setminus F)=0$, so $\mathfrak M_k$ is contained in the completion. The completion is really needed (8.10): if $B\subset\R$ is not measurable, then $\{x_0\}\times B$ has $m_2$-measure $0$, but its $x_0$-section is $B$, so by 8.2 it is not in $\mathfrak M_1\times\mathfrak M_1$.`,
      caption: String.raw`Left: $m_2$ computed from dyadic squares (green inside, orange on the boundary) — the definition of Lebesgue measure. Right: $m_1\times m_1$ computed from sections, $\int m_1(E_x)\,dx$. The two agree. The red dust on the line $x=x_0$ stands for an arbitrary set $B$, measurable or not: the column of squares around it has area $2^{-n}\to0$, so $S=\{x_0\}\times B$ is $m_2$-null, yet its section $S_{x_0}=B$ need not be measurable — so $S$ belongs to the completion but not to $\mathfrak M_1\times\mathfrak M_1$.`,
      deps: ['rca-2.20', 'rca-8.7', 'rca-1.36', 'rca-8.2', 'rca-2.22a'],
      tags: ['Lebesgue measure', 'completion', 'product measure'],
      viz(v) {
        const M = v.M;
        const lev = v.slider('dyadic level $n$', 1, 7, 4, { int: true });
        const L = v.stage({ x: [-0.03, 1.03], y: [-0.12, 1.1], equal: true, height: 380, axes: false, title: '$m_2$: covering by dyadic squares' });
        const R = v.stage({ x: [-0.03, 1.03], y: [-0.58, 1.05], equal: true, height: 380, axes: false, title: '$m_1\\times m_1$: integrating sections' });
        const x0h = L.handle(0.82, -0.06, { color: 'red', label: 'x₀', labelPos: 'e', constrain: (x) => [M.clamp(x, 0.01, 0.99), -0.06] });
        const xh = R.handle(0.4, -0.04, { color: 'gold', label: 'x', labelPos: 'e', constrain: (x) => [M.clamp(x, 0.001, 0.999), -0.04] });
        // E: a tilted ellipse (convex polygon, so the square tests are exact)
        const E = Array.from({ length: 160 }, (_, i) => { const t = (2 * Math.PI * i) / 160, c = Math.cos(0.6), s = Math.sin(0.6), a = 0.36 * Math.cos(t), b = 0.21 * Math.sin(t); return [0.45 + a * c - b * s, 0.52 + a * s + b * c]; });
        const area = Math.abs(M.polyArea(E));
        const B = dust(5);
        const phi = (x) => ivLen(polySection(E, x, 0));
        const I = avg01(phi, 4000), xs = M.linspace(0, 1, 401), ph = xs.map(phi);
        let st = {};
        v.render(() => {
          const n = lev.value, k = 1 << n, h = 1 / k;
          let ni = 0, no = 0;
          for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) {
            const a = i * h, b = j * h;
            if (!meetsConvex(E, a, b, a + h, b + h)) continue;
            no++;
            const ins = [[a, b], [a + h, b], [a + h, b + h], [a, b + h]].every((p) => M.pointInPoly(p, E));
            if (ins) ni++;
            L.rect(a, b, a + h, b + h, ins ? { fill: 'green', fillAlpha: 0.4, color: 'panel', width: n > 5 ? 0.4 : 1 } : { fill: 'orange', fillAlpha: 0.3, color: 'orange', width: 0.6, alpha: 0.6 });
          }
          // the null segment {x0} × B and its covering column
          const i0 = Math.min(k - 1, Math.floor(x0h.x / h));
          L.rect(i0 * h, 0, (i0 + 1) * h, 1, { fill: 'red', fillAlpha: 0.1, color: 'red', width: 1, dash: [4, 3] });
          L.rect(0, 0, 1, 1, { color: 'faint', width: 1.2 });
          L.poly(E, { color: 'accent', width: 2.2 });
          L.tex('E', 0.2, 0.74, { color: 'accent', size: 17 });
          drawIv(L, B, x0h.x, 0, { color: 'red', width: 4 });
          L.tex('S=\\{x_0\\}\\times B', x0h.x, 1, { color: 'red', align: x0h.x > 0.6 ? 'right' : 'left', baseline: 'bottom', dx: x0h.x > 0.6 ? 4 : -4, dy: -2, size: 13 });
          // right: sections
          R.rect(0, 0, 1, 1, { color: 'faint', width: 1.2 });
          R.poly(E, { color: 'accent', width: 2, fill: 'accent', fillAlpha: 0.14 });
          R.tex('E', 0.2, 0.74, { color: 'accent', size: 17 });
          drawIv(R, B, x0h.x, 0, { color: 'red', width: 4, alpha: 0.85 });
          const PY = -0.5, K = 0.4 / 0.7;
          R.line(0, PY, 1, PY, { color: 'muted', width: 1 });
          R.path([[0, PY], ...xs.map((x, i) => [x, PY + K * ph[i]]), [1, PY]], { fill: 'purple', fillAlpha: 0.22, stroke: false, close: true });
          R.path(xs.map((x, i) => [x, PY + K * ph[i]]), { color: 'purple', width: 2 });
          R.tex('m_1(E_x)', 0, PY + 0.42, { color: 'purple', align: 'left', baseline: 'bottom', size: 13 });
          const sec = polySection(E, xh.x, 0);
          R.line(xh.x, PY, xh.x, 1, { color: 'gold', width: 1.2, dash: [4, 4] });
          drawIv(R, sec, xh.x, 0, { color: 'purple', width: 5 });
          R.dot(xh.x, PY + K * phi(xh.x), { color: 'purple', r: 5 });
          R.line(x0h.x, PY, x0h.x, PY + 0.4, { color: 'red', width: 1, dash: [2, 3] });
          R.tex('S_{x_0}=B\\;?', x0h.x, PY + 0.4, { color: 'red', baseline: 'bottom', size: 12 });
          st = { n, ni, no, h };
        });
        v.legend([['green', 'squares inside $E$', { area: true }], ['orange', 'squares meeting $\\partial E$', { area: true }], ['purple', '$x\\mapsto m_1(E_x)$'], ['red', '$S=\\{x_0\\}\\times B$ and its covering column', { area: true }]]);
        v.readout(() => {
          const s = st, lo = s.ni * s.h * s.h, hi = s.no * s.h * s.h;
          return `Squares: $${v.fix(lo, 4)}\\le m_2(E)\\le ${v.fix(hi, 4)}$ (exact: $${v.fix(area, 4)}$). Sections: $\\int_0^1 m_1(E_x)\\,dx=${v.fix(I, 4)}$. The segment $S$ lies in a column of area $2^{-${s.n}}=${v.fix(s.h, 4)}$, so $m_2(S)=0$ and $S\\in\\mathfrak M_2$ for every $B$; but $S\\in\\mathfrak M_1\\times\\mathfrak M_1$ only if $B=S_{x_0}$ is measurable.`;
        });
      },
    },
    {
      num: '8.12',
      kind: 'Theorem',
      name: 'Fubini for the completed product',
      statement: String.raw`Let $(X,\mathscr S,\mu)$ and $(Y,\mathscr T,\lambda)$ be complete $\sigma$-finite measure spaces, let $(\mathscr S\times\mathscr T)^*$ be the completion of $\mathscr S\times\mathscr T$ with respect to $\mu\times\lambda$, and let $f$ be an $(\mathscr S\times\mathscr T)^*$-measurable function on $X\times Y$. Then all conclusions of the Fubini theorem 8.8 hold, with one change: $f_x$ is $\mathscr T$-measurable only for almost every $x\in X$, so $\varphi(x)=\int_Y f_x\,d\lambda$ is defined only a.e. $[\mu]$; likewise $f^y$ is $\mathscr S$-measurable for almost every $y\in Y$ and $\psi$ is defined a.e. $[\lambda]$.`,
      idea: String.raw`Write $f=g+h$ with $g$ $(\mathscr S\times\mathscr T)$-measurable and $h=0$ a.e. $[\mu\times\lambda]$ — every function measurable for a completion has this form. Then $h$ vanishes outside some $P\in\mathscr S\times\mathscr T$ with $(\mu\times\lambda)(P)=0$, and $0=(\mu\times\lambda)(P)=\int\lambda(P_x)\,d\mu$ forces $\lambda(P_x)=0$ for almost every $x$. For those $x$, $h_x$ vanishes outside a $\lambda$-null set, hence is measurable (here completeness of $\lambda$ is used) and $\int h_x\,d\lambda=0$. So 8.8 applied to $g$ gives every conclusion for $f$, off a $\mu$-null set of $x$.`,
      caption: String.raw`$f=g+h$ on $[0,1]^2$: $g$ is a smooth function (the heat map), and $h=\chi_N$ where $N=\bigcup_{z\in Z}\{z\}\times B$, with $Z$ a null set of $x$-values (three points, or the Cantor set, drawn at level 5) and $B$ an arbitrary — say nonmeasurable — set (red dust). Drag $x$ (it snaps onto $Z$ when close): on $Z$ the section $f_x=g_x+\chi_B$ is not measurable and $\varphi(x)$ is undefined (hollow marks); elsewhere nothing changes. Each horizontal section $f^y$ differs from $g^y$ on the null set $Z$ only, so $\psi$ is defined everywhere. Both integrals still agree.`,
      deps: ['rca-8.8', 'rca-1.36', 'rca-1.35'],
      tags: ['Fubini', 'completion'],
      viz(v) {
        const M = v.M;
        const zS = v.select('null set $Z$', [{ value: 'pts', label: 'three points' }, { value: 'cantor', label: 'Cantor set' }], 'pts');
        const S = v.stage({ x: [-0.1, 1.68], y: [-0.74, 1.06], equal: true, height: 480, axes: false });
        const g = (x, y) => 1.2 * Math.exp(-((x - 0.35) ** 2 + (y - 0.6) ** 2) / 0.05) + 0.8 * Math.exp(-((x - 0.72) ** 2 + (y - 0.3) ** 2) / 0.03) + 0.2;
        const PTS = [0.27, 0.5, 0.81];
        const cantorLv = 5, CI = v.M.cantorIntervals(cantorLv);
        // nearest point of the Cantor set (endpoints of removed thirds belong to it)
        const nearC = (x, a = 0, b = 1, d = 34) => {
          if (d === 0) return M.clamp(x, a, b);
          const t = (b - a) / 3;
          if (x <= a + t) return nearC(x, a, a + t, d - 1);
          if (x >= b - t) return nearC(x, b - t, b, d - 1);
          return x - (a + t) < b - t - x ? a + t : b - t;
        };
        const isBad = (x) => (zS.value === 'pts' ? PTS.some((z) => Math.abs(z - x) < 1e-9) : Math.abs(nearC(x) - x) < 1e-9);
        const xh = S.handle(0.5, 0.42, {
          color: 'gold', constrain: (x, y) => {
            x = M.clamp(x, 0.002, 0.998); y = M.clamp(y, 0.002, 0.998);
            if (zS.value === 'pts') { const z = PTS.find((p) => Math.abs(p - x) < 0.015); if (z != null) x = z; }
            else { const c = nearC(x); if (Math.abs(c - x) < 0.006) x = c; }
            return [x, y];
          },
        });
        const B = dust(9, 40);
        const PX = 1.1, PY = -0.66, K = 0.5 / 0.75;
        const phiG = (x) => M.integrate((y) => g(x, y), 0, 1, 120), psiG = (y) => M.integrate((x) => g(x, y), 0, 1, 120);
        const xs = M.linspace(0, 1, 801), ph = xs.map(phiG), ps = xs.map(psiG);
        const I1 = M.integrate(phiG, 0, 1, 200), I2 = M.integrate(psiG, 0, 1, 200);
        let st = {};
        v.render(() => {
          const pts = zS.value === 'pts';
          S.heat((x, y) => (x < 0 || x > 1 || y < 0 || y > 1 ? NaN : g(x, y)), { range: [0, 1.7], cmap: 'viridis', key: 'g', res: 2, alpha: 0.5 });
          S.rect(0, 0, 1, 1, { color: 'faint', width: 1.2 });
          // the bad lines
          const lines = pts ? PTS.map((z) => [z, z]) : CI;
          for (const [a, b] of lines) {
            if (!pts) S.rect(a, 0, b, 1, { fill: 'red', fillAlpha: 0.22, stroke: false });
            const c = (a + b) / 2;
            if (pts) drawIv(S, B, c, 0, { color: 'red', width: 3.5 });
          }
          if (!pts) for (const [a, b] of CI) { const c = (a + b) / 2; for (const [u, w] of B) S.line(c, u, c, w, { color: 'red', width: 1.6, cap: 'butt' }); }
          // marginals: φ with holes on Z, ψ everywhere
          S.line(0, PY, 1, PY, { color: 'muted', width: 1 }); S.line(PX, 0, PX, 1, { color: 'muted', width: 1 });
          S.path([[0, PY], ...xs.map((x, i) => [x, PY + K * ph[i]]), [1, PY]], { fill: 'purple', fillAlpha: 0.18, stroke: false, close: true });
          S.path(xs.map((x, i) => [x, PY + K * ph[i]]), { color: 'purple', width: 2 });
          if (pts) for (const z of PTS) { S.dot(z, PY + K * phiG(z), { color: 'red', r: 5, hollow: true, width: 2 }); }
          else for (const [a, b] of CI) S.line(a, PY - 0.025, b, PY - 0.025, { color: 'red', width: 4, cap: 'butt' });
          S.path([[PX, 0], ...xs.map((y, i) => [PX + K * ps[i], y]), [PX, 1]], { fill: 'orange', fillAlpha: 0.18, stroke: false, close: true });
          S.path(xs.map((y, i) => [PX + K * ps[i], y]), { color: 'orange', width: 2 });
          S.tex('\\varphi(x)=\\int f_x\\,d\\lambda\\ \\ (\\text{a.e.})', 0, PY + 0.52, { color: 'purple', align: 'left', baseline: 'bottom', size: 13 });
          S.tex('\\psi(y)=\\int f^y\\,d\\mu', PX, -0.04, { color: 'orange', align: 'left', baseline: 'top', size: 13 });
          // sections through the gold point
          const x = xh.x, y = xh.y, bad = isBad(x);
          S.line(x, PY, x, 1, { color: bad ? 'red' : 'purple', width: 1.4, dash: [4, 4] });
          S.line(0, y, PX + 0.6, y, { color: 'orange', width: 1.2, dash: [4, 4] });
          if (bad) S.dot(x, PY + K * phiG(x), { color: 'red', r: 7, hollow: true, width: 2.5 });
          else S.dot(x, PY + K * phiG(x), { color: 'purple', r: 5 });
          S.dot(PX + K * psiG(y), y, { color: 'orange', r: 5 });
          S.corner(bad ? `x ∈ Z: f_x is not measurable, φ(x) undefined` : `∫φ dx = ${v.fix(I1, 4)} = ∫ψ dy = ${v.fix(I2, 4)}`, 'br', { color: bad ? 'red' : 'green', weight: 600 });
          st = { bad, x, fx: phiG(x), fy: psiG(y) };
        });
        v.legend([['red', '$N=Z\\times B$ (a $\\mu\\times\\lambda$-null set)', { area: true }], ['purple', '$\\varphi$, undefined on $Z$'], ['orange', '$\\psi$, defined everywhere']]);
        v.readout(() => {
          const s = st;
          const tail = ` $\\;\\int_0^1\\varphi\\,dx=${v.fix(I1, 4)}$ and $\\int_0^1\\psi\\,dy=${v.fix(I2, 4)}$ — the null set $Z$ does not affect the integral.`;
          return (s.bad ? `At $x=${v.fix(s.x, 3)}\\in Z$ the section $f_x=g_x+\\chi_B$ is not Lebesgue measurable, so $\\varphi(x)$ is undefined.` : `At $x=${v.fix(s.x, 3)}\\notin Z$: $f_x=g_x$, $\\varphi(x)=${v.fix(s.fx, 3)}$; $\\psi(${v.fix(xh.y, 2)})=${v.fix(s.fy, 3)}$.`) + tail;
        });
      },
    },
  ],
};
