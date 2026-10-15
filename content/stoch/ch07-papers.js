// Stochastic Processes — Chapter 7: landmark paper written early as a flagship item (7.12, Metropolis et al. 1953).
//
// Verified against the paper (J. Chem. Phys. 21: 1087–1092): N = 224 rigid discs in a periodic unit square, started on a
// trigonal lattice of 14 per row by 16 rows (d = 1/14); d0 = d(1 − 2^(ν−8)), A/A0 = 1/[0.98974329 (1 − 2^(ν−8))²]
// (eq. 11); moves X → X + αξ with ξ uniform on (−1, 1), α = d − d0, "about half the moves forbidden"; a move is allowed
// unless it makes two discs overlap; PA = NkT(1 + π d0² n̄/2) (eq. 10), n̄ from pair counts in 64 equal-area zones between
// π d0² and K² π d0², extrapolated to contact (Fig. 5: ν = 5, K = 1.5, (PA/NkT) − 1 = 6.43). Table I (ν, A/A0, X1 = this
// calculation, X2 = free volume theory, X3 = four-term virial series):
//   2 1.04269 49.17 47.35 9.77 · 4 1.14957 13.95 13.85 7.55 · 5 1.31966 6.43 6.72 5.35 · 5.5 1.4909 4.41 4.53 4.02 ·
//   6 1.7962 2.929 2.939 2.680 · 6.25 2.04616 2.186 2.323 2.065 · 6.5 2.41751 1.486 1.802 1.514 · 7 4.04145 0.6766 0.990 0.667
// Eq. (14): (PA/NkT) − 1 = 1.813799 x + 2.57269 x² + 3.179 x³ + 3.38 x⁴, x = A0/A. The free-volume column is reproduced
// by PA/NkT = 1/(1 − √(A0/A)). "About three minutes" per cycle on the MANIAC; "There is no indication of a phase
// transition." Today: hard-disc virial coefficients B3…B10 (Clisby & McCoy, J. Stat. Phys. 122, 2006, Table, D = 2):
// B_k/B2^(k−1) = 0.782004, 0.53223180, 0.33355604, 0.1988425, 0.1148728, 0.0649930, 0.0362193, 0.0199537; and two-step
// melting with liquid–hexatic coexistence for 0.700 ≤ η ≤ 0.716 and a hexatic–solid transition at η ≈ 0.720 (Bernard &
// Krauth, PRL 107, 155704, 2011).

const N = 224, DL = 1 / 14, PACK = Math.PI / (2 * Math.sqrt(3)); // η = PACK · A0/A
const TABLE = [[2, 1.04269, 49.17, 47.35, 9.77], [4, 1.14957, 13.95, 13.85, 7.55], [5, 1.31966, 6.43, 6.72, 5.35], [5.5, 1.4909, 4.41, 4.53, 4.02],
  [6, 1.7962, 2.929, 2.939, 2.68], [6.25, 2.04616, 2.186, 2.323, 2.065], [6.5, 2.41751, 1.486, 1.802, 1.514], [7, 4.04145, 0.6766, 0.99, 0.667]];
const BK = [1, 0.782004, 0.5322318, 0.33355604, 0.1988425, 0.1148728, 0.064993, 0.0362193, 0.0199537];
const d0Of = (nu) => DL * (1 - 2 ** (nu - 8));
const aRatio = (nu) => 1 / (0.98974329 * (1 - 2 ** (nu - 8)) ** 2); // A/A0, eq. (11b)
const freeVol = (r) => 1 / (1 - Math.sqrt(1 / r)) - 1;                 // (PA/NkT) − 1 against r = A/A0
const virial53 = (r) => { const x = 1 / r; return 1.813799 * x + 2.57269 * x * x + 3.179 * x ** 3 + 3.38 * x ** 4; };
const virialNow = (r) => { const t = 2 * PACK / r; let s = 0; BK.forEach((b, k) => { s += b * t ** (k + 1); }); return s; };
const C4NOW = BK[3] * (2 * PACK) ** 4; // the x⁴ coefficient today

