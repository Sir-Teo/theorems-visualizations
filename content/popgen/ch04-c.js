// Population Genetics & Evolution — Chapter 4 (part c): frequency dependence, fluctuating selection, peppered moth, resistance, Darwin & Wallace
import { clamp, memo, selStep, selPath, hapStep, logit, expit } from './ch04.shared.js';

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
      statement: String.raw`Two lineages $X$ and $Y$ compete in a very large population in which fitnesses change from generation to generation with the environment, the same for everybody in a given generation. Let $X$ have fitness $W_t$ in generation $t$ (independent and identically distributed with $\mathbb E\,W_t<\infty$, $W_t>0$) and $Y$ constant fitness $1$. The odds $x_t/(1-x_t)$ of $X$ are multiplied by $W_t$ each generation, so
$$\ln\frac{x_t}{1-x_t}=\ln\frac{x_0}{1-x_0}+\sum_{s<t}\ln W_s\;\sim\;t\,\mathbb E[\ln W]\quad(t\to\infty).$$
$X$ takes over if its **geometric-mean fitness** $G=\exp\mathbb E\ln W$ exceeds $1$ and disappears if $G<1$, **regardless of its arithmetic mean** $A=\mathbb E\,W$. Since $G\le A$ (Jensen), a lineage with $A>1$ but $G<1$, i.e. with a high mean but large year-to-year variance, is eliminated by a steadier competitor.`,
      idea: String.raw`With non-overlapping generations, fitness acts multiplicatively over time, so what matters is the long-run growth rate of a lineage, which is the mean of the *logarithm* of its fitness (the law of large numbers for $\sum\ln W_s$). Because the logarithm is concave, Jensen’s inequality (rca-3.3) gives $\mathbb E\ln W\le\ln\mathbb E W$, with equality only if $W$ is constant: variance costs growth, and costs more the larger it is — to second order $\ln G\approx\ln A-\tfrac12\sigma^2/A^2$. This is the principle behind bet-hedging, in which a genotype gives up some mean reproduction to reduce variance; it was developed for polymorphism by Dempster (1955), Haldane and Jayakar (1963) and Gillespie (1973), and in the demographic setting by Lewontin and Cohen (1969).`,
      caption: String.raw`$X$ has fitness $a$ in a good year (probability $\pi$) and $b$ in a bad year; $Y$ always has fitness 1. **Left**: the log-odds of $X$ against $Y$ in forty independent histories of the environment (thin lines; above 0 means $X$ is the commoner), the median history (gold) and the straight line $t\ln G$ (dashed) that the law of large numbers predicts. **Right**: the logarithm is concave, so the average of $\ln W$ (point on the chord) falls below $\ln$ of the average (point on the curve): the vertical gap is the cost of fluctuation. Raise the good-year fitness until the arithmetic mean exceeds 1 while $G<1$ — $X$ still loses.`,
      deps: ['popgen-4.2', 'rca-3.3'],
      refs: ['Ewens §5.8', 'Gillespie'],
      credit: 'Dempster, 1955; Haldane & Jayakar, 1963; Gillespie, 1973',
      scope: String.raw`Infinite population, fitness fluctuations that are the same for the whole population in a generation and independent between generations, non-overlapping generations. Within-generation (individual) variance in offspring number, finite populations and environmental autocorrelation modify the result; with overlapping generations or a seed bank the effective fluctuation is damped.`,
      tags: ['fluctuating selection', 'bet hedging', 'Jensen'],
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Bet_hedging_(biology)' },
      viz(v) {
        const aS = v.slider('good-year fitness $a$ of $X$', 1, 3, 1.5, { step: 0.01 });
        const bS = v.slider('bad-year fitness $b$ of $X$', 0.1, 1.2, 0.5, { step: 0.01 });
        const piS = v.slider('probability $\\pi$ of a good year', 0.05, 0.95, 0.6, { step: 0.01 });
        let seed = 1;
        v.button('New histories', () => { seed++; });
        const T = 300, K = 40;
        const L = v.stage({ x: [0, T], y: [-20, 20], axes: 'box', gutter: true, height: 330, xlabel: 'generation', ylabel: 'log-odds of $X$:  $\\ln\\frac{x}{1-x}$', title: 'Forty histories of the environment', minWidth: 300 });
        const R = v.stage({ x: [0, 3], y: [-2.4, 1.2], axes: 'box', gutter: true, height: 330, xlabel: 'fitness $W$', ylabel: '$\\ln W$', title: 'Jensen’s inequality', minWidth: 260 });
        const sim = memo();
        let info = {};
        v.render(() => {
          const a = aS.value, b = bS.value, pi = piS.value;
          const A = pi * a + (1 - pi) * b, lnG = pi * Math.log(a) + (1 - pi) * Math.log(b), G = Math.exp(lnG);
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
          let ext = 6; S.reps.forEach((p) => p.forEach((y) => { ext = Math.max(ext, Math.abs(y)); }));
          ext = Math.ceil(ext / 5) * 5; L.setView([0, T], [-ext, ext]);
          S.reps.forEach((p) => L.path(p.map((y, t) => [t, y]), { color: 'accent', width: 1, alpha: 0.35 }));
          L.path(Array.from({ length: T + 1 }, (_, t) => [t, t * lnG]), { color: 'ink', width: 2.2, dash: true });
          L.path(S.med.map((y, t) => [t, y]), { color: 'gold', width: 3 });
          L.hline(0, { color: 'muted', width: 1, dash: true });
          R.setView([0, 3], [-2.4, 1.2]);
          R.fn(Math.log, { domain: [0.09, 3], color: 'ink', width: 2.4 });
          R.vline(1, { color: 'muted', width: 1, dash: true }); R.hline(0, { color: 'muted', width: 1, dash: true });
          R.line(b, Math.log(b), a, Math.log(a), { color: 'orange', width: 2 });
          R.dot(b, Math.log(b), { r: 5, color: 'orange', label: 'bad year', labelPos: 'se' }); R.dot(a, Math.log(a), { r: 5, color: 'orange', label: 'good year', labelPos: 's' });
          R.line(A, lnG, A, Math.log(A), { color: 'red', width: 2.5 });
          R.dot(A, lnG, { r: 6.5, color: 'red', label: 'mean of ln W', labelPos: 'sw' });
          R.dot(A, Math.log(A), { r: 6.5, color: 'green', label: 'ln of mean', labelPos: 'nw' });
          const end = S.reps.filter((p) => p[T] < 0).length;
          info = { A, G, lnG, lnA: Math.log(A), drift: S.drift, end };
        });
        v.legend([['accent', 'one history'], ['gold', 'median'], ['ink', 'expected drift $t\\ln G$', { dash: true }]]);
        v.readout(() => `Arithmetic mean $A=${v.fix(info.A, 3)}$, geometric mean $G=${v.fix(info.G, 3)}$ ($\\ln G=${v.fix(info.lnG, 4)}$, $\\ln A=${v.fix(info.lnA, 4)}$; the gap is Jensen’s).\nMeasured mean of $\\ln W$ over 40 histories: ${v.fix(info.drift, 4)}. After 300 generations, $X$ is rarer than $Y$ in ${info.end} of 40 histories — ${info.G < 1 ? '$G<1$: $X$ declines' + (info.A > 1 ? ' although $A>1$' : '') : '$G>1$: $X$ takes over' + (info.A < 1 ? ' although $A<1$ (impossible)' : '')}.`);
      },
    },

    // ───────────────────────────────────────────────────────────── 4.13
    {
      num: '4.13',
      kind: 'Phenomenon',
      name: 'Industrial melanism in the peppered moth',
      statement: String.raw`In the peppered moth *Biston betularia* the dark (*carbonaria*) form is controlled by a single dominant allele $C$ and the pale (*typica*) form is the homozygote $cc$. In Britain the dark form was rare before the Industrial Revolution (first recorded near Manchester in 1848), rose to a large majority in industrial regions within a few decades, and declined again after air-pollution controls from the 1950s. Treated as one-locus selection with a dominant allele, the rise from about 1% to about 98% in 47 generations needs selection against *typica* of roughly $s\approx0.25$ per generation, and the decline needs selection against *carbonaria* of order $s\approx0.1$–$0.15$; with $q$ the frequency of $c$ the melanic fraction is $1-q^2$ and, for fitnesses $w_{CC}=w_{Cc}=1$, $w_{cc}=1-s$, $q'=q(1-sq)/(1-sq^2)$.`,
      idea: String.raw`Where soot darkened lichen-free tree trunks, dark moths were better camouflaged and suffered less bird predation; after smoke control, trunks lightened and the advantage reversed (Kettlewell’s mark–recapture experiments of the 1950s, Cook and colleagues’ predation experiments later). Haldane (1924) was the first to turn the rise into a selection coefficient, concluding that the dark form needed a large advantage, about 1.5 times the fitness of *typica*; the decline in the north-west of England, recorded since 1959 at Caldy Common, gave a mirror-image estimate of about a 12% disadvantage (Cook, Mani and Varley, 1986) within a published range of 5–20%. Because the allele is dominant (4.6), both phases are shaped by the sluggish end of the sweep: a rising dominant allele is slow to eliminate the last *typica*, a falling one to remove the last carriers.`,
      caption: String.raw`Two panels, two eras (an idealised single population; the anchor points are approximate values from the literature, not a data table). **Left**: the rise of the melanic phenotype (blue) and of the allele $C$ (dashed) from about 1% in 1848 to about 98% in 1895 for a chosen selection coefficient against *typica*. **Right**: the decline of the melanic form after about 1959 for a chosen coefficient against *carbonaria*. The readout finds, by bisection, the coefficient that joins each pair of anchors, and compares it with the literature. Press “Use fitted values” to set both sliders.`,
      deps: ['popgen-4.6'],
      refs: ['Gillespie', 'Cook & Saccheri 2013, Heredity 110: 207–212', 'Cook, Mani & Varley 1986, Science 231: 611–613'],
      credit: 'Haldane, 1924; Kettlewell, 1955; Cook et al., 1986',
      scope: String.raw`A single-locus, single-population idealisation with one generation per year and constant selection in each era. Real selection varied with place and year, other morphs (*insularia*) exist, and the anchors are approximate: Manchester for the rise, Caldy Common (near Liverpool) for the decline, so the two panels are different populations. The causal role of bird predation was long debated and is now well supported; the dark allele was recently traced to a single transposon insertion in a gene involved in wing pattern (van’t Hof et al., 2016).`,
      tags: ['selection', 'dominance', 'natural selection in action'],
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Peppered_moth_evolution' },
      viz(v) {
        const A1 = { y0: 1848, y1: 1895, f0: 0.01, f1: 0.98 }, A2 = { y0: 1959, y1: 2000, f0: 0.93, f1: 0.1 };
        const sUp = v.slider('selection against pale $cc$, soot era', 0.02, 0.8, 0.25, { step: 0.005 });
        const sDown = v.slider('selection against dark $CC,Cc$, clean-air era', 0.01, 0.5, 0.15, { step: 0.005 });
        const mel = (p) => 1 - (1 - p) * (1 - p);
        const run = (f0, w, n) => { let p = 1 - Math.sqrt(1 - f0); const out = [p]; for (let i = 0; i < n; i++) { p = selStep(p, w); out.push(p); } return out; };
        const fitUp = root((s) => mel(run(A1.f0, [1, 1, 1 - s], A1.y1 - A1.y0)[A1.y1 - A1.y0]) - A1.f1, 0.001, 0.95);
        const fitDown = root((s) => mel(run(A2.f0, [1 - s, 1 - s, 1], A2.y1 - A2.y0)[A2.y1 - A2.y0]) - A2.f1, 0.001, 0.95);
        v.button('Use fitted values', () => { sUp.set(fitUp); sDown.set(fitDown); });
        const L = v.stage({ x: [1845, 1900], y: [0, 1], axes: 'box', gutter: true, height: 320, xlabel: 'year (one generation per year)', ylabel: 'frequency', title: 'The rise of the dark form', minWidth: 300, xticks: [1850, 1860, 1870, 1880, 1890, 1900] });
        const R = v.stage({ x: [1950, 2006], y: [0, 1], axes: 'box', gutter: true, height: 320, xlabel: 'year', ylabel: 'frequency', title: 'The decline after clean-air legislation', minWidth: 300, xticks: [1960, 1970, 1980, 1990, 2000] });
        let info = {};
        v.render(() => {
          const su = sUp.value, sd = sDown.value;
          const up = run(A1.f0, [1, 1, 1 - su], 55), dn = run(A2.f0, [1 - sd, 1 - sd, 1], 46);
          L.path(up.map((p, i) => [A1.y0 + i, mel(p)]), { color: 'accent', width: 3 });
          L.path(up.map((p, i) => [A1.y0 + i, p]), { color: 'accent', width: 1.8, dash: true });
          R.path(dn.map((p, i) => [A2.y0 + i, mel(p)]), { color: 'accent', width: 3 });
          R.path(dn.map((p, i) => [A2.y0 + i, p]), { color: 'accent', width: 1.8, dash: true });
          [[L, A1, 'e1'], [R, A2, 'e2']].forEach(([S, A]) => {
            S.dot(A.y0, A.f0, { r: 6, hollow: true, color: 'orange', label: `≈ ${Math.round(100 * A.f0)}%`, labelPos: A.f0 > 0.5 ? 'e' : 'n' });
            S.dot(A.y1, A.f1, { r: 6, hollow: true, color: 'orange', label: `≈ ${Math.round(100 * A.f1)}%`, labelPos: A.f1 > 0.5 ? 'sw' : 'n' });
          });
          R.vline(1956, { color: 'green', dash: true, width: 1.5 }); R.text('Clean Air Act 1956', 1957, 0.5, { size: 11, color: 'green', align: 'left' });
          info = { fu: mel(up[A1.y1 - A1.y0]), fd: mel(dn[A2.y1 - A2.y0]), su, sd };
        });
        v.legend([['accent', 'melanic phenotype $1-q^2$'], ['accent', 'allele $C$', { dash: true }], ['orange', 'approximate anchors']]);
        v.readout(() => `Rise: with $s=${v.fix(info.su, 3)}$ the dark form goes from 1% to ${v.fix(100 * info.fu, 0)}% in 47 generations; to hit 98% exactly one needs $s=${v.fix(fitUp, 3)}$ (typica fitness ${v.fix(1 - fitUp, 2)} relative to 1; Haldane’s “1.5 times as fit”, from slightly different starting numbers, corresponds to $s\\approx0.33$).\nDecline: with $s=${v.fix(info.sd, 3)}$ the dark form goes from 93% to ${v.fix(100 * info.fd, 0)}% in 41 generations; to reach 10% one needs $s=${v.fix(fitDown, 3)}$ (Cook et al.: about 0.12, within a range of 0.05–0.20).`);
      },
    },

    // ───────────────────────────────────────────────────────────── 4.14
    {
      num: '4.14',
      kind: 'Phenomenon',
      name: 'Rapid evolution of drug and pesticide resistance',
      statement: String.raw`Resistance to an antibiotic, antiviral drug, herbicide or insecticide is usually an allele $R$ that is already present, at low frequency, before the treatment. Without the agent $R$ has a cost: relative fitness $1-c$ against $1$ for the sensitive allele $S$, and recurrent mutation $S\to R$ at rate $\mu$ per generation holds it at the mutation–selection balance $p\approx\mu/c$ (5.1). When the agent kills a fraction $d$ of sensitive individuals, the odds $p/(1-p)$ of $R$ are multiplied each generation by $(1-c)/(1-d)\approx 1+d-c$ (4.2), so $R$ goes from the balance level to near fixation in about $\ln\!\big(p^{-1}\big)/\,(d-c)$ generations, which is tens of generations for a strong treatment. When treatment stops the odds of $R$ are multiplied by $1-c$, so $R$ declines only at the slow rate $c$, and only if sensitive types are still present or return (from untreated refuges, back mutation or migration); otherwise it stays near fixation.`,
      idea: String.raw`This is haploid selection (4.2) with a time-dependent environment: the log-odds of resistance is piecewise linear, with slope $\ln\frac{1-c}{1-d}$ while the drug is on and $\ln(1-c)$ while it is off. Because the starting frequency is so small, a drug is often followed by a sweep from standing variation, with *no new mutation* required; and because the cost $c$ is typically small, the decline after withdrawal is slow, so resistance lingers. Examples include penicillin-resistant *Staphylococcus aureus*, which was reported in hospitals within a few years of the first clinical use of penicillin in the 1940s, and the many cases of insecticide resistance in insects. Combination therapy and refuges work by making $d-c$ small or negative for each resistance allele.`,
      caption: String.raw`The vertical axis is the frequency of resistance on a **logarithmic** scale, so a constant selective advantage is a straight line. Set the mutation rate $\mu$, the cost $c$, the kill rate $d$, the influx $m$ of sensitive types from untreated refuges, and the dates when the drug is applied and withdrawn (the shaded band). The population starts at the balance between mutation, selection and influx. Watch the sweep during treatment, and the slow decline after it; make $c$ larger to see that costly resistance fades faster, and make $d$ small (below $c$) to see that a weak dose does not select for resistance. The model is generic and not a fit to a particular species or drug.`,
      deps: ['popgen-4.2'],
      refs: ['Gillespie'],
      scope: String.raw`Haploid or additive-resistance model, large population, constant cost and kill rate, no drift (resistance mutations arising anew, and loss of rare mutants by drift, matter when $N\mu\lesssim1$), no horizontal transfer, no compensatory mutations, and a constant influx of sensitive types from refuges (without it resistance would never decline); compensatory evolution often removes the cost of resistance, which makes it persist even more.`,
      tags: ['resistance', 'selection', 'applied evolution'],
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Antimicrobial_resistance' },
      viz(v) {
        const sciT = (x) => { const e = Math.floor(Math.log10(x) + 1e-9), m = x / 10 ** e; return `${m.toFixed(1)}×10${String(e).replace('-', '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d])}`; };
        const muS = v.slider('mutation rate $\\mu$ to resistance', 1e-9, 1e-5, 1e-7, { log: true, sig: 2, fmt: sciT });
        const cS = v.slider('cost of resistance $c$', 0.005, 0.3, 0.05, { log: true, sig: 2 });
        const dS = v.slider('kill rate $d$ of sensitive type under the drug', 0.05, 0.95, 0.5, { step: 0.01 });
        const mS = v.slider('influx $m$ of sensitive types from untreated refuges', 1e-5, 0.05, 0.002, { log: true, sig: 2, fmt: sciT });
        const t1S = v.slider('drug applied at generation', 5, 150, 30, { int: true });
        const t2S = v.slider('drug withdrawn at generation', 30, 380, 150, { int: true });
        const T = 400;
        const L = v.stage({ x: [0, T], y: [1e-9, 1], ylog: true, axes: 'box', gutter: true, height: 340, xlabel: 'generation', ylabel: 'frequency (log scale)', title: 'Resistance sweeps, then lingers', minWidth: 320 });
        let info = {};
        v.render(() => {
          const mu = muS.value, c = cS.value, d = dS.value, m = mS.value, t1 = t1S.value, t2 = Math.max(t2S.value, t1 + 1);
          const step = (pR, pS, on) => {
            const wR = 1 - c, wS = on ? 1 - d : 1, wb = pR * wR + pS * wS;
            let r = (pR * wR) / wb, s2 = (pS * wS) / wb;
            r *= 1 - m; s2 = s2 * (1 - m) + m;
            const mt = s2 * mu; return [r + mt, s2 - mt];
          };
          let R = mu / (c + m), S = 1 - R; for (let i = 0; i < 40000; i++) [R, S] = step(R, S, false);
          const p0 = R, ptsR = [[0, R]], ptsS = [[0, S]]; let t50 = null, tend = null;
          for (let t = 1; t <= T; t++) {
            [R, S] = step(R, S, t > t1 && t <= t2); ptsR.push([t, Math.max(R, 1e-12)]); ptsS.push([t, Math.max(S, 1e-12)]);
            if (t50 === null && t > t1 && R >= 0.5) t50 = t - t1;
            if (t === t2) tend = R;
          }
          L.vband(t1, t2, { color: 'orange', alpha: 0.13 });
          L.text('drug on', (t1 + t2) / 2, 3e-9, { size: 12, color: 'orange', align: 'center' });
          L.hline(p0, { color: 'muted', dash: true, width: 1.2 });
          L.path(ptsS, { color: 'orange', width: 2.6 });
          L.path(ptsR, { color: 'accent', width: 3 });
          const ln = Math.log((1 - c) / (1 - d));
          info = { p0, mu, c, d, m, t50, tend, pfinal: R, ln, pred: ln > 0 ? (0 - logit(Math.min(p0, 0.4999))) / ln : null };
        });
        v.legend([['accent', 'resistant allele $R$'], ['orange', 'sensitive allele $S$'], ['muted', 'balance before the drug', { dash: true }]]);
        v.readout(() => `Before the drug: mutation–selection–influx balance $p\\approx\\mu/(c+m)=${v.sci(info.mu / (info.c + info.m), 2)}$ (iterated: $${v.sci(info.p0, 2)}$).\nUnder the drug the log-odds of $R$ grow by $\\ln\\frac{1-c}{1-d}=${v.fix(info.ln, 3)}$ per generation${info.ln > 0 ? `; predicted time from the balance to ½ ≈ $-\\mathrm{logit}(p_0)/${v.fix(info.ln, 3)}=${v.fix(info.pred, 0)}$ generations, simulated ${info.t50 === null ? 'not reached' : info.t50}` : ' — negative: a dose this weak does not select for resistance'}.\nAt withdrawal resistance stands at ${info.tend !== null ? v.fix(info.tend, 3) : '—'}; at generation ${T} it is ${v.fix(info.pfinal, 3)} (the odds of $R$ fall by the factor $1-c$ per generation once sensitive types are present again).`);
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
