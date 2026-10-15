// Rudin, Real and Complex Analysis — Chapter 17: H^p-Spaces (part 1: subharmonic functions)

// ---------------------------------------------------------------- helpers shared by this file
const TAU = 2 * Math.PI;
const PI_TICKS = [[-Math.PI, '−π'], [-Math.PI / 2, '−π/2'], [0, '0'], [Math.PI / 2, 'π/2'], [Math.PI, 'π']];
/** Mean of a 2π-periodic function by the trapezoid rule (spectrally accurate for smooth g). */
function meanU(g, n = 512) { let s = 0; for (let k = 0; k < n; k++) s += g(-Math.PI + TAU * k / n); return s / n; }
/** Mean over the circle with nodes clustered at θ = 0 (θ = π s³), for integrands singular near z = 1. */
function meanC(g, n = 480) {
  let acc = 0; const h = 2 / n;
  for (let i = 0; i <= n; i++) {
    const s = -1 + i * h, jac = 3 * Math.PI * s * s; if (!jac) continue;
    const w = i === 0 || i === n ? 1 : i % 2 ? 4 : 2;
    acc += w * g(Math.PI * s * s * s) * jac;
  }
  return acc * h / 3 / TAU;
}
/** Real Fourier data of a real function sampled on a circle: returns {a, b} with g ≈ a0 + Σ a_k cos kθ + b_k sin kθ. */
function fourier(vals, K) {
  const n = vals.length, a = new Float64Array(K + 1), b = new Float64Array(K + 1);
  for (let j = 0; j < n; j++) {
    const t = TAU * j / n, y = vals[j];
    const c1 = Math.cos(t), s1 = Math.sin(t); let c = 1, s = 0;
    for (let k = 0; k <= K; k++) { a[k] += y * c; b[k] += y * s; const c2 = c * c1 - s * s1; s = s * c1 + c * s1; c = c2; }
  }
  a[0] /= n; for (let k = 1; k <= K; k++) { a[k] *= 2 / n; b[k] *= 2 / n; }
  return { a, b };
}
/** Harmonic extension of Fourier data into the disc: value at ρe^{iθ} with ρ = |z|/R ∈ [0,1]. */
function harmExt({ a, b }, rho, th) {
  let s = a[0]; const c1 = Math.cos(th), s1 = Math.sin(th); let c = c1, sn = s1, p = rho;
  for (let k = 1; k < a.length; k++) { s += p * (a[k] * c + b[k] * sn); const c2 = c * c1 - sn * s1; sn = sn * c1 + c * s1; c = c2; p *= rho; if (p < 1e-14) break; }
  return s;
}
/** Phase-portrait colour (hue = arg w, bands = log2|w|), as in Stage.domain. */
function phaseRGB(M, re, im) {
  if (!isFinite(re) || !isFinite(im)) return [250, 250, 250];
  const t = M.fract(Math.log2(Math.hypot(re, im) + 1e-300));
  return M.hsl2rgb(Math.atan2(im, re) / TAU, 0.62, 0.42 + 0.2 * Math.pow(t, 0.7));
}
function xMark(S, x, y, color = 'ink', size = 5) {
  const d = size / S.scale;
  for (const [col, w] of [['panel', 5], [color, 2.2]]) { S.line(x - d, y - d, x + d, y + d, { color: col, width: w }); S.line(x - d, y + d, x + d, y - d, { color: col, width: w }); }
}
/** Circle drawn with a halo so that it reads on top of a raster. */
function haloCircle(S, x, y, r, color, width = 2.2, dash) {
  S.circle(x, y, r, { color: 'panel', width: width + 3, alpha: 0.9 });
  S.circle(x, y, r, { color, width, dash });
}
/** TeX labels at a fixed x, nudged apart vertically so that they never overlap (pixel gap). */
function spreadLabels(S, labels, { x, gap = 15, align = 'right', dx = -3, size = 12.5 } = {}) {
  const it = labels.filter((l) => isFinite(l.y)).map((l) => ({ ...l, py: S.Y(l.y) })).sort((a, b) => a.py - b.py);
  for (let i = 1; i < it.length; i++) if (it[i].py - it[i - 1].py < gap) it[i].py = it[i - 1].py + gap;
  const over = it.length ? it[it.length - 1].py - (S.height - 12) : 0;
  if (over > 0) { for (const l of it) l.py -= over; for (let i = it.length - 2; i >= 0; i--) if (it[i + 1].py - it[i].py < gap) it[i].py = it[i + 1].py - gap; }
  for (const l of it) S.texPx(l.tex, S.X(x), l.py, { color: l.color, size, align, dx });
}
/** The abscissa among `cands` where the polyline `pts` stays farthest from the level y (for placing a label on a line). */
function freeX(pts, y, cands, win) {
  let best = cands[0], bd = -1;
  for (const c of cands) { let d = Infinity; for (const p of pts) if (Math.abs(p[0] - c) < win && isFinite(p[1])) d = Math.min(d, Math.abs(p[1] - y)); if (d > bd) { bd = d; best = c; } }
  return best;
}
const mixRGB = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t];

