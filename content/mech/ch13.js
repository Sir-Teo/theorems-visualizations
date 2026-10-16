// Classical Mechanics — Chapter 13: Nonlinear dynamics and chaos (part a: 13.1–13.8)

import { sciText, TAU, DEG, clamp, memo, sci, num, wrap, wrap0, progressive, now, fastDots, fitLine, stdOrbit, symOrbit, residueChain, FIB, PELL, hhV, hhStep, hhStepT, hhE, hhSeed, hhSection, hhFTLE, hhPyMax, hhYRange, piTicks } from './ch13.shared.js';

// ── 13.1: the cat map and its relatives ──────────────────────────────────────────────────────────────────────
/** Order of the 2×2 integer matrix A modulo N (smallest n ≥ 1 with Aⁿ ≡ I), or Infinity if not found by `cap`. */
function matOrder(A, N, cap = 3000) {
  let a = 1, b = 0, c = 0, d = 1;
  for (let n = 1; n <= cap; n++) {
    const na = (A[0] * a + A[1] * c) % N, nb = (A[0] * b + A[1] * d) % N, nc = (A[2] * a + A[3] * c) % N, nd = (A[2] * b + A[3] * d) % N;
    a = na; b = nb; c = nc; d = nd;
    if (a === 1 % N && b === 0 && c === 0 && d === 1 % N) return n;
  }
  return Infinity;
}
/** Push every pixel's source label forward once under (i, j) ↦ A(i, j) mod N (−1 = no pixel arrives here). */
function pushForward(src, A, N) {
  const out = new Int32Array(N * N).fill(-1);
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const s = src[i * N + j]; if (s < 0) continue;
    const ii = (A[0] * i + A[1] * j) % N, jj = (A[2] * i + A[3] * j) % N; out[ii * N + jj] = s;
  }
  return out;
}

// ── 13.2: two oscillators with a quartic coupling, V = ½(x² + w²y²) + κx²y² ────────────────────────────────────
const W2 = 1.618033988749895 ** 2;
function qStep(s, h, k) {
  const kick = () => { s[2] -= 0.5 * h * (s[0] + 2 * k * s[0] * s[1] * s[1]); s[3] -= 0.5 * h * (W2 * s[1] + 2 * k * s[0] * s[0] * s[1]); };
  kick(); s[0] += h * s[2]; s[1] += h * s[3]; kick();
}
const qE = (s, k) => 0.5 * (s[2] * s[2] + s[3] * s[3]) + 0.5 * (s[0] * s[0] + W2 * s[1] * s[1]) + k * s[0] * s[0] * s[1] * s[1];
function qFTLE(s0, k, T = 400, h = 0.01) {
  const s = s0.slice(), u = [0.3, 0.5, 0.2, -0.1]; let S = 0; const n = Math.round(T / h);
  for (let i = 1; i <= n; i++) {
    const kick = () => {
      const x = s[0], y = s[1];
      s[2] -= 0.5 * h * (x + 2 * k * x * y * y); s[3] -= 0.5 * h * (W2 * y + 2 * k * x * x * y);
      u[2] -= 0.5 * h * ((1 + 2 * k * y * y) * u[0] + 4 * k * x * y * u[1]); u[3] -= 0.5 * h * (4 * k * x * y * u[0] + (W2 + 2 * k * x * x) * u[1]);
    };
    kick(); s[0] += h * s[2]; s[1] += h * s[3]; u[0] += h * u[2]; u[1] += h * u[3]; kick();
    if (i % 50 === 0) { const r = Math.hypot(u[0], u[1], u[2], u[3]); S += Math.log(r); for (let j = 0; j < 4; j++) u[j] /= r; }
  }
  return S / T;
}

