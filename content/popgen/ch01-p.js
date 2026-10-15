// Population Genetics & Evolution — Chapter 1 (papers): Mendel 1866, Hardy 1908, Weinberg 1908

// ── shared helpers (house colours of the collection: AA blue, Aa purple, aa orange) ──
const GCOL = ['blue', 'purple', 'orange'];
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const fmtInt = (x) => Math.round(x).toLocaleString('en-US');
/** One-slot cache: recompute only when the key changes. */
function memo() { let key, val; return (k, f) => { if (k !== key) { key = k; val = f(); } return val; }; }
/** Binomial draw: Bernoulli sum for small n, normal approximation with continuity rounding for large n·p·q. */
function binom(r, n, p) {
  if (n * p * (1 - p) < 60) { let s = 0; for (let i = 0; i < n; i++) if (r() < p) s++; return s; }
  return clamp(Math.round(n * p + Math.sqrt(n * p * (1 - p)) * r.normal()), 0, n);
}
/** Multinomial draw of n into classes with probabilities e (sequential binomials). */
function multinom(r, n, e) { const out = []; let left = n, rest = 1; e.forEach((pi, i) => { if (i === e.length - 1) { out.push(left); return; } const k = binom(r, left, rest > 0 ? clamp(pi / rest, 0, 1) : 0); out.push(k); left -= k; rest -= pi; }); return out; }

// ── Mendel 1866: counts as printed (checked against the Abbott–Fairbanks translation, Genetics 204: 407–422, 2016,
//    and Table 1 of Pires & Branco, Statistical Science 25: 545–565, 2010) ──
const M31 = [
  { name: 'seed shape', d: 'round', r: 'angular', D: 5474, R: 1850, of: 'seeds' },
  { name: 'albumen colour', d: 'yellow', r: 'green', D: 6022, R: 2001, of: 'seeds' },
  { name: 'seed-coat colour', d: 'grey-brown', r: 'white', D: 705, R: 224, of: 'plants' },
  { name: 'pod shape', d: 'inflated', r: 'constricted', D: 882, R: 299, of: 'plants' },
  { name: 'unripe pod colour', d: 'green', r: 'yellow', D: 428, R: 152, of: 'plants' },
  { name: 'flower position', d: 'axial', r: 'terminal', D: 651, R: 207, of: 'plants' },
  { name: 'stem length', d: 'long', r: 'short', D: 787, R: 277, of: 'plants' },
];
// F₂ plants with the dominant form, classified by their offspring as constant (AA) or hybrid (Aa); plant characters were
// judged from ten seedlings each, so a hybrid is misread as constant with probability (3/4)^10.
const M21 = [
  { name: 'seed shape (expt 1)', C: 193, H: 372, seed: true },
  { name: 'albumen colour (expt 2)', C: 166, H: 353, seed: true },
  { name: 'seed-coat colour (expt 3)', C: 36, H: 64 },
  { name: 'pod shape (expt 4)', C: 29, H: 71 },
  { name: 'pod colour (expt 5)', C: 40, H: 60 },
  { name: 'pod colour, repeated', C: 35, H: 65 },
  { name: 'flower position (expt 6)', C: 33, H: 67 },
  { name: 'stem length (expt 7)', C: 28, H: 72 },
];
const MDI = [{ name: 'round yellow', O: 315, e: 9 / 16 }, { name: 'angular yellow', O: 101, e: 3 / 16 }, { name: 'round green', O: 108, e: 3 / 16 }, { name: 'angular green', O: 32, e: 1 / 16 }];
const P10 = 1 / 3 + (2 / 3) * 0.75 ** 10; // 0.3709: chance a dominant F₂ plant is declared constant after ten seedlings

// ── Hardy 1908: one generation of random mating in his notation p : 2q : r ──
function hardyStep(p, q, r) { const t = p + 2 * q + r; p /= t; q /= t; r /= t; return [(p + q) ** 2, (p + q) * (q + r), (q + r) ** 2]; }

