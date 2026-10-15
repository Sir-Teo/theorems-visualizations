// Mathematical Biology — Chapter 2, landmark papers: May (1976).
//
// Data (verified): May (1976), Nature 261: 459–467, Table 1 (transcription at carretero.sdsu.edu): for
// x → a x(1 − x) the fixed point becomes unstable at a = 3.0000, the "chaotic" region begins at 3.5700 (the
// accumulation of the 2ⁿ cycles), the first odd-period cycle appears at 3.6786, the 3-cycle at 3.8284, and the chaotic
// region ends at 4.0000; for x → x exp[r(1 − x)] (Ricker): 2.0000, 2.6924, 2.8332, 3.1024. Table 3: the period-3
// window's cascade accumulates at 3.8495. Feigenbaum's constant δ = 4.6692… (Feigenbaum 1978) is computed here.

const MAPS = {
  logistic: { name: 'logistic $x \\mapsto ax(1-x)$', f: (a, x) => a * x * (1 - x), df: (a, x) => a * (1 - 2 * x), crit: () => 0.5, R0: 2, range: [2.8, 4], x0: 0.2, ymax: 1,
    zooms: { all: [2.8, 4], cascade: [3.4, 3.6], window: [3.82, 3.86] }, marks: [[3, '3.0000 fixed point unstable'], [3.57, '3.5700 chaos'], [3.6786, '3.6786 odd cycles'], [3.8284, '3.8284 period 3']], a0: 3.5 },
  ricker: { name: 'Ricker $x \\mapsto x\\,e^{r(1-x)}$', f: (a, x) => x * Math.exp(a * (1 - x)), df: (a, x) => Math.exp(a * (1 - x)) * (1 - a * x), crit: (a) => 1 / a, R0: 1, range: [1.6, 4], x0: 0.3, ymax: null,
    zooms: { all: [1.6, 4], cascade: [2.2, 2.75], window: [3.07, 3.22] }, marks: [[2, '2.0000'], [2.6924, '2.6924 chaos'], [2.8332, '2.8332 odd'], [3.1024, '3.1024 period 3']], a0: 2.6 },
};
/** Parameters of the superstable 2ⁿ-cycles (the critical point is periodic), by bracketing and bisection. */
function superstable(m, nMax = 11) {
  const G = (a, n) => { let x = m.crit(a); for (let i = 0; i < 2 ** n; i++) x = m.f(a, x); return x - m.crit(a); };
  const R = [m.R0];
  for (let n = 1; n <= nMax; n++) {
    let lo, hi; if (n === 1) { lo = m.R0 + 0.05; hi = m.R0 + 2; } else { const d = R[n - 1] - R[n - 2]; lo = R[n - 1] + (0.5 * d) / 4.669; hi = R[n - 1] + (1.8 * d) / 4.669; }
    let br = null, prev = G(lo, n);
    for (let i = 1; i <= 400; i++) { const a = lo + ((hi - lo) * i) / 400, g = G(a, n); if (Math.sign(g) !== Math.sign(prev)) { br = [lo + ((hi - lo) * (i - 1)) / 400, a]; break; } prev = g; }
    if (!br) break;
    let [p, q] = br; const sp = Math.sign(G(p, n)); for (let k = 0; k < 70; k++) { const mid = (p + q) / 2; if (Math.sign(G(mid, n)) === sp) p = mid; else q = mid; }
    R.push((p + q) / 2);
  }
  return R;
}
/** Period of the attractor (≤ 64) after a transient, or 0 if none is found. */
function periodOf(m, a) {
  let x = m.crit(a) * 0.9 + 0.01; for (let i = 0; i < 4000; i++) x = m.f(a, x);
  const x0 = x; for (let p = 1; p <= 64; p++) { x = m.f(a, x); if (Math.abs(x - x0) < 1e-7) return p; }
  return 0;
}
function lyapunov(m, a, n = 4000) {
  let x = m.crit(a) * 0.9 + 0.01, s = 0; for (let i = 0; i < 500; i++) x = m.f(a, x);
  for (let i = 0; i < n; i++) { s += Math.log(Math.abs(m.df(a, x)) + 1e-300); x = m.f(a, x); }
  return s / n;
}

