// Rudin, Real and Complex Analysis — Chapter 13 (part 2): Runge's theorem

// ---------------------------------------------------------------- helpers shared by this file
// Least-squares approximation of target values on sample points by rational functions whose poles
// lie at prescribed points, computed stably by an Arnoldi-type orthogonalisation.
//   zs: [[x,y],...] samples; fr, fi: target values; blocks: [{a:[x,y], s} | {inf:true, c:[x,y], s}]
//   The variable of a block is u = s/(z−a) (pole at a) or u = (z−c)/s (pole at ∞); round k adds u^k for every block.
//   Returns {curve[k] = max residual on the samples after round k, at(x, y, k) = value of the round-k approximant}.
function ratFit(zs, fr, fi, blocks, Nmax, stopAt = 0) {
  const m = zs.length;
  const U = blocks.map((b) => {
    const ur = new Float64Array(m), ui = new Float64Array(m);
    for (let i = 0; i < m; i++) {
      const x = zs[i][0], y = zs[i][1];
      if (b.inf) { ur[i] = (x - b.c[0]) / b.s; ui[i] = (y - b.c[1]) / b.s; }
      else { const dx = x - b.a[0], dy = y - b.a[1], q = dx * dx + dy * dy; ur[i] = b.s * dx / q; ui[i] = -b.s * dy / q; }
    }
    return [ur, ui];
  });
  const Qr = [new Float64Array(m).fill(1 / Math.sqrt(m))], Qi = [new Float64Array(m)];
  const rec = [{ nrm: Math.sqrt(m) }], coef = [];
  const rr = Float64Array.from(fr), ri = Float64Array.from(fi);
  const proj = (j) => {
    const a = Qr[j], b = Qi[j]; let cr = 0, ci = 0;
    for (let i = 0; i < m; i++) { cr += a[i] * rr[i] + b[i] * ri[i]; ci += a[i] * ri[i] - b[i] * rr[i]; }
    for (let i = 0; i < m; i++) { rr[i] -= cr * a[i] - ci * b[i]; ri[i] -= cr * b[i] + ci * a[i]; }
    return [cr, ci];
  };
  const maxRes = () => { let e = 0; for (let i = 0; i < m; i++) e = Math.max(e, rr[i] * rr[i] + ri[i] * ri[i]); return Math.sqrt(e); };
  coef.push(proj(0));
  const curve = [maxRes()], cols = [1], last = blocks.map(() => 0);
  for (let k = 1; k <= Nmax; k++) {
    for (let b = 0; b < blocks.length; b++) {
      const p = last[b], [ur, ui] = U[b], pr = Qr[p], pi = Qi[p];
      const vr = new Float64Array(m), vi = new Float64Array(m);
      for (let i = 0; i < m; i++) { vr[i] = ur[i] * pr[i] - ui[i] * pi[i]; vi[i] = ur[i] * pi[i] + ui[i] * pr[i]; }
      const n = Qr.length, hr = new Float64Array(n), hi = new Float64Array(n);
      for (let pass = 0; pass < 2; pass++) for (let j = 0; j < n; j++) {
        const a = Qr[j], bb = Qi[j]; let cr = 0, ci = 0;
        for (let i = 0; i < m; i++) { cr += a[i] * vr[i] + bb[i] * vi[i]; ci += a[i] * vi[i] - bb[i] * vr[i]; }
        hr[j] += cr; hi[j] += ci;
        for (let i = 0; i < m; i++) { vr[i] -= cr * a[i] - ci * bb[i]; vi[i] -= cr * bb[i] + ci * a[i]; }
      }
      let nrm = 0; for (let i = 0; i < m; i++) nrm += vr[i] * vr[i] + vi[i] * vi[i]; nrm = Math.sqrt(nrm);
      if (!(nrm > 1e-10)) continue;
      for (let i = 0; i < m; i++) { vr[i] /= nrm; vi[i] /= nrm; }
      Qr.push(vr); Qi.push(vi); rec.push({ b, p, hr, hi, nrm }); last[b] = Qr.length - 1;
      coef.push(proj(Qr.length - 1));
    }
    curve.push(maxRes()); cols.push(Qr.length);
    if (stopAt && curve[k] < stopAt) break;
  }
  const qr = new Float64Array(Qr.length), qi = new Float64Array(Qr.length);
  const at = (x, y, k = cols.length - 1) => {
    const nc = cols[Math.max(0, Math.min(k, cols.length - 1))];
    qr[0] = 1 / rec[0].nrm; qi[0] = 0;
    let sr = coef[0][0] * qr[0], si = coef[0][1] * qr[0];
    const us = blocks.map((b) => { if (b.inf) return [(x - b.c[0]) / b.s, (y - b.c[1]) / b.s]; const dx = x - b.a[0], dy = y - b.a[1], q = dx * dx + dy * dy; return [b.s * dx / q, -b.s * dy / q]; });
    for (let c = 1; c < nc; c++) {
      const R = rec[c], ur = us[R.b][0], ui = us[R.b][1];
      let vr = ur * qr[R.p] - ui * qi[R.p], vi = ur * qi[R.p] + ui * qr[R.p];
      const hr = R.hr, hi = R.hi;
      for (let j = 0; j < c; j++) { vr -= hr[j] * qr[j] - hi[j] * qi[j]; vi -= hr[j] * qi[j] + hi[j] * qr[j]; }
      qr[c] = vr / R.nrm; qi[c] = vi / R.nrm;
      sr += coef[c][0] * qr[c] - coef[c][1] * qi[c]; si += coef[c][0] * qi[c] + coef[c][1] * qr[c];
    }
    return [sr, si];
  };
  // monomial coefficients (in u) of the round-k approximant — only for a single block
  const mono = (k) => {
    const nc = cols[Math.min(k, cols.length - 1)];
    const P = [[[1 / rec[0].nrm, 0]]];
    for (let c = 1; c < nc; c++) {
      const R = rec[c], v = [[0, 0], ...P[R.p].map(([a, b]) => [a, b])];
      for (let j = 0; j < c; j++) P[j].forEach(([a, b], t) => { v[t] ??= [0, 0]; v[t][0] -= R.hr[j] * a - R.hi[j] * b; v[t][1] -= R.hr[j] * b + R.hi[j] * a; });
      P.push(v.map(([a, b]) => [a / R.nrm, b / R.nrm]));
    }
    const out = Array.from({ length: nc }, () => [0, 0]);
    for (let c = 0; c < nc; c++) P[c].forEach(([a, b], t) => { out[t][0] += coef[c][0] * a - coef[c][1] * b; out[t][1] += coef[c][0] * b + coef[c][1] * a; });
    return out;
  };
  return { curve, cols, at, mono, rounds: cols.length - 1 };
}
// Phase-portrait colour (same scheme as Stage.domain); `fade` blends toward the RGB colour bg.
function phaseRGB(M, re, im, fade = 0, bg = null) {
  if (!isFinite(re) || !isFinite(im)) return bg ? [bg[0], bg[1], bg[2]] : [250, 250, 250];
  const t = M.fract(Math.log2(Math.hypot(re, im) + 1e-300));
  const c = M.hsl2rgb(Math.atan2(im, re) / M.TAU, 0.62, 0.42 + 0.2 * Math.pow(t, 0.7));
  if (!fade || !bg) return c;
  return [c[0] + (bg[0] - c[0]) * fade, c[1] + (bg[1] - c[1]) * fade, c[2] + (bg[2] - c[2]) * fade];
}
function xMark(S, x, y, color = 'ink', size = 5.5) {
  const d = size / S.scale;
  for (const [col, w] of [['panel', 5], [color, 2.2]]) {
    S.line(x - d, y - d, x + d, y + d, { color: col, width: w });
    S.line(x - d, y + d, x + d, y - d, { color: col, width: w });
  }
}
const SUP = (n) => (n < 0 ? '⁻' : '') + String(Math.abs(n)).split('').map((d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+d]).join('');
const logTicks = (lo, hi, step = 1) => { const t = []; for (let k = Math.ceil(lo); k <= hi; k++) if (k % step === 0) t.push([k, k === 0 ? '1' : `10${SUP(k)}`]); return t; };
const blend = (bg, c, a) => [bg[0] + (c[0] - bg[0]) * a, bg[1] + (c[1] - bg[1]) * a, bg[2] + (c[2] - bg[2]) * a];
// a small horizontal colour bar for log10-error rasters, drawn in pixel space at the bottom-left of S
function colorBar(S, cmapFn, lo, hi, label) {
  const X0 = 14, Y0 = S.height - 30, W = 130, H = 9, n = 40;
  for (let i = 0; i < n; i++) {
    const c = cmapFn(lo + (hi - lo) * (i + 0.5) / n);
    S.rect(S.invX(X0 + W * i / n), S.invY(Y0), S.invX(X0 + W * (i + 1) / n + 0.6), S.invY(Y0 + H), { fill: c, fillAlpha: 1, stroke: false });
  }
  S.textPx(`10${SUP(lo)}`, X0, Y0 + H + 9, { size: 10.5, color: 'muted', align: 'left' });
  S.textPx(hi === 0 ? '1' : `10${SUP(hi)}`, X0 + W, Y0 + H + 9, { size: 10.5, color: 'muted', align: 'right' });
  S.textPx(label, X0, Y0 - 9, { size: 11, color: 'muted', align: 'left' });
}

