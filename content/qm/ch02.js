// Quantum Mechanics — Chapter 2: The wave function (items 2.1–2.8; 2.9–2.15 in ch02-b.js)
import { TAU, grid, packet, normSq, normalize, moments, current, sampler, ksDistance, phaseLUT, drawPsi, phaseWheel, splitStepper, clockSim, big, fz } from './ch02.shared.js';

/** π-multiple formatter for phase sliders. */
/** Superscript digits for plain-text labels (1.50 → ¹·⁵⁰). */
const sup = (t) => String(t).replace(/[0-9.−-]/g, (c) => ({ '.': '·', '-': '⁻', '−': '⁻' }[c] || '⁰¹²³⁴⁵⁶⁷⁸⁹'[+c]));
const piFmt = (t) => (Math.abs(t) < 5e-3 ? '0' : `${(t / Math.PI).toFixed(2)}π`);
/** Harmonic-oscillator eigenfunctions (ħ = m = ω = 1) ψ_0, ψ_1, ψ_2 at x. */
const ho = [(x) => Math.PI ** -0.25 * Math.exp(-x * x / 2), (x) => Math.PI ** -0.25 * Math.SQRT2 * x * Math.exp(-x * x / 2), (x) => Math.PI ** -0.25 / Math.SQRT2 * (2 * x * x - 1) * Math.exp(-x * x / 2)];

