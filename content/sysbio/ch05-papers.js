// Systems Biology — Chapter 5, landmark paper: Elowitz & Leibler (2000).
//
// Data and sources:
// - The Nature paper itself (doi:10.1038/35002125) was not reachable from this environment (paywall). The model is the
//   paper's Box 1 as reproduced in the CellML/BioModels encoding (models.cellml.org/e/48, BIOMD0000000012, including a
//   correction communicated by S. Leibler): in units of the mRNA lifetime and of K_M,
//     dm_i/dt = −m_i + α/(1 + p_j^n) + α₀,   dp_i/dt = −β (p_i − m_i),   (i, j) = (lacI, cI), (tetR, lacI), (cI, tetR),
//   with n = 2, mRNA half-life 2 min, protein half-life 10 min (β = 0.2), α = 216, α₀ = 0.216 (α₀/α = 10⁻³).
// - Stability of the symmetric steady state: computed here from the linearisation, with X = α n p^{n−1}/(1 + p^n)² at the
//   fixed point p = α/(1 + p^n) + α₀; the boundary is the curve of the paper's Fig. 1b-type phase diagram (not digitised).
// - Observed (paper, via secondary sources: arXiv:0710.1421 and the abstract): period 160 ± 40 min at 30 °C, about 40% of
//   cells oscillating, cell division 50–70 min, oscillations "slower than the cell-division cycle".
// - Fact-check: parameters match BioModels BIOMD0000000012 (alpha 216.404, alpha0 0.2164, beta 0.2, n 2, half-lives 2 and 10 min); 160 ± 40 min and ~40% are reported in secondary sources (arXiv:0710.1421), not read in the Nature text.
// - The model period with the parameters above is about 125 min (computed here), not a number taken from the paper.

const T_HALF_MRNA = 2; // minutes
const TAU = T_HALF_MRNA / Math.LN2; // time unit (mRNA lifetime) in minutes
function simulate(al, a0, be, n, tEnd, dt) {
  let m = [1, 0, 0], p = [5, 1, 10];
  const out = [];
  const f = (m, p) => [[0, 1, 2].map((i) => -m[i] + al / (1 + p[(i + 2) % 3] ** n) + a0), [0, 1, 2].map((i) => -be * (p[i] - m[i]))];
  for (let t = 0, k = 0; t <= tEnd; t += dt, k++) {
    if (k % 4 === 0) out.push([t, p[0], p[1], p[2]]);
    const [dm1, dp1] = f(m, p), m2 = m.map((x, i) => x + (dt / 2) * dm1[i]), p2 = p.map((x, i) => x + (dt / 2) * dp1[i]);
    const [dm2, dp2] = f(m2, p2);
    m = m.map((x, i) => x + dt * dm2[i]); p = p.map((x, i) => x + dt * dp2[i]);
  }
  return out;
}
function fixedPoint(al, a0, n) { let lo = 0, hi = al + a0 + 1; for (let i = 0; i < 80; i++) { const p = (lo + hi) / 2; if (p - al / (1 + p ** n) - a0 > 0) hi = p; else lo = p; } return (lo + hi) / 2; }
/** Largest real part of the linearisation at the symmetric fixed point: each repressor stage contributes −Xβ/((λ+1)(λ+β)),
 *  so the ring's eigenvalues solve (λ+1)(λ+β) = βX e^{iπ/3} (and its conjugate); unstable (oscillating) iff Re λ > 0. */
function growth(al, a0, be, n) {
  const p = fixedPoint(al, a0, n), X = (al * n * p ** (n - 1)) / (1 + p ** n) ** 2;
  const cr = 0.5, ci = Math.sqrt(3) / 2; // e^{iπ/3}
  const dr = (1 + be) ** 2 - 4 * (be - be * X * cr), di = 4 * be * X * ci; // discriminant
  const mod = Math.hypot(dr, di), sr = Math.sqrt((mod + dr) / 2);
  return (-(1 + be) + sr) / 2;
}
const oscillates = (al, a0, be, n) => growth(al, a0, be, n) > 0;

