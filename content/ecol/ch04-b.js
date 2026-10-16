// Ecology — Chapter 4 (part b): limiting similarity to the competition–colonization trade-off
import { solveDense, jcInit, jcStep, jcRichness, spcol } from './ch04.shared.js';

export default {
  collection: 'ecol',
  chapter: 4,
  items: [
    // ───────────────────────────────────────────────────────────── 4.7
    {
      num: '4.7',
      kind: 'Concept',
      name: 'Limiting similarity',
      credit: 'R. H. MacArthur & R. Levins, 1967; R. M. May & R. H. MacArthur, 1972',
      statement: String.raw`Species that live on a resource axis (prey size, seed size, perch height…) use it with overlapping utilization curves. In the Lotka–Volterra model the competition coefficient between species $i$ and $j$ is the overlap of their curves relative to a species' overlap with itself, $\alpha_{ij}=\int u_iu_j\big/\int u_i^2$, so it falls with the spacing $d$ between their optima measured in units of the curve width $w$. **Limiting similarity** is the idea that there is a smallest spacing $d/w$ below which the equilibrium coexistence of a packed community is lost: closer-packed species are driven out by small differences in their fitness.`,
      scope: String.raw`This is about the Lotka–Volterra equilibrium with equal, constant carrying capacities and a regular spacing. The minimum $d/w$ is not a universal constant: it depends on the shape of the utilization curves and on how much the species differ in fitness (the noise slider), a point stressed by May and MacArthur (1972) and by later critics of a fixed limit.`,
      idea: String.raw`Coexistence of $n$ species needs the equilibrium $N^*=\alpha^{-1}K$ to be positive. Because $\alpha$ is the autocorrelation of the utilization curves it is a positive definite matrix, so the equilibrium is always *stable* when it exists (the minimum eigenvalue below stays positive); what fails when the species are packed is **feasibility**. As the spacing shrinks, $\alpha$ becomes nearly singular, $\alpha^{-1}$ amplifies tiny differences in $K_i$, and some $N_i^*$ turn negative. With realistic fitness noise there is thus a threshold spacing, of the order of the curve width, below which a random community loses species (community matrix: mathbio-3.21).`,
      caption: String.raw`Top: the resource axis with $n$ equally spaced species whose utilization curves have width $w=1$ (choose the curve shape). Bottom left: equilibrium abundances $N_i^*$ for the carrying capacities $K_i$ (green positive, red negative = that species cannot be in the community). Bottom right: the fraction of 150 random draws of the $K_i$ (log-normal with the chosen noise) in which all $n$ species are feasible, as a function of spacing; the gold line marks your spacing. Squeeze $d/w$ and watch the curve fall from 1 to 0.`,
      deps: ['mathbio-3.21'],
      refs: ['Begon ch. 19'],
      tags: ['niche', 'competition', 'species packing'],
      links: { doi: 'https://doi.org/10.1086/282505' },
      verify: true,
      viz(v) {
        const nS = v.slider('number of species $n$', 3, 9, 5, { int: true });
        const dS = v.slider('spacing $d/w$', 0.2, 3.5, 1, { step: 0.05 });
        const sS = v.slider('noise in carrying capacities (s.d. of $\\ln K$)', 0, 0.4, 0.1, { step: 0.01 });
        const kern = v.select('utilization curves', [{ value: 'g', label: 'Gaussian' }, { value: 'l', label: 'exponential' }, { value: 'b', label: 'box' }], 'g');
        const alpha = (k, d) => { d = Math.abs(d); return k === 'g' ? Math.exp(-d * d / 4) : k === 'l' ? (1 + d) * Math.exp(-d) : Math.max(0, 1 - d / 2); };
        const util = (k, x) => (k === 'g' ? Math.exp(-x * x / 2) : k === 'l' ? Math.exp(-Math.abs(x)) : Math.abs(x) <= 1 ? 1 : 0);
        const A = v.stage({ x: [-6, 6], y: [0, 1.25], axes: 'box', gutter: true, height: 230, xlabel: 'position on the resource axis (units of $w$)', title: 'utilization curves', full: true });
        const B = v.stage({ x: [0, 10], y: [-1, 2], axes: 'box', gutter: true, height: 270, xlabel: 'species', ylabel: 'equilibrium $N_i^*$', title: 'equilibrium abundances', weight: 1 });
        const C = v.stage({ x: [0, 3.5], y: [0, 1.05], axes: 'box', gutter: true, height: 270, xlabel: 'spacing $d/w$', ylabel: 'fraction of draws feasible', title: 'chance that all $n$ species coexist', weight: 1 });
        let mcKey = '', mc = [], info = null;
        const solveFor = (k, n, dw, Kv) => { const M = []; for (let i = 0; i < n; i++) { M.push([]); for (let j = 0; j < n; j++) M[i].push(alpha(k, (i - j) * dw)); } return { M, x: solveDense(M, Kv) }; };
        v.render(() => {
          const n = nS.value, dw = dS.value, sd = sS.value, k = kern.value;
          const half = Math.max(3, ((n - 1) * dw) / 2 + 2.5);
          A.setView([-half, half], [0, 1.25]);
          const xs = Array.from({ length: n }, (_, i) => (i - (n - 1) / 2) * dw);
          xs.forEach((x0, i) => A.fn((x) => util(k, x - x0), { color: spcol(i), width: 2, fill: true, fillAlpha: 0.1, domain: [x0 - 5, x0 + 5], n: 300 }));
          const r = v.rng(31), z = [];
          const NT = 150;
          for (let t = 0; t < NT; t++) { z.push([]); for (let i = 0; i < n; i++) z[t].push(r.normal()); }
          const key = [n, sd, k].join('|');
          if (key !== mcKey) {
            mcKey = key; mc = [];
            for (let q = 0; q <= 35; q++) {
              const d = 0.1 + (3.4 * q) / 35; let ok = 0;
              for (let t = 0; t < NT; t++) { const { x } = solveFor(k, n, d, z[t].map((e) => Math.exp(sd * e))); if (x && x.every((u) => u > 0)) ok++; }
              mc.push([d, ok / NT]);
            }
          }
          const Kv = z[0].map(() => 1).map((one, i) => Math.exp(sd * z[0][i]));
          const { M, x: Ns } = solveFor(k, n, dw, Kv);
          B.setView([0, n + 1], [Math.min(-0.5, ...(Ns || [0]).map((u) => u * 1.1)), Math.max(2, ...(Ns || [0]).map((u) => u * 1.1))]);
          if (Ns) B.bars(Ns, { x0: 1, dx: 1, color: (u) => (u > 0 ? 'green' : 'red') });
          B.hline(0, { color: 'ink', width: 1 });
          C.path(mc, { color: 'accent', width: 2.6 });
          C.vline(dw, { color: 'gold', width: 2 });
          const feas = Ns && Ns.every((u) => u > 0);
          const lam = v.M.eigSym(M).values; const lmin = Math.min(...lam);
          info = { feas, lmin, minN: Ns ? Math.min(...Ns) : NaN, p: (mc.reduce((a, b) => (Math.abs(b[0] - dw) < Math.abs(a[0] - dw) ? b : a))[1]) };
        });
        v.readout(() => info && String.raw`Smallest eigenvalue of $\alpha$: $${v.fix(info.lmin, 4)}$ (${info.lmin > 0 ? 'positive: the equilibrium, if it exists, is stable' : 'not positive'}). For this draw of $K_i$: smallest $N_i^*=${v.fix(info.minN, 3)}$ → **${info.feas ? 'all species coexist' : 'at least one species is lost'}**. Probability of full coexistence at this spacing: $${v.fix(info.p, 2)}$.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.8
    {
      num: '4.8',
      kind: 'Phenomenon',
      name: 'Character displacement',
      credit: 'W. L. Brown & E. O. Wilson, 1956 (term); P. R. Grant & B. R. Grant, 2006 (Darwin’s finches)',
      statement: String.raw`Two closely related species that overlap in space often differ more in a trait that governs resource use (beak depth, body size) where they live together (**sympatry**) than where each lives alone (**allopatry**). This pattern, character displacement, is explained by natural selection driven by competition: where the species meet, individuals that overlap least with the rival's resource use have the highest fitness, so the two species' trait means are pushed apart until competition and the resource supply balance.`,
      scope: String.raw`The model below shows that competition can produce divergence, not that any given field pattern is caused by it: a pattern of larger differences in sympatry can also result from species sorting (only species that already differ can coexist) or from environmental differences between islands. Such alternatives must be excluded by tests (e.g. Schluter, Price & Grant 1985). In the classic example the ground finches *Geospiza fortis* and *G. fuliginosa* differ little in beak depth on islands where each occurs alone, and more where they occur together; Grant & Grant (2006) reported displacement of *G. fortis* observed on Daphne Major after the arrival of the larger *G. magnirostris*.`,
      idea: String.raw`Let each species' carrying capacity be a Gaussian function of its trait $z$ (resource availability, width $\sigma_K$) and let the competition coefficient fall with the trait distance, $\alpha(d)=e^{-d^2/2\sigma_a^2}$. The mean trait climbs the gradient of per-capita fitness, evaluated at the ecological equilibrium of the Lotka–Volterra competition model (mathbio-3.15): $$\dot z_i\propto \frac{d_i}{\sigma_a^2}\,\alpha(d_i)\frac{N_j^*}{K(z_i)}-\frac{z_i}{\sigma_K^2},\qquad d_i=z_i-z_j .$$ The first term pushes the species away from the rival, the second pulls it back toward the best resources; the balance sets the final separation. (This is the trait-evolution model of Slatkin 1980, simplified.) Species that are too similar to coexist ecologically in the first place are not rescued by evolution when $\alpha$ is large relative to the resource gradient, so divergence needs the right balance.`,
      caption: String.raw`The two populations start close to the resource optimum (faint dots). Left: the resource curve $K(z)$ and the trait distributions of the two species at the current time. Right: their mean traits through time in **sympatry** (solid) and in **allopatry** (dashed, each species alone). Press play, or change $\sigma_a$ (competition width) and $\sigma_K$ (resource breadth): wide competition kernels give strong displacement, a very narrow resource axis pulls the species together again.`,
      deps: ['ecol-4.7'],
      refs: ['Begon ch. 8'],
      tags: ['evolution', 'competition', 'trait'],
      links: { doi: 'https://doi.org/10.1126/science.1128374' },
      verify: true,
      viz(v) {
        const sa = v.slider('width of competition $\\sigma_a$', 0.2, 1.5, 0.6, { step: 0.05 });
        const sk = v.slider('breadth of resources $\\sigma_K$', 0.3, 2, 1, { step: 0.05 });
        const T = 40, dt = 0.1;
        const run = (sym) => {
          const a = sa.value, k = sk.value, Kf = (z) => Math.exp(-z * z / (2 * k * k)), al = (d) => Math.exp(-d * d / (2 * a * a));
          let z1 = -0.15, z2 = 0.15, alive = [true, true];
          const out = { t: [0], z1: [z1], z2: [z2], ex: false };
          for (let s = 1; s <= T / dt; s++) {
            let N1 = Kf(z1), N2 = Kf(z2);
            if (sym) {
              const A = al(z1 - z2), K1 = Kf(z1), K2 = Kf(z2), det = 1 - A * A;
              N1 = (K1 - A * K2) / det; N2 = (K2 - A * K1) / det;
              if (N1 <= 0) { alive[0] = false; out.ex = true; } else if (N2 <= 0) { alive[1] = false; out.ex = true; }
            }
            const g1 = (sym && alive[1] ? ((z1 - z2) / (a * a)) * al(z1 - z2) * N2 / Kf(z1) : 0) - z1 / (k * k);
            const g2 = (sym && alive[0] ? ((z2 - z1) / (a * a)) * al(z1 - z2) * N1 / Kf(z2) : 0) - z2 / (k * k);
            if (alive[0]) z1 += 0.25 * g1 * dt; if (alive[1]) z2 += 0.25 * g2 * dt;
            if (s % 5 === 0) { out.t.push(s * dt); out.z1.push(z1); out.z2.push(z2); }
          }
          return out;
        };
        let key = '', sym = null, allo = null, prog = 1, info = null;
        const A = v.stage({ x: [-3, 3], y: [0, 1.4], axes: 'box', gutter: true, height: 320, xlabel: 'trait $z$ (e.g. beak depth, standardized)', ylabel: 'resource availability $K(z)$', title: 'resources and the two species', weight: 1 });
        const B = v.stage({ x: [0, T], y: [-2, 2], axes: 'box', gutter: true, height: 320, xlabel: 'generations (arbitrary units)', ylabel: 'mean trait', title: 'evolution of the two trait means', weight: 1 });
        v.render(() => {
          const kk = sa.value + '|' + sk.value;
          if (kk !== key) { key = kk; sym = run(true); allo = run(false); }
          const k = sk.value, n = sym.t.length - 1, idx = Math.min(n, Math.floor(prog * n));
          A.fn((z) => Math.exp(-z * z / (2 * k * k)), { color: 'muted', width: 2, fill: true, fillAlpha: 0.08, domain: [-3, 3] });
          const bump = (m, col) => A.fn((z) => 0.7 * Math.exp(-((z - m) ** 2) / (2 * 0.15 * 0.15)), { color: col, width: 2.4, fill: true, fillAlpha: 0.3, domain: [-3, 3], n: 300 });
          A.dot(-0.15, 0.04, { r: 3, color: 'accent' }); A.dot(0.15, 0.04, { r: 3, color: 'orange' });
          bump(sym.z1[idx], 'accent'); bump(sym.z2[idx], 'orange');
          const m = Math.max(1, ...sym.z1.map(Math.abs), ...sym.z2.map(Math.abs)) * 1.1;
          B.setView([0, T], [-m, m]);
          const sl = (arr) => sym.t.slice(0, idx + 1).map((t, i) => [t, arr[i]]);
          B.path(sl(allo.z1), { color: 'accent', width: 1.6, dash: [5, 4] }); B.path(sl(allo.z2), { color: 'orange', width: 1.6, dash: [5, 4] });
          B.path(sl(sym.z1), { color: 'accent', width: 2.6 }); B.path(sl(sym.z2), { color: 'orange', width: 2.6 });
          info = { ds: Math.abs(sym.z2[idx] - sym.z1[idx]), da: Math.abs(allo.z2[idx] - allo.z1[idx]), ex: sym.ex, t: sym.t[idx] };
        });
        v.animate((t) => { prog = Math.min(1, t / 10); v.invalidate(); }, { period: 12, still: 11.9 });
        v.legend([['accent', 'species 1'], ['orange', 'species 2'], ['muted', 'resource curve'], ['ink', 'solid: sympatry, dashed: allopatry']]);
        v.readout(() => info && String.raw`At time ${v.fix(info.t, 0)}: difference between the trait means **${v.fix(info.ds, 2)}** in sympatry versus ${v.fix(info.da, 2)} in allopatry (in units of the trait scale)${info.ex ? ' — competition is too strong here: one species is excluded and its trait stops evolving' : ''}.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.9
    {
      num: '4.9',
      kind: 'Concept',
      name: 'Stabilizing versus equalizing mechanisms (Chesson)',
      credit: 'P. Chesson, 2000',
      statement: String.raw`In modern coexistence theory two species can coexist when each can increase from low density in the presence of the other. For the two-species Lotka–Volterra competition model this reduces to $$\rho<\frac{\kappa_1}{\kappa_2}<\frac1\rho ,$$ where $\rho=\sqrt{\alpha_{12}\alpha_{21}}$ is the **niche overlap** and $\kappa_1/\kappa_2$ is the **fitness ratio** (here $\kappa_1/\kappa_2=\frac{K_1}{K_2}\sqrt{\alpha_{21}/\alpha_{12}}$). **Stabilizing mechanisms** reduce $\rho$ (they make species limit themselves more than each other) and so widen the coexistence region. **Equalizing mechanisms** bring the fitness ratio toward 1. For $\rho>1$ the inequality has no solution and the species show priority effects.`,
      scope: String.raw`Exact for two-species Lotka–Volterra competition. Chesson’s general framework defines the stabilizing and equalizing components through invasion growth rates for arbitrary models, using the same wedge picture.`,
      idea: String.raw`Species 1 can invade a resident of species 2 at its carrying capacity when $K_1/K_2>\alpha_{12}$, and species 2 can invade species 1 when $K_1/K_2<1/\alpha_{21}$. Dividing out the asymmetry between $\alpha_{12}$ and $\alpha_{21}$ and writing the conditions in terms of $\rho$ and $\kappa_1/\kappa_2$ gives the symmetric wedge above. Stronger competition within species than between (small $\rho$) makes the wedge wide; unequal fitness moves the point off the centre line, and only equalizing mechanisms bring it back (compare the four outcomes of mathbio-3.16).`,
      caption: String.raw`Drag the gold point in the plane of niche overlap $\rho$ (horizontal) and fitness ratio (vertical, log scale). The green wedge is where both species can invade; above it species 1 excludes 2, below it species 2 excludes 1, and for $\rho>1$ the reversed wedge (red) is the region of priority effects. The right panel integrates the Lotka–Volterra equations at the chosen point. The buttons apply a **stabilizing** change (overlap $\times0.7$) or an **equalizing** change (fitness ratio $\to$ its square root).`,
      deps: ['mathbio-3.16'],
      refs: ['Begon ch. 19'],
      tags: ['coexistence theory', 'niche overlap', 'Chesson'],
      links: { doi: 'https://doi.org/10.1146/annurev.ecolsys.31.1.343' },
      viz(v) {
        const A = v.stage({ x: [0, 1.25], y: [0.2, 5], ylog: true, axes: 'box', gutter: true, height: 340, xlabel: 'niche overlap $\\rho$ (stabilization = $1-\\rho$)', ylabel: 'fitness ratio $\\kappa_1/\\kappa_2$', title: 'coexistence wedge', weight: 1 });
        const B = v.stage({ x: [0, 60], y: [0, 160], axes: 'box', gutter: true, height: 340, xlabel: 'time', ylabel: 'abundance', title: 'Lotka–Volterra dynamics at the point', weight: 1 });
        const h = A.handle(0.5, 1.6, { color: 'gold', r: 9, label: 'pair', constrain: { x: [0.02, 1.22], y: [0.21, 4.9] } });
        const start = v.select('who starts ahead', [{ value: 'e', label: 'neither' }, { value: '1', label: 'species 1' }, { value: '2', label: 'species 2' }], 'e');
        v.button('apply a stabilizing mechanism', () => { h.set(Math.max(0.02, h.x * 0.7), h.y); });
        v.button('apply an equalizing mechanism', () => { h.set(h.x, Math.exp(Math.log(h.y) * 0.5)); });
        let info = null;
        v.render(() => {
          const rho = h.x, kap = h.y;
          const xs = Array.from({ length: 101 }, (_, i) => (1.25 * i) / 100);
          A.between((x) => (x < 1 ? x : 1), (x) => (x < 1 ? 1 / Math.max(x, 0.01) : 1), 0, 1, { fill: 'green', fillAlpha: 0.22 });
          A.between((x) => 1 / x, (x) => x, 1, 1.25, { fill: 'red', fillAlpha: 0.22 });
          A.fn((x) => x, { color: 'green', width: 2, domain: [0.01, 1.25] });
          A.fn((x) => 1 / x, { color: 'green', width: 2, domain: [0.01, 1.25] });
          A.vline(1, { color: 'muted', width: 1.2, dash: true });
          A.hline(1, { color: 'muted', width: 1, dash: true });
          A.text('coexistence', 0.27, 1.0, { color: 'green', size: 13 });
          A.text('species 1 excludes 2', 0.35, 3.3, { color: 'accent', size: 12 });
          A.text('species 2 excludes 1', 0.35, 0.3, { color: 'orange', size: 12 });
          A.text('priority effects', 1.24, 0.62, { color: 'red', size: 11, align: 'right' });
          // Lotka–Volterra with alpha12 = alpha21 = rho, K2 = 100, K1 = 100 kappa
          const K1 = 100 * kap, K2 = 100;
          let n1 = start.value === '1' ? 30 : 10, n2 = start.value === '2' ? 30 : 10;
          const pa = [[0, n1]], pb = [[0, n2]], dt = 0.05;
          for (let s = 1; s <= 60 / dt; s++) {
            const f = (a, b) => [a * (1 - (a + rho * b) / K1), b * (1 - (b + rho * a) / K2)];
            const k1 = f(n1, n2), k2 = f(n1 + 0.5 * dt * k1[0], n2 + 0.5 * dt * k1[1]), k3 = f(n1 + 0.5 * dt * k2[0], n2 + 0.5 * dt * k2[1]), k4 = f(n1 + dt * k3[0], n2 + dt * k3[1]);
            n1 = Math.max(0, n1 + (dt / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]));
            n2 = Math.max(0, n2 + (dt / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]));
            if (s % 10 === 0) { pa.push([s * dt, n1]); pb.push([s * dt, n2]); }
          }
          B.setView([0, 60], [0, Math.max(120, K1 * 1.1, K2 * 1.1)]);
          B.path(pa, { color: 'accent', width: 2.6 }); B.path(pb, { color: 'orange', width: 2.6 });
          const inside = rho < 1 && kap > rho && kap < 1 / rho;
          info = { rho, kap, inside, n1, n2 };
        });
        v.legend([['accent', 'species 1'], ['orange', 'species 2'], ['green', 'coexistence boundary']]);
        v.readout(() => info && String.raw`$\rho=${v.fix(info.rho, 2)}$, $\kappa_1/\kappa_2=${v.fix(info.kap, 2)}$: ${info.rho >= 1 ? 'no coexistence region ($\\rho\\ge1$): the winner depends on who starts ahead' : info.inside ? `inside the wedge $(${v.fix(info.rho, 2)},\\,${v.fix(1 / info.rho, 2)})$: stable coexistence` : info.kap >= 1 / info.rho ? 'above the wedge: species 1 excludes species 2' : 'below the wedge: species 2 excludes species 1'}. At $t=60$: $N_1=${v.fix(info.n1, 1)}$, $N_2=${v.fix(info.n2, 1)}$.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.10
    {
      num: '4.10',
      kind: 'Model',
      name: 'Lottery model and the storage effect',
      credit: 'P. L. Chesson & R. R. Warner, 1981',
      statement: String.raw`In a lottery model, sites are held by long-lived adults. Each year a fraction $\delta$ of adults die; the vacated sites are taken at random by juveniles, each species’ share being proportional to its number of juveniles. With $p_i$ the fraction of sites held by species $i$ and $B_i(t)$ its year-specific recruitment success, $$p_i(t+1)=(1-\delta)\,p_i+\delta\,\frac{B_i(t)\,p_i}{\sum_j B_j(t)\,p_j}.$$ In a constant environment, species with different mean $B_i$ cannot coexist. If $\ln B_i$ fluctuates from year to year, and good years for one species are not exactly the good years of the other, two species coexist whenever $\delta<1$ (overlapping generations) and the fluctuations are strong enough compared with their difference in mean: the **storage effect**.`,
      scope: String.raw`Two species, lognormal recruitment, adult death rate $\delta$ the same for both. For non-overlapping generations ($\delta=1$) there is no buffering and the effect vanishes. The condition below uses the second-order expansion of the invasion growth rate; the picture computes the exact expectation numerically.`,
      idea: String.raw`A species coexists when it can increase from rarity. Rare species $i$ in a sea of $j$ gains $\ln\bigl(1-\delta+\delta B_i/B_j\bigr)$ per year. The adults buffer the population in bad years (the loss is at most $\delta$ of the sites) while the gain in good years is not capped, so the growth rate averaged over fluctuations is raised by roughly $\delta(1-\delta)\,\mathrm{Var}(\ln B_i-\ln B_j)/2$ for either species, on top of the difference in means. Coexistence needs this storage term to exceed the fitness difference (Chesson's stabilizing mechanism of 4.9).`,
      caption: String.raw`Right: the region of $(\sigma,\delta)$ (strength of fluctuations, adult death rate) where both species have positive invasion growth rates, for the chosen mean difference and correlation of good years; drag the gold point. Left: six simulated histories of species 1's share from a 50:50 start. Set $\sigma=0$ or $\delta=1$ and one species always wins; with fluctuations and $\delta<1$ the shares wander but neither is lost. Increase the correlation of the species' good years and the effect weakens.`,
      deps: ['ecol-4.9'],
      refs: ['Begon ch. 19'],
      tags: ['storage effect', 'lottery', 'variability'],
      links: { doi: 'https://doi.org/10.1086/283778', wikipedia: 'https://en.wikipedia.org/wiki/Storage_effect' },
      verify: true,
      viz(v) {
        const dm = v.slider('difference in mean log recruitment $\\Delta\\mu$', 0, 0.5, 0.1, { step: 0.01 });
        const rc = v.slider('correlation of the two species’ good years', -0.5, 1, 0, { step: 0.05 });
        const A = v.stage({ x: [0, 400], y: [0, 1], axes: 'box', gutter: true, height: 330, xlabel: 'year', ylabel: 'share of sites held by species 1', title: 'six simulated histories', weight: 1 });
        const B = v.stage({ x: [0, 1.5], y: [0.02, 1], axes: 'box', gutter: true, height: 330, xlabel: 'strength of fluctuations $\\sigma$', ylabel: 'adult death rate $\\delta$', title: 'both species can invade', weight: 1 });
        const h = B.handle(0.8, 0.3, { color: 'gold', r: 9, label: '(σ, δ)', constrain: { x: [0, 1.5], y: [0.02, 1] } });
        // invasion growth rate of the rare species whose mean log-ratio is +m: E ln(1 - d + d e^X), X ~ N(m, 2 s^2 (1 - rho))
        const NZ = 121, zs = Array.from({ length: NZ }, (_, i) => -5 + (10 * i) / (NZ - 1)), wz = zs.map((z) => Math.exp(-z * z / 2));
        const ws = wz.reduce((a, b) => a + b, 0);
        const gr = (m, s, d, rho) => { const sd = s * Math.sqrt(2 * (1 - rho)); let t = 0; for (let i = 0; i < NZ; i++) t += wz[i] * Math.log(1 - d + d * Math.exp(m + sd * zs[i])); return t / ws; };
        let info = null;
        v.render(() => {
          const m = dm.value, rho = rc.value, s = h.x, d = h.y;
          const key = m.toFixed(3) + '|' + rho.toFixed(3);
          B.raster((x, y) => { const g = Math.min(gr(m, x, y, rho), gr(-m, x, y, rho)); return g > 0 ? v.rgb('green').slice(0, 3).concat([0.45]) : null; }, { key, res: 6 });
          B.axes();
          const r = v.rng(5);
          for (let q = 0; q < 6; q++) {
            let p = 0.5; const pts = [[0, p]];
            for (let t = 1; t <= 400; t++) {
              const z1 = r.normal(), z2 = rho * z1 + Math.sqrt(Math.max(0, 1 - rho * rho)) * r.normal();
              const B1 = Math.exp(m / 2 + s * z1), B2 = Math.exp(-m / 2 + s * z2);
              p = (1 - d) * p + (d * B1 * p) / (B1 * p + B2 * (1 - p));
              if (t % 2 === 0) pts.push([t, p]);
            }
            A.path(pts, { color: spcol(q), width: 1.6, alpha: 0.9 });
          }
          A.hline(0.5, { color: 'grid' });
          const g1 = gr(m, s, d, rho), g2 = gr(-m, s, d, rho);
          info = { g1, g2, s, d, ok: g1 > 0 && g2 > 0 };
        });
        v.readout(() => info && String.raw`At $\sigma=${v.fix(info.s, 2)}$, $\delta=${v.fix(info.d, 2)}$: invasion growth rate of species 1 when rare $=${v.fix(info.g1, 4)}$, of species 2 when rare $=${v.fix(info.g2, 4)}$ per year → **${info.ok ? 'both can invade: coexistence' : 'one species excludes the other'}**.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.11
    {
      num: '4.11',
      kind: 'Hypothesis',
      name: 'Janzen–Connell hypothesis',
      credit: 'D. H. Janzen, 1970; J. H. Connell, 1971',
      statement: String.raw`Seeds and seedlings suffer from host-specific enemies (seed predators, pathogens, herbivores) that are concentrated around adult trees of the same species. Seed density falls with distance from the parent, while the chance of surviving the enemies rises with distance, so recruitment peaks away from the parent and conspecific seedlings rarely replace an adult nearby. The hypothesis is that this *negative density dependence* keeps any one species from taking over, allowing many tree species to coexist, as in tropical forests.`,
      scope: String.raw`A hypothesis about a mechanism that stabilizes coexistence (a stabilizing mechanism in the sense of 4.9). The forest below is a simple stochastic model built for illustration: the existence of distance- and density-dependent mortality near conspecific adults is well documented, but its quantitative contribution to tropical diversity is still debated.`,
      idea: String.raw`Without enemies the forest is neutral: each species' abundance drifts at random and species are lost one by one. With the enemy effect, a species that becomes common crowds its own seedlings together with their natural enemies, so it recruits less than rare species; this restoring force is exactly a negative frequency dependence, which counteracts drift and so is stabilizing.`,
      caption: String.raw`Two forests of 900 trees and 20 species (colours) start identically. Left: no enemy effect (neutral); middle: with it (set the strength $\gamma$). Right top: richness over time in both; right bottom: the Janzen–Connell argument for a single parent tree, with seed density (orange), survival (green) and their product, the recruitment, which peaks away from the parent. Raise $\gamma$ to 0 and the two forests behave alike.`,
      deps: ['ecol-4.9'],
      refs: ['Begon ch. 19'],
      tags: ['negative density dependence', 'forest', 'diversity'],
      links: { doi: 'https://doi.org/10.1086/282687', wikipedia: 'https://en.wikipedia.org/wiki/Janzen%E2%80%93Connell_hypothesis' },
      verify: true,
      viz(v) {
        const L = 30, S = 20, G = 400;
        const gS = v.slider('enemy effect strength $\\gamma$', 0, 4, 2.5, { step: 0.1, onChange: () => { sim.reset(); } });
        const pal = Array.from({ length: S }, (_, i) => v.M.hsl2rgb((i * 0.381966) % 1, 0.65, 0.55));
        const init = () => {
          const mk = (gamma) => { const st = jcInit(L, S, v.rng(9)); st.gamma = gamma; st.hist = [jcRichness(st)]; st.rng = v.rng(100 + Math.round(gamma * 10)); return st; };
          const a = mk(0), b = mk(gS.value); b.g.set(a.g);
          return { a, b };
        };
        const step = (st) => { for (const f of [st.a, st.b]) { jcStep(f, { gamma: f.gamma }); f.hist.push(jcRichness(f)); } };
        const sim = v.sim(init, step, { dt: 1, maxSteps: G });
        const A = v.stage({ x: [0, L], y: [0, L], equal: true, axes: false, height: 280, title: 'neutral forest (no enemies)', weight: 1 });
        const Bs = v.stage({ x: [0, L], y: [0, L], equal: true, axes: false, height: 280, title: 'Janzen–Connell forest', weight: 1 });
        const C = v.stage({ x: [0, G], y: [0, S + 1], axes: 'box', gutter: true, height: 280, xlabel: 'generation', ylabel: 'species present', title: 'species richness', weight: 1 });
        const D = v.stage({ x: [0, 12], y: [0, 1.1], axes: 'box', gutter: true, height: 280, xlabel: 'distance from the parent tree', ylabel: 'relative value', title: 'seeds × survival = recruitment', weight: 1 });
        let info = null;
        v.animate((t) => {
          sim.advance(Math.floor(t * 20));
          const { a, b } = sim.state;
          const img = (st) => (x, y) => { const i = Math.floor(x), j = Math.floor(L - y); if (i < 0 || i >= L || j < 0 || j >= L) return null; return pal[st.g[j * L + i]]; };
          A.raster(img(a), { key: 'a' + a.gen, res: 1, id: 'a' }); Bs.raster(img(b), { key: 'b' + b.gen + '|' + b.gamma, res: 1, id: 'b' });
          C.path(a.hist.map((r, i) => [i, r]), { color: 'muted', width: 2.4 });
          C.path(b.hist.map((r, i) => [i, r]), { color: 'green', width: 2.6 });
          const g = gS.value, lam = 2, rc = 2.5;
          const seed = (d) => Math.exp(-d / lam), surv = (d) => Math.exp(-g * Math.exp(-((d / rc) ** 2))), rec = (d) => seed(d) * surv(d);
          const dm = Math.max(...Array.from({ length: 121 }, (_, i) => rec(i / 10 + 0.5)));
          D.fn((d) => seed(d), { color: 'orange', width: 2, domain: [0.5, 12] });
          D.fn((d) => surv(d), { color: 'green', width: 2, domain: [0.5, 12] });
          D.fn((d) => rec(d) / dm, { color: 'accent', width: 2.8, domain: [0.5, 12] });
          let dpk = 0, best = 0; for (let d = 0.5; d <= 12; d += 0.1) if (rec(d) > best) { best = rec(d); dpk = d; }
          info = { ra: a.hist[a.hist.length - 1], rb: b.hist[b.hist.length - 1], gen: a.gen, dpk };
        }, { period: 20, still: 19.9 });
        v.legend([['muted', 'richness, neutral'], ['green', 'richness, with enemies'], ['orange', 'seed density'], ['green', 'survival'], ['accent', 'recruitment (scaled)']]);
        v.readout(() => info && String.raw`Generation ${info.gen}: **${info.ra}** species left without enemies, **${info.rb}** with them. Recruitment around a single parent peaks at distance $${v.fix(info.dpk, 1)}$ cells${gS.value === 0 ? ' (no enemies: it simply falls with distance)' : ''}.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.12
    {
      num: '4.12',
      kind: 'Model',
      name: 'Competition–colonization trade-off',
      credit: 'R. Levins & D. Culver, 1971; A. Hastings, 1980; D. Tilman, 1994',
      statement: String.raw`Let species 1 be a superior competitor (it can take over a patch occupied by species 2) but a poor colonizer, and species 2 an inferior competitor but a good colonizer. With a fraction $D$ of patches destroyed, a common mortality rate $m$ and colonization rates $c_1<c_2$, the occupied fractions obey $$\dot p_1=c_1p_1(1-D-p_1)-mp_1,\qquad \dot p_2=c_2p_2(1-D-p_1-p_2)-mp_2-c_1p_1p_2 .$$ Both species persist, $p_1^*=1-D-\dfrac m{c_1}$ and $p_2^*=\dfrac m{c_1}-\dfrac{c_1}{c_2}(1-D)$, when $1-\dfrac{c_2m}{c_1^2}<D<1-\dfrac m{c_1}$. As $D$ grows, the superior competitor disappears first.`,
      scope: String.raw`A mean-field metapopulation model with global dispersal and species-independent mortality (Tilman 1994 extends it to many species ranked by competitive ability). A hierarchy of species with a strict trade-off is needed: if the better competitor were also the better colonizer it would exclude the other, as in the Levins model (3.2).`,
      idea: String.raw`Each species is an instance of the Levins model on the sites its superiors leave open. The inferior competitor survives by colonizing sites faster than the superior competitor can overtake them; the superior competitor is held at $p_1^*$, the amount of habitat it alone can fill. Habitat destruction takes away the sites that the superior competitor must fill (as in 3.3, it persists only while $1-D>m/c_1$), whereas the fast colonizer can live on the sites that are still free: the species that needs the most habitat, and is the best competitor, is lost first.`,
      caption: String.raw`Left: equilibrium occupancy of the superior (blue) and inferior (orange) competitor as a function of habitat destruction $D$; drag the gold point to choose $D$. Right: the time course of $p_1$, $p_2$ from a small start at the chosen $D$. Increase $D$ until the blue curve hits zero: the better competitor is removed while the better colonizer is still there. With $D$ small the inferior competitor can be excluded; raise $c_2$ to widen the range of coexistence.`,
      deps: ['ecol-3.1', 'ecol-4.9'],
      refs: ['Begon ch. 19'],
      tags: ['trade-off', 'metapopulation', 'habitat loss'],
      links: { doi: 'https://doi.org/10.2307/1939377' },
      verify: true,
      viz(v) {
        const c1S = v.slider('colonization rate of the superior competitor $c_1$', 0.2, 1.5, 0.5, { step: 0.01 });
        const c2S = v.slider('colonization rate of the inferior competitor $c_2$', 0.2, 6, 2, { step: 0.01 });
        const mS = v.slider('mortality $m$', 0.02, 0.4, 0.1, { step: 0.01 });
        const A = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 330, xlabel: 'fraction of habitat destroyed $D$', ylabel: 'equilibrium occupied fraction', title: 'what survives destruction', weight: 1 });
        const B = v.stage({ x: [0, 300], y: [0, 1], axes: 'box', gutter: true, height: 330, xlabel: 'time', ylabel: 'occupied fraction', title: 'time course', weight: 1 });
        const h = A.handle(0.4, 0, { color: 'gold', r: 8, label: 'D', constrain: (x) => [Math.min(0.99, Math.max(0, x)), 0] });
        const eq = (c1, c2, m, D) => { const p1 = Math.max(0, 1 - D - m / c1); const p2 = p1 > 0 ? Math.max(0, m / c1 - (c1 / c2) * (1 - D)) : Math.max(0, 1 - D - m / c2); return [p1, p2]; };
        let info = null;
        v.render(() => {
          const c1 = c1S.value, c2 = c2S.value, m = mS.value, D = h.x;
          A.fn((x) => eq(c1, c2, m, x)[0], { color: 'accent', width: 2.8, domain: [0, 1], n: 400 });
          A.fn((x) => eq(c1, c2, m, x)[1], { color: 'orange', width: 2.8, domain: [0, 1], n: 400 });
          A.fn((x) => Math.max(0, 1 - x - m / c1) + eq(c1, c2, m, x)[1], { color: 'muted', width: 1.2, dash: true, domain: [0, 1], n: 400 });
          const e = eq(c1, c2, m, D);
          A.dot(D, e[0], { r: 5, color: 'accent' }); A.dot(D, e[1], { r: 5, color: 'orange' });
          A.vline(1 - m / c1, { color: 'red', width: 1.2, dash: [5, 4] });
          // time course (RK4)
          let p1 = 0.05, p2 = 0.05; const dt = 0.1, pa = [[0, p1]], pb = [[0, p2]];
          const f = (a, b) => [c1 * a * (1 - D - a) - m * a, c2 * b * (1 - D - a - b) - m * b - c1 * a * b];
          for (let s = 1; s <= 3000; s++) {
            const k1 = f(p1, p2), k2 = f(p1 + 0.5 * dt * k1[0], p2 + 0.5 * dt * k1[1]), k3 = f(p1 + 0.5 * dt * k2[0], p2 + 0.5 * dt * k2[1]), k4 = f(p1 + dt * k3[0], p2 + dt * k3[1]);
            p1 = Math.max(0, p1 + (dt / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0])); p2 = Math.max(0, p2 + (dt / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]));
            if (s % 10 === 0) { pa.push([s * dt, p1]); pb.push([s * dt, p2]); }
          }
          B.path(pa, { color: 'accent', width: 2.6 }); B.path(pb, { color: 'orange', width: 2.6 });
          const lo = Math.max(0, 1 - (c2 * m) / (c1 * c1)), hi = 1 - m / c1;
          info = { e, D, lo, hi, p1, p2 };
        });
        v.legend([['accent', 'superior competitor'], ['orange', 'inferior competitor'], ['red', '$D=1-m/c_1$', { dash: true }]]);
        v.readout(() => info && String.raw`$D=${v.fix(info.D, 2)}$: equilibrium $p_1^*=${v.fix(info.e[0], 3)}$, $p_2^*=${v.fix(info.e[1], 3)}$ (simulated at $t=300$: $${v.fix(info.p1, 3)}$, $${v.fix(info.p2, 3)}$). Coexistence for ${v.fix(info.lo, 2)} < D < ${v.fix(info.hi, 2)}${info.c2 < 0 ? '' : ''}${info.hi <= info.lo ? ' (empty: needs $c_2>c_1$)' : ''}.`);
      },
    },
  ],
};