export default {
  collection: 'qm',
  chapter: 2,
  title: 'The wave function',
  summary: String.raw`The state of a particle is a complex wave function $\psi(x,t)$; its squared modulus is a probability density (Born), and it evolves by the Schrödinger equation $i\hbar\,\partial_t\psi=\hat H\psi$, which conserves total probability through a local current. Observables become operators — momentum is $-i\hbar\,d/dx$ — and their expectation values obey Newton's equations on average (Ehrenfest). Position and momentum descriptions are Fourier transforms of each other, so a sharply localized particle has a wide spread of momenta: $\Delta x\,\Delta p\ge\hbar/2$. Free wave packets travel at the classical velocity $p/m$ while their crests run at half that speed and their width grows. The chapter closes with the two 1926 papers that set this up: Schrödinger's eigenvalue problem for hydrogen and Born's probability interpretation of scattering.`,
  items: [
    // ------------------------------------------------------------------ 2.1
    {
      num: '2.1',
      kind: 'Postulate',
      name: 'The wave function',
      credit: 'Schrödinger, 1926',
      statement: String.raw`**Postulate.** The state of a (spinless) particle moving on a line is described at each time $t$ by a complex-valued function $\psi(x,t)$, its **wave function** ($\psi(\mathbf r,t)$ in three dimensions). Every prediction about the particle at time $t$ is determined by $\psi(\cdot,t)$, and:
(a) **superposition:** if $\psi_1$ and $\psi_2$ are possible states, so is $c_1\psi_1+c_2\psi_2$ for any complex $c_1,c_2$ (not giving zero);
(b) **rays, not vectors:** $\psi$ and $c\psi$ ($c\in\C$, $c\neq0$) describe the same physical state, so a **global phase** $e^{i\theta}\psi$ changes no prediction; a **relative phase** between superposed parts, $\psi_1+e^{i\alpha}\psi_2$, does;
(c) $\psi$ lives on configuration space, not ordinary space: $N$ particles share one function $\psi(\mathbf r_1,\dots,\mathbf r_N,t)$.
A particle of definite momentum $p$ and energy $E$ has the de Broglie wave $\psi=e^{i(px-Et)/\hbar}$: constant modulus, with a phase that turns once around the circle every wavelength $h/p$.`,
      idea: String.raw`De Broglie (1.9) attached a wave of wavelength $h/p$ to every particle, and single-particle double-slit experiments (1.11) show that these waves *add before anything is observed*: what interferes is an amplitude, not a probability. The amplitude must be complex. A state of definite momentum should look the same everywhere (no preferred position) yet carry a direction of motion; $e^{ikx}$ does both — constant $|\psi|$, phase winding to the right — whereas a real wave $\cos kx$ has nodes and is the superposition of $e^{ikx}$ and $e^{-ikx}$ (momenta $\pm\hbar k$). All observable predictions come from $|\psi|^2$ (2.2) and from overlaps of wave functions, which a common factor $e^{i\theta}$ leaves unchanged; only differences of phase between parts of $\psi$ can show up, as interference.`,
      caption: String.raw`Left: $\psi$ drawn as a curve in the space $(x,\operatorname{Re}\psi,\operatorname{Im}\psi)$ — a packet of definite momentum is a corkscrew (drag to rotate). Right: the same $\psi$ as height $|\psi|$ coloured by phase (wheel), with $\operatorname{Re}\psi$ and $\operatorname{Im}\psi$; below, $|\psi|^2$. **Drag the global phase $\theta$**: the corkscrew turns, the colours cycle and $\operatorname{Re}\psi$ changes completely, yet $|\psi|^2$ and every readout stay fixed. Choose **two packets** and drag the **relative phase $\alpha$**: now the interference fringes in $|\psi|^2$ move. Reverse $k_0$ to reverse the winding; a **real wave** collapses the corkscrew into a plane.`,
      deps: ['qm-1.9', 'qm-1.11'],
      refs: ['Griffiths §1.1'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Wave_function' },
      tags: ['wave function', 'phase', 'superposition'],
      viz(v) {
        const { x, dx } = grid(-8, 8, 481), n = x.length;
        let al = null;
        const mode = v.select('state', [{ value: 'one', label: 'one packet' }, { value: 'two', label: 'two packets' }, { value: 'real', label: 'real (standing) wave' }], 'one', { onChange: () => { al.el.hidden = mode.value !== 'two'; } });
        const k0 = v.slider('wave number $k_0$', -4, 4, 2.2, { step: 0.01 });
        const th = v.slider('global phase $\\theta$ (multiply by $e^{i\\theta}$)', 0, TAU, 0, { step: 0.01, fmt: piFmt });
        al = v.slider('relative phase $\\alpha$ of the right packet', 0, TAU, 0, { step: 0.01, fmt: piFmt });
        al.el.hidden = true;
        const s3 = v.stage3d({ height: 300, range: 1.5, yaw: -0.32, pitch: 0.24, persp: 0, axes: false, weight: 1, title: '$x\\mapsto(x,\\ \\operatorname{Re}\\psi,\\ \\operatorname{Im}\\psi)$' });
        const s1 = v.stage({ x: [-8, 8], y: [-0.85, 0.85], height: 300, axes: 'box', weight: 1.3, xlabel: 'x', title: 'height $|\\psi|$, colour $\\arg\\psi$' });
        const s2 = v.stage({ x: [-8, 8], y: [0, 0.62], height: 150, axes: 'box', full: true, xlabel: 'x', ylabel: '|ψ|²', title: 'probability density $|\\psi|^2$' });
        const build = (theta, alpha) => {
          const re = new Float64Array(n), im = new Float64Array(n), k = k0.value, m = mode.value;
          for (let i = 0; i < n; i++) {
            const X = x[i]; let r = 0, q = 0;
            if (m === 'one') { const a = Math.exp(-X * X / (4 * 1.3 * 1.3)); r = a * Math.cos(k * X); q = a * Math.sin(k * X); }
            else if (m === 'real') { r = Math.exp(-X * X / (4 * 1.6 * 1.6)) * Math.cos(k * X); }
            else {
              const a1 = Math.exp(-((X + 1.5) ** 2) / (4 * 1.1 * 1.1)), a2 = Math.exp(-((X - 1.5) ** 2) / (4 * 1.1 * 1.1));
              r = a1 * Math.cos(k * X) + a2 * Math.cos(-k * X + alpha); q = a1 * Math.sin(k * X) + a2 * Math.sin(-k * X + alpha);
            }
            re[i] = r * Math.cos(theta) - q * Math.sin(theta); im[i] = r * Math.sin(theta) + q * Math.cos(theta);
          }
          normalize(re, im, dx);
          return { re, im };
        };
        let st = null;
        v.render(() => {
          const col = phaseLUT(v), P = build(th.value, al.value), P0 = build(0, al.value), PA = build(th.value, 0);
          // ---- 3D corkscrew
          const S = 1.55 / 8, A = 1 / 0.62, pt = (i) => [x[i] * S, P.re[i] * A, P.im[i] * A];
          s3.line([-1.62, 0, 0], [1.62, 0, 0], { color: 'muted', width: 1.2 });
          s3.text('x', [1.7, 0, 0], { color: 'muted', size: 12 });
          s3.line([-1.55, 0, 0], [-1.55, 1, 0], { color: 'accent', width: 1.4, alpha: 0.8 }); s3.text('Re', [-1.55, 1.12, 0], { color: 'accent', size: 11 });
          s3.line([-1.55, 0, 0], [-1.55, 0, 1], { color: 'purple', width: 1.4, alpha: 0.8 }); s3.text('Im', [-1.55, 0, 1.12], { color: 'purple', size: 11 });
          const floor = []; for (let i = 0; i < n; i += 2) floor.push([x[i] * S, P.re[i] * A, -1.05]);
          s3.path(floor, { color: 'accent', width: 1, alpha: 0.4 }); s3.text('shadow: Re ψ', [1.2, 0.2, -1.05], { color: 'accent', size: 10.5 });
          for (let i = 0; i < n - 1; i++) {
            const a2 = P.re[i] ** 2 + P.im[i] ** 2; if (a2 < 1e-5) continue;
            s3.line(pt(i), pt(i + 1), { color: col(Math.atan2(P.im[i] + P.im[i + 1], P.re[i] + P.re[i + 1])), width: 2.6 });
          }
          // ---- amplitude coloured by phase
          drawPsi(s1, x, P.re, P.im, { col, scale: 1 });
          const env = []; for (let i = 0; i < n; i += 2) env.push([x[i], -Math.hypot(P.re[i], P.im[i])]);
          s1.path(env, { color: 'muted', width: 1, dash: [4, 3] });
          s1.fn((X) => { const f = (X - x[0]) / dx, i = Math.min(n - 2, Math.max(0, Math.floor(f))); return P.re[i] + (f - i) * (P.re[i + 1] - P.re[i]); }, { color: 'accent', width: 1.4, n: 900 });
          s1.fn((X) => { const f = (X - x[0]) / dx, i = Math.min(n - 2, Math.max(0, Math.floor(f))); return P.im[i] + (f - i) * (P.im[i + 1] - P.im[i]); }, { color: 'purple', width: 1.3, dash: [5, 3], n: 900 });
          phaseWheel(s1, col, s1.W - 34, 40, 13);
          // ---- density
          const rho = (Q) => { const out = new Float64Array(n); for (let i = 0; i < n; i++) out[i] = Q.re[i] ** 2 + Q.im[i] ** 2; return out; };
          const r = rho(P), r0 = rho(P0), rA = rho(PA);
          if (mode.value === 'two') s2.path(Array.from(x, (X, i) => [X, rA[i]]), { color: 'muted', width: 1.3, dash: [5, 4] });
          s2.path(Array.from(x, (X, i) => [X, r[i]]), { color: 'accent', width: 2.2 });
          s2.fn((X) => { const f = (X - x[0]) / dx, i = Math.min(n - 2, Math.max(0, Math.floor(f))); return r[i] + (f - i) * (r[i + 1] - r[i]); }, { color: 'accent', width: 0, fill: 'accent', fillAlpha: 0.16, n: 600 });
          const m = moments(x, P.re, P.im);
          s2.vline(m.mx, { color: 'green', dash: [4, 4], width: 1.3 });
          s2.text('⟨x⟩', m.mx, 0.57, { color: 'green', size: 11.5, dx: 5 });
          let dG = 0, dA = 0; for (let i = 0; i < n; i++) { dG = Math.max(dG, Math.abs(r[i] - r0[i])); dA = Math.max(dA, Math.abs(r[i] - rA[i])); }
          const i0 = Math.round((0 - x[0]) / dx);
          st = { m, N: normSq(P.re, P.im, dx), dG, dA, re0: P.re[i0], im0: P.im[i0] };
        });
        v.legend([['accent', 'Re ψ'], ['purple', 'Im ψ', { dash: true }], ['ink', '|ψ| (filled by phase)'], ['accent', '|ψ|²', { area: true }], ['muted', '|ψ|² with α = 0', { dash: true }]]);
        v.readout(() => st && `$\\int|\\psi|^2dx = ${v.fix(st.N, 6)}$ · $\\langle x\\rangle = ${fz(v, st.m.mx, 4)}$ · $\\langle p\\rangle = ${fz(v, st.m.mp, 4)}\\,\\hbar$ · $\\Delta x = ${v.fix(st.m.sx, 4)}$ — none of these move with $\\theta$. Yet $\\psi(0) = ${v.fix(st.re0, 3)} ${st.im0 < 0 ? '-' : '+'} ${v.fix(Math.abs(st.im0), 3)}\\,i$ does. Largest change of $|\\psi|^2$ caused by the global phase: **${st.dG < 1e-12 ? '0' : v.sci(st.dG, 1)}** (rounding)${mode.value === 'two' ? `; caused by the relative phase $\\alpha$: **${v.fix(st.dA, 3)}**` : ''}.`);
      },
    },
    // ------------------------------------------------------------------ 2.2
    {
      num: '2.2',
      kind: 'Postulate',
      name: 'Born rule',
      credit: 'Born, 1926',
      statement: String.raw`**Postulate.** If a particle is in the state $\psi$ (normalized, $\int|\psi|^2dx=1$) and its position is measured, the outcome is random, and the probability of finding it in $[a,b]$ is
$$P(a\le x\le b)=\int_a^b|\psi(x,t)|^2\,dx .$$
So $\rho=|\psi|^2$ is a **probability density**. Repeating the measurement on many identically prepared particles produces outcomes whose histogram approaches $|\psi|^2$; a single outcome is not predictable. Since $|e^{i\varphi(x)}\psi(x)|^2=|\psi(x)|^2$, position statistics alone do not determine the phase of $\psi$: states with the same $|\psi|$ but different phases are distinguished by other measurements (momentum, interference), not by position.`,
      idea: String.raw`Born introduced the rule in 1926 to interpret the outgoing wave in a scattering calculation (2.15), adding in proof that the probability goes with the *square* of the amplitude. Squaring is what the rest of the theory demands: $\int|\psi|^2$ is the quantity the Schrödinger equation conserves (2.5) and the one that flows with the probability current (2.6), so it can be shared out as probability without ever being created or destroyed. Experimentally, single-particle interference (1.11) shows dots arriving one at a time at random, with the accumulated pattern following $|\psi_1+\psi_2|^2$, interference terms included.`,
      caption: String.raw`Top: the state, height $|\psi|$ coloured by phase. Press **Measure** to detect the particle: each detection is a dot on the screen (newest ringed in gold) and a count in the histogram, which approaches the Born density $|\psi|^2$ (green). The readout tracks the Kolmogorov–Smirnov distance between the data and $|\psi|^2$, which shrinks like $1/\sqrt N$. Switch **scramble the phase** on: $\psi$ changes colour completely, but $|\psi|^2$ — and the very same histogram — do not, so position data cannot reveal the phase.`,
      deps: ['qm-2.1', 'qm-1.11'],
      see: ['stat-1.5', 'qm-2.15'],
      refs: ['Griffiths §1.2'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Born_rule' },
      tags: ['born rule', 'probability', 'measurement'],
      viz(v) {
        const { x, dx } = grid(-6, 6, 601), n = x.length;
        const STATES = {
          gauss: { label: 'Gaussian', f: (X) => [Math.exp(-((X + 0.6) ** 2) / 2.2), 0], k: 1.6 },
          cat: { label: 'two packets', f: (X) => [Math.exp(-((X + 2.2) ** 2) / 0.9) + 0.75 * Math.exp(-((X - 2) ** 2) / 1.4), 0], k: -1.2 },
          skew: { label: 'oscillator mix', f: (X) => [ho[0](X) + 0.55 * ho[2](X) + 0.5 * ho[1](X), 0.7 * ho[1](X)], k: 0 },
          node: { label: 'first excited state', f: (X) => [ho[1](X), 0], k: 0 },
        };
        const state = v.select('state', Object.entries(STATES).map(([value, S]) => ({ value, label: S.label })), 'skew', { onChange: () => reset() });
        const scr = v.toggle('scramble the phase of $\\psi$', false);
        let rng, data, last, cache = {};
        const get = () => {
          const key = state.value; if (cache[key]) return cache[key];
          const S = STATES[key], re = new Float64Array(n), im = new Float64Array(n);
          for (let i = 0; i < n; i++) { const [a, b] = S.f(x[i]); const ph = S.k * x[i]; re[i] = a * Math.cos(ph) - b * Math.sin(ph); im[i] = a * Math.sin(ph) + b * Math.cos(ph); }
          normalize(re, im, dx);
          const rho = Float64Array.from(re, (r, i) => r * r + im[i] * im[i]);
          return (cache[key] = { re, im, rho, draw: sampler(x, rho) });
        };
        const measure = (k) => { const P = get(); for (let i = 0; i < k; i++) { const u = rng(); last = P.draw(u); data.push({ x: last, y: rng() }); } };
        function reset() { rng = v.rng(2026); data = []; last = null; measure(240); }
        v.button('Measure 1', () => measure(1));
        v.button('Measure 100', () => measure(100));
        v.button('Measure 10,000', () => measure(10000));
        v.button('Reset', () => reset());
        const s1 = v.stage({ x: [-6, 6], y: [-0.05, 0.85], height: 170, axes: 'box', full: true, xticks: [], ylabel: '|ψ|', title: 'the state $\\psi$ (height $|\\psi|$, colour $\\arg\\psi$)' });
        const sc = v.stage({ x: [-6, 6], y: [0, 1], height: 70, axes: false, full: true, title: 'detection screen' });
        const s2 = v.stage({ x: [-6, 6], y: [0, 0.6], height: 220, axes: 'box', full: true, xlabel: 'x', ylabel: 'density', title: 'histogram of detected positions against $|\\psi|^2$' });
        reset();
        let st = null;
        v.render(() => {
          const col = phaseLUT(v), P = get();
          let re = P.re, im = P.im;
          if (scr.value) {
            re = new Float64Array(n); im = new Float64Array(n);
            for (let i = 0; i < n; i++) { const ph = 3.2 * Math.sin(1.7 * x[i]) + 0.9 * x[i] * x[i]; re[i] = P.re[i] * Math.cos(ph) - P.im[i] * Math.sin(ph); im[i] = P.re[i] * Math.sin(ph) + P.im[i] * Math.cos(ph); }
          }
          drawPsi(s1, x, re, im, { col });
          phaseWheel(s1, col, s1.W - 34, 42, 12);
          // screen: the latest dots
          sc.rect(-6, 0, 6, 1, { fill: 'ink', fillAlpha: 0.06, stroke: false });
          const show = data.slice(-1500);
          sc.dots(show.map((d) => [d.x, 0.1 + 0.8 * d.y]), { r: 1.5, color: 'accent', alpha: 0.75 });
          if (last != null) { const d = data[data.length - 1]; sc.dot(d.x, 0.1 + 0.8 * d.y, { r: 6, color: 'gold', hollow: true, width: 2 }); }
          // histogram
          const ymax = Math.max(...P.rho) * 1.35; s2.setView([-6, 6], [0, ymax]); s1.setView([-6, 6], [-0.04 * Math.sqrt(ymax), Math.sqrt(ymax) * 1.05]);
          s2.hist(data.map((d) => d.x), { bins: 60, range: [-6, 6], density: true, color: 'gold', fillAlpha: 0.35 });
          s2.path(Array.from(x, (X, i) => [X, P.rho[i]]), { color: 'green', width: 2.4 });
          if (last != null) s2.vline(last, { color: 'gold', dash: [3, 3], width: 1.2 });
          const xs = data.map((d) => d.x).sort((a, b) => a - b), D = ksDistance(xs, P.draw.cdf);
          const mean = xs.reduce((a, b) => a + b, 0) / xs.length, m = moments(x, P.re, P.im);
          const left = xs.filter((X) => X < 0).length / xs.length, pl = P.draw.cdf(0);
          st = { N: xs.length, D, crit: 1.36 / Math.sqrt(xs.length), mean, mx: m.mx, left, pl, last };
        });
        v.legend([['gold', 'detections (histogram)', { area: true }], ['green', 'Born density $|\\psi|^2$'], ['accent', 'dots on the screen', { dot: true }]]);
        v.readout(() => st && `${big(st.N)} detections${st.last != null ? ` (last at $x = ${v.fix(st.last, 3)}$)` : ''} · fraction found at $x<0$: **${v.fix(st.left, 4)}** vs Born $\\int_{-\\infty}^0|\\psi|^2 = ${v.fix(st.pl, 4)}$ · Kolmogorov–Smirnov distance to $|\\psi|^2$: $D_N = ${v.fix(st.D, 4)}$, ${st.D < st.crit ? 'below' : 'above'} the 95 % band $1.36/\\sqrt N = ${v.fix(st.crit, 4)}$ · sample mean ${fz(v, st.mean, 3)} vs $\\int x|\\psi|^2dx = ${fz(v, st.mx, 3)}$${scr.value ? ' · phase scrambled: same $|\\psi|^2$, same data, same $D_N$' : ''}.`);
      },
    },
    // ------------------------------------------------------------------ 2.3
    {
      num: '2.3',
      kind: 'Definition',
      name: 'Normalization and square-integrable states',
      statement: String.raw`A wave function is **square-integrable** if $\int_{-\infty}^{\infty}|\psi(x)|^2dx<\infty$, i.e. $\psi\in L^2(\R)$; it is **normalized** if this integral equals $1$. Any square-integrable $\psi\neq0$ can be normalized by dividing by $\norm{\psi}=\big(\int|\psi|^2\big)^{1/2}$, and the Born rule (2.2) applies to normalized states. Wave functions that differ on a set of measure zero are identified. Examples:
(a) $(1+x^2)^{-s/2}$ is in $L^2$ exactly when $s>\tfrac12$: the tail $|x|^{-2s}$ must be integrable; at $s=\tfrac12$ the partial integrals grow like $2\log L$;
(b) a plane wave $e^{ikx}$ has $\int_{-L}^{L}|\psi|^2=2L\to\infty$: it is not a physical state but an idealization, a limit of ever wider packets (3.6);
(c) a square-integrable $\psi$ may be unbounded, e.g. $|x|^{-1/4}e^{-x^2}$.`,
      idea: String.raw`Probabilities must add up to one, and by the Born rule the total probability is $\int|\psi|^2$; so only functions with a finite integral can be rescaled into states. $L^2$ (pma-11.34) is the natural home: it is a vector space (so superpositions of states are states), and its inner product $\ip{\phi}{\psi}=\int\bar\phi\psi$ supplies the overlaps that quantum predictions are built from. Normalizing over a finite window $[-L,L]$ and letting $L\to\infty$ shows the dichotomy: for $\psi\in L^2$ the normalized functions converge, while for a plane wave or a slow tail the normalizing factor $1/\sqrt{N(L)}$ tends to $0$ and the "state" fades away everywhere.`,
      caption: String.raw`Left: $\psi$ (blue, dashed) and its normalized version over the window $[-L,L]$ (green). Right: the partial norm $N(L)=\int_{-L}^{L}|\psi|^2$ on log–log axes. With the **tail** family, slide the exponent $s$ across $\tfrac12$: above it $N(L)$ levels off (an $L^2$ state), below it $N(L)$ grows like $L^{1-2s}$, and stretching the window $L$ makes the normalized wave function shrink towards zero. The **plane wave** grows like $2L$. In **draw** mode, drag on the left panel to sketch any $\psi$, then press **Normalize**.`,
      deps: ['qm-2.2', 'pma-11.34'],
      refs: ['Griffiths §1.4'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Normalizing_constant' },
      tags: ['normalization', 'square-integrable'],
      viz(v) {
        const M = v.M, NDR = 121, xd = Float64Array.from({ length: NDR }, (_, i) => -6 + (12 * i) / (NDR - 1));
        let yd = Float64Array.from(xd, (X) => 0.55 * Math.exp(-((X + 1.6) ** 2) / 1.2) + 0.35 * Math.exp(-((X - 2.2) ** 2) / 0.6) - 0.2 * Math.exp(-((X - 0.6) ** 2) / 0.3));
        let sv = null, lastNorm = null, normed = false;
        const fam = v.select('family', [{ value: 'draw', label: 'draw your own' }, { value: 'tail', label: 'tail $(1+x^2)^{-s/2}$' }, { value: 'plane', label: 'plane wave $e^{ikx}$' }], 'tail', { onChange: () => sync() });
        sv = v.slider('decay exponent $s$', 0.2, 1.5, 0.75, { step: 0.01 });
        const Ls = v.slider('window $L$', 1, 1e4, 30, { log: true, fmt: (t) => (t < 100 ? v.fix(t, 1) : big(t)) });
        const nb = v.button('Normalize', () => { const N = normDraw(); lastNorm = N; const c = 1 / Math.sqrt(N); yd = yd.map((y) => y * c); normed = true; });
        const sync = () => { sv.el.hidden = fam.value !== 'tail'; nb.hidden = fam.value !== 'draw'; };
        const s1 = v.stage({ x: [-12, 12], y: [-0.8, 1.2], height: 300, axes: true, weight: 1.15, xlabel: 'x', title: '$\\psi$ and $\\psi/\\sqrt{N(L)}$' });
        const s2 = v.stage({ x: [1, 1e4], y: [0.3, 3e5], xlog: true, ylog: true, height: 300, axes: 'box', weight: 1, xlabel: 'L', ylabel: 'N(L)', title: 'partial norm $N(L)=\\int_{-L}^{L}|\\psi|^2dx$' });
        const dval = (X) => { if (X <= -6 || X >= 6) return 0; const f = (X + 6) / 12 * (NDR - 1), i = Math.min(NDR - 2, Math.floor(f)); return yd[i] + (f - i) * (yd[i + 1] - yd[i]); };
        const normDraw = () => M.integrate((X) => dval(X) ** 2, -6, 6, 2400);
        s1.onDrag((X, Y, phase) => {
          if (fam.value !== 'draw') return; normed = false;
          const i = Math.round((X + 6) / 12 * (NDR - 1)); if (i < 0 || i >= NDR) return;
          for (let j = Math.max(0, i - 3); j <= Math.min(NDR - 1, i + 3); j++) { const w = Math.exp(-((j - i) ** 2) / 4); yd[j] = (1 - w) * yd[j] + w * M.clamp(Y, -1.1, 1.1); }
          yd[0] = 0; yd[NDR - 1] = 0;
        });
        // partial norm N(L) for each family
        const NL = (L) => {
          if (fam.value === 'plane') return 2 * L;
          if (fam.value === 'draw') return M.integrate((X) => dval(X) ** 2, -Math.min(L, 6), Math.min(L, 6), 1200);
          const s = sv.value; // ∫_{-L}^{L} (1+x²)^{-s} dx via u = asinh(x): ∫ cosh(u)^{1-2s} du
          const U = Math.asinh(L); return 2 * M.integrate((u) => Math.cosh(u) ** (1 - 2 * s), 0, U, 800);
        };
        const psi = (X) => (fam.value === 'draw' ? dval(X) : fam.value === 'plane' ? Math.cos(2 * X) : (1 + X * X) ** (-sv.value / 2));
        let st = null;
        v.render(() => {
          const L = Ls.value, N = NL(L), c = 1 / Math.sqrt(N), f = fam.value;
          if (L < 12) { s1.vband(-12, -L, { color: 'muted', alpha: 0.12 }); s1.vband(L, 12, { color: 'muted', alpha: 0.12 }); s1.vline(-L, { color: 'muted', dash: [3, 3] }); s1.vline(L, { color: 'muted', dash: [3, 3] }); }
          if (f === 'plane') {
            s1.fn((X) => Math.cos(2 * X), { color: 'accent', width: 1.4, dash: [5, 3], n: 600 });
            s1.fn((X) => Math.sin(2 * X), { color: 'purple', width: 1.1, dash: [2, 3], n: 600, alpha: 0.7 });
            s1.fn((X) => (Math.abs(X) <= L ? c * Math.cos(2 * X) : NaN), { color: 'green', width: 2.4, n: 900 });
            s1.text('|e^{ikx}| = 1 everywhere', -11.5, 1.12, { color: 'accent', size: 11.5, baseline: 'top' });
          } else {
            s1.fn(psi, { color: 'accent', width: 1.6, dash: [5, 3], n: 700 });
            s1.fn((X) => (Math.abs(X) <= L ? c * psi(X) : NaN), { color: 'green', width: 2.4, n: 900, fill: 'green', fillAlpha: 0.1 });
          }
          if (f === 'draw') s1.corner(normed ? 'normalized ✓ — drag to redraw' : 'drag here to draw ψ', 'tr', { color: normed ? 'green' : 'muted' });
          // N(L) curve
          const pts = []; for (let k = 0; k <= 160; k++) { const LL = 10 ** (4 * k / 160); pts.push([LL, NL(LL)]); }
          let lim = null;
          if (f === 'draw') lim = NL(6); else if (f === 'tail' && sv.value > 0.5) lim = NL(1e9);
          if (lim) { s2.hline(lim, { color: 'green', dash: [6, 4], width: 1.4 }); s2.text(`limit ${v.fix(lim, 4)}`, 8000, lim, { color: 'green', size: 11.5, dy: -9, align: 'right' }); }
          s2.path(pts, { color: f === 'plane' || (f === 'tail' && sv.value <= 0.5) ? 'red' : 'accent', width: 2.6 });
          s2.dot(L, N, { r: 6, color: 'gold' });
          const verdict = f === 'plane' ? 'not square-integrable: N(L) = 2L' : f === 'draw' ? 'square-integrable (zero outside [−6, 6])' : sv.value > 0.5 ? `square-integrable: |ψ|² ~ 1/|x|${sup(v.fix(2 * sv.value, 2))} is integrable` : sv.value > 0.495 ? 'borderline s = ½: N(L) ≈ 2 log L → ∞' : `not square-integrable: N(L) ~ L${sup(v.fix(1 - 2 * sv.value, 2))}`;
          s2.corner(verdict, 'tr', { color: /not|borderline/.test(verdict) ? 'red' : 'green', weight: 600 });
          st = { L, N, c, lim, f, draw: f === 'draw' ? normDraw() : null };
        });
        v.legend([['accent', 'ψ', { dash: true }], ['green', 'ψ normalized over [−L, L]'], ['gold', 'current window', { dot: true }]]);
        v.readout(() => st && `$N(L) = ${v.fix(st.N, 4)}$ for $L = ${st.L < 100 ? v.fix(st.L, 1) : big(st.L)}$, normalizing factor $1/\\sqrt{N(L)} = ${v.fix(st.c, 5)}$` + (st.f === 'draw' ? ` · drawn $\\psi$: $\\int|\\psi|^2 = ${v.fix(st.draw, 6)}$${lastNorm != null ? ` (it was ${v.fix(lastNorm, 4)} before the last Normalize)` : ''}` : st.lim ? `, which converges to $1/\\norm{\\psi} = ${v.fix(1 / Math.sqrt(st.lim), 5)}$ as $L\\to\\infty$: the normalized state has a limit.` : ' → 0 as $L\\to\\infty$: the normalized function fades to zero everywhere, so there is no normalized state.'));
        sync();
      },
    },
    // ------------------------------------------------------------------ 2.4
    {
      num: '2.4',
      kind: 'Postulate',
      name: 'Schrödinger equation',
      credit: 'Schrödinger, 1926',
      statement: String.raw`**Postulate.** Between measurements the wave function of a particle of mass $m$ in a potential $V(x)$ evolves by the **time-dependent Schrödinger equation**
$$i\hbar\,\frac{\partial\psi}{\partial t}=\hat H\psi,\qquad \hat H=-\frac{\hbar^2}{2m}\frac{\partial^2}{\partial x^2}+V(x),$$
in three dimensions $\hat H=-\frac{\hbar^2}{2m}\nabla^2+V(\mathbf r)$. It is first order in time: $\psi(\cdot,0)$ alone determines $\psi(\cdot,t)$ for all $t$, the evolution is **linear** (superpositions evolve into superpositions) and, for real $V$, **unitary**: $\psi(t)=e^{-i\hat Ht/\hbar}\psi(0)$ preserves $\int|\psi|^2$ (2.5). For a free particle, plane waves $e^{i(kx-\omega t)}$ solve it exactly when $\hbar\omega=\hbar^2k^2/2m$, i.e. $E=p^2/2m$ with de Broglie's $p=\hbar k$, $E=\hbar\omega$.`,
      idea: String.raw`The equation is not derived but built to reproduce what was known. De Broglie's relations (1.9) turn $E=p^2/2m+V$ into a **dispersion relation** (waves-3.3) $\hbar\omega=\hbar^2k^2/2m+V$; on a plane wave $e^{i(kx-\omega t)}$, $i\hbar\partial_t$ produces $\hbar\omega$ and $-i\hbar\partial_x$ produces $\hbar k$, so the energy equation becomes a linear wave equation that also makes sense when $V$ varies. The first time derivative and the factor $i$ are what make the evolution unitary and give wave packets a group velocity $p/m$. Numerically, the split-step method alternates the two halves of $\hat H$: multiplication by $e^{-iV\Delta t/\hbar}$ in position space and by $e^{-i\hbar k^2\Delta t/2m}$ in momentum space (via FFT), each exactly unitary.`,
      caption: String.raw`**Type any potential** $V(x)$ (or pick a preset) and **drag the gold handle** to place the packet; $k_0$ sets its momentum. Top: $V$ (grey) with the packet riding at its mean energy $\langle H\rangle$ (dashed), height $|\psi|$ coloured by phase. Below: the history $|\psi(x,t)|^2$, time running upward, so reflections, tunnelling and interference leave tracks. The box is periodic (split-step Fourier). Increase the time step $\Delta t$: the norm stays exactly 1 at any step size, but the energy and the motion go wrong.`,
      deps: ['qm-2.1', 'qm-1.9', 'waves-3.3'],
      see: ['pde-6.8', 'qm-6.3', 'algo-4.11'],
      refs: ['Griffiths §1.1'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Schr%C3%B6dinger_equation' },
      tags: ['schrödinger equation', 'time evolution'],
      viz(v) {
        const M = v.M, NG = 1024, X0 = -30, X1 = 30, dxg = (X1 - X0) / NG, x = Float64Array.from({ length: NG }, (_, i) => X0 + i * dxg);
        const PRE = { free: ['free particle', '0'], barrier: ['barrier', '2.2 exp(-x^2/0.5)'], step: ['step', '0.75 (1 + tanh(2x))'], harmonic: ['harmonic', '0.02 x^2'], double: ['double well', '3 ((x/8)^2 - 1)^2'], lattice: ['lattice', '0.8 cos(2x)'] };
        let Vin = null;
        const pre = v.select('preset', Object.entries(PRE).map(([value, p]) => ({ value, label: p[0] })), 'barrier', { onChange: (k) => { Vin.set(PRE[k][1]); rebuild(); } });
        Vin = v.input('$V(x) =$', PRE.barrier[1], { vars: ['x'], width: 230, onChange: () => rebuild() });
        const k0 = v.slider('momentum $k_0$ ($\\hbar = m = 1$)', -3, 3, 2, { step: 0.05, onChange: () => rebuild() });
        const dtS = v.select('time step $\\Delta t$', ['0.005', '0.02', '0.1', '0.4'].map((d) => ({ value: d, label: d })), '0.02', { onChange: () => rebuild() });
        const s1 = v.stage({ x: [X0, X1], y: [-0.5, 4], height: 260, axes: 'box', full: true, xlabel: '', ylabel: 'energy', title: '$V(x)$ and $\\psi$ (height $|\\psi|$, colour $\\arg\\psi$)' });
        const s2 = v.stage({ x: [X0, X1], y: [0, 24], height: 210, axes: 'box', full: true, xlabel: 'x', ylabel: 't', title: 'history $|\\psi(x,t)|^2$' });
        const hd = s1.handle(-12, -0.25, { color: 'gold', r: 8, constrain: (X) => [M.clamp(X, X0 + 4, X1 - 4), -0.25], label: 'x₀', labelPos: 'n' });
        const TMAX = 24, NREC = 160, NCOL = 256;
        let Vg, sim;
        const energy = (re, im) => {
          const m = moments(x, re, im); let Vm = 0; for (let i = 0; i < NG; i++) Vm += Vg[i] * (re[i] * re[i] + im[i] * im[i]);
          return { E: 0.5 * (m.sp * m.sp + m.mp * m.mp) + Vm * dxg, N: m.N, mx: m.mx };
        };
        const rec = (S) => { for (let c = 0; c < NCOL; c++) { const i = Math.floor((c + 0.5) * NG / NCOL); S.hist[S.nrec * NCOL + c] = S.re[i] ** 2 + S.im[i] ** 2; } S.nrec++; };
        function rebuild() {
          const f = Vin.fn || (() => 0);
          Vg = Float64Array.from(x, (X) => { const y = f(X); return Number.isFinite(y) ? M.clamp(y, -40, 40) : 0; });
          const dt = +dtS.value, step = splitStepper(M, Vg, dxg, dt);
          sim = clockSim(() => {
            const P = packet(x, hd.x, 1.4, k0.value), S = { re: Array.from(P.re), im: Array.from(P.im), t: 0, hist: new Float32Array(NREC * NCOL), nrec: 0 };
            S.E0 = energy(S.re, S.im).E; rec(S); return S;
          }, (S, h) => { step(S.re, S.im); S.t += h; while (S.nrec < NREC && S.t >= (S.nrec * TMAX) / (NREC - 1) - 1e-9) rec(S); }, dt);
          v.restart();
        }
        hd.onDrag = () => rebuild();
        rebuild();
        let st = null;
        v.animate((t) => {
          const S = sim.at(Math.min(TMAX, t * 2)), col = phaseLUT(v), en = energy(S.re, S.im), E0 = S.E0;
          // potential and packet
          let vmin = Infinity, vmax = -Infinity; for (const y of Vg) { vmin = Math.min(vmin, y); vmax = Math.max(vmax, y); }
          const top = Math.max(E0 * 1.9, Math.min(vmax, E0 * 3 + 1), 1.5), lo = Math.min(vmin, 0) - 0.12 * (top - Math.min(vmin, 0));
          s1.setView([X0, X1], [lo, top]); hd.y = lo + 0.06 * (top - lo);
          s1.fn((X) => { const i = M.clamp(Math.round((X - X0) / dxg), 0, NG - 1); return Vg[i]; }, { color: 'muted', width: 2, fill: 'muted', fillAlpha: 0.18, base: lo, n: 700 });
          drawPsi(s1, x, S.re, S.im, { col, base: E0, scale: (top - lo) * 0.33 / 0.42 });
          s1.hline(E0, { color: 'ink', dash: [5, 4], width: 1, alpha: 0.6 });
          s1.text('⟨H⟩', X1, E0, { color: 'ink', size: 11, align: 'right', dy: -8, dx: -4 });
          phaseWheel(s1, col, s1.W - 34, 40, 12);
          // history raster
          let hmax = 1e-9; for (let k = 0; k < S.nrec * NCOL; k++) hmax = Math.max(hmax, S.hist[k]);
          const CA = v.rgb('accent'), CG = v.rgb('gold');
          s2.raster((X, Y) => {
            if (X < X0 || X > X1 || Y < 0 || Y > TMAX) return null;
            const r = Math.round((Y / TMAX) * (NREC - 1)); if (r >= S.nrec) return null;
            const c = M.clamp(Math.floor(((X - X0) / (X1 - X0)) * NCOL), 0, NCOL - 1);
            const u = Math.sqrt(S.hist[r * NCOL + c] / hmax), w = Math.max(0, (u - 0.6) / 0.4);
            return [CA[0] + (CG[0] - CA[0]) * w, CA[1] + (CG[1] - CA[1]) * w, CA[2] + (CG[2] - CA[2]) * w, Math.round(255 * Math.min(1, 1.15 * u))];
          }, { res: 2, key: `${S.nrec}|${hmax}|${S.t}` });
          s2.hline(S.t, { color: 'gold', width: 1.4, dash: [4, 3] });
          st = { T: S.t, N: en.N, E: en.E, dE: en.E - E0, mx: en.mx, err: Vin.error };
        }, { period: 12.5, still: 7 });
        v.legend([['muted', 'potential V(x)', { area: true }], ['ink', 'mean energy ⟨H⟩', { dash: true }], ['gold', 'packet start / now']]);
        v.readout(() => st && (st.err ? `formula error: ${st.err} (using the last valid V)` : '') + `$t = ${v.fix(st.T, 2)}$ · $\\int|\\psi|^2dx = ${v.fix(st.N, 10)}$ · $\\langle H\\rangle = ${v.fix(st.E, 5)}$ (change since $t=0$: ${v.sci(st.dE, 2) === '0' ? '0' : `$${v.sci(st.dE, 2)}$`}) · $\\langle x\\rangle = ${v.fix(st.mx, 3)}$ · step $\\Delta t = ${dtS.value}$, ${NG} grid points, $\\Delta x = ${v.fix(dxg, 4)}$.`);
      },
    },
    // ------------------------------------------------------------------ 2.5
    {
      num: '2.5',
      kind: 'Theorem',
      name: 'Normalization is preserved in time',
      statement: String.raw`Let $\psi(x,t)$ solve $i\hbar\,\partial_t\psi=-\frac{\hbar^2}{2m}\partial_x^2\psi+V\psi$ with $\psi$ and $\partial_x\psi$ decaying as $|x|\to\infty$. If the potential $V$ is **real**, then
$$\frac{d}{dt}\int_{-\infty}^{\infty}|\psi(x,t)|^2\,dx=0,$$
so a wave function normalized at $t=0$ stays normalized for all time and the Born rule (2.2) stays consistent; equivalently, the evolution operator $e^{-i\hat Ht/\hbar}$ is unitary. For a complex ("optical") potential $V=V_R+iV_I$,
$$\frac{d}{dt}\int|\psi|^2\,dx=\frac{2}{\hbar}\int V_I\,|\psi|^2\,dx,$$
so total probability drains away where $V_I<0$ (absorption: particles removed from the beam) and grows where $V_I>0$.`,
      idea: String.raw`Differentiate under the integral: $\partial_t|\psi|^2=\bar\psi\,\partial_t\psi+\psi\,\partial_t\bar\psi$. Substituting the equation, the potential contributes $\frac{1}{i\hbar}(V-\bar V)|\psi|^2=\frac2\hbar V_I|\psi|^2$, which vanishes for real $V$, and the kinetic terms combine into an exact derivative $-\partial_x j$ (the probability current, 2.6), whose integral is the flux at infinity, zero for a decaying $\psi$. In operator language, $\hat H$ is symmetric — integrating by parts twice moves $\partial_x^2$ from one factor of $\ip{\phi}{\hat H\psi}$ to the other — so $\frac{d}{dt}\ip\psi\psi=\frac{i}{\hbar}\big(\ip{\hat H\psi}{\psi}-\ip{\psi}{\hat H\psi}\big)=0$; for the free equation this is Plancherel's theorem applied mode by mode (pde-9.10). The Crank–Nicolson step $\big(1+\tfrac{i\Delta t}{2\hbar}\hat H\big)\psi^{+}=\big(1-\tfrac{i\Delta t}{2\hbar}\hat H\big)\psi$ inherits this exactly: it is the Cayley transform of a Hermitian matrix, hence unitary for every $\Delta t$.`,
      caption: String.raw`A packet hits a barrier and splits; the Crank–Nicolson simulation runs three copies at once. Bottom: total probability against time. With a **real** potential (green) it stays at $1$ to machine precision — the readout shows twelve digits — at any time step, even an absurdly large one (the motion then goes wrong, the norm does not). Choose the **absorber** (hatched edges, $V_I=-\Gamma$): probability leaks away as the two halves enter it. Choose **gain** ($V_I=+\Gamma$ in a strip): the transmitted half grows. The readout checks the measured $dN/dt$ against $\frac2\hbar\int V_I|\psi|^2dx$.`,
      deps: ['qm-2.4', 'qm-2.3', 'pde-9.10'],
      see: ['pde-13.4'],
      refs: ['Griffiths §1.4'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Unitarity_(physics)' },
      tags: ['unitarity', 'conservation', 'probability'],
      viz(v) {
        const M = v.M, { x, dx } = grid(-24, 24, 601), n = x.length, TMAX = 22, NREC = 300;
        const pot = v.select('imaginary part', [{ value: 'real', label: 'none: $V$ real' }, { value: 'absorb', label: 'absorber $V_I=-\\Gamma$ at the edges' }, { value: 'gain', label: 'gain $V_I=+\\Gamma$ in a strip' }], 'absorb');
        const G = v.slider('strength $\\Gamma$', 0.02, 0.4, 0.15, { step: 0.01, onChange: () => sim.reset() });
        const dtS = v.slider('time step $\\Delta t$', 0.005, 1, 0.05, { log: true, onChange: () => rebuild() });
        const s1 = v.stage({ x: [-24, 24], y: [-0.06, 0.62], height: 230, axes: 'box', full: true, xlabel: 'x', ylabel: '|ψ|', title: 'the packet (height $|\\psi|$, colour $\\arg\\psi$) and the potential' });
        const s2 = v.stage({ x: [0, TMAX], y: [0, 1.75], height: 210, axes: 'box', full: true, xlabel: 't', ylabel: '∫|ψ|² dx', title: 'total probability $N(t)=\\int|\\psi|^2dx$' });
        const Vr = Float64Array.from(x, (X) => 1.45 * Math.exp(-X * X / 0.8));
        const absorbF = (X) => (Math.abs(X) > 14 ? -(((Math.abs(X) - 14) / 10) ** 2) * 2 : 0); // ramps to −2Γ at the edges
        const gainF = (X) => (X > 4 && X < 10 ? 1 : 0);
        let sim;
        function rebuild() {
          const dt = dtS.value;
          sim = clockSim(() => {
            const P = packet(x, -8, 1.3, 1.8), S = { t: 0, rec: [], c: [0, 1, 2].map(() => ({ re: Float64Array.from(P.re), im: Float64Array.from(P.im) })) };
            const VI = [Float64Array.from(x, () => 0), Float64Array.from(x, (X) => G.value * absorbF(X)), Float64Array.from(x, (X) => G.value * gainF(X))];
            S.VI = VI; S.rec.push(record(S, null)); return S;
          }, (S, h) => {
            const prev = S.c.map((c) => normSq(c.re, c.im, dx));
            S.c.forEach((c, k) => {
              const vi = S.VI[k];
              if (k) for (let i = 0; i < n; i++) { const f = Math.exp(vi[i] * h / 2); c.re[i] *= f; c.im[i] *= f; }
              M.crankNicolson1D(c.re, c.im, Vr, dx, h);
              if (k) for (let i = 0; i < n; i++) { const f = Math.exp(vi[i] * h / 2); c.re[i] *= f; c.im[i] *= f; }
            });
            S.t += h; S.rec.push(record(S, prev, h));
          }, dt);
          v.restart();
        }
        const rate = (c, vi) => { let s = 0; for (let i = 0; i < n; i++) s += vi[i] * (c.re[i] ** 2 + c.im[i] ** 2); return 2 * s * dx; };
        function record(S, prev, h) {
          const N = S.c.map((c) => normSq(c.re, c.im, dx)), F = S.c.map((c, k) => rate(c, S.VI[k]));
          return { t: S.t, N, F, meas: prev ? N.map((y, k) => (y - prev[k]) / h) : [0, 0, 0] };
        }
        rebuild();
        let st = null;
        v.animate((t) => {
          const S = sim.at(Math.min(TMAX, t * 2)), col = phaseLUT(v), k = { real: 0, absorb: 1, gain: 2 }[pot.value], c = S.c[k];
          // regions and potential
          if (k === 1) { s1.rect(-24, -0.06, -14, 0.62, { fill: 'red', fillAlpha: 0.05, hatch: 'red', hatchAlpha: 0.35, stroke: false }); s1.rect(14, -0.06, 24, 0.62, { fill: 'red', fillAlpha: 0.05, hatch: 'red', hatchAlpha: 0.35, stroke: false }); s1.text('absorber', -18, 0.5, { color: 'red', size: 11.5, align: 'center' }); s1.text('absorber', 19, 0.5, { color: 'red', size: 11.5, align: 'center' }); }
          if (k === 2) { s1.rect(4, -0.06, 10, 0.62, { fill: 'orange', fillAlpha: 0.06, hatch: 'orange', hatchAlpha: 0.4, stroke: false }); s1.text('gain', 7, 0.5, { color: 'orange', size: 11.5, align: 'center' }); }
          drawPsi(s1, x, c.re, c.im, { col });
          s1.fn((X) => 0.25 * 1.45 * Math.exp(-X * X / 0.8), { color: 'ink', width: 1.6, dash: [4, 3], fill: 'muted', fillAlpha: 0.25, n: 400 });
          s1.text('barrier V', 0.9, 0.34, { color: 'ink', size: 11, align: 'left' });
          phaseWheel(s1, col, s1.X(11), 42, 12);
          // norm histories
          const R = S.rec, COLS = ['green', 'red', 'orange'];
          s2.hline(1, { color: 'muted', dash: [3, 4], width: 1 });
          for (let q = 0; q < 3; q++) {
            const step = Math.max(1, Math.floor(R.length / 600)), pts = [];
            for (let i = 0; i < R.length; i += step) pts.push([R[i].t, R[i].N[q]]);
            pts.push([R[R.length - 1].t, R[R.length - 1].N[q]]);
            s2.path(pts, { color: COLS[q], width: q === k ? 3 : 1.4, alpha: q === k ? 1 : 0.55 });
          }
          s2.vline(S.t, { color: 'gold', dash: [4, 3], width: 1.2 });
          const L = R[R.length - 1];
          st = { t: S.t, N0: L.N[0], Nk: L.N[k], meas: L.meas[k], F: R.length > 1 ? 0.5 * (L.F[k] + R[R.length - 2].F[k]) : L.F[k], k, steps: R.length - 1 };
        }, { period: 12, still: 6.5 });
        v.legend([['green', 'N(t), real V'], ['red', 'N(t), absorber'], ['orange', 'N(t), gain'], ['muted', 'barrier V', { area: true }]]);
        v.readout(() => st && `$t = ${v.fix(st.t, 2)}$ after ${st.steps} Crank–Nicolson steps of $\\Delta t = ${v.fix(dtS.value, 3)}$ · real $V$: $N = ${st.N0.toFixed(12)}$ (drift ${Math.abs(st.N0 - 1) < 1e-16 ? '0' : `$${v.sci(Math.abs(st.N0 - 1), 1)}$`})` + (st.k ? ` · ${st.k === 1 ? 'absorber' : 'gain'}: $N = ${v.fix(st.Nk, 5)}$, measured $dN/dt = ${fz(v, st.meas, 5)}$ vs $\\frac2\\hbar\\int V_I|\\psi|^2dx = ${fz(v, st.F, 5)}$` : ' · choose an imaginary part to break unitarity.'));
      },
    },
    // ------------------------------------------------------------------ 2.6
    {
      num: '2.6',
      kind: 'Theorem',
      name: 'Probability current and continuity',
      statement: String.raw`For a solution of the Schrödinger equation with real potential, define the **probability current**
$$j(x,t)=\frac{\hbar}{2mi}\Big(\bar\psi\,\frac{\partial\psi}{\partial x}-\psi\,\frac{\partial\bar\psi}{\partial x}\Big)=\frac{\hbar}{m}\operatorname{Im}\big(\bar\psi\,\partial_x\psi\big).$$
Then $\rho=|\psi|^2$ and $j$ satisfy the **continuity equation**
$$\frac{\partial\rho}{\partial t}+\frac{\partial j}{\partial x}=0,\qquad\text{so}\qquad \frac{d}{dt}\int_a^b\rho\,dx=j(a,t)-j(b,t):$$
the probability in any interval changes only by what flows through its ends. Writing $\psi=|\psi|e^{iS/\hbar}$ gives $j=\rho\,\partial_xS/m$: the current is density times a velocity field set by the gradient of the phase. A real wave function (up to a constant phase) carries no current. In 3D, $\mathbf j=\frac\hbar m\operatorname{Im}(\bar\psi\nabla\psi)$ and $\partial_t\rho+\nabla\!\cdot\mathbf j=0$.`,
      idea: String.raw`From the equation, $\partial_t\psi=\frac{i\hbar}{2m}\psi''-\frac{i}{\hbar}V\psi$; then $\partial_t|\psi|^2=\bar\psi\partial_t\psi+\psi\partial_t\bar\psi=\frac{i\hbar}{2m}(\bar\psi\psi''-\psi\bar\psi'')$, the $V$ terms cancelling because $V$ is real. The bracket is a derivative, $\bar\psi\psi''-\psi\bar\psi''=\partial_x(\bar\psi\psi'-\psi\bar\psi')$, which is exactly $-\partial_xj$. This is the same local bookkeeping as charge conservation in electromagnetism (em-6.2): integrating over $[a,b]$ turns the divergence into the boundary fluxes, and integrating over the whole line gives conservation of normalization (2.5).`,
      caption: String.raw`A packet runs into a barrier. The density $|\psi|^2$ is shaded blue; the orange arrows below show the current $j$ (length and thickness $\propto|j|$; they point left in the reflected wave). **Drag the two orange handles** to choose a window $[a,b]$. Bottom: the rate of change of the probability inside the window (blue) and the net inflow $j(a)-j(b)$ through its edges (gold dashed) — the two curves coincide at every instant, through arrival, splitting and departure. Try the harmonic well: the current reverses at each turning point.`,
      deps: ['qm-2.5', 'em-6.2'],
      refs: ['Griffiths §1.4'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Probability_current' },
      tags: ['probability current', 'continuity equation'],
      viz(v) {
        const M = v.M, { x, dx } = grid(-20, 20, 501), n = x.length, TMAX = 16;
        const POT = { barrier: ['barrier', (X) => 1.9 * Math.exp(-X * X / 0.6)], step: ['step down', (X) => -1.2 * (1 + Math.tanh(3 * X)) / 2], harmonic: ['harmonic well', (X) => 0.06 * X * X] };
        const pot = v.select('potential', Object.entries(POT).map(([value, p]) => ({ value, label: p[0] })), 'barrier', { onChange: () => sim.reset() });
        const s1 = v.stage({ x: [-20, 20], y: [-0.2, 0.42], height: 260, axes: 'box', full: true, xlabel: 'x', yticks: [0, 0.1, 0.2, 0.3, 0.4], title: 'density $\\rho=|\\psi|^2$ (blue) and current $j$ (orange arrows)' });
        const s2 = v.stage({ x: [0, TMAX], y: [-0.4, 0.4], height: 200, axes: 'box', full: true, xlabel: 't', ylabel: 'rate', title: 'inside $[a,b]$: $\\frac{d}{dt}\\int_a^b\\rho\\,dx$ (blue) and $j(a)-j(b)$ (gold, dashed)' });
        const ha = s1.handle(-3, -0.17, { color: 'orange', r: 7, label: 'a', labelPos: 'n', constrain: (X) => [M.clamp(X, -19, hb ? hb.x - 0.5 : 19), -0.17] });
        const hb = s1.handle(3.5, -0.17, { color: 'orange', r: 7, label: 'b', labelPos: 'n', constrain: (X) => [M.clamp(X, ha.x + 0.5, 19), -0.17] });
        ha.onDrag = () => sim.reset(); hb.onDrag = () => sim.reset();
        const idx = (X) => M.clamp(Math.round((X - x[0]) / dx), 1, n - 2);
        const inside = (S, ia, ib) => { let s = 0; for (let i = ia; i <= ib; i++) s += (S.re[i] ** 2 + S.im[i] ** 2) * (i === ia || i === ib ? 0.5 : 1); return s * dx; };
        const dt = 0.02;
        let Vg;
        const sim = clockSim(() => {
          Vg = Float64Array.from(x, POT[pot.value][1]);
          const P = packet(x, pot.value === 'harmonic' ? -6 : -8, 1.2, pot.value === 'harmonic' ? 0 : 2), S = { re: P.re, im: P.im, t: 0, hist: [] };
          const ia = idx(ha.x), ib = idx(hb.x); S.ia = ia; S.ib = ib; S.P = inside(S, ia, ib); const j = current(S.re, S.im, dx); S.flux = j[ia] - j[ib];
          return S;
        }, (S, h) => {
          M.crankNicolson1D(S.re, S.im, Vg, dx, h); S.t += h;
          const P = inside(S, S.ia, S.ib), j = current(S.re, S.im, dx), flux = j[S.ia] - j[S.ib];
          S.hist.push([S.t - h / 2, (P - S.P) / h, (flux + S.flux) / 2]); S.P = P; S.flux = flux;
        }, dt);
        let st = null;
        v.animate((t) => {
          const S = sim.at(Math.min(TMAX, t * 1.6)), j = current(S.re, S.im, dx);
          const rho = Float64Array.from(S.re, (r, i) => r * r + S.im[i] ** 2);
          // potential (scaled) and window
          const Vs = POT[pot.value][1];
          s1.fn((X) => 0.08 * Vs(X), { color: 'muted', width: 1.4, dash: [4, 3], n: 400 });
          s1.vband(ha.x, hb.x, { color: 'orange', alpha: 0.1 });
          s1.vline(ha.x, { color: 'orange', width: 1.2, dash: [4, 3] }); s1.vline(hb.x, { color: 'orange', width: 1.2, dash: [4, 3] });
          s1.path(Array.from(x, (X, i) => [X, rho[i]]), { color: 'accent', width: 2.2 });
          s1.fn((X) => rho[idx(X)], { color: 'accent', width: 0, fill: 'accent', fillAlpha: 0.2, n: 500 });
          // arrows of j on a strip
          let jmax = 0.02; for (const q of j) jmax = Math.max(jmax, Math.abs(q));
          const yA = -0.085;
          s1.hline(yA, { color: 'faint', width: 1 });
          for (let X = -19; X <= 19.01; X += 1) {
            const q = j[idx(X)], u = Math.min(1, Math.abs(q) / 0.55), len = Math.sign(q) * 0.92 * u;
            if (u < 0.03) continue;
            s1.arrow(X - len / 2, yA, X + len / 2, yA, { color: 'orange', width: 1 + 2.4 * u, head: 5 + 4 * u });
          }
          s1.text('j →', -19.6, yA + 0.04, { color: 'orange', size: 11, align: 'left' });
          // chart
          const H = S.hist; let amax = 0.05; for (const r of H) amax = Math.max(amax, Math.abs(r[1]), Math.abs(r[2]));
          s2.setView([0, TMAX], [-1.2 * amax, 1.2 * amax]);
          s2.hline(0, { color: 'faint' });
          s2.path(H.map((r) => [r[0], r[1]]), { color: 'accent', width: 3 });
          s2.path(H.map((r) => [r[0], r[2]]), { color: 'gold', width: 1.8, dash: [6, 4] });
          s2.vline(S.t, { color: 'muted', dash: [3, 3], width: 1 });
          const last = H[H.length - 1];
          let err = 0, mx = 1e-12; for (const r of H) { err = Math.max(err, Math.abs(r[1] - r[2])); mx = Math.max(mx, Math.abs(r[1])); }
          const ia = idx(ha.x), va = rho[ia] > 1e-6 ? j[ia] / rho[ia] : NaN;
          st = { t: S.t, P: S.P, last, err, mx, ja: j[ia], jb: j[idx(hb.x)], va, N: normSq(S.re, S.im, dx) };
        }, { period: 11, still: 5.5 });
        v.legend([['accent', 'ρ = |ψ|²', { area: true }], ['orange', 'current j'], ['muted', 'potential (scaled)', { dash: true }], ['gold', 'j(a) − j(b)', { dash: true }]]);
        v.readout(() => st && `$t = ${v.fix(st.t, 2)}$ · probability in $[a,b]$: ${v.fix(st.P, 5)} · $j(a) = ${fz(v, st.ja, 4)}$, $j(b) = ${fz(v, st.jb, 4)}$` + (Number.isFinite(st.va) ? ` (velocity field at $a$: $j/\\rho = ${fz(v, st.va, 3)}$)` : '') + (st.last ? ` · now $\\frac{d}{dt}\\int_a^b\\rho = ${fz(v, st.last[1], 5)}$ vs $j(a)-j(b) = ${fz(v, st.last[2], 5)}$; largest mismatch over the run ${v.fix(100 * st.err / st.mx, 2)} % of the peak rate (finite differences)` : '') + ` · total $\\int\\rho = ${v.fix(st.N, 8)}$.`);
      },
    },
    // ------------------------------------------------------------------ 2.7
    {
      num: '2.7',
      kind: 'Definition',
      name: 'Expectation values',
      statement: String.raw`For a normalized state $\psi$, the **expectation value** of position is
$$\langle x\rangle=\int_{-\infty}^{\infty}x\,|\psi(x,t)|^2\,dx,$$
and more generally $\langle f(x)\rangle=\int f(x)|\psi|^2dx$ for any function $f$ for which the integral converges; the **uncertainty** (standard deviation) is $\Delta x=\sqrt{\langle x^2\rangle-\langle x\rangle^2}$. By the Born rule (2.2), $\langle f(x)\rangle$ is the mean of the outcomes $f(x_k)$ of position measurements on many identically prepared particles — not the average of repeated measurements on one particle (the first measurement changes its state) and not necessarily a likely, or even a possible, outcome. For other observables the definition becomes $\langle Q\rangle=\int\bar\psi\,\hat Q\psi\,dx$ (2.8).`,
      idea: String.raw`It is the ordinary mean of a random variable whose law has density $|\psi|^2$: the Born rule supplies the distribution, and the expectation is its first moment. The law of large numbers then guarantees that the running average of $N$ independent outcomes converges to $\langle f\rangle$, with fluctuations of size $\Delta f/\sqrt N$ (central limit theorem) — while each individual outcome keeps scattering with spread $\Delta f$, however many are taken. For a skewed density the mean lies away from the peak; for a state with a node it can sit exactly where the particle is never found.`,
      caption: String.raw`Top: $|\psi|^2$ with $\langle f\rangle$ (green) and the most likely position (gold); ticks are the latest outcomes. Bottom: the running mean of $f(x_k)$ against the number of measurements on a log scale, inside the funnel $\langle f\rangle\pm\Delta f/\sqrt N$, with individual outcomes as faint dots that never stop scattering. **Measure** more and watch the mean settle. Type any **observable** $f(x)$, such as $x^2$ or $\sin x$. With the first excited state, $\langle x\rangle=0$ is where $|\psi|^2$ vanishes: an average no single measurement ever gives.`,
      deps: ['qm-2.2'],
      see: ['prob-2.4.1', 'prob-2.2.3'],
      refs: ['Griffiths §1.5'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Expectation_value_(quantum_mechanics)' },
      tags: ['expectation value', 'measurement statistics'],
      viz(v) {
        const M = v.M, { x, dx } = grid(-6, 10, 801), n = x.length;
        const STATES = {
          skew: { label: 'skewed ($x\\,e^{-x/a}$)', f: (X) => (X > 0 ? X * Math.exp(-X / 1.2) : 0) },
          node: { label: 'first excited state', f: (X) => ho[1](X) },
          gauss: { label: 'Gaussian', f: (X) => Math.exp(-((X - 1.5) ** 2) / 2) },
        };
        const state = v.select('state', Object.entries(STATES).map(([value, S]) => ({ value, label: S.label })), 'skew', { onChange: () => reset() });
        const fin = v.input('observable $f(x) =$', 'x', { vars: ['x'], width: 150, onChange: () => v.invalidate() });
        let rng, xs = [], cache = {};
        const get = () => {
          if (cache[state.value]) return cache[state.value];
          const rho = Float64Array.from(x, (X) => STATES[state.value].f(X) ** 2); let s = 0; for (const r of rho) s += r * dx; for (let i = 0; i < n; i++) rho[i] /= s;
          let im = 0; for (let i = 1; i < n; i++) if (rho[i] > rho[im]) im = i;
          return (cache[state.value] = { rho, draw: sampler(x, rho), mode: x[im] });
        };
        const measure = (k) => { const P = get(); for (let i = 0; i < k; i++) xs.push(P.draw(rng())); };
        function reset() { rng = v.rng(77); xs = []; measure(600); }
        v.button('Measure 1', () => measure(1)); v.button('+100', () => measure(100)); v.button('+10,000', () => measure(10000)); v.button('Reset', () => reset());
        const s1 = v.stage({ x: [-6, 10], y: [-0.08, 0.6], height: 220, axes: 'box', full: true, xlabel: 'x', ylabel: '|ψ|²', title: 'the distribution of outcomes $|\\psi|^2$' });
        const s2 = v.stage({ x: [1, 1e5], y: [-1, 4], xlog: true, height: 240, axes: 'box', full: true, xlabel: 'number of measurements N', ylabel: 'f', title: 'running mean of $f(x_1),\\dots,f(x_N)$' });
        reset();
        let st = null;
        v.render(() => {
          const P = get(), f = fin.fn || ((X) => X);
          let m1 = 0, m2 = 0; for (let i = 0; i < n; i++) { const y = f(x[i]); if (!Number.isFinite(y)) continue; m1 += y * P.rho[i] * dx; m2 += y * y * P.rho[i] * dx; }
          const sd = Math.sqrt(Math.max(0, m2 - m1 * m1));
          const ymax = Math.max(...P.rho) * 1.3; s1.setView([-6, 10], [-0.13 * ymax, ymax]);
          s1.path(Array.from(x, (X, i) => [X, P.rho[i]]), { color: 'accent', width: 2.2 });
          s1.fn((X) => P.rho[M.clamp(Math.round((X + 6) / dx), 0, n - 1)], { color: 'accent', width: 0, fill: 'accent', fillAlpha: 0.15, n: 500 });
          const tick = -0.065 * ymax; for (const X of xs.slice(-250)) s1.line(X, tick - 0.035 * ymax, X, tick + 0.035 * ymax, { color: 'ink', width: 1, alpha: 0.35 });
          const isX = (fin.value || '').replace(/\s/g, '') === 'x';
          if (isX) { s1.vband(m1 - sd, m1 + sd, { color: 'green', alpha: 0.08 }); }
          s1.vline(P.mode, { color: 'gold', width: 1.6, dash: [5, 4] }); { const left = !isX || P.mode <= m1; s1.text('most likely', P.mode, ymax * 0.93, { color: 'gold', size: 11.5, align: left ? 'right' : 'left', dx: left ? -5 : 5 }); }
          if (isX) { s1.vline(m1, { color: 'green', width: 2.2 }); s1.text('⟨x⟩', m1, ymax * 0.8, { color: 'green', size: 12, dx: 5 }); }
          else s1.corner(`⟨f⟩ is a number on the f-axis below, not a position`, 'tr', { color: 'muted' });
          // running mean
          const N = xs.length, fv = xs.map((X) => f(X)), lo = m1 - 3.6 * (sd || 1), hi = m1 + 3.6 * (sd || 1);
          s2.setView([1, 1e5], [lo, hi]);
          const fun = []; for (let k = 0; k <= 100; k++) { const NN = 10 ** (5 * k / 100); fun.push([NN, m1 + sd / Math.sqrt(NN)]); }
          const fun2 = fun.map(([NN]) => [NN, m1 - sd / Math.sqrt(NN)]);
          s2.poly(fun.concat(fun2.reverse()), { fill: 'green', fillAlpha: 0.12, stroke: false });
          s2.hline(m1, { color: 'green', width: 2 });
          s2.hband(m1 - sd, m1 + sd, { color: 'muted', alpha: 0.06 });
          const dots = []; for (let i = 0; i < Math.min(N, 4000); i++) dots.push([i + 1, fv[i]]);
          s2.dots(dots.filter((d) => Number.isFinite(d[1])), { r: 1.6, color: 'ink', alpha: 0.22 });
          let s = 0; const pts = []; let next = 1;
          for (let i = 0; i < N; i++) { s += fv[i]; if (i + 1 >= next || i === N - 1) { pts.push([i + 1, s / (i + 1)]); next = Math.ceil((i + 1) * 1.02); } }
          s2.path(pts, { color: 'accent', width: 2.6 });
          s2.text(`⟨f⟩ ± Δf: outcomes keep this spread`, 1.3, m1 + sd, { color: 'muted', size: 11, dy: -8 });
          st = { N, mean: s / N, m1, sd, se: sd / Math.sqrt(N), mode: P.mode, err: fin.error, isX, rhoAt: P.rho[M.clamp(Math.round((m1 + 6) / dx), 0, n - 1)] / Math.max(...P.rho) };
        });
        v.legend([['accent', 'running mean'], ['green', '⟨f⟩ ± Δf/√N', { area: true }], ['ink', 'single outcomes', { dot: true }], ['gold', 'most likely position', { dash: true }]]);
        v.readout(() => st && (st.err ? `formula error: ${st.err} · ` : '') + `${big(st.N)} measurements: mean of $f(x_k)$ = **${fz(v, st.mean, 4)}**, $\\langle f\\rangle = \\int f|\\psi|^2dx = ${fz(v, st.m1, 4)}$, difference ${fz(v, st.mean - st.m1, 4)} vs expected size $\\Delta f/\\sqrt N = ${v.fix(st.se, 4)}$ · spread of single outcomes $\\Delta f = ${v.fix(st.sd, 4)}$` + (st.isX ? ` · most likely position ${fz(v, st.mode, 3)}${st.rhoAt < 0.01 ? ` — and $|\\psi|^2$ at $\\langle x\\rangle$ is ${v.fix(100 * st.rhoAt, 3)} % of its peak: the average is an outcome that never occurs` : ''}` : ''));
      },
    },
    // ------------------------------------------------------------------ 2.8
    {
      num: '2.8',
      kind: 'Definition',
      name: 'Momentum operator',
      statement: String.raw`In the position representation the **momentum operator** is
$$\hat p=-i\hbar\,\frac{\partial}{\partial x},\qquad \langle p\rangle=\int_{-\infty}^{\infty}\bar\psi\Big(-i\hbar\frac{\partial\psi}{\partial x}\Big)dx,$$
and a function of momentum is computed by substituting $\hat p$, e.g. $\langle p^2\rangle=\int\bar\psi(-\hbar^2\psi'')\,dx=\hbar^2\int|\psi'|^2dx$ and $\hat H=\hat p^2/2m+V(x)$. The plane waves $e^{ikx}$ are the eigenfunctions, $\hat p\,e^{ikx}=\hbar k\,e^{ikx}$, with eigenvalue the de Broglie momentum $\hbar k=h/\lambda$. For normalized $\psi$ (with $\psi'\in L^2$), $\langle p\rangle$ is real, it vanishes for real $\psi$, and it equals $m\,\frac{d}{dt}\langle x\rangle$ (2.9).`,
      idea: String.raw`De Broglie (1.9) gave a plane wave of wave number $k$ the momentum $\hbar k$, and $-i\hbar\,d/dx$ is the operator that reads $k$ off the phase: it returns $\hbar k$ times the wave. A general $\psi$ is a superposition of plane waves (2.10), so the expectation $\int\bar\psi\,\hat p\psi$ averages $\hbar k$ over the Fourier components with weights $|\phi|^2$ — the rule 2.7 applied in momentum space. Writing $\psi=|\psi|e^{iS/\hbar}$, $\hat p\psi/\psi=S'-i\hbar\,(\ln|\psi|)'$: the real part is the local phase gradient, the imaginary part comes from the changing envelope and integrates to zero against $|\psi|^2$. The definition is confirmed dynamically: computing $\frac{d}{dt}\langle x\rangle$ from the Schrödinger equation gives $\langle p\rangle/m$.`,
      caption: String.raw`Top left: $\psi$ (height $|\psi|$, colour phase); below it, $\hat p\psi=-i\hbar\psi'$ computed by finite differences, with $\hbar k_0\psi$ dashed for comparison. Top right: the ratio $\hat p\psi/\psi$ — for the **plane wave** it is the constant $\hbar k_0$ (an eigenfunction: same colours, scaled), for a **packet** its imaginary part tilts with the envelope, for **two momenta** or a **real** wave it oscillates. Bottom right: $\langle x\rangle$ in a Crank–Nicolson simulation (dots) against $\langle x\rangle_0+\langle p\rangle t/m$ (green). Drag $k_0$ through zero: the colours wind the other way and the motion reverses.`,
      deps: ['qm-2.7', 'qm-1.9'],
      see: ['pde-9.1'],
      refs: ['Griffiths §1.5'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Momentum_operator' },
      tags: ['momentum operator', 'operators'],
      viz(v) {
        const M = v.M, { x, dx } = grid(-40, 40, 1601), n = x.length, TM = 8, DT = 0.025;
        const kind = v.select('ψ', [{ value: 'plane', label: '≈ plane wave' }, { value: 'packet', label: 'packet' }, { value: 'two', label: 'two momenta' }, { value: 'real', label: 'real: packet × cos' }], 'packet');
        const ks = v.slider('wave number $k_0$', -3, 3, 1.5, { step: 0.05 });
        const sP = v.stage({ x: [-10, 10], y: [-0.1, 1.2], height: 175, axes: 'box', minWidth: 380, xticks: [], title: '$\\psi$, scaled to peak 1 (colour $\\arg\\psi$)' });
        const sR = v.stage({ x: [-10, 10], y: [-4, 4], height: 175, axes: 'box', minWidth: 380, xticks: [], title: 'the ratio $\\hat p\\psi/\\psi$ (units of $\\hbar$)' });
        const sD = v.stage({ x: [-10, 10], y: [-0.1, 4], height: 175, axes: 'box', minWidth: 380, xlabel: 'x', title: '$\\hat p\\psi=-i\\hbar\\,\\partial_x\\psi$ (same scale)' });
        const sX = v.stage({ x: [0, TM], y: [-10, 10], height: 175, axes: 'box', minWidth: 380, xlabel: 't', ylabel: '⟨x⟩', title: '$\\langle x\\rangle(t)$ in the simulation' });
        const make = () => {
          const k = ks.value, re = new Float64Array(n), im = new Float64Array(n);
          for (let i = 0; i < n; i++) {
            const X = x[i]; let a = 0, ph = 0, r = 0, q = 0;
            if (kind.value === 'plane') { a = Math.exp(-X * X / (4 * 12 * 12)); ph = k * X; r = a * Math.cos(ph); q = a * Math.sin(ph); }
            else if (kind.value === 'packet') { a = Math.exp(-X * X / (4 * 1.6 * 1.6)); ph = k * X; r = a * Math.cos(ph); q = a * Math.sin(ph); }
            else if (kind.value === 'two') { a = Math.exp(-X * X / (4 * 2.2 * 2.2)); r = a * (Math.cos(k * X) + 0.7 * Math.cos(-0.5 * k * X)); q = a * (Math.sin(k * X) + 0.7 * Math.sin(-0.5 * k * X)); }
            else { a = Math.exp(-X * X / (4 * 1.6 * 1.6)); r = a * Math.cos(k * X); }
            re[i] = r; im[i] = q;
          }
          normalize(re, im, dx);
          return { re, im };
        };
        const deriv = (f, i) => (f[i - 2] - 8 * f[i - 1] + 8 * f[i + 1] - f[i + 2]) / (12 * dx);
        let key = null, run = null;
        let st = null;
        v.render(() => {
          const col = phaseLUT(v), P = make(), k = ks.value;
          // p̂ψ = −i(ψ_r' + iψ_i') = ψ_i' − iψ_r'
          const pr = new Float64Array(n), pi = new Float64Array(n);
          for (let i = 2; i < n - 2; i++) { pr[i] = deriv(P.im, i); pi[i] = -deriv(P.re, i); }
          let amax = 0; for (let i = 0; i < n; i++) if (Math.abs(x[i]) < 10) amax = Math.max(amax, Math.hypot(P.re[i], P.im[i]));
          const sc = 1 / amax, sre = P.re.map((r) => r * sc), sim = P.im.map((q) => q * sc), dre = pr.map((r) => r * sc), dim = pi.map((q) => q * sc);
          drawPsi(sP, x, sre, sim, { col });
          phaseWheel(sP, col, sP.W - 32, 38, 11);
          let dmax = 0.5; for (let i = 0; i < n; i++) if (Math.abs(x[i]) < 10) dmax = Math.max(dmax, Math.hypot(dre[i], dim[i]));
          sD.setView([-10, 10], [-0.08 * dmax * 1.15, dmax * 1.15]);
          drawPsi(sD, x, dre, dim, { col });
          sD.path(Array.from(x, (X, i) => [X, Math.abs(k) * Math.hypot(sre[i], sim[i])]), { color: 'ink', width: 1.4, dash: [5, 4] });
          // ratio
          const R = 2 * Math.abs(k) + 2.5; sR.setView([-10, 10], [-R, R]);
          sR.hline(k, { color: 'green', width: 1.2, dash: [6, 4] }); sR.text('ħk₀', -9.8, k, { color: 'green', size: 11, dy: -8 });
          sR.hline(0, { color: 'faint' });
          const rr = [], ri = [];
          for (let i = 2; i < n - 2; i++) {
            if (Math.abs(x[i]) > 10.2) { continue; }
            const a2 = P.re[i] ** 2 + P.im[i] ** 2;
            if (a2 < (1e-4 * amax) ** 2) { rr.push(null); ri.push(null); continue; }
            const wr = (pr[i] * P.re[i] + pi[i] * P.im[i]) / a2, wi = (pi[i] * P.re[i] - pr[i] * P.im[i]) / a2;
            rr.push(Math.abs(wr) < 3 * R ? [x[i], wr] : null); ri.push(Math.abs(wi) < 3 * R ? [x[i], wi] : null);
          }
          sR.clip(() => { sR.path(ri, { color: 'purple', width: 1.8, dash: [5, 3] }); sR.path(rr, { color: 'accent', width: 2.4 }); });
          // expectation ⟨p⟩ and the simulation
          const m = moments(x, P.re, P.im);
          let dev = 0; for (let i = 2; i < n - 2; i++) if (Math.abs(x[i]) < 10) dev = Math.max(dev, Math.hypot(pr[i] - m.mp * P.re[i], pi[i] - m.mp * P.im[i]) * sc);
          const kk = `${kind.value}|${k}`;
          if (kk !== key) {
            key = kk; const re = Float64Array.from(P.re), im = Float64Array.from(P.im), Vz = new Float64Array(n), ts = [0], xs = [m.mx];
            for (let s = 1; s <= TM / DT; s++) { M.crankNicolson1D(re, im, Vz, dx, DT); if (s % 8 === 0) { ts.push(s * DT); xs.push(moments(x, re, im).mx); } }
            const fit = M.linreg(ts, xs); run = { ts, xs, slope: fit.slope };
          }
          const yr = Math.max(4, Math.abs(m.mp) * TM * 1.15); sX.setView([0, TM], [-yr, yr]);
          sX.fn((t) => m.mx + m.mp * t, { color: 'green', width: 2.2 });
          sX.dots(run.ts.map((t, i) => [t, run.xs[i]]), { r: 3.2, color: 'accent' });
          st = { mp: m.mp, k, slope: run.slope, dev, kind: kind.value };
        });
        v.legend([['accent', 'Re(p̂ψ/ψ): phase gradient'], ['purple', 'Im(p̂ψ/ψ): envelope slope', { dash: true }], ['ink', '|ħk₀ ψ| for comparison', { dash: true }], ['green', '⟨x⟩₀ + ⟨p⟩t/m']]);
        v.readout(() => st && `$\\langle p\\rangle = \\int\\bar\\psi(-i\\hbar\\psi')dx = ${fz(v, st.mp, 4)}\\,\\hbar$ (with $\\hbar k_0 = ${v.fix(st.k, 2)}\\,\\hbar$) · eigen-test: largest $|\\hat p\\psi-\\langle p\\rangle\\psi|$ on screen ${v.fix(st.dev, 3)} (peak of $\\psi$ = 1)${st.dev < 0.05 ? ' — nearly an eigenfunction' : ''} · simulation: $d\\langle x\\rangle/dt = ${fz(v, st.slope, 4)}$ vs $\\langle p\\rangle/m = ${fz(v, st.mp, 4)}$${Math.abs(st.mp) > 0.05 ? ` (${v.fix(100 * Math.abs(st.slope / st.mp - 1), 2)} %: grid and time-step error)` : ''}${st.kind === 'real' ? ' — a real ψ has ⟨p⟩ = 0 even though it is made of momenta ±ħk₀' : ''}.`);
      },
    },
  ],
};
