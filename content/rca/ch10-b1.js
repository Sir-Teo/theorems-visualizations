// Rudin, Real and Complex Analysis — Chapter 10, part b1: Cauchy's estimates, convergence on compact
// sets, and the local structure of holomorphic maps (10.26–10.33).

// ---------------------------------------------------------------- helpers shared by this file
// Phase-portrait colour of w = re + i im (hue = arg w, bands = log2|w|); `fade` blends toward RGB `bg`.
function phaseRGB(M, re, im, fade = 0, bg = null, bands = true) {
  if (!isFinite(re) || !isFinite(im)) return bg ? [bg[0], bg[1], bg[2]] : [250, 250, 250];
  const t = bands ? M.fract(Math.log2(Math.hypot(re, im) + 1e-300)) : 0.55;
  const c = M.hsl2rgb(Math.atan2(im, re) / M.TAU, 0.62, 0.42 + 0.2 * Math.pow(t, 0.7));
  if (!fade || !bg) return c;
  return [c[0] + (bg[0] - c[0]) * fade, c[1] + (bg[1] - c[1]) * fade, c[2] + (bg[2] - c[2]) * fade];
}
// A small "×" (critical point, singularity) with a halo so it reads on a phase portrait.
function xMark(S, x, y, color = 'ink', size = 5.5) {
  const d = size / S.scale;
  for (const [col, w] of [['panel', 5], [color, 2.2]]) {
    S.line(x - d, y - d, x + d, y + d, { color: col, width: w });
    S.line(x - d, y + d, x + d, y - d, { color: col, width: w });
  }
}
// Shade everything outside the disc D(c; r) with the panel colour (a "lens" on the disc).
function maskOutsideDisc(S, cx, cy, r, alpha = 0.62) {
  const b = S.bounds, pad = 10;
  const rect = [[b.x[0] - pad, b.y[0] - pad], [b.x[1] + pad, b.y[0] - pad], [b.x[1] + pad, b.y[1] + pad], [b.x[0] - pad, b.y[1] + pad]];
  const circ = []; for (let i = 0; i < 120; i++) { const t = (2 * Math.PI * i) / 120; circ.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]); }
  S.rings([rect, circ], { fill: 'panel', fillAlpha: alpha, stroke: false, evenodd: true });
}
// Roots of Σ (cr[k] + i ci[k]) z^k (Durand–Kerner). Returns [[x, y], ...].
function polyRoots(cr, ci) {
  let n = cr.length - 1;
  while (n > 0 && cr[n] === 0 && ci[n] === 0) n--;
  if (n < 1) return [];
  const d = cr[n] * cr[n] + ci[n] * ci[n];
  const ar = [], ai = [];
  for (let k = 0; k <= n; k++) { ar.push((cr[k] * cr[n] + ci[k] * ci[n]) / d); ai.push((ci[k] * cr[n] - cr[k] * ci[n]) / d); }
  let R = 1e-3; for (let k = 0; k < n; k++) R = Math.max(R, Math.pow(Math.hypot(ar[k], ai[k]), 1 / (n - k)));
  const zr = [], zi = [];
  for (let k = 0; k < n; k++) { const t = (2 * Math.PI * k) / n + 0.4; zr.push(R * Math.cos(t)); zi.push(R * Math.sin(t)); }
  for (let it = 0; it < 400; it++) {
    let maxd = 0;
    for (let i = 0; i < n; i++) {
      let pr = 1, pi = 0;
      for (let k = n - 1; k >= 0; k--) { const t = pr * zr[i] - pi * zi[i] + ar[k]; pi = pr * zi[i] + pi * zr[i] + ai[k]; pr = t; }
      let qr = 1, qi = 0;
      for (let j = 0; j < n; j++) if (j !== i) { const dr = zr[i] - zr[j], di = zi[i] - zi[j]; const t = qr * dr - qi * di; qi = qr * di + qi * dr; qr = t; }
      const qd = qr * qr + qi * qi || 1e-300;
      const wr = (pr * qr + pi * qi) / qd, wi = (pi * qr - pr * qi) / qd;
      zr[i] -= wr; zi[i] -= wi;
      maxd = Math.max(maxd, Math.hypot(wr, wi) / (1 + Math.hypot(zr[i], zi[i])));
    }
    if (maxd < 1e-12) break;
  }
  return zr.map((x, i) => [x, zi[i]]);
}
// Taylor coefficients c_0..c_K of f at a, from N equally spaced samples on |ξ − a| = rho (trapezoid rule).
function taylorCoeffs(M, f, a, rho, K, N = 128) {
  const { Cx, TAU } = M;
  const vr = [], vi = [];
  for (let j = 0; j < N; j++) { const w = f(a.add(Cx.polar(rho, (TAU * j) / N))); vr.push(w.re); vi.push(w.im); }
  const out = [];
  for (let k = 0; k <= K; k++) {
    let sr = 0, si = 0;
    for (let j = 0; j < N; j++) { const t = (-TAU * j * k) / N, c = Math.cos(t), s = Math.sin(t); sr += vr[j] * c - vi[j] * s; si += vr[j] * s + vi[j] * c; }
    const sc = 1 / (N * Math.pow(rho, k));
    out.push(new Cx(sr * sc, si * sc));
  }
  return out;
}
// Points of a circle (closed polygon without repeated endpoint).
function circlePts(cx, cy, r, n = 240) { const out = []; for (let i = 0; i < n; i++) { const t = (2 * Math.PI * i) / n; out.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]); } return out; }
// First self-crossing of a closed polygon (as a point), or null if the polygon is simple.
function selfCross(P) {
  const n = P.length;
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  for (let i = 0; i < n; i++) {
    const a = P[i], b = P[(i + 1) % n];
    const ax0 = Math.min(a[0], b[0]), ax1 = Math.max(a[0], b[0]), ay0 = Math.min(a[1], b[1]), ay1 = Math.max(a[1], b[1]);
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue;
      const c = P[j], d = P[(j + 1) % n];
      if (Math.max(c[0], d[0]) < ax0 || Math.min(c[0], d[0]) > ax1 || Math.max(c[1], d[1]) < ay0 || Math.min(c[1], d[1]) > ay1) continue;
      const d1 = cr(c, d, a), d2 = cr(c, d, b), d3 = cr(a, b, c), d4 = cr(a, b, d);
      if ((d1 > 0) !== (d2 > 0) && (d3 > 0) !== (d4 > 0)) { const s = d1 / (d1 - d2); return [a[0] + s * (b[0] - a[0]), a[1] + s * (b[1] - a[1])]; }
    }
  }
  return null;
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
const SUP = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];
const sup = (n) => (n < 0 ? '⁻' : '') + String(Math.abs(n)).split('').map((d) => SUP[+d]).join('');
// Tick marks for a log10 axis spanning [lo, hi]: decades, or 1-2-5 steps when the span is short.
function logTicks(M, lo, hi) {
  const out = [];
  if (hi - lo > 3.2) { const step = hi - lo > 10 ? 3 : hi - lo > 6 ? 2 : 1; for (let e = Math.ceil(lo / step) * step; e <= hi; e += step) out.push([e, '10' + sup(e)]); return out; }
  for (let e = Math.floor(lo) - 1; e <= Math.ceil(hi); e++) for (const m of [1, 2, 5]) { const y = e + Math.log10(m); if (y >= lo && y <= hi) out.push([y, M.fmt(m * Math.pow(10, e), 2)]); }
  return out;
}
const fact = (k) => { let r = 1; for (let i = 2; i <= k; i++) r *= i; return r; };
const RAYC = ['accent', 'orange', 'green', 'purple', 'teal', 'pink'];