// ── Weinberg 1908: relatives of a trait bearer under panmixia, by exact enumeration of matings ──
/** trait(g): does genotype g (number of A alleles 0, 1, 2) show the trait? */
function relatives(a, dominant) {
  const G = [(1 - a) ** 2, 2 * a * (1 - a), a * a];             // genotype frequencies by number of A alleles
  const T = (g) => (dominant ? g >= 1 : g === 2);
  const kid = (g1, g2) => { const t1 = g1 / 2, t2 = g2 / 2; return [(1 - t1) * (1 - t2), t1 * (1 - t2) + (1 - t1) * t2, t1 * t2]; };
  let pop = 0, pc = 0, ppc = 0, s1 = 0, s12 = 0, cc = 0;
  for (let g = 0; g < 3; g++) if (T(g)) pop += G[g];
  for (let g1 = 0; g1 < 3; g1++) for (let g2 = 0; g2 < 3; g2++) {
    const w = G[g1] * G[g2], K = kid(g1, g2), tk = K.reduce((s, x, g) => s + (T(g) ? x : 0), 0);
    pc += w * tk; ppc += w * tk * (T(g1) ? 1 : 0);              // child bears the trait; and so does parent 1
    s1 += w * tk; s12 += w * tk * tk;                              // two sibs, conditionally independent given the parents
  }
  for (let g = 0; g < 3; g++) if (T(g)) {                        // a bearer of genotype g mates at random
    let tk = 0; for (let g2 = 0; g2 < 3; g2++) { const K = kid(g, g2); tk += G[g2] * K.reduce((s, x, gg) => s + (T(gg) ? x : 0), 0); }
    cc += (G[g] / pop) * tk;
  }
  return { pop, parents: ppc / pc, sibs: s12 / s1, kids: cc };
}

