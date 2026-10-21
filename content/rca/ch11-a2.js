// Rudin, Real and Complex Analysis — Chapter 11 (part 2): consequences of the Poisson formula,
// Harnack's theorem, the mean value property and the Schwarz reflection principle.

// ---------------------------------------------------------------- helpers shared by this file
const TAU = 2 * Math.PI;
/** P(z, e^{it}) = (1 − |z|²)/|e^{it} − z|² at z = x + iy. */
const Pz = (x, y, t) => { const dx = Math.cos(t) - x, dy = Math.sin(t) - y; return (1 - x * x - y * y) / (dx * dx + dy * dy); };
/** Evaluate Σ c_n w^n (parallel re/im arrays) at w = x + iy by Horner's rule → [re, im]. */
function hornerXY(cr, ci, x, y) {
  let sr = 0, si = 0;
  for (let n = cr.length - 1; n >= 0; n--) { const t = sr * x - si * y + cr[n]; si = sr * y + si * x + ci[n]; sr = t; }
  return [sr, si];
}
/** Herglotz coefficients of a real 2π-periodic g: H(ζ) = Σ c_n ζⁿ is holomorphic in U with Re H = P[g], Im H(0) = 0. */
function herglotz(g, N = 48, M = 512) {
  const cr = new Float64Array(N + 1), ci = new Float64Array(N + 1);
  const vals = Array.from({ length: M }, (_, j) => g(-Math.PI + (TAU * j) / M));
  for (let n = 0; n <= N; n++) {
    let re = 0, im = 0;
    for (let j = 0; j < M; j++) { const t = -Math.PI + (TAU * j) / M; re += vals[j] * Math.cos(n * t); im -= vals[j] * Math.sin(n * t); }
    const k = n ? 2 / M : 1 / M; cr[n] = re * k; ci[n] = im * k;
  }
  return { cr, ci };
}
/** Mean of g(x, y) over the circle |w − (cx, cy)| = ρ (trapezoid rule, n points). */
function circleMean(g, cx, cy, rho, n = 256) {
  let s = 0;
  for (let k = 0; k < n; k++) { const t = (TAU * (k + 0.5)) / n; s += g(cx + rho * Math.cos(t), cy + rho * Math.sin(t)); }
  return s / n;
}
/** A cached colour-mapped scalar field with iso-lines on stage S; call the returned function inside render. */
function fieldLayer(v, S) {
  let cache = null;
  return (fn, { key, res = 2, range = [-1, 1], cmap = 'diverging', step = 0, offset = 0, lines = 0.35, alpha = 1 }) => {
    const W = Math.ceil(S.width / res), H = Math.ceil(S.height / res), ink = v.rgb('ink');
    const k = `${W}x${H}|${S.bounds.x}|${S.bounds.y}|${key}|${range}|${step}|${offset}|${cmap}|${ink}`;
    if (!cache || cache.k !== k) {
      const val = new Float64Array(W * H);
      for (let j = 0; j < H; j++) { const y = S.invY((j + 0.5) * res); for (let i = 0; i < W; i++) val[j * W + i] = fn(S.invX((i + 0.5) * res), y); }
      const cols = new Array(W * H);
      for (let p = 0; p < W * H; p++) {
        const z = val[p]; if (!isFinite(z)) { cols[p] = null; continue; }
        let c = v.M.cmap((z - range[0]) / (range[1] - range[0]), cmap);
        if (step && z >= range[0] && z <= range[1]) {
          const lv = (q) => Math.floor((q - offset) / step), L = lv(z), i = p % W, q1 = i + 1 < W ? val[p + 1] : NaN, q2 = p + W < W * H ? val[p + W] : NaN;
          if ((isFinite(q1) && lv(q1) !== L) || (isFinite(q2) && lv(q2) !== L)) c = c.map((x, m) => x + (ink[m] - x) * lines);
        }
        cols[p] = c;
      }
      cache = { k, cols };
    }
    let n = 0; const cols = cache.cols;
    S.raster(() => cols[n++], { key: cache.k, res, alpha, id: 'field' });
  };
}
/** Pixel mask of the iso-lines of a function (cached), drawn in a palette colour. */
function isoLayer(v, S, id) {
  let cache = null;
  return (fn, { key, step, color = 'purple', alpha = 210, res = 2, jump = 1 }) => {
    const W = Math.ceil(S.width / res), H = Math.ceil(S.height / res), c = v.rgb(color);
    const k = `${W}x${H}|${S.bounds.x}|${S.bounds.y}|${key}|${step}|${c}`;
    if (!cache || cache.k !== k) {
      const V = new Float64Array(W * H);
      for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) V[j * W + i] = fn(S.invX((i + 0.5) * res), S.invY((j + 0.5) * res));
      cache = { k, cols: Array.from(V, (a, q) => {
        if (!isFinite(a)) return null; const i = q % W, l = Math.floor(a / step), b = i + 1 < W ? V[q + 1] : NaN, d = q + W < W * H ? V[q + W] : NaN;
        return (isFinite(b) && Math.floor(b / step) !== l && Math.abs(b - a) < jump) || (isFinite(d) && Math.floor(d / step) !== l && Math.abs(d - a) < jump) ? [c[0], c[1], c[2], alpha] : null;
      }) };
    }
    let n = 0; S.raster(() => cache.cols[n++], { key: cache.k, res, id });
  };
}
/** Phase-portrait colour of w = re + i im (hue = arg, bands = log₂|w|); `fade` blends toward bg. */
function phaseRGB(M, re, im, fade = 0, bg = null) {
  if (!isFinite(re) || !isFinite(im)) return bg ? [bg[0], bg[1], bg[2]] : [250, 250, 250];
  const t = M.fract(Math.log2(Math.hypot(re, im) + 1e-300));
  const c = M.hsl2rgb(Math.atan2(im, re) / TAU, 0.62, 0.42 + 0.2 * Math.pow(t, 0.7));
  if (!fade || !bg) return c;
  return [c[0] + (bg[0] - c[0]) * fade, c[1] + (bg[1] - c[1]) * fade, c[2] + (bg[2] - c[2]) * fade];
}
const cxTeX = (v, p, d = 3) => `${v.fix(p[0], d)} ${p[1] < 0 ? '-' : '+'} ${v.fix(Math.abs(p[1]), d)}\\,i`;
const PI_TICKS = [[-Math.PI, '−π'], [-Math.PI / 2, '−π/2'], [0, '0'], [Math.PI / 2, 'π/2'], [Math.PI, 'π']];

