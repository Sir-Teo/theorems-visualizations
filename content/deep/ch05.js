// Deep Learning Theory — Chapter 5: Depth, initialization and normalization (items 5.1–5.5; 5.6–5.9 in ch05-b.js, 5.10–5.13 in ch05-c.js)
//
// Items 5.1–5.5 run honest random-network experiments inside the page (no training): the numbers on screen are measured on
// freshly sampled weights and compared with the mean-field prediction, which is computed by Gauss–Hermite quadrature.
import { clamp, mnus, memo, PHI, randomDeep, gauss1, qStar, corrMap, chi1, rand, hashStr, log10Ticks } from './ch05.shared.js';

/** Counts of values in nb equal bins over [lo, hi] as fractions of n (values outside are dropped). */
function binFrac(vals, lo, hi, nb, n = vals.length) {
  const edges = Array.from({ length: nb + 1 }, (_, i) => lo + ((hi - lo) * i) / nb), counts = new Array(nb).fill(0);
  for (const x of vals) { if (x < lo || x >= hi) continue; counts[Math.floor(((x - lo) / (hi - lo)) * nb)]++; }
  return { edges, counts: counts.map((c) => c / n) };
}
/** Axis range [lo, hi] (decades) for a log-scale panel from a list of positive numbers. */
function decades(vals, minSpan = 2) {
  let lo = Infinity, hi = -Infinity; for (const x of vals) if (x > 0 && isFinite(x)) { lo = Math.min(lo, x); hi = Math.max(hi, x); }
  if (!isFinite(lo)) { lo = 1e-3; hi = 1e3; }
  let a = Math.floor(Math.log10(lo) - 0.1), b = Math.ceil(Math.log10(hi) + 0.1); if (b - a < minSpan) b = a + minSpan;
  return [10 ** a, 10 ** b];
}
const sp = (x) => (Math.abs(x) >= 1e4 || (x !== 0 && Math.abs(x) < 1e-3) ? String.raw`${(x / 10 ** Math.floor(Math.log10(Math.abs(x)))).toFixed(1)}\times10^{${Math.floor(Math.log10(Math.abs(x)))}}` : x.toPrecision(3));

