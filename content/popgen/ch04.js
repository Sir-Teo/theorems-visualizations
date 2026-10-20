// Population Genetics & Evolution — Chapter 4: Natural selection
import { clamp, memo, binom, selStep, wbarD, dwbarD, dpSel, intEq, selPath, hapStep, logit, expit, lsq, SEL_PRESETS } from './ch04.shared.js';

import { logOdds, haploidFrequency, haploidDrift, selectionStep } from './source-audit-selection.shared.js';

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
      idea: String.raw`Follow a cohort of newborn zygotes in Hardy–Weinberg proportions (1.5): each genotype is thinned by its viability, and the survivors then leave offspring in proportion to their fertility. The numbers of offspring contributed by the three genotypes give the genotype-specific gene copies passed on, and the allele frequency in the next generation is just their $A$-fraction: $p'=(2n_{AA}+n_{Aa})/2\sum n_i$. For genotype-specific fertility contributions that factor by parent, this bookkeeping combines viability and fertility into $v_if_i$, and rescaling all fitnesses cancels in the ratio. General mating-pair fertility or sex-specific contributions need a larger model; random mating alone does not make them interchangeable. Relative fitness is therefore the quantity that selection acts on; absolute fitness also governs population growth (see 4.14).`,
      caption: String.raw`Set the allele frequency, the survival probabilities $v$ and the fertilities $f$ of the three genotypes. **Left**: per 100 newborns, the zygotes (grey), the survivors (orange) and the offspring they contribute (blue). **Right**: the relative fitnesses, normalised to the best genotype or to the population mean. Slide “all fertilities ×” up and down: the absolute fitnesses change, the relative fitnesses and the new allele frequency do not.`,
      deps: ['popgen-1.1'],
      refs: ['Bürger, Elementary Population Genetics, §4.2 pp. 12–13 (multiplicative-fertility restriction): https://homepage.univie.ac.at/Reinhard.Buerger/biovo_skript.pdf', 'Gillespie', 'Orr 2009, Nat. Rev. Genet. 10: 531–539'],
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
      statement: String.raw`In deterministic haploid selection, let the two alleles have constant fitnesses $1+s$ and 1, with $s>-1$. Then $$p_{t+1}=\frac{(1+s)p_t}{1+sp_t},\qquad \operatorname{logit}p_t=\operatorname{logit}p_0+t\ln(1+s)$$ for $0<p_0<1$, or $p_t=p_0(1+s)^t/[1-p_0+p_0(1+s)^t]$. The interior frequency tends to 1 for $s>0$, to 0 for $-1<s<0$, and stays constant for $s=0$. The boundary states remain fixed. Fixation here is a limit, not necessarily a finite-generation event.`,
      idea: String.raw`Selection multiplies the odds by $1+s$ each generation. Taking logarithms gives the exact slope $\ln(1+s)$. Interpolating this exact solution continuously gives $\dot p=\ln(1+s)p(1-p)$; replacing the rate by $s$ is a weak-selection approximation. Between two interior target frequencies the exact interpolated time is $[\operatorname{logit}(p_1)-\operatorname{logit}(p_0)]/\ln(1+s)$, and the first discrete generation crossing a target is obtained by rounding up when the direction allows it.

For an interior frequency and positive constant relative fitness, the odds are positive. The logarithm product identity pma-8.6 turns their generation-by-generation multiplication into addition of $\log(1+s)$. Thus the slope is exact for this recurrence; replacing that logarithm by s is a separate weak-selection approximation, and a boundary frequency has no finite log-odds.`,
      caption: String.raw`Vary selection through negative, zero and positive values. Frequency and log-odds show the same deterministic trajectory. Optional Wright–Fisher sampling rounds the requested start to an integer count out of $N$ copies; its actual initial frequency is reported, including a zero count. Absorbed endpoints have no finite log-odds and are omitted from that panel, rather than clipped to artificial values. The finite stochastic fit is descriptive and may be unavailable.`,
      deps: ['popgen-4.1','mathbio-1.4','pma-8.6'],
      refs: ['Bürger, Elementary Population Genetics, §4.1 Eqs. (4.1)–(4.2), pp. 11–12: https://homepage.univie.ac.at/Reinhard.Buerger/biovo_skript.pdf', 'Felsenstein, Theoretical Evolutionary Genetics (December 2019), §II.6 pp. 70–74 Eqs. (II-71)–(II-80): https://felsenst.github.io/pgbook/pgbook.pdf'],
      credit: 'Deterministic presentation and exact timing follow the cited author treatments; finite Wright–Fisher sampling is a separate illustration.',
      scope: String.raw`Infinite population unless “drift” is on; constant, frequency-independent fitnesses; haploid or gametic selection. The diploid case adds a dominance parameter (4.3, 4.6).`,
      tags: ['selection', 'haploid', 'logistic'],
      verify: false,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Selection_coefficient' },
      viz(v) {
        const sS=v.slider('selection coefficient $s$',-.5,.5,.1,{step:.01});
        const p0S=v.slider('requested start frequency $p_0$',.001,.999,.02,{log:true,sig:2});
        const drift=v.toggle('add genetic drift',false),NS=v.slider('haploid gene copies $N$',20,5000,400,{log:true,int:true});
        let seed=1;v.button('New population',()=>{seed++;});
        const L=v.stage({x:[0,100],y:[0,1],axes:'box',gutter:true,height:320,xlabel:'generation',ylabel:'frequency of A',title:'Deterministic selection and optional finite sampling'});
        const R=v.stage({x:[0,100],y:[-8,8],axes:'box',gutter:true,height:320,xlabel:'generation',ylabel:'finite log-odds',title:'Exact deterministic slope and stochastic interior states'});
        const sim=memo();let info;
        v.render(()=>{
          const s=sS.value,p0=p0S.value,rate=Math.log1p(s),z0=logOdds(p0),target=rate>=0?logOdds(.997):logOdds(.003),T=rate===0?200:Math.max(20,Math.ceil(1.05*Math.abs(target-z0)/Math.abs(rate)));
          const states=[],zs=[];let p=p0,err=0;for(let t=0;t<=T;t++){states.push([t,p]);zs.push([t,z0+t*rate]);err=Math.max(err,Math.abs(p-haploidFrequency(p0,s,t)));p=hapStep(p,s);}
          let D=null,interior=[],fit=null;
          if(drift.value){const N=Math.round(NS.value);D=sim(`${s}|${p0}|${N}|${seed}|${T}`,()=>haploidDrift(v.rng(seed*977+3),binom,N,p0,s,T));interior=D.path.map((p,t)=>[t,p]).filter(p=>p[1]>0&&p[1]<1).map(([t,p])=>[t,logOdds(p)]);if(interior.length>1)fit=lsq(interior.map(p=>p[0]),interior.map(p=>p[1])).slope;}
          const all=[...zs,...interior].map(p=>p[1]),lo=Math.min(...all),hi=Math.max(...all),pad=Math.max(1,(hi-lo)*.1);
          L.setView([0,T],[0,1]);R.setView([0,T],[lo-pad,hi+pad]);L.path(states,{color:'accent',width:2.5});R.path(zs,{color:'accent',width:2.5});
          if(D){L.path(D.path.map((p,t)=>[t,p]),{color:'gold',width:1.8});R.path(interior,{color:'gold',width:1.8});}
          info={s,rate,err,D,fit,T,N:Math.round(NS.value)};
        });
        v.legend([['accent','deterministic frequency / exact log-odds'],['gold','one finite population']]);
        v.readout(()=>{if(!info)return '';const {s,rate,err,D,fit,T,N}=info;
          return `Exact deterministic log-odds slope ${v.fix(rate,5)} per generation (selection coefficient ${v.fix(s,3)}); recursion/closed-form maximum difference $${v.sci(err,3)}$ over ${T} generations. ${s===0?'Neutral deterministic frequencies stay constant.':s>0?'Interior deterministic frequencies approach one.':'Interior deterministic frequencies approach zero.'}`+(D?`\nFinite population starts from ${D.initial}/${N} copies = ${v.fix(D.initial/N,5)}, after rounding the requested frequency. Final state ${D.path.at(-1)===0?'A absent':D.path.at(-1)===1?'A fixed':'segregating'}; fitted interior log-odds slope ${fit===null?'unavailable (fewer than two interior states)':v.fix(fit,5)}. Absorbed endpoints are omitted from the log-odds panel.`:'');});
      },
    },

    // ───────────────────────────────────────────────────────────── 4.3
    {
      num: '4.3',
      kind: 'Model',
      name: 'Diploid selection at one locus',
      statement: String.raw`Let a diploid population mate at random, and let the genotypes $AA$, $Aa$, $aa$ have strictly positive viabilities (relative fitnesses) $w_{AA}$, $w_{Aa}$, $w_{aa}$. With $p$ the frequency of $A$, $q=1-p$, the marginal fitnesses of the alleles are $w_A=pw_{AA}+qw_{Aa}$ and $w_a=pw_{Aa}+qw_{aa}$, the mean fitness is $\bar w=pw_A+qw_a$, and
$$p'=\frac{p\,w_A}{\bar w},\qquad \Delta p=p'-p=\frac{pq\,(w_A-w_a)}{\bar w}.$$
The equilibria are $p=0$, $p=1$ and, if it lies in $(0,1)$, $\hat p=\dfrac{w_{Aa}-w_{aa}}{2w_{Aa}-w_{AA}-w_{aa}}$. Which of them attract depends on the order of the three fitnesses.`,
      idea: String.raw`Random mating at zygote formation (1.5) puts genotypes in proportions $p^2,2pq,q^2$; each is weighted by its fitness (4.1), and an $A$ copy sits in an $AA$ individual with probability $p$ and in an $Aa$ with probability $q$, which gives $w_A$. Dividing the weighted $A$ copies by the total weight gives $p'$. The difference $w_A-w_a$ is linear in $p$, so the **numerator** of $\Delta p$ has degree at most three; the change itself is a rational function with positive denominator for the displayed fitnesses. Its zeros and the sign between them determine the direction of motion; nonoscillatory convergence also needs the size of the discrete step to be controlled. The special cases of the next items — directional, overdominant, underdominant — differ only in where the three fitnesses sit.`,
      caption: String.raw`Set the three genotype fitnesses with the sliders or choose a preset. **Left**: the change per generation $\Delta p$ against $p$; where the curve is above zero $p$ moves right. Equilibria are circles: filled green when stable, hollow red when unstable. Drag the gold handle (the start $p_0$ on the axis) and watch **right**: the iterated trajectory $p_t$ runs to a stable equilibrium.`,
      deps: ['popgen-4.1', 'popgen-1.5'],
      refs: ['Bürger, Elementary Population Genetics, §§4.2–4.3 pp. 12–15: https://homepage.univie.ac.at/Reinhard.Buerger/biovo_skript.pdf'],
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
          const w = ws.map((s) => s.value), ph = intEq(w), neutral=w.every(x=>Math.abs(x-w[0])<1e-12);
          let m = 0.02; for (let i = 0; i <= 200; i++) m = Math.max(m, Math.abs(dpSel(i / 200, w)));
          L.setView([0, 1], [-1.2 * m, 1.2 * m]);
          L.hline(0, { color: 'muted', width: 1 });
          L.fn((x) => dpSel(x, w), { color: 'accent', width: 2.8 });
          const eqs = neutral?[]:[0, ph, 1].filter((x) => x !== null && x !== undefined);
          if(neutral)L.text('every frequency is stationary',.5,m*.6,{color:'muted',align:'center',size:12});
          const stab = (x) => { const e = 1e-4, a = dpSel(clamp(x - e, 0, 1), w), b = dpSel(clamp(x + e, 0, 1), w); return x === 0 ? b < 0 : x === 1 ? a > 0 : a > 0 && b < 0; };
          eqs.forEach((x) => L.dot(x, 0, { r: 6.5, hollow: !stab(x), color: stab(x) ? 'green' : 'red' }));
          if (ph !== null) L.text(`p̂ = ${v.fix(ph, 3)}`, ph, 0, { dy: 20, size: 12, align: 'center' });
          const path = selPath(h.x, w, 60);
          R.path(Array.from(path, (x, t) => [t, x]), { color: 'accent', width: 2.6 });
          R.dots(Array.from(path, (x, t) => [t, x]).filter((_, t) => t % 3 === 0), { r: 2.5, color: 'gold' });
          if (ph !== null) R.hline(ph, { color: ph !== null && stab(ph) ? 'green' : 'red', dash: true, width: 1.5 });
          const order = neutral?'neutral (equal genotype fitnesses)':w[1] > Math.max(w[0], w[2]) ? 'heterozygote advantage (overdominance)' : w[1] < Math.min(w[0], w[2]) ? 'heterozygote disadvantage (underdominance)' : 'directional selection (the heterozygote lies between the homozygotes)';
          info = { ph, p60: path[60], order, w, neutral };
        });
        v.legend([['accent', '$\\Delta p(p)$ and $p_t$'], ['green', 'stable equilibrium'], ['red', 'unstable equilibrium']]);
        v.readout(() => `Fitnesses ${info.w.map((x) => v.fix(x, 2)).join(' : ')} — ${info.order}.\n${info.neutral?'Every frequency is an equilibrium; the trajectory stays at its start.':info.ph === null ? 'No isolated interior equilibrium: an interior start tends toward a boundary.' : `Interior equilibrium $\\hat p=(w_{Aa}-w_{aa})/(2w_{Aa}-w_{AA}-w_{aa})=${v.fix(info.ph, 4)}$.`} After 60 generations from $p_0$: $p=${v.fix(info.p60, 4)}$.`);
      },
    },

    // ───────────────────────────────────────────────────────────── 4.4
    {
      num: '4.4',
      kind: 'Theorem',
      name: 'Wright’s formula: Δp = (pq/2w̄)·dw̄/dp',
      statement: String.raw`For one autosomal locus with two alleles, random mating, constant symmetric nonnegative genotype viabilities and positive mean fitness, $$\bar w=p^2w_{AA}+2p(1-p)w_{Aa}+(1-p)^2w_{aa},\qquad \Delta p=\frac{p(1-p)}{2\bar w}\frac{d\bar w}{dp}.$$ At an interior state, the frequency change has the sign of this derivative. Interior equilibria are the stationary points of the curve; available boundary states are also equilibria when their mean fitness is positive.`,
      idea: String.raw`Differentiation gives $d\bar w/dp=2(w_A-w_a)$, so the identity follows directly from $\Delta p=p(1-p)(w_A-w_a)/\bar w$. It specifies the direction of a discrete step. By itself that sign does not rule out overshooting a peak; monotonic mean fitness is the additional one-locus result of 4.5. For constant fitnesses the frequency map has this gradient form; frequency-dependent allele fitnesses generally add derivative terms that invalidate it.

The sum and product derivative rules pma-5.3 differentiate the quadratic mean fitness with the genotype viabilities held constant and $q=1-p$. Collecting terms gives $d\bar w/dp=2(w_A-w_a)$; positive mean fitness permits its substitution into the frequency-change ratio. This identity fixes the step's direction but does not by itself rule out a discrete step overshooting a fitness maximum.`,
      caption: String.raw`**Left**: the mean-fitness curve $\bar w(p)$ with its tangent at the gold handle (drag it) and the next 25 generations as gold dots climbing the curve. **Right**: $\Delta p$ computed directly from the recursion (blue) and from Wright’s formula (green, dashed) — they coincide to rounding error for any fitnesses you set. Presets show a rise to the boundary, a hill with a peak inside (heterozygote advantage) and a valley (heterozygote disadvantage).`,
      deps: ['popgen-4.3','pma-5.3'],
      refs: ['Bürger, Elementary Population Genetics, §4.3 Eq. (4.11a), p. 14: https://homepage.univie.ac.at/Reinhard.Buerger/biovo_skript.pdf', 'Felsenstein (2019), §II.8 pp. 95–96 Eqs. (II-114)–(II-118), overshoot qualification: https://felsenst.github.io/pgbook/pgbook.pdf'],
      credit: 'Wright gradient identity, in the explicit author presentations cited here; no original-priority date is asserted.',
      scope: String.raw`A discrete-generation viability recursion with one locus, two alleles, constant nonnegative fitnesses and positive mean fitness. This is an identity for a finite step, not a continuous-time gradient-flow approximation. For several alleles, the corresponding identity is $\Delta p_i=(2\bar w)^{-1}\sum_j p_i(\delta_{ij}-p_j)\,\partial\bar w/\partial p_j$.`,
      tags: ['selection', 'adaptive landscape', 'gradient'],
      verify: false,
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
      statement: String.raw`For one autosomal locus with random mating, let a **constant symmetric nonnegative** genotype-fitness matrix $W=(w_{ij})$ act by viability selection. Assume positive diagonal entries, hence $\bar w(\mathbf p)>0$ on the frequency simplex. With $w_i=\sum_jw_{ij}p_j$ and $p_i'=p_iw_i/\bar w$, $$\bar w(\mathbf p')\ge\bar w(\mathbf p),$$ with equality exactly at fixed points. Mean fitness is a strict Lyapunov function, so trajectories approach the set of equilibria. This does not assert convergence to the globally highest peak; absent alleles cannot be created by this map.`,
      idea: String.raw`A direct proof uses $a_{ij}=w_{ij}p_ip_j/\bar w$, whose sum is one. Jensen's logarithm inequality gives $$\begin{gathered}
\ln\frac{\bar w(\mathbf p')}{\bar w(\mathbf p)}\\
\ge\sum_{ij}a_{ij}\ln\frac{w_iw_j}{\bar w^2}\\
=2\sum_i p_i'\ln\frac{p_i'}{p_i}\\
=2D_{\rm KL}(\mathbf p'\Vert\mathbf p)\ge0.
\end{gathered}$$ Terms with zero weight are omitted. Relative entropy vanishes only if $\mathbf p'=\mathbf p$, proving strictness. This is the quadratic special case of the Baum–Eagon transformation. Compactness and continuity then put all trajectory accumulation points in the fixed-point set.

The finite weights $a_{ij}$ in the proof sum to one, so Jensen prob-1.6.2, applied to the convex negative logarithm, supplies the log-ratio bound on the positive-weight support. The resulting natural-log relative entropy is $\log 2$ times the bit divergence in info-2.2; that theorem makes it nonnegative and zero exactly when the new and old frequency vectors coincide. Zero weights are omitted, and absent alleles remain absent. These support and normalization conditions are needed for the strictness claim.`,
      caption: String.raw`Drag the start in the three-allele simplex, choose a constant symmetric matrix or generate another. The finite trajectory preserves its starting face, and the right plot shows actual mean fitness changes. The optional nonsymmetric cyclic game is a **haploid frequency-dependent** replacement with allele fitnesses $(Ap)_i$; it illustrates a different model for which the symmetric diploid theorem gives no guarantee. A finite run and its roundoff do not prove the theorem.`,
      deps: ['popgen-4.4','prob-1.6.2','info-2.2'],
      refs: ['Bürger, Elementary Population Genetics, §§4.2, 4.4–4.5, Eqs. (4.7), (4.14)–(4.15), results 4.2 and 4.4, pp. 12–20: https://homepage.univie.ac.at/Reinhard.Buerger/biovo_skript.pdf', 'Bürger, Mathematische Populationsgenetik SS2013, Appendix A.1 Theorems A.2 and A.5, pp. 35–37: https://homepage.univie.ac.at/Reinhard.Buerger/PopGenVO.pdf'],
      credit: 'Constant one-locus theorem as presented by Bürger; the explicit Jensen/relative-entropy proof here verifies its quadratic case.',
      scope: String.raw`Infinite population, constant symmetric genotype viabilities, random mating, one locus, no mutation, migration or drift. Positive diagonals are a convenient sufficient hypothesis for a well-defined map on the entire closed simplex. Equality includes boundary and unstable fixed points, not just maxima. Arbitrary frequency dependence, cyclic games and multilocus recombination are outside the theorem. Fisher's fundamental theorem is not identified with this entire discrete-generation statement.`,
      tags: ['selection', 'mean fitness', 'Lyapunov'],
      verify: false,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Fisher%27s_fundamental_theorem_of_natural_selection' },
      viz(v) {
        const PRE = {
          het: { name: 'all heterozygotes fitter than homozygotes', W: [[0.85, 1.0, 0.9], [1.0, 0.75, 1.1], [0.9, 1.1, 0.8]] },
          dir: { name: 'a single fittest allele', W: [[1.0, 1.05, 1.1], [1.05, 1.1, 1.15], [1.1, 1.15, 1.25]] },
          under: { name: 'three stable corners (underdominance)', W: [[1.0, 0.8, 0.8], [0.8, 1.0, 0.8], [0.8, 0.8, 1.0]] },
          mixed: { name: 'a corner peak and an edge peak', W: [[1.2, 1.0, 0.8], [1.0, 0.7, 1.1], [0.8, 1.1, 1.0]] },
        };
        const pre = v.select('fitness matrix', [...Object.entries(PRE).map(([k, x]) => ({ value: k, label: x.name })), { value: 'rand', label: 'random' }], 'het');
        const fd = v.toggle('replace by a haploid cyclic game', false);
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
          const step = p => selectionStep(p,A);
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
        v.readout(() => `Mean fitness ${v.fix(info.w0,5)} initially → ${v.fix(info.wT,5)} after 100 generations. Actual smallest signed change $${v.sci(info.minD,3)}$; ${info.drops} decreases larger than $10^{-12}$.\n${info.freqDep?'This nonsymmetric haploid game has frequency-dependent allele fitnesses; the constant symmetric diploid theorem does not apply.':'The source theorem proves monotonicity; this finite path is an illustration. Changes within roundoff of zero are not forced positive in this readout.'}`);
      },
    },
  ],
};
