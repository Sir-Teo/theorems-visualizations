// Population Genetics & Evolution — Chapter 4 (part c): frequency dependence, fluctuating selection, peppered moth, resistance, Darwin & Wallace
import { clamp, memo, selStep, selPath, hapStep, logit, expit } from './ch04.shared.js';
import { melanicFraction, mothPath, mothTarget, mothPredationFit, resistanceHistory } from './source-audit-empirical.shared.js';
import { fluctuationMeans } from './source-audit-selection.shared.js';

const root = (f, a, b) => { let fa = f(a); for (let i = 0; i < 80; i++) { const m = (a + b) / 2, fm = f(m); if ((fm < 0) === (fa < 0)) { a = m; fa = fm; } else b = m; } return (a + b) / 2; };

export default {
  collection: 'popgen',
  chapter: 4,
  items: [
    // ───────────────────────────────────────────────────────────── 4.11
    {
      num: '4.11',
      kind: 'Model',
      name: 'Frequency-dependent selection',
      statement: String.raw`Let the fitnesses of the two alleles depend on the current frequency $p$ of $A$: $w_A(p)$ and $w_a(p)$ (for diploids, replace them by the marginal fitnesses of the alleles). The change per generation is still
$$\Delta p=\frac{p\,q\,\big(w_A(p)-w_a(p)\big)}{\bar w},\qquad \bar w=p\,w_A+q\,w_a .$$
An interior equilibrium is a frequency $p^*$ with $w_A(p^*)=w_a(p^*)$; it is stable if $w_A-w_a$ crosses zero downward, i.e. if each type does better when rare (**negative frequency dependence**) and unstable if each does better when common (**positive**). Unlike the constant-fitness case (4.4), $\Delta p$ is no longer $\frac{pq}{2\bar w}\frac{d\bar w}{dp}$: the stable polymorphism generally lies at a frequency where $\bar w$ is **not** maximal, and between the two points the population moves *downhill* on the mean-fitness curve.`,
      idea: String.raw`The formula for $\Delta p$ uses only that $A$ copies reproduce at rate $w_A$ and $a$ copies at rate $w_a$ at the moment they are counted (4.3). When these rates depend on $p$, differentiating $\bar w=pw_A+qw_a$ produces extra terms $p\,w_A'+q\,w_a'$ that Wright’s gradient formula does not contain, so at the equilibrium ($w_A=w_a$) one gets $d\bar w/dp=p\,w_A'+q\,w_a'$, which vanishes only in special symmetric cases. Rare-type advantage arises from predators forming search images, from competition for niche-specific resources, from host–parasite coevolution and from mate choice; examples include the handedness of scale-eating cichlid fishes (Hori, 1993). The contrast with 4.5 is the point: with frequency-dependent fitness there is no “fitness maximised by selection”, a theme continued in evolutionary game theory (game-6.1).`,
      caption: String.raw`Here $w_A=1\mp s\,p^{m}$ and $w_a=1\mp s\,q$ (upper sign: rare-type advantage). **Left**: the two fitnesses as functions of $p$; their crossing is the equilibrium $p^*$ (green when stable, red when unstable). **Right**: the mean fitness $\bar w(p)$; the red band is the interval between $p^*$ and the peak of $\bar w$, in which the population moves in the direction opposite to the slope of $\bar w$. Drag the gold handle for a start and follow 25 generations (gold dots). With $m=1$ the model is symmetric and $p^*$ coincides with the peak of $\bar w$; raise $m$ to separate them.`,
      deps: ['popgen-4.3'],
      refs: ['Ewens §2.5', 'Ayala & Campbell 1974, Annu. Rev. Ecol. Syst. 5: 115–138'],
      scope: String.raw`A deterministic, allele-level model with fitnesses given by simple power laws (illustrative, not fitted to a species); large population, random mating. Real frequency-dependent selection also acts on genotypes and phenotypes with several morphs, as in side-blotched lizards (11.8).`,
      tags: ['frequency dependence', 'polymorphism', 'game theory'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Frequency-dependent_selection' },
      viz(v) {
        const kind = v.select('type', [{ value: 'neg', label: 'rare type advantage' }, { value: 'pos', label: 'common type advantage' }], 'neg');
        const sS = v.slider('strength $s$', 0.05, 0.9, 0.5, { step: 0.01 });
        const mS = v.slider('exponent $m$ in $w_A$', 1, 3, 2, { step: 0.1 });
        const L = v.stage({ x: [0, 1], y: [0, 2], axes: 'box', gutter: true, height: 320, xlabel: 'frequency $p$ of $A$', ylabel: 'fitness of each type', title: 'Fitness depends on frequency', minWidth: 280 });
        const R = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 320, xlabel: 'frequency $p$ of $A$', ylabel: 'mean fitness $\\bar w$', title: 'Mean fitness is not what selection climbs', minWidth: 280 });
        const hd = R.handle(0.1, 0, { color: 'gold', r: 8, label: 'start', labelPos: 'n', constrain: (x) => [clamp(x, 0.01, 0.99), 0] });
        let info = {};
        v.render(() => {
          const s = sS.value, m = mS.value, sg = kind.value === 'neg' ? -1 : 1;
          const wA = (p) => 1 + sg * s * p ** m, wa = (p) => 1 + sg * s * (1 - p);
          const wb = (p) => p * wA(p) + (1 - p) * wa(p), D = (p) => wA(p) - wa(p);
          const dp = (p) => (p * (1 - p) * D(p)) / wb(p);
          const ps = root(D, 0, 1), stable = sg < 0;
          let pm = 0, wm = -Infinity; for (let i = 0; i <= 1000; i++) { const x = i / 1000, b = wb(x); if (b > wm) { wm = b; pm = x; } }
          const ymax = 1 + s * 1.1, ymin = Math.max(0, 1 - s * 1.1);
          L.setView([0, 1], [ymin, ymax]);
          L.fn(wA, { color: 'accent', width: 2.8 }); L.fn(wa, { color: 'orange', width: 2.8 });
          L.dot(ps, wA(ps), { r: 6.5, hollow: !stable, color: stable ? 'green' : 'red', label: `p* = ${v.fix(ps, 2)}`, labelPos: 'n' });
          let lo = Infinity, hi = -Infinity; for (let i = 0; i <= 100; i++) { const b = wb(i / 100); lo = Math.min(lo, b); hi = Math.max(hi, b); }
          const pad = Math.max(0.01, 0.2 * (hi - lo));
          R.setView([0, 1], [lo - pad, hi + pad]);
          const a = Math.min(ps, pm), b = Math.max(ps, pm);
          if (b - a > 1e-3) R.vband(a, b, { color: 'red', alpha: 0.14 });
          R.fn(wb, { color: 'purple', width: 2.8 });
          R.vline(ps, { color: stable ? 'green' : 'red', dash: true, width: 1.5 });
          R.dot(pm, wm, { r: 6, color: 'gold', label: 'max w̄', labelPos: 'n' });
          R.dot(ps, wb(ps), { r: 6.5, hollow: !stable, color: stable ? 'green' : 'red' });
          hd.set(hd.x, lo - pad);
          let p = hd.x; const pts = [];
          for (let k = 0; k < 25; k++) { pts.push([p, wb(p)]); p = clamp(p + dp(p), 0, 1); }
          R.dots(pts, { r: 3, color: 'gold' });
          const slope = (wb(hd.x + 1e-5) - wb(hd.x - 1e-5)) / 2e-5;
          info = { ps, pm, wps: wb(ps), wm, stable, p0: hd.x, dp: dp(hd.x), slope, end: p };
        });
        v.legend([['accent', '$w_A(p)$'], ['orange', '$w_a(p)$'], ['purple', '$\\bar w(p)$']]);
        v.readout(() => `Equilibrium $p^*=${v.fix(info.ps, 3)}$ (${info.stable ? 'stable' : 'unstable'}); mean fitness there $\\bar w(p^*)=${v.fix(info.wps, 4)}$, whereas the maximum of $\\bar w$ is ${v.fix(info.wm, 4)} at $p=${v.fix(info.pm, 3)}$.\nAt your start $p_0=${v.fix(info.p0, 2)}$: $\\Delta p=${v.fix(info.dp, 4)}$ but $d\\bar w/dp=${v.fix(info.slope, 3)}$ — ${info.dp * info.slope < 0 ? '**downhill**: the population moves against the slope of $\\bar w$' : 'uphill here'}. After 25 generations: $p=${v.fix(info.end, 3)}$.`);
      },
    },

    // ───────────────────────────────────────────────────────────── 4.12
    {
      num: '4.12',
      kind: 'Theorem',
      name: 'Fluctuating selection favours geometric-mean fitness',
      statement: String.raw`In a deterministic haploid competition, let lineage $X$ have positive i.i.d. generation fitnesses $W_t$ and lineage $Y$ have fitness 1. Assume $0<x_0<1$ and $\mathbb E|\ln W|<\infty$. Then $$\frac1t\ln\frac{x_t}{1-x_t}\longrightarrow m=\mathbb E\ln W\quad\text{almost surely}.$$ Thus $x_t\to1$ if $m>0$ and $x_t\to0$ if $m<0$. The case $m=0$ has no such directional conclusion. If also $A=\mathbb EW<\infty$, Jensen gives $G=\exp(m)\le A$: an arithmetic advantage alone need not imply long-run success.`,
      idea: String.raw`The exact log-odds identity is $\operatorname{logit}x_t=\operatorname{logit}x_0+\sum_{u<t}\ln W_u$. Apply the strong law to the **integrable logarithms**, not to the raw fitnesses, to obtain the stated rate even when $m=0$. Jensen compares a fluctuating lineage with a constant lineage at the same arithmetic mean; variance alone does not order arbitrary fitness distributions. For uniformly small relative fluctuations around $A$, a second-order expansion gives $\ln G\approx\ln A-\operatorname{Var}(W)/(2A^2)$.`,
      caption: String.raw`The two-state fitness of $X$ is $a$ with probability $\pi$ and $b$ otherwise; $Y$ stays at 1. All histories start at equal frequencies. Forty finite log-odds histories, their sample median and the exact **expected** log-odds $tm$ are shown separately. The long-run conclusion does not guarantee which lineage is common after 300 generations. The right panel compares the mean log fitness with the log of its mean. Equal growth rate is reported as a separate case.`,
      deps: ['popgen-4.2', 'rca-3.3'],
      refs: ['Felsenstein, Theoretical Evolutionary Genetics (2019), §II.11 pp. 111–113 Eqs. (II-134)–(II-137), complete haploid treatment: https://felsenst.github.io/pgbook/pgbook.pdf', 'Durrett, Probability: Theory and Examples, fifth edition, Theorem 2.4.1 and proof pp. 76–78: https://sites.math.duke.edu/~rtd/PTE/PTE5_011119.pdf'],
      credit: 'Temporal multiplicative-fitness account follows Felsenstein; the almost-sure limit uses the explicitly stated strong-law hypotheses.',
      scope: String.raw`Infinite population, non-overlapping generations, frequency-independent lineage fitnesses and a shared environment within each generation. The displayed positive two-state distribution satisfies log integrability automatically. The stated theorem assumes independent environments. Temporal correlation changes the history distribution and needs separate assumptions and analysis. Finite-population sampling, individual reproductive variance, overlapping generations and seed banks require additional models.`,
      tags: ['fluctuating selection', 'bet hedging', 'Jensen'],
      verify: false,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Bet_hedging_(biology)' },
      viz(v) {
        const aS = v.slider('good-year fitness $a$ of $X$', 1, 3, 1.5, { step: 0.01 });
        const bS = v.slider('bad-year fitness $b$ of $X$', 0.1, 1.2, 0.5, { step: 0.01 });
        const piS = v.slider('probability $\\pi$ of a good year', 0.05, 0.95, 0.6, { step: 0.01 });
        let seed = 1;
        v.button('New histories', () => { seed++; });
        const T = 300, K = 40;
        const L = v.stage({ x: [0, T], y: [-20, 20], axes: 'box', gutter: true, height: 330, xlabel: 'generation', ylabel: 'log-odds of $X$:  $\\ln\\frac{x}{1-x}$', title: 'Forty histories of the environment', minWidth: 300 });
        const R = v.stage({ x: [0, 3], y: [-2.45, 1.2], axes: 'box', gutter: true, height: 330, xlabel: 'fitness $W$', ylabel: '$\\ln W$', title: 'Jensen’s inequality', minWidth: 260 });
        const sim = memo();
        let info = {};
        v.render(() => {
          const a = aS.value, b = bS.value, pi = piS.value;
          const means=fluctuationMeans(a,b,pi),A=means.A,lnG=means.m,G=means.G;
          const S = sim(`${a}|${b}|${pi}|${seed}`, () => {
            const reps = []; let sumLn = 0, cnt = 0;
            for (let k = 0; k < K; k++) {
              const r = v.rng(seed * 1009 + k * 17 + 5); let x = 0; const path = [0];
              for (let t = 0; t < T; t++) { const lw = r() < pi ? Math.log(a) : Math.log(b); x += lw; sumLn += lw; cnt++; path.push(x); }
              reps.push(path);
            }
            const med = Array.from({ length: T + 1 }, (_, t) => { const xs = reps.map((p) => p[t]).sort((u, w) => u - w); return (xs[K / 2 - 1] + xs[K / 2]) / 2; });
            return { reps, med, drift: sumLn / cnt };
          });
          let ext = Math.max(6,Math.abs(T*lnG)); S.reps.forEach((p) => p.forEach((y) => { ext = Math.max(ext, Math.abs(y)); }));
          ext = Math.ceil(ext / 5) * 5; L.setView([0, T], [-ext, ext]);
          S.reps.forEach((p) => L.path(p.map((y, t) => [t, y]), { color: 'accent', width: 1, alpha: 0.35 }));
          L.path(Array.from({ length: T + 1 }, (_, t) => [t, t * lnG]), { color: 'ink', width: 2.2, dash: true });
          L.path(S.med.map((y, t) => [t, y]), { color: 'gold', width: 3 });
          L.hline(0, { color: 'muted', width: 1, dash: true });
          R.setView([0, 3], [-2.45, 1.2]);
          R.fn(Math.log, { domain: [0.09, 3], color: 'ink', width: 2.4 });
          R.vline(1, { color: 'muted', width: 1, dash: true }); R.hline(0, { color: 'muted', width: 1, dash: true });
          R.line(b, Math.log(b), a, Math.log(a), { color: 'orange', width: 2 });
          R.dot(b, Math.log(b), { r: 5, color: 'orange', label: 'bad year', labelPos: 'se' }); R.dot(a, Math.log(a), { r: 5, color: 'orange', label: 'good year', labelPos: 's' });
          R.line(A, lnG, A, Math.log(A), { color: 'red', width: 2.5 });
          R.dot(A, lnG, { r: 6.5, color: 'red', label: 'mean of ln W', labelPos: 'sw' });
          R.dot(A, Math.log(A), { r: 6.5, color: 'green', label: 'ln of mean', labelPos: 'nw' });
          const end = S.reps.filter((p) => p[T] < 0).length;
          info = { A, G, lnG, lnA: Math.log(A), drift: S.drift, end, direction:means.direction };
        });
        v.legend([['accent', 'one history'], ['gold', 'median'], ['ink', 'expected drift $t\\ln G$', { dash: true }]]);
        v.readout(() => `Arithmetic mean $A=${v.fix(info.A,3)}$, geometric mean $G=${v.fix(info.G,3)}$; expected log-odds rate $m=${v.fix(info.lnG,5)}$. Jensen gap $\\ln A-m=${v.fix(info.lnA-info.lnG,5)}$.\nMean sampled log fitness over 40 histories ${v.fix(info.drift,5)}; X is rarer after 300 generations in ${info.end}/40 histories. ${info.direction==='zero'?'Zero expected log growth rate: no directional takeover conclusion is asserted.':info.direction==='increase'?'The almost-sure long-run prediction is X approaching frequency one.':'The almost-sure long-run prediction is X approaching frequency zero.'} These are asymptotic statements, not guarantees about the finite histories.`);
      },
    },

    // ───────────────────────────────────────────────────────────── 4.13
    {
      num: '4.13',
      kind: 'Phenomenon',
      name: 'Industrial melanism in the peppered moth',
      statement: String.raw`The dark carbonaria morph of the peppered moth Biston betularia is controlled by a dominant allele at a major locus. Its industrial rise and later decline provide evidence of changing selection. Cook et al. (2012) analyzed Majerus’s six-year release experiment involving 4,864 moths at an unpolluted Cambridge site and found lower daily survival of melanics. They reported daily selection against melanics $s=0.091$ (95% likelihood-estimated interval 0.028–0.157). This daily survival contrast must not be substituted directly for a whole-generation genotype fitness. In a two-allele Hardy–Weinberg model, a dominant dark allele of frequency $p$ gives dark phenotype frequency $1-(1-p)^2$.`,
      idea: String.raw`For selected viabilities $(w_{CC},w_{Cc},w_{cc})=(1,1,1-s)$, the pale-allele frequency $q=1-p$ obeys $q'=q(1-sq)/(1-sq^2)$. Reversing the relative viabilities to $(1-s,1-s,1)$ instead favors the pale genotype. These synthetic constant-fitness paths illustrate dominance, not a reconstruction of Manchester or Caldy census histories. For the actual release counts, our separate binomial calculation fits a typical-survival probability $u_y$ per year and one shared melanic survival ratio $r$, with probabilities $u_y$ and $ru_y$. Profiling the six baseline probabilities gives $r\approx0.909$, consistent with the paper’s rounded daily coefficient. This is distinct from fitting the synthetic generation endpoints.`,
      caption: String.raw`**Left:** two synthetic paths from chosen phenotype frequencies 1% and 93%, with chosen endpoint targets 98% after 47 generations and 10% after 41. Solid lines are phenotypes and dashed lines allele frequencies. “Fit toy endpoint targets” fits those chosen targets only; the orange targets are not field observations. **Right:** actual one-exposure survival fractions computed from the released/eaten counts in Cook et al.’s Table 2, printed 611; the optional model curves fit those counts. The table labels the experiments 2002–2007, while the paper’s Figure 1 labels its corresponding survival points 2001–2006. We use the Table 2 labels explicitly and do not silently merge those inconsistent dates.`,
      deps: ['popgen-4.6'],
      refs: ['Cook, Grant, Saccheri & Mallet (2012), Selective bird predation on the peppered moth: the last experiment of Michael Majerus, Biology Letters 8:609–612, complete original, Methods 610 and Results/Table 2/Discussion 611: https://dash.harvard.edu/bitstreams/7312037c-b346-6bd4-e053-0100007fdf3b/download', 'Bürger, Elementary Population Genetics, §4.2–4.3 pp.12–15, genotype selection recursion: https://homepage.univie.ac.at/Reinhard.Buerger/biovo_skript.pdf'],
      credit: 'Original experiment by Michael Majerus, analyzed by Cook, Grant, Saccheri & Mallet (2012); displayed binomial profile and toy trajectories are separately specified calculations.',
      scope: String.raw`The experiment released local carbonaria and typica at low densities onto naturally selected branches; missing moths after 4 hours were presumed eaten, with about 26% of disappearances directly observed as bird predation. It supplies direct evidence of differential predation, not a model in which every disappearance is directly witnessed. The article’s fitted daily inference accounts for year effects; the detailed supplemental S3 analysis was not reconstructed here. Our explicitly stated binomial model reproduces the rounded coefficient from the published counts. The synthetic trajectories omit migration, other morphs, changing environments and stochastic sampling; their selection coefficients and targets are not empirical estimates.`,
      tags: ['selection', 'dominance', 'natural selection in action'],
      verify: false,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Peppered_moth_evolution' },
      viz(v) {
        const sUp=v.slider('toy selection against pale cc',.02,.8,.25,{step:.005});
        const sDown=v.slider('toy selection against dark CC,Cc',.01,.5,.15,{step:.005});
        const fitOn=v.toggle('show binomial profile fit to released-moth counts',true);
        const fitUp=mothTarget(.01,.98,47),fitDown=mothTarget(.93,.1,41,true),F=mothPredationFit();
        v.button('Fit toy endpoint targets',()=>{sUp.set(fitUp);sDown.set(fitDown);});
        const L=v.stage({x:[0,55],y:[0,1],axes:'box',gutter:true,height:330,xlabel:'model generations (no historical calendar)',ylabel:'phenotype / allele frequency',title:'Two chosen selection scenarios',minWidth:300});
        const R=v.stage({x:[2001.5,2007.5],y:[0,1],axes:'box',gutter:true,height:330,xlabel:'experiment year as printed in Table 2',ylabel:'fraction surviving one exposure',title:'Original released-moth counts; separate daily inference',minWidth:300,xticks:[2002,2003,2004,2005,2006,2007]});
        let info={};
        v.render(()=>{
          const up=mothPath(.01,sUp.value),dn=mothPath(.93,sDown.value,true);
          for(const [P,col]of[[up,'accent'],[dn,'purple']]){L.path(P.map((p,t)=>[t,melanicFraction(p)]),{color:col,width:2.8});L.path(P.map((p,t)=>[t,p]),{color:col,width:1.5,dash:true});}
          L.dot(47,.98,{r:5,hollow:true,color:'orange'});L.dot(41,.1,{r:5,hollow:true,color:'orange'});
          F.rows.forEach(q=>{R.dot(q.year,q.typical,{r:4.8,color:'teal'});R.dot(q.year,q.melanic,{r:4.8,color:'red'});});
          if(fitOn.value){R.path(F.rows.map(q=>[q.year,q.fitT]),{color:'teal',width:1.6,dash:true});R.path(F.rows.map(q=>[q.year,q.fitC]),{color:'red',width:1.6,dash:true});}
          info={fu:melanicFraction(up[47]),fd:melanicFraction(dn[41]),su:sUp.value,sd:sDown.value};
        });
        v.legend([['accent','toy rise'],['purple','toy decline'],['orange','chosen toy targets',{dot:true}],['teal','actual typica survival',{dot:true}],['red','actual carbonaria survival',{dot:true}]]);
        v.readout(()=>`Toy rise: s=${v.fix(info.su,4)} gives ${v.fix(100*info.fu,3)}% dark after 47 generations; chosen-target fit s=${v.fix(fitUp,5)}. Toy decline: s=${v.fix(info.sd,4)} gives ${v.fix(100*info.fd,3)}% dark after 41; chosen-target fit s=${v.fix(fitDown,5)}.\nIndependent binomial profile of original counts: daily survival ratio r=${v.fix(F.r,6)}, s=${v.fix(F.s,6)}; likelihood-ratio statistic versus r=1 is ${v.fix(F.LR,5)}. This is not a per-generation fitness or a fit to the synthetic paths. The paper reports s=0.091 with interval 0.028–0.157.`);
      },
    },

    // ───────────────────────────────────────────────────────────── 4.14
    {
      num: '4.14',
      kind: 'Model',
      name: 'Evolution of resistance under selective exposure',
      statement: String.raw`Resistance can spread when heritable resistant types reproduce better under a selective agent, but its origin and persistence depend on the system. In a chosen two-type haploid model, resistant fitness is $1-c$ and sensitive fitness is $1-d$ during exposure. **With selection alone**, resistant odds multiply by $(1-c)/(1-d)$; after withdrawal they multiply by $1-c$. Thus resistance declines when costly and sensitive types remain, even with no immigration. Mutation, migration, spatial structure, horizontal transfer and compensatory evolution can change this behavior. Resistance is not universally pre-existing or universally costly.`,
      idea: String.raw`Our full generation is selection, then replacement of a fraction $m$ by sensitive immigrants, then forward mutation at rate $\mu$: $$p'=\mu+(1-\mu)(1-m)\frac{(1-c)p}{(1-c)p+(1-d)(1-p)}.$$ Its log-odds is generally **not** piecewise linear. At $d=0$, write $B=c+\mu+(1-\mu)m(1-c)$; the small equilibrium root of $cp^2-Bp+\mu=0$ is $p_*=2\mu/(B+\sqrt{B^2-4c\mu})$, approximately $\mu/(c+m)$ only for weak rates and rare resistance. The initial seed uses that exact equilibrium; recurrent mutation after the start can be switched off. A separate selection-only reference starts from the actual state at application and has exact log-odds slope $\ln[(1-c)/(1-d)]$.`,
      caption: String.raw`**Synthetic frequency model, not a drug-response fit.** Frequencies are plotted as their actual $\log_{10}$ values, preserving extremely rare sensitive types without a floor. The shaded interval uses the chosen application/withdrawal generations; if withdrawal is no later than application, there is no exposure. The gold dashed curve is a selection-only reference from the actual application state, omitting ongoing mutation and immigration. Its predicted half-frequency time is conditional on that reference, not a prediction for the full map. Setting immigration and recurrent mutation to zero exposes the exact odds identity. Straight log-frequency growth applies only approximately while resistance is rare; the exact linear identity concerns log-odds.`,
      deps: ['popgen-4.2'],
      refs: ['Felsenstein, Theoretical Evolutionary Genetics (2019), complete haploid recursion and exact log-odds rate §II.6 pp.70–74: https://felsenst.github.io/pgbook/pgbook.pdf', 'Baym et al. (2016), Spatiotemporal microbial evolution on antibiotic landscapes, Science 353:1147–1151, original final main text pp.1147–1151 and Figs. 1–4; archived author manuscript: https://pmc.ncbi.nlm.nih.gov/articles/PMC5534434/'],
      credit: 'Exact two-type selection follows Felsenstein; Baym et al. (2016) supplies an original experimental example of spatial, sequential and compensatory evolution beyond this model.',
      scope: String.raw`Deterministic haploid frequencies, constant chosen cost, one forward mutation, sensitive immigration and no back mutation. This does not model finite-population loss, population density, pharmacology, multiple resistance genes, gene transfer or spatial barriers. Baym et al.’s MEGA-plate experiments demonstrate sequential resistance mutations and compensatory changes in spatially expanding E. coli; they explicitly do not directly simulate natural or clinical settings. These experiments do not calibrate this model’s parameters or justify a universal claim about standing variation, withdrawal, refuges or combination treatment.`,
      tags: ['resistance', 'selection', 'applied evolution'],
      verify: false,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Antimicrobial_resistance' },
      viz(v) {
        const muS=v.slider('seed mutation rate and optional recurrent mutation',1e-9,1e-5,1e-7,{log:true,sig:2,fmt:x=>x.toExponential(2)});
        const cS=v.slider('chosen resistance cost c',.005,.3,.05,{log:true,sig:2});
        const dS=v.slider('chosen sensitive removal fraction d during exposure',0,.95,.5,{step:.01});
        const mS=v.slider('replacement by sensitive immigrants m',0,.05,.002,{step:.001});
        const t1S=v.slider('exposure starts after generation',5,150,30,{int:true});
        const t2S=v.slider('exposure ends at generation',30,380,150,{int:true});
        const mutOn=v.toggle('include recurrent mutation after the initial seed',true);
        const T=400,L=v.stage({x:[0,T],y:[-12,0],axes:'box',gutter:true,height:370,xlabel:'model generation',ylabel:'log10 allele frequency',title:'Full model and conditional selection-only reference',full:true});let info={};
        v.render(()=>{
          const c=cS.value,d=dS.value,mu=muS.value,m=mS.value,start=t1S.value,end=t2S.value,H=resistanceHistory(c,d,mu,m,start,end,mutOn.value,T),active=start<end,at=H.rows[start],rate=Math.log1p(-c)-Math.log1p(-d);
          const reference=active?Array.from({length:end-start+1},(_,j)=>{const z=at.z+j*rate;return[start+j,-Math.max(0,-z)/Math.LN10-Math.log1p(Math.exp(-Math.abs(z)))/Math.LN10];}):[];
          const R=H.rows.map(q=>[q.t,q.lp/Math.LN10]),S=H.rows.map(q=>[q.t,q.lq/Math.LN10]),low=Math.min(-3,...R.map(q=>q[1]),...S.map(q=>q[1]),...reference.map(q=>q[1]));L.setView([0,T],[low-1,.15]);
          if(active){L.vband(start,end,{color:'orange',alpha:.12});L.text('chosen exposure',(start+end)/2,(low-1)+.07*(1.15-low),{align:'center',color:'orange',size:12});}
          L.hline(Math.log10(H.p0),{color:'muted',dash:true,width:1});L.path(S,{color:'orange',width:2.3});L.path(R,{color:'accent',width:2.8});if(active)L.path(reference,{color:'gold',dash:true,width:1.8});
          const hit=H.rows.find(q=>q.on&&q.z>=0),pred=active&&rate>0?Math.max(0,-at.z/rate):null;
          info={p0:H.p0,mu,c,m,d,start,end,active,rate,pred,hit:hit?hit.t-start:null,at:at.z,withdraw:H.rows[end],final:H.rows.at(-1),pure:m===0&&!mutOn.value};
        });
        v.legend([['accent','full resistant frequency'],['orange','full sensitive frequency'],['gold','selection-only reference from application',{dash:true}],['muted','initial seed equilibrium',{dash:true}]]);
        const frequency=lp=>lp<-650?`$10^{${v.fix(lp/Math.LN10,2)}}$`:`$${v.sci(Math.exp(lp),3)}$`;
        v.readout(()=>`Initial seed equilibrium $${v.sci(info.p0,3)}$; weak-rate approximation $${v.sci(info.mu/(info.c+info.m),3)}$. ${mutOn.value?'Forward mutation continues.':'Forward mutation is off after the seed; its initial equilibrium need not persist.'}\n${info.active?`Selected exposure: generations ${info.start+1} through ${info.end}. Full-map first half-frequency crossing during exposure: ${info.hit===null?'not reached':info.hit+' generations after application'}. Selection-only log-odds rate ${v.fix(info.rate,5)}; ${info.pred===null?'no increasing half-frequency reference':`reference half-frequency time ${v.fix(info.pred,3)} generations (first integer crossing ${Math.ceil(info.pred)}, ${info.pred<=info.end-info.start?'within':'beyond'} selected exposure)`}. ${info.pure?'Mutation and immigration are zero: the odds identity is exact.':'Mutation or immigration is present: the reference omits those processes.'}`:'Withdrawal is no later than application: no exposure is applied.'}\nAt generation ${T}, resistant frequency ${frequency(info.final.lp)}, sensitive frequency ${frequency(info.final.lq)}. Extremely rare types remain represented on the log-frequency axis.`);
      },
    },

    // ───────────────────────────────────────────────────────────── 4.15
    {
      num: '4.15',
      kind: 'Paper',
      name: 'On the Tendency of Species to form Varieties',
      paper: { authors: 'Charles Darwin and Alfred Wallace', year: 1858, title: 'On the Tendency of Species to form Varieties; and on the Perpetuation of Varieties and Species by Natural Means of Selection', venue: 'Journal of the Proceedings of the Linnean Society of London, Zoology 3 (9): 45–62', doi: '10.1111/j.1096-3642.1858.tb02500.x' },
      introduces: [],
      statement: String.raw`The paper presented, side by side, two independent statements of the same mechanism for the origin of varieties and species. (i) Organisms of every kind multiply geometrically but their numbers stay about constant, so most offspring die; (ii) individuals differ, and some of the differences are inherited; (iii) hence those with variations that help them survive and reproduce in the conditions they face leave more descendants, and the average character of the population changes from generation to generation, without limit if the conditions continue to favour change. In modern terms: **a population with heritable variation in fitness evolves**, with a response proportional to the heritable variation (the breeder’s equation of 9.5).`,
      idea: String.raw`Before 1858 naturalists generally believed species to be fixed, or changed by the inheritance of habits or by an inner tendency. Darwin had worked out natural selection in 1838–1844 and held it back; on 18 June 1858 he received an essay from Wallace, in Ternate, that contained the same idea. Their friends Lyell and Hooker arranged that extracts from Darwin’s unpublished 1844 essay and an 1857 letter to Asa Gray, together with Wallace’s essay, were read at the Linnean Society on 1 July 1858 and published in August 1858; Darwin’s *Origin of Species* followed in 1859. Both men credited Malthus’s principle of population (mathbio-1.2) as the key to the “struggle for existence”, and neither had a mechanism of heredity — Mendel’s work (1.17) was still unread, and population genetics only began with Hardy, Weinberg and Fisher.`,
      caption: String.raw`A population of 150 predators (the trait is running speed, standardised) breeds geometrically while food limits adults to 150. **Left**: the numbers that would survive if nobody died (red, logarithmic axis) against the numbers the food supports (green): the surplus must die. **Middle**: the trait distribution of the newborns at generation 0 (grey) and at the chosen generation (blue). **Right**: the mean trait over 30 generations with the spread of the population. Set **heredity** to $h^2=0$ or the **survival advantage** to 0 (equal chances of survival) and the mean stops moving. The readout checks the response against $h^2$ times the survivors’ advantage.`,
      deps: ['mathbio-1.2', 'popgen-4.1'],
      refs: [],
      tags: ['natural selection', 'history', 'Darwin', 'Wallace'],
      credit: 'Charles Darwin & Alfred Russel Wallace, 1858',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Alfred_Russel_Wallace' },
      scope: String.raw`A simulation of the argument in modern terms (asexual inheritance with a fixed parent–offspring regression), not a reproduction of anything printed in the paper, which contains no data tables or mathematics. The same idea was developed quantitatively only decades later; see 4.2 and 9.5.`,
      viz(v) {
        const FS = v.slider('offspring per parent $F$', 1.5, 8, 4, { step: 0.5 });
        const hS = v.slider('heredity (parent–offspring regression $h^2$)', 0, 1, 0.6, { step: 0.05 });
        const bS = v.slider('survival advantage per unit of speed', 0, 1.5, 0.35, { step: 0.05 });
        const gS = v.slider('show generation', 0, 30, 15, { int: true });
        let seed = 1;
        v.button('New run', () => { seed++; });
        const K = 150, T = 30;
        const A = v.stage({ x: [0, 12], y: [100, 1e8], ylog: true, axes: 'box', gutter: true, height: 320, xlabel: 'generation', ylabel: 'individuals (log scale)', title: 'Geometric increase vs a fixed food supply', minWidth: 260 });
        const B = v.stage({ x: [-4, 5], y: [0, 0.6], axes: 'box', gutter: true, height: 320, xlabel: 'trait: running speed (standardised)', ylabel: 'fraction of newborns', title: 'Newborns, generation 0 and chosen generation', minWidth: 260 });
        const C = v.stage({ x: [0, T], y: [-3, 5], axes: 'box', gutter: true, height: 320, xlabel: 'generation', ylabel: 'mean trait of newborns', title: 'The population changes', minWidth: 260 });
        const sim = memo();
        let info = {};
        v.render(() => {
          const F = FS.value, h2 = hS.value, beta = bS.value, g = gS.value;
          const S = sim(`${F}|${h2}|${beta}|${seed}`, () => {
            const r = v.rng(seed * 7919 + 11); let adults = Array.from({ length: K }, () => r.normal()), mPrev = 0;
            const gens = [], se = Math.sqrt(1 - h2 * h2);
            for (let t = 0; t <= T; t++) {
              // offspring trait = cohort mean + h2 (z_parent - cohort mean) + noise, so the mean response is h2 S (breeder's equation)
              const off = [];
              for (const z of adults) { const n = Math.floor(F) + (r() < F - Math.floor(F) ? 1 : 0); for (let j = 0; j < n; j++) off.push(mPrev + h2 * (z - mPrev) + se * r.normal()); }
              const m = off.reduce((s, x) => s + x, 0) / off.length, vr = off.reduce((s, x) => s + (x - m) ** 2, 0) / off.length;
              gens.push({ off, m, sd: Math.sqrt(vr), nOff: off.length });
              // survival: weight exp(beta z); K survivors drawn without replacement (Efraimidis-Spirakis keys)
              const keyed = off.map((z) => [Math.pow(r() || 1e-12, 1 / Math.exp(beta * z)), z]).sort((u, w) => w[0] - u[0]).slice(0, K).map((x) => x[1]);
              const ms = keyed.reduce((s, x) => s + x, 0) / keyed.length;
              gens[t].S = ms - m; adults = keyed; mPrev = m;
            }
            return gens;
          });
          // panel A: potential vs capacity
          A.setView([0, 12], [100, Math.max(1e4, K * F ** 12 * 1.5)]);
          A.path(Array.from({ length: 13 }, (_, t) => [t, K * F ** t]), { color: 'red', width: 2.8 });
          A.hline(K, { color: 'green', width: 2.8 });
          A.text('if all survived', 6.2, K * F ** 6.6, { size: 12, color: 'red', align: 'left' });
          A.text('what the food supports', 0.4, K * 1.7, { size: 12, color: 'green', align: 'left' });
          // panel B: histograms
          const lo0 = -4, hi0 = Math.max(5, Math.ceil(Math.max(...S.map((x) => x.m)) + 3.5)), edges = Array.from({ length: 41 }, (_, i) => lo0 + ((hi0 - lo0) * i) / 40);
          const hist = (xs) => { const c = new Array(40).fill(0); xs.forEach((x) => { const k = Math.floor(((x - lo0) / (hi0 - lo0)) * 40); if (k >= 0 && k < 40) c[k]++; }); return c.map((n) => n / xs.length); };
          const h0 = hist(S[0].off), hg = hist(S[g].off), top = Math.max(0.12, ...h0, ...hg) * 1.15;
          B.setView([lo0, hi0], [0, top]);
          h0.forEach((f, i) => B.rect(edges[i], 0, edges[i + 1], f, { fill: 'muted', fillAlpha: 0.4, color: 'muted', width: 0.8 }));
          hg.forEach((f, i) => B.rect(edges[i], 0, edges[i + 1], f, { fill: 'accent', fillAlpha: 0.4, color: 'accent', width: 0.8 }));
          B.vline(S[0].m, { color: 'muted', dash: true, width: 1.5 }); B.vline(S[g].m, { color: 'accent', dash: true, width: 1.5 });
          // panel C
          const ms = S.map((x) => x.m), lo = Math.min(-3, ...ms.map((m, i) => m - S[i].sd)), hi = Math.max(5, ...ms.map((m, i) => m + S[i].sd));
          C.setView([0, T], [lo, hi]);
          C.between((t) => { const i = clamp(Math.round(t), 0, T); return S[i].m + S[i].sd; }, (t) => { const i = clamp(Math.round(t), 0, T); return S[i].m - S[i].sd; }, 0, T, { fill: 'accent', fillAlpha: 0.15 });
          C.path(ms.map((m, t) => [t, m]), { color: 'accent', width: 3 });
          C.dot(g, S[g].m, { r: 6, color: 'gold' });
          // breeder's equation check: response of the newborn mean vs h2 * S (average over generations 0..9)
          let rs = 0, ss = 0, n = 0; for (let t = 0; t < 10; t++) { rs += S[t + 1].m - S[t].m; ss += S[t].S; n++; }
          info = { F, h2, beta, g, surplus: 1 - 1 / F, R: rs / n, S: ss / n, mg: S[g].m, nOff: S[g].nOff };
        });
        v.legend([['red', 'potential numbers $K F^t$'], ['green', 'capacity $K$'], ['muted', 'newborns, generation 0', { area: true }], ['accent', 'newborns, chosen generation', { area: true }]]);
        v.readout(() => `Each generation about ${info.nOff} newborns compete for ${150} places: a fraction ${v.fix(100 * info.surplus, 0)}% must die. Mean trait at generation ${info.g}: ${v.fix(info.mg, 2)}.\nBreeder’s check (first ten generations): average survivors’ advantage $S=${v.fix(info.S, 3)}$, observed response per generation $R=${v.fix(info.R, 3)}$, prediction $h^2S=${v.fix(info.h2 * info.S, 3)}$. ${info.h2 === 0 ? 'Heredity is off, so there is no response however strong the selection.' : info.beta === 0 ? 'Survival is equal for all: no selection, no systematic change.' : ''}`);
      },
    },
  ],
};
