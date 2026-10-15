// Quantum Mechanics — Chapter 3: Quantum mechanics in one dimension (items 3.1–3.10; 3.11–3.20 in ch03-b.js)
import { TAU, grid, normSq, normalize, interp, phaseLUT, drawPsi, drawReal, phaseWheel, levelDiagram, numerov, countNodes, clockSim, fz, sub, FAMILY } from './ch03.shared.js';

/** Potentials offered as presets (typed formulas, ħ = m = 1). */
const PRESETS = {
  lopsided: ['lopsided well', '0.06 x^4 - 0.5 x + 1'],
  harmonic: ['harmonic', '0.5 x^2'],
  double: ['double well', '0.04 (x^2 - 8)^2'],
  bumpy: ['bumpy bowl', '0.3 x^2 + 1.2 cos(4 x)'],
};
const presetOptions = (keys) => keys.map((k) => ({ value: k, label: PRESETS[k][0] }));
/** A typed potential made safe for the solvers: non-finite values become a high wall, extremes are clamped. */
const safeV = (M, f, lo = -60, hi = 400) => (x) => { const y = f ? f(x) : 0.5 * x * x; return Number.isFinite(y) ? M.clamp(y, lo, hi) : hi; };
/** Draw a small clock at pixel (X, Y): a hand at angle `ang` (counter-clockwise), coloured by that phase. */
function phasor(v, s, col, X, Y, ang, r = 10) {
  const c = s.ctx; c.save();
  c.beginPath(); c.arc(X, Y, r, 0, TAU); c.fillStyle = v.color('panel', 0.92); c.fill(); c.strokeStyle = v.color('muted'); c.lineWidth = 1.2; c.stroke();
  c.beginPath(); c.moveTo(X, Y); c.lineTo(X + r * Math.cos(ang), Y - r * Math.sin(ang)); c.strokeStyle = col(ang); c.lineWidth = 2.8; c.lineCap = 'round'; c.stroke();
  c.restore();
}
/** Window of a level diagram: the x-range where V lies below `lim`, padded. */
function wellWindow(x, V, lim, pad = 3) {
  let a = 0, b = x.length - 1; while (a < b && V[a] > lim) a++; while (b > a && V[b] > lim) b--;
  return [x[Math.max(0, a - pad)], x[Math.min(x.length - 1, b + pad)]];
}

