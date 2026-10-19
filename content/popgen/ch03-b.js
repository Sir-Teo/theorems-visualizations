import {clockPoisson,summarizeClock} from './clock-model.shared.js';
import {KIMURA_1968,kimuraBudget,diversityModel} from './historical-models.shared.js';
// Population Genetics & Evolution — Chapter 3 (part b): stepwise mutation, substitution, clock, neutral theory, age, Lewontin, Kimura 1968
import { clamp, memo, binom, siteNext, pois, gammaDraw, harm, pow10 } from './ch03.shared.js';

const sciT = (x) => { const e = Math.floor(Math.log10(x) + 1e-9), m = x / 10 ** e; return `${m.toFixed(1)}×10${String(e).replace('-', '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d])}`; };

/** Stepwise-mutation WF generation: al = [[size, count], …] sorted by size; each copy mutates to size ± 1 with total prob mu. */
function smmStep(r, al, n, mu) {
  let rem = n, pleft = 1; const out = [];
  for (let i = 0; i < al.length && rem > 0; i++) {
    const p = al[i][1] / n; let c;
    if (i === al.length - 1 || p >= pleft - 1e-12) c = rem; else c = binom(r, rem, Math.min(1, p / pleft));
    pleft -= p; rem -= c; if (c > 0) out.push([al[i][0], c]);
  }
  const mut = [];
  for (const a of out) { const m = binom(r, a[1], mu); if (m) { a[1] -= m; const up = binom(r, m, 0.5); mut.push([a[0] + 1, up], [a[0] - 1, m - up]); } }
  const all = out.concat(mut).filter((a) => a[1] > 0).sort((x, y) => x[0] - y[0]), res = [];
  for (const a of all) { if (res.length && res[res.length - 1][0] === a[0]) res[res.length - 1][1] += a[1]; else res.push(a); }
  return res;
}
const homozyg = (al, n) => al.reduce((s, a) => s + (a[1] / n) ** 2, 0);

/** Neutral/selected independent sites: returns cumulative number of fixations per generation and totals. */
function substRun(r, n, mu, s, T) {
  let ks = [], fixed = 0, arisen = 0; const cum = new Int32Array(T + 1);
  for (let t = -3 * n; t <= T; t++) {
    if (t === 1) { fixed = 0; arisen = 0; }
    const nx = [];
    for (let i = 0; i < ks.length; i++) { const k = siteNext(r, n, ks[i], s); if (k === n) fixed++; else if (k > 0) nx.push(k); }
    const m = pois(r, n * mu); arisen += m; for (let j = 0; j < m; j++) nx.push(1);
    ks = nx; if (t >= 1) cum[t] = fixed;
  }
  return { cum, fixed, arisen };
}
/** Fixation probability of a single new copy among n with haploid-type selection s (diffusion). */
const ufix = (n, s) => (Math.abs(s) < 1e-12 ? 1 / n : (1 - Math.exp(-2 * s)) / (1 - Math.exp(-2 * n * s)));

