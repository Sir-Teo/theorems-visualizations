// Deep Learning Theory — Chapter 4: Optimization for training (items 4.8–4.11; 4.2–4.7 in ch04.js)
//
// Items 4.9–4.11 run real training of small networks inside the page (tanh multilayer perceptrons from ch01.shared.js);
// the numbers on screen are measured on those runs, not quoted from the papers. Item 4.8 uses the scalar deep linear
// network, where the whole landscape can be drawn.
import { clamp, mnus, memo, rand, hashStr, makeNet, predict, toyData, makeTrainer, lossGrad, zeroGrad, accuracy, getParams, setParams, lossGradFlat, sharpness, log10Ticks, lg } from './ch04.shared.js';

export default {
  collection: 'deep',
  chapter: 4,
  items: [
    // ───────────────────────────────────────────────────────────── 4.8
    {
      num: '4.8',
      kind: 'Theorem',
      name: 'Deep linear networks have no bad local minima',
      statement: String.raw`Consider the squared loss $L(W_1,\dots,W_H)=\tfrac12\|W_H\cdots W_1X-Y\|_F^2$ of a **linear** network, write $X\in\R^{d_x\times m}$,$Y\in\R^{d_y\times m}$ with $d_y\le d_x$, and assume $XX^{\top}$ and $XY^{\top}$ have full rank (with $Y X^{\top}(XX^{\top})^{-1}XY^{\top}$ having distinct eigenvalues). Then $L$ is non-convex (and non-concave) once $H\ge2$, yet **every local minimum is a global minimum**, and every critical point that is not a global minimum is a saddle. For a single hidden layer ($H=2$) each such saddle has a Hessian with a negative eigenvalue (a strict saddle); for three or more weight matrices some saddles have a positive semi-definite Hessian, so second-order information at them is inconclusive.`,
      idea: String.raw`This is a rank-constrained factorization problem: an internal bottleneck can prevent the product from representing the unconstrained least-squares solution, so ordinary convexity in the product alone does not prove the theorem. Kawaguchi's argument divides local-minimum candidates by the ranks of partial products. Full-rank cases yield either ordinary least squares or its projection onto the leading eigenspace of $\Sigma$. Rank-deficient cases admit arbitrarily small loss-preserving perturbations that raise the partial-product ranks and reduce to those cases. The Hessian analysis then distinguishes strict and flat saddles. These are the three cases in §4.3.1, not a claim that every rank-deficient critical point has an immediate descending tangent.`,
      caption: String.raw`The smallest case: scalar weights, $L=\tfrac12(w_L\cdots w_1-c)^2$ for the single data pair $(x,y)=(1,c)$. Thirty gradient-descent runs start from Gaussian weights of scale $\rho$. Left (two weights): the green curve $w_1w_2=c$ consists of global minima. Successful runs approach it, but finite-step gradient descent can stall or diverge; the theorem gives no convergence rate. Shrink $\rho$ and paths slow near the saddle at the origin. Right: loss curves, one per run. With three weights the origin is a saddle with a *zero* Hessian, so small starts stall for much longer.`,
      deps: ["deep-4.6","ladr-7.70"],
      see: ['deep-10.2'],
      refs: ['Kawaguchi, Deep Learning without Poor Local Minima, arXiv 1605.07110v3, Theorem 2.3 / Corollary 2.4 pp. 2–3; complete proof sketch §4.3 pp. 7–8'],
      tags: ['deep linear networks', 'saddle points', 'landscape'],
      credit: 'Kawaguchi, 2016 (general-depth theorem)',
      scope: String.raw`Linear networks only (the product is a linear map, so depth adds no expressive power); the theorem does not transfer to nonlinear networks, which can have bad local minima.`,
      links: { arxiv: 'https://arxiv.org/abs/1605.07110' },
      viz(v) {
        const depth = v.select('number of weights', [{ value: 2, label: '2: $w_2w_1$' }, { value: 3, label: '3: $w_3w_2w_1$' }], 2);
        const cS = v.slider('target $c$', 0.3, 2, 1, { step: 0.05 });
        const rho = v.slider('initial scale $\\rho$', 0.01, 1.5, 0.5, { log: true, sig: 2 });
        const seed = { v: 1 }; v.button('resample starts', () => { seed.v++; });
        const M = 30, T = 1200, eta = 0.05, R = 2.2;
        const sW = v.stage({ x: [-R, R], y: [-R, R], equal: true, height: 360, axes: 'box', gutter: true, xlabel: '$w_1$', ylabel: '$w_2$', weight: 1, minWidth: 270, title: 'weight plane (first two weights)' });
        const sL = v.stage({ x: [0, T], y: [-8.5, 0.7], height: 360, axes: 'box', gutter: true, xlabel: 'step', ylabel: '$\\log_{10}$ loss', weight: 1, minWidth: 270, title: 'loss of each run' });
        sL.setTicks(undefined, log10Ticks(-8, 0, 2));
        const mc = memo();
        let info = null;
        v.render(() => {
          const D = depth.value, c = cS.value, rh = rho.value;
          const runs = mc(D + '|' + c + '|' + rh + '|' + seed.v, () => {
            const r = rand(hashStr('lin' + seed.v)), out = [];
            for (let m = 0; m < M; m++) {
              const w = Array.from({ length: D }, () => r.normal() * rh), tr = [w.slice(0, 2)], loss = []; let hit = null;
              for (let t = 0; t <= T; t++) {
                let P = 1; for (const x of w) P *= x;
                const e = P - c, L = 0.5 * e * e; loss.push(L);
                if (hit == null && L < 1e-3) hit = t;
                if (t === T || !isFinite(L) || L > 1e6) { if (!isFinite(L) || L > 1e6) hit = hit ?? -1; break; }
                const g = w.map((_, i) => { let q = 1; for (let j = 0; j < D; j++) if (j !== i) q *= w[j]; return e * q; });
                for (let i = 0; i < D; i++) w[i] -= eta * g[i];
                if (t % 4 === 3) tr.push(w.slice(0, 2));
              }
              out.push({ tr, loss, hit, fin: loss[loss.length - 1] });
            }
            return out;
          });
          if (D === 2) for (const sg of [1, -1]) sW.curve((t) => [sg * t, c / (sg * t)], 0.1, 8, { color: 'green', width: 2.2, n: 200 });
          sW.dot(0, 0, { r: 5, color: 'red', label: 'saddle', labelPos: 'ne' });
          const col = (r) => (r.fin < 1e-3 ? 'accent' : !isFinite(r.fin) || r.fin > 1e3 ? 'red' : 'gold');
          sW.clip(() => { for (const r of runs) { sW.path(r.tr, { color: col(r), width: 1.2, alpha: 0.8 }); sW.dot(r.tr[0][0], r.tr[0][1], { r: 2.6, color: 'ink' }); } });
          const xmax = clamp(Math.max(...runs.map((r) => (r.hit != null && r.hit >= 0 ? r.hit : T))) * 1.15, 100, T);
          sL.setView([0, xmax], [-8.5, 0.7]);
          for (const r of runs) sL.path(r.loss.map((l, t) => [t, lg(l, -9)]), { color: col(r), width: 1.2, alpha: 0.8 });
          const done = runs.filter((r) => r.fin < 1e-3).length, hits = runs.map((r) => r.hit).filter((h) => h != null && h >= 0).sort((a, b) => a - b);
          info = { done, M, median: hits.length ? hits[Math.floor(hits.length / 2)] : null, stuck: runs.filter((r) => r.fin >= 1e-3 && isFinite(r.fin) && r.fin < 1e3).length, bad: runs.filter((r) => !isFinite(r.fin) || r.fin > 1e3).length };
        });
        v.legend([['accent', 'reached loss < $10^{-3}$'], ['gold', 'still on a plateau at the end'], ['green', '$w_1w_2=c$ (global minima)'], ['red', 'saddle / diverged']]);
        v.readout(() => info && String.raw`${info.done} of ${info.M} runs reach loss below $10^{-3}$ within ${T} steps${info.median != null ? ' (median ' + info.median + ' steps)' : ''}; ${info.stuck} still on the plateau, ${info.bad} diverged; the theorem excludes non-global minima; this finite run does not certify convergence` + `\n` +
          (depth.value === 2 ? String.raw`Hessian at the saddle $0$: eigenvalues $\pm c=\pm${v.fix(cS.value, 2)}$ (one negative: a strict saddle)` : String.raw`Hessian at the saddle $0$: **all zero** (every entry is a product containing a weight), so it gives no escape direction; the loss still falls, but only along the cubic terms`));
      },
    },
    // ───────────────────────────────────────────────────────────── 4.9
    {
      num: '4.9',
      kind: 'Phenomenon',
      name: 'Edge of stability',
      statement: String.raw`Train a neural network by **full-batch** gradient descent with a fixed step $\eta$ and track the **sharpness** $\lambda_{\max}(\nabla^2L(\theta_k))$. Cohen et al. (2021) observed on standard architectures and losses that (i) *progressive sharpening*: the sharpness keeps rising during training until it reaches $2/\eta$; (ii) at that value it stops and **hovers just at or above $2/\eta$**, the threshold of local stability (4.2), instead of the descent lemma's regime $\lambda_{\max}<2/\eta$; and (iii) the training loss still falls over long times, but non-monotonically, with short spikes. Classical analyses, which assume $\eta\lambda_{\max}<2$ throughout, do not describe this regime.`,
      idea: String.raw`Below the threshold gradient descent is a stable contraction in every Hessian direction and, in a neural network, descent tends to move toward regions where the curvature along the path grows. Once $\lambda_{\max}$ reaches $2/\eta$ the corresponding direction starts to oscillate with growing amplitude (4.2); the oscillation moves the iterate along the cubic and higher terms of the loss in a way that pushes the sharpness back down, a self-stabilizing feedback. The loss then decreases only on average. Why sharpening occurs at all, and the dynamics of the self-stabilization, are the subject of ongoing theory (e.g. Damian, Nichani and Lee 2023); here the effect is demonstrated, not proved.`,
      caption: String.raw`A tanh network (1-24-24-1, 673 parameters) fits 12 points of a curve by full-batch gradient descent with squared error. The sharpness is the top eigenvalue of the true Hessian, found by power iteration with Hessian–vector products. Choose a step size: for $\eta=0.05$ the sharpness is still rising at the end; for $\eta=0.16$ and $0.22$ it climbs to the dashed line $2/\eta$ and stays there while the loss spikes. Drag the step slider to replay and see the fit.`,
      deps: ['deep-4.2', 'opt-7.4'],
      refs: ['Prince §20.3'],
      tags: ['sharpness', 'full-batch training', 'learning rate'],
      credit: 'Cohen, Kaur, Li, Kolter & Talwalkar, 2021',
      scope: String.raw`Empirical: seen for full-batch gradient descent on many architectures and losses; this toy run reproduces the qualitative effect (sharpness plateau at $2/\eta$, non-monotone loss) on a very small problem, not the quantitative curves of the paper.`,
      links: { arxiv: 'https://arxiv.org/abs/2103.00065' },
      viz(v) {
        const etaS = v.select('step size $\\eta$', [{ value: 0.05, label: '0.05' }, { value: 0.12, label: '0.12' }, { value: 0.16, label: '0.16' }, { value: 0.22, label: '0.22' }], 0.16);
        const T = 1500, SNAP = 25;
        const kS = v.slider('replay step', 0, T, T, { int: true });
        const sLo = v.stage({ x: [0, T], y: [-3, 0.2], height: 280, axes: 'box', gutter: true, xlabel: 'step', ylabel: '$\\log_{10}$ loss', weight: 1, minWidth: 250, title: 'training loss' });
        const sSh = v.stage({ x: [0, T], y: [0, 30], height: 280, axes: 'box', gutter: true, xlabel: 'step', ylabel: 'sharpness $\\lambda_{\\max}$', weight: 1, minWidth: 250, title: 'sharpness against $2/\\eta$' });
        const sFit = v.stage({ x: [-1, 1], y: [-1.5, 1.5], height: 280, axes: 'box', gutter: true, xlabel: '$x$', ylabel: 'output', weight: 0.9, minWidth: 230, title: 'the fit at the chosen step' });
        sLo.setTicks(undefined, log10Ticks(-3, 0, 1));
        const n = 12, data = { X: [], Y: [] };
        for (let i = 0; i < n; i++) { const x = -1 + (2 * (i + 0.5)) / n; data.X.push([x]); data.Y.push(0.8 * Math.sin(3 * x) + 0.5 * Math.cos(7 * x)); }
        const target = (x) => 0.8 * Math.sin(3 * x) + 0.5 * Math.cos(7 * x);
        const mc = memo(), work = makeNet([1, 24, 24, 1], { act: 'tanh', seed: 3 });
        const run = (eta) => mc(eta, () => {
          const net = makeNet([1, 24, 24, 1], { act: 'tanh', seed: 3 }), g = zeroGrad(net), p = getParams(net), gr = new Float64Array(p.length), st = {};
          const loss = [], lam = [], snaps = [];
          for (let t = 0; t <= T; t++) {
            setParams(net, p); const L = lossGradFlat(net, data, 'mse', g, gr);
            loss.push(L); lam.push(sharpness(net, data, 'mse', st, t === 0 ? 30 : 3));
            if (t % SNAP === 0) snaps.push(Float64Array.from(p));
            for (let i = 0; i < p.length; i++) p[i] -= eta * gr[i];
          }
          return { loss, lam, snaps };
        });
        let info = null;
        v.render(() => {
          const eta = etaS.value, R = run(eta), k = kS.value, thr = 2 / eta;
          sLo.path(R.loss.map((l, t) => [t, lg(l, -3)]), { color: 'accent', width: 1.6 });
          sLo.vline(k, { color: 'gold', width: 1.4 });
          sSh.setView([0, T], [0, Math.max(30, thr * 1.35)]);
          sSh.hline(thr, { color: 'red', dash: true, width: 1.6 });
          sSh.tex('2/\\eta', T * 0.9, thr, { color: 'red', dy: -10 });
          sSh.path(R.lam.map((l, t) => [t, l]), { color: 'orange', width: 1.6 });
          sSh.vline(k, { color: 'gold', width: 1.4 });
          setParams(work, R.snaps[Math.min(R.snaps.length - 1, Math.round(k / SNAP))]);
          sFit.fn(target, { color: 'faint', width: 1.4, dash: true, domain: [-1, 1] });
          const fnet = (x) => predict(work, [x], 'mse');
          sFit.fn(fnet, { color: 'accent', width: 2, domain: [-1, 1] });
          sFit.dots(data.X.map((x, i) => [x[0], data.Y[i]]), { r: 4, color: 'gold' });
          let ups = 0; for (let t = 1; t < R.loss.length; t++) if (R.loss[t] > R.loss[t - 1] * 1.001) ups++;
          const lamEnd = R.lam.slice(-200), mean = lamEnd.reduce((a, b) => a + b, 0) / lamEnd.length;
          info = { k, L: R.loss[k], lam: R.lam[k], thr, ups, mean, ratio: mean / thr };
        });
        v.legend([['accent', 'loss / network'], ['orange', 'sharpness'], ['red', '$2/\\eta$', { dash: true }], ['gold', 'replay step / data']]);
        v.readout(() => info && String.raw`step ${info.k}: loss $${v.sci(info.L, 2)}$, sharpness $${v.fix(info.lam, 2)}$ against $2/\eta=${v.fix(info.thr, 2)}$ (ratio ${v.fix(info.lam / info.thr, 2)})` + `\n` +
          String.raw`over the last 200 steps the mean sharpness is **${v.fix(info.mean, 2)}** = ${v.fix(info.ratio, 2)}$\times(2/\eta)$ · the loss went **up** on ${info.ups} of ${T} steps`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.10
    {
      num: '4.10',
      kind: 'Concept',
      name: 'Sharp and flat minima',
      statement: String.raw`A minimum $\theta^\star$ of the training loss is **flat** if the loss stays low in a large neighbourhood and **sharp** if it rises steeply nearby. Standard measures are the largest Hessian eigenvalue $\lambda_{\max}(\nabla^2L(\theta^\star))$, the trace, or the loss increase $\max_{\|\delta\|\le r}L(\theta^\star+\delta)-L(\theta^\star)$. The hypothesis (Hochreiter–Schmidhuber 1997; Keskar et al. 2017) is that flat minima generalize better and that small-batch SGD finds flatter minima than large-batch training. Caveat (Dinh et al. 2017): sharpness is **not invariant under reparametrization**. If a rescaling of the weights leaves the function the network computes unchanged, then it leaves the training and test errors unchanged but can make $\lambda_{\max}$ arbitrarily large, so any claim linking sharpness to generalization must fix the parametrization.`,
      idea: String.raw`Why flatness could matter: a minimum that tolerates perturbations of the weights tolerates the mismatch between the training and test losses, and flat regions can be described with fewer bits of precision (a minimum-description-length argument). Why SGD might favour flat minima: gradient noise scales as $\eta/B$, and sharp minima are unstable against large noise, so the noise kicks the iterate out of them. And why the concept is subtle: for a ReLU or linear layer pair $(a,b)\mapsto(\alpha a,b/\alpha)$ the function is unchanged while the curvature in some directions scales with $\alpha^2$ (the chain rule applied to a product of weights, as in 4.8).`,
      caption: String.raw`**Left:** the same small tanh classifier (2-24-24-2, 100 noisy "moons" points) trained 2 000 steps with SGD at $\eta=0.1$ and batch size 4, 16 or the full 100 (real runs, computed at first load). Curves: mean loss along eight random directions of relative size $\alpha\|\theta\|$, plus the measured top Hessian eigenvalue and test accuracy on 600 fresh points. **Right:** the model $f(x)=ab\,x$ fitted to $y=x$; every point $(a,1/a)$ of the valley $ab=1$ computes the same function, yet $\lambda_{\max}=a^2+b^2$ grows as you drag along the valley.`,
      deps: ['opt-7.10', 'deep-4.8'],
      refs: ['Prince §20.4'],
      tags: ['sharpness', 'generalization', 'batch size'],
      credit: 'Hochreiter & Schmidhuber, 1997; Keskar et al., 2017; Dinh et al., 2017',
      scope: String.raw`The relation between flatness and generalization is correlational and parametrization-dependent; in this toy comparison the runs differ little in sharpness and the smaller batches have not finished fitting, so it illustrates the measurement, not the generalization claim.`,
      links: { doi: 'https://doi.org/10.1162/neco.1997.9.1.1', arxiv: 'https://arxiv.org/abs/1609.04836' },
      viz(v) {
        const BS = [{ b: 4, color: 'teal', name: 'batch 4' }, { b: 16, color: 'orange', name: 'batch 16' }, { b: 0, color: 'red', name: 'full batch (100)' }];
        const sA = v.stage({ x: [-1.5, 1.5], y: [0, 2], height: 330, axes: 'box', gutter: true, xlabel: 'relative perturbation $\\alpha$ ($\\theta+\\alpha\\|\\theta\\|\\,d$)', ylabel: 'mean loss', weight: 1.1, minWidth: 290, title: 'loss along random directions' });
        const sB = v.stage({ x: [0, 3], y: [0, 3], equal: true, height: 330, axes: 'box', gutter: true, xlabel: '$a$', ylabel: '$b$', weight: 0.9, minWidth: 250, title: '$L(a,b)=\\tfrac12(ab-1)^2$' });
        const data = toyData('moons', 100, { noise: 0.3, seed: 1 }), test = toyData('moons', 600, { noise: 0.3, seed: 99 });
        const sizes = [2, 24, 24, 2];
        const mc = memo();
        const train = () => mc('t', () => BS.map((B) => {
          const net = makeNet(sizes, { act: 'tanh', seed: 5 }); makeTrainer(net, data, { head: 'ce', opt: 'sgd', mom: 0, lr: 0.1, batch: B.b, seed: 1 }).step(2000);
          const L0 = lossGrad(net, data.X, data.Y, 'ce', null, { noGrad: true }), p0 = getParams(net), nrm = Math.hypot(...p0), r = rand(77), probe = makeNet(sizes, { act: 'tanh', seed: 5 });
          const dirs = Array.from({ length: 8 }, () => { const z = Float64Array.from(p0, () => r.normal()); const zn = Math.hypot(...z); return z.map((x) => (x / zn) * nrm); });
          const al = Array.from({ length: 61 }, (_, i) => -1.5 + i / 20), curve = al.map((a) => { let s = 0; for (const d of dirs) { setParams(probe, p0.map((x, i) => x + a * d[i])); s += lossGrad(probe, data.X, data.Y, 'ce', null, { noGrad: true }); } return [a, s / dirs.length]; });
          const lam = sharpness(net, data, 'ce', {}, 40);
          return { curve, L0, lam, acc: accuracy(net, test) };
        }));
        const al = sB.handle(2.0, 0.5, { color: 'gold', r: 8, constrain: (x) => { const a = clamp(x, 0.34, 2.95); return [a, 1 / a]; } });
        let info = null;
        v.render(() => {
          const R = train();
          R.forEach((r, i) => sA.path(r.curve, { color: BS[i].color, width: 2 }));
          const f = (a, b) => 0.5 * (a * b - 1) ** 2;
          sB.contour(f, [0.02, 0.05, 0.12, 0.25, 0.5, 1, 2], { color: 'muted', width: 0.8, alpha: 0.55, res: 140 });
          sB.curve((t) => [t, 1 / t], 0.34, 2.95, { color: 'green', width: 2.4, n: 150 });
          sB.dot(al.x, al.y, { r: 6, color: 'gold' });
          sB.text(`(a,b) = (${al.x.toFixed(2)}, ${al.y.toFixed(2)})`, al.x, al.y, { dx: -12, dy: -16, size: 12, plate: true, align: 'right' });
          info = { R, lam: al.x * al.x + al.y * al.y };
        });
        v.legend([['teal', 'batch 4'], ['orange', 'batch 16'], ['red', 'full batch'], ['green', 'valley $ab=1$ (same function)']]);
        v.readout(() => info && info.R.map((r, i) => `**${BS[i].name}**: train loss ${v.fix(r.L0, 3)}, $\\lambda_{\\max}=${v.fix(r.lam, 2)}$, test accuracy ${v.fix(100 * r.acc, 1)}%`).join(' · ') + `\n` +
          String.raw`valley point $(a,b)=(${v.fix(al.x, 2)},${v.fix(al.y, 2)})$: the model computes $x\mapsto x$ for every $a$, loss $0$, but $\lambda_{\max}=a^2+b^2=${v.fix(info.lam, 2)}$ (minimum 2 at $a=b=1$)`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.11
    {
      num: '4.11',
      kind: 'Phenomenon',
      name: 'Mode connectivity',
      statement: String.raw`Two networks $\theta_1,\theta_2$ of the same architecture, trained from different random initializations to low loss, are typically **not** connected by a straight segment of low loss: the loss along $(1-t)\theta_1+t\theta_2$ rises over a barrier. But they can be joined by a simple curve, for instance a quadratic Bézier curve $\phi(t)=(1-t)^2\theta_1+2t(1-t)\theta_b+t^2\theta_2$ whose single bend point $\theta_b$ is trained to minimize the expected loss $\mathbb E_{t\sim U[0,1]}L(\phi(t))$, along which the training loss (and often the test loss) stays close to its value at the endpoints (Garipov et al. 2018; Draxler et al. 2018). Independent solutions lie in one connected low-loss region, not in isolated basins.`,
      idea: String.raw`If the minima were isolated pits, no low-loss path could connect them. That one extra trainable point suffices indicates a wide, high-dimensional valley whose floor is curved rather than straight. The straight-line barrier is largely a statement about parametrization: hidden units can be permuted, and averaging two networks whose units are matched in a different order mixes unrelated features. Both facts are consistent with a landscape of over-parametrized networks where the set of near-minimizers is a connected, curved manifold. The picture is empirical; Kuditipudi et al. (2019) give conditions under which it provably holds.`,
      caption: String.raw`Two tanh classifiers (2-12-12-2, 218 parameters) are trained with Adam from seeds 11 and 22 on 160 noisy "moons" points; then a Bézier bend point is trained as in the paper, with a slider replaying that training. Left: loss along the straight line (red) and along the curve (green) on a log scale. Right: the loss on the plane through $\theta_1$, $\theta_2$ and the final bend point (brighter = higher), with the two paths projected on it. Everything is training loss measured in your browser.`,
      deps: ['deep-4.10'],
      refs: ['Prince §20.3'],
      tags: ['loss landscape', 'mode connectivity', 'permutation symmetry'],
      credit: 'Garipov, Izmailov, Podoprikhin, Vetrov & Wilson, 2018; Draxler, Veschgini, Salmhofer & Hamprecht, 2018',
      scope: String.raw`Observed for the architectures and data sets in the papers (convolutional networks on CIFAR, ImageNet); in a network this small the barrier on the straight line is real but its height depends on the seeds.`,
      links: { arxiv: 'https://arxiv.org/abs/1802.10026' },
      viz(v) {
        const sizes = [2, 12, 12, 2], data = toyData('moons', 160, { noise: 0.15, seed: 1 });
        const ITS = 600, EVERY = 20;
        const work = makeNet(sizes, { act: 'tanh', seed: 1 }), gW = zeroGrad(work);
        const lossAt = (p) => { setParams(work, p); return lossGrad(work, data.X, data.Y, 'ce', null, { noGrad: true }); };
        const mc = memo();
        const setup = () => mc('s', () => {
          const tr = (seed) => { const net = makeNet(sizes, { act: 'tanh', seed }); makeTrainer(net, data, { head: 'ce', opt: 'adam', lr: 0.02, seed }).step(500); return getParams(net); };
          const A = tr(11), B = tr(22), N = A.length, C = new Float64Array(N), m = new Float64Array(N), s2 = new Float64Array(N), gr = new Float64Array(N), P = new Float64Array(N), r = rand(3);
          for (let j = 0; j < N; j++) C[j] = (A[j] + B[j]) / 2;
          const snaps = [Float64Array.from(C)];
          for (let it = 1; it <= ITS; it++) {
            const t = r(), b0 = (1 - t) ** 2, b1 = 2 * t * (1 - t), b2 = t * t;
            for (let j = 0; j < N; j++) P[j] = b0 * A[j] + b1 * C[j] + b2 * B[j];
            setParams(work, P); lossGradFlat(work, data, 'ce', gW, gr);
            for (let j = 0; j < N; j++) { const gj = gr[j] * b1; m[j] = 0.9 * m[j] + 0.1 * gj; s2[j] = 0.999 * s2[j] + 0.001 * gj * gj; C[j] -= (0.02 * (m[j] / (1 - 0.9 ** it))) / (Math.sqrt(s2[j] / (1 - 0.999 ** it)) + 1e-8); }
            if (it % EVERY === 0) snaps.push(Float64Array.from(C));
          }
          // plane through A, B and the final bend point
          const dAB = Float64Array.from(B, (x, j) => x - A[j]), len = Math.hypot(...dAB), e1 = dAB.map((x) => x / len);
          const w = Float64Array.from(C, (x, j) => x - A[j]); let dot = 0; for (let j = 0; j < N; j++) dot += w[j] * e1[j];
          const o = w.map((x, j) => x - dot * e1[j]), on = Math.hypot(...o), e2 = o.map((x) => x / on);
          return { A, B, snaps, e1, e2, len, N };
        });
        const sP = v.stage({ x: [-0.25, 1.25], y: [-0.8, 0.8], height: 340, axes: 'box', gutter: true, xlabel: 'along $\\theta_2-\\theta_1$ (units of $\\|\\theta_2-\\theta_1\\|$)', ylabel: 'towards the bend point', weight: 1, minWidth: 290, title: 'loss on the plane through the three points' });
        const sC = v.stage({ x: [0, 1], y: [-4, 0.5], height: 340, axes: 'box', gutter: true, xlabel: 'position $t$ on the path', ylabel: '$\\log_{10}$ training loss', weight: 1, minWidth: 260, title: 'loss along the two paths' });
        sC.setTicks(undefined, log10Ticks(-4, 0, 1));
        const kS = v.slider('bend training iteration', 0, ITS, ITS, { int: true });
        let info = null;
        v.render(() => {
          const S = setup(), { A, B, snaps, e1, e2, len, N } = S, k = Math.min(snaps.length - 1, Math.round(kS.value / EVERY)), C = snaps[k];
          const at = (x, y) => { const p = new Float64Array(N); for (let j = 0; j < N; j++) p[j] = A[j] + len * (x * e1[j] + y * e2[j]); return lossAt(p); };
          sP.heat((x, y) => lg(at(x, y), -4), { range: [-4, 0.5], cmap: 'viridis', res: 7, key: 'plane' });
          const TS = Array.from({ length: 61 }, (_, i) => i / 60);
          const bez = (t) => { const b0 = (1 - t) ** 2, b1 = 2 * t * (1 - t), b2 = t * t, p = new Float64Array(N); for (let j = 0; j < N; j++) p[j] = b0 * A[j] + b1 * C[j] + b2 * B[j]; return p; };
          const lin = (t) => Float64Array.from(A, (a, j) => (1 - t) * a + t * B[j]);
          const proj = (p) => { let x = 0, y = 0; for (let j = 0; j < N; j++) { const d = p[j] - A[j]; x += d * e1[j]; y += d * e2[j]; } return [x / len, y / len]; };
          sP.path(TS.map((t) => proj(lin(t))), { color: 'red', width: 2.4 });
          sP.path(TS.map((t) => proj(bez(t))), { color: 'green', width: 2.4 });
          sP.dot(0, 0, { r: 6, color: 'gold', label: '$\\theta_1$', labelPos: 'nw' }); sP.dot(1, 0, { r: 6, color: 'gold', label: '$\\theta_2$', labelPos: 'ne' });
          const lL = TS.map((t) => lossAt(lin(t))), lB = TS.map((t) => lossAt(bez(t)));
          sC.path(TS.map((t, i) => [t, lg(lL[i], -4)]), { color: 'red', width: 2 }); sC.path(TS.map((t, i) => [t, lg(lB[i], -4)]), { color: 'green', width: 2 });
          info = { mxL: Math.max(...lL), mxB: Math.max(...lB), end: Math.max(lL[0], lL[60]), k: kS.value };
        });
        v.legend([['red', 'straight line'], ['green', 'Bézier curve'], ['gold', 'trained networks']]);
        v.readout(() => info && String.raw`endpoints: worst training loss $${v.sci(info.end, 2)}$ · highest loss along the **straight line: ${v.fix(info.mxL, 3)}** · along the **curve (iteration ${info.k}): ${v.fix(info.mxB, 3)}**` + (info.mxB < 0.05 * info.mxL ? ` (${v.fix(info.mxL / info.mxB, 0)}× lower)` : ''));
      },
    },
  ],
};
