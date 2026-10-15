// Ordinary Differential Equations — Chapter 10, landmark papers: Lorenz (1963).
//
// Data (verified from the scanned paper, J. Atmos. Sci. 20: 130–141): σ = 10, b = 8/3, r = 28 (critical value
// r_c = 470/19 = 24.74), initial state (0, 1, 0), the "double-approximation" scheme (Heun's method) with Δτ = 0.01 on a
// Royal McBee LGP-30, values printed ×10 and truncated; Table 2 (the 83 relative maxima of Z in the first 6000
// iterations, printed units) is transcribed below; Fig. 4 plots each maximum against the next.
// The rounding story (a 1961 restart of a twelve-variable model from values printed to three decimals) is Lorenz's own
// later account, The Essence of Chaos (1993).
// Largest Lyapunov exponent of the system at these parameters ≈ 0.906 (Sprott, Chaos and Time-Series Analysis, 2003).

// Table 2: [iteration N, Z maximum ×10]
const TABLE2 = [[45, 483], [107, 287], [168, 288], [230, 289], [292, 290], [354, 292], [416, 293], [478, 295], [540, 296], [602, 298], [664, 300], [726, 302], [789, 304], [851, 307], [914, 309], [977, 312], [1040, 315], [1103, 319], [1167, 323], [1231, 328], [1295, 333], [1361, 339], [1427, 347], [1495, 357], [1566, 371], [1643, 396], [1722, 401], [1798, 391], [1882, 413], [1952, 370], [2029, 393], [2110, 408], [2183, 379], [2268, 415], [2337, 368], [2412, 389], [2501, 423], [2569, 357], [2639, 371], [2717, 395], [2796, 402], [2871, 388], [2962, 426],
  [3029, 352], [3098, 365], [3171, 383], [3268, 435], [3333, 342], [3400, 350], [3468, 361], [3541, 378], [3625, 413], [3695, 370], [3772, 394], [3853, 407], [3926, 380], [4014, 421], [4082, 359], [4153, 375], [4233, 404], [4307, 385], [4417, 450], [4480, 324], [4544, 329], [4609, 334], [4675, 341], [4741, 349], [4810, 360], [4881, 376], [4963, 406], [5035, 381], [5124, 422], [5192, 358], [5262, 372], [5340, 397], [5419, 399], [5495, 394], [5576, 405], [5649, 384], [5752, 443], [5816, 332], [5881, 339], [5948, 346]];
const DT = 0.01, B = 8 / 3, SIG = 10;
/** Lorenz's double-approximation step (Heun): X₁ = X₀ + F(X₀)Δτ, X₂ = X₁ + F(X₁)Δτ, X(τ+Δτ) = ½(X₀ + X₂). */
function heun(p, r) {
  const F = (q) => [SIG * (q[1] - q[0]), r * q[0] - q[1] - q[0] * q[2], q[0] * q[1] - B * q[2]];
  const f0 = F(p), p1 = [p[0] + DT * f0[0], p[1] + DT * f0[1], p[2] + DT * f0[2]], f1 = F(p1);
  return [0.5 * (p[0] + p1[0] + DT * f1[0]), 0.5 * (p[1] + p1[1] + DT * f1[1]), 0.5 * (p[2] + p1[2] + DT * f1[2])];
}
const roundTo = (x, d) => Math.round(x * 10 ** d) / 10 ** d;

