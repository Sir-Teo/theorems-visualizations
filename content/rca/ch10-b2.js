// Rudin, Real and Complex Analysis — Chapter 10, part b2: chains and cycles, the global Cauchy theorem,
// and the homotopy form of the index (10.34–10.40).

// ---------------------------------------------------------------- helpers shared by this file
// Closed Catmull–Rom spline through the points P (array of [x, y]); m samples per span.
function splineClosed(P, m = 48) {
  const n = P.length, out = [];
  for (let i = 0; i < n; i++) {
    const p0 = P[(i - 1 + n) % n], p1 = P[i], p2 = P[(i + 1) % n], p3 = P[(i + 2) % n];
    for (let k = 0; k < m; k++) {
      const t = k / m, t2 = t * t, t3 = t2 * t;
      const c = (a, b, cc, d) => 0.5 * (2 * b + (-a + cc) * t + (2 * a - 5 * b + 4 * cc - d) * t2 + (-a + 3 * b - 3 * cc + d) * t3);
      out.push([c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  return out;
}
// Winding number of a closed polygon about (x, y) (signed crossing count).
function windPoly(P, x, y) {
  let w = 0; const n = P.length;
  for (let i = 0; i < n; i++) {
    const a = P[i], b = P[(i + 1) % n];
    const s = (b[0] - a[0]) * (y - a[1]) - (x - a[0]) * (b[1] - a[1]);
    if (a[1] <= y) { if (b[1] > y && s > 0) w++; } else if (b[1] <= y && s < 0) w--;
  }
  return w;
}
// Fast winding-number field of a cycle (list of closed polygons with integer weights), for rasters:
// per row, the signed crossings of the horizontal line are cached; the index at x is the sum of the signs
// of crossings to the right of x.
function windingField(polys, weights) {
  let rowY = NaN, xs = [], suf = [];
  return (x, y) => {
    if (y !== rowY) {
      rowY = y; const cr = [];
      polys.forEach((P, k) => {
        const wgt = weights ? weights[k] : 1; if (!wgt) return;
        const n = P.length;
        for (let i = 0; i < n; i++) {
          const a = P[i], b = P[(i + 1) % n];
          if (a[1] <= y && b[1] > y) cr.push([a[0] + ((y - a[1]) * (b[0] - a[0])) / (b[1] - a[1]), wgt]);
          else if (a[1] > y && b[1] <= y) cr.push([a[0] + ((y - a[1]) * (b[0] - a[0])) / (b[1] - a[1]), -wgt]);
        }
      });
      cr.sort((p, q) => p[0] - q[0]);
      xs = cr.map((c) => c[0]); suf = new Array(cr.length + 1).fill(0);
      for (let i = cr.length - 1; i >= 0; i--) suf[i] = suf[i + 1] + cr[i][1];
    }
    let lo = 0, hi = xs.length;
    while (lo < hi) { const m = (lo + hi) >> 1; if (xs[m] > x) hi = m; else lo = m + 1; }
    return suf[lo];
  };
}
// Paint the index field (blue for positive, red for negative values) and label each region.
function paintIndex(v, S, field, key, { labels = true, size = 15, skipZero = false, avoid = [] } = {}) {
  const B = v.rgb('blue'), R = v.rgb('red');
  S.raster((x, y) => {
    const w = field(x, y); if (!w) return null;
    const c = w > 0 ? B : R, a = Math.min(0.62, 0.17 * Math.abs(w) + 0.05);
    return [c[0], c[1], c[2], 255 * a];
  }, { key, res: 3, id: 'ind' });
  if (!labels) return;
  // coarse grid → connected components → label at the cell farthest from the component's edge
  const step = 16, nx = Math.ceil(S.width / step), ny = Math.ceil(S.height / step);
  const val = [], seen = new Int32Array(nx * ny).fill(-1);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const [x, y] = S.inv((i + 0.5) * step, (j + 0.5) * step); val.push(field(x, y)); }
  let comp = 0;
  for (let s0 = 0; s0 < nx * ny; s0++) {
    if (seen[s0] >= 0) continue;
    const q = [s0], cells = []; seen[s0] = comp;
    while (q.length) { const c = q.pop(); cells.push(c); const i = c % nx, j = (c / nx) | 0; for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= nx || jj >= ny) continue; const d = jj * nx + ii; if (seen[d] < 0 && val[d] === val[s0]) { seen[d] = comp; q.push(d); } } }
    comp++;
    const border = cells.some((c) => { const i = c % nx, j = (c / nx) | 0; return i === 0 || j === 0 || i === nx - 1 || j === ny - 1; });
    if (cells.length < 3 || (skipZero && val[s0] === 0) || (border && val[s0] === 0)) continue;
    // distance (in cells) to the nearest cell with a different value, by brute force over the component's rim
    const rim = cells.filter((c) => { const i = c % nx, j = (c / nx) | 0; return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([di, dj]) => { const ii = i + di, jj = j + dj; return ii >= 0 && jj >= 0 && ii < nx && jj < ny && val[jj * nx + ii] !== val[s0]; }); });
    let best = cells[0], bd = -1;
    for (const c of cells) {
      const i = c % nx, j = (c / nx) | 0;
      if (i < 1 || j < 1 || i > nx - 2 || j > ny - 2) continue;
      const px = (i + 0.5) * step, py = (j + 0.5) * step;
      if (avoid.some(([ax, ay, ar]) => Math.hypot(S.X(ax) - px, S.Y(ay) - py) < (ar ?? 0) * S.scale + 30)) continue;
      let d = Infinity; for (const r of rim) d = Math.min(d, Math.hypot(i - (r % nx), j - ((r / nx) | 0))); if (!rim.length) d = Math.min(i, j, nx - 1 - i, ny - 1 - j);
      if (d > bd) { bd = d; best = c; }
    }
    if (bd < 0) continue;
    if (bd < 0.9 && cells.length < 12) continue;
    const [x, y] = S.inv(((best % nx) + 0.5) * step, (((best / nx) | 0) + 0.5) * step);
    const w = val[s0];
    S.tex(String(w), x, y, { color: w > 0 ? 'blue' : w < 0 ? 'red' : 'muted', size });
  }
}
// Contour integral Σ f(mid) Δz over a closed polygon (f maps [x, y] → [re, im]).
function polyIntegral(P, f) {
  let sr = 0, si = 0; const n = P.length;
  for (let i = 0; i < n; i++) {
    const a = P[i], b = P[(i + 1) % n], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], dz = [b[0] - a[0], b[1] - a[1]], w = f(m);
    sr += w[0] * dz[0] - w[1] * dz[1]; si += w[0] * dz[1] + w[1] * dz[0];
  }
  return [sr, si];
}
// Orientation arrows along a closed polygon.
function arrowsOn(S, P, color, fracs = [0.08, 0.33, 0.58, 0.83], head = 10) {
  const n = P.length, L = 15 / S.scale;
  for (const f of fracs) {
    const i = Math.floor(f * n) % n, a = P[i]; let j = i + 1;
    while (j < i + n / 4 && Math.hypot(P[j % n][0] - a[0], P[j % n][1] - a[1]) < L) j++;
    const b = P[j % n]; S.arrow(a[0], a[1], b[0], b[1], { color, head, width: 2.2 });
  }
}
// A small "×" with a halo.
function xMark(S, x, y, color = 'ink', size = 6) {
  const d = size / S.scale;
  for (const [col, w] of [['panel', 5.5], [color, 2.4]]) {
    S.line(x - d, y - d, x + d, y + d, { color: col, width: w });
    S.line(x - d, y + d, x + d, y - d, { color: col, width: w });
  }
}
const distToPoly = (P, x, y) => { let d = Infinity; const n = P.length; for (let i = 0; i < n; i++) { const a = P[i], b = P[(i + 1) % n], ux = b[0] - a[0], uy = b[1] - a[1], L2 = ux * ux + uy * uy || 1, t = Math.max(0, Math.min(1, ((x - a[0]) * ux + (y - a[1]) * uy) / L2)); d = Math.min(d, Math.hypot(a[0] + t * ux - x, a[1] + t * uy - y)); } return d; };
// TeX for a complex number [re, im], dropping a part that is negligible (< 1e-9 of the other) as rounding noise.
function cfmt(v, z, d = 3) {
  const [re, im] = z, tiny = 1e-9 * Math.max(Math.abs(re), Math.abs(im), 1e-300);
  const R = Math.abs(re) > tiny ? v.sci(re, d) : null, I = Math.abs(im) > tiny ? v.sci(Math.abs(im), d) : null;
  if (R == null && I == null) return '0';
  if (I == null) return R;
  if (R == null) return `${im < 0 ? '-' : ''}${I}\\,i`;
  return `${R} ${im < 0 ? '-' : '+'} ${I}\\,i`;
}

