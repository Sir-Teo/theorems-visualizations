// Mathematical Statistics — Chapter 1 (paper): Student 1908, “The probable error of a mean”

// ── Student's data, checked against the Wikisource transcription of Biometrika 6 (1908) 1–25 ──
// Illustration I (Cushny & Peebles 1904): extra hours of sleep for ten patients. Patient 5, drug 1 is −0.1
// (the printed mean 0.75 and difference 0.0 require it; Senn & Richardson, Stat. Med. 13 (1994) 785, Table I).
const SLEEP = {
  d1: [0.7, -1.6, -0.2, -1.2, -0.1, 3.4, 3.7, 0.8, 0.0, 2.0],
  d2: [1.9, 0.8, 1.1, 0.1, -0.1, 4.4, 5.5, 1.6, 4.6, 3.4],
};
// Section VII: P(Z ≤ z) for z = 0.1 … 3.0 and n = 4 … 10 (null where Student printed a dash)
const STAB = {
  4: [.5633, .6241, .6804, .7309, .7749, .8125, .8440, .8701, .8915, .9092, .9236, .9354, .9451, .9531, .9598, .9653, .9699, .9737, .9770, .9797, .9821, .9841, .9858, .9873, .9886, .9898, .9908, .9916, .9924, .9931],
  5: [.5745, .6458, .7096, .7657, .8131, .8518, .8830, .9076, .9269, .9419, .9537, .9628, .9700, .9756, .9800, .9836, .9864, .9886, .9904, .9919, .9931, .9941, .9950, .9957, .9963, .9967, .9972, .9975, .9978, .9981],
  6: [.5841, .6634, .7340, .7939, .8428, .8813, .9109, .9332, .9498, .9622, .9714, .9782, .9832, .9870, .9899, .9920, .9937, .9950, .9959, .9967, .9973, .9978, .9982, .9985, .9987, .9989, .9991, .9992, .9993, .9994],
  7: [.5928, .6798, .7549, .8175, .8667, .9040, .9314, .9512, .9652, .9751, .9821, .9870, .9905, .9930, .9948, .9961, .9970, .9977, .9983, .9986, .9989, .9992, .9993, .9995, .9996, .9996, .9997, .9998, .9998, .9998],
  8: [.6006, .6936, .7733, .8376, .8863, .9218, .9468, .9640, .9756, .9834, .9887, .9922, .9946, .9962, .9973, .9981, .9986, .9990, .9992, .9994, .9996, .9997, .9998, .9998, .9998, .9999, .9999, .9999, .9999, null],
  9: [.60787, .70705, .78961, .85465, .90251, .93600, .95851, .97328, .98279, .98890, .99280, .99528, .99688, .99791, .99859, .99903, .99933, .99953, .99967, .99976, .99983, .99987, .99991, .99993, .99995, .99996, .99997, .99998, .99998, .99999],
  10: [.61462, .71846, .80423, .86970, .91609, .94732, .96747, .98007, .98780, .99252, .99539, .99713, .99819, .99885, .99926, .99951, .99968, .99978, .99985, .99990, .99993, .99995, .99996, .99997, .99998, .99999, .99999, .99999, .99999, null],
};
// Section VI: Student's 750 samples of 4 — his bins and his printed frequencies (calculated / observed)
const ZEDGE = [-Infinity, -3.05, -2.05, -1.55, -1.05, -0.75, -0.45, -0.15, 0.15, 0.45, 0.75, 1.05, 1.55, 2.05, 3.05, Infinity];
const ZCALC = [5, 9.5, 13.5, 34.5, 44.5, 78.5, 119, 141, 119, 78.5, 44.5, 34.5, 13.5, 9.5, 5];
const SCALC = [1.5, 10.5, 27, 45.5, 64.5, 78.5, 87, 88, 81.5, 71, 58, 45, 33, 23, 15, 9.5, 5.5, 7];
const CARD = {
  height: {
    label: 'height', unit: 'in', sd1908: 2.54, chi: { z: [12.44, 0.56], s: [48.06, 0.00006] },
    zObs: [9, 14.5, 11.5, 33, 43.5, 70.5, 119.5, 151.5, 122, 67.5, 49, 26.5, 16, 10, 6],
    sObs: [3, 14.5, 24.5, 37.5, 107, 67, 73, 77, 77.5, 64, 52.5, 49.5, 35, 28, 12.5, 9, 11.5, 7],
    // Macdonell (Biometrika 1, 1902) via R's crimtab: heights 56 … 77 in, one-inch groups
    vals: Array.from({ length: 22 }, (_, i) => 56 + i),
    counts: [1, 1, 6, 23, 48, 90, 175, 317, 393, 462, 458, 413, 264, 177, 97, 46, 17, 7, 4, 0, 0, 1],
  },
  finger: {
    label: 'left middle finger', unit: 'cm', sd1908: 2.74, chi: { z: [7.39, 0.92], s: [21.80, 0.19] },
    zObs: [4, 15.5, 18, 33.5, 44, 75, 122, 138, 120.5, 71, 46.5, 36, 11, 9, 6],
    sObs: [2, 14, 27.5, 51, 64.5, 91, 94.5, 68.5, 65.5, 73, 48.5, 40.5, 42.5, 20, 22.5, 12, 5, 7.5],
    // 9.4 … 13.5 cm in millimetre groups (Student condensed them to 2 mm groups)
    vals: Array.from({ length: 42 }, (_, i) => +(9.4 + i / 10).toFixed(1)),
    counts: [0, 1, 0, 0, 1, 3, 7, 7, 10, 17, 20, 30, 44, 74, 75, 102, 163, 152, 183, 164, 228, 233, 226, 232, 184, 162, 163, 126, 91, 89, 44, 52, 35, 31, 25, 7, 8, 2, 6, 2, 0, 1],
  },
};
const meanOf = (a) => a.reduce((s, x) => s + x, 0) / a.length;
/** Student's standard deviation: divisor n, not n − 1. */
const sdN = (a) => { const m = meanOf(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / a.length); };
/** Linear interpolation in Student's table for sample size n (returns null outside 0.1 … 3.0). */
function studentP(n, z) {
  const T = STAB[n]; if (!T || z < 0.1 || z > 3) return null;
  const i = Math.min(28, Math.floor(z * 10 - 1 + 1e-9)), w = z * 10 - 1 - i, a = T[i], b = T[i + 1] ?? 1;
  return a + (b - a) * w;
}
/** χ² of observed against calculated frequencies, and its upper-tail P on (groups − 1) degrees of freedom (Elderton's convention). */
function chiSq(M, obs, calc) {
  const c = obs.reduce((s, o, i) => s + (o - calc[i]) ** 2 / calc[i], 0);
  return { chi: c, P: M.gammaQ((calc.length - 1) / 2, c / 2) };
}
/** Shuffle the 3000 cards and cut them into 750 samples of four, as Student did; returns z's and s/σ for each sample. */
function drawCards(r, D) {
  const pop = []; D.counts.forEach((c, i) => { for (let k = 0; k < c; k++) pop.push(D.vals[i]); });
  for (let i = pop.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = pop[i]; pop[i] = pop[j]; pop[j] = t; }
  const mu = meanOf(pop), sig = sdN(pop), zs = [], ss = [];
  for (let k = 0; k < 750; k++) {
    const smp = pop.slice(4 * k, 4 * k + 4), m = meanOf(smp), s = sdN(smp);
    zs.push(s > 1e-12 ? (m - mu) / s : (m >= mu ? 6 : -6)); // s = 0 gives an infinite z; Student set those to ±6
    ss.push(s / sig);
  }
  return { zs, ss, mu, sig };
}
const binCounts = (xs, edges) => edges.slice(0, -1).map((a, i) => xs.filter((x) => x >= a && x < edges[i + 1]).length);

