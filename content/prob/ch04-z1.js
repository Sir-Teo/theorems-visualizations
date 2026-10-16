// Probability: Theory and Examples (Durrett) — Chapter 4, part Z1: uniform integrability and Lévy's theorems (§4.6)
import { clampN, cornerIn, simpson, DFUN, dfunOpts, dyadicTable, dyadAt, DL, tailExp, PHI } from './ch04-z.shared.js';

const FLOOR = 1e-9;
const lg = (y) => Math.max(FLOOR, y);
/** Bound of 4.6.1: E(|X|; |X| > M) ≤ min over K of [E(|X|; |X| > K) + K E|X| / M]. */
function ui461Bound(vals, M, E1) { let best = Infinity; for (let K = 0; K <= 400; K += 1) { const b = tailExp(vals, K) + (K * E1) / M; if (b < best) best = b; } return best; }

export default {
  collection: 'prob',
  chapter: 4,
  items: [
    {
      num: '4.6.1a',
      kind: 'Definition',
      name: 'Uniform integrability',
      statement: String.raw`A family $\{X_i\}_{i\in I}$ of random variables is **uniformly integrable** (UI) if
$$\lim_{M\to\infty}\ \sup_{i\in I}\ E\big(|X_i|;\,|X_i|>M\big)=0 .$$
For a single integrable $X$ this is dominated convergence; for a family it asks that the tails go to $0$ at a common rate.`,
      idea: String.raw`Integrability of each member is not enough: the supremum over $i$ must vanish as $M\to\infty$. A UI family is bounded in $L^1$ (because $E|X_i|\le M+\sup_iE(|X_i|;|X_i|>M)$), but boundedness in $L^1$ alone does not suffice: a fixed amount of mass can escape to infinity along the family (the standard example $n\mathbf 1_{(U<1/n)}$). In the proofs that follow, UI is exactly the condition that lets almost sure or in-probability convergence upgrade to convergence of expectations.`,
      caption: String.raw`Pick a family and drag $M$. Left (log scale): the thin curves are $M\mapsto E(|X_i|;|X_i|>M)$ for individual members, the thick curve is their supremum. For $n\mathbf 1_{(U<1/n)}$ every single member drops to $0$ at $M=n$, yet the supremum stays at $1$: not UI. With $1/n^2$ instead of $1/n$ the supremum is $1/(\lfloor M\rfloor+1)\to0$. Normals with $\sigma\le s$ are UI; raise the cap $s$ and the curve shifts but still vanishes. Right: the laws themselves; mass above $M$ is shaded.`,
      deps: ['prob-1.6.1a'],
      tags: ['uniform integrability'],
      verify: true,
      scope: String.raw`The definition is stated for probability spaces (finite measure). Textbooks differ on whether UI also requires $\sup_iE|X_i|<\infty$; on a probability space the two formulations are equivalent for the $L^1$ story used here.`,
      viz(v) {
        const fam = v.select('family', [
          { value: 'esc', label: '$n\\mathbf 1_{(U<1/n)}$' },
          { value: 'esc2', label: '$n\\mathbf 1_{(U<1/n^2)}$' },
          { value: 'norm', label: 'normals, $\\sigma\\le s$' },
          { value: 'exp', label: 'one exponential' },
        ], 'esc');
        const sS = v.slider('cap $s$', 1, 6, 2, { step: 0.1 });
        const Mx = v.slider('$M$', 0.5, 30, 6, { step: 0.1 });
        const L = v.stage({ x: [0, 30], y: [1e-4, 3], ylog: true, height: 330, weight: 1.3, axes: 'box', gutter: true, xlabel: '$M$', title: '$E(|X|;\\,|X|>M)$' });
        const R = v.stage({ x: [0, 1], y: [0, 70], height: 330, axes: 'box', gutter: true, title: 'the laws of $|X|$' });
        const NS = [2, 4, 8, 16, 32, 64];
        const mem = () => {
          const f = fam.value, s = sS.value;
          if (f === 'esc') return { ms: NS.map((n) => (M) => (M < n ? 1 : 0)), sup: () => 1 };
          if (f === 'esc2') return { ms: NS.map((n) => (M) => (M < n ? 1 / n : 0)), sup: (M) => 1 / (Math.floor(M) + 1) };
          if (f === 'norm') { const t = (sg) => (M) => 2 * sg * PHI(M / sg); return { ms: [0.25, 0.5, 0.75, 1].map((c) => t(c * s)), sup: t(s) }; }
          const t = (M) => (M + 1) * Math.exp(-M); return { ms: [t], sup: t };
        };
        v.render(() => {
          const { ms, sup } = mem(), M0 = Mx.value, f = fam.value, s = sS.value;
          if (f === 'esc' || f === 'esc2') {
            NS.forEach((n, i) => { const h = f === 'esc' ? 1 : 1 / n; L.path([[0, h], [n, h], [n, FLOOR]], { color: 'accent', width: 1.6, alpha: 0.8 }); L.dot(n, h, { color: 'accent', r: 3.5 }); });
            if (f === 'esc') L.hline(1, { color: 'red', width: 2.6, dash: [8, 5] });
            else { const pts = []; for (let k = 0; k < 30; k++) pts.push([k, 1 / (k + 1)], [k + 1, 1 / (k + 1)]); L.path(pts, { color: 'red', width: 2.6, dash: [8, 5] }); }
          } else {
            ms.forEach((g) => L.fn((M) => lg(g(M)), { color: 'accent', width: 1.4, alpha: 0.7, n: 400 }));
            L.fn((M) => lg(sup(M)), { color: 'red', width: 2.6, n: 400, dash: [8, 5] });
          }
          L.vline(M0, { color: 'gold', width: 1.5, dash: true });
          L.dot(M0, lg(sup(M0)), { color: 'red', r: 5 });
          if (f === 'esc' || f === 'esc2') {
            R.setView([0, 1], [0, 70]);
            NS.forEach((n, i) => R.rect(0, 0, 1 / (f === 'esc' ? n : n * n), n, { fill: 'accent', fillAlpha: 0.25, color: 'accent', width: 1 }));
            R.hband(M0, 70, { color: 'red', alpha: 0.12 });
            R.tex('\\text{spike of height } n \\text{ on a set of mass } 1/n' + (f === 'esc' ? '' : '^2'), 0.5, 66, { color: 'muted', size: 12 });
          } else {
            R.setView([0, 12], [0, 1.1]);
            const pdf = f === 'exp' ? [(x) => Math.exp(-x)] : [0.25, 0.5, 0.75, 1].map((c) => (x) => (2 * PHI(x / (c * s))) / (c * s));
            pdf.forEach((g) => R.fn(g, { color: 'accent', width: 1.6, domain: [0, 12] }));
            R.vband(M0, 12, { color: 'red', alpha: 0.12 });
          }
        });
        v.legend([['accent', 'individual members'], ['red', '$\\sup_i$'], ['gold', '$M$', { dash: true }]]);
        v.readout(() => { const { sup } = mem(); const val = sup(Mx.value); return `At $M=${v.fix(Mx.value, 1)}$: $\\sup_iE(|X_i|;|X_i|>M)=${val < 1e-4 ? '<10^{-4}' : v.fix(val, 4)}$. ` + (fam.value === 'esc' ? 'It is $1$ for every $M$: the family is **not** UI, though each member is integrable and $X_n\\to0$ in probability.' : 'It tends to $0$ as $M\\to\\infty$: UI.'); });
      },
    },
    {
      num: '4.6.1',
      kind: 'Theorem',
      name: 'Conditional expectations of one X are uniformly integrable',
      statement: String.raw`If $E|X|<\infty$, then $\{E(X\mid\mathcal F):\ \mathcal F\text{ a sub-}\sigma\text{-field of }\mathcal F_0\}$ is uniformly integrable. In particular, for any filtration $\mathcal F_n$ the martingale $E(X\mid\mathcal F_n)$ is UI.`,
      idea: String.raw`Let $Y=E(X\mid\mathcal F)$. Jensen (4.1.10) gives $|Y|\le E(|X|\mid\mathcal F)$, so $E(|Y|;|Y|>M)\le E(|X|;|Y|>M)$ because $\{|Y|>M\}\in\mathcal F$. Chebyshev (1.6.4) gives $P(|Y|>M)\le E|X|/M$, uniformly in $\mathcal F$. Split $E(|X|;A)\le E(|X|;|X|>K)+K\,P(A)$ with $A=\{|Y|>M\}$: choose $K$ large to make the first term small, then $M$ large to make the second small.`,
      caption: String.raw`Choose $X$ on $[0,1]$ and draw 30 random partitions into up to $k$ cells (resample for new ones). Each thin curve is $M\mapsto E(|E(X|\mathcal F)|;\,|E(X|\mathcal F)|>M)$ for one partition; the thick orange curve is their pointwise maximum. The red dashed curve is the proof's bound $\min_K\,[E(|X|;|X|>K)+K\,E|X|/M]$, which depends on $X$ alone, and the black curve is the tail of $X$ itself. All thin curves sit under the one red curve, however many cells you allow, even for the unbounded $x^{-1/2}$.`,
      deps: ['prob-4.6.1a', 'prob-4.1.10', 'prob-1.6.4'],
      tags: ['uniform integrability', 'conditional expectation'],
      viz(v) {
        const fS = v.select('$X$', dfunOpts(), 'blow');
        const kS = v.slider('max cells $k$', 2, 200, 40, { int: true, log: true });
        let seed = 1; v.button('New partitions', () => { seed++; });
        const S = v.stage({ x: [0, 12], y: [1e-3, 8], ylog: true, height: 340, axes: 'box', gutter: true, xlabel: '$M$', title: '$E(|E(X|\\mathcal F)|;\\,|E(X|\\mathcal F)|>M)$ over 30 partitions' });
        const m = 1 << DL; let st = null;
        v.render(() => {
          const tab = dyadicTable(fS.value), X = tab[DL], r = v.rng(seed * 97 + 11), kmax = kS.value;
          const E1 = X.reduce((a, b) => a + Math.abs(b), 0) / m;
          const Ms = Array.from({ length: 101 }, (_, i) => 0.12 * i);
          const sup = new Float64Array(Ms.length);
          for (let j = 0; j < 30; j++) {
            const k = 1 + Math.floor(Math.exp(r() * Math.log(kmax))), cuts = [0];
            for (let c = 1; c < k; c++) cuts.push(1 + Math.floor(r() * (m - 1)));
            cuts.push(m); cuts.sort((a, b) => a - b);
            const cm = [], w = [];
            for (let c = 0; c < cuts.length - 1; c++) { const a = cuts[c], b = cuts[c + 1]; if (b <= a) continue; let s = 0; for (let i = a; i < b; i++) s += X[i]; cm.push(s / (b - a)); w.push((b - a) / m); }
            const pts = Ms.map((M, i) => { let s = 0; for (let c = 0; c < cm.length; c++) if (Math.abs(cm[c]) > M) s += Math.abs(cm[c]) * w[c]; sup[i] = Math.max(sup[i], s); return [M, lg(s)]; });
            S.path(pts, { color: 'accent', width: 1, alpha: 0.35 });
          }
          S.path(Ms.map((M, i) => [M, lg(sup[i])]), { color: 'orange', width: 2.8 });
          S.path(Ms.map((M) => [M, lg(tailExp(X, M))]), { color: 'ink', width: 2 });
          S.path(Ms.slice(1).map((M) => [M, ui461Bound(X, M, E1)]), { color: 'red', width: 2.2, dash: [6, 4] });
          const i10 = 50; st = { E1, s: sup[i10], b: ui461Bound(X, Ms[i10], E1), M: Ms[i10] };
        });
        v.legend([['accent', 'one partition'], ['orange', 'max over partitions'], ['ink', 'tail of $X$'], ['red', 'bound from $X$ alone', { dash: true }]]);
        v.readout(() => st && `$E|X|=${v.fix(st.E1, 3)}$. At $M=${v.fix(st.M, 1)}$: worst partition $${v.fix(st.s, 4)}$, bound $${v.fix(st.b, 4)}$ (the bound never depends on the partition).`);
      },
    },
    {
      num: '4.6.2',
      kind: 'Theorem',
      name: 'de la Vallée-Poussin criterion',
      statement: String.raw`Let $\varphi\ge0$ with $\varphi(x)/x\to\infty$ as $x\to\infty$. If $\sup_iE\varphi(|X_i|)\le C<\infty$, then $\{X_i\}$ is uniformly integrable. In fact
$$E(|X_i|;|X_i|>M)\ \le\ C\sup_{x\ge M}\frac{x}{\varphi(x)}\ \longrightarrow\ 0 .$$
(Conversely every UI family admits such a $\varphi$, convex and increasing.)`,
      idea: String.raw`On $\{|X_i|>M\}$ we have $|X_i|=\varphi(|X_i|)\cdot|X_i|/\varphi(|X_i|)\le\varphi(|X_i|)\sup_{x\ge M}x/\varphi(x)$. Integrate over that event and bound $E\varphi(|X_i|)$ by $C$. Superlinear growth of $\varphi$ is exactly what makes the supremum tend to $0$. This is the working test for UI: in practice one checks a bound on $E|X_i|^{1+\delta}$.`,
      caption: String.raw`Family: Pareto laws $P(X>x)=x^{-\alpha}$ ($x\ge1$) with $\alpha\ge\alpha_0$. Thin curves: the exact tails $E(X;X>M)=\frac{\alpha}{\alpha-1}M^{1-\alpha}$ for several $\alpha$ (log–log). Red: the criterion's bound $C\sup_{x\ge M}x/\varphi(x)$ with $C=\sup_\alpha E\varphi(X)$ (attained at $\alpha_0$). Try $\varphi(x)=x^p$ and $\varphi(x)=x\ln(1+x)$. Push $p$ up to $\alpha_0$: $C$ blows up and the bound disappears, while the family itself stays UI (the criterion is only sufficient for a given $\varphi$).`,
      deps: ['prob-4.6.1a'],
      tags: ['uniform integrability'],
      credit: 'C. de la Vallée-Poussin, 1915',
      links: { source: 'https://doi.org/10.2307/1988879' },
      verify: true,
      viz(v) {
        const phiS = v.select('$\\varphi$', [{ value: 'pow', label: '$x^p$' }, { value: 'xlog', label: '$x\\ln(1+x)$' }], 'pow');
        const aS = v.slider('$\\alpha_0$', 1.2, 4, 2.2, { step: 0.05 });
        const pS = v.slider('$p$', 1.05, 3.9, 1.5, { step: 0.05 });
        const S = v.stage({ x: [1, 300], xlog: true, y: [1e-5, 20], ylog: true, height: 340, axes: 'box', gutter: true, xlabel: '$M$', title: '$E(X;X>M)$ against the criterion' });
        let st = null;
        v.render(() => {
          const a0 = aS.value, p = pS.value, kind = phiS.value;
          [1, 1.3, 1.8, 2.6, 4].forEach((c) => { const al = a0 * c; S.fn((M) => lg(((al / (al - 1)) * Math.pow(M, 1 - al))), { color: 'accent', width: 1.5, alpha: 0.8, n: 200 }); });
          let C = Infinity, g;
          if (kind === 'pow') { if (p < a0) C = a0 / (a0 - p); g = (M) => Math.pow(M, 1 - p); }
          else { C = a0 * simpson((u) => Math.exp((1 - a0) * u) * Math.log(1 + Math.exp(u)), 0, 220, 4000); g = (M) => 1 / Math.log(1 + M); }
          if (isFinite(C)) S.fn((M) => lg(C * g(M)), { color: 'red', width: 2.4, dash: [6, 4], n: 200 });
          st = { C, kind, p, a0 };
        });
        v.legend([['accent', 'exact tails, $\\alpha=\\alpha_0,\\dots$'], ['red', '$C\\sup_{x\\ge M}x/\\varphi(x)$', { dash: true }]]);
        v.readout(() => st && (isFinite(st.C) ? `$C=\\sup_\\alpha E\\varphi(X)=${v.fix(st.C, 3)}$ at $\\alpha=${v.fix(st.a0, 2)}$: every tail lies under $C\\cdot\\,${st.kind === 'pow' ? `M^{${v.fix(1 - st.p, 2)}}` : '1/\\ln(1+M)'}$.` : `$p=${v.fix(st.p, 2)}\\ge\\alpha_0$: $E X^p=\\infty$, so no finite $C$; the criterion says nothing with this $\\varphi$.`));
      },
    },
    {
      num: '4.6.3',
      kind: 'Theorem',
      name: 'Vitali: L¹ convergence ⇔ UI and convergence in probability',
      statement: String.raw`Let $X_n,X$ be integrable. Then $X_n\to X$ in $L^1$ if and only if $X_n\to X$ in probability and $\{X_n\}$ is uniformly integrable.`,
      idea: String.raw`($\Leftarrow$) Truncate at level $M$: $E|X_n-X|\le E|\phi_M(X_n)-\phi_M(X)|+E(|X_n|;|X_n|>M)+E(|X|;|X|>M)$ with $\phi_M$ the clamp to $[-M,M]$; the first term tends to $0$ by bounded convergence (in probability version, 2.3.4 / 1.6.7), the others are small by UI. ($\Rightarrow$) $L^1$ convergence implies convergence in probability, and a convergent sequence in $L^1$ is UI because $E(|X_n|;A)\le E(|X|;A)+E|X_n-X|$ is uniformly small once $P(A)$ is.`,
      caption: String.raw`$X_n=n^a\mathbf 1_{(U<1/n)}$ converges to $0$ in probability for every $a$. Left (log–log): $P(|X_n|>\frac12)=1/n$ (gold), $E|X_n|=n^{a-1}$ (accent) and the UI tail $\sup_{m\ge n}E(X_m;X_m>M)$ (red). For $a<1$ the three tend to $0$: $L^1$ convergence. At $a=1$ the mean sticks at $1$ and the tail sticks at $1$: escaping mass. Right: the function $X_n$ for the chosen $n$, a taller and thinner spike as $n$ grows, with area $n^{a-1}$.`,
      deps: ['prob-4.6.1a', 'prob-1.6.7'],
      tags: ['uniform integrability', 'convergence'],
      credit: 'G. Vitali (convergence theorem; the date is not confirmed here)',
      verify: true,
      viz(v) {
        const aS = v.slider('exponent $a$', 0.1, 1.5, 0.6, { step: 0.05 });
        const MS = v.slider('$M$', 1, 100, 10, { step: 1, log: true });
        const nS = v.slider('$n$', 1, 300, 20, { int: true, log: true });
        const L = v.stage({ x: [1, 1e4], xlog: true, y: [1e-3, 30], ylog: true, height: 330, weight: 1.2, axes: 'box', gutter: true, xlabel: '$n$', title: 'three ways to look at $X_n\\to0$' });
        const R = v.stage({ x: [0, 1], y: [0, 10], height: 330, axes: 'box', gutter: true, xlabel: '$u$', title: '$X_n(u)$' });
        v.render(() => {
          const a = aS.value, M = MS.value, n0 = nS.value;
          const tailSup = (n) => { if (a > 1) return 1e9; if (a === 1) return 1; const m0 = Math.max(n, Math.floor(Math.pow(M, 1 / a)) + 1); return Math.pow(m0, a - 1); };
          L.fn((n) => 1 / n, { color: 'gold', width: 2.2, n: 200 });
          L.fn((n) => lg(Math.pow(n, a - 1)), { color: 'accent', width: 2.6, n: 200 });
          L.fn((n) => lg(Math.min(1e6, tailSup(Math.floor(n)))), { color: 'red', width: 2, dash: [6, 4], n: 300 });
          L.vline(n0, { color: 'muted', dash: true, width: 1 });
          const h = Math.pow(n0, a);
          R.setView([0, Math.min(1, Math.max(3 / n0, 0.1))], [0, Math.max(2, h * 1.15)]);
          R.rect(0, 0, 1 / n0, h, { fill: 'accent', fillAlpha: 0.3, color: 'accent', width: 1.5 });
          R.hline(M, { color: 'red', dash: true, width: 1.2 });
          cornerIn(R, `height $n^a=${v.fix(h, 2)}$, width $1/n$`, 'tr');
        });
        v.legend([['gold', '$P(|X_n|>\\tfrac12)$'], ['accent', '$E|X_n|$'], ['red', '$\\sup_{m\\ge n}E(X_m;X_m>M)$', { dash: true }]]);
        v.readout(() => { const a = aS.value; return a < 1 ? `$a=${v.fix(a, 2)}<1$: the family is UI and $E|X_n|=n^{${v.fix(a - 1, 2)}}\\to0$, as Vitali predicts.` : a === 1 ? 'Here $a=1$: in probability $X_n\\to0$ but $E|X_n|=1$ for every $n$, and the family is not UI.' : `$a=${v.fix(a, 2)}>1$: not even bounded in $L^1$.`; });
      },
    },
    {
      num: '4.6.4',
      kind: 'Theorem',
      name: 'Uniformly integrable submartingales converge in L¹',
      statement: String.raw`If $X_n$ is a submartingale and $\{X_n\}$ is uniformly integrable, then $X_n\to X_\infty$ almost surely and in $L^1$. (Conversely, an $L^1$-convergent submartingale is UI.) A martingale bounded in $L^1$ but not UI may still converge almost surely, without converging in $L^1$.`,
      idea: String.raw`UI gives $\sup_nE|X_n|<\infty$, so the martingale convergence theorem (4.2.11) yields an a.s. limit $X_\infty$; a.s. convergence implies convergence in probability (2.2.2), and Vitali (4.6.3) upgrades this to $L^1$ using UI. Without UI the upgrade fails: the product martingale below has mean $1$ but limit $0$.`,
      caption: String.raw`Left: five paths of the UI submartingale $X_n=(E(Y|\mathcal F_n))^+$ on the dyadic filtration for the chosen $Y$; they settle at $Y^+$ (green ticks). Middle (log scale): paths of the product martingale $X_n=2^n\mathbf 1_{(U<2^{-n})}$ (mean $1$): each path sits at $2^n$ for a while, then drops to $0$ for ever (shown at the floor). Right: $E|X_n-X_\infty|$ for both, computed exactly: it decays for the UI one and stays at $1$ for the product martingale.`,
      deps: ['prob-4.6.3', 'prob-4.2.11', 'prob-2.2.2'],
      tags: ['uniform integrability', 'martingales'],
      viz(v) {
        const fS = v.select('$Y$', dfunOpts(['smooth', 'jump', 'rough', 'blow']), 'smooth');
        let seed = 1; v.button('New paths', () => { seed++; });
        const A = v.stage({ x: [0, 10], y: [-1.2, 2], height: 300, axes: 'box', gutter: true, xlabel: '$n$', title: 'UI submartingale $(E(Y|\\mathcal F_n))^+$' });
        const B = v.stage({ x: [0, 10], y: [0.5, 5000], ylog: true, height: 300, axes: 'box', gutter: true, xlabel: '$n$', title: 'product martingale', yticks: [[0.5, '0'], [1, '1'], [10, '10'], [100, '100'], [1000, '1k']] });
        const C = v.stage({ x: [0, 10], y: [1e-3, 3], ylog: true, height: 300, axes: 'box', gutter: true, xlabel: '$n$', title: '$E|X_n-X_\\infty|$' });
        let st = null;
        v.render(() => {
          const tab = dyadicTable(fS.value), Y = tab[DL], r = v.rng(seed * 31 + 5), m = 1 << DL;
          const cols = ['accent', 'orange', 'purple', 'teal', 'pink'];
          let ymax = 0.5; for (let i = 0; i < m; i++) ymax = Math.max(ymax, Math.abs(Y[i]));
          const cap = fS.value === 'blow' ? 6 : 2;
          A.setView([0, 10], [-0.2, cap]);
          for (let j = 0; j < 5; j++) {
            const u = r(), pts = []; for (let n = 0; n <= 10; n++) pts.push([n, Math.min(cap, Math.max(0, dyadAt(tab, n, u)))]);
            A.path(pts, { color: cols[j], width: 1.8 }); A.dot(10, Math.min(cap, Math.max(0, dyadAt(tab, DL, u))), { color: 'green', r: 3 });
          }
          [1, 2, 3, 5, 8].forEach((nd, j) => { const pts = []; for (let n = 0; n <= 10; n++) pts.push([n, n <= nd ? 2 ** n : 0.5]); B.path(pts, { color: cols[j], width: 1.8 }); });
          const e1 = [], e2 = [];
          for (let n = 0; n <= 10; n++) { let s = 0; const t = tab[n], sh = DL - n; for (let i = 0; i < m; i++) s += Math.abs(Math.max(0, t[i >> sh]) - Math.max(0, Y[i])); e1.push([n, lg(s / m)]); e2.push([n, 1]); }
          C.path(e1, { color: 'accent', width: 2.6 }); C.path(e2, { color: 'red', width: 2.6 });
          st = { a: e1[10][1], b: e1[6][1], c: e1[3][1] };
        });
        v.legend([['accent', 'UI submartingale'], ['red', 'product martingale (not UI)']]);
        v.readout(() => st && `For the UI submartingale $E|X_n-X_\\infty|$ falls from $${v.fix(st.c, 3)}$ (n=3) to $${v.fix(st.b, 3)}$ (n=6): $L^1$ convergence. The product martingale has $E X_n=1$ but $X_n\\to0$ a.s., so $E|X_n-0|=1$ for all $n$.`);
      },
    },
    {
      num: '4.6.5',
      kind: 'Lemma',
      name: 'L¹ convergence passes to E(Xₙ; A)',
      statement: String.raw`If $X_n\to X$ in $L^1$, then for every event $A$, $\ |E(X_n;A)-E(X;A)|\le E|X_n-X|\to0$, uniformly in $A$.`,
      idea: String.raw`$|E(X_n;A)-E(X;A)|=|E((X_n-X)\mathbf 1_A)|\le E|X_n-X|$. Equality holds for $A=\{X_n>X\}$ or $A=\{X_n<X\}$, so the bound is the exact value of $\sup_A|E(X_n;A)-E(X;A)|$ up to a factor of at most 2.`,
      caption: String.raw`$X$ is a function on $[0,1]$ and $X_n=X+\Delta_n$. Drag the endpoints of $A=[a,b]$. Top: $X$ (black), $X_n$ (blue) for the chosen $n$. Bottom: $E(X_n;A)$ against $n$ (blue) with the limit $E(X;A)$ (green) and the band $\pm E|X_n-X|$ (shaded): the blue curve never leaves the band. In the oscillating mode the band shrinks like $n^{-1/2}$. In spike mode $\Delta_n=n\mathbf 1_{(0,1/n)}$ has $E|\Delta_n|=1$: take $A$ to start at $0$ and $E(X_n;A)$ never settles, though for $A=[a,b]$ with $a>0$ it does.`,
      deps: [],
      tags: ['convergence'],
      viz(v) {
        const fS = v.select('$X$', dfunOpts(['smooth', 'jump', 'rough']), 'smooth');
        const mode = v.select('$\\Delta_n$', [{ value: 'osc', label: 'oscillating $n^{-1/2}\\sin 2\\pi nx$' }, { value: 'spike', label: 'spike $n\\mathbf 1_{(0,1/n)}$' }], 'osc');
        const nS = v.slider('$n$', 1, 120, 12, { int: true });
        const T = v.stage({ x: [0, 1], y: [-2, 2.6], height: 270, axes: 'box', gutter: true, xlabel: '$x$', title: '$X$ and $X_n$ on $[0,1]$; $A=[a,b]$' });
        const B = v.stage({ x: [1, 120], y: [-1, 1], height: 270, axes: 'box', gutter: true, xlabel: '$n$', title: '$E(X_n;A)$ and the $L^1$ band' });
        const ha = T.handle(0.25, 0, { color: 'orange', label: 'a', constrain: 'x' }), hb = T.handle(0.65, 0, { color: 'orange', label: 'b', constrain: 'x' });
        const G = 2400; let st = null;
        v.render(() => {
          const tab = dyadicTable(fS.value), top = tab[DL], X = new Float64Array(G); for (let i = 0; i < G; i++) X[i] = top[Math.floor((i + 0.5) / G * (1 << DL))];
          const delta = (n, i) => { const x = (i + 0.5) / G; return mode.value === 'osc' ? Math.sin(2 * Math.PI * n * x) / Math.sqrt(n) : (x < 1 / n ? n : 0); };
          const a = clampN(Math.min(ha.x, hb.x), 0, 1), b = clampN(Math.max(ha.x, hb.x), 0, 1);
          const i0 = Math.round(a * G), i1 = Math.round(b * G);
          let EXA = 0; for (let i = i0; i < i1; i++) EXA += X[i]; EXA /= G;
          const pts = [], up = [], lo = []; let cur = null;
          for (let n = 1; n <= 120; n++) {
            let ea = 0, l1 = 0; for (let i = 0; i < G; i++) { const d = delta(n, i); l1 += Math.abs(d); if (i >= i0 && i < i1) ea += d; }
            ea = EXA + ea / G; l1 /= G; pts.push([n, ea]); up.push([n, EXA + l1]); lo.push([n, EXA - l1]);
            if (n === nS.value) cur = { n, ea, l1 };
          }
          const pad = Math.max(0.5, ...up.map((p) => Math.abs(p[1] - EXA))) * 1.1;
          B.setView([1, 120], [EXA - Math.min(pad, 1.6), EXA + Math.min(pad, 1.6)]);
          B.path([...up, ...lo.slice().reverse()], { close: true, fill: 'accent', fillAlpha: 0.12, stroke: false });
          B.path(up, { color: 'muted', width: 1, dash: [4, 4] }); B.path(lo, { color: 'muted', width: 1, dash: [4, 4] });
          B.hline(EXA, { color: 'green', width: 2.2 });
          B.path(pts, { color: 'blue', width: 2 });
          B.vline(nS.value, { color: 'gold', dash: true, width: 1 });
          T.fn((x) => X[Math.min(G - 1, Math.floor(x * G))], { color: 'ink', width: 1.6, n: 400 });
          T.fn((x) => X[Math.min(G - 1, Math.floor(x * G))] + delta(nS.value, Math.min(G - 1, Math.floor(x * G))), { color: 'blue', width: 1.2, alpha: 0.8, n: 800, domain: [0, 1] });
          T.vband(a, b, { color: 'orange', alpha: 0.12 });
          st = { ...cur, EXA };
        });
        v.legend([['ink', '$X$'], ['blue', '$X_n$; $E(X_n;A)$'], ['green', '$E(X;A)$'], ['accent', '$\\pm E|X_n-X|$ band', { area: true }]]);
        v.readout(() => st && `$n=${st.n}$: $|E(X_n;A)-E(X;A)|=${v.fix(Math.abs(st.ea - st.EXA), 4)}\\ \\le\\ E|X_n-X|=${v.fix(st.l1, 4)}$.`);
      },
    },
    {
      num: '4.6.6',
      kind: 'Lemma',
      name: 'An L¹-convergent martingale is closed by its limit',
      statement: String.raw`If $X_n$ is a martingale and $X_n\to X$ in $L^1$, then $X_n=E(X\mid\mathcal F_n)$ almost surely for every $n$.`,
      idea: String.raw`For $A\in\mathcal F_n$ and $m\ge n$ the martingale property gives $E(X_m;A)=E(X_n;A)$. Let $m\to\infty$: by Lemma 4.6.5, $E(X_m;A)\to E(X;A)$. So $E(X_n;A)=E(X;A)$ for all $A\in\mathcal F_n$, and $X_n$ is $\mathcal F_n$-measurable, which is the definition of $E(X\mid\mathcal F_n)$.`,
      caption: String.raw`Dyadic filtration on $[0,1]$. Click a cell $A$ of level $k$ in the top panel (gold). Bottom: $E(X_m;A)$ for $m=0,\dots,12$ (blue). It is constant for $m\ge k$ (martingale property), and the green line is $E(X;A)$ for the limit $X$. For the closable martingale $E(Y|\mathcal F_n)$ the blue curve lands on the green line. For the double-or-nothing martingale $2^n\mathbf 1_{(0,2^{-n})}$ the limit is $0$ and the cell $A=(0,2^{-k})$ shows $E(X_m;A)=1\neq E(X;A)=0$: no $L^1$ convergence, no closing.`,
      deps: ['prob-4.6.5'],
      tags: ['martingales'],
      viz(v) {
        const fam = v.select('martingale', [{ value: 'Y', label: '$E(Y|\\mathcal F_n)$' }, { value: 'dn', label: 'double-or-nothing' }], 'Y');
        const fS = v.select('$Y$', dfunOpts(['smooth', 'jump', 'rough']), 'smooth');
        const kS = v.slider('cell level $k$', 1, 7, 3, { int: true });
        let cell = 0;
        const T = v.stage({ x: [0, 1], y: [-2, 3], height: 280, axes: 'box', gutter: true, xlabel: '$u$', title: '$X_k$ (blue steps), limit $X$ (black); click a cell' });
        const B = v.stage({ x: [0, 12], y: [-1, 2], height: 280, axes: 'box', gutter: true, xlabel: '$m$', title: '$E(X_m;A)$' });
        T.onClick((x) => { cell = Math.floor(clampN(x, 0, 0.999999) * (1 << kS.value)); v.invalidate(); });
        let st = null;
        v.render(() => {
          const k = kS.value; cell = Math.min(cell, (1 << k) - 1);
          const A0 = cell / (1 << k), A1 = (cell + 1) / (1 << k);
          const tab = dyadicTable(fS.value), m = 1 << DL;
          const Xm = (mm, i) => (fam.value === 'Y' ? tab[mm][i >> (DL - mm)] : (i < m >> mm ? 2 ** mm : 0));
          const lim = (i) => (fam.value === 'Y' ? tab[DL][i] : 0);
          const ymax = fam.value === 'Y' ? 2.6 : 2 ** k * 1.1;
          T.setView([0, 1], fam.value === 'Y' ? [-2, 2.6] : [-0.5, ymax]);
          const pts = []; for (let i = 0; i < 1 << k; i++) { const val = Xm(k, Math.floor(((i + 0.5) / (1 << k)) * m)); pts.push([i / (1 << k), val], [(i + 1) / (1 << k), val]); }
          T.path(pts, { color: 'blue', width: 2.4 });
          T.path(Array.from({ length: 300 }, (_, j) => { const i = Math.floor(((j + 0.5) / 300) * m); return [(j + 0.5) / 300, Math.min(ymax, lim(i))]; }), { color: 'ink', width: 1.2 });
          T.vband(A0, A1, { color: 'gold', alpha: 0.28 });
          const eA = [];
          const i0 = Math.round(A0 * m), i1 = Math.round(A1 * m);
          for (let mm = 0; mm <= 12; mm++) { let s = 0; for (let i = i0; i < i1; i++) s += Xm(mm, i); eA.push([mm, s / m]); }
          let EX = 0; for (let i = i0; i < i1; i++) EX += lim(i); EX /= m;
          const lo = Math.min(EX, ...eA.map((p) => p[1])), hi = Math.max(EX, ...eA.map((p) => p[1])), pad = (hi - lo) * 0.25 + 0.2;
          B.setView([0, 12], [lo - pad, hi + pad]);
          B.hline(EX, { color: 'green', width: 2.4 }); B.path(eA, { color: 'blue', width: 2 }); eA.forEach((p) => B.dot(p[0], p[1], { color: 'blue', r: 3 }));
          B.vline(k, { color: 'gold', dash: true });
          st = { k, e: eA[k][1], ex: EX, e12: eA[12][1] };
        });
        v.legend([['blue', '$X_k$; $E(X_m;A)$'], ['ink', 'limit $X$'], ['green', '$E(X;A)$'], ['gold', 'the cell $A\\in\\mathcal F_k$', { area: true }]]);
        v.readout(() => st && `$E(X_k;A)=${v.fix(st.e, 4)}$, $E(X_{12};A)=${v.fix(st.e12, 4)}$, $E(X;A)=${v.fix(st.ex, 4)}$. ` + (Math.abs(st.e - st.ex) < 2e-3 ? 'They agree: $X_k=E(X|\\mathcal F_k)$ on this cell.' : '**They differ**: this martingale is not closed by its a.s. limit.'));
      },
    },
    {
      num: '4.6.7',
      kind: 'Theorem',
      name: 'Uniformly integrable martingales are closed',
      statement: String.raw`For a martingale $X_n$ the following are equivalent:
(a) $\{X_n\}$ is uniformly integrable;
(b) $X_n\to X_\infty$ in $L^1$;
(c) $X_n\to X_\infty$ a.s. and in $L^1$;
(d) there is an integrable $Y$ with $X_n=E(Y\mid\mathcal F_n)$ for all $n$ (then $Y$ can be taken to be $X_\infty$).`,
      idea: String.raw`(a)$\Rightarrow$(c) is 4.6.4; (c)$\Rightarrow$(b) is trivial; (b)$\Rightarrow$(d) is 4.6.6 with $Y=X_\infty$; (d)$\Rightarrow$(a) is 4.6.1, since all $E(Y\mid\mathcal F_n)$ are conditional expectations of the one variable $Y$.`,
      caption: String.raw`Two martingales on the dyadic filtration, built from $Y$: $X_n=E(Y|\mathcal F_n)$ (UI) and $X_n=E(Y|\mathcal F_n)+2^n\mathbf 1_{(0,2^{-n})}$ (still a.s. convergent to $Y$, but with the double-or-nothing term added). Three panels, one per face of the theorem, all computed exactly from the dyadic tables: (left, log scale in $M$) $T(M)=\sup_{n\le10}E(|X_n|;|X_n|>M)$; (middle) $E|X_n-X_\infty|$; (right) the closing error $E|X_n-E(X_\infty|\mathcal F_n)|$. The three properties hold or fail together.`,
      deps: ['prob-4.6.4', 'prob-4.6.6', 'prob-4.6.1'],
      tags: ['uniform integrability', 'martingales'],
      viz(v) {
        const fam = v.select('martingale', [{ value: 'ui', label: '$E(Y|\\mathcal F_n)$' }, { value: 'bad', label: '$E(Y|\\mathcal F_n)+2^n\\mathbf 1_{(0,2^{-n})}$' }], 'ui');
        const fS = v.select('$Y$', dfunOpts(['smooth', 'jump', 'rough', 'blow']), 'smooth');
        const A = v.stage({ x: [0.3, 5000], xlog: true, y: [1e-3, 8], ylog: true, height: 290, axes: 'box', gutter: true, xlabel: '$M$', title: '(a) $T(M)$' });
        const B = v.stage({ x: [0, 10], y: [1e-3, 4], ylog: true, height: 290, axes: 'box', gutter: true, xlabel: '$n$', title: '(b) $E|X_n-X_\\infty|$' });
        const C = v.stage({ x: [0, 10], y: [1e-3, 4], ylog: true, height: 290, axes: 'box', gutter: true, xlabel: '$n$', title: '(d) $E|X_n-E(X_\\infty|\\mathcal F_n)|$' });
        let st = null;
        v.render(() => {
          const tab = dyadicTable(fS.value), Y = tab[DL], m = 1 << DL, bad = fam.value === 'bad';
          const Xn = (n, i) => tab[n][i >> (DL - n)] + (bad && i < m >> n ? 2 ** n : 0);
          const Ms = Array.from({ length: 81 }, (_, i) => 0.3 * Math.pow(5000 / 0.3, i / 80)), T = new Float64Array(Ms.length), l1 = [], cl = [];
          for (let n = 0; n <= 10; n++) {
            let s1 = 0, s2 = 0; const vals = new Float64Array(m);
            for (let i = 0; i < m; i++) { const x = Xn(n, i); vals[i] = x; s1 += Math.abs(x - Y[i]); s2 += Math.abs(x - tab[n][i >> (DL - n)]); }
            for (let j = 0; j < Ms.length; j++) T[j] = Math.max(T[j], tailExp(vals, Ms[j]));
            l1.push([n, lg(s1 / m)]); cl.push([n, lg(s2 / m)]);
          }
          A.path(Ms.map((M, j) => [M, lg(T[j])]), { color: bad ? 'red' : 'green', width: 2.8 });
          B.path(l1, { color: bad ? 'red' : 'green', width: 2.8 }); C.path(cl, { color: bad ? 'red' : 'green', width: 2.8 }); if (!bad) cornerIn(C, 'identically $0$', 'tr');
          st = { T: T[Ms.findIndex((M) => M > 20)], l1: l1[10][1], l1b: l1[6][1], cl: cl[10][1] };
        });
        v.readout(() => st && (fam.value === 'ui' ? `UI: $T(20)=${v.fix(st.T, 4)}$, $E|X_{10}-X_\\infty|=${v.fix(st.l1, 4)}$, closing error $${v.fix(st.cl, 4)}$: all three small.` : `Not UI: $T(20)=${v.fix(st.T, 3)}$, $E|X_{10}-X_\\infty|=${v.fix(st.l1, 3)}$, closing error $${v.fix(st.cl, 3)}$: all three stuck near $1$.`));
      },
    },
    {
      num: '4.6.8',
      kind: 'Theorem',
      name: 'Lévy’s upward theorem',
      statement: String.raw`Let $\mathcal F_n\uparrow\mathcal F_\infty=\sigma(\bigcup_n\mathcal F_n)$ and $E|Y|<\infty$. Then
$$E(Y\mid\mathcal F_n)\ \longrightarrow\ E(Y\mid\mathcal F_\infty)\qquad\text{almost surely and in }L^1 .$$`,
      idea: String.raw`$X_n=E(Y\mid\mathcal F_n)$ is a UI martingale (4.6.1), so it converges a.s. and in $L^1$ to some $X_\infty$ and is closed by it (4.6.7). To identify $X_\infty$ with $E(Y\mid\mathcal F_\infty)$: for $A$ in the $\pi$-system $\bigcup_n\mathcal F_n$, $E(X_\infty;A)=\lim E(X_n;A)=E(Y;A)$; the $\pi$–$\lambda$ theorem (2.1.6) extends the identity to $\mathcal F_\infty$, and $X_\infty$ is $\mathcal F_\infty$-measurable. The tower property (4.1.13) was used in the martingale step.`,
      caption: String.raw`On $[0,1]$ with $\mathcal F_n$ the dyadic partition into $2^n$ cells, $\mathcal F_\infty$ is the Borel field, so $E(Y|\mathcal F_\infty)=Y$. Top: $Y$ (black) and its level-$n$ averages (blue steps); drag $x_0$. Bottom (log): $\sup$-error (red), $L^1$ error (blue) and error at $x_0$ (gold) against $n$. For smooth $Y$ all three shrink. For the jump function the $L^1$ and pointwise errors shrink (the jump points are a null set), but the sup-error cannot: no a.e. statement is uniform. For $x^{-1/2}$ the sup error stays huge near $0$ while the $L^1$ error still goes to $0$.`,
      deps: ['prob-4.6.7', 'prob-4.6.1', 'prob-4.1.13', 'prob-2.1.6'],
      tags: ['martingales', 'conditional expectation'],
      credit: 'P. Lévy',
      verify: true,
      viz(v) {
        const fS = v.select('$Y$', dfunOpts(), 'smooth');
        const nS = v.slider('level $n$', 0, 11, 3, { int: true });
        const T = v.stage({ x: [0, 1], y: [-2, 3], height: 290, axes: 'box', gutter: true, xlabel: '$x$', title: '$Y$ and $E(Y|\\mathcal F_n)$' });
        const B = v.stage({ x: [0, 11], y: [1e-4, 20], ylog: true, height: 290, axes: 'box', gutter: true, xlabel: '$n$', title: 'errors against the level' });
        const hx = T.handle(0.37, 0, { color: 'gold', label: '$x_0$', constrain: 'x' });
        let st = null;
        v.render(() => {
          const key = fS.value, tab = dyadicTable(key), f = DFUN[key].f, m = 1 << DL, Mt = 1 << 13;
          const yv = new Float64Array(Mt); for (let i = 0; i < Mt; i++) yv[i] = f((i + 0.5) / Mt);
          const n = nS.value, cap = key === 'blow' ? 6 : 3;
          T.setView([0, 1], key === 'blow' ? [0, cap] : [-2, 3]);
          T.fn((x) => Math.min(cap, f(x)), { color: 'ink', width: 1.2, n: 800 });
          const pts = []; for (let i = 0; i < 1 << n; i++) { const val = Math.min(cap, tab[n][i]); pts.push([i / (1 << n), val], [(i + 1) / (1 << n), val]); }
          T.path(pts, { color: 'blue', width: 2.4 });
          const x0 = clampN(hx.x, 0.001, 0.999), c = Math.floor(x0 * (1 << n)); T.vband(c / (1 << n), (c + 1) / (1 << n), { color: 'gold', alpha: 0.2 });
          hx.set(x0, 0);
          const es = [], el = [], ep = [];
          for (let k = 0; k <= 11; k++) {
            let sup = 0, l1 = 0; const sh = 13 - k;
            for (let i = 0; i < Mt; i++) { const e = Math.abs(tab[k][Math.min((1 << k) - 1, i >> sh)] - yv[i]); l1 += e; if (e > sup) sup = e; }
            es.push([k, lg(sup)]); el.push([k, lg(l1 / Mt)]); ep.push([k, lg(Math.abs(dyadAt(tab, k, x0) - f(x0)))]);
          }
          B.path(es, { color: 'red', width: 2.2 }); B.path(el, { color: 'blue', width: 2.6 }); B.path(ep, { color: 'gold', width: 2.2 });
          B.vline(n, { color: 'muted', dash: true });
          st = { n, s: es[n][1], l: el[n][1], p: ep[n][1] };
        });
        v.legend([['ink', '$Y$'], ['blue', 'level-$n$ average; $L^1$ error'], ['red', 'sup error'], ['gold', 'error at $x_0$']]);
        v.readout(() => st && `Level $n=${st.n}$: $L^1$ error $${v.fix(st.l, 4)}$, error at $x_0$ $${v.fix(st.p, 4)}$, sup error $${v.fix(st.s, 3)}$.`);
      },
    },
    {
      num: '4.6.9',
      kind: 'Theorem',
      name: 'Lévy’s 0-1 law',
      statement: String.raw`If $\mathcal F_n\uparrow\mathcal F_\infty$ and $A\in\mathcal F_\infty$, then $P(A\mid\mathcal F_n)\to\mathbf 1_A$ almost surely.`,
      idea: String.raw`Apply the upward theorem (4.6.8) to $Y=\mathbf 1_A$: $P(A\mid\mathcal F_n)\to E(\mathbf 1_A\mid\mathcal F_\infty)=\mathbf 1_A$, since $A\in\mathcal F_\infty$. So the conditional probability of any event decided by the whole sequence is pulled, path by path, to $0$ or $1$. For tail events the limit is a constant, which gives Kolmogorov's 0-1 law.`,
      caption: String.raw`Hidden coin: with probability $\frac12$ each, a walk steps up with probability $\frac12+\delta$ or $\frac12-\delta$. The event $A=\{S_n>0$ for all large $n\}$ equals (a.s.) "the drift is positive". Top: ten seeded paths (green when $A$ occurs, red otherwise). Bottom: $P(A|\mathcal F_n)=1/(1+\rho^{-S_n})$, $\rho=\frac{1/2+\delta}{1/2-\delta}$ (Bayes), for the same paths, each drifting to $1$ or $0$. The gold dots are Monte Carlo estimates: among a pool of 12 000 further simulated futures, the fraction with $A$ among those at the same position $S_n$ at time $n$.`,
      deps: ['prob-4.6.8'],
      tags: ['zero-one laws', 'martingales'],
      credit: 'P. Lévy',
      verify: true,
      viz(v) {
        const dS = v.slider('bias $\\delta$', 0.03, 0.2, 0.08, { step: 0.01 });
        let seed = 1; v.button('New paths', () => { seed++; });
        const N = 300, POOL = 12000, K = 10;
        const T = v.stage({ x: [0, N], y: [-60, 60], height: 280, axes: 'box', gutter: true, xlabel: '$n$', title: 'paths $S_n$' });
        const B = v.stage({ x: [0, N], y: [-0.03, 1.03], height: 280, axes: 'box', gutter: true, xlabel: '$n$', title: '$P(A\\mid\\mathcal F_n)$' });
        let pool = null, st = null;
        v.render(() => {
          const d = dS.value, key = `${d}|${seed}`;
          if (!pool || pool.key !== key) {
            const r = v.rng(seed * 1009 + Math.round(d * 1000)), S = new Int16Array(POOL * (N + 1)), th = new Uint8Array(POOL);
            for (let j = 0; j < POOL; j++) { const up = r() < 0.5; th[j] = up ? 1 : 0; const p = 0.5 + (up ? d : -d); let s = 0; const o = j * (N + 1); for (let n = 1; n <= N; n++) { s += r() < p ? 1 : -1; S[o + n] = s; } }
            pool = { key, S, th };
          }
          const rho = (0.5 + d) / (0.5 - d), post = (s) => 1 / (1 + Math.pow(rho, -s));
          const cols = ['accent', 'orange', 'purple', 'teal', 'pink', 'blue', 'gold', 'ink', 'muted', 'accent'];
          const lim = Math.max(30, ...Array.from({ length: K }, (_, j) => { let m = 0; for (let n = 0; n <= N; n++) m = Math.max(m, Math.abs(pool.S[j * (N + 1) + n])); return m; })) * 1.1;
          T.setView([0, N], [-lim, lim]);
          T.hline(0, { color: 'faint' });
          let nA = 0;
          for (let j = 0; j < K; j++) {
            const o = j * (N + 1), good = pool.th[j] === 1; if (good) nA++;
            const ps = [], pp = []; for (let n = 0; n <= N; n++) { ps.push([n, pool.S[o + n]]); pp.push([n, post(pool.S[o + n])]); }
            T.path(ps, { color: good ? 'green' : 'red', width: 1.6, alpha: 0.85 }); B.path(pp, { color: good ? 'green' : 'red', width: 1.6, alpha: 0.85 });
          }
          for (let j = 0; j < 3; j++) {
            const o = j * (N + 1);
            for (let n = 20; n <= N; n += 40) { const s = pool.S[o + n]; let c = 0, a = 0; for (let q = K; q < POOL; q++) if (pool.S[q * (N + 1) + n] === s) { c++; a += pool.th[q]; } if (c >= 20) B.dot(n, a / c, { color: 'gold', r: 4 }); }
          }
          st = { d, nA, p: post(pool.S[N]), rho };
        });
        v.legend([['green', 'event $A$ occurs'], ['red', '$A$ fails'], ['gold', 'Monte Carlo estimate']]);
        v.readout(() => st && `$\\rho=${v.fix(st.rho, 3)}$. ${st.nA} of 10 displayed paths belong to $A$. At $n=300$ the first path has $P(A|\\mathcal F_n)=${v.fix(st.p, 4)}$; the 0-1 law says every path's value is headed to $0$ or $1$.`);
      },
    },
    {
      num: '4.6.10',
      kind: 'Theorem',
      name: 'Dominated convergence for conditional expectations',
      statement: String.raw`Suppose $Y_n\to Y$ a.s. and $|Y_n|\le Z$ with $EZ<\infty$. If $\mathcal F_n\uparrow\mathcal F_\infty$, then
$$E(Y_n\mid\mathcal F_n)\longrightarrow E(Y\mid\mathcal F_\infty)\qquad\text{almost surely.}$$`,
      idea: String.raw`Let $W_N=\sup_{j,k\ge N}|Y_j-Y_k|\to0$ a.s., $W_N\le2Z$. For $n\ge N$: $|E(Y_n|\mathcal F_n)-E(Y|\mathcal F_n)|\le E(W_N|\mathcal F_n)$, and by Lévy's upward theorem (4.6.8) $E(W_N|\mathcal F_n)\to E(W_N|\mathcal F_\infty)$, which tends to $0$ as $N\to\infty$ by conditional dominated convergence (4.1.9 style). Finally $E(Y|\mathcal F_n)\to E(Y|\mathcal F_\infty)$ again by 4.6.8.`,
      caption: String.raw`A filtration that sweeps: at time $n$ the field $\mathcal F_n$ is the dyadic partition of level $\lfloor\log_2n\rfloor$, and $Y_n=n^a\mathbf 1_{D_n}$ where $D_n$ is the left $1/n^2$-fraction of the $n$-th cell. Then $Y_n\to0$ a.s. for every $a$, and $E(Y_n|\mathcal F_n)=n^{a-2}$ on that cell and $0$ elsewhere. Left: the map of $E(Y_n|\mathcal F_n)(x)$ over $(x,n)$ (colour = value). Right: the sequence at the point $x_0$. For $a<2$ the values decay to $0$: dominated case ($\sum EY_n<\infty$). At $a=2$ every point is revisited by a cell where the value is $1$, again and again: the conclusion fails, so no integrable dominating $Z$ exists.`,
      deps: ['prob-4.6.8'],
      tags: ['conditional expectation', 'convergence'],
      viz(v) {
        const aS = v.slider('exponent $a$', 0.5, 2.6, 1.4, { step: 0.05 });
        const NN = 256;
        const T = v.stage({ x: [0, 1], y: [1, NN], ylog: true, height: 320, axes: 'box', gutter: true, xlabel: '$x$', ylabel: '$n$', title: '$E(Y_n|\\mathcal F_n)(x)$' });
        const B = v.stage({ x: [1, NN], xlog: true, y: [1e-3, 30], ylog: true, height: 320, axes: 'box', gutter: true, xlabel: '$n$', title: 'values at $x_0$ (dots) and the cell sweep' });
        const hx = T.handle(0.3, 20, { color: 'gold', label: '$x_0$', constrain: 'x' });
        let st = null;
        v.render(() => {
          const a = aS.value;
          const val = (n, x) => { const l = Math.floor(Math.log2(n)), c = n - (1 << l); return Math.floor(x * (1 << l)) === c ? Math.pow(n, a - 2) : 0; };
          T.raster((x, y) => { const n = Math.max(1, Math.round(y)); const w = val(n, x); if (w <= 0) return null; const t = clampN((Math.log10(w) + 3) / 3.5, 0, 1); const c = v.rgb(t > 0.7 ? 'red' : 'orange'); return [c[0], c[1], c[2], 0.25 + 0.75 * t]; }, { res: 2, key: `r${a}` });
          T.axes();
          hx.set(clampN(hx.x, 0.001, 0.999), 20);
          const x0 = hx.x, pts = [];
          for (let n = 1; n <= NN; n++) { const w = val(n, x0); if (w > 0) B.dot(n, w, { color: 'gold', r: 3.5 }); pts.push([n, Math.pow(n, a - 2)]); }
          B.path(pts, { color: 'faint', width: 1, dash: [4, 4] });
          B.hline(1, { color: 'red', width: 1, alpha: 0.5 });
          let EY = 0; for (let n = 1; n <= NN; n++) EY += Math.pow(n, a) * Math.pow(2, -Math.floor(Math.log2(n))) / (n * n);
          st = { a, EY, last: [...Array(NN).keys()].map((i) => val(i + 1, x0)).filter((w) => w > 0).slice(-1)[0] };
        });
        v.readout(() => st && `$\\sum_{n\\le256}EY_n=${v.fix(st.EY, 3)}$ (it grows like $\\sum n^{a-3}$). Last nonzero value at $x_0$ (level 7): $${v.fix(st.last, 4)}$. ` + (st.a < 2 ? 'The visits decay: $E(Y_n|\\mathcal F_n)(x_0)\\to0=E(Y|\\mathcal F_\\infty)$.' : 'At $a\\ge2$ the visits do not decay: no convergence.'));
      },
    },
  ],
};