export default {
  collection: 'popgen',
  chapter: 1,
  items: [
    // ───────────────────────────────────────────────────────────── 1.17
    {
      num: '1.17',
      kind: 'Paper',
      name: 'Versuche über Pflanzen-Hybriden',
      paper: { authors: 'Gregor Mendel', year: 1866, title: 'Versuche über Pflanzen-Hybriden', venue: 'Verhandlungen des naturforschenden Vereines in Brünn 4 (Abhandlungen): 3–47', url: 'https://www.biodiversitylibrary.org/bibliography/61004' },
      introduces: ['popgen-1.2', 'popgen-1.3'],
      credit: 'Gregor Mendel, read 1865, printed 1866',
      statement: String.raw`From eight years of crosses between true-breeding varieties of the garden pea differing in seven characters, Mendel reported:

(a) the hybrids (F₁) all show one form of each character, the **dominant** one;

(b) among their self-fertilised offspring (F₂) the dominant and the **recessive** forms reappear in the ratio $3:1$ — summed over his seven characters, $14{,}949 : 5{,}010 = 2.98 : 1$;

(c) of the dominant F₂ plants one third breed true and two thirds behave like the hybrids again, so the F₂ is really $1 : 2 : 1$;

(d) two characters followed together combine independently: $315 : 101 : 108 : 32$ seeds against the expected $9:3:3:1$.

He explained this by supposing that a hybrid forms germ cells carrying either form of each character in equal numbers, which meet at random in fertilisation — in modern terms, segregation of paired alleles and independent assortment (popgen-1.2, 1.3). Scope: characters each controlled by one gene with complete dominance, at genes that assort independently.`,
      idea: String.raw`Before Mendel, heredity was pictured as a blending of the parents' natures, and hybridisers such as Kölreuter and Gärtner had described the reappearance of parental forms without counting them. Mendel chose a self-fertilising plant with clear-cut alternative characters, followed each character separately over several generations, and *counted*: thousands of seeds and plants, analysed as ratios. The paper, read to the Brünn natural-history society in 1865, was little cited until Correns, de Vries and Tschermak reached the same results in 1900; it founded genetics. In 1936 R. A. Fisher, re-analysing every experiment, found the agreement with expectation *too good*: over 84 independent comparisons $\chi^2 = 41.6$, a fit at least that close having probability 0.00007; and where Mendel judged plants from only ten seedlings his counts fit $2:1$, the ratio he expected, rather than the $1.70:1$ that a ten-seedling test actually yields. Explanations debated since include unconscious bias in classifying borderline seeds, reporting the clearest experiments, and Mendel writing a demonstration rather than a data report; nobody doubts the laws themselves, which every later cross has confirmed.`,
      caption: String.raw`Mendel's own counts (gold), one row per experiment: the horizontal position is the deviation from the expected count in standard deviations, $z = (O - np)/\sqrt{np(1-p)}$. Grey dots are 60 simulated repeats of the same experiment with the same numbers of seeds or plants, so they show how far chance alone scatters. **Click a row** to read its numbers. Right: the $\chi^2$ statistic for the whole table — the curve is the $\chi^2$ distribution, the bars 400 simulated repeats, the gold line Mendel's value, and the gold area the probability of fitting at least as well. Switch the table to the *2 : 1* tests: the plant characters were judged from ten seedlings, and the simulated repeats of that procedure drift right of the $2:1$ expectation while Mendel's counts do not. Turn on **Fisher 1936** to measure them against the corrected expectation $0.3709$.`,
      deps: [],
      see: ['popgen-1.7', 'popgen-1.5'],
      refs: [],
      tags: ['Mendel', 'segregation', 'history'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Experiments_on_Plant_Hybridization' },
      viz(v) {
        const M = v.M, NREP = 400, NDOT = 60;
        let sel = 0, seed = 1;
        const table = v.select('table', [{ value: '31', label: '3 : 1 (seven characters)' }, { value: '21', label: '2 : 1 (dominants tested)' }, { value: 'di', label: '9 : 3 : 3 : 1 (two characters)' }], '31', { onChange: () => { sel = 0; } });
        const fisher = v.toggle('Fisher 1936', false);
        v.button('Re-run the simulation', () => { seed++; });
        const L = v.stage({ x: [-3.7, 3.7], y: [-7.6, 0.6], axes: false, height: 400, weight: 1.35, minWidth: 330, title: 'deviation from Mendel’s expectation (standard deviations)' });
        const C = v.stage({ x: [0, 25], y: [0, 0.2], axes: 'box', height: 400, weight: 1, minWidth: 260, xlabel: 'χ²', title: '$\\chi^2$ for the whole table' });
        // rows of the chosen table: n, observed, expected probability (Mendel / Fisher) and the true probability of the procedure
        const rows = () => {
          const fz = fisher.value;
          if (table.value === '31') return M31.map((t) => ({ label: `${t.name}: ${fmtInt(t.D)} ${t.d} : ${fmtInt(t.R)} ${t.r} = ${v.fix(t.D / t.R, 2)} : 1`, n: t.D + t.R, O: t.D, p: 0.75, ptrue: 0.75, t }));
          if (table.value === '21') return M21.map((t) => ({ label: `${t.name}: ${t.C} constant : ${t.H} hybrid = 1 : ${v.fix(t.H / t.C, 2)}`, n: t.C + t.H, O: t.C, p: t.seed || !fz ? 1 / 3 : P10, ptrue: t.seed ? 1 / 3 : P10, t }));
          return MDI.map((t) => ({ label: `${t.name}: ${t.O} of 556 (expected ${v.fix(556 * t.e, 2)})`, n: 556, O: t.O, p: t.e, ptrue: t.e, t }));
        };
        const zOf = (o, n, p) => (o - n * p) / Math.sqrt(n * p * (1 - p));
        const chiOf = (R, Os) => {
          if (table.value === 'di') return Os.reduce((s, o, i) => s + (o - 556 * R[i].p) ** 2 / (556 * R[i].p), 0);
          return Os.reduce((s, o, i) => s + zOf(o, R[i].n, R[i].p) ** 2, 0);
        };
        const cache = memo();
        const sims = () => cache([table.value, fisher.value, seed].join('|'), () => {
          const R = rows(), r = v.rng(seed * 101 + table.value.length), reps = [];
          for (let k = 0; k < NREP; k++) {
            const Os = table.value === 'di' ? multinom(r, 556, R.map((x) => x.ptrue)) : R.map((x) => binom(r, x.n, x.ptrue));
            reps.push({ Os, chi: chiOf(R, Os) });
          }
          return reps;
        });
        L.onClick((x, y) => { const k = Math.floor(-y); if (k >= 0 && k < rows().length) sel = k; });
        v.render(() => {
          const R = rows(), nr = R.length, reps = sims(), df = table.value === 'di' ? 3 : nr;
          L.setView([-3.7, 3.7], [-nr - 0.35, 0.75]);
          L.vband(-1, 1, { color: 'faint', alpha: 0.12 });
          [-2, -1, 0, 1, 2].forEach((z) => { L.line(z, -nr - 0.05, z, 0.45, { color: z === 0 ? 'muted' : 'grid', width: z === 0 ? 1.4 : 1, dash: z === 0 ? null : [3, 4] }); L.text(z === 0 ? '0' : (z > 0 ? '+' : '−') + Math.abs(z), z, -nr - 0.2, { align: 'center', size: 10.5, color: 'muted' }); });
          const jit = v.rng(7);
          R.forEach((row, i) => {
            const y = -i - 0.62, active = i === sel;
            if (active) L.rect(-3.68, y - 0.34, 3.68, y + 0.58, { fill: 'accent', fillAlpha: 0.07, stroke: false });
            L.text(`${i + 1}. ${row.label}`, -3.6, y + 0.36, { size: 11, color: active ? 'ink' : 'muted', weight: active ? 600 : 500 });
            for (let k = 0; k < NDOT; k++) { const z = zOf(reps[k].Os[i], row.n, row.p); L.dot(clamp(z, -3.6, 3.6), y + (jit() - 0.5) * 0.26, { r: 2, color: 'muted', alpha: 0.5 }); }
            const z = zOf(row.O, row.n, row.p);
            L.dot(clamp(z, -3.6, 3.6), y, { r: active ? 6.5 : 5, color: 'gold' });
          });
          // χ² panel
          const obs = chiOf(R, R.map((x) => x.O)), chis = reps.map((x) => x.chi), xmax = Math.max(3 * df + 8, M.quantile(chis, 0.97) * 1.1, obs * 1.3);
          const dist = M.dist.chi2(df), ymax = Math.max(dist.pdf(Math.max(df - 2, 0.6)) * 1.35, 0.05);
          C.setView([0, xmax], [0, ymax]);
          C.hist(chis.filter((x) => x < xmax), { bins: M.linspace(0, xmax, 31), density: true, color: 'muted', fillAlpha: 0.25 });
          C.fn((x) => dist.pdf(x), { domain: [0.02, xmax], color: 'accent', width: 2.2, n: 300 });
          C.fn((x) => dist.pdf(x), { domain: [0.02, Math.min(obs, xmax)], fill: 'gold', fillAlpha: 0.35, color: 'gold', width: 0.01, n: 200 });
          C.vline(obs, { color: 'gold', width: 2.4 });
          C.text(`Mendel: ${v.fix(obs, 2)}`, obs, ymax * 0.93, { size: 11.5, color: 'gold', weight: 700, align: obs > xmax * 0.6 ? 'right' : 'left', dx: obs > xmax * 0.6 ? -6 : 6 });
          C.text(`${df} df`, xmax * 0.97, ymax * 0.8, { size: 11, color: 'accent', align: 'right' });
        });
        v.legend([['gold', 'Mendel’s count', { dot: true }], ['muted', 'simulated repeats', { dot: true }], ['accent', '$\\chi^2$ distribution'], ['gold', 'P(fit at least this good)', { area: true }]]);
        v.readout(() => {
          const R = rows(), row = R[Math.min(sel, R.length - 1)], df = table.value === 'di' ? 3 : R.length, reps = sims();
          const obs = chiOf(R, R.map((x) => x.O)), pGood = M.gammaP(df / 2, obs / 2), simGood = reps.filter((x) => x.chi <= obs).length / reps.length;
          const z = zOf(row.O, row.n, row.p);
          let s = `**${row.label}** — expected ${v.fix(row.n * row.p, 1)}, $z = ${v.fix(z, 2)}$ · whole table: $\\chi^2 = ${v.fix(obs, 2)}$ on ${df} df; a fit at least this good has probability ${v.fix(pGood, 3)} (simulated ${v.fix(simGood, 3)})`;
          if (table.value === '31') s += ` · all seven: $14{,}949 : 5{,}010 = 2.98 : 1$`;
          if (table.value === '21') {
            const plants = M21.filter((t) => !t.seed), C0 = plants.reduce((a, t) => a + t.C, 0), N0 = plants.reduce((a, t) => a + t.C + t.H, 0), zz = (C0 - N0 * P10) / Math.sqrt(N0 * P10 * (1 - P10));
            s += ` · plant characters pooled: ${C0} of ${N0} classed constant; Mendel expected ${v.fix(N0 / 3, 1)}, but a hybrid shows no recessive among ten seedlings with probability $(3/4)^{10} = 0.056$, so ${v.fix(N0 * P10, 1)} should be expected ($z = ${v.fix(zz, 2)}$)`;
          }
          if (fisher.value) s += ` · **Fisher 1936**, all of Mendel's experiments: $\\chi^2 = 41.61$ on 84 df, probability of so good a fit $1 - 0.99993 = 0.00007$, about 1 in 14,000`;
          return s;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.18
    {
      num: '1.18',
      kind: 'Paper',
      name: 'Mendelian Proportions in a Mixed Population',
      paper: { authors: 'G. H. Hardy', year: 1908, title: 'Mendelian Proportions in a Mixed Population', venue: 'Science 28 (706): 49–50', doi: '10.1126/science.28.706.49' },
      introduces: ['popgen-1.5'],
      credit: 'G. H. Hardy, letter dated 5 April 1908, published 10 July 1908',
      statement: String.raw`In a letter to *Science* the mathematician G. H. Hardy showed that Mendelian inheritance does not by itself change the proportions of a character in a population. Let the numbers of pure dominants $AA$, heterozygotes $Aa$ and pure recessives $aa$ be as $p : 2q : r$, and suppose the population is large, mates at random, has the sexes evenly distributed over the three types and all equally fertile. Then the next generation is in the proportions
$$p_1 : 2q_1 : r_1 = (p+q)^2 : 2(p+q)(q+r) : (q+r)^2,$$
which satisfy $q_1^2 = p_1r_1$; and a distribution is reproduced unchanged exactly when $q^2 = pr$. So from the second generation on nothing changes: a dominant character has no tendency to spread to $3:1$ and a recessive one none to die out. Hardy's example: pure brachydactylous and normal people mixed $1 : 10{,}000$ give $20{,}001 : 100{,}020{,}001$ brachydactylous in the next generation, practically $2 : 10{,}000$, and so it stays.`,
      idea: String.raw`At a 1908 meeting the statistician Udny Yule had objected that if brachydactyly were a Mendelian dominant, one would expect, "in the course of time", three brachydactylous persons to one normal — confusing the $3:1$ of a cross between hybrids with the state of a whole population. R. C. Punnett, unable to answer, asked his cricket partner Hardy, who replied that "a little mathematics of the multiplication-table type" settles it: offspring proportions depend only on the gamete frequencies $p+q$ and $q+r$, which random mating does not alter. Hardy added that the equilibrium is "stable" only in a weak sense: chance deviations in each generation produce a new, slightly different equilibrium, not a return to the old one — the seed of genetic drift (ch. 2). Wilhelm Weinberg had derived the same law in a lecture in Stuttgart three months earlier (popgen-1.19); after Curt Stern pointed this out in 1943 the result became the Hardy–Weinberg law (popgen-1.5), the null model against which every force of evolution is measured.`,
      caption: String.raw`Left: Hardy's example, generation by generation (log scale). Slide the starting mixture of pure brachydactylous and pure normal people ($1 : 10{,}000$ is Hardy's); the share showing the trait doubles once if it is dominant and then stays flat, far from Yule's $3:1$ (red); if it is recessive it drops once (the few pure recessives mostly marry normal people) and then stays. Right: Hardy's notation as a plane of $p$ (share $AA$) and $r$ (share $aa$), with $2q = 1 - p - r$. Drag the starting population anywhere: one generation of random mating sends it onto the curve $q^2 = pr$ (green, $\sqrt p+\sqrt r = 1$), where it stays. Choose a finite population to see Hardy's last paragraph: each generation lands slightly off and starts a new equilibrium, so the point wanders along the curve.`,
      deps: ['popgen-1.2'],
      see: ['popgen-1.6', 'popgen-1.19'],
      refs: [],
      tags: ['Hardy–Weinberg', 'history'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Hardy%E2%80%93Weinberg_principle' },
      viz(v) {
        const Rs = v.slider('start: 1 brachydactylous to', 1, 1e6, 1e4, { log: true, fmt: (x) => fmtInt(x) + ' normal' });
        const pop = v.select('population on the right', [{ value: 0, label: 'infinite' }, { value: 2000, label: '2,000' }, { value: 200, label: '200' }], 0);
        let seed = 3;
        v.button('New run', () => { seed++; });
        const A = v.stage({ x: [0.6, 7.4], y: [1e-13, 3], ylog: true, axes: 'box', height: 340, weight: 1, minWidth: 280, xticks: [1, 2, 3, 4, 5, 6, 7], xlabel: 'generation (Hardy’s first = 1)', title: 'share of the population showing the trait' });
        const H = v.stage({ x: [-0.08, 1.08], y: [-0.08, 1.08], equal: true, axes: false, height: 340, weight: 1, minWidth: 280, title: 'Hardy’s $p$ ($AA$) and $r$ ($aa$); $2q = 1-p-r$' });
        const h0 = H.handle(0.62, 0.3, { color: 'accent', label: 'start', labelPos: 'e', constrain: (x, y) => { x = clamp(x, 0, 1); y = clamp(y, 0, 1); if (x + y > 1) { const e = (x + y - 1) / 2; x -= e; y -= e; } return [clamp(x, 0, 1), clamp(y, 0, 1)]; } });
        const series = (R) => { // Hardy's recursion from p = 1, q = 0, r = R; returns [dominant share, recessive share] per generation
          let g = [1, 0, R]; const out = [];
          for (let k = 0; k < 7; k++) { const t = g[0] + 2 * g[1] + g[2]; out.push([(g[0] + 2 * g[1]) / t, g[0] / t]); g = hardyStep(...g); }
          return out;
        };
        const cache = memo();
        const path = () => cache([h0.x.toFixed(4), h0.y.toFixed(4), pop.value, seed].join('|'), () => {
          let p = h0.x, r = h0.y, q = (1 - p - r) / 2; const pts = [[p, r]], rng = v.rng(seed * 17 + 1), N = +pop.value;
          for (let k = 0; k < 60; k++) {
            let [p1, q1, r1] = hardyStep(p, q, r);
            if (N) { const c = multinom(rng, N, [p1, 2 * q1, r1]); p1 = c[0] / N; q1 = c[1] / (2 * N); r1 = c[2] / N; }
            p = p1; q = q1; r = r1; pts.push([p, r]);
            if (!N && k > 2) break;
          }
          return pts;
        });
        v.render(() => {
          const R = Rs.value, S = series(R);
          A.hline(0.75, { color: 'red', width: 1.8, dash: [6, 4] });
          A.text('Yule’s expectation: 3 brachydactylous to 1 normal', 7.3, 0.75 * 2.3, { size: 11, color: 'red', align: 'right' });
          A.path(S.map((x, k) => [k + 1, x[0]]), { color: 'accent', width: 2.4 }); A.dots(S.map((x, k) => [k + 1, x[0]]), { r: 4.5, color: 'accent' });
          A.path(S.map((x, k) => [k + 1, x[1]]), { color: 'orange', width: 2.4 }); A.dots(S.map((x, k) => [k + 1, x[1]]), { r: 4.5, color: 'orange' });
          A.text('if dominant', 4, S[3][0] * 2.6, { size: 11.5, color: 'accent', align: 'center' });
          A.text('if recessive', 4, S[3][1] / 4, { size: 11.5, color: 'orange', align: 'center' });
          // Hardy's plane
          H.poly([[0, 0], [1, 0], [0, 1]], { color: 'muted', width: 1.2, fill: 'faint', fillAlpha: 0.06 });
          H.curve((t) => [t * t, (1 - t) * (1 - t)], 0, 1, { color: 'green', width: 2.4 });
          H.text('q² = pr', 0.5, 0.38, { size: 13, color: 'green', math: true, align: 'center' });
          H.text('p (all AA)', 1, -0.045, { size: 11, color: 'blue', align: 'right' }); H.text('r (all aa)', 0.02, 1.03, { size: 11, color: 'orange', align: 'left' });
          H.text('all Aa', 0.02, -0.045, { size: 11, color: 'purple', align: 'left' });
          const P = path();
          if (P.length > 2) H.path(P.slice(1), { color: 'gold', width: 1.2, alpha: 0.7 });
          H.dots(P.slice(1), { r: 2.8, color: 'gold' });
          H.arrow(P[0][0], P[0][1], P[1][0], P[1][1], { color: 'accent', width: 2, head: 8 });
          H.dot(P[1][0], P[1][1], { r: 5.5, color: 'green' });
        });
        v.legend([['accent', 'dominant trait'], ['orange', 'recessive trait'], ['red', 'Yule’s 3 : 1', { dash: true }], ['green', '$q^2 = pr$'], ['gold', 'later generations', { dot: true }]]);
        v.readout(() => {
          const R = Rs.value, Ri = Math.round(R), dom1 = 1 + 2 * Ri, tot1 = (1 + Ri) ** 2;
          const p = h0.x, r = h0.y, q = (1 - p - r) / 2, [p1, q1, r1] = hardyStep(p, q, r), P = path(), last = P[P.length - 1];
          const pa = (x) => Math.sqrt(x[0]) / (Math.sqrt(x[0]) + Math.sqrt(x[1]) || 1);
          let s = `start $1 : ${fmtInt(Ri)}$ → next generation, dominant: $${fmtInt(dom1)} : ${fmtInt(tot1)}$ $\\approx ${v.fix((dom1 / tot1) * 1e4, 3)} : 10{,}000$; recessive: $1 : ${fmtInt(tot1)}$ — and no change afterwards · right: start $q^2 - pr = ${v.fix(q * q - p * r, 4)}$, after one generation $q_1^2 - p_1r_1 = ${v.fix(q1 * q1 - p1 * r1, 4)}$, $A$-allele share $p + q = ${v.fix(p + q, 3)}$`;
          if (+pop.value) s += ` · with ${fmtInt(+pop.value)} individuals the allele share wandered to ${v.fix(last[0] + (1 - last[0] - last[1]) / 2, 3)} in ${P.length - 1} generations, always near the curve`;
          return s;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.19
    {
      num: '1.19',
      kind: 'Paper',
      name: 'Über den Nachweis der Vererbung beim Menschen',
      paper: { authors: 'W. Weinberg', year: 1908, title: 'Über den Nachweis der Vererbung beim Menschen', venue: 'Jahreshefte des Vereins für vaterländische Naturkunde in Württemberg 64: 368–382', url: 'https://www.biodiversitylibrary.org/page/7987521' },
      introduces: ['popgen-1.5'],
      credit: 'Wilhelm Weinberg, lecture in Stuttgart, 13 January 1908',
      statement: String.raw`Weinberg, a Stuttgart physician, asked how Mendelian heredity shows up in human populations, where breeding experiments are impossible and mating is close to random ("Panmixie"). He showed:

(a) if $m$ pure $AA$ and $n$ pure $BB$ individuals of each sex ($m+n=1$) mate at random, the offspring are $m^2\,AA + 2mn\,AB + n^2\,BB$ — the binomial square — and random mating of these reproduces exactly the same composition in every later generation; whereas under the strict inbreeding of Mendel's experiments the hybrids halve in every generation;

(b) under panmixia one can compute how often a trait appears among the **parents, siblings and children** of a person who has it: for a recessive trait, parents and children show it with frequency $m$ and siblings with frequency $(1+m)^2/4$; for a dominant one, parents and children in the ratio $(1+mn) : n^2$ and siblings $4(1+mn)+mn^2 : n^2(3+n)$. Siblings differ from parents only for a Mendelian trait, which gives a statistical test for Mendelian inheritance in man;

(c) applied to his data on twin births, the predisposition to dizygotic twins behaves like a Mendelian trait.`,
      idea: String.raw`Weinberg had used Württemberg family registers to show that twinning runs in families: twin mothers have twins again far more often than other mothers (once in 30 further births, against once in 75 to 90 births overall). To decide whether this follows Mendel's rules he needed expectations for relatives in a randomly mating population, so he derived the equilibrium (a) — three months before Hardy's letter (popgen-1.18), and with the same law (popgen-1.5) — and went further than Hardy in using it: expected frequencies among ancestors and collaterals (b), the observation that rare recessive traits are easier to detect among siblings than among parents, and an estimate of the allele frequency for twinning — predisposed mothers have one dizygotic twin birth in 35, all Stuttgart mothers one in 140, so the predisposed are a quarter of all mothers, $m = \tfrac12$ if the trait is recessive. He counted dizygotic pairs by his difference rule (unlike-sex pairs are dizygotic and make up half of all dizygotic pairs), and in 1912 added the proband method that corrects family data for the way affected families are ascertained. Published in German in a regional natural-history yearbook, the paper was overlooked in the English-speaking world until Curt Stern's 1943 note; Weinberg is now regarded as a founder of human and statistical genetics.`,
      caption: String.raw`Left: Weinberg's comparison. Mix founding stocks — pure $AA$ and pure $BB$ in any proportion, optionally with some hybrids $AB$ — and follow the genotype composition (blue $AA$, purple $AB$, orange $BB$) under **panmixia** (top: binomial proportions after one generation, then no change) and under Mendel's **inbreeding**, each type bred within itself (bottom: the hybrids halve every generation). Right: how often a trait appears among the relatives of someone who has it, under panmixia — bars are Weinberg's formulas, gold dots a simulation of 20,000 random families. For a recessive trait siblings stand far above parents and children; for blending inheritance they would agree. The button sets Weinberg's twinning estimate.`,
      deps: ['popgen-1.2'],
      see: ['popgen-1.18', 'popgen-1.12'],
      refs: [],
      tags: ['Hardy–Weinberg', 'human genetics', 'history'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Wilhelm_Weinberg' },
      viz(v) {
        const M = v.M;
        const mS = v.slider('pure stocks: share that is $AA$', 0.02, 0.98, 0.3, { step: 0.01 });
        const hS = v.slider('hybrids $AB$ in the founding mix', 0, 0.6, 0.2, { step: 0.01 });
        const trait = v.select('trait $A$ is', [{ value: 'rec', label: 'recessive' }, { value: 'dom', label: 'dominant' }], 'rec');
        v.button('Weinberg’s twinning estimate (m = ½, recessive)', () => { hS.set(0); mS.set(0.5); trait.set('rec'); });
        const L = v.stage({ x: [-0.55, 6.6], y: [-0.32, 2.62], axes: false, height: 340, weight: 1.15, minWidth: 300, title: 'genotype composition, generation by generation' });
        const R = v.stage({ x: [0.3, 4.7], y: [0, 1.08], axes: 'box', height: 340, weight: 1, minWidth: 260, xticks: [[1, 'everyone'], [2, 'parents'], [3, 'siblings'], [4, 'children']], title: 'share of the trait among relatives of a bearer' });
        const comp = () => {
          const m = mS.value * (1 - hS.value), h = hS.value, n = 1 - m - h, a = m + h / 2;
          const pan = [[m, h, n]], inb = [[m, h, n]];
          for (let g = 1; g <= 5; g++) { pan.push([a * a, 2 * a * (1 - a), (1 - a) ** 2]); const [P, H, Q] = inb[g - 1]; inb.push([P + H / 4, H / 2, Q + H / 4]); }
          return { pan, inb, a };
        };
        const cache = memo();
        const simFam = () => cache([comp().a.toFixed(4), trait.value].join('|'), () => {
          const a = comp().a, dom = trait.value === 'dom', T = (g) => (dom ? g >= 1 : g === 2), r = v.rng(23);
          const geno = () => (r() < a ? 1 : 0) + (r() < a ? 1 : 0), gam = (g) => (g === 2 ? 1 : g === 0 ? 0 : r() < 0.5 ? 1 : 0);
          let nPar = 0, kPar = 0, nSib = 0, kSib = 0, nKid = 0, kKid = 0, nPop = 0, kPop = 0;
          for (let f = 0; f < 20000; f++) {
            const g1 = geno(), g2 = geno(), c1 = gam(g1) + gam(g2), c2 = gam(g1) + gam(g2);
            nPop += 2; kPop += T(g1) + T(g2);
            for (const [c, o] of [[c1, c2], [c2, c1]]) if (T(c)) {
              nPar += 2; kPar += T(g1) + T(g2); nSib++; kSib += T(o) ? 1 : 0;
              const kid = gam(c) + gam(geno()); nKid++; kKid += T(kid) ? 1 : 0;
            }
          }
          const est = (k, n) => ({ p: n ? k / n : 0, se: n ? Math.sqrt((k / n) * (1 - k / n) / n) : 0 });
          return [est(kPop, nPop), est(kPar, nPar), est(kSib, nSib), est(kKid, nKid)];
        });
        v.render(() => {
          const { pan, inb, a } = comp(), W = 0.62;
          [[pan, 1.42, 'panmixia (Weinberg): random mating'], [inb, 0, 'inbreeding (Mendel’s experiments): each type bred within itself']].forEach(([rows, y0, lab]) => {
            L.text(lab, -0.5, y0 + 1.08, { size: 11.5, color: 'ink', weight: 600 });
            rows.forEach((c, g) => {
              let y = y0;
              c.forEach((x, k) => { if (x > 1e-4) L.rect(g - W / 2, y, g + W / 2, y + x, { fill: GCOL[k], fillAlpha: 0.72, color: GCOL[k], width: 1 }); y += x; });
              if (y0 === 0) L.text(String(g), g, -0.17, { size: 10.5, color: 'muted', align: 'center' });
            });
            if (y0 > 0) { const P = a * a, H = 2 * a * (1 - a); [P, P + H].forEach((yy) => L.line(0.55, y0 + yy, 5.45, y0 + yy, { color: 'ink', width: 1, dash: [3, 3], alpha: 0.6 })); }
          });
          L.text('generation', 6.55, -0.17, { size: 10.5, color: 'muted', align: 'right' });
          // relatives
          const ex = relatives(a, trait.value === 'dom'), vals = [ex.pop, ex.parents, ex.sibs, ex.kids], sim = simFam();
          vals.forEach((x, i) => {
            R.rect(i + 1 - 0.3, 0, i + 1 + 0.3, x, { fill: i === 2 ? 'purple' : 'accent', fillAlpha: 0.35, color: i === 2 ? 'purple' : 'accent', width: 1.4 });
            R.text(v.fix(x, 3), i + 1, x + 0.045, { size: 11, color: 'ink', align: 'center' });
            const s = sim[i]; R.line(i + 1 + 0.15, s.p - 2 * s.se, i + 1 + 0.15, s.p + 2 * s.se, { color: 'gold', width: 2 }); R.dot(i + 1 + 0.15, s.p, { r: 4.5, color: 'gold' });
          });
        });
        v.legend([['blue', '$AA$', { area: true }], ['purple', '$AB$', { area: true }], ['orange', '$BB$', { area: true }], ['accent', 'Weinberg’s formula', { area: true }], ['gold', 'simulated families (±2 s.e.)', { dot: true }]]);
        v.readout(() => {
          const { a, inb } = comp(), m = a, n = 1 - a, ex = relatives(a, trait.value === 'dom');
          const form = trait.value === 'rec'
            ? `recessive: parents and children $m = ${v.fix(m, 3)}$, siblings $(1+m)^2/4 = ${v.fix((1 + m) ** 2 / 4, 3)}$ (enumeration: ${v.fix(ex.parents, 3)}, ${v.fix(ex.sibs, 3)})`
            : `dominant: parents and children $(1+mn) : n^2 = ${v.fix(1 + m * n, 3)} : ${v.fix(n * n, 3)}$, siblings $4(1+mn) + mn^2 : n^2(3+n)$ → ${v.fix((4 * (1 + m * n) + m * n * n) / (4 * (1 + n)), 3)} (enumeration: ${v.fix(ex.parents, 3)}, ${v.fix(ex.sibs, 3)})`;
          return `allele frequency of $A$: $m = ${v.fix(a, 3)}$ → panmixia gives $m^2 : 2mn : n^2 = ${v.fix(m * m, 3)} : ${v.fix(2 * m * n, 3)} : ${v.fix(n * n, 3)}$ from generation 1 on; inbreeding leaves ${v.fix(inb[5][1], 4)} hybrids after 5 generations · ${form} · Weinberg's twins: predisposed mothers have a dizygotic twin birth in 1 of 35, all Stuttgart mothers in 1 of 140, so the predisposed are ¼ of mothers: $m^2 = \\tfrac14$, $m = \\tfrac12$ if recessive; $m : n = 1 : 6.5$ if dominant`;
        });
      },
    },
  ],
};
