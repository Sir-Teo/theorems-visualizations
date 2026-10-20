// Population Genetics & Evolution — Chapter 2 (part b): items 2.8–2.14
import { clamp, memo, binom, binomPmf, wfNext, wfAbsorb, lsq, wfMatrix, evolve, kimuraDensity, kimuraMasses, fokkerPlanck } from './ch02.shared.js';

/** Multinomial(n; f) by sequential binomials. */
function multinom(r, n, f) {
  const out = new Int32Array(f.length); let rem = n, rest = 1;
  for (let i = 0; i < f.length - 1 && rem > 0; i++) { const c = binom(r, rem, clamp(f[i] / rest, 0, 1)); out[i] = c; rem -= c; rest -= f[i]; }
  out[f.length - 1] += rem; return out;
}

export default {
  collection: 'popgen',
  chapter: 2,
  items: [
    // ───────────────────────────────────────────────────────────── 2.8
    {
      num: '2.8',
      kind: 'Theorem',
      name: 'Unequal sex ratio: Nₑ = 4N_mN_f/(N_m + N_f)',
      statement: String.raw`In a population with $N_m$ breeding males and $N_f$ breeding females, in which every offspring takes its father at random from the males and its mother at random from the females, the inbreeding effective size for an autosomal locus is
$$N_e=\frac{4N_mN_f}{N_m+N_f},\qquad\text{equivalently}\qquad \frac1{N_e}=\frac1{4N_m}+\frac1{4N_f}.$$
It equals the census size $N_m+N_f$ only if the sexes are equal in number, and it is always below it otherwise; as $N_m\to\infty$ it tends to $4N_f$, and as $N_m$ shrinks it approaches $4N_m$.`,
      idea: String.raw`Take two gene copies from different individuals of the new generation. Each came from a father with probability $\tfrac12$ and from a mother with probability $\tfrac12$. With probability $\tfrac14$ both are paternal, and then they descend from the same one of the $2N_m$ male gene copies with probability $1/2N_m$; with probability $\tfrac14$ both are maternal and the chance is $1/2N_f$; a paternal and a maternal copy cannot coincide. So the coalescence probability per generation is $\frac1{8N_m}+\frac1{8N_f}$, and setting it equal to $1/2N_e$ (2.6) gives the formula. The rarer sex bottlenecks the gene pool: half of all genes pass through few males.`,
      caption: String.raw`Left: $N_e$ as a function of the number of males for the chosen number of females (dot = current setting). It saturates at $4N_f$ and is far below the census size ($N_m+N_f$, dashed) when the sexes are unbalanced. Right: heterozygosity decay averaged over 300 simulated populations with $N_m$ male and $N_f$ female parents, against the ideal curves for $N_e$ (green) and for the census size (grey).`,
      deps: ['popgen-2.6'],
      refs: ['Ewens §3.7'],
      credit: 'Sewall Wright, 1931',
      scope: String.raw`Autosomal loci, discrete generations, random mating within breeding males and breeding females, constant numbers of each. For X-linked or mitochondrial loci the weights differ ($N_e^X=9N_mN_f/(4N_m+2N_f)$ and $N_f$ respectively).`,
      tags: ['effective size', 'sex ratio'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Effective_population_size#Variation_in_sex_ratio' },
      viz(v) {
        const mS = v.slider('breeding males $N_m$', 1, 50, 5, { int: true });
        const fS = v.slider('breeding females $N_f$', 1, 50, 45, { int: true });
        let seed = 1; v.button('New runs', () => { seed++; });
        const L = v.stage({ x: [0, 50], y: [0, 200], axes: 'box', gutter: true, height: 320, xlabel: 'number of breeding males', ylabel: 'effective size', title: 'Effective size against males' });
        const Rg = v.stage({ x: [0, 100], y: [1e-3, 1.5], ylog: true, axes: 'box', gutter: true, height: 320, xlabel: 'generation', ylabel: 'mean H(t) / H(0)', title: 'Heterozygosity decay', minWidth: 300 });
        const sim = memo();
        const T = 100;
        function run(Nm, Nf, sd) {
          const r = v.rng(sd), R = 300, mean = new Float64Array(T + 1), tot = Nm + Nf;
          for (let i = 0; i < R; i++) {
            let gm = new Uint8Array(Nm).fill(1), gf = new Uint8Array(Nf).fill(1);
            for (let t = 0; t <= T; t++) {
              let c = 0; for (let j = 0; j < Nm; j++) c += gm[j]; for (let j = 0; j < Nf; j++) c += gf[j];
              const p = c / (2 * tot); mean[t] += 2 * p * (1 - p);
              if (t === T || c === 0 || c === 2 * tot) continue;
              const nm = new Uint8Array(Nm), nf = new Uint8Array(Nf);
              for (let j = 0; j < tot; j++) {
                const fa = gm[(r() * Nm) | 0], mo = gf[(r() * Nf) | 0];
                const g = (r() * 2 < fa ? 1 : 0) + (r() * 2 < mo ? 1 : 0);
                if (j < Nm) nm[j] = g; else nf[j - Nm] = g;
              }
              gm = nm; gf = nf;
            }
          }
          return mean.map((x) => x / R / 0.5);
        }
        let info = {};
        v.render(() => {
          const Nm = mS.value, Nf = fS.value, N = Nm + Nf, Ne = (4 * Nm * Nf) / N;
          const yM = Math.max(40, 4 * Nf * 1.08);
          L.setView([0, 50], [0, yM]);
          L.fn((m) => (4 * m * Nf) / (m + Nf), { domain: [0.01, 50], n: 100, color: 'green', width: 3 });
          L.fn((m) => m + Nf, { domain: [0, 50], n: 2, color: 'muted', width: 2, dash: true });
          L.hline(4 * Nf, { color: 'green', width: 1, dash: true, alpha: 0.6 });
          L.text('$4N_f$', 49.5, 4 * Nf, { align: 'right', baseline: 'bottom', color: 'green', size: 13 });
          L.line(Nm, 0, Nm, Ne, { color: 'accent', width: 1, alpha: 0.5 });
          L.dot(Nm, Ne, { r: 6, color: 'accent', label: 'Nₑ', labelPos: 'se' });
          L.dot(Nm, N, { r: 4, color: 'muted', hollow: true });
          const D = sim(`${Nm}|${Nf}|${seed}`, () => run(Nm, Nf, seed * 11 + Nm * 3 + Nf));
          const ts = [], ys = []; for (let t = 3; t <= T; t++) if (D[t] > 0.04) { ts.push(t); ys.push(Math.log(D[t])); }
          const fit = ts.length > 4 ? lsq(ts, ys) : { slope: NaN, intercept: 0 };
          Rg.fn((t) => Math.exp(-t / (2 * N)), { domain: [0, T], n: 80, color: 'muted', width: 2, dash: true });
          Rg.fn((t) => Math.exp(-t / (2 * Ne)), { domain: [0, T], n: 80, color: 'green', width: 3 });
          Rg.dots(Array.from({ length: 34 }, (_, i) => [i * 3, Math.max(D[i * 3], 1e-4)]).filter((q) => q[1] > 1e-3), { r: 3, color: 'accent' });
          info = { Nm, Nf, N, Ne, fitNe: 1 / (2 * (1 - Math.exp(fit.slope))) };
        });
        v.legend([['green', '$N_e=4N_mN_f/(N_m+N_f)$'], ['muted', 'census size', { dash: true }], ['accent', 'simulation', { dot: true }]]);
        v.readout(() => `$N_m=${info.Nm}$, $N_f=${info.Nf}$: census $N=${info.N}$ but $N_e=4N_mN_f/N=${v.fix(info.Ne, 1)}$ (${v.fix(100 * info.Ne / info.N, 0)}% of census).\nSlope of the simulated decay gives $N_e\\approx${v.fix(info.fitNe, 1)}$. With equal sexes ($N_m=N_f$) $N_e=N$.`);
      },
    },

    // ───────────────────────────────────────────────────────────── 2.9
    {
      num: '2.9',
      kind: 'Phenomenon',
      name: 'Founder effects and bottlenecks',
      statement: String.raw`When a large, diverse population passes through a **bottleneck** — a few generations at small size $n$ — or a new population is founded by $n$ individuals, random sampling of the gene pool removes variation. Expected heterozygosity (gene diversity) is multiplied by $(1-1/2n)^d$ over $d$ generations at size $n$, a loss of about $d/2n$ for $n\gg1$. The number of alleles falls much faster than the heterozygosity, because alleles at low frequency are lost with probability $\approx(1-f)^{2n}$ when they are sampled once: a bottleneck of $n$ individuals typically retains only alleles with $f\gtrsim 1/2n$.`,
      idea: String.raw`Heterozygosity is dominated by the common alleles, which survive a bottleneck of any size, and it falls by the single-generation sampling factor of 2.3 repeated $d$ times. Allelic richness counts every allele equally, and rare ones are numerous but have small frequency: an allele of frequency $f$ is absent from a sample of $2n$ copies with probability $(1-f)^{2n}\approx e^{-2nf}$, so most of the rare alleles disappear even when $n$ is large enough to keep most of the heterozygosity. This is why recovered populations look genetically depauperate in rare variants even when their present size is large (Mayr’s founder principle).

For an allele at fixed source frequency f, independent sampling of $2n$ copies uses prob-2.1.1a to make its absence probability $(1-f)^{2n}$. This is the per-allele absence event; absence events for different alleles in the same fixed-size sample need not be independent. Repeated generations change frequencies and introduce further dependence, so this product is not a universal multi-generation extinction law.`,
      caption: String.raw`A population carries 20 alleles at one locus, most of them rare (grey outline = initial frequencies). Choose the size and length of the bottleneck: the coloured bars show one simulated population just after it. Right: expected remaining heterozygosity (green, theory $(1-1/2n)^d$) and the share of alleles still present (blue, from 150 simulated bottlenecks), as the bottleneck size varies. The marker shows your setting. **New run** redraws the left panel.`,
      deps: ['popgen-2.7','prob-2.1.1a'],
      refs: ['Gillespie'],
      credit: 'Ernst Mayr, 1942 (founder principle)',
      scope: String.raw`Neutral sampling, no mutation during the bottleneck, population recovers fast afterwards. The initial allele spectrum shown is illustrative (a Zipf-like distribution), not a measured one.`,
      tags: ['bottleneck', 'founder effect', 'diversity'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Population_bottleneck' },
      viz(v) {
        const K = 20;
        const f0 = (() => { const w = Array.from({ length: K }, (_, i) => 1 / Math.pow(i + 1, 1.4)); const s = w.reduce((a, b) => a + b, 0); return w.map((x) => x / s); })();
        const H0 = 1 - f0.reduce((a, b) => a + b * b, 0);
        const nS = v.slider('bottleneck size $n$ (individuals)', 2, 500, 15, { int: true, log: true });
        const dS = v.slider('bottleneck length $d$ (generations)', 1, 10, 2, { int: true });
        let seed = 1; v.button('New run', () => { seed++; });
        const L = v.stage({ x: [0.3, K + 0.7], y: [0, 0.62], axes: 'box', gutter: true, height: 320, xlabel: 'allele (ordered by initial frequency)', ylabel: 'frequency', title: 'Allele frequencies after the bottleneck' });
        const Rg = v.stage({ x: [2, 500], y: [0, 1.05], xlog: true, axes: 'box', gutter: true, height: 320, xlabel: 'bottleneck size n (individuals)', ylabel: 'fraction retained', title: 'What a bottleneck keeps', minWidth: 300 });
        const one = memo(), curve = memo();
        function after(r, n, d) { let f = f0.slice(); for (let g = 0; g < d; g++) { const c = multinom(r, 2 * n, f); f = Array.from(c, (x) => x / (2 * n)); } return f; }
        let info = {};
        v.render(() => {
          const n = nS.value, d = dS.value;
          const f = one(`${n}|${d}|${seed}`, () => after(v.rng(seed * 31 + n * 7 + d), n, d));
          f0.forEach((x, i) => L.rect(i + 0.55, 0, i + 1.45, x, { color: 'muted', width: 1.5, alpha: 0.9 }));
          f.forEach((x, i) => { if (x > 0) L.rect(i + 0.6, 0, i + 1.4, x, { fill: i < 5 ? 'blue' : 'orange', fillAlpha: 0.5, color: i < 5 ? 'blue' : 'orange', width: 1 }); else L.dot(i + 1, 0.008, { r: 3, color: 'red', hollow: true }); });
          const C = curve(`${d}`, () => {
            const r = v.rng(99 + d), ns = [2, 3, 5, 8, 12, 20, 35, 60, 100, 180, 320, 500], R = 150;
            return ns.map((m) => { let al = 0; for (let i = 0; i < R; i++) { const g = after(r, m, d); for (let j = 0; j < K; j++) if (g[j] > 0) al++; } return [m, al / (R * K)]; });
          });
          Rg.fn((m) => Math.pow(1 - 1 / (2 * m), d), { domain: [2, 500], n: 200, color: 'green', width: 3 });
          Rg.path(C, { color: 'blue', width: 2.5 }); Rg.dots(C, { r: 3.5, color: 'blue' });
          const hn = Math.pow(1 - 1 / (2 * n), d), an = (() => { let lo = 0; for (let i = 1; i < C.length; i++) if (C[i][0] >= n) { const t = (Math.log(n) - Math.log(C[i - 1][0])) / (Math.log(C[i][0]) - Math.log(C[i - 1][0])); lo = C[i - 1][1] + t * (C[i][1] - C[i - 1][1]); break; } return lo; })();
          Rg.vline(n, { color: 'gold', width: 2 });
          const alleles = f.filter((x) => x > 0).length, hh = (1 - f.reduce((a, b) => a + b * b, 0)) / H0;
          info = { n, d, alleles, hh, hn, an };
        });
        v.legend([['muted', 'initial frequencies'], ['blue', 'common alleles kept', { area: true }], ['orange', 'rare alleles kept', { area: true }], ['green', 'heterozygosity, theory'], ['blue', 'share of alleles kept']]);
        v.readout(() => `This run: ${info.alleles} of ${K} alleles survive (red rings mark lost alleles) and gene diversity is ${v.fix(100 * info.hh, 0)}% of its original value.\nOn average at $n=${info.n}$, $d=${info.d}$: heterozygosity retained $(1-1/2n)^d=${v.fix(100 * info.hn, 1)}\\%$, but only ${v.fix(100 * info.an, 0)}% of alleles.`);
      },
    },

    // ───────────────────────────────────────────────────────────── 2.10
    {
      num: '2.10',
      kind: 'Phenomenon',
      name: 'Drift in replicate populations (Buri 1956)',
      statement: String.raw`In series I, Peter Buri followed 107 laboratory populations of *Drosophila melanogaster*, each kept at 16 flies per generation (all started with 16 heterozygotes for two eye-colour alleles, $bw^{75}$ and $bw$, at frequency $\tfrac12$) for 19 generations. The distribution of $bw^{75}$ frequency across the replicate lines spread out from a spike at $\tfrac12$, flattened, and piled up in the classes of loss and fixation, as the Wright–Fisher model predicts, with the mean frequency staying near $\tfrac12$. The spread was somewhat faster than for 16 breeding flies, Buri estimated $N_e=9.0$ for series I and $N_e=11.5$ for the separate series II (Summary §7, p. 400), both below the census 16.`,
      idea: String.raw`This experiment tests drift with replicated populations. All lines begin identical, so neutral sampling predicts divergence: the variance among lines grows by $p(1-p)/2N_e$ per generation (2.1) and heterozygosity decays as $(1-1/2N_e)^t$ (2.3), while the mean stays put (2.2). The observed recipient-class variances give $N_e=9.0$ for series I, below the census number of 16 — ordinary variation in family size and unequal fertility (2.6).`,
      caption: String.raw`A Wright–Fisher approximation to Buri’s series I with 107 lines, started at frequency $1/2$, **not his original counts**. The simulated gene pool has $2N_e$ copies; frequencies are rounded onto the census 32-copy scale for display. Drag the generation $t$ and watch the histogram of $bw^{75}$ copies per line flatten and pile up at 0 and 32. Right: mean heterozygosity of the lines against theory for the chosen $N_e$ (green) and for census size 16 (grey dashed). Lower $N_e$ speeds the spread; resample for another set of lines.`,
      deps: ['popgen-2.3'],
      refs: ['Buri (1956), Evolution 10:367–402, Table 7 and Summary §7; https://www.rpgroup.caltech.edu/embl_pboc_2023/assets/pdfs/buri1956.pdf'],
      credit: 'Peter Buri, 1956 (Evolution 10: 367–402)',
      scope: String.raw`Illustration by simulation of the published design; the lines are random, not the recorded data. The default $N_e=9$ is Buri’s estimate for series I, not the $11.5$ estimate for series II. A constant effective size is an approximation to his more heterogeneous experimental populations.`,
      tags: ['drift', 'experiment', 'Drosophila'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Genetic_drift#Experiment' },
      viz(v) {
        const neS = v.slider('effective size $N_e$ of each line', 4, 16, 9, { int: true });
        const tS = v.slider('generation $t$', 0, 19, 19, { int: true });
        let seed = 1; v.button('Resample lines', () => { seed++; });
        const L = v.stage({ x: [-1, 33], y: [0, 0.4], axes: 'box', gutter: true, height: 320, xlabel: 'number of bw75 copies in a line (out of 32)', ylabel: 'share of the 107 lines', title: 'Replicate lines at generation t' });
        const Rg = v.stage({ x: [0, 19], y: [0, 1.05], axes: 'box', gutter: true, height: 320, xlabel: 'generation', ylabel: 'relative heterozygosity $H/H_0$', title: 'Heterozygosity of the lines', minWidth: 300 });
        const sim = memo();
        let info = {};
        v.render(() => {
          const Ne = neS.value, n = 2 * Ne, t = tS.value;
          const D = sim(`${Ne}|${seed}`, () => {
            const r = v.rng(1956 + seed * 17), P = [];
            for (let i = 0; i < 107; i++) { const a = [n / 2]; for (let g = 1; g <= 19; g++) { const k = a[g - 1]; a.push(k > 0 && k < n ? binom(r, n, k / n) : k); } P.push(a); }
            return P;
          });
          const cnt = new Float64Array(33), H = new Float64Array(20);
          let lo = 0, hi = 0, sum = 0;
          D.forEach((a) => { const p = a[t] / n; cnt[Math.round(p * 32)]++; sum += p; if (a[t] === 0) lo++; if (a[t] === n) hi++; for (let g = 0; g <= 19; g++) { const q = a[g] / n; H[g] += 2 * q * (1 - q) / 107; } });
          const ymax = Math.max(0.12, Math.max(...cnt) / 107 * 1.15); L.setView([-1, 33], [0, ymax]);
          cnt.forEach((c, k) => { if (c) { const end = k === 0 || k === 32; L.rect(k - 0.42, 0, k + 0.42, c / 107, { fill: end ? 'red' : 'accent', fillAlpha: 0.4, color: end ? 'red' : 'accent', width: 1 }); } });
          L.vline(16, { color: 'muted', dash: true, alpha: 0.7 });
          Rg.fn((g) => Math.pow(1 - 1 / n, g), { domain: [0, 19], n: 60, color: 'green', width: 3 });
          Rg.fn((g) => Math.pow(1 - 1 / 32, g), { domain: [0, 19], n: 60, color: 'muted', width: 2, dash: true });
          Rg.dots(Array.from(H, (h, g) => [g, h / 0.5]), { r: 3.5, color: 'accent' });
          Rg.vline(t, { color: 'gold', width: 1.5 });
          info = { Ne, t, lo, hi, mean: sum / 107, seg: 107 - lo - hi, Hn: H[19] / 0.5, th: Math.pow(1 - 1 / n, 19), thC: Math.pow(1 - 1 / 32, 19) };
        });
        v.legend([['accent', 'simulated lines', { dot: true }], ['green', '$(1-1/2N_e)^t$'], ['muted', 'census 16', { dash: true }]]);
        v.readout(() => `Generation ${info.t}: ${info.lo} lines lost $bw^{75}$, ${info.hi} fixed it, ${info.seg} still segregating; mean frequency ${v.fix(info.mean, 3)}.\nHeterozygosity at generation 19: simulated ${v.fix(info.Hn, 3)}, theory ${v.fix(info.th, 3)} for $N_e=${info.Ne}$, ${v.fix(info.thC, 3)} for 16 flies.`);
      },
    },

    // ───────────────────────────────────────────────────────────── 2.11
    {
      num: '2.11',
      kind: 'Model',
      name: 'Diffusion approximation and the Kolmogorov equations',
      statement: String.raw`For large $N$, the allele frequency $p$ in the Wright–Fisher model is approximated by a diffusion on $[0,1]$ with no drift and variance $p(1-p)/2N$ per generation. Its density $\phi(p,t\mid p_0)$ satisfies the **Kolmogorov forward equation**
$$\frac{\partial\phi}{\partial t}=\frac1{4N}\,\frac{\partial^2}{\partial p^2}\bigl[p(1-p)\,\phi\bigr],$$
and every function $u(p_0,t)=\mathbb E_{p_0}[f(p_t)]$ satisfies the **backward equation** $\partial_t u=\frac1{4N}p_0(1-p_0)\,\partial^2_{p_0}u$. The boundaries $0$ and $1$ absorb: they carry atoms of probability that grow with $t$.`,
      idea: String.raw`One generation changes $p$ by a binomial increment with mean $0$ and variance $p(1-p)/2N$, and higher moments are of smaller order in $1/N$; a Taylor expansion of $\mathbb E[g(p_{t+1})]$ to second order then gives the generator $\frac1{4N}p(1-p)\,g''$ and hence the two Kolmogorov equations. The approximation is a Gaussian step with state-dependent variance, so it fails where the binomial is far from Gaussian (tiny $N$, or $p$ within a few copies of the walls) but is excellent in the interior.`,
      caption: String.raw`Left: the exact one-generation step from frequency $p_0$ (bars: binomial) against the diffusion’s Gaussian step (curve). Right: the exact Wright–Fisher density after $t$ generations (bars, from the transition matrix) against the numerical solution of the Kolmogorov forward equation (curve). Raise $N$ and the two coincide; at small $N$ the discrete chain differs in the tails and at the walls.`,
      deps: ['popgen-2.1', 'stoch-10.4'],
      refs: ['Ewens §4.2'],
      credit: 'Sewall Wright, 1945; Motoo Kimura, 1955',
      scope: String.raw`Large $N$, small per-generation changes, neutral. With selection and mutation the equation gains a drift term $M(p)$; the second-order term is unchanged.`,
      tags: ['diffusion', 'Kolmogorov equations'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Diffusion_equation' },
      viz(v) {
        const nS = v.slider('population size $N$', 5, 100, 15, { int: true });
        const pS = v.slider('initial frequency $p_0$', 0.1, 0.9, 0.3, { step: 0.05 });
        const tS = v.slider('generation $t$', 1, 400, 30, { int: true, log: true });
        const L = v.stage({ x: [0, 1], y: [0, 10], axes: 'box', gutter: true, height: 320, xlabel: 'frequency after one generation', ylabel: 'density', title: 'One step: binomial against Gaussian' });
        const Rg = v.stage({ x: [0, 1], y: [0, 2], axes: 'box', gutter: true, height: 320, xlabel: 'frequency after t generations', ylabel: 'density (interior)', title: 'After $t$ generations', minWidth: 300 });
        const exact = memo(), diff = memo();
        let info = {};
        v.render(() => {
          const N = nS.value, n = 2 * N, p0 = pS.value, k0 = Math.round(p0 * n), q = k0 / n, t = tS.value;
          // one step
          const sd = Math.sqrt(q * (1 - q) / n);
          const gauss = (x) => Math.exp(-0.5 * ((x - q) / sd) ** 2) / (sd * Math.sqrt(2 * Math.PI));
          let ymax = gauss(q) * 1.15;
          L.setView([clamp(q - 4.5 * sd, 0, 1), clamp(q + 4.5 * sd, 0, 1)], [0, ymax]);
          for (let j = 0; j <= n; j++) { const d = binomPmf(n, j, q) * n; if (d > 1e-4) L.rect((j - 0.5) / n, 0, (j + 0.5) / n, d, { fill: 'accent', fillAlpha: 0.35, color: 'accent', width: 1 }); }
          L.fn(gauss, { domain: [Math.max(0, q - 5 * sd), Math.min(1, q + 5 * sd)], n: 200, color: 'green', width: 3 });
          // t steps
          const E = exact(`${N}|${k0}`, () => { const P = wfMatrix(n); let d = new Float64Array(n + 1); d[k0] = 1; const out = [d]; for (let g = 1; g <= 400; g++) { d = evolve(P, d); out.push(d); } return out; });
          const d = E[t], F = diff(`${N}|${p0}|${t}`, () => fokkerPlanck(N, q, t, 200, Math.min(0.1, t / 20)));
          let emax = 0; for (let j = 1; j < n; j++) emax = Math.max(emax, d[j] * n);
          let fmax = 0; for (let j = 0; j < F.phi.length; j++) fmax = Math.max(fmax, F.phi[j]);
          Rg.setView([0, 1], [0, Math.max(emax, fmax, 0.3) * 1.15]);
          for (let j = 1; j < n; j++) Rg.rect((j - 0.5) / n, 0, (j + 0.5) / n, d[j] * n, { fill: 'accent', fillAlpha: 0.3, color: 'accent', width: 1 });
          Rg.path(Array.from(F.phi, (x, j) => [(j + 1) * F.h, x]), { color: 'green', width: 3 });
          Rg.vline(q, { color: 'muted', dash: true, alpha: 0.6 });
          let inner = 0; for (let j = 1; j < n; j++) inner += d[j];
          info = { N, t, lostE: d[0], fixE: d[n], lostD: F.lost, fixD: F.fixed, inner, innerD: F.inner };
        });
        v.legend([['accent', 'exact Wright–Fisher', { area: true }], ['green', 'diffusion']]);
        v.readout(() => `At $t=${info.t}$: probability lost — exact ${v.fix(info.lostE, 3)}, diffusion ${v.fix(info.lostD, 3)}; fixed — exact ${v.fix(info.fixE, 3)}, diffusion ${v.fix(info.fixD, 3)}; still interior — exact ${v.fix(info.inner, 3)}, diffusion ${v.fix(info.innerD, 3)}.\nDiffusion variance per generation $p(1-p)/2N$ matches the binomial exactly; the discrepancy comes from non-Gaussian tails at small $N$.`);
      },
    },

    // ───────────────────────────────────────────────────────────── 2.12
    {
      num: '2.12',
      kind: 'Theorem',
      name: 'Mean absorption time ≈ 4N generations',
      statement: String.raw`In the diffusion approximation of neutral drift in a diploid population of size $N$, the mean time until the allele is lost or fixed, starting at frequency $p$, is
$$\bar t(p)=-4N\bigl[p\ln p+(1-p)\ln(1-p)\bigr]\ \text{generations},$$
which is largest at $p=\tfrac12$, where $\bar t=4N\ln2\approx2.77N$. The mean time given fixation is $\bar t_{\mathrm{fix}}(p)=-4N\frac{1-p}{p}\ln(1-p)$ ($\to4N$ as $p\to0$), and given loss $\bar t_{\mathrm{loss}}(p)=-4N\frac{p}{1-p}\ln p$ ($\to 2\ln 2N$ for a single new copy).`,
      idea: String.raw`The mean time $T(p)$ solves the backward equation with a unit source: $\frac1{4N}p(1-p)\,T''=-1$ with $T(0)=T(1)=0$. Integrating twice gives $T''=-4N/[p(1-p)]$ and hence $T=-4N[p\ln p+(1-p)\ln(1-p)]$, using the boundary conditions (2.11). The entropy-like shape reflects that near the walls the variance $p(1-p)/2N$ is small, so frequencies close to $0$ or $1$ move slowly; yet a rare allele is usually lost quickly (about $2\ln 2N$ generations for a single copy), and the long times belong to the rare runs in which it rises toward fixation.`,
      caption: String.raw`Left: mean absorption time against starting frequency from simulation (dots), from the exact chain (solid; solves $(I-Q)T=1$ on the transition matrix) and from the diffusion formula (green dashed). Right: the distribution of absorption times from the chosen $p_0$, split into runs that end in fixation (blue) and loss (orange); the vertical lines are the conditional means from the formulas. Make $p_0$ small: loss is quick, the rare fixation slow.`,
      deps: ['popgen-2.11', 'popgen-2.4'],
      refs: ['Ewens §4.4', 'Ewens §5.2'],
      credit: 'Motoo Kimura & Tomoko Ohta, 1969',
      scope: String.raw`Diffusion approximation (large $N$); neutral. Times are in generations of the ideal Wright–Fisher population of size $N_e$.`,
      tags: ['drift', 'absorption time', 'diffusion'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Fixation_(population_genetics)' },
      viz(v) {
        const nS = v.slider('population size $N$', 5, 40, 15, { int: true });
        const pS = v.slider('initial frequency $p_0$ (right panel)', 0.05, 0.95, 0.5, { step: 0.05 });
        const RS = v.slider('runs per point', 100, 800, 300, { int: true, step: 50 });
        const L = v.stage({ x: [0, 1], y: [0, 100], axes: 'box', gutter: true, height: 330, xlabel: 'initial frequency p₀', ylabel: 'mean generations to absorption', title: 'Mean time to loss or fixation' });
        const Rg = v.stage({ x: [0, 200], y: [0, 0.02], axes: 'box', gutter: true, height: 330, xlabel: 'generations to absorption', ylabel: 'share of runs', title: 'Distribution from $p_0$', minWidth: 300 });
        const simA = memo(), simB = memo(), exactM = memo();
        let info = {};
        v.render(() => {
          const N = nS.value, n = 2 * N, R = RS.value, k0 = Math.round(pS.value * n), p0 = k0 / n;
          const ex = exactM(`${N}`, () => {
            const P = wfMatrix(n), m = n - 1, A = [], b = [];
            for (let i = 1; i < n; i++) { const row = new Array(m).fill(0); for (let j = 1; j < n; j++) row[j - 1] = (i === j ? 1 : 0) - P[i][j]; A.push(row); b.push(1); }
            const T = v.M.solve(A, b); return [0, ...T, 0];
          });
          const diff = (p) => (p <= 0 || p >= 1 ? 0 : -4 * N * (p * Math.log(p) + (1 - p) * Math.log(1 - p)));
          const ks = Array.from({ length: 12 }, (_, i) => Math.max(1, Math.min(n - 1, Math.round(((i + 1) * n) / 13))));
          const S = simA(`${N}|${R}`, () => { const r = v.rng(121 + N); return ks.map((k) => { let s = 0; for (let i = 0; i < R; i++) s += wfAbsorb(r, n, k).t; return [k / n, s / R]; }); });
          L.setView([0, 1], [0, diff(0.5) * 1.15]);
          L.path(Array.from({ length: n + 1 }, (_, k) => [k / n, ex[k]]), { color: 'ink', width: 2 });
          L.fn(diff, { domain: [0.001, 0.999], n: 200, color: 'green', width: 3, dash: true });
          L.dots(S, { r: 4.5, color: 'accent' });
          L.vline(p0, { color: 'gold', width: 1.5, alpha: 0.8 });
          const B = simB(`${N}|${R}|${k0}`, () => { const r = v.rng(777 + N + k0), fx = [], ls = []; for (let i = 0; i < R * 2; i++) { const a = wfAbsorb(r, n, k0); (a.fixed ? fx : ls).push(a.t); } return { fx, ls }; });
          const all = B.fx.concat(B.ls), tmax = Math.max(40, v.M.quantile(all, 0.985));
          const tot = all.length, bins = 30, w = tmax / bins;
          const hf = v.M.histogram(B.fx, { bins, range: [0, tmax] }), hl = v.M.histogram(B.ls, { bins, range: [0, tmax] });
          let ym = 0; for (let b = 0; b < bins; b++) ym = Math.max(ym, hf.counts[b] / tot, hl.counts[b] / tot);
          Rg.setView([0, tmax], [0, ym * 1.2]);
          for (let b = 0; b < bins; b++) {
            if (hl.counts[b]) Rg.rect(b * w, 0, (b + 1) * w, hl.counts[b] / tot, { fill: 'orange', fillAlpha: 0.35, color: 'orange', width: 1 });
            if (hf.counts[b]) Rg.rect(b * w, 0, (b + 1) * w, hf.counts[b] / tot, { fill: 'blue', fillAlpha: 0.35, color: 'blue', width: 1 });
          }
          const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);
          const tf = -4 * N * ((1 - p0) / p0) * Math.log(1 - p0), tl = -4 * N * (p0 / (1 - p0)) * Math.log(p0);
          Rg.vline(tf, { color: 'blue', width: 2, dash: true }); Rg.vline(tl, { color: 'orange', width: 2, dash: true });
          info = { N, p0, mt: mean(all), th: diff(p0), ex: ex[k0], mf: mean(B.fx), ml: mean(B.ls), tf, tl, nf: B.fx.length / tot };
        });
        v.legend([['accent', 'simulation', { dot: true }], ['ink', 'exact chain'], ['green', '$-4N[p\\ln p+(1-p)\\ln(1-p)]$', { dash: true }], ['blue', 'ends in fixation', { area: true }], ['orange', 'ends in loss', { area: true }]]);
        v.readout(() => `From $p_0=${v.fix(info.p0, 2)}$: mean time ${v.fix(info.mt, 1)} generations (exact ${v.fix(info.ex, 1)}, diffusion ${v.fix(info.th, 1)}); the peak value at $p=\\tfrac12$ is $4N\\ln 2=${v.fix(4 * info.N * Math.log(2), 1)}$.\nGiven fixation (${v.fix(100 * info.nf, 0)}% of runs): ${v.fix(info.mf, 1)} vs formula ${v.fix(info.tf, 1)}. Given loss: ${v.fix(info.ml, 1)} vs formula ${v.fix(info.tl, 1)}.`);
      },
    },

    // ───────────────────────────────────────────────────────────── 2.13
    {
      num: '2.13',
      kind: 'Theorem',
      name: 'Spreading of the frequency distribution under pure drift',
      statement: String.raw`For neutral drift in the diffusion approximation, starting at $p_0$, the density of $p$ on the open interval $(0,1)$ at time $t$ is
$$\phi(p,t\mid p_0)=\sum_{i=1}^{\infty}i(i+1)(2i+1)\,p_0(1-p_0)\,F(1-i,\,i+2;\,2;\,p_0)\,F(1-i,\,i+2;\,2;\,p)\;e^{-i(i+1)t/4N},$$
with $F$ Gauss’s hypergeometric polynomial (a Gegenbauer polynomial in $1-2p$). The atoms at $0$ and $1$ are what remains: $\Pr(p_t=1)=p_0-\int_0^1p\,\phi\,dp$ and $\Pr(p_t=0)=1-p_0-\int_0^1(1-p)\phi\,dp$. At late times only the $i=1$ term survives, so the interior density is flat, $\approx6p_0(1-p_0)e^{-t/2N}$, and decays at rate $1/2N$.`,
      idea: String.raw`The backward operator $\frac1{4N}p(1-p)\,\partial_p^2$ is self-adjoint with weight $p(1-p)$, and its polynomial eigenfunctions $p(1-p)F(1-i,i+2;2;p)$ with eigenvalues $-i(i+1)/4N$ are orthogonal. Expanding the point mass at $p_0$ in the dual eigenfunctions gives the series. The first eigenvalue $1/2N$ is the rate at which heterozygosity decays (2.3), and its eigenfunction $1$ says that the distribution of surviving polymorphic populations becomes uniform; higher modes dominate at short times and decay faster.`,
      caption: String.raw`Kimura’s series (green, truncated at the chosen number of terms) against a histogram of 3000 simulated populations (bars) at generation $t$: at first the density is a spike spread by the high modes, later it flattens to the uniform $i=1$ shape while mass leaks to the walls. Right: probabilities of loss (orange) and fixation (blue) over time from the series (curves) and the simulation (dots). With few terms, early-time curves oscillate: the high modes are needed there.`,
      deps: ['popgen-2.11'],
      refs: ['Ewens §5.2'],
      credit: 'Motoo Kimura, 1955',
      scope: String.raw`Diffusion approximation, neutral, no mutation or migration; a finite sum is accurate at times $t\gtrsim N$, and needs many terms at small $t$.`,
      tags: ['diffusion', 'drift', 'eigenfunctions'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Gegenbauer_polynomials' },
      viz(v) {
        const nS = v.slider('population size $N$', 10, 50, 20, { int: true });
        const pS = v.slider('initial frequency $p_0$', 0.1, 0.9, 0.3, { step: 0.05 });
        const tS = v.slider('generation $t$', 5, 600, 40, { int: true, log: true });
        const kS = v.slider('terms in the series', 1, 60, 30, { int: true });
        const TMAX = 600, R = 3000;
        const L = v.stage({ x: [0, 1], y: [0, 3], axes: 'box', gutter: true, height: 330, xlabel: 'allele frequency', ylabel: 'density in (0, 1)', title: 'Interior density at time $t$' });
        const Rg = v.stage({ x: [0, 600], y: [0, 1], axes: 'box', gutter: true, height: 330, xlabel: 'generation', ylabel: 'probability', title: 'Mass at the walls', minWidth: 300 });
        const sim = memo(), curves = memo();
        let info = {};
        v.render(() => {
          const N = nS.value, n = 2 * N, k0 = Math.round(pS.value * n), p0 = k0 / n, t = tS.value, K = kS.value;
          const S = sim(`${N}|${k0}`, () => {
            const r = v.rng(2025 + N), a = new Uint8Array(R * (TMAX + 1));
            for (let i = 0; i < R; i++) { let k = k0; a[i * (TMAX + 1)] = k; for (let g = 1; g <= TMAX; g++) { if (k > 0 && k < n) k = binom(r, n, k / n); a[i * (TMAX + 1) + g] = k; } }
            return a;
          });
          const bins = 20, hc = new Float64Array(bins); let lo = 0, hi = 0;
          for (let i = 0; i < R; i++) { const k = S[i * (TMAX + 1) + t]; if (k === 0) lo++; else if (k === n) hi++; else hc[Math.min(bins - 1, Math.floor((k / n) * bins))]++; }
          const dens = Array.from(hc, (c) => c / R * bins);
          const f = (p) => kimuraDensity(N, p0, p, t, K);
          const grid = Array.from({ length: 160 }, (_, i) => (i + 0.5) / 160), fv = grid.map(f);
          const ymax = Math.max(0.5, Math.max(...dens) * 1.1, Math.min(Math.max(...fv), 6) * 1.05);
          L.setView([0, 1], [clamp(Math.min(...fv) * 1.2, -2, 0), ymax]);
          dens.forEach((d, b) => L.rect(b / bins, 0, (b + 1) / bins, d, { fill: 'accent', fillAlpha: 0.3, color: 'accent', width: 1 }));
          L.clip(() => L.path(grid.map((p, i) => [p, fv[i]]), { color: 'green', width: 3 }));
          const C = curves(`${N}|${p0}|${K}`, () => Array.from({ length: 41 }, (_, i) => { const tt = Math.max(1, (i * TMAX) / 40); const m = kimuraMasses(N, p0, tt, K, 160); return [tt, m.lost, m.fixed]; }));
          Rg.path(C.map((c) => [c[0], c[1]]), { color: 'orange', width: 2.5 });
          Rg.path(C.map((c) => [c[0], c[2]]), { color: 'blue', width: 2.5 });
          const dots = []; for (let g = 10; g <= TMAX; g += 30) { let a = 0, b = 0; for (let i = 0; i < R; i++) { const k = S[i * (TMAX + 1) + g]; if (k === 0) a++; else if (k === n) b++; } dots.push([g, a / R, b / R]); }
          Rg.dots(dots.map((d) => [d[0], d[1]]), { r: 3.5, color: 'orange' }); Rg.dots(dots.map((d) => [d[0], d[2]]), { r: 3.5, color: 'blue' });
          Rg.vline(t, { color: 'gold', width: 1.5 });
          const m = kimuraMasses(N, p0, t, K, 160);
          info = { t, K, lo: lo / R, hi: hi / R, ml: m.lost, mf: m.fixed, inner: 1 - lo / R - hi / R, mi: m.inner, lead: 6 * p0 * (1 - p0) * Math.exp(-t / (2 * N)) };
        });
        v.legend([['green', 'Kimura series'], ['accent', 'simulation', { area: true }], ['orange', 'lost'], ['blue', 'fixed']]);
        v.readout(() => `At $t=${info.t}$ with ${info.K} terms: lost ${v.fix(info.ml, 3)} (simulated ${v.fix(info.lo, 3)}), fixed ${v.fix(info.mf, 3)} (${v.fix(info.hi, 3)}), interior ${v.fix(info.mi, 3)} (${v.fix(info.inner, 3)}).\nOne-term (flat) approximation: density $6p_0(1-p_0)e^{-t/2N}=${v.fix(info.lead, 3)}$.`);
      },
    },

    // ───────────────────────────────────────────────────────────── 2.14
    {
      num: '2.14',
      kind: 'Paper',
      name: 'Evolution in Mendelian Populations',
      paper: { authors: 'Sewall Wright', year: 1931, title: 'Evolution in Mendelian Populations', venue: 'Genetics 16 (2): 97–159', doi: '10.1093/genetics/16.2.97' },
      introduces: ['popgen-2.1', 'popgen-2.3', 'popgen-2.6', 'popgen-3.2', 'popgen-7.8'],
      statement: String.raw`Wright worked out how the distribution of gene frequencies across a population of finite size $N$ is shaped jointly by drift and by a systematic pressure (mutation at rates $u$ and $v$, or immigration at rate $m$ from a pool of mean frequency $\bar q$). At equilibrium it is a **Beta distribution**: with mutation, $\phi(p)\propto p^{4Nv-1}(1-p)^{4Nu-1}$; with migration, $\phi(p)\propto p^{4Nm\bar q-1}(1-p)^{4Nm(1-\bar q)-1}$. It is U-shaped, with most populations fixed or nearly fixed, when the product $4Nm$ (or $4Nu$, $4Nv$) is below $1$, and humped around the mean when it is above $1$. Variance among populations is $\bar q(1-\bar q)/(1+4Nm)$. The paper also introduces the effective population size and the inbreeding coefficient as a function of $N_e$, and the shifting-balance picture of evolution among partially isolated populations.`,
      idea: String.raw`Before 1931, population genetics (Fisher, Haldane) treated large populations in which selection acts deterministically. Wright set up the stochastic process for frequencies: sampling variance $p(1-p)/2N$ per generation opposed by the systematic pressure, giving a stationary density by balancing probability flux. The result shows that one product, $4Nm$ (the number of immigrants per generation, up to a factor 4), decides whether local populations stay differentiated; below one migrant per generation drift wins. This became the basis of $F_{ST}$, of the neutral theory’s equilibrium (Kimura), and of his shifting-balance theory of evolution, in which small semi-isolated demes explore gene combinations that a large panmictic population never reaches.`,
      caption: String.raw`Left: Wright’s stationary density (green) against the histogram of allele frequencies in 300 simulated demes of $N$ individuals each, after drift and migration (or mutation) have reached balance (simulated here, not Wright’s own numbers). Right: the 300 demes as a patchwork, coloured by frequency of allele $A$ (blue) against $a$ (orange). Slide $4Nm$ through 1: U-shaped to humped, patchwork to uniform. The readout compares Wright’s predicted variance with the simulated one.`,
      deps: ['popgen-1.5', 'popgen-3.1', 'popgen-4.3'],
      refs: [],
      credit: 'Sewall Wright, 1931',
      scope: String.raw`Neutral; weak systematic pressure ($u$, $v$, $m\ll1$); random mating in each deme of size $N$; diffusion approximation. For migration the pool frequency is held fixed (continent–island or island model with many demes).`,
      tags: ['drift', 'migration', 'history'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Sewall_Wright' },
      viz(v) {
        const mode = v.select('pressure', [{ value: 'mig', label: 'migration (rate $m$, pool frequency $\\bar q$)' }, { value: 'mut', label: 'mutation ($A\\to a$ at $u$, $a\\to A$ at $v$)' }], 'mig');
        const nS = v.slider('deme size $N$', 10, 200, 50, { int: true, log: true });
        const mS = v.slider('migration rate $m$', 1e-4, 0.3, 0.004, { log: true });
        const qS = v.slider('pool frequency $\\bar q$', 0.1, 0.9, 0.5, { step: 0.05 });
        const uS = v.slider('mutation $u$ ($A\\to a$)', 1e-4, 0.1, 0.004, { log: true });
        const vS = v.slider('mutation $v$ ($a\\to A$)', 1e-4, 0.1, 0.004, { log: true });
        let seed = 1; v.button('New demes', () => { seed++; });
        const L = v.stage({ x: [0, 1], y: [0, 4], axes: 'box', gutter: true, height: 330, xlabel: 'frequency of A in a deme', ylabel: 'density', title: 'Stationary distribution of gene frequency' });
        const GR = 20, GC = 15;
        const Rg = v.stage({ x: [0, GR], y: [0, GC], axes: false, height: 330, equal: true, title: '300 demes (blue = A, orange = a)', minWidth: 300 });
        const sim = memo();
        let info = {};
        v.render(() => {
          const m = mode.value === 'mig';
          mS.el.hidden = qS.el.hidden = !m; uS.el.hidden = vS.el.hidden = m;
          const N = nS.value, n = 2 * N;
          let u, vv, q;
          if (m) { q = qS.value; u = mS.value * (1 - q); vv = mS.value * q; } else { u = uS.value; vv = vS.value; q = vv / (u + vv); }
          const a = 4 * N * vv, b = 4 * N * u;
          const D = sim(`${n}|${u}|${vv}|${seed}`, () => {
            const r = v.rng(seed * 313 + N), ks = new Int32Array(300).fill(Math.round(q * n));
            const G = Math.min(2500, Math.round(8 / (1 / n + u + vv))), snaps = [];
            for (let g = 0; g < G; g++) {
              for (let i = 0; i < 300; i++) ks[i] = wfNext(r, n, ks[i], 0, u, vv);
              if (g >= G - 5 * Math.round(n / 4) && (g - (G - 1)) % Math.max(1, Math.round(n / 4)) === 0) snaps.push(ks.slice());
            }
            snaps.push(ks.slice());
            return { last: ks.slice(), snaps };
          });
          const lg = v.M.lgamma, pdf = (x) => Math.exp(lg(a + b) - lg(a) - lg(b) + (a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x));
          const bins = 20, hc = new Float64Array(bins); let tot = 0, mean = 0, m2 = 0;
          D.snaps.forEach((s) => s.forEach((k) => { const p = k / n; hc[Math.min(bins - 1, Math.floor(p * bins))]++; tot++; mean += p; m2 += p * p; }));
          mean /= tot; const varS = m2 / tot - mean * mean;
          const dens = Array.from(hc, (c) => (c / tot) * bins);
          const ymax = Math.min(8, Math.max(1.3, Math.max(...dens) * 1.15, pdf(0.5) * 1.2));
          L.setView([0, 1], [0, ymax]);
          dens.forEach((d, i) => L.rect(i / bins, 0, (i + 1) / bins, d, { fill: 'accent', fillAlpha: 0.3, color: 'accent', width: 1 }));
          L.clip(() => L.fn(pdf, { domain: [0.003, 0.997], n: 300, color: 'green', width: 3 }));
          for (let i = 0; i < 300; i++) { const x = i % GR, y = GC - 1 - Math.floor(i / GR), p = D.last[i] / n; Rg.rect(x + 0.06, y + 0.06, x + 0.94, y + 0.94, { fill: v.mix('orange', 'blue', p), fillAlpha: 1, stroke: false }); }
          const th = (q * (1 - q)) / (1 + a + b);
          info = { a, b, q, mean, varS, th, shape: a < 1 && b < 1 ? 'U-shaped (both parameters below 1)' : a > 1 && b > 1 ? 'humped (both parameters above 1)' : 'J-shaped (one parameter below 1)', pe: 4 * N * (m ? mS.value : u + vv) };
        });
        v.legend([['green', 'Wright’s Beta density'], ['accent', 'simulated demes', { area: true }]]);
        v.readout(() => `Wright’s exponents: $4N v=${v.fix(info.a, 2)}$, $4N u=${v.fix(info.b, 2)}$ (for migration: $4Nm\\bar q$ and $4Nm(1-\\bar q)$; $4Nm=${v.fix(info.pe, 2)}$) — the density is ${info.shape}.\nMean frequency: simulated ${v.fix(info.mean, 3)}, predicted ${v.fix(info.q, 3)}. Variance among demes: simulated ${v.fix(info.varS, 4)}, predicted $\\bar q(1-\\bar q)/(1+4Nm)=${v.fix(info.th, 4)}$.`);
      },
    },
  ],
};