export default {
  collection: 'deep',
  chapter: 5,
  title: 'Depth, initialization and normalization',
  summary: String.raw`Backpropagation multiplies one Jacobian per layer, so gradients in deep networks shrink or blow up geometrically unless the weights are scaled just right. Variance-preserving initializations, the mean-field picture of signal propagation, and orthogonal initialization keep signals alive at initialization. Residual connections and normalization layers keep them alive during training: a residual network behaves like a discretized differential equation, and normalization makes the loss scale-invariant, which changes how the learning rate acts.`,
  items: [
    // ───────────────────────────────────────────────────────────── 5.1
    {
      num: '5.1',
      kind: 'Phenomenon',
      name: 'Vanishing and exploding gradients',
      statement: String.raw`In a depth-$L$ feedforward network $h_l=\phi(W_lh_{l-1})$ the gradient of a scalar loss with respect to the activations obeys the backward recursion $\delta_{l-1}=W_l^{\top}\bigl(\phi'(z_l)\odot\delta_l\bigr)$, so $\delta_0$ is the output gradient multiplied by a product of $L$ matrices $W_l^{\top}D_l$. For random weights of standard deviation $\sigma_w/\sqrt N$ the norm of $\delta_l$ changes, layer after layer, by a roughly constant factor $\sqrt{\chi}$ (for ReLU, $\chi=\sigma_w^2/2$; in general $\chi=\sigma_w^2\,\mathbb E\,\phi'(\sqrt{q^*}z)^2$). Hence the gradient reaching the first layer is of size $\chi^{L/2}$ times the gradient at the output: it **vanishes exponentially** if $\chi<1$ and **explodes exponentially** if $\chi>1$. With saturating activations such as the logistic sigmoid ($\phi'\le\tfrac14$) the factor is below $1$ for every ordinary weight scale, so vanishing is the rule.`,
      idea: String.raw`The product of many random matrices has a norm that grows or shrinks like $\rho^L$, with $\rho$ the typical per-layer gain; the gain is the weight scale $\sigma_w$ times the average slope of the activation, because the diagonal matrix $D_l=\mathrm{diag}\,\phi'(z_l)$ zeroes or damps part of each backward signal. The product rule of the chain rule (3.3) is what turns depth into an exponent, and the same exponent controls how quickly small perturbations of the input are amplified on the way forward (5.4). Hochreiter (1991) and Bengio–Simard–Frasconi (1994) analysed this obstruction for recurrent nets, where the same matrix is multiplied at every step (9.2).`,
      caption: String.raw`A random width-100 network at initialization, with weights of standard deviation $\sigma_w/\sqrt{100}$. Left: the root-mean-square gradient $\|\delta_l\|/\sqrt N$ at each layer on a log scale, back-propagated from a random unit-variance covector at the output (right edge); the dashed line is the mean-field prediction $(\sqrt\chi)^{\,L-l}$. Right: the size of the forward activations. Move $\sigma_w$ across the threshold $\chi=1$ ($\sigma_w=\sqrt2$ for ReLU, $1$ for tanh at small signal) and watch the slope change sign; with the sigmoid no setting of the slider gets $\chi$ near 1.`,
      deps: ['deep-3.3', 'deep-1.2'],
      refs: ['Prince §7.5', 'Goodfellow §8.2'],
      tags: ['gradients', 'depth', 'initialization'],
      credit: 'Hochreiter, 1991 (diploma thesis); Bengio, Simard & Frasconi, 1994',
      scope: String.raw`Statistical statement about random weights at initialization and large width; training changes the weights, and architectural fixes (residual connections 5.7, normalization 5.9, gating 9.3) change the picture.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Vanishing_gradient_problem', doi: 'https://doi.org/10.1109/72.279181' },
      viz(v) {
        const actS = v.select('activation', [{ value: 'relu', label: 'ReLU' }, { value: 'tanh', label: 'tanh' }, { value: 'sigmoid', label: 'sigmoid' }], 'relu');
        const sw = v.slider('weight scale $\\sigma_w$', 0.4, 3, 1, { step: 0.01 });
        const Ls = v.slider('depth $L$', 10, 100, 50, { int: true });
        const seed = { v: 1 }; v.button('resample weights', () => { seed.v++; });
        const sG = v.stage({ x: [0, 50], y: [1e-8, 1e2], ylog: true, height: 340, axes: 'box', gutter: true, xlabel: 'layer $l$ (input at 0, output at $L$)', ylabel: 'gradient rms', weight: 1.1, minWidth: 290, title: 'back-propagated gradient $\\|\\delta_l\\|/\\sqrt N$' });
        const sA = v.stage({ x: [0, 50], y: [1e-8, 1e2], ylog: true, height: 340, axes: 'box', gutter: true, xlabel: 'layer $l$', ylabel: 'activation rms', weight: 0.9, minWidth: 260, title: 'forward activations' });
        const mc = memo();
        let info = null;
        v.render(() => {
          const act = actS.value, L = Ls.value, s = sw.value, N = 100;
          const R = mc(act + '|' + s + '|' + L + '|' + seed.v, () => randomDeep({ N, L, act, cw: s * s, seed: hashStr('g' + seed.v + act) }));
          // mean-field: per-layer factor of the gradient, and the variance map of the forward signal
          let qs, chi;
          if (act === 'relu') { chi = s * s / 2; } else { qs = qStar(act, s * s, 0, 1); chi = chi1(act, s * s, qs); }
          const gain = Math.sqrt(chi);
          const gpred = (l) => gain ** (L - l);
          const q = [1]; for (let l = 1; l <= L; l++) q.push(act === 'relu' ? q[l - 1] * s * s / 2 : s * s * gauss1((z) => PHI[act].f(Math.sqrt(q[l - 1]) * z) ** 2));
          const gm = R.grad.map((x, l) => [l, x]), gp = Array.from({ length: L + 1 }, (_, l) => [l, gpred(l)]);
          const am = R.std.map((x, l) => [l, x]), ap = q.map((x, l) => [l, Math.sqrt(x)]);
          const yr = decades([...R.grad, ...gp.map((p) => p[1])], 3);
          sG.setView([0, L], yr); sG.hline(1, { color: 'faint', dash: true });
          sG.path(gp, { color: 'muted', dash: true, width: 1.6 });
          sG.path(gm, { color: 'accent', width: 2.2 });
          const ya = decades([...R.std, ...ap.map((p) => p[1])], 3);
          sA.setView([0, L], ya); sA.hline(1, { color: 'faint', dash: true });
          sA.path(ap, { color: 'muted', dash: true, width: 1.6 }); sA.path(am, { color: 'green', width: 2.2 });
          info = { chi, gain, g0: R.grad[0], meas: (R.grad[0] / R.grad[L]) ** (1 / L), L, s, act };
        });
        v.legend([['accent', 'measured gradient'], ['green', 'measured activations'], ['muted', 'mean-field prediction', { dash: true }]]);
        v.readout(() => info && String.raw`per-layer gradient factor: predicted $\sqrt\chi=${v.fix(info.gain, 3)}$, measured ${v.fix(info.meas, 3)}` + ` · after $L=${info.L}$ layers the first-layer gradient is $${sp(info.g0)}$ times the output gradient's size ` +
          (info.gain < 0.97 ? `(**vanishing**, $\\chi=${v.fix(info.chi, 2)}<1$)` : info.gain > 1.03 ? `(**exploding**, $\\chi=${v.fix(info.chi, 2)}>1$)` : `(near the critical $\\chi\\approx1$)`) +
          `\n` + (info.act === 'relu' ? String.raw`ReLU: $\chi=\sigma_w^2/2$, critical at $\sigma_w=\sqrt2$` : info.act === 'tanh' ? String.raw`tanh: $\chi=\sigma_w^2\,\mathbb E\,\phi'^2$ with the fixed-point variance $q^*$ of the forward signal; critical at $\sigma_w=1$` : String.raw`sigmoid: $\phi'\le1/4$ so $\chi\le\sigma_w^2/16$ — gradients vanish unless $\sigma_w$ is huge`));
      },
    },
    // ───────────────────────────────────────────────────────────── 5.2
    {
      num: '5.2',
      kind: 'Method',
      name: 'Xavier (Glorot) initialization',
      statement: String.raw`Initialize every weight of a layer with $n_{\rm in}$ inputs and $n_{\rm out}$ outputs independently with mean $0$ and variance
$$\operatorname{Var}(w)=\frac{2}{n_{\rm in}+n_{\rm out}}.$$
For Glorot uniform initialization, $w\sim U[-a,a]$ with
$$a=\sqrt{\frac{6}{n_{\rm in}+n_{\rm out}}}.$$
For centred, equal-variance inputs independent of the layer's zero-mean independent weights, $\operatorname{Var}(z_{\rm out})=n_{\rm in}\operatorname{Var}(w)\operatorname{Var}(h_{\rm in})$ going forward. The analogous independence approximation for backward signals gives $\operatorname{Var}(\delta_{\rm in})=n_{\rm out}\operatorname{Var}(w)\operatorname{Var}(\delta_{\rm out})$ going backward. Keeping the forward variance constant needs $\operatorname{Var}(w)=1/n_{\rm in}$, keeping the backward variance constant needs $1/n_{\rm out}$; the harmonic compromise above is Xavier's choice, and equals $1/n$ when the layers are square.`,
      idea: String.raw`Write one pre-activation as $z=\sum_i W_iH_i$. If the current weights are mutually independent, zero-mean, have common variance $s^2$, and are independent of the input vector, the products $W_iH_i$ are uncorrelated even when the $H_i$ are correlated. With finite second moments, variance addition for uncorrelated variables (prob-2.2.1) gives $\operatorname{Var}(z)=s^2\sum_i\mathbb E H_i^2$. For centred equal-variance inputs this is $ns^2\operatorname{Var}(H)$, the forward factor used here. The backward calculation uses the analogous independence approximation; dependence between backpropagated signals and weights can invalidate that simplification. Iterating the linear approximation multiplies variance by $(ns^2)^L$. For tanh near zero, preserving the input scale also avoids saturated tails, but tanh compresses: at square-layer Xavier scale the variance actually decays slowly. The nonlinear balance is the mean-field analysis in 5.4.`,
      caption: String.raw`A width-500 random network at initialization with weight variance $c/n$; $c=1$ is Xavier's choice for square layers. Left: histograms of the activations of layers 1, 10 and 50 of one input (fractions of units). Right: their rms against depth on a log scale, with the dashed mean-field prediction. For the linear activation $c=1$ preserves the variance exactly; $c=\tfrac12$ shrinks it by half each layer, $c=2$ doubles it. With tanh, $c<1$ collapses the signal to zero, $c>1$ pushes it into saturation at $\pm1$, and $c=1$ is the slow-decay compromise.`,
      deps: ['deep-5.1', 'prob-2.2.1'],
      refs: ['Goodfellow §8.4', 'Prince §7.5'],
      tags: ['initialization', 'variance', 'tanh'],
      credit: 'Glorot & Bengio, 2010',
      scope: String.raw`Derived for linear or tanh-like units in the small-signal regime; for ReLU the correct constant is twice as large (5.3).`,
      links: { pmlr: 'https://proceedings.mlr.press/v9/glorot10a.html' },
      viz(v) {
        const actS = v.select('activation', [{ value: 'linear', label: 'linear' }, { value: 'tanh', label: 'tanh' }], 'tanh');
        const cS = v.slider('variance scale $c$ (weights have variance $c/n$)', 0.25, 4, 1, { log: true, sig: 3 });
        const seed = { v: 1 }; v.button('resample weights', () => { seed.v++; });
        const L = 50, N = 500, shown = [1, 10, 50];
        const sH = v.stage({ x: [-2.5, 2.5], y: [0, 0.3], height: 330, axes: 'box', gutter: true, xlabel: 'activation $h$', ylabel: 'fraction of units', weight: 1, minWidth: 280, title: 'activations at layers 1, 10, 50' });
        const sR = v.stage({ x: [0, L], y: [1e-8, 1e3], ylog: true, height: 330, axes: 'box', gutter: true, xlabel: 'layer $l$', ylabel: 'activation rms', weight: 1, minWidth: 280, title: 'size of the signal against depth' });
        const mc = memo(); let info = null;
        const cols = ['accent', 'orange', 'green'];
        v.render(() => {
          const act = actS.value, c = cS.value;
          const R = mc(act + '|' + c + '|' + seed.v, () => randomDeep({ N, L, act, cw: c, seed: hashStr('x' + seed.v), keep: shown }));
          let ymax = 0;
          shown.forEach((l, i) => {
            const b = binFrac(R.kept[l], -2.5, 2.5, 40, N);
            sH.hist(b, { color: cols[i], fillAlpha: 0.22, outline: true }); ymax = Math.max(ymax, ...b.counts);
          });
          sH.setView([-2.5, 2.5], [0, Math.min(1, Math.max(0.2, ymax * 1.12))]);
          const q = [1]; for (let l = 1; l <= L; l++) q.push(act === 'linear' ? q[l - 1] * c : c * gauss1((z) => Math.tanh(Math.sqrt(q[l - 1]) * z) ** 2));
          const pred = q.map((x, l) => [l, Math.sqrt(x)]), meas = R.std.map((x, l) => [l, x]);
          sR.setView([0, L], decades([...R.std, ...pred.map((p) => p[1])], 3));
          sR.hline(1, { color: 'faint', dash: true });
          sR.path(pred, { color: 'muted', dash: true, width: 1.6 }); sR.path(meas, { color: 'accent', width: 2.2 });
          shown.forEach((l, i) => sR.dot(l, R.std[l], { r: 5, color: cols[i] }));
          sH.corner(act === 'tanh' ? 'tanh saturates at ±1' : 'linear units', 'tr', {});
          info = { std: shown.map((l) => R.std[l]), pred: shown.map((l) => Math.sqrt(q[l])), c };
        });
        v.legend([['accent', 'layer 1'], ['orange', 'layer 10'], ['green', 'layer 50'], ['muted', 'mean-field prediction (right)', { dash: true }]]);
        v.readout(() => info && String.raw`$c=${v.fix(info.c, 2)}$ · rms of the activations at layers 1 / 10 / 50: **${info.std.map((x) => v.sci ? '$' + v.sci(x, 2) + '$' : x.toExponential(1)).join(' / ')}**; mean-field prediction ${info.pred.map((x) => '$' + v.sci(x, 2) + '$').join(' / ')}` +
          `\n` + (info.std[2] < 0.05 ? `the signal has **vanished** by layer 50; the histogram is a spike at 0` : info.std[2] > 2.5 && actS.value === 'linear' ? `the signal has **exploded** (off the left panel)` : info.std[2] > 0.85 && actS.value === 'tanh' ? `most tanh units are **saturated** near ±1` : `the signal survives to layer 50`));
      },
    },
    // ───────────────────────────────────────────────────────────── 5.3
    {
      num: '5.3',
      kind: 'Method',
      name: 'He initialization for ReLU networks',
      statement: String.raw`For a ReLU network $h_l=\max(0,W_lh_{l-1})$ with zero-mean symmetric independent weights, $\mathbb E\,h^2=\tfrac12\operatorname{Var}(z)$ (ReLU keeps only the positive half of a symmetric variable), so
$$\operatorname{Var}(z_l)=\tfrac12\,n_{\rm in}\operatorname{Var}(w)\,\operatorname{Var}(z_{l-1}).$$
The forward signal is preserved by **He initialization**, $\operatorname{Var}(w)=2/n_{\rm in}$ (standard deviation $\sqrt{2/n_{\rm in}}$): in a depth-$L$ network the weight variance $c/n_{\rm in}$ multiplies the signal's variance by $(c/2)^L$. The Xavier choice $c=1$ therefore halves the variance at every layer, a factor $2^{-L}$ in total, and the backward signal behaves in the same way.`,
      idea: String.raw`The only change from the linear computation (5.2) is the factor $\tfrac12$ for the ReLU, which discards half of the units' squared mass; compensating by doubling the weight variance restores a gain of exactly 1 per layer. He et al. used this to train a 30-layer plain rectifier network from scratch, which with the Xavier constant stalled. The result is the zero-order version of the mean-field picture: at $\sigma_w^2=2$ ReLU networks sit on the edge of chaos for all inputs (5.4) because the ReLU is positively homogeneous.`,
      caption: String.raw`The same experiment for ReLU, width 500, 50 layers, three weight variances: Xavier's $1/n$ (red), He's $2/n$ (green) and a custom multiple $c/n$ of your choice (blue). Left: the rms of the activations after each layer on a log scale; the dashed lines are $(c/2)^{l/2}$. Right: the rms of the back-propagated gradient. The Xavier curve loses a factor $\sqrt2$ per layer in both directions, the He curve is flat to within sampling noise.`,
      deps: ['deep-5.2'],
      refs: ['Prince §7.5'],
      tags: ['initialization', 'ReLU', 'variance'],
      credit: 'He, Zhang, Ren & Sun, 2015',
      scope: String.raw`Exact in the infinite-width limit for fully connected ReLU layers without biases; a conservative statement for convolutional layers (use $n_{\rm in}=$ kernel size × input channels) and for networks with normalization or residual branches.`,
      links: { arxiv: 'https://arxiv.org/abs/1502.01852' },
      viz(v) {
        const cS = v.slider('custom variance scale $c$ (weights have variance $c/n$)', 0.3, 4, 1.5, { log: true, sig: 3 });
        const seed = { v: 1 }; v.button('resample weights', () => { seed.v++; });
        const L = 50, N = 500;
        const sF = v.stage({ x: [0, L], y: [1e-8, 1e6], ylog: true, height: 330, axes: 'box', gutter: true, xlabel: 'layer $l$', ylabel: 'activation rms', weight: 1, minWidth: 280, title: 'forward signal' });
        const sB = v.stage({ x: [0, L], y: [1e-8, 1e6], ylog: true, height: 330, axes: 'box', gutter: true, xlabel: 'layer $l$ (output at 50)', ylabel: 'gradient rms', weight: 1, minWidth: 280, title: 'backward signal' });
        const mc = memo(); let info = null;
        v.render(() => {
          const schemes = [['Xavier', 1, 'red'], ['He', 2, 'green'], ['custom', cS.value, 'accent']];
          const runs = schemes.map(([nm, c]) => mc(nm + '|' + c + '|' + seed.v, () => randomDeep({ N, L, act: 'relu', cw: c, seed: hashStr('h' + seed.v) })));
          const all = [];
          runs.forEach((R, i) => { all.push(...R.std, ...R.grad); const c = schemes[i][1]; all.push(((c / 2) ** (L / 2)), ((c / 2) ** (-L / 2))); });
          const yr = decades(all, 3);
          sF.setView([0, L], yr); sB.setView([0, L], yr);
          for (const s of [sF, sB]) s.hline(1, { color: 'faint', dash: true });
          schemes.forEach(([nm, c, col], i) => {
            const f = Math.sqrt(c / 2);
            sF.path(Array.from({ length: L + 1 }, (_, l) => [l, f ** l]), { color: col, dash: true, width: 1.2, alpha: 0.7 });
            sB.path(Array.from({ length: L + 1 }, (_, l) => [l, f ** (L - l)]), { color: col, dash: true, width: 1.2, alpha: 0.7 });
            sF.path(runs[i].std.map((x, l) => [l, x]), { color: col, width: 2.2 });
            sB.path(runs[i].grad.map((x, l) => [l, x]), { color: col, width: 2.2 });
          });
          info = { std: runs.map((R) => R.std[L]), grad: runs.map((R) => R.grad[0]), c: cS.value };
        });
        v.legend([['red', 'Xavier $c=1$'], ['green', 'He $c=2$'], ['accent', 'custom $c$'], ['muted', 'dashed: $(c/2)^{l/2}$ predictions', { dash: true }]]);
        v.readout(() => info && String.raw`rms activation at layer 50: Xavier $${sp(info.std[0])}$ · He $${sp(info.std[1])}$ · custom ($c=${v.fix(info.c, 2)}$) $${sp(info.std[2])}$` + `\n` +
          String.raw`gradient at layer 0 relative to the output: Xavier $${sp(info.grad[0])}$ · He $${sp(info.grad[1])}$ · custom $${sp(info.grad[2])}$ · Xavier loses $2^{-25}\approx3\times10^{-8}$ in rms over 50 layers`);
      },
    },
    // ───────────────────────────────────────────────────────────── 5.4
    {
      num: '5.4',
      kind: 'Concept',
      name: 'Signal propagation and the edge of chaos',
      statement: String.raw`Take a wide fully connected network with weights $\mathcal N(0,\sigma_w^2/N)$ and biases $\mathcal N(0,\sigma_b^2)$, and feed it two inputs. In the limit $N\to\infty$ the pre-activation variance $q_l$ obeys $q_{l+1}=\sigma_w^2\,\mathbb E\,\phi(\sqrt{q_l}z)^2+\sigma_b^2$, converging to a fixed point $q^*$, and the correlation $c_l$ between the two inputs' pre-activations obeys the one-dimensional map
$$c_{l+1}=\frac{\sigma_w^2\,\mathbb E\,\phi(u_1)\phi(u_2)+\sigma_b^2}{q^*},\qquad (u_1,u_2)\ \text{centred Gaussian, variance }q^*,\ \text{correlation }c_l .$$
$c=1$ is always a fixed point; it is stable when $\chi_1=\sigma_w^2\,\mathbb E\,\phi'(\sqrt{q^*}z)^2<1$ (the **ordered phase**: all inputs end up perfectly correlated), and unstable when $\chi_1>1$ (the **chaotic phase**: nearby inputs are pushed apart and correlations settle at some $c^*<1$). The **edge of chaos** is $\chi_1=1$; $\chi_1$ is also the factor by which the backward gradient norm squared is multiplied per layer (5.1).`,
      idea: String.raw`In the large-width limit the pre-activations of a layer are jointly Gaussian given the previous layer, so their second moments propagate through a deterministic map; this is the same central-limit argument that makes wide networks Gaussian processes (7.1). The slope of the correlation map at $c=1$ equals $\chi_1$, which says how fast a small difference between two inputs grows or shrinks per layer; the depth over which correlations or perturbations stay informative is $\xi\sim1/|\ln\chi_1|$, diverging at the edge of chaos. Poole et al. and Schoenholz et al. (2016) showed that trainability of very deep networks at initialization is limited to a few multiples of this depth scale.`,
      caption: String.raw`Tanh network, bias variance $\sigma_b^2$ fixed by the second slider. Left: correlation $c_l$ between the pre-activations of two inputs, layer by layer, for a simulated width-500 network (dots) and the mean-field map (line), starting from the correlation you set. Right: the map $c\mapsto c'$ against the diagonal; the staircase follows the iteration. Slide $\sigma_w^2$ from the ordered side ($\chi_1<1$, curve above the diagonal, stairs climb to $c=1$) through the critical value to the chaotic side (the map crosses the diagonal below 1 and the correlation settles there, so inputs are decorrelated).`,
      deps: ['deep-5.2'],
      refs: ['Prince §7.5'],
      tags: ['mean field', 'chaos', 'trainability'],
      credit: 'Poole, Lahiri, Raghu, Sohl-Dickstein & Ganguli, 2016; Schoenholz, Gilmer, Ganguli & Sohl-Dickstein, 2017',
      scope: String.raw`Infinite-width, i.i.d. Gaussian initialization, fully connected layers without normalization or skips; the correlation measured here is that of the pre-activations. The finite-width simulation shows sampling noise of order $1/\sqrt N$.`,
      links: { arxiv: 'https://arxiv.org/abs/1606.05340' },
      viz(v) {
        const swS = v.slider('weight variance $\\sigma_w^2$', 0.5, 4, 3, { step: 0.01 });
        const sbS = v.slider('bias variance $\\sigma_b^2$', 0, 0.5, 0.05, { step: 0.005 });
        const c0S = v.slider('initial correlation $c_0$', 0, 0.95, 0.5, { step: 0.01 });
        const seed = { v: 1 }; v.button('resample network', () => { seed.v++; });
        const L = 40, N = 500;
        const sL = v.stage({ x: [0, L], y: [-0.05, 1.05], height: 330, axes: 'box', gutter: true, xlabel: 'layer $l$', ylabel: 'correlation $c_l$', weight: 1, minWidth: 280, title: 'two inputs through the network' });
        const sM = v.stage({ x: [0, 1], y: [0, 1], equal: true, height: 330, axes: 'box', gutter: true, xlabel: '$c_l$', ylabel: '$c_{l+1}$', weight: 0.9, minWidth: 260, title: 'correlation map' });
        const mc = memo(), mm = memo(); let info = null;
        // finite-width simulation of two correlated inputs
        function simulate(sw2, sb2, c0, sd) {
          const r = rand(sd), sdw = Math.sqrt(sw2 / N), cs = [];
          let a = new Float64Array(N), b = new Float64Array(N);
          for (let i = 0; i < N; i++) { const g1 = r.normal(), g2 = r.normal(); a[i] = g1; b[i] = c0 * g1 + Math.sqrt(1 - c0 * c0) * g2; }
          const corr = (x, y) => { let xy = 0, xx = 0, yy = 0; for (let i = 0; i < N; i++) { xy += x[i] * y[i]; xx += x[i] * x[i]; yy += y[i] * y[i]; } return xy / Math.sqrt(xx * yy || 1); };
          cs.push(corr(a, b)); let ha = a, hb = b;
          for (let l = 0; l < L; l++) {
            const w = new Float64Array(N * N); for (let i = 0; i < w.length; i++) w[i] = r.normal() * sdw;
            const bias = new Float64Array(N); for (let i = 0; i < N; i++) bias[i] = r.normal() * Math.sqrt(sb2);
            const za = new Float64Array(N), zb = new Float64Array(N);
            for (let i = 0; i < N; i++) { let s1 = bias[i], s2 = bias[i]; const o = i * N; for (let j = 0; j < N; j++) { s1 += w[o + j] * ha[j]; s2 += w[o + j] * hb[j]; } za[i] = s1; zb[i] = s2; }
            cs.push(corr(za, zb)); ha = za.map(Math.tanh); hb = zb.map(Math.tanh);
          }
          return cs;
        }
        // critical sigma_w^2 for the current bias variance (bisection on chi1 = 1)
        const crit = (sb2) => { let lo = 0.2, hi = 8; for (let i = 0; i < 36; i++) { const m = (lo + hi) / 2, qs = qStar('tanh', m, sb2, 1, 400); if (chi1('tanh', m, qs) < 1) lo = m; else hi = m; } return (lo + hi) / 2; };
        v.render(() => {
          const sw2 = swS.value, sb2 = sbS.value, c0 = c0S.value;
          const sim = mc(sw2 + '|' + sb2 + '|' + c0 + '|' + seed.v, () => simulate(sw2, sb2, c0, hashStr('e' + seed.v)));
          const qs = qStar('tanh', sw2, sb2, 1, 400), chi = chi1('tanh', sw2, qs), cc = mm(sb2, () => crit(sb2));
          const f = (c) => corrMap('tanh', sw2, sb2, qs, c);
          // mean-field iteration from c0 (q starts at q*, the simulated input has variance 1: a small transient)
          const mf = [c0]; for (let l = 0; l < L; l++) mf.push(Math.min(1, f(mf[l])));
          sL.hline(1, { color: 'faint', dash: true });
          sL.path(mf.map((c, l) => [l, c]), { color: 'orange', width: 2.2 });
          sL.dots(sim.map((c, l) => [l, c]), { r: 3.4, color: 'accent' });
          const grid = Array.from({ length: 101 }, (_, i) => i / 100);
          sM.line(0, 0, 1, 1, { color: 'faint', dash: true, width: 1.2 });
          sM.path(grid.map((c) => [c, Math.min(1, f(c))]), { color: 'orange', width: 2.2 });
          // cobweb
          let c = c0; const web = [[c, 0]];
          for (let i = 0; i < 14; i++) { const n = Math.min(1, f(c)); web.push([c, n], [n, n]); c = n; }
          sM.path(web, { color: 'accent', width: 1.2, alpha: 0.85 });
          sM.dot(c0, 0, { r: 4, color: 'gold' });
          info = { chi, cc, qs, last: sim[L], mf: mf[L], sw2, sb2 };
        });
        v.legend([['accent', 'simulated network (width 500)', { dot: true }], ['orange', 'mean-field map'], ['gold', 'start $c_0$', { dot: true }]]);
        v.readout(() => info && String.raw`$q^*=${v.fix(info.qs, 3)}$ · $\chi_1=${v.fix(info.chi, 3)}$ → **${info.chi < 0.995 ? 'ordered phase' : info.chi > 1.005 ? 'chaotic phase' : 'at the edge of chaos'}** (critical $\sigma_w^2\approx${v.fix(info.cc, 2)}$ for $\sigma_b^2=${v.fix(info.sb2, 3)}$)` + `\n` +
          String.raw`correlation after 40 layers: simulated ${v.fix(info.last, 3)}, mean field ${v.fix(info.mf, 3)} · ` + (info.chi < 0.995 ? `all inputs collapse together, so the output carries almost no information about the input` : info.chi > 1.005 ? `nearby inputs are decorrelated: the network is a rough random function of its input` : `correlations decay only slowly, over a depth scale that diverges at the critical line`));
      },
    },
    // ───────────────────────────────────────────────────────────── 5.5
    {
      num: '5.5',
      kind: 'Concept',
      name: 'Dynamical isometry and orthogonal initialization',
      statement: String.raw`Let $J=\partial h_L/\partial h_0$ be the input–output Jacobian of a depth-$L$ network. The network has **dynamical isometry** when all singular values of $J$ (ladr-7.65) are concentrated near 1, so that every direction of the input is transmitted with neither growth nor decay (an isometry has all singular values 1). For a deep **linear** network $J=W_L\cdots W_1$ and the statement is exact. If the $W_l$ are $N\times N$ matrices with i.i.d. $\mathcal N(0,1/N)$ entries, the squared singular values of $J$ have mean 1 but variance growing linearly with depth ($\approx L$ for large $N$), so the log-singular values spread out (like $\sqrt L$ while $L\ll N$, linearly in $L$ beyond) — some directions are amplified and most are crushed. If instead each $W_l$ is a (Haar-random) **orthogonal** matrix, then so is $J$, and every singular value equals 1 at every depth.`,
      idea: String.raw`For the orthogonal branch, the isometry criterion (ladr-7.49) turns $W_l^\top W_l=I$ into preservation of every vector's Euclidean norm. Repeated application gives $\|W_L\cdots W_1v\|=\|v\|$, so the product also has $J^\top J=I$ and all its singular values are 1. This deterministic argument needs no random or Haar-distribution assumption; it applies to the pictured QR factors up to numerical error. The Gaussian branch instead spreads its singular values over many scales. Saxe, McClelland and Ganguli (2014) analysed learning in deep linear networks, and Pennington, Schoenholz and Ganguli (2017) extended the analysis to nonlinear networks with free probability: ReLU networks cannot achieve dynamical isometry in that setting, while suitable orthogonal tanh and sigmoid networks can when their gain is tuned to the edge of chaos (5.4).`,
      caption: String.raw`A product of $L$ random $N\times N$ matrices ($N=40$). Left: all 40 singular values of the product after $k$ factors, $k=1,\dots,64$, on a log scale (decades), for the chosen initialization. Right: histogram of $\log_{10}s$ at the depth set by the slider. Gaussian entries produce a fan that keeps opening with depth (like $\sqrt k$ while $k\ll N$, then linearly, at the Lyapunov exponents of the product); orthogonal matrices (QR of a Gaussian matrix) keep all 40 curves glued to $0$. Switch the initialization to compare.`,
      deps: ['deep-5.4', 'ladr-7.65', 'ladr-7.49'],
      refs: ['Prince §7'],
      tags: ['singular values', 'orthogonal', 'isometry'],
      credit: 'Saxe, McClelland & Ganguli, 2014; Pennington, Schoenholz & Ganguli, 2017',
      scope: String.raw`Exact for deep linear networks; the statement that the variance of $s^2$ grows like $L$ is a large-width one (here $N=40$ shows finite-size deviations). Nonlinear networks need the Jacobian $\prod_l D_lW_l$ with the activation slopes $D_l$.`,
      links: { arxiv: 'https://arxiv.org/abs/1312.6120', nips: 'https://arxiv.org/abs/1711.04735' },
      viz(v) {
        const M = v.M;
        const initS = v.select('initialization', [{ value: 'gauss', label: 'Gaussian $\\mathcal N(0,1/N)$' }, { value: 'orth', label: 'orthogonal' }], 'gauss');
        const dS = v.slider('depth $L$ for the histogram', 1, 64, 24, { int: true });
        const seed = { v: 1 }; v.button('resample', () => { seed.v++; });
        const N = 40, LM = 64;
        const sT = v.stage({ x: [0, LM], y: [-12, 12], height: 340, axes: 'box', gutter: true, xlabel: 'number of factors $k$', ylabel: '$\\log_{10}$ singular values', weight: 1.1, minWidth: 290, title: 'singular values of $W_k\\cdots W_1$' });
        const sH = v.stage({ x: [-12, 12], y: [0, 0.4], height: 340, axes: 'box', gutter: true, xlabel: '$\\log_{10}s$', ylabel: 'fraction', weight: 0.9, minWidth: 260, title: 'spectrum at depth $L$' });
        const mc = memo(); let info = null;
        // The singular values of W_k···W_1 are updated factor by factor: if P = U S Vᵀ then WP has the singular values of
        // (W U S) — a matrix whose columns are strongly graded, for which one-sided Jacobi keeps high relative accuracy,
        // so values 10⁻⁶⁰ times the largest are still resolved (a direct SVD of the product would stop at about 10⁻¹⁶).
        function run(kind, sd) {
          const r = rand(sd); let U = Array.from({ length: N }, (_, i) => Array.from({ length: N }, (_, j) => (i === j ? 1 : 0))), S = new Array(N).fill(1); const sv = [];
          for (let k = 0; k < LM; k++) {
            let W = Array.from({ length: N }, () => Array.from({ length: N }, () => r.normal() / Math.sqrt(N)));
            if (kind === 'orth') W = M.qr(W.map((row) => row.map((x) => x * Math.sqrt(N)))).Q;
            const A = M.matMul(W, U.map((row) => row.map((x, j) => x * S[j])));
            const d = M.svd(A); U = d.U; S = d.S;
            sv.push(S.map((s) => Math.log10(Math.max(s, 1e-300))));
          }
          return sv;
        }
        v.render(() => {
          const kind = initS.value, L = dS.value;
          const sv = mc(kind + '|' + seed.v, () => run(kind, hashStr('iso' + seed.v)));
          const lo = Math.min(-2, ...sv.flat()), hi = Math.max(2, ...sv.flat()), ext = Math.ceil(Math.max(Math.abs(lo), Math.abs(hi)) / 2) * 2 + 1;
          sT.setView([0, LM], [-ext, ext]); sH.setView([-ext, ext], [0, 0.45]);
          sT.hline(0, { color: 'faint', dash: true });
          for (let i = 0; i < N; i++) sT.path(sv.map((row, k) => [k + 1, row[i]]), { color: kind === 'gauss' ? 'accent' : 'green', width: 1.1, alpha: 0.65 });
          sT.vline(L, { color: 'orange', width: 1.6 });
          const row = sv[L - 1];
          sH.hist(binFrac(row, -ext, ext, 40, N), { color: kind === 'gauss' ? 'accent' : 'green', fillAlpha: 0.25, outline: true });
          const s2 = row.map((x) => 10 ** (2 * x)), m2 = s2.reduce((a, b) => a + b, 0) / N, v2 = s2.reduce((a, b) => a + (b - m2) ** 2, 0) / N;
          const mu = row.reduce((a, b) => a + b, 0) / N, sd = Math.sqrt(row.reduce((a, b) => a + (b - mu) ** 2, 0) / N);
          info = { L, smax: Math.max(...row), smin: Math.min(...row), sd, m2, v2 };
        });
        v.legend([['accent', 'Gaussian init'], ['green', 'orthogonal init'], ['orange', 'depth $L$ (left) ↔ histogram (right)']]);
        v.readout(() => info && String.raw`at $L=${info.L}$: $s_{\max}=10^{${v.fix(info.smax, 1)}}$, $s_{\min}=10^{${v.fix(info.smin, 1)}}$ — condition number $10^{${v.fix(info.smax - info.smin, 1)}}$ · spread of $\log_{10}s$: ${v.fix(info.sd, 2)}` + `\n` +
          String.raw`mean of $s^2$ = ${v.fix(info.m2, 2)} · variance of $s^2$ = ${v.fix(info.v2, 1)} (large-$N$ Gaussian prediction: mean 1, variance $L=${info.L}$, but single samples are heavy-tailed; orthogonal: 1 and 0 exactly)`);
      },
    },
  ],
};