export default {
  collection: 'rca',
  chapter: 17,
  title: 'Hᵖ-Spaces',
  summary: String.raw`Which holomorphic functions in the disc have boundary values, and how much of a function do those boundary values remember? Rudin answers with subharmonic functions: $\log|f|$ and $|f|^p$ lie below their circle averages, so the integral means $M_p(f;r)$ increase and the Hardy spaces $H^p$ and the Nevanlinna class $N$ make sense. Their members have radial limits a.e., factor canonically as (Blaschke product) × (singular inner function) × (outer function), and $H^p$ sits inside $L^p(\T)$ as the functions with no negative frequencies. The chapter ends with the F. and M. Riesz theorem, Beurling's description of the invariant subspaces of the shift on $H^2$, and M. Riesz's theorem that conjugation is bounded on $L^p$ for $1<p<\infty$.`,
  items: [
    // ------------------------------------------------------------------ subharmonic functions
    {
      num: '17.2',
      kind: 'Definition',
      name: 'Subharmonic function',
      statement: String.raw`Let $\Omega$ be an open set in the plane. A function $u$ on $\Omega$ is **subharmonic** if it has the following four properties.
(a) $-\infty\le u(z)<\infty$ for every $z\in\Omega$.
(b) $u$ is upper semicontinuous in $\Omega$.
(c) Whenever the closed disc $\overline D(a;r)$ lies in $\Omega$,
$$u(a)\le\frac1{2\pi}\int_{-\pi}^{\pi}u(a+re^{i\theta})\,d\theta .$$
(d) None of the integrals in (c) is $-\infty$.`,
      idea: String.raw`Harmonic functions satisfy (c) with *equality* (the mean value property of chapter 11); a subharmonic function is only required to lie *below* its circle averages, and that one-sided inequality is enough to compare it with harmonic functions (17.4) and to make its circle means increase (17.5). Upper semicontinuity makes $u$ Borel and bounded above on each circle, so the integrals in (c) exist in $[-\infty,\infty)$; (d) rules out $u\equiv-\infty$ near a circle. The model example is $\log|f|$ for $f\in H(\Omega)$, $f\not\equiv0$ on any component: by Jensen's formula (15.18) its mean over $|z-a|=r$ exceeds $\log|f(a)|$ by $\sum\log\frac{r}{|\alpha-a|}$, summed over the zeros $\alpha$ of $f$ in the disc.`,
      caption: String.raw`Choose $u$, drag the centre $a$ and the gold radius handle. On the right are the values of $u$ around the circle $|z-a|=r$, their mean (green) and the number $u(a)$ (blue). For $\log|f|$ you can drag the three zeros of $f$ as well: the mean is *exactly* $u(a)$ until a zero enters the disc, and then the gap is $\log(r/|\alpha-a|)$ per zero. $\Re z^2$ is harmonic (equality), $\max(\Re z,\Re z^2)$ is a maximum of harmonic functions, and $-|z|^2$ breaks (c).`,
      deps: ['rca-2.8', 'rca-15.18'],
      tags: ['subharmonic', 'mean value'],
      viz(v) {
        const L = v.stage({ x: [-1.7, 1.7], y: [-1.3, 1.3], equal: true, height: 340, title: 'heat map of $u$; the circle $|z-a|=r$' });
        const R = v.stage({ x: [-Math.PI - 0.2, Math.PI + 0.2], y: [-3, 2], height: 340, axes: 'box', xticks: PI_TICKS, xlabel: 'θ', title: '$u(a+re^{i\\theta})$, its mean, and $u(a)$' });
        const Z = [[-0.75, 0.42], [0.62, 0.55], [0.18, -0.62]].map(([x, y], k) => L.handle(x, y, { color: 'ink', r: 5.5, label: `α${'₁₂₃'[k]}`, labelPos: 'ne' }));
        const U = {
          logf: { label: '$\\log|f|$', u: (x, y) => { let s = 0; for (const h of Z) s += Math.log(Math.hypot(x - h.x, y - h.y)); return s; }, range: [-3.6, 1.4], kind: 'sub' },
          abs2: { label: '$|z|^2$', u: (x, y) => x * x + y * y, range: [0, 3.2], kind: 'sub' },
          maxh: { label: '$\\max(\\Re z,\\Re z^2)$', u: (x, y) => Math.max(x, x * x - y * y), range: [-1.4, 2], kind: 'sub' },
          harm: { label: '$\\Re z^2$', u: (x, y) => x * x - y * y, range: [-1.7, 1.7], kind: 'harm' },
          sup: { label: '$-|z|^2$', u: (x, y) => -(x * x + y * y), range: [-3.2, 0], kind: 'super' },
        };
        const which = v.select('$u$', Object.entries(U).map(([value, o]) => ({ value, label: o.label })), 'logf');
        const a = L.handle(-0.35, 0.05, { color: 'blue', label: 'a', labelPos: 'sw' });
        const rad = L.handle(-0.35 + 0.62 * Math.cos(0.5), 0.05 + 0.62 * Math.sin(0.5), { color: 'gold', r: 6 });
        let prev = [a.x, a.y];
        a.onDrag = () => { rad.x += a.x - prev[0]; rad.y += a.y - prev[1]; prev = [a.x, a.y]; };
        let st = null;
        v.render(() => {
          const F = U[which.value]; prev = [a.x, a.y];
          Z.forEach((h) => { h.visible = which.value === 'logf'; });
          const r = Math.max(0.06, Math.hypot(rad.x - a.x, rad.y - a.y));
          L.heat(F.u, { range: F.range, cmap: 'viridis', res: 2, key: which.value + (which.value === 'logf' ? Z.map((h) => h.x + ',' + h.y).join(';') : '') });
          haloCircle(L, a.x, a.y, r, 'ink', 2.2);
          L.line(a.x, a.y, rad.x, rad.y, { color: 'panel', width: 4, alpha: 0.8 });
          L.line(a.x, a.y, rad.x, rad.y, { color: 'gold', width: 1.8 });
          L.tex('r', (a.x + rad.x) / 2, (a.y + rad.y) / 2, { color: 'ink', size: 14, dx: 8, dy: -8 });
          // circle profile and its mean
          const n = 720, pts = [];
          for (let k = 0; k <= n; k++) { const t = -Math.PI + TAU * k / n; pts.push([t, F.u(a.x + r * Math.cos(t), a.y + r * Math.sin(t))]); }
          const ua = F.u(a.x, a.y);
          let mean, inside = [];
          if (which.value === 'logf') { // exact (Jensen): mean of log|z-α| over |z-a|=r is max(log r, log|a-α|)
            mean = 0; for (const h of Z) { const d = Math.hypot(a.x - h.x, a.y - h.y); mean += Math.max(Math.log(r), Math.log(d)); if (d < r) inside.push(d); }
          } else mean = meanU((t) => F.u(a.x + r * Math.cos(t), a.y + r * Math.sin(t)), 1024);
          const fin = pts.map((p) => p[1]).filter(isFinite);
          let hi = Math.max(...fin, mean, isFinite(ua) ? ua : -Infinity), lo = Math.min(...fin, mean, isFinite(ua) ? ua : Infinity);
          lo = Math.max(lo, Math.min(mean, isFinite(ua) ? ua : mean) - 2.5);
          const pad = Math.max(0.12, (hi - lo) * 0.12);
          R.setView(null, [lo - pad, hi + pad]);
          const yb = R.bounds.y[0];
          R.path(pts.map(([t, y]) => [t, Math.max(y, yb - 1)]).concat([[Math.PI, mean], [-Math.PI, mean]]), { fill: 'accent', fillAlpha: 0.1, stroke: false, close: true });
          R.path(pts.map(([t, y]) => [t, isFinite(y) ? Math.max(y, yb - 1) : yb - 1]), { color: 'accent', width: 2.4 });
          R.hline(mean, { color: 'green', width: 2.2 });
          const good = F.kind !== 'super';
          if (isFinite(ua)) R.hline(ua, { color: good ? 'blue' : 'red', width: 1.8, dash: [6, 4] });
          const cands = [-2.7, -1.6, -0.5, 0.5, 1.6, 2.7];
          const xm = freeX(pts, mean, cands, 0.45);
          R.tex('\\text{mean}', xm, mean, { color: 'green', size: 13, baseline: ua > mean ? 'top' : 'bottom', dy: ua > mean ? 4 : -3 });
          if (isFinite(ua)) { const xa = freeX(pts, ua, cands.filter((c) => c !== xm), 0.45); R.tex('u(a)', xa, ua, { color: good ? 'blue' : 'red', size: 13, baseline: ua > mean ? 'bottom' : 'top', dy: ua > mean ? -3 : 4 }); }
          else R.corner('u(a) = −∞ (a is a zero of f)', 'bl', { color: 'blue' });
          const ok = !(ua > mean + 1e-9);
          L.corner(F.kind === 'harm' ? 'harmonic: equality in (c)' : F.kind === 'super' ? 'superharmonic: (c) fails' : 'subharmonic', 'tl', { color: F.kind === 'super' ? 'red' : 'green', weight: 600 });
          st = { ua, mean, ok, r, kind: F.kind, key: which.value, inside };
          v.legend([['accent', '$u$ on the circle'], ['green', 'mean $\\frac1{2\\pi}\\int u(a+re^{i\\theta})\\,d\\theta$'], [good ? 'blue' : 'red', '$u(a)$', { dash: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const head = `$u(a) = ${isFinite(s.ua) ? v.fix(s.ua, 4) : '-\\infty'}$, $\\;$ mean $= ${v.fix(s.mean, 4)}$`;
          if (s.key === 'logf') {
            const gap = s.inside.reduce((acc, d) => acc + Math.log(s.r / d), 0);
            return head + (s.inside.length ? ` — ${s.inside.length} zero${s.inside.length > 1 ? 's' : ''} in the disc, gap $=\\sum\\log\\frac{r}{|\\alpha-a|} = ${isFinite(gap) ? v.fix(gap, 4) : '\\infty'}$ (Jensen).` : ' — no zero in the disc, so $\\log|f|$ is harmonic there and (c) is an equality.');
          }
          if (s.kind === 'super') return head + ' — the centre value *exceeds* the mean: $-|z|^2$ is superharmonic, not subharmonic.';
          if (s.kind === 'harm') return head + ' — equality, as for every harmonic function.';
          return head + `, gap $= ${v.fix(s.mean - s.ua, 4)}\\ge 0$.`;
        });
      },
    },
    {
      num: '17.3',
      kind: 'Theorem',
      name: 'Increasing convex functions of subharmonic functions',
      verify: true,
      statement: String.raw`Suppose $u$ is subharmonic in $\Omega$ and $\varphi$ is a monotonically increasing convex function on $\R$, with $\varphi(-\infty)=\lim_{t\to-\infty}\varphi(t)$. Then $\varphi\circ u$ is subharmonic in $\Omega$.

In particular, if $f\in H(\Omega)$ then $\log^+|f|=\max(\log|f|,0)$ and $|f|^p$ $(0<p<\infty)$ are subharmonic in $\Omega$, since $\log|f|$ is (when $f\not\equiv0$ on every component; $|f|^p$ is trivially subharmonic where $f\equiv0$).`,
      idea: String.raw`$\varphi$ is continuous and increasing, so $\varphi\circ u$ is again upper semicontinuous. For the mean value inequality chain two facts: since $\varphi$ increases, $\varphi(u(a))\le\varphi\big(\tfrac1{2\pi}\int u\big)$; since $\varphi$ is convex, Jensen's inequality (3.3) for the probability measure $d\theta/2\pi$ gives $\varphi\big(\tfrac1{2\pi}\int u\big)\le\tfrac1{2\pi}\int\varphi\circ u$. Taking $u=\log|f|$ (subharmonic by Jensen's formula) and $\varphi(t)=e^{pt}$ or $\varphi(t)=\max(t,0)$ gives $|f|^p$ and $\log^+|f|$.`,
      caption: String.raw`Here $u=\log|f|$ with $f(z)=1.8(z-\alpha_1)(z-\alpha_2)$. Drag $a$ and change $r$; the right panel plots $\varphi$ together with the 72 points $\big(u(\zeta),\varphi(u(\zeta))\big)$ for $\zeta$ on the circle (gold). Their centre of mass (green) lies above the graph — that is Jensen's inequality — and to the right of $u(a)$ — that is subharmonicity of $u$. Choosing a decreasing or a non-convex $\varphi$ moves the disc to a spot where the chain breaks: next to a zero ($1/|f|$ exceeds its circle mean) or in a zero-free region where $u>0$ is harmonic and $\arctan$ is concave.`,
      deps: ['rca-17.2', 'rca-3.3', 'rca-15.18'],
      tags: ['subharmonic', 'convexity'],
      viz(v) {
        const Z = [[-0.5, 0.38], [0.52, -0.32]];
        const u = (x, y) => Math.log(1.8) + Math.log(Math.hypot(x - Z[0][0], y - Z[0][1])) + Math.log(Math.hypot(x - Z[1][0], y - Z[1][1]));
        const P = v.slider('exponent $p$', 0.2, 3, 1, { step: 0.05 });
        const PHI = {
          exp: { label: '$e^{pt}$ ($|f|^p$)', f: (t) => Math.exp(P.value * t), ok: true, name: () => `|f|^{${v.fix(P.value, 2)}}` },
          pos: { label: '$\\max(t,0)$ ($\\log^+|f|$)', f: (t) => Math.max(t, 0), ok: true, name: () => '\\log^+|f|' },
          dec: { label: '$e^{-t}$ (decreasing)', f: (t) => Math.exp(-t), ok: false, name: () => '1/|f|' },
          atan: { label: '$\\arctan t$ (not convex)', f: (t) => Math.atan(t), ok: false, name: () => '\\arctan\\log|f|' },
        };
        const DEMO = { dec: [-0.47, 0.35, 0.3], atan: [-0.9, -0.8, 0.3] }; // discs where the chain breaks
        const which = v.select('$\\varphi$', Object.entries(PHI).map(([value, o]) => ({ value, label: o.label })), 'exp', { onChange: (k) => { if (DEMO[k]) { a.set(DEMO[k][0], DEMO[k][1]); rS.set(DEMO[k][2]); } } });
        const rS = v.slider('radius $r$', 0.08, 0.95, 0.55, { step: 0.01 });
        const L = v.stage({ x: [-1.45, 1.45], y: [-1.2, 1.2], equal: true, height: 330, title: 'heat map of $\\varphi\\circ u$; the circle $|z-a|=r$' });
        const R = v.stage({ x: [-3, 2], y: [0, 3], height: 330, axes: 'box', xlabel: 't', title: 'graph of $\\varphi$ and the points $(u,\\varphi(u))$ on the circle' });
        const a = L.handle(-0.22, 0.22, { color: 'blue', label: 'a', labelPos: 'ne' });
        let st = null;
        v.render(() => {
          const key = which.value, F = PHI[key], phi = F.f, r = rS.value;
          P.el.hidden = key !== 'exp';
          // left: heat of φ∘u, colour range from the visible values of u
          const lo = phi(-2.5), hi = phi(1.6);
          L.heat((x, y) => phi(u(x, y)), { range: [Math.min(lo, hi), Math.max(lo, hi)], cmap: 'viridis', res: 2, key: key + P.value });
          Z.forEach((z) => xMark(L, z[0], z[1], 'ink'));
          haloCircle(L, a.x, a.y, r, 'ink', 2.2);
          // circle statistics
          const n = 1440; let su = 0, sp = 0;
          for (let k = 0; k < n; k++) { const t = TAU * (k + 0.5) / n, w = u(a.x + r * Math.cos(t), a.y + r * Math.sin(t)); su += w; sp += phi(w); }
          let ubar = Math.log(1.8); const ins = [];
          for (const z of Z) { const d = Math.hypot(a.x - z[0], a.y - z[1]); ubar += Math.max(Math.log(r), Math.log(d)); if (d < r) ins.push(d); }
          const pbar = sp / n, ua = u(a.x, a.y);
          const samp = [];
          for (let k = 0; k < 72; k++) { const t = TAU * k / 72, w = u(a.x + r * Math.cos(t), a.y + r * Math.sin(t)); if (isFinite(w)) samp.push([w, phi(w)]); }
          // right: φ, sample points, centroid
          const xs = samp.map((p) => p[0]).concat([ubar, isFinite(ua) ? ua : ubar]);
          let x0 = Math.min(...xs), x1 = Math.max(...xs); x0 = Math.max(x0, ubar - 4);
          const padx = Math.max(0.25, (x1 - x0) * 0.12); x0 -= padx; x1 += padx;
          const ys = [phi(x0), phi(x1), pbar, phi(ubar)].concat(samp.map((p) => p[1])).filter(isFinite);
          let y0 = Math.min(...ys), y1 = Math.max(...ys); const pady = Math.max(0.05, (y1 - y0) * 0.12);
          R.setView([x0, x1], [y0 - pady, y1 + pady]);
          R.fn(phi, { color: 'ink', width: 2.2 });
          R.dots(samp, { color: 'gold', r: 3.2 });
          const ok1 = !(phi(isFinite(ua) ? ua : -1e9) > phi(ubar) + 1e-9), ok2 = !(phi(ubar) > pbar + 1e-9), ok = !((isFinite(ua) ? phi(ua) : phi(-1e9)) > pbar + 1e-9);
          if (isFinite(ua)) { R.vline(ua, { color: 'blue', width: 1.2, dash: [3, 4] }); R.dot(ua, phi(ua), { color: 'blue', r: 5.5 }); R.tex('u(a)', ua, R.bounds.y[0], { color: 'blue', size: 13, baseline: 'bottom', align: ua < ubar ? 'right' : 'left', dx: ua < ubar ? -4 : 4, dy: -20 }); }
          R.vline(ubar, { color: 'green', width: 1.2, dash: [3, 4] });
          R.dot(ubar, phi(ubar), { color: 'ink', r: 5, hollow: true });
          R.dot(ubar, pbar, { color: ok2 ? 'green' : 'red', r: 7, label: 'centre of mass', labelPos: ubar > (x0 + x1) / 2 ? 'nw' : 'ne', math: false, labelSize: 12 });
          R.tex('\\bar u', ubar, R.bounds.y[0], { color: 'green', size: 13, baseline: 'bottom', align: ua < ubar ? 'left' : 'right', dx: ua < ubar ? 4 : -4, dy: -20 });
          L.setTitle(`heat map of $\\varphi\\circ u=${F.name()}$; the circle $|z-a|=r$`);
          R.corner(ok ? 'sub-mean-value inequality holds' : 'φ∘u(a) > mean: not subharmonic', 'tl', { color: ok ? 'green' : 'red', weight: 600 });
          st = { ua, ubar, pbar, F, ok, ok1, ok2, ins: ins.length };
          v.legend([['ink', '$y=\\varphi(t)$'], ['gold', '$(u(\\zeta),\\varphi(u(\\zeta)))$, $|\\zeta-a|=r$', { dot: true }], ['blue', '$(u(a),\\varphi(u(a)))$', { dot: true }], ['green', '$(\\bar u,\\ \\overline{\\varphi\\circ u})$: the means', { dot: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const pa = isFinite(s.ua) ? v.fix(s.F.f(s.ua), 4) : v.fix(s.F.f(-1e9), 4);
          const rel = (b) => (b ? '\\le' : '>');
          return `$\\varphi(u(a)) = ${pa} \\;${rel(s.ok1)}\\; \\varphi(\\bar u) = ${v.fix(s.F.f(s.ubar), 4)} \\;${rel(s.ok2)}\\; \\overline{\\varphi\\circ u} = ${v.fix(s.pbar, 4)}$. ` +
            (s.ins ? `The disc contains ${s.ins} zero${s.ins > 1 ? 's' : ''}, so $u(a)<\\bar u$.` : 'No zero in the disc: $u$ is harmonic there and $u(a)=\\bar u$.') +
            (s.ok1 ? '' : ' A decreasing $\\varphi$ reverses the first inequality.') + (s.ok2 ? '' : ' A non-convex $\\varphi$ breaks Jensen\'s inequality.');
        });
      },
    },
    {
      num: '17.4',
      kind: 'Theorem',
      name: 'Harmonic majorants of continuous subharmonic functions',
      verify: true,
      statement: String.raw`Suppose $u$ is a continuous subharmonic function in $\Omega$, $K$ is a compact subset of $\Omega$, and $h$ is a continuous real function on $K$ which is harmonic in the interior of $K$. If $u(z)\le h(z)$ at every boundary point $z$ of $K$, then $u(z)\le h(z)$ for every $z\in K$.`,
      idea: String.raw`Put $w=u-h$ on $K$; it is continuous, and in the interior of $K$ it still satisfies the sub-mean-value inequality on small discs (harmonic functions have the exact mean value property). If $w$ had a positive maximum $m$ at an interior point, the set where $w=m$ would be closed, and open in the interior because a value $\le m$ can only *average* to $m$ if it equals $m$ on every small circle. Following this set to the boundary contradicts $w\le0$ on $\partial K$. So the maximum of $u-h$ over $K$ is attained on $\partial K$.`,
      caption: String.raw`$K$ is the closed disc with the draggable centre and radius; $h$ is the harmonic function in $K$ with $h=u$ on $\partial K$ (computed as a Poisson integral). Inside $K$ the colour shows $h-u$: green where $h\ge u$, red where $u$ pokes above $h$. Right: $u$ and $h$ along the horizontal diameter of $K$. For every subharmonic choice the green never turns red; the superharmonic $-|f|^2$ does the opposite.`,
      deps: ['rca-17.2', 'rca-11.12'],
      tags: ['subharmonic', 'maximum principle'],
      viz(v) {
        const f = (x, y) => [x * x - y * y + 0.3 * x - 0.35, 2 * x * y + 0.3 * y]; // z² + 0.3z − 0.35
        const U = {
          abs2: { label: '$|f|^2$', u: (x, y) => { const [a, b] = f(x, y); return a * a + b * b; }, sub: true },
          logp: { label: '$\\log^+|3f|$', u: (x, y) => { const [a, b] = f(x, y); return Math.max(0, Math.log(3 * Math.hypot(a, b))); }, sub: true },
          maxh: { label: '$\\max(\\Re z,\\Re z^2)$', u: (x, y) => Math.max(x, x * x - y * y), sub: true },
          sup: { label: '$-|f|^2$ (superharmonic)', u: (x, y) => { const [a, b] = f(x, y); return -(a * a + b * b); }, sub: false },
        };
        const which = v.select('$u$', Object.entries(U).map(([value, o]) => ({ value, label: o.label })), 'logp');
        const L = v.stage({ x: [-1.6, 1.6], y: [-1.25, 1.25], equal: true, height: 340, title: '$h-u$ inside $K$ (green $\\ge0$, red $<0$); $u$ outside' });
        const R = v.stage({ x: [-1, 1], y: [0, 1], height: 340, axes: 'box', title: '$u$ and $h$ along the horizontal diameter of $K$' });
        const c = L.handle(-0.05, 0.08, { color: 'ink', label: 'c', labelPos: 'sw' });
        const rad = L.handle(-0.05 + 0.85, 0.08 + 0.3, { color: 'gold', r: 6 });
        let prev = [c.x, c.y];
        c.onDrag = () => { rad.x += c.x - prev[0]; rad.y += c.y - prev[1]; prev = [c.x, c.y]; };
        let st = null;
        v.render(() => {
          const F = U[which.value]; prev = [c.x, c.y];
          const Rr = Math.max(0.2, Math.hypot(rad.x - c.x, rad.y - c.y));
          const NS = 512, vals = new Float64Array(NS);
          for (let j = 0; j < NS; j++) { const t = TAU * j / NS; vals[j] = F.u(c.x + Rr * Math.cos(t), c.y + Rr * Math.sin(t)); }
          const fd = fourier(vals, 160);
          const h = (x, y) => harmExt(fd, Math.min(1, Math.hypot(x - c.x, y - c.y) / Rr), Math.atan2(y - c.y, x - c.x));
          // max of u − h over a polar grid of K, and the scale of |h − u|
          let best = -Infinity, bp = [c.x, c.y], scale = 1e-9;
          for (let i = 0; i <= 36; i++) {
            const rho = Rr * i / 36;
            for (let j = 0; j < (i ? 96 : 1); j++) { const t = TAU * j / 96, x = c.x + rho * Math.cos(t), y = c.y + rho * Math.sin(t); const d = F.u(x, y) - h(x, y); scale = Math.max(scale, Math.abs(d)); if (d > best + 1e-12 * scale) { best = d; bp = [x, y]; } }
          }
          const G = v.rgb('green'), Rd = v.rgb('red'), bg = v.rgb('panel'), gr = v.rgb('muted');
          let ulo = Infinity, uhi = -Infinity;
          for (let k = 0; k < 400; k++) { const w = F.u(-1.6 + 3.2 * (k % 20) / 19, -1.25 + 2.5 * Math.floor(k / 20) / 19); ulo = Math.min(ulo, w); uhi = Math.max(uhi, w); }
          L.raster((x, y) => {
            const dx = x - c.x, dy = y - c.y;
            if (dx * dx + dy * dy <= Rr * Rr) {
              const d = h(x, y) - F.u(x, y), t = Math.min(1, Math.abs(d) / scale);
              return mixRGB(bg, d >= -1e-4 * scale ? G : Rd, 0.18 + 0.72 * Math.pow(t, 0.6));
            }
            return mixRGB(bg, gr, 0.08 + 0.42 * (F.u(x, y) - ulo) / (uhi - ulo || 1));
          }, { res: 2, key: `${which.value}|${c.x},${c.y},${Rr}` });
          haloCircle(L, c.x, c.y, Rr, 'ink', 2.2);
          L.tex('\\partial K', c.x + Rr * Math.cos(2.4), c.y + Rr * Math.sin(2.4), { color: 'ink', size: 14, dx: -14, dy: -10 });
          L.line(c.x - Rr, c.y, c.x + Rr, c.y, { color: 'ink', width: 1, dash: [3, 4], alpha: 0.7 });
          const inner = Math.hypot(bp[0] - c.x, bp[1] - c.y) < Rr * 0.98;
          L.dot(bp[0], bp[1], { color: best > 1e-6 * scale && inner ? 'red' : 'green', r: 5, label: 'max(u−h)', labelPos: 'ne', math: false, labelSize: 12 });
          // right: the diameter slice
          const xs = v.M.linspace(-Rr, Rr, 241);
          const us = xs.map((s) => F.u(c.x + s, c.y)), hs = xs.map((s) => h(c.x + s, c.y));
          const all = us.concat(hs); let y0 = Math.min(...all), y1 = Math.max(...all); const pd = Math.max(0.05, (y1 - y0) * 0.15);
          R.setView([-Rr * 1.22, Rr * 1.12], [y0 - pd, y1 + pd * 2.2]);
          R.vline(-Rr, { color: 'ink', width: 1, dash: [2, 4], alpha: 0.6 }); R.vline(Rr, { color: 'ink', width: 1, dash: [2, 4], alpha: 0.6 });
          for (let i = 0; i + 1 < xs.length; i++) {
            const ok = hs[i] >= us[i] - 1e-4 * scale;
            R.poly([[xs[i], us[i]], [xs[i + 1], us[i + 1]], [xs[i + 1], hs[i + 1]], [xs[i], hs[i]]], { fill: ok ? 'green' : 'red', fillAlpha: 0.2, stroke: false });
          }
          R.path(xs.map((s, i) => [s, hs[i]]), { color: 'green', width: 2.4 });
          R.path(xs.map((s, i) => [s, us[i]]), { color: 'accent', width: 2.4 });
          R.dot(-Rr, us[0], { color: 'ink', r: 4 }); R.dot(Rr, us[us.length - 1], { color: 'ink', r: 4 });
          R.tex('\\partial K', -Rr, R.bounds.y[1], { color: 'ink', size: 13, baseline: 'top', align: 'left', dx: 5, dy: 4 });
          R.tex('\\partial K', Rr, R.bounds.y[1], { color: 'ink', size: 13, baseline: 'top', align: 'right', dx: -5, dy: 4 });
          st = { best, scale, inner, sub: F.sub, gc: h(c.x, c.y) - F.u(c.x, c.y) };
          v.legend([['accent', '$u$'], ['green', '$h$ (harmonic, $=u$ on $\\partial K$)'], ['green', '$h\\ge u$', { area: true }], ['red', '$u>h$', { area: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return s.best > 1e-6 * s.scale && s.inner
            ? `$\\max_K(u-h) = ${v.fix(s.best, 4)} > 0$ at an interior point: a superharmonic function rises *above* the harmonic function with the same boundary values.`
            : `$u=h$ on $\\partial K$ and $h-u\\ge0$ inside (at the centre $h(c)-u(c) = ${v.fix(s.gc, 4)}$): the maximum of $u-h$ over $K$ is $0$, attained on $\\partial K$.`;
        });
      },
    },
    {
      num: '17.5',
      kind: 'Theorem',
      name: 'Circle means of a subharmonic function increase',
      verify: true,
      statement: String.raw`Suppose $u$ is a continuous subharmonic function in the open unit disc $U$, and put
$$m(r)=\frac1{2\pi}\int_{-\pi}^{\pi}u(re^{i\theta})\,d\theta\qquad(0\le r<1).$$
If $0\le r_1<r_2<1$, then $m(r_1)\le m(r_2)$.`,
      idea: String.raw`Let $h$ be the Poisson integral of the restriction of $u$ to the circle $|z|=r_2$: it is continuous on $\overline D(0;r_2)$, harmonic inside, and equal to $u$ on the circle (11.8). By 17.4, $u\le h$ on the whole closed disc. Averaging over $|z|=r_1$ and using the mean value property of $h$,
$$m(r_1)\le\frac1{2\pi}\int h(r_1e^{i\theta})\,d\theta=h(0)=\frac1{2\pi}\int u(r_2e^{i\theta})\,d\theta=m(r_2).$$`,
      caption: String.raw`Drag the two radii $r_1<r_2$ along the real axis. The middle panel shows the proof: on the inner circle, $u$ (blue) stays below the harmonic extension $h$ of $u|_{|z|=r_2}$ (green), and the mean of $h$ there is exactly $m(r_2)$. The bottom panel is the whole function $m(r)$ — nondecreasing for every subharmonic $u$, decreasing for the superharmonic $1-|z|^2$.`,
      deps: ['rca-17.4', 'rca-11.8'],
      tags: ['subharmonic', 'integral means'],
      viz(v) {
        const U = {
          absf: { label: '$|z^2-\\frac14+\\frac i3 z|$', u: (x, y) => Math.hypot(x * x - y * y - 0.25 - y / 3, 2 * x * y + x / 3), sub: true },
          logp: { label: '$\\log^+|2z^3+1.2|$', u: (x, y) => Math.max(0, Math.log(Math.hypot(2 * (x * x * x - 3 * x * y * y) + 1.2, 2 * (3 * x * x * y - y * y * y)))), sub: true },
          maxh: { label: '$\\max(\\Re z^3,\\Im z)$', u: (x, y) => Math.max(x * x * x - 3 * x * y * y, y), sub: true },
          sup: { label: '$1-|z|^2$ (superharmonic)', u: (x, y) => 1 - x * x - y * y, sub: false },
        };
        const which = v.select('$u$', Object.entries(U).map(([value, o]) => ({ value, label: o.label })), 'absf');
        const L = v.stage({ x: [-1.08, 1.08], y: [-1.08, 1.08], equal: true, height: 300, axes: false, title: '$u$ in $U$, circles $|z|=r_1$, $|z|=r_2$' });
        const Mid = v.stage({ x: [-Math.PI, Math.PI], y: [0, 1], height: 300, axes: 'box', xticks: PI_TICKS, xlabel: 'θ', weight: 1.25, title: 'on $|z|=r_1$: $u$ vs. the harmonic extension $h$ of $u|_{|z|=r_2}$' });
        const B = v.stage({ x: [0, 1], y: [0, 1], height: 190, axes: 'box', full: true, xlabel: 'r', title: '$m(r)=\\frac1{2\\pi}\\int u(re^{i\\theta})\\,d\\theta$' });
        const h1 = L.handle(0.42, 0, { color: 'blue', label: 'r₁', labelPos: 's', constrain: (x) => [v.M.clamp(x, 0.02, 0.96), 0] });
        const h2 = L.handle(0.82, 0, { color: 'green', label: 'r₂', labelPos: 's', constrain: (x) => [v.M.clamp(x, 0.04, 0.98), 0] });
        let st = null;
        v.render(() => {
          const F = U[which.value];
          let r1 = h1.x, r2 = h2.x; if (r1 > r2) [r1, r2] = [r2, r1];
          const all = []; for (let k = 0; k < 900; k++) { const x = -1 + 2 * (k % 30) / 29, y = -1 + 2 * Math.floor(k / 30) / 29; if (x * x + y * y < 1) all.push(F.u(x, y)); }
          const lo = Math.min(...all), hi = Math.max(...all);
          L.raster((x, y) => (x * x + y * y < 1 ? v.M.cmap((F.u(x, y) - lo) / (hi - lo || 1), 'viridis') : null), { res: 2, key: which.value });
          L.circle(0, 0, 1, { color: 'muted', width: 1.2, dash: [4, 4] });
          haloCircle(L, 0, 0, r1, 'blue', 2.2); haloCircle(L, 0, 0, r2, 'green', 2.2);
          // harmonic extension of u|_{|z|=r2}
          const NS = 512, vals = new Float64Array(NS);
          for (let j = 0; j < NS; j++) { const t = TAU * j / NS; vals[j] = F.u(r2 * Math.cos(t), r2 * Math.sin(t)); }
          const fd = fourier(vals, 128);
          const ts = v.M.linspace(-Math.PI, Math.PI, 361);
          const us = ts.map((t) => F.u(r1 * Math.cos(t), r1 * Math.sin(t))), hs = ts.map((t) => harmExt(fd, r1 / r2, t));
          const m1 = meanU((t) => F.u(r1 * Math.cos(t), r1 * Math.sin(t)), 512), m2 = fd.a[0];
          const ys = us.concat(hs, [m1, m2]); let y0 = Math.min(...ys), y1 = Math.max(...ys); const pd = Math.max(0.04, (y1 - y0) * 0.14);
          Mid.setView(null, [y0 - pd, y1 + pd]);
          Mid.between((t) => hs[Math.round((t + Math.PI) / TAU * 360)], (t) => us[Math.round((t + Math.PI) / TAU * 360)], -Math.PI, Math.PI, { fill: F.sub ? 'green' : 'red', fillAlpha: 0.13, n: 360 });
          Mid.path(ts.map((t, i) => [t, hs[i]]), { color: 'green', width: 2.2 });
          Mid.path(ts.map((t, i) => [t, us[i]]), { color: 'blue', width: 2.4 });
          Mid.hline(m2, { color: 'green', width: 1.4, dash: [6, 4] });
          Mid.hline(m1, { color: 'blue', width: 1.4, dash: [6, 4] });
          const up = m2 >= m1;
          Mid.tex('h(0)=m(r_2)', Math.PI, m2, { color: 'green', size: 13, align: 'right', baseline: up ? 'bottom' : 'top', dx: -6, dy: up ? -3 : 3 });
          Mid.tex('m(r_1)', -Math.PI, m1, { color: 'blue', size: 13, align: 'left', baseline: up ? 'top' : 'bottom', dx: 6, dy: up ? 3 : -3 });
          // bottom: m(r)
          const rs = v.M.linspace(0, 0.985, 120), ms = rs.map((r) => meanU((t) => F.u(r * Math.cos(t), r * Math.sin(t)), 256));
          let b0 = Math.min(...ms), b1 = Math.max(...ms); const bp = Math.max(0.03, (b1 - b0) * 0.15);
          B.setView([0, 1], [b0 - bp, b1 + bp]);
          B.path(rs.map((r, i) => [r, ms[i]]), { color: F.sub ? 'ink' : 'red', width: 2.4 });
          B.vline(r1, { color: 'blue', width: 1, dash: [3, 4] }); B.vline(r2, { color: 'green', width: 1, dash: [3, 4] });
          B.dot(r1, m1, { color: 'blue', r: 5.5, label: 'm(r₁)', labelPos: 'nw' });
          B.dot(r2, m2, { color: 'green', r: 5.5, label: 'm(r₂)', labelPos: 'nw' });
          let mono = true; for (let i = 1; i < ms.length; i++) if (ms[i] < ms[i - 1] - 1e-9) mono = false;
          B.corner(mono ? 'm(r) is nondecreasing' : 'm(r) decreases — u is not subharmonic', mono ? 'tl' : 'tr', { color: mono ? 'green' : 'red', weight: 600 });
          let minGap = Infinity; for (let i = 0; i < hs.length; i++) minGap = Math.min(minGap, hs[i] - us[i]);
          st = { r1, r2, m1, m2, minGap, sub: F.sub };
          v.legend([['blue', '$u$ on $|z|=r_1$'], ['green', '$h$ on $|z|=r_1$'], [F.sub ? 'ink' : 'red', '$m(r)$']]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `$r_1 = ${v.fix(s.r1, 2)}$, $r_2 = ${v.fix(s.r2, 2)}$: $\\;\\min_\\theta\\,(h-u)(r_1e^{i\\theta}) = ${v.fix(s.minGap, 4)}$, $\\;m(r_1) = ${v.fix(s.m1, 4)} ${s.m1 <= s.m2 + 1e-12 ? '\\le' : '>'} m(r_2) = h(0) = ${v.fix(s.m2, 4)}$.`;
        });
      },
    },
    {
      num: '17.6',
      kind: 'Theorem',
      name: 'Integral means of holomorphic functions increase',
      verify: true,
      statement: String.raw`Let $f\in H(U)$ and, for $0\le r<1$ and $0<p<\infty$, put
$$M_p(f;r)=\Big\{\frac1{2\pi}\int_{-\pi}^{\pi}|f(re^{i\theta})|^p\,d\theta\Big\}^{1/p},\qquad M_0(f;r)=\exp\Big\{\frac1{2\pi}\int_{-\pi}^{\pi}\log^+|f(re^{i\theta})|\,d\theta\Big\},$$
and $M_\infty(f;r)=\max_\theta|f(re^{i\theta})|$. Then each of $M_0(f;r)$, $M_p(f;r)$ $(0<p\le\infty)$ is a nondecreasing function of $r$ on $[0,1)$.`,
      idea: String.raw`$|f|^p$ and $\log^+|f|$ are *continuous* subharmonic functions (17.3), so their circle means increase by 17.5; the case $p=\infty$ is the maximum modulus theorem. For fixed $r$ the means also increase with $p$, because $d\theta/2\pi$ is a probability measure (Hölder, or Jensen's inequality). Together these monotonicities make $\sup_r M_p(f;r)=\lim_{r\to1}M_p(f;r)$, which is how the $H^p$-norms of 17.7 are computed.`,
      caption: String.raw`Choose $f$ and drag the circle radius $r$. On the right, $\log_{10}$ of the integral means as functions of $r$: every curve rises (in $r$) and the curves are stacked in the order of $p$. For $\frac1{1-z}$ the means with $p\ge1$ blow up as $r\to1$ while $M_{1/2}$ stays bounded; the inner function $e^{-\frac{1+z}{1-z}}$ climbs to $1$. The last choice, $1-|z|^2$, is not holomorphic, and its means *decrease*.`,
      deps: ['rca-17.3', 'rca-17.5', 'rca-10.24'],
      tags: ['integral means', 'subharmonic'],
      viz(v) {
        const { Cx } = v.M;
        const one = new Cx(1, 0);
        const FN = {
          poly: { label: '$z^3-\\frac12z+0.3$', f: (z) => z.pow(3).sub(z.scale(0.5)).add(0.3), hol: true },
          pole: { label: '$\\frac{1}{1-z}$', f: (z) => one.div(one.sub(z)), hol: true },
          sing: { label: '$e^{-\\frac{1+z}{1-z}}$', f: (z) => one.add(z).div(one.sub(z)).neg().exp(), hol: true },
          nonh: { label: '$1-|z|^2$ (not holomorphic)', f: (z) => new Cx(1 - z.abs2(), 0), hol: false },
        };
        const which = v.select('$f$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'pole');
        const L = v.stage({ x: [-1.12, 1.12], y: [-1.12, 1.12], equal: true, height: 330, axes: false, title: 'phase portrait of $f$ in $U$ and the circle $|z|=r$' });
        const R = v.stage({ x: [0, 1.1], y: [-1, 2], height: 330, axes: 'box', xlabel: 'r', weight: 1.3, xticks: [0.2, 0.4, 0.6, 0.8, 1], title: '$\\log_{10}M_p(f;r)$ against $r$' });
        const hr = L.handle(0.72, 0, { color: 'ink', label: 'r', labelPos: 'se', constrain: (x) => [v.M.clamp(x, 0, 0.985), 0] });
        const PS = [[0.5, 'purple', 'M_{1/2}'], [1, 'blue', 'M_1'], [2, 'teal', 'M_2'], [4, 'orange', 'M_4'], [Infinity, 'ink', 'M_\\infty'], [0, 'gold', 'M_0']];
        let st = null, cache = {};
        v.render(() => {
          const key = which.value, F = FN[key];
          if (F.hol) L.raster((x, y) => { if (x * x + y * y >= 1) return null; const w = F.f(new Cx(x, y)); return phaseRGB(v.M, w.re, w.im); }, { key, res: 1 });
          else L.raster((x, y) => (x * x + y * y < 1 ? v.M.cmap(1 - x * x - y * y, 'viridis') : null), { key, res: 2 });
          L.circle(0, 0, 1, { color: 'ink', width: 1.2, dash: [5, 4] });
          haloCircle(L, 0, 0, Math.max(hr.x, 0.004), 'ink', 2.4);
          // curves (cached per function)
          if (!cache[key]) {
            const rs = v.M.linspace(0, 0.985, 90), curves = PS.map(() => []);
            for (const r of rs) {
              const mod = (t) => F.f(Cx.polar(r, t)).abs();
              PS.forEach(([p], j) => {
                let val;
                if (p === Infinity) { let m = 0; for (let k = 0; k < 2000; k++) m = Math.max(m, mod(-Math.PI + TAU * k / 2000)); m = Math.max(m, mod(0)); val = m; }
                else if (p === 0) val = Math.exp(meanC((t) => Math.max(0, Math.log(mod(t)))));
                else val = Math.pow(meanC((t) => Math.pow(mod(t), p)), 1 / p);
                curves[j].push([r, Math.log10(val)]);
              });
            }
            cache[key] = curves;
          }
          const curves = cache[key];
          const ys = curves.flat().map((p) => p[1]).filter(isFinite);
          let y0 = Math.min(...ys), y1 = Math.max(...ys); const pd = Math.max(0.08, (y1 - y0) * 0.1);
          R.setView(null, [y0 - pd, y1 + pd]);
          const r = hr.x; R.vline(r, { color: 'muted', width: 1, dash: [3, 4] });
          const vals = [], labs = [];
          curves.forEach((pts, j) => {
            const [, col, lab] = PS[j];
            R.path(pts, { color: col, width: j === 5 ? 2 : 2.3, dash: j === 5 ? [6, 4] : undefined });
            // value at r by interpolation
            const i = Math.min(pts.length - 2, Math.floor(r / 0.985 * (pts.length - 1)));
            const t = (r - pts[i][0]) / (pts[i + 1][0] - pts[i][0]);
            const yv = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t; vals.push(yv);
            R.dot(r, yv, { color: col, r: 4 });
            labs.push({ tex: lab, y: pts[pts.length - 1][1], color: col });
          });
          spreadLabels(R, labs, { x: 0.985, align: 'left', dx: 5, gap: 15 });
          let mono = true; for (const pts of curves) for (let i = 1; i < pts.length; i++) if (pts[i][1] < pts[i - 1][1] - 1e-7) mono = false;
          R.corner(mono ? 'every mean is nondecreasing in r' : 'means decrease: f is not holomorphic', 'tl', { color: mono ? 'green' : 'red', weight: 600 });
          st = { r, vals, mono };
          v.legend(PS.map(([p, col, lab], j) => [col, `$${lab}(f;r)$`, j === 5 ? { dash: true } : undefined]));
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const f = (y) => v.fmt(10 ** y, 4);
          return `At $r = ${v.fix(s.r, 3)}$: $M_0 = ${f(s.vals[5])}$, $M_{1/2} = ${f(s.vals[0])}$, $M_1 = ${f(s.vals[1])}$, $M_2 = ${f(s.vals[2])}$, $M_4 = ${f(s.vals[3])}$, $M_\\infty = ${f(s.vals[4])}$.`;
        });
      },
    },
  ],
};
