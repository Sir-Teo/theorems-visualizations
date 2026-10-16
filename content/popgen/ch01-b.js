// Population Genetics & Evolution — Chapter 1 (part b): sex linkage, diversity, inbreeding, assortment, subdivision

// ── shared helpers (same house colours as ch01.js: AA blue, Aa purple, aa orange; A blue, a orange) ──
const GCOL = ['blue', 'purple', 'orange'];
const SQ3 = Math.sqrt(3) / 2;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
function memo() { let key, val; return (k, f) => { if (k !== key) { key = k; val = f(); } return val; }; }
/** Pearson χ² test of Hardy–Weinberg proportions (1 df). */
function hwTest(M, n0, n1, n2) {
  const n = n0 + n1 + n2, p = n ? (2 * n0 + n1) / (2 * n) : 0, q = 1 - p, E = [n * p * p, 2 * n * p * q, n * q * q];
  let x2 = 0; [n0, n1, n2].forEach((o, i) => { if (E[i] > 1e-12) x2 += (o - E[i]) ** 2 / E[i]; });
  return { n, p, q, E, chi2: x2, pval: M.gammaQ(0.5, x2 / 2) };
}
/** p-value with its relation sign: '= 0.123' or '< 0.0001'. */
const pText = (v, p) => (p < 1e-4 ? '< 0.0001' : '= ' + (p < 0.01 ? v.fix(p, 4) : v.fix(p, 3)));
const drawG = (r, P, H) => { const u = r(); return u < P ? 0 : u < P + H ? 1 : 2; };
const gamete = (r, g) => (g === 1 ? (r() < 0.5 ? 0 : 1) : g / 2);
/** Integer with thousands separators. */
const big = (x) => Math.round(x).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export default {
  collection: 'popgen',
  chapter: 1,
  items: [
    // ───────────────────────────────────────────────────────────── 1.9
    {
      num: '1.9',
      kind: 'Phenomenon',
      name: 'X-linked loci approach equilibrium in damped oscillations',
      statement: String.raw`At an X-linked locus females carry two copies and males one. Let $q_f$ and $q_m$ be the frequencies of allele $a$ among the X chromosomes of females and of males. Under random mating, with no selection, mutation, migration or drift, a son’s X comes from his mother while a daughter receives one X from each parent, so
$$q_m' = q_f, \qquad q_f' = \tfrac12\,(q_f + q_m).$$
The frequency among all X chromosomes, $\bar q = \tfrac13(2q_f + q_m)$ (two thirds of the X chromosomes are in females), is conserved, and the difference $d = q_f - q_m$ obeys $d' = -\tfrac12 d$. Both frequencies therefore converge to $\bar q$ in an oscillation whose amplitude halves every generation, the sexes overtaking each other each time. At equilibrium a recessive X-linked trait affects a fraction $\bar q$ of males but only $\bar q^{\,2}$ of females.`,
      idea: String.raw`The recursion is linear with matrix $\begin{pmatrix}0&1\\ \tfrac12&\tfrac12\end{pmatrix}$, whose eigenvalues are $1$ (eigenvector $q_m = q_f$: the equilibria) and $-\tfrac12$ (the difference between the sexes). The eigenvalue $1$ is the conservation law $2q_f'+q_m' = (q_f+q_m)+q_f$; the eigenvalue $-\tfrac12$ makes the gap change sign and halve each generation, because sons copy their mothers’ frequency of one generation ago. At an autosomal locus both sexes draw from the same pooled gamete frequency (1.5), so the gap closes in a single generation.`,
      caption: String.raw`Drag the gold start point in the left panel ($q_m$ across, $q_f$ up). The path jumps across the diagonal every generation, always along the dashed line of constant $\bar q = (2q_f+q_m)/3$, and homes in on the green equilibrium. On the right the two sexes leapfrog inside an envelope that halves each generation. Turn on the autosomal locus to compare: the gap closes at once. Turn on a finite population to see a simulated run of 300 females and 300 males (hollow dots) follow the same zig-zag up to sampling noise.`,
      deps: ['popgen-1.5'],
      refs: ['Gillespie'],
      credit: 'Reported as early work on sex-linked genes under random mating: Jennings, 1916 (Genetics 1: 53–89)',
      tags: ['sex linkage', 'Hardy–Weinberg'],
      viz(v) {
        const M = v.M, G = 12, N = 300;
        const auto = v.toggle('autosomal locus instead', false);
        const fin = v.toggle('finite population (300 ♀ + 300 ♂)', false);
        let seed = 2;
        const nb = v.button('New run', () => { seed += 1; });
        const sP = v.stage({ x: [-0.04, 1.04], y: [-0.04, 1.04], equal: true, axes: 'box', height: 350, xlabel: 'q males', ylabel: 'q females' });
        const sT = v.stage({ x: [-0.3, G + 0.3], y: [-0.03, 1.03], axes: 'box', height: 350, weight: 1.35, xlabel: 'generation', title: 'frequency of $a$ in females (pink) and males (teal)' });
        const h = sP.handle(0.9, 0.1, { color: 'gold', label: 'generation 0', labelPos: 'n', constrain: { x: [0, 1], y: [0, 1] } });
        const step = (qm, qf) => (auto.value ? [(qm + qf) / 2, (qm + qf) / 2] : [qf, (qf + qm) / 2]);
        const path = () => { let qm = h.x, qf = h.y; const out = [[qm, qf]]; for (let t = 0; t < G; t++) { [qm, qf] = step(qm, qf); out.push([qm, qf]); } return out; };
        const cache = memo();
        const simRun = () => cache([h.x.toFixed(4), h.y.toFixed(4), auto.value, seed].join('|'), () => {
          const r = v.rng(seed * 31 + 7), pm = auto.value ? 2 : 1;
          let F = new Uint8Array(2 * N), Mm = new Uint8Array(pm * N);
          for (let i = 0; i < 2 * N; i++) F[i] = r() < h.y ? 1 : 0;
          for (let i = 0; i < pm * N; i++) Mm[i] = r() < h.x ? 1 : 0;
          const fr = (A) => A.reduce((s, x) => s + x, 0) / A.length, out = [[fr(Mm), fr(F)]];
          for (let t = 0; t < G; t++) {
            const F2 = new Uint8Array(2 * N), M2 = new Uint8Array(pm * N), mo = () => F[2 * ((r() * N) | 0) + (r() < 0.5 ? 1 : 0)];
            const fa = () => (pm === 2 ? Mm[2 * ((r() * N) | 0) + (r() < 0.5 ? 1 : 0)] : Mm[(r() * N) | 0]);
            for (let i = 0; i < N; i++) { F2[2 * i] = mo(); F2[2 * i + 1] = fa(); }
            for (let i = 0; i < N; i++) { M2[pm * i] = mo(); if (pm === 2) M2[2 * i + 1] = fa(); }
            F = F2; Mm = M2; out.push([fr(Mm), fr(F)]);
          }
          return out;
        });
        v.render(() => {
          nb.hidden = !fin.value;
          const P = path(), qbar = auto.value ? (h.x + h.y) / 2 : (2 * h.y + h.x) / 3;
          sP.line(0, 0, 1, 1, { color: 'green', width: 1.4, dash: [6, 4] });
          sP.tex('q_m = q_f', 0.9, 0.97, { align: 'right', size: 13, color: 'green' });
          sP.clip(() => sP.fn((x) => (auto.value ? 2 * qbar - x : (3 * qbar - x) / 2), { color: 'muted', width: 1.2, dash: [3, 4] }), [0, 1], [0, 1]);
          sP.path(P, { color: 'accent', width: 1.4, alpha: 0.6 });
          for (let t = 0; t < 4 && t < G; t++) sP.arrow(P[t][0], P[t][1], P[t + 1][0], P[t + 1][1], { color: 'accent', width: 1.6, head: 8 });
          P.slice(1).forEach(([x, y], t) => { sP.dot(x, y, { r: 3.6, color: 'accent' }); if (t < 3) sP.text(String(t + 1), x, y, { dx: 9, dy: -8, size: 11.5, color: 'accent', weight: 700 }); });
          if (fin.value) sP.path(simRun(), { color: 'purple', width: 1, alpha: 0.6 }), simRun().forEach(([x, y]) => sP.dot(x, y, { r: 3, hollow: true, color: 'purple', width: 1.3 }));
          sP.dot(qbar, qbar, { r: 6, color: 'green' });
          // time series
          sT.hline(qbar, { color: 'green', width: 1.3, dash: [6, 4] });
          if (!auto.value) {
            const d0 = Math.abs(h.y - h.x);
            sT.between((t) => qbar + (2 * d0) / 3 / 2 ** t, (t) => qbar - (2 * d0) / 3 / 2 ** t, 0, G, { fill: 'teal', fillAlpha: 0.07 });
          }
          sT.path(P.map((p, t) => [t, p[1]]), { color: 'pink', width: 2.2 }); sT.path(P.map((p, t) => [t, p[0]]), { color: 'teal', width: 2.2 });
          P.forEach((p, t) => { sT.dot(t, p[1], { r: 3.8, color: 'pink' }); sT.dot(t, p[0], { r: 3.8, color: 'teal' }); });
          if (fin.value) simRun().forEach((p, t) => { sT.dot(t, p[1], { r: 4, hollow: true, color: 'pink', width: 1.3 }); sT.dot(t, p[0], { r: 4, hollow: true, color: 'teal', width: 1.3 }); });
          sT.text(String.raw`q̄ = ${v.fix(qbar, 3)}`, G, qbar, { align: 'right', dy: -10, size: 11.5, color: 'green', weight: 600 });
        });
        v.legend([['pink', 'females $q_f$'], ['teal', 'males $q_m$'], ['green', 'equilibrium $\\bar q$', { dash: true }], ['teal', 'envelope $\\pm\\tfrac23|d_0|\\,2^{-t}$', { area: true }]]);
        v.readout(() => {
          const P = path(), d = P.map((p) => p[1] - p[0]);
          if (auto.value) { const qb = (h.x + h.y) / 2; return String.raw`autosomal locus: both sexes draw from one gamete pool, so after one generation $q_f = q_m = \tfrac12(q_f+q_m) = ${v.fix(qb, 3)}$ — no oscillation, and the equilibrium is the plain average, not the X-weighted ${v.fix((2 * h.y + h.x) / 3, 3)}.`; }
          const qb = (2 * h.y + h.x) / 3, ratio = Math.abs(d[0]) > 1e-6 ? v.fix(d[1] / d[0], 3) : '—';
          return String.raw`$\bar q = \tfrac13(2q_f+q_m) = ${v.fix(qb, 3)}$, still ${v.fix((2 * P[G][1] + P[G][0]) / 3, 3)} after ${G} generations · gap $d_t = q_f - q_m$: ${d.slice(0, 4).map((x) => v.fix(x, 3)).join(', ')}, … ratio $d_1/d_0 = ${ratio}$ · at equilibrium a recessive X-linked trait affects ${v.fix(100 * qb, 1)}% of males but ${v.fix(100 * qb * qb, 2)}% of females`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.10
    {
      num: '1.10',
      kind: 'Concept',
      name: 'Heterozygosity and gene diversity',
      statement: String.raw`The **expected heterozygosity** or **gene diversity** of a locus with allele frequencies $p_1,\dots,p_k$ is
$$H = 1 - \sum_{i=1}^k p_i^2,$$
the probability that two gene copies drawn at random (with replacement) are different alleles; for two alleles $H = 2pq$. It equals the heterozygote frequency under Hardy–Weinberg proportions (1.8), lies between $0$ (one allele fixed) and $1-1/k$ (all alleles equally frequent), and $n_e = 1/\sum p_i^2$ is the **effective number of alleles**, the number of equally frequent alleles that would give the same $H$. From a sample of $n$ diploid individuals ($2n$ gene copies) with allele frequencies $\hat p_i$, the plug-in value $1-\sum\hat p_i^2$ underestimates $H$ by the factor $(2n-1)/2n$ on average; the unbiased estimator is
$$\hat H = \frac{2n}{2n-1}\Bigl(1-\sum_i \hat p_i^2\Bigr).$$`,
      idea: String.raw`Two independent draws are the same allele with probability $\sum p_i^2$, so $H$ is the chance they differ; it is a concave function of the frequencies, maximised at the centre of the simplex where the level sets $\sum p_i^2 = c$ are circles around the centre. In a sample, $E[\hat p_i^2] = p_i^2 + p_i(1-p_i)/2n$ because $\hat p_i$ has sampling variance $p_i(1-p_i)/2n$; summing gives $E[1-\sum\hat p_i^2] = H(1-\tfrac1{2n})$ — sampling noise makes the sample look less diverse than the population — and multiplying by $2n/(2n-1)$ removes the bias.`,
      caption: String.raw`Left: the triangle of allele frequencies for three alleles (corners: one allele fixed), shaded by $H = 1-\sum p_i^2$ with circles of equal diversity around the centre, where $H$ peaks at $2/3$; along an edge only two alleles remain and $H = 2pq$. Drag the point. Right: 500 samples of $n$ individuals drawn from that population; the plug-in estimate (orange) is centred below the true $H$ (green), the corrected one (blue) on it. Shrink $n$ to make the bias obvious.`,
      deps: ['popgen-1.5', 'popgen-1.8'],
      refs: ['Gillespie'],
      credit: 'Nei, 1973 (gene diversity); Nei, 1978 (small-sample correction)',
      tags: ['heterozygosity', 'genetic diversity'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Zygosity#Heterozygosity_in_population_genetics' },
      viz(v) {
        const M = v.M, S = 500, COLS = ['blue', 'orange', 'teal'];
        const nS = v.slider('sample size $n$ (individuals)', 2, 60, 6, { int: true });
        let seed = 3;
        v.button('New samples', () => { seed += 1; });
        const sS = v.stage({ x: [-0.08, 1.08], y: [-0.1, 0.95], equal: true, axes: false, height: 360, weight: 1.15 });
        const sH = v.stage({ x: [0, 0.8], y: [-10, 10], axes: 'box', height: 360, xlabel: 'estimate of H', yticks: [], title: '500 samples: corrected (up) and plug-in (down) estimates' });
        const toBary = (x, y) => { const p3 = y / SQ3, p2 = x - p3 / 2; return [1 - p2 - p3, p2, p3]; };
        const h = sS.handle(0.36, 0.26, { color: 'accent', constrain: (x, y) => { let p = toBary(x, y).map((t) => Math.max(0, t)); const s = p[0] + p[1] + p[2]; p = p.map((t) => t / s); return [p[1] + p[2] / 2, p[2] * SQ3]; } });
        const freqs = () => toBary(h.x, h.y).map((t) => Math.max(0, t));
        const cache = memo();
        const samples = () => {
          const p = freqs();
          return cache([p.map((x) => x.toFixed(4)).join(','), nS.value, seed].join('|'), () => {
            const r = v.rng(seed * 7 + 1), n2 = 2 * nS.value, naive = new Float64Array(S), corr = new Float64Array(S);
            for (let s = 0; s < S; s++) {
              const c = [0, 0, 0];
              for (let i = 0; i < n2; i++) { const u = r(); c[u < p[0] ? 0 : u < p[0] + p[1] ? 1 : 2]++; }
              const hp = 1 - c.reduce((a, x) => a + (x / n2) ** 2, 0);
              naive[s] = hp; corr[s] = (hp * n2) / (n2 - 1);
            }
            return { naive, corr };
          });
        };
        v.render(() => {
          const p = freqs(), H = 1 - p.reduce((a, x) => a + x * x, 0), n = nS.value;
          const a = v.rgb('panel'), b = v.rgb('teal');
          sS.raster((x, y) => {
            const q = toBary(x, y); if (q[0] < 0 || q[1] < 0 || q[2] < 0) return null;
            const w = 0.06 + 0.62 * ((1 - q[0] * q[0] - q[1] * q[1] - q[2] * q[2]) / (2 / 3));
            return [a[0] + (b[0] - a[0]) * w, a[1] + (b[1] - a[1]) * w, a[2] + (b[2] - a[2]) * w];
          }, { res: 2, key: [a, b].join('|') });
          const cx = 0.5, cy = SQ3 / 3, inside = (x, y) => { const q = toBary(x, y); return q[0] >= -1e-9 && q[1] >= -1e-9 && q[2] >= -1e-9; };
          for (const L of [0.2, 0.4, 0.5, 0.6]) {
            const R = Math.sqrt((2 / 3 - L) / 2), pts = [];
            for (let i = 0; i <= 240; i++) { const t = (i / 240) * 2 * Math.PI, x = cx + R * Math.cos(t), y = cy + R * Math.sin(t); pts.push(inside(x, y) ? [x, y] : null); }
            sS.path(pts, { color: 'ink', width: 1, alpha: 0.35 });
            if (L > 0.3 && inside(cx, cy + R)) sS.text(`H = ${L}`, cx, cy + R, { align: 'center', dy: -7, size: 10.5, color: 'muted' });
          }
          sS.poly([[0, 0], [1, 0], [0.5, SQ3]], { color: 'muted', width: 1.3 });
          sS.dot(cx, cy, { r: 3, color: 'ink' });
          sS.tex('A_1', -0.035, -0.045, { color: COLS[0], size: 14 }); sS.tex('A_2', 1.035, -0.045, { color: COLS[1], size: 14 }); sS.tex('A_3', 0.5, SQ3 + 0.045, { color: COLS[2], size: 14 });
          sS.text(`H = ${v.fix(H, 3)}`, h.x, h.y, { dx: 12, dy: -12, size: 12.5, weight: 700, color: 'accent' });
          // mirrored histograms: corrected above the axis, plug-in below
          const Sm = samples(), edges = M.linspace(0, 0.8, 41), bw = edges[1] - edges[0];
          const h1 = M.histogram(Sm.naive, { bins: edges }), h2 = M.histogram(Sm.corr, { bins: edges });
          const top = Math.max(...h1.counts, ...h2.counts, 1) * 1.18;
          sH.setView(null, [-top, top]);
          h2.counts.forEach((c, i) => { if (c) sH.rect(edges[i] + bw * 0.06, 0, edges[i + 1] - bw * 0.06, c, { fill: 'accent', fillAlpha: 0.55, color: 'accent', width: 1 }); });
          h1.counts.forEach((c, i) => { if (c) sH.rect(edges[i] + bw * 0.06, 0, edges[i + 1] - bw * 0.06, -c, { fill: 'orange', fillAlpha: 0.5, color: 'orange', width: 1 }); });
          sH.hline(0, { color: 'muted', width: 1 });
          const mN = M.mean(Array.from(Sm.naive)), mC = M.mean(Array.from(Sm.corr));
          sH.line(mC, 0, mC, top * 0.92, { color: 'accent', width: 2, dash: [5, 3] });
          sH.line(mN, 0, mN, -top * 0.92, { color: 'orange', width: 2, dash: [5, 3] });
          sH.vline(H, { color: 'green', width: 2 });
          sH.text('corrected', 0.02, top * 0.9, { size: 11.5, color: 'accent', weight: 700 });
          sH.text('plug-in', 0.02, -top * 0.9, { size: 11.5, color: 'orange', weight: 700 });
          sH.text('true H', H, top * 0.97, { dx: 5, size: 11, color: 'green', weight: 600 });
        });
        v.legend([['accent', 'corrected $\\frac{2n}{2n-1}(1-\\sum\\hat p_i^2)$', { area: true }], ['orange', 'plug-in $1-\\sum\\hat p_i^2$', { area: true }], ['green', 'true $H$'], ['muted', 'sample means', { dash: true }]]);
        v.readout(() => {
          const p = freqs(), s2 = p.reduce((a, x) => a + x * x, 0), H = 1 - s2, n = nS.value, Sm = samples();
          const mN = M.mean(Array.from(Sm.naive)), mC = M.mean(Array.from(Sm.corr));
          return String.raw`$p = (${p.map((x) => v.fix(x, 3)).join(', ')})$: $H = 1-\sum p_i^2 = ${v.fix(H, 3)}$, effective number of alleles $1/\sum p_i^2 = ${v.fix(1 / s2, 2)}$ · samples of $n = ${n}$: plug-in mean ${v.fix(mN, 3)} against $\frac{2n-1}{2n}H = ${v.fix(((2 * n - 1) / (2 * n)) * H, 3)}$ · corrected mean ${v.fix(mC, 3)} against $H = ${v.fix(H, 3)}$ ✓`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.11
    {
      num: '1.11',
      kind: 'Phenomenon',
      name: 'Rare recessive alleles hide in carriers',
      statement: String.raw`Let a recessive allele $a$ have frequency $q$ in a population in Hardy–Weinberg proportions. Affected homozygotes have frequency $q^2$ and unaffected carriers $2pq$, so there are $2p/q \approx 2/q$ carriers for every affected individual, and a fraction $p$ of all copies of $a$ sit in carriers. When $q$ is small almost every copy is hidden from selection acting on the phenotype: even if affected individuals never reproduce, the frequency falls only as
$$q_t = \frac{q_0}{1 + t\,q_0},$$
so halving it takes about $1/q_0$ generations.`,
      idea: String.raw`Hardy–Weinberg (1.5) puts the copies of $a$ into individuals at random, and a rare copy almost always finds an $A$ partner: $2pq/q^2 = 2p/q$. Selection that removes all $aa$ individuals removes $q^2$ of the population, which carries only $2q^2$ of the $2q$ copies per individual, so $q' = q/(1+q)$; iterating gives $1/q_t = 1/q_0 + t$. The rarer the allele, the more slowly it disappears — the arithmetic behind Punnett’s and Fisher’s objections to eugenic sterilisation.`,
      caption: String.raw`9000 individuals sampled in Hardy–Weinberg proportions for the incidence on the slider (ringed red squares: affected, purple: carriers, the pale rest: $AA$). At cystic-fibrosis frequencies (about 1 in 2500 births in people of European descent) there are dozens of carriers for every affected child. Left below: carriers per affected individual, $2p/q$, against $q$ on log scales. Right below: even if no affected individual ever reproduced, $q$ would fall by only half in about $1/q_0$ generations.`,
      deps: ['popgen-1.5'],
      refs: ['Gillespie'],
      credit: 'Punnett, 1917',
      tags: ['recessive alleles', 'carriers'],
      viz(v) {
        const M = v.M, W = 180, HH = 50, N = W * HH;
        let seed = 8;
        const inc = v.slider('incidence of affected $q^2$', 1e-5, 0.25, 1 / 2500, { log: true, fmt: (x) => `1 in ${big(1 / x)}`, onChange: () => A.reset(seed) });
        v.button('cystic fibrosis ≈ 1 in 2,500', () => { inc.set(1 / 2500); A.reset(seed); });
        v.button('PKU ≈ 1 in 12,000', () => { inc.set(1 / 12000); A.reset(seed); });
        v.button('New sample', () => { seed += 1; A.reset(seed); });
        const sG = v.stage({ height: 230, full: true });
        const sR = v.stage({ x: [1e-3, 0.5], y: [1, 3000], xlog: true, ylog: true, axes: 'box', height: 260, xlabel: 'q', title: 'carriers per affected, $2pq/q^2 = 2p/q$' });
        const sS = v.stage({ x: [0, 100], y: [0, 1], axes: 'box', height: 260, xlabel: 'generations', title: 'affected never reproduce: $q_t = q_0/(1+tq_0)$' });
        const q = () => Math.sqrt(inc.value);
        const A = v.agents(sG, {
          size: [W, HH], seed, animate: false, controls: false,
          states: [{ name: 'AA', color: 'blue', alpha: 0.13 }, { name: 'Aa', color: 'purple' }, { name: 'aa', color: 'red' }],
          init: (r) => (r() < q() ? 1 : 0) + (r() < q() ? 1 : 0),
        });
        v.render(() => {
          const qq = q(), p = 1 - qq, g = A.model.grid;
          A.draw();
          const aff = []; for (let k = 0; k < N; k++) if (g[k] === 2) aff.push(k);
          if (aff.length <= 80) for (const k of aff) sG.circle((k % W) + 0.5, HH - Math.floor(k / W) - 0.5, 1.9, { color: 'red', width: 1.8 });
          // ratio panel
          sR.fn((x) => (2 * (1 - x)) / x, { color: 'purple', width: 2.4 });
          sR.line(qq, 1, qq, (2 * p) / qq, { color: 'gold', width: 1.2, dash: [4, 4] }); sR.line(1e-3, (2 * p) / qq, qq, (2 * p) / qq, { color: 'gold', width: 1.2, dash: [4, 4] });
          sR.dot(qq, (2 * p) / qq, { r: 6, color: 'gold' });
          sR.text(`${v.fix((2 * p) / qq, (2 * p) / qq < 10 ? 1 : 0)} : 1`, qq, (2 * p) / qq, { dx: 10, dy: -10, size: 12.5, weight: 700, color: 'gold' });
          // selection panel
          const T = Math.max(10, Math.min(20000, Math.round(3 / qq))), qs = [qq];
          for (let t = 1; t <= T; t++) { const x = qs[t - 1]; qs.push(x / (1 + x)); }
          sS.setView([0, T], [0, qq * 1.08]);
          sS.hline(qq / 2, { color: 'muted', width: 1, dash: [4, 4] }); sS.vline(1 / qq, { color: 'muted', width: 1, dash: [4, 4] });
          sS.path(qs.map((x, t) => [t, x]), { color: 'orange', width: 2.4 });
          sS.text(`half after ${big(1 / qq)} generations`, 1 / qq, qq / 2, { dx: 6, dy: -10, size: 11.5, color: 'ink', weight: 600 });
        });
        v.legend([['red', 'affected $aa$', { area: true }], ['purple', 'carrier $Aa$', { area: true }], ['blue', 'non-carrier $AA$ (pale)', { area: true }]]);
        v.readout(() => {
          const qq = q(), p = 1 - qq, nA = A.model.count('aa'), nC = A.model.count('Aa');
          return String.raw`incidence 1 in ${big(1 / (qq * qq))} → $q = ${v.fix(qq, qq < 0.01 ? 4 : 3)}$ · carriers $2pq$ = 1 in ${big(1 / (2 * p * qq))} · **${v.fix((2 * p) / qq, (2 * p) / qq < 10 ? 1 : 0)} carriers per affected** · ${v.fix(100 * p, 1)}% of the copies of $a$ sit in carriers · this sample of ${big(N)}: ${nA} affected, ${nC} carriers (expected ${v.fix(N * qq * qq, 1)} and ${v.fix(2 * N * p * qq, 0)}) · removing every affected individual halves $q$ only after ${big(1 / qq)} generations`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.12
    {
      num: '1.12',
      kind: 'Definition',
      name: 'Inbreeding coefficient and identity by descent',
      statement: String.raw`Two gene copies are **identical by descent** (IBD) if both are copies, through segregation, of a single copy in a common ancestor. The **inbreeding coefficient** $F_X$ of an individual $X$ is the probability that its two copies at a locus are IBD; the **kinship** (coancestry) coefficient $\phi_{ST}$ of two individuals is the probability that a copy drawn at random from $S$ and one drawn at random from $T$ are IBD, so $F_X = \phi_{SD}$ for the parents $S, D$ of $X$. With pedigree founders taken as unrelated and non-inbred, Wright’s path rule gives
$$F_X = \sum_{\text{paths}} \left(\tfrac12\right)^{n_1+n_2+1}(1+F_A),$$
summed over all paths that run from one parent up to a common ancestor $A$ and down to the other parent without visiting any individual twice, where $n_1, n_2$ count the generations from the two parents up to $A$.`,
      idea: String.raw`Each transmission from parent to child picks one of the parent’s two copies with probability $\tfrac12$ (1.2), so a specific copy of $A$ reaches $S$ through $n_1$ meioses with probability $(\tfrac12)^{n_1}$, and similarly down to $D$. The two copies arriving at $X$ are then IBD if they descend from the same copy of $A$ ($\tfrac12$) or from its two copies when those are themselves IBD ($\tfrac12 F_A$), giving $(\tfrac12)^{n_1+n_2+1}(1+F_A)$; distinct paths are disjoint events. Equivalently, kinships can be computed generation by generation, $\phi_{ij} = \tfrac12(\phi_{f(i)j}+\phi_{m(i)j})$ and $\phi_{ii} = \tfrac12(1+F_i)$, which the readout checks against the path sum.`,
      caption: String.raw`A pedigree with a consanguineous mating (double line); every founder carries two distinguishable copies, and the common ancestors’ four copies are coloured. Press play to drop genes down the pedigree by Mendelian segregation, over and over: under each person are the two copies they received this time, and $X$ is ringed in green when both its copies trace to the same ancestral copy. The gold paths are the routes of Wright’s rule; on the right the running fraction of IBD drops converges to the path-count value $F$. Switch pedigrees to compare full sibs ($\tfrac14$), half sibs ($\tfrac18$), first cousins ($\tfrac1{16}$) and second cousins ($\tfrac1{64}$).`,
      deps: ['popgen-1.2', 'popgen-1.5'],
      refs: ['Ewens §2.8'],
      credit: 'Wright, 1922 (path coefficients); Malécot, 1948 (identity by descent)',
      tags: ['inbreeding', 'identity by descent'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Coefficient_of_relationship' },
      viz(v) {
        const M = v.M, D = 4000;
        const PEDS = {
          full: [['P1', 'm', 2.0, 3.4], ['P2', 'f', 4.0, 3.4], ['S', 'm', 2.0, 2.1, 'P1', 'P2'], ['D', 'f', 4.0, 2.1, 'P1', 'P2'], ['X', 'u', 3.0, 0.8, 'S', 'D']],
          half: [['M1', 'f', 0.8, 3.4], ['A', 'm', 3.0, 3.4], ['M2', 'f', 5.2, 3.4], ['S', 'm', 1.9, 2.1, 'A', 'M1'], ['D', 'f', 4.1, 2.1, 'A', 'M2'], ['X', 'u', 3.0, 0.8, 'S', 'D']],
          cousin: [['A', 'm', 2.6, 4.7], ['B', 'f', 3.4, 4.7], ['W1', 'f', 0.6, 3.4], ['C', 'm', 1.8, 3.4, 'A', 'B'], ['E', 'f', 4.2, 3.4, 'A', 'B'], ['W2', 'm', 5.4, 3.4],
            ['S', 'm', 1.2, 2.1, 'C', 'W1'], ['D', 'f', 4.8, 2.1, 'W2', 'E'], ['X', 'u', 3.0, 0.8, 'S', 'D']],
          second: [['A', 'm', 2.6, 6.0], ['B', 'f', 3.4, 6.0], ['W1', 'f', 0.6, 4.7], ['C', 'm', 1.8, 4.7, 'A', 'B'], ['E', 'f', 4.2, 4.7, 'A', 'B'], ['W2', 'm', 5.4, 4.7],
            ['S1', 'm', 1.2, 3.4, 'C', 'W1'], ['W3', 'f', 2.4, 3.4], ['W4', 'm', 3.6, 3.4], ['D1', 'f', 4.8, 3.4, 'W2', 'E'],
            ['S', 'm', 1.8, 2.1, 'S1', 'W3'], ['D', 'f', 4.2, 2.1, 'W4', 'D1'], ['X', 'u', 3.0, 0.8, 'S', 'D']],
        };
        const which = v.select('pedigree', [{ value: 'full', label: 'full sibs' }, { value: 'half', label: 'half sibs' }, { value: 'cousin', label: 'first cousins' }, { value: 'second', label: 'second cousins' }], 'cousin');
        let seed = 1;
        v.button('New drops', () => { seed += 1; v.restart(); });
        const sP = v.stage({ x: [-0.3, 6.3], y: [0.2, 5.4], equal: true, axes: false, height: 390, weight: 1.35 });
        const sF = v.stage({ x: [1, D], y: [0, 0.2], xlog: true, axes: 'box', height: 390, xlabel: 'drops', title: 'share of drops in which $X$ is IBD' });
        const VIVID = ['blue', 'orange', 'teal', 'pink'];
        const cache = memo();
        const model = () => cache(which.value + '|' + seed, () => {
          const ped = PEDS[which.value].map(([id, sex, x, y, f, m]) => ({ id, sex, x, y, f, m })), idx = new Map(ped.map((d, i) => [d.id, i])), n = ped.length;
          // kinship recursion (parents precede children)
          const phi = Array.from({ length: n }, () => new Array(n).fill(0)), Fi = new Array(n).fill(0);
          ped.forEach((d, i) => {
            const fi = d.f ? idx.get(d.f) : -1, mi = d.m ? idx.get(d.m) : -1;
            Fi[i] = fi >= 0 && mi >= 0 ? phi[fi][mi] : 0; phi[i][i] = (1 + Fi[i]) / 2;
            for (let j = 0; j < i; j++) phi[i][j] = phi[j][i] = ((fi >= 0 ? phi[fi][j] : 0) + (mi >= 0 ? phi[mi][j] : 0)) / 2;
          });
          // Wright's paths
          const up = (id) => { const d = ped[idx.get(id)], out = [[id]]; for (const par of [d.f, d.m]) if (par) for (const c of up(par)) out.push([id, ...c]); return out; };
          const X = ped[n - 1], paths = [];
          for (const a of up(X.f)) for (const b of up(X.m)) {
            const top = a[a.length - 1]; if (top !== b[b.length - 1]) continue;
            const sa = new Set(a); if (b.slice(0, -1).some((z) => sa.has(z))) continue;
            const k = a.length - 1 + b.length - 1; paths.push({ ids: [...a, ...b.slice(0, -1).reverse()], top, k, c: 0.5 ** (k + 1) * (1 + Fi[idx.get(top)]) });
          }
          const tops = [...new Set(paths.map((p) => p.top))];
          // gene dropping
          const founders = ped.filter((d) => !d.f), lab = new Int16Array(D * n * 2), ibd = new Uint8Array(D), r = v.rng(seed * 101 + 3);
          for (let t = 0; t < D; t++) {
            const o = t * n * 2;
            ped.forEach((d, i) => {
              if (!d.f) { const fi = founders.indexOf(d); lab[o + 2 * i] = 2 * fi; lab[o + 2 * i + 1] = 2 * fi + 1; return; }
              const a = idx.get(d.f), b = idx.get(d.m);
              lab[o + 2 * i] = lab[o + 2 * a + (r() < 0.5 ? 1 : 0)]; lab[o + 2 * i + 1] = lab[o + 2 * b + (r() < 0.5 ? 1 : 0)];
            });
            ibd[t] = lab[o + 2 * (n - 1)] === lab[o + 2 * (n - 1) + 1] ? 1 : 0;
          }
          const cum = new Int32Array(D); let s = 0; for (let t = 0; t < D; t++) { s += ibd[t]; cum[t] = s; }
          const colOf = (L) => { const f = founders[L >> 1], ti = tops.indexOf(f.id); return ti >= 0 ? VIVID[(2 * ti + (L & 1)) % 4] : null; };
          return { ped, idx, n, F: paths.reduce((a, p) => a + p.c, 0), Fk: phi[idx.get(X.f)][idx.get(X.m)], paths, tops, lab, cum, colOf };
        });
        const nOf = (t) => (t < 6 ? Math.floor(t / 0.6) + 1 : Math.min(D, Math.round(11 * 10 ** ((t - 6) / 1.75))));
        let shown = 1;
        v.animate((t) => {
          const Mo = model(), { ped, idx, n } = Mo, k = nOf(t); shown = k;
          const ymax = Math.max(...ped.map((d) => d.y));
          sP.setView([-0.3, 6.3], [0.2, ymax + 0.6]);
          const at = (id) => ped[idx.get(id)];
          // paths (under everything)
          Mo.paths.forEach((pth, j) => {
            const off = (j - (Mo.paths.length - 1) / 2) * 0.07;
            sP.path(pth.ids.map((id) => [at(id).x + off, at(id).y]), { color: 'gold', width: 7, alpha: 0.32 });
          });
          // matings and sibships
          const matings = new Map();
          ped.forEach((d) => { if (d.f) { const key = d.f + '|' + d.m; if (!matings.has(key)) matings.set(key, []); matings.get(key).push(d); } });
          for (const [key, kids] of matings) {
            const [fa, mo] = key.split('|').map(at), y = fa.y, mid = (fa.x + mo.x) / 2, ky = kids[0].y, ys = (y + ky) / 2 + 0.05, cons = kids.some((c) => c.id === 'X');
            if (cons) { sP.line(fa.x, y + 0.04, mo.x, y + 0.04, { color: 'ink', width: 1.5 }); sP.line(fa.x, y - 0.04, mo.x, y - 0.04, { color: 'ink', width: 1.5 }); }
            else sP.line(fa.x, y, mo.x, y, { color: 'ink', width: 1.5 });
            sP.line(mid, y, mid, ys, { color: 'ink', width: 1.5 });
            const xs = kids.map((c) => c.x);
            sP.line(Math.min(mid, ...xs), ys, Math.max(mid, ...xs), ys, { color: 'ink', width: 1.5 });
            kids.forEach((c) => sP.line(c.x, ys, c.x, c.y + 0.21, { color: 'ink', width: 1.5 }));
          }
          // symbols and this drop's alleles
          const o = (k - 1) * n * 2, s = 0.21;
          ped.forEach((d, i) => {
            const top = Mo.tops.includes(d.id), fill = top ? 'gold' : d.id === 'X' ? 'accent' : 'panel', st = { fill, fillAlpha: top || d.id === 'X' ? 0.35 : 1, color: 'ink', width: 1.6 };
            if (d.sex === 'm') sP.rect(d.x - s, d.y - s, d.x + s, d.y + s, st);
            else if (d.sex === 'f') sP.circle(d.x, d.y, s, st);
            else sP.poly([[d.x, d.y + s * 1.25], [d.x + s * 1.25, d.y], [d.x, d.y - s * 1.25], [d.x - s * 1.25, d.y]], st);
            sP.text(d.id, d.x, d.y, { align: 'center', size: 10.5, weight: 700, color: 'ink', halo: false });
            [0, 1].forEach((j) => {
              const L = Mo.lab[o + 2 * i + j], col = Mo.colOf(L), x = d.x + (j ? 0.1 : -0.1), y = d.y - 0.36;
              if (col) sP.dot(x, y, { r: 5, color: col }); else sP.dot(x, y, { r: 4, hollow: true, color: 'muted', width: 1.3 });
            });
          });
          const X = ped[n - 1], isIBD = Mo.lab[o + 2 * (n - 1)] === Mo.lab[o + 2 * (n - 1) + 1];
          if (isIBD) sP.rect(X.x - 0.22, X.y - 0.48, X.x + 0.22, X.y - 0.24, { color: 'green', width: 2.4 });
          sP.corner(`drop ${k}: X ${isIBD ? 'is IBD' : 'is not IBD'}`, 'tl', { color: isIBD ? 'green' : 'muted', weight: 700 });
          // running estimate
          const F = Mo.F, ytop = Math.max(0.1, 3 * F);
          sF.setView([1, D], [0, ytop]);
          sF.between((m) => Math.min(ytop, F + 2 * Math.sqrt((F * (1 - F)) / m)), (m) => Math.max(0, F - 2 * Math.sqrt((F * (1 - F)) / m)), 1, D, { fill: 'green', fillAlpha: 0.08 });
          sF.hline(F, { color: 'green', width: 1.6, dash: [6, 4] });
          const pts = []; for (let m = 1; m <= k; m = Math.max(m + 1, Math.round(m * 1.03))) pts.push([m, Mo.cum[m - 1] / m]); pts.push([k, Mo.cum[k - 1] / k]);
          sF.clip(() => sF.path(pts, { color: 'accent', width: 2.2 }));
          sF.dot(k, Math.min(ytop, Mo.cum[k - 1] / k), { r: 4.5, color: 'gold' });
          sF.text(`F = ${v.fix(F, 4)}`, D, F, { align: 'right', dy: -10, size: 11.5, color: 'green', weight: 600 });
        }, { period: 12, still: 11.3 });
        v.legend([['gold', 'Wright paths through a common ancestor', { area: true }], ['accent', 'running share of IBD drops'], ['green', 'path-count $F$ ± 2 SE', { dash: true }]]);
        v.readout(() => {
          const Mo = model(), k = shown, est = Mo.cum[k - 1] / k, se = Math.sqrt((est * (1 - est)) / k);
          const terms = Mo.paths.map((p) => String.raw`${p.ids.join('–')}: $(\tfrac12)^{${p.k + 1}}$`).join(' · ');
          return String.raw`${terms} · sum $F_X = ${v.fix(Mo.F, 4)} = 1/${Math.round(1 / Mo.F)}$ (kinship recursion $\phi_{SD} = ${v.fix(Mo.Fk, 4)}$) · gene dropping: $X$ carried two copies of one ancestral copy in ${Mo.cum[k - 1]} of ${k} drops, $\hat F = ${v.fix(est, 4)} \pm ${v.fix(se, 4)}$`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.13
    {
      num: '1.13',
      kind: 'Theorem',
      name: 'Heterozygote deficit under inbreeding: H = 2pq(1 − F)',
      statement: String.raw`In a population with allele frequency $p$ in which each individual’s two copies are identical by descent with probability $F$ (and otherwise behave like two independent draws from the gene pool), the genotype frequencies are
$$P = p^2 + Fpq,\qquad H = 2pq(1-F),\qquad Q = q^2 + Fpq .$$
Inbreeding leaves the allele frequency unchanged but converts a fraction $F$ of the Hardy–Weinberg heterozygotes into homozygotes, half of each kind; conversely $F = 1 - H_{\text{obs}}/2pq$ measures the heterozygote deficit. As $F$ runs from $0$ to $1$ the point in the de Finetti diagram moves vertically from the Hardy–Weinberg parabola down to the base.`,
      idea: String.raw`Condition on whether the two copies are IBD (1.12). With probability $F$ they are copies of one ancestral copy, which is $A$ with probability $p$: the individual is $AA$ or $aa$, never heterozygous. With probability $1-F$ they are independent draws, giving the Hardy–Weinberg proportions (1.5). Mixing the two cases gives $P = Fp + (1-F)p^2 = p^2 + Fpq$ and $H = (1-F)2pq$, all linear in $F$. Each case contributes allele frequency $p$, so $p$ is unchanged — inbreeding redistributes alleles among genotypes without changing their numbers.`,
      caption: String.raw`Slide $F$ and $p$. Left: the de Finetti diagram with curves of constant $F$ ($F = 0$ is the Hardy–Weinberg parabola); the predicted point (blue ring) slides straight down the line of constant $p$ as $F$ grows, and the gold point is a simulated sample of 300 individuals, each autozygous with probability $F$. Right: the three genotype frequencies are straight lines in $F$, with simulated samples at eleven values of $F$ (hollow) and at the current one (filled); the dashed line is the sample allele frequency, flat at $p$.`,
      deps: ['popgen-1.12', 'popgen-1.10'],
      refs: ['Ewens §2.8'],
      credit: 'Wright, 1921',
      tags: ['inbreeding', 'heterozygosity'],
      viz(v) {
        const M = v.M, N = 300;
        const Fs = v.slider('inbreeding coefficient $F$', 0, 1, 0.4, { step: 0.01 });
        const pS = v.slider('allele frequency $p$', 0.02, 0.98, 0.62, { step: 0.01 });
        let seed = 4;
        v.button('New samples', () => { seed += 1; });
        const sT = v.stage({ x: [-0.06, 1.06], y: [-0.11, 0.93], equal: true, axes: false, height: 350 });
        const sL = v.stage({ x: [-0.02, 1.02], y: [-0.02, 1.02], axes: 'box', height: 350, weight: 1.15, xlabel: 'F', title: 'genotype frequencies are linear in $F$' });
        const sample = (F, p, r) => { const c = [0, 0, 0]; let auto = 0; for (let i = 0; i < N; i++) { if (r() < F) { auto++; c[r() < p ? 0 : 2]++; } else c[(r() < p ? 0 : 1) + (r() < p ? 0 : 1)]++; } return { c, auto }; };
        const cache = memo();
        const sims = () => cache([pS.value, Fs.value, seed].join('|'), () => {
          const r = v.rng(seed * 17 + 5), p = pS.value, grid = [];
          for (let i = 0; i <= 10; i++) grid.push({ F: i / 10, ...sample(i / 10, p, r) });
          return { grid, cur: sample(Fs.value, p, r) };
        });
        v.render(() => {
          const F = Fs.value, p = pS.value, q = 1 - p, S = sims();
          sT.poly([[0, 0], [1, 0], [0.5, SQ3]], { color: 'muted', width: 1.4, fill: 'faint', fillAlpha: 0.07 });
          [0.25, 0.5, 0.75].forEach((f) => { sT.fn((x) => SQ3 * 2 * x * (1 - x) * (1 - f), { domain: [0, 1], color: 'muted', width: 1, alpha: 0.6 }); sT.text(`F = ${f}`, 0.5, SQ3 * 0.5 * (1 - f), { align: 'center', dy: -7, size: 10, color: 'muted' }); });
          sT.fn((x) => SQ3 * 2 * x * (1 - x), { domain: [0, 1], color: 'green', width: 2.4 });
          sT.text('F = 0 (Hardy–Weinberg)', 0.5, SQ3 * 0.5, { align: 'center', dy: -8, size: 10.5, color: 'green', weight: 600 });
          if (F > 0.01 && F < 0.99) sT.fn((x) => SQ3 * 2 * x * (1 - x) * (1 - F), { domain: [0, 1], color: 'accent', width: 1.6, dash: [5, 4] });
          sT.line(p, 0, p, SQ3 * 2 * p * q, { color: 'accent', width: 1, dash: [3, 4] });
          sT.arrow(p, SQ3 * 2 * p * q, p, SQ3 * 2 * p * q * (1 - F) + 0.012, { color: 'accent', width: 1.6, head: 7 });
          const c = S.cur.c, ob = [(c[0] + c[1] / 2) / N, (c[1] / N) * SQ3];
          sT.dot(p, SQ3 * 2 * p * q * (1 - F), { r: 8, hollow: true, color: 'accent', width: 2.4 });
          sT.dot(ob[0], ob[1], { r: 4.5, color: 'gold' });
          sT.tex('aa', -0.03, -0.05, { size: 14, color: 'orange' }); sT.tex('AA', 1.03, -0.05, { size: 14, color: 'blue' }); sT.tex('Aa', 0.5, SQ3 + 0.045, { size: 14, color: 'purple' });
          sT.text('p', p, -0.05, { align: 'center', size: 13, color: 'accent', math: true });
          // linear panel
          const lines = [(f) => p * p + f * p * q, (f) => 2 * p * q * (1 - f), (f) => q * q + f * p * q];
          lines.forEach((fn, g) => sL.fn(fn, { domain: [0, 1], color: GCOL[g], width: 2.2 }));
          sL.fn(() => p, { domain: [0, 1], color: 'muted', width: 1.3, dash: [6, 4] });
          S.grid.forEach((o) => { o.c.forEach((x, g) => sL.dot(o.F, x / N, { r: 3.6, hollow: true, color: GCOL[g], width: 1.3 })); sL.dot(o.F, (o.c[0] + o.c[1] / 2) / N, { r: 2.2, color: 'muted' }); });
          sL.vline(F, { color: 'gold', width: 1.4 });
          c.forEach((x, g) => sL.dot(F, x / N, { r: 5.5, color: GCOL[g] }));
          sL.text('P = p² + Fpq', 1, p * p + p * q, { align: 'right', dy: -10, size: 11.5, color: 'blue', weight: 600 });
          sL.text('H = 2pq(1 − F)', 0.02, 2 * p * q, { align: 'left', dy: -10, size: 11.5, color: 'purple', weight: 600 });
        });
        v.legend([['blue', '$AA$'], ['purple', '$Aa$'], ['orange', '$aa$'], ['muted', 'sample allele frequency', { dash: true }], ['gold', 'simulated sample (left)', { dot: true }]]);
        v.readout(() => {
          const F = Fs.value, p = pS.value, q = 1 - p, S = sims(), c = S.cur.c, H = c[1] / N, ph = (c[0] + c[1] / 2) / N;
          return String.raw`predicted $P:H:Q = ${v.fix(p * p + F * p * q, 3)} : ${v.fix(2 * p * q * (1 - F), 3)} : ${v.fix(q * q + F * p * q, 3)}$ · sample of ${N} (${S.cur.auto} autozygous): $${v.fix(c[0] / N, 3)} : ${v.fix(H, 3)} : ${v.fix(c[2] / N, 3)}$ · sample $p = ${v.fix(ph, 3)}$ (population ${v.fix(p, 3)}) · estimated $F = 1 - H/2\hat p\hat q = ${v.fix(1 - H / (2 * ph * (1 - ph)), 3)}$`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.14
    {
      num: '1.14',
      kind: 'Phenomenon',
      name: 'Inbreeding depression',
      statement: String.raw`Inbred offspring have lower average fitness — survival, fertility, size — than outbred offspring of the same population. If fitness is determined by many loci with rare deleterious alleles that are at least partly recessive (dominance $h<\tfrac12$), and loci act multiplicatively, then with $P = p^2+Fpq$, $H = 2pq(1-F)$, $Q = q^2+Fpq$ at each locus (1.13) the mean fitness is
$$\bar w(F) = \prod_{\text{loci}} \bigl(\bar w_i(0) - F\,p_iq_is_i(1-2h_i)\bigr), \qquad \ln \bar w(F) \approx -A - BF,$$
falling linearly on a log scale with slope $B \approx \sum_i p_iq_is_i(1-2h_i)/\bar w_i(0)$, the number of **lethal equivalents** per gamete. Purely additive effects ($h=\tfrac12$) cause no inbreeding depression; overdominance (heterozygote advantage) causes it too.`,
      idea: String.raw`Inbreeding converts heterozygotes into homozygotes in equal numbers (1.13). Moving a pair of copies from $Aa$ (fitness $1-hs$) into one $AA$ and one $aa$ (average fitness $1-s/2$) changes fitness by $s(h-\tfrac12)$, which is negative exactly when the deleterious allele is partly recessive — the hidden recessive load of 1.11 is exposed. Each locus contributes a term linear in $F$; multiplied over loci this gives $\ln\bar w$ nearly linear in $F$ with slope $B$.`,
      caption: String.raw`A genome of 300 loci carrying rare deleterious mutations (a fifth of them nearly lethal and almost completely recessive, the rest mild and partly recessive). The left panel plots mean fitness against $F$ on a log scale: dots are simulated populations of 250 individuals (each locus autozygous with probability $F$), the line is the exact prediction. Right: how many loci are homozygous for a deleterious allele per individual, outbred (outline) versus at the slider’s $F$ (filled). Make the mutations additive ($h = \tfrac12$) and the depression disappears; make the loci overdominant and it returns for a different reason.`,
      deps: ['popgen-1.13', 'popgen-1.11'],
      refs: ['Gillespie'],
      credit: 'Darwin, 1876 (crossing experiments); Morton, Crow & Muller, 1956 (lethal equivalents)',
      tags: ['inbreeding', 'genetic load'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Inbreeding_depression' },
      viz(v) {
        const M = v.M, L = 300, NI = 250, FG = M.linspace(0, 1, 9);
        const Fs = v.slider('inbreeding coefficient $F$', 0, 1, 0.5, { step: 0.01 });
        const dom = v.select('deleterious alleles', [{ value: 'rec', label: 'partly recessive' }, { value: 'add', label: 'additive' }, { value: 'over', label: 'overdominant loci' }], 'rec');
        let gseed = 3;
        v.button('New genome', () => { gseed += 1; });
        const sW = v.stage({ x: [-0.03, 1.03], y: [0.2, 1], ylog: true, axes: 'box', height: 340, weight: 1.25, xlabel: 'F', title: 'mean fitness $\\bar w$ (log scale)' });
        const sH = v.stage({ x: [-0.5, 12.5], y: [0, 1], axes: 'box', height: 340, title: 'homozygous deleterious loci per individual' });
        const cg = memo(), cs = memo(), cc = memo();
        const genome = () => cg(gseed + '|' + dom.value, () => {
          const r = v.rng(gseed * 53 + 11), loci = [];
          for (let i = 0; i < L; i++) {
            if (dom.value === 'over') { if (i < 14) { const t = r.uniform(0.03, 0.08); loci.push({ q: 0.5, w: [1 - t, 1, 1 - t], bad: [1, 0, 1] }); } continue; }
            const lethal = r() < 0.2, s = lethal ? r.uniform(0.7, 1) : r.uniform(0.01, 0.1), q = lethal ? r.uniform(0.004, 0.02) : r.uniform(0.005, 0.03);
            const h = dom.value === 'add' ? 0.5 : lethal ? 0.02 : 0.2;
            loci.push({ q, w: [1, 1 - h * s, 1 - s], bad: [0, 0, 1] });
          }
          return loci;
        });
        const theory = (F) => genome().reduce((acc, l) => { const p = 1 - l.q, q = l.q; return acc * ((p * p + F * p * q) * l.w[0] + 2 * p * q * (1 - F) * l.w[1] + (q * q + F * p * q) * l.w[2]); }, 1);
        const pop = (F, r) => { // NI individuals: fitness and number of homozygous deleterious loci
          const G = genome(), w = new Float64Array(NI), hom = new Int32Array(NI);
          for (let k = 0; k < NI; k++) {
            let f = 1, b = 0;
            for (const l of G) { const g = r() < F ? (r() < l.q ? 2 : 0) : (r() < l.q ? 1 : 0) + (r() < l.q ? 1 : 0); f *= l.w[g]; b += l.bad[g]; }
            w[k] = f; hom[k] = b;
          }
          return { w, hom, mean: M.mean(Array.from(w)), se: M.stdev(Array.from(w)) / Math.sqrt(NI) };
        };
        const sims = () => cs(gseed + '|' + dom.value, () => { const r = v.rng(gseed * 7 + 1); return FG.map((F) => ({ F, ...pop(F, r) })); });
        const cur = () => cc([gseed, dom.value, Fs.value].join('|'), () => { const r = v.rng(gseed * 3 + 2); return { out: pop(0, r), inb: pop(Fs.value, r) }; });
        v.render(() => {
          const S = sims(), C = cur(), w0 = theory(0), w1 = theory(1);
          const lo = Math.min(w1, ...S.map((o) => o.mean - 2 * o.se)) * 0.92, hi = Math.max(w0, ...S.map((o) => o.mean + 2 * o.se)) * 1.04;
          sW.setView(null, [Math.max(1e-3, lo), Math.min(1.2, hi)]);
          sW.fn(theory, { domain: [0, 1], color: 'accent', width: 2.4 });
          S.forEach((o) => { sW.line(o.F, o.mean - 2 * o.se, o.F, o.mean + 2 * o.se, { color: 'gold', width: 1.4 }); sW.dot(o.F, o.mean, { r: 4.5, color: 'gold' }); });
          sW.vline(Fs.value, { color: 'red', width: 1.2, dash: [4, 4] });
          sW.dot(Fs.value, theory(Fs.value), { r: 5.5, color: 'red' });
          // histogram of homozygous deleterious loci
          const mx = Math.max(4, ...Array.from(C.inb.hom), ...Array.from(C.out.hom)) + 0.5, edges = M.range(Math.ceil(mx) + 1).map((k) => k - 0.5);
          const h1 = M.histogram(Array.from(C.out.hom), { bins: edges }), h2 = M.histogram(Array.from(C.inb.hom), { bins: edges });
          sH.setView([-0.6, Math.ceil(mx) - 0.4], [0, Math.max(...h1.counts, ...h2.counts) * 1.15]);
          sH.hist({ edges, counts: h2.counts }, { color: 'red', fillAlpha: 0.35, gap: 0.08 });
          sH.hist({ edges, counts: h1.counts }, { color: 'blue', fillAlpha: 0, outline: true });
          sH.corner(`F = ${v.fix(Fs.value, 2)}: mean ${v.fix(M.mean(Array.from(C.inb.hom)), 2)} · outbred: ${v.fix(M.mean(Array.from(C.out.hom)), 2)}`, 'tr', { color: 'ink', weight: 600 });
        });
        v.legend([['gold', 'simulated mean fitness ± 2 SE', { dot: true }], ['accent', 'exact $\\prod_i \\bar w_i(F)$'], ['blue', 'outbred ($F = 0$)'], ['red', 'inbred (slider $F$)', { area: true }]]);
        v.readout(() => {
          const S = sims(), C = cur(), w0 = theory(0), wF = theory(Fs.value), fit = M.linreg(S.map((o) => o.F), S.map((o) => Math.log(o.mean)));
          const B = Math.log(w0) - Math.log(theory(1)), Bs = genome().reduce((a, l) => { const p = 1 - l.q, q = l.q, w0i = p * p * l.w[0] + 2 * p * q * l.w[1] + q * q * l.w[2]; return a + (p * q * (2 * l.w[1] - l.w[0] - l.w[2])) / w0i; }, 0);
          const z = (x) => (Math.abs(x) < 5e-6 ? 0 : x);
          return String.raw`$\bar w(0) = ${v.fix(w0, 3)}$, $\bar w(${v.fix(Fs.value, 2)}) = ${v.fix(wF, 3)}$ (simulated ${v.fix(C.inb.mean, 3)}): inbreeding depression $1-\bar w(F)/\bar w(0) = ${v.fix(z(100 * (1 - wF / w0)), 1)}\%$ · slope of $\ln\bar w$ against $F$: simulated $${v.fix(z(-fit.slope), 3)}$, exact $${v.fix(z(B), 3)}$, per-locus sum $\sum p_iq_i(2w_{Aa}-w_{AA}-w_{aa})/\bar w_i = ${v.fix(z(Bs), 3)}$ lethal equivalents`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.15
    {
      num: '1.15',
      kind: 'Model',
      name: 'Assortative mating',
      statement: String.raw`Under **positive assortative mating** individuals prefer mates of their own phenotype. In the simplest model a fraction $\alpha$ of individuals mate with a partner of the same phenotype and the rest mate at random. If all three genotypes are distinguishable (no dominance), the genotype frequencies change as
$$H' = \alpha\,\tfrac12 H + (1-\alpha)\,2pq, \qquad p' = p,$$
so with complete assortment ($\alpha = 1$) the heterozygote frequency halves every generation and the population splits into the two homozygotes, while partial assortment settles at $H^* = 2pq\,\dfrac{1-\alpha}{1-\alpha/2}$. With dominance ($AA$ and $Aa$ look alike) heterozygotes still decline, but more slowly. Allele frequencies do not change in either case: assortative mating, like inbreeding, only rearranges alleles into genotypes — but only at loci affecting the trait used to choose mates.`,
      idea: String.raw`Mating like with like is selfing at the level of the genotype: $AA\times AA$ and $aa\times aa$ breed true, and $Aa\times Aa$ gives back only half heterozygotes (1.2), so the assortative part of the population contributes $\tfrac12H$ and the random part $2pq$ (1.5). No genotype leaves more offspring than another, so $p$ is unchanged. The fixed point of the linear recursion gives $H^*$. With dominance, dominant-phenotype parents still produce some heterozygotes, and the deficit grows more slowly; unlike inbreeding, loci unrelated to the mating trait are unaffected.`,
      caption: String.raw`Two copies of the same population (1440 individuals, Hardy–Weinberg at $p = 0.3$) breed side by side — left at random, right assortatively; colours are genotypes. Press play: the purple heterozygotes vanish on the right while the left stays put, and the plot shows heterozygosity (solid: simulation, dashed: the recursion) with both allele frequencies flat. Lower $\alpha$ to see the deficit level off at $H^*$; switch to dominance to see a slower decline.`,
      deps: ['popgen-1.12', 'popgen-1.5'],
      refs: ['Ewens §2.8'],
      credit: 'Jennings, 1916; Wright, 1921',
      scope: String.raw`Assumes non-overlapping generations, mate choice on a phenotype determined by this one locus, no selection (every individual gets a mate) and a large population. Real assortment acts on polygenic traits, is partial, and creates correlations between loci rather than large single-locus deficits.`,
      tags: ['mating systems', 'heterozygosity'],
      viz(v) {
        const M = v.M, W = 48, HH = 30, G = 12, RATE = 1.2;
        let seed = 5;
        const alpha = v.slider('share of assortative matings $\\alpha$', 0, 1, 1, { step: 0.05, onChange: () => reset() });
        const dom = v.select('phenotypes', [{ value: 'co', label: 'codominant' }, { value: 'dom', label: '$A$ dominant' }], 'co', { onChange: () => reset() });
        v.button('New run', () => { seed += 1; reset(); });
        const s1 = v.stage({ height: 250, title: 'random mating' });
        const s2 = v.stage({ height: 250, title: 'assortative mating' });
        const sT = v.stage({ x: [0, G], y: [-0.05, 0.62], axes: 'box', height: 230, full: true, xlabel: 'generation', title: 'heterozygosity $H$ and allele frequency $p$' });
        const ph = (g) => (dom.value === 'co' ? g : g === 2 ? 1 : 0);
        const spec = (assort) => ({
          size: [W, HH], seed, animate: false, controls: false,
          states: [{ name: 'AA', color: 'blue' }, { name: 'Aa', color: 'purple' }, { name: 'aa', color: 'orange' }],
          init: (r) => drawG(r, 0.09, 0.42), // Hardy–Weinberg at p = 0.3
          step: (Mo, r) => {
            const g = Mo.grid, N = Mo.N, by = [[], [], []], nx = new Uint8Array(N);
            for (let k = 0; k < N; k++) by[ph(g[k])].push(g[k]);
            for (let k = 0; k < N; k++) {
              const g1 = g[(r() * N) | 0];
              let g2;
              if (assort && r() < alpha.value) { const pool = by[ph(g1)]; g2 = pool[(r() * pool.length) | 0]; } else g2 = g[(r() * N) | 0];
              nx[k] = gamete(r, g1) + gamete(r, g2);
            }
            g.set(nx);
          },
          stats: (Mo) => { let s = 0; for (let k = 0; k < Mo.N; k++) s += Mo.grid[k]; return { p: 1 - s / (2 * Mo.N) }; },
        });
        const A1 = v.agents(s1, spec(false)), A2 = v.agents(s2, spec(true));
        const reset = () => { A1.reset(seed); A2.reset(seed); v.invalidate(); }; // the clock replays both runs up to the current generation
        const sync = (A, gen) => { if (A.t > gen) A.reset(seed); if (A.t < gen) A.model.step(gen - A.t); };
        const theory = () => { // deterministic recursion for the assortative population, from the simulated generation 0
          const H0 = A2.history; let P = H0.AA[0], H = H0.Aa[0], Q = H0.aa[0]; const out = [H], a = alpha.value;
          for (let t = 0; t < G; t++) {
            const p = P + H / 2, q = 1 - p; let Pa, Ha, Qa;
            if (dom.value === 'co') { Pa = P + H / 4; Ha = H / 2; Qa = Q + H / 4; }
            else { const D = P + H, u = D > 0 ? (P + H / 2) / D : 0; Pa = D * u * u; Ha = D * 2 * u * (1 - u); Qa = D * (1 - u) ** 2 + Q; }
            P = a * Pa + (1 - a) * p * p; H = a * Ha + (1 - a) * 2 * p * q; Q = 1 - P - H; out.push(H);
          }
          return out;
        };
        v.animate((t) => {
          const gen = Math.min(G, Math.floor(t * RATE));
          sync(A1, gen); sync(A2, gen);
          A1.draw(); A2.draw();
          s1.corner(`generation ${A1.t}`, 'tl', { color: 'ink', weight: 700 }); s2.corner(`generation ${A2.t}`, 'tl', { color: 'ink', weight: 700 });
          const H1 = A1.history, H2 = A2.history, T = theory();
          sT.path(T.map((h, i) => [i, h]), { color: 'purple', width: 1.5, dash: [6, 4] });
          const p0 = H2.p[0]; sT.hline(2 * p0 * (1 - p0), { color: 'gray', width: 1.2, dash: [6, 4] });
          if (alpha.value < 1 && dom.value === 'co') { const a = alpha.value, Hs = (2 * p0 * (1 - p0) * (1 - a)) / (1 - a / 2); sT.text(`H* = ${v.fix(Hs, 3)}`, G, Hs, { align: 'right', dy: -9, size: 11, color: 'purple' }); }
          sT.path(H1.t.map((x, i) => [x, H1.Aa[i]]), { color: 'gray', width: 2.4 }); sT.path(H2.t.map((x, i) => [x, H2.Aa[i]]), { color: 'purple', width: 2.4 });
          sT.path(H1.t.map((x, i) => [x, H1.p[i]]), { color: 'blue', width: 1.2, alpha: 0.45 }); sT.path(H2.t.map((x, i) => [x, H2.p[i]]), { color: 'blue', width: 1.2, alpha: 0.8 });
          H2.t.forEach((x, i) => sT.dot(x, H2.Aa[i], { r: 3.5, color: 'purple' }));
          sT.text('allele frequency p', G - 0.1, H2.p[H2.p.length - 1], { align: 'right', dy: -10, size: 11.5, color: 'blue', weight: 600 });
        }, { period: G / RATE + 2.5, still: G / RATE + 1 });
        v.legend([['purple', '$H$, assortative'], ['gray', '$H$, random mating'], ['purple', 'recursion', { dash: true }], ['gray', '$2pq$ at the start', { dash: true }], ['blue', 'allele frequency $p$ (both)']]);
        v.readout(() => {
          const H1 = A1.history, H2 = A2.history, i = H2.t.length - 1, T = theory();
          return String.raw`generation ${H2.t[i]}: heterozygotes ${v.fix(H1.Aa[i], 3)} with random mating, **${v.fix(H2.Aa[i], 3)}** with assortative mating (recursion ${v.fix(T[H2.t[i]], 3)}) · allele frequency ${v.fix(H2.p[0], 3)} at the start, now ${v.fix(H1.p[i], 3)} and ${v.fix(H2.p[i], 3)} (sampling noise only) · apparent $F = 1 - H/2pq = ${v.fix(1 - H2.Aa[i] / (2 * H2.p[i] * (1 - H2.p[i])), 3)}$`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.16
    {
      num: '1.16',
      kind: 'Phenomenon',
      name: 'Wahlund effect',
      statement: String.raw`Let a population consist of $k$ subpopulations with weights $w_i$ and allele frequencies $p_i$, each in Hardy–Weinberg proportions. A sample pooled across them has allele frequency $\bar p = \sum w_ip_i$ but genotype frequencies
$$P = \bar p^2 + \sigma^2, \qquad H = 2\bar p\bar q - 2\sigma^2, \qquad Q = \bar q^2 + \sigma^2,$$
where $\sigma^2 = \sum w_i(p_i-\bar p)^2$ is the variance of allele frequency among subpopulations. The pooled sample therefore shows a heterozygote deficit of exactly twice that variance, as if inbred with $F_{ST} = \sigma^2/\bar p\bar q$, although no subpopulation departs from Hardy–Weinberg.`,
      idea: String.raw`Heterozygosity $2p(1-p)$ is a concave function of $p$, so the average of its values lies below its value at the average (Jensen): $\sum w_i\,2p_iq_i = 2\bar p\bar q - 2\sigma^2$, from $\sum w_ip_i^2 = \bar p^2 + \sigma^2$. Geometrically, the subpopulations are points on the Hardy–Weinberg parabola and the pooled sample is their centre of mass, which lies inside the curve. Fusing the subpopulations into one randomly mating unit restores $2\bar p\bar q$ in one generation (1.5).`,
      caption: String.raw`Each coloured handle is a subpopulation in Hardy–Weinberg proportions, so it sits on the parabola $H = 2p(1-p)$; drag them. The pooled population is their centre of mass (gold), below the curve by exactly $2\sigma^2$, the gap marked at $\bar p$. The bars show each subpopulation, the pooled sample and what Hardy–Weinberg would predict for $\bar p$: fewer heterozygotes, more of both homozygotes. The readout tests a simulated pooled sample of 100 per subpopulation for Hardy–Weinberg — and rejects it.`,
      deps: ['popgen-1.5', 'popgen-1.10'],
      refs: ['Nielsen–Slatkin'],
      credit: 'Wahlund, 1928',
      tags: ['population structure', 'heterozygosity'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Wahlund_effect' },
      viz(v) {
        const M = v.M, NS = 100, COLS = ['teal', 'pink', 'gold', 'green', 'red'], P0 = [0.12, 0.5, 0.86, 0.32, 0.68];
        const kS = v.slider('subpopulations $k$', 2, 5, 3, { int: true, onChange: () => hs.forEach((h, i) => { h.visible = i < kS.value; }) });
        let seed = 6;
        v.button('New samples', () => { seed += 1; });
        const sP = v.stage({ x: [-0.03, 1.03], y: [-0.03, 0.6], axes: 'box', height: 350, weight: 1.3, xlabel: 'p', ylabel: 'H' });
        const sB = v.stage({ x: [-0.6, 6.7], y: [-0.13, 1.06], axes: false, height: 350, title: 'genotype frequencies' });
        const onCurve = (x) => { const p = clamp(x, 0.01, 0.99); return [p, 2 * p * (1 - p)]; };
        const hs = P0.map((p, i) => sP.handle(p, 2 * p * (1 - p), { color: COLS[i], label: String(i + 1), labelPos: 'n', constrain: (x) => onCurve(x) }));
        hs.forEach((h, i) => { h.visible = i < kS.value; });
        const ps = () => hs.slice(0, kS.value).map((h) => h.x);
        const cache = memo();
        const sample = () => { const p = ps(); return cache(p.map((x) => x.toFixed(4)).join(',') + '|' + seed, () => { const r = v.rng(seed * 19 + 3), c = [0, 0, 0]; for (const pi of p) for (let j = 0; j < NS; j++) c[(r() < pi ? 0 : 1) + (r() < pi ? 0 : 1)]++; return c; }); };
        v.render(() => {
          const p = ps(), k = p.length, pb = M.mean(p), var_ = M.mean(p.map((x) => (x - pb) ** 2)), Hb = M.mean(p.map((x) => 2 * x * (1 - x)));
          sP.fn((x) => 2 * x * (1 - x), { domain: [0, 1], color: 'green', width: 2.4 });
          sP.tex('H = 2p(1-p)', 0.04, 0.53, { align: 'left', size: 14, color: 'green' });
          if (k >= 3) sP.poly(M.hull(p.map((x) => [x, 2 * x * (1 - x)])), { fill: 'gold', fillAlpha: 0.1, color: 'gold', width: 1, alpha: 0.6 });
          else sP.line(p[0], 2 * p[0] * (1 - p[0]), p[1], 2 * p[1] * (1 - p[1]), { color: 'gold', width: 1, alpha: 0.7 });
          sP.vline(pb, { color: 'muted', width: 1, dash: [3, 4] });
          sP.arrow(pb, 2 * pb * (1 - pb), pb, Hb, { both: true, color: 'red', width: 1.8, head: 7 });
          sP.text(`2σ² = ${v.fix(2 * var_, 3)}`, pb, (Hb + 2 * pb * (1 - pb)) / 2, { dx: 8, size: 12, color: 'red', weight: 700 });
          sP.dot(pb, 2 * pb * (1 - pb), { r: 6, hollow: true, color: 'green', width: 2.2 });
          sP.dot(pb, Hb, { r: 6.5, color: 'gold', label: 'pooled', labelPos: 's' });
          // bars
          const bar = (x, fr, st = {}) => { let y = 0; fr.forEach((f, g) => { if (f > 0) sB.rect(x - 0.32, y, x + 0.32, y + f, { fill: GCOL[g], fillAlpha: st.alpha ?? 0.7, color: 'panel', width: 1 }); y += f; }); if (st.outline) sB.rect(x - 0.36, 0, x + 0.36, 1, { color: st.outline, width: 2, dash: st.dash }); };
          p.forEach((x, i) => { bar(i, [x * x, 2 * x * (1 - x), (1 - x) ** 2]); sB.text(String(i + 1), i, -0.06, { align: 'center', size: 12, weight: 700, color: COLS[i] }); });
          const pooled = [M.mean(p.map((x) => x * x)), Hb, M.mean(p.map((x) => (1 - x) ** 2))], hw = [pb * pb, 2 * pb * (1 - pb), (1 - pb) ** 2];
          bar(k + 0.5, pooled, { outline: 'gold' }); bar(k + 1.6, hw, { alpha: 0.35, outline: 'green', dash: [5, 3] });
          sB.text('pooled', k + 0.5, -0.06, { align: 'center', size: 11.5, weight: 700, color: 'gold' });
          sB.text('HW at p̄', k + 1.6, -0.06, { align: 'center', size: 11.5, weight: 700, color: 'green' });
          const yH = (fr) => fr[0] + fr[1] / 2;
          sB.text(v.fix(Hb, 3), k + 0.5, yH(pooled), { align: 'center', size: 11, weight: 700, color: 'panel', halo: false });
          sB.text(v.fix(hw[1], 3), k + 1.6, yH(hw), { align: 'center', size: 11, weight: 700, color: 'ink' });
          sB.setView([-0.6, k + 2.2], [-0.13, 1.06]);
        });
        v.legend([['blue', '$AA$', { area: true }], ['purple', '$Aa$', { area: true }], ['orange', '$aa$', { area: true }], ['gold', 'pooled sample', { dot: true }], ['green', 'Hardy–Weinberg', { dash: true }]]);
        v.readout(() => {
          const p = ps(), pb = M.mean(p), s2 = M.mean(p.map((x) => (x - pb) ** 2)), Hb = M.mean(p.map((x) => 2 * x * (1 - x))), c = sample(), T = hwTest(M, c[0], c[1], c[2]);
          return String.raw`$\bar p = ${v.fix(pb, 3)}$, $\sigma^2 = ${v.fix(s2, 4)}$ · pooled $H = \overline{2p_iq_i} = ${v.fix(Hb, 3)}$ against $2\bar p\bar q = ${v.fix(2 * pb * (1 - pb), 3)}$: deficit ${v.fix(2 * pb * (1 - pb) - Hb, 4)} $= 2\sigma^2$ ✓ · $F_{ST} = \sigma^2/\bar p\bar q = ${v.fix(s2 / (pb * (1 - pb)), 3)}$ · simulated pooled sample ${c.join(' : ')}: $\chi^2 = ${v.fix(T.chi2, 1)}$, $p ${pText(v, T.pval)}$${T.pval < 0.05 ? ' — Hardy–Weinberg rejected, though every subpopulation obeys it' : ''}`;
        });
      },
    },
  ],
};