export default {
  collection: 'rca',
  chapter: 10,
  items: [
    // ------------------------------------------------------------------ 10.34
    {
      num: '10.34',
      kind: 'Definition',
      name: 'Chains and cycles',
      statement: String.raw`If $\gamma_1,\dots,\gamma_n$ are paths in the plane, the *chain* $\Gamma=\gamma_1\dotplus\cdots\dotplus\gamma_n$ is their formal sum: $\Gamma^*=\gamma_1^*\cup\dots\cup\gamma_n^*$, and for $f\in C(\Gamma^*)$
$$\int_\Gamma f=\sum_{j=1}^n\int_{\gamma_j}f .$$
Chains are added by concatenating their lists of paths, and $-\Gamma$ is the chain of reversed paths; so integer combinations of paths make sense. A chain in which every $\gamma_j$ is a closed path is a *cycle*. For a cycle and $\alpha\notin\Gamma^*$,
$$\Ind_\Gamma(\alpha)=\frac1{2\pi i}\int_\Gamma\frac{dz}{z-\alpha}=\sum_j\Ind_{\gamma_j}(\alpha).$$`,
      idea: String.raw`A chain is just bookkeeping: integrals over a chain are defined to be additive, so one can integrate over several closed curves at once — the boundary of an annulus is the outer circle plus the *reversed* inner circle. Because $\Ind_\Gamma$ is the sum of the indices of the pieces, it is again integer-valued, constant on the components of $\C\setminus\Gamma^*$, and $0$ on the unbounded one (10.10).`,
      caption: String.raw`$\Gamma=n_1\gamma_1\dotplus n_2\gamma_2\dotplus n_3\gamma_3$ for three circles (drag their centres and the small radius handles; set the multiplicities with the sliders, negative means reversed). Each region of the plane is shaded and labelled with $\Ind_\Gamma$, which is simply the sum of the multiplicities of the circles surrounding it. The readout checks the probe point $\alpha$ against a numerical contour integral over the whole chain.`,
      deps: ['rca-10.9', 'rca-10.10'],
      verify: true,
      tags: ['cycles', 'index'],
      viz(v) {
        const M = v.M;
        const PRE = {
          ann: { label: 'annulus: $\\gamma_1\\dotplus(-\\gamma_2)$', c: [[-0.2, 0, 1.65], [0.25, 0.1, 0.75], [2.4, 1.1, 0.45]], n: [1, -1, 0] },
          two: { label: 'overlap: $\\gamma_1\\dotplus\\gamma_2$', c: [[-0.7, 0, 1.25], [0.75, 0.1, 1.15], [2.45, -1.1, 0.45]], n: [1, 1, 0] },
          mix: { label: '$2\\gamma_1\\dotplus(-\\gamma_2)\\dotplus\\gamma_3$', c: [[-0.6, 0.1, 1.5], [-0.3, 0.3, 0.6], [1.2, -0.3, 1.0]], n: [2, -1, 1] },
        };
        const pre = v.select('', Object.entries(PRE).map(([value, o]) => ({ value, label: o.label })), 'ann');
        const nS = [0, 1, 2].map((k) => v.slider(`$n_${k + 1}$`, -2, 2, PRE.ann.n[k], { int: true }));
        const S = v.stage({ x: [-3.3, 3.3], y: [-2.2, 2.2], equal: true, height: 400, full: true, axes: false, title: 'regions labelled by $\\operatorname{Ind}_\\Gamma$' });
        const COL = ['accent', 'orange', 'purple'];
        const C = [0, 1, 2].map((k) => S.handle(0, 0, { color: COL[k], label: `γ${'₁₂₃'[k]}`, labelPos: 'nw' }));
        const Rh = [0, 1, 2].map((k) => S.handle(1, 0, { color: COL[k], r: 5 }));
        const prev = C.map((h) => [h.x, h.y]);
        C.forEach((h, k) => { h.onDrag = () => { Rh[k].x += h.x - prev[k][0]; Rh[k].y += h.y - prev[k][1]; prev[k] = [h.x, h.y]; }; });
        Rh.forEach((h, k) => { h.constrain = (x, y) => { const dx = x - C[k].x, dy = y - C[k].y, d = Math.hypot(dx, dy) || 1, r = M.clamp(d, 0.2, 2.4); return [C[k].x + (dx / d) * r, C[k].y + (dy / d) * r]; }; });
        const al = S.handle(-1.15, -0.5, { color: 'ink', label: 'α', labelPos: 'ne', r: 6 });
        let last = null, state = null;
        v.render(() => {
          if (last !== pre.value) {
            last = pre.value; const P = PRE[pre.value];
            P.c.forEach(([x, y, r], k) => { C[k].x = x; C[k].y = y; Rh[k].x = x + r * Math.cos(-0.6 + k); Rh[k].y = y + r * Math.sin(-0.6 + k); prev[k] = [x, y]; nS[k].value = P.n[k]; });
          }
          const circ = C.map((h, k) => ({ x: h.x, y: h.y, r: Math.hypot(Rh[k].x - h.x, Rh[k].y - h.y), n: nS[k].value }));
          const polys = circ.map((c) => { const out = []; for (let i = 0; i < 240; i++) { const t = (2 * Math.PI * i) / 240; out.push([c.x + c.r * Math.cos(t), c.y + c.r * Math.sin(t)]); } return out; });
          const field = windingField(polys, circ.map((c) => c.n));
          paintIndex(v, S, field, circ.map((c) => `${c.x},${c.y},${c.r},${c.n}`).join('|'), { avoid: [...C, al].map((h) => [h.x, h.y]) });
          circ.forEach((c, k) => {
            const P = polys[k], dirP = c.n >= 0 ? P : P.slice().reverse();
            S.path(P, { color: COL[k], width: c.n ? 2.6 : 1.4, alpha: c.n ? 1 : 0.45, dash: c.n ? null : [5, 4], close: true });
            if (c.n) arrowsOn(S, dirP, COL[k], [0.12, 0.45, 0.78], 11);
            const lp = [c.x + c.r * Math.cos(2.2), c.y + c.r * Math.sin(2.2)];
            S.tex(c.n === 0 ? '\\times 0' : c.n === 1 ? '\\times 1' : `\\times(${c.n})`.replace('(2)', '2'), lp[0], lp[1], { color: COL[k], size: 13, dx: -10, dy: -10 });
          });
          // the index at α: numerical contour integral over the chain vs the sum of the pieces' indices
          let sr = 0, si = 0;
          circ.forEach((c, k) => { if (!c.n) return; const [a, b] = polyIntegral(polys[k], ([x, y]) => { const dx = x - al.x, dy = y - al.y, d = dx * dx + dy * dy; return [dx / d, -dy / d]; }); sr += c.n * a; si += c.n * b; });
          const indNum = [si / (2 * Math.PI), -sr / (2 * Math.PI)];
          const parts = circ.map((c) => (Math.hypot(al.x - c.x, al.y - c.y) < c.r ? 1 : 0));
          state = { indNum, parts, n: circ.map((c) => c.n) };
        });
        v.readout(() => {
          const s = state; if (!s) return '';
          const terms = s.n.map((n, k) => `(${n})\\cdot${s.parts[k]}`).join(' + ');
          const sum = s.n.reduce((t, n, k) => t + n * s.parts[k], 0);
          return `$\\operatorname{Ind}_\\Gamma(\\alpha) = \\sum_j n_j\\operatorname{Ind}_{\\gamma_j}(\\alpha) = ${terms} = ${sum}$; $\\;$ numerically $\\frac{1}{2\\pi i}\\int_\\Gamma\\frac{dz}{z-\\alpha} = ${cfmt(v, s.indNum, 4)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 10.35
    {
      num: '10.35',
      kind: 'Theorem',
      name: "Cauchy's theorem, global version",
      statement: String.raw`Let $\Omega$ be an arbitrary open set in the plane, $f\in H(\Omega)$, and $\Gamma$ a cycle in $\Omega$ such that $\Ind_\Gamma(\alpha)=0$ for every $\alpha$ not in $\Omega$. Then
(a) $f(z)\,\Ind_\Gamma(z)=\dfrac1{2\pi i}\displaystyle\int_\Gamma\frac{f(w)}{w-z}\,dw$ for every $z\in\Omega\setminus\Gamma^*$, and
(b) $\displaystyle\int_\Gamma f(z)\,dz=0$.
(c) If $\Gamma_0$ and $\Gamma_1$ are cycles in $\Omega$ with $\Ind_{\Gamma_0}(\alpha)=\Ind_{\Gamma_1}(\alpha)$ for every $\alpha\notin\Omega$, then $\int_{\Gamma_0}f=\int_{\Gamma_1}f$.`,
      idea: String.raw`(Dixon's proof.) With $g(z,w)$ the continuous difference quotient of Lemma 10.29, $h(z)=\frac1{2\pi i}\int_\Gamma g(z,w)\,dw$ is holomorphic in $\Omega$, and (a) says exactly that $h=0$. On $\Omega_1=\{z\notin\Gamma^*:\Ind_\Gamma(z)=0\}$ the Cauchy integral $\frac1{2\pi i}\int_\Gamma\frac{f(w)}{w-z}dw$ is holomorphic and agrees with $h$ on $\Omega\cap\Omega_1$; the hypothesis says $\Omega\cup\Omega_1=\C$, so together they form an entire function, which tends to $0$ at $\infty$ and is therefore $0$ by Liouville (10.23). Apply (a) to $(z-a)f(z)$ to get (b), and (b) to $\Gamma_0\dotplus(-\Gamma_1)$ to get (c).`,
      caption: String.raw`The grey discs are holes: $\Omega$ is the plane without them, and $f=\frac1{z-h_1}+e^{0.7/(z-h_2)}-\frac{0.8i}{z-h_3}$ is holomorphic in $\Omega$ but singular in every hole. Drag the eight handles to reshape the closed path $\Gamma$; regions are labelled by $\Ind_\Gamma$. While every hole has index $0$, the integral $\int_\Gamma f$ vanishes and the Cauchy formula (a) holds at the probe $z$ — even where $\Ind_\Gamma(z)=\pm1$ or $2$. Wind $\Gamma$ around a hole and both fail.`,
      deps: ['rca-10.34', 'rca-10.29', 'rca-10.17', 'rca-10.23', 'rca-10.10'],
      see: ['pma-10.33', 'fa-3.31'],
      tags: ['Cauchy', 'cycles', 'index'],
      viz(v) {
        const M = v.M;
        const HOLES = [[-1.75, 0.55, 0.32], [0.15, -0.75, 0.3], [1.85, 0.55, 0.32]];
        const f = ([x, y]) => {
          // 1/(z-h1) + exp(0.7/(z-h2)) - 0.8i/(z-h3)
          let dx = x - HOLES[0][0], dy = y - HOLES[0][1], d = dx * dx + dy * dy; let re = dx / d, im = -dy / d;
          dx = x - HOLES[1][0]; dy = y - HOLES[1][1]; d = dx * dx + dy * dy; const ur = (0.7 * dx) / d, ui = (-0.7 * dy) / d, e = Math.exp(ur); re += e * Math.cos(ui); im += e * Math.sin(ui);
          dx = x - HOLES[2][0]; dy = y - HOLES[2][1]; d = dx * dx + dy * dy; re += (-0.8 * dy) / d; im += (-0.8 * dx) / d;
          return [re, im];
        };
        const PRE = {
          weave: { label: 'a figure eight between the holes', pts: [[-0.35, 1.2], [-1.2, 0.95], [-1.1, -0.05], [0.15, 0.2], [1.0, -0.05], [1.35, -1.0], [0.65, -1.35], [0.45, 0.35]] },
          double: { label: 'a double loop', pts: [[0.3, -0.15], [1.3, 0.95], [0.2, 1.6], [-0.5, 0.6], [0.25, 0.05], [1.1, 0.25], [0.2, 0.95], [-0.9, 0.05]] },
          around: { label: 'around a hole', pts: [[-0.7, -1.5], [0.9, -1.6], [1.2, -0.6], [0.8, 0.3], [-0.2, 0.45], [-1.0, 0.05], [-0.6, -0.4], [-1.1, -1.0]] },
        };
        const pre = v.select('$\\Gamma$', Object.entries(PRE).map(([value, o]) => ({ value, label: o.label })), 'weave');
        const S = v.stage({ x: [-2.9, 2.9], y: [-1.9, 1.9], equal: true, height: 400, weight: 1.7, minWidth: 420, axes: false, title: '$\\Omega=\\C$ minus the grey holes; regions labelled by $\\operatorname{Ind}_\\Gamma$' });
        const R = v.stage({ x: [-1, 1], y: [-1, 1], equal: true, height: 400, weight: 1, minWidth: 250, axes: true, title: 'values' });
        const H = PRE.weave.pts.map(([x, y]) => S.handle(x, y, { color: 'gold', r: 6 }));
        const zp = S.handle(-0.55, 0.75, { color: 'accent', label: 'z', labelPos: 'ne' });
        let last = null, state = null;
        v.legend([['accent', '$f(z)\\operatorname{Ind}_\\Gamma(z)$', { dot: true }], ['gold', '$\\frac{1}{2\\pi i}\\int_\\Gamma\\frac{f(w)}{w-z}dw$', { dot: true }], ['green', '$\\frac{1}{2\\pi i}\\int_\\Gamma f$ (should be $0$)', { dot: true }]]);
        v.render(() => {
          if (last !== pre.value) { last = pre.value; PRE[pre.value].pts.forEach(([x, y], k) => { H[k].x = x; H[k].y = y; }); }
          const P = splineClosed(H.map((h) => [h.x, h.y]), 60);
          const field = windingField([P]);
          paintIndex(v, S, field, P.map((p) => p[0].toFixed(3) + p[1].toFixed(3)).join(''), { avoid: [...HOLES, [zp.x, zp.y]] });
          // holes and their indices
          const hInd = HOLES.map(([x, y]) => windPoly(P, x, y));
          const inOmega = HOLES.every(([x, y, r]) => distToPoly(P, x, y) > r);
          HOLES.forEach(([x, y, r], k) => {
            S.circle(x, y, r, { fill: 'gray', fillAlpha: 0.55, color: 'muted', width: 1.4 });
            S.tex(`h_${k + 1}`, x, y, { color: 'ink', size: 14 });
            S.tex(`\\operatorname{Ind}=${hInd[k]}`, x, y - r, { color: hInd[k] ? 'red' : 'green', size: 12.5, baseline: 'top', dy: 4 });
          });
          S.path(P, { color: 'panel', width: 5, close: true });
          S.path(P, { color: 'ink', width: 2.2, close: true });
          arrowsOn(S, P, 'ink', [0.06, 0.31, 0.56, 0.81], 11);
          // numerics
          const I = polyIntegral(P, f), I2 = [I[1] / (2 * Math.PI), -I[0] / (2 * Math.PI)];
          const zd = distToPoly(P, zp.x, zp.y), zInd = windPoly(P, zp.x, zp.y);
          const Cz = polyIntegral(P, ([x, y]) => { const [a, b] = f([x, y]), dx = x - zp.x, dy = y - zp.y, d = dx * dx + dy * dy; return [(a * dx + b * dy) / d, (b * dx - a * dy) / d]; });
          const C2 = [Cz[1] / (2 * Math.PI), -Cz[0] / (2 * Math.PI)];
          const fz = f([zp.x, zp.y]), lhs = [fz[0] * zInd, fz[1] * zInd];
          const hyp = inOmega && hInd.every((k) => k === 0);
          S.corner(!inOmega ? 'Γ meets a hole: Γ is not a cycle in Ω' : hyp ? 'index 0 about every hole: hypothesis holds' : 'Γ winds around a hole: hypothesis fails', 'tl', { color: hyp ? 'green' : 'red', weight: 600 });
          // values panel
          const pts = [lhs, C2, I2, [0, 0]];
          const span = Math.max(1.2, ...pts.map((p) => Math.max(Math.abs(p[0]), Math.abs(p[1])) * 1.45));
          R.setView([-span, span], [-span, span]);
          R.dot(I2[0], I2[1], { color: hyp ? 'green' : 'red', r: 6, label: '∫f / 2πi', labelPos: 'se', math: false });
          R.dot(lhs[0], lhs[1], { color: 'accent', r: 9, hollow: true, width: 2.6 });
          R.dot(C2[0], C2[1], { color: 'gold', r: 4.5 });
          R.tex('f(z)\\operatorname{Ind}_\\Gamma(z)', lhs[0], lhs[1], { color: 'accent', size: 12.5, dy: -20, align: lhs[0] > 0.2 * span ? 'right' : lhs[0] < -0.2 * span ? 'left' : 'center' });
          state = { hyp, inOmega, hInd, I2, lhs, C2, zInd, zd };
        });
        v.readout(() => {
          const s = state; if (!s) return '';
          const a = `$\\operatorname{Ind}_\\Gamma(h_1,h_2,h_3) = (${s.hInd.join(', ')})$. $\\;\\frac{1}{2\\pi i}\\int_\\Gamma f = ${cfmt(v, s.I2, 3)}$.`;
          const b = s.zd < 0.04 ? ' Move $z$ off the path.' : ` At $z$: $\\operatorname{Ind}_\\Gamma(z) = ${s.zInd}$, $f(z)\\operatorname{Ind}_\\Gamma(z) = ${cfmt(v, s.lhs, 4)}$, Cauchy integral $= ${cfmt(v, s.C2, 4)}$.`;
          return a + b + (s.hyp ? '' : ' (Hypothesis violated: the two sides need not agree.)');
        });
      },
    },
    // ------------------------------------------------------------------ 10.38
    {
      num: '10.38',
      kind: 'Definition',
      name: 'Homotopy; null-homotopic curves; simply connected spaces',
      statement: String.raw`Let $\gamma_0,\gamma_1$ be closed curves in a topological space $X$, both with parameter interval $I=[0,1]$. They are *$X$-homotopic* if there is a continuous map $H:I\times I\to X$ with
$$H(s,0)=\gamma_0(s),\qquad H(s,1)=\gamma_1(s),\qquad H(0,t)=H(1,t)\qquad(s,t\in I).$$
Then $\gamma_t(s)=H(s,t)$ is a continuous one-parameter family of closed curves in $X$ joining $\gamma_0$ to $\gamma_1$. If $\gamma_0$ is $X$-homotopic to a constant curve, it is *null-homotopic* in $X$. A connected space $X$ in which every closed curve is null-homotopic is *simply connected*.`,
      idea: String.raw`Intuitively $\gamma_0$ can be deformed into $\gamma_1$ without ever leaving $X$; the condition $H(0,t)=H(1,t)$ keeps every intermediate curve closed. Every convex set is simply connected, via the straight-line homotopy $H(s,t)=(1-t)\gamma_0(s)+tp$. In a plane set with a hole, a loop around the hole cannot be contracted — 10.40 proves this by showing that the index about the hole is a homotopy invariant.`,
      caption: String.raw`$X$ is the plane minus the grey disc. The gold curve is $\gamma_t$ for the straight-line homotopy $H(s,t)=(1-t)\gamma_0(s)+t\gamma_1(s)$; the right panel is the parameter square $I^2$, red where $H(s,t)$ falls into the hole. Drag the centres and radius handles (radius $0$ makes $\gamma_1$ constant). When $\gamma_0$ surrounds the hole and $\gamma_1$ does not, the straight-line homotopy breaks — and the indices in the readout show that *no* homotopy in $X$ can exist. Switch to $X=\C$ and every loop contracts.`,
      deps: ['rca-10.8'],
      tags: ['homotopy', 'simply connected'],
      viz(v) {
        const M = v.M;
        const HOLE = [0, 0, 0.42];
        const PRE = {
          shrink: { label: 'contract a loop around the hole', g0: [0, 0, 1.55], g1: [1.9, 0.9, 0] },
          deform: { label: 'deform it around the hole', g0: [0, 0, 1.55], g1: [0.55, -0.25, 1.05] },
          free: { label: 'contract a loop beside the hole', g0: [-1.6, 0.5, 0.7], g1: [-1.0, -0.6, 0] },
        };
        const pre = v.select('', Object.entries(PRE).map(([value, o]) => ({ value, label: o.label })), 'shrink');
        const space = v.select('$X$', [{ value: 'hole', label: '$\\C\\setminus\\overline{D}(0;0.42)$' }, { value: 'plane', label: '$\\C$' }], 'hole');
        const S = v.stage({ x: [-2.8, 2.8], y: [-2, 2], equal: true, height: 360, weight: 1.6, minWidth: 400, axes: false, title: 'the curves $\\gamma_t$ in $X$' });
        const Q = v.stage({ x: [-0.08, 1.08], y: [-0.08, 1.08], equal: true, height: 360, weight: 1, minWidth: 240, axes: 'box', xticks: [0, 0.5, 1], yticks: [0, 0.5, 1], xlabel: 's', ylabel: 't', title: 'the square $I^2$ (red: $H\\notin X$)' });
        const c0 = S.handle(0, 0, { color: 'blue', label: 'γ₀', labelPos: 'nw' });
        const r0 = S.handle(1.55, 0, { color: 'blue', r: 5 });
        const c1 = S.handle(1.9, 0.9, { color: 'orange', label: 'γ₁', labelPos: 'ne' });
        const r1 = S.handle(1.9, 0.9, { color: 'orange', r: 5 });
        const link = (c, r) => { let p = [c.x, c.y]; c.onDrag = () => { r.x += c.x - p[0]; r.y += c.y - p[1]; p = [c.x, c.y]; }; return (x, y) => { p = [c.x, c.y]; return [x, y]; }; };
        link(c0, r0); link(c1, r1);
        let last = null, state = null;
        const gam = (c, r, s) => [c.x + Math.hypot(r.x - c.x, r.y - c.y) * Math.cos(2 * Math.PI * s), c.y + Math.hypot(r.x - c.x, r.y - c.y) * Math.sin(2 * Math.PI * s)];
        v.legend([['blue', '$\\gamma_0$'], ['orange', '$\\gamma_1$'], ['gold', '$\\gamma_t$'], ['red', '$H(s,t)\\notin X$', { area: true }]]);
        v.animate((time) => {
          if (last !== pre.value) {
            last = pre.value; const P = PRE[pre.value];
            c0.x = P.g0[0]; c0.y = P.g0[1]; r0.x = P.g0[0] + P.g0[2] * Math.cos(-0.4); r0.y = P.g0[1] + P.g0[2] * Math.sin(-0.4);
            c1.x = P.g1[0]; c1.y = P.g1[1]; r1.x = P.g1[0] + P.g1[2]; r1.y = P.g1[1];
            link(c0, r0); link(c1, r1);
          }
          const hole = space.value === 'hole';
          const t = 0.5 - 0.5 * Math.cos((2 * Math.PI * time) / 7);
          const H = (s, tt) => { const a = gam(c0, r0, s), b = gam(c1, r1, s); return [(1 - tt) * a[0] + tt * b[0], (1 - tt) * a[1] + tt * b[1]]; };
          const bad = (p) => hole && Math.hypot(p[0] - HOLE[0], p[1] - HOLE[1]) <= HOLE[2];
          // parameter square
          Q.rect(0, 0, 1, 1, { fill: 'green', fillAlpha: 0.1, color: 'muted', width: 1 });
          let anyBad = false;
          const red = v.rgb('red');
          Q.raster((s, tt) => { if (s < 0 || s > 1 || tt < 0 || tt > 1) return null; if (bad(H(s, tt))) { anyBad = true; return [red[0], red[1], red[2], 170]; } return null; }, { key: `${c0.x},${c0.y},${r0.x},${r0.y},${c1.x},${c1.y},${r1.x},${r1.y},${hole}`, res: 3, id: 'sq' });
          // recompute the flag cheaply (the raster may be cached)
          anyBad = false; for (let i = 0; i <= 60 && !anyBad; i++) for (let j = 0; j <= 60; j++) if (bad(H(i / 60, j / 60))) { anyBad = true; break; }
          Q.line(0, t, 1, t, { color: 'gold', width: 3 });
          Q.text('γ₀', 0.5, 0, { color: 'blue', dy: 12, align: 'center', math: true });
          Q.text('γ₁', 0.5, 1, { color: 'orange', dy: -12, align: 'center', math: true });
          // curves
          if (hole) { S.circle(HOLE[0], HOLE[1], HOLE[2], { fill: 'gray', fillAlpha: 0.55, color: 'muted', width: 1.4 }); S.text('hole ∉ X', HOLE[0], HOLE[1] - HOLE[2], { align: 'center', baseline: 'top', dy: 4, size: 12, color: 'muted' }); }
          for (let k = 1; k < 8; k++) S.curve((s) => H(s, k / 8), 0, 1, { color: 'gold', width: 1, alpha: 0.35, n: 160 });
          S.curve((s) => gam(c0, r0, s), 0, 1, { color: 'blue', width: 2.4, n: 200 });
          S.curve((s) => gam(c1, r1, s), 0, 1, { color: 'orange', width: 2.4, n: 200 });
          const pts = M.range(241).map((i) => H(i / 240, t));
          S.path(pts, { color: 'gold', width: 3.2 });
          const badPts = pts.filter(bad);
          if (badPts.length) S.dots(badPts, { color: 'red', r: 3 });
          S.corner(`t = ${v.fix(t, 2)}`, 'tl', { weight: 600 });
          const ind0 = hole ? windPoly(M.range(240).map((i) => gam(c0, r0, i / 240)), 0, 0) : null;
          const rad1 = Math.hypot(r1.x - c1.x, r1.y - c1.y);
          const ind1 = hole ? (rad1 < 1e-6 ? 0 : windPoly(M.range(240).map((i) => gam(c1, r1, i / 240)), 0, 0)) : null;
          const touches = (c, r) => hole && Math.abs(Math.hypot(c.x, c.y) - Math.hypot(r.x - c.x, r.y - c.y)) <= HOLE[2];
          state = { hole, anyBad, ind0, ind1, endBad: touches(c0, r0) || touches(c1, r1) };
        }, { period: 7 });
        v.readout(() => {
          const s = state; if (!s) return '';
          if (!s.hole) return 'In $X=\\C$ the straight-line homotopy never leaves $X$: every closed curve is null-homotopic, so $\\C$ (like every convex set) is simply connected.';
          if (s.endBad) return 'One of the curves meets the hole, so it is not a curve in $X$; move it.';
          let t = `$\\operatorname{Ind}_{\\gamma_0}(0) = ${s.ind0}$, $\\operatorname{Ind}_{\\gamma_1}(0) = ${s.ind1}$. `;
          if (!s.anyBad) t += 'The straight-line homotopy stays in $X$, so $\\gamma_0$ and $\\gamma_1$ are $X$-homotopic.';
          else if (s.ind0 !== s.ind1) t += 'The straight-line homotopy passes through the hole — and since the indices about the hole differ, Theorem 10.40 shows that no $X$-homotopy exists at all.';
          else t += 'This particular homotopy passes through the hole, but the indices agree; another homotopy may well stay in $X$.';
          return t;
        });
      },
    },
    // ------------------------------------------------------------------ 10.39
    {
      num: '10.39',
      kind: 'Lemma',
      name: 'Nearby closed paths have the same index',
      statement: String.raw`Let $\gamma_0$ and $\gamma_1$ be closed paths with parameter interval $[0,1]$, and let $\alpha\in\C$ satisfy
$$|\gamma_1(s)-\gamma_0(s)|<|\alpha-\gamma_0(s)|\qquad(0\le s\le1).$$
Then $\Ind_{\gamma_1}(\alpha)=\Ind_{\gamma_0}(\alpha)$.`,
      idea: String.raw`The hypothesis implies that neither path passes through $\alpha$. Put $\gamma=(\gamma_1-\alpha)/(\gamma_0-\alpha)$; then $|1-\gamma(s)|<1$, so the closed path $\gamma$ lies in the disc $D(1;1)$ and cannot wind around $0$: $\Ind_\gamma(0)=0$ (10.10). But $\frac{\gamma'}{\gamma}=\frac{\gamma_1'}{\gamma_1-\alpha}-\frac{\gamma_0'}{\gamma_0-\alpha}$, and integrating over $[0,1]$ turns this into $\Ind_\gamma(0)=\Ind_{\gamma_1}(\alpha)-\Ind_{\gamma_0}(\alpha)$. It is the "dog on a leash" principle: a leash shorter than the walker's distance to the tree cannot let the dog circle the tree a different number of times.`,
      caption: String.raw`$\gamma_1$ (orange) is $\gamma_0$ (blue) plus a wobble of amplitude $A$ and frequency $k$; grey segments join $\gamma_0(s)$ to $\gamma_1(s)$. The dashed circle sits at the parameter $s$ where the ratio $|\gamma_1-\gamma_0|/|\alpha-\gamma_0|$ is worst. The right panel draws the quotient $\gamma=(\gamma_1-\alpha)/(\gamma_0-\alpha)$: under the hypothesis it is trapped in the green disc $D(1;1)$. Drag $\alpha$ toward the curve or raise $A$ to break the hypothesis — then the indices can differ.`,
      deps: ['rca-10.10'],
      tags: ['index', 'homotopy'],
      viz(v) {
        const M = v.M, { TAU } = M;
        const PRE = { holds: { label: 'small wobble', A: 0.35, k: 5, al: [0.25, 0.15] }, fails: { label: 'large wobble', A: 1.2, k: 3, al: [1.8, -1.05] } };
        const pre = v.select('', Object.entries(PRE).map(([value, o]) => ({ value, label: o.label })), 'holds');
        const A = v.slider('wobble amplitude $A$', 0, 1.2, 0.35, { step: 0.01 });
        const K = v.slider('wobble frequency $k$', 1, 12, 5, { int: true });
        const S = v.stage({ x: [-2.8, 2.8], y: [-2.1, 2.1], equal: true, height: 360, axes: false, title: '$\\gamma_0$, $\\gamma_1$, the leashes and $\\alpha$' });
        const R = v.stage({ x: [-0.8, 2.8], y: [-1.6, 1.6], equal: true, height: 360, title: 'the quotient $\\gamma=(\\gamma_1-\\alpha)/(\\gamma_0-\\alpha)$' });
        const al = S.handle(0.25, 0.15, { color: 'red', label: 'α', labelPos: 'ne' });
        const g0 = (s) => { const t = TAU * s, r = 1.3 + 0.28 * Math.cos(3 * t); return [r * Math.cos(t), r * Math.sin(t)]; };
        let state = null, last = null;
        v.legend([['blue', '$\\gamma_0$'], ['orange', '$\\gamma_1$'], ['gold', '$\\gamma$'], ['green', '$D(1;1)$', { area: true }]]);
        v.render(() => {
          if (last !== pre.value) { last = pre.value; const P = PRE[pre.value]; A.value = P.A; K.value = P.k; al.x = P.al[0]; al.y = P.al[1]; }
          const a = A.value, k = K.value;
          const g1 = (s) => { const p = g0(s), t = TAU * s; return [p[0] + a * Math.cos(k * t + 0.7) * 0.9, p[1] + a * Math.sin(k * t) * 0.9]; };
          const N = 600, P0 = [], P1 = [], Q = [];
          let worst = 0, ws = 0;
          for (let i = 0; i < N; i++) {
            const s = i / N, p = g0(s), q = g1(s); P0.push(p); P1.push(q);
            const ratio = Math.hypot(q[0] - p[0], q[1] - p[1]) / Math.hypot(al.x - p[0], al.y - p[1]);
            if (ratio > worst) { worst = ratio; ws = s; }
            const ux = q[0] - al.x, uy = q[1] - al.y, vx = p[0] - al.x, vy = p[1] - al.y, d = vx * vx + vy * vy;
            Q.push([(ux * vx + uy * vy) / d, (uy * vx - ux * vy) / d]);
          }
          const ok = worst < 1;
          for (let i = 0; i < 48; i++) { const j = Math.floor((i * N) / 48), p = P0[j], q = P1[j]; S.line(p[0], p[1], q[0], q[1], { color: 'muted', width: 1, alpha: 0.7 }); }
          S.path(P0, { color: 'blue', width: 2.4, close: true });
          S.path(P1, { color: 'orange', width: 2.2, close: true });
          arrowsOn(S, P0, 'blue', [0.02, 0.52], 10);
          const pw = g0(ws), qw = g1(ws), rr = Math.hypot(al.x - pw[0], al.y - pw[1]);
          S.circle(pw[0], pw[1], rr, { color: ok ? 'green' : 'red', width: 1.4, dash: [5, 4] });
          S.line(pw[0], pw[1], qw[0], qw[1], { color: ok ? 'green' : 'red', width: 3 });
          S.dot(pw[0], pw[1], { color: 'blue', r: 4 }); S.dot(qw[0], qw[1], { color: 'orange', r: 4 });
          // quotient panel
          R.circle(1, 0, 1, { fill: 'green', fillAlpha: 0.12, color: 'green', width: 1.6 });
          R.path(Q, { color: 'gold', width: 2.2, close: true });
          xMark(R, 0, 0, 'red', 5);
          R.tex('0', 0, 0, { color: 'red', dx: -12, dy: 12, size: 13 });
          let mx = 2.8, Mn = -0.8, my = 1.6;
          for (const p of Q) { mx = Math.max(mx, p[0] + 0.2); Mn = Math.min(Mn, p[0] - 0.2); my = Math.max(my, Math.abs(p[1]) + 0.2); }
          R.setView([Math.max(Mn, -6), Math.min(mx, 8)], [-Math.min(my, 6), Math.min(my, 6)]);
          const i0 = windPoly(P0, al.x, al.y), i1 = windPoly(P1, al.x, al.y), iq = windPoly(Q, 0, 0);
          S.corner(ok ? 'hypothesis holds' : 'hypothesis fails', 'tl', { color: ok ? 'green' : 'red', weight: 600 });
          state = { worst, i0, i1, iq, ok };
        });
        v.readout(() => {
          const s = state; if (!s) return '';
          return `$\\max_s \\dfrac{|\\gamma_1(s)-\\gamma_0(s)|}{|\\alpha-\\gamma_0(s)|} = ${v.fix(s.worst, 3)}$ ${s.ok ? '$<1$' : '$\\ge 1$'}. $\\;\\operatorname{Ind}_{\\gamma_0}(\\alpha) = ${s.i0}$, $\\operatorname{Ind}_{\\gamma_1}(\\alpha) = ${s.i1}$, $\\operatorname{Ind}_{\\gamma}(0) = ${s.iq} = ${s.i1} - (${s.i0})$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 10.40
    {
      num: '10.40',
      kind: 'Theorem',
      name: 'Homotopic closed paths have the same index',
      statement: String.raw`If $\Gamma_0$ and $\Gamma_1$ are closed paths in an open set $\Omega$ that are $\Omega$-homotopic, then $\Ind_{\Gamma_0}(\alpha)=\Ind_{\Gamma_1}(\alpha)$ for every $\alpha$ not in $\Omega$.`,
      idea: String.raw`Let $H$ be the homotopy. Its image is a compact subset of $\Omega$, so it keeps a distance $2\eps>0$ from $\C\setminus\Omega$, and $H$ is uniformly continuous on $I^2$. Choose $n$ so large that $H$ moves by less than $\eps$ on squares of side $1/n$, and replace each curve $\gamma_{k/n}$ by the closed polygon through $H(j/n,k/n)$, $j=0,\dots,n$. Consecutive polygons (and the end polygons versus $\Gamma_0,\Gamma_1$) are then within $\eps$ of each other while $\alpha$ is at distance $\ge\eps$, so Lemma 10.39 passes the index along the whole chain. Combined with 10.35(c): homotopic closed paths give the same integral of every $f\in H(\Omega)$, a null-homotopic path gives $0$, and in a simply connected region Cauchy's theorem holds for every closed path.`,
      caption: String.raw`$\Omega$ is the plane without the two points $p_1,p_2$ (×), and $f=\frac{1}{z-p_1}+\frac{-0.5+0.8i}{z-p_2}\in H(\Omega)$. The animation runs a homotopy from the big circle $\Gamma_0$ to $\Gamma_1$. Right: the real and imaginary parts of $\frac1{2\pi i}\int_{\gamma_t}f$ and the distance from $\gamma_t$ to $\C\setminus\Omega$, against $t$. When the deformation stays in $\Omega$ the integral and both indices never change; when it drags the curve across $p_2$ the distance hits $0$ and the integral jumps.`,
      deps: ['rca-10.38', 'rca-10.39'],
      see: ['pma-10.39'],
      tags: ['homotopy', 'index', 'Cauchy'],
      viz(v) {
        const M = v.M, { TAU } = M;
        const P1 = [-1, 0], P2 = [1, 0], RES2 = [-0.5, 0.8];
        // Cassini oval |z²−1| = b² enclosing both points, in polar form
        const cass = (th, b = 1.1) => { const r = Math.sqrt(Math.cos(2 * th) + Math.sqrt(b ** 4 - Math.sin(2 * th) ** 2)); return [r * Math.cos(th), r * Math.sin(th)]; };
        const HOM = {
          stay: { label: 'pinch onto both points (stays in $\\Omega$)', H: (s, t) => { const th = TAU * s, a = [2.1 * Math.cos(th), 2.1 * Math.sin(th)], b = cass(th); return [(1 - t) * a[0] + t * b[0], (1 - t) * a[1] + t * b[1]]; } },
          slide: { label: 'turn and wobble (stays in $\\Omega$)', H: (s, t) => { const th = TAU * s, ph = Math.PI * t, c = 0.2 * Math.sin(Math.PI * t), ex = 2.1 * Math.cos(th), ey = (1.75 + 0.15 * Math.sin(3 * th) * Math.sin(Math.PI * t)) * Math.sin(th); return [c + ex * Math.cos(ph) - ey * Math.sin(ph), c + ex * Math.sin(ph) + ey * Math.cos(ph)]; } },
          cross: { label: 'shrink onto $p_1$ (crosses $p_2$)', H: (s, t) => { const th = TAU * s, a = [2.1 * Math.cos(th), 2.1 * Math.sin(th)], b = [P1[0] + 0.55 * Math.cos(th), P1[1] + 0.55 * Math.sin(th)]; return [(1 - t) * a[0] + t * b[0], (1 - t) * a[1] + t * b[1]]; } },
        };
        const which = v.select('', Object.entries(HOM).map(([value, o]) => ({ value, label: o.label })), 'stay');
        const S = v.stage({ x: [-2.6, 2.6], y: [-2.6, 2.6], equal: true, height: 360, axes: false, title: 'the homotopy $\\gamma_t$ in $\\Omega=\\C\\setminus\\{p_1,p_2\\}$' });
        const R = v.stage({ x: [-0.04, 1.04], y: [-0.7, 2.4], height: 360, axes: 'box', xlabel: 't', xticks: [0, 0.25, 0.5, 0.75, 1], title: 'invariants along the homotopy' });
        const f = ([x, y]) => { let dx = x - P1[0], dy = y - P1[1], d = dx * dx + dy * dy; let re = dx / d, im = -dy / d; dx = x - P2[0]; dy = y - P2[1]; d = dx * dx + dy * dy; re += (RES2[0] * dx + RES2[1] * dy) / d; im += (RES2[1] * dx - RES2[0] * dy) / d; return [re, im]; };
        const NT = 201, NS = 360;
        let cacheKey = null, prof = null, state = null;
        v.legend([['accent', '$\\Re\\frac{1}{2\\pi i}\\int_{\\gamma_t}f$'], ['orange', '$\\Im\\frac{1}{2\\pi i}\\int_{\\gamma_t}f$'], ['muted', '$\\operatorname{dist}(\\gamma_t^*,\\{p_1,p_2\\})$', { area: true }], ['gold', '$\\gamma_t$']]);
        v.animate((time) => {
          const Hm = HOM[which.value].H;
          if (cacheKey !== which.value) {
            cacheKey = which.value; prof = [];
            for (let k = 0; k < NT; k++) {
              const t = k / (NT - 1), P = M.range(NS).map((i) => Hm(i / NS, t));
              const I = polyIntegral(P, f);
              let dmin = Infinity; for (const p of P) for (const q of [P1, P2]) dmin = Math.min(dmin, Math.hypot(p[0] - q[0], p[1] - q[1]));
              prof.push({ t, re: I[1] / TAU, im: -I[0] / TAU, d: dmin, i1: windPoly(P, P1[0], P1[1]), i2: windPoly(P, P2[0], P2[1]) });
            }
          }
          const u = (time % 8) / 8, t = u < 0.5 ? M.smoothstep(u * 2) : M.smoothstep(2 - u * 2);
          // left
          for (let k = 0; k <= 10; k++) S.curve((s) => Hm(s, k / 10), 0, 1, { color: k === 0 ? 'blue' : k === 10 ? 'orange' : 'gold', width: k === 0 || k === 10 ? 2 : 1, alpha: k === 0 || k === 10 ? 0.9 : 0.3, n: 200 });
          const P = M.range(NS).map((i) => Hm(i / NS, t));
          S.path(P, { color: 'panel', width: 5.5, close: true });
          S.path(P, { color: 'gold', width: 3, close: true });
          arrowsOn(S, P, 'gold', [0.1, 0.35, 0.6, 0.85], 11);
          const cur = prof[Math.round(t * (NT - 1))];
          xMark(S, P1[0], P1[1], 'ink'); xMark(S, P2[0], P2[1], cur.d < 0.03 ? 'red' : 'ink');
          S.tex('p_1', P1[0], P1[1], { dx: -14, dy: -14, size: 14 }); S.tex('p_2', P2[0], P2[1], { dx: 14, dy: -14, size: 14 });
          const g0 = Hm(0.11, 0), g1 = Hm(0.62, 1);
          S.tex('\\Gamma_0', g0[0], g0[1], { color: 'blue', dx: 16, dy: -10, size: 15 });
          S.tex('\\Gamma_1', g1[0], g1[1], { color: 'orange', dx: -14, dy: -12, size: 15 });
          S.corner(`t = ${v.fix(t, 2)}:  Ind(p₁) = ${cur.i1},  Ind(p₂) = ${cur.i2}`, 'tl', { weight: 600 });
          // right
          const ds = prof.map((p) => [p.t, Math.min(p.d, 2.3)]);
          R.path(ds.concat([[1, 0], [0, 0]]), { fill: 'muted', fillAlpha: 0.16, stroke: false, close: true });
          R.path(ds, { color: 'muted', width: 1.4 });
          R.hline(0, { color: 'faint', width: 1 });
          R.path(prof.map((p) => [p.t, p.re]), { color: 'accent', width: 2.6 });
          R.path(prof.map((p) => [p.t, p.im]), { color: 'orange', width: 2.6 });
          R.vline(t, { color: 'gold', width: 1.6 });
          R.dot(t, cur.re, { color: 'accent', r: 4.5 }); R.dot(t, cur.im, { color: 'orange', r: 4.5 });
          const dmin = Math.min(...prof.map((p) => p.d));
          state = { t, cur, dmin };
        }, { period: 8 });
        v.readout(() => {
          const s = state; if (!s) return '';
          const val = `${v.fmt(s.cur.re, 3)} ${s.cur.im < 0 ? '-' : '+'} ${v.fmt(Math.abs(s.cur.im), 3)}\\,i`.replace(/−/g, '-');
          return `$\\frac{1}{2\\pi i}\\int_{\\gamma_t}f = \\operatorname{Ind}_{\\gamma_t}(p_1) + (-0.5+0.8i)\\operatorname{Ind}_{\\gamma_t}(p_2) = ${val}$. Smallest distance from the moving curve to $\\C\\setminus\\Omega$ over the whole homotopy: $${v.fix(s.dmin, 3)}$` + (s.dmin > 0.02 ? ' $>0$, so this is an $\\Omega$-homotopy.' : ' — the curve passes through $p_2$: not an $\\Omega$-homotopy.');
        });
      },
    },
  ],
};
