// Information & Coding Theory — Chapter 3 (part b): large deviations, entropy rates and Markov sources (items 3.9–3.15)
//
// Same house style as part a. Exact counting is done in the log domain (ch03.shared.js); simulations are seeded.

import { clamp, sum, H, h2, KL, commas, hashStr, LET, lbinom, lmult, lse2, lbinPmf, lseqP, typeRound, lQclass, pick,
  simXY, simP, simStage, drawSimplex, simHandle, stationary, markovRate, stepDist, barEd } from './ch03.shared.js';

const log2 = Math.log2;
const pw2 = (x) => Math.pow(2, x);
const R3 = Math.sqrt(3) / 2;

export default {
  collection: 'info',
  chapter: 3,
  items: [
    // ───────────────────────────────────────────────────────────── 3.9
    {
      num: '3.9',
      kind: 'Theorem',
      name: 'Sanov’s theorem',
      statement: String.raw`Let $X_1,\dots,X_n$ be i.i.d. with distribution $Q$ on a finite alphabet, and let $E$ be a set of distributions on that alphabet. Then
$$Q^n(E)\ \le\ (n+1)^{|\mathcal X|}\,2^{-n\,D(P^*\|Q)},\qquad P^*=\arg\min_{P\in E}D(P\|Q),$$
where $Q^n(E)$ is the probability that the empirical distribution of $X^n$ lies in $E$. If moreover $E$ is the closure of its interior, then $\frac1n\log_2Q^n(E)\to-D(P^*\|Q)$. The exponent is the relative entropy from $Q$ to the *closest* point of $E$, and if $Q\in E$ it is $0$ (the event is typical).`,
      idea: String.raw`Split $E$ into the type classes it contains. There are at most $(n+1)^{|\mathcal X|}$ types (3.6), and each class has $Q^n(T(P))\le2^{-nD(P\|Q)}$ (3.8), at most $2^{-nD(P^*\|Q)}$ since $P^*$ minimises $D$ over $E$. Summing gives the upper bound. For the lower bound, $E$ being the closure of its interior lets one pick types $P_n\in E$ with $P_n\to P^*$, and $Q^n(T(P_n))\ge(n+1)^{-|\mathcal X|}2^{-nD(P_n\|Q)}$. A rare event happens in the cheapest way available, and the price is paid in the exponent only.`,
      caption: String.raw`Drag the true distribution $Q$ (orange), the centre of the disc $E$ (purple) and its radius. Shading shows $D(P\|Q)$; the green dot $P^*$ is the point of $E$ closest to $Q$ in divergence (not in Euclidean distance: compare it with the straight line from $Q$). Right: the exact exponent $-\frac1n\log_2Q^n(E)$, summed over all types in $E$, tends to $D(P^*\|Q)$ from above, with the orange polynomial-factor lower bound. Gold dots are empirical types of $n$ simulated sequences: the fraction in $E$ is the event being counted. Put $Q$ inside the disc and the exponent drops to $0$.`,
      deps: ['info-3.8'],
      refs: ['Cover–Thomas §11.4'],
      tags: ['large deviations', 'method of types'],
      credit: 'I. N. Sanov, 1957 (Mat. Sb. 42(84), 11–44)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Sanov%27s_theorem' },
      viz(v) {
        const sim = simStage(v, { height: 330, title: 'the set $E$ (disc), the truth $Q$, and the closest point $P^*$' });
        const hQ = simHandle(sim, [0.5, 0.3, 0.2], { color: 'orange', label: 'Q' });
        const hC = simHandle(sim, [0.12, 0.2, 0.68], { color: 'purple', label: 'E', min: 0 });
        const rS = v.slider('radius of $E$', 0.04, 0.4, 0.15, { step: 0.01 });
        const nS = v.slider('sample length $n$', 5, 150, 60, { int: true });
        let seed = 1; v.button('Resample', () => { seed++; });
        const NM = 150;
        const s2 = v.stage({ x: [2, NM], y: [0, 3], height: 330, axes: 'box', gutter: true, xlabel: 'n', ylabel: '−(1/n) log₂ Qⁿ(E)', title: 'exponent of the probability of $E$' });
        v.legend([['accent', 'exact $-\\frac1n\\log_2Q^n(E)$'], ['green', '$D(P^*\\|Q)$'], ['orange', '$D-\\frac3n\\log_2(n+1)$'], ['gold', 'empirical types of $n$ samples', { dot: true }]]);
        const nearest = (Q, cx, cy, r) => {
          let best = null, bd = Infinity;
          const scan = (x0, x1, y0, y1, res) => {
            for (let i = 0; i <= res; i++) for (let j = 0; j <= res; j++) {
              const x = x0 + (x1 - x0) * i / res, y = y0 + (y1 - y0) * j / res;
              if ((x - cx) ** 2 + (y - cy) ** 2 > r * r) continue;
              const P = simP(x, y); if (P.some((t) => t < -1e-12)) continue;
              const d = KL(P.map((t) => Math.max(0, t)), Q); if (d < bd) { bd = d; best = [x, y]; }
            }
          };
          scan(0, 1, 0, R3, 180);
          if (best) { for (const w of [0.012, 0.0012]) scan(best[0] - w, best[0] + w, best[1] - w, best[1] + w, 40); }
          return best ? { xy: best, D: bd } : null;
        };
        let cache = null, cloud = null, info = {};
        v.render(() => {
          const Q = hQ.P(), [cx, cy] = [hC.x, hC.y], r = rS.value, n = nS.value;
          const qk = Q.map((t) => t.toFixed(3)).join(',');
          sim.raster((x, y) => { const P = simP(x, y); if (P.some((t) => t < 0)) return null; return v.ramp(Math.pow(1 - Math.exp(-1.1 * KL(P, Q)), 0.8) * 0.85, 'accent'); }, { res: 3, key: qk, id: 'dq' });
          drawSimplex(sim, { k: 4 });
          sim.circle(cx, cy, r, { color: 'purple', fill: 'purple', fillAlpha: 0.12, width: 2 });
          const key = `${qk}|${cx.toFixed(3)}|${cy.toFixed(3)}|${r}`;
          if (!cache || cache.key !== key) {
            const near = nearest(Q, cx, cy, r), [qx, qy] = simXY(Q), inside = (qx - cx) ** 2 + (qy - cy) ** 2 <= r * r;
            const lq = Q.map(log2), pts = [];
            for (let m = 2; m <= NM; m++) {
              const ls = [];
              for (let i = 0; i <= m; i++) for (let j = 0; i + j <= m; j++) {
                const k = m - i - j, [x, y] = simXY([i / m, j / m, k / m]);
                if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) ls.push(lmult([i, j, k]) + i * lq[0] + j * lq[1] + k * lq[2]);
              }
              pts.push(ls.length ? [m, -lse2(ls) / m, lse2(ls)] : null);
            }
            cache = { key, near: inside ? { xy: [qx, qy], D: 0 } : near, pts, inside };
          }
          const near = cache.near, D = near ? near.D : Infinity;
          if (near) {
            sim.line(...simXY(Q), ...near.xy, { color: 'faint', dash: true });
            sim.dot(near.xy[0], near.xy[1], { r: 6, color: 'green', label: 'P*', labelPos: 'ne' });
          }
          // empirical types of n samples from Q^n
          const ck = `${qk}|${n}|${seed}`;
          if (!cloud || cloud.key !== ck) {
            const rng = v.rng(hashStr(ck)), cum = [Q[0], Q[0] + Q[1]], pts = [];
            for (let t = 0; t < 400; t++) { const c = [0, 0, 0]; for (let i = 0; i < n; i++) { const u = rng(); c[u < cum[0] ? 0 : u < cum[1] ? 1 : 2]++; } pts.push(c); }
            cloud = { key: ck, pts };
          }
          let hit = 0;
          for (const c of cloud.pts) { const [x, y] = simXY(c.map((t) => t / n)); if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) hit++; sim.dot(x, y, { r: 2.2, color: 'gold' }); }
          const ys = cache.pts.filter(Boolean).map((p) => p[1]);
          s2.setView([2, NM], [0, Math.max(1, Math.min(8, Math.max(D * 1.4, ...ys.slice(-40)) + 0.2))]);
          if (D < Infinity) {
            s2.hline(D, { color: 'green', width: 2 });
            s2.path(Array.from({ length: NM - 1 }, (_, i) => [i + 2, D - 3 * log2(i + 3) / (i + 2)]), { color: 'orange', width: 1.8 });
          }
          s2.path(cache.pts.map((p) => (p ? [p[0], p[1]] : null)), { color: 'accent', width: 2.4 });
          s2.vline(n, { color: 'faint', dash: true });
          const cp = cache.pts[n - 2];
          info = { D, n, hit, lg: cp ? cp[2] : -Infinity, inside: cache.inside };
        });
        v.readout(() => String.raw`$D(P^*\|Q)=${v.fix(info.D, 3)}$ bits` + (info.inside ? String.raw` ($Q$ lies in $E$, so $E$ is typical and $Q^n(E)\to1$)` : '') + String.raw`. At $n=${info.n}$ the exact probability of $E$ is ` + (info.lg === -Infinity ? 'zero (no type of length $n$ lies in $E$)' : String.raw`$2^{${v.fix(info.lg, 2)}}$, so $-\frac1n\log_2Q^n(E)=${v.fix(-info.lg / info.n, 3)}$`) + String.raw`; ${info.hit} of the 400 simulated empirical types fall in $E$.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.10
    {
      num: '3.10',
      kind: 'Theorem',
      name: 'Chernoff–Stein lemma',
      statement: String.raw`Test the simple hypotheses $H_0:X_i\sim P$ against $H_1:X_i\sim Q$ (i.i.d., finite alphabet, $D(P\|Q)<\infty$) with $n$ observations. For a decision region $A_n$ (accept $H_0$), let $\alpha_n=P^n(A_n^c)$ be the false-alarm probability and $\beta_n=Q^n(A_n)$ the miss probability. Fix $0<\varepsilon<\tfrac12$ and let $\beta_n^\varepsilon=\min\{\beta_n:\alpha_n<\varepsilon\}$. Then
$$\lim_{n\to\infty}-\frac1n\log_2\beta_n^\varepsilon\ =\ D(P\|Q),$$
whatever the value of $\varepsilon$. With the false-alarm rate held fixed, the best miss probability decays exponentially at the rate given by the relative entropy of the null from the alternative.`,
      idea: String.raw`Achievability: take $A_n$ to be the typical set of $P$ (3.3) with respect to the log-likelihood ratio: it has $P^n$-probability $>1-\varepsilon$ eventually (3.1), and each member has $Q^n(x^n)\le2^{-n(D(P\|Q)-\varepsilon')}$, so $\beta_n\le2^{-n(D-\varepsilon')}$. Converse: any region with $P^n(A_n)\ge1-\varepsilon$ must contain at least $1-2\varepsilon$ of its mass on sequences whose log-likelihood ratio is close to $nD$, and these have $Q^n$-mass at least $2^{-n(D+\varepsilon')}$ times their $P^n$-mass. The optimal regions are Neyman–Pearson likelihood-ratio tests; the picture computes them exactly.`,
      caption: String.raw`Binary alphabet, $P=\mathrm{Bernoulli}(p_0)$ and $Q=\mathrm{Bernoulli}(q)$. The Neyman–Pearson test accepts the sequences with the largest likelihood ratio until $P^n$ has mass $1-\varepsilon$ (the last class is cut exactly, as a deterministic subset). Left: $-\frac1n\log_2\beta_n$ for three values of $\varepsilon$ converges to $D(P\|Q)$ (green) from different directions. Right: at the chosen $n$, the pmfs of the number of ones under $P$ (blue) and $Q$ (orange); the shaded orange area is $\beta_n$ and the shaded red area $\alpha_n$.`,
      deps: ['info-3.8'],
      refs: ['Cover–Thomas §11.8'],
      tags: ['hypothesis testing', 'large deviations'],
      credit: 'Named for Herman Chernoff and a result credited to Charles Stein (the exact first source was not verified here); Chernoff, Ann. Math. Stat. 23 (1952) 493 is the related paper on the Chernoff bound',
      verify: true,
      scope: String.raw`Holds for i.i.d. observations under both hypotheses, with $D(P\|Q)<\infty$. The false-alarm constraint is fixed, not shrinking with $n$; if both error probabilities must vanish together, the exponent is the Chernoff information rather than $D(P\|Q)$.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Stein%27s_lemma' },
      viz(v) {
        const pS = v.slider(String.raw`$P=\mathrm{Bern}(p_0)$, $p_0$`, 0.05, 0.95, 0.5, { step: 0.01 });
        const qS = v.slider(String.raw`$Q=\mathrm{Bern}(q)$, $q$`, 0.05, 0.95, 0.2, { step: 0.01 });
        const eS = v.slider(String.raw`false-alarm bound $\varepsilon$`, 0.01, 0.45, 0.1, { log: true });
        const nS = v.slider('length $n$ (right panel)', 5, 300, 60, { int: true });
        const NM = 300;
        const s1 = v.stage({ x: [5, NM], y: [0, 2], height: 280, axes: 'box', gutter: true, xlabel: 'n', ylabel: '−(1/n) log₂ βₙ', title: 'miss-probability exponent of the best test' });
        const s2 = v.stage({ x: [0, 1], y: [0, 1], height: 280, axes: 'box', gutter: true, xlabel: 'fraction of ones k/n', ylabel: 'probability density of k/n', title: 'the two hypotheses and the optimal acceptance region' });
        v.legend([['accent', '$\\varepsilon$ (slider)'], ['orange', '$\\varepsilon=0.3$'], ['purple', '$\\varepsilon=0.01$'], ['green', '$D(P\\|Q)$']]);
        // Neyman–Pearson: classes ordered by likelihood ratio (large first)
        function np(n, p0, q, eps) {
          const ks = []; for (let k = 0; k <= n; k++) ks.push(k);
          const asc = p0 < q; ks.sort((a, b) => (asc ? a - b : b - a));
          let cum = 0; const lq = [], inc = [];
          for (const k of ks) {
            const mp = pw2(lbinPmf(n, k, p0));
            if (cum + mp >= 1 - eps) {
              const f = Math.min(1, Math.max(0, (1 - eps - cum) / mp));
              if (f > 0) lq.push(lbinPmf(n, k, q) + log2(f));
              inc.push([k, f]);
              return { lb: lse2(lq), inc, alpha: eps };
            }
            cum += mp; lq.push(lbinPmf(n, k, q)); inc.push([k, 1]);
          }
          return { lb: lse2(lq), inc, alpha: 0 };
        }
        let cache = null, info = {};
        v.render(() => {
          const p0 = pS.value, q = qS.value, eps = eS.value, n = nS.value, D = KL([p0, 1 - p0], [q, 1 - q]), key = `${p0}|${q}|${eps}`;
          if (!cache || cache.key !== key) {
            const mk = (e) => { const a = []; for (let m = 5; m <= NM; m++) a.push([m, -np(m, p0, q, e).lb / m]); return a; };
            cache = { key, a: mk(eps), b: mk(0.3), c: mk(0.01) };
          }
          const top = Math.max(0.5, D * 1.5, ...cache.c.map((p) => p[1]).filter(isFinite)) * 1.05;
          s1.setView([5, NM], [0, Math.min(top, 8)]);
          s1.hline(D, { color: 'green', width: 2 });
          s1.path(cache.b, { color: 'orange', width: 1.6 }); s1.path(cache.c, { color: 'purple', width: 1.6 }); s1.path(cache.a, { color: 'accent', width: 2.4 });
          s1.vline(n, { color: 'faint', dash: true });
          const r = np(n, p0, q, eps), fr = new Map(r.inc);
          const dens = [], hmax = { v: 0 };
          for (let k = 0; k <= n; k++) { const a = pw2(lbinPmf(n, k, p0)), b = pw2(lbinPmf(n, k, q)); dens.push([a, b]); hmax.v = Math.max(hmax.v, a, b); }
          s2.setView([0, 1], [0, hmax.v * 1.15]);
          let alpha = 0, beta = 0;
          for (let k = 0; k <= n; k++) {
            const f = fr.get(k) || 0, [a, b] = dens[k], x0 = (k - 0.5) / n, x1 = (k + 0.5) / n;
            alpha += a * (1 - f); beta += b * f;
            if (f > 0) s2.rect(x0, 0, x1, b * f, { fill: 'orange', fillAlpha: 0.6, stroke: false });
            if (f < 1) s2.rect(x0, 0, x1, a * (1 - f), { fill: 'red', fillAlpha: 0.6, stroke: false });
            s2.rect(x0, 0, x1, a, { color: 'accent', fill: 'accent', fillAlpha: 0.12, width: 1 });
            s2.rect(x0, 0, x1, b, { color: 'orange', width: 1 });
          }
          const acc = r.inc.map(([k]) => k), lo = Math.min(...acc), hi = Math.max(...acc);
          s2.text(`accept $H_0$ for k ${p0 > q ? '≥' : '≤'} ${p0 > q ? lo : hi}`, 0.5, hmax.v * 1.08, { align: 'center', size: 11.5, color: 'muted', weight: 600 });
          info = { D, n, alpha, beta, lb: r.lb, last: cache.a[cache.a.length - 1][1] };
        });
        v.readout(() => String.raw`$D(P\|Q)=${v.fix(info.D, 3)}$ bits. At $n=${info.n}$ the best test has false-alarm probability $\alpha_n=${v.fix(info.alpha, 3)}$ and miss probability $\beta_n=2^{${v.fix(info.lb, 1)}}$, giving $-\frac1n\log_2\beta_n=${v.fix(-info.lb / info.n, 3)}$; at $n=${NM}$ the exponent is $${v.fix(info.last, 3)}$.` + (info.D < 1e-9 ? String.raw` With $P=Q$ no test can do better than $\beta=1-\varepsilon$.` : ''));
      },
    },
    // ───────────────────────────────────────────────────────────── 3.11
    {
      num: '3.11',
      kind: 'Definition',
      name: 'Entropy rate of a stochastic process',
      statement: String.raw`For a stochastic process $\{X_i\}$ with values in a finite alphabet, the **entropy rate** is
$$H(\mathcal X)=\lim_{n\to\infty}\frac1nH(X_1,\dots,X_n)\qquad\text{(when the limit exists)},$$
the entropy per symbol; the companion quantity is $H'(\mathcal X)=\lim_{n\to\infty}H(X_n\mid X_{n-1},\dots,X_1)$, the entropy of a new symbol given the whole past. For a **stationary** process both limits exist and are equal: $H(X_n\mid X_{n-1},\dots,X_1)$ is non-increasing in $n$ (conditioning reduces entropy, 2.7), so it has a limit, and the Cesàro mean of a convergent sequence has the same limit by the chain rule (1.7). For an i.i.d. source the rate is $H(X_1)$.`,
      idea: String.raw`By the chain rule $H(X_1,\dots,X_n)=\sum_{t\le n}H(X_t\mid X^{t-1})$ (1.7), so $\frac1nH(X^n)$ is the running average of the conditional entropies. For a stationary process each term is at most the previous one (stationarity plus conditioning reduces entropy, 2.7), hence they converge, and their average converges to the same limit. The definition says: the rate is the amount of new randomness per symbol once the past is known. The picture shows both sequences for a Markov chain, including a start that is *not* stationary, where both still converge to a common value.`,
      caption: String.raw`A two-state Markov chain with flip probabilities $a=P(0\to1)$ and $b=P(1\to0)$ and an initial distribution of your choice. Left: $\frac1nH(X_1..X_n)$ (blue) and $H(X_n\mid X_{n-1}..X_1)$ (orange) against $n$, both computed exactly from the chain, converge to the green rate $\pi_0h(a)+\pi_1h(b)$. The blue curve approaches from the side of $H(X_1)$ with a $1/n$ error, the orange one much faster. Right: the distribution $P(X_t=1)$ approaching the stationary value. Choose $a+b=1$ for an i.i.d. source (rate $h(a)$ at once, if the start is $P(X_1=1)=a$).`,
      deps: ['info-1.7'],
      refs: ['Cover–Thomas §4.2'],
      tags: ['entropy rate', 'Markov chain'],
      credit: 'C. E. Shannon, 1948 (entropy per symbol of a source)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Entropy_rate' },
      viz(v) {
        const aS = v.slider('$a=P(0\\to1)$', 0.02, 0.98, 0.1, { step: 0.01 });
        const bS = v.slider('$b=P(1\\to0)$', 0.02, 0.98, 0.4, { step: 0.01 });
        const mS = v.slider('$P(X_1=1)$', 0, 1, 0.9, { step: 0.01 });
        const NM = 40;
        const s1 = v.stage({ x: [1, NM], y: [0, 1.05], height: 270, axes: 'box', gutter: true, xlabel: 'n', ylabel: 'bits', title: 'two ways to average the same quantity' });
        const s2 = v.stage({ x: [1, NM], y: [0, 1.05], height: 270, axes: 'box', gutter: true, xlabel: 't', ylabel: 'P(Xₜ = 1)', title: 'the chain forgets its start' });
        v.legend([['accent', '$\\frac1nH(X_1,\\dots,X_n)$'], ['orange', '$H(X_n\\mid X_{n-1},\\dots,X_1)$'], ['green', 'entropy rate'], ['purple', '$P(X_t=1)$']]);
        let info = {};
        v.render(() => {
          const a = aS.value, b = bS.value, m1 = mS.value, P = [[1 - a, a], [b, 1 - b]], pi = [b / (a + b), a / (a + b)], rate = pi[0] * h2(a) + pi[1] * h2(b);
          let mu = [1 - m1, m1]; const cond = [], avg = [], pr = []; let tot = 0;
          for (let t = 1; t <= NM; t++) {
            const c = t === 1 ? H(mu) : sum(mu.map((m, i) => m * H(P[i])));
            if (t > 1) mu = stepDist(mu, P);
            tot += c; cond.push([t, c]); avg.push([t, tot / t]); pr.push([t, mu[1]]);
          }
          // note: mu has been advanced one step beyond X_t for the *next* conditional; recompute P(X_t=1) cleanly for the right panel
          let nu = [1 - m1, m1]; const pt = []; for (let t = 1; t <= NM; t++) { pt.push([t, nu[1]]); nu = stepDist(nu, P); }
          s1.hline(rate, { color: 'green', width: 2 });
          s1.path(avg, { color: 'accent', width: 2.4 }); s1.path(cond, { color: 'orange', width: 2.4 });
          s2.hline(pi[1], { color: 'green', dash: true }); s2.path(pt, { color: 'purple', width: 2.4 });
          // brute-force check of the chain rule formula at n = 10
          const nb = 10; let Hb = 0;
          for (let s = 0; s < 1 << nb; s++) { let pp = s & 1 ? m1 : 1 - m1, prev = s & 1; for (let i = 1; i < nb; i++) { const x = (s >> i) & 1; pp *= P[prev][x]; prev = x; } if (pp > 0) Hb -= pp * log2(pp); }
          info = { rate, pi, a, b, h1: avg[nb - 1][1] * nb, Hb, last: avg[NM - 1][1], lastC: cond[NM - 1][1] };
        });
        v.readout(() => String.raw`Stationary law $\pi=(${v.fix(info.pi[0], 3)},${v.fix(info.pi[1], 3)})$, rate $\pi_0h(a)+\pi_1h(b)=${v.fix(info.rate, 4)}$ bits. At $n=${NM}$: $\frac1nH(X^n)=${v.fix(info.last, 4)}$, $H(X_n\mid\text{past})=${v.fix(info.lastC, 4)}$. Check of the chain-rule computation by enumerating all $2^{10}$ paths: $H(X_1..X_{10})=${v.fix(info.Hb, 5)}$ against $${v.fix(info.h1, 5)}$.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.12
    {
      num: '3.12',
      kind: 'Theorem',
      name: 'Entropy rate of a Markov chain',
      statement: String.raw`Let $\{X_i\}$ be a stationary Markov chain on a finite state space with transition matrix $P$ and stationary distribution $\mu$ ($\mu P=\mu$). Then its entropy rate is
$$H(\mathcal X)=H(X_2\mid X_1)=-\sum_{i,j}\mu_iP_{ij}\log_2P_{ij}=\sum_i\mu_i\,H(P_{i\cdot}),$$
the stationary average of the entropies of the rows. If $P$ is irreducible, $\mu$ is unique, and the same value is the limit of $\frac1nH(X_1,\dots,X_n)$ for *every* initial distribution.`,
      idea: String.raw`By the Markov property, $H(X_n\mid X_{n-1},\dots,X_1)=H(X_n\mid X_{n-1})$, which for a stationary chain equals $H(X_2\mid X_1)=\sum_i\mu_iH(P_{i\cdot})$. Since the process is stationary the limit of 3.11 equals this value. Starting elsewhere, the distribution of $X_t$ converges to $\mu$ for an irreducible aperiodic chain (stoch-4.1), so the conditional entropies converge to the same number. The formula is a weighted average of row entropies, with the weights $\mu_i$ saying how often the chain visits each row.`,
      caption: String.raw`Drag the bars of the three rows of $P$. The area panel draws each state as a bar of width $\mu_i$ and height $H(P_{i\cdot})$: the total area is the entropy rate. The last panel simulates one path of $20\,000$ steps (seeded; Resample for another) and shows the plug-in estimate $\sum_i\hat\mu_iH(\hat P_{i\cdot})$ built from the observed transition counts, settling on the exact value (green). Make a row deterministic and its state stops contributing.`,
      deps: ['info-3.11', 'stoch-4.1'],
      refs: ['Cover–Thomas §4.2'],
      tags: ['entropy rate', 'Markov chain'],
      scope: String.raw`Requires a stationary chain; with a unique stationary law (irreducible $P$) the rate does not depend on the initial distribution. Rows editable here may make the chain reducible; then $\mu$ is not unique and the displayed one is only one of the possibilities.`,
      viz(v) {
        const rows = [[0.7, 0.2, 0.1], [0.15, 0.6, 0.25], [0.3, 0.3, 0.4]];
        const cols = ['accent', 'orange', 'purple'];
        const eds = rows.map((r, i) => barEd(v, { title: `row $${i + 1}$ of $P$ (drag)`, p: [...r], color: cols[i], height: 190, labels: (j) => String(j + 1) }));
        const sA = v.stage({ x: [0, 1], y: [0, 1.7], height: 230, axes: 'box', gutter: true, xlabel: 'stationary mass μ', ylabel: 'H(row i) [bits]', title: 'area = entropy rate' });
        const NS = 20000;
        const sB = v.stage({ x: [20, NS], y: [0, 1.6], xlog: true, height: 230, axes: 'box', gutter: true, xlabel: 'path length t', ylabel: 'bits', title: 'estimate from one simulated path' });
        let seed = 1; v.button('Resample path', () => { seed++; });
        v.legend([['green', 'exact rate'], ['accent', 'plug-in estimate from the path']]);
        let cache = null, info = {};
        v.render(() => {
          eds.forEach((e) => e.draw());
          const P = eds.map((e) => e.p), mu = stationary(P), Hs = P.map((r) => H(r)), rate = markovRate(P, mu);
          let c = 0; mu.forEach((m, i) => { sA.rect(c, 0, c + m, Hs[i], { fill: cols[i], fillAlpha: 0.45, color: cols[i], width: 1.6 }); sA.text(`state ${i + 1}`, c + m / 2, Hs[i] / 2, { align: 'center', size: 11, color: 'ink', weight: 600 }); c += m; });
          const key = P.map((r) => r.map((x) => x.toFixed(3)).join(',')).join('|') + '|' + seed;
          if (!cache || cache.key !== key) {
            const rng = v.rng(hashStr(key)), cnt = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], pts = []; let x = pick(mu, rng()), nxt = 30;
            for (let t = 1; t <= NS; t++) {
              const y = pick(P[x], rng()); cnt[x][y]++; x = y;
              if (t >= nxt || t === NS) { const tot = sum(cnt.map((r) => sum(r))); let est = 0; for (const r of cnt) { const rs = sum(r); if (rs) est += (rs / tot) * H(r); } pts.push([t, est]); nxt = Math.ceil(t * 1.12); }
            }
            cache = { key, pts };
          }
          sA.hline(0, { color: 'faint' });
          sB.hline(rate, { color: 'green', width: 2 }); sB.path(cache.pts, { color: 'accent', width: 2.2 });
          info = { mu, Hs, rate, est: cache.pts[cache.pts.length - 1][1], uniq: P.every((r) => r.every((q) => q > 0.02)) };
        });
        v.readout(() => String.raw`$\mu=(${info.mu.map((m) => v.fix(m, 3)).join(',\\ ')})$ and row entropies $(${info.Hs.map((m) => v.fix(m, 3)).join(',\\ ')})$ give the rate $\sum_i\mu_iH(P_{i\cdot})=${v.fix(info.rate, 4)}$ bits per step. The simulated path of $${commas(NS)}$ steps estimates $${v.fix(info.est, 4)}$.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.13
    {
      num: '3.13',
      kind: 'Theorem',
      name: 'Entropy rate of a random walk on a graph',
      statement: String.raw`Let $G$ be a connected, undirected graph with $m$ edges and vertex degrees $d_1,\dots,d_N$, and let $\{X_i\}$ be the simple random walk on $G$: from a vertex the walk moves to a uniformly chosen neighbour. Its stationary distribution is $\mu_i=d_i/2m$, and its entropy rate is
$$H(\mathcal X)=\sum_i\frac{d_i}{2m}\log_2d_i=\log_2(2m)-H\Big(\frac{d_1}{2m},\dots,\frac{d_N}{2m}\Big).$$
For a $d$-regular graph this is $\log_2d$. (For a graph with several components the rate depends on the component the walk starts in; it is $0$ if the walk is stuck on an isolated vertex.)`,
      idea: String.raw`The walk is a Markov chain with $P_{ij}=1/d_i$ on edges, and $\mu_iP_{ij}=\frac{d_i}{2m}\frac1{d_i}=\frac1{2m}=\mu_jP_{ji}$, so $\mu$ is stationary (detailed balance; stoch-4.1). The rate formula of 3.12 gives $\sum_i\mu_iH(P_{i\cdot})=\sum_i\mu_i\log_2d_i$ because each row is uniform on $d_i$ neighbours. The second form uses $\sum_i\frac{d_i}{2m}\log\frac{d_i}{2m}=\sum\mu_i\log d_i-\log2m$. High-degree hubs are visited often and offer many choices; so a hub-rich graph has a higher rate than a path.`,
      caption: String.raw`Edit the graph: click empty space to add a vertex, click one vertex and then another to add (or remove) an edge, Alt-click to delete, drag to move. Vertex colour and the note beside it give $\mu_i=d_i/2m$. The right panel compares the simulated visit frequencies of a 4000-step walk (blue) with $\mu$ (green rings); the readout compares the exact rate with the average of $\log_2d$ along the path, and with the same rate obtained from the general Markov formula. Try the complete graph (rate $\log_2(N-1)$) or a path (small rate).`,
      deps: ['info-3.12'],
      refs: ['Cover–Thomas §4.3'],
      tags: ['entropy rate', 'random walk'],
      viz(v) {
        const s = v.stage({ x: [0, 10], y: [0, 6], axes: false, equal: true, height: 330, title: 'the graph (edit it)' });
        const nodes = [[1, 3], [2.7, 5], [2.7, 1], [4.8, 3], [7, 5], [7, 1], [9, 3]].map(([x, y], i) => ({ id: i, x, y, label: String(i + 1) }));
        const edges = [[0, 1], [0, 2], [1, 2], [1, 3], [2, 3], [3, 4], [3, 5], [4, 5], [4, 6], [5, 6]];
        const G = v.graph(s, { nodes, edges, layout: 'none', editable: true, r: 15 });
        const s2 = v.stage({ x: [-0.6, 7.6], y: [0, 1], height: 330, axes: 'box', gutter: true, xlabel: 'vertex', ylabel: 'frequency', title: 'visits of a 4000-step walk vs $d_i/2m$' });
        let seed = 1; v.button('New walk', () => { seed++; });
        v.legend([['accent', 'visit frequency', { area: true }], ['green', '$d_i/2m$', { dot: true }]]);
        let info = {}, rev = 0; G.onChange = () => { rev++; };
        v.render(() => {
          const ids = G.nodes.map((n) => n.id), deg = ids.map((id) => G.neighbors(id).length), m2 = sum(deg);
          // component of the first vertex
          const start = ids[0], comp = new Set([start]), stack = [start];
          while (stack.length) { const u = stack.pop(); for (const w of G.neighbors(u)) { const id = w.id ?? w; if (!comp.has(id)) { comp.add(id); stack.push(id); } } }
          const cd = ids.map((id, i) => (comp.has(id) ? deg[i] : 0)), cm2 = sum(cd), mu = cd.map((d) => (cm2 ? d / cm2 : 0));
          const rate = cm2 ? sum(cd.map((d, i) => mu[i] * (d ? log2(d) : 0))) : 0;
          // the same rate from the generic Markov formula
          const idx = new Map(ids.map((id, i) => [id, i])), Pm = ids.map((id, i) => { const nb = G.neighbors(id).map((w) => idx.get(w.id ?? w)); const row = new Array(ids.length).fill(0); nb.forEach((j) => { row[j] += 1 / nb.length; }); if (!nb.length) row[i] = 1; return row; });
          // simulate
          const rng = v.rng(hashStr(`${rev}|${seed}|${ids.length}`)), N = 4000, vis = new Array(ids.length).fill(0); let x = 0, lsum = 0;
          for (let t = 0; t < N; t++) { const nb = G.neighbors(ids[x]).map((w) => idx.get(w.id ?? w)); if (!nb.length) break; lsum += log2(nb.length); x = nb[Math.floor(rng() * nb.length)]; vis[x]++; }
          const tv = sum(vis) || 1;
          const mx = Math.max(0.2, ...mu, ...vis.map((c) => c / tv)) * 1.2;
          s2.setView([-0.6, ids.length - 0.4], [0, mx]); s2.setTicks(ids.map((id, i) => [i, G.lab ? String(G.lab(id)) : String(id)]), null);
          vis.forEach((c, i) => { s2.rect(i - 0.3, 0, i + 0.3, c / tv, { fill: 'accent', fillAlpha: 0.45, color: 'accent', width: 1.3 }); s2.dot(i, mu[i], { r: 5, hollow: true, color: 'green' }); });
          const tmax = Math.max(1, ...mu);
          G.draw({ nodeFill: (id) => v.ramp(0.15 + 0.7 * (mu[idx.get(id)] / tmax), 'accent'), nodeNote: (id) => (comp.has(id) ? v.fix(mu[idx.get(id)], 2) : null) });
          let stat = null; if (cm2 && comp.size > 1) { const sub = [...comp].map((id) => idx.get(id)); const Ps = sub.map((i) => sub.map((j) => Pm[i][j])); const pi = stationary(Ps); stat = markovRate(Ps, pi); }
          info = { rate, est: lsum / N, stat, N: ids.length, m: m2 / 2, regular: cd.filter((d) => d).every((d) => d === cd.find((q) => q)), comp: comp.size, full: comp.size === ids.length, ub: cm2 ? log2(Math.max(...cd)) : 0 };
        });
        v.readout(() => String.raw`$N=${info.N}$ vertices, $m=${info.m}$ edges` + (info.full ? '' : String.raw` (not connected: the walk starts in vertex 1's component of ${info.comp} vertices)`) + String.raw`. Entropy rate $\sum_i\frac{d_i}{2m}\log_2d_i=${v.fix(info.rate, 4)}$ bits per step` + (info.stat != null ? String.raw`, equal to the general Markov formula $\sum\mu_iH(P_{i\cdot})=${v.fix(info.stat, 4)}$` : '') + String.raw`. The walk's average of $\log_2d_{X_t}$ over 4000 steps is $${v.fix(info.est, 3)}$; the upper bound $\log_2d_{\max}$ is $${v.fix(info.ub, 3)}$` + (info.regular && info.rate > 0 ? ', attained because the graph is regular.' : '.'));
      },
    },
    // ───────────────────────────────────────────────────────────── 3.14
    {
      num: '3.14',
      kind: 'Theorem',
      name: 'Second law: divergence to equilibrium decreases',
      statement: String.raw`Let $\mu_n$ and $\mu_n'$ be the distributions at time $n$ of the same Markov chain (same transition matrix $P$) started from two different initial distributions. Then
$$D(\mu_{n+1}\|\mu'_{n+1})\ \le\ D(\mu_n\|\mu'_n),$$
so relative entropy between the two never increases. In particular, if $\mu'=\pi$ is a stationary distribution, then $D(\mu_n\|\pi)$ decreases monotonically (to $0$ when the chain is irreducible and aperiodic). The entropy $H(\mu_n)$ need *not* increase: if the stationary distribution is uniform, $D(\mu_n\|\pi)=\log|\mathcal X|-H(\mu_n)$ and $H(\mu_n)$ does increase, but for a non-uniform $\pi$ it can go down.`,
      idea: String.raw`Both $\mu_{n+1}$ and $\mu'_{n+1}$ are obtained from $\mu_n,\mu'_n$ by passing through the same channel $P$. The data-processing inequality for relative entropy (2.10) says that applying the same channel to both arguments cannot increase their divergence. Stationarity of $\pi$ means $\pi_n\equiv\pi$, which gives the second statement. For doubly stochastic $P$ the uniform law is stationary, and $D(\mu\|\text{uniform})=\log|\mathcal X|-H(\mu)$ turns the monotone fall of $D$ into the rise of entropy, which is the thermodynamic second law; for a general $\pi$ the monotone quantity is the divergence, not the entropy.`,
      caption: String.raw`Drag the starting distribution $\mu_0$ (blue) and, in "free" mode, a second start $\nu_0$ (orange) on the simplex; the dots trace how they move under the chain. The plot shows $D(\mu_n\|\nu_n)$ (blue), which falls at every step, and $H(\mu_n)$ (green). Pick the "uniform stationary law" chain and the entropy climbs; in the "biased" chain, $\pi$ is not uniform, and starting from the centre (the maximum-entropy distribution) $H(\mu_n)$ falls while $D$ still decreases. The laziness slider mixes in the identity and slows everything down.`,
      deps: ['info-3.12', 'info-2.10'],
      refs: ['Cover–Thomas §4.4'],
      tags: ['second law', 'Markov chain'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Markov_chain' },
      viz(v) {
        const PRE = {
          unif: [[0.6, 0.3, 0.1], [0.1, 0.6, 0.3], [0.3, 0.1, 0.6]],
          biased: [[0.5, 0.3, 0.2], [0.1, 0.8, 0.1], [0.2, 0.2, 0.6]],
          slow: [[0.9, 0.08, 0.02], [0.05, 0.9, 0.05], [0.02, 0.08, 0.9]],
        };
        const sel = v.select('chain', [{ value: 'unif', label: 'uniform stationary law' }, { value: 'biased', label: 'biased' }, { value: 'slow', label: 'nearly decoupled' }], 'biased');
        const modeS = v.select('reference $\\nu_0$', [{ value: 'pi', label: 'stationary $\\pi$' }, { value: 'free', label: 'free (second start)' }], 'pi');
        const lazy = v.slider('laziness $\\lambda$', 0, 0.9, 0, { step: 0.01 });
        const sim = simStage(v, { height: 300, title: 'the two distributions moving under $P$' });
        const h1 = simHandle(sim, [0.36, 0.32, 0.32], { color: 'accent', label: 'μ₀' });
        const h2h = simHandle(sim, [0.15, 0.7, 0.15], { color: 'orange', label: 'ν₀' });
        const NS = 30;
        const s = v.stage({ x: [0, NS], y: [0, 1.7], height: 300, axes: 'box', gutter: true, xlabel: 'n', ylabel: 'bits', title: '$D(\\mu_n\\|\\nu_n)$ and $H(\\mu_n)$' });
        v.legend([['accent', '$D(\\mu_n\\|\\nu_n)$'], ['green', '$H(\\mu_n)$'], ['red', '$\\log_23-H(\\mu_n)$ (equals $D$ iff $\\pi$ uniform)', { dash: true }]]);
        let info = {};
        v.render(() => {
          const base = PRE[sel.value], P = base.map((r, i) => r.map((x, j) => (1 - lazy.value) * x + (i === j ? lazy.value : 0)));
          const pi = stationary(P), free = modeS.value === 'free'; h2h.visible = free;
          drawSimplex(sim, { k: 4 });
          let mu = h1.P(), nu = free ? h2h.P() : pi; const Ds = [], Hs = []; let dmax = 0, mono = true, prev = null;
          const pm = [], pn = [];
          for (let n = 0; n <= NS; n++) {
            const D = KL(mu, nu); Ds.push([n, D]); Hs.push([n, H(mu)]);
            if (prev !== null && D > prev + 1e-12) mono = false; prev = D; dmax = Math.max(dmax, D);
            if (n <= 12) { pm.push(simXY(mu)); pn.push(simXY(nu)); }
            mu = stepDist(mu, P); nu = free ? stepDist(nu, P) : nu;
          }
          sim.path(pm, { color: 'accent', width: 1.4, alpha: 0.7 }); sim.dots(pm, { r: 3, color: 'accent' });
          if (free) { sim.path(pn, { color: 'orange', width: 1.4, alpha: 0.7 }); sim.dots(pn, { r: 3, color: 'orange' }); }
          sim.dot(...simXY(pi), { r: 6, color: 'green', label: 'π', labelPos: 'ne' });
          s.hline(Math.log2(3), { color: 'faint', dash: true });
          s.path(Hs.map(([n, h]) => [n, h]), { color: 'green', width: 2.2 });
          if (!free) s.path(Hs.map(([n, h]) => [n, log2(3) - h]), { color: 'red', width: 1.6, dash: true });
          s.path(Ds, { color: 'accent', width: 2.6 });
          const uni = pi.every((x) => Math.abs(x - 1 / 3) < 1e-6);
          info = { mono, d0: Ds[0][1], dN: Ds[NS][1], h0: Hs[0][1], hN: Hs[NS][1], hmax: Math.max(...Hs.map((x) => x[1])), pi, uni, free };
        });
        v.readout(() => String.raw`$D$ decreases at every one of the ${NS} steps: **${info.mono ? 'yes' : 'no (!)'}** ($D$ goes from $${v.fix(info.d0, 3)}$ to $${v.fix(info.dN, 4)}$). $H(\mu_n)$ goes from $${v.fix(info.h0, 3)}$ to $${v.fix(info.hN, 3)}$` + (info.free ? '' : String.raw`, and $H(\pi)=${v.fix(H(info.pi), 3)}$`) + (info.uni ? String.raw`: $\pi$ is uniform, so $D=\log_23-H$ and the entropy rises as $D$ falls.` : (info.hN < info.h0 - 1e-9 ? String.raw`: here the entropy *fell*, because $\pi$ is not uniform.` : '.')));
      },
    },
    // ───────────────────────────────────────────────────────────── 3.15
    {
      num: '3.15',
      kind: 'Theorem',
      name: 'Shannon–McMillan–Breiman theorem',
      statement: String.raw`Let $\{X_i\}$ be a stationary **ergodic** process with values in a finite alphabet and entropy rate $H(\mathcal X)$. Then, with probability $1$,
$$-\frac1n\log_2p(X_1,\dots,X_n)\ \longrightarrow\ H(\mathcal X).$$
So the AEP (3.1) holds for the whole class of stationary ergodic sources, in the sense of almost-sure convergence along a single realisation. For a stationary process that is *not* ergodic the limit still exists but is a random variable: it is the entropy rate of the ergodic component that the realisation belongs to.`,
      idea: String.raw`For a Markov chain the proof is the ergodic theorem: $-\log p(X^n)=-\log\mu(X_1)-\sum_{t}\log P_{X_tX_{t+1}}$ is an additive functional of the chain, whose time average converges to the stationary expectation $\sum_{ij}\mu_iP_{ij}\log\frac1{P_{ij}}=H(X_2\mid X_1)$ (3.12). The general theorem replaces this by a sandwich argument: approximate the process by $k$-th-order Markov chains, whose log-likelihoods converge by the ergodic theorem, and show the true log-likelihood stays between those approximations (Breiman 1957, building on McMillan's 1953 proof of convergence in $L^1$). Ergodicity is what makes the limit non-random.`,
      caption: String.raw`Left: $-\frac1n\log_2p(x^n)$ along ten simulated realisations (thin lines) against the green entropy rate; the fan of paths narrows like $1/\sqrt n$. Right: all 300 realisations at the chosen $n$, as a histogram. Switch the source to the **mixture** of two coins, which is stationary but not ergodic (a hidden fair coin picks one of two biases $a,b$ for the whole sequence): the paths no longer agree, each converging to its own component's entropy ($h(a)$ or $h(b)$), and the histogram stays two-humped however large $n$ gets.`,
      deps: ['info-3.11', 'info-3.1'],
      refs: ['Cover–Thomas §16.8'],
      tags: ['AEP', 'ergodic theory'],
      credit: 'C. E. Shannon, 1948 (Markov sources); B. McMillan, 1953 (convergence in L¹, Ann. Math. Stat. 24, 196–219); L. Breiman, 1957 (almost sure, Ann. Math. Stat. 28, 809–811; correction 1960)',
      scope: String.raw`Stationary ergodic sources with a finite alphabet. The almost-sure statement fails to give a single constant for non-ergodic stationary sources.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Asymptotic_equipartition_property' },
      viz(v) {
        const src = v.select('source', [{ value: 'markov', label: 'ergodic Markov chain' }, { value: 'mix', label: 'mixture of two coins (not ergodic)' }], 'markov');
        const aS = v.slider('$a$ (chain: $P(0\\to1)$; mixture: bias of coin 1)', 0.02, 0.98, 0.1, { step: 0.01 });
        const bS = v.slider('$b$ (chain: $P(1\\to0)$; mixture: bias of coin 2)', 0.02, 0.98, 0.5, { step: 0.01 });
        const nS = v.slider('length $n$ (right panel)', 20, 3000, 600, { log: true, int: true });
        let seed = 1; v.button('Resample', () => { seed++; });
        const NM = 3000, NP = 300, NC = 70;
        const s1 = v.stage({ x: [20, NM], y: [0, 1.4], xlog: true, height: 290, axes: 'box', gutter: true, xlabel: 'n', ylabel: '−(1/n) log₂ p(Xⁿ)', title: 'ten realisations' });
        const s2 = v.stage({ x: [0, 1.4], y: [0, 1], height: 290, axes: 'box', gutter: true, xlabel: '−(1/n) log₂ p(Xⁿ)', ylabel: 'fraction of 300 realisations', title: 'all realisations at length $n$' });
        v.legend([['green', 'entropy rate (mixture: both rates)'], ['accent', 'one realisation']]);
        const ts = []; for (let i = 0; i < NC; i++) { const t = Math.round(20 * Math.pow(NM / 20, i / (NC - 1))); if (!ts.length || ts[ts.length - 1] !== t) ts.push(t); }
        let cache = null, info = {};
        v.render(() => {
          const mode = src.value, a = aS.value, b = bS.value, n = nS.value, key = `${mode}|${a}|${b}|${seed}`;
          if (!cache || cache.key !== key) {
            const rng = v.rng(hashStr(key)), paths = [], pi1 = a / (a + b);
            for (let r = 0; r < NP; r++) {
              const val = new Float64Array(ts.length); let k = 0;
              if (mode === 'markov') {
                let x = rng() < pi1 ? 1 : 0, lp = -log2(x ? pi1 : 1 - pi1);
                for (let t = 1; t <= NM; t++) {
                  if (t === ts[k]) val[k++] = lp / t;
                  if (t < NM) { const flip = x ? b : a, y = rng() < flip ? 1 - x : x; lp -= log2(y === x ? 1 - flip : flip); x = y; }
                }
              } else {
                let s1c = 0, s2c = 0; const c = rng() < 0.5 ? a : b;
                for (let t = 1; t <= NM; t++) {
                  const x = rng() < c ? 1 : 0; s1c += log2(x ? a : 1 - a); s2c += log2(x ? b : 1 - b);
                  if (t === ts[k]) val[k++] = -(lse2([s1c, s2c]) - 1) / t;
                }
              }
              paths.push(val);
            }
            cache = { key, paths };
          }
          const rates = mode === 'markov' ? [(b / (a + b)) * h2(a) + (a / (a + b)) * h2(b)] : [h2(a), h2(b)];
          rates.forEach((r) => s1.hline(r, { color: 'green', width: 2 }));
          for (let r = 0; r < 10; r++) s1.path(ts.map((t, i) => [t, cache.paths[r][i]]), { color: 'accent', width: 1.4, alpha: 0.75 });
          s1.vline(n, { color: 'faint', dash: true });
          let ni = 0; for (let i = 0; i < ts.length; i++) if (Math.abs(ts[i] - n) < Math.abs(ts[ni] - n)) ni = i;
          const vals = cache.paths.map((p) => p[ni]), NB = 56, cnt = new Array(NB).fill(0), bw = 1.4 / NB;
          vals.forEach((x) => { cnt[Math.min(NB - 1, Math.max(0, Math.floor(x / bw)))]++; });
          s2.setView([0, 1.4], [0, Math.max(0.1, Math.max(...cnt) / NP * 1.2)]);
          cnt.forEach((c, i) => { if (c) s2.rect(i * bw, 0, (i + 1) * bw, c / NP, { fill: 'accent', fillAlpha: 0.5, color: 'accent', width: 1 }); });
          rates.forEach((r) => s2.vline(r, { color: 'green', width: 2 }));
          const tol = 0.06, near = vals.filter((x) => rates.some((r) => Math.abs(x - r) <= tol)).length, near0 = vals.filter((x) => Math.abs(x - rates[0]) <= tol).length;
          const mean = sum(vals) / NP, sd = Math.sqrt(sum(vals.map((x) => (x - mean) ** 2)) / NP);
          info = { mode, rates, n: ts[ni], mean, sd, near, near0 };
        });
        v.readout(() => (info.mode === 'markov'
          ? String.raw`Entropy rate $\pi_0h(a)+\pi_1h(b)=${v.fix(info.rates[0], 4)}$. At $n=${info.n}$ the 300 realisations have mean $${v.fix(info.mean, 3)}$ and standard deviation $${v.fix(info.sd, 3)}$; $${info.near0}$ of them are within $0.06$ of the rate.`
          : String.raw`The two components have rates $h(a)=${v.fix(info.rates[0], 3)}$ and $h(b)=${v.fix(info.rates[1], 3)}$. At $n=${info.n}$ the realisations have mean $${v.fix(info.mean, 3)}$ but standard deviation $${v.fix(info.sd, 3)}$ that does *not* shrink with $n$: each path converges to one of the two rates ($${info.near}$ of 300 are within $0.06$ of one of them), not to their average.`));
      },
    },
  ],
};