export default {
  collection: 'sysbio',
  chapter: 5,
  items: [
    {
      num: '5.7',
      kind: 'Paper',
      name: 'Synthetic Oscillatory Network of Transcriptional Regulators',
      paper: { authors: 'Michael B. Elowitz and Stanislas Leibler', year: 2000, title: 'A synthetic oscillatory network of transcriptional regulators', venue: 'Nature 403 (6767): 335–338', doi: '10.1038/35002125' },
      introduces: ['sysbio-5.1', 'sysbio-5.2'],
      statement: String.raw`Three repressors wired in a ring — LacI represses *tetR*, TetR represses *cI*, λ CI represses *lacI* — can make *E. coli* oscillate. In the paper's model, with mRNA $m_i$ and protein $p_i$ in natural units,
$$\dot m_i = -m_i + \frac{\alpha}{1 + p_j^{\,n}} + \alpha_0,\qquad \dot p_i = -\beta\,(p_i - m_i),$$
the symmetric steady state becomes unstable and a limit cycle appears when repression is strong and cooperative (large $\alpha$, Hill coefficient $n \ge 2$) and protein and mRNA lifetimes are comparable ($\beta$ near 1); leaky transcription $\alpha_0$ works against it. Built on a plasmid with a GFP reporter, the **repressilator** made about 40% of cells oscillate with a period of about 160 ± 40 minutes, roughly three times the cell-division time, with large cell-to-cell variability.

Scope: a design principle demonstrated in one synthetic circuit; the oscillations were noisy and lost phase within a few periods (later redesigns, e.g. Potvin-Trottier et al. 2016, made them precise).`,
      idea: String.raw`By the late 1990s molecular biology had catalogued many regulatory interactions, but whether simple network motifs could produce predicted dynamics was untested. Elowitz and Leibler took the opposite route from analysis: design a circuit from a mathematical model, build it from well-characterised parts and see whether it behaves as predicted. Negative feedback with delay (mathbio-6.4) oscillates if the loop gain is high enough; an odd number of repressors in a ring gives net negative feedback, and transcription plus translation supply the delay (sysbio-1.3). The model told them which knobs mattered — strong promoters, cooperative repression, and protein lifetimes shortened with degradation tags to match mRNA lifetimes. Published alongside Gardner, Cantor and Collins's toggle switch, the paper founded synthetic biology (sysbio-5.1) and the idea of a gene circuit as an engineered oscillator (sysbio-5.2).`,
      caption: String.raw`**Left**: the three repressor proteins over 10 hours, from the paper's model (Box 1; default parameters: mRNA half-life 2 min, protein half-life 10 min, $\alpha = 216$, $\alpha_0 = \alpha/1000$, $n = 2$); grey bands mark cell divisions every 60 min. **Right**: the paper's phase diagram, $\beta$ (protein over mRNA decay rate) against maximal transcription $\alpha$: in the shaded region the steady state is unstable and the network oscillates; the gold point is your circuit. Drag $\alpha$, $\beta$, leakiness and the Hill coefficient across the boundary and watch the oscillation die into a steady state; with $n = 1$ there is no oscillating region at all.`,
      deps: ['mathbio-6.4', 'sysbio-1.3'],
      refs: [],
      tags: ['synthetic biology', 'oscillators', 'gene circuits'],
      credit: 'Michael Elowitz & Stanislas Leibler, 2000',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Repressilator' },
      viz(v) {
        const M = v.M;
        const la = v.slider('α, max transcription (log₁₀)', 0, 4, Math.log10(216), { step: 0.01, fmt: (x) => v.fix(10 ** x, x < 1 ? 2 : 0) });
        const lb = v.slider('β = protein / mRNA decay (log₁₀)', -2, 2, Math.log10(0.2), { step: 0.01, fmt: (x) => v.fix(10 ** x, 3) });
        const leak = v.slider('leakiness α₀/α (log₁₀)', -4, -0.5, -3, { step: 0.01, fmt: (x) => (10 ** x).toExponential(1) });
        const nS = v.slider('Hill coefficient n', 1, 4, 2, { step: 0.05 });
        const L = v.stage({ x: [0, 600], y: [0, 120], axes: 'box', gutter: true, height: 330, weight: 1.2, minWidth: 260, xlabel: 'minutes', ylabel: 'protein (units of K_M)', title: 'the repressilator (model, Box 1)' });
        const P = v.stage({ x: [1, 1e4], xlog: true, y: [0.01, 100], ylog: true, axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 250, xlabel: 'α (max transcription)', ylabel: 'β (protein / mRNA decay)', title: 'phase diagram' });
        let st = null, bkey = '', bpts = [];
        v.render(() => {
          const al = 10 ** la.value, be = 10 ** lb.value, a0 = al * 10 ** leak.value, n = nS.value;
          const tEnd = 600 / TAU;
          const out = simulate(al, a0, be, n, tEnd + 200, 0.02).map((r) => [r[0] * TAU - 200 * TAU, r[1], r[2], r[3]]).filter((r) => r[0] >= 0);
          const ymax = Math.max(5, ...out.map((r) => Math.max(r[1], r[2], r[3]))) * 1.1;
          L.setView([0, 600], [0, ymax]);
          for (let t = 60; t < 600; t += 120) L.vband(t, t + 60, { color: 'faint', alpha: 0.12 });
          const col = ['blue', 'green', 'red'], names = ['LacI', 'TetR', 'λ CI'];
          for (let k = 0; k < 3; k++) L.path(out.map((r) => [r[0], r[k + 1]]), { color: col[k], width: 2.2 });
          // period from maxima of LacI
          const mx = []; for (let i = 1; i < out.length - 1; i++) if (out[i][1] > out[i - 1][1] && out[i][1] >= out[i + 1][1] && out[i][1] > 1.05 * Math.min(...out.map((r) => r[1]))) mx.push(out[i][0]);
          const amp = Math.max(...out.slice(out.length >> 1).map((r) => r[1])) - Math.min(...out.slice(out.length >> 1).map((r) => r[1]));
          const per = mx.length > 2 && amp > 0.5 ? (mx[mx.length - 1] - mx[0]) / (mx.length - 1) : NaN;
          // phase diagram: shade the oscillatory region (n and leakiness as set)
          const key = `${n}|${leak.value}`;
          P.raster((x, y) => (oscillates(x, x * 10 ** leak.value, y, n) ? [...v.rgb('green').slice(0, 3), 60] : null), { res: 3, key });
          const nn = Math.abs(n - 2) > 0.01 ? 2 : 3;
          if (bkey !== key) { bkey = key; bpts = []; for (let i = 0; i <= 80; i++) { const y = 10 ** (-2 + (4 * i) / 80); let prev = null; for (let j = 0; j <= 240; j++) { const x = 10 ** ((4 * j) / 240), gg = growth(x, x * 10 ** leak.value, y, nn) > 0; if (prev !== null && gg !== prev) bpts.push([x, y]); prev = gg; } } }
          P.dots(bpts, { r: 1.6, color: 'ink' });
          P.dot(al, be, { r: 7, color: 'gold' });
          P.setTitle(`phase diagram — shaded: oscillates (n = ${v.fix(n, 2)}), dotted: n = ${Math.abs(n - 2) > 0.01 ? 2 : 3}`);
          st = { per, amp, osc: oscillates(al, a0, be, n), al, be, n };
        });
        v.legend([['blue', 'LacI'], ['green', 'TetR'], ['red', 'λ CI'], ['faint', 'cell divisions (every ~60 min)', { area: true }], ['gold', 'your circuit', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { per, amp, osc, be } = st;
          const phalf = T_HALF_MRNA / be;
          return `protein half-life ${v.fix(phalf, 1)} min (mRNA 2 min) · linear stability: **${osc ? 'unstable steady state → oscillation' : 'stable steady state'}**${Number.isFinite(per) ? ` · period **${Math.round(per)} min**, amplitude ${v.fix(amp, 1)} K_M` : ' · no sustained oscillation'} — paper: 160 ± 40 min observed, about 3 cell divisions of 50–70 min, so the state must be passed from mother to daughter cells.`;
        });
      },
    },
  ],
};
