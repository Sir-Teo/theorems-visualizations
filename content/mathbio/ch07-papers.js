// Mathematical Biology — Chapter 7, landmark papers: Kermack & McKendrick (1927).
//
// Data (verified):
// - Weekly plague mortality in Bombay City, 1 October 1905 – 29 September 1906: "Reports on Plague Investigations in
//   India", J. Hygiene 7 (1907) 724–798, Table IX (p. 753), read from the Cambridge Core PDF. Kermack and McKendrick
//   fitted the deaths "in the island of Bombay over the period 17 December 1905 to 21 July 1906", weekly, time in weeks
//   (quoted by Dietz 2009, Izv. NAN Armenii Mat. 44: 39–50), with the curve dz/dt = 890 sech²(0.2t − 3.4); a curve
//   digitised from their figure (Lomen & Lovelock, archive.math.arizona.edu/dsl/bbombay.htm) matches Table IX.
// - Bacaër (2012), J. Math. Biol. 64: 403–422: plague in Bombay was seasonal every year from 1897 to at least 1911.

const PLAGUE = [31, 18, 12, 9, 13, 6, 9, 5, 9, 16, 8, 8, 10, 12, 16, 24, 48, 51, 92, 124, 178, 280, 387, 442, 644, 779, 702, 695, 870, 925, 802, 578, 404, 296, 162, 106, 64, 46, 35, 27, 28, 24, 26, 29, 17, 31, 15, 14, 18, 22, 22, 30];
const K0 = 11; // index of the week 17–23 December 1905 (t = 0 in Kermack and McKendrick's time)
const NW = 31; // weeks fitted (to 21 July 1906)
const km = (t) => 890 / Math.cosh(0.2 * t - 3.4) ** 2;
const kmZ = (t) => (890 / 0.2) * Math.tanh(0.2 * t - 3.4);
const MONTHS = [[-11, 'Oct'], [-6.57, 'Nov'], [-2.29, 'Dec'], [2.14, 'Jan 1906'], [6.57, 'Feb'], [10.57, 'Mar'], [15, 'Apr'], [19.29, 'May'], [23.71, 'Jun'], [28, 'Jul'], [32.43, 'Aug'], [36.86, 'Sep']];

