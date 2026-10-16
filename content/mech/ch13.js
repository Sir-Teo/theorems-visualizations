// Classical Mechanics — Chapter 13: Nonlinear dynamics and chaos (part a: 13.1–13.8)

import { TAU, DEG, clamp, memo, sci, num, wrap, wrap0, progressive, now, fastDots, fitLine, stdOrbit, symOrbit, residueChain, FIB, PELL, hhV, hhStep, hhStepT, hhE, hhSeed, hhSection, hhFTLE, hhPyMax, hhYRange, piTicks } from './ch13.shared.js';

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
  ],
};
