// Understanding Machine Learning — Chapter 3: A Formal Learning Model
//
// PAC learnability as a game the reader plays against an adversary, the sample-complexity bound of finite classes
// against simulation, then noisy labels (a distribution over X × Y), the Bayes predictor, the agnostic model and general
// losses. Helpers: ch03.shared.js (which re-exports those of chapters 1 and 2).
import {
  clamp, rand, hashStr, memo, mean, commas, makeDens, RECT, NONE, target, inShape, disagree, drawSample, tightBox, drawShape, drawSample2,
  paintSquare, square, pr, G3, makeEta, drawNoisy, riskTable, gridCounts, gridErm, bestGridRect, bins, quantile, etaRaster,
} from './ch03.shared.js';

const HID = RECT(0.2, 0.3, 0.8, 0.75);
/** Sample size that makes the tightest-rectangle learner (2 dimensions) PAC: 4(1-ε/4)^m ≤ δ. */
const mRect = (eps, delta) => Math.ceil(Math.log(4 / delta) / -Math.log(1 - eps / 4));

export default {
  collection: 'ml',
  chapter: 3,
  title: 'A Formal Learning Model',
  summary: String.raw`PAC learnability asks for a sample size, depending only on the accuracy ε and the confidence δ, that suffices for every distribution and every target in the class; finite classes are PAC learnable. Dropping realizability, the labels become random and the learner competes with the best hypothesis of the class (agnostic PAC learning), the Bayes predictor marking the unattainable ideal. Replacing the 0–1 loss by an arbitrary loss on an arbitrary example domain extends the model to regression, multiclass and unsupervised tasks.`,
  items: [
    // ───────────────────────────────────────────────────────────── 3.1
    {
      num: '3.1',
      kind: 'Definition',
      name: 'PAC learnability',
      statement: String.raw`A hypothesis class $\mathcal H$ is **PAC learnable** if there are a function $m_{\mathcal H}:(0,1)^2\to\mathbb N$ and a learning algorithm $A$ with the following property: for every accuracy $\varepsilon\in(0,1)$ and confidence $\delta\in(0,1)$, for **every** distribution $\mathcal D$ over $\mathcal X$ and **every** labelling function $f:\mathcal X\to\{0,1\}$ for which the realizability assumption holds ($f$ agrees with some member of $\mathcal H$ everywhere), running $A$ on $m\ge m_{\mathcal H}(\varepsilon,\delta)$ i.i.d. examples labelled by $f$ returns a hypothesis $h$ that, with probability at least $1-\delta$ over the choice of the sample, satisfies $L_{\mathcal D,f}(h)\le\varepsilon$. The smallest such function is the **sample complexity** of $\mathcal H$. The number $m_{\mathcal H}$ may depend on $\varepsilon$, $\delta$ and $\mathcal H$ but not on $\mathcal D$ or $f$.`,
      idea: String.raw`The definition is a guarantee in two parts. Accuracy $\varepsilon$ says how close to perfect the output must be (an approximately correct predictor); confidence $\delta$ says how often the sample may be so unlucky that it fails (probably). The quantifier order carries the content: $m_{\mathcal H}$ is fixed first and must then work against an adversary who picks the worst $\mathcal D$ and $f$ afterwards, which is what makes the guarantee distribution-free. For axis-aligned rectangles the tightest-box learner of ml-2.1e's setting is PAC with $m_{\mathcal H}(\varepsilon,\delta)=\lceil\ln(4/\delta)/\ln(1/(1-\varepsilon/4))\rceil\approx4\ln(4/\delta)/\varepsilon$, since the error region is covered by four strips each of mass $\varepsilon/4$ and each is missed by all $m$ examples with probability $(1-\varepsilon/4)^m$.`,
      caption: String.raw`You are the adversary. Drag the orange handle (the centre of $\mathcal D$), the spread slider, and the two green corners (the hidden rectangle $f$, the learner's class being all rectangles). The learner returns the tightest box around the tasty points of a sample of size $m$. The right panel plays 500 independent rounds and histograms the true error of the output; rounds with error above $\varepsilon$ are red. Press the button to set $m=m_{\mathcal H}(\varepsilon,\delta)$: whatever you do to $\mathcal D$ and $f$, the red fraction stays below $\delta$. Then drag $m$ far below that value and watch the guarantee fail, especially for a thin target in a concentrated $\mathcal D$.`,
      deps: ['ml-2.1', 'ml-2.1e'],
      refs: ['UML §3.1'],
      credit: 'Leslie G. Valiant, "A theory of the learnable", Communications of the ACM 27(11), 1984',
      tags: ['PAC learning', 'sample complexity'],
      scope: String.raw`Realizable case. The picture uses the tightest-box learner for rectangles in the plane, with the textbook bound $4(1-\varepsilon/4)^m\le\delta$; the empirical fraction is a simulation (500 rounds), so it carries sampling noise of roughly $\pm0.02$ near $\delta=0.1$.`,
      viz(v) {
        const s = square(v, { height: 380, title: 'one round of the game' });
        const sH = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 380, xlabel: 'true error $L_{\\mathcal D,f}(h)$ of the output', ylabel: 'rounds', yticks: [], title: '500 rounds' });
        const eS = v.slider('accuracy $\\varepsilon$', 0.08, 0.4, 0.2, { step: 0.01 });
        const dS = v.slider('confidence $\\delta$', 0.02, 0.5, 0.1, { step: 0.01, log: true });
        const spread = v.slider('spread of $\\mathcal D$', 0.2, 1.2, 0.5, { step: 0.05 });
        const mS = v.slider('sample size $m$', 1, 400, mRect(0.2, 0.1), { int: true });
        v.button('set $m=m_{\\mathcal H}(\\varepsilon,\\delta)$', () => { mS.set(clamp(mRect(eS.value, dS.value), 1, 400)); });
        let seed = 1; v.button('New round', () => { seed++; });
        const tA = s.handle(0.2, 0.3, { color: 'green', label: '$f$', labelPos: 'sw' }), tB = s.handle(0.8, 0.75, { color: 'green' });
        const dc = s.handle(0.5, 0.5, { color: 'orange', label: '$\\mathcal D$', labelPos: 'ne', r: 7 });
        const rounds = memo();
        let info = null;
        v.render(() => {
          dc.visible = spread.value < 1.2;
          const eps = eS.value, delta = dS.value, m = mS.value, d = makeDens(dc.x, dc.y, spread.value), T = RECT(tA.x, tA.y, tB.x, tB.y);
          const errs = rounds([d.key, T.x0, T.y0, T.x1, T.y1, m].map((x) => (typeof x === 'number' ? x.toFixed(3) : x)).join(), () => {
            const out = [];
            for (let i = 0; i < 500; i++) out.push(disagree(tightBox(drawSample(d, rand(hashStr('p' + i)), m, T)), T, d));
            return out;
          });
          paintSquare(v, s, d, null, null, d.key);
          drawShape(s, T, { color: 'green', width: 2.2, fill: 'green', fillAlpha: 0.08 });
          const S = drawSample(d, rand(hashStr('q' + seed + '|' + m)), m, T), h = tightBox(S);
          drawShape(s, h, { color: 'accent', width: 2.4, fill: 'accent', fillAlpha: 0.1 });
          drawSample2(s, S, h, Math.min(m, 400), m > 150 ? 2.6 : 3.8);
          const hi = clamp(Math.max(eps * 1.8, quantile(errs, 0.99) * 1.1), 0.1, 1), B = bins(errs, 0, hi, 40);
          const L = { edges: B.edges, counts: B.counts.map((c, i) => (B.edges[i + 1] <= eps + 1e-9 ? c : 0)) }, Rr = { edges: B.edges, counts: B.counts.map((c, i) => (B.edges[i + 1] > eps + 1e-9 ? c : 0)) };
          const top = Math.max(1, ...B.counts) * 1.15;
          sH.setView([0, hi], [0, top]); sH.hist(L, { color: 'accent', fillAlpha: 0.4 }); sH.hist(Rr, { color: 'red', fillAlpha: 0.55 });
          sH.vline(eps, { color: 'ink', width: 2 }); sH.text('$\\varepsilon$', eps, top, { dx: 6, dy: 14, size: 14 });
          info = { bad: errs.filter((x) => x > eps).length / errs.length, m, mH: mRect(eps, delta), delta, eps, LD: disagree(h, T, d) };
        });
        v.legend([['accent', 'error $\\le\\varepsilon$', { area: true }], ['red', 'failed round: error $>\\varepsilon$', { area: true }], ['green', 'hidden rule $f$']]);
        v.readout(() => info && String.raw`$m_{\mathcal H}(\varepsilon,\delta)=${info.mH}$ for these $(\varepsilon,\delta)$; you play $m=${info.m}$. **Failure rate over 500 rounds: $${pr(info.bad)}$** against $\delta=${info.delta.toFixed(2)}$` + (info.m >= info.mH ? (info.bad <= info.delta ? ' — the PAC guarantee holds, as it must for every $\\mathcal D$ and $f$.' : ' — within sampling noise of the guarantee.') : (info.bad > info.delta ? ' — below $m_{\\mathcal H}$ the guarantee is lost.' : ' — below $m_{\\mathcal H}$ nothing is guaranteed, though this $\\mathcal D,f$ happens to be easy.')) + String.raw` This round: output error $${pr(info.LD)}$.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.2
    {
      num: '3.2',
      kind: 'Corollary',
      name: 'Finite hypothesis classes are PAC learnable',
      statement: String.raw`Every finite hypothesis class $\mathcal H$ is PAC learnable, by ERM, with sample complexity
$$m_{\mathcal H}(\varepsilon,\delta)\;\le\;\Big\lceil\frac{\log(|\mathcal H|/\delta)}{\varepsilon}\Big\rceil.$$`,
      idea: String.raw`This is ml-2.3 read through the definition ml-3.1: the bound there holds for every $\mathcal D$ and every realizable $f$ and depends on $\mathcal H$ only through $\log|\mathcal H|$, so it is a valid $m_{\mathcal H}(\varepsilon,\delta)$. The logarithm is the point: doubling the number of hypotheses costs only $\ln2/\varepsilon$ more examples, and a class of $2^n$ hypotheses (all labellings of $n$ points) costs about $n\ln 2/\varepsilon$, as many examples as there are points to memorize. It is an upper bound: a class that is easy for ERM, such as thresholds, needs far fewer.`,
      caption: String.raw`Right: the bound $\lceil\ln(|\mathcal H|/\delta)/\varepsilon\rceil$ (line) against the sample size that a simulation of the worst ERM output actually needs, for two classes of growing size: thresholds on $N$ equally likely points ($|\mathcal H|=N+1$) and all labellings of $n$ equally likely points ($|\mathcal H|=2^n$). The dots are the $(1-\delta)$-quantile, over 400 simulated runs, of the first sample size from which *every* ERM hypothesis has error $\le\varepsilon$. Left: 30 runs of one class, the error of the worst consistent hypothesis falling with $m$; the green line is the bound. Thresholds stay far below it; memorizing all labellings tracks it to within a factor of about two.`,
      deps: ['ml-3.1', 'ml-2.3'],
      refs: ['UML §3.1'],
      tags: ['finite classes', 'sample complexity', 'PAC learning'],
      scope: String.raw`Realizable case with $\mathcal D$ uniform on the points. The simulation takes the worst hypothesis consistent with the sample, so it covers every ERM rule; the quantile estimate has Monte Carlo error of a few examples.`,
      viz(v) {
        const sC = v.stage({ x: [0, 100], y: [0, 1], axes: 'box', gutter: true, height: 380, xlabel: 'sample size $m$', ylabel: 'error of the worst consistent hypothesis', title: '30 runs of one class' });
        const sB = v.stage({ x: [2, 12000], y: [0, 100], xlog: true, axes: 'box', gutter: true, height: 380, xlabel: 'number of hypotheses $|\\mathcal H|$', ylabel: 'sample size needed', title: 'bound versus simulation' });
        const eS = v.slider('accuracy $\\varepsilon$', 0.05, 0.4, 0.15, { step: 0.01 });
        const dS = v.slider('confidence $\\delta$', 0.01, 0.5, 0.05, { step: 0.01, log: true });
        const famS = v.select('class for the left panel', [{ value: 'thr', label: 'thresholds on $N$ points' }, { value: 'all', label: 'all labellings of $n$ points' }], 'all');
        const hS = v.slider('size $|\\mathcal H|$ (left)', 2, 8192, 256, { log: true, sig: 3 });
        let seed = 1; v.button('New runs', () => { seed++; });
        // One run: calls cb(m, error of the worst consistent hypothesis) after each example, until cb returns true.
        const run = (fam, H, r, cb) => {
          if (fam === 'thr') {
            const N = H - 1, t0 = Math.ceil(N / 2); let a = 0, b = N + 1;
            if (cb(0, Math.max(t0 - 1, N + 1 - t0) / N)) return;
            for (let m = 1; m < 6000; m++) { const x = 1 + Math.floor(r() * N); if (x >= t0) b = Math.min(b, x); else a = Math.max(a, x); if (cb(m, Math.max(t0 - (a + 1), b - t0) / N)) return; }
          } else {
            const n = Math.round(Math.log2(H)), seen = new Uint8Array(n); let un = n;
            if (cb(0, 1)) return;
            for (let m = 1; m < 6000; m++) { const i = Math.floor(r() * n); if (!seen[i]) { seen[i] = 1; un--; } if (cb(m, un / n)) return; }
          }
        };
        const first = (fam, H, eps, delta, reps) => { const T = []; for (let k = 0; k < reps; k++) { const r = rand(hashStr(fam + H + 'f' + k)); let at = 6000; run(fam, H, r, (m, e) => { if (e <= eps) { at = m; return true; } return false; }); T.push(at); } return quantile(T, 1 - delta); };
        const curves = memo(), runs = memo();
        let info = null;
        v.render(() => {
          const eps = eS.value, delta = dS.value, fam = famS.value;
          const Hsel = fam === 'all' ? 2 ** clamp(Math.round(Math.log2(hS.value)), 1, 13) : Math.round(hS.value) + 1;
          const bound = (H) => Math.ceil(Math.log(H / delta) / eps);
          const C = curves([eps, delta].join(), () => {
            const thr = [], all = [];
            for (let i = 0; i <= 20; i++) { const H = Math.max(2, Math.round(2 ** (Math.log2(12000) * i / 20) + 1)); if (H <= 10001) thr.push([H, first('thr', H, eps, delta, 400)]); }
            for (let n = 1; n <= 13; n++) all.push([2 ** n, first('all', 2 ** n, eps, delta, 400)]);
            return { thr, all };
          });
          const ymax = bound(12000) * 1.12;
          sB.setView([2, 12000], [0, ymax]);
          sB.fn((x) => Math.log(x / delta) / eps, { color: 'orange', width: 2.6, domain: [2, 12000] });
          sB.path(C.thr, { color: 'accent', width: 1.6 }); sB.dots(C.thr, { r: 4, color: 'accent' });
          sB.path(C.all, { color: 'purple', width: 1.6 }); sB.dots(C.all, { r: 4, color: 'purple' });
          sB.vline(Hsel, { color: 'gold', dash: true, width: 1.4 });
          const bd = bound(Hsel), mmax = Math.max(30, Math.ceil(bd * 1.25));
          const R = runs([fam, Hsel, mmax, seed].join(), () => {
            const out = [];
            for (let k = 0; k < 30; k++) { const pts = []; run(fam, Hsel, rand(hashStr('t' + seed + k)), (m, e) => { pts.push([m, e]); return m >= mmax; }); out.push(pts); }
            return out;
          });
          sC.setView([0, mmax], [0, 1]);
          for (const pts of R) sC.path(pts, { color: 'accent', width: 1.2, alpha: 0.55 });
          sC.hline(eps, { color: 'ink', width: 1.6, dash: true }); sC.text('$\\varepsilon$', mmax, eps, { align: 'right', dy: -10, size: 13 });
          sC.vline(bd, { color: 'green', width: 2.4 }); sC.text('bound', bd, 0.95, { dx: 6, size: 12.5, color: 'green' });
          const sim = first(fam, Hsel, eps, delta, 400);
          info = { H: Hsel, bd, sim, fam, nfail: R.filter((p) => p.find((q) => q[0] === Math.min(bd, mmax)) && p.find((q) => q[0] === Math.min(bd, mmax))[1] > eps).length };
        });
        v.legend([['orange', '$\\ln(|\\mathcal H|/\\delta)/\\varepsilon$'], ['accent', 'thresholds: simulated'], ['purple', 'all labellings: simulated'], ['gold', 'chosen $|\\mathcal H|$', { dash: true }]]);
        v.readout(() => info && String.raw`$|\mathcal H|=${commas(info.H)}$: the corollary guarantees $m=\lceil\ln(|\mathcal H|/\delta)/\varepsilon\rceil=${info.bd}$ examples; simulation says $${info.sim}$ already give confidence $1-\delta$ (${info.sim <= info.bd ? 'below the bound, as it must' : 'above the bound: Monte Carlo noise'}). Of the 30 runs on the left, $${info.nfail}$ still have a consistent hypothesis with error $>\varepsilon$ at $m=${info.bd}$.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.2a
    {
      num: '3.2a',
      kind: 'Definition',
      name: 'Distributions over X × Y; true and empirical risk',
      statement: String.raw`Drop the labelling function: let $\mathcal D$ be a probability distribution over $\mathcal X\times\mathcal Y$. It can be split into a marginal $\mathcal D_x$ over instances and the conditional law $\mathbb P[y\mid x]$ of the label, so two instances that look identical may carry different labels. The **true risk** of a predictor $h:\mathcal X\to\mathcal Y$ is the probability that it errs on a fresh example,
$$L_{\mathcal D}(h)=\mathbb P_{(x,y)\sim\mathcal D}[h(x)\neq y]=\mathcal D(\{(x,y):h(x)\neq y\}),$$
and the **empirical risk** on a sample $S=((x_1,y_1),\dots,(x_m,y_m))\sim\mathcal D^m$ is $L_S(h)=|\{i:h(x_i)\neq y_i\}|/m$. When $y=f(x)$ for a function $f$ this is the true error of ml-2.1a.`,
      idea: String.raw`The realizable model is the special case in which $\mathbb P[y=1\mid x]\in\{0,1\}$. Allowing intermediate values makes the label itself random, which models noisy measurement, missing features or genuine randomness (two fruits with the same colour and softness that taste differently). The risk is still an expectation of the $0$–$1$ error, so $L_S(h)$ is an unbiased average of i.i.d. indicator variables with mean $L_{\mathcal D}(h)$; the definitions of ml-2.1b carry over verbatim, and what changes is that $\inf_hL_{\mathcal D}(h)$ may be strictly positive.`,
      caption: String.raw`The background is the probability $\eta(x)=\mathbb P[y=1\mid x]$ that a papaya is tasty (green: near 1, pink: near 0, faint: undecided). Choose how the noise enters: flipped labels, or a soft boundary whose width grows with the noise. Drag the blue corners to place a rule $h$, and the grey probe to read $\eta$ at a point. The right panel scores $h$ on 300 samples of size $m$: the empirical risks scatter around the true risk (green), and the true risk of *any* rule stays above the floor of the best possible rule (ink; ml-3.2b), although a lucky sample can show an empirical risk below it. Raise the noise: even the perfect rectangle makes mistakes.`,
      deps: ['ml-2.1a'],
      refs: ['UML §3.2.1'],
      tags: ['noisy labels', 'true risk', 'empirical risk'],
      scope: String.raw`Illustrative world: $\mathcal D_x$ a product of truncated normals on the unit square and $\eta$ one of the two noise models above; risks are computed exactly on a $60\times60$ grid (cells counted by their centres).`,
      verify: true,
      viz(v) {
        const s = square(v, { height: 400, title: 'papayas with random labels' });
        const sH = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 400, xlabel: 'empirical risk $L_S(h)$', ylabel: 'samples', yticks: [], title: 'the sample sees an estimate' });
        const modeS = v.select('noise model', [{ value: 'flip', label: 'flipped labels' }, { value: 'soft', label: 'soft boundary' }], 'flip');
        const nuS = v.slider('noise level $\\nu$', 0, 0.45, 0.15, { step: 0.01 });
        const mS = v.slider('sample size $m$', 1, 200, 40, { int: true });
        const hA = s.handle(0.25, 0.32, { color: 'accent', label: '$h$', labelPos: 'sw' }), hB = s.handle(0.75, 0.72, { color: 'accent' });
        const pr0 = s.handle(0.9, 0.9, { color: 'muted', r: 5 });
        const d = makeDens(0.5, 0.5, 0.55), tab = memo(), base = memo(), strip = memo();
        let info = null;
        v.render(() => {
          const nu = nuS.value, mode = modeS.value, m = mS.value, eta = makeEta(HID, mode, nu), key = mode + nu.toFixed(3);
          const T = tab(key, () => riskTable(d, eta)), h = RECT(hA.x, hA.y, hB.x, hB.y);
          etaRaster(v, s, eta, key);
          drawShape(s, h, { color: 'accent', fill: 'accent', fillAlpha: 0.08 });
          const S = base(key, () => drawNoisy(d, rand(31), 200, eta));
          drawSample2(s, S, h, m);
          const LD = T.risk(h), pe = eta(pr0.x, pr0.y);
          s.text(`$\\eta=${pe.toFixed(2)}$`, pr0.x, pr0.y, { dx: -10, dy: 20, align: 'right', size: 12.5, plate: true });
          const vals = strip([key, h.x0, h.y0, h.x1, h.y1, m].map((x) => (typeof x === 'number' ? x.toFixed(3) : x)).join(), () => {
            const r = rand(77), out = [];
            for (let k = 0; k < 300; k++) { let e = 0; for (let i = 0; i < m; i++) { const p = d.draw(r), lab = r() < eta(p[0], p[1]) ? 1 : 0; if ((inShape(h, p[0], p[1]) ? 1 : 0) !== lab) e++; } out.push(e / m); }
            return out;
          });
          const sd = Math.sqrt(LD * (1 - LD) / m), hi = clamp(Math.max(LD + 4.5 * sd, 0.12), 0.12, 1), B = bins(vals, 0, hi, 30), top = Math.max(1, ...B.counts) * 1.15;
          sH.setView([0, hi], [0, top]); sH.hist(B, { color: 'accent', fillAlpha: 0.35 });
          sH.vline(LD, { color: 'green', width: 2.6 }); sH.text('$L_{\\mathcal D}(h)$', LD, top, { color: 'green', dx: 6, dy: 16, size: 13 });
          sH.vline(T.bayes, { color: 'ink', width: 1.8, dash: true }); sH.text('floor', T.bayes, top * 0.85, { dx: -6, align: 'right', size: 12.5 });
          let ls = 0; for (let i = 0; i < m; i++) if ((inShape(h, S.X[i], S.Y[i]) ? 1 : 0) !== S.L[i]) ls++;
          info = { LD, LS: ls / m, m, mu: mean(vals), bayes: T.bayes, pe };
        });
        v.legend([['green', 'tasty', { dot: true }], ['pink', 'not tasty', { dot: true }], ['red', 'mistake of $h$', { dot: true }], ['ink', 'best possible risk', { dash: true }]]);
        v.readout(() => info && String.raw`$L_{\mathcal D}(h)=${pr(info.LD)}$; on this sample of $m=${info.m}$, $L_S(h)=${pr(info.LS)}$; mean over 300 samples $${pr(info.mu)}$. No predictor at all can have risk below $${pr(info.bayes)}$ (the expected value of $\min(\eta,1-\eta)$), so with noisy labels zero error is out of reach. At the probe $\eta=${pr(info.pe, 2)}$.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.2b
    {
      num: '3.2b',
      kind: 'Proposition',
      name: 'The Bayes optimal predictor',
      statement: String.raw`Let $\mathcal D$ be a distribution over $\mathcal X\times\{0,1\}$ and put $\eta(x)=\mathbb P[y=1\mid x]$. Among all functions $h:\mathcal X\to\{0,1\}$ (measurable), the **Bayes predictor**
$$f_{\mathcal D}(x)=\begin{cases}1&\text{if }\eta(x)\ge\tfrac12,\\0&\text{otherwise,}\end{cases}$$
minimizes the true risk $L_{\mathcal D}$: $L_{\mathcal D}(f_{\mathcal D})\le L_{\mathcal D}(g)$ for every $g$. Its risk is $\mathbb E[\min(\eta(x),1-\eta(x))]$, and for any $g$ the excess is $L_{\mathcal D}(g)-L_{\mathcal D}(f_{\mathcal D})=\mathbb E\big[|2\eta(x)-1|\,\mathbf 1[g(x)\ne f_{\mathcal D}(x)]\big]$.`,
      idea: String.raw`Condition on the instance. Given $x$, predicting $1$ is wrong with probability $1-\eta(x)$ and predicting $0$ is wrong with probability $\eta(x)$, and the choice made at one point does not influence the error at another. So the risk $\int(\text{conditional error at }x)\,d\mathcal D_x$ is minimized by choosing at every $x$ the smaller conditional error, and choosing the other label at $x$ costs exactly $|2\eta(x)-1|$ extra. No learner can beat $f_{\mathcal D}$, which depends on the unknown $\mathcal D$; it is the target the learner of ml-3.3 approximates within its class.`,
      caption: String.raw`Top: drag the seven blue handles to shape $\eta(x)=\mathbb P[y=1\mid x]$ ($x$ uniform on $[0,1]$). The coloured strip under the curve is the Bayes rule (green: predict 1, where $\eta\ge\frac12$); the lower strip is your rule, built by **clicking** the 60 cells of the axis to flip its prediction there. Bottom: the pointwise error of your rule (red) against the Bayes rule's $\min(\eta,1-\eta)$ (ink). The red area between them is the excess risk, and it is non-negative whatever you click; it is exactly the integral of $|2\eta-1|$ over the cells where you disagree with Bayes.`,
      deps: ['ml-3.2a'],
      see: ['stat-11.2'],
      refs: ['UML §3.2.1'],
      tags: ['Bayes optimal', 'regression function'],
      scope: String.raw`Binary labels and the $0$–$1$ loss; your rule is piecewise constant on 60 cells, while the Bayes rule is drawn pointwise, so a threshold crossing inside a cell leaves a sliver of excess.`,
      verify: true,
      viz(v) {
        const sA = v.stage({ x: [0, 1], y: [0, 1.05], axes: 'box', gutter: true, height: 300, xlabel: 'instance $x$', ylabel: '$\\eta(x)=\\mathbb P[y=1\\mid x]$', title: 'the conditional law and the two rules' });
        const sB = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 300, xlabel: 'instance $x$', ylabel: 'conditional error', title: 'pointwise error of your rule' });
        const K = 7, NC = 60, pred = new Uint8Array(NC);
        const init = [0.28, 0.2, 0.55, 0.8, 0.6, 0.3, 0.9];
        const H = init.map((y, i) => sA.handle(i / (K - 1), y, { color: 'accent', constrain: 'y', r: 6 }));
        const eta = (x) => { const t = clamp(x, 0, 1) * (K - 1), i = Math.min(K - 2, Math.floor(t)), f = t - i; return clamp(H[i].y * (1 - f) + H[i + 1].y * f, 0, 1); };
        const setBayes = () => { for (let c = 0; c < NC; c++) pred[c] = eta((c + 0.5) / NC) >= 0.5 ? 1 : 0; };
        setBayes(); pred[3] ^= 1; pred[44] ^= 1; pred[45] ^= 1;
        v.button('my rule := Bayes rule', () => { setBayes(); });
        v.button('random rule', () => { const r = rand(Math.floor(Math.random() * 1e9)); for (let c = 0; c < NC; c++) pred[c] = r() < 0.5 ? 1 : 0; });
        v.button('flip my rule', () => { for (let c = 0; c < NC; c++) pred[c] ^= 1; });
        sA.onClick((x, y) => { const c = clamp(Math.floor(x * NC), 0, NC - 1); pred[c] ^= 1; v.invalidate(); });
        let info = null;
        v.render(() => {
          sA.hline(0.5, { color: 'muted', dash: true, width: 1.2 });
          const NG = 480, pts = [], eh = [], eb = [], gr = [];
          let L = 0, Lb = 0, ex = 0;
          for (let i = 0; i < NG; i++) {
            const x = (i + 0.5) / NG, e = eta(x), p = pred[Math.floor(x * NC)], bay = e >= 0.5 ? 1 : 0, ce = p ? 1 - e : e, cb = Math.min(e, 1 - e);
            L += ce / NG; Lb += cb / NG; if (p !== bay) ex += Math.abs(2 * e - 1) / NG;
            eh.push([x, ce]); eb.push([x, cb]);
          }
          for (let c = 0; c < NC; c++) {
            const x0 = c / NC, x1 = (c + 1) / NC, bay = eta((c + 0.5) / NC) >= 0.5;
            sA.rect(x0, 0.085, x1, 0.125, { fill: pred[c] ? 'green' : 'pink', fillAlpha: 0.85, stroke: false });
            sA.rect(x0, 0.03, x1, 0.07, { fill: bay ? 'green' : 'pink', fillAlpha: 0.85, stroke: false });
            if ((pred[c] === 1) !== bay) sA.rect(x0, 0.085, x1, 0.125, { color: 'red', fill: false, width: 1.4 });
          }
          sA.text('Bayes', 0, 0.05, { dx: 4, size: 11, color: 'ink', baseline: 'middle' }); sA.text('yours', 0, 0.105, { dx: 4, size: 11, color: 'ink', baseline: 'middle' });
          sA.fn(eta, { color: 'accent', width: 3, domain: [0, 1] });
          sB.between((x) => Math.min(eta(x), 1 - eta(x)), (x) => { const e = eta(x), p = pred[Math.min(NC - 1, Math.floor(x * NC))]; return p ? 1 - e : e; }, 0, 1, { fill: 'red', fillAlpha: 0.4, n: 480 });
          sB.path(eh, { color: 'red', width: 1.6 }); sB.path(eb, { color: 'ink', width: 2.2 });
          info = { L, Lb, ex };
        });
        v.legend([['accent', '$\\eta$'], ['ink', 'Bayes error $\\min(\\eta,1-\\eta)$'], ['red', 'your rule: excess', { area: true }]]);
        v.readout(() => info && String.raw`$L_{\mathcal D}(\text{Bayes})=\mathbb E\min(\eta,1-\eta)=${pr(info.Lb)}$; your rule $L_{\mathcal D}=${pr(info.L)}$; excess $${pr(info.L - info.Lb, 4)}$ $\;=\;\int|2\eta-1|\mathbf 1[\text{disagree}]=${pr(info.ex, 4)}$ (the two computations agree, and the excess is never negative).`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.3
    {
      num: '3.3',
      kind: 'Definition',
      name: 'Agnostic PAC learnability',
      statement: String.raw`A hypothesis class $\mathcal H$ is **agnostic PAC learnable** if there are a function $m_{\mathcal H}:(0,1)^2\to\mathbb N$ and an algorithm $A$ such that for every $\varepsilon,\delta\in(0,1)$ and **every** distribution $\mathcal D$ over $\mathcal X\times\mathcal Y$, running $A$ on $m\ge m_{\mathcal H}(\varepsilon,\delta)$ i.i.d. examples from $\mathcal D$ returns $h$ that with probability at least $1-\delta$ satisfies
$$L_{\mathcal D}(h)\;\le\;\min_{h'\in\mathcal H}L_{\mathcal D}(h')+\varepsilon.$$
No realizability is assumed: the learner is only asked to be nearly as good as the best member of the class, however good or bad that is. If $\mathcal D$ is realizable by $\mathcal H$, the minimum is $0$ and the definition reduces to ml-3.1.`,
      idea: String.raw`When labels are noisy or the truth lies outside $\mathcal H$, no learner can promise a small absolute error; the achievable promise is a **relative** one, an excess risk over the benchmark $\min_{\mathcal H}L_{\mathcal D}$. ERM is the natural candidate: if empirical risks of all hypotheses in the class are close to their true risks, the empirical minimizer is within twice that distance of the true minimizer (ml-4.2). The excess risk is always non-negative for an output in $\mathcal H$, so the whole histogram below sits to the right of zero.`,
      caption: String.raw`The class is all rectangles whose sides lie on a $6\times6$ grid (442 hypotheses, with the empty rule), learned by exact ERM. Choose where the truth lives: a rectangle of the class, a disc or an L-shape (outside the class), and how noisy the labels are. The left square shows one sample, the ERM output (blue) and the best rectangle of the class (green, computed from the exact risks). The right panel plays 400 rounds and histograms the **excess risk** $L_{\mathcal D}(h_S)-\min_{\mathcal H}L_{\mathcal D}$; rounds above $\varepsilon$ are red, and the readout compares their fraction with $\delta$. Even when no rectangle is good (the L-shape), the excess is small: that is what agnostic learning promises.`,
      deps: ['ml-3.1', 'ml-3.2a'],
      refs: ['UML §3.2.1'],
      credit: 'David Haussler, "Decision theoretic generalizations of the PAC model for neural net and other learning applications", Information and Computation 100(1), 1992 (generalizing Valiant, 1984)',
      tags: ['agnostic PAC', 'excess risk'],
      scope: String.raw`Finite grid class and the $0$–$1$ loss. The sample size at which the uniform-convergence bound $2\ln(2|\mathcal H|/\delta)/\varepsilon^2$ guarantees the property (derived from Hoeffding's inequality and the union bound; see ml-4.6) is printed for comparison; the simulation needs far fewer examples. The 400-round fraction carries sampling noise.`,
      verify: true,
      viz(v) {
        const K = 6;
        const s = square(v, { height: 380, title: 'one sample and its ERM output' });
        const sH = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 380, xlabel: 'excess risk $L_{\\mathcal D}(h_S)-\\min_{\\mathcal H}L_{\\mathcal D}$', ylabel: 'rounds', yticks: [], title: '400 rounds' });
        const truthS = v.select('truth', [{ value: 'rect', label: 'a rectangle of the class' }, { value: 'disc', label: 'a disc' }, { value: 'L', label: 'an L-shape' }], 'disc');
        const nuS = v.slider('label noise $\\nu$', 0, 0.4, 0.1, { step: 0.01 });
        const eS = v.slider('accuracy $\\varepsilon$', 0.01, 0.2, 0.05, { step: 0.005 });
        const dS = v.slider('confidence $\\delta$', 0.02, 0.5, 0.1, { step: 0.01, log: true });
        const mS = v.slider('sample size $m$', 10, 1500, 150, { int: true, log: true });
        let seed = 1; v.button('New sample', () => { seed++; });
        const d = makeDens(0.5, 0.5, 0.6), world = memo(), rounds = memo();
        const TG = { rect: RECT(1 / 6, 2 / 6, 5 / 6, 4 / 6), disc: target('disc'), L: target('L') };
        let info = null;
        v.render(() => {
          const nu = nuS.value, eps = eS.value, delta = dS.value, m = mS.value, tk = truthS.value, key = tk + nu.toFixed(3);
          const W = world(key, () => { const eta = makeEta(TG[tk], 'flip', nu), T = riskTable(d, eta); return { eta, T, best: bestGridRect(T, K) }; });
          const ex = rounds(key + '|' + m, () => { const out = []; for (let i = 0; i < 400; i++) { const S = drawNoisy(d, rand(hashStr('a' + i)), m, W.eta); out.push(W.T.risk(gridErm(gridCounts(S, K)).h) - W.best.risk); } return out; });
          etaRaster(v, s, W.eta, key);
          const S = drawNoisy(d, rand(hashStr('s' + seed + '|' + m)), m, W.eta), h = gridErm(gridCounts(S, K)).h;
          drawShape(s, W.best.h, { color: 'green', width: 2.4, dash: true });
          drawShape(s, h, { color: 'accent', width: 2.6, fill: 'accent', fillAlpha: 0.1 });
          drawSample2(s, S, null, Math.min(m, 400), m > 150 ? 2.6 : 3.8);
          const hi = clamp(Math.max(eps * 1.8, quantile(ex, 0.99) * 1.1), 0.05, 1), B = bins(ex, 0, hi, 40);
          const L = { edges: B.edges, counts: B.counts.map((c, i) => (B.edges[i + 1] <= eps + 1e-9 ? c : 0)) }, Rr = { edges: B.edges, counts: B.counts.map((c, i) => (B.edges[i + 1] > eps + 1e-9 ? c : 0)) };
          const top = Math.max(1, ...B.counts) * 1.15;
          sH.setView([0, hi], [0, top]); sH.hist(L, { color: 'accent', fillAlpha: 0.4 }); sH.hist(Rr, { color: 'red', fillAlpha: 0.55 });
          sH.vline(eps, { color: 'ink', width: 2 }); sH.text('$\\varepsilon$', eps, top, { dx: 6, dy: 14, size: 14 });
          info = { bad: ex.filter((x) => x > eps).length / ex.length, delta, eps, bench: W.best.risk, bayes: W.T.bayes, mean: mean(ex), mUC: Math.ceil((2 * Math.log((2 * 442) / delta)) / (eps * eps)), m, L: W.T.risk(h) };
        });
        v.legend([['accent', 'ERM output $h_S$'], ['green', 'best rectangle of the class', { dash: true }], ['red', 'excess $>\\varepsilon$', { area: true }]]);
        v.readout(() => info && String.raw`Benchmark $\min_{\mathcal H}L_{\mathcal D}=${pr(info.bench)}$ (Bayes risk $${pr(info.bayes)}$ — the class cannot reach it unless the truth is a rectangle); this sample's $h_S$ has risk $${pr(info.L)}$. Mean excess $${pr(info.mean, 4)}$; **fraction of rounds with excess $>\varepsilon=${info.eps.toFixed(3)}$: $${pr(info.bad)}$** against $\delta=${info.delta.toFixed(2)}$ at $m=${info.m}$. The uniform-convergence guarantee would need $m\ge${commas(info.mUC).replace(/,/g, '{,}')}$.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.3a
    {
      num: '3.3a',
      kind: 'Definition',
      name: 'Loss functions: 0–1 and squared loss',
      statement: String.raw`A **loss function** $\ell(h,(x,y))\ge0$ scores a predictor on one example, and the risk is its expectation, $L_{\mathcal D}(h)=\mathbb E_{(x,y)\sim\mathcal D}\,\ell(h,(x,y))$, with empirical counterpart $L_S(h)=\frac1m\sum_{i=1}^m\ell(h,(x_i,y_i))$. Two standard choices:
(a) the **$0$–$1$ loss** $\ell_{0\text{-}1}(h,(x,y))=\mathbf 1[h(x)\ne y]$ for classification, whose risk is the probability of error;
(b) the **squared loss** $\ell_{\mathrm{sq}}(h,(x,y))=(h(x)-y)^2$ for regression with $\mathcal Y\subseteq\mathbb R$, whose risk is the mean squared error.`,
      idea: String.raw`Both losses are functions of the pair (prediction, truth). The $0$–$1$ loss is flat except for a jump at the truth: it only asks whether the answer is exactly right, and it is the loss of ml-3.2a. For a real-valued target an answer that is almost right should be almost as good as one that is exactly right, which is what the squared loss encodes (and why it is differentiable, a convenience used from chapter 9 on). Moving from one to the other changes nothing in the definition of risk, only the integrand.`,
      caption: String.raw`Left: for a true value $y$ (drag the orange handle) the loss of a prediction $\hat y$ (drag the blue handle): the $0$–$1$ loss is the step (zero only at $\hat y=y$), the squared loss the parabola. Right: an empirical risk. In *regression* the loss of each point is the squared length of its vertical gap to your line (drag the two handles; "fit" jumps to the least-squares line, the minimizer of $L_S$). In *classification* the line is thresholded at $\frac12$ and the loss is the number of ringed mistakes divided by $m$. Resample to see the risk fluctuate.`,
      deps: ['ml-3.2a'],
      see: ['stat-11.1'],
      refs: ['UML §3.2.2'],
      tags: ['loss functions', 'squared loss', '0-1 loss'],
      verify: true,
      viz(v) {
        const sL = v.stage({ x: [-0.4, 1.4], y: [0, 1.3], axes: 'box', gutter: true, height: 330, xlabel: 'prediction $\\hat y$', ylabel: 'loss $\\ell(\\hat y,y)$', title: 'two losses for one truth $y$' });
        const sD = v.stage({ x: [0, 1], y: [-0.25, 1.25], axes: 'box', gutter: true, height: 330, xlabel: 'instance $x$', ylabel: 'label $y$', title: 'empirical risk of a line' });
        const taskS = v.select('task', [{ value: 'reg', label: 'regression (squared loss)' }, { value: 'cls', label: 'classification ($0$–$1$ loss)' }], 'reg');
        let seed = 1; v.button('New sample', () => { seed++; });
        const yH = sL.handle(0.6, 0, { color: 'orange', constrain: 'x', label: '$y$', labelPos: 'n' }), pH = sL.handle(0.2, 0, { color: 'accent', constrain: 'x', label: '$\\hat y$', labelPos: 'n' });
        const a = sD.handle(0, 0.25, { color: 'accent', constrain: 'y' }), b = sD.handle(1, 0.8, { color: 'accent', constrain: 'y' });
        const M = 14, sample = memo();
        v.button('fit: least squares', () => {
          if (!cur) return;
          const { xs, ys } = cur, mx = mean(xs), my = mean(ys); let sxy = 0, sxx = 0;
          for (let i = 0; i < M; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; }
          const w = sxy / sxx, c = my - w * mx; a.set(0, c); b.set(1, c + w);
        });
        let cur = null, info = null;
        v.render(() => {
          const task = taskS.value, y = yH.x, p = pH.x;
          // left: the two losses
          sL.fn((q) => (q - y) ** 2, { color: 'accent', width: 2.6, domain: [-0.4, 1.4] });
          sL.line(-0.4, 1, y - 1e-4, 1, { color: 'orange', width: 2.6 }); sL.line(y + 1e-4, 1, 1.4, 1, { color: 'orange', width: 2.6 });
          sL.dot(y, 0, { r: 5.5, color: 'orange' }); sL.dot(y, 1, { r: 5.5, hollow: true, color: 'orange' });
          sL.vline(p, { color: 'muted', dash: true, width: 1.2 });
          sL.dot(p, (p - y) ** 2, { r: 5, color: 'accent' }); sL.dot(p, Math.abs(p - y) < 1e-9 ? 0 : 1, { r: 5, color: 'orange' });
          sL.text('$0$–$1$', 1.38, 1, { align: 'right', dy: -10, color: 'orange', size: 13 }); sL.text('squared', 1.15, (1.15 - y) ** 2, { align: 'right', dx: -8, dy: -6, color: 'accent', size: 13 });
          // right: data
          cur = sample([task, seed].join(), () => {
            const r = rand(hashStr('l' + seed)), xs = [], ys = [];
            for (let i = 0; i < M; i++) { const x = r(); xs.push(x); ys.push(task === 'reg' ? 0.15 + 0.7 * x + r.normal(0, 0.12) : (x + r.normal(0, 0.18) > 0.5 ? 1 : 0)); }
            return { xs, ys };
          });
          const { xs, ys } = cur, line = (x) => a.y + (b.y - a.y) * x;
          sD.line(0, a.y, 1, b.y, { color: 'accent', width: 2.6 });
          let L = 0;
          if (task === 'reg') {
            for (let i = 0; i < M; i++) { sD.line(xs[i], ys[i], xs[i], line(xs[i]), { color: 'red', width: 2 }); L += (line(xs[i]) - ys[i]) ** 2; }
            sD.dots(xs.map((x, i) => [x, ys[i]]), { r: 4.6, color: 'ink' });
          } else {
            sD.hline(0.5, { color: 'muted', dash: true, width: 1 });
            for (let i = 0; i < M; i++) { const pr1 = line(xs[i]) >= 0.5 ? 1 : 0, bad = pr1 !== ys[i]; if (bad) { L++; sD.dot(xs[i], ys[i], { r: 10, hollow: true, color: 'red' }); } }
            sD.dots(xs.map((x, i) => [x, ys[i]]), { r: 4.6, color: 'ink' });
          }
          info = { task, L: L / M, y, p, sq: (p - y) ** 2, z: Math.abs(p - y) < 1e-9 ? 0 : 1 };
        });
        v.legend([['accent', 'squared loss'], ['orange', '$0$–$1$ loss'], ['red', 'vertical gap / mistake']]);
        v.readout(() => info && String.raw`At $\hat y=${v.fix(info.p, 2)}$, $y=${v.fix(info.y, 2)}$: squared loss $${pr(info.sq)}$, $0$–$1$ loss $${info.z}$. ` + (info.task === 'reg' ? String.raw`Empirical risk of your line: $L_S(h)=\frac1m\sum(h(x_i)-y_i)^2=${pr(info.L, 4)}$.` : String.raw`Empirical risk of the thresholded line: $L_S(h)=${pr(info.L)}$ (fraction of ringed points).`));
      },
    },
    // ───────────────────────────────────────────────────────────── 3.4
    {
      num: '3.4',
      kind: 'Definition',
      name: 'Agnostic PAC learnability for general loss functions',
      statement: String.raw`Let $\mathcal H$ be a hypothesis class, $Z$ an arbitrary domain of examples (for supervised learning $Z=\mathcal X\times\mathcal Y$; for unsupervised tasks just instances), and $\ell:\mathcal H\times Z\to\mathbb R_+$ a loss function. The risk is $L_{\mathcal D}(h)=\mathbb E_{z\sim\mathcal D}\,\ell(h,z)$ for a distribution $\mathcal D$ over $Z$. The class $\mathcal H$ is **agnostic PAC learnable with respect to $(Z,\ell)$** if there are $m_{\mathcal H}:(0,1)^2\to\mathbb N$ and an algorithm $A$ such that for all $\varepsilon,\delta\in(0,1)$ and every distribution $\mathcal D$ over $Z$, a sample of $m\ge m_{\mathcal H}(\varepsilon,\delta)$ i.i.d. examples makes $A$ return $h$ with
$$\mathbb P\Big[L_{\mathcal D}(h)\le\min_{h'\in\mathcal H}L_{\mathcal D}(h')+\varepsilon\Big]\ge1-\delta.$$`,
      idea: String.raw`Nothing in ml-3.3 used that the loss is $0$–$1$ or that examples are labelled: the definition quantifies a risk, a benchmark and an excess. Replacing $\ell$ gives regression with the squared loss (ml-3.3a), and taking $Z=\mathcal X$ with $\ell(h,x)$ the squared distance from $x$ to the nearest of $k$ centres gives a clustering objective, the $k$-means cost. Whether such classes are learnable now depends on the loss: for finite classes and bounded losses it follows from Hoeffding's inequality (chapter 4), and the three experiments below only illustrate it. With an unbounded loss, as for squared loss on unbounded $\mathcal H$, learnability can fail, which is why the picture bounds the hypotheses.`,
      caption: String.raw`The same $(\varepsilon,\delta)$ game as before, now with three different risks; switch the task and only the risk (and the picture) changes. **$0$–$1$ loss:** thresholds on a grid, labels flipped with probability $\nu$. **Squared loss:** lines $x\mapsto wx$ with $|w|\le1$ fitted by least squares, targets $y=\mathrm{clip}(0.15+0.7x+\text{noise})$ so the truth is not in the class. **$k$-means loss:** two centres on a grid, $x$ from a two-bump mixture, loss = squared distance to the nearer centre. Left: one sample, ERM output (blue) and the best hypothesis of the class (green). Right: 400 rounds of the excess risk; rounds above $\varepsilon$ are red.`,
      deps: ['ml-3.3', 'ml-3.3a'],
      refs: ['UML §3.2.2'],
      tags: ['general loss', 'agnostic PAC', 'regression', 'k-means'],
      scope: String.raw`Three small concrete classes with bounded losses; this is an experiment, not a proof of learnability. Risks are computed exactly (thresholds) or by numerical integration (squared and $k$-means losses).`,
      verify: true,
      viz(v) {
        const s = v.stage({ x: [0, 1], y: [-0.1, 1.1], axes: 'box', gutter: true, height: 360, xlabel: 'instance $x$', title: 'one sample' });
        const sH = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 360, xlabel: 'excess risk $L_{\\mathcal D}(h_S)-\\min_{\\mathcal H}L_{\\mathcal D}$', ylabel: 'rounds', yticks: [], title: '400 rounds' });
        const taskS = v.select('loss', [{ value: 'zo', label: '$0$–$1$ (thresholds)' }, { value: 'sq', label: 'squared (lines)' }, { value: 'km', label: '$k$-means (2 centres)' }], 'sq');
        const eS = v.slider('accuracy $\\varepsilon$', 0.002, 0.2, 0.02, { step: 0.001, log: true });
        const dS = v.slider('confidence $\\delta$', 0.02, 0.5, 0.1, { step: 0.01, log: true });
        const mS = v.slider('sample size $m$', 5, 400, 60, { int: true, log: true });
        let seed = 1; v.button('New sample', () => { seed++; });
        const NU = 0.15, TH = 0.43, GK = 20, Q = 61;
        const zq = Array.from({ length: Q }, (_, i) => -5 + (10 * i) / (Q - 1)), zw = zq.map((z) => Math.exp(-0.5 * z * z)), zs = zw.reduce((p, q) => p + q, 0);
        const clipMom = (mu, sg) => { let e1 = 0, e2 = 0; zq.forEach((z, i) => { const y = clamp(mu + sg * z, 0, 1); e1 += y * zw[i] / zs; e2 += y * y * zw[i] / zs; }); return [e1, e2]; };
        const mom = (() => { let mxx = 0, mxy = 0, myy = 0; const n = 200; for (let i = 0; i < n; i++) { const x = (i + 0.5) / n, [e1, e2] = clipMom(0.15 + 0.7 * x, 0.2); mxx += x * x / n; mxy += x * e1 / n; myy += e2 / n; } return { mxx, mxy, myy }; })();
        const sqRisk = (w) => mom.mxx * w * w - 2 * mom.mxy * w + mom.myy, wOpt = clamp(mom.mxy / mom.mxx, -1, 1);
        const gauss = (x, m, sg) => Math.exp(-0.5 * ((x - m) / sg) ** 2) / sg;
        const dens = (() => { const n = 400, f = []; let tot = 0; for (let i = 0; i < n; i++) { const x = (i + 0.5) / n, q = 0.5 * gauss(x, 0.25, 0.08) + 0.5 * gauss(x, 0.7, 0.1); f.push(q); tot += q; } return f.map((q) => q / tot); })();
        const pairs = []; for (let i = 0; i <= GK; i++) for (let j = i; j <= GK; j++) pairs.push([i / GK, j / GK]);
        const kmLoss = (x, c) => Math.min((x - c[0]) ** 2, (x - c[1]) ** 2);
        const kmRisk = pairs.map((c) => dens.reduce((p, q, i) => p + q * kmLoss((i + 0.5) / 400, c), 0)), kmBest = kmRisk.indexOf(Math.min(...kmRisk));
        const zoRisk = (t) => NU + (1 - 2 * NU) * Math.abs(t - TH);
        const draw = (task, r, m) => {
          const X = [], Y = [];
          for (let i = 0; i < m; i++) {
            if (task === 'zo') { const x = r(); X.push(x); Y.push((r() < NU ? 1 : 0) ^ (x >= TH ? 1 : 0)); }
            else if (task === 'sq') { const x = r(); X.push(x); Y.push(clamp(0.15 + 0.7 * x + r.normal(0, 0.2), 0, 1)); }
            else { let x; do { x = r() < 0.5 ? r.normal(0.25, 0.08) : r.normal(0.7, 0.1); } while (x < 0 || x > 1); X.push(x); Y.push(0); }
          }
          return { X, Y };
        };
        // ERM returns the hypothesis; risk(h) its true risk.
        const erm = (task, S) => {
          const n = S.X.length;
          if (task === 'zo') {
            const P = new Array(GK).fill(0), N = new Array(GK).fill(0); for (let i = 0; i < n; i++) (S.Y[i] ? P : N)[Math.min(GK - 1, Math.floor(S.X[i] * GK))]++;
            let best = Infinity, bt = 0; for (let t = 0; t <= GK; t++) { let e = 0; for (let c = 0; c < GK; c++) e += c < t ? P[c] : N[c]; if (e < best) { best = e; bt = t; } }
            return bt / GK;
          }
          if (task === 'sq') { let sxy = 0, sxx = 0; for (let i = 0; i < n; i++) { sxy += S.X[i] * S.Y[i]; sxx += S.X[i] ** 2; } return clamp(sxy / sxx, -1, 1); }
          let best = Infinity, bi = 0; for (let k = 0; k < pairs.length; k++) { let e = 0; for (let i = 0; i < n; i++) e += kmLoss(S.X[i], pairs[k]); if (e < best) { best = e; bi = k; } }
          return bi;
        };
        const risk = (task, h) => (task === 'zo' ? zoRisk(h) : task === 'sq' ? sqRisk(h) : kmRisk[h]);
        const bench = (task) => (task === 'zo' ? zoRisk(Math.round(TH * GK) / GK) : task === 'sq' ? sqRisk(wOpt) : kmRisk[kmBest]);
        const bestH = (task) => (task === 'zo' ? Math.round(TH * GK) / GK : task === 'sq' ? wOpt : kmBest);
        const rounds = memo();
        let info = null;
        v.render(() => {
          const task = taskS.value, m = mS.value, eps = eS.value, delta = dS.value;
          const ex = rounds([task, m].join(), () => { const out = []; for (let i = 0; i < 400; i++) out.push(risk(task, erm(task, draw(task, rand(hashStr('g' + task + i)), m))) - bench(task)); return out; });
          const S = draw(task, rand(hashStr('gs' + task + seed + '|' + m)), m), h = erm(task, S), hb = bestH(task);
          if (task === 'zo') {
            s.setView([0, 1], [-0.1, 1.1]); s.setLabels('instance $x$', 'label $y$');
            s.dots(S.X.map((x, i) => [x, S.Y[i] + (rand(i)() - 0.5) * 0.14]), { r: 3.4, color: 'ink', alpha: 0.7 });
            s.vline(hb, { color: 'green', width: 2.4, dash: true }); s.vline(h, { color: 'accent', width: 2.6 });
          } else if (task === 'sq') {
            s.setView([0, 1], [-0.1, 1.1]); s.setLabels('instance $x$', 'label $y$');
            s.dots(S.X.map((x, i) => [x, S.Y[i]]), { r: 3.4, color: 'ink', alpha: 0.7 });
            s.line(0, 0, 1, hb, { color: 'green', width: 2.4, dash: true }); s.line(0, 0, 1, h, { color: 'accent', width: 2.6 });
          } else {
            s.setView([0, 1], [-0.1, 1.1]); s.setLabels('instance $x$', 'density');
            const mx = Math.max(...dens), f = (x) => dens[Math.min(399, Math.floor(x * 400))] / mx;
            s.fn(f, { color: 'faint', width: 2, domain: [0, 1], fill: true });
            s.dots(S.X.map((x, i) => [x, -0.04 + (rand(i)() - 0.5) * 0.04]), { r: 2.6, color: 'ink', alpha: 0.7 });
            for (const c of pairs[kmBest]) s.vline(c, { color: 'green', width: 2.4, dash: true });
            for (const c of pairs[h]) s.vline(c, { color: 'accent', width: 2.6 });
          }
          const hi = clamp(Math.max(eps * 1.8, quantile(ex, 0.99) * 1.1), 1e-3, 1), B = bins(ex, 0, hi, 40);
          const L = { edges: B.edges, counts: B.counts.map((c, i) => (B.edges[i + 1] <= eps + 1e-12 ? c : 0)) }, Rr = { edges: B.edges, counts: B.counts.map((c, i) => (B.edges[i + 1] > eps + 1e-12 ? c : 0)) };
          const top = Math.max(1, ...B.counts) * 1.15;
          sH.setView([0, hi], [0, top]); sH.hist(L, { color: 'accent', fillAlpha: 0.4 }); sH.hist(Rr, { color: 'red', fillAlpha: 0.55 });
          sH.vline(eps, { color: 'ink', width: 2 }); sH.text('$\\varepsilon$', eps, top, { dx: 6, dy: 14, size: 14 });
          info = { task, bad: ex.filter((x) => x > eps).length / ex.length, delta, eps, bench: bench(task), mean: mean(ex), m, L: risk(task, h) };
        });
        v.legend([['accent', 'ERM output'], ['green', 'best hypothesis of the class', { dash: true }], ['red', 'excess $>\\varepsilon$', { area: true }]]);
        v.readout(() => info && String.raw`Loss: ${info.task === 'zo' ? '$0$–$1$' : info.task === 'sq' ? 'squared' : '$k$-means'}. Benchmark $\min_{\mathcal H}L_{\mathcal D}=${pr(info.bench, 4)}$; this sample's output has risk $${pr(info.L, 4)}$. Mean excess $${pr(info.mean, 4)}$; **rounds with excess $>\varepsilon=${info.eps.toFixed(3)}$: $${pr(info.bad)}$** against $\delta=${info.delta.toFixed(2)}$ at $m=${info.m}$.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.4a
    {
      num: '3.4a',
      kind: 'Definition',
      name: 'Proper versus representation-independent learning',
      statement: String.raw`In the definitions of PAC learnability the learner may be restricted in what it outputs. A learner is **proper** if its output $h$ always belongs to the class $\mathcal H$ it competes against, as ERM$_{\mathcal H}$ does. A learner is **representation independent** (also called *improper*) if it may output any predictor $h:\mathcal X\to\mathcal Y$ at all, while its guarantee is still measured against the best member of $\mathcal H$:
$$L_{\mathcal D}(h)\le\min_{h'\in\mathcal H}L_{\mathcal D}(h')+\varepsilon\quad\text{with probability}\ge1-\delta.$$
A class that is learnable by an improper learner need not be learnable properly with the same efficiency; the two notions coincide for statistical (sample-size) questions about ERM.`,
      idea: String.raw`The class $\mathcal H$ is only the **yardstick**: it fixes the benchmark $\min_{\mathcal H}L_{\mathcal D}$, not the shape of the answer. An improper learner is therefore allowed to be richer than the class, and when the truth lies outside $\mathcal H$ it can even land below the benchmark; what it may not do is be worse than the benchmark by more than $\varepsilon$. Choosing the output freely matters for computation, since a hard proper-learning problem may become easy once the learner is allowed to answer with a more convenient representation, and for statistics, since the richer answer must be paid for in samples, as the left tail of the curves below shows.`,
      caption: String.raw`The yardstick class is the rectangles on a $10\times10$ grid; the truth is chosen below, with label noise. The **proper** learner (blue) returns the ERM rectangle. The **improper** learner (orange cells) returns a rule outside the class: in each of the 100 cells it predicts the majority label of the sample. Left: one sample of size $m$ with both outputs. Right: the excess over the benchmark $\min_{\mathcal H}L_{\mathcal D}$ (zero line) averaged over 30 samples, as the sample size grows. A truth that is a rectangle makes the benchmark unbeatable and the improper learner pays for its richness; an L-shape lets it dip below zero, i.e. do better than every rectangle.`,
      deps: ['ml-3.4'],
      refs: ['UML §3.2.2', 'UML Remark 3.2'],
      tags: ['proper learning', 'improper learning'],
      scope: String.raw`Illustrative: the improper rule is a cell-wise majority vote on the $10\times10$ grid (a union of cells); averages over 30 seeded samples per $m$ are noisy by about $\pm0.005$.`,
      verify: true,
      viz(v) {
        const K = 10;
        const s = square(v, { height: 380, title: 'one sample, two learners' });
        const sC = v.stage({ x: [10, 1000], y: [-0.1, 0.3], xlog: true, axes: 'box', gutter: true, height: 380, xlabel: 'sample size $m$', ylabel: 'excess over $\\min_{\\mathcal H}L_{\\mathcal D}$', title: 'excess risk against sample size' });
        const truthS = v.select('truth', [{ value: 'L', label: 'an L-shape' }, { value: 'disc', label: 'a disc' }, { value: 'rect', label: 'a rectangle of the class' }], 'L');
        const nuS = v.slider('label noise $\\nu$', 0, 0.3, 0.05, { step: 0.01 });
        const mS = v.slider('sample size $m$', 10, 1000, 120, { int: true, log: true });
        let seed = 1; v.button('New sample', () => { seed++; });
        const d = makeDens(0.5, 0.5, 0.6), world = memo(), curve = memo();
        const TG = { rect: RECT(0.2, 0.3, 0.8, 0.7), disc: target('disc'), L: target('L') };
        const cells = (S) => { const C = gridCounts(S, K); return (a, b) => C.P[a * K + b] > C.N[a * K + b]; };
        const cellRisk = (T, f) => T.riskCells((i, j) => f(Math.floor((i * K) / G3), Math.floor((j * K) / G3)));
        const MS = [10, 20, 40, 80, 160, 320, 640, 1000];
        let info = null;
        v.render(() => {
          const nu = nuS.value, tk = truthS.value, m = mS.value, key = tk + nu.toFixed(3);
          const W = world(key, () => { const eta = makeEta(TG[tk], 'flip', nu), T = riskTable(d, eta); return { eta, T, best: bestGridRect(T, K) }; });
          const C = curve(key, () => MS.map((mm) => {
            let ep = 0, ei = 0; const R = 30;
            for (let k = 0; k < R; k++) { const S = drawNoisy(d, rand(hashStr('c' + k + '|' + mm)), mm, W.eta); ep += W.T.risk(gridErm(gridCounts(S, K)).h) - W.best.risk; ei += cellRisk(W.T, cells(S)) - W.best.risk; }
            return [ep / R, ei / R];
          }));
          etaRaster(v, s, W.eta, key);
          for (let i = 1; i < K; i++) { s.line(i / K, 0, i / K, 1, { color: 'grid', width: 1 }); s.line(0, i / K, 1, i / K, { color: 'grid', width: 1 }); }
          const S = drawNoisy(d, rand(hashStr('o' + seed + '|' + m)), m, W.eta), hp = gridErm(gridCounts(S, K)).h, f = cells(S);
          for (let a = 0; a < K; a++) for (let b = 0; b < K; b++) if (f(a, b)) s.rect(a / K, b / K, (a + 1) / K, (b + 1) / K, { fill: 'orange', fillAlpha: 0.28, stroke: false });
          drawShape(s, W.best.h, { color: 'green', width: 2.2, dash: true });
          drawShape(s, hp, { color: 'accent', width: 2.8 });
          drawSample2(s, S, null, Math.min(m, 400), m > 150 ? 2.4 : 3.6);
          const all = C.flat(), lo = Math.min(-0.02, ...all) * 1.15, hi = Math.max(0.05, ...all) * 1.12;
          sC.setView([10, 1000], [lo, hi]);
          sC.hline(0, { color: 'ink', width: 1.8 });
          sC.path(MS.map((mm, i) => [mm, C[i][0]]), { color: 'accent', width: 2.8 }); sC.dots(MS.map((mm, i) => [mm, C[i][0]]), { r: 3.6, color: 'accent' });
          sC.path(MS.map((mm, i) => [mm, C[i][1]]), { color: 'orange', width: 2.8 }); sC.dots(MS.map((mm, i) => [mm, C[i][1]]), { r: 3.6, color: 'orange' });
          sC.vline(m, { color: 'gold', dash: true, width: 1.4 });
          info = { m, bench: W.best.risk, bayes: W.T.bayes, Lp: W.T.risk(hp), Li: cellRisk(W.T, f) };
        });
        v.legend([['accent', 'proper: ERM rectangle'], ['orange', 'improper: cell-wise majority'], ['green', 'best rectangle', { dash: true }], ['gold', 'your $m$', { dash: true }]]);
        v.readout(() => info && String.raw`Benchmark $\min_{\mathcal H}L_{\mathcal D}=${pr(info.bench)}$ (Bayes risk $${pr(info.bayes)}$). At $m=${info.m}$ this sample gives the proper output risk $${pr(info.Lp)}$ (excess $${pr(info.Lp - info.bench, 4)}$) and the improper output risk $${pr(info.Li)}$ (excess $${pr(info.Li - info.bench, 4)}$${info.Li < info.bench ? ', below the benchmark' : ''}).`);
      },
    },
  ],
};
