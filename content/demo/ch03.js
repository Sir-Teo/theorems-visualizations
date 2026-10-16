// Demography — Chapter 3: Patterns of mortality (part a: 3.1–3.7)
import { sum, clamp, fx, int, CTRY, CNAME, LC_CTRY, LTY, MID22, NS22, AGE22, mxOf, lxOf, gi, line, gompFit, hazardsFromM, lt22, leeCarter, drift, frailtyHazard, REC_BOTH, REC_BOTH_WHO, REC_FEM, REC_FEM_WHO, TRAJ } from './ch03.shared.js';

const SUPM = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³' };
const cOpts = (list) => list.map((c) => ({ value: c, label: CNAME[c] }));
const ln2 = Math.log(2);

export default {
  collection: 'demo',
  chapter: 3,
  title: 'Patterns of mortality',
  summary: String.raw`Adult death rates rise roughly exponentially with age, the regularity Gompertz found in 1825, with a constant added for age-independent deaths. Heterogeneity in frailty bends the curve at old ages, and whether mortality truly plateaus is debated. Model life tables and the Lee–Carter method summarize whole schedules with a few parameters, and the record life expectancy has risen with startling linearity for nearly two centuries.`,
  items: [
    // ───────────────────────────────────────────────────────────── 3.1
    {
      num: '3.1',
      kind: 'Law',
      name: 'Gompertz law of mortality',
      statement: String.raw`Over the adult ages the force of mortality grows geometrically with age:
$$\mu(x) = B\,e^{\alpha x} = B\,c^{x},\qquad B>0,\ \alpha=\ln c>0 .$$
On a logarithmic scale the death rate is a straight line of slope $\alpha$. Equivalently the **mortality-rate doubling time** is $\ln 2/\alpha$ years, and the survival function is $S(x)=\exp\!\big(-\tfrac{B}{\alpha}(e^{\alpha x}-1)\big)$, a Gompertz curve in the sense of the growth model. The law is an empirical regularity, not a theorem: it describes ages from about 30 to 90, not childhood, young-adult accident mortality, or (disputed) extreme old age.`,
      idea: String.raw`Take logarithms: $\ln\mu(x)=\ln B+\alpha x$, a line, so slope and intercept can be read from data by least squares. The hazard of 2.5 is $-\,d\ln S/dx$, so a geometric hazard integrates to the closed-form survival above (2.6). The slope $\alpha$ is remarkably similar across populations while the intercept $B$ differs a hundredfold, so reductions in mortality over time have mostly shifted the line down rather than tilted it.`,
      caption: String.raw`Real death rates of both sexes (UN estimates, 5-year age groups). Pick a country and year, then set the age window of the fit with the two sliders: filled dots are fitted, hollow ones are not. The left panel is logarithmic (a straight line is the law); the right shows the same fitted exponential on linear axes. Slide the window down to age 30 or up to 95 and watch the fit degrade.`,
      deps: ['demo-2.5', 'mathbio-1.8'],
      refs: ['PHG ch. 9'],
      tags: ['hazard', 'ageing', 'exponential'],
      scope: String.raw`Holds approximately at adult ages (about 30–90) in populations with modern data; age-group rates of the UN tables at 85 and over rely on smoothing and extrapolation.`,
      credit: 'Benjamin Gompertz, 1825',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Gompertz%E2%80%93Makeham_law_of_mortality' },
      viz(v) {
        const co = v.select('country', cOpts(LC_CTRY), 'USA');
        const yr = v.slider('year', 1950, 2023, 2019, { int: true });
        const lo = v.slider('fit from age', 30, 80, 40, { step: 5, int: true });
        const hi = v.slider('fit to age', 50, 95, 90, { step: 5, int: true });
        const s = v.stage({ x: [20, 100], y: [1e-4, 1], ylog: true, axes: 'box', gutter: true, xlabel: 'age', ylabel: 'death rate m(x), per year', height: 360, title: 'Death rates on a log scale' });
        const t = v.stage({ x: [20, 100], y: [0, 0.6], axes: 'box', gutter: true, xlabel: 'age', ylabel: 'death rate m(x), per year', height: 360, title: 'The same data, linear scale' });
        let R = null;
        v.render(() => {
          const m = mxOf(co.value, yr.value), a0 = lo.value, a1 = Math.max(hi.value, a0 + 10);
          const all = hazardsFromM(m, 20, 95), fit = hazardsFromM(m, a0, a1), g = gompFit(fit);
          const f = (x) => g.B * Math.exp(g.alpha * x);
          s.fn(f, { domain: [20, 100], color: 'orange', width: 2.5 });
          t.fn(f, { domain: [20, 100], color: 'orange', width: 2.5 });
          for (const p of all) {
            const inside = p.x > a0 && p.x < a1 + 5;
            s.dot(p.x, p.mu, { r: 4.5, color: 'accent', hollow: !inside });
            t.dot(p.x, p.mu, { r: 4.5, color: 'accent', hollow: !inside });
          }
          s.vband(a0, a1 + 5, { color: 'orange', alpha: 0.06 });
          t.vband(a0, a1 + 5, { color: 'orange', alpha: 0.06 });
          R = { g, a0, a1, m, f };
        });
        v.legend([['accent', 'data (filled = used in the fit)'], ['orange', '$B e^{\\alpha x}$']]);
        v.readout(() => `${CNAME[co.value]} ${yr.value}: fit on ages ${R.a0}–${R.a1 + 4}\n$\\alpha = ${v.fix(R.g.alpha, 4)}$ per year, doubling time $\\ln 2/\\alpha = ${v.fix(ln2 / R.g.alpha, 2)}$ years, $B = ${v.sci(R.g.B, 3)}$, $R^2 = ${v.fix(R.g.r2, 4)}$ (log scale)\nat 92.5: observed ${v.fix(R.m[gi(90)], 3)}, law ${v.fix(R.f(92.5), 3)}; at 22.5: observed ${v.fix(R.m[gi(20)], 5)}, law ${v.fix(R.f(22.5), 5)}`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.2
    {
      num: '3.2',
      kind: 'Law',
      name: 'Gompertz–Makeham law',
      statement: String.raw`Makeham added an age-independent term to Gompertz's hazard:
$$\mu(x)=A+B\,e^{\alpha x},\qquad A\ge0 .$$
The constant $A$ stands for risks that do not depend on age (accidents, violence, some infections) and $B e^{\alpha x}$ for senescent mortality. Survival is $S(x)=\exp\!\big(-Ax-\tfrac{B}{\alpha}(e^{\alpha x}-1)\big)$. The share of the age-independent term in total mortality, $A/\mu(x)$, is close to 1 in the early twenties and tiny after 70; with $A=0$ the Gompertz law is recovered.`,
      idea: String.raw`The two terms are independent competing risks: the cumulative hazard of 2.6 is a sum, so the survival function factors into $e^{-Ax}$ times the Gompertz survival. With three parameters the log-hazard is no longer a line but bends upward at young adult ages, where the constant dominates; fitting both terms to rates over ages 15–95 therefore removes the systematic misfit that a pure Gompertz line shows at the young end (3.1).`,
      caption: String.raw`The same UN rates as in 3.1, now over ages 15–95. The blue line is the best pure Gompertz fit; the orange curve adds the constant $A$ (dashed floor). Drag $A$ and the other two parameters are refitted; the button restores the least-squares $A$. The right panel shows the share of the constant term in the hazard by age.`,
      deps: ['demo-3.1'],
      refs: ['PHG ch. 9'],
      tags: ['hazard', 'competing risks'],
      scope: String.raw`An empirical description of adult mortality. The constant is not purely "extrinsic": the fitted $A$ also absorbs deviations at the youngest adult ages, and it depends on the age range fitted.`,
      credit: 'William Makeham, 1860',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Gompertz%E2%80%93Makeham_law_of_mortality' },
      viz(v) {
        const co = v.select('country', cOpts(LC_CTRY), 'USA');
        const yr = v.slider('year', 1950, 2023, 2019, { int: true });
        const Asl = v.slider('$A$ per 100 000', 0, 400, 52, { step: 1 });
        const s = v.stage({ x: [10, 100], y: [1e-4, 1], ylog: true, axes: 'box', gutter: true, xlabel: 'age', ylabel: 'death rate m(x), per year', height: 360, title: 'Gompertz and Gompertz–Makeham fits' });
        const t = v.stage({ x: [15, 100], y: [0, 1], axes: 'box', gutter: true, xlabel: 'age', ylabel: 'share of $A$ in $\\mu(x)$', height: 360, title: 'Share of the age-independent term' });
        const objective = (pts, Afix) => (p) => {
          const B = Math.exp(p[0]), al = p[1]; let e = 0;
          for (const q of pts) { const d = Math.log(Afix + B * Math.exp(al * q.x)) - Math.log(q.mu); e += d * d; }
          return e;
        };
        let R = null, cache = null;
        const fits = () => {
          const key = co.value + yr.value;
          if (cache && cache.key === key) return cache;
          const pts = hazardsFromM(mxOf(co.value, yr.value), 15, 95), g0 = gompFit(pts.filter((p) => p.x > 40 && p.x < 90));
          const gg = v.M.nelderMead(objective(pts, 0), [g0.lnB, g0.alpha], { step: [0.5, 0.01], tol: 1e-12, maxIt: 400 });
          // optimal A: search over A with the other two refitted
          const costA = (A) => v.M.nelderMead(objective(pts, A), gg.x, { step: [0.3, 0.005], tol: 1e-12, maxIt: 300 });
          let lo = 0, hi = 0.004;
          for (let i = 0; i < 28; i++) { const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3; if (costA(m1).fx < costA(m2).fx) hi = m2; else lo = m1; }
          const Aopt = (lo + hi) / 2;
          return (cache = { key, pts, gg, Aopt, gOpt: costA(Aopt) });
        };
        v.button('least-squares $A$', () => Asl.set(Math.round(fits().Aopt * 1e5)));
        let firstA = true;
        v.render(() => {
          const F = fits();
          if (firstA) { firstA = false; Asl.set(Math.round(F.Aopt * 1e5)); }
          const A = Asl.value / 1e5;
          const fit = v.M.nelderMead(objective(F.pts, A), F.gg.x, { step: [0.3, 0.005], tol: 1e-12, maxIt: 300 });
          const B = Math.exp(fit.x[0]), al = fit.x[1], Bg = Math.exp(F.gg.x[0]), ag = F.gg.x[1];
          const mu = (x) => A + B * Math.exp(al * x);
          s.fn((x) => Bg * Math.exp(ag * x), { domain: [10, 100], color: 'accent', width: 2.2 });
          s.fn(mu, { domain: [10, 100], color: 'orange', width: 2.8 });
          s.hline(Math.max(A, 1e-5), { color: 'orange', dash: true, alpha: 0.8 });
          for (const p of F.pts) s.dot(p.x, p.mu, { r: 4.5, color: 'ink' });
          t.fn((x) => A / mu(x), { domain: [15, 100], fill: true, color: 'orange', width: 2.4, fillAlpha: 0.2 });
          const rms = (f) => Math.sqrt(sum(F.pts.map((p) => (Math.log(f(p.x)) - Math.log(p.mu)) ** 2)) / F.pts.length);
          R = { A, B, al, Bg, ag, rmsG: rms((x) => Bg * Math.exp(ag * x)), rmsGM: rms(mu), Aopt: F.Aopt, sh: [20, 40, 60, 80].map((x) => [x, A / mu(x)]) };
        });
        v.legend([['ink', 'data'], ['accent', 'Gompertz ($A=0$)'], ['orange', 'Gompertz–Makeham'], ['orange', '$A$', { dash: true }]]);
        v.readout(() => `${CNAME[co.value]} ${yr.value}: $A = ${v.fix(R.A * 1e5, 0)}$ per 100 000 (least squares: ${v.fix(R.Aopt * 1e5, 0)}), $\\alpha = ${v.fix(R.al, 4)}$, doubling ${v.fix(ln2 / R.al, 2)} yr\nroot-mean-square log error: Gompertz ${v.fix(R.rmsG, 3)}, with $A$ ${v.fix(R.rmsGM, 3)}\nshare of $A$ in the hazard: ${R.sh.map(([x, q]) => `age ${x}: ${v.fix(100 * q, 1)}%`).join(', ')}`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.3
    {
      num: '3.3',
      kind: 'Model',
      name: 'Frailty: heterogeneity bends cohort hazards (Vaupel)',
      statement: String.raw`Let each individual have hazard $z\,\mu_0(x)$, where $\mu_0(x)=a e^{bx}$ is a common Gompertz baseline and the **frailty** $z$ is fixed at birth, with a gamma distribution of mean 1 and variance $\sigma^2$. The cohort's observed hazard is the average over survivors:
$$\bar\mu(x)=\frac{\mu_0(x)}{1+\sigma^2 H_0(x)},\qquad H_0(x)=\int_0^x\mu_0 = \tfrac{a}{b}(e^{bx}-1).$$
For $\sigma^2>0$, $\bar\mu$ rises more slowly than $\mu_0$ and tends to the finite limit $b/\sigma^2$, so a **plateau appears in the population although no individual's hazard flattens**. Survivors' frailty is gamma with shape $1/\sigma^2$ and rate $1/\sigma^2+H_0(x)$; its mean $1/(1+\sigma^2H_0)$ falls with age: selection by death.`,
      idea: String.raw`At each age the frailest die first, so the survivors are a selected, more robust group. Conditioning a gamma prior on survival to $x$ multiplies its density by $e^{-zH_0(x)}$, which keeps it gamma with the rate increased by $H_0(x)$ (the same weighting that gives the survival function in 2.6). Averaging $z\mu_0$ over that density gives the formula. With $\sigma^2\to0$ the baseline is recovered, which is why heterogeneity matters for the interpretation of any hazard measured on a cohort (3.1).`,
      caption: String.raw`Left: the individual baseline (dashed line), the 10th and 90th percentile frailty lines (thin), the exact cohort hazard (thick) and Monte Carlo estimates from 30 000 simulated lives (dots). Increase the frailty variance and the cohort curve bends below its baseline toward the dotted asymptote $b/\sigma^2$. Right: the distribution of frailty among survivors at the age you choose, against its birth distribution.`,
      deps: ['demo-3.1'],
      refs: ['K&C: Understanding Population Characteristics'],
      tags: ['frailty', 'heterogeneity', 'selection'],
      scope: String.raw`A stylized model: gamma frailty is a convenient mathematical choice (it keeps the survivors gamma) and multiplicative proportional hazards are assumed; the baseline here ($a=2.5\cdot10^{-5}$, $b=0.095$) is illustrative, not fitted.`,
      credit: 'James W. Vaupel, Kenneth G. Manton and Eric Stallard, 1979',
      links: { doi: 'https://doi.org/10.2307/2061224' },
      viz(v) {
        const a = 2.5e-5, b = 0.095, N = 30000;
        const sg = v.slider('frailty variance $\\sigma^2$', 0.02, 2, 0.5, { step: 0.01 });
        const ag = v.slider('age shown (right)', 40, 105, 85, { step: 1, int: true });
        const s = v.stage({ x: [30, 110], y: [1e-4, 3], ylog: true, axes: 'box', gutter: true, xlabel: 'age', ylabel: 'hazard, per year', height: 360, title: 'Individual hazard versus cohort hazard' });
        const t = v.stage({ x: [0, 4], y: [0, 3], axes: 'box', gutter: true, xlabel: 'frailty $z$', ylabel: 'density', height: 360, title: 'Frailty among survivors' });
        const U = (() => { const r = v.rng(5), out = new Array(N); for (let i = 0; i < N; i++) out[i] = r(); return out; })();
        let mc = null, mcKey = '';
        let info = null;
        v.render(() => {
          const s2 = sg.value, k = 1 / s2, H0 = (x) => (a / b) * (Math.exp(b * x) - 1);
          const key = String(s2);
          if (key !== mcKey) {
            const r = v.rng(11), zs = v.M.dist.gamma(k, s2).sample(r, N), edges = [];
            for (let x = 30; x < 110; x += 3) edges.push(x);
            const dead = new Array(edges.length).fill(0), expo = new Array(edges.length).fill(0);
            for (let i = 0; i < N; i++) {
              const T = Math.log(1 + (b * -Math.log(1 - U[i])) / (a * zs[i])) / b;
              for (let j = 0; j < edges.length; j++) {
                const lo = edges[j], hi = lo + 3;
                if (T <= lo) break;
                expo[j] += Math.min(T, hi) - lo;
                if (T < hi) { dead[j]++; break; }
              }
            }
            mc = edges.map((x, j) => ({ x: x + 1.5, mu: dead[j] / Math.max(expo[j], 1e-9), n: dead[j] })).filter((p) => p.n >= 25 && p.mu > 0);
            mcKey = key;
          }
          const base = (x) => a * Math.exp(b * x);
          s.fn(base, { domain: [30, 110], color: 'muted', dash: true, width: 2 });
          for (const q of [0.1, 0.9]) { const z = v.M.dist.gamma(k, s2).quantile(q); s.fn((x) => z * base(x), { domain: [30, 110], color: 'faint', width: 1.5 }); }
          s.fn((x) => frailtyHazard(a, b, s2, x), { domain: [30, 110], color: 'accent', width: 3 });
          s.hline(b / s2, { color: 'red', dash: true, alpha: 0.7 });
          for (const p of mc) s.dot(p.x, p.mu, { r: 3.5, color: 'gold' });
          const x0 = ag.value, Hh = H0(x0), shape = k, scale0 = s2, rate1 = k + Hh;
          const g0 = v.M.dist.gamma(shape, scale0), g1 = v.M.dist.gamma(shape, 1 / rate1);
          t.fn((z) => g0.pdf(z), { domain: [0.001, 4], color: 'muted', dash: true, width: 2 });
          t.fn((z) => g1.pdf(z), { domain: [0.001, 4], color: 'accent', width: 2.8, fill: true, fillAlpha: 0.15 });
          t.vline(1, { color: 'faint' });
          t.vline(1 / (1 + s2 * Hh), { color: 'orange', width: 2 });
          const mu = frailtyHazard(a, b, s2, x0);
          info = { s2, x0, mean: 1 / (1 + s2 * Hh), plateau: b / s2, mu, base: base(x0), surv: Math.pow(1 + s2 * Hh, -1 / s2), maxdev: mc.length ? Math.max(...mc.map((p) => Math.abs(Math.log(p.mu / frailtyHazard(a, b, s2, p.x)))) ) : 0 };
          t.setView([0, 4], [0, Math.min(6, Math.max(1.2, 1.15 * Math.max(g1.pdf(Math.max(0.05, (shape - 1) * (1 / rate1))), 1)))]);
        });
        v.legend([['muted', 'baseline $\\mu_0$', { dash: true }], ['accent', 'cohort hazard'], ['gold', 'simulation'], ['red', '$b/\\sigma^2$', { dash: true }]]);
        v.readout(() => `$\\sigma^2 = ${v.fix(info.s2, 2)}$: asymptote $b/\\sigma^2 = ${v.fix(info.plateau, 3)}$ per year; simulation vs formula: largest log-ratio ${v.fix(info.maxdev, 3)}\nat age ${info.x0}: baseline ${v.fix(info.base, 4)}, cohort ${v.fix(info.mu, 4)}; ${v.fix(100 * info.surv, 1)}% alive, mean frailty of survivors $= ${v.fix(info.mean, 3)}$ (birth: 1)`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.4
    {
      num: '3.4',
      kind: 'Phenomenon',
      name: 'Late-life mortality plateau (debated)',
      statement: String.raw`Does the human death rate keep rising geometrically at the very oldest ages, or does it level off? Analyses of high-quality records of people aged 105 and over (for example the Italian data of Barbi and colleagues, 2018) report that the hazard stops rising and is roughly constant after about age 105; others (for example Newman, 2018) argue that age misreporting and data errors can create apparent plateaus, and the question remains **contested**. Biologically the two shapes are not exclusive: a plateau is what frailty selection predicts (3.3) even when each individual ages exponentially.`,
      idea: String.raw`Above 105 almost nobody is left, so every estimate rests on a few hundred or thousand deaths and the confidence intervals are wide; both a Gompertz continuation and a constant hazard can pass through them. The evidence is therefore a matter of statistical power and data validation, not of one decisive observation. The picture below is a **simulation, not the Italian data**: it draws a cohort from a chosen truth and asks whether a Gompertz or a plateau model is preferred by likelihood.`,
      caption: String.raw`A synthetic cohort enters age 105 with the size you set (log slider). Choose the true hazard shape; the error bars are 95% intervals for each year of age; the lines are maximum-likelihood fits of a Gompertz hazard (two parameters) and a constant hazard (one parameter). Make the cohort bigger and the wrong model is eventually rejected; with a few hundred people, nothing is. "Resample" draws a new cohort.`,
      deps: ['demo-3.3'],
      refs: ['PHG ch. 9'],
      tags: ['extreme ageing', 'plateau', 'statistics'],
      scope: String.raw`Simulation of Poisson-type data from three assumed truths (Gompertz with $\alpha=0.09$, a plateau at 0.5 per year, and a gamma-frailty hazard bending from 0.5 toward 0.75); no real supercentenarian records are drawn. Barbi et al. and Newman are cited for the existence of the debate; their data and conclusions are not reproduced.`,
      links: { doi: 'https://doi.org/10.1126/science.aat3119' },
      viz(v) {
        const tr = v.select('true hazard', [{ value: 'g', label: 'Gompertz continues' }, { value: 'p', label: 'plateau' }, { value: 'f', label: 'frailty (bends)' }], 'p');
        const n0 = v.slider('cohort size at 105', 200, 300000, 4000, { log: true, sig: 2, int: true });
        let seed = 3;
        v.button('Resample', () => { seed++; });
        const s = v.stage({ x: [105, 116], y: [0, 1.6], axes: 'box', gutter: true, xlabel: 'age', ylabel: 'hazard, per year', height: 360, title: 'Estimated hazard above 105' });
        const t = v.stage({ x: [105, 116], y: [0, 1], axes: 'box', gutter: true, xlabel: 'age', ylabel: 'survivors / entering', height: 360, title: 'Survivors' });
        const mu0 = 0.5, al = 0.09;
        // frailty truth: gamma-frailty hazard starting at 0.5 at 105, bending toward the limit al/0.12 = 0.75
        const truth = { g: (x) => mu0 * Math.exp(al * (x - 105)), p: () => mu0, f: (x) => frailtyHazard(mu0, al, 0.12, x - 105) };
        const hz = (x) => truth[tr.value](x);
        let R = null, key = '', D = null;
        v.render(() => {
          const k = tr.value + n0.value + ':' + seed;
          if (k !== key) {
            const r = v.rng(seed * 1009 + 7), ages = [], dead = [], PY = [];
            let n = n0.value;
            for (let x = 105; x < 116; x++) {
              const mbar = v.M.integrate(hz, x, x + 1, 20), q = 1 - Math.exp(-mbar);
              let d;
              if (n > 400) { const mean = n * q, sd = Math.sqrt(n * q * (1 - q)); d = Math.round(clamp(mean + sd * r.normal(), 0, n)); } else { d = 0; for (let i = 0; i < n; i++) if (r() < q) d++; }
              ages.push(x); dead.push(d); PY.push(n - d / 2); n -= d;
            }
            D = { ages, dead, PY, N: n0.value }; key = k;
          }
          const rate = D.dead.map((d, i) => d / Math.max(D.PY[i], 1e-9));
          const ll = (f) => sum(D.ages.map((x, i) => { const m = Math.max(f(x), 1e-9); return D.dead[i] * Math.log(m * D.PY[i]) - m * D.PY[i]; }));
          const dTot = sum(D.dead), pyTot = sum(D.PY), cP = dTot / pyTot;
          const fg = v.M.nelderMead((p) => -ll((x) => Math.exp(p[0] + p[1] * (x - 105))), [Math.log(Math.max(cP, 1e-3)), 0.05], { step: [0.3, 0.05], tol: 1e-12, maxIt: 500 });
          const llG = -fg.fx, llP = ll(() => cP), aicG = 4 - 2 * llG, aicP = 2 - 2 * llP;
          const eb = D.ages.map((x, i) => { const d = D.dead[i], p = Math.max(D.PY[i], 1e-9), se = Math.sqrt(d + 1) / p; return [Math.max(0, (d - 1.96 * Math.sqrt(d + 1)) / p), (d + 1.96 * Math.sqrt(d + 1)) / p]; });
          s.setView([105, 116], [0, Math.min(3, Math.max(1.6, 1.15 * Math.max(...eb.map((e) => e[1]))))]);
          s.fn(hz, { domain: [105, 116], color: 'muted', dash: true, width: 2 });
          s.fn((x) => Math.exp(fg.x[0] + fg.x[1] * (x - 105)), { domain: [105, 116], color: 'orange', width: 2.5 });
          s.hline(cP, { color: 'green', width: 2.5 });
          D.ages.forEach((x, i) => { s.segment([x + 0.5, eb[i][0]], [x + 0.5, eb[i][1]], { color: 'accent', width: 2 }); s.dot(x + 0.5, rate[i], { r: 4, color: 'accent' }); });
          let surv = D.N; const sv = [[105, 1]]; D.dead.forEach((d, i) => { surv -= d; sv.push([106 + i, surv / D.N]); });
          t.path(sv, { color: 'accent', width: 2.5 }); t.dots(sv, { r: 3, color: 'accent' });
          R = { dTot, aicG, aicP, alpha: fg.x[1], cP, n: D.N, left: surv };
        });
        v.legend([['accent', 'estimate with 95% interval'], ['muted', 'truth', { dash: true }], ['orange', 'Gompertz fit'], ['green', 'constant-hazard fit']]);
        v.readout(() => { const d = R.aicP - R.aicG; return `${int(R.n)} entering, ${int(R.dTot)} deaths recorded; fitted Gompertz slope $\\alpha=${v.fix(R.alpha, 3)}$ (truth: ${tr.value === 'g' ? '0.090' : tr.value === 'p' ? 'none' : 'bending'}); constant hazard $= ${v.fix(R.cP, 3)}$\nAIC(constant) − AIC(Gompertz) $= ${v.fix(d, 1)}$: ${Math.abs(d) < 2 ? 'the data cannot tell the two apart' : d > 0 ? 'the Gompertz continuation is preferred' : 'the plateau is preferred'}`; });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.5
    {
      num: '3.5',
      kind: 'Method',
      name: 'Model life tables and the Brass logit system',
      statement: String.raw`Let $\ell(x)$ be survivorship (the fraction of a birth cohort alive at exact age $x$) and define its **logit** $Y(x)=\tfrac12\ln\dfrac{1-\ell(x)}{\ell(x)}$. Brass observed that the logits of two life tables are nearly linearly related, $Y(x)\approx\alpha+\beta\,Y_s(x)$, where $Y_s$ is that of a chosen **standard** table. The pair $(\alpha,\beta)$ describes a whole schedule: $\alpha$ shifts the level of mortality, $\beta$ changes its slope across ages (the balance between child and adult mortality). A full life table is recovered as $\ell(x)=1/(1+e^{2(\alpha+\beta Y_s(x))})$, so a handful of data points can fix a complete table.`,
      idea: String.raw`The logit stretches the two ends of the survival curve, where $\ell$ is close to 1 or 0, so that proportional changes in the hazard at all ages become roughly additive shifts, and curves of similar shape differ by a line. This makes $(\alpha,\beta)$ estimable by ordinary least squares and the standard a free choice. Life tables of 2.3 supply $\ell(x)$.`,
      caption: String.raw`Pick a standard and a target life table (country and year, UN estimates, both sexes). Left: the target's logits against the standard's at ages 1, 5, …, 95, with the least-squares line $\alpha+\beta Y_s$ and the identity (dashed). Right: survivorship of the target, the standard, and the model; the sliders override $\alpha$ and $\beta$ so you can see what each does to the curve.`,
      deps: ['demo-2.3'],
      refs: ['PHG ch. 9'],
      tags: ['model life tables', 'logit'],
      scope: String.raw`An empirical device that works well when the target's age pattern resembles the standard's; fit and reconstruction degrade for patterns very different from the standard (for example high adult mortality from epidemics or war).`,
      credit: 'William Brass, 1971',
      viz(v) {
        const sc = v.select('standard', cOpts(CTRY), 'SWE');
        const sy = v.slider('standard year', 0, LTY.length - 1, 4, { int: true, fmt: (i) => String(LTY[Math.round(i)]) });
        const tc = v.select('target', cOpts(CTRY), 'MEX');
        const ty = v.slider('target year', 0, LTY.length - 1, 4, { int: true, fmt: (i) => String(LTY[Math.round(i)]) });
        const sa = v.slider('$\\alpha$', -1.5, 1.5, 0, { step: 0.005 });
        const sb = v.slider('$\\beta$', 0.4, 1.6, 1, { step: 0.005 });
        let fitNow = { a: 0, b: 1 };
        v.button('least-squares $(\\alpha,\\beta)$', () => { sa.set(Math.round(fitNow.a * 200) / 200); sb.set(Math.round(fitNow.b * 200) / 200); });
        const s = v.stage({ x: [-3, 3], y: [-3, 3], axes: 'box', gutter: true, xlabel: 'standard logit $Y_s(x)$', ylabel: 'target logit $Y(x)$', height: 360, equal: true, title: 'Logit against logit' });
        const t = v.stage({ x: [0, 100], y: [0, 1], axes: 'box', gutter: true, xlabel: 'age', ylabel: 'survivorship $\\ell(x)$', height: 360, title: 'The target and its model' });
        let R = null, first = true;
        const Y = (l) => 0.5 * Math.log((1 - l) / l);
        v.render(() => {
          const ls = lxOf(sc.value, LTY[sy.value]).map((x) => x / 1e5), lt = lxOf(tc.value, LTY[ty.value]).map((x) => x / 1e5);
          const idx = []; for (let i = 1; i <= 20; i++) idx.push(i);
          const xs = idx.map((i) => Y(ls[i])), ys = idx.map((i) => Y(lt[i]));
          const f = line(xs, ys); fitNow = { a: f.a, b: f.b };
          if (first) { first = false; sa.set(Math.round(f.a * 200) / 200); sb.set(Math.round(f.b * 200) / 200); }
          const al = sa.value, be = sb.value;
          s.line(-3, -3, 3, 3, { color: 'muted', dash: true });
          s.line(-3, al - 3 * be, 3, al + 3 * be, { color: 'orange', width: 2.5 });
          idx.forEach((i, j) => s.dot(xs[j], ys[j], { r: 4, color: 'accent' }));
          const model = (i) => 1 / (1 + Math.exp(2 * (al + be * Y(ls[i]))));
          const mp = [[0, 1]], tp = [[0, 1]], sp = [[0, 1]];
          for (let i = 1; i <= 20; i++) { mp.push([AGE22[i], model(i)]); tp.push([AGE22[i], lt[i]]); sp.push([AGE22[i], ls[i]]); }
          t.path(sp, { color: 'muted', dash: true, width: 2 });
          t.path(mp, { color: 'orange', width: 2.8 });
          t.dots(tp, { r: 3.5, color: 'accent' });
          const area = (arr) => { let a = 0; for (let i = 0; i < 20; i++) a += ((arr[i] + arr[i + 1]) / 2) * NS22[i]; return a; };
          const mm = [1]; for (let i = 1; i <= 20; i++) mm.push(model(i));
          let rms = 0; for (let i = 1; i <= 20; i++) rms += (model(i) - lt[i]) ** 2; rms = Math.sqrt(rms / 20);
          R = { f, al, be, aT: area(lt.slice(0, 21)), aM: area(mm), aS: area(ls.slice(0, 21)), rms };
        });
        v.legend([['accent', 'target data'], ['muted', 'standard', { dash: true }], ['orange', 'model $\\alpha+\\beta Y_s$']]);
        v.readout(() => `least squares: $\\alpha=${v.fix(R.f.a, 3)}$, $\\beta=${v.fix(R.f.b, 3)}$, $R^2=${v.fix(R.f.r2, 4)}$; shown: $\\alpha=${v.fix(R.al, 3)}$, $\\beta=${v.fix(R.be, 3)}$\nyears lived below 100: target ${v.fix(R.aT, 1)}, model ${v.fix(R.aM, 1)}, standard ${v.fix(R.aS, 1)}; root-mean-square error of $\\ell$: ${v.fix(R.rms, 4)}`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.6
    {
      num: '3.6',
      kind: 'Model',
      name: 'Lee–Carter mortality forecasting',
      statement: String.raw`Write the log death rate at age $x$ in year $t$ as
$$\ln m_{x,t}=a_x+b_x\,k_t+\varepsilon_{x,t},\qquad \sum_x b_x=1,\ \ \sum_t k_t=0 .$$
Here $a_x$ is the average age profile, $k_t$ a single **mortality index** for the year and $b_x$ how strongly each age responds to it. The parameters are the leading term of the singular value decomposition of the matrix of centred log rates. To forecast, $k_t$ is modelled as a random walk with drift, $k_{t+1}=k_t+\delta+\eta_t$, and projected rates $\hat m_{x,t}=\exp(a_x+b_x\hat k_t)$ give forecasts of life expectancy with an interval.`,
      idea: String.raw`Mortality in the last half-century has fallen at every age in nearly the same proportional way, so a single factor already summarizes most of the variation in the matrix of log rates; the rank-one approximation of the singular value decomposition is the best least-squares fit with that structure. The index falls almost on a line, so a random walk with the estimated drift is the simplest forecast, and the rates are pushed through the life table of 2.3 to give life expectancy. The original method also re-estimates $k_t$ so that fitted deaths equal observed deaths; that step is omitted here.`,
      caption: String.raw`UN death rates (both sexes, 22 age groups) for one country. Left: observed log rates in the year you choose, the average profile $a_x$ and the Lee–Carter fit. Middle: the age pattern $b_x$ (where the decline was fastest). Right: the index $k_t$ with its straight drift line and a projected 80% and 95% range of the random walk. Slide the horizon and the year.`,
      deps: ['demo-3.1'],
      refs: ['K&C: Projection and Forecasting'],
      tags: ['forecasting', 'SVD', 'time series'],
      scope: String.raw`The interval shown reflects only the random-walk innovations of $k_t$, not uncertainty in $a_x$, $b_x$ or the drift, so it is narrower than a full Lee–Carter interval. A single factor suits periods of steady decline; in countries with mortality reversals or age-specific shifts the residuals are large.`,
      credit: 'Ronald D. Lee and Lawrence R. Carter, 1992',
      links: { doi: 'https://doi.org/10.1080/01621459.1992.10475265' },
      viz(v) {
        const co = v.select('country', cOpts(LC_CTRY), 'JPN');
        const yr = v.slider('year shown', 1950, 2023, 2023, { int: true });
        const hz = v.slider('forecast horizon (years)', 0, 50, 27, { int: true });
        const s = v.stage({ x: [0, 105], y: [-10, 0], axes: 'box', gutter: true, xlabel: 'age', ylabel: '$\\ln m_x$', height: 340, title: 'Age profile and fit' });
        const b = v.stage({ x: [0, 105], y: [0, 0.2], axes: 'box', gutter: true, xlabel: 'age', ylabel: '$b_x$', height: 340, title: 'Response by age' });
        const kk = v.stage({ x: [1950, 2075], y: [-1, 1], axes: 'box', gutter: true, xlabel: 'year', ylabel: '$k_t$', height: 340, title: 'Mortality index' });
        let cache = null, R = null;
        const fit = (c) => {
          if (cache && cache.c === c) return cache;
          const Z = []; for (let y = 1950; y <= 2023; y++) Z.push(mxOf(c, y).map(Math.log));
          const lc = leeCarter(Z), dr = drift(lc.k);
          return (cache = { c, Z, lc, dr });
        };
        v.render(() => {
          const F = fit(co.value), { lc, dr, Z } = F, T = 74, ti = yr.value - 1950, h = hz.value;
          const ymin = Math.floor(Math.min(...Z[ti]) - 0.5);
          s.setView([0, 105], [ymin, 0]);
          s.path(lc.a.map((a, i) => [MID22[i], a]), { color: 'muted', dash: true, width: 2 });
          s.path(lc.a.map((a, i) => [MID22[i], a + lc.b[i] * lc.k[ti]]), { color: 'orange', width: 2.8 });
          s.dots(Z[ti].map((z, i) => [MID22[i], z]), { r: 4, color: 'accent' });
          const bm = Math.max(...lc.b) * 1.2;
          b.setView([0, 105], [Math.min(0, Math.min(...lc.b) * 1.2), bm]);
          lc.b.forEach((bx, i) => { const w = i === 0 ? 1 : i === 1 ? 4 : i === 21 ? 5 : 5, x0 = AGE22[i]; b.rect(x0 + 0.3, 0, x0 + w - 0.3, bx, { fill: 'purple', fillAlpha: 0.5, color: 'purple' }); });
          b.hline(0, { color: 'muted' });
          const kmin = Math.min(...lc.k), kmax = Math.max(...lc.k), kT = lc.k[T - 1];
          const span = (kmax - kmin) * 0.5 + Math.abs(dr.mu) * 52 * 0.6 + 1;
          kk.setView([1950, 2075], [Math.min(kmin, kT + dr.mu * 52) - span * 0.35, kmax + span * 0.2]);
          const band = (z) => { const up = [], dn = []; for (let j = 0; j <= h; j++) { const m = kT + dr.mu * j, w = z * dr.sd * Math.sqrt(j); up.push([2023 + j, m + w]); dn.push([2023 + j, m - w]); } return up.concat(dn.reverse()); };
          if (h > 0) { kk.poly(band(1.96), { fill: 'orange', fillAlpha: 0.12, stroke: false }); kk.poly(band(1.2816), { fill: 'orange', fillAlpha: 0.2, stroke: false }); }
          kk.path(lc.k.map((k, i) => [1950 + i, k]), { color: 'accent', width: 2.5 });
          kk.line(1950, kT - dr.mu * (T - 1), 2023 + h, kT + dr.mu * h, { color: 'orange', dash: true, width: 2 });
          kk.dot(yr.value, lc.k[ti], { r: 5, color: 'gold' });
          const e0 = (k) => lt22(lc.a.map((a, i) => Math.exp(a + lc.b[i] * k))).e0;
          const obs = lt22(mxOf(co.value, 2023)).e0;
          R = { share: lc.share, mu: dr.mu, sd: dr.sd, e0fit: e0(kT), obs, e0f: e0(kT + dr.mu * h), h, yrs: 2023 + h, lo: Math.min(e0(kT + dr.mu * h - 1.2816 * dr.sd * Math.sqrt(h)), e0(kT + dr.mu * h + 1.2816 * dr.sd * Math.sqrt(h))), hi: Math.max(e0(kT + dr.mu * h - 1.2816 * dr.sd * Math.sqrt(h)), e0(kT + dr.mu * h + 1.2816 * dr.sd * Math.sqrt(h))) };
        });
        v.legend([['accent', 'observed'], ['muted', '$a_x$', { dash: true }], ['orange', 'fit $a_x + b_x k_t$'], ['purple', '$b_x$']]);
        v.readout(() => `${CNAME[co.value]}: the first component explains ${v.fix(100 * R.share, 1)}% of the variance of centred log rates; drift of $k_t$ $= ${v.fix(R.mu, 3)}$ per year, standard deviation of steps ${v.fix(R.sd, 3)}\n$e_0$ 2023: observed (this table) ${v.fix(R.obs, 1)}, from the fitted index ${v.fix(R.e0fit, 1)}; forecast for ${R.yrs}: ${v.fix(R.e0f, 1)} (80% range ${v.fix(R.lo, 1)}–${v.fix(R.hi, 1)})`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.7
    {
      num: '3.7',
      kind: 'Phenomenon',
      name: 'Record life expectancy rises linearly (Oeppen–Vaupel)',
      statement: String.raw`The highest national life expectancy at birth in each year (the "best-practice" or record value) has increased almost on a straight line for about 160 years. Oeppen and Vaupel (2002) found, for the record female life expectancy since 1840, a linear trend of slope 0.243 years per year (about three months per year) and a slightly lower slope of 0.222 for men. The record has been held in turn by different countries (Sweden, Norway, New Zealand, Iceland, Japan, and others), and every published ceiling on life expectancy was exceeded, usually within a few years of publication.`,
      idea: String.raw`The linearity belongs to the frontier, not to any one country: countries lag, catch up and overtake, and the record passes between them, so the envelope is smoother than any single trajectory (look at the individual national lines). Declines in mortality at successive ages (infections first, later cardiovascular disease and old-age mortality) have kept the envelope moving at a similar speed. This is why forecasters who treated one country's recent slowdown as a ceiling were repeatedly wrong. Life expectancy is the area under the survival curve (2.4) and the period and cohort versions differ (2.7); the record is a period measure.`,
      caption: String.raw`Gold: the highest both-sexes life expectancy among countries of at least one million people, each year since 1840 (Our World in Data compilation of Human Mortality Database, Zijdeman et al. and UN data). Drag the two sliders to refit the line to any window and extrapolate; orange marks the female-only UN record since 1950. Switch on a country to see it fall behind the frontier. Choose one of the published limits to see where it sits.`,
      deps: ['demo-2.7'],
      refs: ['PHG ch. 3'],
      tags: ['life expectancy', 'forecasting', 'frontier'],
      scope: String.raw`This reconstruction uses both-sexes values from the Our World in Data compilation for countries and territories of at least one million inhabitants (record holders include Hong Kong in recent years); the 0.243 and 0.222 slopes quoted from Oeppen and Vaupel refer to their own female and male record series (a different data set and period), which are not reproduced here. The published limits are quoted from a table by Vaupel and von Kistowski (Ageing Horizons, issue 3, Oxford Institute of Ageing) derived from the Oeppen–Vaupel supplements.`,
      credit: 'Jim Oeppen and James W. Vaupel, 2002',
      links: { doi: 'https://doi.org/10.1126/science.1069675' },
      viz(v) {
        const LIM = [
          { who: 'Dublin', pub: 1928, lim: 64.75, ex: 1922, sx: 'f+m' }, { who: 'Dublin & Lotka', pub: 1936, lim: 69.93, ex: 1941, sx: 'f+m' },
          { who: 'Dublin', pub: 1941, lim: 70.8, ex: 1946, sx: 'f+m' }, { who: 'Wunsch', pub: 1970, lim: 76.8, ex: 1967, sx: 'f' },
          { who: 'Frejka', pub: 1981, lim: 77.5, ex: 1972, sx: 'f' }, { who: 'Siegel', pub: 1980, lim: 79.4, ex: 1976, sx: 'f+m' },
          { who: 'Bourgeois-Pichat', pub: 1978, lim: 80.3, ex: 1985, sx: 'f' }, { who: 'Demeny', pub: 1984, lim: 82.5, ex: 1993, sx: 'f' },
          { who: 'United Nations', pub: 1989, lim: 82.5, ex: 1993, sx: 'f' }, { who: 'Fries', pub: 1980, lim: 85, ex: 1985, sx: 'f+m' },
          { who: 'Olshansky et al.', pub: 1990, lim: 85, ex: 1996, sx: 'f+m' },
        ];
        const lo = v.slider('fit from year', 1840, 1990, 1840, { int: true });
        const hi = v.slider('fit to year', 1900, 2023, 2023, { int: true });
        const ext = v.slider('extrapolate to', 2023, 2100, 2060, { int: true });
        const ct = v.select('compare with', [{ value: 'none', label: 'no country' }, { value: 'Sweden', label: 'Sweden' }, { value: 'Japan', label: 'Japan' }, { value: 'United States', label: 'USA' }, { value: 'France', label: 'France' }], 'none');
        const lm = v.slider('published limit (0 = none)', 0, LIM.length, 0, { int: true, fmt: (i) => (Math.round(i) === 0 ? 'none' : `${LIM[Math.round(i) - 1].who} ${LIM[Math.round(i) - 1].pub}`) });
        const fem = v.toggle('female record since 1950', true);
        const s = v.stage({ x: [1840, 2100], y: [40, 100], axes: 'box', gutter: true, xlabel: 'year', ylabel: 'life expectancy at birth', height: 400, title: 'The record life expectancy' });
        let R = null;
        const yrs = REC_BOTH.map((_, i) => 1840 + i);
        v.render(() => {
          const a = lo.value, b = Math.max(hi.value, a + 20);
          const xs = yrs.filter((y) => y >= a && y <= b), ys = xs.map((y) => REC_BOTH[y - 1840]), f = line(xs, ys);
          s.fn((x) => f.a + f.b * x, { domain: [a, ext.value], color: 'accent', width: 2.4, dash: false });
          s.fn((x) => f.a + f.b * x, { domain: [Math.max(b, 2023), ext.value], color: 'accent', dash: true, width: 2.4 });
          if (ct.value !== 'none') { const tr = TRAJ[ct.value]; s.path(tr.map((e, i) => (e == null ? null : [1840 + i, e])), { color: 'purple', width: 2 }); }
          s.path(yrs.map((y, i) => [y, REC_BOTH[i]]), { color: 'gold', width: 3 });
          if (fem.value) s.path(REC_FEM.map((e, i) => [1950 + i, e]), { color: 'orange', width: 2.5 });
          const sel = lm.value - 1;
          LIM.forEach((l, i) => { if (sel < 0 || i === sel) { s.hline(l.lim, { color: 'red', alpha: sel < 0 ? 0.0 : 0.6, dash: true }); if (sel < 0) { s.segment([Math.min(l.pub, l.ex), l.lim], [Math.max(l.pub, l.ex), l.lim], { color: l.sx === 'f' ? 'purple' : 'red', width: 2 }); } s.dot(l.pub, l.lim, { r: 5, color: 'red', hollow: true }); s.dot(l.ex, l.lim, { r: 5, color: 'green' }); } });
          let sx = null;
          if (sel >= 0) {
            const l = LIM[sel], first = (arr, y0) => { const j = arr.findIndex((e) => e >= l.lim); return j < 0 ? null : y0 + j; };
            sx = { l, both: first(REC_BOTH, 1840), fem: first(REC_FEM, 1950) };
          }
          R = { f, a, b, sx, pred: f.a + f.b * ext.value };
        });
        v.legend([['gold', 'record, both sexes'], ['accent', 'linear fit'], ['orange', 'female record (UN)'], ['purple', 'a country'], ['red', 'limit published', { dot: true }], ['green', 'limit exceeded (table)', { dot: true }]]);
        v.readout(() => `fit ${R.a}–${R.b}: slope $${v.fix(R.f.b, 3)}$ years per year $= ${v.fix(12 * R.f.b, 1)}$ months per year, $r^2=${v.fix(R.f.r2, 4)}$; extrapolated record in ${ext.value}: ${v.fix(R.pred, 1)}\n${R.sx ? `${R.sx.l.who} (${R.sx.l.pub}) set a ceiling of ${v.fix(R.sx.l.lim, R.sx.l.lim % 1 ? 2 : 0)} (${R.sx.l.sx === 'f' ? 'females' : 'both sexes'}); table: exceeded in ${R.sx.l.ex}. In this reconstruction the both-sexes record first reaches it in ${R.sx.both || 'not yet'}, the female UN record in ${R.sx.fem || (R.sx.l.lim < 74 ? 'before 1950 (not shown)' : 'not yet')}.` : 'Choose a published limit to compare.'}`);
      },
    },
  ],
};
