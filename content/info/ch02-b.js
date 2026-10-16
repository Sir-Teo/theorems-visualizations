// Information & Coding Theory — Chapter 2: Relative entropy and mutual information (items 2.8–2.14; 2.1–2.7 in ch02.js)

import { clamp, sum, H, h2, KL, d2, TV, fmtB, jointStats, Hm, hashStr, LET } from './ch02.shared.js';

const log2 = Math.log2;

export default {
  collection: 'info',
  chapter: 2,
  items: [
    // ───────────────────────────────────────────────────────────── 2.8
    {
      num: '2.8',
      kind: 'Theorem',
      name: 'Chain rules for mutual information and divergence',
      statement: String.raw`For random variables $X_1,X_2,Y$,
$$I(X_1,X_2;Y)=I(X_1;Y)+I(X_2;Y\mid X_1),$$
and in general $I(X_1,\dots,X_n;Y)=\sum_{i}I(X_i;Y\mid X_{i-1},\dots,X_1)$, where $I(A;B\mid C)=H(A\mid C)-H(A\mid B,C)$. For two distributions $p,q$ of a pair $(X,Y)$,
$$D\big(p(x,y)\,\|\,q(x,y)\big)=D\big(p(x)\,\|\,q(x)\big)+\sum_x p(x)\,D\big(p(y\mid x)\,\|\,q(y\mid x)\big).$$`,
      idea: String.raw`Both rules are bookkeeping for logarithms of products. Expanding $H(X_1,X_2)-H(X_1,X_2\mid Y)$ with the entropy chain rule (1.7) in each term gives $\big[H(X_1)-H(X_1\mid Y)\big]+\big[H(X_2\mid X_1)-H(X_2\mid X_1,Y)\big]$. For divergences, $\log\frac{p(x,y)}{q(x,y)}=\log\frac{p(x)}{q(x)}+\log\frac{p(y|x)}{q(y|x)}$ and one takes the $p$-average. The order of the variables is free, so the same total can be built in two different ways, with different intermediate terms: pieces such as $I(X_2;Y\mid X_1)$ can be larger than $I(X_2;Y)$ (conditioning can increase mutual information) even though the sum never changes.`,
      caption: String.raw`Pick how $Y$ depends on the two bits $X_1,X_2$ (with output noise $\varepsilon$). Left: $I(X_1,X_2;Y)$ built in the two possible orders; the pieces differ, the totals agree. In the XOR model $I(X_1;Y)=0$ but $I(X_2;Y\mid X_1)=1-h(\varepsilon)$. Right: the true joint law $p$ against a believed law $q$ (sliders $q_1,q_2,\varepsilon'$); the divergence splits into one term per variable.`,
      deps: ['info-2.5', 'info-1.7'],
      refs: ['Cover–Thomas §2.5'],
      tags: ['chain rule', 'mutual information'],
      viz(v) {
        const mode = v.select('$Y$ is…', [{ value: 'xor', label: '$X_1\\oplus X_2$' }, { value: 'and', label: '$X_1\\wedge X_2$' }, { value: 'copy', label: '$X_1$' }], 'xor');
        const p1 = v.slider('$P(X_1=1)$', 0.05, 0.5, 0.5, { step: 0.01 });
        const eps = v.slider('noise $\\varepsilon$', 0, 0.5, 0.1, { step: 0.005 });
        const q1 = v.slider('believed $P(X_1=1)$', 0.05, 0.95, 0.3, { step: 0.01 });
        const q2 = v.slider('believed $P(X_2=1)$', 0.05, 0.95, 0.5, { step: 0.01 });
        const qe = v.slider('believed noise $\\varepsilon\'$', 0.01, 0.5, 0.25, { step: 0.005 });
        const sA = v.stage({ x: [-0.6, 3.1], y: [0, 1.1], height: 300, axes: 'box', gutter: true, ylabel: 'bits', title: '$I(X_1,X_2;Y)$ built in two orders' });
        sA.setTicks([[0.2, 'X₁ then X₂'], [2.3, 'X₂ then X₁']], null);
        const sB = v.stage({ x: [-0.6, 3.1], y: [0, 1], height: 300, axes: 'box', gutter: true, ylabel: 'bits', title: '$D(p\\|q)$ over $(X_1,X_2,Y)$, one variable at a time' });
        sB.setTicks([[0.2, 'by variables'], [2.3, 'joint']], null);
        v.legend([['accent', '$X_1$ part', { area: true }], ['teal', '$X_2$ part', { area: true }], ['purple', '$Y$ given $(X_1,X_2)$ (divergence)', { area: true }], ['green', 'total', { area: true }]]);
        const f = (m, a, b) => (m === 'xor' ? a ^ b : m === 'and' ? a & b : a);
        const build = (m, a, b, e) => { const out = new Array(8).fill(0); for (let x1 = 0; x1 < 2; x1++) for (let x2 = 0; x2 < 2; x2++) for (let y = 0; y < 2; y++) out[x1 | (x2 << 1) | (y << 2)] = (x1 ? a : 1 - a) * (x2 ? b : 1 - b) * (y === f(m, x1, x2) ? 1 - e : e); return out; };
        let info = {};
        v.render(() => {
          const m = mode.value, P = build(m, p1.value, 0.5, eps.value), Q = build(m, q1.value, q2.value, qe.value);
          const H1 = Hm(P, 1), H2 = Hm(P, 2), HY = Hm(P, 4), H12 = Hm(P, 3), H1Y = Hm(P, 5), H2Y = Hm(P, 6), HA = Hm(P, 7);
          const I12 = H12 + HY - HA, I1 = H1 + HY - H1Y, I2 = H2 + HY - H2Y, I2g1 = I12 - I1, I1g2 = I12 - I2;
          const bar = (x, y0, y1, c, label) => { sA.rect(x, y0, x + 0.9, y1, { fill: c, fillAlpha: 0.5, color: c, width: 1.5 }); if (y1 - y0 > 0.03) sA.text(label + ' ' + v.fix(y1 - y0, 3), x + 0.45, (y0 + y1) / 2, { align: 'center', size: 11, weight: 600 }); };
          bar(0, 0, I1, 'accent', 'I(X₁;Y)'); bar(0, I1, I12, 'teal', 'I(X₂;Y|X₁)');
          bar(2.1, 0, I2, 'teal', 'I(X₂;Y)'); bar(2.1, I2, I12, 'accent', 'I(X₁;Y|X₂)');
          sA.hline(I12, { color: 'green', width: 2, dash: true }); sA.text('I(X₁,X₂;Y) = ' + v.fix(I12, 3), 1.5, I12, { dy: -9, align: 'center', size: 12, weight: 700, color: 'green' });
          // divergence pieces
          const dX1 = d2(p1.value, q1.value), dX2 = d2(0.5, q2.value);
          const dY = d2(eps.value, qe.value);
          const tot = KL(P, Q), top = Math.max(0.2, tot * 1.25);
          sB.setView([-0.6, 3.1], [0, top]);
          const b2 = (x, y0, y1, c, label) => { sB.rect(x, y0, x + 0.9, y1, { fill: c, fillAlpha: 0.5, color: c, width: 1.5 }); if (y1 - y0 > 0.04 * top) sB.text(label + ' ' + v.fix(y1 - y0, 3), x + 0.45, (y0 + y1) / 2, { align: 'center', size: 11, weight: 600 }); };
          b2(0, 0, dX1, 'accent', 'D(X₁)'); b2(0, dX1, dX1 + dX2, 'teal', 'D(X₂|X₁)'); b2(0, dX1 + dX2, dX1 + dX2 + dY, 'purple', 'D(Y|X)');
          b2(2.1, 0, tot, 'green', 'D(p‖q)');
          info = { I12, I1, I2g1, I2, I1g2, dX1, dX2, dY, tot };
        });
        v.readout(() => {
          const r = info;
          return String.raw`$I(X_1;Y)+I(X_2;Y\mid X_1)=${v.fix(r.I1, 3)}+${v.fix(r.I2g1, 3)}=${v.fix(r.I12, 3)}=${v.fix(r.I2, 3)}+${v.fix(r.I1g2, 3)}=I(X_2;Y)+I(X_1;Y\mid X_2)$. Divergence: $${v.fix(r.dX1, 3)}+${v.fix(r.dX2, 3)}+${v.fix(r.dY, 3)}=${v.fix(r.dX1 + r.dX2 + r.dY, 3)}=D(p\|q)=${v.fix(r.tot, 3)}$.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.9
    {
      num: '2.9',
      kind: 'Theorem',
      name: 'Concavity of entropy, convexity of divergence',
      statement: String.raw`The entropy $H(p)$ is a **concave** function of the distribution $p$: for distributions $p_0,p_1$ and $\lambda\in[0,1]$,
$$H\big(\lambda p_0+(1-\lambda)p_1\big)\ \ge\ \lambda H(p_0)+(1-\lambda)H(p_1).$$
The relative entropy is **jointly convex** in the pair: for pairs $(p_0,q_0)$, $(p_1,q_1)$,
$$D\big(\lambda p_0+(1-\lambda)p_1\,\big\|\,\lambda q_0+(1-\lambda)q_1\big)\ \le\ \lambda D(p_0\|q_0)+(1-\lambda)D(p_1\|q_1).$$
(So $D(p\|q)$ is also convex in $p$ alone and in $q$ alone, and $I(X;Y)$ is concave in $p(x)$ for fixed $p(y|x)$ and convex in $p(y|x)$ for fixed $p(x)$.)`,
      idea: String.raw`Convexity of $D$ is the log-sum inequality (2.3) applied to each outcome: with $a_i=\lambda p_0(x)$, $a_2=(1-\lambda)p_1(x)$ and $b_i$ the corresponding $q$ pieces, $(\sum a)\log\frac{\sum a}{\sum b}\le\sum a\log\frac ab$; sum over $x$. Concavity of $H$ follows from $H(p)=\log|\mathcal X|-D(p\|u)$ with $u$ uniform: $D$ is convex in $p$, so $H$ is concave. Mixing two distributions loses nothing in entropy and can only gain (the gap is the Jensen–Shannon divergence), while mixing two (truth, belief) pairs can only make them harder to tell apart.`,
      caption: String.raw`Left: the binary entropy curve with two draggable endpoints $p_0,p_1$; the chord lies below the curve and the gap at the mixture $\lambda$ is the entropy gained by mixing. Middle: the heat map of the binary divergence $d(p\|q)$ on the square of pairs $(p,q)$; drag the two pair-points $z_0,z_1$. Right: $D$ along the segment from $z_0$ to $z_1$ lies below its chord. Move $\lambda$ to slide along them.`,
      deps: ['info-2.3'],
      refs: ['Cover–Thomas §2.7'],
      tags: ['concavity', 'convexity'],
      viz(v) {
        const lam = v.slider('mixing weight $\\lambda$', 0, 1, 0.4, { step: 0.01 });
        const s1 = v.stage({ x: [0, 1], y: [0, 1.1], height: 280, axes: 'box', gutter: true, xlabel: 'p', ylabel: 'bits', title: 'entropy $h(p)$ is concave' });
        const s2 = v.stage({ x: [0, 1], y: [0, 1], height: 280, equal: true, axes: 'box', gutter: true, xlabel: 'p', ylabel: 'q', title: 'pairs $(p,q)$ and $d(p\\|q)$' });
        const s3 = v.stage({ x: [0, 1], y: [0, 1], height: 280, axes: 'box', gutter: true, xlabel: 'λ', ylabel: 'bits', title: '$d$ along the segment is convex' });
        const cn = (x) => clamp(x, 0.02, 0.98);
        const a0 = s1.handle(0.15, h2(0.15), { color: 'accent', label: 'p₀', constrain: (x) => [cn(x), h2(cn(x))] });
        const a1 = s1.handle(0.8, h2(0.8), { color: 'orange', label: 'p₁', constrain: (x) => [cn(x), h2(cn(x))] });
        const z0 = s2.handle(0.2, 0.6, { color: 'accent', label: 'z₀', constrain: { x: [0.02, 0.98], y: [0.02, 0.98] } });
        const z1 = s2.handle(0.8, 0.3, { color: 'orange', label: 'z₁', constrain: { x: [0.02, 0.98], y: [0.02, 0.98] } });
        v.legend([['ink', 'function'], ['gold', 'chord (average of the endpoint values)', { dash: true }], ['red', 'gap at the mixture']]);
        let info = {};
        v.render(() => {
          const L = lam.value;
          // entropy
          s1.fn(h2, { domain: [0.001, 0.999], color: 'ink', width: 2 });
          const hp0 = h2(a0.x), hp1 = h2(a1.x), pm = L * a0.x + (1 - L) * a1.x, chordH = L * hp0 + (1 - L) * hp1, hm = h2(pm);
          s1.line(a0.x, hp0, a1.x, hp1, { color: 'gold', width: 2.5, dash: true });
          s1.line(pm, chordH, pm, hm, { color: 'red', width: 3.5 });
          s1.dot(pm, hm, { r: 5, color: 'ink' }); s1.dot(pm, chordH, { r: 5, color: 'gold' });
          // divergence heat map
          s2.heat((p, q) => Math.min(d2(clamp(p, 1e-4, 1 - 1e-4), clamp(q, 1e-4, 1 - 1e-4)), 3), { range: [0, 3], cmap: 'theme', color: 'orange', res: 3, key: 'dbin' });
          s2.axes();
          s2.line(0, 0, 1, 1, { color: 'ink', alpha: 0.5, dash: true });
          s2.line(z0.x, z0.y, z1.x, z1.y, { color: 'ink', width: 2 });
          const mx = L * z0.x + (1 - L) * z1.x, my = L * z0.y + (1 - L) * z1.y;
          s2.dot(mx, my, { r: 5, color: 'gold' });
          // profile
          const prof = (t) => d2(clamp(t * z0.x + (1 - t) * z1.x, 1e-4, 1 - 1e-4), clamp(t * z0.y + (1 - t) * z1.y, 1e-4, 1 - 1e-4));
          const D0 = prof(1), D1 = prof(0), Dm = prof(L), chordD = L * D0 + (1 - L) * D1;
          let top = Math.max(D0, D1, 0.2); for (let k = 0; k <= 60; k++) top = Math.max(top, prof(k / 60));
          s3.setView([0, 1], [0, top * 1.15]);
          s3.fn(prof, { domain: [0, 1], color: 'ink', width: 2, n: 120 });
          s3.line(0, D1, 1, D0, { color: 'gold', width: 2.5, dash: true });
          s3.line(L, chordD, L, Dm, { color: 'red', width: 3.5 });
          s3.dot(L, Dm, { r: 5, color: 'ink' }); s3.dot(L, chordD, { r: 5, color: 'gold' });
          info = { hm, chordH, Dm, chordD, D0, D1 };
        });
        v.readout(() => {
          const r = info;
          return String.raw`Entropy: $h(\text{mix})=${v.fix(r.hm, 4)}\ \ge\ ${v.fix(r.chordH, 4)}$ (average of the endpoints). Divergence: $d(\text{mixed pair})=${v.fix(r.Dm, 4)}\ \le\ ${v.fix(r.chordD, 4)}=\lambda\, d(z_0)+(1-\lambda)\,d(z_1)$ with $d(z_0)=${v.fix(r.D0, 3)}$, $d(z_1)=${v.fix(r.D1, 3)}$.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.10
    {
      num: '2.10',
      kind: 'Theorem',
      name: 'Data-processing inequality',
      statement: String.raw`If $X\to Y\to Z$ is a Markov chain (that is, $Z$ depends on $X$ only through $Y$: $p(z\mid x,y)=p(z\mid y)$), then
$$I(X;Z)\ \le\ I(X;Y)\qquad\text{and}\qquad I(X;Z)\le I(Y;Z).$$
Processing the data $Y$, deterministically or with extra randomness, can never increase the information about $X$. Equality holds iff $X\to Z\to Y$ is a Markov chain as well, e.g. when $Z$ is a sufficient statistic of $Y$ (2.11). Without the Markov hypothesis ($Z$ may look at $X$ directly) the conclusion fails.`,
      idea: String.raw`Apply the chain rule (2.8) to $I(X;Y,Z)$ in two orders: $I(X;Y,Z)=I(X;Z)+I(X;Y\mid Z)=I(X;Y)+I(X;Z\mid Y)$. The Markov property makes $I(X;Z\mid Y)=0$, and $I(X;Y\mid Z)\ge0$ (a conditional mutual information is an average of divergences, 2.2), so $I(X;Z)\le I(X;Y)$. The same inequality for divergences says that applying one channel to two distributions can only bring them closer: $D(pW\|qW)\le D(p\|q)$. It underlies the converse of the channel coding theorem and every “information can only be lost” statement in the subject.`,
      caption: String.raw`$X$ is a biased bit, $Y$ is $X$ after a binary symmetric channel with flip probability $\varepsilon_1$, and $Z$ is $Y$ after a second channel you choose (flip, erasure, one-sided noise) with strength $q$. The bars give the three informations; the right panel sweeps $q$ and shows $I(X;Z)$ always under the ceiling $I(X;Y)$. Switch on “$Z$ sees $X$ directly” to break the Markov chain: the second channel now acts on $X$ and the ceiling disappears.`,
      deps: ['info-2.8'],
      refs: ['Cover–Thomas §2.8'],
      tags: ['data processing', 'Markov chain'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Data_processing_inequality' },
      viz(v) {
        const aS = v.slider('$P(X=1)$', 0.05, 0.5, 0.5, { step: 0.01 });
        const e1 = v.slider('first channel flip $\\varepsilon_1$', 0, 0.5, 0.25, { step: 0.005 });
        const kind = v.select('second channel', [{ value: 'bsc', label: 'flip' }, { value: 'era', label: 'erasure' }, { value: 'z', label: 'one-sided' }], 'bsc');
        const qS = v.slider('strength $q$', 0, 1, 0.1, { step: 0.005 });
        const peek = v.toggle('$Z$ sees $X$ directly (break the chain)', false);
        const sB = v.stage({ x: [-0.6, 2.6], y: [0, 1.05], height: 280, axes: 'box', gutter: true, ylabel: 'bits', title: 'the three informations' });
        sB.setTicks([[0, 'I(X;Y)'], [1, 'I(X;Z)'], [2, 'I(Y;Z)']], null);
        const sC = v.stage({ x: [0, 1], y: [0, 1.05], height: 280, axes: 'box', gutter: true, xlabel: 'strength q of the second channel', ylabel: 'bits', title: 'sweeping the second channel' });
        v.legend([['orange', '$I(X;Y)$ (the ceiling)'], ['accent', '$I(X;Z)$'], ['teal', '$I(Y;Z)$']]);
        const K = (kd, q) => (kd === 'bsc' ? [[1 - q, q, 0], [q, 1 - q, 0]] : kd === 'era' ? [[1 - q, 0, q], [0, 1 - q, q]] : [[1, 0, 0], [q, 1 - q, 0]]);
        const calc = (q) => {
          const a = aS.value, e = e1.value, k = K(kind.value, q), JXY = [], JXZ = new Array(6).fill(0), JYZ = new Array(6).fill(0);
          for (let x = 0; x < 2; x++) for (let y = 0; y < 2; y++) {
            const pxy = (x ? a : 1 - a) * (y === x ? 1 - e : e); JXY.push(pxy);
            for (let z = 0; z < 3; z++) { const w = peek.value ? x : y, pz = pxy * k[w][z]; JXZ[x * 3 + z] += pz; JYZ[y * 3 + z] += pz; }
          }
          return { IXY: jointStats(JXY, 2, 2).I, IXZ: jointStats(JXZ, 2, 3).I, IYZ: jointStats(JYZ, 2, 3).I, HX: h2(a) };
        };
        let cur = {};
        v.render(() => {
          const c = calc(qS.value); cur = c;
          [[0, c.IXY, 'orange'], [1, c.IXZ, 'accent'], [2, c.IYZ, 'teal']].forEach(([i, val, col]) => {
            sB.rect(i - 0.34, 0, i + 0.34, val, { fill: col, fillAlpha: 0.5, color: col, width: 1.5 });
            sB.text(v.fix(val, 3), i, val, { dy: -9, align: 'center', size: 11.5, weight: 600 });
          });
          sB.hline(c.IXY, { color: 'orange', dash: true });
          const xs = [...Array(61).keys()].map((k) => k / 60), cs = xs.map(calc);
          sC.hline(c.IXY, { color: 'orange', width: 2, dash: true });
          sC.path(xs.map((x, k) => [x, cs[k].IXZ]), { color: 'accent', width: 2.4 });
          sC.path(xs.map((x, k) => [x, cs[k].IYZ]), { color: 'teal', width: 1.8 });
          sC.dot(qS.value, c.IXZ, { r: 6, color: 'gold' });
          sC.vline(qS.value, { color: 'faint', dash: true });
        });
        v.readout(() => {
          const c = cur, ok = c.IXZ <= c.IXY + 1e-9;
          return String.raw`$I(X;Y)=${v.fix(c.IXY, 3)}$, $I(X;Z)=${v.fix(c.IXZ, 3)}$, $I(Y;Z)=${v.fix(c.IYZ, 3)}$ bits. ` + (ok ? String.raw`$I(X;Z)\le\min\{I(X;Y),I(Y;Z)\}$ holds` + (peek.value ? ' (by luck: $Z$ sees $X$ but through a weak channel).' : '.') : String.raw`**$I(X;Z)>I(X;Y)$**: $Z$ got information about $X$ that did not pass through $Y$, so $X\to Y\to Z$ is not a Markov chain.`);
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.11
    {
      num: '2.11',
      kind: 'Definition',
      name: 'Sufficient statistics',
      statement: String.raw`Let $\{p_\theta(x)\}$ be a family of distributions of the data $X$ indexed by a parameter $\theta$ (treated as a random variable with a prior), and $T=T(X)$ a function of the data. $T$ is a **sufficient statistic** for $\theta$ if the conditional law of $X$ given $T$ does not depend on $\theta$, i.e. $\theta\to T(X)\to X$ is a Markov chain. By the data-processing inequality (2.10) this is equivalent to
$$I(\theta;T(X))=I(\theta;X)\quad\text{for every prior on }\theta.$$
For $n$ coin flips with unknown bias $\theta$, the number of heads is sufficient; the first flip alone is not.`,
      idea: String.raw`Since $\theta\to X\to T(X)$ is always a Markov chain, data processing gives $I(\theta;T)\le I(\theta;X)$ and equality is exactly the statement that $T$ loses nothing about $\theta$, which is the Markov chain $\theta\to T\to X$. For Bernoulli flips, $p_\theta(x^n)=\theta^k(1-\theta)^{n-k}$ depends on the sequence only through the number of heads $k$, so given $k$ all arrangements are equally likely whatever $\theta$ is (the Fisher–Neyman factorisation). A statistic such as “the first flip” discards the other $n-1$ flips and with them most of the information.`,
      caption: String.raw`Left: for a uniform prior on a grid of $\theta$ values, the information $I(\theta;T)$ of four statistics as the number of flips $n$ grows. The count of heads sits exactly on the top curve $I(\theta;X^n)$; the others fall short. Right: the distribution of the whole sequence inside one class $T=t$ for two values of $\theta$ (blue $0.25$, orange $0.75$). For a sufficient statistic the two bar charts coincide; for the others they differ.`,
      deps: ['info-2.10'],
      refs: ['Cover–Thomas §2.9'],
      tags: ['sufficiency', 'statistics'],
      credit: 'R. A. Fisher, 1922',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Sufficient_statistic' },
      viz(v) {
        const stat = v.select('statistic $T$', [{ value: 'count', label: 'number of heads' }, { value: 'first', label: 'first flip' }, { value: 'fl', label: 'first & last flip' }, { value: 'runs', label: 'number of runs' }], 'count');
        const nS = v.slider('flips $n$', 2, 8, 6, { int: true });
        const cS = v.slider('class $t$ (index)', 0, 8, 1, { int: true });
        const THS = [...Array(19).keys()].map((k) => (k + 1) / 20);
        const pop = (s) => { let c = 0; while (s) { c += s & 1; s >>= 1; } return c; };
        const T = {
          count: (s) => pop(s),
          first: (s) => s & 1,
          fl: (s, n) => (s & 1) + 2 * ((s >> (n - 1)) & 1),
          runs: (s, n) => { let r = 1; for (let i = 1; i < n; i++) if (((s >> i) & 1) !== ((s >> (i - 1)) & 1)) r++; return r; },
        };
        const pseq = (s, n, th) => { const k = pop(s); return th ** k * (1 - th) ** (n - k); };
        const cache = new Map();
        const info = (name, n) => {
          const key = name + n; if (cache.has(key)) return cache.get(key);
          const N = 1 << n, f = T[name]; const byT = new Map();
          for (let s = 0; s < N; s++) { const t = f(s, n); if (!byT.has(t)) byT.set(t, []); byT.get(t).push(s); }
          const pT = new Map(); let Hcond = 0;
          for (const th of THS) {
            const row = [...byT.values()].map((ss) => sum(ss.map((s) => pseq(s, n, th))));
            Hcond += H(row) / THS.length; byT.forEach((ss, t) => pT.set(t, (pT.get(t) || 0) + sum(ss.map((s) => pseq(s, n, th))) / THS.length));
          }
          const val = H([...pT.values()]) - Hcond; cache.set(key, val); return val;
        };
        const full = (n) => { const N = 1 << n, m = new Array(N).fill(0); for (let s = 0; s < N; s++) for (const th of THS) m[s] += pseq(s, n, th) / THS.length; return H(m) - sum(THS.map((th) => n * h2(th))) / THS.length; };
        const sC = v.stage({ x: [1, 8], y: [0, 3], height: 290, axes: 'box', gutter: true, xlabel: 'flips n', ylabel: 'bits', title: '$I(\\theta;T)$ against $n$' });
        sC.setTicks([1, 2, 3, 4, 5, 6, 7, 8].map((i) => [i, String(i)]), null);
        const sD = v.stage({ x: [0, 1], y: [0, 1], height: 290, axes: 'box', gutter: true, xlabel: 'sequences in the class', ylabel: 'p(x | T = t, θ)', title: 'inside one class, for $\\theta=0.25$ and $0.75$' });
        v.legend([['ink', '$I(\\theta;X^n)$ (everything)', { dash: true }], ['green', 'selected statistic (here: the sufficient one)'], ['faint', 'other statistics'], ['accent', '$\\theta=0.25$', { area: true }], ['orange', '$\\theta=0.75$', { area: true }]]);
        const COL = { count: 'green', first: 'red', fl: 'purple', runs: 'teal' };
        let cur = {};
        v.render(() => {
          const n = nS.value, sel = stat.value;
          const ns = [1, 2, 3, 4, 5, 6, 7, 8];
          sC.setView([1, 8], [0, Math.max(1, full(8)) * 1.1]);
          sC.path(ns.map((k) => [k, full(k)]), { color: 'ink', width: 2, dash: true });
          for (const nm of Object.keys(T)) sC.path(ns.map((k) => [k, info(nm, k)]), { color: nm === sel ? COL[nm] : 'faint', width: nm === sel ? 3 : 1.5, alpha: nm === sel ? 1 : 0.8 });
          sC.vline(n, { color: 'faint', dash: true });
          sC.dot(n, info(sel, n), { r: 6, color: COL[sel] });
          // classes
          const N = 1 << n, f = T[sel], cls = new Map();
          for (let s = 0; s < N; s++) { const t = f(s, n); if (!cls.has(t)) cls.set(t, []); cls.get(t).push(s); }
          const keys = [...cls.keys()].sort((a, b) => a - b), ci = Math.min(cS.value, keys.length - 1), ss = cls.get(keys[ci]);
          const cond = (th) => { const z = sum(ss.map((s) => pseq(s, n, th))); return ss.map((s) => pseq(s, n, th) / z); };
          const ca = cond(0.25), cb = cond(0.75), top = Math.max(...ca, ...cb) * 1.2;
          sD.setView([0, ss.length], [0, Math.min(1.05, top)]);
          ss.forEach((s, i) => {
            sD.rect(i + 0.06, 0, i + 0.5, ca[i], { fill: 'accent', fillAlpha: 0.55, stroke: false });
            sD.rect(i + 0.5, 0, i + 0.94, cb[i], { fill: 'orange', fillAlpha: 0.55, stroke: false });
          });
          if (ss.length <= 8) sD.setTicks(ss.map((s, i) => [i + 0.5, [...Array(n).keys()].map((b) => (s >> b) & 1).join('')]), null); else sD.setTicks(null, null);
          let diff = 0; ss.forEach((_, i) => { diff = Math.max(diff, Math.abs(ca[i] - cb[i])); });
          cur = { I: info(sel, n), IF: full(n), diff, size: ss.length, t: keys[ci], nc: keys.length };
        });
        v.readout(() => {
          const c = cur, suff = Math.abs(c.I - c.IF) < 1e-9;
          return String.raw`$n=${nS.value}$: $I(\theta;T)=${v.fix(c.I, 4)}$ against $I(\theta;X^n)=${v.fix(c.IF, 4)}$ bits (${suff ? '**equal: $T$ is sufficient**' : 'short by $' + v.fix(c.IF - c.I, 3) + '$ bits: not sufficient'}). Class $T=${c.t}$ has ${c.size} sequences (${c.nc} classes); the two conditional laws differ by at most $${v.fix(c.diff, 4)}$.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.12
    {
      num: '2.12',
      kind: 'Theorem',
      name: 'Fano’s inequality',
      statement: String.raw`Let $X$ take values in a finite alphabet $\mathcal X$ with $|\mathcal X|=M$, let $Y$ be any other random variable and $\hat X=g(Y)$ any estimator (possibly randomised) of $X$, and $P_e=\Pr(\hat X\ne X)$. Then
$$H(X\mid Y)\ \le\ H(X\mid\hat X)\ \le\ h(P_e)+P_e\log_2(M-1),$$
so a large conditional entropy forces a large probability of error: $P_e\ge F^{-1}\big(H(X\mid Y)\big)$, where $F(P)=h(P)+P\log_2(M-1)$ is increasing on $[0,\tfrac{M-1}{M}]$. In particular, $H(X\mid Y)>0$ implies $P_e>0$.`,
      idea: String.raw`The chain $X\to Y\to\hat X$ gives $H(X\mid Y)\le H(X\mid\hat X)$ by data processing (2.10). Let $E=\mathbb 1[\hat X\ne X]$; expanding $H(E,X\mid\hat X)$ in two ways with the chain rule (1.7) gives $H(X\mid\hat X)\le H(E)+H(X\mid E,\hat X)$. On the event $E=0$ the value of $X$ is known, and on $E=1$ it is one of the $M-1$ remaining symbols, so $H(X\mid E,\hat X)\le P_e\log(M-1)$, while $H(E)=h(P_e)$. Equality needs the errors spread evenly over the wrong symbols, as in a symmetric channel.`,
      caption: String.raw`Each dot is a (conditional entropy, error) pair for one estimator. Set the channel strength, the alphabet size $M$, and the estimator: with noise $r=0$ it is the best possible (MAP) guess, larger $r$ makes it guess at random, and “runner-up” guesses the second most likely symbol. Gold is the error rate measured on 2000 simulated trials. The shaded region, below Fano's curve, is unreachable: all dots stay out of it. With the symmetric channel the MAP estimator sits exactly on the curve; with errors only to neighbours it sits above.`,
      deps: ['info-2.10', 'info-1.7'],
      refs: ['Cover–Thomas §2.10'],
      tags: ['Fano', 'error probability'],
      credit: 'R. M. Fano, 1952 (lecture notes, MIT)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Fano%27s_inequality' },
      viz(v) {
        const Ms = v.slider('alphabet size $M$', 2, 8, 4, { int: true });
        const chan = v.select('channel', [{ value: 'sym', label: 'symmetric' }, { value: 'nb', label: 'errors to neighbours' }], 'nb');
        const eS = v.slider('channel noise $\\varepsilon$', 0, 0.9, 0.3, { step: 0.005 });
        const rS = v.slider('estimator noise $r$', 0, 1, 0, { step: 0.01 });
        const ru = v.toggle('runner-up guess', false);
        const s = v.stage({ x: [0, 2], y: [0, 1], height: 340, axes: 'box', gutter: true, full: true, xlabel: 'H(X|Y) in bits', ylabel: 'probability of error', title: 'Fano: the shaded region is unreachable' });
        v.legend([['red', 'unreachable region', { area: true }], ['red', 'Fano curve $h(P)+P\\log(M-1)$'], ['muted', 'this channel and estimator, as noise grows', { dash: true }], ['accent', 'exact point', { dot: true }], ['gold', 'simulated', { dot: true }]]);
        const joint = (M, e, kind) => {
          const J = Array.from({ length: M }, () => new Array(M).fill(0));
          for (let x = 0; x < M; x++) {
            if (kind === 'sym') for (let y = 0; y < M; y++) J[x][y] += (y === x ? 1 - e : e / (M - 1)) / M;
            else { J[x][x] += (1 - e) / M; if (M === 2) J[x][1 - x] += e / M; else { J[x][(x + 1) % M] += e / 2 / M; J[x][(x + M - 1) % M] += e / 2 / M; } }
          }
          return J;
        };
        const rank = (J, y, M) => [...Array(M).keys()].sort((a, b) => J[b][y] - J[a][y] || a - b);
        const evalAt = (M, e, kind, r, second) => {
          const J = joint(M, e, kind); let HXY = 0, py = new Array(M).fill(0), pe = 0;
          for (let x = 0; x < M; x++) for (let y = 0; y < M; y++) { py[y] += J[x][y]; if (J[x][y] > 0) HXY -= J[x][y] * log2(J[x][y]); }
          const HXgY = HXY - H(py);
          for (let y = 0; y < M; y++) { const g = rank(J, y, M)[second ? Math.min(1, M - 1) : 0]; pe += py[y] - ((1 - r) * J[g][y] + (r * py[y]) / M); }
          return { J, HXgY, pe, py };
        };
        const F = (P, M) => h2(P) + (M > 1 ? P * log2(M - 1) : 0);
        const Finv = (h, M) => { let lo = 0, hi = (M - 1) / M; for (let it = 0; it < 60; it++) { const m = (lo + hi) / 2; if (F(m, M) < h) lo = m; else hi = m; } return (lo + hi) / 2; };
        let cur = {};
        v.render(() => {
          const M = Ms.value, kind = chan.value, emax = kind === 'sym' ? (M - 1) / M : Math.min(1, 1);
          eS.el.hidden = false;
          const Hm_ = log2(M); s.setView([0, Hm_ * 1.04], [0, 1.02]);
          const pts = []; for (let k = 0; k <= 100; k++) { const P = ((M - 1) / M) * (k / 100); pts.push([F(P, M), P]); }
          s.poly([...pts, [Hm_, 0], [0, 0]], { fill: 'red', fillAlpha: 0.14, stroke: false });
          s.path(pts, { color: 'red', width: 2.5 });
          const e = Math.min(eS.value, kind === 'sym' ? emax : 1), trace = [];
          for (let k = 0; k <= 60; k++) { const ev = evalAt(M, (k / 60) * (kind === 'sym' ? emax : 1), kind, rS.value, ru.value); trace.push([ev.HXgY, ev.pe]); }
          s.path(trace, { color: 'muted', width: 1.5, dash: true });
          const ev = evalAt(M, e, kind, rS.value, ru.value);
          // simulation
          const rg = v.rng(hashStr('info-2.12|' + M + kind)); let err = 0; const NT = 2000;
          for (let t = 0; t < NT; t++) {
            const x = Math.floor(rg() * M); let u = rg(), y = 0, c = 0; for (; y < M - 1; y++) { c += ev.J[x][y] * M; if (u < c) break; }
            const guessR = rg(), uni = Math.floor(rg() * M); const g0 = rank(ev.J, y, M)[ru.value ? Math.min(1, M - 1) : 0];
            const g = guessR < rS.value ? uni : g0; if (g !== x) err++;
          }
          const sim = err / NT;
          s.dot(ev.HXgY, ev.pe, { r: 8, color: 'accent' });
          s.dot(ev.HXgY, sim, { r: 4, color: 'gold' });
          const lb = Finv(ev.HXgY, M);
          s.line(ev.HXgY, lb, ev.HXgY, ev.pe, { color: 'accent', width: 2 });
          s.dot(ev.HXgY, lb, { r: 4, color: 'red', hollow: true });
          cur = { M, h: ev.HXgY, pe: ev.pe, lb, sim, F: F(ev.pe, M) };
        });
        v.readout(() => {
          const c = cur;
          return String.raw`$M=${c.M}$: $H(X\mid Y)=${v.fix(c.h, 3)}$ bits; Fano's floor on the error is $P_e\ge${v.fix(c.lb, 3)}$; this estimator errs with probability $${v.fix(c.pe, 3)}$ (simulated: $${v.fix(c.sim, 3)}$). Check: $h(P_e)+P_e\log(M-1)=${v.fix(c.F, 3)}\ge H(X\mid Y)=${v.fix(c.h, 3)}$.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.13
    {
      num: '2.13',
      kind: 'Theorem',
      name: 'Pinsker’s inequality',
      statement: String.raw`For probability distributions $p,q$ on a common alphabet, with total-variation distance $\delta=\tfrac12\sum_x|p(x)-q(x)|=\max_A|p(A)-q(A)|$ and relative entropy measured in nats,
$$D(p\,\|\,q)\ \ge\ 2\,\delta^2\qquad\Big(\text{equivalently } \delta\le\sqrt{\tfrac12 D(p\|q)}\Big).$$
In bits the bound reads $D(p\|q)\ge\frac{2}{\ln 2}\delta^2$. Small divergence therefore forces the two distributions to be close in total variation, so no test can tell them apart well. The converse fails: $\delta$ may be small while $D$ is infinite.`,
      idea: String.raw`Reduce to two outcomes: let $A=\{x:p(x)>q(x)\}$ and merge outcomes into $A$ and its complement. By the data-processing inequality (2.10) merging cannot increase $D$, and it preserves $\delta$, so it suffices to prove the binary case $d(a\|b)\ge2(a-b)^2$. The derivative in $b$ of $d(a\|b)-2(a-b)^2$ is $(b-a)\big(\frac{1}{b(1-b)}-4\big)$, which is negative for $b<a$ and positive for $b>a$ because $b(1-b)\le\frac14$; so the minimum is at $b=a$, where both sides vanish. The constant $2$ cannot be improved.`,
      caption: String.raw`Left: the probability triangle of distributions on three outcomes; drag $p$ (blue) and $q$ (orange). Right: every grey point is one random pair $(p,q)$ drawn from the triangle, plotted by total-variation distance and divergence; the gold point is your pair. All of them lie above the red parabola $D=2\delta^2$; the pairs that nearly touch it are those with $p$ and $q$ close to each other.`,
      deps: ['info-2.2', 'info-2.10'],
      refs: ['Cover–Thomas §11.6'],
      tags: ['Pinsker', 'total variation'],
      credit: 'Pinsker, 1960 (the sharp constant, independently: Csiszár and Kullback, 1967)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Pinsker%27s_inequality' },
      viz(v) {
        const unit = v.select('units of $D$', [{ value: 'nats', label: 'nats' }, { value: 'bits', label: 'bits' }], 'nats');
        v.button('New random pairs', () => { seed++; });
        const sT = v.stage({ x: [-0.15, 1.15], y: [-0.12, 1.0], height: 330, equal: true, axes: false, title: 'drag $p$ and $q$ in the triangle' });
        const sS = v.stage({ x: [0, 1], y: [0, 3], height: 330, axes: 'box', gutter: true, xlabel: 'total variation δ', ylabel: 'D(p‖q)', title: 'random pairs: $D$ against $\\delta$' });
        const R3 = Math.sqrt(3) / 2, A = [0, 0], B = [1, 0], C = [0.5, R3];
        const toXY = (w) => [w[1] + 0.5 * w[2], R3 * w[2]];
        const toW = (x, y) => { let c = y / R3, b = x - 0.5 * c, a = 1 - b - c; a = Math.max(a, 0.004); b = Math.max(b, 0.004); c = Math.max(c, 0.004); const s = a + b + c; return [a / s, b / s, c / s]; };
        const cons = (x, y) => toXY(toW(x, y));
        const hp = sT.handle(...toXY([0.6, 0.25, 0.15]), { color: 'accent', label: 'p', constrain: cons });
        const hq = sT.handle(...toXY([0.2, 0.3, 0.5]), { color: 'orange', label: 'q', constrain: cons });
        let seed = 1;
        let pairs = null, pk = null;
        const gen = () => {
          if (pk === seed) return pairs; pk = seed; const r = v.rng(hashStr('info-2.13|' + seed)), dir = () => { const e = [r(), r(), r()].map((u) => -Math.log(1e-9 + u)); const s = sum(e); return e.map((x) => x / s); };
          pairs = []; for (let i = 0; i < 700; i++) { const p = dir(), o = dir(), t = Math.pow(r(), 1.7), q = p.map((x, k) => (1 - t) * x + t * o[k]); pairs.push([TV(p, q), KL(p, q) * Math.LN2]); }
          return pairs;
        };
        v.legend([['red', '$D=2\\delta^2$'], ['faint', 'random pairs', { dot: true }], ['gold', 'your pair', { dot: true }]]);
        let cur = {};
        v.render(() => {
          const k = unit.value === 'bits' ? 1 / Math.LN2 : 1;
          sT.poly([A, B, C], { color: 'ink', width: 1.8, fill: 'accent', fillAlpha: 0.05 });
          sT.text('outcome 1', 0, -0.03, { align: 'center', size: 11, color: 'muted', dy: 8 }); sT.text('outcome 2', 1, -0.03, { align: 'center', size: 11, color: 'muted', dy: 8 }); sT.text('outcome 3', 0.5, R3, { align: 'center', size: 11, color: 'muted', dy: -10 });
          sT.line(hp.x, hp.y, hq.x, hq.y, { color: 'gold', width: 1.5, dash: true });
          sS.setView([0, 1], [0, 3.2 * k]);
          sS.fn((d) => 2 * d * d * k, { domain: [0, 1], color: 'red', width: 2.5 });
          const pts = gen(); for (const [d, D] of pts) { const y = D * k; if (y <= 3.2 * k) sS.dot(d, y, { r: 2.2, color: 'faint' }); }
          const wp = toW(hp.x, hp.y), wq = toW(hq.x, hq.y), d = TV(wp, wq), D = KL(wp, wq) * Math.LN2;
          sS.dot(d, Math.min(D * k, 3.1 * k), { r: 7, color: 'gold' });
          sS.vline(d, { color: 'faint', dash: true });
          let viol = 0; for (const [dd, DD] of pts) if (DD < 2 * dd * dd - 1e-9) viol++;
          cur = { d, D, viol, n: pts.length, minr: Math.min(...pts.filter(([dd]) => dd > 0.02).map(([dd, DD]) => DD / (2 * dd * dd))) };
        });
        v.readout(() => {
          const c = cur;
          return String.raw`Your pair: $\delta=${v.fix(c.d, 3)}$, $D(p\|q)=${v.fix(c.D, 4)}$ nats $\ge2\delta^2=${v.fix(2 * c.d * c.d, 4)}$ (ratio $${v.fix(c.D / Math.max(2 * c.d * c.d, 1e-12), 2)}$). Among the ${c.n} random pairs, ${c.viol} violate the bound; the smallest ratio $D/2\delta^2$ for $\delta>0.02$ is $${v.fix(c.minr, 3)}$.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.14
    {
      num: '2.14',
      kind: 'Method',
      name: 'Information gain in decision trees',
      statement: String.raw`A decision tree classifies examples by asking about one attribute at a time. At a node holding a set $S$ of labelled examples, splitting on an attribute $A$ with values $a$ partitions $S$ into subsets $S_a$, and the **information gain** is
$$\mathrm{IG}(S,A)=H(S)-\sum_a\frac{|S_a|}{|S|}H(S_a)=I(\text{label};A),$$
where $H(S)$ is the entropy of the label distribution in $S$ (computed from the empirical frequencies). Greedy induction (ID3, C4.5) splits each node on the attribute of largest gain until the nodes are pure or the attributes run out. The gain is always $\ge0$ (conditioning reduces entropy, 2.7), but it favours attributes with many values: an identifier that splits the data into singletons has the maximal gain $H(S)$ and no predictive value.`,
      idea: String.raw`Information gain is the empirical mutual information between the label and the attribute, so each question is chosen to remove as much label uncertainty as possible, the same logic as the yes/no questions of 1.5 and 1.12. Because $H(\text{label}\mid A)\le H(\text{label})$ (2.7), splitting never hurts on the training set, and a purely greedy tree is a locally optimal, not globally optimal, sequence of questions. The bias toward many-valued attributes is an overfitting effect (the estimated entropy of tiny subsets is optimistic); C4.5 corrects it by dividing the gain by the entropy of the split itself (the gain ratio).`,
      caption: String.raw`A small invented data set of 16 days (label: go out or stay in) is the root of a tree. Click a node to select it; the bars show the information gain of every attribute at that node (the best one is green). Click a bar to split the selected node on it, or use “Grow greedily”. Switch on the “day number” attribute: it has the largest gain at the root but the tree it builds is useless on new days. The numbers on nodes are $\#\text{go}\!:\!\#\text{stay}$.`,
      deps: ['info-2.5'],
      refs: ['MacKay ch. 4'],
      tags: ['decision tree', 'information gain'],
      credit: 'J. R. Quinlan, 1986 (ID3)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Information_gain_(decision_tree)' },
      viz(v) {
        const FEAT = [
          { id: 'sky', name: 'sky', vals: ['sunny', 'cloud', 'rain'] },
          { id: 'wind', name: 'wind', vals: ['calm', 'windy'] },
          { id: 'temp', name: 'temp', vals: ['hot', 'mild', 'cool'] },
          { id: 'hum', name: 'humidity', vals: ['high', 'normal'] },
          { id: 'day', name: 'day no.', vals: [...Array(16).keys()].map((i) => String(i + 1)) },
        ];
        const r = v.rng(11);
        const rows = [...Array(16).keys()].map((i) => {
          const o = { sky: Math.floor(r() * 3), wind: Math.floor(r() * 2), temp: Math.floor(r() * 3), hum: Math.floor(r() * 2), day: i };
          let go = o.sky === 1 || (o.sky === 0 && o.hum === 1) || (o.sky === 2 && o.wind === 0);
          if (i === 3 || i === 11) go = !go;
          o.go = go ? 1 : 0; return o;
        });
        const ent = (S) => { const g = S.filter((i) => rows[i].go).length; return H([g, S.length - g]); };
        const gain = (S, f) => { const parts = FEAT[f].vals.map((_, k) => S.filter((i) => rows[i][FEAT[f].id] === k)); return ent(S) - sum(parts.map((P) => (P.length ? (P.length / S.length) * ent(P) : 0))); };
        const useDay = v.toggle('include the “day no.” attribute', false);
        let nodes, sel;
        const reset = () => { nodes = [{ S: [...Array(16).keys()], f: null, kids: [], par: -1, used: [], lab: '' }]; sel = 0; };
        reset();
        const avail = (n) => FEAT.map((_, f) => f).filter((f) => (f < 4 || useDay.value) && !n.used.includes(f));
        const split = (ni, f) => {
          const n = nodes[ni]; if (n.f !== null || n.S.length < 2 || ent(n.S) === 0) return;
          n.f = f; n.kids = FEAT[f].vals.map((val, k) => { const S = n.S.filter((i) => rows[i][FEAT[f].id] === k); nodes.push({ S, f: null, kids: [], par: ni, used: [...n.used, f], lab: val }); return nodes.length - 1; }).filter((id) => nodes[id].S.length > 0);
        };
        const best = (n) => { let b = -1, bg = 1e-9; for (const f of avail(n)) { const g = gain(n.S, f); if (g > bg) { bg = g; b = f; } } return b; };
        v.button('Split selected node on the best', () => { const f = best(nodes[sel]); if (f >= 0) split(sel, f); });
        v.button('Grow greedily', () => { for (let it = 0; it < 4; it++) for (let i = 0; i < nodes.length; i++) { if (nodes[i].f === null) { const f = best(nodes[i]); if (f >= 0) split(i, f); } } });
        v.button('Reset', reset);
        const sT = v.stage({ x: [0, 1], y: [-4.6, 0.7], height: 330, axes: false, full: true, title: 'the tree: click a node to select it' });
        const sG = v.stage({ x: [-0.6, 4.6], y: [0, 1], height: 250, axes: 'box', gutter: true, ylabel: 'IG (bits)', title: 'information gain at the selected node: click a bar to split' });
        let layout = [];
        sT.onClick((x, y) => { let bi = -1, bd = 1e9; layout.forEach((L, i) => { const d = Math.abs(L.x - x) * 4 + Math.abs(L.y - y); if (d < bd) { bd = d; bi = i; } }); if (bi >= 0 && bd < 1.6) sel = bi; });
        sG.onClick((x) => { const k = Math.round(x), n = nodes[sel], av = avail(n); const f = k; if (f >= 0 && f < FEAT.length && av.includes(f)) split(sel, f); });
        v.legend([['green', 'go-heavy node', { area: true }], ['red', 'stay-heavy node', { area: true }], ['gold', 'selected', { area: true }]]);
        const leafOrder = () => { const xs = []; let cnt = 0; const rec = (i, d) => { const n = nodes[i]; if (!n.kids.length) { xs[i] = cnt++; layout[i] = { x: 0, y: -d }; return; } n.kids.forEach((k) => rec(k, d + 1)); xs[i] = n.kids.reduce((a, k) => a + xs[k], 0) / n.kids.length; layout[i] = { x: 0, y: -d }; }; layout = []; rec(0, 0); return { xs, cnt }; };
        let cur = {};
        v.render(() => {
          if (!useDay.value) for (const n of nodes) if (n.f === 4) { reset(); break; }
          const { xs, cnt } = leafOrder();
          const W = Math.max(cnt + 0.6, 4); sT.setView([(cnt - 1) / 2 - W / 2, (cnt - 1) / 2 + W / 2], [-4.6, 0.7]);
          layout.forEach((L, i) => { L.x = xs[i]; });
          nodes.forEach((n, i) => {
            const L = layout[i]; if (!L) return;
            n.kids.forEach((k) => { sT.line(L.x, L.y - 0.28, layout[k].x, layout[k].y + 0.3, { color: 'faint', width: 1.4 }); sT.text(nodes[k].lab, (L.x + layout[k].x) / 2, (L.y + layout[k].y) / 2, { align: 'center', size: 10.5, color: 'muted', dy: -2 }); });
          });
          nodes.forEach((n, i) => {
            const L = layout[i], g = n.S.filter((j) => rows[j].go).length, tot = n.S.length, hw = Math.min(0.42, 0.1 * Math.max(cnt + 0.6, 4));
            const col = g * 2 >= tot ? 'green' : 'red', pure = g === 0 || g === tot;
            sT.rect(L.x - hw, L.y - 0.28, L.x + hw, L.y + 0.28, { fill: col, fillAlpha: pure ? 0.5 : 0.2, color: i === sel ? 'gold' : col, width: i === sel ? 3 : 1.4, radius: 5 });
            sT.text(`${g}:${tot - g}`, L.x, L.y + 0.07, { align: 'center', size: 11.5, weight: 700 });
            sT.text(n.f !== null ? FEAT[n.f].name : 'H=' + v.fix(ent(n.S), 2), L.x, L.y - 0.14, { align: 'center', size: 9.5, color: 'muted' });
          });
          // gains
          const n = nodes[sel], av = avail(n), gs = FEAT.map((F, f) => (av.includes(f) ? gain(n.S, f) : null)), bf = n.f === null ? best(n) : -1;
          const top = Math.max(0.2, ent(n.S) * 1.1);
          sG.setView([-0.6, 4.6], [0, top]);
          sG.setTicks(FEAT.map((F, f) => [f, F.name]), null);
          gs.forEach((g, f) => {
            if (g === null) { sG.text(f === 4 && !useDay.value ? 'off' : 'used', f, top * 0.04, { align: 'center', size: 10.5, color: 'faint' }); return; }
            const c = f === bf ? 'green' : 'accent';
            sG.rect(f - 0.34, 0, f + 0.34, g, { fill: c, fillAlpha: n.f === null ? 0.5 : 0.2, color: c, width: 1.5 });
            sG.text(v.fix(g, 3), f, g, { dy: -9, align: 'center', size: 11, weight: 600 });
          });
          sG.hline(ent(n.S), { color: 'orange', dash: true }); sG.text('H(node) = ' + v.fix(ent(n.S), 3), -0.55, ent(n.S), { align: 'left', dy: -9, size: 11, color: 'orange' });
          let leaves = 0, wH = 0, acc = 0;
          nodes.forEach((m) => { if (!m.kids.length) { leaves++; wH += (m.S.length / 16) * ent(m.S); acc += Math.max(m.S.filter((j) => rows[j].go).length, m.S.filter((j) => !rows[j].go).length); } });
          cur = { leaves, wH, acc: acc / 16, H0: ent(nodes[0].S), selH: ent(n.S), selN: n.S.length, split: n.f !== null };
        });
        v.readout(() => {
          const c = cur;
          return String.raw`Root entropy $H=${v.fix(c.H0, 3)}$ bits. The tree has ${c.leaves} ${c.leaves === 1 ? 'leaf' : 'leaves'} with average leaf entropy $${v.fix(c.wH, 3)}$ bits (the root's $H$ minus the total gain so far, ${v.fix(c.H0 - c.wH, 3)}); training accuracy ${v.fix(100 * c.acc, 0)}%. Selected node: ${c.selN} days, $H=${v.fix(c.selH, 3)}$` + (c.split ? ' (already split).' : '.');
        });
      },
    },
  ],
};
