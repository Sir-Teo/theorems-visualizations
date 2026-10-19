// Probability: Theory and Examples (Durrett) — Chapter 2, part B: weak laws of large numbers (§2.2)
import { clampN, cornerIn, simpson, PhiN, sampleExp, samplePareto, sampleCauchy, sampleStPete, logInts, runningMeans, densityOn, linEdges, fracOut } from './ch02.shared.js';

const fr = (x, d = 3) => (Math.abs(x) < 5e-13 ? '0' : x.toFixed(d).replace('-', '−'));
/** log C(n, k) via the runtime's lgamma. */
const lbinom = (M, n, k) => M.lgamma(n + 1) - M.lgamma(k + 1) - M.lgamma(n - k + 1);
/** Sample X with P(X > x) = e/(x log x) for x ≥ e (Exercise 2.2.5): solve x log x = e/U by Newton. */
function sampleXlogX(r) {
  const c = Math.E / (1 - r());
  let x = Math.max(Math.E, c / Math.max(1, Math.log(c)));
  for (let i = 0; i < 8; i++) { const g = x * Math.log(x) - c; x = Math.max(Math.E, x - g / (Math.log(x) + 1)); if (Math.abs(g) < 1e-9 * c) break; }
  return x;
}

export default {
  collection: 'prob',
  chapter: 2,
  items: [
    // ======================================================================== §2.2 Weak laws of large numbers
    {
      num: '2.2.1a',
      kind: 'Definition',
      name: 'Convergence in probability',
      refs: ['Durrett, Probability: Theory and Examples, version 5 (11 January 2019), §2.2, p. 56 (convergence in probability definition)'],
      links: { source: 'https://math.duke.edu/~rtd/PTE/PTE5_011119.pdf' },
      statement: String.raw`Random variables $Y_n$ **converge in probability** to $Y$ if for every $\eps>0$
$$P(|Y_n-Y|>\eps)\to0\qquad\text{as } n\to\infty.$$
The definition only looks at the law of each $Y_n-Y$ separately, one $n$ at a time, and says nothing about the behaviour of an individual path $n\mapsto Y_n(\omega)$.`,
      idea: String.raw`Convergence in probability asks that the set where $Y_n$ is far from $Y$ have shrinking probability. That set may move around: each $\omega$ can still be visited infinitely often, so convergence in probability does not imply almost-sure convergence. Almost-sure convergence does imply it (by dominated convergence applied to $1\{|Y_n-Y|>\eps\}$), and so does $L^p$ convergence (Lemma 2.2.2). Every weak law of this section is a statement of this kind.`,
      caption: String.raw`Each row is one seeded outcome $\omega$; column $n$ is lit when $|X_n(\omega)|>\eps$, so the limit is $X=0$. Right: the exact $P(|X_n|>\eps)$ (blue) with the lit fraction of 400 rows (gold). For the "typewriter" indicators of dyadic intervals and for independent Bernoulli$(1/n)$ variables, the curve tends to $0$: convergence in probability. Yet the lit cells never stop appearing in each row, so the paths do not converge. Bernoulli$(1/n^2)$ converges both ways. The last example alternates between two halves of $\Omega$ and does not converge at all.`,
      deps: ['prob-1.3.7a'],
      see: ['stat-3.3'],
      tags: ['convergence'],
      viz(v) {
        const SEQ = {
          typ: { label: 'typewriter', X: (n, u) => { const k = Math.floor(Math.log2(n)), j = n - 2 ** k; return u >= j / 2 ** k && u < (j + 1) / 2 ** k ? 1 : 0; }, P: (n) => 2 ** -Math.floor(Math.log2(n)) },
          b1: { label: 'Bernoulli$(1/n)$', ind: (n) => 1 / n, P: (n) => 1 / n },
          b2: { label: 'Bernoulli$(1/n^2)$', ind: (n) => 1 / (n * n), P: (n) => 1 / (n * n) },
          alt: { label: 'alternating halves', X: (n, u) => ((n % 2 === 0) === (u < 0.5) ? 1 : 0), P: () => 0.5 },
        };
        const sq = v.select('sequence', Object.entries(SEQ).map(([value, o]) => ({ value, label: o.label })), 'typ');
        const eps = v.slider('$\\eps$', 0.05, 0.95, 0.5, { step: 0.05 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const N = 256, ROWS = 40;
        const L = v.stage({ x: [0.5, N + 0.5], y: [0, ROWS], height: 330, weight: 1.4, axes: 'box', gutter: true, xlabel: '$n$', yticks: [], title: 'rows $\\omega$: lit where $|X_n(\\omega)|>\\eps$' });
        const R = v.stage({ x: [1, N], xlog: true, y: [0, 1.02], height: 330, axes: 'box', gutter: true, xlabel: '$n$', title: '$P(|X_n|>\\eps)$' });
        let cache = null, st = null;
        v.render(() => {
          const S = SEQ[sq.value], key = `${sq.value}|${seed}`;
          if (!cache || cache.key !== key) {
            const r = v.rng(seed * 59 + 1), grid = [];
            for (let w = 0; w < 400; w++) { const u = r(), row = new Uint8Array(N + 1); for (let n = 1; n <= N; n++) row[n] = S.X ? S.X(n, u) : r() < S.ind(n) ? 1 : 0; grid.push(row); }
            cache = { key, grid };
          }
          const e = eps.value, g = cache.grid; // values are 0/1, so |X_n| > ε iff X_n = 1 for every ε < 1
          for (let w = 0; w < ROWS; w++) { for (let n = 1; n <= N; n++) if (g[w][n] && 1 > e) L.rect(n - 0.5, ROWS - 1 - w + 0.1, n + 0.5, ROWS - w - 0.1, { fill: 'gold', fillAlpha: 0.95, stroke: false }); }
          let late = 0; for (let w = 0; w < 400; w++) { let any = false; for (let n = 129; n <= N; n++) if (g[w][n]) { any = true; break; } if (any) late++; }
          R.fn((n) => S.P(Math.max(1, Math.round(n))), { color: 'accent', width: 2.4, n: 600 });
          const fx = []; for (const n of logInts(1, N, 40)) { let c = 0; for (let w = 0; w < 400; w++) c += g[w][n]; fx.push([n, c / 400]); }
          R.dots(fx, { r: 3, color: 'gold' });
          st = { P: S.P(N), late: late / 400 };
          v.legend([['gold', '$|X_n|>\\eps$ (cells) / lit fraction of 400 rows', { area: true }], ['accent', 'exact $P(|X_n|>\\eps)$']]);
        });
        v.readout(() => st && `$P(|X_{${N}}|>\\eps)=${fr(st.P, 4)}$. Fraction of the 400 rows still lit somewhere in $129\\le n\\le256$: $${fr(st.late, 3)}$` + (st.P < 0.05 && st.late > 0.3 ? ' — convergence in probability without convergence of the paths.' : st.P < 0.05 ? ' — the paths settle too.' : ' — no convergence.'));
      },
    },
    {
      num: '2.2.1',
      kind: 'Theorem',
      name: 'Variance of a sum of uncorrelated variables',
      statement: String.raw`Variables $X_i$ with $EX_i^2<\infty$ are **uncorrelated** if $E(X_iX_j)=EX_i\,EX_j$ for all $i\ne j$. If $X_1,\dots,X_n$ have finite second moments and are uncorrelated, then
$$\operatorname{var}(X_1+\dots+X_n)=\operatorname{var}(X_1)+\dots+\operatorname{var}(X_n).$$`,
      idea: String.raw`Expand $E\bigl(\sum_i(X_i-\mu_i)\bigr)^2$ into the diagonal terms $E(X_i-\mu_i)^2$ and twice the cross terms $E(X_i-\mu_i)(X_j-\mu_j)=E X_iX_j-\mu_i\mu_j$. Uncorrelated means exactly that the cross terms vanish. Independence (with finite second moments) is more than enough, by Theorem 2.1.13. So is pairwise independence, or the dependent but uncorrelated family $\sin(2\pi kU)$.`,
      caption: String.raw`Left: $\operatorname{var}(S_n)$ against $n$, estimated from 3000 seeded copies (dots) and computed exactly (purple), with the sum of the variances $n$ (green dashed). Every family has unit variances. Right: the exact correlation matrix of $X_1,\dots,X_{12}$. Coins, and $X_k=\sqrt2\sin(2\pi kU)$ (dependent, since all are functions of one $U$, yet uncorrelated), have a diagonal matrix, and the dots follow the green line. Positive correlation (AR with $\rho>0$, or a shared factor) bends the variance upward; negative $\rho$ bends it down.`,
      deps: ['prob-1.6.9a', 'prob-2.1.13'],
      tags: ['variance'],
      viz(v) {
        const fam = v.select('family', [{ value: 'iid', label: '$\\pm1$ coins' }, { value: 'sin', label: '$\\sqrt2\\sin(2\\pi kU)$' }, { value: 'ar', label: 'AR(1), corr. $\\rho^{|i-j|}$' }, { value: 'sh', label: 'shared factor $c$' }], 'sin');
        const rho = v.slider('$\\rho$', -0.8, 0.8, 0.5, { step: 0.05 }), cS = v.slider('$c$', 0, 0.5, 0.15, { step: 0.01 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const NN = 50, REPS = 3000;
        const L = v.stage({ x: [0, NN], y: [0, 80], height: 320, weight: 1.4, axes: 'box', gutter: true, xlabel: '$n$', title: '$\\operatorname{var}(X_1+\\dots+X_n)$' });
        const R = v.stage({ x: [0, 1], y: [0, 1], equal: true, height: 320, axes: false, title: 'correlations of $X_1,\\dots,X_{12}$' });
        let cache = null, st = null;
        v.render(() => {
          const f = fam.value, p = rho.value, c = cS.value;
          rho.el.hidden = f !== 'ar'; cS.el.hidden = f !== 'sh';
          const corr = (i, j) => (i === j ? 1 : f === 'ar' ? p ** Math.abs(i - j) : f === 'sh' ? c : 0);
          const key = `${f}|${p}|${c}|${seed}`;
          if (!cache || cache.key !== key) {
            const r = v.rng(seed * 37 + 11), s1 = new Float64Array(NN + 1), s2 = new Float64Array(NN + 1);
            for (let k = 0; k < REPS; k++) {
              const u = r(), z0 = r.normal(); let S = 0, prev = r.normal();
              for (let n = 1; n <= NN; n++) {
                let x;
                if (f === 'iid') x = r() < 0.5 ? -1 : 1;
                else if (f === 'sin') x = Math.SQRT2 * Math.sin(2 * Math.PI * n * u);
                else if (f === 'ar') { x = n === 1 ? prev : p * prev + Math.sqrt(1 - p * p) * r.normal(); prev = x; }
                else x = Math.sqrt(c) * z0 + Math.sqrt(1 - c) * r.normal();
                S += x; s1[n] += S; s2[n] += S * S;
              }
            }
            cache = { key, pts: Array.from({ length: NN }, (_, i) => { const n = i + 1, m = s1[n] / REPS; return [n, s2[n] / REPS - m * m]; }) };
          }
          const exact = (n) => { let s = 0; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) s += corr(i, j); return s; };
          const ex = Array.from({ length: NN }, (_, i) => [i + 1, exact(i + 1)]);
          const ym = Math.max(60, ...ex.map((q) => q[1]), ...cache.pts.map((q) => q[1])) * 1.08; L.setView(null, [0, ym]);
          L.line(0, 0, NN, NN, { color: 'green', width: 2.2, dash: [7, 4] });
          L.path(ex, { color: 'purple', width: 2.2 });
          L.dots(cache.pts, { r: 3, color: 'gold' });
          const K = 12, w = 1 / K;
          for (let i = 0; i < K; i++) for (let j = 0; j < K; j++) R.rect(j * w, 1 - (i + 1) * w, (j + 1) * w, 1 - i * w, { fill: v.diverge(corr(i, j), 'blue', 'red'), fillAlpha: 1, color: 'panel', width: 1 });
          st = { sim: cache.pts[NN - 1][1], ex: exact(NN) };
          v.legend([['gold', 'simulated (3000 copies)', { dot: true }], ['purple', 'exact'], ['green', '$\\sum\\operatorname{var}(X_i)=n$', { dash: true }], ['red', 'correlation $+1$', { area: true }], ['blue', '$-1$', { area: true }]]);
        });
        v.readout(() => st && `At $n=50$: simulated $\\operatorname{var}(S_{50})=${fr(st.sim, 2)}$, exact $${fr(st.ex, 2)}$, sum of variances $50$` + (Math.abs(st.ex - 50) < 1e-9 ? ': uncorrelated, so they agree.' : ': the cross terms $2\\sum_{i<j}\\operatorname{cov}(X_i,X_j)$ do not vanish.'));
      },
    },
    {
      num: '2.2.2',
      kind: 'Lemma',
      name: 'Lᵖ convergence implies convergence in probability',
      statement: String.raw`If $p>0$ and $E|Z_n|^p\to0$, then $Z_n\to0$ in probability. Quantitatively, for every $\eps>0$,
$$P(|Z_n|\ge\eps)\le\eps^{-p}\,E|Z_n|^p .$$`,
      idea: String.raw`This is Chebyshev's inequality (Theorem 1.6.4) with $\varphi(x)=x^p$: the indicator $1\{|z|\ge\eps\}$ lies below $|z|^p/\eps^p$, so its expectation does too. The converse fails. $Z_n=n\cdot1\{U<1/n\}$ tends to $0$ in probability, but $E|Z_n|^p=n^{p-1}$ does not tend to $0$ when $p\ge1$: a small chance of a huge value kills the moment and not the probability.`,
      caption: String.raw`Left: the law of $Z_n$ (grey; stems for atoms), the indicator $1\{|z|\ge\eps\}$ (red) and the dominating curve $|z|^p/\eps^p$ (orange). Integrating these against the law gives $P(|Z_n|\ge\eps)$ and the bound. Right, on log–log axes: the probability (blue) under the bound $E|Z_n|^p/\eps^p$ (orange) as $n$ grows. For $Z_n\sim$ normal$(0,1/n)$ both go to $0$. For the spike $n\cdot1\{U<1/n\}$ with $p\ge1$ the bound stays put while the probability still falls like $1/n$.`,
      deps: ['prob-1.6.4', 'prob-2.2.1a'],
      tags: ['convergence'],
      viz(v) {
        const M = v.M;
        const fam = v.select('$Z_n$', [{ value: 'norm', label: 'normal$(0,1/n)$' }, { value: 'spike', label: '$n\\cdot1\\{U<1/n\\}$' }], 'spike');
        const nS = v.slider('$n$', 1, 1000, 20, { log: true, int: true });
        const pS = v.slider('$p$', 0.25, 4, 1.5, { step: 0.05 });
        const eS = v.slider('$\\eps$', 0.1, 1, 0.5, { step: 0.05 });
        const L = v.stage({ x: [-2, 2], y: [0, 2.2], height: 320, axes: 'box', gutter: true, xlabel: '$z$', title: 'law of $Z_n$, indicator and dominator' });
        const R = v.stage({ x: [1, 1000], xlog: true, y: [1e-4, 30], ylog: true, height: 320, weight: 1.15, axes: 'box', gutter: true, xlabel: '$n$', title: 'probability vs Chebyshev bound' });
        const absMom = (p) => Math.exp((p / 2) * Math.log(2) + M.lgamma((p + 1) / 2) - 0.5 * Math.log(Math.PI)); // E|N(0,1)|^p
        const PM = (f, n, p, e) => (f === 'norm' ? { P: 2 * PhiN(M, -e * Math.sqrt(n)), B: (n ** (-p / 2) * absMom(p)) / e ** p } : { P: n >= e ? 1 / n : 0, B: n ** (p - 1) / e ** p });
        let st = null;
        v.render(() => {
          const f = fam.value, n = Math.round(nS.value), p = pS.value, e = eS.value;
          const X = f === 'norm' ? [-3, 3] : [-0.12 * n - 1, 1.12 * n + 0.5];
          L.setView(X, [0, 2.2]);
          if (f === 'norm') { const s = 1 / Math.sqrt(n), pk = 1 / (s * Math.sqrt(2 * Math.PI)), sc = 1.6 / pk; L.fn((z) => (sc * Math.exp(-z * z / (2 * s * s))) / (s * Math.sqrt(2 * Math.PI)), { color: 'muted', width: 1.6, fill: 'muted', fillAlpha: 0.18, n: 500 }); L.text(`density × ${fr(sc, 2)}`, X[1] - 0.05 * (X[1] - X[0]), 2.05, { align: 'right', size: 10.5, color: 'muted' }); }
          else { L.line(0, 0, 0, 1.6 * (1 - 1 / n), { color: 'muted', width: 6, alpha: 0.6 }); L.line(n, 0, n, Math.max(0.06, 1.6 / n), { color: 'muted', width: 6, alpha: 0.6 }); L.text(`mass 1/n at z = ${n}`, n, Math.max(0.06, 1.6 / n) + 0.12, { align: 'right', size: 10.5, color: 'muted' }); L.text(`there |z|ᵖ/εᵖ = ${(n ** p / e ** p).toPrecision(3)} ≫ 1`, n, 1.25, { align: 'right', size: 11, color: 'orange' }); L.arrow(n - 0.02 * n, 1.38, n, 2.15, { color: 'orange', width: 1.4, head: 7 }); }
          L.fn((z) => (Math.abs(z) >= e ? 1 : 0), { color: 'red', width: 2.2, n: 1200 });
          L.fn((z) => Math.abs(z) ** p / e ** p, { color: 'orange', width: 2.2, n: 800 });
          // right panel
          const ns = logInts(1, 1000, 80);
          const P = ns.map((m) => [m, Math.max(1e-6, PM(f, m, p, e).P)]), B = ns.map((m) => [m, PM(f, m, p, e).B]);
          R.path(B, { color: 'orange', width: 2.4 }); R.path(P, { color: 'accent', width: 2.4 });
          R.hline(1, { color: 'muted', dash: [4, 4], width: 1 });
          const cur = PM(f, n, p, e); R.dot(n, Math.max(1e-6, cur.P), { r: 5, color: 'accent' }); R.dot(n, Math.min(30, cur.B), { r: 5, color: 'orange' });
          st = { ...cur, n, p, f };
          v.legend([['red', '$1\\{|z|\\ge\\eps\\}$'], ['orange', '$|z|^p/\\eps^p$ and the bound $E|Z_n|^p/\\eps^p$'], ['accent', '$P(|Z_n|\\ge\\eps)$']]);
        });
        v.readout(() => st && `$n=${st.n}$: $P(|Z_n|\\ge\\eps)=${fr(st.P, 5)}\\le E|Z_n|^p/\\eps^p=${st.B > 1e4 ? v.sci(st.B, 2) : fr(st.B, 5)}$.` + (st.f === 'spike' ? (st.p >= 1 ? ` Here $E|Z_n|^p=n^{p-1}\\not\\to0$, yet $Z_n\\to0$ in probability: the converse of the lemma fails.` : ` For $p<1$, $E|Z_n|^p=n^{p-1}\\to0$ and the lemma applies.`) : ' Both tend to $0$.'));
      },
    },
    {
      num: '2.2.3',
      kind: 'Theorem',
      name: 'L² weak law of large numbers',
      statement: String.raw`Let $X_1,X_2,\dots$ be uncorrelated with $EX_i=\mu$ and $\operatorname{var}(X_i)\le C<\infty$, and let $S_n=X_1+\dots+X_n$. Then $S_n/n\to\mu$ in $L^2$ and in probability. In fact
$$E(S_n/n-\mu)^2\le\frac Cn,\qquad P(|S_n/n-\mu|>\eps)\le\frac{C}{n\eps^2}.$$`,
      idea: String.raw`$E(S_n/n)=\mu$, so the mean square error is $\operatorname{var}(S_n)/n^2$. By Theorem 2.2.1 that is $n^{-2}\sum\operatorname{var}(X_i)\le C/n$. Lemma 2.2.2 with $p=2$ turns this into convergence in probability. The bound is crude, but it is explicit and uses nothing beyond second moments and zero correlations. The typical i.i.d. case needs only $EX_i^2<\infty$.`,
      caption: String.raw`Left: 30 seeded running averages $S_n/n$ against $n$ (log scale) with the band $\mu\pm\eps$ and the envelope $\mu\pm2\sigma/\sqrt n$; the funnel narrows like $1/\sqrt n$. Right, log–log: the fraction of 1000 paths outside the band (gold) beneath Chebyshev's bound $\sigma^2/(n\eps^2)$ (orange). The bound is honest but loose; the true probability falls much faster once $\sigma/\sqrt n\ll\eps$. The family $\sqrt2\sin(2\pi kU)$ is dependent but uncorrelated, and the theorem covers it too.`,
      deps: ['prob-2.2.1', 'prob-2.2.2'],
      tags: ['law of large numbers'],
      viz(v) {
        const LAW = {
          unif: { label: 'uniform', mu: 0.5, s2: 1 / 12, d: (r) => r() },
          coin: { label: '$\\pm1$ coin', mu: 0, s2: 1, d: (r) => (r() < 0.5 ? -1 : 1) },
          exp: { label: 'exponential', mu: 1, s2: 1, d: (r) => sampleExp(r) },
          sin: { label: '$\\sqrt2\\sin(2\\pi kU)$', mu: 0, s2: 1, sin: true },
        };
        const law = v.select('law', Object.entries(LAW).map(([value, o]) => ({ value, label: o.label })), 'exp');
        const eS = v.slider('$\\eps$', 0.02, 0.5, 0.1, { step: 0.01 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const N = 5000, NS = logInts(1, N, 60);
        const L = v.stage({ x: [1, N], xlog: true, y: [-1, 3], height: 330, weight: 1.3, axes: 'box', gutter: true, xlabel: '$n$', title: '$S_n/n$ for 30 seeded paths' });
        const R = v.stage({ x: [1, N], xlog: true, y: [1e-3, 1.2], ylog: true, height: 330, axes: 'box', gutter: true, xlabel: '$n$', title: '$P(|S_n/n-\\mu|>\\eps)$' });
        let cache = null, st = null;
        v.render(() => {
          const D = LAW[law.value], e = eS.value, key = `${law.value}|${seed}`;
          if (!cache || cache.key !== key) {
            const r = v.rng(seed * 43 + 17), at = new Map(NS.map((n, i) => [n, i])), M = [], paths = [];
            for (let p = 0; p < 1000; p++) {
              const row = new Float64Array(NS.length), u = r(); let S = 0; const path = [];
              for (let n = 1; n <= N; n++) { S += D.sin ? Math.SQRT2 * Math.sin(2 * Math.PI * n * u) : D.d(r); const i = at.get(n); if (i != null) { row[i] = S / n; if (p < 30) path.push([n, S / n]); } }
              M.push(row); if (p < 30) paths.push(path);
            }
            cache = { key, M, paths };
          }
          const sd = Math.sqrt(D.s2);
          L.setView(null, [D.mu - 3.2 * sd, D.mu + 3.2 * sd]);
          L.hband(D.mu - e, D.mu + e, { color: 'green', alpha: 0.18 });
          L.fn((n) => D.mu + (2 * sd) / Math.sqrt(n), { color: 'orange', width: 1.6, dash: [5, 4] }); L.fn((n) => D.mu - (2 * sd) / Math.sqrt(n), { color: 'orange', width: 1.6, dash: [5, 4] });
          cache.paths.forEach((P, i) => L.path(P, { color: i % 3 ? 'accent' : 'teal', width: 1.1, alpha: 0.7 }));
          L.hline(D.mu, { color: 'green', width: 1.8 });
          const fx = NS.map((n, i) => { let c = 0; for (const row of cache.M) if (Math.abs(row[i] - D.mu) > e) c++; return [n, c / 1000]; });
          R.fn((n) => Math.min(1, D.s2 / (n * e * e)), { color: 'orange', width: 2.4 });
          R.dots(fx.filter((q) => q[1] > 0), { r: 3.2, color: 'gold' });
          const iN = NS.indexOf(1000) >= 0 ? NS.indexOf(1000) : NS.findIndex((n) => n >= 1000);
          st = { n: NS[iN], f: fx[iN][1], b: Math.min(1, D.s2 / (NS[iN] * e * e)), fN: fx[fx.length - 1][1], bN: D.s2 / (N * e * e) };
          v.legend([['accent', '$S_n/n$'], ['green', '$\\mu\\pm\\eps$', { area: true }], ['orange', '$\\mu\\pm2\\sigma/\\sqrt n$; Chebyshev bound', { dash: true }], ['gold', 'fraction of 1000 paths outside', { dot: true }]]);
        });
        v.readout(() => st && `At $n=${st.n}$: fraction outside $\\mu\\pm\\eps$ is $${fr(st.f, 3)}$, Chebyshev bound $${fr(st.b, 3)}$; at $n=5000$: $${fr(st.fN, 3)}$ vs $${fr(Math.min(1, st.bN), 4)}$.`);
      },
    },
    {
      num: '2.2.3a',
      kind: 'Definition',
      name: 'Independent identically distributed (i.i.d.) sequence',
      refs: ['Durrett, Probability: Theory and Examples, version 5 (11 January 2019), §2.2, p. 58 (i.i.d. definition); Theorem 2.1.21, p. 53; Theorem 2.2.14, p. 64'],
      links: { source: 'https://math.duke.edu/~rtd/PTE/PTE5_011119.pdf' },
      statement: String.raw`A sequence $X_1,X_2,\dots$ is **independent and identically distributed** (i.i.d.) if the $X_i$ are independent (every finite subfamily is) and all have the same distribution. Such sequences exist for every law on $\R$ by Kolmogorov's extension theorem. If $EX_i^2<\infty$, the $L^2$ weak law gives $S_n/n\to EX_1$ in probability; Theorem 2.2.14 shows that $E|X_i|<\infty$ suffices.`,
      idea: String.raw`"Identically distributed" is a statement about each $X_i$ alone, while "independent" is about the joint law. Both are needed and neither implies the other. A stationary autoregression has identical marginals but each value predicts the next. Independent draws whose law drifts are independent but not identically distributed. Independence plus a common law is what makes block statistics exchangeable and lets one average stand for the law.`,
      caption: String.raw`Left: 600 seeded draws in order, cut into four blocks. Middle: the four block histograms. Right: each draw against the next. For an i.i.d. stream the block histograms agree up to noise and the lag plot is a featureless product cloud. The AR(1) stream has the same marginal law, but its lag plot is tilted: the past predicts the future. The drifting stream is independent, but its blocks have different laws.`,
      deps: ['prob-2.1.1a', 'prob-1.2.1b'],
      tags: ['independence', 'foundations'],
      viz(v) {
        const M = v.M;
        const SEQ = { exp: 'i.i.d. exponential', unif: 'i.i.d. uniform', ar: 'AR(1): same law, dependent', drift: 'independent, drifting law' };
        const sq = v.select('stream', Object.entries(SEQ).map(([value, label]) => ({ value, label })), 'ar');
        let seed = 1; v.button('Resample', () => { seed++; });
        const opt = { height: 280, axes: 'box', gutter: true, minWidth: 220 };
        const A = v.stage({ ...opt, x: [0, 600], y: [-3.5, 3.5], weight: 1.5, xlabel: 'index $k$', title: 'the stream, in four blocks' });
        const B = v.stage({ ...opt, x: [-3.5, 3.5], y: [0, 0.6], xlabel: 'value', title: 'block histograms' });
        const C = v.stage({ ...opt, x: [-3.5, 3.5], y: [-3.5, 3.5], equal: true, xlabel: '$X_k$', ylabel: '$X_{k+1}$', title: 'lag plot' });
        const COL = ['accent', 'orange', 'green', 'purple'];
        let st = null;
        v.render(() => {
          const r = v.rng(seed * 71 + 5), xs = []; let prev = r.normal();
          for (let k = 0; k < 600; k++) {
            if (sq.value === 'exp') xs.push(sampleExp(r) - 1);
            else if (sq.value === 'unif') xs.push(Math.sqrt(12) * (r() - 0.5));
            else if (sq.value === 'ar') { prev = 0.85 * prev + Math.sqrt(1 - 0.85 * 0.85) * r.normal(); xs.push(prev); }
            else xs.push(r.normal() + (3 * (k - 300)) / 600);
          }
          const lo = Math.min(-3.5, ...xs) - 0.2, hi = Math.max(3.5, ...xs) + 0.2;
          A.setView(null, [lo, hi]); B.setView([lo, hi], null); C.setView([lo, hi], [lo, hi]);
          for (let b = 0; b < 4; b++) A.vband(150 * b, 150 * (b + 1), { color: COL[b], alpha: 0.07 });
          A.path(xs.map((x, k) => [k, x]), { color: 'muted', width: 0.8, alpha: 0.6 });
          for (let b = 0; b < 4; b++) A.dots(xs.slice(150 * b, 150 * (b + 1)).map((x, i) => [150 * b + i, x]), { r: 1.7, color: COL[b] });
          const E = linEdges(lo, hi, 22), Hs = [0, 1, 2, 3].map((b) => densityOn(xs.slice(150 * b, 150 * (b + 1)), E));
          B.setView(null, [0, Math.max(...Hs.flatMap((h) => h.density)) * 1.15]);
          Hs.forEach((h, b) => B.hist(h, { density: true, color: COL[b], fillAlpha: 0.06, width: 1.8 }));
          C.dots(xs.slice(0, -1).map((x, k) => [x, xs[k + 1]]), { r: 1.8, color: 'accent', alpha: 0.55 });
          const tr = M.linreg(xs.map((_, k) => k), xs), res = xs.map((x, k) => x - tr.predict(k)); // remove a linear trend first
          const lag = M.linreg(res.slice(0, -1), res.slice(1)).r;
          const ks = (a, b) => { a = a.slice().sort((x, y) => x - y); b = b.slice().sort((x, y) => x - y); let i = 0, j = 0, D = 0; while (i < a.length && j < b.length) { if (a[i] <= b[j]) i++; else j++; D = Math.max(D, Math.abs(i / a.length - j / b.length)); } return D; };
          let D = 0; for (let b = 1; b < 4; b++) D = Math.max(D, ks(xs.slice(0, 150), xs.slice(150 * b, 150 * (b + 1))));
          st = { lag, D, crit: 1.36 * Math.sqrt(2 / 150) };
          v.legend(COL.map((c, b) => [c, `block ${b + 1}`, { area: true }]));
        });
        v.readout(() => st && `Lag-1 correlation after removing the linear trend: $${fr(st.lag, 3)}$ (noise level about $\\pm0.08$). Largest Kolmogorov–Smirnov distance between block 1 and another block: $${fr(st.D, 3)}$ (5% noise level $${fr(st.crit, 3)}$).` + (Math.abs(st.lag) > 0.15 ? ' **Not independent**: each value predicts the next' + (st.D > st.crit ? ', and so the blocks wander more than i.i.d. noise allows.' : '.') : st.D > st.crit * 1.15 ? ' **Not identically distributed.**' : ' Consistent with i.i.d.'));
      },
    },
    {
      num: '2.2.4',
      kind: 'Theorem',
      name: 'Bernstein polynomials and Weierstrass approximation',
      credit: 'Bernstein, 1912',
      statement: String.raw`Let $f$ be continuous on $[0,1]$ and let
$$f_n(x)=\sum_{m=0}^n\binom nm x^m(1-x)^{n-m}f(m/n)$$
be its Bernstein polynomial of degree $n$. Then $\sup_{x\in[0,1]}|f_n(x)-f(x)|\to0$ as $n\to\infty$. In particular, polynomials are uniformly dense in $C[0,1]$.`,
      idea: String.raw`If $S_n$ is binomial$(n,x)$ then $f_n(x)=Ef(S_n/n)$, and the $L^2$ weak law says $S_n/n$ concentrates at $x$. To make it uniform in $x$, use the proof rather than the statement: $P(|S_n/n-x|>\delta)\le x(1-x)/(n\delta^2)\le1/(4n\delta^2)$ for every $x$. With $M=\sup|f|$ and $\omega(\delta)$ the modulus of continuity, Jensen's inequality gives $|f_n(x)-f(x)|\le\omega(\delta)+2M/(4n\delta^2)$ for all $x$. Let $n\to\infty$, then $\delta\to0$.`,
      caption: String.raw`Left: $f$ (black) and $f_n$ (blue). Drag the gold point $x$. The bars along the bottom are the binomial weights $P(S_n=m)$, and the dots $(m/n,f(m/n))$ are sized by them, so $f_n(x)$ is their weighted average: only nodes near $x$ count. Choose a preset, or draw your own $f$ by dragging on the panel. Right: the exact sup error against $n$ (blue) under the bound $\min_\delta\bigl[\omega(\delta)+M/(2n\delta^2)\bigr]$ from the proof (orange).`,
      deps: ['prob-2.2.3'],
      see: ['pma-7.26', 'num-4.2', 'cg-7.2'],
      tags: ['law of large numbers', 'approximation'],
      viz(v) {
        const M = v.M, K = 200;
        const PRE = { tent: { label: '$|x-\\tfrac12|$', f: (x) => Math.abs(x - 0.5) }, wave: { label: '$\\sin 2\\pi x$ + kink', f: (x) => 0.35 * Math.sin(2 * Math.PI * x) + 0.4 * Math.abs(x - 0.7) }, ramp: { label: 'steep ramp', f: (x) => 0.5 + 0.45 * Math.tanh(25 * (x - 0.45)) } };
        let F = Float64Array.from({ length: K + 1 }, (_, i) => PRE.tent.f(i / K)), ver = 0;
        const pre = v.select('$f$', Object.entries(PRE).map(([value, o]) => ({ value, label: o.label })), 'wave', { onChange: (k) => { F = Float64Array.from({ length: K + 1 }, (_, i) => PRE[k].f(i / K)); ver++; } });
        F = Float64Array.from({ length: K + 1 }, (_, i) => PRE.wave.f(i / K));
        const nS = v.slider('$n$', 1, 400, 12, { log: true, int: true });
        const L = v.stage({ x: [0, 1], y: [-0.75, 1], height: 340, weight: 1.35, axes: 'box', gutter: true, xlabel: '$x$', title: '$f$, $f_n$ and the weights at $x$ — drag to draw $f$' });
        const R = v.stage({ x: [1, 400], xlog: true, y: [1e-3, 1], ylog: true, height: 330, axes: 'box', gutter: true, xlabel: '$n$', title: '$\\sup|f_n-f|$ and the proof’s bound' });
        const hx = L.handle(0.3, -0.75, { color: 'gold', label: 'x', labelPos: 'e', constrain: (x) => [clampN(x, 0, 1), L.yr[0]] });
        let lastX = null;
        L.onDrag((x, y, phase) => {
          if (hx.dragging) return;
          const i0 = Math.round(clampN(x, 0, 1) * K), y0 = clampN(y, -0.45, 0.98);
          const from = phase === 'start' || lastX == null ? i0 : lastX;
          for (let i = Math.min(from, i0); i <= Math.max(from, i0); i++) F[i] = y0;
          for (let i = Math.max(0, i0 - 3); i <= Math.min(K, i0 + 3); i++) if (i < Math.min(from, i0) || i > Math.max(from, i0)) F[i] = 0.6 * F[i] + 0.4 * y0;
          lastX = phase === 'end' ? null : i0; ver++; v.invalidate();
        });
        const fAt = (x) => { const u = clampN(x, 0, 1) * K, i = Math.min(K - 1, Math.floor(u)), t = u - i; return F[i] * (1 - t) + F[i + 1] * t; };
        const bern = (n, x) => { if (x <= 0) return fAt(0); if (x >= 1) return fAt(1); let s = 0; const lx = Math.log(x), l1 = Math.log(1 - x); for (let m = 0; m <= n; m++) s += Math.exp(lbinom(M, n, m) + m * lx + (n - m) * l1) * fAt(m / n); return s; };
        let ecache = null, st = null;
        v.render(() => {
          const n = Math.round(nS.value), x = hx.x;
          if (!ecache || ecache.ver !== ver) {
            const ns = logInts(1, 400, 22), err = ns.map((m) => { let e = 0; for (let i = 0; i <= 120; i++) { const t = i / 120; e = Math.max(e, Math.abs(bern(m, t) - fAt(t))); } return [m, Math.max(e, 1e-4)]; });
            const Mx = Math.max(...F.map(Math.abs)), om = (d) => { const s = Math.round(d * K); let w = 0; for (let i = 0; i + s <= K; i++) for (let j = i; j <= i + s; j++) w = Math.max(w, Math.abs(F[j] - F[i])); return w; };
            const ds = Array.from({ length: 30 }, (_, i) => 0.01 * 1.15 ** i), oms = ds.map(om);
            const bound = ns.map((m) => [m, Math.min(...ds.map((d, i) => oms[i] + Mx / (2 * m * d * d)))]);
            ecache = { ver, err, bound };
          }
          L.fn(fAt, { color: 'ink', width: 2.2, n: 400 });
          L.fn((t) => bern(n, t), { color: 'accent', width: 2.6, n: 300 });
          const w = Array.from({ length: n + 1 }, (_, m) => (x <= 0 ? +(m === 0) : x >= 1 ? +(m === n) : Math.exp(lbinom(M, n, m) + m * Math.log(x) + (n - m) * Math.log(1 - x))));
          const wmax = Math.max(...w), bw = Math.min(0.012, 0.6 / (n + 1));
          w.forEach((p, m) => { L.rect(m / n - bw, -0.75, m / n + bw, -0.75 + (0.25 * p) / wmax, { fill: 'orange', fillAlpha: 0.7, stroke: false }); if (n <= 60) L.dot(m / n, fAt(m / n), { r: 1.5 + 6 * Math.sqrt(p / wmax), color: 'orange', alpha: 0.8 }); });
          const fn = bern(n, x);
          L.vline(x, { color: 'gold', dash: [4, 4], width: 1.2 });
          L.dot(x, fn, { r: 5.5, color: 'accent' }); L.dot(x, fAt(x), { r: 4, color: 'ink', hollow: true });
          R.path(ecache.bound, { color: 'orange', width: 2.4 });
          R.path(ecache.err, { color: 'accent', width: 2.4 });
          const cur = ecache.err.reduce((b, q) => (Math.abs(Math.log(q[0] / n)) < Math.abs(Math.log(b[0] / n)) ? q : b));
          R.dot(cur[0], cur[1], { r: 5, color: 'accent' });
          st = { n, x, fn, f: fAt(x), err: cur[1], nn: cur[0] };
          v.legend([['ink', '$f$'], ['accent', '$f_n=E f(S_n/n)$'], ['orange', 'binomial weights; proof bound']]);
        });
        v.readout(() => st && `At $x=${fr(st.x, 2)}$: $f_n(x)=E f(S_n/n)=${fr(st.fn, 4)}$, $f(x)=${fr(st.f, 4)}$. Sup error at $n\\approx${st.nn}$: $${fr(st.err, 4)}$, and it keeps falling as $n$ grows.`);
      },
    },
    {
      num: '2.2.5',
      kind: 'Phenomenon',
      name: 'High-dimensional cubes concentrate near a sphere',
      statement: String.raw`Let $X_1,X_2,\dots$ be independent and uniform on $(-1,1)$, and let $|x|$ be the Euclidean norm. Then $(X_1^2+\dots+X_n^2)/n\to1/3$ in probability. Equivalently, for every $\eps>0$, the shell
$$A_{n,\eps}=\bigl\{x\in\R^n:(1-\eps)\sqrt{n/3}<|x|<(1+\eps)\sqrt{n/3}\bigr\}$$
holds a fraction tending to $1$ of the volume of the cube $(-1,1)^n$: most of a high-dimensional cube lies near the sphere of radius $\sqrt{n/3}$.`,
      idea: String.raw`The $Y_i=X_i^2$ are i.i.d. (functions of independent variables) with $EY_i=1/3$ and $\operatorname{var}(Y_i)=1/5-1/9=4/45$. The $L^2$ weak law gives $\frac1n\sum Y_i\to\frac13$, which is $|X|/\sqrt n\to1/\sqrt3$. Since $X$ is uniform on the cube, the probability that it lies in the shell is exactly the volume fraction. The corners of the cube are far out and the faces are close in, but almost all of the volume sits at the typical radius.`,
      caption: String.raw`Slide the dimension $n$. Left: the histogram of $|X|/\sqrt n$ for $3000$ seeded points uniform in the cube, with the shell $(1\pm\eps)/\sqrt3$ in green. For $n=1,2$ the radius is spread out; by $n=1000$ it is a spike at $1/\sqrt3\approx0.577$. Right: the volume fraction inside the shell against $n$, estimated by Monte Carlo (gold), above the lower bound from Chebyshev's inequality in the proof (orange).`,
      deps: ['prob-2.2.3'],
      tags: ['law of large numbers', 'concentration'],
      viz(v) {
        const nS = v.slider('dimension $n$', 1, 2000, 30, { log: true, int: true });
        const eS = v.slider('$\\eps$', 0.02, 0.3, 0.1, { step: 0.01 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const L = v.stage({ x: [0, 1.2], y: [0, 10], height: 320, weight: 1.25, axes: 'box', gutter: true, xlabel: '$|X|/\\sqrt n$', title: 'radius of a uniform point in $(-1,1)^n$' });
        const R = v.stage({ x: [1, 2000], xlog: true, y: [0, 1.05], height: 320, axes: 'box', gutter: true, xlabel: '$n$', title: 'volume fraction in the shell $A_{n,\\eps}$' });
        const c = 1 / Math.sqrt(3), NS = logInts(1, 2000, 24);
        let cache = null, st = null;
        const radii = (r, n, k) => Array.from({ length: k }, () => { let s = 0; for (let i = 0; i < n; i++) { const u = 2 * r() - 1; s += u * u; } return Math.sqrt(s / n); });
        v.render(() => {
          const n = Math.round(nS.value), e = eS.value;
          if (!cache || cache.seed !== seed) { const r = v.rng(seed * 5 + 1); cache = { seed, grid: NS.map((m) => radii(r, m, 400)), cur: {} }; }
          if (!cache.cur[n]) cache.cur[n] = radii(v.rng(seed * 9 + n), n, 3000);
          const xs = cache.cur[n], Hs = densityOn(xs, linEdges(0, 1.2, 96));
          L.setView(null, [0, Math.max(...Hs.density) * 1.15]);
          L.vband(c * (1 - e), c * (1 + e), { color: 'green', alpha: 0.18 });
          L.hist(Hs, { density: true, color: 'accent', fillAlpha: 0.35 });
          L.vline(c, { color: 'green', width: 2, dash: [6, 4] });
          L.text('1/√3', c, L.yr[1] * 0.95, { align: 'center', size: 11, color: 'green' });
          const inShell = (rs) => rs.filter((x) => Math.abs(x - c) < c * e).length / rs.length;
          const dlt = (2 * e - e * e) / 3;
          R.fn((m) => Math.max(0, 1 - 4 / 45 / (m * dlt * dlt)), { color: 'orange', width: 2.2 });
          R.dots(NS.map((m, i) => [m, inShell(cache.grid[i])]), { r: 3.2, color: 'gold' });
          const fr0 = inShell(xs); R.dot(n, fr0, { r: 6, color: 'accent' });
          st = { n, fr0, bound: Math.max(0, 1 - 4 / 45 / (n * dlt * dlt)), mean: xs.reduce((a, b) => a + b, 0) / xs.length };
          v.legend([['accent', 'histogram (3000 points)', { area: true }], ['green', 'shell $(1\\pm\\eps)/\\sqrt3$', { area: true }], ['gold', 'Monte Carlo fraction', { dot: true }], ['orange', 'Chebyshev lower bound']]);
        });
        v.readout(() => st && `$n=${st.n}$: mean radius $${fr(st.mean, 4)}\\sqrt n$ (target $0.5774\\sqrt n$); fraction of the cube inside the shell $${fr(st.fr0, 3)}$, guaranteed at least $${fr(st.bound, 3)}$ by $P(|\\bar Y-\\tfrac13|\\ge\\delta)\\le\\frac{4/45}{n\\delta^2}$.`);
      },
    },
    {
      num: '2.2.6',
      kind: 'Theorem',
      name: 'Weak law from a variance bound',
      statement: String.raw`Let $S_n$ be any random variables with $\mu_n=ES_n$ and $\sigma_n^2=\operatorname{var}(S_n)$ finite. If $b_n>0$ and $\sigma_n^2/b_n^2\to0$, then
$$\frac{S_n-\mu_n}{b_n}\to0\quad\text{in probability}.$$
No independence is assumed. A typical use is a row sum $S_n=X_{n,1}+\dots+X_{n,n}$ of a triangular array.`,
      idea: String.raw`$E\bigl((S_n-\mu_n)/b_n\bigr)^2=\sigma_n^2/b_n^2\to0$, and Lemma 2.2.2 with $p=2$ finishes. The content lies in the applications, where $\mu_n$ and $\sigma_n^2$ are computed from the structure of the problem. Durrett's occupancy problem is one: drop $r$ balls into $n$ boxes and count the empty boxes $N_n$. The indicators $1\{\text{box }i\text{ empty}\}$ are dependent, but $\operatorname{var}(N_n)$ can be computed exactly and grows only linearly in $n$. So $N_n/n\to e^{-c}$ when $r/n\to c$.`,
      caption: String.raw`The occupancy problem with $r=cn$ balls in $n$ boxes; $N_n$ is the number of empty boxes. Choose the normalizer $b_n=n^\alpha$. Left: histograms of $(N_n-\mu_n)/b_n$ for $n=30,300,3000$ (400 seeded repetitions each). Right: the exact ratio $\sigma_n/b_n$ against $n$. For $\alpha>1/2$ it falls and the histograms collapse onto $0$. For $\alpha<1/2$ they spread out: $\sigma_n\sim\sqrt n$, so $\alpha=1/2$ is the borderline. With $\alpha=1$ this is the weak law $N_n/n\to e^{-c}$.`,
      deps: ['prob-2.2.2'],
      tags: ['law of large numbers'],
      viz(v) {
        const aS = v.slider('normalizer $b_n=n^\\alpha$, $\\alpha=$', 0.25, 1, 0.65, { step: 0.01 });
        const cS = v.slider('balls per box $c$', 0.2, 3, 1, { step: 0.05 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const L = v.stage({ x: [-2, 2], y: [0, 1], height: 320, weight: 1.3, axes: 'box', gutter: true, xlabel: '$(N_n-\\mu_n)/b_n$', title: 'centred and scaled empty-box counts' });
        const R = v.stage({ x: [10, 1e5], xlog: true, y: [0.01, 30], ylog: true, height: 320, axes: 'box', gutter: true, xlabel: '$n$', title: '$\\sigma_n/b_n$ (exact)' });
        const NS = [30, 300, 3000], COL = ['purple', 'orange', 'accent'];
        const mom = (n, r) => { const q1 = (1 - 1 / n) ** r, q2 = (1 - 2 / n) ** r; return { mu: n * q1, var: n * (n - 1) * q2 + n * q1 - n * n * q1 * q1 }; };
        let cache = null, st = null;
        v.render(() => {
          const a = aS.value, c = cS.value, key = `${c}|${seed}`;
          if (!cache || cache.key !== key) {
            const r = v.rng(seed * 13 + 3);
            cache = { key, N: NS.map((n) => { const rr = Math.round(c * n), box = new Uint8Array(n), out = []; for (let k = 0; k < 400; k++) { box.fill(0); for (let b = 0; b < rr; b++) box[Math.floor(r() * n)] = 1; let e = 0; for (let i = 0; i < n; i++) if (!box[i]) e++; out.push(e); } return out; }) };
          }
          let ym = 0; const Hs = NS.map((n, i) => { const { mu } = mom(n, Math.round(c * n)); const h = densityOn(cache.N[i].map((x) => (x - mu) / n ** a), linEdges(-2, 2, 100)); ym = Math.max(ym, ...h.density); return h; });
          L.setView(null, [0, Math.min(ym * 1.12, 40)]);
          Hs.forEach((h, i) => L.hist(h, { density: true, color: COL[i], fillAlpha: 0.15, width: 1.8 }));
          L.vline(0, { color: 'green', width: 1.6, dash: [5, 4] });
          const ns = logInts(10, 1e5, 60);
          R.path(ns.map((n) => [n, Math.sqrt(Math.max(0, mom(n, Math.round(c * n)).var)) / n ** a]), { color: 'accent', width: 2.6 });
          R.path(ns.map((n) => [n, Math.sqrt(Math.max(0, mom(n, Math.round(c * n)).var)) / Math.sqrt(n)]), { color: 'muted', width: 1.4, dash: [5, 4] });
          NS.forEach((n, i) => R.dot(n, Math.sqrt(mom(n, Math.round(c * n)).var) / n ** a, { r: 5, color: COL[i] }));
          const big = mom(3000, Math.round(c * 3000)), frac = cache.N[2].reduce((s, x) => s + x, 0) / 400 / 3000;
          const out = cache.N[2].filter((x) => Math.abs(x - big.mu) / 3000 ** a > 0.5).length / 400;
          st = { a, c, frac, ec: Math.exp(-c), out, sd: Math.sqrt(big.var) };
          v.legend([...NS.map((n, i) => [COL[i], `$n=${n}$`, { area: true }]), ['muted', '$\\alpha=1/2$ reference', { dash: true }]]);
        });
        v.readout(() => st && `$n=3000$: $\\sigma_n=${fr(st.sd, 2)}$ (about $\\sqrt n$ times a constant); fraction of repetitions with $|N_n-\\mu_n|/b_n>0.5$: $${fr(st.out, 3)}$. Average $N_n/n=${fr(st.frac, 4)}$ vs $e^{-c}=${fr(st.ec, 4)}$.` + (st.a > 0.5 ? ' Since $\\alpha>1/2$, $\\sigma_n/b_n\\to0$: weak law.' : ' Since $\\alpha\\le1/2$, $\\sigma_n/b_n\\not\\to0$: no concentration at this scale.'));
      },
    },
    {
      num: '2.2.7',
      kind: 'Theorem',
      name: 'Coupon collector’s problem',
      statement: String.raw`Draw $X_1,X_2,\dots$ i.i.d. uniform on $\{1,\dots,n\}$ and let $T_n$ be the first time all $n$ values have appeared. Then $ET_n=n\sum_{m=1}^n\frac1m\sim n\log n$ and
$$\frac{T_n}{n\log n}\to1\quad\text{in probability}.$$
For $n=365$ birthdays this predicts about $365\log365\approx2153$ draws.`,
      idea: String.raw`Split $T_n$ into waiting times: after $k-1$ distinct values, the wait $X_{n,k}$ for a new one is geometric with success probability $1-\frac{k-1}n$, and these waits are independent. So $ET_n=\sum_kn/(n-k+1)=n\sum_m1/m$, and by Theorem 2.2.1 $\operatorname{var}(T_n)\le\sum_k\bigl(n/(n-k+1)\bigr)^2\le n^2\sum_m m^{-2}$. With $\log n\le\sum_{m\le n}1/m\le1+\log n$, Theorem 2.2.6 with $b_n=n\log n$ gives the result: the standard deviation is of order $n$, while the mean is $n\log n$.`,
      caption: String.raw`Watch one seeded run. Left: the $n$ coupon types, each lit when first collected; the last few take longest. Middle: the number of distinct types against the number of draws (gold), with its mean $n\bigl(1-(1-1/n)^m\bigr)$ (green); the run ends at $T_n$. Right: the histogram of $T_n/(n\log n)$ over 600 seeded runs. As $n$ grows it tightens around $1$, slowly, because $\sum_{m\le n}1/m-\log n\to0.577\ldots$ shifts the centre by $0.577/\log n$.`,
      deps: ['prob-2.2.6'],
      see: ['algo-12.6'],
      tags: ['law of large numbers', 'combinatorics'],
      viz(v) {
        const nS = v.slider('$n$ types', 10, 2000, 100, { log: true, int: true });
        let seed = 1; v.button('Resample', () => { seed++; });
        const A = v.stage({ x: [0, 1], y: [0, 1], equal: true, height: 290, axes: false, title: 'one run: types collected', minWidth: 220 });
        const B = v.stage({ x: [0, 1000], y: [0, 105], height: 290, axes: 'box', gutter: true, xlabel: 'draws $m$', title: 'distinct types so far', minWidth: 220 });
        const C = v.stage({ x: [0.4, 2], y: [0, 3], height: 290, axes: 'box', gutter: true, xlabel: '$T_n/(n\\log n)$', title: 'law of $T_n/(n\\log n)$', minWidth: 220 });
        let run = null, hist = null, st = null;
        v.animate((t) => {
          const n = Math.round(nS.value);
          if (!run || run.n !== n || run.seed !== seed) {
            const r = v.rng(seed * 7 + n), got = new Int32Array(n).fill(-1), curve = [[0, 0]]; let m = 0, k = 0;
            while (k < n) { const x = Math.floor(r() * n); m++; if (got[x] < 0) { got[x] = m; k++; curve.push([m, k]); } }
            run = { n, seed, got, T: m, curve };
            const rr = v.rng(seed * 97 + n), Ts = [];
            for (let j = 0; j < 600; j++) { let mm = 0, kk = 0; const g = new Uint8Array(n); while (kk < n) { const x = Math.floor(rr() * n); mm++; if (!g[x]) { g[x] = 1; kk++; } } Ts.push(mm / (n * Math.log(n))); }
            hist = Ts;
          }
          const T = run.T, mNow = Math.min(T, Math.round(T * Math.min(1, (t % 10) / 8)));
          // coupons grid
          const cols = Math.ceil(Math.sqrt(n)), rows = Math.ceil(n / cols), cw = 1 / Math.max(cols, rows), gap = cw * 0.12;
          for (let i = 0; i < n; i++) { const cx = (i % cols) * cw, cy = 1 - (Math.floor(i / cols) + 1) * cw; const g = run.got[i] > 0 && run.got[i] <= mNow; if (g) A.rect(cx + gap, cy + gap, cx + cw - gap, cy + cw - gap, { fill: run.got[i] > 0.5 * T ? 'red' : 'gold', fillAlpha: 0.85, stroke: false }); else A.rect(cx + gap, cy + gap, cx + cw - gap, cy + cw - gap, { color: 'faint', width: 1.2, fill: false }); }
          // progress
          B.setView([0, T * 1.05], [0, n * 1.05]);
          B.fn((m) => n * (1 - (1 - 1 / n) ** m), { color: 'green', width: 2, dash: [6, 4] });
          const cv = run.curve.filter((q) => q[0] <= mNow); cv.push([mNow, cv[cv.length - 1][1]]);
          B.path(cv, { color: 'gold', width: 2.4 });
          B.vline(n * Math.log(n), { color: 'muted', dash: [3, 3], width: 1.2 });
          if (mNow >= T) B.dot(T, n, { r: 5, color: 'red' });
          const Hs = densityOn(hist, linEdges(0.4, 2, 64));
          C.setView(null, [0, Math.max(...Hs.density) * 1.15]);
          C.hist(Hs, { density: true, color: 'accent', fillAlpha: 0.3 });
          const Hn = Array.from({ length: n }, (_, i) => 1 / (i + 1)).reduce((a, b) => a + b, 0);
          C.vline(1, { color: 'green', width: 2, dash: [6, 4] }); C.vline(Hn / Math.log(n), { color: 'orange', width: 2 });
          const mean = hist.reduce((a, b) => a + b, 0) / hist.length, sd = Math.sqrt(hist.reduce((a, b) => a + (b - mean) ** 2, 0) / hist.length);
          st = { n, T, mNow, k: cv[cv.length - 1][1], mean, sd, ET: n * Hn, nl: n * Math.log(n) };
          v.legend([['gold', 'collected (red: in the second half of the run)', { area: true }], ['green', 'expected count; limit 1', { dash: true }], ['orange', '$ET_n/(n\\log n)$'], ['red', '$T_n$', { dot: true }]]);
        }, { period: 10, still: 9 });
        v.readout(() => st && `This run: ${st.k} of ${st.n} types after $${st.mNow}$ draws; complete at $T_n=${st.T}$ ($n\\log n=${fr(st.nl, 0)}$, $ET_n=${fr(st.ET, 0)}$). Over 600 runs: $T_n/(n\\log n)$ has mean $${fr(st.mean, 3)}$ and standard deviation $${fr(st.sd, 3)}$, which shrinks like $1/\\log n$.`);
      },
    },
    {
      num: '2.2.9',
      kind: 'Lemma',
      name: 'Random permutations: independent cycle-closing indicators',
      statement: String.raw`Pick a permutation $\pi$ of $\{1,\dots,n\}$ uniformly at random and write it in cycle form, starting each cycle at the smallest element not yet used: $(1\,\pi(1)\,\pi^2(1)\dots)(\dots)\cdots$. Let $X_{n,k}=1$ if the $k$-th symbol written closes a cycle. Then $X_{n,1},\dots,X_{n,n}$ are independent with
$$P(X_{n,k}=1)=\frac1{n-k+1}.$$
Consequently the number of cycles $S_n=\sum_kX_{n,k}$ has $ES_n=\sum_{m=1}^n1/m\sim\log n$, and $S_n/\log n\to1$ in probability.`,
      idea: String.raw`Build $\pi$ while writing it down: at step $k$, the image of the current symbol is chosen uniformly among the $n-k+1$ values not yet used as images. Exactly one of them, the start of the current cycle, closes the cycle, whatever happened before. That gives independence and the probability $1/(n-k+1)$. Then $\operatorname{var}(S_n)\le\sum_kEX_{n,k}^2=ES_n$, and Theorem 2.2.6 with $b_n=(\log n)^{0.5+\eps}$ gives the weak law.`,
      caption: String.raw`Step through the construction. Left: the arrows $i\to\pi(i)$ written so far; green arrows closed a cycle. Below is the cycle notation, with a $\checkmark$ under each symbol whose $X_{n,k}=1$. The first example is Durrett's permutation $(136)(2975)(48)$. Right: the fraction of $20000$ seeded random permutations of $\{1,\dots,12\}$ with $X_{12,k}=1$ (bars) against $1/(n-k+1)$ (dots). The readout tests independence on a pair and reports the cycle count for $n=10^4$.`,
      deps: ['prob-2.2.6', 'prob-2.2.1'],
      tags: ['combinatorics', 'permutations'],
      viz(v) {
        const M = v.M;
        const which = v.select('permutation', [{ value: 'dur', label: 'Durrett’s example ($n=9$)' }, { value: 'rnd', label: 'random ($n=12$)' }], 'dur');
        const kS = v.slider('steps written $k$', 0, 12, 9, { int: true });
        let seed = 1; v.button('Resample', () => { seed++; });
        const L = v.stage({ x: [-1.35, 1.35], y: [-1.75, 1.3], equal: true, height: 340, axes: false, title: 'writing $\\pi$ in cycle form' });
        const R = v.stage({ x: [0.4, 12.6], y: [0, 1.05], height: 340, axes: 'box', gutter: true, xlabel: 'position $k$', title: '$P(X_{12,k}=1)$: data vs $1/(n-k+1)$' });
        const cycleOrder = (p) => { const n = p.length, used = new Uint8Array(n), seq = [], close = []; for (let s = 0; s < n; s++) { if (used[s]) continue; let i = s; do { used[i] = 1; seq.push(i); i = p[i]; close.push(i === s ? 1 : 0); } while (i !== s); } return { seq, close }; };
        let stats = null, st = null;
        v.render(() => {
          // statistics over random permutations of 12 (cached)
          if (!stats || stats.seed !== seed) {
            const r = v.rng(seed * 3 + 77), cnt = new Array(12).fill(0); let both = 0;
            for (let j = 0; j < 20000; j++) { const p = r.shuffle([...Array(12).keys()]); const { close } = cycleOrder(p); close.forEach((c, k) => { cnt[k] += c; }); if (close[8] && close[10]) both++; }
            const rb = v.rng(seed * 11 + 5), cyc = [];
            for (let j = 0; j < 200; j++) { const p = rb.shuffle([...Array(10000).keys()]); cyc.push(cycleOrder(p).close.reduce((a, b) => a + b, 0)); }
            stats = { seed, f: cnt.map((c) => c / 20000), both: both / 20000, f10: cnt[8] / 20000, f12: cnt[10] / 20000, cyc };
          }
          const p = which.value === 'dur' ? [3, 9, 6, 8, 2, 1, 5, 4, 7].map((x) => x - 1) : v.rng(seed * 19 + 1).shuffle([...Array(12).keys()]);
          const n = p.length; kS.el.hidden = false;
          const k = Math.min(kS.value, n), { seq, close } = cycleOrder(p);
          const pos = (i) => [Math.cos(Math.PI / 2 - (2 * Math.PI * i) / n), 0.15 + Math.sin(Math.PI / 2 - (2 * Math.PI * i) / n)];
          for (let s = 0; s < k; s++) { const i = seq[s], [x1, y1] = pos(i), [x2, y2] = pos(p[i]); if (i === p[i]) L.circle(x1 * 1.12, y1 * 1.12 - 0.15 * 0.12, 0.1, { color: 'green', width: 2 }); else { const sh = 0.13 / Math.hypot(x2 - x1, y2 - y1); L.arrow(x1 + (x2 - x1) * sh, y1 + (y2 - y1) * sh, x2 - (x2 - x1) * sh, y2 - (y2 - y1) * sh, { color: close[s] ? 'green' : 'accent', width: 2.2, head: 9 }); } }
          for (let i = 0; i < n; i++) { const [x, y] = pos(i), cur = k < n && seq[k] === i; L.dot(x, y, { r: 12, color: cur ? 'gold' : 'panel' }); L.circle(x, y, 0.1, { color: cur ? 'gold' : 'faint', width: 1.4 }); L.text(String(i + 1), x, y, { align: 'center', size: 12.5, color: 'ink', halo: false, weight: 600 }); }
          // cycle notation with marks
          const toks = []; let open = true;
          for (let s = 0; s < n; s++) { if (open) toks.push({ t: '(', s: -1 }); toks.push({ t: String(seq[s] + 1), s }); open = !!close[s]; if (close[s]) toks.push({ t: ')', s: -1 }); }
          const w = 2.5 / toks.length;
          toks.forEach((tk, j) => { const x = -1.25 + (j + 0.5) * w, shown = tk.s < 0 ? (toks.slice(0, j).filter((q) => q.s >= 0).length <= k && (tk.t === '(' ? toks.slice(j).find((q) => q.s >= 0).s < k : toks.slice(0, j).reverse().find((q) => q.s >= 0).s < k)) : tk.s < k; L.text(tk.t, x, -1.32, { align: 'center', size: 15, color: shown ? (tk.s >= 0 && close[tk.s] ? 'green' : 'ink') : 'faint', weight: 600 }); if (tk.s >= 0 && tk.s < k && close[tk.s]) L.text('✓', x, -1.6, { align: 'center', size: 12, color: 'green' }); });
          // right
          R.bars(stats.f, { x0: 1, color: 'accent', fillAlpha: 0.55 });
          R.dots(stats.f.map((_, i) => [i + 1, 1 / (12 - i)]), { r: 5, color: 'orange' });
          const cm = stats.cyc.reduce((a, b) => a + b, 0) / stats.cyc.length, csd = Math.sqrt(stats.cyc.reduce((a, b) => a + (b - cm) ** 2, 0) / stats.cyc.length);
          st = { both: stats.both, prod: stats.f10 * stats.f12, cm, csd, Hn: Array.from({ length: 10000 }, (_, i) => 1 / (i + 1)).reduce((a, b) => a + b, 0), cycles: close.reduce((a, b) => a + b, 0), n };
          v.legend([['accent', 'arrow written; data', { area: true }], ['green', 'closes a cycle ($X_{n,k}=1$)'], ['orange', '$1/(n-k+1)$', { dot: true }], ['gold', 'next symbol', { dot: true }]]);
        });
        v.readout(() => st && `This permutation has ${st.cycles} cycles. Independence check ($n=12$): $P(X_{9}=1,X_{11}=1)\\approx${fr(st.both, 4)}$ vs product of the frequencies $${fr(st.prod, 4)}$ (exact $\\tfrac14\\cdot\\tfrac12=0.125$). For $n=10^4$ (200 seeded permutations): cycles average $${fr(st.cm, 2)}$ (exact $\\sum1/m=${fr(st.Hn, 2)}$, $\\log n=9.21$), standard deviation $${fr(st.csd, 2)}$.`);
      },
    },
    {
      num: '2.2.11',
      kind: 'Theorem',
      name: 'Weak law for triangular arrays',
      statement: String.raw`For each $n$ let $X_{n,1},\dots,X_{n,n}$ be independent. Let $b_n>0$ with $b_n\to\infty$, and truncate: $\bar X_{n,k}=X_{n,k}1\{|X_{n,k}|\le b_n\}$. Suppose that as $n\to\infty$

(i) $\sum_{k=1}^nP(|X_{n,k}|>b_n)\to0$, and
(ii) $b_n^{-2}\sum_{k=1}^nE\bar X_{n,k}^2\to0$.

Then with $S_n=X_{n,1}+\dots+X_{n,n}$ and $a_n=\sum_{k=1}^nE\bar X_{n,k}$, we have $(S_n-a_n)/b_n\to0$ in probability.`,
      idea: String.raw`Let $\bar S_n$ be the truncated row sum. Then $P(|S_n-a_n|>\eps b_n)\le P(S_n\ne\bar S_n)+P(|\bar S_n-a_n|>\eps b_n)$. The first term is at most $\sum_kP(|X_{n,k}|>b_n)$, which is condition (i). The second is at most $\eps^{-2}b_n^{-2}\operatorname{var}(\bar S_n)\le\eps^{-2}b_n^{-2}\sum_kE\bar X_{n,k}^2$ by Chebyshev and Theorem 2.2.1, which is condition (ii). Truncation trades a rare-event estimate for a second moment that is now finite.`,
      caption: String.raw`Rows of i.i.d. symmetric variables with $P(|X|>x)=x^{-\alpha}$ for $x\ge1$, normalized by $b_n=n^\beta$ (so $a_n=0$). Drag the gold point in the middle panel to choose $(\alpha,\beta)$; both conditions hold in the green region $\beta>\max(1/\alpha,1/2)$. Left: one seeded row of length $n=2000$ in units of $b_n$. Red spikes break the truncation level and count toward (i); the rest feed (ii). Right: the two conditions computed exactly against $n$ (log–log). Both fall exactly when the point is green.`,
      deps: ['prob-2.2.1', 'prob-2.2.2'],
      tags: ['law of large numbers', 'truncation'],
      viz(v) {
        let seed = 1; v.button('Resample', () => { seed++; });
        const A = v.stage({ x: [0, 2000], y: [-1.6, 1.6], height: 300, axes: 'box', gutter: true, xlabel: '$k$', title: 'one row, $X_{n,k}/b_n$', minWidth: 220 });
        const B = v.stage({ x: [0.3, 4], y: [0.2, 2], height: 300, axes: 'box', gutter: true, xlabel: 'tail index $\\alpha$', ylabel: '$\\beta$', title: 'where (i) and (ii) hold', minWidth: 220 });
        const C = v.stage({ x: [10, 1e6], xlog: true, y: [1e-3, 1e3], ylog: true, height: 300, axes: 'box', gutter: true, xlabel: '$n$', title: 'conditions (i), (ii)', minWidth: 220 });
        const H = B.handle(1.35, 0.82, { color: 'gold', constrain: (x, y) => [clampN(x, 0.35, 3.95), clampN(y, 0.25, 1.95)] });
        const c1 = (n, a, b) => Math.min(1e9, n * Math.min(1, n ** (-a * b)));
        const c2 = (n, a, b) => { const bn = n ** b, m2 = Math.abs(a - 2) < 1e-6 ? 2 * Math.log(bn) : (a / (2 - a)) * (bn ** (2 - a) - 1); return (n * m2) / (bn * bn); };
        let st = null;
        v.render(() => {
          const a = H.x, b = H.y, n = 2000, bn = n ** b;
          // region
          B.raster((x, y) => (y > Math.max(1 / x, 0.5) ? [...v.rgb('green').slice(0, 3), 0.25] : null), { key: 'region', res: 3 });
          B.fn((x) => 1 / x, { color: 'green', width: 1.6, domain: [0.5, 4] }); B.hline(0.5, { color: 'green', width: 1.6, dash: [5, 4] });
          B.text('β = 1/α', 0.62, 1.85, { size: 11, color: 'green' }); B.text('β = 1/2', 3.9, 0.56, { size: 11, color: 'green', align: 'right' });
          // row
          const r = v.rng(seed * 29 + Math.round(a * 100) * 7 + Math.round(b * 100)), xs = Array.from({ length: n }, () => (r() < 0.5 ? -1 : 1) * samplePareto(r, a) / bn);
          A.hband(-1, 1, { color: 'green', alpha: 0.12 });
          let out = 0, ssq = 0, s = 0;
          xs.forEach((x, k) => { const o = Math.abs(x) > 1; if (o) out++; else ssq += x * x; s += x; A.line(k, 0, k, clampN(x, -1.55, 1.55), { color: o ? 'red' : 'accent', width: o ? 2 : 1, alpha: o ? 1 : 0.6 }); });
          // conditions
          const ns = logInts(10, 1e6, 60);
          C.path(ns.map((m) => [m, Math.max(1e-4, c1(m, a, b))]), { color: 'red', width: 2.4 });
          C.path(ns.map((m) => [m, Math.max(1e-4, c2(m, a, b))]), { color: 'accent', width: 2.4 });
          C.hline(1, { color: 'muted', dash: [4, 4], width: 1 });
          const ok = b > Math.max(1 / a, 0.5);
          st = { a, b, out, ssq, s, ok, i: c1(n, a, b), ii: c2(n, a, b) };
          v.legend([['red', 'beyond $b_n$; (i) $=nP(|X|>b_n)$'], ['accent', 'kept; (ii) $=b_n^{-2}nE\\bar X^2$'], ['green', 'both conditions hold', { area: true }]]);
        });
        v.readout(() => st && `$\\alpha=${fr(st.a, 2)}$, $\\beta=${fr(st.b, 2)}$. In this row: ${st.out} spikes beyond $b_n$ (expected $${fr(st.i, 2)}$), truncated sum of squares $${fr(st.ssq, 3)}$ (expected $${fr(st.ii, 3)}$), and $S_n/b_n=${fr(st.s, 3)}$.` + (st.ok ? ' Both conditions $\\to0$, so $S_n/b_n\\to0$ in probability.' : ' At least one condition fails to vanish.'));
      },
    },
    {
      num: '2.2.12',
      kind: 'Theorem',
      name: 'Weak law under xP(|X| > x) → 0 (Feller)',
      credit: 'Feller, 1946',
      statement: String.raw`Let $X_1,X_2,\dots$ be i.i.d. with
$$xP(|X_1|>x)\to0\qquad\text{as }x\to\infty,$$
and put $S_n=X_1+\dots+X_n$ and $\mu_n=E\bigl(X_11\{|X_1|\le n\}\bigr)$. Then $S_n/n-\mu_n\to0$ in probability. The tail condition is also necessary for the existence of constants $a_n$ with $S_n/n-a_n\to0$ in probability.`,
      idea: String.raw`Apply Theorem 2.2.11 with $X_{n,k}=X_k$ and $b_n=n$. Condition (i) is $nP(|X_1|>n)\to0$, the hypothesis itself. For (ii), Lemma 2.2.13 gives $E\bar X^2\le\int_0^n2yP(|X_1|>y)\,dy$, and $\frac1n\int_0^n2yP(|X_1|>y)\,dy$ is the average over $[0,n]$ of a function tending to $0$, so it tends to $0$. The hypothesis is barely weaker than a finite mean, since it implies $E|X_1|^{1-\eps}<\infty$ for every $\eps>0$, yet it allows $E|X_1|=\infty$.`,
      caption: String.raw`Left: the hypothesis, $xP(|X|>x)$ against $x$. Right: histograms of $S_n/n-\mu_n$ for $n=10^2,10^3,10^4$ (200 seeded repetitions each). For the tail $P(X>x)=e/(x\log x)$, the mean is infinite and $\mu_n=e(\log\log n+1-1/\log n)\to\infty$. Still $xP(X>x)=e/\log x\to0$, and the histograms tighten (slowly, like $1/\sqrt{\log n}$). For the Pareto tail $1/x$ and for the Cauchy law, $xP(|X|>x)$ tends to a positive constant, and the histograms never tighten: no centring makes $S_n/n$ converge.`,
      deps: ['prob-2.2.11', 'prob-2.2.3a'],
      see: ['prob-2.2.13'],
      tags: ['law of large numbers'],
      viz(v) {
        const LAW = {
          xl: { label: '$P(X>x)=\\frac{e}{x\\log x}$', tail: (x) => (x < Math.E ? 1 : Math.E / (x * Math.log(x))), s: sampleXlogX, mu: (n) => Math.E * (Math.log(Math.log(n)) + 1 - 1 / Math.log(n)) },
          par: { label: 'Pareto $P(X>x)=1/x$', tail: (x) => Math.min(1, 1 / x), s: (r) => samplePareto(r, 1), mu: (n) => Math.log(n) },
          cau: { label: 'Cauchy', tail: (x) => 1 - (2 / Math.PI) * Math.atan(x), s: sampleCauchy, mu: () => 0 },
        };
        const law = v.select('law', Object.entries(LAW).map(([value, o]) => ({ value, label: o.label })), 'xl');
        let seed = 1; v.button('Resample', () => { seed++; });
        const L = v.stage({ x: [1, 1e8], xlog: true, y: [0, 1.1], height: 320, axes: 'box', gutter: true, xlabel: '$x$', title: 'the hypothesis: $xP(|X|>x)$' });
        const R = v.stage({ x: [-4, 4], y: [0, 1], height: 320, weight: 1.25, axes: 'box', gutter: true, xlabel: '$S_n/n-\\mu_n$', title: 'centred averages, $n=10^2,10^3,10^4$' });
        const NS = [100, 1000, 10000], COL = ['purple', 'orange', 'accent'];
        const cache = {}; let st = null;
        v.render(() => {
          const D = LAW[law.value], key = `${law.value}|${seed}`;
          for (const [k, o] of Object.entries(LAW)) L.fn((x) => x * o.tail(x), { color: k === law.value ? 'accent' : 'faint', width: k === law.value ? 2.8 : 1.6, n: 500 });
          L.text('e/(x log x)', 3e6, 0.25, { size: 11, color: law.value === 'xl' ? 'accent' : 'muted' }); L.text('Pareto: 1', 3e6, 1.04, { size: 11, color: law.value === 'par' ? 'accent' : 'muted' }); L.text('Cauchy: 2/π', 3e6, 0.7, { size: 11, color: law.value === 'cau' ? 'accent' : 'muted' });
          if (!cache[key]) {
            const r = v.rng(seed * 101 + law.value.length);
            cache[key] = NS.map((n) => { const out = []; for (let j = 0; j < 200; j++) { let s = 0; for (let i = 0; i < n; i++) s += D.s(r); out.push(s / n - D.mu(n)); } return out; });
          }
          let ym = 0; const Hs = cache[key].map((xs) => { const h = densityOn(xs, linEdges(-4, 4, 40)); ym = Math.max(ym, ...h.density); return h; });
          R.setView(null, [0, ym * 1.15]);
          Hs.forEach((h, i) => R.hist(h, { density: true, color: COL[i], fillAlpha: 0.12, width: 1.8 }));
          R.vline(0, { color: 'green', dash: [5, 4], width: 1.6 });
          const pout = cache[key].map((xs) => fracOut(xs, 0, 1));
          st = { pout, mu: D.mu(10000) };
          v.legend(NS.map((n, i) => [COL[i], `$n=10^{${Math.log10(n)}}$`, { area: true }]));
        });
        v.readout(() => st && `$P(|S_n/n-\\mu_n|>1)\\approx${st.pout.map((p) => fr(p, 2)).join(',\\ ')}$ for $n=10^2,10^3,10^4$; $\\mu_{10^4}=${fr(st.mu, 3)}$.`);
      },
    },
    {
      num: '2.2.13',
      kind: 'Lemma',
      name: 'Moments from tails: EYᵖ = ∫ p yᵖ⁻¹ P(Y > y) dy',
      statement: String.raw`If $Y\ge0$ and $p>0$, then
$$E(Y^p)=\int_0^\infty p\,y^{p-1}\,P(Y>y)\,dy,$$
both sides being finite or infinite together.`,
      idea: String.raw`Write $Y^p=\int_0^Yp\,y^{p-1}dy=\int_0^\infty p\,y^{p-1}1\{Y>y\}\,dy$ and take expectations. Fubini's theorem for nonnegative integrands (Theorem 1.7.2) swaps $E$ and $\int dy$, and $E1\{Y>y\}=P(Y>y)$. For $p=1$ this is the familiar $EY=\int_0^\infty P(Y>y)\,dy$. The weight $py^{p-1}$ shows that higher moments are decided by the far tail.`,
      caption: String.raw`Left: the tail $P(Y>y)$ (black) and the integrand $p\,y^{p-1}P(Y>y)$ (green, shaded). Its area is $EY^p$. Slide $p$ and watch the weight shift to the right. Right: $EY^p$ as a function of $p$: the closed form (green), the numerical tail integral (blue dots) and a Monte Carlo mean of $20000$ seeded draws (gold), on a log scale. For the Pareto law with $P(Y>y)=y^{-3}$, the integral diverges at $p=3$, and the Monte Carlo estimate becomes erratic as $p$ approaches $3$.`,
      deps: ['prob-1.7.2'],
      see: ['rca-8.16'],
      tags: ['moments', 'tails'],
      viz(v) {
        const M = v.M;
        const LAW = {
          exp: { label: 'exponential', S: (y) => Math.exp(-y), E: (p) => Math.exp(M.lgamma(p + 1)), d: (r) => sampleExp(r), ymax: 8 },
          unif: { label: 'uniform(0,1)', S: (y) => clampN(1 - y, 0, 1), E: (p) => 1 / (p + 1), d: (r) => r(), ymax: 1.3 },
          par: { label: 'Pareto $y^{-3}$', S: (y) => (y < 1 ? 1 : y ** -3), E: (p) => (p < 3 ? 3 / (3 - p) : Infinity), d: (r) => samplePareto(r, 3), ymax: 6 },
          die: { label: 'die', S: (y) => clampN((6 - Math.floor(y)) / 6, 0, 1), E: (p) => [1, 2, 3, 4, 5, 6].reduce((s, k) => s + k ** p, 0) / 6, d: (r) => 1 + Math.floor(6 * r()), ymax: 7 },
        };
        const law = v.select('law', Object.entries(LAW).map(([value, o]) => ({ value, label: o.label })), 'exp');
        const pS = v.slider('$p$', 0.2, 4, 1.8, { step: 0.05 });
        const L = v.stage({ x: [0, 8], y: [0, 1.3], height: 320, weight: 1.2, axes: 'box', gutter: true, xlabel: '$y$', title: 'tail and integrand' });
        const R = v.stage({ x: [0.2, 4], y: [0.1, 1000], ylog: true, height: 320, axes: 'box', gutter: true, xlabel: '$p$', title: '$EY^p$' });
        const tailInt = (S, p) => { // ∫_0^∞ p y^{p-1} S(y) dy on a log grid from 1e-8 to 1e6 (substitute y = e^t)
          let s = 0; const a = Math.log(1e-8), b = Math.log(1e6), n = 6000, h = (b - a) / n;
          for (let i = 0; i < n; i++) { const y = Math.exp(a + (i + 0.5) * h); s += p * y ** p * S(y) * h; }
          return s;
        };
        const cache = {}; let st = null;
        v.render(() => {
          const D = LAW[law.value], p = pS.value;
          if (!cache[law.value]) { const r = v.rng(17), xs = Array.from({ length: 20000 }, () => D.d(r)); cache[law.value] = { xs, ps: Array.from({ length: 39 }, (_, i) => 0.2 + i * 0.1) }; }
          const c = cache[law.value];
          let peak = 0; for (let i = 1; i <= 300; i++) { const y = (D.ymax * i) / 300; peak = Math.max(peak, p * y ** (p - 1) * D.S(y)); }
          L.setView([0, D.ymax], [0, Math.max(1.1, Math.min(peak, 50) * 1.1)]);
          L.fn((y) => (y > 0 ? p * y ** (p - 1) * D.S(y) : NaN), { color: 'green', width: 2.4, fill: 'green', fillAlpha: 0.22, n: 800 });
          L.fn(D.S, { color: 'ink', width: 2, n: 800 });
          const ex = c.ps.map((q) => [q, D.E(q)]).filter((q) => isFinite(q[1]));
          R.path(ex, { color: 'green', width: 2.4 });
          if (law.value === 'par') R.vline(3, { color: 'red', dash: [5, 4], width: 1.4 });
          R.dots(c.ps.filter((q, i) => i % 3 === 0 && isFinite(D.E(q))).map((q) => [q, tailInt(D.S, q)]), { r: 3.5, color: 'accent' });
          R.dots(c.ps.map((q) => [q, c.xs.reduce((s, y) => s + y ** q, 0) / c.xs.length]), { r: 2.5, color: 'gold' });
          const I = tailInt(D.S, p), mc = c.xs.reduce((s, y) => s + y ** p, 0) / c.xs.length;
          R.dot(p, Math.min(1000, isFinite(D.E(p)) ? D.E(p) : 1000), { r: 6, color: 'green', hollow: true });
          st = { p, I, mc, E: D.E(p), par: law.value === 'par' };
          v.legend([['ink', '$P(Y>y)$'], ['green', '$p\\,y^{p-1}P(Y>y)$; exact $EY^p$', { area: true }], ['accent', 'tail integral', { dot: true }], ['gold', 'Monte Carlo', { dot: true }]]);
        });
        v.readout(() => st && `$p=${fr(st.p, 2)}$: tail integral $${fr(st.I, 4)}$` + (st.par && st.p >= 3 ? ' (cut off at $y=10^6$; the full integral is $\\infty$)' : '') + `, exact $EY^p=${isFinite(st.E) ? fr(st.E, 4) : '\\infty'}$, Monte Carlo $${fr(st.mc, 4)}$.`);
      },
    },
    {
      num: '2.2.14',
      kind: 'Theorem',
      name: 'Weak law of large numbers (finite mean)',
      statement: String.raw`Let $X_1,X_2,\dots$ be i.i.d. with $E|X_1|<\infty$, and let $\mu=EX_1$ and $S_n=X_1+\dots+X_n$. Then $S_n/n\to\mu$ in probability. No second moment is needed.`,
      idea: String.raw`Dominated convergence gives two facts: $xP(|X_1|>x)\le E\bigl(|X_1|1\{|X_1|>x\}\bigr)\to0$, and $\mu_n=E\bigl(X_11\{|X_1|\le n\}\bigr)\to\mu$. The first is the hypothesis of Theorem 2.2.12, so $S_n/n-\mu_n\to0$ in probability; the second replaces $\mu_n$ by $\mu$. The truncated means $\mu_n$ are the bridge: the proof works at the level $|X|\le n$, where second moments exist.`,
      caption: String.raw`Pareto variables with $P(X>x)=x^{-\alpha}$ for $x\ge1$, with mean $\alpha/(\alpha-1)$ when $\alpha>1$. For $1<\alpha\le2$ the variance is infinite. Left: 25 seeded paths of $S_n/n$ with the band $\mu\pm\eps$ and the truncated means $\mu_n$ (orange) used in the proof. Occasional huge values make the paths jump, but the jumps become rarer. Right: the fraction of 400 paths outside the band, against $n$; it falls to $0$. Push $\alpha$ below $1$: the mean is infinite, $\mu_n\to\infty$, and the averages run off.`,
      deps: ['prob-2.2.12', 'prob-1.6.7'],
      tags: ['law of large numbers'],
      viz(v) {
        const aS = v.slider('tail index $\\alpha$', 0.7, 3, 1.5, { step: 0.05 });
        const eS = v.slider('$\\eps$', 0.05, 1, 0.3, { step: 0.05 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const N = 10000, NS = logInts(1, N, 50);
        const L = v.stage({ x: [1, N], xlog: true, y: [0, 6], height: 330, weight: 1.3, axes: 'box', gutter: true, xlabel: '$n$', title: '$S_n/n$, Pareto($\\alpha$)' });
        const R = v.stage({ x: [1, N], xlog: true, y: [0, 1.02], height: 330, axes: 'box', gutter: true, xlabel: '$n$', title: '$P(|S_n/n-\\mu|>\\eps)$, 400 paths' });
        let cache = null, st = null;
        v.render(() => {
          const a = aS.value, e = eS.value, mu = a > 1 ? a / (a - 1) : Infinity, key = `${a}|${seed}`;
          if (!cache || cache.key !== key) {
            const r = v.rng(seed * 61 + 7), at = new Map(NS.map((n, i) => [n, i])), Mx = [], paths = [];
            for (let p = 0; p < 400; p++) { const row = new Float64Array(NS.length); let S = 0; const path = []; for (let n = 1; n <= N; n++) { S += samplePareto(r, a); const i = at.get(n); if (i != null) { row[i] = S / n; if (p < 25) path.push([n, S / n]); } } Mx.push(row); if (p < 25) paths.push(path); }
            cache = { key, Mx, paths };
          }
          const truncMean = (n) => (Math.abs(a - 1) < 1e-9 ? Math.log(n) : (a / (a - 1)) * (1 - n ** (1 - a)));
          const top = isFinite(mu) ? Math.max(mu * 2.2, mu + 2) : Math.max(6, truncMean(N) * 1.6);
          L.setView(null, [0, top]);
          if (isFinite(mu)) { L.hband(mu - e, mu + e, { color: 'green', alpha: 0.18 }); L.hline(mu, { color: 'green', width: 1.8 }); }
          cache.paths.forEach((P, i) => L.path(P, { color: i % 3 ? 'accent' : 'teal', width: 1.1, alpha: 0.7 }));
          L.fn(truncMean, { color: 'orange', width: 2.4, dash: [7, 4] });
          let fx = [];
          if (isFinite(mu)) fx = NS.map((n, i) => { let c = 0; for (const row of cache.Mx) if (Math.abs(row[i] - mu) > e) c++; return [n, c / 400]; });
          else fx = NS.map((n, i) => { let c = 0; for (const row of cache.Mx) if (row[i] > top) c++; return [n, c / 400]; });
          R.path(fx, { color: isFinite(mu) ? 'gold' : 'red', width: 2.4 }); R.dots(fx, { r: 2.5, color: isFinite(mu) ? 'gold' : 'red' });
          const med = cache.Mx.map((row) => row[NS.length - 1]).sort((x, y) => x - y)[200];
          st = { a, mu, f: fx[fx.length - 1][1], med, tm: truncMean(N) };
          v.legend([['accent', '$S_n/n$'], ['green', '$\\mu\\pm\\eps$', { area: true }], ['orange', 'truncated mean $\\mu_n=E(X;X\\le n)$', { dash: true }], [isFinite(mu) ? 'gold' : 'red', isFinite(mu) ? 'fraction outside' : 'fraction above the window']]);
        });
        v.readout(() => st && (isFinite(st.mu) ? `$\\alpha=${fr(st.a, 2)}$: $\\mu=${fr(st.mu, 3)}$, variance ${st.a > 2 ? 'finite' : '**infinite**'}. At $n=10^4$ the fraction of paths outside $\\mu\\pm\\eps$ is $${fr(st.f, 3)}$; median $S_n/n=${fr(st.med, 3)}$; $\\mu_n=${fr(st.tm, 3)}$.` : `$\\alpha=${fr(st.a, 2)}\\le1$: $E X=\\infty$, the theorem does not apply; $\\mu_{10^4}=${fr(st.tm, 1)}$ and the median of $S_n/n$ is $${fr(st.med, 1)}$, still growing.`));
      },
    },
    {
      num: '2.2.16',
      kind: 'Paradox',
      name: 'St. Petersburg paradox',
      credit: 'Nicolas Bernoulli, 1713; Daniel Bernoulli, 1738',
      statement: String.raw`A fair coin is tossed until it first lands heads; if that takes $j$ tosses the player wins $2^j$. So $P(X=2^j)=2^{-j}$ for $j\ge1$ and $EX=\sum_j2^j2^{-j}=\infty$, yet nobody would pay a large fee to play. For i.i.d. plays $X_1,X_2,\dots$ with total winnings $S_n$,
$$\frac{S_n}{n\log_2n}\to1\quad\text{in probability},$$
so a fair entry fee for $n$ plays is about $\log_2n$ per play: $10$ per play for $n=1024$ games.`,
      idea: String.raw`Apply Theorem 2.2.11 with $b_n=2^{m(n)}$, where $m(n)=\log_2n+K(n)$ and $K(n)\to\infty$ slowly. Then $nP(X\ge b_n)=2^{1-K(n)}\to0$, which is (i). The truncated second moment is $E\bar X^2=\sum_{j\le m(n)}2^j\le2b_n$, so (ii) is at most $2n/b_n=2^{1-K(n)}\to0$. The truncated mean is $E\bar X=m(n)$, so $a_n=n\,m(n)$. If $K(n)\le\log_2\log_2n$, then $a_n\sim n\log_2n$ and $b_n\le n\log_2n$, which gives the result. The paradox is resolved by normalizing by $n\log n$, not $n$.`,
      caption: String.raw`Left: 8 seeded players, each playing $2^{18}$ games, with their total winnings divided by $n\log_2n$ (log scale in $n$). Big jackpots make upward jumps that are slowly diluted. Switch the normalization to $n$: the average payout per game grows without bound, like $\log_2n$. Right: the histogram of $S_n/(n\log_2n)$ over 400 seeded repetitions for $n=2^6,2^{10},2^{14}$; the bulk moves toward $1$ and tightens slowly, with a long right tail.`,
      deps: ['prob-2.2.11'],
      see: ['behav-1.1', 'phil-5.7'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/St._Petersburg_paradox' },
      tags: ['law of large numbers', 'paradoxes'],
      viz(v) {
        const norm = v.select('divide $S_n$ by', [{ value: 'nl', label: '$n\\log_2 n$' }, { value: 'n', label: '$n$' }], 'nl');
        let seed = 1; v.button('Resample', () => { seed++; });
        const N = 2 ** 18;
        const L = v.stage({ x: [2, N], xlog: true, y: [0, 4], height: 330, weight: 1.3, axes: 'box', gutter: true, xlabel: '$n$ (games)', title: 'running winnings, 8 players' });
        const R = v.stage({ x: [0, 3], y: [0, 3], height: 330, axes: 'box', gutter: true, xlabel: '$S_n/(n\\log_2 n)$', title: 'law of $S_n/(n\\log_2n)$' });
        const NS = [2 ** 6, 2 ** 10, 2 ** 14], COL = ['purple', 'orange', 'accent'];
        let cache = null, st = null;
        v.render(() => {
          if (!cache || cache.seed !== seed) {
            const r = v.rng(seed * 83 + 1), paths = [];
            for (let p = 0; p < 8; p++) { let S = 0, next = 2; const raw = []; for (let n = 1; n <= N; n++) { S += sampleStPete(r); if (n >= next || n === N) { raw.push([n, S]); next = Math.ceil(next * 1.06); } } paths.push(raw); }
            const hs = NS.map((n) => Array.from({ length: 400 }, () => { let S = 0; for (let i = 0; i < n; i++) S += sampleStPete(r); return S / (n * Math.log2(n)); }));
            cache = { seed, paths, hs };
          }
          const nl = norm.value === 'nl';
          L.setView(null, nl ? [0, 4] : [0, 40]);
          if (nl) { L.hband(0.75, 1.25, { color: 'green', alpha: 0.14 }); L.hline(1, { color: 'green', width: 1.8 }); }
          else L.fn((n) => Math.log2(n), { color: 'green', width: 2, dash: [6, 4] });
          cache.paths.forEach((P, i) => L.path(P.map(([n, S]) => [n, nl ? S / (n * Math.log2(n)) : S / n]), { color: i % 3 ? 'accent' : 'teal', width: 1.2, alpha: 0.8 }));
          let ym = 0; const Hs = cache.hs.map((xs) => { const h = densityOn(xs, linEdges(0, 3, 60)); ym = Math.max(ym, ...h.density); return h; });
          R.setView(null, [0, ym * 1.15]);
          Hs.forEach((h, i) => R.hist(h, { density: true, color: COL[i], fillAlpha: 0.12, width: 1.8 }));
          R.vline(1, { color: 'green', width: 1.8, dash: [6, 4] });
          const med = cache.hs.map((xs) => xs.slice().sort((a, b) => a - b)[200]);
          const ends = cache.paths.map((P) => P[P.length - 1][1] / (N * Math.log2(N)));
          st = { med, ends, nl };
          v.legend(nl ? [['accent', '$S_n/(n\\log_2n)$ per player'], ['green', 'limit $1$'], ...NS.map((n, i) => [COL[i], `$n=2^{${Math.log2(n)}}$`, { area: true }])] : [['accent', '$S_n/n$ per player'], ['green', '$\\log_2 n$', { dash: true }]]);
        });
        v.readout(() => st && `Medians of $S_n/(n\\log_2n)$: $${st.med.map((x) => fr(x, 3)).join(',\\ ')}$ for $n=2^6,2^{10},2^{14}$; the 8 players end at $n=2^{18}$ between $${fr(Math.min(...st.ends), 2)}$ and $${fr(Math.max(...st.ends), 2)}$. Fair fee for $1024$ games: $\\log_2 1024=10$ per game.`);
      },
    },
  ],
};
