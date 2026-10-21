// Population Genetics — Chapter 3, landmark paper: Luria & Delbrück (1943).
//
// Data (verified):
// - Luria & Delbrück (1943), Genetics 28: 491–511. The PMC scan (PMC1209226) was behind a captcha from this
//   environment; Tables 1 and 2 were read from scans of the original tables reproduced by S. M. Carr (Memorial University,
//   mun.ca/biology/scarr/4241smc_Luria_&_Delbruck_Table_1.html and …Table_2.html).
//   Table 1 (samples from one bulk culture): Exp. 10a, 11a, 3, ten samples each. Table 2 (series of similar cultures):
//   Exp. 1, 10, 11, 15 (10-cc cultures) and 16, 17, 21a (0.2-cc cultures, the classic fluctuation test).
//   Fact-check: every count, the printed means/variances, bacteria per culture, sample volumes and mutation rates used below
//   were compared with the scanned Tables 1 and 2 (Carr's images 4241smc_L&D_Table_1/2.jpg) and agree; Exp. 10's printed mean 23.8 is in the scan.
//   Check: the recomputed means reproduce the printed ones (16.7, 51.4, 3.3; 26.8, 62.4 vs 62, 26.2, 11.35, 30.6 vs 30,
//   3.79 vs 3.8) except Exp. 10 (24.0 vs 23.8, so one count there is probably off by 2 and Exp. 10 is not used). The
//   printed variances are "corrected for sampling" and are not reproduced exactly by the counts (e.g. Exp. 16: raw
//   sample variance 752 vs printed 694; Exp. 11a: 38.7 vs 27); without the original scan this is left unresolved, and
//   the viz shows raw sample variances next to the printed values. Exp. 21b is left out (its five values give a mean of
//   44.2, printed 48.2). Bacteria per culture and plated fractions (sample volume / culture volume) from Table 2.
// - Stewart, Gordon & Levin (1990), Genetics 124: 175–185: correction m ≈ m_obs (z − 1)/(z ln z) for plating a fraction
//   z of each culture. Ma, Sandri & Sarkar (1992) recursion for the Luria–Delbrück (Lea–Coulson) distribution.

const EXPS = {
  e16: { name: 'Exp. 16 · 20 cultures of 0.2 cc', counts: [1, 0, 3, 0, 0, 5, 0, 5, 0, 6, 107, 0, 0, 0, 1, 0, 0, 64, 0, 35], kind: 'cultures', N: 5.6e8, z: 0.4, printed: [11.35, 694], rate: '1.1×10⁻⁸' },
  e17: { name: 'Exp. 17 · 12 cultures of 0.2 cc', counts: [1, 0, 0, 7, 0, 303, 0, 0, 3, 48, 1, 4], kind: 'cultures', N: 5e8, z: 0.4, printed: [30, 6620], rate: '3.0×10⁻⁸' },
  e21: { name: 'Exp. 21a · 19 cultures of 0.2 cc', counts: [0, 0, 0, 0, 8, 1, 0, 1, 0, 15, 0, 0, 19, 0, 0, 17, 11, 0, 0], kind: 'cultures', N: 1.1e8, z: 0.25, printed: [3.8, 40.8], rate: '3.3×10⁻⁸' },
  e11: { name: 'Exp. 11 · 10 cultures of 10 cc', counts: [30, 10, 40, 45, 183, 12, 173, 23, 57, 51], kind: 'cultures', N: 4e10, z: 0.005, printed: [62, 3498], rate: '4.1×10⁻⁸' },
  b10: { name: 'Exp. 10a · 10 samples of one culture', counts: [14, 15, 13, 21, 15, 14, 26, 16, 20, 13], kind: 'samples', printed: [16.7, 15] },
  b11: { name: 'Exp. 11a · 10 samples of one culture', counts: [46, 56, 52, 48, 65, 44, 49, 51, 56, 47], kind: 'samples', printed: [51.4, 27] },
};
const BIN_EDGES = [0, 1, 2, 3, 5, 9, 17, 33, 65, 129, 257, 513]; // bins [e_k, e_{k+1})
const BIN_LAB = ['0', '1', '2', '3', '5', '9', '17', '33', '65', '129', '257']; // lower edge of each doubling bin