export default {
  collection: 'mathbio',
  chapter: 2,
  items: [
    // ───────────────────────────────────────────────────────────── 2.15
    {
      num: '2.15',
      kind: 'Paper',
      name: 'Simple Mathematical Models with Very Complicated Dynamics',
      paper: { authors: 'Robert M. May', year: 1976, title: 'Simple mathematical models with very complicated dynamics', venue: 'Nature 261 (5560): 459–467', doi: '10.1038/261459a0' },
      introduces: [],
      statement: String.raw`May's review showed that the simplest nonlinear difference equations used in population biology, such as the discrete logistic map $x_{t+1} = a x_t(1-x_t)$ (mathbio-2.5) and the Ricker map $x_{t+1} = x_t e^{r(1-x_t)}$ (mathbio-2.10), have an extraordinarily rich spectrum of behaviour as the steepness parameter grows:

(a) a stable equilibrium for $1 < a < 3$; then a **cascade of period doublings**, stable cycles of period $2, 4, 8, \dots, 2^n$, whose parameter values accumulate at $a_c \approx 3.5700$;

(b) beyond $a_c$, **chaos**: infinitely many cycles and uncountably many aperiodic orbits, with narrow windows of stable cycles; the first odd period appears at 3.6786 and the 3-cycle at 3.8284, after which cycles of every period exist (Li and Yorke's "period three implies chaos", mathbio-2.9);

(c) these features are generic for maps with a single hump of tunable steepness, not peculiar to one formula.

May drew the lessons that erratic fluctuations in data need not mean noise or complicated causes, and that such maps should be taught early, because the intuition from linear systems fails. Feigenbaum (1978) then found that successive doublings shrink by a universal factor $\delta = 4.6692\ldots$, the same for every smooth one-humped map.`,
      idea: String.raw`Ecologists had long fitted difference equations to insect and fish populations with non-overlapping generations (Ricker's stock–recruitment model, Moran, Varley), usually studying only the equilibrium and its linear stability, and treated irregular fluctuations as environmental noise. In the early 1970s May, with Oster, Guckenheimer and others, explored what happens after the equilibrium loses stability, and the mathematicians' results of Sharkovskii, Metropolis–Stein–Stein and Li–Yorke gave them a framework. This Nature review gathered the story into a form every scientist could follow, with the logistic map as the central example, the cobweb (graphical) analysis of why the equilibrium becomes unstable when the slope at the fixed point passes −1, the bifurcation tree, and a call to put the equation in elementary courses. It made the logistic map the emblem of chaos and set off the search for chaos in real populations, which has found it in some laboratory systems but rarely in the wild.`,
      caption: String.raw`**Top**: the bifurcation diagram, the long-run values of $x$ for every parameter value (computed for each pixel column), with May's thresholds marked; **click** it to choose the parameter, or use the slider, and **zoom** into the cascade or the period-3 window to see the same tree again. **Middle**: the Lyapunov exponent, positive exactly where the motion is chaotic. **Bottom**: the cobweb for the chosen parameter (drag the starting point) and the time series it generates. Switch to the **Ricker map**: different numbers, the same cascade, and the same Feigenbaum ratio in the readout.`,
      deps: ['mathbio-2.5', 'mathbio-2.9', 'mathbio-2.10'],
      refs: [],
      tags: ['chaos', 'period doubling', 'history'],
      credit: 'Robert M. May, 1976',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Logistic_map' },
      viz(v) {
        const map = v.select('map', [{ value: 'logistic', label: 'logistic' }, { value: 'ricker', label: 'Ricker' }], 'logistic', { onChange: (k) => { aS.set(MAPS[k].a0); x0h.set(MAPS[k].x0, 0); } });
        const zoom = v.select('zoom', [{ value: 'all', label: 'whole range' }, { value: 'cascade', label: 'the cascade' }, { value: 'window', label: 'period-3 window' }], 'all', { onChange: (z) => { const r = MAPS[map.value].zooms[z]; if (aS.value < r[0] || aS.value > r[1]) aS.set((r[0] + r[1]) / 2); } });
        const aS = v.slider('parameter $a$ (or $r$)', 1, 4, 3.5, { step: 0.0001, decimals: 4 });
        const sB = v.stage({ x: [2.8, 4], y: [0, 1], height: 290, axes: 'box', full: true, ylabel: 'x (long run)', title: 'bifurcation diagram' });
        const sL = v.stage({ x: [2.8, 4], y: [-2, 1], height: 120, axes: 'box', full: true, ylabel: 'λ', title: 'Lyapunov exponent' });
        const sC = v.stage({ x: [0, 1], y: [0, 1], height: 280, axes: 'box', equal: true, xlabel: 'xₜ', ylabel: 'xₜ₊₁', title: 'cobweb' });
        const sT = v.stage({ x: [0, 40], y: [0, 1], height: 280, axes: 'box', xlabel: 't', ylabel: 'xₜ', title: 'time series' });
        const x0h = sC.handle(0.2, 0, { color: 'gold', constrain: 'x', label: 'x₀', labelPos: 'n' });
        sB.onClick((x) => aS.set(Math.round(x * 1e4) / 1e4));
        const SS = { logistic: superstable(MAPS.logistic), ricker: superstable(MAPS.ricker) };
        let diag = null, dKey = null, st = null;
        const ymaxOf = (m, r) => (m.ymax ?? Math.max(1.5, m.f(r[1], m.crit(r[1])) * 1.04));
        v.render(() => {
          const m = MAPS[map.value], r = m.zooms[zoom.value], a = Math.min(Math.max(aS.value, r[0]), r[1]), ym = ymaxOf(m, m.zooms.all);
          sB.setView(r, [0, ym]); sL.setView(r, [-1.6, 1]);
          // ---- bifurcation diagram and Lyapunov exponent, one pixel column per parameter value
          const key = `${map.value}|${r}|${sB.width}|${sB.height}`;
          if (key !== dKey) {
            dKey = key; const W = Math.max(50, Math.round(sB.width / 2)), H = Math.max(50, Math.round(sB.height / 2)), grid = new Float32Array(W * H), lam = [];
            for (let i = 0; i < W; i++) {
              const p = r[0] + ((r[1] - r[0]) * (i + 0.5)) / W; let x = m.crit(p) * 0.9 + 0.01, s = 0;
              for (let k = 0; k < 700; k++) x = m.f(p, x);
              for (let k = 0; k < 900; k++) { x = m.f(p, x); s += Math.log(Math.abs(m.df(p, x)) + 1e-300); const j = Math.floor((1 - x / ym) * H); if (j >= 0 && j < H) grid[j * W + i] += 1; }
              lam.push([p, s / 900]);
            }
            diag = { W, H, grid, lam };
          }
          const ink = v.rgb('ink');
          sB.raster((x, y) => { const i = Math.floor(((x - r[0]) / (r[1] - r[0])) * diag.W), j = Math.floor((1 - y / ym) * diag.H); if (i < 0 || i >= diag.W || j < 0 || j >= diag.H) return null; const c = diag.grid[j * diag.W + i]; if (!c) return null; return [ink[0], ink[1], ink[2], Math.min(255, 70 + 40 * Math.log(1 + c))]; }, { res: 2, key: dKey });
          m.marks.forEach(([p, lab], k) => { if (p >= r[0] && p <= r[1]) { sB.vline(p, { color: 'orange', width: 1, dash: [3, 4] }); sB.text(lab, p, ym, { dx: 4, dy: k % 2 ? 26 : 10, size: 10.5, color: 'orange', align: 'left', weight: 600 }); } });
          SS[map.value].forEach((p) => { if (p >= r[0] && p <= r[1]) sB.dot(p, m.crit(p), { r: 2.6, color: 'green' }); });
          sB.vline(a, { color: 'accent', width: 1.6 });
          sL.hline(0, { color: 'muted', width: 1 });
          sL.path(diag.lam.map(([p, l]) => [p, Math.max(l, -1.6)]), { color: 'purple', width: 1.4 });
          sL.vline(a, { color: 'accent', width: 1.6 });
          // ---- cobweb
          const yc = m.ymax ?? Math.max(1.2, m.f(a, m.crit(a)) * 1.08);
          sC.setView([0, yc], [0, yc]);
          sC.fn((x) => x, { color: 'muted', width: 1 });
          sC.fn((x) => m.f(a, x), { domain: [0, yc], color: 'accent', width: 2.2 });
          let x = Math.min(Math.max(x0h.x, 1e-4), yc); const web = [[x, 0]], ts = [[0, x]];
          for (let t = 1; t <= 120; t++) { const y = m.f(a, x); web.push([x, y], [y, y]); x = y; if (t <= 40) ts.push([t, x]); }
          sC.path(web.slice(0, 81), { color: 'gold', width: 1.1, alpha: 0.75 });
          sC.path(web.slice(80), { color: 'red', width: 1.6 });
          // ---- time series
          sT.setView([0, 40], [0, yc]);
          sT.path(ts, { color: 'accent', width: 1.4 }); sT.dots(ts, { r: 2.6, color: 'accent' });
          st = { m, a, per: periodOf(m, a), lam: lyapunov(m, a) };
        });
        v.legend([['ink', 'long-run values (bifurcation tree)', { area: true }], ['green', 'superstable 2ⁿ-cycles', { dot: true }], ['orange', 'May’s Table 1 thresholds', { dash: true }], ['purple', 'Lyapunov exponent'], ['red', 'cobweb after the transient']]);
        v.readout(() => {
          if (!st) return '';
          const { a, per, lam } = st, R = SS[map.value];
          const dl = []; for (let n = 1; n + 1 < R.length; n++) dl.push((R[n] - R[n - 1]) / (R[n + 1] - R[n]));
          const beh = per ? `attracting cycle of period **${per}**` : lam > 0 ? '**chaotic** (no attracting cycle up to period 64)' : 'no cycle found up to period 64';
          const fixed = map.value === 'logistic' ? 'May: fixed point stable to 3.0000, chaos from 3.5700, period 3 at 3.8284' : 'May: fixed point stable to 2.0000, chaos from 2.6924, period 3 at 3.1024';
          return `${map.value === 'logistic' ? '$a$' : '$r$'} = ${v.fix(a, 4)}: ${beh}, Lyapunov exponent λ = ${v.fix(lam, 3)} · superstable cycles of period $2^n$ at ${R.slice(0, 5).map((p) => v.fix(p, 4)).join(', ')}, … → accumulation ${v.fix(R[R.length - 1], 6)} (${fixed}) · Feigenbaum ratios $\\delta_n$: ${dl.slice(0, 2).map((d) => v.fix(d, 3)).join(', ')}, …, **${v.fix(dl[dl.length - 1], 5)}** → δ = 4.66920 (Feigenbaum 1978), the same for both maps`;
        });
      },
    },
  ],
};
