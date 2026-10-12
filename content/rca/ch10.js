// Rudin, Real and Complex Analysis — Chapter 10: Elementary Properties of Holomorphic Functions

// ---------------------------------------------------------------- helpers shared by this file
// Phase-portrait colour of w = re + i im (same scheme as Stage.domain): hue = arg w, bands = log2|w|.
// `fade` in [0,1] blends toward the RGB colour `bg` (pass v.rgb('panel') so it works in both themes).
function phaseRGB(M, re, im, fade = 0, bg = null, contours = true) {
  if (!isFinite(re) || !isFinite(im)) return bg ? [bg[0], bg[1], bg[2]] : [250, 250, 250];
  const t = M.fract(Math.log2(Math.hypot(re, im) + 1e-300));
  const c = M.hsl2rgb(Math.atan2(im, re) / M.TAU, 0.62, contours ? 0.42 + 0.2 * Math.pow(t, 0.7) : 0.52);
  if (!fade || !bg) return c;
  return [c[0] + (bg[0] - c[0]) * fade, c[1] + (bg[1] - c[1]) * fade, c[2] + (bg[2] - c[2]) * fade];
}
// Evaluate Σ c_n w^n (coefficients as parallel re/im arrays) at w = x + iy by Horner's rule.
function hornerXY(cr, ci, x, y) {
  let sr = 0, si = 0;
  for (let n = cr.length - 1; n >= 0; n--) { const t = sr * x - si * y + cr[n]; si = sr * y + si * x + ci[n]; sr = t; }
  return [sr, si];
}
// A small "×" marking a singular point, with a halo so it reads on top of a phase portrait.
function xMark(S, x, y, color = 'ink', size = 5.5) {
  const d = size / S.scale;
  for (const [col, w] of [['panel', 5], [color, 2.2]]) {
    S.line(x - d, y - d, x + d, y + d, { color: col, width: w });
    S.line(x - d, y + d, x + d, y - d, { color: col, width: w });
  }
}
const SUP = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];
const sup = (n) => (n < 0 ? '⁻' : '') + String(Math.abs(n)).split('').map((d) => SUP[+d]).join('');
const sub = (n) => String(n).split('').map((d) => '₀₁₂₃₄₅₆₇₈₉'[+d]).join('');

