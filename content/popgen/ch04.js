// Population Genetics & Evolution — Chapter 4: Natural selection
import { clamp, memo, binom, selStep, wbarD, dwbarD, dpSel, intEq, selPath, hapStep, logit, expit, lsq, SEL_PRESETS } from './ch04.shared.js';

const SQ3 = Math.sqrt(3) / 2;
const toXY = (p) => [p[1] + p[2] / 2, p[2] * SQ3];
const toP = (x, y) => { const p3 = y / SQ3, p2 = x - p3 / 2; return [1 - p2 - p3, p2, p3]; };
const clampSimplex = (x, y) => {
  let p = toP(x, y).map((z) => Math.max(z, 0)); const s = p[0] + p[1] + p[2] || 1; p = p.map((z) => z / s); return toXY(p);
};
const GENO = ['AA', 'Aa', 'aa'];

export default {
  collection: 'popgen',
  chapter: 4,
  title: 'Natural selection',
  summary: String.raw`Differences in survival and reproduction change allele frequencies predictably. One-locus selection models show how dominance governs the speed of spread, how heterozygote advantage maintains polymorphism and underdominance destroys it, and why mean fitness climbs an adaptive landscape. Frequency dependence and fluctuating environments break the simple picture, and classic cases — the peppered moth, sickle-cell, resistance evolution — show selection operating in real time.`,
  items: [
    // ───────────────────────────────────────────────────────────── 4.1
    {
      num: '4.1',
      kind: 'Definition',
      name: 'Fitness: absolute and relative, viability and fertility',
      statement: String.raw`The **absolute fitness** $W_i$ of a genotype $i$ is its expected contribution of offspring (gene copies) to the next generation per individual of that genotype at birth: $W_i = v_i\,f_i$, the product of the probability $v_i$ of surviving to reproduce (**viability**) and the expected number $f_i$ of offspring produced by a survivor (**fertility**, or fecundity). Only ratios matter for changes in allele frequency, so one works with **relative fitness** $w_i = W_i/W_{\rm ref}$, where the reference is the best genotype ($w_{\max}=1$) or the population mean ($\bar w=1$). Multiplying every $W_i$ by the same constant changes nothing in the dynamics of gene frequencies.`,
      idea: String.raw`Follow a cohort of newborn zygotes in Hardy–Weinberg proportions (1.5): each genotype is thinned by its viability, and the survivors then leave offspring in proportion to their fertility. The numbers of offspring contributed by the three genotypes give the genotype-specific gene copies passed on, and the allele frequency in the next generation is just their $A$-fraction: $p'=(2n_{AA}+n_{Aa})/2\sum n_i$. Because the same $p'$ results from $v_if_i$ in any grouping, viability and fertility selection are interchangeable for a single locus with random mating, and rescaling all fitnesses cancels in the ratio. Relative fitness is therefore the quantity that selection acts on; absolute fitness also governs population growth (see 4.14).`,
      caption: String.raw`Set the allele frequency, the survival probabilities $v$ and the fertilities $f$ of the three genotypes. **Left**: per 100 newborns, the zygotes (grey), the survivors (orange) and the offspring they contribute (blue). **Right**: the relative fitnesses, normalised to the best genotype or to the population mean. Slide “all fertilities ×” up and down: the absolute fitnesses change, the relative fitnesses and the new allele frequency do not.`,
      deps: ['popgen-1.1'],
      refs: ['Gillespie', 'Orr 2009, Nat. Rev. Genet. 10: 531–539'],
      scope: String.raw`One locus, discrete non-overlapping generations, random mating, no frequency dependence. Fitness is a property of a genotype in a given environment, not of an individual or a species; the “offspring” counted are gene copies transmitted, so fertility effects of the two sexes would need a separate bookkeeping.`,
      tags: ['fitness', 'selection'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Fitness_(biology)' },
      viz(v) {
        const pS = v.slider('allele frequency $p$ of $A$', 0.02, 0.98, 0.4, { step: 0.01 });
        const vs = [['AA', 0.9], ['Aa', 0.8], ['aa', 0.5]].map(([g, x]) => v.slider(`viability $v_{${g}}$`, 0.05, 1, x, { step: 0.01 }));
        const fs = [['AA', 2], ['Aa', 2], ['aa', 2.4]].map(([g, x]) => v.slider(`fertility $f_{${g}}$`, 0.2, 5, x, { step: 0.05 }));
        const mult = v.slider('all fertilities ×', 0.25, 4, 1, { log: true, sig: 2 });
        const norm = v.select('normalise relative fitness to', [{ value: 'best', label: 'best genotype' }, { value: 'mean', label: 'population mean' }], 'best');
        const L = v.stage({ x: [0, 10.2], y: [0, 100], axes: 'box', gutter: true, height: 330, ylabel: 'per 100 newborn zygotes', title: 'Following a cohort', weight: 1.4, minWidth: 320, xticks: [[1.6, 'AA'], [5, 'Aa'], [8.4, 'aa']] });
        const R = v.stage({ x: [0, 3], y: [0, 1.4], axes: 'box', gutter: true, height: 330, ylabel: 'relative fitness $w$', title: 'Relative fitness', weight: 0.9, minWidth: 240, xticks: [[0.5, 'AA'], [1.5, 'Aa'], [2.5, 'aa']] });
        let info = {};
        v.render(() => {
          const p = pS.value, q = 1 - p, fr = [p * p, 2 * p * q, q * q];
          const z = fr.map((x) => 100 * x), ad = z.map((x, i) => x * vs[i].value), off = ad.map((x, i) => x * fs[i].value * mult.value);
          const W = vs.map((s, i) => s.value * fs[i].value * mult.value);
          const Wbar = fr.reduce((s, x, i) => s + x * W[i], 0), ref = norm.value === 'best' ? Math.max(...W) : Wbar;
          const w = W.map((x) => x / ref);
          const top = Math.max(100 * Math.max(...fr), ...off) * 1.18;
          L.setView([0, 10.2], [0, top]);
          for (let g = 0; g < 3; g++) {
            const b = g * 3.4 + 0.1;
            [[z[g], 'muted'], [ad[g], 'orange'], [off[g], 'accent']].forEach(([h, c], k) => {
              L.rect(b + k * 1.05, 0, b + k * 1.05 + 0.95, h, { fill: c, fillAlpha: 0.55, color: c });
              L.text(v.fix(h, h < 10 ? 1 : 0), b + k * 1.05 + 0.475, h, { size: 11, dy: -9, color: 'ink', align: 'center' });
            });
          }
          const wt = Math.max(1.4, ...w) * 1.15;
          R.setView([0, 3], [0, wt]);
          w.forEach((x, g) => {
            R.rect(g + 0.15, 0, g + 0.85, x, { fill: 'accent', fillAlpha: 0.5, color: 'accent' });
            R.text(`w = ${v.fix(x, 2)}`, g + 0.5, x, { size: 12, dy: -20, align: 'center', color: 'ink' });
            R.text(`W = ${v.fix(W[g], 2)}`, g + 0.5, x, { size: 11, dy: -7, align: 'center', color: 'muted' });
          });
          R.hline(1, { color: 'muted', dash: true, width: 1 });
          const pn = (2 * off[0] + off[1]) / (2 * (off[0] + off[1] + off[2]));
          info = { p, pn, chk: selStep(p, W), W, w, Wbar };
        });
        v.legend([['muted', 'zygotes', { area: true }], ['orange', 'survivors (× viability)', { area: true }], ['accent', 'offspring contributed (× fertility)', { area: true }]]);
        v.readout(() => `Absolute fitnesses $W=v\\,f$: AA ${v.fix(info.W[0], 2)}, Aa ${v.fix(info.W[1], 2)}, aa ${v.fix(info.W[2], 2)}; mean $\\bar W=${v.fix(info.Wbar, 2)}$.\nNext generation: $p'=(2n_{AA}+n_{Aa})/2\\sum n=${v.fix(info.pn, 5)}$ from the cohort count; from the fitness formula ${v.fix(info.chk, 5)} — the same, whatever the scale of $W$. Change in $p$: ${v.fix(info.pn - info.p, 4)}.`);
      },
    },

    // ───────────────────────────────────────────────────────────── 4.2
    {
      num: '4.2',
      kind: 'Model',
      name: 'Haploid selection',
      statement: String.raw`In a large haploid population (or for gametic selection), let allele $A$ have relative fitness $1+s$ and the alternative allele $a$ fitness $1$. The frequency of $A$ changes by
$$p_{t+1}=\frac{(1+s)\,p_t}{1+s\,p_t},\qquad\text{equivalently}\qquad \frac{p_{t+1}}{1-p_{t+1}}=(1+s)\,\frac{p_t}{1-p_t},$$
so the **odds** grow by the factor $1+s$ every generation and $p_t=\dfrac{p_0(1+s)^t}{1-p_0+p_0(1+s)^t}$, a logistic curve. The log-odds $\ln\frac{p_t}{1-p_t}$ is a straight line in $t$ of slope $\ln(1+s)\approx s$. For $s>0$ the allele fixes; for $s<0$ it is lost.`,
      idea: String.raw`After selection the number of $A$ copies is multiplied by $1+s$ and the number of $a$ copies by $1$, so the *ratio* of the two simply gets the factor $1+s$ each generation, with no dependence on frequency; that is a geometric sequence, and writing it back as a frequency gives the logistic form. In continuous time the same model is $\dot p=s\,p(1-p)$, exactly the logistic growth equation (mathbio-1.4) with the allele's “carrying capacity” being the whole population. The sweep takes about $\frac1s\ln\frac{1}{p_0}$ generations from a rare start to near fixation, so even $s=1\%$ needs a few hundred generations.`,
      caption: String.raw`Choose the selection coefficient $s$ and the starting frequency $p_0$. **Left**: $p_t$ (blue) is an S-shaped curve. **Right**: the same data as log-odds, a straight line (blue) whose slope is read off by regression and compared with $\ln(1+s)$. Switch on **drift** to run a finite Wright–Fisher population of $N$ haploid copies with the same selection (gold): the log-odds line becomes a random walk about the line, and fixation or loss ends the run. Rare alleles are lost by chance even when $s>0$ (see 6.2).`,
      deps: ['popgen-4.1', 'mathbio-1.4'],
      refs: ['Gillespie'],
      credit: 'Haldane, 1924 (deterministic selection theory)',
      scope: String.raw`Infinite population unless “drift” is on; constant, frequency-independent fitnesses; haploid or gametic selection. The diploid case adds a dominance parameter (4.3, 4.6).`,
      tags: ['selection', 'haploid', 'logistic'],
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Selection_coefficient' },
      viz(v) {
        const sS = v.slider('selection coefficient $s$', 0.01, 0.5, 0.1, { step: 0.005 });
        const p0S = v.slider('start frequency $p_0$', 0.001, 0.5, 0.02, { log: true, sig: 2 });
        const drift = v.toggle('add genetic drift', false);
        const NS = v.slider('population size $N$ (haploid copies)', 20, 5000, 400, { log: true, int: true });
        let seed = 1;
        v.button('New population', () => { seed++; });
        const L = v.stage({ x: [0, 100], y: [0, 1], axes: 'box', gutter: true, height: 320, xlabel: 'generation $t$', ylabel: 'frequency of $A$', title: 'Frequency of the favoured allele', minWidth: 280 });
        const R = v.stage({ x: [0, 100], y: [-8, 8], axes: 'box', gutter: true, height: 320, xlabel: 'generation $t$', ylabel: 'log-odds $\\ln\\frac{p}{1-p}$', title: 'Log-odds are linear in time', minWidth: 280 });
        const sim = memo();
        let info = {};
        v.render(() => {
          const s = sS.value, p0 = p0S.value, lr = Math.log1p(s);
          const T = Math.ceil((1.15 * (logit(0.997) - logit(p0))) / lr);
          L.setView([0, T], [0, 1]); R.setView([0, T], [-8, 8]);
          const pt = []; let p = p0; let dmax = 0;
          for (let t = 0; t <= T; t++) { pt.push(p); dmax = Math.max(dmax, Math.abs(p - expit(logit(p0) + t * lr))); p = hapStep(p, s); }
          L.path(pt.map((x, t) => [t, x]), { color: 'accent', width: 2.6 });
          R.path(pt.map((x, t) => [t, logit(clamp(x, 1e-9, 1 - 1e-9))]), { color: 'accent', width: 2.6 });
          const xs = [], ys = [];
          pt.forEach((x, t) => { if (x > 0.002 && x < 0.998) { xs.push(t); ys.push(logit(x)); } });
          let slope = lr, extra = '';
          if (drift.value) {
            const N = Math.round(NS.value);
            const S = sim(`${s}|${p0}|${N}|${seed}|${T}`, () => {
              const r = v.rng(seed * 977 + 3), path = [p0]; let k = Math.max(1, Math.round(p0 * N));
              for (let t = 1; t <= T; t++) { if (k > 0 && k < N) k = binom(r, N, hapStep(k / N, s)); path.push(k / N); }
              return path;
            });
            L.path(S.map((x, t) => [t, x]), { color: 'gold', width: 2 });
            const sx = [], sy = [];
            S.forEach((x, t) => { if (x > 0 && x < 1) { sx.push(t); sy.push(logit(x)); } });
            R.path(sx.map((t, i) => [t, sy[i]]), { color: 'gold', width: 1.8 });
            if (sx.length > 3) { const fit = lsq(sx, sy); slope = fit.slope !== undefined ? fit.slope : fit[0]; }
            const end = S[S.length - 1];
            extra = ` Drift run ($N=${N}$): ${end >= 1 ? 'A fixed' : end <= 0 ? 'A was lost' : 'A still segregating'}; fitted log-odds slope ${v.fix(slope, 4)}.`;
          } else if (xs.length > 3) { const fit = lsq(xs, ys); slope = fit.slope !== undefined ? fit.slope : fit[0]; }
          const half = (logit(0.5) - logit(p0)) / lr;
          info = { s, lr, slope, dmax, half, extra, T };
        });
        v.legend([['accent', 'deterministic $p_t$'], ['gold', 'finite population with drift']]);
        v.readout(() => `Predicted log-odds slope $\\ln(1+s)=${v.fix(info.lr, 4)}$ (≈ $s=${v.fix(info.s, 3)}$); fitted slope ${v.fix(info.slope, 4)}. Iterating the recursion differs from the logistic closed form by at most $${v.sci(Math.max(info.dmax, 1e-17), 2)}$. Frequency reaches ½ after $\\ln\\frac{1-p_0}{p_0}/\\ln(1+s)=${v.fix(info.half, 1)}$ generations.${info.extra}`);
      },
    },

    // ───────────────────────────────────────────────────────────── 4.3
    {
      num: '4.3',
      kind: 'Model',
      name: 'Diploid selection at one locus',
      statement: String.raw`Let a diploid population mate at random, and let the genotypes $AA$, $Aa$, $aa$ have viabilities (relative fitnesses) $w_{AA}$, $w_{Aa}$, $w_{aa}$. With $p$ the frequency of $A$, $q=1-p$, the marginal fitnesses of the alleles are $w_A=pw_{AA}+qw_{Aa}$ and $w_a=pw_{Aa}+qw_{aa}$, the mean fitness is $\bar w=pw_A+qw_a$, and
$$p'=\frac{p\,w_A}{\bar w},\qquad \Delta p=p'-p=\frac{pq\,(w_A-w_a)}{\bar w}.$$
The equilibria are $p=0$, $p=1$ and, if it lies in $(0,1)$, $\hat p=\dfrac{w_{Aa}-w_{aa}}{2w_{Aa}-w_{AA}-w_{aa}}$. Which of them attract depends on the order of the three fitnesses.`,
      idea: String.raw`Random mating at zygote formation (1.5) puts genotypes in proportions $p^2,2pq,q^2$; each is weighted by its fitness (4.1), and an $A$ copy sits in an $AA$ individual with probability $p$ and in an $Aa$ with probability $q$, which gives $w_A$. Dividing the weighted $A$ copies by the total weight gives $p'$. The difference $w_A-w_a$ is linear in $p$, so $\Delta p$ is a cubic with zeros at $0$, $1$ and $\hat p$; its sign between the zeros decides stability (mathbio-1.5). The special cases of the next items — directional, overdominant, underdominant — differ only in where the three fitnesses sit.`,
      caption: String.raw`Set the three genotype fitnesses with the sliders or choose a preset. **Left**: the change per generation $\Delta p$ against $p$; where the curve is above zero $p$ moves right. Equilibria are circles: filled green when stable, hollow red when unstable. Drag the gold handle (the start $p_0$ on the axis) and watch **right**: the iterated trajectory $p_t$ runs to a stable equilibrium.`,
      deps: ['popgen-4.1', 'popgen-1.5'],
      refs: ['Ewens §1.4', 'Gillespie'],
      scope: String.raw`Large population (no drift), random mating, constant genotype fitnesses acting through viability, discrete generations. Selection weak or strong are both allowed; Δp is exact for this model.`,
      tags: ['selection', 'diploid', 'equilibrium'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Selection_coefficient' },
      viz(v) {
        let ws;
        const pre = v.select('preset', SEL_PRESETS.map((x) => ({ value: x.value, label: x.label })), 'over', { onChange: (val) => { const w = SEL_PRESETS.find((x) => x.value === val).w; ws.forEach((s, i) => s.set(w[i])); } });
        ws = [['AA', 0.9], ['Aa', 1.0], ['aa', 0.8]].map(([g, x]) => v.slider(`$w_{${g}}$`, 0.5, 1.5, x, { step: 0.01 }));
        const L = v.stage({ x: [0, 1], y: [-0.05, 0.05], axes: 'box', gutter: true, height: 320, xlabel: 'frequency $p$ of $A$', ylabel: 'change per generation $\\Delta p$', title: 'Δp as a function of p', minWidth: 280 });
        const R = v.stage({ x: [0, 60], y: [0, 1], axes: 'box', gutter: true, height: 320, xlabel: 'generation', ylabel: 'frequency of $A$', title: 'The trajectory', minWidth: 280 });
        const h = L.handle(0.15, 0, { color: 'gold', r: 8, label: 'p₀', labelPos: 'n', constrain: (x) => [clamp(x, 0.005, 0.995), 0] });
        let info = {};
        v.render(() => {
          const w = ws.map((s) => s.value), ph = intEq(w);
          let m = 0.02; for (let i = 0; i <= 200; i++) m = Math.max(m, Math.abs(dpSel(i / 200, w)));
          L.setView([0, 1], [-1.2 * m, 1.2 * m]);
          L.hline(0, { color: 'muted', width: 1 });
          L.fn((x) => dpSel(x, w), { color: 'accent', width: 2.8 });
          const eqs = [0, ph, 1].filter((x) => x !== null && x !== undefined);
          const stab = (x) => { const e = 1e-4, a = dpSel(clamp(x - e, 0, 1), w), b = dpSel(clamp(x + e, 0, 1), w); return x === 0 ? b < 0 : x === 1 ? a > 0 : a > 0 && b < 0; };
          eqs.forEach((x) => L.dot(x, 0, { r: 6.5, hollow: !stab(x), color: stab(x) ? 'green' : 'red' }));
          if (ph !== null) L.text(`p̂ = ${v.fix(ph, 3)}`, ph, 0, { dy: 20, size: 12, align: 'center' });
          const path = selPath(h.x, w, 60);
          R.path(Array.from(path, (x, t) => [t, x]), { color: 'accent', width: 2.6 });
          R.dots(Array.from(path, (x, t) => [t, x]).filter((_, t) => t % 3 === 0), { r: 2.5, color: 'gold' });
          if (ph !== null) R.hline(ph, { color: ph !== null && stab(ph) ? 'green' : 'red', dash: true, width: 1.5 });
          const order = w[1] > Math.max(w[0], w[2]) ? 'heterozygote advantage (overdominance)' : w[1] < Math.min(w[0], w[2]) ? 'heterozygote disadvantage (underdominance)' : 'directional selection (the heterozygote lies between the homozygotes)';
          info = { ph, p60: path[60], order, w };
        });
        v.legend([['accent', '$\\Delta p(p)$ and $p_t$'], ['green', 'stable equilibrium'], ['red', 'unstable equilibrium']]);
        v.readout(() => `Fitnesses ${info.w.map((x) => v.fix(x, 2)).join(' : ')} — ${info.order}.\n${info.ph === null ? 'No interior equilibrium: $p$ goes to 0 or 1.' : `Interior equilibrium $\\hat p=(w_{Aa}-w_{aa})/(2w_{Aa}-w_{AA}-w_{aa})=${v.fix(info.ph, 4)}$.`} After 60 generations from $p_0$: $p=${v.fix(info.p60, 4)}$.`);
      },
    },

    // ───────────────────────────────────────────────────────────── 4.4
    {
      num: '4.4',
      kind: 'Theorem',
      name: 'Wright’s formula: Δp = (pq/2w̄)·dw̄/dp',
      statement: String.raw`For constant viability selection at one locus with two alleles, random mating, and genotype fitnesses $w_{AA},w_{Aa},w_{aa}$, the mean fitness is $\bar w(p)=p^2w_{AA}+2pq\,w_{Aa}+q^2w_{aa}$ and the exact change in the frequency of $A$ in one generation is
$$\Delta p=\frac{p\,q}{2\bar w}\,\frac{d\bar w}{dp}.$$
So $\Delta p$ has the sign of the slope of $\bar w$: allele frequency always moves uphill on the mean-fitness curve, and equilibria are exactly the points where the curve is flat (or the boundaries $p=0,1$).`,
      idea: String.raw`Differentiate the mean fitness: $\frac{d\bar w}{dp}=2\left[p(w_{AA}-w_{Aa})+q(w_{Aa}-w_{aa})\right]=2(w_A-w_a)$, because $w_A-w_a=p(w_{AA}-w_{Aa})+q(w_{Aa}-w_{aa})$. Substituting into the formula $\Delta p=pq(w_A-w_a)/\bar w$ of 4.3 gives the claim. Its meaning is geometric: $pq/\bar w$ is a positive “mobility” factor, so the dynamics are a (weighted) gradient ascent of $\bar w$ in the single variable $p$. Wright used this form to picture selection as climbing an adaptive landscape (4.10); the same gradient form fails in general when fitnesses depend on frequency (4.11).`,
      caption: String.raw`**Left**: the mean-fitness curve $\bar w(p)$ with its tangent at the gold handle (drag it) and the next 25 generations as gold dots climbing the curve. **Right**: $\Delta p$ computed directly from the recursion (blue) and from Wright’s formula (green, dashed) — they coincide to rounding error for any fitnesses you set. Presets show a rise to the boundary, a hill with a peak inside (heterozygote advantage) and a valley (heterozygote disadvantage).`,
      deps: ['popgen-4.3'],
      refs: ['Ewens §1.4'],
      credit: 'Sewall Wright, 1930s (formula usually cited to Wright 1937)',
      scope: String.raw`Exact for constant genotype fitnesses with two alleles and random mating. With several alleles the vector version holds with the metric $p_i(\delta_{ij}-p_j)$ (4.5); with frequency-dependent fitness the factor $\bar w$ is no longer a function whose slope drives the change.`,
      tags: ['selection', 'adaptive landscape', 'gradient'],
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Fitness_landscape' },
      viz(v) {
        let ws;
        const pre = v.select('preset', SEL_PRESETS.map((x) => ({ value: x.value, label: x.label })), 'over', { onChange: (val) => { const w = SEL_PRESETS.find((x) => x.value === val).w; ws.forEach((s, i) => s.set(w[i])); } });
        ws = [['AA', 0.9], ['Aa', 1.0], ['aa', 0.8]].map(([g, x]) => v.slider(`$w_{${g}}$`, 0.5, 1.5, x, { step: 0.01 }));
        const L = v.stage({ x: [0, 1], y: [0.5, 1.5], axes: 'box', gutter: true, height: 320, xlabel: 'frequency $p$ of $A$', ylabel: 'mean fitness $\\bar w$', title: 'Mean fitness w̄(p)', minWidth: 280 });
        const R = v.stage({ x: [0, 1], y: [-0.05, 0.05], axes: 'box', gutter: true, height: 320, xlabel: 'frequency $p$ of $A$', ylabel: 'change per generation $\\Delta p$', title: 'Direct recursion vs Wright’s formula', minWidth: 280 });
        const h = L.handle(0.3, 0.9, { color: 'gold', r: 8, label: 'p', labelPos: 's', constrain: (x) => [clamp(x, 0.01, 0.99), 0.9] });
        let info = {};
        v.render(() => {
          const w = ws.map((s) => s.value), lo = Math.min(...w), hi = Math.max(...w, wbarD(0.5, w));
          L.setView([0, 1], [lo - 0.08 * (hi - lo) - 0.02, hi + 0.12 * (hi - lo) + 0.02]);
          L.fn((x) => wbarD(x, w), { color: 'accent', width: 2.8 });
          const p = h.x, y0 = wbarD(p, w), sl = dwbarD(p, w);
          h.set(p, y0);
          L.clip(() => L.line(p - 0.25, y0 - 0.25 * sl, p + 0.25, y0 + 0.25 * sl, { color: 'orange', width: 2 }));
          const path = selPath(p, w, 25);
          L.dots(Array.from(path, (x) => [x, wbarD(x, w)]), { r: 3, color: 'gold' });
          let m = 0.02, err = 0;
          for (let i = 0; i <= 200; i++) { const x = i / 200; m = Math.max(m, Math.abs(dpSel(x, w))); err = Math.max(err, Math.abs(dpSel(x, w) - (x * (1 - x) * dwbarD(x, w)) / (2 * wbarD(x, w)))); }
          R.setView([0, 1], [-1.2 * m, 1.2 * m]);
          R.hline(0, { color: 'muted', width: 1 });
          R.fn((x) => dpSel(x, w), { color: 'accent', width: 3 });
          R.fn((x) => (x * (1 - x) * dwbarD(x, w)) / (2 * wbarD(x, w)), { color: 'green', width: 2, dash: true });
          R.dot(p, dpSel(p, w), { r: 6, color: 'gold' });
          info = { p, dp: dpSel(p, w), wf: (p * (1 - p) * sl) / (2 * y0), sl, err, wb: y0, up: path[25] > p ? 'right' : path[25] < p ? 'left' : 'nowhere' };
        });
        v.legend([['accent', '$\\bar w(p)$ and direct $\\Delta p$'], ['orange', 'tangent'], ['green', 'Wright’s formula', { dash: true }], ['gold', 'next 25 generations']]);
        v.readout(() => `At $p=${v.fix(info.p, 3)}$: $\\bar w=${v.fix(info.wb, 4)}$, slope $d\\bar w/dp=${v.fix(info.sl, 4)}$ → Wright: $\\Delta p=${v.fix(info.wf, 6)}$; recursion: $\\Delta p=${v.fix(info.dp, 6)}$.\nThe slope is ${info.sl > 0 ? 'positive' : info.sl < 0 ? 'negative' : 'zero'} and $p$ moves ${info.up} — uphill. Largest disagreement over 201 values of $p$: $${v.sci(Math.max(info.err, 1e-17), 2)}$.`);
      },
    },

    // ───────────────────────────────────────────────────────────── 4.5
    {
      num: '4.5',
      kind: 'Theorem',
      name: 'Mean fitness increases under constant viability selection',
      statement: String.raw`Consider one autosomal locus with $k$ alleles $A_1,\dots,A_k$ at frequencies $p_i$, random mating, and constant genotype fitnesses $w_{ij}=w_{ji}$. Let $w_i=\sum_j w_{ij}p_j$ and $\bar w=\sum_{i,j}w_{ij}p_ip_j$. After one generation of viability selection, $p_i'=p_iw_i/\bar w$, and
$$\bar w(\mathbf p')\;\ge\;\bar w(\mathbf p),$$
with equality only at an equilibrium. Hence the mean fitness is a Lyapunov function: it never decreases from one generation to the next, and the frequencies converge to the set of equilibria.`,
      idea: String.raw`For two alleles this is Wright’s formula (4.4): $\Delta p$ always has the sign of $d\bar w/dp$. For $k$ alleles the update $p_i\mapsto p_iw_i/\bar w$ is a map on the simplex built from the homogeneous quadratic $\bar w$ with non-negative coefficients; it is a special case of the Baum–Eagon inequality for such polynomials (Baum and Eagon, 1967), and was proved directly for the genetical problem by Mulholland and Smith (1959) and by Scheuer and Mandel (1959), and for the general case by Kingman (1961). The idea is to compare $\bar w(\mathbf p')=\sum_{ij}w_{ij}p_ip_jw_iw_j/\bar w^2$ with $\bar w$ by an arithmetic–geometric-mean style (Jensen-type) inequality applied to the weights $p_ip_jw_{ij}$.`,
      caption: String.raw`The triangle is the space of frequencies of three alleles (corners = fixed for one allele); colour is the mean fitness $\bar w$ (light = low, saturated = high). Drag the gold handle to choose a start; the path runs uphill in $\bar w$ to a peak at a corner or inside. **Right**: $\bar w$ against generation never decreases. Choose a fitness matrix or draw a random one. Then switch on **fitnesses depend on frequency**: the genotypes now play a cyclic game, the guarantee is gone, and $\bar w$ rises and falls.`,
      deps: ['popgen-4.4'],
      refs: ['Ewens §2.9'],
      credit: 'Mulholland & Smith, 1959; Scheuer & Mandel, 1959; Kingman, 1961',
      scope: String.raw`Constant genotype fitnesses (symmetric matrix, as for any diploid), viability selection, random mating, one locus, any number of alleles, large population. It fails for frequency-dependent fitnesses and for several loci with recombination (8.5); the multi-allele inequality was first proved by Mulholland–Smith and Scheuer–Mandel, with the sharper general statement by Kingman (1961). Fisher’s “fundamental theorem” is a different statement about the *rate* of increase (9.6).`,
      tags: ['selection', 'mean fitness', 'Lyapunov'],
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Fisher%27s_fundamental_theorem_of_natural_selection' },
      viz(v) {
        const PRE = {
          het: { name: 'all heterozygotes fitter than homozygotes', W: [[0.85, 1.0, 0.9], [1.0, 0.75, 1.1], [0.9, 1.1, 0.8]] },
          dir: { name: 'a single fittest allele', W: [[1.0, 1.05, 1.1], [1.05, 1.1, 1.15], [1.1, 1.15, 1.25]] },
          under: { name: 'three stable corners (underdominance)', W: [[1.0, 0.8, 0.8], [0.8, 1.0, 0.8], [0.8, 0.8, 1.0]] },
          mixed: { name: 'corner peak and an interior peak', W: [[1.2, 1.0, 0.8], [1.0, 0.7, 1.1], [0.8, 1.1, 1.0]] },
        };
        const pre = v.select('fitness matrix', [...Object.entries(PRE).map(([k, x]) => ({ value: k, label: x.name })), { value: 'rand', label: 'random' }], 'het');
        const fd = v.toggle('fitnesses depend on frequency (breaks the hypothesis)', false);
        let seed = 1;
        v.button('New random matrix', () => { seed++; pre.set('rand'); });
        const L = v.stage({ x: [-0.1, 1.1], y: [-0.1, 1.0], equal: true, axes: false, height: 340, title: 'Frequency simplex of three alleles', minWidth: 300 });
        const R = v.stage({ x: [0, 100], y: [0.7, 1.3], axes: 'box', gutter: true, height: 340, xlabel: 'generation', ylabel: 'mean fitness $\\bar w$', title: 'Mean fitness along the path', minWidth: 260 });
        const CYC = [[1.0, 1.4, 0.6], [0.7, 1.0, 1.5], [1.4, 0.6, 1.0]];
        const start = L.handle(0.5, 0.3, { color: 'gold', r: 8, label: 'start', labelPos: 'n', constrain: (x, y) => clampSimplex(x, y) });
        const rast = memo();
        const matrix = () => {
          if (pre.value !== 'rand') return PRE[pre.value].W;
          const r = v.rng(seed * 31 + 7), W = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
          for (let i = 0; i < 3; i++) for (let j = i; j < 3; j++) W[i][j] = W[j][i] = 0.7 + 0.6 * r();
          return W;
        };
        const T = 100;
        let info = {};
        v.render(() => {
          const W = matrix(), freqDep = fd.value, A = freqDep ? CYC : W;
          const wi = (p) => A.map((row) => row[0] * p[0] + row[1] * p[1] + row[2] * p[2]);
          const wb = (p) => { const w = wi(p); return p[0] * w[0] + p[1] * w[1] + p[2] * w[2]; };
          const step = (p) => { const w = wi(p), b = p[0] * w[0] + p[1] * w[1] + p[2] * w[2]; return [p[0] * w[0] / b, p[1] * w[1] / b, p[2] * w[2] / b]; };
          let lo = Infinity, hi = -Infinity;
          for (let i = 0; i <= 24; i++) for (let j = 0; j <= 24 - i; j++) { const b = wb([i / 24, j / 24, (24 - i - j) / 24]); lo = Math.min(lo, b); hi = Math.max(hi, b); }
          const key = `${pre.value}|${seed}|${freqDep}`;
          L.raster((x, y) => {
            const p = toP(x, y); if (p[0] < -1e-9 || p[1] < -1e-9 || p[2] < -1e-9) return null;
            return [...v.ramp((wb(p) - lo) / (hi - lo + 1e-9), 'accent', 'panel')];
          }, { res: 3, key: `${key}|${Math.round(lo * 1e4)}` });
          L.poly([[0, 0], [1, 0], [0.5, SQ3]], { color: 'ink', fill: false, width: 1.6 });
          L.tex('A_1', -0.05, -0.04, { size: 15 }); L.tex('A_2', 1.05, -0.04, { size: 15 }); L.tex('A_3', 0.5, SQ3 + 0.05, { size: 15 });
          let p = toP(start.x, start.y).map((z) => Math.max(0, z)); const sm = p[0] + p[1] + p[2]; p = p.map((z) => z / sm);
          const pts = [], wbs = []; let drops = 0, minD = Infinity;
          for (let t = 0; t <= T; t++) { pts.push(toXY(p)); wbs.push(wb(p)); if (t > 0) { const d = wbs[t] - wbs[t - 1]; minD = Math.min(minD, d); if (d < -1e-12) drops++; } p = step(p); }
          L.path(pts, { color: 'ink', width: 2 });
          L.dots(pts.filter((_, t) => t % 5 === 0), { r: 2.8, color: 'gold' });
          L.dot(pts[T][0], pts[T][1], { r: 6, color: 'green' });
          const a = Math.min(...wbs), b = Math.max(...wbs), pad = Math.max(0.02, (b - a) * 0.2);
          R.setView([0, T], [a - pad, b + pad]);
          R.path(wbs.map((y, t) => [t, y]), { color: 'accent', width: 2.6 });
          R.dots(wbs.map((y, t) => [t, y]).filter((_, t) => t % 5 === 0), { r: 3, color: 'gold' });
          info = { drops, minD, w0: wbs[0], wT: wbs[T], freqDep };
        });
        v.legend([['accent', 'mean fitness $\\bar w$'], ['gold', 'every 5th generation'], ['green', 'state after 100 generations']]);
        v.readout(() => `Mean fitness: ${v.fix(info.w0, 4)} at the start → ${v.fix(info.wT, 4)} after 100 generations.\n${info.freqDep ? `With frequency-dependent fitnesses, $\\bar w$ fell in ${info.drops} of 100 generations (largest single drop ${v.fix(-Math.min(info.minD, 0), 4)}) — the theorem needs constant fitnesses.` : `$\\bar w$ fell in ${info.drops} of 100 generations; the smallest change was $${v.sci(Math.max(info.minD, 1e-16), 2)}\\ge0$, as the theorem says.`}`);
      },
    },
  ],
};
