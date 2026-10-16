// Probability: Theory and Examples (Durrett) — Chapter 2, part E: renewal theory and large deviations (§§2.6–2.7)

// ---------- helpers (local to this part) ----------
const clampN = (x, a, b) => Math.min(b, Math.max(a, x));
/** Status text pinned to a corner of the data area (inside the gutter). */
function cornerIn(S, str, pos = 'tl', st = {}) {
  const l = S.X(S.xr[0]), r = S.X(S.xr[1]), t = S.Y(S.yr[1]), b = S.Y(S.yr[0]);
  const X = pos[1] === 'l' ? l + 8 : r - 8, Y = pos[0] === 't' ? t + 13 : b - 13;
  const o = { align: pos[1] === 'l' ? 'left' : 'right', color: 'muted', size: 12, ...st };
  if (/\$[^$]+\$/.test(str)) return S.texPx(String(str), X, Y, { ...o, rich: true });
  return S.textPx(String(str), X, Y, o);
}
/**
 * Set a log-y window that may reach far below 1e-12. Stage.setView compares windows with an absolute tolerance of 1e-12,
 * so it silently ignores a change of a tiny lower limit; compare relatively here and refit directly when needed.
 */
function setLogY(S, v, lo, hi) {
  const [a, b] = S.view.y;
  if (Math.abs(Math.log(lo / a)) < 1e-9 && Math.abs(Math.log(hi / b)) < 1e-9) return;
  S.view.y = [lo, hi]; S._fit(); v.invalidate();
}
/** About m log-spaced distinct integers in [n0, n1]. */
function logGrid(n0, n1, m = 200) {
  const out = [n0]; const q = Math.pow(n1 / n0, 1 / m);
  for (let x = n0 * q; x < n1; x *= q) { const k = Math.round(x); if (k > out[out.length - 1]) out.push(k); }
  if (out[out.length - 1] !== n1) out.push(n1);
  return out;
}
/** Composite Simpson rule. */
function simpson(f, a, b, n = 400) { if (n % 2) n++; const h = (b - a) / n; let s = f(a) + f(b); for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h); return (s * h) / 3; }
/** log Σ exp(xs). */
function lse(xs) { const m = Math.max(...xs); if (!isFinite(m)) return m; let s = 0; for (const x of xs) s += Math.exp(x - m); return m + Math.log(s); }
/** Natural log of a positive BigInt. */
function logBig(b) { const s = b.toString(); const k = Math.min(17, s.length); return Math.log(Number(s.slice(0, k))) + (s.length - k) * Math.LN10; }
/** Exact log P(U_1+…+U_n ≥ n a) for i.i.d. uniform(0,1), a given to 3 decimals (Irwin–Hall with BigInt arithmetic). */
function irwinHallLogTail(n, a) {
  if (a >= 1) return a > 1 ? -Infinity : -Infinity;
  if (a <= 0) return 0;
  const D = 1000n, N = BigInt(Math.round(n * (1 - a) * 1000)); // P(S ≥ na) = P(S ≤ n(1−a)) = P(S ≤ N/D)
  let sum = 0n, C = 1n; const nb = BigInt(n);
  for (let k = 0n; k * D < N && k <= nb; k++) { const term = C * (N - k * D) ** nb; sum += k % 2n ? -term : term; C = (C * (nb - k)) / (k + 1n); }
  if (sum <= 0n) return -Infinity;
  return logBig(sum) - n * Math.log(1000) - lgammaInt(n + 1);
}
function lgammaInt(m) { let s = 0; for (let i = 2; i < m; i++) s += Math.log(i); return s; } // log((m−1)!)
/** log P(Z ≥ z) for a standard normal, accurate in the far tail. */
function logPhiBar(z, M) { if (z < 5) return Math.log(0.5 * M.erfc(z / Math.SQRT2)); const z2 = z * z; return -z2 / 2 - Math.log(z * Math.sqrt(2 * Math.PI)) + Math.log(1 - 1 / z2 + 3 / (z2 * z2) - 15 / (z2 * z2 * z2)); }
/** Legendre transform sup_{0≤θ≤θmax} (θa − κ(θ)) by golden-section search (κ convex). Returns [I, θ*]. */
function legendre(kappa, a, thMax = 50) {
  let lo = 0, hi = thMax; const g = (t) => t * a - kappa(t), R = (Math.sqrt(5) - 1) / 2;
  let x1 = hi - R * (hi - lo), x2 = lo + R * (hi - lo), f1 = g(x1), f2 = g(x2);
  for (let i = 0; i < 120; i++) { if (f1 < f2) { lo = x1; x1 = x2; f1 = f2; x2 = lo + R * (hi - lo); f2 = g(x2); } else { hi = x2; x2 = x1; f2 = f1; x1 = hi - R * (hi - lo); f1 = g(x1); } }
  const t = (lo + hi) / 2; return [Math.max(0, g(t)), t];
}
/** Interarrival laws with mean 1 (and one with infinite mean) for the renewal items. */
const RLAW = {
  unif: { label: 'uniform $(0,2)$', mu: 1, m2: 4 / 3, draw: (r) => 2 * (1 - r()), F: (x) => clampN(x / 2, 0, 1), f: (x) => (x >= 0 && x <= 2 ? 0.5 : 0), xmax: 2.2 },
  gam: { label: 'gamma$(2)$', mu: 1, m2: 1.5, draw: (r) => -0.5 * Math.log((1 - r()) * (1 - r())), F: (x) => (x <= 0 ? 0 : 1 - Math.exp(-2 * x) * (1 + 2 * x)), f: (x) => (x <= 0 ? 0 : 4 * x * Math.exp(-2 * x)), xmax: 4 },
  exp: { label: 'exponential', mu: 1, m2: 2, draw: (r) => -Math.log(1 - r()), F: (x) => (x <= 0 ? 0 : 1 - Math.exp(-x)), f: (x) => (x < 0 ? 0 : Math.exp(-x)), xmax: 5 },
  par: { label: 'Pareto $\\alpha=3$', mu: 1, m2: 4 / 3, draw: (r) => (2 / 3) * (1 - r()) ** (-1 / 3), F: (x) => (x < 2 / 3 ? 0 : 1 - (2 / 3 / x) ** 3), f: (x) => (x < 2 / 3 ? 0 : 3 * (2 / 3) ** 3 * x ** -4), xmax: 5 },
};
const lawOpts = (keys) => keys.map((k) => ({ value: k, label: RLAW[k].label }));
/** Interarrival law discretized onto the lattice dt·{1, 2, …}: p[j] = mass of cell j (mass near 0 moved to cell 1). */
function pmass(F, dt, n) {
  const p = new Float64Array(n + 1);
  for (let j = 1; j <= n; j++) p[j] = F((j + 0.5) * dt) - (j === 1 ? 0 : F((j - 0.5) * dt));
  return p;
}
/** Renewal masses m[k] = U({k·dt}) of the discretized law: m = p + m*p (exact for the lattice law, mass-preserving). */
function renewalMass(p) {
  const n = p.length - 1, m = new Float64Array(n + 1);
  let K = n; while (K > 1 && p[K] < 1e-14) K--;
  for (let k = 1; k <= n; k++) { let s = p[k]; for (let j = 1; j <= Math.min(k - 1, K); j++) s += p[j] * m[k - j]; m[k] = s; }
  return m;
}
/** (H * F)(k·dt) = Σ_j H((k−j)dt) p[j] for the discretized law. */
function convP(H, p) {
  const n = H.length - 1, out = new Float64Array(n + 1);
  let K = p.length - 1; while (K > 1 && p[K] < 1e-14) K--;
  for (let k = 1; k <= n; k++) { let s = 0; for (let j = 1; j <= Math.min(k, K); j++) s += H[k - j] * p[j]; out[k] = s; }
  return out;
}

