// Rudin, Principles of Mathematical Analysis — Chapter 3 (part 1 of the second half):
// the p-series, the number e, and the root and ratio tests (3.28–3.34).

const SUPS = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
/** Canvas tick label "10⁻⁴" for an integer exponent. */
const pow10 = (k) => (k === 0 ? '1' : '10' + String(k).split('').map((c) => SUPS[c] ?? c).join(''));

/** x as TeX in scientific notation: "2.79\times10^{-8}". */
function sci(x, d = 2) {
  if (x === 0) return '0';
  if (!isFinite(x)) return '\\infty';
  const e = Math.floor(Math.log10(Math.abs(x)));
  if (e >= -3 && e <= 4) return (+x.toPrecision(d + 1)).toString();
  const m = x / 10 ** e;
  return `${m.toFixed(d)}\\times10^{${e}}`;
}

/** Riemann zeta(p) for p > 1 by Euler–Maclaurin (accurate to ~1e-10). */
function zeta(p) {
  const N = 24; let s = 0;
  for (let n = 1; n < N; n++) s += Math.pow(n, -p);
  const a = Math.pow(N, -p);
  return s + (N * a) / (p - 1) + a / 2 + (p * a) / (12 * N) - (p * (p + 1) * (p + 2) * a) / (720 * N ** 3);
}

const FACT = [1];
for (let k = 1; k <= 30; k++) FACT.push(FACT[k - 1] * k);

/**
 * Test series shared by the root and ratio tests. la(n) = ln|a_n| (n ≥ 1), so huge or tiny
 * terms never overflow. alpha = lim sup |a_n|^{1/n}; rho = [lim inf, lim sup] of |a_{n+1}/a_n|.
 */
const TEST_SERIES = {
  half: { label: '$\\left(\\frac{n}{2n+1}\\right)^{n}$', la: (n) => n * Math.log(n / (2 * n + 1)), alpha: 0.5, rho: [0.5, 0.5], sum: null },
  rudin: {
    label: '$\\frac12+\\frac13+\\frac1{2^2}+\\frac1{3^2}+\\cdots$',
    la: (n) => (n % 2 ? -((n + 1) / 2) * Math.LN2 : -(n / 2) * Math.log(3)),
    alpha: Math.SQRT1_2, rho: [0, Infinity], sum: 1.5,
  },
  poly: { label: '$n^2\\,(0.75)^n$', la: (n) => 2 * Math.log(n) + n * Math.log(0.75), alpha: 0.75, rho: [0.75, 0.75], sum: 84 },
  fact: { label: '$\\frac{1}{n!}$', la: (n) => -Math.log(FACT[Math.min(n, 30)]) - (n > 30 ? lgammaTail(n) : 0), alpha: 0, rho: [0, 0], sum: Math.E - 1 },
  pow2: { label: '$\\frac{n^2}{2^n}$', la: (n) => 2 * Math.log(n) - n * Math.LN2, alpha: 0.5, rho: [0.5, 0.5], sum: 6 },
  grow: { label: '$\\frac{(1.15)^n}{n^2}$', la: (n) => n * Math.log(1.15) - 2 * Math.log(n), alpha: 1.15, rho: [1.15, 1.15], sum: Infinity },
  grow2: { label: '$\\frac{2^n}{n^2}$', la: (n) => n * Math.LN2 - 2 * Math.log(n), alpha: 2, rho: [2, 2], sum: Infinity },
  harm: { label: '$\\frac1n$', la: (n) => -Math.log(n), alpha: 1, rho: [1, 1], sum: Infinity },
  sq: { label: '$\\frac1{n^2}$', la: (n) => -2 * Math.log(n), alpha: 1, rho: [1, 1], sum: Math.PI ** 2 / 6 },
};
/** ln(n!) − ln(30!) for n > 30. */
function lgammaTail(n) { let s = 0; for (let k = 31; k <= n; k++) s += Math.log(k); return s; }

