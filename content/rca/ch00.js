// Rudin, Real and Complex Analysis — Prologue: The Exponential Function (treated as chapter 0)
//
// The Prologue states its results as a displayed addition formula followed by a lettered list
// (a)–(g); they are numbered 0.1–0.8 here in order of appearance, all marked `verify: true`.

/* ------------------------------------------------------------------ shared helpers */

/** cos t, summed straight from the series of Re e^{it} (no library trigonometry). */
function cosSer(t) {
  let s = 0, term = 1;
  for (let k = 0; k < 80; k++) {
    s += term;
    term *= -t * t / ((2 * k + 1) * (2 * k + 2));
    if (Math.abs(term) < 1e-17 * Math.max(1, Math.abs(s))) break;
  }
  return s;
}
/** sin t, summed straight from the series of Im e^{it}. */
function sinSer(t) {
  let s = 0, term = t;
  for (let k = 0; k < 80; k++) {
    s += term;
    term *= -t * t / ((2 * k + 2) * (2 * k + 3));
    if (Math.abs(term) < 1e-17 * Math.max(1, Math.abs(s))) break;
  }
  return s;
}
// Rudin's π/2 = the smallest positive zero of cos. On [0,1] cos t ≥ 1 − t²/2 > 0, cos 2 < 0 and
// cos is decreasing on [1,2] (sin > 0 there), so bisection on [1,2] finds exactly that zero.
const T0 = (() => {
  let a = 1, b = 2;
  for (let i = 0; i < 90; i++) { const m = (a + b) / 2; if (cosSer(m) > 0) a = m; else b = m; }
  return (a + b) / 2;
})();
const PI0 = 2 * T0, TWO_PI = 4 * T0;

/** Partial sum S_N(z) = Σ_{n≤N} z^n/n! as [re, im]. */
function expPartial(re, im, N) {
  let sr = 0, si = 0, tr = 1, ti = 0;
  for (let n = 0; n <= N; n++) {
    sr += tr; si += ti;
    const r = (tr * re - ti * im) / (n + 1);
    ti = (tr * im + ti * re) / (n + 1); tr = r;
  }
  return [sr, si];
}

/** The N zeros of S_N: Durand–Kerner on the monic rescaled polynomial S_N(N w) (stable up to N ≈ 35). */
function partialZeros(N) {
  const c = new Array(N + 1); c[N] = 1;
  for (let n = N - 1; n >= 0; n--) c[n] = c[n + 1] * (n + 1) / N;
  const ev = (re, im) => {
    let pr = 1, pi = 0;
    for (let n = N - 1; n >= 0; n--) { const r = pr * re - pi * im + c[n]; pi = pr * im + pi * re; pr = r; }
    return [pr, pi];
  };
  const zs = [];
  for (let k = 0; k < N; k++) { const a = TWO_PI * (k + 0.5) / N; zs.push([0.25 + 0.7 * Math.cos(a), 0.7 * Math.sin(a) + 0.01]); }
  for (let it = 0; it < 400; it++) {
    let moved = 0;
    for (let i = 0; i < N; i++) {
      const [re, im] = zs[i]; const [pr, pi] = ev(re, im);
      let dr = 1, di = 0;
      for (let j = 0; j < N; j++) if (j !== i) {
        const ar = re - zs[j][0], ai = im - zs[j][1];
        const r = dr * ar - di * ai; di = dr * ai + di * ar; dr = r;
      }
      const d = dr * dr + di * di; const qr = (pr * dr + pi * di) / d, qi = (pi * dr - pr * di) / d;
      zs[i] = [re - qr, im - qi]; moved = Math.max(moved, Math.hypot(qr, qi));
    }
    if (moved < 1e-14) break;
  }
  return zs.map(([a, b]) => [a * N, b * N]);
}

/** A real number as TeX (ASCII minus, scientific notation for tiny/huge values). */
function num(x, d = 3) {
  if (!isFinite(x)) return x > 0 ? '\\infty' : x < 0 ? '-\\infty' : '\\text{NaN}';
  if (x === 0) return '0';
  const a = Math.abs(x);
  if (a < 1e-4 || a >= 1e6) {
    let e = Math.floor(Math.log10(a)); let ms = (x / Math.pow(10, e)).toFixed(Math.max(0, d - 1));
    if (Math.abs(+ms) >= 10) { e += 1; ms = (x / Math.pow(10, e)).toFixed(Math.max(0, d - 1)); }
    return `${ms}\\times 10^{${e}}`;
  }
  return String(Number(x.toPrecision(d)));
}
/** A complex number {re, im} as TeX. */
function cnum(z, d = 3) {
  let re = z.re, im = z.im; const m = Math.hypot(re, im);
  if (Math.abs(re) < 1e-12 * m) re = 0;
  if (Math.abs(im) < 1e-12 * m) im = 0;
  if (im === 0) return num(re, d);
  const ip = num(Math.abs(im), d), ii = ip === '1' ? 'i' : `${ip}\\,i`;
  if (re === 0) return (im < 0 ? '-' : '') + ii;
  return `${num(re, d)} ${im < 0 ? '-' : '+'} ${ii}`;
}
/** Unicode subscript digits for canvas text, e.g. 'S' + sub(3) → 'S₃'. */
const sub = (n) => String(n).replace(/\d/g, (d) => '₀₁₂₃₄₅₆₇₈₉'[d]);
/** KaTeX label just beyond the tip of the vector 0 → (x, y). */
function tipLabel(S, tex, x, y, color, px = 16) {
  const L = Math.hypot(x, y) || 1;
  S.tex(tex, x, y, { color, dx: (x / L) * px, dy: -(y / L) * px });
}
/** Densify a closed polygon (list of [x,y]) into n points per edge. */
function densify(poly, n = 18) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length];
    for (let k = 0; k < n; k++) out.push([p[0] + (q[0] - p[0]) * k / n, p[1] + (q[1] - p[1]) * k / n]);
  }
  return out;
}