/** SIR from one infective at time ts (weeks), rates per week; returns weekly removals on [0, NW) and a sampled curve. */
function sir(R0, g, N, ts, tEnd = NW + 11) {
  const b = R0 * g, f = (S, I) => [-(b * S * I) / N, (b * S * I) / N - g * I], h = 0.05, NB = NW + 11;
  let S = N - 1, I = 1, t = ts, z = 0, nextW = Math.max(0, Math.ceil(ts));
  const zs = new Array(NB).fill(0), curve = [], orbit = [[S / N, I / N]];
  while (t < Math.max(tEnd, NB)) {
    const k1 = f(S, I), k2 = f(S + (h / 2) * k1[0], I + (h / 2) * k1[1]), k3 = f(S + (h / 2) * k2[0], I + (h / 2) * k2[1]), k4 = f(S + h * k3[0], I + h * k3[1]);
    S += (h / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); I += (h / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
    const z2 = N - S - I; // removed so far (none at the seeding time ts)
    while (nextW < NB && t + h >= nextW) { zs[nextW] = z + ((nextW - t) / h) * (z2 - z); nextW++; }
    z = z2; t += h;
    if (t <= tEnd) { curve.push([t, g * I]); if (curve.length % 4 === 0) orbit.push([S / N, I / N]); }
  }
  const Z = []; for (let w = 0; w < NB - 1; w++) Z.push(zs[w + 1] - zs[w]);
  return { Z, curve, orbit, Send: S / N };
}
function nelder(f, x0, steps = 160) {
  const n = x0.length; let P = [x0, ...x0.map((_, i) => x0.map((v, j) => (i === j ? v + (Math.abs(v) > 1 ? 0.15 * v : 0.5) : v)))], F = P.map(f);
  for (let it = 0; it < steps; it++) {
    const o = [...F.keys()].sort((a, b) => F[a] - F[b]); P = o.map((i) => P[i]); F = o.map((i) => F[i]);
    const c = P[0].map((_, j) => P.slice(0, n).reduce((s, x) => s + x[j], 0) / n), at = (k) => c.map((v, j) => v + k * (P[n][j] - v));
    const xr = at(-1), fr = f(xr);
    if (fr < F[0]) { const xe = at(-2), fe = f(xe); [P[n], F[n]] = fe < fr ? [xe, fe] : [xr, fr]; } else if (fr < F[n - 1]) { P[n] = xr; F[n] = fr; } else { const xc = at(0.5), fc = f(xc); if (fc < F[n]) { P[n] = xc; F[n] = fc; } else for (let i = 1; i <= n; i++) { P[i] = P[i].map((v, j) => P[0][j] + 0.5 * (v - P[0][j])); F[i] = f(P[i]); } }
  }
  const i = F.indexOf(Math.min(...F)); return { x: P[i], f: F[i] };
}

export default {
  collection: 'mathbio',
  chapter: 7,
  items: [
    // ───────────────────────────────────────────────────────────── 7.16
    {
      num: '7.16',
      kind: 'Paper',
      name: 'A Contribution to the Mathematical Theory of Epidemics',
      paper: { authors: 'W. O. Kermack and A. G. McKendrick', year: 1927, title: 'A contribution to the mathematical theory of epidemics', venue: 'Proceedings of the Royal Society of London, Series A 115 (772): 700–721', doi: '10.1098/rspa.1927.0118' },
      introduces: ['mathbio-7.1', 'mathbio-7.3', 'mathbio-7.4', 'ode-6.17'],
      statement: String.raw`Kermack and McKendrick modelled an epidemic in a closed population of susceptibles $x$, infectives $y$ and removed $z$ (dead, isolated or immune), with infectivity and removal allowed to depend on the time since infection. In the special case of constant rates, now called the **SIR model** (mathbio-7.1, ode-6.17),
$$\dot x = -\kappa xy,\qquad \dot y = \kappa xy - \ell y,\qquad \dot z = \ell y ,$$
they proved:

(a) **Threshold theorem** (mathbio-7.3): an epidemic grows only if the population density exceeds a critical value $x > \ell/\kappa$, i.e. $R_0 = \kappa x_0/\ell > 1$; and the epidemic ends, with $y \to 0$, **before** the susceptibles are exhausted.

(b) **Final size** (mathbio-7.4): the fraction $s_\infty$ of susceptibles left satisfies $\ln(1/s_\infty) = R_0(1 - s_\infty)$, which always has a root $0 < s_\infty < 1$.

(c) Expanding the solution to second order gives an explicit epidemic curve $dz/dt = A\,\mathrm{sech}^2(\omega t - \phi)$; for plague deaths in Bombay, 17 December 1905 to 21 July 1906, they fitted $890\,\mathrm{sech}^2(0.2t - 3.4)$ deaths per week, while warning that the constants should not be interpreted.`,
      idea: String.raw`Ross and Hamer had already written mass-action models for malaria and measles (mathbio-7.15), but the question of why epidemics stop was open: do they run out of susceptibles, or does the pathogen lose virulence? Kermack and McKendrick showed that neither is needed: in a deterministic model the infection rate $\kappa x$ falls as susceptibles are used up, and once $x$ drops below the threshold $\ell/\kappa$ each case produces less than one new case, so the epidemic declines while many susceptibles remain. The phase-plane picture (mathbio-3.1) makes it plain: infectives peak exactly when $x$ crosses the threshold. The threshold and final-size relations are the foundation of epidemiology's $R_0$, herd immunity and vaccination targets. Their Bombay fit, in the same paper, became the most reproduced figure in the subject, although plague is spread by rats and fleas, not person to person, and Bacaër (2012) showed that the Bombay epidemics rose and fell with the seasons every year from 1897 to at least 1911.`,
      caption: String.raw`**Top**: weekly plague deaths in Bombay City from October 1905 to September 1906 (bars; the shaded weeks are the period Kermack and McKendrick fitted), their curve $890\,\mathrm{sech}^2(0.2t - 3.4)$ with $t$ in weeks from 17 December 1905, and an SIR model with your **$R_0$** and **infectious period**, whose population and starting week are fitted to the same weeks by least squares. Many pairs fit almost equally well (look at the rms error): the data cannot separate them, as Kermack and McKendrick warned. **Bottom left**: the same model in the phase plane of susceptibles $s$ and infectives $i$; infectives peak where $s$ crosses the threshold $1/R_0$ (dashed). **Bottom right**: the final-size equation, the intersection of $y = s$ with $y = e^{-R_0(1-s)}$. Drop $R_0$ below 1: no epidemic.`,
      deps: ['mathbio-3.1', 'mathbio-7.15'],
      refs: [],
      tags: ['epidemics', 'threshold', 'history'],
      credit: 'W. O. Kermack & A. G. McKendrick, 1927',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Kermack%E2%80%93McKendrick_theory' },
      viz(v) {
        const M = v.M;
        const R0s = v.slider('$R_0$', 0.6, 4, 1.32, { step: 0.01 });
        const Ds = v.slider('infectious period $1/\\ell$ (days)', 2, 20, 5.6, { step: 0.1 });
        const sT = v.stage({ x: [-11.5, 41.5], y: [-95, 1050], height: 300, axes: 'box', full: true, xticks: MONTHS, ylabel: 'plague deaths per week', title: 'Bombay, 1905–06' });
        const sP = v.stage({ x: [0, 1.04], y: [0, 0.2], height: 270, axes: 'box', xlabel: 's = S/N', ylabel: 'i = I/N', title: 'phase plane' });
        const sF = v.stage({ x: [0, 1], y: [-0.08, 1], height: 270, axes: 'box', xlabel: 's', title: 'final size: $s = e^{-R_0(1-s)}$' });
        const win = PLAGUE.slice(K0, K0 + NW), total = M.sum(win);
        const sseOf = (Z) => win.reduce((s, d, i) => s + (d - Z[i]) ** 2, 0);
        const kmZw = win.map((_, i) => kmZ(i + 1) - kmZ(i)), rmsKM = Math.sqrt(sseOf(kmZw) / NW);
        let cacheKey = null, fit = null;
        const fitFor = (R0, D) => {
          const key = `${R0}|${D}`; if (key === cacheKey) return fit;
          cacheKey = key; const g = 7 / D;
          if (R0 <= 1.0005) { fit = { none: true, R0, g }; return fit; }
          // final-size guess for N, then least squares over (ln N, start week)
          let sInf = 0.5; for (let k = 0; k < 60; k++) sInf = Math.exp(-R0 * (1 - sInf));
          const N0 = total / Math.max(1e-3, 1 - sInf);
          const obj = (p) => { const N = Math.exp(p[0]); if (N < 50 || N > 5e7 || p[1] < -60 || p[1] > 20) return 1e15; return sseOf(sir(R0, g, N, p[1]).Z); };
          let best = null;
          for (const ts0 of [-30, -15, -5]) { const r = nelder(obj, [Math.log(N0), ts0], 140); if (!best || r.f < best.f) best = r; }
          const N = Math.exp(best.x[0]), run = sir(R0, g, N, best.x[1], 60);
          fit = { R0, g, N, ts: best.x[1], run, rms: Math.sqrt(best.f / NW) };
          return fit;
        };
        let st = null;
        v.render(() => {
          const R0 = R0s.value, D = Ds.value, F = fitFor(R0, D);
          // ---- top: data, KM curve, SIR
          sT.vband(0, NW, { color: 'orange', alpha: 0.1 });
          PLAGUE.forEach((d, k) => { const t = k - K0; sT.rect(t + 0.08, 0, t + 0.92, d, { fill: k >= K0 && k < K0 + NW ? 'ink' : 'muted', fillAlpha: k >= K0 && k < K0 + NW ? 0.55 : 0.3, stroke: false }); });
          sT.fn(km, { domain: [0, 41], color: 'accent', width: 2.4 });
          if (!F.none) sT.path(F.run.curve.filter((p) => p[0] <= 41.5), { color: 'green', width: 2.4, dash: [7, 4] });
          sT.text('890 sech²(0.2t − 3.4)', 23.2, km(23.2), { dx: 10, dy: -6, color: 'accent', size: 12, weight: 700, align: 'left' });
          sT.text('17 Dec 1905 – 21 Jul 1906', NW / 2, 1010, { color: 'orange', size: 11.5, weight: 600, align: 'center' });
          // ---- phase plane
          const thr = 1 / R0;
          if (thr <= 1.04) { sP.vline(thr, { color: 'red', width: 1.4, dash: [5, 4] }); sP.text('threshold 1/R₀', thr, 0.185, { dx: 6, color: 'red', size: 11.5, weight: 600, align: 'left' }); }
          let iMax = 0.01;
          if (!F.none) {
            const orb = F.run.orbit; iMax = Math.max(...orb.map((p) => p[1]));
            sP.setView([0, 1.04], [-0.13 * Math.max(0.02, iMax * 1.25), Math.max(0.02, iMax * 1.25)]);
            sP.path(orb, { color: 'green', width: 2.4 });
            const pk = orb.reduce((a, p) => (p[1] > a[1] ? p : a), orb[0]); sP.dot(pk[0], pk[1], { r: 5, color: 'gold', label: 'peak', labelPos: 'ne' });
            sP.dot(F.run.Send, 0, { r: 5, color: 'green', label: 's∞', labelPos: 'n' });
            if (thr <= 1.04) sP.text('threshold 1/R₀', thr, Math.max(0.02, iMax * 1.25) * 0.93, { dx: 6, color: 'red', size: 11.5, weight: 600, align: 'left' });
          } else { sP.setView([0, 1.04], [-0.0026, 0.02]); sP.text('R₀ ≤ 1: infectives only decline', 0.5, 0.012, { color: 'red', size: 12.5, weight: 700, align: 'center' }); }
          // ---- final size
          sF.fn((s) => s, { color: 'muted', width: 1.4 });
          sF.fn((s) => Math.exp(-R0 * (1 - s)), { color: 'purple', width: 2.4 });
          let sInf = 1e-9; for (let k = 0; k < 200; k++) sInf = Math.exp(-R0 * (1 - sInf));
          const root = R0 > 1 ? sInf : 1;
          sF.dot(root, root, { r: 5.5, color: 'green' });
          sF.text(R0 > 1 ? `s∞ = ${v.fix(root, 3)}` : 'only root s = 1', root, root, { dx: root > 0.75 ? -12 : 12, dy: 18, align: root > 0.75 ? 'right' : 'left', color: 'green', size: 12, weight: 700 });
          sF.text('y = s', 0.9, 0.9, { dx: 6, dy: 12, color: 'muted', size: 11.5, align: 'left' });
          st = { F, R0, D, root };
        });
        v.legend([['ink', 'weekly deaths (Table IX, J. Hygiene 1907)', { area: true }], ['accent', 'Kermack & McKendrick’s fit'], ['green', 'SIR model (yours), fitted N and start'], ['red', 'threshold', { dash: true }], ['purple', '$e^{-R_0(1-s)}$']]);
        v.readout(() => {
          if (!st) return '';
          const { F, R0, D, root } = st;
          const kmTot = kmZ(NW) - kmZ(0);
          const head = `Kermack & McKendrick's curve: rms error **${v.fix(rmsKM, 0)}** deaths/week over the 31 weeks; total ${Math.round(kmTot)} against ${total} recorded`;
          if (F.none) return `${head} · your $R_0$ = ${v.fix(R0, 2)} ≤ 1: below threshold, each case causes less than one more, no epidemic can be fitted`;
          const simTot = M.sum(F.run.Z.slice(0, NW));
          return `${head} · SIR with $R_0$ = ${v.fix(R0, 2)}, infectious period ${v.fix(D, 1)} days: best $N$ = ${Math.round(F.N).toLocaleString('en-US')} susceptibles, rms **${v.fix(F.rms, 0)}**, ${Math.round(simTot)} deaths in the window · threshold: infectives peak at $s = 1/R_0$ = ${v.fix(1 / R0, 3)}; final size $s_\\infty$ = ${v.fix(root, 3)} (simulation: ${v.fix(F.run.Send, 3)}), so ${v.fix(100 * root, 0)}% of the susceptibles are never infected`;
        });
      },
    },
  ],
};