/** Luria–Delbrück (Lea–Coulson) pmf p_0..p_n for expected number of mutations m (Ma–Sandri–Sarkar recursion). */
function ldPmf(m, n) { const p = [Math.exp(-m)]; for (let k = 1; k <= n; k++) { let s = 0; for (let i = 0; i < k; i++) s += p[i] / (k - i + 1); p.push((m / k) * s); } return p; }
function poisPmf(lam, n) { const p = [Math.exp(-lam)]; for (let k = 1; k <= n; k++) p.push((p[k - 1] * lam) / k); return p; }
function ldML(counts) { // maximum-likelihood m by golden-section search on log m
  const nmax = Math.max(...counts), ll = (lm) => { const p = ldPmf(Math.exp(lm), nmax); return counts.reduce((s, c) => s + Math.log(Math.max(p[c], 1e-300)), 0); };
  let a = Math.log(0.01), b = Math.log(100); const g = 0.618;
  for (let it = 0; it < 60; it++) { const c = b - g * (b - a), d = a + g * (b - a); if (ll(c) > ll(d)) b = d; else a = c; }
  return Math.exp((a + b) / 2);
}
const binOf = (c) => { for (let k = 0; k < BIN_EDGES.length - 1; k++) if (c < BIN_EDGES[k + 1]) return k; return BIN_EDGES.length - 2; };
const binProb = (p, k) => { let s = 0; for (let c = BIN_EDGES[k]; c < BIN_EDGES[k + 1] && c < p.length; c++) s += p[c]; return s; };
const meanVar = (xs) => { const n = xs.length, m = xs.reduce((a, b) => a + b, 0) / n; return [m, xs.reduce((s, x) => s + (x - m) ** 2, 0) / (n - 1)]; };

/** Simulate C cultures growing from N0 to Nt cells with mutation probability a per cell division; plate a fraction z. */
function simulate(r, C, a, N0, Nt, z, mode) {
  const out = [];
  const pois = (lam) => { if (lam > 50) return Math.max(0, Math.round(lam + Math.sqrt(lam) * r.normal())); let L = Math.exp(-lam), k = 0, p = 1; do { k++; p *= r(); } while (p > L); return k - 1; };
  for (let c = 0; c < C; c++) {
    let mut = 0;
    if (mode === 'random') { // mutations during growth, each founds a clone (Yule: geometric with mean Nt/n)
      const K = pois(a * (Nt - N0));
      for (let j = 0; j < K; j++) { const n = N0 + r() * (Nt - N0), p = n / Nt; mut += 1 + Math.floor(Math.log(1 - r()) / Math.log(1 - p)); }
    } else mut = pois(a * (Nt - N0)); // acquired on contact with phage: independent, Poisson
    let kept = 0; if (z >= 1) kept = mut; else if (mut < 200) { for (let j = 0; j < mut; j++) if (r() < z) kept++; } else kept = Math.max(0, Math.round(mut * z + Math.sqrt(mut * z * (1 - z)) * r.normal()));
    out.push(kept);
  }
  return out;
}