export default {
  collection: 'rca',
  chapter: 0,
  title: 'Prologue: The Exponential Function',
  summary: String.raw`Before any measure theory, Rudin builds the exponential function from nothing but its power series $\exp z=\sum z^n/n!$ and the addition formula $e^{a+b}=e^ae^b$. From these two facts alone he shows that $\exp$ never vanishes, is its own derivative, and is positive and increasing on $\R$; he then *defines* $\pi$ as twice the first positive zero of $\cos t=\Re e^{it}$. Periodicity with period $2\pi i$, the wrapping of the real line around the unit circle by $t\mapsto e^{it}$, and the fact that every nonzero complex number is an exponential follow — with no appeal to geometric intuition about angles or arc length.`,
  items: [
    /* ------------------------------------------------------------------ 0.1 */
    {
      num: '0.1',
      kind: 'Theorem',
      name: 'The exponential series and the addition formula',
      statement: String.raw`For every $z\in\C$ the series
$$\exp(z)=\sum_{n=0}^{\infty}\frac{z^n}{n!}$$
converges absolutely, and it converges uniformly on each bounded subset of $\C$; in particular $\exp$ is continuous. For all $a,b\in\C$,
$$\exp(a)\,\exp(b)=\exp(a+b).$$
With $e=\exp(1)$ one writes $e^z$ for $\exp(z)$.`,
      idea: String.raw`On the disc $|z|\le R$ each term is at most $R^n/n!$ in modulus, and $\sum R^n/n!$ converges by the ratio test; the Weierstrass M-test gives absolute and uniform convergence. Because both series converge absolutely, the product $\exp(a)\exp(b)$ is the double sum of the array $a^jb^k/(j!\,k!)$ and may be summed along the anti-diagonals $j+k=n$ (the Cauchy product); by the binomial theorem the $n$-th anti-diagonal is exactly $(a+b)^n/n!$.`,
      caption: String.raw`Drag the exponents $a$ and $b$. In the middle, $e^a$ and $e^b$ multiply (lengths multiply, the angles $\Im a$ and $\Im b$ add) and land on the ring $e^{a+b}$. On the right, the square $j,k\le N$ of the term array sums to $S_N(a)S_N(b)$ and the triangle $j+k\le N$ to $S_N(a+b)$, where $S_N(z)=\sum_{n\le N}z^n/n!$; the red cells are the difference, and they fade as $N$ grows.`,
      deps: ['pma-3.34', 'pma-7.10', 'pma-7.12', 'pma-3.50'],
      see: ['pma-8.6'],
      tags: ['exponential', 'power series', 'Cauchy product'],
      verify: true,
      viz(v) {
        const { Cx } = v.M;
        const A = v.stage({ x: [-2.6, 2.6], y: [-3.05, 3.05], equal: true, height: 400, weight: 0.8, minWidth: 200, title: 'exponents $a,\\ b$ and $a+b$' });
        const W = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, height: 400, minWidth: 240, title: 'values: $e^a\\cdot e^b$ and $e^{a+b}$' });
        const G = v.stage({ x: [-1.9, 13.3], y: [-1.9, 13.3], equal: true, axes: false, height: 400, minWidth: 240, title: 'the array $\\frac{a^j}{j!}\\cdot\\frac{b^k}{k!}$' });
        const Nc = v.slider('terms kept $N$', 0, 12, 3, { int: true });
        const box = { x: [-1.2, 1.2], y: [-1.45, 1.45] };
        const a = A.handle(0.65, 0.95, { color: 'blue', label: 'a', constrain: box });
        const b = A.handle(-0.15, 0.8, { color: 'orange', label: 'b', constrain: box });
        const K = 12;
        let st = null;
        v.legend([
          ['blue', '$e^a$'], ['orange', '$e^b$'], ['green', '$e^a e^b$ (black ring: $e^{a+b}$)'],
          ['gold', '$S_N(a)S_N(b)$ (dot), $S_N(a+b)$ (ring)', { dot: true }],
          ['red', 'square minus triangle', { area: true }],
        ]);
        v.render(() => {
          const N = Nc.value;
          const ca = new Cx(a.x, a.y), cb = new Cx(b.x, b.y), cs = ca.add(cb);
          // ---- exponents: the parallelogram 0, a, b, a+b
          A.rect(box.x[0], box.y[0], box.x[1], box.y[1], { color: 'faint', width: 1, dash: [3, 4] });
          A.line(0, 0, a.x, a.y, { color: 'blue', width: 1.4, alpha: 0.6 });
          A.line(0, 0, b.x, b.y, { color: 'orange', width: 1.4, alpha: 0.6 });
          A.line(a.x, a.y, cs.re, cs.im, { color: 'orange', width: 1.2, dash: [4, 4], alpha: 0.75 });
          A.line(b.x, b.y, cs.re, cs.im, { color: 'blue', width: 1.2, dash: [4, 4], alpha: 0.75 });
          A.arrow(0, 0, cs.re, cs.im, { color: 'green', width: 2.4 });
          A.text('a+b', cs.re, cs.im, { math: true, color: 'green', dx: 8, dy: -10 });
          // ---- values
          const ea = ca.exp(), eb = cb.exp(), prod = ea.mul(eb), esum = cs.exp();
          const sa = expPartial(a.x, a.y, N), sb = expPartial(b.x, b.y, N), ss = expPartial(cs.re, cs.im, N);
          const P = new Cx(sa[0], sa[1]).mul(new Cx(sb[0], sb[1])), Q = new Cx(ss[0], ss[1]);
          const R = Math.max(1.35, ea.abs(), eb.abs(), prod.abs()) * 1.4;
          W.setView([-R, R], [-R, R]);
          W.circle(0, 0, 1, { color: 'faint', width: 1, dash: [3, 4] });
          const r1 = R * 0.17, r2 = R * 0.25;
          W.curve((s) => [r1 * Math.cos(s * a.y), r1 * Math.sin(s * a.y)], 0, 1, { color: 'blue', width: 2.2 });
          W.curve((s) => { const th = a.y + s * b.y; return [r2 * Math.cos(th), r2 * Math.sin(th)]; }, 0, 1, { color: 'orange', width: 2.2 });
          W.arrow(0, 0, ea.re, ea.im, { color: 'blue', width: 2 });
          W.arrow(0, 0, eb.re, eb.im, { color: 'orange', width: 2 });
          W.arrow(0, 0, prod.re, prod.im, { color: 'green', width: 3.2 });
          W.circle(esum.re, esum.im, 10 / W.scale, { color: 'ink', width: 1.8 });
          if (P.sub(Q).abs() * W.scale > 2) W.line(P.re, P.im, Q.re, Q.im, { color: 'red', width: 2 });
          W.circle(Q.re, Q.im, 6 / W.scale, { color: 'gold', width: 2.2 });
          W.dot(P.re, P.im, { color: 'gold', r: 4.5 });
          tipLabel(W, 'e^a', ea.re, ea.im, 'blue');
          tipLabel(W, 'e^b', eb.re, eb.im, 'orange');
          { // label e^{a+b} beside the middle of its arrow, on the counter-clockwise side
            const L0 = Math.hypot(prod.re, prod.im) || 1;
            W.tex('e^a e^b', 0.55 * prod.re, 0.55 * prod.im, { color: 'green', dx: (-prod.im / L0) * 22, dy: -(prod.re / L0) * 22 });
          }
          // ---- the array of terms
          const pa = [1], pb = [1];
          for (let j = 1; j <= K; j++) { pa.push(pa[j - 1] * ca.abs() / j); pb.push(pb[j - 1] * cb.abs() / j); }
          let redBound = 0;
          for (let j = 0; j <= K; j++) for (let k = 0; k <= K; k++) {
            const m = pa[j] * pb[k];
            const al = v.M.clamp((Math.log10(m + 1e-300) + 6) / 6, 0.07, 1);
            const inTri = j + k <= N, inSq = j <= N && k <= N;
            if (inSq && !inTri) redBound += m;
            const col = inTri ? 'green' : inSq ? 'red' : 'gray';
            G.rect(j - 0.42, k - 0.42, j + 0.42, k + 0.42, { fill: col, fillAlpha: (inTri || inSq ? 0.92 : 0.5) * al, stroke: false });
          }
          G.rect(-0.5, -0.5, N + 0.5, N + 0.5, { color: 'blue', width: 1.6, dash: [5, 4] });
          G.line(-0.5, N + 1, N + 1, -0.5, { color: 'green', width: 2.2 });
          for (const t of [0, 4, 8, 12]) {
            G.text(String(t), t, -1.05, { align: 'center', color: 'muted', size: 11 });
            G.text(String(t), -1.05, t, { align: 'center', color: 'muted', size: 11 });
          }
          G.text('j', 12.85, -1.05, { math: true, color: 'muted', align: 'center' });
          G.text('k', -1.05, 12.85, { math: true, color: 'muted', align: 'center' });
          G.corner(`N = ${N}`, 'tr', { color: 'ink', weight: 600 });
          st = { prod, esum, P, Q, N, redBound };
        });
        v.readout(() => {
          if (!st) return '';
          const { prod, esum, P, Q, N, redBound } = st;
          return `$e^ae^b = ${cnum(prod, 4)}$ and $e^{a+b} = ${cnum(esum, 4)}$ (difference $${num(prod.sub(esum).abs(), 2)}$). `
            + `With $N=${N}$: $|S_N(a)S_N(b)-S_N(a+b)| = ${num(P.sub(Q).abs(), 3)} \\le ${num(redBound, 3)}$ = sum of $|$red cells$|$, and $|S_N(a+b)-e^{a+b}| = ${num(Q.sub(esum).abs(), 3)}$.`;
        });
      },
    },

    /* ------------------------------------------------------------------ 0.2 */
    {
      num: '0.2',
      kind: 'Proposition',
      name: 'The exponential function has no zeros',
      statement: String.raw`For every $z\in\C$,
$$e^{z}\,e^{-z}=1 ,$$
and consequently $e^{z}\neq0$.`,
      idea: String.raw`Take $b=-a$ in the addition formula 0.1: $e^ae^{-a}=e^0=1$, and a product equal to $1$ has no zero factor. The fact is less innocent than it looks: each partial sum $S_N(z)=\sum_{n\le N}z^n/n!$ is a polynomial of degree $N$ and therefore has $N$ zeros. On $|z|\le R$ we have $|e^z|\ge e^{-R}$, so uniform convergence (0.1) forces these zeros out of every disc as $N\to\infty$.`,
      caption: String.raw`Both panels are phase portraits: the hue shows the argument of the value. Left: the partial sum $S_N$ — every colour wheel is one of its $N$ zeros, and the dashed zero-free disc grows with $N$. Right: $e^z$ has no zeros at all. Drag $z$ in either panel to compare $S_N(z)S_N(-z)$ with $e^ze^{-z}=1$.`,
      deps: ['rca-0.1'],
      see: ['pma-8.6'],
      tags: ['exponential', 'zeros'],
      verify: true,
      viz(v) {
        const { Cx } = v.M;
        const view = { x: [-10, 14], y: [-12, 12] };
        const L = v.stage({ ...view, equal: true, height: 340, title: 'partial sum $S_N(z)=\\sum_{n=0}^{N} z^n/n!$' });
        const R = v.stage({ ...view, equal: true, height: 340, title: 'the limit $e^z$' });
        const Nc = v.slider('degree $N$', 1, 30, 9, { int: true });
        const zL = L.handle(-4, 5, { color: 'ink', label: 'z' });
        const zR = R.handle(-4, 5, { color: 'ink', label: 'z' });
        zL.onDrag = () => { zR.x = zL.x; zR.y = zL.y; };
        zR.onDrag = () => { zL.x = zR.x; zL.y = zR.y; };
        const cache = new Map();
        const zerosOf = (N) => { if (!cache.has(N)) cache.set(N, partialZeros(N)); return cache.get(N); };
        let st = null;
        v.legend([['ink', 'zeros of $S_N$ (where all colours meet)', { dot: true }], ['ink', 'largest zero-free disc of $S_N$', { dash: true }], ['ink', 'the points $z$ and $-z$', { dot: true }]]);
        v.render(() => {
          const N = Nc.value, zs = zerosOf(N);
          L.domain((z) => expPartial(z.re, z.im, N), { key: 'S' + N, res: 2, contours: false, saturation: 0.58 });
          R.domain((z) => z.exp(), { key: 'exp', res: 2, contours: false, saturation: 0.58 });
          for (const S of [L, R]) { S.hline(0, { color: 'ink', alpha: 0.28, width: 1 }); S.vline(0, { color: 'ink', alpha: 0.28, width: 1 }); }
          const rmin = Math.min(...zs.map(([x, y]) => Math.hypot(x, y)));
          L.circle(0, 0, rmin, { color: 'ink', width: 1.8, dash: [7, 5] });
          for (const [x, y] of zs) L.circle(x, y, 5 / L.scale, { color: 'ink', width: 2 });
          const bx = L.bounds;
          const out = zs.filter(([x, y]) => x < bx.x[0] || x > bx.x[1] || y < bx.y[0] || y > bx.y[1]).length;
          L.corner(`${N} zero${N > 1 ? 's' : ''}` + (out ? `, ${out} outside the view` : ''), 'tl', { color: 'ink', weight: 600 });
          R.corner('no zeros at all', 'tl', { color: 'ink', weight: 600 });
          for (const [S, h] of [[L, zL], [R, zR]]) {
            S.line(h.x, h.y, -h.x, -h.y, { color: 'ink', width: 1.2, dash: [3, 4], alpha: 0.75 });
            S.dot(-h.x, -h.y, { color: 'ink', r: 4.5, label: '−z', labelPos: 'se' });
          }
          const z = new Cx(zL.x, zL.y);
          const p = expPartial(z.re, z.im, N), q = expPartial(-z.re, -z.im, N);
          st = { N, rmin, z, pS: new Cx(p[0], p[1]).mul(new Cx(q[0], q[1])), pE: z.exp().mul(z.neg().exp()) };
        });
        v.readout(() => {
          if (!st) return '';
          return `At $z = ${cnum(st.z, 3)}$: $\\;S_{${st.N}}(z)\\,S_{${st.N}}(-z) = ${cnum(st.pS, 4)}$, whereas $e^ze^{-z} = ${cnum(st.pE, 8)}$. `
            + `The zeros of $S_{${st.N}}$ stay outside $|z| < ${num(st.rmin, 3)}$; this radius grows without bound as $N\\to\\infty$.`;
        });
      },
    },

    /* ------------------------------------------------------------------ 0.3 */
    {
      num: '0.3',
      kind: 'Theorem',
      name: 'The exponential function is its own derivative',
      statement: String.raw`$\exp$ is complex-differentiable at every point of $\C$, and $\exp'=\exp$:
$$\lim_{h\to0}\frac{e^{z+h}-e^{z}}{h}=e^{z}\qquad(z\in\C,\ h\in\C\setminus\{0\}).$$`,
      idea: String.raw`The addition formula 0.1 factors the difference quotient: $\frac{e^{z+h}-e^z}{h}=e^z\cdot\frac{e^h-1}{h}$. From the series, $\frac{e^h-1}{h}-1=\sum_{n\ge2}\frac{h^{n-1}}{n!}$, whose modulus is at most $\sum_{n\ge2}\frac{|h|^{n-1}}{n!}=\frac{e^{|h|}-1-|h|}{|h|}\le\tfrac12|h|e^{|h|}$; this tends to $0$ no matter from which direction $h$ approaches $0$.`,
      caption: String.raw`Drag $z$ and shrink $|h|$ (log scale) while $h$ circles $z$ in every direction. On the right, the orange loop collects *all* difference quotients with the current $|h|$; it closes in on the tip of the green vector $e^z$. The dashed circle is the series bound $|e^z|\,\frac{e^{|h|}-1-|h|}{|h|}$; the loop touches it where $h>0$.`,
      deps: ['rca-0.1'],
      see: ['pma-8.6', 'pma-8.1', 'rca-10.6'],
      tags: ['exponential', 'derivative'],
      verify: true,
      viz(v) {
        const { Cx } = v.M;
        const Z = v.stage({ x: [-2.2, 2.2], y: [-2.2, 2.2], equal: true, height: 380, title: 'the point $z$ and the increment $h$' });
        const Q = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, height: 380, title: 'difference quotients $\\frac{e^{z+h}-e^{z}}{h}$' });
        const hs = v.slider('$|h|$', 0.002, 1.6, 0.9, { log: true, fmt: (x) => v.fmt(x, 2) });
        const z = Z.handle(0.35, 0.9, { color: 'blue', label: 'z', constrain: { x: [-1.4, 1.4], y: [-1.9, 1.9] } });
        let st = null;
        v.legend([['green', '$e^z$'], ['orange', 'quotients for all $h$ with this $|h|$'], ['green', 'series bound for the error', { dash: true }]]);
        v.animate((t) => {
          const r = hs.value, th = 0.7 * t + 0.6;
          const zc = new Cx(z.x, z.y), ez = zc.exp();
          const quot = (eta) => zc.add(eta).exp().sub(ez).div(eta);
          const h = Cx.polar(r, th);
          // left: all increments of size |h| around z, and the current one
          Z.circle(z.x, z.y, r, { color: 'orange', width: 1.4, dash: [4, 4], fill: 'orange', fillAlpha: 0.06 });
          Z.arrow(z.x, z.y, z.x + h.re, z.y + h.im, { color: 'orange', width: 2.2, head: 8 });
          if (r * Z.scale > 18) Z.text('z+h', z.x + h.re, z.y + h.im, { math: true, color: 'orange', dx: 14 * Math.cos(th), dy: -14 * Math.sin(th), align: Math.cos(th) > 0.3 ? 'left' : Math.cos(th) < -0.3 ? 'right' : 'center' });
          // right: the loop of quotients, the current quotient and the target e^z
          const loop = [];
          for (let k = 0; k < 180; k++) { const q = quot(Cx.polar(r, TWO_PI * k / 180)); loop.push([q.re, q.im]); }
          const bound = ez.abs() * (Math.expm1(r) - r) / r;
          let M = 1.2;
          for (const [x, y] of loop) M = Math.max(M, Math.abs(x), Math.abs(y));
          M = Math.max(M, Math.abs(ez.re) + bound, Math.abs(ez.im) + bound) * 1.12;
          Q.setView([-M, M], [-M, M]);
          Q.circle(ez.re, ez.im, bound, { color: 'green', width: 1.2, dash: [3, 4] });
          Q.path(loop, { close: true, color: 'orange', width: 2, fill: 'orange', fillAlpha: 0.12 });
          Q.arrow(0, 0, ez.re, ez.im, { color: 'green', width: 2.8 });
          { const L0 = ez.abs(); Q.tex('e^z', 0.5 * ez.re, 0.5 * ez.im, { color: 'green', dx: (ez.im / L0) * 16, dy: (ez.re / L0) * 16 }); }
          const q = quot(h);
          Q.line(0, 0, q.re, q.im, { color: 'orange', width: 1.2, dash: [3, 3] });
          Q.dot(q.re, q.im, { color: 'orange', r: 5 });
          st = { r, h, q, ez, bound };
        }, { period: TWO_PI / 0.7 });
        v.readout(() => {
          if (!st) return '';
          const { h, q, ez, bound } = st;
          return `$h = ${cnum(h, 3)}$: $\\;\\frac{e^{z+h}-e^z}{h} = ${cnum(q, 5)}$, $\\;e^z = ${cnum(ez, 5)}$, `
            + `$\\;\\left|\\frac{e^{z+h}-e^z}{h}-e^z\\right| = ${num(q.sub(ez).abs(), 3)} \\le |e^z|\\,\\frac{e^{|h|}-1-|h|}{|h|} = ${num(bound, 3)}$`;
        });
      },
    },

    /* ------------------------------------------------------------------ 0.4 */
    {
      num: '0.4',
      kind: 'Proposition',
      name: 'On the real axis, exp is positive and increasing',
      statement: String.raw`The restriction of $\exp$ to the real axis is a strictly increasing function with values in $(0,\infty)$, and
$$\lim_{x\to+\infty}e^{x}=+\infty,\qquad \lim_{x\to-\infty}e^{x}=0 .$$`,
      idea: String.raw`For $x>0$ every term of the series is positive, so $e^x\ge1+x>1$; this also shows $e^x\to\infty$. For $x<0$ the series alternates and proves nothing by itself, but $e^{x}=1/e^{-x}$ by 0.2, which is positive and tends to $0$ as $x\to-\infty$. Since $(e^x)'=e^x>0$ by 0.3, the mean value theorem makes $e^x$ strictly increasing.`,
      caption: String.raw`Drag the point along $y=e^x$: the green tangent has slope $e^x$ and always meets the axis exactly $1$ unit to the left. Its purple partner $(-x,e^{-x})$ shows where positivity for $x<0$ comes from: $e^x\,e^{-x}=1$. Compare with a partial sum $S_N$: for negative $x$ the truncated series dips below $0$ or turns downward.`,
      deps: ['rca-0.1', 'rca-0.2', 'rca-0.3', 'pma-5.11'],
      see: ['pma-8.6'],
      tags: ['exponential', 'monotone functions'],
      verify: true,
      viz(v) {
        const S = v.stage({ x: [-4.8, 2.6], y: [-1.25, 6.3], height: 370, full: true, xlabel: 'x' });
        const showS = v.toggle('compare with the partial sum $S_N$', true);
        const Nc = v.slider('$N$', 1, 10, 3, { int: true });
        const P = S.handle(-0.9, Math.exp(-0.9), { color: 'blue', constrain: (x) => { const xx = v.M.clamp(x, -1.78, 1.78); return [xx, Math.exp(xx)]; } });
        let st = null;
        v.legend([
          ['blue', '$y=e^x$'], ['orange', '$y=1+x$', { dash: true }], ['green', 'tangent, slope $e^x$'],
          ['purple', 'partner $e^{-x}=1/e^{x}$', { dot: true }], ['gold', '$y=S_N(x)$'], ['red', 'where $S_N$ fails', { area: true }],
        ]);
        v.render(() => {
          const x = P.x, ex = Math.exp(x), N = Nc.value;
          const SN = (t) => expPartial(t, 0, N)[0];
          let fail = null;
          if (showS.value) {
            // where S_N ≤ 0, or where S_N is decreasing (S_N' = S_{N-1} < 0)
            const bad = []; let run = null, firstNeg = null, firstDec = null;
            for (let i = 0; i <= 700; i++) {
              const t = -4.8 + 4.8 * i / 700, s = SN(t), dec = expPartial(t, 0, N - 1)[0] < 0;
              const b = s <= 0 || dec;
              if (s <= 0) firstNeg = t; if (dec) firstDec = t;
              if (b && !run) run = [t, t]; if (b) run[1] = t;
              if (!b && run) { bad.push(run); run = null; }
            }
            if (run) bad.push(run);
            for (const [p, q] of bad) S.vband(p, q, { color: 'red', alpha: 0.08 });
            S.fn(SN, { color: 'gold', width: 2.2 });
            fail = { neg: firstNeg, dec: firstDec };
            if (firstNeg != null) S.corner(`S${sub(N)}(x) < 0 for x < ${v.fix(firstNeg, 2)}`, 'tl', { color: 'red', weight: 600 });
            else if (firstDec != null) S.corner(`S${sub(N)}(x) > 0, but S${sub(N)} decreases for x < ${v.fix(firstDec, 2)}`, 'tl', { color: 'red', weight: 600 });
            else S.corner(`S${sub(N)} is positive and increasing on this window`, 'tl', { color: 'muted', weight: 600 });
          }
          S.fn((t) => 1 + t, { color: 'orange', width: 1.6, dash: [6, 5] });
          S.fn(Math.exp, { color: 'blue', width: 3 });
          S.tex('y=1+x', 1.45, 2.45, { color: 'orange', align: 'left', dx: 6, dy: 20 });
          S.tex('y=e^x', 1.8, Math.exp(1.8), { color: 'blue', align: 'right', dx: -10 });
          S.tex('e^x\\to 0', -4.7, 0, { color: 'muted', align: 'left', dy: -16, size: 14 });
          // tangent and its subtangent of length 1
          S.line(x - 1, 0, x + 1.25, ex * 2.25, { color: 'green', width: 1.9 });
          S.line(x, 0, x, ex, { color: 'green', width: 1, dash: [2, 3] });
          S.line(x - 1, 0, x, 0, { color: 'green', width: 4, alpha: 0.65, cap: 'butt' });
          S.line(x - 1, 0, x - 1, -0.62, { color: 'green', width: 1, dash: [2, 3] });
          S.line(x, 0, x, -0.62, { color: 'green', width: 1, dash: [2, 3] });
          S.measure(x - 1, -0.55, x, -0.55, '1', { color: 'green', offset: 11 });
          // partner point (−x, e^{−x})
          const xm = -x, em = Math.exp(xm);
          S.line(x, ex, xm, em, { color: 'purple', width: 1.2, dash: [3, 4] });
          S.dot(xm, em, { color: 'purple', r: 5.5 });
          S.tex('e^{-x}', xm, em, { color: 'purple', dx: 10, dy: 12, align: 'left' });
          S.tex('e^{x}', x, ex, { color: 'blue', dx: -12, dy: -14, align: 'right' });
          st = { x, ex, em, N, s: showS.value ? SN(x) : null };
        });
        v.readout(() => {
          if (!st) return '';
          const { x, ex, em, N, s } = st;
          return `$x = ${num(x, 3)}$: $\\;e^x = ${num(ex, 5)} \\ge 1+x = ${num(1 + x, 3)}$, $\\;e^{-x} = ${num(em, 5)}$, $\\;e^xe^{-x} = ${num(ex * em, 10)}$; slope of the tangent $= e^x > 0$.`
            + (s != null ? ` $\\;S_{${N}}(x) = ${num(s, 4)}$.` : '');
        });
      },
    },

    /* ------------------------------------------------------------------ 0.5 */
    {
      num: '0.5',
      kind: 'Theorem',
      name: 'Definition of π: the first zero of cosine',
      statement: String.raw`There is a positive real number $\pi$ such that $e^{\pi i/2}=i$ and such that, for $z\in\C$,
$$e^{z}=1\iff \frac{z}{2\pi i}\in\Z .$$
Here, with $\cos t=\Re e^{it}$ and $\sin t=\Im e^{it}$ for real $t$, the number $\pi/2$ is the smallest positive zero of $\cos$.`,
      idea: String.raw`Since $\overline{e^{it}}=e^{-it}$, $|e^{it}|=1$; so $\cos^2+\sin^2=1$, and 0.3 gives $\cos'=-\sin$, $\sin'=\cos$. If $\cos$ had no positive zero it would stay positive, $\sin$ would increase, and for $0<x<y$ we would get $\sin x\,(y-x)<\int_x^y\sin=\cos x-\cos y\le2$ — false for large $y$. So $\cos$ has a smallest positive zero $t_0$; put $\pi=2t_0$. Then $\sin t_0=1$, i.e. $e^{\pi i/2}=i$, and $e^{2\pi i}=i^4=1$. Conversely, if $e^{x+iy}=1$ then $e^x=1$, so $x=0$; and if $0<y<2\pi$, the point $u+iv=e^{iy/4}$ has $u,v>0$, while $(u+iv)^4$ is real only when $u^2=v^2$, where it equals $-1$.`,
      caption: String.raw`Left: drag $x$ and $y$. As long as $\cos>0$ on $[0,y]$, $\sin$ increases, so the gold rectangle $\sin x\,(y-x)$ fits under the orange area $\cos x-\cos y\le 2$ — hence $\cos$ must vanish before the red line $x+2/\sin x$. Right: since $e^{iy/4}$ stays strictly inside the shaded quadrant, $e^{iy}\ne1$ until $y=2\pi$.`,
      deps: ['rca-0.1', 'rca-0.3', 'rca-0.4', 'pma-4.23', 'pma-6.21'],
      see: ['pma-8.7'],
      tags: ['pi', 'trigonometric functions'],
      verify: true,
      viz(v) {
        const G = v.stage({
          x: [-0.3, 7.0], y: [-1.3, 1.62], height: 380, minWidth: 280,
          xticks: [[T0, 'π/2'], [PI0, 'π'], [3 * T0, '3π/2'], [TWO_PI, '2π']], yticks: [-1, 1],
          title: '$\\cos t$ and $\\sin t$ summed from the series of $e^{it}$',
        });
        const C = v.stage({ x: [-1.42, 1.42], y: [-1.42, 1.42], equal: true, height: 410, minWidth: 250, ticks: false, title: 'the arc $e^{it}$ for $0\\le t\\le y$' });
        const hx = G.handle(0.4, 0, { color: 'gold', label: 'x', constrain: (x) => [v.M.clamp(x, 0.1, hy.x - 0.08), 0] });
        const hy = G.handle(1.05, 0, { color: 'orange', label: 'y', constrain: (x) => [v.M.clamp(x, hx.x + 0.08, 6.85), 0] });
        let st = null;
        v.legend([['blue', '$\\cos t$'], ['purple', '$\\sin t$'], ['orange', 'area $\\int_x^y\\sin = \\cos x-\\cos y$', { area: true }], ['gold', 'rectangle $\\sin x\\,(y-x)$', { area: true }], ['green', 'first zero $t_0=\\pi/2$', { dot: true }]]);
        v.render(() => {
          const x = hx.x, y = hy.x, sx = sinSer(x);
          // the proof's comparison: rectangle vs area under sin
          G.between(sinSer, () => 0, x, y, { fill: 'orange', fillAlpha: 0.22 });
          G.rect(x, 0, y, sx, { color: 'gold', width: 1.8, fill: 'gold', fillAlpha: 0.14 });
          G.fn(cosSer, { color: 'blue', width: 2.5 });
          G.fn(sinSer, { color: 'purple', width: 2.5 });
          G.tex('\\cos t', 6.6, cosSer(6.6), { color: 'blue', dx: -4, dy: -16, align: 'right' });
          G.tex('\\sin t', 2.45, sinSer(2.45), { color: 'purple', dx: 10, dy: -10, align: 'left' });
          const B = x + 2 / sx;
          if (B < G.bounds.x[1] - 0.05) {
            G.vline(B, { color: 'red', dash: [6, 4], width: 1.6 });
            G.tex('x+\\tfrac{2}{\\sin x}', B, 1.5, { color: 'red', align: 'left', dx: 5, size: 14 });
          } else G.corner(`x + 2/sin x = ${v.fix(B, 2)} →`, 'tr', { color: 'red', weight: 600 });
          G.dot(T0, 0, { color: 'green', r: 4.5 });
          G.tex('t_0', T0, 0, { color: 'green', dx: 9, dy: -12, align: 'left' });
          if (y <= T0) G.corner('cos > 0 on [0, y]: rectangle < area ≤ 2', 'tl', { color: 'green', weight: 600 });
          else G.corner('y is past t₀, the first zero of cos', 'tl', { color: 'muted', weight: 600 });
          // circle: arc, quarter points, and i = e^{iπ/2}
          const sector = [[0, 0]];
          for (let k = 0; k <= 40; k++) { const s = T0 * k / 40; sector.push([cosSer(s), sinSer(s)]); }
          C.poly(sector, { fill: 'teal', fillAlpha: 0.1, stroke: false });
          C.line(0, 0, 1.3 * cosSer(T0 / 2), 1.3 * sinSer(T0 / 2), { color: 'teal', width: 1.2, dash: [4, 4] });
          C.tex('u=v', 1.3 * cosSer(T0 / 2), 1.3 * sinSer(T0 / 2), { color: 'teal', size: 13, dx: 4, dy: -4, align: 'left', baseline: 'bottom' });
          C.circle(0, 0, 1, { color: 'faint', width: 1.2 });
          C.curve((s) => [cosSer(s), sinSer(s)], 0, y, { color: 'orange', width: 3.2, n: 300 });
          C.dot(cosSer(x), sinSer(x), { color: 'gold', r: 4.5 });
          for (let k = 1; k <= 3; k++) C.dot(cosSer(k * y / 4), sinSer(k * y / 4), { color: 'teal', r: k === 1 ? 5.5 : 3.5 });
          const u = cosSer(y / 4), w = sinSer(y / 4);
          C.tex('e^{iy/4}', u, w, { color: 'teal', dx: -14 * u, dy: 14 * w, align: u > 0.3 ? 'right' : 'center' });
          C.dot(0, 1, { color: 'green', r: 6 });
          C.tex('i=e^{i\\pi/2}', 0, 1, { color: 'green', dy: -16, dx: -6, align: 'right' });
          C.dot(1, 0, { color: 'ink', r: 3.5 });
          C.tex('1', 1, 0, { color: 'ink', dx: 9, dy: 10, size: 13 });
          C.dot(cosSer(y), sinSer(y), { color: 'orange', r: 6 });
          C.tex('e^{iy}', cosSer(y), sinSer(y), { color: 'orange', dx: 16 * cosSer(y), dy: -16 * sinSer(y) });
          const hit = Math.abs(y - TWO_PI) < 0.03;
          if (y < TWO_PI - 0.03) C.texPx('0<y<2\\pi\\ \\Rightarrow\\ e^{iy}\\neq 1', 10, C.height - 10, { color: 'teal', align: 'left', baseline: 'bottom', size: 14 });
          else if (hit) C.texPx('y=2\\pi:\\ e^{iy}=1', 10, C.height - 10, { color: 'green', align: 'left', baseline: 'bottom', size: 14 });
          st = { x, y, sx, u, w };
        });
        v.readout(() => {
          if (!st) return '';
          const { x, y, sx, u, w } = st;
          return `$t_0 = ${T0.toFixed(12)}$ (bisection on the series of $\\cos$), so $\\pi = 2t_0 = ${PI0.toFixed(12)}$, and $\\sin t_0 = ${sinSer(T0).toFixed(12)}$, i.e. $e^{i\\pi/2} = i$.\n\n`
            + `Rectangle $\\sin x\\,(y-x) = ${num(sx * (y - x), 4)}$, area $\\cos x - \\cos y = ${num(cosSer(x) - cosSer(y), 4)}$. `
            + `With $u+iv = e^{iy/4}$: $\\Im e^{iy} = 4uv(u^2-v^2) = ${num(4 * u * w * (u * u - w * w), 4)}$, $\\;\\Re e^{iy} = ${num(cosSer(y), 4)}$.`;
        });
      },
    },

    /* ------------------------------------------------------------------ 0.6 */
    {
      num: '0.6',
      kind: 'Proposition',
      name: 'Periodicity: exp has period 2πi',
      statement: String.raw`$\exp$ is a periodic function with period $2\pi i$:
$$e^{z+2\pi i}=e^{z}\qquad(z\in\C).$$`,
      idea: String.raw`By the addition formula 0.1, $e^{z+w}=e^z\,e^w$, so $w$ is a period exactly when $e^w=1$. By 0.5 this happens precisely for $w\in2\pi i\Z$; in particular $2\pi i$ is a period, and no nonzero number of smaller modulus is one.`,
      caption: String.raw`Drag the letter F (blue) and its copy $F+w$ (orange). Since $e^{z+w}=e^w e^z$, the image of the copy is the image of F scaled by $e^{\Re w}$ and turned through $\Im w$. The two images coincide only when the copy snaps onto a green ring, i.e. when $w\in2\pi i\Z$.`,
      deps: ['rca-0.1', 'rca-0.5'],
      see: ['pma-8.7'],
      tags: ['exponential', 'periodicity'],
      verify: true,
      viz(v) {
        const { Cx } = v.M;
        const Z = v.stage({ x: [-2.2, 2.2], y: [-7.7, 10.5], equal: true, height: 450, title: '$z$-plane over the phase portrait of $e^z$' });
        const W = v.stage({ x: [-4, 4], y: [-4, 4], equal: true, height: 450, title: '$w$-plane: $e^{F}$ and $e^{F+w}=e^w\\,e^{F}$' });
        const F0 = [[0, 0], [0.32, 0], [0.32, 0.62], [0.78, 0.62], [0.78, 0.9], [0.32, 0.9], [0.32, 1.28], [0.98, 1.28], [0.98, 1.6], [0, 1.6]].map(([x, y]) => [1.5 * (x - 0.49), 1.5 * (y - 0.8)]);
        const Fd = densify(F0, 16);
        const f = Z.handle(-0.35, 0.1, { color: 'blue', constrain: { x: [-1, 1], y: [-1.5, 1.5] } });
        const clampW = (wx, wy) => {
          const k = Math.round(wy / TWO_PI);
          if (Math.abs(k) <= 1 && Math.abs(wx) < 0.32 && Math.abs(wy - k * TWO_PI) < 0.45) return [0, k * TWO_PI];
          return [v.M.clamp(wx, -1.4, 1.4), v.M.clamp(wy, -6.2, 7.6)];
        };
        const g = Z.handle(-0.35 + 0.8, 0.1 + 3.35, {
          color: 'orange',
          constrain: (x, y) => { const [wx, wy] = clampW(x - f.x, y - f.y); return [f.x + wx, f.y + wy]; },
        });
        let prev = [f.x, f.y];
        f.onDrag = () => { g.x += f.x - prev[0]; g.y += f.y - prev[1]; prev = [f.x, f.y]; };
        let st = null;
        v.legend([['blue', '$F$ and $e^{F}$', { area: true }], ['orange', '$F+w$ and $e^{F+w}$', { area: true }], ['green', 'lattice translates $F+2\\pi i k$', { dot: true }]]);
        v.render(() => {
          const w = new Cx(g.x - f.x, g.y - f.y), ew = w.exp();
          const snapped = Math.abs(w.re) < 1e-12 && Math.abs(w.im - Math.round(w.im / TWO_PI) * TWO_PI) < 1e-9;
          // z-plane
          Z.domain((z) => z.exp(), { key: 'exp', res: 2, alpha: 0.6, saturation: 0.6, contours: false });
          Z.hline(0, { color: 'ink', alpha: 0.3, width: 1 }); Z.vline(0, { color: 'ink', alpha: 0.3, width: 1 });
          for (const k of [-2, -1, 0, 1]) Z.hline((2 * k + 1) * PI0, { color: 'ink', alpha: 0.4, width: 1, dash: [5, 5] });
          for (const [k, lab] of [[-1, '-2\\pi i'], [1, '+2\\pi i']]) {
            const cy = f.y + k * TWO_PI;
            Z.circle(f.x, cy, 1.45, { color: 'green', width: 2.4, dash: [6, 4] });
            Z.tex('F' + lab, f.x + 1.45, cy, { color: 'green', align: 'left', dx: 6, size: 14 });
          }
          for (const [k, lab] of [[-1, '-\\pi i'], [1, '\\pi i'], [3, '3\\pi i']]) Z.tex(lab, Z.bounds.x[0], k * PI0, { color: 'ink', align: 'left', dx: 6, dy: 10, size: 12 });
          const Fz = Fd.map(([x, y]) => [x + f.x, y + f.y]);
          const Fw = Fz.map(([x, y]) => [x + w.re, y + w.im]);
          Z.arrow(f.x, f.y, g.x, g.y, { color: 'orange', width: 1.6, dash: [5, 4], head: 9 });
          for (const [pts, col] of [[Fz, 'blue'], [Fw, 'orange']]) {
            Z.poly(pts, { fill: 'panel', fillAlpha: 0.8, stroke: false });
            Z.poly(pts, { fill: col, fillAlpha: 0.4, color: col, width: 2.2 });
          }
          Z.tex('F', f.x + 0.85, f.y + 0.95, { color: 'blue', align: 'left', size: 16 });
          Z.tex('F+w', g.x + 0.85, g.y + 0.95, { color: 'orange', align: 'left', size: 16 });
          // w-plane
          const img = Fz.map(([x, y]) => new Cx(x, y).exp());
          const imgW = img.map((p) => p.mul(ew));
          let R = 1.4;
          for (const p of img.concat(imgW)) R = Math.max(R, Math.abs(p.re), Math.abs(p.im));
          R *= 1.15;
          W.setView([-R, R], [-R, R]);
          W.circle(0, 0, 1, { color: 'faint', width: 1, dash: [3, 4] });
          W.poly(img.map((p) => [p.re, p.im]), { fill: 'blue', fillAlpha: 0.35, color: 'blue', width: 2.2 });
          W.poly(imgW.map((p) => [p.re, p.im]), { fill: 'orange', fillAlpha: snapped ? 0.2 : 0.35, color: 'orange', width: snapped ? 3.2 : 2.2, dash: snapped ? [7, 5] : null });
          W.corner(snapped ? 'w ∈ 2πiℤ: the images coincide' : 'w ∉ 2πiℤ: the image moves', 'tl', { color: snapped ? 'green' : 'red', weight: 600 });
          let dmax = 0;
          for (let i = 0; i < img.length; i++) dmax = Math.max(dmax, imgW[i].sub(img[i]).abs());
          st = { w, ew, snapped, dmax };
        });
        v.readout(() => {
          if (!st) return '';
          const { w, ew, snapped, dmax } = st;
          return `$w = ${cnum(w, 3)}$, $\\;e^w = ${cnum(ew, 4)}$: the orange image is the blue one scaled by $e^{\\Re w} = ${num(Math.exp(w.re), 3)}$ and turned through $\\Im w = ${num(w.im, 3)}$ rad; `
            + `$\\max_{z\\in F}|e^{z+w}-e^{z}| = ${num(dmax, 3)}$.` + (snapped ? ` Here $w = ${Math.round(w.im / TWO_PI)}\\cdot 2\\pi i$, so $e^w=1$.` : '');
        });
      },
    },

    /* ------------------------------------------------------------------ 0.7 */
    {
      num: '0.7',
      kind: 'Theorem',
      name: 'The map t ↦ exp(it) is onto the unit circle',
      statement: String.raw`For real $t$ one has $|e^{it}|=1$, and the map $t\mapsto e^{it}$ carries $\R$ **onto** the unit circle: every $w\in\C$ with $|w|=1$ equals $e^{it}$ for some $t\in\R$.`,
      idea: String.raw`Write $w=u+iv$. If $u,v\ge0$, then $0\le u\le1$, and the intermediate value theorem gives $t\in[0,\pi/2]$ with $\cos t=u$; as $\sin\ge0$ there and $\sin^2t=1-u^2=v^2$, also $\sin t=v$. If $u<0\le v$, apply this to $-iw$ and add $\pi/2$; if $v<0$, apply the two previous cases to $-w$ and add $\pi$. Because $\bigl|\tfrac{d}{dt}e^{it}\bigr|=|ie^{it}|=1$, the parameter $t$ is arc length: the line is wound around the circle without stretching, once every $2\pi$ (0.5).`,
      caption: String.raw`Wind the line $1+it$ (tangent to the circle at $1$) onto the circle with the slider or press play: like thread on a spool, every point keeps its distance $t$ from $1$ along the curve, so the wound part lies exactly at $e^{it}$. Drag $w$ around the circle — the gold dots are its preimages $t+2\pi k$, which all land on $w$ once wound.`,
      deps: ['rca-0.1', 'rca-0.5', 'pma-4.23'],
      see: ['pma-8.7'],
      tags: ['unit circle', 'trigonometric functions'],
      verify: true,
      viz(v) {
        const L = v.stage({ x: [-2.25, 2.25], y: [-2.25, 2.25], equal: true, height: 380, ticks: false, title: 'winding the line $1+it$ onto the unit circle' });
        const R = v.stage({
          x: [-0.16, T0 + 0.16], y: [-0.16, 1.2], height: 380, minWidth: 250,
          xticks: [[0, '0'], [T0 / 2, 'π/4'], [T0, 'π/2']], yticks: [0.5, 1],
          title: "proof step: $\\cos t = u'$ on $[0,\\pi/2]$",
        });
        const S_NEG = PI0, S_POS = 3 * PI0; // the coloured piece of the line: −π ≤ t ≤ 3π
        const fracOf = (t) => (t < 5 ? t / 5 : t < 7 ? 1 : t < 10 ? 1 - (t - 7) / 3 : 0);
        const wrap = v.slider('wound fraction', 0, 1, 0.75, { step: 0.01, onChange: (x) => { v.t = 5 * x; } });
        const w = L.handle(Math.cos(2.2), Math.sin(2.2), { color: 'accent', label: 'w', constrain: (x, y) => { const r = Math.hypot(x, y) || 1; return [x / r, y / r]; } });
        // Where the point with parameter s sits when −sn ≤ t ≤ sp has been wound onto the circle:
        // on the circle at e^{is}, or on the straight tail tangent at e^{±i·(wound length)}. Returns [x, y, nx, ny] (n = outward normal).
        const place = (s, sp, sn) => {
          if (s >= -sn && s <= sp) { const c = Math.cos(s), si = Math.sin(s); return [c, si, c, si]; }
          const a = s > sp ? sp : -sn, d = s - a, c = Math.cos(a), si = Math.sin(a);
          return [c - d * si, si + d * c, c, si];
        };
        const TICKS = [[-2, '-\\pi'], [-1, '-\\tfrac{\\pi}{2}'], [0, '0'], [1, '\\tfrac{\\pi}{2}'], [2, '\\pi'], [3, '\\tfrac{3\\pi}{2}'], [4, '2\\pi'], [5, '\\tfrac{5\\pi}{2}'], [6, '3\\pi']];
        const QUAD = ['I', 'II', 'III', 'IV'];
        let st = null;
        v.legend([['teal', '$-\\pi\\le t<0$'], ['blue', '$0\\le t<2\\pi$'], ['purple', '$2\\pi\\le t\\le 3\\pi$'], ['gold', 'preimages $t+2\\pi k$ of $w$', { dot: true }]]);
        v.animate((time) => {
          const fr = fracOf(time);
          if (Math.abs(wrap.value - fr) > 1e-9) wrap.value = fr;
          const sp = fr * S_POS, sn = fr * S_NEG;
          // ---- the proof: rotate w into the closed first quadrant, then solve cos t* = u'
          let a = w.x, b = w.y, m = 0;
          if (b < 0) { a = -a; b = -b; m = 2; }
          if (a < 0) { const na = b; b = -a; a = na; m += 1; }
          a = v.M.clamp(a, 0, 1);
          let lo = 0, hi = T0;
          for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (cosSer(mid) > a) lo = mid; else hi = mid; }
          const tStar = (lo + hi) / 2, tPrin = tStar + m * T0;
          // ---- left: circle, the partly wound line, ticks, preimages
          L.circle(0, 0, 1, { color: 'faint', width: 1.4, dash: [4, 4] });
          const P = (s) => place(s, sp, sn);
          L.curve(P, S_POS, S_POS + 9, { color: 'faint', width: 2, n: 60 });
          L.curve(P, -S_NEG - 9, -S_NEG, { color: 'faint', width: 2, n: 60 });
          // straight tails first, then the wound pieces: the first turn (blue) thick underneath, later layers thinner on top
          const SEG = [[0, TWO_PI, 'blue', 6], [-S_NEG, 0, 'teal', 3], [TWO_PI, S_POS, 'purple', 3]];
          for (const [s0, s1, col] of SEG) {
            if (s1 > sp) L.curve(P, Math.max(s0, sp), s1, { color: col, width: 3.4, n: 120 });
            if (s0 < -sn) L.curve(P, s0, Math.min(s1, -sn), { color: col, width: 3.4, n: 120 });
          }
          for (const [s0, s1, col, wd] of SEG) { const a0 = Math.max(s0, -sn), a1 = Math.min(s1, sp); if (a1 > a0) L.curve(P, a0, a1, { color: col, width: wd, n: 240 }); }
          for (const [k, lab] of TICKS) {
            const s = k * T0, [x, y, nx, ny] = P(s);
            L.line(x - 0.08 * nx, y - 0.08 * ny, x + 0.08 * nx, y + 0.08 * ny, { color: 'ink', width: 1.6 });
            const first = s >= 0 && s < TWO_PI - 1e-9, wound = s >= -sn && s <= sp;
            const out = first || !wound ? 1 : -1; // on the circle, later turns are labelled inside; tails always outside
            L.tex(lab, x + out * 0.27 * nx, y + out * 0.27 * ny, { color: first ? 'ink' : 'muted', size: 13 });
          }
          for (const k of [-1, 0, 1]) {
            const s = tPrin + k * TWO_PI;
            if (s < -S_NEG || s > S_POS) continue;
            const [x, y] = P(s);
            L.circle(x, y, 11 / L.scale, { color: 'gold', width: 2.6 });
            L.dot(x, y, { color: 'gold', r: 4.5 });
          }
          L.corner(`wound: ${v.fix(-sn, 2)} ≤ t ≤ ${v.fix(sp, 2)}`, 'tl', { color: 'ink', weight: 600 });
          // ---- right: the intermediate value step
          R.fn(sinSer, { domain: [0, T0], color: 'purple', width: 1.6, alpha: 0.55 });
          R.fn(cosSer, { domain: [0, T0], color: 'blue', width: 2.8 });
          R.hline(a, { color: 'orange', width: 1.4, dash: [5, 4] });
          R.line(tStar, 0, tStar, Math.max(a, b), { color: 'green', width: 1.2, dash: [2, 3] });
          R.dot(tStar, b, { color: 'purple', r: 4 });
          R.dot(tStar, a, { color: 'green', r: 6 });
          R.tex("u'", R.bounds.x[1], a, { color: 'orange', align: 'right', dx: -6, dy: -11, size: 14 });
          R.tex('t^*', tStar, a, { color: 'green', align: 'left', dx: 8, dy: -12, size: 14 });
          R.tex('\\cos', 0.12, cosSer(0.12), { color: 'blue', dy: 14, align: 'left' });
          R.tex('\\sin', T0 * 0.18, sinSer(T0 * 0.18), { color: 'purple', dy: -12, align: 'left' });
          const q = w.y >= 0 ? (w.x >= 0 ? 0 : 1) : (w.x < 0 ? 2 : 3);
          const how = ['already there', 'use −i·w', 'use −w', 'use −i·(−w)'][m];
          R.corner(`w in quadrant ${QUAD[q]}: ${how}`, 'tr', { color: 'ink', size: 11.5, weight: 600 });
          st = { m, a, b, tStar, tPrin, sp, sn };
        }, { period: 11, autoplay: false });
        v.t = 5 * 0.75;
        v.readout(() => {
          if (!st) return '';
          const { m, a, b, tStar, tPrin } = st;
          const e = { re: cosSer(tPrin), im: sinSer(tPrin) };
          return `$w = ${cnum({ re: w.x, im: w.y }, 3)}$, $\\;w' = (-i)^{${m}}w = ${cnum({ re: a, im: b }, 3)}$; $\\;\\cos t^* = u'$ gives $t^* = ${num(tStar, 4)}$, so `
            + `$t = t^* + ${m}\\cdot\\tfrac{\\pi}{2} = ${num(tPrin, 5)}$ and $e^{it} = ${cnum(e, 4)} = w$. All preimages: $t + 2\\pi k$, $k\\in\\Z$.`;
        });
      },
    },

    /* ------------------------------------------------------------------ 0.8 */
    {
      num: '0.8',
      kind: 'Theorem',
      name: 'Every nonzero complex number is an exponential',
      statement: String.raw`If $w\in\C$ and $w\neq0$, then $w=e^{z}$ for some $z\in\C$. Thus $\exp$ maps $\C$ onto $\C\setminus\{0\}$.`,
      idea: String.raw`Write $w=|w|\,\alpha$ with $|\alpha|=1$. By 0.7, $\alpha=e^{it}$ for some real $t$. By 0.4 the continuous increasing function $x\mapsto e^x$ has range $(0,\infty)$, so $|w|=e^x$ for some real $x$. Then $w=e^xe^{it}=e^{x+it}$ by 0.1. By 0.5 the solutions of $e^z=w$ are exactly $x+i(t+2\pi k)$, $k\in\Z$: a logarithm of $w$ exists but is determined only up to $2\pi i\Z$.`,
      caption: String.raw`Drag $w$ anywhere except $0$. Vertical lines $\Re z=$ const go to circles and horizontal lines $\Im z=$ const to rays, so the shaded strip $-\pi<\Im z\le\pi$ already covers $\C\setminus\{0\}$ once. The gold trail follows one solution continuously: carry $w$ once around $0$ and it climbs by $2\pi i$; push $w$ towards $0$ and the whole column runs off to the left.`,
      deps: ['rca-0.1', 'rca-0.4', 'rca-0.5', 'rca-0.7'],
      see: ['pma-8.7', 'rca-13.11'],
      tags: ['exponential', 'logarithm'],
      verify: true,
      viz(v) {
        const Z = v.stage({ x: [-2.9, 2.1], y: [-4.7, 8.2], equal: true, height: 545, weight: 0.75, minWidth: 240, title: '$z$-plane: all solutions of $e^z=w$' });
        const W = v.stage({ x: [-4.9, 4.9], y: [-4.9, 4.9], equal: true, height: 443, weight: 1.25, title: '$w$-plane: $w=e^z$' });
        const XS = [-2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5];
        // a seeded trail: w travels once counter-clockwise around 0
        const rr = (s) => 1.5 + 0.8 * Math.sin(0.9 * s - 0.9);
        let trailW = [], trailZ = [];
        for (let i = 0; i <= 160; i++) { const s = -2.6 + 7.0 * i / 160, r = rr(s); trailW.push([r * Math.cos(s), r * Math.sin(s)]); trailZ.push([Math.log(r), s]); }
        let branch = trailZ[trailZ.length - 1].slice();
        const w0 = trailW[trailW.length - 1];
        const wh = W.handle(w0[0], w0[1], {
          color: 'accent', label: 'w',
          constrain: (x, y) => { const r = Math.hypot(x, y); if (r >= 0.07) return [x, y]; return r > 0 ? [0.07 * x / r, 0.07 * y / r] : [0.07, 0]; },
        });
        const principal = () => [Math.log(Math.hypot(wh.x, wh.y)), Math.atan2(wh.y, wh.x)];
        wh.onDrag = () => {
          const [x, t] = principal();
          const k = Math.round((branch[1] - t) / TWO_PI);
          branch = [x, t + k * TWO_PI];
          trailW.push([wh.x, wh.y]); trailZ.push(branch.slice());
          if (trailW.length > 900) { trailW.shift(); trailZ.shift(); }
        };
        v.button('clear trail', () => { trailW = [[wh.x, wh.y]]; trailZ = [branch.slice()]; });
        let st = null;
        v.legend([['teal', '$\\Re z=$ const $\\mapsto$ circles'], ['purple', '$\\Im z=$ const $\\mapsto$ rays'], ['accent', 'solutions of $e^z=w$', { dot: true }], ['gold', 'one solution followed continuously']]);
        v.render(() => {
          const [x, t] = principal();
          // keep the followed branch in view by shifting the z-window by whole periods
          let [y0, y1] = Z.view.y;
          while (branch[1] > y1 - 0.6) { y0 += TWO_PI; y1 += TWO_PI; }
          while (branch[1] < y0 + 0.6) { y0 -= TWO_PI; y1 -= TWO_PI; }
          Z.setView(null, [y0, y1]);
          const by = Z.bounds.y;
          // ---- z-plane grid, fundamental strip
          Z.rect(Z.bounds.x[0], -PI0, Z.bounds.x[1], PI0, { fill: 'blue', fillAlpha: 0.07, stroke: false });
          for (const yy of [-PI0, PI0]) Z.hline(yy, { color: 'blue', width: 1, dash: [5, 4], alpha: 0.6 });
          for (const xk of XS) Z.line(xk, by[0], xk, by[1], { color: xk === 0 ? 'ink' : 'teal', width: xk === 0 ? 1.6 : 1.2, alpha: xk === 0 ? 0.75 : 0.5 });
          const j0 = Math.ceil(by[0] / (T0 / 3)), j1 = Math.floor(by[1] / (T0 / 3));
          for (let j = j0; j <= j1; j++) {
            const yy = j * T0 / 3, onAxis = j % 12 === 0;
            Z.line(Z.bounds.x[0], yy, Z.bounds.x[1], yy, { color: onAxis ? 'ink' : 'purple', width: onAxis ? 1.6 : 1, alpha: onAxis ? 0.75 : 0.42 });
          }
          Z.tex('\\pi i', Z.bounds.x[1], PI0, { color: 'blue', align: 'right', dx: -6, dy: -10, size: 12 });
          Z.tex('-\\pi i', Z.bounds.x[1], -PI0, { color: 'blue', align: 'right', dx: -6, dy: 10, size: 12 });
          // ---- w-plane images: circles and rays
          for (const xk of XS) W.circle(0, 0, Math.exp(xk), { color: xk === 0 ? 'ink' : 'teal', width: xk === 0 ? 1.6 : 1.2, alpha: xk === 0 ? 0.75 : 0.5 });
          for (let j = 0; j < 12; j++) {
            const th = j * T0 / 3, c = cosSer(th), s = sinSer(th);
            W.line(0, 0, 9 * c, 9 * s, { color: j === 0 ? 'ink' : 'purple', width: j === 0 ? 1.6 : 1, alpha: j === 0 ? 0.75 : 0.42 });
          }
          W.circle(0, 0, 6 / W.scale, { color: 'red', width: 2, fill: 'panel', fillAlpha: 1 });
          W.corner('red ring: 0 is never a value of exp', 'br', { color: 'red', weight: 600 });
          // ---- trails and the column of solutions
          W.path(trailW, { color: 'gold', width: 2.2, alpha: 0.85 });
          Z.path(trailZ, { color: 'gold', width: 2.2, alpha: 0.85 });
          const ks = [];
          for (let k = -4; k <= 4; k++) { const yy = t + k * TWO_PI; if (yy > by[0] && yy < by[1]) ks.push(yy); }
          for (const yy of ks) Z.dot(x, yy, { color: 'accent', r: 5 });
          if (ks.length >= 2) { const left = Math.abs(x - 0.5) > 0.25, mx = left ? x - 0.5 : x + 0.5; Z.measure(mx, ks[0], mx, ks[1], '2π', { color: 'ink', offset: left ? -14 : 14 }); }
          Z.dot(branch[0], branch[1], { color: 'gold', r: 7 });
          Z.text('z', branch[0], branch[1], { math: true, color: 'gold', dx: -12, dy: -10 });
          const xs = Z.bounds.x;
          if (x < xs[0] + 0.3) Z.corner('← Re z = log|w| → −∞ as w → 0', 'bl', { color: 'red', weight: 600 });
          st = { x, t, branch };
        });
        v.readout(() => {
          if (!st) return '';
          const { x, t, branch } = st;
          const k = Math.round((branch[1] - t) / TWO_PI);
          return `$w = ${cnum({ re: wh.x, im: wh.y }, 3)}$: $\\;|w| = e^{x}$ with $x = ${num(x, 4)}$, $\\;w/|w| = e^{it}$ with $t = ${num(t, 4)}$, so $w = e^{x+it}$ — and equally $e^{x+i(t+2\\pi k)}$ for every $k\\in\\Z$. `
            + `The gold solution is the one with $k = ${k}$: $z = ${cnum({ re: branch[0], im: branch[1] }, 4)}$.`;
        });
      },
    },
  ],
};
