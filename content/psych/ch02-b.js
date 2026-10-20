// Psychology & Perception — Chapter 2: Signal detection theory (items 2.9–2.15)
import { Phi, phi, zq, OBS, OC, pc, wilson, timers, sdt, nelderMead, rocPts, rocFrame, ROCOPT, cumROC, drawCum, fitRating, ratingProbs } from './ch02.shared.js';

/** Maximum-likelihood high-threshold fit to rating counts by EM: detected signal trials get the top rating, the rest follow q. */
function fitHT(nC, sC) {
  const m = nC.length, Nn = nC.reduce((a, b) => a + b, 0), Ns = sC.reduce((a, b) => a + b, 0);
  if (!Nn || !Ns) return null;
  let p = 0.3, q = nC.map((x) => (x + 0.5) / (Nn + 0.5 * m));
  for (let it = 0; it < 600; it++) {
    const qm = q[m - 1], post = p + (1 - p) * qm > 0 ? p / (p + (1 - p) * qm) : 0, det = sC[m - 1] * post;
    p = det / Ns;
    const tot = Nn + Ns - det;
    q = nC.map((x, k) => (x + (k === m - 1 ? sC[k] - det : sC[k])) / tot);
  }
  const lg = (x) => Math.log(Math.max(1e-300, x));
  let L = 0; for (let k = 0; k < m; k++) L += nC[k] * lg(q[k]) + sC[k] * lg((1 - p) * q[k] + (k === m - 1 ? p : 0));
  return { p, q, nll: -L, Nn, Ns };
}
/** G² = 2 Σ obs ln(obs/exp) over cells (empty cells contribute 0). */
function G2(obs, ex) { let g = 0; for (let i = 0; i < obs.length; i++) if (obs[i] > 0) g += 2 * obs[i] * Math.log(obs[i] / Math.max(1e-300, ex[i])); return g; }
/** p-value formatted. */
const pv = (p) => (p < 0.001 ? '< 0.001' : '= ' + p.toFixed(3));

