// Rudin, Real and Complex Analysis — Chapter 10, part b3: the calculus of residues (10.41–10.43).

// ---------------------------------------------------------------- helpers shared by this file
// Phase-portrait colour of w = re + i im (hue = arg w, bands = log2|w|); `fade` blends toward RGB `bg`.
function phaseRGB(M, re, im, fade = 0, bg = null, bands = true) {
  if (!isFinite(re) || !isFinite(im)) return bg ? [bg[0], bg[1], bg[2]] : [250, 250, 250];
  const t = bands ? M.fract(Math.log2(Math.hypot(re, im) + 1e-300)) : 0.55;
  const c = M.hsl2rgb(Math.atan2(im, re) / M.TAU, 0.62, 0.42 + 0.2 * Math.pow(t, 0.7));
  if (!fade || !bg) return c;
  return [c[0] + (bg[0] - c[0]) * fade, c[1] + (bg[1] - c[1]) * fade, c[2] + (bg[2] - c[2]) * fade];
}
// A small "×" with a halo.
function xMark(S, x, y, color = 'ink', size = 6) {
  const d = size / S.scale;
  for (const [col, w] of [['panel', 5.5], [color, 2.4]]) {
    S.line(x - d, y - d, x + d, y + d, { color: col, width: w });
    S.line(x - d, y + d, x + d, y - d, { color: col, width: w });
  }
}
// Closed Catmull–Rom spline through the points P; m samples per span.
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
function windPoly(P, x, y) {
  let w = 0; const n = P.length;
  for (let i = 0; i < n; i++) {
    const a = P[i], b = P[(i + 1) % n];
    const s = (b[0] - a[0]) * (y - a[1]) - (x - a[0]) * (b[1] - a[1]);
    if (a[1] <= y) { if (b[1] > y && s > 0) w++; } else if (b[1] <= y && s < 0) w--;
  }
  return w;
}
const distToPoly = (P, x, y) => { let d = Infinity; const n = P.length; for (let i = 0; i < n; i++) { const a = P[i], b = P[(i + 1) % n], ux = b[0] - a[0], uy = b[1] - a[1], L2 = ux * ux + uy * uy || 1, t = Math.max(0, Math.min(1, ((x - a[0]) * ux + (y - a[1]) * uy) / L2)); d = Math.min(d, Math.hypot(a[0] + t * ux - x, a[1] + t * uy - y)); } return d; };
// Running contour integral Σ f(mid) Δz along a closed polygon; returns the partial sums (n + 1 points).
function runningIntegral(P, f) {
  let sr = 0, si = 0; const n = P.length, out = [[0, 0]];
  for (let i = 0; i < n; i++) {
    const a = P[i], b = P[(i + 1) % n], w = f([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]), dx = b[0] - a[0], dy = b[1] - a[1];
    sr += w[0] * dx - w[1] * dy; si += w[0] * dy + w[1] * dx; out.push([sr, si]);
  }
  return out;
}
function arrowsOn(S, P, color, fracs = [0.08, 0.33, 0.58, 0.83], head = 10) {
  const n = P.length, L = 15 / S.scale;
  for (const f of fracs) {
    const i = Math.floor(f * n) % n, a = P[i]; let j = i + 1;
    while (j < i + n / 4 && Math.hypot(P[j % n][0] - a[0], P[j % n][1] - a[1]) < L) j++;
    const b = P[j % n]; S.arrow(a[0], a[1], b[0], b[1], { color, head, width: 2.2 });
  }
}
// Laurent coefficients c_k (k = kmin..kmax) of f about a, from N samples on |z − a| = rho.
function laurent(M, f, a, rho, kmin, kmax, N = 256) {
  const { Cx, TAU } = M; const vr = [], vi = [];
  for (let j = 0; j < N; j++) { const w = f(a.add(Cx.polar(rho, (TAU * j) / N))); vr.push(w.re); vi.push(w.im); }
  const out = {};
  for (let k = kmin; k <= kmax; k++) {
    let sr = 0, si = 0;
    for (let j = 0; j < N; j++) { const t = (-TAU * j * k) / N, c = Math.cos(t), s = Math.sin(t); sr += vr[j] * c - vi[j] * s; si += vr[j] * s + vi[j] * c; }
    const sc = 1 / (N * Math.pow(rho, k)); out[k] = new Cx(sr * sc, si * sc);
  }
  return out;
}
// Roots of Σ (cr[k] + i ci[k]) z^k (Durand–Kerner).
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
  for (let it = 0; it < 500; it++) {
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
    if (maxd < 1e-13) break;
  }
  return zr.map((x, i) => [x, zi[i]]);
}
// Multiply out Π (z − r_k) into coefficients (low → high).
function polyFromRoots(roots) {
  let cr = [1], ci = [0];
  for (const [x, y] of roots) {
    const nr = new Array(cr.length + 1).fill(0), ni = new Array(cr.length + 1).fill(0);
    for (let k = 0; k < cr.length; k++) { nr[k + 1] += cr[k]; ni[k + 1] += ci[k]; nr[k] -= cr[k] * x - ci[k] * y; ni[k] -= cr[k] * y + ci[k] * x; }
    cr = nr; ci = ni;
  }
  return [cr, ci];
}
const SUP = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];
const sup = (n) => (n < 0 ? '⁻' : '') + String(Math.abs(n)).split('').map((d) => SUP[+d]).join('');
// TeX for a complex number, dropping a part that is negligible (< 1e-9 of the other) as rounding noise.
function cx2(v, z, d = 3) {
  const re = z.re ?? z[0], im = z.im ?? z[1], tiny = 1e-9 * Math.max(Math.abs(re), Math.abs(im), 1e-300);
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
    // ------------------------------------------------------------------ 10.41
    {
      num: '10.41',
      kind: 'Definition',
      name: 'Meromorphic functions; principal part and residue',
      statement: String.raw`A function $f$ is *meromorphic* in an open set $\Omega$ if there is a set $A\subset\Omega$ such that
(a) $A$ has no limit point in $\Omega$,
(b) $f\in H(\Omega\setminus A)$, and
(c) $f$ has a pole at each point of $A$.
($A$ may be empty, and it is at most countable.) If $a\in A$ is a pole of order $m$, Theorem 10.21 gives constants $c_1,\dots,c_m$, $c_m\ne0$, such that $f-Q$ has a removable singularity at $a$, where
$$Q(z)=\sum_{k=1}^{m}c_k(z-a)^{-k}$$
is the *principal part* of $f$ at $a$. The coefficient $c_1$ is the *residue* of $f$ at $a$, written $\Res(f;a)$.`,
      idea: String.raw`Poles are the tame isolated singularities: near $a$, $f$ is a finite sum of negative powers plus a holomorphic function. The residue is the one coefficient that survives integration around $a$: $(z-a)^{-k}$ has a primitive for $k\ge2$ (10.12), while $\frac{1}{2\pi i}\int\frac{dz}{z-a}$ over a small positively oriented circle is $1$. Hence $\Res(f;a)=\frac1{2\pi i}\int_{|z-a|=r}f(z)\,dz$ for every small $r$ — which is how the residues in this picture are computed.`,
      caption: String.raw`Drag the handle: it snaps to the nearest pole. Right: the Laurent coefficients $|c_k|$ about that pole, computed as contour integrals over the circle drawn on the left — the negative-index ones (orange) form the principal part, the green one is the residue, and they stop at the order $m$. Choose "$f-Q$" to subtract the principal part: the colour wheel at the pole disappears (a removable singularity). The poles of $\tan(1/z)$ accumulate at $0$, so it is meromorphic in $\C\setminus\{0\}$ but not in $\C$.`,
      deps: ['rca-10.21'],
      verify: true,
      tags: ['poles', 'residues', 'meromorphic'],
      viz(v) {
        const M = v.M, { Cx, PI } = M;
        const one = new Cx(1, 0);
        const ints = M.range(13, -6).map((k) => [k, 0]);
        const tanPoles = []; for (let k = 0; k < 40; k++) { const p = 1 / (PI * (k + 0.5)); tanPoles.push([p, 0], [-p, 0]); }
        const FN = {
          cot: { label: '$\\pi\\cot\\pi z$', f: (z) => z.scale(PI).cos().div(z.scale(PI).sin()).scale(PI), poles: ints, view: [[-3.2, 3.2], [-1.6, 1.6]], a0: [1, 0] },
          rat: { label: '$\\dfrac{e^{z}}{z^2(z-1.5)}$', f: (z) => z.exp().div(z.mul(z).mul(z.sub(1.5))), poles: [[0, 0], [1.5, 0]], view: [[-1.6, 2.6], [-1.4, 1.4]], a0: [0, 0] },
          tan: { label: '$\\tan(1/z)$', f: (z) => { const w = z.inv(); return w.sin().div(w.cos()); }, poles: tanPoles, view: [[-1, 1], [-0.62, 0.62]], a0: [2 / PI, 0], acc: true },
        };
        const which = v.select('$f$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'rat');
        const show = v.select('show', [{ value: 'f', label: '$f$' }, { value: 'fq', label: '$f-Q$' }], 'f');
        const L = v.stage({ x: FN.rat.view[0], y: FN.rat.view[1], equal: true, height: 340, axes: false, title: 'phase portrait; poles marked ×' });
        const R = v.stage({ x: [-5.6, 4.7], y: [-3, 1], height: 340, axes: 'box', xlabel: 'k', xticks: M.range(9, -4), title: 'Laurent coefficients $|c_k|$ about the chosen pole (log scale)' });
        const nearest = (x, y) => { let best = null, bd = Infinity; for (const p of FN[which.value].poles) { const d = Math.hypot(p[0] - x, p[1] - y); if (d < bd) { bd = d; best = p; } } return best; };
        const ah = L.handle(0, 0, { color: 'ink', r: 6, constrain: (x, y) => nearest(x, y) });
        let last = null, state = null;
        v.legend([['orange', 'principal part $c_{-m},\\dots,c_{-2}$', { area: true }], ['green', 'residue $c_{-1}$', { area: true }], ['accent', 'holomorphic part $c_0,c_1,\\dots$', { area: true }]]);
        v.render(() => {
          const F = FN[which.value];
          if (last !== which.value) { last = which.value; L.setView(F.view[0], F.view[1]); ah.x = F.a0[0]; ah.y = F.a0[1]; }
          const a = new Cx(ah.x, ah.y);
          // radius: half the distance to the nearest other singular point (0 counts for tan(1/z))
          const others = F.poles.filter((p) => Math.hypot(p[0] - a.re, p[1] - a.im) > 1e-9).concat(F.acc ? [[0, 0]] : []);
          const dOther = Math.min(...others.map((p) => Math.hypot(p[0] - a.re, p[1] - a.im)));
          const rho = Math.min(0.5 * dOther, 0.8);
          const c = laurent(M, F.f, a, rho, -4, 4, 256);
          const scale = Math.max(...M.range(9, -4).map((k) => c[k].abs() * Math.pow(rho, k)));
          let m = 0; for (let k = 4; k >= 1; k--) if (c[-k].abs() * Math.pow(rho, -k) > 1e-8 * scale) { m = k; break; }
          const Q = (z) => { let s = new Cx(0, 0); const d = z.sub(a); for (let k = 1; k <= m; k++) s = s.add(c[-k].mul(one.div(d.pow(k)))); return s; };
          const fq = show.value === 'fq';
          L.raster((x, y) => { const z = new Cx(x, y); let w = F.f(z); if (fq) w = w.sub(Q(z)); return phaseRGB(M, w.re, w.im); }, { key: `${which.value}|${fq ? a.re + ',' + a.im : 'f'}`, res: 2 });
          for (const p of F.poles) if (p[0] > L.bounds.x[0] && p[0] < L.bounds.x[1] && Math.hypot(p[0], p[1]) > 0.075) xMark(L, p[0], p[1], 'ink', 4.5);
          if (F.acc) { L.dot(0, 0, { color: 'red', r: 5 }); L.text('0 = limit point of the poles', 0, -0.13, { color: 'red', align: 'center', size: 12, weight: 600 }); }
          L.circle(a.re, a.im, rho, { color: 'panel', width: 4.5 });
          L.circle(a.re, a.im, rho, { color: 'ink', width: 1.8, dash: [5, 4] });
          // right: |c_k| on a log scale
          const ks = M.range(9, -4);
          const vals = ks.map((k) => c[k].abs());
          const mx = Math.max(...vals);
          const logs = vals.map((x) => (x > mx * 1e-9 ? Math.log10(x) : null));
          const fin = logs.filter((x) => x != null);
          const hi = Math.max(...fin) + 0.5, lo = Math.min(...fin) - 0.6;
          R.setView(null, [lo - 0.06 * (hi - lo), hi]);
          const yt = []; const st = hi - lo > 6 ? 2 : 1; for (let e = Math.ceil(lo / st) * st; e <= hi; e += st) yt.push([e, '10' + sup(e)]); R.setTicks(undefined, yt);
          ks.forEach((k, i) => {
            const y = logs[i];
            if (y == null) { R.text('0', k, lo, { align: 'center', baseline: 'bottom', dy: -3, color: 'muted', size: 11 }); return; }
            const col = k === -1 ? 'green' : k < 0 ? 'orange' : 'accent';
            R.rect(k - 0.34, lo, k + 0.34, y, { fill: col, fillAlpha: 0.8, stroke: false });
          });
          R.vline(-0.5, { color: 'muted', width: 1, dash: [3, 4] });
          const res = c[-1];
          L.corner(`pole of order ${m}`, 'tl', { weight: 700, color: 'ink' });
          state = { a, m, res, rho, fq };
        });
        v.readout(() => {
          const s = state; if (!s) return '';
          return `Pole at $a = ${cx2(v, s.a, 4)}$ of order $m = ${s.m}$. $\\;\\operatorname{Res}(f;a) = c_{-1} = \\frac{1}{2\\pi i}\\int_{|z-a|=${v.fix(s.rho, 3)}} f(z)\\,dz = ${cx2(v, s.res, 5)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 10.42
    {
      num: '10.42',
      kind: 'Theorem',
      name: 'The residue theorem',
      statement: String.raw`Suppose $f$ is meromorphic in $\Omega$, $A$ is the set of poles of $f$ in $\Omega$, and $\Gamma$ is a cycle in $\Omega\setminus A$ such that $\Ind_\Gamma(\alpha)=0$ for every $\alpha$ not in $\Omega$. Then
$$\frac1{2\pi i}\int_\Gamma f(z)\,dz=\sum_{a\in A}\Res(f;a)\,\Ind_\Gamma(a).$$`,
      idea: String.raw`Only finitely many poles $a_1,\dots,a_n$ have $\Ind_\Gamma(a)\ne0$ (they lie in a compact set, and $A$ has no limit point in $\Omega$). Subtract their principal parts $Q_j$: then $f-\sum Q_j$ is holomorphic in $\Omega$ minus the remaining poles, a set on which $\Gamma$ still satisfies the hypothesis of the global Cauchy theorem 10.35, so its integral over $\Gamma$ is $0$. Finally $\frac1{2\pi i}\int_\Gamma Q_j=\Res(f;a_j)\Ind_\Gamma(a_j)$, because the higher negative powers integrate to $0$ over closed paths.`,
      caption: String.raw`$f$ has four poles (drag them: $a_1,a_3$ are simple, $a_2,a_4$ also carry $(z-a)^{-2}$ terms that contribute nothing). Reshape $\Gamma$ with the gold handles. Right: the coloured arrows are $\Res(f;a_k)\Ind_\Gamma(a_k)$ laid head to tail, and the gold path is the running value of $\frac{1}{2\pi i}\int f$ as the tracer moves along $\Gamma$ — it ends exactly where the arrows end.`,
      deps: ['rca-10.41', 'rca-10.35', 'rca-10.21', 'rca-10.12a'],
      tags: ['residues', 'contour integral'],
      viz(v) {
        const M = v.M, { Cx, TAU } = M;
        const RES = [new Cx(1, 0), new Cx(0, 0.8), new Cx(-0.6, 0), new Cx(0.5, -0.5)];
        const SQ = [new Cx(0, 0), new Cx(0.4, 0), new Cx(0, 0), new Cx(0, -0.3)];
        const PCOL = ['accent', 'orange', 'purple', 'teal'];
        const PRE = {
          loop: { label: 'one loop', pts: [[-1.5, -1.3], [-0.2, -1.4], [0.4, -0.3], [1.1, 0.4], [0.6, 1.55], [-1.2, 1.5], [-2.1, 0.2]] },
          eight: { label: 'figure eight', pts: [[-2.2, 0.6], [-1.3, 1.5], [-0.3, 0.4], [0.9, -1.2], [2.1, -0.5], [1.4, 0.4], [-0.4, -0.2], [-1.4, -0.4]] },
          double: { label: 'double loop', pts: [[-0.4, 1.7], [-1.0, 0.75], [-0.2, 0.0], [1.2, 0.5], [0.9, 1.5], [-0.3, 1.3], [0.05, 0.4], [0.9, 1.0]] },
        };
        const pre = v.select('$\\Gamma$', Object.entries(PRE).map(([value, o]) => ({ value, label: o.label })), 'loop');
        const S = v.stage({ x: [-2.7, 2.7], y: [-2, 2], equal: true, height: 380, axes: false, weight: 1.35, minWidth: 380, title: 'poles $a_k$ and the cycle $\\Gamma$' });
        const R = v.stage({ x: [-1, 1], y: [-1, 1], equal: true, height: 380, weight: 1, minWidth: 280, title: 'values: $\\sum_k \\operatorname{Res}(f;a_k)\\operatorname{Ind}_\\Gamma(a_k)$ vs $\\frac{1}{2\\pi i}\\int_\\Gamma f$' });
        const poles = [[-1.4, 0.55], [0.3, 0.9], [1.3, -0.45], [-0.5, -0.75]].map(([x, y], k) => S.handle(x, y, { color: PCOL[k], r: 6, label: `a${'₁₂₃₄'[k]}`, labelPos: 'ne' }));
        const G = [];
        for (let i = 0; i < 8; i++) G.push(S.handle(0, 0, { color: 'gold', r: 5.5 }));
        let last = null, state = null;
        const f = ([x, y]) => {
          let re = 0.3 * Math.cos(x) * Math.cosh(y), im = -0.3 * Math.sin(x) * Math.sinh(y); // + 0.3 cos z (entire part)
          for (let k = 0; k < 4; k++) {
            const dx = x - poles[k].x, dy = y - poles[k].y, d = dx * dx + dy * dy, ir = dx / d, ii = -dy / d; // 1/(z−a)
            re += RES[k].re * ir - RES[k].im * ii; im += RES[k].re * ii + RES[k].im * ir;
            const qr = ir * ir - ii * ii, qi = 2 * ir * ii; re += SQ[k].re * qr - SQ[k].im * qi; im += SQ[k].re * qi + SQ[k].im * qr;
          }
          return [re, im];
        };
        v.animate((t) => {
          if (last !== pre.value) { last = pre.value; const pts = PRE[pre.value].pts; G.forEach((h, i) => { const p = pts[i % pts.length]; h.visible = i < pts.length; h.x = p[0]; h.y = p[1]; }); }
          const ctrl = G.filter((h) => h.visible).map((h) => [h.x, h.y]);
          const P = splineClosed(ctrl, 70);
          const B = v.rgb('panel');
          S.raster((x, y) => { const w = f([x, y]); return phaseRGB(M, w[0], w[1], 0.6, B, false); }, { key: poles.map((p) => `${p.x},${p.y}`).join('|'), res: 3 });
          S.path(P, { color: 'panel', width: 5, close: true });
          S.path(P, { color: 'ink', width: 2.2, close: true });
          arrowsOn(S, P, 'ink', [0.05, 0.3, 0.55, 0.8], 11);
          // residues numerically (small circles), indices by winding
          const info = poles.map((h, k) => {
            const a = new Cx(h.x, h.y);
            const dO = Math.min(...poles.filter((q) => q !== h).map((q) => Math.hypot(q.x - h.x, q.y - h.y)));
            const r = Math.min(0.15, 0.4 * dO);
            let s = new Cx(0, 0); const N = 200;
            for (let j = 0; j < N; j++) { const u = Cx.polar(r, (TAU * (j + 0.5)) / N), w = f([a.re + u.re, a.im + u.im]); s = s.add(new Cx(w[0], w[1]).mul(u)); }
            const res = s.scale(1 / N); // (1/2πi)∮ f dz with dz = i u dθ
            return { res, ind: windPoly(P, h.x, h.y), d: distToPoly(P, h.x, h.y), col: PCOL[k] };
          });
          const onCurve = info.some((p) => p.d < 0.05);
          info.forEach((p, k) => { S.tex(`\\operatorname{Ind}=${p.ind}`, poles[k].x, poles[k].y, { color: p.ind ? 'ink' : 'muted', size: 12, dy: 18 }); });
          const run = runningIntegral(P, f).map(([a, b]) => [b / TAU, -a / TAU]);
          const total = run[run.length - 1];
          // right panel: vector sum vs running integral
          const heads = [[0, 0]]; let sx = 0, sy = 0;
          info.forEach((p) => { sx += p.res.re * p.ind; sy += p.res.im * p.ind; heads.push([sx, sy]); });
          const allPts = run.concat(heads);
          let x0 = Math.min(...allPts.map((p) => p[0])), x1 = Math.max(...allPts.map((p) => p[0])), y0 = Math.min(...allPts.map((p) => p[1])), y1 = Math.max(...allPts.map((p) => p[1]));
          const half = Math.min(8, Math.max(0.9, (x1 - x0) * 0.62, (y1 - y0) * 0.62)), cxv = (x0 + x1) / 2, cyv = (y0 + y1) / 2;
          R.setView([cxv - half, cxv + half], [cyv - half, cyv + half]);
          R.path(run, { color: 'gold', width: 1.4, alpha: 0.45 });
          const u = (t % 8) / 8, nu = Math.max(1, Math.floor(u * (run.length - 1)));
          R.path(run.slice(0, nu + 1), { color: 'gold', width: 2.6 });
          R.dot(run[nu][0], run[nu][1], { color: 'gold', r: 4.5 });
          info.forEach((p, k) => { if (p.ind) R.arrow(heads[k][0], heads[k][1], heads[k + 1][0], heads[k + 1][1], { color: p.col, width: 3, head: 11 }); });
          R.dot(0, 0, { color: 'ink', r: 3.5 });
          R.dot(total[0], total[1], { color: onCurve ? 'red' : 'green', r: 8, hollow: true, width: 2.4 });
          // tracer on Γ
          const pp = P[Math.floor(u * P.length) % P.length];
          S.dot(pp[0], pp[1], { color: 'gold', r: 5 });
          if (onCurve) S.corner('a pole lies on Γ: move it off', 'tl', { color: 'red', weight: 600 });
          state = { info, total, sum: [sx, sy], onCurve };
        }, { period: 8 });
        v.readout(() => {
          const s = state; if (!s) return '';
          const terms = s.info.map((p, k) => `$a_${k + 1}$: $(${cx2(v, p.res, 3)})\\cdot(${p.ind})$`).join('; ');
          return `$\\frac{1}{2\\pi i}\\int_\\Gamma f = ${cx2(v, s.total, 4)}$, $\\;\\sum_k\\operatorname{Res}(f;a_k)\\operatorname{Ind}_\\Gamma(a_k) = ${cx2(v, s.sum, 4)}$` + (s.onCurve ? ' (inaccurate: a pole is on $\\Gamma$).' : '.') + ` Residue × index: ${terms}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 10.43
    {
      num: '10.43',
      kind: 'Theorem',
      name: "The argument principle and Rouché's theorem",
      statement: String.raw`Let $\gamma$ be a closed path in a region $\Omega$ such that $\Ind_\gamma(\alpha)=0$ for every $\alpha\notin\Omega$ and $\Ind_\gamma(\alpha)\in\{0,1\}$ for every $\alpha\in\Omega\setminus\gamma^*$, and let $\Omega_1=\{\alpha:\Ind_\gamma(\alpha)=1\}$. For $f\in H(\Omega)$ let $N_f$ be the number of zeros of $f$ in $\Omega_1$, counted with multiplicity.
(a) If $f\in H(\Omega)$ has no zeros on $\gamma^*$, then
$$N_f=\frac1{2\pi i}\int_\gamma\frac{f'(z)}{f(z)}\,dz=\Ind_\Gamma(0),\qquad\Gamma=f\circ\gamma .$$
(b) If moreover $g\in H(\Omega)$ and $|f(z)-g(z)|<|f(z)|$ for every $z\in\gamma^*$, then $N_g=N_f$.`,
      idea: String.raw`(a) $f'/f$ is meromorphic in $\Omega$; at a zero $a$ of order $m$, $f=(z-a)^mh$ with $h(a)\ne0$ gives $f'/f=\frac{m}{z-a}+\frac{h'}{h}$, a simple pole with residue $m$. The residue theorem 10.42 turns $\frac1{2\pi i}\int_\gamma f'/f$ into $\sum m\cdot\Ind_\gamma(a)=N_f$, and substituting $w=f(z)$ shows the same integral is $\frac1{2\pi i}\int_\Gamma\frac{dw}{w}=\Ind_\Gamma(0)$. (b) The inequality says $|\Gamma_g(t)-\Gamma_f(t)|<|0-\Gamma_f(t)|$ with $\Gamma_g=g\circ\gamma$, so Lemma 10.39 gives $\Ind_{g\circ\gamma}(0)=\Ind_{f\circ\gamma}(0)$; apply (a) to both.`,
      caption: String.raw`Argument principle: drag the four zeros of the polynomial $f$ (drop one on another for a double zero) and move or resize the circle $\gamma$; the image curve $f\circ\gamma$ on the right winds around $0$ exactly $N_f$ times. Rouché, as a dog on a leash: the walker traces $f\circ\gamma$, the dog traces $g\circ\gamma$ with $g=f+\lambda h$, and the leash is $g-f$. While the leash is always shorter than the walker's distance to the tree at $0$, the dog circles the tree as often as the walker does — and $g$ has as many zeros inside $\gamma$ (gold) as $f$. Lengthen the leash and the count can change.`,
      deps: ['rca-10.42', 'rca-10.18', 'rca-10.39', 'rca-10.10'],
      tags: ['argument principle', 'Rouché', 'zeros'],
      viz(v) {
        const M = v.M, { TAU } = M;
        const mode = v.select('', [{ value: 'a', label: '(a) argument principle' }, { value: 'b', label: "(b) Rouché" }], 'a');
        const lam = v.slider('leash size $\\lambda$', 0, 2.5, 1.6, { step: 0.01 });
        const S = v.stage({ x: [-2.4, 2.4], y: [-1.8, 1.8], equal: true, height: 370, axes: false, title: '' });
        const R = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, height: 370, axes: false, title: '' });
        const Z = [[-0.55, 0.35], [0.45, -0.3], [1.55, 0.8], [-1.5, -1.0]].map(([x, y], k) => S.handle(x, y, { color: 'accent', r: 6.5, label: `z${'₁₂₃₄'[k]}`, labelPos: 'ne' }));
        const snap = (h) => (x, y) => { for (const q of Z) if (q !== h && Math.hypot(q.x - x, q.y - y) < 0.09) return [q.x, q.y]; return [x, y]; };
        Z.forEach((h) => { h.constrain = snap(h); });
        const ch = S.handle(0, 0.1, { color: 'ink', r: 5.5 });
        const rh = S.handle(1.1, 0.1, { color: 'ink', r: 5 });
        let prev = [ch.x, ch.y];
        ch.onDrag = () => { rh.x += ch.x - prev[0]; rh.y += ch.y - prev[1]; prev = [ch.x, ch.y]; };
        // h(z) = (z² + 1.2 i)·0.5: a fixed perturbation; g = f + λh
        const hP = (x, y) => [0.5 * (x * x - y * y), 0.5 * (2 * x * y + 1.2)];
        const fP = (x, y) => { let re = 1, im = 0; for (const q of Z) { const a = x - q.x, b = y - q.y, t = re * a - im * b; im = re * b + im * a; re = t; } return [re, im]; };
        let state = null;
        v.animate((time) => {
          const isB = mode.value === 'b';
          lam.el.hidden = !isB;
          const cx = ch.x, cy = ch.y, r = Math.max(0.12, Math.hypot(rh.x - cx, rh.y - cy));
          const N = 480, gam = [], Fc = [], Gc = [];
          const l = isB ? lam.value : 0;
          for (let i = 0; i < N; i++) {
            const t = (TAU * i) / N, x = cx + r * Math.cos(t), y = cy + r * Math.sin(t);
            gam.push([x, y]);
            const fv = fP(x, y); Fc.push(fv);
            const hv = hP(x, y); Gc.push([fv[0] + l * hv[0], fv[1] + l * hv[1]]);
          }
          // zeros of f and of g (g is a polynomial too: f + λ h)
          const zf = Z.map((h) => [h.x, h.y]);
          const inside = (p) => Math.hypot(p[0] - cx, p[1] - cy) < r;
          const Nf = zf.filter(inside).length;
          const [cr, ci] = polyFromRoots(zf);
          cr[2] += 0.5 * l; ci[0] += 0.6 * l;
          const zg = isB ? polyRoots(cr, ci) : [];
          const Ng = zg.filter(inside).length;
          const indF = windPoly(Fc, 0, 0), indG = windPoly(Gc, 0, 0);
          // (1/2πi)∫ f'/f dz with f'/f = Σ 1/(z − z_k)
          let ar = 0, ai = 0;
          for (let i = 0; i < N; i++) {
            const a = gam[i], b = gam[(i + 1) % N], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1];
            let qr = 0, qi = 0; for (const z of zf) { const ux = mx - z[0], uy = my - z[1], d = ux * ux + uy * uy; qr += ux / d; qi -= uy / d; }
            ar += qr * dx - qi * dy; ai += qr * dy + qi * dx;
          }
          const logInt = [ai / TAU, -ar / TAU];
          let worst = 0; for (let i = 0; i < N; i++) { const hv = hP(gam[i][0], gam[i][1]); worst = Math.max(worst, (l * Math.hypot(hv[0], hv[1])) / Math.hypot(Fc[i][0], Fc[i][1])); }
          const minF = Math.min(...Fc.map((p) => Math.hypot(p[0], p[1])));
          // left panel
          S.setTitle(isB ? 'zeros of $f$ (blue) and of $g=f+\\lambda h$ (gold); phase of $g$' : 'zeros of $f$ and the circle $\\gamma$; phase portrait of $f$');
          const B = v.rgb('panel');
          S.raster((x, y) => { const fv = fP(x, y); let re = fv[0], im = fv[1]; if (isB) { const hv = hP(x, y); re += l * hv[0]; im += l * hv[1]; } return phaseRGB(M, re, im, 0.42, B); }, { key: `${zf.flat().join(',')}|${isB ? l : 'f'}`, res: 3 });
          S.circle(cx, cy, r, { color: 'panel', width: 5 });
          S.circle(cx, cy, r, { color: 'ink', width: 2.2 });
          arrowsOn(S, gam, 'ink', [0.1, 0.43, 0.76], 10);
          zf.forEach((p) => { if (inside(p)) S.circle(p[0], p[1], 0.13, { color: 'accent', width: 2.4 }); });
          if (isB) { S.dots(zg, { color: 'panel', r: 6 }); S.dots(zg, { color: 'gold', r: 4.5 }); }
          // right panel
          const u = (time % 8) / 8, iu = Math.floor(u * N) % N;
          let ext = 0.8; for (const p of Fc.concat(isB ? Gc : [])) ext = Math.max(ext, Math.abs(p[0]), Math.abs(p[1]));
          ext = Math.min(ext * 1.12, 40);
          R.setView([-ext, ext], [-ext, ext]);
          R.setTitle(isB ? 'walker $f\\circ\\gamma$, dog $g\\circ\\gamma$, tree at $0$' : 'the image curve $\\Gamma=f\\circ\\gamma$ around $0$');
          R.hline(0, { color: 'faint', width: 1 }); R.vline(0, { color: 'faint', width: 1 });
          if (isB) for (let j = 0; j < 36; j++) { const i = Math.floor((j * N) / 36); R.line(Fc[i][0], Fc[i][1], Gc[i][0], Gc[i][1], { color: worst < 1 ? 'green' : 'red', width: 1, alpha: 0.4 }); }
          R.path(Fc, { color: 'accent', width: 2.4, close: true });
          arrowsOn(R, Fc, 'accent', [0.2, 0.45, 0.7, 0.95], 10);
          if (isB) R.path(Gc, { color: 'gold', width: 2.2, close: true });
          xMark(R, 0, 0, 'green', 6);
          const pf = Fc[iu];
          R.dot(pf[0], pf[1], { color: 'accent', r: 6, label: isB ? 'walker' : 'f(γ(t))', labelPos: 'ne', math: !isB });
          if (isB) { const pg = Gc[iu]; R.line(pf[0], pf[1], pg[0], pg[1], { color: worst < 1 ? 'green' : 'red', width: 2.6 }); R.dot(pg[0], pg[1], { color: 'gold', r: 5.5, label: 'dog', labelPos: 'sw', math: false }); }
          const gp = gam[iu]; S.dot(gp[0], gp[1], { color: 'accent', r: 5, label: 'γ(t)', labelPos: 'ne' });
          S.corner(isB ? `zeros inside γ: ${Nf} of f, ${Ng} of g` : `zeros of f inside γ: ${Nf}`, 'tl', { weight: 700, color: 'ink' });
          R.corner(isB ? `winds ${indF} and ${indG} times` : `winds ${indF} time${indF === 1 ? '' : 's'}`, 'tl', { weight: 700, color: 'ink' });
          if (isB) R.corner(worst < 1 ? 'leash shorter than distance to tree' : 'leash too long somewhere', 'bl', { color: worst < 1 ? 'green' : 'red', weight: 600 });
          v.legend(isB ? [['accent', '$f\\circ\\gamma$ (walker)'], ['gold', '$g\\circ\\gamma$ (dog)'], [worst < 1 ? 'green' : 'red', 'leash $g-f$']] : [['accent', '$f\\circ\\gamma$'], ['green', 'the origin', { dot: true }]]);
          state = { isB, Nf, Ng, indF, indG, logInt, worst, minF };
        }, { period: 8 });
        v.readout(() => {
          const s = state; if (!s) return '';
          if (s.minF < 1e-3) return 'A zero of $f$ lies on $\\gamma$: move it off the circle.';
          const a = `$N_f = ${s.Nf}$, $\\;\\frac{1}{2\\pi i}\\int_\\gamma\\frac{f'}{f} = ${cx2(v, s.logInt, 4)}$, $\\;\\operatorname{Ind}_{f\\circ\\gamma}(0) = ${s.indF}$.`;
          if (!s.isB) return a;
          return `$\\max_{\\gamma^*}\\frac{|g-f|}{|f|} = ${v.fix(s.worst, 3)}$ ${s.worst < 1 ? '$<1$' : '$\\ge1$'}: $\\;N_f = ${s.Nf}$, $N_g = ${s.Ng}$, $\\;\\operatorname{Ind}_{f\\circ\\gamma}(0) = ${s.indF}$, $\\operatorname{Ind}_{g\\circ\\gamma}(0) = ${s.indG}$` + (s.worst < 1 ? ' — Rouché guarantees $N_g = N_f$.' : ' — the hypothesis fails, so the counts may differ.');
        });
      },
    },
  ],
};
