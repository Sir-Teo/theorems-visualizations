// Population Genetics & Evolution — Chapter 3: Mutation and neutral variation
import { clamp, memo, binom, wfMutPath, iamStep, homoz, iamF, iamFstar, harm, pois, stirling1, partitions, ewensProb, pow10 } from './ch03.shared.js';

const PCOL = ['blue', 'orange', 'green', 'purple', 'teal', 'pink', 'gold', 'red'];
const sciT = (x) => { const e = Math.floor(Math.log10(x) + 1e-9), m = x / 10 ** e; return `${m.toFixed(1)}×10${String(e).replace('-', '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d])}`; };

export default {
  collection: 'popgen',
  chapter: 3,
  title: 'Mutation and neutral variation',
  summary: String.raw`Mutation supplies the variation that drift removes, and their balance sets the level of neutral diversity. The infinitely-many-alleles and infinitely-many-sites models give exact predictions — heterozygosity $\theta/(1+\theta)$, the Ewens sampling formula — and the elegant fact that the neutral substitution rate equals the mutation rate gives the molecular clock. Kimura’s neutral theory and Lewontin’s paradox frame the long debate about how much of molecular variation is shaped by selection.`,
  items: [
    // ───────────────────────────────────────────────────────────── 3.1
    {
      num: '3.1',
      kind: 'Model',
      name: 'Recurrent mutation and mutation pressure',
      statement: String.raw`Consider one locus with two alleles $A$ and $a$ in an infinite population, with no selection or drift. Each generation a gene copy $A$ mutates to $a$ with probability $\mu$ and a copy $a$ mutates to $A$ with probability $\nu$. The frequency $p$ of $A$ obeys
$$p_{t+1}=p_t(1-\mu)+(1-p_t)\nu,\qquad\text{so}\qquad p_t-p^*=(p_0-p^*)\,(1-\mu-\nu)^t,\quad p^*=\frac{\nu}{\mu+\nu}.$$
Whatever the start, $p_t\to p^*$ geometrically, with time scale $1/(\mu+\nu)$ generations. If $\nu=0$ the frequency of $A$ simply decays as $(1-\mu)^t$: mutation pressure alone drives $A$ toward loss, but at a pace set by $\mu$.`,
      idea: String.raw`The recursion is affine in $p$: $\Delta p=\nu-(\mu+\nu)p$, a straight line in $p$ that crosses zero at $p^*$ with slope $-(\mu+\nu)$. Subtracting $p^*$ from both sides leaves $p_{t+1}-p^*=(1-\mu-\nu)(p_t-p^*)$, so the distance to equilibrium shrinks by a constant factor every generation. For realistic per-locus rates ($10^{-5}$ or smaller) the factor is so close to $1$ that the approach takes tens of thousands of generations — the reason mutation pressure alone is a weak evolutionary force compared with selection, and why the rest of the chapter asks what mutation does in a population of finite size.`,
      caption: String.raw`Choose the two rates (log scale) and the start $p_0$. **Left**: the frequency of $A$ against generation on a logarithmic time axis; it levels off at $p^*$ (green dashed) after about $1/(\mu+\nu)$ generations (gold vertical). Slide the generation marker. **Right**: the per-generation change $\Delta p$ against $p$ is a line through zero at $p^*$; the gold dot is the current state. Set $\nu$ very small to see the one-way case.`,
      deps: ['popgen-1.1'],
      refs: ['Ewens §5.5'],
      scope: String.raw`Deterministic: infinite population, constant mutation rates, no selection. In a finite population, drift adds noise around this path (3.2); with a mutation rate of order $1/N$ or larger it dominates.`,
      tags: ['mutation', 'equilibrium'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Mutation_pressure' },
      viz(v) {
        const muS = v.slider('$\\mu$ ($A\\to a$), log scale', 1e-7, 1e-2, 2e-5, { log: true, fmt: sciT });
        const nuS = v.slider('$\\nu$ ($a\\to A$), log scale', 1e-8, 1e-2, 5e-6, { log: true, fmt: sciT });
        const p0S = v.slider('start frequency $p_0$', 0, 1, 0.95, { step: 0.01 });
        const tS = v.slider('generation $t$', 1, 1e7, 1e5, { log: true, fmt: (x) => (x >= 1000 ? sciT(x) : String(Math.round(x))) });
        const L = v.stage({ x: [1, 1e7], y: [0, 1], xlog: true, axes: 'box', gutter: true, height: 320, xlabel: 'generation', ylabel: 'frequency of A', title: 'Approach to the equilibrium' });
        const R = v.stage({ x: [0, 1], y: [-1, 1], axes: 'box', gutter: true, height: 320, xlabel: 'frequency of A', ylabel: 'change per generation Δp', title: 'The change is a line in $p$', minWidth: 280 });
        let info = {};
        v.render(() => {
          const mu = muS.value, nu = nuS.value, p0 = p0S.value, ps = nu / (mu + nu), lam = 1 - mu - nu;
          const f = (t) => ps + (p0 - ps) * Math.pow(lam, t);
          const t = Math.round(tS.value);
          // honest iteration of the recursion up to generation t (capped), compared with the closed form
          let p = p0; const tt = Math.min(t, 3e6); for (let i = 0; i < tt; i++) p = p * (1 - mu) + (1 - p) * nu;
          L.hline(ps, { color: 'green', dash: true, width: 2 });
          L.vline(1 / (mu + nu), { color: 'gold', dash: true, width: 1.5 });
          L.fn(f, { domain: [1, 1e7], n: 400, color: 'accent', width: 2.8 });
          L.dot(t, f(t), { r: 5.5, color: 'gold' });
          const dm = Math.max(mu, nu) * 1.15, unit = 10 ** Math.floor(Math.log10(dm));
          R.setView([0, 1], [-dm, dm]);
          R.setLabels(undefined, `change per generation Δp (units of ${pow10(Math.round(Math.log10(unit)))})`);
          R.setTicks(undefined, [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter((k) => Math.abs(k * unit) < dm).map((k) => [k * unit, String(k)]));
          R.hline(0, { color: 'muted', width: 1 });
          R.line(0, nu, 1, -mu, { color: 'accent', width: 2.8 });
          R.dot(ps, 0, { r: 5, color: 'green', label: 'p*', labelPos: 'ne' });
          R.dot(f(t), nu - (mu + nu) * f(t), { r: 5.5, color: 'gold' });
          info = { mu, nu, ps, t, pt: f(t), pit: p, tau: 1 / (mu + nu), half: Math.LN2 / (mu + nu), exact: tt === t };
        });
        v.legend([['accent', '$p_t$ and $\\Delta p(p)$'], ['green', 'equilibrium $p^*$', { dash: true }], ['gold', 'time scale $1/(\\mu+\\nu)$ / current state']]);
        v.readout(() => `$p^*=\\nu/(\\mu+\\nu)=${v.fix(info.ps, 4)}$; time scale $1/(\\mu+\\nu)=${v.sci(info.tau, 3)}$ generations (half the distance in $${v.sci(info.half, 3)}$).\nAt $t=${info.t}$: formula $p_t=${v.fix(info.pt, 5)}$, ${info.exact ? 'iterating the recursion gives' : 'iterating 3 million steps gives'} $${v.fix(info.pit, 5)}$ — they agree to 5 decimals.`);
      },
    },

    // ───────────────────────────────────────────────────────────── 3.2
    {
      num: '3.2',
      kind: 'Theorem',
      name: 'Wright’s stationary distribution under mutation and drift',
      statement: String.raw`In the diffusion approximation for a population of $N$ diploid individuals, let allele $A$ mutate to $a$ at rate $u$ and $a$ to $A$ at rate $v$ per generation, with no selection. The frequency $p$ of $A$ has a stationary density that is a Beta distribution,
$$\phi(p)\;\propto\;p^{\,4Nv-1}(1-p)^{\,4Nu-1},\qquad \mathbb E[p]=\frac{v}{u+v},\qquad \operatorname{Var}(p)=\frac{\mathbb E[p](1-\mathbb E[p])}{4N(u+v)+1}.$$
It is U-shaped, piling up near $0$ and $1$, when both $4Nu<1$ and $4Nv<1$, and hump-shaped, concentrated near the mean, when both exceed $1$.`,
      idea: String.raw`The forward Kolmogorov equation of the diffusion (2.11) has drift $v-(u+v)p$ from mutation (3.1) and variance $p(1-p)/2N$ from drift. At stationarity the probability flux vanishes, which leaves a first-order equation for $\phi$ whose solution is $p^{4Nv-1}(1-p)^{4Nu-1}$. The exponents compare the supply of mutants with the pull of drift: each allele arrives at rate $\sim 2Nv$ new copies per generation, and a drift-driven excursion to loss takes about $2N$ generations, so when fewer than one new mutant per $4N$ generations arrives, populations spend most of their time near one boundary.`,
      caption: String.raw`The right panel is the histogram of one long Wright–Fisher run ($N=100$, 80 000 generations after burn-in, exact binomial sampling with two-way mutation); the curve is Wright’s Beta density with the same $4Nu$, $4Nv$. Lower both scaled rates below 1: the histogram turns U-shaped and the population sits near loss or fixation (left panel: a stretch of the run). Raise them above 1: a hump appears at $v/(u+v)$. Make them unequal to tilt it.`,
      deps: ['popgen-2.11', 'popgen-3.1'],
      refs: ['Ewens §4.5', 'Ewens §5.6'],
      credit: 'Sewall Wright, 1931',
      scope: String.raw`Diffusion limit: $N$ large, $u,v$ of order $1/N$, no selection, random mating, constant size. The simulation uses $N=100$, so scaled rates above about 10 push $u,v$ past where the approximation is accurate.`,
      tags: ['mutation', 'drift', 'diffusion'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Beta_distribution' },
      viz(v) {
        const aS = v.slider('$4Nv$ (supply of $A$)', 0.05, 20, 0.5, { log: true, sig: 2 });
        const bS = v.slider('$4Nu$ (supply of $a$)', 0.05, 20, 0.5, { log: true, sig: 2 });
        let seed = 1;
        v.button('New run', () => { seed++; });
        const n = 200, B = 40, T = 80000;
        const Lp = v.stage({ x: [0, 1500], y: [0, 1], axes: 'box', gutter: true, height: 320, xlabel: 'generation (a stretch of the run)', ylabel: 'frequency of A', title: 'One population', weight: 1.1 });
        const Hs = v.stage({ x: [0, 1], y: [0, 3], axes: 'box', gutter: true, height: 320, xlabel: 'frequency of A', ylabel: 'density', title: 'Time spent at each frequency', minWidth: 280 });
        const sim = memo();
        let info = {};
        v.render(() => {
          const a = aS.value, b = bS.value, u = b / (2 * n), vv = a / (2 * n);
          const S = sim(`${a}|${b}|${seed}`, () => {
            const r = v.rng(seed * 13 + 5), path = wfMutPath(r, n, Math.round((n * vv) / (u + vv)), u, vv, T + 3000), bins = new Float64Array(B);
            let sum = 0, sq = 0;
            for (let t = 3000; t <= T + 3000; t++) { const p = path[t] / n; bins[Math.min(B - 1, Math.floor(((path[t] + 0.5) / (n + 1)) * B))]++; sum += p; sq += p * p; }
            const m = sum / (T + 1);
            return { path, bins, m, vr: sq / (T + 1) - m * m };
          });
          const D = v.M.dist.beta(a, b);
          Lp.path(Array.from({ length: 1501 }, (_, i) => [i, S.path[3000 + i] / n]), { color: 'accent', width: 1.5 });
          Lp.hline(a / (a + b), { color: 'green', dash: true, width: 1.8 });
          const dens = Array.from(S.bins, (c) => c / (T + 1) * B);
          const th = dens.map((_, j) => (D.cdf((j + 1) / B) - D.cdf(j / B)) * B);
          const top = Math.min(8, Math.max(1.5, ...dens, ...th) * 1.15);
          Hs.setView([0, 1], [0, top]);
          dens.forEach((d, j) => Hs.rect(j / B, 0, (j + 1) / B, Math.min(top, d), { fill: 'accent', fillAlpha: 0.35, color: 'accent', width: 1 }));
          Hs.clip(() => Hs.fn((x) => D.pdf(clamp(x, 1e-4, 1 - 1e-4)), { domain: [0.004, 0.996], n: 300, color: 'green', width: 2.6 }));
          Hs.vline(a / (a + b), { color: 'green', dash: true, width: 1.2 });
          const shape = a < 1 && b < 1 ? 'U-shaped' : a > 1 && b > 1 ? 'hump-shaped' : 'mixed (J-shaped or skewed)';
          Hs.setTitle(`Time at each frequency: ${shape}`);
          info = { a, b, m: S.m, vr: S.vr, tm: a / (a + b), tv: ((a / (a + b)) * (b / (a + b))) / (a + b + 1) };
        });
        v.legend([['accent', 'simulated run', { area: true }], ['green', 'Wright’s Beta density $p^{4Nv-1}(1-p)^{4Nu-1}$']]);
        v.readout(() => `Mean of $p$: simulation ${v.fix(info.m, 3)}, theory $v/(u+v)=${v.fix(info.tm, 3)}$. Variance: simulation ${v.fix(info.vr, 4)}, theory $\\tfrac{\\bar p\\bar q}{4N(u+v)+1}=${v.fix(info.tv, 4)}$ (parameters $4Nv=${v.fix(info.a, 2)}$, $4Nu=${v.fix(info.b, 2)}$).`);
      },
    },

    // ───────────────────────────────────────────────────────────── 3.3
    {
      num: '3.3',
      kind: 'Model',
      name: 'Infinitely-many-alleles model',
      statement: String.raw`Take the Wright–Fisher population of $N$ diploid individuals ($2N$ gene copies) and let every gene copy, when it is formed, mutate with probability $\mu$ to an allele that has never existed before; the mutation is to an entirely new type, so two copies are identical in state exactly when they descend from a common ancestor copy without an intervening mutation. The state is the list of allele counts $(c_1,c_2,\dots)$, $\sum c_i=2N$. Alleles are born as singletons, drift, and are eventually lost; the number $K$ of different alleles in the population fluctuates around an equilibrium, and the key parameter is $\theta=4N\mu$.`,
      idea: String.raw`The model idealises a locus where the number of possible alleles (DNA sequences) is so large that mutation practically never recreates an existing one. It merges two competing flows: mutation adds a new singleton allele at rate $2N\mu$ per generation, and drift (2.1) removes alleles as they wander to extinction. At equilibrium the two balance, giving an expected number of alleles $\sum_{j=0}^{2N-1}\theta/(\theta+j)$ (which follows from the Ewens formula, 3.5) and a heterozygosity that depends on $N$ and $\mu$ only through $\theta$ (3.4).`,
      caption: String.raw`Each square is a gene copy, coloured by allele; a new colour appears whenever a copy mutates. Press play: colours spread, shrink and vanish, and the population turns over completely in a few $2N$ generations. Right: the number of different alleles $K$ over time (gold dot = now) around its equilibrium expectation (green dashed). Vary $N$ and $\theta$; at small $\theta$ the population is mostly a single allele with an occasional visitor.`,
      deps: ['popgen-3.1', 'popgen-2.3'],
      refs: ['Ewens §3.6'],
      credit: 'Kimura & Crow, 1964',
      scope: String.raw`Neutral alleles, constant size, random mating, mutation always to a novel allele. Sequence-level reality is only approximated: sites mutate back, and nearby sequences are related (3.6, 3.7).`,
      tags: ['mutation', 'alleles', 'drift'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Infinite_alleles_model' },
      viz(v) {
        const NS = v.slider('population size $N$', 10, 50, 25, { int: true });
        const thS = v.slider('$\\theta=4N\\mu$', 0.1, 10, 2, { log: true, sig: 2 });
        let seed = 1;
        v.button('New run', () => { seed++; });
        const G = 400, RATE = 8;
        const Pp = v.stage({ x: [0, 10], y: [0, 10], axes: false, height: 330, title: 'The population: one square per gene copy', minWidth: 300 });
        const Kp = v.stage({ x: [0, G], y: [0, 10], axes: 'box', gutter: true, height: 330, xlabel: 'generation', ylabel: 'number of alleles K', title: 'Alleles present', minWidth: 300 });
        const run = memo();
        let info = {};
        v.animate((t) => {
          const N = NS.value, n = 2 * N, th = thS.value, mu = Math.min(0.3, th / (2 * n));
          const H = run(`${N}|${th}|${seed}`, () => {
            const r = v.rng(seed * 77 + N), ids = { n: 1 }; let al = [[0, n]];
            const hist = [al.map((a) => a.slice())], K = [1]; let lost = 0;
            for (let g = 1; g <= G; g++) {
              const nx = iamStep(r, al, n, mu, ids); const alive = new Set(nx.map((a) => a[0]));
              for (const a of al) if (!alive.has(a[0])) lost++;
              al = nx; hist.push(al.map((a) => a.slice())); K.push(al.length);
            }
            return { hist, K, ids: ids.n - 1, lost };
          });
          const g = Math.min(G, Math.floor(t * RATE)), al = H.hist[g].slice().sort((a, b) => a[0] - b[0]);
          const cols = 10, rows = Math.ceil(n / cols);
          Pp.setView([0, cols], [0, Math.max(rows, 2)]);
          let idx = 0;
          for (const [id, c] of al) {
            const col = PCOL[(id * 3) % 8];
            for (let j = 0; j < c; j++, idx++) { const x = idx % cols, y = Math.floor(idx / cols); Pp.rect(x + 0.06, y + 0.06, x + 0.94, y + 0.94, { fill: col, fillAlpha: 0.75, color: col, width: 0.5 }); }
          }
          let EK = 0; for (let j = 0; j < n; j++) EK += th / (th + j);
          Kp.setView([0, G], [0, Math.max(6, EK * 2, ...H.K) + 1]);
          Kp.hline(EK, { color: 'green', dash: true, width: 2 });
          Kp.path(Array.from({ length: g + 1 }, (_, i) => [i, H.K[i]]), { color: 'accent', width: 1.8 });
          Kp.dot(g, H.K[g], { r: 5, color: 'gold' });
          const from = Math.max(0, g - 150); let m = 0; for (let i = from; i <= g; i++) m += H.K[i]; m /= g - from + 1;
          info = { g, K: H.K[g], EK, m, w: g - from, born: H.ids, N, th, mu };
        }, { period: G / RATE, still: 300 / RATE });
        v.legend([['accent', 'number of alleles $K_t$'], ['green', 'equilibrium expectation $\\sum_j\\theta/(\\theta+j)$', { dash: true }]]);
        v.readout(() => `Generation ${info.g}: ${info.K} alleles among $2N=${2 * info.N}$ copies; $\\mu=\\theta/4N=${v.sci(info.mu, 2)}$ per copy. Average of $K$ over the last ${info.w} generations: ${v.fix(info.m, 1)} (equilibrium expectation ${v.fix(info.EK, 1)}).\nIn the whole 400-generation run ${info.born} new alleles were created.`);
      },
    },

    // ───────────────────────────────────────────────────────────── 3.4
    {
      num: '3.4',
      kind: 'Theorem',
      name: 'Mutation–drift equilibrium heterozygosity θ/(1 + θ)',
      statement: String.raw`In the infinitely-many-alleles model with $N$ diploid individuals and mutation probability $\mu$ per gene copy per generation, let $F_t$ be the probability that two distinct gene copies drawn at random are the same allele and $H_t=1-F_t$ the heterozygosity. Then
$$F_{t+1}=(1-\mu)^2\Bigl[\tfrac1{2N}+\bigl(1-\tfrac1{2N}\bigr)F_t\Bigr],\qquad F^*\approx\frac1{1+4N\mu},\qquad H^*\approx\frac{\theta}{1+\theta},\quad\theta=4N\mu.$$
The equilibrium is approached at rate about $2\mu+1/2N$ per generation, and depends on $N$ and $\mu$ only through their product.`,
      idea: String.raw`Two copies are the same allele if and only if they are identical by descent with no mutation on either line since the common ancestor. Going back one generation, they have a common parent copy with probability $1/2N$ (2.3); otherwise their parents are two distinct copies and are again identical with probability $F_t$; and neither copy may have mutated, which costs $(1-\mu)^2$. Setting $F_{t+1}=F_t$ and ignoring terms of order $\mu^2$ and $\mu/N$ gives $F^*\approx 1/(1+4N\mu)$: the two competing rates are coalescence, $1/2N$ per generation, and mutation, $2\mu$ per generation.`,
      caption: String.raw`**Left**: heterozygosity of one simulated population started with a single allele (blue), the exact expectation from the recursion (green), and the plateau $\theta/(1+\theta)$ (gold dashed). Vary $N$ and $\theta$. **Right**: the equilibrium heterozygosity against $\theta$ on a log axis: the dots are long simulations at $N=10$ and $N=40$ — they fall on one curve although $N$ differs fourfold — and the gold dot is your current setting.`,
      deps: ['popgen-3.3'],
      refs: ['Ewens §3.6', 'Gillespie'],
      credit: 'Kimura & Crow, 1964',
      scope: String.raw`Infinitely-many-alleles model: neutral, constant $N$, random mating, $\mu\ll1$. The formula is an approximation; the exact fixed point of the recursion, also shown in the readout, differs slightly when $\mu$ is not small.`,
      tags: ['heterozygosity', 'mutation', 'drift'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Infinite_alleles_model' },
      viz(v) {
        const NS = v.slider('population size $N$', 5, 200, 30, { int: true, log: true });
        const thS = v.slider('$\\theta=4N\\mu$', 0.05, 20, 1, { log: true, sig: 2 });
        let seed = 1;
        v.button('New run', () => { seed++; });
        const T = 3000;
        const Lp = v.stage({ x: [0, T], y: [0, 1], axes: 'box', gutter: true, height: 320, xlabel: 'generation', ylabel: 'heterozygosity H', title: 'Variation builds up to a plateau' });
        const Rp = v.stage({ x: [0.03, 30], y: [0, 1], xlog: true, axes: 'box', gutter: true, height: 320, xlabel: 'θ = 4Nμ', ylabel: 'equilibrium heterozygosity', title: 'The plateau depends on θ only', minWidth: 300 });
        const run = memo(), grid = memo();
        let info = {};
        v.render(() => {
          const N = NS.value, n = 2 * N, th = thS.value, mu = Math.min(0.3, th / (2 * n));
          const S = run(`${N}|${th}|${seed}`, () => {
            const r = v.rng(seed * 31 + N), ids = { n: 1 }; let al = [[0, n]]; const H = new Float64Array(T + 1); let acc = 0, cnt = 0;
            for (let t = 1; t <= T; t++) { al = iamStep(r, al, n, mu, ids); H[t] = 1 - homoz(al, n); if (t > T / 3) { acc += H[t]; cnt++; } }
            return { H, mean: acc / cnt };
          });
          const Fx = iamF(n, mu, 1, T);
          Lp.hline(th / (1 + th), { color: 'gold', dash: true, width: 2 });
          Lp.path(Array.from(S.H, (h, t) => [t, h]), { color: 'accent', width: 1.4 });
          Lp.path(Array.from(Fx, (f, t) => [t, 1 - f]), { color: 'green', width: 2.6 });
          const G = grid('g', () => {
            const out = [];
            [[10, 'blue'], [40, 'orange']].forEach(([NN, col], k) => [0.1, 0.3, 1, 3, 10].forEach((tt, j) => {
              const nn = 2 * NN, m = tt / (2 * nn), r = v.rng(900 + k * 10 + j), ids = { n: 1 }; let al = [[0, nn]], acc = 0, cnt = 0;
              for (let t = 1; t <= 12000; t++) { al = iamStep(r, al, nn, m, ids); if (t > 600) { acc += 1 - homoz(al, nn); cnt++; } }
              out.push([tt, acc / cnt, col]);
            }));
            return out;
          });
          Rp.fn((x) => x / (1 + x), { domain: [0.03, 30], n: 200, color: 'green', width: 2.6 });
          G.forEach(([x, y, c]) => Rp.dot(x, y, { r: 4.5, color: c }));
          Rp.dot(th, S.mean, { r: 6.5, color: 'gold' });
          Rp.vline(th, { color: 'gold', dash: true, width: 1 });
          info = { N, th, mu, mean: S.mean, pred: th / (1 + th), exact: 1 - iamFstar(n, mu) };
        });
        v.legend([['accent', 'one simulated population'], ['green', 'recursion / $\\theta/(1+\\theta)$'], ['gold', 'plateau $\\theta/(1+\\theta)$ / your run', { dash: true }], ['blue', 'long runs, $N=10$', { dot: true }], ['orange', 'long runs, $N=40$', { dot: true }]]);
        v.readout(() => `$N=${info.N}$, $\\mu=\\theta/4N=${v.sci(info.mu, 2)}$: average $H$ over the last two thirds of the run ${v.fix(info.mean, 3)}; $\\theta/(1+\\theta)=${v.fix(info.pred, 3)}$; exact fixed point of the recursion ${v.fix(info.exact, 3)}.`);
      },
    },

    // ───────────────────────────────────────────────────────────── 3.5
    {
      num: '3.5',
      kind: 'Theorem',
      name: 'Ewens sampling formula',
      statement: String.raw`In a population at equilibrium under the neutral infinitely-many-alleles model with $\theta=4N\mu$, draw a sample of $n$ gene copies, and let $a_j$ be the number of alleles represented exactly $j$ times in the sample ($\sum_j j a_j=n$). Then
$$\Pr(a_1,\dots,a_n)=\frac{n!}{\theta(\theta+1)\cdots(\theta+n-1)}\prod_{j=1}^{n}\frac{(\theta/j)^{a_j}}{a_j!}.$$
The number of distinct alleles $K=\sum_j a_j$ has $\Pr(K=k)=|s(n,k)|\,\theta^k/\theta^{(n)}$ ($|s|$ unsigned Stirling numbers of the first kind), $\mathbb E K=\sum_{j=0}^{n-1}\theta/(\theta+j)$, and $K$ is a sufficient statistic for $\theta$: given $K$, the configuration has a distribution that does not involve $\theta$.`,
      idea: String.raw`Sampling formula and process are the same thing seen in two ways: tracing the $n$ sampled genes backward, each pair merges with the right probability, and every ancestral lineage reaches a mutation before merging with probability $\theta/(\theta+j)$ when $j$ lineages remain. This is equivalent to a Hoppe urn: the $(j+1)$st gene is a new allele with probability $\theta/(\theta+j)$ and otherwise copies a uniformly chosen earlier gene. Multiplying these probabilities gives the product above. The $\theta$-dependence enters only through $\theta^K/\theta^{(n)}$, which is what makes $K$ sufficient — the allele *sizes* in the sample say nothing more about $\theta$.`,
      caption: String.raw`A Wright–Fisher population ($N=30$, exact simulation) is run for 120 000 generations; every 15 generations a sample of $n$ genes is taken and its allele-count configuration (e.g. 3 2 1 = one allele seen 3 times, one twice, one once) recorded. **Left**: observed frequency of each configuration (bars) against the Ewens formula (green dots). **Right**: the likelihood of $\theta$ from the two most recently drawn samples (button **Draw samples**); samples with the same number of alleles have *identical* normalised curves even if their configurations differ.`,
      deps: ['popgen-3.4', 'popgen-2.1'],
      refs: ['Ewens §9.5'],
      credit: 'Warren Ewens, 1972',
      scope: String.raw`Neutral, constant size, infinitely-many-alleles model at equilibrium, a sample small relative to $2N$ (the simulation samples without replacement from $2N=60$ copies, so $n\le8$ keeps the finite-population correction small). The original dependency on the Hoppe urn (stoch-14.5 in the syllabus) was replaced: that item is about reflected random walks.`,
      tags: ['sampling', 'mutation', 'neutral theory'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Ewens%27s_sampling_formula' },
      viz(v) {
        const nS = v.slider('sample size $n$', 4, 8, 6, { int: true });
        const thS = v.slider('$\\theta=4N\\mu$', 0.2, 8, 1.5, { log: true, sig: 2 });
        let seed = 1;
        v.button('Draw samples', () => { seed++; });
        const NN = 30, nn = 2 * NN, SAMPLES = 8000, GAP = 15;
        const Bp = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 340, xlabel: 'configuration (sizes of the allele classes)', ylabel: 'probability', title: 'Allele-count configurations', weight: 1.3, minWidth: 320 });
        const Lk = v.stage({ x: [0.05, 20], y: [0, 1.05], xlog: true, axes: 'box', gutter: true, height: 340, xlabel: 'θ', ylabel: 'likelihood (max = 1)', title: 'Likelihood of θ from a sample', minWidth: 280 });
        const run = memo();
        let info = {};
        v.render(() => {
          const n = nS.value, th = thS.value, mu = Math.min(0.3, th / (2 * nn));
          const parts = partitions(n);
          const D = run(`${n}|${th}|${seed}`, () => {
            const r = v.rng(seed * 17 + 3), ids = { n: 1 }; let al = [[0, nn]]; const cnt = new Map(parts.map((p, i) => [p.parts.join(' '), 0])), Kc = new Float64Array(n + 1), last = [];
            for (let t = 1; t <= SAMPLES * GAP + 600; t++) {
              al = iamStep(r, al, nn, mu, ids);
              if (t > 600 && t % GAP === 0) {
                const c = al.map((a) => a[1]); let tot = nn; const got = new Map();
                for (let i = 0; i < n; i++) { let x = r() * tot, j = 0; while (x >= c[j]) { x -= c[j]; j++; } c[j]--; tot--; got.set(j, (got.get(j) || 0) + 1); }
                const key = [...got.values()].sort((a, b) => b - a).join(' '); cnt.set(key, cnt.get(key) + 1); Kc[got.size]++;
                last.push({ key, K: got.size }); if (last.length > 2) last.shift();
              }
            }
            return { cnt, Kc, last };
          });
          const m = parts.length;
          Bp.setView([-0.5, m - 0.5], [0, 1]);
          const pr = parts.map((p) => ewensProb(p.a, n, th)), ob = parts.map((p) => D.cnt.get(p.parts.join(' ')) / SAMPLES);
          Bp.setView([-0.5, m - 0.5], [0, Math.max(...pr, ...ob) * 1.2]);
          Bp.setTicks(parts.map((p, i) => [i, p.parts.join('')]), null);
          ob.forEach((y, i) => Bp.rect(i - 0.34, 0, i + 0.34, y, { fill: 'accent', fillAlpha: 0.5, color: 'accent', width: 1 }));
          pr.forEach((y, i) => Bp.dot(i, y, { r: 4.5, color: 'green' }));
          let tv = 0; ob.forEach((y, i) => { tv += Math.abs(y - pr[i]) / 2; });
          // likelihood of theta from the last two samples: L(θ) ∝ θ^K / θ^(n)
          const lik = (K) => { const f = (x) => { let lg = K * Math.log(x); for (let j = 0; j < n; j++) lg -= Math.log(x + j); return lg; }; let mx = -1e9; for (let i = 0; i <= 200; i++) mx = Math.max(mx, f(0.05 * 400 ** (i / 200))); return (x) => Math.exp(f(x) - mx); };
          D.last.forEach((s, i) => { const col = i ? 'orange' : 'purple'; Lk.fn(lik(s.K), { domain: [0.05, 20], n: 200, color: col, width: 2.4 - i * 0.6, dash: i ? [6, 4] : false }); Lk.text(`${s.key.split(' ').join('·')} (K=${s.K})`, 0.07, 0.95 - 0.09 * i, { color: col, size: 11.5, weight: 600 }); });
          Lk.vline(th, { color: 'green', dash: true, width: 1.5 });
          let EK = 0; for (let j = 0; j < n; j++) EK += th / (th + j);
          let mK = 0; for (let k = 1; k <= n; k++) mK += k * D.Kc[k] / SAMPLES;
          info = { tv, EK, mK, last: D.last, sum: pr.reduce((a, b) => a + b, 0), m, th };
        });
        v.legend([['accent', 'simulated frequency', { area: true }], ['green', 'Ewens formula', { dot: true }], ['purple', 'sample 1'], ['orange', 'sample 2', { dash: true }]]);
        v.readout(() => `${info.m} configurations; Ewens probabilities sum to ${v.fix(info.sum, 6)}; total-variation distance simulation vs formula ${v.fix(info.tv, 3)}. Mean number of alleles in a sample: simulated ${v.fix(info.mK, 2)}, formula ${v.fix(info.EK, 2)}.\nLast two samples: ${info.last.map((s) => `${s.key} (K = ${s.K})`).join(' and ')}${info.last.length === 2 && info.last[0].K === info.last[1].K ? ' — the same $K$, hence the same likelihood curve' : ''}. Green line = the true $\\theta$.`);
      },
    },

    // ───────────────────────────────────────────────────────────── 3.6
    {
      num: '3.6',
      kind: 'Model',
      name: 'Infinitely-many-sites model',
      statement: String.raw`Model a long stretch of DNA as a continuum of sites, so long that each new mutation hits a site that has never mutated before. Mutations arrive on each gene lineage at rate $\mu_{\rm seq}$ per generation for the whole stretch, in a neutral population of $2N$ copies, $\theta=4N\mu_{\rm seq}$. Then every mutation occupies its own column of an alignment of a sample, each column splits the sample into carriers (derived) and non-carriers (ancestral), the columns are nested or disjoint (a perfect phylogeny), and the expected number of segregating sites in a sample of $n$ is
$$\mathbb E[S]=\theta\sum_{j=1}^{n-1}\frac1j=\theta\,a_n.$$`,
      idea: String.raw`Because no site mutates twice, a mutation on a branch of the sample’s genealogy is inherited by exactly the leaves below it; two mutations on different branches therefore never produce all four combinations of states (the four-gamete test). The genealogy’s total branch length $L_{\rm tot}$ is a sum of independent exponential waiting times — $k$ lineages for a time of mean $2/(k(k-1))$ in units of $2N$ generations — so $\mathbb E L_{\rm tot}=2a_n$, and mutations fall on it at rate $\theta/2$. The picture uses the coalescent only as an exact sampler of neutral genealogies.`,
      caption: String.raw`A sample of $n$ sequences: genealogy on the left (time runs from the root on the left to the present on the right; dots are mutations, numbered), alignment on the right (orange = derived allele). Each numbered mutation is a column that marks the leaves below its branch. Click **New sample** for a fresh genealogy. Switch to **8 sites** to break the model: mutations now hit the same site twice, columns no longer match single branches, and the four-gamete test starts to fail.`,
      deps: ['popgen-3.1'],
      refs: ['Ewens §9.6'],
      credit: 'Motoo Kimura, 1969 (model); G. A. Watterson, 1975 ($\\mathbb E S$)',
      scope: String.raw`Neutral, constant size, no recombination, no repeat mutation (the “sites” are effectively infinite). Real genomes recombine, so different regions have different genealogies.`,
      tags: ['mutation', 'sites', 'coalescent'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Infinite_sites_model' },
      viz(v) {
        const nS = v.slider('sample size $n$', 4, 14, 9, { int: true });
        const thS = v.slider('$\\theta=4N\\mu_{\\rm seq}$', 0.5, 15, 4, { log: true, sig: 2 });
        const siteS = v.select('sites', [{ value: 'inf', label: 'infinitely many' }, { value: 'fin', label: '8 sites only' }], 'inf');
        let seed = 1;
        v.button('New sample', () => { seed++; });
        const Tp = v.stage({ x: [-3, 0], y: [-0.5, 8.5], axes: false, height: 360, title: 'Genealogy with mutations', weight: 1.1, minWidth: 300 });
        const Ap = v.stage({ x: [0, 10], y: [-0.5, 8.5], axes: false, height: 360, title: 'Alignment (row = leaf, column = site)', minWidth: 280 });
        const gen = memo(), reps = memo();
        let info = {};
        const build = (r, n, th, L) => {
          const nodes = []; for (let i = 0; i < n; i++) nodes.push({ t: 0, kids: null });
          let act = Array.from({ length: n }, (_, i) => i), t = 0, tot = 0;
          while (act.length > 1) {
            const k = act.length; const dt = -Math.log(1 - r()) / ((k * (k - 1)) / 2); t += dt; tot += k * dt;
            const i = Math.floor(r() * k); const a = act.splice(i, 1)[0]; const j = Math.floor(r() * (k - 1)); const b = act.splice(j, 1)[0];
            nodes.push({ t, kids: [a, b] }); act.push(nodes.length - 1);
          }
          return { nodes, root: nodes.length - 1, tot };
        };
        v.render(() => {
          const n = nS.value, th = thS.value, finite = siteS.value === 'fin', Ls = 8;
          const G = gen(`${n}|${th}|${finite}|${seed}`, () => {
            const r = v.rng(seed * 101 + n * 7 + Math.round(th * 10)), { nodes, root, tot } = build(r, n, th);
            const y = new Array(nodes.length), order = []; // leaf order by depth-first traversal
            (function dfs(i) { if (!nodes[i].kids) { y[i] = order.length; order.push(i); } else { nodes[i].kids.forEach(dfs); y[i] = (y[nodes[i].kids[0]] + y[nodes[i].kids[1]]) / 2; } })(root);
            const par = new Array(nodes.length).fill(-1); nodes.forEach((nd, i) => { if (nd.kids) nd.kids.forEach((c) => { par[c] = i; }); });
            const below = (i) => (nodes[i].kids ? nodes[i].kids.flatMap(below) : [i]);
            const muts = [];
            for (let i = 0; i < nodes.length; i++) if (par[i] >= 0) { const len = nodes[par[i]].t - nodes[i].t, k = pois(r, (th / 2) * len); for (let j = 0; j < k; j++) muts.push({ node: i, t: nodes[i].t + r() * len, pos: r(), site: Math.floor(r() * Ls), leaves: below(i) }); }
            let cols;
            if (!finite) { muts.sort((a, b) => a.pos - b.pos); cols = muts.map((m) => { const c = new Array(n).fill(0); m.leaves.forEach((l) => { c[l] = 1; }); return c; }); muts.forEach((m, i) => { m.col = i; }); }
            else { cols = Array.from({ length: Ls }, () => new Array(n).fill(0)); muts.sort((a, b) => b.t - a.t); muts.forEach((m) => { m.leaves.forEach((l) => { cols[m.site][l] ^= 1; }); m.col = m.site; }); }
            let bad = 0; for (let a = 0; a < cols.length; a++) for (let b = a + 1; b < cols.length; b++) { const s = new Set(); for (let l = 0; l < n; l++) s.add(cols[a][l] * 2 + cols[b][l]); if (s.size === 4) bad++; }
            const seg = cols.filter((c) => { const s = c.reduce((p, q) => p + q, 0); return s > 0 && s < n; }).length;
            return { nodes, root, y, order, muts, cols, bad, seg, tot, par };
          });
          const R = reps(`${n}|${th}`, () => { const r = v.rng(5 + n), tot = []; for (let i = 0; i < 400; i++) tot.push(build(r, n).tot); return tot; });
          const { nodes, y, muts, cols } = G, rootT = nodes[G.root].t, ymax = n - 1;
          Tp.setView([-Math.max(rootT, 0.4) * 1.08, 0.05], [-0.7, ymax + 0.7]);
          Ap.setView([-0.2, Math.max(cols.length, 6) + 0.2], [-0.7, ymax + 0.7]);
          const colr = 'ink';
          nodes.forEach((nd, i) => {
            if (!nd.kids) return;
            const ys = nd.kids.map((c) => y[c]);
            Tp.line(-nd.t, ys[0], -nd.t, ys[1], { color: colr, width: 1.6 });
            nd.kids.forEach((c) => Tp.line(-nd.t, y[c], -nodes[c].t, y[c], { color: colr, width: 1.6 }));
          });
          muts.forEach((m) => { const yy = y[m.node]; Tp.dot(-m.t, yy, { r: 4.2, color: 'orange' }); if (muts.length <= 26) Tp.text(String(m.col + 1), -m.t, yy, { size: 9, dy: -9, align: 'center', color: 'muted' }); });
          const C = Math.max(cols.length, 6);
          for (let c = 0; c < cols.length; c++) for (let l = 0; l < n; l++) {
            const row = G.y[G.order[l]]; const der = cols[c][G.order[l]];
            Ap.rect(c + 0.06, row - 0.4, c + 0.94, row + 0.4, { fill: der ? 'orange' : 'grid', fillAlpha: der ? 0.8 : 0.35, stroke: false });
          }
          if (!cols.length) Ap.text('no mutations in this sample', C / 2, ymax / 2, { align: 'center', color: 'muted', size: 13 });
          const meanS = R.reduce((a, b) => a + b, 0) / R.length / 2 * th;
          info = { S: muts.length, seg: G.seg, ES: th * harm(n), meanS, bad: G.bad, finite, n, cols: cols.length, th, tot: G.tot };
        });
        v.legend([['orange', 'mutation / derived allele', { dot: true }]]);
        v.readout(() => `This sample: ${info.S} mutations, ${info.seg} segregating column${info.seg === 1 ? '' : 's'}; $\\mathbb E[S]=\\theta a_n=${v.fix(info.ES, 2)}$ (mean of 400 further genealogies: $\\tfrac\\theta2\\,\\bar L_{\\rm tot}=${v.fix(info.meanS, 2)}$).\nFour-gamete test: ${info.bad} incompatible column pair${info.bad === 1 ? '' : 's'}${info.finite ? (info.bad ? ' — repeat mutation has broken the perfect phylogeny.' : ' (with only 8 sites a repeat hit is not certain; draw more samples).') : ' — as required, since no site mutates twice.'}`);
      },
    },
  ],
};