export default {
  collection: 'psych',
  chapter: 2,
  items: [
    // ------------------------------------------------------------------ 2.9
    {
      num: '2.9',
      kind: 'Theorem',
      name: 'Threshold and Gaussian models predict different ROCs',
      statement: String.raw`The two classical models of detection predict ROCs of different shapes, so the shape of an observer's ROC is a test between them.

(a) **High-threshold theory** (psych-1.12): a signal is detected with probability $p$, noise never is, and undetected trials are answered “yes” with a guessing probability $g$ that the observer can change. Then $F=g$ and
$$H=p+(1-p)\,F:$$
the ROC is a **straight line** from $(0,p)$ to $(1,1)$, and the corrected detection probability $(H-F)/(1-F)=p$ is the same at every point. With confidence ratings, detected trials get the top rating and the remaining ratings are spread over undetected signal trials exactly as over noise trials, so the rating ROC points lie on the same line.

(b) The **Gaussian model** (2.1) gives the **curved** ROC $H=\Phi\big(d'+z(F)\big)$, which leaves $(0,0)$ vertically.

On z-coordinates the roles swap: the Gaussian ROC is a straight line, while the threshold ROC starts flat at height $z(p)$ and bends upward towards slope 1. Yes/no and rating ROCs from vision and hearing are curved in the way the Gaussian model predicts, which is the main evidence against a high sensory threshold (Swets, 1961).`,
      idea: String.raw`Under high-threshold theory the only thing the observer controls is $g$, and $H$ is an affine function of $g=F$, hence a line; its intercept is the true detection probability. Under the Gaussian model the slope of the ROC is the likelihood ratio at the criterion (2.6), which grows without bound as the criterion rises, so the curve leaves the origin vertically and no straight line through $(1,1)$ can follow it. With six rating categories each model has six free parameters (the Gaussian: $d'$ and five boundaries; threshold theory: $p$ and five free rating proportions), so their maximum-likelihood fits to the same counts can be compared directly; with few trials both fit, with many the wrong one fails.`,
      caption: String.raw`A simulated observer rates trials on a six-point scale (seeded). Both models are fitted to the rating counts by maximum likelihood: the Gaussian ROC in blue, the high-threshold line in red, on ordinary coordinates (left) and on z-coordinates (right). Switch the **true observer** between Gaussian and high threshold and see which curve runs through the points; lower the **trials per type** and the two become hard to tell apart. The readout gives each model's goodness-of-fit statistic $G^2$ (4 degrees of freedom) and its p-value.`,
      deps: ['psych-1.12', 'psych-2.6', 'psych-2.7'],
      see: ['psych-2.15'],
      refs: ['M&C ch. 4'],
      tags: ['ROC', 'threshold theory'],
      credit: 'Tanner & Swets, 1954; Swets, 1961 (“Is there a sensory threshold?”)',
      viz(v) {
        const M = v.M, NMAX = 3000, BND = [-0.5, 0.1, 0.6, 1.1, 1.7], D = 1.4;
        const qN = BND.map((b, i) => Phi(M, b) - (i ? Phi(M, BND[i - 1]) : 0)).concat([1 - Phi(M, BND[4])]);
        const P0 = 0.45;
        const kind = v.select('true observer', [{ value: 'g', label: 'Gaussian ($d\'$ = 1.4)' }, { value: 'ht', label: 'high threshold ($p$ = 0.45)' }], 'g');
        const nT = v.slider('trials per type', 20, NMAX, 400, { int: true, log: true });
        let seed = 9, Z = null, zSeed = -1, cache = null, cKey = '';
        v.button('New random sample', () => { seed = 1 + ((Math.random() * 1e9) | 0); });
        const ro = v.stage({ ...ROCOPT, height: 320, weight: 1, title: 'ROC' });
        const zr = v.stage({ x: [-2.6, 2.6], y: [-2.6, 2.6], equal: true, height: 320, weight: 1, xlabel: '$z(F)$', ylabel: '$z(H)$', xticks: [-2, -1, 1, 2], yticks: [-2, -1, 1, 2], title: 'z-ROC' });
        const cat = (x) => { let r = 0; while (r < 5 && x > BND[r]) r++; return r; };
        v.legend([['ink', 'rating data, 95% intervals', { dot: true }], ['accent', 'Gaussian model, ML fit'], ['red', 'high-threshold model, ML fit']]);
        v.render(() => {
          if (zSeed !== seed) { const R = v.rng(seed); Z = { n: M.range(NMAX).map(() => R.normal()), s: M.range(NMAX).map(() => R.normal()), u: M.range(NMAX).map(() => R()) }; zSeed = seed; }
          const n = nT.value, ht = kind.value === 'ht', key = [n, ht, seed].join('|');
          if (key !== cKey) {
            cKey = key;
            const nC = new Array(6).fill(0), sC = new Array(6).fill(0);
            for (let i = 0; i < n; i++) { nC[cat(Z.n[i])]++; sC[ht ? (Z.u[i] < P0 ? 5 : cat(Z.s[i])) : cat(D + Z.s[i])]++; }
            const fg = fitRating(M, nC, sC, { equal: true }), fh = fitHT(nC, sC);
            const obs = [...nC, ...sC];
            const eg = ratingProbs(M, fg), exG = [...eg.pN.map((x) => x * n), ...eg.pS.map((x) => x * n)];
            const exH = [...fh.q.map((x) => x * n), ...fh.q.map((x, k) => ((1 - fh.p) * x + (k === 5 ? fh.p : 0)) * n)];
            const gG = G2(obs, exG), gH = G2(obs, exH), chi = M.dist.chi2(4);
            cache = { nC, sC, fg, fh, gG, gH, pG: 1 - chi.cdf(gG), pH: 1 - chi.cdf(gH) };
          }
          const { nC, sC, fg, fh } = cache, pts = cumROC(nC, sC);
          // ---- ROC
          rocFrame(ro, M);
          ro.path(rocPts(M, fg.mu, 1), { color: 'accent', width: 2.4 });
          ro.line(0, fh.p, 1, 1, { color: 'red', width: 2.2 });
          ro.dot(0, fh.p, { r: 4, color: 'red' });
          ro.text(`p = ${v.fix(fh.p, 2)}`, 0, fh.p, { dx: 8, dy: 13, align: 'left', color: 'red', size: 11, weight: 700 });
          drawCum(ro, pts, { line: false });
          // ---- z-ROC
          zr.clip(() => {
            zr.line(-2.6, fg.mu - 2.6, 2.6, fg.mu + 2.6, { color: 'accent', width: 2.4 });
            zr.path(M.linspace(-2.6, 2.6, 200).map((x) => { const H = fh.p + (1 - fh.p) * Phi(M, x); return H < 1 - 1e-9 ? [x, zq(M, H)] : null; }), { color: 'red', width: 2.2 });
            zr.hline(zq(M, Math.max(1e-6, fh.p)), { color: 'red', dash: [3, 4], width: 1, alpha: 0.6 });
          });
          for (const p of pts) {
            if (!(p.kF > 0 && p.kF < p.Nn && p.kH > 0 && p.kH < p.Ns)) continue;
            const x = zq(M, p.F), y = zq(M, p.H), sx = Math.sqrt((p.F * (1 - p.F)) / p.Nn) / phi(x), sy = Math.sqrt((p.H * (1 - p.H)) / p.Ns) / phi(y);
            zr.line(x - 1.96 * sx, y, x + 1.96 * sx, y, { color: 'ink', width: 1.1, alpha: 0.45 }); zr.line(x, y - 1.96 * sy, x, y + 1.96 * sy, { color: 'ink', width: 1.1, alpha: 0.45 });
            zr.dot(x, y, { r: 4.5, color: 'ink' });
          }
        });
        v.readout(() => {
          if (!cache) return '';
          const { fg, fh, gG, gH, pG, pH } = cache, n = nT.value;
          const win = Math.abs(gG - gH) < 2 ? 'the data cannot tell the models apart yet' : gG < gH ? '**the Gaussian model fits better**' : '**the high-threshold model fits better**';
          return `${n} noise and ${n} signal trials · Gaussian fit: $d'$ = ${v.fix(fg.mu, 2)}, $G^2$ = ${v.fix(gG, 1)} (p ${pv(pG)}) · high-threshold fit: $p$ = ${v.fix(fh.p, 3)}, $G^2$ = ${v.fix(gH, 1)} (p ${pv(pH)}) · both have 6 parameters, so the difference in $G^2$, ${v.fix(gH - gG, 1)}, compares them directly: ${win}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.10
    {
      num: '2.10',
      kind: 'Theorem',
      name: 'Area under the ROC equals 2AFC accuracy',
      statement: String.raw`Let the evidence have any continuous distribution on noise trials and any continuous distribution on signal trials, and let $F(k)=P(x_N>k)$ and $H(k)=P(x_S>k)$ trace the yes/no ROC as the criterion $k$ sweeps. Then the **area under the ROC** equals the probability that a signal observation exceeds an independent noise observation:
$$\begin{aligned}\mathrm{AUC}&=\int_0^1 H\,dF\\&=P(x_S>x_N).\end{aligned}$$
In two-alternative forced choice (psych-1.8) an observer who receives one observation from each interval and picks the interval with the larger one is correct exactly when $x_S>x_N$, so **its proportion correct equals the area under its yes/no ROC**. For equal-variance Gaussians both equal $\Phi(d'/\sqrt2)$. No assumption about the shape of the distributions is needed, but the two tasks must produce the same distributions, the observations must be independent and the choice unbiased: a preference for one interval lowers proportion correct below the area. For two samples, the area under the empirical ROC is the Mann–Whitney statistic $U/(n_Sn_N)$ (Bamber, 1975).`,
      idea: String.raw`Cut the area into strips: as the criterion falls from $k$ to $k-dk$, the false-alarm rate grows by $f_N(k)\,dk$ and the strip under the curve there has height $H(k)=P(x_S>k)$. Summing the strips gives $\int P(x_S>k)\,f_N(k)\,dk$, which is $P(x_S>x_N)$ by conditioning on the value of $x_N$. More generally, the independent-pair expectation formula (prob-2.1.12), applied to the nonnegative indicator $h(s,n)=\mathbf1_{s>n}$, gives the same identity with the product distribution even when densities do not exist. So the area counts, over all pairs of one noise and one signal observation, the fraction in which the signal is larger, which is exactly what the forced-choice observer is scored on (Green, 1964).`,
      caption: String.raw`Left: the two evidence distributions and the latest forced-choice trial (gold dot: the noise interval's observation, blue: the signal interval's; the ring marks the interval chosen). Middle: the same observer's yes/no ROC, with the area under it shaded and computed by numerical integration. Right: proportion correct as simulated 2AFC trials accumulate (log scale), with the area as the green line and the binomial 95% funnel around it. Change the **distributions** and the **separation**: area and accuracy move together. Give the observer an **interval bias** and the accuracy settles below the area (dashed: its predicted value).`,
      deps: ['psych-2.6', 'psych-1.8', 'prob-2.1.12'],
      see: ['psych-2.11', 'stat-6.5'],
      refs: ['M&C ch. 7'],
      tags: ['ROC', 'forced choice'],
      credit: 'Green, 1964; Bamber, 1975',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Receiver_operating_characteristic#Area_under_the_curve' },
      viz(v) {
        const M = v.M, NMAX = 5000, PER = 15;
        const kind = v.select('distributions', [{ value: 'eq', label: 'Gaussian, equal SD' }, { value: 'un', label: 'Gaussian, signal SD 2' }, { value: 'exp', label: 'exponential' }], 'eq');
        const sep = v.slider('separation', 0, 3, 1.2, { step: 0.01 });
        const bias = v.slider('interval bias $b$', -1.5, 1.5, 0, { step: 0.01 });
        let seed = 31, U = null, uSeed = -1, cache = null, cKey = '', st = null;
        v.button('New trials', () => { seed = 1 + ((Math.random() * 1e9) | 0); v.restart(); });
        const de = v.stage({ x: [-3.5, 8.5], y: [0, 0.5], height: 270, axes: 'box', weight: 1, xlabel: 'evidence $x$', yticks: [], title: 'one 2AFC trial: two observations' });
        const ro = v.stage({ ...ROCOPT, height: 270, weight: 0.85, minWidth: 220, title: 'area under the yes/no ROC' });
        const cv = v.stage({ x: [1, NMAX], y: [0.4, 1.02], xlog: true, height: 230, full: true, axes: 'box', yticks: [0.5, 0.6, 0.7, 0.8, 0.9, 1], title: 'forced-choice proportion correct as trials accumulate (log scale)' });
        const model = () => {
          const s = sep.value, k = kind.value;
          if (k === 'exp') { const mS = 1 + s, lS = 1 / mS; return {
            fN: (x) => (x < 0 ? 0 : Math.exp(-x)), fS: (x) => (x < 0 ? 0 : lS * Math.exp(-lS * x)), qN: (u) => -Math.log(1 - u), qS: (u) => -mS * Math.log(1 - u),
            Hof: (F) => Math.pow(F, lS), auc: mS / (1 + mS), // P(D > t) for D = xS − xN
            pD: (t) => (t >= 0 ? Math.exp(-lS * t) / (1 + lS) : 1 - (Math.exp(t) * lS) / (1 + lS)), lo: 0, ymax: 1.05, name: 'mean 1 vs mean ' + v.fix(mS, 2) }; }
          const sg = k === 'un' ? 2 : 1;
          return { fN: (x) => phi(x), fS: (x) => phi((x - s) / sg) / sg, qN: (u) => zq(M, u), qS: (u) => s + sg * zq(M, u),
            Hof: (F) => (F <= 0 ? 0 : F >= 1 ? 1 : Phi(M, (s + zq(M, F)) / sg)), auc: Phi(M, s / Math.sqrt(1 + sg * sg)),
            pD: (t) => Phi(M, (s - t) / Math.sqrt(1 + sg * sg)), lo: -3.5, ymax: 0.47, name: '' };
        };
        v.legend([['muted', 'noise'], ['accent', 'signal'], ['green', 'area under the ROC'], ['gold', 'running 2AFC proportion correct'], ['orange', 'predicted accuracy with interval bias', { dash: true }]]);
        v.animate((t) => {
          const Mo = model(), b = bias.value;
          if (uSeed !== seed) { const R = v.rng(seed); U = { n: M.range(NMAX).map(() => R()), s: M.range(NMAX).map(() => R()), w: M.range(NMAX).map(() => (R() < 0.5 ? 1 : 2)) }; uSeed = seed; }
          const key = [kind.value, sep.value, b, seed].join('|');
          if (key !== cKey) { // per-trial outcomes and the running proportion correct
            cKey = key; const xN = new Float64Array(NMAX), xS = new Float64Array(NMAX), cum = new Float64Array(NMAX), ch = new Int8Array(NMAX); let c = 0;
            for (let i = 0; i < NMAX; i++) {
              xN[i] = Mo.qN(U.n[i]); xS[i] = Mo.qS(U.s[i]);
              const x1 = U.w[i] === 1 ? xS[i] : xN[i], x2 = U.w[i] === 1 ? xN[i] : xS[i], pick = x1 + b > x2 ? 1 : 2;
              ch[i] = pick; if (pick === U.w[i]) c++; cum[i] = c / (i + 1);
            }
            let A = 0; const NF = 4000; for (let j = 0; j < NF; j++) A += (Mo.Hof(j / NF) + Mo.Hof((j + 1) / NF)) / (2 * NF);
            cache = { xN, xS, cum, ch, A, pb: 0.5 * (Mo.pD(-Math.abs(b)) + Mo.pD(Math.abs(b))) };
          }
          const n = Math.max(1, Math.min(NMAX, Math.round(10 * Math.pow(NMAX / 10, Math.min(1, t / (PER - 3)))))), i = n - 1, { xN, xS, cum, ch, A, pb } = cache;
          // ---- densities and the latest trial
          const lo = Mo.lo; de.setView([kind.value === 'exp' ? -0.6 : -3.5, 8.5], [-0.17 * Mo.ymax, Mo.ymax]);
          de.fn(Mo.fN, { domain: [lo, 8.5], color: 'muted', width: 2.2, fill: 'muted', fillAlpha: 0.08, n: 300 });
          de.fn(Mo.fS, { domain: [lo, 8.5], color: 'accent', width: 2.4, fill: 'accent', fillAlpha: 0.1, n: 300 });
          const yy = -0.045 * Mo.ymax, sigInt = U.w[i], chosen = ch[i];
          de.dot(xN[i], yy, { r: 5.5, color: 'gold' }); de.dot(xS[i], yy, { r: 5.5, color: 'accent' });
          const xc = chosen === sigInt ? xS[i] : xN[i];
          de.dot(xc, yy, { r: 9.5, color: chosen === sigInt ? 'green' : 'red', hollow: true, width: 2.2 });
          de.corner(`trial ${n}: signal in interval ${sigInt}, chose ${chosen} — ${chosen === sigInt ? 'correct' : 'wrong'}`, 'tr', { color: chosen === sigInt ? 'green' : 'red', size: 11.5, weight: 600 });
          // ---- ROC and area
          rocFrame(ro, M);
          const pts = M.range(301).map((j) => [j / 300, Mo.Hof(j / 300)]);
          ro.poly([[0, 0], ...pts, [1, 0]], { fill: 'green', fillAlpha: 0.2, stroke: false });
          ro.path(pts, { color: 'accent', width: 2.4 });
          ro.text(`area = ${v.fix(A, 3)}`, 0.62, 0.3, { align: 'center', color: 'green', size: 14, weight: 700 });
          // ---- convergence
          const N = n, funnel = (s) => M.range(121).map((j) => { const m = Math.pow(NMAX, j / 120); return [m, Math.min(1.02, Math.max(0.4, A + s * 1.96 * Math.sqrt((A * (1 - A)) / m)))]; });
          cv.poly([...funnel(1), ...funnel(-1).reverse()], { fill: 'green', fillAlpha: 0.1, stroke: false });
          cv.hline(A, { color: 'green', width: 2 });
          cv.hline(0.5, { color: 'muted', dash: [3, 4], width: 1 });
          if (Math.abs(b) > 0.005) cv.hline(pb, { color: 'orange', width: 1.8, dash: [6, 4] });
          const path = []; for (let j = 0; j < N; j = j < 60 ? j + 1 : Math.ceil(j * 1.03)) path.push([j + 1, cum[j]]); path.push([N, cum[N - 1]]);
          cv.path(path, { color: 'gold', width: 2 });
          cv.dot(N, cum[N - 1], { r: 5, color: 'gold' });
          cv.text(`${N} trials: ${v.fix(cum[N - 1], 3)}`, N, cum[N - 1], { dx: N > 600 ? -10 : 10, dy: -12, align: N > 600 ? 'right' : 'left', color: 'gold', weight: 700, size: 12 });
          st = { A, N, pc: cum[N - 1], pb, b };
        }, { period: PER, still: PER - 1 });
        v.readout(() => {
          if (!st) return '';
          const { A, N, pc: p, pb, b } = st, Mo = model(), se = Math.sqrt((A * (1 - A)) / N);
          return `area under the ROC (numerical integral of $H\\,dF$) = **${v.fix(A, 4)}**; exact $P(x_S>x_N)$ = ${v.fix(Mo.auc, 4)} · 2AFC after ${N} trials: proportion correct ${v.fix(p, 4)} (${v.fix((p - A) / se, 1)} standard errors from the area)${Math.abs(b) > 0.005 ? ` · with interval bias $b$ = ${v.fix(b, 2)} the expected accuracy is $\\tfrac12[P(D>-b)+P(D>b)]$ = ${v.fix(pb, 4)}, below the area` : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.11
    {
      num: '2.11',
      kind: 'Theorem',
      name: 'd′ in 2AFC is √2 times the yes–no d′',
      statement: String.raw`In two-alternative forced choice with independent Gaussian evidence $x_1,x_2$ from the two intervals (unit variance; mean $d'$ in the signal interval and 0 in the other), the optimal observer decides from the difference $D=x_2-x_1$, which is $N(d',2)$ when the signal is in interval 2 and $N(-d',2)$ when it is in interval 1. Treating “interval 2” as the yes response and computing a sensitivity from $D$ gives
$$d'_{\mathrm{2AFC}}=\frac{d'-(-d')}{\sqrt2}=\sqrt2\,d',$$
so the same observer looks $\sqrt2$ times as sensitive in 2AFC as in yes/no, and an unbiased observer's proportion correct is $P_c=\Phi(d'_{\mathrm{2AFC}}/2)=\Phi(d'/\sqrt2)$. Conversely, the yes/no $d'$ is recovered from 2AFC data as $d'=\sqrt2\,z(P_c)$ for an unbiased observer, or $d'=[z(H_2)-z(F_2)]/\sqrt2$ in general, with $H_2$ and $F_2$ the rates of answering “interval 2”. The factor assumes independent observations; if the noise in the two intervals has correlation $\rho$, the difference has variance $2(1-\rho)$ and the factor becomes $\sqrt{2/(1-\rho)}$.`,
      idea: String.raw`The two observations of a trial are the coordinates of a point in the plane. The two kinds of trial put its mean at $(d',0)$ or at $(0,d')$, a distance $\sqrt2\,d'$ apart, while the noise around each mean is still a unit circle; the best decision line is the diagonal $x_1=x_2$, and the distance between the means measured across it, in units of the noise, is $\sqrt2\,d'$. In yes/no there is only one coordinate and only $d'$ is available. Noise shared by the two intervals lies along the diagonal and cancels in the difference, which shrinks the noise across the decision line and enlarges the factor.`,
      caption: String.raw`Left: each dot is one simulated 2AFC trial, plotted at its two observations; orange trials had the signal in interval 1, blue in interval 2. The rings are one standard deviation of noise around the two means, the dashed diagonal is the decision line, and the arrow between the means has length $\sqrt2\,d'$. Right: the decision variable $D=x_2-x_1$ for the two kinds of trial, and the separation of its means in units of its own standard deviation. Change $d'$ and the number of trials; give the two intervals correlated noise ($\rho$) to see the factor leave $\sqrt2$.`,
      deps: ['psych-2.3', 'psych-1.8'],
      see: ['psych-2.10'],
      refs: ['M&C ch. 7'],
      tags: ['forced choice', 'sensitivity'],
      credit: 'Green & Swets, 1966',
      viz(v) {
        const M = v.M, NMAX = 4000;
        const dS = v.slider("yes/no $d'$", 0, 3, 1.2, { step: 0.01 });
        const rS = v.slider('noise correlation $\\rho$', -0.5, 0.9, 0, { step: 0.01 });
        const nT = v.slider('trials', 100, NMAX, 800, { int: true, log: true });
        let seed = 5, Z = null, zSeed = -1;
        v.button('New random sample', () => { seed = 1 + ((Math.random() * 1e9) | 0); });
        const sc = v.stage({ x: [-3.2, 5.2], y: [-3.2, 5.2], equal: true, height: 330, weight: 1, axes: true, xlabel: '$x_1$', ylabel: '$x_2$', title: 'each trial is a point (interval 1, interval 2)' });
        const hs = v.stage({ x: [-7, 7], y: [0, 1], height: 330, weight: 1.05, axes: 'box', yticks: [], title: 'the decision variable D = x₂ − x₁' });
        v.legend([['orange', 'signal in interval 1', { dot: true }], ['accent', 'signal in interval 2', { dot: true }], ['ink', 'decision line $x_1=x_2$', { dash: true }], ['purple', "distance between the means: $\\sqrt2\\,d'$"]]);
        let st = null;
        v.render(() => {
          if (zSeed !== seed) { const R = v.rng(seed); Z = { a: M.range(NMAX).map(() => R.normal()), b: M.range(NMAX).map(() => R.normal()), w: M.range(NMAX).map(() => (R() < 0.5 ? 1 : 2)), y: M.range(NMAX).map(() => R.normal()), yw: M.range(NMAX).map(() => R() < 0.5) }; zSeed = seed; }
          const d = dS.value, rho = rS.value, n = nT.value, cr = Math.sqrt(1 - rho * rho);
          const T = []; for (let i = 0; i < n; i++) { const n1 = Z.a[i], n2 = rho * Z.a[i] + cr * Z.b[i], w = Z.w[i]; T.push({ x1: n1 + (w === 1 ? d : 0), x2: n2 + (w === 2 ? d : 0), w }); }
          // ---- scatter
          const lim = Math.max(5.2, d + 3.4); sc.setView([-3.2, lim], [-3.2, lim]);
          sc.dots(T.filter((q) => q.w === 1).map((q) => [q.x1, q.x2]), { r: 2, color: 'orange', alpha: 0.55 });
          sc.dots(T.filter((q) => q.w === 2).map((q) => [q.x1, q.x2]), { r: 2, color: 'accent', alpha: 0.55 });
          sc.line(-4, -4, lim + 1, lim + 1, { color: 'ink', dash: [6, 4], width: 1.6 });
          for (const [mx, my, col] of [[d, 0, 'orange'], [0, d, 'accent']]) {
            sc.curve((th) => [mx + Math.cos(th), my + rho * Math.cos(th) + cr * Math.sin(th)], 0, 2 * Math.PI, { color: col, width: 2.2, n: 120 });
            sc.dot(mx, my, { r: 4.5, color: col });
          }
          if (d > 0.2) { sc.arrow(d, 0, 0, d, { color: 'purple', width: 2.2, head: 8, both: true }); sc.text(`√2·d′ = ${v.fix(Math.SQRT2 * d, 2)}`, d / 2, d / 2, { dx: 12, dy: 12, align: 'left', color: 'purple', size: 12, weight: 700, plate: true }); }
          sc.text('choose 2', -2.9, lim - 0.4, { align: 'left', color: 'muted', size: 11.5, weight: 600 });
          sc.text('choose 1', lim - 0.2, -2.6, { align: 'right', color: 'muted', size: 11.5, weight: 600 });
          // ---- decision variable
          const D1 = T.filter((q) => q.w === 1).map((q) => q.x2 - q.x1), D2 = T.filter((q) => q.w === 2).map((q) => q.x2 - q.x1);
          const sD = Math.sqrt(2 * (1 - rho)), bins = M.linspace(-7, 7, 57), w = bins[1] - bins[0];
          const H1 = M.histogram(D1, { bins }), H2 = M.histogram(D2, { bins }), ym = Math.max(0.3, ...H1.counts.map((c) => c / (D1.length * w)), ...H2.counts.map((c) => c / (D2.length * w)), phi(0) / sD) * 1.2;
          hs.setView(null, [0, ym]);
          hs.hist(H1, { density: true, color: 'orange', fillAlpha: 0.25 }); hs.hist(H2, { density: true, color: 'accent', fillAlpha: 0.25 });
          hs.fn((x) => phi((x + d) / sD) / sD, { color: 'orange', width: 2 }); hs.fn((x) => phi((x - d) / sD) / sD, { color: 'accent', width: 2 });
          hs.vline(0, { color: 'ink', dash: [6, 4], width: 1.4 });
          const m1 = M.mean(D1), m2 = M.mean(D2), sp = Math.sqrt((M.variance(D1) + M.variance(D2)) / 2), sepSD = (m2 - m1) / sp;
          if (m2 - m1 > 0.3) hs.measure(m1, ym * 0.9, m2, ym * 0.9, `${v.fix(sepSD, 2)} SD of D`, { color: 'purple', math: false, size: 12, offset: -11 });
          const H2r = D2.filter((x) => x > 0).length / D2.length, F2r = D1.filter((x) => x > 0).length / D1.length, Pc = (D2.filter((x) => x > 0).length + D1.filter((x) => x <= 0).length) / n;
          const E = sdt(M, D2.filter((x) => x > 0).length, D2.length, D1.filter((x) => x > 0).length, D1.length);
          st = { d, rho, n, sepSD, H2r, F2r, Pc, E };
        });
        v.readout(() => {
          if (!st) return '';
          const { d, rho, n, sepSD, Pc, E } = st, f = Math.sqrt(2 / (1 - rho));
          return `${n} trials · separation of the two $D$ distributions: ${v.fix(sepSD, 3)} SD · $d'_{\\rm 2AFC}=z(H_2)-z(F_2)$ = **${v.fix(E.d, 3)}** · ratio to the yes/no $d'$ = ${d > 0.05 ? v.fix(E.d / d, 3) : '—'} (theory $\\sqrt{2/(1-\\rho)}$ = ${v.fix(f, 3)}${Math.abs(rho) < 0.005 ? ' = √2' : ''}) · proportion correct ${v.fix(Pc, 3)} (theory $\\Phi(d'/\\sqrt{2(1-\\rho)})$ = ${v.fix(Phi(M, d / Math.sqrt(2 * (1 - rho))), 3)}) · yes/no $d'$ recovered as $\\sqrt2\\,z(P_c)$ = ${v.fix(Math.SQRT2 * zq(M, Math.min(0.9995, Math.max(0.0005, Pc))), 3)}${Math.abs(rho) > 0.02 ? ' — wrong when the intervals are correlated' : ` (true ${v.fix(d, 2)})`}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.12
    {
      num: '2.12',
      kind: 'Theorem',
      name: 'Optimal criterion from payoffs and base rates',
      statement: String.raw`Suppose signals occur with prior probability $\pi$, a hit earns $V_H$, a correct rejection $V_{CR}$, a miss costs $C_M$ and a false alarm $C_{FA}$. For evidence $x$ with likelihood ratio $\ell(x)=f_S(x)/f_N(x)$, answering “yes” has the higher expected payoff exactly when
$$\ell(x)\ \ge\ \beta^*=\frac{1-\pi}{\pi}\cdot\frac{V_{CR}+C_{FA}}{V_H+C_M},$$
so the rule that maximises expected payoff says “yes” when the likelihood ratio exceeds $\beta^*$. In the equal-variance Gaussian model $\ln\ell(x)=d'x-d'^2/2$ increases with $x$, so the rule is a cut at
$$k^*=\frac{d'}{2}+\frac{\ln\beta^*}{d'},\qquad c^*=\frac{\ln\beta^*}{d'},$$
which is where the slope of the ROC equals $\beta^*$ (2.6). With equal payoffs, maximising expected payoff is maximising percent correct and $\beta^*=(1-\pi)/\pi$. People move their criterion in the right direction when priors or payoffs change, but usually not as far as $\beta^*$ requires (Green & Swets, 1966; Maddox, 2002).`,
      idea: String.raw`Given $x$, the posterior odds of a signal are $\frac{\pi}{1-\pi}\,\ell(x)$ (Bayes' theorem, stat-10.1). Saying “yes” instead of “no” gains $V_H+C_M$ if there is a signal and loses $V_{CR}+C_{FA}$ if there is not, so it pays exactly when the posterior odds exceed $(V_{CR}+C_{FA})/(V_H+C_M)$: a threshold on $\ell(x)$, as in the Neyman–Pearson lemma (stat-6.4), with the multiplier set by the stakes. The expected payoff of a criterion $k$ is a constant plus $\int_k^\infty\big[\pi(V_H+C_M)f_S-(1-\pi)(V_{CR}+C_{FA})f_N\big]dx$, so the loss from using $k$ instead of $k^*$ is exactly the area between the two weighted densities from $k$ to $k^*$.`,
      caption: String.raw`Left: the two densities weighted by prior and stakes, $\pi(V_H+C_M)f_S$ (blue) and $(1-\pi)(V_{CR}+C_{FA})f_N$ (grey); they cross at the optimal criterion (green). Drag the **purple** criterion: the red area between the curves, from your criterion to the optimum, is your expected loss per trial. Right: the likelihood ratio on a log scale, a straight line in $x$, meets the level $\beta^*$ at the optimum. Bottom: expected payoff per trial for every criterion. Set the **signal probability** and the four **payoffs**, then press *Play 1000 trials* to run your criterion and the optimal one on the same simulated trials.`,
      deps: ['psych-2.4', 'stat-6.4', 'stat-10.1'],
      see: ['epi-2.7', 'epi-2.4'],
      refs: ['M&C ch. 2'],
      tags: ['criterion', 'decision theory'],
      credit: 'Peterson, Birdsall & Fox, 1954; Green & Swets, 1966',
      viz(v) {
        const M = v.M, LO = -3.4, HI = 6;
        const pS = v.slider('signal probability $\\pi$', 0.02, 0.98, 0.3, { step: 0.01 });
        const dS = v.slider("$d'$", 0.3, 3, 1.5, { step: 0.01 });
        const vH = v.slider('hit pays $V_H$', 0.25, 10, 2, { step: 0.25 });
        const cM = v.slider('miss costs $C_M$', 0, 10, 1, { step: 0.25 });
        const vC = v.slider('correct rejection pays $V_{CR}$', 0, 10, 1, { step: 0.25 });
        const cF = v.slider('false alarm costs $C_{FA}$', 0.25, 10, 1, { step: 0.25 });
        let ytop = 0.5, game = null, gSeed = 1;
        v.button('Play 1000 trials', () => {
          const R = v.rng(1000 + gSeed++), P = par(); let you = 0, opt = 0;
          for (let i = 0; i < 1000; i++) { const s = R() < P.pi, x = R.normal() + (s ? P.d : 0); const pay = (yes) => (s ? (yes ? P.vh : -P.cm) : (yes ? -P.cf : P.vc)); you += pay(x > crit.x); opt += pay(x > P.ks); }
          game = { you, opt, k: crit.x, ks: P.ks, ev: 1000 * (EV(P, crit.x) - EV(P, P.ks)) };
        });
        const de = v.stage({ x: [LO, HI], y: [0, 1], height: 280, axes: 'box', weight: 1.15, xlabel: 'evidence $x$', yticks: [], title: 'weighted densities: they cross at the best criterion' });
        const lr = v.stage({ x: [LO, HI], y: [Math.log(1 / 300), Math.log(300)], height: 280, axes: 'box', weight: 0.85, minWidth: 230, xlabel: 'evidence $x$', yticks: [[Math.log(0.01), '1/100'], [Math.log(0.1), '1/10'], [0, '1'], [Math.log(10), '10'], [Math.log(100), '100']], title: 'likelihood ratio ℓ(x), log scale' });
        const ev = v.stage({ x: [LO, HI], y: [0, 1], height: 190, axes: 'box', full: true, xlabel: 'criterion $k$', title: 'expected payoff per trial' });
        const crit = de.handle(0.6, 0.5, { color: 'purple', constrain: (x) => [M.clamp(x, LO + 0.2, HI - 0.2), ytop] });
        const par = () => {
          const pi = pS.value, d = dS.value, vh = vH.value, cm = cM.value, vc = vC.value, cf = cF.value, bs = ((1 - pi) / pi) * ((vc + cf) / (vh + cm));
          return { pi, d, vh, cm, vc, cf, bs, ks: d / 2 + Math.log(bs) / d, wS: pi * (vh + cm), wN: (1 - pi) * (vc + cf) };
        };
        const EV = (P, k) => { const H = Phi(M, P.d - k), F = Phi(M, -k); return P.pi * (P.vh * H - P.cm * (1 - H)) + (1 - P.pi) * (P.vc * (1 - F) - P.cf * F); };
        v.legend([['accent', 'signal, weighted by $\\pi(V_H+C_M)$'], ['muted', 'noise, weighted by $(1-\\pi)(V_{CR}+C_{FA})$'], ['green', 'optimal criterion $k^*$, where $\\ell = \\beta^*$'], ['purple', 'your criterion'], ['red', 'expected loss', { area: true }]]);
        let st = null;
        v.render(() => {
          const P = par(), k = crit.x, d = P.d, gS = (x) => P.wS * phi(x - d), gN = (x) => P.wN * phi(x), ks = P.ks;
          // ---- weighted densities
          const ym = Math.max(P.wS, P.wN) * phi(0) * 1.32; ytop = ym * 0.93; de.setView(null, [-0.07 * ym, ym]); crit.set(k, ytop);
          if (Math.abs(k - ks) > 1e-3) { const a = Math.max(LO, Math.min(k, ks)), b = Math.min(HI, Math.max(k, ks)); if (b > a) de.between(gS, gN, a, b, { fill: 'red', fillAlpha: 0.35 }); }
          de.fn(gN, { domain: [LO, HI], color: 'muted', width: 2.2 }); de.fn(gS, { domain: [LO, HI], color: 'accent', width: 2.4 });
          if (ks > LO && ks < HI) { de.vline(ks, { color: 'green', width: 2.2, dash: [6, 4] }); de.text('k*', ks, ym * 0.8, { dx: 6, align: 'left', color: 'green', weight: 700, size: 13, math: true }); }
          de.line(k, -0.07 * ym, k, ytop, { color: 'purple', width: 2 });
          // ---- likelihood ratio line
          const lb = Math.log(P.bs);
          lr.fn((x) => d * x - (d * d) / 2, { color: 'accent', width: 2.4 });
          lr.hline(lb, { color: 'green', width: 1.8, dash: [6, 4] });
          lr.text(`β* = ${v.fmt(P.bs, 3)}`, HI - 0.1, lb, { dy: lb > 3 ? 12 : -10, align: 'right', color: 'green', weight: 700, size: 12 });
          if (ks > LO && ks < HI) { lr.line(ks, Math.log(1 / 300), ks, lb, { color: 'green', width: 1.2, dash: [2, 3] }); lr.dot(ks, lb, { r: 5, color: 'green' }); }
          lr.vline(k, { color: 'purple', width: 1.4, alpha: 0.7 }); lr.dot(k, d * k - (d * d) / 2, { r: 5, color: 'purple' });
          // ---- expected payoff curve
          const ks2 = M.linspace(LO, HI, 200), evs = ks2.map((x) => EV(P, x)), lo = Math.min(...evs), hi = Math.max(...evs), pad = 0.12 * (hi - lo || 1);
          ev.setView(null, [lo - pad, hi + pad]);
          ev.path(ks2.map((x, i) => [x, evs[i]]), { color: 'ink', width: 2.2 });
          const eK = EV(P, k), eS = EV(P, ks);
          if (ks > LO && ks < HI) { ev.dot(ks, eS, { r: 5.5, color: 'green' }); ev.text(`best ${v.fix(eS, 3)}`, ks, eS, { dy: -12, align: 'center', color: 'green', weight: 700, size: 12 }); }
          ev.dot(k, eK, { r: 5.5, color: 'purple' }); ev.text(`yours ${v.fix(eK, 3)}`, k, eK, { dy: 14, align: 'center', color: 'purple', weight: 700, size: 12 });
          st = { P, k, eK, eS, lossArea: Math.abs(M.integrate((x) => gS(x) - gN(x), Math.min(k, ks), Math.max(k, ks), 400)) };
        });
        v.readout(() => {
          if (!st) return '';
          const { P, k, eK, eS, lossArea } = st, beta = Math.exp(P.d * k - (P.d * P.d) / 2);
          const g = game ? ` · last 1000 trials: your criterion (k = ${v.fix(game.k, 2)}) earned ${v.fix(game.you, 0)}, the optimal one ${v.fix(game.opt, 0)} on the same trials (expected gap ${v.fix(-game.ev, 0)})` : '';
          return `$\\beta^* = \\frac{1-\\pi}{\\pi}\\cdot\\frac{V_{CR}+C_{FA}}{V_H+C_M}$ = ${v.fix((1 - P.pi) / P.pi, 3)} × ${v.fix((P.vc + P.cf) / (P.vh + P.cm), 3)} = **${v.fmt(P.bs, 4)}** → $k^*$ = ${v.fix(P.ks, 3)}, $c^*$ = ${v.fix(P.ks - P.d / 2, 3)} · your criterion $k$ = ${v.fix(k, 2)} has $\\beta$ = ${v.fmt(beta, 3)} · expected payoff per trial: yours ${v.fix(eK, 4)}, optimal ${v.fix(eS, 4)}, loss ${v.fix(eS - eK, 4)} = red area ${v.fix(lossArea, 4)}${g}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.13
    {
      num: '2.13',
      kind: 'Concept',
      name: 'The ideal observer',
      statement: String.raw`The **ideal observer** for a detection task is the decision rule that uses all the information in the physical stimulus optimally: it computes the likelihood ratio of the stimulus under the two hypotheses and compares it with a criterion (2.12). Its sensitivity $d'_{\text{ideal}}$ is the best any observer could achieve, so it measures the information in the stimulus itself, and a real observer's performance can be expressed as a **statistical efficiency**
$$\eta=\Big(\frac{d'_{\text{obs}}}{d'_{\text{ideal}}}\Big)^2,$$
the fraction of the stimulus energy that the observer effectively uses (Tanner & Birdsall, 1958). For a signal known exactly, a pattern with pixel values $s_i$ added to independent Gaussian pixel noise of standard deviation $\sigma$, the ideal observer is a **template matcher**: it correlates the image $x$ with the signal, $r=\sum_i s_ix_i$, and
$$d'_{\text{ideal}}=\frac{\lVert s\rVert}{\sigma}=\frac{\sqrt{\sum_i s_i^2}}{\sigma}.$$
A matcher using another template $t$ reaches only $d'_{\text{ideal}}\cos\theta$, where $\theta$ is the angle between $t$ and $s$ as vectors of pixel values. Human efficiencies for simple patterns in visual noise are well below one but can reach about 50% (Burgess, Wagner, Jennings & Barlow, 1981).`,
      idea: String.raw`With white Gaussian noise the log likelihood ratio of an image is $(r-\tfrac12\lVert s\rVert^2)/\sigma^2$, a linear function of the template response $r$, so thresholding $r$ is the likelihood-ratio test and nothing else in the image matters (it is a sufficient statistic). Under noise alone $r\sim N(0,\sigma^2\lVert s\rVert^2)$, with the signal $r\sim N(\lVert s\rVert^2,\sigma^2\lVert s\rVert^2)$, which gives $d'=\lVert s\rVert/\sigma$. A human observer loses information to internal noise, to an imperfect template and to uncertainty about where and what the signal is; efficiency puts all these losses on one scale, and because $d'^2$ is proportional to signal energy, $1/\eta$ is how many times more energy the observer needs than the ideal for the same $d'$.`,
      caption: String.raw`The signal is a small grating patch, known exactly (top right), added to pixel noise. The histogram shows the decision variable of a template matcher, its template response, on 600 simulated images (or on yours), with the theoretical Gaussians; the simulated human is the exact matcher plus internal noise, which makes its efficiency 25%. Switch the **template used** to a shifted, a rotated or a blob-shaped one: a matcher that does not match loses $d'$ by the factor $\cos\theta$. Switch to **you**: *▶ Flash* shows a noisy image for half a second; say whether it contained the pattern. Your $d'$, the ideal observer's $d'$ on exactly the same images, and your efficiency appear in the readout.`,
      deps: ['psych-2.12', 'psych-2.3'],
      refs: ['Gescheider ch. 6'],
      tags: ['ideal observer', 'efficiency'],
      credit: 'Tanner & Birdsall, 1958; Barlow, 1962; Burgess et al., 1981',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Ideal_observer_analysis' },
      viz(v) {
        const M = v.M, after = timers(v), NP = 20, SIG = 0.24, NSIM = 600, ETA = 0.25;
        const gab = (x, y) => Math.exp(-(x * x + y * y) / (2 * 2.8 * 2.8)) * Math.cos((2 * Math.PI * x) / 6);
        const mk = (f) => { const a = new Float64Array(NP * NP); for (let j = 0; j < NP; j++) for (let i = 0; i < NP; i++) a[j * NP + i] = f(i - (NP - 1) / 2, j - (NP - 1) / 2); return a; };
        const S = mk(gab), TPL = { exact: S, shift: mk((x, y) => gab(x - 2, y)), rot: mk((x, y) => gab(y, x)), blob: mk((x, y) => Math.exp(-(x * x + y * y) / (2 * 2.8 * 2.8))) };
        const dot = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; }, nS = Math.sqrt(dot(S, S));
        let phase = 'idle', tid = 0, cur = null, you = [], seed = 27, sim = null, simKey = '', idx = 0;
        const who = v.select('subject', OBS, 'sim', { onChange: () => { after.clear(); phase = 'idle'; } });
        const tplS = v.select('template used', [{ value: 'exact', label: 'the signal (ideal)' }, { value: 'shift', label: 'shifted 2 px' }, { value: 'rot', label: 'rotated 90°' }, { value: 'blob', label: 'a blob' }], 'exact');
        const dI = v.slider("signal strength (ideal $d'$)", 0.5, 6, 3, { step: 0.05 });
        const bAn = v.button('Show another image', () => { idx++; });
        const bFl = v.button('▶ Flash', () => flash());
        const bY = v.button('Pattern', () => answer(true));
        const bN = v.button('No pattern', () => answer(false));
        const bRes = v.button('Reset', () => { after.clear(); phase = 'idle'; you = []; });
        const im = v.stage({ x: [-0.02, 1.62], y: [-0.12, 1.02], equal: true, axes: false, height: 290, weight: 0.95, title: 'the image and the templates' });
        const hs = v.stage({ x: [-4.5, 9], y: [0, 1], height: 290, axes: 'box', weight: 1.05, yticks: [], title: 'template response, in noise SD units' });
        const amp = () => (dI.value * SIG) / nS;
        const image = (R, s) => { const a = amp(), x = new Float64Array(NP * NP); for (let i = 0; i < x.length; i++) x[i] = (s ? a * S[i] : 0) + SIG * R.normal(); return x; };
        const resp = (x, t) => dot(t, x) / (SIG * Math.sqrt(dot(t, t)));
        const simTrials = () => {
          const key = [seed, dI.value].join('|');
          if (key !== simKey) { simKey = key; const R = v.rng(seed); sim = M.range(NSIM).map((i) => { const s = i % 2 === 1, x = image(R, s); return { s, x, zi: R.normal() }; }); }
          return sim;
        };
        const Ry = v.rng(4242);
        const flash = () => { if (who.value !== 'you' || phase !== 'idle') return; const s = Ry() < 0.5; cur = { s, x: image(Ry, s) }; tid++; phase = 'flash'; after(500, () => { phase = 'wait'; }); };
        const answer = (r) => { if (who.value !== 'you' || phase !== 'wait') return; you.push({ s: cur.s, x: cur.x, r }); phase = 'idle'; after(450, flash); };
        const grey = (val) => { const g = M.clamp(Math.round(128 * (1 + val)), 0, 255); return [g, g, g]; };
        const drawImg = (x, key) => {
          const t = TPL[tplS.value], tm = Math.max(...t.map(Math.abs)), sm = Math.max(...S.map(Math.abs));
          im.raster((px, py) => {
            if (px >= 0 && px < 1 && py >= 0 && py < 1) { if (!x) return [128, 128, 128]; const i = Math.floor(px * NP), j = Math.floor((1 - py) * NP); return grey(x[j * NP + i]); }
            for (const [y0, arr, mx] of [[0.56, S, sm], [0.06, t, tm]]) {
              const u = (px - 1.14) / 0.42, w = (py - y0) / 0.42;
              if (u >= 0 && u < 1 && w >= 0 && w < 1) { const i = Math.floor(u * NP), j = Math.floor((1 - w) * NP); return grey((0.55 * arr[j * NP + i]) / mx); }
            }
            return null;
          }, { res: 1, key: key + '|' + tplS.value, id: 'img' });
        };
        v.legend([['muted', 'noise images'], ['accent', 'signal images'], ['purple', 'yes/no criterion of the matcher']]);
        let stt = null;
        v.render(() => {
          const isYou = who.value === 'you', t = TPL[tplS.value], cosT = dot(t, S) / (Math.sqrt(dot(t, t)) * nS), dT = dI.value * cosT;
          bAn.hidden = isYou; bFl.hidden = bY.hidden = bN.hidden = bRes.hidden = !isYou;
          // ---- image panel
          let shown = null, lab = '';
          if (isYou) { if (phase === 'flash') shown = cur.x; lab = phase === 'wait' ? 'Was the pattern there?' : phase === 'flash' ? '' : 'press ▶ Flash'; }
          else { const T = simTrials(), q = T[(2 * (idx % (NSIM / 2)) + 1) % NSIM]; shown = q.x; lab = 'a signal image (signal + noise)'; }
          drawImg(shown, isYou ? 'y' + tid + phase : 's' + idx + '|' + simKey);
          im.rect(0, 0, 1, 1, { color: 'faint', width: 1 });
          im.text(lab, 0.5, -0.06, { align: 'center', color: 'muted', size: 12 });
          im.text('signal', 1.35, 1.0, { align: 'center', baseline: 'bottom', color: 'muted', size: 11 });
          im.text('template used', 1.35, 0.5, { align: 'center', baseline: 'bottom', color: 'muted', size: 11 });
          im.text(`cos θ = ${v.fix(cosT, 2)}`, 1.35, 0.0, { align: 'center', baseline: 'top', color: 'purple', size: 11, weight: 700 });
          // ---- decision variable
          const trials = isYou ? you : simTrials(), rN = [], rS = [];
          for (const q of trials) (q.s ? rS : rN).push(resp(q.x, t));
          const bins = M.linspace(-4.5, 9, 55), w = bins[1] - bins[0], nn = Math.max(1, rN.length), ns = Math.max(1, rS.length);
          const HN = M.histogram(rN, { bins }), HS = M.histogram(rS, { bins });
          const ym = Math.max(0.5, ...HN.counts.map((c) => c / (nn * w)), ...HS.counts.map((c) => c / (ns * w))) * 1.15;
          hs.setView(null, [0, ym]);
          if (rN.length) hs.hist(HN, { density: true, color: 'muted', fillAlpha: 0.3 });
          if (rS.length) hs.hist(HS, { density: true, color: 'accent', fillAlpha: 0.3 });
          hs.fn((r) => phi(r), { color: 'muted', width: 2 }); hs.fn((r) => phi(r - dT), { color: 'accent', width: 2 });
          hs.vline(dT / 2, { color: 'purple', width: 1.6, dash: [5, 4] });
          if (Math.abs(dT) > 0.3) hs.measure(0, ym * 0.88, dT, ym * 0.88, `d′ = ${v.fix(dT, 2)}`, { color: 'ink', math: false, size: 12, offset: -11 });
          if (!trials.length) hs.text('no trials yet', 2.25, ym * 0.5, { align: 'center', color: 'muted', size: 13 });
          // ---- performance
          let obs = null, ideal = null;
          const sN = trials.filter((q) => q.s).length, nN = trials.length - sN;
          if (sN && nN) {
            const dIs = dI.value, hI = trials.filter((q) => q.s && resp(q.x, S) > dIs / 2).length, fI = trials.filter((q) => !q.s && resp(q.x, S) > dIs / 2).length;
            ideal = sdt(M, hI, sN, fI, nN);
            if (isYou) { const h = trials.filter((q) => q.s && q.r).length, f = trials.filter((q) => !q.s && q.r).length; obs = sdt(M, h, sN, f, nN); }
            else { const dh = dIs * Math.sqrt(ETA), sdI = Math.sqrt(1 / ETA - 1); let h = 0, f = 0; for (const q of trials) { const y = resp(q.x, S) + sdI * q.zi; if (y > dIs / 2) { if (q.s) h++; else f++; } } obs = sdt(M, h, sN, f, nN); obs.dTrue = dh; }
          }
          stt = { isYou, cosT, dT, obs, ideal, n: trials.length, mN: rN.length ? M.mean(rN) : NaN, mS: rS.length ? M.mean(rS) : NaN };
        });
        v.readout(() => {
          if (!stt) return '';
          const { isYou, cosT, dT, obs, ideal, n, mN, mS } = stt;
          const head = `ideal $d'=\\lVert s\\rVert/\\sigma$ = ${v.fix(dI.value, 2)} · this template: $\\cos\\theta$ = ${v.fix(cosT, 3)}, so $d'$ = ${v.fix(dT, 2)}${n ? `; measured on these ${n} images: mean response difference ${v.fix(mS - mN, 2)}` : ''}`;
          if (!obs) return head + (isYou ? ' · no answers yet: press **▶ Flash** (you need both kinds of image before $d\'$ can be computed)' : '');
          const eff = Math.pow(Math.max(0, obs.d) / Math.max(1e-9, ideal.d), 2), seE = eff * 2 * Math.sqrt((obs.seD / Math.max(0.05, obs.d)) ** 2 + (ideal.seD / Math.max(0.05, ideal.d)) ** 2);
          return `${head} · ideal observer's yes/no $d'$ on the same images ${v.fix(ideal.d, 2)} · ${isYou ? 'your' : 'simulated human’s'} $d'$ = **${v.fix(obs.d, 2)}** (H = ${v.fix(obs.H, 2)}, F = ${v.fix(obs.F, 2)}) · efficiency $\\eta=(d'_{\\rm obs}/d'_{\\rm ideal})^2$ = **${pc(eff)}** ± ${pc(1.96 * seE)}${isYou ? '' : ` (built in: ${pc(ETA)})`}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.14
    {
      num: '2.14',
      kind: 'Phenomenon',
      name: 'Detection in the wild: screening and rare targets',
      statement: String.raw`When targets are rare, searchers miss more of them. In laboratory searches of cluttered, baggage-like displays, Wolfe, Horowitz and Kenner (2005) found a miss rate of 7% when a target was present on half of the trials but 30% when it was present on 1%; with realistic X-ray images of bags and full feedback, Wolfe and colleagues (2007) found 20% misses at 50% prevalence and 46% at 2% (as summarised by Van Wert, Horowitz & Wolfe, 2009). The extra misses come mostly from a **criterion shift**: false alarms fall at the same time, $d'$ changes little, the criterion $c$ moves by about one unit in the conservative direction, and target-absent responses get faster. Signal detection theory predicts the direction: an observer who learns the prevalence $\pi$ from feedback and aims to be right as often as possible should set $\beta^*=(1-\pi)/\pi$ (2.12), which is 49 at 2% prevalence. The prevalence effect has also been reported with trained airport screeners and in breast-cancer screening, where targets are rare by nature.`,
      idea: String.raw`With equal stakes the best criterion is the likelihood ratio $(1-\pi)/\pi$: 1 (neutral) at 50% prevalence, 49 at 2%. An observer who tracks the base rate should then say “target” only on strong evidence, accepting misses to avoid a flood of false alarms among the 98% of clean bags. People move less than the ideal amount (2.12) but enough to more than double the miss rate. Because the change is in the criterion, not in $d'$, better eyesight or training to see would not remove it; what helps is changing the decision itself, for instance by raising the effective prevalence or the cost of a miss. Airports insert fictional threat images into real X-ray images of bags (threat image projection) partly for this reason, and the base-rate arithmetic of rare conditions is the same as in medical screening (epi-2.3).`,
      caption: String.raw`A simulated screener with fixed sensitivity $d'$ = 1.8 learns the target prevalence from feedback and moves its criterion part of the way towards the optimum. Middle: its criterion over 1000 bags at 50% prevalence (blue) and at the **low prevalence** you choose (red), with the rare targets it missed marked in orange. Right: miss and false-alarm rates, $d'$ and $c$ in the two conditions, next to the X-ray baggage results of Wolfe and colleagues (outlined bars, 50% and 2%). Turn on **ignores prevalence** to fix the criterion: the miss rates become equal. Switch to **you** and screen bags yourself: answer *Threat* or *Clear* for each bag (a knife is hidden in some, at the prevalence chosen under **your bags**), and your rates join the chart.`,
      deps: ['psych-2.12'],
      see: ['epi-2.3'],
      refs: ['Gescheider ch. 8'],
      tags: ['screening', 'prevalence'],
      credit: 'Wolfe, Horowitz & Kenner, 2005',
      scope: String.raw`Laboratory search tasks and X-ray baggage images with student and professional observers; the size of the effect depends on feedback, display difficulty and payoffs, and real-world miss rates at checkpoints are not public.`,
      viz(v) {
        const M = v.M, after = timers(v), D = 1.8, G = 0.45, T = 4000, TS = 1000, A0 = 5, B0 = 10;
        const DATA = { m50: 0.2, m2: 0.46 }; // Wolfe et al. 2007, X-ray baggage with feedback, as reported by Van Wert, Horowitz & Wolfe (2009)
        const XR = { bg: [238, 240, 233], org: [214, 140, 62], met: [52, 86, 158], inorg: [86, 150, 92] };
        const who = v.select('subject', OBS, 'sim', { onChange: () => { after.clear(); phase = 'idle'; } });
        const lowS = v.select('low prevalence', ['10%', '5%', '2%', '1%'], '2%');
        const fixed = v.toggle('ignores prevalence', false);
        const yourP = v.select('your bags', [{ value: 'hi', label: '50% contain a knife' }, { value: 'lo', label: 'low prevalence' }], 'lo');
        const bStart = v.button('▶ Next bag', () => nextBag());
        const bT = v.button('Threat', () => answer(true));
        const bC = v.button('Clear', () => answer(false));
        const bRes = v.button('Reset', () => { after.clear(); phase = 'idle'; you = { hi: [], lo: [] }; last = null; });
        const bag = v.stage({ x: [0, 1.4], y: [0, 1], equal: true, axes: false, height: 270, weight: 0.85, minWidth: 220, title: 'X-ray screen' });
        const tr = v.stage({ x: [0, TS], y: [-0.6, 2.6], height: 270, axes: 'box', weight: 1.15, xlabel: 'bag number', yticks: [-0.5, 0, 0.5, 1, 1.5], ylabel: 'criterion c', title: 'the screener’s criterion drifts with prevalence' });
        const br = v.stage({ x: [0, 10.4], y: [-0.07, 0.72], height: 240, axes: 'box', full: true, xticks: [[1.5, 'miss rate'], [3.9, 'false-alarm rate'], [6.6, 'miss rate'], [9, 'false-alarm rate']], yticks: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6], title: '50% prevalence (left) and low prevalence (right)' });
        let phase = 'idle', you = { hi: [], lo: [] }, cur = null, tid = 0, last = null, cache = null, cKey = '';
        const lowP = () => parseFloat(lowS.value) / 100;
        /** One simulated screener run: prevalence p, T bags; criterion from the running estimate of prevalence. */
        const run = (p, seed) => {
          const R = v.rng(seed), cs = new Float32Array(T), out = { h: 0, s: 0, f: 0, n: 0, miss: [] }; let seen = 0;
          for (let t = 0; t < T; t++) {
            const ph = (A0 + seen) / (B0 + t), c = fixed.value ? 0 : (G * Math.log((1 - ph) / ph)) / D, s = R() < p, x = R.normal() + (s ? D : 0), yes = x > D / 2 + c;
            cs[t] = c; if (s) seen++;
            if (t >= 200) { if (s) { out.s++; if (yes) out.h++; } else { out.n++; if (yes) out.f++; } }
            if (s && !yes && t < TS) out.miss.push(t);
          }
          return { ...out, cs, e: sdt(M, out.h, out.s, out.f, out.n) };
        };
        /** A seeded bag: clutter of semi-transparent shapes, and maybe a knife. */
        const drawBag = (seed, knife) => {
          const R = v.rng(seed);
          bag.rect(-1, -1, 3, 3, { fill: XR.bg, fillAlpha: 1, stroke: false });
          bag.rect(0.12, 0.1, 1.28, 0.86, { radius: 18, fill: XR.org, fillAlpha: 0.12, color: XR.org, width: 3 });
          bag.path([[0.5, 0.86], [0.55, 0.96], [0.85, 0.96], [0.9, 0.86]], { color: XR.met, width: 3, alpha: 0.6 });
          for (let i = 0; i < 16; i++) {
            const x = R.uniform(0.22, 1.18), y = R.uniform(0.2, 0.76), col = [XR.org, XR.met, XR.inorg][R.int(0, 2)], kind = R.int(0, 3), a = R.uniform(0, Math.PI), w = R.uniform(0.04, 0.16), h = R.uniform(0.02, 0.07);
            const rot = (pts) => pts.map(([u, q]) => [x + u * Math.cos(a) - q * Math.sin(a), y + u * Math.sin(a) + q * Math.cos(a)]);
            if (kind === 0) bag.circle(x, y, w * 0.6, { fill: col, fillAlpha: 0.38, color: col, width: 1, alpha: 0.6 });
            else if (kind === 1) bag.poly(rot([[-w, -h], [w, -h], [w, h], [-w, h]]), { fill: col, fillAlpha: 0.38, color: col, width: 1, alpha: 0.6 });
            else if (kind === 2) bag.poly(rot([[-w, 0], [0, -h * 1.6], [w, 0], [0, h * 1.6]]), { fill: col, fillAlpha: 0.35, color: col, width: 1, alpha: 0.6 });
            else bag.path(rot([[-w, -h], [-w * 0.2, h], [w * 0.4, -h], [w, h]]), { color: col, width: 2.5, alpha: 0.7 });
          }
          if (knife) {
            const x = R.uniform(0.32, 1.08), y = R.uniform(0.28, 0.68), a = R.uniform(0, 2 * Math.PI), sc = 0.085;
            const rot = (pts) => pts.map(([u, q]) => [x + sc * (u * Math.cos(a) - q * Math.sin(a)), y + sc * (u * Math.sin(a) + q * Math.cos(a))]);
            bag.poly(rot([[0, -0.22], [1.25, -0.12], [1.55, 0.05], [0, 0.18]]), { fill: XR.met, fillAlpha: 0.62, stroke: false });
            bag.poly(rot([[-0.9, -0.17], [0, -0.17], [0, 0.17], [-0.9, 0.17]]), { fill: XR.org, fillAlpha: 0.55, stroke: false });
            const c = rot([[0.3, 0]])[0]; return c;
          }
          return null;
        };
        const Ry = v.rng(1414);
        const nextBag = () => { if (who.value !== 'you' || phase === 'wait') return; const p = yourP.value === 'hi' ? 0.5 : lowP(); cur = { k: Ry() < p, seed: 50 + tid * 37, p: yourP.value }; tid++; phase = 'wait'; };
        const answer = (r) => { if (who.value !== 'you' || phase !== 'wait') return; you[cur.p].push({ s: cur.k, r }); last = { s: cur.k, r }; phase = 'idle'; after(350, nextBag); };
        const yourStats = (arr) => { const s = arr.filter((q) => q.s), n = arr.filter((q) => !q.s); if (!s.length || !n.length) return null; const h = s.filter((q) => q.r).length, f = n.filter((q) => q.r).length; return { ...sdt(M, h, s.length, f, n.length), nS: s.length, nN: n.length }; };
        v.legend([['blue', '50% prevalence'], ['red', 'low prevalence'], ['orange', 'misses', { area: true }], ['purple', 'false alarms', { area: true }], ['ink', 'X-ray baggage data (Wolfe et al., 2007)', { dash: true }], ['gold', 'you', { dot: true }]]);
        let stt = null;
        v.render(() => {
          const isYou = who.value === 'you', p = lowP(), key = [p, fixed.value].join('|');
          yourP.el.hidden = !isYou; bStart.hidden = bT.hidden = bC.hidden = bRes.hidden = !isYou;
          if (key !== cKey) { cKey = key; cache = { hi: run(0.5, 501), lo: run(p, 777) }; }
          const { hi, lo } = cache;
          // ---- bag
          if (isYou) {
            if (phase === 'wait') drawBag(cur.seed, cur.k);
            else { bag.rect(-1, -1, 3, 3, { fill: XR.bg, fillAlpha: 1, stroke: false }); bag.text(last ? `last bag: ${last.s ? 'knife' : 'clear'}, you said ${last.r ? 'threat' : 'clear'} ${last.s === last.r ? '✓' : '✗'}` : 'press ▶ Next bag', 0.7, 0.5, { align: 'center', color: [60, 60, 60], halo: false, size: 13 }); }
            bag.text(phase === 'wait' ? 'Is there a knife in this bag?' : '', 0.7, 0.04, { align: 'center', color: [60, 60, 60], halo: false, size: 12 });
          } else { const kc = drawBag(7, true); bag.circle(kc[0], kc[1], 0.13, { color: [200, 40, 60], width: 2, dash: [5, 4] }); bag.text('a bag with a knife (circled)', 0.7, 0.04, { align: 'center', color: [60, 60, 60], halo: false, size: 12 }); }
          // ---- criterion traces
          tr.hline(0, { color: 'faint', width: 1 });
          const cOpt = (pp) => Math.log((1 - pp) / pp) / D;
          tr.setView(null, [-0.6, Math.max(2.2, cOpt(p) + 0.45)]);
          tr.hline(cOpt(p), { color: 'red', dash: [2, 4], width: 1.2, alpha: 0.7 });
          tr.text(`optimal c at ${lowS.value}: ${v.fix(cOpt(p), 2)}`, TS - 10, cOpt(p), { dy: -9, align: 'right', color: 'red', size: 11 });
          for (const [R0, col] of [[hi, 'blue'], [lo, 'red']]) {
            tr.path(M.range(TS / 4).map((i) => [4 * i, R0.cs[4 * i]]), { color: col, width: 2 });
            if (R0 === lo) for (const t of R0.miss) tr.dot(t, R0.cs[t], { r: 3.6, color: 'orange' });
          }
          // ---- bars
          const yH = yourStats(you.hi), yL = yourStats(you.lo);
          const grp = (x0, R0, dataMiss, ys) => {
            const e = R0.e;
            br.rect(x0 + 0.6, 0, x0 + 1.4, 1 - e.H, { fill: 'orange', fillAlpha: 0.55, color: 'orange', width: 1 });
            br.rect(x0 + 3, 0, x0 + 3.8, e.F, { fill: 'purple', fillAlpha: 0.45, color: 'purple', width: 1 });
            br.text(pc(1 - e.H), x0 + 1, 1 - e.H, { dy: -9, align: 'center', color: 'orange', weight: 700, size: 12 });
            br.text(pc(e.F), x0 + 3.4, e.F, { dy: -9, align: 'center', color: 'purple', weight: 700, size: 12 });
            if (dataMiss != null) { br.rect(x0 + 1.5, 0, x0 + 2.1, dataMiss, { color: 'ink', width: 1.8, dash: [4, 3] }); br.text(`data ${pc(dataMiss)}`, x0 + 1.8, dataMiss, { dy: -9, align: 'center', color: 'ink', size: 11 }); }
            if (ys) { br.dot(x0 + 1, 1 - ys.H, { r: 6, color: 'gold' }); br.dot(x0 + 3.4, ys.F, { r: 6, color: 'gold' }); }
            br.text(`d′ = ${v.fix(e.d, 2)}   c = ${v.fix(e.c, 2)}`, x0 + 2.2, 0.66, { align: 'center', color: 'ink', size: 12, weight: 600 });
          };
          grp(0, hi, DATA.m50, yH); grp(5.2, lo, p === 0.02 ? DATA.m2 : null, yL);
          br.vline(5.2, { color: 'faint', width: 1 });
          stt = { hi, lo, p, yH, yL, isYou };
        });
        v.readout(() => {
          if (!stt) return '';
          const { hi, lo, p, yH, yL, isYou } = stt;
          const yt = (y, lab) => (y ? ` · you at ${lab}: ${y.nS + y.nN} bags, miss rate ${pc(1 - y.H)}, false alarms ${pc(y.F)}, $d'$ ${v.fix(y.d, 2)}, $c$ ${v.fix(y.c, 2)}` : '');
          const youTxt = isYou ? (yt(yH, '50%') + yt(yL, lowS.value) || ' · screen some bags: you need at least one bag with and one without a knife in a condition') : '';
          return `simulated screener ($d'$ = ${D}${fixed.value ? ', fixed criterion' : `, criterion moved ${pc(G)} of the way to the optimum`}): at 50% prevalence miss rate **${pc(1 - hi.e.H)}**, false alarms ${pc(hi.e.F)}, $c$ = ${v.fix(hi.e.c, 2)}; at ${pc(p)} miss rate **${pc(1 - lo.e.H)}**, false alarms ${pc(lo.e.F)}, $c$ = ${v.fix(lo.e.c, 2)} · estimated $d'$ ${v.fix(hi.e.d, 2)} vs ${v.fix(lo.e.d, 2)}: the extra misses come from the criterion · X-ray baggage data: misses 20% at 50%, 46% at 2%, with $c$ about one unit higher at low prevalence${youTxt}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.15
    {
      num: '2.15',
      kind: 'Paper',
      name: 'A Decision-Making Theory of Visual Detection',
      paper: { authors: 'Wilson P. Tanner, Jr. and John A. Swets', year: 1954, title: 'A Decision-Making Theory of Visual Detection', venue: 'Psychological Review 61 (6): 401–409', doi: '10.1037/h0058700' },
      introduces: ['psych-2.1', 'psych-2.3', 'psych-2.6', 'psych-2.9'],
      statement: String.raw`Tanner and Swets proposed that visual detection is a problem of **statistical decision**, not of a sensory threshold. In modern terms the paper argued:

(a) every observation interval produces a sensory value that varies from trial to trial, with one distribution when only noise is present and another, shifted one when a signal is added, and there is no level of sensory activity below which a signal has no effect;
(b) the observer answers “yes” when the likelihood ratio of the observation exceeds a criterion, placed according to the prior probability of a signal and the values of the outcomes, as in the theory of signal detectability developed for radar by Peterson, Birdsall and Fox;
(c) hit and false-alarm rates therefore vary together as the criterion moves, along a curve (the receiver operating characteristic) fixed by the observer's sensitivity $d'$, the separation of the two distributions in standard deviations.

In experiments on the detection of brief flashes of light on a uniform background they varied, as later accounts summarise it (the design details here are taken from secondary descriptions, not checked against the paper), the prior probability of a signal in yes/no tasks and reported hit and false-alarm rates that moved together along curved ROCs described by a single $d'$, contrary to high-threshold theory (which predicts straight lines from $(0,p)$ and a constant corrected detection probability), and they reported forced-choice results consistent with the same $d'$. The scope was near-threshold visual flashes and a few trained observers; the equal-variance Gaussian assumption was a working model, and later work found unequal variances in many tasks (2.8).`,
      idea: String.raw`The view the paper attacked went back to Fechner and had been made precise in high-threshold theory (Blackwell, 1953; psych-1.12): a stimulus is either detected or not, false alarms are guesses, and the right analysis corrects for them. Working alongside the University of Michigan engineers who had developed the theory of signal detectability for radar, Tanner and Swets brought in statistical decision theory: an observer is like a receiver that must decide from noisy evidence, and its willingness to say “yes” is a separate, adjustable quantity. The paper introduced into psychology the equal-variance Gaussian model (2.1), the sensitivity index $d'$ (2.3), the ROC (2.6) and the use of its shape to reject threshold theory (2.9). It led to Green and Swets's *Signal Detection Theory and Psychophysics* (1966), and the same ideas now organise research on recognition memory, the evaluation of medical tests and the scoring of classifiers.`,
      caption: String.raw`A recreation, not the paper's data: the points are simulated from the equal-variance Gaussian model for the paper's design, five yes/no blocks in which the prior probability of a flash is 0.1, 0.3, 0.5, 0.7 or 0.9 and the observer puts its criterion where percent correct is highest (the original observers' numbers were not available to check, so they are not reproduced). Left: the two distributions and the five criteria. Middle: the five $(F,H)$ points, the single-$d'$ Gaussian ROC fitted to them (blue) and the best high-threshold line (red). Right: the “corrected” detection probability $(H-F)/(1-F)$ of each block, which threshold theory says should not change. Switch the **true observer** to high threshold to see what the data would have looked like had the old theory been right.`,
      deps: ['psych-1.12', 'stat-6.4'],
      refs: [],
      tags: ['history', 'signal detection'],
      credit: 'Tanner & Swets, 1954',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Detection_theory' },
      viz(v) {
        const M = v.M, PRI = [0.1, 0.3, 0.5, 0.7, 0.9], NMAX = 2000, LO = -3.2, HI = 5.2;
        const kind = v.select('true observer', [{ value: 'g', label: 'Gaussian (the paper)' }, { value: 'ht', label: 'high threshold' }], 'g');
        const dS = v.slider("flash intensity ($d'$)", 0.3, 3, 1.2, { step: 0.01 });
        const nT = v.slider('trials per block', 50, NMAX, 300, { int: true, log: true });
        let seed = 54, U = null, uSeed = -1, cache = null, cKey = '';
        v.button('New random sample', () => { seed = 1 + ((Math.random() * 1e9) | 0); });
        const de = v.stage({ x: [LO, HI], y: [-0.08, 0.5], height: 290, axes: 'box', weight: 1, xlabel: 'sensory value $x$', yticks: [], title: 'one criterion per prior probability' });
        const ro = v.stage({ ...ROCOPT, height: 290, weight: 0.9, minWidth: 230, title: 'the yes/no ROC' });
        const co = v.stage({ x: [-0.04, 1.04], y: [-0.2, 1.05], height: 290, axes: 'box', weight: 0.85, minWidth: 220, xlabel: 'false-alarm rate F', xticks: [0, 0.25, 0.5, 0.75, 1], yticks: [0, 0.25, 0.5, 0.75, 1], title: 'corrected detection (H − F)/(1 − F)' });
        const COL = ['blue', 'teal', 'green', 'orange', 'red'];
        v.legend([...PRI.map((p, i) => [COL[i], `P(signal) = ${p}`, { dot: true }]), ['accent', 'Gaussian fit (one $d\'$)'], ['red', 'high-threshold fit']]);
        v.render(() => {
          if (uSeed !== seed) { const R = v.rng(seed); U = PRI.map(() => ({ s: M.range(NMAX).map(() => R()), n: M.range(NMAX).map(() => R()) })); uSeed = seed; }
          const d = dS.value, n = nT.value, ht = kind.value === 'ht', key = [d, n, ht, seed].join('|');
          if (key !== cKey) {
            cKey = key;
            const ks = PRI.map((p) => d / 2 + Math.log((1 - p) / p) / d), P0 = (Phi(M, d / 2) - Phi(M, -d / 2)) / (1 - Phi(M, -d / 2));
            const blocks = PRI.map((p, i) => {
              const nS = Math.round(p * n), nN = n - nS, F0 = Phi(M, -ks[i]), H0 = ht ? P0 + (1 - P0) * F0 : Phi(M, d - ks[i]);
              let h = 0, f = 0; for (let j = 0; j < nS; j++) if (U[i].s[j] < H0) h++; for (let j = 0; j < nN; j++) if (U[i].n[j] < F0) f++;
              return { p, nS, nN, h, f, H: h / nS, F: f / nN, k: ks[i] };
            });
            const lg = (x) => Math.log(Math.min(1 - 1e-12, Math.max(1e-12, x)));
            const binLL = (k, N, q) => k * lg(q) + (N - k) * lg(1 - q);
            // Gaussian: common d′, one criterion per block
            const nllG = (t) => { let L = 0; blocks.forEach((b, i) => { L -= binLL(b.h, b.nS, Phi(M, t[0] - t[i + 1])) + binLL(b.f, b.nN, Phi(M, -t[i + 1])); }); return L; };
            const g0 = [Math.max(0.1, d), ...blocks.map((b) => -zq(M, (b.f + 0.5) / (b.nN + 1)))];
            const fg = nelderMead(nllG, g0, g0.map(() => 0.3), 3000);
            // high threshold: common p, one guessing rate per block (logits)
            const ex = (u) => 1 / (1 + Math.exp(-u));
            const nllH = (t) => { const p = ex(t[0]); let L = 0; blocks.forEach((b, i) => { const g = ex(t[i + 1]); L -= binLL(b.h, b.nS, p + (1 - p) * g) + binLL(b.f, b.nN, g); }); return L; };
            const h0 = [0, ...blocks.map((b) => Math.log((b.f + 0.5) / (b.nN - b.f + 0.5)))];
            const fh = nelderMead(nllH, h0, h0.map(() => 0.4), 3000);
            const sat = -blocks.reduce((s, b) => s + binLL(b.h, b.nS, (b.h + 1e-9) / b.nS) + binLL(b.f, b.nN, (b.f + 1e-9) / b.nN), 0);
            const chi = M.dist.chi2(4), gG = 2 * (fg.f - sat), gH = 2 * (fh.f - sat);
            cache = { blocks, dG: fg.x[0], kG: fg.x.slice(1), pH: ex(fh.x[0]), gG, gH, pG: 1 - chi.cdf(gG), pHv: 1 - chi.cdf(gH) };
          }
          const { blocks, dG, pH } = cache;
          // ---- distributions with five criteria
          de.fn((x) => phi(x), { domain: [LO, HI], color: 'muted', width: 2.2, fill: 'muted', fillAlpha: 0.06 });
          de.fn((x) => phi(x - d), { domain: [LO, HI], color: 'accent', width: 2.4, fill: 'accent', fillAlpha: 0.08 });
          de.text('noise', -1.9, phi(1.9), { dx: -5, dy: -6, align: 'right', color: 'muted', size: 12, weight: 600 });
          de.text('flash', d + 1.9, phi(1.9), { dx: 5, dy: -6, align: 'left', color: 'accent', size: 12, weight: 600 });
          de.setTitle(ht ? 'high threshold: no criterion, only guessing' : 'one criterion per prior probability');
          blocks.forEach((b, i) => { if (b.k > LO && b.k < HI) { de.line(b.k, -0.08, b.k, 0.44, { color: COL[i], width: 1.8, alpha: ht ? 0.3 : 1, dash: ht ? [4, 4] : null }); de.text(String(b.p), b.k, 0.44, { dy: -8 - (i % 2) * 12, align: 'center', color: COL[i], size: 11, weight: 700 }); } });
          // ---- ROC
          rocFrame(ro, M);
          ro.path(rocPts(M, dG), { color: 'accent', width: 2.4 });
          ro.line(0, pH, 1, 1, { color: 'red', width: 2 });
          blocks.forEach((b, i) => {
            const [a, bb] = wilson(b.f, b.nN), [c, e] = wilson(b.h, b.nS);
            ro.line(a, b.H, bb, b.H, { color: COL[i], width: 1.2, alpha: 0.6 }); ro.line(b.F, c, b.F, e, { color: COL[i], width: 1.2, alpha: 0.6 });
            ro.dot(b.F, b.H, { r: 5.5, color: COL[i] });
          });
          // ---- corrected detection probability
          co.hline(pH, { color: 'red', width: 2 });
          co.path(M.linspace(0.002, 0.998, 160).map((F) => [F, (Phi(M, dG + zq(M, F)) - F) / (1 - F)]), { color: 'accent', width: 2.2 });
          blocks.forEach((b, i) => { const c = b.F < 1 ? (b.H - b.F) / (1 - b.F) : NaN; co.dot(b.F, c, { r: 5.5, color: COL[i] }); });
        });
        v.readout(() => {
          if (!cache) return '';
          const { blocks, dG, pH, gG, gH, pG, pHv } = cache, cs = blocks.map((b) => (b.H - b.F) / (1 - b.F));
          return `rates by block (P(signal) 0.1 … 0.9): ${blocks.map((b) => `(${v.fix(b.F, 2)}, ${v.fix(b.H, 2)})`).join(' ')} · one-$d'$ Gaussian fit: $d'$ = **${v.fix(dG, 2)}** (true ${v.fix(dS.value, 2)}), $G^2$ = ${v.fix(gG, 1)}, p ${pv(pG)} · high-threshold fit: $p$ = ${v.fix(pH, 2)}, $G^2$ = ${v.fix(gH, 1)}, p ${pv(pHv)} · corrected detection probability ranges ${v.fix(Math.min(...cs), 2)}–${v.fix(Math.max(...cs), 2)} · today's view agrees with the paper's conclusion: yes/no and rating ROCs for near-threshold flashes and tones are curved and ordered by $d'$, and $d'$, not the corrected hit rate, is the standard sensitivity measure; equal variances are the exception rather than the rule outside simple detection (z-ROC slopes near 0.8 in recognition memory)`;
        });
      },
    },
  ],
};
