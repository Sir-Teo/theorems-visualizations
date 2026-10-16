// Information & Coding Theory — Chapter 2: Relative entropy and mutual information (items 2.1–2.7; 2.8–2.14 in ch02-b.js)
//
// House style as in chapter 1: logarithms base 2 (bits) unless a control says otherwise; the truth p is blue, the model or
// belief q orange, entropies green, failures and negative terms red, sampled data gold, shared information purple, and
// things about Y alone teal. Every number in a readout is computed from the distribution on screen.

import { clamp, sum, H, h2, KL, d2, fmtB, jointStats, drawTable, tableDrag, barEd, setProb, hashStr, lensArea, LET } from './ch02.shared.js';

const log2 = Math.log2;
const xlx = (a, b) => (a > 0 ? (b > 0 ? a * log2(a / b) : Infinity) : 0);

export default {
  collection: 'info',
  chapter: 2,
  title: 'Relative entropy and mutual information',
  summary: String.raw`Relative entropy measures the price of believing $q$ when the truth is $p$. It is never negative, a consequence of Jensen's inequality that drives nearly every other inequality in the subject. Mutual information is the relative entropy between a joint distribution and the product of its marginals: how much learning one variable tells about another. Processing cannot create information about a source, and Fano's inequality turns that into a floor on the probability of error.`,
  items: [
    // ───────────────────────────────────────────────────────────── 2.1
    {
      num: '2.1',
      kind: 'Definition',
      name: 'Relative entropy (Kullback–Leibler divergence)',
      statement: String.raw`Let $p$ and $q$ be probability distributions on the same finite alphabet. The **relative entropy** (Kullback–Leibler divergence) of $p$ from $q$ is
$$D(p\,\|\,q)=\sum_x p(x)\log_2\frac{p(x)}{q(x)},$$
with the conventions $0\log\frac0q=0$ and $p\log\frac p0=+\infty$ for $p>0$. So $D(p\|q)=\infty$ whenever $q$ rules out an outcome that $p$ allows. It is not a distance: in general $D(p\|q)\neq D(q\|p)$, and the triangle inequality fails. It is the expected log-likelihood ratio $\mathbb E_p\log\frac{p(X)}{q(X)}$, the average evidence per sample, in bits, that data from $p$ give *against* the hypothesis $q$.`,
      idea: String.raw`If a source emits symbols from $p$ but we build a code for $q$, the symbol $x$ costs $-\log q(x)$ bits instead of $-\log p(x)$; the divergence is the average extra cost per symbol, the entropy $H(p)$ of 1.2 being the cost of using the right code. Individual terms $p\log(p/q)$ can be negative, but their $p$-weighted sum cannot (2.2). Asymmetry is built in: the average is taken under $p$, so a $q$ that misses an outcome of $p$ is punished infinitely, while a $p$ that misses an outcome of $q$ is not.`,
      caption: String.raw`Drag the blue bars ($p$, the truth) and the orange bars ($q$, the belief). The third panel shows the terms of $D(p\|q)$ (blue) and of $D(q\|p)$ (orange); red bars are negative terms. The presets show $q$ missing an outcome of $p$ (then $D(p\|q)=\infty$ but $D(q\|p)$ is finite) and the reverse.`,
      deps: ['info-1.2'],
      refs: ['Cover–Thomas §2.3'],
      tags: ['relative entropy', 'divergence'],
      credit: 'Kullback & Leibler, 1951',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Kullback%E2%80%93Leibler_divergence' },
      viz(v) {
        const PRE = {
          close: [[0.4, 0.3, 0.2, 0.1], [0.3, 0.3, 0.25, 0.15]],
          overconf: [[0.4, 0.3, 0.2, 0.1], [0.85, 0.05, 0.05, 0.05]],
          qmiss: [[0.4, 0.3, 0.2, 0.1], [0.5, 0.3, 0.2, 0]],
          pmiss: [[0.5, 0.3, 0.2, 0], [0.4, 0.3, 0.2, 0.1]],
        };
        const edP = barEd(v, { title: 'drag: $p$, the truth', p: [...PRE.close[0]], color: 'accent', height: 230 });
        const edQ = barEd(v, { title: 'drag: $q$, the belief', p: [...PRE.close[1]], color: 'orange', height: 230 });
        v.select('example', [{ value: 'close', label: 'similar' }, { value: 'overconf', label: '$q$ overconfident' }, { value: 'qmiss', label: '$q$ misses an outcome' }, { value: 'pmiss', label: '$p$ misses an outcome' }], 'close', {
          onChange: (k) => { edP.p.splice(0, 4, ...PRE[k][0]); edQ.p.splice(0, 4, ...PRE[k][1]); },
        });
        const s3 = v.stage({ x: [-0.6, 3.6], y: [-1, 2.6], height: 230, axes: 'box', gutter: true, title: 'terms $p\\log\\frac pq$ (blue) and $q\\log\\frac qp$ (orange)' });
        s3.setTicks([0, 1, 2, 3].map((i) => [i, LET[i]]), null);
        v.legend([['accent', '$D(p\\|q)$: terms $p\\log(p/q)$', { area: true }], ['orange', '$D(q\\|p)$: terms $q\\log(q/p)$', { area: true }], ['red', 'negative term', { area: true }]]);
        const top = 2.6;
        v.render(() => {
          edP.draw(); edQ.draw();
          const p = edP.p, q = edQ.p;
          s3.hline(0, { color: 'faint' });
          for (let i = 0; i < 4; i++) {
            const t1 = xlx(p[i], q[i]), t2 = xlx(q[i], p[i]);
            [[t1, i - 0.36, i - 0.02, 'accent'], [t2, i + 0.02, i + 0.36, 'orange']].forEach(([t, x0, x1, col]) => {
              if (t === 0) return;
              const h = Math.min(t, top - 0.05), c = t < 0 ? 'red' : col;
              s3.rect(x0, 0, x1, h, { fill: c, fillAlpha: 0.5, color: c, width: 1.4 });
              s3.text(t === Infinity ? '∞' : v.fix(t, 2), (x0 + x1) / 2, h, { dy: t < 0 ? 10 : -9, align: 'center', size: 10.5, color: t === Infinity ? 'red' : 'muted', weight: 600 });
            });
          }
          s3.corner(`D(p‖q)=${fmtB(v, KL(p, q), 2)}  D(q‖p)=${fmtB(v, KL(q, p), 2)}`, 'tl', { size: 12, weight: 600 });
        });
        v.readout(() => {
          const p = edP.p, q = edQ.p, a = KL(p, q), b = KL(q, p);
          const num = (x) => (x === Infinity ? '\\infty' : v.fix(x, 3));
          return String.raw`$D(p\|q)=${num(a)}$ bits, $D(q\|p)=${num(b)}$ bits` + (a === Infinity || b === Infinity ? ' (one of them is infinite: an outcome has probability $0$ under the distribution in the denominator)' : String.raw`, a difference of $${v.fix(Math.abs(a - b), 3)}$: not symmetric`)
            + String.raw`. Both are $\ge 0$; both vanish only for $p=q$ (2.2).`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.2
    {
      num: '2.2',
      kind: 'Theorem',
      name: 'Gibbs’ inequality: D(p‖q) ≥ 0',
      statement: String.raw`For probability distributions $p,q$ on the same finite alphabet,
$$D(p\,\|\,q)\ \ge\ 0,$$
with equality if and only if $p=q$. More generally, if $q$ is only a sub-probability vector ($\sum_x q(x)\le 1$) the same conclusion holds. For $q$ of total mass $>1$ it can fail: normalisation of both distributions is a hypothesis.`,
      idea: String.raw`Write $-D(p\|q)=\sum_x p(x)\log\frac{q(x)}{p(x)}$ as an expectation under $p$ of the concave function $\log$ at the points $t_x=q(x)/p(x)$. By Jensen's inequality (rca-3.3) it is at most $\log\sum_x p(x)\,t_x=\log\sum_{p(x)>0}q(x)\le\log 1=0$. Strict concavity of $\log$ makes Jensen strict unless all the $t_x$ coincide, and the only constant ratio compatible with both sums being $1$ is $t\equiv1$. Consequences ripple through the whole subject: the non-negativity of mutual information, the maximality of the uniform law (1.4), and the bound $H\le\mathbb E[\text{length}]$ on codes.`,
      caption: String.raw`Reshape $p$ and $q$ by dragging. In the right panel each outcome is a dot at $(t,\log t)$, $t=q/p$, sized by $p$; the gold balance point is their $p$-weighted average, hanging below the log curve exactly by Jensen's gap, and its height is $-D$. The slider $c$ changes the total mass of $q$: for $c>1$ the balance point can rise above $0$ and $D$ becomes negative.`,
      deps: ['info-2.1', 'rca-3.3'],
      refs: ['Cover–Thomas §2.6'],
      tags: ['Jensen', 'divergence'],
      credit: 'J. W. Gibbs, 1902 (information-theoretic form: Shannon 1948, Kullback–Leibler 1951)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Gibbs%27_inequality' },
      viz(v) {
        const edP = barEd(v, { title: 'drag: $p$', p: [0.4, 0.3, 0.2, 0.1], color: 'accent', height: 230 });
        const edQ = barEd(v, { title: 'drag: $q$ (shape)', p: [0.25, 0.25, 0.25, 0.25], color: 'orange', height: 230 });
        const cS = v.slider('mass of $q$, $c$', 0.5, 1.5, 1, { step: 0.01 });
        const sJ = v.stage({ x: [0, 3], y: [-4, 1.2], height: 230, axes: 'box', gutter: true, xlabel: 't = q/p', ylabel: 'log₂ t', title: 'Jensen: the balance point lies below $\\log$' });
        v.legend([['ink', '$\\log_2 t$'], ['accent', 'outcome at $(q/p,\\log q/p)$, size $\\propto p$', { dot: true }], ['gold', '$(\\sum p\\,t,\\ \\sum p\\log t)=(m,-D)$', { dot: true }], ['orange', 'Jensen gap']]);
        let pts = [];
        v.render(() => {
          edP.draw(); edQ.draw({ alpha: 0.3 });
          const p = edP.p, q = edQ.p.map((x) => x * cS.value);
          sJ.fn((t) => log2(t), { domain: [0.06, 3], color: 'ink', width: 2 });
          sJ.vline(1, { color: 'faint', dash: true }); sJ.hline(0, { color: 'faint', dash: true });
          let m = 0, mean = 0, bad = false;
          for (let i = 0; i < 4; i++) {
            if (!(p[i] > 0)) continue;
            const t = q[i] / p[i]; m += q[i];
            if (t > 0) { mean += p[i] * log2(t); } else bad = true;
          }
          const D = bad ? Infinity : -mean;
          pts = [];
          for (let i = 0; i < 4; i++) {
            if (!(p[i] > 0)) continue;
            const t = q[i] / p[i];
            if (t > 0 && !bad) sJ.line(m, mean, t, log2(t), { color: 'accent', alpha: 0.35, width: 1 });
          }
          for (let i = 0; i < 4; i++) {
            if (!(p[i] > 0)) continue;
            const t = q[i] / p[i];
            if (t > 0 && t < 3) sJ.dot(t, log2(t), { r: 3 + 7 * Math.sqrt(p[i]), color: 'accent', label: LET[i], labelPos: 'se' });
            else if (t >= 3) sJ.text('→ ' + LET[i], 2.85, log2(3), { align: 'right', size: 11, color: 'accent' });
            else sJ.text('↓ ' + LET[i] + ' (t = 0)', i * 0.7 + 0.2, -3.8, { size: 11, color: 'red' });
          }
          if (!bad) {
            sJ.line(m, mean, m, log2(m), { color: 'orange', width: 3 });
            sJ.dot(m, log2(m), { r: 4, color: 'ink', hollow: true });
            sJ.dot(m, mean, { r: 6, color: 'gold' });
          }
          sJ.corner(bad ? 'D = ∞' : `−D=${v.fix(mean, 2)}  log m=${v.fix(log2(m), 2)}`, 'br', { size: 12, weight: 600 });
          pts = { D, m, mean };
        });
        v.readout(() => {
          const { D, m, mean } = pts;
          const base = String.raw`$q$ has total mass $c=${v.fix(cS.value, 2)}$.`;
          if (D === Infinity) return base + String.raw` $q$ gives probability $0$ to an outcome of $p$: $D(p\|q)=\infty\ge0$.`;
          return base + String.raw` $-D(p\|q)=\sum p\log\frac qp=${v.fix(mean, 3)}\ \le\ \log m=${v.fix(log2(m), 3)}\ \le\ 0$ with $m=\sum_{p>0}q=${v.fix(m, 3)}$, so $D(p\|q)=${v.fix(D, 3)}$ bits` + (D < -1e-9 ? String.raw`, **negative**: the mass of $q$ exceeds $1$, so $q$ is not a probability distribution and Gibbs' inequality does not apply.` : String.raw`$\ \ge 0$.`);
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.3
    {
      num: '2.3',
      kind: 'Theorem',
      name: 'Log-sum inequality',
      statement: String.raw`For non-negative numbers $a_1,\dots,a_n$ and $b_1,\dots,b_n$, with $A=\sum a_i$ and $B=\sum b_i$,
$$\sum_{i=1}^n a_i\log\frac{a_i}{b_i}\ \ge\ A\log\frac AB,$$
with equality if and only if $a_i/b_i$ is the same constant for every $i$ (with $0\log\frac0b=0$ and $a\log\frac a0=\infty$). The numbers need not sum to one.`,
      idea: String.raw`The function $f(t)=t\log t$ is convex on $[0,\infty)$ (rca-3.1). Put the weights $b_i/B$ on the points $t_i=a_i/b_i$; Jensen's inequality gives $\sum\frac{b_i}{B}f(t_i)\ge f\big(\sum\frac{b_i}{B}t_i\big)=f(A/B)$, and multiplying through by $B$ is the claim. Equality needs all $t_i$ equal because $f$ is strictly convex. The identity $\sum a_i\log\frac{a_i}{b_i}-A\log\frac AB=A\,D(\hat a\|\hat b)$ for the normalised lists $\hat a=a/A$, $\hat b=b/B$ shows that the gap *is* a relative entropy, so this inequality is Gibbs' inequality (2.2) in disguise. It is the workhorse behind the convexity of $D$ (2.9) and the data-processing inequality.`,
      caption: String.raw`Drag the bars of the two lists (blue $a_i$, orange $b_i$). On the right the pieces $a_i\log(a_i/b_i)$ are added up as a waterfall (red bars subtract) and compared with the single term $A\log(A/B)$; the gap is $A\,D(\hat a\|\hat b)$. “Equal ratios” rescales $b$ to be proportional to $a$ and the gap closes.`,
      deps: ['rca-3.1', 'info-2.2'],
      refs: ['Cover–Thomas §2.7'],
      tags: ['log-sum', 'convexity'],
      viz(v) {
        const a = [0.6, 0.3, 0.8, 0.2], b = [0.25, 0.35, 0.2, 0.4], N = 4;
        const COLS = ['accent', 'teal', 'purple', 'pink'];
        const sL = v.stage({ x: [-0.6, 3.6], y: [0, 1.05], height: 270, axes: 'box', gutter: true, title: 'drag the bars: $a_i$ (left) and $b_i$ (right)' });
        sL.setTicks([0, 1, 2, 3].map((i) => [i, 'i=' + (i + 1)]), null);
        const sR = v.stage({ x: [-0.6, 6.2], y: [-1, 1], height: 270, axes: 'box', gutter: true, ylabel: 'bits', title: 'the terms $a_i\\log(a_i/b_i)$ added up, against $A\\log(A/B)$' });
        sR.setTicks([[0, 'i=1'], [1, 'i=2'], [2, 'i=3'], [3, 'i=4'], [4.4, 'Σ terms'], [5.6, 'A log(A/B)']], null);
        let idx = -1;
        sL.onDrag((x, y, phase) => {
          if (phase === 'start') { const i = Math.round(x), side = x - i < 0 ? 0 : 1; idx = i >= 0 && i < N && Math.abs(x - i) < 0.5 ? 2 * i + side : -1; }
          if (idx >= 0) (idx % 2 ? b : a)[idx >> 1] = clamp(y, 0.03, 1);
          if (phase === 'end') idx = -1;
        });
        v.button('Equal ratios', () => { for (let i = 0; i < N; i++) b[i] = clamp(a[i] * 0.7, 0.03, 1); });
        v.button('Random lists', () => { for (let i = 0; i < N; i++) { a[i] = 0.1 + 0.9 * Math.random(); b[i] = 0.1 + 0.9 * Math.random(); } });
        let info = {};
        v.render(() => {
          for (let i = 0; i < N; i++) {
            sL.rect(i - 0.38, 0, i - 0.02, a[i], { fill: 'accent', fillAlpha: 0.5, color: 'accent', width: 1.5 });
            sL.rect(i + 0.02, 0, i + 0.38, b[i], { fill: 'orange', fillAlpha: 0.5, color: 'orange', width: 1.5 });
            sL.text('a/b=' + v.fix(a[i] / b[i], 2), i, 1.0, { align: 'center', size: 10.5, color: 'muted', weight: 600 });
          }
          const A = sum(a), B = sum(b), terms = a.map((x, i) => x * log2(x / b[i])), L = sum(terms), R = A * log2(A / B);
          let run = 0, lo = Math.min(0, R, L), hi = Math.max(0, R, L);
          const segs = terms.map((t) => { const s0 = run; run += t; lo = Math.min(lo, run); hi = Math.max(hi, run); return [s0, run]; });
          const pad = 0.14 * (hi - lo + 0.3);
          sR.setView([-0.6, 6.2], [lo - pad, hi + pad]);
          sR.hline(0, { color: 'faint' });
          segs.forEach(([s0, s1], i) => {
            const c = terms[i] < 0 ? 'red' : COLS[i];
            sR.rect(i - 0.34, Math.min(s0, s1), i + 0.34, Math.max(s0, s1), { fill: c, fillAlpha: 0.5, color: c, width: 1.4 });
            sR.text(v.fix(terms[i], 2), i, Math.max(s0, s1), { dy: -9, align: 'center', size: 11, weight: 600 });
            if (i < N - 1) sR.line(i + 0.34, s1, i + 0.66, s1, { color: 'muted', width: 1, dash: true });
          });
          sR.rect(4.06, 0, 4.74, L, { fill: 'ink', fillAlpha: 0.25, color: 'ink', width: 1.6 });
          sR.text(v.fix(L, 2), 4.4, Math.max(0, L), { dy: -9, align: 'center', size: 11.5, weight: 700 });
          sR.rect(5.26, 0, 5.94, R, { fill: 'green', fillAlpha: 0.5, color: 'green', width: 1.6 });
          sR.text(v.fix(R, 2), 5.6, Math.max(0, R), { dy: -9, align: 'center', size: 11.5, weight: 700, color: 'green' });
          sR.line(3.7, L, 5.94, L, { color: 'ink', dash: true, width: 1 });
          const ah = a.map((x) => x / A), bh = b.map((x) => x / B);
          info = { A, B, L, R, gap: L - R, DD: A * KL(ah, bh) };
        });
        v.readout(() => {
          const { A, B, L, R, gap, DD } = info;
          const rs = a.map((x, i) => x / b[i]), spread = Math.max(...rs) / Math.min(...rs);
          return String.raw`$\sum a_i\log\frac{a_i}{b_i}=${v.fix(L, 3)}\ \ge\ A\log\frac AB=${v.fix(A, 2)}\log\frac{${v.fix(A, 2)}}{${v.fix(B, 2)}}=${v.fix(R, 3)}$. Gap $=${v.fix(gap, 3)}=A\,D(\hat a\|\hat b)=${v.fix(DD, 3)}$; the ratios $a_i/b_i$ range over a factor of ${v.fix(spread, 2)}` + (spread < 1.0001 ? ' (all equal: equality).' : '.');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.4
    {
      num: '2.4',
      kind: 'Definition',
      name: 'Cross-entropy',
      statement: String.raw`The **cross-entropy** of a model $q$ relative to the true distribution $p$ is
$$H(p,q)=-\sum_x p(x)\log_2 q(x)=\mathbb E_{X\sim p}\big[-\log_2 q(X)\big].$$
It is the expected number of bits needed to encode a draw of $X\sim p$ with an ideal code built for $q$, and it decomposes as
$$H(p,q)=H(p)+D(p\,\|\,q).$$
It is $+\infty$ when $q$ gives probability $0$ to an outcome that $p$ allows. For fixed $p$, minimising $H(p,q)$ over $q$ is the same as minimising $D(p\|q)$, and the minimum $H(p)$ is attained only at $q=p$.`,
      idea: String.raw`Insert $\log p$ inside the logarithm: $-\log q=-\log p+\log\frac pq$, and take the $p$-average to get $H(p)+D(p\|q)$. Since $D\ge0$ (2.2), no model can beat the truth, and the excess over $H(p)$ is exactly the divergence. With samples $x_1,\dots,x_n$ drawn from $p$, the law of large numbers makes the average log-loss $\frac1n\sum-\log q(x_t)$ converge to $H(p,q)$; this is why “minimise the average negative log-likelihood” is the same as “minimise the divergence from the data distribution” in statistics and machine learning.`,
      caption: String.raw`Drag the bars of the true $p$ and the model $q$. Samples from $p$ (fixed random stream, so dragging moves the picture smoothly) are scored by $-\log_2 q(x)$ and the running average, in gold, settles on the red line $H(p)+D(p\|q)$, never below the green line $H(p)$. “New samples” redraws; give $q$ a zero where $p$ is positive and the running average blows up.`,
      deps: ['info-2.1'],
      refs: ['Cover–Thomas §5.4'],
      tags: ['cross-entropy', 'log-loss'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Cross-entropy' },
      viz(v) {
        const NS = 3000;
        let seed = 1, U = null, Us = null;
        const edP = barEd(v, { title: 'drag: $p$, the source', p: [0.5, 0.25, 0.15, 0.1], color: 'accent', height: 220 });
        const edQ = barEd(v, { title: 'drag: $q$, the model', p: [0.2, 0.4, 0.1, 0.3], color: 'orange', height: 220 });
        const nS = v.slider('samples shown $n$', 10, NS, NS, { int: true, log: true });
        v.button('New samples', () => { seed++; });
        const sC = v.stage({ x: [1, NS], y: [0, 5], xlog: true, height: 260, axes: 'box', gutter: true, full: true, xlabel: 'samples n', ylabel: 'bits per symbol', title: 'running average of $-\\log_2 q(x_t)$' });
        v.legend([['gold', 'average log-loss'], ['green', '$H(p)$'], ['red', '$H(p)+D(p\\|q)=H(p,q)$'], ['red', 'the excess $D(p\\|q)$', { area: true }]]);
        let sim = { key: null, path: [], avg: 0 };
        const unif = () => { if (Us !== seed) { const r = v.rng(hashStr('info-2.4|' + seed)); U = new Float64Array(NS); for (let i = 0; i < NS; i++) U[i] = r(); Us = seed; } return U; };
        const run = (p, q) => {
          const key = p.join() + '|' + q.join() + '|' + seed; if (sim.key === key) return sim; const u = unif(), C = []; let c = 0;
          for (const x of p) { c += x; C.push(c); }
          const path = []; let s = 0, nxt = 1, inf = false;
          for (let t = 0; t < NS; t++) {
            let k = 0; while (k < p.length - 1 && u[t] >= C[k]) k++;
            while (p[k] === 0 && k > 0) k--;
            if (q[k] > 0) s += -log2(q[k]); else inf = true;
            if (t + 1 >= nxt || t === NS - 1) { path.push([t + 1, inf ? Infinity : s / (t + 1)]); nxt = Math.ceil((t + 1) * 1.05); }
          }
          return (sim = { key, path });
        };
        let cur = {};
        v.render(() => {
          edP.draw(); edQ.draw();
          const p = edP.p, q = edQ.p, S = run(p, q), Hp = H(p), D = KL(p, q), CE = Hp + D, n = Math.round(nS.value);
          const top = Math.max(2.2, Math.min(9, Hp + (isFinite(D) ? D : 6) + 0.8));
          sC.setView([1, NS], [0, top]);
          if (isFinite(D)) sC.rect(1, Hp, NS, CE, { fill: 'red', fillAlpha: 0.15, stroke: false });
          sC.hline(Hp, { color: 'green', width: 2 });
          if (isFinite(D)) sC.hline(CE, { color: 'red', width: 2, dash: true });
          const shown = S.path.filter(([t]) => t <= n);
          let seg = [];
          for (const [t, y] of shown) { if (y === Infinity) { sC.text('↑ ∞', t, top, { dy: 10, size: 11, color: 'red', align: 'center' }); seg = []; } else { seg.push([t, y]); } }
          sC.path(seg, { color: 'gold', width: 2.2 });
          const last = shown.length ? shown[shown.length - 1][1] : NaN;
          sC.vline(n, { color: 'faint', dash: true });
          cur = { Hp, D, CE, last, n };
        });
        v.readout(() => {
          const { Hp, D, CE, last, n } = cur;
          return String.raw`$H(p)=${v.fix(Hp, 3)}$, $D(p\|q)=${fmtB(v, D)}$, so $H(p,q)=H(p)+D(p\|q)=${fmtB(v, CE)}$ bits. After $n=${n}$ samples the average is ${last === Infinity ? '$\\infty$ (a sampled symbol has $q=0$)' : '$' + v.fix(last, 3) + '$'}.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.5
    {
      num: '2.5',
      kind: 'Definition',
      name: 'Mutual information',
      statement: String.raw`For discrete random variables $X,Y$ with joint law $p(x,y)$ and marginals $p(x),p(y)$, the **mutual information** is the relative entropy of the joint law from the product of its marginals:
$$I(X;Y)=D\big(p(x,y)\,\big\|\,p(x)p(y)\big)=\sum_{x,y}p(x,y)\log_2\frac{p(x,y)}{p(x)\,p(y)}.$$
Equivalently $I(X;Y)=H(X)+H(Y)-H(X,Y)=H(X)-H(X\mid Y)=H(Y)-H(Y\mid X)$. It is symmetric, $I(X;Y)\ge0$ (by 2.2), and $I(X;Y)=0$ exactly when $X$ and $Y$ are independent; $I(X;X)=H(X)$.`,
      idea: String.raw`Independence means $p(x,y)=p(x)p(y)$, so the divergence from the product measures how far the pair is from independent: the bits wasted when $(X,Y)$ is coded as if the two coordinates did not know of each other. Splitting $\log\frac{p(x,y)}{p(x)p(y)}=\log\frac{p(x,y)}{p(y)}-\log p(x)$ gives $H(X)-H(X\mid Y)$ (1.6): mutual information is the uncertainty about $X$ that learning $Y$ removes, on average. Non-negativity is Gibbs' inequality (2.2) applied to the pair.`,
      caption: String.raw`Drag inside a cell of the left table to change its probability (the others rescale). The right table is the product of the marginals, the “forgetful” independent version of the same pair. Cells with more mass than the product are outlined green, fewer red; the numbers in the readout are the weighted log-ratios whose sum is $I(X;Y)$. Presets: independent, noisy copy, $Y=f(X)$, $Y=X$.`,
      deps: ['info-2.1', 'info-1.6'],
      refs: ['Cover–Thomas §2.3', 'MacKay ch. 8'],
      tags: ['mutual information'],
      credit: 'Shannon, 1948',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Mutual_information' },
      viz(v) {
        const PRE = {
          noisy: [[0.36, 0.02, 0.02], [0.06, 0.2, 0.09], [0.05, 0.05, 0.15]],
          indep: [0.5, 0.3, 0.2].map((a) => [0.45, 0.35, 0.2].map((b) => a * b)),
          func: [[0.3, 0, 0], [0.3, 0, 0], [0, 0.4, 0]],
          same: [[0.5, 0, 0], [0, 0.3, 0], [0, 0, 0.2]],
        };
        let P = PRE.noisy.flat();
        v.select('table', [{ value: 'noisy', label: 'noisy copy' }, { value: 'indep', label: 'independent' }, { value: 'func', label: '$Y=f(X)$' }, { value: 'same', label: '$Y=X$' }], 'noisy', { onChange: (k) => { P = PRE[k].flat(); } });
        const vw = { x: [-0.75, 4.1], y: [-3.8, 0.75], equal: true, axes: false, height: 320 };
        const sJ = v.stage({ ...vw, title: 'joint $p(x,y)$: drag inside a cell' });
        const sQ = v.stage({ ...vw, title: 'product $p(x)p(y)$' });
        const st = { drag: null };
        tableDrag(sJ, () => P, 3, 3, st);
        v.legend([['green', 'more mass than the product', { area: true }], ['red', 'less mass than the product', { area: true }]]);
        let info = {};
        v.render(() => {
          const S = jointStats(P, 3, 3);
          const pmi = (i, j) => (P[3 * i + j] > 0 ? log2(P[3 * i + j] / (S.px[i] * S.py[j])) : 0);
          drawTable(sJ, v, P, 3, 3, {
            drag: st.drag,
            cellFn: (i, j, q) => { const r = pmi(i, j), c = q === 0 ? null : Math.abs(r) < 0.02 ? null : r > 0 ? 'green' : 'red'; return c ? { edge: c, fill: c, fillAlpha: Math.min(0.4, 0.08 + 0.12 * Math.abs(r)) } : null; },
          });
          const Q = []; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) Q.push(S.px[i] * S.py[j]);
          drawTable(sQ, v, Q, 3, 3, { color: 'muted', cellFn: (i, j) => { const q = P[3 * i + j], r = Q[3 * i + j]; return q > r + 0.004 ? { edge: 'green' } : q < r - 0.004 ? { edge: 'red' } : null; } });
          const terms = [];
          for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (P[3 * i + j] > 0) terms.push(P[3 * i + j] * pmi(i, j));
          info = { S, terms, I: sum(terms) };
        });
        v.readout(() => {
          const { S, I } = info;
          return String.raw`$I(X;Y)=D(p\|p\otimes p)=${v.fix(I, 4)}$ bits $=H(X)+H(Y)-H(X,Y)=${v.fix(S.HX, 3)}+${v.fix(S.HY, 3)}-${v.fix(S.HXY, 3)}$ $=H(Y)-H(Y\mid X)=${v.fix(S.HY, 3)}-${v.fix(S.HYgX, 3)}$. ` + (I < 1e-4 ? 'The two tables agree: $X$ and $Y$ are independent.' : String.raw`Maximum possible here: $\min(H(X),H(Y))=${v.fix(Math.min(S.HX, S.HY), 3)}$.`);
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.6
    {
      num: '2.6',
      kind: 'Concept',
      name: 'Information diagrams',
      statement: String.raw`An **information diagram** draws random variables as overlapping regions so that entropies are areas and the identities among them are read off as set algebra. For two variables the plane splits into $H(X\mid Y)$, $I(X;Y)$ and $H(Y\mid X)$, which sum in pairs to $H(X)$, $H(Y)$ and, all together, to $H(X,Y)$. For three variables the seven regions are
$$H(X\mid Y,Z),\ H(Y\mid X,Z),\ H(Z\mid X,Y),\ I(X;Y\mid Z),\ I(X;Z\mid Y),\ I(Y;Z\mid X),\ I(X;Y;Z)$$
with the **interaction information** $I(X;Y;Z)=I(X;Y)-I(X;Y\mid Z)$ in the centre. All regions of two variables are $\ge0$; for three variables the centre can be negative, so the picture is a bookkeeping device, not a measure of sets.`,
      idea: String.raw`The identities $H(X,Y)=H(X)+H(Y\mid X)$ (chain rule, 1.7) and $I(X;Y)=H(X)+H(Y)-H(X,Y)$ (2.5) are exactly the inclusion–exclusion rules for areas, which is why the picture works. For three variables the same inclusion–exclusion defines the centre as $H(X)+H(Y)+H(Z)-H(X,Y)-H(X,Z)-H(Y,Z)+H(X,Y,Z)$; nothing forces it to be positive. If $Z=X\oplus Y$ with $X,Y$ fair and independent, then $I(X;Y)=0$ but $I(X;Y\mid Z)=1$ (knowing the parity makes each bit determine the other), so the centre is $-1$: information that only exists in the three together.`,
      caption: String.raw`Choose the picture. *Two variables*: $Y$ is $X$ through a noisy channel; drag the sliders to see the discs overlap more as noise falls. *Three variables*: in the XOR picture $Z=X\oplus Y\oplus$ noise and the centre turns red (negative); in the common-cause picture $Y$ and $Z$ are noisy copies of $X$ and the centre is positive. Every region carries its value in bits.`,
      deps: ['info-2.5', 'info-1.7'],
      refs: ['Cover–Thomas §2.4', 'MacKay ch. 8'],
      tags: ['information diagram', 'interaction information'],
      credit: 'Yeung, 1991 (the diagram; interaction information: McGill, 1954)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Information_diagram' },
      viz(v) {
        const mode = v.select('picture', [{ value: 'two', label: 'two variables' }, { value: 'xor', label: 'three: XOR' }, { value: 'cause', label: 'three: common cause' }], 'two');
        const aS = v.slider('$P(X=1)$', 0.02, 0.5, 0.5, { step: 0.01 });
        const eS = v.slider('noise $\\varepsilon$', 0, 0.5, 0.1, { step: 0.005 });
        const s = v.stage({ x: [-3.2, 3.2], y: [-2.5, 2.6], height: 380, equal: true, axes: false, full: true });
        const pmfOf = () => {
          const a = aS.value, e = eS.value, m = mode.value, out = [];
          const n = m === 'two' ? 2 : 3; out.length = 1 << n; out.fill(0);
          for (let x = 0; x < 2; x++) for (let y = 0; y < 2; y++) for (let z = 0; z < 2; z++) {
            const px = x ? a : 1 - a; let pr;
            if (m === 'two') { if (z) continue; pr = px * (y === x ? 1 - e : e); }
            else if (m === 'xor') { pr = px * 0.5 * ((z === (x ^ y)) ? 1 - e : e); }
            else { pr = px * (y === x ? 1 - e : e) * (z === x ? 1 - e : e); }
            out[x | (y << 1) | (z << 2)] += pr;
          }
          return out;
        };
        const Hm = (pmf, mask) => { const m = new Map(); pmf.forEach((p, k) => m.set(k & mask, (m.get(k & mask) || 0) + p)); return H([...m.values()]); };
        const C = { X: [-0.55, 0.3], Y: [0.55, 0.3], Z: [0, -0.65] }, R = 1;
        const inside = (c, x, y) => (x - c[0]) ** 2 + (y - c[1]) ** 2 <= R * R;
        let info = {};
        v.render(() => {
          const pmf = pmfOf(), two = mode.value === 'two';
          if (two) {
            const HX = Hm(pmf, 1), HY = Hm(pmf, 2), HXY = Hm(pmf, 3), I = HX + HY - HXY;
            const K = 1.5, rX = Math.sqrt((K * HX) / Math.PI), rY = Math.sqrt((K * HY) / Math.PI), target = K * I;
            let d;
            if (rX < 1e-9 || rY < 1e-9) d = rX + rY;
            else if (target <= 1e-9) d = rX + rY + 0.05;
            else if (target >= Math.PI * Math.min(rX, rY) ** 2 - 1e-9) d = Math.abs(rX - rY);
            else { let lo = Math.abs(rX - rY), hi = rX + rY; for (let it = 0; it < 60; it++) { const mm = (lo + hi) / 2; if (lensArea(rX, rY, mm) > target) lo = mm; else hi = mm; } d = (lo + hi) / 2; }
            const sh = -(Math.min(-rX, d - rY) + Math.max(rX, d + rY)) / 2, cX = sh, cY = sh + d, cy = -0.1;
            s.raster((x, y) => { const iX = (x - cX) ** 2 + (y - cy) ** 2 <= rX * rX, iY = (x - cY) ** 2 + (y - cy) ** 2 <= rY * rY; const nm = iX && iY ? 'purple' : iX ? 'accent' : iY ? 'teal' : null; if (!nm) return null; const c = v.rgb(nm); return [c[0], c[1], c[2], 0.32]; }, { res: 2, key: `${cX.toFixed(3)}|${cY.toFixed(3)}|${rX.toFixed(3)}|${rY.toFixed(3)}` });
            if (rX > 0) s.circle(cX, cy, rX, { color: 'accent', width: 2.4, fill: false });
            if (rY > 0) s.circle(cY, cy, rY, { color: 'teal', width: 2.4, fill: false });
            const regs = [['H(X\\mid Y)', HXY - HY, 'accent', -2.2], ['I(X;Y)', I, 'purple', 0], ['H(Y\\mid X)', HXY - HX, 'teal', 2.2]];
            const rx = [(cX - rX + Math.min(cY - rY, cX + rX)) / 2, (Math.max(cX - rX, cY - rY) + Math.min(cX + rX, cY + rY)) / 2, (cY + rY + Math.max(cX + rX, cY - rY)) / 2];
            regs.forEach(([nm, val, col, lx], k) => {
              s.tex(nm, lx, 2.3, { color: col, size: 15 }); s.text(v.fix(val, 3) + ' bits', lx, 1.9, { align: 'center', size: 12, color: col, weight: 600 });
              if (val > 0.004) s.line(lx, 1.75, rx[k], cy + 0.05, { color: col, width: 1, alpha: 0.7 });
            });
            if (rX > 0) s.tex(`H(X)=${v.fix(HX, 3)}`, cX - 0.7 * rX, cy - 0.75 * rX, { dx: -4, color: 'accent', size: 13, align: 'right', baseline: 'top' });
            if (rY > 0) s.tex(`H(Y)=${v.fix(HY, 3)}`, cY + 0.7 * rY, cy - 0.75 * rY, { dx: 4, color: 'teal', size: 13, align: 'left', baseline: 'top' });
            s.tex(`\\text{union}=H(X,Y)=${v.fix(HXY, 3)}`, 0, -2.3, { size: 13, baseline: 'bottom' });
            info = { two: true, HX, HY, HXY, I };
          } else {
            const HX = Hm(pmf, 1), HY = Hm(pmf, 2), HZ = Hm(pmf, 4), HXY = Hm(pmf, 3), HXZ = Hm(pmf, 5), HYZ = Hm(pmf, 6), HA = Hm(pmf, 7);
            const reg = { x: HA - HYZ, y: HA - HXZ, z: HA - HXY, xy: HXZ + HYZ - HZ - HA, xz: HXY + HYZ - HY - HA, yz: HXY + HXZ - HX - HA, c: HX + HY + HZ - HXY - HXZ - HYZ + HA };
            const key = Object.values(reg).map((r) => r.toFixed(3)).join();
            const colOf = (k, val) => (val < -0.003 ? 'red' : k === 'x' ? 'accent' : k === 'y' ? 'teal' : k === 'z' ? 'orange' : 'purple');
            s.raster((x, y) => {
              const a = inside(C.X, x, y), b = inside(C.Y, x, y), c = inside(C.Z, x, y);
              if (!(a || b || c)) return null;
              const k = (a ? 'x' : '') + (b ? 'y' : '') + (c ? 'z' : ''), kk = k === 'xyz' ? 'c' : k;
              const val = reg[kk], rgb = v.rgb(colOf(kk, val));
              return [rgb[0], rgb[1], rgb[2], 0.1 + 0.4 * Math.min(1, Math.abs(val))];
            }, { res: 2, key });
            [['X', 'accent'], ['Y', 'teal'], ['Z', 'orange']].forEach(([nm, col]) => s.circle(C[nm][0], C[nm][1], R, { color: col, width: 2.4, fill: false }));
            s.tex('X', -1.75, 1.35, { color: 'accent', size: 18 }); s.tex('Y', 1.75, 1.35, { color: 'teal', size: 18 }); s.tex('Z', 0, -1.95, { color: 'orange', size: 18 });
            const pos = { x: [-1.0, 0.62], y: [1.0, 0.62], z: [0, -1.3], xy: [0, 0.88], xz: [-0.58, -0.38], yz: [0.58, -0.38], c: [0, 0.05] };
            for (const k of Object.keys(pos)) {
              const val = reg[k], col = val < -0.003 ? 'red' : 'ink';
              s.text(v.fix(Math.abs(val) < 5e-4 ? 0 : val, 2), pos[k][0], pos[k][1], { align: 'center', size: k === 'c' ? 14 : 12.5, weight: 700, color: col, plate: val < -0.003 });
            }
            s.text('centre = I(X;Y;Z)', 2.5, 0.05, { align: 'center', size: 11.5, color: 'muted' });
            s.line(1.55, 0.05, 0.38, 0.05, { color: 'faint', width: 1 });
            info = { two: false, reg, IXY: HX + HY - HXY };
          }
        });
        v.readout(() => {
          if (info.two) return String.raw`$H(X)=${v.fix(info.HX, 3)}$, $H(Y)=${v.fix(info.HY, 3)}$, $H(X,Y)=${v.fix(info.HXY, 3)}$; the overlap $I(X;Y)=${v.fix(info.I, 3)}$ bits $=H(X)+H(Y)-H(X,Y)$.`;
          const r = info.reg;
          return String.raw`$I(X;Y)=${v.fix(info.IXY, 3)}$, $I(X;Y\mid Z)=${v.fix(r.xy, 3)}$, so the centre is $I(X;Y;Z)=I(X;Y)-I(X;Y\mid Z)=${v.fix(r.c, 3)}$` + (r.c < -0.003 ? String.raw` (**negative**: $X,Y$ are almost independent alone but strongly dependent once $Z$ is known).` : r.c > 0.003 ? ' (positive: the three share common information).' : '.');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.7
    {
      num: '2.7',
      kind: 'Theorem',
      name: 'Conditioning reduces entropy (on average)',
      statement: String.raw`For discrete random variables $X,Y$,
$$H(X\mid Y)\ \le\ H(X),$$
with equality if and only if $X$ and $Y$ are independent. The inequality holds *on average*: for a particular value $y$, the conditional entropy $H(X\mid Y=y)$ can exceed $H(X)$. Observing a surprising $y$ may leave us more uncertain than before, but the average over $y$ cannot.`,
      idea: String.raw`By 2.5, $H(X)-H(X\mid Y)=I(X;Y)$, and $I(X;Y)=D\big(p(x,y)\|p(x)p(y)\big)\ge0$ by Gibbs' inequality (2.2); equality is independence. The average is essential because $H(X\mid Y)$ is the $p(y)$-weighted mean of the entropies $H(X\mid Y=y)$, and nothing forces each one below $H(X)$. In the classic example, $X$ is nearly always $0$, so $H(X)$ is small; a rare $y$ that makes the two values equally likely leaves $H(X\mid Y=y)=1$ bit, more than $H(X)$, while the common $y$ sharpens the prediction enough to win on average.`,
      caption: String.raw`Drag inside the cells of the $2\times3$ table. The right panel draws one bar for each value $y$: its width is $p(y)$ and its height is $H(X\mid Y=y)$, so the total bar area is exactly $H(X\mid Y)$, to be compared with the area $H(X)$ under the dashed blue line. Bars poking above the blue line (red) are observations that *increase* uncertainty; the total area never exceeds the blue area.`,
      deps: ['info-2.5', 'info-2.2'],
      refs: ['Cover–Thomas §2.6'],
      tags: ['conditional entropy'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Conditional_entropy' },
      viz(v) {
        const PRE = {
          classic: [[0.8, 0.05, 0.05], [0.03, 0.05, 0.02]],
          indep: [[0.18, 0.12, 0.3], [0.12, 0.08, 0.2]],
          inform: [[0.4, 0.05, 0.02], [0.03, 0.1, 0.4]],
          func: [[0.3, 0.2, 0], [0, 0, 0.5]],
        };
        let P = PRE.classic.flat();
        v.select('table', [{ value: 'classic', label: 'a surprising $y$' }, { value: 'indep', label: 'independent' }, { value: 'inform', label: 'informative' }, { value: 'func', label: '$X=f(Y)$' }], 'classic', { onChange: (k) => { P = PRE[k].flat(); } });
        const sT = v.stage({ x: [-0.8, 3.95], y: [-2.9, 0.8], equal: true, axes: false, height: 270, title: 'joint $p(x,y)$: drag inside a cell' });
        const sB = v.stage({ x: [0, 1], y: [0, 1.15], height: 270, axes: 'box', gutter: true, xlabel: 'width = p(y)', ylabel: 'bits', title: '$H(X\\mid Y=y)$ for each $y$' });
        const st = { drag: null };
        tableDrag(sT, () => P, 2, 3, st);
        v.legend([['teal', '$H(X\\mid Y=y)$ below $H(X)$', { area: true }], ['red', 'above $H(X)$: this $y$ raises uncertainty', { area: true }], ['accent', '$H(X)$', { dash: true }], ['green', 'average $H(X\\mid Y)$']]);
        let info = {};
        v.render(() => {
          const S = drawTable(sT, v, P, 2, 3);
          let x0 = 0, raise = 0, area = 0;
          sB.hline(S.HX, { color: 'accent', dash: true, width: 2 });
          for (let j = 0; j < 3; j++) {
            const w = S.py[j]; if (!(w > 0)) continue;
            const hj = H([P[j] / w, P[3 + j] / w]), up = hj > S.HX + 1e-9; if (up) raise++;
            sB.rect(x0, 0, x0 + w, hj, { fill: up ? 'red' : 'teal', fillAlpha: 0.45, color: up ? 'red' : 'teal', width: 1.5 });
            sB.text(w > 0.15 ? `y${j + 1}: ${v.fix(hj, 2)}` : v.fix(hj, 2), Math.min(0.96, x0 + w / 2), hj, { dy: -9, align: 'center', size: 11, weight: 600, color: up ? 'red' : 'ink' });
            area += w * hj; x0 += w;
          }
          sB.hline(area, { color: 'green', width: 2 });
          info = { S, raise, area };
        });
        v.readout(() => {
          const { S, raise, area } = info;
          return String.raw`$H(X)=${v.fix(S.HX, 3)}$ bits and $H(X\mid Y)=\sum_y p(y)H(X\mid Y=y)=${v.fix(area, 3)}$, so $I(X;Y)=${v.fix(S.HX - area, 3)}\ge0$. ` + (raise ? String.raw`${raise === 1 ? 'One value' : raise + ' values'} of $y$ raise${raise === 1 ? 's' : ''} the uncertainty ($H(X\mid Y=y)>H(X)$), yet the average still falls.` : 'No single observation raises the uncertainty here.');
        });
      },
    },
  ],
};
