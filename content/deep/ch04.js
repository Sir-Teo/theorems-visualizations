// Deep Learning Theory — Chapter 4: Optimization for training (items 4.2–4.7; 4.8–4.11 in ch04-b.js)
//
// Items 4.1 (gradient descent) and 4.3 (SGD) are cross-listed from the `opt` collection (opt-7.4, opt-7.10) and are
// not rewritten here. Every iterate on screen is produced by running the algorithm (closed forms are drawn only as
// dashed predictions to compare with); the saddle and landscape items use small explicit model problems and say so.
import { adaptiveQuadratic as sim } from './adaptive-source.shared.js';
import { clamp, mnus, memo, rand, hashStr, log10Ticks, lg } from './ch04.shared.js';

/** Contour levels for a positive quadratic-like loss: squares of equally spaced values, so they crowd near the minimum. */
const levels = (fmax, n = 9) => Array.from({ length: n }, (_, i) => fmax * ((i + 1) / (n + 1)) ** 2);
const sgn = (x) => (x < 0 ? '−' : '');

export default {
  collection: 'deep',
  chapter: 4,
  title: 'Optimization for training',
  summary: String.raw`Neural networks are trained by variants of gradient descent on non-convex losses. The learning rate must respect the curvature, stochastic minibatches trade accuracy for speed, and momentum and adaptive step sizes cope with ill-conditioning. The landscape turns out to be friendlier than non-convexity suggests: saddle points rather than bad local minima dominate, gradient descent almost surely escapes strict saddles, and independently trained solutions are joined by low-loss paths. Full-batch training also shows behaviour no classical analysis predicts, such as the edge of stability.`,
  items: [
    // ───────────────────────────────────────────────────────────── 4.2
    {
      num: '4.2',
      kind: 'Theorem',
      name: 'Stability threshold of the learning rate',
      statement: String.raw`Let $f(\theta)=\tfrac12\theta^{\top}A\theta$ with $A$ symmetric positive definite, and run gradient descent $\theta_{k+1}=\theta_k-\eta\nabla f(\theta_k)$. In the eigenbasis of $A$ (eigenvalues $\lambda_1\ge\dots\ge\lambda_d>0$) each coordinate evolves independently,
$$\theta^{(i)}_{k}=(1-\eta\lambda_i)^k\,\theta^{(i)}_0 .$$
Hence $\theta_k\to0$ for every start if and only if $\eta<2/\lambda_1$, i.e. the learning rate is below **two over the largest curvature**. At $\eta=2/\lambda_1$ the top coordinate flips sign forever with constant size, and for $\eta>2/\lambda_1$ it oscillates with geometrically growing amplitude. For a general smooth loss the same threshold governs the linearization at a minimum: it is stable only if $\eta\,\lambda_{\max}(\nabla^2 f)<2$.`,
      idea: String.raw`The update is the linear map $\theta\mapsto(I-\eta A)\theta$, whose eigenvalues are $1-\eta\lambda_i$; powers of a diagonalizable matrix go to zero exactly when all eigenvalues have modulus below 1, and $|1-\eta\lambda|<1\iff0<\eta\lambda<2$. The slowest direction has the smallest curvature, so the best fixed step, $\eta=2/(\lambda_1+\lambda_d)$, balances $|1-\eta\lambda_1|=|1-\eta\lambda_d|$ and leaves the rate $(\kappa-1)/(\kappa+1)$ with $\kappa=\lambda_1/\lambda_d$. Near a minimum of a smooth loss the Taylor expansion (pma-5.15) reduces the dynamics to this quadratic one.`,
      caption: String.raw`Gradient descent on $f=\tfrac12(Lx^2+0.4\,y^2)$ from $(1,1)$. Left: contours and the iterates. Right: $\log_{10}|x_k|$ and $\log_{10}|y_k|$ against the step $k$, with the dashed lines of slope $\log_{10}|1-\eta L|$ and $\log_{10}|1-0.4\eta|$ that the theorem predicts. Raise $\eta$ past $2/L$ (given in the readout) and watch the steep coordinate stop contracting, then blow up while the flat one is still fine.`,
      deps: ["opt-7.4","ladr-7.29","pma-5.15"],
      refs: ['Goodfellow §4.3'],
      tags: ['learning rate', 'curvature', 'stability'],
      scope: String.raw`Exact for quadratics; for general losses it is the local stability criterion at a minimum (and, with a different constant, the origin of the descent lemma $\eta\le1/L$).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Gradient_descent' },
      viz(v) {
        const Ls = v.slider('curvature $L$ (steep direction)', 0.5, 5, 2, { step: 0.05 });
        const eta = v.slider('learning rate $\\eta$', 0.02, 1.4, 0.8, { step: 0.01 });
        const B = 0.4, K = 30;
        const sL = v.stage({ x: [-1.6, 1.6], y: [-1.6, 1.6], equal: true, height: 320, axes: 'box', gutter: true, xlabel: '$x$ (curvature $L$)', ylabel: '$y$ (curvature 0.4)', weight: 0.9, minWidth: 260, title: 'iterates on the contours' });
        const sR = v.stage({ x: [0, K], y: [-8, 8], height: 320, axes: 'box', gutter: true, xlabel: 'step $k$', ylabel: '$\\log_{10}|\\text{coordinate}|$', weight: 1.1, minWidth: 300, title: 'error of each coordinate' });
        let info = null;
        v.render(() => {
          const L = Ls.value, e = eta.value, rx = 1 - e * L, ry = 1 - e * B;
          const X = [1], Y = [1];
          for (let k = 0; k < K; k++) { X.push(X[k] - e * L * X[k]); Y.push(Y[k] - e * B * Y[k]); }
          const f = (x, y) => 0.5 * (L * x * x + B * y * y);
          sL.contour(f, levels(f(1.6, 0.3), 8), { color: 'muted', width: 0.8, alpha: 0.55, res: 120 });
          const ok = Math.abs(rx) < 1;
          sL.clip(() => {
            sL.path(X.map((x, k) => [x, Y[k]]), { color: ok ? 'accent' : 'red', width: 1.4 });
            sL.dots(X.map((x, k) => [x, Y[k]]), { r: 3.2, color: ok ? 'accent' : 'red' });
          });
          sL.dot(1, 1, { r: 5, color: 'gold', label: '$\\theta_0$', labelPos: 'ne' });
          const hi = clamp(Math.max(2, ...X.map((x) => lg(Math.abs(x)))), 2, 9);
          sR.setView([0, K], [-9, hi + 1]);
          sR.setTicks(undefined, log10Ticks(-9, hi + 1, hi > 6 ? 3 : 2));
          sR.path(X.map((x, k) => [k, lg(Math.abs(x), -12)]), { color: ok ? 'accent' : 'red', width: 2 });
          sR.path(Y.map((y, k) => [k, lg(Math.abs(y), -12)]), { color: 'orange', width: 2 });
          sR.line(0, 0, K, K * Math.log10(Math.max(1e-12, Math.abs(rx))), { color: ok ? 'accent' : 'red', dash: true, width: 1.2 });
          sR.line(0, 0, K, K * Math.log10(Math.abs(ry)), { color: 'orange', dash: true, width: 1.2 });
          info = { rx, ry, ok, ratio: Math.abs(X[K] / X[K - 1]), thr: 2 / L, e };
        });
        v.legend([['accent', 'steep coordinate $x_k$'], ['orange', 'flat coordinate $y_k$'], ['muted', 'dashed: predicted slope']]);
        v.readout(() => info && String.raw`$2/L=${v.fix(info.thr, 3)}$ and $\eta=${v.fix(info.e, 2)}$: ` + (info.ok ? `**stable** (η < 2/L)` : (Math.abs(Math.abs(info.rx) - 1) < 0.006 ? `**at the threshold**: the steep coordinate flips sign with constant size` : `**unstable** (η > 2/L)`)) +
          String.raw` · factor $1-\eta L=${mnus(v.fix(info.rx, 3))}$ (|·| = ${v.fix(Math.abs(info.rx), 3)}); observed $|x_{30}/x_{29}|=${v.fix(info.ratio, 3)}$ ✓` + `\n` + String.raw`flat direction: $1-0.4\eta=${v.fix(info.ry, 3)}$ · best fixed step $2/(L+0.4)=${v.fix(2 / (Ls.value + B), 3)}$ with rate $(\kappa-1)/(\kappa+1)=${v.fix((Ls.value / B - 1) / (Ls.value / B + 1), 3)}$`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.4
    {
      num: '4.4',
      kind: 'Algorithm',
      name: 'Momentum (heavy ball)',
      statement: String.raw`**Input:** a gradient oracle $\nabla f$, step $\eta>0$, momentum $\beta\in[0,1)$, start $\theta_0=\theta_{-1}$. **Update:**
$$\theta_{k+1}=\theta_k-\eta\nabla f(\theta_k)+\beta\,(\theta_k-\theta_{k-1}),$$
equivalently a velocity $u_{k+1}=\beta u_k-\eta\nabla f(\theta_k)$, $\theta_{k+1}=\theta_k+u_{k+1}$. On a quadratic with curvatures in $[\mu,L]$ and $\kappa=L/\mu$, plain gradient descent with its best step contracts the error by $\frac{\kappa-1}{\kappa+1}$ per step, while the heavy ball with $\eta=\frac{4}{(\sqrt L+\sqrt\mu)^2}$ and $\beta=\bigl(\frac{\sqrt\kappa-1}{\sqrt\kappa+1}\bigr)^2$ achieves $\frac{\sqrt\kappa-1}{\sqrt\kappa+1}$: the number of steps to a given accuracy drops from order $\kappa$ to order $\sqrt\kappa$.`,
      idea: String.raw`On each eigen-direction of a quadratic the recursion is a two-term linear recurrence whose characteristic roots depend on $\eta\lambda$ and $\beta$. When $\beta$ is large enough the roots are complex with modulus exactly $\sqrt\beta$, independent of the curvature, so every direction decays at the same rate; Polyak's choice makes this hold across the whole spectrum $[\mu,L]$. Intuitively the velocity averages successive gradients: components that flip sign (across the valley) cancel, components that keep their sign (along its floor) add up. The guarantee is for quadratics; for general convex functions Nesterov's variant is the one with a worst-case $\sqrt\kappa$ rate (see opt-7.9).`,
      caption: String.raw`The valley $f=\tfrac12(\kappa x^2+y^2)$ (from $(0.3,1)$; first 40 steps; the true ellipse is $\sqrt\kappa$ times longer than wide). Red: gradient descent with its best step $2/(\kappa+1)$; blue: heavy ball. Raise $\kappa$ and compare the steps needed to reduce the loss by $10^{8}$ (readout and right panel). Switch off the tuned parameters to explore your own $\eta,\beta$: too little momentum behaves like plain descent, too much overshoots and rings.`,
      deps: ['opt-7.4', 'opt-7.10'],
      see: ['opt-7.9'],
      refs: ['Prince §6.3', 'Goodfellow §8.3'],
      tags: ['momentum', 'conditioning', 'acceleration'],
      credit: 'Polyak, 1964',
      scope: String.raw`The $\sqrt\kappa$ rate is proved for quadratics (and strongly convex functions near a minimum); with stochastic gradients the benefit is mostly variance averaging, and the same constants do not carry over.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Gradient_descent#Momentum_or_heavy_ball_method' },
      viz(v) {
        const kap = v.slider('condition number $\\kappa$', 1, 400, 60, { log: true, sig: 2 });
        const tuned = v.toggle('Polyak-tuned $\\eta,\\beta$', true);
        const eS = v.slider('step $\\eta\\kappa$ (units of $1/L$)', 0.05, 2, 1, { step: 0.01 });
        const bS = v.slider('momentum $\\beta$', 0, 0.99, 0.8, { step: 0.01 });
        const sL = v.stage({ x: [-0.4, 0.4], y: [-0.25, 1.1], height: 330, axes: 'box', gutter: true, xlabel: '$x$ (steep, curvature $\\kappa$)', ylabel: '$y$ (flat, curvature 1)', weight: 0.9, minWidth: 260, title: 'paths in the valley (aspect exaggerated)' });
        const sR = v.stage({ x: [0, 300], y: [-9.5, 0.7], height: 330, axes: 'box', gutter: true, xlabel: 'step $k$', ylabel: '$\\log_{10}(f/f_0)$', weight: 1, minWidth: 300, title: 'loss against steps' });
        sR.setTicks(undefined, log10Ticks(-9, 0, 2));
        const NMAX = 300, TOL = 1e-8, CAP = 400000, X0 = 0.3;
        const run = (k, mom, eta, beta) => {
          let x = X0, y = 1, px = X0, py = 1; const f0 = 0.5 * (k * X0 * X0 + 1), pts = [[X0, 1]], loss = [1]; let hit = null;
          for (let t = 1; t <= CAP; t++) {
            const nx = x - eta * k * x + beta * (x - px), ny = y - eta * y + beta * (y - py); px = x; py = y; x = nx; y = ny;
            const fr = 0.5 * (k * x * x + y * y) / f0;
            if (t <= NMAX) { pts.push([x, y]); loss.push(fr); }
            if (hit == null && fr < TOL) { hit = t; if (t > NMAX) break; }
            if (!isFinite(fr) || fr > 1e12) { hit = hit ?? Infinity; break; }
          }
          while (loss.length <= NMAX) loss.push(NaN);
          return { pts, loss, hit };
        };
        let info = null;
        v.render(() => {
          const k = kap.value, sk = Math.sqrt(k);
          const etaGD = 2 / (k + 1);
          const etaHB = tuned.value ? 4 / (sk + 1) ** 2 : (eS.value / k), betaHB = tuned.value ? ((sk - 1) / (sk + 1)) ** 2 : bS.value;
          eS.el.hidden = bS.el.hidden = tuned.value;
          const g = run(k, false, etaGD, 0), h = run(k, true, etaHB, betaHB);
          sL.contour((x, y) => 0.5 * (k * x * x + y * y), levels(0.5 * (k * 0.35 * 0.35 + 1), 8), { color: 'muted', width: 0.8, alpha: 0.5, res: 140 });
          const cl = (P) => P.filter((p) => isFinite(p[0]) && Math.abs(p[0]) < 4 && Math.abs(p[1]) < 4);
          sL.clip(() => { sL.path(cl(g.pts.slice(0, 40)), { color: 'red', width: 1.3 }); sL.path(cl(h.pts.slice(0, 40)), { color: 'accent', width: 1.6 }); });
          sL.dot(X0, 1, { r: 5, color: 'gold', label: '$\\theta_0$', labelPos: 'ne' });
          sL.dot(0, 0, { r: 3.5, color: 'green' });
          const ln = (arr) => arr.map((x, i) => [i, lg(x, -12)]);
          sR.hline(-8, { color: 'faint', dash: true });
          sR.path(ln(g.loss), { color: 'red', width: 2 }); sR.path(ln(h.loss), { color: 'accent', width: 2 });
          const rhoG = (k - 1) / (k + 1), rhoH = tuned.value ? (sk - 1) / (sk + 1) : null;
          info = { g: g.hit, h: h.hit, k, etaHB, betaHB, predG: Math.log(TOL) / (2 * Math.log(Math.max(1e-12, rhoG))), predH: rhoH ? Math.log(TOL) / (2 * Math.log(rhoH)) : null };
        });
        v.legend([['red', 'gradient descent ($\\eta=2/(L+\\mu)$)'], ['accent', 'heavy ball'], ['faint', 'dashed: target $10^{-8}$']]);
        const fmtN = (x) => (x == null ? '—' : x === Infinity ? 'diverges' : x >= 400000 ? '> 400 000' : Math.round(x).toLocaleString('en').replace(/,/g, ' '));
        v.readout(() => info && String.raw`$\kappa=${v.fmt(info.k, 3)}$ · steps to reduce the loss by $10^{8}$: **gradient descent ${fmtN(info.g)}**, **heavy ball ${fmtN(info.h)}**` +
          (info.h && info.g && isFinite(info.h) && info.g < 400000 ? ` (${v.fix(info.g / info.h, 1)}× fewer)` : '') + `\n` +
          String.raw`heavy ball uses $\eta=${v.fix(info.etaHB * info.k, 2)}/L$, $\beta=${v.fix(info.betaHB, 3)}$ · asymptotic-rate estimate ${fmtN(info.predG)} versus ${fmtN(info.predH)} (it ignores the start-up transient; order $\kappa$ against $\sqrt\kappa$)`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.5
    {
      num: '4.5',
      kind: 'Algorithm',
      name: 'Adaptive learning rates: AdaGrad, RMSProp, Adam',
      statement: String.raw`All three rescale each coordinate of the gradient $g_k$ by a running estimate of its size. With $\odot$ elementwise:
- **AdaGrad:** $G_k=G_{k-1}+g_k\odot g_k$, $\ \theta_{k+1}=\theta_k-\eta\,g_k/(\sqrt{G_k}+\epsilon)$ (the accumulator never decreases, so its coordinatewise rate prefactors do not increase).
- **RMSProp:** $s_k=\rho s_{k-1}+(1-\rho)g_k\odot g_k$, $\ \theta_{k+1}=\theta_k-\eta\,g_k/(\sqrt{s_k}+\epsilon)$ (an exponential average).
- **Adam:** $m_k=\beta_1m_{k-1}+(1-\beta_1)g_k$, $\ s_k=\beta_2s_{k-1}+(1-\beta_2)g_k\odot g_k$, and $\theta_{k+1}=\theta_k-\eta\,\hat m_k/(\sqrt{\hat s_k}+\epsilon)$ with the **bias corrections** $\hat m_k=m_k/(1-\beta_1^k)$, $\hat s_k=s_k/(1-\beta_2^k)$ (starting from $m_0=s_0=0$).
These normalizations reduce sensitivity to a uniform rescaling of a coordinate's gradient history when $\epsilon$ is negligible. The actual step still depends on the history; AdaGrad's accumulated denominator can grow, and Adam's momentum can differ greatly from the current gradient.`,
      idea: String.raw`Coordinates with large gradients (steep directions) get small effective rates and those with small gradients get large ones, a cheap diagonal preconditioner that makes progress even when curvatures differ by orders of magnitude. AdaGrad (Duchi–Hazan–Singer) comes from online convex optimization; RMSProp replaces its sum by a moving average, which does not force the accumulator to grow; Adam adds momentum on the gradient. Because $m$ and $s$ start at zero they are biased toward zero early on, and the corrections remove the zero-initialization weight deficit (giving unbiased moment estimates when those moments are stationary). With $\beta_1=0.9$,$\beta_2=0.999$ and negligible $\epsilon$, the first step without correction is $\eta\,(1-\beta_1)g/\sqrt{(1-\beta_2)g^2}\approx3.2\,\eta$, more than three times the intended size.`,
      caption: String.raw`The loss $f=\tfrac12(ax^2+y^2)$ with a large ratio $a$ between the coordinates' curvatures, from $(1,1)$. Left: paths of gradient descent (step $0.9/a$), AdaGrad, RMSProp and Adam (dashed: without bias correction) at the common rate $\eta$. Middle: loss against steps. Right: the effective per-coordinate rate $|\Delta\theta_i/g_i|$ of the chosen method for the steep ($x$) and flat ($y$) coordinates. Toggle the correction and read off the size of Adam's first step.`,
      deps: ['opt-7.10', 'deep-4.4'],
      refs: ['Duchi, Hazan and Singer 2011, §1.1 diagonal update (1), pp. 2122–2123, https://www.jmlr.org/papers/volume12/duchi11a/duchi11a.pdf', 'Hinton, lecture 6, slide rmsprop: Divide the gradient by a running average of its recent magnitude, https://www.cs.toronto.edu/~tijmen/csc321/slides/lecture_slides_lec6.pdf', 'Kingma and Ba, Adam, arXiv 1412.6980, Algorithm 1 and §§2–3 pp. 2–3; RMSProp attribution in bibliography'],
      tags: ['adaptive step size', 'Adam', 'preconditioning'],
      credit: 'Duchi, Hazan & Singer 2011 (AdaGrad); Tieleman & Hinton 2012 (RMSProp lecture); Kingma & Ba 2014 (Adam)',
      scope: String.raw`Exact formulas are the textbook versions with $\epsilon=10^{-8}$; These are update rules, not a convergence guarantee; the RMSProp source is a lecture slide.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Stochastic_gradient_descent#Adam', arxiv: 'https://arxiv.org/abs/1412.6980' },
      viz(v) {
        const aS = v.slider('curvature ratio $a$', 1, 400, 50, { log: true, sig: 2 });
        const lr = v.slider('rate $\\eta$', 0.01, 0.5, 0.1, { log: true, sig: 2 });
        const bc = v.toggle('Adam bias correction', true);
        const which = v.select('effective rate of', [{ value: 'ada', label: 'AdaGrad' }, { value: 'rms', label: 'RMSProp' }, { value: 'adam', label: 'Adam' }], 'adam');
        const N = 100;
        const sP = v.stage({ x: [-0.3, 1.2], y: [-0.3, 1.2], equal: true, height: 300, axes: 'box', gutter: true, xlabel: '$x$ (curvature $a$)', ylabel: '$y$ (curvature 1)', weight: 1, minWidth: 250, title: 'paths' });
        const sF = v.stage({ x: [0, N], y: [-9.5, 0.7], height: 300, axes: 'box', gutter: true, xlabel: 'step $k$', ylabel: '$\\log_{10}(f/f_0)$', weight: 1, minWidth: 250, title: 'loss' });
        const sE = v.stage({ x: [1, N], y: [-3.5, 1.2], height: 300, axes: 'box', gutter: true, xlabel: 'step $k$', ylabel: '$\\log_{10}$ effective rate', weight: 1, minWidth: 250, title: 'per-coordinate rates' });
        sF.setTicks(undefined, log10Ticks(-9, 0, 2)); sE.setTicks(undefined, log10Ticks(-3, 1, 1));
        let info = null;
        v.render(() => {
          const a = aS.value, eta = lr.value;
          const R = { gd: sim(a, eta, 'gd'), ada: sim(a, eta, 'ada'), rms: sim(a, eta, 'rms'), adam: sim(a, eta, 'adam', bc.value), adamNo: sim(a, eta, 'adam', false), adamYes: sim(a, eta, 'adam', true) };
          sP.contour((x, y) => 0.5 * (a * x * x + y * y), levels(0.5 * (a * 0.5 * 0.5 + 1), 8), { color: 'muted', width: 0.8, alpha: 0.5, res: 120 });
          const cols = { gd: 'red', ada: 'teal', rms: 'purple', adam: 'accent' };
          sP.clip(() => { for (const k of ['gd', 'ada', 'rms']) sP.path(R[k].pts, { color: cols[k], width: 1.5 }); sP.path(R.adam.pts, { color: 'accent', width: 1.8, dash: !bc.value }); });
          sP.dot(1, 1, { r: 5, color: 'gold', label: '$\\theta_0$', labelPos: 'ne' }); sP.dot(0, 0, { r: 3.5, color: 'green' });
          for (const k of ['gd', 'ada', 'rms', 'adam']) sF.path(R[k].f.map((x, i) => [i, lg(x, -12)]), { color: cols[k], width: 2, dash: k === 'adam' && !bc.value });
          sF.hline(-8, { color: 'faint', dash: true });
          const E = R[which.value === 'ada' ? 'ada' : which.value === 'rms' ? 'rms' : 'adam'].re;
          sE.path(E.map((r, i) => [i + 1, lg(r[0], -12)]), { color: 'orange', width: 2 });
          sE.path(E.map((r, i) => [i + 1, lg(r[1], -12)]), { color: 'pink', width: 2 });
          sE.hline(Math.log10(0.9 / a), { color: 'red', dash: true, width: 1 });
          info = { first: R.adamNo.first, firstC: R.adamYes.first, eta, fx: R.gd.f[N], fa: R.ada.f[N], fr: R.rms.f[N], fd: R.adam.f[N] };
        });
        v.legend([['red', 'gradient descent'], ['teal', 'AdaGrad'], ['purple', 'RMSProp'], ['accent', 'Adam'], ['orange', 'rate for $x$ (steep)'], ['pink', 'rate for $y$ (flat)']]);
        v.readout(() => info && String.raw`after 100 steps, $f/f_0$: GD $${v.sci(info.fx, 2)}$, AdaGrad $${v.sci(info.fa, 2)}$, RMSProp $${v.sci(info.fr, 2)}$, Adam $${v.sci(info.fd, 2)}$` + `\n` +
          String.raw`Adam's first step has length **${v.fix(info.firstC, 3)}** with correction ($\approx\eta=${v.fix(info.eta, 3)}$ per coordinate, so $\sqrt2\,\eta=${v.fix(Math.SQRT2 * info.eta, 3)}$) and **${v.fix(info.first, 3)}** without ($\approx\sqrt2\cdot3.16\,\eta$); the red dashed line in the right panel is GD's single rate $0.9/a$`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.6
    {
      num: '4.6',
      kind: 'Phenomenon',
      name: 'Saddle points dominate in high dimensions',
      statement: String.raw`At a critical point of a smooth function of $d$ variables the Hessian has $d$ real eigenvalues, and the point is a local minimum only if all are $\ge0$. If the signs of the eigenvalues behaved like independent fair coin flips, a critical point would be a minimum with probability about $2^{-d}$; the rest are saddles with at least one escape direction, or maxima. For smooth random Gaussian fields this picture is quantitatively right: critical points at a high loss level are overwhelmingly saddles, minima occur only near the bottom of the landscape, and the fraction of negative eigenvalues falls steadily as the loss falls (Bray–Dean 2007; carried to neural networks by Dauphin et al. 2014 and Choromanska et al. 2015, with the caveat that real networks are not Gaussian fields).`,
      idea: String.raw`A random symmetric matrix of size $d$ has semicircle-distributed eigenvalues, so shifting it by $s\,I$ (read $s$ as how far down the loss is: a lower critical point has a more positive-definite Hessian) leaves a fixed fraction of negative eigenvalues until $s$ reaches the edge of the spectrum; being positive-definite at all $d$ of them at once is a large-deviation event whose probability falls exponentially in $d$ at fixed $s$. Hence in high dimensions a gradient method that stalls on a plateau of small gradient is far more likely to be at a saddle than at a bad local minimum. The right panel is the generic escape: along the unstable direction the distance from the saddle grows like $(1+\eta b)^k$, so the dwell time is only logarithmic in the starting offset.`,
      caption: String.raw`**Left (a model, not a trained network):** Monte-Carlo estimate (600 random Hessians per dimension) of the probability that a random symmetric matrix $H+s\,I$ is positive definite, against dimension $d$, with the coin-flip reference $2^{-d}$. Slide the shift $s$ up (a lower critical point) and the minima come back. Hollow dots mean none of the 600 samples was positive definite. **Right:** gradient descent on $f=\tfrac12x^2-\tfrac b2y^2+\tfrac14y^4$ from $(1,\delta)$: the path lingers at the saddle for a time that grows like $\log(1/\delta)$.`,
      deps: ['opt-7.4'],
      refs: ['Prince §6.1', 'Goodfellow §8.2'],
      tags: ['saddle points', 'Hessian', 'random matrices'],
      credit: 'Bray & Dean, 2007; Dauphin et al., 2014',
      scope: String.raw`A heuristic supported by random-field theory and experiments on small networks; a rigorous statement for realistic networks is not known, and the Gaussian model ignores the structure of real Hessians.`,
      links: { doi: 'https://doi.org/10.1103/PhysRevLett.98.150201', arxiv: 'https://arxiv.org/abs/1406.2572' },
      viz(v) {
        const shift = v.slider('shift $s$', 0, 2.2, 0.6, { step: 0.05 });
        const dlt = v.slider('start offset $\\delta$ from the saddle', 1e-8, 0.1, 1e-4, { log: true, sig: 1 });
        const seed = { v: 1 }; v.button('resample', () => { seed.v++; });
        const NS = 600, DMAX = 14;
        const sM = v.stage({ x: [0.5, DMAX + 0.5], y: [-3.4, 0.2], height: 320, axes: 'box', gutter: true, xlabel: 'dimension $d$', ylabel: '$P(H+sI\\succ0)$', weight: 1, minWidth: 280, title: 'minima become rare (random Hessians)' });
        sM.setTicks([[2, '2'], [4, '4'], [6, '6'], [8, '8'], [10, '10'], [12, '12'], [14, '14']], log10Ticks(-3, 0, 1));
        const sD = v.stage({ x: [-0.3, 1.2], y: [-1.6, 1.6], height: 320, axes: 'box', gutter: true, xlabel: '$x$', ylabel: '$y$', weight: 0.8, minWidth: 250, title: 'escape along the unstable direction' });
        const bB = 0.5, eta = 0.1, cc = 1, ymin = Math.sqrt(bB / cc);
        const mc = memo();
        const prob = (s, sd) => mc(s.toFixed(3) + '|' + sd, () => {
          const r = rand(hashStr('goe' + sd)), out = [];
          for (let d = 1; d <= DMAX; d++) {
            let c = 0;
            for (let t = 0; t < NS; t++) {
              const H = Array.from({ length: d }, () => new Array(d).fill(0));
              for (let i = 0; i < d; i++) for (let j = i; j < d; j++) { const g = r.normal(); H[i][j] = H[j][i] = i === j ? g * Math.sqrt(2 / d) : g / Math.sqrt(d); }
              for (let i = 0; i < d; i++) H[i][i] += s;
              const ev = v.M.eigSym(H).values; if (Math.min(...ev) > 0) c++;
            }
            out.push(c / NS);
          }
          return out;
        });
        let info = null;
        v.render(() => {
          const P = prob(shift.value, seed.v), fl = 0.5 / NS;
          sM.path(Array.from({ length: DMAX }, (_, i) => [i + 1, lg(Math.pow(2, -(i + 1)), -3.3)]), { color: 'muted', dash: true, width: 1.3 });
          sM.path(P.map((p, i) => [i + 1, lg(p || fl, -3.3)]), { color: 'accent', width: 1.6 });
          P.forEach((p, i) => sM.dot(i + 1, lg(p || fl, -3.3), { r: 4, color: p ? 'accent' : 'red', hollow: !p }));
          // escape dynamics
          const f = (x, y) => 0.5 * x * x - 0.5 * bB * y * y + 0.25 * cc * y ** 4;
          let x = 1, y = dlt.value; const pts = [[x, y]], ys = []; let esc = null;
          for (let k = 1; k <= 2500; k++) {
            const gx = x, gy = -bB * y + cc * y ** 3; x -= eta * gx; y -= eta * gy; pts.push([x, y]); ys.push(y);
            if (esc == null && Math.abs(y) > 0.5 * ymin) esc = k;
            if (k > (esc || 0) + 60 && esc) break;
          }
          sD.contour(f, [-0.06, -0.03, -0.01, 0.0, 0.05, 0.2, 0.5, 1.0].filter((l) => true), { color: 'muted', width: 0.8, alpha: 0.5, res: 120 });
          sD.path(pts, { color: 'accent', width: 1.8 });
          sD.dot(0, 0, { r: 5, color: 'red', label: 'saddle', labelPos: 'se' }); sD.dot(0, ymin, { r: 4, color: 'green' }); sD.dot(0, -ymin, { r: 4, color: 'green' });
          sD.dot(1, dlt.value, { r: 4.5, color: 'gold' });
          info = { P, esc, pred: Math.log(0.5 * ymin / dlt.value) / Math.log(1 + eta * bB) };
        });
        v.legend([['accent', 'estimate'], ['muted', '$2^{-d}$ (independent signs)', { dash: true }]]);
        v.readout(() => info && String.raw`$s=${v.fix(shift.value, 2)}$: $P(\text{minimum})$ is ${v.fix(info.P[0], 2)} at $d=1$, ${v.fix(info.P[4], 3)} at $d=5$, ${v.fix(info.P[9], 3)} at $d=10$, ${v.fix(info.P[13], 3)} at $d=14$ (coin flips: ${v.fix(1 / 32, 3)}, ${v.fix(1 / 1024, 4)}, ${v.fix(1 / 16384, 5)} at 5, 10, 14)` + `\n` +
          String.raw`escape: $\delta=${v.sci(dlt.value, 1)}$ → leaves the saddle (|y| reaches half the minimum's height) after **${info.esc ?? '> 2500'} steps**; the growth law $(1+\eta b)^k$ predicts $${v.fix(info.pred, 0)}$`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.7
    {
      num: '4.7',
      kind: 'Theorem',
      name: 'Gradient descent almost surely avoids strict saddles',
      statement: String.raw`Let $f:\R^d\to\R$ be $C^2$ with $L$-Lipschitz gradient, and let every saddle be **strict**: at each critical point that is not a local minimum the Hessian has a negative eigenvalue. Run $\theta_{k+1}=\theta_k-\eta\nabla f(\theta_k)$ with $\eta<1/L$. Then the set of initial points from which the iterates converge to a strict saddle has Lebesgue measure zero. Consequently, for almost every initialization, if the iterates converge at all, they converge to a local minimum.`,
      idea: String.raw`The gradient map $g(\theta)=\theta-\eta\nabla f(\theta)$ is a diffeomorphism when $\eta<1/L$ (its Jacobian $I-\eta\nabla^2f$ is invertible). Points attracted to a strict saddle $p$ lie on its **stable manifold**, which by the stable manifold theorem (ode-6.4), applied to $g$ at the fixed point $p$, is locally a smooth manifold tangent to the eigenvectors of $\nabla^2f(p)$ with nonnegative eigenvalues, hence of dimension at most $d-1$ because one eigenvalue is negative. Taking preimages under the diffeomorphism $g$ of a countable cover of such pieces gives a countable union of lower-dimensional sets, which has measure zero.`,
      caption: String.raw`A two-dimensional loss with a strict saddle at the origin, $f=\tfrac12x^2-\tfrac12y^2+\tfrac14y^4+0.3x^2y+0.05x^4$. The map shows where gradient descent ($\eta=0.2$) ends from each starting point: blue below, orange above the saddle's stable manifold, which is the red curve (computed by running the gradient flow backwards from the saddle). Drag the gold start point: only starts exactly on the curve are caught. Scatter $N$ random starts and slide $k$ to watch the cloud leave the saddle.`,
      deps: ['deep-4.6', 'ode-6.4'],
      refs: ['Goodfellow §8.2'],
      tags: ['saddle points', 'stable manifold', 'measure zero'],
      credit: 'Lee, Simchowitz, Jordan & Recht, 2016 (COLT); Lee, Panageas, Piliouras, Simchowitz, Jordan & Recht, 2019 (Math. Programming)',
      scope: String.raw`Almost-sure avoidance says nothing about speed: the escape time can be exponential in the dimension (Du et al. 2017), and a noiseless run can spend long near a saddle (4.6).`,
      links: { doi: 'https://doi.org/10.1007/s10107-019-01374-3', arxiv: 'https://arxiv.org/abs/1602.04915' },
      viz(v) {
        const nS = v.slider('number of random starts $N$', 20, 1200, 300, { int: true, log: true, sig: 2 });
        const kS = v.slider('step $k$', 0, 150, 12, { int: true });
        const seed = { v: 1 }, eta = 0.2, R = 1.4;
        v.button('resample', () => { seed.v++; });
        const s = v.stage({ x: [-R, R], y: [-R, R], equal: true, height: 400, axes: 'box', gutter: true, xlabel: '$x$', ylabel: '$y$', full: false, title: 'where gradient descent ends, by starting point' });
        const fx = (x, y) => x + 0.6 * x * y + 0.2 * x ** 3, fy = (x, y) => -y + y ** 3 + 0.3 * x * x;
        const step = (p) => [p[0] - eta * fx(p[0], p[1]), p[1] - eta * fy(p[0], p[1])];
        const end = (x, y, T = 500) => { let p = [x, y]; for (let k = 0; k < T; k++) { p = step(p); if (!isFinite(p[0]) || Math.abs(p[0]) > 50) return 2; } return Math.hypot(p[0], p[1]) < 0.15 ? 0 : p[1] > 0 ? 1 : -1; };
        const H = s.handle(0.5, 0.18, { color: 'gold', r: 8 });
        // stable manifold: backward gradient flow from the saddle along ±x
        const manifold = (() => {
          const out = [];
          for (const sg of [1, -1]) {
            let p = [sg * 1e-3, 0.3e-6 * 0 + 1e-9], arc = [[0, 0], p];
            for (let k = 0; k < 60000; k++) { p = [p[0] + 0.0005 * fx(p[0], p[1]), p[1] + 0.0005 * fy(p[0], p[1])]; if (Math.abs(p[0]) > R || Math.abs(p[1]) > R) break; if (k % 20 === 0) arc.push(p); }
            out.push(arc);
          }
          return out;
        })();
        const rs = memo(), cl = memo();
        let info = null;
        v.render(() => {
          s.raster((x, y) => { const e = end(x, y, 300); return e === 1 ? v.rgb('orange').map((c, i) => (i < 3 ? c : 0.55)) : e === -1 ? v.rgb('blue').map((c, i) => (i < 3 ? c : 0.55)) : e === 0 ? v.rgb('red') : null; }, { res: 4, key: 'basin' });
          for (const m of manifold) s.path(m, { color: 'red', width: 1.8 });
          s.dot(0, 0, { r: 5, color: 'red', hollow: false, label: 'saddle', labelPos: 'ne' });
          const C = cl(nS.value + '|' + seed.v, () => {
            const r = rand(hashStr('cloud' + seed.v)), pts = [];
            for (let i = 0; i < nS.value; i++) { let p = [r.uniform(-1.3, 1.3), r.uniform(-1.3, 1.3)], tr = [p]; for (let k = 0; k < 150; k++) { p = step(p); tr.push(p); } pts.push({ tr, e: end(tr[0][0], tr[0][1], 400) }); }
            return pts;
          });
          const kk = kS.value; let escaped = 0, near = 0;
          for (const c of C) { if (c.e === 1 || c.e === -1) escaped++; else near++; }
          s.dots(C.map((c) => c.tr[kk]), { r: 2.6, color: 'ink', alpha: 0.75 });
          // the handle's trajectory
          let p = [H.x, H.y]; const tr = [p]; for (let k = 0; k < 400; k++) { p = step(p); tr.push(p); }
          s.path(tr, { color: 'gold', width: 1.6 });
          const e = end(H.x, H.y, 400);
          // distance of the handle from the manifold
          let dm = Infinity; for (const m of manifold) for (const q of m) dm = Math.min(dm, Math.hypot(q[0] - H.x, q[1] - H.y));
          info = { escaped, N: C.length, near, e, dm, fx0: tr[0] };
        });
        v.legend([['orange', 'ends in the upper minimum'], ['blue', 'ends in the lower minimum'], ['red', 'stable manifold of the saddle'], ['gold', 'your start and its path']]);
        v.readout(() => info && String.raw`${info.escaped} of ${info.N} random starts end in a minimum, ${info.near} are still within 0.15 of the saddle after 400 steps (expected: none; the set of such starts has probability 0)` + `\n` +
          String.raw`gold start $(${mnus(H.x.toFixed(3))},${mnus(H.y.toFixed(3))})$: ends ${info.e === 0 ? '**at the saddle** (it sits on the stable manifold)' : info.e === 2 ? 'diverging' : 'in the ' + (info.e > 0 ? 'upper' : 'lower') + ' minimum'}; its distance to the red curve is ${v.sci(Math.max(info.dm, 1e-12), 2)}`);
      },
    },
  ],
};