/** Seeded uniform [0, 1). */
function rng32(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
/** The simulation: lattice start, Metropolis sweeps for hard discs, pair counts in 64 equal-area zones. */
function makeSim(nu, seed) {
  const x = new Float64Array(N), y = new Float64Array(N);
  for (let j = 0, k = 0; j < 16; j++) for (let i = 0; i < 14; i++, k++) { x[k] = (i + 0.5 + (j % 2) * 0.5) / 14; y[k] = (j + 0.5) / 16; }
  const d0 = d0Of(nu), gap = (DL - d0) / d0, kk = Math.min(1.25, Math.max(0.06, 8.75 * gap)); // K² − 1
  return { nu, d0, kk, x, y, R: rng32(seed), sweeps: 0, acc: 0, tried: 0, recentA: 0, recentT: 0, zones: new Float64Array(64), measured: 0, blocks: [], cur: new Float64Array(64), curN: 0, last: -1, lastOk: true, lastTrial: [0, 0] };
}
function sweep(S, alpha) {
  const { x, y, d0, R } = S, d02 = d0 * d0;
  for (let m = 0; m < N; m++) {
    const i = m, nx = x[i] + alpha * (2 * R() - 1), ny = y[i] + alpha * (2 * R() - 1);
    const px = nx - Math.floor(nx), py = ny - Math.floor(ny);
    let ok = true;
    for (let j = 0; j < N; j++) {
      if (j === i) continue;
      let dx = px - x[j], dy = py - y[j]; dx -= Math.round(dx); dy -= Math.round(dy);
      if (dx * dx + dy * dy < d02) { ok = false; break; }
    }
    S.tried++; S.recentT++;
    if (ok) { x[i] = px; y[i] = py; S.acc++; S.recentA++; }
    if (m === 37) { S.last = i; S.lastOk = ok; S.lastTrial = [px, py]; }
  }
  S.sweeps++;
}
function countPairs(S) {
  const { x, y, d0, kk } = S, d02 = d0 * d0, rmax = d02 * (1 + kk), w = (kk * d02) / 64, Z = new Float64Array(64);
  for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
    let dx = x[i] - x[j], dy = y[i] - y[j]; dx -= Math.round(dx); dy -= Math.round(dy);
    const r2 = dx * dx + dy * dy; if (r2 >= rmax || r2 < d02) continue;
    Z[Math.min(63, Math.floor((r2 - d02) / w))]++;
  }
  return Z;
}
/** Extrapolate the first 16 zone counts linearly to contact (zone centres m + ½ → 0), as in the paper's Fig. 5. */
function contact(zones, n) {
  let sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (let m = 0; m < 16; m++) { const u = m + 0.5, v = zones[m] / n; sx += u; sy += v; sxx += u * u; sxy += u * v; }
  const b = (16 * sxy - sx * sy) / (16 * sxx - sx * sx), a = (sy - b * sx) / 16;
  return { a, b };
}
const zFrom = (a, kk) => (64 * a) / ((N - 1) * kk); // (PA/NkT) − 1 from the contact count per configuration