export default {
  collection: 'popgen',
  chapter: 3,
  items: [
    // ───────────────────────────────────────────────────────────── 3.7
    {
      num: '3.7',
      kind: 'Model',
      name: 'Stepwise mutation model',
      statement: String.raw`Let the allele of a gene copy be an integer $x$, such as the number of repeat units at a microsatellite. When a copy is formed it mutates with probability $\mu$, and a mutant has size $x+1$ or $x-1$ with probability $\tfrac12$ each; otherwise it keeps $x$. In a neutral Wright–Fisher population of $2N$ copies with $\theta=4N\mu$, two copies can have the same size without being identical by descent, because different lineages wander to the same value. The equilibrium homozygosity and heterozygosity are
$$F_{\rm state}\approx\frac1{\sqrt{1+2\theta}},\qquad H\approx 1-\frac{1}{\sqrt{1+2\theta}},$$
and the variance of allele size within a population is about $\theta/2$ repeat units squared.`,
      idea: String.raw`Identity in state means that the difference of two copies’ sizes, a random walk with one $\pm1$ step per mutation on either of the two lineages back to their common ancestor, is back at zero when the walk stops. If the two copies are $T$ generations from their common ancestor, they have received on average $2\mu T$ steps, and the chance of a zero net displacement of a symmetric walk after $m$ steps is $\sim 1/\sqrt{\pi m/2}$ for large $m$. Averaging over the exponential distribution of $T$ (mean $2N$, as in 2.3) gives the square-root law. Compared with the infinitely-many-alleles value $\theta/(1+\theta)$ the stepwise heterozygosity is lower, because chance recurrence of the same length hides some of the history.`,
      caption: String.raw`**Left**: the allele-size distribution (repeat number relative to the mean) of one simulated population at the end of 600 generations. **Right**: equilibrium heterozygosity against $\theta$: the green curve is the infinite-alleles value $\theta/(1+\theta)$, the purple curve the stepwise value $1-1/\sqrt{1+2\theta}$ (Ohta–Kimura); the dots are long simulations with $N=25$; the gold dot is your setting averaged over a 3000-generation run. At large $\theta$ the stepwise curve runs well below the green one.`,
      deps: ['popgen-3.1', 'comb-1.19'],
      refs: ['Nielsen–Slatkin'],
      credit: 'Tomoko Ohta & Motoo Kimura, 1973',
      scope: String.raw`Neutral, constant size, strict $\pm1$ steps with no size bounds. Real microsatellites show biased steps, multi-step mutations and length constraints; the square-root formula is accurate for $\theta$ of order 1 and the strict stepwise assumption.`,
      tags: ['mutation', 'microsatellites', 'heterozygosity'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Microsatellite' },
      viz(v) {
        const NS = v.slider('population size $N$', 5, 100, 25, { int: true });
        const thS = v.slider('$\\theta=4N\\mu$', 0.1, 20, 2, { log: true, sig: 2 });
        let seed = 1;
        v.button('New run', () => { seed++; });
        const Lp = v.stage({ x: [-12, 12], y: [0, 1], axes: 'box', gutter: true, height: 320, xlabel: 'repeat number minus population mean', ylabel: 'fraction of copies', title: 'Allele sizes in one population', minWidth: 300 });
        const Rp = v.stage({ x: [0.05, 30], y: [0, 1], xlog: true, axes: 'box', gutter: true, height: 320, xlabel: 'θ = 4Nμ', ylabel: 'equilibrium heterozygosity', title: 'Stepwise vs infinitely many alleles', minWidth: 300 });
        const run = memo(), grid = memo();
        let info = {};
        v.render(() => {
          const N = NS.value, n = 2 * N, th = thS.value, mu = Math.min(0.45, th / (2 * n));
          const S = run(`${N}|${th}|${seed}`, () => {
            const r = v.rng(seed * 19 + N); let al = [[0, n]], snap = null, hs = 0, vs = 0, c = 0;
            for (let t = 1; t <= 3000; t++) {
              al = smmStep(r, al, n, mu);
              if (t === 600) snap = al.map((a) => a.slice());
              if (t > 300) { hs += 1 - homozyg(al, n); let m = 0, q = 0; for (const a of al) { m += a[0] * a[1]; q += a[0] * a[0] * a[1]; } m /= n; vs += q / n - m * m; c++; }
            }
            return { snap, H: hs / c, V: vs / c };
          });
          const m = S.snap.reduce((s, a) => s + a[0] * a[1], 0) / n, off = Math.round(m);
          Lp.setView([-12, 12], [0, Math.max(0.2, ...S.snap.map((a) => a[1] / n)) * 1.15]);
          S.snap.forEach(([x, c]) => { const xx = x - off; if (Math.abs(xx) <= 12) Lp.rect(xx - 0.4, 0, xx + 0.4, c / n, { fill: 'purple', fillAlpha: 0.55, color: 'purple', width: 1 }); });
          const G = grid('g', () => {
            const out = []; const nn = 50;
            [0.1, 0.3, 1, 3, 10].forEach((tt, j) => {
              const r = v.rng(2000 + j), m2 = tt / (2 * nn); let al = [[0, nn]], acc = 0, c = 0;
              for (let t = 1; t <= 12000; t++) { al = smmStep(r, al, nn, m2); if (t > 1000) { acc += 1 - homozyg(al, nn); c++; } }
              out.push([tt, acc / c]);
            });
            return out;
          });
          Rp.fn((x) => x / (1 + x), { domain: [0.05, 30], n: 200, color: 'green', width: 2.4 });
          Rp.fn((x) => 1 - 1 / Math.sqrt(1 + 2 * x), { domain: [0.05, 30], n: 200, color: 'purple', width: 2.6 });
          G.forEach(([x, y]) => Rp.dot(x, y, { r: 4.5, color: 'purple' }));
          Rp.dot(th, S.H, { r: 6.5, color: 'gold' });
          info = { th, H: S.H, Hs: 1 - 1 / Math.sqrt(1 + 2 * th), Hi: th / (1 + th), V: S.V, sizes: S.snap.length };
        });
        v.legend([['purple', 'stepwise: $1-1/\\sqrt{1+2\\theta}$'], ['green', 'infinite alleles: $\\theta/(1+\\theta)$'], ['purple', 'long runs, $N=25$', { dot: true }], ['gold', 'your setting', { dot: true }]]);
        v.readout(() => `$\\theta=${v.fix(info.th, 2)}$: heterozygosity simulated ${v.fix(info.H, 3)}, stepwise formula ${v.fix(info.Hs, 3)}, infinitely-many-alleles ${v.fix(info.Hi, 3)}. Size variance averaged over the run ${v.fix(info.V, 2)} vs $\\theta/2=${v.fix(info.th / 2, 2)}$.\nTwo copies are identical by *descent* with probability $1/(1+\\theta)=${v.fix(1 - info.Hi, 3)}$ but identical in *state* with probability ${v.fix(1 - info.Hs, 3)} — the excess is chance recurrence of a length.`);
      },
    },

    // ───────────────────────────────────────────────────────────── 3.8
    {
      num: '3.8',
      kind: 'Theorem',
      name: 'Neutral substitution rate equals the mutation rate',
      statement: String.raw`In a neutral diploid population of $N$ individuals ($2N$ gene copies), suppose each gene copy gives rise to a new, selectively neutral mutation at rate $\mu$ per generation. New mutations arise at total rate $2N\mu$ per generation, and each fixes with probability $1/2N$ (2.4). The rate of substitution, the number of mutations fixed per generation, is therefore
$$k=2N\mu\cdot\frac1{2N}=\mu,$$
independent of the population size. If instead a mutation has selection coefficient $s$, the rate is $k=2N\mu\,u(s)$ with $u$ its fixation probability, which depends on $N$.`,
      idea: String.raw`Two opposite dependences on $N$ cancel exactly. A large population has more copies and so receives more mutations, in proportion to $2N$; but each mutant starts at frequency $1/2N$, and since a neutral allele is fixed with probability equal to its frequency (2.4, from the martingale property 2.2), the chance that a particular mutation takes over falls in the same proportion. Selection breaks the cancellation: a beneficial mutation has $u\gg1/2N$ and a harmful one $u\ll1/2N$, and how far depends on $N$.`,
      caption: String.raw`Three populations ($N=25,\ 100,\ 400$) are simulated for 6 000 generations, after a start-up period of $6N$ generations so that substitutions already in transit are counted; every new mutation sits at its own, unlinked site. **Left**: cumulative number of substitutions; the dashed line is $\mu t$. **Right** (log scale): per population, mutations arising per generation $2N\mu$ (blue), the fixation probability of one (orange), and their product, the predicted substitution rate (green); the gold dot with its 95% interval is the measured rate. Switch from **neutral** to $s=\pm0.005$ to break the cancellation.`,
      deps: ['popgen-2.4', 'popgen-3.1'],
      refs: ['Gillespie'],
      credit: 'Motoo Kimura, 1968',
      scope: String.raw`Neutral mutations at independent sites (free recombination between them), constant size, mutations that arise on a unique copy. For the selected cases the simulation uses haploid-type selection on the $2N$ copies and the fixation formula $u=(1-e^{-2s})/(1-e^{-4Ns})$.`,
      tags: ['substitution', 'neutral theory', 'fixation'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Neutral_theory_of_molecular_evolution' },
      viz(v) {
        const muS = v.slider('mutation rate $\\mu$ per copy per generation', 0.002, 0.02, 0.01, { log: true, sig: 2 });
        const selS = v.select('mutations are', [{ value: 0, label: 'neutral' }, { value: 0.005, label: 'beneficial $s=+0.005$' }, { value: -0.005, label: 'harmful $s=-0.005$' }], 0);
        let seed = 1;
        v.button('New run', () => { seed++; });
        const Ns = [25, 100, 400], COL = ['blue', 'orange', 'green'], T = 6000;
        const Lp = v.stage({ x: [0, T], y: [0, 100], axes: 'box', gutter: true, height: 320, xlabel: 'generation', ylabel: 'cumulative substitutions', title: 'Substitutions accumulate at a constant rate', minWidth: 300 });
        const Rp = v.stage({ x: [-0.6, 2.6], y: [1e-4, 100], ylog: true, axes: 'box', gutter: true, height: 320, xlabel: 'population size N', ylabel: 'per generation', title: 'Arrival × fixation = substitution', xticks: [[0, '25'], [1, '100'], [2, '400']], minWidth: 300 });
        const sim = memo();
        let info = {};
        v.render(() => {
          const mu = muS.value, s = Number(selS.value);
          const D = sim(`${mu}|${s}|${seed}`, () => Ns.map((N, i) => substRun(v.rng(seed * 1000 + i * 17 + 3), 2 * N, mu, s, T)));
          let top = mu * T * 1.3; D.forEach((d, i) => { top = Math.max(top, d.cum[T] * 1.1, 10); });
          Lp.setView([0, T], [0, top]);
          if (s === 0) Lp.line(0, 0, T, mu * T, { color: 'ink', dash: true, width: 1.6 });
          D.forEach((d, i) => Lp.path(Array.from({ length: 301 }, (_, j) => [(j * T) / 300, d.cum[Math.round((j * T) / 300)]]), { color: COL[i], width: 2.2 }));
          const rows = [];
          Ns.forEach((N, i) => {
            const n = 2 * N, arr = n * mu, u = ufix(n, s), pred = arr * u, meas = D[i].fixed / T, se = 1.96 * Math.sqrt(Math.max(D[i].fixed, 1)) / T;
            Rp.rect(i - 0.36, 1e-4, i - 0.12, arr, { fill: 'blue', fillAlpha: 0.45, color: 'blue', width: 1 });
            Rp.rect(i - 0.1, 1e-4, i + 0.14, u, { fill: 'orange', fillAlpha: 0.45, color: 'orange', width: 1 });
            Rp.rect(i + 0.16, 1e-4, i + 0.4, pred, { fill: 'green', fillAlpha: 0.45, color: 'green', width: 1 });
            Rp.line(i + 0.28, Math.max(1e-4, meas - se), i + 0.28, meas + se, { color: 'gold', width: 2 });
            Rp.dot(i + 0.28, Math.max(meas, 1.1e-4), { r: 4.5, color: 'gold' });
            rows.push({ N, arr, u, pred, meas, fixed: D[i].fixed, arisen: D[i].arisen });
          });
          if (s === 0) Rp.hline(mu, { color: 'ink', dash: true, width: 1.2 });
          info = { rows, mu, s };
        });
        v.legend([['blue', 'mutations arising $2N\\mu$', { area: true }], ['orange', 'fixation probability $u$', { area: true }], ['green', 'predicted rate $2N\\mu u$', { area: true }], ['gold', 'measured ± 95%', { dot: true }]]);
        v.readout(() => `${info.rows.map((r) => `$N=${r.N}$: ${r.arisen} mutations arose, ${r.fixed} fixed; rate ${v.fix(r.meas, 4)} vs predicted ${v.fix(r.pred, 4)}`).join(' · ')}.\n${info.s === 0 ? `Neutral: every population’s rate is $\\mu=${v.fix(info.mu, 4)}$ per generation, although $N$ differs sixteenfold.` : 'With selection the rate depends on $N$: the cancellation fails.'}`);
      },
    },

    // ───────────────────────────────────────────────────────────── 3.9
    {
      num: '3.9',
      kind: 'Concept',
      name: 'Molecular clock',
      statement: String.raw`The molecular clock is the observation, and the hypothesis, that the number of differences between homologous sequences of two species grows roughly linearly with the time since they diverged. If substitutions arise at a constant rate $r$ per site per unit time along each lineage, the cumulative number of substitution events $d$ across $L$ sites between two species with common ancestor $t$ ago is approximately Poisson with mean $2rLt$, so $\mathbb E[d]\propto t$ and $\operatorname{Var}(d)=\mathbb E[d]$ (a dispersion index $R=\operatorname{Var}/\mathbb E=1$). Raw finite-sequence mismatches approximate event counts only at low divergence; recurrent hits and reversals cause saturation. Dating additionally needs a valid calibration and a suitable substitution model.`,
      idea: String.raw`If substitutions are neutral, their rate equals the mutation rate (3.8), but neutrality alone does not make the mutation rate constant per unit time. A constant-rate Poisson process is an additional assumption. Substitutions arrive as a Poisson process, so the scatter around the line is as small as Poisson counting allows; extra scatter can have several causes, including rate heterogeneity; it challenges this simplest independent-event model without identifying a unique cause. The idea was put forward by Zuckerkandl and Pauling from comparisons of proteins; Kimura’s neutral explanation (3.14) turned it into a prediction of the neutral theory.`,
      caption: String.raw`**This is a model, not a data table**: pairs of species are simulated with divergence times drawn between 5 and 200 million years, a true rate $r$ you can set, and, optionally, rate variation between pairs (the coefficient of variation of the rate, $c$). Dots count substitution events, including multiple events at a site, so they can exceed sequence length. The band is a clipped normal approximation, mean ± 1.96√mean, useful at large expected counts and inaccurate at small counts. With $c=0$ the outside fraction is approximately 5% only when counts are large; raise $c$ and the dispersion index rises, the scatter fans out and the band fails. **Resample** draws new pairs.`,
      deps: ['popgen-3.8', 'stoch-9.3'],
      refs: ['Gillespie', 'Zuckerkandl & Pauling 1965, Evolutionary Divergence and Convergence in Proteins, §III.1–6 pp. 137–152, Tables VIII–IX and Fig. 3; https://bip.weizmann.ac.il/education/course/evogen/Clocks/Zuckerkandl_1965.pdf'],
      credit: 'Émile Zuckerkandl & Linus Pauling, 1965 (the idea); Motoo Kimura, 1968 (neutral explanation)',
      scope: String.raw`Holds when substitutions are neutral or nearly so and the mutation rate per unit time is constant across lineages; generation-time effects, changes in selective constraint and episodic selection make the clock “overdispersed”. No real data are plotted here: the rate scale is chosen for illustration. Each pair receives one shared gamma-distributed rate multiplier with mean 1 and coefficient of variation c; this is not two independently varying branches. The normal residual curve is a large-count reference. Zuckerkandl–Pauling’s historical chapter presents approximate rate constancy with explicit exceptions; its hemoglobin comparison assumes an 80-million-year common-ancestry calibration. That historical assumption is not a modern date estimate or a calibration fitted here.`,
      tags: ['clock', 'substitution', 'neutral theory'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Molecular_clock' },
      viz(v) {
        const rS = v.slider('true rate $r$ (per site per million years)', 1e-4, 5e-3, 1e-3, { log: true, sig: 2, fmt: (x) => sciT(x) });
        const LS = v.slider('sequence length $L$ (sites)', 50, 1000, 300, { int: true, log: true });
        const cS = v.slider('rate variation between pairs $c$', 0, 1.2, 0, { step: 0.05 });
        const PS = v.slider('species pairs', 10, 120, 40, { int: true });
        let seed = 1;
        v.button('Resample', () => { seed++; });
        const Lp = v.stage({ x: [0, 200], y: [0, 100], axes: 'box', gutter: true, height: 330, xlabel: 'time since divergence (million years)', ylabel: 'substitution events', title: 'Event counts against divergence time', weight: 1.3, minWidth: 320 });
        const Rp = v.stage({ x: [-4, 4], y: [0, 0.6], axes: 'box', gutter: true, height: 330, xlabel: 'standardised residual (d − mean)/√mean', ylabel: 'density', title: 'Residuals against the Poisson ideal', minWidth: 260 });
        const sim = memo();
        let info = {};
        v.render(() => {
          const r0 = rS.value, L = LS.value, c = cS.value, P = PS.value;
          const D = sim(`${r0}|${L}|${c}|${P}|${seed}`, () => {
            const r = v.rng(seed * 7 + 1), pts = [];
            for (let i = 0; i < P; i++) { const t = 5 + 195 * r(), g = c > 0 ? gammaDraw(r, 1 / (c * c)) * c * c : 1, d = clockPoisson(r, 2 * r0 * L * t * g); pts.push([t, d]); }
            return pts;
          });
          const slope = 2 * r0 * L, ymax = Math.max(...D.map((p) => p[1]), slope * 200 + 2 * Math.sqrt(slope * 200)) * 1.08;
          Lp.setView([0, 200], [0, ymax]);
          Lp.between((t) => Math.max(0, slope * t - 1.96 * Math.sqrt(slope * t)), (t) => slope * t + 1.96 * Math.sqrt(slope * t), 0, 200, { fill: 'green', fillAlpha: 0.18 });
          Lp.line(0, 0, 200, slope * 200, { color: 'green', width: 2.2 });
          let out = 0, st = 0, sd = 0; const z = [];
          D.forEach(([t, d]) => { const m = slope * t, zz = (d - m) / Math.sqrt(m); z.push(zz); if (Math.abs(zz) > 1.96) out++; st += t; sd += d; Lp.dot(t, d, { r: 3.8, color: Math.abs(zz) > 1.96 ? 'red' : 'accent' }); });
          const summary = summarizeClock(D, r0, L), rhat = summary.fittedRate, Rd = summary.dispersion;
          Lp.line(0, 0, 200, 2 * rhat * L * 200, { color: 'gold', width: 2, dash: true });
          const B = 16, h = new Float64Array(B); z.forEach((x) => { if (x < -4 || x >= 4) return; const j = Math.floor(((x + 4) / 8) * B); h[j]++; });
          Rp.setView([-4, 4], [0, Math.max(0.5, ...Array.from(h, (x) => (x / P) * (B / 8)) ) * 1.15]);
          h.forEach((x, j) => Rp.rect(-4 + (j * 8) / B, 0, -4 + ((j + 1) * 8) / B, (x / P) * (B / 8), { fill: 'accent', fillAlpha: 0.4, color: 'accent', width: 1 }));
          Rp.fn((x) => Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI), { domain: [-4, 4], n: 200, color: 'green', width: 2.4 });
          info = { out, P, rhat, r0, Rd, overflow: summary.overflow };
        });
        v.legend([['green', 'event mean ± normal-approximation band'], ['gold', 'fitted line (through the origin)', { dash: true }], ['red', 'outside the band', { dot: true }]]);
        v.readout(() => `${info.out} of ${info.P} pairs outside the normal-approximation band (about 5% expected only at large counts). ${info.overflow} residuals lie outside the displayed histogram. Pearson mean-square against the known rate $R\\approx${v.fix(info.Rd, 2)}$ (expectation 1 under the specified Poisson model). Fitted rate ${sciT(info.rhat)} versus true ${sciT(info.r0)} per site per million years.`);
      },
    },

    // ───────────────────────────────────────────────────────────── 3.10
    {
      num: '3.10',
      kind: 'Hypothesis',
      name: 'Neutral theory of molecular evolution',
      statement: String.raw`The neutral theory holds that most of the variation within species and most of the substitutions between species at the molecular level are caused by random drift of selectively neutral or nearly neutral mutations, not by positive selection; beneficial mutations occur but account for a small part of the evolutionary change in sequence. It predicts that, across loci, within-species diversity ($\propto 4N\mu$, 3.4) and between-species divergence ($\propto\mu\,T$, 3.8) share the same mutation rate $\mu$, so that their ratio is constant across genes up to sampling noise, and that substitutions are clock-like (3.9).`,
      idea: String.raw`The argument starts from two facts: substitution at the neutral rate equals the mutation rate (3.8), and polymorphism is the transient stage of a mutation on its way to loss or fixation, with equilibrium heterozygosity $\theta/(1+\theta)$ (3.4). Both are proportional to the locus’s mutation rate, so a gene with a fast mutation rate should be both more diverse and more divergent. A burst of adaptive substitutions adds to divergence without adding polymorphism, and the sweeps that fix them remove linked diversity, so loci with many adaptive substitutions have a *low* ratio of polymorphism to divergence. This is the logic of the Hudson–Kreitman–Aguadé test.`,
      caption: String.raw`**A model of 14 genes, not real data.** Each gene has its own mutation rate (a 30-fold spread, left–right on the log axes); counts of polymorphic sites $S$ in a sample and divergent sites $D$ are drawn as Poisson numbers. Dots near the line: neutral. Switch on **beneficial substitutions** and raise their share $\alpha$ of all differences and the strength of hitchhiking: some genes gain divergence and lose polymorphism and leave the line. The right panel shows each gene’s ratio $S/D$ with the Poisson 95% band, and the statistic of the HKA type tests for excess scatter.`,
      deps: ['popgen-3.8', 'popgen-3.4'],
      refs: ['Gillespie', 'Nielsen–Slatkin'],
      credit: 'Motoo Kimura, 1968; Jack King & Thomas Jukes, 1969',
      scope: String.raw`A hypothesis about how much of molecular change is neutral, not a theorem; it is a null model against which selection is tested. The hitchhiking correction in this picture is a one-parameter caricature (diversity divided by $1+\eta\,\alpha/(1-\alpha)$), not a population-genetic derivation, and the 14 genes are simulated.`,
      tags: ['neutral theory', 'divergence', 'polymorphism'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Neutral_theory_of_molecular_evolution' },
      viz(v) {
        const on = v.toggle('beneficial substitutions present', false);
        const aS = v.slider('adaptive share of divergence $\\alpha$ (mean)', 0, 0.8, 0.4, { step: 0.05 });
        const eS = v.slider('hitchhiking strength $\\eta$', 0, 10, 3, { step: 0.5 });
        let seed = 1;
        v.button('Resample', () => { seed++; });
        const G = 14, LOG = Math.log(30);
        const Lp = v.stage({ x: [5, 500], y: [5, 500], xlog: true, ylog: true, axes: 'box', gutter: true, height: 330, xlabel: 'divergent sites D', ylabel: 'polymorphic sites S', title: 'Polymorphism against divergence, per gene', minWidth: 300 });
        const Rp = v.stage({ x: [-0.6, G - 0.4], y: [0, 3], axes: 'box', gutter: true, height: 330, xlabel: 'genes, ordered by divergence', ylabel: 'ratio S / D relative to the average', title: 'Is the ratio constant?', minWidth: 300 });
        const sim = memo();
        let info = {};
        v.render(() => {
          const alpha = on.value ? aS.value : 0, eta = eS.value;
          const genes = sim(`${seed}|${alpha}|${eta}`, () => {
            const r = v.rng(seed * 41 + 9), out = [];
            for (let g = 0; g < G; g++) {
              const rate = Math.exp(-LOG / 2 + LOG * r()) , ag = Math.min(0.9, alpha * 2 * r()), baseD = 40 * rate / (1 - ag), baseS = (40 * rate) / (1 + (eta * ag) / (1 - ag));
              out.push({ rate, D: Math.max(1, pois(r, baseD)), S: Math.max(1, pois(r, baseS)), ag });
            }
            return out.sort((a, b) => a.D - b.D);
          });
          Lp.setView([5, 500], [5, 500]);
          const w = genes.map((g) => 1 / (1 / g.S + 1 / g.D)), lr = genes.map((g) => Math.log(g.S / g.D));
          const m = lr.reduce((s, x, i) => s + x * w[i], 0) / w.reduce((a, b) => a + b, 0), ratio = Math.exp(m);
          Lp.line(5, 5 * ratio, 500, 500 * ratio, { color: 'green', width: 2.2 });
          Lp.fn((x) => ratio * x * 1.8, { domain: [5, 500], n: 2, color: 'green', width: 1, alpha: 0.5, dash: true });
          Lp.fn((x) => ratio * x / 1.8, { domain: [5, 500], n: 2, color: 'green', width: 1, alpha: 0.5, dash: true });
          let X = 0;
          genes.forEach((g, i) => { const z = (lr[i] - m) / Math.sqrt(1 / g.S + 1 / g.D); X += z * z; Lp.dot(g.D, g.S, { r: 5, color: Math.abs(z) > 1.96 ? 'red' : 'accent' }); });
          Rp.hline(1, { color: 'green', width: 2 });
          genes.forEach((g, i) => { const rr = g.S / g.D / ratio, se = 1.96 * Math.sqrt(1 / g.S + 1 / g.D), z = (lr[i] - m) / Math.sqrt(1 / g.S + 1 / g.D); Rp.line(i, Math.exp(-se) , i, Math.exp(se), { color: 'muted', width: 1.2 }); Rp.dot(i, Math.min(2.95, rr), { r: 4.5, color: Math.abs(z) > 1.96 ? 'red' : 'accent' }); });
          Rp.setView([-0.6, G - 0.4], [0, 3]);
          const p = v.M.gammaQ((G - 1) / 2, X / 2);
          info = { X, p, ratio, on: on.value, out: genes.filter((g, i) => Math.abs((lr[i] - m) / Math.sqrt(1 / g.S + 1 / g.D)) > 1.96).length };
        });
        v.legend([['green', 'neutral expectation: constant ratio'], ['accent', 'gene', { dot: true }], ['red', 'gene beyond the Poisson band', { dot: true }]]);
        v.readout(() => `Common ratio $S/D\\approx${v.fix(info.ratio, 2)}$; test statistic (≈ $\\chi^2_{13}$ under neutrality) $X=${v.fix(info.X, 1)}$, $p=${v.fix(info.p, 3)}$; ${info.out} of 14 genes outside their 95% band. ${info.on ? (info.p < 0.05 ? 'The neutral prediction is rejected: the ratio varies more than counting error allows.' : 'With these settings the departure is too small to detect in 14 genes.') : 'No beneficial substitutions: the genes scatter around one ratio, as the neutral theory says.'}`);
      },
    },

    // ───────────────────────────────────────────────────────────── 3.11
    {
      num: '3.11',
      kind: 'Theorem',
      name: 'Age of a neutral allele from its frequency',
      statement: String.raw`Consider a neutral allele that arose as a single mutation in a diploid population of constant size $N$ and now has frequency $p$. Conditional on its present frequency being $p$, its expected age, the number of generations since the mutation arose, is, in the diffusion approximation,
$$\bar t(p)\;=\;-\frac{4N\,p}{1-p}\,\ln p\ \text{ generations.}$$
This increases with $p$: $\bar t\to 0$ as $p\to0$, $\bar t=4N\ln 2\approx2.8N$ at $p=\tfrac12$, and $\bar t\to4N$ as $p\to1$. Common neutral alleles are old; rare ones are young.`,
      idea: String.raw`Run the diffusion (2.11) in reverse: among all lineages of mutations that begin at frequency $1/2N$ and are observed at frequency $p$, the mean elapsed time is the integral of the conditioned process’s expected passage time. The calculation uses the fixation probability $p$ for a neutral allele (2.4) and the Green’s function of the drift operator, and gives the formula above (Kimura and Ohta). Intuitively an allele at frequency $p$ must have drifted up from $1/2N$, which takes of order $N$ generations when $p$ is not small, whereas a singleton can be only a few generations old, since most new mutations are lost almost at once.`,
      caption: String.raw`A long Wright–Fisher run in which new mutations arise continually, each at its own site; every 50 generations all segregating mutations are recorded with their frequency and age. **Left**: the grey dots are those (frequency, age) pairs, the blue dots the mean age within each frequency class, with $\pm1$ SE (not corrected for the correlation between snapshots), and the green curve $-4Np\ln p/(1-p)$. **Right**: the trajectory, back to its birth, of one mutation with frequency near your chosen $p$; **Another allele** picks a different one.`,
      deps: ['popgen-2.11', 'popgen-3.1'],
      refs: ['Ewens §5.9'],
      credit: 'Motoo Kimura & Tomoko Ohta, 1973',
      scope: String.raw`Neutral allele at an independent site, constant size, no recombination effects. The formula is for the continuum limit and for alleles that are present, conditioned on persisting; very small $2Np$ is only approximately captured by the diffusion.`,
      tags: ['neutral theory', 'allele age', 'diffusion'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Neutral_theory_of_molecular_evolution' },
      viz(v) {
        const NS = v.slider('population size $N$', 20, 100, 50, { int: true });
        const pS = v.slider('frequency of the allele traced $p$', 0.05, 0.95, 0.4, { step: 0.05 });
        let seed = 1, pick = 0;
        v.button('Resample run', () => { seed++; pick = 0; });
        v.button('Another allele', () => { pick++; });
        const Lp = v.stage({ x: [0, 1], y: [0, 6], axes: 'box', gutter: true, height: 330, xlabel: 'current frequency p', ylabel: 'age (generations)', title: 'Age against frequency', weight: 1.2, minWidth: 300 });
        const Rp = v.stage({ x: [0, 100], y: [0, 1], axes: 'box', gutter: true, height: 330, xlabel: 'generations before the sample', ylabel: 'frequency', title: 'One allele traced back', minWidth: 260 });
        const sim = memo();
        let info = {};
        v.render(() => {
          const N = NS.value, n = 2 * N, mu = 0.02, p0 = pS.value;
          const D = sim(`${N}|${seed}`, () => {
            const r = v.rng(seed * 61 + N); let ks = [], births = [], hist = []; const burn = 25 * N, snaps = 140, gap = 50, recs = [];
            for (let t = 1; t <= burn + snaps * gap; t++) {
              const nk = [], nb = [], nh = [];
              for (let i = 0; i < ks.length; i++) { const k = siteNext(r, n, ks[i], 0); if (k > 0 && k < n) { nk.push(k); nb.push(births[i]); hist[i].push(k); nh.push(hist[i]); } }
              const m = pois(r, n * mu); for (let j = 0; j < m; j++) { nk.push(1); nb.push(t); nh.push([1]); }
              ks = nk; births = nb; hist = nh;
              if (t > burn && (t - burn) % gap === 0) for (let i = 0; i < ks.length; i++) recs.push({ p: ks[i] / n, age: t - births[i], h: hist[i] });
            }
            const B = 19, sum = new Float64Array(B), sq = new Float64Array(B), cnt = new Float64Array(B);
            recs.forEach((e) => { const b = Math.min(B - 1, Math.floor(e.p / 0.05)); sum[b] += e.age; sq[b] += e.age * e.age; cnt[b]++; });
            return { recs, sum, sq, cnt, B };
          });
          const ymax = 6 * N; Lp.setView([0, 1], [0, ymax]);
          const step = Math.max(1, Math.floor(D.recs.length / 1500));
          for (let i = 0; i < D.recs.length; i += step) { const e = D.recs[i]; if (e.age < ymax) Lp.dot(e.p, e.age, { r: 1.6, color: 'muted', alpha: 0.35 }); }
          const f = (p) => (-4 * N * p * Math.log(p)) / (1 - p);
          Lp.fn(f, { domain: [0.01, 0.99], n: 200, color: 'green', width: 2.6 });
          for (let b = 0; b < D.B; b++) if (D.cnt[b] > 3) { const m = D.sum[b] / D.cnt[b], se = Math.sqrt(Math.max(0, D.sq[b] / D.cnt[b] - m * m) / D.cnt[b]); Lp.line((b + 0.5) * 0.05, Math.max(0, m - se), (b + 0.5) * 0.05, m + se, { color: 'accent', width: 2 }); Lp.dot((b + 0.5) * 0.05, m, { r: 4.5, color: 'accent' }); }
          Lp.vline(p0, { color: 'gold', dash: true, width: 1.2 });
          const near = D.recs.filter((e) => Math.abs(e.p - p0) < 0.03 && e.age > 3), e = near.length ? near[(pick * 7919) % near.length] : null;
          let tr = null;
          if (e) {
            const h = e.h, len = h.length; Rp.setView([0, Math.max(60, len * 1.05)], [0, 1]);
            Rp.path(h.map((k, i) => [len - 1 - i, k / n]), { color: 'gold', width: 2.2 });
            Rp.dot(0, h[len - 1] / n, { r: 5, color: 'gold' });
            Rp.hline(1 / n, { color: 'muted', dash: true, width: 1 });
            tr = { age: e.age, p: e.p };
          }
          const bi = Math.min(D.B - 1, Math.floor(p0 / 0.05));
          info = { N, p0, tr, f: f(p0), m: D.cnt[bi] ? D.sum[bi] / D.cnt[bi] : NaN, cnt: D.cnt[bi], total: D.recs.length, fp: f(clamp((bi + 0.5) * 0.05, 0.01, 0.99)) };
        });
        v.legend([['green', 'Kimura–Ohta: $-4Np\\ln p/(1-p)$'], ['accent', 'mean age in a frequency class ± SE', { dot: true }], ['gold', 'allele traced (right)']]);
        v.readout(() => `${info.total} (frequency, age) records. In the class around $p=${v.fix(info.p0, 2)}$: mean simulated age ${v.fix(info.m, 0)} generations ($${info.cnt}$ records) vs formula ${v.fix(info.fp, 0)} (${v.fix(info.fp / info.N, 2)}$N$).\n${info.tr ? `Traced allele: frequency ${v.fix(info.tr.p, 2)}, age ${info.tr.age} generations $=${v.fix(info.tr.age / info.N, 2)}N$.` : 'No allele near this frequency in this run.'}`);
      },
    },

    // ───────────────────────────────────────────────────────────── 3.12
    {
      num: '3.12',
      kind: 'Paradox',
      name: 'Lewontin’s paradox of variation',
      statement: String.raw`In a neutral mutation–drift equilibrium, diversity at low mutation rates is approximately $\pi=4N_e\mu$. If mutation rates were comparable and effective size proportional to census size, diversity would scale with census size. But the observed levels of genetic diversity vary only over about two to three orders of magnitude, from roughly $10^{-4}$ to $10^{-1}$ differences per site, while census sizes span many more; the observed range does not scale directly with census abundance, even though ecological correlations exist. Lewontin’s paradox is the mismatch between the huge range of $N$ and the narrow range of $\pi$.`,
      idea: String.raw`With $\theta=4N_e\mu$ (3.4) and a mutation rate $\mu$ of order $10^{-8}$ per site per generation, a species with $N_e=10^{9}$ should have $\theta\approx40$ per site, an extrapolation outside the low-diversity infinite-sites regime. Finite-sites saturation prevents divergence, but does not by itself explain the relatively low, narrow diversity range. Proposed explanations include linked selection (recurrent sweeps and background selection remove diversity at linked sites, lowering the effective size), fluctuations in size (the effective size is a harmonic mean dominated by the smallest sizes, 2.7), and covariation of mutation rate with life history; their relative importance is still debated. The simplest model of a cap, drawn here, sets $1/N_e=1/N+1/N_{\max}$.`,
      caption: String.raw`Log–log plot of diversity $\pi$ against census size $N$. The green curve is the neutral prediction $\pi=\theta/(1+\tfrac43\theta)$ with $\theta=4N\mu$ (a Jukes–Cantor-type saturation); **mutation rate** shifts it. The grey band is the range in Leffler et al.’s 2012 compilation of 167 species (0.01% to 8.01%); the three coloured bars are species with a census estimate (horizontal bar = estimate range). Turn on an **effective-size ceiling** and compare the resulting curve with the band. A chosen ceiling illustrates an assumption about $N_e$, rather than a demonstrated resolution of the paradox. The gold dot follows your census-size slider.`,
      deps: ['popgen-3.4', 'popgen-2.7'],
      refs: ['Leffler et al. (2012), pp. 1–4 and 6–7; collection criteria, enduring riddle and proposed explanations'],
      credit: 'Richard Lewontin, 1974 (The Genetic Basis of Evolutionary Change); Leffler et al., 2012 (167-species data)',
      scope: String.raw`Data: the extreme values and three species are as reported by Leffler et al. (2012, PLoS Biology 10: e1001388): nucleotide diversity ranged from 0.01% per bp (*Lynx lynx*) to 8.01% (*Ciona savignyi*); the gibbon *Hoolock leuconedys* census was estimated at 10 000–50 000 with $\pi=0.21\%$, the collared flycatcher *Ficedula albicollis* at about 4–7 million with $\pi=0.38\%$ and the white-throated sparrow *Zonotrichia albicollis* at about 140 million with $\pi=0.66\%$. Census figures are rough estimates (the paper cites birdlife.org for the birds) and were read from the paper’s text; the prediction curve is a model, not a fit, and the default mutation rate $1.2\times10^{-8}$ per site per generation is an illustrative constant, not an estimated common rate for these taxa. Only these data points are used; the paper’s full table is not reproduced.`,
      tags: ['diversity', 'paradox', 'effective size'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Neutral_theory_of_molecular_evolution' },
      viz(v) {
        const muS = v.slider('mutation rate $\\mu$ per site per generation', 1e-9, 1e-7, 1.2e-8, { log: true, sig: 2, fmt: sciT });
        const capOn = v.toggle('effective-size ceiling $N_{\\max}$', false);
        const capS = v.slider('ceiling $N_{\\max}$', 1e4, 1e8, 1e6, { log: true, sig: 2, fmt: sciT });
        const NS = v.slider('census size $N$ of a species', 10, 1e12, 1e6, { log: true, sig: 2, fmt: sciT });
        const Sp = v.stage({ x: [10, 1e13], y: [1e-5, 1], xlog: true, ylog: true, axes: 'box', gutter: true, height: 380, xlabel: 'census size N', ylabel: 'nucleotide diversity π', title: 'Diversity against population size', full: true });
        let info = {};
        v.render(() => {
          const mu = muS.value, cap = capOn.value ? capS.value : 1e30, N = NS.value;
          const ne = (x) => diversityModel(x,mu,cap).ne, pi = (x) => diversityModel(x,mu,cap).pi;
          Sp.setView([10, 1e13], [Math.min(1e-5,pi(10)/2), 1]);
          Sp.rect(10, 1e-4, 1e13, 8.01e-2, { fill: 'muted', fillAlpha: 0.12, stroke: false });
          Sp.text('observed range of π across 167 species: 0.01% – 8.01%', 3e12, 1.5e-4, { align: 'right', color: 'muted', size: 11.5 });
          Sp.fn(pi, { domain: [10, 1e13], n: 200, color: 'green', width: 2.8 });
          [['gibbon', 1e4, 5e4, 2.1e-3], ['collared flycatcher', 4e6, 7e6, 3.8e-3], ['white-throated sparrow', 1.4e8, 1.4e8, 6.6e-3]].forEach(([nm, a, b, y], i) => {
            const col = ['purple', 'orange', 'teal'][i];
            if (b > a) Sp.line(a, y, b, y, { color: col, width: 4 });
            Sp.dot(Math.sqrt(a * b), y, { r: 5.5, color: col });
            Sp.text(nm, Math.sqrt(a * b) * (i === 1 ? 0.7 : 1.5), y * (i === 1 ? 0.62 : 1.35), { color: col, size: 11.5, weight: 600 });
          });
          Sp.dot(N, pi(N), { r: 7, color: 'gold' });
          Sp.vline(N, { color: 'gold', dash: true, width: 1 });
          info = { mu, N, pred: pi(N), th: 4 * ne(N) * mu, ne: ne(N), capped: capOn.value };
        });
        v.legend([['green', 'neutral prediction'], ['muted', 'observed range (Leffler et al. 2012)', { area: true }], ['purple', 'gibbon'], ['orange', 'flycatcher'], ['teal', 'sparrow'], ['gold', 'your species', { dot: true }]]);
        v.readout(() => `$N=${v.sci(info.N, 2)}$, $N_e=${v.sci(info.ne, 2)}$: $\\theta=4N_e\\mu=${v.sci(info.th, 2)}$ per site, predicted $\\pi=${v.sci(info.pred, 2)}$ ${info.pred > 8.01e-2 ? '— above the 2012 compilation range (8.01%).' : info.pred < 1e-4 ? '— below the 2012 compilation range (0.01%).' : '— inside the observed band.'}\nCensus sizes of the three example species span ${v.fix(Math.log10(1.4e8 / 3e4), 1)} orders of magnitude; their diversities span a factor of ${v.fix(6.6e-3 / 2.1e-3, 1)} (the whole 167-species range is about 800-fold).`);
      },
    },

    // ───────────────────────────────────────────────────────────── 3.14
    {
      num: '3.14',
      kind: 'Paper',
      name: 'Evolutionary Rate at the Molecular Level',
      paper: { authors: 'Motoo Kimura', year: 1968, title: 'Evolutionary Rate at the Molecular Level', venue: 'Nature 217 (5129): 624–626', doi: '10.1038/217624a0' },
      introduces: ['popgen-3.10', 'popgen-3.8'],
      statement: String.raw`Kimura compared the rate at which amino acids are replaced in well-studied proteins, which is remarkably steady per site and per year, with the genome size of a mammal. Scaled to all of the nucleotides in a mammalian genome, the observed rate of nucleotide substitution amounts to about one nucleotide-pair substitution per lineage-wide haploid genome roughly every 1.8 years. If each substitution were driven by natural selection and carried a Haldane-type “cost”, this would exceed by orders of magnitude the roughly one substitution per 300 generations that Haldane’s calculation allowed. Kimura concluded that many substitutions must be neutral or nearly neutral, for which the rate $k$ equals the mutation rate $u$ and carries no cost.`,
      idea: String.raw`In 1957 Haldane argued that every substitution selected to fixation imposes a “cost” in the form of selective deaths, and that a population can pay for only a limited number of them per generation (5.2, 5.4). Protein sequences compared between species had meanwhile shown remarkably steady rates of amino acid replacement in proteins such as haemoglobin and cytochrome c; summed over a whole genome these give a substitution rate far above what a Haldane-type budget could pay for. Kimura’s way out: if most substitutions are neutral the cost never arises, and since the neutral rate is equal to the mutation rate (3.8) the steady rate per site per year is just the steady mutation rate. The paper introduced the neutral theory (3.10) and the neutral substitution rate (3.8).`,
      caption: String.raw`**An arithmetic reconstruction, not the paper’s table.** Set the genome size, the substitution rate per nucleotide per year, the generation time, Haldane’s cost per substitution $D$ and the load the population can bear. **Left**: extrapolated substitutions per generation on a log axis, against the number this load budget allows ($L/D$). **Right**: the load incurred (log) if a fraction $a$ of the observed substitutions were adaptive, against the budget; the red mark is the largest adaptive fraction the budget can pay. Defaults follow the original arithmetic: one amino-acid replacement per 28 million years per 100 residues, 300 nucleotide pairs per such sequence, and a 1.2 correction for synonymous changes, with $4\times10^9$ pairs and four-year generations.`,
      deps: ['popgen-5.4', 'popgen-2.4', 'popgen-3.1'],
      refs: ['Kimura (1968), complete pp. 624–626; genome/rate arithmetic and load discussion p. 625'],
      credit: 'Motoo Kimura, 1968 (Nature 217: 624–626)',
      scope: String.raw`The complete 1968 original, p. 625, gives this historical extrapolation, not a current genome-wide measurement. Its nucleotide rate is $1.2/(28\times10^6\times300)\approx1.43\times10^{-10}$ per pair per year, so the mean interval is 1.75 years (rounded to 1.8 in the paper). The load budget is a simplified additive Haldane-style accounting; its adaptive-share bound is conditional on that accounting, not an empirical estimate. The neutral fixation/substitution argument uses no directional-selection cost.`,
      tags: ['neutral theory', 'Haldane', 'history'],
      links: { doi: 'https://doi.org/10.1038/217624a0', wikipedia: 'https://en.wikipedia.org/wiki/Neutral_theory_of_molecular_evolution' },
      viz(v) {
        const GS = v.slider('genome size (nucleotide pairs)', 1e8, 1e10, KIMURA_1968.genome, { log: true, sig: 2, fmt: sciT });
        const rS = v.slider('rate per nucleotide per year', 1e-11, 1e-9, KIMURA_1968.rate, { log: true, sig: 4, fmt: sciT });
        const gS = v.slider('generation time (years)', 0.5, 30, KIMURA_1968.generation, { log: true, sig: 2 });
        const DS = v.slider('Haldane cost per substitution $D$', 3, 100, 30, { log: true, sig: 2 });
        const LS = v.slider('tolerable load $L$ per generation', 0.01, 0.5, 0.1, { log: true, sig: 2 });
        const Lp = v.stage({ x: [-0.6, 3.6], y: [1e-4, 1e4], ylog: true, axes: 'box', gutter: true, height: 330, xlabel: '', ylabel: 'substitutions per generation', title: 'Observed rate against the budget', xticks: [[0, 'extrapolated'], [1, 'budget L/D']], minWidth: 300 });
        const Rp = v.stage({ x: [1e-4, 1], y: [1e-3, 1e4], xlog: true, ylog: true, axes: 'box', gutter: true, height: 330, xlabel: 'fraction a of the observed substitutions that were adaptive', ylabel: 'load per generation', title: 'Cost if the substitutions were adaptive', minWidth: 300 });
        let info = {};
        v.render(() => {
          const G = GS.value, r = rS.value, g = gS.value, D = DS.value, Lm = LS.value;
          const {perYear,perGen,limit,ratio,amax}=kimuraBudget(G,r,g,D,Lm);
          const low=Math.min(1e-4,perGen/5,limit/5); Lp.setView([-.6,1.6],[low,Math.max(perGen,limit)*4]);
          Lp.rect(-0.35, low, 0.35, perGen, { fill: 'accent', fillAlpha: 0.45, color: 'accent', width: 1.5 });
          Lp.rect(0.65, low, 1.35, limit, { fill: 'green', fillAlpha: 0.45, color: 'green', width: 1.5 });
          Lp.text(`${v.fmt(perGen, 3)}`, 0, perGen * 1.6, { align: 'center', size: 12, weight: 700 });
          Lp.text(`${v.fmt(limit, 2)}`, 1, limit * 1.6, { align: 'center', size: 12, weight: 700 });
          const xmin=Math.min(1e-4,amax/3),loadAt=(a)=>a*perGen*D; Rp.setView([xmin,1],[Math.min(loadAt(xmin),Lm)/3,Math.max(loadAt(1),Lm)*3]);
          Rp.fn(loadAt, { domain: [xmin,1], n: 120, color: 'accent', width: 2.8 });
          Rp.hline(Lm, { color: 'green', width: 2.2 });
          Rp.vline(amax, { color: 'red', width: 2, dash: true });
          Rp.dot(amax, loadAt(amax), { r: 5.5, color: 'red' });
          Rp.text(`budget L = ${v.fmt(Lm, 2)}`, 2e-4, Lm * 1.6, { color: 'green', size: 12, weight: 600 });
          info = { G, perYear, perGen, limit, ratio, amax, D, Lm, g, perHaldane: 1 / limit };
        });
        v.legend([['accent', 'historically extrapolated substitutions per generation'], ['green', 'Haldane’s budget $L/D$'], ['red', 'ratio / largest adaptive share', { dash: true }]]);
        v.readout(() => `Genome-wide substitution rate ${v.fmt(info.perYear, 3)} per year, i.e. one every ${v.fmt(1 / info.perYear, 3)} years (the paper’s figure: about one every two years); with ${v.fmt(info.g, 2)}-year generations that is ${v.fmt(info.perGen, 3)} per generation. Haldane’s budget $L/D$ pays for one per ${v.fmt(info.perHaldane, 3)} generations.\nUnder this simplified budget the extrapolated rate is ${v.fmt(info.ratio, 3)} times capacity: at most ${v.fix(100 * info.amax, 2)}% of the observed substitutions could have been adaptive. Neutral substitutions ($k=u$) incur no directional-selection load.`);
      },
    },
  ],
};
