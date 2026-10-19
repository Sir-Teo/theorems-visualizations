// Control Theory — Chapter 12, landmark paper: Kalman (1960).
//
// Data: none needed — the paper is theoretical (state-space model, orthogonal projection, recursive filter and the
// Riccati equation for the error covariance, with duality to optimal control). The tracking scenario below is an
// illustrative simulation (seeded), not data from the paper. The filter equations are the paper's discrete-time ones
// in modern notation: x̂⁻ = Φx̂, P⁻ = ΦPΦᵀ + Q, K = P⁻Hᵀ(HP⁻Hᵀ + R)⁻¹, x̂ = x̂⁻ + K(z − Hx̂⁻), P = (I − KH)P⁻.

const N = 160;
function mat2(a, b, c, d) { return [[a, b], [c, d]]; }
/** One axis of a constant-velocity target: returns truth, measurements and the Kalman filter run with (qf, rf). */
function track(r, q, rr, qf, rf) {
  const xs = [], zs = [];
  let p = 0, vel = 0.3 * r.normal();
  for (let k = 0; k < N; k++) { const a = Math.sqrt(q) * r.normal(); p += vel + a / 2; vel += a; xs.push(p); zs.push(p + rr * r.normal()); }
  const Q = mat2(qf / 4, qf / 2, qf / 2, qf), R = rf * rf;
  let x = [zs[0], 0], P = mat2(R, 0, 0, 4);
  const est = [], sd = [], gain = [];
  for (let k = 0; k < N; k++) {
    if (k > 0) { // predict
      x = [x[0] + x[1], x[1]];
      const a = P[0][0] + 2 * P[0][1] + P[1][1], b = P[0][1] + P[1][1], c = P[1][1];
      P = mat2(a + Q[0][0], b + Q[0][1], b + Q[1][0], c + Q[1][1]);
    }
    const S = P[0][0] + R, K = [P[0][0] / S, P[1][0] / S], innov = zs[k] - x[0];
    x = [x[0] + K[0] * innov, x[1] + K[1] * innov];
    P = mat2((1 - K[0]) * P[0][0], (1 - K[0]) * P[0][1], P[1][0] - K[1] * P[0][0], P[1][1] - K[1] * P[0][1]);
    est.push(x[0]); sd.push(Math.sqrt(P[0][0])); gain.push(K[0]);
  }
  return { xs, zs, est, sd, gain };
}