export default {
  collection: 'qm',
  chapter: 3,
  title: 'Quantum mechanics in one dimension',
  summary: String.raw`When the potential does not depend on time, the Schrödinger equation separates: stationary states $\psi(x)e^{-iEt/\hbar}$ solve the eigenvalue problem $\hat H\psi=E\psi$, keep a frozen probability density, and every other state is a superposition of them, each turning at its own frequency. The infinite well, the delta well and the finite well show quantized bound states and the general rules they obey in one dimension — the $n$-th state has $n-1$ nodes, levels are never degenerate, energies sit above the bottom of the well, and any attractive well binds. Scattering states reflect and transmit against classical intuition: particles bounce off steps they could climb and tunnel through barriers they cannot, with resonances where transmission is perfect. Coupling two wells splits their levels and makes a particle slosh between them; chaining many barriers turns resonances into bands; and wrapping the line into a ring quantizes momentum. Two numerical workhorses, the shooting method and transfer matrices, run under every picture.`,
  items: [
    // ------------------------------------------------------------------ 3.1
    {
      num: '3.1',
      kind: 'Theorem',
      name: 'Stationary states',
      credit: 'Schrödinger, 1926',
      statement: String.raw`Let the potential $V(x)$ be independent of time. A product $\Psi(x,t)=\psi(x)\,\varphi(t)$ solves the Schrödinger equation $i\hbar\,\partial_t\Psi=\hat H\Psi$ exactly when, for some constant $E$,
$$\hat H\psi=-\frac{\hbar^2}{2m}\,\psi''+V\psi=E\,\psi\qquad\text{and}\qquad\varphi(t)=e^{-iEt/\hbar},$$
the **time-independent Schrödinger equation**. If $\psi$ is normalizable, the **stationary state** $\Psi=\psi(x)\,e^{-iEt/\hbar}$ has:
(a) a probability density $|\Psi(x,t)|^2=|\psi(x)|^2$ that does not change in time, and constant expectation values $\langle Q\rangle$ of every observable that does not depend explicitly on $t$;
(b) a definite energy: $\langle H\rangle=E$ and $\Delta H=0$, so every energy measurement gives $E$;
(c) a phase that turns uniformly at the angular frequency $E/\hbar$; for real $V$ the spatial factor $\psi$ can be chosen real.
A superposition $c_1\psi_1e^{-iE_1t/\hbar}+c_2\psi_2e^{-iE_2t/\hbar}$ with $E_1\neq E_2$ is **not** stationary: its density oscillates at the Bohr frequency $|E_2-E_1|/\hbar$.`,
      idea: String.raw`Substitute $\psi\varphi$ and divide by it: $i\hbar\,\varphi'/\varphi=\hat H\psi/\psi$. The left side depends only on $t$ and the right only on $x$, so both equal one constant $E$ — separation of variables, as for a vibrating string (music-2.3). Then $\varphi=e^{-iEt/\hbar}$ has modulus one, so it cancels from $|\Psi|^2$ and from every $\int\bar\Psi\,\hat Q\,\Psi\,dx$; and $\hat H^2\psi=E^2\psi$ gives $\langle H^2\rangle=\langle H\rangle^2$, zero variance. For a superposition the density acquires the cross term $2\operatorname{Re}\big(\bar c_1c_2\,\bar\psi_1\psi_2\,e^{-i(E_2-E_1)t/\hbar}\big)$, which beats at the difference frequency — only energy *differences* are observable, which is why the overall zero of energy is arbitrary.`,
      caption: String.raw`Left: the levels $E_n$ of the potential (type any $V(x)$ or pick a preset), with each eigenfunction drawn **at its own energy** — blue where $\psi_n>0$, orange where $\psi_n<0$. The little clock beside a chosen level is its phase factor $e^{-iE_nt/\hbar}$, turning faster for higher levels. Right: $\Psi(x,t)$ as height $|\Psi|$ coloured by phase. With one state the colours cycle while the shape never moves — the readout confirms $|\Psi|^2$ is unchanged to rounding. Switch on a **second state**: the density now sloshes, and the measured period of $\langle x\rangle(t)$ (bottom) matches $2\pi\hbar/|E_m-E_n|$.`,
      deps: ['qm-2.4'],
      see: ['music-2.3', 'pde-4.1', 'qm-2.9'],
      refs: ['Griffiths §2.1'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Stationary_state' },
      tags: ['stationary states', 'energy eigenstates', 'separation of variables'],
      viz(v) {
        const M = v.M, A = -6, B = 6, NG = 480, K = 8, TW = 40;
        let Vin = null, mS = null;
        v.select('potential', presetOptions(['lopsided', 'harmonic', 'double', 'bumpy']), 'lopsided', { onChange: (k) => Vin.set(PRESETS[k][1]) });
        Vin = v.input('$V(x) =$', PRESETS.lopsided[1], { vars: ['x'], width: 190 });
        const nS = v.slider('state $n$', 1, K, 1, { int: true });
        const two = v.toggle('superpose a second state $m$', false, { onChange: () => { mS.el.hidden = !two.value; } });
        mS = v.slider('second state $m$', 1, K, 2, { int: true }); mS.el.hidden = true;
        const sL = v.stage({ x: [A, B], y: [0, 1], height: 330, axes: 'box', weight: 1, xlabel: 'x', ylabel: 'E', title: 'levels $E_n$, each $\\psi_n$ drawn at its energy' });
        const sR = v.stage({ x: [A, B], y: [0, 1], height: 330, axes: 'box', weight: 1, xlabel: 'x', title: '$\\Psi(x,t)$: height $|\\Psi|$, colour $\\arg\\Psi$' });
        const sT = v.stage({ x: [0, TW], y: [-1, 1], height: 150, axes: 'box', full: true, xlabel: 't', ylabel: '⟨x⟩', title: '$\\langle x\\rangle(t)$, computed from $\\Psi(x,t)$' });
        let S = null;
        const solve = () => {
          if (S && S.key === Vin.value) return S;
          const Vf = safeV(M, Vin.fn), R = M.schrodinger1D(Vf, [A, B], { n: NG, k: K }), x = R.x;
          return (S = { key: Vin.value, x, dx: x[1] - x[0], Vg: Float64Array.from(x, Vf), E: R.E, psi: R.psi, trace: {} });
        };
        const coeffs = () => (!two.value || mS.value === nS.value ? [[nS.value - 1, 1]] : [[nS.value - 1, Math.SQRT1_2], [mS.value - 1, Math.SQRT1_2]]);
        const psiAt = (S, cs, tau) => {
          const N = S.x.length, re = new Float64Array(N), im = new Float64Array(N);
          for (const [j, c] of cs) { const ph = -S.E[j] * tau, cr = c * Math.cos(ph), ci = c * Math.sin(ph), p = S.psi[j]; for (let i = 0; i < N; i++) { re[i] += cr * p[i]; im[i] += ci * p[i]; } }
          return { re, im };
        };
        const traceOf = (S, cs) => {
          const key = cs.map((c) => c[0]).join(','); if (S.trace[key]) return S.trace[key];
          const ts = [], xs = [];
          for (let k = 0; k <= 480; k++) { const tau = (TW * k) / 480, P = psiAt(S, cs, tau); let m0 = 0, m1 = 0; for (let i = 0; i < S.x.length; i++) { const r = P.re[i] ** 2 + P.im[i] ** 2; m0 += r; m1 += r * S.x[i]; } ts.push(tau); xs.push(m1 / m0); }
          const mean = xs.reduce((a, b) => a + b, 0) / xs.length, amp = Math.max(...xs) - Math.min(...xs), up = [];
          if (amp > 1e-6) for (let k = 1; k < xs.length; k++) if (xs[k - 1] < mean && xs[k] >= mean) up.push(ts[k - 1] + ((mean - xs[k - 1]) / (xs[k] - xs[k - 1])) * (ts[k] - ts[k - 1]));
          return (S.trace[key] = { ts, xs, amp, mean, per: up.length >= 2 ? (up[up.length - 1] - up[0]) / (up.length - 1) : NaN });
        };
        let st = null;
        v.animate((t) => {
          const S = solve(), col = phaseLUT(v), cs = coeffs(), tau = t, E = S.E, N = S.x.length;
          const Vmin = Math.min(...S.Vg), span = E[K - 1] - Vmin, [xl, xr] = wellWindow(S.x, S.Vg, E[K - 1] + 0.3 * span);
          sL.setView([xl, xr], [Vmin - 0.06 * span, E[K - 1] + 0.16 * span]);
          let pmax = 0; for (const p of S.psi) for (const y of p) pmax = Math.max(pmax, Math.abs(y));
          const amp = (0.38 * span) / (K - 1) / pmax, act = cs.map((c) => c[0]);
          levelDiagram(sL, { x: S.x, V: S.Vg, E, psi: S.psi, col, amp, hi: act, label: (i) => `n = ${i + 1}` });
          for (const [j] of cs) { let ia = 0; while (ia < N - 1 && S.Vg[ia] > E[j]) ia++; phasor(v, sL, col, Math.max(14, sL.X(S.x[ia]) - 16), sL.Y(E[j]), -E[j] * tau); }
          // Ψ(x, t)
          const P = psiAt(S, cs, tau), P0 = psiAt(S, cs, 0);
          let bound = 0; for (let i = 0; i < N; i++) { let s = 0; for (const [j, c] of cs) s += Math.abs(c * S.psi[j][i]); bound = Math.max(bound, s); }
          sR.setView([xl, xr], [-0.12 * bound, bound * 1.18]);
          sR.fn((X) => (interp(S.x, S.Vg, X) - Vmin) / (span * 1.16) * bound * 1.18, { color: 'muted', width: 1.3, dash: [4, 3], n: 300 });
          drawPsi(sR, S.x, P.re, P.im, { col });
          sR.path(Array.from(S.x, (X, i) => [X, Math.hypot(P0.re[i], P0.im[i])]), { color: 'ink', width: 1.2, dash: [2, 3], alpha: 0.6 });
          let m0 = 0, m1 = 0, dmax = 0; for (let i = 0; i < N; i++) { const r = P.re[i] ** 2 + P.im[i] ** 2; m0 += r; m1 += r * S.x[i]; dmax = Math.max(dmax, Math.abs(r - P0.re[i] ** 2 - P0.im[i] ** 2)); }
          const mx = m1 / m0;
          sR.vline(mx, { color: 'green', width: 1.6, dash: [5, 4] }); sR.text('⟨x⟩', mx, bound * 1.1, { color: 'green', size: 11.5, dx: 5 });
          phaseWheel(sR, col, sR.W - 34, 40, 12);
          // ⟨x⟩(t)
          const T = traceOf(S, cs), half = Math.max(0.25, 0.65 * T.amp);
          sT.setView([0, TW], [T.mean - half, T.mean + half]);
          sT.path(T.ts.map((q, k) => [q, T.xs[k]]), { color: 'green', width: 2.2 });
          sT.vline(tau, { color: 'gold', width: 1.6 }); sT.dot(tau, mx, { r: 5, color: 'gold' });
          st = { cs, E, tau, dmax, mx, T, single: cs.length === 1 };
        }, { period: TW, still: 6 });
        v.legend([['muted', 'V(x)', { area: true }], ['ink', '|Ψ(x, 0)|', { dash: true }], ['green', '⟨x⟩']]);
        v.readout(() => {
          if (!st) return '';
          const [n, m] = st.cs.map((c) => c[0]), En = st.E[n];
          if (st.single) return `$E_{${n + 1}} = ${v.fix(En, 4)}$: the phase has turned $E_{${n + 1}}t/\\hbar = ${v.fix(En * st.tau, 2)}$ rad, yet $|\\Psi(x,t)|^2$ differs from $|\\Psi(x,0)|^2$ by at most **${st.dmax < 1e-13 ? '0' : v.sci(st.dmax, 1)}** (rounding) and $\\langle x\\rangle = ${fz(v, st.mx, 4)}$ at every $t$ — a stationary state.`;
          const Em = st.E[m], pred = TAU / Math.abs(Em - En);
          return `$E_{${n + 1}} = ${v.fix(En, 4)}$, $E_{${m + 1}} = ${v.fix(Em, 4)}$ · the density has changed by up to **${v.fix(st.dmax, 3)}** · ` + (Number.isFinite(st.T.per) ? `measured period of $\\langle x\\rangle$: **${v.fix(st.T.per, 3)}** vs $2\\pi\\hbar/|E_{${m + 1}}-E_{${n + 1}}| = ${v.fix(pred, 3)}$` : `$\\langle x\\rangle$ stays at ${fz(v, st.T.mean, 3)} here ($\\int x\\,\\psi_{${n + 1}}\\psi_{${m + 1}}dx = 0$ by symmetry), but the density still beats with period $2\\pi\\hbar/|E_{${m + 1}}-E_{${n + 1}}| = ${v.fix(pred, 3)}$`) + '.';
        });
      },
    },
    // ------------------------------------------------------------------ 3.2
    {
      num: '3.2',
      kind: 'Theorem',
      name: 'Expansion in stationary states',
      statement: String.raw`Suppose $\hat H=-\frac{\hbar^2}{2m}\frac{d^2}{dx^2}+V$ has a purely discrete spectrum — for instance $V(x)\to\infty$ as $|x|\to\infty$, or a box — with normalized eigenfunctions $\psi_1,\psi_2,\dots$ and energies $E_1<E_2<\dots$. Then the $\psi_n$ form an orthonormal basis of $L^2$, so every initial state can be expanded,
$$\Psi(x,0)=\sum_n c_n\,\psi_n(x),\qquad c_n=\langle\psi_n|\Psi(\cdot,0)\rangle=\int\bar\psi_n\,\Psi(x,0)\,dx,$$
with $\sum_n|c_n|^2=1$, and the solution of the Schrödinger equation is
$$\Psi(x,t)=\sum_n c_n\,e^{-iE_nt/\hbar}\,\psi_n(x).$$
The moduli $|c_n|$ never change; $|c_n|^2$ is the probability that an energy measurement gives $E_n$, and $\langle H\rangle=\sum_n|c_n|^2E_n$ is conserved. (When part of the spectrum is continuous, as for the free particle, the sum is joined by an integral over scattering states.)`,
      idea: String.raw`Completeness is the spectral theorem for the self-adjoint operator $\hat H$ with compact resolvent (fa-13.30; in Sturm–Liouville form, ode-4.10); Parseval's identity (rca-4.18) gives $\sum|c_n|^2=\norm{\Psi}^2=1$. Linearity does the rest: each term $c_n\psi_ne^{-iE_nt/\hbar}$ solves the equation by 3.1, so does their sum, and it has the right initial value; uniqueness of solutions finishes the argument. Evolution is therefore diagonal in the energy basis — each coefficient just turns at its own rate $E_n/\hbar$ — which is why diagonalizing $\hat H$ is "solving" quantum dynamics. Truncating the sum after $K$ terms leaves an error of norm $\big(\sum_{n>K}|c_n|^2\big)^{1/2}$, the same at all times, because the omitted part evolves unitarily too.`,
      caption: String.raw`**Set the coefficients** by dragging the bars (right), or switch to **draw $\psi(x,0)$** and sketch any initial state in the left panel — its coefficients $c_n=\langle\psi_n|\psi\rangle$ then appear as bars and the green curve is the partial sum of the first $K$ terms. Bar heights are the coefficients at $t=0$; when the animation runs their **colours** show the phase of $c_ne^{-iE_nt/\hbar}$, each turning at its own rate while the heights never change. Bottom: $\Psi(x,t)$ from the expansion (phase-coloured) and from a direct Crank–Nicolson simulation (gold dashed). The readout shows they differ only by the truncation error plus a time-step error that shrinks as $\Delta t^2$ — try the smaller steps.`,
      deps: ['qm-3.1', 'rca-4.18'],
      see: ['ode-4.10', 'fa-13.30', 'music-2.7'],
      refs: ['Griffiths §2.1'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Stationary_state' },
      tags: ['eigenfunction expansion', 'time evolution', 'superposition'],
      viz(v) {
        const M = v.M, A = -6, B = 6, NG = 360, KMAX = 40, KD = 10, TW = 30;
        const WELLS = { harmonic: ['harmonic', (x) => 0.5 * x * x], quartic: ['lopsided quartic', (x) => 0.02 * x ** 4 + 0.3 * x], box: ['square box', () => 0] };
        let sim = null, Ks = null;
        const well = v.select('well', Object.entries(WELLS).map(([value, w]) => ({ value, label: w[0] })), 'harmonic', { onChange: () => rebuild() });
        const mode = v.select('initial state', [{ value: 'coef', label: 'set the coefficients' }, { value: 'draw', label: 'draw $\\psi(x,0)$' }], 'coef', { onChange: () => { Ks.el.hidden = mode.value !== 'draw'; rebuild(); } });
        Ks = v.slider('modes kept $K$', 3, KMAX, 14, { int: true, onChange: () => rebuild() }); Ks.el.hidden = true;
        const dtS = v.select('Crank–Nicolson step $\\Delta t$', ['0.02', '0.005', '0.00125'].map((d) => ({ value: d, label: d })), '0.005', { onChange: () => rebuild() });
        const coef = [0.75, 0.55, 0.3, -0.18, 0, 0, 0, 0, 0, 0];
        const cache = {};
        const solve = () => { const k = well.value; if (cache[k]) return cache[k]; const R = M.schrodinger1D(WELLS[k][1], [A, B], { n: NG, k: KMAX }); return (cache[k] = { x: R.x, dx: R.x[1] - R.x[0], E: R.E, psi: R.psi, Vg: Float64Array.from(R.x, WELLS[k][1]) }); };
        const xg = solve().x, NN = xg.length;
        let yd = Float64Array.from(xg, (X) => Math.exp(-((X + 2.2) ** 2) / 0.8) * (1 + 0.6 * Math.sin(2.4 * X)) + 0.35 * Math.exp(-((X - 1.8) ** 2) / 0.3));
        yd[0] = 0; yd[NN - 1] = 0;
        const s0 = v.stage({ x: [A, B], y: [-1, 1], height: 250, axes: 'box', weight: 1, xlabel: 'x', title: 'initial state $\\psi(x,0)$' });
        const sc = v.stage({ x: [0.4, KD + 0.6], y: [-1.05, 1.05], height: 250, axes: 'box', weight: 1, xlabel: 'n', title: 'coefficients $c_n$ (colour: phase of $c_ne^{-iE_nt/\\hbar}$)' });
        const sE = v.stage({ x: [A, B], y: [0, 1], height: 230, axes: 'box', full: true, xlabel: 'x', title: '$\\Psi(x,t)$: the expansion (colour = phase) and Crank–Nicolson (gold dashed)' });
        s0.onDrag((X, Y) => {
          if (mode.value !== 'draw') return;
          const i = Math.round((X - A) / (xg[1] - xg[0])); if (i < 1 || i > NN - 2) return;
          const top = s0.yr[1];
          for (let j = Math.max(1, i - 6); j <= Math.min(NN - 2, i + 6); j++) { const w = Math.exp(-((j - i) ** 2) / 10); yd[j] = (1 - w) * yd[j] + w * M.clamp(Y / top, -1.2, 1.2); }
          rebuild();
        });
        sc.onDrag((X, Y) => { if (mode.value !== 'coef') return; const n = Math.round(X); if (n < 1 || n > KD) return; coef[n - 1] = M.clamp(Y, -1, 1); rebuild(); });
        /** The initial state, its coefficients and the number of modes used. */
        const initial = () => {
          const S = solve(), dx = S.dx, re = new Float64Array(NN);
          let c, K;
          if (mode.value === 'coef') {
            const nrm = Math.hypot(...coef) || 1; K = KD; c = coef.map((q) => q / nrm);
            for (let n = 0; n < K; n++) for (let i = 0; i < NN; i++) re[i] += c[n] * S.psi[n][i];
          } else {
            for (let i = 0; i < NN; i++) re[i] = yd[i];
            normalize(re, null, dx); K = Ks.value; c = [];
            for (let n = 0; n < KMAX; n++) { let s = 0; for (let i = 0; i < NN; i++) s += S.psi[n][i] * re[i]; c.push(s * dx); }
          }
          let kept = 0; for (let n = 0; n < K; n++) kept += c[n] * c[n];
          return { re, c, K, trunc: Math.sqrt(Math.max(0, 1 - kept)), kept };
        };
        let I0 = null;
        function rebuild() {
          I0 = initial();
          const S = solve(), Vint = S.Vg.subarray(1, NN - 1);
          sim = clockSim(() => ({ re: Float64Array.from(I0.re.subarray(1, NN - 1)), im: new Float64Array(NN - 2) }), (q, h) => M.crankNicolson1D(q.re, q.im, Vint, S.dx, h), +dtS.value, 200000);
          v.restart();
        }
        rebuild();
        let st = null;
        v.animate((t) => {
          const S = solve(), col = phaseLUT(v), tau = t, dx = S.dx, { c, K } = I0;
          const Vmin = Math.min(...S.Vg), vt = Math.max(1, S.E[Math.min(K, KMAX - 1)]);
          // initial state and reconstruction
          let a0 = 0.2; for (let i = 0; i < NN; i++) a0 = Math.max(a0, Math.abs(I0.re[i]));
          s0.setView([A, B], [-1.15 * a0, 1.15 * a0]);
          s0.fn((X) => Math.min(1.15 * a0, -1.1 * a0 + ((interp(xg, S.Vg, X) - Vmin) / (vt - Vmin)) * a0 * 2), { color: 'muted', width: 1.2, dash: [4, 3], n: 300 });
          drawReal(s0, xg, I0.re, { col, alpha: 0.4 });
          if (mode.value === 'draw') {
            const SK = new Float64Array(NN); for (let n = 0; n < K; n++) for (let i = 0; i < NN; i++) SK[i] += c[n] * S.psi[n][i];
            s0.path(Array.from(xg, (X, i) => [X, SK[i]]), { color: 'green', width: 2, dash: [6, 3] });
            s0.corner('drag to draw ψ(x, 0)', 'tr', { color: 'muted' });
          }
          // coefficient bars
          const nb = mode.value === 'coef' ? KD : K;
          sc.setView([-0.2, nb + 0.7], [-1.05, 1.05]);
          sc.hline(0, { color: 'faint' });
          for (let n = 1; n <= nb; n++) {
            const val = mode.value === 'coef' ? coef[n - 1] : c[n - 1], ph = (val < 0 ? Math.PI : 0) - S.E[n - 1] * tau;
            if (Math.abs(val) > 1e-4) sc.rect(n - 0.36, 0, n + 0.36, val, { fill: col(ph), fillAlpha: 0.9, color: 'ink', width: 0.8 });
          }
          if (mode.value === 'coef') sc.corner('drag the bars', 'tr', { color: 'muted' });
          // evolution: expansion vs CN
          const q = sim.at(tau), re = new Float64Array(NN), im = new Float64Array(NN);
          for (let n = 0; n < K; n++) { const ph = -S.E[n] * tau, cr = c[n] * Math.cos(ph), ci = c[n] * Math.sin(ph), p = S.psi[n]; for (let i = 0; i < NN; i++) { re[i] += cr * p[i]; im[i] += ci * p[i]; } }
          let d2 = 0, top = 0.2; for (let i = 1; i < NN - 1; i++) { d2 += (re[i] - q.re[i - 1]) ** 2 + (im[i] - q.im[i - 1]) ** 2; top = Math.max(top, Math.hypot(I0.re[i])); }
          sE.setView([A, B], [-0.12 * top * 1.4, top * 1.4]);
          sE.fn((X) => Math.min(top * 1.4, ((interp(xg, S.Vg, X) - Vmin) / (vt - Vmin)) * top * 1.3), { color: 'muted', width: 1.3, fill: 'muted', fillAlpha: 0.08, n: 300 });
          drawPsi(sE, xg, re, im, { col });
          const cn = [0]; for (let i = 0; i < NN - 2; i++) cn.push(Math.hypot(q.re[i], q.im[i])); cn.push(0);
          sE.path(Array.from(xg, (X, i) => [X, cn[i]]), { color: 'gold', width: 2, dash: [6, 4] });
          phaseWheel(sE, col, sE.W - 34, 40, 12);
          let H = 0; for (let n = 0; n < K; n++) H += c[n] * c[n] * S.E[n];
          st = { tau, err: Math.sqrt(d2 * dx), trunc: I0.trunc, H: H / I0.kept, K, steps: sim.steps };
        }, { period: TW, still: 4 });
        v.legend([['ink', '$|\\Psi|$ from $\\sum c_ne^{-iE_nt/\\hbar}\\psi_n$ (fill = phase)'], ['gold', '$|\\Psi|$ from Crank–Nicolson', { dash: true }], ['green', 'partial sum of $K$ terms', { dash: true }], ['muted', '$V(x)$, scaled', { area: true }]]);
        v.readout(() => st && `$t = ${v.fix(st.tau, 2)}$ after ${st.steps} steps of $\\Delta t = ${dtS.value}$ · $\\|\\Psi_{\\rm CN}(t)-\\sum_{n\\le ${st.K}}c_ne^{-iE_nt/\\hbar}\\psi_n\\| = ${v.sci(st.err, 2)}$, against the truncation error $\\big(\\sum_{n>${st.K}}|c_n|^2\\big)^{1/2} = ${st.trunc < 1e-12 ? '0' : v.sci(st.trunc, 2)}$${st.trunc < 1e-12 ? ' (every nonzero coefficient is kept, so all of the difference is time-step error)' : ' (the rest is time-step error)'} · $\\langle H\\rangle = \\sum|c_n|^2E_n/\\sum|c_n|^2 = ${v.fix(st.H, 5)}$, constant in time.`);
      },
    },
    // ------------------------------------------------------------------ 3.3
    {
      num: '3.3',
      kind: 'Model',
      name: 'Infinite square well',
      statement: String.raw`A particle of mass $m$ confined to $0\le x\le L$ by impenetrable walls ($V=0$ inside, $V=\infty$ outside) has wave functions vanishing at the walls, and its stationary states are
$$\psi_n(x)=\sqrt{\frac2L}\,\sin\frac{n\pi x}{L},\qquad E_n=\frac{n^2\pi^2\hbar^2}{2mL^2}=n^2E_1,\qquad n=1,2,3,\dots$$
Each $\psi_n$ is a whole number of half-wavelengths, $\lambda_n=2L/n$, with $n-1$ interior nodes. The ground energy $E_1>0$ — the particle can never be at rest — and every energy scales as $1/L^2$: halving the box quadruples all levels. For an electron, $E_1=h^2/8m_eL^2=0.376\ \text{eV}$ when $L=1$ nm.`,
      scope: String.raw`Idealizes deep confinement (electrons in conjugated dye molecules, quantum wells, nanocrystals) when the walls are high compared with the levels of interest; a finite depth (3.11) lowers every level and lets the tails leak out.`,
      idea: String.raw`Inside, $-\frac{\hbar^2}{2m}\psi''=E\psi$ gives $\psi=A\sin kx+B\cos kx$ with $E=\hbar^2k^2/2m$. Continuity at the walls forces $\psi(0)=0$, so $B=0$, and $\psi(L)=0$, so $kL=n\pi$: the boundary conditions quantize $k$ exactly as for a string fixed at both ends (music-2.4), and the energy is the de Broglie kinetic energy of that wavelength. Normalizing gives $A=\sqrt{2/L}$; the $\psi_n$ are the Fourier sine functions on $[0,L]$ (pma-8.10). $E_n\propto n^2/L^2$ because $E\propto k^2$ and $k_n=n\pi/L$.`,
      caption: String.raw`**Drag the gold handle** to change the box width $L$ (an electron, energies in eV). Each level $E_n$ carries its sine-arc wave function; pick a **level $n$** to highlight it and see the photon emitted in the jump $n\to n-1$, drawn in its colour when it is visible. **Halve $L$**: every level moves up fourfold — on the log–log plot (right) the whole line of $E_n$ shifts up by $\log 4$ while keeping slope 2 (the $n^2$ law); hollow dots are the reference width.`,
      deps: ['qm-3.1', 'pma-8.10'],
      see: ['music-2.4', 'pde-4.1'],
      refs: ['Griffiths §2.2', 'Hall ch. 5'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Particle_in_a_box' },
      tags: ['infinite square well', 'particle in a box', 'quantization'],
      viz(v) {
        const M = v.M, C = M.CONST, E1nm = (C.h * C.h) / (8 * C.me * 1e-18) / C.eV, HC = (C.h * C.c) / C.eV * 1e9; // 0.376 eV·nm², 1239.84 eV·nm
        let Lref = 1.2;
        const s = v.stage({ x: [-0.18, 2.35], y: [-0.7, 10.4], height: 360, axes: 'box', weight: 1.35, xlabel: 'x (nm)', ylabel: 'E (eV)', title: 'an electron in a box of width $L$' });
        const s2 = v.stage({ x: [0.85, 13], y: [0.004, 300], xlog: true, ylog: true, height: 360, axes: 'box', weight: 0.85, xlabel: 'n', ylabel: 'Eₙ (eV)', title: '$E_n$ against $n$ (log–log)' });
        const hL = s.handle(1.2, -0.35, { color: 'gold', r: 8, label: 'L', labelPos: 'e', constrain: (X) => [M.clamp(X, 0.4, 2.1), -0.35] });
        const nS = v.slider('level $n$', 1, 10, 4, { int: true });
        v.button('Halve $L$', () => hL.set(Math.max(0.4, hL.x / 2), -0.35));
        v.button('Double $L$', () => hL.set(Math.min(2.1, hL.x * 2), -0.35));
        v.button('Make this $L$ the reference', () => { Lref = hL.x; });
        const NX = 320;
        let st = null;
        v.render(() => {
          const L = hL.x, col = phaseLUT(v), E = (n) => (n * n * E1nm) / (L * L), n0 = nS.value;
          // walls and floor
          s.rect(-0.18, -0.7, 0, 10.4, { fill: 'muted', fillAlpha: 0.12, hatch: 'muted', hatchAlpha: 0.35, stroke: false });
          s.rect(L, -0.7, 2.35, 10.4, { fill: 'muted', fillAlpha: 0.12, hatch: 'muted', hatchAlpha: 0.35, stroke: false });
          s.line(0, -0.7, 0, 10.4, { color: 'muted', width: 2 }); s.line(L, -0.7, L, 10.4, { color: 'muted', width: 2 }); s.line(0, 0, L, 0, { color: 'muted', width: 2 });
          const { x } = grid(0, L, NX), nmax = Math.min(14, Math.floor(Math.sqrt((10 * L * L) / E1nm)));
          for (let n = 1; n <= nmax; n++) {
            const En = E(n), gap = Math.min(E(n + 1) - En, n > 1 ? En - E(n - 1) : En), amp = (0.42 * gap) / Math.sqrt(2 / L), h = n === n0;
            const y = Float64Array.from(x, (X) => Math.sqrt(2 / L) * Math.sin((n * Math.PI * X) / L));
            s.line(0, En, L, En, { color: h ? 'ink' : 'muted', width: 1, alpha: h ? 0.6 : 0.35, dash: [4, 3] });
            drawReal(s, x, y, { col, base: En, scale: amp, alpha: h ? 0.55 : 0.18, outline: h ? 'ink' : 'muted', width: h ? 1.6 : 1 });
            if (n <= 6 || h) s.text(`n=${n}`, L, En, { dx: 6, size: 11, color: h ? 'ink' : 'muted' });
          }
          let lam = null;
          if (n0 >= 2 && E(n0) <= 10.4) {
            const dE = E(n0) - E(n0 - 1); lam = HC / dE;
            const vis = lam >= 380 && lam <= 780, cc = vis ? M.wavelengthRGB(lam) : 'muted', xa = 0.12 * L;
            s.arrow(xa, E(n0), xa, E(n0 - 1), { color: cc, width: 3, head: 9 });
            s.text(`${v.fix(lam, 0)} nm${vis ? '' : lam > 780 ? ' (infrared)' : ' (ultraviolet)'}`, xa, (E(n0) + E(n0 - 1)) / 2, { dx: 8, size: 11.5, color: vis ? 'ink' : 'muted', weight: 600 });
          }
          if (E(n0) > 10.4) s.corner(`E${sub(n0)} = ${v.fix(E(n0), 1)} eV is off the top`, 'tl', { color: 'red', weight: 600 });
          // log–log E_n
          const ns = Array.from({ length: 12 }, (_, i) => i + 1);
          s2.path(ns.map((n) => [n, (n * n * E1nm) / (Lref * Lref)]), { color: 'muted', width: 1.4, dash: [5, 4] });
          s2.dots(ns.map((n) => [n, (n * n * E1nm) / (Lref * Lref)]), { r: 4, color: 'muted', hollow: true });
          s2.path(ns.map((n) => [n, E(n)]), { color: 'accent', width: 2 });
          s2.dots(ns.map((n) => [n, E(n)]), { r: 4, color: 'accent' });
          s2.dot(n0, E(n0), { r: 7, color: 'gold' });
          s2.text(`L = ${v.fix(L, 2)} nm`, 1.05, E(1) * 1.9, { color: 'accent', size: 11.5, align: 'left' });
          s2.text(`reference ${v.fix(Lref, 2)} nm`, 12.5, (144 * E1nm) / (Lref * Lref) * (Lref > L ? 0.45 : 2.2), { color: 'muted', size: 11, align: 'right' });
          st = { L, n0, En: E(n0), lam, ratio: (Lref / L) ** 2 };
        });
        v.legend([['accent', 'Eₙ, current L', { dot: true }], ['muted', 'Eₙ, reference L', { dash: true }], ['gold', 'chosen level', { dot: true }]]);
        v.readout(() => st && `$L = ${v.fix(st.L, 3)}$ nm · $E_{${st.n0}} = ${v.fix(st.En, 4)}$ eV $= ${st.n0 * st.n0}\\,E_1$ · $E_nL^2 = n^2h^2/8m_e = ${v.fix(E1nm, 4)}\\,n^2$ eV·nm² for every $n$ and $L$ · each level is $(L_{\\rm ref}/L)^2 = ${v.fix(st.ratio, 4)}$ times its reference value` + (st.lam ? ` · jump $${st.n0}\\to${st.n0 - 1}$: $\\lambda = hc/\\Delta E = ${v.fix(st.lam, 1)}$ nm` : '') + '.');
      },
    },
    // ------------------------------------------------------------------ 3.4
    {
      num: '3.4',
      kind: 'Theorem',
      name: 'Box eigenstates are complete and orthonormal',
      statement: String.raw`The eigenfunctions $\psi_n(x)=\sqrt{2/L}\,\sin(n\pi x/L)$, $n\ge1$, of the infinite square well satisfy
$$\langle\psi_m|\psi_n\rangle=\int_0^L\psi_m(x)\,\psi_n(x)\,dx=\delta_{mn},$$
and they are **complete** in $L^2(0,L)$: for every square-integrable $f$, with $c_n=\langle\psi_n|f\rangle$, the partial sums $S_N=\sum_{n\le N}c_n\psi_n$ converge to $f$ in mean square,
$$\|f-S_N\|^2=\|f\|^2-\sum_{n\le N}|c_n|^2\ \longrightarrow\ 0\qquad(N\to\infty),$$
so Parseval's identity $\sum_n|c_n|^2=\|f\|^2$ holds. The convergence is in $L^2$, not necessarily pointwise: $f$ need not vanish at the walls, and near a jump the partial sums overshoot (Gibbs). Omitting even one $\psi_n$ destroys completeness.`,
      idea: String.raw`Orthogonality is the product-to-sum formula $2\sin a\sin b=\cos(a-b)-\cos(a+b)$, whose terms integrate to zero over whole periods; more conceptually, the $\psi_n$ are eigenfunctions of the symmetric operator $-d^2/dx^2$ with Dirichlet conditions for different eigenvalues (pde-4.5). Completeness reduces to that of the trigonometric system (rca-4.24): extend $f$ to an odd function on $[-L,L]$; its Fourier series contains only sines, and those are exactly the $\psi_n$. For an orthonormal family, $\|f-S_N\|^2=\|f\|^2-\sum_{n\le N}|c_n|^2$ (Bessel), so mean-square convergence is the same as Parseval. A family that is not orthonormal breaks this bookkeeping: the coefficients $\langle\phi_n|f\rangle$ no longer give the best approximation, and Bessel's inequality can fail.`,
      caption: String.raw`Left: the matrix of computed overlaps $\langle\phi_m|\phi_n\rangle$ — the identity for **box eigenstates**. Right: a function $f$ (pick one, or **draw** it) and its partial sum $S_N$; slide **$N$** up and watch the mean-square error (bottom, log–log) fall, the dots (measured $\|f-S_N\|^2$) sitting on the line $\|f\|^2-\sum|c_n|^2$. The constant $f=1$ violates the boundary conditions, yet still converges in mean square, with Gibbs overshoot at the walls. Break completeness with **odd $n$ only**: the error stalls at the size of the part of $f$ that is antisymmetric about the centre. Break orthonormality with **sines of a wider box**: the overlap matrix fills in, and the naive sum stops converging.`,
      deps: ['qm-3.3', 'rca-4.24'],
      see: ['pde-4.5', 'pma-8.16', 'rca-4.18', 'music-2.7'],
      refs: ['Griffiths §2.2'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Particle_in_a_box' },
      tags: ['completeness', 'orthonormal basis', 'parseval'],
      viz(v) {
        const M = v.M, NX = 801, { x, dx } = grid(0, 1, NX), NMAX = 60, LW = 1.3;
        const ND = 121, xd = Float64Array.from({ length: ND }, (_, i) => i / (ND - 1));
        let yd = Float64Array.from(xd, (X) => 0.9 * Math.exp(-((X - 0.3) ** 2) / 0.008) - 0.5 * Math.exp(-((X - 0.7) ** 2) / 0.02) + 0.2 * Math.sin(9 * X) * X);
        const FUNS = {
          tent: ['off-centre tent', (X) => (X < 0.3 ? X / 0.3 : (1 - X) / 0.7)],
          pulse: ['square pulse', (X) => (X > 0.18 && X < 0.42 ? 1 : 0)],
          one: ['constant 1', () => 1],
          draw: ['draw', (X) => interp(xd, yd, X)],
        };
        const BASES = { box: 'box eigenstates', odd: 'odd $n$ only', wide: 'sines of a wider box' };
        const fs = v.select('function $f$', Object.entries(FUNS).map(([value, f]) => ({ value, label: f[0] })), 'tent');
        const bs = v.select('basis', Object.entries(BASES).map(([value, label]) => ({ value, label })), 'box');
        const Ns = v.slider('terms $N$', 1, NMAX, 6, { int: true });
        const sG = v.stage({ x: [0, 1], y: [0, 1], height: 310, axes: false, weight: 0.8, title: 'overlaps $\\langle\\phi_m|\\phi_n\\rangle$, first 8' });
        const sF = v.stage({ x: [0, 1], y: [-0.5, 1.4], height: 310, axes: 'box', weight: 1.2, xlabel: 'x / L', title: '$f$ and $S_N=\\sum_{n\\le N}\\langle\\phi_n|f\\rangle\\,\\phi_n$' });
        const sE = v.stage({ x: [1, NMAX], y: [1e-7, 2], xlog: true, ylog: true, height: 200, axes: 'box', full: true, xlabel: 'N', ylabel: 'error', title: 'measured $\\|f-S_N\\|^2$ (dots) and $\\|f\\|^2-\\sum_{n\\le N}|c_n|^2$ (line)' });
        sF.onDrag((X, Y) => {
          if (fs.value !== 'draw') return;
          const i = Math.round(X * (ND - 1)); if (i < 0 || i >= ND) return;
          for (let j = Math.max(0, i - 3); j <= Math.min(ND - 1, i + 3); j++) { const w = Math.exp(-((j - i) ** 2) / 4); yd[j] = (1 - w) * yd[j] + w * M.clamp(Y, -0.45, 1.35); }
        });
        const basisCache = {};
        const basis = (b) => {
          if (basisCache[b]) return basisCache[b];
          const out = [];
          for (let n = 1; n <= NMAX; n++) {
            const k = b === 'box' ? n * Math.PI : b === 'odd' ? (2 * n - 1) * Math.PI : (n * Math.PI) / LW, c = b === 'wide' ? Math.sqrt(2 / LW) : Math.SQRT2;
            out.push(Float64Array.from(x, (X) => c * Math.sin(k * X)));
          }
          return (basisCache[b] = out);
        };
        const ip = (a, b) => { let s = 0; for (let i = 0; i < NX; i++) s += a[i] * b[i] * (i === 0 || i === NX - 1 ? 0.5 : 1); return s * dx; };
        let st = null;
        v.render(() => {
          const col = phaseLUT(v), phi = basis(bs.value), f = Float64Array.from(x, FUNS[fs.value][1]), N = Ns.value;
          // Gram matrix
          const NG = 8, G = []; let off = 0;
          for (let m = 0; m < NG; m++) { G.push([]); for (let n = 0; n < NG; n++) { const g = ip(phi[m], phi[n]); G[m].push(g); if (m !== n) off = Math.max(off, Math.abs(g)); else off = Math.max(off, Math.abs(g - 1)); } }
          const cw = 1 / NG;
          for (let m = 0; m < NG; m++) for (let n = 0; n < NG; n++) {
            const g = G[m][n], x0 = n * cw, y0 = 1 - (m + 1) * cw, cc = g >= 0 ? v.ramp(Math.min(1, g), 'accent') : v.ramp(Math.min(1, -g), 'red');
            sG.rect(x0 + 0.004, y0 + 0.004, x0 + cw - 0.004, y0 + cw - 0.004, { fill: cc, fillAlpha: 1, color: 'faint', width: 0.6 });
            sG.text(Math.abs(g) < 0.005 ? '0' : v.fix(g, 2), x0 + cw / 2, y0 + cw / 2, { align: 'center', size: 10, color: Math.abs(g) > 0.55 ? 'panel' : 'ink', halo: false });
          }
          // coefficients and partial sums
          const c = phi.map((p) => ip(p, f)), nf = ip(f, f), SN = new Float64Array(NX), errs = [], bess = [];
          let acc = 0, SNshow = SN;
          for (let n = 0; n < NMAX; n++) {
            acc += c[n] * c[n]; for (let i = 0; i < NX; i++) SN[i] += c[n] * phi[n][i];
            if (n + 1 === N) SNshow = Float64Array.from(SN);
            const r = Float64Array.from(f, (y, i) => y - SN[i]); errs.push(ip(r, r)); bess.push(nf - acc);
          }
          const ymax = Math.max(1.3, ...f) + 0.1, ymin = Math.min(-0.4, ...f) - 0.1;
          sF.setView([0, 1], [ymin, ymax]);
          sF.hline(0, { color: 'faint' });
          sF.path(Array.from(x, (X, i) => [X, f[i]]), { color: 'accent', width: 2.4 });
          drawReal(sF, x, Float64Array.from(f, (y, i) => y - SNshow[i]), { col, alpha: 0.25, outline: false });
          sF.path(Array.from(x, (X, i) => [X, SNshow[i]]), { color: 'green', width: 2 });
          if (fs.value === 'draw') sF.corner('drag to draw f', 'tr', { color: 'muted' });
          // error plot
          sE.path(bess.map((y, n) => [n + 1, y > 0 ? y : NaN]), { color: 'purple', width: 2 });
          sE.dots(errs.map((y, n) => [n + 1, y]).filter((p) => p[1] > 1e-7), { r: 2.8, color: 'gold' });
          sE.dot(N, errs[N - 1], { r: 6.5, color: 'gold' });
          if (bs.value === 'odd') sE.hline(errs[NMAX - 1], { color: 'red', dash: [5, 4], width: 1.4 });
          const neg = bess.findIndex((y) => y < 0);
          if (neg >= 0) sE.corner(`Bessel's inequality fails from N = ${neg + 1}: Σ|cₙ|² > ‖f‖²`, 'bl', { color: 'red', weight: 600 });
          st = { N, err: errs[N - 1], bes: bess[N - 1], nf, off, par: acc, b: bs.value, floor: errs[NMAX - 1] };
        });
        v.legend([['accent', '$f$'], ['green', '$S_N$'], ['gold', 'measured $\\|f-S_N\\|^2$', { dot: true }], ['purple', '$\\|f\\|^2-\\sum_{n\\le N}|c_n|^2$']]);
        v.readout(() => st && `largest entry of $\\langle\\phi_m|\\phi_n\\rangle-\\delta_{mn}$: **${st.off < 1e-9 ? '< 10⁻⁹' : v.fix(st.off, 3)}** · $N = ${st.N}$: $\\|f-S_N\\|^2 = ${v.sci(st.err, 3)}$ vs $\\|f\\|^2-\\sum_{n\\le N}|c_n|^2 = ${st.bes < 0 ? '-' : ''}${v.sci(Math.abs(st.bes), 3)}$` + (st.b === 'box' ? ` · Parseval with 60 terms: $\\sum|c_n|^2 = ${v.fix(st.par, 5)}$ vs $\\|f\\|^2 = ${v.fix(st.nf, 5)}$` : st.b === 'odd' ? ` · the error stalls at ${v.fix(st.floor, 4)}: an incomplete family` : ' · not orthonormal: the coefficients $\\langle\\phi_n|f\\rangle$ no longer add up') + '.');
      },
    },
    // ------------------------------------------------------------------ 3.5
    {
      num: '3.5',
      kind: 'Phenomenon',
      name: 'Quantum revivals',
      statement: String.raw`In the infinite square well every state returns exactly to itself after the **revival time**
$$T_{\rm rev}=\frac{2\pi\hbar}{E_1}=\frac{4mL^2}{\pi\hbar}.$$
A localized wave packet first bounces back and forth like a classical particle, then spreads around the box into an irregular interference pattern, and at $t=T_{\rm rev}$ reassembles perfectly: $\Psi(x,T_{\rm rev})=\Psi(x,0)$. At $T_{\rm rev}/2$ it reappears as its mirror image, $\Psi(x,T_{\rm rev}/2)=-\Psi(L-x,0)$, and at rational fractions $\tfrac pq T_{\rm rev}$ as a superposition of a few copies (**fractional revivals**); plotted over $(x,t)$ the density forms a "quantum carpet". Exact revivals need energies in integer ratios; for a general spectrum they are only approximate.`,
      idea: String.raw`By 3.2, $\Psi(x,t)=\sum c_n e^{-iE_nt/\hbar}\psi_n(x)$, and $E_n=n^2E_1$. At $t=T_{\rm rev}$ every phase is $e^{-2\pi in^2}=1$, so the sum is back to $\Psi(x,0)$. At half that time the phase is $e^{-i\pi n^2}=(-1)^n$, and $(-1)^n\psi_n(x)=-\psi_n(L-x)$ gives the mirror image. At $t=\tfrac pqT_{\rm rev}$ the phases $e^{-2\pi ipn^2/q}$ repeat in $n$ with period $q$ (or $2q$), so they can be written as a finite Fourier sum and $\Psi$ becomes a few shifted copies of $\Psi(x,0)$, the Talbot effect of optics in time. A perturbation that makes the levels irregular dephases the terms and spoils the revival.`,
      caption: String.raw`Top: $\Psi(x,t)$ in the box (height $|\Psi|$, colour phase), with the initial packet dashed. Middle: the carpet $|\Psi(x,t)|^2$ over one revival period, time running to the right — the packet first zig-zags between the walls like a classical particle, then dissolves into a fine weave; below, on the same time axis, the return probability $|\langle\Psi(0)|\Psi(t)\rangle|^2$, which climbs back to exactly 1 at $T_{\rm rev}=4mL^2/\pi\hbar$. Use the buttons to jump to $T_{\rm rev}/4$ (two copies), $T_{\rm rev}/2$ (mirror image) and $T_{\rm rev}$. Change the packet's width and momentum: the carpet changes, $T_{\rm rev}$ does not. Turn up the **impurity**, which shifts the levels irregularly (first-order perturbation by a weak delta at $x=0.37L$): the revival fades.`,
      deps: ['qm-3.3', 'qm-3.2'],
      see: ['waves-8.9', 'qm-4.8'],
      refs: ['Griffiths §2.2'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Quantum_revival' },
      tags: ['revivals', 'quantum carpet', 'interference'],
      viz(v) {
        const M = v.M, L = 1, TR = (4 * L * L) / Math.PI, TMAX = 1.05 * TR, PER = 21, NXC = 150, NTC = 860, SUB = 3, NXF = 600, X0 = 0.32, AIMP = 0.37;
        const sig = v.slider('packet width $\\sigma/L$', 0.03, 0.12, 0.08, { step: 0.001 });
        const k0s = v.slider('momentum $k_0L$', 0, 40, 10, { step: 0.5 });
        const al = v.slider('impurity strength $\\alpha$', 0, 1.5, 0, { step: 0.01 });
        const jump = (f) => () => { v.pause(); v.t = (PER * f) / 1.05; };
        v.button('$t=T_{\\rm rev}/4$', jump(0.25)); v.button('$T_{\\rm rev}/2$', jump(0.5)); v.button('$T_{\\rm rev}$', jump(1));
        const s1 = v.stage({ x: [-0.04, 1.04], y: [0, 1], height: 190, axes: 'box', full: true, xlabel: 'x / L', title: '$\\Psi(x,t)$ in the box' });
        const TT = [[0, '0'], [TR / 4, '¼ T_rev'], [TR / 2, '½ T_rev'], [(3 * TR) / 4, '¾ T_rev'], [TR, 'T_rev']];
        const s2 = v.stage({ x: [0, TMAX], y: [0, 1], height: 230, axes: 'box', full: true, ylabel: 'x / L', xticks: TT, title: 'quantum carpet $|\\Psi(x,t)|^2$, time running to the right' });
        const s3 = v.stage({ x: [0, TMAX], y: [0, 1.12], height: 130, axes: 'box', full: true, xlabel: 't', xticks: TT, yticks: [0, 0.5, 1], title: 'return probability $|\\langle\\Psi(0)|\\Psi(t)\\rangle|^2$' });
        const { x: xf, dx: dxf } = grid(0, L, NXF);
        let D = null;
        const data = () => {
          const key = `${sig.value}|${k0s.value}|${al.value}`; if (D && D.key === key) return D;
          const s = sig.value, k0 = k0s.value, N = Math.min(240, Math.ceil((k0 + 7 / s) / Math.PI) + 12);
          const re0 = Float64Array.from(xf, (X) => Math.exp(-((X - X0) ** 2) / (4 * s * s)) * Math.cos(k0 * X) * Math.sin(Math.PI * X) ** 0.02);
          const im0 = Float64Array.from(xf, (X) => Math.exp(-((X - X0) ** 2) / (4 * s * s)) * Math.sin(k0 * X) * Math.sin(Math.PI * X) ** 0.02);
          normalize(re0, im0, dxf);
          const cr = [], ci = [], E = [], phi = [];
          for (let n = 1; n <= N; n++) {
            const p = Float64Array.from(xf, (X) => Math.SQRT2 * Math.sin(n * Math.PI * X)); phi.push(p);
            let a = 0, b = 0; for (let i = 0; i < NXF; i++) { a += p[i] * re0[i]; b += p[i] * im0[i]; } cr.push(a * dxf); ci.push(b * dxf);
            E.push((n * n * Math.PI * Math.PI) / 2 + 2 * al.value * Math.sin(n * Math.PI * AIMP) ** 2);
          }
          // carpet
          const tab = []; for (let n = 0; n < N; n++) tab.push(Float64Array.from({ length: NXC }, (_, j) => Math.SQRT2 * Math.sin((n + 1) * Math.PI * ((j + 0.5) / NXC))));
          const car = new Float32Array(NTC * NXC), pr = new Float64Array(N), pi = new Float64Array(N);
          for (let r = 0; r < NTC; r++) for (let q = 0; q < SUB; q++) { // each row averages SUB instants across its time slot (no aliasing of the fast phases)
            const tau = (TMAX * (r + (q + 0.5) / SUB - 0.5)) / (NTC - 1);
            for (let n = 0; n < N; n++) { const c = Math.cos(E[n] * tau), sn = -Math.sin(E[n] * tau); pr[n] = cr[n] * c - ci[n] * sn; pi[n] = cr[n] * sn + ci[n] * c; }
            for (let j = 0; j < NXC; j++) { let a = 0, b = 0; for (let n = 0; n < N; n++) { a += pr[n] * tab[n][j]; b += pi[n] * tab[n][j]; } car[r * NXC + j] += (a * a + b * b) / SUB; }
          }
          let peak = 0; for (let i = 0; i < NXF; i++) peak = Math.max(peak, re0[i] ** 2 + im0[i] ** 2);
          let W = 0; for (let n = 0; n < N; n++) W += cr[n] ** 2 + ci[n] ** 2; // weight kept by the truncation (≈ 1 − 10⁻⁵): the evolved state is the truncated one
          const ac = []; for (let r = 0; r <= 900; r++) { const tau = (TMAX * r) / 900; let a = 0, b = 0; for (let n = 0; n < N; n++) { const w = cr[n] ** 2 + ci[n] ** 2; a += w * Math.cos(E[n] * tau); b -= w * Math.sin(E[n] * tau); } ac.push([(a * a + b * b) / (W * W), tau]); }
          return (D = { key, N, cr, ci, E, phi, car, peak, ac, re0, im0, W });
        };
        const state = (D, tau) => {
          const re = new Float64Array(NXF), im = new Float64Array(NXF);
          for (let n = 0; n < D.N; n++) { const c = Math.cos(D.E[n] * tau), sn = -Math.sin(D.E[n] * tau), a = D.cr[n] * c - D.ci[n] * sn, b = D.cr[n] * sn + D.ci[n] * c, p = D.phi[n]; for (let i = 0; i < NXF; i++) { re[i] += a * p[i]; im[i] += b * p[i]; } }
          return { re, im };
        };
        let st = null;
        v.animate((t) => {
          const D = data(), col = phaseLUT(v), tau = (t / PER) * TMAX, P = state(D, tau), top = Math.sqrt(D.peak) * 1.25;
          s1.setView([-0.04, 1.04], [-0.12 * top, top]);
          s1.rect(-0.04, -0.12 * top, 0, top, { fill: 'muted', fillAlpha: 0.15, hatch: 'muted', hatchAlpha: 0.3, stroke: false }); s1.rect(1, -0.12 * top, 1.04, top, { fill: 'muted', fillAlpha: 0.15, hatch: 'muted', hatchAlpha: 0.3, stroke: false });
          s1.path(Array.from(xf, (X, i) => [X, Math.hypot(D.re0[i], D.im0[i])]), { color: 'ink', width: 1.2, dash: [3, 3], alpha: 0.6 });
          drawPsi(s1, xf, P.re, P.im, { col });
          phaseWheel(s1, col, s1.W - 60, 36, 11);
          // carpet
          const CA = v.rgb('accent'), CG = v.rgb('gold'), BG = v.rgb('panel');
          s2.raster((X, Y) => {
            const r = Math.round((X / TMAX) * (NTC - 1)), j = Math.floor(Y * NXC); if (r < 0 || r >= NTC || j < 0 || j >= NXC) return null;
            const u = Math.min(1, Math.sqrt(D.car[r * NXC + j] / D.peak)), w = Math.max(0, (u - 0.55) / 0.45);
            const a = u * (1 - w), b = u * w;
            return [BG[0] + (CA[0] - BG[0]) * a + (CG[0] - BG[0]) * b, BG[1] + (CA[1] - BG[1]) * a + (CG[1] - BG[1]) * b, BG[2] + (CA[2] - BG[2]) * a + (CG[2] - BG[2]) * b];
          }, { res: 2, key: D.key });
          s2.axes();
          for (const f of [0.25, 0.5, 0.75, 1]) s2.vline(f * TR, { color: 'ink', width: 0.8, dash: [2, 4], alpha: 0.4 });
          s2.vline(tau, { color: 'red', width: 1.8 });
          // return probability
          for (const f of [0.25, 0.5, 0.75, 1]) s3.vline(f * TR, { color: 'ink', width: 0.8, dash: [2, 4], alpha: 0.4 });
          s3.path(D.ac.map(([p, q]) => [q, p]), { color: 'accent', width: 1.6 });
          let a = 0, b = 0; for (let n = 0; n < D.N; n++) { const w = D.cr[n] ** 2 + D.ci[n] ** 2; a += w * Math.cos(D.E[n] * tau); b -= w * Math.sin(D.E[n] * tau); }
          const ret = (a * a + b * b) / (D.W * D.W); s3.vline(tau, { color: 'red', width: 1.4 }); s3.dot(tau, ret, { r: 5.5, color: 'red' });
          let aR = 0, bR = 0; for (let n = 0; n < D.N; n++) { const w = D.cr[n] ** 2 + D.ci[n] ** 2; aR += w * Math.cos(D.E[n] * TR); bR -= w * Math.sin(D.E[n] * TR); }
          // mirror check at T/2: overlap with −Ψ(L − x, 0)
          let mr = 0, mi = 0; const Ph = state(D, TR / 2); for (let i = 0; i < NXF; i++) { const j = NXF - 1 - i; mr += -D.re0[j] * Ph.re[i] - D.im0[j] * Ph.im[i]; mi += -D.re0[j] * Ph.im[i] + D.im0[j] * Ph.re[i]; }
          st = { tau, ret, retR: (aR * aR + bR * bR) / (D.W * D.W), mirror: ((mr * mr + mi * mi) * dxf * dxf) / D.W, N: D.N };
        }, { period: PER, still: PER / 1.05 - 0.02 });
        v.legend([['accent', '|Ψ|² (carpet), return probability'], ['red', 'now'], ['ink', 'initial |Ψ|', { dash: true }]]);
        v.readout(() => st && `$T_{\\rm rev} = 4mL^2/\\pi\\hbar = ${v.fix(TR, 4)}$ ($\\hbar = m = L = 1$) · now $t = ${v.fix(st.tau / TR, 4)}\\,T_{\\rm rev}$, return probability **${v.fix(st.ret, 4)}** · at $T_{\\rm rev}$ it is **${v.fix(st.retR, 6)}**${al.value ? ' — the irregular level shifts spoil it' : ''} · at $T_{\\rm rev}/2$ the overlap with the mirror image $-\\Psi(L-x,0)$ is ${v.fix(st.mirror, 4)} · ${st.N} modes.`);
      },
    },
    // ------------------------------------------------------------------ 3.6
    {
      num: '3.6',
      kind: 'Model',
      name: 'Free particle: plane waves',
      statement: String.raw`For $V=0$ the stationary states are the **plane waves**
$$\psi_k(x)=e^{ikx},\qquad E=\frac{\hbar^2k^2}{2m},\qquad \Psi_k(x,t)=e^{i(kx-\hbar k^2t/2m)},\qquad k\in\R,$$
of definite momentum $\hbar k$ ($k>0$ moving right, $k<0$ left); $e^{\pm ikx}$ are degenerate. They are **not normalizable** — $|\psi_k|^2=1$ everywhere and $\int_{-L}^{L}|\psi_k|^2dx=2L\to\infty$ — so no free particle is ever in a plane-wave state: the energy spectrum is continuous and has no eigenvectors in $L^2$. Physical states are superpositions over a continuum of $k$,
$$\Psi(x,t)=\frac1{\sqrt{2\pi}}\int\phi(k)\,e^{i(kx-\hbar k^2t/2m)}\,dk,$$
normalizable whenever $\phi\in L^2$; a band of width $\Delta k$ gives a packet of width $\Delta x\gtrsim1/(2\Delta k)$. A finite (or discrete) set of plane waves gives a periodic pattern, still not normalizable.`,
      idea: String.raw`Without a potential, $-\frac{\hbar^2}{2m}\psi''=E\psi$ has the solutions $e^{\pm ikx}$ for every $E\ge0$, and nothing (no wall, no decay condition) selects particular values of $k$: the spectrum is the whole half-line, and the eigenfunctions have constant modulus. The way out is Fourier analysis (2.10): a continuous superposition with an $L^2$ amplitude $\phi(k)$ is square-integrable by Plancherel, with $\int|\Psi|^2dx=\int|\phi|^2dk$. A discrete sum $\sum a_je^{ik_jx}$ with spacing $\delta k$ is periodic with period $2\pi/\delta k$, so its norm grows linearly with the window; only as the spacing shrinks to zero does the pattern become a single localized packet — the width–bandwidth trade-off of Fourier analysis.`,
      caption: String.raw`Top: the component plane waves (real parts, weighted by their amplitude), each with its own wave number. Middle: their sum $\Psi(x,t)$, height $|\Psi|$ coloured by phase. **One plane wave**: uniform $|\Psi|$ — the colour (phase) winds along $x$ and runs to the right in time, but there is nothing to normalize. **$N$ equally spaced $k$**: a periodic train of packets, repeating every $2\pi/\delta k$. **Continuous band**: a single normalizable packet whose width shrinks as $\Delta k$ grows. Bottom right: $\int_{-L}^{L}|\Psi|^2dx$ on log–log axes grows like $L$ for the first two and levels off at 1 for the band.`,
      deps: ['qm-3.1', 'qm-2.10'],
      see: ['qm-2.12', 'waves-2.10', 'rca-9.13'],
      refs: ['Griffiths §2.4', 'Hall ch. 4'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Free_particle' },
      tags: ['free particle', 'plane waves', 'continuous spectrum'],
      viz(v) {
        const XR = 40, NXP = 900, { x } = grid(-XR, XR, NXP), PER = 26, X0 = -18;
        let dkS = null, spS = null, nS = null;
        const spec = v.select('spectrum', [{ value: 'one', label: 'one plane wave' }, { value: 'comb', label: '$N$ equally spaced $k$' }, { value: 'band', label: 'continuous band' }], 'band', { onChange: () => sync() });
        const k0 = v.slider('centre $k_0$', 0.4, 2.5, 1.2, { step: 0.01 });
        dkS = v.slider('band width $\\Delta k$', 0.05, 0.8, 0.25, { step: 0.005 });
        spS = v.slider('spacing $\\delta k$', 0.1, 0.8, 0.3, { step: 0.005 });
        nS = v.slider('number of waves $N$', 2, 9, 5, { int: true });
        const sync = () => { dkS.el.hidden = spec.value !== 'band'; spS.el.hidden = nS.el.hidden = spec.value !== 'comb'; };
        sync();
        const sW = v.stage({ x: [-XR, XR], y: [-0.5, 9.5], height: 220, axes: false, full: true, title: 'component plane waves $\\operatorname{Re}\\,a_j e^{i(k_jx-\\omega_jt)}$' });
        const sS = v.stage({ x: [-XR, XR], y: [0, 1], height: 190, axes: 'box', full: true, xlabel: 'x', title: 'their sum $\\Psi(x,t)$: height $|\\Psi|$, colour $\\arg\\Psi$' });
        const sK = v.stage({ x: [0, 3.5], y: [0, 1.15], height: 170, axes: 'box', weight: 1, xlabel: 'k', yticks: [], title: 'amplitudes $|\\phi(k)|$' });
        const sN = v.stage({ x: [0.1, 1e4], y: [0.01, 3e4], xlog: true, ylog: true, height: 170, axes: 'box', weight: 1, xlabel: 'L', title: '$\\int_{-L}^{L}|\\Psi(x,0)|^2dx$' });
        /** The discrete components {k, a} (for the band: representatives) and the exact Ψ(x, t). */
        const comps = () => {
          const K = k0.value;
          if (spec.value === 'one') return [{ k: K, a: 1 }];
          if (spec.value === 'comb') { const N = nS.value, d = spS.value; return Array.from({ length: N }, (_, j) => ({ k: K + (j - (N - 1) / 2) * d, a: 1 / Math.sqrt(N) })); }
          const d = dkS.value; return Array.from({ length: 9 }, (_, j) => { const k = K + (j - 4) * 0.6 * d; return { k, a: Math.exp(-((k - K) ** 2) / (4 * d * d)) }; });
        };
        const psi = (X, t) => {
          if (spec.value !== 'band') { let r = 0, q = 0; for (const c of comps()) { const ph = c.k * X - 0.5 * c.k * c.k * t; r += c.a * Math.cos(ph); q += c.a * Math.sin(ph); } return [r, q]; }
          const sx = 1 / (2 * dkS.value), a = sx * sx, K = k0.value, u = X - X0 - K * t, tt = t / (2 * a); // Gaussian, ħ = m = 1
          const den = 1 + tt * tt, nr = -(u * u) / (4 * a * den), ni = (u * u * tt) / (4 * a * den), amp = (2 * Math.PI * a) ** -0.25 * den ** -0.25;
          const ph = ni + K * (X - X0) - 0.5 * K * K * t - 0.5 * Math.atan(tt), m = amp * Math.exp(nr);
          return [m * Math.cos(ph), m * Math.sin(ph)];
        };
        let st = null;
        v.animate((t) => {
          const col = phaseLUT(v), cs = comps(), n = cs.length, amax = Math.max(...cs.map((c) => c.a));
          // components
          sW.setView([-XR, XR], [-0.7, n - 0.3]);
          cs.forEach((c, j) => {
            const y0 = n - 1 - j, w = (0.42 * c.a) / amax;
            sW.hline(y0, { color: 'faint', width: 0.8 });
            sW.fn((X) => y0 + w * Math.cos(c.k * (spec.value === 'band' ? X - X0 : X) - 0.5 * c.k * c.k * t), { color: FAMILY[j % FAMILY.length], width: 1.5, n: 900 });
            sW.text(`k = ${v.fix(c.k, 2)}`, XR, y0, { align: 'right', dx: -4, dy: -9, size: 10.5, color: 'muted' });
          });
          // sum
          const re = new Float64Array(NXP), im = new Float64Array(NXP);
          for (let i = 0; i < NXP; i++) { const [r, q] = psi(x[i], t); re[i] = r; im[i] = q; }
          let top = 0.05; for (let i = 0; i < NXP; i++) top = Math.max(top, Math.hypot(re[i], im[i]));
          if (spec.value === 'band') { const sx = 1 / (2 * dkS.value); top = Math.max(top, (2 * Math.PI * sx * sx) ** -0.25); }
          sS.setView([-XR, XR], [-0.95 * top, top * 1.22]);
          sS.hline(-0.5 * top, { color: 'faint', width: 0.8 });
          sS.path(Array.from(x, (X, i) => [X, -0.5 * top + 0.36 * re[i]]), { color: 'accent', width: 1.1 });
          sS.text('Re Ψ', -XR + 0.6, -0.5 * top + 0.4 * top, { size: 10.5, color: 'accent' });
          drawPsi(sS, x, re, im, { col });
          if (spec.value === 'comb') { const P = (2 * Math.PI) / spS.value; for (let q = -6; q <= 6; q++) { const X = q * P; if (Math.abs(X) < XR) sS.vline(X, { color: 'muted', dash: [2, 4], width: 1 }); } sS.text(`period 2π/δk = ${v.fix((2 * Math.PI) / spS.value, 2)}`, -XR + 1, top * 1.13, { size: 11, color: 'muted' }); }
          phaseWheel(sS, col, sS.W - 34, 36, 11);
          // spectrum
          sK.setView([0, 3.5], [0, 1.15]);
          if (spec.value === 'band') { const d = dkS.value, K = k0.value; sK.fn((k) => Math.exp(-((k - K) ** 2) / (4 * d * d)), { color: 'accent', width: 2.2, fill: 'accent', fillAlpha: 0.15 }); cs.forEach((c, j) => sK.line(c.k, 0, c.k, c.a, { color: FAMILY[j % FAMILY.length], width: 1.4, dash: [3, 3] })); }
          else cs.forEach((c, j) => { sK.line(c.k, 0, c.k, c.a / amax, { color: FAMILY[j % FAMILY.length], width: 3 }); sK.dot(c.k, c.a / amax, { r: 3.5, color: FAMILY[j % FAMILY.length] }); });
          // partial norms
          const NL = (Lw) => {
            if (spec.value === 'band') { const sx = 1 / (2 * dkS.value); return v.M.erf(Lw / (Math.SQRT2 * sx)); }
            let s = 0; for (const a of cs) for (const b of cs) { const d = a.k - b.k; s += a.a * b.a * (Math.abs(d) < 1e-12 ? 2 * Lw : (2 * Math.sin(d * Lw)) / d); } return s;
          };
          const pts = []; for (let k = 0; k <= 200; k++) { const Lw = 0.1 * 10 ** (5 * k / 200); pts.push([Lw, NL(Lw)]); }
          sN.path(pts, { color: spec.value === 'band' ? 'green' : 'red', width: 2.4 });
          sN.path([[0.1, 0.2], [1e4, 2e4]], { color: 'muted', width: 1, dash: [4, 4] }); sN.text('∝ L', 2000, 4000 * 1.5, { color: 'muted', size: 11, dx: -6, dy: -6, align: 'right' });
          let m0 = 0, m1 = 0, m2 = 0; const dx = x[1] - x[0]; for (let i = 0; i < NXP; i++) { const r = re[i] ** 2 + im[i] ** 2; m0 += r; m1 += r * x[i]; m2 += r * x[i] * x[i]; }
          st = { mode: spec.value, N100: NL(100), N1e4: NL(1e4), w: Math.sqrt(Math.max(0, m2 / m0 - (m1 / m0) ** 2)), norm: m0 * dx, dk: dkS.value, t };
        }, { period: PER, still: 8 });
        v.legend([['ink', '|Ψ| (fill = phase)'], ['accent', 'Re Ψ (below)'], ['green', 'normalizable: ∫|Ψ|² → 1'], ['red', 'not normalizable: ∫|Ψ|² ∝ L']]);
        v.readout(() => st && (st.mode === 'band' ? `continuous band: $\\int|\\Psi|^2dx = ${v.fix(st.norm, 5)}$ on screen and $\\int_{-L}^{L}\\to1$ — a normalizable state · width now $\\Delta x = ${v.fix(st.w, 3)}$; at $t=0$ it is $1/(2\\Delta k) = ${v.fix(1 / (2 * st.dk), 3)}$, and it spreads as time goes on (2.12).` : `$\\int_{-L}^{L}|\\Psi|^2dx = ${v.fix(st.N100, 1)}$ for $L = 100$ and ${v.fix(st.N1e4, 0)} for $L = 10^4$: it grows without bound, so this is not a state in $L^2$` + (st.mode === 'one' ? ' — $|\\Psi|^2 = 1$ everywhere: definite momentum, completely unknown position.' : ` — the pattern repeats every $2\\pi/\\delta k = ${v.fix(2 * Math.PI / spS.value, 2)}$; shrink $\\delta k$ and the copies move apart.`)));
      },
    },
    // ------------------------------------------------------------------ 3.7
    {
      num: '3.7',
      kind: 'Theorem',
      name: 'Node theorem',
      statement: String.raw`Let $V$ be continuous on an interval $[a,b]$ with $\psi(a)=\psi(b)=0$ (or on the whole line with $V$ bounded below and confining, so that the spectrum is discrete). List the bound states by increasing energy, $E_1<E_2<E_3<\cdots$. Then the $n$-th eigenfunction $\psi_n$ has **exactly $n-1$ nodes** (zeros in the interior), and between two consecutive zeros of $\psi_n$ lies exactly one zero of $\psi_{n+1}$. More precisely (Sturm's oscillation theorem): for any energy $E$, the solution of $-\frac{\hbar^2}{2m}u''+Vu=Eu$ with $u(a)=0$ has as many zeros in $(a,b)$ as there are eigenvalues below $E$. In particular the ground state has no nodes and can be taken positive.`,
      idea: String.raw`Raising $E$ makes $u''/u=2m(V-E)/\hbar^2$ more negative, so the solution oscillates faster: by the Sturm comparison theorem (ode-4.11), its zeros move monotonically toward $a$ as $E$ increases, and no zero can appear or disappear in the interior — a double zero would force $u\equiv0$ by uniqueness. Zeros therefore enter only through the far end $b$, one at a time, and each entry is exactly the moment $u(b)=0$: an eigenvalue. Counting entries gives the theorem (ode-4.13). The same picture explains the shooting method (3.18): the node count of a trial solution tells you which eigenvalue you are near.`,
      caption: String.raw`Left: the levels of a potential you can type or pick, each $\psi_n$ drawn at its energy with its nodes marked in red — the labels count them: $0,1,2,\dots$ **Drag the gold handle** to set a trial energy $E$: the gold curve is the solution started from the left wall, generally blowing up at the right. Right: the number of zeros of that solution against $E$ — a staircase that steps up by exactly one at each eigenvalue (dashed lines), so the node count is the number of levels below $E$.`,
      deps: ['qm-3.1', 'ode-4.13'],
      see: ['ode-4.11', 'pde-7.5', 'music-2.4'],
      refs: ['Griffiths §2.2'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Sturm%E2%80%93Liouville_theory' },
      tags: ['nodes', 'sturm oscillation', 'eigenfunctions'],
      viz(v) {
        const M = v.M, A = -6, B = 6, NG = 600, K = 7, NE = 320;
        let Vin = null;
        v.select('potential', presetOptions(['bumpy', 'lopsided', 'double', 'harmonic']), 'bumpy', { onChange: (k) => Vin.set(PRESETS[k][1]) });
        Vin = v.input('$V(x) =$', PRESETS.bumpy[1], { vars: ['x'], width: 190 });
        const sL = v.stage({ x: [A, B], y: [0, 1], height: 360, axes: 'box', weight: 1.25, xlabel: 'x', ylabel: 'E', title: 'eigenfunctions with their nodes, and a trial solution at $E$' });
        const sR = v.stage({ x: [0, 1], y: [-0.4, K + 0.6], height: 360, axes: 'box', weight: 0.75, xlabel: 'E', ylabel: 'zeros', title: 'zeros of the trial solution against $E$' });
        const hE = sL.handle(A + 0.3, 1, { color: 'gold', r: 8, label: 'E', labelPos: 'e', constrain: (X, Y) => [hE.x, Y] });
        let S = null;
        const solve = () => {
          if (S && S.key === Vin.value) return S;
          const Vf = safeV(M, Vin.fn), R = M.schrodinger1D(Vf, [A, B], { n: NG, k: K }), x = R.x, h = x[1] - x[0], Vg = Float64Array.from(x, Vf);
          const Vmin = Math.min(...Vg), Etop = R.E[K - 1] + 0.25 * (R.E[K - 1] - Vmin), stair = [];
          for (let k = 0; k <= NE; k++) { const E = Vmin + ((Etop - Vmin) * k) / NE; stair.push([E, countNodes(numerov(Vg, h, E), 1, x.length - 2)]); }
          const nodes = R.psi.map((p) => countNodes(p, 1, x.length - 2, 1e-6));
          S = { key: Vin.value, x, h, Vg, E: R.E, psi: R.psi, Vmin, Etop, stair, nodes };
          hE.y = (R.E[1] + R.E[2]) / 2;
          return S;
        };
        let st = null;
        v.render(() => {
          const S = solve(), col = phaseLUT(v), span = S.E[K - 1] - S.Vmin, [xl, xr] = wellWindow(S.x, S.Vg, S.Etop + 0.1 * span);
          sL.setView([xl, xr], [S.Vmin - 0.06 * span, S.Etop]);
          hE.x = xl + 0.05 * (xr - xl); hE.y = M.clamp(hE.y, S.Vmin + 0.01 * span, S.Etop - 0.02 * span);
          let pmax = 0; for (const p of S.psi) for (const y of p) pmax = Math.max(pmax, Math.abs(y));
          const amp = (0.42 * span) / (K - 1) / pmax;
          levelDiagram(sL, { x: S.x, V: S.Vg, E: S.E, psi: S.psi, col, amp, nodes: true, label: (i) => `${S.nodes[i]} node${S.nodes[i] === 1 ? '' : 's'}` });
          // trial solution
          const E = hE.y, u = numerov(S.Vg, S.h, E), nz = countNodes(u, 1, S.x.length - 2);
          let um = 1e-300, ia = 0, ib = S.x.length - 1; while (ia < ib && S.Vg[ia] > E) ia++; while (ib > ia && S.Vg[ib] > E) ib--;
          for (let i = 0; i <= Math.min(S.x.length - 1, ib + 5); i++) um = Math.max(um, Math.abs(u[i]));
          sL.hline(E, { color: 'gold', width: 1, dash: [3, 3] });
          sL.clip(() => sL.path(Array.from(S.x, (X, i) => [X, E + (1.15 * amp * pmax * u[i]) / um]), { color: 'gold', width: 2.4 }));
          // staircase
          sR.setView([S.Vmin, S.Etop], [-0.4, K + 0.6]);
          for (let n = 0; n < K; n++) { sR.vline(S.E[n], { color: 'muted', dash: [4, 3], width: 1 }); sR.text(`E${sub(n + 1)}`, S.E[n], K + 0.35, { size: 10, color: 'muted', align: 'center' }); }
          const pts = []; S.stair.forEach(([e, k], j) => { if (j) pts.push([e, S.stair[j - 1][1]]); pts.push([e, k]); });
          sR.path(pts, { color: 'accent', width: 2.4 });
          sR.dot(E, nz, { r: 6.5, color: 'gold' });
          const below = S.E.filter((e) => e < E).length;
          st = { nodes: S.nodes, E, nz, below };
        });
        v.legend([['ink', 'ψₙ at Eₙ (blue +, orange −)'], ['red', 'nodes', { dot: true }], ['gold', 'trial solution at E'], ['accent', 'zero count']]);
        v.readout(() => st && `node counts of $\\psi_1,\\dots,\\psi_{${K}}$: **${st.nodes.join(', ')}** — exactly $n-1$ ${st.nodes.every((k, i) => k === i) ? '✓' : '✗'} · trial energy $E = ${v.fix(st.E, 4)}$: its solution has **${st.nz}** zeros, and **${st.below}** eigenvalue${st.below === 1 ? ' lies' : 's lie'} below $E$.`);
      },
    },
    // ------------------------------------------------------------------ 3.8
    {
      num: '3.8',
      kind: 'Theorem',
      name: 'No degenerate bound states in one dimension',
      statement: String.raw`In one dimension, with $V$ locally bounded on a connected interval or the whole line, two normalizable solutions $\psi_1,\psi_2$ of $-\frac{\hbar^2}{2m}\psi''+V\psi=E\psi$ with the **same** energy $E$ are proportional: every bound-state energy is **nondegenerate**. Consequently, as a parameter of $V$ varies continuously, two bound levels never cross — they approach and repel (an **avoided crossing**), with a gap that shrinks as the states' overlap does. The hypothesis matters: an impenetrable wall that cuts the line into two pieces, or a periodic (ring) geometry, allows degeneracy.`,
      idea: String.raw`For two solutions at one energy the Wronskian $W=\psi_1\psi_2'-\psi_1'\psi_2$ satisfies $W'=\psi_1\psi_2''-\psi_1''\psi_2=\frac{2m}{\hbar^2}(V-E)(\psi_1\psi_2-\psi_1\psi_2)=0$, so it is constant (ode-3.10; Abel's identity). Bound states vanish at infinity, so the constant is zero. Then $(\psi_2/\psi_1)'=-W/\psi_1^2=0$ wherever $\psi_1\neq0$, and since the zeros of a nontrivial solution are isolated, $\psi_2=c\,\psi_1$ on the whole connected domain. A wall where both functions vanish on an interval breaks this last step: the ratio may jump across it. Without degeneracy, levels as functions of a parameter are simple eigenvalues of a real symmetric problem, and generic simple eigenvalues of such a one-parameter family repel.`,
      caption: String.raw`Two wells, the left deeper by $2\varepsilon$, separated by a distance set by $d$. Bottom left: the levels against the asymmetry $\varepsilon$ — they approach and swerve apart; bottom right: the gaps between neighbours on a log scale, which dip at each near-meeting but never reach zero (the dip at $\varepsilon=0$ is the tunnel splitting; shrink it by pulling the wells apart with $d$). Top left: the solutions shot in from the left (blue) and from the right (purple, dashed) at the energy $E$ of the chosen level plus a detuning; top right: their Wronskian across the whole grid — constant, and zero exactly when $E$ is an eigenvalue. Switch on the **wall**: the wells decouple, the gaps plunge to numerical zero where the levels cross, and at the crossing the two shot solutions have $W=0$ yet live on different sides — the proof's last step fails.`,
      deps: ['qm-3.1', 'ode-3.10'],
      see: ['ode-3.11', 'qm-3.17'],
      refs: ['Griffiths ch. 2'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Avoided_crossing' },
      tags: ['degeneracy', 'wronskian', 'avoided crossing'],
      viz(v) {
        const M = v.M, A = -7.5, B = 7.5, NG = 420, K = 4, NEPS = 41, EPS = 2;
        const eps = v.slider('asymmetry $\\varepsilon$', -EPS, EPS, 0.35, { step: 0.01 });
        const dS = v.slider('half-separation $d$', 1.3, 3.2, 1.6, { step: 0.01 });
        const wall = v.toggle('impenetrable wall between the wells', false);
        const lev = v.select('energy near level', [1, 2, 3, 4].map((k) => ({ value: k - 1, label: String(k) })), 0);
        const det = v.slider('detuning $E-E_n$', -0.3, 0.3, 0, { step: 0.002 });
        const g = (u) => 1 / (1 + Math.exp(6 * (Math.abs(u) - 1)));
        const Vof = (e, d, w) => (X) => -(4 + e) * g(X + d) - (4 - e) * g(X - d) + (w && Math.abs(X) < 0.3 ? 2000 : 0);
        const sA = v.stage({ x: [A, B], y: [-6.5, 1], height: 250, axes: 'box', weight: 1.3, minWidth: 380, xlabel: 'x', title: 'shot from the left (blue) and the right (purple) at $E$' });
        const sW = v.stage({ x: [A, B], y: [-1, 1], height: 250, axes: 'box', weight: 0.7, minWidth: 300, xlabel: 'x', title: 'their Wronskian $W(x)$' });
        const sS = v.stage({ x: [-EPS, EPS], y: [-6.5, 0], height: 240, axes: 'box', weight: 1.1, minWidth: 380, xlabel: 'ε', ylabel: 'E', title: 'levels against the asymmetry $\\varepsilon$' });
        const sG = v.stage({ x: [-EPS, EPS], y: [1e-13, 10], ylog: true, height: 240, axes: 'box', weight: 0.9, minWidth: 300, xlabel: 'ε', title: 'gaps $E_{n+1}-E_n$ (log scale)' });
        const levelsAt = (e, d, w) => M.schrodinger1D(Vof(e, d, w), [A, B], { n: NG, k: K }).E;
        const flowCache = {};
        /** Levels on an ε grid, with each local minimum of a gap refined by golden-section search (so true crossings show up). */
        const flow = (d, w) => {
          const key = `${d}|${w}`; if (flowCache[key]) return flowCache[key];
          const pts = []; for (let j = 0; j < NEPS; j++) { const e = -EPS + (2 * EPS * j) / (NEPS - 1); pts.push([e, levelsAt(e, d, w)]); }
          const extra = [];
          for (let k = 0; k < K - 1; k++) for (let j = 1; j < NEPS - 1; j++) {
            const gp = (q) => q[1][k + 1] - q[1][k];
            if (!(gp(pts[j]) < gp(pts[j - 1]) && gp(pts[j]) <= gp(pts[j + 1]))) continue;
            let lo = pts[j - 1][0], hi = pts[j + 1][0]; const r = 0.618034;
            let c = hi - r * (hi - lo), dd = lo + r * (hi - lo), Ec = levelsAt(c, d, w), Ed = levelsAt(dd, d, w);
            for (let it = 0; it < 18; it++) {
              if (Ec[k + 1] - Ec[k] < Ed[k + 1] - Ed[k]) { hi = dd; dd = c; Ed = Ec; c = hi - r * (hi - lo); Ec = levelsAt(c, d, w); }
              else { lo = c; c = dd; Ec = Ed; dd = lo + r * (hi - lo); Ed = levelsAt(dd, d, w); }
            }
            extra.push([c, Ec]);
          }
          return (flowCache[key] = pts.concat(extra).sort((p, q) => p[0] - q[0]));
        };
        /** Solutions shot from both ends at E, each scaled to unit size where V < E + ½; W on the points where both stay moderate. */
        const shoot = (Vg, h, E) => {
          const n = Vg.length, uL = numerov(Vg, h, E), uR = numerov(Float64Array.from(Vg).reverse(), h, E).reverse();
          let nL = 1e-300, nR = 1e-300; for (let i = 0; i < n; i++) if (Vg[i] < E + 0.5) { nL = Math.max(nL, Math.abs(uL[i])); nR = Math.max(nR, Math.abs(uR[i])); }
          for (let i = 0; i < n; i++) { uL[i] /= nL; uR[i] /= nR; }
          const W = []; let sw = 0, cnt = 0, sLR = 0, sLL = 0, sRR = 0;
          for (let i = 1; i < n - 1; i++) {
            if (Math.abs(uL[i]) > 30 || Math.abs(uR[i]) > 30) { W.push(null); continue; }
            const w = (uL[i] * (uR[i + 1] - uR[i - 1]) - uR[i] * (uL[i + 1] - uL[i - 1])) / (2 * h);
            W.push(w); sw += w; cnt++; sLR += uL[i] * uR[i]; sLL += uL[i] * uL[i]; sRR += uR[i] * uR[i];
          }
          return { uL, uR, W, Wm: cnt ? sw / cnt : 0, shape: Math.abs(sLR) / Math.sqrt(sLL * sRR || 1) };
        };
        /** The eigenvalue of the Numerov problem nearest a finite-difference estimate: secant iteration on the mean Wronskian. */
        const refine = (Vg, h, E0) => {
          let a = E0, b = E0 + 1e-4, fa = shoot(Vg, h, a).Wm, fb = shoot(Vg, h, b).Wm;
          for (let it = 0; it < 10 && Math.abs(fb) > 1e-13 && fb !== fa; it++) { const c = b - (fb * (b - a)) / (fb - fa); a = b; fa = fb; b = c; fb = shoot(Vg, h, b).Wm; }
          return Math.abs(b - E0) < 0.05 ? b : E0;
        };
        let st = null;
        v.render(() => {
          const d = dS.value, w = wall.value, e = eps.value, Vf = Vof(e, d, w), R = M.schrodinger1D(Vf, [A, B], { n: NG, k: K }), x = R.x, h = x[1] - x[0];
          const Vg = Float64Array.from(x, Vf), En = refine(Vg, h, R.E[lev.value]), E = En + det.value;
          sA.clip(() => { sA.poly([[A, -7], ...Array.from(x, (X, i) => [X, Math.min(Vg[i], 2)]), [B, -7]], { fill: 'muted', fillAlpha: 0.14, stroke: false }); sA.path(Array.from(x, (X, i) => [X, Math.min(Vg[i], 2)]), { color: 'muted', width: 2 }); });
          R.E.forEach((q) => sA.hline(q, { color: 'muted', width: 0.8, dash: [2, 4], alpha: 0.6 }));
          sA.hline(E, { color: 'gold', width: 1.2, dash: [5, 3] });
          const S = shoot(Vg, h, E);
          sA.clip(() => {
            sA.path(Array.from(x, (X, i) => [X, E + 1.1 * S.uL[i]]), { color: 'accent', width: 2.2 });
            sA.path(Array.from(x, (X, i) => [X, E + 1.1 * S.uR[i]]), { color: 'purple', width: 2, dash: [6, 4] });
          });
          // Wronskian
          const Wp = S.W.map((q, i) => (q == null ? null : [x[i + 1], q])), ws = S.W.filter((q) => q != null);
          const wr = Math.max(0.5, 1.4 * Math.max(...ws.map(Math.abs)));
          sW.setView([A, B], [-wr, wr]); sW.hline(0, { color: 'faint' });
          sW.path(Wp, { color: 'green', width: 2.4 });
          // level flow and gaps
          const F = flow(d, w);
          for (let k = 0; k < K; k++) sS.path(F.map(([q, Es]) => [q, Es[k]]), { color: FAMILY[k], width: 2.2 });
          sS.vline(e, { color: 'gold', width: 1.4 }); R.E.forEach((q, k) => sS.dot(e, q, { r: 4.5, color: FAMILY[k] }));
          sS.dot(e, E, { r: 7, color: 'gold', hollow: true, width: 2 });
          for (let k = 0; k < K - 1; k++) sG.path(F.map(([q, Es]) => [q, Math.max(1e-13, Es[k + 1] - Es[k])]), { color: FAMILY[k], width: 2 });
          sG.vline(e, { color: 'gold', width: 1.4 });
          let gmin = Infinity; for (const [, Es] of F) gmin = Math.min(gmin, Es[1] - Es[0]);
          st = { E, Wm: S.Wm, Wvar: Math.max(...ws) - Math.min(...ws), shape: S.shape, gmin, w, det: det.value };
        });
        v.legend([['accent', '$u_L$: shot from the left'], ['purple', '$u_R$: shot from the right', { dash: true }], ['green', '$W(x)$'], ['gold', 'energy $E$', { dash: true }]]);
        v.readout(() => st && `$E = ${v.fix(st.E, 5)}$ · $W$ across the grid: $${Math.abs(st.Wm) < 5e-9 ? '0' : v.sci(st.Wm, 2)}$ (varies by $${v.sci(Math.max(st.Wvar, 1e-16), 1)}$: constant)` + (Math.abs(st.det) < 1e-9 ? ` — an eigenvalue, so $W = 0$; shape overlap of $u_L$ and $u_R$: **${v.fix(st.shape, 4)}**${st.shape > 0.999 ? ' (proportional)' : ' — independent although $W=0$: the wall splits the line'}` : ' — not an eigenvalue: $W\\neq0$ and the two decaying solutions are independent') + ` · smallest gap $E_2-E_1$ over the sweep: $${v.sci(Math.max(st.gmin, 1e-16), 2)}$${st.w ? ' — at numerical zero: the wall makes the levels cross' : ' > 0: the levels repel'}.`);
      },
    },
    // ------------------------------------------------------------------ 3.9
    {
      num: '3.9',
      kind: 'Theorem',
      name: 'Energies lie above the potential minimum',
      statement: String.raw`If $V(x)\ge V_{\min}$ for all $x$, then every normalizable solution of $\hat H\psi=E\psi$ has $E>V_{\min}$. More generally, every normalized state $\psi$ (with $\psi'\in L^2$) has
$$\langle H\rangle=\frac{\hbar^2}{2m}\int|\psi'|^2dx+\int V|\psi|^2dx\;>\;V_{\min},$$
because the kinetic term is strictly positive for any normalizable $\psi\neq0$ and the potential term is at least $V_{\min}$. So no state, stationary or not, can sit at the bottom of the well: confining a particle costs kinetic energy (zero-point energy).`,
      idea: String.raw`Two views of the same inequality. Directly: if $E\le V_{\min}$ then $\psi''=\frac{2m}{\hbar^2}(V-E)\psi$ has the sign of $\psi$ everywhere, so $\psi$ curves *away* from the axis; once $\psi$ and $\psi'$ have the same sign, $|\psi|$ grows forever and cannot be normalized — the shooting picture of 3.18. Variationally: $\langle H\rangle=\langle T\rangle+\langle V\rangle$, where $\langle V\rangle\ge V_{\min}$ (2.7: an average of $V$ against a probability density) and $\langle T\rangle=\frac{\hbar^2}{2m}\|\psi'\|^2>0$ unless $\psi$ is constant, which is not normalizable. Squeezing a trial state into the minimum lowers $\langle V\rangle$ but raises $\langle T\rangle\propto1/\sigma^2$, the uncertainty principle at work.`,
      caption: String.raw`Left: a potential (type or pick one) with its minimum $V_{\min}$ (red) and ground energy $E_1$ (green). **Drag the gold handle** to set an energy and watch the solution shot from the left: above $E_1$ it oscillates where $E>V$ (green strip) and blows up beyond; drag below $V_{\min}$ and the strip turns red everywhere — the solution curves away from the axis at every point and climbs monotonically. Right: a Gaussian **trial state** — drag the blue handle to move it, and set its width — with $\langle V\rangle$ (orange) and $\langle T\rangle$ (purple) stacked into $\langle H\rangle$. However you place it, the stack never reaches $V_{\min}$, and never even $E_1$.`,
      deps: ['qm-3.1', 'qm-2.7'],
      see: ['qm-2.11', 'qm-12.1', 'fa-12.13'],
      refs: ['Griffiths ch. 2'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Zero-point_energy' },
      tags: ['zero-point energy', 'bounds', 'kinetic energy'],
      viz(v) {
        const M = v.M, A = -6, B = 6, NG = 600;
        let Vin = null;
        const PRE2 = { ...PRESETS, narrow: ['narrow dip', '0.02 x^2 - 5 exp(-6 x^2)'] };
        v.select('potential', ['narrow', 'lopsided', 'double', 'harmonic'].map((k) => ({ value: k, label: PRE2[k][0] })), 'narrow', { onChange: (k) => Vin.set(PRE2[k][1]) });
        Vin = v.input('$V(x) =$', PRE2.narrow[1], { vars: ['x'], width: 190 });
        const sw = v.slider('trial width $\\sigma$', 0.08, 2.5, 0.45, { log: true });
        const sA = v.stage({ x: [A, B], y: [0, 1], height: 340, axes: 'box', weight: 1.3, xlabel: 'x', ylabel: 'E', title: 'the solution shot from the left at energy $E$' });
        const sB = v.stage({ x: [0, 3], y: [0, 1], height: 340, axes: 'box', weight: 0.7, xticks: [], title: 'trial state: $\\langle H\\rangle=\\langle V\\rangle+\\langle T\\rangle$' });
        const hE = sA.handle(A + 0.4, 0, { color: 'gold', r: 8, label: 'E', labelPos: 'e', constrain: (X, Y) => [hE.x, Y] });
        const hC = sA.handle(0.6, 0, { color: 'accent', r: 7, label: 'trial', labelPos: 'n', constrain: (X) => [M.clamp(X, A + 0.5, B - 0.5), hC.y] });
        let S = null;
        const solve = () => {
          if (S && S.key === Vin.value) return S;
          const Vf = safeV(M, Vin.fn), R = M.schrodinger1D(Vf, [A, B], { n: NG, k: 3 }), x = R.x, Vg = Float64Array.from(x, Vf);
          let im = 0; for (let i = 0; i < x.length; i++) if (Vg[i] < Vg[im]) im = i;
          S = { key: Vin.value, x, h: x[1] - x[0], Vg, E: R.E, Vmin: Vg[im], xmin: x[im] };
          const span = R.E[2] - Vg[im]; hE.y = Vg[im] - 0.25 * span; hC.x = x[im] + 0.6;
          return S;
        };
        let st = null;
        v.render(() => {
          const S = solve(), span = Math.max(0.5, S.E[2] - S.Vmin), lo = S.Vmin - 0.55 * span, hi = S.E[2] + 0.7 * span, [xl, xr] = wellWindow(S.x, S.Vg, hi + 0.2 * span);
          sA.setView([xl, xr], [lo, hi]); sB.setView([0, 3], [lo, hi]);
          hE.x = xl + 0.05 * (xr - xl); hE.y = M.clamp(hE.y, lo + 0.02 * span, hi - 0.02 * span); hC.y = lo + 0.05 * (hi - lo); hC.x = M.clamp(hC.x, xl + 0.3, xr - 0.3);
          sA.clip(() => { sA.poly([[xl, lo - 1], ...Array.from(S.x, (X, i) => [X, Math.min(S.Vg[i], hi + span)]), [xr, lo - 1]], { fill: 'muted', fillAlpha: 0.14, stroke: false }); sA.path(Array.from(S.x, (X, i) => [X, Math.min(S.Vg[i], hi + span)]), { color: 'muted', width: 2 }); });
          sA.hline(S.Vmin, { color: 'red', width: 1.4, dash: [6, 4] }); sA.text('V_min', xr, S.Vmin, { color: 'red', size: 11, align: 'right', dy: 9, dx: -4 });
          sA.hline(S.E[0], { color: 'green', width: 1.4, dash: [6, 4] }); sA.text('E₁', xr, S.E[0], { color: 'green', size: 11, align: 'right', dy: -9, dx: -4 });
          // allowed / forbidden strip on the energy line
          const E = hE.y;
          for (let i = 0; i < S.x.length - 1; i += 2) { const ok = S.Vg[i] < E; sA.line(S.x[i], E, S.x[i + 2] ?? S.x[i + 1], E, { color: ok ? 'green' : 'red', width: 5, alpha: 0.35, cap: 'butt' }); }
          const u = numerov(S.Vg, S.h, E); let um = 1e-300, iE = S.x.length - 1;
          if (E > S.Vmin) { while (iE > 0 && S.Vg[iE] > E) iE--; iE = Math.min(S.x.length - 1, iE + 25); } else iE = Math.round(S.x.length * 0.5);
          for (let i = 0; i <= iE; i++) um = Math.max(um, Math.abs(u[i]));
          sA.clip(() => sA.path(Array.from(S.x, (X, i) => [X, E + 0.3 * span * u[i] / um]), { color: E < S.Vmin ? 'red' : 'gold', width: 2.4 }));
          // trial Gaussian
          const c = hC.x, s = sw.value, rho = Float64Array.from(S.x, (X) => Math.exp(-((X - c) ** 2) / (2 * s * s)) / (Math.sqrt(TAU) * s));
          let Vm = 0; for (let i = 0; i < S.x.length; i++) Vm += S.Vg[i] * rho[i] * S.h;
          const Tm = 1 / (8 * s * s), H = Vm + Tm, rmax = 1 / (Math.sqrt(TAU) * s);
          sA.clip(() => sA.path(Array.from(S.x, (X, i) => (rho[i] > 2e-3 * rmax ? [X, Math.min(hi, H) + 0.35 * span * rho[i] / rmax] : null)), { color: 'accent', width: 1.8, fill: 'accent', fillAlpha: 0.12 }));
          sA.line(c, lo + 0.05 * (hi - lo), c, Math.min(hi, H), { color: 'accent', width: 1, dash: [2, 3] });
          // stacked bar
          sB.hline(S.Vmin, { color: 'red', width: 1.6, dash: [6, 4] }); sB.text('V_min', 2.95, S.Vmin, { color: 'red', size: 11, align: 'right', dy: 9 });
          sB.hline(S.E[0], { color: 'green', width: 1.6, dash: [6, 4] }); sB.text('E₁', 2.95, S.E[0], { color: 'green', size: 11, align: 'right', dy: -9 });
          sB.rect(0.9, S.Vmin, 2.1, Vm, { fill: 'orange', fillAlpha: 0.55, color: 'orange', width: 1 });
          sB.rect(0.9, Vm, 2.1, Math.min(H, hi + span), { fill: 'purple', fillAlpha: 0.45, color: 'purple', width: 1 });
          sB.text('⟨V⟩', 1.5, (S.Vmin + Vm) / 2, { align: 'center', size: 12, weight: 600, color: 'ink' });
          if (H - Vm > 0.06 * span) sB.text('⟨T⟩', 1.5, (Vm + Math.min(H, hi)) / 2, { align: 'center', size: 12, weight: 600, color: 'ink' });
          sB.line(0.75, Math.min(H, hi), 2.25, Math.min(H, hi), { color: 'accent', width: 2.4 }); sB.text('⟨H⟩', 0.7, Math.min(H, hi), { align: 'right', size: 12, color: 'accent', weight: 600 });
          st = { E, Vmin: S.Vmin, E1: S.E[0], H, Tm, Vm, s, below: E < S.Vmin, end: u[S.x.length - 1] };
        });
        v.legend([['gold', 'solution shot from the left at E'], ['red', 'E < V: curves away from the axis', { area: true }], ['green', 'E > V: curves toward the axis', { area: true }], ['accent', 'trial |ψ|² drawn at ⟨H⟩', { area: true }]]);
        v.readout(() => st && `$V_{\\min} = ${v.fix(st.Vmin, 4)}$, $E_1 = ${v.fix(st.E1, 4)}$ · shooting at $E = ${v.fix(st.E, 4)}$: ` + (st.below ? `**below $V_{\\min}$** — $\\psi''/\\psi = 2(V-E) > 0$ everywhere, so the solution only grows (value at the right edge: $${v.sci(Math.abs(st.end), 1)}$ × its start)` : 'the tail still diverges unless $E$ is an eigenvalue') + ` · trial state ($\\sigma = ${v.fix(st.s, 3)}$): $\\langle V\\rangle = ${v.fix(st.Vm, 4)}$, $\\langle T\\rangle = \\hbar^2/8m\\sigma^2 = ${v.fix(st.Tm, 4)}$, $\\langle H\\rangle = ${v.fix(st.H, 4)}$ $\\ge E_1 > V_{\\min}$ ${st.H >= st.E1 - 1e-9 ? '✓' : '✗'}.`);
      },
    },
    // ------------------------------------------------------------------ 3.10
    {
      num: '3.10',
      kind: 'Model',
      name: 'Delta-function well',
      statement: String.raw`The attractive delta potential $V(x)=-\alpha\,\delta(x)$, $\alpha>0$, has exactly one bound state,
$$\psi(x)=\sqrt\kappa\,e^{-\kappa|x|},\qquad \kappa=\frac{m\alpha}{\hbar^2},\qquad E=-\frac{\hbar^2\kappa^2}{2m}=-\frac{m\alpha^2}{2\hbar^2}.$$
The wave function is continuous with a **kink** at the origin: integrating the Schrödinger equation across $x=0$ gives the jump condition
$$\psi'(0^+)-\psi'(0^-)=-\frac{2m\alpha}{\hbar^2}\,\psi(0).$$
It is the limit of square wells of width $a$ and depth $\alpha/a$ (fixed area $\alpha$) as $a\to0$. All energies $E>0$ form the scattering continuum, with transmission $T=\big(1+m\alpha^2/2\hbar^2E\big)^{-1}$.`,
      scope: String.raw`A model for any well much narrower than the bound state's size $1/\kappa$ — short-range impurities, a contact interaction between cold atoms — where only the well's area matters.`,
      idea: String.raw`Away from $0$ the equation is free, and normalizability picks the decaying exponentials $e^{-\kappa|x|}$ with $E=-\hbar^2\kappa^2/2m$. The delta acts only through the jump in $\psi'$: integrating $-\frac{\hbar^2}{2m}\psi''-\alpha\delta\psi=E\psi$ over $(-\varepsilon,\varepsilon)$, the right side vanishes as $\varepsilon\to0$ while $\int\psi''=\psi'(\varepsilon)-\psi'(-\varepsilon)$ — this is the distributional derivative of a kink producing a delta (fa-6.12). The jump $-2\kappa\psi(0)$ must equal $-\frac{2m\alpha}{\hbar^2}\psi(0)$, fixing $\kappa$ uniquely: one bound state. For a narrow square well the curvature inside is so large that the slope reverses over a tiny distance — in the limit, a kink.`,
      caption: String.raw`A square well of width $a$ and depth $\alpha/a$ (area $\alpha=1$ fixed, $\hbar=m=1$). **Narrow it** with the slider: its ground state (blue, exact) approaches the kinked exponential $e^{-\kappa|x|}$ (green dashed). Middle: the slope $\psi'(x)$ — continuous for the square well, but turning over inside an ever thinner strip until it becomes the jump $\psi'(0^\pm)=\mp\kappa\psi(0)$. Bottom: the ground energy against $a$ converging to $-m\alpha^2/2\hbar^2=-\tfrac12$; a wide, shallow well has a second bound state, which disappears below $a=\pi^2\hbar^2/2m\alpha$.`,
      deps: ['qm-3.1', 'fa-6.12'],
      see: ['qm-3.11', 'qm-3.12'],
      refs: ['Griffiths §2.5'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Delta_potential' },
      tags: ['delta potential', 'bound state', 'kink'],
      viz(v) {
        const M = v.M, AL = 1;
        const aS = v.slider('well width $a$ (depth $\\alpha/a$)', 0.01, 12, 1.2, { log: true, sig: 3 });
        const s1 = v.stage({ x: [-4, 4], y: [-0.42, 1.25], height: 270, axes: 'box', weight: 1.1, xlabel: 'x', title: 'ground state of the square well and $\\sqrt\\kappa\\,e^{-\\kappa|x|}$' });
        const s2 = v.stage({ x: [-1.5, 1.5], y: [-1.3, 1.3], height: 270, axes: 'box', weight: 0.9, xlabel: 'x', title: 'slope $\\psi\'(x)$ near the well' });
        const s3 = v.stage({ x: [0.01, 12], y: [-0.62, 0.05], xlog: true, height: 200, axes: 'box', full: true, xlabel: 'a', ylabel: 'E', title: 'bound-state energies against the width $a$ (area $\\alpha$ fixed)' });
        /** Bound states of the square well of half-width b, depth V0 (ħ = m = 1): [{E, z, w, parity}]. */
        const levels = (a) => {
          const b = a / 2, V0 = AL / a, z0 = b * Math.sqrt(2 * V0), out = [];
          for (let j = 0; j * Math.PI / 2 < z0; j++) {
            const even = j % 2 === 0, lo = (j * Math.PI) / 2 + 1e-12, hi = Math.min(((j + 1) * Math.PI) / 2 - 1e-12, z0);
            const f = (z) => (even ? z * Math.tan(z) : -z / Math.tan(z)) - Math.sqrt(Math.max(0, z0 * z0 - z * z));
            let p = lo, q = hi; if (f(p) > 0 || f(q) < 0) continue;
            for (let it = 0; it < 80; it++) { const m = (p + q) / 2; if (f(m) > 0) q = m; else p = m; }
            const z = (p + q) / 2, w = Math.sqrt(Math.max(0, z0 * z0 - z * z));
            out.push({ z, w, E: -(w * w) / (2 * b * b), even, b });
          }
          return out;
        };
        const wave = (L0) => { // normalized even ground state: ψ and ψ'
          const { z, w, b } = L0, k = z / b, kap = w / b, N2 = 2 * (b / 2 + Math.sin(2 * z) / (4 * k) + Math.cos(z) ** 2 / (2 * kap)), c = 1 / Math.sqrt(N2);
          return { psi: (X) => (Math.abs(X) < b ? c * Math.cos(k * X) : c * Math.cos(z) * Math.exp(-kap * (Math.abs(X) - b))), dpsi: (X) => (Math.abs(X) < b ? -c * k * Math.sin(k * X) : -Math.sign(X) * c * kap * Math.cos(z) * Math.exp(-kap * (Math.abs(X) - b))), c, k, kap };
        };
        const curve = []; for (let j = 0; j <= 240; j++) { const a = 0.01 * 1200 ** (j / 240); curve.push([a, levels(a)]); }
        let st = null;
        v.render(() => {
          const a = aS.value, Ls = levels(a), W = wave(Ls[0]), kd = AL, b = a / 2, dep = AL / a;
          // well (schematic depth) and wave functions
          s1.rect(-b, -0.16, b, -0.05, { fill: 'muted', fillAlpha: 0.35, hatch: 'muted', hatchAlpha: 0.5, color: 'muted', width: 1 });
          s1.text(`well: width ${v.fix(a, a < 0.1 ? 3 : 2)}, depth ${dep < 10 ? v.fix(dep, 2) : v.fix(dep, 0)}`, Math.max(b, 0.05), -0.105, { align: 'left', dx: 6, size: 11, color: 'ink' });
          s1.fn((X) => Math.sqrt(kd) * Math.exp(-kd * Math.abs(X)), { color: 'green', width: 2.2, dash: [6, 4] });
          s1.fn(W.psi, { color: 'accent', width: 2.6, fill: 'accent', fillAlpha: 0.1, n: 1200 });
          if (Ls.length > 1) s1.corner('a second (odd) bound state exists', 'tr', { color: 'orange', weight: 600 });
          // slope
          s2.hline(0, { color: 'faint' });
          s2.vband(-b, b, { color: 'muted', alpha: 0.12 });
          s2.fn((X) => -Math.sign(X) * kd * Math.sqrt(kd) * Math.exp(-kd * Math.abs(X)), { color: 'green', width: 2.2, dash: [6, 4] });
          s2.fn(W.dpsi, { color: 'accent', width: 2.6, n: 1600 });
          // energy flow
          for (let n = 0; n < 2; n++) { const pts = curve.map(([q, L]) => (L[n] ? [q, L[n].E] : null)); s3.path(pts, { color: n ? 'orange' : 'accent', width: 2.2 }); }
          s3.hline(-0.5 * AL * AL, { color: 'green', width: 1.4, dash: [6, 4] }); s3.text('−mα²/2ħ² = −½', 0.012, -0.5, { color: 'green', size: 11, dy: -9 });
          s3.vline((Math.PI * Math.PI) / (2 * AL), { color: 'orange', width: 1, dash: [3, 3] });
          Ls.forEach((L, n) => s3.dot(a, L.E, { r: 6, color: n ? 'orange' : 'gold' }));
          const jump = W.dpsi(b + 1e-9) - W.dpsi(-b - 1e-9);
          st = { a, E: Ls[0].E, n: Ls.length, jump, pred: -2 * AL * W.psi(0), psi0: W.psi(0), psid: Math.sqrt(kd) };
        });
        v.legend([['accent', 'square well, exact'], ['green', 'delta well: $\\sqrt\\kappa\\,e^{-\\kappa|x|}$, $E=-\\tfrac12$', { dash: true }], ['orange', 'second bound state']]);
        v.readout(() => st && `$a = ${v.fix(st.a, 3)}$: $E_0 = ${v.fix(st.E, 5)}$ vs $-m\\alpha^2/2\\hbar^2 = -0.5$ (${v.fix(100 * Math.abs(st.E / -0.5 - 1), 3)} % off) · slope change across the well $\\psi'(b^+)-\\psi'(-b^-) = ${v.fix(st.jump, 4)}$ vs $-2m\\alpha\\psi(0)/\\hbar^2 = ${v.fix(st.pred, 4)}$ · $\\psi(0) = ${v.fix(st.psi0, 4)}$ → $\\sqrt\\kappa = 1$ · ${st.n} bound state${st.n > 1 ? 's' : ''}.`);
      },
    },
  ],
};
