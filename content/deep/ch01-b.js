// Deep Learning Theory — Chapter 1: Neural networks as functions (items 1.6–1.10; 1.1–1.5 in ch01.js)
import {
  clamp, sigm, softplus, makeNet, forward, patternKey, rand, hashStr, memo, rampLUT, regionColors, note, titler, mnus, softmax, tsci,
} from './ch01.shared.js';

/** Squared distance helper and a log-spaced integer grid. */
const logGrid = (a, b, n) => Array.from({ length: n }, (_, i) => Math.round(a * (b / a) ** (i / (n - 1))));

export default {
  collection: 'deep',
  chapter: 1,
  items: [
    // ───────────────────────────────────────────────────────────── 1.6
    {
      num: '1.6',
      kind: 'Concept',
      name: 'ReLU networks are continuous piecewise-linear maps',
      statement: String.raw`Every feed-forward network with ReLU (or any piecewise-linear) activations computes a **continuous piecewise-linear** function $f:\R^d\to\R^k$: the input space is partitioned into finitely many convex polyhedra — the **linear regions** — on each of which $f$ is affine. Each region is the set of inputs sharing one **activation pattern** (which hidden units are positive): for a fixed pattern every layer acts as a fixed affine map, so the pre-activations are affine in $x$ and the pattern's region is an intersection of half-spaces. Conversely, every continuous piecewise-linear function on $\R^d$ is computed by some ReLU network, of depth at most $\lceil\log_2(d+1)\rceil+1$ (Arora, Basu, Mianjy & Mukherjee 2018).`,
      idea: String.raw`Induct over the layers. If the pre-activations of layer $\ell$ are affine on a convex region, each unit's sign splits that region along one hyperplane, and inside each piece $\mathrm{ReLU}$ is either the identity or zero, so layer $\ell+1$'s pre-activations are again affine on every piece. The pieces after the last layer are exactly the activation-pattern regions, and $f$ is affine on each; continuity holds because ReLU and affine maps are continuous. Along any straight line the network is therefore a 1D piecewise-linear function whose kinks sit where the line crosses region boundaries, and the slopes jump only there. How many regions there can be is the subject of 2.7.`,
      caption: String.raw`Left: a random ReLU network with two inputs (seeded weights); every linear region is a different colour and boundaries are dark. Change the width and depth and the region count updates live. Drag the two gold handles to place a segment; right: the network's output along it, coloured by the regions it passes through — straight on each region, kinked exactly at the boundaries. The readout gives the affine formula on the region under handle $A$.`,
      deps: ['deep-1.5'],
      refs: ['Prince §4.2', 'Prince §3.3'],
      tags: ['piecewise linear', 'linear regions'],
      viz(v) {
        const wS = v.slider('width', 2, 12, 6, { int: true });
        const dS = v.slider('hidden layers', 1, 4, 2, { int: true });
        let seed = 1; v.button('new random network', () => { seed++; });
        const sL = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, height: 360, axes: 'box', gutter: true, xlabel: '$x_1$', ylabel: '$x_2$', title: 'linear regions of the network' });
        const sR = v.stage({ x: [0, 1], y: [-1, 1], height: 360, axes: 'box', gutter: true, xlabel: 'position $t$ along the segment $A\\to B$', title: 'output $f$ along the segment' });
        const A = sL.handle(-1.6, -1.1, { color: 'gold', label: 'A', labelPos: 'sw' }), B = sL.handle(1.6, 1.3, { color: 'gold', label: 'B', labelPos: 'ne' });
        const nets = memo(), counts = memo();
        let info = null;
        v.render(() => {
          const W = wS.value, D = dS.value, key = [W, D, seed].join('|');
          const net = nets(key, () => makeNet([2, ...Array(D).fill(W), 1], { act: 'relu', seed: hashStr('cpwl' + key), bias: 0.6 }));
          const cols = regionColors(v), ink = v.rgb('ink');
          const colOf = (k) => cols[hashStr(k) % cols.length];
          const e = 2.2 / sL.scale, bx = sL.bounds.x, by = sL.bounds.y;
          sL.raster((x, y) => {
            const k = patternKey(net, [x, y]);
            if (patternKey(net, [x + e, y]) !== k || patternKey(net, [x, y + e]) !== k) return [ink[0], ink[1], ink[2], 200];
            return colOf(k);
          }, { res: 3, key });
          const nReg = counts(key + '|' + bx + by, () => { const S = new Set(); const N = 320; for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) S.add(patternKey(net, [bx[0] + ((bx[1] - bx[0]) * (i + 0.5)) / N, by[0] + ((by[1] - by[0]) * (j + 0.5)) / N])); return S.size; });
          sL.line(A.x, A.y, B.x, B.y, { color: 'gold', width: 2.6 });
          // the slice
          const N = 1500, pts = [], ks = [];
          for (let i = 0; i <= N; i++) { const t = i / N, x = [A.x + t * (B.x - A.x), A.y + t * (B.y - A.y)]; ks.push(patternKey(net, x)); pts.push([t, forward(net, x)[0]]); }
          let lo = Infinity, hi = -Infinity; for (const p of pts) { lo = Math.min(lo, p[1]); hi = Math.max(hi, p[1]); }
          const pad = 0.1 * (hi - lo || 1); sR.setView([0, 1], [lo - pad, hi + pad]);
          let start = 0, pieces = 0;
          for (let i = 1; i <= N; i++) if (i === N || ks[i] !== ks[start]) {
            const c = colOf(ks[start]);
            sR.vband(pts[start][0], pts[i][0], { color: c, alpha: 0.8 });
            sR.path(pts.slice(start, i + 1), { color: 'ink', width: 2.6 });
            if (i < N) { sR.vline(pts[i][0], { color: 'ink', width: 0.8, alpha: 0.5 }); }
            pieces++; start = i;
          }
          // affine map on A's region
          const f0 = forward(net, [A.x, A.y])[0], h = 1e-6, gx = (forward(net, [A.x + h, A.y])[0] - f0) / h, gy = (forward(net, [A.x, A.y + h])[0] - f0) / h;
          info = { nReg, pieces, gx, gy, c: f0 - gx * A.x - gy * A.y, units: W * D };
        });
        v.legend([['gold', 'segment $A\\to B$'], ['ink', 'region boundaries / kinks']]);
        v.readout(() => info && String.raw`**${info.nReg} linear regions** meet the window (${info.units} hidden ReLU units; counted as distinct activation patterns on a $320\times320$ grid) · the segment crosses ${info.pieces} regions, so $f$ along it has **${info.pieces} linear pieces** · on $A$'s region: $f(x)=${mnus(info.gx.toFixed(3))}\,x_1${info.gy >= 0 ? '+' : ''}${mnus(info.gy.toFixed(3))}\,x_2${info.c >= 0 ? '+' : ''}${mnus(info.c.toFixed(3))}$`);
      },
    },
    // ───────────────────────────────────────────────────────────── 1.7
    {
      num: '1.7',
      kind: 'Concept',
      name: 'Empirical risk minimization',
      statement: String.raw`Let data $(X,Y)$ have an unknown distribution $P$, let $\{f_\theta:\theta\in\Theta\}$ be a model and $\ell$ a loss. The **risk** (population loss) is $R(\theta)=\mathbb E_P\,\ell(f_\theta(X),Y)$. Given a training sample $(x_1,y_1),\dots,(x_n,y_n)$ drawn i.i.d. from $P$, **empirical risk minimization** picks
$$\hat\theta_n\in\arg\min_\theta \hat R_n(\theta),\qquad \hat R_n(\theta)=\frac1n\sum_{i=1}^n\ell\bigl(f_\theta(x_i),y_i\bigr),$$
the plug-in estimate of the risk with $P$ replaced by the empirical distribution. Its **excess risk** satisfies $R(\hat\theta_n)-\inf_\theta R(\theta)\le 2\sup_\theta|\hat R_n(\theta)-R(\theta)|$, so ERM is consistent whenever the empirical risk converges to the risk *uniformly* over the model. Training a neural network is (approximate) ERM, usually with a differentiable surrogate loss and gradient methods.`,
      idea: String.raw`For each fixed $\theta$, $\hat R_n(\theta)\to R(\theta)$ by the law of large numbers — this is the plug-in principle (stat-1.7). But $\hat\theta_n$ is chosen *after* seeing the data, so pointwise convergence is not enough: write $R(\hat\theta_n)-R(\theta^*)=[R(\hat\theta_n)-\hat R_n(\hat\theta_n)]+[\hat R_n(\hat\theta_n)-\hat R_n(\theta^*)]+[\hat R_n(\theta^*)-R(\theta^*)]$; the middle term is $\le0$ by definition of $\hat\theta_n$ and the other two are bounded by the uniform deviation. For threshold classifiers the uniform deviation is a Kolmogorov–Smirnov-type quantity of order $1/\sqrt n$, and much of learning theory is about bounding it for richer models.`,
      caption: String.raw`A threshold rule $\hat y=\mathbf 1\{x>\theta\}$ with 0–1 loss, on data with $P(Y=1\mid x)=\sigma(2.5(x-0.5))$ (left, the curve). Middle: the empirical risk $\hat R_n$ (a staircase, blue) and the exact risk $R$ (green); their minimizers $\hat\theta_n$ and $\theta^*=0.5$ differ. Raise $n$ or press *resample*. Bottom: over 100 seeded training sets at each size, the average excess risk $R(\hat\theta_n)-R(\theta^*)$ and the average uniform deviation $\sup_\theta|\hat R_n-R|$, on log scales, with $1/\sqrt n$ for reference.`,
      deps: ['stat-1.7'],
      refs: ['Goodfellow §8.1', 'Prince §2.1'],
      tags: ['risk', 'ERM'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Empirical_risk_minimization' },
      viz(v) {
        const nS = v.slider('training-set size $n$', 5, 2000, 40, { log: true, int: true });
        let seed = 1; v.button('resample', () => { seed++; });
        const K = 2.5, C = 0.5, eta = (x) => sigm(K * (x - C)), Ieta = (x) => softplus(K * (x - C)) / K;
        // exact risk of 1{x > θ} with x ~ U[−3, 3]
        const R = (t) => { t = clamp(t, -3, 3); return ((Ieta(t) - Ieta(-3)) + ((3 - t) - (Ieta(3) - Ieta(t)))) / 6; };
        const Rstar = R(C);
        const sample = (n, r) => { const xs = [], ys = []; for (let i = 0; i < n; i++) { const x = r.uniform(-3, 3); xs.push(x); ys.push(r() < eta(x) ? 1 : 0); } return { xs, ys }; };
        /** ERM threshold and the uniform deviation for one sample. */
        const erm = ({ xs, ys }) => {
          const n = xs.length, idx = xs.map((_, i) => i).sort((a, b) => xs[a] - xs[b]);
          let err = ys.reduce((s, y) => s + y, 0); // θ below all points: predict 1 everywhere → errors = #zeros… recompute
          err = ys.reduce((s, y) => s + (1 - y), 0);
          let best = err, bi = -1, dev = Math.abs(err / n - R(-3)); const steps = [[-3, err / n]];
          for (let k = 0; k < n; k++) {
            const i = idx[k], x = xs[i];
            dev = Math.max(dev, Math.abs(err / n - R(x)));
            err += ys[i] ? 1 : -1; // x now predicted 0
            dev = Math.max(dev, Math.abs(err / n - R(x)));
            steps.push([x, err / n]);
            if (err < best) { best = err; bi = k; }
          }
          dev = Math.max(dev, Math.abs(err / n - R(3)));
          const lo = bi < 0 ? -3 : xs[idx[bi]], hi = bi + 1 < n ? xs[idx[bi + 1]] : 3;
          return { th: (lo + hi) / 2, emp: best / n, dev, steps };
        };
        const NS = logGrid(10, 2000, 9), curves = memo();
        const sweep = () => curves('c', () => NS.map((n) => { let ex = 0, dv = 0; for (let rep = 0; rep < 100; rep++) { const r = rand(hashStr('erm|' + n + '|' + rep)), e = erm(sample(n, r)); ex += R(e.th) - Rstar; dv += e.dev; } return [n, ex / 100, dv / 100]; }));
        const sD = v.stage({ x: [-3, 3], y: [-0.15, 1.15], height: 250, axes: 'box', gutter: true, xlabel: '$x$', title: 'training data and $P(Y=1\\mid x)$' });
        const sE = v.stage({ x: [-3, 3], y: [0, 0.7], height: 250, axes: 'box', gutter: true, xlabel: 'threshold $\\theta$', title: 'empirical risk $\\hat R_n(\\theta)$ and risk $R(\\theta)$' });
        const sC = v.stage({ x: [8, 2500], y: [1e-4, 0.5], xlog: true, ylog: true, height: 230, full: true, axes: 'box', gutter: true, xlabel: '$n$', title: 'average over 100 training sets' });
        let info = null;
        v.render(() => {
          const n = nS.value, r = rand(hashStr('ermS|' + n + '|' + seed)), d = sample(n, r), e = erm(d);
          sD.fn(eta, { color: 'muted', width: 2 });
          const jr = rand(3);
          d.xs.forEach((x, i) => sD.dot(x, d.ys[i] + (jr() - 0.5) * 0.12, { r: n > 400 ? 1.6 : 3.2, color: d.ys[i] ? 'orange' : 'accent', alpha: 0.8 }));
          sD.vline(e.th, { color: 'accent', width: 2.2 }); sD.vline(C, { color: 'green', width: 1.6, dash: [5, 4] });
          // risks
          const st = []; for (let k = 0; k < e.steps.length; k++) { const [x, y] = e.steps[k], xn = k + 1 < e.steps.length ? e.steps[k + 1][0] : 3; st.push([x, y], [xn, y]); }
          sE.path(st, { color: 'accent', width: 2 });
          sE.fn(R, { color: 'green', width: 2.6 });
          sE.vline(e.th, { color: 'accent', width: 1.4, dash: [4, 3] }); sE.vline(C, { color: 'green', width: 1.4, dash: [4, 3] });
          sE.dot(e.th, e.emp, { r: 5, color: 'accent', label: '$\\hat\\theta_n$', labelPos: 'n' }); sE.dot(C, Rstar, { r: 5, color: 'green', label: '$\\theta^*$', labelPos: 's' });
          // sweep
          const sw = sweep();
          sC.fn((x) => 0.5 / Math.sqrt(x), { color: 'faint', width: 1.5, dash: [5, 4] });
          sC.path(sw.map((p) => [p[0], p[2]]), { color: 'purple', width: 2.4 }); sC.dots(sw.map((p) => [p[0], p[2]]), { r: 3.2, color: 'purple' });
          sC.path(sw.map((p) => [p[0], p[1]]), { color: 'red', width: 2.4 }); sC.dots(sw.map((p) => [p[0], p[1]]), { r: 3.2, color: 'red' });
          sC.vline(n, { color: 'gold', width: 1.6 });
          info = { n, th: e.th, emp: e.emp, ex: R(e.th) - Rstar, dev: e.dev, Rth: R(e.th) };
        });
        v.legend([['accent', '$\\hat R_n$, $\\hat\\theta_n$'], ['green', '$R$, $\\theta^*$'], ['red', 'mean excess risk'], ['purple', 'mean $\\sup_\\theta|\\hat R_n-R|$'], ['faint', '$0.5/\\sqrt n$', { dash: true }]]);
        v.readout(() => info && String.raw`$n=${info.n}$: $\hat\theta_n=${mnus(info.th.toFixed(3))}$ (vs $\theta^*=0.5$) · training error $\hat R_n(\hat\theta_n)=${info.emp.toFixed(3)}$, true risk $R(\hat\theta_n)=${info.Rth.toFixed(4)}$, Bayes risk $R(\theta^*)=${Rstar.toFixed(4)}$ · excess risk ${info.ex.toFixed(4)} $\le 2\sup|\hat R_n-R|=${(2 * info.dev).toFixed(4)}$ ✓`);
      },
    },
    // ───────────────────────────────────────────────────────────── 1.8
    {
      num: '1.8',
      kind: 'Principle',
      name: 'Loss functions from maximum likelihood',
      statement: String.raw`Treat the network output as the parameter of a distribution for the target, $y\sim p(y\mid f_\theta(x))$, and fit by maximum likelihood: minimize the negative log-likelihood $L(\theta)=-\sum_i\log p\bigl(y_i\mid f_\theta(x_i)\bigr)$. Up to constants and scale:
- Gaussian noise $y\sim N(f,s^2)$ gives the **squared error** $\sum(y_i-f_i)^2/(2s^2)$;
- Laplace noise $p\propto e^{-|y-f|/s}$ gives the **absolute error** $\sum|y_i-f_i|/s$ (fits the conditional median);
- Cauchy noise gives $\sum\log\bigl(1+(y_i-f_i)^2/s^2\bigr)$, a robust loss whose influence vanishes for large residuals;
- a Bernoulli label with $P(y=1)=\sigma(f)$ gives the **binary cross-entropy** $-\sum[y_i\log\sigma(f_i)+(1-y_i)\log(1-\sigma(f_i))]$.

So the choice of loss is a modelling assumption about the noise.`,
      idea: String.raw`Maximum likelihood (stat-3.5) chooses the parameters that make the observed targets most probable; taking logs turns the product over independent examples into a sum, i.e. an empirical risk (1.7). The tail of the noise model decides how hard a large residual pulls: the Gaussian penalty grows quadratically, so one outlier can drag the fit; the Laplace penalty grows linearly; the Cauchy penalty only logarithmically. For classification the Bernoulli likelihood gives cross-entropy, which for a sigmoid output is convex in the logit and has gradient $\sigma(f)-y$ that never vanishes on a confidently wrong prediction, whereas squared error on $\sigma(f)$ has flat plateaus where gradient descent stalls.`,
      caption: String.raw`**Regression** (Gaussian, Laplace, Cauchy): drag the three gold outliers; the fits for all three noise models are drawn (the selected one bold), and the right panel shows its loss $-\log p(r)$ against the residual with the current residuals marked. **Bernoulli**: a logistic model $\sigma(wx+b)$ fitted by gradient descent on cross-entropy (green) and on squared error (orange) from the start point you drag in the right panel, over the landscape of the loss you choose; start far out and squared error stalls on a plateau.`,
      deps: ['stat-3.5', 'deep-1.7'],
      refs: ['Prince §5.1', 'Goodfellow §6.2'],
      tags: ['loss function', 'maximum likelihood'],
      viz(v) {
        const M = v.M;
        const distS = v.select('noise model', [{ value: 'gauss', label: 'Gaussian' }, { value: 'laplace', label: 'Laplace' }, { value: 'cauchy', label: 'Cauchy' }, { value: 'bern', label: 'Bernoulli' }], 'gauss');
        const landS = v.select('landscape', [{ value: 'ce', label: 'cross-entropy' }, { value: 'mse', label: 'squared error' }], 'ce');
        const sL = v.stage({ x: [-2.2, 2.2], y: [-2, 3], height: 330, axes: 'box', gutter: true, xlabel: '$x$', ylabel: ' ', title: 'data and fits' });
        const sR = v.stage({ x: [-3, 3], y: [0, 5], height: 330, axes: 'box', gutter: true, xlabel: ' ', ylabel: ' ', title: 'loss' });
        const tL = titler(sL), tR = titler(sR);
        const r = rand(21), base = [];
        for (let i = 0; i < 16; i++) { const x = -2 + (4 * (i + r())) / 16; base.push([x, 0.4 + 0.5 * x + r.normal() * 0.25]); }
        const O = [[-1.2, 2.6], [0.3, -1.7], [1.7, -1.5]].map(([x, y]) => sL.handle(x, y, { color: 'gold', r: 6 }));
        const S = 0.35, LOSS = { gauss: (r) => (r * r) / (2 * S * S), laplace: (r) => Math.abs(r) / S, cauchy: (r) => Math.log(1 + (r * r) / (S * S)) };
        const fitFor = (k, pts) => {
          const ls = M.linreg(pts.map((p) => p[0]), pts.map((p) => p[1])); if (k === 'gauss') return [ls.intercept, ls.slope];
          const L = (q) => pts.reduce((s, [x, y]) => s + LOSS[k](y - q[0] - q[1] * x), 0);
          let best = M.nelderMead(L, [ls.intercept, ls.slope], { step: 0.3, maxIt: 3000 });
          best = M.nelderMead(L, best.x, { step: 0.05, maxIt: 3000 }); return best.x;
        };
        // Bernoulli data
        const rb = rand(8), bx = [], by = [];
        for (let i = 0; i < 30; i++) { const x = rb.uniform(-2, 2); bx.push(x); by.push(rb() < sigm(2.2 * x - 0.4) ? 1 : 0); }
        const bLoss = (k, w, b) => { let s = 0; for (let i = 0; i < bx.length; i++) { const z = w * bx[i] + b; s += k === 'ce' ? softplus(z) - by[i] * z : (sigm(z) - by[i]) ** 2; } return s / bx.length; };
        const bGrad = (k, w, b) => { let gw = 0, gb = 0; for (let i = 0; i < bx.length; i++) { const z = w * bx[i] + b, p = sigm(z), d = k === 'ce' ? p - by[i] : 2 * (p - by[i]) * p * (1 - p); gw += d * bx[i]; gb += d; } return [gw / bx.length, gb / bx.length]; };
        const gd = (k, w, b) => { const path = [[w, b]]; for (let t = 0; t < 400; t++) { const [gw, gb] = bGrad(k, w, b); w -= 1.0 * gw; b -= 1.0 * gb; if (t % 4 === 3) path.push([w, b]); } return path; };
        const St = sR.handle(-6, 5, { color: 'gold', label: 'start', labelPos: 'ne' });
        let info = null;
        v.render(() => {
          const mode = distS.value, bern = mode === 'bern';
          landS.el.hidden = !bern; O.forEach((h) => (h.visible = !bern)); St.visible = bern;
          v.legend(bern ? [['green', 'gradient descent on cross-entropy'], ['orange', 'gradient descent on squared error', { dash: true }], ['gold', 'start (drag)', { dot: true }]] : [['accent', 'Gaussian → squared error'], ['green', 'Laplace → absolute error'], ['purple', 'Cauchy → $\\log(1+r^2/s^2)$'], ['gold', 'outliers (drag)', { dot: true }]]);
          if (!bern) {
            sL.setView([-2.2, 2.2], [-2, 3]); sR.setView([-3, 3], [0, 5]); sL.setLabels('$x$', '$y$'); sR.setLabels('residual $r=y-f(x)$', '$-\\log p(r)$');
            tL('data with three draggable outliers'); tR('loss $-\\log p(r)$ (up to a constant)');
            const pts = base.concat(O.map((h) => [h.x, h.y])), fits = {};
            for (const [k, c] of [['gauss', 'accent'], ['laplace', 'green'], ['cauchy', 'purple']]) { fits[k] = fitFor(k, pts); const [a, b] = fits[k]; sL.line(-3, a - 3 * b, 3, a + 3 * b, { color: c, width: k === mode ? 3.4 : 1.4, alpha: k === mode ? 1 : 0.55 }); }
            base.forEach(([x, y]) => sL.dot(x, y, { r: 4, color: 'ink' }));
            const col = { gauss: 'accent', laplace: 'green', cauchy: 'purple' }[mode];
            for (const [k, c] of [['gauss', 'accent'], ['laplace', 'green'], ['cauchy', 'purple']]) sR.fn((rr) => LOSS[k](rr) * (k === 'gauss' ? 0.5 : k === 'laplace' ? 0.7 : 1), { color: c, width: k === mode ? 3 : 1.3, alpha: k === mode ? 1 : 0.5 });
            const [a, b] = fits[mode], sc = mode === 'gauss' ? 0.5 : mode === 'laplace' ? 0.7 : 1;
            pts.forEach(([x, y], i) => { const rr = y - a - b * x; sR.dot(clamp(rr, -2.95, 2.95), Math.min(4.9, LOSS[mode](rr) * sc), { r: i >= base.length ? 5.5 : 3.2, color: i >= base.length ? 'gold' : col }); });
            // share of the loss carried by the outliers
            const tot = pts.reduce((s, [x, y]) => s + LOSS[mode](y - a - b * x), 0), out = O.reduce((s, h) => s + LOSS[mode](h.y - a - b * h.x), 0);
            info = { mode, fits, share: out / tot };
          } else {
            sL.setView([-2.2, 2.2], [-0.15, 1.15]); sR.setView([-8, 8], [-8, 8]); sL.setLabels('$x$', '$y$'); sR.setLabels('weight $w$', 'bias $b$');
            tL('labels and the fitted $\\sigma(wx+b)$'); tR(landS.value === 'ce' ? 'cross-entropy over $(w,b)$' : 'squared error $(\\sigma(wx+b)-y)^2$ over $(w,b)$');
            const k = landS.value, lut = rampLUT(v, k === 'ce' ? 'green' : 'orange', 64, 'panel', 0.9);
            const top = k === 'ce' ? 3 : 0.7;
            sR.raster((w, b) => lut[Math.round(clamp(Math.sqrt(bLoss(k, w, b) / top), 0, 1) * 63)], { res: 4, key: 'bern' + k });
            sR.contour((w, b) => bLoss(k, w, b), k === 'ce' ? [0.45, 0.6, 0.8, 1.2, 2, 3, 5] : [0.16, 0.2, 0.25, 0.35, 0.45, 0.55], { color: 'ink', width: 0.8, alpha: 0.45, res: 70 });
            const pc = gd('ce', St.x, St.y), pm = gd('mse', St.x, St.y);
            sR.path(pc, { color: 'green', width: 2.4 }); sR.path(pm, { color: 'orange', width: 2.4 });
            const ec = pc[pc.length - 1], em = pm[pm.length - 1];
            sR.dot(ec[0], ec[1], { r: 4.5, color: 'green' }); sR.dot(em[0], em[1], { r: 4.5, color: 'orange' });
            bx.forEach((x, i) => sL.dot(x, by[i], { r: 4, color: by[i] ? 'orange' : 'accent' }));
            sL.fn((x) => sigm(ec[0] * x + ec[1]), { color: 'green', width: 3 }); sL.fn((x) => sigm(em[0] * x + em[1]), { color: 'orange', width: 2.4, dash: [6, 4] });
            info = { mode, ec, em, lc: bLoss('ce', ...ec), lm: bLoss('ce', ...em), gm: Math.hypot(...bGrad('mse', St.x, St.y)), gc: Math.hypot(...bGrad('ce', St.x, St.y)) };
          }
        });
        v.readout(() => {
          if (!info) return '';
          if (info.mode !== 'bern') { const f = (k) => `$y=${mnus(info.fits[k][0].toFixed(2))}${info.fits[k][1] >= 0 ? '+' : ''}${mnus(info.fits[k][1].toFixed(2))}x$`; return `fits — Gaussian ${f('gauss')}, Laplace ${f('laplace')}, Cauchy ${f('cauchy')} (the bulk follows $y=0.4+0.5x$) · under the selected model the 3 outliers carry **${(100 * info.share).toFixed(0)}%** of the total loss`; }
          return String.raw`after 400 gradient steps from the start: cross-entropy fit $(w,b)=(${mnus(info.ec[0].toFixed(2))},${mnus(info.ec[1].toFixed(2))})$, mean log-loss ${info.lc.toFixed(3)} · squared-error fit $(${mnus(info.em[0].toFixed(2))},${mnus(info.em[1].toFixed(2))})$, log-loss ${info.lm.toFixed(3)} · gradient norm at the start: cross-entropy $${tsci(info.gc)}$, squared error $${tsci(info.gm)}$`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.9
    {
      num: '1.9',
      kind: 'Definition',
      name: 'Softmax and cross-entropy loss',
      statement: String.raw`For a classifier with $K$ classes the network outputs **logits** $z\in\R^K$, turned into probabilities by the **softmax**
$$p_k=\operatorname{softmax}(z)_k=\frac{e^{z_k/T}}{\sum_{j=1}^Ke^{z_j/T}}\qquad(T=1\text{ by default; }T>0\text{ is the temperature}),$$
a smooth map onto the interior of the probability simplex. It is invariant under adding the same constant to every logit, $\operatorname{softmax}(z+c\mathbf 1)=\operatorname{softmax}(z)$, approaches the indicator of $\arg\max z$ as $T\to0$ and the uniform distribution as $T\to\infty$. The **cross-entropy loss** of a label $y$ is the negative log-likelihood of the categorical model,
$$\ell(z,y)=-\log p_y=-z_y+\log\sum_j e^{z_j},$$
the cross-entropy $H(e_y,p)$ between the one-hot distribution and $p$; its gradient in the logits is $p-e_y$ (3.6).`,
      idea: String.raw`Softmax is the categorical analogue of the logistic sigmoid (for $K=2$, $p_1=\sigma(z_1-z_2)$): exponentiate so that every class gets positive weight, then normalise. Only differences of logits matter, which is why a constant shift cancels, and dividing by $T$ scales all differences at once. Cross-entropy (info-2.4) is the Bernoulli negative log-likelihood of 1.8 generalised to $K$ categories: it is $0$ only when $p_y=1$, grows without bound as $p_y\to0$, and is convex in the logits (it is a log-sum-exp minus a linear function), so it punishes confident mistakes sharply without ever saturating.`,
      caption: String.raw`Left: drag the three logits. Middle: the softmax probabilities, the true label's bar outlined, with the cross-entropy $-\log p_y$. Right: the probability simplex; the gold point is $p$, the curve is the path of $p$ as the temperature runs from $0.05$ to $20$ (towards a vertex and towards the centre), and the lines are levels of the cross-entropy. *Add 1 to every logit* moves the bars on the left but nothing else.`,
      deps: ['deep-1.8', 'info-2.4'],
      refs: ['Prince §5.5', 'Prince §5.7'],
      tags: ['softmax', 'cross-entropy'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Softmax_function' },
      viz(v) {
        const yS = v.select('true label', [{ value: 0, label: 'class 1' }, { value: 1, label: 'class 2' }, { value: 2, label: 'class 3' }], 0);
        const TS = v.slider('temperature $T$', 0.1, 10, 1, { log: true });
        const CC = ['accent', 'orange', 'green'];
        const sZ = v.stage({ x: [0.4, 3.6], y: [-4, 5], height: 300, axes: 'box', gutter: true, xticks: [[1, 'z₁'], [2, 'z₂'], [3, 'z₃']], weight: 0.8, minWidth: 220, title: 'logits $z$ (drag)' });
        const sP = v.stage({ x: [0.4, 3.6], y: [0, 1.05], height: 300, axes: 'box', gutter: true, xticks: [[1, 'p₁'], [2, 'p₂'], [3, 'p₃']], weight: 0.8, minWidth: 220, title: 'softmax probabilities' });
        const sS = v.stage({ x: [-0.15, 1.15], y: [-0.12, 1.0], equal: true, height: 300, axes: false, weight: 1.1, minWidth: 260, title: 'the simplex $p_1+p_2+p_3=1$' });
        const H = [[1, 2.2], [2, 0.9], [3, -0.6]].map(([x, y], k) => sZ.handle(x, y, { color: CC[k], constrain: (px, py) => [x, clamp(py, -3.9, 4.9)] }));
        v.button('add 1 to every logit', () => { if (H.every((h) => h.y < 3.9)) H.forEach((h) => h.set(h.x, h.y + 1)); });
        v.button('subtract the mean', () => { const m = (H[0].y + H[1].y + H[2].y) / 3; H.forEach((h) => h.set(h.x, h.y - m)); });
        const V = [[0, 0], [1, 0], [0.5, Math.sqrt(3) / 2]], toXY = (p) => [p[0] * V[0][0] + p[1] * V[1][0] + p[2] * V[2][0], p[0] * V[0][1] + p[1] * V[1][1] + p[2] * V[2][1]];
        let info = null;
        v.render(() => {
          const z = H.map((h) => h.y), T = TS.value, y = yS.value, p = softmax(z, T), ce = -Math.log(p[y]);
          sZ.hline(0, { color: 'faint', width: 1 });
          z.forEach((u, k) => sZ.rect(k + 1 - 0.28, 0, k + 1 + 0.28, u, { fill: CC[k], fillAlpha: 0.35, color: CC[k], width: 1.4 }));
          p.forEach((q, k) => { sP.rect(k + 1 - 0.3, 0, k + 1 + 0.3, q, { fill: CC[k], fillAlpha: 0.6, stroke: false }); if (k === y) sP.rect(k + 1 - 0.34, 0, k + 1 + 0.34, q, { color: 'ink', width: 2.2 }); sP.text(q.toFixed(3), k + 1, q, { dy: -10, align: 'center', size: 12, color: 'ink' }); });
          sP.text(`−log p${'₁₂₃'[y]} = ${ce.toFixed(3)}`, 2, 1.0, { align: 'center', size: 12.5, color: 'ink', weight: 600 });
          // simplex
          sS.poly(V, { color: 'muted', width: 1.4, fill: 'grid', fillAlpha: 0.35 });
          for (const lv of [0.1, 0.3, 0.6, 1.2, 2.3]) { const q = Math.exp(-lv), a = [0, 0, 0], b = [0, 0, 0]; a[y] = q; b[y] = q; a[(y + 1) % 3] = 1 - q; b[(y + 2) % 3] = 1 - q; const A = toXY(a), B = toXY(b); sS.line(A[0], A[1], B[0], B[1], { color: CC[y], width: 1, alpha: 0.6 }); sS.text(lv.toFixed(1), (A[0] + B[0]) / 2, (A[1] + B[1]) / 2, { size: 10, color: CC[y], align: 'center' }); }
          const path = []; for (let i = 0; i <= 200; i++) { const t = 0.05 * 400 ** (i / 200); path.push(toXY(softmax(z, t))); }
          sS.path(path, { color: 'gold', width: 1.8, dash: [4, 3] });
          V.forEach((q, k) => sS.text(`class ${k + 1}`, q[0], q[1], { dy: k === 2 ? -12 : 14, dx: k === 0 ? -6 : k === 1 ? 6 : 0, align: k === 0 ? 'left' : k === 1 ? 'right' : 'center', size: 11.5, color: CC[k], weight: 600 }));
          const P = toXY(p); sS.dot(P[0], P[1], { r: 6, color: 'gold' });
          const Py = toXY([0, 1, 2].map((k) => (k === y ? 1 : 0))); sS.arrow(P[0], P[1], P[0] + 0.25 * (Py[0] - P[0]), P[1] + 0.25 * (Py[1] - P[1]), { color: 'ink', width: 1.6, head: 7 });
          const shift = Math.max(...softmax(z.map((u) => u + 1), T).map((q, k) => Math.abs(q - p[k])));
          info = { z, p, ce, y, shift, g: p.map((q, k) => q - (k === y ? 1 : 0)) };
        });
        v.legend([['gold', 'path of $p$ as $T$ varies', { dash: true }], ['ink', 'descent direction $-(p-e_y)$']]);
        v.readout(() => info && String.raw`$z=(${info.z.map((u) => mnus(u.toFixed(2))).join(',\\,')})$, $p=(${info.p.map((q) => q.toFixed(3)).join(',\\,')})$ · cross-entropy $-\log p_{${info.y + 1}}=${info.ce.toFixed(4)}$ · gradient $p-e_y=(${info.g.map((q) => mnus(q.toFixed(3))).join(',\\,')})$ · shifting every logit by $+1$ changes $p$ by at most $${info.shift === 0 ? '0' : v.sci(info.shift, 1)}$`);
      },
    },
    // ───────────────────────────────────────────────────────────── 1.10
    {
      num: '1.10',
      kind: 'Concept',
      name: 'Logistic regression as a one-layer network',
      statement: String.raw`Logistic regression models a binary label by $P(y=1\mid x)=\sigma(w\cdot x+b)$ — exactly one sigmoid neuron (1.1), a network with no hidden layer — and fits $(w,b)$ by maximum likelihood, i.e. by minimizing the binary cross-entropy (1.8). The loss is convex with gradient $\sum_i(p_i-y_i)(x_i,1)$ and Hessian $\sum_ip_i(1-p_i)(x_i,1)(x_i,1)^\top$. Two classical solvers reach the same minimizer: **Newton's method**, which statisticians call **iteratively reweighted least squares** (IRLS: each step solves a weighted least-squares problem with weights $p_i(1-p_i)$) and converges quadratically, and **gradient descent** on the neuron, which converges linearly. If the classes are linearly separable the maximum likelihood estimate does not exist: the loss has no minimizer and $\norm w\to\infty$ along any minimizing sequence.`,
      idea: String.raw`The cross-entropy of a sigmoid is $\mathrm{softplus}(z)-yz$ in the logit $z$, a convex function, so its composition with the affine map $z=w\cdot x+b$ is convex in the parameters and any stationary point is the global minimum (stat-13.10). Newton's step multiplies the gradient by the inverse Hessian, which rescales the problem to look locally quadratic and gains digits of accuracy at a doubling rate; gradient descent takes many cheap steps with a rate set by the condition number. When a hyperplane separates the classes, scaling $(w,b)$ up drives every $p_i$ toward its label and the loss toward $0$ without ever reaching it — the maximum-margin direction appears in the limit (the implicit bias studied in chapter 6).`,
      caption: String.raw`Left: two classes in the plane, shaded by the neuron's current $P(y=1\mid x)$; the blue line is gradient descent's current boundary, the dashed green one IRLS's. Click to add a point of the selected class. Right, on log scales: the distance of each iterate from the maximum-likelihood estimate — IRLS hits machine precision in about ten steps (quadratic convergence), gradient descent needs hundreds (linear convergence). Choose *separable* data and both diverge: the right panel then shows $\lVert w\rVert$ growing without bound.`,
      deps: ['deep-1.9', 'stat-13.10'],
      refs: ['Prince §5.4', 'Goodfellow §6.2'],
      tags: ['logistic regression', 'Newton method'],
      viz(v) {
        const M = v.M;
        const dataS = v.select('data', [{ value: 'overlap', label: 'overlapping classes' }, { value: 'sep', label: 'separable' }], 'overlap');
        const clsS = v.select('click adds', [{ value: 0, label: 'class 0' }, { value: 1, label: 'class 1' }], 1);
        const sL = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, height: 340, axes: 'box', gutter: true, xlabel: '$x_1$', ylabel: '$x_2$', title: 'data, $P(y=1\\mid x)$ and the two boundaries' });
        const sR = v.stage({ x: [1, 3000], y: [1e-13, 30], xlog: true, ylog: true, height: 340, axes: 'box', gutter: true, xlabel: 'iteration', title: 'convergence' });
        const tR = titler(sR);
        const extra = { overlap: [], sep: [] };
        const make = (k) => { const r = rand(k === 'sep' ? 4 : 9), X = [], Y = []; for (let i = 0; i < 40; i++) { const c = i % 2, s = k === 'sep' ? 0.45 : 1.15; const m = c ? [0.9, 0.7] : [-0.9, -0.6]; let x = [m[0] + r.normal() * s, m[1] + r.normal() * s]; if (k === 'sep' && (c ? x[0] + x[1] < 0.3 : x[0] + x[1] > -0.3)) { i--; continue; } X.push(x); Y.push(c); } return { X, Y }; };
        const base = { overlap: make('overlap'), sep: make('sep') };
        sL.onClick((x, y) => { extra[dataS.value].push([x, y, +clsS.value]); });
        const nll = (th, X, Y) => X.reduce((s, x, i) => { const z = th[0] * x[0] + th[1] * x[1] + th[2]; return s + softplus(z) - Y[i] * z; }, 0) / X.length;
        const grad = (th, X, Y) => { const g = [0, 0, 0]; X.forEach((x, i) => { const d = sigm(th[0] * x[0] + th[1] * x[1] + th[2]) - Y[i]; g[0] += d * x[0]; g[1] += d * x[1]; g[2] += d; }); return g.map((u) => u / X.length); };
        const runs = memo();
        const solve = (X, Y) => {
          const irls = [[0, 0, 0]]; let th = [0, 0, 0];
          for (let k = 0; k < 30; k++) {
            const Hm = M.zeros(3, 3), g = grad(th, X, Y);
            X.forEach((x) => { const p = sigm(th[0] * x[0] + th[1] * x[1] + th[2]), w = p * (1 - p) / X.length, u = [x[0], x[1], 1]; for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) Hm[a][b] += w * u[a] * u[b]; });
            for (let a = 0; a < 3; a++) Hm[a][a] += 1e-12;
            const st = M.solve(Hm, g); if (!st || !st.every(isFinite)) break;
            th = th.map((u, i) => u - st[i]); irls.push(th.slice()); if (Math.hypot(...th) > 1e4) break;
          }
          const gdp = [[0, 0, 0]]; th = [0, 0, 0];
          for (let k = 0; k < 3000; k++) { const g = grad(th, X, Y); th = th.map((u, i) => u - 3.0 * g[i]); gdp.push(th.slice()); }
          return { irls, gdp };
        };
        let info = null;
        v.animate((t) => {
          const kind = dataS.value, B = base[kind], X = B.X.concat(extra[kind].map((p) => [p[0], p[1]])), Y = B.Y.concat(extra[kind].map((p) => p[2]));
          const key = kind + '|' + X.length, R = runs(key, () => solve(X, Y));
          const it = Math.min(3000, Math.max(1, Math.round(10 ** (t * 0.5)))), kI = Math.min(R.irls.length - 1, Math.floor(t * 1.5) + 1);
          const thG = R.gdp[it], thI = R.irls[kI];
          const lutA = rampLUT(v, 'accent', 48, 'panel', 0.5), lutO = rampLUT(v, 'orange', 48, 'panel', 0.5);
          sL.raster((x, y) => { const p = sigm(thG[0] * x + thG[1] * y + thG[2]), u = Math.round(Math.abs(2 * p - 1) * 47); return p >= 0.5 ? lutO[u] : lutA[u]; }, { res: 4, key: key + '|' + it });
          const bline = (th, st) => { const n = Math.hypot(th[0], th[1]); if (n < 1e-9) return; const p0 = [(-th[2] * th[0]) / (n * n), (-th[2] * th[1]) / (n * n)], d = [-th[1] / n, th[0] / n]; sL.line(p0[0] - 9 * d[0], p0[1] - 9 * d[1], p0[0] + 9 * d[0], p0[1] + 9 * d[1], st); };
          bline(thG, { color: 'accent', width: 2.4 }); bline(thI, { color: 'green', width: 2.6, dash: [7, 5] });
          X.forEach((x, i) => sL.dot(x[0], x[1], { r: 4, color: Y[i] ? 'orange' : 'accent' }));
          // convergence panel
          const sep = kind === 'sep' || R.irls.length < 25 && Math.hypot(...R.irls[R.irls.length - 1]) > 50;
          const ref = R.irls[R.irls.length - 1];
          let pg, pi;
          if (!sep) { tR('distance from the MLE $\\lVert\\theta_k-\\hat\\theta\\rVert$'); sR.setView([1, 3000], [1e-13, 30]); pg = R.gdp.map((th, k) => [k, Math.max(1e-14, Math.hypot(th[0] - ref[0], th[1] - ref[1], th[2] - ref[2]))]); pi = R.irls.map((th, k) => [k, Math.max(1e-14, Math.hypot(th[0] - ref[0], th[1] - ref[1], th[2] - ref[2]))]); }
          else { tR('no MLE: $\\lVert w_k\\rVert$ grows without bound'); sR.setView([1, 3000], [0.1, 2e4]); pg = R.gdp.map((th, k) => [k, Math.hypot(th[0], th[1])]); pi = R.irls.map((th, k) => [k, Math.hypot(th[0], th[1])]); }
          sR.path(pg.slice(1).filter((p, k) => k < 40 || k % 5 === 0), { color: 'accent', width: 2.4 });
          sR.path(pi.slice(1), { color: 'green', width: 2.4 }); sR.dots(pi.slice(1), { r: 3.4, color: 'green' });
          sR.vline(it, { color: 'accent', width: 1.2, dash: [3, 3] });
          sR.dot(pg[it][0], pg[it][1], { r: 5, color: 'accent' }); sR.dot(Math.max(1, pi[kI][0]), pi[kI][1], { r: 5, color: 'green' });
          info = { it, kI, thG, thI, sep, lossG: nll(thG, X, Y), lossI: nll(thI, X, Y), n: X.length };
        }, { period: 8, once: true, still: 7.5 });
        v.legend([['accent', 'gradient descent (one neuron, step size 3)'], ['green', 'IRLS / Newton', { dash: true }], ['accent', 'class 0', { dot: true }], ['orange', 'class 1', { dot: true }]]);
        v.readout(() => {
          if (!info) return '';
          const f = (th) => `(${th.map((u) => mnus(u.toFixed(4))).join(', ')})`;
          return `${info.n} points · $(w_1,w_2,b)$ — IRLS after ${info.kI} steps: ${f(info.thI)}, loss ${info.lossI.toFixed(6)} · gradient descent after ${info.it} steps: ${f(info.thG)}, loss ${info.lossG.toFixed(6)}` + (info.sep ? ' · **separable: the loss tends to 0 and the coefficients diverge, so no MLE exists**' : '');
        });
      },
    },
  ],
};
