// Rudin, Real and Complex Analysis — Chapter 10 (part 4): isolated singularities, Parseval, Liouville, maximum modulus

// ---------------------------------------------------------------- helpers shared by this file
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
const cxs = (w, d = 4) => w.toString(d).replace('i', '\\,i');
const SUPD = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const pow10 = (k) => (k === 0 ? '1' : k === 1 ? '10' : `10${k < 0 ? '⁻' : ''}${String(Math.abs(k)).split('').map((d) => SUPD[+d]).join('')}`);
const logTicks = (lo, hi, every = 1) => { const out = []; for (let k = Math.ceil(lo); k <= Math.floor(hi); k++) if (k % every === 0) out.push([k, pow10(k)]); return out; };

export default {
  collection: 'rca',
  chapter: 10,
  items: [
    // ------------------------------------------------------------------ isolated singularities
    {
      num: '10.19',
      kind: 'Definition',
      name: 'Isolated singularities; removable singularities',
      refs: ['Rudin, Real and Complex Analysis, 3rd ed., Definition 10.19, p. 210'],
      statement: String.raw`If $a\in\Omega$ and $f\in H(\Omega\setminus\{a\})$, then $f$ is said to have an **isolated singularity** at $a$. If $f$ can be defined at $a$ so that the extended function is holomorphic in $\Omega$, the singularity is called **removable**. (Here $D'(a;r)=\{z:0<|z-a|<r\}$ denotes the punctured disc.)`,
      idea: String.raw`The definition only asks about the behaviour of $f$ in punctured discs $D'(a;r)$; whether the singularity is removable is a question about the possibility of extending $f$ holomorphically across one point. Theorems 10.20 and 10.21 show that the answer is decided entirely by how $|f|$ behaves near $a$: bounded (removable), tending to $\infty$ like a power (pole), or neither (essential).`,
      deps: ['rca-10.2'],
      tags: ['singularities'],
    },
    {
      num: '10.20',
      kind: 'Theorem',
      name: "Riemann's removable singularity theorem",
      statement: String.raw`Suppose $f\in H(\Omega\setminus\{a\})$ and $f$ is bounded in $D'(a;r)$ for some $r>0$. Then $f$ has a removable singularity at $a$.`,
      idea: String.raw`Put $h(z)=(z-a)^2f(z)$ for $z\ne a$ and $h(a)=0$. Boundedness of $f$ gives $\frac{h(z)-h(a)}{z-a}=(z-a)f(z)\to0$, so $h$ is differentiable at $a$ with $h'(a)=0$ and hence $h\in H(\Omega)$. By 10.16, $h(z)=\sum_{n\ge2}c_n(z-a)^n$ near $a$ (the first two coefficients are $h(a)$ and $h'(a)$). Setting $f(a)=c_2$ makes $f(z)=\sum_{n\ge0}c_{n+2}(z-a)^n$ near $a$, which is holomorphic.`,
      caption: String.raw`Pick $f$. Left: the phase of $f$ near its singularity at $0$. Right: $h(z)=z^2f(z)$ — exactly the function in the proof. When $f$ is bounded, $h$ has a zero of order at least $2$ at $0$ (colours cycle twice around it), and dividing by $z^2$ removes the singularity. Bottom: $M(r)=\max_{|z|=r}|f|$ on a log–log scale — flat when bounded, slope $-1$ for the pole $1/z$, explosive for $e^{1/z}$.`,
      deps: ['rca-10.19', 'rca-10.16', 'rca-10.2'],
      tags: ['singularities', 'removable'],
      viz(v) {
        const { Cx, TAU } = v.M;
        const one = new Cx(1, 0);
        const FN = {
          sinc: { label: '$\\frac{\\sin z}{z}$', f: (z) => (z.abs() < 1e-8 ? one : z.sin().div(z)), bounded: true, view: 4.2 },
          cosm: { label: '$\\frac{1-\\cos z}{z^2}$', f: (z) => (z.abs() < 1e-3 ? new Cx(0.5, 0).sub(z.mul(z).scale(1 / 24)) : one.sub(z.cos()).div(z.mul(z))), bounded: true, view: 4.2 },
          pole: { label: '$\\frac1z$', f: (z) => one.div(z), bounded: false, view: 1.6 },
          ess: { label: '$e^{1/z}$', f: (z) => one.div(z).exp(), bounded: false, view: 1.6 },
        };
        const which = v.select('$f$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'sinc');
        const L = v.stage({ x: [-1.6, 1.6], y: [-1.2, 1.2], equal: true, height: 280, ticks: false, title: 'phase of $f$ on the punctured plane' });
        const R = v.stage({ x: [-1.6, 1.6], y: [-1.2, 1.2], equal: true, height: 280, ticks: false, title: 'phase of $h(z)=z^2f(z)$, with $h(0)=0$' });
        const B = v.stage({ x: [-3, 0.3], y: [-1, 6], height: 190, full: true, axes: 'box', xticks: logTicks(-3, 0), xlabel: 'r', title: '$M(r)=\\max_{|z|=r}|f(z)|$ (log–log)' });
        let st = null, last = null;
        v.render(() => {
          const key = which.value, F = FN[key];
          if (last !== key) { last = key; for (const S of [L, R]) S.setView([-F.view, F.view], [-F.view * 0.75, F.view * 0.75]); }
          const h = (z) => (z.abs() < 1e-12 ? new Cx(0, 0) : z.mul(z).mul(F.f(z)));
          L.domain(F.f, { key, res: 2 });
          R.domain(h, { key: key + 'h', res: 2, contours: false });
          for (const S of [L, R]) S.dot(0, 0, { color: 'ink', r: 3.5, hollow: true, width: 1.6 });
          // winding of h along |z| = 0.25 and its first Taylor coefficients (Cauchy integrals on |z| = 0.25)
          const rho = 0.25, n = 720; let tot = 0, prev = h(Cx.polar(rho, 0)).arg();
          const c = [new Cx(0, 0), new Cx(0, 0), new Cx(0, 0)];
          for (let k = 1; k <= n; k++) {
            const z = Cx.polar(rho, TAU * k / n), w = h(z), t = w.arg(); let d = t - prev; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; tot += d; prev = t;
            for (let j = 0; j < 3; j++) c[j] = c[j].add(w.mul(Cx.polar(rho ** -j / n, -j * TAU * k / n)));
          }
          const wind = Math.round(tot / TAU);
          R.circle(0, 0, rho, { color: 'ink', width: 1.4, dash: [4, 3] });
          // M(r) profile
          const pts = [];
          for (let i = 0; i <= 160; i++) {
            const lr = -3 + 3.2 * i / 160, r = 10 ** lr; let m = 0;
            for (let k = 0; k < 96; k++) m = Math.max(m, F.f(Cx.polar(r, TAU * (k + 0.5) / 96)).abs());
            pts.push([lr, Math.min(5.8, Math.log10(m))]);
          }
          const yHi = Math.min(6, Math.max(1.5, ...pts.map((q) => q[1])) + 0.6), yLo = Math.min(-0.6, Math.min(...pts.map((q) => q[1])) - 0.4);
          B.setView(null, [yLo, yHi]);
          B.setTicks(logTicks(-3, 0), logTicks(yLo, yHi));
          B.path(pts, { color: F.bounded ? 'green' : 'red', width: 2.6 });
          if (key === 'ess') B.text('M(r) = exp(1/r) leaves the chart', -2.2, 5.3, { color: 'red', size: 12 });
          st = { key, wind, c, bounded: F.bounded, M01: F.f(Cx.polar(0.01, 0)).abs() };
          v.legend([['ink', 'circle $|z|=0.25$ used for counting (right)', { dash: true }], [F.bounded ? 'green' : 'red', '$\\log_{10}M(r)$']]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const cl = (w) => cxs(new Cx(Math.abs(w.re) < 1e-12 ? 0 : w.re, Math.abs(w.im) < 1e-12 ? 0 : w.im), 4);
          const coeff = `Taylor coefficients of $h$ (Cauchy integrals on $|z|=0.25$): $c_0 = ${cl(s.c[0])}$, $c_1 = ${cl(s.c[1])}$, $c_2 = ${cl(s.c[2])}$`;
          if (s.key === 'ess') return `$h=z^2e^{1/z}$ is unbounded near $0$ (it is not even continuous there), so the argument cannot start: $e^{1/z}$ is not bounded near $0$, and the singularity is not removable (it is essential, 10.21).`;
          if (!s.bounded) return `$h = z$ winds ${s.wind} time around $0$: a zero of order $1$, so $h'(0)=1\\ne0$ and $f=h/z^2$ cannot be extended — $1/z$ is unbounded near $0$.`;
          return `$h$ winds ${s.wind} times around $0$ on the dashed circle. ${coeff} — so $f=\\sum c_{n+2}z^n$ near $0$, with $f(0)=c_2$.`;
        });
      },
    },
    {
      num: '10.21',
      kind: 'Theorem',
      name: 'Removable, pole or essential (Casorati–Weierstrass)',
      credit: 'Casorati & Weierstrass, 1868',
      statement: String.raw`If $a\in\Omega$ and $f\in H(\Omega\setminus\{a\})$, then exactly one of the following occurs:
(a) $f$ has a removable singularity at $a$;
(b) there are a positive integer $m$ and complex numbers $c_1,\dots,c_m$ with $c_m\ne0$ such that $f(z)-\sum_{k=1}^m\frac{c_k}{(z-a)^k}$ has a removable singularity at $a$ — a **pole of order $m$**, with **principal part** $\sum_{k=1}^m c_k(z-a)^{-k}$;
(c) for every $r>0$ with $D(a;r)\subset\Omega$, the image $f(D'(a;r))$ is dense in the plane — an **essential singularity**.`,
      idea: String.raw`Suppose (c) fails: some $f(D'(a;r))$ misses a disc $D(w;\delta)$. Then $g=1/(f-w)$ is holomorphic and bounded by $1/\delta$ in $D'(a;r)$, so by 10.20 it extends holomorphically to $a$. If $g(a)\ne0$, $f=w+1/g$ is bounded near $a$: case (a). If $g$ has a zero of order $m$ at $a$ (10.18), write $g=(z-a)^mg_1$ with $g_1(a)\ne0$; then $(z-a)^m(f-w)=1/g_1$ is holomorphic near $a$, and its first $m$ Taylor coefficients produce the principal part: case (b).`,
      caption: String.raw`Choose the type of singularity at $0$ and shrink the punctured disc $D'(0;r)$ (left, dashed). The right panel plots the values $f(z)$ at a large sample of points $z\in D'(0;r)$. Removable: the values huddle around $f(0)$. Pole: they avoid a whole disc around $0$ and run off to $\infty$. Essential ($e^{1/z}$): however small $r$ is, the values come arbitrarily close to every target — drag the gold target $w$ and watch the distance in the readout.`,
      deps: ['rca-10.20', 'rca-10.18', 'rca-10.19'],
      tags: ['singularities', 'poles', 'Casorati–Weierstrass'],
      viz(v) {
        const { Cx, TAU } = v.M;
        const one = new Cx(1, 0);
        const which = v.select('', [{ value: 'rem', label: 'removable: $\\frac{\\sin z}{z}$' }, { value: 'pole', label: 'pole: $\\frac{e^z}{z^m}$' }, { value: 'ess', label: 'essential: $e^{1/z}$' }], 'ess');
        const mS = v.slider('pole order $m$', 1, 4, 2, { int: true });
        const rS = v.slider('radius $r$ of $D\'(0;r)$', 0.01, 1, 0.3, { log: true, fmt: (x) => v.fmt(x, 2) });
        const L = v.stage({ x: [-1.3, 1.3], y: [-1.05, 1.05], equal: true, height: 320, ticks: false, title: 'phase of $f$; the punctured disc $D\'(0;r)$' });
        const R = v.stage({ x: [-3, 3], y: [-2.3, 2.3], equal: true, height: 320, title: 'the values $f(z)$ for sample points $z\\in D\'(0;r)$' });
        const w0 = R.handle(-1.6, 1.1, { color: 'gold', r: 6.5, label: 'w', labelPos: 'ne' });
        const fns = (key, m) => key === 'rem' ? (z) => (z.abs() < 1e-9 ? one : z.sin().div(z)) : key === 'pole' ? (z) => z.exp().div(z.pow(m)) : (z) => one.div(z).exp();
        let st = null;
        v.render(() => {
          const key = which.value, m = mS.value, r = rS.value, f = fns(key, m);
          L.domain(f, { key: key + m, res: 2 });
          L.circle(0, 0, r, { color: 'panel', width: 5 }); L.circle(0, 0, r, { color: 'ink', width: 2, dash: [6, 4] });
          L.dot(0, 0, { color: 'ink', r: 3.5, hollow: true, width: 1.6 });
          // sample points of D'(0;r): a polar grid at all scales, plus (for e^{1/z}) points z = 1/w with w filling a band beyond |w| = 1/r
          const pts = [];
          for (let i = 0; i < 160; i++) { const rr = r * 10 ** (-6 * i / 159); for (let k = 0; k < 180; k++) pts.push(Cx.polar(rr * (1 - 1e-9), TAU * (k + 0.5 * (i % 2)) / 180)); }
          if (key === 'ess') for (let i = 0; i <= 120; i++) for (let j = 0; j <= 110; j++) { const u = -7 + 9 * i / 120, vv = 1 / r + 0.01 + 7 * j / 110; pts.push(one.div(new Cx(u, vv))); }
          const vals = pts.map(f);
          let mn = Infinity; for (const w of vals) mn = Math.min(mn, w.abs());
          const half = key === 'pole' ? Math.max(3, 1.6 * mn) : 3;
          R.setView([-half, half], [-half * 0.77, half * 0.77]);
          const { x: [vx0, vx1], y: [vy0, vy1] } = R.bounds;
          const W = new Cx(w0.x, w0.y); let best = Infinity, bz = null, bw = null;
          const inView = [];
          for (let i = 0; i < vals.length; i++) {
            const w = vals[i]; if (!isFinite(w.re) || !isFinite(w.im)) continue;
            const d = w.sub(W).abs(); if (d < best) { best = d; bz = pts[i]; bw = w; }
            if (w.re > vx0 && w.re < vx1 && w.im > vy0 && w.im < vy1) inView.push([w.re, w.im]);
          }
          if (key === 'rem') R.dot(1, 0, { color: 'green', r: 11, hollow: true, width: 1.6, label: 'f(0) = 1', labelPos: 'se' });
          R.dots(inView, { color: key === 'ess' ? 'purple' : key === 'pole' ? 'red' : 'green', r: key === 'rem' ? 1.6 : 1.1, alpha: 0.55 });
          if (key === 'pole') { R.circle(0, 0, mn, { color: 'red', width: 1.6, dash: [5, 4] }); R.text(`no values with |w| < ${v.fmt(mn, 3)}`, 0, 0, { color: 'red', align: 'center', size: 12 }); }
          if (bw) { R.line(W.re, W.im, bw.re, bw.im, { color: 'gold', width: 1.4, dash: [3, 3] }); R.dot(bw.re, bw.im, { color: 'gold', r: 3.5 }); }
          R.corner(`${inView.length} of ${vals.length} sampled values fall in this window`, 'tl');
          st = { key, best, bz, r, frac: inView.length / vals.length };
          v.legend([['ink', "the punctured disc $D'(0;r)$", { dash: true }], [key === 'ess' ? 'purple' : key === 'pole' ? 'red' : 'green', "values $f(z)$, $z\\in D'(0;r)$", { dot: true }], ['gold', 'target $w$ and the closest value found', { dot: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const near = `closest value to $w$: distance $${v.fmt(s.best, 3)}$, attained at $|z| = ${v.fmt(s.bz.abs(), 3)}$`;
          if (s.key === 'ess') return `${near} — although $r = ${v.fmt(s.r, 2)}$: $f(D'(0;r))$ is dense (Casorati–Weierstrass).`;
          if (s.key === 'pole') return `${near}. Near a pole $|f|\\to\\infty$, so small punctured discs map far from any fixed $w$.`;
          return `${near}. Near a removable singularity the values stay close to $f(0)$.`;
        });
      },
    },
    // ------------------------------------------------------------------ Parseval, Liouville, maximum modulus
    {
      num: '10.22',
      kind: 'Theorem',
      name: 'Mean square of a power series on a circle',
      refs: ['Rudin, Real and Complex Analysis, 3rd ed., Theorem 10.22 and proof, pp. 211–212'],
      statement: String.raw`If $f(z)=\sum_{n\ge0}c_n(z-a)^n$ for $z\in D(a;R)$ and $0<r<R$, then
$$\sum_{n=0}^\infty|c_n|^2r^{2n}=\frac1{2\pi}\int_{-\pi}^{\pi}\bigl|f(a+re^{i\theta})\bigr|^2\,d\theta .$$`,
      idea: String.raw`On the circle, $f(a+re^{i\theta})=\sum c_nr^ne^{in\theta}$ converges uniformly in $\theta$, so $|f|^2$ is the uniformly convergent double series $\sum_{n,k}c_n\bar c_kr^{n+k}e^{i(n-k)\theta}$. Integrating term by term, $\frac1{2\pi}\int e^{i(n-k)\theta}d\theta$ is $1$ for $n=k$ and $0$ otherwise. It is Parseval's identity for the Fourier coefficients $c_nr^n$ of $\theta\mapsto f(a+re^{i\theta})$ (compare 4.26). An immediate consequence is the coefficient bound $|c_n|\,r^n\le\max_\theta|f(a+re^{i\theta})|$, and the identity drives the proofs of 10.23 and 10.24.`,
      caption: String.raw`Drag the coefficients $c_0,\dots,c_5$ of a polynomial (or choose a power series) and the radius $r$. Right: $|f(re^{i\theta})|^2$ over a full turn; its mean (green) has exactly the height of the stacked bar of contributions $|c_n|^2r^{2n}$. The red line is $\max_\theta|f|^2$: no single contribution can exceed it — the Cauchy-type bound $|c_n|r^n\le\max|f|$.`,
      deps: ['rca-10.5', 'pma-7.16a'],
      see: ['rca-4.26', 'rca-4.18', 'pma-8.16', 'rca-10.26'],
      tags: ['Parseval', 'power series', 'Cauchy estimates'],
      viz(v) {
        const { Cx, TAU, PI, factorial } = v.M;
        const COLS = ['blue', 'orange', 'green', 'purple', 'teal', 'pink'];
        const which = v.select('$f$', [{ value: 'poly', label: 'polynomial (drag $c_n$)' }, { value: 'exp', label: '$e^z=\\sum\\frac{z^n}{n!}$' }, { value: 'geo', label: '$\\frac{1}{1-z/2}=\\sum\\frac{z^n}{2^n}$' }], 'poly');
        const rS = v.slider('radius $r$', 0.2, 1.8, 1, { step: 0.01 });
        const C = v.stage({ x: [-0.6, 5.6], y: [-1.6, 1.6], height: 320, axes: true, xticks: [0, 1, 2, 3, 4, 5], weight: 0.75, title: 'coefficients $c_n$' });
        const P = v.stage({ x: [-PI, PI + 1.75], y: [0, 4], height: 320, axes: 'box', xticks: [[-PI, '−π'], [0, '0'], [PI, 'π']], xlabel: 'θ', weight: 1.25, title: '$|f(re^{i\\theta})|^2$, its mean, and $\\sum|c_n|^2r^{2n}$' });
        const init = [0.6, 1, -0.5, 0.35, 0.25, -0.15];
        const H = init.map((c, n) => C.handle(n, c, { color: COLS[n], r: 6.5, constrain: (x, y) => [n, Math.max(-1.5, Math.min(1.5, y))] }));
        let st = null;
        v.render(() => {
          const key = which.value, r = rS.value;
          if (key === 'geo' && r > 1.8) rS.set(1.8);
          const N = key === 'poly' ? 6 : 30;
          const c = Array.from({ length: N }, (_, n) => (key === 'poly' ? H[n].y : key === 'exp' ? 1 / factorial(n) : 2 ** -n));
          H.forEach((h) => { h.visible = key === 'poly'; });
          // coefficient panel
          for (let n = 0; n < 6; n++) {
            C.line(n, 0, n, c[n], { color: COLS[n], width: 4, cap: 'butt', alpha: 0.75 });
            if (key !== 'poly') C.dot(n, c[n], { color: COLS[n], r: 5 });
          }
          if (key !== 'poly') C.text('…', 5.45, 0.15, { color: 'muted', size: 16 });
          // the function on the circle
          const f = (th) => { let s = new Cx(0, 0), p = new Cx(1, 0); const z = Cx.polar(r, th); for (let n = 0; n < N; n++) { s = s.add(p.scale(c[n])); p = p.mul(z); } return s; };
          const ys = []; let mean = 0, mx = 0; const K = 720;
          for (let k = 0; k <= K; k++) { const th = -PI + TAU * k / K, y = f(th).abs2(); ys.push([th, y]); if (k < K) mean += y / K; mx = Math.max(mx, y); }
          const contrib = c.map((cn, n) => cn * cn * r ** (2 * n));
          const total = contrib.reduce((a, b) => a + b, 0);
          const top = Math.max(1, mx * 1.12);
          P.setView(null, [0, top]);
          P.path(ys.concat([[PI, 0], [-PI, 0]]), { fill: 'accent', fillAlpha: 0.12, stroke: false, close: true });
          P.path(ys, { color: 'accent', width: 2.2 });
          P.hline(mean, { color: 'green', width: 2, dash: [6, 4] });
          P.hline(mx, { color: 'red', width: 1.3, dash: [2, 4] });
          // stacked bar of contributions
          let base = 0; const bx0 = PI + 0.85, bx1 = PI + 1.55;
          contrib.forEach((h, n) => { if (h <= 0) return; P.rect(bx0, base, bx1, base + h, { fill: COLS[n % 6], fillAlpha: 0.8, color: 'panel', width: 1 }); base += h; });
          P.text('Σ', (bx0 + bx1) / 2, Math.min(top * 0.97, total) , { color: 'ink', align: 'center', dy: -10, size: 13, weight: 600 });
          P.text('mean', PI + 0.08, mean, { color: 'green', size: 11.5, dy: -9, weight: 600 });
          P.text('max', PI + 0.08, mx, { color: 'red', size: 11.5, dy: -9, weight: 600 });
          st = { total, mean, mx, cr: c.slice(0, 6).map((cn, n) => Math.abs(cn) * r ** n), r };
          v.legend(COLS.map((col, n) => [col, `$|c_${n}|^2r^{${2 * n}}$`, { area: true }]).concat([['green', 'mean of $|f|^2$', { dash: true }], ['red', '$\\max|f|^2$', { dash: true }]]));
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const M = Math.sqrt(s.mx), big = Math.max(...s.cr);
          return `$\\sum|c_n|^2r^{2n} = ${v.fix(s.total, 5)}$, $\\;\\frac1{2\\pi}\\int|f(re^{i\\theta})|^2d\\theta = ${v.fix(s.mean, 5)}$; $\\;\\max_n|c_n|r^n = ${v.fix(big, 3)} \\le \\max_\\theta|f(re^{i\\theta})| = ${v.fix(M, 3)}$.`;
        });
      },
    },
    {
      num: '10.23',
      kind: 'Theorem',
      name: "Liouville's theorem",
      credit: 'Liouville, 1844',
      statement: String.raw`An entire function (one in $H(\C)$) whose modulus is bounded on all of $\C$ must be constant.`,
      idea: String.raw`Let $f=\sum c_nz^n$ be entire with $|f|\le M$. By 10.22, $\sum|c_n|^2r^{2n}\le M^2$ for every $r>0$, so $|c_n|\le M/r^n$; letting $r\to\infty$ forces $c_n=0$ for all $n\ge1$. Being bounded on the real line is not enough: the growth happens off $\R$.`,
      caption: String.raw`Pick a non-constant entire function and grow the circle $|z|=r$ (left; the red dot marks where $|f|$ is largest on it). Right, on log–log axes: the maximum $M(r)$ over the circle (ink) and over the real segment $[-r,r]$ (gold), and the bounds $M(r)/r^n$ for $|c_1|$, $|c_2|$ (dashed horizontal lines). $\sin z$ and $e^{-z^2}$ are bounded on $\R$, yet $M(r)$ blows up — otherwise $M(r)/r^n\to0$ would squeeze every $c_n$, $n\ge1$, to $0$.`,
      deps: ['rca-10.22', 'rca-10.16'],
      see: ['pma-8.8', 'fa-10.13'],
      tags: ['Liouville', 'entire functions'],
      viz(v) {
        const { Cx, TAU } = v.M;
        const FN = {
          sin: { label: '$\\sin z$', f: (z) => z.sin(), c1: 1, c2: 0 },
          gauss: { label: '$e^{-z^2}$', f: (z) => z.mul(z).neg().exp(), c1: 0, c2: 1 },
          exp: { label: '$e^z$', f: (z) => z.exp(), c1: 1, c2: 0.5 },
          poly: { label: '$1+\\frac z2+\\frac{z^2}{8}$', f: (z) => new Cx(1, 0).add(z.scale(0.5)).add(z.mul(z).scale(1 / 8)), c1: 0.5, c2: 0.125 },
        };
        const which = v.select('$f$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'sin');
        const rS = v.slider('radius $r$', 0.5, 12, 3, { log: true, fmt: (x) => v.fmt(x, 3) });
        const L = v.stage({ x: [-4, 4], y: [-3, 3], equal: true, height: 320, ticks: false, title: 'phase of $f$ and the circle $|z|=r$' });
        const R = v.stage({ x: [-1, 1.1], y: [-3, 8], height: 320, axes: 'box', xlabel: 'r', title: 'growth: $M(r)=\\max_{|z|=r}|f|$ vs $\\max_{[-r,r]}|f|$' });
        let st = null;
        v.render(() => {
          const key = which.value, F = FN[key], r = rS.value;
          L.setView([-r * 1.35, r * 1.35], [-r * 1.05, r * 1.05]);
          L.domain(F.f, { key: key + Math.round(Math.log(r) * 40), res: 2 });
          L.circle(0, 0, r, { color: 'panel', width: 5 }); L.circle(0, 0, r, { color: 'ink', width: 2.2 });
          L.hline(0, { color: 'gold', width: 1.4 });
          let mz = 0, at = null;
          for (let k = 0; k < 720; k++) { const z = Cx.polar(r, TAU * k / 720), a = F.f(z).abs(); if (a > mz) { mz = a; at = z; } }
          L.dot(at.re, at.im, { color: 'red', r: 5.5 });
          // growth curves
          const lrs = [], Mc = [], Mr = [], B1 = [], B2 = [];
          for (let i = 0; i <= 120; i++) {
            const lr = -1 + 2.08 * i / 120, rr = 10 ** lr; let m = 0, mr = 0;
            for (let k = 0; k < 360; k++) m = Math.max(m, F.f(Cx.polar(rr, TAU * (k + 0.5) / 360)).abs());
            for (let k = 0; k <= 200; k++) mr = Math.max(mr, F.f(new Cx(-rr + 2 * rr * k / 200, 0)).abs());
            lrs.push(lr); Mc.push(Math.log10(m)); Mr.push(Math.log10(mr)); B1.push(Math.log10(m / rr)); B2.push(Math.log10(m / rr ** 2));
          }
          const clip = (y) => Math.max(-3, Math.min(8, y));
          const allY = Mc.concat(Mr, B1, B2, [Math.log10(F.c1 || 1), Math.log10(F.c2 || 1)]).map(clip);
          const lo = Math.max(-3, Math.min(...allY) - 0.5), hi = Math.min(8, Math.max(...allY) + 0.6);
          R.setView(null, [lo, hi]);
          R.setTicks(logTicks(-1, 1).map(([k, l]) => [k, k === 0 ? '1' : l]), logTicks(lo, hi, hi - lo > 7 ? 2 : 1));
          R.path(lrs.map((x, i) => [x, clip(B1[i])]), { color: 'orange', width: 1.6, dash: [6, 4] });
          R.path(lrs.map((x, i) => [x, clip(B2[i])]), { color: 'purple', width: 1.6, dash: [6, 4] });
          if (F.c1) { R.hline(Math.log10(F.c1), { color: 'orange', width: 1.2, alpha: 0.8 }); R.text('|c₁|', -0.97, Math.log10(F.c1), { color: 'orange', size: 12, dy: -9, weight: 600 }); }
          if (F.c2) { R.hline(Math.log10(F.c2), { color: 'purple', width: 1.2, alpha: 0.8 }); R.text('|c₂|', -0.82, Math.log10(F.c2), { color: 'purple', size: 12, dy: -9, weight: 600 }); }
          R.path(lrs.map((x, i) => [x, clip(Mr[i])]), { color: 'gold', width: 2.4 });
          R.path(lrs.map((x, i) => [x, clip(Mc[i])]), { color: 'ink', width: 2.6 });
          R.vline(Math.log10(r), { color: 'accent', width: 1.2, dash: [3, 3] });
          st = { mz, r, key, mr: 10 ** Mr[Math.round((Math.log10(r) + 1) / 2.08 * 120)] };
          v.legend([['ink', '$M(r)$, max over the circle (red dot on the left)'], ['gold', 'max over $[-r,r]\\subset\\R$'], ['orange', "$M(r)/r$ and $|c_1|=|f'(0)|$", { dash: true }], ['purple', '$M(r)/r^2$ and $|c_2|$', { dash: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `At $r = ${v.fmt(s.r, 3)}$: $\\max_{|z|=r}|f| = ${v.fmt(s.mz, 4)}$, while on the real segment $\\max_{[-r,r]}|f| = ${v.fmt(s.mr, 3)}$. The dashed bounds $M(r)/r^n$ never dip below $|c_n|$; a bounded $f$ would push them to $0$.`;
        });
      },
    },
    {
      num: '10.24',
      kind: 'Theorem',
      name: 'Maximum modulus theorem',
      statement: String.raw`Suppose $\Omega$ is a region, $f\in H(\Omega)$, and $\overline{D}(a;r)\subset\Omega$. Then
$$|f(a)|\le\max_\theta\bigl|f(a+re^{i\theta})\bigr|,$$
and equality occurs if and only if $f$ is constant. Consequently $|f|$ has no local maximum at any point of $\Omega$ unless $f$ is constant.`,
      idea: String.raw`If $|f(a+re^{i\theta})|\le|f(a)|$ for all $\theta$, then 10.22 gives $\sum_n|c_n|^2r^{2n}\le|f(a)|^2=|c_0|^2$, so $c_n=0$ for all $n\ge1$: $f$ is constant in $D(a;r)$, hence in all of the region $\Omega$ by the identity theorem (10.18a). A local maximum of $|f|$ at $a$ would give exactly this situation for small $r$.`,
      caption: String.raw`The surface is the graph of $|f|$ over the closed disc $\overline D(a;r)$, coloured by $\arg f$ — drag it to rotate; move $a$ and the rim handle on the left. The gold rim is $|f|$ on the circle, with its maximum in red; the blue post is $|f(a)|$. For holomorphic $f$ the surface never peaks inside: the highest point is always on the rim, and zeros of $f$ show up as pits. The last choice, $1.2-|z|^2$, is not holomorphic and does have an interior peak.`,
      deps: ['rca-10.22', 'rca-10.18a'],
      see: ['rca-5.23'],
      tags: ['maximum modulus'],
      viz(v) {
        const { Cx, TAU, hsl2rgb } = v.M;
        const FN = {
          poly: { label: '$z^3-z+0.4$', f: (z) => z.pow(3).sub(z).add(new Cx(0.4, 0)) },
          exp: { label: '$e^{z}\\cos z$', f: (z) => z.exp().mul(z.cos()) },
          rat: { label: '$\\frac{z-0.3i}{z-2}$', f: (z) => z.sub(new Cx(0, 0.3)).div(z.sub(new Cx(2, 0))) },
          bump: { label: '$1.2-|z|^2$ (not holomorphic)', f: (z) => new Cx(1.2 - z.abs2(), 0) },
        };
        const which = v.select('$f$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'poly');
        const L = v.stage({ x: [-1.7, 1.7], y: [-1.35, 1.35], equal: true, height: 340, weight: 0.85, ticks: false, title: 'phase of $f$ and the disc $\\overline D(a;r)$' });
        const S3 = v.stage3d({ height: 340, range: 1.55, yaw: -0.75, pitch: 0.45, weight: 1.15, labels: ['x', 'y', '|f|'], title: 'graph of $|f|$ over $\\overline D(a;r)$' });
        const a = L.handle(0.1, 0.05, { color: 'blue', label: 'a', labelPos: 'sw' });
        const rh = L.handle(1.0, 0.05, { color: 'gold', r: 6 });
        let prev = [a.x, a.y];
        a.onDrag = () => { rh.x += a.x - prev[0]; rh.y += a.y - prev[1]; prev = [a.x, a.y]; };
        let st = null;
        v.render(() => {
          prev = [a.x, a.y];
          const key = which.value, f = FN[key].f;
          if (key === 'rat') { const r0 = Math.hypot(rh.x - a.x, rh.y - a.y); if (Math.hypot(a.x - 2, a.y) < r0 + 0.1) { const s = (Math.hypot(a.x - 2, a.y) - 0.1) / r0; rh.x = a.x + (rh.x - a.x) * s; rh.y = a.y + (rh.y - a.y) * s; } }
          const ac = new Cx(a.x, a.y), r = Math.max(0.15, Math.hypot(rh.x - a.x, rh.y - a.y));
          L.domain(f, { key, res: 2 });
          if (key === 'rat') xMark(L, 2, 0);
          L.circle(ac.re, ac.im, r, { color: 'panel', width: 5 }); L.circle(ac.re, ac.im, r, { color: 'gold', width: 2.4 });
          // sample the closed disc
          let mxIn = 0, mxB = 0, atB = 0;
          const NB = 360;
          for (let k = 0; k < NB; k++) { const t = TAU * k / NB, m = f(ac.add(Cx.polar(r, t))).abs(); if (m > mxB) { mxB = m; atB = t; } }
          let atIn = null;
          for (let i = 1; i < 40; i++) for (let k = 0; k < 90; k++) { const z = ac.add(Cx.polar(r * i / 40, TAU * k / 90)), m = f(z).abs(); if (m > mxIn) { mxIn = m; atIn = z; } }
          const fa = f(ac).abs(), Z = 1.25 / Math.max(mxB, mxIn, 1e-9), K = 1.15 / r;
          const P = (z, h) => [(z.re - ac.re) * K, (z.im - ac.im) * K, h * Z - 0.55];
          S3.surface((u, w) => { const z = ac.add(Cx.polar(r * u, w)); return P(z, f(z).abs()); }, [0, 1], [0, TAU], {
            nu: 22, nv: 56, alpha: 0.92,
            colorFn: (u, w) => { const fz = f(ac.add(Cx.polar(r * u, w))); return hsl2rgb(Math.atan2(fz.im, fz.re) / TAU, 0.62, 0.55); },
          });
          // base disc outline and rim
          S3.curve((t) => P(ac.add(Cx.polar(r, t)), 0), 0, TAU, { color: 'faint', width: 1.2, n: 120 });
          S3.curve((t) => P(ac.add(Cx.polar(r, t)), f(ac.add(Cx.polar(r, t))).abs()), 0, TAU, { color: 'gold', width: 3, n: 240, bias: -0.02 });
          const zb = ac.add(Cx.polar(r, atB));
          S3.line(P(zb, 0), P(zb, mxB), { color: 'red', width: 1.4, dash: true });
          S3.dot(P(zb, mxB), { color: 'red', r: 6, label: 'max on rim', bias: -0.05 });
          S3.line(P(ac, 0), P(ac, fa), { color: 'blue', width: 3, bias: -0.05 });
          S3.dot(P(ac, fa), { color: 'blue', r: 5.5, bias: -0.05 });
          L.dot(zb.re, zb.im, { color: 'red', r: 5 });
          const interior = mxIn > mxB * (1 + 1e-6);
          if (interior && atIn) { S3.dot(P(atIn, mxIn), { color: 'pink', r: 6, label: 'interior peak', bias: -0.05 }); L.dot(atIn.re, atIn.im, { color: 'pink', r: 5 }); }
          st = { fa, mxB, mxIn, interior, key };
          v.legend([['gold', '$|f|$ on the circle $|z-a|=r$'], ['red', 'its maximum', { dot: true }], ['blue', '$|f(a)|$', { dot: true }], ['faint', 'the circle in the base plane']]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const base = `$|f(a)| = ${v.fix(s.fa, 4)}$, $\\;\\max_\\theta|f(a+re^{i\\theta})| = ${v.fix(s.mxB, 4)}$, $\\;\\max_{\\overline D(a;r)}|f| = ${v.fix(Math.max(s.mxIn, s.mxB), 4)}$`;
          if (s.key === 'bump') return `${base} — here the maximum is inside the disc: $1.2-|z|^2$ is not holomorphic, so the theorem does not apply.`;
          return `${base} — the maximum over the closed disc is attained on the boundary circle.`;
        });
      },
    },
  ],
};