export default {
  collection: 'ode',
  chapter: 10,
  items: [
    // ───────────────────────────────────────────────────────────── 10.15
    {
      num: '10.15',
      kind: 'Paper',
      name: 'Deterministic nonperiodic flow',
      paper: { authors: 'Edward N. Lorenz', year: 1963, title: 'Deterministic Nonperiodic Flow', venue: 'Journal of the Atmospheric Sciences 20 (2): 130–141', doi: '10.1175/1520-0469(1963)020<0130:DNF>2.0.CO;2' },
      introduces: ['ode-10.3', 'ode-10.6', 'ode-10.7', 'ode-10.9', 'geo-10.1', 'geo-10.2', 'fluid-10.11'],
      statement: String.raw`Lorenz truncated Saltzman's equations for convection in a layer heated from below to three modes, the **Lorenz equations** (ode-10.3, geo-10.1, fluid-10.11),
$$\dot X = -\sigma X + \sigma Y,\qquad \dot Y = -XZ + rX - Y,\qquad \dot Z = XY - bZ ,$$
and integrated them numerically with $\sigma = 10$, $b = 8/3$ and $r = 28$, just above the value $r_c = 470/19 \approx 24.74$ at which steady convection becomes unstable. He showed:

(a) The flow contracts volumes (divergence $-(\sigma + b + 1) < 0$, Liouville, ode-5.17), so all trajectories end on a bounded set of zero volume, which nonetheless is not a point or a closed curve: the solutions are **nonperiodic**, swinging irregularly between two spirals around the unstable steady states (the strange attractor, ode-10.6). Such behaviour needs at least three dimensions (ode-7.11).

(b) Plotting each maximum $M_n$ of $Z$ against the next, $M_{n+1}$, gives points on a single tent-shaped curve with slope everywhere steeper than 1 (the **Lorenz map**, ode-10.9), from which it follows that all periodic solutions are unstable and nonperiodic ones dominate.

(c) Nonperiodic solutions are unstable to small changes: nearby states end up far apart (**sensitive dependence**, ode-10.7, geo-10.2), so if the atmosphere behaves like this, prediction far enough ahead is impossible.`,
      idea: String.raw`In the 1950s statistical weather forecasting assumed that the atmosphere, if not periodic, was at least predictable given good enough data and models. Lorenz, a meteorologist at MIT with an early computer, looked for the simplest deterministic system whose solutions never repeat. His later account (*The Essence of Chaos*, 1993) is that in 1961, restarting a run of a twelve-variable weather model from numbers printed to three decimals, he saw the new solution drift away from the old one until they bore no resemblance; the 1963 paper turns that observation into theorems about a three-variable system, with the evidence from a few thousand computed steps. Its phase-space pictures, the return map that reduces the flow to a one-dimensional map, and the conclusion about predictability founded chaos theory; for a decade the paper was barely cited outside meteorology, then became one of the most cited in all of science.`,
      caption: String.raw`**Top**: the solution from Lorenz's initial state $(0, 1, 0)$ with his own scheme (Heun's method, $\Delta\tau = 0.01$), drawn in phase space as it unfolds (drag to rotate; ▶/⏸). At iteration 1000 a second run (orange) restarts from the state **rounded** to the number of decimals you choose, as a printout would have it. **Bottom left**: the distance between the two runs on a log scale, growing exponentially (dashed: the Lyapunov rate measured on a long run) until it is as large as the attractor. **Bottom right**: Lorenz's Fig. 4, each maximum of $Z$ against the next, from his printed Table 2 (black, the paper's own numbers ×10) and from a long run here (faint). Lower $r$ below $r_c = 24.74$ and the motion settles on a steady state of convection.`,
      deps: ['ode-5.17', 'ode-7.11', 'ode-8.13'],
      refs: [],
      tags: ['chaos', 'strange attractor', 'history'],
      credit: 'Edward N. Lorenz, 1963',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Lorenz_system' },
      viz(v) {
        const M = v.M;
        const rS = v.slider('$r$ (Rayleigh number ratio)', 15, 32, 28, { step: 0.1 });
        const dS = v.slider('decimals kept at the restart', 1, 8, 3, { int: true });
        const s3 = v.stage3d({ range: 1.35, height: 360, yaw: -0.5, pitch: 0.18, labels: ['X', 'Y', 'Z'], full: true, title: 'phase space (X, Y, Z)' });
        const sE = v.stage({ x: [0, 50], y: [1e-9, 300], ylog: true, axes: 'box', height: 260, xlabel: 'τ after the restart', ylabel: 'distance', title: 'distance between the two runs' });
        const sM = v.stage({ x: [275, 500], y: [275, 500], axes: 'box', height: 260, xlabel: 'Mₙ (×10)', ylabel: 'Mₙ₊₁', title: 'Lorenz map (his Fig. 4)' });
        const NI = 6000, RESTART = 1000, P3 = (p) => [p[0] / 22, p[1] / 22, (p[2] - 25) / 22];
        let key = null, A = null, Bt = null, lmap = null, mine = null, lyap = NaN;
        const compute = () => {
          const r = rS.value, d = dS.value, k = `${r}|${d}`; if (k === key) return; key = k;
          A = [[0, 1, 0]]; for (let i = 1; i <= NI; i++) A.push(heun(A[i - 1], r));
          Bt = []; let q = A[RESTART].map((x) => roundTo(x, d)); Bt.push(q); for (let i = RESTART + 1; i <= NI; i++) { q = heun(q, r); Bt.push(q); }
          // maxima of Z in the first 6000 iterations (printed units, truncated as on the LGP-30 output)
          mine = []; for (let i = 1; i < NI; i++) if (A[i][2] > A[i - 1][2] && A[i][2] > A[i + 1][2]) mine.push([i, Math.trunc(A[i][2] * 10)]);
          // a long run for the faint map
          // a long run on the attractor: the faint map and the largest Lyapunov exponent (Benettin: a companion 10⁻⁸ away, renormalised every step)
          lmap = []; let p = A[NI], z0 = 0, z1 = 0, last = null, e = [p[0] + 1e-8, p[1], p[2]], sl = 0;
          const NL = 60000;
          for (let i = 0; i < NL; i++) {
            p = heun(p, r); e = heun(e, r);
            const dd = Math.hypot(e[0] - p[0], e[1] - p[1], e[2] - p[2]) || 1e-300; sl += Math.log(dd / 1e-8); e = p.map((x, j) => x + ((e[j] - x) * 1e-8) / dd);
            if (z1 > z0 && z1 > p[2]) { if (last != null) lmap.push([last, 10 * z1]); last = 10 * z1; } z0 = z1; z1 = p[2];
          }
          lyap = sl / (NL * DT);
        };
        let st = null;
        v.animate((t) => {
          compute();
          const n = Math.min(NI, Math.floor(80 + t * 220));
          // ---- phase space
          const ptsA = []; for (let i = 0; i <= n; i += 2) ptsA.push(P3(A[i]));
          s3.path(ptsA, { color: 'accent', width: 1.1 });
          if (n > RESTART) { const ptsB = []; for (let i = RESTART; i <= n; i += 2) ptsB.push(P3(Bt[i - RESTART])); s3.path(ptsB, { color: 'orange', width: 1.3 }); s3.dot(P3(Bt[n - RESTART]), { r: 5, color: 'orange' }); }
          s3.dot(P3(A[n]), { r: 5, color: 'accent' });
          const r = rS.value; if (r > 1) { const c = Math.sqrt(B * (r - 1)); for (const sg of [1, -1]) s3.dot(P3([sg * c, sg * c, r - 1]), { r: 3.5, color: 'red', label: sg > 0 ? 'C' : 'C′' }); }
          // ---- separation
          const sep = []; for (let i = RESTART; i <= NI; i++) { const a = A[i], b = Bt[i - RESTART], dd = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); sep.push([(i - RESTART) * DT, Math.max(dd, 1e-12)]); }
          sE.path(sep, { color: 'orange', width: 1.6 });
          const tau = (n - RESTART) * DT; if (tau > 0) sE.vline(tau, { color: 'muted', width: 1, dash: [3, 3] });
          // largest Lyapunov exponent along the whole run (Benettin: a tiny companion, renormalised every step)
          const d0 = sep[0][1] || 1e-12, lam = lyap;
          if (isFinite(lam) && lam > 0.05) sE.fn((x) => d0 * Math.exp(lam * x), { domain: [0, Math.log(30 / d0) / lam], color: 'ink', width: 1.4, dash: [6, 4] });
          // ---- Lorenz map
          sM.fn((x) => x, { color: 'faint', width: 1 });
          sM.dots(lmap, { r: 1.3, color: 'accent', alpha: 0.55 });
          for (let i = 0; i + 1 < TABLE2.length; i++) sM.dot(TABLE2[i][1], TABLE2[i + 1][1], { r: 3, color: 'ink' });
          sM.dot(385, 483, { r: 3.4, color: 'ink', hollow: true }); sM.text('(385, 483): Lorenz’s start', 385, 483, { dx: 8, size: 10.5, color: 'muted', align: 'left' });
          // agreement with Table 2
          let exact = 0; while (exact < Math.min(mine.length, TABLE2.length) && Math.abs(mine[exact][0] - TABLE2[exact][0]) <= 1 && mine[exact][1] === TABLE2[exact][1]) exact++;
          st = { n, lam, exact, r, d: dS.value, d0, sepEnd: sep[sep.length - 1][1] };
        }, { period: 30, still: 14 });
        v.legend([['accent', 'Lorenz’s run from (0, 1, 0)'], ['orange', 'restart from the rounded state'], ['ink', 'Table 2 maxima (Fig. 4)', { dot: true }], ['red', 'steady convection C, C′', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { n, lam, exact, r, d, d0 } = st;
          const chaos = r > 24.74;
          const growth = lam > 0.05 ? `nearby states separate like $e^{\\lambda\\tau}$, $\\lambda$ = **${v.fix(lam, 2)}** measured on a run of 60,000 steps (dashed; the accepted value at $r$ = 28 is about 0.91), so each factor of 10 in initial accuracy buys only ${v.fix(Math.LN10 / lam, 1)} time units` : 'nearby states do not separate: the runs converge together';
          const tab = r === 28 ? ` · recomputed with his scheme, the first **${exact}** maxima match his Table 2 to the printed digit (to N = ${TABLE2[Math.max(0, exact - 1)][0]}); later ones drift, because his LGP-30 rounded differently: sensitive dependence inside his own table` : '';
          return `iteration ${n} of 6000 · restart rounded to ${d} decimals: initial error $${v.sci(d0, 2)}$ · ${growth}${tab} · $r$ = ${v.fix(r, 1)} ${chaos ? `> $r_c$ = 24.74: nonperiodic` : `< $r_c$ = 24.74: steady convection is stable and runs usually settle at C or C′`}`;
        });
      },
    },
  ],
};