export default {
  collection: 'popgen',
  chapter: 3,
  items: [
    {
      num: '3.13',
      kind: 'Paper',
      name: 'Mutations of Bacteria from Virus Sensitivity to Resistance',
      paper: { authors: 'S. E. Luria and M. Delbrück', year: 1943, title: 'Mutations of Bacteria from Virus Sensitivity to Virus Resistance', venue: 'Genetics 28 (6): 491–511', doi: '10.1093/genetics/28.6.491' },
      introduces: [],
      statement: String.raw`When many small, parallel cultures of *E. coli*, each started from a few cells, are plated on phage T1, the numbers of resistant colonies fluctuate enormously: most cultures have none or a few and an occasional "jackpot" has hundreds, so the variance is far larger than the mean. Samples taken from a single culture vary only as a Poisson distribution (variance ≈ mean). This is what one expects if resistance arises by **random mutation during growth**, before any contact with the virus, since an early mutation founds a large clone; if resistance were *induced* by contact with the phage, each cell would respond independently and the counts of parallel cultures would also be Poisson.

The result, the fluctuation test, established that bacteria have genes that mutate spontaneously, and gave a way to estimate mutation rates (their estimates for T1 resistance: $1$–$4\times10^{-8}$; maximum likelihood on the same counts gives a few $\times10^{-9}$ per division). Its scope is selection that kills before any induced change could act; it does not by itself exclude every form of directed change (the later "adaptive mutation" debate).`,
      idea: String.raw`In 1943 many bacteriologists believed that bacteria adapt to a new environment by a directed, Lamarckian response. Luria, watching a slot machine, saw that the two hypotheses predict different *distributions*: under induction every cell has the same small chance of becoming resistant on the plate, so counts are Poisson (mathbio-11.1); under spontaneous mutation (popgen-3.1), resistance that appears in generation $g$ is inherited by its $2^{G-g}$ descendants, so a rare early mutation gives a jackpot. Delbrück worked out the expected mean and variance and showed how to estimate the mutation rate from the proportion of cultures with no mutants (the $p_0$ method) or from the mean. Their tables showed variances 50–200 times the mean for parallel cultures and close to the mean for samples of one culture. The paper earned them (with Hershey) the 1969 Nobel Prize and its distribution, worked out exactly by Lea and Coulson (1949), is still how mutation rates are measured; the Lederbergs' replica plating (1952) gave the direct visual confirmation.`,
      caption: String.raw`**Left**: the paper's own counts of resistant bacteria for one experiment, binned on a doubling scale, against a **Poisson** distribution with the same mean (grey) and the **Luria–Delbrück** distribution fitted by maximum likelihood (green). Pick a fluctuation test (parallel cultures) or Table 1's samples of one culture. **Right**: grow your own parallel cultures from $N_0$ cells to $N_t$ with mutation rate $a$ per division: switch the hypothesis between **random mutation** and **acquired on contact** and watch jackpots appear or vanish; **Resample** reruns. The readouts compare variance with mean and estimate the mutation rate as modern labs do.`,
      deps: ['popgen-3.1', 'mathbio-11.1'],
      refs: [],
      tags: ['mutation', 'fluctuation test', 'history'],
      credit: 'Salvador Luria & Max Delbrück, 1943',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Luria%E2%80%93Delbr%C3%BCck_experiment' },
      viz(v) {
        const M = v.M;
        const exp = v.select('paper data', Object.keys(EXPS).map((k) => ({ value: k, label: k === 'b10' ? '10a (one culture)' : k === 'b11' ? '11a (one culture)' : k.replace('e', 'Exp. ').replace('21', '21a') })), 'e16');
        const hyp = v.select('simulation: resistance arises by', [{ value: 'random', label: 'random mutation in growth' }, { value: 'contact', label: 'contact with phage' }], 'random');
        const la = v.slider('mutation rate a per division (log₁₀)', -9.5, -7, -8.5, { step: 0.05, fmt: (x) => `${v.fix(10 ** (x - Math.floor(x)), 2)}×10${String(Math.floor(x)).replace('-', '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d])}` });
        const C = v.slider('parallel cultures', 10, 400, 100, { int: true });
        let seed = 3;
        v.button('Resample', () => { seed++; });
        const L = v.stage({ x: [-0.6, 10.6], y: [0, 1], axes: 'box', gutter: true, height: 320, weight: 1, minWidth: 260, xticks: BIN_LAB.map((b, i) => [i, b]), xlabel: 'resistant bacteria per culture or sample (bin from)', ylabel: 'fraction', title: 'Luria & Delbrück’s counts' });
        const R = v.stage({ x: [-0.6, 10.6], y: [0, 1], axes: 'box', gutter: true, height: 320, weight: 1, minWidth: 260, xticks: BIN_LAB.map((b, i) => [i, b]), xlabel: 'resistant bacteria per culture (bin from)', ylabel: 'fraction', title: 'simulated parallel cultures' });
        let st = null;
        const draw = (S, counts, fitLD, colObs) => {
          const n = counts.length, obs = Array(BIN_LAB.length).fill(0);
          for (const c of counts) obs[binOf(c)] += 1 / n;
          const [mean, vr] = meanVar(counts), nmax = 512;
          const pp = poisPmf(mean, nmax), m = fitLD ? ldML(counts) : null, pl = m ? ldPmf(m, nmax) : null;
          const ymax = Math.max(0.3, ...obs.map((x) => x * 1.15), ...BIN_LAB.map((_, k) => binProb(pp, k) * 1.1));
          S.setView([-0.6, 10.6], [0, Math.min(1.05, ymax)]);
          obs.forEach((f, k) => { if (f > 0) S.rect(k - 0.36, 0, k + 0.36, f, { fill: colObs, fillAlpha: 0.75, color: colObs }); });
          S.path(BIN_LAB.map((_, k) => [k, binProb(pp, k)]), { color: 'muted', width: 1.8, dash: [5, 4] });
          BIN_LAB.forEach((_, k) => S.dot(k, binProb(pp, k), { r: 3.5, color: 'muted' }));
          if (pl) { S.path(BIN_LAB.map((_, k) => [k, binProb(pl, k)]), { color: 'green', width: 2.2 }); BIN_LAB.forEach((_, k) => S.dot(k, binProb(pl, k), { r: 3.5, color: 'green' })); }
          S.corner(`variance / mean = ${v.fix(vr / Math.max(mean, 1e-9), 1)}`, 'tr', { size: 12.5, weight: 700, color: vr > 3 * mean ? 'red' : 'ink' });
          return { mean, vr, m, p0: counts.filter((c) => c === 0).length / n };
        };
        v.render(() => {
          const E = EXPS[exp.value];
          const A = draw(L, E.counts, E.kind === 'cultures', 'accent');
          const r = v.rng(seed * 101 + 7), N0 = 200, Nt = 2e8, z = 1;
          const sim = simulate(r, Math.round(C.value), 10 ** la.value, N0, Nt, z, hyp.value);
          const B = draw(R, sim, hyp.value === 'random', hyp.value === 'random' ? 'orange' : 'teal');
          st = { E, A, B, a: 10 ** la.value, Nt };
        });
        v.legend([['accent', 'observed (paper)', { area: true }], ['orange', 'simulated', { area: true }], ['muted', 'Poisson with the same mean', { dash: true }], ['green', 'Luria–Delbrück, ML fit']]);
        v.readout(() => {
          if (!st) return '';
          const { E, A, B, a, Nt } = st;
          let left = `${E.name}: mean ${v.fix(A.mean, 2)}, variance ${v.fix(A.vr, 1)} (printed: ${E.printed[0]}, ${E.printed[1]})`;
          if (E.kind === 'cultures') {
            const corr = (E.z - 1) / (E.z * Math.log(E.z));
            const m0 = A.p0 > 0 ? -Math.log(A.p0) : NaN;
            left += ` · ${Math.round(A.p0 * 100)}% of cultures have none (Poisson with this mean predicts $${v.sci(Math.exp(-A.mean), 2)}$) · mutations per culture: $p_0$ method ${Number.isFinite(m0) ? v.fix(m0, 2) : '—'}, ML ${v.fix(A.m, 2)}; corrected for plating ${E.z} of each culture ${v.fix(A.m * corr, 2)} ⇒ **a ≈ $${v.sci((A.m * corr) / E.N, 2)}$** per cell per division (printed in Table 2, from the mean by their formula: ${E.rate})`;
          } else left += ' — samples of one culture: variance ≈ mean, as for Poisson sampling error';
          const right = `simulation (${st.B.mean > 0 ? '' : ''}${Math.round(C.value)} cultures, $N_t = 2\\times10^8$, a = $${v.sci(a, 2)}$): mean ${v.fix(B.mean, 2)}, variance ${v.fix(B.vr, 1)}${B.m ? `, ML m = ${v.fix(B.m, 2)} (true ${v.fix(a * Nt, 2)})` : ''}`;
          return left + '\n' + right;
        });
      },
    },
  ],
};