export default {
  collection: 'rca',
  chapter: 10,
  items: [
    // ------------------------------------------------------------------ 10.26
    {
      num: '10.26',
      kind: 'Theorem',
      name: "Cauchy's estimates",
      statement: String.raw`Suppose $f\in H(D(a;R))$ and $|f(z)|\le M$ for every $z\in D(a;R)$. Then
$$|f^{(n)}(a)|\le\frac{n!\,M}{R^{n}}\qquad(n=1,2,3,\dots).$$`,
      idea: String.raw`Write $f(z)=\sum c_k(z-a)^k$ in $D(a;R)$ (10.16), so $c_n=f^{(n)}(a)/n!$. For $r<R$ the Parseval identity 10.22 gives $\sum_k|c_k|^2r^{2k}=\frac1{2\pi}\int_{-\pi}^{\pi}|f(a+re^{i\theta})|^2\,d\theta\le M^2$, hence every single term satisfies $|c_n|r^n\le M$. Let $r\to R$. A bound on the *size* of $f$ on a disc therefore controls *all* its derivatives at the centre — the engine behind Liouville's theorem and 10.28.`,
      caption: String.raw`Drag the centre $a$ and the orange radius handle. The right panel shows each Taylor coefficient scaled by the radius, $|c_k|R^k$, on a log scale: every bar stays below the ceiling $M=\sup_{D(a;R)}|f|$ (computed on the circle, where the maximum lives). For $z^4$ with $a=0$ and $n=4$ the estimate is an equality. With $1/(1-z)$ the radius cannot reach the pole, and $M$ explodes as it tries.`,
      deps: ['rca-10.22', 'rca-10.16'],
      tags: ['Cauchy estimates', 'power series'],
      viz(v) {
        const M = v.M, { Cx, TAU } = M;
        const one = new Cx(1, 0);
        const FN = {
          exp: { label: '$e^{z}$', f: (z) => z.exp(), sing: [], a: [0.2, 0.3], R: 1.5 },
          pole: { label: '$\\dfrac{1}{1-z}$', f: (z) => one.div(one.sub(z)), sing: [[1, 0]], a: [-0.5, 0.4], R: 1.1 },
          pow: { label: '$z^4$', f: (z) => z.pow(4), sing: [], a: [0, 0], R: 1.2 },
          cos: { label: '$\\cos \\pi z$', f: (z) => z.scale(Math.PI).cos(), sing: [], a: [0.3, -0.2], R: 1.1 },
        };
        const which = v.select('$f$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'exp');
        const nSel = v.slider('$n$', 1, 12, 3, { int: true });
        const KMAX = 12;
        const L = v.stage({ x: [-2.5, 2.5], y: [-2.1, 2.1], equal: true, height: 350, title: 'phase portrait of $f$ on the disc $D(a;R)$' });
        const Rt = v.stage({ x: [-1.7, KMAX + 0.7], y: [-4, 2], height: 350, axes: 'box', xlabel: 'k', xticks: M.range(KMAX + 1), title: '$|c_k|\\,R^k = |f^{(k)}(a)|R^k/k!$ (log scale) never exceeds $M$' });
        const a = L.handle(0.2, 0.3, { color: 'ink', label: 'a', labelPos: 'sw' });
        const rad = L.handle(1.7, 0.3, { color: 'orange', r: 6 });
        let prevA = [a.x, a.y], last = null, state = null;
        const rMax = () => { const F = FN[which.value]; let m = 2.4; for (const s of F.sing) m = Math.min(m, 0.97 * Math.hypot(s[0] - a.x, s[1] - a.y)); return m; };
        a.onDrag = () => { rad.x += a.x - prevA[0]; rad.y += a.y - prevA[1]; prevA = [a.x, a.y]; };
        rad.constrain = (x, y) => { const dx = x - a.x, dy = y - a.y, d = Math.hypot(dx, dy) || 1, r = M.clamp(d, 0.15, rMax()); return [a.x + (dx / d) * r, a.y + (dy / d) * r]; };
        v.legend([['accent', '$|c_k|R^k$', { area: true }], ['gold', 'the chosen $k=n$', { area: true }], ['orange', '$M=\\max_{|z-a|=R}|f(z)|$', { dash: true }]]);
        v.render(() => {
          const F = FN[which.value];
          if (last !== which.value) { last = which.value; a.x = F.a[0]; a.y = F.a[1]; rad.x = F.a[0] + F.R; rad.y = F.a[1]; prevA = [a.x, a.y]; if (which.value === 'pow') nSel.value = 4; }
          // keep the radius admissible (a may have moved toward a singularity)
          let dx = rad.x - a.x, dy = rad.y - a.y; const d0 = Math.hypot(dx, dy) || 1;
          const R = M.clamp(d0, 0.15, rMax());
          if (Math.abs(R - d0) > 1e-9) { rad.x = a.x + (dx / d0) * R; rad.y = a.y + (dy / d0) * R; }
          const A = new Cx(a.x, a.y);
          // left: phase portrait, masked outside the disc
          L.raster((x, y) => { const w = F.f(new Cx(x, y)); return phaseRGB(M, w.re, w.im); }, { key: which.value, res: 2 });
          maskOutsideDisc(L, a.x, a.y, R, 0.68);
          L.circle(a.x, a.y, R, { color: 'orange', width: 2.2 });
          for (const s of F.sing) xMark(L, s[0], s[1], 'red');
          // M = max of |f| on the circle (= sup over the open disc by the maximum modulus theorem)
          let Mv = 0, at = 0;
          for (let j = 0; j < 720; j++) { const m = F.f(A.add(Cx.polar(R, (TAU * j) / 720))).abs(); if (m > Mv) { Mv = m; at = j; } }
          const pM = A.add(Cx.polar(R, (TAU * at) / 720));
          L.dot(pM.re, pM.im, { color: 'orange', r: 5, label: '|f| = M', labelPos: pM.im >= a.y - 1e-9 ? 's' : 'n', math: false });
          L.measure(a.x, a.y, rad.x, rad.y, null, { color: 'orange' });
          L.tex('R', (a.x + rad.x) / 2, (a.y + rad.y) / 2, { color: 'orange', dy: -12 });
          // right: coefficients by contour integrals on the same circle
          const c = taylorCoeffs(M, F.f, A, R, KMAX, 128);
          const vals = c.map((ck, k) => ck.abs() * Math.pow(R, k));
          const big = Math.max(...vals, Mv);
          const logs = vals.map((x) => (x > big * 1e-12 ? Math.log10(x) : null));
          const top = Math.log10(Mv) + 0.7;
          const finite = logs.filter((x) => x != null);
          const lo = Math.max(top - 9, Math.min(...finite, Math.log10(Mv)) - 0.6);
          Rt.setView(null, [lo - 0.07 * (top - lo), top]);
          Rt.setTicks(undefined, logTicks(M, lo, top));
          const n = nSel.value;
          logs.forEach((y, k) => {
            if (y == null) { Rt.text('= 0', k, lo, { align: 'center', baseline: 'bottom', dy: -3, color: 'muted', size: 10 }); return; }
            Rt.rect(k - 0.34, lo, k + 0.34, y, { fill: k === n ? 'gold' : 'accent', fillAlpha: k === n ? 0.9 : 0.6, stroke: false });
          });
          Rt.hline(Math.log10(Mv), { color: 'orange', width: 2, dash: [7, 4] });
          Rt.tex('M', KMAX + 0.55, Math.log10(Mv), { color: 'orange', align: 'right', baseline: 'bottom', dy: -3 });
          let fn = c[n].abs() * fact(n); const bound = (fact(n) * Mv) / Math.pow(R, n);
          if (fn < 1e-11 * bound) fn = 0;
          state = { n, fn, bound, R, Mv };
        });
        v.readout(() => {
          const s = state; if (!s) return '';
          return `$R = ${v.fix(s.R, 3)}$, $\\;M = ${v.sci(s.Mv, 4)}$. For $n = ${s.n}$: $\\;|f^{(${s.n})}(a)| = ${v.sci(s.fn, 4)} \\;\\le\\; \\dfrac{${s.n}!\\,M}{R^{${s.n}}} = ${v.sci(s.bound, 4)}$ $\\;$(ratio $${v.fix(s.fn / s.bound, 4)}$).`;
        });
      },
    },
    // ------------------------------------------------------------------ 10.27
    {
      num: '10.27',
      kind: 'Definition',
      name: 'Uniform convergence on compact subsets',
      statement: String.raw`Let $\Omega$ be an open set and $f_j$, $f$ functions on $\Omega$. The sequence $\{f_j\}$ *converges to $f$ uniformly on compact subsets of $\Omega$* if for every compact $K\subset\Omega$ and every $\eps>0$ there is an $N=N(K,\eps)$ such that $|f_j(z)-f(z)|<\eps$ for all $z\in K$ and all $j>N$.

For example $z^j\to0$ uniformly on compact subsets of the unit disc $U$, although not uniformly on $U$.`,
      idea: String.raw`Every compact $K\subset U$ lies in a closed disc $\{|z|\le\rho\}$ with $\rho<1$, where $\sup|z^j|=\rho^j\to0$. But $\sup_U|z^j|=1$ for all $j$: points near the boundary circle converge ever more slowly, and $N(K,\eps)\approx\log\eps/\log\rho$ blows up as $K$ swells toward $\partial U$. This mode of convergence is exactly what holomorphic limits require (10.28): it is local, so it does not care how badly things behave near $\partial\Omega$.`,
      caption: String.raw`Left: the error $|f_n(z)-f(z)|$ on the unit disc $U$ (bright = large), with the compact disc $K=\{|z|\le\rho\}$ in orange. Right: $\sup_K|f_n-f|$ against $n$ (dots) and the $\eps$-band. Enlarge $K$ toward the unit circle and $N(K,\eps)$ runs away, while $\sup_U|f_n-f|$ (red) never drops below $1$.`,
      deps: ['rca-10.2'],
      verify: true,
      tags: ['uniform convergence', 'compactness'],
      viz(v) {
        const M = v.M;
        const SEQ = {
          pow: { label: '$f_n=z^n\\to0$', err: (x, y, n) => Math.pow(x * x + y * y, n / 2), supK: (r, n) => Math.pow(r, n), supU: 1 },
          geo: { label: '$f_n=\\sum_{k=0}^{n}z^k\\to\\frac{1}{1-z}$', err: (x, y, n) => Math.pow(x * x + y * y, (n + 1) / 2) / Math.hypot(1 - x, y), supK: (r, n) => Math.pow(r, n + 1) / (1 - r), supU: Infinity },
        };
        const which = v.select('', Object.entries(SEQ).map(([value, o]) => ({ value, label: o.label })), 'pow');
        const nS = v.slider('$n$', 0, 60, 8, { int: true });
        const rho = v.slider('$\\rho$ (radius of $K$)', 0.3, 0.98, 0.75, { step: 0.01 });
        const eps = v.slider('$\\varepsilon$', 0.02, 0.5, 0.1, { step: 0.01 });
        const L = v.stage({ x: [-1.15, 1.15], y: [-1.15, 1.15], equal: true, height: 340, axes: false, title: 'error $|f_n(z)-f(z)|$ on $U$' });
        const Rt = v.stage({ x: [-8, 61], y: [-0.06, 1.25], height: 340, axes: 'box', xlabel: 'n', yticks: [0, 0.25, 0.5, 0.75, 1], title: '$\\sup_K|f_n-f|$ (dots) and $\\sup_U|f_n-f|$ (red)' });
        let state = null;
        v.legend([['green', '$\\sup_K|f_n-f|<\\varepsilon$', { dot: true }], ['muted', '$\\sup_K|f_n-f|\\ge\\varepsilon$', { dot: true }], ['red', '$\\sup_U|f_n-f|$'], ['accent', '$\\varepsilon$-band', { area: true }]]);
        v.render(() => {
          const S = SEQ[which.value], n = nS.value, r = rho.value, e = eps.value;
          L.heat((x, y) => (x * x + y * y < 1 ? Math.min(1, S.err(x, y, n)) : NaN), { range: [0, 1], cmap: 'magma', key: `${which.value}|${n}`, res: 2 });
          L.circle(0, 0, 1, { color: 'ink', width: 1.6, dash: [5, 4] });
          L.circle(0, 0, r, { color: 'orange', width: 2.6, fill: 'orange', fillAlpha: 0.06 });
          L.dot(r, 0, { color: 'orange', r: 4.5 });
          L.tex('K', -r * 0.45, r * 0.45, { color: 'orange', size: 17 });
          L.tex('U', -0.8, 0.82, { color: 'ink', size: 16 });
          // N(K, ε): first N with sup_K < ε from N on (the sup is decreasing in n)
          let N = null; for (let k = 0; k <= 400; k++) if (S.supK(r, k) < e) { N = k; break; }
          Rt.hband(0, e, { color: 'accent', alpha: 0.12, edges: true });
          Rt.tex('\\varepsilon', 60.5, e, { color: 'accent', align: 'right', baseline: 'bottom', dy: -2 });
          if (isFinite(S.supU)) Rt.hline(S.supU, { color: 'red', width: 2.4 });
          else { Rt.arrow(30, 1.02, 30, 1.24, { color: 'red', head: 8 }); Rt.text('sup over U = ∞', 31, 1.17, { color: 'red', size: 12 }); }
          const pts = M.range(61).map((k) => [k, S.supK(r, k)]);
          Rt.dots(pts.filter((p) => p[1] >= e && p[1] < 1.3), { color: 'muted', r: 2.6 });
          Rt.dots(pts.filter((p) => p[1] < e), { color: 'green', r: 2.8 });
          Rt.vline(n, { color: 'gold', width: 1.6 });
          Rt.dot(n, Math.min(1.24, S.supK(r, n)), { color: 'gold', r: 5 });
          if (N != null && N <= 60) { Rt.vline(N, { color: 'green', width: 1.4, dash: [4, 3] }); Rt.tex('N(K,\\varepsilon)', N, 0.62, { color: 'green', align: 'left', dx: 5, size: 13 }); }
          state = { S, n, r, e, N };
        });
        v.readout(() => {
          const s = state; if (!s) return '';
          const supK = s.S.supK(s.r, s.n);
          const uTxt = isFinite(s.S.supU) ? `$\\sup_U|f_n-f| = 1$ for every $n$` : `$\\sup_U|f_n-f| = \\infty$ for every $n$`;
          return `$\\sup_K|f_{${s.n}}-f| = ${v.sci(supK, 3)}$; $\\;N(K,\\varepsilon) = ${s.N ?? '>400'}$ for $\\rho = ${v.fix(s.r, 2)}$. ${uTxt}: the convergence is uniform on each compact $K\\subset U$ but not on $U$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 10.28
    {
      num: '10.28',
      kind: 'Theorem',
      name: 'Holomorphic limits: derivatives converge too',
      statement: String.raw`Suppose $f_j\in H(\Omega)$ for $j=1,2,3,\dots$ and $f_j\to f$ uniformly on compact subsets of $\Omega$. Then $f\in H(\Omega)$, and $f_j'\to f'$ uniformly on compact subsets of $\Omega$.`,
      idea: String.raw`The limit $f$ is continuous, and for each closed triangle $\Delta\subset\Omega$, $\int_{\partial\Delta}f=\lim_j\int_{\partial\Delta}f_j=0$ by Cauchy's theorem; Morera's theorem (10.17) makes $f$ holomorphic. For the derivatives fix a compact $K$ and $r>0$ so small that $E=\{z:\dist(z,K)\le r\}$ is a compact subset of $\Omega$. Cauchy's estimate (10.26) for $f-f_j$ on each disc $D(z;r)$, $z\in K$, gives $\|f'-f_j'\|_K\le r^{-1}\|f-f_j\|_E\to0$.`,
      caption: String.raw`$f_j=s_j$ is the Taylor polynomial of degree $j$. Drag the edge of $K$ (orange disc); $E$ is the dashed disc around it. Right: the measured errors $\|f-s_j\|_E$ and $\|f'-s_j'\|_K$ and the proof's bound $r^{-1}\|f-s_j\|_E$, which the derivative error never crosses. Gold dots are the zeros of $s_j$: inside $K$ they settle on the zeros of $f$ (green), while the extra ones flee — for $e^z$, which has no zeros, all of them leave every compact set.`,
      deps: ['rca-10.27', 'rca-10.17', 'rca-10.14', 'rca-10.26'],
      see: ['pma-7.17', 'fa-3.31'],
      tags: ['uniform convergence', 'Morera', 'Cauchy estimates'],
      viz(v) {
        const M = v.M, { Cx } = M;
        const one = new Cx(1, 0);
        const FN = {
          sin: { label: '$\\sin z$', coef: (k) => (k % 2 ? (((k - 1) / 2) % 2 ? -1 : 1) / fact(k) : 0), f: (z) => z.sin(), fp: (z) => z.cos(), entire: true, zeros: [-3, -2, -1, 0, 1, 2, 3].map((k) => [k * Math.PI, 0]), view: [[-12, 12], [-8, 8]], rho: 4, rMax: 9 },
          exp: { label: '$e^{z}$', coef: (k) => 1 / fact(k), f: (z) => z.exp(), fp: (z) => z.exp(), entire: true, zeros: [], view: [[-12, 12], [-8, 8]], rho: 3, rMax: 9 },
          geo: { label: '$\\frac{1}{1-z}$ on $U$', coef: () => 1, f: (z) => one.div(one.sub(z)), fp: (z) => one.div(one.sub(z).pow(2)), entire: false, zeros: [], view: [[-1.5, 1.5], [-1.15, 1.15]], rho: 0.55, rMax: 0.92 },
        };
        const which = v.select('$f$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'sin');
        const jS = v.slider('degree $j$', 1, 26, 9, { int: true });
        const JM = 26;
        const L = v.stage({ x: FN.sin.view[0], y: FN.sin.view[1], equal: true, height: 360, title: 'phase portrait of $s_j$, zeros of $s_j$ and of $f$' });
        const Rt = v.stage({ x: [0.3, JM + 0.7], y: [-12, 3], height: 360, axes: 'box', xlabel: 'j', title: 'errors against $j$ (log scale)' });
        const kh = L.handle(4, 0, { color: 'orange', r: 6, constrain: (x) => { const F = FN[which.value]; return [M.clamp(x, F.entire ? 0.4 : 0.1, F.rMax), 0]; } });
        let last = null, cacheKey = null, errs = null, rootCache = new Map(), state = null;
        const bg = () => v.rgb('panel');
        v.legend([['accent', '$\\|f-s_j\\|_E$'], ['orange', "$\\|f'-s_j'\\|_K$"], ['orange', "bound $r^{-1}\\|f-s_j\\|_E$", { dash: true }], ['gold', 'zeros of $s_j$', { dot: true }], ['green', 'zeros of $f$', { dot: true }]]);
        v.render(() => {
          const F = FN[which.value];
          if (last !== which.value) { last = which.value; L.setView(F.view[0], F.view[1]); kh.x = F.rho; kh.y = 0; rootCache = new Map(); }
          const rho = kh.x, r = F.entire ? 2 : (1 - rho) / 2, j = jS.value;
          const cf = M.range(JM + 1).map(F.coef);
          // errors for every degree, sampled on the circles |z| = rho + r (for E) and |z| = rho (for K): maximum modulus
          const key = `${which.value}|${rho}`;
          if (key !== cacheKey) {
            cacheKey = key; errs = { E: new Array(JM + 1).fill(0), K1: new Array(JM + 1).fill(0) };
            const NS = 200;
            for (const [rad, kind] of [[rho + r, 'E'], [rho, 'K1']]) {
              for (let i = 0; i < NS; i++) {
                const z = Cx.polar(rad, (2 * Math.PI * (i + 0.5)) / NS);
                const fz = kind === 'E' ? F.f(z) : F.fp(z);
                let s = new Cx(0, 0), p = new Cx(1, 0), pPrev = new Cx(0, 0);
                for (let k = 0; k <= JM; k++) {
                  if (kind === 'E') s = s.add(p.scale(cf[k])); else if (k >= 1) s = s.add(pPrev.scale(k * cf[k]));
                  const e = fz.sub(s).abs();
                  if (k >= 1 && e > errs[kind][k]) errs[kind][k] = e;
                  pPrev = p; p = p.mul(z);
                }
              }
            }
          }
          // left: phase portrait of s_j
          const cr = cf.slice(0, j + 1), ci = cr.map(() => 0);
          const B = bg();
          L.raster((x, y) => {
            let sr = 0, si = 0;
            for (let k = j; k >= 0; k--) { const t = sr * x - si * y + cr[k]; si = sr * y + si * x; sr = t; }
            return phaseRGB(M, sr, si, !F.entire && x * x + y * y > 1 ? 0.7 : 0.18, B, false);
          }, { key: `${which.value}|${j}`, res: 2 });
          if (!F.entire) L.circle(0, 0, 1, { color: 'ink', width: 1.6, dash: [5, 4] });
          L.circle(0, 0, rho + r, { color: 'orange', width: 1.6, dash: [6, 4] });
          L.circle(0, 0, rho, { color: 'orange', width: 2.6, fill: 'orange', fillAlpha: 0.1 });
          L.tex('K', -rho * 0.7, rho * 0.7, { color: 'orange', size: 17 });
          L.tex('E', -(rho + r) * 0.78, -(rho + r) * 0.72, { color: 'orange', size: 15 });
          for (const z of F.zeros) L.dot(z[0], z[1], { color: 'green', r: 6.5, hollow: true, width: 2.4 });
          const rk = `${which.value}|${j}`;
          if (!rootCache.has(rk)) rootCache.set(rk, polyRoots(cr, ci));
          const roots = rootCache.get(rk);
          L.dots(roots, { color: 'panel', r: 6 });
          L.dots(roots, { color: 'gold', r: 4.4 });
          const nS = roots.filter(([x, y]) => Math.hypot(x, y) < rho).length;
          const nF = F.zeros.filter(([x, y]) => Math.hypot(x, y) < rho).length;
          L.corner(`s${String(j).split('').map((d) => '₀₁₂₃₄₅₆₇₈₉'[+d]).join('')} has ${roots.length} zeros, ${nS} of them in K`, 'tl', { color: 'ink', weight: 600 });
          // right: log errors
          const lg = (x) => Math.log10(Math.max(x, 1e-300));
          const e1 = M.range(JM, 1).map((k) => [k, lg(errs.E[k])]);
          const e2 = M.range(JM, 1).map((k) => [k, lg(errs.K1[k])]);
          const e3 = M.range(JM, 1).map((k) => [k, lg(errs.E[k] / r)]);
          const all = [...e1, ...e2, ...e3].map((p) => p[1]).filter(isFinite);
          const hi = Math.max(...all) + 0.6, lo = Math.max(hi - 18, Math.min(...all) - 0.6);
          Rt.setView(null, [lo, hi]);
          Rt.setTicks(undefined, logTicks(M, lo, hi));
          Rt.vline(j, { color: 'gold', width: 1.4 });
          Rt.path(e3, { color: 'orange', width: 1.8, dash: [6, 4] });
          Rt.path(e1, { color: 'accent', width: 2.2 });
          Rt.path(e2, { color: 'orange', width: 2.4 });
          Rt.dot(j, lg(errs.K1[j]), { color: 'orange', r: 4.5 });
          Rt.dot(j, lg(errs.E[j]), { color: 'accent', r: 4.5 });
          state = { j, r, rho, nS, nF, eE: errs.E[j], eK: errs.K1[j], F };
        });
        v.readout(() => {
          const s = state; if (!s) return '';
          return `$\\rho = ${v.fix(s.rho, 2)}$, $r = ${v.fix(s.r, 3)}$, $j = ${s.j}$: $\\;\\|f'-s_j'\\|_K = ${v.sci(s.eK, 3)} \\le r^{-1}\\|f-s_j\\|_E = ${v.sci(s.eE / s.r, 3)}$. Zeros in $K$: $${s.nS}$ for $s_j$, $${s.nF}$ for $f$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 10.28a
    {
      num: '10.28a',
      kind: 'Corollary',
      name: 'All derivatives of holomorphic limits converge',
      statement: String.raw`Under the hypotheses of Theorem 10.28, $f_j^{(n)}\to f^{(n)}$ uniformly on compact subsets of $\Omega$ as $j\to\infty$, for every positive integer $n$.`,
      idea: String.raw`Apply 10.28 to $\{f_j'\}$, which converges to $f'$ uniformly on compact subsets, then to $\{f_j''\}$, and so on by induction. Nothing like this is true for real variables: $\sin(j^2x)/j\to0$ uniformly on $\R$ while its derivative $j\cos(j^2x)$ diverges. The complex hypothesis is stronger than it looks — uniform convergence on compact sets of an *open* subset of $\C$ — and the real counterexample violates it, because $\sin(j^2z)/j$ is enormous just off the real axis.`,
      caption: String.raw`In $\C$: $f_j(z)=(1+z/j)^j\to e^z$; the left panel is the phase portrait of $f_j^{(k)}$ (its zero of order $j-k$ sits at $z=-j$), the right panel shows $\sup_{|z|\le1.5}|f_j^{(k)}-e^z|$ for $k=0,\dots,4$, all tending to $0$. In $\R$: $g_j(x)=\sin(j^2x)/j$ is uniformly small on $[-\pi,\pi]$, but its derivatives are not — and neither is $g_j$ itself on the tiny disc $|z|\le0.05$ (left: $\log_{10}|g_j|$ on a thin strip around the real axis).`,
      deps: ['rca-10.28'],
      verify: true,
      tags: ['uniform convergence', 'derivatives'],
      viz(v) {
        const M = v.M, { Cx } = M;
        const mode = v.select('', [{ value: 'C', label: '$\\C$: $(1+z/j)^j\\to e^z$' }, { value: 'R', label: '$\\R$: $\\sin(j^2x)/j\\to0$' }], 'C');
        const jS = v.slider('$j$', 1, 80, 6, { int: true });
        const kS = v.slider('derivative order $k$', 0, 4, 1, { int: true });
        const JM = 80, KC = ['accent', 'orange', 'green', 'purple', 'teal'];
        const L = v.stage({ x: [-6, 6], y: [-4, 4], height: 340, axes: true, title: '' });
        const Rt = v.stage({ x: [0.3, JM + 0.7], y: [-6, 2], height: 340, axes: 'box', xlabel: 'j', title: '' });
        // (C) f_j^{(k)}(z) = coef * (1 + z/j)^{j-k}
        const fjk = (j, k, z) => { if (k > j) return new Cx(0, 0); let c = 1; for (let i = 0; i < k; i++) c *= (j - i) / j; return new Cx(1, 0).add(z.scale(1 / j)).pow(j - k).scale(c); };
        const KR = 1.5;
        const errC = M.range(5).map((k) => M.range(JM + 1).map((j) => { if (j === 0) return NaN; let m = 0; for (let i = 0; i < 160; i++) { const z = Cx.polar(KR, (2 * Math.PI * (i + 0.5)) / 160); m = Math.max(m, fjk(j, k, z).sub(z.exp()).abs()); } return m; }));
        // (R) sups on the segment and on a small disc
        const DEL = 0.05;
        const errR = { seg: [], segk: M.range(5).map(() => []), disc: [] };
        for (let j = 1; j <= JM; j++) {
          errR.seg[j] = 1 / j;
          for (let k = 0; k < 5; k++) errR.segk[k][j] = Math.pow(j, 2 * k - 1);
          errR.disc[j] = Math.sinh(j * j * DEL) / j; // max over |z| = δ of |sin(j²z)|/j, attained at z = ±iδ
        }
        let state = null;
        v.render(() => {
          const j = jS.value, k = kS.value;
          if (mode.value === 'C') {
            const hh = (7 * L.height) / L.width;
            L.setView([-8.5, 5.5], [-hh, hh]);
            L.setTitle(`phase portrait of $f_j^{(k)}$, $\\;f_j=(1+z/j)^j$`);
            L.raster((x, y) => { const w = fjk(j, k, new Cx(x, y)); return phaseRGB(M, w.re, w.im, 0, null, false); }, { key: `C|${j}|${k}`, res: 2 });
            L.circle(0, 0, KR, { color: 'ink', width: 2.4, fill: 'panel', fillAlpha: 0.12 });
            L.tex('K', -1.05, 1.05, { color: 'ink', size: 16 });
            if (j > k && j <= 8.3) { L.dot(-j, 0, { color: 'ink', r: 5, label: `zero of order ${j - k}`, labelPos: 'n', math: false }); }
            else if (j > k) { L.arrow(-6.6, -hh * 0.82, -8.3, -hh * 0.82, { color: 'ink', head: 8 }); L.text(`zero of order ${j - k} at z = −${j}`, -6.4, -hh * 0.82, { color: 'ink', size: 12 }); }
            Rt.setTitle('$\\sup_K|f_j^{(k)}-e^z|$, $k=0,\\dots,4$ (log scale)');
            const all = errC.flat().filter((x) => isFinite(x) && x > 0).map(Math.log10);
            const lo = Math.min(...all) - 0.3, hi = Math.max(...all) + 0.3;
            Rt.setView(null, [lo, hi]);
            Rt.setTicks(undefined, logTicks(M, lo, hi));
            for (let kk = 0; kk < 5; kk++) Rt.path(M.range(JM, 1).map((jj) => [jj, Math.log10(errC[kk][jj])]), { color: KC[kk], width: kk === k ? 3 : 1.4, alpha: kk === k ? 1 : 0.55 });
            Rt.vline(j, { color: 'gold', width: 1.4 });
            Rt.dot(j, Math.log10(errC[k][j]), { color: KC[k], r: 5 });
            v.legend(M.range(5).map((kk) => [KC[kk], `$k=${kk}$`]));
            state = { mode: 'C', j, k, e: errC[k][j] };
          } else {
            L.setView([-Math.PI, Math.PI], [-0.3, 0.3]);
            L.setTitle('$\\log_{10}|g_j(z)|$ near the real axis, $g_j(z)=\\sin(j^2z)/j$');
            L.heat((x, y) => { const s = Math.hypot(Math.sin(j * j * x) * Math.cosh(j * j * y), Math.cos(j * j * x) * Math.sinh(j * j * y)); return Math.log10(s / j + 1e-12); }, { range: [-3, 3], cmap: 'diverging', key: `R|${j}`, res: 2 });
            L.axes();
            L.line(-Math.PI, 0, Math.PI, 0, { color: 'green', width: 3 });
            L.circle(0, 0, DEL, { color: 'ink', width: 2 });
            L.text('|z| ≤ 0.05', 0.12, 0.17, { color: 'ink', size: 12 });
            L.text('[−π, π]: |g_j| ≤ 1/j', -3, -0.24, { color: 'green', size: 12, weight: 600 });
            Rt.setTitle('$\\log_{10}$ of sup-norms against $j$');
            Rt.setView(null, [-2.2, 10]);
            Rt.setTicks(undefined, [-2, 0, 2, 4, 6, 8, 10].map((e) => [e, '10' + sup(e)]));
            Rt.path(M.range(JM, 1).map((jj) => [jj, Math.log10(errR.seg[jj])]), { color: 'green', width: 2.6 });
            Rt.path(M.range(JM, 1).map((jj) => [jj, Math.log10(errR.segk[Math.max(1, k)][jj])]), { color: 'red', width: 2.4 });
            Rt.path(M.range(JM, 1).map((jj) => [jj, Math.min(14, Math.log10(errR.disc[jj]))]), { color: 'red', width: 2.2, dash: [6, 4] });
            Rt.vline(j, { color: 'gold', width: 1.4 });
            v.legend([['green', '$\\sup_{[-\\pi,\\pi]}|g_j|\\to0$'], ['red', `$\\sup_{[-\\pi,\\pi]}|g_j^{(${Math.max(1, k)})}|\\to\\infty$`], ['red', '$\\sup_{|z|\\le0.05}|g_j|\\to\\infty$', { dash: true }]]);
            state = { mode: 'R', j, k: Math.max(1, k) };
          }
        });
        v.readout(() => {
          const s = state; if (!s) return '';
          if (s.mode === 'C') return `$\\sup_{|z|\\le 1.5}|f_{${s.j}}^{(${s.k})}(z)-e^z| = ${v.sci(s.e, 3)}$ — every derivative converges, uniformly on $K$.`;
          return `$j=${s.j}$: $\\sup_{[-\\pi,\\pi]}|g_j| = ${v.sci(1 / s.j, 3)}$ but $\\sup_{[-\\pi,\\pi]}|g_j^{(${s.k})}| = ${v.sci(Math.pow(s.j, 2 * s.k - 1), 3)}$ and $\\sup_{|z|\\le0.05}|g_j| = ${v.sci(Math.sinh(s.j * s.j * DEL) / s.j, 3)}$: $g_j\\to0$ on a segment, not on compact subsets of an open set, so 10.28 does not apply.`;
        });
      },
    },
    // ------------------------------------------------------------------ 10.29
    {
      num: '10.29',
      kind: 'Lemma',
      name: 'The difference quotient is jointly continuous',
      statement: String.raw`Let $f\in H(\Omega)$ and define $g$ on $\Omega\times\Omega$ by
$$g(z,w)=\frac{f(z)-f(w)}{z-w}\quad(z\ne w),\qquad g(z,z)=f'(z).$$
Then $g$ is continuous on $\Omega\times\Omega$.`,
      idea: String.raw`Off the diagonal continuity is clear. At a diagonal point $(a,a)$ take a disc $D(a;r)\subset\Omega$ on which $|f'(\zeta)-f'(a)|<\eps$ ($f'$ is continuous, indeed holomorphic, by 10.16). For $z,w\in D(a;r)$ the segment from $w$ to $z$ stays in the disc and $g(z,w)=\int_0^1 f'(w+t(z-w))\,dt$, an average of values of $f'$ that are all within $\eps$ of $f'(a)$. Hence $|g(z,w)-g(a,a)|<\eps$. The lemma feeds the inverse function theorem (10.30) and Dixon's proof of the global Cauchy theorem (10.35).`,
      caption: String.raw`Drag $a$, $z$ and $w$ (or press *shrink*). Right panel, in the $w$-plane of values: the gold curve is $t\mapsto f'(w+t(z-w))$, its average is the blue point $g(z,w)$, and the dashed circle has radius $\sup_{D(a;r)}|f'-f'(a)|$ — so $g(z,w)$ is trapped near $f'(a)$. For $\bar z$, which is not holomorphic, $g(z,w)=e^{-2i\arg(z-w)}$ depends only on the direction: it runs around the unit circle however close $z,w$ are to $a$.`,
      deps: ['rca-10.16', 'rca-10.12'],
      tags: ['difference quotient', 'continuity'],
      viz(v) {
        const M = v.M, { Cx, TAU } = M;
        const FN = {
          exp: { label: '$e^{z}$', f: (z) => z.exp(), fp: (z) => z.exp() },
          cube: { label: '$z^3$', f: (z) => z.pow(3), fp: (z) => z.pow(2).scale(3) },
          sin: { label: '$\\sin 2z$', f: (z) => z.scale(2).sin(), fp: (z) => z.scale(2).cos().scale(2) },
          conj: { label: '$\\bar z$ (not holomorphic)', f: (z) => z.conj(), fp: null },
        };
        const which = v.select('$f$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'cube');
        const L = v.stage({ x: [-0.9, 1.9], y: [-0.9, 1.3], equal: true, height: 340, title: 'the points $a$, $z$, $w$ and the disc $D(a;r)$' });
        const Rt = v.stage({ x: [-1, 1], y: [-1, 1], equal: true, height: 340, title: "values: $f'$ along $[w,z]$ and its average $g(z,w)$" });
        const a = L.handle(0.5, 0.2, { color: 'green', label: 'a', labelPos: 'sw' });
        const z = L.handle(0.8, 0.36, { color: 'accent', label: 'z' });
        const w = L.handle(0.28, 0.44, { color: 'orange', label: 'w', labelPos: 'nw' });
        let prevA = [a.x, a.y];
        a.onDrag = () => { const dx = a.x - prevA[0], dy = a.y - prevA[1]; z.x += dx; z.y += dy; w.x += dx; w.y += dy; prevA = [a.x, a.y]; };
        v.button('shrink $z,w$ toward $a$', () => { for (const h of [z, w]) { h.x = a.x + (h.x - a.x) / 2; h.y = a.y + (h.y - a.y) / 2; } });
        v.button('reset', () => { a.x = 0.5; a.y = 0.2; z.x = 0.8; z.y = 0.36; w.x = 0.28; w.y = 0.44; prevA = [a.x, a.y]; });
        let state = null;
        v.render(() => {
          const F = FN[which.value];
          const A = new Cx(a.x, a.y), Z = new Cx(z.x, z.y), W = new Cx(w.x, w.y);
          const r = Math.max(Z.sub(A).abs(), W.sub(A).abs(), 1e-6);
          if (F.fp) L.raster((x, y) => { const q = F.fp(new Cx(x, y)); return phaseRGB(M, q.re, q.im, 0.6, v.rgb('panel'), false); }, { key: which.value, res: 3 });
          L.circle(a.x, a.y, r, { color: 'orange', width: 1.6, dash: [5, 4], fill: 'orange', fillAlpha: 0.08 });
          L.line(w.x, w.y, z.x, z.y, { color: 'gold', width: 3 });
          if (F.fp) L.corner("background: phase portrait of f′ (faded)", 'bl', { size: 11 });
          const zw = Z.sub(W);
          const g = zw.abs() > 1e-12 ? F.f(Z).sub(F.f(W)).div(zw) : (F.fp ? F.fp(Z) : new Cx(NaN, NaN));
          if (F.fp) {
            const fa = F.fp(A);
            let sp = 0; for (let j = 0; j < 240; j++) sp = Math.max(sp, F.fp(A.add(Cx.polar(r, (TAU * j) / 240))).sub(fa).abs());
            const hw = 2;
            Rt.setView([fa.re - hw, fa.re + hw], [fa.im - hw, fa.im + hw]);
            Rt.circle(fa.re, fa.im, sp, { color: 'orange', width: 1.6, dash: [5, 4], fill: 'orange', fillAlpha: 0.08 });
            if (sp < hw * 0.85) Rt.tex("\\sup_{D(a;r)}|f'-f'(a)|", fa.re, fa.im + sp, { color: 'orange', size: 13, baseline: 'bottom', dy: -3 });
            Rt.curve((t) => F.fp(W.add(zw.scale(t))), 0, 1, { color: 'gold', width: 3, n: 120 });
            const avg = new Cx(M.integrate((t) => F.fp(W.add(zw.scale(t))).re, 0, 1, 200), M.integrate((t) => F.fp(W.add(zw.scale(t))).im, 0, 1, 200));
            Rt.dot(fa.re, fa.im, { color: 'green', r: 5.5, label: "f′(a)", labelPos: 'sw', math: true });
            Rt.dot(g.re, g.im, { color: 'accent', r: 6, label: 'g(z,w)', labelPos: 'ne' });
            state = { holo: true, g, fa, sp, r, avg };
          } else {
            Rt.setView([-1.45, 1.45], [-1.45, 1.45]);
            Rt.circle(0, 0, 1, { color: 'muted', width: 1.5, dash: [5, 4] });
            const th = Math.atan2(zw.im, zw.re);
            Rt.line(0, 0, g.re, g.im, { color: 'accent', width: 1.4, dash: [3, 3] });
            Rt.dot(g.re, g.im, { color: 'red', r: 6.5, label: 'g(z,w)', labelPos: g.re >= 0 ? 'e' : 'w' });
            Rt.corner('no limit at (a, a)', 'tl', { color: 'red', weight: 600 });
            state = { holo: false, g, th, r };
          }
        });
        v.readout(() => {
          const s = state; if (!s) return '';
          if (s.holo) return `$r = ${v.fix(s.r, 4)}$: $\\;|g(z,w)-f'(a)| = ${v.sci(s.g.sub(s.fa).abs(), 3)} \\;\\le\\; \\sup_{D(a;r)}|f'-f'(a)| = ${v.sci(s.sp, 3)}$. (Check: $\\int_0^1 f'(w+t(z-w))\\,dt$ agrees with $g(z,w)$ to $${v.sci(s.avg.sub(s.g).abs(), 2)}$.)`;
          return `$g(z,w) = \\overline{(z-w)}/(z-w) = e^{-2i\\theta}$ with $\\theta = \\arg(z-w) = ${Math.round((s.th * 180) / Math.PI)}^\\circ$, for every size $r = ${v.fix(s.r, 4)}$ of the pair: the quotient cannot be extended continuously to the diagonal.`;
        });
      },
    },
    // ------------------------------------------------------------------ 10.30
    {
      num: '10.30',
      kind: 'Theorem',
      name: 'Local holomorphic inverse',
      statement: String.raw`Suppose $\varphi\in H(\Omega)$, $z_0\in\Omega$ and $\varphi'(z_0)\ne0$. Then $\Omega$ contains a neighbourhood $V$ of $z_0$ such that
(a) $\varphi$ is one-to-one on $V$;
(b) $W=\varphi(V)$ is an open set;
(c) the inverse $\psi:W\to V$, defined by $\psi(\varphi(z))=z$, is holomorphic in $W$.`,
      idea: String.raw`With $g$ the difference quotient of Lemma 10.29, $g(z_0,z_0)=\varphi'(z_0)\ne0$, so by continuity $|g(z_1,z_2)|>\tfrac12|\varphi'(z_0)|$ for $z_1,z_2$ in a small disc $V$: then $|\varphi(z_1)-\varphi(z_2)|\ge\tfrac12|\varphi'(z_0)|\,|z_1-z_2|$, which is (a). For (b) one shows that for $w$ near $\varphi(a)$ the function $\varphi-w$ must vanish in a small disc around $a$, otherwise $1/(\varphi-w)$ would violate the maximum modulus theorem. The lower bound in (a) makes $\psi$ continuous, and then its difference quotients are reciprocals of those of $\varphi$, giving $\psi'(w)=1/\varphi'(\psi(w))$.`,
      caption: String.raw`Drag $z_0$ and the radius handle. Coloured rays and circles of the disc $V=D(z_0;r)$ are carried to the right panel by $\varphi$. The boundary image is green while $\varphi$ is one-to-one on $\overline V$ and turns red (with the first self-crossing marked) once it is not. The dashed green circle is the largest such disc: it shrinks to nothing as $z_0$ approaches a critical point ×, where $\varphi'=0$. For $e^z$ there are no critical points, yet $r$ can never exceed $\pi$.`,
      deps: ['rca-10.29', 'rca-10.24', 'rca-10.16'],
      see: ['pma-9.24'],
      tags: ['inverse function', 'conformal'],
      viz(v) {
        const M = v.M, { Cx, TAU } = M;
        const one = new Cx(1, 0);
        const FN = {
          cub: { label: '$z^3-3z$', f: (z) => z.pow(3).sub(z.scale(3)), fp: (z) => z.pow(2).scale(3).sub(3), crit: [[1, 0], [-1, 0]], poles: [], view: [[-2.6, 2.6], [-2, 2]], z0: [0.35, 0.5], r: 0.45 },
          exp: { label: '$e^{z}$', f: (z) => z.exp(), fp: (z) => z.exp(), crit: [], poles: [], view: [[-4.4, 4.4], [-3.6, 3.6]], z0: [0, 0.2], r: 1.4 },
          jou: { label: '$\\frac12\\left(z+\\frac1z\\right)$', f: (z) => z.add(z.inv()).scale(0.5), fp: (z) => one.sub(z.mul(z).inv()).scale(0.5), crit: [[1, 0], [-1, 0]], poles: [[0, 0]], view: [[-2.6, 2.6], [-2, 2]], z0: [0.3, 1.05], r: 0.5 },
        };
        const which = v.select('$\\varphi$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'cub');
        const L = v.stage({ x: FN.cub.view[0], y: FN.cub.view[1], equal: true, height: 350, title: 'domain: $V=D(z_0;r)$' });
        const Rt = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, height: 350, axes: false, title: 'image: $W=\\varphi(V)$' });
        const z0 = L.handle(0.35, 0.5, { color: 'ink', label: 'z₀', labelPos: 'sw' });
        const rh = L.handle(0.8, 0.5, { color: 'orange', r: 6 });
        let prev = [z0.x, z0.y], last = null, state = null;
        const rCap = () => { const F = FN[which.value]; let m = 3.3; for (const p of F.poles) m = Math.min(m, 0.97 * Math.hypot(p[0] - z0.x, p[1] - z0.y)); return Math.max(0.05, m); };
        z0.onDrag = () => { rh.x += z0.x - prev[0]; rh.y += z0.y - prev[1]; prev = [z0.x, z0.y]; };
        rh.constrain = (x, y) => { const dx = x - z0.x, dy = y - z0.y, d = Math.hypot(dx, dy) || 1, r = M.clamp(d, 0.05, rCap()); return [z0.x + (dx / d) * r, z0.y + (dy / d) * r]; };
        const imgCircle = (F, c, r, n = 240) => circlePts(c.re, c.im, r, n).map(([x, y]) => { const q = F.f(new Cx(x, y)); return [q.re, q.im]; });
        v.render(() => {
          const F = FN[which.value];
          if (last !== which.value) { last = which.value; L.setView(F.view[0], F.view[1]); z0.x = F.z0[0]; z0.y = F.z0[1]; rh.x = F.z0[0] + F.r; rh.y = F.z0[1]; prev = [z0.x, z0.y]; }
          let dx = rh.x - z0.x, dy = rh.y - z0.y; const d0 = Math.hypot(dx, dy) || 1;
          const r = M.clamp(d0, 0.05, rCap());
          if (Math.abs(r - d0) > 1e-9) { rh.x = z0.x + (dx / d0) * r; rh.y = z0.y + (dy / d0) * r; }
          const C0 = new Cx(z0.x, z0.y), w0 = F.f(C0), d1 = F.fp(C0);
          // injectivity radius: largest ρ with φ(∂D(z0;ρ)) simple (⇔ φ one-to-one on the closed disc)
          const hiR = rCap();
          let rStar;
          if (!selfCross(imgCircle(F, C0, hiR, 200))) rStar = hiR;
          else { let lo = 0, hi = hiR; for (let it = 0; it < 22; it++) { const m = (lo + hi) / 2; if (selfCross(imgCircle(F, C0, m, 200))) hi = m; else lo = m; } rStar = lo; }
          const dCrit = F.crit.length ? Math.min(...F.crit.map((c) => Math.hypot(c[0] - z0.x, c[1] - z0.y))) : Infinity;
          // left
          L.circle(z0.x, z0.y, r, { fill: 'accent', fillAlpha: 0.1, stroke: false });
          for (let i = 1; i <= 3; i++) L.circle(z0.x, z0.y, (r * i) / 4, { color: 'muted', width: 1, alpha: 0.7 });
          for (let k = 0; k < 6; k++) { const u = Cx.polar(r, (TAU * k) / 6); L.line(z0.x, z0.y, z0.x + u.re, z0.y + u.im, { color: RAYC[k], width: 2.2 }); }
          const bnd = imgCircle(F, C0, r, 360), cross = selfCross(bnd);
          L.circle(z0.x, z0.y, r, { color: cross ? 'red' : 'green', width: 2.6 });
          if (rStar > 0.02 && rStar < 6) L.circle(z0.x, z0.y, rStar, { color: 'green', width: 1.5, dash: [6, 4] });
          for (const c of F.crit) xMark(L, c[0], c[1], 'red');
          for (const p of F.poles) L.dot(p[0], p[1], { color: 'ink', r: 4, hollow: true, label: 'pole', labelPos: 's', math: false });
          // right: auto-fit to the image of the boundary
          let xs = bnd.map((p) => p[0]), ys = bnd.map((p) => p[1]);
          const xa = Math.min(...xs), xb = Math.max(...xs), ya = Math.min(...ys), yb = Math.max(...ys);
          const half = Math.max(0.6, (xb - xa) * 0.62, (yb - ya) * 0.62);
          Rt.setView([(xa + xb) / 2 - half, (xa + xb) / 2 + half], [(ya + yb) / 2 - half, (ya + yb) / 2 + half]);
          Rt.poly(bnd, { fill: 'accent', fillAlpha: 0.1, stroke: false });
          for (let i = 1; i <= 3; i++) Rt.path(imgCircle(F, C0, (r * i) / 4, 200), { color: 'muted', width: 1, alpha: 0.7, close: true });
          for (let k = 0; k < 6; k++) Rt.curve((t) => F.f(C0.add(Cx.polar(r * t, (TAU * k) / 6))), 0, 1, { color: RAYC[k], width: 2.2, n: 80 });
          Rt.path(bnd, { color: cross ? 'red' : 'green', width: 2.6, close: true });
          if (cross) Rt.dot(cross[0], cross[1], { color: 'red', r: 5.5, label: 'two preimages', labelPos: 'ne', math: false });
          Rt.dot(w0.re, w0.im, { color: 'ink', r: 4.5, label: 'φ(z₀)', labelPos: 'sw' });
          L.corner(d1.abs() < 1e-3 ? "φ′(z₀) = 0: no such V" : cross ? 'not one-to-one on this disc' : 'one-to-one on this disc', 'tl', { color: d1.abs() < 1e-3 || cross ? 'red' : 'green', weight: 600 });
          state = { d1, rStar, dCrit, cross, r, hiR };
        });
        v.readout(() => {
          const s = state; if (!s) return '';
          const crit = isFinite(s.dCrit) ? `; distance from $z_0$ to the nearest critical point $= ${v.fix(s.dCrit, 2)}$` : '';
          const rs = s.rStar >= s.hiR - 1e-9 ? `\\ge ${v.fix(s.rStar, 2)}` : `= ${v.fix(s.rStar, 2)}`;
          return `$\\varphi'(z_0) = ${s.d1.toString(3).replace('i', '\\,i')}$, $\\;\\psi'(\\varphi(z_0)) = 1/\\varphi'(z_0) = ${s.d1.abs() > 1e-9 ? s.d1.inv().toString(3).replace('i', '\\,i') : '\\infty'}$. Largest radius on which $\\varphi$ is one-to-one: $r^* ${rs}$${crit}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 10.32
    {
      num: '10.32',
      kind: 'Theorem',
      name: 'Local m-to-one structure; the open mapping theorem',
      statement: String.raw`Suppose $\Omega$ is a region, $f\in H(\Omega)$ is not constant, $z_0\in\Omega$, $w_0=f(z_0)$, and $m$ is the order of the zero of $f-w_0$ at $z_0$. Then there are a neighbourhood $V\subset\Omega$ of $z_0$ and $\varphi\in H(V)$ such that
(a) $f(z)=w_0+[\varphi(z)]^m$ for all $z\in V$;
(b) $\varphi'$ has no zero in $V$, and $\varphi$ maps $V$ one-to-one onto a disc $D(0;r)$.

Consequently $f$ maps $V\setminus\{z_0\}$ exactly $m$-to-one onto the punctured disc $D'(w_0;r^m)$, so $w_0$ is an interior point of $f(\Omega)$. In particular (the open mapping theorem) $f(\Omega)$ is open, and it is a region.`,
      idea: String.raw`By 10.18, $f-w_0=(z-z_0)^m h$ with $h$ holomorphic and $h(z_0)\ne0$. On a small convex neighbourhood where $h\ne0$, $h'/h$ has a primitive (Cauchy's theorem in a convex set), which yields a holomorphic $m$-th root: $h=g^m$. Then $\varphi=(z-z_0)g$ has $\varphi'(z_0)=g(z_0)\ne0$, and the local inverse theorem 10.30 makes $\varphi$ a biholomorphic map of a neighbourhood $V$ onto a disc. Since $w\mapsto w^m$ is $m$-to-one from $D'(0;r)$ onto $D'(0;r^m)$, the structure of $f$ follows.`,
      caption: String.raw`The left disc $D(z_0;\rho)$ is coloured by $\arg\big(f(z)-w_0\big)$: around a point of order $m$ every hue appears $m$ times. Drag $z_0$ (it snaps onto critical points) and the gold point $w$ near $w_0$: its $m$ preimages appear in the disc, joined to $z_0$ by the preimages of the segment $[w_0,w]$. As $\xi$ runs once around $\partial D$, $f(\xi)$ winds $m$ times around $w_0$; every point of the green disc is hit exactly $m$ times.`,
      deps: ['rca-10.18', 'rca-10.14', 'rca-10.30'],
      tags: ['open mapping', 'local structure'],
      viz(v) {
        const M = v.M, { Cx, TAU } = M;
        const FN = {
          quart: { label: '$z^3-\\frac{z^4}{2}$', f: (z) => z.pow(3).sub(z.pow(4).scale(0.5)), fp: (z) => z.pow(2).scale(3).sub(z.pow(3).scale(2)), crit: [[0, 0], [1.5, 0]], view: [[-0.95, 2.25], [-1.1, 1.1]], z0: [0, 0], rho: 0.6 },
          cos: { label: '$\\cos z$', f: (z) => z.cos(), fp: (z) => z.sin().neg(), crit: [[-Math.PI, 0], [0, 0], [Math.PI, 0]], view: [[-4, 4], [-2.4, 2.4]], z0: [0, 0], rho: 0.9 },
          pow4: { label: '$z^4-1$', f: (z) => z.pow(4).sub(1), fp: (z) => z.pow(3).scale(4), crit: [[0, 0]], view: [[-1.25, 1.25], [-1, 1]], z0: [0, 0], rho: 0.65 },
        };
        const which = v.select('$f$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'quart');
        const rhoS = v.slider('$\\rho$', 0.15, 1, 0.55, { step: 0.01 });
        const L = v.stage({ x: FN.quart.view[0], y: FN.quart.view[1], equal: true, height: 350, title: '$\\arg(f-w_0)$ on $D(z_0;\\rho)$, and the preimages of $w$' });
        const Rt = v.stage({ x: [-1, 1], y: [-1, 1], equal: true, height: 350, axes: false, title: 'values: $f(\\partial D)$ winds $m$ times around $w_0$' });
        const z0 = L.handle(0, 0, { color: 'ink', label: 'z₀', labelPos: 'sw', constrain: (x, y) => { for (const c of FN[which.value].crit) if (Math.hypot(x - c[0], y - c[1]) < 0.14) return [c[0], c[1]]; return [x, y]; } });
        const wh = Rt.handle(0.3, 0.2, { color: 'gold', label: 'w' });
        let wrel = [0.2, 0.11], last = null, state = null, view = null;
        wh.onDrag = () => { if (view) wrel = [(wh.x - view.c[0]) / view.h, (wh.y - view.c[1]) / view.h]; };
        const newton = (F, z, w) => { for (let i = 0; i < 50; i++) { const d = F.fp(z); if (d.abs() < 1e-14) break; const step = F.f(z).sub(w).div(d); z = z.sub(step); if (step.abs() < 1e-14) break; } return z; };
        v.legend([['ink', '$\\partial D$ and $f(\\partial D)$'], ['green', 'disc $D(w_0;\\varepsilon)$, $\\varepsilon=\\min_{\\partial D}|f-w_0|$', { area: true }], ['gold', '$w$ and its preimages', { dot: true }]]);
        v.animate((t) => {
          const F = FN[which.value];
          if (last !== which.value) { last = which.value; L.setView(F.view[0], F.view[1]); z0.x = F.z0[0]; z0.y = F.z0[1]; rhoS.value = F.rho; wrel = [0.2, 0.11]; }
          const rho = rhoS.value, C0 = new Cx(z0.x, z0.y), w0 = F.f(C0);
          // order m of the zero of f - w0 at z0, from Taylor coefficients on a small circle
          const rc = 0.25 * rho, c = taylorCoeffs(M, (z) => F.f(z).sub(w0), C0, rc, 8, 64);
          const sc = c.map((ck, k) => ck.abs() * Math.pow(rc, k)); const big = Math.max(...sc.slice(1));
          let m = 1; for (let k = 1; k <= 8; k++) if (sc[k] > 1e-7 * big) { m = k; break; }
          // left: hue of f - w0, faded outside the disc
          const B = v.rgb('panel');
          L.raster((x, y) => { const q = F.f(new Cx(x, y)).sub(w0); const out = (x - z0.x) ** 2 + (y - z0.y) ** 2 > rho * rho; return phaseRGB(M, q.re, q.im, out ? 0.72 : 0, B, false); }, { key: `${which.value}|${z0.x}|${z0.y}|${rho}`, res: 2 });
          L.circle(z0.x, z0.y, rho, { color: 'ink', width: 2.2 });
          for (const cc of F.crit) if (Math.hypot(cc[0] - z0.x, cc[1] - z0.y) > 1e-9) xMark(L, cc[0], cc[1], 'ink', 4.5);
          // right: image of the boundary circle, the ε-disc, and w
          const bnd = circlePts(z0.x, z0.y, rho, 360).map(([x, y]) => { const q = F.f(new Cx(x, y)); return [q.re, q.im]; });
          let R = 0, eps = Infinity; for (const p of bnd) { const d = Math.hypot(p[0] - w0.re, p[1] - w0.im); R = Math.max(R, d); eps = Math.min(eps, d); }
          const h = 1.18 * R; view = { c: [w0.re, w0.im], h };
          Rt.setView([w0.re - h, w0.re + h], [w0.im - h, w0.im + h]);
          wh.x = w0.re + wrel[0] * h; wh.y = w0.im + wrel[1] * h;
          Rt.circle(w0.re, w0.im, eps, { fill: 'green', fillAlpha: 0.14, color: 'green', width: 1.4, dash: [5, 4] });
          Rt.path(bnd, { color: 'ink', width: 1.8, close: true });
          for (const s of [0.1, 0.35, 0.6, 0.85]) { const i = Math.floor(s * 360), p = bnd[i], q = bnd[(i + 3) % 360]; Rt.arrow(p[0], p[1], q[0], q[1], { color: 'ink', head: 9, width: 1.8 }); }
          Rt.dot(w0.re, w0.im, { color: 'ink', r: 4.5, label: 'w₀', labelPos: 'sw' });
          // preimages of w in D (Newton from many starts, deduplicated) and the index of f(∂D) about w
          const W = new Cx(wh.x, wh.y);
          const ind = windPoly(bnd, W.re, W.im);
          const pre = [];
          for (let i = 1; i <= 5; i++) for (let k = 0; k < 14; k++) {
            const zz = newton(F, C0.add(Cx.polar((rho * i) / 5.5, (TAU * (k + 0.5 * i)) / 14)), W);
            if (!isFinite(zz.re) || zz.sub(C0).abs() >= rho || F.f(zz).sub(W).abs() > 1e-8) continue;
            if (!pre.some((p) => p.sub(zz).abs() < 1e-6)) pre.push(zz);
          }
          // the m preimage arcs of the segment [w0, w]: track each preimage of w back to w0
          for (const p0 of pre) {
            const arc = [[p0.re, p0.im]]; let zz = p0;
            for (let s = 1; s <= 40; s++) { const ws = W.add(w0.sub(W).scale(s / 40)); zz = newton(F, zz, ws); arc.push([zz.re, zz.im]); }
            L.path(arc, { color: 'panel', width: 5 });
            L.path(arc, { color: 'gold', width: 2.4 });
          }
          L.dots(pre.map((p) => [p.re, p.im]), { color: 'gold', r: 5 });
          Rt.line(w0.re, w0.im, W.re, W.im, { color: 'gold', width: 2.2 });
          // tracer
          const s = (t / 6) % 1, xi = C0.add(Cx.polar(rho, TAU * s)), fx = F.f(xi);
          L.dot(xi.re, xi.im, { color: 'accent', r: 5.5, label: 'ξ', labelPos: 'e' });
          Rt.dot(fx.re, fx.im, { color: 'accent', r: 5.5, label: 'f(ξ)', labelPos: 'ne' });
          L.corner(`m = ${m}`, 'tl', { color: 'ink', weight: 700, size: 14 });
          // how many times f(ξ) has turned around w0 so far (makes the m laps visible when they overlap)
          let turn = 0; const iEnd = Math.floor(s * 360);
          for (let i = 0; i < iEnd; i++) { const a0 = Math.atan2(bnd[i][1] - w0.im, bnd[i][0] - w0.re), a1 = Math.atan2(bnd[i + 1][1] - w0.im, bnd[i + 1][0] - w0.re); let d = a1 - a0; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; turn += d; }
          L.corner(`ξ has gone ${v.fix(s, 2)} of the way round ∂D`, 'bl', { size: 12 });
          Rt.corner(`f(ξ) has turned ${v.fix(turn / TAU, 2)} times round w₀`, 'bl', { size: 12, color: 'accent', weight: 600 });
          state = { m, ind, n: pre.length, eps, inDisc: W.sub(w0).abs() < eps };
        }, { period: 6 });
        v.readout(() => {
          const s = state; if (!s) return '';
          return `Order of the zero of $f-w_0$ at $z_0$: $m = ${s.m}$. $\\;\\operatorname{Ind}_{f(\\partial D)}(w) = ${s.ind}$; preimages of $w$ found in $D(z_0;\\rho)$: $${s.n}$` + (s.inDisc ? ` — $w$ is in the green disc, so it has exactly $m$ preimages.` : ` — $w$ is outside the green disc; move it closer to $w_0$.`);
        });
      },
    },
    // ------------------------------------------------------------------ 10.33
    {
      num: '10.33',
      kind: 'Theorem',
      name: 'One-to-one holomorphic maps are biholomorphic',
      statement: String.raw`Suppose $\Omega$ is a region, $f\in H(\Omega)$, and $f$ is one-to-one in $\Omega$. Then $f'(z)\ne0$ for every $z\in\Omega$, and the inverse of $f$ is holomorphic.`,
      idea: String.raw`If $f'(z_0)=0$, the zero of $f-f(z_0)$ at $z_0$ has order $m\ge2$, and by 10.32 $f$ is $m$-to-one near $z_0$ — not one-to-one. So $f'$ never vanishes, $f$ is open (10.32), hence its inverse is continuous, and 10.30 shows that the inverse is holomorphic near every point of $f(\Omega)$. The converse fails globally ($e^z$ has $f'\ne0$ but is periodic); it holds only locally (10.30).`,
      caption: String.raw`$f(z)=z+cz^2$ on the unit disc $U$; its only critical point is $z^*=-1/(2c)$. While $|c|\le\frac12$, $z^*$ lies outside $U$, the image boundary $f(\partial U)$ is a simple curve and the gold point $w$ has one preimage $\psi(w)$. Push $|c|$ past $\frac12$: $z^*$ enters $U$, the image folds over itself, and the red points $z^*\pm d$ have the same image — $f$ stops being one-to-one exactly when $f'$ acquires a zero.`,
      deps: ['rca-10.32', 'rca-10.30'],
      see: ['pma-9.24'],
      verify: true,
      tags: ['univalent', 'conformal'],
      viz(v) {
        const M = v.M, { Cx, TAU } = M;
        const cAbs = v.slider('$|c|$', 0, 1.1, 0.42, { step: 0.01 });
        const cArg = v.slider('$\\arg c$', 0, 2 * Math.PI, 0.6, { step: 0.01 });
        const L = v.stage({ x: [-1.35, 1.35], y: [-1.35, 1.35], equal: true, height: 340, ticks: false, title: 'the unit disc $U$ and the critical point $z^*$' });
        const Rt = v.stage({ x: [-2.15, 2.15], y: [-2.15, 2.15], equal: true, height: 340, title: '$f(U)$ for $f(z)=z+cz^2$' });
        const wh = Rt.handle(0.45, 0.35, { color: 'gold', label: 'w' });
        let state = null;
        v.render(() => {
          const c = Cx.polar(cAbs.value, cArg.value);
          const f = (z) => z.add(c.mul(z.mul(z)));
          // left: polar grid of U
          L.circle(0, 0, 1, { fill: 'accent', fillAlpha: 0.08, stroke: false });
          for (let i = 1; i <= 3; i++) L.circle(0, 0, i / 4, { color: 'muted', width: 1, alpha: 0.7 });
          for (let k = 0; k < 6; k++) { const u = Cx.polar(1, (TAU * k) / 6); L.line(0, 0, u.re, u.im, { color: RAYC[k], width: 2 }); }
          const bnd = circlePts(0, 0, 1, 360).map(([x, y]) => { const q = f(new Cx(x, y)); return [q.re, q.im]; });
          const cross = selfCross(bnd);
          L.circle(0, 0, 1, { color: cross ? 'red' : 'green', width: 2.4 });
          // right: image grid
          Rt.poly(bnd, { fill: 'accent', fillAlpha: 0.08, stroke: false });
          for (let i = 1; i <= 3; i++) Rt.curve((t) => f(Cx.polar(i / 4, TAU * t)), 0, 1, { color: 'muted', width: 1, alpha: 0.7, n: 160 });
          for (let k = 0; k < 6; k++) Rt.curve((t) => f(Cx.polar(t, (TAU * k) / 6)), 0, 1, { color: RAYC[k], width: 2, n: 80 });
          Rt.path(bnd, { color: cross ? 'red' : 'green', width: 2.4, close: true });
          let zs = null;
          if (cAbs.value > 1e-9) {
            zs = new Cx(-0.5, 0).div(c);
            const b = L.bounds, inView = zs.re > b.x[0] + 0.05 && zs.re < b.x[1] - 0.05 && zs.im > b.y[0] + 0.05 && zs.im < b.y[1] - 0.05;
            if (inView) { xMark(L, zs.re, zs.im, zs.abs() < 1 ? 'red' : 'ink'); L.tex('z^*', zs.re, zs.im, { color: zs.abs() < 1 ? 'red' : 'ink', dx: 14, dy: -12, size: 14 }); }
            else { const u = zs.scale(1 / zs.abs()); L.arrow(1.04 * u.re, 1.04 * u.im, 1.26 * u.re, 1.26 * u.im, { color: 'ink', head: 8, width: 1.6 }); L.tex(`z^*\\ (|z^*| = ${v.fix(zs.abs(), 2)})`, 1.1 * u.re, 1.1 * u.im, { color: 'ink', size: 13, dx: u.re > 0 ? -8 : 8, dy: u.im > 0 ? 14 : -14, align: u.re > 0 ? 'right' : 'left' }); }
          }
          // preimages of w in U: roots of c z² + z − w = 0
          const W = new Cx(wh.x, wh.y);
          let pre = [];
          if (cAbs.value < 1e-9) pre = [W];
          else { const disc = new Cx(1, 0).add(c.mul(W).scale(4)).sqrt(); pre = [disc.sub(1), disc.neg().sub(1)].map((q) => q.div(c.scale(2))); }
          pre = pre.filter((p) => p.abs() < 1);
          for (const p of pre) L.dot(p.re, p.im, { color: 'gold', r: 5.5, label: 'ψ(w)', labelPos: 'ne' });
          let pair = null;
          if (zs && zs.abs() < 1) {
            const d = 0.45 * (1 - zs.abs()), u = Cx.polar(1, cArg.value + Math.PI / 2);
            const z1 = zs.add(u.scale(d)), z2 = zs.sub(u.scale(d)), fz = f(z1);
            L.dot(z1.re, z1.im, { color: 'red', r: 5 }); L.dot(z2.re, z2.im, { color: 'red', r: 5 });
            Rt.dot(fz.re, fz.im, { color: 'red', r: 6, label: 'f(z₁) = f(z₂)', labelPos: 'se' });
            pair = { z1, z2, gap: fz.sub(f(z2)).abs() };
          }
          L.corner(cross ? 'f is not one-to-one on U' : 'f is one-to-one on U', 'tl', { color: cross ? 'red' : 'green', weight: 600 });
          state = { c, zs, pre, pair, f, minD: Math.max(0, 1 - 2 * cAbs.value) };
        });
        v.readout(() => {
          const s = state; if (!s) return '';
          if (s.pair) return `$|z^*| = ${v.fix(s.zs.abs(), 3)} < 1$, so $f'(z^*)=0$ inside $U$, and $z_1 = ${s.pair.z1.toString(3).replace('i', '\\,i')}$, $z_2 = ${s.pair.z2.toString(3).replace('i', '\\,i')}$ have $|f(z_1)-f(z_2)| = ${v.sci(s.pair.gap, 2)}$. Preimages of $w$ in $U$: $${s.pre.length}$.`;
          let t = `$\\inf_U|f'| \\ge 1-2|c| = ${v.fix(s.minD, 3)}$` + (s.minD > 0 ? ' $>0$' : '') + '.';
          if (s.pre.length === 1) { const p = s.pre[0], d = new Cx(1, 0).add(s.c.mul(p).scale(2)); t += ` $\\psi(w) = ${p.toString(3).replace('i', '\\,i')}$ and $\\psi'(w) = 1/f'(\\psi(w)) = ${d.inv().toString(3).replace('i', '\\,i')}$.`; }
          else t += ' (Move $w$ into $f(U)$ to see its unique preimage.)';
          return t;
        });
      },
    },
  ],
};
