// Understanding Machine Learning — Chapter 4: Learning via Uniform Convergence
//
// Representative samples (the empirical risk curve hugging the true one), why ERM then works, the uniform convergence
// property measured by simulation, Hoeffding's inequality, and finite classes. Helpers: ch04.shared.js (which re-exports
// those of chapters 1–3).
import {
  clamp, rand, memo, mean, commas, bins, etaT, trueRisks, drawT, empRisks, argmin, supGap, drawCurves, q2, geo, quantileSorted,
} from './ch04.shared.js';
import { midpointQuantize, finiteDescriptionBound } from './ch03-foundations-audit.shared.js';

const K0 = 101;
const LN2 = Math.LN2;

export default {
  collection: 'ml',
  chapter: 4,
  title: 'Learning via Uniform Convergence',
  summary: String.raw`If the empirical risks of all hypotheses are simultaneously within ε/2 of their true risks — an ε/2-representative sample — then every empirical risk minimizer is within ε of the best in the class. A class whose large samples are representative with high probability has the uniform convergence property, and ERM then learns it in the agnostic model. For finite classes with bounded loss this follows from a union bound and Hoeffding's inequality, with sample size of order log(|H|/δ)/ε².`,
  items: [
    // ───────────────────────────────────────────────────────────── 4.1
    {
      num: '4.1',
      kind: 'Definition',
      name: 'ε-representative sample',
      statement: String.raw`Fix a domain $Z$, a hypothesis class $\mathcal H$, a loss $\ell:\mathcal H\times Z\to\mathbb R_+$ and a distribution $\mathcal D$ over $Z$. A training set $S$ is called **$\varepsilon$-representative** (with respect to $Z,\mathcal H,\ell,\mathcal D$) if the empirical risk of *every* hypothesis is within $\varepsilon$ of its true risk:
$$\forall h\in\mathcal H:\qquad |L_S(h)-L_{\mathcal D}(h)|\le\varepsilon .$$
The requirement is simultaneous, over the whole class, and holds for one fixed sample.`,
      idea: String.raw`For a single fixed $h$ the law of large numbers already says $L_S(h)\approx L_{\mathcal D}(h)$. The trouble with ERM is that it looks at the *minimum* of $L_S$ over a class, and the hypothesis at which the minimum occurs is chosen *after* seeing $S$, so the estimate there can be optimistically wrong (ml-2.1c). Representativeness is the condition that removes this selection effect: when the whole empirical curve $h\mapsto L_S(h)$ lies in an $\varepsilon$-tube around the true curve, no choice of $h$ made from $S$ can be fooled by more than $\varepsilon$. Whether samples are representative with high probability is the subject of ml-4.3.`,
      caption: String.raw`Instances are uniform on $[0,1]$, labels are random (the curve $\eta$ falls from $1$ to $0$, softened by the noise level), and the class is 101 thresholds $h_t=\mathbf 1[x\le t]$. The black curve is the true risk $L_{\mathcal D}(h_t)$, the blue one the empirical risk of a sample of size $m$, and the orange tube has half-width $\varepsilon$. Red dots mark thresholds where the sample *misleads* by more than $\varepsilon$. Drag $m$ up and the blue curve settles into the tube; press Resample for a new draw. The last line of the readout repeats the experiment 200 times.`,
      deps: ['ml-3.4'],
      refs: ['UML §4.1'],
      tags: ['representative sample', 'uniform convergence'],
      scope: String.raw`Illustrative world: the thresholds form a grid of 101 points (a finite stand-in for the infinite class of thresholds), and true risks are computed by numerical integration of $\eta$.`,
      viz(v) {
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 380, xlabel: 'threshold $t$   (hypothesis $h_t=\\mathbf 1[x\\le t]$)', ylabel: 'risk', title: 'the empirical risk curve inside the $\\varepsilon$-tube' });
        const mS = v.slider('sample size $m$', 5, 1500, 60, { int: true, log: true });
        const eS = v.slider('tube half-width $\\varepsilon$', 0.01, 0.3, 0.08, { step: 0.005 });
        const nS = v.slider('label noise $\\nu$', 0, 0.4, 0.1, { step: 0.01 });
        let seed = 7;
        v.button('Resample', () => { seed++; });
        const Lm = memo(), cm = memo();
        let info = null;
        v.render(() => {
          const nu = nS.value, m = mS.value, eps = eS.value, eta = etaT(nu);
          const L = Lm(nu.toFixed(3), () => trueRisks(eta, K0));
          const S = drawT(eta, m, rand(seed * 977 + m)), emp = empRisks(S, K0);
          const bad = drawCurves(s, L, emp, eps), gap = supGap(emp, L);
          const rep = cm([nu, m, eps].join(), () => { const r = rand(31 + m); let c = 0; for (let i = 0; i < 200; i++) if (supGap(empRisks(drawT(eta, m, r), K0), L) <= eps) c++; return c; });
          info = { gap, eps, bad, rep, m };
        });
        v.legend([['ink', 'true risk $L_{\\mathcal D}(h_t)$'], ['accent', 'empirical risk $L_S(h_t)$'], ['orange', '$\\pm\\varepsilon$ tube', { area: true }], ['red', 'outside the tube', { dot: true }]]);
        v.readout(() => info && String.raw`$\max_t|L_S(h_t)-L_{\mathcal D}(h_t)|=${q2(info.gap, 3)}$, so this sample is ${info.gap <= info.eps ? '' : 'not '}$${q2(info.eps, 3)}$-representative (${info.bad} of 101 thresholds fall outside the tube).
Among 200 fresh samples of size $m=${info.m}$, ${info.rep} were $\varepsilon$-representative.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.2
    {
      num: '4.2',
      kind: 'Lemma',
      name: 'Representative samples make ERM nearly optimal',
      statement: String.raw`Assume that $S$ is $\tfrac{\varepsilon}{2}$-representative with respect to $(Z,\mathcal H,\ell,\mathcal D)$. Then every output $h_S\in\operatorname{argmin}_{h\in\mathcal H}L_S(h)$ of the ERM rule satisfies
$$L_{\mathcal D}(h_S)\;\le\;\min_{h\in\mathcal H}L_{\mathcal D}(h)+\varepsilon .$$`,
      idea: String.raw`Chain three inequalities, and pay $\varepsilon/2$ twice. For any competitor $h\in\mathcal H$: $L_{\mathcal D}(h_S)\le L_S(h_S)+\varepsilon/2$ (representativeness at $h_S$), then $L_S(h_S)\le L_S(h)$ (ERM minimizes the empirical risk), then $L_S(h)\le L_{\mathcal D}(h)+\varepsilon/2$ (representativeness at $h$). So $L_{\mathcal D}(h_S)\le L_{\mathcal D}(h)+\varepsilon$ for every $h$, hence for the minimizer of the true risk. Nothing about $h_S$ other than "it minimizes $L_S$" is used, and the argument works for any loss and any class.`,
      caption: String.raw`Left: the picture of ml-4.1 with tube half-width $\varepsilon/2$. The blue dot is the ERM threshold (lowest point of the blue curve); the black dot sits above it on the true curve; the dashed lines are the true minimum and the minimum plus $\varepsilon$. Right: 400 samples, each contributing the excess risk $L_{\mathcal D}(h_S)-\min L_{\mathcal D}$ of its ERM. Green bars are the $\varepsilon/2$-representative samples, and **all of them** end at or below $\varepsilon$; red bars are samples that were not representative, and at small $m$ or small $\varepsilon$ some of those do exceed $\varepsilon$ (try $m=20$).`,
      deps: ['ml-4.1', 'ml-2.1b'],
      refs: ['UML §4.1'],
      tags: ['ERM', 'excess risk'],
      scope: String.raw`Same illustrative thresholds world as ml-4.1; ties in the empirical risk are broken to the left, and the lemma holds for any tie-breaking.`,
      viz(v) {
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 360, xlabel: 'threshold $t$', ylabel: 'risk', title: 'one sample and its ERM' });
        const sH = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 360, xlabel: 'excess risk $L_{\\mathcal D}(h_S)-\\min L_{\\mathcal D}$', ylabel: 'samples', yticks: [], title: '400 samples' });
        const mS = v.slider('sample size $m$', 5, 1000, 150, { int: true, log: true });
        const eS = v.slider('$\\varepsilon$', 0.02, 0.4, 0.1, { step: 0.005 });
        const nS = v.slider('label noise $\\nu$', 0, 0.4, 0.1, { step: 0.01 });
        let seed = 3;
        v.button('Resample', () => { seed++; });
        const Lm = memo(), run = memo();
        let info = null;
        v.render(() => {
          const nu = nS.value, m = mS.value, eps = eS.value, eta = etaT(nu);
          const L = Lm(nu.toFixed(3), () => trueRisks(eta, K0)), jmin = argmin(L), Lmin = L[jmin];
          const R = run([nu, m].join(), () => {
            const r = rand(100 + m), gap = [], exc = [];
            for (let i = 0; i < 400; i++) { const e = empRisks(drawT(eta, m, r), K0); gap.push(supGap(e, L)); exc.push(L[argmin(e)] - Lmin); }
            return { gap, exc };
          });
          const S = drawT(eta, m, rand(seed * 131 + m)), emp = empRisks(S, K0), j = argmin(emp), x = j / (K0 - 1);
          drawCurves(s, L, emp, eps / 2);
          s.hline(Lmin, { color: 'green', dash: true, width: 1.4 }); s.hline(Lmin + eps, { color: 'green', dash: true, width: 1.4 });
          s.text('min + $\\varepsilon$', 1, Lmin + eps, { align: 'right', dy: -9, size: 12, color: 'green' });
          s.segment([x, emp[j]], [x, L[j]], { color: 'muted', width: 1.2 });
          s.dot(x, emp[j], { color: 'accent', r: 6, label: '$h_S$', labelPos: 'sw' }); s.dot(x, L[j], { color: 'ink', r: 5 });
          const rep = [], non = []; let maxRep = 0, nrep = 0, nbadRep = 0, nbad = 0;
          for (let i = 0; i < 400; i++) { const isRep = R.gap[i] <= eps / 2 + 1e-12; (isRep ? rep : non).push(R.exc[i]); if (isRep) { nrep++; maxRep = Math.max(maxRep, R.exc[i]); if (R.exc[i] > eps + 1e-12) nbadRep++; } if (R.exc[i] > eps + 1e-12) nbad++; }
          const hi = Math.max(eps * 1.35, Math.max(...R.exc) * 1.05, 0.05), nb = 28, Br = bins(rep, 0, hi, nb), Bn = bins(non, 0, hi, nb), top = Math.max(1, ...Br.counts.map((c, i) => c + Bn.counts[i])) * 1.15;
          sH.setView([0, hi], [0, top]);
          sH.hist({ edges: Br.edges, counts: Br.counts.map((c, i) => c + Bn.counts[i]) }, { color: 'red', fillAlpha: 0.4 });
          sH.hist(Br, { color: 'green', fillAlpha: 0.55 });
          sH.vline(eps, { color: 'ink', width: 1.8, dash: true }); sH.text('$\\varepsilon$', eps, top, { dx: 6, dy: 16, size: 13 });
          const gap = supGap(emp, L);
          info = { exc: L[j] - Lmin, gap, eps, nrep, maxRep, nbadRep, nbad };
        });
        v.legend([['green', '$\\varepsilon/2$-representative', { area: true }], ['red', 'not representative', { area: true }], ['accent', 'ERM on this sample', { dot: true }]]);
        v.readout(() => info && String.raw`This sample: $\max|L_S-L_{\mathcal D}|=${q2(info.gap, 3)}$ ${info.gap <= info.eps / 2 ? '(representative)' : '(not representative)'}, excess risk of ERM $${q2(info.exc, 3)}$ ${info.gap <= info.eps / 2 ? String.raw`$\le\varepsilon$ as the lemma promises` : ''}.
Of 400 samples, ${info.nrep} were $\varepsilon/2$-representative; the largest excess among them is $${q2(info.maxRep, 3)}$, and ${info.nbadRep} of them exceed $\varepsilon$. In total ${info.nbad} samples have excess above $\varepsilon$, all of them non-representative.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.3
    {
      num: '4.3',
      kind: 'Definition',
      name: 'The uniform convergence property',
      statement: String.raw`A hypothesis class $\mathcal H$ has the **uniform convergence property** (with respect to a domain $Z$ and loss $\ell$) if there is a function $m^{\mathrm{UC}}_{\mathcal H}:(0,1)^2\to\mathbb N$ such that for all $\varepsilon,\delta\in(0,1)$ and **every** distribution $\mathcal D$ over $Z$, a sample $S$ of $m\ge m^{\mathrm{UC}}_{\mathcal H}(\varepsilon,\delta)$ i.i.d. examples from $\mathcal D$ is $\varepsilon$-representative with probability at least $1-\delta$:
$$\mathbb P_{S\sim\mathcal D^m}\Big[\sup_{h\in\mathcal H}|L_S(h)-L_{\mathcal D}(h)|\le\varepsilon\Big]\ge1-\delta .$$
The smallest such function is the sample complexity of uniform convergence.`,
      idea: String.raw`The property is a uniform law of large numbers: the empirical process $h\mapsto L_S(h)$ converges to $h\mapsto L_{\mathcal D}(h)$ in sup-norm, at a rate that depends only on $(\varepsilon,\delta)$ and on the class, not on $\mathcal D$. It is stronger than convergence at each single $h$, and it is exactly what the proof of ml-4.2 needs. Vapnik and Chervonenkis studied it for classes of events and found its combinatorial characterization (the growth function and VC dimension, ml-6.x); here only the definition and the finite case (ml-4.6) are needed.`,
      caption: String.raw`The thresholds world again. For 16 sample sizes from 5 to 3000, 150 samples are drawn and the worst gap $\sup_t|L_S-L_{\mathcal D}|$ is recorded. **Left:** its median (dashed), its $(1-\delta)$-quantile (blue), the Hoeffding-plus-union-bound curve $\sqrt{\ln(2|\mathcal H|/\delta)/2m}$ of ml-4.6 (orange), and the target $\varepsilon$ (ink). **Right:** the fraction of samples that are *not* $\varepsilon$-representative, which must drop under $\delta$; the first size where it does is the empirical $m^{\mathrm{UC}}(\varepsilon,\delta)$ (green line), and the orange line is the guaranteed size. Change the class size from 11 to 1001 thresholds: the guarantee moves with $\ln|\mathcal H|$ while the observed curves hardly move.`,
      deps: ['ml-4.1'],
      see: ['stat-1.5', 'prob-2.4.9'],
      refs: ['UML §4.1'],
      credit: 'V. N. Vapnik & A. Ya. Chervonenkis, "On the uniform convergence of relative frequencies of events to their probabilities", Theory of Probability & Its Applications 16(2), 1971, 264–280',
      tags: ['uniform convergence', 'sample complexity'],
      scope: String.raw`One distribution only (the thresholds world at the chosen noise): the definition quantifies over all $\mathcal D$, a simulation can only show one. Frequencies come from 150 samples per size, so a frequency of $0$ means "below $1/150$" and is not drawn on the log axis; the empirical $m^{\mathrm{UC}}$ is read off a grid with factor $\approx1.7$ between sizes.`,
      viz(v) {
        const MS = geo(5, 3000, 16);
        const sA = v.stage({ x: [5, 3000], y: [0.004, 1], xlog: true, ylog: true, axes: 'box', gutter: true, height: 380, xlabel: 'sample size $m$', ylabel: 'worst gap $\\sup_t|L_S-L_{\\mathcal D}|$', title: 'how large the worst gap is' });
        const sB = v.stage({ x: [5, 3000], y: [0.004, 1], xlog: true, ylog: true, axes: 'box', gutter: true, height: 380, xlabel: 'sample size $m$', ylabel: '$\\mathbb P[\\text{not }\\varepsilon\\text{-representative}]$', title: 'the failure probability' });
        const eS = v.slider('$\\varepsilon$', 0.02, 0.3, 0.06, { step: 0.005 });
        const dS = v.slider('$\\delta$', 0.02, 0.5, 0.1, { step: 0.01 });
        const nS = v.slider('label noise $\\nu$', 0, 0.4, 0.1, { step: 0.01 });
        const kS = v.select('class size $|\\mathcal H|$', [{ value: 11, label: '11' }, { value: 101, label: '101' }, { value: 1001, label: '1001' }], 101);
        const sweep = memo();
        let info = null;
        v.render(() => {
          const nu = nS.value, K = kS.value, eps = eS.value, dl = dS.value, eta = etaT(nu);
          const G = sweep([nu, K].join(), () => {
            const L = trueRisks(eta, K), r = rand(5 + K);
            return MS.map((m) => { const g = []; for (let i = 0; i < 150; i++) g.push(supGap(empRisks(drawT(eta, m, r), K), L)); return g.sort((a, b) => a - b); });
          });
          const med = MS.map((m, i) => [m, quantileSorted(G[i], 0.5)]), qd = MS.map((m, i) => [m, quantileSorted(G[i], 1 - dl)]);
          const pf = MS.map((m, i) => { let c = 0; for (const g of G[i]) if (g > eps) c++; return c / 150; });
          const bound = (m) => Math.sqrt(Math.log((2 * K) / dl) / (2 * m)), mB = Math.ceil(Math.log((2 * K) / dl) / (2 * eps * eps));
          const iu = pf.findIndex((p) => p <= dl), mU = iu < 0 ? null : MS[iu];
          sA.fn(bound, { color: 'orange', width: 2.2, domain: [5, 3000] });
          sA.path(med, { color: 'muted', width: 1.8, dash: true }); sA.path(qd, { color: 'accent', width: 2.6 });
          sA.hline(eps, { color: 'ink', width: 1.6, dash: true });
          sB.hline(dl, { color: 'orange', width: 1.8, dash: true });
          sB.path(MS.map((m, i) => (pf[i] > 0 ? [m, pf[i]] : null)), { color: 'accent', width: 2.2 });
          MS.forEach((m, i) => { if (pf[i] > 0) sB.dot(m, pf[i], { color: 'accent', r: 3.5 }); });
          if (mU) sB.vline(mU, { color: 'green', width: 2.2 });
          if (mB >= 5 && mB <= 3000) sB.vline(mB, { color: 'orange', width: 2.2, dash: true });
          info = { mU, mB, eps, dl, K };
        });
        v.legend([['accent', '$(1-\\delta)$-quantile of the gap'], ['muted', 'median gap', { dash: true }], ['orange', 'Hoeffding + union bound'], ['green', 'empirical $m^{\\mathrm{UC}}$']]);
        v.readout(() => info && String.raw`For $\varepsilon=${q2(info.eps, 3)}$, $\delta=${q2(info.dl)}$ and $|\mathcal H|=${info.K}$: the failure probability first drops below $\delta$ at $m\approx${info.mU ? commas(info.mU) : String.raw`>3000`}$ (observed), while the guaranteed size is $\lceil\ln(2|\mathcal H|/\delta)/(2\varepsilon^2)\rceil=${commas(info.mB)}$. The guarantee holds for every distribution, so it is never smaller than what one distribution needs.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.4
    {
      num: '4.4',
      kind: 'Corollary',
      name: 'Uniform convergence implies agnostic PAC learnability by ERM',
      statement: String.raw`If $\mathcal H$ has the uniform convergence property with function $m^{\mathrm{UC}}_{\mathcal H}$, then $\mathcal H$ is agnostic PAC learnable with sample complexity
$$m_{\mathcal H}(\varepsilon,\delta)\;\le\;m^{\mathrm{UC}}_{\mathcal H}(\varepsilon/2,\delta),$$
and the ERM$_{\mathcal H}$ rule is a successful agnostic PAC learner for $\mathcal H$.`,
      idea: String.raw`Take $m\ge m^{\mathrm{UC}}_{\mathcal H}(\varepsilon/2,\delta)$. With probability at least $1-\delta$ the sample is $\varepsilon/2$-representative (ml-4.3), and on that event ml-4.2 gives $L_{\mathcal D}(h_S)\le\min_{\mathcal H}L_{\mathcal D}+\varepsilon$, which is exactly ml-3.3. The only price of the reduction is the halving of the accuracy: representativeness at $\varepsilon/2$ is needed to get excess risk $\varepsilon$. The failure event of the learner is contained in the failure event of uniform convergence.`,
      caption: String.raw`A replay of 400 rounds in the thresholds world. **Left:** the picture of ml-4.2 for the round chosen by the slider (tube half-width $\varepsilon/2$, ERM marked). **Right:** one dot per round: horizontal, the worst gap $\Delta=\sup_t|L_S-L_{\mathcal D}|$ (the left panel's quantity); vertical, the excess risk of ERM. Every dot lies under the line $y=2\Delta$, rounds with $\Delta\le\varepsilon/2$ (green zone) all lie below $y=\varepsilon$, and the red dots, the rounds where the learner fails, can only appear to the right of the zone.`,
      deps: ['ml-4.2', 'ml-4.3'],
      refs: ['UML §4.1'],
      tags: ['agnostic PAC', 'ERM'],
      scope: String.raw`Thresholds world with 101 hypotheses; the failure rate is estimated from 400 rounds.`,
      viz(v) {
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 360, xlabel: 'threshold $t$', ylabel: 'risk', title: 'one round' });
        const sR = v.stage({ x: [0, 0.3], y: [0, 0.3], axes: 'box', gutter: true, height: 360, xlabel: 'worst gap $\\Delta$', ylabel: 'excess risk of ERM', title: 'all rounds' });
        const mS = v.slider('sample size $m$', 10, 600, 25, { int: true, log: true });
        const eS = v.slider('$\\varepsilon$', 0.02, 0.4, 0.06, { step: 0.005 });
        const nS = v.slider('label noise $\\nu$', 0, 0.4, 0.1, { step: 0.01 });
        const kS = v.slider('round', 1, 400, 1, { int: true });
        v.button('Next round', () => { kS.set(kS.value % 400 + 1); });
        const Lm = memo(), run = memo();
        let info = null;
        v.render(() => {
          const nu = nS.value, m = mS.value, eps = eS.value, eta = etaT(nu), k = kS.value;
          const L = Lm(nu.toFixed(3), () => trueRisks(eta, K0)), jmin = argmin(L), Lmin = L[jmin];
          const R = run([nu, m].join(), () => {
            const r = rand(900 + m), gap = [], exc = [];
            for (let i = 0; i < 400; i++) { const e = empRisks(drawT(eta, m, r), K0); gap.push(supGap(e, L)); exc.push(L[argmin(e)] - Lmin); }
            return { gap, exc };
          });
          const r2 = rand(900 + m); let e = null;
          for (let i = 0; i < k; i++) { const S = drawT(eta, m, r2); if (i === k - 1) e = empRisks(S, K0); }
          const j = argmin(e), x = j / (K0 - 1);
          drawCurves(s, L, e, eps / 2);
          s.dot(x, e[j], { color: 'accent', r: 6, label: '$h_S$', labelPos: 'sw' }); s.dot(x, L[j], { color: 'ink', r: 5 });
          s.hline(Lmin + eps, { color: 'green', dash: true, width: 1.4 }); s.hline(Lmin, { color: 'green', dash: true, width: 1.4 });
          const hi = Math.max(0.1, Math.max(...R.gap) * 1.08, eps * 0.6), hy = Math.max(eps * 1.2, Math.max(...R.exc) * 1.1, 0.05);
          sR.setView([0, hi], [0, hy]);
          sR.vband(0, Math.min(eps / 2, hi), { color: 'green', alpha: 0.12 });
          sR.line(0, 0, Math.min(hi, hy / 2), Math.min(hi, hy / 2) * 2, { color: 'muted', width: 1.4, dash: true });
          sR.hline(eps, { color: 'ink', dash: true, width: 1.5 });
          let nfail = 0, nin = 0, viol = 0, bad = 0;
          for (let i = 0; i < 400; i++) {
            const f = R.exc[i] > eps + 1e-12; if (f) nfail++;
            if (R.gap[i] <= eps / 2 + 1e-12) { nin++; if (f) viol++; }
            if (R.exc[i] > 2 * R.gap[i] + 1e-9) bad++;
            sR.dot(R.gap[i], R.exc[i], { color: f ? 'red' : 'accent', r: 2.8 });
          }
          sR.dot(R.gap[k - 1], R.exc[k - 1], { color: 'gold', r: 7 });
          info = { d: R.gap[k - 1], ex: R.exc[k - 1], eps, nfail, nin, viol, bad };
        });
        v.legend([['accent', 'successful round', { dot: true }], ['red', 'failed round (excess $>\\varepsilon$)', { dot: true }], ['gold', 'round shown on the left', { dot: true }], ['muted', '$y=2\\Delta$', { dash: true }]]);
        v.readout(() => info && String.raw`Round shown: $\Delta=${q2(info.d, 3)}$, excess risk $${q2(info.ex, 3)}$ (never above $2\Delta=${q2(2 * info.d, 3)}$). Over 400 rounds ${info.nfail} failed to reach excess $\le\varepsilon$; ${info.nin} rounds fell in the green zone $\Delta\le\varepsilon/2$ and ${info.viol} of those failed, so every failure came from a sample that was not $\varepsilon/2$-representative. Rounds violating $y\le2\Delta$: ${info.bad}.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.5
    {
      num: '4.5',
      kind: 'Lemma',
      name: 'Hoeffding’s inequality',
      statement: String.raw`Let $\theta_1,\dots,\theta_m$ be i.i.d. random variables with $\mathbb E[\theta_i]=\mu$ and $\mathbb P[a\le\theta_i\le b]=1$. Then for every $\varepsilon>0$
$$\mathbb P\Big[\Big|\frac1m\sum_{i=1}^m\theta_i-\mu\Big|>\varepsilon\Big]\;\le\;2\exp\!\Big(-\frac{2m\varepsilon^2}{(b-a)^2}\Big).$$`,
      idea: String.raw`Bound the moment generating function of a bounded, centred variable: for $\mathbb E\theta=0$ and $\theta\in[a,b]$ one has $\mathbb E e^{s\theta}\le e^{s^2(b-a)^2/8}$ (Hoeffding's lemma, by convexity of $e^{s\theta}$ on the interval). Independence multiplies the $m$ factors, and Markov's inequality applied to $e^{s\sum\theta_i}$ with the best $s$ gives a one-sided tail $e^{-2m\varepsilon^2/(b-a)^2}$; the two sides add up to the factor $2$. The bound depends on the range $b-a$ only, never on the variance, which is why it is loose for rare events (compare ml-33.6).`,
      caption: String.raw`Draw $m$ bounded variables and average them; repeat 4000 times. **Left:** the histogram of the average concentrates around $\mu$ (the shaded strip is $\mu\pm\varepsilon$). **Right:** the observed frequency of $|\text{mean}-\mu|>\varepsilon$ for every $\varepsilon$ (green) under Hoeffding's bound (blue), on a logarithmic axis; the gold marker is the current $\varepsilon$. The bound never crosses below the data, but it is far from tight when the variance is small relative to the range: try a rare event (Bernoulli with small $p$), or stretch the range to $[0,4]$, which weakens the bound while the data only scale.`,
      deps: [],
      see: ['ml-33.6', 'stat-1.16', 'stoch-12.12'],
      refs: ['UML §4.2'],
      credit: 'Wassily Hoeffding, "Probability inequalities for sums of bounded random variables", Journal of the American Statistical Association 58(301), 1963, 13–30',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Hoeffding%27s_inequality' },
      tags: ['concentration', 'Hoeffding'],
      scope: String.raw`Independent, bounded variables. The simulation uses 4000 trials per setting, so frequencies below about $2.5\cdot10^{-4}$ are reported as $0$ and are not drawn on the logarithmic axis.`,
      viz(v) {
        const D = {
          bern: { name: 'Bernoulli($p$) on $[0,1]$', a: 0, b: 1, mu: (p) => p, draw: (r, p) => (r() < p ? 1 : 0) },
          unif: { name: 'uniform on $[0,1]$', a: 0, b: 1, mu: () => 0.5, draw: (r) => r() },
          skew: { name: 'skewed: $U^3$ on $[0,1]$', a: 0, b: 1, mu: () => 0.25, draw: (r) => { const u = r(); return u * u * u; } },
          wide: { name: 'Bernoulli($p$) on $[0,4]$', a: 0, b: 4, mu: (p) => 4 * p, draw: (r, p) => (r() < p ? 4 : 0) },
        };
        const sH = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 360, xlabel: 'average of $m$ variables', ylabel: 'trials', yticks: [], title: 'the empirical mean, 4000 trials' });
        const sT = v.stage({ x: [0, 1.2], y: [1e-4, 2], ylog: true, axes: 'box', gutter: true, height: 360, xlabel: 'deviation $\\varepsilon$', ylabel: '$\\mathbb P[|\\text{mean}-\\mu|>\\varepsilon]$', title: 'tail against the bound' });
        const dS = v.select('variable', Object.entries(D).map(([value, o]) => ({ value, label: o.name })), 'bern');
        const pS = v.slider('$p$', 0.02, 0.5, 0.3, { step: 0.01 });
        const mS = v.slider('number of variables $m$', 1, 500, 30, { int: true, log: true });
        const eS = v.slider('$\\varepsilon$', 0.01, 1, 0.15, { step: 0.005 });
        const sim = memo();
        const N = 4000;
        let info = null;
        v.render(() => {
          const key = dS.value, o = D[key], p = pS.value, m = mS.value, eps = eS.value, mu = o.mu(p), rg = o.b - o.a;
          pS.el.hidden = !(key === 'bern' || key === 'wide');
          const T = sim([key, p, m].join(), () => {
            const r = rand(77 + m), means = [], dev = [];
            for (let t = 0; t < N; t++) { let s0 = 0; for (let i = 0; i < m; i++) s0 += o.draw(r, p); means.push(s0 / m); dev.push(Math.abs(s0 / m - mu)); }
            return { means, dev: dev.sort((x, y) => x - y) };
          });
          const tail = (e) => { let lo = 0, hi = N; while (lo < hi) { const mid = (lo + hi) >> 1; if (T.dev[mid] > e) hi = mid; else lo = mid + 1; } return (N - lo) / N; };
          const bound = (e) => Math.min(2, 2 * Math.exp((-2 * m * e * e) / (rg * rg)));
          const sd = Math.sqrt(mean(T.means.map((x) => (x - mu) * (x - mu))));
          const w = Math.max(eps * 1.4, 4.2 * sd, 0.02), lo = Math.max(o.a, mu - w), hi = Math.min(o.b, mu + w);
          const B = bins(T.means, lo, hi, 36), top = Math.max(1, ...B.counts) * 1.15;
          sH.setView([lo, hi], [0, top]);
          sH.vband(mu - eps, mu + eps, { color: 'orange', alpha: 0.16 });
          sH.hist(B, { color: 'accent', fillAlpha: 0.4 });
          sH.vline(mu, { color: 'green', width: 2.4 }); sH.text('$\\mu$', mu, top, { dx: 6, dy: 16, size: 13, color: 'green' });
          const xs = Array.from({ length: 241 }, (_, i) => (1.2 * i) / 240);
          sT.path(xs.map((e) => [e, bound(e)]), { color: 'accent', width: 2.6 });
          sT.path(xs.map((e) => (tail(e) > 0 ? [e, tail(e)] : null)), { color: 'green', width: 2.2 });
          const te = tail(eps), be = bound(eps);
          sT.vline(eps, { color: 'muted', dash: true, width: 1.2 });
          if (te > 0) sT.dot(eps, te, { color: 'gold', r: 6 });
          sT.dot(eps, Math.max(be, 1.2e-4), { color: 'gold', r: 6, hollow: true });
          let inside = 0; for (const x of T.means) if (Math.abs(x - mu) <= eps) inside++;
          info = { te, be, mu, eps, m, rg, sd };
        });
        v.legend([['accent', 'Hoeffding bound $2e^{-2m\\varepsilon^2/(b-a)^2}$'], ['green', 'observed frequency']]);
        v.readout(() => info && String.raw`$\mu=${q2(info.mu, 3)}$, range $b-a=${info.rg}$, standard deviation of the average $${q2(info.sd, 3)}$. At $\varepsilon=${q2(info.eps, 3)}$: observed $\mathbb P[|\bar\theta-\mu|>\varepsilon]\approx${info.te > 0 ? q2(info.te, 4) : '0\\ (<2.5\\cdot10^{-4})'}$, Hoeffding bound $${q2(info.be, 4)}$ ${info.te <= info.be ? '(bound holds)' : '(**violated by sampling noise?**)'}.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.6
    {
      num: '4.6',
      kind: 'Corollary',
      name: 'Finite classes are agnostically PAC learnable',
      statement: String.raw`Let $\mathcal H$ be a finite hypothesis class, $Z$ a domain and $\ell:\mathcal H\times Z\to[0,1]$ a loss. Then $\mathcal H$ has the uniform convergence property with
$$m^{\mathrm{UC}}_{\mathcal H}(\varepsilon,\delta)\;\le\;\Big\lceil\frac{\ln(2|\mathcal H|/\delta)}{2\varepsilon^2}\Big\rceil ,$$
and is therefore agnostic PAC learnable by ERM$_{\mathcal H}$ with
$$m_{\mathcal H}(\varepsilon,\delta)\;\le\;m^{\mathrm{UC}}_{\mathcal H}(\varepsilon/2,\delta)\;\le\;\Big\lceil\frac{2\ln(2|\mathcal H|/\delta)}{\varepsilon^2}\Big\rceil .$$`,
      idea: String.raw`Fix $h$. The losses $\ell(h,z_i)$ are i.i.d. with values in $[0,1]$ and mean $L_{\mathcal D}(h)$, so Hoeffding (ml-4.5, $b-a=1$) gives $\mathbb P[|L_S(h)-L_{\mathcal D}(h)|>\varepsilon]\le2e^{-2m\varepsilon^2}$. The union bound (ml-2.2) over the $|\mathcal H|$ hypotheses multiplies this by $|\mathcal H|$; making the result at most $\delta$ gives the sample size. The class size enters only through $\ln|\mathcal H|$, so a class can be astronomically large and still be learnable. Then ml-4.4 turns uniform convergence into agnostic learning.`,
      caption: String.raw`The data are 3000 labelled points in the square (a fixed population standing in for $\mathcal D$); labels follow a half-plane, with a fraction $\nu$ flipped. The class is $k$ random half-planes (left, grey; the red one is the worst offender at the chosen $m$ in the first run). **Right:** for 6 independent samples of size up to 1000 (blue), the largest gap $\max_h|L_S(h)-L_{\mathcal D}(h)|$ against $m$, and the guarantee $\sqrt{\ln(2k/\delta)/2m}$ (orange; dashed: for $100k$ classifiers). Multiply $k$ by 100 and the guarantee rises only slightly (the dashed line); raise $k$ yourself and compare how much the observed gaps move. At each fixed sample size, each run is under the orange line with probability at least $1-\delta$. This is not a simultaneous guarantee over the entire sample-size curve.`,
      deps: ['ml-4.5', 'ml-2.2', 'ml-4.4'],
      refs: ['UML §4.2'],
      tags: ['finite class', 'union bound'],
      scope: String.raw`Bounded loss in $[0,1]$ ($0$–$1$ loss here). $\mathcal D$ is the empirical distribution of a 3000-point population, so risks are exact and samples are drawn with replacement; $k\le3000$ half-planes. Six runs are far too few to estimate a $\delta$-quantile; they show typical behaviour, the theorem bounds a failure probability for each fixed sample size. Individual runs and observed finite fractions can cross the bound.`,
      viz(v) {
        const P = 3000;
        const sL = v.stage({ x: [-1, 1], y: [-1, 1], equal: true, axes: 'box', gutter: true, height: 380, xlabel: '$x_1$', ylabel: '$x_2$', title: 'data and $k$ random half-planes' });
        const sR = v.stage({ x: [10, 1000], y: [0.002, 1], xlog: true, ylog: true, axes: 'box', gutter: true, height: 380, xlabel: 'sample size $m$', ylabel: '$\\max_h|L_S(h)-L_{\\mathcal D}(h)|$', title: 'the largest gap shrinks like $1/\\sqrt m$' });
        const kS = v.slider('number of classifiers $k=|\\mathcal H|$', 1, 3000, 30, { int: true, log: true });
        const nS = v.slider('label noise $\\nu$', 0, 0.4, 0.2, { step: 0.01 });
        const dS = v.slider('$\\delta$', 0.02, 0.5, 0.1, { step: 0.01 });
        const mS = v.slider('sample size $m$ (marker)', 10, 1000, 100, { int: true, log: true });
        let seed = 1;
        v.button('Resample', () => { seed++; });
        const MS = geo(10, 1000, 16), R = 6;
        const wm = memo(), rm = memo();
        const world = (nu) => {
          const r = rand(11), X = new Float64Array(2 * P), Y = new Uint8Array(P);
          for (let i = 0; i < P; i++) { X[2 * i] = r.uniform(-1, 1); X[2 * i + 1] = r.uniform(-1, 1); const base = X[2 * i] * Math.cos(0.5) + X[2 * i + 1] * Math.sin(0.5) > 0.05 ? 1 : 0; Y[i] = r() < nu ? 1 - base : base; }
          const cr = rand(23), C = [];
          for (let i = 0; i < 3000; i++) { const th = cr.uniform(0, 2 * Math.PI); C.push({ c: Math.cos(th), s: Math.sin(th), b: cr.normal(0, 0.35) }); }
          return { X, Y, C };
        };
        let info = null;
        v.render(() => {
          const k = kS.value, nu = nS.value, dl = dS.value, m = mS.value;
          const W = wm(nu.toFixed(3), () => world(nu));
          const E = rm([k, nu.toFixed(3), seed].join(), () => {
            const err = new Uint8Array(P * k), L = new Float64Array(k);
            for (let i = 0; i < P; i++) { const x = W.X[2 * i], y = W.X[2 * i + 1]; for (let c = 0; c < k; c++) { const q = W.C[c], pred = x * q.c + y * q.s > q.b ? 1 : 0, e = pred !== W.Y[i] ? 1 : 0; err[i * k + c] = e; L[c] += e; } }
            for (let c = 0; c < k; c++) L[c] /= P;
            const runs = [];
            for (let q = 0; q < R; q++) {
              const r = rand(1000 * seed + q), idx = new Int32Array(1000), cum = new Float64Array(k), gaps = []; let ci = 0;
              for (let j = 0; j < 1000; j++) {
                idx[j] = Math.floor(r() * P); const row = idx[j] * k;
                for (let c = 0; c < k; c++) cum[c] += err[row + c];
                if (j + 1 === MS[ci]) { let g = 0; for (let c = 0; c < k; c++) g = Math.max(g, Math.abs(cum[c] / (j + 1) - L[c])); gaps.push(g); ci++; }
              }
              runs.push({ idx, gaps });
            }
            return { err, L, runs };
          });
          // left panel
          for (let i = 0; i < 400; i++) sL.dot(W.X[2 * i], W.X[2 * i + 1], { color: W.Y[i] ? 'green' : 'pink', r: 2.4 });
          const seg = (q, o) => { const px = q.b * q.c, py = q.b * q.s; sL.line(px - 3 * q.s, py + 3 * q.c, px + 3 * q.s, py - 3 * q.c, o); };
          sL.clip(() => {
            for (let c = 0; c < Math.min(k, 12); c++) seg(W.C[c], { color: 'muted', width: 1, alpha: 0.6 });
            const idx = E.runs[0].idx, cum = new Float64Array(k);
            for (let j = 0; j < m; j++) { const row = idx[j] * k; for (let c = 0; c < k; c++) cum[c] += E.err[row + c]; }
            let w = 0, wg = -1; for (let c = 0; c < k; c++) { const g = Math.abs(cum[c] / m - E.L[c]); if (g > wg) { wg = g; w = c; } }
            seg(W.C[w], { color: 'red', width: 2.8 });
            info = { w, wg, Lw: E.L[w], Sw: cum[w] / m };
          });
          // right panel
          const bnd = (kk) => (mm) => Math.sqrt(Math.log((2 * kk) / dl) / (2 * mm));
          sR.fn(bnd(100 * k), { color: 'orange', width: 1.8, dash: true, domain: [10, 1000] });
          sR.fn(bnd(k), { color: 'orange', width: 2.6, domain: [10, 1000] });
          E.runs.forEach((run) => sR.path(MS.map((mm, i) => [mm, Math.max(run.gaps[i], 1e-3)]), { color: 'accent', width: 1.6, alpha: 0.65 }));
          sR.vline(m, { color: 'gold', width: 1.6 });
          const ci = MS.findIndex((x) => x >= m);
          const gs = E.runs.map((run) => run.gaps[ci < 0 ? MS.length - 1 : ci]);
          info.gmax = Math.max(...gs); info.gmed = gs.slice().sort((a, b) => a - b)[R >> 1]; info.bound = bnd(k)(MS[ci < 0 ? MS.length - 1 : ci]); info.b100 = bnd(100 * k)(MS[ci < 0 ? MS.length - 1 : ci]); info.mm = MS[ci < 0 ? MS.length - 1 : ci]; info.k = k;
        });
        v.legend([['accent', 'largest gap in one run'], ['orange', 'guarantee for $k$'], ['orange', 'guarantee for $100k$', { dash: true }], ['red', 'worst classifier (run 1)']]);
        v.readout(() => info && String.raw`At $m\approx${info.mm}$ (nearest grid size) and $k=${info.k}$: gaps in the 6 runs have median $${q2(info.gmed, 3)}$ and maximum $${q2(info.gmax, 3)}$, the guarantee is $${q2(info.bound, 3)}$ (it would be $${q2(info.b100, 3)}$ for $100k$ classifiers). The red classifier of run 1 has true risk $${q2(info.Lw, 3)}$ but empirical risk $${q2(info.Sw, 3)}$ on the first $m$ points.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.6a
    {
      num: '4.6a',
      kind: 'Concept',
      name: 'The discretization trick',
      statement: String.raw`A hypothesis class is often parametrized by $d$ real numbers (the weights of a linear predictor, say). On a computer every number is stored with $b$ bits (typically $b=32$ or $64$), so the class actually used is finite, with
$$|\mathcal H|\;\le\;2^{bd}\qquad\text{and}\qquad \ln|\mathcal H|\le bd\ln2 .$$
For a loss with values in $[0,1]$, ml-4.6 then guarantees that ERM over the discretized class is agnostic PAC with
$$m_{\mathcal H}(\varepsilon,\delta)\;\le\;\Big\lceil\frac{2\,(bd\ln2+\ln(2/\delta))}{\varepsilon^2}\Big\rceil ,$$
linear in the description length $bd$. The guarantee compares with the best representable hypothesis; it does not bound the extra error from quantizing an unrestricted real-valued class or guarantee an efficient ERM search.`,
      idea: String.raw`ml-4.6 charges $\ln|\mathcal H|$ for a finite class, and a hypothesis that takes $bd$ bits to specify can be one of at most $2^{bd}$ objects. So $\ln|\mathcal H|\le bd\ln 2$, and the bound is linear in the description length. The argument is crude and the bound is typically far from tight, but it shows that a fixed finite representation of a parametric class with a bounded loss is statistically learnable by ERM from a number of examples that scales with the number of parameters. This is a counting argument about a finite class; nearby parameters can still have very different risks without regularity assumptions. The sharper way to measure the size of an infinite class, without referring to the arithmetic, is the VC dimension of ml-6.x.`,
      caption: String.raw`Left: two of the $d$ parameters live in $[0,1]$; with $b$ bits each the illustration uses $2^b$ midpoint codes per coordinate, $(j+1/2)2^{-b}$, $0\le j<2^b$. Their Cartesian grid is drawn only for $b\le6$; finer grids are not drawn. Drag $\theta$ to see the quantization to the midpoint of the containing cell (the nearest midpoint, with ties at cell edges) and the rounding error, at most $2^{-b-1}$ per coordinate. Right: the sample-size bound against the number of parameters $d$, one line per precision $b$ (grey: 8, 16, 32, 64 bits; blue: your $b$). Doubling $b$ doubles the slope; the bound is affine in $d$ because the confidence term supplies a nonzero intercept. At more than 52 bits the figure cannot resolve all midpoint spacings; the error readout retains exact binary-grid differences.`,
      deps: ['ml-4.6'],
      refs: ['UML Corollary 4.6 and Remark 4.1, pp. 57–58'],
      tags: ['finite precision', 'sample complexity'],
      scope: String.raw`Worst-case bound for a loss in $[0,1]$, assuming the parameters are written with $b$ bits and the learner searches among those representable hypotheses. Distinct parameter vectors may give the same predictor, so $2^{bd}$ is an upper bound on $|\mathcal H|$; the sample size is generally pessimistic. The plotted code is a uniform fixed-point illustration, not the nonuniform spacing of actual floating-point formats. Generalization and quantization error are separate.`,
      viz(v) {
        const sA = v.stage({ x: [0, 1], y: [0, 1], equal: true, axes: 'box', gutter: true, height: 380, xlabel: 'parameter $\\theta_1\\in[0,1]$', ylabel: 'parameter $\\theta_2$', title: 'representable parameters' });
        const sB = v.stage({ x: [0, 100], y: [0, 1], axes: 'box', gutter: true, height: 380, xlabel: 'number of parameters $d$', ylabel: 'examples sufficient (thousands)', title: 'the guarantee grows linearly in $bd$' });
        const bS = v.slider('bits per parameter $b$', 1, 64, 4, { int: true });
        const dS = v.slider('parameters $d$', 1, 100, 10, { int: true });
        const eS = v.slider('$\\varepsilon$', 0.02, 0.3, 0.1, { step: 0.005 });
        const dl = v.slider('$\\delta$', 0.01, 0.5, 0.05, { step: 0.01 });
        const th = sA.handle(0.37, 0.62, { color: 'accent', label: '$\\theta$' });
        const mB = (bits, d, eps, del) => (2 * (bits * d * LN2 + Math.log(2 / del))) / (eps * eps);
        const mK = (bits, d, eps, del) => mB(bits, d, eps, del) / 1000;
        let info = null;
        v.render(() => {
          const b = bS.value, d = dS.value, eps = eS.value, del = dl.value, n = Math.pow(2, b), bd = Math.min(b, 6), nd = Math.pow(2, bd);
          th.set(clamp(th.x,0,1),clamp(th.y,0,1));
          if(b<=6){for(let i=0;i<nd;i++)for(let j=0;j<nd;j++)sA.dot((i+.5)/nd,(j+.5)/nd,{color:'muted',r:nd>32?1.6:2.6});}else sA.corner('grid too fine to draw','tl',{color:'muted'});
          const qx=midpointQuantize(th.x,b),qy=midpointQuantize(th.y,b),rx=qx.value,ry=qy.value;
          sA.segment([th.x, th.y], [rx, ry], { color: 'orange', width: 2 });
          sA.dot(rx, ry, { color: 'green', r: 5 });
          const ymax = mK(64, 100, eps, del) * 1.05;
          sB.setView([0, 100], [0, ymax]);
          for (const bb of [8, 16, 32, 64]) { sB.line(0, mK(bb, 0, eps, del), 100, mK(bb, 100, eps, del), { color: 'muted', width: 1.3 }); sB.text(`${bb} bits`, 100, mK(bb, 100, eps, del), { align: 'right', dy: -9, size: 11.5 }); }
          sB.line(0, mK(b, 0, eps, del), 100, mK(b, 100, eps, del), { color: 'accent', width: 2.8 });
          sB.dot(d, mK(b, d, eps, del), { color: 'gold', r: 7 });
          info = { b, d, m: finiteDescriptionBound(b,d,eps,del), err: Math.max(qx.error,qy.error), half: qx.half, lnH: b * d * LN2, big: Math.ceil(mB(32, 1e6, eps, del)) };
        });
        v.readout(() => info && String.raw`$|\mathcal H|\le2^{${info.b * info.d}}$, i.e. $\ln|\mathcal H|\le${q2(info.lnH, 1)}$; sufficient sample size $\lceil2(bd\ln2+\ln(2/\delta))/\varepsilon^2\rceil=${commas(info.m)}$. Rounding error of $\theta$ (largest coordinate): $${v.sci(info.err, 2)}$, at most $2^{-b-1}=${v.sci(info.half, 2)}$. The theorem compares with the best fixed-code hypothesis. For comparison, $10^6$ parameters encoded with 32 bits give a sufficient sample size $${v.sci(info.big, 2)}$ at the same $\varepsilon,\delta$.`);
      },
    },
  ],
};
