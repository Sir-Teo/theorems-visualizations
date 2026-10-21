// Rudin, Principles of Mathematical Analysis — Chapter 3 (part 2 of the second half):
// ratio vs root, power series and the radius of convergence, summation by parts,
// Dirichlet/alternating tests, power series on the unit circle, absolute convergence (3.37–3.45).

const LN2 = Math.LN2;
const FACT = [1];
for (let k = 1; k <= 200; k++) FACT.push(FACT[k - 1] * k);

/** HSL → [r,g,b] (0–255). */
function hsl(h, s, l) {
  h = ((h % 1) + 1) % 1;
  const f = (n) => { const k = (n + h * 12) % 12; const a = s * Math.min(l, 1 - l); return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))); };
  return [f(0), f(8), f(4)];
}
/** Phase-portrait colour of w = re + i im (hue = arg, banded by log2 |w|). */
function phaseColor(re, im) {
  if (!isFinite(re) || !isFinite(im)) return [235, 235, 235];
  const m = Math.hypot(re, im);
  const t = Math.log2(m + 1e-300); const fr = t - Math.floor(t);
  return hsl(Math.atan2(im, re) / (2 * Math.PI), 0.62, 0.42 + 0.2 * Math.pow(fr, 0.7));
}
/** Sum of an alternating-type series sum_{n>=1} term(n), accelerated by repeated averaging of partial sums. */
function accelSum(term, K = 4000, depth = 24) {
  let s = 0; for (let n = 1; n <= K; n++) s += term(n);
  let row = [s]; for (let j = 1; j <= depth; j++) { s += term(K + j); row.push(s); }
  while (row.length > 1) row = row.slice(1).map((x, i) => (x + row[i]) / 2);
  return row[0];
}
const SUPS = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const sciTxt = (x) => { if (!isFinite(x)) return '∞'; const e = Math.floor(Math.log10(Math.abs(x))); if (e > -3 && e < 5) return (+x.toPrecision(3)).toString(); return (x / 10 ** e).toFixed(2) + '·10' + String(e).split('').map((c) => SUPS[c] ?? c).join(''); };
/** x as TeX: plain or scientific. */
function sci(x, d = 2) {
  if (x === 0) return '0';
  if (!isFinite(x)) return '\\infty';
  const e = Math.floor(Math.log10(Math.abs(x)));
  if (e >= -3 && e <= 4) return (+x.toPrecision(d + 2)).toString();
  return `${(x / 10 ** e).toFixed(d)}\\times10^{${e}}`;
}
const cplx = (z, d = 3) => `${z.re.toFixed(d)} ${z.im < 0 ? '-' : '+'} ${Math.abs(z.im).toFixed(d)}\\,i`;

