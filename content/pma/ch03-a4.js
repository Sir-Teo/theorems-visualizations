// Rudin, Principles of Mathematical Analysis — Chapter 3, part 4: basic tests for series,
// geometric series and Cauchy's condensation test (3.23–3.27).

const lg = Math.log10;
const LOGTICKS = [[0, '1'], [1, '10'], [2, '100'], [3, '1000'], [4, '10⁴'], [5, '10⁵']];
const GAMMA = 0.5772156649015329;
/** Tail sum  sum_{k>N} k^{-q}  (q > 1), exact up to K terms plus an Euler–Maclaurin tail. */
function zetaTail(q, N) {
  if (q <= 1) return Infinity;
  const K = Math.max(N + 2000, 4000);
  let s = 0; for (let k = N + 1; k <= K; k++) s += Math.pow(k, -q);
  return s + Math.pow(K, 1 - q) / (q - 1) - 0.5 * Math.pow(K, -q);
}

export default {
  collection: 'pma',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.23
    {
      num: '3.23',
      kind: 'Theorem',
      name: 'Terms of a convergent series tend to 0',
      statement: String.raw`If $\sum a_n$ converges, then $\lim_{n\to\infty}a_n=0$.`,
      idea: String.raw`Take $m=n$ in the Cauchy criterion (3.22): $|a_n|\le\eps$ for all $n\ge N$. Equivalently, $a_n=s_n-s_{n-1}$ is the difference of two terms that both approach the sum $s$. The converse is false — the harmonic series has $a_n\to0$ and diverges — but the contrapositive is a useful test: if $a_n\not\to0$, the series diverges.`,
      caption: String.raw`The partial sums are drawn as a staircase against $\log_{10}n$; each riser is a term $a_n$, and the gold riser is the one at the index you choose (beyond $n=60$ the risers are too dense to separate, so the band they sweep out is shaded). For a convergent series both ends of a late riser lie in the green $\eps$-band about $s$, so the riser is at most $2\eps$. The harmonic sums have shrinking risers too, yet the staircase climbs forever; for $\sum(-1)^{n+1}$ the risers never shrink.`,
      deps: ['pma-3.22'],
      tags: ['series'],
      viz(v) {
        const NM = 10000, PI2 = Math.PI * Math.PI / 6;
        const SER = {
          sq: { label: '$\\sum 1/n^2$', a: (n) => 1 / (n * n), s: PI2 },
          alt: { label: '$\\sum(-1)^{n+1}/\\sqrt n$', a: (n) => (n % 2 ? 1 : -1) / Math.sqrt(n), s: 0.6048986434216303 },
          harm: { label: '$\\sum 1/n$', a: (n) => 1 / n, s: null },
          osc: { label: '$\\sum(-1)^{n+1}$', a: (n) => (n % 2 ? 1 : -1), s: null },
        };
        const which = v.select('', Object.entries(SER).map(([value, o]) => ({ value, label: o.label })), 'alt');
        const nS = v.slider('index $n$', 0.3, 1.77, 1.0, { step: 0.01, fmt: (x) => String(Math.round(Math.pow(10, x))) });
        const eps = 0.08;
        const T = v.stage({ x: [-0.05, 4.05], y: [0, 2], height: 300, axes: 'box', full: true, xticks: LOGTICKS.slice(0, 5), title: 'partial sums $s_n$ as a staircase (risers are the terms $a_n$)' });
        const B = v.stage({ x: [-0.05, 4.05], y: [0, 1.1], height: 160, axes: 'box', full: true, xticks: LOGTICKS.slice(0, 5), title: 'the size of the terms, $|a_n|$' });
        const cache = {};
        const ps = (key) => { if (cache[key]) return cache[key]; const s = new Float64Array(NM + 1); for (let n = 1; n <= NM; n++) s[n] = s[n - 1] + SER[key].a(n); return (cache[key] = s); };
        let st = {};
        v.render(() => {
          const key = which.value, S = SER[key], s = ps(key), n = Math.max(2, Math.round(Math.pow(10, nS.value)));
          let lo = Infinity, hi = -Infinity; for (let k = 1; k <= NM; k++) { lo = Math.min(lo, s[k]); hi = Math.max(hi, s[k]); }
          lo = Math.min(lo, 0); const pad = (hi - lo) * 0.08 + 0.05;
          T.setView(null, [lo - pad, hi + pad]);
          if (S.s != null) { T.hband(S.s - eps, S.s + eps, { color: 'green', alpha: 0.12 }); T.hline(S.s, { color: 'green', dash: [6, 4], width: 1.5 }); T.tex('s', 4.0, S.s, { color: 'green', align: 'right', baseline: 'bottom', dy: -3, size: 15 }); }
          // staircase: horizontal treads at s_k over [log k, log(k+1)], risers at log(k+1)
          const KS = 60, stair = [];
          for (let k = 1; k < KS; k++) { const x1 = lg(k + 1); stair.push([lg(k), s[k]], [x1, s[k]], [x1, s[k + 1]]); }
          T.path(stair, { color: 'accent', width: 1.6 });
          // beyond KS the risers are too dense to draw one by one: shade the band they sweep out
          const up = [], dn = []; const bins = 220, x0 = lg(KS), x1 = lg(NM);
          for (let b = 0; b < bins; b++) {
            const k0 = Math.floor(Math.pow(10, x0 + (x1 - x0) * b / bins)), k1 = Math.max(k0 + 1, Math.floor(Math.pow(10, x0 + (x1 - x0) * (b + 1) / bins)));
            let lo2 = Infinity, hi2 = -Infinity; for (let k = k0; k <= Math.min(k1, NM); k++) { lo2 = Math.min(lo2, s[k]); hi2 = Math.max(hi2, s[k]); }
            const xm = x0 + (x1 - x0) * b / bins; up.push([xm, hi2]); dn.push([xm, lo2]);
          }
          T.poly(up.concat(dn.reverse()), { fill: 'accent', fillAlpha: 0.45, color: 'accent', width: 1 });
          const xr = lg(n);
          T.line(xr, s[n - 1], xr, s[n], { color: 'gold', width: 4 });
          T.dot(xr, s[n - 1], { color: 'gold', r: 3.5 }); T.dot(xr, s[n], { color: 'gold', r: 3.5 });
          T.tex(`a_{${n}}`, xr, (s[n - 1] + s[n]) / 2, { color: 'gold', align: 'left', dx: 8, size: 14 });
          // |a_n|
          const amax = Math.max(...Array.from({ length: 10 }, (_, i) => Math.abs(S.a(i + 1))));
          B.setView(null, [-0.06 * amax, amax * 1.12]);
          if (S.s != null) B.hband(0, 2 * eps, { color: 'green', alpha: 0.12 });
          const ap = []; for (let k = 1; k <= NM; k = k < 300 ? k + 1 : Math.ceil(k * 1.01)) ap.push([lg(k), Math.abs(S.a(k))]);
          B.path(ap, { color: 'accent', width: 1.6 });
          B.dot(xr, Math.abs(S.a(n)), { color: 'gold', r: 5 });
          const conv = S.s != null;
          T.corner(conv ? 'converges: late risers are at most 2ε' : key === 'harm' ? 'risers shrink, but the staircase climbs without bound' : 'risers of height 1 forever: the series diverges', 'tl', { color: conv ? 'green' : 'red', weight: 600 });
          v.legend([['accent', 'partial sums $s_n$'], ['gold', 'the riser $a_n=s_n-s_{n-1}$'], ...(conv ? [['green', `band $s\\pm\\varepsilon$, $\\varepsilon=${eps}$`, { area: true }]] : [])]);
          st = { n, an: S.a(n), sn: s[n], key, conv };
        });
        v.readout(() => {
          const s = st; if (s.n == null) return '';
          const base = `$a_{${s.n}}=${v.fix(s.an, 5)}$, $\\ s_{${s.n}}=${v.fix(s.sn, 4)}$. `;
          if (s.conv) return base + 'Both $s_{n-1}$ and $s_n$ approach $s$, so $a_n=s_n-s_{n-1}\\to0$.';
          if (s.key === 'harm') return base + `Here $a_n\\to0$, yet $s_n>\\log n$ grows past every bound: the converse of 3.23 is false.`;
          return base + '$|a_n|=1$ for every $n$, so the contrapositive of 3.23 shows the series diverges.';
        });
      },
    },
    // ------------------------------------------------------------------ 3.24
    {
      num: '3.24',
      kind: 'Theorem',
      name: 'Nonnegative series converge iff partial sums are bounded',
      statement: String.raw`A series of nonnegative terms converges if and only if its partial sums form a bounded sequence.`,
      idea: String.raw`If every $a_n\ge0$, the partial sums satisfy $s_{n+1}=s_n+a_{n+1}\ge s_n$: they increase monotonically. A monotonic sequence converges exactly when it is bounded (3.14).`,
      caption: String.raw`The tower on the left stacks the terms $a_1,a_2,a_3,\dots$ one block at a time (press play); its height is $s_n$. Drag the orange ceiling $B$. If $B$ is at least $\sup_n s_n$ the tower never breaks through and the series converges to that supremum; for the harmonic series every ceiling is eventually broken, at the index shown.`,
      deps: ['pma-3.14', 'pma-3.21'],
      see: ['rca-1.27'],
      tags: ['series', 'monotone'],
      viz(v) {
        const NM = 10000, PI2 = Math.PI * Math.PI / 6;
        const SER = {
          geo: { label: '$\\sum 2^{-k}$', a: (k) => Math.pow(2, -k), sup: 1, top: 1.35 },
          sq: { label: '$\\sum 1/k^2$', a: (k) => 1 / (k * k), sup: PI2, top: 2.1 },
          tel: { label: '$\\sum\\frac{1}{k(k+1)}$', a: (k) => 1 / (k * (k + 1)), sup: 1, top: 1.35 },
          harm: { label: '$\\sum 1/k$', a: (k) => 1 / k, sup: Infinity, top: 10.5 },
        };
        const which = v.select('', Object.entries(SER).map(([value, o]) => ({ value, label: o.label })), 'sq');
        const TW = v.stage({ x: [-1, 1], y: [0, 2.1], height: 360, axes: false, title: 'the tower of terms' });
        const G = v.stage({ x: [-0.05, 4.05], y: [0, 2.1], height: 360, axes: 'box', xticks: LOGTICKS.slice(0, 5), title: '$s_n$ against $n$ (log scale)' });
        const Bh = G.handle(3.95, 1.5, { color: 'orange', constrain: (x, y) => [3.95, y] });
        const cache = {};
        const ps = (key) => { if (cache[key]) return cache[key]; const s = new Float64Array(NM + 1); for (let n = 1; n <= NM; n++) s[n] = s[n - 1] + SER[key].a(n); return (cache[key] = s); };
        let last = null, st = {};
        v.animate((t) => {
          const key = which.value, S = SER[key], s = ps(key);
          if (key !== last) { last = key; TW.setView(null, [0, S.top]); G.setView(null, [0, S.top]); Bh.y = isFinite(S.sup) ? S.sup + 0.12 * S.top : 5; v.restart(); }
          const n = Math.max(1, Math.min(NM, Math.round(Math.pow(10, Math.min(t, 8) / 2))));
          const B = Bh.y;
          // tower
          const w = 0.55;
          for (let k = 1; k <= Math.min(n, 60); k++) TW.rect(-w, s[k - 1], w, s[k], { fill: k % 2 ? 'accent' : 'teal', fillAlpha: 0.55, color: 'panel', width: 0.8 });
          if (n > 60) TW.rect(-w, s[60], w, s[n], { fill: 'accent', fillAlpha: 0.35, stroke: false });
          for (let k = 1; k <= 3; k++) if (s[k] - s[k - 1] > 0.06 * S.top) TW.tex(`a_${k}`, 0, (s[k - 1] + s[k]) / 2, { color: 'ink', size: 14 });
          const broke = s[n] > B;
          TW.hline(B, { color: 'orange', width: 2 });
          TW.tex('B', 0.95, B, { color: 'orange', align: 'right', baseline: 'bottom', dy: -3 });
          if (isFinite(S.sup)) { TW.hline(S.sup, { color: 'green', dash: [6, 4], width: 1.4 }); TW.tex('\\sup s_n', -0.95, S.sup, { color: 'green', align: 'left', baseline: 'bottom', dy: -3, size: 13 }); }
          TW.tex(`s_{${n}}`, w, s[n], { color: broke ? 'red' : 'accent', align: 'left', dx: 6, size: 14 });
          // graph
          const pts = []; for (let k = 1; k <= n; k = k < 200 ? k + 1 : Math.ceil(k * 1.02)) pts.push([lg(k), s[k]]);
          pts.push([lg(n), s[n]]);
          G.hline(B, { color: 'orange', width: 1.6 });
          if (isFinite(S.sup)) G.hline(S.sup, { color: 'green', dash: [6, 4], width: 1.4 });
          G.path(pts, { color: 'accent', width: 2 });
          G.dot(lg(n), s[n], { color: broke ? 'red' : 'accent', r: 5 });
          // first crossing of the ceiling
          let cross = null; for (let k = 1; k <= NM; k++) if (s[k] > B) { cross = k; break; }
          const crossEst = !cross && key === 'harm' ? Math.exp(B - GAMMA) : null;
          if (cross) { G.dot(lg(cross), s[cross], { color: 'red', r: 6.5, hollow: true, width: 2 }); G.tex(`n=${cross}`, lg(cross), s[cross], { color: 'red', align: 'right', baseline: 'bottom', dx: -6, dy: -4, size: 13 }); }
          v.legend([['accent', 'blocks of height $a_k$ and $s_n$', { area: true }], ['orange', 'ceiling $B$ (drag the handle)'], ...(isFinite(S.sup) ? [['green', '$\\sup_n s_n$', { dash: true }]] : [])]);
          st = { n, sn: s[n], B, cross, crossEst, S, key };
        }, { period: 9 });
        v.readout(() => {
          const s = st; if (!s.S) return '';
          const head = `$s_{${s.n}}=${v.fix(s.sn, 4)}$, $B=${v.fix(s.B, 3)}$: `;
          if (s.cross) return head + `the ceiling is broken at $n=${s.cross}$, so $B$ is not a bound.`;
          if (s.crossEst) return head + `not broken within $n\\le10^4$, but $s_n>\\log n$, so it is broken near $n\\approx${v.fmt(s.crossEst, 3)}$. No ceiling survives: the series diverges.`;
          return head + `never broken — the partial sums are bounded, so they increase to $\\sup_n s_n=${v.fix(s.S.sup, 4)}$, the sum.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.25
    {
      num: '3.25',
      kind: 'Theorem',
      name: 'Comparison test',
      statement: String.raw`(a) If $|a_n|\le c_n$ for all $n\ge N_0$, where $N_0$ is some fixed integer, and $\sum c_n$ converges, then $\sum a_n$ converges.
(b) If $a_n\ge d_n\ge0$ for all $n\ge N_0$ and $\sum d_n$ diverges, then $\sum a_n$ diverges.`,
      idea: String.raw`(a) By the Cauchy criterion for $\sum c_n$, for $m\ge n\ge N$ we have $\big|\sum_{k=n}^m a_k\big|\le\sum_{k=n}^m|a_k|\le\sum_{k=n}^m c_k\le\eps$, which is the Cauchy criterion (3.22) for $\sum a_n$. (b) If $\sum a_n$ converged, then by (a) — or by 3.24, since the partial sums of $\sum d_n$ would be bounded — so would $\sum d_n$.`,
      caption: String.raw`**(a)** Here $a_n=\sin(1.7n)/n^{2}$ and $c_n=1/n^q$. Each nested box starts at an index $N$ and has half-height $\sum_{k>N}c_k$: by the comparison, all later partial sums of $\sum a_n$ stay inside it, and the boxes shrink to the sum. Slide $q$: for $q\le1$ the series $\sum c_n$ diverges and no box exists; for $q>2$ the domination $|a_n|\le c_n$ fails infinitely often. **(b)** The partial sums of $\sum a_n$ are pushed to infinity by the divergent minorant $\sum d_n$.`,
      deps: ['pma-3.22', 'pma-3.24'],
      see: ['pma-7.10', 'rca-1.34'],
      tags: ['series', 'comparison'],
      viz(v) {
        const mode = v.select('', [{ value: 'a', label: 'convergent majorant (a)' }, { value: 'b', label: 'divergent minorant (b)' }], 'a');
        const qS = v.slider('$q$ in $c_n=n^{-q}$', 0.8, 2.4, 1.9, { step: 0.01 });
        const NM = 200;
        const an = (n) => Math.sin(1.7 * n) / (n * n);
        const T = v.stage({ x: [-0.05, lg(NM) + 0.05], y: [-0.2, 1.4], height: 300, axes: 'box', full: true, xticks: LOGTICKS, title: 'partial sums against $n$ (log scale)' });
        const Bt = v.stage({ x: [0, 61], y: [-1.1, 1.1], height: 190, axes: 'box', full: true, title: 'the terms against $n$' });
        const sa = new Float64Array(NM + 1); for (let n = 1; n <= NM; n++) sa[n] = sa[n - 1] + an(n);
        let total = 0; for (let n = 1; n <= 400000; n++) total += an(n);
        let st = {};
        v.render(() => {
          const m = mode.value, q = qS.value;
          if (m === 'a') {
            T.setView([-0.05, lg(NM) + 0.05], [0.55, 1.12]);
            const dominated = q <= 2 + 1e-9, conv = q > 1;
            const Ns = [2, 4, 8, 16, 32, 64, 128];
            if (dominated && conv) {
              for (const [i, N] of Ns.entries()) {
                const R = zetaTail(q, N);
                const y0 = sa[N] - R, y1 = sa[N] + R;
                T.rect(lg(N), Math.max(y0, -10), lg(NM) + 0.06, Math.min(y1, 10), { fill: 'green', fillAlpha: 0.05 + 0.025 * i, color: 'green', width: 1, alpha: 0.6 });
                T.dot(lg(N), sa[N], { color: 'green', r: 3.5 });
                if (i >= 1 && i <= 3) T.tex(`N=${N}`, lg(N), Math.min(y1, 1.12), { color: 'green', align: 'left', baseline: 'top', dx: 3, dy: 3, size: 12 });
              }
              T.hline(total, { color: 'green', dash: [6, 4], width: 1.2 });
            }
            const pts = []; for (let n = 1; n <= NM; n++) pts.push([lg(n), sa[n]]);
            T.path(pts, { color: 'accent', width: 1.6 });
            T.dots(pts, { color: 'accent', r: 2.2 });
            T.corner(!conv ? 'the majorant series diverges: the comparison gives no information' : !dominated ? 'the domination fails infinitely often: hypothesis broken' : 'every box traps all later partial sums', 'bl', { color: dominated && conv ? 'green' : 'red', weight: 600 });
            // terms with the envelope
            Bt.setView([0, 61], [-4.6, 0.3]);
            const lin = [], lout = [];
            for (let n = 1; n <= 60; n++) { const y = Math.abs(an(n)); if (y > 0) (y <= Math.pow(n, -q) + 1e-12 ? lin : lout).push([n, lg(y)]); }
            Bt.fn((x) => -q * lg(x), { domain: [0.6, 61], color: 'green', width: 2 });
            Bt.dots(lin, { color: 'accent', r: 3 }); Bt.dots(lout, { color: 'red', r: 3.6 });
            Bt.setTitle('$\\log_{10}|a_n|$ (dots; red where $|a_n|>c_n$) and $\\log_{10}c_n=-q\\log_{10}n$ (green)');
            v.legend([['accent', 'partial sums of $\\sum a_n$'], ['green', 'boxes $s_N\\pm\\sum_{k>N}c_k$', { area: true }], ['green', 'majorant $c_n=n^{-q}$']]);
            let bad = 0; for (let n = 1; n <= 60; n++) if (Math.abs(an(n)) > Math.pow(n, -q) + 1e-12) bad++;
            st = { m, q, dominated, conv, bad, R8: conv ? zetaTail(q, 8) : Infinity };
          } else {
            const a = (n) => (1 + 0.6 * Math.sin(n)) / n, d = (n) => 0.4 / n, NB = 10000;
            let A = 0, D = 0; const pa = [], pd = [], PA = [0], PD = [0];
            for (let n = 1; n <= NB; n++) { A += a(n); D += d(n); PA.push(A); PD.push(D); if (n < 100 || n % 25 === 0) { pa.push([lg(n), A]); pd.push([lg(n), D]); } }
            T.setView([-0.05, lg(NB) + 0.05], [-0.2, A * 1.12]);
            T.between((x) => PA[Math.max(1, Math.min(NB, Math.round(Math.pow(10, x))))], (x) => PD[Math.max(1, Math.min(NB, Math.round(Math.pow(10, x))))], 0, lg(NB), { fill: 'orange', fillAlpha: 0.08, n: 300 });
            T.path(pa, { color: 'accent', width: 2 });
            T.path(pd, { color: 'orange', width: 2, dash: [6, 4] });
            T.corner('the minorant sums grow without bound and drag the others along', 'tl', { color: 'red', weight: 600 });
            Bt.setView([0, 61], [-0.05, 1.7]);
            const ab = [], db = []; for (let n = 1; n <= 60; n++) { ab.push(a(n)); db.push(d(n)); }
            Bt.bars(ab, { color: 'accent', fillAlpha: 0.5, barWidth: 0.7 });
            Bt.bars(db, { color: 'orange', fillAlpha: 0.85, barWidth: 0.35 });
            Bt.setTitle('terms: $a_n=(1+0.6\\sin n)/n$ (blue) above $d_n=0.4/n$ (orange)');
            v.legend([['accent', 'partial sums of $\\sum a_n$'], ['orange', 'partial sums of $\\sum d_n$ (harmonic, scaled)', { dash: true }]]);
            st = { m, A, D };
          }
        });
        v.readout(() => {
          const s = st; if (!s.m) return '';
          if (s.m === 'b') return `$\\sum_{n\\le10^4}a_n=${v.fix(s.A, 3)}\\ \\ge\\ \\sum_{n\\le10^4}d_n=${v.fix(s.D, 3)}$, and the right side grows like $0.4\\log n$ without bound — a straight line on this axis.`;
          if (!s.conv) return `With $q=${v.fix(s.q, 2)}\\le1$ the majorant $\\sum n^{-q}$ diverges, so (a) says nothing (though $\\sum a_n$ happens to converge).`;
          if (!s.dominated) return `With $q=${v.fix(s.q, 2)}>2$, $|a_n|>c_n$ for ${s.bad} of the first 60 terms, and for infinitely many in all: the hypothesis of (a) fails.`;
          return `$q=${v.fix(s.q, 2)}$: e.g. from $N=8$ on, every partial sum stays within $\\sum_{k>8}k^{-q}=${v.fix(s.R8, 4)}$ of $s_8$. The boxes shrink to the sum $${v.fix(total, 4)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.26
    {
      num: '3.26',
      kind: 'Theorem',
      name: 'Geometric series',
      statement: String.raw`If $0\le x<1$, then $\displaystyle\sum_{n=0}^\infty x^n=\frac{1}{1-x}$. If $x\ge1$, the series diverges.`,
      idea: String.raw`For $x\ne1$ the partial sums telescope: $s_n=1+x+\dots+x^n=\dfrac{1-x^{n+1}}{1-x}$. Since $x^{n+1}\to0$ for $0\le x<1$ (3.20(e)), $s_n\to\frac1{1-x}$. For $x=1$, $s_n=n+1$; for $x\ge1$ the terms do not tend to $0$, so the series diverges (3.23).`,
      caption: String.raw`A proof without words: the squares of sides $1,x,x^2,\dots$ are laid side by side, and their upper-left corners all lie on the line through $(0,1)$ with slope $-(1-x)$. That line meets the axis at $\frac1{1-x}$, the sum. Slide $x$: as $x\to1$ the line flattens and the sum runs away; for $x\ge1$ it never comes down. The lower panel shows the remainder $\frac1{1-x}-s_n=\frac{x^{n+1}}{1-x}$ on a logarithmic scale — a straight line.`,
      deps: ['pma-3.20', 'pma-3.23', 'pma-3.21'],
      see: ['pma-3.33', 'pma-3.34', 'fa-10.7'],
      tags: ['series', 'geometric series'],
      viz(v) {
        const xS = v.slider('$x$', 0, 1.1, 0.6, { step: 0.01 });
        const nS = v.slider('squares', 1, 30, 12, { int: true });
        const S = v.stage({ x: [-0.2, 3], y: [-0.15, 1.2], height: 300, equal: true, axes: true, full: true, title: 'squares of side $x^n$ under the line $y=1-(1-x)X$' });
        const R = v.stage({ x: [0, 31], y: [-8, 1], height: 170, axes: 'box', full: true, yticks: [[-8, '10⁻⁸'], [-6, '10⁻⁶'], [-4, '10⁻⁴'], [-2, '10⁻²'], [0, '1']], title: 'remainder $\\frac{1}{1-x}-s_n$ against $n$ (log scale)' });
        let st = {};
        v.render(() => {
          const x = xS.value, n = nS.value, conv = x < 1;
          const sum = conv ? 1 / (1 - x) : Infinity;
          let pos = 0; const sq = [];
          for (let k = 0; k < n; k++) { const side = Math.pow(x, k); sq.push([pos, side]); pos += side; if (pos > 60) break; }
          const right = conv ? Math.min(sum, 40) + 0.35 : Math.min(pos, 40) + 0.35;
          const topY = Math.max(1.15, ...sq.map((q) => q[1] * 1.05));
          S.setView([-0.2, Math.max(2.2, right)], [-0.34, Math.min(topY, 12)]);
          sq.forEach(([p0, side], k) => S.rect(p0, 0, p0 + side, side, { fill: k % 2 ? 'orange' : 'gold', fillAlpha: 0.55, color: 'panel', width: 1 }));
          const X1 = S.bounds.x[1];
          S.line(0, 1, X1, 1 - (1 - x) * X1, { color: 'ink', width: 1.6 });
          sq.forEach(([p0, side]) => S.dot(p0, side, { color: 'ink', r: 2.6 }));
          if (conv) { S.dot(sum, 0, { color: 'green', r: 6 }); S.tex('\\tfrac{1}{1-x}', sum, 0, { color: 'green', align: 'left', baseline: 'top', dx: 4, dy: 8, size: 15 }); }
          S.dot(pos, 0, { color: 'accent', r: 4.5 }); S.tex(`s_{${n - 1}}`, pos, 0, { color: 'accent', align: 'right', baseline: 'top', dx: -4, dy: 8, size: 13 });
          if (!conv) S.corner(x === 1 ? 'x = 1: the line is horizontal and the partial sums are n + 1' : 'x > 1: the squares grow, so there is no finite sum', 'tl', { color: 'red', weight: 600 });
          // remainder plot
          R.setView([0, 31], [-8.5, Math.max(1, conv ? lg(1 / (1 - x)) + 0.5 : 1)]);
          if (conv && x > 0) {
            const pts = []; for (let k = 0; k <= 30; k++) { const r = Math.pow(x, k + 1) / (1 - x); pts.push([k, lg(r)]); }
            R.path(pts, { color: 'green', width: 1.6 }); R.dots(pts, { color: 'green', r: 3 });
            R.dot(n - 1, lg(Math.pow(x, n) / (1 - x)), { color: 'accent', r: 5.5 });
          } else if (!conv) R.text('no sum: the remainder is undefined', 15, -3.5, { color: 'red', align: 'center', weight: 600 });
          else R.text('x = 0: the remainder is 0 from the start', 15, -3.5, { color: 'muted', align: 'center' });
          v.legend([['gold', 'squares of side $1,x,x^2,\\dots$', { area: true }], ['ink', 'the line through all upper-left corners'], ['green', 'its zero $1/(1-x)$, the sum', { dot: true }]]);
          st = { x, n, pos, sum, conv };
        });
        v.readout(() => {
          const s = st; if (s.x == null) return '';
          if (!s.conv) return `$x=${v.fix(s.x, 2)}\\ge1$: $x^n\\not\\to0$, so the series diverges (3.23); after ${s.n} squares the total length is already $${v.fix(s.pos, 2)}$.`;
          return `$s_{${s.n - 1}}=\\frac{1-x^{${s.n}}}{1-x}=${v.fix(s.pos, 5)}$, $\\ \\frac{1}{1-x}=${v.fix(s.sum, 5)}$, remainder $\\frac{x^{${s.n}}}{1-x}=${v.fix(s.sum - s.pos, 6)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.27
    {
      num: '3.27',
      kind: 'Theorem',
      name: 'Cauchy condensation test',
      statement: String.raw`Suppose $a_1\ge a_2\ge a_3\ge\cdots\ge0$. Then $\sum_{n=1}^\infty a_n$ converges if and only if the series
$$\sum_{k=0}^\infty 2^ka_{2^k}=a_1+2a_2+4a_4+8a_8+\cdots$$
converges.`,
      idea: String.raw`By 3.24 only boundedness of the partial sums $s_n=\sum_{i\le n}a_i$ and $t_k=\sum_{j\le k}2^ja_{2^j}$ matters. Group the terms in dyadic blocks $2^j\le i<2^{j+1}$: by monotonicity each block lies between $2^ja_{2^{j+1}}$ and $2^ja_{2^j}$. Hence $s_n\le t_k$ when $n<2^{k+1}$, and $s_n\ge\tfrac12t_k$ when $n\ge2^k$; so $\{s_n\}$ and $\{t_k\}$ are bounded together.`,
      caption: String.raw`Top: the terms $a_n$ in dyadic blocks. Each block is squeezed between a green rectangle of height $a_{2^k}$ (area $2^ka_{2^k}$) and an orange one of height $a_{2^{k+1}}$ (area $\tfrac12\,2^{k+1}a_{2^{k+1}}$). Bottom, against $\log_2 n$: on each block the partial sums $s_n$ stay between the condensed bounds $\tfrac12t_k$ and $t_k$, so both converge or both diverge — for $n^{-p}$ exactly when $p>1$. The last option drops monotonicity: $a_n$ vanishes at the powers of $2$, the condensed series sees only zeros, and the sandwich collapses.`,
      deps: ['pma-3.24', 'pma-3.21'],
      see: ['pma-3.28', 'pma-3.29'],
      tags: ['series', 'condensation'],
      viz(v) {
        const SER = {
          pw: { label: '$a_n=n^{-p}$', a: (n, p) => Math.pow(n, -p), mono: true },
          log: { label: '$a_n=\\frac{1}{(n+1)\\log(n+1)}$', a: (n) => 1 / ((n + 1) * Math.log(n + 1)), mono: true },
          bad: { label: 'non-monotone: $0$ at $n=2^k$, else $\\frac1n$', a: (n) => ((n & (n - 1)) === 0 ? 0 : 1 / n), mono: false },
        };
        const which = v.select('', Object.entries(SER).map(([value, o]) => ({ value, label: o.label })), 'pw');
        const pS = v.slider('$p$', 0.5, 2.5, 1.2, { step: 0.01 });
        const KB = 5, NB = Math.pow(2, KB) - 1, KMAX = 16, NMAX = Math.pow(2, KMAX);
        const T = v.stage({ x: [0.3, NB + 0.7], y: [0, 1.08], height: 270, axes: 'box', full: true, xticks: [1, 2, 4, 8, 16, 31], title: 'terms $a_n$ in dyadic blocks $2^k\\le n<2^{k+1}$' });
        const G = v.stage({ x: [-0.3, KMAX + 0.3], y: [0, 4], height: 230, axes: 'box', full: true, xticks: [0, 2, 4, 6, 8, 10, 12, 14, 16].map((k) => [k, `2^${k}`.replace(/\^(\d+)/, (_, d) => d.split('').map((c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+c]).join(''))]), title: 'partial sums $s_n$ against $\\log_2 n$; on each block $2^k\\le n<2^{k+1}$, $\\tfrac12t_k\\le s_n\\le t_k$' });
        let st = {};
        v.render(() => {
          const key = which.value, S = SER[key], p = pS.value, a = (n) => S.a(n, p);
          // top: bars and block rectangles
          const vals = []; for (let n = 1; n <= NB; n++) vals.push(a(n));
          T.setView(null, [0, Math.max(0.2, ...vals) * 1.1]);
          for (let k = 0; k < KB; k++) { const x0 = Math.pow(2, k) - 0.5, x1 = Math.pow(2, k + 1) - 0.5; if (k % 2) T.vband(x0, x1, { color: 'gray', alpha: 0.07 }); }
          T.bars(vals, { color: 'accent', fillAlpha: 0.6, barWidth: 0.7 });
          if (S.mono) for (let k = 0; k < KB; k++) {
            const x0 = Math.pow(2, k) - 0.5, x1 = Math.pow(2, k + 1) - 0.5;
            T.rect(x0, 0, x1, a(Math.pow(2, k)), { color: 'green', width: 1.8 });
            T.rect(x0, 0, x1, a(Math.pow(2, k + 1)), { color: 'orange', width: 1.5, dash: [4, 3] });
          }
          // partial sums on a log2 axis
          let acc = 0; const sp = [];
          for (let n = 1; n <= NMAX; n++) { acc += a(n); if ((n & (n - 1)) === 0 || n % 64 === 0) sp.push([Math.log2(n), acc]); }
          const t = []; let tacc = 0; for (let k = 0; k <= KMAX; k++) { tacc += Math.pow(2, k) * a(Math.pow(2, k)); t.push(tacc); }
          const top = Math.max(...sp.map((q) => q[1]), ...t) * 1.08;
          G.setView(null, [-0.04 * Math.max(0.5, top), Math.max(0.5, top)]);
          G.path(sp, { color: 'accent', width: 2.2 });
          // on the block 2^k <= n < 2^(k+1):  t_k / 2 <= s_n <= t_k
          const U = [], Lw = [];
          for (let k = 0; k < KMAX; k++) { U.push([k, t[k]], [k + 1, t[k]]); Lw.push([k, t[k] / 2], [k + 1, t[k] / 2]); }
          G.path(U, { color: 'green', width: 2 }); G.path(Lw, { color: 'orange', width: 2 });
          G.tex('t_k', KMAX, t[KMAX - 1], { color: 'green', align: 'right', baseline: 'bottom', dy: -3, size: 14 });
          G.tex('\\tfrac12 t_k', KMAX, t[KMAX - 1] / 2, { color: 'orange', align: 'right', baseline: 'top', dy: 3, size: 14 });
          const conv = S.mono ? (key === 'pw' ? p > 1 : false) : false;
          G.corner(!S.mono ? 'sandwich broken: the condensed sums are 0 while the series diverges' : conv ? 'both bounded: both converge' : 'both unbounded: both diverge', 'tl', { color: !S.mono ? 'red' : conv ? 'green' : 'red', weight: 600 });
          v.legend([['accent', 'terms $a_n$ / partial sums $s_n$'], ['green', 'upper: height $a_{2^k}$; bound $t_k$'], ['orange', 'lower: height $a_{2^{k+1}}$; bound $\\tfrac12 t_k$']]);
          st = { key, p, conv, sN: sp[sp.length - 1][1], tK: t[KMAX], mono: S.mono };
        });
        v.readout(() => {
          const s = st; if (!s.key) return '';
          const nums = `$s_{2^{16}}=${v.fix(s.sN, 3)}$, $t_{16}=${v.fix(s.tK, 3)}$. `;
          if (!s.mono) return nums + 'Without monotonicity the condensed series converges (it is $0$) while $\\sum a_n$ diverges.';
          if (s.key === 'pw') return nums + `Condensed series: $\\sum 2^k\\,2^{-kp}=\\sum (2^{1-p})^k$, geometric with ratio $${v.fix(Math.pow(2, 1 - s.p), 3)}$ — ` + (s.conv ? 'convergent, since $p>1$.' : 'divergent, since $p\\le1$.');
          return nums + 'Condensed: $2^k a_{2^k}\\approx\\frac{1}{k\\log2}$, a harmonic-type series, so both diverge (very slowly).';
        });
      },
    },
  ],
};