export default {
  collection: 'stat',
  chapter: 1,
  items: [
    // ───────────────────────────────────────────────────────────── 1.20
    {
      num: '1.20',
      kind: 'Paper',
      name: 'The probable error of a mean',
      paper: { authors: 'Student', year: 1908, title: 'The Probable Error of a Mean', venue: 'Biometrika 6 (1): 1–25', doi: '10.2307/2331554' },
      introduces: ['stat-1.10', 'stat-6.13'],
      credit: 'W. S. Gosset (“Student”), 1908',
      statement: String.raw`Writing as "Student", the Guinness brewer W. S. Gosset found the sampling law of the mean of a **small** normal sample measured in units of the sample's own standard deviation. Draw $n$ observations from a normal population with mean $\mu$, let $\bar x$ be their mean and $s$ their standard deviation (divisor $n$). Then
$$z=\frac{\bar x-\mu}{s}\quad\text{has density}\quad \propto (1+z^2)^{-n/2},$$
which is today's statement that $t=z\sqrt{n-1}=(\bar x-\mu)/(S/\sqrt n)$ follows **Student's $t$ distribution** with $n-1$ degrees of freedom (stat-1.10). The paper also

(a) derives the moments of $s^2$ and the curve of $s$ (in modern terms $ns^2/\sigma^2\sim\chi^2_{n-1}$, stat-1.8), and shows that $s$ and $\bar x$ are uncorrelated;

(b) tabulates $P(Z\le z)$ for $n=4,\dots,10$ and $z=0.1,\dots,3.0$;

(c) checks the curves on 750 samples of four drawn by hand from W. R. Macdonell's measurements of 3,000 criminals;

(d) applies the table to Cushny and Peebles' sleep trial: ten paired differences with mean $1.58$ hours and $s=1.17$ give $z=1.35$, so "the odds are about 666 to 1 that 2 is the better soporific".

Scope: exact for normal populations; Student argued, and later work confirmed, that it is a good approximation for unimodal, roughly symmetric data, but skewness and heavy tails spoil it for very small $n$.`,
      idea: String.raw`The probable error of a mean, $0.6745\,\sigma/\sqrt n$, was used with $\sigma$ simply replaced by the sample value $s$. That is fine for the large samples of Karl Pearson's biometric laboratory, where Gosset studied in 1906–07, but the brewery's experiments on barley and hops gave two to ten observations, and with so few the uncertainty of $s$ itself makes the usual odds far too optimistic. Gosset computed the first moments of $s^2$, recognised a Pearson type III curve, deduced from it the type VII curve of $z$, and checked both by one of the first recorded Monte Carlo experiments: 3,000 pieces of card shuffled and cut into samples of four. The proof was incomplete (it assumed that $\bar x$ and $s$ are independent, which he showed only to second order); R. A. Fisher supplied a geometric proof in 1915, rescaled $z$ to $t$ with $n-1$ "degrees of freedom" and made it the basis of the $t$-test (stat-6.13) and of small-sample inference in general. A footnote to history: Student copied the drug labels wrongly — his columns are really L-hyoscyamine and L-hyoscine, as I. Greenwald pointed out to Fisher in the 1930s.`,
      caption: String.raw`**Illustration I**: the Cushny–Peebles sleep data as Student printed them. Click a column (drug 1, drug 2, or the difference 2 − 1); the right panel shows the odds against a positive mean on a log scale: Student's table (gold dots, $n=10$), the exact $t_9$ law (green) and the normal curve one would use if $s$ were the true $\sigma$ (orange). **Section VI**: Student's own counts of the 750 values of $z$ and of $s$ from samples of four against his curves; switch to *re-shuffle the cards* to repeat his experiment on Macdonell's table. **Section VII**: pick $n$ and compare every entry of his table with the exact $t$ probabilities.`,
      deps: ['stat-1.3', 'stat-1.8'],
      refs: [],
      tags: ['t distribution', 'history', 'small samples'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Student%27s_t-test', wikisource: 'https://en.wikisource.org/wiki/The_Probable_Error_of_a_Mean' },
      viz(v) {
        const M = v.M;
        let col = 2, seed = 1908;
        const view = v.select('section', [{ value: 'sleep', label: 'I: sleep data' }, { value: 'cards', label: 'VI: 750 samples of 4' }, { value: 'tab', label: 'VII: the table' }], 'sleep');
        const varSel = v.select('measurement', [{ value: 'height', label: 'height' }, { value: 'finger', label: 'finger length' }], 'height');
        const src = v.select('counts', [{ value: 'paper', label: 'Student 1908' }, { value: 'sim', label: 're-shuffle the cards' }], 'paper');
        const shuffle = v.button('Shuffle the 3000 cards again', () => { seed++; });
        const nS = v.slider('sample size $n$', 4, 10, 6, { int: true });
        const L = v.stage({ x: [0.4, 3.6], y: [-2.4, 6.6], axes: 'box', height: 340, weight: 1.05, minWidth: 280 });
        const R = v.stage({ x: [0, 6], y: [1e-6, 1], ylog: true, axes: 'box', height: 340, weight: 1, minWidth: 280 });
        const cache = new Map();
        const sim = (key) => { const k = key + '|' + seed; if (!cache.has(k)) cache.set(k, drawCards(v.rng(seed * 7 + (key === 'finger' ? 3 : 0)), CARD[key])); return cache.get(k); };
        const cols = () => {
          const d = SLEEP.d2.map((x, i) => +(x - SLEEP.d1[i]).toFixed(1));
          return [{ name: '1 (“dextro-”)', data: SLEEP.d1, c: 'orange' }, { name: '2 (“laevo-”)', data: SLEEP.d2, c: 'accent' }, { name: '2 − 1', data: d, c: 'green' }];
        };
        L.onClick((x) => { if (view.value === 'sleep') col = M.clamp(Math.round(x) - 1, 0, 2); });
        let st = {};
        v.render(() => {
          const V = view.value;
          varSel.el.hidden = src.el.hidden = V !== 'cards'; shuffle.hidden = V !== 'cards' || src.value !== 'sim'; nS.el.hidden = V !== 'tab';
          if (V === 'sleep') {
            const C = cols(), n = 10;
            L.setScale({ ylog: false, x: [0.4, 3.6], y: [-2.4, 6.6] }); L.setTitle('extra hours of sleep for ten patients (click a column)');
            L.setTicks([[1, 'drug 1'], [2, 'drug 2'], [3, 'difference']], null); L.setLabels(null, null);
            L.hline(0, { color: 'muted', width: 1 });
            L.vband(col + 0.62, col + 1.38, { color: C[col].c, alpha: 0.08 });
            for (let i = 0; i < n; i++) L.line(1, C[0].data[i], 2, C[1].data[i], { color: 'faint', width: 1.2 });
            C.forEach((cc, j) => {
              const seen = {};
              cc.data.forEach((y) => { const k = y.toFixed(1); const m = seen[k] = (seen[k] || 0) + 1; L.dot(j + 1 + (m - 1) * 0.07, y, { r: 4.5, color: cc.c }); });
              const m = meanOf(cc.data), s = sdN(cc.data);
              L.line(j + 1 - 0.3, m, j + 1 + 0.3, m, { color: cc.c, width: 3 });
              L.line(j + 1 + 0.34, m - s, j + 1 + 0.34, m + s, { color: cc.c, width: 1.6 });
              L.text(`x̄ = ${v.fix(m, 2)}, s = ${v.fix(s, 2)}`, j + 1, 6.2, { align: 'center', size: 11, color: cc.c, weight: 600 });
            });
            // odds panel
            const cc = C[col], z = meanOf(cc.data) / sdN(cc.data), t = z * 3, td = M.dist.studentT(9), N01 = M.dist.normal(0, 1);
            R.setScale({ ylog: true, x: [0, 6], y: [1e-6, 1] }); R.setTitle('P(mean of the population ≤ 0) against $t = z\\sqrt{n-1}$, $n = 10$'); R.setLabels('t', null); R.setTicks(null, null);
            R.fn((x) => 1 - td.cdf(x), { color: 'green', width: 2.4, n: 300 });
            R.fn((x) => 1 - N01.cdf(x), { color: 'orange', width: 2, dash: [6, 4], n: 300 });
            STAB[10].forEach((p, i) => { if (p != null) R.dot(3 * (i + 1) / 10, 1 - p, { r: 3.2, color: 'gold' }); });
            R.vline(t, { color: cc.c, width: 2 });
            R.text(`${cc.name}: t = ${v.fix(t, 2)}`, t, 0.35, { align: t > 3.6 ? 'right' : 'left', dx: t > 3.6 ? -6 : 6, color: cc.c, size: 11.5, weight: 600 });
            st = { V, cc, z, t, pt: td.cdf(t), pn: N01.cdf(t), ps: studentP(10, z) };
            v.legend([['gold', 'Student’s table, $n=10$', { dot: true }], ['green', 'exact $t_9$'], ['orange', 'normal (s taken as σ)', { dash: true }]]);
          } else if (V === 'cards') {
            const D = CARD[varSel.value], paper = src.value === 'paper', S = paper ? null : sim(varSel.value);
            const zc = paper ? D.zObs : binCounts(S.zs, ZEDGE);
            const sEdges = [...M.linspace(0, 1.7, 18), Infinity], sc = paper ? D.sObs : binCounts(S.ss, sEdges);
            L.setScale({ ylog: false, x: [-3.6, 3.6], y: [0, 0.86] }); L.setTitle(`750 values of $z=(\\bar x-\\mu)/s$, samples of 4 (${D.label}; density)`);
            L.setTicks(null, null); L.setLabels('z', null);
            for (let i = 1; i < 14; i++) { const a = ZEDGE[i], b = ZEDGE[i + 1], h = zc[i] / 750 / (b - a); L.rect(a, 0, b, h, { fill: paper ? 'gold' : 'accent', fillAlpha: 0.35, color: paper ? 'gold' : 'accent', width: 1 }); }
            L.text(`${zc[0]} below −3.05`, -3.35, 0.74, { size: 10.5, color: 'muted' }); L.text(`${zc[14]} above 3.05`, 3.5, 0.74, { size: 10.5, color: 'muted', align: 'right' });
            L.fn((z) => (2 / Math.PI) / (1 + z * z) ** 2, { color: 'green', width: 2.4, n: 300 });
            L.fn((z) => M.dist.normal(0, 0.5).pdf(z), { color: 'orange', width: 2, dash: [6, 4], n: 300 });
            R.setScale({ ylog: false, x: [0, 2.05], y: [0, 1.5] }); R.setTitle('750 values of $s/\\sigma$, samples of 4 (density)'); R.setLabels('s / σ', null); R.setTicks(null, null);
            for (let i = 0; i < 17; i++) { const a = sEdges[i], b = sEdges[i + 1]; R.rect(a, 0, b, sc[i] / 750 / 0.1, { fill: paper ? 'gold' : 'accent', fillAlpha: 0.35, color: paper ? 'gold' : 'accent', width: 1 }); }
            R.text(`${sc[17]} above 1.7`, 2.0, 1.42, { size: 10.5, color: 'muted', align: 'right' });
            R.fn((u) => (16 * u * u * Math.exp(-2 * u * u)) / Math.sqrt(2 * Math.PI), { color: 'green', width: 2.4, n: 200, domain: [0, 2.05] });
            const cz = chiSq(M, zc, ZCALC), cs = chiSq(M, sc, SCALC);
            st = { V, D, paper, cz, cs, zc, S };
            v.legend([[paper ? 'gold' : 'accent', paper ? 'Student’s counts, 1908' : 'this shuffle of Macdonell’s cards', { area: true }], ['green', 'Student’s curves (n = 4)'], ['orange', 'normal if s were σ', { dash: true }]]);
          } else {
            const n = nS.value, td = M.dist.studentT(n - 1), sdN3 = 1 / Math.sqrt(n - 3), T = STAB[n];
            L.setScale({ ylog: true, x: [0, 3.1], y: [5e-6, 0.6] }); L.setTitle(`Student’s table, $n=${n}$: $1-P(Z\\le z)$`); L.setTicks(null, null); L.setLabels('z = (x̄ − μ)/s', null);
            L.fn((z) => 1 - td.cdf(z * Math.sqrt(n - 1)), { color: 'green', width: 2.4, n: 300 });
            L.fn((z) => 1 - M.dist.normal(0, sdN3).cdf(z), { color: 'orange', width: 2, dash: [6, 4], n: 300 });
            T.forEach((p, i) => { if (p != null) L.dot((i + 1) / 10, 1 - p, { r: 3.6, color: 'gold' }); });
            const err = T.map((p, i) => (p == null ? null : (p - td.cdf(((i + 1) / 10) * Math.sqrt(n - 1))) * 1e4));
            const half = n >= 9 ? 0.05 : 0.5, emax = Math.max(1, ...err.filter((e) => e != null).map(Math.abs)) * 1.25;
            R.setScale({ ylog: false, x: [0, 3.1], y: [-emax, emax] }); R.setTitle('Student − exact, in units of $10^{-4}$'); R.setLabels('z', null); R.setTicks(null, null);
            R.hband(-half, half, { color: 'green', alpha: 0.12 });
            R.hline(0, { color: 'muted', width: 1 });
            err.forEach((e, i) => { if (e != null) R.rect((i + 1) / 10 - 0.035, 0, (i + 1) / 10 + 0.035, e, { fill: Math.abs(e) > half + 0.01 ? 'red' : 'gold', fillAlpha: 0.6, stroke: false }); });
            R.text(`±${half}: rounding to ${n >= 9 ? 5 : 4} decimals`, 3.05, half, { align: 'right', dy: -9, size: 10.5, color: 'green' });
            st = { V, n, err, half };
            v.legend([['gold', 'Student’s 1908 entries', { dot: true }], ['green', `exact $t_{${n - 1}}$`], ['orange', `normal with Student’s SD $1/\\sqrt{n-3}$`, { dash: true }]]);
          }
        });
        v.readout(() => {
          if (st.V === 'sleep') {
            const { cc, z, t, pt, pn, ps } = st, odds = (p) => (p >= 1 ? '∞' : v.fmt(p / (1 - p), 3));
            const stud = [`0.44 → .8873 (8 : 1)`, `1.23 → .9974 (nearly 400 : 1)`, `1.35 → .9985 (about 666 : 1)`][col];
            return `**${cc.name}**: mean ${v.fix(meanOf(cc.data), 2)} h, $s$ = ${v.fix(sdN(cc.data), 2)} h → $z$ = ${v.fix(z, 3)}, $t = z\\sqrt9$ = ${v.fix(t, 2)} · Student 1908: $z$ = ${stud} · his table, interpolated: ${ps == null ? '—' : v.fix(ps, 4)} · exact $t_9$: ${v.fix(pt, 5)} (odds ${odds(pt)} : 1) · normal curve: ${v.fix(pn, 5)} (odds ${odds(pn)} : 1)${col === 2 ? ' · today’s paired two-sided $t$-test: $p$ = ' + v.fix(2 * (1 - pt), 4) : ''}`;
          }
          if (st.V === 'cards') {
            const { D, paper, cz, cs, S } = st;
            const his = `Student 1908, ${D.label}: $z$ fit $\\chi^2$ = ${D.chi.z[0]}, P = ${D.chi.z[1]}; $s$ fit $\\chi^2$ = ${D.chi.s[0]}, P = ${D.chi.s[1]}`;
            if (paper) return `${his} · recomputed here from his printed counts: $z$: $\\chi^2$ = ${v.fix(cz.chi, 2)}, P = ${v.fix(cz.P, 2)}; $s$: $\\chi^2$ = ${v.fix(cs.chi, 2)}, P = ${v.fmt(cs.P, 2)} · the $z$ curve fits; the $s$ curve fits poorly for height because heights were grouped by whole inches (31 samples had $s$ exactly 1.30 groups)`;
            const sdz = Math.sqrt(meanOf(S.zs.map((z) => z * z)));
            return `this shuffle (seed ${seed}): $z$ fit $\\chi^2$ = ${v.fix(cz.chi, 2)}, P = ${v.fix(cz.P, 2)}; $s$ fit $\\chi^2$ = ${v.fix(cs.chi, 2)}, P = ${v.fmt(cs.P, 2)}; ${S.zs.filter((z) => Math.abs(z) >= 6).length} samples with $s = 0$; SD of $z$ (with $s = 0$ cases set to ±6, as Student did) ${v.fix(sdz, 3)} (Student: 1.039 height, 0.982 finger; theory 1) · ${his}`;
          }
          const { n, err, half } = st, ok = err.filter((e) => e != null), worst = ok.reduce((a, e) => (Math.abs(e) > Math.abs(a) ? e : a), 0), wi = err.indexOf(worst);
          const bad = err.map((e, i) => (e != null && Math.abs(e) > half + 0.01 ? `z = ${v.fix((i + 1) / 10, 1)}` : null)).filter(Boolean);
          return `$n$ = ${n}: Student's ${ok.length} entries against the exact $P(t_{${n - 1}}\\le z\\sqrt{${n - 1}})$ — largest difference ${v.fix(worst, 2)}×10⁻⁴ at $z$ = ${v.fix((wi + 1) / 10, 1)} · ${bad.length ? `outside rounding: ${bad.join(', ')} ${n % 2 ? '; the odd-$n$ columns 5, 7 and 9 are all about 6×10⁻⁴ high at $z$ = 0.2' : ''}` : 'every entry is exact to the printed rounding'} · e.g. $z$ = 1: Student ${v.fix(STAB[n][9], n >= 9 ? 5 : 4)}, exact ${v.fix(M.dist.studentT(n - 1).cdf(Math.sqrt(n - 1)), 5)}`;
        });
      },
    },
  ],
};