export default {
  collection: 'mech',
  chapter: 13,
  title: 'Nonlinear dynamics and chaos',
  summary: String.raw`Because Hamiltonian flows preserve phase-space volume, a bounded system must come back arbitrarily close to where it started, yet in general its motion is not integrable. Poincaré sections show what happens instead: under a small perturbation most invariant tori survive (KAM), resonant tori break into chains of islands (Poincaré–Birkhoff), and around the broken separatrices chaotic layers grow in which nearby trajectories separate exponentially, as in the Hénon–Heiles system, the standard map and the double pendulum. Billiards range from integrable through mixed to fully chaotic and ergodic. Dissipative systems contract phase space onto attractors. The driven damped pendulum and the logistic map reach chaos by period doubling, at a rate set by Feigenbaum’s universal constant, and the leaky waterwheel traces the fractal Lorenz attractor.`,
  items: [
    // ───────────────────────────────────────────────────────────── 13.1
    {
      num: '13.1',
      kind: 'Theorem',
      name: 'Poincaré recurrence theorem',
      statement: String.raw`Let $T$ be a map of a measure space $(X, \mu)$ with $\mu(X) < \infty$ that preserves the measure, $\mu(T^{-1}A) = \mu(A)$ for every measurable $A$. Then for every measurable set $A$ almost every point of $A$ returns to $A$, and in fact returns infinitely often: $T^nx \in A$ for infinitely many $n$.

For a Hamiltonian system whose motion stays in a bounded region of phase space (for instance a compact energy surface), take $T = \varphi_\tau$, the flow for a fixed time $\tau$, and $\mu$ the Liouville volume, which the flow preserves (12.13). Then almost every state returns arbitrarily close to itself, again and again. Two companions:
(a) **Kac’s lemma.** If $T$ is also ergodic and $\mu(A) > 0$, the mean return time to $A$ is $\mu(X)/\mu(A)$.
(b) **Finite version.** A bijection of a finite set is a permutation, so every point is periodic and the whole set comes back after the least common multiple of the cycle lengths.

The theorem says nothing about how long the wait is. For a gas of $10^{23}$ molecules the return time vastly exceeds the age of the universe, which is why recurrence does not contradict the second law in practice.`,
      idea: String.raw`The sets $A, T^{-1}A, T^{-2}A, \dots$ all have measure $\mu(A)$, so if $\mu(A) > 0$ they cannot all be disjoint inside a space of finite measure: some $T^{-i}A \cap T^{-j}A$ with $i < j$ has positive measure, and applying $T^i$ shows that part of $A$ comes back after $j - i$ steps. To get almost every point, let $B \subset A$ be the points that never return. The preimages $T^{-n}B$ are pairwise disjoint (a point in two of them would return), all of measure $\mu(B)$, so $\mu(B) = 0$. Measure preservation comes from Liouville’s theorem (12.13); Lebesgue measure (rca-2.20) supplies the countable additivity. On a finite grid, area preservation becomes bijectivity, and recurrence becomes the fact that a permutation has finite order.`,
      caption: String.raw`**Picture on a grid.** Each step applies Arnold’s cat map $(i, j) \mapsto (2i + j,\ i + j) \bmod N$ to the pixels, a bijection of the grid. The face is scrambled beyond recognition and then reassembles exactly, at the step $n$ where the matrix power is the identity mod $N$ (computed in the readout). Right: the fraction of pixels back in their original place. Change $N$ and the period jumps around. Switch to the determinant-2 map: for odd $N$ it is still a bijection mod $N$ and still recurs, but for even $N$ pixels collide, information is lost, and the picture never returns. **Returns to a disc.** The cat map on the continuous torus preserves area; drag the start point. The orbit keeps returning to the disc around it (green), and the measured mean return time follows Kac’s line $1/(\pi\varepsilon^2)$ on the right. Turn on dissipation: the orbit collapses onto an attractor and never comes back.`,
      deps: ['mech-12.13', 'rca-2.20'],
      refs: ['Arnold §16', 'Tong §4.2'],
      tags: ['recurrence', 'measure preservation', 'cat map'],
      credit: 'Poincaré, 1890; Kac, 1947',
      viz(v) {
        const mode = v.select('view', [{ value: 'grid', label: 'picture on an $N\\times N$ grid' }, { value: 'torus', label: 'returns to a disc' }], 'grid', { onChange: () => v.restart() });
        const Ns = v.slider('grid size $N$', 24, 160, 101, { int: true, onChange: () => v.restart() });
        const mapS = v.select('map', [{ value: 'cat', label: 'cat map, det 1' }, { value: 'lossy', label: '$(i + j,\\ i + 3j)$, det 2' }], 'cat', { onChange: () => v.restart() });
        const epsS = v.slider('target radius $\\varepsilon$', 0.01, 0.2, 0.04, { log: true });
        const fric = v.toggle('dissipation (break it)', false);
        const sA = v.stage({ x: [0, 1], y: [0, 1], equal: true, axes: false, height: 350, weight: 1, title: 'the picture after $n$ steps' });
        const sB = v.stage({ x: [0, 60], y: [0, 1.05], axes: 'box', gutter: true, height: 350, weight: 1.1, xlabel: 'step n', ylabel: 'fraction of pixels back home' });
        const h0 = sA.handle(0.31, 0.62, { color: 'ink', r: 6, constrain: (x, y) => [clamp(x, 0.002, 0.998), clamp(y, 0.002, 0.998)] });
        const MATS = { cat: [2, 1, 1, 1], lossy: [1, 1, 1, 3] };
        // the face: palette indices 0 background, 1 face, 2 features, 3 rim, 4 lost
        const face = (i, j, N) => {
          const u = (i + 0.5) / N, w = (j + 0.5) / N, r = Math.hypot(u - 0.5, w - 0.5);
          if (Math.hypot(u - 0.39, w - 0.6) < 0.055 || Math.hypot(u - 0.61, w - 0.6) < 0.055) return 2;
          if (r > 0.17 && r < 0.235 && w < 0.44) return 2;
          if (r < 0.33) return 1; if (r < 0.38) return 3;
          return (Math.floor(u * 8) + Math.floor(w * 8)) % 2 ? 0 : 5;
        };
        const gridCache = memo();
        const modinv = (a, N) => { a = ((a % N) + N) % N; for (let x = 1; x < N; x++) if ((a * x) % N === 1) return x; return 0; };
        const matMul = (X, Y, N) => [(X[0] * Y[0] + X[1] * Y[2]) % N, (X[0] * Y[1] + X[1] * Y[3]) % N, (X[2] * Y[0] + X[3] * Y[2]) % N, (X[2] * Y[1] + X[3] * Y[3]) % N];
        const matPow = (A, n, N) => { let R = [1 % N, 0, 0, 1 % N], B = A.map((x) => x % N); while (n > 0) { if (n & 1) R = matMul(R, B, N); B = matMul(B, B, N); n >>= 1; } return R; };
        const gridData = () => gridCache(`${Ns.value}|${mapS.value}`, () => {
          const N = Ns.value, A = MATS[mapS.value], det = A[0] * A[3] - A[1] * A[2], bij = gcd(det, N) === 1;
          const P = bij ? matOrder(A, N, 60000) : Infinity;
          const nmax = bij ? Math.min(P + Math.max(4, Math.round(P * 0.15)), 1500) : 90;
          const home = new Float64Array(nmax + 1); home[0] = 1; let lost = 0;
          if (bij) {
            let An = [1, 0, 0, 1];
            for (let n = 1; n <= nmax; n++) { An = matMul(An, A, N); let c = 0; for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if ((An[0] * i + An[1] * j) % N === i && (An[2] * i + An[3] * j) % N === j) c++; home[n] = c / (N * N); }
          } else {
            let src = new Int32Array(N * N); for (let k = 0; k < N * N; k++) src[k] = k;
            for (let n = 1; n <= nmax; n++) { src = pushForward(src, A, N); let c = 0, l = 0; for (let k = 0; k < N * N; k++) { if (src[k] === k) c++; else if (src[k] < 0) l++; } home[n] = c / (N * N); lost = l / (N * N); }
          }
          const pic = new Uint8Array(N * N); for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) pic[i * N + j] = face(i, j, N);
          return { N, A, P, det, bij, nmax, home, pic, lost };
        });
        let cur = { n: -1, src: null, key: '' };
        const srcAt = (G, n) => {
          const key = `${G.N}|${G.A}`, N = G.N;
          if (G.bij) { // the picture after n steps shows, at pixel y, the original pixel A^{-n} y
            if (cur.key === key && cur.n === n) return cur.src;
            const B = matPow(G.A, n, N), di = modinv(B[0] * B[3] - B[1] * B[2], N), I = [(di * B[3]) % N, (di * (N - B[1])) % N, (di * (N - B[2])) % N, (di * B[0]) % N];
            const src = new Int32Array(N * N); for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) src[i * N + j] = ((I[0] * i + I[1] * j) % N) * N + ((I[2] * i + I[3] * j) % N);
            cur = { key, n, src }; return src;
          }
          if (cur.key !== key || n < cur.n) { cur = { key, n: 0, src: new Int32Array(N * N) }; for (let k = 0; k < N * N; k++) cur.src[k] = k; }
          while (cur.n < n) { cur.src = pushForward(cur.src, G.A, N); cur.n++; }
          return cur.src;
        };
        function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; }
        // continuous torus
        const torCache = memo();
        const EPS = Array.from({ length: 15 }, (_, k) => 0.006 * (0.3 / 0.006) ** (k / 14));
        const torus = () => torCache(`${h0.x}|${h0.y}|${fric.value}`, () => {
          const n = 120000, x0 = h0.x, y0 = h0.y, xs = new Float64Array(n + 1), ys = new Float64Array(n + 1), dmin = new Float64Array(n + 1);
          let x = x0, y = y0; xs[0] = x; ys[0] = y; const cnt = new Float64Array(EPS.length), lam = 0.45, Kd = 3.2;
          for (let k = 1; k <= n; k++) {
            if (fric.value) { y = lam * y + (Kd / TAU) * Math.sin(TAU * x); y -= Math.floor(y); x += y; x -= Math.floor(x); }
            else { const nx = 2 * x + y, ny = x + y; x = nx - Math.floor(nx); y = ny - Math.floor(ny); }
            xs[k] = x; ys[k] = y;
            let dx = Math.abs(x - x0), dy = Math.abs(y - y0); dx = Math.min(dx, 1 - dx); dy = Math.min(dy, 1 - dy); const d = Math.hypot(dx, dy); dmin[k] = d;
            for (let j = 0; j < EPS.length; j++) if (d < EPS[j]) cnt[j]++;
          }
          return { n, xs, ys, dmin, cnt };
        });
        let rate = 3, state = null;
        v.animate((tt) => {
          const grid = mode.value === 'grid';
          Ns.el.hidden = mapS.el.hidden = !grid; epsS.el.hidden = fric.el.hidden = grid; h0.visible = !grid;
          if (grid) {
            const G = gridData(), P = isFinite(G.P) ? G.P : G.nmax; rate = Math.max(2.5, P / 9);
            const cyc = P + Math.ceil(rate * 2.5), n = Math.min(Math.floor(tt * rate) % cyc, P), src = srcAt(G, n);
            const pal = [v.ramp(0.12, 'blue'), v.rgb('gold'), v.rgb('ink'), v.rgb('orange'), v.rgb('panel'), v.ramp(0.3, 'blue')];
            const N = G.N;
            sA.setTitle(`the picture after n = ${n} step${n === 1 ? '' : 's'}`);
            sA.raster((x, y) => { const i = Math.min(N - 1, Math.floor(x * N)), j = Math.min(N - 1, Math.floor(y * N)), s = src[i * N + j]; return s < 0 ? pal[4] : pal[G.pic[s]]; }, { key: `${N}|${G.A}|${n}|${v.color('panel')}`, res: 1, rect: [0, 0, 1, 1] });
            sA.rect(0, 0, 1, 1, { color: 'muted', width: 1, fill: false });
            const xmax = isFinite(G.P) ? Math.max(G.nmax, Math.round(G.P * 1.15) + 4) : G.nmax; sB.setScale({ xlog: false, ylog: false, x: [0, xmax], y: [0, 1.05] }); sB.setLabels('step n', 'fraction of pixels back home');
            if (G.nmax <= 300) sB.bars(Array.from(G.home).slice(1), { x0: 1, dx: 1, color: (val) => (val > 0.999 ? 'green' : 'accent') });
            else { sB.path(Array.from(G.home).map((h, k) => [k, h]), { color: 'accent', width: 1.2 }); for (let k = 1; k <= G.nmax; k++) if (G.home[k] > 0.999) sB.line(k, 0, k, 1, { color: 'green', width: 2.5 }); }
            if (isFinite(G.P)) { sB.line(G.P, 0, G.P, 1, { color: 'green', width: 3 }); sB.text(`period ${G.P}`, G.P, 1.0, { color: 'green', align: 'right', dx: -7, size: 12.5, baseline: 'top' }); }
            sB.vline(n, { color: 'gold', width: 2 });
            state = { grid, G, n };
          } else {
            const D = torus(), e = epsS.value;
            sA.setTitle(fric.value ? 'dissipative map on the torus' : 'cat map on the torus $[0,1)^2$');
            fastDots(v, sA, D.xs, D.ys, 5000, 'accent', { alpha: 0.5, size: 1.6 });
            const ret = []; for (let k = 1; k <= D.n && ret.length < 400; k++) if (D.dmin[k] < e) ret.push([D.xs[k], D.ys[k]]);
            for (const dx of [-1, 0, 1]) for (const dy of [-1, 0, 1]) sA.circle(h0.x + dx, h0.y + dy, e, { color: 'green', width: 1.6, fill: 'green', fillAlpha: 0.12 });
            sA.dots(ret, { r: 2.4, color: 'green' });
            sA.rect(0, 0, 1, 1, { color: 'muted', width: 1, fill: false });
            sB.setScale({ xlog: true, ylog: true, x: [0.005, 0.35], y: [1, 3e5] }); sB.setLabels('target radius ε', 'mean return time (steps)');
            sB.fn((r) => 1 / (Math.PI * r * r), { color: 'green', width: 2, dash: [6, 4] });
            const pts = [], none = []; EPS.forEach((r, j) => (D.cnt[j] > 0 ? pts.push([r, D.n / D.cnt[j]]) : none.push([r, 2e5])));
            sB.path(pts, { color: 'accent', width: 1.4, alpha: 0.6 }); sB.dots(pts, { r: 3.5, color: 'accent' });
            for (const p of none) sB.dot(p[0], p[1], { r: 4, color: 'red', hollow: true });
            if (none.length) sB.text('never returned', none[0][0], 2e5, { color: 'red', dx: 8, align: 'left', size: 12.5 });
            sB.vline(e, { color: 'gold', width: 1.6 });
            state = { grid, D, e, visits: ret.length };
          }
        }, { period: null, still: 3.2 });
        v.legend([['accent', 'pixels / orbit points'], ['green', 'returns (Kac: $1/\\pi\\varepsilon^2$)', { dash: true }], ['gold', 'current step / radius']]);
        v.readout(() => {
          if (!state) return '';
          if (state.grid) {
            const { G, n } = state, A = G.A;
            const per = isFinite(G.P) ? String.raw`$A^{${G.P}} \equiv I \pmod{${G.N}}$: the picture returns after **${G.P} steps**` : G.bij ? 'the period exceeds 60 000 steps' : String.raw`no power of $A$ is the identity mod ${G.N}`;
            const bij = G.bij ? String.raw`$\det A = ${G.det}$ is invertible mod ${G.N}, so the map permutes the pixels` : String.raw`$\det A = ${G.det}$ shares a factor with ${G.N}: pixels collide and after ${G.nmax} steps ${v.fix(100 * G.lost, 0)}% of the grid is empty, so the picture can never come back`;
            return String.raw`$A = \begin{pmatrix}${A[0]}&${A[1]}\\${A[2]}&${A[3]}\end{pmatrix}$, step $n = ${n}$, pixels in place now: ${v.fix(100 * G.home[n], 1)}% · ${bij} · ${per}`;
          }
          const { D, e } = state, cnt = (() => { let c = 0; for (let k = 1; k <= D.n; k++) if (D.dmin[k] < e) c++; return c; })();
          let first = 0; for (let k = 1; k <= D.n; k++) if (D.dmin[k] < e) { first = k; break; }
          if (fric.value) return String.raw`dissipative map (Jacobian $0.45 < 1$): returns within $\varepsilon = ${v.fix(e, 3)}$ in ${D.n.toLocaleString('en')} steps: **${cnt}** — the orbit has collapsed onto a set of zero area, which the start point is not on`;
          return String.raw`returns within $\varepsilon = ${v.fix(e, 3)}$ in ${D.n.toLocaleString('en')} steps: ${cnt}, first after ${first} steps · mean return time ${cnt ? v.fix(D.n / cnt, 1) : '∞'}, Kac’s lemma $1/(\pi\varepsilon^2) = ${v.fix(1 / (Math.PI * e * e), 1)}$`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 13.2
    {
      num: '13.2',
      kind: 'Definition',
      name: 'Poincaré section',
      statement: String.raw`Let a flow on phase space have a hypersurface $\Sigma$ that trajectories cross transversally. The **Poincaré section** of a trajectory is the set of points where it pierces $\Sigma$ in a chosen direction, and the **first-return map** $P : \Sigma \to \Sigma$ sends each crossing to the next one. For a Hamiltonian system with two degrees of freedom the motion at energy $E$ lies on a three-dimensional energy surface. Choosing $\Sigma = \{y = 0,\ p_y > 0\}$ and eliminating $p_y$ through $H = E$ leaves two coordinates $(x, p_x)$, so the section is a picture in a plane, and $P$ preserves area there, with respect to $dx\,dp_x$.

What the dots show:
(a) An orbit on an invariant torus (12.18) with irrational frequency ratio fills a smooth **closed curve**.
(b) A periodic orbit, or a torus with rational frequency ratio, gives **finitely many points**.
(c) A chaotic orbit scatters dots over a **two-dimensional region**.`,
      idea: String.raw`A trajectory on a two-torus winds around it; cutting the torus with a plane gives a circle, and successive crossings step around that circle by the rotation number, so they fill it densely if that number is irrational and repeat if it is rational. A chaotic orbit lies on no invariant torus, so nothing confines its crossings to a curve. The section turns a flow in three dimensions into a map in two, which is why the standard map (13.6) can serve as a model of all such systems. Area preservation of $P$ is Poincaré’s integral invariant (12.14), applied to the tube of trajectories between two crossings.`,
      caption: String.raw`Two oscillators with frequencies 1 and the golden ratio, coupled by $\kappa x^2y^2$, at energy $E = 1$. Left: the orbit drawn in the three-dimensional space $(x, p_x, y)$, which you can rotate. Each time it passes up through the plane $y = 0$ (teal), it leaves a dot. Right: those dots on the section, over a faint background of other orbits. Drag the start point on the section. At $\kappa = 0$ the oscillators are independent and every orbit gives a circle; with coupling, some orbits still draw closed curves (tori) and others spray dots over an area (chaos). The readout reports the measured Lyapunov exponent.`,
      deps: ['mech-12.4', 'mech-12.18'],
      refs: ['Taylor §12.8', 'Goldstein §11.5'],
      tags: ['Poincaré section', 'return map', 'phase space'],
      credit: 'Poincaré, 1890s',
      viz(v) {
        const kS = v.slider('coupling $\\kappa$', 0, 4, 2.2, { step: 0.05, onChange: () => v.restart() });
        const E = 1, TT = 520, H = 0.01, REC = 6, R0 = Math.sqrt(2 * E);
        const s3 = v.stage3d({ range: 1.7, height: 360, yaw: -0.75, pitch: 0.38, axes: false, weight: 1.05, title: 'the orbit in $(x, p_x, y)$; the plane $y = 0$' });
        const sS = v.stage({ x: [-1.55, 1.55], y: [-1.55, 1.55], equal: true, axes: 'box', gutter: true, height: 360, weight: 1, xlabel: 'x', ylabel: 'pₓ', title: 'section $y = 0$, $p_y > 0$' });
        const h0 = sS.handle(0.62, 0.35, { color: 'ink', r: 7, constrain: (x, y) => { const r = Math.hypot(x, y), R = R0 * 0.985; return r > R ? [(x * R) / r, (y * R) / r] : [x, y]; } });
        h0.onDrag = () => v.restart();
        const seed = (x, px) => [x, 0, px, Math.sqrt(Math.max(0, 2 * E - x * x - px * px))];
        const run = (s0, k, keepPath) => {
          const s = s0.slice(), n = Math.round(TT / H), path = [], cx = [], cp = [], ct = []; let drift = 0;
          for (let i = 1; i <= n; i++) {
            const y0 = s[1], x0 = s[0], p0 = s[2]; qStep(s, H, k);
            if (y0 < 0 && s[1] >= 0) { const f = -y0 / (s[1] - y0); cx.push(x0 + f * (s[0] - x0)); cp.push(p0 + f * (s[2] - p0)); ct.push((i - 1 + f) * H); }
            if (keepPath && i % REC === 0) { path.push([s[0], s[2], s[1]]); drift = Math.max(drift, Math.abs(qE(s, k) - E)); }
          }
          return { path, cx, cp, ct, drift };
        };
        const bgCache = memo(), orbCache = memo();
        const bg = () => bgCache(kS.value, () => {
          const out = [];
          for (const [x, px] of [[-1.25, 0], [-0.95, 0], [-0.6, 0], [-0.25, 0], [0.1, 0], [0.45, 0], [0.8, 0], [1.1, 0], [1.33, 0], [0, 0.7], [0, -0.7], [0, 1.15], [0, -1.15]]) out.push(run(seed(x, px), kS.value, false));
          return out;
        });
        const orbit = () => orbCache(`${kS.value}|${h0.x}|${h0.y}`, () => { const s0 = seed(h0.x, h0.y), r = run(s0, kS.value, true); r.L = qFTLE(s0, kS.value, 400); return r; });
        let cur = null;
        v.animate((tt) => {
          const B = bg(), O = orbit(), tau = Math.min(tt * 32, TT), i = Math.min(O.path.length - 1, Math.floor(tau / (H * REC)));
          // 3D: plane, boundary circle, orbit so far, crossings
          const C = 1.55;
          s3.poly([[-C, -C, 0], [C, -C, 0], [C, C, 0], [-C, C, 0]], { fill: 'teal', fillAlpha: 0.1, color: 'teal', width: 1, alpha: 0.5 });
          const ring = []; for (let k = 0; k <= 64; k++) ring.push([R0 * Math.cos((TAU * k) / 64), R0 * Math.sin((TAU * k) / 64), 0]);
          s3.path(ring, { color: 'teal', width: 1, alpha: 0.6 });
          const step = Math.max(1, Math.ceil(i / 1400)), pts = []; for (let k = 0; k <= i; k += step) pts.push(O.path[k]);
          s3.path(pts, { color: 'accent', width: 1.1, alpha: 0.55 });
          s3.dot(O.path[i], { r: 5, color: 'gold' });
          let nc = 0; while (nc < O.ct.length && O.ct[nc] <= tau) nc++;
          for (let k = Math.max(0, nc - 60); k < nc; k++) s3.dot([O.cx[k], O.cp[k], 0], { r: 2.6, color: 'red', ring: false });
          s3.text('y', [0, 0, 1.5], { color: 'muted', math: true }); s3.text('x', [1.65, 0, 0], { color: 'muted', math: true }); s3.text('pₓ', [0, 1.65, 0], { color: 'muted', math: true });
          // section
          sS.circle(0, 0, R0, { color: 'teal', width: 1.2, fill: 'teal', fillAlpha: 0.05 });
          for (const b of B) fastDots(v, sS, b.cx, b.cp, b.cx.length, 'muted', { alpha: 0.45, size: 1.6 });
          fastDots(v, sS, O.cx, O.cp, nc, 'red', { alpha: 0.9, size: 2.6 });
          if (nc) sS.dot(O.cx[nc - 1], O.cp[nc - 1], { r: 4.5, color: 'gold' });
          sS.corner(`${nc} crossings`, 'tr', { color: 'ink', plate: true });
          cur = { O, nc, tau };
        }, { period: TT / 32 + 2, still: 14 });
        v.legend([['accent', 'orbit'], ['red', 'its crossings of $y = 0$'], ['muted', 'other orbits (background)'], ['teal', 'section plane and energy boundary']]);
        v.readout(() => {
          if (!cur) return '';
          const { O, nc } = cur, reg = O.L < 0.02;
          return String.raw`crossings so far: ${nc} of ${O.cx.length} · energy error of the leapfrog integrator $\le ${sci(v, O.drift)}$ · finite-time Lyapunov exponent ${v.fix(O.L, 3)} → ` + (kS.value === 0 ? '**uncoupled**: the $x$-energy is conserved, so the dots lie on the circle $x^2 + p_x^2 = \\text{const}$' : reg ? '**regular**: the dots trace a closed curve (a torus)' : '**chaotic**: the dots fill an area');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 13.3
    {
      num: '13.3',
      kind: 'Model',
      name: 'Hénon–Heiles system',
      statement: String.raw`A star moving in the meridian plane of an axisymmetric galaxy, reduced to two degrees of freedom, is modelled by
$$H = \tfrac12(p_x^2 + p_y^2) + \tfrac12(x^2 + y^2) + x^2y - \tfrac13y^3 .$$
The potential has a minimum at the origin and three saddles at height $E = 1/6$, at $(0, 1)$ and $(\pm\tfrac{\sqrt3}{2}, -\tfrac12)$, forming a triangle with threefold symmetry; for $E < 1/6$ orbits starting inside stay bounded. Hénon and Heiles asked whether such a system has a third integral besides the energy, which would confine every orbit to a torus. The Poincaré section $x = 0$, $p_x > 0$ answers that it does for low energies, approximately: at $E = 1/12$ almost every orbit traces an invariant curve. Near $E = 1/8$ invariant curves and a chaotic sea coexist. As $E \to 1/6$ the chaotic orbits occupy most of the section, with only small islands of regular motion left.`,
      scope: String.raw`Holds for $E < 1/6$ (bounded motion inside the triangle); above that, orbits escape through the saddles.`,
      idea: String.raw`At low energy the cubic terms are small compared with the quadratic ones, so the system is a slightly perturbed pair of identical oscillators. Canonical perturbation theory (12.21) and the KAM theorem (13.7) then guarantee that most invariant tori of the integrable approximation (12.18) survive. As the energy rises, the cubic terms grow relative to the quadratic ones, resonances widen and overlap, and the tori between them break into the chaotic sea. The section (13.2) makes the transition visible, and the finite-time Lyapunov exponent (13.4) classifies each orbit as regular or chaotic.`,
      caption: String.raw`Left: the Poincaré section at energy $E$. Each orbit leaves its crossings in blue if it is regular (Lyapunov exponent near zero) or in red if it is chaotic. Click on the section to launch an orbit from that point; it is drawn in gold, and on the right in real space, inside its equipotential curve $V = E$ (the red triangle is the escape energy $V = 1/6$). Raise $E$: at $1/12$ the section is all smooth curves; by $1/6$ it is mostly chaotic sea. Bottom: the fraction of the section’s area that is chaotic, measured from 40 random starting points per energy, with the current energy marked.`,
      deps: ['mech-13.2', 'mech-12.18'],
      refs: ['Goldstein §11.6'],
      tags: ['Hénon–Heiles', 'galactic dynamics', 'chaos'],
      credit: 'Hénon & Heiles, 1964',
      viz(v) {
        const eS = v.slider('energy $E$', 0.02, 1 / 6, 0.125, { step: 0.0005, fmt: (x) => `${v.fix(x, 4)}  (= ${v.fix(6 * x, 3)} × 1/6)` });
        const sS = v.stage({ x: [-0.55, 1.05], y: [-0.62, 0.62], axes: 'box', gutter: true, height: 350, weight: 1.35, xlabel: '$y$', ylabel: '$p_y$', title: 'section $x = 0$, $p_x > 0$ (click to launch)' });
        const sX = v.stage({ x: [-0.95, 0.95], y: [-0.6, 1.08], equal: true, axes: false, height: 350, weight: 1, title: 'the gold orbit in the $(x, y)$ plane' });
        const sF = v.stage({ x: [0, 1 / 6], y: [0, 1], axes: 'box', gutter: true, height: 190, full: true, xlabel: 'energy E', ylabel: 'chaotic fraction', xticks: [[0, '0'], [1 / 24, '1/24'], [1 / 12, '1/12'], [1 / 8, '1/8'], [1 / 6, '1/6']] });
        let pick = [-0.2, 0];
        sS.onClick((x, y) => { pick = [x, y]; v.invalidate(); });
        const THR = 0.02;
        const randomSeeds = (E, n, seed) => { const r = v.rng(seed), [y0, y1] = hhYRange(E), pm = hhPyMax(E, 0) || 0.6, out = []; let guard = 0; while (out.length < n && guard++ < 5000) { const s = hhSeed(E, y0 + (y1 - y0) * r(), (2 * r() - 1) * pm * 1.05); if (s) out.push(s); } return out; };
        const secCache = memo(), fracCache = memo();
        const sections = () => secCache(eS.value, () => {
          const E = eS.value, [y0, y1] = hhYRange(E), pm = hhPyMax(E, 0), out = [];
          for (let k = 0; k < 13; k++) { const s = hhSeed(E, y0 + ((y1 - y0) * (k + 0.5)) / 13, 0); if (s) out.push(s); }
          for (const f of [-0.85, -0.55, -0.25, 0.25, 0.55, 0.85]) { const s = hhSeed(E, 0, f * pm); if (s) out.push(s); }
          return out.map((s) => { const sec = hhSection(s, { max: 200 }), L = hhFTLE(s, 500); return { ...sec, L }; });
        });
        const fracAt = (E) => { const S = randomSeeds(E, 40, 101); let c = 0; for (const s of S) if (hhFTLE(s, 500) > THR) c++; return c / S.length; };
        const fracNow = () => fracCache(eS.value, () => fracAt(eS.value));
        const EG = [1 / 24, 1 / 16, 1 / 12, 0.092, 0.1, 0.108, 0.116, 0.125, 0.133, 0.141, 0.149, 0.157, 1 / 6 - 0.0015], curve = [];
        const job = progressive(v); let gi = 0;
        const orbCache = memo();
        const orbit = () => orbCache(`${eS.value}|${pick}`, () => {
          const E = eS.value; let s = hhSeed(E, pick[0], pick[1]);
          if (!s) { const pm = hhPyMax(E, pick[0]); s = isFinite(pm) ? hhSeed(E, pick[0], clamp(pick[1], -pm * 0.98, pm * 0.98)) : hhSeed(E, 0, 0); }
          const sec = hhSection(s, { max: 400 }), L = hhFTLE(s, 500), path = [], q = s.slice();
          for (let i = 0; i < 6000; i++) { hhStep(q, 0.04); if (i % 2 === 0) path.push([q[0], q[1]]); }
          return { ...sec, L, path, s };
        });
        let cur = null;
        v.render(() => {
          job.run((budget) => { const t0 = now(); while (gi < EG.length && now() - t0 < budget) { curve.push([EG[gi], fracAt(EG[gi])]); gi++; } return gi >= EG.length; }, 25);
          const E = eS.value, [y0, y1] = hhYRange(E), S = sections(), O = orbit();
          // section
          const up = [], dn = []; for (let k = 0; k <= 160; k++) { const y = y0 + ((y1 - y0) * k) / 160, pm = hhPyMax(E, y); up.push([y, isFinite(pm) ? pm : 0]); dn.push([y, isFinite(pm) ? -pm : 0]); }
          sS.path(up.concat(dn.reverse()), { close: true, color: 'muted', width: 1.2, fill: 'muted', fillAlpha: 0.05 });
          for (const o of S) fastDots(v, sS, o.ys, o.ps, o.ys.length, o.L > THR ? 'red' : 'blue', { alpha: o.L > THR ? 0.55 : 0.8, size: 1.7 });
          fastDots(v, sS, O.ys, O.ps, O.ys.length, 'gold', { alpha: 1, size: 2.6 });
          sS.dot(O.s[1], O.s[3], { r: 5, color: 'gold' });
          // real space
          sX.contour(hhV, [1 / 6], { color: 'red', width: 1.2, alpha: 0.6, res: 140 });
          sX.contour(hhV, [E], { color: 'muted', width: 1.5, res: 140 });
          sX.path(O.path, { color: 'gold', width: 1, alpha: 0.75 });
          sX.text('V = 1/6 (escape)', 0.36, 0.62, { color: 'red', size: 12, align: 'left' });
          // chaotic fraction
          sF.path(curve, { color: 'red', width: 2 }); sF.dots(curve, { r: 3.5, color: 'red' });
          const fn = fracNow(); sF.vline(E, { color: 'gold', width: 1.5 }); sF.dot(E, fn, { r: 5.5, color: 'gold' });
          if (gi < EG.length) sF.corner(`computing… ${gi}/${EG.length}`, 'tl', { color: 'muted' });
          cur = { E, S, O, fn };
        });
        v.legend([['blue', 'regular orbits (tori)'], ['red', 'chaotic orbits'], ['gold', 'the orbit you launched'], ['muted', 'allowed region / equipotential $V = E$']]);
        v.readout(() => {
          if (!cur) return '';
          const { E, S, O, fn } = cur, nr = S.filter((o) => o.L > THR).length;
          return String.raw`$E = ${v.fix(E, 4)}$ · of the ${S.length} seeded orbits, ${S.length - nr} regular and ${nr} chaotic · chaotic fraction of the section (40 random starts): ${v.fix(100 * fn, 0)}% · gold orbit: ${O.ys.length} crossings, Lyapunov exponent ${v.fix(O.L, 3)} → ${O.L > THR ? '**chaotic**' : '**regular**'}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 13.4
    {
      num: '13.4',
      kind: 'Definition',
      name: 'Sensitive dependence and Lyapunov exponents',
      statement: String.raw`A flow $\varphi_t$ has **sensitive dependence on initial conditions** at $x$ if nearby states separate exponentially fast. The **(largest) Lyapunov exponent** measures the rate:
$$\lambda(x) = \lim_{t\to\infty}\ \lim_{\delta_0\to0}\ \frac1t\ln\frac{|\delta(t)|}{|\delta_0|} = \lim_{t\to\infty}\frac1t\ln\|D\varphi_t(x)\,u\|,$$
for a generic unit vector $u$. While the separation is small, $|\delta(t)| \approx |\delta_0|e^{\lambda t}$, so $\ln|\delta|$ grows linearly with slope $\lambda$ until it saturates at the size of the accessible region. An initial error $\delta_0$ therefore reaches a size $L$ after about
$$t_* \approx \frac1\lambda\ln\frac{L}{\delta_0},$$
the **predictability horizon**: making the error a thousand times smaller only adds $(\ln 1000)/\lambda$. On a regular torus $\lambda = 0$, and the separation grows only linearly, because neighbouring tori have slightly different frequencies.`,
      idea: String.raw`Linearise the flow along the orbit: a small separation evolves by the tangent map $D\varphi_t$, and a product of many non-commuting stretching matrices grows like $e^{\lambda t}$ along almost every direction (Oseledets). Numerically one follows a tangent vector with the variational equations and renormalises it now and then, adding up the logarithms of the stretch factors (Benettin’s method), so that it never overflows or saturates. For Hamiltonian flows the exponents come in pairs $\pm\lambda$, because the flow preserves volume (12.13), and the exponent along the flow direction is zero.`,
      caption: String.raw`Two Hénon–Heiles orbits at $E = 1/8$ start $\delta_0$ apart on the same energy surface. Left: the logarithm of their separation against time (blue), with the stretch of a renormalised tangent vector (green dashed, Benettin’s method) and a straight-line fit (red) whose slope is the Lyapunov exponent. In the chaotic sea the separation climbs a straight line until it saturates at the size of the region; on a regular torus it barely moves. Switch the time axis to logarithmic: there the regular orbit’s separation has slope 1, linear growth. Change $\delta_0$ and watch the horizon move by $\ln(10)/\lambda$ per decade. Right: the twin orbits, together at first, then apart.`,
      deps: ['mech-12.4', 'mech-13.3'],
      refs: ['Taylor §12.5', 'Goldstein §11.4'],
      tags: ['Lyapunov exponent', 'sensitive dependence', 'chaos'],
      credit: 'Lyapunov, 1892; Benettin et al., 1980',
      viz(v) {
        const orb = v.select('orbit at $E = 1/8$', [{ value: 'chaos', label: 'in the chaotic sea' }, { value: 'reg', label: 'on a regular torus' }], 'chaos');
        const d0S = v.slider('initial separation $\\delta_0$', 1e-12, 1e-4, 1e-9, { log: true, fmt: (x) => sciText(v, x) });
        const tax = v.select('time axis', [{ value: 'lin', label: 'linear $t$' }, { value: 'log', label: 'logarithmic $t$' }], 'lin');
        const E = 0.125, TT = 420, H = 0.02, REC = 5, L = 0.1;
        const sL = v.stage({ x: [0, TT], y: [-13, 1], axes: 'box', gutter: true, height: 330, weight: 1.55, xlabel: 't', ylabel: 'log₁₀ |δ(t)|' });
        const sX = v.stage({ x: [-0.9, 0.9], y: [-0.55, 0.95], equal: true, axes: false, height: 330, weight: 1, title: 'the twin orbits in the $(x, y)$ plane' });
        const cache = memo();
        const data = () => cache(`${orb.value}|${d0S.value}`, () => {
          const d0 = d0S.value, [y0, q0] = orb.value === 'chaos' ? [-0.2, 0] : [0, 0.3];
          const a = hhSeed(E, y0, q0), b = hhSeed(E, y0, q0 + d0), u = [b[0] - a[0], b[1] - a[1], b[2] - a[2], b[3] - a[3]];
          const nu = Math.hypot(...u); for (let k = 0; k < 4; k++) u[k] /= nu;
          const n = Math.round(TT / H), t = [0], ls = [Math.log10(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2], b[3] - a[3]))], lb = [Math.log10(nu)], pa = [[a[0], a[1]]], pb = [[b[0], b[1]]];
          let S = 0; const ref = a.slice();
          for (let i = 1; i <= n; i++) {
            hhStep(a, H); hhStep(b, H); hhStepT(ref, u, H);
            if (i % REC === 0) {
              const r = Math.hypot(u[0], u[1], u[2], u[3]); S += Math.log(r); for (let k = 0; k < 4; k++) u[k] /= r;
              t.push(i * H); ls.push(Math.log10(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2], b[3] - a[3]))); lb.push(Math.log10(nu) + S / Math.LN10); pa.push([a[0], a[1]]); pb.push([b[0], b[1]]);
            }
          }
          // fits: exponential stage (chaos) and power law (regular)
          const lo = Math.log10(d0) + 1.5, hi = Math.log10(L) - 0.5, fx = [], fy = [];
          for (let k = 0; k < t.length; k++) if (ls[k] > lo && ls[k] < hi) { fx.push(t[k]); fy.push(ls[k]); } else if (ls[k] >= hi) break;
          const fit = fx.length > 10 ? fitLine(fx, fy) : null;
          const gx = [], gy = []; for (let k = 1; k < t.length; k++) if (t[k] > 10) { gx.push(Math.log10(t[k])); gy.push(ls[k]); }
          const pow = fitLine(gx, gy);
          let tHit = NaN; for (let k = 0; k < t.length; k++) if (ls[k] > Math.log10(L)) { tHit = t[k]; break; }
          return { t, ls, lb, pa, pb, d0, lamB: S / TT, fit, fx, pow, tHit };
        });
        let cur = null;
        v.animate((tt) => {
          const D = data(), tau = Math.min(tt * 34, TT), i = Math.min(D.t.length - 1, Math.round(tau / (H * REC))), lg = tax.value === 'log';
          sL.setScale({ xlog: lg, x: lg ? [0.2, TT] : [0, TT], y: [-13, 1] });
          sL.hband(Math.log10(L), 1, { color: 'muted', alpha: 0.08 });
          sL.hline(Math.log10(L), { color: 'muted', dash: [4, 4], width: 1 });
          sL.text(`saturation: δ ≈ size of the region`, lg ? 0.3 : 8, Math.log10(L), { color: 'muted', size: 12, align: 'left', dy: -10 });
          const sl = (arr) => { const p = []; for (let k = lg ? 1 : 0; k <= i; k++) p.push([D.t[k], arr[k]]); return p; };
          sL.path(sl(D.ls), { color: 'blue', width: 2.2 });
          sL.path(sl(D.lb), { color: 'green', width: 2, dash: [6, 4] });
          if (orb.value === 'chaos' && D.fit && !lg && D.fx.length && tau > D.fx[D.fx.length - 1]) sL.fn((x) => D.fit.intercept + D.fit.slope * x, { color: 'red', width: 1.6, domain: [0, Math.min(TT, (Math.log10(L) + 1 - D.fit.intercept) / D.fit.slope)] });
          if (orb.value === 'reg' && lg) sL.fn((x) => D.pow.intercept + D.pow.slope * Math.log10(x), { color: 'red', width: 1.6, domain: [10, TT] });
          sL.vline(D.t[i], { color: 'gold', width: 1.2 });
          // twins
          sX.contour(hhV, [E], { color: 'muted', width: 1.3, res: 120 });
          const a0 = Math.max(0, i - 160);
          sX.path(D.pa.slice(a0, i + 1), { color: 'blue', width: 1.6, alpha: 0.8 });
          sX.path(D.pb.slice(a0, i + 1), { color: 'red', width: 1.6, alpha: 0.8 });
          sX.dot(D.pa[i][0], D.pa[i][1], { r: 5, color: 'blue' }); sX.dot(D.pb[i][0], D.pb[i][1], { r: 5, color: 'red' });
          sX.corner(`t = ${v.fix(D.t[i], 0)}`, 'tr', { color: 'ink', plate: true });
          cur = { D, i };
        }, { period: TT / 34 + 2.5, still: 13 });
        v.legend([['blue', 'separation of the twin orbits'], ['green', 'renormalised tangent vector (Benettin)', { dash: true }], ['red', 'fit: slope = λ / ln 10 (or power law)']]);
        v.readout(() => {
          if (!cur) return '';
          const { D } = cur, chaos = orb.value === 'chaos';
          if (chaos) {
            const lf = D.fit ? D.fit.slope * Math.LN10 : NaN, lam = isFinite(lf) ? lf : D.lamB, tstar = Math.log(L / D.d0) / lam;
            return String.raw`Lyapunov exponent: slope of the fit ${num(v, lf, 3)}, Benettin over $t = ${TT}$: ${v.fix(D.lamB, 3)} · Lyapunov time $1/\lambda = ${v.fix(1 / lam, 1)}$ · predicted horizon $t_* = \ln(L/\delta_0)/\lambda = ${v.fix(tstar, 0)}$ for $L = ${L}$; measured ${isFinite(D.tHit) ? v.fix(D.tHit, 0) : 'beyond the window'}`;
          }
          return String.raw`regular torus: Benettin estimate ${v.fix(D.lamB, 4)} (it decays like $\ln t / t$ toward 0) · separation grew by a factor ${v.fix(10 ** (D.ls[D.ls.length - 1] - D.ls[0]), 1)} in $t = ${TT}$ · on the log–log plot its growth exponent is ${v.fix(D.pow.slope, 2)} (linear growth = 1)`;
        });
      },
    },
  ],
};
