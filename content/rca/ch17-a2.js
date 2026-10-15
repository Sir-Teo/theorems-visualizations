// Rudin, Real and Complex Analysis — Chapter 17 (part 2: the spaces H^p and N, the theorem of F. and M. Riesz)

// ---------------------------------------------------------------- helpers shared by this file
const TAU = 2 * Math.PI;
const PI_TICKS = [[-Math.PI, '−π'], [-Math.PI / 2, '−π/2'], [0, '0'], [Math.PI / 2, 'π/2'], [Math.PI, 'π']];
/** r = 1 − 10^{−x}: the abscissa used for "r → 1" charts. */
const rOf = (x) => 1 - Math.pow(10, -x);
const R_TICKS = [[0, '0'], [1, '0.9'], [2, '0.99'], [3, '0.999'], [4, '0.9999']];
/** Nodes θ = c + π s³ (s ∈ [−1,1]) with Simpson weights, clustered at θ = c; returns {th, w} with Σ w = 1. */
function nodes(n = 480, c = 0, pw = 3) {
  const th = [], w = []; const h = 2 / n;
  for (let i = 0; i <= n; i++) {
    const s = -1 + i * h, jac = pw * Math.PI * Math.pow(Math.abs(s), pw - 1); if (!jac) continue;
    th.push(c + Math.PI * Math.sign(s) * Math.pow(Math.abs(s), pw)); w.push((i === 0 || i === n ? 1 : i % 2 ? 4 : 2) * jac * h / 3 / TAU);
  }
  return { th, w };
}
/** Mean of g over the circle, nodes clustered at θ = c. */
function meanC(g, n = 480, c = 0) { const { th, w } = nodes(n, c); let s = 0; for (let i = 0; i < th.length; i++) s += w[i] * g(th[i]); return s; }
/** log of the mean of exp(L(θ)), computed without overflow (nodes clustered at θ = c). */
function logMeanExp(L, n = 480, c = 0) {
  const { th, w } = nodes(n, c); const vals = th.map(L); let mx = -Infinity;
  for (const x of vals) if (x > mx) mx = x;
  if (!isFinite(mx)) return mx;
  let s = 0; for (let i = 0; i < vals.length; i++) s += w[i] * Math.exp(vals[i] - mx);
  return mx + Math.log(s);
}
const poissonK = (r, t) => (1 - r * r) / (1 - 2 * r * Math.cos(t) + r * r);
// complex arithmetic on [re, im] pairs (fast enough for rasters)
const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cdiv = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
const cexp = (a) => { const e = Math.exp(a[0]); return [e * Math.cos(a[1]), e * Math.sin(a[1])]; };
const cabs = (a) => Math.hypot(a[0], a[1]);
/** (1 − z)^s for real s, principal branch (Re(1 − z) > 0 in U). */
const cpow1m = (x, y, s) => { const u = 1 - x, w = -y; const lr = 0.5 * Math.log(u * u + w * w), th = Math.atan2(w, u); return cexp([s * lr, s * th]); };
/** Herglotz kernel (e^{it} + z)/(e^{it} − z) of a unit point mass at e^{it}. */
const herg = (t, x, y) => { const c = Math.cos(t), s = Math.sin(t); return cdiv([c + x, s + y], [c - x, s - y]); };
/** Blaschke factor (z − a)/(1 − ā z). */
const bfac = (a, x, y) => cdiv([x - a[0], y - a[1]], [1 - (a[0] * x + a[1] * y), a[1] * x - a[0] * y]);
/** Phase-portrait colour (hue = arg w, bands = log2|w|). */
function phaseRGB(M, re, im) {
  if (!isFinite(re) || !isFinite(im)) return [250, 250, 250];
  const t = M.fract(Math.log2(Math.hypot(re, im) + 1e-300));
  return M.hsl2rgb(Math.atan2(im, re) / TAU, 0.62, 0.42 + 0.2 * Math.pow(t, 0.7));
}
/** Phase portrait of F(x, y) → [re, im] inside the unit disc (transparent outside). */
function discPhase(v, S, F, key, res = 2) { S.raster((x, y) => { if (x * x + y * y >= 1) return null; const w = F(x, y); return phaseRGB(v.M, w[0], w[1]); }, { key, res }); }
function haloCircle(S, x, y, r, color, width = 2.2, dash) { S.circle(x, y, r, { color: 'panel', width: width + 3, alpha: 0.9 }); S.circle(x, y, r, { color, width, dash }); }
const onCircle = (x, y) => { const t = Math.atan2(y, x); return [Math.cos(t), Math.sin(t)]; };
const inDisc = (m) => (x, y) => { const d = Math.hypot(x, y); return d > m ? [x * m / d, y * m / d] : [x, y]; };
function spreadLabels(S, labels, { x, gap = 15, align = 'right', dx = -3, size = 12.5 } = {}) {
  const it = labels.filter((l) => isFinite(l.y)).map((l) => ({ ...l, py: S.Y(l.y) })).sort((a, b) => a.py - b.py);
  for (let i = 1; i < it.length; i++) if (it[i].py - it[i - 1].py < gap) it[i].py = it[i - 1].py + gap;
  for (const l of it) S.texPx(l.tex, S.X(x), l.py, { color: l.color, size, align, dx });
}