// TeX scientific notation that rounds the mantissa correctly (9.97e-4 → 1.0×10^{-3}).
const sciT = (x, d = 2) => { if (!isFinite(x)) return '\\infty'; if (x === 0) return '0'; const a = Math.abs(x); if (a >= 1e-3 && a < 1e5) return String(Number(x.toPrecision(d))); const [m, e] = x.toExponential(d - 1).split('e'); return `${m}\\times10^{${+e}}`; };

export default {
  collection: 'rca',
  chapter: 13,
  items: [
    {
      num: '13.6',
      kind: 'Theorem',
      name: "Runge's theorem",
      statement: String.raw`Let $K\subset\C$ be compact and let $A$ be a set containing at least one point of each component of $S^2\setminus K$ (the point $\infty$ is allowed). If $\Omega\supset K$ is open, $f\in H(\Omega)$ and $\eps>0$, then there is a rational function $R$, all of whose poles lie in $A$, such that
$$|f(z)-R(z)|<\eps\qquad\text{for every }z\in K.$$`,
      idea: String.raw`Let $X$ be the closure in $C(K)$ of the rational functions with poles in $A$. By the Hahn–Banach criterion (5.19) and the Riesz representation theorem (6.19) it suffices to show $\int_K f\,d\mu=0$ for every complex measure $\mu$ on $K$ that annihilates $X$. Put $h(z)=\int_K\frac{d\mu(\zeta)}{\zeta-z}$ for $z\notin K$. Near a point $\alpha\in A$, expanding $\frac1{\zeta-z}$ in powers of $\frac{1}{\zeta-\alpha}$ (or of $\zeta$ when $\alpha=\infty$) shows that all Taylor coefficients of $h$ are integrals of functions in $X$, so $h=0$ near $\alpha$; by the identity theorem $h=0$ on the whole component containing $\alpha$, hence on $S^2\setminus K$. Finally Cauchy's formula over the cycle of 13.5 and Fubini's theorem give $\int_K f\,d\mu=-\frac{1}{2\pi i}\int_\Gamma f(\zeta)h(\zeta)\,d\zeta=0$.`,
      caption: String.raw`$K$ is a blob with two holes, so $S^2\setminus K$ has three components $V_0\ni\infty$, $V_1$, $V_2$. The function $f$ has singularities ($\times$) in both holes and outside. Inside $K$ the colours show $\log_{10}|f-R|$ for the least-squares $R$ with $N$ terms per pole. Drag the poles $\alpha_1,\alpha_2$ anywhere in their holes: the error still goes to $0$, only the rate changes (fastest when a pole sits on the singularity it has to replace). Drag a pole into another component, or choose "no pole in $V_0$", and the error curve stalls above a floor that the readout certifies by Cauchy's theorem.`,
      deps: ['rca-13.5', 'rca-5.19', 'rca-6.19', 'rca-10.7', 'rca-10.18', 'rca-8.8'],
      see: ['pma-7.32', 'pma-7.26', 'rca-20.5', 'rca-13.2'],
      tags: ['Runge', 'rational approximation'],
      viz(v) {
        const M = v.M;
        const OUTB = M.blob(0.05, 0, 1.5, 3, 0.06, 220);
        const H1 = M.blob(-0.62, 0.22, 0.4, 5, 0.06, 120);
        const H2 = M.blob(0.6, -0.32, 0.34, 11, 0.06, 110);
        const HOLES = [H1, H2];
        const inP = (x, y, P) => M.pointInPoly([x, y], P);
        const compOf = (x, y) => (inP(x, y, H1) ? 1 : inP(x, y, H2) ? 2 : inP(x, y, OUTB) ? -1 : 0); // −1: in K
        const SING = [[-0.52, 0.16], [0.59, -0.3], [2.12, 1.32]];
        const fXY = (x, y) => { // 1/(z−s₁) + 0.35i/(z−s₂)² + 1.3/(z−s₃)
          let dx = x - SING[0][0], dy = y - SING[0][1], q = dx * dx + dy * dy; let re = dx / q, im = -dy / q;
          dx = x - SING[1][0]; dy = y - SING[1][1]; const sr = dx * dx - dy * dy, si = 2 * dx * dy; q = sr * sr + si * si;
          re += 0.35 * si / q; im += 0.35 * sr / q;
          dx = x - SING[2][0]; dy = y - SING[2][1]; q = dx * dx + dy * dy; re += 1.3 * dx / q; im -= 1.3 * dy / q;
          return [re, im];
        };
        const zs = [...OUTB, ...H1, ...H2];
        const fr = Float64Array.from(zs.map(([x, y]) => fXY(x, y)[0])), fi = Float64Array.from(zs.map(([x, y]) => fXY(x, y)[1]));
        const mids = []; for (const P of [OUTB, H1, H2]) P.forEach((p, i) => { const q = P[(i + 1) % P.length]; mids.push([(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]); });
        const perim = (P, w) => P.reduce((s, p, i) => { const q = P[(i + 1) % P.length]; return s + Math.hypot(q[0] - p[0], q[1] - p[1]) * w((p[0] + q[0]) / 2, (p[1] + q[1]) / 2); }, 0);
        // Cauchy-theorem floors: if V_j carries no pole, every admissible R has max_K|f−R| ≥ floor_j
        const FLOOR = [
          2 * Math.PI * 1.3 / Math.hypot(...SING[2]) ** 2 / perim(OUTB, (x, y) => 1 / (x * x + y * y)), // ∮_{∂V₀} (f−R)/z² dz
          2 * Math.PI / perim(H1, () => 1), // ∮_{∂V₁} (f−R) dz
          2 * Math.PI * 0.35 / perim(H2, (x, y) => Math.hypot(x - SING[1][0], y - SING[1][1])), // ∮_{∂V₂} (f−R)(z−s₂) dz
        ];
        const outer = v.select('pole for $V_0$', [{ value: 'inf', label: 'at $\\infty$ (polynomial part)' }, { value: 'beta', label: 'at a finite $\\beta$ (drag)' }, { value: 'none', label: 'none' }], 'inf');
        const Ns = v.slider('terms per pole $N$', 0, 20, 10, { int: true });
        const L = v.stage({ x: [-2.3, 2.3], y: [-1.75, 1.75], equal: true, height: 370, weight: 1.3, axes: false, title: '$\\log_{10}|f-R|$ on $K$; the components $V_0,V_1,V_2$ of $S^2\\setminus K$' });
        const R = v.stage({ x: [-0.6, 20.6], y: [-10, 1], height: 370, axes: 'box', title: '$\\max_K|f-R|$ against $N$ (log scale)' });
        const free = (h) => (x, y) => (compOf(x, y) === -1 ? [h.x, h.y] : [x, y]);
        let a1, a2, be;
        a1 = L.handle(-0.62, 0.22, { color: 'gold', label: 'α₁', labelPos: 'sw', constrain: free({ get x() { return a1.x; }, get y() { return a1.y; } }) });
        a2 = L.handle(0.66, -0.36, { color: 'gold', label: 'α₂', labelPos: 'se', constrain: free({ get x() { return a2.x; }, get y() { return a2.y; } }) });
        be = L.handle(1.92, 1.08, { color: 'gold', label: 'β', labelPos: 'sw', constrain: free({ get x() { return be.x; }, get y() { return be.y; } }) });
        const sMax = Math.max(...zs.map(([x, y]) => Math.hypot(x - 0.05, y)));
        let fit = null, fitKey = '', st = null;
        const TINT = ['gray', 'purple', 'teal'];
        v.render(() => {
          const mode = outer.value, N = Ns.value;
          be.visible = mode === 'beta';
          const poles = [a1, a2].concat(mode === 'beta' ? [be] : []);
          const blocks = poles.map((h) => ({ a: [h.x, h.y], s: Math.min(...zs.map(([x, y]) => Math.hypot(x - h.x, y - h.y))) }));
          if (mode === 'inf') blocks.push({ inf: true, c: [0.05, 0], s: sMax });
          const key = `${mode}|${poles.map((h) => `${h.x.toFixed(4)},${h.y.toFixed(4)}`).join('|')}`;
          if (key !== fitKey) { fit = ratFit(zs, fr, fi, blocks, 20); fitKey = key; }
          const has = [mode === 'inf', false, false];
          for (const h of poles) has[compOf(h.x, h.y)] = true;
          const ok = has.every(Boolean);
          const floor = Math.max(...has.map((b, j) => (b ? 0 : FLOOR[j])));
          // ---- left: error on K, tinted components outside
          const bg = v.rgb('panel'), tints = TINT.map((c) => v.rgb(c)), red = v.rgb('red');
          const cm = (t) => M.cmap(M.clamp((t + 8) / 8, 0, 1), 'viridis');
          L.raster((x, y) => {
            const c = compOf(x, y);
            if (c >= 0) return blend(bg, has[c] ? tints[c] : red, has[c] ? 0.14 : 0.2);
            const [a, b] = fit.at(x, y, N), [p, q] = fXY(x, y);
            return cm(Math.log10(Math.hypot(a - p, b - q) + 1e-300));
          }, { key: `${key}|${N}`, res: 3 });
          for (const P of [OUTB, H1, H2]) L.poly(P, { color: 'ink', width: 1.4 });
          SING.forEach(([x, y]) => xMark(L, x, y, 'ink', 5.5));
          L.text('V₀ ∋ ∞', 1.25, 1.45, { color: has[0] ? 'muted' : 'red', size: 13, weight: 600 });
          L.text('V₁', -0.62, 0.48, { color: has[1] ? 'purple' : 'red', size: 13, weight: 600, align: 'center' });
          L.text('V₂', 0.62, -0.05, { color: has[2] ? 'teal' : 'red', size: 13, weight: 600, align: 'center' });
          if (!ok) L.corner(`no pole in ${has.map((b, j) => (b ? null : `V${'₀₁₂'[j]}`)).filter(Boolean).join(', ')}`, 'tl', { color: 'red', weight: 600 });
          if (mode === 'inf') L.corner('pole at ∞: R contains a polynomial', 'tr', { color: 'muted' });
          colorBar(L, cm, -8, 0, '|f − R| on K');
          // ---- right: error against N
          const ys = fit.curve.map((e) => Math.log10(e + 1e-300));
          const lo = Math.min(-8, Math.floor(Math.min(...ys)) - 1);
          R.setView(null, [lo, 1.2]);
          R.setTicks([0, 4, 8, 12, 16, 20], logTicks(lo, 1, lo < -10 ? 2 : 1));
          if (floor > 0) { R.hband(lo - 1, Math.log10(floor), { color: 'red', alpha: 0.08 }); R.hline(Math.log10(floor), { color: 'red', dash: [6, 4], width: 1.5 }); R.text('certified floor', 20.2, Math.log10(floor), { color: 'red', size: 11.5, align: 'right', dy: 10 }); }
          R.vline(N, { color: 'muted', dash: [3, 3], width: 1 });
          const col = ok ? 'green' : 'red';
          R.path(ys.map((y, k) => [k, y]), { color: col, width: 2.4 });
          ys.forEach((y, k) => R.dot(k, y, { color: col, r: k === N ? 6 : 3.2 }));
          let dense = 0; for (const [x, y] of mids) { const [a, b] = fit.at(x, y, N), [p, q] = fXY(x, y); dense = Math.max(dense, Math.hypot(a - p, b - q)); }
          R.dot(N, Math.log10(dense + 1e-300), { color: 'ink', r: 7.5, hollow: true, width: 1.6 });
          st = { N, err: fit.curve[N], dense, ok, has, floor, mode, poles: poles.map((h) => compOf(h.x, h.y)) };
          v.legend([['gold', 'prescribed poles', { dot: true }], ['ink', 'singularities of $f$ ($\\times$)'], [col, 'error on the boundary samples'], ['ink', 'check on $2\\times$ denser samples', { dot: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const names = ['V_0', 'V_1', 'V_2'];
          const where = s.poles.map((c, i) => `${['\\alpha_1', '\\alpha_2', '\\beta'][i]}\\in ${names[c]}`).concat(s.mode === 'inf' ? ['\\infty\\in V_0'] : []).join(',\\ ');
          const e = `$\\max_K|f-R| = ${sciT(Math.max(s.err, s.dense), 2)}$ with $N=${s.N}$ (the maximum over $K$ is attained on $\\partial K$ by the maximum modulus theorem)`;
          if (s.ok) return `Poles: $${where}$ — every component of $S^2\\setminus K$ has one. ${e}; it tends to $0$ as $N$ grows.`;
          const miss = s.has.map((b, j) => (b ? null : `$${names[j]}$`)).filter(Boolean).join(' and ');
          return `Poles: $${where}$ — ${miss} has none. ${e}. Since $R$ is then holomorphic in ${miss}, Cauchy's theorem on its boundary forces $\\max_K|f-R|\\ge ${v.fmt(s.floor, 3)}$ for **every** such $R$: Runge's conclusion fails.`;
        });
      },
    },
    {
      num: '13.7',
      kind: 'Corollary',
      name: 'Polynomial approximation when $S^2\\setminus K$ is connected',
      verify: true,
      statement: String.raw`Let $K\subset\C$ be compact with $S^2\setminus K$ connected, and let $f$ be holomorphic in an open set containing $K$. Then there are polynomials $P_n$ with $P_n\to f$ uniformly on $K$.`,
      idea: String.raw`Here $S^2\setminus K$ has a single component, which contains $\infty$, so Runge's theorem (13.6) can be applied with $A=\{\infty\}$, and rational functions whose only pole is at $\infty$ are polynomials. Concretely, a singularity of $f$ that lies outside $K$ can be "pushed" along a path to $\infty$: if $|\beta-\beta'|<\dist(\beta',K)$, then $\frac{1}{z-\beta}=\sum_{n\ge0}\frac{(\beta-\beta')^n}{(z-\beta')^{n+1}}$ uniformly on $K$, and once $|\beta|>\max_K|z|$ the geometric series in $z/\beta$ finishes the job. If $S^2\setminus K$ is disconnected, the conclusion fails: for $\beta$ in a bounded component, $1/(z-\beta)$ is not a uniform limit of polynomials on $K$ (maximum modulus theorem).`,
      caption: String.raw`$K$ is a thick "C" (a ring with an opening of half-angle $\gamma$) around the pole $s$ of $f(z)=1/(z-s)$, so $S^2\setminus K$ is connected as long as $\gamma>0$. The orange discs form a chain along which the pole can be pushed out of the bay and off to $\infty$: each disc misses $K$ and contains the previous centre. Right: the least-squares polynomials $p_N$ on $K$. Narrow the opening and the chain needs more, smaller discs while the error decays more slowly; close it and $S^2\setminus K$ falls apart — the error is then stuck above $1/\rho$ (red). Left: phase portrait of $p_N$, full colour on $K$ and faded elsewhere: on $K$ it reproduces $f$, but inside the bay it has no pole at all.`,
      deps: ['rca-13.6'],
      see: ['pma-7.26', 'rca-20.5'],
      tags: ['Runge', 'polynomial approximation'],
      viz(v) {
        const M = v.M;
        const RHO = 1, W = 0.14, S0 = [0.25, 0];
        const gS = v.slider('opening half-angle $\\gamma$', 0, 110, 72, { step: 1, fmt: (x) => `${Math.round(x)}°` });
        const Ns = v.slider('degree $N$ of $p_N$', 0, 60, 30, { int: true });
        const showF = v.toggle('show $f$ instead of $p_N$', false);
        const L = v.stage({ x: [-1.45, 2.05], y: [-1.3, 1.3], equal: true, height: 360, weight: 1.2, axes: false, title: 'phase portrait of $p_N$ on $K$ (faded off $K$)' });
        const R = v.stage({ x: [-1, 61], y: [-10, 1], height: 360, axes: 'box', title: '$\\max_K|f-p_N|$ against the degree $N$ (log scale)' });
        // the caps of the C touch when ρ sin γ ≤ W: then K is the closed annulus ρ−W ≤ |z| ≤ ρ+W
        const geo = (deg) => { const g = deg * Math.PI / 180; return RHO * Math.sin(Math.min(g, Math.PI / 2)) <= W ? { g: 0, annulus: true } : { g, annulus: false }; };
        const distArc = (x, y, G) => {
          if (G.annulus) return Math.abs(Math.hypot(x, y) - RHO);
          const th = Math.abs(Math.atan2(y, x));
          if (th >= G.g) return Math.abs(Math.hypot(x, y) - RHO);
          return Math.min(Math.hypot(x - RHO * Math.cos(G.g), y - RHO * Math.sin(G.g)), Math.hypot(x - RHO * Math.cos(G.g), y + RHO * Math.sin(G.g)));
        };
        const boundary = (G, n = 520) => {
          if (G.annulus) return [...Array.from({ length: 300 }, (_, i) => [(RHO + W) * Math.cos(2 * Math.PI * (i + 0.5) / 300), (RHO + W) * Math.sin(2 * Math.PI * (i + 0.5) / 300)]), ...Array.from({ length: 220 }, (_, i) => [(RHO - W) * Math.cos(2 * Math.PI * (i + 0.5) / 220), (RHO - W) * Math.sin(2 * Math.PI * (i + 0.5) / 220)])];
          const g = G.g, L1 = (RHO + W) * (2 * Math.PI - 2 * g), L2 = (RHO - W) * (2 * Math.PI - 2 * g), L3 = Math.PI * W, tot = L1 + L2 + 2 * L3;
          const pts = [];
          for (let i = 0; i < n; i++) {
            let s = (i + 0.5) / n * tot;
            if (s < L1) { const t = g + s / (RHO + W); pts.push([(RHO + W) * Math.cos(t), (RHO + W) * Math.sin(t)]); continue; } s -= L1;
            if (s < L3) { const c = [RHO * Math.cos(-g), RHO * Math.sin(-g)], t = -g + s / W; pts.push([c[0] + W * Math.cos(t), c[1] + W * Math.sin(t)]); continue; } s -= L3;
            if (s < L2) { const t = -g - s / (RHO - W); pts.push([(RHO - W) * Math.cos(t), (RHO - W) * Math.sin(t)]); continue; } s -= L2;
            const c = [RHO * Math.cos(g), RHO * Math.sin(g)], t = g + Math.PI + s / W; pts.push([c[0] + W * Math.cos(t), c[1] + W * Math.sin(t)]);
          }
          return pts;
        };
        const fXY = (x, y) => { const dx = x - S0[0], dy = y - S0[1], q = dx * dx + dy * dy; return [dx / q, -dy / q]; };
        const doFit = (G) => {
          const zs = boundary(G);
          const fr = Float64Array.from(zs.map(([x, y]) => fXY(x, y)[0])), fi = Float64Array.from(zs.map(([x, y]) => fXY(x, y)[1]));
          const F = ratFit(zs, fr, fi, [{ inf: true, c: [0, 0], s: RHO + W }], 60);
          const dz = boundary(G, 1300);
          F.dense = (k) => { let e = 0; for (const [x, y] of dz) { const [a, b] = F.at(x, y, k), [p, q] = fXY(x, y); e = Math.max(e, Math.hypot(a - p, b - q)); } return e; };
          return F;
        };
        const ref = doFit(geo(0));
        let fit = null, fitD = null, st = null;
        v.render(() => {
          const deg = gS.value, N = Ns.value, G = geo(deg);
          const d = G.annulus ? 0 : 2 * RHO * Math.sin(Math.min(G.g, Math.PI / 2)) - 2 * W;
          const fk = G.annulus ? 'ann' : deg;
          if (fitD !== fk) { fit = G.annulus ? ref : doFit(G); fitD = fk; }
          const inK = (x, y) => distArc(x, y, G) <= W;
          // chain of discs pushing the pole s out through the channel along the real axis
          const chain = []; let bx = S0[0], blocked = false;
          const dK = (x) => Math.max(0, distArc(x, 0, G) - W);
          for (let i = 0; i < 400; i++) {
            const r = dK(bx); chain.push([bx, r]);
            if (Math.abs(bx) > RHO + W + 0.04 && bx > 0) break;
            if (r < 2e-3) { blocked = true; break; }
            bx += 0.45 * r;
          }
          // picture of p_N (monomial coefficients in u = z/(ρ+w), evaluated by Horner)
          const co = fit.mono(N), sc = RHO + W, bg = v.rgb('panel');
          const horner = (x, y) => { const ux = x / sc, uy = y / sc; let sr = 0, si = 0; for (let k = co.length - 1; k >= 0; k--) { const t = sr * ux - si * uy + co[k][0]; si = sr * uy + si * ux + co[k][1]; sr = t; } return [sr, si]; };
          // use the fast monomial form only if it agrees with the stable Arnoldi evaluation
          let dev = 0; for (const [x, y] of [[0, 0], [1.2, 0.3], [-1.1, -0.4], [0.2, -1.2], [1.8, 0.9], [-1.6, 1.2]]) { const [a, b] = horner(x, y), [c, e] = fit.at(x, y, N); dev = Math.max(dev, Math.hypot(a - c, b - e) / (1 + Math.hypot(c, e))); }
          const pN = dev < 1e-7 ? horner : (x, y) => fit.at(x, y, N);
          L.raster((x, y) => { const [a, b] = showF.value ? fXY(x, y) : pN(x, y); return phaseRGB(M, a, b, inK(x, y) ? 0 : 0.78, bg); }, { key: `${fk}|${N}|${showF.value}`, res: 2 });
          const bd = boundary(G, 600);
          L.poly(bd.slice(0, G.annulus ? 300 : 600), { color: 'ink', width: 1.4, close: !G.annulus });
          if (G.annulus) L.poly(bd.slice(300), { color: 'ink', width: 1.4 });
          // chain
          const show = chain.length > 60 ? chain.filter((_, i) => i % Math.ceil(chain.length / 60) === 0 || i === chain.length - 1) : chain;
          for (const [x, r] of show) if (r > 0) L.circle(x, 0, r, { color: 'orange', width: 1.3, alpha: 0.85 });
          L.path(chain.map(([x]) => [x, 0]), { color: 'orange', width: 2 });
          for (const [x] of show) L.dot(x, 0, { color: 'orange', r: 2.4 });
          if (!blocked) {
            const xe = chain[chain.length - 1][0];
            L.arrow(xe, 0, 2.0, 0, { color: 'orange', width: 2, head: 10 });
            L.text('to ∞', 1.98, 0, { color: 'orange', size: 12, weight: 600, align: 'right', dy: -12 });
            L.circle(0, 0, RHO + W, { color: 'orange', dash: [4, 4], width: 1, alpha: 0.7 });
          } else L.text('blocked', chain[chain.length - 1][0], 0, { color: 'red', size: 12, weight: 600, dy: -14, align: 'center' });
          xMark(L, S0[0], S0[1], 'ink', 6);
          L.text('s', S0[0], S0[1], { color: 'ink', math: true, dx: -12, dy: -10 });
          L.tex('K', -0.86, 0.86, { color: 'ink', size: 17 });
          // right: error curves
          const ys = fit.curve.map((e) => Math.log10(e + 1e-300)), yr = ref.curve.map((e) => Math.log10(e + 1e-300));
          const lo = Math.min(-3, Math.floor(Math.min(...ys)) - 0.5);
          R.setView(null, [lo, 1]);
          R.setTicks([0, 10, 20, 30, 40, 50, 60], logTicks(lo, 1, lo < -9 ? 2 : 1));
          R.hline(Math.log10(1 / RHO), { color: 'red', width: 1, dash: [2, 3] });
          R.path(yr.map((y, k) => [k, y]), { color: 'red', width: 2, dash: [6, 4] });
          R.text('opening closed: stuck above 1/ρ', 59, Math.log10(1 / RHO) + 0.3, { color: 'red', size: 11.5, align: 'right', baseline: 'bottom' });
          if (!G.annulus) R.path(ys.map((y, k) => [k, y]), { color: 'green', width: 2.4 });
          R.vline(N, { color: 'muted', dash: [3, 3], width: 1 });
          const dn = fit.dense(N);
          R.dot(N, Math.log10(dn + 1e-300), { color: G.annulus ? 'red' : 'green', r: 6 });
          st = { d, deg, N, dn, links: chain.length, blocked };
          v.legend([['ink', 'boundary of $K$'], ['orange', 'chain of discs missing $K$ (pole pushing)'], ['green', 'least-squares $p_N$ for this $K$'], ['red', 'closed ring (annulus)', { dash: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          if (s.blocked) return `The opening is closed: $K$ is the annulus $\\rho-w\\le|z|\\le\\rho+w$ and $s$ lies in a bounded component of $S^2\\setminus K$. For every polynomial $p$, $\\int_{|z|=\\rho}(f-p)\\,dz = 2\\pi i$, so $\\max_K|f-p|\\ge 1/\\rho = ${v.fix(1 / RHO, 2)}$; here $\\max_K|f-p_{${s.N}}| = ${v.fmt(s.dn, 3)}$.`;
          return `Opening $2\\gamma = ${Math.round(2 * s.deg)}°$, channel width $d = ${v.fix(s.d, 2)}$: the pole is pushed out of the bay through ${s.links} disc${s.links > 1 ? 's' : ''} and then to $\\infty$. $\\max_K|f-p_{${s.N}}| = ${sciT(s.dn, 2)}$ (measured on ${1300} boundary points; by the maximum modulus theorem this is the maximum over all of $K$).`;
        });
      },
    },
    {
      num: '13.9',
      kind: 'Theorem',
      name: 'Runge’s theorem for open sets',
      verify: true,
      statement: String.raw`Let $\Omega\subset\C$ be open, let $A$ be a set with at least one point in each component of $S^2\setminus\Omega$, and let $f\in H(\Omega)$. Then there are rational functions $R_n$, with all poles in $A$, such that $R_n\to f$ uniformly on every compact subset of $\Omega$.

In particular, if $S^2\setminus\Omega$ is connected one may take $A=\{\infty\}$: then $f$ is the limit of polynomials, uniformly on compact subsets of $\Omega$.`,
      idea: String.raw`Exhaust $\Omega$ by the compact sets $K_n$ of 13.3. Each component of $S^2\setminus K_n$ contains a component of $S^2\setminus\Omega$ (property (c)), hence a point of $A$, so Runge's theorem (13.6) gives $R_n$ with poles in $A$ and $|f-R_n|<1/n$ on $K_n$. Any compact $K\subset\Omega$ lies in $K_m$ for some $m$ (property (b)), and then $|f-R_n|<1/n$ on $K$ for all $n\ge m$. The convergence is usually not uniform on all of $\Omega$.`,
      caption: String.raw`$\Omega$ is the disc $|z|<2$ minus two closed discs, so $S^2\setminus\Omega$ has three components and $A=\{\alpha_1,\alpha_2,\alpha_3\}$. $f$ has a pole $b_1$ **on** the boundary of $\Omega$, so it is unbounded in $\Omega$. Move $n$: the blue curve is $\partial K_n$, and the colours show where $|f-R_n|<1/n$ (blue–green) and where not (orange–red). Right: the error of $R_n$ on three fixed compact sets $K_3,K_5,K_8$ — each curve goes to $0$ once $n$ passes its index, while $\sup_\Omega|f-R_n|=\infty$ for every $n$. Omit $\alpha_2$ and nothing converges near the second hole.`,
      deps: ['rca-13.3', 'rca-13.6'],
      see: ['rca-13.11'],
      tags: ['Runge', 'uniform convergence on compacta'],
      viz(v) {
        const M = v.M;
        const C1 = [-0.85, 0.35], R1 = 0.42, C2 = [0.8, -0.45], R2 = 0.36, RO = 2;
        const B1 = [C1[0] + R1 * Math.cos(-0.55), C1[1] + R1 * Math.sin(-0.55)], B2 = [C2[0] + 0.5 * R2 * Math.cos(2.2), C2[1] + 0.5 * R2 * Math.sin(2.2)], B3 = [2.24 * Math.cos(0.75), 2.24 * Math.sin(0.75)];
        const fXY = (x, y) => { // 1/(z−b₁) + 0.5i/(z−b₂)² + 0.7/(z−b₃)
          let dx = x - B1[0], dy = y - B1[1], q = dx * dx + dy * dy; let re = dx / q, im = -dy / q;
          dx = x - B2[0]; dy = y - B2[1]; const sr = dx * dx - dy * dy, si = 2 * dx * dy; q = sr * sr + si * si;
          re += 0.5 * si / q; im += 0.5 * sr / q;
          dx = x - B3[0]; dy = y - B3[1]; q = dx * dx + dy * dy; re += 0.7 * dx / q; im -= 0.7 * dy / q;
          return [re, im];
        };
        const dOut = (x, y) => Math.min(RO - Math.hypot(x, y), Math.hypot(x - C1[0], y - C1[1]) - R1, Math.hypot(x - C2[0], y - C2[1]) - R2);
        const inKn = (x, y, n) => Math.hypot(x, y) <= n && dOut(x, y) >= 1 / n;
        const bdry = (n, per = 1) => { // ∂K_n: the parts of three circles that lie in K_n
          const out = [];
          for (const [c, r, cnt] of [[[0, 0], RO - 1 / n, 200], [C1, R1 + 1 / n, 110], [C2, R2 + 1 / n, 100]]) {
            const k = Math.round(cnt * per);
            for (let i = 0; i < k; i++) { const t = 2 * Math.PI * (i + 0.5) / k, x = c[0] + r * Math.cos(t), y = c[1] + r * Math.sin(t); if (dOut(x, y) >= 1 / n - 1e-9) out.push([x, y]); }
          }
          return out;
        };
        const outer = v.select('point of $A$ in the outer component', [{ value: 'fin', label: '$\\alpha_3=2.6e^{0.75i}$' }, { value: 'inf', label: '$\\alpha_3=\\infty$' }], 'fin');
        const omit = v.toggle('omit $\\alpha_2$', false);
        const nS = v.slider('$n$', 2, 10, 5, { int: true });
        const L = v.stage({ x: [-2.25, 2.25], y: [-2.1, 2.1], equal: true, height: 380, weight: 1.15, axes: false, title: '$|f-R_n|$ on $\\Omega$, compared with $1/n$' });
        const Rt = v.stage({ x: [1.5, 10.5], y: [-6, 1.6], height: 380, axes: 'box', xlabel: 'n', title: '$\\max_{K_m}|f-R_n|$ for the fixed sets $K_3,K_5,K_8$ (log scale)' });
        const A3 = [2.6 * Math.cos(0.75), 2.6 * Math.sin(0.75)];
        const cache = new Map();
        const build = (key) => {
          if (cache.has(key)) return cache.get(key);
          const [mode, om] = key.split('|');
          const fits = {};
          for (let n = 2; n <= 10; n++) {
            const zs = bdry(n), fr = Float64Array.from(zs.map(([x, y]) => fXY(x, y)[0])), fi = Float64Array.from(zs.map(([x, y]) => fXY(x, y)[1]));
            const blocks = [{ a: C1, s: R1 + 1 / n }];
            if (om !== '1') blocks.push({ a: C2, s: R2 + 1 / n });
            blocks.push(mode === 'inf' ? { inf: true, c: [0, 0], s: RO - 1 / n } : { a: A3, s: 2.6 - (RO - 1 / n) });
            const F = ratFit(zs, fr, fi, blocks, 26, 0.5 / n);
            const dz = bdry(n, 2.3);
            let k = F.rounds, err = Infinity;
            for (let kk = 0; kk <= F.rounds; kk++) { if (F.curve[kk] >= 1 / n) continue; let e = 0; for (const [x, y] of dz) { const [a, b] = F.at(x, y, kk), [p, q] = fXY(x, y); e = Math.max(e, Math.hypot(a - p, b - q)); } if (e < 1 / n) { k = kk; err = e; break; } }
            if (!isFinite(err)) { k = F.rounds; err = 0; for (const [x, y] of dz) { const [a, b] = F.at(x, y, k), [p, q] = fXY(x, y); err = Math.max(err, Math.hypot(a - p, b - q)); } }
            fits[n] = { F, k, err };
          }
          // error of each R_n on the fixed compacts K_3, K_5, K_8 (max over ∂K_m)
          const rows = {};
          for (const m of [3, 5, 8]) {
            const pts = bdry(m, 0.7);
            rows[m] = [];
            for (let n = 2; n <= 10; n++) { const { F, k } = fits[n]; let e = 0; for (const [x, y] of pts) { const [a, b] = F.at(x, y, k), [p, q] = fXY(x, y); e = Math.max(e, Math.hypot(a - p, b - q)); } rows[m].push([n, e]); }
          }
          const out = { fits, rows }; cache.set(key, out); return out;
        };
        let st = null;
        v.render(() => {
          const n = nS.value, key = `${outer.value}|${omit.value ? 1 : 0}`;
          const D = build(key), { F, k, err } = D.fits[n];
          const bg = v.rgb('panel'), gray = v.rgb('gray');
          const good = (t) => M.cmap(0.15 + 0.55 * M.clamp((t + 7) / 7, 0, 1), 'viridis'), bad = (t) => M.cmap(0.45 + 0.5 * M.clamp(t / 3, 0, 1), 'magma');
          const thr = Math.log10(1 / n);
          L.raster((x, y) => {
            const r = Math.hypot(x, y);
            if (r >= RO) return r < RO + 0.02 ? null : blend(bg, gray, 0.22);
            if (dOut(x, y) <= 0) return blend(bg, gray, 0.5);
            const [a, b] = F.at(x, y, k), [p, q] = fXY(x, y), e = Math.log10(Math.hypot(a - p, b - q) + 1e-300);
            return e < thr ? good(e - thr) : bad(e - thr);
          }, { key: `${key}|${n}`, res: 3 });
          L.circle(0, 0, RO, { color: 'ink', width: 1.4 });
          L.circle(C1[0], C1[1], R1, { color: 'ink', width: 1.4 });
          L.circle(C2[0], C2[1], R2, { color: 'ink', width: 1.4 });
          // ∂K_n
          L.circle(0, 0, RO - 1 / n, { color: 'accent', width: 2.2 });
          L.circle(C1[0], C1[1], R1 + 1 / n, { color: 'accent', width: 2.2 });
          L.circle(C2[0], C2[1], R2 + 1 / n, { color: 'accent', width: 2.2 });
          xMark(L, B1[0], B1[1], 'ink', 6); xMark(L, B2[0], B2[1], 'ink', 5); xMark(L, B3[0], B3[1], 'ink', 6);
          L.text('b₁', B1[0], B1[1], { color: 'ink', math: true, dx: 9, dy: 10 });
          L.dot(C1[0], C1[1], { color: 'gold', r: 5, label: 'α₁', labelPos: 'n' });
          if (!omit.value) L.dot(C2[0], C2[1], { color: 'gold', r: 5, label: 'α₂', labelPos: 's' });
          else L.text('no point of A here', C2[0], C2[1], { color: 'red', size: 11.5, weight: 600, align: 'center' });
          if (outer.value === 'fin') L.dot(A3[0], A3[1], { color: 'gold', r: 5, label: 'α₃', labelPos: 'w' });
          else L.text('α₃ = ∞', 1.55, -1.95, { color: 'gold', math: true, size: 15 });
          L.tex(`K_{${n}}`, -0.1, 1.15, { color: 'accent', size: 16 });
          // right panel
          Rt.setTicks([2, 3, 4, 5, 6, 7, 8, 9, 10], logTicks(-6, 1));
          Rt.vline(n, { color: 'muted', dash: [3, 3], width: 1 });
          Rt.path(Array.from({ length: 41 }, (_, i) => { const t = 2 + 8 * i / 40; return [t, Math.log10(1 / t)]; }), { color: 'accent', width: 1.5, dash: [5, 4] });
          Rt.text('1/n', 10.4, Math.log10(1 / 10.4), { color: 'accent', size: 12, align: 'right', dy: -11 });
          const COL = { 3: 'purple', 5: 'orange', 8: 'teal' };
          for (const m of [3, 5, 8]) {
            const pts = D.rows[m].map(([t, e]) => [t, M.clamp(Math.log10(e + 1e-300), -6, 1.55)]);
            Rt.path(pts, { color: COL[m], width: 2.2 });
            pts.forEach(([t, y]) => Rt.dot(t, y, { color: COL[m], r: t === n ? 5.5 : 3 }));
            Rt.vline(m, { color: COL[m], width: 1, alpha: 0.35 });
          }
          Rt.arrow(6, 1.05, 6, 1.5, { color: 'red', head: 8, width: 2 });
          Rt.text('sup over Ω = ∞ for every n', 6.2, 1.3, { color: 'red', size: 11.5, weight: 600 });
          st = { n, k, err, rows: D.rows, omit: omit.value, mode: outer.value };
          v.legend([['accent', '$\\partial K_n$'], ['gold', 'the set $A$', { dot: true }], ['purple', 'on $K_3$'], ['orange', 'on $K_5$'], ['teal', 'on $K_8$'], ['accent', '$1/n$', { dash: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const e3 = s.rows[3][s.n - 2][1];
          const head = `$R_{${s.n}}$ uses ${s.k} term${s.k === 1 ? '' : 's'} per point of $A$ (fitted on $\\partial K_{${s.n}}$, checked on a denser sample): $\\max_{K_{${s.n}}}|f-R_{${s.n}}| = ${sciT(s.err, 2)}$ ${s.err < 1 / s.n ? '$<$' : '$\\ge$'} $1/${s.n}$.`;
          if (s.omit) return head + ' With no point of $A$ in the second hole, $R_n$ is holomorphic there and cannot reproduce the double pole $b_2$: the error near that hole does not decrease.';
          return head + ` On the fixed compact set $K_3$ the error is $${sciT(e3, 2)}$ — it tends to $0$ — but $f$ is unbounded near $b_1\\in\\partial\\Omega$ while each $R_n$ is bounded there, so $\\sup_\\Omega|f-R_n|=\\infty$.`;
        });
      },
    },
  ],
};