export default {
  collection: 'stoch',
  chapter: 7,
  items: [
    // ------------------------------------------------------------------ 7.12
    {
      num: '7.12',
      kind: 'Paper',
      name: 'Equation of state calculations by fast computing machines',
      paper: { authors: 'Nicholas Metropolis, Arianna W. Rosenbluth, Marshall N. Rosenbluth, Augusta H. Teller and Edward Teller', year: 1953, title: 'Equation of State Calculations by Fast Computing Machines', venue: 'The Journal of Chemical Physics 21 (6): 1087–1092', doi: '10.1063/1.1699114' },
      introduces: ['stoch-7.1', 'thermo-10.8'],
      statement: String.raw`To compute canonical averages $\bar F=\int F\,e^{-E/kT}\,d^{2N}q\big/\int e^{-E/kT}\,d^{2N}q$ for $N$ interacting molecules, the authors proposed sampling configurations **with probability $e^{-E/kT}$ and weighting them evenly**, rather than sampling uniformly and weighting by the Boltzmann factor. Starting anywhere, move one particle at a time by a random displacement in a square of side $2\alpha$; if the energy falls, accept the move; if it rises by $\Delta E$, accept it with probability $e^{-\Delta E/kT}$; otherwise keep the old configuration (and count it again). They argued that this chain of configurations is ergodic and that, in equilibrium, the transitions between any two states balance, so the configurations come to be distributed as $e^{-E/kT}$.

They applied it on the Los Alamos MANIAC to 224 rigid discs in a periodic square, where every allowed move has $\Delta E=0$ and every overlapping move is rejected, and obtained the equation of state $PA/NkT$ from the density of neighbours at contact. Their results agreed with the free-volume theory at high density ($A/A_0<1.8$) and with a virial series at low density ($A/A_0>2.5$), to an accuracy of a few per cent.`,
      idea: String.raw`Plain Monte Carlo integration over configuration space fails at liquid densities: almost every random configuration of hundreds of molecules has overlaps and a negligible Boltzmann weight. The 1953 paper replaced independent samples by a random walk through configurations that spends its time where the weight is, the first **Markov chain Monte Carlo** method (stoch-7.1, the Metropolis algorithm of statistical physics, thermo-10.8). Its correctness rests on the Boltzmann distribution (thermo-6.1) and on what is now called detailed balance (stoch-4.9). Hastings (1970) generalized the acceptance rule to arbitrary proposals, and the method spread from physics to chemistry, Bayesian statistics and machine learning; the hard-disc system itself became a benchmark, whose melting was settled only in 2011 by much larger Monte Carlo runs.`,
      caption: String.raw`Left: the paper's 224 discs in a periodic unit square, started on its 14 × 16 lattice. Each sweep tries one move per disc; a trial that overlaps a neighbour is rejected (one tracked disc shows its trial square of side $2\alpha$ and, in red, its last rejected trial position). Set the density with the paper's parameter $\nu$ (its values 2 to 7 are marked) and the step $\alpha$ (the paper used $d-d_0$, rejecting about half the moves). Bottom: pair counts in 64 equal-area zones beyond contact, extrapolated linearly to contact as in the paper's Fig. 5; that contact value is the pressure. Right: Fig. 4, with Table I, the free-volume and four-term virial curves of 1953, today's ten-term virial series, and your run.`,
      deps: ['stoch-4.9', 'thermo-6.1'],
      refs: [],
      tags: ['Monte Carlo', 'MCMC', 'history'],
      credit: 'Metropolis, Rosenbluth, Rosenbluth, Teller & Teller, 1953',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Equation_of_State_Calculations_by_Fast_Computing_Machines' },
      viz(v) {
        const M = v.M;
        const nuS = v.slider('density parameter $\\nu$', 0, 7, 5, { step: 0.25, onChange: () => fresh() });
        const aS = v.slider('step $\\alpha$ ÷ $(d-d_0)$', 0.1, 6, 1, { log: true, sig: 2 });
        let seed = 1953;
        v.button('New run', () => { seed++; fresh(); });
        const box = v.stage({ x: [-0.03, 1.03], y: [-0.03, 1.03], equal: true, axes: false, height: 340, weight: 0.95, title: '224 discs, periodic unit square' });
        const fig = v.stage({ x: [0.01, 10], y: [0.1, 300], xlog: true, ylog: true, axes: 'box', height: 340, weight: 1.05, xlabel: '(A/A₀) − 1', ylabel: '(PA/NkT) − 1', title: 'Fig. 4: equation of state, log–log' });
        const zs = v.stage({ x: [-1, 64.5], y: [0, 10], axes: 'box', height: 170, full: true, xlabel: 'zone m (equal areas beyond contact)', ylabel: 'pairs', title: 'Fig. 5: pair counts per configuration, extrapolated to contact' });
        let S = null, lastT = 0, t0wall = 0, msPerSweep = 0;
        const EQUIL = 20, BLOCK = 25;
        function fresh() { S = makeSim(nuS.value, seed); lastT = 0; v.restart(); }
        fresh();
        v.legend([['ink', 'Table I (this paper)', { dot: true }], ['orange', 'free volume theory', { dash: true }], ['purple', 'four-term virial series, eq. (14)', { dash: true }], ['green', 'ten-term virial series (2006)'], ['red', 'hexatic and coexistence region (2011)', { area: true }], ['gold', 'your run', { dot: true }]]);
        let st = null;
        v.animate((t) => {
          if (t < lastT - 1e-9) fresh();
          lastT = t;
          const alpha = aS.value * (DL - S.d0), target = Math.floor(t * 40), budget = v.playing ? 30 : 4000, w0 = performance.now();
          let done = 0;
          while (S.sweeps < target && performance.now() - w0 < budget) {
            const s0 = performance.now(); sweep(S, alpha); done++;
            if (S.sweeps > EQUIL) { const Z = countPairs(S); for (let m = 0; m < 64; m++) { S.zones[m] += Z[m]; S.cur[m] += Z[m]; } S.measured++; S.curN++; if (S.curN === BLOCK) { const c = contact(S.cur, S.curN); S.blocks.push(zFrom(c.a, S.kk)); S.cur.fill(0); S.curN = 0; } }
            msPerSweep = 0.9 * msPerSweep + 0.1 * (performance.now() - s0);
          }
          if (S.recentT > 4000) { S.recentA *= 0.5; S.recentT *= 0.5; }
          // ---- the box
          const r0 = S.d0 / 2;
          box.clip(() => { for (let i = 0; i < N; i++) for (const ox of [-1, 0, 1]) for (const oy of [-1, 0, 1]) {
            const cx = S.x[i] + ox, cy = S.y[i] + oy; if (cx < -r0 || cx > 1 + r0 || cy < -r0 || cy > 1 + r0) continue;
            box.circle(cx, cy, r0, { fill: i === S.last ? 'gold' : 'blue', fillAlpha: i === S.last ? 0.8 : 0.32, color: i === S.last ? 'gold' : 'blue', width: 1 });
          } }, [0, 1], [0, 1]);
          box.rect(0, 0, 1, 1, { color: 'ink', width: 1.4 });
          if (S.last >= 0) {
            const i = S.last, a = alpha;
            box.rect(S.x[i] - a, S.y[i] - a, S.x[i] + a, S.y[i] + a, { color: 'orange', width: 1.6, dash: [4, 3] });
            if (!S.lastOk) box.circle(S.lastTrial[0], S.lastTrial[1], r0, { color: 'red', width: 2, dash: [3, 2] });
          }
          // ---- Fig. 4
          const band = [PACK / 0.72 - 1, PACK / 0.70 - 1];
          fig.vband(band[0], band[1], { color: 'red', alpha: 0.13 });
          fig.fn((x) => freeVol(1 + x), { color: 'orange', width: 2, dash: [7, 5], domain: [0.01, 10] });
          fig.fn((x) => virial53(1 + x), { color: 'purple', width: 2, dash: [3, 4], domain: [0.01, 10] });
          fig.fn((x) => virialNow(1 + x), { color: 'green', width: 2.2, domain: [PACK / 0.65 - 1, 10] });
          fig.fn((x) => virialNow(1 + x), { color: 'green', width: 1.4, dash: [2, 4], domain: [0.01, PACK / 0.65 - 1] });
          TABLE.forEach(([nu, r, x1]) => { fig.line(r - 1, x1 * 0.97, r - 1, x1 * 1.03, { color: 'ink', width: 1.4 }); fig.dot(r - 1, x1, { r: 4.5, color: 'ink' }); });
          const rr = aRatio(S.nu);
          let est = NaN, err = NaN;
          if (S.measured > 4) { const c = contact(S.zones, S.measured); est = zFrom(c.a, S.kk); }
          if (S.blocks.length >= 2) { const m = M.mean(S.blocks); err = Math.sqrt(S.blocks.reduce((s, b) => s + (b - m) ** 2, 0) / (S.blocks.length - 1) / S.blocks.length); }
          if (isFinite(est) && est > 0) { if (isFinite(err)) fig.line(rr - 1, Math.max(0.1, est - err), rr - 1, est + err, { color: 'gold', width: 2.4 }); fig.dot(rr - 1, est, { r: 6.5, color: 'gold' }); }
          fig.vline(rr - 1, { color: 'gold', width: 1, dash: [3, 4] });
          // ---- Fig. 5
          if (S.measured > 0) {
            const avg = Array.from(S.zones, (z) => z / S.measured), c = contact(S.zones, S.measured), top = Math.max(c.a, ...avg) * 1.2 + 0.5;
            zs.setView([-1.5, 64.5], [0, top]);
            avg.forEach((h, m) => zs.rect(m + 0.1, 0, m + 0.9, h, { fill: m < 16 ? 'blue' : 'faint', fillAlpha: m < 16 ? 0.55 : 0.5, stroke: false }));
            zs.line(0, c.a, 16, c.a + 16 * c.b, { color: 'gold', width: 2.2 });
            zs.dot(0, c.a, { r: 5.5, color: 'gold' });
            zs.text(`contact: ${c.a.toFixed(2)} pairs → (PA/NkT) − 1 = 64 · ${c.a.toFixed(2)} / (223 · ${S.kk.toFixed(3)}) = ${zFrom(c.a, S.kk).toFixed(2)}`, 17.5, top * 0.86, { size: 12, weight: 600, color: 'gold' });
          } else zs.corner(`equilibrating: first ${EQUIL} sweeps are discarded`, 'tr', { size: 12 });
          st = { rr, est, err, eta: PACK / rr, acc: S.recentT ? S.recentA / S.recentT : NaN, sweeps: S.sweeps, measured: S.measured, nu: S.nu };
        }, { still: 6 });
        v.readout(() => {
          if (!st) return '';
          const { rr, est, err, eta, acc, sweeps, measured, nu } = st;
          const row = TABLE.find((r) => Math.abs(r[0] - nu) < 1e-9);
          const paper = row ? `the paper at $\\nu$ = ${nu}: **${row[2]}** (free volume ${row[3]}, four-term virial ${row[4]})` : `free volume ${freeVol(rr).toFixed(2)}, four-term virial ${virial53(rr).toFixed(2)} (the paper ran $\\nu$ = 2, 4, 5, 5.5, 6, 6.25, 6.5, 7)`;
          const today = eta < 0.66 ? `ten-term virial series today: ${virialNow(rr).toFixed(2)}` : eta < 0.7 ? `dense fluid just below the liquid–hexatic coexistence that begins at $\\eta$ = 0.700` : eta <= 0.72 ? `inside the hexatic / coexistence range 0.700–0.720 found in 2011, where 224 discs cannot settle it` : `solid: the free-volume theory becomes exact as the discs jam`;
          return `$\\nu$ = ${nu}: $A/A_0$ = ${rr.toFixed(4)}, packing fraction $\\eta$ = ${eta.toFixed(3)} · acceptance **${isFinite(acc) ? Math.round(100 * acc) : '—'}%** (paper: about half at $\\alpha = d - d_0$) · ${sweeps} sweeps, ${measured} measured, about ${msPerSweep.toFixed(1)} ms per sweep here against three minutes per cycle on the MANIAC · your $(PA/NkT)-1$ = **${isFinite(est) ? est.toFixed(2) : '…'}**${isFinite(err) ? ` ± ${err.toFixed(2)}` : ''}; ${paper}; ${today} · the 1953 coefficient of $(A_0/A)^4$ was 3.38 (±5%), today ${C4NOW.toFixed(3)}; and where the paper saw "no indication of a phase transition", runs with up to a million discs found two-step melting (Bernard & Krauth 2011)`;
        });
      },
    },
  ],
};
