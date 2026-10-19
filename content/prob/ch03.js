// Probability: Theory and Examples (Durrett) — Chapter 3: Central Limit Theorems. Part A: §3.1 De Moivre–Laplace, §3.2 weak convergence
import { clampN, cornerIn, PHI, PhiN, logInts, fr, sciT, logFact, logChoose, binomPmf, poissonPmf, walkLaw, discCdf, discQuantile, kolmogorovDisc, ringPx, stems } from './ch03.shared.js';

// ---------- helpers local to §§3.1–3.2 ----------
/** Mixture law used for atoms: 0.3·δ₀ + 0.2·δ₁ + 0.5·normal(−1, 0.7²). */
const ATOMS = [[0, 0.3], [1, 0.2]];
const mixF = (M, x) => 0.3 * (x >= 0) + 0.2 * (x >= 1) + 0.5 * PhiN(M, (x + 1) / 0.7);
const mixFminus = (M, x) => 0.3 * (x > 0) + 0.2 * (x > 1) + 0.5 * PhiN(M, (x + 1) / 0.7);
/** Snap x to the nearest of `pts` when within tol. */
const snapTo = (x, pts, tol) => { for (const p of pts) if (Math.abs(x - p) < tol) return p; return x; };
/** Normal(µ, σ²) mean of |X|. */
const absMeanNormal = (M, mu, s) => s * Math.sqrt(2 / Math.PI) * Math.exp(-(mu * mu) / (2 * s * s)) + mu * (1 - 2 * PhiN(M, -mu / s));

