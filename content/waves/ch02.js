// Waves & Optics — Chapter 2: Standing waves and Fourier analysis
import { TAU, sineCoeffs, diverging, wall } from './ch02.shared.js';

/** Mix two RGB triples (arrays) for a position-coloured scatter. */
const mixRGB = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

export default {
  collection: 'waves',
  chapter: 2,
  title: 'Standing waves and Fourier analysis',
  summary: String.raw`Boundaries select standing waves with discrete frequencies — the normal modes of strings, membranes and boxes — and any initial shape is a sum of them, with energy shared out mode by mode. Counting modes in a box gives a density of states growing like $\omega^2$, which will reappear in blackbody radiation and solids. A pulse is a continuous superposition, described by its Fourier transform, and a short pulse necessarily contains a wide band of frequencies.`,
  items: [
    // ------------------------------------------------------------------ 2.1
    {
      num: '2.1',
      kind: 'Model',
      name: 'Standing waves on a fixed string',
      statement: String.raw`Two harmonic waves of equal amplitude $A$ and wavelength $\lambda$ running in opposite directions add up to
$$A\sin(kx-\omega t)+A\sin(kx+\omega t)=2A\sin(kx)\cos(\omega t),\qquad \omega=ck,$$
a **standing wave**: every point of the string oscillates in time as $\cos\omega t$, with an amplitude $2A\,|\sin kx|$ that depends on position. The points where $\sin kx=0$ never move (**nodes**), half a wavelength apart. If the string is also held fixed at $x=0$ and $x=L$, the pattern must vanish at both ends, which allows only
$$kL=n\pi\quad\Longleftrightarrow\quad \lambda_n=\frac{2L}{n},\qquad f_n=\frac{n\,c}{2L},\qquad n=1,2,3,\dots$$
Any other wavelength can exist on an infinitely long string but not between two fixed ends.`,
      idea: String.raw`Superposition (1.6) lets the right-moving and left-moving waves of d'Alembert's solution (1.3) coexist, and a sum of $\sin(kx-\omega t)$ and $\sin(kx+\omega t)$ factorises by the product-to-sum identity into a function of $x$ times a function of $t$. A fixed end forces the displacement to be zero at every instant, which is possible for the standing pattern only if a node falls exactly on it; with both ends fixed the node spacing $\lambda/2$ has to fit a whole number of times into $L$. Physically, the wave reflects off each fixed end with inverted sign, and the reflected waves only reinforce each other when a round trip $2L$ is a whole number of wavelengths.`,
      caption: String.raw`The blue string is the sum of the orange right-moving wave and the purple left-moving wave, each of amplitude $A$. Set $2L/\lambda$ (the number of half-wavelengths on the string): green dots are nodes and never move, gold dots are antinodes. Below, the end amplitude $|\sin kL|$ is plotted against $2L/\lambda$. Switch off *right end fixed* and drag to a non-integer value: the wave pattern is still a standing wave on the infinite line, but the right end (red) swings, so the wall at $x=L$ would not be possible. Time is slowed so that the fundamental takes 4 s per cycle.`,
      deps: ['waves-1.3', 'waves-1.6', 'mech-11.9', 'pde-4.2'],
      see: ['music-2.2', 'music-2.3', 'pde-4.1'],
      refs: ['Crawford ch. 2'],
      tags: ['standing waves', 'boundary conditions'],
      scope: String.raw`Ideal non-dispersive string with fixed ends and small slopes; real strings have stiffness and damping, which shift the frequencies slightly and make the nodes imperfect.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Standing_wave' },
      viz(v) {
        const A = 0.5;
        const qS = v.slider('half-wavelengths on the string, $2L/\\lambda$', 0.5, 8.5, 3, { step: 0.01 });
        const fixed = v.toggle('right end fixed (only allowed wavelengths)', true);
        const parts = v.toggle('show the two travelling waves', true);
        const s = v.stage({ x: [0, 1], y: [-1.25, 1.25], axes: 'box', gutter: true, xlabel: 'x / L', yticks: [], height: 270, full: true });
        const e = v.stage({ x: [0.5, 8.5], y: [0, 1.2], axes: 'box', gutter: true, xlabel: '2L/λ', ylabel: '|sin kL| (amplitude at the right end)', height: 190, xticks: [1, 2, 3, 4, 5, 6, 7, 8] });
        const h = e.handle(3, 0, {
          color: 'gold', r: 7, label: 'drag',
          constrain: (x) => { let xx = v.M.clamp(x, 0.5, 8.5); if (fixed.value) xx = Math.max(1, Math.round(xx)); return [xx, Math.abs(Math.sin(Math.PI * xx))]; },
        });
        h.onDrag = () => { qS.set(fixed.value ? Math.round(h.x) : h.x); };
        let q = 3, ph = 0;
        v.animate((t) => {
          if (fixed.value && Math.abs(qS.value - Math.round(qS.value)) > 1e-9) qS.set(Math.max(1, Math.round(qS.value)));
          q = qS.value;
          const k = Math.PI * q; ph = TAU * 0.25 * q * t;
          h.set(q, Math.abs(Math.sin(k)));
          s.hline(0, { color: 'faint', width: 1 });
          wall(s, 0, -0.9, 0.9, -1);
          if (fixed.value) wall(s, 1, -0.9, 0.9, 1);
          s.fn((x) => 2 * A * Math.abs(Math.sin(k * x)), { color: 'muted', width: 1, dash: [4, 4] });
          s.fn((x) => -2 * A * Math.abs(Math.sin(k * x)), { color: 'muted', width: 1, dash: [4, 4] });
          if (parts.value) {
            s.fn((x) => A * Math.sin(k * x - ph), { color: 'orange', width: 1.8 });
            s.fn((x) => A * Math.sin(k * x + ph), { color: 'purple', width: 1.8 });
          }
          s.fn((x) => 2 * A * Math.sin(k * x) * Math.cos(ph), { color: 'accent', width: 3.4 });
          for (let j = 0; j / q <= 1 + 1e-9; j++) s.dot(j / q, 0, { r: 5, color: 'green', label: j === 1 ? 'node' : undefined, labelPos: 'n' });
          for (let j = 0; (j + 0.5) / q < 1; j++) { const xa = (j + 0.5) / q; s.dot(xa, 2 * A * Math.sin(k * xa) * Math.cos(ph), { r: 4.5, color: 'gold' }); }
          const endAmp = Math.abs(Math.sin(k));
          if (!fixed.value || endAmp > 1e-6) s.dot(1, 2 * A * Math.sin(k) * Math.cos(ph), { r: 6, color: endAmp > 0.02 ? 'red' : 'green', hollow: true, width: 2 });
          s.corner(`λ = 2L/${v.fix(q, fixed.value ? 0 : 2)}`, 'tr', { color: 'ink', weight: 600 });
          // end amplitude plot
          e.fn((x) => Math.abs(Math.sin(Math.PI * x)), { color: 'accent', width: 2.4 });
          for (let n = 1; n <= 8; n++) e.dot(n, 0, { r: 5, color: 'green' });
          e.vline(q, { color: 'gold', width: 1.4, alpha: 0.7 });
          e.text('green dots: allowed, 2L/λ = n', 8.4, 1.1, { color: 'green', size: 12, align: 'right' });
        }, { still: 0.55 });
        v.legend([['orange', 'right-moving $A\\sin(kx-\\omega t)$'], ['purple', 'left-moving $A\\sin(kx+\\omega t)$'], ['accent', 'sum: standing wave'], ['green', 'nodes'], ['gold', 'antinodes']]);
        v.readout(() => {
          const k = Math.PI * q, endA = 2 * A * Math.abs(Math.sin(k));
          return `$\\lambda=2L/${v.fix(q, 2)}=${v.fix(2 / q, 3)}\\,L$ · $f=${v.fix(q / 2, 2)}\\,c/L$ ($=${v.fix(q, 2)}\\,f_1$) · nodes strictly inside the string: ${Math.max(0, Math.ceil(q - 1e-9) - 1)} · amplitude at $x=L$: $2A|\\sin kL|=${v.fix(endA, 3)}$ (maximum possible $2A=${v.fix(2 * A, 1)}$) · ${endA < 1e-6 ? 'both ends are nodes: the fixed-end condition holds' : 'the right end is not a node: a fixed wall there is impossible'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.2
    {
      num: '2.2',
      kind: 'Definition',
      name: 'Normal modes, nodes and antinodes',
      statement: String.raw`A **normal mode** of a vibrating system is a motion in which every point oscillates at the same single frequency with a fixed relative amplitude and phase, so that the shape keeps its form and only its size changes:
$$u(x,t)=\varphi(x)\,\cos(\omega t+\delta).$$
For the fixed string of length $L$ the mode shapes are $\varphi_n(x)=\sin(n\pi x/L)$ with $\omega_n=n\pi c/L$. A point where $\varphi=0$ is a **node** (it never moves); a point where $|\varphi|$ is largest is an **antinode**. Mode $n$ has $n-1$ nodes strictly inside the string and $n$ antinodes. A general motion is not a normal mode; it is a combination of several, each with its own frequency.`,
      idea: String.raw`Substituting $u=\varphi(x)T(t)$ into the wave equation separates it into $T''/T=c^2\varphi''/\varphi=-\omega^2$: the shape obeys $\varphi''=-(\omega/c)^2\varphi$ and the boundary conditions $\varphi(0)=\varphi(L)=0$ pick out the sines. Mechanically it is the continuum version of the normal modes of coupled oscillators (mech-11.4): the configuration in which every degree of freedom moves in step. A combination of modes with different frequencies has no fixed shape because its components drift out of phase.`,
      caption: String.raw`Choose a mode number and the string moves with every point in phase, nodes (green) fixed and antinodes (gold) swinging. The scatter plot on the right shows each of 41 sample points as a dot with coordinates (initial displacement, displacement now), coloured by position: for a mode all dots stay on one straight line through the origin, because the shape is just rescaled. Switch to two modes or a random shape and the dots fall off any line: the shape changes form. The readout measures how far the string is from the nearest rescaled copy of its initial shape.`,
      deps: ['waves-2.1', 'mech-11.4', 'ode-4.13'],
      see: ['music-2.3', 'pde-4.1'],
      refs: ['Crawford ch. 2'],
      tags: ['normal modes', 'nodes'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Normal_mode' },
      viz(v) {
        const M = v.M, NP = 41, KM = 9;
        const kind = v.select('motion', [{ value: 'mode', label: 'one mode' }, { value: 'two', label: 'two modes' }, { value: 'rand', label: 'random shape' }], 'mode');
        const nS = v.slider('mode number $n$', 1, 8, 3, { int: true });
        let seed = 5;
        const nb = v.button('new random shape', () => { seed++; });
        const s = v.stage({ x: [0, 1], y: [-1.4, 1.4], axes: 'box', gutter: true, xlabel: 'x / L', yticks: [], height: 280, weight: 2, minWidth: 340 });
        const sc = v.stage({ x: [-1.2, 1.2], y: [-1.2, 1.2], equal: true, axes: true, height: 280, xlabel: 'u(x, 0)', ylabel: 'u(x, t)', title: 'each point: before and now', minWidth: 260 });
        const coefs = () => {
          const a = new Float64Array(KM + 2), n = nS.value;
          if (kind.value === 'mode') a[n] = 1;
          else if (kind.value === 'two') { a[n] = 1; a[Math.min(KM, n + 1)] += 0.8; }
          else { const r = v.rng(seed); for (let k = 1; k <= 6; k++) a[k] = r.normal() / Math.sqrt(k); }
          return a;
        };
        const W1 = TAU * 0.25;
        const uAt = (a, x, t) => { let u = 0; for (let k = 1; k <= KM; k++) if (a[k]) u += a[k] * Math.sin(k * Math.PI * x) * Math.cos(k * W1 * t); return u; };
        let dev = 0, sbest = 1, tt = 0, a = coefs(), norm = 1;
        v.animate((t) => {
          a = coefs(); tt = t; nb.hidden = kind.value !== 'rand'; nS.el.hidden = kind.value === 'rand';
          norm = 0; for (let i = 0; i < 200; i++) norm = Math.max(norm, Math.abs(uAt(a, i / 199, 0))); norm = norm || 1;
          const f = (x, tm) => uAt(a, x, tm) / norm;
          s.hline(0, { color: 'faint', width: 1 }); wall(s, 0, -1, 1, -1); wall(s, 1, -1, 1, 1);
          s.fn((x) => f(x, 0), { color: 'muted', width: 1.4, dash: [5, 4] });
          s.fn((x) => f(x, t), { color: 'accent', width: 3.4 });
          if (kind.value === 'mode') {
            const n = nS.value;
            for (let j = 1; j < n; j++) s.dot(j / n, 0, { r: 5, color: 'green', label: j === 1 ? 'node' : undefined, labelPos: 'n' });
            for (let j = 1; j <= n; j++) { const xa = (j - 0.5) / n; s.dot(xa, f(xa, t), { r: 4.5, color: 'gold', label: j === 1 ? 'antinode' : undefined, labelPos: f(xa, t) >= 0 ? 'n' : 's' }); }
          }
          // scatter: u(x_i, t) against u(x_i, 0)
          let num = 0, den = 0, e2 = 0;
          const U0 = [], U1 = [];
          for (let i = 1; i < NP - 1; i++) { const x = i / (NP - 1); U0.push(f(x, 0)); U1.push(f(x, t)); }
          for (let i = 0; i < U0.length; i++) { num += U0[i] * U1[i]; den += U0[i] * U0[i]; }
          sbest = num / den;
          for (let i = 0; i < U0.length; i++) { e2 += (U1[i] - sbest * U0[i]) ** 2; }
          dev = Math.sqrt(e2 / den);
          sc.line(-1.1, -1.1 * sbest, 1.1, 1.1 * sbest, { color: 'green', width: 1.6, dash: [5, 4] });
          const c0 = v.rgb('blue'), c1 = v.rgb('orange');
          for (let i = 0; i < U0.length; i++) sc.dot(U0[i], U1[i], { r: 3.6, color: mixRGB(c0, c1, i / (U0.length - 1)) });
        }, { still: 0.55 });
        v.legend([['muted', 'initial shape', { dash: true }], ['accent', 'string now'], ['green', 'nodes / best rescaling', { dash: true }]]);
        v.readout(() => {
          const n = nS.value;
          const lead = kind.value === 'mode' ? `mode ${n}: $\\omega_${n}=${n}\\,\\omega_1$, ${n - 1} node${n === 2 ? '' : 's'} inside, ${n} antinode${n === 1 ? '' : 's'}` : kind.value === 'two' ? `modes ${n} and ${Math.min(KM, n + 1)} together: two frequencies, so no fixed shape` : 'six modes with random amplitudes and different frequencies';
          return `${lead} · $t=${v.fix(tt, 2)}$ s (slowed) · best rescaling factor $${v.fix(sbest, 3)}$ (for a mode it is $\\cos\\omega t=${v.fix(Math.cos(n * W1 * tt), 3)}$) · distance from a rescaled copy of the initial shape: $${v.fix(100 * dev, 2)}\\,\\%$ ${dev < 1e-9 ? '(a normal mode keeps its shape exactly)' : '(not a normal mode)'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.3
    {
      num: '2.3',
      kind: 'Theorem',
      name: 'Any shape is a sum of modes',
      statement: String.raw`Let the string $0\le x\le L$ be fixed at both ends and released from rest with an initial shape $u_0(x)$ that is continuous, piecewise smooth and vanishes at the ends. Then the motion is
$$u(x,t)=\sum_{n=1}^\infty b_n\,\sin\frac{n\pi x}{L}\,\cos\frac{n\pi c\,t}{L},\qquad b_n=\frac2L\int_0^L u_0(x)\sin\frac{n\pi x}{L}\,dx,$$
and the sine series converges to $u_0$. More generally an initial velocity $v_0$ adds $\sum_n \dfrac{d_n}{\omega_n}\sin\dfrac{n\pi x}{L}\sin\omega_nt$ with $d_n$ the sine coefficients of $v_0$. For a shape with jumps the series still converges in mean square, but not uniformly (overshoot near the jumps: the Gibbs phenomenon, 2.5).`,
      idea: String.raw`The mode shapes $\sin(n\pi x/L)$ are orthogonal on $[0,L]$, which is what makes the coefficient formula work, and they are complete: this is the theory of Fourier series (pma-8.14, pma-8.16) applied to the odd extension of $u_0$. Each term $\sin(n\pi x/L)\cos(\omega_nt)$ solves the wave equation and the boundary conditions, and the equation is linear, so the sum does too; its value at $t=0$ is the Fourier series of $u_0$ and its velocity at $t=0$ is zero. Separation of variables (pde-4.1) is the systematic way to find such solutions.`,
      caption: String.raw`**Draw** an initial shape by dragging across the small panel on the left (or pick a preset). The bars are its sine coefficients $b_n$; the gold ones are used in the sum. Left: the sum of the first $N$ modes against the shape. Top: the motion, with each mode advancing at its own frequency $n\pi c/L$ (blue, $N$ modes) and an independent finite-difference simulation of $u_{tt}=c^2u_{xx}$ (gold) for the same initial shape. With few modes a pluck is rounded; with many, the two motions coincide, and the string returns to its starting shape every $2L/c$. Try the square preset to see the overshoot at a jump.`,
      deps: ['waves-2.2', 'pma-8.14', 'pma-8.16', 'pde-4.1'],
      see: ['sig-4.1', 'pde-4.2', 'music-2.3'],
      refs: ['Crawford ch. 2', 'Hecht ch. 7'],
      tags: ['fourier series', 'normal modes', 'superposition'],
      credit: 'Daniel Bernoulli (superposition of modes), 1753; Joseph Fourier (coefficients and series), 1807–1822',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Fourier_series' },
      viz(v) {
        const M = v.M, K = 480, NMAX = 60, NSHOW = 30;
        const u0 = new Float64Array(K + 1);
        let b = new Float64Array(NMAX + 1), snaps = null, drawn = false;
        const preset = (name) => {
          for (let i = 0; i <= K; i++) {
            const x = i / K;
            u0[i] = name === 'pluck' ? (x < 0.3 ? x / 0.3 : (1 - x) / 0.7) : name === 'bump' ? Math.exp(-(((x - 0.5) / 0.1) ** 2)) : name === 'square' ? (x > 0.2 && x < 0.8 ? 0.8 : 0) : name === 'ramp' ? 0.9 * x : u0[i];
          }
          u0[0] = u0[K] = 0;
        };
        const fdRun = () => {
          const h = 1 / K, dt = 0.5 * h, r2 = 0.25, n = K + 1, every = Math.round(0.01 / dt);
          let a = Float64Array.from(u0), bb = new Float64Array(n), c = new Float64Array(n);
          for (let i = 1; i < n - 1; i++) bb[i] = a[i] + 0.5 * r2 * (a[i + 1] - 2 * a[i] + a[i - 1]);
          snaps = [Float64Array.from(a)];
          for (let st = 1; st <= Math.round(2 / dt); st++) {
            for (let i = 1; i < n - 1; i++) c[i] = 2 * bb[i] - a[i] + r2 * (bb[i + 1] - 2 * bb[i] + bb[i - 1]);
            if (st % every === 0) snaps.push(Float64Array.from(bb));
            [a, bb, c] = [bb, c, a];
          }
        };
        const refresh = (full) => { b = sineCoeffs(u0, NMAX); if (full) fdRun(); else snaps = null; };
        const pre = v.select('initial shape', [{ value: 'pluck', label: 'pluck' }, { value: 'bump', label: 'bump' }, { value: 'square', label: 'square' }, { value: 'ramp', label: 'ramp' }, { value: 'drawn', label: 'drawn' }], 'pluck', {
          onChange: (val) => { if (val !== 'drawn') { preset(val); drawn = false; refresh(true); } },
        });
        const nS = v.slider('modes used $N$', 1, NMAX, 5, { int: true });
        preset('pluck'); refresh(true);
        const s = v.stage({ x: [0, 1], y: [-1.15, 1.15], axes: 'box', gutter: true, xlabel: 'x / L', yticks: [], height: 240, full: true, title: 'the motion (time slowed 2×)' });
        const sp = v.stage({ x: [0, 1], y: [-0.4, 1.3], axes: 'box', gutter: true, xlabel: 'x / L', yticks: [], height: 230, title: 'draw here: initial shape and its N-mode sum' });
        const bs = v.stage({ x: [0.4, NSHOW + 0.6], y: [-1, 1], axes: 'box', gutter: true, xlabel: 'mode number n', ylabel: 'bₙ', height: 230, title: 'sine coefficients' });
        let last = null;
        sp.onDrag((x, y, phase) => {
          if (phase === 'start') { pre.set('drawn'); v.pause(); last = null; drawn = true; }
          const yy = M.clamp(y, -0.35, 1.25), i = Math.round(M.clamp(x * K, 0, K));
          if (!last) last = [i, yy];
          const [i1, y1] = last, lo = Math.min(i1, i), hi = Math.max(i1, i);
          for (let j = lo; j <= hi; j++) u0[j] = hi === lo ? yy : y1 + ((yy - y1) * (j - i1)) / (i - i1);
          u0[0] = 0; u0[K] = 0; last = [i, yy];
          if (phase === 'end') { for (let p = 0; p < 2; p++) { const c = Float64Array.from(u0); for (let j = 1; j < K; j++) u0[j] = (c[j - 1] + 2 * c[j] + c[j + 1]) / 4; } refresh(true); last = null; v.restart(); v.play(); }
          else refresh(false);
        });
        const lerpArr = (arr, x) => { const u = M.clamp(x, 0, 1) * K, i = Math.min(K - 1, Math.floor(u)), f = u - i; return arr[i] + (arr[i + 1] - arr[i]) * f; };
        const modal = (x, tau, N) => { let u = 0; for (let n = 1; n <= N; n++) u += b[n] * Math.sin(n * Math.PI * x) * Math.cos(n * Math.PI * tau); return u; };
        const fdAt = (x, tau) => { if (!snaps) return NaN; const j = Math.min(snaps.length - 2, Math.floor(tau / 0.01)), f = tau / 0.01 - j; return lerpArr(snaps[j], x) * (1 - f) + lerpArr(snaps[j + 1], x) * f; };
        let tau = 0, errMotion = 0, errNow = 0, cap = 0, e0 = 0;
        v.animate((t) => {
          const N = nS.value;
          tau = (t / 2) % 2;
          // the motion
          s.hline(0, { color: 'faint', width: 1 }); wall(s, 0, -0.8, 0.8, -1, 0.012); wall(s, 1, -0.8, 0.8, 1, 0.012);
          s.fn((x) => lerpArr(u0, x), { color: 'muted', width: 1.2, dash: [4, 4], n: 300 });
          if (snaps) s.fn((x) => fdAt(x, tau), { color: 'gold', width: 2.2, n: 300 });
          s.fn((x) => modal(x, tau, N), { color: 'accent', width: 3, n: 300 });
          s.corner(`t = ${v.fix(tau, 2)} L/c`, 'tl', { color: 'ink', weight: 600 });
          errMotion = 0; if (snaps) for (let i = 0; i <= 60; i++) { const x = i / 60; errMotion = Math.max(errMotion, Math.abs(modal(x, tau, NMAX) - fdAt(x, tau))); }
          // t = 0 picture
          sp.hline(0, { color: 'faint', width: 1 });
          sp.fn((x) => lerpArr(u0, x), { color: 'muted', width: 2, dash: [5, 4], n: 300 });
          sp.fn((x) => modal(x, 0, N), { color: 'gold', width: 2.6, n: 300 });
          let e2 = 0, n2 = 0; for (let i = 0; i <= 240; i++) { const x = i / 240, d = modal(x, 0, N) - lerpArr(u0, x); e2 += d * d; n2 += lerpArr(u0, x) ** 2; }
          errNow = Math.sqrt(e2 / Math.max(n2, 1e-12));
          cap = 0; for (let n = 1; n <= N; n++) cap += b[n] * b[n] / 2; e0 = 0; for (let i = 0; i < K; i++) e0 += 0.5 * (u0[i] ** 2 + u0[i + 1] ** 2) / K;
          // coefficients
          let bm = 0.05; for (let n = 1; n <= NSHOW; n++) bm = Math.max(bm, Math.abs(b[n]));
          bs.setView([0.4, NSHOW + 0.6], [-1.15 * bm, 1.15 * bm]);
          bs.bars(Array.from({ length: NSHOW }, (_, i) => b[i + 1]), { x0: 1, dx: 1, color: (val, i) => (i + 1 <= N ? 'gold' : 'muted') });
        }, { period: 4, still: 0.9 });
        v.legend([['muted', 'initial shape $u_0$', { dash: true }], ['accent', '$N$-mode motion'], ['gold', 'independent simulation (top), $N$-mode sum at $t=0$ (left)']]);
        v.readout(() => `$N=${nS.value}$ modes: rms error of the partial sum at $t=0$ is $${v.fix(100 * errNow, 2)}\\,\\%$ of the rms of $u_0$ · share of $\\int u_0^2$ carried by those modes: $\\tfrac12\\sum_{n\\le N}b_n^2\\big/\\int u_0^2=${v.fix((100 * cap) / Math.max(e0, 1e-12), 2)}\\,\\%$ (Parseval; $\\to100\\,\\%$) · largest gap between the 60-mode solution and the independent simulation at this instant: $${v.fix(errMotion, 4)}$ (units of the shape height)`);
      },
    },
    // ------------------------------------------------------------------ 2.4
    {
      num: '2.4',
      kind: 'Theorem',
      name: 'Energy is shared mode by mode',
      statement: String.raw`For a string of length $L$, tension $T$ and density $\mu$ fixed at both ends and vibrating in small oscillations, write $u(x,t)=\sum_n a_n(t)\sin(n\pi x/L)$. Then the total energy splits into independent contributions of the modes,
$$E=\sum_{n}E_n,\qquad E_n=\frac{\mu L}{4}\Big(\dot a_n^{\,2}+\omega_n^2a_n^2\Big)=\frac{\mu L}{4}\,\omega_n^2A_n^2,$$
where $A_n$ is the amplitude of mode $n$, and every $E_n$ is **separately constant** in time: kinetic and potential energy trade within a mode, but none passes from one mode to another. For a string plucked at a point, $E_n\propto \sin^2(n\pi x_0/L)/n^2$.`,
      idea: String.raw`Kinetic energy is $\tfrac12\mu\int u_t^2\,dx$ and potential energy (from stretching, 1.7) is $\tfrac12T\int u_x^2\,dx$. Substituting the mode expansion, the orthogonality of $\sin(n\pi x/L)$ and of $\cos(n\pi x/L)$ on $[0,L]$ kills every cross term, leaving a sum of independent harmonic oscillators with energies $E_n$. Each oscillator conserves its own energy because the modes do not couple in a linear system (2.2). The picture is the same one used for the energy of coupled oscillators in mechanics: normal coordinates diagonalise the energy. Real nonlinearity couples the modes and lets them exchange energy, as in the famous Fermi–Pasta–Ulam–Tsingou computation.`,
      caption: String.raw`A chain of 32 beads, a discretised string with fixed ends (its modes are exact discrete sines, with slightly lower frequencies for high $n$). Pluck it or start it in mode 1. The bars give the energy $E_k$ of each mode and the lines below follow $E_1,\dots,E_5$ and the rest as time passes: with the nonlinearity $\beta=0$ they are perfectly flat and their sum is the total energy. Raise $\beta$ (a cubic stiffening of every spring) and the mode energies start to leak into each other, the total staying constant. For $\beta>0$ started in mode 1, energy flows into modes 3 and 5 and comes back, the recurrence that surprised Fermi, Pasta, Ulam and Tsingou in 1955.`,
      deps: ['waves-2.3', 'waves-1.7'],
      see: ['mech-11.6', 'mech-11.4'],
      refs: ['Crawford ch. 2'],
      tags: ['energy', 'normal modes', 'nonlinearity'],
      credit: 'Energy bookkeeping of modes: standard; the nonlinear chain: Fermi, Pasta, Ulam and Tsingou, 1955',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Fermi%E2%80%93Pasta%E2%80%93Ulam%E2%80%93Tsingou_problem' },
      viz(v) {
        const N = 32, DT = 0.05, TW = 1500, SPEED = 150, NB = 10;
        const init = v.select('start from', [{ value: 'pluck', label: 'a pluck' }, { value: 'mode1', label: 'mode 1' }], 'pluck');
        const aS = v.slider('peak displacement', 0.5, 4, 3, { step: 0.1 });
        const bS = v.slider('nonlinearity $\\beta$', 0, 1.5, 0, { step: 0.01 });
        const s = v.stage({ x: [0, 1], y: [-4.6, 4.6], axes: 'box', gutter: true, xlabel: 'x / L', yticks: [], height: 190, full: true, title: 'the chain (displacements to scale in units of the bead spacing)' });
        const bst = v.stage({ x: [0.4, NB + 0.6], y: [0, 1], axes: 'box', gutter: true, xlabel: 'mode number k', ylabel: 'energy Eₖ', height: 230, title: 'energy in each mode', minWidth: 300 });
        const hs = v.stage({ x: [0, TW], y: [0, 1], axes: 'box', gutter: true, xlabel: 'time (in units of 1/ω_max)', ylabel: 'energy', height: 230, title: 'mode energies against time', minWidth: 360 });
        const sinK = (k) => Float64Array.from({ length: N + 2 }, (_, i) => Math.sqrt(2 / (N + 1)) * Math.sin((i * k * Math.PI) / (N + 1)));
        const SK = Array.from({ length: N + 1 }, (_, k) => (k ? sinK(k) : null));
        const wk = (k) => 2 * Math.sin((k * Math.PI) / (2 * (N + 1)));
        let S = null, key = '', t0 = 0, lastT = 0;
        const keyOf = () => `${init.value}|${aS.value}|${bS.value}`;
        const fresh = () => {
          const y = new Float64Array(N + 2), p = new Float64Array(N + 2), a = new Float64Array(N + 2), amp = aS.value;
          for (let i = 1; i <= N; i++) y[i] = init.value === 'pluck' ? amp * (i <= 8 ? i / 8 : (N + 1 - i) / (N + 1 - 8)) : amp * Math.sin((Math.PI * i) / (N + 1));
          S = { y, p, a, time: 0, T: [], E: Array.from({ length: 7 }, () => []), nextSample: 0 };
          acc();
        };
        const acc = () => {
          const { y, a } = S, b = bS.value;
          for (let i = 1; i <= N; i++) { const d1 = y[i + 1] - y[i], d0 = y[i] - y[i - 1]; a[i] = d1 - d0 + b * (d1 ** 3 - d0 ** 3); }
        };
        const energies = () => {
          const { y, p } = S, E = new Float64Array(N + 1);
          for (let k = 1; k <= N; k++) { let A = 0, P = 0; const sk = SK[k]; for (let i = 1; i <= N; i++) { A += sk[i] * y[i]; P += sk[i] * p[i]; } E[k] = 0.5 * (P * P + wk(k) ** 2 * A * A); }
          return E;
        };
        const stepTo = (target) => {
          let guard = 0;
          while (S.time + DT <= target && guard++ < 80000) {
            const { y, p, a } = S;
            for (let i = 1; i <= N; i++) p[i] += 0.5 * DT * a[i];
            for (let i = 1; i <= N; i++) y[i] += DT * p[i];
            acc();
            for (let i = 1; i <= N; i++) p[i] += 0.5 * DT * a[i];
            S.time += DT;
            if (S.time >= S.nextSample) {
              const E = energies(); S.T.push(S.time);
              let rest = 0; for (let k = 6; k <= N; k++) rest += E[k];
              for (let k = 1; k <= 5; k++) S.E[k - 1].push(E[k]);
              S.E[5].push(rest); S.E[6].push(E.reduce((u, w) => u + w, 0));
              S.nextSample += 3;
            }
          }
        };
        const col = ['accent', 'orange', 'green', 'purple', 'teal'];
        let Ecur = null, Htot = 0, H2 = 0, quartic = 0, drift = [0, 0, 0];
        v.animate((t) => {
          if (S === null) { key = keyOf(); fresh(); t0 = 0; }
          else if (t < lastT) { key = keyOf(); fresh(); t0 = 0; }
          else if (keyOf() !== key) { key = keyOf(); fresh(); t0 = t; }
          lastT = t;
          stepTo(SPEED * (t - t0));
          const { y, p } = S, b = bS.value;
          Ecur = energies();
          H2 = 0; quartic = 0; Htot = 0;
          for (let i = 1; i <= N; i++) { H2 += 0.5 * p[i] * p[i]; }
          for (let i = 0; i <= N; i++) { const d = y[i + 1] - y[i]; H2 += 0.5 * d * d; quartic += 0.25 * b * d ** 4; }
          Htot = H2 + quartic;
          const sumE = Ecur.reduce((u, w) => u + w, 0);
          // chain
          s.hline(0, { color: 'faint', width: 1 });
          const pts = Array.from({ length: N + 2 }, (_, i) => [i / (N + 1), y[i]]);
          s.path(pts, { color: 'accent', width: 1.6, alpha: 0.8 });
          s.dots(pts.slice(1, N + 1), { r: 3.4, color: 'accent' });
          s.dot(0, 0, { r: 4, color: 'muted' }); s.dot(1, 0, { r: 4, color: 'muted' });
          // bars
          const vals = Array.from({ length: NB }, (_, i) => Ecur[i + 1]);
          const top = Math.max(1e-6, ...(S.E[6].length ? [S.E[6][0]] : [sumE]));
          bst.setView([0.4, NB + 0.6], [0, 1.08 * Math.max(1e-6, S.E[6][0] || sumE) * 0.8]);
          bst.bars(vals, { x0: 1, dx: 1, color: (val, i) => (i < 5 ? col[i] : 'muted') });
          bst.corner(`total ${v.fix(sumE, 3)}`, 'tr', { color: 'ink', weight: 600 });
          // history
          const E0 = S.E[6][0] || sumE;
          hs.setView([0, TW], [0, 0.82 * E0 * 1.0]);
          const tt = S.T;
          if (tt.length > 1) {
            for (let m = 0; m < 6; m++) hs.path(tt.map((x, i) => [x, S.E[m][i]]), { color: m < 5 ? col[m] : 'muted', width: m < 5 ? 2.2 : 1.6, alpha: m < 5 ? 1 : 0.8 });
            hs.line(0, E0, TW, E0, { color: 'ink', width: 1, dash: [4, 4], alpha: 0.5 });
            hs.text('total of all modes', TW * 0.98, E0 * 0.98, { color: 'ink', size: 11, align: 'right', baseline: 'top' });
          }
          hs.vline(S.time, { color: 'gold', width: 1.3 });
          for (let m = 0; m < 3; m++) { const arr = S.E[m]; if (arr.length > 2) { const mx = Math.max(...arr), mn = Math.min(...arr); drift[m] = (mx - mn) / Math.max(1e-12, (mx + mn) / 2); } }
        }, { period: TW / SPEED, still: 8 });
        v.legend([['accent', 'mode 1'], ['orange', 'mode 2'], ['green', 'mode 3'], ['purple', 'mode 4'], ['teal', 'mode 5'], ['muted', 'modes ≥ 6']]);
        v.readout(() => {
          if (!Ecur) return '';
          const sumE = Ecur.reduce((u, w) => u + w, 0);
          return `time $${v.fix(S.time, 0)}$ · total energy of the chain $H=${v.fix(Htot, 4)}$ · $\\sum_k E_k=${v.fix(sumE, 4)}$ ($=H$ minus the anharmonic part $\\tfrac\\beta4\\sum(\\Delta y)^4=${v.fix(quartic, 4)}$) · spread of $E_1,E_2,E_3$ over the run so far: $${v.fix(100 * drift[0], 1)}\\,\\%$, $${v.fix(100 * drift[1], 1)}\\,\\%$, $${v.fix(100 * drift[2], 1)}\\,\\%$ ${bS.value === 0 ? '(linear: each mode keeps its own energy)' : '(nonlinear: modes exchange energy)'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.6
    {
      num: '2.6',
      kind: 'Model',
      name: 'Modes of a rectangular membrane',
      statement: String.raw`A stretched membrane (tension per unit length $\tau$, mass per unit area $\sigma$, wave speed $c=\sqrt{\tau/\sigma}$) obeys $u_{tt}=c^2(u_{xx}+u_{yy})$. Fixed along the edge of the rectangle $0\le x\le a,\ 0\le y\le b$, it has the normal modes
$$u_{mn}(x,y,t)=\sin\frac{m\pi x}{a}\,\sin\frac{n\pi y}{b}\,\cos\omega_{mn}t,\qquad \omega_{mn}=\pi c\sqrt{\frac{m^2}{a^2}+\frac{n^2}{b^2}},$$
$m,n=1,2,\dots$ The nodal set is a grid of $m-1$ lines parallel to one side and $n-1$ parallel to the other. Different pairs $(m,n)$ can have the same frequency (**degeneracy**): for a square, $(m,n)$ and $(n,m)$ always do, and then every combination $\cos\theta\,u_{mn}+\sin\theta\,u_{nm}$ is also a mode, with curved or diagonal nodal lines.`,
      idea: String.raw`Separation of variables $u=X(x)Y(y)T(t)$ (pde-5.6) splits the two-dimensional wave equation into one-dimensional problems for $X$ and $Y$, each a fixed string whose solutions are sines (2.2), and the eigenvalue of $-\nabla^2$ is the sum $\pi^2(m^2/a^2+n^2/b^2)$. The two directions are independent, so a mode is a product of two string modes. When two different products share the same eigenvalue, the eigenspace is two-dimensional and any combination oscillates at that one frequency, so the nodal lines of a mode are not fixed by the frequency alone; they depend on the combination. Generic aspect ratios have no degeneracies.`,
      caption: String.raw`Pick $m$ and $n$ by sliders or by clicking a point of the lattice (right), and change the aspect ratio $a/b$. Red and blue are the two signs of the displacement and the black curves are nodal lines. The lattice shows each frequency in units of the lowest, $\omega_{11}$, and marks degenerate pairs in green. Press **square** and choose $m\neq n$: a mixing slider appears, and sliding it turns the grid of nodal lines into diagonals and curves while the frequency never changes. Motion is slowed, with relative rates correct.`,
      deps: ['waves-2.2', 'rca-11.3', 'pde-5.6'],
      see: ['music-3.6', 'pde-5.6'],
      refs: ['Crawford ch. 7'],
      tags: ['membrane', 'normal modes', 'degeneracy'],
      scope: String.raw`Ideal membrane with small transverse displacements, uniform tension and fixed edges; the rectangle is the one shape where the modes are products of sines. Real drumheads also feel air loading and stiffness.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Vibration_of_a_circular_membrane' },
      viz(v) {
        const M = v.M, MM = 6;
        const mS = v.slider('$m$ (variations along $x$)', 1, MM, 2, { int: true });
        const nS = v.slider('$n$ (variations along $y$)', 1, MM, 3, { int: true });
        const aS = v.slider('aspect ratio $a/b$', 0.5, 2, 1, { step: 0.01 });
        const sq = v.button('square', () => { aS.set(1); });
        const th = v.slider('mixing angle $\\theta$ with the degenerate partner (°)', 0, 90, 0, { step: 1 });
        const s = v.stage({ x: [0, 1], y: [0, 1], equal: true, axes: false, height: 330, title: 'displacement and nodal lines', weight: 1.4, minWidth: 320 });
        const lat = v.stage({ x: [0.3, MM + 0.7], y: [0.3, MM + 0.7], equal: true, axes: 'box', gutter: true, xlabel: 'm', ylabel: 'n', height: 330, title: 'modes and their frequencies ω/ω₁₁ (click to choose)', xticks: [1, 2, 3, 4, 5, 6], yticks: [1, 2, 3, 4, 5, 6], minWidth: 300 });
        const om = (m, n, a) => Math.sqrt((m / a) ** 2 + n * n);
        const partners = (m, n, a) => { const w = om(m, n, a), out = []; for (let p = 1; p <= MM; p++) for (let q = 1; q <= MM; q++) if ((p !== m || q !== n) && Math.abs(om(p, q, a) - w) < 1e-9) out.push([p, q]); return out; };
        lat.onClick((x, y) => { const m = M.clamp(Math.round(x), 1, MM), n = M.clamp(Math.round(y), 1, MM); mS.set(m); nS.set(n); th.set(0); });
        let tt = 0, cur = null, nodalMax = 0;
        v.animate((t) => {
          const m = mS.value, n = nS.value, a = aS.value, P = partners(m, n, a);
          const part = P.length ? P[0] : null;
          th.el.hidden = !part; cur = { m, n, a, P };
          const T = th.value * Math.PI / 180, cth = Math.cos(T), sth = Math.sin(T);
          s.setView([-0.03, a + 0.03], [-0.03, 1.03]);
          const w = (x, y) => (part ? cth * Math.sin(m * Math.PI * x / a) * Math.sin(n * Math.PI * y) + sth * Math.sin(part[0] * Math.PI * x / a) * Math.sin(part[1] * Math.PI * y) : Math.sin(m * Math.PI * x / a) * Math.sin(n * Math.PI * y));
          let mx = 0; for (let i = 0; i <= 40; i++) for (let j = 0; j <= 40; j++) mx = Math.max(mx, Math.abs(w(a * i / 40, j / 40)));
          nodalMax = mx;
          const ph = Math.cos(TAU * 0.2 * (om(m, n, a) / om(1, 1, 1)) * t * 0.5);
          const dv = diverging(v);
          s.raster((x, y) => (x >= 0 && x <= a && y >= 0 && y <= 1 ? dv((w(x, y) / mx) * ph) : null), { res: 3, key: `${m}|${n}|${a}|${th.value}|${Math.round(ph * 200)}|${v.color('panel')}`, rect: [0, 0, a, 1] });
          s.clip(() => s.contour(w, [0], { color: 'ink', width: 2.2, res: 150 }), [0, a], [0, 1]);
          s.rect(0, 0, a, 1, { stroke: true, color: 'ink', width: 2.5, fill: false });
          // lattice
          for (let p = 1; p <= MM; p++) for (let q = 1; q <= MM; q++) {
            const deg = partners(p, q, a).length > 0, sel = p === m && q === n, isP = part && p === part[0] && q === part[1];
            lat.dot(p, q, { r: sel ? 15 : 12, color: sel ? 'gold' : isP ? 'gold' : deg ? 'green' : 'accent', hollow: !sel && !isP, width: 2 });
            lat.text(v.fix(om(p, q, a) / om(1, 1, a), 2), p, q, { size: 10.5, align: 'center', baseline: 'middle', color: sel ? 'ink' : 'muted' });
          }
        }, { still: 0.5 });
        v.legend([['green', 'degenerate with another mode (same frequency)'], ['gold', 'chosen mode / its partner'], ['ink', 'nodal lines']]);
        v.readout(() => {
          if (!cur) return '';
          const { m, n, a, P } = cur, r = om(m, n, a) / om(1, 1, a);
          return `mode $(${m},${n})$ on a rectangle $a/b=${v.fix(a, 2)}$: $\\omega_{${m}${n}}=\\pi c\\sqrt{m^2/a^2+n^2/b^2}=${v.fix(r, 3)}\\,\\omega_{11}$ · ${m - 1} vertical and ${n - 1} horizontal nodal lines (when pure) · ${P.length ? 'degenerate with ' + P.map((p) => `$(${p[0]},${p[1]})$`).join(', ') + ' (in the range shown): mixing them costs no change of frequency' : 'no other mode in the range shares this frequency: the nodal pattern is fixed'}`;
        });
      },
    },
  ],
};