export default {
  collection: 'pma',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.37
    {
      num: '3.37',
      kind: 'Theorem',
      name: 'The root test is stronger than the ratio test',
      statement: String.raw`For every sequence $\{c_n\}$ of positive numbers,
$$\liminf_{n\to\infty}\frac{c_{n+1}}{c_n}\;\le\;\liminf_{n\to\infty}\sqrt[n]{c_n},\qquad \limsup_{n\to\infty}\sqrt[n]{c_n}\;\le\;\limsup_{n\to\infty}\frac{c_{n+1}}{c_n}.$$`,
      idea: String.raw`Suppose $\limsup c_{n+1}/c_n<\beta$. Then $c_{n+1}\le\beta c_n$ from some $N$ on, so $c_{N+p}\le\beta^{p}c_N$ and $\sqrt[n]{c_n}\le(c_N\beta^{-N})^{1/n}\,\beta$ for $n\ge N$. Since $a^{1/n}\to1$ for every $a>0$ (3.20), $\limsup\sqrt[n]{c_n}\le\beta$; let $\beta$ decrease to the $\limsup$ of the ratios. The $\liminf$ inequality is the mirror image. Intuitively, $\log\sqrt[n]{c_n}$ is (up to a vanishing term) the *average* of the $\log$-ratios, and an average cannot oscillate more than the numbers being averaged.`,
      caption: String.raw`Choose a sequence. Orange dots are ratios $c_{n+1}/c_n$, blue dots are roots $c_n^{1/n}$, on a logarithmic scale. The gauges at the right show the limiting ranges: the blue $[\liminf,\limsup]$ of the roots always sits inside the orange range of the ratios. In Rudin's two examples from 3.35 the ratios never settle, while the roots converge ($\frac12,1,\frac18,\frac14,\dots$) or nearly do ($\frac12,\frac13,\frac1{2^2},\frac1{3^2},\dots$); for random ratios the roots converge to their geometric mean. Press “Resample” for a new random sequence.`,
      deps: ['pma-3.17', 'pma-3.20'],
      see: ['pma-3.33', 'pma-3.34'],
      verify: true,
      tags: ['limsup', 'convergence tests'],
      viz(v) {
        const NMAX = 80;
        let seed = 7;
        const A = 0.25, B = 1.75, GM = Math.exp((B * Math.log(B) - A * Math.log(A)) / (B - A) - 1);
        let logU = [];
        const reseed = () => { const r = v.rng(seed); logU = Array.from({ length: NMAX + 2 }, () => Math.log(A + (B - A) * r())); };
        reseed();
        const SEQ = {
          a: { label: 'Rudin 3.35: $\\frac12,1,\\frac18,\\frac14,\\frac1{32},\\ldots$', lc: (n) => (-n + 1 + (n % 2 ? -1 : 1)) * LN2, rat: [1 / 8, 2], root: [0.5, 0.5] },
          b: { label: 'Rudin 3.35: $\\frac12,\\frac13,\\frac1{2^2},\\frac1{3^2},\\ldots$', lc: (n) => (n % 2 ? -((n + 1) / 2) * LN2 : -(n / 2) * Math.log(3)), rat: [0, Infinity], root: [1 / Math.sqrt(3), Math.SQRT1_2] },
          smooth: { label: '$c_n=n^2/3^n$', lc: (n) => 2 * Math.log(n) - n * Math.log(3), rat: [1 / 3, 1 / 3], root: [1 / 3, 1 / 3] },
          rand: { label: 'random ratios in $[\\frac14,\\frac74]$', lc: (n) => { let s = 0; for (let k = 1; k < n; k++) s += logU[k]; return s; }, rat: [A, B], root: [GM, GM] },
        };
        const which = v.select('', Object.entries(SEQ).map(([value, o]) => ({ value, label: o.label })), 'a');
        v.button('Resample', () => { seed = (seed * 7919 + 13) % 100003; reseed(); which.set('rand'); });
        const YL = -4.6, YH = 2.6;
        const S = v.stage({ x: [-7, 101], y: [YL, YH], height: 360, axes: 'box', full: true, xlabel: 'n', xticks: [1, 20, 40, 60, 80],
          yticks: [[-4, '1/16'], [-3, '1/8'], [-2, '1/4'], [-1, '1/2'], [0, '1'], [1, '2'], [2, '4']],
          title: 'ratios $c_{n+1}/c_n$ and roots $\\sqrt[n]{c_n}$ (log scale); gauges: their limiting ranges' });
        v.legend([['orange', 'ratio $c_{n+1}/c_n$', { dot: true }], ['accent', 'root $\\sqrt[n]{c_n}$', { dot: true }], ['orange', '$[\\liminf,\\limsup]$ of ratios', { area: true }], ['accent', '$[\\liminf,\\limsup]$ of roots', { area: true }]]);
        const L2 = (x) => Math.log2(x);
        let state = null;
        v.render(() => {
          const Q = SEQ[which.value];
          const lc = Array.from({ length: NMAX + 2 }, (_, n) => (n ? Q.lc(n) : 0));
          S.vband(84, 101, { color: 'grid', alpha: 0.5 });
          // the four limiting values as faint guide lines
          for (const [val, col] of [[Q.rat[0], 'orange'], [Q.rat[1], 'orange'], [Q.root[0], 'accent'], [Q.root[1], 'accent']]) {
            if (val > 0 && isFinite(val) && L2(val) > YL && L2(val) < YH) S.line(0, L2(val), 97, L2(val), { color: col, width: 1, dash: [3, 4], alpha: 0.55 });
          }
          const rat = [], up = [], dn = [], roots = [];
          for (let n = 1; n <= NMAX; n++) {
            const lr = (lc[n + 1] - lc[n]) / LN2;
            if (lr > YH - 0.05) up.push(n); else if (lr < YL + 0.05) dn.push(n); else rat.push([n, lr]);
            roots.push([n, lc[n] / (n * LN2)]);
          }
          S.dots(rat, { color: 'orange', r: 3.2 });
          for (const n of up) S.arrow(n, YH - 0.45, n, YH - 0.05, { color: 'orange', head: 6, width: 1.4 });
          for (const n of dn) S.arrow(n, YL + 0.45, n, YL + 0.05, { color: 'orange', head: 6, width: 1.4 });
          S.path(roots, { color: 'accent', width: 1.2, alpha: 0.5 });
          S.dots(roots, { color: 'accent', r: 3.2 });
          // gauges
          const clip = (x) => (x <= 0 ? YL : !isFinite(x) ? YH : v.M.clamp(L2(x), YL, YH));
          const r0 = clip(Q.rat[0]), r1 = clip(Q.rat[1]), q0 = clip(Q.root[0]), q1 = clip(Q.root[1]);
          S.line(88.5, r0, 88.5, r1, { color: 'orange', width: 9, cap: 'butt', alpha: 0.85 });
          if (Q.rat[0] <= 0) S.arrow(88.5, r0 + 0.3, 88.5, YL + 0.02, { color: 'orange', head: 8, width: 2 });
          if (!isFinite(Q.rat[1])) S.arrow(88.5, r1 - 0.3, 88.5, YH - 0.02, { color: 'orange', head: 8, width: 2 });
          if (Math.abs(r1 - r0) < 0.02) S.dot(88.5, r0, { color: 'orange', r: 6 });
          if (Math.abs(q1 - q0) < 0.02) S.dot(94.5, q0, { color: 'accent', r: 6 });
          else S.line(94.5, q0, 94.5, q1, { color: 'accent', width: 9, cap: 'butt', alpha: 0.9 });
          S.text('ratios', 88.5, YL, { dy: -8, align: 'center', baseline: 'bottom', size: 11, color: 'orange', weight: 600 });
          S.text('roots', 94.5, YL, { dy: -8, align: 'center', baseline: 'bottom', size: 11, color: 'accent', weight: 600 });
          state = Q;
        });
        const f = (x) => (x === 0 ? '0' : !isFinite(x) ? '\\infty' : x === Math.SQRT1_2 ? '1/\\sqrt2' : Math.abs(x - 1 / Math.sqrt(3)) < 1e-12 ? '1/\\sqrt3' : Math.abs(x - 1 / 3) < 1e-12 ? '1/3' : Math.abs(x - 0.125) < 1e-12 ? '1/8' : v.fmt(x, 3));
        v.readout(() => {
          const Q = state; if (!Q) return '';
          return `$\\liminf\\frac{c_{n+1}}{c_n}=${f(Q.rat[0])}\\;\\le\\;\\liminf\\sqrt[n]{c_n}=${f(Q.root[0])}\\;\\le\\;\\limsup\\sqrt[n]{c_n}=${f(Q.root[1])}\\;\\le\\;\\limsup\\frac{c_{n+1}}{c_n}=${f(Q.rat[1])}$` + (which.value === 'rand' ? ' (limits of the random model; the roots tend to the geometric mean of the ratio distribution).' : '');
        });
      },
    },

    // ------------------------------------------------------------------ 3.38
    {
      num: '3.38',
      kind: 'Definition',
      name: 'Power series',
      statement: String.raw`Given a sequence $\{c_n\}$ of complex numbers, the series $$\sum_{n=0}^{\infty}c_n z^{n}$$ is called a *power series*; the $c_n$ are its *coefficients* and $z$ is a complex number. Whether it converges depends on $z$; every power series converges at $z=0$.`,
      idea: String.raw`A power series is a sequence of polynomials $S_N(z)=\sum_{n\le N}c_nz^n$, and the question is for which $z$ the values $S_N(z)$ converge. The answer (3.39) is always a disc, whose radius is read off from the coefficients by the root test.`,
      deps: ['pma-3.21'],
      see: ['rca-10.5'],
      tags: ['power series'],
    },

    // ------------------------------------------------------------------ 3.39
    {
      num: '3.39',
      kind: 'Theorem',
      name: 'Radius of convergence (Cauchy–Hadamard)',
      credit: 'Cauchy & Hadamard, 1821',
      statement: String.raw`Given the power series $\sum c_nz^n$, put $$\alpha=\limsup_{n\to\infty}\sqrt[n]{|c_n|},\qquad R=\frac1\alpha,$$ with $R=+\infty$ if $\alpha=0$ and $R=0$ if $\alpha=+\infty$. Then $\sum c_nz^n$ converges if $|z|<R$ and diverges if $|z|>R$. $R$ is the *radius of convergence*.`,
      idea: String.raw`Apply the root test (3.33) to the terms $c_nz^n$: $\limsup\sqrt[n]{|c_nz^n|}=|z|\,\alpha=|z|/R$, which is $<1$ inside the circle and $>1$ outside. Nothing is claimed on the circle $|z|=R$ itself — there the behaviour varies from point to point (3.44).`,
      caption: String.raw`Choose a series and drag $z$. Left: a phase portrait of the partial sum $S_N(z)$ (hue = argument); inside the green circle $|z|=R$ it settles to the phase portrait of the limit, while outside it is dominated by its top term. The zeros of $S_N$ (where all colours meet) crowd onto the circle as $N$ grows. Right: the partial sums $S_0(z),S_1(z),\dots$ spiral into $f(z)$ (green ring) for $|z|<R$ and run away for $|z|>R$. Bottom: the root test at work — the dots $|c_n|^{1/n}$ must eventually stay below the gold level $1/|z|$.`,
      deps: ['pma-3.38', 'pma-3.33'],
      see: ['pma-8.1', 'rca-10.6'],
      tags: ['power series', 'convergence tests'],
      viz(v) {
        const { Cx } = v.M;
        const one = new Cx(1, 0);
        const SER = {
          geo: { label: '$\\sum z^n$', c: () => 1, R: 1, f: (z) => one.div(one.sub(z)) },
          log: { label: '$\\sum \\frac{z^n}{n}$', c: (n) => (n ? 1 / n : 0), R: 1, f: (z) => one.sub(z).log().neg() },
          exp: { label: '$\\sum \\frac{z^n}{n!}$', c: (n) => 1 / FACT[n], R: Infinity, f: (z) => z.exp() },
          half: { label: '$\\sum n\\left(\\frac z2\\right)^{n}$', c: (n) => n / 2 ** n, R: 2, f: (z) => { const w = z.scale(0.5); return w.div(one.sub(w).mul(one.sub(w))); } },
          lac: { label: '$c_{2k}=4^k,\\ c_{2k+1}=1$', c: (n) => (n % 2 ? 1 : 2 ** n), R: 0.5, f: (z) => one.div(one.sub(z.mul(z).scale(4))).add(z.div(one.sub(z.mul(z)))) },
          fac: { label: '$\\sum n!\\,z^n$', c: (n) => FACT[n], R: 0, f: null },
        };
        const which = v.select('', Object.entries(SER).map(([value, o]) => ({ value, label: o.label })), 'geo');
        const NS = v.slider('$N$ (terms)', 4, 80, 30, { int: true });
        const Z = v.stage({ x: [-2.2, 2.2], y: [-2.2, 2.2], equal: true, height: 340, weight: 1.1, title: '$z$-plane: phase portrait of $S_N(z)=\\sum_{n\\le N}c_nz^n$' });
        const P = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, height: 340, weight: 1, title: 'the partial sums $S_0(z), S_1(z), \\dots, S_N(z)$' });
        const T = v.stage({ x: [-3, 83], y: [0, 3.2], height: 170, axes: 'box', full: true, xlabel: 'n', xticks: [1, 20, 40, 60, 80], title: 'root test: $\\sqrt[n]{|c_n|}$ against $1/|z|$' });
        const zH = Z.handle(0.62, 0.48, { color: 'ink', label: 'z' });
        v.legend([['green', 'circle $|z|=R$', { dash: true }], ['gold', 'partial sums / level $1/|z|$'], ['green', '$f(z)=\\lim S_N(z)$', { dot: true }], ['accent', '$\\sqrt[n]{|c_n|}$', { dot: true }]]);
        let state = null;
        v.render(() => {
          const key = which.value, Sx = SER[key], N = NS.value;
          const c = Array.from({ length: N + 1 }, (_, n) => Sx.c(n));
          Z.raster((x, y) => {
            let re = c[N], im = 0;
            for (let n = N - 1; n >= 0; n--) { const r2 = re * x - im * y + c[n]; im = re * y + im * x; re = r2; }
            return phaseColor(re, im);
          }, { res: 2, key: key + ':' + N });
          const R = Sx.R;
          if (R > 0 && isFinite(R)) {
            Z.circle(0, 0, R, { color: 'panel', width: 5, alpha: 0.85 });
            Z.circle(0, 0, R, { color: 'green', width: 2.4, dash: [7, 5] });
            Z.tex(`R=${R}`, R * Math.SQRT1_2, -R * Math.SQRT1_2, { color: 'ink', align: 'left', baseline: 'top', dx: 6, dy: 4, size: 14 });
          } else if (R === 0) Z.dot(0, 0, { color: 'green', r: 5, label: 'R = 0', labelPos: 'se' });
          // partial sums at z
          const z = new Cx(zH.x, zH.y), az = z.abs();
          const pts = [[0, 0]]; let S = new Cx(0, 0), zn = new Cx(1, 0);
          for (let n = 0; n <= N; n++) { S = S.add(zn.scale(c[n])); pts.push([S.re, S.im]); zn = zn.mul(z); }
          const inside = az < R - 1e-9, outside = az > R + 1e-9;
          const fz = inside && Sx.f ? Sx.f(z) : null;
          let xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
          if (fz) { xs.push(fz.re); ys.push(fz.im); }
          const cx0 = (Math.min(...xs) + Math.max(...xs)) / 2, cy0 = (Math.min(...ys) + Math.max(...ys)) / 2;
          const half = Math.max(1.2, (Math.max(...xs) - Math.min(...xs)) * 0.62, (Math.max(...ys) - Math.min(...ys)) * 0.62);
          P.setView([cx0 - half, cx0 + half], [cy0 - half, cy0 + half]);
          P.path(pts, { color: 'gold', width: 1.8 });
          P.dots(pts.slice(1), { color: 'gold', r: 2.6 });
          if (fz) P.dot(fz.re, fz.im, { color: 'green', r: 8, hollow: true, width: 2.6, label: 'f(z)', tex: true, labelPos: 'ne' });
          P.dot(S.re, S.im, { color: 'gold', r: 5, label: 'S_N', tex: true, labelPos: 'sw' });
          P.corner(inside ? '|z| < R: converges' : outside ? `|z| > R: |Sₙ| = ${sciTxt(S.abs())}, diverges` : '|z| = R: undecided by 3.39', 'tl', { color: inside ? 'green' : outside ? 'red' : 'muted', weight: 600 });
          // root test panel
          const roots = [];
          for (let n = 1; n <= 80; n++) { const cn = Math.abs(Sx.c(n)); if (cn > 0) roots.push([n, Math.pow(cn, 1 / n)]); }
          const alpha = R === 0 ? Infinity : 1 / R;
          const inv = az > 1e-6 ? 1 / az : Infinity;
          const YT = Math.min(3.2, Math.max(1.3, (isFinite(alpha) ? alpha : 0) * 1.45, Math.min(inv, 3) * 1.12, ...roots.map((p) => Math.min(p[1], 3.2) * 1.05)));
          T.setView(null, [0, YT]);
          if (isFinite(alpha)) { T.hline(alpha, { color: 'green', width: 1.6, dash: true }); T.tex(`\\alpha=${v.fmt(alpha, 3)}`, 30, alpha, { baseline: 'top', dy: 4, color: 'green', size: 13 }); }
          else T.corner('α = ∞: the roots are unbounded', 'tl', { color: 'red', weight: 600 });
          if (inv < YT) { T.hline(inv, { color: 'gold', width: 2 }); T.tex('1/|z|', 82, inv, { align: 'right', baseline: 'bottom', dy: -2, color: 'gold', size: 13 }); }
          else T.corner('1/|z| is above the panel', 'tr', { color: 'gold' });
          const vis = roots.filter((p) => p[1] <= YT * 0.985), off = roots.filter((p) => p[1] > YT * 0.985);
          T.dots(vis, { color: 'accent', r: 2.6 });
          for (const p of off) T.arrow(p[0], YT * 0.86, p[0], YT * 0.985, { color: 'accent', head: 5, width: 1.2 });
          state = { R, az, S, fz, inside, outside, alpha, N };
        });
        v.readout(() => {
          const s = state; if (!s) return '';
          const Rt = s.R === Infinity ? '\\infty' : s.R;
          const head = `$\\alpha=\\limsup\\sqrt[n]{|c_n|}=${isFinite(s.alpha) ? v.fmt(s.alpha, 3) : '\\infty'}$, $\\;R=${Rt}$, $\\;|z|=${v.fix(s.az, 3)}$: `;
          if (s.inside) return head + `$\\limsup\\sqrt[n]{|c_nz^n|}=|z|/R=${v.fix(s.az / s.R, 3)}<1$, so the series converges` + (s.fz ? `; $\\;S_{${s.N}}(z)=${cplx(s.S)}$, $\\;f(z)=${cplx(s.fz)}$.` : '.');
          if (s.outside) return head + `$|z|/R=${s.R === 0 ? '\\infty' : v.fix(s.az / s.R, 3)}>1$, so $|c_nz^n|>1$ infinitely often and the series diverges.`;
          return head + 'on the circle the theorem is silent.';
        });
      },
    },

    // ------------------------------------------------------------------ 3.41
    {
      num: '3.41',
      kind: 'Theorem',
      name: 'Summation by parts',
      credit: 'Abel, 1826',
      statement: String.raw`Let $\{a_n\}$, $\{b_n\}$ be sequences, put $A_n=\sum_{k=0}^{n}a_k$ for $n\ge0$ and $A_{-1}=0$. Then for $0\le p\le q$,
$$\sum_{n=p}^{q}a_nb_n=\sum_{n=p}^{q-1}A_n\,(b_n-b_{n+1})\;+\;A_qb_q-A_{p-1}b_p .$$`,
      idea: String.raw`Write $a_n=A_n-A_{n-1}$, split the sum into $\sum A_nb_n-\sum A_{n-1}b_n$, shift the index in the second sum, and collect the coefficient of each $A_n$. It is the discrete analogue of integration by parts: differences of $A$ against $b$ become $A$ against differences of $b$, plus boundary terms.`,
      caption: String.raw`Drag the corners $(A_n,b_n)$ (here $p=0$, $q=5$, all $a_n>0$). Left: the staircase region cut into **columns** of width $a_n$ and height $b_n$ — total area $\sum a_nb_n$. Right: the same region cut into **rows** of height $b_n-b_{n+1}$ and length $A_n$, plus the bottom slab $A_qb_q$. If you make $b$ increase somewhere, that row counts negatively (red) — the identity holds anyway.`,
      deps: ['pma-3.21'],
      tags: ['series', 'summation by parts'],
      viz(v) {
        const M = v.M, Q = 5;
        const L = v.stage({ x: [-0.75, 6.4], y: [-0.42, 3.35], height: 340, axes: false, title: 'columns: $\\sum_{n=0}^{q} a_n b_n$' });
        const Rr = v.stage({ x: [-0.75, 6.4], y: [-0.42, 3.35], height: 340, axes: false, title: 'rows: $\\sum_{n=0}^{q-1} A_n(b_n-b_{n+1}) + A_q b_q$' });
        const init = [[0.9, 2.95], [1.75, 2.35], [2.55, 1.95], [3.7, 1.25], [4.45, 0.95], [5.75, 0.5]];
        const H = [];
        init.forEach(([x, y], n) => H.push(L.handle(x, y, { color: 'accent', r: 6.5, constrain: (xx, yy) => { const lo = n ? H[n - 1].x + 0.1 : 0.1; const hi = n < Q ? H[n + 1].x - 0.1 : 6.25; return [M.clamp(xx, lo, hi), M.clamp(yy, 0.08, 3.25)]; } })));
        v.legend([['accent', 'column $a_nb_n$', { area: true }], ['orange', 'row $A_n(b_n-b_{n+1})>0$', { area: true }], ['red', 'row with $b_{n+1}>b_n$ (counts negatively)', { area: true }], ['green', 'bottom slab $A_qb_q$', { area: true }]]);
        const axes = (S) => { S.line(0, 0, 6.35, 0, { color: 'faint', width: 1.2 }); S.line(0, 0, 0, 3.3, { color: 'faint', width: 1.2 }); };
        let state = null;
        v.render(() => {
          const A = H.map((h) => h.x), b = H.map((h) => h.y);
          const a = A.map((x, n) => x - (n ? A[n - 1] : 0));
          const stair = [[0, 0]];
          for (let n = 0; n <= Q; n++) stair.push([n ? A[n - 1] : 0, b[n]], [A[n], b[n]]);
          stair.push([A[Q], 0]);
          // columns
          axes(L);
          let colSum = 0;
          for (let n = 0; n <= Q; n++) {
            const x0 = n ? A[n - 1] : 0;
            L.rect(x0, 0, A[n], b[n], { fill: n % 2 ? 'teal' : 'accent', fillAlpha: 0.38, color: n % 2 ? 'teal' : 'accent', width: 1 });
            colSum += a[n] * b[n];
            if (L.X(A[n]) - L.X(x0) > 26) L.tex(`a_{${n}}b_{${n}}`, (x0 + A[n]) / 2, b[n] / 2, { size: 13 });
            L.tex(`A_{${n}}`, A[n], 0, { baseline: 'top', dy: 5, size: 13, color: 'muted' });
          }
          L.path(stair, { color: 'ink', width: 1.8 });
          // rows
          axes(Rr);
          let rowSum = 0;
          for (let n = 0; n < Q; n++) {
            const d = b[n] - b[n + 1];
            rowSum += A[n] * d;
            const lo = Math.min(b[n], b[n + 1]), hi = Math.max(b[n], b[n + 1]);
            Rr.rect(0, lo, A[n], hi, { fill: d >= 0 ? (n % 2 ? 'gold' : 'orange') : 'red', fillAlpha: d >= 0 ? 0.4 : 0.32, color: d >= 0 ? 'orange' : 'red', width: 1 });
            if (Rr.Y(lo) - Rr.Y(hi) > 15 && Rr.X(A[n]) - Rr.X(0) > 96) Rr.tex(`A_{${n}}(b_{${n}}-b_{${n + 1}})`, A[n] / 2, (lo + hi) / 2, { size: 12.5, color: d >= 0 ? 'ink' : 'red' });
          }
          rowSum += A[Q] * b[Q];
          Rr.rect(0, 0, A[Q], b[Q], { fill: 'green', fillAlpha: 0.35, color: 'green', width: 1 });
          if (Rr.Y(0) - Rr.Y(b[Q]) > 15) Rr.tex(`A_{${Q}}b_{${Q}}`, A[Q] / 2, b[Q] / 2, { size: 13 });
          Rr.path(stair, { color: 'ink', width: 1.6, dash: [5, 4] });
          for (let n = 0; n <= Q; n++) { Rr.line(-0.06, b[n], 0.06, b[n], { color: 'muted', width: 1.2 }); Rr.tex(`b_{${n}}`, 0, b[n], { align: 'right', dx: -7, size: 13, color: 'muted' }); }
          state = { colSum, rowSum };
        });
        v.readout(() => {
          const s = state; if (!s) return '';
          return `columns: $\\sum_{n=0}^{5}a_nb_n=${s.colSum.toFixed(5)}$ $\\qquad$ rows: $\\sum_{n=0}^{4}A_n(b_n-b_{n+1})+A_5b_5=${s.rowSum.toFixed(5)}$ $\\;$ (here $p=0$, so $A_{p-1}b_p=0$).`;
        });
      },
    },

    // ------------------------------------------------------------------ 3.42
    {
      num: '3.42',
      kind: 'Theorem',
      name: "Dirichlet's test",
      credit: 'Dirichlet, 1862',
      statement: String.raw`Suppose
(a) the partial sums $A_n$ of $\sum a_n$ form a bounded sequence;
(b) $b_0\ge b_1\ge b_2\ge\cdots$;
(c) $\lim_{n\to\infty}b_n=0$.
Then $\sum a_nb_n$ converges.`,
      idea: String.raw`If $|A_n|\le M$, summation by parts (3.41) gives, for $q\ge p$, $$\Bigl|\sum_{n=p}^{q}a_nb_n\Bigr|\le M\sum_{n=p}^{q-1}(b_n-b_{n+1})+Mb_q+Mb_p=2Mb_p,$$ using that $b_n-b_{n+1}\ge0$. Since $b_p\to0$, the Cauchy criterion (3.22) holds.`,
      caption: String.raw`Pick $a_n$ and $b_n$, and drag the handle along the partial sums of $\sum a_nb_n$. Top: the partial sums $A_n$ stay in the band $[-M,M]$. Bottom: the proof's estimate says every later partial sum stays within $2Mb_p$ of $s_{p-1}$ — the green window, which shrinks to nothing as $p$ moves right. Break a hypothesis ($a_n=1$, or a non-monotone $b_n$ that is larger where $a_n>0$) and the window is violated (red) and the series diverges.`,
      deps: ['pma-3.41', 'pma-3.22'],
      tags: ['series', 'summation by parts'],
      viz(v) {
        const AS = {
          alt: { label: '$(-1)^{n+1}$', a: (n) => (n % 2 ? 1 : -1), M: 1 },
          cos: { label: '$\\cos(1.2\\,n)$', a: (n) => Math.cos(1.2 * n), M: 1 / Math.sin(0.6) },
          pat: { label: '$1,1,-2,1,1,-2,\\ldots$', a: (n) => (n % 3 === 0 ? -2 : 1), M: 2 },
          one: { label: '$1$ (breaks (a))', a: () => 1, M: Infinity },
        };
        const BS = {
          inv: { label: '$\\frac1n$', b: (n) => 1 / n },
          isq: { label: '$\\frac1{\\sqrt n}$', b: (n) => 1 / Math.sqrt(n) },
          ilog: { label: '$\\frac1{\\log(n+1)}$', b: (n) => 1 / Math.log(n + 1) },
          bad: { label: 'not monotone (breaks (b))', b: null },
        };
        const aSel = v.select('$a_n=$', Object.entries(AS).map(([value, o]) => ({ value, label: o.label })), 'cos');
        const bSel = v.select('$b_n=$', Object.entries(BS).map(([value, o]) => ({ value, label: o.label })), 'isq');
        const N = 400;
        const T = v.stage({ x: [-14, N + 18], y: [-3, 3], height: 160, axes: 'box', full: true, title: 'partial sums $A_n=\\sum_{k\\le n}a_k$ and the bound $M$' });
        const S = v.stage({ x: [-14, N + 18], y: [-1, 1], height: 290, axes: 'box', full: true, xlabel: 'n', title: 'partial sums $s_n$ of $\\sum a_nb_n$ and the window $s_{p-1}\\pm 2Mb_p$' });
        let cache = null;
        const data = () => {
          const k = aSel.value + bSel.value;
          if (cache && cache.k === k) return cache;
          const Ao = AS[aSel.value];
          const bf = BS[bSel.value].b || ((n) => (Ao.a(n) > 0 ? 2 : 1) / n);
          const A = [0], s = [0], b = [0];
          for (let n = 1; n <= N; n++) { A.push(A[n - 1] + Ao.a(n)); b.push(bf(n)); s.push(s[n - 1] + Ao.a(n) * bf(n)); }
          const Mx = isFinite(Ao.M) ? Ao.M : Math.max(...A.map(Math.abs));
          cache = { k, A, s, b, M: Mx, bounded: isFinite(Ao.M), mono: !!BS[bSel.value].b };
          return cache;
        };
        const pH = S.handle(60, 0, { color: 'orange', label: 'p', constrain: (x) => { const d = data(); const p = Math.round(v.M.clamp(x, 1, N - 20)); return [p, d.s[p - 1]]; } });
        v.legend([['purple', '$A_n$'], ['orange', 'band $|A_n|\\le M$', { area: true }], ['accent', '$s_n=\\sum_{k\\le n}a_kb_k$'], ['green', 'window $s_{p-1}\\pm2Mb_p$', { area: true }]]);
        let state = null;
        v.render(() => {
          const d = data(), M = d.M;
          // top
          const amax = d.bounded ? M * 1.5 : Math.max(...d.A) * 1.1;
          T.setView(null, [d.bounded ? -amax : -amax * 0.08, amax]);
          if (d.bounded) T.hband(-M, M, { color: 'orange', alpha: 0.13, edges: true });
          T.path(d.A.map((y, n) => [n, y]).slice(1), { color: 'purple', width: 1.3 });
          T.corner(d.bounded ? `|Aₙ| ≤ M = ${v.fix(M, 3)}` : 'Aₙ = n is unbounded: hypothesis (a) fails', 'tr', { color: d.bounded ? 'orange' : 'red', weight: 600 });
          // bottom
          pH.x = Math.round(v.M.clamp(pH.x, 1, N - 20)); pH.y = d.s[pH.x - 1];
          const p = pH.x, w = 2 * M * d.b[p], c0 = d.s[p - 1];
          let lo = Infinity, hi = -Infinity;
          for (let n = 1; n <= N; n++) { lo = Math.min(lo, d.s[n]); hi = Math.max(hi, d.s[n]); }
          const span = hi - lo || 1;
          S.setView(null, [lo - span * 0.12, hi + span * 0.12]);
          let dev = 0, firstBad = null;
          for (let q = p; q <= N; q++) { const e = Math.abs(d.s[q] - c0); if (e > dev) dev = e; if (e > w + 1e-12 && firstBad == null) firstBad = q; }
          const ok = firstBad == null;
          S.rect(p, c0 - w, N, c0 + w, { fill: ok ? 'green' : 'red', fillAlpha: 0.14, color: ok ? 'green' : 'red', width: 1.2 });
          S.path(d.s.map((y, n) => [n, y]).slice(1), { color: 'accent', width: 1.6 });
          if (!ok) { const bad = []; for (let q = p; q <= N; q++) if (Math.abs(d.s[q] - c0) > w) bad.push([q, d.s[q]]); S.dots(bad, { color: 'red', r: 2.2 }); }
          S.corner(ok ? `all sₙ with n ≥ p stay within 2M·bₚ = ${v.fix(w, 4)} of s₍ₚ₋₁₎` : 'window violated: the estimate (and convergence) fails', 'tr', { color: ok ? 'green' : 'red', weight: 600 });
          state = { p, w, dev, ok, d };
        });
        v.readout(() => {
          const s = state; if (!s) return '';
          const d = s.d;
          if (!d.bounded) return `With $a_n=1$ the partial sums $A_n=n$ are unbounded, so (a) fails; here $\\sum a_nb_n=\\sum b_n$ diverges ($s_{${N}}=${v.fix(d.s[N], 3)}$ and growing).`;
          if (!d.mono) return `$b_n=\\frac{2}{n}$ where $a_n>0$ and $\\frac1n$ where $a_n\\le0$: still $b_n\\to0$, but not monotone, so (b) fails. The extra $\\sum_{a_n>0}a_n/n$ diverges, and the window around $s_{p-1}$ is left (max deviation $${v.fix(s.dev, 3)}>2Mb_p=${v.fix(s.w, 3)}$).`;
          return `$M=${v.fix(d.M, 3)}$, $p=${s.p}$: $\\max_{q\\ge p}|s_q-s_{p-1}|=${v.fix(s.dev, 4)}\\le 2Mb_p=${v.fix(s.w, 4)}$. As $p\\to\\infty$, $b_p\\to0$ squeezes the window, so the partial sums are Cauchy. $\\;s_{${N}}=${v.fix(d.s[N], 5)}$.`;
        });
      },
    },

    // ------------------------------------------------------------------ 3.43
    {
      num: '3.43',
      kind: 'Theorem',
      name: 'Alternating series test',
      statement: String.raw`Suppose
(a) $|c_1|\ge|c_2|\ge|c_3|\ge\cdots$;
(b) $c_{2m-1}\ge0$ and $c_{2m}\le0$ for $m=1,2,3,\dots$;
(c) $\lim_{n\to\infty}c_n=0$.
Then $\sum c_n$ converges.`,
      idea: String.raw`Apply 3.42 with $a_n=(-1)^{n+1}$, whose partial sums are $0$ or $1$, and $b_n=|c_n|$. Geometrically: each partial sum overshoots in the opposite direction by less than the previous step, so the intervals between consecutive partial sums are nested and their lengths $|c_n|\to0$; the sum is the single point they all contain, and $|s-s_n|\le|c_{n+1}|$.`,
      caption: String.raw`Choose $|c_n|$ and the number of terms $n$. Top: the partial sums hop back and forth along the line with shrinking steps (arcs above for $+$, below for $-$). Bottom: the intervals between consecutive partial sums, stacked downwards, are nested and close in on the sum (green). Choose the non-monotone option: the intervals stop nesting (red) and the partial sums drift off.`,
      deps: ['pma-3.42'],
      tags: ['series', 'alternating series'],
      viz(v) {
        const CS = {
          inv: { label: '$\\frac1n$', m: (n) => 1 / n, sum: Math.LN2 },
          isq: { label: '$\\frac1{\\sqrt n}$', m: (n) => 1 / Math.sqrt(n), sum: accelSum((n) => (n % 2 ? 1 : -1) / Math.sqrt(n)) },
          sq: { label: '$\\frac1{n^2}$', m: (n) => 1 / (n * n), sum: Math.PI ** 2 / 12 },
          bad: { label: '$\\frac1n$ odd, $\\frac1{n^2}$ even (breaks (a))', m: (n) => (n % 2 ? 1 / n : 1 / (n * n)), sum: null },
        };
        const which = v.select('$|c_n|=$', Object.entries(CS).map(([value, o]) => ({ value, label: o.label })), 'inv');
        const nS = v.slider('$n$', 2, 40, 12, { int: true });
        const top = v.stage({ x: [-0.1, 1.1], y: [-0.62, 0.62], height: 170, axes: false, full: true, title: 'partial sums $s_k=c_1+\\cdots+c_k$ hopping along the line' });
        const bot = v.stage({ x: [-0.1, 1.1], y: [-41, 0.5], height: 270, axes: false, full: true, title: 'the intervals between $s_k$ and $s_{k+1}$, $k=1,2,\\dots$ (stacked downwards)' });
        v.legend([['gold', 'hops $c_k$'], ['orange', 'nested intervals', { area: true }], ['red', 'interval not inside the previous one', { area: true }], ['green', 'the sum $s$', { dash: true }]]);
        let state = null;
        v.render(() => {
          const C = CS[which.value], n = nS.value;
          const s = [0]; for (let k = 1; k <= Math.max(n, 40); k++) s.push(s[k - 1] + (k % 2 ? 1 : -1) * C.m(k));
          const vis = s.slice(0, n + 1);
          let lo = Math.min(...vis), hi = Math.max(...vis);
          if (C.sum != null) { lo = Math.min(lo, C.sum); hi = Math.max(hi, C.sum); }
          const pad = (hi - lo) * 0.08 + 0.02;
          top.setView([lo - pad, hi + pad], null); bot.setView([lo - pad, hi + pad], [-(n + 0.8), 0.6]);
          // number line with a few ticks
          top.line(lo - pad, 0, hi + pad, 0, { color: 'ink', width: 1.4 });
          const raw = (hi - lo + 2 * pad) / 6, p10 = 10 ** Math.floor(Math.log10(raw)), st = raw / p10 < 2 ? p10 : raw / p10 < 5 ? 2 * p10 : 5 * p10;
          for (let t = Math.ceil((lo - pad) / st) * st; t <= hi + pad; t += st) {
            top.line(t, -0.035, t, 0.035, { color: 'muted', width: 1 });
            top.text(v.M.fmt(Math.abs(t) < 1e-12 ? 0 : t, 3), t, -0.62, { align: 'center', baseline: 'bottom', size: 10.5, color: 'muted' });
          }
          const span = hi - lo + 2 * pad;
          for (let k = 1; k <= n; k++) {
            const a = s[k - 1], b = s[k], up = k % 2 === 1, m = (a + b) / 2, r = Math.abs(b - a) / 2;
            const hgt = Math.min(0.55, (r / span) * 2.4 + 0.04) * (up ? 1 : -1);
            const pts = []; for (let i = 0; i <= 40; i++) { const t = i / 40; pts.push([a + (b - a) * t, hgt * Math.sin(Math.PI * t)]); }
            const recent = k === n;
            top.path(pts, { color: 'gold', width: recent ? 2.6 : 1.5, alpha: recent ? 1 : 0.35 + 0.65 * (k / n) });
          }
          if (C.sum != null) { top.vline(C.sum, { color: 'green', width: 1.6, dash: true }); bot.vline(C.sum, { color: 'green', width: 1.6, dash: true }); }
          top.dot(0, 0, { color: 'muted', r: 3.5 });
          top.dot(s[n], 0, { color: 'gold', r: 5.5, label: 'sₙ', labelPos: n % 2 ? 'n' : 's' });
          // nested intervals
          let prev = null, broken = 0;
          for (let k = 1; k < n; k++) {
            const a = Math.min(s[k], s[k + 1]), b = Math.max(s[k], s[k + 1]);
            const nested = !prev || (a >= prev[0] - 1e-12 && b <= prev[1] + 1e-12);
            if (!nested) broken++;
            bot.line(a, -k, b, -k, { color: nested ? 'orange' : 'red', width: 5, cap: 'butt', alpha: 0.85 });
            bot.dot(s[k], -k, { color: 'ink', r: 2.2 });
            prev = [a, b];
          }
          state = { C, n, s, broken };
        });
        v.readout(() => {
          const st = state; if (!st) return '';
          const C = st.C, sn = st.s[st.n];
          if (C.sum == null) return `$s_{${st.n}}=${v.fix(sn, 4)}$. The steps are not monotone, so (a) fails: ${st.broken} interval(s) are not nested, and in fact $\\sum c_n=\\sum\\frac{1}{2m-1}-\\sum\\frac1{(2m)^2}$ diverges.`;
          return `$s_{${st.n}}=${v.fix(sn, 6)}$, $\\;s=${v.fix(C.sum, 6)}$, $\\;|s-s_{${st.n}}|=${v.fix(Math.abs(C.sum - sn), 6)}\\le|c_{${st.n + 1}}|=${v.fix(C.m(st.n + 1), 6)}$.`;
        });
      },
    },

    // ------------------------------------------------------------------ 3.44
    {
      num: '3.44',
      kind: 'Theorem',
      name: 'Power series with decreasing coefficients on |z| = 1',
      statement: String.raw`Suppose the power series $\sum c_nz^n$ has radius of convergence $1$, and $c_0\ge c_1\ge c_2\ge\cdots$ with $\lim c_n=0$. Then $\sum c_nz^n$ converges at every point of the circle $|z|=1$, except possibly at $z=1$.`,
      idea: String.raw`For $|z|=1$, $z\ne1$, the partial sums of $\sum z^n$ are $\frac{1-z^{n+1}}{1-z}$, bounded by $\frac{2}{|1-z|}$. So Dirichlet's test (3.42) applies with $a_n=z^n$ and $b_n=c_n$, and even gives the tail bound $\bigl|\sum_{n\ge p}c_nz^n\bigr|\le\frac{2c_p}{|1-z|}$. At $z=1$ the bound blows up and the series may diverge (e.g. $c_n=\frac1{n+1}$).`,
      caption: String.raw`Drag $z$ around the unit circle and change the coefficients and the number of terms. Right: the partial sums of $\sum c_nz^n$ (gold) curl in, always staying inside the orange disc of radius $\frac{2c_{N+1}}{|1-z|}$ around $S_N$ that the proof provides; purple dots are the bounded partial sums of $\sum z^n$, which run round a circle of radius $\frac{1}{|1-z|}$. Move $z$ towards $1$: both blow up, and at $z=1$ the series $\sum c_n$ diverges.`,
      deps: ['pma-3.42', 'pma-3.38', 'pma-3.39'],
      see: ['pma-8.2'],
      verify: true,
      tags: ['power series', 'summation by parts'],
      viz(v) {
        const { Cx } = v.M;
        const one = new Cx(1, 0);
        const CF = {
          inv: { label: '$c_n=\\frac1{n+1}$', c: (n) => 1 / (n + 1), f: (z) => one.sub(z).log().neg().div(z) },
          isq: { label: '$c_n=\\frac1{\\sqrt{n+1}}$', c: (n) => 1 / Math.sqrt(n + 1), f: null },
          ilog: { label: '$c_n=\\frac1{\\log(n+2)}$', c: (n) => 1 / Math.log(n + 2), f: null },
        };
        const which = v.select('', Object.entries(CF).map(([value, o]) => ({ value, label: o.label })), 'isq');
        const NS = v.slider('$N$ (terms)', 5, 600, 40, { int: true });
        const L = v.stage({ x: [-1.3, 1.3], y: [-1.3, 1.3], equal: true, height: 340, axes: false, title: 'the point $z$ on $|z|=1$' });
        const P = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, height: 340, title: 'partial sums $S_n=\\sum_{k\\le n}c_kz^k$ and the tail disc' });
        const th0 = 0.95;
        // numerical value of the sum at z (z != 1): many terms, then repeated averaging of the last partial sums
        let limKey = null, limVal = null;
        const limitAt = (C, z) => {
          const k = which.value + ':' + z.re.toFixed(6) + ':' + z.im.toFixed(6);
          if (k === limKey) return limVal;
          if (C.f) { limKey = k; limVal = C.f(z); return limVal; }
          // S_K plus the first two terms of the summation-by-parts expansion of the tail:
          // sum_{n>=m} c_n z^n = c_m z^m/(1-z) + (c_{m+1}-c_m) z^{m+1}/(1-z)^2 + O(|Δ²c| / |1-z|^3)
          let S = new Cx(0, 0), zn = new Cx(1, 0); const K = 20000;
          for (let n = 0; n <= K; n++) { S = S.add(zn.scale(C.c(n))); zn = zn.mul(z); }
          const m = K + 1, w = one.sub(z);
          const t1 = zn.scale(C.c(m)).div(w), t2 = zn.mul(z).scale(C.c(m + 1) - C.c(m)).div(w.mul(w));
          limKey = k; limVal = S.add(t1).add(t2); return limVal;
        };
        const zH = L.handle(Math.cos(th0), Math.sin(th0), { color: 'accent', label: 'z', constrain: (x, y) => { const r = Math.hypot(x, y) || 1; return [x / r, y / r]; } });
        v.legend([['gold', 'partial sums $S_n$ of $\\sum c_nz^n$'], ['purple', 'partial sums of $\\sum z^n$', { dot: true }], ['orange', 'tail disc, radius $\\frac{2c_{N+1}}{|1-z|}$', { area: true }], ['green', 'limit', { dot: true }]]);
        let state = null;
        v.render(() => {
          const C = CF[which.value], N = NS.value;
          const z = new Cx(zH.x, zH.y), d1 = one.sub(z).abs();
          // left
          L.line(-1.3, 0, 1.3, 0, { color: 'faint', width: 1 }); L.line(0, -1.3, 0, 1.3, { color: 'faint', width: 1 });
          L.circle(0, 0, 1, { color: 'ink', width: 1.8 });
          L.dot(0, 0, { color: 'muted', r: 2.5 });
          L.line(1, 0, z.re, z.im, { color: 'orange', width: 1.6, dash: [4, 3] });
          L.dot(1, 0, { color: 'red', r: 6, hollow: true, width: 2.4, label: 'z = 1', labelPos: 'e' });
          L.corner(`|1 − z| = ${v.fix(d1, 3)}`, 'bl', { color: 'orange', weight: 600 });
          // right
          const pts = [[0, 0]], geo = [];
          let S = new Cx(0, 0), G = new Cx(0, 0), zn = new Cx(1, 0);
          for (let n = 0; n <= N; n++) { S = S.add(zn.scale(C.c(n))); G = G.add(zn); pts.push([S.re, S.im]); if (n < 160) geo.push([G.re, G.im]); zn = zn.mul(z); }
          const near1 = d1 < 4e-3;
          const rad = near1 ? Infinity : (2 * C.c(N + 1)) / d1;
          const lim = !near1 ? limitAt(C, z) : null;
          const all = pts.concat(near1 ? [] : geo);
          let xs = all.map((p) => p[0]), ys = all.map((p) => p[1]);
          if (isFinite(rad)) { xs.push(S.re - rad, S.re + rad); ys.push(S.im - rad, S.im + rad); }
          const cx0 = (Math.min(...xs) + Math.max(...xs)) / 2, cy0 = (Math.min(...ys) + Math.max(...ys)) / 2;
          const half = Math.max(0.5, (Math.max(...xs) - Math.min(...xs)) * 0.56, (Math.max(...ys) - Math.min(...ys)) * 0.56);
          P.setView([cx0 - half, cx0 + half], [cy0 - half, cy0 + half]);
          if (!near1) {
            const c0 = one.div(one.sub(z));
            P.circle(c0.re, c0.im, 1 / d1, { color: 'purple', width: 1, alpha: 0.35, dash: [3, 4] });
            P.dots(geo, { color: 'purple', r: 2.4, alpha: 0.75 });
          }
          if (isFinite(rad)) P.circle(S.re, S.im, rad, { fill: 'orange', fillAlpha: 0.14, color: 'orange', width: 1.4 });
          P.path(pts, { color: 'gold', width: 1.7 });
          P.dot(S.re, S.im, { color: 'gold', r: 5, label: 'S_N', tex: true, labelPos: 'ne' });
          if (lim) P.dot(lim.re, lim.im, { color: 'green', r: 7.5, hollow: true, width: 2.4 });
          P.dot(0, 0, { color: 'muted', r: 3 });
          P.corner(near1 ? `z = 1: Σ cₙ diverges` : `tail radius ${sciTxt(rad)}`, 'tr', { color: near1 ? 'red' : 'orange', weight: 600 });
          state = { d1, N, S, rad, lim, near1 };
        });
        v.readout(() => {
          const s = state; if (!s) return '';
          if (s.near1) return `At $z=1$ the partial sums of $\\sum z^n$ are $n+1$, unbounded; the series becomes $\\sum c_n$, which diverges for these coefficients ($S_{${s.N}}=${v.fix(s.S.re, 3)}$).`;
          return `$|1-z|=${v.fix(s.d1, 3)}$, so $\\bigl|\\sum_{k\\le n}z^k\\bigr|\\le\\frac{2}{|1-z|}=${v.fix(2 / s.d1, 3)}$; $\\;S_{${s.N}}=${cplx(s.S)}$, and every later partial sum lies within $${sci(s.rad)}$ of it. The sum is $${cplx(s.lim)}$` + (which.value === 'inv' ? ' $=-\\log(1-z)/z$.' : ' (computed numerically).');
        });
      },
    },

    // ------------------------------------------------------------------ 3.45
    {
      num: '3.45',
      kind: 'Theorem',
      name: 'Absolute convergence implies convergence',
      statement: String.raw`The series $\sum a_n$ is said to *converge absolutely* if $\sum|a_n|$ converges. If $\sum a_n$ converges absolutely, then $\sum a_n$ converges.`,
      idea: String.raw`By the triangle inequality, $\bigl|\sum_{k=n}^{m}a_k\bigr|\le\sum_{k=n}^{m}|a_k|$, so the Cauchy criterion (3.22) for $\sum|a_n|$ transfers to $\sum a_n$. In pictures: the polygon of partial sums has finite total length, so its remaining pieces fit in ever smaller discs. The converse fails: $\sum (-1)^n/n$ converges but not absolutely.`,
      caption: String.raw`The complex terms $a_n$ are laid head to tail, so the vertices are the partial sums $S_n$. Slide $N$: all later partial sums lie in the orange disc about $S_N$ whose radius is the remaining length $\sum_{n>N}|a_n|$. Right: that remaining length (orange) always dominates the actual spread $\sup_{m>N}|S_m-S_N|$ (blue), and both go to $0$. For $e^{2in}/n$ the length is infinite — no disc — yet the series still converges (3.44): absolute convergence is sufficient, not necessary.`,
      deps: ['pma-3.22'],
      see: ['pma-3.55'],
      tags: ['series', 'absolute convergence'],
      viz(v) {
        const { Cx } = v.M;
        const SER = {
          sq: { label: '$\\frac{e^{2in}}{n^2}$', a: (n) => Cx.polar(1 / (n * n), 2 * n), abs: true },
          geo: { label: '$\\left(0.85\\,e^{2.3i}\\right)^n$', a: (n) => Cx.polar(0.85 ** n, 2.3 * n), abs: true },
          p32: { label: '$\\frac{i^n}{n^{3/2}}$', a: (n) => Cx.polar(Math.pow(n, -1.5), (Math.PI / 2) * n), abs: true },
          cond: { label: '$\\frac{e^{2in}}{n}$ (not absolute)', a: (n) => Cx.polar(1 / n, 2 * n), abs: false },
        };
        const which = v.select('$a_n=$', Object.entries(SER).map(([value, o]) => ({ value, label: o.label })), 'sq');
        const NS = v.slider('$N$', 1, 40, 4, { int: true });
        const K = 3000;
        const P = v.stage({ x: [-1, 1], y: [-1, 1], equal: true, height: 350, weight: 1.15, title: 'partial sums $S_n$ in $\\mathbb C$ and the disc of radius $\\sum_{n>N}|a_n|$' });
        const T = v.stage({ x: [-3, 43], y: [0, 1], height: 350, axes: 'box', weight: 1, xlabel: 'N', xticks: [1, 10, 20, 30, 40], title: 'remaining length vs actual spread' });
        v.legend([['accent', 'first $N$ terms'], ['gold', 'later partial sums'], ['orange', '$\\sum_{n>N}|a_n|$', { area: true }], ['accent', '$\\sup_{m>N}|S_m-S_N|$', { dot: true }]]);
        let cache = null;
        const data = () => {
          if (cache && cache.k === which.value) return cache;
          const Sx = SER[which.value];
          const S = [new Cx(0, 0)], len = [0];
          for (let n = 1; n <= K; n++) { const a = Sx.a(n); S.push(S[n - 1].add(a)); len.push(len[n - 1] + a.abs()); }
          // total length: for absolutely convergent series, add an integral estimate of the far tail
          let total = len[K];
          if (which.value === 'sq') total += 1 / K; else if (which.value === 'p32') total += 2 / Math.sqrt(K);
          const spread = []; // sup_{m>N} |S_m - S_N| over m <= K
          for (let N = 0; N <= 42; N++) { let m = 0; for (let j = N + 1; j <= K; j++) m = Math.max(m, S[j].sub(S[N]).abs()); spread.push(m); }
          cache = { k: which.value, S, len, total: Sx.abs ? total : Infinity, spread, abs: Sx.abs };
          return cache;
        };
        let state = null;
        v.render(() => {
          const d = data(), N = NS.value;
          const pts = d.S.slice(0, 400).map((z) => [z.re, z.im]);
          let xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
          const half = Math.max((Math.max(...xs) - Math.min(...xs)) * 0.6, (Math.max(...ys) - Math.min(...ys)) * 0.6, 0.6);
          const cx0 = (Math.max(...xs) + Math.min(...xs)) / 2, cy0 = (Math.max(...ys) + Math.min(...ys)) / 2;
          P.setView([cx0 - half, cx0 + half], [cy0 - half, cy0 + half]);
          const SN = d.S[N], rN = d.total - d.len[N];
          if (isFinite(rN)) P.circle(SN.re, SN.im, rN, { fill: 'orange', fillAlpha: 0.13, color: 'orange', width: 1.5 });
          P.path(pts.slice(N), { color: 'gold', width: 1.2, alpha: 0.85 });
          for (let n = 1; n <= N; n++) { const a = d.S[n - 1], b = d.S[n]; P.arrow(a.re, a.im, b.re, b.im, { color: 'accent', width: 2, head: 8 }); }
          const lim = d.S[K];
          P.dot(lim.re, lim.im, { color: 'green', r: 6.5, hollow: true, width: 2.2 });
          P.dot(SN.re, SN.im, { color: 'accent', r: 5, label: 'S_N', tex: true, labelPos: 'ne' });
          P.dot(0, 0, { color: 'muted', r: 3 });
          if (!isFinite(rN)) P.corner('Σ|aₙ| = ∞: no disc, but the series converges anyway', 'tl', { color: 'red', weight: 600 });
          // right
          const ymax = Math.max(d.spread[1] * 1.25, isFinite(d.total) ? (d.total - d.len[1]) * 1.1 : 0, 0.1);
          T.setView(null, [-ymax * 0.05, ymax]);
          if (isFinite(d.total)) {
            const rem = []; for (let n = 1; n <= 40; n++) rem.push([n, d.total - d.len[n]]);
            T.path(rem.concat([[40, 0], [1, 0]]), { fill: 'orange', fillAlpha: 0.12, stroke: false, close: true });
            T.path(rem, { color: 'orange', width: 2 });
          } else T.corner('remaining length = ∞ for every N', 'tr', { color: 'red', weight: 600 });
          T.path(d.spread.slice(1, 41).map((y, i) => [i + 1, y]), { color: 'accent', width: 1.4, alpha: 0.6 });
          T.dots(d.spread.slice(1, 41).map((y, i) => [i + 1, y]), { color: 'accent', r: 3 });
          T.vline(N, { color: 'faint', width: 1.2 });
          state = { N, rN, sp: d.spread[N], lim };
        });
        v.readout(() => {
          const s = state; if (!s) return '';
          return (isFinite(s.rN) ? `$\\sum_{n>${s.N}}|a_n|=${v.fix(s.rN, 4)}\\;\\ge\\;\\sup_{m>${s.N}}|S_m-S_{${s.N}}|=${v.fix(s.sp, 4)}$` : `$\\sum|a_n|=\\infty$, but still $\\sup_{m>${s.N}}|S_m-S_{${s.N}}|=${v.fix(s.sp, 4)}$`) + `; $\\;\\sum a_n\\approx ${cplx(s.lim, 4)}$.`;
        });
      },
    },
  ],
};