export default {
  collection: 'rca',
  chapter: 11,
  items: [
    {
      num: '11.10',
      kind: 'Theorem',
      name: 'Harmonic functions are locally real parts of holomorphic ones',
      verify: true,
      statement: String.raw`Let $u$ be a real harmonic function in an open set $\Omega\subset\C$, and let $\bar D(a;R)\subset\Omega$. Then
(a) in $D(a;R)$, $u$ is the Poisson integral of its values on the circle $|z-a|=R$ (the formula of 11.9);
(b) $u$ is the real part of a function holomorphic in $D(a;R)$; hence every real harmonic function is locally the real part of a holomorphic function, and $u\in C^\infty(\Omega)$;
(c) $u$ has the mean value property: $u(a)=\frac{1}{2\pi}\int_{-\pi}^{\pi}u(a+re^{i\theta})\,d\theta$ for $0\le r\le R$.`,
      idea: String.raw`$u$ is continuous on $\bar D(a;R)$ and harmonic inside, so 11.9 (moved to the disc $D(a;R)$) represents it by the Poisson integral there, and the Herglotz integral of its boundary values is a holomorphic $f$ with $\operatorname{Re}f=u$. Real parts of holomorphic functions are $C^\infty$, and every point of $\Omega$ has such a disc around it. Taking $z=a$ in the Poisson formula, where the kernel is identically $1$, gives the mean value property. The conjugate $\operatorname{Im}f$ is only local: around a logarithmic singularity it changes by $2\pi$ times the charge.`,
      caption: String.raw`Here $u=\log|z-p_1|-0.7\log|z-p_2|$ is harmonic in $\Omega=\C\setminus\{p_1,p_2\}$. Drag the disc (centre $a$, rim handle). Inside it, the Herglotz integral of $u$ on the circle builds $f$ with $\operatorname{Re}f=u$; its imaginary part draws the purple conjugate lines. Right: the circle means $M(\rho)$ of $u$ about $a$ are constant, equal to $u(a)$, exactly as long as $\bar D(a;\rho)$ misses the singularities. Enclose a $p_k$ and the reconstruction from the circle no longer equals $u$.`,
      deps: ['rca-11.9', 'rca-11.5', 'rca-11.3'],
      tags: ['harmonic', 'mean value property', 'harmonic conjugate'],
      viz(v) {
        const P = [[0.95, 0.3, 1], [-0.85, -0.55, -0.7]];
        const U = (x, y) => P.reduce((s, [px, py, c]) => s + 0.5 * c * Math.log((x - px) ** 2 + (y - py) ** 2), 0);
        const L = v.stage({ x: [-2, 2], y: [-1.45, 1.45], equal: true, height: 350, axes: false, weight: 1.25, title: '$u$ on $\\Omega$; inside the disc, conjugate lines of $f$ with $\\operatorname{Re} f=u$' });
        const R = v.stage({ x: [0, 1.6], y: [-1, 1], height: 350, axes: 'box', xlabel: 'ρ', title: 'circle means $M(\\rho)=\\frac{1}{2\\pi}\\int u(a+\\rho e^{i\\theta})\\,d\\theta$' });
        const a = L.handle(-0.15, 0.6, { color: 'ink', label: 'a', labelPos: 'sw' });
        const rim = L.handle(-0.15 + 0.62, 0.6, { color: 'gold', r: 6 });
        let prev = [a.x, a.y];
        a.onDrag = () => { rim.x += a.x - prev[0]; rim.y += a.y - prev[1]; prev = [a.x, a.y]; };
        const heat = fieldLayer(v, L), iso = isoLayer(v, L, 'conj');
        let st = null;
        v.render(() => {
          prev = [a.x, a.y];
          const Rr = Math.max(0.12, Math.hypot(rim.x - a.x, rim.y - a.y));
          heat(U, { key: 'u', range: [-2.2, 2.2], step: 0.25 });
          // Herglotz reconstruction on D(a;R)
          const H = herglotz((t) => U(a.x + Rr * Math.cos(t), a.y + Rr * Math.sin(t)), 64, 512);
          const f = (x, y) => { const zx = (x - a.x) / Rr, zy = (y - a.y) / Rr; return zx * zx + zy * zy < 1 ? hornerXY(H.cr, H.ci, zx, zy) : null; };
          iso((x, y) => { const w = f(x, y); return w ? w[1] : NaN; }, { key: `${a.x},${a.y},${Rr}`, step: 0.3, jump: 2 });
          const dists = P.map(([px, py]) => Math.hypot(px - a.x, py - a.y)), dmin = Math.min(...dists);
          const ok = dmin > Rr;
          L.circle(a.x, a.y, Rr, { color: 'panel', width: 5 });
          L.circle(a.x, a.y, Rr, { color: ok ? 'green' : 'red', width: 2.4 });
          P.forEach(([px, py, c], j) => { L.dot(px, py, { color: 'ink', r: 4.5 }); L.tex(`p_${j + 1}`, px, py, { color: 'ink', size: 14, dx: 12, dy: -10 }); });
          // reconstruction error inside the disc
          let err = 0;
          for (let i = 0; i < 12; i++) for (let k = 0; k < 24; k++) { const r = (0.9 * (i + 0.5)) / 12, t = (TAU * k) / 24, x = a.x + Rr * r * Math.cos(t), y = a.y + Rr * r * Math.sin(t); const w = f(x, y); if (w && dists.every((d, j) => Math.hypot(x - P[j][0], y - P[j][1]) > 1e-3)) err = Math.max(err, Math.abs(w[0] - U(x, y))); }
          // circle means
          const ua = U(a.x, a.y), pts = [];
          let lo = ua, hi = ua;
          for (let i = 1; i <= 160; i++) { const rho = (1.6 * i) / 160; const m = circleMean(U, a.x, a.y, rho, 400); pts.push([rho, m]); lo = Math.min(lo, m); hi = Math.max(hi, m); }
          const pad = Math.max(0.25, 0.15 * (hi - lo));
          R.setView(null, [lo - pad, hi + pad]);
          R.vband(0, Math.min(dmin, 1.6), { color: 'green', alpha: 0.07 });
          R.hline(ua, { color: 'muted', width: 1.2, dash: [5, 4] });
          dists.forEach((d, j) => { if (d < 1.6) { R.vline(d, { color: 'ink', width: 1, dash: [2, 3] }); R.tex(`|a-p_${j + 1}|`, d, hi + pad * (0.62 - 0.4 * j), { color: 'ink', size: 12, align: 'left', dx: 4 }); } });
          R.path(pts, { color: 'accent', width: 2.6 });
          R.vline(Rr, { color: ok ? 'green' : 'red', width: 1.8 });
          R.dot(Rr, circleMean(U, a.x, a.y, Rr, 400), { color: ok ? 'green' : 'red', r: 5 });
          R.tex('u(a)', 0.02, ua, { color: 'muted', size: 13, align: 'left', baseline: 'bottom', dy: -3 });
          L.corner(ok ? 'D̄(a;R) ⊂ Ω' : 'the disc contains a singularity', 'tl', { color: ok ? 'green' : 'red', weight: 600 });
          st = { ok, err, ua, mR: circleMean(U, a.x, a.y, Rr, 400), Rr, dmin, fa: f(a.x, a.y) };
          v.legend([['green', 'disc $\\bar D(a;R)\\subset\\Omega$'], ['purple', 'level lines of $\\operatorname{Im} f$ in $D(a;R)$'], ['accent', '$M(\\rho)$']]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const head = `$u(a)=${v.fix(s.ua, 5)}$, $\\;M(R)=${v.fix(s.mR, 5)}$, $\\;R=${v.fix(s.Rr, 3)}$, $\\;\\operatorname{dist}(a,\\{p_1,p_2\\})=${v.fix(s.dmin, 3)}$. `;
          return head + (s.ok ? `Inside the disc $\\max|\\operatorname{Re}f-u|=${v.sci(s.err, 2)}$: $u$ is the real part of $f$, with $f(a)=${cxTeX(v, s.fa, 4)}$.` : `The disc encloses a singularity: the Poisson integral of the circle values is a different harmonic function ($\\max|\\operatorname{Re}f-u|=${v.fix(s.err, 3)}$), and $M(R)\\ne u(a)$.`);
        });
      },
    },
    {
      num: '11.11',
      kind: 'Theorem',
      name: "Harnack's theorem",
      credit: 'Harnack, 1887',
      statement: String.raw`**Harnack's inequalities.** If $u\ge0$ is harmonic in a disc $D(a;R)$, then for $|z-a|=r<R$
$$\frac{R-r}{R+r}\,u(a)\;\le\;u(z)\;\le\;\frac{R+r}{R-r}\,u(a).$$
**Harnack's theorem.** Let $\{u_n\}$ be a sequence of harmonic functions in a region $\Omega$.
(a) If $u_n\to u$ uniformly on compact subsets of $\Omega$, then $u$ is harmonic in $\Omega$.
(b) If $u_1\le u_2\le u_3\le\cdots$, then either $u_n\to\infty$ uniformly on compact subsets of $\Omega$, or $\{u_n\}$ converges uniformly on compact subsets of $\Omega$ (to a harmonic function, by (a)).`,
      verify: true,
      idea: String.raw`For the inequalities, use the Poisson formula of 11.9 on a slightly smaller disc and the elementary bounds $\frac{R-r}{R+r}\le\frac{R^2-r^2}{R^2-2Rr\cos s+r^2}\le\frac{R+r}{R-r}$ on the kernel; since $u\ge0$ these pass to the integral, whose kernel-free version is $u(a)$ (mean value property). For (a), uniform limits commute with the Poisson integral on each closed disc, so $u$ is a Poisson integral there, hence harmonic (11.5). For (b), apply the inequalities to the nonnegative $u_n-u_1$: on a compact set, the increments $u_n-u_m$ are comparable to their value at a point, so finiteness (or divergence) at one point spreads uniformly; connectedness of $\Omega$ makes the dichotomy global.`,
      caption: String.raw`**Inequalities:** $u=(1-\kappa)+\kappa\,P(z,\zeta)$ is positive harmonic in $U$ with $u(0)=1$. Drag the ring handle and $\zeta$, raise $\kappa$: the graph of $u$ on the ring $|z|=r$ (log scale) stays inside the green band $\big[\frac{1-r}{1+r},\frac{1+r}{1-r}\big]$, and touches both ends when $\kappa=1$ (a point mass). **Monotone sequence:** $u_n=\sum_{k\le n}w_k\,P(z,\zeta_k)$ increases with $n$; on the compact disc $K=\{|z|\le r\}$ its minimum and maximum are pinned to $u_n(0)$ by the Harnack factors — they converge together when $\sum w_k<\infty$ and all go to $\infty$ when $\sum w_k=\infty$.`,
      deps: ['rca-11.9', 'rca-11.10', 'rca-11.4'],
      tags: ['Harnack', 'positive harmonic functions'],
      viz(v) {
        const GA = Math.PI * (3 - Math.sqrt(5));
        const mode = v.select('', [{ value: 'ineq', label: 'Harnack inequalities' }, { value: 'conv', label: '$u_n$ with $w_k=1/k^2$' }, { value: 'div', label: '$u_n$ with $w_k=1/k$' }], 'ineq');
        const kS = v.slider('$\\kappa$ (mass at $\\zeta$)', 0, 1, 0.75, { step: 0.01 });
        const nS = v.slider('$n$', 1, 300, 60, { int: true });
        const L = v.stage({ x: [-1.25, 1.25], y: [-1.25, 1.25], equal: true, height: 340, axes: false, title: 'positive harmonic $u$ (log colour scale)' });
        const R = v.stage({ x: [-Math.PI, Math.PI], y: [-1.5, 1.5], height: 340, axes: 'box', title: '' });
        const ring = L.handle(0.62, -0.25, { color: 'gold', r: 6, label: 'r', labelPos: 'se', constrain: (x, y) => { const m = Math.hypot(x, y) || 1, c = v.M.clamp(m, 0.05, 0.95); return [x * c / m, y * c / m]; } });
        const zeta = L.handle(Math.cos(0.9), Math.sin(0.9), { color: 'red', r: 6, label: 'ζ', labelPos: 'ne', constrain: (x, y) => { const m = Math.hypot(x, y) || 1; return [x / m, y / m]; } });
        const heat = fieldLayer(v, L);
        const LOGT = [0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500].map((x) => [Math.log10(x), String(x)]);
        let st = null;
        v.render(() => {
          const m = mode.value, ineq = m === 'ineq';
          kS.el.hidden = !ineq; nS.el.hidden = ineq; zeta.visible = ineq;
          const r = Math.hypot(ring.x, ring.y), lo = (1 - r) / (1 + r), hi = (1 + r) / (1 - r);
          if (ineq) {
            const k = kS.value, th = Math.atan2(zeta.y, zeta.x);
            const u = (x, y) => (1 - k) + k * Pz(x, y, th);
            heat((x, y) => (x * x + y * y < 1 ? Math.log10(u(x, y)) : NaN), { key: `i${k},${th}`, range: [-1.6, 1.6], cmap: 'magma', step: 0.2 });
            L.circle(0, 0, 1, { color: 'ink', width: 1.4 });
            L.circle(0, 0, r, { color: 'gold', width: 2, dash: [5, 4] });
            L.dot(0, 0, { color: 'accent', r: 4 }); L.tex('u(0)=1', 0, 0, { color: 'panel', size: 13, align: 'right', baseline: 'top', dx: -6, dy: 4 });
            // ring profile on a log scale
            const pts = []; let mn = Infinity, mx = -Infinity;
            for (let i = 0; i <= 400; i++) { const t = -Math.PI + (TAU * i) / 400, val = u(r * Math.cos(t), r * Math.sin(t)); pts.push([t, Math.log10(val)]); mn = Math.min(mn, val); mx = Math.max(mx, val); }
            const yl = Math.log10(hi) * 1.18 + 0.05;
            R.setView([-Math.PI, Math.PI], [-yl, yl]); R.setTicks(PI_TICKS, LOGT);
            R.setTitle('$u(re^{i\\theta})$ against $\\frac{1-r}{1+r}u(0)$ and $\\frac{1+r}{1-r}u(0)$ (log scale)');
            R.hband(Math.log10(lo), Math.log10(hi), { color: 'green', alpha: 0.1 });
            R.hline(Math.log10(lo), { color: 'green', width: 1.8, dash: [6, 4] });
            R.hline(Math.log10(hi), { color: 'green', width: 1.8, dash: [6, 4] });
            R.hline(0, { color: 'muted', width: 1, dash: [2, 3] });
            R.path(pts, { color: 'accent', width: 2.6 });
            R.vline(Math.atan2(zeta.y, zeta.x), { color: 'red', width: 1, dash: [3, 3] });
            R.tex('\\tfrac{1+r}{1-r}', Math.PI, Math.log10(hi), { color: 'green', size: 13, align: 'right', baseline: 'bottom', dx: -6, dy: -3 });
            R.tex('\\tfrac{1-r}{1+r}', Math.PI, Math.log10(lo), { color: 'green', size: 13, align: 'right', baseline: 'top', dx: -6, dy: 3 });
            st = { m, r, lo, hi, mn, mx, k };
            v.legend([['accent', '$u$ on $|z|=r$'], ['green', 'Harnack bounds', { dash: true }], ['red', 'direction of $\\zeta$', { dash: true }]]);
          } else {
            const n = nS.value, conv = m === 'conv';
            const atoms = Array.from({ length: n }, (_, j) => { const k = j + 1; return [((k * GA) % TAU) - Math.PI, conv ? 1 / (k * k) : 1 / k]; });
            const u = (x, y) => atoms.reduce((s, [t, w]) => s + w * Pz(x, y, t), 0);
            heat((x, y) => (x * x + y * y < 1 ? Math.log10(u(x, y)) : NaN), { key: `m${n},${conv}`, range: [-0.6, 1.8], cmap: 'magma', step: 0.15, res: 3 });
            L.circle(0, 0, 1, { color: 'ink', width: 1.4 });
            for (const [t, w] of atoms) L.dot(Math.cos(t), Math.sin(t), { color: 'red', r: 1.5 + 3.5 * Math.sqrt(w) });
            L.circle(0, 0, r, { color: 'panel', width: 4 }); L.circle(0, 0, r, { color: 'gold', width: 2 });
            L.tex('K', r * 0.7, r * 0.7, { color: 'gold', size: 15 });
            // history over n
            const NMAX = 300, ang = Array.from({ length: 96 }, (_, i) => (TAU * i) / 96);
            const ringVals = ang.map(() => 0), hist = [];
            let u0 = 0;
            for (let k = 1; k <= NMAX; k++) {
              const t = ((k * GA) % TAU) - Math.PI, w = conv ? 1 / (k * k) : 1 / k;
              u0 += w; for (let i = 0; i < ang.length; i++) ringVals[i] += w * Pz(r * Math.cos(ang[i]), r * Math.sin(ang[i]), t);
              hist.push([k, u0, Math.min(...ringVals), Math.max(...ringVals)]);
            }
            const lg = (x) => Math.log10(x);
            const ymax = lg(hist[NMAX - 1][3]) + 0.25, ymin = Math.min(lg(hist[0][2]), lg(hist[0][1] * lo)) - 0.2;
            R.setView([0, Math.log10(NMAX) + 0.1], [ymin, ymax]);
            R.setTicks([[0, '1'], [1, '10'], [Math.log10(30), '30'], [2, '100'], [Math.log10(300), '300']], LOGT);
            R.setTitle('$u_n(0)$, $\\min_K u_n$, $\\max_K u_n$ against $n$ (log–log)');
            const X = (k) => Math.log10(k);
            R.poly(hist.map((h) => [X(h[0]), lg(h[1] * hi)]).concat(hist.slice().reverse().map((h) => [X(h[0]), lg(h[1] * lo)])), { fill: 'green', fillAlpha: 0.1, stroke: false });
            R.path(hist.map((h) => [X(h[0]), lg(h[3])]), { color: 'orange', width: 2 });
            R.path(hist.map((h) => [X(h[0]), lg(h[2])]), { color: 'teal', width: 2 });
            R.path(hist.map((h) => [X(h[0]), lg(h[1])]), { color: 'accent', width: 2.6 });
            R.vline(X(n), { color: 'ink', width: 1, dash: [3, 3] });
            const cur = hist[n - 1];
            R.dot(X(n), lg(cur[1]), { color: 'accent', r: 4.5 });
            if (conv) { R.hline(lg(Math.PI ** 2 / 6), { color: 'muted', width: 1, dash: [2, 3] }); R.tex('\\pi^2/6', 0.05, lg(Math.PI ** 2 / 6), { color: 'muted', size: 12, align: 'left', baseline: 'bottom', dy: -2 }); }
            st = { m, r, lo, hi, n, conv, u0: cur[1], mn: cur[2], mx: cur[3] };
            v.legend([['accent', '$u_n(0)=\\sum_{k\\le n}w_k$'], ['teal', '$\\min_K u_n$'], ['orange', '$\\max_K u_n$'], ['green', 'Harnack band around $u_n(0)$', { area: true }]]);
          }
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          if (s.m === 'ineq') return `$r=${v.fix(s.r, 3)}$: $\\;\\frac{1-r}{1+r}=${v.fix(s.lo, 4)}\\le\\min_{|z|=r}u=${v.fix(s.mn, 4)}$, $\\;\\max_{|z|=r}u=${v.fix(s.mx, 4)}\\le\\frac{1+r}{1-r}=${v.fix(s.hi, 4)}$` + (s.k > 0.995 ? ' — with all mass at $\\zeta$ both bounds are attained.' : '.');
          return `$n=${s.n}$: $\\;u_n(0)=${v.fix(s.u0, 4)}$, $\\;\\min_K u_n=${v.fix(s.mn, 4)}\\ge${v.fix(s.u0 * s.lo, 4)}$, $\\;\\max_K u_n=${v.fix(s.mx, 4)}\\le${v.fix(s.u0 * s.hi, 4)}$. ` + (s.conv ? 'Here $\\sum w_k<\\infty$: the sequence converges uniformly on $K$.' : 'Here $\\sum w_k=\\infty$: $u_n(0)\\to\\infty$, and Harnack drags $\\min_K u_n$ to $\\infty$ with it.');
        });
      },
    },
    // ------------------------------------------------------------------ the mean value property
    {
      num: '11.12',
      kind: 'Definition',
      name: 'The mean value property',
      statement: String.raw`A continuous real function $u$ on an open set $\Omega$ has the **mean value property** if at each point $z\in\Omega$ the value $u(z)$ is the average of $u$ over arbitrarily small circles centred at $z$; precisely, each $z\in\Omega$ admits radii $r_1,r_2,\dots>0$ with $r_n\to0$ and
$$u(z)=\frac{1}{2\pi}\int_{-\pi}^{\pi}u(z+r_ne^{it})\,dt\qquad\text{for every }n .$$
Only some sequence of radii is required, and it may depend on $z$. Harmonic functions satisfy the identity for every radius $r$ with $\bar D(z;r)\subset\Omega$ (11.10).`,
      idea: String.raw`Only arbitrarily small circles, and only a sequence of radii at each point, are required — a deliberately weak hypothesis, so that the converse theorem 11.13 is as strong as possible. For a $C^2$ function the defect $\frac{1}{2\pi}\int u(z+re^{it})\,dt-u(z)$ equals $\frac{r^2}{4}\Delta u(z)+o(r^2)$, so at a point where $\Delta u(z)\ne0$ it has a fixed sign for all small $r$ and the property fails there.`,
      caption: String.raw`Drag $z$ and the radius $\rho$. Right: the normalised defect $D(\rho)/\rho^2$, where $D(\rho)$ is the mean of $u$ over $|w-z|=\rho$ minus $u(z)$, on a logarithmic $\rho$-axis; green dots are radii where the mean equals $u(z)$. The dashed line is the limit $\Delta u(z)/4$. For $u=|z|^2\sin(\pi/|z|)$ at $z=0$ the zeros $\rho=1/n$ accumulate at $0$ — the property holds **at that point** — but move $z$ away and the zeros stop short of $0$.`,
      deps: ['rca-11.10'],
      tags: ['mean value property', 'harmonic'],
      viz(v) {
        const FN = {
          harm: { label: 'harmonic $x^2-y^2+\\frac{x}{2}$', u: (x, y) => x * x - y * y + 0.5 * x, lap: () => 0, range: 1.6, step: 0.2 },
          abs2: { label: '$|z|^2$', u: (x, y) => x * x + y * y, lap: () => 4, range: 2, step: 0.2 },
          osc: { label: '$|z|^2\\sin(\\pi/|z|)$', u: (x, y) => { const r = Math.hypot(x, y); return r < 1e-12 ? 0 : r * r * Math.sin(Math.PI / r); }, lap: (x, y) => { const r = Math.hypot(x, y); if (r < 1e-9) return NaN; const s = Math.sin(Math.PI / r), c = Math.cos(Math.PI / r); return 4 * s - (Math.PI * c) / r - (Math.PI * Math.PI * s) / (r * r); }, range: 0.6, step: 0.12 },
        };
        const which = v.select('$u$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'osc');
        const rS = v.slider('radius $\\rho$', 0.02, 0.5, 0.2, { log: true, fmt: (x) => v.fmt(x, 3) });
        const L = v.stage({ x: [-1.05, 1.05], y: [-1.05, 1.05], equal: true, height: 340, axes: false, title: '$u$ and the circle $|w-z|=\\rho$' });
        const LX0 = Math.log10(0.02);
        const R = v.stage({ x: [LX0, Math.log10(0.5)], y: [-1.5, 1.5], height: 340, axes: 'box', xticks: [[Math.log10(0.02), '0.02'], [Math.log10(0.03), '0.03'], [Math.log10(0.05), '0.05'], [-1, '0.1'], [Math.log10(0.2), '0.2'], [Math.log10(0.5), '0.5']], xlabel: 'ρ', title: 'normalised defect $D(\\rho)/\\rho^2$' });
        const z = L.handle(0, 0, { color: 'accent', label: 'z', labelPos: 'ne', constrain: (x, y) => (Math.hypot(x, y) < 0.035 ? [0, 0] : [v.M.clamp(x, -0.5, 0.5), v.M.clamp(y, -0.5, 0.5)]) });
        const heat = fieldLayer(v, L);
        let st = null;
        v.render(() => {
          const k = which.value, F = FN[k], u = F.u, rho = rS.value;
          heat((x, y) => (Math.abs(x) <= 1 && Math.abs(y) <= 1 ? u(x, y) : NaN), { key: k, range: [-F.range, F.range], step: F.step, offset: F.step / 2, res: 2 });
          L.rect(-1, -1, 1, 1, { color: 'muted', width: 1 });
          L.rect(-0.5, -0.5, 0.5, 0.5, { color: 'muted', width: 1, dash: [3, 4] });
          L.circle(z.x, z.y, rho, { color: 'panel', width: 4.5 });
          L.circle(z.x, z.y, rho, { color: 'gold', width: 2.2 });
          const uz = u(z.x, z.y);
          const xs = [], ys = [], zeros = [];
          const n = 700;
          for (let i = 0; i <= n; i++) {
            const lr = LX0 + ((Math.log10(0.5) - LX0) * i) / n, r = 10 ** lr;
            const d = (circleMean(u, z.x, z.y, r, 720) - uz) / (r * r);
            xs.push(lr); ys.push(d);
          }
          for (let i = 1; i <= n; i++) if (ys[i - 1] === 0 || Math.sign(ys[i - 1]) !== Math.sign(ys[i])) { const t = ys[i - 1] / (ys[i - 1] - ys[i] || 1); zeros.push(xs[i - 1] + t * (xs[i] - xs[i - 1])); }
          const allZero = ys.every((y) => Math.abs(y) < 1e-6);
          const lap = F.lap(z.x, z.y);
          let ym = 1.2; for (const y of ys) if (isFinite(y)) ym = Math.max(ym, Math.min(8, Math.abs(y) * 1.15));
          if (isFinite(lap)) ym = Math.max(ym, Math.min(8, Math.abs(lap / 4) * 1.2));
          R.setView(null, [-ym, ym]);
          R.hline(0, { color: 'muted', width: 1 });
          if (isFinite(lap)) { R.hline(lap / 4, { color: 'orange', width: 1.6, dash: [6, 4] }); R.tex('\\Delta u(z)/4', LX0, lap / 4, { color: 'orange', size: 12, align: 'left', baseline: lap >= 0 ? 'bottom' : 'top', dx: 6, dy: lap >= 0 ? -3 : 3 }); }
          R.path(xs.map((x, i) => [x, Math.max(-ym * 1.5, Math.min(ym * 1.5, ys[i]))]), { color: allZero ? 'green' : 'accent', width: 2.4 });
          if (!allZero) for (const x0 of zeros) R.dot(x0, 0, { color: 'green', r: 3.5 });
          R.vline(Math.log10(rho), { color: 'gold', width: 1.5 });
          const zs = zeros.map((x) => 10 ** x).sort((p, q) => p - q);
          const small = zs.length ? zs[0] : null;
          const verdict = allZero ? 'all' : zs.length >= 6 && small < 0.022 ? 'acc' : 'none';
          R.corner(verdict === 'all' ? 'mean = u(z) for every ρ' : verdict === 'acc' ? 'zeros accumulate at ρ = 0: MVP holds at z' : 'no zeros near ρ = 0: MVP fails at z', 'tl', { color: verdict === 'none' ? 'red' : 'green', weight: 600 });
          st = { uz, mean: circleMean(u, z.x, z.y, rho, 720), rho, zs, verdict, lap };
          v.legend([['accent', '$D(\\rho)/\\rho^2$'], ['green', 'radii with mean $=u(z)$', { dot: true }], ['orange', 'limit $\\Delta u(z)/4$', { dash: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const list = s.zs.slice(0, 5).map((x) => v.fix(x, 4)).join(', ');
          return `$u(z)=${v.fix(s.uz, 5)}$; mean over $|w-z|=${v.fix(s.rho, 3)}$: $${v.fix(s.mean, 5)}$. ` + (s.verdict === 'all' ? 'The mean equals $u(z)$ for every radius.' : s.zs.length ? `Smallest radii with mean $=u(z)$: ${list}${s.zs.length > 5 ? ', …' : ''}.` : 'No radius in view gives mean $=u(z)$.');
        });
      },
    },
    {
      num: '11.13',
      kind: 'Theorem',
      name: 'The mean value property characterises harmonic functions',
      statement: String.raw`If a continuous real function $u$ has the mean value property (11.12) in an open set $\Omega$, then $u$ is harmonic in $\Omega$.`,
      idea: String.raw`Fix a closed disc $\bar D\subset\Omega$ and let $h$ be the solution of the Dirichlet problem in $D$ with $h=u$ on $\partial D$ (11.8). Then $w=u-h$ is continuous on $\bar D$, vanishes on $\partial D$, and has the mean value property in $D$ (harmonic functions have it by 11.10, and it is preserved under differences). If $\max_{\bar D}w=m>0$, the set $E=\{w=m\}$ is a compact subset of $D$; a point $z_0\in E$ farthest from the centre has, on every small circle around it, an arc lying outside $E$, where $w<m$ — so every small circle mean is $<m=w(z_0)$, contradicting the mean value property at $z_0$. Hence $w\le0$, and likewise $w\ge0$: $u=h$ is harmonic in $D$.`,
      caption: String.raw`The proof, run on functions that are **not** harmonic. For each $u$ we solve the Dirichlet problem on the unit disc with the same boundary values and plot $w=u-h$ (heat map and surface). Whenever $w\not\equiv0$, it has an interior extremum $z_0$ (gold) — and at $z_0$ every small circle mean of $w$ is strictly on the wrong side of $w(z_0)$, so $u$ cannot have the mean value property there. For the harmonic $u$, $w\equiv0$.`,
      deps: ['rca-11.12', 'rca-11.8', 'rca-11.10'],
      tags: ['mean value property', 'harmonic', 'maximum principle'],
      viz(v) {
        const FN = {
          harm: { label: 'harmonic', u: (x, y) => x ** 3 - 3 * x * y * y + 0.6 * y },
          bump: { label: 'bump $e^{-3|z-c|^2}$', u: (x, y) => Math.exp(-3 * ((x - 0.25) ** 2 + (y - 0.2) ** 2)) },
          abs2: { label: '$|z|^2$', u: (x, y) => x * x + y * y },
          osc: { label: '$|z|^2\\sin(\\pi/|z|)$', u: (x, y) => { const r = Math.hypot(x, y); return r < 1e-12 ? 0 : r * r * Math.sin(Math.PI / r); } },
        };
        const which = v.select('$u$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'bump');
        const rS = v.slider('circle radius $\\rho$ about $z_0$', 0.02, 0.4, 0.15, { step: 0.01 });
        const L = v.stage({ x: [-1.15, 1.15], y: [-1.15, 1.15], equal: true, height: 330, axes: false, title: '$w=u-h$, where $h=P[u|_T]$ solves the Dirichlet problem' });
        const S3 = v.stage3d({ range: 1.2, height: 330, yaw: -0.6, pitch: 0.55, axes: false });
        const heat = fieldLayer(v, L);
        let last = null, cache = null, st = null;
        v.render(() => {
          const k = which.value, u = FN[k].u, rho = rS.value;
          if (last !== k) {
            last = k;
            const H = herglotz((t) => u(Math.cos(t), Math.sin(t)), 64, 1024);
            const w = (x, y) => u(x, y) - hornerXY(H.cr, H.ci, x, y)[0];
            // locate the extremum of |w| on a polar grid, then refine
            let best = { v: 0, x: 0, y: 0 };
            for (let i = 1; i <= 60; i++) for (let j = 0; j < 120; j++) { const r = (0.98 * i) / 60, t = (TAU * j) / 120, x = r * Math.cos(t), y = r * Math.sin(t), val = w(x, y); if (Math.abs(val) > Math.abs(best.v)) best = { v: val, x, y }; }
            let step = 0.02;
            for (let it = 0; it < 60; it++) {
              let moved = false;
              for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const x = best.x + dx * step, y = best.y + dy * step; if (x * x + y * y >= 0.99) continue; const val = w(x, y); if (Math.abs(val) > Math.abs(best.v)) { best = { v: val, x, y }; moved = true; } }
              if (!moved) step /= 2;
            }
            let wmax = 0; for (let i = 0; i <= 30; i++) for (let j = 0; j < 60; j++) { const r = i / 30.5, t = (TAU * j) / 60; wmax = Math.max(wmax, Math.abs(w(r * Math.cos(t), r * Math.sin(t)))); }
            cache = { w, best, wmax };
          }
          const { w, best } = cache, m = Math.max(cache.wmax, 1e-9), trivial = cache.wmax < 1e-8;
          const range = trivial ? 1 : m * 1.05;
          heat((x, y) => (x * x + y * y < 1 ? w(x, y) : NaN), { key: k, range: [-range, range], step: range / 6, offset: range / 12 });
          L.circle(0, 0, 1, { color: 'ink', width: 1.4 });
          L.tex('w=0\\ \\text{on}\\ T', 0.78, -0.95, { color: 'ink', size: 13, align: 'left' });
          let mean = null;
          if (!trivial) {
            mean = circleMean(w, best.x, best.y, rho, 360);
            L.circle(best.x, best.y, rho, { color: 'panel', width: 4.5 });
            L.circle(best.x, best.y, rho, { color: 'gold', width: 2.2 });
            L.dot(best.x, best.y, { color: 'gold', r: 5.5, label: 'z₀', labelPos: 'ne' });
          } else L.corner('w ≡ 0: u = h is harmonic', 'tl', { color: 'green', weight: 600 });
          // 3D surface of w
          const sc = 0.7 / range;
          S3.surface((r, t) => { const x = r * Math.cos(t), y = r * Math.sin(t); return [x, y, sc * w(x, y)]; }, [0, 1], [-Math.PI, Math.PI], { nu: 22, nv: 60, colorFn: (a, b, P) => v.M.cmap(0.5 + P[2] / (2 * sc * range), 'diverging'), alpha: 0.9 });
          S3.curve((t) => [Math.cos(t), Math.sin(t), 0], -Math.PI, Math.PI, { color: 'ink', width: 1.6, n: 120 });
          if (!trivial) {
            S3.curve((t) => { const x = best.x + rho * Math.cos(t), y = best.y + rho * Math.sin(t); return [x, y, sc * w(x, y)]; }, 0, TAU, { color: 'gold', width: 2.6, n: 90, bias: -0.04 });
            S3.dot([best.x, best.y, sc * best.v], { color: 'gold', r: 5.5, bias: -0.05 });
            S3.line([best.x, best.y, sc * best.v], [best.x, best.y, sc * mean], { color: 'red', width: 2.2, bias: -0.06 });
            S3.dot([best.x, best.y, sc * mean], { color: 'red', r: 4, bias: -0.06 });
          }
          st = { trivial, best, mean, rho, wmax: cache.wmax };
          v.legend(trivial ? [['green', '$w=u-h\\equiv0$']] : [['gold', 'extremum $z_0$ of $w$ and the circle $|z-z_0|=\\rho$'], ['red', 'circle mean of $w$ (3D)']]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          if (s.trivial) return `$\\max_{\\bar U}|u-h|=${v.sci(Math.max(s.wmax, 1e-16), 2)}$: the solution of the Dirichlet problem is $u$ itself.`;
          const isMax = s.best.v > 0;
          return `$w(z_0)=${v.fix(s.best.v, 4)}$ is the ${isMax ? 'maximum' : 'minimum'} of $w$, attained inside $U$. The mean of $w$ over $|z-z_0|=${v.fix(s.rho, 2)}$ is $${v.fix(s.mean, 4)} ${isMax ? '<' : '>'} w(z_0)$ — and so for every small $\\rho$: $w$, hence $u=w+h$, lacks the mean value property at $z_0$.`;
        });
      },
    },
    {
      num: '11.14',
      kind: 'Theorem',
      name: 'The Schwarz reflection principle',
      credit: 'Schwarz, 1870',
      statement: String.raw`Assume:
- $L$ is a segment of $\R$, $\Omega^+$ is a region contained in the upper half-plane $\Pi^+$, and $\Omega^-=\{\bar z:z\in\Omega^+\}$ is its mirror image;
- each $t\in L$ is the centre of an open disc $D_t$ whose upper half $D_t\cap\Pi^+$ lies in $\Omega^+$;
- $f=u+iv$ is holomorphic in $\Omega^+$, and $v(z_n)\to0$ whenever $z_n\in\Omega^+$ tends to a point of $L$.

Then $f$ extends to a function $F$ holomorphic in $\Omega^+\cup L\cup\Omega^-$, and the extension has the symmetry
$$F(\bar z)=\overline{F(z)}\qquad(z\in\Omega^+\cup L\cup\Omega^-).$$`,
      idea: String.raw`Extend $v$ to $\Omega=\Omega^+\cup L\cup\Omega^-$ by $V=0$ on $L$ and $V(\bar z)=-v(z)$ in $\Omega^-$. $V$ is continuous, harmonic off $L$, and at points of $L$ every small circle mean vanishes by odd symmetry — so $V$ has the mean value property and is harmonic in $\Omega$ by 11.13. In each disc $D_t$, $V=\operatorname{Im}g$ for a holomorphic $g$ (11.10); $g-f$ is real in $D_t^+$, hence constant, and the normalisation $g=f$ there makes $g$ the extension in $D_t$. These local extensions agree with $\overline{f(\bar z)}$ in $\Omega^-$ and patch together to $F$.`,
      caption: String.raw`Phase portraits: above the axis $f$, below it $\overline{f(\bar z)}$. When $\operatorname{Im}f\to0$ on $L$ the two halves join seamlessly into one holomorphic $F$. Drag $t$ along $L$ and set $\rho$: the circle mean of $V=\operatorname{Im}F$ about $t$ is $0=V(t)$ by odd symmetry (11.13 then makes $V$ harmonic). Right: the vertical slice $y\mapsto F(t+iy)$ — $\operatorname{Im}F$ is odd and smooth through $y=0$, $\operatorname{Re}F$ even. For $e^{2iz}$ the hypothesis fails ($\operatorname{Im}f=\sin2x$ on $L$): the reflected halves do not match and $V$ jumps.`,
      deps: ['rca-11.13', 'rca-11.10', 'rca-10.18'],
      tags: ['reflection principle', 'analytic continuation'],
      viz(v) {
        const { Cx } = v.M;
        const q = new Cx(0.3, 1.4), qb = q.conj();
        const FN = {
          sin: { label: '$\\sin 2z$', f: (z) => z.scale(2).sin(), ok: true },
          rat: { label: '$\\frac{(z^2+0.35)(z-0.55)}{(z-q)(z-\\bar q)}$', f: (z) => z.mul(z).add(0.35).mul(z.sub(0.55)).div(z.sub(q).mul(z.sub(qb))), ok: true },
          bad: { label: '$e^{2iz}$ (fails)', f: (z) => new Cx(-2 * z.im, 2 * z.re).exp(), ok: false },
        };
        const which = v.select('$f$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'rat');
        const rS = v.slider('$\\rho$', 0.05, 0.6, 0.35, { step: 0.01 });
        const RAD = 1.25;
        const inOmega = (x, y) => x * x + y * y < RAD * RAD;
        const L = v.stage({ x: [-1.6, 1.6], y: [-1.3, 1.5], equal: true, height: 340, axes: false, title: 'above: $f$ on $\\Omega^+$; below: $\\overline{f(\\bar z)}$ on $\\Omega^-$' });
        const R = v.stage({ x: [-1.25, 1.25], y: [-2, 2], height: 340, axes: 'box', xlabel: 'y', title: 'slice through $t$: $\\operatorname{Re}F(t+iy)$, $\\operatorname{Im}F(t+iy)$' });
        const t = L.handle(0.3, 0, { color: 'accent', label: 't', labelPos: 'se', constrain: (x) => [v.M.clamp(x, -RAD + 0.05, RAD - 0.05), 0] });
        const F = (f, x, y) => { if (y >= 0) return f(new Cx(x, y)); const w = f(new Cx(x, -y)); return new Cx(w.re, -w.im); };
        let st = null;
        v.render(() => {
          const k = which.value, f = FN[k].f, ok = FN[k].ok, rho = rS.value;
          const bg = v.rgb('panel');
          L.raster((x, y) => { if (!inOmega(x, y)) return null; const w = F(f, x, y); return phaseRGB(v.M, w.re, w.im, y < 0 ? 0.12 : 0, bg); }, { key: k, res: 2 });
          L.circle(0, 0, RAD, { color: 'ink', width: 1.4 });
          L.line(-RAD, 0, RAD, 0, { color: 'panel', width: 6 });
          L.line(-RAD, 0, RAD, 0, { color: ok ? 'green' : 'red', width: 3 });
          L.tex('\\Omega^+', -0.9, 0.85, { color: 'ink', size: 16 });
          L.tex('\\Omega^-', -0.9, -0.85, { color: 'ink', size: 16 });
          L.tex('L', RAD, 0, { color: ok ? 'green' : 'red', size: 16, align: 'left', dx: 8 });
          // the circle about t and the mean of V = Im F
          L.circle(t.x, 0, rho, { color: 'panel', width: 4.5 });
          L.circle(t.x, 0, rho, { color: 'ink', width: 2 });
          const V = (x, y) => F(f, x, y).im;
          const mean = circleMean(V, t.x, 0, rho, 400);
          const Vt = f(new Cx(t.x, 0)).im;
          // slice
          const ys = Array.from({ length: 401 }, (_, i) => -1.2 + (2.4 * i) / 400).filter((y) => Math.abs(y) > 1e-9);
          const re = ys.map((y) => [y, F(f, t.x, y).re]), im = ys.map((y) => [y, F(f, t.x, y).im]);
          let mx = 1; for (const p of re.concat(im)) mx = Math.max(mx, Math.min(6, Math.abs(p[1]) * 1.12));
          R.setView(null, [-mx, mx]);
          R.vline(0, { color: ok ? 'green' : 'red', width: 1.2, dash: [3, 3] });
          R.vband(-rho, rho, { color: 'muted', alpha: 0.06 });
          const split = (pts) => [pts.filter((p) => p[0] < 0), pts.filter((p) => p[0] > 0)];
          for (const part of split(re)) R.path(part, { color: 'ink', width: 2.4 });
          for (const part of split(im)) R.path(part, { color: 'purple', width: 2.4 });
          R.tex('\\Omega^-', -0.6, mx * 0.86, { color: 'muted', size: 14 });
          R.tex('\\Omega^+', 0.6, mx * 0.86, { color: 'muted', size: 14 });
          L.corner(ok ? 'Im f → 0 on L: the halves glue' : 'Im f ≠ 0 on L: no extension', 'tl', { color: ok ? 'green' : 'red', weight: 600 });
          st = { ok, mean, Vt, rho, t: t.x, jump: 2 * Math.abs(f(new Cx(t.x, 0)).im) };
          v.legend([['ink', '$\\operatorname{Re}F$ (even in $y$)'], ['purple', '$V=\\operatorname{Im}F$ (odd in $y$)']]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          if (s.ok) return `Mean of $V$ over $|z-t|=${v.fix(s.rho, 2)}$: $${v.sci(s.mean, 2)}$ $=V(t)=0$ — the odd reflection has the mean value property on $L$; jump of $V$ across $L$ at $t$: $${s.jump < 1e-14 ? '0' : v.sci(s.jump, 1)}$.`;
          return `On $L$, $\\operatorname{Im}f(t)=${v.fix(s.Vt, 3)}\\ne0$; the odd reflection jumps by $${v.fix(s.jump, 3)}$ at $t$, its circle mean is $${v.fix(s.mean, 3)}$, and no holomorphic $F$ restricts to both halves.`;
        });
      },
    },
  ],
};