export default {
  collection: 'ctrl',
  chapter: 12,
  items: [
    {
      num: '12.13',
      kind: 'Paper',
      name: 'A New Approach to Linear Filtering and Prediction Problems',
      paper: { authors: 'R. E. Kalman', year: 1960, title: 'A New Approach to Linear Filtering and Prediction Problems', venue: 'Journal of Basic Engineering 82 (1): 35–45', doi: '10.1115/1.3662552' },
      introduces: ['ctrl-12.3', 'ctrl-12.4', 'ctrl-12.5'],
      statement: String.raw`For a linear system driven by white noise and observed with white noise,
$$x_{k+1} = \Phi x_k + w_k,\qquad z_k = H x_k + v_k,\qquad w \sim (0, Q),\ v \sim (0, R),$$
the minimum-mean-square-error estimate of the state given all past measurements can be computed **recursively**: predict $\hat x^-_{k} = \Phi \hat x_{k-1}$, then correct with the new measurement, $\hat x_k = \hat x^-_k + K_k (z_k - H\hat x^-_k)$, where the gain $K_k = P^-_k H^\top (H P^-_k H^\top + R)^{-1}$ comes from an error covariance that obeys a matrix **Riccati equation**, $P^-_{k+1} = \Phi (I - K_k H) P^-_k \Phi^\top + Q$, computable in advance. For a constant, observable and controllable system, $P$ and $K$ converge to steady values. The filtering problem is the **dual** of the linear-quadratic regulator.

Scope: exactly optimal for linear Gaussian models (best linear estimator otherwise) with known $\Phi, H, Q, R$; nonlinear systems need extensions (extended, unscented, particle filters).`,
      idea: String.raw`Wiener (1949) and Kolmogorov had solved optimal filtering for stationary signals in the frequency domain, which required spectral factorisation and an infinite past and did not extend to time-varying or multivariable problems. Kalman recast it in state space (ctrl-12.1, ctrl-2.1), used the geometry of orthogonal projection in a Hilbert space of random variables (sig-13.7, stat-12.3) to show that the best estimate is updated by projecting the new innovation, and obtained a finite-dimensional recursion that a digital computer could run in real time. He also showed that the covariance equation is the same Riccati equation as in optimal control, with time reversed and matrices transposed. Within a few years Schmidt's group at NASA Ames had adapted it (as an extended filter) for Apollo's navigation computer; it is now in every GPS receiver, inertial navigation system, phone and self-driving stack (ctrl-12.3–12.5).`,
      caption: String.raw`A target moves with random accelerations (illustrative simulation); grey dots are noisy position fixes, the green line the Kalman estimate, the gold band its ±2σ uncertainty, wide at the start and settling as the filter learns; the red dot is the newest fix. **Errors** subtracts the true position, so the true path is the zero line and the scatter of fixes versus estimate is plain to see. Set the true process noise $q$ and measurement noise $r$; **mistune** the filter's assumed noise to see the estimate lag (too small $q$) or chase the noise (too large). **Right**: the gain for position converges to its steady-state value, from the Riccati recursion, long before the estimate itself settles; the readout compares the error of the raw fixes and of the filter.`,
      deps: ['ctrl-12.1', 'ctrl-2.1', 'sig-13.7', 'stat-12.3', 'prob-4.1.15'],
      refs: [],
      tags: ['estimation', 'state space', 'history'],
      credit: 'Rudolf E. Kálmán, 1960',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Kalman_filter' },
      viz(v) {
        const lq = v.slider('process noise q (log₁₀)', -3, 0, -1.5, { step: 0.05, fmt: (x) => v.fix(10 ** x, 3) });
        const rS = v.slider('measurement noise r', 0.2, 5, 2, { step: 0.05 });
        const mis = v.select('filter assumes', [{ value: '1', label: 'true q' }, { value: '0.01', label: 'q ÷ 100' }, { value: '100', label: 'q × 100' }], '1');
        const view = v.select('show', [{ value: 'err', label: 'errors' }, { value: 'pos', label: 'positions' }], 'err');
        let seed = 5;
        v.button('New track', () => { seed++; v.restart(); });
        const s = v.stage({ x: [0, 60], y: [-10, 10], axes: 'box', gutter: true, height: 380, weight: 1.5, xlabel: 'step k', ylabel: 'position', title: 'tracking from noisy fixes (simulation, one coordinate)' });
        const g = v.stage({ x: [0, N], y: [0, 1], axes: 'box', gutter: true, height: 380, weight: 0.9, minWidth: 240, xlabel: 'step k', ylabel: 'position gain K', title: 'the gain settles' });
        let cache = null, key = '';
        const run = () => {
          const k = `${lq.value}|${rS.value}|${mis.value}|${seed}`;
          if (k === key) return cache;
          key = k;
          const q = 10 ** lq.value, qf = q * Number(mis.value), r = v.rng(seed * 17 + 3);
          const X = track(r, q, rS.value, qf, rS.value), Y = track(r, q, rS.value, qf, rS.value);
          cache = { X, Y };
          return cache;
        };
        let st = null;
        v.animate((t) => {
          const { X, Y } = run();
          const k = Math.min(N - 1, Math.floor(t * 12));
          // last 60 steps, either raw positions or errors relative to the true position, with the filter's ±2σ band
          const err = view.value === 'err', i0 = Math.max(0, k - 60), base = (i) => (err ? X.xs[i] : 0);
          let lo = Infinity, hi = -Infinity;
          for (let i = i0; i <= k; i++) { lo = Math.min(lo, X.zs[i] - base(i), X.xs[i] - base(i)); hi = Math.max(hi, X.zs[i] - base(i), X.xs[i] - base(i)); }
          const pad = 0.1 * (hi - lo) + 0.5;
          s.setView([i0, Math.max(i0 + 60, k + 1)], [lo - pad, hi + pad]);
          s.setLabels(undefined, err ? 'error = position − true position' : 'position');
          const band = [];
          for (let i = i0; i <= k; i++) band.push([i, X.est[i] - base(i) + 2 * X.sd[i]]);
          for (let i = k; i >= i0; i--) band.push([i, X.est[i] - base(i) - 2 * X.sd[i]]);
          s.poly(band, { fill: 'gold', fillAlpha: 0.22, stroke: false });
          s.path(X.xs.slice(i0, k + 1).map((x, i) => [i + i0, x - base(i + i0)]), { color: 'ink', width: 2 });
          for (let i = i0; i <= k; i++) s.dot(i, X.zs[i] - base(i), { r: 3, color: 'muted' });
          s.path(X.est.slice(i0, k + 1).map((x, i) => [i + i0, x - base(i + i0)]), { color: 'green', width: 2.6 });
          s.dot(k, X.zs[k] - base(k), { r: 5, color: 'red' });
          s.dot(k, X.est[k] - base(k), { r: 5, color: 'green' });
          // gain panel
          g.path(X.gain.map((K, i) => [i, K]), { color: 'accent', width: 2.2 });
          g.hline(X.gain[N - 1], { color: 'accent', width: 1, dash: [5, 4] });
          g.vline(k, { color: 'gold', width: 1.4 });
          g.dot(k, X.gain[k], { r: 5, color: 'gold' });
          const rm = (a, b, n0) => Math.sqrt(a.slice(n0).reduce((s2, x, i) => s2 + (x - b[i + n0]) ** 2, 0) / (a.length - n0));
          st = { k, raw: Math.sqrt((rm(X.zs, X.xs, 10) ** 2 + rm(Y.zs, Y.xs, 10) ** 2) / 2), kf: Math.sqrt((rm(X.est, X.xs, 10) ** 2 + rm(Y.est, Y.xs, 10) ** 2) / 2), Kss: X.gain[N - 1], sd: X.sd[N - 1] };
        }, { period: N / 12 + 2, once: true, still: N / 12 });
        v.legend([['ink', 'true path'], ['muted', 'measurements', { dot: true }], ['green', 'Kalman estimate'], ['gold', '±2σ band', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const tuned = mis.value === '1';
          return `step ${st.k + 1}/${N} · rms position error (after warm-up): raw fixes **${v.fix(st.raw, 2)}**, Kalman **${v.fix(st.kf, 2)}** (${v.fix(st.raw / st.kf, 1)}× better) · steady-state gain $K_\\infty = ${v.fix(st.Kss, 3)}$, filter’s own σ = ${v.fix(st.sd, 2)}${tuned ? ' — matched to the actual error, as the theory promises' : ' — mistuned: the filter’s claimed σ no longer matches its actual error'}`;
        });
      },
    },
  ],
};