export default {
  collection: 'prob',
  chapter: 2,
  items: [
    // ======================================================================== §2.6 Renewal theory
    {
      num: '2.6.1a',
      kind: 'Definition',
      name: 'Renewal process',
      verify: true,
      statement: String.raw`Let $\xi_1,\xi_2,\dots$ be i.i.d. with $0<\xi_i<\infty$ (the **interarrival times**), $T_0=0$ and $T_n=\xi_1+\dots+\xi_n$ (the **renewal times**). The **renewal process** is the counting function
$$N_t=\sup\{n:T_n\le t\},\qquad t\ge0,$$
the number of renewals in $(0,t]$. Its mean $U(t)=EN_t$ (or $\sum_{n\ge1}P(T_n\le t)$) is the **renewal function**. The age $t-T_{N_t}$ and residual life $T_{N_t+1}-t$ describe the interval that covers $t$.`,
      idea: String.raw`Think of a component replaced the moment it fails: $T_n$ is the time of the $n$-th replacement, and $N_t$ counts replacements so far. The staircase $t\mapsto N_t$ is the inverse of $n\mapsto T_n$, so $\{N_t\ge n\}=\{T_n\le t\}$, which turns questions about $N_t$ into questions about sums of i.i.d. variables (2.4.7, 2.6.1).`,
      caption: String.raw`Shape the interarrival law with the gamma shape $k$ (mean $1$): $k<1$ is bursty, $k=1$ exponential (Poisson process), large $k$ nearly periodic. Left: its density. Right: the seeded renewal times on the axis and the staircase $N_t$; drag $t$ to read $N_t$, the age (orange) and the residual life (green) of the interval covering $t$.`,
      deps: ['prob-2.2.3a'],
      see: ['stoch-11.1'],
      tags: ['renewal'],
      viz(v) {
        const kS = v.slider('gamma shape $k$', 0.3, 20, 2, { log: true, sig: 2 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const L = v.stage({ x: [0, 4], y: [0, 2], height: 300, weight: 0.8, axes: 'box', gutter: true, xlabel: '$x$', title: 'interarrival density (mean 1)' });
        const R = v.stage({ x: [0, 15], y: [-2, 20], height: 300, weight: 1.6, axes: 'box', gutter: true, xlabel: '$t$', ylabel: '$N_t$', title: 'renewal times and the counting staircase' });
        const H = R.handle(7.3, -1.45, { color: 'gold', label: 't', labelPos: 'e', constrain: (x) => [clampN(x, 0.05, 14.95), -1.45] });
        let st = null;
        v.render(() => {
          const k = kS.value, D = v.M.dist.gamma(k, 1 / k), r = v.rng(seed * 7 + 1), T = [0];
          while (T[T.length - 1] <= 15) T.push(T[T.length - 1] + D.sample(r));
          const ymax = Math.min(4, Math.max(1.2, D.pdf(Math.max(0.05, (k - 1) / k)) * 1.2));
          L.setView([0, 4], [0, ymax]);
          L.fn((x) => D.pdf(x), { domain: [0.002, 4], color: 'accent', width: 2.4, fill: 'accent', fillAlpha: 0.15, n: 400 });
          L.vline(1, { color: 'muted', dash: [4, 4], width: 1 });
          const t = H.x, Nt = T.filter((x) => x > 0 && x <= t).length, Tn = T[Nt], Tn1 = T[Nt + 1];
          const top = Math.max(T.filter((x) => x <= 15).length + 1, 8); R.setView(null, [-2, top]);
          const stair = []; for (let i = 0; i < T.length - 1 && T[i] <= 15; i++) stair.push([T[i], i], [Math.min(T[i + 1], 15), i]);
          R.path(stair, { color: 'accent', width: 2.2 });
          T.slice(1).forEach((x) => { if (x <= 15) R.line(x, -0.25, x, 0.25, { color: 'ink', width: 1.6 }); });
          R.hline(0, { color: 'muted', width: 1 });
          R.vline(t, { color: 'gold', width: 1.4, dash: [4, 3] });
          R.line(Tn, -0.65, t, -0.65, { color: 'orange', width: 4 });
          R.line(t, -0.65, Math.min(Tn1, 15), -0.65, { color: 'green', width: 4 });
          R.dot(t, Nt, { r: 5, color: 'gold' });
          R.text(`Nₜ = ${Nt}`, t, Nt, { dx: 10, dy: -10, size: 12, color: 'ink', plate: true });
          v.legend([['accent', '$N_t$'], ['orange', 'age $t-T_{N_t}$'], ['green', 'residual $T_{N_t+1}-t$']]);
          st = { t, Nt, Tn, Tn1, k };
        });
        v.readout(() => st && `$t=${v.fix(st.t, 2)}$: $N_t=${st.Nt}$, $\\ T_{N_t}=${v.fix(st.Tn, 3)}\\le t<T_{N_t+1}=${v.fix(st.Tn1, 3)}$; age $${v.fix(st.t - st.Tn, 3)}$, residual life $${v.fix(st.Tn1 - st.t, 3)}$. Interarrival variance $1/k=${v.fix(1 / st.k, 3)}$.`);
      },
    },
    {
      num: '2.6.1',
      kind: 'Theorem',
      name: 'Renewal strong law Nₜ/t → 1/µ',
      statement: String.raw`For a renewal process with $E\xi_1=\mu\le\infty$, $N_t/t\to1/\mu$ almost surely as $t\to\infty$ (with $1/\infty=0$).`,
      idea: String.raw`This is Theorem 2.4.7. The sandwich $T(N_t)\le t<T(N_t+1)$ gives
$$\frac{T(N_t)}{N_t}\le\frac t{N_t}<\frac{T(N_t+1)}{N_t+1}\cdot\frac{N_t+1}{N_t},$$
and both ends tend to $\mu$ by the strong law (2.4.1, or 2.4.5 when $\mu=\infty$), because $N_t\to\infty$ a.s.`,
      caption: String.raw`Left: $N_t/t$ for six seeded runs of each of four laws, with means $1$, $2$, $3$ and $\infty$, against $1/\mu$ (dashed). Right: for one run of the law you pick, the three terms of the sandwich, $T(N_t)/N_t\le t/N_t<T(N_t+1)/N_t$, squeezing together onto $\mu$ (green). For the infinite-mean law the squeeze still happens, but on its way to $\infty$.`,
      deps: ['prob-2.4.7', 'prob-2.6.1a'],
      tags: ['renewal'],
      viz(v) {
        const LW = [
          { label: 'uniform$(0,2)$', mu: 1, col: 'accent', draw: (r) => 2 * (1 - r()) },
          { label: 'gamma$(2,1)$', mu: 2, col: 'teal', draw: (r) => -Math.log((1 - r()) * (1 - r())) },
          { label: 'Pareto $\\alpha=1.5$', mu: 3, col: 'orange', draw: (r) => (1 - r()) ** (-1 / 1.5) },
          { label: 'Pareto $\\alpha=0.8$', mu: Infinity, col: 'red', draw: (r) => (1 - r()) ** (-1 / 0.8) },
        ];
        const pick = v.select('right panel', LW.map((o, i) => ({ value: String(i), label: o.label })), '1');
        let seed = 1; v.button('Resample', () => { seed++; });
        const TMAX = 1e5, grid = logGrid(10, TMAX, 160);
        const L = v.stage({ x: [10, TMAX], y: [0, 1.4], xlog: true, height: 330, weight: 1.2, axes: 'box', gutter: true, xlabel: '$t$', title: '$N_t/t$ for four laws' });
        const R = v.stage({ x: [10, TMAX], y: [0, 6], xlog: true, height: 330, axes: 'box', gutter: true, xlabel: '$t$', title: 'the sandwich around $t/N_t$' });
        let cache = null, st = null;
        v.render(() => {
          if (!cache || cache.seed !== seed) {
            const r = v.rng(seed * 13 + 3), runs = LW.map((Lw) => Array.from({ length: 6 }, () => {
              const out = [], lo = [], hi = []; let t = 0, n = 0, j = 0;
              while (j < grid.length) { const tn = t + Lw.draw(r); while (j < grid.length && grid[j] < tn) { out.push(n / grid[j]); lo.push(n ? t / n : NaN); hi.push(n ? tn / n : NaN); j++; } t = tn; n++; }
              return { out, lo, hi };
            }));
            cache = { seed, runs };
          }
          LW.forEach((Lw, i) => { L.hline(isFinite(Lw.mu) ? 1 / Lw.mu : 0, { color: Lw.col, dash: [6, 4], width: 1.3 }); cache.runs[i].forEach((run) => L.path(grid.map((g, k) => [g, run.out[k]]), { color: Lw.col, width: 1.1, alpha: 0.7 })); });
          const i = +pick.value, Lw = LW[i], run = cache.runs[i][0];
          const vals = grid.map((g, k) => [run.lo[k], g / Math.max(1, run.out[k] * g), run.hi[k]]);
          const top = isFinite(Lw.mu) ? Lw.mu * 2.2 : Math.max(...vals.slice(20).map((x) => x[2])) * 1.2;
          R.setView(null, [0, top]);
          R.poly([...grid.map((g, k) => [g, Math.min(top * 2, vals[k][2])]), ...grid.map((g, k) => [g, vals[k][0]]).reverse()].filter((p) => isFinite(p[1])), { fill: Lw.col, fillAlpha: 0.15, stroke: false });
          R.path(grid.map((g, k) => [g, vals[k][0]]), { color: 'purple', width: 1.6 });
          R.path(grid.map((g, k) => [g, vals[k][2]]), { color: 'orange', width: 1.6 });
          R.path(grid.map((g, k) => [g, vals[k][1]]), { color: 'ink', width: 2 });
          if (isFinite(Lw.mu)) R.hline(Lw.mu, { color: 'green', width: 1.8, dash: [6, 4] });
          v.legend([...LW.map((o) => [o.col, o.label]), ['purple', '$T(N_t)/N_t$'], ['ink', '$t/N_t$'], ['orange', '$T(N_t+1)/N_t$']]);
          const last = vals[vals.length - 1];
          st = { lw: Lw, last, fin: LW.map((o, j) => cache.runs[j].map((rr) => rr.out[rr.out.length - 1])) };
        });
        v.readout(() => st && `At $t=10^5$, $N_t/t$ ranges: ` + st.fin.map((f, j) => `${['$\\mu=1$', '$\\mu=2$', '$\\mu=3$', '$\\mu=\\infty$'][j]}: $${v.fix(Math.min(...f), 3)}$–$${v.fix(Math.max(...f), 3)}$`).join('; ') + `. Sandwich for the chosen law: $${v.fix(st.last[0], 5)}\\le${v.fix(st.last[1], 5)}<${v.fix(st.last[2], 5)}$.`);
      },
    },
    {
      num: '2.6.2',
      kind: 'Theorem',
      name: 'Wald’s equation',
      credit: 'Wald, 1944',
      statement: String.raw`Let $X_1,X_2,\dots$ be i.i.d. with $E|X_i|<\infty$, and let $N$ be a **stopping time** (the event $\{N=n\}$ is determined by $X_1,\dots,X_n$) with $EN<\infty$. Then
$$ES_N=EX_1\cdot EN.$$`,
      idea: String.raw`Write $S_N=\sum_{n\ge1}X_n1(N\ge n)$. The event $\{N\ge n\}=\{N\le n-1\}^c$ is determined by $X_1,\dots,X_{n-1}$, hence independent of $X_n$, so $E\big(X_n1(N\ge n)\big)=EX_1\,P(N\ge n)$. Summing, and justifying the exchange of sum and expectation by doing the same computation for $|X_n|$ (Fubini, Theorem 1.6.7 setting), gives $EX_1\sum_nP(N\ge n)=EX_1\,EN$.`,
      caption: String.raw`Roll a fair die ($EX=3.5$) until a rule says stop. Left: twelve seeded runs as walks $S_n$, stopped at the dot. Right: $(N,S_N)$ for 3000 seeded runs; Wald says their centre of mass (gold) lies on the line $S=3.5\,N$. Try the rule "stop at the roll before the first six": it peeks one roll ahead, so it is not a stopping time, and the centre falls below the line ($ES_N=3\,EN$, because the rolls before a six average $3$).`,
      deps: ['prob-2.2.3a', 'prob-1.6.7'],
      see: ['prob-4.8.6', 'stoch-12.5'],
      tags: ['stopping times', 'renewal'],
      viz(v) {
        const rule = v.select('stop', [{ value: 'level', label: 'first $S_n\\ge L$' }, { value: 'dd', label: 'first double six' }, { value: 'fixed', label: '$N=10$' }, { value: 'peek', label: 'roll before the first six' }], 'level');
        const LS = v.slider('level $L$', 5, 100, 30, { int: true });
        let seed = 1; v.button('Resample', () => { seed++; });
        const L = v.stage({ x: [0, 30], y: [0, 120], height: 330, axes: 'box', gutter: true, xlabel: '$n$', ylabel: '$S_n$', title: 'stopped walks' });
        const R = v.stage({ x: [0, 30], y: [0, 120], height: 330, axes: 'box', gutter: true, xlabel: '$N$', ylabel: '$S_N$', title: '$(N,S_N)$ for 3000 runs' });
        let st = null;
        v.render(() => {
          LS.el.hidden = rule.value !== 'level';
          const Lv = LS.value, r = v.rng(seed * 19 + 4), runs = [];
          for (let i = 0; i < 3000; i++) {
            const xs = []; let s = 0, N = 0;
            for (;;) {
              const x = 1 + Math.floor(6 * r()); xs.push(x);
              if (rule.value === 'level') { s += x; if (s >= Lv) { N = xs.length; break; } }
              else if (rule.value === 'dd') { if (x === 6 && xs[xs.length - 2] === 6) { N = xs.length; break; } }
              else if (rule.value === 'fixed') { if (xs.length === 10) { N = 10; break; } }
              else if (x === 6) { N = xs.length - 1; break; }
              if (xs.length > 5000) { N = xs.length; break; }
            }
            const SN = xs.slice(0, N).reduce((a, b) => a + b, 0);
            runs.push({ xs, N, SN });
          }
          const mN = runs.reduce((a, q) => a + q.N, 0) / runs.length, mS = runs.reduce((a, q) => a + q.SN, 0) / runs.length;
          const qN = runs.map((q) => q.N).sort((a, b) => a - b)[Math.floor(0.97 * runs.length)];
          const xmax = Math.max(12, qN * 1.05), qS = runs.map((q) => q.SN).sort((a, b) => a - b)[Math.floor(0.99 * runs.length)], ymax = Math.max(3.5 * xmax, qS) * 1.08;
          L.setView([0, xmax], [0, ymax]); R.setView([0, xmax], [0, ymax]);
          runs.slice(0, 12).forEach((q) => { const pts = [[0, 0]]; let s = 0; q.xs.forEach((x, i) => { s += x; if (i < xmax + 2) pts.push([i + 1, s]); }); L.path(pts.slice(0, Math.min(pts.length, q.N + 2)), { color: 'accent', width: 1.2, alpha: 0.6 }); L.dot(q.N, q.SN, { r: 3.5, color: rule.value === 'peek' ? 'red' : 'gold' }); });
          if (rule.value === 'level') L.hline(Lv, { color: 'orange', dash: [5, 4], width: 1.4 });
          const jit = v.rng(3);
          R.dots(runs.map((q) => [q.N + (jit() - 0.5) * 0.5, q.SN + (jit() - 0.5) * 1.5]), { r: 1.5, color: 'accent', alpha: 0.25 });
          R.fn((x) => 3.5 * x, { color: 'green', width: 2.2 });
          if (rule.value === 'peek') R.fn((x) => 3 * x, { color: 'red', width: 1.4, dash: [5, 4] });
          R.dot(mN, mS, { r: 7, color: 'gold' });
          v.legend([['accent', 'runs'], ['gold', 'centre $(\\bar N,\\overline{S_N})$', { dot: true }], ['green', '$S=3.5\\,N$ (Wald)']]);
          st = { mN, mS, peek: rule.value === 'peek' };
        });
        v.readout(() => st && `$\\overline{N}=${v.fix(st.mN, 3)}$, $\\ \\overline{S_N}=${v.fix(st.mS, 3)}$, $\\ 3.5\\,\\overline N=${v.fix(3.5 * st.mN, 3)}$; ratio $\\overline{S_N}/(3.5\\overline N)=${v.fix(st.mS / (3.5 * st.mN), 4)}$.` + (st.peek ? ' Not a stopping time: the ratio is $3/3.5\\approx0.857$, not $1$.' : ''));
      },
    },
    {
      num: '2.6.3',
      kind: 'Theorem',
      name: 'Elementary renewal theorem',
      statement: String.raw`For a renewal process with $E\xi_1=\mu\le\infty$,
$$\frac{EN_t}{t}\to\frac1\mu\quad\text{as }t\to\infty.$$`,
      idea: String.raw`Almost sure convergence (2.6.1) does not give convergence of means by itself. Lower bound: $N_t+1$ is a stopping time, and Wald's equation (2.6.2) gives $\mu\,E(N_t+1)=ET(N_t+1)\ge t$, so $\liminf EN_t/t\ge1/\mu$. Upper bound: truncate, $\bar\xi_i=\xi_i\wedge c$; the truncated process renews at least as often, and its overshoot is at most $c$, so Wald gives $E\bar\xi\,(E\bar N_t+1)\le t+c$. Hence $\limsup EN_t/t\le1/E\bar\xi$, and $E\bar\xi\uparrow\mu$ as $c\uparrow\infty$.`,
      caption: String.raw`Left: the renewal function $U(t)=EN_t$, estimated from 3000 seeded runs (blue), against $t/\mu$ (dashed) and Wald's lower bound $t/\mu-1$ (orange). With finite variance the gap settles near $\frac{\sigma^2-\mu^2}{2\mu^2}$. Right (log scale in $t$): the ratio $U(t)/t$ tends to $1/\mu=1$. The Pareto law with $\alpha=1.5$ has infinite variance and approaches more slowly; the law with $\mu=\infty$ sends $U(t)/t$ to $0$.`,
      deps: ['prob-2.6.2', 'prob-2.6.1'],
      see: ['stoch-11.2'],
      tags: ['renewal'],
      viz(v) {
        const LW = {
          unif: { label: 'uniform$(0,2)$', mu: 1, s2: 1 / 3, draw: (r) => 2 * (1 - r()) },
          gam: { label: 'gamma$(2)$', mu: 1, s2: 0.5, draw: (r) => -0.5 * Math.log((1 - r()) * (1 - r())) },
          p15: { label: 'Pareto $\\alpha=1.5$', mu: 1, s2: Infinity, draw: (r) => (1 / 3) * (1 - r()) ** (-1 / 1.5) },
          p08: { label: 'Pareto $\\alpha=0.8$', mu: Infinity, s2: Infinity, draw: (r) => 0.1 * (1 - r()) ** (-1 / 0.8) },
        };
        const law = v.select('interarrivals', Object.entries(LW).map(([value, o]) => ({ value, label: o.label })), 'gam');
        let seed = 1; v.button('Resample', () => { seed++; });
        const RUNS = 3000, TL = 12, TMAX = 1000, nb = 600, edges = logGrid(1, 1000, 120).map((x) => x);
        const L = v.stage({ x: [0, TL], y: [0, 14], height: 320, axes: 'box', gutter: true, xlabel: '$t$', title: '$U(t)=EN_t$' });
        const R = v.stage({ x: [1, TMAX], y: [0, 1.6], xlog: true, height: 320, axes: 'box', gutter: true, xlabel: '$t$', title: '$U(t)/t$' });
        let cache = null, st = null;
        v.render(() => {
          const Lw = LW[law.value], key = law.value + seed;
          if (!cache || cache.key !== key) {
            const r = v.rng(seed * 29 + 7), lin = new Float64Array(nb + 1), lg = new Float64Array(edges.length);
            for (let i = 0; i < RUNS; i++) { let t = Lw.draw(r); while (t <= TMAX) { if (t <= TL) lin[Math.ceil((t / TL) * nb)] += 1; let j = 0; while (j < edges.length && edges[j] < t) j++; if (j < edges.length) lg[j] += 1; t += Lw.draw(r); } }
            for (let i = 1; i <= nb; i++) lin[i] += lin[i - 1]; for (let j = 1; j < edges.length; j++) lg[j] += lg[j - 1];
            cache = { key, U: Array.from(lin, (c, i) => [(i / nb) * TL, c / RUNS]), R: edges.map((e, j) => [e, lg[j] / RUNS / e]) };
          }
          const top = Math.max(TL / (isFinite(Lw.mu) ? Lw.mu : 1), cache.U[nb][1]) * 1.1;
          L.setView(null, [0, top]);
          if (isFinite(Lw.mu)) { L.fn((t) => t / Lw.mu, { color: 'muted', width: 1.5, dash: [6, 4] }); L.fn((t) => t / Lw.mu - 1, { color: 'orange', width: 1.4, dash: [3, 3] }); if (isFinite(Lw.s2)) { const c = (Lw.s2 - Lw.mu ** 2) / (2 * Lw.mu ** 2); L.fn((t) => t / Lw.mu + c, { color: 'green', width: 1.2, dash: [2, 3], domain: [TL / 2, TL] }); } }
          L.path(cache.U, { color: 'accent', width: 2.4 });
          R.setView(null, [0, clampN(Math.max(...cache.R.map((q) => q[1])) * 1.08, 1.6, 4)]);
          R.hline(isFinite(Lw.mu) ? 1 / Lw.mu : 0, { color: 'green', width: 2, dash: [7, 4] });
          if (isFinite(Lw.mu)) R.fn((t) => 1 / Lw.mu - 1 / t, { color: 'orange', width: 1.4, dash: [3, 3], domain: [1, TMAX] });
          R.path(cache.R, { color: 'accent', width: 2.4 });
          v.legend([['accent', 'estimate'], ['muted', '$t/\\mu$', { dash: true }], ['orange', 'Wald bound $t/\\mu-1$', { dash: true }], ['green', isFinite(Lw.s2) ? 'second-order line / limit' : 'limit $1/\\mu$', { dash: true }]]);
          st = { Ut: cache.U[nb][1], ratio: cache.R[cache.R.length - 1][1], mu: Lw.mu, s2: Lw.s2 };
        });
        v.readout(() => st && `$U(12)\\approx${v.fix(st.Ut, 3)}$` + (isFinite(st.mu) ? ` (vs $t/\\mu=12$` + (isFinite(st.s2) ? `, second-order $12${(st.s2 - 1) / 2 < 0 ? '' : '+'}${v.fix((st.s2 - 1) / 2, 3)}$)` : ')') : '') + `; $U(1000)/1000\\approx${v.fix(st.ratio, 4)}$, $\\ 1/\\mu=${isFinite(st.mu) ? v.fix(1 / st.mu, 4) : '0'}$.`);
      },
    },
    {
      num: '2.6.3a',
      kind: 'Definition',
      name: 'Arithmetic and nonarithmetic distributions',
      verify: true,
      statement: String.raw`A distribution on $(0,\infty)$ is **arithmetic** if it is concentrated on a lattice $\{\delta,2\delta,3\delta,\dots\}$ for some $\delta>0$; the largest such $\delta$ is the **span**. Otherwise it is **nonarithmetic**. A discrete law can be nonarithmetic, e.g. one with atoms at $1$ and $\sqrt2$.`,
      idea: String.raw`For an arithmetic law with span $\delta$ every renewal time lies on $\delta\mathbb Z$, so the renewal measure of a short window keeps oscillating: it is large when the window catches a lattice point and $0$ otherwise. Nonarithmetic laws spread their renewal times so that, far out, every window of length $h$ receives about $h/\mu$ renewals (Blackwell, 2.6.4).`,
      caption: String.raw`Top: the exact renewal measure $U=\sum_{n\ge1}P(T_n\in\cdot)$ on $[0,25]$: atoms as stems (lattice law on $\{1,2\}$, or the law on $\{1,\sqrt2\}$), or the renewal density (uniform law). Drag the window $[t,t+h]$. Bottom: $U([t,t+h])$ as the window slides, against $h/\mu$ (dashed). The lattice law oscillates forever, between $0$ and $2/3$ when $h<1$; the $\{1,\sqrt2\}$ law, discrete but nonarithmetic, slowly flattens out, and the uniform law does so fast.`,
      deps: ['prob-1.2.1b'],
      tags: ['renewal', 'distributions'],
      viz(v) {
        const law = v.select('interarrival law', [{ value: 'lat', label: 'lattice $\\{1,2\\}$' }, { value: 'irr', label: '$\\{1,\\sqrt2\\}$' }, { value: 'uni', label: 'uniform$[0.5,1.5]$' }], 'lat');
        const hS = v.slider('window $h$', 0.1, 2, 0.5, { step: 0.05 });
        const TMAXP = 25;
        const T = v.stage({ x: [0, TMAXP], y: [0, 1.05], height: 220, full: true, axes: 'box', gutter: true, xlabel: '$x$', title: 'renewal measure $U$ (atoms, or density)' });
        const B = v.stage({ x: [0, TMAXP - 2], y: [0, 1.4], height: 230, full: true, axes: 'box', gutter: true, xlabel: '$t$', title: '$U([t,t+h])$ as the window slides' });
        const H = T.handle(8, 0, { color: 'gold', label: 't', labelPos: 'n', constrain: (x) => [clampN(x, 0, TMAXP - 2.1), 0] });
        const cache = {};
        const atoms = (k) => {
          if (cache[k]) return cache[k];
          let pts = [], mu = 1.5;
          if (k === 'lat') { const u = [1]; for (let i = 1; i <= 40; i++) u.push(0.5 * u[i - 1] + (i >= 2 ? 0.5 * u[i - 2] : 0)); pts = u.slice(1).map((m, i) => [i + 1, m]); }
          else if (k === 'irr') { mu = (1 + Math.SQRT2) / 2; for (let a = 0; a <= 40; a++) for (let b = 0; a + b * Math.SQRT2 <= 40; b++) if (a + b > 0) { const n = a + b; pts.push([a + b * Math.SQRT2, Math.exp(v.M.lgamma(n + 1) - v.M.lgamma(a + 1) - v.M.lgamma(b + 1) - n * Math.LN2)]); } pts.sort((p, q) => p[0] - q[0]); }
          else { mu = 1; const dt = 0.005, m = renewalMass(pmass((x) => clampN(x - 0.5, 0, 1), dt, Math.round(40 / dt))); pts = { dens: true, dt, u: m.map((x) => x / dt), m }; }
          cache[k] = { pts, mu }; return cache[k];
        };
        let st = null;
        v.render(() => {
          const A = atoms(law.value), h = hS.value, t = H.x, mu = A.mu;
          T.vband(t, t + h, { color: 'gold', alpha: 0.18 });
          let W;
          if (A.pts.dens) {
            const { dt, u } = A.pts;
            T.setView(null, [0, 1.6]); T.path(Array.from(u, (y, i) => [i * dt, y]).filter((p) => p[0] <= TMAXP), { color: 'accent', width: 2 });
            T.hline(1 / mu, { color: 'muted', dash: [5, 4], width: 1 });
            const cum = new Float64Array(u.length); for (let i = 1; i < u.length; i++) cum[i] = cum[i - 1] + A.pts.m[i];
            W = (s) => { const i0 = Math.round(s / dt), i1 = Math.min(u.length - 1, Math.round((s + h) / dt)); return cum[i1] - cum[i0]; };
          } else {
            T.setView(null, [0, 1.05]);
            A.pts.forEach(([x, m]) => { if (x <= TMAXP) { T.line(x, 0, x, m, { color: 'accent', width: law.value === 'lat' ? 2.4 : 1.4 }); T.dot(x, m, { r: law.value === 'lat' ? 3 : 1.6, color: 'accent' }); } });
            const xs = A.pts.map((p) => p[0]), cm = []; A.pts.reduce((a, p, i) => (cm[i] = a + p[1]), 0);
            const F = (y) => { let lo = 0, hi = xs.length; while (lo < hi) { const md = (lo + hi) >> 1; if (xs[md] < y) lo = md + 1; else hi = md; } return lo ? cm[lo - 1] : 0; };
            W = (s) => F(s + h + 1e-12) - F(s - 1e-12);
          }
          const pts = []; for (let s = 0; s <= TMAXP - 2; s += 0.01) pts.push([s, W(s)]);
          const top = Math.max(h / mu * 1.6, ...pts.map((p) => p[1])) * 1.1;
          B.setView(null, [0, top]);
          B.hline(h / mu, { color: 'green', width: 1.8, dash: [7, 4] });
          B.path(pts, { color: 'accent', width: 1.8 });
          B.dot(t, W(t), { r: 5, color: 'gold' });
          v.legend([['accent', 'renewal measure / window mass'], ['green', '$h/\\mu$', { dash: true }]]);
          const late = pts.filter((p) => p[0] > 15).map((p) => p[1]);
          st = { W: W(t), hm: h / mu, mu, lo: Math.min(...late), hi: Math.max(...late) };
        });
        v.readout(() => st && `$\\mu=${v.fix(st.mu, 4)}$. $U([t,t+h])=${v.fix(st.W, 4)}$ against $h/\\mu=${v.fix(st.hm, 4)}$. For $t\\in[15,23]$ the window mass ranges over $[${v.fix(st.lo, 3)},${v.fix(st.hi, 3)}]$` + (law.value === 'lat' ? ': it never settles (arithmetic).' : '.'));
      },
    },
    {
      num: '2.6.4',
      kind: 'Theorem',
      name: 'Blackwell’s renewal theorem',
      credit: 'Blackwell, 1948',
      statement: String.raw`Let $U(A)=\sum_{n\ge1}P(T_n\in A)$ be the renewal measure of a renewal process with mean $\mu\le\infty$. If the interarrival law is nonarithmetic, then for every $h>0$
$$U([t,t+h])\to\frac h\mu\quad\text{as }t\to\infty.$$
If it is arithmetic with span $\delta$, then $U(\{n\delta\})\to\delta/\mu$ as $n\to\infty$.`,
      idea: String.raw`The elementary renewal theorem (2.6.3) only gives the average rate $1/\mu$; Blackwell's theorem says the rate is eventually the same in every window. A proof by coupling runs two renewal processes, one started in its stationary version (where the window mass is exactly $h/\mu$ for every $t$), and uses the nonarithmetic hypothesis to make their renewal times nearly coincide after a finite random time; after that the two processes put the same number of renewals in each window.`,
      caption: String.raw`Top: 14 of 4000 seeded runs as rows of renewal ticks, with the window $[t,t+h]$ you drag. Bottom: the mean number of renewals in $[t,t+h]$ over all runs, as a function of $t$, against $h/\mu$ (dashed; $\mu=1$ for all laws). Every nonarithmetic law flattens onto the line; the lattice law on $\{0.5,1.5\}$ keeps oscillating unless $h$ is a multiple of its span $0.5$.`,
      deps: ['prob-2.6.3a', 'prob-2.6.3'],
      see: ['stoch-11.3', 'fa-9.13'],
      tags: ['renewal'],
      viz(v) {
        const LW = { ...RLAW, lat: { label: 'lattice $\\{0.5,1.5\\}$', mu: 1, draw: (r) => (r() < 0.5 ? 0.5 : 1.5) } };
        const law = v.select('interarrivals', lawOpts(['unif', 'gam', 'par']).concat([{ value: 'lat', label: LW.lat.label }]), 'gam');
        const hS = v.slider('window $h$', 0.1, 2, 0.3, { step: 0.05 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const RUNS = 4000, TM = 20, bw = 0.01, nb = Math.round(TM / bw);
        const T = v.stage({ x: [0, TM], y: [0.3, 14.7], height: 230, full: true, axes: 'box', gutter: true, xlabel: '$t$', yticks: [], title: 'renewal times of 14 runs' });
        const B = v.stage({ x: [0, TM - 2], y: [0, 0.6], height: 230, full: true, axes: 'box', gutter: true, xlabel: '$t$', title: 'mean number of renewals in $[t,t+h]$' });
        const H = T.handle(10, 0.3, { color: 'gold', label: 't', labelPos: 'e', constrain: (x) => [clampN(x, 0, TM - 2.1), 0.3] });
        let cache = null, st = null;
        v.render(() => {
          const Lw = LW[law.value], key = law.value + seed, h = hS.value, t = H.x;
          if (!cache || cache.key !== key) {
            const r = v.rng(seed * 41 + 9), cnt = new Float64Array(nb + 2), rows = [];
            for (let i = 0; i < RUNS; i++) { let s = Lw.draw(r); const row = []; while (s <= TM) { cnt[Math.floor(s / bw)] += 1; if (i < 14) row.push(s); s += Lw.draw(r); } if (i < 14) rows.push(row); }
            const cum = new Float64Array(nb + 2); for (let i = 1; i <= nb + 1; i++) cum[i] = cum[i - 1] + cnt[i - 1];
            cache = { key, rows, cum };
          }
          T.vband(t, t + h, { color: 'gold', alpha: 0.2 });
          cache.rows.forEach((row, i) => row.forEach((s) => T.line(s, i + 0.6, s, i + 1.4, { color: s >= t && s <= t + h ? 'red' : 'accent', width: 1.6 })));
          const W = (s) => (cache.cum[Math.min(nb, Math.round((s + h) / bw))] - cache.cum[Math.round(s / bw)]) / RUNS;
          const pts = []; for (let s = 0; s <= TM - 2; s += 0.02) pts.push([s, W(s)]);
          B.setView(null, [0, Math.max(h * 1.8, ...pts.map((p) => p[1])) * 1.1]);
          B.hline(h / Lw.mu, { color: 'green', width: 1.8, dash: [7, 4] });
          B.path(pts, { color: 'accent', width: 1.8 });
          B.dot(t, W(t), { r: 5, color: 'gold' });
          v.legend([['accent', 'renewals / mean window count'], ['red', 'inside the window'], ['green', '$h/\\mu$', { dash: true }]]);
          const late = pts.filter((p) => p[0] > 12).map((p) => p[1]);
          st = { W: W(t), h, lo: Math.min(...late), hi: Math.max(...late) };
        });
        v.readout(() => st && `Mean count in $[t,t+h]$: $${v.fix(st.W, 4)}$, against $h/\\mu=${v.fix(st.h, 3)}$. For $t\\in[12,18]$ it stays within $[${v.fix(st.lo, 3)},${v.fix(st.hi, 3)}]$ (Monte Carlo noise is about $\\pm${v.fix(2 * Math.sqrt(st.h / 4000), 3)}$).`);
      },
    },
    {
      num: '2.6.4a',
      kind: 'Definition',
      name: 'Renewal equation',
      verify: true,
      statement: String.raw`Let $F$ be the interarrival distribution and $h$ a given function on $[0,\infty)$. The **renewal equation** for an unknown $H$ is
$$H(t)=h(t)+\int_0^tH(t-s)\,dF(s),\qquad t\ge0,$$
written $H=h+H*F$. Its candidate solution is $H=h*U_0=\sum_{n\ge0}h*F^{*n}$, where $U_0=\delta_0+U$ includes the renewal at time $0$.`,
      idea: String.raw`Many renewal quantities satisfy such an equation by conditioning on the first renewal $\xi_1=s$: if $s>t$ the answer is a known $h(t)$, and if $s\le t$ the process starts afresh at $s$ and contributes $H(t-s)$. For example $H(t)=P(T_{N_t+1}-t>x)$, the chance that the residual life exceeds $x$, solves it with $h(t)=1-F(t+x)$. Iterating $H\mapsto h+H*F$ from $H_0=h$ produces the partial sums $\sum_{n<k}h*F^{*n}$.`,
      caption: String.raw`Gamma$(2)$ interarrivals with mean $1$, solved on a grid. The iterates $H_k=h+H_{k-1}*F$ (faint, $H_0=h$) build up to the bold $H_k$; the dashed curve is $h*U_0$, computed separately from the renewal density. For $h=1-F$ the solution is $H\equiv1$ (a renewal process is always somewhere in an interval). For $h(t)=1-F(t+1)$, $H(t)=P(\text{residual life}>1)$, which levels off at $\frac1\mu\int_1^\infty(1-F)$, the key renewal limit (2.6.12).`,
      deps: ['prob-2.6.1a'],
      see: ['demo-6.7', 'mathbio-4.13', 'prob-2.6.12'],
      tags: ['renewal'],
      viz(v) {
        const hSel = v.select('$h$', [{ value: 'tail', label: '$1-F(t)$' }, { value: 'res', label: '$1-F(t+1)$' }, { value: 'box', label: '$1\\{t\\le1\\}$' }], 'res');
        const kS = v.slider('iterations $k$', 0, 25, 4, { int: true });
        const dt = 0.01, TT = 12, n = Math.round(TT / dt), Lw = RLAW.gam;
        const pv = pmass(Lw.F, dt, n), mU = renewalMass(pv);
        const S = v.stage({ x: [0, TT], y: [0, 1.3], height: 340, full: true, axes: 'box', gutter: true, xlabel: '$t$', title: 'iterates $H_k=h+H_{k-1}*F$ and the solution $h*U_0$' });
        const cache = {};
        let st = null;
        v.render(() => {
          const hk = hSel.value;
          if (!cache[hk]) {
            const h = { tail: (t) => 1 - Lw.F(t), res: (t) => 1 - Lw.F(t + 1), box: (t) => (t <= 1 ? 1 : 0) }[hk];
            const hv = Float64Array.from({ length: n + 1 }, (_, i) => h(i * dt));
            const its = [hv]; for (let k = 1; k <= 25; k++) { const c = convP(its[k - 1], pv); its.push(hv.map((x, i) => x + c[i])); }
            const sol = hv.map((x, i) => { let s = 0; for (let j = 1; j <= i; j++) s += hv[i - j] * mU[j]; return x + s; });
            const lim = { tail: 1, res: simpson((y) => 1 - Lw.F(y), 1, 30, 2000), box: 1 }[hk];
            cache[hk] = { its, sol, lim };
          }
          const C = cache[hk], k = kS.value;
          S.setView(null, [0, Math.max(1.3, ...C.sol) * 1.1]);
          S.hline(C.lim, { color: 'green', width: 1.2, dash: [3, 3] });
          for (let j = 0; j < k; j++) S.path(Array.from(C.its[j], (y, i) => [i * dt, y]), { color: 'accent', width: 1, alpha: 0.25 });
          S.path(Array.from(C.sol, (y, i) => [i * dt, y]), { color: 'ink', width: 1.8, dash: [6, 4] });
          S.path(Array.from(C.its[k], (y, i) => [i * dt, y]), { color: 'accent', width: 2.6 });
          let err = 0; C.its[k].forEach((y, i) => (err = Math.max(err, Math.abs(y - C.sol[i]))));
          v.legend([['accent', `$H_{${k}}$ (earlier iterates faint)`], ['ink', '$h*U_0$', { dash: true }], ['green', 'limit $\\frac1\\mu\\int_0^\\infty h$', { dash: true }]]);
          st = { k, err, lim: C.lim, end: C.sol[n] };
        });
        v.readout(() => st && `$\\sup_{t\\le12}|H_{${st.k}}-h*U_0|=${v.fix(st.err, 4)}$. At $t=12$: $h*U_0=${v.fix(st.end, 4)}$, key renewal limit $\\frac1\\mu\\int_0^\\infty h=${v.fix(st.lim, 4)}$ (the grid $\\Delta t=0.01$ costs about $\\Delta t\\,h(0)/2\\mu$).`);
      },
    },
    {
      num: '2.6.9',
      kind: 'Theorem',
      name: 'Bounded solutions of the renewal equation',
      statement: String.raw`If $h$ is bounded (on bounded intervals), then $H=h*U_0$, i.e. $H(t)=\int_{[0,t]}h(t-s)\,dU_0(s)$, solves the renewal equation $H=h+H*F$, and it is the **unique** solution that is bounded on bounded intervals.`,
      idea: String.raw`$H=h*U_0$ solves the equation because $U_0=\delta_0+U_0*F$. If $H_1,H_2$ are two solutions bounded on $[0,t]$, their difference $D$ satisfies $D=D*F$, hence $D=D*F^{*n}$ for every $n$, and $|D(t)|\le\sup_{[0,t]}|D|\cdot F^{*n}(t)=\sup|D|\cdot P(T_n\le t)\to0$, since $T_n\to\infty$. The same estimate shows that iterating $G\mapsto h+G*F$ from any bounded start converges to $H$.`,
      caption: String.raw`The renewal equation with $h(t)=1-F(t+1)$ and gamma$(2)$ interarrivals. Left: the iterates $G_k=h+G_{k-1}*F$ after $k$ steps from four different bounded starts (zero, the constant $3$, a wave, and the true solution). Right (log scale): $\sup_{t\le10}|G_k-H|$ against $k$ for each start. The error contracts like $P(T_k\le10)$ (dashed), which collapses once $k$ passes $10/\mu$.`,
      deps: ['prob-2.6.4a'],
      tags: ['renewal'],
      viz(v) {
        const kS = v.slider('iterations $k$', 0, 30, 6, { int: true });
        const dt = 0.02, TT = 10, n = Math.round(TT / dt), Lw = RLAW.gam;
        const pv = pmass(Lw.F, dt, n);
        const hv = Float64Array.from({ length: n + 1 }, (_, i) => 1 - Lw.F(i * dt + 1));
        const L = v.stage({ x: [0, TT], y: [-0.2, 3.4], height: 320, weight: 1.3, axes: 'box', gutter: true, xlabel: '$t$', title: 'iterates from four starts' });
        const R = v.stage({ x: [0, 30], y: [1e-8, 10], ylog: true, height: 320, axes: 'box', gutter: true, xlabel: '$k$', title: '$\\sup_{t\\le10}|G_k-H|$' });
        // the solution: iterate long from zero
        let Hs = new Float64Array(n + 1); for (let k = 0; k < 120; k++) { const c = convP(Hs, pv); Hs = hv.map((x, i) => x + c[i]); }
        const starts = [['zero', 'accent', () => 0], ['3', 'orange', () => 3], ['wave', 'purple', (t) => 1.5 + 1.2 * Math.sin(2 * t)], ['solution', 'green', null]];
        const runs = starts.map(([name, col, g]) => { let G = g ? Float64Array.from({ length: n + 1 }, (_, i) => g(i * dt)) : Hs.slice(); const its = [G], err = []; for (let k = 0; k <= 30; k++) { let e = 0; G.forEach((y, i) => (e = Math.max(e, Math.abs(y - Hs[i])))); err.push(e); if (k < 30) { const c = convP(G, pv); G = hv.map((x, i) => x + c[i]); its.push(G); } } return { name, col, its, err }; });
        const PT = Array.from({ length: 31 }, (_, k) => (k === 0 ? 1 : v.M.gammaP(2 * k, 2 * TT))); // T_k ~ gamma(2k, 1/2)
        let st = null;
        v.render(() => {
          const k = kS.value;
          runs.forEach((rn) => L.path(Array.from(rn.its[k], (y, i) => [i * dt, y]), { color: rn.col, width: rn.name === 'solution' ? 3.2 : 1.8, alpha: rn.name === 'solution' ? 0.5 : 1 }));
          runs.forEach((rn) => { if (rn.name !== 'solution') R.path(rn.err.map((e, j) => [j, Math.max(e, 1e-9)]), { color: rn.col, width: 2 }); });
          R.path(PT.map((p, j) => [j, Math.max(p * 3, 1e-9)]), { color: 'muted', dash: [5, 4], width: 1.4 });
          R.vline(k, { color: 'gold', width: 1.4 });
          v.legend([...runs.map((rn) => [rn.col, rn.name === 'solution' ? 'start at $H$' : `start ${rn.name}`]), ['muted', '$3\\,P(T_k\\le10)$', { dash: true }]]);
          st = { k, errs: runs.slice(0, 3).map((rn) => rn.err[k]) };
        });
        v.readout(() => st && `After $k=${st.k}$ iterations the sup errors on $[0,10]$ are ${st.errs.map((e) => '$' + v.sci(e, 2) + '$').join(', ')} (zero start, constant $3$, wave). A solution that is bounded on bounded intervals is pinned down: there is only one.`);
      },
    },
    {
      num: '2.6.11',
      kind: 'Theorem',
      name: 'Cramér’s estimate of ruin',
      credit: 'Lundberg, 1903; Cramér, 1930',
      verify: true,
      statement: String.raw`An insurer starts with capital $x\ge0$, collects premiums at rate $c$, and pays claims $Y_1,Y_2,\dots$ (i.i.d., positive, mean $\nu$) at the jumps of a Poisson process of rate $\lambda$, with $c>\lambda\nu$. Let $\psi(x)$ be the probability that the surplus $x+ct-\sum_{i\le N(t)}Y_i$ ever becomes negative. If there is $\gamma>0$ with
$$\lambda\big(Ee^{\gamma Y}-1\big)=c\gamma$$
(and $E\,Ye^{\gamma Y}<\infty$), then $e^{\gamma x}\psi(x)\to C=\dfrac{c-\lambda\nu}{\lambda E(Ye^{\gamma Y})-c}\in(0,\infty)$ as $x\to\infty$: ruin is exponentially unlikely in the initial capital. For exponential claims $\psi(x)=\frac{\lambda\nu}{c}e^{-(1/\nu-\lambda/c)x}$ exactly.`,
      idea: String.raw`Conditioning on what happens at the first claim (or at the first time the surplus drops below its starting level) shows that $\psi$ satisfies a **defective** renewal equation $\psi=h+\psi*G$ with $G(\infty)=\lambda\nu/c<1$. Multiplying by $e^{\gamma x}$, where $\gamma$ is chosen to make $e^{\gamma y}dG(y)$ a proper probability distribution (this is the equation for $\gamma$), turns it into a genuine renewal equation, and the key renewal theorem (2.6.12, with uniqueness from 2.6.9) gives the limit $C$.`,
      caption: String.raw`Left: 25 seeded surplus paths from capital $x=5$ (red when ruined). Right (log scale): the estimated ruin probability $\psi(x)$ from 6000 seeded paths (gold, with $\pm2$ s.e. bars) against the Cramér–Lundberg line $Ce^{-\gamma x}$ (green). Slide the premium $c$ down to $\lambda\nu$ and $\gamma\to0$: ruin becomes certain. For exponential claims the line is exact; for gamma claims it is the asymptote.`,
      deps: ['prob-2.6.9', 'prob-2.6.12'],
      see: ['stoch-9.12'],
      tags: ['renewal', 'insurance'],
      viz(v) {
        const law = v.select('claims (mean 1)', [{ value: 'exp', label: 'exponential' }, { value: 'gam', label: 'gamma$(2)$' }], 'exp');
        const lS = v.slider('claim rate $\\lambda$', 0.3, 1.5, 1, { step: 0.05 });
        const cS = v.slider('premium rate $c$', 0.5, 3, 1.4, { step: 0.05 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const XM = 20, P = 6000;
        const L = v.stage({ x: [0, 40], y: [-2, 25], height: 320, axes: 'box', gutter: true, xlabel: '$t$', title: 'surplus paths from $x=5$' });
        const R = v.stage({ x: [0, XM], y: [1e-4, 1.2], ylog: true, height: 320, weight: 1.2, axes: 'box', gutter: true, xlabel: 'initial capital $x$', title: 'ruin probability $\\psi(x)$' });
        let cache = null, st = null;
        v.render(() => {
          const lam = lS.value, c = cS.value, lw = law.value, nu = 1;
          const Mg = lw === 'exp' ? (g) => 1 / (1 - g) : (g) => (1 - g / 2) ** -2, dMg = lw === 'exp' ? (g) => 1 / (1 - g) ** 2 : (g) => (1 - g / 2) ** -3, gmax = lw === 'exp' ? 1 : 2;
          const draw = lw === 'exp' ? (r) => -Math.log(1 - r()) : (r) => -0.5 * Math.log((1 - r()) * (1 - r()));
          const safe = c > lam * nu;
          let gam = 0, C = 1;
          if (safe) { let lo = 1e-9, hi = gmax - 1e-9; const fn = (g) => lam * (Mg(g) - 1) - c * g; for (let i = 0; i < 100; i++) { const m = (lo + hi) / 2; if (fn(m) < 0) lo = m; else hi = m; } gam = (lo + hi) / 2; C = (c - lam * nu) / (lam * dMg(gam) - c); }
          const key = [lw, lam, c, seed].join('|');
          if (!cache || cache.key !== key) {
            const r = v.rng(seed * 61 + 5), Ms = new Float64Array(P);
            for (let p = 0; p < P; p++) { let Lk = 0, M = 0; for (let k = 0; k < 4000; k++) { Lk += draw(r) - c * (-Math.log(1 - r()) / lam); if (Lk > M) M = Lk; if (safe && M - Lk > 30 / Math.max(gam, 0.05) + 5) break; if (M > XM + 5) break; } Ms[p] = M; }
            const paths = [], r2 = v.rng(seed * 3 + 1);
            for (let p = 0; p < 25; p++) { const pts = [[0, 5]]; let t = 0, U = 5, ruined = false; while (t < 40) { const w = -Math.log(1 - r2()) / lam, t2 = Math.min(40, t + w); pts.push([t2, U + c * (t2 - t)]); U += c * (t2 - t); t = t2; if (t >= 40) break; U -= draw(r2); pts.push([t, U]); if (U < 0) { ruined = true; break; } } paths.push({ pts, ruined }); }
            cache = { key, Ms: Array.from(Ms).sort((a, b) => a - b), paths };
          }
          const top = Math.max(25, ...cache.paths.map((pp) => Math.max(...pp.pts.map((q) => q[1])))) ; L.setView(null, [-3, Math.min(top, 80)]);
          L.hband(-3, 0, { color: 'red', alpha: 0.1 }); L.hline(0, { color: 'red', width: 1.2 });
          cache.paths.forEach((pp) => { L.path(pp.pts, { color: pp.ruined ? 'red' : 'accent', width: 1.1, alpha: pp.ruined ? 0.85 : 0.45 }); if (pp.ruined) L.dot(...pp.pts[pp.pts.length - 1], { r: 3, color: 'red' }); });
          const surv = (x) => { let lo = 0, hi = P; while (lo < hi) { const m = (lo + hi) >> 1; if (cache.Ms[m] <= x) lo = m + 1; else hi = m; } return (P - lo) / P; };
          if (safe) R.fn((x) => C * Math.exp(-gam * x), { color: 'green', width: 2.4 });
          else R.hline(1, { color: 'red', width: 2.4 });
          for (let x = 0; x <= XM; x += 1) { const p = surv(x), se = Math.sqrt(p * (1 - p) / P); if (p > 0) { R.line(x, Math.max(1e-4, p - 2 * se), x, p + 2 * se, { color: 'gold', width: 1.4 }); R.dot(x, p, { r: 3.5, color: 'gold' }); } }
          if (!safe) cornerIn(R, 'c ≤ λν: ruin is certain', 'bl', { color: 'red' });
          v.legend([['gold', 'simulated $\\psi(x)$', { dot: true }], ['green', '$Ce^{-\\gamma x}$'], ['red', 'ruined paths']]);
          st = { safe, gam, C, p5: surv(5), p10: surv(10), ruined: cache.paths.filter((pp) => pp.ruined).length };
        });
        v.readout(() => st && (st.safe ? `Lundberg exponent $\\gamma=${v.fix(st.gam, 4)}$, $\\ C=${v.fix(st.C, 4)}$. $\\psi(5)$: simulated $${v.fix(st.p5, 4)}$, $Ce^{-5\\gamma}=${v.fix(st.C * Math.exp(-5 * st.gam), 4)}$; $\\psi(10)$: $${v.fix(st.p10, 4)}$ vs $${v.fix(st.C * Math.exp(-10 * st.gam), 4)}$.` : `Premium below the mean claim outflow ($c\\le\\lambda\\nu$): no $\\gamma>0$ exists and $\\psi\\equiv1$.`) + ` Ruined among the 25 drawn paths (by $t=40$): ${st.ruined}.`);
      },
    },
    {
      num: '2.6.12',
      kind: 'Theorem',
      name: 'Key renewal theorem',
      credit: 'Smith, 1954',
      statement: String.raw`Let the interarrival law $F$ be nonarithmetic with mean $\mu$, and let $h\ge0$ be directly Riemann integrable. Then the solution $H=h*U_0$ of the renewal equation satisfies
$$H(t)\to\frac1\mu\int_0^\infty h(s)\,ds\quad\text{as }t\to\infty.$$
Example: the residual life $R_t=T_{N_t+1}-t$ satisfies $P(R_t>x)\to\frac1\mu\int_x^\infty(1-F(y))\,dy$; the interval covering $t$ has the **size-biased** limit law $\frac{y\,dF(y)}{\mu}$, with mean $E\xi^2/\mu\ge\mu$ (the inspection paradox).`,
      idea: String.raw`For $h=1_{[0,a)}$ this is Blackwell's theorem (2.6.4): $H(t)=U_0((t-a,t])\to a/\mu$. Direct Riemann integrability is exactly what allows $h$ to be sandwiched between step functions $\sum_kc_k1_{[k\delta,(k+1)\delta)}$ whose upper and lower sums are close, with tails small enough that Blackwell's theorem can be applied to each step and summed. The residual life solves $H=h+H*F$ with $h(t)=1-F(t+x)$, which is decreasing and integrable, hence d.R.i. (Lemma 2.6.13).`,
      caption: String.raw`6000 seeded renewal processes are run up to time $t$ (slider). Left: histogram of the residual life $R_t$ against the limit density $(1-F(x))/\mu$ (green). Right: histogram of the length of the interval covering $t$, against the size-biased density $xf(x)/\mu$ (green) and the ordinary interarrival density $f$ (dashed). Long intervals are more likely to contain $t$: that is the inspection paradox. For exponential lifetimes the residual law is the same at every $t$ (memorylessness).`,
      deps: ['prob-2.6.9', 'prob-2.6.4', 'prob-2.6.13'],
      see: ['fa-9.13'],
      tags: ['renewal'],
      viz(v) {
        const law = v.select('interarrivals', lawOpts(['unif', 'gam', 'exp', 'par']), 'unif');
        const tS = v.slider('inspection time $t$', 0.3, 40, 20, { log: true, sig: 2 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const P = 6000;
        const L = v.stage({ x: [0, 3], y: [0, 1.2], height: 320, axes: 'box', gutter: true, xlabel: 'residual life $R_t$', title: 'residual life at time $t$' });
        const R = v.stage({ x: [0, 4], y: [0, 1.2], height: 320, axes: 'box', gutter: true, xlabel: 'length of the interval covering $t$', title: 'the inspection paradox' });
        let st = null;
        v.render(() => {
          const Lw = RLAW[law.value], t = tS.value, r = v.rng(seed * 37 + 11), res = [], len = [];
          for (let p = 0; p < P; p++) { let s = 0, x = 0; while (s <= t) { x = Lw.draw(r); s += x; } res.push(s - t); len.push(x); }
          const xm = Lw.xmax, H1 = v.M.histogram(res.filter((x) => x < xm), { bins: 40, range: [0, xm] }), H2 = v.M.histogram(len.filter((x) => x < xm), { bins: 40, range: [0, xm] });
          const sc = (H) => H.counts.map((c) => c / (P * (xm / 40)));
          const d1 = sc(H1), d2 = sc(H2);
          const y1 = Math.max(...d1, 1 / Lw.mu) * 1.15, y2 = Math.max(...d2, ...Array.from({ length: 50 }, (_, i) => (((i + 0.5) / 50) * xm * Lw.f(((i + 0.5) / 50) * xm)) / Lw.mu), ...Array.from({ length: 50 }, (_, i) => Lw.f(((i + 0.5) / 50) * xm))) * 1.15;
          L.setView([0, xm], [0, y1]); R.setView([0, xm], [0, Math.min(y2, 3)]);
          L.hist({ edges: H1.edges, counts: d1 }, { color: 'accent', fillAlpha: 0.35 });
          L.fn((x) => (1 - Lw.F(x)) / Lw.mu, { color: 'green', width: 2.4, n: 400 });
          R.hist({ edges: H2.edges, counts: d2 }, { color: 'orange', fillAlpha: 0.35 });
          R.fn((x) => (x * Lw.f(x)) / Lw.mu, { color: 'green', width: 2.4, n: 400 });
          R.fn((x) => Lw.f(x), { color: 'ink', width: 1.4, dash: [5, 4], n: 400 });
          const mL = len.reduce((a, b) => a + b, 0) / P, mR = res.reduce((a, b) => a + b, 0) / P;
          R.vline(mL, { color: 'orange', width: 1.5 }); R.vline(Lw.mu, { color: 'ink', width: 1, dash: [3, 3] });
          v.legend([['accent', '$R_t$ histogram', { area: true }], ['orange', 'covering-interval histogram', { area: true }], ['green', 'limit densities'], ['ink', '$f$', { dash: true }]]);
          st = { t, mL, mR, EL: Lw.m2 / Lw.mu, ER: Lw.m2 / (2 * Lw.mu) };
        });
        v.readout(() => st && `$t=${v.fix(st.t, 2)}$: mean covering length $${v.fix(st.mL, 3)}$ (limit $E\\xi^2/\\mu=${v.fix(st.EL, 3)}$, while $E\\xi=1$); mean residual life $${v.fix(st.mR, 3)}$ (limit $E\\xi^2/2\\mu=${v.fix(st.ER, 3)}$).`);
      },
    },
    {
      num: '2.6.13',
      kind: 'Lemma',
      name: 'Decreasing integrable h is directly Riemann integrable',
      statement: String.raw`A function $h\ge0$ on $[0,\infty)$ is **directly Riemann integrable** if, with $\overline m_k(\delta)=\sup\{h(x):x\in[k\delta,(k+1)\delta)\}$ and $\underline m_k(\delta)$ the infimum, the upper and lower sums $\overline I(\delta)=\delta\sum_{k\ge0}\overline m_k(\delta)$ and $\underline I(\delta)=\delta\sum_k\underline m_k(\delta)$ are finite and $\overline I(\delta)-\underline I(\delta)\to0$ as $\delta\to0$. **Lemma:** if $h\ge0$ is decreasing and $\int_0^\infty h(x)\,dx<\infty$, then $h$ is directly Riemann integrable.`,
      idea: String.raw`For decreasing $h$ the supremum on $[k\delta,(k+1)\delta)$ is $h(k\delta)$ and the infimum is at least $h((k+1)\delta)$, so the sums telescope: $\overline I(\delta)-\underline I(\delta)\le\delta\,h(0)\to0$, and $\overline I(\delta)\le\delta h(0)+\int_0^\infty h<\infty$. Integrability alone is not enough on an infinite interval: thin tall spikes can have finite total area yet put a full $\delta\cdot(\text{height})$ into the upper sum at every spike.`,
      caption: String.raw`Left: $h$ with its upper (orange) and lower (blue) step functions on the mesh $\delta$. Right (log–log): the upper and lower sums over $[0,\infty)$ against $\delta$, their gap, and the bound $\delta h(0)$. For the decreasing examples the gap shrinks linearly in $\delta$. The spike train (height $1$, width $2^{-n}$ at $x=n$) has area $1$, but each spike adds at least $\delta$ to the upper sum, so the upper sum over $[0,T]$ grows at least like $\delta$ times the number of spikes: it is infinite and the function is not d.R.i.`,
      deps: [],
      see: ['prob-2.6.12'],
      tags: ['renewal', 'analysis'],
      viz(v) {
        const HS = {
          exp: { label: '$e^{-x}$', h: (x) => Math.exp(-x), dec: true, area: 1 },
          poly: { label: '$1/(1+x)^2$', h: (x) => 1 / (1 + x) ** 2, dec: true, area: 1 },
          spike: { label: 'spike train', h: (x) => { const n = Math.round(x); if (n < 1) return 0; const w = 2 ** -n; return Math.max(0, 1 - Math.abs(x - n) / w); }, dec: false, area: 1 },
        };
        const hs = v.select('$h$', Object.entries(HS).map(([value, o]) => ({ value, label: o.label })), 'poly');
        const dS = v.slider('mesh $\\delta$', 0.02, 2, 0.5, { log: true, sig: 2 });
        const L = v.stage({ x: [0, 8], y: [0, 1.1], height: 320, weight: 1.3, axes: 'box', gutter: true, xlabel: '$x$', title: '$h$ with upper and lower step functions' });
        const R = v.stage({ x: [0.02, 2], y: [1e-3, 30], xlog: true, ylog: true, height: 320, axes: 'box', gutter: true, xlabel: '$\\delta$', title: 'upper and lower sums' });
        const sums = (H, d, T = 2000) => {
          const K = Math.ceil(T / d); let up = 0, lo = 0;
          if (H.dec) { for (let k = 0; k < K; k++) { up += H.h(k * d); lo += H.h((k + 1) * d); } const tail = H.label === '$e^{-x}$' ? Math.exp(-T) : 1 / (1 + T); return [up * d + tail, lo * d + tail]; }
          for (let k = 0; k < K; k++) { const a = k * d, b = a + d; up += Math.max(H.h(a), H.h(b - 1e-12), Math.ceil(a) < b && Math.ceil(a) >= 1 ? 1 : 0); }
          return [up * d, 0];
        };
        const memo = {};
        const curves = (key, H) => memo[key] || (memo[key] = H.dec ? logGrid(2, 200, 40).map((x) => [x / 100, ...sums(H, x / 100)]) : [10, 100, 1000].map((T) => logGrid(2, 200, 40).map((x) => [x / 100, sums(H, x / 100, T)[0]])));
        let st = null;
        v.render(() => {
          const H = HS[hs.value], d = dS.value;
          L.fn(H.h, { color: 'ink', width: 2, n: 4000 });
          const K = Math.ceil(8 / d);
          for (let k = 0; k < K; k++) {
            const a = k * d, b = Math.min(8, a + d); let mx = 0, mn = Infinity;
            for (let i = 0; i <= 60; i++) { const y = H.h(a + ((b - a) * i) / 60 - (i === 60 ? 1e-9 : 0)); mx = Math.max(mx, y); mn = Math.min(mn, y); }
            if (!H.dec) { for (let n = Math.max(1, Math.floor(a)); n <= Math.ceil(b); n++) if (n >= a && n < b) mx = 1; }
            L.rect(a, 0, b, mx, { fill: 'orange', fillAlpha: 0.18, color: 'orange', width: 1 });
            L.rect(a, 0, b, mn, { fill: 'accent', fillAlpha: 0.3, stroke: false });
          }
          if (H.dec) {
            const vals = curves(hs.value, H);
            R.setView([0.02, 2], [1e-3, 5]);
            R.path(vals.map((q) => [q[0], q[1]]), { color: 'orange', width: 2.2 });
            R.path(vals.map((q) => [q[0], q[2]]), { color: 'accent', width: 2.2 });
            R.path(vals.map((q) => [q[0], q[1] - q[2]]), { color: 'red', width: 2 });
            R.fn((x) => x * H.h(0), { color: 'muted', dash: [5, 4], width: 1.4 });
            R.hline(H.area, { color: 'green', dash: [3, 3], width: 1.2 });
            R.vline(d, { color: 'gold', width: 1.2 });
            v.legend([['orange', 'upper sum'], ['accent', 'lower sum'], ['red', 'gap'], ['muted', '$\\delta h(0)$', { dash: true }], ['green', '$\\int h$', { dash: true }]]);
            const [up, lo] = sums(H, d);
            st = { dec: true, up, lo, d, h0: H.h(0) };
          } else {
            const Ts = [10, 100, 1000];
            R.setView([0.02, 2], [0.05, 1000]);
            curves(hs.value, H).forEach((c, i) => R.path(c, { color: ['orange', 'red', 'purple'][i], width: 2 }));
            R.hline(1, { color: 'green', dash: [3, 3], width: 1.2 });
            R.vline(d, { color: 'gold', width: 1.2 });
            v.legend([['orange', 'upper sum on $[0,10]$'], ['red', 'on $[0,100]$'], ['purple', 'on $[0,1000]$'], ['green', '$\\int h=1$', { dash: true }]]);
            st = { dec: false, d, ups: Ts.map((T) => [T, sums(H, d, T)[0]]) };
          }
        });
        v.readout(() => st && (st.dec ? `$\\delta=${v.fix(st.d, 3)}$: upper sum $${v.fix(st.up, 4)}$, lower sum $${v.fix(st.lo, 4)}$, gap $${v.fix(st.up - st.lo, 4)}\\le\\delta h(0)=${v.fix(st.d * st.h0, 4)}$.` : `$\\delta=${v.fix(st.d, 3)}$: upper sums over $[0,T]$: ` + st.ups.map(([T, u]) => `$T=${T}$: $${v.fix(u, 1)}$`).join(', ') + `: they grow in proportion to $T$ (at least $\\delta$ per spike), although $\\int h=1$.`));
      },
    },
    // ======================================================================== §2.7 Large deviations
    {
      num: '2.7.1a',
      kind: 'Definition',
      name: 'Moment-generating function',
      verify: true,
      statement: String.raw`The **moment-generating function** of a random variable $X$ is $\varphi(\theta)=Ee^{\theta X}$, defined in $(0,\infty]$ for every real $\theta$; put $\theta_+=\sup\{\theta:\varphi(\theta)<\infty\}$ and $\kappa(\theta)=\log\varphi(\theta)$. Where $\varphi$ is finite near $\theta$, it is smooth with $\varphi^{(k)}(\theta)=E\big(X^ke^{\theta X}\big)$; in particular $\varphi'(0)=EX$, and $\kappa$ is convex, with $\kappa'(\theta)$ and $\kappa''(\theta)$ the mean and variance of the tilted law $e^{\theta x}dF(x)/\varphi(\theta)$.`,
      idea: String.raw`Differentiation under the expectation is justified by dominated convergence on any interval strictly inside where $\varphi$ is finite. Convexity of $\kappa$ is Hölder's inequality: $Ee^{(\lambda\theta_1+(1-\lambda)\theta_2)X}\le\big(Ee^{\theta_1X}\big)^\lambda\big(Ee^{\theta_2X}\big)^{1-\lambda}$. The finiteness of $\varphi$ to the right of $0$ measures how light the right tail is.`,
      caption: String.raw`Choose a law. Left: $\varphi(\theta)$ where it is finite, with the tangent at $0$ of slope $EX$ (orange); the exponential law blows up at $\theta_+=1$, while the "perverted exponential" (density $\propto x^{-3}e^{-x}$ on $[1,\infty)$) stops at $\theta_+=1$ with a finite value. Right: $\kappa=\log\varphi$, visibly convex; drag the gold point to read its slope $\kappa'(\theta)$, the mean of the law tilted by $e^{\theta x}$.`,
      deps: ['prob-1.6.9a'],
      tags: ['large deviations', 'moments'],
      viz(v) {
        const PV = (() => { const I = (b) => simpson((u) => (u <= 0 ? 0 : u * Math.exp(-b / u)), 0, 1, 600), Z = I(1); return (th) => (th > 1 ? Infinity : I(1 - th) / Z); })();
        const LAWS = {
          norm: { label: 'normal', phi: (t) => Math.exp((t * t) / 2), mu: 0, tp: Infinity },
          exp: { label: 'exponential', phi: (t) => (t < 1 ? 1 / (1 - t) : Infinity), mu: 1, tp: 1 },
          bern: { label: 'Bernoulli$(\\frac12)$', phi: (t) => (1 + Math.exp(t)) / 2, mu: 0.5, tp: Infinity },
          pois: { label: 'Poisson$(1)$', phi: (t) => Math.exp(Math.exp(t) - 1), mu: 1, tp: Infinity },
          unif: { label: 'uniform$(0,1)$', phi: (t) => (Math.abs(t) < 1e-8 ? 1 : (Math.exp(t) - 1) / t), mu: 0.5, tp: Infinity },
          perv: { label: 'perverted exponential', phi: PV, mu: null, tp: 1 },
        };
        LAWS.perv.mu = (() => { const d = 1e-4; return (Math.log(PV(d)) - Math.log(PV(-d))) / (2 * d); })();
        const law = v.select('law', Object.entries(LAWS).map(([value, o]) => ({ value, label: o.label })), 'exp');
        const L = v.stage({ x: [-2, 2], y: [0, 6], height: 320, axes: 'box', gutter: true, xlabel: '$\\theta$', title: '$\\varphi(\\theta)=Ee^{\\theta X}$' });
        const R = v.stage({ x: [-2, 2], y: [-1, 3], height: 320, axes: 'box', gutter: true, xlabel: '$\\theta$', title: '$\\kappa(\\theta)=\\log\\varphi(\\theta)$' });
        const H = R.handle(0.5, 0, { color: 'gold', label: 'θ', constrain: (x) => [clampN(x, -1.95, 1.95), 0] });
        let st = null;
        v.render(() => {
          const Lw = LAWS[law.value], tp = Lw.tp, kap = (t) => Math.log(Lw.phi(t));
          const tmax = Math.min(2, tp === 1 ? (law.value === 'exp' ? 0.995 : 1) : 2);
          L.fn((t) => Math.min(Lw.phi(t), 50), { domain: [-2, tmax], color: 'accent', width: 2.4, n: 500 });
          L.fn((t) => 1 + Lw.mu * t, { color: 'orange', width: 1.5, dash: [5, 4] });
          L.dot(0, 1, { r: 4, color: 'orange' });
          if (tp === 1) { L.vline(1, { color: 'red', dash: [4, 3], width: 1.2 }); L.vband(1, 2, { color: 'red', alpha: 0.07 }); if (law.value === 'perv') L.dot(1, Lw.phi(1), { r: 5, color: 'accent' }); cornerIn(L, '$\\varphi=\\infty$ for $\\theta>1$', 'br', { color: 'red' }); }
          const t = Math.min(H.x, tmax - 0.01); H.x = t;
          const k = kap(t), d = 1e-4, k1 = (kap(t + d) - kap(t - d)) / (2 * d), k2 = (kap(t + d) - 2 * k + kap(t - d)) / (d * d);
          const ylo = Math.min(-0.5, kap(-2) - 0.2), yhi = Math.max(1, Math.min(4, kap(tmax) + 0.3));
          R.setView(null, [ylo, yhi]); H.y = k;
          R.fn((s) => kap(s), { domain: [-2, tmax], color: 'accent', width: 2.4, n: 500 });
          R.fn((s) => k + k1 * (s - t), { color: 'gold', width: 1.4, dash: [5, 4] });
          if (tp === 1) R.vline(1, { color: 'red', dash: [4, 3], width: 1.2 });
          v.legend([['accent', '$\\varphi$ / $\\kappa$'], ['orange', 'tangent at $0$: slope $EX$', { dash: true }], ['gold', 'tangent at $\\theta$: slope $\\kappa\'(\\theta)$', { dash: true }]]);
          st = { t, phi: Lw.phi(t), k1, k2, mu: Lw.mu };
        });
        v.readout(() => st && `$EX=\\varphi'(0)=${v.fix(st.mu, 4)}$. At $\\theta=${v.fix(st.t, 3)}$: $\\varphi=${v.fix(st.phi, 4)}$, tilted mean $\\kappa'(\\theta)=${v.fix(st.k1, 4)}$, tilted variance $\\kappa''(\\theta)=${v.fix(st.k2, 4)}\\ge0$.`);
      },
    },
    {
      num: '2.7.1',
      kind: 'Lemma',
      name: 'Superadditive sequences: γₙ/n → sup γₘ/m (Fekete)',
      credit: 'Fekete, 1923',
      statement: String.raw`If $\gamma_{m+n}\ge\gamma_m+\gamma_n$ for all $m,n\ge1$, then
$$\lim_{n\to\infty}\frac{\gamma_n}n=\sup_m\frac{\gamma_m}m\quad(\text{possibly }+\infty).$$
In large deviations it is applied to $\gamma_n=\log P(S_n\ge na)$, which is superadditive because $P(S_{m+n}\ge(m+n)a)\ge P(S_m\ge ma)\,P(S_n\ge na)$ by independence.`,
      idea: String.raw`Clearly $\limsup\gamma_n/n\le\sup_m\gamma_m/m$. Fix $m$ and write $n=km+\ell$ with $0\le\ell<m$; superadditivity gives $\gamma_n\ge k\gamma_m+\gamma_\ell$, so $\gamma_n/n\ge\frac{km}{n}\cdot\frac{\gamma_m}m+\frac{\gamma_\ell}n\to\frac{\gamma_m}m$. Hence $\liminf\gamma_n/n\ge\gamma_m/m$ for every $m$.`,
      caption: String.raw`"Blocks": seeded values $v(1),\dots,v(10)$ and $\gamma_n$ = the best total from cutting $n$ into blocks, which is superadditive by construction. "Coin": $\gamma_n=\log P(S_n\ge0.7n)$ for fair coin flips (exact). The plot shows $\gamma_n/n$ (blue) and its running supremum (green); both climb to $\sup_m\gamma_m/m$ (dashed), which for the coin is $-I(0.7)$, Cramér's rate.`,
      deps: [],
      see: ['prob-2.7.7'],
      tags: ['large deviations', 'subadditivity'],
      viz(v) {
        const mode = v.select('sequence', [{ value: 'blocks', label: 'blocks' }, { value: 'coin', label: 'coin: $\\log P(S_n\\ge0.7n)$' }], 'blocks');
        let seed = 1; v.button('Resample blocks', () => { seed++; });
        const NMAX = 300;
        const S = v.stage({ x: [1, NMAX], y: [-0.5, 1], height: 340, full: true, axes: 'box', gutter: true, xlabel: '$n$', title: '$\\gamma_n/n$ and its running supremum' });
        let st = null;
        v.render(() => {
          let g = new Float64Array(NMAX + 1), lim, vals = null;
          if (mode.value === 'blocks') {
            const r = v.rng(seed * 17 + 3); vals = Array.from({ length: 10 }, (_, i) => (i + 1) * (0.3 + 0.4 * r()) - 0.5 * r());
            for (let n = 1; n <= NMAX; n++) { let b = -Infinity; for (let k = 1; k <= Math.min(10, n); k++) b = Math.max(b, vals[k - 1] + (n - k > 0 ? g[n - k] : 0)); g[n] = b; }
            lim = Math.max(...vals.map((x, i) => x / (i + 1)));
          } else {
            for (let n = 1; n <= NMAX; n++) { const k0 = Math.ceil(0.7 * n - 1e-9), terms = []; for (let k = k0; k <= n; k++) terms.push(v.M.lgamma(n + 1) - v.M.lgamma(k + 1) - v.M.lgamma(n - k + 1) - n * Math.LN2); g[n] = lse(terms); }
            lim = -(0.7 * Math.log(1.4) + 0.3 * Math.log(0.6));
          }
          let viol = 0; for (let m = 1; m <= 60; m++) for (let n = 1; n + m <= NMAX && n <= 60; n++) if (g[m + n] < g[m] + g[n] - 1e-9) viol++;
          const ratio = []; let sup = -Infinity; const sups = [];
          for (let n = 1; n <= NMAX; n++) { const q = g[n] / n; ratio.push([n, q]); sup = Math.max(sup, q); sups.push([n, sup]); }
          const lo = Math.min(...ratio.map((q) => q[1])), hi = Math.max(lim, sup);
          S.setView(null, [lo - 0.08 * (hi - lo), hi + 0.12 * (hi - lo)]);
          S.hline(lim, { color: 'muted', width: 1.5, dash: [6, 4] });
          S.path(sups, { color: 'green', width: 2 });
          S.path(ratio, { color: 'accent', width: 1.8 });
          S.dots(ratio.filter((q, i) => i < 40), { r: 2.4, color: 'accent' });
          v.legend([['accent', '$\\gamma_n/n$'], ['green', '$\\max_{m\\le n}\\gamma_m/m$'], ['muted', '$\\sup_m\\gamma_m/m$', { dash: true }]]);
          st = { lim, last: ratio[NMAX - 1][1], viol, vals, coin: mode.value === 'coin' };
        });
        v.readout(() => st && (st.coin ? '' : `Block values $v(k)$: ${st.vals.map((x) => v.fix(x, 2)).join(', ')}. `) + `Superadditivity violations among $m,n\\le60$: ${st.viol}. $\\gamma_{300}/300=${v.fix(st.last, 4)}$, $\\ \\sup_m\\gamma_m/m=${v.fix(st.lim, 4)}$` + (st.coin ? ' $=-I(0.7)$.' : '.'));
      },
    },
    {
      num: '2.7.2',
      kind: 'Lemma',
      name: 'Chernoff exponent is positive above the mean',
      credit: 'Chernoff, 1952',
      statement: String.raw`Let $X_1,X_2,\dots$ be i.i.d. with mean $\mu$ and $\varphi(\theta)=Ee^{\theta X_1}<\infty$ for some $\theta>0$. For every $\theta>0$,
$$P(S_n\ge na)\le e^{-n(a\theta-\kappa(\theta))},$$
and if $a>\mu$ then $a\theta-\kappa(\theta)>0$ for all small $\theta>0$. Hence $P(S_n\ge na)$ decays exponentially fast in $n$.`,
      idea: String.raw`Markov's inequality applied to $e^{\theta S_n}$ (exponential Chebyshev) gives $P(S_n\ge na)\le e^{-\theta na}Ee^{\theta S_n}=e^{-\theta na}\varphi(\theta)^n$, using independence. The function $g(\theta)=a\theta-\kappa(\theta)$ has $g(0)=0$ and $g'(0)=a-\kappa'(0)=a-\mu>0$, so it is positive just to the right of $0$. Optimizing over $\theta$ gives the best such exponent, the Legendre transform $I(a)=\sup_\theta(a\theta-\kappa(\theta))$.`,
      caption: String.raw`Left: $g(\theta)=a\theta-\kappa(\theta)$ for the chosen law and level $a$; it leaves $0$ with slope $a-\mu$ (orange) and peaks at $I(a)$ (green). Drag the gold $\theta$. Right: the law of $S_n/n$ ($n=10$; bars, log scale) under the indicator $1\{x\ge a\}$ (red) and the exponential majorant $e^{n\theta(x-a)}$ (gold), whose expectation is the bound $e^{-n\,g(\theta)}$.`,
      deps: ['prob-2.7.1a'],
      tags: ['large deviations'],
      viz(v) {
        const M = v.M, n = 10;
        const LAWS = {
          bern: { label: 'Bernoulli$(\\frac12)$', mu: 0.5, kap: (t) => Math.log((1 + Math.exp(t)) / 2), a: [0.55, 0.95], pmf: () => Array.from({ length: n + 1 }, (_, k) => [k / n, Math.exp(M.lgamma(n + 1) - M.lgamma(k + 1) - M.lgamma(n - k + 1) - n * Math.LN2)]) },
          pois: { label: 'Poisson$(1)$', mu: 1, kap: (t) => Math.exp(t) - 1, a: [1.1, 3], pmf: () => Array.from({ length: 41 }, (_, k) => [k / n, Math.exp(k * Math.log(n) - n - M.lgamma(k + 1))]) },
          exp: { label: 'exponential', mu: 1, kap: (t) => (t < 1 ? -Math.log(1 - t) : Infinity), a: [1.1, 3], tmax: 0.98, dens: (x) => (x <= 0 ? 0 : Math.exp((n - 1) * Math.log(n * x) - n * x - M.lgamma(n)) * n) },
          norm: { label: 'normal', mu: 0, kap: (t) => (t * t) / 2, a: [0.1, 2], dens: (x) => Math.sqrt(n / (2 * Math.PI)) * Math.exp(-(n * x * x) / 2) },
        };
        const law = v.select('law', Object.entries(LAWS).map(([value, o]) => ({ value, label: o.label })), 'bern');
        const aS = v.slider('level $a$ (fraction of the range)', 0.05, 1, 0.4, { step: 0.01 });
        const L = v.stage({ x: [0, 3], y: [-0.2, 0.5], height: 320, axes: 'box', gutter: true, xlabel: '$\\theta$', title: '$g(\\theta)=a\\theta-\\kappa(\\theta)$' });
        const R = v.stage({ x: [0, 1], y: [1e-5, 10], ylog: true, height: 320, weight: 1.1, axes: 'box', gutter: true, xlabel: '$x=S_n/n$', title: 'law of $S_{10}/10$, indicator and majorant' });
        const H = L.handle(0.3, 0, { color: 'gold', label: 'θ', labelPos: 's', constrain: (x) => [clampN(x, 0.01, 2.95), 0] });
        let st = null;
        v.render(() => {
          const Lw = LAWS[law.value], a = Lw.a[0] + aS.value * (Lw.a[1] - Lw.a[0]), tmax = Lw.tmax || 3;
          const g = (t) => a * t - Lw.kap(t), [I, ta] = legendre(Lw.kap, a, tmax);
          const th = Math.min(H.x, tmax, 0.98 * Math.min(tmax, Math.max(3 * ta, 0.5))); H.x = th; H.y = g(th);
          const tv = Math.min(tmax, Math.max(3 * ta, 0.5)), ys = Array.from({ length: 200 }, (_, i) => g((i / 199) * tv)).filter(isFinite);
          L.setView([0, tv], [Math.max(Math.min(-0.05, Math.min(...ys)) * 1.1, -2 * I - 0.05), I * 1.4 + 0.02]);
          L.hline(0, { color: 'muted', width: 1 });
          L.fn(g, { domain: [0, tv], color: 'accent', width: 2.4 });
          L.fn((t) => (a - Lw.mu) * t, { domain: [0, tv * 0.6], color: 'orange', width: 1.4, dash: [5, 4] });
          L.dot(ta, I, { r: 5, color: 'green', label: 'I(a)', labelPos: 'n' });
          // right panel
          const xr = law.value === 'bern' ? [0, 1] : law.value === 'norm' ? [-1.2, Math.max(2, a + 0.5)] : [0, Math.max(3, a + 0.5)];
          R.setView(xr, [1e-6, 10]);
          let ptail = 0;
          if (Lw.pmf) { Lw.pmf().forEach(([x, p]) => { if (x <= xr[1] && p > 1e-7) { R.line(x, 1e-6, x, p, { color: x >= a - 1e-9 ? 'red' : 'accent', width: 3 }); } if (x >= a - 1e-9) ptail += p; }); }
          else { R.fn((x) => Math.max(1e-7, Lw.dens(x)), { domain: xr, color: 'accent', width: 2, n: 400 }); ptail = simpson((x) => Lw.dens(x), a, xr[1] + 10, 4000); }
          R.path([[xr[0], 1e-6], [a, 1e-6], [a, 1], [xr[1], 1]], { color: 'red', width: 2 });
          R.fn((x) => Math.exp(n * th * (x - a)), { domain: xr, color: 'gold', width: 2.2 });
          v.legend([['accent', '$g$ / law of $S_n/n$'], ['orange', 'slope $a-\\mu$ at $0$', { dash: true }], ['red', '$1\\{x\\ge a\\}$'], ['gold', '$e^{n\\theta(x-a)}$']]);
          st = { a, th, g: g(th), I, ta, ptail, mu: Lw.mu };
        });
        v.readout(() => st && `$a=${v.fix(st.a, 3)}>\\mu=${v.fix(st.mu, 2)}$. At $\\theta=${v.fix(st.th, 3)}$: $g=${v.fix(st.g, 4)}$, bound $e^{-10g}=${v.sci(Math.exp(-10 * st.g), 3)}$; best $\\theta_a=${v.fix(st.ta, 3)}$ gives $e^{-10I(a)}=${v.sci(Math.exp(-10 * st.I), 3)}$; exact $P(S_{10}\\ge10a)=${v.sci(st.ptail, 3)}$.`);
      },
    },
    {
      num: '2.7.7',
      kind: 'Theorem',
      name: 'Cramér’s theorem (large deviations)',
      credit: 'Cramér, 1938; Chernoff, 1952',
      verify: true,
      statement: String.raw`Let $X_1,X_2,\dots$ be i.i.d. with mean $\mu$, $\varphi(\theta)=Ee^{\theta X_1}<\infty$ for some $\theta>0$, and $\kappa=\log\varphi$. Let $a>\mu$ and suppose there is $\theta_a$ with $0<\theta_a<\theta_+$ and $\kappa'(\theta_a)=a$ (the law tilted by $e^{\theta_a x}$ has mean $a$). Then
$$\lim_{n\to\infty}\frac1n\log P(S_n\ge na)=-\big(a\theta_a-\kappa(\theta_a)\big)=-I(a),$$
where $I(a)=\sup_\theta\big(a\theta-\kappa(\theta)\big)$ is the **rate function** (the Legendre transform of $\kappa$).`,
      idea: String.raw`The limit exists by superadditivity (Lemma 2.7.1). The upper bound $P(S_n\ge na)\le e^{-nI(a)}$ is Chernoff's (Lemma 2.7.2), optimized at $\theta_a$. For the lower bound, change measure to the tilted law (Lemma 2.7.8): under it $S_n/n\to a$, so the event $\{na\le S_n\le n(a+\eps)\}$ has tilted probability bounded below (central limit theorem or the weak law), and undoing the tilt costs a factor about $e^{-n(\theta_a(a+\eps)-\kappa(\theta_a))}$. Let $\eps\to0$.`,
      caption: String.raw`Left (log scale): $P(S_n\ge na)$ against $n$, computed exactly (blue), estimated from 20000 seeded samples where it is large enough (gold, $\pm2$ s.e.), and Cramér's $e^{-nI(a)}$ (dashed): the slopes agree, the gap being a slowly varying factor of order $1/\sqrt n$. Right: the rate function $I$ (green) and the finite-$n$ exponents $-\frac1n\log P(S_n\ge nx)$ for $n=10,40,160$, descending onto it.`,
      deps: ['prob-2.7.1', 'prob-2.7.2', 'prob-1.6.4', 'prob-2.7.8'],
      see: ['algo-12.18'],
      tags: ['large deviations'],
      viz(v) {
        const M = v.M;
        const LAWS = {
          coin: { label: 'coin $\\{0,1\\}$', mu: 0.5, ar: [0.5, 1], I: (a) => (a >= 1 ? Math.LN2 : a * Math.log(2 * a) + (1 - a) * Math.log(2 * (1 - a))), lp: (n, a) => { const k0 = Math.ceil(n * a - 1e-9), t = []; for (let k = k0; k <= n; k++) t.push(M.lgamma(n + 1) - M.lgamma(k + 1) - M.lgamma(n - k + 1) - n * Math.LN2); return t.length ? lse(t) : -Infinity; }, draw: (r) => (r() < 0.5 ? 1 : 0) },
          norm: { label: 'normal', mu: 0, ar: [0, 1.5], I: (a) => (a * a) / 2, lp: (n, a) => logPhiBar(a * Math.sqrt(n), M), draw: (r) => r.normal() },
          exp: { label: 'exponential', mu: 1, ar: [1, 3], I: (a) => a - 1 - Math.log(a), lp: (n, a) => { const x = n * a, t = []; for (let k = 0; k < n; k++) t.push(k * Math.log(x) - M.lgamma(k + 1)); return -x + lse(t); }, draw: (r) => -Math.log(1 - r()) },
          pois: { label: 'Poisson$(1)$', mu: 1, ar: [1, 3], I: (a) => a * Math.log(a) - a + 1, lp: (n, a) => { const k0 = Math.ceil(n * a - 1e-9), t = []; for (let k = k0; k <= k0 + 60 + 6 * Math.sqrt(n * a); k++) t.push(k * Math.log(n) - n - M.lgamma(k + 1)); return lse(t); }, draw: (r) => { let k = 0, p = Math.exp(-1), s = p; const u = r(); while (u > s) { k++; p /= k; s += p; } return k; } },
        };
        const law = v.select('law', Object.entries(LAWS).map(([value, o]) => ({ value, label: o.label })), 'coin');
        const aS = v.slider('level $a$ (fraction of the range)', 0.05, 0.9, 0.4, { step: 0.01 });
        const NMAX = 200, NS = [5, 10, 15, 20, 30, 45, 60];
        const L = v.stage({ x: [1, NMAX], y: [1e-30, 1], ylog: true, height: 330, weight: 1.2, axes: 'box', gutter: true, xlabel: '$n$', title: '$P(S_n\\ge na)$' });
        const R = v.stage({ x: [0.5, 1], y: [0, 0.8], height: 330, axes: 'box', gutter: true, xlabel: '$x$', title: 'rate function $I(x)$ and $-\\frac1n\\log P(S_n\\ge nx)$' });
        let mc = null, st = null;
        v.render(() => {
          const Lw = LAWS[law.value], a = Lw.ar[0] + aS.value * (Lw.ar[1] - Lw.ar[0]), I = Lw.I(a);
          const ex = []; for (let n = 1; n <= NMAX; n++) ex.push([n, Math.exp(Lw.lp(n, a))]);
          const floor = Math.max(1e-300, Math.min(...ex.map((q) => q[1]).filter((x) => x > 0), Math.exp(-NMAX * I)) / 5);
          setLogY(L, v, floor, 1.5);
          L.fn((n) => Math.exp(-n * I), { color: 'muted', width: 1.6, dash: [6, 4] });
          L.path(ex.map(([n, p]) => [n, p > 0 ? p : null]), { color: 'accent', width: 2.4 });
          const key = law.value + a;
          if (!mc || mc.key !== key) { const r = v.rng(97), pts = []; for (const n of NS) { let c = 0; for (let i = 0; i < 20000; i++) { let s = 0; for (let j = 0; j < n; j++) s += Lw.draw(r); if (s >= n * a - 1e-9) c++; } pts.push([n, c / 20000, c]); } mc = { key, pts }; }
          mc.pts.forEach(([n, p, c]) => { if (c >= 3) { const se = Math.sqrt(p * (1 - p) / 20000); L.line(n, Math.max(floor, p - 2 * se), n, p + 2 * se, { color: 'gold', width: 1.4 }); L.dot(n, p, { r: 4, color: 'gold' }); } });
          // right panel
          R.setView([Lw.ar[0], Lw.ar[1]], [0, Lw.I(Lw.ar[1] - 1e-6) * 1.15 + 0.02]);
          R.fn(Lw.I, { domain: [Lw.ar[0], Lw.ar[1] - 1e-6], color: 'green', width: 2.6, n: 300 });
          [[10, 'orange'], [40, 'purple'], [160, 'teal']].forEach(([n, col]) => { const pts = []; for (let i = 1; i <= 80; i++) { const x = Lw.ar[0] + (i / 80) * (Lw.ar[1] - Lw.ar[0]) * 0.995; const lp = Lw.lp(n, x); if (isFinite(lp)) pts.push([x, -lp / n]); } R.path(pts, { color: col, width: 1.6 }); });
          R.dot(a, I, { r: 5, color: 'gold' });
          v.legend([['accent', 'exact'], ['gold', 'simulated', { dot: true }], ['muted', '$e^{-nI(a)}$', { dash: true }], ['green', '$I$'], ['orange', '$n=10$'], ['purple', '$n=40$'], ['teal', '$n=160$']]);
          st = { a, I, r200: -Math.log(ex[NMAX - 1][1]) / NMAX, r50: -Math.log(ex[49][1]) / 50 };
        });
        v.readout(() => st && `$a=${v.fix(st.a, 3)}$: $I(a)=${v.fix(st.I, 5)}$; $\\ -\\frac1n\\log P(S_n\\ge na)=${v.fix(st.r50, 5)}$ at $n=50$ and $${v.fix(st.r200, 5)}$ at $n=200$, converging from above.`);
      },
    },
    {
      num: '2.7.8',
      kind: 'Lemma',
      name: 'Exponential tilting changes the law of Sₙ',
      statement: String.raw`For $\lambda$ with $\varphi(\lambda)<\infty$, let $F_\lambda$ be the **tilted** distribution $dF_\lambda(x)=e^{\lambda x}dF(x)/\varphi(\lambda)$. If $S_n$ is a sum of $n$ i.i.d. variables with law $F$ and $S_n^\lambda$ a sum of $n$ i.i.d. variables with law $F_\lambda$, then their laws $F^{*n}$ and $F_\lambda^{*n}$ are mutually absolutely continuous with
$$\frac{dF^{*n}_\lambda}{dF^{*n}}(x)=\frac{e^{\lambda x}}{\varphi(\lambda)^n}.$$
The tilted law has mean $\kappa'(\lambda)$, so choosing $\lambda=\theta_a$ moves the mean of $S_n/n$ to $a$.`,
      idea: String.raw`For $n=1$ this is the definition. For general $n$ compare the joint laws of $(X_1,\dots,X_n)$: the density of the tilted product measure with respect to the original is $\prod_ie^{\lambda x_i}/\varphi(\lambda)=e^{\lambda\sum x_i}/\varphi(\lambda)^n$, a function of the sum only, and integrating over $\{\sum x_i\in A\}$ gives the claim. Turned around, $P(S_n\ge na)=\varphi(\lambda)^nE\big(e^{-\lambda S_n^\lambda};S_n^\lambda\ge na\big)$, which is how rare events are simulated efficiently (importance sampling).`,
      caption: String.raw`Left: the original density (ink) and the tilted density with $\lambda=\theta_a$ (blue, with a histogram of 4000 tilted samples): its mean sits at $a$ instead of $\mu$. Right (log–log): estimates of $P(S_n\ge na)$ as the number of samples grows: plain Monte Carlo (red) sees the event rarely or never, while the reweighted tilted samples (gold) lock onto the exact value (green) after a few hundred samples.`,
      deps: ['prob-2.7.1a', 'prob-1.6.9'],
      see: ['prob-2.7.7'],
      tags: ['large deviations', 'change of measure'],
      viz(v) {
        const M = v.M;
        const LAWS = {
          exp: { label: 'exponential', mu: 1, ar: [1.2, 3], kap: (t) => -Math.log(1 - t), tmax: 0.999, f: (x) => (x < 0 ? 0 : Math.exp(-x)), ft: (x, l) => (x < 0 ? 0 : (1 - l) * Math.exp(-(1 - l) * x)), draw: (r) => -Math.log(1 - r()), drawT: (r, l) => -Math.log(1 - r()) / (1 - l), x: [0, 6], lp: (n, a) => { const x = n * a, t = []; for (let k = 0; k < n; k++) t.push(k * Math.log(x) - M.lgamma(k + 1)); return -x + lse(t); } },
          unif: { label: 'uniform$(0,1)$', mu: 0.5, ar: [0.55, 0.85], kap: (t) => (Math.abs(t) < 1e-9 ? 0 : t + Math.log((1 - Math.exp(-t)) / t)), tmax: 60, f: (x) => (x >= 0 && x <= 1 ? 1 : 0), ft: (x, l) => (x >= 0 && x <= 1 ? (l * Math.exp(l * x)) / Math.expm1(l) : 0), draw: (r) => r(), drawT: (r, l) => Math.log1p(r() * Math.expm1(l)) / l, x: [0, 1], lp: (n, a) => irwinHallLogTail(n, Math.round(a * 1000) / 1000) },
        };
        const law = v.select('law', Object.entries(LAWS).map(([value, o]) => ({ value, label: o.label })), 'unif');
        const aS = v.slider('level $a$ (fraction of the range)', 0, 1, 0.5, { step: 0.02 });
        const nS = v.slider('$n$', 5, 60, 30, { int: true });
        let seed = 1; v.button('Resample', () => { seed++; });
        const L = v.stage({ x: [0, 1], y: [0, 3], height: 320, axes: 'box', gutter: true, xlabel: '$x$', title: 'original and tilted densities' });
        const R = v.stage({ x: [10, 20000], y: [1e-12, 1], xlog: true, ylog: true, height: 320, weight: 1.2, axes: 'box', gutter: true, xlabel: 'number of samples $m$', title: 'estimating $P(S_n\\ge na)$' });
        let st = null;
        v.render(() => {
          const Lw = LAWS[law.value], a = Math.round((Lw.ar[0] + aS.value * (Lw.ar[1] - Lw.ar[0])) * 1000) / 1000, n = nS.value;
          const [I, lam] = legendre(Lw.kap, a, Lw.tmax), exact = Math.exp(Lw.lp(n, a));
          const r = v.rng(seed * 31 + 7), tilt = Array.from({ length: 4000 }, () => Lw.drawT(r, lam));
          const H = M.histogram(tilt.filter((x) => x <= Lw.x[1]), { bins: 40, range: Lw.x });
          const dens = H.counts.map((c) => c / (4000 * ((Lw.x[1] - Lw.x[0]) / 40)));
          L.setView(Lw.x, [0, Math.max(1.2, ...dens) * 1.15]);
          L.hist({ edges: H.edges, counts: dens }, { color: 'accent', fillAlpha: 0.25 });
          L.fn(Lw.f, { color: 'ink', width: 2, n: 400 });
          L.fn((x) => Lw.ft(x, lam), { color: 'accent', width: 2.4, n: 400 });
          L.vline(Lw.mu, { color: 'ink', dash: [4, 3], width: 1.2 }); L.vline(a, { color: 'accent', dash: [4, 3], width: 1.6 });
          L.text('μ', Lw.mu, L.yr[1] * 0.92, { color: 'ink', size: 13, dx: 4 }); L.text('a', a, L.yr[1] * 0.92, { color: 'accent', size: 13, dx: 4 });
          // estimates
          const ms = logGrid(10, 20000, 60), naive = [], is = []; let cn = 0, sw = 0, j = 0;
          const lphi = Lw.kap(lam);
          for (let m = 1; m <= 20000; m++) {
            let s = 0; for (let i = 0; i < n; i++) s += Lw.draw(r); if (s >= n * a) cn++;
            let t = 0; for (let i = 0; i < n; i++) t += Lw.drawT(r, lam); if (t >= n * a) sw += Math.exp(-lam * t + n * lphi);
            if (m === ms[j]) { naive.push([m, cn / m]); is.push([m, sw / m]); j++; }
          }
          const lo = Math.min(exact / 30, 1e-3);
          setLogY(R, v, lo, 1);
          R.hline(exact, { color: 'green', width: 2, dash: [7, 4] });
          R.path(naive.map(([m, p]) => [m, p > 0 ? p : null]), { color: 'red', width: 2 });
          R.path(is.map(([m, p]) => [m, p > 0 ? p : null]), { color: 'gold', width: 2.4 });
          if (cn === 0) cornerIn(R, 'plain Monte Carlo: no hits at all', 'bl', { color: 'red' });
          v.legend([['ink', 'original $f$'], ['accent', 'tilted $f_\\lambda$'], ['red', 'plain MC'], ['gold', 'tilted + reweighted'], ['green', 'exact', { dash: true }]]);
          st = { a, lam, n, exact, naive: cn / 20000, is: sw / 20000, mean: tilt.reduce((x, y) => x + y, 0) / 4000 };
        });
        v.readout(() => st && `$a=${v.fix(st.a, 3)}$, $\\lambda=\\theta_a=${v.fix(st.lam, 4)}$; tilted sample mean $${v.fix(st.mean, 4)}$. $P(S_{${st.n}}\\ge${st.n}a)$: exact $${v.sci(st.exact, 4)}$, tilted estimate $${v.sci(st.is, 4)}$, plain estimate $${st.naive > 0 ? v.sci(st.naive, 3) : '0'}$ (from 20000 samples each).`);
      },
    },
    {
      num: '2.7.9',
      kind: 'Theorem',
      name: 'Large deviations for bounded support',
      verify: true,
      statement: String.raw`Suppose $X_1$ is bounded above, with $x_0=\sup\{x:P(X_1>x)>0\}<\infty$ (so $\varphi(\theta)<\infty$ for all $\theta>0$). Then for every $a\in(\mu,x_0)$ the equation $\kappa'(\theta)=a$ has a solution and Cramér's limit $\frac1n\log P(S_n\ge na)\to-I(a)$ holds. At the edge, $P(S_n\ge nx_0)=P(X_1=x_0)^n$, so the rate is $I(x_0)=-\log P(X_1=x_0)$ (infinite if there is no atom), and $P(S_n\ge na)=0$ for $a>x_0$.`,
      idea: String.raw`For bounded $X$, $\kappa'(\theta)$, the mean of the tilted law, increases continuously from $\mu$ to $x_0$ as $\theta$ runs over $(0,\infty)$, because tilting by $e^{\theta x}$ with $\theta\to\infty$ pushes all the mass towards $x_0$. So every $a<x_0$ is reached and Theorem 2.7.7 applies. The edge is a direct computation: $S_n\ge nx_0$ forces every $X_i=x_0$.`,
      caption: String.raw`Three laws on $[0,1]$: uniform (no atom at $x_0=1$), the uniform law on $\{0,\frac14,\dots,1\}$ (atom $\frac15$ at $1$) and a fair coin (atom $\frac12$). Left: their rate functions on $[\mu,1]$; the uniform one blows up at $1$, the others end at $\log5$ and $\log2$ (dots). Right: the exact exponents $-\frac1n\log P(S_n\ge na)$ (Irwin–Hall formula in exact integer arithmetic for the uniform law) against $n$, approaching $I(a)$ (dashed) for the level $a$ you set; at $a=1$ the discrete laws sit exactly on their limit for every $n$.`,
      deps: ['prob-2.7.7'],
      tags: ['large deviations'],
      viz(v) {
        const M = v.M;
        const LAWS = {
          unif: { label: 'uniform$[0,1]$', col: 'accent', kap: (t) => (Math.abs(t) < 1e-9 ? 0 : t + Math.log((1 - Math.exp(-t)) / t)), Iedge: Infinity, lp: (n, a) => irwinHallLogTail(n, a) },
          five: { label: '$\\{0,\\frac14,\\dots,1\\}$', col: 'orange', kap: (t) => Math.log((1 + Math.exp(t / 4) + Math.exp(t / 2) + Math.exp((3 * t) / 4) + Math.exp(t)) / 5), Iedge: Math.log(5), lp: (n, a) => { let p = [1]; for (let i = 0; i < n; i++) { const q = new Array(p.length + 4).fill(0); p.forEach((x, s) => { for (let j = 0; j < 5; j++) q[s + j] += x / 5; }); p = q; } const s0 = Math.ceil(4 * n * a - 1e-9); let t = 0; for (let s = s0; s < p.length; s++) t += p[s]; return t > 0 ? Math.log(t) : -Infinity; } },
          coin: { label: 'coin $\\{0,1\\}$', col: 'purple', kap: (t) => Math.log((1 + Math.exp(t)) / 2), Iedge: Math.LN2, lp: (n, a) => { const k0 = Math.ceil(n * a - 1e-9), t = []; for (let k = k0; k <= n; k++) t.push(M.lgamma(n + 1) - M.lgamma(k + 1) - M.lgamma(n - k + 1) - n * Math.LN2); return t.length ? lse(t) : -Infinity; } },
        };
        const law = v.select('law (right panel)', Object.entries(LAWS).map(([value, o]) => ({ value, label: o.label })), 'unif');
        const aS = v.slider('level $a$', 0.55, 1, 0.9, { step: 0.01 });
        const NMAX = 80;
        const L = v.stage({ x: [0.5, 1], y: [0, 3.2], height: 330, axes: 'box', gutter: true, xlabel: '$a$', title: 'rate functions $I(a)$' });
        const R = v.stage({ x: [1, NMAX], y: [0, 3], height: 330, weight: 1.2, axes: 'box', gutter: true, xlabel: '$n$', title: '$-\\frac1n\\log P(S_n\\ge na)$' });
        const cache = {};
        let st = null;
        v.render(() => {
          const a = aS.value;
          Object.entries(LAWS).forEach(([k, Lw]) => {
            const pts = []; for (let i = 1; i <= 120; i++) { const x = 0.5 + (i / 121) * 0.5; pts.push([x, legendre(Lw.kap, x, 400)[0]]); }
            L.path(pts.filter((p) => p[1] < 3.3), { color: Lw.col, width: k === law.value ? 3 : 1.6 });
            if (isFinite(Lw.Iedge)) L.dot(1, Lw.Iedge, { r: 5, color: Lw.col }); else L.arrow(0.985, 2.7, 0.995, 3.15, { color: Lw.col, width: 1.6 });
          });
          L.vline(a, { color: 'gold', width: 1.4, dash: [4, 3] });
          const Lw = LAWS[law.value], key = law.value + a;
          if (!cache[key]) { const pts = []; for (let n = 1; n <= NMAX; n++) { const lp = Lw.lp(n, a); pts.push([n, isFinite(lp) ? -lp / n : null]); } cache[key] = pts; }
          const Ia = a >= 1 ? Lw.Iedge : legendre(Lw.kap, a, 400)[0];
          const pts = cache[key], fin = pts.filter((p) => p[1] != null).map((p) => p[1]);
          R.setView(null, [0, Math.max(isFinite(Ia) ? Ia * 1.4 : 1, ...fin.slice(4)) * 1.1 + 0.05]);
          if (isFinite(Ia)) R.hline(Ia, { color: 'green', width: 1.8, dash: [7, 4] });
          R.path(pts, { color: Lw.col, width: 2.4 });
          R.dots(pts.filter((p) => p[1] != null && p[0] % 5 === 0), { r: 3, color: Lw.col });
          if (!fin.length) cornerIn(R, 'P(Sₙ ≥ na) = 0 for every n: rate ∞', 'tr', { color: 'red' });
          v.legend([...Object.values(LAWS).map((o) => [o.col, o.label]), ['green', '$I(a)$', { dash: true }]]);
          st = { a, Ia, last: pts[NMAX - 1][1] };
        });
        v.readout(() => st && `$a=${v.fix(st.a, 2)}$: $I(a)=${isFinite(st.Ia) ? v.fix(st.Ia, 4) : '\\infty'}$; at $n=80$ the exact exponent is $${st.last != null ? v.fix(st.last, 4) : '\\infty'}$.`);
      },
    },
    {
      num: '2.7.10',
      kind: 'Theorem',
      name: 'Linear rate function beyond the critical point',
      verify: true,
      statement: String.raw`Suppose $x_0=\infty$, $\theta_+<\infty$, $\varphi(\theta_+)<\infty$, and $a_0=\kappa'(\theta_+)=\varphi'(\theta_+)/\varphi(\theta_+)<\infty$ (the left derivative). Then for $a>a_0$
$$\frac1n\log P(S_n\ge na)\to-\big(a\theta_+-\kappa(\theta_+)\big),$$
so the rate function becomes a straight line of slope $\theta_+$ beyond $a_0$. Example: the "perverted exponential" with density $Cx^{-3}e^{-x}$ on $[1,\infty)$, where $\theta_+=1$ and $a_0=2$.`,
      idea: String.raw`The upper bound is Chernoff's with $\theta=\theta_+$. For the lower bound, no tilt has mean $a$, so instead tilt by $\theta_+$ (mean $a_0$) and let **one** summand make up the difference: $S_{n-1}\approx(n-1)a_0$ costs about $e^{-(n-1)(a_0\theta_+-\kappa(\theta_+))}$, and a single $X_n\ge n(a-a_0)$ costs only $e^{-n\theta_+(a-a_0)}$ up to polynomial factors, because the tail $x^{-3}e^{-x}$ is barely heavier than $e^{-x}$. Superadditivity (Lemma 2.7.1) turns this into the limit.`,
      caption: String.raw`The perverted exponential. Left: its rate function, the Legendre curve up to $a_0=2$ and the straight tangent line beyond it (green), with importance-sampling estimates of $-\frac1n\log P(S_n\ge na)$ for $n=20$ (orange) and $n=60$ (purple) descending towards it (the excess is a polynomial correction, of order $(\log n)/n$). Right: for $n=20$, the share of the largest summand in $S_n$ among samples conditioned on $S_n\ge na$ (6000 importance-weighted samples, tilted by $\min(\theta_a,1)$). Below $a_0$ the excess is spread over all summands; above $a_0$ a single big jump carries it.`,
      deps: ['prob-2.7.7', 'prob-2.7.1'],
      tags: ['large deviations'],
      viz(v) {
        const I0 = (b) => simpson((u) => (u <= 0 ? 0 : u * Math.exp(-b / u)), 0, 1, 800), I1 = (b) => simpson((u) => (u <= 0 ? (b > 0 ? 0 : 1) : Math.exp(-b / u)), 0, 1, 800);
        const Z = I0(1), kap = (t) => Math.log(I0(1 - t) / Z), dkap = (t) => I1(1 - t) / I0(1 - t);
        const mu = dkap(0), a0 = dkap(1), k1 = kap(1);
        const thOf = (a) => { if (a >= a0) return 1; let lo = 0, hi = 1; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (dkap(m) < a) lo = m; else hi = m; } return (lo + hi) / 2; };
        const rate = (a) => { const t = thOf(a); return a * t - kap(t); };
        const aS = v.slider('level $a$', 1.6, 5, 3, { step: 0.05 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const n = 20, K = 6000;
        const L = v.stage({ x: [mu, 5], y: [0, 5], height: 330, axes: 'box', gutter: true, xlabel: '$a$', title: 'rate function $I(a)$' });
        const R = v.stage({ x: [0, 1], y: [0, 8], height: 330, axes: 'box', gutter: true, xlabel: 'largest summand $/\\,S_n$', title: 'how the rare event happens ($n=20$)' });
        let cache = null, dotsC = null, st = null;
        const curve = []; for (let i = 0; i <= 120; i++) { const a = mu + (i / 120) * (5 - mu); curve.push([a, rate(a)]); }
        v.render(() => {
          const a = aS.value;
          L.vband(a0, 5, { color: 'green', alpha: 0.06 });
          L.path(curve, { color: 'green', width: 2.6 });
          L.fn((x) => x - k1, { domain: [a0, 5], color: 'green', width: 1, alpha: 0.4 });
          L.vline(a0, { color: 'muted', dash: [4, 3], width: 1.2 });
          L.text('a₀ = 2', a0, 4.75, { color: 'muted', size: 12, dx: 5 });
          if (!dotsC || dotsC.seed !== seed) {
            const AG = [1.6, 2, 2.5, 3, 3.5, 4, 4.5, 5], r = v.rng(seed * 7 + 2), out = {};
            [20, 60].forEach((nn) => { out[nn] = AG.map((aa) => { const th = thOf(aa), b = 1 - th, lk = kap(th), lw = []; for (let i = 0; i < 3000; i++) { let s2 = 0; for (let j = 0; j < nn; j++) { let x; do { x = (1 - r()) ** -0.5; } while (r() >= Math.exp(-b * (x - 1))); s2 += x; } if (s2 >= nn * aa) lw.push(-th * s2 + nn * lk); } if (!lw.length) return [aa, null]; const m = Math.max(...lw); return [aa, -(m + Math.log(lw.reduce((p, q) => p + Math.exp(q - m), 0) / 3000)) / nn]; }); });
            dotsC = { seed, out };
          }
          L.dots(dotsC.out[20].filter((q) => q[1] != null), { r: 4, color: 'orange' });
          L.dots(dotsC.out[60].filter((q) => q[1] != null), { r: 4, color: 'purple' });
          L.dot(a, rate(a), { r: 5, color: 'gold' });
          const key = a + '|' + seed;
          if (!cache || cache.key !== key) {
            const th = thOf(a), b = 1 - th, lk = kap(th), r = v.rng(seed * 43 + 9), shares = [], lw = [];
            for (let i = 0; i < K; i++) {
              let s = 0, mx = 0;
              for (let j = 0; j < n; j++) { let x; do { x = (1 - r()) ** -0.5; } while (r() >= Math.exp(-b * (x - 1))); s += x; if (x > mx) mx = x; }
              if (s >= n * a) { shares.push(mx / s); lw.push(-th * s + n * lk); }
            }
            const m = lw.length ? Math.max(...lw) : 0, w = lw.map((x) => Math.exp(x - m)), W = w.reduce((p, q) => p + q, 0);
            const est = lw.length ? m + Math.log(W / K) : -Infinity;
            cache = { key, shares, w, W, est, hits: lw.length };
          }
          const edges = Array.from({ length: 41 }, (_, i) => i / 40), counts = new Array(40).fill(0);
          cache.shares.forEach((sh, i) => { counts[Math.min(39, Math.floor(sh * 40))] += cache.w[i] / cache.W * 40; });
          R.setView([0, 1], [0, Math.max(4, ...counts) * 1.12]);
          R.hist({ edges, counts }, { color: a > a0 ? 'red' : 'accent', fillAlpha: 0.4 });
          R.vline(1 / n, { color: 'muted', dash: [4, 3], width: 1.2 });
          R.vline(Math.max(0, (a - a0) / a), { color: 'red', dash: [5, 3], width: 1.2 });
          const mshare = cache.shares.reduce((p, sh, i) => p + sh * cache.w[i], 0) / (cache.W || 1);
          v.legend([['green', '$I(a)$ (straight beyond $a_0$)'], ['orange', '$-\\frac1n\\log P(S_n\\ge na)$, $n=20$', { dot: true }], ['purple', '$n=60$', { dot: true }], [a > a0 ? 'red' : 'accent', 'weighted share histogram', { area: true }]]);
          st = { a, I: rate(a), est: cache.est, mshare, hits: cache.hits };
        });
        v.readout(() => st && `$\\mu=${v.fix(mu, 4)}$, $\\ a_0=\\kappa'(1)=${v.fix(a0, 4)}$, $\\ \\kappa(1)=${v.fix(k1, 4)}$. At $a=${v.fix(st.a, 2)}$: $I(a)=${v.fix(st.I, 4)}$` + (st.a > a0 ? ` $=a-\\kappa(1)$` : '') + `; importance-sampling estimate $-\\frac1{20}\\log P(S_{20}\\ge20a)\\approx${isFinite(st.est) ? v.fix(-st.est / n, 4) : '\\infty'}$ (finite-$n$ corrections are polynomial). Mean share of the largest summand: $${v.fix(st.mshare, 3)}$.`);
      },
    },
  ],
};