export default {
  collection: 'rca',
  chapter: 17,
  items: [
    // ------------------------------------------------------------------ the spaces H^p and N
    {
      num: '17.7',
      kind: 'Definition',
      name: 'The Hardy spaces Hᵖ and the Nevanlinna class N',
      credit: 'F. Riesz, 1923',
      statement: String.raw`For $f\in H(U)$ and $0<p\le\infty$ let $M_p(f;r)$ be the integral means of 17.6. Then $H^p$ is the class of all $f\in H(U)$ for which
$$\|f\|_p=\sup_{0\le r<1}M_p(f;r)$$
is finite; in particular $H^\infty$ consists of the bounded holomorphic functions in $U$, with the supremum norm. The **Nevanlinna class** $N$ is the class of all $f\in H(U)$ for which
$$\sup_{0\le r<1}\frac1{2\pi}\int_{-\pi}^{\pi}\log^+|f(re^{i\theta})|\,d\theta<\infty .$$
Because $M_p(f;r)$ increases with $p$ and $\log^+x\le\frac1s x^s$ for $x>0$, one has $H^\infty\subset H^p\subset H^s\subset N$ whenever $0<s<p<\infty$.`,
      idea: String.raw`By 17.6 each $M_p(f;r)$ increases with $r$, so the supremum is the limit $r\to1$: membership in $H^p$ is a statement about how fast $|f|$ may grow near the circle *on average*. The inclusions come from comparing means on one circle: $d\theta/2\pi$ is a probability measure, so $L^p$-means increase with $p$ (Hölder, 3.5), and $\log^+$ grows more slowly than any power. The class $N$ is larger than every $H^p$: it only controls the logarithm of $|f|$.`,
      caption: String.raw`Pick an example and an exponent $p$. The chart plots $\log_{10}M_p(f;r)$ (blue) and the $\log^+$-mean that defines $N$ (gold), against $r$ on a scale that zooms into $r\to1$. A curve that levels off means membership; the strip below summarises for which $p$ the function lies in $H^p$, and whether it lies in $N$. For $(1-z)^{-\alpha}$ the cut-off is $p=1/\alpha$; $e^{\frac{1+z}{1-z}}$ is in $N$ but in no $H^p$; $e^{(\frac{1+z}{1-z})^2}$ is not even in $N$.`,
      deps: ['rca-17.6', 'rca-3.5'],
      tags: ['Hardy spaces', 'Nevanlinna class'],
      viz(v) {
        const { Cx } = v.M;
        const PL = [0.25, 1 / 3, 0.5, 2 / 3, 1, 1.5, 2, 3, 4, 6, 8, Infinity];
        const PLAB = ['1/4', '1/3', '1/2', '2/3', '1', '3/2', '2', '3', '4', '6', '8', '∞'];
        const one = new Cx(1, 0);
        const w = (z) => one.add(z).div(one.sub(z));
        const den = (r, t) => 1 - 2 * r * Math.cos(t) + r * r;
        const EX = {
          pow: { label: '$(1-z)^{-\\alpha}$', f: (z, a) => one.sub(z).pow(-a), L: (r, t, a) => -0.5 * a * Math.log(den(r, t)), mem: (p, a) => a <= 0 || p < 1 / a, N: true },
          log: { label: '$\\log\\frac1{1-z}$', f: (z) => one.sub(z).log().neg(), L: (r, t) => Math.log(Cx.polar(r, t).neg().add(1).log().abs()), mem: (p) => p < Infinity, N: true },
          expw: { label: '$e^{\\frac{1+z}{1-z}}$', f: (z) => w(z).exp(), L: (r, t) => poissonK(r, t), mem: () => false, N: true },
          expw2: { label: '$e^{(\\frac{1+z}{1-z})^2}$', f: (z) => w(z).pow(2).exp(), L: (r, t) => { const d = den(r, t), a = (1 - r * r) / d, b = 2 * r * Math.sin(t) / d; return a * a - b * b; }, mem: () => false, N: false },
        };
        const which = v.select('$f$', Object.entries(EX).map(([value, o]) => ({ value, label: o.label })), 'pow');
        const aS = v.slider('$\\alpha$', -0.5, 1.5, 0.6, { step: 0.05 });
        const pS = v.slider('$p$', 0, PL.length - 1, 6, { int: true, fmt: (k) => PLAB[k] });
        const L = v.stage({ x: [-1.08, 1.08], y: [-1.08, 1.08], equal: true, height: 290, axes: false, title: 'phase portrait of $f$ in $U$' });
        const C = v.stage({ x: [0, 4.6], y: [-0.5, 3], height: 290, axes: 'box', xticks: R_TICKS, xlabel: 'r', weight: 1.5, title: 'growth of $M_p(f;r)$ and of the $\\log^+$-mean as $r\\to1$ ($\\log_{10}$ scale)' });
        const S = v.stage({ x: [-0.36, 1.08], y: [0, 1], height: 92, axes: false, full: true });
        const XS = v.M.linspace(0.03, 4, 72);
        const YMAX = 6;
        let st = null;
        v.render(() => {
          const key = which.value, E = EX[key], a = aS.value, k = pS.value, p = PL[k];
          aS.el.hidden = key !== 'pow';
          L.raster((x, y) => { if (x * x + y * y >= 1) return null; const z = E.f(new Cx(x, y), a); return phaseRGB(v.M, z.re, z.im); }, { key: key + (key === 'pow' ? a : ''), res: 2 });
          L.circle(0, 0, 1, { color: 'ink', width: 1.2 });
          // curves
          const lp = [], l0 = [];
          for (const x of XS) {
            const r = rOf(x), Lf = (t) => E.L(r, t, a);
            let val;
            if (p === Infinity) val = Math.max(Lf(0), Lf(Math.PI), Lf(0.5 * (1 - r)));
            else val = logMeanExp((t) => p * Lf(t), 520) / p;
            lp.push([x, val / Math.LN10]);
            l0.push([x, meanC((t) => Math.max(0, Lf(t)), 520) / Math.LN10]);
          }
          const member = E.mem(p, a);
          let lim = null;
          if (member && key === 'pow') {
            if (p === Infinity) lim = Math.max(0, -a) * Math.log10(2);
            else lim = Math.log10(Math.exp(v.M.gamma(1 - a * p) > 0 ? Math.log(v.M.gamma(1 - a * p)) - 2 * Math.log(v.M.gamma(1 - a * p / 2)) : 0)) / p;
          }
          const ys = lp.concat(l0).map((q) => q[1]).filter((y) => isFinite(y) && y < YMAX);
          const y0 = Math.min(-0.2, ...ys) - 0.15, y1 = Math.min(YMAX, Math.max(1, ...ys, lim ?? -1) + 0.35);
          C.setView(null, [y0, y1]);
          if (lim != null) { C.hline(lim, { color: 'green', width: 1.4, dash: [6, 4] }); C.tex(`\\|f\\|_{${PLAB[k] === '∞' ? '\\infty' : PLAB[k]}}`, 4.0, lim, { color: 'green', size: 13, align: 'left', dx: 4, baseline: 'bottom', dy: -2 }); }
          const clip = (pts) => pts.map(([x, y]) => [x, Math.min(y, y1 + 0.5)]);
          C.path(clip(l0), { color: 'gold', width: 2.2, dash: [6, 4] });
          C.path(clip(lp), { color: 'accent', width: 2.6 });
          const esc = lp.find((q) => q[1] > y1);
          if (esc) C.arrow(esc[0], y1 - 0.45, esc[0], y1 - 0.08, { color: 'accent', head: 8 });
          const escN = l0.find((q) => q[1] > y1);
          if (escN) C.arrow(escN[0], y1 - 0.45, escN[0], y1 - 0.08, { color: 'gold', head: 8 });
          spreadLabels(C, [{ tex: `M_{${PLAB[k] === '∞' ? '\\infty' : PLAB[k]}}`, y: Math.min(lp[lp.length - 1][1], y1 - 0.1), color: 'accent' }, { tex: '\\log^+', y: Math.min(l0[l0.length - 1][1], y1 - 0.1), color: 'gold' }], { x: 4, align: 'left', dx: 5 });
          // membership strip: p ∈ (0, ∞] mapped to u = p/(1+p)
          const U = (q) => (q === Infinity ? 1 : q / (1 + q));
          S.rect(-0.3, 0.3, -0.12, 0.72, { fill: E.N ? 'green' : 'red', fillAlpha: 0.25, color: E.N ? 'green' : 'red', width: 1.5 });
          S.tex(E.N ? 'f\\in N' : 'f\\notin N', -0.21, 0.51, { color: E.N ? 'green' : 'red', size: 14 });
          const nseg = 240;
          const UMAX = 0.965;
          for (let i = 0; i < nseg; i++) {
            const u0 = UMAX * i / nseg, u1 = UMAX * (i + 1) / nseg, um = (u0 + u1) / 2, q = um / (1 - um);
            const ok = E.mem(q, a);
            S.rect(u0, 0.42, u1, 0.62, { fill: ok ? 'green' : 'red', fillAlpha: ok ? 0.55 : 0.2, stroke: false });
          }
          const okInf = E.mem(Infinity, a);
          S.rect(0.985, 0.42, 1.035, 0.62, { fill: okInf ? 'green' : 'red', fillAlpha: okInf ? 0.55 : 0.2, stroke: false });
          PL.forEach((q, j) => { const u = q === Infinity ? 1.01 : U(q); S.line(u, 0.36, u, 0.42, { color: 'muted', width: 1 }); if (j % 2 === 0 || j === PL.length - 1 || j === 4) S.text(PLAB[j], u, 0.2, { size: 11, color: 'muted', align: 'center' }); });
          S.text('p', -0.06, 0.2, { size: 12, color: 'muted', math: true, align: 'center' });
          S.text('Hᵖ:', -0.06, 0.52, { size: 12, color: 'ink', align: 'center', weight: 600 });
          const up = p === Infinity ? 1.01 : U(p);
          S.poly([[up, 0.66], [up - 0.012, 0.86], [up + 0.012, 0.86]], { fill: 'ink', fillAlpha: 1, stroke: false });
          if (key === 'pow' && a > 0) { const uc = U(1 / a); S.line(uc, 0.38, uc, 0.66, { color: 'ink', width: 1.6, dash: [3, 2] }); S.tex('p=1/\\alpha', uc, 0.84, { color: 'ink', size: 12, align: up < uc ? 'left' : 'right', dx: up < uc ? 5 : -5 }); }
          st = { member, p, k, key, a, lim, last: lp[lp.length - 1][1], lastN: l0[l0.length - 1][1], N: E.N };
          v.legend([['accent', '$\\log_{10}M_p(f;r)$'], ['gold', '$\\frac{1}{\\ln 10}\\cdot\\frac1{2\\pi}\\int\\log^+|f(re^{i\\theta})|\\,d\\theta$', { dash: true }], ['green', '$f\\in H^p$', { area: true }], ['red', '$f\\notin H^p$', { area: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const pl = PLAB[s.k] === '∞' ? '\\infty' : PLAB[s.k];
          const at = `at $r = 0.9999$: $M_{${pl}}(f;r) ${s.last > 300 ? '> 10^{300}' : '= ' + v.sci(10 ** s.last, 4)}$`;
          if (s.member) return `$f\\in H^{${pl}}$: ${at}${s.lim != null ? `, limit $\\|f\\|_{${pl}} = ${v.fix(10 ** s.lim, 4)}$` : ''} (the means level off).`;
          return `$f\\notin H^{${pl}}$: ${at} and still growing.` + (s.N ? ' Yet the $\\log^+$-means stay bounded, so $f\\in N$.' : ' Even the $\\log^+$-means blow up: $f\\notin N$.');
        });
      },
    },
    {
      num: '17.8',
      kind: 'Theorem',
      name: 'N consists of quotients of bounded functions',
      verify: true,
      statement: String.raw`A function $f\in H(U)$ belongs to $N$ if and only if $f=g/h$ for some $g,h\in H^\infty$ such that $h$ has no zero in $U$. In fact, if $f\in N$ one can choose $g$ and $h$ with $\|g\|_\infty\le1$ and $\|h\|_\infty\le1$.`,
      idea: String.raw`If $f=g/h$ with $|g|,|h|\le1$, then $\log^+|f|\le-\log|h|$, a positive harmonic function whose circle means all equal $-\log|h(0)|$; so $f\in N$. Conversely, the zeros of $f\in N$ satisfy the Blaschke condition (15.23); dividing out the Blaschke product $B$ (15.21) leaves a zero-free $f/B\in N$, so $u=\log|f/B|$ is harmonic with bounded $L^1$-means and therefore $u=P[\mu]$ for a real measure $\mu$ (11.30). Splitting $\mu=\mu^+-\mu^-$ and exponentiating the Herglotz integrals $H[\mu^\pm](z)=\int\frac{e^{it}+z}{e^{it}-z}\,d\mu^\pm(t)$ gives
$$f=c\,\frac{B\,e^{-H[\mu^-]}}{e^{-H[\mu^+]}},$$
and both $e^{-H[\mu^\pm]}$ have modulus $e^{-P[\mu^\pm]}\le1$.`,
      caption: String.raw`Here $f=B\,e^{H[\mu]}$ with one zero $\alpha$ and the real measure $\mu=c_+\delta_{\zeta_+}-c_-\delta_{\zeta_-}$. Drag $\alpha$ and the two atoms on the circle, and change their masses. The three phase portraits show $f$, the numerator $g$ and the zero-free denominator $h$, both bounded by $1$. Below, the $\log^+$-means of $f$ never exceed $c_+=\mu^+(\T)$ (so $f\in N$), while $\log M_1(f;r)$ explodes as soon as $c_+>0$: $f\notin H^1$.`,
      deps: ['rca-17.7', 'rca-15.21', 'rca-15.23', 'rca-11.30'],
      tags: ['Nevanlinna class', 'Herglotz'],
      viz(v) {
        const cP = v.slider('mass $c_+$ of $\\mu^+$ at $\\zeta_+$', 0, 1.5, 0.7, { step: 0.05 });
        const cM = v.slider('mass $c_-$ of $\\mu^-$ at $\\zeta_-$', 0, 1.5, 0.9, { step: 0.05 });
        const o = { x: [-1.12, 1.12], y: [-1.12, 1.12], equal: true, height: 250, axes: false, minWidth: 210 };
        const A = v.stage({ ...o, title: '$f=g/h\\in N$' });
        const G = v.stage({ ...o, title: '$g=B\\,e^{-H[\\mu^-]}$, $|g|\\le1$' });
        const Hh = v.stage({ ...o, title: '$h=e^{-H[\\mu^+]}$, $|h|\\le1$, no zeros' });
        const C = v.stage({ x: [0, 3], y: [-0.2, 2], height: 200, axes: 'box', full: true, xticks: R_TICKS.slice(0, 4), xlabel: 'r', title: 'means over $|z|=r$ (in nats)' });
        const zp = A.handle(Math.cos(0.5), Math.sin(0.5), { color: 'red', label: 'ζ₊', labelPos: 'ne', constrain: onCircle });
        const zm = A.handle(Math.cos(3.7), Math.sin(3.7), { color: 'purple', label: 'ζ₋', labelPos: 'sw', constrain: onCircle });
        const al = A.handle(-0.25, 0.4, { color: 'ink', label: 'α', labelPos: 'ne', constrain: inDisc(0.93) });
        let st = null;
        v.render(() => {
          const tp = Math.atan2(zp.y, zp.x), tm = Math.atan2(zm.y, zm.x), a = [al.x, al.y], cp = cP.value, cm = cM.value;
          const key = [tp, tm, a, cp, cm].join('|');
          const hp = (x, y) => { const k = herg(tp, x, y); return [cp * k[0], cp * k[1]]; };
          const hm = (x, y) => { const k = herg(tm, x, y); return [cm * k[0], cm * k[1]]; };
          discPhase(v, A, (x, y) => { const p = hp(x, y), m = hm(x, y); return cmul(bfac(a, x, y), cexp([p[0] - m[0], p[1] - m[1]])); }, key);
          discPhase(v, G, (x, y) => { const m = hm(x, y); return cmul(bfac(a, x, y), cexp([-m[0], -m[1]])); }, key);
          discPhase(v, Hh, (x, y) => { const p = hp(x, y); return cexp([-p[0], -p[1]]); }, key);
          for (const S of [A, G, Hh]) S.circle(0, 0, 1, { color: 'ink', width: 1.2 });
          for (const S of [G, Hh]) { S.dot(zp.x, zp.y, { color: 'red', r: 4 }); S.dot(zm.x, zm.y, { color: 'purple', r: 4 }); }
          G.dot(a[0], a[1], { color: 'ink', r: 4, label: 'α', labelPos: 'ne' });
          // chart
          const logB = (r, t) => Math.log(cabs(bfac(a, r * Math.cos(t), r * Math.sin(t))));
          const Lf = (r, t) => logB(r, t) + cp * poissonK(r, t - tp) - cm * poissonK(r, t - tm);
          const xs = v.M.linspace(0, 3, 64);
          const pos = xs.map((x) => { const r = rOf(x); return [x, meanC((t) => Math.max(0, Lf(r, t)), 900, tp)]; });
          const m1 = xs.map((x) => { const r = rOf(x); return [x, logMeanExp((t) => Lf(r, t), 900, tp)]; });
          const top = Math.max(1.2, cp * 1.9 + 0.4), bot = Math.min(-0.3, ...m1.map((q) => q[1]).filter((y) => y < top)) - 0.1;
          C.setView(null, [Math.max(bot, -3), top]);
          C.hline(cp, { color: 'green', width: 1.6, dash: [6, 4] });
          C.tex('\\mu^+(\\mathbb T)=c_+', 0.05, cp, { color: 'green', size: 13, align: 'left', baseline: 'bottom', dy: -3 });
          C.path(m1.map(([x, y]) => [x, Math.min(y, top + 1)]), { color: 'red', width: 2.2 });
          const esc = m1.find((q) => q[1] > top);
          if (esc) C.arrow(esc[0], top - 0.35, esc[0], top - 0.04, { color: 'red', head: 8 });
          C.path(pos, { color: 'gold', width: 2.6 });
          const supPos = Math.max(...pos.map((q) => q[1]));
          st = { supPos, cp, cm, m1end: m1[m1.length - 1][1], h0: Math.exp(-cp), alpha: Math.hypot(a[0], a[1]) };
          v.legend([['gold', '$\\frac1{2\\pi}\\int\\log^+|f(re^{i\\theta})|\\,d\\theta$'], ['green', 'bound $-\\log|h(0)|=\\mu^+(\\mathbb T)$', { dash: true }], ['red', '$\\log M_1(f;r)$'], ['red', '$\\zeta_+$ (in $h$)', { dot: true }], ['purple', '$\\zeta_-$ (in $g$)', { dot: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `$\\sup_r\\frac1{2\\pi}\\int\\log^+|f_r| = ${v.fix(s.supPos, 3)} \\le c_+ = ${v.fix(s.cp, 2)}$, so $f\\in N$. $\\;|h(0)| = e^{-c_+} = ${v.fix(s.h0, 3)}$. ` +
            (s.cp > 0 ? `$\\log M_1(f;0.999) ${s.m1end > 1e3 ? '> 1000' : '= ' + v.fix(s.m1end, 1)}$: the atom of $\\mu^+$ keeps $f$ out of every $H^p$.` : 'With $c_+=0$ the denominator is $1$ and $f=g\\in H^\\infty$.');
        });
      },
    },
    {
      num: '17.9',
      kind: 'Theorem',
      name: 'Functions in N have radial limits a.e.',
      verify: true,
      statement: String.raw`Suppose $f\in N$ and $f\not\equiv0$. Then the radial limit
$$f^*(e^{i\theta})=\lim_{r\to1}f(re^{i\theta})$$
exists and is finite for almost every $\theta$, and $\log|f^*|\in L^1(\T)$; in particular $f^*\ne0$ a.e. If moreover $f\in H^p$ for some $0<p\le\infty$, then $f^*\in L^p(\T)$ and $\|f^*\|_p\le\|f\|_p$.`,
      idea: String.raw`Write $f=g/h$ as in 17.8. Bounded holomorphic functions have radial limits a.e. (Fatou's theorem, 11.32), and $h^*\ne0$ a.e.: by subharmonicity $\int\log|h(re^{i\theta})|\,d\theta\ge2\pi\log|h(0)|>-\infty$, and Fatou's lemma (1.28) carries this to $\int\log|h^*|>-\infty$. Hence $f^*=g^*/h^*$ exists a.e. The same use of Fatou's lemma bounds $\int\log^+|f^*|$ by $\sup_r\int\log^+|f_r|$ and, together with Jensen's inequality $\int\log|f_r|\ge2\pi\log|f(0)|$ (after dividing out a zero at $0$), bounds $\int\log^-|f^*|$. For $f\in H^p$, Fatou's lemma applied to $|f_r|^p$ gives $\|f^*\|_p\le\|f\|_p$.`,
      caption: String.raw`Drag the endpoint $e^{i\theta}$ on the circle. The middle panel traces $\rho\mapsto f(\rho e^{i\theta})$ as $\rho$ runs from $0$ to $1$; it settles on the boundary value $f^*(e^{i\theta})$ (green). The bottom panel is $\log|f^*|$ over the whole circle — integrable, even where it has singularities. For $e^{\frac{1+z}{1-z}}$ (in $N$, in no $H^p$) and the singular inner function the limits are unimodular, except at the single point $1$; the infinite Blaschke product has $|B^*|=1$ a.e. although its zeros accumulate at every boundary point.`,
      deps: ['rca-17.8', 'rca-11.32', 'rca-1.28', 'rca-17.6'],
      tags: ['radial limits', 'Nevanlinna class'],
      viz(v) {
        const GA = Math.PI * (3 - Math.sqrt(5));
        const ZB = []; for (let n = 2; n <= 90; n++) { const m = 1 - 1 / (n * n), t = n * GA * 3.1; ZB.push([m * Math.cos(t), m * Math.sin(t)]); }
        const bla = (x, y) => { let p = [1, 0]; for (const a of ZB) { const u = cmul(bfac(a, x, y), [-a[0] / Math.hypot(a[0], a[1]), a[1] / Math.hypot(a[0], a[1])]); p = cmul(p, u); } return p; };
        const w = (x, y) => cdiv([1 + x, y], [1 - x, -y]);
        const EX = {
          hp: { label: '$(1+z)(1-z)^{-1/3}$', f: (x, y) => cmul([1 + x, y], cpow1m(x, y, -1 / 3)), logstar: (t) => Math.log(Math.hypot(1 + Math.cos(t), Math.sin(t))) - Math.log(Math.hypot(1 - Math.cos(t), Math.sin(t))) / 3 },
          expw: { label: '$e^{\\frac{1+z}{1-z}}$', f: (x, y) => cexp(w(x, y)), logstar: () => 0 },
          sing: { label: '$e^{-\\frac{1+z}{1-z}}$', f: (x, y) => { const q = w(x, y); return cexp([-q[0], -q[1]]); }, logstar: () => 0 },
          bla: { label: 'Blaschke product, $1-|\\alpha_n|=n^{-2}$', f: bla, logstar: () => 0 },
        };
        const which = v.select('$f$', Object.entries(EX).map(([value, o]) => ({ value, label: o.label })), 'expw');
        const L = v.stage({ x: [-1.1, 1.1], y: [-1.1, 1.1], equal: true, height: 290, axes: false, title: 'phase portrait of $f$; the radius to $e^{i\\theta}$' });
        const Mid = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, height: 290, axes: true, title: '$\\rho\\mapsto f(\\rho e^{i\\theta})$, $0\\le\\rho<1$' });
        const B = v.stage({ x: [-Math.PI - 0.15, Math.PI + 0.15], y: [-3, 3], height: 180, axes: 'box', full: true, xticks: PI_TICKS, xlabel: 'θ', title: '$\\log|f^*(e^{i\\theta})|$ on the whole circle' });
        const e = L.handle(Math.cos(1.25), Math.sin(1.25), { color: 'green', label: 'eⁱᶿ', labelPos: 'ne', constrain: onCircle });
        let st = null, logCache = {};
        v.render(() => {
          const key = which.value, E = EX[key], th = Math.atan2(e.y, e.x);
          e.labelPos = e.x >= 0 ? (e.y > 0.85 ? 'e' : 'ne') : (e.y > 0.85 ? 'w' : 'nw');
          discPhase(v, L, E.f, key);
          L.circle(0, 0, 1, { color: 'ink', width: 1.2 });
          if (key === 'bla') L.dots(ZB.filter((a) => Math.hypot(...a) < 0.995), { color: 'ink', r: 1.6 });
          L.line(0, 0, e.x, e.y, { color: 'panel', width: 4.5 }); L.line(0, 0, e.x, e.y, { color: 'gold', width: 2 });
          // radial path
          const rho = [0]; for (let k = 0; k <= 400; k++) rho.push(1 - Math.pow(10, -0.1 - 5.4 * k / 400));
          const path = rho.map((r) => E.f(r * Math.cos(th), r * Math.sin(th)));
          const fstar = E.f(0.99999999 * Math.cos(th), 0.99999999 * Math.sin(th));
          const CL = 40, clip = (q) => { const m = cabs(q); return m > CL ? [q[0] * CL / m, q[1] * CL / m] : q; };
          const pts = path.map(clip);
          let mx = 1.25; for (const q of pts) mx = Math.max(mx, Math.abs(q[0]) * 1.12, Math.abs(q[1]) * 1.12);
          Mid.setView([-mx, mx], [-mx, mx]);
          Mid.circle(0, 0, 1, { color: 'muted', width: 1, dash: [4, 4] });
          Mid.path(pts, { color: 'gold', width: 2.2 });
          const fs = clip(fstar); let lastPx = [Mid.X(fs[0]), Mid.Y(fs[1])];
          for (const [r, lab] of [[0.99, '0.99'], [0.9, '0.9'], [0.5, '0.5']]) {
            const q = clip(E.f(r * Math.cos(th), r * Math.sin(th))), px = [Mid.X(q[0]), Mid.Y(q[1])];
            const far = Math.hypot(px[0] - lastPx[0], px[1] - lastPx[1]) > 30;
            Mid.dot(q[0], q[1], { color: 'gold', r: 3.5, label: far ? `ρ = ${lab}` : undefined, labelPos: 'e', math: false, labelSize: 11 });
            if (far) lastPx = px;
          }
          Mid.dot(path[0][0], path[0][1], { color: 'ink', r: 4.5, label: 'f(0)', labelPos: 'sw' });
          Mid.dot(fs[0], fs[1], { color: 'green', r: 7, hollow: true, width: 2.4, label: 'f*(eⁱᶿ)', labelPos: 'ne' });
          // log|f*|
          if (!logCache[key]) {
            const n = 4000, pts2 = [], vals = [];
            for (let k = 0; k <= n; k++) { const t = -Math.PI + TAU * k / n; pts2.push([t, E.logstar(t)]); }
            for (let k = 0; k < 40000; k++) vals.push(Math.abs(E.logstar(-Math.PI + TAU * (k + 0.5) / 40000)));
            logCache[key] = { pts: pts2, l1: vals.reduce((s, x) => s + x, 0) / 40000 };
          }
          const lc = logCache[key];
          B.setView(null, key === 'hp' ? [-3.2, 2.6] : [-1, 1]);
          B.path(lc.pts.map(([t, y]) => [t, Math.max(-50, Math.min(50, y))]).concat([[Math.PI, 0], [-Math.PI, 0]]), { fill: 'accent', fillAlpha: 0.14, stroke: false, close: true });
          B.path(lc.pts, { color: 'accent', width: 2.2 });
          B.vline(th, { color: 'green', width: 1.2, dash: [3, 4] });
          B.dot(th, Math.max(B.bounds.y[0], Math.min(B.bounds.y[1], E.logstar(th))), { color: 'green', r: 4.5 });
          const near = E.f(0.999 * Math.cos(th), 0.999 * Math.sin(th));
          st = { th, fstar, err: cabs([near[0] - fstar[0], near[1] - fstar[1]]), l1: lc.l1, key };
          v.legend([['gold', 'radial path $f(\\rho e^{i\\theta})$'], ['green', 'boundary value $f^*(e^{i\\theta})$', { dot: true }], ['accent', '$\\log|f^*|$']]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `$\\theta = ${v.fix(s.th, 3)}$: $\\;f^*(e^{i\\theta}) = ${v.fmt(s.fstar[0], 4)} ${s.fstar[1] < 0 ? '-' : '+'} ${v.fmt(Math.abs(s.fstar[1]), 4)}\\,i$, $\\;|f(0.999e^{i\\theta}) - f^*(e^{i\\theta})| = ${v.sci(s.err, 2)}$. $\\;\\frac1{2\\pi}\\int|\\log|f^*||\\,d\\theta = ${v.fix(s.l1, 4)} < \\infty$.`;
        });
      },
    },
    {
      num: '17.10',
      kind: 'Theorem',
      name: 'Dividing out the zeros: f = Bg with ‖g‖ₚ = ‖f‖ₚ',
      verify: true,
      statement: String.raw`Suppose $0<p\le\infty$, $f\in H^p$, $f\not\equiv0$, and $B$ is the Blaschke product formed with the zeros of $f$. Then $g=f/B$ has no zero in $U$, $g\in H^p$, and $\|g\|_p=\|f\|_p$.`,
      idea: String.raw`The zeros of $f\in H^p\subset N$ satisfy the Blaschke condition (15.23), so $B$ exists (15.21) and $g=f/B$ is holomorphic and zero-free. Let $B_n$ be the partial products. Each $B_n$ is continuous on $\overline U$ with $|B_n|=1$ on $\T$, so for fixed $n$, $|f/B_n|$ is close to $|f|$ on circles near $\T$; with 17.6 this gives $\|f/B_n\|_p\le\|f\|_p$. Letting $n\to\infty$ ($B_n\to B$ uniformly on compact sets) yields $\|g\|_p\le\|f\|_p$, and $|B|\le1$ gives the reverse inequality.`,
      caption: String.raw`$f=B\,g$ where $g(z)=(1-z)^{-0.3}e^{0.8z^2}$ has no zeros and $B$ has the two draggable zeros $\alpha_1,\alpha_2$. The phase portraits show $f$ (colour wheels around the zeros) and $g=f/B$ (none). Since $|B|<1$ in $U$, $M_p(g;r)$ (green) lies above $M_p(f;r)$ (blue) — but $|B|\to1$ at the circle, and both means climb to the same limit $\|f\|_p=\|g\|_p$. Push a zero toward the circle and watch how late the two curves merge.`,
      deps: ['rca-17.7', 'rca-15.21', 'rca-15.23', 'rca-17.6'],
      tags: ['Blaschke products', 'Hardy spaces'],
      viz(v) {
        const pS = v.slider('$p$', 0.3, 3, 1.5, { step: 0.05 });
        const L = v.stage({ x: [-1.1, 1.1], y: [-1.1, 1.1], equal: true, height: 270, axes: false, minWidth: 220, title: '$f=Bg$ with zeros $\\alpha_1,\\alpha_2$' });
        const G = v.stage({ x: [-1.1, 1.1], y: [-1.1, 1.1], equal: true, height: 270, axes: false, minWidth: 220, title: '$g=f/B$: no zeros' });
        const C = v.stage({ x: [0, 3.35], y: [0, 2], height: 270, axes: 'box', xticks: R_TICKS.slice(0, 4), xlabel: 'r', minWidth: 260, weight: 1.2, title: '$M_p(f;r)$ and $M_p(g;r)$' });
        const A1 = L.handle(0.35, 0.45, { color: 'ink', label: 'α₁', labelPos: 'ne', constrain: inDisc(0.97) });
        const A2 = L.handle(-0.5, -0.3, { color: 'ink', label: 'α₂', labelPos: 'sw', constrain: inDisc(0.97) });
        const gF = (x, y) => cmul(cpow1m(x, y, -0.3), cexp([0.8 * (x * x - y * y), 1.6 * x * y]));
        const logg = (r, t) => { const x = r * Math.cos(t), y = r * Math.sin(t); return -0.15 * Math.log((1 - x) * (1 - x) + y * y) + 0.8 * (x * x - y * y); };
        let st = null;
        v.render(() => {
          const p = pS.value, a1 = [A1.x, A1.y], a2 = [A2.x, A2.y];
          const Bf = (x, y) => cmul(bfac(a1, x, y), bfac(a2, x, y));
          discPhase(v, L, (x, y) => cmul(Bf(x, y), gF(x, y)), `${a1}|${a2}`);
          discPhase(v, G, gF, 'g');
          for (const S of [L, G]) S.circle(0, 0, 1, { color: 'ink', width: 1.2 });
          G.dot(a1[0], a1[1], { color: 'ink', r: 3, hollow: true }); G.dot(a2[0], a2[1], { color: 'ink', r: 3, hollow: true });
          const logB = (r, t) => { const x = r * Math.cos(t), y = r * Math.sin(t); return Math.log(cabs(bfac(a1, x, y))) + Math.log(cabs(bfac(a2, x, y))); };
          const xs = v.M.linspace(0, 3.3, 70);
          const mg = xs.map((x) => { const r = rOf(x); return [x, Math.exp(logMeanExp((t) => p * logg(r, t), 700) / p)]; });
          const mf = xs.map((x) => { const r = rOf(x); return [x, Math.exp(logMeanExp((t) => p * (logg(r, t) + logB(r, t)), 700) / p)]; });
          const lim = Math.exp(logMeanExp((t) => p * logg(1, t), 4000) / p);
          const top = Math.max(lim, ...mg.map((q) => q[1])) * 1.15;
          C.setView(null, [0, top]);
          C.hline(lim, { color: 'ink', width: 1.3, dash: [6, 4] });
          C.tex('\\|f\\|_p=\\|g\\|_p', 0.05, lim, { color: 'ink', size: 13, align: 'left', baseline: 'bottom', dy: -3 });
          C.between((x) => mg[Math.min(69, Math.round(x / 3.3 * 69))][1], (x) => mf[Math.min(69, Math.round(x / 3.3 * 69))][1], 0, 3.3, { fill: 'green', fillAlpha: 0.1, n: 69 });
          C.path(mg, { color: 'green', width: 2.4 });
          C.path(mf, { color: 'accent', width: 2.4 });
          const i9 = Math.round(1 / 3.3 * 69), i99 = Math.round(2 / 3.3 * 69);
          st = { p, lim, f9: mf[i9][1], g9: mg[i9][1], f99: mf[i99][1], g99: mg[i99][1], fe: mf[69][1], ge: mg[69][1] };
          v.legend([['accent', '$M_p(f;r)$'], ['green', '$M_p(g;r)$'], ['ink', 'common limit', { dash: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `$p = ${v.fix(s.p, 2)}$. At $r=0.9$: $M_p(f) = ${v.fix(s.f9, 4)} < M_p(g) = ${v.fix(s.g9, 4)}$; at $r=0.99$: $${v.fix(s.f99, 4)}$ vs $${v.fix(s.g99, 4)}$; at $r=0.9995$: $${v.fix(s.fe, 4)}$ vs $${v.fix(s.ge, 4)}$; limit $\\|g^*\\|_p = ${v.fix(s.lim, 4)}$.`;
        });
      },
    },
    {
      num: '17.11',
      kind: 'Theorem',
      name: 'Hᵖ functions converge to their boundary values in Lᵖ',
      verify: true,
      statement: String.raw`Suppose $0<p<\infty$ and $f\in H^p$. Then $f^*\in L^p(\T)$,
$$\lim_{r\to1}\frac1{2\pi}\int_{-\pi}^{\pi}|f(re^{i\theta})-f^*(e^{i\theta})|^p\,d\theta=0,$$
and $\|f^*\|_p=\|f\|_p$.`,
      idea: String.raw`For $p=2$ everything is Parseval: if $h=\sum c_nz^n\in H^2$, then $M_2(h;r)^2=\sum|c_n|^2r^{2n}$, so $\sum|c_n|^2=\|h\|_2^2<\infty$; the Riesz–Fischer theorem (4.26) produces $\varphi\in L^2(\T)$ with coefficients $c_n$ ($n\ge0$) and $0$ ($n<0$); $h=P[\varphi]$, so $h^*=\varphi$ a.e., and $\|h_r-h^*\|_2^2=\sum|c_n|^2(1-r^n)^2\to0$. For general $p$, divide out the zeros (17.10): $f=Bg$ with $g$ zero-free, so $h=g^{p/2}\in H^2$ and $|g_r|^p=|h_r|^2\to|h^*|^2$ in $L^1$. Together with a.e. convergence and $|B_r|\le1$, $|B^*|=1$, this upgrades to $\int|f_r-f^*|^p\to0$.`,
      caption: String.raw`Choose $f$, the exponent $p$ and how close $r$ is to $1$. Top: $\Re f(re^{i\theta})$ (blue) against the boundary function $\Re f^*(e^{i\theta})$ (black). Bottom: the $L^p$-distance $\|f_r-f^*\|_p$ (orange) falls to $0$ while $M_p(f;r)$ (blue) climbs to $\|f^*\|_p$ (green). The lacunary series $\sum_k2^{-k/2}z^{2^k}$ (13 terms) has a rough, Weierstrass-like boundary function; at $p=2$ the readout checks the Parseval formula $\|f_r-f^*\|_2^2=\sum|c_n|^2(1-r^n)^2$.`,
      deps: ['rca-17.10', 'rca-17.9', 'rca-4.26', 'rca-11.30'],
      tags: ['Hardy spaces', 'boundary values'],
      viz(v) {
        const NL = 13, NG = 8192;
        const ex = v.select('$f$', [{ value: 'pow', label: '$(1-z)^{-0.4}$' }, { value: 'lac', label: '$\\sum_{k\\le12}2^{-k/2}z^{2^k}$' }], 'pow');
        const pS = v.slider('$p$', 0.3, 2.4, 1, { step: 0.05 });
        const xS = v.slider('$r=1-10^{-x}$', 0.2, 3.5, 0.9, { step: 0.01, fmt: (x) => `r = ${v.fmt(rOf(x), 4)}` });
        const T = v.stage({ x: [-Math.PI, Math.PI], y: [-2, 4], height: 230, axes: 'box', full: true, xticks: PI_TICKS, xlabel: 'θ', title: '$\\Re f(re^{i\\theta})$ and $\\Re f^*(e^{i\\theta})$' });
        const C = v.stage({ x: [0, 3.6], y: [0, 2], height: 220, axes: 'box', full: true, xticks: R_TICKS.slice(0, 4), xlabel: 'r', title: '$\\|f_r-f^*\\|_p$ and $M_p(f;r)$ as $r\\to1$' });
        // lacunary tables
        const tabs = [];
        for (let k = 0; k < NL; k++) { const n = 2 ** k, c = new Float64Array(NG), s = new Float64Array(NG); for (let j = 0; j < NG; j++) { const t = -Math.PI + TAU * j / NG; c[j] = Math.cos(n * t); s[j] = Math.sin(n * t); } tabs.push({ n, a: 2 ** (-k / 2), c, s }); }
        const lacVals = (r) => { const re = new Float64Array(NG), im = new Float64Array(NG); for (const T0 of tabs) { const m = T0.a * r ** T0.n; for (let j = 0; j < NG; j++) { re[j] += m * T0.c[j]; im[j] += m * T0.s[j]; } } return [re, im]; };
        const lacStar = lacVals(1);
        const powF = (r, t) => cpow1m(r * Math.cos(t), r * Math.sin(t), -0.4);
        let cache = {}, st = null;
        const stats = (key, p, x) => {
          const r = rOf(x);
          if (key === 'pow') {
            const d = Math.pow(meanC((t) => { const a = powF(r, t), b = powF(1, t); return Math.pow(cabs([a[0] - b[0], a[1] - b[1]]), p); }, 1400, 0), 1 / p);
            const m = Math.pow(meanC((t) => Math.pow(cabs(powF(r, t)), p), 1400, 0), 1 / p);
            return [d, m];
          }
          const [re, im] = lacVals(r); let sd = 0, sm = 0;
          for (let j = 0; j < NG; j++) { sd += Math.pow(Math.hypot(re[j] - lacStar[0][j], im[j] - lacStar[1][j]), p); sm += Math.pow(Math.hypot(re[j], im[j]), p); }
          return [Math.pow(sd / NG, 1 / p), Math.pow(sm / NG, 1 / p)];
        };
        v.render(() => {
          const key = ex.value, p = pS.value, x = xS.value, r = rOf(x);
          const ck = key + p;
          if (!cache[ck]) {
            const xs = v.M.linspace(0, 3.5, key === 'pow' ? 60 : 44);
            const ds = [], ms = [];
            for (const xx of xs) { const [d, m] = stats(key, p, xx); ds.push([xx, d]); ms.push([xx, m]); }
            const norm = key === 'pow' ? Math.pow(v.M.gamma(1 - 0.4 * p) / v.M.gamma(1 - 0.2 * p) ** 2, 1 / p) : stats(key, p, 30)[1];
            cache = { [ck]: { ds, ms, norm } };
          }
          const { ds, ms, norm } = cache[ck];
          // top: profiles
          if (key === 'pow') {
            T.setView(null, [0.45, 3.6]);
            T.between((t) => powF(1, t)[0], (t) => powF(r, t)[0], -Math.PI, Math.PI, { fill: 'orange', fillAlpha: 0.3, n: 1600 });
            T.fn((t) => powF(1, t)[0], { color: 'ink', width: 1.6, n: 1600 });
            T.fn((t) => powF(r, t)[0], { color: 'accent', width: 2.4, n: 1600 });
          } else {
            T.setView(null, [-3.3, 3.6]);
            const [re] = lacVals(r), step = 2;
            T.path(Array.from({ length: NG / step }, (_, j) => [-Math.PI + TAU * j * step / NG, lacStar[0][j * step]]), { color: 'ink', width: 1 });
            T.path(Array.from({ length: NG / step }, (_, j) => [-Math.PI + TAU * j * step / NG, re[j * step]]), { color: 'accent', width: 1.8 });
          }
          T.corner(`r = ${v.fmt(r, 5)}`, 'tr', { color: 'accent', weight: 600 });
          // bottom: distances
          const [dNow, mNow] = stats(key, p, x);
          const top = Math.max(norm, ...ms.map((q) => q[1]), ...ds.map((q) => q[1])) * 1.12;
          C.setView(null, [0, top]);
          C.hline(norm, { color: 'green', width: 1.4, dash: [6, 4] });
          C.tex('\\|f^*\\|_p', 3.5, norm, { color: 'green', size: 13, align: 'right', baseline: 'bottom', dy: -3 });
          C.path(ms, { color: 'accent', width: 2.4 });
          C.path(ds, { color: 'orange', width: 2.4 });
          C.vline(x, { color: 'muted', width: 1, dash: [3, 4] });
          C.dot(x, mNow, { color: 'accent', r: 5 }); C.dot(x, dNow, { color: 'orange', r: 5 });
          let pars = null;
          if (key === 'lac' && Math.abs(p - 2) < 0.026) pars = Math.sqrt(tabs.reduce((s0, T0) => s0 + T0.a * T0.a * (1 - r ** T0.n) ** 2, 0));
          st = { r, p, dNow, mNow, norm, pars, key };
          v.legend([['ink', '$\\Re f^*$'], ['accent', '$\\Re f_r$ and $M_p(f;r)$'], ['orange', '$\\|f_r-f^*\\|_p$ (and the gap)'], ['green', '$\\|f^*\\|_p$', { dash: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          let out = `$r = ${v.fmt(s.r, 5)}$, $p = ${v.fix(s.p, 2)}$: $\\;\\|f_r-f^*\\|_p = ${v.fmt(s.dNow, 4)}$, $\\;M_p(f;r) = ${v.fmt(s.mNow, 4)}\\to\\|f^*\\|_p = ${v.fmt(s.norm, 4)}$.`;
          if (s.pars != null) out += ` Parseval: $\\big(\\sum|c_n|^2(1-r^n)^2\\big)^{1/2} = ${v.fmt(s.pars, 4)}$.`;
          else if (s.key === 'lac') out += ' (Set $p=2$ to compare with Parseval.)';
          return out;
        });
      },
    },
    {
      num: '17.12',
      kind: 'Theorem',
      name: 'H¹ functions are Cauchy and Poisson integrals of f*',
      verify: true,
      statement: String.raw`Suppose $1\le p\le\infty$ and $f\in H^p$. Then $f$ is both the Poisson integral and the Cauchy integral of its boundary function: for every $z\in U$,
$$f(z)=\frac1{2\pi}\int_{-\pi}^{\pi}\frac{1-|z|^2}{|e^{it}-z|^2}f^*(e^{it})\,dt=\frac1{2\pi}\int_{-\pi}^{\pi}\frac{f^*(e^{it})}{1-ze^{-it}}\,dt .$$
Equivalently, $\hat f^*(n)=0$ for every $n<0$, and $\hat f^*(n)$ is the $n$-th Taylor coefficient of $f$ for $n\ge0$. Thus $f\mapsto f^*$ identifies $H^p$ isometrically with the closed subspace of $L^p(\T)$ consisting of the functions whose negative Fourier coefficients vanish.`,
      idea: String.raw`For $r<1$ the function $f_r(z)=f(rz)$ is holomorphic on a neighbourhood of $\overline U$, so it is the Poisson and the Cauchy integral of its own restriction to $\T$ (11.9, 10.15), and its Cauchy integral vanishes at every $z$ with $|z|>1$ (Cauchy's theorem). By 17.11 $f_r\to f^*$ in $L^1(\T)$, and for fixed $z$ both kernels are bounded functions of $t$, so the identities pass to the limit. The vanishing of the outer Cauchy integral, expanded in powers of $1/z$, says exactly that $\hat f^*(n)=0$ for $n<0$. For $p<1$ the theorem fails: $f^*$ need not even be integrable.`,
      caption: String.raw`The plane shows the Cauchy integral $C[f^*](z)=\frac1{2\pi}\int\frac{f^*(e^{it})\,dt}{1-ze^{-it}}$, computed by quadrature from the boundary values alone: a phase portrait where it is nonzero, plain grey where it vanishes. Drag $z$ inside and outside the circle. For $(1-z)^{-0.6}\in H^1$ the integral reproduces $f$ inside and is $0$ outside, and the negative Fourier coefficients of $f^*$ are $0$. For $e^{\frac{1+z}{1-z}}$, which lies in $N$ but not in $H^1$, the boundary function is unimodular yet "forgets" $f$: its Cauchy integral is the constant $e^{-1}$ inside, nonzero outside, and all the spectrum of $f^*$ sits at $n\le0$.`,
      deps: ['rca-17.11', 'rca-10.15', 'rca-11.9'],
      see: ['rca-17.13'],
      tags: ['Hardy spaces', 'Cauchy integral', 'Fourier coefficients'],
      viz(v) {
        const ex = v.select('$f$', [{ value: 'h1', label: '$(1-z)^{-0.6}\\in H^1$' }, { value: 'n', label: '$e^{\\frac{1+z}{1-z}}\\in N\\setminus H^1$' }], 'h1');
        const L = v.stage({ x: [-1.9, 1.9], y: [-1.6, 1.6], equal: true, height: 360, axes: false, weight: 1.25, title: 'Cauchy integral $C[f^*](z)$ of the boundary values' });
        const R = v.stage({ x: [-12.8, 12.8], y: [0, 1.2], height: 360, axes: 'box', xlabel: 'n', title: '$|\\hat f^*(n)|$: negative (red) and nonnegative frequencies' });
        const z = L.handle(0.45, 0.35, { color: 'ink', label: 'z', labelPos: 'ne' });
        const A = 0.6;
        // H¹ example: quadrature nodes clustered at the singularity t = 0
        const Q = nodes(900, 0, 3), fsQ = Q.th.map((t) => cpow1m(Math.cos(t), Math.sin(t), -A));
        const cauchyQ = (x, y) => { let re = 0, im = 0; for (let j = 0; j < Q.th.length; j++) { const c = Math.cos(Q.th[j]), s = Math.sin(Q.th[j]); const k = cdiv([c, s], [c - x, s - y]); const f = fsQ[j]; re += Q.w[j] * (f[0] * k[0] - f[1] * k[1]); im += Q.w[j] * (f[0] * k[1] + f[1] * k[0]); } return [re, im]; };
        const poissonQ = (x, y) => { let re = 0, im = 0; for (let j = 0; j < Q.th.length; j++) { const c = Math.cos(Q.th[j]), s = Math.sin(Q.th[j]); const P = (1 - x * x - y * y) / ((c - x) ** 2 + (s - y) ** 2); re += Q.w[j] * P * fsQ[j][0]; im += Q.w[j] * P * fsQ[j][1]; } return [re, im]; };
        const Qc = nodes(8000, 0, 5), fsC = Qc.th.map((t) => cpow1m(Math.cos(t), Math.sin(t), -A));
        const coefH1 = []; for (let n = -12; n <= 12; n++) { let re = 0, im = 0; for (let j = 0; j < Qc.th.length; j++) { const c = Math.cos(n * Qc.th[j]), s = -Math.sin(n * Qc.th[j]); re += Qc.w[j] * (fsC[j][0] * c - fsC[j][1] * s); im += Qc.w[j] * (fsC[j][0] * s + fsC[j][1] * c); } coefH1.push([n, Math.hypot(re, im)]); }
        // N example: f = 1/S with S = e^{-(1+z)/(1-z)}; f* = conj(S*) so everything is explicit through S
        const S = (x, y) => { const w = cdiv([1 + x, y], [1 - x, -y]); return cexp([-w[0], -w[1]]); };
        const eC = [1]; for (let n = 1; n <= 12; n++) { let s0 = 0; for (let k = 1; k <= n; k++) s0 += k * -2 * eC[n - k]; eC.push(s0 / n); }
        const coefN = []; for (let n = -12; n <= 12; n++) coefN.push([n, n <= 0 ? Math.abs(eC[-n]) * Math.exp(-1) : 0]);
        const cauchyN = (x, y) => { const d = x * x + y * y; if (d < 1) return [Math.exp(-1), 0]; const s = S(x / d, y / d); return [Math.exp(-1) - s[0], s[1]]; };
        const grey0 = v.rgb('faint'), panel = v.rgb('panel'), grey = [0, 1, 2].map((i) => (grey0[i] + panel[i]) / 2);
        let st = null;
        v.render(() => {
          const key = ex.value, Cf = key === 'h1' ? cauchyQ : cauchyN;
          L.raster((x, y) => {
            const d = Math.hypot(x, y);
            if (d > 0.95 && d < 1.06) return null;
            const w = Cf(x, y), m = cabs(w);
            if (m < 2e-3) return [grey[0], grey[1], grey[2]];
            return phaseRGB(v.M, w[0], w[1]);
          }, { key, res: 3 });
          haloCircle(L, 0, 0, 1, 'ink', 1.6);
          if (key === 'h1') L.text('C[f*] = 0 outside', 1.25, -1.4, { color: 'muted', size: 12, align: 'center' });
          const zx = z.x, zy = z.y, inside = Math.hypot(zx, zy) < 1;
          const c = Cf(zx, zy);
          let fz = null, pz = null;
          if (inside) {
            if (key === 'h1') { fz = cpow1m(zx, zy, -A); pz = poissonQ(zx, zy); }
            else { const s = S(zx, zy); fz = cdiv([1, 0], s); pz = [s[0], -s[1]]; }
          }
          // coefficients
          const co = key === 'h1' ? coefH1 : coefN;
          const top = Math.max(...co.map((q) => q[1])) * 1.15;
          R.setView(null, [-top * 0.08, top]);
          R.vband(-12.8, -0.5, { color: 'red', alpha: 0.05 });
          for (const [n, a] of co) { R.line(n, 0, n, a, { color: n < 0 ? 'red' : 'accent', width: 7, cap: 'butt', alpha: 0.75 }); }
          const negMax = Math.max(...co.filter((q) => q[0] < 0).map((q) => q[1]));
          R.corner(negMax < 1e-3 ? `max over n < 0: ${v.fmt(negMax, 2)} ≈ 0` : `max over n < 0: ${v.fmt(negMax, 3)}`, 'tr', { color: negMax < 1e-3 ? 'green' : 'red', weight: 600 });
          st = { key, inside, c, fz, pz, negMax, d: Math.hypot(zx, zy) };
          v.legend([['red', '$|\\hat f^*(n)|$, $n<0$', { area: true }], ['accent', '$|\\hat f^*(n)|$, $n\\ge0$', { area: true }], ['faint', '$C[f^*]=0$', { area: true }]]);
        });
        const cs = (w) => `${v.fmt(w[0], 4)} ${w[1] < 0 ? '-' : '+'} ${v.fmt(Math.abs(w[1]), 4)}\\,i`;
        v.readout(() => {
          const s = st; if (!s) return '';
          if (Math.abs(s.d - 1) < 0.06) return 'Move $z$ off the circle (the kernels are singular on $\\T$).';
          if (!s.inside) return `$|z| = ${v.fix(s.d, 3)} > 1$: $\\;C[f^*](z) = ${cs(s.c)}$` + (s.key === 'h1' ? ' — zero up to quadrature error, as the theorem predicts.' : ' — not zero: $f^*$ has negative frequencies, so it is not the boundary function of an $H^1$ function.');
          return `$|z| = ${v.fix(s.d, 3)}$: $\\;f(z) = ${cs(s.fz)}$, $\\;C[f^*](z) = ${cs(s.c)}$, $\\;P[f^*](z) = ${cs(s.pz)}$` + (s.key === 'h1' ? ' — all three agree.' : ' — the integrals of $f^*$ do not recover $f$.');
        });
      },
    },
    // ------------------------------------------------------------------ the theorem of F. and M. Riesz
    {
      num: '17.13',
      kind: 'Theorem',
      name: 'Theorem of F. and M. Riesz',
      credit: 'F. Riesz & M. Riesz, 1916',
      statement: String.raw`Let $\mu$ be a complex Borel measure on $\T$ whose Fourier coefficients
$$\hat\mu(n)=\int_{-\pi}^{\pi}e^{-int}\,d\mu(t)$$
vanish for all negative integers $n$. Then $\mu$ is absolutely continuous with respect to Lebesgue measure $m$ on $\T$.`,
      idea: String.raw`Expand the Poisson integral $f=P[d\mu]$ in the Fourier modes $r^{|n|}e^{in\theta}$: because $\hat\mu(n)=0$ for $n<0$, only the powers $z^n$, $n\ge0$, survive, so $f$ is holomorphic, and $\int|f_r|\,dm\le\|\mu\|$, so $f\in H^1$. By 17.11, $f_r\to f^*$ in $L^1(\T)$; on the other hand $f_r\,dm\to\mu$ weak* (the Poisson integrals of a measure converge to it, chapter 11). The two limits coincide: $d\mu=f^*\,dm$. Since $\log|f^*|\in L^1$ (17.9), $f^*\ne0$ a.e. when $\mu\ne0$, so $\mu$ and $m$ are even mutually absolutely continuous.`,
      caption: String.raw`**Analytic measure**: $d\mu=f^*dm$ with $f=(1-z)^{-0.8}\in H^1$; its density (teal ribbon around the circle) is so concentrated at $1$ that it looks like a point mass, the negative coefficients are $0$ — and indeed the mass of small arcs around $1$ tends to $0$ (bottom). **Point mass**: $\mu_N=\delta_1+g_N\,dm$ where $g_N=-\sum_{k=1}^Ne^{-ikt}$ cancels the first $N$ negative coefficients of $\delta_1$. Raise $N$: the bars at $-N\le n<0$ vanish, but the total mass $\|\mu_N\|$ grows like $\log N$, so no measure with $\hat\mu(n)=0$ for all $n<0$ can contain the atom.`,
      deps: ['rca-17.12', 'rca-17.11', 'rca-17.9', 'rca-6.19'],
      tags: ['measures', 'Fourier coefficients', 'absolute continuity'],
      viz(v) {
        const mode = v.select('$\\mu$', [{ value: 'an', label: 'analytic: $f^*dm$, $f=(1-z)^{-0.8}$' }, { value: 'pt', label: 'point mass $+$ cancellation' }], 'an');
        const NS = v.slider('cancelled coefficients $N$', 0, 60, 8, { int: true });
        const L = v.stage({ x: [-1.7, 1.7], y: [-1.45, 1.45], equal: true, height: 300, axes: false, minWidth: 240, title: 'the measure on $\\T$ (density $|d\\mu/dm|$ and atoms)' });
        const R = v.stage({ x: [-20.8, 20.8], y: [0, 1.2], height: 300, axes: 'box', xlabel: 'n', weight: 1.3, title: '$|\\hat\\mu(n)|$, $-20\\le n\\le20$' });
        const B = v.stage({ x: [0, 1], y: [0, 1], height: 190, axes: 'box', full: true });
        const al = 0.8, TOT = v.M.gamma(1 - al) / v.M.gamma(1 - al / 2) ** 2;
        const dens = (t) => Math.pow(Math.hypot(1 - Math.cos(t), Math.sin(t)), -al);
        // coefficients of (1−z)^{−α}: Γ(n+α)/(Γ(α) n!)
        const cA = [1]; for (let n = 1; n <= 20; n++) cA.push(cA[n - 1] * (n - 1 + al) / n);
        // ‖g_N‖₁ = (1/2π)∫|sin(Nt/2)/sin(t/2)| dt
        const gNorm = (N) => { if (!N) return 0; const M2 = 6000; let s = 0; for (let j = 0; j < M2; j++) { const t = Math.PI * (j + 0.5) / M2; s += Math.abs(Math.sin(N * t / 2) / Math.sin(t / 2)); } return s / M2; };
        const NORMS = []; for (let N = 1; N <= 400; N = Math.ceil(N * 1.12)) NORMS.push([N, 1 + gNorm(N)]);
        // mass of arcs |t|<δ for the analytic measure
        const arcMass = (d) => meanC((t) => (Math.abs(t) < d ? dens(t) : 0), 6000, 0) / TOT;
        const ARCS = []; for (let k = 0; k <= 40; k++) { const d = Math.pow(10, -6 + 6 * k / 40) * Math.PI; ARCS.push([Math.log10(d), arcMass(d)]); }
        let st = null;
        v.render(() => {
          const m = mode.value, N = NS.value;
          NS.el.hidden = m !== 'pt';
          L.circle(0, 0, 1, { color: 'muted', width: 1.2 });
          const ribbon = (g, scale, cap) => {
            const out = [], inn = [];
            for (let k = 0; k <= 720; k++) { const t = -Math.PI + TAU * k / 720, h = Math.min(cap, scale * g(t)); out.push([(1 + h) * Math.cos(t), (1 + h) * Math.sin(t)]); inn.push([Math.cos(t), Math.sin(t)]); }
            L.poly(out.concat(inn.reverse()), { fill: 'teal', fillAlpha: 0.35, color: 'teal', width: 1.2 });
          };
          let co;
          if (m === 'an') {
            ribbon(dens, 0.08, 0.42);
            L.corner('density → ∞ at the point 1', 'tl', { color: 'teal', weight: 600 });
            co = []; for (let n = -20; n <= 20; n++) co.push([n, n < 0 ? 0 : cA[n]]);
            B.setTitle('$|\\mu|(\\{|t|<\\delta\\})/\\|\\mu\\|$ against $\\delta$ (log scale): no mass at the point $1$');
            B.setView([-6.1 + Math.log10(Math.PI), Math.log10(Math.PI) + 0.1], [0, 1.08]);
            B.setTicks([-6, -5, -4, -3, -2, -1, 0].map((k) => [k, `10${k === 0 ? '⁰' : '⁻' + '⁰¹²³⁴⁵⁶'[-k]}`]), null);
            B.path(ARCS, { color: 'accent', width: 2.4 });
            B.hline(1, { color: 'muted', width: 1, dash: [4, 4] });
            B.text('whole circle', Math.log10(Math.PI), 1.0, { color: 'muted', size: 11, baseline: 'bottom', align: 'right', dy: -3 });
            st = { m, small: ARCS[0][1], d0: Math.pow(10, -6) * Math.PI };
          } else {
            const gN = (t) => { if (!N) return 0; const s = Math.sin(t / 2); return Math.abs(s) < 1e-9 ? N : Math.abs(Math.sin(N * t / 2) / s); };
            ribbon(gN, 0.025, 0.42);
            L.arrow(1, 0, 1.62, 0, { color: 'red', width: 3, head: 11 });
            L.tex('\\delta_1', 1.5, 0.16, { color: 'red', size: 15 });
            co = []; for (let n = -20; n <= 20; n++) co.push([n, n < 0 && n >= -N ? 0 : 1]);
            B.setTitle('total variation $\\|\\mu_N\\|=1+\\|g_N\\|_1$ against $N$ (log scale)');
            B.setView([-0.05, Math.log10(400) + 0.05], [0, NORMS[NORMS.length - 1][1] * 1.1]);
            B.setTicks([[0, '1'], [1, '10'], [2, '100'], [Math.log10(400), '400']], null);
            B.path(NORMS.map(([n, s]) => [Math.log10(n), s]), { color: 'red', width: 2.4 });
            const cur = N ? 1 + gNorm(N) : 1;
            B.dot(Math.log10(Math.max(1, N)), cur, { color: 'red', r: 5.5 });
            st = { m, N, cur };
          }
          R.setView(null, [-0.09, 1.2]);
          R.vband(-20.8, -0.5, { color: 'red', alpha: 0.05 });
          for (const [n, a] of co) R.line(n, 0, n, Math.max(a, 0.004), { color: n < 0 ? 'red' : 'accent', width: 6, cap: 'butt', alpha: 0.78 });
          const negZero = co.filter((q) => q[0] < 0).every((q) => q[1] === 0);
          R.corner(negZero ? 'μ̂(n) = 0 for every n < 0 shown' : 'some μ̂(n) ≠ 0 with n < 0', 'tl', { color: negZero ? 'green' : 'red', weight: 600 });
          v.legend([['teal', 'density of the absolutely continuous part', { area: true }], ['red', 'atom; $\\hat\\mu(n)$, $n<0$'], ['accent', '$\\hat\\mu(n)$, $n\\ge0$', { area: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          if (s.m === 'an') return `Analytic and absolutely continuous: $|\\mu|(\\{|t|<\\delta\\})/\\|\\mu\\| = ${v.fmt(s.small, 3)}$ already for $\\delta = ${v.sci(s.d0, 2)}$, and it tends to $0$ (like $\\delta^{0.2}$) — the density is huge near $1$ but carries no point mass.`;
          return `$N = ${s.N}$: $\\hat\\mu_N(n)=0$ for $-${s.N}\\le n\\le -1$ but $\\hat\\mu_N(n)=1$ for $n<-${s.N}$; $\\;\\|\\mu_N\\| = ${v.fix(s.cur, 3)}$, growing like $\\frac{4}{\\pi^2}\\log N$ — unbounded.`;
        });
      },
    },
  ],
};