export default {
  book: 'rca',
  chapter: 10,
  title: 'Elementary Properties of Holomorphic Functions',
  summary: String.raw`Complex differentiability turns out to be astonishingly rigid. Starting from line integrals and the index of a closed path, Rudin proves Cauchy's theorem and formula in convex sets, derives power-series expansions, the identity theorem, Liouville, the maximum modulus theorem and the open mapping theorem, and finishes with the global Cauchy theorem and the residue calculus.`,
  items: [
    // ------------------------------------------------------------------ complex differentiation
    {
      num: '10.2',
      kind: 'Definition',
      name: 'Complex derivative; the class H(Ω)',
      statement: String.raw`Let $\Omega\subset\C$ be open and $f:\Omega\to\C$. If $z_0\in\Omega$ and the limit
$$f'(z_0)=\lim_{z\to z_0}\frac{f(z)-f(z_0)}{z-z_0}$$
exists — $z$ being allowed to approach $z_0$ through $\Omega\setminus\{z_0\}$ in any manner — it is called the **derivative** of $f$ at $z_0$. If $f'(z_0)$ exists at every $z_0\in\Omega$, $f$ is **holomorphic** (or analytic) in $\Omega$. The class of all functions holomorphic in $\Omega$ is denoted $H(\Omega)$.`,
      idea: String.raw`The definition reads exactly like the real one (pma-5.1), but the limit is two-dimensional: writing $z=z_0+he^{i\theta}$, the quotient must tend to the same number for *every* direction $\theta$. Real-linear maps fail this badly — for $\bar z$ the quotient is $e^{-2i\theta}$ — so complex differentiability is much stronger than differentiability as a map of $\R^2$. Sums, products and compositions of holomorphic functions are holomorphic with the usual rules (Rudin's remarks in 10.3), so $H(\Omega)$ is a ring.`,
      caption: String.raw`Drag $z_0$, turn the gold direction dial and shrink $h$. Every point $z_0+he^{i\theta}$ of the small circle produces one difference quotient; the right panel shows all of them at once. For a holomorphic $f$ the whole set collapses onto the single number $f'(z_0)$. For $\bar z$ it stays the unit circle however small $h$ gets; for $|z|^2$ it collapses only when $z_0=0$.`,
      deps: ['pma-5.1', 'pma-4.1'],
      see: ['pma-5.5', 'fa-3.31'],
      tags: ['holomorphic', 'derivative'],
      viz(v) {
        const { Cx, TAU } = v.M;
        const one = new Cx(1, 0);
        const FN = {
          sq: { label: '$z^2$', f: (z) => z.mul(z), d: (z) => z.scale(2) },
          exp: { label: '$e^z$', f: (z) => z.exp(), d: (z) => z.exp() },
          inv: { label: '$1/z$', f: (z) => one.div(z), d: (z) => one.div(z.mul(z)).neg() },
          conj: { label: '$\\bar z$', f: (z) => z.conj() },
          abs2: { label: '$|z|^2$', f: (z) => new Cx(z.abs2(), 0), d: (z) => (z.abs() < 1e-9 ? new Cx(0, 0) : null) },
        };
        const which = v.select('$f$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'sq');
        const hS = v.slider('$h=|z-z_0|$', 0.004, 0.8, 0.45, { log: true, fmt: (x) => v.fmt(x, 2) });
        const L = v.stage({ x: [-2, 2], y: [-1.6, 1.6], equal: true, height: 340, ticks: false, title: 'domain: phase of $f$, the point $z_0$, the circle $|z-z_0|=h$' });
        const R = v.stage({ x: [-2, 2], y: [-1.6, 1.6], equal: true, height: 340, title: 'every quotient $\\tfrac{f(z_0+he^{i\\theta})-f(z_0)}{he^{i\\theta}}$, $0\\le\\theta<2\\pi$' });
        const RHO = 0.6;
        const z0 = L.handle(0.7, 0.3, { color: 'ink', label: 'z₀', labelPos: 'sw' });
        const dial = L.handle(0.7 + RHO * Math.cos(1.1), 0.3 + RHO * Math.sin(1.1), {
          color: 'gold', r: 6, label: 'θ', labelPos: 'ne',
          constrain: (x, y) => { const a = Math.atan2(y - z0.y, x - z0.x); return [z0.x + RHO * Math.cos(a), z0.y + RHO * Math.sin(a)]; },
        });
        let prev = [z0.x, z0.y];
        z0.onDrag = () => { dial.x += z0.x - prev[0]; dial.y += z0.y - prev[1]; prev = [z0.x, z0.y]; };
        let st = null;
        v.render(() => {
          const key = which.value, F = FN[key];
          if (key === 'inv' && Math.hypot(z0.x, z0.y) < 0.35) { const s = 0.35 / (Math.hypot(z0.x, z0.y) || 1); z0.x = (z0.x || 0.35) * s; z0.y *= s; }
          const theta = Math.atan2(dial.y - z0.y, dial.x - z0.x);
          dial.x = z0.x + RHO * Math.cos(theta); dial.y = z0.y + RHO * Math.sin(theta); prev = [z0.x, z0.y];
          const c = new Cx(z0.x, z0.y);
          let h = hS.value; const capped = key === 'inv' && h > 0.8 * c.abs();
          if (capped) h = 0.8 * c.abs();
          const fc = F.f(c);
          const Q = (t) => { const k = Cx.polar(h, t); return F.f(c.add(k)).sub(fc).div(k); };
          // ---- left: domain
          L.domain(F.f, { key, alpha: 0.55 });
          L.circle(c.re, c.im, RHO, { color: 'ink', width: 1, dash: [3, 4], alpha: 0.45 });
          L.line(c.re, c.im, dial.x, dial.y, { color: 'gold', width: 1.6 });
          L.circle(c.re, c.im, h, { color: 'panel', width: 5 });
          L.circle(c.re, c.im, h, { color: 'accent', width: 2.2 });
          const pt = c.add(Cx.polar(h, theta));
          L.dot(c.re + h, c.im, { color: 'blue', r: 4 });
          L.dot(c.re, c.im + h, { color: 'red', r: 4 });
          L.dot(pt.re, pt.im, { color: 'gold', r: 5 });
          if (key === 'inv') xMark(L, 0, 0, 'ink');
          // ---- right: the set of quotients
          const pts = []; let mx = 0, my = 0; const n = 240;
          for (let i = 0; i <= n; i++) { const q = Q(TAU * i / n); pts.push([q.re, q.im]); if (i < n) { mx += q.re / n; my += q.im / n; } }
          let rad = 0, diam = 0;
          for (const p of pts) rad = Math.max(rad, Math.hypot(p[0] - mx, p[1] - my));
          for (let i = 0; i < n; i += 4) for (let j = i + 2; j < n; j += 4) diam = Math.max(diam, Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]));
          const half = Math.max(1.05, rad * 1.45);
          R.setView([mx - half * 1.3, mx + half * 1.3], [my - half, my + half]);
          R.path(pts, { color: 'accent', width: 2.6 });
          const d = F.d ? F.d(c) : null;
          if (d) R.dot(d.re, d.im, { color: 'green', r: 8, hollow: true, width: 2.4, label: "f′(z₀)", labelPos: 'se' });
          const q0 = Q(0), q1 = Q(Math.PI / 2), qt = Q(theta);
          R.dot(q0.re, q0.im, { color: 'blue', r: 5 });
          R.dot(q1.re, q1.im, { color: 'red', r: 5 });
          R.dot(qt.re, qt.im, { color: 'gold', r: 6.5 });
          R.corner(`h = ${v.fmt(h, 3)}${capped ? ' (kept below |z₀| so the pole stays outside)' : ''}`, 'tl');
          R.corner(`spread of the quotients: ${v.fmt(diam, 3)}`, 'bl', { color: d ? 'green' : 'red', weight: 600 });
          st = { d, diam, h, key, c };
          v.legend([['accent', 'all quotients'], ['blue', '$h$ real ($\\theta=0$)', { dot: true }], ['red', '$h$ imaginary ($\\theta=\\pi/2$)', { dot: true }], ['gold', 'direction $\\theta$', { dot: true }], ['green', "$f'(z_0)$", { dot: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          if (s.key === 'conj') return `Spread $= ${v.fix(s.diam, 3)}$ for every $h$: real $h$ gives $+1$, imaginary $h$ gives $-1$, so $\\bar z$ has no complex derivative anywhere.`;
          if (s.key === 'abs2' && !s.d) return `Spread $\\approx 2|z_0| = ${v.fix(2 * s.c.abs(), 3)}$ does not shrink with $h$: $|z|^2$ is differentiable only at $z_0=0$ (drag $z_0$ there), so it is not in $H(\\Omega)$ for any open $\\Omega$.`;
          return `Spread $= ${v.fmt(s.diam, 3)} \\to 0$ as $h\\to 0$; the quotients converge to $f'(z_0) = ${s.d.toString(4).replace('i', '\\,i')}$ from every direction.`;
        });
      },
    },
    {
      num: '10.5',
      kind: 'Definition',
      name: 'Functions representable by power series',
      verify: true,
      statement: String.raw`A function $f$ defined in an open set $\Omega\subset\C$ is **representable by power series in $\Omega$** if to every disc $D(a;r)\subset\Omega$ there corresponds a power series $\sum_{n\ge0}c_n(z-a)^n$ which converges to $f(z)$ for every $z\in D(a;r)$.

Recall that each power series $\sum c_n(z-a)^n$ has a radius of convergence $R\in[0,\infty]$, given by $1/R=\limsup_n|c_n|^{1/n}$: it converges absolutely and uniformly on every closed disc $\overline D(a;\rho)$ with $\rho<R$, and diverges at every $z$ with $|z-a|>R$.`,
      idea: String.raw`Representability is a *local* demand with one series per centre: no single series need represent $f$ on all of $\Omega$, because a series centred at $a$ can only converge in a disc, while $\Omega$ may be any open set. The radius statement is the root test (pma-3.39) together with the Weierstrass M-test.`,
      caption: String.raw`Here $f=\sum_j 1/(z-p_j)$ on $\Omega=\C\setminus\{p_1,p_2,p_3\}$. Drag the centre $a$: inside its largest disc $D(a;r)\subset\Omega$ the picture shows the partial sum $S_N$ of the series about $a$ (full colour), elsewhere the true $f$ (faded). Pin discs to cover more of $\Omega$ — each needs its own series. Right: the error of $S_N$ on circles $|z-a|=s$; it shrinks with $N$ only for $s<r$.`,
      deps: ['pma-3.38', 'pma-3.39'],
      see: ['pma-8.4'],
      tags: ['power series', 'holomorphic'],
      viz(v) {
        const { Cx } = v.M;
        const P = [new Cx(0.95, 0.4), new Cx(-0.45, 0.95), new Cx(-0.6, -0.8)];
        const fXY = (x, y) => { let re = 0, im = 0; for (const p of P) { const dx = x - p.re, dy = y - p.im, q = dx * dx + dy * dy; re += dx / q; im -= dy / q; } return [re, im]; };
        const radius = (a) => Math.min(...P.map((p) => p.sub(a).abs()));
        const series = (a, N) => { // c_n = −Σ_j (p_j − a)^{−n−1}
          const cr = new Float64Array(N + 1), ci = new Float64Array(N + 1);
          for (const p of P) { const q = new Cx(1, 0).div(p.sub(a)); let pw = q; for (let n = 0; n <= N; n++) { cr[n] -= pw.re; ci[n] -= pw.im; pw = pw.mul(q); } }
          return { a, r: radius(a), cr, ci };
        };
        const Ns = v.slider('terms $N$', 1, 40, 16, { int: true });
        const L = v.stage({ x: [-2.3, 2.3], y: [-1.75, 1.75], equal: true, height: 360, weight: 1.35, ticks: false, title: '$\\Omega=\\C\\setminus\\{p_1,p_2,p_3\\}$: $S_N$ inside the discs, $f$ (faded) elsewhere' });
        const R = v.stage({ x: [0, 1.5], y: [-16.5, 3], height: 360, axes: 'box', xlabel: '|z − a| / r', yticks: [[-15, '10⁻¹⁵'], [-10, '10⁻¹⁰'], [-5, '10⁻⁵'], [0, '1']], title: '$\\max_{|z-a|=s}|f-S_N|$ (log scale)' });
        const a = L.handle(-1.2, -0.35, { color: 'ink', label: 'a', labelPos: 'sw' });
        let pins = [series(new Cx(0.3, -0.1), 40)];
        v.button('Pin this disc', () => { pins.push(series(new Cx(a.x, a.y), 40)); if (pins.length > 6) pins.shift(); });
        v.button('Clear pins', () => { pins = []; });
        let st = null;
        v.render(() => {
          const N = Ns.value, ac = new Cx(a.x, a.y);
          const live = series(ac, N);
          const bg = v.rgb('panel');
          const trunc = (s) => ({ ...s, cr: s.cr.subarray(0, N + 1), ci: s.ci.subarray(0, N + 1) });
          const discs = [live, ...pins.map(trunc).reverse()];
          L.raster((x, y) => {
            for (const s of discs) {
              const dx = x - s.a.re, dy = y - s.a.im;
              if (dx * dx + dy * dy < s.r * s.r) { const [re, im] = hornerXY(s.cr, s.ci, dx, dy); return phaseRGB(v.M, re, im); }
            }
            const [re, im] = fXY(x, y); return phaseRGB(v.M, re, im, 0.5, bg);
          }, { key: `${a.x},${a.y},${N},${pins.map((p) => p.a.re + ':' + p.a.im).join('|')}`, res: 2 });
          for (const s of pins) L.circle(s.a.re, s.a.im, s.r, { color: 'ink', width: 1.3, alpha: 0.7 });
          L.circle(ac.re, ac.im, live.r, { color: 'panel', width: 5 });
          L.circle(ac.re, ac.im, live.r, { color: 'green', width: 2.4 });
          const near = P.reduce((b, p) => (p.sub(ac).abs() < b.sub(ac).abs() ? p : b));
          L.line(ac.re, ac.im, near.re, near.im, { color: 'ink', width: 1.2, dash: [4, 3] });
          L.tex('r(a)', (ac.re + near.re) / 2, (ac.im + near.im) / 2, { color: 'ink', size: 14, dy: -11 });
          for (const s of pins) L.dot(s.a.re, s.a.im, { color: 'ink', r: 3 });
          P.forEach((p, j) => { xMark(L, p.re, p.im, 'ink', 6); L.tex(`p_${j + 1}`, p.re, p.im, { color: 'ink', size: 14, dx: 13, dy: -10 }); });
          // error profile
          const xs = [], ys = [];
          for (let i = 0; i <= 150; i++) {
            const s = 1.5 * i / 150; let e = 0;
            for (let k = 0; k < 72; k++) {
              const t = 2 * Math.PI * (k + 0.5) / 72, dx = s * live.r * Math.cos(t), dy = s * live.r * Math.sin(t);
              const [sr, si] = hornerXY(live.cr, live.ci, dx, dy), [fr, fi] = fXY(ac.re + dx, ac.im + dy);
              e = Math.max(e, Math.hypot(fr - sr, fi - si));
            }
            xs.push(s); ys.push(Math.max(-16, Math.min(3, Math.log10(e + 1e-300))));
          }
          R.vband(0, 1, { color: 'green', alpha: 0.07 });
          R.vband(1, 1.5, { color: 'red', alpha: 0.06 });
          R.vline(1, { color: 'green', width: 1.5, dash: [5, 4] });
          R.path(xs.map((x, i) => [x, ys[i]]), { color: 'gold', width: 2.4 });
          R.text('converges', 0.5, -13.6, { color: 'green', align: 'center', size: 12.5, weight: 600 });
          R.text('diverges', 1.25, -13.6, { color: 'red', align: 'center', size: 12.5, weight: 600 });
          R.tex('s=r(a)', 1, 2.2, { color: 'green', size: 13, align: 'right', dx: -5 });
          const at = (s) => ys[Math.round(s / 1.5 * 150)];
          st = { r: live.r, N, e5: at(0.5), e12: at(1.2), pins: pins.length };
          v.legend([['green', 'largest disc $D(a;r)\\subset\\Omega$'], ['ink', 'pinned discs'], ['gold', 'error of $S_N$ on $|z-a|=s$']]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `$r(a) = ${v.fix(s.r, 3)}$ (distance to the nearest $p_j$). With $N=${s.N}$: error $\\approx 10^{${v.fix(s.e5, 1)}}$ on $|z-a| = r/2$, but $10^{${v.fix(s.e12, 1)}}$ on $|z-a| = 1.2\\,r$. Pinned discs: ${s.pins}.`;
        });
      },
    },
    {
      num: '10.6',
      kind: 'Theorem',
      name: 'Power series are holomorphic and differentiate termwise',
      statement: String.raw`If $f$ is representable by power series in $\Omega$, then $f\in H(\Omega)$ and $f'$ is also representable by power series in $\Omega$. Precisely: if $f(z)=\sum_{n\ge0}c_n(z-a)^n$ for all $z\in D(a;r)$, then for the same $z$
$$f'(z)=\sum_{n\ge1}nc_n(z-a)^{n-1}.$$`,
      idea: String.raw`The differentiated series has the same radius of convergence, since $n^{1/n}\to1$. Fix $w$ in the disc and compare the difference quotient $\frac{f(z)-f(w)}{z-w}$ with $g(w)=\sum nc_n(w-a)^{n-1}$ term by term: the identity $\frac{z^n-w^n}{z-w}-nw^{n-1}=(z-w)\sum_{k=1}^{n-1}kw^{k-1}z^{n-k-1}$ bounds the $n$-th difference by $|z-w|\,n^2|c_n|\rho^{n-2}$, and $\sum n^2|c_n|\rho^{n-2}<\infty$ for $\rho<r$. So the quotients converge to $g(w)$ as $z\to w$.`,
      caption: String.raw`Choose a series and drag $z$ inside its disc of convergence. On the right, the gold polygon joins the partial sums $S_1',S_2',\dots,S_N'$ of the termwise derivative; the orange dots are honest difference quotients $\frac{f(z+h)-f(z)}{h}$ for $h$ shrinking by halves. Both home in on the same green point $f'(z)$.`,
      deps: ['rca-10.5', 'rca-10.2', 'pma-3.39'],
      see: ['pma-8.1', 'pma-7.17'],
      tags: ['power series', 'holomorphic'],
      viz(v) {
        const { Cx, factorial } = v.M;
        const one = new Cx(1, 0);
        const SER = {
          geo: { label: '$\\sum z^n=\\frac{1}{1-z}$', R: 1, c: () => 1, f: (z) => one.div(one.sub(z)), df: (z) => one.div(one.sub(z).pow(2)) },
          log: { label: '$\\sum\\frac{z^n}{n}=-\\log(1-z)$', R: 1, c: (n) => (n ? 1 / n : 0), f: (z) => one.sub(z).log().neg(), df: (z) => one.div(one.sub(z)) },
          exp: { label: '$\\sum\\frac{z^n}{n!}=e^z$', R: Infinity, c: (n) => 1 / factorial(n), f: (z) => z.exp(), df: (z) => z.exp() },
        };
        const which = v.select('', Object.entries(SER).map(([value, o]) => ({ value, label: o.label })), 'geo');
        const Ns = v.slider('terms $N$ of $\\sum nc_nz^{n-1}$', 1, 60, 8, { int: true });
        const L = v.stage({ x: [-1.45, 1.45], y: [-1.15, 1.15], equal: true, height: 340, ticks: false, title: 'phase of $f=\\sum c_nz^n$ in its disc of convergence' });
        const R = v.stage({ x: [-2, 2], y: [-1.5, 1.5], equal: true, height: 340, title: "$f'(z)$: termwise partial sums vs difference quotients" });
        const z = L.handle(0.42, 0.38, { color: 'ink', label: 'z', constrain: (x, y) => { const S = SER[which.value]; if (!isFinite(S.R)) return [x, y]; const m = Math.hypot(x, y), lim = 0.86 * S.R; return m > lim ? [x * lim / m, y * lim / m] : [x, y]; } });
        let last = null, st = null;
        v.render(() => {
          const key = which.value, S = SER[key], N = Ns.value;
          if (last !== key) {
            last = key;
            if (isFinite(S.R)) L.setView([-1.45, 1.45], [-1.15, 1.15]); else L.setView([-2.6, 2.6], [-2.05, 2.05]);
            const m = Math.hypot(z.x, z.y); if (isFinite(S.R) && m > 0.86) { z.x *= 0.86 / m; z.y *= 0.86 / m; }
          }
          L.raster((x, y) => {
            if (x * x + y * y >= S.R * S.R) return null;
            const w = S.f(new Cx(x, y)); return phaseRGB(v.M, w.re, w.im);
          }, { key, res: 2 });
          if (isFinite(S.R)) { L.circle(0, 0, S.R, { color: 'ink', width: 1.6, dash: [6, 4] }); L.tex('|z|=R', S.R * 0.71, -S.R * 0.71, { color: 'ink', size: 13, align: 'left', dx: 8, dy: 8 }); }
          const zc = new Cx(z.x, z.y);
          // termwise derivative partial sums S'_k(z) = Σ_{n=1}^{k} n c_n z^{n-1}
          const sums = [[0, 0]]; let acc = new Cx(0, 0), pw = one;
          for (let n = 1; n <= N; n++) { acc = acc.add(pw.scale(n * S.c(n))); pw = pw.mul(zc); sums.push([acc.re, acc.im]); }
          const d = S.df(zc), fz = S.f(zc);
          const u = Cx.polar(1, Math.PI / 5);
          const h0 = isFinite(S.R) ? 0.45 * (S.R - zc.abs()) : 0.6;
          const qs = [];
          for (let k = 0; k < 11; k++) { const h = u.scale(h0 / 2 ** k); const q = S.f(zc.add(h)).sub(fz).div(h); qs.push([q.re, q.im]); }
          const all = sums.concat(qs, [[d.re, d.im]]);
          let x0 = Math.min(...all.map((p) => p[0])), x1 = Math.max(...all.map((p) => p[0])), y0 = Math.min(...all.map((p) => p[1])), y1 = Math.max(...all.map((p) => p[1]));
          const cxm = (x0 + x1) / 2, cym = (y0 + y1) / 2, hw = Math.max(0.6, (x1 - x0) * 0.62, (y1 - y0) * 0.62 * 1.3);
          R.setView([cxm - hw, cxm + hw], [cym - hw / 1.3, cym + hw / 1.3]);
          R.path(qs, { color: 'orange', width: 1.2, alpha: 0.6 });
          qs.forEach((p, k) => R.dot(p[0], p[1], { color: 'orange', r: Math.max(2.5, 5.5 - k * 0.35) }));
          R.path(sums, { color: 'gold', width: 1.8 });
          R.dots(sums, { color: 'gold', r: 3 });
          R.dot(d.re, d.im, { color: 'green', r: 9, hollow: true, width: 2.6, label: "f′(z)", labelPos: 'ne' });
          const SN = sums[sums.length - 1];
          R.dot(SN[0], SN[1], { color: 'gold', r: 5.5, label: `S′${sub(N)}`, labelPos: 'sw' });
          R.dot(0, 0, { color: 'muted', r: 3 });
          st = { err: Math.hypot(SN[0] - d.re, SN[1] - d.im), qerr: Math.hypot(qs[10][0] - d.re, qs[10][1] - d.im), d, N, h: h0 / 1024, absz: zc.abs(), R: S.R };
          v.legend([['gold', "partial sums $S_N'(z)=\\sum_{n\\le N} nc_nz^{n-1}$"], ['orange', 'quotients $\\frac{f(z+h)-f(z)}{h}$, $h\\to0$', { dot: true }], ['green', "$f'(z)$", { dot: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `$|z| = ${v.fix(s.absz, 3)}${isFinite(s.R) ? ' < R = 1' : ''}$. $\\;|S_{${s.N}}'(z)-f'(z)| = ${v.fmt(s.err, 3)}$, $\\;$ quotient error at $|h| = ${v.fmt(s.h, 2)}$: $${v.fmt(s.qerr, 2)}$ — both limits are $f'(z) = ${s.d.toString(4).replace('i', '\\,i')}$.`;
        });
      },
    },
    {
      num: '10.6a',
      kind: 'Corollary',
      name: 'Derivatives of all orders; $c_k=f^{(k)}(a)/k!$',
      statement: String.raw`If $f$ is representable by power series in $\Omega$, then $f$ has derivatives of all orders in $\Omega$, each $f^{(k)}$ is again representable by power series in $\Omega$, and if $f(z)=\sum c_n(z-a)^n$ in $D(a;r)$ then
$$f^{(k)}(z)=\sum_{n\ge k}n(n-1)\cdots(n-k+1)\,c_n(z-a)^{n-k}\qquad(z\in D(a;r)).$$
In particular $c_k=f^{(k)}(a)/k!$, so for each $a\in\Omega$ there is exactly one power series about $a$ that represents $f$ near $a$.`,
      idea: String.raw`$f'$ satisfies the same hypothesis as $f$ (10.6), so the theorem can be applied again and again. Putting $z=a$ in the $k$-th derived series kills every term but $k!\,c_k$. Uniqueness follows because the coefficients are now expressed through $f$ alone.`,
      caption: String.raw`Drag the centre $a$ and raise $N$. The left panel colours the remainder $f-T_N$, where $T_N(z)=\sum_{k\le N}b_k(z-a)^k$ and $b_k=f^{(k)}(a)/k!$ is computed from the $k$-times differentiated series. Around $a$ the colours (hue $=\arg$) cycle exactly $N+1$ times — the remainder vanishes to order $N+1$ — and on the right $\log\max_{|z-a|=s}|f-T_N|$ is a line of slope $N+1$ (until it hits rounding error).`,
      deps: ['rca-10.6'],
      see: ['pma-8.1a', 'pma-8.4'],
      tags: ['power series', 'Taylor coefficients'],
      viz(v) {
        const { Cx, factorial, binom } = v.M;
        const one = new Cx(1, 0);
        const FN = {
          exp: { label: '$e^z$', R: Infinity, c: (n) => 1 / factorial(n), f: (z) => z.exp(), exact: (a, k) => a.exp().scale(1 / factorial(k)) },
          geo: { label: '$\\frac{1}{1-z}$', R: 1, c: () => 1, f: (z) => one.div(one.sub(z)), exact: (a, k) => one.div(one.sub(a).pow(k + 1)) },
          log: { label: '$\\log(1+z)$', R: 1, c: (n) => (n ? (n % 2 ? 1 : -1) / n : 0), f: (z) => one.add(z).log(), exact: (a, k) => (k ? one.div(one.add(a).pow(k)).scale((k % 2 ? 1 : -1) / k) : one.add(a).log()) },
        };
        const which = v.select('$f$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'geo');
        const Ns = v.slider('order $N$ of $T_N$', 0, 8, 2, { int: true });
        const L = v.stage({ x: [-1.3, 1.3], y: [-1.1, 1.1], equal: true, height: 340, ticks: false, title: 'phase of the remainder $f-T_N$ (Taylor polynomial about $a$)' });
        const R = v.stage({ x: [-2, 0], y: [-16, 1], height: 340, axes: 'box', xlabel: 'log₁₀ s', title: '$\\log_{10}\\max_{|z-a|=s}|f-T_N|$' });
        const a = L.handle(0.25, 0.2, { color: 'ink', label: 'a', labelPos: 'ne', constrain: (x, y) => { const F = FN[which.value]; const lim = isFinite(F.R) ? 0.55 : 1.4; const m = Math.hypot(x, y); return m > lim ? [x * lim / m, y * lim / m] : [x, y]; } });
        let last = null, st = null;
        v.render(() => {
          const key = which.value, F = FN[key], N = Ns.value;
          if (last !== key) { last = key; if (isFinite(F.R)) L.setView([-1.3, 1.3], [-1.1, 1.1]); else L.setView([-2.2, 2.2], [-1.8, 1.8]); }
          const ac = new Cx(a.x, a.y);
          // b_k = Σ_{n≥k} C(n,k) c_n a^{n−k}  (the k-times differentiated series at a, divided by k!)
          const b = [];
          for (let k = 0; k <= N; k++) {
            let s = new Cx(0, 0), pw = one;
            for (let n = k; n < k + 420; n++) { const t = binom(n, k) * F.c(n); if (t) s = s.add(pw.scale(t)); pw = pw.mul(ac); if (pw.abs() * binom(n + 1, k) < 1e-18) break; }
            b.push(s);
          }
          const br = Float64Array.from(b.map((w) => w.re)), bi = Float64Array.from(b.map((w) => w.im));
          const g = (x, y) => { const w = F.f(new Cx(x, y)); const [tr, ti] = hornerXY(br, bi, x - ac.re, y - ac.im); return [w.re - tr, w.im - ti]; };
          L.raster((x, y) => { if (x * x + y * y >= F.R * F.R) return null; const [re, im] = g(x, y); return phaseRGB(v.M, re, im, 0, null, false); }, { key: `${key},${a.x},${a.y},${N}`, res: 2 });
          if (isFinite(F.R)) {
            L.circle(0, 0, F.R, { color: 'ink', width: 1.4, dash: [6, 4] });
            L.circle(ac.re, ac.im, F.R - ac.abs(), { color: 'green', width: 1.6, dash: [3, 3] });
          }
          if (key === 'geo') xMark(L, 1, 0); if (key === 'log') xMark(L, -1, 0);
          // log–log profile
          const smax = isFinite(F.R) ? 0.95 * (F.R - ac.abs()) : 1.5, smin = smax / 100;
          const pts = [];
          for (let i = 0; i <= 90; i++) {
            const s = smin * (smax / smin) ** (i / 90); let e = 0;
            for (let k = 0; k < 48; k++) { const t = 2 * Math.PI * (k + 0.5) / 48; const [re, im] = g(ac.re + s * Math.cos(t), ac.im + s * Math.sin(t)); e = Math.max(e, Math.hypot(re, im)); }
            pts.push([Math.log10(s), Math.max(-16, Math.log10(e + 1e-300))]);
          }
          const lx0 = Math.log10(smin), lx1 = Math.log10(smax);
          const ylo = Math.min(-3, Math.floor(Math.min(...pts.map((p) => p[1]))) - 1), yhi = Math.max(1, Math.ceil(Math.max(...pts.map((p) => p[1]))) + 1);
          R.setView([lx0 - 0.05, lx1 + 0.05], [ylo, yhi]);
          // reference line of slope N+1 through the point at s = smax/3
          const ref = pts[Math.round(90 * Math.log(1 / 3 * smax / smin) / Math.log(smax / smin))];
          R.line(lx0, ref[1] - (N + 1) * (ref[0] - lx0), lx1, ref[1] + (N + 1) * (lx1 - ref[0]), { color: 'green', width: 1.5, dash: [6, 4] });
          R.path(pts, { color: 'accent', width: 2.6 });
          R.tex(`\\text{slope } N+1 = ${N + 1}`, (lx0 + lx1) / 2, ref[1] - (N + 1) * (ref[0] - (lx0 + lx1) / 2), { color: 'green', size: 13, align: 'left', dx: 10, dy: 12 });
          if (pts[0][1] <= -15.5) R.text('rounding floor', lx0 + 0.05, -15.4, { color: 'muted', size: 11.5 });
          st = { b, ac, F, N };
          v.legend([['ink', 'disc of convergence about $0$', { dash: true }], ['green', '$D(a;R-|a|)$: where the series about $a$ is guaranteed', { dash: true }], ['accent', 'measured remainder']]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const rows = [];
          for (let k = 0; k <= Math.min(s.N, 3); k++) { const e = s.F.exact(s.ac, k); rows.push(`$b_${k} = ${s.b[k].toString(4).replace('i', '\\,i')}$ (exact $f^{(${k})}(a)/${k}! = ${e.toString(4).replace('i', '\\,i')}$)`); }
          return rows.join('; $\\;$ ');
        });
      },
    },
    {
      num: '10.7',
      kind: 'Theorem',
      name: 'Cauchy-type integrals are representable by power series',
      statement: String.raw`Let $\mu$ be a complex (hence finite) measure on a measurable space $X$, let $\varphi$ be a complex measurable function on $X$, and let $\Omega$ be an open set in the plane that does not meet $\varphi(X)$. Then
$$f(z)=\int_X\frac{d\mu(\zeta)}{\varphi(\zeta)-z}\qquad(z\in\Omega)$$
is representable by power series in $\Omega$.`,
      idea: String.raw`Take $D(a;r)\subset\Omega$. Then $|\varphi(\zeta)-a|\ge r$ for every $\zeta$, so for $|z-a|<r$ the geometric series $\frac{1}{\varphi-z}=\sum_{n\ge0}\frac{(z-a)^n}{(\varphi-a)^{n+1}}$ converges uniformly on $X$. Since $\mu$ is finite the series may be integrated term by term, giving $f(z)=\sum c_n(z-a)^n$ with $c_n=\int_X(\varphi-a)^{-n-1}\,d\mu$ and $|c_n|\le\|\mu\|\,r^{-n-1}$.`,
      caption: String.raw`The measure $\mu$ is a positive density on the arc (line width $\propto$ density) plus two point masses, one of them complex — drag them. Drag $a$: the green disc is the largest one missing $\varphi(X)$, and inside it the picture shows the partial sum $S_N$ of the series about $a$ instead of $f$. Right: every coefficient $|c_n|$ lies below $\|\mu\|\,r^{-n-1}$ (total variation over $r^{n+1}$) — exactly the estimate that makes the series converge in $D(a;r)$. It is only a guarantee: here the $|c_n|$ grow much more slowly, because the branch of $f$ near $a$ continues analytically across the smooth arc (the density is real-analytic), so only the point masses and the ends of the arc limit the radius.`,
      deps: ['rca-10.5', 'rca-1.18', 'rca-1.38'],
      see: ['rca-10.15', 'rca-10.10'],
      tags: ['Cauchy transform', 'power series', 'measures'],
      viz(v) {
        const { Cx } = v.M;
        const K = 320;
        const phi = (t) => new Cx(-1.35 + 2.7 * t, -0.95 + 0.6 * Math.sin(Math.PI * t));
        const rho = (t) => 0.55 * (1 + 0.85 * Math.sin(3 * Math.PI * t)), RMAX = 0.55 * 1.85;
        const nodes = Array.from({ length: K }, (_, k) => { const t = (k + 0.5) / K; const p = phi(t); return { x: p.re, y: p.im, wr: rho(t) / K, wi: 0 }; });
        const ATOMS = [{ w: new Cx(0.35, 0), lab: 'm₁ = 0.35' }, { w: new Cx(0, 0.3), lab: 'm₂ = 0.3i' }];
        const Ns = v.slider('terms $N$', 1, 30, 8, { int: true });
        const L = v.stage({ x: [-2.1, 2.1], y: [-1.45, 1.6], equal: true, height: 360, weight: 1.3, ticks: false, title: 'phase of $f(z)=\\int\\frac{d\\mu(\\zeta)}{\\varphi(\\zeta)-z}$; inside $D(a;r)$ the partial sum $S_N$' });
        const R = v.stage({ x: [-0.8, 24.8], y: [-10, 2], height: 360, axes: 'box', xlabel: 'n', title: '$|c_n|$ (log scale) under the bound $\\|\\mu\\|\\,r^{-n-1}$' });
        const at = [L.handle(-0.95, 0.95, { color: 'ink', r: 6.5, label: ATOMS[0].lab, labelPos: 'n' }), L.handle(1.15, 0.85, { color: 'ink', r: 6.5, label: ATOMS[1].lab, labelPos: 'n' })];
        const a = L.handle(0.15, 0.25, { color: 'green', label: 'a', labelPos: 'sw' });
        const norm = nodes.reduce((s, n) => s + n.wr, 0) + ATOMS.reduce((s, m) => s + m.w.abs(), 0);
        const allPts = () => nodes.concat(at.map((h, j) => ({ x: h.x, y: h.y, wr: ATOMS[j].w.re, wi: ATOMS[j].w.im })));
        const fXY = (pts, x, y) => { let re = 0, im = 0; for (const p of pts) { const dx = p.x - x, dy = p.y - y, q = dx * dx + dy * dy; re += (p.wr * dx + p.wi * dy) / q; im += (p.wi * dx - p.wr * dy) / q; } return [re, im]; };
        let st = null;
        v.render(() => {
          const N = Ns.value, pts = allPts(), bg = v.rgb('panel');
          const ac = new Cx(a.x, a.y);
          let r = Infinity, near = null;
          for (const p of pts) { const d = Math.hypot(p.x - ac.re, p.y - ac.im); if (d < r) { r = d; near = p; } }
          // c_n = Σ w (ζ − a)^{−n−1}
          const NC = 25, cr = new Float64Array(NC), ci = new Float64Array(NC);
          for (const p of pts) { const q = new Cx(1, 0).div(new Cx(p.x - ac.re, p.y - ac.im)); let pw = q.mul(new Cx(p.wr, p.wi)); for (let n = 0; n < NC; n++) { cr[n] += pw.re; ci[n] += pw.im; pw = pw.mul(q); } }
          const atomKey = at.map((h) => `${h.x},${h.y}`).join('|');
          L.raster((x, y) => { const [re, im] = fXY(pts, x, y); return phaseRGB(v.M, re, im, 0.5, bg); }, { key: atomKey, id: 'f', res: 2 });
          const scr = cr.subarray(0, N + 1), sci = ci.subarray(0, N + 1);
          L.raster((x, y) => { const dx = x - ac.re, dy = y - ac.im; if (dx * dx + dy * dy >= r * r) return null; const [re, im] = hornerXY(scr, sci, dx, dy); return phaseRGB(v.M, re, im); }, { key: `${atomKey}|${a.x},${a.y},${N}`, id: 's', res: 2 });
          // the measure: a ribbon along the arc whose width is proportional to the density
          const side = [], other = [];
          for (let k = 0; k <= 90; k++) {
            const t = k / 90, p = phi(t), q = phi(Math.min(1, t + 1e-3)), o = phi(Math.max(0, t - 1e-3));
            const tx = q.re - o.re, ty = q.im - o.im, tl = Math.hypot(tx, ty), hw = (0.8 + 4.2 * rho(t) / RMAX) / L.scale;
            side.push([p.re - ty / tl * hw, p.im + tx / tl * hw]); other.push([p.re + ty / tl * hw, p.im - tx / tl * hw]);
          }
          const ribbon = side.concat(other.reverse());
          L.poly(ribbon, { color: 'panel', width: 3.5, fill: 'ink', fillAlpha: 1 });
          L.poly(ribbon, { fill: 'ink', fillAlpha: 1, stroke: false });
          L.tex('\\varphi(X)', phi(0.82).re, phi(0.82).im, { color: 'ink', size: 14, dy: 20 });
          L.circle(ac.re, ac.im, r, { color: 'panel', width: 5 });
          L.circle(ac.re, ac.im, r, { color: 'green', width: 2.4 });
          L.line(ac.re, ac.im, near.x, near.y, { color: 'green', width: 1.3, dash: [4, 3] });
          L.tex('r', (ac.re + near.x) / 2, (ac.im + near.y) / 2, { color: 'green', size: 15, dx: 9, dy: -6 });
          // coefficients on a log scale, under the bound ‖μ‖ r^{−n−1}
          const vals = Array.from({ length: NC }, (_, n) => Math.hypot(cr[n], ci[n]) * r ** (n + 1));
          const lc = Array.from({ length: NC }, (_, n) => Math.log10(Math.hypot(cr[n], ci[n]) + 1e-300));
          const bound = (n) => Math.log10(norm) - (n + 1) * Math.log10(r);
          const ys = lc.concat([bound(0), bound(NC - 1)]).filter(isFinite);
          const y0 = Math.max(Math.min(...ys) - 0.6, bound(NC - 1) - 30), y1 = Math.max(...ys) + 0.8;
          R.setView(null, [y0, y1]);
          R.setTicks(null, Array.from({ length: 80 }, (_, i) => i - 40).filter((k) => k >= y0 && k <= y1 && (y1 - y0 < 9 || k % 2 === 0)).map((k) => [k, k === 0 ? '1' : `10${sup(k)}`]));
          R.path(Array.from({ length: NC }, (_, n) => [n, bound(n)]), { color: 'green', width: 2, dash: [6, 4] });
          for (let n = 0; n < NC; n++) {
            const col = n <= N ? 'accent' : 'faint';
            R.line(n, y0, n, Math.max(y0, lc[n]), { color: col, width: 3, alpha: 0.55, cap: 'butt' });
            R.dot(n, lc[n], { color: col, r: 3.8 });
          }
          R.tex('\\|\\mu\\|\\,r^{-n-1}', NC - 1, bound(NC - 1), { color: 'green', size: 14, align: 'right', baseline: 'bottom', dy: -8 });
          let err = 0;
          for (let k = 0; k < 64; k++) { const t = 2 * Math.PI * k / 64, x = ac.re + 0.8 * r * Math.cos(t), y = ac.im + 0.8 * r * Math.sin(t); const [fr, fi] = fXY(pts, x, y), [sr, si] = hornerXY(scr, sci, x - ac.re, y - ac.im); err = Math.max(err, Math.hypot(fr - sr, fi - si)); }
          st = { r, maxBar: Math.max(...vals), norm, N, err };
          v.legend([['ink', 'support $\\varphi(X)$ of the measure (width $\\propto$ density) and point masses'], ['green', 'largest disc $D(a;r)$ missing $\\varphi(X)$'], ['accent', '$|c_n|$ used in $S_N$', { dot: true }], ['green', 'bound $|c_n|\\le\\|\\mu\\|r^{-n-1}$', { dash: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `$r = \\operatorname{dist}(a,\\varphi(X)) = ${v.fix(s.r, 3)}$; $\\;\\max_n |c_n|\\,r^{n+1} = ${v.fix(s.maxBar, 3)} \\le \\|\\mu\\| = ${v.fix(s.norm, 2)}$; $\\;\\max_{|z-a|=0.8r}|f-S_{${s.N}}| = ${v.fmt(s.err, 2)}$.`;
        });
      },
    },
    {
      num: '10.15',
      kind: 'Theorem',
      name: "Cauchy's formula in a convex set",
      statement: String.raw`Let $\gamma$ be a closed path in a convex open set $\Omega$ and let $f\in H(\Omega)$. If $z\in\Omega$ does not lie on $\gamma^*$, then
$$f(z)\,\Ind_\gamma(z)=\frac{1}{2\pi i}\int_\gamma \frac{f(\xi)}{\xi-z}\,d\xi .$$`,
      idea: String.raw`Apply Cauchy's theorem (10.14) to $g(\xi)=\frac{f(\xi)-f(z)}{\xi-z}$, which is holomorphic once the removable singularity at $z$ is filled in. Its integral vanishes, so the integral of $f(\xi)/(\xi-z)$ equals $f(z)$ times $\frac{1}{2\pi i}\int_\gamma \frac{d\xi}{\xi-z}=\Ind_\gamma(z)$.`,
      caption: String.raw`Drag $z$ and the circle. The left panel is a phase portrait of $f$ (hue = $\arg f$); as $\xi$ travels once around $\gamma$, the right panel traces the running value of $\frac{1}{2\pi i}\int f(\xi)\,d\xi/(\xi-z)$. It lands exactly on $f(z)$ when $z$ is inside the circle, and returns to $0$ when $z$ is outside.`,
      deps: ['rca-10.14', 'rca-10.10'],
      tags: ['Cauchy', 'contour integral'],
      viz(v) {
        const { Cx, TAU } = v.M;
        const FN = {
          exp: { label: '$e^{z}$', f: (z) => z.exp() },
          cub: { label: '$z^3-z$', f: (z) => z.pow(3).sub(z) },
          sin: { label: '$\\sin z$', f: (z) => z.sin() },
          rat: { label: '$\\frac{1}{z-2.6}$', f: (z) => new Cx(1, 0).div(z.sub(2.6)) },
        };
        const which = v.select('$f$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'exp');
        const L = v.stage({ x: [-2.2, 2.2], y: [-1.7, 1.7], equal: true, height: 360, title: 'domain: phase portrait of $f$ and the path $\\gamma$' });
        const R = v.stage({ x: [-3, 3], y: [-2.2, 2.2], equal: true, height: 360, title: 'values: running integral $\\frac{1}{2\\pi i}\\int_{\\gamma|_{[0,t]}}\\frac{f(\\xi)}{\\xi - z}\\,d\\xi$' });
        const ctr = L.handle(0.1, -0.05, { color: 'ink', label: 'c' });
        const rad = L.handle(1.25, -0.05, { color: 'gray', r: 6 });
        const z = L.handle(0.45, 0.35, { color: 'accent', label: 'z' });
        let prevC = [ctr.x, ctr.y];
        ctr.onDrag = () => { rad.x += ctr.x - prevC[0]; rad.y += ctr.y - prevC[1]; prevC = [ctr.x, ctr.y]; };
        const N = 600;
        let state = null;

        v.animate((t) => {
          const F = FN[which.value].f;
          const c = new Cx(ctr.x, ctr.y), r = Math.max(0.15, Math.hypot(rad.x - ctr.x, rad.y - ctr.y));
          const zz = new Cx(z.x, z.y);
          const gam = (s) => c.add(Cx.polar(r, TAU * s));
          L.domain(F, { key: which.value, res: 2 });
          // the path, with orientation arrows
          L.curve((s) => gam(s), 0, 1, { color: 'panel', width: 5 });
          L.curve((s) => gam(s), 0, 1, { color: 'ink', width: 2.2 });
          for (const s of [0.12, 0.45, 0.78]) { const a = gam(s), b = gam(s + 0.02); L.arrow(a.re, a.im, b.re, b.im, { color: 'ink', head: 10 }); }
          // running integral
          const frac = Math.min(1, (t % 6) / 5);
          const pts = [[0, 0]]; let S = new Cx(0, 0);
          const twoPiI = new Cx(0, TAU);
          const n = Math.max(1, Math.round(N * frac));
          for (let k = 0; k < n; k++) {
            const a = gam(k / N), b = gam((k + 1) / N), m = gam((k + 0.5) / N);
            S = S.add(F(m).div(m.sub(zz)).mul(b.sub(a)).div(twoPiI));
            pts.push([S.re, S.im]);
          }
          const xi = gam(frac);
          L.line(zz.re, zz.im, xi.re, xi.im, { color: 'accent', width: 1.2, dash: [3, 4] });
          L.dot(xi.re, xi.im, { color: 'gold', r: 5.5, label: 'ξ', labelPos: 'e' });
          // right panel
          const fz = F(zz); const ind = Math.hypot(zz.re - c.re, zz.im - c.im) < r ? 1 : 0;
          const target = fz.scale(ind);
          const span = Math.max(1.6, Math.abs(fz.re) * 1.35, Math.abs(fz.im) * 1.35, ...pts.map((p) => Math.max(Math.abs(p[0]), Math.abs(p[1])) * 1.1));
          R.setView([-span, span], [-span * 0.75, span * 0.75]);
          R.path(pts, { color: 'gold', width: 2.4 });
          R.dot(0, 0, { color: 'muted', r: 3.5 });
          R.dot(fz.re, fz.im, { color: 'accent', r: 7, hollow: true, width: 2.4, label: 'f(z)', labelPos: 'ne' });
          if (ind === 0) R.dot(0, 0, { color: 'red', r: 7, hollow: true, width: 2.2, label: 'Ind = 0 ⇒ 0', labelPos: 'sw' });
          R.dot(S.re, S.im, { color: 'gold', r: 5 });
          R.corner(`t = ${v.fix(frac, 2)}`, 'tl');
          state = { S, target, ind, frac };
        }, { period: 6 });
        v.readout(() => {
          const s = state; if (!s) return '';
          return `$\\operatorname{Ind}_\\gamma(z) = ${s.ind}$, $\\;f(z)\\operatorname{Ind}_\\gamma(z) = ${s.target.toString(3).replace('i', '\\,i')}$, $\\;$ running integral $= ${s.S.toString(3).replace('i', '\\,i')}$`;
        });
      },
    },
  ],
};