export default {
  collection: 'prob',
  chapter: 3,
  title: 'Central Limit Theorems',
  summary: String.raw`The chapter starts from an exact computation: Stirling's formula turns binomial probabilities for coin flips into the Gaussian curve (De Moivre–Laplace). To say in general what "the distribution of $S_n/\sqrt n$ tends to the normal" means it then builds the theory of weak convergence: convergence of distribution functions at continuity points, the Skorokhod coupling that turns it into almost-sure convergence, bounded continuous test functions, the portmanteau theorem, Helly's selection theorem and tightness. Characteristic functions follow, with the inversion formula, Lévy's continuity theorem, Taylor expansions at $0$ that link smoothness to moments, Pólya's criterion and the moment problem. These tools give the i.i.d. and Lindeberg–Feller central limit theorems, Berry–Esseen, local limit theorems, Poisson convergence and Poisson processes, and finally stable and infinitely divisible laws and limit theorems in $\R^d$.`,
  items: [
    // ======================================================================== §3.1 The De Moivre–Laplace theorem
    {
      num: '3.1.1',
      kind: 'Lemma',
      name: '(1 + cⱼ)^{aⱼ} → e^λ when aⱼcⱼ → λ',
      statement: String.raw`Let $c_j$ be real numbers with $c_j\to0$ and let $a_j\to\infty$. If $a_jc_j\to\lambda$, then
$$(1+c_j)^{a_j}\to e^{\lambda}.$$`,
      idea: String.raw`Take logarithms and factor:
$$a_j\log(1+c_j)=a_jc_j\cdot\frac{\log(1+c_j)}{c_j}.$$
The first factor tends to $\lambda$ by hypothesis. The second tends to $1$ because $\log(1+x)/x\to1$ as $x\to0$ (the derivative of $\log$ at $1$ is $1$). Exponentiating, by continuity of $\exp$, gives $e^\lambda$. This is the step that turns each factor of Stirling's formula into a Gaussian factor in Theorem 3.1.2.`,
      caption: String.raw`Left: the numbers $(1+c_j)^{a_j}$ (gold) on a log scale in $j$, with the target $e^\lambda$ in green. Right: the proof. The points $x=c_j$ slide to $0$ on the graph of $\log(1+x)/x$, so the correction factor tends to $1$. Drag $\lambda$ and $j$, and switch sequences. The third sequence keeps $c_j\to0$ and $a_j\to\infty$ but makes $a_jc_j=\lambda+\sin j$ oscillate. The values then wander between $e^{\lambda-1}$ and $e^{\lambda+1}$ and never settle.`,
      deps: [],
      tags: ['analysis', 'limits'],
      viz(v) {
        const SEQ = {
          a: { label: '$c_j=\\lambda/j,\\ a_j=j$', c: (j, l) => l / j, a: (j) => j },
          b: { label: '$c_j=\\lambda/\\sqrt j+1/j,\\ a_j=\\sqrt j$', c: (j, l) => l / Math.sqrt(j) + 1 / j, a: (j) => Math.sqrt(j) },
          c: { label: '$a_jc_j=\\lambda+\\sin j$', c: (j, l) => (l + Math.sin(j)) / j, a: (j) => j },
        };
        const sq = v.select('sequence', Object.entries(SEQ).map(([value, o]) => ({ value, label: o.label })), 'a');
        const lam = v.slider('$\\lambda$', -2, 2, 1, { step: 0.01 });
        const J = v.slider('$j$', 1, 10000, 40, { log: true, int: true });
        const L = v.stage({ x: [1, 1e4], xlog: true, y: [0, 8], axes: 'box', gutter: true, height: 320, weight: 1.3, xlabel: '$j$', title: '$(1+c_j)^{a_j}$ against $e^\\lambda$' });
        const R = v.stage({ x: [-0.7, 1.5], y: [0.5, 1.6], axes: 'box', gutter: true, height: 320, xlabel: '$x$', title: 'correction factor $\\log(1+x)/x$ at $x=c_j$' });
        const js = []; for (let j = 1; j <= 10000; j = j < 30 ? j + 1 : Math.ceil(j * 1.06)) js.push(j);
        const ratio = (x) => (Math.abs(x) < 1e-9 ? 1 : Math.log1p(x) / x);
        let st = null;
        v.render(() => {
          const S = SEQ[sq.value], l = lam.value, e = Math.exp(l);
          const val = (j) => { const c = S.c(j, l); return 1 + c > 0 ? Math.exp(S.a(j) * Math.log1p(c)) : NaN; };
          const ys = js.map((j) => [j, val(j)]);
          const ymax = Math.max(e * 1.6, Math.min(e * 3.2, Math.max(...ys.slice(Math.floor(ys.length / 3)).map((p) => (isFinite(p[1]) ? p[1] : 0))) * 1.12));
          L.setView(null, [0, ymax]);
          L.hband(e * 0.98, e * 1.02, { color: 'green', alpha: 0.12 });
          L.hline(e, { color: 'green', width: 2 });
          L.text('$e^{\\lambda}$', 1.3, e, { dy: -12, color: 'green' });
          L.path(ys.map((p) => (isFinite(p[1]) ? p : null)), { color: 'gold', width: 1, alpha: 0.5 });
          L.dots(ys.filter((p) => isFinite(p[1])), { r: 2.6, color: 'gold' });
          const j0 = J.value, y0 = val(j0);
          L.vline(j0, { color: 'accent', dash: [4, 4], width: 1 });
          L.dot(j0, Math.min(y0, ymax * 0.98), { r: 6, color: 'accent' });
          // right: the correction factor
          R.hline(1, { color: 'green', dash: [5, 4], width: 1.2 });
          R.fn(ratio, { domain: [-0.68, 1.5], color: 'ink', width: 2 });
          const pts = js.map((j) => S.c(j, l)).filter((c) => c > -0.68 && c < 1.5).map((c) => [c, ratio(c)]);
          R.dots(pts, { r: 2.6, color: 'gold' });
          const c0 = S.c(j0, l);
          if (c0 > -0.68 && c0 < 1.5) R.dot(c0, ratio(c0), { r: 6, color: 'accent', label: '$c_j$', labelPos: 'ne' });
          st = { j0, c0, a0: S.a(j0), y0, e, ac: S.a(j0) * c0, br: sq.value === 'c' };
          v.legend([['gold', '$(1+c_j)^{a_j}$', { dot: true }], ['green', '$e^\\lambda$'], ['accent', 'current $j$', { dot: true }]]);
        });
        v.readout(() => st && `$j=${st.j0}$: $c_j=${fr(st.c0, 4)}$, $a_j=${fr(st.a0, 1)}$, $a_jc_j=${fr(st.ac, 4)}$, $(1+c_j)^{a_j}=${fr(st.y0, 4)}$ vs $e^\\lambda=${fr(st.e, 4)}$` + (st.br ? ': $a_jc_j$ has no limit, and neither does the power.' : ` (relative error $${sciT(Math.abs(st.y0 / st.e - 1))}$).`));
      },
    },
    {
      num: '3.1.2',
      kind: 'Theorem',
      name: 'Local limit for simple random walk (Stirling)',
      statement: String.raw`Let $S_m$ be simple random walk: the sum of $m$ independent steps equal to $\pm1$ with probability $\tfrac12$ each. If $n\to\infty$ and the integers $k=k_n$ satisfy $2k/\sqrt{2n}\to x$, then
$$P(S_{2n}=2k)\sim(\pi n)^{-1/2}e^{-x^2/2},$$
where $a_n\sim b_n$ means $a_n/b_n\to1$.`,
      idea: String.raw`Exactly, $P(S_{2n}=2k)=\binom{2n}{n+k}2^{-2n}$: choose which $n+k$ of the $2n$ steps go up. Stirling's formula $m!\sim m^me^{-m}\sqrt{2\pi m}$ turns this into $(\pi n)^{-1/2}$ times powers of the form $(1-k^2/n^2)^{-n}$ and $(1\pm k/n)^{\mp k}$, plus factors that tend to $1$. With $k\approx x\sqrt{n/2}$, Lemma 3.1.1 sends these powers to $e^{x^2/2}$, $e^{-x^2/2}$ and $e^{-x^2/2}$, and the product is $e^{-x^2/2}$.`,
      caption: String.raw`Left: the exact probabilities $P(S_{2n}=2k)$, rescaled by $\sqrt{\pi n}$, drawn as bars at $x=2k/\sqrt{2n}$ under the curve $e^{-x^2/2}$. Drag the gold handle to pick a point $x$; the nearest lattice point is outlined. Right, on log–log axes: the relative error of the local approximation at that $x$ (blue) and of Stirling's formula for $n!$ (orange) as $n$ grows. Both fall like $1/n$; Stirling's error is close to $1/(12n)$.`,
      deps: ['prob-3.1.1'],
      see: ['pma-8.22'],
      tags: ['random walk', 'local limit'],
      credit: 'De Moivre, 1733; Stirling, 1730',
      viz(v) {
        const nS = v.slider('$n$ (walk length $2n$)', 1, 1000, 12, { log: true, int: true });
        const L = v.stage({ x: [-3.6, 3.6], y: [0, 1.18], axes: 'box', gutter: true, height: 330, weight: 1.3, xlabel: '$x=2k/\\sqrt{2n}$', title: '$\\sqrt{\\pi n}\\,P(S_{2n}=2k)$ and $e^{-x^2/2}$' });
        const R = v.stage({ x: [1, 1000], xlog: true, y: [1e-6, 1], ylog: true, axes: 'box', gutter: true, height: 330, xlabel: '$n$', title: 'relative errors' });
        const hx = L.handle(1, 0, { color: 'gold', label: 'x', labelPos: 'n', constrain: (x) => [clampN(x, -3.4, 3.4), 0] });
        const P = (n, k) => Math.exp(logChoose(2 * n, n + k) - 2 * n * Math.LN2);
        const local = (n, x) => { const k = clampN(Math.round(x * Math.sqrt(n / 2)), -n, n), xx = k * Math.sqrt(2 / n); return { k, xx, ex: P(n, k), ap: Math.exp(-xx * xx / 2) / Math.sqrt(Math.PI * n) }; };
        const stirl = (n) => Math.exp(logFact(n) - (n * Math.log(n) - n + 0.5 * Math.log(2 * Math.PI * n))) - 1;
        const ns = logInts(1, 1000, 90);
        let st = null;
        v.render(() => {
          const n = nS.value, sp = Math.sqrt(2 / n), w = Math.min(0.8 * sp, 0.5);
          const kmax = Math.min(n, Math.ceil(3.7 / sp));
          for (let k = -kmax; k <= kmax; k++) {
            const x = k * sp, h = Math.sqrt(Math.PI * n) * P(n, k);
            L.rect(x - w / 2, 0, x + w / 2, h, { fill: 'accent', fillAlpha: 0.45, color: 'accent', width: n > 150 ? 0 : 1, stroke: n <= 150 });
          }
          L.fn((x) => Math.exp(-x * x / 2), { color: 'green', width: 2.4 });
          const lc = local(n, hx.x);
          L.rect(lc.xx - w / 2, 0, lc.xx + w / 2, Math.sqrt(Math.PI * n) * lc.ex, { fill: false, color: 'gold', width: 2.5 });
          L.dot(lc.xx, Math.exp(-lc.xx * lc.xx / 2), { r: 4.5, color: 'green' });
          // right: errors along n
          const eL = ns.map((m) => { const q = local(m, hx.x); return [m, Math.max(1e-7, Math.abs(q.ex / q.ap - 1))]; });
          const eS = ns.map((m) => [m, Math.max(1e-7, stirl(m))]);
          R.fn((m) => 1 / (12 * m), { color: 'orange', dash: [2, 4], width: 1, alpha: 0.7 });
          R.path(eL, { color: 'accent', width: 2 });
          R.path(eS, { color: 'orange', width: 2 });
          R.vline(n, { color: 'muted', dash: [4, 4], width: 1 });
          R.dot(n, Math.max(1e-7, Math.abs(lc.ex / lc.ap - 1)), { r: 5, color: 'accent' });
          R.dot(n, Math.max(1e-7, stirl(n)), { r: 5, color: 'orange' });
          st = { n, ...lc, s: stirl(n) };
          v.legend([['accent', 'local error at $x$'], ['orange', 'Stirling error for $n!$'], ['orange', '$1/(12n)$', { dash: [2, 4] }], ['green', '$e^{-x^2/2}$']]);
        });
        v.readout(() => st && `$n=${st.n}$, $k=${st.k}$, $x=${fr(st.xx, 3)}$: $P(S_{2n}=2k)=${sciT(st.ex, 4)}$ vs $(\\pi n)^{-1/2}e^{-x^2/2}=${sciT(st.ap, 4)}$, ratio $${fr(st.ex / st.ap, 5)}$. Stirling: $n!/(n^ne^{-n}\\sqrt{2\\pi n})=1+${sciT(st.s, 3)}$.`);
      },
    },
    {
      num: '3.1.3',
      kind: 'Theorem',
      name: 'De Moivre–Laplace theorem',
      statement: String.raw`Let $S_m$ be simple random walk (sums of independent fair $\pm1$ steps). For all $a<b$, as $m\to\infty$,
$$P\bigl(a\le S_m/\sqrt m\le b\bigr)\to\int_a^b(2\pi)^{-1/2}e^{-x^2/2}\,dx.$$`,
      idea: String.raw`For even $m=2n$, write the probability as a sum of $P(S_{2n}=j)$ over the even integers $j$ in $[a\sqrt{2n},b\sqrt{2n}]$. By Theorem 3.1.2, each term is $(2\pi)^{-1/2}e^{-x^2/2}$ times the spacing $\sqrt{2/n}$ of the points $x=j/\sqrt{2n}$, up to factors tending to $1$ uniformly on $[a,b]$. The sum is then a Riemann sum for the normal integral (Definition 1.2.5). Odd times follow from $S_{2n+1}=S_{2n}\pm1$. Theorem 3.4.1 extends this to sums of any i.i.d. variables with finite variance.`,
      caption: String.raw`A Galton board with $m$ rows: each seeded ball moves one step left or right at every peg, so it lands at $S_m$. Press play to drop 1600 balls. Right: the histogram of $S_m/\sqrt m$ (normalized by all 1600 balls) rises as balls land and fills in the normal density (green); the grey outline is the exact binomial histogram. Drag the gold handles $a$, $b$: the readout compares the exact probability, the normal area and the fraction of landed balls in $[a,b]$.`,
      deps: ['prob-3.1.2', 'prob-1.2.5'],
      tags: ['central limit theorem'],
      credit: 'De Moivre, 1733; Laplace, 1812',
      viz(v) {
        const mS = v.slider('rows $m$', 4, 64, 24, { int: true });
        let seed = 3; v.button('Resample', () => { seed++; v.restart(); });
        const B = v.stage({ x: [-25, 25], y: [-37, 1.5], axes: false, height: 340, title: 'Galton board' });
        const H = v.stage({ x: [-3.6, 3.6], y: [0, 0.62], axes: 'box', gutter: true, height: 340, xlabel: '$S_m/\\sqrt m$', title: 'landed balls: histogram of $S_m/\\sqrt m$' });
        const ha = H.handle(-1, 0, { color: 'gold', label: 'a', labelPos: 'n', constrain: (x) => [clampN(x, -3.5, 3.5), 0] });
        const hb = H.handle(1, 0, { color: 'gold', label: 'b', labelPos: 'n', constrain: (x) => [clampN(x, -3.5, 3.5), 0] });
        const NB = 1600, DROP = 11, FLY = 1.1;
        let cache = null, st = null;
        const sim = (m) => {
          if (cache && cache.m === m && cache.seed === seed) return cache;
          const r = v.rng(seed * 977 + m), bits = new Uint8Array(NB * m), fin = new Int16Array(NB);
          for (let i = 0; i < NB; i++) { let s = 0; for (let j = 0; j < m; j++) { const b = r() < 0.5 ? 1 : 0; bits[i * m + j] = b; s += b ? 1 : -1; } fin[i] = s; }
          const tau = Float64Array.from({ length: NB }, (_, i) => DROP * Math.pow(i / NB, 0.55));
          return (cache = { m, seed, bits, fin, tau });
        };
        v.animate((t) => {
          const m = mS.value, C = sim(m), rm = Math.sqrt(m), binH = 0.5 * m + 2;
          B.setView([-m - 1.5, m + 1.5], [-m - binH, 1.5]);
          const pegs = []; for (let r = 0; r < m; r++) for (let k = -r; k <= r; k += 2) pegs.push([k, -r]);
          B.dots(pegs, { r: m > 40 ? 1.1 : 1.6, color: 'muted' });
          // bins
          const counts = new Map(); let K = 0;
          for (let i = 0; i < NB; i++) if (C.tau[i] + FLY <= t) { counts.set(C.fin[i], (counts.get(C.fin[i]) || 0) + 1); K++; }
          const cmax = Math.max(8, ...counts.values());
          for (let s = -m; s <= m; s += 2) { B.line(s - 1, -m - 0.3, s - 1, -m - binH, { color: 'grid', width: 1 }); }
          for (const [s, c] of counts) B.rect(s - 0.8, -m - binH, s + 0.8, -m - binH + (c / cmax) * (binH - 1), { fill: 'accent', fillAlpha: 0.55, stroke: false });
          // balls in flight
          const fly = [];
          for (let i = 0; i < NB && fly.length < 70; i++) {
            const p = (t - C.tau[i]) / FLY; if (p < 0 || p >= 1) continue;
            const rr = p * m, r0 = Math.floor(rr), fr0 = rr - r0; let s = 0;
            for (let j = 0; j < r0; j++) s += C.bits[i * m + j] ? 1 : -1;
            const nx = r0 < m ? s + (C.bits[i * m + r0] ? 1 : -1) : s;
            fly.push([s + (nx - s) * fr0, -rr + 0.5]);
          }
          B.dots(fly, { r: 3.4, color: 'gold' });
          // histogram of S_m/√m
          const w = 2 / rm, edges = [], cnt = [], ex = [];
          const pm = binomPmf(m, 0.5);
          for (let s = -m; s <= m; s += 2) { edges.push((s - 1) / rm); cnt.push(counts.get(s) || 0); ex.push(pm[(s + m) / 2] / w); }
          edges.push((m + 1) / rm);
          const dens = cnt.map((c) => c / (NB * w)); // normalized by all balls: the histogram grows into the density
          const a = Math.min(ha.x, hb.x), b = Math.max(ha.x, hb.x);
          H.vband(a, b, { color: 'gold', alpha: 0.1 });
          H.hist({ edges, counts: cnt, density: dens }, { density: true, color: 'accent', fillAlpha: 0.4 });
          H.hist({ edges, counts: ex, density: ex }, { density: true, color: 'muted', fillAlpha: 0, width: 1.2 });
          H.fn(PHI, { color: 'green', width: 2.4 });
          let pe = 0, emp = 0;
          for (let s = -m; s <= m; s += 2) if (s / rm >= a - 1e-12 && s / rm <= b + 1e-12) { pe += pm[(s + m) / 2]; emp += counts.get(s) || 0; }
          st = { m, K, pe, pn: PhiN(v.M, b) - PhiN(v.M, a), emp: K ? emp / K : NaN, a, b };
          cornerIn(H, `${K} of ${NB} balls landed`, 'tr');
          v.legend([['accent', 'landed balls', { area: true }], ['muted', 'exact binomial'], ['green', 'normal density']]);
        }, { period: 13.5, still: 13 });
        v.readout(() => st && `$m=${st.m}$: $P(${fr(st.a, 2)}\\le S_m/\\sqrt m\\le ${fr(st.b, 2)})=${fr(st.pe, 4)}$ exactly, normal area $${fr(st.pn, 4)}$, landed balls $${isFinite(st.emp) ? fr(st.emp, 3) : '—'}$.`);
      },
    },
    // ======================================================================== §3.2 Weak convergence
    {
      num: '3.2.1a',
      kind: 'Definition',
      name: 'Weak convergence (convergence in distribution)',
      refs: ['Durrett, Probability: Theory and Examples, version 5 (11 January 2019), §3.2, p. 116 (unnumbered definition before Example 3.2.1)'],
      links: { source: 'https://math.duke.edu/~rtd/PTE/PTE5_011119.pdf' },
      statement: String.raw`Distribution functions $F_n$ **converge weakly** to $F$, written $F_n\Rightarrow F$, if $F_n(y)\to F(y)$ at every point $y$ where $F$ is continuous. Random variables $X_n$ **converge weakly**, or **in distribution**, to $X_\infty$, written $X_n\Rightarrow X_\infty$, if their distribution functions $F_n(x)=P(X_n\le x)$ converge weakly to that of $X_\infty$. The variables need not be defined on the same probability space.`,
      idea: String.raw`Nothing is asked at the jumps of $F$. The example $X+1/n$ shows why: its distribution function is $F(x-1/n)\to F(x-)$, which differs from $F(x)$ exactly at the atoms. Ignoring those points loses nothing. $F$ is right-continuous and has at most countably many jumps (Exercise 1.2.3), so its values on the dense set of continuity points determine it everywhere.`,
      caption: String.raw`Left: the limit $F$ (black, atoms marked) and $F_n$ (blue) with a few earlier $F_m$ faint; drag the gold handle to choose a point $x$. Right: $F_n(x)$ along $n$, with $F(x)$ in green and, at an atom, $F(x-)$ dashed red. For $X+1/n$ convergence fails exactly at the atoms ($0$ and $1$, ringed in red). For $X-1/n$ it holds even there, by right-continuity. The walk $S_n/\sqrt n$ and the scaled geometric $pX_p$ (Example 3.2.4) have continuous limits and converge everywhere.`,
      deps: ['prob-1.2.1b', 'prob-1.2.1'],
      tags: ['weak convergence'],
      viz(v) {
        const EX = {
          shift: { label: '$X+1/n$' }, shiftL: { label: '$X-1/n$' }, walk: { label: '$S_n/\\sqrt n$' }, geom: { label: '$pX_p,\\ p=\\tfrac1n$' },
        };
        const ex = v.select('$X_n=$', Object.entries(EX).map(([value, o]) => ({ value, label: o.label })), 'shift');
        const nS = v.slider('$n$', 1, 200, 4, { int: true, log: true });
        const L = v.stage({ x: [-3, 3], y: [-0.04, 1.06], axes: 'box', gutter: true, height: 320, weight: 1.25, xlabel: '$x$', title: '$F$ (black) and $F_n$ (blue)' });
        const R = v.stage({ x: [1, 1000], xlog: true, y: [-0.04, 1.06], axes: 'box', gutter: true, height: 320, xlabel: '$n$', title: '$F_n(x)$ at the chosen $x$' });
        const hx = L.handle(0, 0, { color: 'gold', label: 'x', labelPos: 'n', constrain: (x) => [snapTo(clampN(x, L.xr[0] + 0.05, L.xr[1] - 0.05), [0, 1], 0.07), 0] });
        const M = v.M;
        const walkCache = new Map(); const wl = (n) => { if (!walkCache.has(n)) walkCache.set(n, walkLaw(n)); return walkCache.get(n); };
        const defs = {
          shift: { F: (x) => mixF(M, x), Fm: (x) => mixFminus(M, x), Fn: (n, x) => mixF(M, x - 1 / n), atoms: [0, 1], xr: [-3, 2.5] },
          shiftL: { F: (x) => mixF(M, x), Fm: (x) => mixFminus(M, x), Fn: (n, x) => mixF(M, x + 1 / n), atoms: [0, 1], xr: [-3, 2.5] },
          walk: { F: (x) => PhiN(M, x), Fm: (x) => PhiN(M, x), Fn: (n, x) => discCdf(wl(n), x), atoms: [], xr: [-3, 3] },
          geom: { F: (x) => (x < 0 ? 0 : 1 - Math.exp(-x)), Fm: (x) => (x < 0 ? 0 : 1 - Math.exp(-x)), Fn: (n, x) => { const p = 1 / n; return x < p ? 0 : n === 1 ? 1 : 1 - Math.pow(1 - p, Math.floor(x / p + 1e-9)); }, atoms: [], xr: [-0.5, 4] },
        };
        let last = '', st = null;
        const ns = logInts(1, 1000, 80);
        v.render(() => {
          const D = defs[ex.value], n = nS.value;
          if (last !== ex.value) { last = ex.value; L.setView(D.xr, null); hx.set(ex.value === 'geom' ? 1 : 0, 0); }
          const x0 = hx.x;
          L.vline(x0, { color: 'gold', dash: [4, 4], width: 1 });
          for (const m of [1, 2, 3].map((k) => Math.max(1, Math.round(n / 2 ** k))).filter((m, i, a) => m < n && a.indexOf(m) === i)) L.fn((x) => D.Fn(m, x), { color: 'accent', width: 1, alpha: 0.3, n: 700 });
          L.fn(D.F, { color: 'ink', width: 2, n: 700 });
          L.fn((x) => D.Fn(n, x), { color: 'accent', width: 2.2, n: 900 });
          for (const a of D.atoms) {
            L.dot(a, D.Fm(a), { r: 4, hollow: true, color: 'ink' }); L.dot(a, D.F(a), { r: 4, color: 'ink' });
            ringPx(v, L, a, D.F(a), 10, ex.value === 'shift' ? 'red' : 'green', 2);
          }
          const vals = ns.map((m) => [m, D.Fn(m, x0)]);
          const Fx = D.F(x0), Fxm = D.Fm(x0), atom = Fx - Fxm > 1e-9;
          R.hline(Fx, { color: 'green', width: 2 });
          if (atom) R.hline(Fxm, { color: 'red', width: 1.6, dash: [6, 4] });
          R.dots(vals, { r: 2.8, color: 'accent' });
          R.dot(n, D.Fn(n, x0), { r: 6, color: 'accent' });
          st = { x0, Fx, Fxm, atom, Fbig: D.Fn(1000, x0), Fn: D.Fn(n, x0), n, kind: ex.value };
          v.legend([['ink', 'limit $F$'], ['accent', '$F_n$'], ['green', '$F(x)$'], ...(atom ? [['red', '$F(x-)$', { dash: [6, 4] }]] : [])]);
        });
        v.readout(() => st && `$x=${fr(st.x0, 2)}$ is ${st.atom ? `an **atom** of mass $${fr(st.Fx - st.Fxm, 2)}$` : 'a continuity point of $F$'}: $F_{${st.n}}(x)=${fr(st.Fn, 4)}$, $F_{1000}(x)=${fr(st.Fbig, 4)}$, $F(x)=${fr(st.Fx, 4)}$` + (st.atom ? `, $F(x-)=${fr(st.Fxm, 4)}$: ${st.kind === 'shift' ? 'the limit is $F(x-)$, so convergence fails here, and the definition does not ask for it.' : 'convergence holds even at the atom.'}` : '.'));
      },
    },
    {
      num: '3.2.5',
      kind: 'Theorem',
      name: 'Birthday problem',
      statement: String.raw`Let $X_1,X_2,\dots$ be independent and uniform on $\{1,\dots,N\}$, and let $T_N=\min\{n:X_n=X_m\text{ for some }m<n\}$ be the time of the first repeat. Then
$$P(T_N>n)=\prod_{m=2}^{n}\Bigl(1-\frac{m-1}{N}\Bigr),\qquad P\bigl(T_N/\sqrt N>x\bigr)\to e^{-x^2/2}\quad\text{for all }x\ge0.$$
For $N=365$ the approximation gives $P(T_{365}>22)\approx e^{-0.663}\approx0.515$; the exact value is $0.524$.`,
      idea: String.raw`$T_N>n$ means the first $n$ values are distinct: the $m$-th must avoid the $m-1$ values already seen, which has probability $1-(m-1)/N$. Take $n\approx x\sqrt N$. The factors $1+c_m$ with $c_m=-(m-1)/N$ have $\max_m|c_m|\to0$ and $\sum_m c_m\approx-n^2/2N\to-x^2/2$. The product form of Lemma 3.1.1 (Exercise 3.1.1) then gives $e^{-x^2/2}$. So $T_N/\sqrt N$ converges weakly to the law with density $xe^{-x^2/2}$ on $(0,\infty)$ (a Rayleigh law).`,
      caption: String.raw`Seeded experiments draw birthdays from $N$ days until the first repeat. Left: the histogram of $T_N/\sqrt N$ (gold), the exact law grouped into the same bins (grey) and the limiting density $xe^{-x^2/2}$ (green). Right: the exact tail $P(T_N>x\sqrt N)$ (blue steps) against $e^{-x^2/2}$. Drag the handle to read off one value; it starts at $n=22$ people for $N=365$. Small $N$ shows visible lattice effects; large $N$ lies on the curve.`,
      deps: ['prob-3.2.1a', 'prob-3.1.1'],
      see: ['algo-12.5', 'crypto-3.13'],
      tags: ['weak convergence', 'combinatorics'],
      credit: 'von Mises, 1939',
      viz(v) {
        const NS = v.slider('$N$ days', 20, 100000, 365, { log: true, int: true });
        let seed = 1; v.button('Resample', () => { seed++; });
        const L = v.stage({ x: [0, 4], y: [0, 0.8], axes: 'box', gutter: true, height: 320, xlabel: '$T_N/\\sqrt N$', title: '3000 experiments' });
        const R = v.stage({ x: [0, 4], y: [0, 1.04], axes: 'box', gutter: true, height: 320, xlabel: '$x$', title: '$P(T_N>x\\sqrt N)$ vs $e^{-x^2/2}$' });
        const hx = R.handle(22 / Math.sqrt(365), 0, { color: 'gold', label: 'x', labelPos: 'n', constrain: (x) => { const N = NS.value, r = Math.sqrt(N); return [clampN(Math.round(clampN(x, 0.05, 3.9) * r), 1, Math.floor(3.9 * r)) / r, 0]; } });
        const K = 3000; let cache = null, st = null, lastN = 365;
        const sim = (N) => {
          if (cache && cache.N === N && cache.seed === seed) return cache;
          const r = v.rng(seed * 7919 + N), stamp = new Int32Array(N), T = new Float64Array(K);
          for (let k = 0; k < K; k++) { let n = 0; for (;;) { n++; const d = Math.floor(r() * N); if (stamp[d] === k + 1) break; stamp[d] = k + 1; } T[k] = n; }
          return (cache = { N, seed, T });
        };
        v.render(() => {
          const N = NS.value, rN = Math.sqrt(N);
          if (N !== lastN) { lastN = N; hx.set(hx.x, 0); }
          const C = sim(N);
          // exact survival P(T > n) for n = 0..nmax
          const nmax = Math.ceil(4.2 * rN) + 2, surv = new Float64Array(nmax + 1); surv[0] = 1; surv[1] = 1;
          for (let n = 2; n <= nmax; n++) surv[n] = surv[n - 1] * Math.max(0, 1 - (n - 1) / N);
          // bins aligned with the lattice n/√N: each bin holds exactly kb consecutive values of T_N
          const kb = Math.max(1, Math.round(0.1 * rN)), w = kb / rN, nb = Math.floor((4 * rN - 0.5) / kb);
          const edges = Array.from({ length: nb + 1 }, (_, i) => (i * kb + 0.5) / rN), bin = (n) => Math.floor((n - 0.5) / kb);
          const cnt = new Array(nb).fill(0); for (const t of C.T) { const b = bin(t); if (b >= 0 && b < nb) cnt[b]++; }
          // exact bin probabilities: P(T in bin) = Σ P(T=n) = Σ (surv[n-1] − surv[n])
          const ex = new Array(nb).fill(0); for (let n = 2; n <= nmax; n++) { const b = bin(n); if (b >= 0 && b < nb) ex[b] += surv[n - 1] - surv[n]; }
          L.hist({ edges, counts: cnt, density: cnt.map((c) => c / (K * w)) }, { density: true, color: 'gold', fillAlpha: 0.45 });
          L.hist({ edges, counts: ex, density: ex.map((p) => p / w) }, { density: true, color: 'muted', fillAlpha: 0, width: 1.2 });
          L.fn((x) => x * Math.exp(-x * x / 2), { color: 'green', width: 2.4 });
          const pts = []; for (let n = 0; n <= nmax; n++) { const x = n / rN; if (x > 4.05) break; pts.push([x, surv[n]], [(n + 1) / rN, surv[n]]); }
          R.fn((x) => Math.exp(-x * x / 2), { color: 'green', width: 2.4 });
          R.path(pts, { color: 'accent', width: 2 });
          const n0 = Math.round(hx.x * rN), x0 = n0 / rN;
          let emp = 0; for (const t of C.T) if (t > n0) emp++;
          R.vline(x0, { color: 'gold', dash: [4, 4], width: 1 });
          R.dot(x0, surv[Math.min(n0, nmax)], { r: 5, color: 'accent' });
          R.dot(x0, Math.exp(-x0 * x0 / 2), { r: 4, color: 'green' });
          let mean = 0; for (const t of C.T) mean += t; mean /= K;
          st = { N, n0, x0, ex: surv[Math.min(n0, nmax)], ap: Math.exp(-x0 * x0 / 2), emp: emp / K, mean: mean / rN };
          v.legend([['gold', 'experiments', { area: true }], ['muted', 'exact law'], ['green', 'limit: $xe^{-x^2/2}$, tail $e^{-x^2/2}$'], ['accent', 'exact tail']]);
        });
        v.readout(() => st && `$N=${st.N}$, $n=${st.n0}$ ($x=${fr(st.x0, 4)}$): exact $P(T_N>n)=${fr(st.ex, 4)}$, limit $e^{-x^2/2}=${fr(st.ap, 4)}$, experiments $${fr(st.emp, 3)}$. Mean of $T_N/\\sqrt N$: $${fr(st.mean, 3)}$ (limit $\\sqrt{\\pi/2}=1.253$).`);
      },
    },
    {
      num: '3.2.7',
      kind: 'Lemma',
      name: 'Density of the median of 2n + 1 uniforms',
      statement: String.raw`Place $2n+1$ points independently and uniformly in $(0,1)$, and let $V_{n+1}$ be the $(n+1)$-th largest, the median. Then $V_{n+1}$ has density
$$f_{V_{n+1}}(x)=(2n+1)\binom{2n}{n}x^n(1-x)^n,\qquad0<x<1.$$`,
      idea: String.raw`For the median to sit near $x$, one of the $2n+1$ points must fall in $[x,x+dx]$ ($2n+1$ choices, probability $dx$). Of the remaining $2n$ points, a set of $n$ must fall below $x$ ($\binom{2n}{n}$ choices, probability $x^n$), and the other $n$ above it (probability $(1-x)^n$). Durrett uses this for Example 3.2.6. Changing variables to $Y_n=2(V_{n+1}-\tfrac12)\sqrt{2n}$ gives a density built from $P(S_{2n}=0)$ and $(1-y^2/2n)^n$. By Theorem 3.1.2 and Lemma 3.1.1 it tends to the normal density, and Scheffé's theorem upgrades this to convergence in total variation, hence weak convergence.`,
      caption: String.raw`Left: 4000 seeded medians (gold histogram) under the exact density (blue). The dots along the top show one sample of $2n+1$ points with its median in red. Right: the rescaled median $Y_n$, whose exact density (blue) approaches the standard normal density (green dashed). The readout gives the $L^1$ distance $\int|f_{Y_n}-\varphi|$ from Scheffé's argument, which shrinks as $n$ grows.`,
      deps: ['prob-1.2.2a'],
      tags: ['order statistics'],
      viz(v) {
        const nS = v.slider('$n$ ($2n+1$ points)', 1, 200, 5, { int: true, log: true });
        let seed = 1; v.button('Resample', () => { seed++; });
        const L = v.stage({ x: [0, 1], y: [0, 4], axes: 'box', gutter: true, height: 320, xlabel: '$x$', title: 'median $V_{n+1}$ of $2n+1$ uniforms' });
        const R = v.stage({ x: [-4, 4], y: [0, 0.56], axes: 'box', gutter: true, height: 320, xlabel: '$y$', title: '$Y_n=2(V_{n+1}-\\frac12)\\sqrt{2n}$ vs normal' });
        const K = 4000; let cache = null, st = null;
        const sim = (n) => {
          if (cache && cache.n === n && cache.seed === seed) return cache;
          const r = v.rng(seed * 313 + n), med = new Float64Array(K), buf = new Float64Array(2 * n + 1); let first = null;
          for (let k = 0; k < K; k++) { for (let i = 0; i <= 2 * n; i++) buf[i] = r(); if (!k) first = Array.from(buf); buf.sort(); med[k] = buf[n]; }
          return (cache = { n, seed, med, first });
        };
        v.render(() => {
          const n = nS.value, C = sim(n), lc = Math.log(2 * n + 1) + logChoose(2 * n, n);
          const fV = (x) => (x <= 0 || x >= 1 ? 0 : Math.exp(lc + n * Math.log(x) + n * Math.log1p(-x)));
          const peak = fV(0.5), ymax = peak * 1.42; L.setView(null, [0, ymax]);
          L.hist(C.med, { bins: 50, range: [0, 1], density: true, color: 'gold', fillAlpha: 0.45 });
          L.fn(fV, { color: 'accent', width: 2.4, n: 600 });
          const yS = peak * 1.25, md = [...C.first].sort((a, b) => a - b)[n];
          L.line(0, yS, 1, yS, { color: 'grid', width: 1 });
          L.dots(C.first.map((x) => [x, yS]), { r: n > 60 ? 1.6 : 2.6, color: 'gold' });
          L.dot(md, yS, { r: 5, color: 'red' });
          const s = 2 * Math.sqrt(2 * n), fY = (y) => fV(0.5 + y / s) / s;
          R.hist(Array.from(C.med, (m) => (m - 0.5) * s), { bins: 48, range: [-4, 4], density: true, color: 'gold', fillAlpha: 0.3 });
          R.fn(PHI, { color: 'green', width: 2, dash: [6, 4] });
          R.fn(fY, { color: 'accent', width: 2.4, n: 600 });
          let tv = 0; const hh = 0.005; for (let y = -8; y < 8; y += hh) tv += Math.abs(fY(y + hh / 2) - PHI(y + hh / 2)) * hh;
          let mv = 0; for (const m of C.med) mv += (m - 0.5) ** 2; mv /= K;
          st = { n, tv, mv, ev: 1 / (4 * (2 * n + 3)) };
          v.legend([['gold', 'seeded medians', { area: true }], ['accent', 'exact density'], ['green', 'normal density', { dash: [6, 4] }], ['red', 'median of one sample', { dot: true }]]);
        });
        v.readout(() => st && `$n=${st.n}$: $\\int|f_{Y_n}-\\varphi|\\,dy=${fr(st.tv, 4)}$. Sample variance of the medians $${sciT(st.mv, 3)}$ vs exact $\\frac1{4(2n+3)}=${sciT(st.ev, 3)}$ (and $\\frac1{8n}=${sciT(1 / (8 * st.n), 3)}$).`);
      },
    },
    {
      num: '3.2.8',
      kind: 'Theorem',
      name: 'Skorokhod representation on ℝ',
      statement: String.raw`If $F_n\Rightarrow F_\infty$, then on a single probability space there are random variables $Y_n$, $1\le n\le\infty$, such that $Y_n$ has distribution function $F_n$ for each $n$ and $Y_n\to Y_\infty$ almost surely.`,
      idea: String.raw`Use one uniform variable for all $n$: on $\Omega=(0,1)$ with Lebesgue measure put $Y_n(u)=F_n^{-1}(u)=\sup\{y:F_n(y)<u\}$. Theorem 1.2.2 says $Y_n$ has distribution $F_n$. Fix $u$ where $F_\infty^{-1}$ does not jump, meaning $F_\infty$ has no flat stretch at height $u$. Take a continuity point $y<F_\infty^{-1}(u)$; then $F_\infty(y)<u$, so $F_n(y)<u$ for large $n$, which forces $F_n^{-1}(u)\ge y$. Points above give the matching upper bound. The bad $u$ are the heights of flat stretches of $F_\infty$. These stretches are disjoint intervals, so there are only countably many bad $u$, a null set.`,
      caption: String.raw`Left: the quantile functions $F_n^{-1}$ on $(0,1)$ (blue, earlier $n$ faint) and $F^{-1}$ (black); drag the gold handle to choose $u$, the shared uniform. Right: the coupled values $Y_n(u)$ along $n$ for your $u$ (blue) and for eight seeded uniforms (faint), converging to $F^{-1}(u)$. Under "gap in the limit", $F$ is flat at height $\tfrac12$, so $F^{-1}$ jumps at $u=\tfrac12$. There $Y_n(\tfrac12)$ flips between about $-1$ and $1$ forever, while every other $u$ converges: a single exceptional point, a null set.`,
      deps: ['prob-1.2.2', 'prob-3.2.1a'],
      tags: ['weak convergence', 'coupling'],
      credit: 'Skorokhod, 1956',
      viz(v) {
        const EXS = { walk: '$S_n/\\sqrt n\\Rightarrow$ normal', geom: '$pX_p\\Rightarrow$ exponential', gap: 'gap in the limit' };
        const ex = v.select('$F_n\\Rightarrow F$', Object.entries(EXS).map(([value, label]) => ({ value, label })), 'walk');
        const nS = v.slider('$n$', 1, 400, 6, { int: true, log: true });
        const L = v.stage({ x: [0, 1], y: [-3, 3], axes: 'box', gutter: true, height: 330, weight: 1.15, xlabel: '$u$', title: 'quantile functions $Y_n(u)=F_n^{-1}(u)$' });
        const R = v.stage({ x: [1, 400], xlog: true, y: [-3, 3], axes: 'box', gutter: true, height: 330, xlabel: '$n$', title: 'coupled values $Y_n(u)$' });
        let hy = -3;
        const hu = L.handle(0.7, -3, { color: 'gold', label: 'u', labelPos: 'ne', constrain: (x) => [ex.value === 'gap' ? snapTo(clampN(x, 0.005, 0.995), [0.5], 0.012) : clampN(x, 0.005, 0.995), hy] });
        const N01 = v.M.dist.normal(0, 1);
        const wc = new Map(); const wl = (n) => { if (!wc.has(n)) wc.set(n, walkLaw(n)); return wc.get(n); };
        const D = {
          walk: { yr: [-3, 3], Q: (n, u) => discQuantile(wl(n), u), Qi: (u) => N01.quantile(u), u0: 0.7 },
          geom: { yr: [-0.3, 5], Q: (n, u) => { const p = 1 / (n + 1); return p * Math.max(1, Math.ceil(Math.log1p(-u) / Math.log1p(-p) - 1e-12)); }, Qi: (u) => -Math.log1p(-u), u0: 0.7 },
          gap: { yr: [-2.3, 2.3], Q: (n, u) => { const w = 0.5 + (n % 2 ? -1 : 1) / (n + 2); return u <= w ? -2 + u / w : 1 + (u - w) / (1 - w); }, Qi: (u) => (u <= 0.5 ? -2 + 2 * u : 1 + 2 * (u - 0.5)), u0: 0.5 },
        };
        const us = (() => { const r = v.rng(11); return Array.from({ length: 8 }, () => 0.03 + 0.94 * r()); })();
        const ns = logInts(1, 400, 70);
        let last = '', st = null;
        v.render(() => {
          const E = D[ex.value], n = nS.value;
          if (last !== ex.value) { last = ex.value; L.setView(null, E.yr); R.setView(null, E.yr); hy = E.yr[0]; hu.set(E.u0, hy); }
          hy = E.yr[0];
          const u = hu.x;
          for (const m of [1, 2, 3].map((k) => Math.max(1, Math.round(n / 2 ** k))).filter((m, i, a) => m < n && a.indexOf(m) === i)) L.fn((x) => E.Q(m, x), { domain: [0.003, 0.997], color: 'accent', width: 1, alpha: 0.3, n: 600 });
          L.fn(E.Qi, { domain: [0.003, 0.997], color: 'ink', width: 2, n: 600 });
          L.fn((x) => E.Q(n, x), { domain: [0.003, 0.997], color: 'accent', width: 2.2, n: 800 });
          for (const uu of us) L.line(uu, E.yr[0], uu, E.yr[0] + 0.04 * (E.yr[1] - E.yr[0]), { color: 'muted', width: 1.4 });
          L.vline(u, { color: 'gold', dash: [4, 4], width: 1 });
          L.dot(u, E.Q(n, u), { r: 5, color: 'accent' });
          for (const uu of us) R.path(ns.map((m) => [m, E.Q(m, uu)]), { color: 'muted', width: 1, alpha: 0.55 });
          R.hline(E.Qi(u), { color: 'green', width: 1.8 });
          R.path(ns.map((m) => [m, E.Q(m, u)]), { color: 'accent', width: 1.4, alpha: 0.6 });
          R.dots(ns.map((m) => [m, E.Q(m, u)]), { r: 2.6, color: 'accent' });
          R.dot(n, E.Q(n, u), { r: 5.5, color: 'accent' });
          st = { u, n, y: E.Q(n, u), lim: E.Qi(u), y399: E.Q(399, u), y400: E.Q(400, u), gap: ex.value === 'gap' && Math.abs(u - 0.5) < 1e-9 };
          v.legend([['ink', '$F^{-1}$'], ['accent', '$F_n^{-1}$, $Y_n(u)$'], ['muted', 'other seeded $u$'], ['green', '$F^{-1}(u)$']]);
        });
        v.readout(() => st && `$u=${fr(st.u, 3)}$: $Y_{${st.n}}(u)=${fr(st.y, 4)}$, $Y_{399}(u)=${fr(st.y399, 4)}$, $Y_{400}(u)=${fr(st.y400, 4)}$; limit $F^{-1}(u)=${fr(st.lim, 4)}$` + (st.gap ? '. This $u$ is the height of the flat stretch of $F$, the one exceptional point: $Y_n(u)$ does not converge.' : '.'));
      },
    },
    {
      num: '3.2.9',
      kind: 'Theorem',
      name: 'Weak convergence via bounded continuous functions',
      statement: String.raw`$X_n\Rightarrow X_\infty$ if and only if $Eg(X_n)\to Eg(X_\infty)$ for every bounded continuous function $g:\R\to\R$.`,
      idea: String.raw`($\Rightarrow$) By Theorem 3.2.8 choose $Y_n$ with the same laws as $X_n$ and $Y_n\to Y_\infty$ a.s. Then $g(Y_n)\to g(Y_\infty)$ a.s., and the bounded convergence theorem gives $Eg(X_n)=Eg(Y_n)\to Eg(Y_\infty)$. ($\Leftarrow$) Squeeze the indicator $1_{(-\infty,x]}$ between continuous ramps that go from $1$ to $0$ over $[x-\eps,x]$ or $[x,x+\eps]$. This gives $\limsup P(X_n\le x)\le P(X_\infty\le x+\eps)$ and $\liminf P(X_n\le x)\ge P(X_\infty\le x-\eps)$. At a continuity point both bounds tend to $F(x)$. This form of the definition makes sense in any topological space.`,
      caption: String.raw`Left: the test function $g$ (black) and the law of $X_n$ (blue stems, heights relative to the largest atom). Right: $Eg(X_n)$ along $n$ against $Eg(X_\infty)$ (green). Continuous bounded $g$ always works. The indicator $1_{(-\infty,0]}$ is discontinuous at $0$, and it fails for $X_n=1/n$, whose mass approaches $0$ from the side where $g=0$. The unbounded $g(x)=x$ fails for the spike $n\cdot1\{U<1/n\}$: it converges weakly to $0$, but a mass $1/n$ at $x=n$ keeps $EX_n=1$.`,
      deps: ['prob-3.2.8', 'prob-1.5.3'],
      tags: ['weak convergence'],
      viz(v) {
        const SQ = { pt: '$X_n=1/n$', walk: '$S_n/\\sqrt n$', spike: '$n\\,1\\{U<\\frac1n\\}$' };
        const GS = { cos: { label: '$\\cos x$', g: Math.cos }, atan: { label: '$\\arctan x$', g: Math.atan }, ind: { label: '$1_{(-\\infty,0]}$', g: (x) => (x <= 0 ? 1 : 0) }, id: { label: '$x$ (unbounded)', g: (x) => x } };
        const sq = v.select('$X_n=$', Object.entries(SQ).map(([value, label]) => ({ value, label })), 'pt');
        const gs = v.select('$g=$', Object.entries(GS).map(([value, o]) => ({ value, label: o.label })), 'ind');
        const nS = v.slider('$n$', 1, 400, 5, { int: true, log: true });
        const L = v.stage({ x: [-3, 3], y: [-1.7, 1.7], axes: 'box', gutter: true, height: 320, weight: 1.15, xlabel: '$x$', title: '$g$ and the law of $X_n$' });
        const R = v.stage({ x: [1, 400], xlog: true, y: [-0.2, 1.2], axes: 'box', gutter: true, height: 320, xlabel: '$n$', title: '$Eg(X_n)$ vs $Eg(X_\\infty)$' });
        const wc = new Map(); const wl = (n) => { if (!wc.has(n)) wc.set(n, walkLaw(n)); return wc.get(n); };
        const law = (k, n) => (k === 'pt' ? [[1 / n, 1]] : k === 'spike' ? (n === 1 ? [[1, 1]] : [[0, 1 - 1 / n], [n, 1 / n]]) : Array.from(wl(n).xs, (x, i) => [x, wl(n).ps[i]]));
        const Eg = (g, A) => A.reduce((s, [x, p]) => s + p * g(x), 0);
        const limit = (k, gk) => (k === 'walk' ? { cos: Math.exp(-0.5), atan: 0, ind: 0.5, id: 0 }[gk] : GS[gk].g(0));
        const ns = logInts(1, 400, 80);
        let st = null;
        v.render(() => {
          const g = GS[gs.value].g, n = nS.value, A = law(sq.value, n), lim = limit(sq.value, gs.value);
          L.hline(0, { color: 'grid', width: 1 });
          const pm = Math.max(...A.map((a) => a[1]));
          stems(L, A.filter(([x]) => x > -3.05 && x < 3.05), { scale: 1.3 / pm, color: 'accent', r: A.length > 60 ? 1.5 : 3.5, width: A.length > 60 ? 1.2 : 2.2, alpha: 0.75 });
          L.fn(g, { color: 'ink', width: 2.2, n: 800 });
          const far = A.filter(([x]) => x > 3.05);
          if (far.length) { L.arrow(2.1, 1.0, 2.95, 1.0, { color: 'red', width: 2 }); L.text(`mass ${fr(far[0][1], 3)} at x = ${far[0][0]}`, 2.85, 1.25, { align: 'right', color: 'red', size: 12 }); }
          const vals = ns.map((m) => [m, Eg(g, law(sq.value, m))]);
          const ys = vals.map((p) => p[1]).concat([lim]); const lo = Math.min(...ys), hi = Math.max(...ys), pad = Math.max(0.15, 0.12 * (hi - lo));
          R.setView(null, [lo - pad, hi + pad]);
          R.hline(lim, { color: 'green', width: 2 });
          R.dots(vals, { r: 2.8, color: 'accent' });
          const e = Eg(g, A); R.dot(n, e, { r: 6, color: 'accent' });
          const e400 = Eg(g, law(sq.value, 400));
          st = { e, lim, e400, n, ok: Math.abs(e400 - lim) < 0.02, bad: gs.value === 'ind' || gs.value === 'id' };
          v.legend([['ink', '$g$'], ['accent', 'law of $X_n$ / $Eg(X_n)$', { dot: true }], ['green', '$Eg(X_\\infty)$']]);
        });
        v.readout(() => st && `$Eg(X_{${st.n}})=${fr(st.e, 4)}$, $Eg(X_{400})=${fr(st.e400, 4)}$, $Eg(X_\\infty)=${fr(st.lim, 4)}$: ` + (st.ok ? (st.bad ? 'converges here, though $g$ is not bounded and continuous, so the theorem does not promise it.' : 'converges, as the theorem promises.') : '**no convergence**: $g$ is not bounded and continuous, so the theorem does not apply.'));
      },
    },
    {
      num: '3.2.10',
      kind: 'Theorem',
      name: 'Continuous mapping theorem',
      statement: String.raw`Let $g$ be measurable and let $D_g=\{x:g\text{ is discontinuous at }x\}$. If $X_n\Rightarrow X_\infty$ and $P(X_\infty\in D_g)=0$, then $g(X_n)\Rightarrow g(X_\infty)$. If in addition $g$ is bounded, then $Eg(X_n)\to Eg(X_\infty)$. ($D_g$ is always a Borel set.)`,
      idea: String.raw`Couple with Theorem 3.2.8: $Y_n\overset d=X_n$ and $Y_n\to Y_\infty$ a.s. Off the null event $\{Y_\infty\in D_g\}$, $g$ is continuous at $Y_\infty$, so $g(Y_n)\to g(Y_\infty)$ a.s. For bounded continuous $f$, $f\circ g$ is then also an a.s. limit, and bounded convergence plus Theorem 3.2.9 give $g(X_n)\Rightarrow g(X_\infty)$. The second statement is bounded convergence applied directly to $g(Y_n)$.`,
      caption: String.raw`Left: the distribution function of $g(X_n)$ (blue) against that of $g(X_\infty)$ (black, its atoms marked). Right: the largest gap between them at continuity points of the limit (staying $0.05$ away from its atoms). For $S_n/\sqrt n\Rightarrow$ normal every listed $g$ works, even the jumps, because the normal charges no single point. The second sequence is $X_n=Y+1/n$, where $Y$ has an atom of mass $\tfrac12$ at $0$. There $g=1\{x>0\}$ jumps at a charged point: $g(X_n)\Rightarrow$ Bernoulli$(\tfrac34)$, but $g(X_\infty)$ is Bernoulli$(\tfrac14)$.`,
      deps: ['prob-3.2.8', 'prob-3.2.9'],
      tags: ['weak convergence'],
      credit: 'Mann & Wald, 1943',
      viz(v) {
        const SQ = { walk: '$S_n/\\sqrt n$', atom: '$Y+1/n$ (atom at $0$)' };
        const GS = { sq: '$x^2$', abs: '$|x|$', pos: '$1\\{x>0\\}$', one: '$1\\{x>1\\}$' };
        const sq = v.select('$X_n=$', Object.entries(SQ).map(([value, label]) => ({ value, label })), 'atom');
        const gs = v.select('$g=$', Object.entries(GS).map(([value, label]) => ({ value, label })), 'pos');
        const nS = v.slider('$n$', 1, 400, 8, { int: true, log: true });
        const L = v.stage({ x: [-0.3, 4], y: [-0.04, 1.06], axes: 'box', gutter: true, height: 320, weight: 1.15, xlabel: '$y$', title: '$P(g(X_n)\\le y)$ and $P(g(X_\\infty)\\le y)$' });
        const R = v.stage({ x: [1, 400], xlog: true, y: [1e-3, 1], ylog: true, axes: 'box', gutter: true, height: 320, xlabel: '$n$', title: 'largest gap at continuity points' });
        const M = v.M, F = (z) => PhiN(M, z);
        const gf = { sq: (x) => x * x, abs: Math.abs, pos: (x) => (x > 0 ? 1 : 0), one: (x) => (x > 1 ? 1 : 0) };
        const wc = new Map();
        const walkG = (n, gk) => { // sorted values of g(S_n/√n) with cumulative masses
          const key = n + gk; if (wc.has(key)) return wc.get(key);
          const W = walkLaw(n), pairs = Array.from(W.xs, (x, i) => [gf[gk](x), W.ps[i]]).sort((a, b) => a[0] - b[0]);
          const xs = [], cs = []; let c = 0; for (const [y, p] of pairs) { c += p; if (xs.length && Math.abs(xs[xs.length - 1] - y) < 1e-12) cs[cs.length - 1] = c; else { xs.push(y); cs.push(c); } }
          const o = { xs, cs }; wc.set(key, o); return o;
        };
        // distribution functions of g(X_n) and of the limit, plus the limit's atoms
        const cdfN = (k, gk, n, y) => {
          if (k === 'walk') return discCdf(walkG(n, gk), y);
          const h = 1 / n, half = 0.5;
          if (gk === 'sq') return half * (h * h <= y) + (y < 0 ? 0 : half * (F(Math.sqrt(y) - h) - F(-Math.sqrt(y) - h)));
          if (gk === 'abs') return half * (h <= y) + (y < 0 ? 0 : half * (F(y - h) - F(-y - h)));
          const p1 = gk === 'pos' ? half + half * (1 - F(-h)) : half * (1 - F(1 - h)); // P(g = 1)
          return y < 0 ? 0 : y < 1 ? 1 - p1 : 1;
        };
        const lim = (k, gk) => {
          if (k === 'walk') {
            if (gk === 'sq') return { F: (y) => (y <= 0 ? 0 : 2 * F(Math.sqrt(y)) - 1), atoms: [] };
            if (gk === 'abs') return { F: (y) => (y <= 0 ? 0 : 2 * F(y) - 1), atoms: [] };
            const p1 = gk === 'pos' ? 0.5 : 1 - F(1); return { F: (y) => (y < 0 ? 0 : y < 1 ? 1 - p1 : 1), atoms: [0, 1], p1 };
          }
          if (gk === 'sq') return { F: (y) => (y < 0 ? 0 : 0.5 + 0.5 * (2 * F(Math.sqrt(y)) - 1)), atoms: [0] };
          if (gk === 'abs') return { F: (y) => (y < 0 ? 0 : 0.5 + 0.5 * (2 * F(y) - 1)), atoms: [0] };
          const p1 = gk === 'pos' ? 0.25 : 0.5 * (1 - F(1)); return { F: (y) => (y < 0 ? 0 : y < 1 ? 1 - p1 : 1), atoms: [0, 1], p1 };
        };
        const ns = logInts(1, 400, 60);
        let st = null;
        v.render(() => {
          const k = sq.value, gk = gs.value, n = nS.value, Lm = lim(k, gk), ind = gk === 'pos' || gk === 'one';
          L.setView(ind ? [-0.4, 1.6] : [-0.3, 4], null);
          L.fn(Lm.F, { color: 'ink', width: 2, n: 800 });
          L.fn((y) => cdfN(k, gk, n, y), { color: 'accent', width: 2.2, n: 900 });
          for (const a of Lm.atoms) { const lo = Lm.F(a - 1e-9), hi = Lm.F(a); if (hi - lo > 1e-9) { L.dot(a, lo, { r: 4, hollow: true, color: 'ink' }); L.dot(a, hi, { r: 4, color: 'ink' }); } }
          const grid = []; for (let y = L.xr[0]; y <= L.xr[1]; y += 0.01) if (Lm.atoms.every((a) => Math.abs(y - a) > 0.05)) grid.push(y);
          const gap = (m) => grid.reduce((d, y) => Math.max(d, Math.abs(cdfN(k, gk, m, y) - Lm.F(y))), 0);
          const pts = ns.map((m) => [m, Math.max(1.1e-3, gap(m))]);
          R.path(pts, { color: 'accent', width: 1.6, alpha: 0.6 }); R.dots(pts, { r: 2.6, color: 'accent' });
          const gn = Math.max(1.1e-3, gap(n)); R.dot(n, gn, { r: 6, color: 'accent' });
          const dg = { sq: [], abs: [], pos: [0], one: [1] }[gk], charged = k === 'atom' && dg.includes(0) ? 0.5 : 0;
          const p1n = ind ? 1 - cdfN(k, gk, n, 0.5) : null;
          st = { gn: gap(n), g400: gap(400), charged, dg, ind, p1n, p1: Lm.p1, n };
          v.legend([['accent', '$g(X_n)$'], ['ink', '$g(X_\\infty)$']]);
        });
        v.readout(() => st && `$D_g=${st.dg.length ? `\\{${st.dg[0]}\\}` : '\\emptyset'}$, $P(X_\\infty\\in D_g)=${fr(st.charged, 2)}$. Largest gap at $n=${st.n}$: $${fr(st.gn, 4)}$; at $n=400$: $${fr(st.g400, 4)}$` + (st.ind ? `. $Eg(X_{${st.n}})=${fr(st.p1n, 4)}$ vs $Eg(X_\\infty)=${fr(st.p1, 4)}$` : '') + (st.charged ? ': the hypothesis fails and so does the conclusion.' : ': the hypothesis holds and the laws converge.'));
      },
    },
    {
      num: '3.2.11',
      kind: 'Theorem',
      name: 'Portmanteau theorem',
      statement: String.raw`The following are equivalent:

(i) $X_n\Rightarrow X_\infty$;

(ii) $\liminf_{n}P(X_n\in G)\ge P(X_\infty\in G)$ for every open set $G$;

(iii) $\limsup_{n}P(X_n\in K)\le P(X_\infty\in K)$ for every closed set $K$;

(iv) $\lim_{n}P(X_n\in A)=P(X_\infty\in A)$ for every Borel set $A$ whose boundary has $P(X_\infty\in\partial A)=0$.`,
      idea: String.raw`(i)⇒(ii): couple a.s. (Theorem 3.2.8). Since $G$ is open, $\liminf 1_G(Y_n)\ge1_G(Y_\infty)$, and Fatou's lemma gives (ii). (ii)⇔(iii) by complements. (ii)+(iii)⇒(iv): squeeze $A$ between its interior $A^\circ$ and its closure $\bar A$. These differ by $\partial A$, so they have the same $X_\infty$-probability. (iv)⇒(i): take $A=(-\infty,x]$ with $x$ a continuity point. Mnemonic: point masses at $x_n\in G$ with $x_n\to x\in\partial G$ have $P(X_n\in G)=1$ but $P(X_\infty\in G)=0$, so the inequality in (ii) can be strict.`,
      caption: String.raw`Drag the gold handles to choose an interval: $G=(a,b)$ is open and $K=[a,b]$ is closed. Endpoints snap to multiples of $0.05$ so they can sit exactly on atoms. Left: the law of $X_n$ (blue) and of the limit (black). Right: $P(X_n\in G)$ (blue) and $P(X_n\in K)$ (orange) along $n$, with the limit's $P(X_\infty\in G)$ (green) and $P(X_\infty\in K)$ (green dashed). For point masses at $1-1/n$, take $b=1$: $P(X_n\in G)=1$ for all $n$ but $P(X_\infty\in G)=0$. The inequalities are strict exactly when the limit charges $\partial A$.`,
      deps: ['prob-3.2.8', 'prob-1.5.5'],
      tags: ['weak convergence'],
      credit: 'Aleksandrov, 1940–43',
      viz(v) {
        const SQ = { point: 'point mass at $1-\\frac1n$', grid: 'uniform on $\\{\\frac kn\\}$', walk: '$S_n/\\sqrt n$' };
        const sq = v.select('$X_n$', Object.entries(SQ).map(([value, label]) => ({ value, label })), 'point');
        const nS = v.slider('$n$', 1, 400, 10, { int: true, log: true });
        const L = v.stage({ x: [-0.5, 1.5], y: [-0.08, 1.15], axes: 'box', gutter: true, height: 310, weight: 1.15, xlabel: '$x$', title: 'laws and the set $A$' });
        const R = v.stage({ x: [1, 400], xlog: true, y: [-0.04, 1.08], axes: 'box', gutter: true, height: 310, xlabel: '$n$', title: '$P(X_n\\in G)$, $P(X_n\\in K)$' });
        const q = (x) => Math.round(x * 20) / 20;
        const ha = L.handle(0.3, -0.08, { color: 'gold', label: 'a', labelPos: 'n', constrain: (x) => [q(clampN(x, L.xr[0], L.xr[1])), -0.08] });
        const hb = L.handle(1, -0.08, { color: 'gold', label: 'b', labelPos: 'n', constrain: (x) => [q(clampN(x, L.xr[0], L.xr[1])), -0.08] });
        const M = v.M, wc = new Map(); const wl = (n) => { if (!wc.has(n)) wc.set(n, walkLaw(n)); return wc.get(n); };
        const prob = (k, n, a, b) => { // [P(X_n ∈ (a,b)), P(X_n ∈ [a,b])]
          const ja = Math.round(a * 20), jb = Math.round(b * 20);
          if (k === 'point') { const x = 1 - 1 / n; return [+(a < x - 1e-12 && x < b - 1e-12), +(a <= x + 1e-12 && x <= b + 1e-12)]; }
          if (k === 'grid') { let o = 0, c = 0; for (let i = 1; i <= n; i++) { const t = 20 * i; if (ja * n < t && t < jb * n) o++; if (ja * n <= t && t <= jb * n) c++; } return [o / n, c / n]; }
          const W = wl(n); let o = 0, c = 0; for (let i = 0; i <= n; i++) { const x = W.xs[i]; if (x > a + 1e-12 && x < b - 1e-12) o += W.ps[i]; if (x >= a - 1e-12 && x <= b + 1e-12) c += W.ps[i]; } return [o, c];
        };
        const limP = (k, a, b) => {
          if (k === 'point') return [+(a < 1 && 1 < b), +(a <= 1 && 1 <= b), +(Math.abs(a - 1) < 1e-9 || Math.abs(b - 1) < 1e-9)];
          if (k === 'grid') { const p = Math.max(0, Math.min(b, 1) - Math.max(a, 0)); return [p, p, 0]; }
          const p = Math.max(0, PhiN(M, b) - PhiN(M, a)); return [p, p, 0];
        };
        const ns = logInts(1, 400, 80);
        let last = '', st = null;
        v.render(() => {
          const k = sq.value, n = nS.value;
          if (last !== k) { last = k; const xr = k === 'walk' ? [-3, 3] : [-0.5, 1.5]; L.setView(xr, null); if (k === 'walk') { ha.set(0, -0.08); hb.set(1, -0.08); } else if (k === 'grid') { ha.set(0.25, -0.08); hb.set(0.5, -0.08); } else { ha.set(0.3, -0.08); hb.set(1, -0.08); } }
          const a = Math.min(ha.x, hb.x), b = Math.max(ha.x, hb.x);
          L.vband(a, b, { color: 'gold', alpha: 0.12 });
          L.line(a, -0.08, b, -0.08, { color: 'gold', width: 5 });
          if (k === 'point') { L.line(1, 0, 1, 1, { color: 'ink', width: 2 }); L.dot(1, 1, { r: 4, color: 'ink' }); const x = 1 - 1 / n; L.line(x, 0, x, 0.85, { color: 'accent', width: 2.4 }); L.dot(x, 0.85, { r: 4, color: 'accent' }); }
          else if (k === 'grid') { L.fn((x) => (x > 0 && x < 1 ? 1 : 0), { color: 'ink', width: 2 }); const h = Math.min(0.9, 2 / n + 0.12); for (let i = 1; i <= n; i++) L.line(i / n, 0, i / n, h, { color: 'accent', width: n > 80 ? 1 : 2, alpha: 0.7 }); }
          else { L.fn((x) => PHI(x) * 2.2, { color: 'ink', width: 2 }); const W = wl(n), pm = Math.max(...W.ps); for (let i = 0; i <= n; i++) if (Math.abs(W.xs[i]) < 3.05) L.line(W.xs[i], 0, W.xs[i], W.ps[i] / pm * 0.85, { color: 'accent', width: n > 80 ? 1 : 2, alpha: 0.7 }); }
          const [G, K, bd] = limP(k, a, b);
          const P = ns.map((m) => [m, ...prob(k, m, a, b)]);
          R.hline(G, { color: 'green', width: 2 }); R.hline(K, { color: 'green', width: 1.6, dash: [6, 4] });
          R.dots(P.map((p) => [p[0], p[2]]), { r: 3.2, color: 'orange' });
          R.dots(P.map((p) => [p[0], p[1]]), { r: 2.4, color: 'accent' });
          const pn = prob(k, n, a, b); R.dot(n, pn[0], { r: 5.5, color: 'accent' }); R.dot(n, pn[1], { r: 5.5, color: 'orange' });
          const tail = []; for (let m = 200; m <= 400; m++) tail.push(prob(k, m, a, b));
          st = { a, b, G, K, bd, gl: Math.min(...tail.map((t) => t[0])), gh: Math.max(...tail.map((t) => t[0])), kl: Math.min(...tail.map((t) => t[1])), kh: Math.max(...tail.map((t) => t[1])) };
          v.legend([['accent', '$P(X_n\\in G)$', { dot: true }], ['orange', '$P(X_n\\in K)$', { dot: true }], ['green', '$P(X_\\infty\\in G)$'], ['green', '$P(X_\\infty\\in K)$', { dash: [6, 4] }]]);
        });
        v.readout(() => st && `$A$ from $${fr(st.a, 2)}$ to $${fr(st.b, 2)}$, $P(X_\\infty\\in\\partial A)=${fr(st.bd, 2)}$. For $200\\le n\\le400$: $P(X_n\\in G)\\in[${fr(st.gl, 3)},${fr(st.gh, 3)}]$ vs $P(X_\\infty\\in G)=${fr(st.G, 3)}$; $P(X_n\\in K)\\in[${fr(st.kl, 3)},${fr(st.kh, 3)}]$ vs $P(X_\\infty\\in K)=${fr(st.K, 3)}$` + (st.bd > 0 ? '. The boundary is charged: the limits of $P(X_n\\in G)$ and $P(X_n\\in K)$ can sit strictly above $P(X_\\infty\\in G)$ and below $P(X_\\infty\\in K)$.' : '. The boundary is null, so by (iv) both tend to the same limit; the spread is lattice noise that shrinks as $n$ grows.'));
      },
    },
    {
      num: '3.2.12',
      kind: 'Theorem',
      name: 'Helly’s selection theorem',
      statement: String.raw`Every sequence $F_n$ of distribution functions has a subsequence $F_{n(k)}$ and a right-continuous nondecreasing function $F$ such that $F_{n(k)}(y)\to F(y)$ at every continuity point $y$ of $F$. The limit need not be a distribution function: $F(-\infty)$ may be $>0$ and $F(\infty)$ may be $<1$ (mass escaping to $\mp\infty$). This kind of convergence is called **vague convergence**.`,
      idea: String.raw`List the rationals $q_1,q_2,\dots$. The values $F_m(q_1)$ lie in $[0,1]$, so some subsequence makes them converge; inside it, a further subsequence makes $F_m(q_2)$ converge, and so on. The diagonal sequence, the $k$-th term of the $k$-th subsequence, converges at every rational to some $G(q)$. Then $F(x)=\inf\{G(q):q>x\}$ is right-continuous and nondecreasing. At a continuity point $x$, monotonicity squeezes $F_{n(k)}(x)$ between values at nearby rationals. Nothing stops mass from leaving: Durrett's example $a1_{[n,\infty)}+b1_{[-n,\infty)}+cG$ loses $a$ to $+\infty$ and $b$ to $-\infty$.`,
      caption: String.raw`The sequence is $F_m(x)=c\,\Phi\bigl((x-2\sin m)/0.6\bigr)+a\,1\{x\ge m\}+b\,1\{x\ge-m\}$ for $m\le20000$. It has no limit, because $\sin m$ keeps wandering. Step the diagonal argument with "stage $k$". At stage $k$, the indices whose values at $q_k$ cluster in a shrinking interval are kept (right: one row per stage, gold = the diagonal pick $n(k)$). Left: the first 25 survivors and the intervals pinned at $q_1,\dots,q_k$ (green). The limit along the diagonal (green dashed) is defective. It starts at height $b$ and ends at $1-a$.`,
      deps: ['prob-1.2.1'],
      tags: ['weak convergence', 'compactness'],
      credit: 'Helly, 1912',
      viz(v) {
        const aS = v.slider('mass $a\\to+\\infty$', 0, 0.4, 0.2, { step: 0.01 });
        const bS = v.slider('mass $b\\to-\\infty$', 0, 0.4, 0.1, { step: 0.01 });
        const kS = v.slider('stage $k$', 0, 8, 4, { int: true });
        const L = v.stage({ x: [-4, 4], y: [-0.04, 1.06], axes: 'box', gutter: true, height: 330, weight: 1.15, xlabel: '$x$', title: 'survivors after stage $k$' });
        const R = v.stage({ x: [1, 20000], xlog: true, y: [-0.6, 8.6], axes: 'box', gutter: true, height: 330, xlabel: 'index $m$', ylabel: 'stage', yticks: [0, 1, 2, 3, 4, 5, 6, 7, 8], title: 'nested subsequences' });
        const Q = [0, 1, -1, 0.5, -0.5, 2, -2, 1.5], QL = ['0', '1', '−1', '½', '−½', '2', '−2', '3⁄2'];
        const N = 20000, M = v.M; let cache = null, st = null;
        const run = (a, b) => {
          const key = a + '|' + b; if (cache && cache.key === key) return cache;
          const c = 1 - a - b, s = Float64Array.from({ length: N + 1 }, (_, m) => Math.sin(m));
          const Fm = (m, x) => c * PhiN(M, (x - 2 * s[m]) / 0.6) + a * (x >= m) + b * (x >= -m);
          let cur = Array.from({ length: N }, (_, i) => i + 1); const sets = [cur], ints = [];
          for (let k = 0; k < 8; k++) {
            let lo = 0, hi = 1;
            for (let t = 0; t < 3; t++) {
              const mid = (lo + hi) / 2, left = cur.filter((m) => Fm(m, Q[k]) <= mid), right = cur.filter((m) => Fm(m, Q[k]) > mid);
              if (left.length >= right.length) { cur = left; hi = mid; } else { cur = right; lo = mid; }
            }
            sets.push(cur); ints.push([lo, hi]);
          }
          const fin = sets[8], sbar = fin.reduce((t, m) => t + s[m], 0) / fin.length;
          return (cache = { key, sets, ints, Fm, sbar, c });
        };
        v.render(() => {
          const a = aS.value, b = bS.value, k = kS.value, C = run(a, b), S = C.sets[k];
          const show = S.filter((m) => m > k).slice(0, 25);
          for (const m of show) L.fn((x) => C.Fm(m, x), { color: 'accent', width: 1.1, alpha: 0.45, n: 500 });
          L.hline(b, { color: 'muted', dash: [3, 4], width: 1 }); L.hline(1 - a, { color: 'muted', dash: [3, 4], width: 1 });
          L.text('$b$', -3.85, b, { dy: -10, color: 'muted', size: 12 }); L.text('$1-a$', -3.85, 1 - a, { dy: -10, color: 'muted', size: 12 });
          L.fn((x) => C.c * PhiN(M, (x - 2 * C.sbar) / 0.6) + b, { color: 'green', width: 2, dash: [6, 4], n: 400 });
          for (let j = 0; j < k; j++) { const [lo, hi] = C.ints[j]; L.line(Q[j], lo, Q[j], hi, { color: 'green', width: 4 }); L.dot(Q[j], (lo + hi) / 2, { r: 3.5, color: 'green' }); L.text(QL[j], Q[j], 1.0, { align: 'center', color: 'green', size: 11 }); }
          for (let j = 0; j <= 8; j++) {
            const set = C.sets[j]; const col = j <= k ? 'accent' : 'faint';
            const pts = set.length > 4000 ? set.filter((_, i) => i % Math.ceil(set.length / 4000) === 0) : set;
            R.dots(pts.map((m) => [m, j]), { r: 1.3, color: col, alpha: j <= k ? 0.8 : 0.4 });
            if (j >= 1 && set.length >= j) R.dot(set[j - 1], j, { r: 4.5, color: j <= k ? 'gold' : 'faint' });
          }
          R.hband(k - 0.4, k + 0.4, { color: 'accent', alpha: 0.07 });
          const spread = k ? C.ints[k - 1][1] - C.ints[k - 1][0] : 1;
          st = { k, size: S.length, spread, a, b, diag: Array.from({ length: k }, (_, j) => C.sets[j + 1][j]) };
          v.legend([['accent', 'survivors $F_m$'], ['green', 'pinned values / limit', { dash: [6, 4] }], ['gold', 'diagonal pick $n(k)$', { dot: true }]]);
        });
        v.readout(() => st && `Stage $${st.k}$: $${st.size}$ indices survive; at $q_k$ they agree within $${fr(st.spread, 3)}$. Diagonal so far: $${st.diag.length ? st.diag.join(',\\ ') : '—'}$. Limit $F(-\\infty)=b=${fr(st.b, 2)}$, $F(+\\infty)=1-a=${fr(1 - st.a, 2)}$: total mass $${fr(1 - st.a - st.b, 2)}$` + (st.a + st.b > 0 ? ', a defective (vague) limit.' : ', a genuine distribution function.'));
      },
    },
    {
      num: '3.2.13',
      kind: 'Theorem',
      name: 'Tightness ⇔ subsequential limits are probability laws',
      statement: String.raw`Every subsequential vague limit of $F_n$ (as in Theorem 3.2.12) is the distribution function of a probability measure if and only if the sequence is **tight**: for every $\eps>0$ there is an $M$ with
$$\limsup_{n\to\infty}\bigl(1-F_n(M)+F_n(-M)\bigr)\le\eps.$$`,
      idea: String.raw`If the sequence is tight and $F_{n(k)}$ converges vaguely to $F$, take continuity points $r<-M$ and $s>M$. Then $1-F(s)+F(r)$ is the limit of the same tail expression for $F_{n(k)}$, so it is at most $\eps$, and $F$ has total mass $1$. If the sequence is not tight, some $\eps$ and some subsequence keep mass $\ge\eps$ outside $[-k,k]$ at the $k$-th term. A further subsequence converges vaguely by Helly (Theorem 3.2.12), and its limit misses at least $\eps$ of mass.`,
      caption: String.raw`Left: the law of $X_n$ for the chosen $n$ (density in blue, atoms as stems) and the window $[-M,M]$; drag the green handle to set $M$. The mass outside the window is shaded red. Right: the tail mass $1-F_n(M)+F_n(-M)$ along $n$, for your $M$ (bold) and for $M=2,5,10,20$ (faint). Uniform laws on $[-n,n]$ leak everything: every tail tends to $1$, and the vague limit is the zero measure. A mass $1/n$ at $x=n$ is harmless because it vanishes, but a fixed mass $\tfrac12$ at $x=n$ escapes and leaves a defective limit.`,
      deps: ['prob-3.2.12'],
      tags: ['weak convergence', 'tightness'],
      viz(v) {
        const FAM = { unif: 'uniform $[-n,n]$', norm: 'normal, $\\sigma_n=1+\\frac12\\sin n$', spike: '$(1-\\frac1n)\\mathcal N+\\frac1n\\delta_n$', half: '$\\frac12\\mathcal N+\\frac12\\delta_n$' };
        const fam = v.select('$F_n$', Object.entries(FAM).map(([value, label]) => ({ value, label })), 'unif');
        const nS = v.slider('$n$', 1, 1000, 8, { int: true, log: true });
        const L = v.stage({ x: [-25, 25], y: [0, 0.45], axes: 'box', gutter: true, height: 310, weight: 1.15, xlabel: '$x$', title: 'law of $X_n$ and the window $[-M,M]$' });
        const R = v.stage({ x: [1, 1000], xlog: true, y: [-0.03, 1.05], axes: 'box', gutter: true, height: 310, xlabel: '$n$', title: 'tail mass outside $[-M,M]$' });
        const hM = L.handle(4, 0, { color: 'green', label: 'M', labelPos: 'n', constrain: (x) => [clampN(Math.abs(x), 0.5, 24), 0] });
        const M = v.M, tN = (z) => 2 * (1 - PhiN(M, z));
        const sig = (n) => 1 + 0.5 * Math.sin(n);
        const tail = (f, n, m) => f === 'unif' ? Math.max(0, 1 - m / n) : f === 'norm' ? tN(m / sig(n)) : f === 'spike' ? (1 - 1 / n) * tN(m) + (n > m ? 1 / n : 0) : 0.5 * tN(m) + (n > m ? 0.5 : 0);
        const limsup = (f, m) => (f === 'unif' ? 1 : f === 'norm' ? tN(m / 1.5) : f === 'spike' ? tN(m) : 0.5 * tN(m) + 0.5);
        const mass = { unif: 0, norm: 1, spike: 1, half: 0.5 };
        const ns = logInts(1, 1000, 90);
        let st = null;
        v.render(() => {
          const f = fam.value, n = nS.value, m = hM.x;
          const pdf = (x) => f === 'unif' ? (Math.abs(x) <= n ? 1 / (2 * n) : 0) : f === 'norm' ? PHI(x / sig(n)) / sig(n) : f === 'spike' ? (1 - 1 / n) * PHI(x) : 0.5 * PHI(x);
          L.between(pdf, () => 0, -25, -m, { fill: 'red', fillAlpha: 0.3, n: 300 }); L.between(pdf, () => 0, m, 25, { fill: 'red', fillAlpha: 0.3, n: 300 });
          L.vband(-m, m, { color: 'green', alpha: 0.07, edges: true });
          L.fn(pdf, { color: 'accent', width: 2.2, n: 900 });
          const am = f === 'spike' ? 1 / n : f === 'half' ? 0.5 : 0;
          if (am > 0) { if (n < 24.5) stems(L, [[n, am]], { scale: 0.4 / 0.5, color: 'red' }); else { L.arrow(19, 0.3, 24.5, 0.3, { color: 'red', width: 2 }); L.text(`mass ${fr(am, 3)} at x = ${n}`, 24, 0.34, { align: 'right', size: 12, color: 'red' }); } }
          for (const mm of [2, 5, 10, 20]) R.path(ns.map((k) => [k, tail(f, k, mm)]), { color: 'muted', width: 1, alpha: 0.6 });
          R.hline(limsup(f, m), { color: 'red', dash: [6, 4], width: 1.4 });
          R.path(ns.map((k) => [k, tail(f, k, m)]), { color: 'accent', width: 2.4 });
          R.dot(n, tail(f, n, m), { r: 5.5, color: 'accent' });
          st = { f, n, m, t: tail(f, n, m), ls: limsup(f, m), ls20: limsup(f, 20), mass: mass[f] };
          v.legend([['accent', 'tail at your $M$'], ['red', '$\\limsup_n$ of it', { dash: [6, 4] }], ['muted', '$M=2,5,10,20$']]);
        });
        v.readout(() => st && `$M=${fr(st.m, 2)}$: tail at $n=${st.n}$ is $${fr(st.t, 4)}$, $\\limsup_n=${fr(st.ls, 4)}$ (at $M=20$: $${fr(st.ls20, 4)}$). ` + (st.ls20 < 1e-3 ? `**Tight**: the limsup tends to $0$ as $M\\to\\infty$, and every vague limit has mass $1$.` : `**Not tight**: the limsup stays at $${fr(st.ls20, 2)}$, and the vague limits have total mass $${fr(st.mass, 2)}$.`));
      },
    },
    {
      num: '3.2.14',
      kind: 'Theorem',
      name: 'A moment bound implies tightness',
      statement: String.raw`Suppose $\varphi\ge0$ satisfies $\varphi(x)\to\infty$ as $|x|\to\infty$, and
$$C=\sup_n\int\varphi(x)\,dF_n(x)<\infty.$$
Then the sequence $F_n$ is tight.`,
      idea: String.raw`This is Chebyshev's inequality (Theorem 1.6.4) with $\varphi$ in place of a power. On $\{|x|>M\}$, $\varphi(x)\ge\inf_{|y|\ge M}\varphi(y)$, so
$$1-F_n(M)+F_n(-M)\le\frac{C}{\inf_{|x|\ge M}\varphi(x)}$$
for every $n$. The right side tends to $0$ as $M\to\infty$. Typical choices: $\varphi(x)=x^2$ (bounded variances) or $|x|^p$ (bounded $p$-th moments).`,
      caption: String.raw`Left, on log axes: the tail masses $1-F_n(M)+F_n(-M)$ as functions of $M$, for $n=1,\dots,40$ (faint blue), under the bound $C/\varphi(M)$ (orange). The slider marks one $M$. Right: $\int\varphi\,dF_n$ along $n$ with its supremum $C$. The spike family $(1-\frac1n)\mathcal N+\frac1n\delta_n$ shows that the choice of $\varphi$ matters. With $\varphi=x^2$ its moments blow up and the theorem is silent, although the family is tight. With $\varphi=|x|$ they stay below $2$ and the theorem applies. Uniform laws on $[-n,n]$ break every bound, and they are not tight.`,
      deps: ['prob-3.2.13', 'prob-1.6.4'],
      tags: ['tightness'],
      viz(v) {
        const FAM = { norm: 'wandering normals', spike: '$(1-\\frac1n)\\mathcal N+\\frac1n\\delta_n$', unif: 'uniform $[-n,n]$' };
        const PH = { sq: { label: '$x^2$', f: (x) => x * x }, abs: { label: '$|x|$', f: Math.abs }, log: { label: '$\\log(1+|x|)$', f: (x) => Math.log1p(Math.abs(x)) } };
        const fam = v.select('$F_n$', Object.entries(FAM).map(([value, label]) => ({ value, label })), 'spike');
        const ph = v.select('$\\varphi=$', Object.entries(PH).map(([value, o]) => ({ value, label: o.label })), 'abs');
        const mS = v.slider('$M$', 1, 30, 5, { log: true });
        const L = v.stage({ x: [0.6, 30], xlog: true, y: [1e-4, 1.5], ylog: true, axes: 'box', gutter: true, height: 320, weight: 1.2, xlabel: '$M$', title: 'tails of $F_1,\\dots,F_{40}$ and $C/\\varphi(M)$' });
        const R = v.stage({ x: [1, 2000], xlog: true, y: [0.1, 1e7], ylog: true, axes: 'box', gutter: true, height: 320, xlabel: '$n$', title: '$\\int\\varphi\\,dF_n$' });
        const M = v.M, tN = (z) => 2 * (1 - PhiN(M, z));
        const mu = (n) => Math.sin(n), sg = (n) => 1 + 0.5 * Math.cos(n);
        const ElogZ = (() => { let s = 0; const h = 0.002; for (let x = h / 2; x < 9; x += h) s += 2 * Math.log1p(x) * PHI(x) * h; return s; })();
        const tail = (f, n, m) => f === 'norm' ? 1 - PhiN(M, (m - mu(n)) / sg(n)) + PhiN(M, (-m - mu(n)) / sg(n)) : f === 'spike' ? (1 - 1 / n) * tN(m) + (n > m ? 1 / n : 0) : Math.max(0, 1 - m / n);
        const mom = (f, p, n) => {
          if (f === 'norm') { const a = mu(n), s = sg(n); if (p === 'sq') return a * a + s * s; if (p === 'abs') return absMeanNormal(M, a, s); let t = 0; const h = s / 40; for (let x = a - 8 * s; x < a + 8 * s; x += h) t += Math.log1p(Math.abs(x + h / 2)) * PHI((x + h / 2 - a) / s) / s * h; return t; }
          if (f === 'spike') { const w = 1 - 1 / n; return p === 'sq' ? w + n : p === 'abs' ? w * Math.sqrt(2 / Math.PI) + 1 : w * ElogZ + Math.log1p(n) / n; }
          return p === 'sq' ? (n * n) / 3 : p === 'abs' ? n / 2 : ((1 + n) * Math.log1p(n) - n) / n;
        };
        const bounded = (f, p) => f === 'norm' || (f === 'spike' && p !== 'sq');
        const tight = (f) => f !== 'unif';
        const ns = logInts(1, 2000, 90);
        let st = null;
        v.render(() => {
          const f = fam.value, p = ph.value, phi = PH[p].f, m0 = mS.value;
          const Ms = Array.from({ length: 220 }, (_, i) => 0.6 * 50 ** (i / 219));
          for (let n = 1; n <= 40; n++) L.path(Ms.map((m) => [m, tail(f, n, m) > 1e-5 ? tail(f, n, m) : null]), { color: 'accent', width: 1, alpha: 0.35 });
          const moms = ns.map((n) => [n, mom(f, p, n)]), C = Math.max(...moms.map((q) => q[1]));
          const isB = bounded(f, p);
          if (isB) L.fn((m) => Math.min(10, C / phi(m)), { color: 'orange', width: 2.4 });
          L.vline(m0, { color: 'gold', dash: [4, 4], width: 1.2 });
          let worst = 0; for (let n = 1; n <= 2000; n++) worst = Math.max(worst, tail(f, n, m0));
          L.dot(m0, Math.max(1.1e-4, worst), { r: 5, color: 'accent' });
          if (isB) L.dot(m0, Math.min(1.4, C / phi(m0)), { r: 5, color: 'orange' });
          const mlo = Math.min(...moms.map((q) => q[1])); R.setView(null, [Math.max(0.02, mlo / 4), Math.max(C * 6, mlo * 30)]);
          R.dots(moms, { r: 2.6, color: 'accent' });
          if (isB) { R.hline(C, { color: 'orange', width: 2 }); R.text('$C$', 1.4, C, { dy: -12, color: 'orange' }); }
          st = { C, isB, worst, bd: C / phi(m0), m0, tight: tight(f) };
          v.legend([['accent', 'tails / moments'], ...(isB ? [['orange', '$C/\\varphi(M)$ and $C$']] : [])]);
        });
        v.readout(() => st && (st.isB ? `$C=\\sup_n\\int\\varphi\\,dF_n=${fr(st.C, 3)}$. At $M=${fr(st.m0, 2)}$: $\\sup_n$ tail $=${fr(st.worst, 4)}\\le C/\\varphi(M)=${fr(st.bd, 4)}$, and the bound tends to $0$: tight.` : `$\\int\\varphi\\,dF_n\\to\\infty$, so the theorem says nothing. ` + (st.tight ? `The family is tight anyway (at $M=${fr(st.m0, 2)}$, $\\sup_n$ tail $=${fr(st.worst, 4)}$), so another $\\varphi$ may work.` : `The family is not tight: $\\sup_n$ tail $=${fr(st.worst, 3)}$ at every $M$.`)));
      },
    },
    {
      num: '3.2.15',
      kind: 'Theorem',
      name: 'Sub-subsequence criterion for weak convergence',
      statement: String.raw`If every subsequence of $X_n$ has a further subsequence that converges weakly to $X$, then $X_n\Rightarrow X$.`,
      idea: String.raw`Weak convergence comes from a metric: the Lévy metric of Exercise 3.2.6 metrizes it. In any metric space, a sequence all of whose subsequences have sub-subsequences converging to the same point converges to that point (Theorem 2.3.3). Otherwise some subsequence would stay at distance $\ge\eps$, and none of its sub-subsequences could converge. Without the metric, apply Theorem 2.3.3 to the real numbers $Eg(X_n)$ for each bounded continuous $g$ and conclude with Theorem 3.2.9. This is how the proof of Theorem 3.3.17 ends.`,
      caption: String.raw`Odd terms are standardized binomials $S_n/\sqrt n$ (blue), and even terms come from a second family (orange). Left: the two distribution functions at the chosen $n$ against $\Phi$ (black). Right, on log–log axes: the Kolmogorov distance $\sup_x|F_n(x)-\Phi(x)|$ along $n$. Here the limit is continuous, so this distance tends to $0$ exactly when $F_n\Rightarrow\Phi$. With standardized Poisson laws, or the shifted normal at $\delta=0$, both families share the limit: every subsequence has a sub-subsequence going to $0$, and so does the whole sequence. With $\delta\ne0$ or a uniform even family, the even terms form a subsequence that stays away, and $X_n\not\Rightarrow\Phi$.`,
      deps: ['prob-3.2.9', 'prob-2.3.3'],
      tags: ['weak convergence'],
      viz(v) {
        const EV = { shift: 'normal$(\\delta,1+\\frac1n)$', pois: 'standardized Poisson$(n)$', unif: 'uniform, variance $1$' };
        const ev = v.select('even terms', Object.entries(EV).map(([value, label]) => ({ value, label })), 'shift');
        const dS = v.slider('$\\delta$', -1, 1, 0.4, { step: 0.01 });
        const nS = v.slider('$n$', 1, 400, 9, { int: true, log: true });
        const L = v.stage({ x: [-3.2, 3.2], y: [-0.04, 1.06], axes: 'box', gutter: true, height: 310, weight: 1.1, xlabel: '$x$', title: '$F_n$ (blue: odd, orange: even) and $\\Phi$' });
        const R = v.stage({ x: [1, 400], xlog: true, y: [2e-3, 1], ylog: true, axes: 'box', gutter: true, height: 310, xlabel: '$n$', title: 'Kolmogorov distance to $\\Phi$' });
        const M = v.M, Phi = (x) => PhiN(M, x);
        const wc = new Map(); const wl = (n) => { if (!wc.has(n)) wc.set(n, walkLaw(n)); return wc.get(n); };
        const pc = new Map();
        const poisLaw = (n) => { if (pc.has(n)) return pc.get(n); const s = Math.sqrt(n), k0 = Math.max(0, Math.floor(n - 9 * s - 5)), k1 = Math.ceil(n + 9 * s + 5), P = poissonPmf(n, k0, k1); const xs = [], cs = []; let c = 0; for (let k = k0; k <= k1; k++) { c += P.p[k - k0]; xs.push((k - n) / s); cs.push(c); } const o = { xs, cs }; pc.set(n, o); return o; };
        const grid = Array.from({ length: 1201 }, (_, i) => -6 + i * 0.01);
        const contD = (G) => grid.reduce((d, x) => Math.max(d, Math.abs(G(x) - Phi(x))), 0);
        const evenF = (k, n, d) => (k === 'shift' ? (x) => Phi((x - d) / Math.sqrt(1 + 1 / n)) : k === 'unif' ? (x) => clampN((x + Math.sqrt(3)) / (2 * Math.sqrt(3)), 0, 1) : (x) => discCdf(poisLaw(n), x));
        const dist = (k, n, d) => (n % 2 ? kolmogorovDisc(wl(n), Phi) : k === 'pois' ? kolmogorovDisc(poisLaw(n), Phi) : contD(evenF(k, n, d)));
        const ns = [...new Set(logInts(1, 399, 60).flatMap((m) => [m, m + 1]))].sort((x, y) => x - y);
        let st = null;
        v.render(() => {
          const k = ev.value, d = dS.value, n = nS.value; dS.el.hidden = k !== 'shift';
          const nOdd = n % 2 ? n : n + 1, nEven = n % 2 ? n + 1 : n;
          L.fn(Phi, { color: 'ink', width: 2 });
          L.fn((x) => discCdf(wl(nOdd), x), { color: 'accent', width: 2, n: 900 });
          L.fn(evenF(k, nEven, d), { color: 'orange', width: 2, n: 900 });
          const pts = ns.map((m) => [m, Math.max(2.1e-3, dist(k, m, d)), m % 2]);
          R.dots(pts.filter((p) => p[2]).map((p) => [p[0], p[1]]), { r: 3, color: 'accent' });
          R.dots(pts.filter((p) => !p[2]).map((p) => [p[0], p[1]]), { r: 3, color: 'orange' });
          const evTail = Math.min(...[200, 250, 300, 350, 400].map((m) => dist(k, m, d))), odTail = dist(k, 399, d);
          R.hline(Math.max(2.1e-3, evTail), { color: 'orange', dash: [5, 4], width: 1 });
          R.vline(n, { color: 'muted', dash: [3, 4], width: 1 });
          st = { n, dOdd: dist(k, nOdd, d), dEven: dist(k, nEven, d), nOdd, nEven, evTail, odTail };
          v.legend([['accent', 'odd $n$: $S_n/\\sqrt n$', { dot: true }], ['orange', 'even $n$', { dot: true }], ['ink', '$\\Phi$']]);
        });
        v.readout(() => st && `$d(F_{${st.nOdd}},\\Phi)=${fr(st.dOdd, 4)}$, $d(F_{${st.nEven}},\\Phi)=${fr(st.dEven, 4)}$. Closest even term with $200\\le n\\le400$: distance $${fr(st.evTail, 4)}$` + (st.evTail > 0.02 ? `. The even terms stay away from $\\Phi$: this subsequence has no sub-subsequence converging to $\\Phi$, so $X_n\\not\\Rightarrow\\Phi$.` : `: both families tend to $\\Phi$, every subsequence has a sub-subsequence converging to $\\Phi$, and $X_n\\Rightarrow\\Phi$.`));
      },
    },
  ],
};