export default {
  collection: 'pma',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.28
    {
      num: '3.28',
      kind: 'Theorem',
      name: 'The p-series test',
      statement: String.raw`The series $\displaystyle\sum_{n=1}^{\infty}\frac{1}{n^{p}}$ converges if $p>1$ and diverges if $p\le 1$.`,
      idea: String.raw`If $p\le 0$ the terms do not tend to $0$, so the series diverges (3.23). If $p>0$ the terms decrease, and Cauchy's condensation test (3.27) says the series converges exactly when $\sum_k 2^k\cdot 2^{-kp}=\sum_k\bigl(2^{1-p}\bigr)^k$ does. That is a geometric series (3.26), convergent precisely when $2^{1-p}<1$, i.e. $p>1$.`,
      caption: String.raw`Slide $p$. Top: each dyadic block of terms $2^k\le n<2^{k+1}$ fits under an orange rectangle of area $2^k\cdot2^{-kp}=(2^{1-p})^k$ (numbers shown). Bottom: on a logarithmic $N$-axis the partial sums $s_N$ stay between $\tfrac12 t_K$ and $t_K$, the partial sums of that geometric series. The trap stays bounded exactly when $p>1$; at $p=1$ every block contributes the same amount, so $s_N$ grows in equal steps.`,
      deps: ['pma-3.27', 'pma-3.26', 'pma-3.23'],
      tags: ['series', 'condensation'],
      viz(v) {
        const pS = v.slider('$p$', 0.2, 3, 1.5, { step: 0.01 });
        const top = v.stage({ x: [-1.7, 33.2], y: [-0.09, 1.22], height: 230, full: true, axes: 'box', xlabel: 'n', xticks: [1, 2, 4, 8, 16, 32], title: 'terms $1/n^p$; block $k$ ($2^k\\le n<2^{k+1}$) sits under a rectangle of area $(2^{1-p})^k$, printed on top' });
        const bot = v.stage({ x: [-0.75, 17.4], y: [0, 4], height: 280, full: true, axes: 'box', xlabel: 'log₂ N', title: 'partial sums $s_N$ inside the condensation trap $\\tfrac12\\,t_K\\le s_N\\le t_K$, where $t_K=\\sum_{k=0}^{K}(2^{1-p})^k$' });
        v.legend([['accent', '$1/n^p$ (alternate blocks shaded)'], ['orange', 'block rectangle / trap $[\\tfrac12 t_K,\\,t_K]$', { area: true }], ['gold', 'partial sums $s_N$'], ['green', '$\\sum_{n\\ge1} n^{-p}$ (when $p>1$)', { dash: true }]]);
        const NMAX = 1 << 16;
        const want = new Set();
        for (let i = 0; i <= 128; i++) want.add(Math.round(2 ** (i / 8)));
        const wantList = [...want].sort((a, b) => a - b);
        let C = null;
        const compute = (p) => {
          if (C && C.p === p) return C;
          const sAt = new Map(); let s = 0;
          for (let n = 1; n <= NMAX; n++) { s += Math.pow(n, -p); if (want.has(n)) sAt.set(n, s); }
          const r = 2 ** (1 - p), t = []; let acc = 0, rk = 1;
          for (let k = 0; k <= 16; k++) { acc += rk; rk *= r; t.push(acc); }
          C = { p, curve: wantList.map((n) => [Math.log2(n), sAt.get(n)]), t, sN: s, r, z: p > 1 + 1e-9 ? zeta(p) : Infinity };
          return C;
        };
        v.render(() => {
          const p = pS.value, c = compute(p), conv = p > 1 + 1e-9;
          // ---- top: terms and block rectangles
          for (let k = 0; k <= 4; k++) {
            const a = 2 ** k, b = 2 ** (k + 1), h = Math.pow(a, -p);
            top.rect(a - 0.5, 0, b - 0.5, h, { fill: 'orange', fillAlpha: 0.1, color: 'orange', width: 1.4 });
            top.line(a - 0.5, h, a - 0.5, 1.13, { color: 'orange', width: 0.8, alpha: 0.35, dash: [2, 3] });
            top.text(v.fmt(a * h, 3), (a + b - 1) / 2, 1.13, { align: 'center', color: 'orange', size: k ? 12 : 11, weight: 600 });
          }
          top.bars(Array.from({ length: 31 }, (_, i) => Math.pow(i + 1, -p)), { x0: 1, barWidth: 0.6, fillAlpha: 0.85, color: (_, i) => ((31 - Math.clz32(i + 1)) % 2 ? 'teal' : 'accent') });
          // ---- bottom: trap and partial sums
          const t = c.t, U = [], L = [];
          for (let i = 0; i <= 1600; i++) {
            const x = i / 100, N = Math.floor(2 ** x + 1e-9);
            U.push([x, t[Math.ceil(Math.log2(N + 1) - 1e-9) - 1]]);
            L.push([x, t[31 - Math.clz32(N)] / 2]);
          }
          let ymax = Math.max(t[16], c.sN) * 1.12;
          const G = conv ? 1 / (1 - c.r) : Infinity;
          if (conv && c.z < ymax * 1.6) ymax = Math.max(ymax, c.z * 1.1);
          if (conv && G < ymax * 1.25) ymax = Math.max(ymax, G * 1.06);
          bot.setView(null, [0, ymax]);
          bot.poly(U.concat(L.slice().reverse()), { fill: 'orange', fillAlpha: 0.13, stroke: false });
          bot.path(U, { color: 'orange', width: 1.6 });
          bot.path(L, { color: 'orange', width: 1.4, dash: [5, 4] });
          if (conv) {
            if (G <= ymax) { bot.hline(G, { color: 'orange', width: 1, dash: [2, 4] }); bot.tex(`\\lim t_K = ${v.fix(G, 2)}`, 11.5, G, { align: 'right', baseline: 'bottom', color: 'orange', size: 13, dy: -2 }); }
            if (c.z <= ymax) { bot.hline(c.z, { color: 'green', width: 1.8, dash: true }); bot.tex(`\\sum n^{-p} = ${v.fix(c.z, 3)}`, 17.2, c.z, { align: 'right', baseline: 'bottom', color: 'green', size: 13, dy: -2 }); }
            else bot.corner(`Σ n⁻ᵖ = ${v.fix(c.z, 2)} lies above the panel: near p = 1 convergence is very slow`, 'tr', { color: 'green' });
          }
          bot.path(c.curve, { color: 'gold', width: 2.6 });
          bot.dot(16, c.sN, { color: 'gold', r: 4.5 });
          bot.corner(conv ? `2¹⁻ᵖ = ${v.fix(c.r, 3)} < 1: trap bounded ⇒ converges` : `2¹⁻ᵖ = ${v.fix(c.r, 3)} ≥ 1: trap unbounded ⇒ diverges`, 'tl', { color: conv ? 'green' : 'red', weight: 600, size: 12.5 });
        });
        v.readout(() => {
          const p = pS.value, c = compute(p);
          return p > 1 + 1e-9
            ? `$p=${v.fix(p, 2)}$: ratio $2^{1-p}=${v.fix(c.r, 3)}<1$, so the condensed series is a convergent geometric series and $\\sum 1/n^p$ converges. $\\;s_{65536}=${v.fix(c.sN, 4)}$, $\\;\\sum_{n\\ge1}n^{-p}=${v.fix(c.z, 4)}$.`
            : `$p=${v.fix(p, 2)}$: ratio $2^{1-p}=${v.fix(c.r, 3)}\\ge 1$, so the condensed series diverges and so does $\\sum 1/n^p$; $\\;s_{65536}=${v.fmt(c.sN, 5)}$ and still growing.`;
        });
      },
    },

    // ------------------------------------------------------------------ 3.29
    {
      num: '3.29',
      kind: 'Theorem',
      name: 'The series Σ 1/(n (log n)^p)',
      statement: String.raw`The series $\displaystyle\sum_{n=2}^{\infty}\frac{1}{n(\log n)^{p}}$ converges if $p>1$ and diverges if $p\le 1$.`,
      idea: String.raw`The terms decrease (for $p\ge 0$; for $p<0$ compare with $\sum 1/n$), so condensation (3.27) applies. Since $2^k\,a_{2^k}=\dfrac{2^k}{2^k(k\log 2)^p}=\dfrac{1}{(\log 2)^p}\cdot\dfrac{1}{k^p}$, the condensed series is a constant multiple of the $p$-series in $k$, and 3.28 decides. The case $p=1$ shows how slowly a divergent series can diverge.`,
      caption: String.raw`Slide $p$ and choose how far to look. Top: by condensation every partial sum up to $n=2^{K+1}$ lies in the orange step band $[\tfrac12 t_K,\,t_K]$ with $t_K=\sum_{k=1}^{K}(k\log2)^{-p}$; gold is the exact partial sum where it can be computed ($n\le 2^{18}$). Bottom: each dyadic block sum (bars) is squeezed under $(k\log 2)^{-p}$, the terms of a $p$-series in $k$. At $p=1$ the band rises without bound, but only like $\log\log n$.`,
      deps: ['pma-3.27', 'pma-3.28'],
      tags: ['series', 'condensation'],
      viz(v) {
        const pS = v.slider('$p$', 0.5, 2, 1, { step: 0.05 });
        const D = v.select('$n$ up to', [6, 20, 100, 1000].map((d) => ({ value: d, label: `$10^{${d}}$` })), 20);
        const S = v.stage({ x: [-3, 22], y: [0, 10], height: 300, axes: 'box', full: true, xlabel: 'log₁₀ n', title: 'partial sums are trapped in $[\\tfrac12 t_K,\\,t_K]$ for $2^K\\le n<2^{K+1}$' });
        const B = v.stage({ x: [-0.6, 18.4], y: [0, 1.6], height: 220, axes: 'box', full: true, xlabel: 'k', title: 'block sums $\\sum_{2^k\\le n<2^{k+1}} a_n$ vs $(k\\log 2)^{-p}$' });
        v.legend([['orange', 'condensation bounds', { area: true }], ['gold', 'exact partial sums ($n\\le 2^{18}$)'], ['accent', 'dyadic block sums'], ['green', 'range for the full sum ($p>1$)', { area: true }]]);
        const LN2 = Math.LN2, LOG2 = Math.log10(2), NEX = 1 << 18;
        let C = null;
        const compute = (p) => {
          if (C && C.p === p) return C;
          const curve = [], blocks = new Array(19).fill(0);
          let s = 0, next = 2;
          for (let n = 2; n <= NEX; n++) {
            const a = 1 / (n * Math.pow(Math.log(n), p));
            s += a; blocks[31 - Math.clz32(n)] += a;
            if (n >= next) { curve.push([Math.log10(n), s]); next = Math.ceil(n * 1.03); }
          }
          const t = [0];
          for (let k = 1; k <= 3400; k++) t.push(t[k - 1] + Math.pow(k * LN2, -p));
          C = { p, curve, blocks, t, tinf: p > 1 + 1e-9 ? zeta(p) / Math.pow(LN2, p) : Infinity };
          return C;
        };
        let state = null;
        v.render(() => {
          const p = pS.value, c = compute(p), d = D.value;
          const Kmax = Math.floor(d / LOG2);
          const top = Math.min(c.t[Kmax], c.tinf) * 1.12;
          S.setView([-d * 0.035, d * 1.1], [0, top]);
          // step band
          const up = [], lo = [];
          for (let K = 1; K <= Kmax; K++) { up.push([K * LOG2, c.t[K]], [(K + 1) * LOG2, c.t[K]]); lo.push([K * LOG2, c.t[K] / 2], [(K + 1) * LOG2, c.t[K] / 2]); }
          if (c.tinf < Infinity) S.hband(c.tinf / 2, c.tinf, { color: 'green', alpha: 0.08 });
          S.poly(up.concat(lo.slice().reverse()), { fill: 'orange', fillAlpha: 0.15, stroke: false });
          S.path(up, { color: 'orange', width: 1.5 });
          S.path(lo, { color: 'orange', width: 1.5, dash: [5, 4] });
          if (c.tinf < Infinity) {
            S.hline(c.tinf, { color: 'green', width: 1.4, dash: true }); S.hline(c.tinf / 2, { color: 'green', width: 1.4, dash: true });
            S.tex('\\text{the full sum lies in here}', d * 0.98, (c.tinf * 3) / 4, { align: 'right', color: 'green', size: 13 });
          }
          S.path(c.curve, { color: 'gold', width: 2.8 });
          const lo1 = c.t[Kmax] / 2, hi1 = c.t[Kmax];
          S.dot(Kmax * LOG2, hi1, { color: 'orange', r: 4 }); S.dot(Kmax * LOG2, lo1, { color: 'orange', r: 4 });
          state = { p, d, lo: lo1, hi: hi1, tinf: c.tinf };
          // right panel: block sums
          const bmax = Math.pow(LN2, -p) * 1.12;
          B.setView(null, [-0.09 * bmax, bmax]);
          B.bars(c.blocks.slice(1, 18), { x0: 1, color: 'accent', barWidth: 0.6, fillAlpha: 0.8 });
          const upper = [], lower = [];
          for (let k = 1; k <= 17; k++) { upper.push([k, Math.pow(k * LN2, -p)]); lower.push([k, 0.5 * Math.pow((k + 1) * LN2, -p)]); }
          B.path(upper, { color: 'orange', width: 2 }); B.dots(upper, { color: 'orange', r: 3 });
          B.path(lower, { color: 'orange', width: 1.4, dash: [5, 4] });
          B.tex('(k\\log 2)^{-p}', 2.2, upper[1][1], { align: 'left', baseline: 'bottom', color: 'orange', size: 14, dy: -4 });
        });
        v.readout(() => {
          const s = state; if (!s) return '';
          const head = `At $n\\approx 10^{${s.d}}$ the partial sum lies between $${v.fix(s.lo, 2)}$ and $${v.fix(s.hi, 2)}$. `;
          if (s.tinf < Infinity) return head + `For $p=${v.fix(s.p, 2)}>1$ the condensed series $\\sum (k\\log2)^{-p}$ converges, so the whole sum is at most $${v.fix(s.tinf, 3)}$.`;
          if (Math.abs(s.p - 1) < 1e-9) return head + 'For $p=1$ the condensed series is $\\frac{1}{\\log 2}\\sum\\frac1k$: it diverges, but the partial sums grow only like $\\log\\log n$.';
          return head + `For $p=${v.fix(s.p, 2)}<1$ the condensed series $\\sum (k\\log2)^{-p}$ diverges, hence so does the original.`;
        });
      },
    },

    // ------------------------------------------------------------------ 3.30
    {
      num: '3.30',
      kind: 'Definition',
      name: 'The number e',
      statement: String.raw`$$e=\sum_{n=0}^{\infty}\frac{1}{n!},$$ where $0!=1$ and $n!=1\cdot2\cdots n$ for $n\ge1$. The definition makes sense: the partial sums increase and are bounded by $1+1+\frac12+\frac14+\cdots+\frac1{2^{n-1}}<3$, so the series converges.`,
      idea: String.raw`Since $n!\ge 2^{n-1}$, each term $1/n!$ is at most the corresponding term of the geometric series $1+\sum_{n\ge1}2^{-(n-1)}=3$. Bounded increasing partial sums converge (3.24). The tail is even smaller than geometric: $0<e-s_n<\frac{1}{n!\,n}$, which is what makes the series so fast and drives 3.32.`,
      caption: String.raw`Raise $n$ to stack more terms. Each block $1/k!$ in the left column is no taller than the matching block $2^{-(k-1)}$ on the right, so the left column never reaches $3$. Right panel: the remaining gaps on a log scale — $e-s_n$ collapses factorially and hugs the bound $\frac1{n!\,n}$ (dashed) from below, while the geometric gap only halves.`,
      deps: ['pma-3.24', 'pma-3.26'],
      tags: ['e', 'series'],
      viz(v) {
        const nS = v.slider('$n$', 0, 12, 4, { int: true });
        const A = v.stage({ x: [0, 4], y: [-0.3, 3.3], height: 360, axes: false, weight: 1, title: 'stacking the terms' });
        const G = v.stage({ x: [-1.6, 13.4], y: [-11.5, 0.8], height: 360, axes: 'box', xlabel: 'n', weight: 1, title: 'remaining gap after $n$ terms (log scale)', yticks: [0, -2, -4, -6, -8, -10].map((k) => [k, pow10(k)]) });
        v.legend([['accent', '$e - s_n$', { dot: true }], ['orange', '$3 - (1+1+\\cdots+2^{-(n-1)})$', { dot: true }], ['green', 'bound $\\frac{1}{n!\\,n}$', { dash: true }]]);
        const tail = (n) => { let s = 0; for (let k = n + 1; k <= 30; k++) s += 1 / FACT[k]; return s; };
        v.render(() => {
          const n = nS.value;
          const cols = [
            { x: 1.05, h: (k) => 1 / FACT[k], lab: (k) => `\\tfrac{1}{${k}!}`, cs: ['accent', 'teal'], name: '\\sum 1/k!' },
            { x: 2.95, h: (k) => (k === 0 ? 1 : 2 ** (1 - k)), lab: (k) => (k <= 1 ? '1' : `\\tfrac{1}{2^{${k - 1}}}`), cs: ['orange', 'gold'], name: '1+\\sum 2^{-(k-1)}' },
          ];
          A.hline(Math.E, { color: 'green', width: 1.6, dash: true });
          A.hline(3, { color: 'orange', width: 1.2, dash: [2, 4] });
          A.tex('e', 2.0, Math.E, { color: 'green', baseline: 'bottom', dy: -2, size: 16 });
          A.tex('3', 2.0, 3, { color: 'orange', baseline: 'bottom', dy: -2, size: 15 });
          for (const c of cols) {
            let y = 0;
            for (let k = 0; k <= n; k++) {
              const h = c.h(k);
              A.rect(c.x - 0.45, y, c.x + 0.45, y + h, { fill: c.cs[k % 2], fillAlpha: 0.42, color: c.cs[k % 2], width: 1 });
              if (A.Y(y) - A.Y(y + h) > 19) A.tex(c.lab(k), c.x, y + h / 2, { size: 13 });
              y += h;
            }
            A.tex(`${v.fix(y, 6)}`, c.x, y, { baseline: 'bottom', dy: -4, size: 13, color: 'ink' });
            A.tex(c.name, c.x, -0.15, { size: 13, color: 'muted' });
          }
          // right: gaps
          const ge = [], gg = [], gb = [];
          for (let k = 0; k <= 12; k++) {
            ge.push([k, Math.log10(tail(k))]);
            gg.push([k, Math.log10(k === 0 ? 2 : 2 ** (1 - k))]);
            if (k >= 1) gb.push([k, Math.log10(1 / (FACT[k] * k))]);
          }
          G.vline(n, { color: 'faint', width: 1.4 });
          G.path(gg, { color: 'orange', width: 1.6 }); G.dots(gg, { color: 'orange', r: 3.2 });
          G.path(ge, { color: 'accent', width: 1.8 }); G.dots(ge, { color: 'accent', r: 3.4 });
          G.path(gb, { color: 'green', width: 2, dash: [5, 4] });
          G.dot(n, ge[n][1], { color: 'accent', r: 5.5 });
          G.dot(n, gg[n][1], { color: 'orange', r: 5 });
        });
        v.readout(() => {
          const n = nS.value; let s = 0; for (let k = 0; k <= n; k++) s += 1 / FACT[k];
          const gap = tail(n);
          return `$s_{${n}}=${s.toFixed(10)}\\ldots$, $\\;e-s_{${n}}=${sci(gap)}$` + (n >= 1 ? ` $\\;<\\;\\frac{1}{${n}!\\cdot ${n}}=${sci(1 / (FACT[n] * n))}$` : '') + `, while the geometric column still lacks $${sci(n === 0 ? 2 : 2 ** (1 - n))}$.`;
        });
      },
    },

    // ------------------------------------------------------------------ 3.31
    {
      num: '3.31',
      kind: 'Theorem',
      name: '(1 + 1/n)^n converges to e',
      statement: String.raw`$$\lim_{n\to\infty}\Bigl(1+\frac1n\Bigr)^{n}=e.$$`,
      idea: String.raw`Expand $t_n=(1+\frac1n)^n$ by the binomial theorem: the $k$-th term is $\frac1{k!}\prod_{j<k}\bigl(1-\frac jn\bigr)\le\frac1{k!}$, so $t_n\le s_n$ and $\limsup t_n\le e$ (3.19). Conversely, keeping only the terms with $k\le m$ gives a lower bound that tends to $s_m$ as $n\to\infty$; hence $\liminf t_n\ge s_m$ for every $m$, and letting $m\to\infty$ gives $\liminf t_n\ge e$.`,
      caption: String.raw`Slide $n$: the bars show how much of each term $1/k!$ survives in the binomial expansion of $t_n$ — never more than all of it, so $t_n\le s_n$. Slide $m$: the orange curve keeps only the first $m+1$ binomial terms; it lies below $t_n$ and rises to $s_m$ (dashed), which pins $\liminf t_n$ from below.`,
      deps: ['pma-3.30', 'pma-3.19', 'pma-3.17'],
      tags: ['e', 'limits'],
      viz(v) {
        const nS = v.slider('$n$', 1, 1000, 6, { log: true, int: true });
        const mS = v.slider('$m$', 1, 8, 3, { int: true });
        const L = v.stage({ x: [-1.7, 13.5], y: [-0.08, 1.15], height: 330, axes: 'box', xlabel: 'k', weight: 1, title: 'surviving fraction $\\prod_{j<k}(1-\\frac jn)$ of $\\frac1{k!}$ in $t_n$' });
        const R = v.stage({ x: [-0.2, 3.32], y: [1.95, 2.82], height: 330, axes: 'box', weight: 1, xticks: [[0, '1'], [1, '10'], [2, '100'], [3, '1000']], xlabel: 'n', title: '$s_n\\ge t_n=(1+\\frac1n)^n\\ge$ (first $m+1$ terms) $\\to s_m$' });
        v.legend([['accent', '$t_n=(1+\\frac1n)^n$'], ['gold', '$s_n=\\sum_{k\\le n}\\frac1{k!}$'], ['orange', 'first $m+1$ binomial terms'], ['green', '$e$', { dash: true }]]);
        const frac = (k, n) => { if (k > n) return 0; let f = 1; for (let j = 1; j < k; j++) f *= 1 - j / n; return f; };
        const lowerM = (m, n) => { let s = 0; for (let k = 0; k <= m; k++) s += frac(k, n) / FACT[k]; return s; };
        const sPart = (n) => { let s = 0; for (let k = 0; k <= Math.min(n, 25); k++) s += 1 / FACT[k]; return s; };
        const NS = []; for (let i = 0; i <= 300; i++) NS.push(Math.round(10 ** (i / 100)));
        const ns = [...new Set(NS)];
        const tPts = ns.map((n) => [Math.log10(n), Math.pow(1 + 1 / n, n)]);
        const sPts = ns.map((n) => [Math.log10(n), sPart(n)]);
        v.render(() => {
          const n = nS.value, m = mS.value;
          // left: surviving fractions
          L.hline(1, { color: 'gold', width: 1.6, dash: true });
          L.tex('\\text{all of } \\tfrac1{k!}', 12.6, 1, { align: 'right', baseline: 'bottom', color: 'gold', size: 13, dy: -3 });
          const fr = Array.from({ length: 13 }, (_, k) => frac(k, n));
          L.bars(fr, { x0: 0, barWidth: 0.66, color: (_, k) => (k <= m ? 'orange' : 'accent'), fillAlpha: 0.8 });
          // right: sequences
          const sm = sPart(m);
          R.hline(Math.E, { color: 'green', width: 1.6, dash: true });
          R.tex('e', 3.0, Math.E, { align: 'right', baseline: 'bottom', color: 'green', dy: -2 });
          R.hline(sm, { color: 'orange', width: 1.2, dash: [3, 4] });
          R.tex(`s_{${m}}`, 3.0, sm, { align: 'right', baseline: 'top', color: 'orange', dy: 3, size: 14 });
          R.path(ns.filter((k) => k >= m).map((k) => [Math.log10(k), lowerM(m, k)]), { color: 'orange', width: 2.2 });
          R.path(sPts, { color: 'gold', width: 2.2 });
          R.path(tPts, { color: 'accent', width: 2.4 });
          const x = Math.log10(n);
          R.vline(x, { color: 'faint', width: 1.2 });
          R.dot(x, Math.pow(1 + 1 / n, n), { color: 'accent', r: 5.5 });
          if (n >= m) R.dot(x, lowerM(m, n), { color: 'orange', r: 4.5 });
          R.dot(x, sPart(n), { color: 'gold', r: 4.5 });
        });
        v.readout(() => {
          const n = nS.value, m = mS.value, t = Math.pow(1 + 1 / n, n);
          return `$t_{${n}}=${t.toFixed(6)}$, $\\;s_{${n}}=${sPart(n).toFixed(6)}$, $\\;e-t_{${n}}=${v.fix(Math.E - t, 5)}\\approx\\frac{e}{2n}=${v.fix(Math.E / (2 * n), 5)}$` + (n >= m ? `; $\\;$ first ${m + 1} terms: $${lowerM(m, n).toFixed(5)}\\le t_{${n}}$, tending to $s_{${m}}=${sPart(m).toFixed(5)}$.` : '.');
        });
      },
    },

    // ------------------------------------------------------------------ 3.32
    {
      num: '3.32',
      kind: 'Theorem',
      name: 'e is irrational',
      statement: String.raw`The number $e$ is irrational.`,
      idea: String.raw`The tail after $s_q=\sum_{k\le q}\frac1{k!}$ is less than a geometric series: $0<e-s_q<\frac{1}{q!\,q}$. Multiply by $q!$: the number $q!\,s_q$ is an integer, and $q!\,e$ exceeds it by a positive amount smaller than $\frac1q\le 1$. If $e=p/q$ with integers $p,q$, then $q!\,e=(q-1)!\,p$ would itself be an integer, and an integer cannot lie strictly between two consecutive integers.`,
      caption: String.raw`Choose a would-be denominator $q$. The number line is magnified by $q!$: the integers $N=q!\,s_q$ and $N+1$ are where $q!\cdot\frac pq$ would have to land (red), but $q!\,e$ (blue) is trapped in the green window $(N,\,N+\frac1q)$. Bottom: the gap $q!(e-s_q)$ for every $q$ stays strictly between $0$ and $\frac1q$.`,
      deps: ['pma-3.30'],
      tags: ['e', 'irrationality'],
      viz(v) {
        const qS = v.slider('$q$', 1, 24, 6, { int: true });
        const A = v.stage({ x: [-0.3, 1.3], y: [-0.85, 0.85], height: 170, axes: false, full: true, title: 'the number line near $q!\\,e$, magnified by $q!$' });
        const B = v.stage({ x: [-0.6, 25.6], y: [-0.08, 1.1], height: 210, axes: 'box', full: true, xlabel: 'q', xticks: [1, 4, 8, 12, 16, 20, 24], title: 'the gap $q!\\,(e-s_q)$ never reaches an integer' });
        v.legend([['accent', '$q!\\,e$', { dot: true }], ['red', 'integers: where $q!\\cdot\\frac pq=(q-1)!\\,p$ must land', { dot: true }], ['green', 'window $(N,\\,N+\\frac1q)$', { area: true }], ['orange', '$\\frac1q$', { dash: true }]]);
        // gap g_q = q!(e - s_q) = sum_{j>=1} prod_{i=1..j} 1/(q+i), computed without cancellation
        const gap = (q) => { let s = 0, t = 1; for (let i = 1; i < 60; i++) { t /= q + i; s += t; if (t < 1e-18) break; } return s; };
        const bigN = (q) => { let N = 0n, prod = 1n; for (let k = q; k >= 0; k--) { N += prod; if (k >= 1) prod *= BigInt(k); } return N; };
        v.render(() => {
          const q = qS.value, g = gap(q), N = bigN(q);
          // number line
          A.line(-0.3, 0, 1.3, 0, { color: 'ink', width: 1.6 });
          A.line(0, -0.22, 0, 0.22, { color: 'ink', width: 2 }); A.line(1, -0.22, 1, 0.22, { color: 'ink', width: 2 });
          A.rect(0, -0.13, 1 / q, 0.13, { fill: 'green', fillAlpha: 0.22, stroke: false });
          A.line(0, 0, 1 / q, 0, { color: 'green', width: 5, cap: 'butt' });
          A.measure(0, 0.42, 1 / q, 0.42, '', { color: 'orange' });
          A.tex('\\tfrac1q', 1 / (2 * q), 0.42, { baseline: 'bottom', dy: -5, color: 'orange', size: 15 });
          A.dot(0, 0, { color: 'red', r: 7, hollow: true, width: 2.4 }); A.dot(1, 0, { color: 'red', r: 7, hollow: true, width: 2.4 });
          A.dot(g, 0, { color: 'accent', r: 6 });
          A.tex('q!\\,e', g, 0, { baseline: 'bottom', dy: -12, color: 'accent', size: 16 });
          A.tex(`N=q!\\,s_q=${N}`, 0, -0.32, { baseline: 'top', color: 'ink', size: 14 });
          A.tex(`N+1`, 1, -0.32, { baseline: 'top', color: 'ink', size: 14 });
          // gaps for all q
          const pts = [], ub = [];
          for (let k = 1; k <= 24; k++) { pts.push([k, gap(k)]); }
          for (let i = 0; i <= 240; i++) { const x = 1 + (23 * i) / 240; ub.push([x, 1 / x]); }
          B.hline(1, { color: 'red', width: 1.4, dash: [4, 4] });
          B.tex('\\text{nearest positive integer}', 25.3, 1, { align: 'right', baseline: 'bottom', color: 'red', size: 13, dy: -2 });
          B.path(ub, { color: 'orange', width: 1.6, dash: true });
          B.tex('1/q', 2.2, 0.48, { color: 'orange', align: 'left', size: 14 });
          B.dots(pts, { color: 'accent', r: 3.5 });
          B.dot(q, g, { color: 'accent', r: 6.5 });
        });
        v.readout(() => {
          const q = qS.value, g = gap(q), N = bigN(q);
          return `$q=${q}$: $\\;q!\\,s_q=${N}$ is an integer and $q!\\,e=${N}.${g.toFixed(8).slice(2)}\\ldots$; since $0<q!\\,(e-s_q)=${g.toFixed(6)}<\\frac1q=${(1 / q).toFixed(6)}$, $\\;q!\\,e$ is not an integer — so $e\\neq\\frac pq$ for any integer $p$.`;
        });
      },
    },

    // ------------------------------------------------------------------ 3.33
    {
      num: '3.33',
      kind: 'Theorem',
      name: 'Root test',
      statement: String.raw`Given $\sum a_n$, let $\alpha=\limsup_{n\to\infty}\sqrt[n]{|a_n|}$. Then
(a) if $\alpha<1$, the series converges;
(b) if $\alpha>1$, the series diverges;
(c) if $\alpha=1$, the test gives no information.`,
      idea: String.raw`If $\alpha<\beta<1$, the definition of $\limsup$ (3.17) gives $N$ with $|a_n|<\beta^n$ for $n\ge N$, so the series is dominated by a convergent geometric series (3.25, 3.26). If $\alpha>1$, then $|a_n|>1$ for infinitely many $n$, so $a_n\not\to0$ and the series diverges (3.23). The series $\sum 1/n$ and $\sum 1/n^2$ both have $\alpha=1$, yet one diverges and one converges.`,
      caption: String.raw`Pick a series and drag the orange level $\beta$. Left: the roots $|a_n|^{1/n}$; any $\beta$ above $\limsup$ is crossed only finitely often (orange dots), after index $N$. Right, on a log scale: from $N$ on, $|a_n|$ lies under the geometric sequence $\beta^n$. The second series is Rudin's example where the ratio test fails (see 3.34) but the root test decides.`,
      deps: ['pma-3.17', 'pma-3.25', 'pma-3.26', 'pma-3.23'],
      see: ['pma-3.39'],
      tags: ['series', 'convergence tests'],
      viz(v) {
        const keys = ['half', 'rudin', 'poly', 'grow', 'harm', 'sq'];
        const which = v.select('', keys.map((k) => ({ value: k, label: TEST_SERIES[k].label })), 'poly');
        const NMAX = 120;
        const R = v.stage({ x: [-9, NMAX + 9], y: [0, 1.6], height: 320, axes: 'box', xlabel: 'n', weight: 1, title: 'roots $\\sqrt[n]{|a_n|}$ and the level $\\beta$' });
        const L = v.stage({ x: [-15, NMAX + 9], y: [-20, 2], height: 320, axes: 'box', xlabel: 'n', weight: 1, title: '$|a_n|$ against $\\beta^n$ (log scale)' });
        const beta = R.handle(NMAX - 4, 0.9, { color: 'orange', label: 'β', constrain: (x, y) => [NMAX - 4, v.M.clamp(y, 0.03, 1.55)] });
        v.legend([['accent', '$\\sqrt[n]{|a_n|}\\le\\beta$', { dot: true }], ['orange', 'exceeds $\\beta$ / geometric $\\beta^n$', { dot: true }], ['green', '$\\limsup\\sqrt[n]{|a_n|}=\\alpha$', { dash: true }]]);
        let state = null;
        v.render(() => {
          const S = TEST_SERIES[which.value], b = beta.y;
          const la = Array.from({ length: NMAX + 1 }, (_, n) => (n ? S.la(n) : 0));
          const roots = la.map((l, n) => (n ? Math.exp(l / n) : 0));
          let last = 0; for (let n = 1; n <= NMAX; n++) if (roots[n] > b) last = n;
          const finite = S.alpha < b;
          const N = finite ? last + 1 : Infinity;
          const aCol = S.alpha < 1 ? 'green' : S.alpha > 1 ? 'red' : 'gold';
          // left panel
          R.hline(1, { color: 'muted', width: 1.2, dash: [2, 3] });
          R.hline(S.alpha, { color: aCol, width: 1.8, dash: true });
          R.tex(`\\alpha=${S.alpha === Math.SQRT1_2 ? '1/\\sqrt2' : v.fmt(S.alpha, 3)}`, NMAX * 0.55, S.alpha, { baseline: 'top', dy: 4, color: aCol, size: 14 });
          R.hline(b, { color: 'orange', width: 1.4 });
          if (finite && N <= NMAX) R.vband(0, N - 0.5, { color: 'orange', alpha: 0.07 });
          const ok = [], bad = [];
          for (let n = 1; n <= NMAX; n++) (roots[n] > b ? bad : ok).push([n, Math.min(roots[n], 1.58)]);
          R.dots(ok, { color: 'accent', r: 2.8 }); R.dots(bad, { color: 'orange', r: 3.2 });
          if (finite && N <= NMAX) R.tex(`N=${N}`, N - 0.5, 1.56, { align: 'left', baseline: 'top', color: 'orange', size: 14, dx: 5 });
          // right panel (log10 scale)
          const lg = la.map((l) => l / Math.LN10);
          const geo = (n) => n * Math.log10(b);
          let lo = Infinity, hi = -Infinity;
          for (let n = 1; n <= NMAX; n++) { lo = Math.min(lo, lg[n], geo(n)); hi = Math.max(hi, lg[n], geo(n)); }
          lo = Math.max(lo, -60);
          const pad = (hi - lo) * 0.08 + 0.5;
          L.setView(null, [lo - pad, hi + pad]);
          L.o.yticks = tickPow10(lo - pad, hi + pad);
          const nStart = finite ? Math.max(1, N) : NMAX + 1;
          if (nStart <= NMAX) {
            const reg = []; for (let n = nStart; n <= NMAX; n++) reg.push([n, geo(n)]);
            L.poly(reg.concat([[NMAX, lo - pad * 2], [nStart, lo - pad * 2]]), { fill: 'green', fillAlpha: 0.1, stroke: false });
          }
          L.path(Array.from({ length: NMAX }, (_, i) => [i + 1, geo(i + 1)]), { color: 'orange', width: 1.8 });
          L.dots(Array.from({ length: NMAX }, (_, i) => [i + 1, lg[i + 1]]), { color: 'accent', r: 2.6 });
          if (nStart <= NMAX) L.vline(nStart, { color: 'orange', width: 1, dash: [3, 3] });
          L.corner(finite ? (b < 1 ? `|aₙ| ≤ βⁿ for n ≥ ${N}` : 'β ≥ 1: Σβⁿ diverges, no conclusion') : 'β below lim sup: crossed infinitely often', 'tr', { color: finite && b < 1 ? 'green' : 'red', weight: 600 });
          let s = 0; for (let n = 1; n <= NMAX; n++) s += Math.exp(la[n]);
          state = { S, N, finite, b, s };
        });
        v.readout(() => {
          const st = state; if (!st) return '';
          const S = st.S, a = S.alpha;
          const sum = `$\\;\\sum_{n\\le ${NMAX}}a_n=${v.fmt(st.s, 6)}$`;
          if (a < 1) return `$\\alpha=${v.fmt(a, 4)}<1$: converges.` + (st.finite && st.b < 1 ? ` With $\\beta=${v.fix(st.b, 2)}$, $|a_n|<\\beta^n$ for all $n\\ge ${st.N}$, a convergent geometric tail.` : ' Put $\\beta$ strictly between $\\alpha$ and $1$.') + sum + (S.sum != null ? ` (sum $=${v.fmt(S.sum, 6)}$).` : '.');
          if (a > 1) return `$\\alpha=${v.fmt(a, 3)}>1$: $|a_n|>1$ for infinitely many $n$, so $a_n\\not\\to 0$ and the series diverges.` + sum + '.';
          return `$\\alpha=1$: no information. $\\sum\\frac1n$ diverges and $\\sum\\frac1{n^2}$ converges, yet both have $\\sqrt[n]{|a_n|}\\to1$.` + sum + '.';
        });
        function tickPow10(a, b) {
          const span = b - a, step = span > 60 ? 20 : span > 30 ? 10 : span > 12 ? 5 : span > 6 ? 2 : 1;
          const out = []; for (let k = Math.ceil(a / step) * step; k <= b; k += step) out.push([k, pow10(k)]);
          return out;
        }
      },
    },

    // ------------------------------------------------------------------ 3.34
    {
      num: '3.34',
      kind: 'Theorem',
      name: 'Ratio test',
      statement: String.raw`The series $\sum a_n$
(a) converges if $\displaystyle\limsup_{n\to\infty}\Bigl|\frac{a_{n+1}}{a_n}\Bigr|<1$;
(b) diverges if $\Bigl|\dfrac{a_{n+1}}{a_n}\Bigr|\ge 1$ for all $n\ge n_0$, where $n_0$ is some fixed integer.`,
      idea: String.raw`If the $\limsup$ is below $\beta<1$, then from some $N$ on each term is at most $\beta$ times the previous one, so $|a_{N+p}|\le\beta^p|a_N|$ and the tail is dominated by a geometric series (3.25, 3.26). In (b) the terms never shrink after $n_0$, so $a_n\not\to0$ (3.23). The ratio test is weaker than the root test (3.37): it can be silent when the root test decides.`,
      caption: String.raw`Pick a series and drag the level $\beta$. Left: the ratios $|a_{n+1}/a_n|$ (arrows mark ratios off the top). Right: the terms themselves, and the geometric envelope $|a_N|\beta^{\,n-N}$ that bounds every later term once all ratios stay below $\beta$. For $\sum\frac1n$ every ratio is below $1$ but their $\limsup$ is $1$: no envelope with $\beta<1$ survives. For Rudin's $\frac12+\frac13+\frac1{2^2}+\cdots$ the ratios jump between $0$ and $\infty$ — the test is silent though the series converges.`,
      deps: ['pma-3.25', 'pma-3.26', 'pma-3.23'],
      see: ['pma-3.37'],
      tags: ['series', 'convergence tests'],
      viz(v) {
        const keys = ['fact', 'pow2', 'rudin', 'harm', 'grow2'];
        const which = v.select('', keys.map((k) => ({ value: k, label: TEST_SERIES[k].label })), 'pow2');
        const NMAX = 30, YT = 2.3;
        const R = v.stage({ x: [-2.2, NMAX + 2.4], y: [0, YT], height: 320, axes: 'box', xlabel: 'n', weight: 1, title: 'ratios $|a_{n+1}/a_n|$ and the level $\\beta$' });
        const T = v.stage({ x: [-2.2, NMAX + 2.4], y: [0, 1], height: 320, axes: 'box', xlabel: 'n', weight: 1, title: 'terms $|a_n|$ and the envelope $|a_N|\\,\\beta^{\\,n-N}$' });
        const beta = R.handle(NMAX - 1, 0.75, { color: 'orange', label: 'β', constrain: (x, y) => [NMAX - 1, v.M.clamp(y, 0.03, YT - 0.05)] });
        v.legend([['accent', 'ratio $\\le\\beta$ / term $|a_n|$', { dot: true }], ['orange', 'ratio $>\\beta$ / geometric envelope', { dot: true }], ['green', '$\\limsup |a_{n+1}/a_n|$', { dash: true }]]);
        let state = null;
        v.render(() => {
          const S = TEST_SERIES[which.value], b = beta.y;
          const a = Array.from({ length: NMAX + 2 }, (_, n) => (n ? Math.exp(S.la(n)) : 0));
          const r = Array.from({ length: NMAX + 1 }, (_, n) => (n ? a[n + 1] / a[n] : 0));
          const ls = S.rho[1];
          const lsCol = ls < 1 ? 'green' : ls > 1 ? 'red' : 'gold';
          // N: first index from which all ratios (in the window, and in the limit) stay <= beta
          let last = 0; for (let n = 1; n <= NMAX; n++) if (r[n] > b) last = n;
          const finite = ls < b;
          const N = finite ? last + 1 : Infinity;
          // ratio panel
          R.hline(1, { color: 'muted', width: 1.2, dash: [2, 3] });
          if (ls < YT) { R.hline(ls, { color: lsCol, width: 1.8, dash: true }); R.tex(`\\limsup=${v.fmt(ls, 3)}`, NMAX * 0.5, ls, { baseline: 'top', dy: 4, color: lsCol, size: 14 }); }
          else R.corner('lim sup = ∞', 'tl', { color: 'red', weight: 600 });
          R.hline(b, { color: 'orange', width: 1.4 });
          if (finite && N <= NMAX) R.vband(0, N - 0.5, { color: 'orange', alpha: 0.07 });
          for (let n = 1; n <= NMAX; n++) {
            const over = r[n] > b;
            if (r[n] > YT) { R.arrow(n, YT - 0.25, n, YT - 0.02, { color: 'orange', head: 7, width: 1.6 }); continue; }
            R.dot(n, r[n], { color: over ? 'orange' : 'accent', r: 3.6 });
          }
          // term panel
          const amax = Math.max(...a.slice(1, NMAX + 1));
          T.setView(null, [-amax * 0.07, amax * 1.12]);
          T.bars(a.slice(1, NMAX + 1), { x0: 1, barWidth: 0.6, color: 'accent', fillAlpha: 0.75 });
          if (finite && N <= NMAX && b < 1) {
            const env = []; for (let i = 0; i <= 200; i++) { const x = N + ((NMAX + 0.6 - N) * i) / 200; env.push([x, a[N] * b ** (x - N)]); }
            T.path(env.concat([[NMAX + 0.6, 0], [N, 0]]), { fill: 'orange', fillAlpha: 0.12, stroke: false, close: true });
            T.path(env, { color: 'orange', width: 2.2 });
            T.dot(N, a[N], { color: 'orange', r: 5, label: 'N', labelPos: 'ne' });
          }
          let tail = null;
          if (finite && b < 1 && N <= NMAX && isFinite(S.sum)) { tail = 0; for (let n = N + 1; n <= 400; n++) tail += Math.exp(S.la(n)); }
          T.corner(finite && b < 1 ? (N <= NMAX ? `ratios ≤ β from n = ${N} on` : 'need n beyond the window') : b >= 1 ? 'β ≥ 1: no geometric bound' : 'β below lim sup: no envelope', 'tr', { color: finite && b < 1 ? 'green' : 'red', weight: 600 });
          state = { S, b, N, finite, tail, aN: a[N], ls };
        });
        v.readout(() => {
          const st = state; if (!st) return '';
          const k = which.value;
          if (k === 'grow2') return 'Here $|a_{n+1}/a_n|=2\\bigl(\\frac{n}{n+1}\\bigr)^2\\ge1$ for all $n\\ge3$: part (b) applies, the terms never shrink, and the series diverges.';
          if (k === 'harm') return 'Every ratio $\\frac{n}{n+1}$ is below $1$, but $\\limsup=1$: for any $\\beta<1$ the ratios eventually exceed $\\beta$. The test is silent — and $\\sum\\frac1n$ diverges.';
          if (k === 'rudin') return 'The ratios alternate between $(\\frac23)^k\\to0$ and $\\frac12(\\frac32)^k\\to\\infty$: $\\liminf=0$, $\\limsup=\\infty$, so the ratio test says nothing. The root test (3.33) gives $\\alpha=1/\\sqrt2<1$, and indeed the sum is $\\frac32$.';
          if (st.finite && st.b < 1 && st.tail != null) return `$\\limsup=${v.fmt(st.ls, 3)}<\\beta=${v.fix(st.b, 2)}<1$: from $N=${st.N}$ on, $|a_{N+p}|\\le\\beta^p|a_N|$, so the tail $\\sum_{n>N}|a_n|=${v.fmt(st.tail, 4)}\\le|a_N|\\frac{\\beta}{1-\\beta}=${v.fmt((st.aN * st.b) / (1 - st.b), 4)}$. Sum of the series: $${v.fmt(st.S.sum, 6)}$.`;
          return `Move $\\beta$ into the gap between $\\limsup=${v.fmt(st.ls, 3)}$ and $1$.`;
        });
      },
    },
  ],
};
